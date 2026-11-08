// Synthetic traffic through the real server, bridge, JSONL reader, WS and UI Model.
// These tests do not claim that an authenticated Codex/Kimi CLI has been run.
import { test } from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import { spawn } from 'node:child_process';import { once } from 'node:events';import http from 'node:http';import WebSocket from 'ws';import { Model } from '../public/model.js';
const waitFor=async(f,ms=8000)=>{const end=Date.now()+ms;while(Date.now()<end){const v=f();if(v)return v;await new Promise(r=>setTimeout(r,20));}throw new Error('Timed out waiting for synthetic pipeline state');};
test('real local pipeline: dynamic port, two providers, privacy, waiting, reconnect and completion', {timeout:25000},async t=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'pixel-e2e-'));
 const occupied=http.createServer((q,r)=>r.end('foreign'));await new Promise(r=>occupied.listen(0,'127.0.0.1',r));
 const env={...process.env,PIXEL_OFFICE_HOME:path.join(temp,'office'),CODEX_HOME:path.join(temp,'codex'),CLAUDE_PROJECTS_DIR:path.join(temp,'claude-projects'),CLAUDE_SESSIONS_DIR:path.join(temp,'claude-sessions'),GEMINI:'0',ANTIGRAVITY:'0',OPENCODE:'0',PORT:String(occupied.address().port),PIXEL_OFFICE_OFFLINE:'1'};
 const child=spawn(process.execPath,['server.js'],{cwd:new URL('..',import.meta.url),env,stdio:['ignore','pipe','pipe']});let log='';child.stdout.on('data',c=>log+=c);child.stderr.on('data',c=>log+=c);const sockets=[];
 t.after(async()=>{for(const s of sockets)s.terminate();child.kill();await once(child,'exit').catch(()=>{});occupied.close();fs.rmSync(temp,{recursive:true,force:true});});
 const runtime=await waitFor(()=>{try{return JSON.parse(fs.readFileSync(path.join(env.PIXEL_OFFICE_HOME,'bridge.json'),'utf8'));}catch{if(child.exitCode!=null)throw new Error(log);return null;}});
 assert.notEqual(runtime.port,occupied.address().port);
 const model=new Model(),events=[],times=[];let ws;
 const connect=async()=>{ws=new WebSocket(`ws://127.0.0.1:${runtime.port}`);sockets.push(ws);ws.on('message',raw=>{const e=JSON.parse(raw);events.push(e);if(e.type==='sessions')model.sessions(e.list);else if(e.agent)model.ingest(e);});await once(ws,'open');};await connect();
 const date=new Date(),dir=path.join(env.CODEX_HOME,'sessions',String(date.getUTCFullYear()),String(date.getUTCMonth()+1).padStart(2,'0'),String(date.getUTCDate()).padStart(2,'0'));fs.mkdirSync(dir,{recursive:true});const file=path.join(dir,'rollout-fixture.jsonl');
 const append=o=>fs.appendFileSync(file,JSON.stringify(o)+'\n');const event=(type,extra={})=>append({type:'event_msg',payload:{type,turn_id:'turn1',...extra}});
 const start=Date.now();append({type:'session_meta',payload:{id:'synthetic-codex',cwd:'/private/project'}});event('task_started');
 append({type:'response_item',payload:{type:'function_call',name:'exec_command',call_id:'c1',arguments:JSON.stringify({cmd:'pytest -q SECRET'})}});
 await waitFor(()=>model.agents.get('codex:synthetic-codex')?.pending.size);times.push(Date.now()-start);
 assert.equal(model.stateOf(model.agents.get('codex:synthetic-codex'),performance.now()),'running');assert.equal(model.currentTool(model.agents.get('codex:synthetic-codex')).testing,true);
 const hook=async(name,extra={})=>{const p=spawn(process.execPath,['kimi/hook-bridge.mjs'],{cwd:new URL('..',import.meta.url),env});let out='',err='';p.stdout.on('data',c=>out+=c);p.stderr.on('data',c=>err+=c);p.stdin.end(JSON.stringify({hook_event_name:name,session_id:'synthetic-kimi',cwd:'/private/project',prompt:'SECRET',...extra}));const [code]=await once(p,'exit');assert.equal(code,0);assert.equal(out+err,'');};
 const kiStart=Date.now();await hook('TurnStarted',{turn_id:'1'});await hook('PreToolUse',{tool_name:'Edit',tool_call_id:'k1',tool_input:{file_path:'SECRET'}});
 const kimi=await waitFor(()=>[...model.agents.values()].find(a=>a.provider==='kimi'&&a.pending.size));times.push(Date.now()-kiStart);assert.equal(model.stateOf(kimi,performance.now()),'typing');assert.equal(model.agents.size,2);
 await hook('PermissionRequest');await waitFor(()=>model.stateOf(kimi,performance.now())==='waiting');await hook('PermissionResult');await waitFor(()=>model.stateOf(kimi,performance.now())==='typing');
 ws.close();await once(ws,'close');await connect();await waitFor(()=>model.agents.get(kimi.id).pending.size===1);
 await hook('PostToolUse',{tool_call_id:'k1'});await hook('Stop');await waitFor(()=>model.stateOf(kimi,performance.now())==='idle');
 event('task_complete');await waitFor(()=>model.stateOf(model.agents.get('codex:synthetic-codex'),performance.now())==='idle');
 assert.ok(!JSON.stringify(events).includes('SECRET'));assert.ok(!JSON.stringify(events).includes('/private'));assert.ok(!log.includes('SECRET'));
 const bad=await fetch(`http://127.0.0.1:${runtime.port}/api/weather/search?q=SECRET`);assert.equal(bad.status,403);
 console.log('Synthetic file/bridge-to-Model latency (ms):',JSON.stringify(times));assert.ok(times.every(n=>n<2000));
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import http from 'node:http'; import { spawn } from 'node:child_process';
import { publishBridge } from '../bridge-runtime.js';
const bridge = new URL('../kimi/hook-bridge.mjs', import.meta.url);
function run(home, input) { return new Promise(resolve => { const p = spawn(process.execPath, [bridge.pathname], { env: { ...process.env, PIXEL_OFFICE_HOME: home } });
 let out='',err='';p.stdout.on('data', c=>out+=c);p.stderr.on('data',c=>err+=c);p.on('exit',code=>resolve({code,out,err}));p.stdin.on('error',()=>{});p.stdin.end(input); }); }
test('bridge verifies loopback identity, filters data, fails open (synthetic)', async t => {
 const home=fs.mkdtempSync(path.join(os.tmpdir(),'pixel-bridge-'));let runtime,received=[];
 const s=http.createServer((req,res)=>{if(req.url==='/api/bridge') return res.end(JSON.stringify(runtime));let b='';req.on('data',c=>b+=c);req.on('end',()=>{received.push(JSON.parse(b));res.end('{"ok":true}');});});
 await new Promise(r=>s.listen(0,'127.0.0.1',r));const published=publishBridge(s.address().port,home);runtime=published.runtime;
 t.after(()=>{s.close();published.cleanup();fs.rmSync(home,{recursive:true,force:true});});
 const input=JSON.stringify({hook_event_name:'PreToolUse',session_id:'private-session',tool_call_id:'id',tool_name:'Bash',cwd:'C:\\private\\project',tool_input:{command:'npm test'},prompt:'SECRET',tool_output:'SECRET'});
 assert.deepEqual(await run(home,input),{code:0,out:'',err:''});assert.equal(received.length,1);assert.equal(received[0].testing,true);assert.ok(!JSON.stringify(received).includes('SECRET'));assert.ok(!JSON.stringify(received).includes('private'));
 runtime={...runtime,instance:'wrong'};assert.equal((await run(home,input)).code,0);assert.equal(received.length,1);
 await new Promise(r=>s.close(r));assert.deepEqual(await run(home,input),{code:0,out:'',err:''});assert.deepEqual(await run(home,'bad json'),{code:0,out:'',err:''});
});

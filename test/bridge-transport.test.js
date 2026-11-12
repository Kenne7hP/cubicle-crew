import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import http from 'node:http'; import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { configure } from '../kimi/hooks-cli.mjs';
import { parse } from 'smol-toml';
import { publishBridge } from '../bridge-runtime.js';
const bridge = new URL('../kimi/hook-bridge.mjs', import.meta.url);
function run(home, input, command) { return new Promise((resolve, reject) => { const p = command
 ? spawn(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', `"${command}"`], { env: { ...process.env, PIXEL_OFFICE_HOME: home }, windowsHide: true, windowsVerbatimArguments: true })
 : spawn(process.execPath, [fileURLToPath(bridge)], { env: { ...process.env, PIXEL_OFFICE_HOME: home } });
 p.on('error', reject);
 let out='',err='';p.stdout.on('data', c=>out+=c);p.stderr.on('data',c=>err+=c);p.on('exit',code=>resolve({code,out,err}));p.stdin.on('error',()=>{});p.stdin.end(input); }); }
test('bridge verifies loopback identity, filters data, fails open (synthetic)', { timeout: 10000 }, async t => {
 const home=fs.mkdtempSync(path.join(os.tmpdir(),"pixel bridge 中文 O'Brien "));let runtime,received=[],expected=1;
 const s=http.createServer((req,res)=>{if(req.url==='/api/bridge') return res.end(JSON.stringify(runtime));let b='';req.on('data',c=>b+=c);req.on('end',()=>{received.push(JSON.parse(b));res.end('{"ok":true}');});});
 await new Promise(r=>s.listen(0,'127.0.0.1',r));const published=publishBridge(s.address().port,home);runtime=published.runtime;
 t.after(()=>{s.close();published.cleanup();fs.rmSync(home,{recursive:true,force:true});});
 const input=JSON.stringify({hook_event_name:'PreToolUse',session_id:'private-session',tool_call_id:'id',tool_name:'Bash',cwd:'C:\\private\\project',tool_input:{command:'npm test'},prompt:'SECRET',tool_output:'SECRET'});
 assert.deepEqual(await run(home,input),{code:0,out:'',err:''});assert.equal(received.length,1);assert.equal(received[0].testing,true);assert.ok(!JSON.stringify(received).includes('SECRET'));assert.ok(!JSON.stringify(received).includes('private'));
 if (process.platform === 'win32') {
  const file = path.join(home, 'config.toml');
  configure('install', { home, file });
  const { command } = parse(fs.readFileSync(file, 'utf8')).hooks[0];
  const started = performance.now();
  assert.deepEqual(await run(home,input,command),{code:0,out:'',err:''});
  console.log('Windows generated hook command elapsed (ms):', Math.round(performance.now() - started));
  assert.equal(received.length,2);
  expected=2;
 }
 runtime={...runtime,instance:'wrong'};assert.equal((await run(home,input)).code,0);assert.equal(received.length,expected);
 await new Promise(r=>s.close(r));assert.deepEqual(await run(home,input),{code:0,out:'',err:''});assert.deepEqual(await run(home,'bad json'),{code:0,out:'',err:''});
});

import { test } from 'node:test';import assert from 'node:assert/strict';
import { External } from '../external.js';import { normalizeHook } from '../kimi/normalize.mjs';
test('Kimi contract: lifecycle, parallel calls, waiting, errors and heartbeat (synthetic)',t=>{
 const events=[];const e=new External({emit:x=>events.push(x),changed:()=>{}});t.after(()=>clearInterval(e.timer));
 const hook=(name,extra={})=>e.ingest({hook_event_name:name,session_id:'s',cwd:'/private/project',...extra},'kimi');
 hook('SessionStart');assert.equal(e.list()[0].status,'unknown');hook('SessionHeartbeat');assert.equal(e.list()[0].status,'unknown');
 hook('TurnStarted',{turn_id:'1'});assert.equal(e.list()[0].status,'busy');
 hook('PreToolUse',{tool_name:'Read',tool_call_id:'a'});hook('PreToolUse',{tool_name:'Edit',tool_call_id:'b'});hook('PreToolUse',{tool_name:'Edit',tool_call_id:'b'});
 assert.equal(e.list()[0].tools.length,2);assert.equal(events.filter(x=>x.type==='tool_start').length,2);
 hook('PostToolUse',{tool_call_id:'a'});assert.equal(e.list()[0].tools.length,1);
 hook('PermissionRequest');assert.equal(e.list()[0].status,'waiting');hook('SessionHeartbeat');assert.equal(e.list()[0].status,'waiting');
 hook('PermissionResult');assert.equal(e.list()[0].status,'busy');
 hook('PostToolUseFailure',{tool_call_id:'b',error_message:'SECRET'});assert.equal(events.at(-1).outcome,'error');assert.equal(e.list()[0].status,'busy');
 hook('Stop');assert.equal(e.list()[0].status,'idle');assert.equal(events.at(-1).outcome,'success');assert.equal(events.at(-1).confidence,'inferred');
 hook('Stop');assert.equal(events.filter(x=>x.outcome==='success').length,1);hook('SessionHeartbeat');assert.equal(e.list()[0].status,'idle');
 hook('TurnStarted',{turn_id:'2'});hook('Interrupt');assert.equal(events.at(-1).type,'turn_interrupted');hook('SessionEnd');assert.equal(e.list().length,0);
 assert.ok(!JSON.stringify(events).includes('SECRET'));assert.ok(!JSON.stringify(events).includes('/private'));
});
test('late and unmatched completions cannot close an unrelated call or resurrect a finished call',()=>{
 const e=new External({emit:()=>{},changed:()=>{}});const send=(type,id)=>e.ingest({provider:'kimi',agent:'s',type,id});
 send('tool_end','late');send('tool_start','late');assert.equal(e.list()[0].tools.length,0);
 send('tool_start','a');send('tool_start','b');send('tool_end');assert.equal(e.list()[0].tools.length,2);
 send('tool_end','a');assert.equal(e.list()[0].tools[0].id,'b');clearInterval(e.timer);
});
test('unknown events and names are safely ignored or generic',()=>{
 assert.equal(normalizeHook({hook_event_name:'Unknown',session_id:'x'}),null);
 assert.equal(normalizeHook({hook_event_name:'PreToolUse',session_id:'x',tool_name:'SECRET_TOOL_NAME'}).tool,'Tool');
});

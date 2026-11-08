import { test } from 'node:test';import assert from 'node:assert/strict';import { Model } from '../public/model.js';import { ObservedSessions } from '../observed-sessions.js';
test('observed UI holds long thinking, waits for permission, completes without time-based celebration',()=>{
 const m=new Model(),a='codex:ui';let celebrations=0;m.on('celebrate',()=>celebrations++);
 const send=(e,n)=>m.ingest({agent:a,provider:'codex',...e},n);
 send({type:'turn_start'},100);assert.equal(m.stateOf(m.agents.get(a),30000),'thinking');
 send({type:'tool_start',id:'t',tool:'Read'},30100);assert.equal(m.stateOf(m.agents.get(a),30200),'reading');
 send({type:'waiting',reason:'permission'},30300);send({type:'tool_end',tool_use_id:'t'},30400);assert.equal(m.stateOf(m.agents.get(a),30500),'waiting');
 send({type:'permission_resolved'},30600);assert.equal(m.stateOf(m.agents.get(a),30700),'thinking');
 send({type:'turn_interrupted'},30800);m.tick(31000);assert.equal(m.stateOf(m.agents.get(a),31000),'idle');assert.equal(celebrations,0);
 send({type:'turn_start'},32000);send({type:'turn_complete'},33000);send({type:'outcome',outcome:'success'},33001);assert.equal(celebrations,1);
});
test('reconnect snapshot preserves tool pose, concurrent providers remain separate',()=>{
 const m=new Model();m.sessions([{agent:'kimi:a',label:'p',provider:'kimi',status:'busy',confidence:'observed',tools:[{id:'t',tool:'Edit'}]},
 {agent:'codex:a',label:'p',provider:'codex',status:'unknown',confidence:'unknown',tools:[]}],100);
 assert.equal(m.agents.size,2);assert.equal(m.stateOf(m.agents.get('kimi:a'),30000),'typing');assert.equal(m.stateOf(m.agents.get('codex:a'),30000),'idle');assert.equal(m.agents.get('codex:a').uncertain,true);
});

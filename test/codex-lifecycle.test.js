import { test } from 'node:test';
import assert from 'node:assert/strict';
import { codexLine, projectName, isTestCommand } from '../providers.js';
import { ObservedSessions } from '../observed-sessions.js';
test('Codex lifecycle aliases, errors and interruption (synthetic)', () => {
  const events = [], states = new ObservedSessions({ emit: e => events.push(e), now: () => 1000 });
  const line = p => codexLine('/tmp/rollout-fixture.jsonl', JSON.stringify({ type: 'event_msg', payload: p }), e => states.ingest(e), () => {});
  line({ type: 'task_started', turn_id: '1' });
  assert.equal(states.list(21000)[0].status, 'busy');
  line({ type: 'task_complete', turn_id: '1' });
  assert.equal(states.list()[0].status, 'idle'); assert.equal(events.at(-1).outcome, 'success');
  line({ type: 'turn_started', turn_id: '2' }); line({ type: 'turn_complete', turn_id: '2', error: { message: 'secret' } });
  assert.equal(events.at(-1).outcome, 'error'); assert.ok(!JSON.stringify(events).includes('secret'));
  line({ type: 'turn_started', turn_id: '3' }); line({ type: 'turn_aborted', turn_id: '3' });
  assert.equal(events.at(-1).type, 'turn_interrupted');
});
test('bounded restored state and stale state are honest unknown, not success', () => {
  const s = new ObservedSessions({ now: () => 1000 });
  s.ingest({ agent: 'codex:a', provider: 'codex', type: 'turn_start' }, { silent: true, restored: true });
  assert.equal(s.list()[0].status, 'unknown');
  s.ingest({ agent: 'codex:a', provider: 'codex', type: 'turn_start', turn_id: 'new' });
  assert.equal(s.list()[0].status, 'busy');
  assert.equal(s.list(601001)[0].status, 'unknown'); assert.equal(s.list(3601001).length, 0);
});
test('cross-platform project basename and local testing classification', () => {
  assert.equal(projectName('C:\\work\\hello'), 'hello');
  assert.ok(isTestCommand('npm run test:unit')); assert.ok(isTestCommand('pytest -q'));
  assert.ok(!isTestCommand('echo npm test'));
});

test('Codex explicit question tool is observable waiting, not inferred approval',()=>{
 const s=new ObservedSessions();const emit=e=>s.ingest(e);const file='/tmp/question-fixture.jsonl';
 codexLine(file,JSON.stringify({type:'response_item',payload:{type:'function_call',name:'request_user_input',call_id:'question1',arguments:'{}'}}),emit,()=>{});
 assert.equal(s.list()[0].status,'waiting');assert.equal(s.list()[0].waitingFor,'question');
 codexLine(file,JSON.stringify({type:'response_item',payload:{type:'function_call_output',call_id:'question1',output:'private'}}),emit,()=>{});
 assert.equal(s.list()[0].status,'busy');
});

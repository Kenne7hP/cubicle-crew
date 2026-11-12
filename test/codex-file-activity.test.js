import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import WebSocket from 'ws';

const root = fileURLToPath(new URL('..', import.meta.url));
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function waitFor(check) {
  const until = Date.now() + 8000;
  while (Date.now() < until) {
    const result = check();
    if (result) return result;
    await pause(40);
  }
  throw new Error('Timed out waiting for synthetic stale-mtime session');
}

test('Codex files with unchanged old mtime recover and wake on growth (synthetic)', { timeout: 25000 }, async t => {
  const runtimeRoot = path.join(root, 'local-runtime');
  fs.mkdirSync(runtimeRoot, { recursive: true });
  const run = fs.mkdtempSync(path.join(runtimeRoot, 'file-activity-'));
  const env = { ...process.env, PIXEL_OFFICE_HOME: path.join(run, 'office'),
    CODEX_HOME: path.join(run, 'codex'), CLAUDE_PROJECTS_DIR: path.join(run, 'claude'),
    CLAUDE_SESSIONS_DIR: path.join(run, 'sessions'), GEMINI: '0', ANTIGRAVITY: '0',
    OPENCODE: '0', PIXEL_OFFICE_OFFLINE: '1', PORT: '0' };
  const dir = path.join(env.CODEX_HOME, 'sessions', '2020', '01', '01');
  fs.mkdirSync(dir, { recursive: true });
  const old = new Date(Date.now() - 2 * 86400000);
  function append(file, row, timestamp = new Date().toISOString()) {
    fs.appendFileSync(file, JSON.stringify({ timestamp, ...row }) + '\n');
    fs.utimesSync(file, old, old);
  }
  const running = path.join(dir, 'rollout-running.jsonl');
  append(running, { type: 'session_meta', payload: { id: 'fixture-running', cwd: '/fixture' } });
  append(running, { type: 'event_msg', payload: { type: 'task_started', turn_id: 'one' } });
  const dormant = path.join(dir, 'rollout-dormant.jsonl');
  append(dormant, { type: 'session_meta', payload: { id: 'fixture-dormant', cwd: '/fixture' } }, old.toISOString());
  append(dormant, { type: 'event_msg', payload: { type: 'task_complete', turn_id: 'old' } }, old.toISOString());
  const child = spawn(process.execPath, ['--input-type=module', '-e',
    "import('./server.js').then(server => server.startServer(0, { reuse: false }))"],
  { cwd: root, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let errors = '';
  child.stdout.resume();
  child.stderr.on('data', chunk => errors += chunk);
  let ws;
  t.after(async () => {
    ws?.terminate();
    if (child.exitCode === null && child.signalCode === null) {
      const exited = once(child, 'exit');
      child.kill();
      await exited;
    }
    // Retain synthetic artifacts under local-runtime per project instructions.
  });
  const bridge = await waitFor(() => {
    if (child.exitCode !== null) throw new Error(`Synthetic server exited: ${errors}`);
    try { return JSON.parse(fs.readFileSync(path.join(env.PIXEL_OFFICE_HOME, 'bridge.json'), 'utf8')); }
    catch { return null; }
  });
  let sessions = [];
  const emitted = [];
  ws = new WebSocket(`ws://127.0.0.1:${bridge.port}`);
  ws.on('message', raw => {
    const message = JSON.parse(raw);
    if (message.type === 'sessions') sessions = message.list;
    else if (message.agent) emitted.push(message);
  });
  await once(ws, 'open');
  const current = () => sessions.find(s => s.agent === 'codex:fixture-running');
  await waitFor(current);
  assert.equal(current().status, 'unknown');
  assert.equal(current().restored, true);
  assert.equal(sessions.some(s => s.agent === 'codex:fixture-dormant'), false);
  assert.equal(emitted.length, 0, 'startup recovery must not replay history');
  append(running, { type: 'response_item', payload: {
    type: 'function_call', name: 'exec_command', call_id: 'test', arguments: '{"cmd":"npm test"}',
  } });
  await waitFor(() => current()?.status === 'busy' && current().tools.some(tool => tool.id === 'test'));
  await pause(2500); // Stay tracked across a full scan despite the old mtime.
  append(running, { type: 'event_msg', payload: { type: 'task_complete', turn_id: 'one' } });
  await waitFor(() => current()?.status === 'idle');
  append(dormant, { type: 'event_msg', payload: { type: 'task_started', turn_id: 'new' } });
  await waitFor(() => sessions.some(s => s.agent === 'codex:fixture-dormant' && s.status === 'busy'));
  assert.equal(fs.statSync(running).mtimeMs, old.getTime());
  assert.equal(fs.statSync(dormant).mtimeMs, old.getTime());
});

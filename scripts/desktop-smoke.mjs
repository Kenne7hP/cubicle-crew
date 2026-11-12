// Real Electron renderer + local server; all agent events and paths are synthetic.
// Retain project-local artifacts for review; never touch user CLI configuration.
import { app, BrowserWindow } from 'electron';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

const root = fileURLToPath(new URL('..', import.meta.url));
fs.mkdirSync(path.join(root, 'local-runtime'), { recursive: true });
const run = fs.mkdtempSync(path.join(root, 'local-runtime', 'desktop-smoke-'));
for (const name of ['profile', 'office', 'codex', 'claude-projects', 'claude-sessions']) {
  fs.mkdirSync(path.join(run, name));
}
app.setPath('userData', path.join(run, 'profile'));
Object.assign(process.env, {
  PIXEL_OFFICE_HOME: path.join(run, 'office'), CODEX_HOME: path.join(run, 'codex'),
  CLAUDE_PROJECTS_DIR: path.join(run, 'claude-projects'),
  CLAUDE_SESSIONS_DIR: path.join(run, 'claude-sessions'),
  GEMINI: '0', ANTIGRAVITY: '0', OPENCODE: '0', PIXEL_OFFICE_OFFLINE: '1',
});
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function waitFor(check, label) {
  const end = Date.now() + 10000;
  while (Date.now() < end) {
    if (await check()) return;
    await pause(40);
  }
  throw new Error(`Timed out: ${label}`);
}
const failures = [];
let flushWallet;
const timeout = setTimeout(() => { console.error('Desktop smoke timed out'); app.exit(1); }, 45000);
async function main() {
try {
  await app.whenReady();
  const server = await import('../server.js');
  flushWallet = server.flushWallet;
  const { findNode } = await import('../kimi/hooks-cli.mjs');
  const { port } = await server.startServer(0, { reuse: false });
  const base = `http://127.0.0.1:${port}`;
  const setup = await fetch(`${base}/api/setup`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
  });
  assert.equal((await setup.json()).ok, true);
  const win = new BrowserWindow({
    width: 900, height: 500, show: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false, backgroundThrottling: false },
  });
  win.webContents.on('console-message', details => {
    if (details.level === 'error') failures.push(details.message);
  });
  win.webContents.on('render-process-gone', () => failures.push('renderer exited'));
  await win.loadURL(`${base}/?debug&lang=en`);
  const evaluate = code => win.webContents.executeJavaScript(code);
  await waitFor(() => evaluate('!!window.__model && !!window.__office'), 'renderer initialization');
  const hook = async (name, extra = {}) => {
    const child = spawn(findNode(), [path.join(root, 'kimi', 'hook-bridge.mjs')], {
      env: process.env, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'],
    });
    let output = '';
    child.stdout.on('data', data => output += data);
    child.stderr.on('data', data => output += data);
    child.stdin.end(JSON.stringify({ hook_event_name: name, session_id: 'smoke-kimi', cwd: '/fixture/kimi-demo', ...extra }));
    const [code] = await once(child, 'exit');
    assert.equal(code, 0); assert.equal(output, '');
  };
  const date = new Date();
  const dir = path.join(process.env.CODEX_HOME, 'sessions', String(date.getUTCFullYear()),
    String(date.getUTCMonth() + 1).padStart(2, '0'), String(date.getUTCDate()).padStart(2, '0'));
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'rollout-smoke.jsonl');
  const append = row => fs.appendFileSync(file, JSON.stringify(row) + '\n');
  append({ type: 'session_meta', payload: { id: 'smoke-codex', cwd: '/fixture/codex-demo' } });
  append({ type: 'event_msg', payload: { type: 'task_started', turn_id: 'one' } });
  append({ type: 'response_item', payload: { type: 'function_call', name: 'exec_command', call_id: 'test', arguments: '{"cmd":"npm test"}' } });
  await hook('TurnStarted', { turn_id: 'one' });
  await hook('PreToolUse', { tool_name: 'Edit', tool_call_id: 'edit' });
  const states = () => evaluate(`Array.from(window.__model.agents.values(), a => ({
    provider: a.provider, state: window.__model.stateOf(a, performance.now()),
    testing: !!window.__model.currentTool(a)?.testing
  }))`);
  await waitFor(async () => {
    const s = await states();
    return s.length === 2 && s.some(a => a.provider === 'codex' && a.state === 'running' && a.testing)
      && s.some(a => a.provider === 'kimi' && a.state === 'typing');
  }, 'two independent working characters');
  const working = await states();
  await pause(2500); // Allow both characters to reach their desks before capture.
  async function capture(name) {
    const image = await win.webContents.capturePage();
    assert.equal(image.isEmpty(), false);
    fs.writeFileSync(path.join(run, name + '.png'), image.toPNG());
  }
  await capture('working');
  await hook('PermissionRequest');
  await waitFor(async () => (await states()).some(a => a.provider === 'kimi' && a.state === 'waiting'), 'permission waiting');
  const waiting = await states();
  await capture('waiting');
  await hook('PermissionResult');
  await hook('PostToolUse', { tool_call_id: 'edit' });
  await hook('Stop');
  append({ type: 'event_msg', payload: { type: 'task_complete', turn_id: 'one' } });
  await waitFor(async () => (await states()).every(a => a.state === 'idle'), 'completion');
  await capture('completed');
  assert.deepEqual(failures, []);
  const report = { result: 'PASS', mode: 'real Electron, synthetic agent events',
    electron: process.versions.electron, platform: process.platform, working, waiting, completed: await states(), rendererErrors: failures.length };
  fs.writeFileSync(path.join(run, 'result.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ...report, artifacts: run }));
  flushWallet(); clearTimeout(timeout); app.exit(0);
} catch (error) {
  console.error(error.stack); flushWallet?.(); clearTimeout(timeout); app.exit(1);
}
}
void main();

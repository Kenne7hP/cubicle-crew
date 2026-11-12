import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';
import { parse } from 'smol-toml';
import { EVENTS } from './normalize.mjs';
const BEGIN = '# BEGIN pixel-office-kimi managed hooks';
const END = '# END pixel-office-kimi managed hooks';
const validate = text => { try { return parse(text); } catch { throw new Error('Invalid or conflicting TOML; configuration was not changed.'); } };
const digest = text => createHash('sha256').update(text).digest('hex');
export const configFile = () => path.join(process.env.KIMI_CODE_HOME || path.join(os.homedir(), '.kimi-code'), 'config.toml');
export function hookCommand(node, bridge, platform = process.platform) {
  if (platform === 'win32') {
    if (/[\r\n%"!]/.test(node + bridge)) throw new Error('Unsupported characters in Windows helper paths.');
    const ps = s => "'" + s.replaceAll("'", "''") + "'";
    return `powershell.exe -NoProfile -NonInteractive -Command "& ${ps(node)} ${ps(bridge)}"`;
  }
  const q = s => "'" + s.replaceAll("'", "'\\''") + "'";
  return `${q(node)} ${q(bridge)}`;
}
export function findNode() {
  if (!process.versions.electron) return process.execPath;
  for (const dir of (process.env.PATH || '').split(path.delimiter)) {
    const file = path.join(dir, process.platform === 'win32' ? 'node.exe' : 'node');
    if (fs.existsSync(file)) return file;
  }
  throw new Error('Install Node.js 22+ and restart the desktop app to enable Kimi integration.');
}
function managed(text) {
  const start = text.indexOf(BEGIN), end = text.indexOf(END);
  if (start < 0 && end < 0) return null;
  if (start < 0 || end < start || text.indexOf(BEGIN, start + BEGIN.length) >= 0 || text.indexOf(END, end + END.length) >= 0)
    throw new Error('Managed Kimi hooks are damaged; no configuration was changed.');
  const body = text.slice(start + BEGIN.length + 1, end);
  const match = /^# prefix-newline: ([01])\n# sha256: ([a-f0-9]{64})\n([\s\S]*)$/.exec(body);
  if (!match || digest(match[3]) !== match[2]) throw new Error('Managed hook content changed; refusing to overwrite it.');
  const stop = end + END.length + (text[end + END.length] === '\n' ? 1 : 0);
  return { start: start - Number(match[1]), stop, payload: match[3] };
}
export function configure(action, { file = configFile(), home = process.env.PIXEL_OFFICE_HOME || path.join(os.homedir(), '.pixel-office'), node, platform = process.platform } = {}) {
  if (!['install','uninstall','status'].includes(action)) throw new Error('Use install, status, or uninstall.');
  const exists = fs.existsSync(file), original = exists ? fs.readFileSync(file, 'utf8') : '';
  validate(original); const block = managed(original);
  if (action === 'status') return { installed: !!block, file };
  if (action === 'uninstall' && !block) return { changed: false, installed: false, file };
  let output;
  if (action === 'install') {
    const helper = path.join(home, 'kimi-helper'); fs.mkdirSync(helper, { recursive: true, mode: 0o700 });
    // Copies are ordinary files, readable by external Node even when the app lives in asar.
    for (const name of ['hook-bridge.mjs','normalize.mjs']) {
      const tmp = path.join(helper, name + '.tmp-' + process.pid);
      fs.copyFileSync(new URL(name, import.meta.url), tmp); fs.renameSync(tmp, path.join(helper, name));
    }
    const command = hookCommand(node || findNode(), path.join(helper,'hook-bridge.mjs'), platform);
    // Native Windows PowerShell startup exceeded one second in the local smoke test.
    const timeout = platform === 'win32' ? 2 : 1;
    const payload = EVENTS.map(event => `[[hooks]]\nevent = ${JSON.stringify(event)}\ncommand = ${JSON.stringify(command)}\ntimeout = ${timeout}\n`).join('\n');
    if (block && block.payload === payload) return { changed: false, installed: true, file };
    if (block) throw new Error('Existing integration uses another path. Uninstall it before reinstalling.');
    const prefix = original.length > 0 && !original.endsWith('\n') ? '\n' : '';
    output = original + prefix + BEGIN + `\n# prefix-newline: ${prefix.length}\n# sha256: ${digest(payload)}\n` + payload + END + '\n';
  } else output = original.slice(0,block.start) + original.slice(block.stop);
  validate(output); // catches inline hooks arrays, duplicate keys, and malformed existing TOML
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  if ((fs.existsSync(file) ? fs.readFileSync(file,'utf8') : '') !== original) throw new Error('Configuration changed concurrently; retry.');
  const backup = file + '.pixel-office-' + randomUUID() + '.bak';
  if (exists) fs.writeFileSync(backup, original, { mode: 0o600, flag: 'wx' });
  const tmp = file + '.pixel-office-' + randomUUID() + '.tmp';
  try {
    fs.writeFileSync(tmp, output, { mode: exists ? fs.statSync(file).mode & 0o777 : 0o600, flag: 'wx' });
    if ((fs.existsSync(file) ? fs.readFileSync(file,'utf8') : '') !== original) throw new Error('Configuration changed concurrently; retry.');
    fs.renameSync(tmp,file);
  } finally { try { fs.unlinkSync(tmp); } catch {} }
  return { changed: true, installed: action === 'install', file, backup: exists ? backup : undefined };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(configure(process.argv[2] || 'status'))); }
  catch (e) { console.error(e.message); process.exitCode = 1; }
}

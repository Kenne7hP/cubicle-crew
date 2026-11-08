import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
export const bridgeHome = () => process.env.PIXEL_OFFICE_HOME || path.join(os.homedir(), '.pixel-office');
export function publishBridge(port, home = bridgeHome()) {
  const runtime = { host: '127.0.0.1', port, pid: process.pid, started_at: Date.now(), instance: randomUUID() };
  fs.mkdirSync(home, { recursive: true, mode: 0o700 });
  const file = path.join(home, 'bridge.json'), tmp = file + '.' + process.pid + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(runtime), { mode: 0o600 }); fs.renameSync(tmp, file);
  const cleanup = () => { try { if (JSON.parse(fs.readFileSync(file, 'utf8')).instance === runtime.instance) fs.unlinkSync(file); } catch {} };
  process.once('exit', cleanup);
  return { runtime, cleanup };
}

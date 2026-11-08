// Observe only: never write stdout/stderr or return a decision to Kimi.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { normalizeHook } from './normalize.mjs';
const limit = 1024 * 1024;
const deadline = setTimeout(() => process.exit(0), 700); deadline.unref();
function request(runtime, pathname, data) {
  return new Promise(resolve => {
    const req = http.request({ host: '127.0.0.1', port: runtime.port, path: pathname, method: data ? 'POST' : 'GET',
      agent: false, timeout: 150, headers: data ? { 'Content-Type': 'application/json' } : {} }, res => {
      let body = ''; res.on('data', c => { body += c; if (body.length > 4096) req.destroy(); });
      res.on('end', () => { try { resolve(res.statusCode === 200 ? JSON.parse(body) : null); } catch { resolve(null); } });
    });
    req.on('timeout', () => req.destroy()); req.on('error', () => resolve(null)); req.end(data ? JSON.stringify(data) : undefined);
  });
}
try {
  const chunks = []; let size = 0;
  for await (const c of process.stdin) { size += c.length; if (size > limit) process.exit(0); chunks.push(c); }
  const event = normalizeHook(JSON.parse(Buffer.concat(chunks).toString('utf8')));
  if (event) {
    const dir = path.dirname(fileURLToPath(import.meta.url));
    const home = process.env.PIXEL_OFFICE_HOME || (path.basename(dir) === 'kimi-helper' ? path.dirname(dir) : path.join(os.homedir(), '.pixel-office'));
    const file = path.join(home, 'bridge.json');
    if (fs.statSync(file).size > 4096) process.exit(0);
    const runtime = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (runtime.host === '127.0.0.1' && Number.isInteger(runtime.port) && runtime.port > 0 && runtime.port < 65536 && typeof runtime.instance === 'string') {
      // No event data is sent to a stale/reused port before the server proves its instance.
      const identity = await request(runtime, '/api/bridge');
      if (identity?.instance === runtime.instance && identity?.pid === runtime.pid)
        await request(runtime, '/api/event?from=kimi', event);
    }
  }
} catch { /* fail open, including malformed stdin and absent monitor */ }
clearTimeout(deadline);

// Isolated, synthetic end-to-end validation using the real desktop entry point and IPC.
import { app, BrowserWindow } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const run = fs.mkdtempSync(path.join(root, 'local-runtime', 'mini-smoke-'));
for (const name of ['profile', 'office', 'codex', 'claude', 'sessions']) fs.mkdirSync(path.join(run, name));
app.commandLine.appendSwitch('user-data-dir', path.join(run, 'profile'));
app.setPath('userData', path.join(run, 'profile'));
fs.writeFileSync(path.join(run, 'profile', 'settings.json'), JSON.stringify({
  waitWindow: false, strip: false, autoHide: false, notify: false, onTop: false,
  bounds: { x: 100, y: 100, width: 712, height: 364 }, baseSize: { w: 712, h: 364 },
}));
Object.assign(process.env, { PIXEL_OFFICE_HOME: path.join(run, 'office'), CODEX_HOME: path.join(run, 'codex'),
  CLAUDE_PROJECTS_DIR: path.join(run, 'claude'), CLAUDE_SESSIONS_DIR: path.join(run, 'sessions'),
  GEMINI: '0', ANTIGRAVITY: '0', OPENCODE: '0', PIXEL_OFFICE_OFFLINE: '1', PORT: '14327' });
const pause = ms => new Promise(r => setTimeout(r, ms));
const errors = [];
const timeout = setTimeout(() => { console.error('Mini smoke timed out'); app.exit(1); }, 60000);
async function until(check, label) {
  for (let i = 0; i < 150; i++) { if (await check()) return; await pause(50); }
  throw new Error(`Timed out: ${label}`);
}
async function main() {
  try {
    app.on('web-contents-created', (_, wc) => wc.on('console-message', d => {
      if (d.level === 'error') errors.push({ message: d.message, line: d.lineNumber, source: d.sourceId });
    }));
    await import('../electron/main.js');
    await until(() => BrowserWindow.getAllWindows().length, 'desktop window');
    const win = BrowserWindow.getAllWindows()[0];
    await until(() => win.webContents.getURL().startsWith('http') && !win.webContents.isLoading(), 'page');
    const base = new URL(win.webContents.getURL()).origin;
    await fetch(`${base}/api/setup`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    await win.loadURL(`${base}/?desktop&debug&lang=en&time=12:30`);
    win.show();
    const evaluate = s => win.webContents.executeJavaScript(s);
    const seed = async (count = 2) => evaluate(`for (let i=0;i<${count};i++) {
      __model.ingest({ type:'tool_start', agent:'fixture-'+i, provider: i%2 ? 'kimi':'codex',
        label:['Sales','Accounting','Research','Review','Planning','Support','Archive'][i],
        id:'tool-'+i, tool:i%2 ? 'Read':'Edit', detail:'Synthetic validation' });
    }`);
    const capture = async name => {
      await pause(900);
      fs.writeFileSync(path.join(run, name + '.png'), (await win.webContents.capturePage()).toPNG());
    };
    await seed(); await pause(1500);
    assert.equal(await evaluate(`__ui.displayName(__model.agents.get('fixture-0'))`), 'Michael Scott');
    assert.equal(await evaluate(`__ui.displayName(__model.agents.get('fixture-1'))`), 'Jim Halpert');
    const castIdentity = await evaluate(`__office.live().map(a => [a.crewKey, __office.nameOf(a.crewKey), a.look.hair, a.look.shirt])`);
    await evaluate(`const style=document.createElement('style'); style.textContent='#debug,#perf,#toast{display:none!important}'; document.head.append(style);`);
    const original = win.getBounds();
    await capture('office');
    await evaluate(`document.getElementById('office-mode').click()`); await pause(1200);
    const mini = win.getBounds();
    assert.ok(mini.width < original.width, 'Native window shrinks');
    assert.equal(await evaluate('__office.L.mini'), true);
    assert.equal(await evaluate('__model.agents.size'), 2);
    assert.ok(await evaluate(`__office.live().every(a => a.mode === 'seated' && a.path.length === 0)`));
    await capture('mini');
    // State transitions still propagate, and old thinking/idle states never trigger walking.
    await evaluate(`__model.ingest({type:'waiting',agent:'fixture-0',provider:'codex'});`);
    await pause(250);
    assert.equal(await evaluate(`__office.actors.get('fixture-0').vstate`), 'waiting');
    assert.equal(await evaluate(`__office.actors.get('fixture-0').shirtColor(performance.now())`), '#424b5a', 'Outfit survives state change');
    await evaluate(`__model.ingest({type:'turn_complete',agent:'fixture-1',provider:'kimi'});`);
    await pause(250);
    assert.equal(await evaluate(`__office.actors.get('fixture-1').vstate`), 'idle');
    await evaluate(`for(const a of __office.live()) { a.agent.stateSince=performance.now()-60000; __office.decide(a,performance.now()); }`);
    assert.ok(await evaluate(`__office.live().every(a => !['walk','pace'].includes(a.mode))`));
    await evaluate(`__ui.focus('fixture-0')`);
    await pause(250);
    assert.equal(await evaluate(`document.getElementById('card').hidden`), false);
    assert.ok(await evaluate(`document.getElementById('card').textContent.includes('Sales') && document.getElementById('card').textContent.includes('Michael Scott')`), 'Card retains project and cast identity');
    await evaluate(`__ui.focus(null)`);
    for (let i=0; i<5; i++) {
      await evaluate(`document.getElementById('office-mode').click()`); await pause(300);
      assert.ok(Math.abs(win.getBounds().width - original.width) <= 2, 'Office width restores (DPI rounding)');
      assert.ok(Math.abs(win.getBounds().height - original.height) <= 2, 'Office height restores (DPI rounding)');
      await evaluate(`document.getElementById('office-mode').click()`); await pause(300);
    }
    await win.webContents.reload();
    await until(() => evaluate(`!!window.__office?.L?.mini`).catch(() => false), 'Mini survives reload');
    await evaluate(`const style=document.createElement('style'); style.textContent='#debug,#perf,#toast{display:none!important}'; document.head.append(style);`);
    await seed(7); await pause(1500);
    assert.deepEqual(await evaluate(`__office.live().slice(0,2).map(a => [a.crewKey, __office.nameOf(a.crewKey), a.look.hair, a.look.shirt])`), castIdentity);
    assert.equal(await evaluate('__office.live().length'), 7);
    assert.ok(await evaluate(`__office.live().every(a => a.x >= 0 && a.x < __office.L.W && a.y < __office.L.H && a.path.length === 0)`), 'Overflow actors stay in view');
    assert.equal(await evaluate(`new Set(__office.live().map(a=>a.x+':'+a.y)).size`), 7);
    await capture('mini-overflow');
    await evaluate(`__ui.toggleHelp(true)`); await pause(350);
    await evaluate(`const input=document.querySelector('[data-pref="mini"]'); input.click();`); await pause(600);
    assert.equal(await evaluate('!!__office.L.mini'), false, 'Settings also switches back');
    assert.equal(await evaluate(`new Set(__office.live().map(a=>a.x+':'+a.y)).size`), 7, 'Returning to Office keeps overflow actors apart');
    await evaluate(`import('./prefs.js').then(m => m.prefs.set('dunder', false))`); await pause(250);
    assert.ok(await evaluate('__office.room.windows.length > 0'), 'Original setup can be restored');
    await evaluate(`import('./prefs.js').then(m => m.prefs.set('dunder', true))`);
    await capture('office-populated');
    await evaluate(`import('./prefs.js').then(m => m.prefs.set('officeCast', false))`);
    assert.equal(await evaluate(`__ui.displayName(__model.agents.get('fixture-0'))`), 'Sales');
    assert.equal(await evaluate(`!!__office.actors.get('fixture-0').look.shirt`), false);
    await evaluate(`import('./prefs.js').then(m => m.prefs.set('officeCast', true))`);
    assert.equal(await evaluate(`__ui.displayName(__model.agents.get('fixture-0'))`), 'Michael Scott');
    // Preview every profile using the actual sprite renderer, without real session data.
    const roster = await evaluate(`(async () => {
      const { OFFICE_CAST } = await import('./office-cast.js');
      const { CharacterSprites, avatarLook } = await import('./sprites.js');
      const c = document.createElement('canvas'); c.width=800; c.height=760;
      const g = c.getContext('2d'); g.imageSmoothingEnabled=false;
      g.fillStyle='#eee6ce'; g.fillRect(0,0,800,760);
      g.fillStyle='#304b38'; g.font='bold 26px system-ui'; g.fillText('DUNDER MIFFLIN',28,40);
      g.font='14px system-ui'; g.fillText('The Office · Scranton cast · pixel interpretations',28,65);
      OFFICE_CAST.forEach((p,i) => {
        const x=20+(i%4)*195,y=87+Math.floor(i/4)*165;
        g.fillStyle='#e2dec4'; g.fillRect(x,y,180,151);
        g.fillStyle='#8c9873'; g.fillRect(x+12,y+98,156,23);
        const f=new CharacterSprites(avatarLook(p.av,p.id)).frame('stand',null,p.shirt);
        g.drawImage(f.body,x+54,y+9,72,96); g.drawImage(f.front,x+54,y+9,72,96);
        g.fillStyle='#304b38'; g.font='bold 14px system-ui'; g.textAlign='center';
        g.fillText(p.name,x+90,y+138); g.textAlign='left';
      });
      return c.toDataURL('image/png');
    })()`);
    fs.writeFileSync(path.join(run, 'office-cast.png'), Buffer.from(roster.split(',')[1], 'base64'));
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(run, 'result.json'), JSON.stringify({ original, mini, errors, checks: 'native size, repeat switch, states, details, persistence, overflow, settings, original setup' }, null, 2));
    console.log(JSON.stringify({ ok: true, run, original, mini }));
    clearTimeout(timeout); app.exit(0);
  } catch (e) { console.error(e.stack); console.error(JSON.stringify(errors)); clearTimeout(timeout); app.exit(1); }
}
void main();

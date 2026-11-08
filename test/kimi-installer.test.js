import { test } from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import { parse } from 'smol-toml';import { configure, hookCommand } from '../kimi/hooks-cli.mjs';
test('Kimi installer preserves existing TOML exactly; repeated install/uninstall are no-ops', t => {
 const home=fs.mkdtempSync(path.join(os.tmpdir(),'pixel spaces 中文 ')),file=path.join(home,'config.toml');t.after(()=>fs.rmSync(home,{recursive:true,force:true}));
 for(const original of ['', '# comment\n[[hooks]]\nevent="Stop"\ncommand="user-command"', 'name="hello"\r\n']){
  fs.writeFileSync(file,original);const opts={home,file};assert.equal(configure('install',opts).changed,true);assert.equal(configure('install',opts).changed,false);
  const j=parse(fs.readFileSync(file,'utf8'));assert.equal(j.hooks.length,original.includes('[[hooks]]')?13:12);assert.equal(configure('status',opts).installed,true);
  configure('uninstall',opts);assert.equal(fs.readFileSync(file,'utf8'),original);assert.equal(configure('uninstall',opts).changed,false);
 }
 fs.writeFileSync(file,'hooks = []\n');assert.throws(()=>configure('install',{home,file}));assert.equal(fs.readFileSync(file,'utf8'),'hooks = []\n');
 fs.writeFileSync(file,'broken = [');assert.throws(()=>configure('install',{home,file}));
 fs.writeFileSync(file,'');configure('install',{home,file});const edited=fs.readFileSync(file,'utf8').replace('timeout = 1','timeout = 2');fs.writeFileSync(file,edited);assert.throws(()=>configure('uninstall',{home,file}));assert.equal(fs.readFileSync(file,'utf8'),edited);
});
test('Windows quoting uses PowerShell literal paths and rejects cmd expansion',()=>{
 const c=hookCommand('C:\\Program Files\\node.exe',"C:\\O'Brien\\bridge.mjs",'win32');assert.ok(c.includes("O''Brien"));assert.ok(c.startsWith('powershell.exe'));
 assert.throws(()=>hookCommand('node.exe','C:\\%PATH%\\x','win32'));
});

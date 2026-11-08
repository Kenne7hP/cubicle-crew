# Windows 11

Install Node.js 22+ and your normal Codex / new Kimi Code CLI. Install the NSIS package or use `npm ci` then `npm run desktop` in source. Enable Kimi observation via the tray menu, restart Kimi, and run a small test task. CLI config uses KIMI_CODE_HOME or ~/.kimi-code/config.toml. Hook scripts are copied out of app.asar into ~/.pixel-office/kimi-helper; do not delete these while hooks remain installed.

The generated Windows command invokes PowerShell with literal, quoted Node and helper paths. Paths containing cmd expansion characters are refused rather than producing unsafe commands. Timeout is currently one second; real Windows startup latency is NOT TESTED and may require a two-second budget. HTTP operations are independently limited to 150 ms each and the bridge exits after 700 ms internally.

Build natively with `npm ci && npm run dist:win`. This Linux environment uses `CSC_IDENTITY_AUTO_DISCOVERY=false npm run dist:win -- --config.win.signAndEditExecutable=false`: unsigned, no PE metadata/icon editing. The NSIS installer uses the configured icon, but the app executable may retain Electron metadata. No claim of Windows runtime validation or signing is made.

# Native Windows continuation and validation — 2026-11-08

Historical native Windows report. Machine-specific paths and backup identifiers have been generalized for publication. Subsequent Scranton checks are recorded in [the current report](2026-11-11-scranton-validation-report.md).

## Baseline and scope

Restored the supplied incremental history.bundle against upstream `6e71e32b66952cbf46e8b7db1d84d1415337cc46`. The imported implementation branch is `feat/codex-kimi-live`, tip `548ef2f2db14b57b45aa02a4f7aaf9a760bbb181`. Original archives in Downloads remain unchanged. No remote push or publication occurred.

Environment: Windows 11 x64 (build 26200), Node 24.13.0, npm 11.6.2, Codex CLI 0.144.1, Kimi Code CLI 0.34.0. Final runtime uses the supplied lockfile: Electron 44.7.0, electron-builder 26.15.3, ws 8.22.0, smol-toml 1.9.1. Checked all 286 installed packages represented in that lockfile: zero version mismatches. The lockfile remains unchanged.

The first restricted dependency install failed with EPERM; the first Git fetch failed under restricted networking. Broader execution allowed both. An intermediate installation ignored the lockfile and resolved newer versions; that local tree was subsequently aligned to the supplied lockfile before final validation. Those intermediate results are not the final baseline.

## Changes and root causes

- `test/bridge-transport.test.js`: use `fileURLToPath()` instead of URL.pathname when spawning Node. The old expression yielded an invalid Windows drive prefix and encoded spaces. Execute the generated Windows hook command through cmd.exe/PowerShell under a helper path containing spaces, Chinese characters and an apostrophe; verify silent exit, delivery, identity rejection and fail-open behavior.
- `kimi/hooks-cli.mjs`: generate a two-second Windows hook timeout; retain one second elsewhere. Two observed generated-command invocations took 1,381 ms and 1,355 ms. The old one-second external deadline was shorter than those observed executions. HTTP timeouts and the helper's internal 700 ms deadline are unchanged.
- `test/kimi-installer.test.js`: verify platform-specific generated timeouts; continue refusing modified managed blocks.
- `scripts/desktop-smoke.mjs` and `npm run test:desktop`: repeatable actual Electron renderer/server validation using only synthetic events and project-local profiles, with PNG captures and a JSON result.
- `AGENTS.md`, ignore rules and Windows/README documentation: establish local structure, preserve source history artifacts, exclude local runtime data, and distinguish verified behavior from remaining acceptance.

The preapproval validation changed the bridge test, generated Windows timeout, desktop smoke harness and documentation. User CLI integration was subsequently installed with Ken's explicit approval, as recorded below.

## Results

| Check | Result | Evidence and limit |
|---|---|---|
| Imported Windows baseline | 49 PASS / 1 FAIL | Bridge test invalid Windows path; no product failure inferred from restricted test execution |
| Final Node suite | **50 PASS / 0 FAIL** | `node --test --test-timeout=30000 test/*.test.js`; exact locked dependencies |
| Native generated Windows hook command | **PASS, synthetic input** | Real cmd.exe, PowerShell and Node; special-character helper path; no stdout/stderr |
| Wrong/absent bridge identity and offline monitor | **PASS, synthetic** | No event reaches the wrong instance; malformed input and missing server exit silently |
| Codex JSONL → server → WebSocket → Model | **PASS, synthetic** | Final sample 421 ms |
| Kimi stdin → bridge → server → WebSocket → Model | **PASS, synthetic** | Final sample 273 ms; direct Node bridge, excludes PowerShell startup |
| Generated config accepted by installed Kimi | **PASS, actual doctor / test config** | Kimi 0.34.0; 12 hooks, all timeout=2; isolated KIMI_CODE_HOME |
| Desktop application startup | **PASS, source runtime** | Initial onboarding probe used Electron 44.10.2. After approval, the source app was started with pinned Electron 44.7.0 and its bridge identity verified on port 4317 |
| Actual Electron renderer integration | **PASS, synthetic agent events** | Electron 44.7.0; Codex running+testing, Kimi typing, Kimi waiting, both idle; zero renderer console errors |
| Renderer visual review | **PASS, captured scene** | Inspected working screenshot; both characters and their distinct tool bubbles rendered |
| Mouse / tray / pin / display scaling | **NOT FULLY VALIDATED** | Computer Use screenshot/input coordinates did not match the target window; no manual interaction pass claimed |
| Native NSIS build | **PASS, build only** | `npm run dist:win` with publishing disabled; packaged bridge, normalizer and timeout correction verified |
| Installer signature | **NotSigned** | Get-AuthenticodeSignature; build log signing stages do not establish a trusted signature |
| Install / uninstall / packaged first launch | **NOT TESTED** | Requires approval for system/startup and file changes |
| Authenticated real Codex / Kimi lifecycle | **NOT TESTED** | Version/help/doctor probes do not establish real tool payload or lifecycle compatibility |
| Omarchy / Wayland | **NOT TESTED** | No target desktop available |
| Real CLI latency percentile / CPU / memory | **NOT MEASURED** | Small synthetic samples are not production performance measurements |

Final full-suite duration was about 2.25 seconds. The measured PowerShell startup and bridge-to-Model samples use different paths and must not be compared as equivalent latency figures.

## Local artifacts

- Installer: `release/CubicleCrew-Setup-2.22.0-kimi.1.exe`, 111,711,415 bytes.
- Installer SHA-256: `FA5B7067C0DAEC74195798174F9E60111A43F1DD19CC1C0653D4D4C5323C825C`.
- Final renderer captures/result: `local-runtime/desktop-smoke-GQ1WE2/{working,waiting,completed}.png` and `result.json`.
- Final generated Kimi test config: `local-runtime/kimi-acceptance-jQGRgz/config.toml`; accepted by installed `kimi doctor`.

All captures and fixtures contain synthetic project/session data. Local runtime and build files are ignored by Git and retained for review. Smoke-test processes exit automatically. Earlier manual source test processes were stopped before restoring dependency versions.

## Approved user integration — 2026-11-08

The local operator approved enabling Kimi observation and recording the document-editing lesson in project AGENTS.md.

- Added 12 observation hooks to `%USERPROFILE%\.kimi-code\config.toml`, with Windows timeout set to two seconds.
- Verified the original file bytes remain the prefix of the resulting config. Verified the backup exactly matches the original file.
- A configuration backup was retained locally; its machine-specific path and identifier are omitted.
- Verified the installed bridge and normalizer match project source. A repeated installation reported `changed=false`.
- The real user config passed `kimi doctor`, and hook status reported `installed=true`.
- A synthetic event passed through the actual installed cmd.exe/PowerShell command, installed helper and isolated local HTTP server in 1,438 ms, within the configured two-second deadline. The helper exited silently and filtered private marker fields.
- Started the source app with pinned Electron 44.7.0, an isolated project-local desktop profile and the normal user bridge home. Verified the running bridge identity on `http://127.0.0.1:4317`.
- The local WebSocket check observed zero recent Codex sessions. The most recently modified default Codex session file was about 11 hours old at that check. New CLI activity is needed for live lifecycle acceptance.
- Added the approved 2026-11-08 lesson to the project AGENTS.md using an in-place edit.

## Remaining real-machine acceptance

Restart Kimi to load the hooks. Use a disposable small-project session in each CLI and verify reads, edits, tests, explicit waiting, completion, interruption and restart. Record normalized states and field names. Keep raw prompts, commands, model answers and tool output out of fixtures and logs. The packaged app inherits automatic Windows startup behavior, so the running monitor uses source mode.

References: [Kimi hooks](https://moonshotai.github.io/kimi-code/en/customization/hooks), [Electron webContents](https://www.electronjs.org/docs/latest/api/web-contents), [Node child_process](https://nodejs.org/api/child_process.html).

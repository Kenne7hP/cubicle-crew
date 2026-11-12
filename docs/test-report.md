# MVP validation report — 2026-11-08

This is the original supplied Linux-container report. For subsequent native Windows checks, fixes, screenshots and installer output, see [Windows validation](2026-11-08-windows-validation-report.md). Historical results below are retained as recorded.

## Environment and revision

Upstream baseline: Cubicle Crew 2.22.0 / 6e71e32b66952cbf46e8b7db1d84d1415337cc46.
Implementation: local branch feat/codex-kimi-live, version 2.22.0-kimi.1, staged commits retained in history.bundle.
Node 24.22.1 / npm 11.9.0 / Linux build container. Node.js runtime requirement raised to 22+.
No Codex/Kimi binary, account, or API key was used. No actual user CLI config was edited.

## Results

| Check | Result | Evidence / limits |
|---|---|---|
| Original suite before changes | 35 pass / 2 fail | Windows path labels in Antigravity on Linux; fixed narrowly |
| Final Node suite | **50 PASS** | `npm test`; all assertions passed |
| Codex lifecycle aliases, interruption, error | PASS (synthetic) | `test/codex-lifecycle.test.js` |
| Codex explicit user-question waiting | PASS (synthetic) | request_user_input start/end |
| Kimi turn/tools/approval/failure/heartbeat | PASS (synthetic) | `test/kimi-events.test.js` |
| Duplicate/late tool events / unmatched completion | PASS (synthetic) | ID pairing, tombstones, no arbitrary pop |
| Existing TOML, CRLF, no final newline, uninstall, repeated install | PASS (temporary configs) | `test/kimi-installer.test.js`; damaged/invalid managed blocks refused |
| Windows command quoting | PASS (generated-string test only) | No real PowerShell or Windows filesystem used |
| Fail-open bridge, wrong identity / absent service / malformed input | PASS (real Node subprocess, synthetic stdin) | `test/bridge-transport.test.js` |
| Codex JSONL -> real server -> WS -> UI Model | PASS (synthetic events) | `test/live-pipeline.test.js`, real filesystem and sockets |
| Kimi stdin -> Bridge -> real server -> WS -> UI Model | PASS (synthetic events) | Same test, including permission + reconnect |
| Concurrent Codex + Kimi independent characters | PASS (Model/pipeline) | Two independent agent states; not a visual/CLI test |
| Secret-field removal | PASS (synthetic markers) | No SECRET / absolute private path in WS payloads; wrong instance receives no event |
| Offline network-facing feature routes | PASS | Weather search blocked with 403 by default; LAN/weather/update not started |
| Linux AppImage creation | PASS (build only) | electron-builder Linux x64 |
| Windows portable directory creation | PASS (cross-build only) | electron-builder --win dir; no signing/PE metadata editing |
| Windows NSIS installer | **FAIL / NOT DELIVERED** | Wine missing at installer/uninstaller step; partial file excluded |
| Electron graphical run in this container | **NOT VALIDATED** | No desktop session; root/sandbox and unavailable Unix socket permissions prevented launch |
| Browser visual QA | **NOT TESTED** | No installed Playwright Chromium binary |
| Authenticated real Codex / Kimi CLI | **NOT TESTED** | Binaries/accounts unavailable |
| Windows 11 GUI / Omarchy Wayland/tray/pin/DPI | **NOT TESTED** | Target systems unavailable |
| Real-world P95 latency, CPU and memory | **NOT MEASURED** | Local synthetic latency is not production benchmarking |

Local integration sample measurements earlier in this run: file-to-Model 403ms; Kimi bridge-to-Model 267ms (the Kimi sample includes two bridge invocations). These are two samples, not a P95 estimate. The automated synthetic test checks each sampled path is under 2000ms on this host.

## Packaged-source verification

The asar manifests for Linux and Windows contain observed-sessions.js, bridge-runtime.js, kimi/hooks-cli.mjs, kimi/hook-bridge.mjs, kimi/normalize.mjs and smol-toml. The installer copies Bridge + normalizer into ordinary files before writing Hooks, avoiding external Node's inability to read app.asar.

## Intentional limits and remaining acceptance

1. Kimi Stop is pre-completion, therefore labeled inferred; another hook may block it. Hook concurrency without turn IDs cannot be made globally ordered by this monitor.
2. New hooks require restarting Kimi. Existing sessions cannot be immediately reconstructed with perfect fidelity; heartbeat restores presence only.
3. Codex logs do not provide reliable process liveness or every approval event. We show explicit question tools as waiting, but do not invent shell approval state. Unknown/stale is distinct from completion.
4. Codex startup recovery reads at most 256 KiB per recently modified file, suppresses replay and marks restored state unknown. Large histories / high session counts have not been benchmarked.
5. Kimi events without call IDs are not guessed; oversized stdin is dropped. Subsequent completion clears remaining tool states.
6. The one-second Kimi hook timeout and Windows PowerShell startup cost need target-system measurement. The helper's internal deadline is 700ms; independent transport timeouts are 150ms each.
7. Test-command classification is a whitelist heuristic. No extra model APIs are called.
8. Before daily use: run real A–E acceptance on a disposable small repo on each target OS, check tool payload IDs, waiting transitions, forced exits, restart and uninstall. No private repo content is needed.

## Scope adjustments from the plan

One small ObservedSessions helper is shared by the two provider entrypoints. The original renderer and all pixel assets are retained. Testing/outcome/uncertain are conveyed through existing animation poses and UI bubbles. No database, long-running extra daemon, agent launcher or paid API was added. Defaults are offline, with optional upstream networking available only by explicit PIXEL_OFFICE_OFFLINE=0 configuration.

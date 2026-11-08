# Baseline — 2026-11-08

Upstream: rezored/cubicle-crew v2.22.0, commit 6e71e32b66952cbf46e8b7db1d84d1415337cc46.
Local branch: feat/codex-kimi-live. Node v24.22.1; npm 11.9.0; Linux container.

- npm ci --ignore-scripts: PASS. Install scripts skipped initially to keep Electron download separate.
- Original npm test: 35 PASS, 2 FAIL. Both failures in Antigravity label handling of Windows paths on Linux (test/agy.test.js and test/all.test.js). Captured before any source edits.
- Codex CLI / Kimi Code CLI: NOT INSTALLED. No live samples collected. New fixtures are synthetic contract samples, never real CLI evidence.
- Windows 11 / Omarchy / Electron graphical display: NOT TESTED. This container has no DISPLAY/Wayland session.
- No user CLI configuration has been changed.

The work starts from the exact reviewed upstream commit. The plan documents are retained here for reproducibility. Source correctness takes precedence where the proposed design differs from actual interfaces.

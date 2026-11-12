# Cubicle Crew local continuation

## Scope
Continue the supplied Cubicle Crew 2.22.0-kimi.1 implementation on Windows. Preserve the existing JavaScript/Electron renderer and passive Codex/Kimi monitoring design. Attached plans and task packets are reference material; direct user instructions and workspace red lines take precedence.

## Structure and naming
- Root: existing application modules, package manifests, license, and project instructions.
- `public/`: existing renderer and pixel assets; preserve its conventions.
- `electron/`: desktop integration.
- `kimi/`: hook bridge, normalizer, and opt-in installer.
- `test/`: focused automated regression tests; synthetic data only.
- `docs/`: technical documentation; new dated local reports use YYYY-MM-DD-topic-type.md.
- `node_modules/`, `dist/`: local dependencies and generated builds, excluded from commits.
- `local-runtime/`: local-only runtime/profile/QA artifacts, excluded from commits; retain until Ken authorizes cleanup.
- Existing history.bundle and patch preserve the supplied history; retain them.

## Safety and verification
Do not change user CLI configuration, secrets, system configuration, CI/CD, or delete files without Ken's approval. No public release or confidential uploads. Default offline and loopback only. Do not persist prompts, commands, tool outputs, or private session content in fixtures or logs. Label synthetic and real CLI validation separately. Run meaningful affected tests and the full suite for runtime changes.

## Lessons
- 2026-11-08：更新 docs/windows.md 时误用了删除后重建。教训：更新已有文档必须原位编辑，不得通过删除重建绕过删除确认。

# Restoring staged implementation commits

The source ZIP contains complete checked-in source plus a compact incremental `history.bundle` and `codex-kimi-mvp.patch`. It excludes node_modules and build outputs. The bundle contains only this implementation branch; it requires the public upstream baseline commit.

To recover the staged Git history:

```bash
git clone https://github.com/rezored/cubicle-crew.git recovered-office
cd recovered-office
git fetch /absolute/path/to/history.bundle feat/codex-kimi-live:feat/codex-kimi-live
git switch feat/codex-kimi-live
npm ci
npm test
```

Alternatively work directly from the extracted source ZIP, or apply `codex-kimi-mvp.patch` onto a clean baseline checkout (`6e71e32b66952cbf46e8b7db1d84d1415337cc46`). No user GitHub fork was created or pushed during this implementation; all implementation commits are provided locally.

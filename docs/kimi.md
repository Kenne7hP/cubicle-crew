# New Kimi Code CLI integration

Official contract: https://www.kimi.com/code/docs/kimi-code-cli/customization/hooks.html (re-fetched 2026-11-08). The 12 configured events are listed in kimi/normalize.mjs. Inputs use snake_case, including session_id and tool_call_id (tool_use_id accepted as compatibility fallback). No raw prompt, tool input/output, permission decision or environment is forwarded.

Install/status/uninstall via npm run kimi:hooks:install, npm run kimi:hooks:status, npm run kimi:hooks:uninstall; or the packaged desktop tray menu. A real Node.js executable is required in addition to Electron. KIMI_CODE_HOME overrides ~/.kimi-code. PIXEL_OFFICE_HOME overrides monitor state; installed helpers also discover their runtime beside the helper directory, so the two parent processes need not share this variable.

Configuration editing uses a marked, checksummed append-only block and an actual TOML parser. Other content is preserved byte-for-byte. Existing inline `hooks=[]` conflicts with new tables and is refused, as is a modified managed block. Backups are owner-readable. Existing plugins and hooks remain in place; this program never grants/denies permissions.

Restart Kimi after installing. SessionHeartbeat only runs when enabled and arrives every 60s. It proves presence, not thinking; a monitor restarted during a turn may show unknown until the next meaningful event. After 185s with no evidence mark unknown; drop after 300s. Codex: stale after 10min, drop after 60min. Long operations without observable evidence can therefore become unknown; no success is inferred from timeout.

Every hook runs a bounded Node process: max 1 MiB stdin, <=700ms internal deadline, two <=150ms HTTP requests, no output, exit 0. The initial identity GET contains no event data; only the matching loopback instance receives a sanitized POST. Local malware is not in this isolation boundary. This is not a permission/decision endpoint.

Known edge: Stop is a pre-completion hook; another hook can block it. Its outcome is labeled inferred. Parallel hook delivery without a turn ID has unavoidable ordering ambiguity. Missing tool call IDs are not guessed; no unrelated tool is popped. Full tool fidelity and startup overhead remain to be checked on actual CLI versions.

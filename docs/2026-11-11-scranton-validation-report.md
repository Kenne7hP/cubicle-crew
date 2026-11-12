# Scranton edition validation — 2026-11-11

This report covers the warm palette, Mini view, Scranton-inspired room, character presets, and local Codex activity recovery added to the supplied Codex/Kimi implementation. The original upstream baseline is Cubicle Crew 2.22.0, commit `6e71e32b66952cbf46e8b7db1d84d1415337cc46`. See [credits](../CREDITS.md) for provenance.

## Verified

| Check | Result | Evidence and scope |
|---|---|---|
| Node regression suite | **55 PASS, 0 FAIL** | `npm test`; includes synthetic Codex stale-timestamp recovery and cast allocation tests |
| Codex/Kimi desktop integration | **PASS** | `npm run test:desktop`; actual Electron and local server with synthetic session/bridge events; working, waiting and completion; zero renderer errors |
| Mini and cast integration | **PASS** | `npm run test:mini`; actual desktop entry point, isolated profile, synthetic sessions; zero renderer errors |
| Native size switch | **PASS** | Mini shrinks the native window; five round trips restore the full window within fractional-display rounding tolerance, without accumulated growth |
| Multi-session Mini layout | **PASS** | Seven synthetic actors stay visible and distinct; returning to Office keeps overflow actors apart |
| Identity and appearance | **PASS** | Names and clothing persist through Mini switching, page reload, waiting/idle state changes, and disabling/re-enabling the cast |
| Project traceability | **PASS** | Character detail card contains both the cast name and original synthetic project |
| Cast presets | **PASS** | Sixteen valid editable avatars; explicit character-named agents match their preset; additional copies get unique numbered names |
| Visual review | **PASS** | Full room, Mini, populated overflow, cast roster, night, narrow window and transparent mode inspected locally |
| Live desktop observation | **PARTIAL** | Running Codex chats were visible; Mini/Office buttons exercised in the actual local app. This is not a complete authenticated Codex/Kimi lifecycle certification |

The example native window changed from approximately 714 × 365 to 392 × 297 logical desktop pixels for two synthetic actors at the tested display scaling. Size varies with display scaling, saved full-room bounds and overflow count; this is an example, not a fixed-size guarantee.

## Reproduce

```bash
npm ci
npm test
npm run test:desktop
npm run test:mini
```

Desktop scripts create isolated profiles and synthetic data under ignored `local-runtime/`. They do not modify normal user CLI configuration. The three committed `scranton-*.png` images were selected from these synthetic checks. Raw transcripts, real project names, prompts, credentials, user profiles, installed hook configurations and local runtime logs are not included in the publication.

## Limits

The presets are pixel interpretations within the existing avatar engine. They are not actor portraits. Cast names are local display identities; the underlying project/provider remains in details. Assignment storage is local to the browser origin/profile.

Synthetic event coverage does not establish every real Codex/Kimi version or payload shape. Full authenticated Kimi lifecycle acceptance, macOS/Linux graphical acceptance, installer/uninstaller behavior, signed binaries, production latency and resource benchmarks remain unverified for this edition. Upstream packaging, networking, startup and update behavior must be considered separately; consult [Windows notes](windows.md) and [security](security.md).

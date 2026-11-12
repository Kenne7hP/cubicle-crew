# Credits and provenance

## Original project

**Cubicle Crew** was created by **Kalin Dimitrov ([@rezored](https://github.com/rezored))**.

- Upstream repository: <https://github.com/rezored/cubicle-crew>
- Upstream version used for this fork: **2.22.0**, commit [`6e71e32b66952cbf46e8b7db1d84d1415337cc46`](https://github.com/rezored/cubicle-crew/commit/6e71e32b66952cbf46e8b7db1d84d1415337cc46).
- Original code, procedural pixel-art engine, sprites, office interactions, desktop widget, and inherited media/documentation are credited to the upstream author and contributors.
- The original MIT copyright and permission notice are retained in [LICENSE](LICENSE). The upstream commit history is preserved.

Specific inherited contribution credits, as recorded by upstream and retained in the README:

- **[@buensoft](https://github.com/buensoft)** — Bueno, the tricolour pet.
- **[@TheDjRider](https://github.com/TheDjRider)** — the fennec fox, capybara and wombat, including their color variants.
- **Ivan Turtev** — the “Beer & metal” neon sign.
- **Hristiyan Dimov** — the massage chair.
- Upstream AI-assisted co-author credits are retained in the original Git commits.

This is an independently maintained fork. The original project and its author should not be understood to endorse this fork or its changes. The inherited README sections and upstream demo/download links describe the original release unless explicitly labeled otherwise.

## This fork

**Ken ([@Kenne7hP](https://github.com/Kenne7hP))** directed the customization and maintains this fork. Implementation, debugging, documentation, and test work were assisted by **OpenAI Codex**; the imported implementation commits retain their original author metadata.

Fork-specific work includes:

- Codex lifecycle observation and Kimi Code CLI observation hooks, with privacy filtering and offline defaults.
- Windows bridge compatibility, local desktop checks, and recovery of active Codex files whose modification timestamps remain stale.
- Warm cream, forest-green, and wood-tone styling.
- One-click Mini / Office switching, reduced movement, persisted preferences, and native window resizing.
- A Scranton-inspired office arrangement and 16 character-inspired names and pixel-avatar presets.
- Focused regression tests and real Electron checks using synthetic sessions.

These modifications build on the existing engine and artwork; they are not presented as a new engine or wholly original upstream project.

## The Office inspiration

The office arrangement, fictional company name **Dunder Mifflin**, and character names/appearance cues are inspired by **The Office (US)**, developed for American television by **Greg Daniels**, based on the original series created by **Ricky Gervais and Stephen Merchant**. Credit also belongs to the show's writers, performers, production teams, and relevant rights holders, including **NBCUniversal / Universal Television**.

The presets are unofficial, fan-made pixel interpretations drawn with the application's existing procedural avatar system. This fork does not include episode footage, show stills, actor photographs, the show's soundtrack, or extracted game/TV artwork. No affiliation, sponsorship, or endorsement is claimed. The MIT license covers the software; it does not grant rights to third-party trademarks, fictional characters, or other protected entertainment properties.

## Libraries and media

Runtime and development dependencies, including **Node.js**, **Electron**, **ws**, **smol-toml**, and **electron-builder**, remain under their respective licenses. See [package.json](package.json), [package-lock.json](package-lock.json), and each dependency's distributed license notices.

The `scranton-*.png` previews were generated from this fork's renderer using synthetic sessions. The other inherited media in `docs/media/` belongs to the original Cubicle Crew project and illustrates upstream behavior.

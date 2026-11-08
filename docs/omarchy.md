# Omarchy / Arch Linux

Install Node.js 22+ and npm, then `npm ci`, `npm test`, `npm run desktop`. Build with `npm run dist:linux`. Launch the AppImage as your normal desktop user (not root). Enable Kimi observation from tray or `npm run kimi:hooks:install`; restart Kimi to load config.

Native Wayland can ignore Electron alwaysOnTop/position APIs. Inspect the real app class using `hyprctl clients -j`; set float/pin in your installed Hyprland version's user config. Rule syntax differs between versions: consult the local Omarchy/Hyprland configuration rather than blindly replacing it. This implementation preserves the original Electron window behavior and does not write any compositor configuration.

Fallback for an individual source run:

```bash
env -u OZONE_PLATFORM -u ELECTRON_OZONE_PLATFORM_HINT npm run desktop -- --ozone-platform=x11
```

Or `npm start` then visit the printed loopback address. Provider monitoring is identical in browser mode. If FUSE is unavailable, try AppImage `--appimage-extract-and-run`.

Only AppImage creation was verified in the build container; native Wayland, tray, pin, DPI and user CLI interactions require actual Omarchy acceptance testing.

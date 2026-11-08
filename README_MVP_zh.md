# Codex / Kimi Code 实时像素办公室 MVP

基于 Cubicle Crew v2.22.0。此分支版本：2.22.0-kimi.1。

## 首次启动

需要 Node.js 22+（建议 LTS）和新版 Kimi Code CLI；Codex CLI 按原有方式独立启动即可。**本程序不派发任务，不调用额外付费 API。**

### 安装包

- Windows：运行 `CubicleCrew-Setup-2.22.0-kimi.1.exe`。本次为未签名的交叉构建测试包，尚未在真实 Windows 上验收。
- Omarchy：`chmod +x CubicleCrew-2.22.0-kimi.1-linux.AppImage` 后运行。若缺 FUSE，可尝试 `./CubicleCrew-2.22.0-kimi.1-linux.AppImage --appimage-extract-and-run`。本次已构建，尚未在真实 Omarchy 桌面验收。
- 打开托盘菜单 → **Kimi Code integration → Enable observation hooks**，然后重启 Kimi Code CLI 会话。
- Codex 无需安装 Hook；默认监视 `~/.codex/sessions`，可通过 `CODEX_HOME` 自定义。

### 源码启动（推荐首次调试）

解压源码包进入项目目录：

```bash
npm ci
npm test
npm run desktop
```

另开终端：

```bash
npm run kimi:hooks:install
npm run kimi:hooks:status
```

然后正常运行 `codex` 和 `kimi`，在小型测试项目里让它读取、编辑文件并运行测试。请使用新版 Kimi Code CLI，配置目录为 `~/.kimi-code` / `KIMI_CODE_HOME`；不是旧版 `kimi-cli`。

Windows 可双击 `start-windows.cmd`；Linux 可执行 `./start-linux.sh`。首次会安装 npm 依赖。若 Electron 窗口兼容性有问题，运行 `npm start`，打开终端打印出的 `http://127.0.0.1:<port>/?lang=en`；同一个动画系统可以在浏览器使用。

## 动作和证据

- 阅读：Read/Grep/Glob；编辑：Write/Edit；执行：Bash/Shell。
- 测试：复用执行动作，显示 Testing（通过命令白名单推断）。
- 等待确认：只有明确权限事件才举手；在 CLI 里批准/拒绝，不由本工具决策。
- 完成：短暂庆祝；Kimi 的 Stop 表示准备结束，画面标记 inferred，其他 Hook 可能让它继续。
- 工具失败：短暂红色提示后允许继续；回合失败与用户取消分开处理。
- 长思考：已有回合证据时保持 thinking；失去近期存活证据时显示 Status unknown，不伪造完成。

## 隐私与卸载

默认离线模式，禁用天气、自动更新与 LAN 分享，主服务只监听 127.0.0.1。Kimi Bridge 不向本地服务发送 Prompt、工具输入/输出或完整命令。Codex 的敏感 detail 在输出前清空。界面仍显示项目文件夹名；不要把它用于秘密项目名保护。

停用 Hook：托盘菜单 → Disable observation hooks，或：

```bash
npm run kimi:hooks:uninstall
```

只删除本工具管理区块，保留其他 TOML 和 Hooks。安装/卸载会生成权限受限的配置备份。卸载应用前建议先停用 Hook，避免留下指向已删除文件的配置。Helper 和备份可保留供审计；无需为了停用监控删除整个 `.kimi-code` 或 `.pixel-office` 目录。

## 当前验证边界

已完成 Node 自动化及真实本地服务的合成事件集成测试；**没有运行登录态真实 Codex/Kimi CLI，也没有在 Windows/Omarchy 桌面操作验收。**详见 `docs/test-report.md`。不能把合成事件通过等同于实际 CLI 全部兼容。

原版办公室的休息区、宠物和经济系统保留，未增加游戏玩法。角色闲置时的生活动作由原版系统产生；工作类型由观察到的事件决定。

## 继续开发 / 恢复提交

`history.bundle`（如源码包中提供）保存本次独立阶段提交。也可直接在源码目录 `git init` 开发。技术方案和任务包一并保留，实施时的实际情况以本 README 和测试报告为准。

MIT License，保留上游 Kalin Dimitrov 的版权与素材署名。

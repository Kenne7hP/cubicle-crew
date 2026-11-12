# Cubicle Crew — Scranton Edition（Codex / Kimi）

基于 [Kalin Dimitrov（@rezored）的 Cubicle Crew v2.22.0](https://github.com/rezored/cubicle-crew)，由 [Ken（@Kenne7hP）](https://github.com/Kenne7hP) 在 OpenAI Codex 协助下定制。保留 MIT 版权和提交历史，完整署名及《The Office》灵感来源见 [CREDITS.md](CREDITS.md)。内部包版本沿用 2.22.0-kimi.1；此 GitHub 源码包含后续 Scranton 定制，尚无对应二进制发行包。

## 当前源码与验证（2026-11-11）

新增奶油色／森林绿／木色配色、Dunder Mifflin 风格办公室、Mini / Office 一键切换，以及 Michael、Jim、Pam、Dwight 等 16 位角色的名字和像素外观。Mini 暂停闲逛与宠物活动，保留实时状态和点击详情；超出工位的角色使用额外固定位置。Look 设置可独立切换房间、Mini 和角色预设。

Windows 自动化测试 **55/55 通过**。`npm run test:desktop` 验证合成 Codex + Kimi 双角色、工作、等待和完成；`npm run test:mini` 验证原生窗口缩放、连续切换、角色身份保存、固定服装与七角色显示。预览使用合成会话；测试配置留在被 Git 忽略的 `local-runtime/`。完整边界见[当前验证报告](docs/2026-11-11-scranton-validation-report.md)。

同时包含 Codex 日志修改时间不更新时的活跃会话恢复，以及 Windows 桥接路径和 Hook 超时修复。源码模式便于先验证；打包版继承上游的 Windows 自启动行为。历史构建说明见 [Windows 指南](docs/windows.md)；旧构建不包含当前 Scranton 定制。

## 首次启动

需要 Node.js 22+（建议 LTS）和新版 Kimi Code CLI；Codex CLI 按原有方式独立启动即可。**本程序不派发任务，不调用额外付费 API。**

### 历史安装包说明

以下记录来自原 Codex/Kimi 实施阶段，不代表当前 Scranton 版提供下载。运行当前版本请使用下面的源码方式。

- Windows：解压 `CubicleCrew-2.22.0-kimi.1-windows-portable.zip`，双击其中的 `Cubicle Crew.exe`。本次为未签名的交叉构建测试包，尚未在真实 Windows 上验收。NSIS 安装包构建因缺少 Wine 未完成，不提供残缺安装器。
- Omarchy：`chmod +x CubicleCrew-2.22.0-kimi.1-linux.AppImage` 后运行。若缺 FUSE，可尝试 `./CubicleCrew-2.22.0-kimi.1-linux.AppImage --appimage-extract-and-run`。本次已构建，尚未在真实 Omarchy 桌面验收。
- 打开托盘菜单 → **Kimi Code integration → Enable observation hooks**，然后重启 Kimi Code CLI 会话。
- Codex 无需安装 Hook；默认监视 `~/.codex/sessions`，可通过 `CODEX_HOME` 自定义。

### 源码启动（推荐首次调试）

克隆本 fork 并进入定制分支：

```bash
git clone https://github.com/Kenne7hP/cubicle-crew.git
cd cubicle-crew
git switch feat/codex-kimi-live
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

已完成 Windows Node 自动化、真实本地服务的合成事件集成测试、真实 Electron 渲染器截图验证，以及实际桌面窗口的 Mini / Office 点击切换。真实 Codex chat 的显示已局部观察；**尚未完成登录态 Codex/Kimi 全生命周期和 Omarchy 桌面验收**。Linux 原始报告保留在 `docs/test-report.md`，当前结果见[Scranton 验证报告](docs/2026-11-11-scranton-validation-report.md)。合成事件通过不等于实际 CLI 全部兼容。

原版办公室的休息区、宠物和经济系统保留，未增加游戏玩法。角色闲置时的生活动作由原版系统产生；工作类型由观察到的事件决定。

## 继续开发 / 恢复提交

`history.bundle`（如源码包中提供）保存本次独立阶段提交。也可直接在源码目录 `git init` 开发。技术方案和任务包一并保留，实施时的实际情况以本 README 和测试报告为准。

MIT License，保留上游 Kalin Dimitrov 的版权与素材署名。

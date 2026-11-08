# Codex / Kimi Code 像素办公室：Coding Agent 任务包

**本文件与主技术方案配合使用：** `pixel_office_codex_kimi_mvp_plan.md`。

执行方式：把本文件和主技术方案放入 Fork 根目录。每次只交付一个 Task 的独立提交和测试证据；不要跳过 S0 调研基线，不要同时重写多个主模块。只有用户的开发环境具备 CLI 与图形桌面，才能进行真实 E2E 验证。没有条件时将该项列为 NOT TESTED 并继续实现其余部分。

## 12. 可直接交给 Codex / Kimi Coding Agent 的实施任务

以下任务是按依赖顺序实施的**独立工单**。每项应提交 `diff + 测试结果 + 未验证项`，不可把模拟验证当作真实 CLI 成功。所有任务共同限制：唯一底座是当前 Fork 的 Cubicle Crew v2.22.0；使用最小 JavaScript ESM 补丁；不得擅自迁移 Electron/动画引擎/状态框架；不修改用户已有 Hook 配置中的其他内容；不读取或输出生产敏感信息。

### Task 0 — baseline and fixtures

**输入：** 固定提交 SHA、当前 Node/OS、`codex --version`、`kimi --version`。  
**修改范围：** `docs/baseline.md`、`test/fixtures/`（脱敏后）。  
**工作：**创建功能分支；跑 `npm ci`, `npm test`, `npm run desktop`；检查原 UI；使用独立无敏感数据测试项目采集真实工具、回合与 Hook JSON 的**字段名称**，不得保存原始 Prompt/Command/Output。  
**验收：**现有测试不回退；列出真实观察 / 未能观察的字段，确认当前 CLI 与新版 Kimi 配置目录；留下可复现失败情况。

### Task 1 — Codex lifecycle

**输入：**`providers.js`,`server.js`、Codex protocol.rs 和 Task 0 fixtures。  
**修改范围：**`providers.js`, `server.js`, `test/codex-lifecycle.test.js`。  
**工作：**处理 `task_started|turn_started`、`task_complete|turn_complete`、`turn_aborted`，扩轻量 Codex live registry；保留已有文件增量读取，不重写；扫描最近文件尾部进行谨慎启动恢复；在不增加全目录 CPU 开销的前提下缩短当前日期目录扫描的首次发现延迟。  
**验收：**超过 20s 的活跃回合不 idle；正常完成、失败与中断不同；工具 start/end 仍正确；真实解析缺失时安全 unknown。

### Task 2 — loopback bridge and port discovery

**输入：**`server.js` 的 `startServer()` 和 `/api/event` 行为。  
**修改范围：**新增 `bridge-runtime.js`, `kimi/hook-bridge.mjs`, `test/bridge-transport.test.js`；局部修改 `server.js`。  
**工作：**启动后写真实 `host,port,pid,started_at`；Bridge 从 stdin 读事件并筛选；只向验证的本机端口 POST；静默 exit 0；模拟端口冲突与掉线。  
**验收：**4317 被占用后仍可到达新端口；端口无效/无 app 时不出错、不影响 Agent；请求体禁止含 raw Prompt/Command/Output。

### Task 3 — safe Kimi hook installation

**输入：**官方 `[[hooks]]` 文档、`KIMI_CODE_HOME`、Task 2 Bridge 路径。  
**修改范围：**`kimi/hooks-cli.mjs`, `package.json`, `test/kimi-installer.test.js`。  
**工作：**生成上述 12 个事件；实现 install/status/uninstall、backup、managed block、TOML 检查、原子写入和竞态保护；Windows 路径 quoting；不覆盖已有 hooks。  
**验收：**重复安装无重复、卸载可无损撤销、其他配置字节不变；路径含空格/中文；真实 `kimi` 启动不会报配置解析错误。

### Task 4 — normalize Kimi and implement stable session state

**输入：**Task 0 的真实 Kimi fixture 与 Task 2–3。  
**修改范围：**`kimi/hook-bridge.mjs`（或 `normalize.mjs`）、`external.js`、`test/kimi-events.test.js`。  
**工作：**正确映射新事件、关联 `tool_call_id`、处理 `turnOpen`, heartbeat, permission, failure、重复/乱序事件；默认零敏感 detail；将新 event 转为现有原生事件模型。  
**验收：**并发工具 ID 正确；Kimi 心跳不会制造思考动画；等待得到解除；单工具失败不自动结束整轮；失联后安全降级。

### Task 5 — pixel UI states and concurrency

**输入：**Task 1 和 Task 4 的标准事件。  
**修改范围：**`public/model.js`,`public/main.js`,`public/config.js`，必要时 `public/rules.js`；尽量不改 `characters.js`、`office.js`。  
**工作：**Kimi 标签、coding→typing、testing→running+安全标识、success/error 短暂特效、最短保持时间、活跃回合不自动 idle；两个 Provider 同时展示且不得串台。  
**验收：**模拟和真实事件各跑一次；至少 Codex+Kimi 两人，不因快速工具切换闪烁；未观察到的动作不假装正在发生。

### Task 6 — Windows / Omarchy integration and release

**输入：**Task 0–5。  
**修改范围：**`electron/main.js`, `package.json`, `docs/windows.md`, `docs/omarchy.md` 和构建配置（仅必要时）。  
**工作：**确保打包后 Node Hook Bridge 独立于 `app.asar`，提供托盘或设置中的 Kimi integration 一键启用/停用，安装器路径稳定，打包 Windows NSIS、Linux AppImage；在 Omarchy 验证 Wayland/Hyprland float/pin / XWayland fallback。  
**验收：**Windows 和 Omarchy 分别完整运行真实 Codex 与 Kimi；签出平台、CLI 版本及日志；若桌面置顶受 compositor 限制，明确记录并提供可复现 fallback。

### Task 7 — E2E, privacy, regression, documentation

**输入：**所有前述任务及验收矩阵。  
**修改范围：**自动化测试、文档、极少量修复。  
**工作：**执行 A–E+S 场景；统计事件写入→UI 状态变更的端到端时延；断网、强杀、重启、端口占用测试；审计 UI/HTTP/debug 无敏感字段；核对 MIT LICENSE/署名；完成 README。  
**验收：**输出每条场景 PASS(真实)/PASS(模拟)/FAIL/NOT TESTED 和对应证据，列出遗留边界和下一步。不得给未跑过的目标系统打通过标记。

### 首个交给 Agent 的总控提示词

```text
你是本地 Codex/Kimi Code 实施工程师。请读取仓库根目录中的
pixel_office_codex_kimi_mvp_plan.md，严格使用 Cubicle Crew v2.22.0
(基线提交 6e71e32b66952cbf46e8b7db1d84d1415337cc46) 作为唯一主底座。

目标：实现可在 Windows 11 / Omarchy 上运行的、同时旁路显示 Codex CLI
和新版 Kimi Code CLI 实时工作动作的像素办公室 MVP。

约束：不重构动画引擎，不新增数据库或新的前端框架，不启动/控制 Agent，
不上传 Prompt、Shell 输出、文件内容或凭据，不修改已有无关 Hooks。

请先执行 Task 0，记录仓库基线、测试及真实 CLI 事件证据。
之后严格按 Task 1 到 Task 7 的依赖顺序推进；每项生成独立提交。
任何需要真实运行但当前环境没有条件的测试，标记 NOT TESTED，不许
编造 PASS。优先完成最小可用事件路径，而不是美化 UI。

每一阶段报告：已修改文件、关键设计选择、自动测试结果、真实 CLI 测试
结果、对上游影响、已知风险。对于源码与本方案不同之处，以当前实际源码
为准，说明差异并采取最小兼容修正，不得擅自更换主仓库。
```

# H6 常驻主动推送 · 立项调研（只调研，未开发任何推送/后台代码）

> 调研日期：2026-10-18 ｜ 调研对象：宿主 deepseek-harness（外部运行实例，端口 3172，profile `pm`，由另一组织者管理）
> 硬性边界：本文件只产出调研结论；**未编写/修改任何代码（含占位）、未启动任何进程、未向宿主注入能力、未重启/未写 3172 实例**。
> 调研范围只读：本仓 `docs/`、已装依赖 `packages/dsh-pm-tool/node_modules/@deepseek-ai/*`、本地宿主源码 `~/Projects/dsh-pm/deepseek-harness`（只读核查）、`lsof/ps` 只读观察。

## 证据分级图例

| 级 | 含义 |
|---|---|
| **E1** | 本机可复现实测（本调研当场命令观察，可重复） |
| **E2** | 源码/文档可引用（给出文件路径 + 行号，结论直接出自该处） |
| **E3** | 历史日志/既有记录（decision-log / 设计说明 / 开发红线） |
| **E4** | 推理推断（**显式标注「推断」**，非实测、非源码直接结论） |
| **E5** | 外部不可验证（本环境无法访问，仅转述） |
| **E6** | 未验证（受只读/权限限制，未当场证实或证伪） |

> 实测（E1/E2）与推断（E4）严格分开；下文每条关键结论后括注证据级。

---

## ① 结论摘要

**推荐方案（一句话）：本期维持「应用内/打开面板即派生」（路线 B，即 ADL-039 现状），不做宿主级主动推送（路线 A），H6 继续保持「未实现」标注；只有当所有者明确接受「常驻常开 + 可选联网/外部渠道」并正式解除 C7 常驻禁令后，路线 A 才作为独立增量重新立项。**

**拍板条件（全部满足才触发路线 A，否则维持现状）：**
1. 所有者**书面接受**常驻后台/宿主常开（及可能的联网、外部通知服务/凭据），并以新 ADL 正式 supersede ADL-039、ADL-032 的「不做后台常驻/调度」禁令；**〔E3 约束 + E4 流程推断〕**
2. 选定一条**当前可达**的通道并接受其形态：Desktop Electron 主进程通道（需确认日常使用打包版、需改宿主 `apps/desktop`），或外部独立通道（launchd 常驻 / 外部 webhook / 邮件服务，需联网与凭据）；**〔E2 现状 + E4〕**
3. 接受「改外部上游宿主 / 维护外部服务」的成本、升级覆盖与长期维护风险；**〔E2/E3〕**
4. 提供可用通知/模型凭据并能做真实验收。**〔E3 沿用 ADL-032 解除口径〕**

在上述条件未全部满足前，**默认拍板 = 维持路线 B（现状）**，不立项路线 A。

**一句话事实基础：** 宿主在本仓当前运行形态（Web/Chrome）下**不提供任何外部通知渠道**（无系统通知、无邮件、无出站 webhook 推送、无托盘/角标/手机推送）；宿主自带的 `schedule` 定时能力到期也只是把 follow-up 消息投回**原会话**，不是 OS 推送/邮件/短信。**〔E2，见 ②〕**

---

## ② 宿主通知能力调查（逐问题）

### 2.1 已装依赖面（本仓 peer 锁定 0.2.1-alpha.2 / cordis 4.0.5-alpha.1）

排查路径：`packages/dsh-pm-tool/node_modules/.pnpm/@deepseek-ai+*`（经 `@deepseek-ai/*` 软链）。

#### (a) cordis 框架：无内置定时器/调度 API **〔E2〕**
- `@deepseek-ai/cordis/lib/index.js:1829` 导出面仅：`Context, CordisError, DisposableList, EventsService, Fiber, Inject, Logger, LoggerService, RegistryService, Service, ValidationError, …` —— **无 schedule / setInterval / cron / 定时器服务导出**。
- `EventsService`（`lib/types/events.d.ts`，DispatchMode = `emit/parallel/serial/bail/waterfall`）是**进程内事件总线**，只在宿主进程内派发监听，不跨进程、不触达 OS。**〔E2〕**
- 复核：cordis 全文件 grep 无 `schedule`/`cron`/内置定时器导出（与组织者侦察线索一致）。**〔E2〕**

#### (b) `dsh-api-session-controller` 的 `notification` 帧 = 会话内助手流，非系统通知 **〔E2〕**
- `lib/client.js:372-375`：gateway 变更 `case "notification"` 被映射为 `{ type: "assistant-stream", frame: change.notification }`。
- `lib/client.js:451-457`：gateway 的 `assistant-stream` 帧被包成 `{ type: "notification", notification: frame.frame }` yield 到**会话控制流**。
- 即：这里的 `notification` 是**助手回复的流式输出块**（agent stream chunk），消费端是应用内会话流 UI，**不是 OS 通知横幅/角标**。
- 对外远程事件清单 `lib/types/remote-events.d.ts` 仅：`api-session/activity | added | error | removed | status`，无通知类事件。**〔E2〕**
- `lib/types/client/sessions/notifier.js` 的 `Notifier` 是 microtask / `requestAnimationFrame` 批处理的 React `useSyncExternalStore` 订阅通知（`markDirty/markFrameDirty/notifyNow`），纯应用内状态刷新，与外部推送无关。**〔E2〕**

#### (c) UI 插槽：仅有应用内 UI 区，无 OS 托盘/角标通道 **〔E2〕**
- 侧栏 `dsh-client-ui-sidebar/.../contract/slots.d.ts:17-22`：`sidebar.toggle.badge` 明确注释为「Non-interactive notification inside the collapsed sidebar expand button」——折叠侧栏 rail 展开按钮内的**非交互小标记**，是应用内 UI，不是系统托盘角标。其余插槽：`sidebar.brand.mark/brand.name/panellist/workspaces/settings/footer.action`（:28-80），全部是应用内 UI 区。**〔E2〕**
- 布局 `dsh-client-ui-layout/.../client/index.d.ts:44/53/70/81/95/112`：插槽为 `sidebar / main / rightbar / shell.bottom / shell.overlay / shell.leading`，全是窗口内区域。其中 `shell.overlay`（:95-98）是帧内悬浮层，注释明确「a badge, a toast stack or a status pill all belong here」——它是**窗口内**的 toast/角标座，仍在应用窗口内，不是 OS 通知/托盘。`DocumentTitle.d.ts` 只把**当前会话标题**投影到浏览器 tab；`lib/client.js:64` 仅 `document.title = …`，无未读数角标、无 favicon 计数。**〔E2〕**
- `dsh-client-ui-slots/lib/index.js:564-566` 的 `notifyDeclaration` 只是回调插槽注册的 declarationListeners（生命周期内部刷新），非外部推送渠道（与组织者侦察线索一致）。**〔E2〕**

#### (d) 命令面：无通知/推送字段 **〔E2〕**
- `dsh-commands/lib/types/types.d.ts:55-63`：`CommandDescriptor` 仅 `name / description / input`，**没有 notify / badge / icon / push 等任何推送控制字段**（与 ADL-038 上游只读核查结论一致）。**〔E2〕**

#### (e) 已装包全量原语扫描 **〔E2〕**
对全部已装 `@deepseek-ai+*` 扫描：无 `new Notification(`、无 electron 引入、无 osascript 通知、无 `node-notifier/terminal-notifier`、无 SMTP/nodemailer、无 ServiceWorker/PushManager/web-push。唯一 `setInterval` 在 `dsh-api-gateway/lib/types/stream-server.js:76`，是 WebSocket 心跳保活，非调度。**〔E2〕**

### 2.2 本地宿主源码核查（`~/Projects/dsh-pm/deepseek-harness` @ `d7432673`，只读）

> 说明：本地源码用于只读核查上游能力，**未改一行、未构建、未运行**。本仓已装依赖面不含 schedule/jobs 等包，但发行版 Web 组合会携带，故在此核查其真实通道。

#### (f) 宿主自带 `schedule`：到期只投回原会话，明确「不是邮件/短信/推送通知」**〔E2〕**
- 外层 `packages/schedule/README.zh.md:12`：「到期提醒作为**普通 follow-up 消息进入原对话**，而不是电子邮件、短信或推送通知。」**〔E2〕**
- 内层 `packages/schedule/schedule/README.zh.md:12`：「作为后续消息投递到原会话……每个重复任务只补发最近一次错过的发生时点」；`:26`：「Schedule 无法在 headless 或仅 SDK 的组合中单独挂载：投递需要 Host 的 Web Session controller 和 Session 持久化后端，因为只有在 Session 确认 `session/flush` 之后一次投递才会提交」；`:65`：「插件来源的 `followup()` 同步将消息追加到会话收件箱；会话 flush 成功后确认持久投递」。**〔E2〕**
- 子系统文档 `docs/subsystems/schedule.zh.md:146`（重启后只发最新一次到期/错过时点，错过不累积）、`:148`、`:436`、`:454`（投递仅在 `ctx.sessions.flush()` 报告 `session/flush` 参与后提交）。**〔E2〕**
- 服务经 cordis 模块增强暴露 `ctx.schedule: ScheduleService`（`packages/schedule/schedule/src/index.ts:64-68`），**但投递通道仍是原会话 follow-up**，不产生 OS 通知。**〔E2〕**
- 约束（与 E3 历史记录互证）：宿主不运行/会话不活则投递不到；headless/SDK 组合无法挂载；错过不补发、重复任务只补最近一次。**〔E2〕**

#### (g) Desktop 打包版是 Electron，但通知/托盘原语未对插件暴露 **〔E2〕**
- `apps/desktop/package.json:65` `electron ^44.7.0`、`:66` `electron-builder`、`:46` `electron-updater`（Web 后端形态无 Electron）。**〔E2〕**
- 唯一 `new Notification()` 在 `apps/desktop/src/update-attention.ts:43`（**强制更新就绪**的固定文案系统通知）；`:39` `app.dock.bounce('informational')` 仅更新注意力，无未读角标。**〔E2〕**
- `apps/desktop/src/tray.ts:23`：静态 Tray，右键菜单仅 open/quit，**无 badge 计数、无动态 tooltip**。**〔E2〕**
- IPC（`main.ts` 的 `ipcMain.handle/on`）仅覆盖 shortcuts / boot / browser acquire-release / platform window / locale / updates / deviceInfo / onboarding / windowsMenu，**无 notification / badge / reminder 通道对 renderer 或插件暴露**。**〔E2〕**
- 结论：Electron 原语客观存在，但当前**只服务于自更新，未形成插件可调用的通知/角标 API**；且本仓当前运行形态是 Web/Chrome（见 2.3），不在 Electron 主进程内。**〔E2 + E4 推断〕**

#### (h) experimental/webhook 是「入站事件→建会话」，非出站推送 **〔E2〕**
- `packages/experimental/webhook/README.zh.md`：`ctx.webhookRuntime` 是受信任规则注册表，唯一内置动作是「在 Web Workspace 创建普通根会话」（`register/dispatch`）；这是**入站接收**（外部事件进来开会话），不是向手机/OS/邮件出站推送。**〔E2〕**
- `webhook-github/src/index.ts:14` `inject=['webServer','webhookRuntime','credentials']`，是挂在 webServer 上的入站适配器，且 experimental、需公网可达，与本机离线常驻场景不符。**〔E2〕**

#### (i) 全宿主源码扫描：无浏览器推送、无邮件发送 **〔E2〕**
- 全 `packages/`（排除 tests/experimental inspector）扫描：无浏览器 `new Notification(`/Notification.permission、无 ServiceWorker/PushManager/web-push、无 nodemailer/SMTP/mailgun/sendgrid；`osascript` 仅用于目录选择器（directory-picker-native）、默认目录、文件关联，**不用于发通知**。**〔E2〕**

### 2.3 运行实例只读观察（3172）**〔E1 / E6〕**

- **E1**：调研时刻（2026-10-18）`lsof -nP -iTCP:3172 -sTCP:LISTEN` **无监听**；`ps` 无 dsh/harness node 进程；无 node 监听端口。本调研未向实例发任何请求、未重启、未写。
- **E6**：实例由另一组织者管理；本次只读观察时未确认它是瞬时停机还是本就未起，故「3172 实时挂载了哪些包/确切版本」未实测，不下结论。
- **E1（只读配置）**：`~/.dsh/profiles/pm/package.json` bundles = `@deepseek-ai/dsh-base`、`@deepseek-ai/dsh-web-app`、`dsh-pm-tool`、`dsh-our-free-model`；`cordis.patch.yml` 无 schedule/notification/webhook/端口类配置（仅 LLM provider 路由）。**〔E1〕**
- **E4（推断）**：本机已装依赖面无 `dsh-schedule` 包（E2），运行实例是否在 dsh-web-app 内挂载 `ctx.schedule` 未实测（E6）；**即便挂载，到期投递仍只进原会话**（E2，见 2.2-f）。

### 2.4 既有记录（E3）与设计示意现状

- **ADL-039**（`docs/decision-log.md:148-153`）：R16 临期/逾期提醒采用「打开面板即派生」，不做定时器/常驻；`:151`「离线优先、无后台常驻是项目基调」；`:152` 替代方案「后台 daemon 轮询并推送（需常驻、违反基调，否）」。**〔E3〕**
- **ADL-032**（`:204-208`）：需定时器/模型推理的能力暂缓；`:206`「提醒依赖 dsh schedule/后台调度与常驻进程，与『单用户本地、可随时关闭、无 Key 也能用』的最小闭环相冲突」；`:208` 解除条件「待项目所有者明确提供可用 Key、并接受常驻/联网依赖后，再以独立增量实现并做真实验收」。**〔E3〕**
- **ADL-009**（`:346-354`）：离线优先定位；R11 里程碑到期提醒第一版不做。**〔E3〕**
- 开发红线 `docs/design/deep-integration-v2-p0-dev.md:150`（红线 1）：「不实现 H6 常驻推送；不引入常驻后台/系统通知（ADL-032）」；`:5` 硬约束同义。**〔E3〕**
- H6 设计示意 `docs/design/deep-integration-v2-designs-rework/scenes/h6-proactive-vision/说明.md:7-9,16,21`：期望形态（桌面横幅/手机通知/托盘角标）**明确标注「依赖宿主通知能力，当前未实现」**；声明「不发邮件/短信/系统推送、不引入常驻进程」。**〔E3〕**

> **簿记提示（E3）**：任务书把「离线优先、无后台常驻是项目基调」记为 **ADL-011**；但本仓 `decision-log.md` 中 **ADL-011（:367-379）实为「业务实体落盘布局定稿」**，离线优先/无常驻基调实际锚在 **ADL-009 + ADL-039 理由**。提请组织者核对编号映射，本调研按仓内原文引用。

---

## ③ 可扩展点与「改宿主」代价评估

### 3.1 插件协议现有扩展点（E2，均为应用内/会话内）

| 扩展点 | 位置（E2） | 能做什么 | 能否触达 OS/外部 |
|---|---|---|---|
| 斜杠命令 `ctx.commands.register` | 本仓 `src/index.ts:154`；契约 `dsh-commands/types.d.ts:55-63` | 注册 `/pm …`，返回 `kind/text` | 否：结果只回会话/命令响应 |
| Host 服务注入 `inject` | 本仓 `src/index.ts:62`（现 `['commands','storageDomain']`） | 声明宿主服务依赖 | 否：进程内服务 |
| 客户端 UI 插槽 `slots.inject/register` | 本仓 `src/client/index.tsx:32,37`（`main`、`sidebar.panellist`） | 在窗口内渲染面板/图标 | 否：窗口内 UI |
| 客户端远程执行 `remote.commands.execute` | `src/client/index.tsx:23` | 远端跑命令取文本 | 否：会话内 |
| 进程内事件总线 `ctx.on(...)` | cordis `events.d.ts`（emit/parallel/…） | 监听 tools/session/agent 生命周期事件 | 否：进程内、会话内 |

**结论：插件协议当前不提供任何「系统通知 / 邮件 / 出站 webhook / 托盘角标 / 手机推送」扩展点。**〔E2〕

### 3.2 「不改宿主、纯插件侧」能否拼出 H6？

- **E4（推断）浏览器页内通知变体**：Web/Chrome 形态下，插件 client 理论上可调用浏览器标准 `Notification` API，但：① 仅在 tab 存活时可发，② 无 Service Worker，关闭/后台时不能唤醒，③ 宿主未提供权限管理 UI。它只能算「打开页面时的页内提醒」，**不满足 H6「不用打开 dsh 也被提醒到」**。**〔E4〕**
- **E4（推断）插件自造常驻定时器**：插件 host 代码跑在宿主 Node 进程，理论上可 `setInterval` + `osascript`/独立脚本出带系统通知；但这是**自造常驻定时器**，直接撞 ADL-039/ADL-032，且依赖宿主进程常开。**〔E4〕**
- **E2**：本仓 `src/` 基线已确认无 `Notification(`/`setInterval`/出站 `fetch`/webhook/邮件（仅一次性 `setTimeout` 用于 UI 复制提示与 gantt 状态闪烁）。**〔E2〕**

### 3.3 改宿主源码的代价与风险（E2 事实 + E4 推断）

| 维度 | 评估 | 证据 |
|---|---|---|
| 改哪里 | 若走 Electron 路线：需改 `apps/desktop` 主进程，新增 `Notification`/Tray badge IPC 并对 renderer/插件暴露；Web 形态则需另建 OS 通道 | E2（现状无此 API） |
| 升级覆盖风险 | 宿主为外部上游 alpha（peer 锁 `0.2.1-alpha.2`，ADL-034）；内部契约非稳定公开 API，跟版本需全量回归；改宿主本地源码会被上游升级覆盖/漂移 | E3（ADL-034、ADL-038「插件侧不改宿主行为」） |
| 维护成本 | 需长期跟上游、维护补丁；与「单用户本地离线、最小闭环」定位不符 | E3（ADL-009/032/039） |
| 运行形态错配 | 当前 Web/Chrome 形态不在 Electron 主进程内，改 `apps/desktop` 对日常 Web 使用不生效；要让 Web 形态出系统通知需独立常驻进程，再次撞常驻禁令 | E2 + E4 |
| 离线/凭据 | 邮件/出站 webhook/手机推送需联网、外部服务与凭据，破坏「无 Key/无网络可用」底线 | E3（ADL-009/032） |

---

## ④ 三路线对比表

> 代价/收益/风险均按「当前单用户、本地离线、Web/Chrome 形态、不改上游」基线评估。

| 维度 | **路线 A：宿主级主动推送**（OS 横幅/托盘角标/手机通知） | **路线 B：应用内 / 打开面板即派生**（现状，ADL-039） | **路线 C：不做**（H6 维持悬置、不补） |
|---|---|---|---|
| 机制 | 到点由 OS/外部渠道主动触达人（需常驻/外部通道） | 打开面板/跑命令时纯函数现算逾期/临期，读时派生、零写 | 什么都不加，缺口保留 |
| 宿主现有通道 | **无**：无系统通知/邮件/出站 webhook/托盘角标；schedule 到期只进原会话 | 已具备（`core/reminders.computeReminders`、`/pm due`、Web ReminderStrip、K11 补记队列） | 不依赖 |
| 代价 | 高：改宿主 Electron/建独立常驻/接外部服务；需联网与凭据；需真实验收 | 零新增依赖；已落地，仅维护 | 零 |
| 收益 | 人不在场/关闭 dsh 也能被提醒（H6 目标形态） | 打开即可见、离线、可验收；覆盖「打开后处理」 | 无 |
| 风险 | 破坏离线优先/非常驻基调；升级覆盖；外部服务/凭据依赖；alpha 契约不稳 | 人不在场/关闭时触达不到（无主动触达） | 真实痛点不被解决，K8 主动召回/K11 定时投递继续悬置 |
| 与 C7 约束 | **直接冲突**（需常驻/常开，违 ADL-039/032） | **符合**（读时派生，非常驻） | 符合 |
| 证据级 | E2（无通道）+ E4（自建路径推断） | E2（现状代码）+ E3（ADL-039） | E3（悬置记录） |

---

## ⑤ 推荐方案与实施前提

### 5.1 推荐：本期选路线 B，不立项路线 A（默认拍板 = 维持现状）

- **理由（E3/E2）**：宿主 Web 形态无任何外部通知渠道（E2 ②）；路线 A 与 ADL-039/ADL-032 的常驻禁令直接冲突，且需改外部上游或接外部服务，代价/风险与单人离线 MVP 不匹配；路线 B 已落地、离线、可验收，覆盖「打开后处理」。
- **路线 B 可继续做的强化（均不解除 C7）**：维持读时派生 + K11 补记队列（严重度排序/迟到标识/Top1 折叠）+ 二态静音；这些都在应用内、零常驻。**〔E3 现状 + E4 范围推断〕**

### 5.2 路线 A 的触发条件（拍板项，须全部满足）

1. **解除 C7（前提）**：所有者书面接受常驻后台/宿主常开（及可选联网、外部通知服务/凭据），以新 ADL 正式 supersede ADL-039、ADL-032 的常驻/调度禁令。**〔E3 约束；流程为 E4〕**
2. **通道可达且形态明确**：
   - (A1) Desktop Electron 路线：确认日常使用打包版，改 `apps/desktop` 主进程加 Notification/Tray badge IPC（E2 现状无此 API）；或
   - (A2) 外部独立通道：launchd 常驻脚本 / 外部 webhook / 邮件服务，需联网、凭据与外部服务维护（E4 推断，E5 外部服务细节不可验证）。
3. **接受成本**：改外部上游/维护外部服务的升级覆盖与长期维护成本。**〔E2/E3〕**
4. **可验收**：提供可用通知/模型凭据，按独立增量做真实验收（沿用 ADL-032 解除口径）。**〔E3〕**

> 条件未全部满足 → **维持路线 B，H6 保持「未实现」，不标注为已实现**。

### 5.3 路线 C 的定位

路线 C 不单独作为备选，而是路线 B 在「条件未满足」时的默认声明：**本期不补主动触达，继续悬置**，K8 主动召回、K11 定时投递 leg 继续绑定在 H6 里程碑上等待拍板。**〔E3 + E4〕**

---

## ⑥ 未实现声明（门禁要求）

- **H6 常驻主动推送本期未实现、本期不立项、本期不标注为已实现**；本文件仅是立项前调研，未产出任何推送/调度/后台代码。**〔E3 设计示意现状 + 本调研边界〕**
- 本调研**未编写/修改任何 src/ 或配置代码、未启动进程、未向 3172 实例注入能力、未重启/未写实例**；仅新增本调研文档。
- 未验证项（E6）：3172 实时挂载包清单与确切版本、Desktop 打包版是否为日常形态、运行实例是否挂载 `ctx.schedule`——本次只读权限下未实测，留待有权限/实例在线时补查，本文件不据此下结论。

---

### 附：本调研引用的关键位置索引（E2）

| 结论 | 文件:行 |
|---|---|
| cordis 无定时器导出 | `node_modules/@deepseek-ai/cordis/lib/index.js:1829` |
| notification 帧=助手流（非系统通知） | `dsh-api-session-controller/lib/client.js:372-375,451-457` |
| Notifier=应用内订阅批处理 | `dsh-api-session-controller/lib/types/client/sessions/notifier.js` |
| sidebar.toggle.badge=应用内非交互标记 | `dsh-client-ui-sidebar/.../contract/slots.d.ts:17-22` |
| 布局插槽全为窗口内区域 | `dsh-client-ui-layout/.../client/index.d.ts:44-112`；`client.js:64` |
| CommandDescriptor 仅 name/description/input | `dsh-commands/lib/types/types.d.ts:55-63` |
| notifyDeclaration=生命周期内部 | `dsh-client-ui-slots/lib/index.js:564-566` |
| schedule 到期只进原会话、非推送 | `~/Projects/dsh-pm/deepseek-harness/packages/schedule/README.zh.md:12`；`schedule/schedule/README.zh.md:12,26,65`；`docs/subsystems/schedule.zh.md:146,148,436,454` |
| Electron 仅自更新通知/静态托盘 | `apps/desktop/package.json:65`；`src/update-attention.ts:43,39`；`src/tray.ts:23` |
| webhook=入站建会话 | `packages/experimental/webhook/README.zh.md`；`webhook-github/src/index.ts:14` |
| 本仓插件注入面 | `packages/dsh-pm-tool/src/index.ts:62,154`；`src/client/index.tsx:12,32,37` |
| C7 历史约束 | `docs/decision-log.md:148-153(ADL-039),204-208(ADL-032),346-354(ADL-009)`；`deep-integration-v2-p0-dev.md:150` |

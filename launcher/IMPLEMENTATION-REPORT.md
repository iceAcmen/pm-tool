# 本地 PM 启动器 · 实施报告（可核交付记录）

> 本文件是可独立核查的交付记录，与 README（使用说明）、聊天消息相互独立。
> 路径 **B**（无官方 tab 内登录 / loopback 回调；S4 由用户自确认）。
> 生成日期：2026-10-20。本批未改代码、未 push、未启动/停止正式服务。

## 1. 定位信息（绝对路径）

| 项 | 值 |
|---|---|
| 工作区 worktree（绝对路径） | `/Users/bytedance/Library/Application Support/DoubaoWork/Default/.doubaowork/agent_mode/workspace/.sessions/38446250805701122/agents/s_000EAVADW57/worktrees/pm-launcher` |
| 启动器包目录（绝对路径） | `/Users/bytedance/Library/Application Support/DoubaoWork/Default/.doubaowork/agent_mode/workspace/.sessions/38446250805701122/agents/s_000EAVADW57/worktrees/pm-launcher/launcher` |
| 分支 | `feat/pm-local-launcher` |
| 基线 | `ee52d9e`（= origin/main） |
| 本批 commit | `e7c5238`（feat core+loopback+control页，路径B七态）；`244f197`（docs 实施报告）；`3f9cbda`（fix P1：cancel 回收未就绪 owned 子进程 + STARTUP_ABORTED 保持 S0）；`0cb34d7`（fix F-M1：loopback CSRF 加固 Host/Origin/JSON/内存 nonce） |
| 推送 | **未 push**；无 force；历史未改写 |
| 已读产品合同（绝对路径） | `/Users/bytedance/Library/Application Support/DoubaoWork/Default/.doubaowork/agent_mode/workspace/.sessions/38446250805701122/agents/s_000EAVADfXc/artifacts/本地启动器-形态状态合同-20261020.md` |

## 2. 范围标清（Path B / 36 tests）

**本批实现（在授权范围内）**
- 七态状态机 S0 idle / S1 running / S2 starting / S3 opened待鉴权 / S4 authenticated / S5 auth-required / S6 failure（+ closed）。
- 无 cookie 的本地探测、决策、浏览器发现/回退、owned 控制器、loopback control 服务、control HTML 渲染、可执行入口。
- 容器 = 普通浏览器 tab + 127.0.0.1 loopback control 页；**未引入** Electron / Tauri / WKWebView / 原生壳；红绿灯/齿轮纯装饰 aria-hidden。

**明确不做 / 不在本批**
- 不造官方回调身份；不实现路径 A（待上游受支持回调）。
- 不改工作台页面、不改公共 UI；DSH 全程只读。
- 真机浏览器目视/点击未在本批执行（独立测试门）。

**核心不变量（关键）**
- **S4 authenticated 只由用户点「我已进入工作台（用户确认已进入）」到达；启动器不做程序化 authenticated 自判。**
- S3（已投递待鉴权）**禁止**宣称「已打开/成功」；发送 open 命令不计为认证成功。
- S5 只由**用户反馈**看到登录/认证错误触发；服务探测 GET（无 cookie）的 401 是身份匹配的鉴权墙，**不得**据此判定某浏览器未登录。
- owned 一次性令牌仅内存、首投一次即弃、**不跨 profile/新浏览器重放**；不读/注入 cookie、不代填、不禁 auth、不读凭证。
- 取消仅回收「自己拉起、尚未就绪(ready)」的 owned 子进程（SIGTERM+有界等待）；已就绪服务、现网、未知 PID 一律不杀；关闭 control tab 不停服务；不争 3172；不 kill 占用进程。

## 3. 测试 / 验证证据（真实命令，非 module-missing）

命令均在启动器包目录执行：

```bash
cd .../pm-launcher/launcher
npm test        # node --test 五个测试文件（含 cancel 竞态）
npm run verify  # node scripts/verify-launcher.mjs（隔离假监听者）
```

| 检查 | 结果 |
|---|---|
| `npm test` | **36 tests / 36 pass / 0 fail**（原 23 + P1 竞态 6 + F-M1 loopback 安全 7） |
| `npm run verify` | **PASS**（隔离假监听者；未碰 3172、未读 cookie、未读凭证） |
| 全部源码/脚本/入口 `node --check` | 语法通过 |
| verifier-hub `rubric check-file-format`（README.md） | passed |

测试覆盖（36 例）：七态状态机转移、探测分类（200 / 识别出的 401 鉴权墙 / conflict）、决策（open-existing/start/safe-failure）、S3 待鉴权不宣称成功、S4 用户自确认、S5 用户反馈、S6 安全失败不 kill、浏览器发现/回退、控制器内存捕获/即弃/拒绝 stop、loopback GET/POST 行为、control HTML 浅深 token/脱敏/转义；**P1 竞态 6 例**：cancel(ready前) SIGTERM 回收未就绪 owned 子进程、ready 后 cancel 不杀已就绪服务、重复 cancel 幂等只回收一次、启动失败(超时)后 cancel 为 no-op、编排 STARTUP_ABORTED 保持 S0 不转 S6 不投递浏览器、隔离真实假子进程 SIGTERM 后真实退出；**F-M1 loopback 安全 7 例**：foreign Host 403、evil Origin 403、null Origin 无 nonce 403、text/plain 拒绝、合法 same Origin+JSON 200 且无 CORS 头、无 Origin 无 nonce 403/正确内存 nonce 200、GET /api/state 只读不含 token。

原始测试证据日志（绝对路径）：
`/Users/bytedance/Library/Application Support/DoubaoWork/Default/.doubaowork/agent_mode/workspace/.sessions/38446250805701122/agents/s_000EAVADW57/worktrees/pm-launcher/launcher/evidence/green-run-20261020.log`

### 红 → 绿记录
- 红：先写合同红用例，实跑 `ERR_MODULE_NOT_FOUND: src/launcher-core.mjs`（合同已立、实现缺失）。
- 绿：实现 core / 控制器 / 编排 / loopback / control HTML 后，23 例全绿 + 隔离自检 PASS。早期红证据日志已在转绿后移除。

### P1 独立设计审查返修（commit `3f9cbda`）红 → 绿
- **红（修前实跑）**：
  1. cancel(ready 前) 仅置 aborted 标志，留下自己尚未就绪的 spawn 子进程，无 SIGTERM、最终等待超时；
  2. 编排 catch 把 `STARTUP_ABORTED` 也转 S6，异步覆盖取消——实测 `expected S0 actual S6`，且误投递风险。
- **绿修复（精确所有权 + ready 守卫）**：
  1. 控制器仅对「自己拉起 && 未就绪」的 owned 子进程 SIGTERM + 有界等待；ready 后/现网/未知 PID 不杀；重复 cancel 幂等只回收一次；就绪轮询节拍固定 macrotask，避免微任务 sleep 饥饿外部 cancel；就绪判定与取消并发时已取消按未就绪回收、不置 ready。
  2. 编排 catch 识别 `err.code === 'STARTUP_ABORTED'` 直接返回，保持 cancel 已置的 S0，不转 S6、不投递浏览器。
- **测试**：新增 `test/cancel.race.test.mjs` 6 例真实控制器 + 真实编排竞态（非 stub 状态机）；隔离真实假子进程为自拉起瞬时 node，SIGTERM 后真实退出，不碰 3172、不启正式 DSH。修后全量 29/29、verify PASS。

### F-M1 独立安全审查返修（commit `0cb34d7`，Medium 关闭）红 → 绿
- **审查发现（修前实跑红）**：loopback `POST /api/action` 缺 Origin/Host 校验，跨站 `text/plain` 简单请求与 DNS rebinding 可触动作；修前 evil/null Origin、foreign Host、text/plain、无 Origin 无 nonce 均返回 200 并触发动作。**注意：本项为本次新发现并修复，不宣称此前「原本已安全」。**
- **修复**：
  1. Host 白名单：仅 `127.0.0.1:<boundPort>` / `localhost:<boundPort>`，拒绝未知 Host（防 DNS rebinding）。
  2. POST 须 same Origin（`http://127.0.0.1:<port>` / `http://localhost:<port>`）+ `application/json`；`text/plain` 返回 415。
  3. 无 Origin（CLI/curl 非浏览器）不默默放行，须带受控内存 nonce（`x-csrf-nonce`，timingSafeEqual 常量比较）；nonce 每实例随机、仅内存、与 DSH token 完全分离，不落盘/不写日志。
  4. 不开 CORS（不发 Access-Control-Allow-*）、不放行 OPTIONS preflight；GET `/`、`/api/state` 只读不触达动作；响应加 nosniff / no-referrer。
- **测试**：新增 `test/loopback-security.test.mjs` 7 例真实 loopback IO（临时端口）；修后全量 36/36、verify PASS。原用户 auth/cancel 语义未改，不读 cookie。

## 4. 已读合同要点（采纳）

依据已读《本地启动器-形态状态合同-20261020.md》：
- C-1 纯浏览器承载，禁止 native 框架；C-2 真实探测/回调/用户确认驱动，定时器只用于 S2 视觉进度；C-3 键盘可达、Esc、3px 焦点环；C-4 浅深 token + prefers-reduced-motion；C-5 凭证仅内存；C-6 关窗不停服务；C-7 装饰不冒充原生；C-8 不停止未知进程。
- 状态拆分为 opened(S3) 与 authenticated(S4)，新增 auth-required(S5)；401 硬禁令：不把 S3 当 success、不重放一次性令牌、不注入 cookie、不吞 401、不把复用 clean URL 误当复用他人会话。
- 路径 B：无回调时 S4 用户自确认，唯一阻塞单列不隐藏。

## 5. Security 扫描记录

- 扫描命令：`grep -rniE "secret|password|api[_-]?key|cookie=|authorization:|bearer" launcher/`（剔除合规否定句）。
- 结果：**无命中**；无 `node_modules`；无密钥/配置文件入库；测试内仅出现 `MemToken`/`OneShot`/`Mock` 类伪造样例，非真实凭证。
- 令牌边界：authenticatedURL（含一次性令牌）只存在于控制器内存，投递后 `forgetAuthenticatedUrl` 即弃；不写日志、不落盘、不进可序列化状态/HTML。

## 6. GUI / 真机验证状态（如实标注，未自验 PASS）

- 真机浏览器目视、点击、浅深/Esc/reduced-motion 走查属**独立测试门**；本批在 agent 非交互会话执行，无 GUI 自动化授权，**未发起真实开窗口，未自验 PASS**。
- 入口使用系统 `open` 命令，需用户在本机会话执行 `npm start` 独立走查七态。
- 布局截图检查：本报告为 markdown（无版式截图适用）；control HTML 的真实视觉布局待真机门验证，本批不以静态截图冒充真机结论。

## 7. 环境与边界复核（行动前/后均复核）

| 项 | 复核结果 |
|---|---|
| 正式服务 127.0.0.1:3172 | 全程复用，**未停未杀**；复核时仍为 node PID 44388（argv 为 `--profile pm --host 127.0.0.1 --port 3172 --no-open`） |
| DSH 仓 | 只读，零改动 |
| caffeinate | 运行中，未触碰 |
| 端口争端 | 无；未在 3172 起新服务 |
| 禁止项 | 无 force、无 token/密钥/cookie/数据缓存入库、未关闭 auth、未共享 cookie、未乱杀端口 |

## 8. 文件清单（feat e7c5238 + fix 3f9cbda）

- `.../launcher/bin/pm-launcher.mjs`（可执行入口）
- `.../launcher/src/launcher-core.mjs`（探测/决策/令牌解析脱敏/spawn 参数/七态状态机）
- `.../launcher/src/probe.mjs`（无 cookie 探测，缝可注入）
- `.../launcher/src/dsh-controller.mjs`（owned 内存捕获/即弃；cancel 仅回收未就绪 owned 子进程 SIGTERM+有界等待，ready/现网/未知 PID 不杀；stop 拒绝）
- `.../launcher/src/browsers.mjs`（发现/回退）
- `.../launcher/src/panel-model.mjs`（状态→视图模型）
- `.../launcher/src/control-html.mjs`（自包含 control HTML）
- `.../launcher/src/loopback.mjs`（127 临时端口 control 服务；Host 白名单/Origin/JSON/内存 nonce，无 CORS，GET 只读）
- `.../launcher/src/launcher-app.mjs`（编排；STARTUP_ABORTED 保持 S0，token 不进状态）
- `.../launcher/scripts/verify-launcher.mjs`（隔离自检）
- `.../launcher/test/`（6 个测试文件，36 例；含 `cancel.race.test.mjs` 6 竞态、`loopback-security.test.mjs` 7 安全例）
- `.../launcher/README.md`（使用说明）、`.../launcher/IMPLEMENTATION-REPORT.md`（本记录）

## 9. 唯一阻塞（路径 B 单列，不隐藏）

**跨浏览器 profile 的一次性令牌不可复用，启动器无法程序化判定鉴权成功。** 只读穷举 DSH：无 `--token`、无 DSH_TOKEN、无 print-url/status/inspect/reopen CLI、无未认证 localhost 回调/健康端点；官方 Desktop 的 authenticatedUrl 仅进程内 IPC 取得、cookie 留其会话。故换新浏览器/新 profile 打开必然 401，本批以用户自确认 S4 收口；若上游未来提供受支持 tab 内登录/loopback 回调，可切路径 A。

# PM 工作台本地启动器（launcher/）

> 路径 **B**（无官方 tab 内登录 / loopback 回调；S4 由用户自确认）。
> 容器 = 普通浏览器 tab + 127.0.0.1 loopback control 页；**不引入** Electron / Tauri / WKWebView / 原生壳。
> 本工作包只含启动器代码、配套测试与本文档；不改工作台页面、不改公共 UI；DSH 全程只读。

## 1. 状态机（七态 + closed）

| 状态 | 触发（真实信号） | 要点 |
|---|---|---|
| S0 idle / 未启动 | 端口探测失败 | 「工作台尚未启动」+ 主按钮「打开 PM 工作台」+ 打开方式选择 |
| S1 running / 已运行 | 端口可达且身份匹配（200，或识别出的 dsh 401 鉴权墙） | 只代表端口可达，**≠成功**；「将打开现有服务，不重复启动」 |
| S2 starting / 启动中 | 需启动时用户点打开 | 三步清单 + 进度 + spin；「取消打开」仅放弃在途，不杀已启动 PM |
| S3 opened / 已投递待鉴权 | 已向所选浏览器发出 URL | 「已在浏览器投递，等待确认」；**禁止宣称已打开/成功** |
| S4 authenticated / 打开成功 | **用户点「我已进入工作台（用户确认已进入）」** | 启动器不做程序化已认证自判 |
| S5 auth-required / 未登录 | **用户反馈**看到登录/认证错误（非探测推断） | 「已打开，但当前浏览器未登录」；完成登录 / 换已登录浏览器 / 折叠诊断 |
| S6 failure / 启动失败 | 端口占用 / 身份不匹配 / 启动超时 | 白话原因 +「没有停止任何程序」+ 重试 / 查看详情折叠 / 返回 |
| closed | 关闭 control 页 | 不停止后端服务 |

转移：S0/S1 →(打开)→ S2（需启动）或 S3（直接投递）；S2 完成 → S3；S3 →(自确认)→ S4；S3 →(用户反馈)→ S5；S5 →(重试/换浏览器)→ S3；占用/身份不符/超时 → S6；S6 →(重试)→ S2/S3、→(返回)→ S0；S2 取消 → S0。

## 2. 认证安全模型（红线）

- 正式受支持入口：dsh web 启动 stdout 打印 `dsh web: <base>/?token=<进程内存一次性令牌>`；首访带令牌 URL 由服务端 303 种 HMAC 签名、HttpOnly、SameSite=Strict cookie，之后只认 cookie。
- 启动器**不**自造/复刻签名、**不**关闭 auth、**不**读/复制/注入浏览器 cookie、**不**代填令牌、**不**读取凭证库。
- owned 实例的 authenticatedURL（含一次性令牌）**仅内存**：首投所选浏览器一次后即弃，**不跨 profile/新浏览器重放**，不落盘、不写日志、不入仓。
- 服务探测 GET 不带 cookie；探测到的 401 是「身份匹配的鉴权墙」，**不得**据此判定某浏览器未登录；S5 只由用户反馈触发。
- 不 kill 占用进程、不争 3172；取消仅回收「自己拉起、尚未就绪」的 owned 子进程（SIGTERM+有界等待），已就绪服务/现网/未知 PID 一律不杀。
- control loopback 加固：Host 白名单仅 `127.0.0.1:<port>`/`localhost:<port>`（防 DNS rebinding）；POST `/api/action` 须 same Origin + `application/json`，无 Origin（CLI）须带受控内存 nonce；不开 CORS、不放行 preflight；GET 只读；nonce 仅内存、与 DSH token 分离。

## 3. 唯一阻塞（路径 B 单列，不隐藏）

**跨浏览器 profile 的一次性令牌不可复用，启动器无法程序化判定鉴权成功。**
只读穷举 DSH 确认：无 `--token`、无 DSH_TOKEN、无 print-url/status/inspect/reopen CLI、无未认证 localhost 回调/健康端点；官方 Desktop 的 authenticatedUrl 仅进程内 IPC 取得，cookie 留在其会话内。因此换新浏览器/新 profile 打开必然 401，本批以用户自确认 S4 收口；若上游未来提供受支持的 tab 内登录/loopback 回调，可切路径 A。

## 4. 运行（开发/本机）

```bash
cd launcher
npm test          # 36 例单元/集成（假探测/假 open/假控制器 + cancel 竞态 + loopback CSRF 加固，临时端口）
npm run verify    # 隔离假监听者自检
npm start         # 启动 loopback control 页并在所选浏览器打开（PM_PORT 默认 3172）
```

环境变量：`PM_PORT`（默认 3172，只读探测不争用）、`DSH_CWD`（owned 启动的上游 deepseek-harness 目录，默认本机路径）。

> 真机浏览器目视/点击属独立测试门；本批开发未在真机自验 PASS。关闭 control tab 不停止已运行服务。

## 5. 代码结构

- `src/launcher-core.mjs`：探测分类、决策、令牌解析/脱敏、open 参数、正式 spawn 参数、七态状态机（纯）。
- `src/probe.mjs`：无 cookie 的 TCP+GET 探测（connect/fetch 可注入）。
- `src/dsh-controller.mjs`：owned 实例内存捕获、即弃；cancel 仅回收未就绪 owned 子进程（SIGTERM+有界等待），ready/现网/未知 PID 不杀；stop 拒绝。
- `src/browsers.mjs`：本机浏览器发现 / 选择回退。
- `src/panel-model.mjs`：状态 → 面板视图模型（纯）。
- `src/control-html.mjs`：自包含 control HTML（浅深 token、reduced-motion、Esc、44px 热区、装饰灯 aria-hidden、隐私脚注）。
- `src/loopback.mjs`：仅绑定 127.0.0.1 临时端口的 control 服务（GET /、/api/state、POST /api/action）。
- `src/launcher-app.mjs`：编排（探测/状态/控制器/打开缝），token 不进状态。
- `bin/pm-launcher.mjs`：可执行入口。

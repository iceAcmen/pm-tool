# PM 工作台本地启动器（launcher/）

> 容器 = 普通浏览器 tab + 127.0.0.1 loopback control 页；S4 **仅由受认证工作台 `/api/entered` 有效 nonce 回告到达**，非用户按钮、非程序化自判。
> 本工作包只含启动器代码、配套测试与本文档；不改工作台页面、不改公共 UI；DSH 全程只读。
> 可点击本机入口 = 零编译 `.app` bundle（`npm run make-app`）；工作台投递为所选浏览器普通tab，Chrome显示名映射到真实Google Chrome应用。

## 1. 状态机（七态 + closed）

| 状态 | 触发（真实信号） | 要点 |
|---|---|---|
| S0 idle / 未启动 | 端口探测失败 | 「工作台尚未启动」+ 主按钮「打开 PM 工作台」+ 打开方式选择 |
| S1 running / 已运行 | 端口可达且识别出 dsh 401 鉴权墙（无 cookie 探测恒 401；200/其他状态码身份不明 → Conflict 安全失败，不误开） | 只代表端口可达，**≠成功**；「将打开现有服务，不重复启动」 |
| S2 starting / 启动中 | 需启动时用户点打开 | 三步清单 + 进度 + spin；「取消打开」仅放弃在途，不杀已启动 PM |
| S3 opened / 已投递待鉴权 | OS打开命令exit0（hash携带single-use nonce） | 仅命令接收；真实收页/认证仍待回告，无回告绝不进S4 |
| S4 authenticated / 打开成功 | 受认证 PM 工作台 mount 后 `POST /api/entered` 有效 nonce 回告 | 唯一权威来源；启动器不做程序化已认证自判，无「我已进入」按钮 |
| S5 auth-required / 未登录 | **用户反馈**看到登录/认证错误（非探测推断） | 「已打开，但当前浏览器未登录」；完成登录 / 换已登录浏览器 / 折叠诊断 |
| S6 failure / 启动失败 | 端口占用 / 身份不匹配 / 启动超时 / OS投递失败 | 白话原因 +「没有停止任何程序」+ 重试 / 查看详情折叠 / 返回 |
| closed | 关闭 control 页 | 不停止后端服务 |

转移：S0/S1 →(打开)→ S2（需启动）或 S3（直接投递）；S2 完成 → S3；S3 →(有效 nonce 权威回告)→ S4；S3 →(用户反馈)→ S5；S5 →(重试/换浏览器)→ S3；占用/身份不符/超时 → S6；S6 →(重试)→ S2/S3、→(返回)→ S0；S2 取消 → S0。

### 已进入回告（nonce handshake，与冻结 client 配对）

- 通道：打开 URL 时 hash 带 `#pm-launch=<loopbackPort>.<nonce>`；**不用 query**（上游 303 `location:'./'` 会剥 query、保留 fragment）。client 解析后 `replaceState` 仅清 pm 参数、保留业务 hash。
- nonce：仅内存、single-use、TTL 10 分钟（覆盖首次鉴权/API 配置）、绑定配置的 workbench authority（`PM_HOST:PM_PORT`，非硬编码 3172）；不带 token/cookie。
- 回告：`POST http://127.0.0.1:<loopbackPort>/api/entered`，JSON `{nonce}`，`credentials: omit`；单次请求不内循环重试，失败保留 hash，后续成功 snapshot/刷新补试，2xx 后幂等停止。
- Origin 门：**仅**配置的 expected workbench Origin 可确认；无 Origin、control origin、错 origin、重复/过期/无 nonce/类型错误一律 403（持 nonce ≠ 已认证）。`/api/action` 仍仅 control 同 Origin。

## 2. 认证安全模型（红线）

- 正式受支持入口（上游 `packages/client/connection/src/browser-auth.ts` 实测）：`dsh web` 启动 stdout 打印 `dsh web: <base>/?token=<每进程 launch token>`。launch token 是**每进程内存令牌**（进程存活内可重复呈现、非单次作废、不绑定浏览器/会话）；首访带 token 的 `/` 由服务端 303 种出 HMAC 签名、HttpOnly、SameSite=Strict、按 authority 绑定的持久 cookie（Max-Age），之后该浏览器只认自己的 cookie。
- 启动器**不**自造/复刻签名、**不**关闭 auth、**不**读/复制/注入浏览器 cookie、**不**代填令牌、**不**读取凭证库。
- owned 实例的 authenticatedURL（含每进程 launch token）**仅内存**：首投所选浏览器一次后即弃，**不跨 profile/新浏览器重放**，不落盘、不写日志、不入仓。
- 服务探测 GET 不带 cookie；探测到的 401 是「身份匹配的鉴权墙」，**不得**据此判定某浏览器未登录；S5 只由用户反馈触发。
- 不 kill 占用进程、不争 3172；取消仅回收「自己拉起、尚未就绪」的 owned 子进程（SIGTERM+有界等待）；就绪前启动失败（等待超时/未捕获 URL）同样回收未就绪子进程；已就绪服务/现网/未知 PID 一律不杀。
- control loopback 加固：Host 白名单仅 `127.0.0.1:<port>`/`localhost:<port>`（防 DNS rebinding）；POST `/api/action` 须 same Origin + `application/json`，无 Origin（CLI）须带受控内存 nonce；GET 只读；nonce 仅内存、与 DSH token 分离。`/api/entered` 仅对配置的 expected workbench Origin 响应最小 CORS（无通配 ACAO、支持 OPTIONS preflight），其余 Origin 拒绝。

## 3. 边界与未独立验收项

**启动器读不到浏览器 cookie，也取不到已运行进程内存中的 launch token；** S4 只能等受认证工作台 mount 后回告有效 nonce。client 已冻结接入（`launch-handshake.ts`：解析 hash、仅清 pm 参数、`/api/entered` 一次 POST、无重试、无参数静默）。

Main 已采原始 GUI（仍待独立专家审证）：
- Finder 真实双击临时隔离 `.app`，launcher 自拉起 3199；首次配置后 PM `web snapshot` 成功，receiver 进入 S4。
- 目标 URL 的 `pm-launch` hash 已清除；正式 3172 未动。该采证不等于独立 PASS，最终根入口仍未部署。

上游只读核实（2026-10-20，对照 `apps/cli/src/args.ts`、`packages/bundle/web-app/src/startup.ts`、`browser-auth.ts`、`apps/desktop/`）：
- 无 `--token` flag、无 `DSH_TOKEN` 环境变量；web 内层 flag 族仅 `--host/--port/--public-url/--trusted-host/--no-open/--tls-cert/--tls-key`；launcher 自身仅 `--profile/--from-default-profile/--patch/--dump-config/--dump-config-schema/--dump-default-config` 与 `plugin` 转发；无 print-url/status/inspect/reopen 子命令；无未认证 localhost 回调/健康端点（`/` 与 `/api` 均经鉴权/Host 围栏，仅非 index 静态资源公开）。
- 仓内 `apps/desktop` 为 Electron 官方壳：自拉自有 desktop-host 子进程，`ready.url` 经进程内 IPC 取得，cookie 由 shell 自持并经 `dsh-app://app` 转发，**不外接已运行的 3172 服务**；本机未安装该应用，启动器无法经它接入现网实例。
- 若上游未来提供受支持的 tab 内登录/loopback 回调，可切路径 A。

## 4. 运行（开发/本机）

```bash
cd launcher
pnpm test         # 53例单元/集成，含真实生产OS投递接缝与取消/拒旧/安全断言；模拟OS不是GUI PASS
pnpm run test:control-gui # 7例真实Chrome DOM，隔离HTTP fixture；不代替Finder/认证
pnpm run verify   # 隔离假监听者自检
# 构建可点击 app（零编译、烤稳定 nvm v22、Finder 有兜底、脱敏日志、不写全局）：
node scripts/make-app.mjs <输出目录>                      # 默认 PM_PORT=3172
node scripts/make-app.mjs <目录> --port 3199 --name "PM工作台-隔离验收"   # 构建时绑定隔离端口
pnpm start        # 启动 loopback control 页并在所选浏览器打开（PM_PORT 默认 3172）
```

环境变量：`PM_HOST`（默认 127.0.0.1）、`PM_PORT`（默认 3172，只读探测不争用）、`DSH_CWD`（owned 启动的上游 deepseek-harness 目录，默认本机路径）；`--dsh-home` 仅构建时绑定独立 iso3 `DSH_HOME`，不写 system env/launchctl。

> **3172 入口诚实标注**：默认 3172 app 仅起窗/复用已认证前端；3172 未部署新 bridge 时**不能期待 S4 回告**，停留在 S3 属预期，非主线故障。真实 Finder E2E 用绑定 3199 的隔离验收 app；服务 profile 是否启动由测试者决定，不碰 3172。
> 真机浏览器目视/点击属独立测试门；本批开发未在真机自验 PASS。关闭 control tab 不停止已运行服务。

## 5. 代码结构

- `src/launcher-core.mjs`：探测分类、决策、令牌解析/脱敏、open 参数、正式 spawn 参数、七态状态机（纯）。
- `src/probe.mjs`：无 cookie 的 TCP+GET 探测（connect/fetch 可注入）。
- `src/dsh-controller.mjs`：owned 实例内存捕获、即弃；cancel 仅回收未就绪 owned 子进程（SIGTERM+有界等待），ready/现网/未知 PID 不杀；stop 拒绝。
- `src/browsers.mjs`：本机浏览器发现 / 选择回退。
- `src/browser-open.mjs`：生产OS命令有界等待、错误类别与非零退出反馈，不读命令输出或重放URL。
- `src/panel-model.mjs`：状态 → 面板视图模型（纯）。
- `src/control-html.mjs`：自包含 control HTML（浅深 token、reduced-motion、Esc、44px 热区、装饰灯 aria-hidden、隐私脚注）。
- `src/loopback.mjs`：仅绑定 127.0.0.1 临时端口的 control 服务（GET /、/api/state、POST /api/action、POST /api/entered）。
- `src/launcher-app.mjs`：编排（探测/状态/控制器/打开缝/nonce 内存生命周期/权威回告），token 不进状态。
- `src/local-app.mjs` + `scripts/make-app.mjs`：零编译可点击 `.app` bundle 生成（壳烤稳定 nvm v22 + 仓内启动器绝对路径，Finder 无 nvm 有兜底，失败诚实弹窗，脱敏日志，不含凭据）。
- `bin/pm-launcher.mjs`：可执行入口。

# A15：导入 confirm 隔离故障设施只读建议

2026-10-22，trae；对象：既有 RA-N01 / LG-G05，busy → false → retry 采证。仅建议设施，未实现、未启动或测试，不自签 PASS。Main 唯一 GUI/builder；不进入 A16 panel 域，不改产品、上游、DOM、testing/livingdocs、正式服务或凭据。

## 结论

推荐 **env-only preload 包装真实 Host Connection 的拦截器注册**：首个精确匹配的导入 confirm，等待至少 3000ms，返回真实 RPC 失败；不调用原 Gateway handler。以后所有请求原样委托原 handler，重试由生产命令实际落盘。不是 mock success，也不是把已经执行的结果改成失败。

**当前所读源码不支持“commands/run 是 WS 命令请求”的假设。** 当前入口调用 `remote.commands.execute`；原路由为 `POST /api/commands/execute`，`command/run` 是 Session 生命周期事件。Gateway 的 WebSocket mux 用于 Remote 流；本方法没有 stream mode。没有查到可用的 `harness/command` 或 `command/before-execute` 钩子，不应臆造。

## 确切接口与原链

路径前缀：P=`packages/dsh-pm-tool`；U=`/Users/bytedance/Projects/dsh-pm/deepseek-harness`。

| 位置 | 已读事实 |
| --- | --- |
| P/src/client/index.tsx:20–31 | `executeRaw` 取/建 session，调用 `remote.commands.execute(sessionId, '/pm '+line, [])`；`!result.ok` 和 `kind === 'error'` 抛错；`execute` 提取 text。3242 包软链所指隔离树的同名源码也一致，但未验证实际下发 bundle。 |
| P/src/client/views/tasks.tsx:284–307、1148–1149 | `confirmImport` 同步 ref 防连点、设置 busy，调用 `run(importPreview.confirm)`；false/throw 保留 preview 并显示重试提示，finally 解除 busy。确认串为 `task import-content <pid> <JSON filename> <JSON content> confirm`。 |
| U/packages/client/connection/src/rpc.ts:25–28、52–60、80–91、185–189 | 请求为 `{type:'client-request', rpcId, method, payload}`；响应 `{type:'server-response', rpcId, result}`；失败 `{ok:false,error:{code,message,details}}`。现有 `transportError(new Error(...))` 返回 `gateway/internal`。`intercept('/api', matches, handler)` 返回异步 disposer。 |
| U/packages/client/connection/src/rpc-host.ts:62、89–96、203–224、228–270 | 导出 `HostConnectionService`；`rpc` 是 getter，每次返回带调用 Context 所属权的 `handle/intercept` 闭包。`registerInterceptor` 每 channel 仅容许一个。`rpcFetchHandler` 校验 POST/JSON、路径与 method 一致，再调用 handler；原 framing 负责回显 rpcId。 |
| U/packages/api/gateway/src/index.ts:234–238、424–443、677–694、703–749、1127–1146、1383–1384 | Gateway 已注册 `/api` interceptor，handler 为 `dispatchRpc(endpoint,payload,signal,peer)`；经 `invokeRpc → prepareInvocation → invokePrepared` 调用生产 method。endpoint=`namespace/method`；payload 只能有 `{args: plainObject}`；生产 `execute` 参数名为 `agent,line,submittedAttachments`，signal 由 Gateway 注入。 |
| U/packages/interaction/commands/src/index.ts:263–278、360–430、457–466 | `CommandRuntime extends TypertRemoteService`，namespace=`commands`；`@Remote execute(agent,line,submittedAttachments,signal)`。先 append `command/run`，后调用注册 handler，再 append `command/done`；事件不是可等待的 veto hook。 |
| U/packages/interaction/commands/src/types.ts:81–90、93–117 | Cordis 只声明 `commands/change` 通知；`command/run` / `command/done` 属 SessionEventMap，不是命令前置拦截器。 |
| /private/tmp/pmtool-a13-start-final-20261022.mjs:6–12 | 现有启动适配使用独立 DSH_HOME、文件/备份 root、去掉敏感命名环境变量，复用上游 `--import tsx/esm apps/cli/src/bin.ts`，记录 PID；它没有故障注入。只引用，不执行或改写。 |

## 最小设施建议

1. 独立 preload 从 **宿主实际使用的同一个模块** import 生产 `HostConnectionService`，读取其 prototype 上 `rpc` 的属性描述符；新 getter 先以原 this 调原 getter，保留原 `handle`，只包装返回对象的 `intercept`。必须保留属性描述符、Context/owner 和 disposer，不改任何源码文件。
2. 当 Gateway 注册 `/api` 时，把原 `matches` 不变传给原 intercept，只替换 handler 闭包。不得再注册第二个 `/api` interceptor，也不访问 private `interceptors`。闭包收到已认证且协议校验后的 `(endpoint,payload,signal,peer)`，位于 `dispatchRpc` **之前**。
3. 匹配 `endpoint === 'commands/execute'`、`payload.args.line` 为指定项目/指定 fixture 的完整 `/pm task import-content … confirm`。最好由隔离设施预先计算完整串并做等值比较，不用裸 `endsWith('confirm')` 或全局 substring；CSV 内容本身可能含该词。只匹配明确目标，不拦 preview、snapshot 或其他命令。
4. 一次性 armed 状态在首次匹配时、任何 await **之前**消费，避免双请求都注入；等待至少 3000ms，随后返回 `transportError(new Error('A15 isolated import confirm rejected before dispatch'))`。这是故意故障的真实 `ok:false`；原 transport 负责封装，不手造 rpcId/成功返回。等待需响应 signal，客户端取消时也不得放行。
5. 未匹配和已消费后的请求，原样传四参给原 handler，原样返回结果；不自行调用产品 handler，不重写生产错误，不模拟落盘。设施日志只留注入次数、时间、目标摘要和委托次数，不记录 token、内容或凭据。

备选：preload 包装生产 `CommandRuntime.prototype.execute`，首个指定 confirm 延迟后抛错，以原 this/全部参数委托后续请求。这能在 `command/run` 和产品 handler 前拒绝，Gateway 自行生成失败；**但已进入 Gateway dispatch，只能称业务 dispatch 前，不满足严格 transport pre-dispatch 时不选。** 不要仅包装 `TypertGateway.invoke`：wire 路径调用的是私有 `invokeRpc/invokePrepared`，不会走该 public 入口。

## 实例与交付边界

3242 已有 CSV/XLSX preview 是 Main 输入，不是本轮 GUI 证据。其插件软链指向 `/private/tmp/pmtool-a13-closure-20261022/packages/dsh-pm-tool`。不要向该活进程注入、重启或改 profile。上述 preload 需要在 Gateway 注册前生效，因此本方案需要 **新独立 adapterhost**；它不替代或污染 3242 材料实例证据。

后续只能由 Main 使用已有冻结产物、node_modules 和独立临时 profile/root 启动新 host；Node 22 下沿用已有 `--import tsx/esm`，再加载设施 preload，最后进入原 `apps/cli/src/bin.ts`。设施开关仅该子进程环境生效；不增加产品 env 开关，不写 home/全局，不读/复制凭据。未验证模块解析同一性、profile 已构建产物可用性及新端口，故不提供假定可执行的完整启动命令；先核对 CLI 实际加载的 connection 模块与 preload import 身份，避免包装了另一份模块而无效。

Main 在新实例按既定用例重新 preview，再采集忙态、真实失败、preview 保留、busy 解除和同串重试。失败阶段要绑定“未进入原 handler / 无新增任务”；重试阶段绑定真实 RPC、生产 handler 与隔离 JSON 新增记录且无重复。CSV/XLSX 若各需一次失败，使用各自独立 one-shot 生命周期，不能把仅首个 CSV 失败当 XLSX 覆盖。

本轮仅静态查询，无 build、GUI、services、安装、产品修改、测试执行、提交或推送。未证明浏览器 `run` 最终返回 false、实际延迟、落盘或完整链路；这些仍由 Main 采原证、独立专家判定。

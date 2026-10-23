# A20 slash-only session `/pm` 命令结果正文可见性测试计划与验收合同

> 2026-10-22，平台 `trae`，角色：独立测试专家。本文供 A20 缺陷开发、GUI 采证端与后续独立复验使用；只定义 SOURCE/AUTO/GUI 验收合同，不修改产品、不运行测试或服务、不作 PASS 判定。

## 1. 缺陷事实与本轮边界

既有独立报告 [A20 运行时重进与 GUI 原始证据独立审查](a20-runtime-reentry-gui-independent-review-20261022.md) 已记录：

- 真实 host composer 发出的 `/pm` 请求和成功 `command/done` 可对应，业务命令确已执行；
- 四张真实页面截图与 DOM 均无命令卡或结果正文，`commandCards=0`、`visibleResult=false`；
- 因此“GUI 输入执行”已有有限证据，“GUI 结果正文可见”明确为 FAIL，RA-P0007 整体未关闭。

本轮已确认根因与拟修方向：`packages/dsh-pm-tool/src/client/index.tsx` 监听客户端本地 `command/executed`；仅当 `name === 'pm'` 且 `result.text !== undefined` 时，按事件 `sessionId` 解析其 session scope `actx`，调用 `conversation.input.for(actx).notify(result.kind === 'error' ? 'error' : 'info', result.text)`。宿主公开接口接收 `level` 与 `text` 两个参数，不能传入整个 `CommandResult`。`result.text` 必须逐字透传（包括换行，且不加前缀、不截断）；成功结果的 `text` 可为 `undefined`，此时不回显、不制造替代文案。空字符串不等于 `undefined`，仍按原值调用。InputBar 既有行为会把 `info` 渲染为状态条、把 `error` 渲染为错误 Toast。本合同验证该有限修复，不批准替代页面、解析/重写正文、修改命令后端或上游。

**范围内**

- 有 `text` 的成功与错误 `CommandResult` 正文可见，无 `text` 的成功结果不制造文案；
- 非 `pm` 命令隔离；
- 结果只进入事件所属的正确 session；
- `scope` / `conversation` 缺失时安全降级；
- 插件卸载后监听已释放；
- 工作台面板 `executeRaw` 保持一次执行、一次面板反馈，不因 slash 回显接缝双发。

**范围外**

- 改动 `packages/dsh-pm-tool/src/client/index.tsx` 之外的业务实现、宿主或上游源码；
- 新结果卡设计、Markdown 渲染、历史消息持久化、跨刷新保留；
- A20 文件反思计数、业务落盘与重进不变量的重新验收；
- A20 总门、提交、发布、正式服务切换。

当前合同状态：全部用例 `NOT_RUN`。本文不提供 PASS、提交或发布许可。

## 2. 候选绑定合同

当前读取基线仅用于说明计划来源，不是待验收候选：

- 仓库 `HEAD`：`9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`
- 当前 `packages/dsh-pm-tool/src/client/index.tsx` SHA256：`e5702c69f788e4513a78f2e2861ef87d08f1bfa7ea2dce3807ed600505340f89`
- 当前该文件与 `HEAD` 字节一致；整个工作树仍为多人在途 dirty，不能用 `HEAD` 单独代表候选。
- 旧 A20 冻结候选和旧 `lib/client.js` 只证明旧 FAIL，不是本修复候选。

开发交件后，执行任何 AUTO/GUI 前必须生成新的候选登记，至少包含：

| 字段 | 强制内容 |
| --- | --- |
| 候选身份 | 基线提交、完整 tracked patch SHA256、全部新增文件清单及逐文件 SHA256 |
| 本轮增量 | `src/client/index.tsx` 与必要同域产品测试的路径、bytes、SHA256；若有额外产品文件必须说明必要性 |
| 构建身份 | 隔离构建目录、构建命令/退出码、`lib/client.js` SHA256、构建结束后 source drift |
| 宿主身份 | 实际宿主提交、profile 解析出的插件绝对路径、端口、精确 PID、页面 URL 来源；不得触碰正式端口 |
| 运行身份 | session ID、每条命令的 request/event 标识、时间戳、CommandResult 原始 JSON、截图/录屏与 DOM 证据索引 |
| 保护结果 | 正式数据、共享产物、其他候选与上游零写入；测试临时根及清理/保留状态 |

任一候选源、构建产物、profile 目标或运行实例漂移，受影响结果失效。旧 A20 的业务持久化证据只有在独立 SOURCE 审查确认后端及数据语义未受影响时才可写明继承理由；旧“正文不可见”FAIL 只能由本合同绑定的新 GUI 证据取代。

## 3. SOURCE 用例

| ID | 审查对象 | 验收条件 |
| --- | --- | --- |
| SR-S01 | `src/client/index.tsx` 事件注册 | 监听精确事件 `command/executed`；过滤条件精确为 `name === 'pm'`，不得用前缀、包含或大小写放宽误收其他命令。 |
| SR-S02 | 级别映射与正文透传 | 宿主调用必须精确为 `notify(level, result.text)`，其中 `result.kind === 'error'` 映射 `level='error'`，`success` 映射 `level='info'`；不得把 `CommandResult` 对象传给 `notify`。仅当 `result.text !== undefined` 时回显；不得补造无正文成功文案。已定义的 `text`（包括空字符串）必须逐字透传，不加前缀、不截断、不翻译、不吞换行，也不得重新执行命令。 |
| SR-S03 | session 路由 | 使用事件 `sessionId` 解析对应 session scope `actx`，再以 `conversation.input.for(actx)` 定位通知目标；不得取 `sessions.ids[0]`、当前可见 session 或全局单例作为回显目标。 |
| SR-S04 | 缺失容错 | `scope`、conversation 或输入通知能力缺失时不抛未处理异常、不创建 session、不向其他 session 回退、不重跑命令；允许该次回显安全跳过。 |
| SR-S05 | 生命周期 | 监听由插件/Context 生命周期托管或显式返回 disposer；卸载后不存在活动回调，重复装载不累计监听。 |
| SR-S06 | 面板链隔离 | 既有 `executeRaw` 仍只调用一次 `remote.commands.execute(sessionId, '/pm ...', [])` 并消费返回值；修复不得在该函数内额外 `notify`、额外 execute 或二次包装结果。 |
| SR-S07 | 改动范围 | 不改命令处理器、存储、schema、上游或面板反馈协议；新增测试只能服务本合同。额外产品改动须重新做影响分析并扩充合同后再测。 |

SOURCE 审查必须基于候选完整 diff 与实际依赖类型，不接受只看最终文件或只搜关键词。若运行依赖实际事件形状与本文前提不一致，记 `BLOCKED` 并交回开发澄清，测试端不得自行改产品或放宽 Oracle。

## 4. AUTO 用例

AUTO 应使用完整候选源码和真实 `apply(ctx)`，只替换 Cordis/宿主服务为可观察的隔离桩；不得复制监听函数或 mock 掉被测分支。建议由开发新增同域产品测试，独立专家在自有冻结候选中复跑，不在本文阶段写测试代码。

| ID | 初态与动作 | 必须断言 |
| --- | --- | --- |
| SR-A01 | 装载插件，向监听器发出 `name='pm'`、多行 success `CommandResult` | 仅以事件 `sessionId` 对应的 `actx` 调用一次 `conversation.input.for`；`notify` 仅一次且参数精确为 `('info', result.text)`，正文（含换行和末尾文本）逐字一致，不传整个对象。 |
| SR-A02 | 发出 `name='pm'`、带唯一错误原文的 error `CommandResult` | 不走成功改写、不抛出；对应 conversation 的 `notify` 仅一次且参数精确为 `('error', result.text)`，错误正文逐字一致，不传整个对象。 |
| SR-A03 | 依次发出 `name='help'`、`name='pmx'`、`name='PM'` 等非精确命令 | `for` 与 `notify` 均为 0 次；既有非 pm 宿主行为不被阻断。 |
| SR-A04 | 建立 session A/B 两个不同 conversation；事件 `sessionId` 属于 B，当前列表首项/可见项设为 A | 仅解析 B 的 `actx`，并由 B 执行一次 `for(actx).notify(expectedLevel, result.text)`；A 为 0，未创建第三个 session。 |
| SR-A05 | 分别构造事件 `sessionId` 无法解析 scope、conversation 缺失、input/notify 不可用 | 每个分支均无未处理异常、无远端执行、无 session 创建、无错误路由；其后一个合法事件仍可正常处理，证明监听未被打断。 |
| SR-A06 | 装载后发一条 pm 事件，再卸载 Context，再发同类事件 | 卸载前一次、卸载后零新增；重复装载/卸载两轮时每个有效事件仍严格一次，不累计旧监听。 |
| SR-A07 | 从注册的 panel API 调用一次 `executeRaw('ping')`，remote 返回成功 | remote execute 严格一次，行严格为 `/pm ping`；返回原既有 `{kind,text}`，本地 conversation `notify` 为 0，证明面板直调没有第二条 slash 回显。 |
| SR-A08 | `executeRaw` 分别遇 transport error 与 `CommandResult.kind='error'` | 保持既有抛错语义；每次 remote 仅一次、conversation notify 为 0，不因错误路径双发。 |
| SR-A09 | 同一 pm event 连续发两个有 `text` 的不同结果，随后发非 pm，再发另一 session 的 pm | 每个有 `text` 的合法 pm 事件各且仅回显一次，顺序与事件一致；非 pm 不插入；两个 session 不串线。 |
| SR-A10 | 分别发出 `name='pm'`、`kind='success'` 且 `text` 为 `undefined` 与空字符串的结果 | `text===undefined` 时 `notify` 为 0 次且不生成替代文案；空字符串时仍调用一次 `notify('info', '')`，证明条件是 `text !== undefined` 而非真值判断。 |

AUTO 原始证据至少包含测试名、原退出码、JSON reporter、stdout/stderr、候选指纹与测试双调用计数。控制用例或设施加载失败不得冒充产品 FAIL；产品断言失败不得改 expect 洗绿。

## 5. GUI 用例

GUI 由具备浏览器能力的执行端在**新隔离候选、全新合法 session** 中按下列步骤采集原始证据；执行端不作 PASS 判定。命令必须从宿主 composer 输入，不得直接调用 API 后截图冒充 slash 旅程。

| ID | 操作与初态 | 可观察验收 |
| --- | --- | --- |
| SR-G01 | session A 输入能返回唯一多行正文的成功 `/pm` 命令 | 请求与 `command/executed`/结果事件一一对应；A 的 InputBar 以既有 `info` 状态条显示 `result.text` 完整原文，至少包含首行、末行和唯一标记；只出现一份，不要求新增命令卡样式。 |
| SR-G02 | session A 输入会返回唯一错误正文的非法 `/pm` 命令 | A 的 InputBar 以既有 `error` Toast 显示 `result.text`，正文逐字一致；无成功级别改写、无前缀、无截断、无静默消失、无第二份。 |
| SR-G03 | 建立 A/B 两个 session，停留 B；在 A 执行带唯一标记的 `/pm`，再分别查看 A/B | 正文只在 A；B 不出现 A 标记。切换 session 不改变归属，不以列表第一项代替事件 session。 |
| SR-G04 | 同一隔离实例执行一个非 pm slash 命令 | pm 插件不新增任何回显；宿主原有结果/行为不被重复或替换。 |
| SR-G05 | 打开 pm-tool 面板，通过一个会调用 `executeRaw` 的现有控件执行成功操作 | Network 中只有一次对应 `/api/commands/execute`；面板只有既有的一处结果反馈，conversation 中不再出现同正文副本。 |
| SR-G06 | 面板通过 `executeRaw` 触发一个可恢复错误 | 仍只有一次请求和一处既有错误反馈；没有 conversation 第二份错误、没有重复业务写。 |
| SR-G07 | 在同一页面上下文卸载/禁用测试插件后触发同类本地 pm 事件；若宿主无合法卸载入口则由 AUTO 的 SR-A06 覆盖 | 有合法卸载入口时，卸载后无 pm 回显且页面无未处理异常；无合法入口记 `NOT_APPLICABLE`，不得伪造 UI 操作。 |

每条 GUI 证据须同时保留：

1. 带 session 身份与唯一命令标记的连续录屏或操作前后截图；
2. 对应 request 数量、payload、响应及本地事件中的原始 `CommandResult`，并记录由 `kind` 推导的预期通知级别与逐字 `text`；
3. 页面 body/可访问树或 DOM 文本，证明原文实际可见；
4. console 原始日志；
5. 候选 manifest、`lib/client.js` SHA256、profile 路径、PID/端口和执行时间。

只有 event/raw JSON 而页面无正文，仍按 SR-G01/SR-G02 FAIL；只有截图而无法绑定命令、session 和候选，记 `BLOCKED`。HTTP 200、AUTO、DOM mock 或口述均不能替代真实 GUI。

## 6. 判定与失效规则

- 单条状态只允许 `PASS / FAIL / BLOCKED / NOT_RUN / NOT_APPLICABLE`；当前全部为 `NOT_RUN`。
- SOURCE、所有可执行 AUTO、SR-G01 至 SR-G06 均满足，且证据绑定同一候选后，独立测试专家才可对“slash-only session `/pm` 正文可见修复”作结论。
- 任一原文改写、非 pm 被捕获、错 session、未处理异常、卸载后仍触发、面板双请求/双反馈，均判对应用例 FAIL 并阻塞本缺陷关闭。
- 可执行但未执行或证据无法绑定候选，记 `BLOCKED`，不得转 `MANUAL_PENDING`；本合同不含必须项目所有者本人操作的步骤。
- 修复后若任何产品源码、测试 Oracle、构建产物、profile 目标或运行实例变化，相关证据失效并须重测。纯文档变化是否继承由独立专家记录理由。
- 本缺陷局部结论不自动关闭 RA-P0007 其他层，不签 A20 总门，不授权 commit/push/tag/发布。

## 7. 执行顺序与停止条件

1. 开发交付新候选 manifest 和完整 diff。
2. 独立专家先做 SR-S01 至 SR-S07；SOURCE 不闭合则停止 AUTO/GUI。
3. 在自有冻结候选执行 SR-A01 至 SR-A10；保留原退出码和全部失败。
4. Main/GUI 执行端仅按 SR-G01 至 SR-G07 采集原证，不自行调整步骤或判定。
5. 独立专家复核候选未漂移，再逐条给状态与范围结论。

遇到事件 API 与已确认方案不符、必须修改额外产品文件、无法隔离正式服务、候选漂移或会触碰上游时立即停止并报告具体阻塞。不得为取得绿灯改测试预期、复用旧截图、启动/停止正式服务或修改产品。

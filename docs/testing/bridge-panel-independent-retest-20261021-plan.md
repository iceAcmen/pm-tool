# Bridge 与真实 PmPanel 独立复验计划

> 给 Main 与后继测试专家使用：先行登记本轮源码/AUTO合同、冻结方式、正负对照和禁止动作；不是开发计划或整包放行。2026-10-21，trae，独立测试角色。

## 1 授权与对象

父负责人原句来自 `reports/all-pending-acceptance-execution-20261021.md` §1：“好的，按之前的盘点文档和这个分工方案继续推进，直到把所有没验完的功能全部验完，再把所有代码都提交为止，才算完成任务，中途不要停下来。”

本专家本次明确派单：“独立测试复验，不开发”；“只写docs/testing/bridge-panel-independent-retest-20261021*与自有tmp”；“不install/build/共享lib/启服务/MainGUI/private凭据/commit/push”。父普通提交授权不移交本专家。依 AGENTS §6A、collaboration §9/11、本次范围特批，跳过拉取合并、安装、构建、全量 verify 与 livingdocs 写入；不更改任何其他在途成果。

依据：`docs/testing/reopen-handshake-diagnosis-20261021.md` 完整 §5 与 `docs/plans/2026-10-21-bridge-board-objective-closure.md` §1。使用 writing-plans 的分步计划方法，按本次测试授权收窄目录和动作，不采用开发/提交步骤。

源码对象以产品基线 `2a7603023bc54ef13d788e50069ee3fde4671bf3`、文档 HEAD `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` 加本轮实际字节认领；不是整个 dirty。重点四文件为 bridge、panel、index、bridge test，另单列新 panel test、vitest config、package/lock/tsconfig 与实际复制的导入源码。Main 并行 board/OP 及未来 panel props 不继承本轮 PASS。

## 2 步骤与停止条件

1. 只读规则、原诊断、当前源码及 Main 合成红/绿原件。记录缺件，不从其他 private 根找凭据。
2. 创建唯一自有 `/tmp/pmtool-bridge-panel-independent-retest-20261021.*`，复制公开 `src`、package、lock、tsconfig、vitest config。复制前后核 hash；重点文件若漂移则停相关判定并通知 Main。
3. 只读链接已装 `/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules`。在自有 wrapper 设置 Vite cacheDir 与 Vitest cache=false；不安装，不写共享依赖或 lib。运行 Node22 的现有 Vitest，仅指定测试文件。
4. 不改现有期望，独立复跑 bridge 23 项和真实 PmPanel 5 项。React test renderer 提供真实 hooks/mount/unmount；替身仅 window、history、EventTarget、storage、document、execute/fetch，禁止 mock PmPanel/bridge。
5. 新增本前缀自有测试并复制到 tmp：同 token 并发/失败后重试、同 nonce 跨 port、新 nonce、旧 finally 不撤新在途、N1在途N2及反向完成、业务 hash 和 pathname/search 保留、失败/未就绪门、重复事件、卸载迟到响应、真实复挂、index 注册不回告、存储和日志不含合成 token。
6. 正负对照：自有副本换入 Main 特准只读的旧 bridge/panel，当前测试应复现四 bridge 红与 panel 接线红；另自有副本按明确字符串机械替换 ready 门、卸载响应门、finally 归属，以补充测试检出相应退化。不改任何主树产品。负对照红是探针有效，不是当前产品 FAIL。
7. 每轮保存命令、cwd、Node/依赖身份、起止 UTC、exit/signal、stdout/stderr、逐用例 JSON、源码 before/after、Main 原件 hash。再复跑当前冻结版本确认稳定。
8. 检查重点文件与全部导入副本的主树漂移。结论绑定冻结字节；漂移项与受影响用例分开，不把 Main 并行变化当本专家污染或全量通过。

若真实当前测试失败，立即在本前缀报告/评论反馈 Main，保存原红，不自修产品。设施错误与产品失败分开；修测试设施只能在自有文件留痕后复跑，不覆盖首轮原件。

## 3 验收矩阵

| ID | 操作与预期 | 层 |
| --- | --- | --- |
| B01 | 同 token 两次 ready 共用 Promise；失败保 hash，后续真实调用再发 | bridge AUTO |
| B02 | N1成功后新 nonce/同 nonce新port，分别 POST | bridge/组件 AUTO |
| B03 | N1/N2并行；任一完成不能清另一 token，旧 finally 不清新 flight | bridge/组件 AUTO |
| B04 | 当前业务 hash 变化时旧成功不清业务；成功清 token 保路径/query/业务路由 | bridge/组件 AUTO |
| P01 | 挂载 execute 精确 `web snapshot`；成功前合法 hash不回告，失败不回告 | 真实组件 AUTO |
| P02 | 已成功门内 hash-only N2立即回告；无需伪造额外 snapshot | 真实组件 AUTO |
| P03 | snapshot重新读取在途/失败后关 ready，成功重试再处理当前 token | 真实组件 AUTO |
| P04 | 无 token/非法 token/重复业务 hash零 POST；同 token事件去重 | 真实组件 AUTO |
| P05 | 卸载 listener解除，旧 snapshot不回告；真实新实例待其自身成功才发 | 真实组件 AUTO |
| P06 | index apply/register不触发snapshot/POST，只注册真实 PmPanel | 入口 AUTO |
| S01 | 请求保持loopback、POST、body仅nonce、credentials omit；不人为加Origin/auth | 静态+AUTO |
| S02 | token只在内存/hash/body，不写local/sessionStorage/日志/query/cookie | 静态+组件观察 |
| N01 | 旧公开源码应红，弱化ready/卸载/finally自有对照应红 | 测试敏感性 |
| G01 | 新 build、实际下发/装载、Finder/真实认证N2完整旅程 | NOT_RUN，本轮禁止执行 |

HTTP receiver 的精确 Origin、single-use、TTL 不在本轮运行范围：只核客户端没有改变请求模型，不签服务端/CORS实测。真实组件 AUTO 不是浏览器 GUI，实际 remount 也不是目标 tab 的完整 reload。计划、作者绿、旧 N1 原证均不能代替 G01。

## 4 产物

仅本前缀：计划、本报告、runner、补充测试、冻结 manifest、执行 JSON、原始 stdout/stderr 与 Main 公开原件归档。生成证据由 runner 结构化写入；保留自有 tmp。收尾含有限结论、用例映射、漂移、未覆盖项与交给 Main 的下一证据动作；不更新 livingdocs，不提交或推送。

## 5 执行检查点

- 已完成：规则/完整原 §5/父授权/Main开发归档审读；公开源码冻结前后一致。
- 已完成：现有28项复跑全绿；补充14项在纠正一条过宽设施期望后全绿，共42/42两轮；首轮41/42原证保留。
- 已完成：旧源码独立25绿/17红，其中原28项20绿/8红；ready/卸载/finally自有退化对照分别5/2/2红，均实际exit1。
- 已完成：重点源码/测试/config/package/lock零漂移；冻结全部src零变化。主树tasks视图/CSS与OP测试已并行变化，明确不继承。
- 已完成：有限报告、逐字节归档、语法与最后链接/证据自检；pre-report98/98、final1的105/105、逐轮补充测试原件纳入后final2的119/119，只是证据完整性，不是产品整门。
- 未运行且本轮不执行：新build、全量verify/coverage、装载/下发、真实Finder/浏览器旅程。

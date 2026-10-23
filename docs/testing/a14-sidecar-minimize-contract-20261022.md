# A14 副驾最小化保上下文独立限定审证与修复合同

> 2026-10-22；平台 trae；独立测试专家。父派单与授权全文在[先行计划](a14-sidecar-minimize-contract-20261022-plan.md)。仅新增本前缀文档、测试和审证结果；Main 仍是唯一 GUI/builder。

## 1. 限定结论

**SM-01，P1，产品 FAIL：已成立的既有“最小化保留上下文”缺陷。** A12 frozen 与当前主源码的相关两文件字节相同；点击最小化实际卸载 CopilotPanel，展开重新初始化本地 state。fresh undo 入口丢失不是正常 TaskForm 保存失败，也不能归因于本轮 undo 被执行。

原证显示真 gateway 三步已确认、正常 TaskForm 外改已保存，展开后撤销条缺失；独立 no-cache 真实 React 测试进一步证明，即使**不做外改、仅最小化/展开**，撤销入口仍消失。未发送文本、未确认草稿勾选和编辑值也因同一卸载丢失。

**不签整 RA-AI04。** 本轮没有执行 changed/mixed undo，不签其算法失败或成功；原先 A13 clean 有限 PASS 不覆盖本轮 mixed 路径。本报告只关闭“是否有效缺陷”的争议，未关闭修复/复验门或发布门。

| 对象/用例 | 独立结论 | 证明边界 |
| --- | --- | --- |
| SM-E01，mixed-r4 新三步 apply | 有限确认成立 | 原事件、完整任务字节与新 ledger；不是新全门 PASS |
| SM-E02，主保存成功后 fresh undo 缺失 | FAIL，UI 恢复路径受阻 | 正常 user update/snapshot 与原图；没有 undo 执行 |
| SM-B01，不最小化刷新 | AUTO 控制 PASS | 真实组件 + 归档 transport 桩；保撤销和未发送文本 |
| SM-A01，单纯最小化/展开 | AUTO FAIL | undo 按钮 1→0；组件 1→0→1；model status 1→2 |
| SM-A02，最小化与正常主保存 | AUTO FAIL | 真 TaskForm payload 与归档 update 完全同形；入口及未发送文本丢失 |
| SM-A03，未确认计划上下文 | AUTO FAIL | 步骤 3→0、s2 勾选/编辑值丢失、未发送输入变空；没有 apply/undo |
| 修复后的 SM-G01/02、完整 RA-AI04 | NOT_RUN / 整项仍 BLOCKED，未签 | 必须另认领新候选及 Main 原 GUI 证据，不能拿旧 handle 补做 |

## 2. 候选与实例认领

| 项目 | 实核身份 |
| --- | --- |
| A12 基线 | `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`；不是 dirty 候选的全部身份 |
| A12 tracked patch SHA256 | `29d9a389ef1f7f178dba50f5cff813672f0ea7c5ebf6dc7ad74aebd38269a596` |
| A12 candidate.json SHA256 | `001e8ae335901e819647199b7c35582663be46f8966206ba4b46521a6569f5d8` |
| A12 来源/产物 | [原 manifest](../../reports/all-pending-evidence-20261021/A12/candidate.json)登记的 512 源输入、453 产物逐项一致，实际包 `/private/tmp/pmtool-a12-closure-20261021/packages/dsh-pm-tool` |
| panel.tsx SHA256 | frozen/main 均 `8618d9091d3544a4236e9ae92fa0225e3914ea065b910ff1f3cb55013d0bc506` |
| sidecar-portal.tsx SHA256 | frozen/main 均 `a3a5e70e459fd74b3454757bcd419e7a2e44b8adce41685dc522dcc494c0ab5d` |
| 原实例 | 3241/PID90027，宿主登记 `1142fb74f2bbcc54dc9499054c0448c9b876cbf2`；gateway 3240/PID89884；仅引用归档，不探活 |
| 原浏览器页面 | default context / target `1BBF621A62D3BD5C2F6DA939DFDC7B64`；mixed-r4 各状态均 origin 3241，timeOrigin=`1792616867623`，深色/1440×718/DPR2 |

[source-binding](../../reports/all-pending-evidence-20261021/A13/gateway/source-binding.json)说明 A13 是采集标签，产品仍 A12。[loaded-r1](../../reports/all-pending-evidence-20261021/A13/gateway/loaded-r1/result.json)的 uncached 200 完整下发发生于 `2026-10-21T21:07:51.285Z`，**早于本轮** mixed-r4 ask/apply；页面 timeOrigin 一致。与原 A13 clean 报告里的“事后 reload”不是同一时间关系，不倒推 clean 的首页面。

完整 combo 原响应 SHA256 `e10bf9b3fd69e2c0a8d744c146362a2e1c235e38a0cb5d6059f74cc692c76cda`；A12 client.js SHA256 `3bc4a1723f10e8f0393eceb48841007e52e9ebafdc4b37f98dc0a970151bc3b7`。去末尾调试标记后的 loader 段仅出现一次；不是把 client 文件误说成整个 combo。最终脚本重核实际原响应字节。本轮没有 editor chunk 网络响应，也不以此签真实模型质量/全实例长期存活。

本专家[自有候选与输入](a14-sidecar-minimize-contract-20261022-selftmp/r3/candidate.json)记录了当前 scoped tracked diff、新源文件清单/指纹、原证 198 文件指纹与依赖根；测试只执行 A12 源码副本，不执行并发主树新改动。

## 3. 原旅程与退出码

原证根：[mixed-r4](../../reports/all-pending-evidence-20261021/A14/governance/mixed-r4/)。不是重新恢复旧包里的 handle。新 handle `undo-mvimmdjy-s7p9e4` 对应新 ledger `prv-mvimmdjy-4tzpid`，postimages 为 t1/t1/t2，used=false；历史 ledger 没有被替换。

| 原采集/时间（UTC） | 原退出码 | 审证结论 |
| --- | --- | --- |
| apply，21:30:49.541 | 0 | 新三步真实 batch control 成功，非完成 mixed undo |
| 首 undo 采集，21:31:51.928 | 1 | `Error: visible target missing: 保存`；没有保存/undo 命令，保留设施失败 |
| undo-r2，21:33:03.395 | 1 | `input[name="title"]` 等待 30000ms 失败，events=[]；不冒充保存成功 |
| undo-r3，21:35:35.967 | 1 | `TimeoutError: Waiting failed: 30000ms exceeded`，events=[]；原失败保留 |
| finish，21:36:50.691 | 1 | `Error: fresh undo missing after minimize`；此前正常主保存已成功，是本报告确认的 UI 缺陷观察 |

[apply-command-events](../../reports/all-pending-evidence-20261021/A14/governance/mixed-r4/apply-command-events.json)：seq19/20 真 ask 返回 s1 status/progress73、s2 needs=[s1] assignee=混合撤销测试甲、s3 独立 t2 progress44；seq21/22 按原 baseline 明确 batch apply，返回已应用 3 步；seq23/24 查询新 handle；seq25/26 snapshot、27/28 provenance 与实际落盘对齐。

[finish/command-events](../../reports/all-pending-evidence-20261021/A14/governance/mixed-r4/finish/command-events.json)：seq29/30 对 **t-0001** 的真实 user TaskForm update，assignee 从“混合撤销测试甲”到“外部人工改派保留”；seq31/32 snapshot 与 saved-t1/t2 完整对象相等；seq33/34 model status 是展开重挂载的附随读事件，不是新的 ask/undo。before-save→saved 的全 data manifest **仅 `/pmtool/tasks/t-0001.json` 改变**；t2 原字节不变，ledger 原字节不变，t1 attachments/progressLog 保留。

目视原 PNG：applied、external-correct-draft、minimized-save-reachable、finish/saved、finish/after-expand，共 5 张；另目视 finish compositor `000008.jpg`（主提交中）。applied 可见新撤销条；正确 draft 的 assignee 值已纠正，竖标签可见；最小化状态下“保存更改”可点，保存后正常成功通知，展开后撤销条缺失。全部帧 SHA256 **110/110** 校验，**不是 110 帧全目视**。

`minimized-save-reachable` 时间 21:34:35.909 早于正确 draft；finish 开始时已是最小化态。原图与跨轮状态可接续，但没有把离散截图说成完整连续录到最小化点击。本专家的独立 React 测试直接驱动了同一真实按钮，补的是生命周期因果，不是历史 GUI 录像。

finish 抛错后补充 `after-expand.json/png` 时间为 21:37:17.231；新 ledger expiry 是 21:40:49.246，仍余 **212015ms**。同 page timeOrigin、未到 TTL、所有归档事件内没有非 list 的 ask-undo，排除已录范围内重启/撤销执行/到期解释。只说明原时点 UI 丢入口，**不声称当前服务内存 handle 仍可用**；不读取内存、不 RPC、不撤销。

## 4. 根因与对抗验证

[panel.tsx L1457-L1501](../../packages/dsh-pm-tool/src/client/panel.tsx#L1457-L1501)以 `copilotMin ? button : aside` 二选一，CopilotPanel 只在 aside 分支；最小化不是隐藏，而是销毁子树。[本地 state L219-L235](../../packages/dsh-pm-tool/src/client/shared/drawers/sidecar-portal.tsx#L219-L235)含 input/msgs/steps/rejected/openedAt/undoIds/capture 等；[L449-L454](../../packages/dsh-pm-tool/src/client/shared/drawers/sidecar-portal.tsx#L449-L454)只在本次 runApply 后写入最多三条 UI undoIds。挂载 effects 只读 model status/provenance，后者的历史处理投影不能自动重建 undoIds。

真实 React 18 PmPanel/CopilotPanel/TaskTable/TaskForm 未被 mock；仅 execute/executeRaw transport 回放合法原 ask 文本与归档 snapshot。唯一进入 UI undoIds 的 handle 是隔离桩 `undo-a14-self-only`，没有调用任何 host handler/RPC；测试甚至拒绝对该假 handle 发 undo。FormData 是 headless 值容器，payload 由真正 TaskForm 构造。SM-A02 的业务保存正确性依赖原 GUI/JSON，不由 transport 桩自证业务写算法。

控制 SM-B01 同输入同源码，只刷新不最小化，撤销/输入仍在；SM-A01 **无 TaskForm 外改**也失败，排除“外改合法导致 UI 删除 handle”；SM-A02 正常表单 payload 和历史保留检查先绿，再在保入口/输入处红；SM-A03 尚未确认、零 apply/undo也丢状态。当前 tab 在父 state 中仍在，不能以“tab 保留”代表全上下文保留。React stderr 的 TaskTable 缺 key warning 原样保留，不扩为本合同外的修复要求。

## 5. 最小修复合同

交 Main 在既有缺陷收口范围内认领；**本专家不实施产品修复**。建议仅修最小化生命周期，禁止借此改后端撤销、恢复历史 handle、模型路由或持久化格式。

| 拟由 Main 写的文件 | 最小用途/影响 |
| --- | --- |
| `packages/dsh-pm-tool/src/client/panel.tsx` | 在同一 project/打开会话内保留一个稳定位置/身份的 CopilotPanel；minimized 只隐藏 aside，单独显示竖标签。展开取消隐藏，不重建 state，不自动 apply/undo/ask |
| `packages/dsh-pm-tool/src/client/panel.css`（如用 hidden 方案） | 明确 `.pm-sidecar[hidden] { display: none; }`，放在能覆盖现有 display:flex 的位置；隐藏层不占位、不拦截指针/键盘/无障碍树，不改变主列宽、现有竖标签与浮层尺寸 |
| `packages/dsh-pm-tool/src/client/sidecar-minimize-retention.test.tsx`（新增建议） | 对真实父/子组件补上述三种退化和无最小化控制；Main 自验不代替独立签字 |

可选最小结构：`copilotLayer && project` 的同一稳定 Fragment 内，固定一个 aside/CopilotPanel；竖标签是另一个固定位置的条件子项，aside 使用 hidden。必须实际确认既有 `.pm-sidecar { display:flex }` 不覆盖隐藏；仅 opacity/移出屏幕/遮罩不合格。允许等价的稳定隐藏实现，不要求新组件或全局状态仓库。

**必须保持**：当前模式、未发送输入、已生成消息与计划、勾选/编辑、openedAt 及已有最近三条撤销上下文；最新 tasks/baseline props 正常刷新，外改后仍遵守后端冲突守卫。禁止只补 undoIds 而继续丢草稿，禁止从持久 ledger 把历史/跨重启 handle 捞回当 fresh，禁止重新生成计划来掩盖丢失。

**不在本修复范围**：关闭/ESC/切项目/真正卸载的既有语义、后端 TTL/used/逆序算法、schema/API、自动补偿、新的撤销体系、正式服务/profile。隐藏和最小化后的焦点/滚动/主保存可达需回归，但不是本报告已经实测通过。

## 6. 验证、原设施失败与可重建性

环境 macOS Darwin24.6.0 arm64；既有 nvm Node **v22.23.3**、React/renderer18.3.1、Vitest2.1.9，复用 A12 只读依赖（物理包根另记 candidate）。pnpm 未调用，未 install/build/产品 verify/GUI/服务操作。HOME/TMPDIR/cache 全在本前缀 selftmp；Vitest `--no-cache`，单 fork。

| 本专家命令 | 原退出码/真实结果 |
| --- | --- |
| `node --check docs/testing/a14-sidecar-minimize-contract-20261022-run.mjs` | 0 |
| `node docs/testing/a14-sidecar-minimize-contract-20261022-run.mjs r1` | 1；控制收集失败 `React is not defined`，0 用例；漏复制 JSX tsconfig，三红未运行 |
| 同命令 `r2` | 1；控制失败 `Can't access .root on unmounted test renderer`；不完整非空 ref 桩触发任务滚动依赖，三红未运行；不判产品红 |
| 同命令 `r3` | **1**；控制 exit0/1 passed；SM-A01、02、03 各 **exit1/1 failed**；每次 reporter 的另三项 skipped 是 testNamePattern 的范围排除，不当 PASS |
| r3 原件/字节审证及前后 guard | 对应断言完成；9 类 drift 列表均空，源码/原证/4依赖/公共lib/cache未变化；不声明全机零污染 |
| 本前缀 `finalize.mjs`，最终只读核验 | 结果见[final-r1.json](a14-sidecar-minimize-contract-20261022-final-r1.json)；只复核原证/下发/报告，不重跑产品 |

r1/r2 都保持原冻结脚本/配置/失败输出；设施仅在前缀根修正，再新建 r3，不覆盖旧轮。原 r3 [summary](a14-sidecar-minimize-contract-20261022-selftmp/r3/summary.json)、[evidence-audit](a14-sidecar-minimize-contract-20261022-selftmp/r3/evidence-audit.json)、[observations](a14-sidecar-minimize-contract-20261022-selftmp/r3/observations.jsonl)及四份 command/result/stdout/stderr 可审。

可重建（macOS；已装 nvm Node22；仓库根；选择尚不存在的 rN，不安装/构建）：

```sh
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm use 22 >/dev/null
node docs/testing/a14-sidecar-minimize-contract-20261022-run.mjs r4
```

预期同 A12 控制 0、三合同红各 1、runner 1。如 A12/原证改变，runner 严格中止，不重冻洗掉旧结果。

## 7. 影响与释放

最小化父分支是所有 CopilotPanel 模式/撤销/草稿/capture 共用接缝；修复使相关历史“最小化保留上下文”的证据失效，须用新候选重测。后端未改时 A13 clean 的后端/原字节事实保留，但新前端完整 clean/mixed 旅程不能借旧图放行。

Main 后续先对新候选跑控制与三红转绿；再按 SM-G01/02 新采：新 gateway 三步明确 apply→记录 fresh handle→最小化（原事件/连续帧）→正常 TaskForm 外改主保存→展开仍有原入口且外改保留→明确按钮 mixed undo/重试；另同目标链式 clean 对照。必须新 fixture/本进程 handle，不能 RPC 补当前遗留 handle，也不能恢复旧 handle。记录 candidate/实际 bundle/端口PID/page/原退出码/完整落盘与逐步结果。capture/只读投影、表单取消/失败、隐藏层主操作/键盘、尺寸/滚动亦受影响，按既有合同补相应回归。

**本专家交付与释放**：限定计划、原证审证、真实 React 红、最小合同完成；未改产品或其他 testing/livingdocs，未接服务/GUI/凭据，未撤销任何 handle，未 commit。所有自有测试子进程已退出；不持有 GUI/builder/端口/profile 资源，保留 selftmp 原证不删除。Main 继续 A13 原生文件和已授权其余验收/修复；完整 RA-AI04 仍未签，修复及 GUI 复验另交专家判定。

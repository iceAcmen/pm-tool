# A14 副驾最小化保上下文限定测试计划

> 日期 2026-10-22；平台 trae；角色独立测试专家。先行计划，不是 PASS。从属 RA-AI04，不能签整项或发布门。

## 1. 父派单与边界

负责人原句（本轮派单）：

> 作为pm-tool独立测试专家，接续用户明确授权的全部剩余验收/缺陷收口，角色分离合同。只读产品与原证，先读AGENTS/collaboration §9/11及docs/testing/remaining-governance-cases-20261021.md RAAI04、a13-gateway-clean-undo-gui-review。当前Main已在A12实际host3241/PID90027经真gateway3step apply（A14/governance/mixed-r4）；浮层挡TaskForm保存，Main实际最小化（按钮承诺保留上下文）→正常TaskForm主保存assignee=外部人工改派保留→展开副驾，fresh undo按钮消失，未执行undo。原证reports/all-pending-evidence-20261021/A14/governance/mixed-r4/{apply*,finish,undo-r2,undo-r3,external-correct-draft,minimized-save-reachable}；失败设施轮保留，finish/command-events完整保存正常TaskFormupdate与snapshot/modelstatus。请审A12 frozen与主src panel.tsx条件copilotMin、sidecar-portal.tsx本地undoIds，确认是否有效既有保上下文缺陷；先写限定测试计划/用例，必要自有no-cache真实React测试红（不得改产品）并提出最小修复合同及影响范围。仅写docs/testing/a14-sidecar-minimize-contract-20261022*，不要改其他testing/livingdocs/product，不build/install/GUI/服务/credentials/commit。禁止独立专家用RPC对当前handle撤销；不得用恢复旧handle。Main继续A13原生文件，唯一GUI/builder。报告候选hash/具体原退出码/可重建测试并释放，不能签整RAAI04。

本专家只新增本文件前缀的计划、测试、只读审证 runner、结果与报告。Main 保持唯一 GUI/builder；不读凭据、不接网络、不起停服务、不触碰 handle、不 fetch/pull、不安装或构建、不修改共享档案和其他专家原件、不 commit/push。dirty 并发工作保留。

## 2. 对象、依据与假设

- 原合同：[RA-AI04](remaining-governance-cases-20261021.md)、[A13 clean 限定审证](a13-gateway-clean-undo-gui-review-20261021.md)、[角色分离 §9](../collaboration.md#九独立测试门控adl-0452026-10-12-起长期硬规则)、[候选/证据 §11](../collaboration.md#十一深度复盘后的执行合同与证据规则adl-0572026-10-21)。
- 既有保上下文承诺：真实按钮 aria-label 与源码注释；[体验合同 §3.1](../design/p0-p3-experience-repair-contract-20261018.md)及[B 交接 §2.1](../design/b-handoff-d-20261018.md)。不借尚未生效的设计门禁提议扩大全矩阵。
- 产品目标为 A12 frozen `/private/tmp/pmtool-a12-closure-20261021/packages/dsh-pm-tool`，基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，候选 manifest 与 patch 各实核 SHA256。Main 当前源码仅比对 `client/panel.tsx` 与 `client/shared/drawers/sidecar-portal.tsx`；不同则分别报告，不把 HEAD 当 dirty 候选。
- 运行原证为 mixed-r4 3241/PID90027、A13 既有 source-binding/environment/loaded-r1。只关联归档时点，不重新探测存活或倒推历史装载。
- 待证假设：`copilotMin ? tab : aside/CopilotPanel` 导致真实 React 卸载；重新展开初始化 `undoIds=[]`，挂载只读取 model status/provenance，不重新找回本轮 UI 撤销上下文。普通 TaskForm 保存只是旅程中的合法外改，不应承担丢失副驾上下文的责任。
- 对抗解释：TTL 过期、宿主重启、undo 已执行、恢复历史 handle、错误 runner/错误保存对象、只有文字观察。逐项用原事件、时间、完整 JSON、页面原图及组件生命周期检验；不把“按钮缺失”推成服务端 handle 已失效或 changed/mixed undo 算法 FAIL。

## 3. 限定用例

| ID / 层 | 初态与动作 | 显式提交点与预期 | 证据/执行者 |
| --- | --- | --- | --- |
| SM-E01 / 原证 | mixed-r4 ask 三步，同 t1 两步、独立 t2；读取 apply events/落盘/截图 | 真 batch apply 与 ask-undo list 成功，新 handle 与新 ledger 对齐；不取历史恢复 handle | 专家只读审证 |
| SM-E02 / 原证 | 保留首 undo、r2、r3 的失败；正确 draft → 实际最小化 → 主 TaskForm 保存 → 展开 | task update seq29/30 对 t-0001 assignee 明确提交；snapshot seq31/32 对齐 saved JSON；无 ask-undo 执行事件；入口不应因最小化消失 | Main 已采原证；专家审图/JSON |
| SM-B01 / React 控制 | 真实 PmPanel/CopilotPanel + 归档合法三步文本和任务对象；测试 transport 返回隔离 `undo-a14-self-only` | 经真实组件 send/批确认生成 1 个撤销按钮；不最小化，正常父快照刷新后仍保留；禁止任何 undo 请求 | 专家新自有测试，不是 GUI/服务算法验收 |
| SM-A01 / React 红例 | SM-B01 同态，点击真实“最小化…保留上下文”→“展开…保留此前上下文” | 预期原撤销入口仍在，model status 不因展开重挂载；仅显示切换零业务写、零 undo 调用 | no-cache 自有副本；对生产 UI 生命周期断言 |
| SM-A02 / React 红例 | 应用后输入未发送文本；正常 TaskForm 编辑 t1；最小化→主保存 assignee→展开 | 预期实际表单 payload/快照改派保留、历史资料不丢、未发 ask/undo、撤销入口和未发送输入保留 | 表单 transport 为隔离桩；真实 TaskForm/父刷新；业务正确性由原证支持 |
| SM-A03 / React 红例 | 新计划未确认，取消某一步勾选、编辑标量、输入未发送文本；最小化/展开 | 草稿步骤、勾选、编辑与输入保留；零 ask-apply/undo；当前 tab 不变 | 不将此自动层升级为真实 GUI 分支 PASS |
| SM-G01 / 修复后待采 | 新认领修复候选、全新合法本进程 gateway apply handle；正常外改与最小化展开 | 保入口、主保存可点、无自动写/undo；Main 按后续明确派单采连续原事件/帧/落盘 | 本专家不执行；当前 NOT_RUN，不是 MANUAL_PENDING |
| SM-G02 / 修复后待采 | SM-G01 的新 handle 与外改，另 clean 对照 | 只能经真实明确按钮按 RA-AI04 执行；changed 拒覆盖、独立项可撤销与 mixed used 重试沿原合同 | 属后续 Main 采证/专家审证，不能拿当前旧 handle 补做 |

## 4. 测试设施与写根

1. 先完成原证冻结认领、源码/产物 manifest 校验及 React 依赖可用性检查。缺依赖不得安装，记 BLOCKED。
2. runner 仅在 `docs/testing/a14-sidecar-minimize-contract-20261022-selftmp/rN/` 内机械复制 A12 `src` 和测试文件；已有 round 拒覆盖。依赖只读复用 A12 node_modules。
3. 以独立 Vitest 配置、`--no-cache`、单 worker、隔离 HOME/TMPDIR/cache 运行真实 React 18 renderer。网络与凭据环境不继承；transport 仅归档文本/对象响应，不调用插件 host/RPC。
4. 先运行 SM-B01 控制；控制失败则归因设施，不冒充产品红。再独立运行三条 SM-A 红例，保各原退出码、JSON reporter、stdout/stderr。
5. 输入、A12 源/产物、相关主源码、依赖及公共 lib/cache 前后核指纹；Main 源码并发漂移分别记录，不清理、不重新冻结旧原证。监测范围不等全机零污染。
6. 可重建命令（macOS，已装 nvm Node22；仓库根；不安装/构建）：

```sh
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm use 22 >/dev/null
node docs/testing/a14-sidecar-minimize-contract-20261022-run.mjs r1
```

再次运行必须选未存在的 `rN`。预期控制 0、产品合同红 1；实际结果以独立原输出为准。

## 5. 停止、判定与交接

原证身份不符、冻结漂移、控制失败、依赖缺失或需越界写根则暂停相应断言，保留具体错误。真实截图支持缺陷观察，React 红只解释对应源码生命周期；两者不互替。

若确认最小化卸载丢 state，向 Main 提交仅 UI 生命周期最小修复合同，不自改产品。changed/mixed undo 尚未执行，不签算法失败或整 RA-AI04。交报告、候选 hash、原退出码、重建命令、影响/重测清单后释放本专家资源；Main 继续原生文件及既有剩余授权工作。

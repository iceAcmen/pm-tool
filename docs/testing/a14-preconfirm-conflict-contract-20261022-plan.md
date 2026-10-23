# A14 确认前冲突最小测试合同

> 2026-10-22；平台 trae；独立测试专家。给 Main/开发及后续独立复验使用；本合同在修复之前冻结期望，仅本文件前缀可写，不实施产品修复。

## 1. 授权与边界

负责人原句：

> 独立核对既有确认前外改守卫疑点并先写最小测试合同/必要红，不开发。只写docs/testing/a14-preconfirm-conflict-contract-20261022*；不product/其他testing/livingdocs/build/GUI/services/credentials/commit。读AGENTS/collab、remaining-governance AI04及copilot合同。用户已持续授权既有功能验/确证修复/独立分离。

补充事实：原证实际路径是 `reports/all-pending-evidence-20261021/A14/{candidate.json,final/{loaded,stepwise,conflict}}`，不存在 `A14/candidate/final` 目录。不改变采证步骤或预期来适应实现。Main 继续无关原生/矩阵采证，不覆盖 A14 冻结。

本专家只持有 `docs/testing/a14-preconfirm-conflict-contract-20261022*`；只读产品、A14 冻结及原证、既有依赖。输出包括计划、测试、运行脚本、自有冻结/无缓存输出及报告。不 fetch/pull 合并在途树、不 install/build、不操作 GUI/服务/正式数据/profile/凭据、不 commit；不写其他 testing、plans 或 livingdocs。通用 SOP 的构建、共享档案同步及提交步骤不在本次具体授权中。

## 2. 已生效 Oracle

| 来源 | 现行要求 | 本次使用范围 |
| --- | --- | --- |
| `remaining-governance-cases-20261021.md` §1 RA-AI04 | “同目标链式baseline正确、外部改动拒相关步及依赖、独立继续” | 既有确认前冲突及逐步依赖，不新增产品需求 |
| `copilot-multistep-acceptance.md` §0.6/0.7/0.8、CMP-CONFLICT-01 | 同目标成功链式更新；真实外改按原始 baseline 拒该步和下游；整批/逐步均适用 | 不拿历史后端 PASS 证明当前前端传 base 正确 |
| `product/08-copilot-multistep-design.md` §三 baseline、§六、§十三.3 | “快照时刻 taskId→updatedAt（原样走 --base）”；计划生成基线原样透传，变化只提示不自动再生成 | 最新只读投影与草稿执行基线是两个对象，不相互替代 |
| `decision-log.md` ADL（v0.4.1-integration）、ADL-054.2/.4 | 后端重读并检测 updatedAt；#22 扩实体仍不覆盖外改 | 后续扩实体/K2没有撤销确认守卫 |
| `collaboration.md` §9.1/9.4/9.5、§11.3/11.4/11.5 | 独立判定；源码/产物/实例分别认领；合法 fixture；旧证不能扩大 | 原 GUI 限定审证、新 AUTO 不等新 GUI |

未找到批准“确认时自动接受全部最新 baseline”“提示陈旧后点击整批即授权覆盖外改”或“前置失败仍执行依赖”的决定。普通明确确认不是冲突覆盖特批。本合同也不借待表决设计矩阵增加门槛。

## 3. 最小实验与先行步骤

1. 核 A14 manifest、tracked patch、全部声明源码及产物；冻结真实完整 `src`，不改任何产品副本。来源不符则 BLOCKED，不重新冻结洗掉旧失败。
2. 只读原 `loaded` 完整 uncached combo、gateway BODY、actions/events/raw/frames；记录 hash、原退出码及实际 GUI 时点。原退出码0只表示采集完成，不是产品 PASS。
3. 使用真实 React18 `PmPanel` → `CopilotPanel` / `TaskTable`，只替换浏览器设施和 transport；原 ask 文本、初态/外改后记录来自原证，fixture 通过生产 schema/validatePlan。禁止预先改 runApply/forStepwiseApply。
4. 单 fork、`--no-cache`、HOME/TMPDIR/cache/runtime 限自有前缀；先运行控制，控制失败时不认领产品红。
5. 分别执行红例，保留所有原退出码/报告/观测；完成后核原证、冻结、依赖、主/A11/A12/A13/A14 lib 指纹和 mtime；不把未覆盖根称全机零污染。
6. 独立报告限定 SOURCE/AUTO 与原 GUI 分支；不修产品、不自签新 GUI PASS、不改变整体 RA-AI04/发布门。

| ID | 动作与显式提交点 | 必含期望 |
| --- | --- | --- |
| PC-C01 控制 | 原合法三步生成，不外改，点真实整批按钮 | 一次命令含原生成 baseline；s1/s2 needs原样；生成前零 ask-apply；三步 schema/计划合法 |
| PC-C02 控制 | 原合法三步生成，点真实逐步按钮，transport每步真实形状成功返回 | s1/s2/s3按序独立发送；不是后端/落盘 PASS；用于排除设施无能力执行逐步 |
| PC-A01 必要红 | 原三步生成 → 最小化 → 正常 TaskForm 改 t1.assignee、主保存 → 展开原草稿 → 明确整批 | t1 最新 props已更新、原草稿仍存在、有 stale提示、没有第二次 ask；送出的 t1 base 必须仍为生成时原值，不能取保存后的新值 |
| PC-A02 必要红 | 同一真实草稿逐步执行；第一步获得“kind=success但已应用0步/冲突”的返回，后续snapshot反映正常外改 | 不能把 kind=success 当该步已应用；s2依赖s1不能发送，独立s3继续；不改后端为跨调用永久记忆依赖，不以保留单步needs导致所有依赖误拒作修复 |

PC-A02 的失败返回是**明确标注的 transport 故障注入**，不是伪称原 GUI 已发生失败；只判真实前端是否按“未应用”结果跳过依赖。逐步 clean 原 GUI 全成功不能证明该失败分支。其他跨步时间窗、用户逐次确认 UX 等不凭源码猜测扩修。

## 4. Main 修后复验合同（本次 NOT_RUN）

| ID | 最小真实旅程 | 落盘/命令 Oracle |
| --- | --- | --- |
| PC-G01 原分支复验 | 新候选/新独立实例/新合法 gateway，生成三步 → 最小化 → 正常 TaskForm 改派保留、主保存 → 展开 → 整批 | 第一发送base绑定生成快照；s1冲突、s2依赖拒、s3独立应用；t1外改后全部字段、updatedAt/附件/多修订/软删历史均不再改；t2真实dispatch由updatedAt/命令/新账本证明；只记录applied来源，无自动补偿 |
| PC-G02 clean 对照 | 新合法初态 t1.progress≠73、t2.progress≠44，三步无外改整批 | 同目标成功链式基线，3步应用；不得因固定原始base误拒s2；取消/仅生成零业务写 |
| PC-G03 逐步冲突 | 新草稿；确认前正常外改t1；逐步 | 第一次仍原base；s1未应用，s2不覆盖，s3独立继续；逐步文案/账本与真实落盘一致；不得全部刷新baseline洗白其他待执行目标 |
| PC-G04 受影响回归 | 勾选/编辑/取消/再生成、最小化、clean/mixed undo、四扩展update基线 | 明确再生成才获得新基线；显示继续最新props；保未发送/草稿/现行undo语义；新handle本轮认领，不RPC捞旧handle |

原冲突 fixture 的 s1.progress73、s3.progress44 初态已同值：不能凭值未变证明未执行；原 seq82 的3步结果、真实时间戳推进及账本证明都执行。修后优先新合法非同值初态，并保存完整前后 raw。

## 5. 最小修复建议与停止条件

本轮不开发。建议开发文件限 `packages/dsh-pm-tool/src/client/shared/drawers/sidecar-portal.tsx`（生成快照与确认使用、逐步已应用判断/依赖、仅本次成功目标的链式推进）及必要同域真实 React 测试；如确需纯辅助模块，另认领同域 baseline/helper 与测试。`core/copilot.ts` 的 forStepwiseApply 仅在确证需辅助且不破既有单步协议时考虑；不预定其必须改。后端 `commands/ask.ts` 原有整批守卫不因当前 GUI 错传 base 就扩大修复；不改 schema、模型路由、来源体系、TaskForm、panel最小化架构或其他页面。

开发继承的是已生效合同与最小确证修复授权，不是本专家代授新范围。若存在重要新选择/扩大写面，停止相关扩修，继续不受影响的既有采证。源码修后必须新认领、原测试不降低期望、独立 SOURCE/AUTO 与新 GUI 原证分离审签；本次报告不能作为修后 PASS、整项 PASS、build/服务/commit授权。

## 6. 状态

- 已完成：规则/有效合同/源码与原事件审读；计划在开发前落盘。
- 已完成：自有 A14 原源码冻结；控制0/0、必要红1/1，原失败保留；所列保护根漂移0、独立有限报告落盘。PC01 SOURCE/AUTO及原GUI冲突分支FAIL；PC02 SOURCE/AUTO FAIL，失败分支GUI NOT_RUN。
- 待 Main：修后新实例 GUI、受影响回归及最终整体独立门。

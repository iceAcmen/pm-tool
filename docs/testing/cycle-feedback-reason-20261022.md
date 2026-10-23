# 循环依赖反馈必要红与最小开发合同

> 2026-10-22，trae，独立测试专家，非开发、非 GUI。给 Main/开发修复既有缺陷；本报告不签修后 GUI、整反馈域、全部 commit 或发布。先行范围见[计划](cycle-feedback-reason-20261022-plan.md)。

## 1. 独立结论

**现合同真实产品缺陷成立，有限 SOURCE/AUTO 判定 FAIL。** 合法 t8→t9 后反选 t9→t8 被正确拒绝、业务零写，但返回失去循环原因，生产 ResultCard 又把泛用排查建议误标为“权限不足”。这是错误反馈语义缺陷，不是错误注入、不要求改变 DAG 规则，也不是“失败保稿已通过所以原因可以豁免”。

| 缺陷 | 严重度与定位 | 原因与影响 |
| --- | --- | --- |
| CF-R01 循环原因丢失 | P2；`core/tasks.ts:92..102/343`、`commands/task.ts:817..851` | BFS 实际抛“前置依赖存在循环：任务不能间接地依赖自己”，却是普通 Error，未进入已知业务错误分支；command 返回存储/权限通用排查文字，用户无法知道应解除依赖。 |
| CF-R02 权限原因误导 | P2；`client/result-card.tsx:32` | `isPermissionDenied` 扫整段 `权限/denied/permission/...`，在“请检查…目录权限…”这一建议中命中后追加“权限不足”，把未证实的原因说成事实。 |

P2 只排修复优先级，不默认豁免。未知存储错误保守兜底、合法标题成功、明确权限拒绝应维持原语义。原 O3 保稿/retry合同与现有错误“说因与修法”语义作为依据；未生效设计矩阵、字段 aria 绑定等不新增门。

## 2. 原封包只读审证

原件：[Main index](../../reports/all-pending-evidence-20261021/FeedbackRemainingR1/index.json)、[raw-report](../../reports/all-pending-evidence-20261021/FeedbackRemainingR1/raw-report.md)、[本轮只读审计](cycle-feedback-reason-20261022-audit.json)。Main 最新指令明确原包封存、补件另根，本角色未改其任何内容。

- index SHA `c3bedc14c65cf627432a7055a682ae2dbd074db906fe881c32bdde7fc18afc23`；**230/230**文件 bytes/SHA 相等。
- execution-index 的 **27/27**原 metadata 与文件一致、全部 exited/outputComplete；**6 个原 exit1**保留，不改成通过。49/49 observation 的 at/timeOrigin/cardSummary 回读一致。此处只验归档字节/字段，不签这27次全部行为。
- source-binding 与独立合并声明的 **102/102**相等，主树与原冻结归属逐项 SHA 相同；不是用 HEAD/version 代替 dirty 候选。
- U4r2 client SHA `51234141fa6b34182492dbd294b60cb62320aa68aa8004111d6e5b12a6eee055`；loaded **2597521byte**、SHA `7d4312dae04a9e979246a6cd241fc51e2312c4b15b8ed3361ff2212e67d8b0e1`。
- 仅去 client **末尾** sourceMappingURL 注释并按宿主尾部 LF/分号/LF 归一化，**完整1718689byte**段 SHA `a0e29f76337ed9c509134e520e436bd866848f320ccc5cedd0fe6a4ec84d62c7` 唯一匹配，实际 offset **849342**、second=-1。旧 R1/R2 记录的875361并非本轮实读位置，旧报告不改；完整段SHA相同。本次不是短哨兵或HTTP200证明装载。

### 真实拒绝链

[45真实RPC](../../reports/all-pending-evidence-20261021/FeedbackRemainingR1/45-real-response-events.json)：

- requestId `16824.520`，rpcId `663c0d3d-864e-4388-b18f-8133817702f7`；request/response 关联一致。
- 实际 `/pm task update t-0009`，正文含 `predecessorIds:["t-0008"]`。
- `server-response.result.ok:true` 是命令执行成功送回载体，**内层 `CommandResult.kind:error`**才是任务拒绝。实际原文为“任务操作失败，未返回成功结果；请检查存储配置、目录权限及宿主日志后重试。”
- [46真实retry](../../reports/all-pending-evidence-20261021/FeedbackRemainingR1/46-retry-response-events.json)改为 `predecessorIds:[]`，内层真实 success，并随后真实 snapshot；snapshot 中 t8/t9 同项目，t8 仍依赖t9、t9 无前置。
- 不把此前07..22的精确Remote故障控制与本41..46自然host业务拒绝混为一条；当前红测真实生产 command 同样复现，stderr 留真实BFS栈。

### 根与原图边界

| 原件 | 实读结果 | 限定 |
| --- | --- | --- |
| 41 before→42 after roots | 仅当前host session文件变；业务根全同 | session日志不是业务写。 |
| 45 before→45 rejected roots | **全根相同，包括session** | 不重复口述“45一定追加session”；这里只按实际快照裁零变化。 |
| 45 rejected→46 retry roots | 只`t-0009.json`与当前session文件变 | 与显式retry成功相符；不外推全机/备份根零写。 |
| 41/42/43/44、45/46六张PNG | 独立目视：拒后抽屉仍开、42已选1/43已选0、44/46关抽屉并有真实成功提示 | 41是过渡画面；不当稳定布局证明。原JSON fields没有逐input checked字段，不从value列表虚构checked实测；结合实际FormData请求和已选数只证明依赖选择结果。 |
| 42/45 error卡 | 原JSON为alert/assertive，生成“权限不足”；但bbox上边界/下边界均<0，PNG看不到卡 | **不签错误就近/全局可见**、不要求后台卡穿透modal；错误呈现位置交Main按原O3另根补证/核既有门。 |

45 observation.at=`10:28:47.383Z`，其RPC requestAt=`10:28:49.399Z`；46 observation.at也早于其对应RPC。保留原时标，不把45截图说成该第二次response之后的全新截图，也不猜测采集器时钟根因。42已有同文本渲染，45实际RPC独立证明正文；必要红的同文本生产卡独立证明误分类。完整O3保稿/错误可见/3秒与原方法执行的最终GUI门不由本件签署。

## 3. 必要红与控制结果

环境 macOS、Node **v22.23.3**，Vitest **2.1.9**，React/react-test-renderer **18.3.1**。pnpm11.28.5只为被测背景，未调用。运行根为本前缀完整自有冻结，不在主工作树执行产品自测；生产模块不mock，内存domain仅提供原接口依赖，不落真实业务库。明确权限例是组件输入控制，未知存储例是依赖故障控制，均不冒真实磁盘/浏览器实测。

| 用例 | 结果 | 覆盖 |
| --- | --- | --- |
| CF-C01 | PASS | 生产 API建合法种子，真实core循环拒绝保原原因、所有领域内容与put次数零变。 |
| CF-R01 | **FAIL** | 真实command.kind=error、零写/持久分类成立；原返回不包含循环原因。 |
| CF-R02 | **FAIL** | 原45 RPC文字→生产ResultCard；error/全文/无动作成立，但权限标签1个，预期0个。 |
| CF-C02 | PASS | 同拒绝输入只解除前置后真实retry，一次任务put，成功信封/TTL=3000/接受分类正确。 |
| CF-C03×2 | PASS | 真实command成功标题含失败/Error/Failed、权限/permission；生产卡不误红/权限标签。 |
| CF-C04×2 | PASS | 明确中文权限不足、EACCES permission denied维持标签与全文。 |
| CF-C05 | PASS | 未知存储Error仍返回保守error，不向command结果透出原路径/异常。 |
| CF-C06 | PASS | 原typed里程碑错误保原因、零写。 |

**合计10项：8 PASS、2 FAIL、pending0，原退出码1，无signal/设施错误。** [cases](cycle-feedback-reason-20261022-cases.test.tsx)与[原输出目录](cycle-feedback-reason-20261022-selftmp/r1/)保留；未改原oracle、未改产品把红跑绿。CF-R01在原因断言处终止，后续卡无权限断言尚未执行；CF-R02独立覆盖该卡，CF-C03覆盖真实command到生产卡成功控制，不虚称R01后续断言通过。

原stderr：

```text
[pm-tool] 任务操作失败： Error: 前置依赖存在循环：任务不能间接地依赖自己
at validatePredecessorRelation (.../core/tasks.ts:102:31)
```

原 assertion：收到通用排查文案但预期包含循环原因；第二红为`.pm-result-card__kind`期望0、实际1。详细原stderr/JSON reporter/response与零put记录均在自有r1，原A17/A18失败日志未覆盖。

### 实际命令与保护

运行环境macOS/bash，以下在仓库根。freeze/close只准备与审计，test的真实cwd为`.../cycle-feedback-reason-20261022-selftmp/r1/frozen`：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/cycle-feedback-reason-20261022-run.mjs freeze r1
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/cycle-feedback-reason-20261022-run.mjs test r1
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/cycle-feedback-reason-20261022-run.mjs close r1
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/cycle-feedback-reason-20261022-audit.mjs
```

顺序原结果：freeze **0**，test **1（两必要红）**，close **0**；封包audit首次 **1（自有尾部归一化设施错误）**、修自有审计后 **0**。首次失败另保[记录](cycle-feedback-reason-20261022-audit-first-failure.md)，不当产品缺陷。已结束全部本角色执行进程，close记录noTestProcess=true/released=true。

实际Vitest argv在`necessary-red.command.json`：`--no-cache`，唯一fork/单worker、既有node环境、白名单HOME/TMP/cache/DSH_HOME；不继承密钥/网络配置。完整包输入冻结、全部既有依赖自有复制 **13579files/1030内部软链**，外链/共享inode/依赖内容漂移均0。854个列明保护对象与完整主树/原冻结输入/已有lib无bytes/SHA/mtime漂移，102声明主树及原归属相同；Main新增封包合法文件不当污染。保护范围不等全磁盘，包括的报告/原证/失败日志清单见`protected-before.json`；未清任何目录。

本角色未执行build/install/全量verify/GUI，均 **NOT_RUN（本授权禁止）**。`rg`不存在改find/grep；两次不存在路径cat为探索失败不当产品失败；write_stdin工具一次参数字段不符后按实际execution_id续查，未重复启动或停服务。未Git写，未加载vendor。

## 4. 最小开发合同

交 Main/开发，持续既有缺陷修复范围内；本专家不写产品、不兼任修后验收。

| 建议文件 | 最小动作 | 必保边界与验证 |
| --- | --- | --- |
| `src/core/tasks.ts` | 沿已有Error类模式增加窄`PredecessorRelationError`，将当前自身/不存在/跨项目/循环四处关系拒绝换为该业务类 | 保原中文原因、DAG BFS/去重/同项目规则/队列/零写/回滚，不改schema、任务选择或成功路径。可用现有等价错误体系，不能直接透出所有Error。 |
| `src/commands/task.ts` | 导入该窄类并加入已有已知业务错误handler，返回`kind:error`和原原因 | 未知存储异常、AggregateError、typed关联错误和成功信封保持；补四种关系拒绝command测试、重试与失败全域零写控制。 |
| `src/client/result-card.tsx` | 权限标签只按明确拒绝原因/已知权限类型判定；允许局部小helper但不造新通用协议 | 不再对整段泛用建议扫“权限/permission/denied”。如文本分类，限定可信场景前缀后的明确原因（中文权限不足/无权、EACCES/EPERM或完整permission denied），未知/建议仅普通error。不得扩大宽英文regex或靠删通用建议躲CF-R02。 |
| 同域必要新tests | 原CF-R01/R02及8控制不删不弱化，新增四种关系错误/建议非权限/明确权限控制 | 原专家cases和r1不得改。开发可在自有新tests复用合同，修后另冻结再交不同独立复验。 |

`src/core/ui-feedback.ts`的现有明确 `{kind:'error'}` 分型保留，**无需先改缺省成功语义或扩全局关键词**。实际client executeRaw先检查CommandResult.kind，error throw后panel run透传显式error context，所以循环原因文字不必靠宽正则误扫正文；结构化成功标题含错误词仍须成功，标记正文/原文/TTL/复制代际契约不动。

不要：只改command文案掩盖权限分类、只移除所有权限标签、把泛用存储兜底全部透出Error、改DAG规则或checkbox控件、改原oracle、用仅HTTP200/本次AUTO代替修后GUI。未覆盖三个其他关系分支的必要红未虚称已实测；它们是同验证函数受影响范围必须补回归。

## 5. 交接与放行边界

1. Main/开发仅实施上表最小产品与同域测试；原U4r2和封存FeedbackRemainingR1不写，补件与新候选另根认领。
2. 不同独立专家复验原两红与8控制、四关系/受影响回归及错误context/成功信封/ResultCard既有测试；绑定新产品diff/新增清单/输入SHA，不用当前102身份冒充修后候选。
3. Main唯一builder在新自有输出构建，按原O3/R2真实种子→反选→真实host拒绝→可见正确原因/无权限误导/保同稿/业务零写→解除→真实retry关层/成功提示采证，独立专家审签。本件不批新的控件/后台回调适配，物理checkbox失败继续按原边界保留。
4. 全反馈、O4/O5、竞态余项与全部commit总门由原范围专家按其合同处理，本件不重复或外签。Main继续不受影响的既有GUI。

终检 `2026-10-22T10:40:00.975Z`：Node22内联仅fs/path/crypto/assert文件审计，exit0；102产品声明/854列明保护对象漂移0，Main封包230文件bytes/SHA/mtime全同，自有r1封存输出全同，9个文档链接存在、无尾随空白，原8绿2红/exit1仍同。未导入产品或重跑测试，无待运行会话；本行仅记录该结果，不改变产品或GUI门。

**释放：本角色必要红、原封包有限审计、最小开发合同已交回；产品仍FAIL待开发修复。** 仅新增本前缀文件，未改产品/livingdocs/其他testing/原证、未build/install/服务/GUI/Git写，不签修后GUI/全部commit；3257及3256/3248/3249/3255/正式均未探或操作。

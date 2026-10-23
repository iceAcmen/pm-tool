# F1 / FL / FD fixture 完整性审证 r3

> 日期：2026-10-23；平台：trae；角色：独立 fixture 合法性 / 字节准备审证专家，非开发、非产品执行、非 GUI 执行。状态在本角色独立 readback 子进程实际退出 0、收据写入并回读后为 **STOP / released**。

## 1. 结论与授权

**仅本次 fixture 完整性与原生产生成链有限证据准入：PASS / ADMISSIBLE。** 本角色内置 reader 的最终实际 outer 退出 0，19 项完整性核验无不一致。不是独立生产 schema parse，也不是产品功能验收。

负责人本单原句：

> 父全部既有未验到普通commit授权持续，Main唯一builder/GUI/桌面。你独立fixture合法性/字节准备审证专家非开发/GUI执行，唯一新 docs/testing/f1-fl-fixture-integrity-20261023-r3*及自有/tmp内置reader/outer，其余只读。限单替代通用fetch/install/build/livingdocs/git。仅审 Main新 reports/all-pending-evidence-20261021/F1FLFixtureR3/index-r1.json202件SHA66bdb7066b21c7c3176b6b2b5ee13ecfbdc4f5cd77bbbb2794ac0e2f6d3ba879 actual sealouter0。base/fl/fd真实生产API(仅冻结CombinedF02RepairR2已验产物455全SHA核)，新独立domain：baseA24 todo8/in_progress6/blocked2/done7/wrapped1/B2/两负责人未分配/工程日期D-31D-8D-4；base产生standard JSON SHAed69b80870239f0a96e66a9469e3a7e6d4a93213dcbe53abf595777c7d0d3134。fl同24长title240/des2000/author80/link200note500/progressE1三版E2两版softdeleteE3同日独立，同A meeting/dlv/okr/habit各20，SHA4805e3843edb2a93849124cbd6c1f72ee08f059604fc34ffc238bd09b8868c2f。fd同24保持五態但20distinct长姓名+2unassigned，SHA5eaf296ca3f091b23d4e8ddcfa41ac2492cdacfe8f70c325a4dee795bbb9231d。生产precheckContent/restoreContent再createBackup/precheckFile均实际0，空file_assets合法空侧车。base/fl people8/6/un2 maxX10；boardExpected MAX13是不同公式，fd另实oracle不借旧。current3269 47root对P2002TreeFinal全同，不写活库。只读核index/原动作返回/backup全结构/ids/日期/长长度/五態/count/schema静态元数据指纹/真实outer；禁止执行封件脚本/导入产品/运行schema/tests/浏览器/网络/端口/runtime/private/正式库/git。可以判本次fixture完整/合法生成原链有限证据准入/FAIL/BLOCKED，但绝不签peopleGUI/长密布局/RA-P1006/B8/父commit/产品功能。若实际需要生产独立parse，先声明本角色不执行且让Main另窄流程，不能自塞范围。Main即将接L8新产品候选core不变可继承限定由独立审。真正seal/readback收据成后STOP/released，不新添oracle/矩阵/写原testing/Main plans。

本单替代通用接手、回归、living docs 和 git 流程；只新增本前缀产物及自有 `/tmp` 内置 reader/outer。依据 `docs/collaboration.md` §11.4-11.6 区分合法种子、生成执行、字节审证、GUI 与独立判定。父普通 commit 授权持续，但不移交本角色执行或审签。

## 2. 对象与封件

- 唯一被审目标：[F1FLFixtureR3/index-r1.json](../../reports/all-pending-evidence-20261021/F1FLFixtureR3/index-r1.json)。
- 索引实际 SHA-256：`66bdb7066b21c7c3176b6b2b5ee13ecfbdc4f5cd77bbbb2794ac0e2f6d3ba879`；202/202 成员逐件实际读取，大小与 SHA 全匹配；JSON 成员以内置 `JSON.parse` 读取，不执行生产 schema。
- 实际文件总数 205；未入索引的恰为 `index-r1.json / seal.json / seal-outer-receipt.json`。三目录恰为三个备份的合法空侧车，没有额外文件或符号链接成员。
- Main `seal.json` 实际 SHA：`a0e01d24949099525beae3923fa2d74456b1bfc0f27c7b4d40cb6557034e31b2`；Main 实际 `seal-outer-receipt.json` SHA：`85761b4b381d054fea4da8e7733776d1dd76c33bac8ac27e4b8988539b50d231`。这两个排除件分别实际读回，不以索引自证。
- Main base/fl/fd/seal 四份 outer：status 均 0、signal 均 null、stderr 均空；argv/cwd/start/parentPid 与对应 start 收据相符，childPid 与 parentPid 不同。seal stdout 的 202/455/47 与封件一致；前三份 stdout 的实际备份 SHA 与备份字节一致。
- 候选身份仅引用封存元数据：`CombinedF02RepairR2`，baseline `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，包版本 `0.7.4`，builder Main。不运行 git，不以当前 HEAD 或当前运行实例代替该候选。

## 3. 备份、身份与长历史

三个标准备份实际字节：

| 变体 | 字节数 | SHA-256 |
| --- | ---: | --- |
| base | 13042 | `ed69b80870239f0a96e66a9469e3a7e6d4a93213dcbe53abf595777c7d0d3134` |
| fl | 1061394 | `4805e3843edb2a93849124cbd6c1f72ee08f059604fc34ffc238bd09b8868c2f` |
| fd | 1061218 | `5eaf296ca3f091b23d4e8ddcfa41ac2492cdacfe8f70c325a4dee795bbb9231d` |

- 全结构为 `pm-tool-backup / formatVersion=1`、七主表、六白名单 extra 元组表、exportedAt、fileBundleId。七表 ID 与 extra key 无重复；实体归属、任务里程碑/交付物关系可闭合；没有 file 资料引用，`extra.file_assets=[]`。各 bundle 对应侧车实际存在且为空，没有为迁就 content API 删除真实文件资产。
- 三包的全部主表与 extra，分别与原 `legal-history-content` 及 `history-restored.backup` 完全相同；result 中大小/SHA/counts/bundleId 与最终备份相符。没有用摘要或部分 tasks 替代完整备份。
- A=`p-0001`，B=`p-0002`；A 平面任务 `t-0001..t-0024` 共24，B任务 `t-0025..t-0026` 共2。A 的 code/order/ID 三变体相同；五态均为 8/6/2/7/1，open16、done7、完成率29%，不混入B。
- D=`2026-10-23`；startDate D-31=`2026-09-22`，T01 updatedAt D-8=`2026-10-15T00:00:00.000Z`，B01 D-4=`2026-10-19T00:00:00.000Z`，其余 updatedAt 同D。createdAt 为 D-40 完整ISO。日期顺序、今日/逾期/将来与原 payload、备份相符，不改墙钟或活库。
- base 的28份累积动作、fl的115份、fd的22份：所有前缀逐份与最终动作数组相同。base 的真实返回 ID 对应别名登记；原 payload/返回除明确历史时间调整外与最终实体相符。不是按标题猜 ID。
- fl 的A任务 title240/description2000；22条已分配任务姓名80，2条未分配保留。meeting/deliverable/okr/habit 同A各20，新增记录逐个与原动作返回、登记 ID 一致。所关联第一条交付物 name200/V1 合法冻结，其他19条 name240，不静默缩短全部交付物。
- T01 两资料项实际独立：link title200/note500；交付物资料冻结 name200/V1；资料 ID、交付物 ID、progress refs 真实闭合。
- E1=`pl-1` 三修订；E2=`pl-2` 两修订并保留 deletedAt；E3=`pl-3` 一修订。各修订 content2000/author80，ID唯一且与原动作返回一致。E1最终修订与E3均日期D，但entry ID不同；没有按同日合并历史。
- fd 与fl相比只变任务 assignee，其余全部任务字段、长历史及其他表完全保留；22次更新返回与最终分配映射相符；20个distinct长姓名各80，未分配仍2，五态不变。

## 4. 双口径与 FD 实际记录

只对原 oracle 与实际任务进行交叉核对，不运行生产派生模块、不新增 oracle 或 GUI 矩阵：

- base/fl：原 people report 开放量8/6、未分配2，轴 `maxX=10`、ticks `[0,2,4,6,8,10]`；A开放总量16。T01 原 tag 可追溯，B01 原 slow 建议可追溯。
- base 原 `boardExpected.max=13`；甲 todo5/inProgress3/blocked1/done4，总13；乙2/3/1/3，总9。wrapped进入看板todo，而人员页open排除wrapped，因此13不是人员页10的冲突。此处不执行看板render、不签看板实际GUI。
- fd 原 `taskAssigneeMapping` 全24行与备份相同，`names` 与实际20个姓名集合相同；原开放人员report恰14人，各openTotal=1，未分配2，实际记录 `maxX=8`、ticks `[0,2,4,6,8]`。20个已分配姓名不等于20个开放人员行；其中6人只有done任务。不能借base/fl的10、看板13或“20行可见”口述。

## 5. 生产链、静态指纹与不可扩大边界

**本次“合法生成”只准入原生产执行链的有限证据，不声称本角色重新执行合法性校验。**

原封存执行源显示独立 domain、隔离根与真实生产 API：base addProject/addTask；fl restore标准base后updateTask及各类add/资料/日志；fd restore标准fl后updateTask。各变体最后均 await `precheckBackupContent → restoreBackupFromContent → createBackup → precheckBackupFile`，完成后才复制标准备份、写result并输出成功摘要。base另有原 content 预检完成记录，其内容大小/SHA也实际匹配；fl/fd不伪造不存在的单独预检收据。

这一判断绑定已封源快照、原动作返回、四份真实outer和备份字节；本角色没有重跑源快照、生产模块或标准路径预检。outer原文和源快照均来自Main，不把同源转述计为多份独立执行证明。它们足以支持本单有限生成链准入，不能升级为本角色独立生产parse或新候选运行认证。

- `built-artifacts` 的455项大小/SHA元数据与 `frozen-artifacts-verified.verified` 全455项逐条一致，Main核验记录的manifest SHA与实际manifest匹配；candidate/source-files/complete-inputs/built-artifacts四份封件与原 `CombinedF02RepairR2` 报告逐字节相同。源登记124、完整输入登记525。
- **455项是Main冻结产物全SHA核验原记录的独立比对，不是本角色重开 `/private/tmp/.../lib` 后再核455份产物实体。** 本单禁止private/runtime访问，未将该限制隐去；也不把525元数据存在说成525实际源码已读。
- schema-locator实际SHA匹配索引；其13条明确大小/SHA指纹与Combined输入登记完全相同，另外20条指定文件的输入元数据存在。未读取或执行schema、未重新hash当前主树或冻结源码，不声称新的33文件实体核验。
- `current-runtime-protected.roots` 47条完整记录与 `P2002TreeR3/round04-tree-after-reload-roots.json` 完全相同。只核已封记录，不访问3269实例、端口或其runtime根；不将其扩大为本审证期间实时47根WATCH证明。
- 不签 people GUI、长密布局、RA-P1006、B8、父commit或产品功能。无浏览器、桌面、网络、端口、测试、产品import、build/install、git、正式库或活库操作。
- L8新产品候选不在本单对象内；未授予其继承。后续独立专家须针对新候选实际core/相关输入与受影响范围另审；不能只据“core不变”口述借用本结论。无需为本单另增oracle/矩阵。
- 本单有限准入不需要生产独立parse。若下一流程确需该执行，本角色不执行，须由Main另认领窄流程并提交真实原证，不塞入本单。

## 6. 实际核验与最终封存

环境：macOS darwin，既有nvm Node `v22.23.3`；只用 Node 内置fs/path/crypto/assert/child_process，未使用pnpm或新依赖。运行cwd为本仓库。完整机器明细在 [audit](f1-fl-fixture-integrity-20261023-r3-audit.json)，实际子进程原收据在 [outer](f1-fl-fixture-integrity-20261023-r3-outer.json)。

本角色实际最终命令（已有Node绝对路径；reader/outer均本角色自有 `/tmp`）：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/f1-fl-fixture-integrity-20261023-r3-reader.mjs audit
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/f1-fl-fixture-integrity-20261023-r3-outer.mjs audit
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/f1-fl-fixture-integrity-20261023-r3-outer.mjs seal
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/f1-fl-fixture-integrity-20261023-r3-outer.mjs readback
```

最终reader退出0；其独立outer实际status0、childPid41190，19项核验、0项不一致。该outer保存精确stdout/stderr、实际PID、起止时间、reader/outer源指纹。audit实际SHA `d07bd2498d1d7f62560763d3ca67d35508974532be501f19a328751f0f5a2810`；outer实际SHA `041166b87fe42cd1150be0521bac02558fb6051dedd682489423b68fae9854a5`。

前置工具情况如实保留：一次 `login=false` 工具参数不支持；rg不存在(exit127)改用窄sed/内置读取；指定记忆入口不存在(exit1)，未展开搜其他目录；两条临时内置node摘要命令语法错误(exit1)，没有产品执行或证据写入。reader首次audit退出1，原因是审证reader把含合法日志前缀的stdout误按整体JSON读取，并把source-files信封的3个顶层键错作124个source条目；按原真实shape更正自有reader后最终19项全通过，**不是产品/fixture缺陷，更没有改Main封件来迁就reader**。

本角色seal只封本报告/audit/outer，分别绑定原Main index/seal/actual outer三个锚与自有工具指纹；不循环自封。独立readback子进程实际核其字节后，父outer记录真实status/stdout，再写回读收据并读取刚写收据核对。seal的实际SHA由readback收据绑定，不以事先写“0”冒充实际退出结果。

最终存在且可回读的 [seal](f1-fl-fixture-integrity-20261023-r3-seal.json) 和 [readback](f1-fl-fixture-integrity-20261023-r3-readback.json) 是本报告STOP生效凭据。该收据实际status0后立即 **STOP / released**；不续派、不写原testing、Main plans或living docs、不提交、不新增oracle/矩阵。

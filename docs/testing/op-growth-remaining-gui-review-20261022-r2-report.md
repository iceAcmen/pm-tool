# 原 F2 剩余 GUI 独立审证 R2

> 2026-10-22，trae，不同独立 GUI 审证专家；非开发、非 GUI 执行端、非 Main、非 builder。仅读 Main 原件、实际 PNG 目视并使用自有 reader。机器读证截点 `2026-10-22T15:42:05.354Z`；末张状态时间 `2026-10-22T15:37:15.691Z`。

## 1. 有限裁决

**R1 明确剩余的两报告完整 66、保存后工时/链接、两非法错误正文/保输入/零业务写、当天与纠正日期字形、todo 看板/pending 标签、精确甘特 40/null/人工70→clear40，按第 3 节分层有限 PASS。不是任何原 ID 整项、OP 整域、旧 bare browse、native、P0-P3、B8、父 ordinarycommit 或发布 PASS。** 后端 wrapped 成功后的甘特 L8 旧文字原件不签 wrapped；本轮不自修产品，也不以该疑点泛化整域 FAIL。

本轮父单明确“只新增 docs/testing/op-growth-remaining-gui-review-20261022-r2* reader/audit/report/seal”“禁止执行 Main 脚本/tests”“审结 release STOP”。此有限授权覆盖通用拉取、安装、构建、产品 test、livingdocs 和 Git 收尾流程；不重复做这些动作，不授予后续功能或发布权。

依据：[AGENTS](../../AGENTS.md)、[collaboration §9/§11](../collaboration.md)、[原 R1 报告](op-growth-remaining-gui-review-20261022-r1-report.md) §5、[final-inheritance §5](op-growth-final-inheritance-20261022-r1.md#5-给-main-的最小合并动作) 第一组及 [OP 原合同](remaining-objective-cases-20261021.md)。R1 已签切片保留，不重签无清单清除、迁父、stats/check/派生算法、两 Space、390、新 PID 回读或已闭来源动作。

下文短文件名均指 `reports/all-pending-evidence-20261021/OpGrowthRemainingR2/`。Main 的报告、observations、脚本只作定位/解释；本专家裁决来自实际 PNG、RPC、行记录与 SHA 的互核。文件数、重复状态数、机器 exit0 均不是功能通过数。

## 2. 候选与原证

| 对象 | 本专家实核结果 | 限制 |
| --- | --- | --- |
| [R2 index-r1](../../reports/all-pending-evidence-20261021/OpGrowthRemainingR2/index-r1.json) | **348/348** 大小/SHA256 同，零缺失/差异；index 为 57715 字节，SHA `0f3fd562c4e1e7e401d954c1581e2795038d03cf9e41c39c417b8a06b0bc184a` | 索引是路径到 bytes/SHA 对象，不使用 R1 的 `.files` 结构空核 |
| [source-binding-close](../../reports/all-pending-evidence-20261021/OpGrowthRemainingR2/source-binding-close.json) | 与 R1 source-binding、CombinedSuccessor112R1 source-files 的 112 键逐项同；冻结包声明 **97/97**、launcher 声明 **15/15** 与实际文件同 | **SOURCE 身份缺口有限关闭**；不比较主树新的 114，不把并行新候选判污染 |
| [complete-inputs](../../reports/all-pending-evidence-20261021/CombinedSuccessor112R1/complete-inputs.json) | **519/519** 冻结包完整输入 bytes/SHA 同；清单 SHA `22869ac1590786c4359fda5953da83970dda23bf9a543c7902791bfe3cf019e8` | 是实际读输入，不仅引用 Main 的 count；没有执行输入中的 tests/scripts |
| 候选与 R1 部署 | baseline `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`；candidate SHA `9ca4dc612b76ea633ca8bba7eed4ac921ac56fdd394727ccdc9aa9ea989e6396`，source-files SHA `2d1de5490bb745611d4c298415756fa5ccb1b3eaf68d5ae29fc9f5c62a8fdbae`，均与原 host-start 绑定同 | 沿 [R1 reentry-start](../../reports/all-pending-evidence-20261021/OpGrowthRemainingR1/host-reentry-start.json) 的 **3263/PID7387**；不探活、读密钥/profile、启停服务、抓 bundle 或声称新独立装载证明 |
| 包与开关 | 冻结 `/private/tmp/pmtool-combined-successor112-20261022-r1/packages/dsh-pm-tool`，version0.7.4；runtime 为 `/private/tmp/pmtool-op-growth-runtime-20261022-r1`；close.pluginTarget 同候选包路径 | Main 原 client 声明 SHA `415e24f2fc660370256aa9a186f141aae24064a80cdcd2d6729b7ff28c9fe8d7` 沿 R1 原部署；不装 114 prefix，不把初始 runtimeLoaded:false 当后续未装载 |
| 既有 R1 签字 | reader/audit/report 三件与 R1 seal 中 SHA/大小均同；R2 初态与 R1 `29-newhost-task-reopen` 的 14 个业务/files 条目同 | R1 报告 SHA `03ffacad82387ff6cd038e5fd683cdade1e16eaf63f354c425752d3181ddd04b`；不重跑 R1 reader/tests，不将原 943 件当门数 |
| GUI 原环境 | 14 个状态同 origin `http://127.0.0.1:3263`、1440×900/dpr1、深色、pilot:{}；原 EGO13/p3，macOS/Node22.23.3 | 这是原采证环境。本专家只用本地 `view_image`，没有浏览器操作；不代 native/200%/全视口矩阵 |

实际 Main 封存收据直接只读核验：`5819eb547595d95e8bb1ed818fe4c5aa`、PID16389、status=exited、outputComplete=true、exitCode0，原输出 `sealed:348 / receiptSubset:12` 与索引相符。完整 metadata/output 的必要字段及原文件指纹记于自有 audit；该收据不在封包的 12 条子集中，不补入 Main 原索引，也不虚造第 13 条包内收据。

## 3. 定向补签

| 原断言 / R1 缺口 | R2 裁决与实际证据 | 限签 |
| --- | --- | --- |
| RA-OP01 / OP-SRC05 reports 全值 | **DATA + GUI 全值 PASS**。[02 人工0图](../../reports/all-pending-evidence-20261021/OpGrowthRemainingR2/02-report0-complete66.png)、[03 人工30图](../../reports/all-pending-evidence-20261021/OpGrowthRemainingR2/03-report30-complete66.png) 均真“进度汇报”页，分别选中原标题，平均进度列实际完整 **66%**；不是拿标题中的66代列值 | 原脚本只正常水平 wheel(400,0)，未改样式或数据。R2 当前 L1 为人工70，不冒称重新做了 manual30/0生成；生成条件沿 R1 已签 RPC，当前只读既有快照 |
| RA-OP04 保存后字段 | **DATA + GUI 指定字段曝光 PASS**。[04](../../reports/all-pending-evidence-20261021/OpGrowthRemainingR2/04-saved-effort-evidence-visible.png) 实际有3.5、`https://example.com/qa`、清单1/2客观50；04 raw L1 相同。R1 `13-effort-keyboard-save` 请求/返回已重读，R1末态→R2初态字节相接 | 不重合法 save，不用草稿图代落盘；只补工时/链接保存后入镜，不补未采 export 支路 |
| RA-OP04 两非法错误正文 | **DATA + GUI 前端拒保/保输入/正文 PASS**。[05](../../reports/all-pending-evidence-20261021/OpGrowthRemainingR2/05-invalid-fields-visible.png) 实际保留-1、`javascript:alert(1)`，两条正文分别为“实际工时需为不小于 0 的数字”“证据链接需为 http(s):// 形式”；原 script 按正常焦点→Enter 主提交，抽屉不关闭 | 两 alert bbox 的 y441.234/535.125 均在900高视口，正文实际目视可读；04→05的14业务条目同、files无条目，events无 commands/execute。是前端拒保，不伪称后端非法 RPC 实验或全盘零写 |
| RA-OP05 当天/纠正日期 | **DATA + GUI 日期只读字形 PASS**。[09 当天稳定图](../../reports/all-pending-evidence-20261021/OpGrowthRemainingR2/09-completed-date-stable.png) 实际显示完成日期 **2026-10-22**；[09 纠正稳定图](../../reports/all-pending-evidence-20261021/OpGrowthRemainingR2/09-corrected-date-visible.png) 显示 **2026-10-21**，与各 raw L1、06 done RPC、09纠正 RPC 同 | 日期是只读文本，非 disabled 写控件；R1 表单主save链沿原签。R2命令再done/纠正/todo用于此补曝光，不取代R1主save。10 todo raw 已无 completedDate；不重签日期清除视觉、不补历史无日期、不改时钟 |
| RA-OP03 / P2005 todo 看板 | **DATA + GUI todo 指定看板 PASS**。[10](../../reports/all-pending-evidence-20261021/OpGrowthRemainingR2/10-real-todo-board.png) 实际“总览看板”，完成2/待办8/收尾0、20%；需要关注2含WBS6逾期未完成2026-10-20及L1，客观清单卡含“6 F2-L8”100%，成员负载显示8项开放任务待派工 | 同图 raw L8 真todo、parent=t-0001、checklist原1/1；与R1 wrapped看板完成2/待办7/收尾1/需要关注1有定向变化。不拿R1 people open6与此全任务open8混为同一口径，不签所有卡/筛选器 |
| RA-OP03 / P2005 pending 标签 | **DATA + GUI L8 todo/pending 可读 PASS**。[11 pending任务图](../../reports/all-pending-evidence-20261021/OpGrowthRemainingR2/11-l8-pending-task-visible.png) 实际露出L8未开始、客观100%、清单1/1、覆盖1/1、**待验收**和逾期2天；同图 raw 仍todo | 此状态时间15:34:14.334Z，在11 wrapped命令15:34:16.708Z前，不能误绑为wrapped。11后面的甘特是另一时点，见第5节 |
| OP-SRC05 甘特精确40/null | **DATA + GUI 精确条体/填充分层 PASS**。L5=t-0007原清单2/5=40，L3=t-0005无清单、manual:null、legacy40。11真 task update 分别补排期10-21→10-23；[15稳定图](../../reports/all-pending-evidence-20261021/OpGrowthRemainingR2/15-objective40-null-stable.png) L5条体完整40%，L3条体“证据不足”，有排期空条，不拿未排期行代证明 | [15实际class探针](../../reports/all-pending-evidence-20261021/OpGrowthRemainingR2/15-bar-fill-probe.json) 两对象明确命中：L5 fill `width:40%`，L3 fills=[]；14 DIV role探针同L3且无progress子节点。只读探针＋实际PNG互核，不用12 bars=[]空核，也不签拖拽/键盘排期 |
| OP-SRC05 同L5人工70再clear40 | **DATA + GUI 人工条体70→客观条体40 PASS**。12真命令manual70/note；[14稳定图](../../reports/all-pending-evidence-20261021/OpGrowthRemainingR2/14-manual70-objective40-stable.png) 同L5条体人工70%，原2/5不变；[14 DIV role探针](../../reports/all-pending-evidence-20261021/OpGrowthRemainingR2/14-bar-fill-probe.json) title/aria同时有人工70/客观40且fill70%；14真clear→15 raw manual:null、note键删除，15条体40/fill40% | L5全程statusdone、legacy0、原5UUID及勾选不变；L3也未变为objective0。14左侧副标题尾部仍省略，未实际展示tooltip；不签“整段双轨长文全值入镜”或全长标签矩阵，客观40保真由原行/aria及前后40图分层证明 |

两份报告的 **原 byte** 直接从 R1 `29-newhost-task-reopen-raw` 回核：rpt-0001为1124字节/SHA `210414dc19192a361a162ee0357eb1e39c5057b766021a8a0e7b8821f90a45c2`；rpt-0002为1123字节/SHA `878a96dec9b2d55dd10e39ca7dc3f3672ded348a74d605094a3dca50fb6a5996`。R2各14状态副本均同原byte、snapshot.tasks.averageProgress均66；01→03全14业务条目同，01→15两报告同，没有新增报告条目。标题中的人工0/30是历史生成条件，不是当前任务值。

本专家实际目视 **14张PNG**：01/02/03报告、04字段、05负例、06动画、两09日期、10看板、11pending、11甘特、12甘特、14人工、15clear。另目视05三张jpg：只记录到合法值与负数输入的早段，**未见最终两错误正文**；不把这三帧代05最终PNG。其他jpg只核SHA，不冒称全部逐帧目视。

## 4. RPC 与零写

下表 row 为各 `*-command.json` 的 **0基 rows 数组位置**，均请求3→返回4。drain副本被rpcId去重，9个真实命令不是18次实验；完整请求/返回/时间/重复引用保存在自有 audit。

| 动作 / 原 command 文件 | rpcId | commandId |
| --- | --- | --- |
| `06-date-visible-done-command.json` | `342df2f0-98ad-41a2-9f92-a8151fad9fce` | `cmd-ddabf288-3` |
| `09-date-correct-command.json` | `f1bf83db-b572-48c7-9643-261312403851` | `cmd-ddabf288-6` |
| `10-l1-back-todo-command.json` | `9e807c99-f870-41d0-9cc1-be856bd3f6e1` | `cmd-ddabf288-9` |
| `10-l8-todo-board-command.json` | `391083ab-7d98-4ed6-b0d1-a7fce2e461ee` | `cmd-ddabf288-10` |
| `11-l8-back-wrapped-command.json` | `ed925c36-5df4-4f71-bb0d-0b702b3371ae` | `cmd-ddabf288-13` |
| `11-objective40-schedule-command.json` | `9a2836d0-a52d-48a3-a3c5-762490bcacbb` | `cmd-ddabf288-14` |
| `11-nosignal-schedule-command.json` | `d22bb496-7639-4f49-abd2-79e70cb31136` | `cmd-ddabf288-15` |
| `12-manual70-objective40-command.json` | `9ec35063-c8fe-4226-b4e6-669cafeb1ed3` | `cmd-ddabf288-19` |
| `14-clear-manual40-command.json` | `3ba299f1-7210-4fdd-a25e-97c0a0ff7881` | `cmd-ddabf288-22` |

9个原返回均result.ok=true、kind=success，非仅HTTP200；parser错误0。R1工时save/done主save/命令纠正/todo主save的4个RPC另读并放在audit.inheritedRpc，不冒称本R2重新执行。

14个状态清单的 **196个业务条目副本** 均核原复制件bytes/SHA同。04→05两非法提交对照14条零新增/删除/内容差异；原records仍工时3.5/https，非法值只在表单。files根无条目；helper原来枚举data/files/backups、只复制pmtool，结论限这些明列根及bytes，不签mtime、全磁盘或旧bare浏览零写。合法done、日期、todo、wrapped、排期、manual动作有真实业务写，不声称整轮零写。

## 5. 原失败、疑点与准确剩余

1. **L8甘特旧文字保留，wrapped消费语义不签。** 11 pending状态在wrapped之前；随后11 wrapped真RPC返回成功、raw L8已wrapped。`11-gantt-objective40-null` 及后续12/14/15仍有L8旧文字，14个状态原件均保留，不用后端成功签当前甘特wrapped呈现，不用这些图重签L8 todo。按父单列为该页stale疑点，根因本轮未查；L8自身客观100可保，不能把“100”本身当wrapped被错误计入聚合的证明。Main仅核该疑点所需的既有页刷新/状态同步原证；无足证则此语义保持BLOCKED，不因其他子门绿而抹除，也不据此无证扩成全OP FAIL。
2. **07错误form-right等待真实失败。** 收据`7478e6c6f0c927550247b54af9518993`/PID14435/exit1：waitForFunction3000ms超时。原脚本第一wait将form右边界当抽屉右边界；后续07 state/cancel/日期动作没有被执行。原件未有07成功图，不补造。09另用稳定原帧补正；06含进入动画，不签稳定日期视觉。
3. **12错误button选择器真实失败。** 收据`5501aa8c03f258b940f56db39e5c4c2b`/PID15277/exit1同3000ms超时；12 manual70 RPC已成功，后面的`button[aria-label^="任务 F2-L5"]`等待没命中实际DIV role=button。`12-gantt-fill-probe.json`为bars=[]，是空核，不是无填充PASS。14 role/15 class真实两对象探针补正，不清洗旧空核/失败，不要求改产品成button。
4. **收据只签真实子集。** 12条与各execution.json均同，10条exit0、2条exit1；status=exited/outputComplete=true。没有完整15轮独立工具UUID映射，原未存轮次不补造。另Main实际封存exit0如第2节。不是“全程零失败”，也不把审证reader的exit0当Main执行成功证明。
5. **剩余由Main继续非重叠采证。** 本R1真实缺口在第3节列出的有限断言已补；旧合法v0.7.4 bare browse/mtime、native/200%、P0-P3六组、B8及父ordinarycommit/总目标仍不在此门。沿原独立状态，由Main继续legacy/native/P0-P3采证；已闭来源/其他指定门不重开。14尾部省略只作全长标签边界，不追加本合同未要求的tooltip/布局新用例。

## 6. 自有验证与释放

本角色仅新增 [reader](op-growth-remaining-gui-review-20261022-r2-reader.mjs)、[audit](op-growth-remaining-gui-review-20261022-r2-audit.json)、本report、[首版失败seal](op-growth-remaining-gui-review-20261022-r2-seal.json) 和 [纠正seal-r2](op-growth-remaining-gui-review-20261022-r2-seal-r2.json)。reader只import内置fs/path/crypto，读取原件后生成本前缀审计，不import产品、执行Main封存脚本、旧reader或产品tests。原脚本源码仅读作步骤定位，不执行。

环境为macOS/darwin、bash、现有Node v22.23.3；pnpm11.28.5只是原被测环境，不调用。真实运行命令（仓库根）：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/op-growth-remaining-gui-review-20261022-r2-reader.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/op-growth-remaining-gui-review-20261022-r2-reader.mjs capture
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/op-growth-remaining-gui-review-20261022-r2-reader.mjs inspect rpc
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/op-growth-remaining-gui-review-20261022-r2-reader.mjs seal
```

语法检查、capture、inspect实际exit0；capture核348原件、112声明、519完整输入、196业务副本、9去重RPC与4继承RPC、4组字节对照均无差异/解析错误；907项明列读输入指纹供seal复核。另三次内置fs的node-e只读摘要exit0；L1/L5/L8各14状态的完整清单（UUID/text/done）各只有一个签名。封印输入漂移、正文链接与尾空白结果以实际seal为准，不提前伪称已跑产品回归。

首版seal实际exit1：907输入零漂移、正文无尾空白，但把尚待本次生成的seal自链接判缺失。首版原件保留，不覆盖成绿；只修自有reader，将自生成链接单列，纠正封印写新seal-r2并回绑首版指纹。修后重新语法检查/封印，最后另用内置fs/crypto只读核seal-r2三件产物哈希和全部正文链接真实存在；以实际命令与seal-r2结果为准。这是审证设施自检错误，不是产品FAIL。

**本角色执行偏差如实记录**：开头误调用一次只读`git status --short`（exit0），违反本单“不Git”的动作边界；没有Git写，之后没有再调用Git。`rg`不可用exit127改find/ls；指定memory入口不存在exit1，按仓库事实源继续。不得因此写成“本轮完全未调用Git”，也不把定位失败记产品FAIL。

产品build/install/test/verify、浏览器/服务/密钥操作均 **NOT_RUN**；无业务代码、原证、其他testing、livingdocs或配置改动。只封明列输入，不声称保护并行整树；主114继续独立，不在本候选中混入或安装。

**有限审证完成；Main收到第5节准确疑点及门外剩余即可继续原授权非重叠采证。本角色无业务、builder、浏览器、服务或Git写锁，无在途执行进程；自有写面审结释放。release STOP。**

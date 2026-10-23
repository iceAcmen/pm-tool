# 原 F2 剩余 GUI 独立审证 R1

> 2026-10-22，平台 trae，独立测试专家；不是开发、GUI 执行端或 Main。仅新增本前缀 reader/audit/report/seal。审证截点 `2026-10-22T15:05:39.931Z`；执行证据截至 `2026-10-22T15:02:27.620Z`。

## 1. 有限裁决

**仅以下已采断言分层 PASS，不签原 ID 整项、OP 整域、P0-P3、B8、总目标、总 commit、发布或新的 114 client。** RA-OP03/P2005 的 todo 后 board 原件错页，报告完整数值及若干表单信息未入镜，保留缺证；精确甘特 40 fixture 未采，不能拿客观 50 代签。无新增产品功能，本角色不修产品。

依据为 [AGENTS](../../AGENTS.md)、[collaboration §9/§11](../collaboration.md)、[remaining-objective-cases](remaining-objective-cases-20261021.md) 和 [原有限继承 §5 第一组 F2 合并动作](op-growth-final-inheritance-20261022-r1.md#5-给-main-的最小合并动作)。父派单明确只审封存原件，覆盖通用 fetch/build/test/Git/livingdocs 流程；不用这些流程扩权。原 check/stats/纯派生及其他已签范围只保留原结论，不重签、不重采；父单所指其他 747 门不在本轮。

证据根为 `reports/all-pending-evidence-20261021/OpGrowthRemainingR1/`，下文短文件名均指该根。Main 的说明只作定位；结论来自实际图像目视、原 RPC、记录行、指纹的互核。同一运行的多通道不是多次独立实验。

## 2. 候选、Fixture 与绑定

| 对象 | 本轮实际核验 | 绑定限制 |
| --- | --- | --- |
| [封存 index-r1](../../reports/all-pending-evidence-20261021/OpGrowthRemainingR1/index-r1.json) | 943/943 大小与 SHA256 一致，零缺失/差异；索引 SHA `cc4e646d708e30a4ed6f0a7b989679d093d8a5e51bafedced2b3075397b4d4f8` | 文件数不是通过门数 |
| [source-binding](../../reports/all-pending-evidence-20261021/OpGrowthRemainingR1/source-binding.json) | baseline `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，与 CombinedSuccessor112R1 清单逐键一致；冻结树包输入 97/97、主树 launcher 15/15 同 SHA | 共 112 项；未比较主树 114，不将合法并行判污染 |
| [原 Main candidate](../../reports/all-pending-evidence-20261021/CombinedSuccessor112R1/candidate.json) | SHA `9ca4dc612b76ea633ca8bba7eed4ac921ac56fdd394727ccdc9aa9ea989e6396`；源码清单 SHA `2d1de5490bb745611d4c298415756fa5ccb1b3eaf68d5ae29fc9f5c62a8fdbae` | 与 host-start 声明一致；不以 candidate 初始 `runtimeLoaded:false` 否定后续真实宿主入场 |
| [fixture-binding](../../reports/all-pending-evidence-20261021/OpGrowthRemainingR1/fixture-binding.json) 与原 F2 | 原包 6961 字节，SHA `451ce27c0b84c61419a6770dee27bf70795fef24b081e6be73c551bd9e7a1d8b`，本角色直接读取原包核同 | binding 的 `restored:false` 是准备时状态；后续原 restore 返回已恢复，不把准备状态当终态 |
| [host-start](../../reports/all-pending-evidence-20261021/OpGrowthRemainingR1/host-start.json) / [reentry-start](../../reports/all-pending-evidence-20261021/OpGrowthRemainingR1/host-reentry-start.json) | 原 3263/PID2354 → 同端口 PID7387；原精确 stop 的 listener/argv/cwd/SIGTERM 与 listener-gone 原件相接 | 沿 Main 原 112 同包绑定，声明 client SHA 均 `415e24f2fc660370256aa9a186f141aae24064a80cdcd2d6729b7ff28c9fe8d7`；本角色没有另抓/重哈希 bundle，不能冒称独立证明全 client 装载 |
| 执行环境 | 原 macOS，Node v22.23.3，EGO taskSpace13/p3，origin `http://127.0.0.1:3263`；默认 pilot OFF，DSH_PM_E2E=0，原页 `pilot:{}` | gateway 是原合法隔离依赖，不证明真实外部模型；114 prefix 未装载按父单与 source-binding 声明保留 |

标准 restore 链为 `02-f2-precheck-events` 的预检、`02-f2-first-confirm` 画面、`03-f2-restored-events` 的真实 confirm 成功及 1 项目/10 任务落盘。没有手 seed 成功来源，没有改原包、正式库或系统时钟。这里只证明本 F2 进入被测库，不签完整备份域。

## 3. 已采子门

表内 PASS 必须连同“限签”阅读；SOURCE、DATA、GUI 功能与实际视觉不是互相替代的结论。

| 原 ID / 已采子门 | 裁决与实际证据 | 限签 |
| --- | --- | --- |
| RA-OP02 无清单人工清除 | **DATA + GUI 功能/任务标签 PASS**。L3=`t-0005`，无 checklist，legacy progress40；`08` 主 save 人工40，`09` clear 草稿→取消仍人工40，`10` 再 clear 主 save→manualProgress:null；任务图实际显示“客观 证据不足 / 覆盖0/1 / 原手填40%”，人工条消失，重开状态相符 | 不混 manual 与 legacy，不签新 objective40/0；不重已有清单 clear50 原签 |
| RA-OP04 合法工时/证据 | **DATA + GUI 表单功能 PASS**。`11-effort-evidence-draft.png` 实际露出3.5、https://example.com/qa、客观50与原两清单；`13` 键盘主 save 的真实 payload 含 effortHours3.5/evidenceUrl/manualProgress0，返回 success；重开字段与记录相同，`29` 新 host 再读一致 | 草稿图不是落盘；落盘由 RPC/rows/重开字段证明。重开13/29截图未露出工时与链接，不签“保存后该段完整入镜”；未执行 export 支路 |
| RA-OP04 两非法拒保 | **SOURCE + DATA + GUI 拒保/保输入 PASS**。`14` 同次输入-1和javascript:alert(1)，真实提交后抽屉仍在，字段仍原非法值，两条中文字段错误存在，events无 commands/execute；11件 pmtool/files 前后同字节 | 这是前端拒保，不是后端非法 RPC 实验。错误实际入镜 **NOT_RUN**：见 §5；“字段就近绑定”可由冻结源码确认，不冒充实际目视可见 |
| RA-OP05 完成日期 | **SOURCE + DATA + GUI 状态/只读结构 PASS**。L1=`t-0003`，`15` 主 save done→completedDate `2026-10-22`；原页读取完成日期且无 completedDate input；`16` 真命令纠正→`2026-10-21`；`17` 主 save todo→记录删除该键/页不再有完成日期，原两清单不变 | 只读源码为 span，不是 disabled 写控件；原日期元数据/fields和实际命令一致。日期段未在15/16 PNG中露出，不签日期字形可读性；不是补历史无日期 |
| RA-OP05 clean 取消 | **DATA + GUI 焦点 PASS**。`17-clean-cancel` 抽屉关闭，focus=`BUTTON / 编辑 F2-L1`；实际图有编辑按钮蓝色焦点环，12件业务/文件前后同字节 | 仅这一 clean cancel，不签全键盘/ESC/焦点矩阵 |
| RA-OP03 / P2005 真迁父与恢复集合 | **DATA + GUI 指定 tasks/项目概览/people 子段 PASS**。`18` L8=`t-0010` 真 move 到 P=`t-0001`、status仍wrapped、原checklist1/1不变；父客观63/覆盖2/3，people open5。`20` 真改todo后父75/覆盖3/4、people open6且出现L8逾期建议。`21` 真归wrapped，后续父63/2of3 | 原队列/check/stats/纯派生不重签。L8 todo 的 pending 由原页文本证实，20任务截图只露出父行，该 L8 标签目视不签；board todo 子段 **BLOCKED**，见 §5 |
| RA-OP03 / P2005 board wrapped 初态 | **GUI 指定初态 PASS**。`19-wrapped-board.png` 真总览看板：完成2、待办7、收尾1、20%，需要关注只见L1；wrapped L8自身客观100可显示 | 自身清单事实可显不等进入项目聚合；不签 board todo 后变化、不签全部卡/筛选器、全域 wrapped 消费点 |
| RA-OP01 两报告客观口径 | **DATA + GUI 报告打开/绑定 PASS**。`21` 真命令人工30→rpt-0001、人工0→rpt-0002，各 snapshot.tasks.averageProgress66/calcVersion1；目标标题、周期与两次选中报告相符，页面原 text 同为平均66% | 新报告合法写不是零写；原两清单客观50不变。实际图“平均进度66%”全值 **BLOCKED**，不能拿标题中的66代数值，见 §5；不重原manual30/0主save |
| RA-OP01 当前人工0/70标签、OP-SRC05 甘特人工70 | **GUI 已露出子段 PASS**。17 clean图 L1“人工设定0% / 客观50%”；22甘特左侧“人工设定70%”、实际条体“人工70%”；26/27图显示同 L1人工70、客观50、清单1/2 | 不将人工值当objective。精确客观40甘特仍 **NOT_RUN**；甘特L3无信号/证据不足行可保，但未排期不等验证有排期空条体 |
| OP-GUI03 / F2 390标签子段 | **GUI 390指定标签 PASS**。26/27/28均390×900/dpr1、分别重设 Emulation；实际图含L1人工70/客观50/清单1/2，L3null/legacy40，L4待验收，L5请确认验收，L6/L7证据不足与legacy80/0；父63覆盖2/3标签亦入镜 | 只签这些字形/标签与窄屏无外壳横溢切片；不签原生 zoom、200%、全页面/全工具栏/全层矩阵，25不是390 |
| OP-BD01 新宿主回读子段 | **DATA + GUI 真实新PID回读 PASS**。原2354精确停→7387启动后29重进同库，L1字段70/3.5/https、原UUID两清单 true/false一致；L3manual:null/legacy40、L8wrapped保全，业务/文件与28字节相同 | 仅新的112实例/本F2；29抽屉PNG含进入动画，不签全抽屉视觉稳定，不倒推历史旧PID缺档，不重启任何服务 |

### 3.1 精确 RPC 与行记录

下列行号为原 events/command `rows` 的 **0基数组位置**，audit 保存完整请求/返回、rpcId、时间和重复引用，不把 drain 副本计为额外执行。

| 动作 | 原件 / 请求→返回位置 | rpcId / commandId |
| --- | --- | --- |
| L3人工40保存 | `08-l3-manual40-events.json` 2→4 | `baa5a575-6a00-4345-9184-af894f6d9398` / `cmd-040f2c36-5` |
| L3清除提交 | `10-clear-save-events.json` 3→4 | `40ad63b7-7540-4d8c-84b6-c31e8f7681d6` / `cmd-040f2c36-7` |
| 工时/证据主save | `13-effort-keyboard-save-events.json` 3→4 | `7a894636-8e41-4165-9734-aeecc43c73c2` / `cmd-040f2c36-9` |
| done主save | `15-status-done-events.json` 3→4 | `bd9ad2b3-6ba9-4ff3-bfd7-b10c094ec7a1` / `cmd-040f2c36-11` |
| 命令纠正日期 | `16-completed-correction-command.json` 3→4 | `ccd1a3ab-94ca-4076-bb47-c650cae6a99d` / `cmd-040f2c36-13` |
| todo主save | `17-completed-revert-events.json` 3→4 | `074d2fff-79e9-4840-8bc2-6414c46d7b92` / `cmd-040f2c36-16` |
| wrapped迁父 | `18-wrapped-move-command.json` 3→4 | `2d40e6a7-3b99-4b9e-a47e-dfff2d402e77` / `cmd-040f2c36-18` |
| L8改todo / 归wrapped | `20-wrapped-to-todo-command.json` 2→3 / `21-back-wrapped-command.json` 3→4 | `6589851a-3644-4659-adc8-dc4b6c160232` / `cmd-040f2c36-22`；`4c80b5bf-62c8-4b31-ac27-17bb0fea5ecd` / `cmd-040f2c36-26` |
| manual30→报告 / manual0→报告 | `21-report-manual30-command.json` 3→4 / `21-report-manual0-command.json` 3→4 | `dc9763fd-11e9-40d1-9d61-d69c69c656ec` / `cmd-040f2c36-28`；`cacd227c-6acc-41fc-a3f8-86af06d2c712` / `cmd-040f2c36-30` |

记录都从各状态 `*-raw/data/pmtool/tasks/*.json` 的 `record` 读取；无清单L3与空清单L7分开，不靠名称推断。L1 UUID始终为 `c98ca278-c928-4938-a4e0-65c9b8e5105c` / `df643bbe-707e-4556-a4d3-3f879c6d4773`，text为验收项1/2，done=true/false。报告从 `reports/rpt-0001.json`、`rpt-0002.json` 的 `record.snapshot.tasks` 实读，不拿人工标题代算法。

## 4. 字节零写与实际目视

[reader](op-growth-remaining-gui-review-20261022-r1-reader.mjs) 仅读内置 fs/path/crypto，不 import 产品、归档执行器或旧测试。本轮 [audit](op-growth-remaining-gui-review-20261022-r1-audit.json) 对49个状态清单累计573个业务/文件条目副本复核，零大小/SHA差异；这是重复状态的核件数，不是573个独立门。

| 对照 | 全 pmtool/files 条目 | 字节结果 |
| --- | --- | --- |
| 09 clear前→未保存 / clear前→取消 | 各11 | 零新增/删除/内容差异 |
| 14负例前→两非法提交后 | 11 | 零新增/删除/内容差异 |
| 17 revert重开→clean取消 | 12 | 零新增/删除/内容差异 |
| 28末态→29新host / 29列表→抽屉重开 | 各14 | 零新增/删除/内容差异 |

执行器原 helper 递归枚举data/files/backups，业务原件仅复制pmtool；这些对照的 files 根没有文件条目。结论限保存的根清单，不说全磁盘零污染；宿主session/workspace合法写不混进业务零写。无mtime原证，不能签mtime不变或旧bare browse。

本角色实际通过本地 `view_image` 目视的PNG：08人工40、09取消、10清除保存、11工时草稿、13重开、14负例、15日期重开、16纠正重开、17 clean、18任务、19概览/people/board、20任务/概览/people/board、21人工0报告、22人工30报告/人工0任务/人工70甘特、23窄屏、26/27/28窄屏、29列表/抽屉；并逐帧查看14的三张jpg。没有打开浏览器或操作UI。

## 5. 反证、疑点与最小剩余

1. **todo board错对象，BLOCKED该子门。** [20-todo-board.json](../../reports/all-pending-evidence-20261021/OpGrowthRemainingR1/20-todo-board.json) 与 [同名PNG](../../reports/all-pending-evidence-20261021/OpGrowthRemainingR1/20-todo-board.png) 实际都是人员负载页，open6；原脚本回项目管理后未点总览看板。不能因文件名有board签它。Main只需现有同fixture正确board读出口及todo后对应状态/集合；L8自身pending实际图未露出可同轮补曝光，不重move/stats/check。
2. **两报告完整数值未入镜，BLOCKED视觉全值。** [人工30图](../../reports/all-pending-evidence-20261021/OpGrowthRemainingR1/22-report-manual30-visible.png) 与 [人工0图](../../reports/all-pending-evidence-20261021/OpGrowthRemainingR1/21-report-manual0-visible.png) 的平均进度列在右边界，只露出首个6；原页text/rows确为66%。报告打开本身有证，但标题“客观66”不能代列值。Main只需对现有两报告正常曝光/横向读出口，不再生成报告；无法曝光时交产品owner处理，不由专家擅自fix。
3. **负例错误、保存后工时/日期的视觉不外推。** [14负例图](../../reports/all-pending-evidence-20261021/OpGrowthRemainingR1/14-invalid-effort-evidence.png) 停在抽屉底部；两个alert y分别约-726/-632，三张jpg也只显示较上段，均没有两错误正文。冻结TaskForm有`Field errorId`与`aria-describedby`就近绑定；原 helper 的fields只查getClientRects非空，不查是否在viewport，不能叫实际可见。13/15/16/29抽屉图未露出工时/完成日期段，16/29还处进入动画。功能/源码PASS不变；若需签这些视觉，优先交已有正确帧，否则只补字段段稳定曝光，不重合法保存或非法守卫矩阵。
4. **精确甘特40、旧bare browse、原native门仍未签。** 本轮L1清单1/2=50而非40；22甘特人工70不能替OP-SRC05的精确客观40，L3无排期空行也不代有排期无信号空条。保留原精确fixture剩余，不造新需求。合法旧v0.7.4包只浏览零写/mtime不在本证据链，不用标准restore成功代签。Emulation390不是浏览器原生zoom或200%，原native门照旧不签；无本人必要动作，不擅转MANUAL_PENDING。

上述是原合同剩余/本次证据限制，不是OP整域新增FAIL。19看板wrapped自身100展示可合法保留；任务表“已完成3”快捷筛选与“完成2/收尾1”摘要的语义未在本轮点开，本报告不签该筛选器，疑点交Main核已签范围，不擅扩成产品整域FAIL或改源码。

## 6. 真实失败与收据边界

[execution-receipts](../../reports/all-pending-evidence-20261021/OpGrowthRemainingR1/execution-receipts.json) 为 **27个已结束执行子集**：逐一与execution.json核executionId/PID/exitCode/status，27同、0差异。24个exit0、3个exit1，不称全程零失败，不补造round04/06/07/12及全部探路收据。

- round05/round11 exit1：`page.click ... element is not visible in the viewport`；后续原合法滚动/键盘save另有原证，不清洗失败。
- round24 exit1：`.pm-check-hint-card button matched 0 elements`；后续换实际locator另录，不当产品写入失败。
- 初number fill曾实际为0，06状态保留；07重填40+Tab，08提交前实查值40才save。不能把最初fill当成功或假称全程40。
- 原F2创建/排期日期为2026-10-21；本次done实际本地日期为2026-10-22，再显式纠正10-21，revert清除。不是错日期测试，不改时钟。
- 23实际390；25工具轮次恢复1458×734/dpr2，保原件、不签390。26/27/28每轮重新设置390×900/dpr1，26原探针document390，27原探针documentWidth390，28图片390宽且标签无外壳横溢；28末探针visibleText=[]不代目视，也不虚造28的documentWidth字段。
- 父派单另明确 Main seal初syntax exit1、r2actual exit0；27收据没有这两次完整封存执行件，只保留为父单提供的执行说明，不说两次都0或把本audit替代Main收据。本审证自有实际命令另记如下。

## 7. 本角色验证与停止

运行环境 macOS/darwin、bash、现有Node v22.23.3；pnpm11.28.5仅引用原环境，未调用。真实运行：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/op-growth-remaining-gui-review-20261022-r1-reader.mjs capture
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/op-growth-remaining-gui-review-20261022-r1-reader.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/op-growth-remaining-gui-review-20261022-r1-reader.mjs seal
```

capture实际exit0：943同、冻结97/launcher15同、49状态清单无差异、23个去重RPC均有返回且parseErrors0、上述业务字节对照零差异。另运行只读inspect/node-e摘要；一次探索node-e混用引号导致shell syntax exit2，未执行产品或生成审计，改正确引号后摘要正常。`rg`不可用exit127，改find/grep；指定memory入口查无文件，按仓库原证审。只读定位时有一次进程列表读取，没有探活、操作或启停服务。

语法检查实际exit0；最终输入漂移/正文链接/空白核验以 `op-growth-remaining-gui-review-20261022-r1-seal.json` 实际结果为准。1063个声明输入的封印只保护明列文件，不是全树保护或产品回归。本轮产品build/test/verify/GUI执行均 **NOT_RUN**，没有业务、Git、browser、service、key、配置写入；没有改其他testing/livingdocs或原证。

**SOURCE/DATA/已采GUI切片有限裁决完成。** Main按原继承§5继续prefix新build及P0/P1/P2/P3六组，先复用既有原件，再补准确缺口；本报告不授commit/发布，也不要求无意义重采已闭动作。本角色无源码、builder、端口、数据根锁，无需持续进程；自有写面释放，**STOP**。

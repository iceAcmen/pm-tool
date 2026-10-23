# A11 五态上下完成卡限定独立补审

> 给 Main、负责人和接手专家使用。trae 独立审证角色；按 20261021 派单命名，实际本机审证日期为 **2026-10-22（UTC+08）**。只审原件，限 A10-OP-G01 关闭与人工/清单局部继承，不认证全 OP。

## 1. 有限判定

**A10-OP-G01 修后有限复验：PASS_LIMITED，可以关闭本缺陷。** 新 r3 已补齐五态上方小卡真实可见原证，五态同一保存态的上下卡均为 done2/10=20%，wrapped1 独列，客观父63↔88不受人工值污染。此结论只绑定下面的 A11 候选、原F2、3225文档和 r3 原件，不扩 OP/B8、A12、全页面样式/UX或发布。

| 对象 | 本次判定 | 继承及边界 |
| --- | --- | --- |
| A10-OP-G01 上下完成卡一致性 | PASS_LIMITED；关闭=是 | 三人工态与清单100/50态，十张上下原PNG、同task完整原record及动作帧；浅色1440×900。 |
| RA-OP01 人工30/0 | PASS_LIMITED，可局部继承 | 原 A11 r2 有限结果保留，r3重新核主保存/重开/目标保真；甘特人工30/0可见。未扩大列表L1全部目视或报告消费点。 |
| RA-OP02 有清单清除 | PASS_LIMITED，可局部继承 | 实际0→clear draft→主save→null，客观50；不是30直接清除，取消clear和无清单clear仍未纳入。 |
| OP-GUI-01 / OP-CK-06 即时清单写入 | PASS_LIMITED，可局部继承 | 原稳定第二UUID真实focus/Space两次，100后取消/跨页/重开仍全勾，再50还原；仅第二done及updatedAt变，不签重试/并发/失败写入。 |
| OP-SRC-05 / OP-SRC-06 相关消费点 | 仅原局部结果继承 | 目标记录、页面DOM、甘特实际可见值与总览父63/88一致；不认证四消费点全集、报告快照或全页标签可读性。 |
| 全OP、RA-OP03 wrapped完整旅程、B8/A12/发布 | 不在本单审签范围 | 原未闭门继续由对应专家处理；本次局部关闭不替代这些门。 |

依据：[AGENTS](../../AGENTS.md) §6A、[collaboration](../collaboration.md) §9/§11.3–11.5、[原A10 G01最小合同](a10-objective-gui-independent-review-20261021.md) §1、[OP补充合同](remaining-objective-cases-20261021.md)、[A11 SOURCE/AUTO合同](a11-overview-done-independent-retest-20261021-plan.md)。本次授权原句、非目标与停止条件见[本计划](a11-overview-visible-final-review-20261021-plan.md)。

**原 A10 FAIL、原 A11 r2 错上图及 BLOCKED 报告全部保留，不覆盖、不倒改。** [旧报告](a11-overview-done-gui-review-20261021.md)的BLOCKED是其当时证据结论；本报告追加“新证补齐后有限关闭”，不是旧证自身变为通过。旧根因标题“错误包含wrapped”保历史；已更正根因仍是F2-P todo/legacy100多计，wrapped原progress0不是额外完成项。

## 2. 冻结与A11归属

[冻结输入](a11-overview-visible-final-review-20261021-selftmp/inputs-r1.json)时点为`2026-10-21T20:29:10Z`，本机`2026-10-22 04:29`。3714件size/SHA256/mtime登记包含A11归档、新r3、原专家报告/plan/audit/selftmp/快照/失败、规则合同和原F2。新manual-visible-r3为149件、checklist-visible-r3为107件。只读登记，不改原证。

- 旧报告SHA256为`399f2bb93384ed18627d9893492b6f8dab1008714e7119695d45b3eef3d9239f`，20196字节；原专家产物整体保持原样。
- [A11 candidate](../../reports/all-pending-evidence-20261021/A11/candidate.json)：基线`9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，宿主`1142fb74f2bbcc54dc9499054c0448c9b876cbf2`；tracked patch独立实核`6e09d16e991120ec21a3e88bf26bd4a3e93e6d432e5c1941e53c79ce9d5312fd`。
- 明确A11树`/private/tmp/pmtool-all-closure-20261021`内511项source和453项artifacts共964项，逐件与candidate认领一致；build.artifacts及sync.sourceHashes相同、sync.drift/postDrift均空。原专家更宽的966静态登记（含配置）也重新核验。未执行构建或产品。
- 当前主树并非“所有源码都等于A11”：唯一差异仍`src/client/provenance-panel.tsx`，A11=`ff319e4e…79ca6`，主树=`039b7d47…4c973b`，只增加label存在时显示`ref.id ·`的一行。该差异与旧报告相同，本审证期间未变。总览/任务及明确A11树的lib均保持A11字节；不以主树来源面板或新A12树替代历史A11下发。
- 原非私有启动metadata的既有快照与environment objective相符：3225/PID32660、同宿主提交及profile/plugin/patch归属。本方只审启动原件字节与原快照，不探当前进程健康、不读凭据/private、不启停服务；A12树未读取或修改。

实际[loaded-r2](../../reports/all-pending-evidence-20261021/A11/objective/loaded-r2/result.json)为唯一uncached200响应；完整combo和唯一完整client执行段重新核验，不用HTTP200替GUI。

| 字节对象 | 长度 | SHA256 |
| --- | --- | --- |
| 完整combo响应 | 2575876 | `47d0dda7ee578570218b6890b7bbaeca887ad936bf36a075db9548074602f7c2` |
| A11归档client.js | 1697076 | `279d952a9652eb2dd075c9b449bb0201184c90fe27da3dde94e86efbd8d62219` |
| 去尾注后完整执行段 | 1697044 | `7c4818aef0d6132a3157fcb2c2f4879edc72234e8c678ccb93187bbe0bff87f4` |

完整段offset875361、第二次匹配=-1，长度/hash与原manifest一致；整combo不等于单client是组合响应的正常事实。本轮只签client直接下发绑定，不签editor/lazy chunk或全宿主模块激活。

29份r3状态均为origin`http://127.0.0.1:3225`、timeOrigin`1792600846520.7`，与loaded-r2同文档；loaded时pmMounted=true、pilot=off。原[menu100](../../reports/all-pending-evidence-20261021/A11/objective/native-zoom/menu100.png)已重新目视，Chrome PID29351/window23677 metadata相符。r3未重新采菜单，不把DPR1或pageScaleFactor当新原生缩放证明，不扩200%。

## 3. 五态目视与动作链

十张上下原PNG逐一单独目视、164原帧全部逐格目视及逐SHA复核；完整逐态上/下/record链接、十一联系页与范围、五张甘特原图及可见性局限见[独立目视记录](a11-overview-visible-final-review-20261021-visual.md)。manual93帧有83种内容hash、checklist71帧有55种，不称164个独立场景。

三人工态上图父客观63、覆盖2/3，清单100时88、还原50时63。所有上图清楚读到小卡2/10和20%；所有下图清楚读到完成2/待办7/收尾1及20%。上下是同文档同保存态的两次真实滚动，不声称两卡同时在一张图内。

[manual执行原件](../../reports/all-pending-evidence-20261021/A11/objective/manual-visible-r3/execution.mjs)与[checklist执行原件](../../reports/all-pending-evidence-20261021/A11/objective/checklist-visible-r3/execution.mjs)仅静态阅读：实际`.ov-row-stats.scrollIntoView()`后等待`top>=0 && bottom<=innerHeight`再采上图，随后下卡scrollIntoView；期间只滚动观察，无数据/DOM注入。JSON未登记小卡独立bbox，故不补造数值；真实可见性由原PNG目视确定。目标上图原raw与随后lower采证完成后的records内wrapper严格相同，未拼不同目标/保存态。

人工段UTC`20:24:45.914–20:24:48.470`，outer`20:24:48.621` exit0；清单段UTC`20:26:52.614–20:26:54.578`，outer`20:26:54.714` exit0。outer0只证采证执行结束，有限PASS来自原图、记录、动作及候选绑定的独立审证。人工0下卡停留未被本段抽帧捕到，依据该态完整原PNG；不把别态帧或旧初态上卡代它。

## 4. 同目标完整记录与写边界

[实质审计r4](a11-overview-visible-final-review-20261021-selftmp/observations-r4.json)保留24完整version2 wrapper、29原状态全文、原帧metadata/SHA、原F2十一record与所有根hash变化。原F2 oracle的D仍为`2026-10-21`，本机跨日不改seed日期；备份SHA`451ce27c0b84c61419a6770dee27bf70795fef24b081e6be73c551bd9e7a1d8b`。原项目和十任务用真实`{version:2,record}`两空格加尾换行编码重算，十一项均匹配原seed归档hash；不是新造fixture或runtime新读取。

目标始终`id=t-0003/projectId=p-0001/parentId=t-0002/status=todo/progress=40`，创建日期、父子、code/order、其他字段保留。两个UUID为`c98ca278-c928-4938-a4e0-65c9b8e5105c`和`df643bbe-707e-4556-a4d3-3f879c6d4773`，text/顺序/第一项done不变。

- 人工15态：三个draft的盘record分别仍null/30/0；主保存后30/0/null，前两态备注`QA人工口径来源`、清除后备注键删除；对应tasks/overview/gantt/reopened完整wrapper及原raw SHA相同，重开输入值/备注相符，只改manual、备注和updatedAt。目标从`f91e24e9…50e7c`变为`507bc65c…6dfca`，无其他PM记录变化。
- 清单9态：从前段清除后的同一完整target开始，真实第二项focus/Space→2/2=100，取消抽屉/跨页/重开保持true；再Space→1/2=50。只第二done与updatedAt变，manual仍null、无备注，最终业务字段与初态相同但updatedAt/hash不同；不声称字节回滚。目标`507bc65c…6dfca`→`1cb8e4ed…1a830`。
- 两段各自before/after所列13键中只有目标PM内容hash变化；其余1项目9任务、workspace及该段session都相同。清单逐态root也核了稳定非目标与rawhash；人工draft只具有目标raw，不签逐态全根零写。
- r2结束→r3人工开始、r3人工结束→清单开始之间，仅宿主session hash分别`ea56219f…e44fa`→`92375280…17dae`→`59c5d222…c2bc1`，PM十一项及workspace一致。不同阶段间不是全根零写，不与每段自身边界混淆。

r3承接同A11合法F2种子与r2还原态，不重新恢复fresh空库；目标初raw与原r2末raw完整相同，其他十PM记录仍原seedhash。按本次明确“同A11重新采五态”的限定授权复验，不冒称本段另跑恢复/备份门。未来Main资料旅程或A12改变数据/下发后，不以本报告代表其新状态。

## 5. 本专家验证及设施记录

环境macOS/darwin arm64，实际绝对Node v22.23.3；项目约定nvm Node22/pnpm11.28.5，本方未运行pnpm/install/build/verify产品runner。以下均在仓库根：

```sh
cd /Users/bytedance/Projects/dsh-pm/pm-tool
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a11-overview-visible-final-review-20261021-audit.mjs freeze inputs-r1
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a11-overview-visible-final-review-20261021-audit.mjs review observations-r1
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a11-overview-visible-final-review-20261021-audit.mjs review observations-r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a11-overview-visible-final-review-20261021-audit.mjs review observations-r3
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a11-overview-visible-final-review-20261021-audit.mjs review observations-r4
env HOME="$PWD/docs/testing/a11-overview-visible-final-review-20261021-selftmp" TMPDIR="$PWD/docs/testing/a11-overview-visible-final-review-20261021-selftmp" CLANG_MODULE_CACHE_PATH="$PWD/docs/testing/a11-overview-visible-final-review-20261021-selftmp/module-cache" /usr/bin/swift -module-cache-path "$PWD/docs/testing/a11-overview-visible-final-review-20261021-selftmp/module-cache" docs/testing/a11-overview-visible-final-review-20261021-contact.swift
pgrep -fl 'swift.*a11-overview-visible-final-review-20261021-contact\.swift'
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a11-overview-visible-final-review-20261021-audit.mjs finish drift-pre-report-r1
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/a11-overview-visible-final-review-20261021-audit.mjs
git diff --check -- 'docs/testing/a11-overview-visible-final-review-20261021*'
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a11-overview-visible-final-review-20261021-audit.mjs finish drift-final-r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a11-overview-visible-final-review-20261021-audit.mjs finish drift-final-r3
```

freeze exit0。review-r1/r2各exit1，是自有设施错误：把上述两个阶段间全13键误要求相等；完整[失败1](a11-overview-visible-final-review-20261021-selftmp/observations-r1-failure.json)/[失败2](a11-overview-visible-final-review-20261021-selftmp/observations-r2-failure.json)及脚本SHA保留。改为逐段PM/workspace保真、单列跨阶段session差后，r3/r4均exit0；未改产品或原证，不把设施断言失败判产品FAIL。

Swift仅离线派生十一页，HOME/TMPDIR/module-cache限定selftmp；工具首返回显示仍运行，未返回最终exit数值，故不补造Swift exit0。十一PNG和index齐备且全部目视，后续精确模式pgrep无输出/exit1，确认自有Swift进程已退出；该检查不涉及3225或其他服务。

首finish产生完整[终核原件](a11-overview-visible-final-review-20261021-selftmp/drift-pre-report-r1.json)后exit1：3714已冻结输入、964A11静态、原191输入/966静态、主树源及文本/链接均无漂移，但Main并行新增106件finder/materials原证，过宽“整个A11不得新增”断言失败。[设施失败](a11-overview-visible-final-review-20261021-selftmp/drift-pre-report-r1-failure.json)保留。新增均非G01/objective/候选/build输入，改为单列未审新增并仅阻塞本单范围新增，不能把其他已有旅程当本单FAIL或PASS；未覆盖/改写Main成果。

## 6. 终核与释放

[drift-final-r2](a11-overview-visible-final-review-20261021-selftmp/drift-final-r2.json)实际`2026-10-21T20:39:27.677Z`（本机10/22 04:39）exit0：3714冻结原件、964A11 source/lib、原191输入/966静态及本次主树511源均零漂移；本单范围新增0，Main其他finder/materials新增202件逐路径列为未审。五个本前缀文本无行尾空白/缺换行，本地链接零缺失，selftmp JSON均可解析。`node --check`与`git diff --check`均exit0，未跟踪文本另由审计实际读取检查，不只依赖git未报错。

补入上述真实结果及计划状态后再执行`finish drift-final-r3`，只新增唯一命名`a11-overview-visible-final-review-20261021-selftmp/drift-final-r3.json`终核原件，不覆盖r2；收口后文档最终SHA/时点及其他任务新增数量以r3为准。本报告不声称A11全目录或系统全根零变化。主树来源面板的既有差异不替代A11，也不迁移给A12。

本任务完成即释放，无GUI或服务实例需停止，自有离线Swift已退出。未fetch/pull/install/build/操作产品或GUI/helper、启停服务、读取凭据/private、写其他docs、commit/push；不删除任何原partial/失败或在途成果。Main接续读取本报告，只将G01记为已有限关闭，并按本节范围继承人工/清单局部结果；其他OP/B8/A12门继续按各自合同，不借本报告授权新功能、提交或发布。

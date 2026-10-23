# AI 剩余 GUI R1 有限独立审证

> 2026-10-22，trae，独立 GUI 审证专家，非开发、非 GUI 执行端。仅新增本前缀文件，审 Main 原件，不执行产品、浏览器、模型或服务。[授权与先行计划](ai-remaining-gui-review-20261022-r1-plan.md)；[文件审计](ai-remaining-gui-review-20261022-r1-audit.json)；[补核与继承边界](ai-remaining-gui-review-20261022-r1-supplement.json)。

## 1. 有限裁决

**26/27 的中文错误分型 FAIL，28 的正常恢复有限 PASS；本轮不签 AI06 整门。** 与[先行错误专家](ai-terminal-failure-20261022-report.md) ATF-02 同一修前缺陷：鉴权/限流被描述成“未返回正文”，并继续尝试下一候选。本角色只补 GUI 原证关联，不重复其 tests、不修代码、不签新修复。其 ATF-01 部分正文假成功、ATF-03 模型取消协议不由本包重验或关闭。

| 原余件 / 本包切片 | 独立结论 | 精确边界 |
| --- | --- | --- |
| RA-AI04 / PC-G04：05合法草稿→06取消→07/08正常人工主保存→09明确再生成→10实际执行 base | **有限 GUI PASS** | 新请求携带人工新值；实际 ask-apply 的完整 base 精确等生成前任务 `10:49:11.960Z`，应用1、落盘与新来源对应。定向补齐 A16 的实际发包缺口，不倒签原直接取消分支 |
| RA-AI05：11四 create 草稿零业务写→12明确整批应用4→13..16新实体读取 | **有限 GUI PASS** | 四合法 create 经生产命令落盘，稳定 ID、项目、字段、时间及 create postimages/refs 对齐；四页面真实读取。不是四卡完整滚动、全部确认控件/成功句的目视 PASS |
| 18delete / 19unknown / 20attachments数组 / 21wrapped / 22跨项目：无可确认计划、业务不写 | **有限 PASS（观察切片）** | 原图/状态无合法计划、前后业务及原 ledger 不变；19..22请求响应正文完整。18模型请求/BODY及成功事件有证，但宿主 command events 空，完整请求响应链 **BLOCKED** |
| 上五纯非法建议的拒绝原因可见性 | **BLOCKED（缺证）** | 实采停在只读诊断页，未打开草稿拒因页；不能由无计划/过滤源码说用户已经看见原因，也不据未打开页面判产品 FAIL |
| 23 mixed→24一合法风险步及两拒因→25明确 apply1 / applied-only refs | **有限 GUI PASS** | 图中 s2“任务不存在”、s3“task.delete不允许”完整可见；实际只发送 s1，风险单字段更新、其他业务保全，新来源仅 ri-0001 |
| 26认证 / 27限流：零业务写、无本次假计划 | **有限 PASS（安全边界）** | 全业务和 ledger 不变，无本次 ask-apply；旧成功结果卡仍属于历史，不冒本次成功 |
| 26认证 / 27限流：正确中文分型及停候选 | **FAIL** | 两次 UI 泛化为空正文；原 gateway seq10→11、12→13 为 first→second，非硬故障停链。只签实际这两类 GUI 失败，不新增错误体系 |
| 28明确重试正常只读诊断 | **有限 GUI PASS** | 新真实 ask 返回正常诊断，“模型未给出可执行步骤”可见、无计划、业务/ledger零写；不证明故障修复、在途取消或所有输入保留分支 |
| 整 RA-AI04 / AI05 / AI06、全部未验功能、统一 commit | **未放行** | 仍有原合同余件；本子签不替总范围审签，不执行 stage/commit/push/tag/发布 |

## 2. 候选、封包和实际装载边界

原依据为 `AGENTS.md`、`collaboration.md` §9/§11、[最终余项 §4.3](final-remaining-acceptance-reconcile-20261022.md#43-治理与-p0-p3)、[RA-AI04/05/06](remaining-governance-cases-20261021.md#1-ai来源失效与确认守卫)、[PC-G04 原合同](a14-preconfirm-conflict-contract-20261022-plan.md#4-main-修后复验合同本次-not_run)、[A16 原签](a16-extension-selection-gui-review-20261022.md)。原父目标“所有没验完的功能全部验完，再把所有代码都提交”继续由 Main 承担；本轮只审原余件，不新增产品需求或门禁。

| 对象 | 实际核验 |
| --- | --- |
| 封包 | [index.json](../../reports/all-pending-evidence-20261021/AIremainingR1/index.json)，506件逐 bytes/SHA一致，漂移0；SHA `3fe52ee68461ee19c3144018accd2fc9d5398f5bd030a1f4bd1762cbb84790b0` |
| 基线 / 运行候选 | `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` + 旧 U4r2 已认领差异；`/private/tmp/pmtool-u4-closure-20261022-r2`，不是仅 HEAD/version，不是主树 Cycle 后继 |
| source-binding | 102项声明；其中87插件输入在 U4r2冻结树逐SHA一致，15 Launcher项不在该树、主树只读回读一致，不冒称102全在冻结树。binding SHA `d5c95c6c278807779a65a76ab395b7121b73de76dc66bddbdab227ac8d7df411` |
| 主树区别 | 开审只读回读声明集合：99相同，result-card.tsx / commands/task.ts / core/tasks.ts 三项不同；不锁主树、不将后继变化倒签本 GUI |
| client.js | 1,718,721 bytes；SHA `51234141fa6b34182492dbd294b60cb62320aa68aa8004111d6e5b12a6eee055`，等 host-start 的实际包声明 |
| loaded-complete | 2,597,521 bytes；SHA `7d4312dae04a9e979246a6cd241fc51e2312c4b15b8ed3361ff2212e67d8b0e1`；按真实尾部调试标记规则归一化的完整 client 段1,718,689 bytes，SHA `a0e29f76337ed9c509134e520e436bd866848f320ccc5cedd0fe6a4ec84d62c7`，first875361/second-1 |
| 宿主 / gateway | 3258/PID24242，runtime `/private/tmp/pmtool-ai-remaining-runtime-20261022-r1`；3259旧PID24241→新26667；均只从归档认领，没有探活或启停 |
| 同页 | EGO space13/p3，归档target `44D4A245FADD51C7112A2523B1AE8ECF`；35状态同origin3258、timeOrigin `1792665502639.1`、深色1458×734/DPR2 |

完整唯一段匹配是字节证据，不是关键词命中。但本包未另存 loaded 的 requestId/frame/cache/wire时点与 resolver 实际软链回读，因此**只认本包归档响应字节和连续同页的有限关联，不声称补齐全部 uncached/首载时点/宿主 Git 身份门**。最后 page-binding 不是首载事件。原起服 cwd/argv、隔离 profile 副本和 bundle指向可核；没有读取运行 profile、private URL、headers/key或上游。

gateway-r2-start 有旧PID/port/cwd、TERM exit0、listenerGone和新26667的结构化记录；本包没有独立原 lsof/ps/TERM shell stdout，**不把该记录扩大为完整停止安全原工具链 PASS**。当前不重新探测补造历史。

## 3. 05..10 再生成实际 base

原请求/响应由 requestId/rpcId 配对，不用 CDP `at` 的 drain 时间拼 wire 因果。关键实际链：

| 步骤 | 原 requestId | 实际证据 |
| --- | --- | --- |
| 05首合法 ask | 24317.134 | 返回一合法 s1/task.update；模型seq1正文完全等命令响应；05图有建议负责人、整批1/逐步/取消 |
| 06取消 | 无新apply | 原图变暂无草稿；业务及 ledger 不变，宿主 session字节变化另列，不叫全data零写 |
| 07/08人工主保存 | 24317.135；snapshot136 | 正常TaskForm改负责人→主保存成功toast；原任务 `10:41:01.977Z`→`10:49:11.960Z` |
| 09明确新 ask | 24317.137 | 模型seq2 BODY含“AI04 再生成前人工负责人”；新响应仍原合法s1，生成阶段业务零写 |
| 10整批确认 | 24317.138 | 完整 actions 等模型合法步；base仅 `{"t-0001":"2026-10-22T10:49:11.960Z"}`；响应明确应用1 |
| 10回读 / 溯源 | 24317.140 / .141 | 真实task负责人为建议值，updatedAt `10:49:20.898Z`；新 confirmed账本与实际落盘匹配 |

07草稿→08保存全record差异是 **assignee、manualProgress、updatedAt**：原缺省manualProgress变显式null，实际主保存请求也给null，progress仍10。不是偷偷丢字段，不虚称严格只改两字段。09→10只有assignee/updatedAt变；这两个写区间全部业务root差异均仅t-0001。新entry `prv-mvjf5afj-ndj9fs`，ref仅tasks/t-0001，postimage.kind=update、时间等实际record。

05/06/07/08/09/10原PNG已直接目视；原确认按钮存在、最终暂无草稿/新undo入口及任务负责人改变有证。没有连续录像或保存按钮点击帧，故不签整个TaskForm键盘/主保存可达性矩阵。新链补的是**实际发包base**，不把A16原取消文件改写成当时执行过。

## 4. 11..16 四 create 与 F6 来源

11的模型seq3实际BODY、fixture正文、宿主ask响应与12实际actions逐项相同；四steps均needs=[]。生成前/草稿业务不变，明确ask-apply才产生四条业务记录：

| 实体 / 新稳定ID | 实际创建/更新时间（2026-10-22 UTC） | 字段和原GUI |
| --- | --- | --- |
| milestones / m-0001 | 10:49:56.989Z | title正确、targetDate11-30/status planned/achievedDate null；13图见ID/标题/日期/说明 |
| risk_issues / ri-0001 | 10:49:57.003Z | risk/high/medium/open及响应正确；14图矩阵与清单同ri-0001、概率中/影响高 |
| deliverables / dlv-0001 | 10:49:57.028Z | name/v1/planned/说明及created history保留；15图见对应唯一交付物/版本/说明，**该图没有显示dlv ID**，稳定ID依据raw/refs |
| meetings / mtg-0001 | 10:49:57.042Z | draft/10-22/摘要/participants正确；16图见mtg-0001/参会人/摘要，actions空不冒称行动项生成 |

新entry `prv-mvjf62be-6gzkwy` 的 refs恰上述四表/ID，四 postimages.kind=create，时间逐条等真实record；先前task来源完整保留。11→12业务root差异恰四个新文件，原task不动；12→13→14→15→16整根不变。

**F6真实dispatch+provenance的本切片要求已满足**：项目/任务由正常宿主命令创建，四实体由production ask→parser/validator→明确ask-apply→JSON/ledger产生；不是手seed refs、手改业务、提前拼页面计划或假snapshot。隔离模型只控制依赖响应。它不证明原F6十来源完整跳转/重校/富历史，亦不替RA-AI06一次云模型。

11 PNG只展示第一卡与第二卡顶部；12截图诊断滚位停在旧消息上方，成功四步句虽在原状态/响应中，**该图并未目视显示该句/四完整卡**。13..16各新实体页已目视，不以其代替缺失的四卡滚动/确认全过程。四个独立needs=[]不证明依赖拓扑、循环或预算上限的新GUI分支。

## 5. 18..25 非法与 mixed

18..22 model seq4..8 对应 task.delete、mysteryField、attachments=[]、status wrapped、p-0002/t-0002 assignee建议。17正常命令先创建真实B项目/任务，没有搬任务或绕生产项目校验。各before→after业务/files/backups无增删/字节变化，既有ledger原样保留；未因非法建议自动创建来源或apply。

18原 `18-delete-reject-actual-events-events.json` 是空数组：模型BODY有该问题/非法delete正文、seq4有success事件、原图有对应问题与诊断，故可签**该观察区间不写/无合法计划**，但不补造缺失的宿主请求/响应。19..22完整宿主响应逐一等原模型正文。

五个after原PNG已目视，均停只读诊断，不显示具体拒因。源码明确validatePlan留下rejected并在草稿页渲染，但源码可达不等实际打开/看见。因此纯非法原因呈现保BLOCKED；20只覆盖attachments这一字段的空数组拒，未测progressLog或非空数组/富历史清空；21仅task wrapped，22仅该跨项目task，不外推扩展实体所有负例。

23的seq9正文含合法s1 risk.update、s2跨项目task、s3 delete；24原图只勾合法s1，完整可见：

- `已拒绝：s2 t-0002：任务 t-0002 不存在`，是本项目可写目标集合中不存在，不声称全库不存在B任务。
- `已拒绝：s3 t-0001：不允许的操作 task.delete`。

25实际request24317.176只发s1/ri-0001/responsePlan，完整五键base等24生成raw（包括旧task及四扩展目标），响应应用1。ri-0001仅responsePlan/updatedAt变化，其他业务全部保全。新entry `prv-mvjfc814-0df6fz`，refs/postimages仅risk_issues/ri-0001、kind=update；前两entry/history/undo.used不动，未将过滤步登记为applied。

25图停在诊断旧消息滚位，不签最新成功句/结果卡全过程可见性。12/18..22/25..28状态含“本批次涉及的任务已不在当前项目”，实际本批是非task实体且仍在项目。**不将这句话作为实体丢失证据或本轮新需求FAIL，也不签全实体结果卡UX**；仅保留原呈现余件交合同owner按既有#22范围裁定。

## 6. 26..28 故障与恢复

封存gateway seq10/11的behavior=auth、12/13=rate_limit；r2依赖脚本对应真实HTTP401/429分支，原命令180/181均kind=error，GUI原26/27图可直接看到“未返回正文/免费池多次尝试”泛化。gateway记录两类都调用flash→pro，第三模型通道名存在于产品错误文本，**没有该第三模型实际网关请求记录**，不能虚报三次网关执行。

本包没有逐字节归档模型HTTP错误response body/status事件；401/429归属依据已执行依赖分支、实际BODY、失败command/GUI及独立源级报告交叉关联，不冒称完整模型wire抓包。此次不重复另角色生产协议测试。

26/27/28相关业务和ledger逐字节不变；旧“最近处理结果已应用1条”属于25的历史，有原来源/时间，没有本次fake plan或fake apply。28 request24317.182、gateway seq14成功响应、GUI正常诊断及“模型未给出可执行步骤”一致，故明确新正常请求/只读恢复有限通过。

输入busy结束后的新请求有证；“26保输入”只是问题文字，onAsk本身清输入，未实采故障前未发送文本保留，**不能凭问题名签保稿**。06是草稿取消，不是AI在途abort。无key、乱码、超长、超时墙钟、在途取消、正常云模型非空来源+重校仍缺，记BLOCKED/未采，不直接转MANUAL_PENDING。

## 7. 原签继承与不得扩义

| 原签 | 本轮处置 |
| --- | --- |
| [A16 PC-G01..03](a16-pc-gui-independent-review-20261022.md) | 原整批冲突/依赖拒/独立继续、clean链式、逐步0应用及freshundo历史有限签保留，不重采。U4r2的copilot/ask/provenance-store/sidecar字节等A16清单；仅继承未变守卫断言，不外推新外壳视觉 |
| [A16 selection/四update](a16-extension-selection-gui-review-20261022.md) | selection/edit/min/cancel、四update clean/conflict/freshundo原签保留。实际再生成base缺口由本轮新05..10定向补，不覆盖旧BLOCKED或拿create代update |
| [A16 EXT-BASE SOURCE/AUTO](a16-extension-base-independent-retest-20261022.md) | 四create来源/白名单及原新10键Oracle的有限源级签保留；本轮补实际create和mixed，不复跑PC三路、四update、undo |
| [A14 SM01](a14-sm01-clean-mixed-gui-review-20261022.md) | fresh mixed第一次撤销/used=false历史PASS保留；clean成功句视口缺证、mixed重试/其他生命周期不由本包补齐。不重做已签undo，不用当前时间重造旧handle |
| [A13 clean](a13-gateway-clean-undo-gui-review-20261021.md) / [来源补审](a13-source-remaining-gui-review-20261021.md) | 历史clean/来源01..03范围和事后载入/stop缺档照旧。本轮不重十跳/重校，不将新三entry扩大为AI01..03重新全签 |
| AI终止错误专家 | 原必要红及设施纠正保留。本次ai-client源码与其修前SHA一致，仅补认证/限流GUI反证；ATF01/03仍另角色，未自修/未签修后 |

补核9个接缝中6个SHA相同（core/copilot、commands/ask、provenance-store、ai-client、sidecar、provenance-panel）；panel.tsx/panel.css/result-card.tsx三项已不同于A16。因此**原未变数据守卫与历史签可留，不将旧全界面/结果卡/外壳视觉自动继承为U4r2 PASS**。本报告没有完整当前UI门或全部句柄生命周期签。

## 8. 原失败、实际核验与释放

19份原执行元数据与封包逐一一致：13个exit0、6个exit1，均exited/outputComplete=true。exit0是采集结果，不是Main自验收；原执行JSON未列完整命令argv，不制造缺失命令历史。

| 原executionId | 原exit | 原错误（原log保留） |
| --- | --- | --- |
| 8fe0c0187281c2f8833fbeb522b60f0f | 1 | 项目管理click被div拦截，3000ms超时 |
| 05d14686796342d51025405dce31c39a | 1 | input[name=name]等待8000ms超时 |
| 21c25afe66904af5660b6128b2ba38bd | 1 | data-copilot-apply-batch等待20000ms；原log含项目日期外观值，不证明受控提交已成功 |
| e6cda3e8953b31651f8bdd76e06b7f73 | 1 | waitForFunction20000ms，页仍3258 |
| 52ea750781ba52a4971a763935aa1ffb | 1 | 展开副驾旧aria选择器0匹配，click3000ms超时 |
| c830be818560e53ece5b2a60bea3bcde | 1 | waitForFunction20000ms，页仍3258 |

Main raw-report另记日期fill受控state缺失、取消后命令建项目，03错PoC车道未配置、04网关query路径404/EMPTY。03/04图与原错误直接核见；旧脚本保留，新r2仅修模型依赖pathname识别。日期提交拒绝本包没有独立对应GUI快照，**不签项目日期表单PASS或独立产品FAIL**。六exit1与上述设施/产品现象不是一一六类等同，不洗掉/倒签。

本专家实际执行环境macOS/bash、现有Node `v22.23.3`；未调用pnpm、install/build/Vitest/verify/e2e，不运行Mainhelper/seal或原tests，不导入产品模块。全部自有审计仅Node内置fs/path/crypto/assert，输出wx拒覆盖：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/ai-remaining-gui-review-20261022-r1-audit.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/ai-remaining-gui-review-20261022-r1-audit.mjs before
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/ai-remaining-gui-review-20261022-r1-audit.mjs audit
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/ai-remaining-gui-review-20261022-r1-audit.mjs supplement
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/ai-remaining-gui-review-20261022-r1-audit.mjs close
```

语法检查exit0；首before exit1是自有误把15Launcher当冻结路径，ENOENT，未生成before；修正路径后before exit0、608件保护。首audit exit1是自有“人工保存仅两字段”错误预期，实际多了缺省→null的manualProgress；查原请求/raw后精确纠正，无修改产品/原证，第二audit exit0。supplement exit0，另7输入保护并核完整模型plan透传/仅单目标业务写。失败日志保存在实际工具输出，错误/原码明确保留于本文，不把未生成的失败JSON编为已有。

35快照/313pmtool raw逐项等roots；28命令请求/响应rpcId一致；14模型BODY归档、10个success事件；19原执行/6失败全核。仅data/files/backups在原采集扫描范围：settings/session变化与业务分层，未扫描exports/全局cache/附件全部外根，不说全盘零污染。六liveLogsExcluded writerpaths仍可后台追加，完全不纳不可变锁；只核 `frozen-gateway-log` 封存字节。

直接目视24张原PNG：03/04、05..16、18..22 after、24/25、26/27/28；原before和23/29图仅SHA核验，未声称目视。没有连续录像、全console/全部错误时段、浅色/200%/多视口/VoiceOver/云模型PASS。原图与DOM/raw共同支持以上有限结果，不能批量置绿全矩阵。

**最小交回**：Main保留本轮已签base/create/mixed子件；纯非法拒因页、create完整滚动/成功句可见性和全实体结果卡按原合同补已有缺段，不重复生成/写库来证明旧历史；18优先找原request/response，找不到维持缺档。AI错误开发/独立复验另候选处理，AI04其他changed/mixed/句柄和AI06未采故障/真实模型沿原派单继续。未采不假PASS，本子任务不统一commit、不结束父goal。

最终[close.json](ai-remaining-gui-review-20261022-r1-close.json)记录列明615输入的SHA/bytes/mtime回读及报告链接、释放状态，以实际终核工具exit为准；不声称保护了所有旧冻结/全机/活日志。没有占用产品、builder、GUI、端口/profile或业务写锁，无启动长运行进程。**本审证交回 Main，释放 STOP；所有列明服务不探不动。**

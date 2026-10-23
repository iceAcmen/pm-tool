# 已有未验功能总登记与分阶段出口

> 独立测试专家，2026-10-21。本文是有界测试计划和历史证据继承登记，不是全系统 PASS，不是产品新路线。只写 testing 自有产物；Main 唯一修复/构建/GUI 执行端，专家审证。父派单与授权见 `reports/all-pending-acceptance-execution-20261021.md`，产品基线 `2a7603023bc54ef13d788e50069ee3fde4671bf3`，文档 HEAD `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`。

## 1. 范围、状态与执行合同

- 覆盖已批准盘点 §3.1/§3.2：13 类体验/Launcher/PATH、B1-B8、资料/文件/冻结汇报、OP 和人工进度、有来源 AI 治理、深度融合/OKR/习惯、原生缩放/读屏/320 填充、既有 CI 与 EGO/OIL 试点遗留。
- 不含发布/tag/push/正式 profile 切换、H6/R11 常驻推送、多人实时合并、自动排期、Git 自动同步、AI 计划跨重启恢复、U3 snapshotRef 提案、微信产品接入、OIL 新设计模式接管。
- 专家不 install/build/pull、不共用 lib、不启服务、不操作正式 3172/PID44388/profile；Main 隔离树 `/private/tmp/pmtool-all-closure-20261021` 的产物必须另行冻结。本文不认可旧服务“运行中”即候选装载。
- `AUTO` 包括离线及真实隔离库集成；`GUI` 必须实际页面/桌面证据；`本人` 仅确实必须用户权限/认证动作。Main 有桌面能力，Finder/390/200%/VoiceOver 不因专家无能力自动变 MANUAL_PENDING。
- 新用例初态一律 NOT_RUN。旧观察已声称执行却原证缺失/身份无法回绑者为 BLOCKED（证据阻塞），不是产品 FAIL。FAIL 必须有可核现象或源码证明；PASS 只由专家逐项签字。
- 所有者本轮批准持续收口和 Main 最后普通提交；专家自身不 commit/push。未过独立门不标完成、不进入发布候选；修复/补测/文档可继续。ADL-045/047/057/058 适用，旧规格的历史“直接 push/不汇报/3172 可见”不继承为本轮授权。

## 2. 已交批次与执行顺序

| 阶段 | 精确对象 / 采证单 | Main 动作 | 专家出口 |
| --- | --- | --- | --- |
| A0 已交 | [batchA 缺陷及即时单](batcha-independent-findings-and-main-worklist-20261021.md) | 修 BA-DEF-01/02/03；BA-PATH-01、BA-JOURNEY-01/02、BA-COPY-01/02、BA-TTL-01/02/03；原八项继续 | 三项当前 FAIL；修后审原证，不以探针退出0判产品PASS |
| A1 | 同报告原 B1-GUI-01..04、B1-DESK-01/02、B1-PATH-01/02；本登记旅程单 RA-D02/03/06/07/10/11/12 | 按旧合同纠正条款和当前单补未闭分支 | D-01..13 每项继承/复验明示；Launcher/PATH 单独结论 |
| B1 | [完整旅程与文件/汇报](remaining-journey-cases-20261021.md) RA-J01..06、RA-M01..07、RA-F01..08、RA-R01..05 | 先一条旅程，再负例/重进/文件恢复；每条交可核对象ID和写差异 | 单条闭门再推进下一条；失败修复，不堆新功能 |
| B2 | [OP 当前合同补充](remaining-objective-cases-20261021.md) 原 OP 全ID + RA-OP01..06 | 确定性派生、命令、GUI四消费点、ADL-055人工双轨、wrapped、备份 | 保留原 NOT_RUN；新审签逐ID绑定，不用作者脚本总数回填 |
| B3 | [治理与深度融合](remaining-governance-cases-20261021.md) RA-AI01..06、RA-P0001..08、RA-P1001..06、RA-P2001..07、RA-P3001..05 | 非空来源失效重校；P0-P3真实确认、只读、持久及出站 | 组织者记录不自动升级；命令/AUTO与GUI分层审签 |
| B4 | 旅程单 §6 RA-V矩阵、RA-DR/RA-MENU/RA-W、RA-AT01/02、RA-U401/02 | B8四档浅深原生缩放、长密/失败恢复/键盘/读屏；U4按有限修复合同 | 矩阵逐格审证，截图数量不是全系统PASS |
| C0 | 旅程单 §7 RA-CI01/02、RA-TOOL01..04 | 核远端已有CI、EGO有界能力/对照、O3/O5同页；不为试点卡主线 | CI skip与工具能力分别结论；不宣布工具毕业 |
| 总出口 | 所有适用ID + 历史继承台账 + 本人待办 | 最终候选全集回归、重新冻结差异，Main同步living docs后普通提交 | 专家最终逐域报告；本次不授权部署/push |

同一原证可以映射多个ID，但不得一张图片代替多条动作。每条完整旅程可提前完成其关联矩阵格；复用时指到动作时间段/原始记录，不凭标题复用。

## 3. 候选与证据清单

每次交证带 `candidate.json`：baselineCommit、tracked diff 文件/sha256、新文件清单/sha256、lockfile、package version、host commit/批准的宿主例外、构建树/命令/退出码、实际产物清单/sha256、启动PID/cwd/argv/端口、装载解析链、开关（尤其 `pm-b1-pilot`）、fixture包sha256。Main唯一builder，不从主树 lib 补拷贝“相同版本”。

每ID目录带环境/步骤/初末库manifest/脱敏console/网络状态码/原始录屏与逐态截图/数据diff/证据sha256。环境包括 Node/pnpm/browser/OS、窗口外尺寸与CSS viewport、PM容器尺寸、宿主面板状态、主题、**浏览器菜单实际缩放百分比**、执行时间和本地日期。不落认证URL/token/cookie/key/nonce；句柄关系仅记N1/N2。不要输出旧材料中的明文认证值，使用Main产出的脱敏副本并保原索引。

四个观察轴不能互代：源码存在、bundle装载、默认可见、用例通过。测试fixture开关只在隔离环境使用；默认页与pilot页都采。缺产品缝/指定错误无法达到时先报专家 BLOCKED，不用拼DOM/改data/改时钟造生产现象。

## 4. Fixture 总账

所有写使用候选真实命令/领域动作。ID由系统生成，`ids.json`保存别名到真实ID；不得假设 `t-0001` 必属于测试项目。负例通过真实校验提交，非法库只在明确纯函数防御测试内存在。

| Fixture | 可重建定义 / 初态 | 用途 |
| --- | --- | --- |
| F0 | 两个隔离项目 QA-A/QA-B；空库经真实 add；冻结本地 today=D；无正式数据拷贝 | 空态/隔离/取消 |
| F1 | QA-A平面24任务：todo8/in_progress6/blocked2/done7/wrapped1；QA-B另2任务，均各有合法code。A两负责人+未分配；今日/逾期/将来任务，按ids记录；完整状态计数与百分比29%，open16 | B4 v1.2 五态事实；不得叠加OP树改变24计数 |
| F2 | 单独QA-OP树：P→M→L1(1/2)、L2(3/4)，P→L3(无清单legacy40)，独立L4(4/4 todo)、L5(2/5 done)、L6(无清单done)、L7(空数组)、L8(wrapped且1/1)；旧记录样本progress含0/40/80 | OP专用，局部重建防止相互污染 |
| F3 | QA-A任务T，链接 https://example.com/qa-spec，交付物V1和同项目里程碑；progressLog E1有rv1/rv2/rv3且active，E2有rv1/rv2且软删，E3同日异ID有rv1。author=测试甲/乙，日期D-2/D-1/D；版本正文各不同 | 多active修订/软删/恢复/报告复合选择；合法schema日期和作者，不猜字段名 |
| F4 | 真UTF-8 `qa-note.md` 内容 `# QA 文件\n版本一\n`、相同字节另一文件名、不同字节版本二、合法PDF/PNG来自本项目现有测试资源或Main生成的完整文件；恶意类型/错误声明/超上限仅作上传负例 | stage/去重/下载/备份字节；保存源文件sha256，截图不证字节一致 |
| F5 | F0另建task/里程碑/风险/交付物/会议/OKR/习惯/session/reflection/lesson、settings真实写动作各一；F3多修订和F4共享文件；createBackup产出合法一致包 | 全表/字节恢复、旧备份兼容；不同于archive最小包 |
| F6 | 合法来源账本：经隔离 fixture gateway+真实 ask-apply 对A两任务及四扩展实体落库，refs非空；其他基线通过真实update改变。真实模型另列一次运行，不冒充确定性fixture | AI provenance/冲突/撤销/重校 |
| F7 | 习惯历史按原batch1计划§8：当前schema记录+deriveHabitStreak+标准createBackup/产品预检/confirm恢复；最近14天含D-13边界、D-14外界、跨两旧月、有断签；streak与checkIns一致 | 历史展现/档案；不是通过checkin越两天写窗 |
| FL/FD | F1/F3合法长密变体：任务title240字符、description2000；link title200/note500；progress content2000/author80、E1三版；同项目会议/交付物/OKR/habit各20条有效记录；所有字段先经生产schema/写校验，未过校验改为该schema允许最大值并交差异 | 每页长密和布局；不“填充”非法数据库 |
| FE/FB/FS | 真首载请求延迟3s；真snapshot请求网络拒绝并恢复；FS先成功snapshot再拒读后重试。拦截仅传输，不伪造成功/业务数据；F0无结果用不命中词 | loading/error/stale/retry；受控Promise/故障adapter的AUTO独立记 |

F5/F7历史包必须通过生产预检；合法历史可以通过标准恢复导入。纯函数可显式注入today参数，GUI/TTL不改系统墙钟、不伪造当前日期、不放宽两天补记校验。导出、queue open、确认写有合法settings副作用，零写断言仅限该动作承诺只读/取消，不机械要求全部manifest相同。

## 5. 历史证据与继承理由

以下保留旧结论，不在本文改旧报告。`历史PASS保留`不等于当前候选自动PASS；继承需Main交来源原证与相关源码接缝diff/产物绑定，专家只继承未受影响的断言。

| 来源 | 历史有效范围 | 当前处置 / 理由 |
| --- | --- | --- |
| R4/R5（`independent-acceptance-r4-firstfindings-20261021.md`及R5） | 675×745浅、删卡/撤销/排版、单主按钮、静态顶条、工具条、键盘调期、双向里程碑、手工MD安全保存等子项 | 逐项保留；宽屏/深色/连续3次/新复制/即时写/session不继承。板布局/ResultCard/launcher变动受影响重验 |
| `copilot-multistep-acceptance.md` §11 | e03b813的P0确定性及3093 GUI；3092旧bundle作废；两本人待验 | 解析/DAG稳定断言可继承待diff；#22/P0窄集扩写已取代旧only5字段限制；新四实体/撤销/来源/新版卡单独验，不倒退整项 |
| `p2-6-independent-verification-20261017.md` §13 r8 | 21cdc94+diff5e284636…69e9，后端治理/次要项；UI留后续 | F05/F06/F12真实有来源GUI未验；F13真实写失败/F14端到端/分歧并发历史明确非前置，只作观察，不突增硬门 |
| `legacy-clearance-20261018.md` | 真实AI成功refs=[]；有旧来源/视觉总证 | 不证明非空来源变更/删除重校；I8读屏、G4-1真200%、D2风险320填充待补 |
| `g3-evidence-receipt-20261017.md` §F | 12门终审PASS，覆盖其冻结对象 | 保留终审，旧P2-2 BLOCKED不重开；B1-B8/新共享样式受影响另验。不得转抄认证材料 |
| `objective-progress-acceptance.md` | 原计划全部NOT_RUN | 没有历史独立PASS可继承；作者verify/ADL055当需求和线索，不当专家验收 |
| `b2-p3-ops-retest-qa-20261020.md`、`b2-ops-ui-qa-20261020.md` | Q1-Q7/R1/R2真实domain及单层信封静态闭门 | 不重开raw编辑禁用；material commit已显式非空拒绝，旧摘要不能推断仍丢史。GUI多修订/取消另验 |
| `b3-audit-readiness-checklist-20261020.md`、B3数据专项 | 安全/提升/备份/去重等离线局部门 | 相同模块断言可继承待diff，真上传/关闭/下载/恢复完整事务单独补，数量不是整包结论 |
| `b4-u4-multisort-qa-20261020.md`、`b4-project-board-final-qa-20261020.md` | 看板multiSort、max3与priority/milestone真实填充、项目scope静态 | 不重开已撤误判；持久GUI/U4任务表另验，不能把卡引擎能力当tasks完成 |
| `b1-b8-coverage-mapping-20261020.md` | 精确093657 AUTO、092529业务一致仅CSS尾空行GUI导航/dirty、早轮B2/B3与B6摘录 | 12入口只证可达；B6固定摘录事实保留需相关diff；旧“450=原生200%”被较新mapping判约150%取代，RA-V重采菜单证明 |
| `reachability-repair-20261018.md` | 有限675×745导航/空收件区/队列持久/K13打开task | 不证填充确认忽略、投影刷新、全P0-P3；组织者p0..p3 verify不升级 |
| `oil-o3-o4-o5-patch-qa-20261020.md` | 18离线断言和源码；O4限TaskForm | O3/O5 GUI未验；不宣称全抽屉dirty保护，BA-COPY修共享反馈后重验相关UI |
| `oilioil-isolated-pilot-evidence-20261020.md`及批准试点盘点 | OIL安全独立PASS；EGO早期/后期真实能力事实 | manifest旧待审登记不重开安全门；同条件效率未完、后期挂起/401保留；不加载vendor正文/installer |
| ADL-056与`.github/workflows/ci.yml` | core配置与本机验证存在 | 远端job未核；e2e缺harness SKIP exit0不等宿主E2E PASS |

## 6. 已承诺缺口与新范围分界

**RA-GAP-U4 / SOURCE FAIL（实现缺口，不是运行崩溃）**：

- 依据路线图 §3 B4 New、§7.1 tasks New，以及较新 `b1-b8-coverage-mapping-20261020.md` §0“路线清楚、非用户开放决策”；本轮所有者批准盘点收口，未找到任务表明确out-route裁剪。
- 当前核读 `core/task-views.ts:TaskViewState/normalizeTaskViewState/sameTaskViewState`、`client/views/tasks.tsx:268,358-367,419,1066-1071`、`task-views-persist.ts`：只有四态和单sort选择，固定列，无规则数组/列偏好存储。属于**已承诺未实现**，Main按RA-U401/02有限修复并复验。看板引擎multiSort已验不计此缺口。
- 测试只要求至少两合法字段有序排序/显式方向、列显隐及同项目持久恢复/跨项目隔离/旧视图兼容。不把看板max3移植成任务表新上限，不要求自由公式、新任意列、团队共享、后台同步。默认旧WBS/tree行为不能被排序改坏。
- 路线U4最初为待定不能单独证明已批准；本裁决使用较新明确映射及本轮授权。Main若查到有效裁剪，交专家收缩此项，不自行变N/A、不因此暂停无争议现有验收。

明确不是当前新增功能：补非空来源GUI、原生200%、原OP/人工双轨、合法多修订历史、file字节恢复/安全负例、原已承诺U4。明确仍提案/后置：U3、H6、跨重启计划/自动重规划、自由列设计器、微信自动写台账、OIL全产品重设计。新增设计签字/全组件六态/全球所有控件四档矩阵仍待表决；本文矩阵仅来自既有B8和具体历史专项，不追溯AGENTS §6A.1提议。

## 7. 交证与收尾检查

Main先交A0新候选原证，不必等待所有总矩阵完成；然后按阶段交最小完整批。未交新原证前，现状为A0三缺陷FAIL，其余新用例NOT_RUN/历史缺证BLOCKED，**整体未验完**。

最终审签须逐ID注明：执行事实、证据、被测候选、结果、继承/失效理由、缺陷复验和受影响回归。重修共享panel/css/任务表后，对已采相关旅程和RA-V格追踪失效；最终候选无变动的独立数据层断言可按diff继承。没有全局一键“全绿”升级。

文档自检只证明本计划链接/ID/完整性，不构成产品测试。产品完整build/vitest/coverage/全部现有verify/专项/隔离污染门由Main在隔离输出执行，逐命令保stdout/stderr/exit；真实模型单独列当次支持范围和错误，不拿出网随机结果替代确定性门。

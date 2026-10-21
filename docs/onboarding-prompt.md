# 跨平台 Agent 标准启动提示词与 SOP · onboarding-prompt.md

> **本文件记录什么、给谁用、怎么用**：本文件是把任意一个新平台 Agent（TRAE、豆包工作、Cursor、Copilot、其他 IDE/Agent）**快速、无歧义接入本仓库**的「标准启动提示词」，同时是所有协作平台必须遵守的一项 **SOP**。两种用法：① **项目所有者**：把下方「标准启动提示词」整段复制给新接手的 Agent（替换 `<平台标识>`）；② **任何协作 Agent**：**执行任务前必须读本文件**并按提示词完成只读接手，**完成任务后必须更新文末「当前交接快照」**，使本文件始终能被直接复制给下一个接手者。规则细则以根 `AGENTS.md`、`docs/collaboration.md` 为准，本文件不重复、只做引导与交接。

---

## 一、SOP（所有协作平台强制）

1. **开工前必读**：任何平台 Agent 在执行任何任务前，必须读本文件与根 `AGENTS.md`，并按「标准启动提示词」第二节完成只读接手（pull、扫描档案、验地基、报备），不得凭平台内旧对话或记忆直接开工。
2. **新平台接入**：首次接入的平台，由项目所有者把下方提示词整段发给它；该 Agent 按提示词先输出「接手确认报告 + 文件级改动计划」，等确认后再写码。
3. **收工后必更新**：任何平台**完成一次任务并完成提交（及推送）后**，必须更新本文件文末「附录 · 当前交接快照」（更新时间、改动平台、最新提交短 hash、当前状态、下一步、待确认项），并把该更新**随当次改动一起提交**。
4. **维护边界（降低维护成本）**：提示词正文（第二、三节）是稳定流程，一般不改；**易变状态只更新「当前交接快照」**。流程性变更应先改根 `AGENTS.md` / `docs/collaboration.md`，再同步本文件。
5. 本文件与其他文档冲突时，以根 `AGENTS.md`、`docs/collaboration.md`、仓库最新提交为准；发现不一致应在收工时一并修正并在 `docs/changelog.md` 留痕。

---

## 二、标准启动提示词（复制给新 Agent，整段使用）

> 复制前把 `<平台标识>` 替换为对应平台（如 `trae`、`cursor`、`doubao-work`；新平台先在 `docs/collaboration.md` 第二节注册表登记）。

```text
你是本项目「pm-tool（基于 DeepSeek Harness / dsh 的项目经理工具）」的编码接手 Agent。请严格按以下要求启动。注意：本提示只用于引导，【仓库内文档才是唯一事实来源】，不要依据本提示或你的记忆做技术判断；若本提示与仓库文档不一致，一律以仓库最新状态为准。

一、仓库与工作区
- 产品仓库（你工作的唯一仓库）：本机 ~/Projects/dsh-pm/pm-tool（远程 git@github.com:iceAcmen/pm-tool.git，分支 main）。
- 上游只读克隆：~/Projects/dsh-pm/deepseek-harness（基线 v0.2.1-alpha.2，【严禁修改】）。
- 若在新机器、仓库不存在：先 git clone git@github.com:iceAcmen/pm-tool.git ~/Projects/dsh-pm/pm-tool，并按 docs/handoff.md 第 3 节准备上游与环境（Node 用 nvm v22、pnpm 11.28.5）。

二、开工第一步（全部只读，禁止直接写代码）
1. 先同步最新：git fetch origin && git pull --ff-only origin main，确认工作区干净且为最新；若分叉不要强推，按 docs/collaboration.md 第六节处理。
2. 完整阅读并遵守：根 AGENTS.md → docs/onboarding-prompt.md（含文末“当前交接快照”）→ docs/handoff.md（第 0 节）→ docs/progress.md → 最近的 docs/changelog.md → docs/requirements.md → docs/decision-log.md → docs/knowledge-base.md → docs/issues-and-solutions.md；需要技术细节再读 docs/tech-plugin-scaffold.md、docs/feasibility-map.md、docs/handover-archive-doubao.md。
3. 在 docs/collaboration.md 第二节“平台标识注册表”确认或登记我的平台标识：本次为 <平台标识，如 trae>。
4. 验证地基（在 packages/dsh-pm-tool 目录；每条非交互命令前先执行：export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 22 >/dev/null）：
   pnpm install && pnpm run build && node scripts/verify-command.mjs
   必须退出码 0（打印中文 pong、selftest 写入并读回可读 JSON）。失败先修复环境，再谈业务开发。
5. 完成后【只输出一份“接手确认报告”，不要改任何代码】，内容包括：当前阶段与进度、你读到的最新一条变更、环境/地基自检结果、你建议最先做的功能及其【文件级改动计划】（新增/修改哪些文件、为什么、影响范围）、你发现的风险或疑问。等项目所有者（史冰冰）确认后再动手。

三、必须遵守的红线（完整版见 AGENTS.md 第 6 节与 docs/collaboration.md）
- 上游 deepseek-harness 只读；所有功能在 pm-tool/packages/ 下以外挂 dsh 插件实现，不破坏 dsh 原有能力。
- 离线优先：核心增删改查走 ctx.commands（无 API Key 可用）；智能 WBS/AI 撰写等模型生成能力一期仅预留接口不实现；R9 的确定性固定快照与 Markdown 离线可用；里程碑到期提醒 R11 第一版不做。
- 数据用 storage-domain + storage-json 落人类可读 JSON，root 指向 pm-tool/data；落盘布局以 requirements v0.8 §5.1 与 ADL-011/024/025/026/028 为准（单领域 pmtool 下业务实体分表 per-record，路径 data/pmtool/<表>/<id>.json，含 deliverables 表；用表 keys()/entries() 枚举、不建 index.json；Markdown 为导出产物）；data/、node_modules/、构建产物 lib/、密钥一律不入库。
- 删除文件、覆盖他人成果、修改全局/系统配置、git push/对外发布，必须先经项目所有者同意；禁止 force push、禁止改写已推送历史。
- 需求或方案有歧义先提问，可给推荐项与利弊，但不替项目所有者拍板；结论记入 docs/decision-log.md。
- 每次改动后按 docs/collaboration.md 留痕：在 docs/changelog.md 顶部写变更（改了哪些文件/做了什么/为什么/影响范围/日期/平台标识 <平台标识>）；决策写 decision-log（ADL），踩坑写 issues-and-solutions（ISS），可复用知识写 knowledge-base（KB），更新 progress，阶段收尾刷新 handoff，并更新 docs/onboarding-prompt.md 文末“当前交接快照”。任务完成并验证后主动询问是否提交、是否推送；两项分别授权，未经明确授权不得 commit 或 push。
- 每个任务完成后必须运行构建、插件包内全部 `scripts/verify-*.mjs` 和本批专项功能验证；任一项失败不得标记完成或提交。最终回报逐项列出命令、退出码、关键覆盖、失败情况及未覆盖边界。
- 每个任务通过完整回归后，主动依据仓库最新需求与进度输出下一批文件级改动计划；项目所有者确认后立即继续执行，不等待其再次指定下一步。
- 文档一律简体中文 + 通用 Markdown；命令/配置/代码片段完整可复制并注明运行环境（macOS + nvm Node v22.23.3 + pnpm 11.28.5）；每次交付必须能跑、能演示并附验证证据，失败如实报告，不得伪造“已完成”。

四、当前状态基线
- 阶段 1 环境搭建、阶段 2 需求分析（requirements v0.9：R1–R12 及当前已确认数据模型、§5.1 落盘布局）已完成；阶段 3 第 0 步“打通验证”已验收——最小插件 packages/dsh-pm-tool 能被本地源码版 dsh 装载，/pm ping 离线可用、可读 JSON 落盘 pm-tool/data（目录 0700）。
- 业务功能的实时进度、下一步与待确认项以本文件文末“当前交接快照”为准，并对照 docs/handoff.md「下一步」。
- 第三方插件顶级 Web 页面与外部包浏览器构建已按 ADL-022 验证；后续直接复用现有 `dsh.client` + 动态 bundle 模式。

现在开始：只执行“二”中的只读步骤，然后输出“接手确认报告”并等待确认，不要直接写代码、提交或推送。
```

---

## 三、给项目所有者的使用说明

1. 新平台开工：复制上方代码块，替换 `<平台标识>`，发给该 Agent 即可，无需再口头交代背景。
2. Agent 回报「接手确认报告 + 文件级改动计划」后，由你确认；未确认前它不应写代码。
3. 每次任务完成后，确认 Agent 已更新文末快照并提交；这样下次换人/换平台，复制的提示词自带最新上下文。

---

## 附录 · 当前交接快照（易变区｜每次任务完成后必须更新）

> 规则：完成任务的平台在收工时更新本区，随当次改动一起提交；只改本区即可，勿改正文流程。

- **负责人指令检查（2026-10-21，trae，本批提交推送已获准）**：所有者已授权“指令不符合复盘约定时可拒绝或要求完善”；具体有效规则见 collaboration §11.7/ADL-058，AGENTS和KB-041同步。先查上下文自主补齐，重大歧义只问最关键一点，冲突暂停须引用具体条款并说明恢复条件；不受影响的已授权任务继续。不得拒绝粗略想法、审美或不同意见，不升格整份复盘/待表决设计矩阵；负责人可明确修订本人约定，不能伪造PASS或绕系统门。所有者同日另已授权本批commit/push，规则提交用 `git log -1 --format=%H -- docs/collaboration.md` 定位，前置HEAD969f2dd。纯文档不改产品候选2a76030、现有审签待办与发布门。

- **提交身份补记（2026-10-21，trae）**：产品候选提交 `2a7603023bc54ef13d788e50069ee3fde4671bf3`（短 `2a76030`），提交身份 Ice，当前普通推送已授权；专家以此提交核定产品。此补记只改文档，不改源码/测试/bundle，仍待独立审签。

- **当前接续（2026-10-21，trae，候选 Git 提交推送已获准，待专家审签）**：所有者原句“提交代码并推送，准备进入专家审签流程”；本批候选以该主题最新提交为准，可用 `git log -1 --format=%H -- reports/batch1-expert-signoff-20261021.md` 定位完整哈希（文档不能自含自身提交哈希）。审签包见 [`reports/batch1-expert-signoff-20261021.md`](../reports/batch1-expert-signoff-20261021.md)，源码指纹及97项退出码已归档。自查另有App单引号路径、旧nonce绑定、复制状态三项待核；最终GUI磁盘原证与TTL合同仍待专家核定。本次仅候选Git动作，不发布/自签PASS；下方未提交状态为授权前历史。由独立专家核计划和证据，Main按步骤补采，不开新功能。

- **第一批候选收口（2026-10-21，trae，四项遗留已修复复验/待独立判定，未commit/push）**：HEAD仍`06a131c`+未提交候选。已修 Finder ready 回告补试与成功清 hash、看板连续拖动操作前快照、恢复错误单前缀、复制成功/失败可见及注入核值；连同此前宽屏编号、两项路径和 launcher 空白页修复。Main 真实 GUI 观察：Finder 自拉起3199后snapshot→S4且地址栏令牌清除，三拖三撤销严格逆序，非法备份单前缀，复制参数与原文一致。launcher 44/44+verify，插件1130/1130+build，最终97 verify 97/97；历史真实模型首轮波动保留。正式3172/PID44388未变。临时3199/PID880、launcher/PID758、control/61201须接续重核。原始索引[`reports/batch1-closure-raw-evidence-20261021.md`](../reports/batch1-closure-raw-evidence-20261021.md)。下一步仅由独立专家审证并定逐项结论；不开始新功能、不提交/推送。

- **复盘后建议计划（2026-10-21，trae，文档已落盘）**：[下一步分批规划](plans/2026-10-21-post-retrospective-roadmap.md)：现有13类/launcher验收收口优先；同期对齐单一接续、授权、插件/宿主来源；之后确认共性工程缺口、按完整旅程落实既有设计、真实使用决定新功能。HEAD仍 `06a131c`，在途成果保留。本轮未改代码/服务、未跑产品测试/GUI、未commit/push；建议不等新功能实施批准，不改变当前独立门。

- **最新知识交接（2026-10-21，trae，文档已落盘，未commit/push）**：[深度开放复盘](retrospectives/2026-10-21-deep/00-report.md) 及事实/对抗/反证/整改已保存（164现象、73假设；TRAE可访问历史不完整）。AGENTS入口、collaboration §11、ADL-057、KB-039、ISS-028～032已同步；基线HEAD仍 `06a131c`，未fetch，原在途改动保留。本批只研究与文档检查，不build/verify/GUI、不动服务、不给产品PASS。下方13类/launcher仍由当前开发owner/Main采证者/独立专家分别补修、采证、审签；不借复盘启动新功能。验证及未覆盖见同目录07-validation.md。
- **宿主待核边界（同日补审）**：本机上游有UI提交 `1142fb74f2`（18文件），插件仓库clone不天然携带；直接改上游的批准例外、当前正式宿主版本待核。不自动回退/清理，详见同目录08-late-boundary-evidence.md，P-ADD-01/H-ADD-01不混首轮73条。

- **最新接续（2026-10-21，doubao-work，13 类体验修复候选｜未提交 / 未放行 / 非独立 GUI PASS）**：HEAD `06a131c`（`06a131cd5fdc4486dd74afe89cc4c5630f0a4c98`），本地领先 origin/main 17；本批候选 9 文件（基线 7 + D-10 新增 2，跨 core/client）与 launcher 候选均未 commit/push。候选明细（跨 core/client）：P1-1 反馈层级双轨（结构化成功信封直接判成功、中文错误关键词仅兜底裸返回；`core/ui-feedback.ts`(+test)、`client/panel.tsx` 成功站点）；P1-2 OKR 主归属 KR-only（计入权重唯一父目标，primaryOptions 仅 objective）+ 全 kind 软关联全量 `relatedOptions` picker（`views/growth-form-props.ts`、`views/okr-form.tsx`、`panel.tsx`），不砍 kind/不加 schema/不动权重；就绪回告 bridge `client/launch-handshake.ts`(+test)（mounted+snapshot 成功后解析 `#pm-launch=port.nonce`、清参保业务 hash、POST `/api/entered` nonce、credentials omit、2xx 即止、失败不假成功）。D-10 空态接线：`client/views/reports.tsx`（空态提前 return 前提取 formOverlay 共用）+ `client/views/reports-entry-guard.test.ts`。独立 R4 子用例已测：bridge 14/14、verify-ui-feedback OK、p2b-okr 26/26、form-validation 通过（ARIA/内联留 GUI）、build0、records 域 61/61；launcher 候选（执行者另写）42/42、verify0。作者主根复跑（自验非门）：vitest 1118/1118、build0、guard 95/95/污染0（作者主根 guard）。13 项 GUI 状态（R4/R5 窄视口 675×745 浅主题，权威 §7 见 `docs/testing/independent-acceptance-r4-firstfindings-20261021.md` sha `986d190d…1e726f`；子项 PASS≠整项，宽视口/深主题未测）：D-01 PASS 子项（看板卡点×移除→↶撤销、自动排版压实可撤销）/NOT_RUN 连续拖卡（旧删任务 t-0001 误判已撤回，不新增任务撤销）；D-02 PASS 子项（配置模态仅1 primary、卡片库分组渐进、备份菜单0 primary）/NOT_RUN 宽档互斥；D-03 PASS 子项（概览 header static 不压卡）/NOT_RUN sticky 叠层；D-04 PASS（工具条四组分组+新建 primary）；D-05 PARTIAL（编号格待宽视口）；D-06 PASS 子项（唯一 primary）/NOT_RUN 危险确认级联；D-07 PASS 子项（←→平移1天持久化、Shift→延长工期持久化、里程碑可达、单击选中）/NOT_RUN 点按阈值；D-08 PASS（T1↔M1 双向闭环）；D-09 PARTIAL（短 advisory）/NOT_RUN 分级色/顶层横幅；D-10 PASS 子项（R5 manual 源编辑/预览/探针转义/rpt0001 重开留存，无 AI/key，独立重建 lib/client.js sha `1b3f05d7…02733`）/未测 AI session+宽深；D-11 PASS（草稿 select→「关联交付物」→保存，任务 chip+D1 反查双向；即时写路径未单独复测，旧 select-only 误判已撤回）；D-12 PASS 子项（软关联通俗解释+伪造 ID 内联拒绝）/NOT_RUN 顶层横幅；D-13 PASS 子项（同日幂等）/BLOCKED 长历史折叠（后端仅2天回填窗、不绕校验，非BUG）。运行：新隔离 3199=PID 66544 iso3（旧 33859 已 TERM），正式 3172=PID 44388 未动；BLOCKED：Finder 双击 E2E 子代理 cu 仅 Main 操作，待 Main 采桌面证据；3172 未加载 bridge 不期待 S4。app 候选已交付在 `/Users/bytedance/Documents/dsh-pm-tool/本地启动器候选-20261021/`：`PM工作台.app`（默认 3172，烤 nvm v22.23.3 + 仓内 `launcher/bin/pm-launcher.mjs`）、`PM工作台-隔离验收.app`（烤 127.0.0.1:3199）；最终根 `/Users/bytedance/Documents/dsh-pm-tool/PM工作台.app` 未放仅因独立未过，`launcher/dist` 非当前 artifact。3172/真实 data/11 卡/配置未动；下一步 Main 采证 → 独立判 13 项，实证缺陷由 client 统一机制补修，最终 Git 组织者统一安排。
- **快照更新时间**：2026-10-21（未提交候选，待独立 GUI）

- **最新专项交接（2026-10-20，doubao-work）**：7f44c46后仅修总览宽高输入/拖缩保存/多列排版。编辑固定12列960px画布、浮层不挤压、显式应用字符串尺寸、取消被动投影回写、显式可撤销自动排版。114文件/1025例、build、isolation94/94/228零污染通过。正式代表6/10→拖缩7/11→保存/reload/服务重启保持541×516px；位置0/0→1/1；空输入/撤销/取消零写；8场景实际卡体碰撞/slot越界0。当前11卡和全部config保持，推荐多列通过UI保存，原布局备份留存。独立代码审查及补充GUI原始证据专项审证PASS（无阻断项）；非全系统或16卡型全部操作验收。交付目录`看板宽高与排版修复-20261020/`；后续等待所有者验证，不扩其他页；本次正常commit/push在持续授权内。

- **上轮专项交接（2026-10-20，doubao-work）**：基线 `6a8013e` 后仅修总览卡体覆盖邻卡：浏览态 slot 明确高度 + 卡体填满/内部滚动 + 成员条弹性宽度 + 删除冲突窄屏覆盖，未改原数据/布局。新增 static-size 3 项回归；113 文件 / 1020 测试、tsc/build、isolation 94/94 零污染通过。正式3172四档×浅深8场景每场11卡实际相交和四边越界0；独立两轴和专项PASS。**不是全页面改版完成证明**；resize 保存/刷新前后逐卡对照未测；下一步等待用户验证当前总览，不自动扩大全量整改。提交定位按 `git log -1` 与 changelog 此专项标题，普通push在既有持续授权内。

- **当前状态（2026-10-18 doubao-work，已 commit+push main）**：**P1 深度融合·呈现+交互层已完成并核验**。P0（底座+采集闭环）验收通过后的第二阶段，对应效果图 S1 完整化与 S3 深化。五项能力：K11 补记队列（读时派生——到期未达/严重度>到期排序/迟到标识/Top1+折叠/mute 二态+TTL/关键项豁免/K9 缺席/时段静默；命令 `queue open|list|mute|unmute|quiet`；snapshot 携带 queue；看板队列卡）、K13 对话内只读投影（**防过时**——渲染时最新状态+「数据截至」+刷新）、K6 完整版呈现（「提示不代替人验收」）、X6-L2 完整复盘草稿流（milestone achieved/deliverable accepted 钩子→完整草稿+关联任务清单+留白；人定稿；**deliverableId 存在性/同项目校验补齐**）、K19 保护面组件（loadFacts 纯事实/stanceSuggestions 建议砍缓/staleStanceTags 烂尾标签；无裁决无硬上限）。规格 `docs/design/deep-integration-v2-p1-dev.md`；验证 `docs/design/deep-integration-v2-p1-verify.md` + `docs/verification/p1-20261018/`。验收：build=0、vitest 30 文件/326 用例全绿、verify-isolation **80/80/失败 0/污染 0**、verify-p1-integration **45/45**（真实命令+真实 JSON 落盘+幂等+负例）；未碰 3172。
- **快照更新时间**：2026-10-18
- **最近更新平台**：doubao-work（**P1 深度融合·呈现+交互层**——K11/K13/K6/X6-L2/K19 五能力，5 分片并行+契约层+集成验证；build=0、vitest 326/326、guard 80/80/0 污染、p1-integration 45/45；已 commit+push main）
- **提交定位（本批已 push main）**：本批在 main 直接提交「P1 深度融合：呈现+交互层（K11补记队列/K13投影/K6完整版/X6-L2完整复盘草稿流/K19保护面）」并 `git push origin main`；不改 package.json version（仍 0.7.4）、不打 tag；发布基线仍 v0.7.3=`eb41b30`（v0.7.4 由 S4 批次标记）。
- **版本口径（2026-10-17 #24）**：已发布注解 tag `v0.1.0`–`v0.7.3`；本批为测试/CI 基建（非语义化版本发布），沿用 `package.json` 版本号；只加 devDependencies（vitest/@vitest/coverage-v8/puppeteer-core），运行时依赖与块结构（client.js/client.editor.js/client.formula-expr.js）不变。
- **当前阶段 / 状态（2026-10-17）**：**#24 测试框架 + CI 已核验（已 push main）**。vitest 定位 core 纯函数单元层，与 verify-isolation（存储/隔离/集成门，73 脚本）互补：`src/core/*.test.ts` 4 文件 29 用例（gantt.criticalPath 线性链/成环/缺日期/多分量/确定性；settings 默认值/归一化/非法回落/灯号倒挂；resolveTaskProgressMeta 客观人工双轨/无信号 none；validateActions 四实体白名单/交叉约束/未知拒绝）；v8 include 收窄本批四模块，阈值 lines40/branches80/functions35/statements40；`pnpm e2e` 确定性缝不出网；ci.yml core 必经 build/verify/test:coverage，e2e 独立 job，real-model smoke 不进必经。全量 guard **73 脚本 / 73 通过 / 0 失败 / 0 污染**；vitest **29/29** 过覆盖率门。
- **上一阶段（#23，2026-10-17，已 push main）**：客观进度补全——doneAt/completedDate 展示、effortHours、evidenceUrl、manualProgress 人工设定双轨，客观以清单 checked/total 派生、无信号显证据不足不伪造，加法式可选字段；guard 73/73，证据 `docs/verification/progress-meta-20261017/`。
- **备份目录口径（2026-10-14 更正）**：默认 builtin = 仓库 `packages/backups/`（`BUILTIN_DEFAULT='../../../backups/'` 相对 `packages/dsh-pm-tool/lib/core/backup.js`），**非** `packages/dsh-pm-tool/backups/`、**非**仓库根 `backups/`；优先级 **显式 directory 参数 > `DSH_PM_BACKUP_DIR` > builtin**。
- **验证（#24，2026-10-17）**：`pnpm build`=0；`node scripts/verify-isolation.mjs` **73 脚本 / 73 通过 / 0 失败 / 0 污染**（before=after=165）；`pnpm run test:coverage` vitest **4 文件 / 29 用例全过**，子集 All files lines 45.02 / branches 86.25 / functions 42.37 / statements 45.02 过门槛（lines40/branches80/functions35/statements40）；`pnpm e2e` 本机可重复 PASS（隔离 DSH_HOME+临时存储备份+端口 **3171**，DSH_PM_E2E=1 不出网，正式 3080=PID 66364 未变、3091 未监听，ISS-027 单 PID TERM）。本机无 `gh` 登录，未在 GitHub 端观测 Actions 实跑。
- **已知限制**：免费池随机模型纯文本可用、工具调用不保证、约 50 次/天、偶发超时重试即恢复；删根须叶子→根或用 cascade confirm；首页斜杠命令点发送按钮、发送后到侧栏点最新会话。
- **key 已配置、端点已实测（2026-10-11 更新）**：key 已由所有者写在其本机 `~/.zshrc`（仓库外、不入库；改前已备份 `~/.zshrc.bak-20261011-130537`）。所有者本机直连实测：`GET /v1/key` 返回 `is_free_tier: true`、`free_model_daily_requests.limit=50`；`POST /v1/chat/completions`（`model=openrouter/free`）两次真实调用均成功、`cost=$0`、`finish_reason=stop`（随机落到 `liquid/lfm-2.5-2.6b:free`、`nvidia/nemotron-3-ultra-550b-a55b:free`）。经验见 KB-034（推理型模型先吃满 reasoning tokens，`max_tokens` 要给足 ≥400）。
- **应用内已实测打通（2026-10-11 更新）**：在 dsh 网页底部模型选择器选 **Free Models Router**（openrouter-free/openrouter/free）发「你好，用一句话介绍你自己」，**第 1 次即成功**（puppeteer-core + 系统 Chrome 139 无头，KB-032）：助手正常回复、无 MISSING_CREDENTIAL/401/429。期间曾踩一次 `MISSING_CREDENTIAL`（“OPENROUTER_API_KEY which is not set”）——根因是 dsh 进程由「写 key 前的旧终端」启动、进程环境无该变量；停旧进程、用已 `source ~/.zshrc` 的环境重启即解（KB-035 / ISS-024，永久做法是在 Web「设置→模型」页把密钥录进 credentials service）。
- **新增协作硬规则**：每个任务完成后必须执行构建、当前全部 verify 脚本和本批专项验证；最终回报逐项列出环境、命令、退出码、关键证据和未覆盖边界，任一失败不得标记完成或提交。
- **连续推进规则**：每批验证完成后，执行平台主动提交下一批文件级计划；所有者确认后直接继续编码。
- **版本控制确认规则**：通常每批完成并验证后，提交与推送分别请所有者授权。**本轮（R9 收尾起的连续开发）所有者已一次性持续授权 doubao-work：仓库内代码/文档修改、正常 commit、`git push origin main` 可全自动执行，无需逐次请示**；仍禁止 force push/改写已推送历史/提交密钥或业务数据，删除他人成果、改全局配置、发布 npm/正式版本等不可逆外部操作仍须遵守安全规则。
- **授权状态**：本批在持续授权范围内提交推送（提交信息标 `[doubao-work]`，推送后核对 HEAD=origin/main）。
- **所有者已定规则（ADL-012～035）**：R12 检索/统计为只读派生、Web 看板基于 snapshot（ADL-029）；Excel 导入（ADL-030）、多人实时协作（ADL-031）、R11 里程碑提醒与生成型能力（ADL-032）本期暂缓/裁剪；浏览器兼容仅 Chrome（ADL-033）；上游 dsh 新版本按 peer 锁定 + 升级冒烟（ADL-034）；**OpenRouter 免费自动路由作零成本尽力而为 LLM 通道、核心保持离线、其他官方厂商预留模板（ADL-035）**。
- **下一步 / 遗留（2026-10-18）**：**P1 深度融合·呈现+交互层已完成并核验并 push main**。下一步推进 **P2 深度融合·愿景层**（X7 愿景/OKR 层，K11 周期触发接线点已在类型层预留）+ X6-L2 的宿主集成目视；H6 常驻推送 P3 单独立项（先调研宿主通知能力再决定是否解除 C7）；K2 窄集跑通后由用户复核再扩界（第 3 项 approved-pending + H5）；真实宿主渲染（3172 重载目视/交互）与真实 LLM 草稿质量留待用户真实实例复核。历史遗留：P2-2 Token 2.0 视觉基准为进行中候选（G3 真实浏览器目视门 BLOCKED，未放行）；prod 真实 Key 录入 MANUAL_PENDING；关键路径自动排期/压缩（甘特B 长期观望）未做；CI 端 e2e 因缺仓库外只读宿主为 SKIP。
- **最近一次交接（2026-10-18）**：doubao-work 完成 **P1 深度融合·呈现+交互层**并 push main。K11 补记队列（读时派生+命令+snapshot+看板卡）、K13 对话内只读投影（防过时：最新状态+数据截至+刷新）、K6 完整版呈现、X6-L2 完整复盘草稿流（milestone/deliverable 钩子+deliverableId 校验补齐）、K19 保护面组件（纯事实+建议砍缓+烂尾标签）；5 分片并行+契约层；build=0、vitest 326/326、guard **80/80/0 失败/0 污染**、verify-p1-integration **45/45**（真实命令+真实 JSON 落盘+幂等+负例）、分片自验 p1a 22/22、p1c 22/22、队列卡 SSR 13/13；未碰 3172；规格/验证/证据三份文档已入库。

- **最近一次交接（2026-10-18）**：doubao-work 完成 **P2 深度融合·对外+长寿层**并 push main。K18 单向出站（三档导出：技术 MD/在线增强 web 自包含 HTML/离线 plain 纯文本；出站日志两类：pmExportAudit 只增流长期保留 + pmExportSent TTL=30 天过期归档；只读分发非双向同步、外部为唯一事实源、不预设 GitHub）、X7 愿景/OKR 层（okrs 表：单父 primaryOkrId 权重归属、relatedOkrIds 软关联不计权重、suggest 只进收件区未确认不生效、confirm 建 draft、人定稿）、X2 收尾标记（wrapped 枚举：不催办/不计 done/open/check 不命中/复盘钩子不触发/AI 禁写中文拒因、前端中性灰徽章）、X3 失败经验（句级 known/pending/blank 留白不编造仅人定稿）、K16 档案最小保存包（package.json+README-字段说明、非全量镜像、不写出站日志）、X5 述职素材（review 三段做了什么/量化结果/关键产出、零写）；4 分片并行+契约层+集成接线（panel.tsx okrs 视图切换器）；build=0、vitest 37 文件 / **399/399**、guard **84/84/0 失败/0 污染**、verify-p2-integration **56/56**、分片自验 a 26/26、b 26/26、c 28/28、d 通过；未碰 3172；规格/验证/证据三份文档已入库（`docs/design/deep-integration-v2-p2-dev.md`/`-verify.md`/`docs/verification/p2-20261018/`）。

- **最近一次交接（2026-10-18）**：doubao-work 完成 **P3 深度融合·纵向+宿主层**并 push main。X7 习惯层（habits 表：checkin 今天+2 天补记窗回填 backfilled 标注、streak 断签缺口>2 天 current 重置 0 但 longest/totalDays 永久保留、纯文本档案「当前连续 N 天·历史最长 M 天·累计 X 天」无激励动效、收件区 suggest 零写入 confirm 建 draft、finalize 幂等、okrId 关联校验）、K11 周期接线占位（cycle-hooks.ts：CYCLE_HOOKS+cycleHookPoint enabled:false，无定时器）、**H6 立项调研完成待用户拍板**（`docs/design/deep-integration-v2-h6-research.md`：宿主无外部通知渠道，推荐维持应用内派生现状不立项宿主级推送，路线 A 四拍板条件）；前端「习惯」视图+panel 接线+Snapshot.habits；3 分片并行（后端/前端/调研）+契约层；build=0、vitest 38 文件 / **427/427**、guard 全通过/0 污染、verify-p3-integration **29/29**、分片自验 p3a 22/22；未碰 3172；规格/验证/证据三份文档已入库。

- **可达性修复：OKR/习惯导航与页面、两收件区、K13 副驾（2026-10-18，3172 真实 GUI PASS · 675×745，未 commit/push）**：主端真实实例全 PASS。OKR/习惯桌面左导航「目标与习惯」组与窄屏切换器同源可达；两收件区（pmOkrInbox/pmHabitInbox）由 snapshot 透传到页面，confirmed=已采纳不计待确认/不显写按钮；队列离板回总览、全局刷新、浏览器 reload 三持久化路径均 PASS，只见队列卡、无「＋」新增入口；PM 副驾真实问 t-0008 出现投影卡并可打开抽屉，仅 PM 插件内只读、非宿主全局聊天。队列侧 board 修复（queue-aggregate/queue-card/BoardBento）一并纳入实测。个人看板布局为用户明确触发的可逆写，正式业务数据未改、不入 git；H6 常驻推送仍暂停（未实现）；未碰 3172 进程。

- **本机独立试点（2026-10-21，trae，未commit/push）**：所有者明确“我已确认方案，请开始部署 Mac 桌面采集试点”。本地代码/venv已部署 `~/.local/share/wechat-project-pilot/`（WeChat-MCP0.3.1锁提交 `c6c600ae…0164`），配置/数据 `data/wechat-pilot/` 被Git忽略；双击入口与说明 `reports/wechat-pilot-20261021/`，计划 `docs/plans/2026-10-21-wechat-desktop-pilot.md`。20/20开发自验、指纹/语法检查符合预期，非独立PASS；doctor exit2（辅助功能/屏幕录制false，AX=-25211），白名单为空，真实采集/定时进程未启动。本人需开Terminal系统权限并指定完整群名，trae继续真实采证。只读、本地规则草稿，不调用云模型/发消息/写正式台账；产品代码/lib/profile/服务/他人在途未动；已fetch/pull，HEAD仍06a131c领先17。

# 技术决策日志 decision-log.md

> 本文件按时间记录每个重要技术/方案决策「决定了什么、为什么、有哪些替代方案、最终结果」；给后续维护与迁移者使用，遇到「为什么当初这么做」时来这里查。每条决策不可删改，只可被新决策 supersede（取代）。

记录格式：`编号 | 日期 | 标题 | 决策 | 理由 | 替代方案 | 最终结果/状态`

---

## ADL-058 ｜ 2026-10-21 ｜ 负责人授权指令检查、最小澄清与范围内暂停（平台：trae）

- **负责人原句与目的**：“如果我提的一些想法或者命令不符合复盘文档里对我的要求，你可以拒绝执行，或者让我完善我的指令。”将复盘 §7 的有关建议落实为后续协作约定，减少范围、授权、证据和完成表述错位。
- **决定**：在 collaboration §11.7 定义分级处理：上下文可补的自主补齐；后果明显不同的歧义只问最关键一点；与已生效硬约束冲突时暂停相关动作、给依据与替代；不受影响的已授权工作继续。AGENTS/交接入口指向同一条款。
- **适用范围**：愿景与本批终点、重大追加需求、缺陷与新功能次序、方法增量、授权与系统门、主观反馈与事实假设、可执行质量验证与本人必要决策。粗略想法、审美、未填模板或反对 Agent 推荐均不是拒绝理由；工程转译和基础调查由 Agent 负责。
- **生效与例外**：自本次授权起用于本项目全部接手 Agent，不追溯历史，不把整份复盘或待表决设计矩阵自动升格。负责人可明确修订本人规则或范围清楚地特批；普通催推进不视为撤销。不可伪造 PASS/证据、不可绕系统门。原失败与新特批分开记录。
- **替代与取舍**：只口头提醒不足以跨平台复用；按所有复盘建议机械拒绝会压制探索、转嫁技术工作；逐命令人工审批增加负担。采用少量有实际触发条件的指令检查。
- **影响与验证**：仅协作文档变更，不修改产品需求、代码、测试、运行实例或发布状态；检查条款/链接/反例与产品源码零差异。该约定不等自动化拦截程序，执行效果留待实际任务验证；本批未获新的 Git 提交/推送授权。
- **后续授权补记**：所有者同日明确“提交代码并推送，完成本次协作文档修改”；本批普通 commit/push 已获准，替代上一行写入时的未授权状态，其他范围不变。

## ADL-057 ｜ 2026-10-21 ｜ 开放式深度复盘沉淀执行合同、候选身份与证据范围（平台：trae）

- **依据与授权**：负责人明确要求从立项至今开放复盘、客观检视所有角色、保存长期知识并新增/修订踩坑与项目规范。本批授权文档沉淀；不扩大为产品代码、正式服务、commit/push或发布动作。
- **决定**：建立 `docs/retrospectives/2026-10-21-deep/`：164项现象、360条主摘录+60条追加、来源覆盖指纹、五角色73假设/R2真实质疑/独立R3裁决、逐条支持反证分类与整改。将可执行约定写collaboration §11，AGENTS作入口，KB-039与ISS-028～032归纳历史机制；同步交接。
- **规则范围**：单一当前入口、原句/推断分层派单、按平台动作时点辨持续授权、唯一builder/隔离输出、dirty候选认领、合法fixture/数据不变量/宿主合同/真实旅程分层、证据影响索引、子项不扩全量、权限/环境/状态分轴。细化ADL-045/047与隔离，不让vendor替代门。
- **重要收缩**：默认OFF有试点合同，不能单独判开发遗漏；17ahead/脏树不定失责；可信J/K不倒推Space/390；active单rev1→1不当多rev塌缩实测；QA事务文字歧义交原专家澄清。压缩失忆、模型同源因果、真实Linux迁移、额度与工具主因无足证保持待证。
- **收尾追加证据**：本机上游有UI提交 `1142fb74f2`（18文件），而入口仍上游只读；用户确要求首页改善，但直接修改路径的明确例外授权待核。P-ADD-01/H-ADD-01单列补审，插件/宿主分别认领，不追溯直接判越权，不自动回退；不混入首轮73条统计。
- **替代方案**：只按仓库摘要归因（原始行为链不足，已补轨迹）；加更多Skill/强制更大矩阵（不能补模型/fixture/候选错位，不默认采用）；全面重写或清树推送（不符合本批研究授权及独立门）。
- **生效与结果**：自本条起供后续任务执行；不追溯判历史违规，不升格AGENTS §6A.1待表决提议。文档归档完成只证明复盘成果，当前产品/launcher未提交与独立未测状态不变。全文及验证见 [总报告](retrospectives/2026-10-21-deep/00-report.md)、[文档验证](retrospectives/2026-10-21-deep/07-validation.md)；代码整改另走测试计划与独立验收。

## ADL-051 ｜ 2026-10-16 ｜ 关键路径 CPM：只读显示优先、按分量反向、slack=0 判定、与「自动排期」严格区分

- **背景**：GI-CP-01~05 要求在甘特上标出关键路径，但项目红线禁止自动补日期/自动顺延/打断环；产品路线里「甘特B 关键路径自动排期」是长期观望项。需要决定 CPM 的口径、降级边界与它和自动排期的关系。
- **决定**：
  1. **只读派生，零写**：`criticalPath(tasks)` 是 core 纯函数，只消费既有 startDate/dueDate/predecessorIds，输出 ES/EF/LS/LF/slack/onCriticalPath 供渲染；不写库、不回写任何派生字段、不调用 run/execute、不新增 zod schema、不动 storage.ts。
  2. **以相对天偏移算 CPM，不建模 lag**：工期=含端点日历天（复用 taskDurationDays），FS 零间隔；ES/EF/LS/LF 用相对组件起点的整数天偏移，避免引入墙钟/今天注入带来的非确定性；slack=LS−ES，**slack=0 即关键**（整数天、容差 0）。
  3. **按连通分量各自反向**：用并查集把合法无向边分组，每分量独立取组件最大 EF 作汇点 LF，再 min 传播；避免把孤立短链按全局项目终点压出假正时差（否则短链关键任务被误判非关键）。
  4. **诚实降级而非修复**：成环（3 色迭代 DFS）环上节点 inCycle、跳过遍历、不高亮、不打断；缺日期 missingDate、不补日期；自指/悬空计数剔除并在 tooltip/徽标说明；空输入返回空结构不抛。
  5. **与自动排期区分**：本次只做「显示哪条是关键路径」，不做自动压缩工期/自动改期/资源平衡；后者仍属产品「甘特B 长期观望」，不在本批。
- **理由**：单用户本地台账没有权威工作日历/lag/资源约束，硬算绝对日期排程会制造伪精确；只读 slack 排序是诚实且可复算的。按分量反向保证多个互不相连的计划各自内部关键链不被稀释。高亮必须零写，符合本项目「派生不回写」一贯红线。
- **替代方案（已否决）**：① 以全局项目终点对所有分量反向（短链被压出假正时差，否决）；② 检测到环/缺日期就自动打断环或补默认日期顺延（越权改写、违反红线，否决）；③ 直接做自动排期压缩（越界到长期观望项，否决）；④ 用连续日历绝对日期存 ES/EF（引入今天注入与边界歧义，改为相对偏移，否决）。
- **最终结果/状态**：已实现并通过 GI-CP-01~05（纯函数 verify-critical-path.mjs + 隔离 Chrome 3131 浅/深/拖链尾实测，guard 70/70、0 污染）；证据 `docs/verification/gui-critical-path-20261016/`。

## ADL-052 ｜ 2026-10-16 ｜ #21 口径配置化：默认值=硬编码现值、可注入缺省回落、局部合并持久化、设置抽屉单文件

- **背景**：健康分权重/封顶/灯号线、临期窗口、人员过载阈值原本散落在 `core/derived.ts`、`people.tsx` 等硬编码；需要把它们做成项目级可调、可持久化、有设置 UI，同时保证「无设置记录时所有派生结果与今天逐值一致」，且不污染业务实体 schema。
- **决定**：
  1. **默认值逐值等于原硬编码**：`core/settings.ts` 的 `DEFAULT_PROJECT_SETTINGS` 直接锁定 3/4/6/10/8、封顶 15/12/20/16、灯线 80/60、窗口 7、过载 5；无设置记录/字段缺失/非法一律回落默认，老数据零迁移、不报错。
  2. **派生纯函数可注入、缺省回落**：`scoreFromInputs/computeProjectHealth/computeReminders/groupOpenTasksByAssignee/computeKPI/buildAgenda` 第二/可选参接 settings，不传=默认；命令行显式参数（`/pm due 14`）优先于设置。保持纯函数/确定性（today 注入、无随机/墙钟/零写）。
  3. **持久化复用 settings 表透明存取 + 原子写**：`/pm settings put/reset`，不新建表；`put` 把本次 JSON **局部合并到既有原始记录**（未列出的自定义字段保留，不被默认冲掉），再整体 normalize；任一非法字段整份拒绝、不落盘。
  4. **设置 UI 单抽屉**：顶部「更多」菜单进 `SettingsPanel`，13 个字段按「健康分/临期窗口/人员负载」分组，整数+区间+交叉约束（绿灯线≥黄灯线）内联校验，「保存口径」/「恢复默认」；配色走 `--pm-*`（`--dsw-*` 重映射）别名 token、零 hex，跟随 `body[data-ds-dark-theme]`。
- **理由**：默认等价是硬约束（避免「配置化」悄悄改变既有报表），故默认值必须可追溯到原硬编码并由 verify 锁基线；局部合并避免部分更新冲掉其它自定义；校验集中在 `normalizeProjectSettings` 一处，命令与 UI 共用 `SETTING_FIELDS` 元数据，防止两处口径漂移。
- **替代方案（已否决）**：① 为每个口径建独立 zod schema/独立存储键（过度建模、增加迁移面，否决）；② `put` 全量覆盖（会冲掉未列出的自定义，改局部合并，否决）；③ 杜撰「逾期宽限天数」新阈值（`stats.ts` 逾期本就是严格 `dueDate<today`、无数字阈值，不杜撰，否决）；④ 把过载阈值留在 client 硬编码（无法集中调、不可持久化，移入设置，否决）。
- **最终结果/状态**：已实现；`pnpm build`=0、全量 guard **71/71、失败 0、污染 0**；隔离 Chrome 3141 浅/深实测（改绿灯线 80→60 概览灯号黄→绿，派生随口径变化）；证据 `docs/verification/settings-20261016/`。

## ADL-050 ｜ 2026-10-15 ｜ v0.8 客观进度：清单完成度客观派生、验收独立、legacy 仅旁注、无信号不造伪精确（产品口径，实施以冻结矩阵为准）

- **背景**：现状任务 `progress 0~100` 为纯手填主观估计，汇报快照 averageProgress 对全部任务（含父节点、含手填）求平均，口径含混。所有者就「客观进度」第一版完成最终两规则裁决，覆盖此前讨论中的 done 优先、全勾封顶 90、legacy 进 rollup 等冲突方案。
- **决定（所有者最终确认，产品红线）**：
  1. **客观值只来自非空 checklist**：`value = checked/total`，全勾即 100%；任务无清单（含 status=done 无清单）→ `value=null`（界面「证据不足」），**禁止** done 或 legacy>0 把无清单叶子伪造成客观百分比。
  2. **验收状态独立**：全勾但 `status!=='done'` 只挂独立「待验收」标签，不封顶 90、不自动改 status、不自动补勾。
  3. **父/项目只汇总有非空 checklist 的后代叶子（等权均值）**；legacy 手填 progress（含 0）原值保留、用户仍可编辑，但仅旁注「原手填」，**不进客观派生、不进 rollup 均值**；无 covered 叶子 → 项目级客观值 null。
  4. **覆盖不足不称整体完成率**：`coveredLeaves < totalLeaves` 时界面只叫「已覆盖任务清单完成度」，全覆盖才可叫「整体完成率」。
  5. **快照口径**：新快照写 `calcVersion=1`，旧快照缺省按 0；异版本或一侧 null → 相邻对比 delta=null、不渲染徽标；历史快照不回填重算。
  6. **诚实边界**：本工具为单用户本地台账、无真实权限身份审计；清单勾选是用户自陈，不构成外部客观证明，不宣称分布式安全/多人审计能力。
- **理由**：主观手填进度不可信也不可比；客观派生必须只承认可核验的勾选记录，否则"客观"二字即造假。验收与清单解耦，保留人工闭环权。legacy 只旁注避免老项目"上线即失明"，又不让旧主观值污染新客观口径。
- **替代方案（已否决）**：① `status=done` 优先把无清单叶子直接记 100%（done 不证明任何清单信号，被否）；② 全勾封顶 90% 留验收间隙（90 是人造魔法数，违背 checked/total 纯比例，被否）；③ legacy progress 作弱信号进 rollup 均值（主观值污染客观汇总，被否）；④ 首载自动把手填值迁移成清单（越权改写历史、不可信，被否）。
- **最终结果/状态**：2026-10-15 所有者最终确认。验收矩阵 `docs/testing/objective-progress-acceptance.md` 已按两规则重冻结（基线 v0.7.4 HEAD `5fdb2d7`）；产品口径落 `docs/product/12-objective-progress.md` 并登记 product/README 索引。本批只落文档，未改 src/、未改测试矩阵、未改版本 docs、未提交。

## ADL-049 ｜ 2026-10-13 ｜ Vendored Skill 自动路由：由执行 Agent 按任务上下文自动选择，无需用户显式指定（长期硬规则，ADL-048 的操作细则）

- **背景**：ADL-048 已把首批 4 个 vendored skill 纳入治理（试点可用、未毕业）。原先设想由用户在任务里点名用哪个 skill；项目所有者更新长期治理：**vendored skill 应由执行 Agent 根据当前任务自动判断是否加载、加载哪个，不再要求用户显式指定**。本 ADL 据此给出自动路由的映射、边界与优先级。
- **决定（按结构化任务信号自动路由，非用户口令；实现为纯函数 `routeExternalSkill`）**：
  1. **缺关键阻塞信息 `needsBlockingUserInput`（最高优先）**：先走内建 `interaction` 直接向用户追问解锁，`route='none'`——**全拦，不加载任何 vendored skill**（尤其不为此套 `grill-me`，也不进入交付自查/`code-review`）。
  2. **vendor 安全门 `vendorIntegrityVerified` 必须为 `true`（返回任何 skill 前的硬前置）**：manifest schema / 锁定 commit / license / 精确 entry 白名单 / 逐文件 sha256 静态校验未过，一律 `route='none'`。本纯函数不自己校指纹，只消费执行 Agent 已完成的静态校验结果。
  3. **根因未明 `isRootCauseUnknown`**：只路由 `diagnosing-bugs`（现象→假设→验证→根因）；**抑制 `grill-me`/`tdd`，且不追加 `code-review`**（根因未明本批不可交付/不可自评提交）；诊断中不静默改代码，修复仍走正常开发 + 独立测试门（ADL-045）。
  4. **实质歧义 `hasMaterialAmbiguity`（非阻塞）且非 trivial**：路由 `grill-me`，先产出待拍板清单再动手；不替所有者拍板、不把追问输出当已定方案实施。
  5. **新功能 `isNewFeature` 或可测修复 `isTestableFix` 且非 trivial**：路由 `tdd`，组织红→绿→重构；其自测绿 ≠ 独立测试专家 PASS。
  6. **交付边界 `isDeliveryBoundary`**：**追加** `code-review`（排在最后）；**即使 `isTrivial` 也保留**（交付门不因简单免自查）；根因未明分支已在第 3 条提前返回，不会叠 review。
  7. **简单 `isTrivial`**：抑制 `grill-me`/`tdd`（无澄清/红绿增益），但不影响第 6 条交付 `code-review`；无任何命中时 `route='none'`（避免为用而用）。
  - **输出契约**：`entrySkillIds` 严格属于白名单（`grill-me`/`tdd`/`code-review`/`diagnosing-bugs`）、有序去重冻结；`grilling`（grill-me 的 exposed:false 纯文档依赖）永不作为 entry 返回；`interaction` 是 Agent 内建动作、不是 vendored skill。
- **边界与优先级（自动路由不是“想装就装”）**：
  - **高位覆盖低位**：项目规则（`AGENTS.md` §6/6A + `docs/external-skills.md` 政策 8 条红线）> `grill-me` 的追问/交互澄清 > 独立测试门（ADL-045/047）> 各 vendored skill 自带步骤。任一更高位规则与 skill 步骤冲突，立即跳过该步骤并在试点报告记录。
  - **自动加载≠放行**：自动路由只是“决定用哪个只读参考”，不豁免 8 条红线、不替代独立测试门；不可逆动作（删除/覆盖/推送/全局配置）仍须人工确认。
  - **加载前先验证**：自动加载任一 skill 前，须先确认 `node packages/dsh-pm-tool/scripts/verify-external-skills.mjs` 静态校验为 PASS，并按 manifest 比对目标文件 sha256 指纹；指纹不一致即停用报障。
  - **无需用户口令**：“自动”指 Agent 无需用户显式指定 skill、也无需逐次授权码即可按上述映射只读加载 vendored `SKILL.md`；但这**不**等于允许运行 installer、写 home/全局、联网抓新版或越权执行。
- **状态边界（重要）**：自动路由规则生效 **不改变毕业状态**——当前仍是“**试点可用，未毕业**”。`code-review` 试点已 PASS；`grill-me`/`tdd`/`diagnosing-bugs` 尚无试点报告（NOT_RUN），Agent 自动加载它们仍属试点期行为，**每次使用仍须填 `docs/templates/external-skill-pilot-report.md` 并由独立测试专家审证**，不得因“已自动路由”就视为该 skill 已毕业或已通过。
- **理由**：让 skill 真正按上下文被复用、免去用户每次点名的成本；同时用“映射 + 优先级 + 加载前验证 + 试点留痕”把自动路由关在治理框架内，避免 Agent 借“自动”之名越权或自判通过。
- **替代方案（已否决）**：① 每次由用户显式指定 skill（成本高、违背 skill 按上下文加载的本意）；② Agent 任意自动加载且不留痕/不校指纹（越权与漂移风险，被否）；③ 自动路由即视为全部 skill 毕业（掩盖其余 3 个尚无试点报告的事实，被否）。
- **最终结果/状态**：2026-10-13 项目所有者批准，作为 ADL-048 的长期操作细则生效。**实现已落地并经独立复核 APPROVE**：纯函数 `packages/dsh-pm-tool/src/core/external-skill-router.ts` + 校验脚本 `scripts/verify-external-skill-router.mjs`，按上述严格语义（经一轮 REQUEST CHANGES 修订：trivial 抑制 grill/tdd 但 delivery 仍可 review、rootCauseUnknown 仅 diagnose 不叠 review、blocking 全拦、`vendorIntegrityVerified` 为硬前置）；**校验器 41 组断言全绿（覆盖 K1–K6、K3 安全门 false 拦截/true 放行、taskKind 留痕、冻结去重、确定性），K 域独立专家 = PASS**。**自动路由 ≠ 毕业**：仍「试点可用，未毕业」，其余 3 entry（grill-me/tdd/diagnosing-bugs）试点待做。落地物政策正文（`docs/external-skills.md`，由另一 Agent 维护）、vendor、验收矩阵、路由代码正文本轮不改；本批文档接线暂不提交。

## ADL-048 ｜ 2026-10-13 ｜ 选择性 vendoring 外部 Agent Skills（首批 mattpocock）：锁上游 commit、仅 4 公开 entry + 声明依赖、项目规则优先、不跑 installer、安全静态校验 + 独立试点门（长期硬规则）

- **背景**：为提升开发/复盘效率，决定以**只读 vendoring** 方式引入外部社区 Agent Skill（首批 `mattpocock/skills` 的 4 个纯文档 playbook）。第三方指令可能越权写全局、联网、自动安装或替代独立测试门，故需为其立长期治理框架。外部 skills 落地物（`vendor/`、政策、验收矩阵、静态校验器）已由实施方落盘但**尚未经独立测试专家验收**；本 ADL 固化其治理口径并完成长期规范接线，不改动这些落地物正文。
- **决定（选择性 vendoring，逐条硬约束）**：
  1. **锁定上游 commit**：每个 vendor 的权威注册表是 `vendor/agent-skills/<vendor>/manifest.json`，以其 `source.commit`（首批 `mattpocock/skills` = `49dd158d1076134a641b33efb035946536778336`）锁定版本；试点期**冻结升级**，所有平台跑同一锁定版本，禁止“悄悄换成最新”。
  2. **只放行 4 个公开 entry + 显式声明依赖**：仅 `entrySkillIds` 的 `grill-me / tdd / code-review / diagnosing-bugs` 可被直接触发；`grilling` 是 `grill-me` 的 `exposed:false / pureDocumentation:true` 纯文档 runtime 依赖，**不是公开入口、不可被单独加载**。清单外文件即越界，由静态校验器逐文件白名单比对。
  3. **项目规则优先**：vendor skill 的 `SKILL.md` 与 `AGENTS.md` §6/6A、`docs/collaboration.md`、`docs/external-skills.md` 冲突时**一律以项目规则为准**，立即停止该 skill、跳过冲突步骤并向所有者报备，不得为“跑完 skill”放宽红线。
  4. **不运行 installer**：vendor 自带的 setup/installer/postinstall/首次向导**一律不自动执行**（manifest `policy.noInstallerRun=true`）；上游 `/setup-matt-pocock-skills`、`scripts/hitl-loop.template.sh` 等被有意排除、**不得补写或运行**，需要时改走项目自有 onboarding。
  5. **安全静态校验门 + 独立试点门**：交付前必须跑只读、离线、确定性的 `packages/dsh-pm-tool/scripts/verify-external-skills.mjs`（manifest schema / commit 精确 40-hex / license=MIT / 恰好 4 entry / 白名单逐文件 sha256 / 禁脚本·二进制·shebang / 危险指令 F0/F1 分类）；但**静态校验通过 ≠ PASS**——每个 skill 先入试点（逐次填 `docs/templates/external-skill-pilot-report.md` 并归档 `docs/verification/external-skills/`），由**独立测试专家**按 `docs/testing/external-skills-acceptance.md` 逐格给结论（ADL-045/047）；**未验收前一律标“实施中/待专家”，不称 PASS**。
- **升级（换 commit / 加 skill）双审，不可单人完成**：① 导入/技术审（拉新版、更新 manifest、重算 `files[].sha256`、核对 license、产出 diff）；② 安全/越权审（非导入方，对照 8 条红线审新版 `SKILL.md` 是否新增写全局/联网/自动安装/提权）。两审均通过并在试点报告留痕后方可更新 manifest；任一审驳回即维持旧版本。
- **回滚**：升级后若出现越权、行为不符或破坏既有验证，**立即把 manifest 的 `source.commit` 指回上一个已验证版本**（manifest 是唯一开关，回滚不改业务代码、不动 vendored 正文），在试点报告记录触发原因，并重跑受影响的 `scripts/verify-*.mjs` 与文档格式 verifier，确认恢复到可演示状态。
- **理由**：在借外部 playbook 提效与“仓库即唯一事实来源 / 上游只读 / 独立测试门”之间划线——vendored 内容只是只读参考、版本可锁、指纹可校、越权可回滚，且任何放行结论独立于开发方。
- **替代方案（已否决）**：① 不引入外部 skill（效率损失）；② 运行时直接联网加载上游最新版（无锁定、不可回滚、可能热替换第三方代码，被否）；③ 把 skill 复制到项目别处按需改写（产生漂移副本、绕过 manifest 指纹，被否）；④ 开发方跑通即自封 PASS（违反 ADL-045 独立性，被否）。
- **最终结果/状态**：2026-10-13 经项目所有者方向确立并接线为长期规则；外部 skills 落地物当前**实施中、待独立测试专家按验收矩阵逐格审证**（MANUAL_PENDING 项按 ADL-047 登记，既不算 PASS、也不阻塞自动化门）。细则见 `docs/external-skills.md`，验收门见 `docs/testing/external-skills-acceptance.md`，校验器见 `packages/dsh-pm-tool/scripts/verify-external-skills.mjs`。

## ADL-047 ｜ 2026-10-13 ｜ 自动化门与人工协作门分层：可自动化用例全绿即算通过；必须用户配合者转 MANUAL_PENDING（长期硬规则）

- **背景**：ADL-045 把 GUI/样式/UX 等标为 BLOCKED 后，其中一部分是「受系统能力/认证所限、客观上必须用户本人动手」才能验的项。若一律 BLOCKED 挂起，会把可自动化的交付也一起拖住。项目所有者正式更新质量原则。
- **决定（两层门）**：
  1. **自动化门**：所有当前**可自动化执行**的用例全部通过，即视为测试通过、可推进当前交付。
  2. **人工协作门（MANUAL_PENDING）**：因**系统能力或认证所限、必须用户本人配合动作**才能验的用例，登记为「人工待验证清单 MANUAL_PENDING」，等待用户反馈；**既不算 PASS，也不阻塞自动化验收/当前交付**。
  3. **FAIL 仍阻塞**：凡可自动化执行的用例一旦 **FAIL，仍然阻塞**，不因分层放行。
  4. **反馈即重开**：用户在 MANUAL_PENDING 项上反馈失败 → 重新打开对应缺陷与发布门。
  5. **高风险/不可逆仍须人工确认**：删除、覆盖、恢复等不可逆动作，不受分层影响，仍需人工确认。
- **边界（关键）**：**不是把所有 BLOCKED 自动豁免**。只有「确实必须用户本人配合」的项才转 MANUAL_PENDING；其余 BLOCKED（如本方可补的自动化缺口、样式/UX 可自动截图核对项）仍按 ADL-045 正常阻塞/补测。
- **理由**：把「能自动验的」和「只能人验的」解耦——自动化侧不停摆，人工项进入可追踪清单而非无限挂起。
- **替代方案（已否决）**：① 所有 BLOCKED 一律放行——会漏掉本方可补的缺陷；② 人工项也继续硬阻塞自动化交付——效率过低。
- **最终结果/状态**：2026-10-13 项目所有者批准生效，长期有效；MANUAL_PENDING 清单由测试专家维护，反馈失败即重开门。

## ADL-045 ｜ 2026-10-12 ｜ 独立测试门控：所有新增功能须经独立测试专家 PASS 才可继续（长期硬规则）

- **背景**：当前离线 `verify-*.mjs`（36 项）全绿，但真实浏览器全量 GUI 尚未验收；曾出现「离线全绿、client bundle 残留 zod require 只在真浏览器崩」的问题（见 `9b15baa`），说明纯函数/命令级测试不能代表页面可用。项目所有者正式批准进入「测试稳定阶段」，并立下长期硬规则。
- **决定（流程门控，按序执行，不可跳过）**：
  1. 需求/方案 → 测试专家先写**测试计划与用例** → 开发实现 → **独立测试**（功能 / 集成 / 网页实测 / 页面样式 / 用户体验五类）→ 缺陷修复 → **复验 + 受影响范围回归** → 测试专家给出 **PASS** → 才允许开始下一功能或进入发布候选。
  2. **判定语义**：`FAIL / BLOCKED / NOT_RUN` 一律**不等于通过**，不得据此推进。
  3. **阻塞期间**只允许做：缺陷修复、补充测试、文档；**不得开新功能、不得堆新需求**。
  4. **独立性**：测试专家不得自改产品代码后再由自己验收；开发与测试验收必须分离。
  5. **结论可追溯**：专家结论（PASS/FAIL/BLOCKED）必须绑定**被测提交哈希 + 证据**；任何新变更使受影响的历史测试结果**过期作废**，须重测后方可再引用。
  6. **严重度只排优先级**：不因为是「轻微」问题就默认豁免或带病发布；是否豁免/带病发布须由项目所有者**后续明确特批**，不得预设。
  7. **GUI 实测是硬门槛**：完整 GUI 实测（真实浏览器人工/自动化）才算数；**不得以「HTTP 200」「纯函数/离线 verify 通过」替代网页实测**。测试专家受能力限制无法覆盖的项，须**诚实标记为 BLOCKED 并写明原因**，不得伪装通过。
  8. **测试执行与判定分离（方案 A）**：具备 GUI 执行能力的主执行端**仅按专家既定用例采集原始证据**（录屏/截图/日志/页面状态），**无权判定 PASS**；PASS/FAIL/BLOCKED 只能由测试专家审证后给出。**开发不得既执行又自验收**。证据须与被测提交哈希**一致、可复核**；执行端**不得自行增改用例/步骤**，也**不得把口述、口头汇报当作证据**。GUI 执行被阻塞期间，该类门**仍记 BLOCKED**，不因「有人在操作」而转绿。
- **理由**：把「测试通过」从模糊口号变成可追溯、可阻断的门；离线全绿≠面板可用；独立第三方验收避免「开发自测自通过」。
- **替代方案（已否决）**：① 开发自测自签 PASS——既开发又验收，独立性不足；② 轻微问题默认豁免带病发版——会累积技术债且无特批留痕；③ 用 HTTP 200/纯函数测试替代 GUI——漏掉 bundle 运行时与样式/体验缺陷。
- **责任划分**：测试产物与用例归 `docs/testing/`（测试专家所有，其他角色不触碰该目录）；本 ADL 为流程权威，细则见 `docs/collaboration.md` 第九节与 `AGENTS.md` 测试门控节。
- **最终结果/状态**：2026-10-12 项目所有者批准生效，长期有效；后续如需豁免必须由所有者单独明确提出。

## ADL-042 ｜ 2026-10-11 ｜ 第二档体验增强取舍：CSV+XLSX 纯 JS 离线导入；可编辑预览/批量已补做

- **已实现（本轮补齐，原为初版裁剪项）**：
  - **T2-A 可编辑 WBS 预览**：`task wbs <pid> <goal> --raw` 返回原始 Markdown 清单，Web 渲染为可编辑 textarea；`task importmd <pid> <jsonMd> [confirm]` 按**编辑后**文本落盘（复用 `importTasksFromMarkdown`，不再调模型）。
  - **T2-B 列表效率**：`core.batchUpdateTasks / planBatchDelete / batchDeleteCascade`；`task batch update|delete <id,id,...> [confirm]`；Web 任务行复选框多选 + 批量工具条（标为完成/批量删除，批量删除用级联显式二次确认）+ 排序下拉（截止/优先级/进度）。
  - **T2-C XLSX**：命令侧/node core 用 SheetJS `xlsx@0.18.5`（Apache-2.0）离线解析 .xlsx 首表，**动态 import 不进 client bundle**；表头约定同 CSV。
  - **T2-D 导出**：导出 JSON 用 `web snapshot` 经浏览器 Blob + `a[download]` 直接下载；导出 Markdown 运行命令并弹窗路径（双分支）。
- **真正的裁剪（保留，带理由）**：
  - **R14 narrate 三段文本可编辑后写入 / R15 summarize 结构化编辑**：本期保持只读预览，未新增「按给定叙述文本落盘」入口；理由：WBS 编辑是所有者点名重点，narrate/summarize 编辑的边际价值低于其新增落盘入口成本，待有需要再补。
  - **任务多选的「批量改负责人」高级表单**：v1 只提供「批量标为完成」与「批量删除」；批量改负责人/进度的 Web 表单暂不做（core `batch update` 已支持任意 JSON 字段，可命令行用）。
  - **快捷键**：低价值，不做。
- **理由**：离线优先、零侵入 client bundle 体积、误操作安全（批量删除复用 A2 级联语义）。
- **最终结果**：verify-importmd / verify-batch / verify-xlsx 新增；全 23 项 verify + build + frozen-lockfile 退出 0。

## ADL-043 ｜ 2026-10-11 ｜ CSV + XLSX 纯 JS 离线导入（supersede ADL-030 的「不做 Excel」）

- **决定**：以纯 JS 离线实现 CSV（自解析）+ XLSX（SheetJS `xlsx@0.18.5`，Apache-2.0）任务导入；xlsx 仅在命令侧/node core 用**动态 import**，不打进 client bundle。表头约定「层级/标题/负责人/优先级/开始/截止/进度」，dry-run 预览→confirm 复用 `addTask` 父子树。
- **理由**：替代原被裁的 LibreOffice 方案；离线可用；动态 import 避免网页包体积膨胀；许可证 Apache-2.0 兼容。
- **最终结果**：ADL-030「不做 Excel」被本决策取代；verify-csv / verify-xlsx 通过。

- **决策**：备份/恢复只覆盖 pmtool 七类实体（不含宿主会话、checks 自检表、任何密钥）；恢复为两步 `confirm`，且恢复前若当前库有数据则**自动先存一份时间戳安全快照**；多设备同步只给指引（iCloud/坚果云），不擅自改存储路径，强调单写者（同步前关 dsh、不同时两端写）。
- **理由**：备份的价值是「可回退」，自动安全快照把误恢复风险降到最低；含密钥/宿主数据会带来安全与隐私风险；pmtool 是单写者应用，跨端并发写必然冲突。
- **替代方案**：整库深拷贝（含宿主数据/密钥，否）；恢复前不做安全快照（危险，否）；内置后台自动云同步（超出离线优先、违反不做常驻原则，否）。
- **最终结果**：`core/backup.ts` 七实体 + `commands/backup.ts` + Web 备份按钮；`verify-backup.mjs` 覆盖七实体/往返/缺 confirm 不落盘/安全快照/不含 checks。

## ADL-040 ｜ 2026-10-11 ｜ R17 会议行动项「一键转任务」采用幂等设计（重复转不重复建）

- **决策**：`/pm meeting action promote <mtg> <ai> [confirm]` 复用既有 `addTask` 编号链路在会议所属项目下建任务（标题=行动项标题、负责人=owner、截止=dueDate、无父任务），再把新任务 id 回写 `action.taskId`；**已有 taskId 时直接返回不重复创建**（幂等）。
- **理由**：行动项与任务是多对一映射的预期，重复 promote 不应产生脏任务；复用 addTask 保证编号/校验/写队列一致。
- **替代方案**：每次 promote 都新建（会产生重复任务，否）；要求人工手填任务（降低价值，否）。
- **最终结果**：`core/meetings.promoteActionToTask` + Web 转任务按钮（已转显示「已转 t-xxxx」并禁用）；`verify-promote.mjs` 覆盖 dry-run/回写/幂等/重启读回。

## ADL-039 ｜ 2026-10-11 ｜ R16 临期/逾期提醒采用「打开面板即派生」，不做后台常驻/调度

- **决策**：提醒是纯离线派生数据（逾期=未完成任务 dueDate<今天 / 未达成里程碑 targetDate<今天；临期=落在未来 N 天内，默认 7 天），由 `core/reminders.computeReminders` 基于当前数据现算，命令 `/pm due [天数] [项目ID?]` 与 Web 提醒条都在读时计算，不新增表、不做定时器/常驻进程。
- **理由**：离线优先、无后台常驻是项目基调；提醒只在用户打开面板/命令时才需要，派生即可，避免调度带来的权限与复杂度。
- **替代方案**：后台 daemon 轮询并推送（需常驻、违反基调，否）；持久化提醒表（会与实时数据漂移，否）。
- **最终结果**：`core/reminders.ts` + `commands/due.ts` + Web `ReminderStrip`；`verify-reminders.mjs` 覆盖边界/完成排除/项目过滤/排序/读回。

## ADL-038 ｜ 2026-10-11 ｜ 首页/欢迎页无法用 `/pm` 命令：根因属宿主 composer 行为，插件侧不强行修补、以 Web 面板 + 用法提示兜底

- **决策**：经上游只读核查，`/pm` 的注册结构与内置命令（`packages/goal/command-goal`）完全一致（`ctx.commands.register({ definitionId, name:'pm', input:{hint, attachments:false}, handler })`）；`CommandDescriptor`（`packages/interaction/commands/lib/types/types.d.ts`）只有 `name/description/input`，**没有任何能控制「回车放行」或「发送后主区自动跳转新会话」的插件侧字段**。因此首页问题归因为宿主 composer：输入「/」触发斜杠命令补全弹窗并截获 Enter，需从弹窗选择或改点蓝色发送按钮；发送后会新建会话但主区不自动跳转（与 KB-036 观察一致）。插件侧**不**改宿主行为，改为：（1）用法提示——在 README/面板说明斜杠命令点发送按钮、发送后到侧栏点最新会话查看；（2）以常驻可见的「项目管理」Web 面板作为主要操作入口，绕开首页 composer 的不确定性。
- **理由**：强行伪造可放行回车或自动跳转会触碰宿主内部、且插件无对应扩展点，风险高收益低；Web 面板本就是为非会话场景设计的稳定入口。
- **替代方案**：尝试多个子命令分别注册为独立斜杠命令（如 `/pm-task-wbs`）以求补全可发现——放弃，因为会让命令面爆炸、且仍受同一 Enter 拦截/会话跳转影响。
- **最终结果/状态**：根因已定位并记录（本 ADL + ISS-026 + KB-037）；命令注册本身正确，无需改动；主要入口切换到 Web 面板。残留宿主行为如实标注，不假装修好。

## ADL-037 ｜ 2026-10-11 ｜ 任务级联删除采用「显式 cascade confirm」的两步防误删设计，而非静默级联

- **决策**：`/pm task delete <id>` 无 confirm 时先 **dry-run** 预览（有子任务则列出将被级联删除的整棵子树数量与清单，否则普通单删预览）；`confirm` 但缺 `cascade` 且有子任务时**仍拒绝**并引导；只有 `<id> cascade confirm` 才真正删除该任务及其全部后代，并回报删除数量、强调旁支不受影响。删除前保留既有跨表保护：整棵子树任一节点被会议行动项引用即抛 `TaskReferencedByMeetingError` 阻止。
- **理由**：删除是高危操作，免费/AI 生成的 WBS 常带多层子任务，误删一整棵代价高。两步（先预览、再显式 cascade confirm）与既有「confirm 才落盘」的安全哲学一致，且默认行为不变（老的无子任务单删命令继续可用）。
- **替代方案**：（a）`confirm` 直接级联——拒绝，易误删；（b）软删除/回收站——本期不做，增加存储复杂度。
- **最终结果/状态**：已实现（core `collectTaskSubtree`/`deleteTaskCascade` + 命令改写 + verify-cascade），dry-run 不落盘 / 缺 cascade 拒绝 / cascade 删整棵留旁支 / 重启读回全部验证通过。

## ADL-036 ｜ 2026-10-11 ｜ 生成型功能（智能 WBS/会议纪要/进度汇报叙述）正式立项：LLM 只做文本生成、AI 结果一律草稿、确定性落盘在我方代码

- **决策**：正式立项三个生成型功能——R13 智能 WBS 任务拆解、R14 会议纪要归纳、R15 进度汇报 AI 叙述。统一约束：① **LLM 只做一次性文本生成、不挂 function calling**（免费池随机模型工具调用不保证，KB-034）；② **确定性数据采集/校验/落盘全在我方代码**——智能 WBS 复用 `task-import` 的 dry-run/confirm、纪要映射既有 meeting schema、汇报叙述叠加在 `collectProjectReport` 的确定性数字之上；③ **AI 输出一律是草稿，必须用户 confirm 才入库**，绝不自动改台账；④ 无 key / 模型失败按 `error.code`（RATE_LIMIT/QUOTA/INVALID_CREDENTIAL 等）优雅降级到手工/确定性路径，核心台账始终离线可用；⑤ 每次生成只发一次模型请求、草稿缓存以省免费额度（约 50 次/天）。
- **理由**：通道已打通并在 dsh 应用内实测成功（ADL-035、KB-035）；但免费随机模型能力参差，把「创造性文本」与「确定性台账」解耦——模型只负责把人写的目标/速记/数字组织成可读草稿，入库与校验由我方既有的 Zod/task-import 链路保证，避免模型幻觉污染离线台账。斜杠命令无交互会话上下文，故显式指定 provider/model（`openrouter-free`/`openrouter/free`）。
- **推荐开发顺序**：智能 WBS（最复用现有 import 链路、风险最低）→ 进度汇报叙述（最安全，失败退化为确定性快照）→ 会议纪要归纳（JSON 围栏解析最复杂，放最后）。v1 先做斜杠命令，Web 按钮第二里程碑。
- **替代方案**：① 让模型直接 function-calling 写库——免费随机模型不稳定，会导致落盘不可控，否决；② 一次性把三功能 Web/命令全做——范围过大、风险高，否决，按里程碑逐个落地。
- **最终结果**：设计评审稿见 `docs/generative-features-plan.md`；实现按里程碑推进，每个功能一个 `[doubao-work]` 提交。

## ADL-035 ｜ 2026-10-11 ｜ 采用 OpenRouter 免费自动路由（openrouter/free）作为零成本「尽力而为」LLM 通道；核心保持离线；其他官方厂商以预留模板保留

- **决策**：给 dsh 配置一条**零成本的第三方模型通道**，但定位严格限定为「尽力而为的文本生成」：① 通过 `@deepseek-ai/dsh-llm-pi-ai` 的 `providers` 字典，在本机 `pm` profile（`~/.dsh/profiles/pm/cordis.patch.yml`，仓库外）新增路由 `openrouter-free`，指向 OpenRouter 免费自动路由模型 `openrouter/free`（Free Models Router，OpenAI 兼容 `https://openrouter.ai/api/v1`，`api=openai-completions`，`apiKeyEnv=OPENROUTER_API_KEY`）；② **核心台账（项目/任务/里程碑/风险/纪要/汇报/交付物）始终离线、不依赖该通道**，无 key 也能完整运行；③ DeepSeek 官方 / OpenAI / Anthropic / Gemini / Groq / 硅基流动 / 智谱 GLM / 阿里百炼 / 本地 Ollama 等官方端点**只以注释 YAML 模板形式预留**在 `docs/model-providers.md`，当前一律不启用；④ **不实现任何具体生成型业务功能**（智能 WBS/纪要/周报仍按 ADL-032 暂缓），本批只做「通道配置 + 可移植文档 + 加载验证」。
- **理由**：① 项目所有者要求「先按方案 B 配好零成本 OpenRouter 免费通道，同时预留其他官方模型接入位但暂不使用」；② OpenRouter 免费档**不能指定具体模型**，由平台在免费池自动分配（`openrouter/free`，实测 $0/$0、200k 上下文、免费档约 20 次/分、充值 <$10 时 50 次/天），因此只能当「尽力而为」通道，不能承诺稳定驱动 agent 工具调用；③ 用第三方 OpenAI 兼容通道必须走 `llm-pi-ai`，而**不是**改 `DEEPSEEK_BASE_URL`（后者是内置 DeepSeek 直连适配器专用），二者路由不冲突；④ 通道与业务解耦，既为将来生成型能力备好「不花钱也能先跑通」的试验位，又不让核心离线能力背任何外部依赖风险。
- **替代方案**：① 直接用付费官方 key（DeepSeek/OpenAI）作默认——违背「零成本先跑通 + 预留不启用」要求；② 只内置 OpenRouter、不留其他厂商模板——将来换厂商要重摸 schema，可移植性差；③ 顺带把智能 WBS/纪要做了——违背 ADL-032 与「通道先行、功能后立项」的边界。
- **最终结果**：`llm-pi-ai` 本就随 base bundle 装载（原本零路由休眠），无需额外安装；按 id 在 `cordis.patch.yml` 补上 `providers.openrouter-free`。实测：`--dump-config` 退出码 0、provider 出现且 storage-json root / dsh-pm-tool 完好；`pnpm run build` 退出码 0；**12 个** `verify-*.mjs` 全 0；无 Key 真实宿主启动（随机端口、`[pm-tool] 存储领域 pmtool 已打开`）+ 运行中下发的 `dsh-pm-tool/client.js` 合并 bundle HTTP 200（无 cookie 401）均通过。**key 尚未获得，真实对话待所有者填入 `OPENROUTER_API_KEY` 后按 `docs/model-providers.md` 第 4 节跑一次确认**（当前无 key 时直连返回 401 属预期）。配置细节、预留厂商模板、开通验证步骤全部沉淀在 `docs/model-providers.md`。

## ADL-034 ｜ 2026-10-11 ｜ 上游 dsh 新版本兼容策略：peer 锁 v0.2.1-alpha.2 + profile link 装载 + 升级冒烟流程

- **决策**：面向上游 `deepseek-harness` 未来新版本，确立三条硬约束：① `packages/dsh-pm-tool/package.json` 中 `@deepseek-ai/*` peer/devDependencies 一律锁定 `0.2.1-alpha.2`（cordis `~4.0.5-alpha.1`），不随手跟随上游升级；② 运行/开发一律用 **本地源码版上游**（`~/Projects/dsh-pm/deepseek-harness`）+ 专属 `pm` profile 以 `link:` 绝对路径装载本插件；③ 上游升级时按「只读拉新 → 重建 → 全量回归 → 隔离真实宿主冒烟」的固定流程验证，不在运行中混用版本。
- **理由**：本插件深度依赖 dsh 的**宿主内部契约**——client bundle 合并路由格式（KB-028）、`dsh.client.inject` 清单、`slots.inject('main'/'sidebar.panellist')`、`web snapshot` 协议、storage 三件套装配（KB-014）。这些都不是稳定公开 API，alpha 版本间随时可能变；贸然跟版本会把「本插件能否被装载」变成不可控变量。锁定 peer 版本可让开发/验收始终复现同一宿主行为。
- **升级冒烟流程（上游升新版时照做）**：
  1. 上游只读 `git pull`（不改上游一行）；`pnpm install && pnpm run build` 通过。
  2. 本插件 `pnpm install --frozen-lockfile && pnpm run build`；若 peer 版本不再兼容，按 dsh 官方 `allow-version`/版本豁免流程处理，或在本包 peerDependencies 同步上调并 lockfile 对齐。
  3. 跑**全部 12 个** `scripts/verify-*.mjs`（退出码全 0）+ `verify-web.mjs` 的 bundle/manifest 契约断言。
  4. 按 ISS-019 隔离 DSH_HOME 启动 `pnpm dsh --profile pm --no-open --port 0`，用 puppeteer-core + 系统 Chrome 做一次「进入面板→各 ViewTab→看板→搜索」冒烟（KB-032）。
- **已知潜在断点（升级时重点看）**：① clientBundle preset/外部化名单（tsdown.config 的 `noExternal`，KB-023）；② peer 版本不匹配触发的 `allow-version`；③ 合并路由格式变化导致 KB-028 探测 404；④ `web snapshot` 字段增减导致面板 snapshot 解析错位。
- **替代方案**：直接发布到 npm 并依赖最新上游——会丢失对内部契约的控制、无法离线复现；每版跟最新——回归成本与 breakage 风险不可接受。
- **最终结果**：peer 版本已锁定 `0.2.1-alpha.2`；本批已在 dsh v0.2.1-alpha.2 上完成真实 Chrome 全量目视（KB-032）；后续上游升级按上述流程走。

## ADL-033 ｜ 2026-10-11 ｜ 浏览器兼容范围明确为仅 Google Chrome（Safari/Firefox 暂不支持）

- **决策**：本项目 R5/R7–R12 的 Web 工作台**只承诺兼容 Google Chrome**（验收环境实测 Chrome 139.0.7258.155，macOS Apple Silicon）；Safari、Firefox、Edge 及其它内核本期**不做兼容承诺、不投入适配**。
- **理由**：① 项目所有者明确要求「目前只要在谷歌浏览器能兼容即可」；② dsh 宿主本身面向 Chromium 系（其构建/布局/无障碍基于现代 Chrome 行为），本插件又完全复用宿主 CSS 变量与布局，没有自管的跨浏览器样式层；③ 单人本地离线 PM 工作台，用户在自己的 Mac 上用 Chrome 打开即可，跨浏览器适配的成本（如 Safari flex/container-query 差异、Firefox 滚动与表单行为）对当前单用户场景收益极低。
- **替代方案**：全浏览器兼容——需要额外的 CSS reset、flex/grid 回退与三套手工验收矩阵，当前阶段不划算；如需支持其它浏览器，后续按「先 Edge(Chromium)、再 Firefox、最后 Safari」的优先级增量投入。
- **最终结果**：验收用例与本次自动目视均以 Chrome 为准；test-cases.md「未覆盖」栏保留 Safari/Firefox 为不支持项；自动化目视改用 puppeteer-core 驱动本机 Chrome（KB-032），不再要求所有者本机手动点。

## ADL-032 ｜ 2026-10-11 ｜ R11 里程碑到期提醒与生成型能力（智能 WBS/纪要/周报）本期继续暂缓
- **决策**：R11 里程碑到期提醒、智能 WBS、会议纪要总结、周报自动生成等需要定时器或模型推理的能力本期继续**暂缓**，不在 R12 批次实现，需求中保留为「暂缓」而非「已实现」。
- **理由**：① 离线优先定位（ADL-009）下，提醒依赖 dsh schedule/后台调度与常驻进程，与「单用户本地、可随时关闭、无 Key 也能用」的最小闭环相冲突；② 生成型能力需要可用的 DeepSeek API Key 与模型稳定性，当前验证/交付环境无 Key（每次启动 `unset DEEPSEEK_API_KEY`），无法在本批做真实验收；③ 现有 `/pm report generate` 固定快照（R9）已以确定性方式沉淀了周期性复盘数据，生成型周报可在其上叠加，不阻塞当前验收。
- **替代方案**：本期硬上 schedule 提醒 / 模型调用——会引入常驻进程、Key 依赖与非确定性输出，破坏离线验证闭环，成本高收益低。
- **最终结果**：需求/本日志如实标注为「暂缓」；待项目所有者明确提供可用 Key、并接受常驻/联网依赖后，再以独立增量实现并做真实验收。

## ADL-031 ｜ 2026-10-11 ｜ R12 多人实时协作裁剪：本期不做
- **决策**：R12 范围内的「多人实时协作/多端共享同一份数据」本期**不实现**。
- **理由**：与 ADL-009「单用户本地离线」根本定位冲突；storage-json + storage-domain 当前仅保证单宿主单进程写队列（见各写操作 `enqueueDomainWrite` 约定），多端并发写入需要锁/冲突合并/在线同步，属于另一套产品形态；离线优先且本机 JSON 落人类可读文件的目标用户是单人 PM 工作台。
- **替代方案**：引入在线后端/多人同步协议——超出范围、需要服务端与鉴权，与本仓独立插件、上游只读的约束不符。
- **最终结果**：需求中多人协作标注为「裁剪/暂缓」；如需协作，后续以导出 Markdown（R4 已有）做人工分发。

## ADL-030 ｜ 2026-10-11 ｜ R12 外部任务表导入裁剪为 Markdown 清单，不做 Excel 导入
- **决策**：R12「导入一份外部任务表」只实现 **Markdown 缩进勾选清单**（`- [ ]`/`- [x]`）离线导入；Excel/CSV 导入本期**不做**。
- **理由**：Excel 解析依赖 `skill-office`/LibreOffice 等重型依赖与文件类型探测，体积与环境耦合高，且非确定性；而 Markdown 清单纯文本、确定性、零依赖，已能满足「把一份外部任务表搬进 WBS」的验收，也便于人工编辑与版本管理。
- **替代方案**：本期接 skill-office/LibreOffice 解析 .xlsx——依赖重、验证环境难以离线复现，收益不抵成本。
- **最终结果**：交付 `/pm task import <projectId> <filePath> [confirm]`（dry-run 预览 + confirm 落盘）；Excel 导入在需求中标注为「暂缓」，后续按需再加。

## ADL-029 ｜ 2026-10-11 ｜ R12 检索/统计为只读派生视图；Web 看板与全局搜索基于 snapshot 在浏览器端派生
- **决策**：R12 的关键字检索与统计看板一律**只读、不新增表、不写盘、领域版本仍为 1**；Web「总览看板」与全局搜索不新增宿主路由，而是复用现有 `web snapshot`（已含全部七张表）在浏览器端做等价的派生聚合/过滤。
- **理由**：检索/统计本质是对既有实体的投影，新建索引表会引入同步一致性负担；Web 端已有完整 snapshot（R5–R10 各表），在浏览器端派生统计卡片与跨项目检索既能离线运行，又不增加宿主路由面，且配色可直接复用宿主 token，满足「无硬编码 hex」约束。导入则是唯一真正落盘的写操作，复用 `addTask`。
- **替代方案**：为检索/统计建独立索引表或新增宿主 Web 路由——复杂度高、易与源数据漂移，收益不明显。
- **最终结果**：交付 `/pm search`、`/pm stats` 离线只读命令、`/pm task import` 导入写操作，以及 Web 总览看板/全局搜索；全部经 verify-r12.mjs 与 verify-web.mjs 契约验证。

## ADL-028 ｜ 2026-10-10 ｜ R10 交付物台账：复用 dsh deliverables 概念、数据层在 pmtool 领域自研

- **决策**：R10 不直接挂载/依赖 dsh 原生 `@deepseek-ai/dsh-*deliverables`（tool-present / workspace-changes / ui-deliverables）运行时，而是在自研单领域 `pmtool` 新增 `deliverables` 表（per-record，id `dlv-NNNN`）实现项目维度交付物台账，配离线 `/pm deliverable` 命令与 Web「交付物」标签；仅复用其「交付声明 + 变更留痕」的产品概念。
- **理由**：dsh 原生 deliverables 绑定**智能体轮次**（agent run）与 git 快照，记录的是「模型跑完一轮声明了哪些产物、改了哪些文件」，其触发依赖会话/工具调用，不满足本项目 ADL-009 确立的**离线优先、无 API Key 可手工增删改查**底线，也没有「按项目归集、维护名称/版本/负责人/状态/位置并持续登记」的 PM 台账形态。R7–R9 已验证 pmtool 领域 + ctx.commands + Web 标签这套自研模式可离线、可演示、可持久化，R10 沿用一致性最好、成本最低。
- **数据模型要点**：字段 name/version/owner/status/location/description/dueDate + 内嵌 `history[]`；状态四态 planned→in_progress→submitted→accepted；仅 status/version 实际变化时追加只增留痕（可带 operator/changeNote）；有交付物的项目禁止删除；加表不升领域版本（KB-013）。
- **替代方案**：① 直接复用 dsh deliverables 包（否决：依赖 agent 轮次/模型，离线不可手工维护，且数据形态不匹配）；② 交付物不单独建表、仅作为任务/报告的附属字段（否决：无法独立维护版本与状态变更历史，也不满足「交付物清单台账」诉求）。
- **未来对接**：`location` 为自由文本，可指向 dsh present 产物路径或任意文件/URL；后续若需把智能体轮次产物自动登记进台账，可在工具层做映射写入本表，首版不做运行时绑定。
- **最终结果**：R10 已实现并通过构建、11 项 verify（含新增 verify-deliverables.mjs）与隔离真实宿主 bundle 断言；需求文档升至 v0.8。

## ADL-027 ｜ 2026-10-10 ｜ R9 经独立复核「原样接收」，并固化无本机 GUI 时的验收证据组合

- **决策**：doubao-work 对 trae 交付的未提交 R9 增量做独立复核，代码审查 + 冻结安装 + 构建 + 十项 verify + `git diff --check` + 隔离 DSH_HOME/数据/随机端口/无 Key 真实宿主启动与运行中下发 bundle 断言全部通过、未发现缺陷，因此**不修改任何业务代码、原样接收**并随档案一并提交推送。
- **理由**：独立复核的目的是确认可运行/可演示与档案真实性，而非为改而改；复核无缺陷时改动业务代码反而引入风险、也违背「保护并审查现有改动，不覆盖、不重做」的接手要求。
- **验收证据组合（doubao-work 角色无 Mac 本机 GUI 权限时）**：① 专项 verify 脚本在真实 Cordis Context + 真实 storage-json/storage-domain 后端下跑通命令全路径，并以全新子进程 `--reopen` 验证重启读回与落盘权限；② 真实 `pnpm dsh --profile pm` 宿主启动，确认插件存储领域打开、loopback 鉴权（带 token 200 / 无 token 401）、启动清单含 `dsh-pm-tool/client.js`；③ 抓取运行中服务实际下发的 client bundle 断言新功能界面串存在，证明跑的是新构建；④ 浅/深主题、786px 窄屏、控制台/网络等纯目视项以 `verify-web.mjs` 主题 token/无硬编码色/响应式契约 + 实现方真实浏览器记录 + 项目所有者本机手动确认为准，**不得伪造点击结论**。
- **替代方案**：为「显得完整」而声称做了浏览器点击（否决，属伪造）；无视 GUI 边界直接打回让 trae 重做（否决，复核已合格、造成无谓返工）。
- **最终结果**：R9 状态推进为「独立复核通过并推送」；KB-014/ISS-010 的边界再次实证并新增 KB-028（HTTP 探测插件资源的鉴权细节）。

## ADL-026 ｜ 2026-10-10 ｜ R9 采用自定义周期的固定快照进度汇报

- **决策**：进度汇报存入 `pmtool/reports` per-record 表；生成时选择自定义日期范围并固化项目聚合快照，后续只允许编辑标题、状态和人工摘要字段。
- **快照内容**：当前任务/里程碑汇总，周期内会议与里程碑，以及受阻/逾期任务、有风险或错过里程碑、高影响未关闭风险问题、逾期行动项。
- **导出规则**：默认 Markdown 只输出管理摘要、聚合指标、周期事件和异常项，不输出完整任务/风险/会议明细；已有文件继续使用 `confirm` 原子覆盖。
- **理由**：固定快照可保留历史汇报口径，避免业务数据更新后旧周报漂移；精简输出更符合管理汇报阅读场景。
- **边界**：现有任务没有状态变更历史，因此日期范围不用于推断“本周期完成任务”；首版不接 schedule、模型撰写或 PDF，只预留来源字段。
- **替代方案**：实时动态报告（无法追溯历史）；保存全量业务记录副本（冗余过大）；默认完整明细 Markdown（扫描成本高）。
- **最终结果**：需求升为 v0.7；十项自动回归与隔离 profile 真实浏览器固定快照、编辑、导出、主题、窄屏和重启读回均通过。

## ADL-025 ｜ 2026-10-10 ｜ R8 会议纪要内嵌稳定行动项并预留转任务

- **决策**：会议纪要存入 `pmtool/meetings` per-record 表；议题、决议和行动项内嵌于会议，行动项使用稳定 `ai-NNN` ID，并可关联同项目已有任务或问题。
- **未来兼容**：首版不自动创建任务；后续增加显式 `meeting action promote`，根据行动项创建 WBS 任务并回写 `taskId`，已有 `taskId` 时拒绝重复创建。
- **理由**：内嵌模型最符合一份纪要的阅读和编辑习惯，首版实现成本最低；稳定行动项 ID 和任务引用又能避免未来转任务时迁移数据或依赖数组下标。
- **替代方案**：行动项独立成表（首版 CRUD 和一致性成本高）；录入时直接创建任务（会议待办被强制混入 WBS，且失去转化前追溯状态）。
- **边界**：首版仅做手工结构化录入、关联、离线命令和 Web；`sourceType/sourceSessionId` 只预留来源形状，不读取会话、不调用模型。
- **最终结果**：项目所有者选择内嵌方案，并明确要求未来可演进为行动项转任务；详细字段和实施步骤已写入两份 R8 计划文档。

## ADL-024 ｜ 2026-10-10 ｜ R7 风险与问题共用台账及首批范围

- **决策**：风险与问题共用 `pmtool/risk_issues` per-record 表，以 `type=risk|issue` 区分；通用字段为标题、说明、负责人、截止日期、状态和影响，风险专有概率/应对措施，问题专有解决方案。
- **行为规则**：创建后不可修改所属项目和类型；状态统一为 `open/monitoring/closed`；删除须带 `confirm`；项目下仍有风险或问题时禁止删除项目。
- **理由**：两类记录共享负责人、截止日期、状态和影响等生命周期字段，统一表便于按项目扫描、筛选和在同一工作台处理，同时由 strict schema 保证类型专有字段不混用。
- **替代方案**：拆成 `risks`/`issues` 两表（重复逻辑与界面）；给所有专有字段都允许任意空值（约束弱）；本批同步升级 R4 导出格式（扩大已发布格式影响）。
- **边界**：R7 首批仅做离线结构化 CRUD、筛选、持久化和 Web；不做自动评分、提醒、任务关联或模型生成；暂不把风险问题加入 v0.1.0 的 Markdown/整库 JSON 导出格式。
- **最终结果**：需求升为 v0.5；领域版本仍为 1，仅增加新表；自动化八项回归和隔离 profile 真实浏览器 CRUD、筛选、主题、窄屏及重启读回均通过。

## ADL-023 ｜ 2026-10-10 ｜ 发布 MVP v0.1.0

- **决策**：将已完成并验收的 R1–R6 MVP 发布为 `v0.1.0`；Git tag 指向包含发布说明和最终交接状态的发布提交。
- **发布内容**：独立外挂插件、离线命令、JSON 存储、Markdown/JSON 导出和 dsh Web 工作台；数据格式继续使用 `pmtool` per-record version 1。
- **发布门槛**：项目所有者已确认 R5 手动验收；冻结锁文件安装、构建、七项验证、profile 配置和真实宿主启动全部通过。
- **边界**：不发布 npm 包，不修改上游，不包含业务数据或密钥；R7-R10、R11 和生成型功能不在本版本。
- **最终结果**：项目所有者授权创建并推送 tag `v0.1.0`；版本说明记录在 `docs/releases/v0.1.0.md`。

## ADL-001 ｜ 2026-10-10 ｜ 选定基础框架为 DeepSeek Harness（dsh）

- **决策**：以 DeepSeek 官方开源框架 DeepSeek Harness（dsh）作为二次开发底座。
- **理由**：官方组织 `deepseek-ai` 出品，MIT 协议可商用；Cordis「一切皆插件」架构与需求高度契合；已自带 plan/todo/goal/jobs/schedule 等可复用能力。
- **辨别过程**：官方仓库与官网 deepseek.com/harness 双向互链、npm scope 为 `@deepseek-ai`，三方交叉验证；排除了 deepseekharness.online / .dev / dshai.org 等非官方站点。
- **替代方案**：从零自研 Agent 框架（成本高、重复造轮子）；选用其他 Agent 框架（与既定要求不符）。
- **最终结果**：确认仓库 <https://github.com/deepseek-ai/deepseek-harness>，采纳。

## ADL-002 ｜ 2026-10-10 ｜ 本地工作区目录布局

- **决策**：工作区固定在 `~/Projects/dsh-pm/`，其下并列 `deepseek-harness/`（上游源码）与 `pm-tool/`（本产品仓库）。
- **理由**：路径长期稳定、与聊天会话目录解耦，便于长期维护与迁移；上游源码与自有成果物理分离。
- **替代方案**：放在聊天项目目录（路径深、不易长期维护）；直接放 `~/dsh-pm`（更短但归类弱）。经项目所有者确认选择 `~/Projects/dsh-pm`。
- **最终结果**：已创建目录并完成上游克隆。

## ADL-003 ｜ 2026-10-10 ｜ 采用「独立产品仓库 + 上游并列」，不 fork monorepo

- **决策**：本产品为独立 git 仓库，dsh 作为依赖/配置被挂载；上游源码仅只读克隆用于运行验证与查阅，不在其 `packages/` 内直接改。
- **理由**：保持上游干净、升级成本低、自有仓库小而清晰、最符合「clone 即可接续」的迁移目标；也符合 dsh 官方推荐的外挂插件扩展模式（`dsh plugin add` / Cordis 挂载）。
- **替代方案**：fork 整个 dsh monorepo 在内部开发（与上游强耦合、升级合并困难、仓库庞大）。
- **最终结果**：经确认采纳；阶段 3 以独立插件包形式落地。

## ADL-004 ｜ 2026-10-10 ｜ 使用 nvm 安装用户级 Node，corepack 提供 pnpm

- **决策**：通过 nvm 在 `~/.nvm` 安装 Node 22，使用 Node 自带 corepack 启用 pnpm；向 `~/.zshrc` 追加 nvm 初始化。
- **理由**：本机原本只有 Doubao 自带运行时 Node，系统终端无独立 Node/pnpm，不满足「可演示、可迁移」；nvm 装在用户目录、无需 sudo、可复现、可多版本切换。
- **替代方案**：直接用 Doubao 自带 Node（系统终端不可用、不可迁移）；先装 Homebrew 再装（更重）。
- **最终结果**：已装 Node v22.23.3、pnpm 11.28.5；重开终端自动生效。

## ADL-005 ｜ 2026-10-10 ｜ 锁定上游版本与包管理器版本

- **决策**：以克隆时点 master HEAD（**v0.2.1-alpha.2**）为开发基线；pnpm 以上游 `packageManager` 字段锁定的 **11.28.5** 为准。
- **理由**：dsh 处于开发者预览期、存在破坏性变更，必须记录基线以便复现；corepack 依据 `packageManager` 自动选择对应 pnpm。
- **替代方案**：不锁版本、始终追最新（易因破坏性变更导致不可复现）。
- **最终结果**：基线提交哈希记录于 `docs/handoff.md`；后续升级需在本日志新增决策。

## ADL-006 ｜ 2026-10-10 ｜ 远程仓库接入方式

- **决策**：第一阶段即接入 GitHub 远程 `git@github.com:iceAcmen/pm-tool.git`，使用本机生成的 ed25519 SSH 密钥认证；提交身份 Ice \<835687152@qq.com\> 仅配置在本仓库（不写全局）。
- **理由**：项目所有者选择尽早接入远程以满足备份与可迁移；SSH 免密、私钥仅留存本机，比 HTTPS+Token 更适合长期使用。
- **替代方案**：先纯本地 git、稍后再接远程；HTTPS + Personal Access Token。
- **最终结果**：已完成。公钥由项目所有者添加到 GitHub 账户 iceAcmen（公钥指纹 `SHA256:ajsc0fagRHsCMz1C0aEUUKYmny4EC9TeY6PwKTHY3pk`），`ssh -T git@github.com` 返回认证成功；main 首次推送成功并跟踪 origin/main（首次提交 `12bcad3`）。

## ADL-007 ｜ 2026-10-10 ｜ 需求阶段四项关键产品决策

- **决策**（经项目所有者交互确认，均采纳推荐项）：
  1. **模型接入＝离线优先的混合模式**：结构化增删改查离线可用，会议纪要/智能 WBS/周报等生成型功能按需配置 `DEEPSEEK_API_KEY`；
  2. **数据存储＝人类可读的 Markdown/JSON 文件**（可 git 版本管理、可迁移）；
  3. **交互形态＝先做 dsh Web 可视化界面**，斜杠命令作为离线入口；
  4. **首批范围＝最小闭环 MVP**：项目计划 → WBS 任务拆解 → 里程碑 → 保存/导出。
- **理由**：先端到端跑通最小闭环，风险最低、最快可演示；离线优先保证无 Key/无网络也能用，契合非技术使用者「当场可演示」诉求；文件存储契合可移植档案机制。
- **替代方案**：全面接入模型（依赖联网与额度、离线不可用）；用 dsh 私有 storage（迁移与可读性弱）；先做对话式（可视化弱）；七大模块一次做完（周期长风险高）。
- **最终结果**：写入 `docs/requirements.md` 第二节，作为 MVP 范围依据。默认单用户本地；导入/多项目/协作列 P2。

## ADL-008 ｜ 2026-10-10 ｜ MVP 技术架构：storage-domain + storage-json、命令/工具双入口、独立插件包 + 专属 profile

- **决策**：基于官方源码与 cookbook 可行性调研（见 `docs/feasibility-map.md`）确定技术路线：
  1. 业务实体（Project/Task/Milestone）建在 `@deepseek-ai/dsh-storage-domain`（schema 校验的类型化键值域）之上，后端用 `@deepseek-ai/dsh-storage-json`（可读 JSON 文件落盘，`root` 指向产品仓库数据目录），Markdown 概览/报告由 JSON 渲染导出；
  2. 采用「**用户命令（ctx.commands，离线）+ Web 表单**承载核心 CRUD，**模型工具（ctx.tools，在线）**留给 P1 生成能力」的双入口设计（官方 goal 包已示范）；
  3. Web 界面先走官方明确支持的设置卡片/插件详情区块/工具卡片路径，独立顶级页面接入方式待技术验证；
  4. 自研能力以独立仓库内的 dsh 插件包 + 专属 profile 外挂挂载，不改上游源码。
- **理由**：dsh 的 plan/todo/goal 均为会话内能力、非跨会话项目档案，需自建持久实体；storage-json 与「人类可读文件」决策天然契合；命令离线、工具在线满足 D1；外挂 profile 满足「上游只读、clone 可接续」。
- **替代方案**：直接复用 todo/goal 存项目数据（会话级、不持久、结构不符）；用 SQLite 后端（单用户 MVP 过重、可读性弱）；fork monorepo 改内部（升级困难，ADL-003 已否决）。
- **最终结果**：作为阶段 3 开发架构基线；两个待验证点（第三方 Web 界面形态、本地插件包装载链路）列入阶段 3 首批技术验证。

## ADL-009 ｜ 2026-10-10 ｜ 需求阶段三项补充决策

- **决策**（项目所有者确认）：
  1. **业务数据目录 `data/` 暂不纳入 git**：在 `.gitignore` 忽略，目录由存储后端首次写入时自动创建（`0o700`）；
  2. **里程碑到期提醒（R11）第一版不做**：降为 P2（暂缓），MVP 严格保持最小闭环；
  3. **生成型能力（智能 WBS 建议、会议纪要归纳、周报撰写）MVP 仅预留接口、不实现**：第二梯队配 `DEEPSEEK_API_KEY` 后再开发。
- **理由**：真实业务数据含个人项目内容、暂不适合入库；最小闭环优先、避免摊大阶段 3 范围；生成型能力依赖模型与 Key，与「离线优先」决策一致，后置以保证 MVP 无 Key 可演示。
- **替代方案**：数据目录入库便于共享示例（暂不需要）；一期就做提醒与生成功能（扩大首版范围、增加 Key 依赖）。
- **最终结果**：已落实到 `.gitignore` 与 `docs/requirements.md` v0.3（R11 暂缓、第九节补充决策、pm-tools 仅预留接口）。

## ADL-010 ｜ 2026-10-10 ｜ 第 0 步打通验证：link 外挂装载、存储根目录落点与确定性验证策略

- **决策**（第 0 步实测后确定）：
  1. **插件以 `link:` 绝对路径外挂到专属 profile `pm`**：`pnpm dsh plugin --profile pm add link:/Users/bytedance/Projects/dsh-pm/pm-tool/packages/dsh-pm-tool`；包内声明 `dsh.bundle.patch` 实现安装即自动激活，不改上游、不进 monorepo。
  2. **业务数据根目录固定为产品仓库的 `pm-tool/data`**：在 profile 用户补丁层 `~/.dsh/profiles/pm/cordis.patch.yml` 按 id `storage-json` 覆盖 `config.root`（storage-domain 默认 backend 已是 json，无需改）；该目录由仓库 `.gitignore` 忽略（ADL-009）。
  3. **纯 Host 命令插件用包内 `tsc` 独立构建即可**，不复刻 dsh 的 clientBundle（浏览器半侧留到做 Web 界面时再处理）。
  4. **回归验证以确定性脚本为准**：包内 `scripts/verify-storage.mjs`、`scripts/verify-command.mjs` 直接用真实 Cordis + 真实 storage-json 运行「已构建插件」的 apply 与命令处理器；Web 页面用于真人演示，不依赖其富文本自动化输入。
- **理由**：`link:` 开发期改完 rebuild+restart 即生效、最省事，且实测对本插件（服务靠 ctx 注入、cordis 仅 type-only）无 peer 身份问题；数据落在产品仓库目录便于查看/迁移/演示，又不污染 git；独立 tsc 降低第 0 步复杂度；确定性脚本可重复、可进 CI，规避页面自动化 flaky。
- **替代方案**：`file:` 或发布 npm 包（适合发布期，开发期反馈慢）；数据放 dsh 默认 `~/.dsh/storages`（脱离产品目录、不便演示与迁移）；复刻完整 clientBundle 构建（第 0 步无浏览器半侧、属过度工程）；只靠手点页面验证（不可重复）。
- **最终结果**：第 0 步三项验收全部通过（配置树可见、离线 `/pm ping` 返回中文、selftest 在 `pm-tool/data` 落可读 JSON 且目录 0700）；实测发现并修复 `put()` 漏 await 的真实 bug；详见 `docs/tech-plugin-scaffold.md` 附节与 ISS-005～ISS-009。剩余唯一【待验证】=第三方独立顶级 Web 页面，留待业务功能阶段。

## ADL-011 ｜ 2026-10-10 ｜ 业务实体落盘布局定稿：单领域 per-record 扁平分表，取消 index.json

- **决策**（项目所有者确认；由 trae 接手核查时提出、doubao-work 复核上游能力后定稿）：
  1. Project/Task/Milestone 全部建在**单一存储领域 `pmtool`** 的三张表上：`projects` / `tasks` / `milestones`，采用 storage-json 的 **per-record** 布局，**一条记录一个可读 JSON 文件**：
     - `data/pmtool/projects/<projectId>.json`
     - `data/pmtool/tasks/<taskId>.json`（记录含 `projectId`/`parentId`/同级顺序/WBS 编号）
     - `data/pmtool/milestones/<milestoneId>.json`（记录含 `projectId`）
  2. **取消需求 v0.3 设想的手工 `index.json`**：storage-domain 的表已提供 `keys()` / `entries()` 迭代器（上游 `storage-domain/src/domain.ts` 核实），列表与「某项目下的任务/里程碑」靠遍历表 + 按 `projectId` 过滤得到，不双写索引。
  3. 项目 `README.md` 概览/周报等 Markdown 仅作为 **R4 渲染导出产物**，不写入存储域、不作数据源；数据一律以 JSON 为准。
  4. 记录键名遵循存储后端约束 `[a-zA-Z0-9_-]+`，采用短 id（如 `p-0001`/`t-0001`/`m-0001`）；第 0 步的 `checks` 表保留。
- **理由**：per-record 扁平布局是 storage-domain/storage-json 的原生形态（路径 `<root>/<unit>/<table>/<key>.json`），最省改动、天然得到人类可读文件与原子写/0700 权限；早期 v0.3 的「按项目聚合嵌套目录（`projects/<id>/tasks.json` 等）」要求键名含 `/` 或按项目动态开领域，与扁平键规则不兼容，强行实现需绕开 schema 校验手写文件，得不偿失。
- **替代方案**：① 按项目嵌套目录（与框架 per-record 模型冲突，被否）；② 每项目一个独立存储领域（领域需静态定义、动态开领域用法非常规，被否）；③ 仍维护一份 index.json（与表数据双写、易不一致，且表已可枚举，被否）；④ SQLite 后端（单用户 MVP 过重、可读性弱，ADL-008 已否）。
- **最终结果**：更新 `docs/requirements.md` 至 v0.4（§5.1 定稿）；新增 KB-011 记录表枚举能力；作为 trae 实现 R1–R3/R6 存储层的权威依据。

## ADL-012 ｜ 2026-10-10 ｜ 项目编辑/删除与输入校验规则（首批功能复核后确认）

- **决策**（项目所有者在豆包工作独立复核后拍板，平台 doubao-work 记录）：
  1. **删除二次确认采用关键字方式**：命令为 `/pm project delete <id> confirm`；不带 `confirm` 时只返回「将删除哪个项目及其内容」的中文提示，**不执行删除**。后续任务/里程碑等一切删除/覆盖类命令沿用同一关键字确认模式。
  2. **新增/更新项目校验日期先后**：`targetDate` 不得早于 `startDate`，否则中文报错、不写入。
  3. **同名项目默认阻止新增**：已存在同名项目时，`project add` 返回中文错误、不创建；确需创建同名项目时，在命令末尾追加 `confirm` 关键字才放行（与删除确认同一关键字约定）。
- **理由**：斜杠命令无状态、没有弹窗，二次确认必须用可在一行命令里表达的方式，关键字最简单且与离线纯文本交互一致；日期先后与同名拦截属于低成本、高收益的防呆，契合非技术使用者「防误操作」诉求。
- **替代方案**：删除/覆盖用一次性确认码（两步交互、更繁琐，被否）；同名仅弹警告但仍创建（无状态命令里"警告即成功"易被忽略，改为默认阻止更安全）；不校验日期逻辑（易产出自相矛盾数据，被否）。
- **最终结果**：作为 R1 收尾（update/delete）与后续任务/里程碑命令的业务规则，纳入 `docs/requirements.md` R1 验收标准与 §5.3；**「同名默认阻止 + confirm 放行」是对所有者"告警/阻止"的具体落地解释，已在复核汇报中单列，所有者可否决**。待 trae 编码，doubao-work 不写业务代码。

## ADL-013 ｜ 2026-10-10 ｜ R5 Web 界面排在离线能力之后，并约定降级形态

- **决策**（项目所有者确认）：阶段 3 顺序上**先完成 R2（WBS 任务）/R3（里程碑）/R4（导出）等离线能力，再集中做 R5 Web**；R5 先做官方明确背书的「设置卡片 / 插件详情区块」，再对「第三方新增独立顶级页面 / 外部包浏览器构建（clientBundle）」做 spike。**若 spike 证明外部包无法稳定新增独立顶级页面，则第一版演示形态接受为「设置卡片/插件详情区块 + 离线斜杠命令」**，不阻塞交付。
- **理由**：R5 是唯一未打通、且存在官方未文档化环节（KB-010 待验证）的高风险项；先把不依赖浏览器半侧、确定性脚本可验证的离线能力做厚，可显著降低返工与演示风险。
- **替代方案**：先攻 Web 顶级页面（风险集中、可能被外部包能力卡住，被否）；顶级页面不通就暂停交付（不必要，卡片/区块 + 命令已可演示，被否）。
- **最终结果**：更新 `docs/requirements.md` R5 行与本日志；R5 spike 结论出来后再据结果新增决策。

## ADL-014 ｜ 2026-10-10 ｜ 环境 Node 版本口径以 nvm 默认 v22.23.3 为准（澄清沙箱自带 node 遮蔽）

- **决策**：文档与交接中的标准 Node 版本**维持 nvm 安装、`nvm alias default 22` 指向的 v22.23.3**（用户终端与 TRAE 等本机环境实际使用版本）；不改为 v22.23.2。
- **理由 / 现象**：豆包工作复核时其命令行报告 `node -v` 为 v22.23.2，经核查那是 Doubao 沙箱自带运行时（`~/Library/Application Support/DoubaoWork/sandbox_runtime/.../bin/node`）在该沙箱 shell 的 PATH 中遮蔽了 nvm 的 node；本机 nvm 实际安装且默认的是 v22.23.3（`nvm ls`、`nvm alias default` 证实）。两个版本都满足 dsh 引擎要求 `^22.19.0 || >=24`，不影响构建与运行。
- **替代方案**：把文档统一改成 v22.23.2（会与用户/TRAE 真实终端不符，被否）。
- **最终结果**：保留全部 v22.23.3 表述；该"沙箱 node 遮蔽 nvm"现象沉淀为 KB-015，供后续在豆包沙箱内判断 Node 版本时参考。

## ADL-015 ｜ 2026-10-10 ｜ R1 收尾的同名比较、更新与删除落地语义

- **决策**（项目所有者确认文件级计划，平台 trae 记录）：
  1. 项目名称先 `trim`，再做**区分大小写的精确比较**；新增同名项目默认阻止，末尾 `confirm` 放行。
  2. `project update` 只有在实际修改名称且撞到其他项目时执行同名拦截，也支持末尾 `confirm` 放行；已获准重名的项目更新负责人等非名称字段不重复要求确认。
  3. 更新只接受业务字段 JSON 片段，保留 `id` / `createdAt`，自动刷新 `updatedAt`；日期关系按合并后的完整记录校验。
  4. 当前 `project delete <id> confirm` 只删除项目记录；任务和里程碑尚未实现，关联实体加入后再补项目删除约束。
  5. 数据版本仍为 1 且无迁移器，读盘 schema 保持旧结构兼容；新增业务日期约束在新增/更新写盘前执行，避免旧倒置日期记录阻断领域启动。
- **理由**：统一新增与实际改名的防误操作行为，同时避免已有合法重名数据无法继续维护；最终记录校验可正确处理只更新一个日期的场景。
- **替代方案**：名称忽略大小写比较（可能误伤有意区分的名称）；每次更新都重新检查当前名称（会锁死已确认的重名项目）；当前提前设计未实现关联表的级联删除（过度设计）。
- **最终结果**：R1 离线项目 CRUD 按上述规则实现并由确定性脚本覆盖；同名规则不再列为待确认。R1 Web 界面仍待 R5 阶段完成。

## ADL-016 ｜ 2026-10-10 ｜ R2 首批采用自动追加同级顺序与不可复用 WBS 编号

- **决策**：R2 首批只实现 tasks 表与 `/pm task add/list/get`；新任务的 `order` 取当前同级最大值加一，WBS code 由父 code + order 生成。任务 ID、关系校验、编号和写盘与项目删除共享同一领域业务队列。有任务的项目禁止删除。
- **理由**：先以最窄纵切验证三级树和持久化；最大值追加符合 requirements §5.3“移动/删除后手动重新编号”，不会因空洞自动改写既有引用。
- **替代方案**：本批同时实现编辑/删除/移动/重编号（范围过大）；复用已删除编号（会让历史引用歧义）。
- **最终结果**：任务编辑、删除、移动和重新编号留到 R2 下一批；里程碑关联在 R3 前仅允许 null。

## ADL-017 ｜ 2026-10-10 ｜ R2 任务移动、删除与显式重新编号语义

- **决策**：
  1. `task update` 仅修改业务字段，不能直接改项目、父任务、编号、顺序和系统时间；可用 `null` 清空可选起止日期。
  2. `task delete/move/renumber` 均须末尾 `confirm`；不带时只返回中文预览、不写盘。
  3. 有直接子任务时禁止删除父任务；移动只能在同项目内进行，禁止移动到自身或子孙下，`root` 代表根层级。
  4. 移动和删除只改变关系或删除目标，不自动改写 WBS 编号；`renumber <projectId> confirm` 才按当前父子关系和同级顺序压缩 `order` 并重建整棵树编号。
- **理由**：符合 requirements §5.3 的防误删和“显式重新编号”规则；把结构变更与引用编号变更分开，避免用户未确认时大范围改写。
- **替代方案**：删除父任务时级联删除（误删风险高）；移动后自动重排（引用不稳定）；允许直接 patch `parentId/code`（无法集中做循环与关系校验）。
- **最终结果**：R2 离线任务能力完成，确定性脚本覆盖三级树、更新、删除、移动、循环保护、重新编号和重启读回。

## ADL-018 ｜ 2026-10-10 ｜ R3 里程碑状态一致性、删除与任务关联规则

- **决策**：
  1. 里程碑状态由用户手动维护；`achieved` 必须同时有 `achievedDate`，其他状态的 `achievedDate` 必须为 `null`。
  2. 里程碑删除沿用 `confirm` 二次确认；有关联任务时禁止删除，须先把任务 `milestoneId` 更新为 `null` 或其他同项目里程碑。
  3. 任务只可关联同项目已存在里程碑；新增和更新都在领域业务队列内校验，跨项目或不存在引用拒绝写盘。
- **理由**：保证状态和日期不矛盾，防止删除产生悬空引用，并维持 Project—Task—Milestone 的项目边界。
- **替代方案**：自动根据日期切换状态（R11/P1 范围，首版不做）；删除时自动清空任务关联（隐式批量修改，风险较高）；允许跨项目关联（破坏项目聚合视图）。
- **最终结果**：R3 离线里程碑增查改删和任务关联闭环完成，专项及完整回归通过。

## ADL-019 ｜ 2026-10-10 ｜ R5 完成前的自动提交与推送临时授权

- **决策**：项目所有者授权从当前批次起至 R5 实现完成前，每批在构建、当前全部 verify 脚本和本批专项验证全部通过后，执行平台可自动提交并普通推送 `origin/main`，无需逐批询问。
- **边界**：任一验证失败不得提交或推送；禁止 force push 和改写历史；功能文件级计划仍须先报备确认。R5 实现完成后授权自动终止，执行平台通知所有者进行真实界面手动验证，并恢复逐次询问提交/推送。
- **理由**：减少阶段 3 连续开发中的重复确认，同时保留方案确认、完整回归和 R5 人工验收门槛。
- **最终结果**：同步到 AGENTS、collaboration 和 onboarding 快照，供所有平台执行。

## ADL-020 ｜ 2026-10-10 ｜ R4 Markdown 报告路径与覆盖语义

- **决策**：单项目报告命令为 `/pm export markdown <projectId> [目录] [confirm]`；默认写入产品仓库 `exports/<projectId>-report.md`，相对目录以产品仓库为基准，绝对路径与 `~/` 可指定。已有文件默认拒绝覆盖，末尾 `confirm` 才覆盖。
- **实现边界**：报告聚合项目、按真实关系展开的 WBS 和日期排序里程碑；Markdown 是 JSON 的只读导出视图，不进入 storage-domain。默认 `exports/` 纳入 `.gitignore`。
- **安全与可靠性**：目录以 0700 创建、文件为 0600；未确认覆盖使用临时文件 + 原子硬链接防并发误覆盖，确认覆盖使用同目录临时文件 + rename 原子替换。
- **替代方案**：报告写入业务存储域（形成第二数据源，被否）；默认静默覆盖（误操作风险，被否）；以 dsh 启动 cwd 解析相对路径（启动位置不稳定，被否）。
- **最终结果**：R4 单项目 Markdown 纵切完成；整库 JSON 打包留下一批。

## ADL-021 ｜ 2026-10-10 ｜ R4 整库 JSON 数据包格式

- **决策**：`/pm export json [目录] [confirm]` 输出 `pmtool-backup.json`，顶层包含 `format=pm-tool-backup`、`formatVersion=1`、`exportedAt` 和按 ID 排序的 projects/tasks/milestones；不包含 checks。
- **理由**：稳定格式便于后续导入与迁移；排除运行自检数据，保持业务包纯净。
- **最终结果**：复用 ADL-020 的路径、权限和原子覆盖规则，R4 离线导出完成。

## ADL-022 ｜ 2026-10-10 ｜ R5 外部 clientBundle 直接注册顶级项目管理面板

- **决策**：`dsh-pm-tool` 在同一插件包内声明 `dsh.client.platform=web` 与 `./client` 导出，用独立 `tsdown` 配置生成 dsh lazy-CJS 动态 bundle；客户端向 `main` 和 `sidebar.panellist` 插槽注册“项目管理”顶级面板及入口。
- **数据通路**：Web 端不复制业务规则，通过现有 `remote.commands.execute` 调用 `/pm` Host 命令；新增只读 `/pm web snapshot` 聚合 projects/tasks/milestones，所有写操作继续复用已经回归的命令处理器。
- **理由**：上游 `ui-schedule` 已验证相同插槽模式；实测 pm profile 的 `__DSH_BOOT__` roster 能发现外部 bundle，浏览器可在无 API Key 下完成项目、任务、里程碑操作。
- **替代方案**：仅做设置卡片/插件详情区块（顶级页面已可行，无需降级）；在浏览器复制 CRUD 逻辑（会形成两套校验，被否）；修改上游路由（违反上游只读红线）。
- **最终结果**：R5 代码和自动化/浏览器验证完成，待项目所有者手动验收。ADL-019 的临时自动提交推送授权在本批提交并推送后终止，后续恢复逐次确认。

## ADL-044 ｜ 2026-10-11 ｜ 双模型车道：PoC 免费公共网关 vs 生产官方 API；生产不得用免费车道

- **决定**：引入统一车道路由 `core/model-route.ts`，AI 功能（task wbs / report narrate / meeting summarize）按当前模式选路：
  - `poc`（默认）→ provider `our-free-model`（第三方插件 dsh-our-free-model v2.1.0，commit 7e3a1da），模型 `kilo-auto/free`（Kilo 免费自动路由；2026-10-11 用宿主 ctx.llm 实测免 Key 一次成功，~5.6s 返回正文。注：插件 catalog 里虽也有 `openrouter/free`，但那是与旧 pi-ai 通道同名的值；本插件 Kilo 侧稳定自动路由 id 为 `kilo-auto/free`，故默认用它）。**仅用于概念验证/界面原型/需求推演，不得用于核心代码合并、生产级编码、版本提交**（公共网关可能记录内容）。
  - `prod` → 按 Key 优先 DeepSeek 官方（provider `deepseek-official`，base 内置，env `DEEPSEEK_API_KEY`）其次 Kimi/Moonshot 官方（provider `kimi-official`，baseURL https://api.moonshot.cn/v1，env `KIMI_API_KEY`）。**所有者尚未给 Key**：provider 已配置但休眠，切到 prod 而无 Key 时返回中文友好提示，**绝不回退免费车道做生产活**。
- **持久化**：模式存 pmtool 领域 `checks` 表键 `aiModelMode`（复用既有表，不新增表），默认 poc。命令 `/pm model mode poc|prod`、`/pm model status`；Web AI 助手抽屉顶部加分段开关并显示 PoC 醒目警示。
- **运行时安装**：插件 clone 到 `~/Projects/dsh-pm/dsh-our-free-model`（仓库外），`dsh plugin --profile pm add <路径>`，不再往 cordis.patch.yml 加条目（避免 duplicate loader id）。llm-pi-ai 只追加 `kimi-official`；`deepseek-official` 已由 base 内置声明，重复声明会启动报错，故不重复加。
- **替代/裁剪**：未启用 EAC、局域网中继、出口代理、应用内自动更新/热替换（固定克隆版本，防止运行期第三方代码被远程热替换）。
- **最终结果**：verify-model-route 新增（poc/prod 路由、prod 无 Key 抛错不回退、模式持久化、非法模式）；dsh web 冒烟启动无 already-declared 错误；真实免费对话由独立浏览器验收。

## ADL（v0.4.1-integration）
- **副驾写操作必经后端 ask-apply**：前端草稿卡仅收集，确认后由后端重读 domain、校验归属与字段、检测 updatedAt 冲突，杜绝前端旧快照误写；并发同草稿用 in-flight Promise 去重（内存 60s，不新增表、重启即失效——可接受的最终一致性边界）。
- **写库一律复用领域 updateTask**：不 table.put 绕过，起止日期/子任务关系/里程碑校验继承既有 taskWriteSchema。
- **备份恢复先预检后破坏**：schema+关系预检失败直接抛错且不删任何实体；安全快照仅在预检通过后生成。
- **GUI 验收诚实降级**：本轮无 GUI 能力，以非GUI集成+离线 verify 替代；真实浏览器端到端留待独立验收，不称"全绿"。

## ADL-046 ｜ 2026-10-13 ｜ R3-UX-001：项目/里程碑必填改为受控中文内联错误，维持日期必填与 schema 不变

- **背景**：项目表单 name/startDate/targetDate 与里程碑 title/targetDate 虽有 schema 层必填与原生 `required`，但浏览器在 `onSubmit` 前用转瞬气泡拦截，用户看到「按钮像没反应」；标签无可视必填标识，也无 `aria-required/aria-invalid/aria-describedby`。
- **决定**：
  1. 维持 `startDate/targetDate` 必填语义，**不改 zod schema、不改其他实体**；requirements §4.1 把起止日期补标为「必填」。
  2. 前端抽出无 React/DOM 依赖的纯函数 `client/form-validation.ts`（缺值/真实日历日期/`targetDate<startDate`），文案与服务端 zod 一致。
  3. 表单加 `noValidate` 后**由前端统一校验**（不是漏校验）：必填标签加星号与 `aria-required`，错误在字段下方常驻中文提示并经 `aria-invalid`/`aria-describedby` 关联；提交失败聚焦首个错误字段，输入纠正即清错；提交按钮与 Enter 走同一 `onSubmit`。
  4. 服务端 `run` 错误（重名、删除保护等）仍走既有全局 Notice，前端不掩盖。
- **理由**：把「无声拦截」变成「可见、可定位、读屏可达」的反馈；纯函数可在 Node 做真实行为测试，ARIA 接线与焦点定位留真实浏览器 GUI 验收（ADL-045 第 7 条）。
- **替代方案（已否决）**：① 保留原生 `required` 气泡——转瞬即逝、定位差、读屏不友好；② 全表 `novalidate` 后不校验——等于放弃必填，被否；③ 前端另写一套与 zod 不一致的校验——会双轨漂移，被否。
- **最终结果**：新增 `scripts/verify-form-validation.mjs` 纯函数行为测试；样式仅用宿主 token、不写死 hex；待 GUI Agent 恢复后做真实浏览器视觉/焦点验收。

## ADL-053 ｜ 2026-10-17 ｜ #25 真 390px 窄窗：窄屏规则隔离在 ≤560px 媒体查询，宽内容容器内横滚，桌面几何零改动

- **背景**：GI-WEB-14 / PROD-07 遗留「真 390px 窄窗」长期 MANUAL_PENDING；此前仅在 768px/760px @container 与既有 ≥1100/900 断点做过粗降级，任务工具条、人员负载固定 6 列网格、会议行动项固定列、双栏卡片等在 390px 真实溢出/裁切。
- **决定**：
  1. 窄屏适配全部写进独立的 `@media (max-width:560px)` 块，**不改任何既有桌面选择器几何**；≥1024 桌面布局逐像素保持不变。
  2. 天然宽内容（任务表、甘特时间轴、数据表）**不在外壳压缩**，而是在各自内部滚动容器（`.pt-scroll`/`.pm-gantt-scroll`/`.pm-table-scroll`）横向滚动；页面/外壳不整体溢出，导航与主操作在 390 下可达。
  3. 固定多列网格（人员负载 240/1fr/64/110/110/20、会议行动项 1fr/130/110/92、风险矩阵）在窄屏改为可换行 flex/单列堆叠，而非继续挤压；配色只消费 `--dsw-*`/`--pm-*` 别名 token，零硬编码 hex，跟随 `body[data-ds-dark-theme]`。
  4. 纯 CSS/视图响应式，不改业务逻辑、零 schema、零新增外部依赖、不动 tsx DOM 契约/锚点 class。
- **理由**：窄窗不是另做一套布局，而是在不破坏桌面的前提下让固定宽骨架/网格在小视口自然回流；宽内容横滚比硬压到 390 更保真，也避免牺牲表格/甘特的信息密度。
- **替代方案（已否决）**：① 整体缩放/transform 适配——可读差、破坏触控与字距，否；② 所有表格/甘特都压进 390——信息密度崩塌，否；③ 用 JS 测量动态改宽——引入墙钟/状态、与纯 CSS 确定性相悖，否。
- **最终结果**：`pnpm build`=0；verify-isolation 71 脚本/70 通过（唯一 verify-export 硬编码 `/pm-tool/exports/` 路径在 worktree 下不匹配，已知环境假象）/0 污染；隔离真实 Chrome 390px 浅/深 ×9 视图+新建抽屉 20/20 无外壳溢出，证据 `docs/verification/narrow390-20261016/`。分支 `p0/narrow-390`，不 merge/不 push/不改 version/不打 tag，待协调者统一 rebase 合并。

## ADL-054 ｜ 2026-10-17 ｜ #22 副驾写扩展：四类实体 create/update 走既有 repo/command，HITL 草稿卡确认才落库，零 schema、乐观锁冲突跳过、幂等

- **背景**：副驾写操作此前仅支持 `task.update`（PROD-24 多步规划），里程碑/风险/交付物/会议四类实体无法由副驾创建或更新；模型路由层（c78e6a4 三档路由，`model-route.ts`/`ai-client.ts`）只读、禁止改动/绕过/回退，#22 只能在其之上扩写操作。
- **决定**：
  1. 计划动作类型从 `task|milestone|note` 补齐 `risk.create/risk.update`、`deliverable.create/deliverable.update`、`meeting.create/meeting.update`（连同既有 `milestone.create/update`）；解析沿用 `extractPlan`/`parseCopilotActions`，可容错，未知/不命中实体或字段的动作安全忽略并说明。
  2. 后端不开新写路径：create 注入 projectId 后调各实体既有 `add*`，update 查记录、核 projectId、比基线 `updatedAt`（不一致抛 `DispatchSkip` 跳过、绝不覆盖他人改动）后调既有 `update*`；`task.update` 仍走 `updateTask`。
  3. HITL 不变：每个写动作渲染为确认草稿卡（按实体分组、新建=新值、更新=旧值删除线→新值、顶部「新建X/更新X · id」徽标），用户确认才落库，取消=零写；复用既有 ask-apply 后端守卫。
  4. 幂等：同一份草稿重复确认不重复建，幂等键 = projectId + actorSegment + JSON(actions) + JSON(baseline) 的 SHA-256，命中即拦截；乐观锁冲突跳过不覆盖。
  5. 零存储 schema：不改 types 存储结构、不新增字段、不迁移；纯函数/确定性（today 可注入、无随机/墙钟）。
- **理由**：在不触碰模型路由与存储 schema 的前提下，把副驾写面扩到四类实体；HITL 草稿卡保留人在回路，避免模型直接落库误写；复用既有 repo/command 保证校验与原子写一致，避免双轨写路径漂移。
- **替代方案（已否决）**：① 副驾直接调各实体命令绕过 ask-apply 守卫——绕过白名单校验、无 HITL，否；② 为四类实体新增独立写 API/存储字段——违背零 schema、引入迁移，否；③ 模型未给可解析动作时编造写操作——违反诚实原则，否。
- **最终结果**：`pnpm build`=0；verify-isolation **72 脚本 / 72 通过 / 失败 0 / 污染 0**；新增 `verify-copilot-writes.mjs`（四类 create/update 解析、确认落库、取消零写、冲突跳过、幂等、非法/未知忽略、跨项目拒绝）；隔离 3161 真实 Chrome 浅/深两趟 8 步草稿/整批应用/取消零写全 OK，证据 `docs/verification/copilot-writes-20261017/`。

## ADL-055 ｜ 2026-10-17 ｜ #23 客观进度补全：清单客观派生与人工设定双轨并存、加法式可选字段、无信号显证据不足

- **背景**：设计契约 `docs/product/12-objective-progress.md` 把 doneAt 完成日期、effort 实际工时、evidence 证据链接、人工 override 列入 v0.7.4 deferred；旧实现只有 legacy `progress` 旁注与清单派生，人工值会与客观值混淆，且无信号时容易被填成 0% 这种假精确。
- **决定**：
  1. **双轨并存、互不污染**：`resolveTaskProgressMeta(task, derived)`（纯函数、无 I/O、不读墙钟）分别返回 `objective`（清单 checked/total 派生，来自零改动的 `deriveProgressMap`）与 `manual`（人工 0..100）；`display = manual ?? objective`，`mode` 标 `manual/objective/none`；人工设定绝不改写 objective，清除（`manualProgress=null`）后自动回落客观。
  2. **无信号不伪造**：无清单/无证据时 objective=null，UI 显「证据不足」而非 0%；status=done 但无清单的叶子也不伪造 100%。
  3. **doneAt 复用既有 completedDate**：不新建完成日期字段；done 自动记当天、显式值采纳、revert 清除（既有口径与 verify-completed-date.mjs 已覆盖），本项只在任务表单只读展示。
  4. **加法式可选 schema**：仅新增可选 `effortHours/evidenceUrl/manualProgress/manualProgressNote`，缺省安全、旧记录无这些键照常 parse、无需迁移、不改既有字段语义；这与 #22「零 schema」不同——本项就是按契约补 deferred 字段。
  5. **人工设定显式标记**：表单内橙色「人工设定 n%」徽标 + 清除按钮 + 来源/口径备注 textarea，与客观只读块分区，避免人工值被误读为客观派生。
- **理由**：客观与人工是两种口径，必须分开存、分开显，否则看板会把人工拍板当成清单完成度；可选加法式保证老数据零迁移零报错；纯函数 meta 解析可离线表驱动锁定，避免墙钟/随机引入非确定性。
- **替代方案（已否决）**：① 用人工值直接覆盖 objective 单轨——人工污染客观派生、无法追溯，否；② 无信号默认 0%——伪造精确值、违反诚实原则，否；③ 新建独立 doneAt 字段——与既有 completedDate 重复、引入双完成日期，否；④ 为新字段做破坏性迁移——老数据风险大、无必要，否。
- **最终结果**：`pnpm build`=0；verify-isolation **73 脚本 / 73 通过 / 失败 0 / 污染 0**；新增 `verify-task-meta.mjs`（effort/evidence 读写缺省、人工标记不污染客观、清除回落、旧记录安全 parse、done↔completedDate）；隔离 3162 真实 Chrome 浅/深两趟人工态（证据不足+3.5h+证据链接+人工 30% 徽标）与客观态（2/4=50%、无徽标）全 OK，证据 `docs/verification/progress-meta-20261017/`。

## ADL-056 ｜ 2026-10-17 ｜ #24 测试框架 + CI：vitest 纯函数单测层与 verify-isolation 互补、v8 门槛按本批子集真实值设定、确定性 E2E 独立 job、real-model smoke 不进必经

- **背景**：仓库此前只有表驱动离线 `verify-*.mjs` 集成/隔离门，没有正式单测框架，也没有 CI；本批要在「不推翻 verify-isolation」的前提下引入 vitest + v8 覆盖率门 + 可重复 E2E + GitHub Actions，且不得把真实出网/真实模型依赖塞进必经门。
- **决定**：
  1. **两层互补、不替代**：verify-isolation 继续承担存储/隔离/集成/资产零污染门（73 脚本不变）；vitest 定位为 core 纯函数单元层，`*.test.ts` 与源码同级、被 tsconfig exclude 不进 lib、不被 verify 发现规则误抓。
  2. **覆盖率门槛收窄到本批针对模块**：全量 src/core 行覆盖仅 8.93%（大量未测粘合层），无法设全局门槛；故 v8 `include` 只收 settings/copilot/progress-derivation/gantt 四个本批模块，阈值取子集真实实跑（lines 45.02/branches 86.25/functions 42.37）略降为 lines40/branches80/functions35/statements40，留合理余量且实测绿；不造假大面积 exclude、不设必挂高门槛。
  3. **E2E 确定化、非阻断**：`scripts/e2e.mjs` 自建隔离 DSH_HOME/临时存储/备份/非生产端口，`DSH_PM_E2E=1` 确定性缝（不调模型、不出网），puppeteer-core 真实 Chrome 断言渲染+console 干净；缺 harness/Chrome/profile 时 SKIP exit 0，使无宿主的 CI 不硬失败。
  4. **CI 分 job**：`core` job 必经 install→build→verify-isolation→vitest coverage；`e2e` 独立 job（装 headless chromium，缺 harness SKIP）；`verify-real-model.mjs` 真实出网 smoke 不进任何必经 job。
  5. **只加 devDependencies**：vitest/@vitest/coverage-v8/puppeteer-core 均 devDep，不改 package.json version（仍 0.7.4）、不打 tag、不新增运行时业务依赖。
- **理由**：单测层与集成门职责分离，避免用单测覆盖存储 I/O、也避免集成门摊薄纯逻辑回归；覆盖率门槛必须诚实可达成，否则要么造假要么必挂；E2E 依赖仓库外的只读宿主 deepseek-harness，CI 无法自洽，故设计为缺件 SKIP 而非硬失败；真实模型 smoke 受网络/配额影响，不能阻断主干。
- **替代方案（已否决）**：① 把现有 verify-*.mjs 简单复制成 vitest——重复造门、职责不清，否；② 对全量 src/core 设高覆盖率门槛——大量粘合层未测必挂，靠大面积 exclude 凑绿属造假，否；③ E2E 在 CI 强制真实出网/真实模型——不稳定、阻断主干，否；④ 把 verify-real-model.mjs 加回确定性门——违反离线确定性要求，否。
- **最终结果**：`pnpm build`=0；verify-isolation **73 脚本 / 73 通过 / 失败 0 / 污染 0**；vitest 4 文件 29 用例全过、子集覆盖率过门槛；`pnpm e2e` 本机可重复 PASS（3171 用完即 DOWN，正式 3080=66364 未变）；`.github/workflows/ci.yml` 已配置。本机无 gh 登录，未在 GitHub 端观测 Actions 实跑，如实记录。

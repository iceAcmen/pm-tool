# A12 U4 范围核查与最小修复依据

> 给 Main、协调者及独立测试专家使用。只读核对任务表 U4 的承诺、裁剪证据和源码缺口，提出文件级有限修复建议；不是产品实现、产品测试或独立验收签字。任务标识沿用 20261021，实际核查日期 2026-10-22，平台 trae。

## 1. 范围结论

**在本次检索到的仓库材料中，没有较新、对象明确且已生效的 out-of-current-route 裁剪，足以把任务表 U4 改为 N/A。应保留专家既有 RA-GAP-U4 / SOURCE FAIL，按原 RA-U401/RA-U402 补齐有限承诺并复验。** SOURCE FAIL 是实现缺口，不是运行崩溃，也不是本报告新增判定。

“未实现”描述实现状态，不等于“未承诺”或“已裁剪”。原盘点把这一项列在“尚未实现与明确暂缓”混合表内，但同一行的处置明确区分已承诺修复与未承诺后续扩展。不能只取章节标题或“部分未实现”三个字当排除授权。

本结论依据四种不同性质的材料：父任务原句、盘点中的条件处置、后续 mapping 的范围解释、专家的有限缺陷与测试合同。mapping 与专家后文互引，不当作多个独立所有者批准。最早路线中 U4 待定的历史，也不被倒推成当时已经批准。

本次授权仅写本报告。Main 的其他 GUI/既有验修继续；本报告不启动 U4 实现、不改变批次顺序、不把父任务最后 commit 授权转给本只读子任务。

## 2. 原句与范围证据

以下引用均为本次实际回读的工作树文件行号。链接采用本机文件路径，文件后续变更可能移动行号。

| 证据 | 精确句或条款 | 范围解释 |
| --- | --- | --- |
| [父任务记录 L7-L12](file:///Users/bytedance/Projects/dsh-pm/pm-tool/reports/all-pending-acceptance-execution-20261021.md#L7-L12) | 负责人原句：“好的，按之前的盘点文档和这个分工方案继续推进，直到把所有没验完的功能全部验完，再把所有代码都提交为止，才算完成任务，中途不要停下来。”L12：“部分未实现任务视图增强先核现有合同，确属本批承诺缺口才按测试计划补，不重启长期暂停功能。” | 原句不是任意新功能授权；L12 是协调者的执行解释，保留合同核对分支，而非排除任务视图。 |
| [盘点 §5 L96-L108](file:///Users/bytedance/Projects/dsh-pm/pm-tool/docs/plans/2026-10-21-project-status-and-next-implementation.md#L96-L108) | L105：“任务表多规则排序/列显隐及持久化”；现状：“部分未实现”；处置：“B8专家核路线合同的实际承诺，已承诺缺口单列修复；未承诺扩展排后续”。 | 当前盘点原文并非“任务表自定义列全量后置”。“未实现”没有解除承诺；后续专家核合同正是该行预设的动作。 |
| [盘点批次B L133-L143](file:///Users/bytedance/Projects/dsh-pm/pm-tool/docs/plans/2026-10-21-project-status-and-next-implementation.md#L133-L143) | L143：“若任务列显隐等属于已承诺但未实现的当前合同，专家先拆出有限缺口，由开发按方案补齐，不能静默排除。” | 有限修复属于当前验收收口的条件分支，不是必须重开产品立项。 |
| [复盘规划 L35-L37、L125-L137](file:///Users/bytedance/Projects/dsh-pm/pm-tool/docs/plans/2026-10-21-post-retrospective-roadmap.md#L35-L37) | L37：“确认已有批准路线包含的页面或操作，未实现的部分先列差距，再决定它属于当前修复还是另批实施。”L125：“已有合同和样稿能覆盖就沿用”；L137：“不能删掉当前合同已经承诺的状态”。 | “新增功能不作为本批范围”不能独立覆盖同文的已承诺缺口分支。 |
| [mapping §0 L18](file:///Users/bytedance/Projects/dsh-pm/pm-tool/docs/testing/b1-b8-coverage-mapping-20261020.md#L18) | “路线清楚，属 B4 新增实现项（现引擎仅单字段 sort），非用户开放决策；本批不做须明确标 out-of-current-route”；备注：“待实现或显式排除”。 | 表述要求显式排除；“待实现或显式排除”只是二选一条件，并不是已经选择排除。 |
| [mapping §2 L35-L41](file:///Users/bytedance/Projects/dsh-pm/pm-tool/docs/testing/b1-b8-coverage-mapping-20261020.md#L35-L41) | tasks 行：“Migrate 试点”，New：“多字段排序/列显隐(U4)”。 | “New”描述相对旧产品需要新增实现，不等于本次已承诺缺口修复被禁止。tasks 与看板须分别核覆盖。 |
| [总登记 §6 L79-L84](file:///Users/bytedance/Projects/dsh-pm/pm-tool/docs/testing/remaining-acceptance-register-20261021.md#L79-L84) | “属于**已承诺未实现**，Main按RA-U401/02有限修复并复验。”；“路线U4最初为待定不能单独证明已批准；本裁决使用较新明确映射及本轮授权。” | 已有专家范围裁决。没有较新有效替代，就不能由开发自行降为 N/A。 |
| [交件回执 L7-L10](file:///Users/bytedance/Projects/dsh-pm/pm-tool/docs/testing/remaining-plan-delivery-receipt-20261021.md#L7-L10) | “已承诺未实现单列RA-GAP-U4：tasks单sort/固定列与较新批准路线冲突；有限修复RA-U401/02，不重开看板multiSort历史PASS。” | 是专家对 Main 的有限交件，不是自由列设计器批准。 |
| [当前接续 L14-L23](file:///Users/bytedance/Projects/dsh-pm/pm-tool/docs/progress.md#L14-L23) | L15：“全部剩余旅程/矩阵/读屏/U4/模型/最终出口仍未完”；L23：“独立专家已核任务表多规则排序/列显隐属既有合同缺口，batchA闭门后有限补齐。” | 较新接续仍保留 U4；“batchA闭门后”是排队条件，不是路线裁剪。 |
| [层映射 L99-L101](file:///Users/bytedance/Projects/dsh-pm/pm-tool/docs/testing/remaining-layer-map-20261021.md#L99-L101) | RA-MENU-38：“旧四sort兼容及U4新多规则→保存/重进，不把原图单sort当裁掉U4”。 | 原图单排序也不能作为解除后续合同的证据。 |

### 2.1 裁剪反证搜索与限制

检索了 AGENTS、collaboration、两份 2026-10-21 规划、产品路线表、requirements/decision-log、当前 progress/handoff/onboarding/changelog、testing 相关计划及报告、reports 执行记录。使用 U4、RA-U401/402、out-route、out-of-current-route、多字段/多规则排序、列显隐/自定义列等词核对。可见的 out-route 命中是条件要求、待实现状态或保留缺口，没有所有者明确选定的较新排除决定。

反向核对中，复盘规划 L5 和产品路线表 L14 的同日状态校准指向整体盘点，未裁掉 U4；执行记录中的“未开U4”“不能直接推进U4”表示当前批次未到该项，并非 U4 取消。[执行记录 L55、L70、L81、L169](file:///Users/bytedance/Projects/dsh-pm/pm-tool/reports/all-pending-acceptance-execution-20261021.md#L55)及[总登记 L23-L25](file:///Users/bytedance/Projects/dsh-pm/pm-tool/docs/testing/remaining-acceptance-register-20261021.md#L23-L25)仍将其留在后续收口出口。

**原路线图正文的证据限制**：`PM工作台新版实施路线图-20261020.md` 被 mapping L3、早期测试计划 L4 引用，但本次在仓库和相邻项目目录的定向文件检索中未找到该正文；未读私有历史或据转述制造原路线 §3/§7.1 的精确原句/行号。原路线的“最初待定”只能归属总登记 L84 的历史说明，tasks New 可直接核到仓库 mapping L41。本结论因此限定为“现有仓库证据没有有效裁剪”，不是声称穷尽所有仓库外历史。

如后来找到有效裁剪，按[总登记 L84](file:///Users/bytedance/Projects/dsh-pm/pm-tool/docs/testing/remaining-acceptance-register-20261021.md#L84)交专家确认替代范围，不自行改 N/A。需要辨明所有者原句/批准来源、tasks 对象、排除内容、生效时间及对现测试合同的替代关系；单纯“后续再说”“未实现”或看板子项 PASS 不足。

## 3. 源码事实与旧行为

| 文件/行 | 实际可见行为 | 修复约束 |
| --- | --- | --- |
| [core/task-views.ts L18-L43、L86-L103](file:///Users/bytedance/Projects/dsh-pm/pm-tool/packages/dsh-pm-tool/src/core/task-views.ts#L18-L43) | `TaskViewState` 只有 query/chip/grouped/sort；排序四键 code/dueDate/priority/progress；store version=1。内置六视图保留各自单 sort。 | 没有有序规则数组、显式方向、列偏好。保留旧四态与内置 ID，不清仓或重置默认视图。 |
| [core/task-views.ts L115-L128、L181-L188、L202-L219、L260-L267](file:///Users/bytedance/Projects/dsh-pm/pm-tool/packages/dsh-pm-tool/src/core/task-views.ts#L115-L128) | normalize 仅采四态；序列化 store；key=`pm-task-views:<projectId>`；相等比较只比四态；保存重新 normalize；摘要只描述单 sort。 | 仅 UI 添加状态会在保存时被丢弃；normalize/save/equality/摘要都须接新偏好。 |
| [task-views-persist.ts L29-L56](file:///Users/bytedance/Projects/dsh-pm/pm-tool/packages/dsh-pm-tool/src/client/views/task-views-persist.ts#L29-L56) | 按项目加载/保存，经 core 解析与序列化；localStorage 缺失/异常退内存，不抛。 | 薄层无需新后端；必须验证新偏好经该真实链往返。内存降级不等于刷新后永久持久。 |
| [tasks.tsx L261-L271、L452-L453、L482-L557](file:///Users/bytedance/Projects/dsh-pm/pm-tool/packages/dsh-pm-tool/src/client/views/tasks.tsx#L261-L271) | 首挂载、应用视图、保存视图、切项目都仅处理四态。 | 新字段须进入所有恢复/保存/dirty 路径，特别是无默认的项目不能残留上一项目偏好。 |
| [tasks.tsx L389-L400](file:///Users/bytedance/Projects/dsh-pm/pm-tool/packages/dsh-pm-tool/src/client/views/tasks.tsx#L389-L400) | `visible` 单 sort：dueDate 升序（空值 `'9999'`）；priority P0/P1/P2 升序；progress 使用当前 display 降序、null 为 -1；code 使用 numeric locale 顺序。 | 旧四 sort 的方向、客观/人工 display 口径不能意外改为 raw progress 或统一升序。 |
| [tasks.tsx L601-L615、L1330-L1335](file:///Users/bytedance/Projects/dsh-pm/pm-tool/packages/dsh-pm-tool/src/client/views/tasks.tsx#L601-L615)；[core/task-tree.ts L23-L65](file:///Users/bytedance/Projects/dsh-pm/pm-tool/packages/dsh-pm-tool/src/core/task-tree.ts#L23-L65) | grouped 在各状态组内沿 `visible`；非 grouped 经 `flattenVisible`，内部 `indexChildren` 再按 WBS code 排根及同层。 | 只把 visible 改为 multi-sort，不足以证明默认表格实际排序；树序会覆盖。新规则不得拆散父子/改编号或 parentId。 |
| [tasks.tsx L808-L828、L850-L911、L1318-L1327](file:///Users/bytedance/Projects/dsh-pm/pm-tool/packages/dsh-pm-tool/src/client/views/tasks.tsx#L808-L828)；[tasks.css L152-L155、L599-L671](file:///Users/bytedance/Projects/dsh-pm/pm-tool/packages/dsh-pm-tool/src/client/views/tasks.css#L152-L155) | 固定表头、叶行/父行/状态头占位；桌面九轨 grid，窄屏另有 grid/flex 与隐藏规则。 | 隐藏已有列须同时处理表头、各行、占位和网格轨道，不能只隐藏文本留空轨或造成错列。窄屏响应式隐藏不是用户持久列偏好。 |

总登记 L82 中 tasks 的旧行号已随并发修复漂移；上表是本次回读定位，不据旧行号指到不同功能而推翻旧结论。

## 4. 最小文件级修复建议

本节是后续 Main 可认领的有限方案，不是已执行改动。路径除文档外相对 `packages/dsh-pm-tool/`。不动业务 schema/任务命令/服务/profile/看板引擎，不新建自由列平台。

| 文件 | 最小职责与影响 | 先行验证对应 |
| --- | --- | --- |
| `src/core/task-views.ts` | 在旧四态上可选扩展有序 `sorts`（合法既有键+asc/desc）和既有可选列偏好；缺字段走旧语义。normalize/save/serialize/same/describe 统一新旧有效值，不丢 query/chip/grouped/sort。复用 version=1 的加法字段可满足当前兼容，不需要业务数据迁移。 | RA-U401/402；旧 JSON、坏值、往返、默认/内置、dirty 对比。若版本策略调整，必须继续读取旧 v1，不能清仓。 |
| `src/core/task-tree.ts` | 为新显式规则增加可选同层 comparator 接缝，默认参数仍 WBS code；根与各父节点下排序，前序/折叠/孤立节点行为不变。仅新规则激活时传入，不让旧视图发生重排。 | RA-U401 的平面实际顺序、树父子结构、折叠；`verify-task-tree.mjs` 旧基线。 |
| `src/client/views/tasks.tsx` | 复用命名视图保存/设默认；添加至少两规则可编辑的有限入口及方向；首挂载/apply/save/切项目全接线。旧 `.pm-sort-select` 留为兼容快捷入口，选它应明确回到旧单 sort，避免旧值与新链冲突。列控件只选已有可选列，表头/叶行/父行/分组头按同一偏好渲染。 | RA-U401/402 与 RA-MENU-36/38；实际组件加载/操作/存储回读，不只测纯模型。 |
| `src/client/views/tasks.css` | 仅任务页范围内适配规则控件与可见列网格；全显旧布局不变，避免隐藏列后空轨/错位。保留已修编号复制、标题、焦点、宽窄布局。 | U402 实际显隐；任务页受影响 RA-V 格与现有 responsive/toolbar 合同。 |
| `src/client/views/task-views-persist.ts` | **原则上不必修改**：已委托 core 且按项目隔离。补真实薄层测试即可；只有测试发现序列化/内存降级接缝问题才修该文件，不复制归一化规则。 | 两项目读写、异常/缺失 localStorage、保存后刷新恢复。 |
| `src/core/task-views.test.ts`；新增 `src/client/views/task-views-persist.test.ts`、`src/client/views/tasks-u4.test.tsx` | 专项回归先于产品修复；覆盖原 U4 动作、有效旧语义及实际组件/薄层。沿现有测试设施，不安装新框架。可把确定性比较测试放现有 core 测试内，不为此强造新模块。 | 原合同红例→最小修复→复验；这些测试文件是建议名，非已建文件。 |

### 4.1 必须保留的兼容性

1. 旧存储缺 `sorts`/列偏好时等价旧四态：默认 WBS 树、原六内置视图、原搜索/chip/grouped、原单 sort 方向和 display 口径。不批量改写 localStorage，不清记录、视图 ID 或默认 ID。
2. 新排序仅作用展示；保父子、折叠和同层关系，稳定并列，不 mutate tasks。新规则在默认非 grouped 平面表也应可观察，不能要求用户额外开启 grouped 来绕过树排序。
3. 新规则优先级按数组顺序，字段/方向受合法集合限制；旧快捷排序与新规则互斥生效。空/坏规则的兜底和重复字段处置由专家补齐可测边界，不能静默接受不可表达的意图。
4. 列偏好仅针对已有列，例如负责人/优先级/截止日期/进度；编号、标题及必要操作保留。缺偏好全显；隐藏不改业务数据、不禁用被隐藏字段的领域能力。仅 U402 不要求列重排、列宽编辑或导出 schema 改造，原全字段导出/分享保留。
5. 相同有效偏好应判相等，方向、规则顺序或列显隐改变应触发 dirty；另存/更新/default/重命名/删除/项目切换不丢其他四态。存储不可用保留旧会话降级，不谎称跨刷新持久成功。

“至少两规则”不是新定“最多两条”；看板 max3 也不自动成为任务表上限。日期空值/全并列兜底及新旧规则交互若需细化，由测试专家在原 U4 有限合同内补清楚，不以此向所有者再索取已经覆盖的修复权限。

## 5. 原有效测试先行依据

**测试合同已经存在，不应把缺口当成先写产品、以后补需求的新任务。** [collaboration §9.2 L142-L148](file:///Users/bytedance/Projects/dsh-pm/pm-tool/docs/collaboration.md#L142-L148)规定“需求/方案 → 测试计划与用例 → 开发实现 → 独立测试”；[§9.3 L151-L154](file:///Users/bytedance/Projects/dsh-pm/pm-tool/docs/collaboration.md#L151-L154)允许阻塞期间缺陷修复/补测/文档，禁止新功能。测试目录只读、不自行改用例，依据[§9.1 L135-L140](file:///Users/bytedance/Projects/dsh-pm/pm-tool/docs/collaboration.md#L135-L140)、[§11.4 L241](file:///Users/bytedance/Projects/dsh-pm/pm-tool/docs/collaboration.md#L241)。

| 原用例/基线 | 原有效要求或断言 | 后续验证方式 |
| --- | --- | --- |
| [RA-U401 原文 L110](file:///Users/bytedance/Projects/dsh-pm/pm-tool/docs/testing/remaining-journey-cases-20261021.md#L110) | “设两规则priority升序→dueDate降序→save命名视图/default→刷新/服务重进→切B→回A”；预期“有序稳定、方向明确、同项目恢复/跨项目不串、旧四态存储兼容、WBS树保旧父子结构”。 | 专家既定 F1 中另选三平面任务，保同优先级/不同截止及同截止/不同 code；先写可检出现缺口的 AUTO，再 Main 按原步骤采实际 GUI/存储回读。不能以看板排序替代任务表排序。 |
| [RA-U402 原文 L111](file:///Users/bytedance/Projects/dsh-pm/pm-tool/docs/testing/remaining-journey-cases-20261021.md#L111) | “隐藏一已有可选列→保存视图→刷新/重进→恢复该列→切项目”；预期实际生效、恢复/隔离、不丢四态、不删记录、不破编号标题可识别及复制；“无任意列schema/自定义列设计器新范围”。 | 同步验证表头/各行/布局、保存 JSON、刷新/default、项目切换；字段值和记录数不变。隐藏列取消保存不得被误当已持久。 |
| [task-views.test.ts L25-L84、L122-L215](file:///Users/bytedance/Projects/dsh-pm/pm-tool/packages/dsh-pm-tool/src/core/task-views.test.ts#L25-L84) | 旧四态精确默认、内置六视图、坏值兜底、save/update、默认/删除、四态往返与项目键。 | 保留这些行为断言。若加法字段改变对象形状，仍保旧输入兼容断言，不能删掉测试来“变绿”；可选字段方案可减少无关精确快照变化。 |
| [tasks-contract.test.ts L14-L43](file:///Users/bytedance/Projects/dsh-pm/pm-tool/packages/dsh-pm-tool/src/client/views/tasks-contract.test.ts#L14-L43)；[tasks-p0-toolbar.test.ts L79-L102](file:///Users/bytedance/Projects/dsh-pm/pm-tool/packages/dsh-pm-tool/src/client/views/tasks-p0-toolbar.test.ts#L79-L102) | 空态/清条件、危险删除、同源 tally、视图保存分享/导出、导入、分组、旧排序入口、密度和搜索保留。 | 受影响回归；这些现有源码静态断言不是 U4 实际交互验收。编号复制另沿 `tasks-clipboard.test.ts` 及 D-05 原证范围。 |
| [看板 U4 QA L5-L21、L30-L31](file:///Users/bytedance/Projects/dsh-pm/pm-tool/docs/testing/b4-u4-multisort-qa-20261020.md#L5-L21) | WidgetConfig sorts、legacy dualread、max3 等看板 targeted PASS；GUI persist 留 Main later。 | 只在看板原范围保留，不继承为任务表 PASS；不改看板来解决任务表缺口。 |

Main 后续实施仍按当前排队与唯一写者约束：先核 batchA/当前批次出口，再认领 U4 文件。先行专项是原用例的实现验证，不擅自扩写专家合同。需要澄清夹具或并列语义时交专家最小补充，其他无争议验收继续。

修后按[总登记 L31-L35、L92-L94](file:///Users/bytedance/Projects/dsh-pm/pm-tool/docs/testing/remaining-acceptance-register-20261021.md#L31-L35)认领新候选/输出/实例/开关并交逐 ID 原证；任务视图和 CSS 变更影响已采任务旅程、列布局、复制及相关 RA-V 格，继承/重测由专家审证。不以旧 HEAD 或测试数代表 dirty 候选。Main 在隔离输出执行完整 build/vitest/coverage/全部适用 verify/专项，GUI 另验；本报告未执行任何这些命令。

## 6. 已承诺修复与新需求分界

| 当前有限修复 | 不从当前授权自动获得的扩展 |
| --- | --- |
| 至少两既有合法字段有序排序、各自明确方向、稳定展示 | 自由公式排序、任意字段/列 schema、自由列设计器 |
| 已有可选列显隐，命名视图保存/default、同项目恢复/跨项目隔离 | 列宽/拖拽列序设计平台、团队共享、跨设备同步、后台持久服务 |
| 旧四态/旧单排序/默认 WBS 树/编号标题与复制兼容 | 自动重排 WBS 编号、改变父子关系、借 U4 改进度/任务领域写语义 |
| 修受影响的 UI/存储接缝、原用例复验 | 将看板 max3 定成任务表新合同，或把整个 OIL/设计提议升格 |

依据[总登记 L83-L86](file:///Users/bytedance/Projects/dsh-pm/pm-tool/docs/testing/remaining-acceptance-register-20261021.md#L83-L86)。已承诺修复无需另索取产品新增批准，但仍须原测试先行、文件认领、排队及独立审签；任何真正新增需求另走范围确认。父原句也不豁免独立门，更不授权本子任务实施或提交。

## 7. 本次执行与证据身份

运行环境：macOS，本仓库 `/Users/bytedance/Projects/dsh-pm/pm-tool`。只运行文件读取/检索、Git只读状态/差异/HEAD查询、sha256 和报告文本检查；未启动 Node/pnpm 环境，不声称本次验证了其版本。

读取时 `HEAD=9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，工作树存在大量 Main/专家在途成果；盘点文件不在 HEAD，不能通过 HEAD 代表其内容。本报告引用实际磁盘状态，不 fetch/pull，不改变并发成果。源码不等于已构建/运行/默认生效。

| 文件 | 本次读取 SHA-256 |
| --- | --- |
| `src/core/task-views.ts` | `a44945cd8946fc77ba0a03846c795597985f837e957152d5a630bfda1acf60db` |
| `src/client/views/tasks.tsx` | `9789e5811ab09dcbc1c561ccec463e905795b34da1eb7f996bab73d8d21ef91e` |
| `src/client/views/task-views-persist.ts` | `2fb391029e086a73dea6f8d0b08df979ad1fb4b8de99ff8344694c64e3226217` |
| `docs/testing/remaining-acceptance-register-20261021.md` | `1ac19a6efacb5316fdd6ca74da47751b0ef55eee8a5897e819ea51db464f430d` |
| `docs/testing/remaining-journey-cases-20261021.md` | `ae44705d3bde794b0f349381f10218ba20b77a8ff55d12d81623fc426eb60ab2` |
| `docs/testing/b1-b8-coverage-mapping-20261020.md` | `e61bcb3c1a887f5da776529e3cba75d9bf75596008dd8aa9c0ee9310e6a4e80f` |
| `docs/plans/2026-10-21-project-status-and-next-implementation.md` | `ee875d74b31c293996e80d783b464160b4f7e925ad55a291065cf1f7abb7734a` |

报告自检：Perl 只读检查全部 34 个本地引用的文件存在性及行号范围，exit0；七份关键文件再次 `shasum -a 256` 回读，exit0、与上表一致。`git diff --no-index --check -- /dev/null reports/a12-u4-scope-exploration-20261021.md` 无空白错误输出、exit1（新增文件与空文件有差异，no-index 的差异退出码，不是产品失败）。`git status --short -- reports/a12-u4-scope-exploration-20261021.md` 为未跟踪新增文件，未提交。检索时 `rg` 不可用，改用 find/grep；定向读取 HEAD 中盘点失败是该文件尚未入 HEAD，不是盘点缺失，随后按实际磁盘正文引用。

本次唯一写入 `reports/a12-u4-scope-exploration-20261021.md`。无产品改动、build、test/verify、GUI、服务/端口、install、凭据读取、commit/push；不写 testing 或 living docs，不触及 Main 正在进行的 GUI。本报告的文本检查只证明报告完整性，不产生产品 PASS，也不关闭现有 U4 缺口。

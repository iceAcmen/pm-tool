# 需求分析文档 requirements.md

> 本文件记录产品「要做哪些功能、优先级如何、怎样算验收通过」，并给出 MVP 的数据模型与落盘约定；给开发与验收使用，按模块增删条目。本文档经项目所有者评审确认后作为阶段 3 开发依据。

- 文档状态：**阶段 3 开发依据（v0.5）**，R7 风险与问题模型及验收边界已确认
- 最后更新：2026-10-10（R7 离线 CRUD、持久化和 Web 工作台已实现，模型见 ADL-024）
- 技术可行性依据：见 [feasibility-map.md](./feasibility-map.md)
- **需求变更追溯**：任何需求/范围调整都在 [decision-log.md](./decision-log.md) 记录「时间、变更、原因、替代方案、结果、改动平台」（v0.1→v0.2 见 ADL-007/008，v0.2→v0.3 见 ADL-009，v0.3→v0.4 见 ADL-011，v0.4→v0.5 见 ADL-024），并在 [changelog.md](./changelog.md) 留痕；多平台协作规则见根 `AGENTS.md` 与 [collaboration.md](./collaboration.md)。

## 一、目标用户与核心场景

- 目标用户：项目经理 / 项目负责人（PM），含非纯技术背景使用者。
- 核心价值：在 dsh 智能体框架之上，提供一套**可视化、可沉淀、可追踪、可迁移**的项目管理工作台，覆盖项目从计划到交付的关键动作。
- 使用前提（MVP）：**单用户、本地 macOS 使用**；数据保存在本地文件，可用 git 管理。

## 二、已确认的关键决策（2026-10-10，项目所有者拍板）

| # | 决策项 | 结论 |
|---|---|---|
| D1 | 模型接入 | **离线优先的混合模式**：项目/任务/里程碑等结构化增删改查不依赖模型、本地可用；会议纪要、智能 WBS 建议、周报等「生成型」功能按需配置 `DEEPSEEK_API_KEY` 后启用 |
| D2 | 数据存储 | **人类可读的 Markdown/JSON 文件**：底层用 dsh `storage-domain` + `storage-json` 落盘为 JSON，再渲染 Markdown 概览/报告；可直接阅读、可 git 版本管理、可迁移 |
| D3 | 交互形态 | **先做 dsh Web 可视化界面**（插件卡片/区块起步），斜杠命令作为离线操作入口；对话式生成能力后续叠加 |
| D4 | 首批范围 | **最小闭环 MVP**：项目计划 → WBS 任务拆解 → 里程碑 → 保存/导出，先端到端跑通，其余模块迭代 |

默认假设（项目所有者未反对，如需调整请指出）：MVP 单用户本地；**导入 Excel/Markdown、多项目检索/看板、多人协作**列为 P2。

## 三、功能模块清单（含优先级与验收标准）

优先级：**P0 = MVP 必做；P1 = 重要、第二梯队；P2 = 增强、后续**。

| 编号 | 模块 | 优先级 | 关键能力 | 验收标准（可测试） | 状态 |
|---|---|---|---|---|---|
| R1 | 项目计划 | P0 | 新建/查看/编辑/删除项目：名称、目标描述、负责人、起止日期、状态；项目列表与项目概览 | ① 不配置 API Key 也能新建项目；② 项目列表可见、可进入详情；③ 字段写入 JSON 文件，重启 dsh 后仍在；④ 支持编辑更新；⑤ 删除须带 `confirm` 关键字二次确认（`/pm project delete <id> confirm`，不带只提示不执行，见 ADL-012）；⑥ 新增/更新校验 `targetDate` 不早于 `startDate`；⑦ 同名项目默认阻止、命令末尾加 `confirm` 才允许创建 | 已完成：离线完整 CRUD、持久化与 Web 项目列表/详情/新建/编辑/删除均已实现并自动验证 |
| R2 | WBS 任务拆解 | P0 | 在项目下逐层新增/编辑/删除任务，支持**至少 3 层**父子结构；字段：标题、负责人、状态、优先级、起止日期、进度；自动 WBS 编号（如 1.2.1） | ① 能搭出 ≥3 层任务树并增删改；② 父子关系正确、删除父任务有明确处理策略（见 5.3）；③ 编号自动生成且唯一；④ 持久化到 JSON、重启不丢 | 已完成（离线）：tasks 表、完整命令、三级树、移动/循环保护、显式重编号与重启读回均通过 |
| R3 | 里程碑管理 | P0 | 新建/编辑里程碑：标题、目标日期、状态（计划中/有风险/已达成/已错过）、说明；可关联相关任务；时间线视图 | ① 能创建并标记里程碑达成；② 项目视图可见按日期排序的里程碑时间线；③ 状态随日期/任务进展可手动更新；④ 持久化、重启不丢 | 已完成：离线完整命令与 Web 日期时间线、新建、标记达成、删除均已实现并自动验证 |
| R4 | 数据持久化与导出 | P0 | JSON 文件可靠落盘（原子写）；每个项目生成可读 Markdown 概览；一键导出 Markdown 报告与 JSON 打包 | ① 重启后数据完整；② 直接打开数据文件是人能看懂的 JSON/Markdown；③ 可导出一份含计划/WBS/里程碑的 Markdown 报告；④ 数据目录可被 git 跟踪 | 已完成：三类实体持久化、单项目 Markdown 和整库 JSON 数据包均通过回归 |
| R5 | Web 可视化界面（MVP 版） | P0 | 在 dsh Web 中提供项目管理面板：项目列表 → 项目详情（计划信息 / WBS 任务树 / 里程碑时间线），支持基础新建/编辑表单 | ① `pnpm dsh web` 后能在浏览器看到并操作上述界面；② 核心增删改查通过界面即可完成、无需命令行；③ 无 API Key 时界面功能可用。**排序（ADL-013）：排在 R2/R3/R4 之后；先做设置卡片/插件详情区块，再 spike 独立顶级页面；若外部包无法稳定新增顶级页面，第一版接受「设置卡片/区块 + 离线斜杠命令」作为演示形态** | 已完成并验收：外部 clientBundle 顶级面板支持项目/WBS/里程碑核心操作，无 Key 可用；2026-10-10 项目所有者手动验收通过 |
| R6 | 离线斜杠命令 | P0 | 提供 `/pm` 系列用户命令（projects/tasks/milestones 的增查改），作为离线与无界面时的入口 | ① 不配置模型即可用命令完成 R1–R3 的增查改；② 命令输出中文、可读 | 已完成：project/task/milestone 离线命令均已实现并回归通过 |
| R7 | 风险与问题管理 | P1 | 共用风险问题台账：风险含概率/影响/应对，问题含影响/解决方案，通用负责人/截止日期/状态；支持类型与状态筛选 | 能离线新增、查看、编辑、关闭、筛选和确认删除风险与问题；JSON 持久化且重启不丢；Web 无 Key 可完成核心操作 | 已完成：离线命令、`risk_issues` 持久化、高密度 Web 表格与右侧抽屉均已实现并回归通过 |
| R8 | 会议纪要 | P1 | 录入或（配 Key 后）基于会话生成结构化纪要，决议项关联任务/问题/责任人 | 能产出结构化纪要并把待办关联到任务/问题 | 未开始 |
| R9 | 进度汇报 | P1 | 按项目/周期汇总任务与里程碑，生成周报/月报；可借 schedule 周期触发、office-to-pdf 导出 | 能一键生成一份可读进度报告（配 Key 后增强为智能撰写） | 未开始 |
| R10 | 交付物管理 | P1 | 复用 dsh deliverables（交付声明 + git 变更），补项目维度交付物台账：名称/版本/负责人/状态/位置 | 能维护交付物清单并记录版本与状态变更 | 未开始 |
| R11 | 里程碑提醒 | P2（暂缓） | 复用 dsh schedule，对临近/逾期里程碑提醒 | 阶段 2 决策：第一版不做，后续迭代再启用 | 暂缓 |
| R12 | 多项目与检索 / 导入 / 协作 | P2 | 多项目切换、关键字检索、统计看板；导入 Excel/Markdown（借 skill-office）；多人协作 | 多项目切换与检索可用；能导入一份外部任务表 | 未开始 |

## 四、MVP 数据模型（字段定义）

> 数据经 `storage-domain` 做 schema 校验；下列字段即 schema 与 JSON 落盘字段。枚举值固定，便于界面渲染与迁移。
>
> 2026-10-10 进度同步（trae / TRAE）：需求版本升为 v0.5；R1–R7 已实现，R5 已由项目所有者手动验收，R7 已完成自动化与真实浏览器验收。实现细节见包 README、ADL-024 与 KB-025。

### 4.1 Project（项目）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | string | 唯一标识，键名仅用 `[a-zA-Z0-9_-]+` |
| name | string | 项目名称（必填） |
| description | string | 目标与范围描述 |
| owner | string | 项目负责人 |
| status | enum | `planning` 计划中 / `active` 进行中 / `paused` 已暂停 / `done` 已完成 / `archived` 已归档 |
| startDate | date(YYYY-MM-DD) | 计划开始日期 |
| targetDate | date | 计划完成日期 |
| tags | string[] | 标签（可选） |
| createdAt / updatedAt | datetime | 创建/更新时间（自动） |

### 4.2 Task（WBS 任务节点）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | string | 唯一标识 |
| projectId | string | 所属项目（必填） |
| parentId | string \| null | 父任务，根任务为 null，构成 WBS 树 |
| code | string | 自动 WBS 编号，如 `1`、`1.2`、`1.2.1` |
| title | string | 任务标题（必填） |
| description | string | 任务说明 |
| assignee | string | 负责人 |
| status | enum | `todo` 未开始 / `in_progress` 进行中 / `blocked` 受阻 / `done` 已完成 |
| priority | enum | `P0` / `P1` / `P2` |
| startDate / dueDate | date | 计划起止（可选） |
| progress | int 0–100 | 完成进度（默认 0） |
| milestoneId | string \| null | 关联里程碑（可选） |
| order | int | 同级排序 |
| createdAt / updatedAt | datetime | 自动 |

### 4.3 Milestone（里程碑）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | string | 唯一标识 |
| projectId | string | 所属项目（必填） |
| title | string | 里程碑标题（必填） |
| targetDate | date | 目标日期（必填） |
| status | enum | `planned` 计划中 / `at_risk` 有风险 / `achieved` 已达成 / `missed` 已错过 |
| achievedDate | date \| null | 实际达成日期 |
| description | string | 说明/达成标准 |
| createdAt / updatedAt | datetime | 自动 |

关系：Project 1—N Task（通过 `parentId` 自引用成树）；Project 1—N Milestone；Task 可经 `milestoneId` 关联到 Milestone。

### 4.4 RiskIssue（风险与问题）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | string | `ri-0001` 形式的全局递增短 ID |
| projectId | string | 所属项目（必填） |
| type | enum | `risk` 风险 / `issue` 问题；创建后不可修改 |
| title / description | string | 标题必填，说明可为空 |
| owner | string | 负责人 |
| dueDate | date \| null | 截止日期，可清空 |
| status | enum | `open` 待处理 / `monitoring` 跟进中 / `closed` 已关闭 |
| impact | enum | `low` / `medium` / `high` / `critical` |
| probability | enum \| null | 风险必填 `low/medium/high`；问题固定为 `null` |
| responsePlan | string | 风险应对措施；问题固定为空字符串 |
| solution | string | 问题解决方案；风险固定为空字符串 |
| createdAt / updatedAt | datetime | 自动 |

关系：Project 1—N RiskIssue。风险与问题共用一张表，以 `type` 区分；类型专有字段保持稳定结构并在写盘前严格校验。

## 五、数据落盘与目录约定（人类可读、可 git）

### 5.1 目录布局（已定稿，2026-10-10，决策见 ADL-011）

采用 dsh `storage-domain` 的 **per-record（逐条记录）扁平布局**：在单一存储领域 `pmtool` 下按「实体类型分表、一条记录一个可读 JSON 文件」组织。物理路径规则为 `<root>/<领域 unit>/<表 table>/<键 key>.json`，文件内容 `{ "version": n, "record": <值> }`，目录权限 `0700`、原子写。

```
pm-tool/
├── data/                          # storage-json 的 root（ADL-009：不纳入 git、已 gitignore，首次写入自动创建）
│   └── pmtool/                    # 存储领域 unit = pmtool（与第 0 步自检同一领域）
│       ├── checks/                # 第 0 步自检表（selftest.json，保留）
│       ├── projects/
│       │   └── <projectId>.json   # 一条项目一个文件（表 projects，键 = projectId）
│       ├── tasks/
│       │   └── <taskId>.json      # 一条任务一个文件（表 tasks；记录含 projectId / parentId / 同级顺序 / WBS 编号）
│       ├── milestones/
│       │   └── <milestoneId>.json # 一条里程碑一个文件（表 milestones；记录含 projectId）
│       └── risk_issues/
│           └── <riskIssueId>.json # 一条风险或问题一个文件（表 risk_issues；记录含 projectId / type）
└── packages/dsh-pm-tool/          # 自研插件包
```

- **不设手工 `index.json`**：storage-domain 的表提供 `keys()` / `entries()` 迭代器（上游 `storage-domain/src/domain.ts` 已确认），项目列表、某项目下的任务/里程碑通过遍历表并按 `projectId` 过滤得到，避免双写索引导致不一致。
- 项目 `README.md` 概览、周报等 Markdown 是 **R4 的渲染导出产物**（导出到用户指定目录或随 JSON 打包），**不写入存储域、不作为数据源**；数据始终以上述 JSON 为准。
- 记录键名仅允许 `[a-zA-Z0-9_-]+`：各实体使用短 id（如 `p-0001`、`t-0001`、`m-0001`、`ri-0001`）。storage-domain 表名仅允许小写字母、数字和下划线，因此风险问题表使用 `risk_issues`。
- 本布局替代早期「按项目聚合的嵌套目录（`projects/<id>/project.json` 等）」设想——嵌套目录与 per-record 扁平键规则不兼容，故不采用（见 ADL-011）。

### 5.2 读写原则

- 写入一律经 `storage-domain`（schema 校验）→ `storage-json`（原子写、美化缩进），不手写裸 JSON。
- `README.md` 概览由数据**渲染导出**（数据以 JSON 为准、Markdown 为可读视图），避免双写不一致。
- 导出功能：单项目导出为一份 Markdown 报告；整库导出为 JSON 打包；后续可接 office-to-pdf 出 PDF。
- Markdown 默认导出到 `pm-tool/exports/<projectId>-report.md`（可指定目录）；已有文件默认拒绝覆盖，末尾 `confirm` 才原子覆盖。`exports/` 是可再生产物，默认不入 git。

### 5.3 关键业务规则（实现前明确，避免歧义）

- 删除父任务：MVP 采用**要求先处理子任务**（有子任务时禁止直接删除，提示先移动或删除子任务），不做静默级联删除，防止误删。
- WBS 编号：按同级顺序自动生成；移动/删除后提供「重新编号」动作（不自动改写，避免引用混乱）。
- 任务移动：命令须带 `confirm`；目标父任务必须同项目，禁止移动到自身或子孙任务下。`root` 表示移到根层级。
- 任务更新：只允许业务字段；项目归属、父任务、编号、顺序和时间戳由独立动作或系统维护。`startDate` / `dueDate` 可用 `null` 清空。
- 里程碑状态：默认手动维护；`missed/at_risk` 的自动判定作为 P1 增强。
- 里程碑达成一致性：`status=achieved` 时必须填写 `achievedDate`；其他状态必须为 `null`。
- 任务关联里程碑：`milestoneId` 必须指向同项目已存在里程碑；有关联任务时禁止删除里程碑，须先解除关联。
- 所有删除/覆盖类操作在界面与命令中都需二次确认（呼应行为准则的风险操作约定）。
- **项目删除（ADL-012）**：离线命令形态为 `/pm project delete <id> confirm`；不带 `confirm` 仅返回将删除内容的中文提示、不落盘；任务/里程碑等后续删除命令统一沿用该关键字确认模式。
- **日期校验（ADL-012）**：项目新增与更新都校验 `targetDate >= startDate`，不满足则中文报错、不写入。
- **同名项目（ADL-012）**：默认阻止同名新增并中文提示；确需重名时在命令末尾追加 `confirm` 关键字才创建（ID 仍是唯一主键，名称不去重，仅做防呆）。
- **同名比较与更新（ADL-015）**：名称 `trim` 后区分大小写精确比较；更新仅在实际改名撞到其他项目时拦截，末尾 `confirm` 可放行。已确认的重名项目更新其他字段不重复确认。
- **风险问题规则（ADL-024）**：风险与问题共用 `risk_issues` 表，创建后不可改变 `projectId` 和 `type`；删除必须带 `confirm`；项目仍有风险或问题时禁止删除。R7 暂不修改已发布的 Markdown 与整库 JSON 导出格式。
- **开发顺序（ADL-013）**：先完成 R2/R3/R4 离线能力，再做 R5 Web；R5 先卡片/区块、后独立顶级页面 spike，顶级页面不可行时按 ADL-013 降级交付。

## 六、非功能需求

- **可运行可演示**：阶段 3 每个迭代都能 `pnpm dsh web` 现场演示，附命令、退出码、页面结果等验证证据。
- **不破坏上游**：`deepseek-harness/` 只读；所有自研能力为独立外挂插件包 + 专属 profile，不改上游源码。
- **离线可用**：MVP 核心功能不配置任何 API Key 即可运行；生成型能力缺失 Key 时给出友好提示而非报错崩溃。
- **可迁移**：数据为通用 JSON/Markdown；仓库 clone 后按 README 即可复现；不依赖私有二进制格式。
- **安全**：密钥/token 不入库（`.gitignore` 覆盖）；遵循 dsh 沙箱与文件权限（存储目录 `0o700`）。
- **质量与表达**：命名规范、关键逻辑有中文注释；界面与命令输出为简体中文、术语附白话说明。

## 七、插件分包的初步设想（阶段 3 细化，开发前另行报备）

- `pm-core`：存储域与 Project/Task/Milestone 实体、schema、Markdown 渲染/导出；
- `pm-commands`：离线 `/pm` 斜杠命令；
- `pm-web`：Web 卡片/区块界面；
- `pm-tools`（**MVP 仅预留接口、不实现**，第二梯队）：供模型调用的生成型工具（智能拆解、纪要、周报），配置 `DEEPSEEK_API_KEY` 后再启用。
- 装载：独立仓库内插件包 + 专属 dsh profile（本地 `file:`/工作区依赖联调，后续可发布 npm）。

## 八、阶段 3 开工前需先验证的两个技术点（不阻塞本文档定稿）

1. 第三方插件在 dsh Web 中可达的界面形态已验证：独立包通过 `dsh.client` + `./client` 动态 bundle 注册顶级主面板与侧栏入口，无需修改上游（ADL-022）。
2. 独立仓库插件包被本地 dsh profile 成功装载的完整链路已验证（`dsh plugin` / `cordis.patch.yml` / `--dump-config`）。

## 九、补充决策（2026-10-10 项目所有者已确认，见 ADL-009）

1. **业务数据目录 `data/` 暂不纳入 git**：已在 `.gitignore` 忽略；目录由存储后端首次写入时自动创建（权限 `0o700`）。日后若需共享示例数据再单独决策。
2. **里程碑到期提醒（R11）第一版不做**：优先级调整为 P2（暂缓），MVP 严格保持最小闭环。
3. **生成型能力第一版仅预留接口、不实现**：智能 WBS 建议、会议纪要归纳、周报撰写（R8/R9 的生成部分）在 MVP 不开发，仅在架构上预留模型工具（`ctx.tools`）位置，待配置 `DEEPSEEK_API_KEY` 后于第二梯队启用。

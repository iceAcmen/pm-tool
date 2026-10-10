# 版本更新记录 changelog.md

> 本文件按时间倒序记录「每次改动动了哪些文件、新增/修改了什么、为什么」；给维护者与迁移者使用，配合 git 提交历史一起阅读。格式参考 Keep a Changelog，版本号在阶段 3 产出可用功能后启用语义化版本。

日期格式：YYYY-MM-DD。类型：新增 / 变更 / 修复 / 环境 / 文档。

> **多方协作约定**：每条变更必须标注**改动平台标识**（如 `doubao-work`、`trae`，注册表见 `docs/collaboration.md` 第二节），并写清「改了哪些文件 / 做了什么 / 为什么 / 影响范围 / 验证」。完整条目模板见 `docs/collaboration.md` 第 4.1 节。

---

## [未发布] — 离线项目新增、列表与详情及持久化验证（2026-10-10，平台：trae / TRAE）

### 改动文件
- 新增 `packages/dsh-pm-tool/src/core/project.ts`：Project zod schema、类型、中文校验提示。
- 新增 `packages/dsh-pm-tool/src/core/storage.ts`：统一 pmtool 版本 1 声明，保留 checks、新增 projects 表。
- 新增 `packages/dsh-pm-tool/src/core/projects.ts`：项目增查、短 ID、同领域新增队列、读取返回副本。
- 新增 `packages/dsh-pm-tool/src/commands/project.ts`：`/pm project add {JSON}`、`list`、`get <ID>` 解析与中文结果。
- 修改 `packages/dsh-pm-tool/src/index.ts`：接入统一领域与项目命令、帮助、句柄释放，保留参数正文大小写及 ping/selftest。
- 新增 `packages/dsh-pm-tool/scripts/verify-projects.mjs`：真实插件处理器与后端的项目增查/异常/并发/全新进程读回验证。
- 修改 `packages/dsh-pm-tool/scripts/verify-command.mjs`：强化原有自检断言并关闭领域。
- 修改 `packages/dsh-pm-tool/scripts/verify-storage.mjs`：复用统一领域定义、增加落盘断言并关闭句柄。
- 修改 `packages/dsh-pm-tool/README.md`：项目命令、字段、启动和验证说明、边界及源文件目录。
- 修改根 `README.md`、`AGENTS.md`：同步当前能力、使用入口、目录和进度。
- 修改 `docs/progress.md`、`docs/requirements.md`：R1/R4/R6 标为进行中，区分本批完成与整体待办，不改变 v0.4 验收标准。
- 修改 `docs/collaboration.md`：登记 trae 首次参与日期。
- 修改 `docs/handoff.md`、`docs/onboarding-prompt.md` 文末快照：本批结果、验证边界、接续点及提交定位。
- 修改 `docs/knowledge-base.md`：新增 KB-012（写盘前显式校验、编号与新增一起排队）、KB-013（加表兼容旧记录实测）。

### 为什么 / 背景
- 项目所有者已确认最窄纵切与逐文件清单，先落实 R1/R4/R6 的项目新增和查询部分。复用 ADL-011 定稿的 per-record 布局，不建索引，不手写业务 JSON。
- 原生 put 为插入或覆盖且写盘前不调用 zod，因此业务层显式校验，并串行执行编号分配与写入，防止并发新增覆盖。结论及源码依据立即沉淀至 KB-012。

### 影响范围
- 仅现有 dsh-pm-tool 插件增加 Host 业务能力；没有新增插件包、Skill、依赖、profile 配置或上游改动。重建插件并重启 dsh 即可生效。
- 落盘 `data/pmtool/projects/<id>.json`，保留版本 1 与旧 checks 记录，无需迁移；data/lib/node_modules 不入库。
- add 使用 JSON 参数，必填名称和两个日历日期，默认描述/负责人为空、状态 planning；系统生成 ID/时间戳。同名新增产生新项目，不提供覆盖、编辑、删除。日期不自动推算，日期间业务关系未作额外限制。
- 当前仅支持单宿主进程写入；R1 编辑、R2/R3、R4 导出与 R5 Web 后续实现。首个增量完成不代表 R1/R4/R6 整体完成。

### 验证
- 环境：macOS 15.6.1 arm64、nvm Node v22.23.3、pnpm 11.28.5；同步基线 `f9bda6e`。
- 包目录 `pnpm install`、`pnpm run build`、`node scripts/verify-projects.mjs`、`node scripts/verify-command.mjs`、`node scripts/verify-storage.mjs` 全部退出码 0。
- 项目脚本：真实命令处理器新增/列表/详情、中文输出及大小写保留、22 项错误输入拒绝且已有文件不变、默认字段、10 次并发新增不覆盖、主动模拟一次写盘失败并恢复、读取副本隔离、旧 checks 兼容、可读 JSON 与目录 0700；全新 Node 进程读回 13 个项目并继续新增第 14 个。
- 项目验证仅写独立系统临时目录（脚本打印路径并保留），原有脚本更新 data 下自检记录。未执行本批浏览器交互或完整 dsh 宿主重启验收，不将确定性脚本视为 R5 完成。
- 提交主题：`feat(项目): 实现离线项目新增与查询及持久化验证 [trae]`。仅本地提交，未推送。

## [未发布] — 新增跨平台启动提示词 SOP（onboarding-prompt）并接线强制读写（2026-10-10，平台：doubao-work）

- **背景**：项目所有者要求把「给 TRAE/其他 IDE·Agent 的启动提示词」固化进仓库，并作为所有协作平台的 SOP——开工前必读、任务完成后必更新。
- **改了哪些文件 / 做了什么**：
  - 新增 `docs/onboarding-prompt.md`：含强制 SOP、可整段复制的「标准启动提示词」（已对齐 requirements v0.4 / ADL-011 落盘布局与首个增量）、给所有者的使用说明、以及文末易变区「当前交接快照」。
  - 根 `AGENTS.md`：开工扫描清单加入该文件（必读）、收工步骤加入「更新交接快照」、文档地图新增行并把需求版本改为 v0.4。
  - `docs/collaboration.md`：第三节开工扫描、4.3 收工闭环、第八节新平台自检三处加入「开工前必读 / 收工后必更新快照 / 由所有者发送提示词」。
  - `README.md`：顶部 AI 接手提示与目录树加入该文件。
  - `docs/handoff.md`：第 0 节接手第一步与阅读顺序改为由所有者发送并先读该文件，KB 范围更新为 011。
- **为什么改**：让任意新平台无需口头交代即可无歧义接手，并把「最新交接上下文」固化为每次任务后强制维护的单一入口，落实仓库即唯一事实来源。
- **影响范围**：仅文档（新增 1 份 + 接线 4 份），不改插件代码与运行行为。

## [未发布] — 定稿业务实体落盘布局（ADL-011）并收敛过时文档（2026-10-10，平台：doubao-work）

- **背景**：trae 只读接手、停在开工报备（符合根 `AGENTS.md` 第 4 节），报告 3 处过时文档与存储路径待确认；项目所有者确认采用「单领域 per-record 扁平分表」布局并授权直接修正文档。
- **改了哪些文件 / 做了什么**：
  - `docs/requirements.md`：§5.1 落盘布局**定稿**——单一领域 `pmtool` 下 `projects`/`tasks`/`milestones` 三表、一条记录一个 JSON；**取消手工 index.json**（表可枚举）；项目 README 仅作 R4 导出；文档版本 v0.3 → v0.4，变更追溯补 ADL-011。
  - `docs/decision-log.md`：新增 **ADL-011**（落盘布局定稿，含理由与被否替代方案）。
  - `docs/knowledge-base.md`：新增 **KB-011**（`DomainTable.keys()/entries()` 同步枚举、业务实体布局与示例）。
  - `docs/feasibility-map.md`：旧服务名 `ctx.storage.domain` → **`ctx.storageDomain`**。
  - `docs/tech-plugin-scaffold.md`：修正 2 处错误启动命令 `pnpm dsh web --profile pm` → **`pnpm dsh --profile pm`**（第 94、124 行）。
  - `packages/dsh-pm-tool/README.md`：修正 1 处同样的启动命令（第 38 行），并补充「指定 profile 后不加 web 动词、token URL、`--no-open`」说明。
- **为什么改**：让接手平台拉到的文档与上游真实 API 一致、消除同一文档自相矛盾；存储布局在写业务代码前定稿，避免返工。
- **影响范围**：**仅文档**，不改插件代码与运行行为；R1–R6 业务功能仍未开始。（注：issues/knowledge-base/handover-archive 及 tech-scaffold 第 176 行中出现的错误命令是在**记录/讲解该错误**，按存档原则保留。）

## [未发布] — 建立跨平台可移植协作基座（2026-10-10，平台：doubao-work）

### 改动文件（新增）
- `AGENTS.md`（仓库根）：任何 AI/IDE 接手先读的入职说明与强制准则——项目是什么、仓库即唯一事实来源、多平台平等、当前进展、开工 SOP、文档地图、红线、环境命令、收工留痕。
- `docs/collaboration.md`：多方协作与同步权威规则——平台标识注册表、开工前 pull+扫描、改动后留痕闭环、需求/决策联动、知识沉淀模板、并发冲突处理（禁 force push）、新平台接入自检清单。
- `docs/knowledge-base.md`：技术知识库，播种 KB-001～KB-010（独立 tsc 构建、storage-domain 真实 API、存储三件套配置、离线命令注册、link 装载与自动激活、profile 叠加、裸 Cordis 确定性验证、Web 自动化边界、alpha 锁版本、Web 浏览器半侧）。
- `docs/handover-archive-doubao.md`：豆包工作阶段（立项→阶段 1→阶段 2→阶段 3 第 0 步）完整交接存档，含命令速查、ADL/ISS/提交索引、遗留待确认。

### 变更
- `README.md`：新增 Agent 入口提示与「仓库即唯一事实来源」声明；目录树补 4 份新文档；文档约定补多方协作条款。
- `docs/changelog.md`：头部增加平台标识与条目模板约定；`docs/progress.md`、`docs/handoff.md`：补协作基座与接手入口指引。

### 为什么 / 背景
- 所有者明确后续可能用 TRAE 或其他 IDE/Agent 共同修改仓库；需保证任何平台 clone 后仅凭仓库即可获得最新完整上下文、平等协作、知识可复用，不依赖任何平台私有对话或格式。

### 影响范围
- 仅新增文档与更新文档索引/约定，**不改任何代码与插件行为**；不影响已验收的第 0 步产物。后续所有平台开工/收工须遵循 `AGENTS.md` 与 `collaboration.md`。

### 验证
- 文档为纯 Markdown；链接均为仓库内相对路径；与现有六件套、决策/踩坑编号交叉一致。

---

## [未发布] — 第 0 步验收 / 推送 / 移交 Trae（2026-10-10，平台：doubao-work）

### 变更（文档）
- 第 0 步「打通验证」经项目所有者**验收通过**；`186fb34`、`9e5d539` 及本档案提交**推送至 origin/main**。
- `docs/handoff.md`：新增第 0 节「移交说明（给接手方 Trae）」——当前状态、阅读顺序、硬约束、起步动作、遗留待验证项；刷新提交与进度状态。
- `docs/progress.md`、`README.md`：状态改为第 0 步已验收并推送；阶段 3 业务编码与阶段 4 测试**移交 Trae、本侧暂停**。

### 原因
- 项目所有者决定后续编码/测试交由 Trae 执行；按「成果可迁移、自解释」约定，确保 clone 仓库即可无缝接续。

---

## [未发布] — 阶段 3 第 0 步「打通验证」（2026-10-10）

### 新增（最小可加载插件包 `packages/dsh-pm-tool/`，12 个入库文件）
- `package.json`：插件清单 `dsh-pm-tool@0.1.0`（private、ESM、`tsc` 构建、声明 `dsh.bundle.patch`）；peer 依赖固定 cordis `~4.0.5-alpha.1`、dsh-* `0.2.1-alpha.2`，运行时依赖 `zod`。
- `tsconfig.json`：独立 NodeNext/ESM 编译配置（不依赖 monorepo 的 tsconfig）。
- `src/index.ts`：插件入口——打开存储领域 `pmtool`（per-record，表 `checks`，zod 校验），注册离线斜杠命令 `/pm`（无参帮助 / `ping` 连通性自检 / `selftest` 写入并读回一条 JSON 记录）。
- `cordis.patch.yml`：组合包补丁，激活本插件（存储三件套由 base 组合包默认提供）。
- `locale/en.json`、`locale/zh.json`：插件标题/描述（中文「项目管理工作台」）。
- `README.md`：包用途、构建与 `link:` 装载命令、目录说明。
- `.gitignore`：忽略构建产物 `lib/` 与 `node_modules/`。
- `scripts/verify-storage.mjs`、`scripts/verify-command.mjs`：可重复的离线验证脚本（真实 Cordis + 真实 storage-json，直接运行已构建插件的 apply 与命令处理器）。
- `pnpm-lock.yaml`、`pnpm-workspace.yaml`：锁定依赖版本与 pnpm11 供应链策略（`minimumReleaseAgeExclude` 收录 alpha 包），保证可复现安装。

### 环境/配置（本机，不入库）
- 基于 web 模板派生专属 profile `pm`（`~/.dsh/profiles/pm`）；以 `link:` 绝对路径装入本插件并自动激活。
- 在 `~/.dsh/profiles/pm/cordis.patch.yml` 按 id `storage-json` 覆盖 `root` 为 `/Users/bytedance/Projects/dsh-pm/pm-tool/data`（业务数据目录，已被仓库 `.gitignore` 忽略）。

### 变更（文档）
- `docs/tech-plugin-scaffold.md`：回填第 0 步实测结果，7 项【待验证】给出结论（仅剩「第三方独立顶级 Web 页面」留待业务阶段）。
- `docs/decision-log.md`：新增 ADL-010（第 0 步装载/存储实测结论）。
- `docs/issues-and-solutions.md`：新增 ISS-005～ISS-008（put 异步需 await、裸上下文 effect 不触发、CLI 参数顺序、link peer 警告的判定）。
- `docs/progress.md`、`docs/handoff.md`、`README.md`：同步第 0 步进度、交接信息与目录树。

### 修复
- `src/index.ts`：`table.put()` 为异步写盘，命令处理器改为 `async` 并 `await put` 后再读回（初版漏 await 导致记录不落地）。

### 验证证据
- `pnpm dsh --profile pm --dump-config` 可见 `pm-tool` 与存储三件套，root 指向 `pm-tool/data`。
- 启动日志出现 `[pm-tool] 存储领域 pmtool 已打开`；Web 斜杠命令目录列出 `pm`，`/pm ping` 无 Key 返回中文 pong（有截图）。
- `node scripts/verify-command.mjs` 退出码 0：真实插件处理器跑通 ping 与 selftest，生成 `pm-tool/data/pmtool/checks/selftest.json`（人类可读、目录 0700）。

### 原因
- 开发者预览期外部插件装载链路有不确定点，先用最小插件端到端打通「独立仓库插件 → 被本地源码版 dsh 装载 → 离线命令可用 → 可读 JSON 落盘到产品目录」，再写业务功能，确保后续每步可跑可演示。

---

## [未发布] — 阶段 3 源码开发（启动，2026-10-10）

### 新增
- `docs/tech-plugin-scaffold.md`：阶段 3 开工前报备的「外部插件骨架与装载方案」——单一插件包 `packages/dsh-pm-tool/` 的文件树、storage-domain 真实 API、`link:` + 专属 profile 装载六步、影响范围、待验证清单与第 0 步验收标准。

### 原因
- 开发者预览期外部插件装载链路存在不确定点，先打通"最小插件（/pm ping + 存储自检）"再写业务功能，确保每步可跑可演示；本提交仅为方案文档，未写代码。

---

## [未发布] — 阶段 2 需求分析（2026-10-10）

### 新增
- `docs/feasibility-map.md`：dsh 现有能力 → PM 工具需求的「复用 vs 新建」可行性地图（含存储、Web UI、工具/命令、离线能力、插件装载、来源与置信度）。
- `docs/requirements.md` 升级为阶段 2 评审稿 v0.2：纳入四项已确认决策（离线优先混合模型 / 可读 JSON+Markdown 存储 / 先做 Web / 最小闭环 MVP）、R1–R12 模块与可测试验收标准、Project/Task/Milestone 数据模型、数据落盘目录约定与业务规则、非功能需求、插件分包设想。
- `docs/decision-log.md`：新增 ADL-007（需求四项产品决策）、ADL-008（MVP 技术架构路线）。

### 变更
- `docs/progress.md`：进入阶段 2，记录需求关键决策与可行性调研结论。
- `README.md`：文档索引/目录树补充 `docs/feasibility-map.md`。

### 补充（评审 v0.3，同日，依据 ADL-009）
- `.gitignore`：忽略业务数据目录 `data/`（暂不纳入 git，首次写入时自动创建）。
- `docs/requirements.md`：升级 v0.3——`data/` 不入库；里程碑提醒 R11 降为 P2（暂缓）；生成型能力 MVP 仅预留接口不实现；第九节改为「补充决策」。
- `docs/decision-log.md`：新增 ADL-009（三项补充决策）。

### 原因
- 阶段 2 需在写代码前定稿「做什么、怎么验收、站在 dsh 哪些能力上做」，并把决策与依据沉淀为可迁移档案；本阶段不产生代码。

---

## [未发布] — 阶段 1 环境搭建（2026-10-10）

### 环境
- 新增：安装 nvm（`~/.nvm`）、Node.js v22.23.3、npm 10.9.9；通过 corepack 启用 pnpm 11.28.5；向 `~/.zshrc` 追加 nvm 初始化。
- 新增：在 `~/Projects/dsh-pm/deepseek-harness` 浅克隆（depth=1，分支 master）dsh 上游源码，基线版本 v0.2.1-alpha.2（提交 `d743267388641bc76f17c45ce8b4c231aed1d32c`）。
- 完成：上游依赖 `pnpm install`（354 个工作区项目，约 1m17s，原生模块 postinstall 正常，退出码 0）。
- 完成：`pnpm run build`（原生 addon + host + 357 个 client 产物，退出码 0）。
- 完成：运行验证 `pnpm dsh web --no-open`，http://127.0.0.1:3080 启动；带一次性令牌认证后根路径 HTTP 200，页面标题 `DSH Local Build`、含 `id="root"` 与 `/assets/index-*.js`；验证后已关闭服务。
- 新增：生成 GitHub SSH ed25519 密钥；配置仓库级提交身份 Ice \<835687152@qq.com\>（不改全局）；配置远程 `git@github.com:iceAcmen/pm-tool.git`。
- 完成：项目所有者将公钥添加到 GitHub 账户 iceAcmen，`ssh -T git@github.com` 认证通过；首次提交 `12bcad3` 并 `git push -u origin main` 成功，main 跟踪 origin/main。

### 文档（本仓库 pm-tool）
- 新增：`README.md`（项目总入口、目录结构、环境依赖与启动方式）。
- 新增：`.gitignore`（忽略依赖、构建产物、密钥与系统文件）。
- 新增：`docs/requirements.md`（功能模块清单 / 优先级 / 验收标准，阶段 1 草稿）。
- 新增：`docs/decision-log.md`（ADL-001 ~ ADL-006 技术决策）。
- 新增：`docs/changelog.md`（本文件）。
- 新增：`docs/progress.md`（阶段进度流水）。
- 新增：`docs/issues-and-solutions.md`（踩坑与解决方案）。
- 新增：`docs/handoff.md`（最小迁移交接清单）。
- 新增：`skills/README.md`（Skill 沉淀目录说明）。
- 新增：`packages/.gitkeep`（占位，保留自研插件目录）。

### 原因
- 落实「从第一天起建立独立、通用、可迁移的标准 Markdown + git 成果档案」要求，档案与环境搭建同步建立。

### 尚未完成 / 已知限制
- 阶段 1 已全部完成并推送；仅待项目所有者确认后进入阶段 2 需求分析。
- dsh 处于开发者预览期（v0.2.1-alpha.2），后续升级可能有破坏性变更，已记录基线以便复现。
- 上游为浅克隆（depth=1），如需完整历史需 `git fetch --unshallow`。
- 尚未产生任何自研插件代码（属阶段 3）。

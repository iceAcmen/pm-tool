# 版本更新记录 changelog.md

> 本文件按时间倒序记录「每次改动动了哪些文件、新增/修改了什么、为什么」；给维护者与迁移者使用，配合 git 提交历史一起阅读。格式参考 Keep a Changelog，版本号在阶段 3 产出可用功能后启用语义化版本。

日期格式：YYYY-MM-DD。类型：新增 / 变更 / 修复 / 环境 / 文档。

---

## [未发布] — 第 0 步验收 / 推送 / 移交 Trae（2026-10-10）

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

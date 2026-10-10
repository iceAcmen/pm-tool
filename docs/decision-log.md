# 技术决策日志 decision-log.md

> 本文件按时间记录每个重要技术/方案决策「决定了什么、为什么、有哪些替代方案、最终结果」；给后续维护与迁移者使用，遇到「为什么当初这么做」时来这里查。每条决策不可删改，只可被新决策 supersede（取代）。

记录格式：`编号 | 日期 | 标题 | 决策 | 理由 | 替代方案 | 最终结果/状态`

---

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

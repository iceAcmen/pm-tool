# 工作进度流水账 progress.md

> 本文件记录项目「每个阶段已完成、进行中、待办」的最新状态；给维护者与迁移者快速判断进度使用。每次有进展即更新，最新内容置顶。

最后更新：2026-10-10（doubao-work 实现并通过验证 R10 交付物台账）

## 当前阶段：v0.1.0 后续迭代，R1–R10 已完成，下一步 R12 / R11 取舍（2026-10-10）

- **R10 已实现并通过验证（doubao-work）**：pmtool 领域新增 `deliverables` 表（id `dlv-NNNN`，字段名称/版本/负责人/状态/位置/计划交付日期/说明 + 内嵌只增 `history[]`）；离线 `/pm deliverable add/list/get/update/delete`，状态四态 planned/in_progress/submitted/accepted，状态或版本变化自动留痕（可带操作人与说明），有交付物的项目禁止删除；Web 新增「交付物」标签（筛选/搜索/台账表格/编辑抽屉/变更时间线/项目栏计数）。dsh 原生 deliverables 绑定 agent 轮次不适用离线台账，按 ADL-028 复用概念、数据层自研。
- **R10 验证通过**：冻结安装干净、构建退出码 0（client bundle 140.47 kB）、**11 个** verify 全部退出码 0（新增 verify-deliverables.mjs，含留痕规则、并发、失败恢复、删除保护、权限、全新进程读回续号）；隔离 DSH_HOME + 无 Key 真实宿主启动并抓到运行中 bundle 断言含 R10 界面；业务数据与上游零改动。本机浏览器目视项以所有者手动确认为准（KB-014）。
- **R9 已独立复核并推送（doubao-work）**：冻结安装、构建、十项 verify 全部退出码 0；隔离 DSH_HOME + 隔离数据 + 随机端口 + 无 Key 真实宿主启动成功（存储领域打开、带 token 200/无 token 401、启动清单与运行中下发 bundle 含 R9 界面）；未改业务代码原样接收；本机浏览器目视项边界见 KB-014。
- **R9 已实现（trae）**：自定义日期范围生成固定快照，保存任务/里程碑/会议摘要、周期事件和五类异常；支持人工摘要更新、确认删除及精简 Markdown 导出。
- **R9 Web 已实现**：新增进度汇报表格、筛选、搜索、生成/编辑抽屉、固定快照和异常详情。
- **R9 完整回归通过**：冻结安装、构建和十个验证脚本均退出码 0；隔离 profile 真实浏览器证明旧快照不随任务变化、新快照反映最新状态，编辑、导出、主题、786px 窄屏和重启读回通过。
- **R8 已实现**：会议和稳定行动项离线 CRUD、筛选、排序、任务/问题关联及跨表删除保护完成；未来 promote 所需 `taskId` 和稳定行动项 ID 已保留。
- **R8 Web 已实现**：新增会议表格、状态筛选、搜索、完成统计，以及会议和行动项右侧抽屉。
- **R8 完整回归通过**：冻结安装、构建和九个验证脚本均退出码 0；隔离 profile 真实浏览器新增、关联、完成、筛选、深色主题、786px 窄屏和重启读回通过。
- **R8 手动验收通过**：项目所有者确认行动项布局和“保存会议”联动保存修复有效，并授权本批提交与推送。
- **R7 已实现**：风险与问题共用 `risk_issues` 表，离线命令支持增查改删、关闭及类型/状态筛选；项目仍有记录时禁止删除。
- **R7 Web 已实现**：项目工作台新增“风险与问题”高密度表格、搜索、类型/状态筛选和右侧新增/编辑抽屉，无 API Key 可用。
- **R7 完整回归通过**：冻结锁文件离线安装、构建及八个 `verify-*.mjs` 均退出码 0；专项覆盖并发、故障恢复、权限和全新进程读回。
- **R7 真实浏览器通过**：隔离数据完成风险/问题新增、问题关闭、筛选、搜索、确认删除及重启读回；786px 窄屏局部滚动、浅/深主题和控制台/网络检查均正常。
- **R7 版本控制状态**：项目所有者手动验证通过，并已明确授权本批提交和推送。
- **R5 已实现**：外部 `clientBundle` 注册 dsh 顶级“项目管理”面板和侧栏入口；项目列表/详情、项目新建/编辑/删除、WBS 新建/完成切换/删除、里程碑新建/达成/删除均复用 Host 命令，无 API Key 可用。
- **R5 手动验收已通过**：2026-10-10 项目所有者确认验收通过；保留高密度任务/里程碑表格和右侧编辑抽屉，颜色、字体、字号及主要圆角跟随 dsh 原生主题。
- **主题专项验证**：真实浏览器通过宿主设置切换浅色并恢复跟随系统，表格和抽屉同步变化，730px 根容器无溢出；构建及全部七个验证脚本退出码 0。
- **独立页面 spike 已通过**：pm profile 的 `__DSH_BOOT__` roster 包含 `dsh-pm-tool/client.js`，不需要设置卡片降级，也未修改上游。
- **真实浏览器自动验证通过**：三类视图、任务新增与清理、右侧抽屉和 725px 工作区正常；表格局部横向滚动，整页无横向溢出，控制台无当前构建错误。
- **全量回归通过**：`pnpm run build` 与 command/export/milestones/projects/storage/tasks/web 七个 verify 脚本均退出码 0；故障日志均为既有主动负例。
- **阶段 4 MVP 交付完成**：新增 `docs/test-cases.md` 与 `docs/delivery.md`，整理 R1–R6 测试矩阵、手动验收、安装启动、演示、备份和已知限制。
- **交付级验证通过**：Node v22.23.3 / pnpm 11.28.5；冻结锁文件离线安装、构建、七个验证脚本、profile 配置检查均退出码 0；隔离 profile 真实启动成功，页面 HTTP 200 且 boot roster 包含 `dsh-pm-tool/client.js`。
- **v0.1.0 发布**：项目所有者授权创建 Git tag 与发布记录；发布说明见 `docs/releases/v0.1.0.md`，发布决策见 ADL-023。
- **授权状态**：本次授权仅覆盖 v0.1.0 发布提交、普通推送和 tag 推送；后续版本控制动作恢复分别确认。

### 🧭 跨平台协作基座（2026-10-10 新增，已就绪）
- 根 `AGENTS.md`（任何 AI/IDE 接手先读）、`docs/collaboration.md`（多方同步规则 + 平台标识）、`docs/knowledge-base.md`（KB-001～010 已验证知识）、`docs/handover-archive-doubao.md`（豆包阶段完整存档）。
- 约定：仓库即唯一事实来源；任何平台开工前先 pull + 扫描 `docs/` 最新档案，改动后在 `changelog.md` 标注平台标识并同步需求/决策/踩坑/知识；禁 force push。
- 接手平台不局限于 TRAE：新平台首次接入按 `docs/collaboration.md` 第八节自检并登记平台标识。

### ✅ 阶段 3 第 0 步已完成（最小插件端到端打通）
- 在独立仓库新建最小插件包 `packages/dsh-pm-tool/`（`/pm` 离线命令 + 存储领域 `pmtool`），`pnpm install` 与 `tsc` 构建一次通过。
- 基于 web 模板派生专属 profile `pm`，以 `link:` 绝对路径装入插件并自动激活；`--dump-config` 可见插件与存储三件套。
- profile 补丁把 storage-json 的 `root` 覆盖到产品目录 `pm-tool/data`（已 gitignore）；启动日志打印 `[pm-tool] 存储领域 pmtool 已打开`，宿主自身数据也写入该目录。
- Web 斜杠命令目录列出 `pm`，无 API Key 执行 `/pm ping` 返回中文 pong（有截图）。
- 两个确定性脚本（`scripts/verify-storage.mjs`、`scripts/verify-command.mjs`）直接运行已构建插件的真实代码：selftest 写入并读回 `pm-tool/data/pmtool/checks/selftest.json`（人类可读、目录 0700）。
- 实测发现并修复真实 bug：`table.put()` 异步写盘漏 `await`（处理器改为 async）。
- 已提交（`9e5d539`）并经项目所有者**验收通过、推送 origin/main**；随后补 `41b9db5` 说明验收/推送与移交。
- **后续阶段 3 业务编码与阶段 4 测试移交 TRAE 或其他 IDE/Agent 执行，本侧暂停**；接手导引见根 `AGENTS.md` 与 `docs/handoff.md` 第 0 节。

### ✅ 阶段 3 业务功能（R1–R9 已完成）
- 按需求 **v0.7** 实现项目计划 R1 / WBS R2 / 里程碑 R3 / 持久化与 Markdown 导出 R4 / Web 界面 R5 / 离线命令 R6 / 风险与问题 R7 / 会议纪要 R8 / 进度汇报 R9。
- **落盘布局已定稿并扩展（ADL-011/024）**：单领域 `pmtool` 分表 per-record、不建 index.json；projects/tasks/milestones/risk_issues 均已实现，checks 保留。
- 第三方独立顶级 Web 页面与外部包浏览器构建已按 ADL-022 实测打通。

---

## 阶段 2 需求分析（✅ 已定稿 v0.3 并获确认、已推送）

### ✅ 已完成
- 完成 dsh 能力可行性调研（本地官方源码 + 官方 cookbook/包 README 双路印证），沉淀 `docs/feasibility-map.md`。
- 经项目所有者交互确认四项关键决策（见 ADL-007）：离线优先混合模型、人类可读 JSON+Markdown 存储、先做 dsh Web 界面、最小闭环 MVP。
- 确定 MVP 技术架构（见 ADL-008）：`storage-domain` + `storage-json` 落盘、用户命令（离线）/模型工具（在线）双入口、独立插件包 + 专属 profile。
- 产出需求评审稿 v0.3：R1–R12 模块与可测试验收标准、Project/Task/Milestone 数据模型、数据落盘目录约定与业务规则、非功能需求。
- 项目所有者确认三项补充决策（ADL-009）：`data/` 暂不入库（已写入 `.gitignore`）、里程碑到期提醒暂缓（R11→P2）、生成型能力一期仅预留接口不实现。
- 需求 v0.3 经项目所有者确认定稿；`docs/handoff.md` 已刷新；阶段 2 文档提交并推送 GitHub。

---

## 阶段 1 环境搭建（✅ 已完成）

### ✅ 已完成
- 核实 dsh 官方仓库、技术栈、安装要求与插件架构（官方来源交叉验证，见 ADL-001）。
- 本机只读环境摸底：macOS 15.6.1 arm64、git 2.39.5；原仅 Doubao 自带 Node、无 pnpm/Homebrew。
- 经项目所有者确认 4 项关键决策：目录、独立仓库策略、nvm 安装方式、第一阶段接远程。
- 安装 nvm + Node v22.23.3 + corepack/pnpm 11.28.5，配置 `~/.zshrc`（见 ISS-001/ISS-004）。
- 创建工作区 `~/Projects/dsh-pm/`；浅克隆上游 dsh **v0.2.1-alpha.2**（基线哈希 `d743267388641bc76f17c45ce8b4c231aed1d32c`，分支 master）。
- `pnpm install` 成功（354 个工作区项目，约 1m17s，原生模块正常）。
- `pnpm run build` 成功（原生 addon + host + 357 个 client 产物，退出码 0）。
- 运行验证通过：`pnpm dsh web` 在 http://127.0.0.1:3080 启动，带令牌认证后根路径 HTTP 200、页面 `DSH Local Build` 正常返回；验证后已关闭服务。
- 初始化本产品独立 git 仓库 `pm-tool`（默认分支 main），建立完整标准档案（README/docs/skills/packages）。
- 生成 GitHub SSH 密钥并由项目所有者添加到账户 iceAcmen，`ssh -T git@github.com` 认证通过。
- 配置仓库级提交身份 Ice \<835687152@qq.com\>（未改全局）；首次提交 `12bcad3` 并推送 main 到 `git@github.com:iceAcmen/pm-tool.git`，跟踪 origin/main。

## 后续任务
- R9 已由 doubao-work 独立复核通过并提交推送；项目所有者可在本机 `pnpm dsh --profile pm web` 做最终目视确认（主题/窄屏）。
- 下一优先项 **R10 交付物管理**（doubao-work 接续）：先核对 dsh `deliverables`（present/workspace-changes/ui-deliverables）可复用边界，再补项目维度交付物台账。
- 其后 R12（多项目切换/检索/统计、Markdown 任务表导入；多人协作裁剪）；R11 里程碑提醒与生成型能力的取舍见 decision-log。
- 上游 dsh 升级前按 `docs/test-cases.md` 执行完整兼容性回归。

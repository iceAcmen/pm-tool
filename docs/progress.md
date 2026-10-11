# 工作进度流水账 progress.md

> 本文件记录项目「每个阶段已完成、进行中、待办」的最新状态；给维护者与迁移者快速判断进度使用。每次有进展即更新，最新内容置顶。

最后更新：2026-10-11（doubao-work 生成型功能正式立项：设计评审稿 generative-features-plan.md + ADL-036 + R13/R14/R15 拟新增；随后按里程碑逐个实现）

## 当前阶段：生成型功能（R13/R14/R15）立项并开工（2026-10-11，doubao-work）

- **已立项（ADL-036）**：智能 WBS 拆解（R13）、进度汇报 AI 叙述（R14）、会议纪要归纳（R15）。统一原则：LLM 只做一次性文本生成、不依赖 function calling；确定性采集/校验/落盘在我方代码；AI 输出一律草稿、confirm 才入库；无 key/失败优雅降级；每次生成只发一次模型请求省免费额度。
- **设计评审稿**：`docs/generative-features-plan.md`（一次性 LLM 调用真实 API 骨架、落点复用、降级、推荐开发顺序、文件级计划）。
- **推荐开发顺序**：智能 WBS（最复用 task-import 链路、风险最低）→ 进度汇报叙述（最安全）→ 会议纪要归纳（JSON 解析最复杂）。
- **状态**：本批为立项设计 + 档案，尚未编码；持续授权内按里程碑逐个实现并各自提交。

## 上一阶段：零成本模型通道就绪（2026-10-11）

- **零成本 OpenRouter 免费 LLM 通道已配置（doubao-work，ADL-035）**：通过已随 base bundle 装载的 `@deepseek-ai/dsh-llm-pi-ai`（原本零路由休眠、无需新装），在本机 `~/.dsh/profiles/pm/cordis.patch.yml` 按 id 补上 `providers.openrouter-free` → OpenRouter 免费自动路由模型 `openrouter/free`（Free Models Router，OpenAI 兼容 `https://openrouter.ai/api/v1`，`api=openai-completions`，`apiKeyEnv=OPENROUTER_API_KEY`）。**key 不入库、不写 patch**，只引用环境变量。
- **本批不实现任何生成型业务功能**：智能 WBS/纪要/周报仍按 ADL-032 暂缓；本批只做「通道配置 + 可移植文档 `docs/model-providers.md` + 加载验证」。DeepSeek 官方/OpenAI/Anthropic/Gemini/Groq/硅基流动/智谱/百炼/本地 Ollama 以注释 YAML 模板预留，当前全部不启用。
- **本批验证（全部无 Key）**：`pnpm install --frozen-lockfile` 干净、`pnpm run build` 退出码 0（client bundle 153.00 kB）、**12 个** verify 全 0、`git diff --check` 干净；`--dump-config` 退出码 0 且 `providers.openrouter-free` 出现、storage-json root 与 dsh-pm-tool 完好；无 Key 真实宿主启动（随机端口、`[pm-tool] 存储领域 pmtool 已打开`、无 pi-ai/openrouter 报错），运行中下发 `plugins/??dsh-pm-tool/client.js` bundle HTTP 200（153033 B、含 pm 界面串；无 cookie 401）。
- **key 已配置、端点已实测（2026-10-11 更新）**：key 已由所有者写在其本机 `~/.zshrc`（仓库外、不入库；改前已备份 `~/.zshrc.bak-20261011-130537`）。所有者本机直连实测：`GET /v1/key` 返回 `is_free_tier: true`、`free_model_daily_requests.limit=50`；`POST /v1/chat/completions`（`model=openrouter/free`）两次真实调用均成功、`cost=$0`、`finish_reason=stop`（随机落到 `liquid/lfm-2.5-2.6b:free`、`nvidia/nemotron-3-ultra-550b-a55b:free`）。经验沉淀见 KB-034（推理型模型先吃满 reasoning tokens，`max_tokens` 要给足 ≥400）。
- **应用内已实测打通（2026-10-11 更新）**：所有者在 dsh 网页底部模型选择器选 **Free Models Router**（openrouter-free/openrouter/free）发「你好，用一句话介绍你自己」，**第 1 次即成功**（puppeteer-core + 系统 Chrome 139 无头，KB-032）：助手正常回复、状态「已完成」、无 MISSING_CREDENTIAL/401/429（约 9.5K tok；免费档按次计费不按 token）。
- **踩到并已解的坑**：首次发消息曾报 `MISSING_CREDENTIAL`（“OPENROUTER_API_KEY which is not set”）——根因是当时 dsh 进程由「写 key 之前的旧终端」启动、进程环境无该变量；停旧进程、用已 `source ~/.zshrc` 的环境重启即解（详见 KB-035 / ISS-024；永久做法是在 Web「设置→模型」页把密钥录进 credentials service）。
- **本批决策/知识沉淀**：ADL-035、KB-033（llm-pi-ai 第三方 OpenAI 兼容端点配置 + profile 按 id 外挂 + apiKeyEnv 不入库、不自动读 .env）、KB-034（openrouter/free 免费自动路由实测行为）、KB-035/ISS-024（MISSING_CREDENTIAL 排查：进程环境 vs credentials service）。

## 上一批：Chrome 真实浏览器自动目视闭环 + 窄屏标签修复 + 浏览器/上游兼容决策（2026-10-11）

- **Chrome 真实浏览器自动目视闭环（doubao-work）**：按 KB-032 用 puppeteer-core 25.13 驱动本机已装 Google Chrome 139（headless，不另装 Chromium、不要系统辅助功能授权）。隔离 DSH_HOME（ISS-019）+ 覆盖每类实体的富种子 + 随机端口 + 无 Key 启动真实宿主，对 R5 面板/R7/R8/R9/R10/R12 做真实点击：七个 ViewTab 逐屏渲染、项目切换、总览看板统计数值（项目总数 2 / 完成率 40% / 逾期 1 / 未关闭风险 4，与种子一致）、全局搜索跨类分组命中、新增交付物→编辑抽屉→删除确认弹窗取消/confirm 删除、浅色与深色对比可读、786px 与 390px 整页无横向溢出。**27/27 用例通过，0 console error / 0 pageerror / 0 失败请求 / 0 同源 4xx-5xx**。
- **本批唯一代码改动**：`client/panel.css` `.pm-view-tab` 加 `white-space:nowrap; flex:0 0 auto`，修复 390px 窄屏视图标签中文逐字断行，改为标签单行、标签条内部横滚。
- **本批验证**：`pnpm install --frozen-lockfile` 干净、`pnpm run build` 退出码 0（client bundle 153.00 kB）、**12 个** verify 全部退出码 0、`git diff --check` 干净。
- **本批决策/知识沉淀**：ADL-033（浏览器兼容仅 Chrome，Safari/Firefox 本期不支持）、ADL-034（上游 dsh 新版本：peer 锁 v0.2.1-alpha.2 + profile link 装载 + 升级冒烟流程）、KB-032（puppeteer-core + 系统 Chrome headless 自动目视法）。截图存 `.tmp/ui-verify/shots/`（gitignored）。
- **暂缓项仍不变**：R11 里程碑提醒与生成型能力、多人实时协作、Excel 导入继续暂缓/裁剪（ADL-030/031/032）。

- **R12 已实现并通过验证（doubao-work）**：新增只读全库关键字检索 `/pm search <关键字> [--type ...]`（七类实体不区分大小写子串、按类型分组）与只读统计看板 `/pm stats [项目ID]`（项目状态计数、任务完成率、逾期、未关闭风险按严重度、交付物四态）；新增 Markdown 任务表离线导入 `/pm task import <项目ID> <清单.md> [confirm]`（GitHub 缩进勾选清单还原 WBS，`[x]` 记已完成，dry-run 不写盘）。Web 顶部新增「总览看板」，基于最新 snapshot 在浏览器端派生跨项目统计卡片、逐项目明细与全局搜索，不新增宿主路由、配色只用宿主 token。检索/看板不新增表、领域版本仍为 1（ADL-029）。
- **R12 验证通过**：冻结安装干净、构建退出码 0（client bundle 152.96 kB）、**12 个** verify 全部退出码 0（新增 verify-r12.mjs，含跨类/类型过滤、统计口径、导入 dry-run vs confirm、缩进→WBS、负例与全新进程读回；verify-web.mjs 扩展 R12 界面串/`.pm-board` 契约）；`git diff --check` 干净；隔离 DSH_HOME + 隔离数据 + 随机端口 + 无 Key 真实宿主启动，存储领域打开、cookie 鉴权，抓取含 dsh-pm-tool 的合并 bundle（HTTP 200）断言含「总览看板/跨项目搜索/项目总数/任务完成率/逐项目明细」。本机浏览器目视项以所有者手动确认为准（KB-014）。
- **R12 裁剪与暂缓结论**：Excel 导入（依赖 skill-office/LibreOffice，ADL-030）、多人实时协作（与单用户本地定位冲突，ADL-031）本期不做；R11 里程碑提醒与智能 WBS/纪要/周报等生成型能力（依赖常驻调度与 API Key）继续暂缓（ADL-032），需求中如实保留为「暂缓/裁剪」。
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
- R12 已由 doubao-work 实现、验证并随提交推送；项目所有者可在本机 `pnpm dsh --profile pm`（指定 profile 后**不再加 web 动词**，否则报 "too many arguments"，见 ISS-007）打开顶部「总览看板」做最终目视确认（卡片、全局搜索、窄屏）。
- 剩余需求均已决策暂缓/裁剪：R11 里程碑提醒与生成型能力（ADL-032）、多人实时协作（ADL-031）、Excel 导入（ADL-030）。其中生成型能力的**模型通道已就绪**：OpenRouter 免费自动路由 `openrouter/free` 已配置并直连实测通过（$0，ADL-035/KB-034，key 在所有者本机 ~/.zshrc、不入库）；是否正式立项开发智能 WBS/纪要/周报，待项目所有者决定。
- 上游 dsh 升级前按 `docs/test-cases.md` 执行完整兼容性回归。

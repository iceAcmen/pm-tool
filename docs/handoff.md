# 最小迁移交接清单 handoff.md

> 本文件是「换一个人或换一个软件接续本项目所需的最小信息集」；在每个阶段收尾或项目所有者要求时刷新。接手者按本清单即可恢复环境、定位进度、知道下一步做什么。

最后更新：2026-10-11（doubao-work 第一档离线增强 R16/R17/R18 已实现：/pm due 临期逾期提醒、meeting action promote 行动项转任务、/pm backup·restore 七实体备份恢复含恢复前安全快照；新增 ADL-039/040/041、docs/backup-sync.md）

---

## 0. 移交说明（给接手方：TRAE 或其他 IDE / Agent / 同事）

> 接手第一步：项目所有者把 **`docs/onboarding-prompt.md`** 的「标准启动提示词」整段发给新 Agent；Agent 先读该文件（含文末「当前交接快照」）与仓库根 **`AGENTS.md`**（入职说明与强制准则），再按 `docs/collaboration.md` 完成「新平台首次接入自检」并登记平台标识；本节为其补充。

- **当前状态（本批，2026-10-11 doubao-work）**：无新增业务功能，做的是**零成本模型通道就绪**。按 ADL-035 用已随 base bundle 装载的 `@deepseek-ai/dsh-llm-pi-ai`，在仓库外 `~/.dsh/profiles/pm/cordis.patch.yml` 按 id 追加 `providers.openrouter-free` → OpenRouter 免费自动路由模型 `openrouter/free`（OpenAI 兼容端点，`apiKeyEnv=OPENROUTER_API_KEY`，key 不入库）。新增可移植文档 `docs/model-providers.md`（含 9 家预留但不启用的官方厂商模板、开通验证 curl）。12 项 verify + build + `--dump-config` + 无 Key 真实宿主 bundle 断言全绿。**key 已由所有者配置在本机 `~/.zshrc`（仓库外、不入库），openrouter/free 直连与 dsh 应用内对话均已于 2026-10-11 实测成功**（应用内底部模型选择器选 Free Models Router 发「你好」第 1 次即通、无 MISSING_CREDENTIAL/401/429；详见 KB-034）。期间踩过一次 `MISSING_CREDENTIAL`——旧 dsh 进程未继承新环境变量，重启即解（KB-035 / ISS-024，永久做法是在 Web「设置→模型」页把密钥录进 credentials service）。**至此模型通道（配置+直连+应用内）全部打通**；生成型业务功能（智能 WBS/纪要/周报）仍按 ADL-032 暂缓、是否立项待所有者决定。
- **上一批状态**：R1–R12 已完成。此前一批（doubao-work）做的是**验收手段升级**：按 KB-032 用 puppeteer-core 驱动本机已装 Chrome 139（headless、不另装 Chromium、不要辅助功能授权），在隔离 DSH_HOME + 富种子 + 随机端口 + 无 Key 的真实宿主上对 R5/R7–R12 做了**真实点击/截图/浅深色/786/390 窄屏/控制台网络**自动目视，27/27 通过、0 console error/pageerror/失败请求。仅一处 CSS 微调（窄屏视图标签单行横滚）。12 项 verify + build + git diff --check 全绿。浏览器兼容按 ADL-033 仅承诺 Chrome；上游 dsh 新版本按 ADL-034 的 peer 锁定 + 升级冒烟处理。R11 里程碑提醒与生成型能力、多人实时协作、Excel 导入仍按决策暂缓/裁剪。
- **协作模式**：仓库是唯一事实来源，TRAE、豆包工作等多平台**地位平等、去中心化**；开工前先 `git pull --ff-only` 并扫描最新档案，改动后在 `changelog.md` 标注平台标识并同步知识/决策（细则见 `docs/collaboration.md`）。
- **建议阅读顺序**（均为本仓库标准中文 Markdown，自解释）：
  0. `docs/onboarding-prompt.md`（**启动提示词 + 当前交接快照**）、根 `AGENTS.md` 与 `docs/collaboration.md`（**接手准则与同步规则，最先读**）
  1. `README.md`（总览、目录、启动方式）
  2. `docs/requirements.md` **v0.8**（**做什么、验收标准、当前实体模型（含 4.7 交付物）、§5.1 落盘布局**——开发主依据）
  3. `docs/feasibility-map.md`（dsh 哪些能力复用/新建）
  4. `docs/tech-plugin-scaffold.md`（**怎么挂插件、真实 API、第 0 步实测结论**——开发主依据，重点读文末附节）
  5. `docs/knowledge-base.md`（已验证 API/模式/约定，当前至 KB-031）与 `docs/issues-and-solutions.md`（当前至 ISS-023）
  6. `docs/decision-log.md`（当前至 ADL-032；ADL-029 为 R12 只读派生方案，ADL-030/031/032 为 Excel 导入/多人协作/R11 生成型暂缓决策）
  7. `docs/handover-archive-doubao.md`（豆包工作阶段完整来龙去脉，需要背景时读）
  8. 本文件（环境恢复、装载/验证命令、下一步）
- **硬约束（来自项目所有者，务必遵守）**：
  - 上游 `~/Projects/dsh-pm/deepseek-harness/` **只读**，所有功能以独立仓库 `pm-tool/packages/` 内的外挂插件实现，不改上游一行；
  - 离线优先：核心增删改查走 `ctx.commands`（无 Key 可用），生成型能力一期仅预留接口；
  - 数据落人类可读 JSON（storage-domain + storage-json，root=`pm-tool/data`，**`data/` 不入库**）；
  - 里程碑到期提醒 R11 **第一版不做**；
  - 每次改代码前先说明「改哪个文件/为什么/影响范围」，删除、全局配置、对外推送先征得同意；每阶段更新 docs 并做清晰提交。
- **起步动作**：按第 3 节运行构建与全部 verify 脚本；启动 pm profile 后手动验收侧栏“项目管理”及项目/WBS/里程碑/风险问题操作。
- 第三方插件**独立顶级 Web 页面**已按 ADL-022 验证，不再是遗留技术项。

---

## 1. 仓库地址与分支

| 项 | 值 |
|---|---|
| 本产品仓库（核心成果）远程地址 | **`git@github.com:iceAcmen/pm-tool.git`**（GitHub，SSH，分支 `main`） |
| 本产品仓库本地路径 | `~/Projects/dsh-pm/pm-tool/`（main 工作区；正常情况下与 origin/main 一致，`git pull --ff-only` 后开工） |
| 首次提交 | `12bcad3` —— "chore: 阶段1 环境搭建与项目档案初始化" |
| 阶段 2 提交 | `70815a0`（需求 v0.2 + 可行性地图）、`54767e1`（需求 v0.3 + ADL-009）、`e7211c1`（阶段 2 收尾） |
| 阶段 3/4 发布 | R5 主功能 `9bce006`，原生主题工作台 `9487c24`，测试交付 `71b4212`；正式版本以 tag `v0.1.0` 为准 |
| dsh 专属 profile | `~/.dsh/profiles/pm/`（由 web 模板派生；以 `link:` 挂载本插件；补丁把存储 root 指向 `pm-tool/data`） |
| 上游框架源码本地路径 | `~/Projects/dsh-pm/deepseek-harness/`（只读，勿改） |
| 上游仓库 | <https://github.com/deepseek-ai/deepseek-harness>（分支 `master`） |
| 上游基线版本 | **v0.2.1-alpha.2** |
| 上游基线提交哈希 | `d743267388641bc76f17c45ce8b4c231aed1d32c`（2026-10-09 17:31 +0800，浅克隆 depth=1） |

> 说明：上游为浅克隆（`--depth 1`）。如需完整历史可在该目录执行 `git fetch --unshallow`。

## 2. 当前进度快照

### 已完成（阶段 1，全部完成）
- 核实 dsh 官方身份、技术栈、安装要求与插件架构（见 `docs/decision-log.md` ADL-001）。
- 安装用户级工具链：nvm + Node v22.23.3（npm 10.9.9）+ corepack/pnpm **11.28.5**，并写入 `~/.zshrc`。
- 浅克隆上游源码，`pnpm install` 成功（354 个工作区项目，约 1m17s，原生模块 postinstall 正常）。
- `pnpm run build` 成功（原生 addon + host + 357 个 client 产物，退出码 0）。
- 运行验证通过：`pnpm dsh web --no-open` 在 `http://127.0.0.1:3080` 启动；带一次性令牌 URL 完成认证后根路径返回 **HTTP 200**，页面标题 `DSH Local Build`、含 `id="root"` 与构建产物 `/assets/index-*.js`。验证后已关闭服务。
- 建立本产品独立 git 仓库与完整标准档案（README / docs / skills / packages）。
- SSH 认证打通并首次推送 main 到 GitHub（身份 Ice \<835687152@qq.com\>，仅仓库级配置）。

### 已完成（阶段 2 需求分析，已定稿 v0.3 并获项目所有者确认）
- 完成 dsh 能力可行性地图 `docs/feasibility-map.md`（本地源码 + 官方 cookbook/包 README 双路印证）。
- 四项产品决策（ADL-007）：离线优先混合模型、人类可读 JSON+Markdown 存储、先做 dsh Web 界面、最小闭环 MVP。
- 技术架构（ADL-008）：`storage-domain` + `storage-json` 落盘、用户命令（离线）/模型工具（在线）双入口、独立插件包 + 专属 profile。
- 三项补充决策（ADL-009）：业务数据目录 `data/` 暂不入库（已 gitignore）、里程碑提醒 R11 暂缓（P2）、生成型能力 MVP 仅预留接口不实现。
- MVP 范围：R1 项目计划 / R2 WBS 任务拆解 / R3 里程碑 / R4 持久化与导出 / R5 Web 界面 / R6 离线斜杠命令；数据模型与验收标准见 `docs/requirements.md`。

### 已完成（阶段 3 第 0 步「打通验证」，2026-10-10）
- 新建最小插件包 `packages/dsh-pm-tool/`：`/pm` 离线命令（ping/selftest）+ 存储领域 `pmtool`（per-record，表 `checks`，zod 校验）；包内 `tsc` 独立构建通过。
- 由 web 模板派生 profile `pm`，`link:` 绝对路径装入插件并自动激活；`--dump-config` 可见插件与存储三件套。
- profile 补丁将 storage-json `root` 覆盖到 `pm-tool/data`；宿主启动日志 `[pm-tool] 存储领域 pmtool 已打开`。
- Web 无 Key 执行 `/pm ping` 返回中文 pong（截图为证）；`scripts/verify-command.mjs` 跑通已构建插件的 selftest，落盘 `pm-tool/data/pmtool/checks/selftest.json`（可读、0700）。
- 修复真实 bug：`table.put()` 异步写盘漏 `await`（见 ISS-005）。
- 原遗留的第三方独立顶级 Web 页面已在 R5 按 ADL-022 验证完成。

### 已完成（首个业务增量，trae / TRAE，2026-10-10）
- 同一插件包内部增加 core/commands 模块，pmtool 版本 1 保留 checks，新增 projects；路径 `data/pmtool/projects/<id>.json`。
- 新增离线 `/pm project add {JSON}`、`list`、`get <ID>`；完整示例与必填字段见 `packages/dsh-pm-tool/README.md`。无新增插件包、Skill、依赖或 profile 改动。
- `pnpm run build` 与三个 `scripts/verify-*.mjs` 通过（退出码 0），验证增查、非法输入不落盘、10 次并发新增不覆盖、失败后恢复、旧 checks 兼容、0700、全新进程读回。项目测试独立临时库，保留结果路径供查看。
- 已用真实 dsh Web 无 API Key 执行 add/list/get：p-0001/p-0002 页面字段与 JSON 一致，目录 0700、文件 0600；服务已停止。新增仍为单进程队列，不支持多个宿主共享目录写入，R5 仍未开始。
- 提交主题：`feat(项目): 实现离线项目新增与查询及持久化验证 [trae]`（`b2ca50f`），连同 `0128203`、`9dbb3f9` **均已推送 origin/main（2026-10-10，HEAD `9dbb3f9`）**。

### 已完成（R1 离线项目 CRUD 收尾，trae / TRAE，2026-10-10）
- 新增 `/pm project update <id> {JSON片段} [confirm]` 与 `/pm project delete <id> confirm`；删除不带 confirm 只返回预览提示。
- 新增/更新校验 `targetDate >= startDate`；新增或实际改名撞到同名项目时默认阻止、末尾 confirm 放行（ADL-015）。
- 项目业务写操作统一排队，避免跨记录同名检查与编号分配的并发竞态；仍仅保证单宿主。
- 构建及 `verify-command/storage/projects.mjs` 全部退出码 0；项目脚本验证更新/删除重启读回、0700/0600、并发和写盘失败恢复。

### 已完成（doubao-work 独立复核 + 五项决策，2026-10-10）
- 独立复核结论：首批功能合格、建议验收（构建 + 三 verify 脚本退出 0；真实宿主加载插件；真实浏览器落盘 p-0001/p-0002 权限/内容正确；全新进程读回成功、无 Key 可用）。
- 复核边界：doubao-work 当前角色无 Mac 本机 GUI 权限、隔离浏览器被 browser-trust 503 拦截（安全设计），本机浏览器点击以 trae 已执行 + 落盘/进程级证据佐证（KB-014 / ISS-010）。
- 所有者五项决策已固化：删除 `confirm` 关键字、`targetDate>=startDate`、同名默认阻止+confirm 放行（ADL-012）；R5 排序与降级（ADL-013）；Node 口径 v22.23.3（ADL-014 / KB-015）。

### 当前交付点（R7 已验收）
- **存储布局（ADL-011/024/025/026 / requirements v0.7 §5.1）**：单领域 `pmtool` 下业务实体分表 per-record，用表 `keys()/entries()` 枚举，不建 index.json；当前含 projects/tasks/milestones/risk_issues/meetings/reports。
- **R7 结果**：统一风险问题台账、离线命令和 Web 工作台已完成；R4 已发布导出格式暂不包含 R7。
- **下一步（R1–R12 已全部完成）**：仓库定义的 R1–R12 已全部实现、验证并推送（HEAD `cbd50b6`）。后续仅余：① 项目所有者在本机对 R7–R12 Web 做最终目视确认（KB-014）；② 被裁剪/暂缓项（R11 里程碑到期提醒、智能 WBS/纪要/周报等生成型能力、多人实时协作、Excel 导入）需在具备 API Key/常驻调度或改变单用户离线定位后，按 ADL-030/031/032 重新评估，不属当前待开发。
- 接手平台须先提交该增量的**新增/修改文件清单**报备，获项目所有者确认后再写码；改动按 `docs/collaboration.md` 标平台标识并留痕。
- 里程碑提醒 R11 暂缓；生成型能力一期仅预留接口（ADL-009）。
- 第 0 步、首个业务增量及全部档案提交**均已推送 origin/main**（2026-10-10 经项目所有者确认）。

## 3. 环境依赖清单

- 操作系统：macOS 15.6.1，Apple Silicon（arm64），shell 为 zsh。
- Git：2.39.5（macOS 自带）。
- Node.js：v22.23.3，经 **nvm** 安装于 `~/.nvm`、`nvm alias default 22` 指向它（dsh 要求 `^22.19.0 || >=24`）。注意：在豆包工作沙箱命令行里可能显示其自带的 v22.23.2（PATH 遮蔽 nvm），不影响使用，标准口径仍为 v22.23.3（见 ADL-014 / KB-015）。
- pnpm：**11.28.5**，经 Node 自带 **corepack** 启用（版本以上游 `packageManager` 字段为准）。
- GitHub 认证：本机 ed25519 SSH 私钥 `~/.ssh/id_ed25519`（无密码，仅本机留存），公钥已登记在 GitHub 账户 iceAcmen，指纹 `SHA256:ajsc0fagRHsCMz1C0aEUUKYmny4EC9TeY6PwKTHY3pk`。
- 磁盘：工作区位于 `~/Projects/dsh-pm/`；上游含 `node_modules` 与构建产物，占用数 GB。
- API Key：阶段 1 不需要；后续如需真实模型，在 Web UI「设置 → 模型」填入 DeepSeek Key（环境变量 `DEEPSEEK_API_KEY`），**密钥不得写入仓库**。

新机器恢复命令（macOS）：

```sh
# 基础工具链
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.zshrc
nvm install 22 && nvm alias default 22
corepack enable

# 取本产品仓库（需把本机 SSH 公钥登记到 GitHub）
git clone git@github.com:iceAcmen/pm-tool.git ~/Projects/dsh-pm/pm-tool

# 取上游源码并跑起来（只读参考/运行）
git clone --depth 1 https://github.com/deepseek-ai/deepseek-harness.git ~/Projects/dsh-pm/deepseek-harness
cd ~/Projects/dsh-pm/deepseek-harness
corepack prepare pnpm@11.28.5 --activate   # 或直接 pnpm install，corepack 会按 packageManager 自动切换
pnpm install
pnpm run build
pnpm dsh web        # 终端会打印带 token 的本地访问 URL（token 每次启动变化）
```

在产品仓库构建插件并挂到本地 dsh（第 0 步已验证，均在上游目录 `~/Projects/dsh-pm/deepseek-harness` 执行）：

```sh
# 1) 构建自研插件
cd ~/Projects/dsh-pm/pm-tool/packages/dsh-pm-tool
pnpm install && pnpm run build
node scripts/verify-command.mjs     # 离线确定性自检（应退出码 0，落盘 pm-tool/data/.../selftest.json）
node scripts/verify-storage.mjs     # 统一领域声明与旧自检记录
node scripts/verify-projects.mjs    # 系统临时库，项目完整回归
node scripts/verify-tasks.mjs       # WBS 完整回归
node scripts/verify-milestones.mjs  # 里程碑增查、排序与重启读回
node scripts/verify-risk-issues.mjs # 风险问题 CRUD、筛选与重启读回
node scripts/verify-meetings.mjs    # 会议、行动项、关联保护与重启读回
node scripts/verify-reports.mjs     # 固定快照、异常汇总、Markdown 与重启读回
node scripts/verify-deliverables.mjs # 交付物台账、版本/状态留痕、删除保护与重启读回
node scripts/verify-r12.mjs         # 关键字检索、统计看板、Markdown 任务表导入与重启读回
node scripts/verify-export.mjs      # Markdown 内容、路径与覆盖保护
node scripts/verify-web.mjs         # Web 快照、manifest 与动态 bundle 契约

# 2) 首次：由 web 模板派生 pm profile（会启动，Ctrl-C 即可），再 link 装入插件
cd ~/Projects/dsh-pm/deepseek-harness
pnpm dsh --profile pm --from-default-profile web
pnpm dsh plugin --profile pm add link:/Users/bytedance/Projects/dsh-pm/pm-tool/packages/dsh-pm-tool

# 3) 把存储根目录指到产品目录（写 ~/.dsh/profiles/pm/cordis.patch.yml，内容见 docs/tech-plugin-scaffold.md）
#    然后查看配置 / 日常启动
pnpm dsh --profile pm --dump-config
pnpm dsh --profile pm --no-open     # 终端打印带 token 的 http://127.0.0.1:3080 URL；浏览器打开后输 /pm ping
```

> 注：插件改代码后需在包目录重新 `pnpm run build`，再重启 dsh（link 包不会热更新）。

## 4. 下一步从哪里继续

1. 阶段 2 已完成；当前开发依据 v0.7，落盘布局见 ADL-011/024/025/026。
2. **阶段 3 第 0 步「打通验证」已完成**：最小插件 `packages/dsh-pm-tool/` 已被本地源码版 dsh 装载，离线 `/pm ping` 与可读 JSON 落盘（`pm-tool/data`，0700）均验证通过；结论见 `docs/tech-plugin-scaffold.md` 文末附节、ADL-010、ISS-005～009。
3. **R1–R6 MVP 已完成**；R5 高密度表格、右侧抽屉和原生主题切换通过自动验证，所有者于 2026-10-10 确认手动验收通过。
4. **阶段 4 MVP 已完成并发布 v0.1.0**：冻结锁文件安装、构建、七项回归、profile 配置和隔离 profile 真实启动均通过。
5. **R7 已完成并验收**：八项回归及隔离 profile 真实浏览器 CRUD、筛选、主题、窄屏和重启读回通过；项目所有者已确认手动验证通过并授权提交推送。
6. **R8 已完成并验收**：首版手工结构化录入，不调用模型；行动项内嵌并使用稳定 ID，可关联任务/问题。九项回归、隔离浏览器和项目所有者手动验收均通过。
7. **R9 已完成并推送**：自定义周期固定快照、精简 Markdown、离线命令和 Web 通过十项回归；trae 实现后由 doubao-work 独立复核（隔离真实宿主启动 + 运行中下发 bundle 断言）通过并提交推送，未改业务代码；首版不接 schedule、模型或 PDF。本机浏览器目视项待所有者抽空确认（KB-014）。
8. **R10 交付物台账已完成（doubao-work）**：pmtool 领域新增 `deliverables` 表与 `/pm deliverable` 离线命令、Web「交付物」标签，版本/状态变化自动只增留痕，有交付物禁删项目；dsh 原生 deliverables 绑定 agent 轮次不适用离线台账，按 ADL-028 复用概念、数据层自研；11 项 verify 与隔离真实宿主 bundle 断言通过。
9. **R12 检索/看板/导入已完成（doubao-work）**：只读 `/pm search`（跨七类实体、`--type` 过滤）、只读 `/pm stats`（全项目/单项目聚合）、`/pm task import <项目ID> <清单.md> [confirm]`（缩进勾选清单→WBS，dry-run 不写盘）；Web 顶部「总览看板」基于 snapshot 派生跨项目统计卡片与全局搜索，不新增宿主路由、无硬编码色。12 项 verify（含新增 verify-r12.mjs）与隔离真实宿主 bundle 断言通过。
10. **剩余需求均已决策**：R11 里程碑提醒与智能 WBS/纪要/周报等生成型能力（ADL-032）、多人实时协作（ADL-031）、Excel 导入（ADL-030）暂缓/裁剪；待项目所有者提供可用 Key 或改变离线定位后再评估。本机浏览器目视（看板/全局搜索/窄屏）以所有者确认为准。
11. **R13/R14/R15 + A1/A2 已完成（doubao-work，2026-10-11）**：生成型三功能（`/pm task wbs`、`/pm report narrate`、`/pm meeting summarize`）已用真实 openrouter/free 端到端跑通并重启读回；随后 A1 在项目工作台加「AI 助手」面板（复用同一 core 草稿→confirm，未另写 LLM 层），A2 实现任务显式级联删除（dry-run/缺 cascade 拒绝/cascade confirm，旁支不动、跨表引用保护保留）。全 16 个 verify + build + frozen lockfile + `git diff --check` 绿。首页 `/pm` 问题已定位为宿主 composer 行为（ADL-038/KB-037/ISS-026），以 Web 面板为稳定入口。v0.2.0 发布说明已起草但**未打 tag**，待组织者独立验收。

## 5. SSH 密钥（已配置，备查）

- 私钥：`~/.ssh/id_ed25519`（本机留存，勿外传）；公钥：`~/.ssh/id_ed25519.pub`。
- 公钥已由项目所有者添加到 GitHub 账户 iceAcmen；`ssh -T git@github.com` 返回 `Hi iceAcmen! You've successfully authenticated...` 即正常（该命令退出码 1 是 GitHub 不提供 shell 的正常现象）。
- 公钥指纹：`SHA256:ajsc0fagRHsCMz1C0aEUUKYmny4EC9TeY6PwKTHY3pk`。
- 换新机器时：重新生成密钥并把新公钥登记到 GitHub，再执行上面的 clone 即可。

# 持久交接（TRAE 不必重梳理，v0.4.1-integration @ 9f6a6cf）
## 仓库
- 插件：packages/dsh-pm-tool；上游 deepseek-harness 只读；v0.4.0 tag=1af5490。
## 运行
- 构建：`cd packages/dsh-pm-tool && pnpm run build`。
- 全量非GUI回归：`node scripts/verify-integration.mjs`（已含 spawn 子进程 reopen 读盘）；再 `for f in scripts/verify-*.mjs; do node $f; done`。
- 隔离 GUI 实例（勿动所有者 3080）：DSH_HOME=项目内 .tmp/e2e-home、storage root=.tmp/e2e-data、DSH_PM_E2E=1、端口 3082、--no-open；token 从启动日志取，勿入库。
## 关键边界
- ask-apply 去重为内存 60s，重启不持久；写库走 updateTask 领域校验；--base 必带且格式校验。
- backup 默认目录=packages/dsh-pm-tool/backups（非 storage、非 DSH_HOME）；测试用注入 directory 隔离。
- 真实浏览器 GUI 端到端当前未跑（工具受限）；待独立验收点 OPT-06/08/12、副驾草稿卡确认。
## 未覆盖
- 崩溃原子恢复、PROD-11 关键路径、多步规划（v0.6）。

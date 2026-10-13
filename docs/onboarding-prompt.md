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

- **快照更新时间**：2026-10-13
- **最近更新平台**：doubao-work（**PROD-24 副驾多步规划已实现并通过独立验收总门：49 项 AUTO/GUI 可自动项全绿、0 NOT_RUN/0 FAIL/0 BLOCKED，仅余 2 项 MANUAL_PENDING＝真实免费模型实机降级 + 真 390px 窄屏目视；domain 仍 v1、零新表、唯一写 task.update；多步候选在工作树未提交；下一步主线＝Web 体验补齐 PROD-04/09/10，其后才进 schema v2**。先前：PROD-07 人员负载 v0.5.1 已实现·28 PASS）
- **main 提交定位**：HEAD=`2682fc7`（2026-10-13 10:30:46，独立测试专家发布收尾冻结基线）；本批版本事实统一文档**未提交**（按要求）。
- **版本口径（自 v0.5.0 硬规则）**：已发布注解 tag `v0.1.0`–`v0.4.0`（v0.4.0 tag 对象 `ca02969` → 提交 `1af5490`）；`package.json` 前置 `0.5.0`、`v0.5.0` tag **待打**（预览说明 `docs/releases/v0.5.0.md`）。发布收尾自动化门冻结于 `2682fc7`：functional verify **41 绿** + 隔离 guard **149 文件零变化**；`MANUAL_PENDING`=M1/A5 真实 Key 对话、M2/B3 3080 同源走查、H1–H6（暗色对比度/j·k/Space/Enter/390px/七 Tab）。
- **当前阶段 / 状态（2026-10-13）**：R1–R15 + A1/A2 已完成；v0.4.0 已发布（OPT-01~12 + PROD-01/02/03/05/08）；v0.5.0 开发线含 PROD-20 副驾 / PROD-22 甘特 / 独立测试门 ADL-045·分层门 ADL-047 / 外部 vendored Skills 接线（ADL-048）+ 自动路由（ADL-049）。**外部 skills 当前状态：试点可用，未毕业。** 自动化验收门 = PASS（域 A–H、J 全 PASS）；`code-review` 试点 = PASS；其余 3 entry（grill-me/tdd/diagnosing-bugs）尚未出试点报告（NOT_RUN），各补 1 份后方可毕业。**ADL-049 自动路由（实现 `src/core/external-skill-router.ts`）**：缺阻塞→`interaction` route=none（全拦）；`vendorIntegrityVerified` 必须 true（硬前置）；根因未明→仅 `diagnosing-bugs`（抑制 grill/tdd、不叠 review）；歧义非 trivial→`grill-me`；新功能/可测修复非 trivial→`tdd`；交付边界→追加 `code-review`（trivial 也保留）；`taskKind` 留痕。**实现已独立复核 APPROVE、`verify-external-skill-router.mjs` 41 组断言全绿、K 域专家 = PASS；自动路由 ≠ 毕业**。上游 commit=`49dd158d1076134a641b33efb035946536778336`。使用 vendor skill 前必读 `docs/external-skills.md` 守 8 条红线。
- **验证**：发布收尾自动化口径以独立测试专家冻结基线 `2682fc7` 为准——functional verify 41 绿 + guard 149 文件零变化；R13/R14/R15 曾以真实 openrouter/free 端到端并重启读回（临时项目已删净）。本批仅改版本事实/文档口径，未改产品代码，不重跑自动化。
- **已知限制**：免费池随机模型纯文本可用、工具调用不保证、约 50 次/天、偶发超时重试即恢复；删根须叶子→根或用 cascade confirm；首页斜杠命令点发送按钮、发送后到侧栏点最新会话。
- **本批验证（doubao-work，全部无 Key）**：Node nvm v22 / pnpm 11.28.5；`pnpm install --frozen-lockfile` 干净、`pnpm run build` 退出码 0（client bundle 153.00 kB）、**12 个** verify 全 0、`git diff --check` 干净；`DSH_HOME=~/.dsh pnpm dsh --profile pm --dump-config` 退出码 0、组合中 `providers.openrouter-free` 出现且 storage-json root / dsh-pm-tool 完好；无 Key 真实宿主（随机端口）启动成功（`[pm-tool] 存储领域 pmtool 已打开`、无 pi-ai/openrouter 报错），运行中 `plugins/??dsh-pm-tool/client.js` bundle HTTP 200（无 cookie 401）。
- **key 已配置、端点已实测（2026-10-11 更新）**：key 已由所有者写在其本机 `~/.zshrc`（仓库外、不入库；改前已备份 `~/.zshrc.bak-20261011-130537`）。所有者本机直连实测：`GET /v1/key` 返回 `is_free_tier: true`、`free_model_daily_requests.limit=50`；`POST /v1/chat/completions`（`model=openrouter/free`）两次真实调用均成功、`cost=$0`、`finish_reason=stop`（随机落到 `liquid/lfm-2.5-2.6b:free`、`nvidia/nemotron-3-ultra-550b-a55b:free`）。经验见 KB-034（推理型模型先吃满 reasoning tokens，`max_tokens` 要给足 ≥400）。
- **应用内已实测打通（2026-10-11 更新）**：在 dsh 网页底部模型选择器选 **Free Models Router**（openrouter-free/openrouter/free）发「你好，用一句话介绍你自己」，**第 1 次即成功**（puppeteer-core + 系统 Chrome 139 无头，KB-032）：助手正常回复、无 MISSING_CREDENTIAL/401/429。期间曾踩一次 `MISSING_CREDENTIAL`（“OPENROUTER_API_KEY which is not set”）——根因是 dsh 进程由「写 key 前的旧终端」启动、进程环境无该变量；停旧进程、用已 `source ~/.zshrc` 的环境重启即解（KB-035 / ISS-024，永久做法是在 Web「设置→模型」页把密钥录进 credentials service）。
- **新增协作硬规则**：每个任务完成后必须执行构建、当前全部 verify 脚本和本批专项验证；最终回报逐项列出环境、命令、退出码、关键证据和未覆盖边界，任一失败不得标记完成或提交。
- **连续推进规则**：每批验证完成后，执行平台主动提交下一批文件级计划；所有者确认后直接继续编码。
- **版本控制确认规则**：通常每批完成并验证后，提交与推送分别请所有者授权。**本轮（R9 收尾起的连续开发）所有者已一次性持续授权 doubao-work：仓库内代码/文档修改、正常 commit、`git push origin main` 可全自动执行，无需逐次请示**；仍禁止 force push/改写已推送历史/提交密钥或业务数据，删除他人成果、改全局配置、发布 npm/正式版本等不可逆外部操作仍须遵守安全规则。
- **授权状态**：本批在持续授权范围内提交推送（提交信息标 `[doubao-work]`，推送后核对 HEAD=origin/main）。
- **所有者已定规则（ADL-012～035）**：R12 检索/统计为只读派生、Web 看板基于 snapshot（ADL-029）；Excel 导入（ADL-030）、多人实时协作（ADL-031）、R11 里程碑提醒与生成型能力（ADL-032）本期暂缓/裁剪；浏览器兼容仅 Chrome（ADL-033）；上游 dsh 新版本按 peer 锁定 + 升级冒烟（ADL-034）；**OpenRouter 免费自动路由作零成本尽力而为 LLM 通道、核心保持离线、其他官方厂商预留模板（ADL-035）**。
- **下一步 / 遗留**：**主线下一步 = Web 体验补齐 = PROD-04（任务「移动到…」Web 改父）/ PROD-09（汇报表相邻完成率·逾期·异常数对比徽标）/ PROD-10（任务详情「来自会议」直达）**，三者纯前端/小改 core、不动 schema；**其后才进 schema v2**（PROD-11 任务 predecessorIds 依赖 / 甘特B 关键路径 / PROD-23 健康分）。PROD-24 副驾多步规划已实现并独立验收总门 PASS（49 项 AUTO/GUI 全绿），仅余 2 项 MANUAL_PENDING（真实免费模型实机降级 / 真 390px 窄屏目视）待所有者反馈；多步候选在工作树未提交。其余遗留：为外部 vendor skills 的其余 3 entry（grill-me/tdd/diagnosing-bugs）各补 1 份试点报告以推进毕业（code-review 已 PASS；自动路由已生效但不改变毕业状态）；R11 里程碑提醒、多人协作、Excel 导入仍暂缓/裁剪。已知限制：免费池偶发超时重试即恢复（KB-036）、任务删除不级联需叶子→根逐层删（ISS-025）。
- **最近一次交接**：doubao-work 完成 **PROD-24 副驾多步规划**——模型输出 `{"plan":[…]}` 多步计划卡（DAG 拓扑、checkbox 勾选跳过、行内 5 标量编辑非法标红禁用、3 条确定性软风险、整批/逐步确认、拒绝红行不可勾选）；执行仍复用 ask-apply，domain 仍 v1、零新表、计划只在前端内存、唯一写 `task.update`、同任务链式 baseline、旧 actions 输出兼容、取消/降级零写；经独立测试矩阵总门验收 **PASS：49 项 AUTO/GUI 可自动项全绿、0 FAIL/BLOCKED/NOT_RUN**，2 项 MANUAL_PENDING（真实模型实机 / 真 390px 窄窗）。上一批 doubao-work 完成 **PROD-07 顶层「人员与负载」视图 v0.5.1**（28 PASS）；外部 skills 自动路由 ADL-049 已生效，当前仍「试点可用、未毕业」。

# 工作进度流水账 progress.md

> 本文件记录项目「每个阶段已完成、进行中、待办」的最新状态；给维护者与迁移者快速判断进度使用。每次有进展即更新，最新内容置顶。

最后更新：2026-10-13（doubao-work **Web polish 三件套 PROD-04/09/10 已实现并通过独立验收总门**：**27/27 PASS、0 FAIL/BLOCKED/NOT_RUN/MANUAL_PENDING**，testedCommit 85cb651；零 schema、domain 仍 v1。下一步主线 = **schema v2（PROD-11 predecessorIds + PROD-21 repoUrl + PROD-23 健康分/原子恢复）**。先前一批：PROD-24 副驾多步规划 49 PASS）

## 当前阶段：Web polish 三件套 PROD-10→09→04 已实现·独立验收 27/27 PASS（2026-10-13，doubao-work）

- **功能**：v0.5.2 Web 侧三缺口一次补齐——PROD-10 任务抽屉顶部只读显示「来自会议 mtg-xxxx · 会议标题」并一键直达该会议（前端反查 `meetings.actions[].taskId`）；PROD-09 进度汇报表每行与时间相邻上一份固定快照 diff 三指标并出「↑5% / ↓1 / 持平0」文字箭头徽标；PROD-04 任务行「⋯ 移动到…」树选择器改父，一次确认＝原子改父+项目全量 renumber。
- **口径与边界**：**零 schema**（domain 仍 v1、9 表）。PROD-10 多来源按会议日期倒序→id 倒序确定性取第一条、附「另 N 场」提示，来源会议删除则安全隐藏；PROD-09 在全量 periodEnd/id 排序列表上求相邻（不受搜索/状态筛选影响），三指标＝averageProgress / overdue_task 异常数 / exceptions 总数，首份无徽标、零差显「持平0」、文字+箭头非仅靠色；PROD-04 选择器排除自身+后代（后端环检测仍为硬门），后端单写队列内原子复合、失败整树回滚、取消零写，P0 不做拖拽/中间插序。
- **验收（独立测试矩阵签发，2026-10-13）**：总门 **PASS——27/27**，0 FAIL/BLOCKED/NOT_RUN；MANUAL_PENDING=0（真 390 窄窗沿用 PL-WEB-11 不在本门重复）。AUTO：`build`=0、full isolation guard=0、3 个新专项 verify（`verify-meeting-source.mjs` / `verify-report-diff.mjs` / `verify-task-move-renumber.mjs`）全退出 0；GUI：隔离实例端口 3095 真实 Chrome 逐用例过证（证据 `docs/verification/gui-web-polish-20261013/`）；正式 data/ 与 backups 149 文件 hash+mtime 零污染。产品契约见 `docs/product/09-web-polish-design.md`；验收矩阵 `docs/testing/web-polish-acceptance.md`。
- **状态**：本批仅回写产品/living docs 状态，**未改 `src/`、未改 `docs/testing/`、未提交**。
- **下一步（主线）＝schema v2**：PROD-11（任务 `predecessorIds[]` 依赖）、PROD-21（repoUrl/branch 仓库联动）、PROD-23（项目健康分 + 崩溃原子恢复）。

## 历史阶段：PROD-24 副驾多步规划已实现·独立验收 PASS（2026-10-13，doubao-work）

- **功能**：把 PROD-20 副驾的扁平动作数组升级为多步计划卡——模型可输出 `{"plan":[…]}`（每步 stepId/title/reason/action/needs[]/riskNote?），前端按 DAG 拓扑渲染、每行 checkbox 默认全选、行内只允许改 5 标量（非法即时标红禁用确认）、3 条确定性软风险琥珀提示（不禁用）；【整批执行】一次 ask-apply，【逐步执行】前端逐步调（每次重读 domain）；拒绝红行（如 task.delete / 环依赖）不可勾选。
- **口径与边界**：domain 仍 v1、零新表、不写 settings、计划只在前端内存（关面板即消散）；唯一写动作 `task.update`（patch：status/progress/assignee/startDate/dueDate）；DAG 环/悬空/自指**只拒该步**（其下游级联拒），整份 >8 步（或 >10 任务）**整份拒绝**；同目标任务隐式串行 + **链式 baseline**（整批内后者用前者落库后的 updatedAt，不误判冲突）；跨调用真实外部冲突仅拒相关步 + 依赖级联；幂等键扩为 `projectId+JSON(selectedOrderedActions)+JSON(baseline)`（60s）；取消/降级零写（27 个业务 JSON sha/mtime/size 全不变）；旧 `{"actions":[…]}` 输出自动包平凡计划、v0.5 链路回归不破。
- **验收（独立测试矩阵签发，2026-10-13）**：总门 **PASS**——49 项 AUTO/GUI 可自动项全绿，0 NOT_RUN/0 FAIL/0 BLOCKED；自动化门 `build` 退出 0、44 个 verify 脚本全绿（新增 `verify-copilot-plan.mjs` / `verify-copilot-plan-cancel.mjs`，扩展 `verify-ask-apply.mjs`）、正式 `data/` 与 backups 149 文件 hash+mtime 零污染；GUI 门在隔离实例 127.0.0.1:3093 真实 Chrome headless（未碰 3080/3091/data）逐用例过证。**2 项 MANUAL_PENDING（不阻塞）**：CMP-DEG-05（真实免费模型限流/乱码/无 Key 实机）、CMP-GUI-11（真 390px 窄窗目视）。产品契约见 `docs/product/08-copilot-multistep-design.md`；验收矩阵 `docs/testing/copilot-multistep-acceptance.md`；GUI 证据 `docs/verification/gui-copilot-multistep-20261013/`。
- **状态**：本批仅回写产品/living docs 状态，**未改 `src/`、未改 `docs/testing/`、未提交**（多步候选在工作树）。
- **下一步（主线）**：**Web 体验补齐 = PROD-04（任务「移动到…」Web 改父）/ PROD-09（汇报表相邻完成率·逾期·异常数对比徽标）/ PROD-10（任务详情显示「来自会议」并直达）**；三者均为纯前端/小改 core、不动 schema。**其后才进 schema v2**：PROD-11（任务 predecessorIds 依赖）、甘特B 关键路径、PROD-23 健康分。

## 历史阶段：PROD-07 人员与负载视图 v0.5.1 已实现·独立验收 PASS（2026-10-13，doubao-work）

- **功能**：新增顶层「人员」tab，跨项目按 `task.assignee` 归一化（trim+空白折叠+casefold）聚合未完成任务；每卡出未完成/待办·进行中·受阻、逾期/临期/P0、跨项目数、最近截止；按风险排序（逾期→受阻→临期→最近截止），「未分配」桶固定置顶；点任务行复用 `openRecord` 切项目+切tab+开抽屉，全程只读派生。
- **口径与边界**：逾期＝`status!=='done' && progress<100 && dueDate<今天`（与 stats/reminders 同口径）；**不拆多负责人字符串、不自动合并相似名、不建人员表、不动 domain/schema、不发写命令**。P1（相似名软提示/j·k 导航+记忆/涉众提示）后续做。
- **验收（独立测试矩阵签发，2026-10-13）**：**28 PASS / 0 NOT_RUN / 0 FAIL**；**1 项 MANUAL_PENDING＝真实 390px 窄屏目视**（工具受限，须所有者本人在真浏览器确认）。产品契约与验收/反例见 `docs/product/07-people-load-view-design.md`。
- **状态**：本批仅回写产品/living docs 状态，**未改 `src/`、未改 `docs/testing/`、未提交**。
- **下一步（主线）**：**AI 副驾多步规划**（PROD-20 升维方向；v0.6 架构演进侧的 PROD-11 关键路径/崩溃原子恢复按需并行）。

## 历史阶段：外部 vendor Agent Skills 引入 + 长期规范接线（2026-10-13，doubao-work）

- **决策（ADL-048）**：以只读 vendoring 引入首批 `mattpocock/skills`（grill-me/tdd/code-review/diagnosing-bugs + 纯文档依赖 grilling），锁上游 commit `49dd158d1076134a641b33efb035946536778336`；项目规则优先、不跑 installer、不写 home/全局、不替代独立测试门；升级走双审、回滚只改 manifest commit。
- **决策（ADL-049 自动路由，实现 `src/core/external-skill-router.ts`）**：vendored skill 不再要求用户显式指定，由纯函数按结构化信号确定性路由——缺阻塞信息→`interaction` 追问 route=none（**全拦**）；`vendorIntegrityVerified` 必须 **true**（安全门硬前置）；根因未明→仅 `diagnosing-bugs`（**抑制 grill/tdd、不叠 code-review**）；实质歧义非 trivial→`grill-me`；新功能/可测修复非 trivial→`tdd`；交付边界→**追加 `code-review`（trivial 也保留）**；`isTrivial` 抑制 grill/tdd。自动加载无需用户口令，但须先校静态校验 PASS + sha256、逐次留试点报告；优先级「项目规则 > 追问澄清 > 独立测试门 > skill 步骤」。
- **落地物**：`vendor/agent-skills/mattpocock/`（只读正文 + manifest.json）、治理政策 `docs/external-skills.md`、独立验收门 `docs/testing/external-skills-acceptance.md`、离线静态校验器 `packages/dsh-pm-tool/scripts/verify-external-skills.mjs`、试点报告模板 `docs/templates/external-skill-pilot-report.md`（本批均未改其正文）。
- **状态（2026-10-13 独立测试专家签发）**：**试点可用，未毕业。** 自动化验收门 = **PASS**（静态/校验域 A–H、J 全 PASS，无 FAIL/BLOCKED/F1，MANUAL_PENDING 无）；**`code-review` 试点 = PASS**（报告 `docs/verification/external-skills/pilot-01-code-review.md`）；其余 3 entry（`grill-me`/`tdd`/`diagnosing-bugs`）尚未出试点报告（NOT_RUN），各补 1 份试点报告后方可毕业。**自动路由实现已独立复核 APPROVE**：`verify-external-skill-router.mjs` **41 组断言全绿**（K1–K6、K3 安全门 false 拦截/true 放行、taskKind 留痕、确定性）、**K 域专家 = PASS**。绑定：上游 commit=`49dd158d1076134a641b33efb035946536778336`。**自动路由 ≠ 毕业**。**下一步**：为其余 3 entry 各补 1 份试点报告以推进毕业；使用 vendor skill 仍须先读 `docs/external-skills.md` 守 8 条红线。

## 历史阶段：第一档离线增强 R16/R17/R18 已实现（2026-10-11，doubao-work）

- **R16 临期/逾期提醒**：`/pm due [天数] [项目ID?]`（默认全部项目 7 天）+ Web 面板提醒条；纯读时派生、不做常驻调度（ADL-039）（commit 1b9bf67）。
- **R17 会议行动项转任务**：`/pm meeting action promote <mtg> <ai> [confirm]`（幂等回写 action.taskId）+ Web 「转任务」按钮（ADL-040）（commit 93a8c71）。
- **R18 备份/恢复**：`/pm backup` / `/pm restore <文件> confirm`（恢复前自动安全快照）+ Web 一键备份按钮 + `docs/backup-sync.md`（ADL-041）（commit 0a27862）。
- **验证**：新增 verify-reminders / verify-promote / verify-backup 三个专项；build + 全量 verify 退出 0；`backups/` 已 gitignore。
- **下一步**：第二档体验增强（AI 助手体验/列表效率/纯 JS CSV·XLSX 导入/导出入口）进行中或待办；生成型功能（R13-15）已端到端跑通。

## 历史阶段：生成型功能（R13/R14/R15）已实现（2026-10-11，doubao-work）

- **R13 智能 WBS**：`/pm task wbs <项目ID> <目标> [confirm]`——AI 拆解为勾选清单草稿→dry-run 预览→confirm 复用草稿落盘为任务树（commit 9775cf3）。
- **R14 进度汇报 AI 叙述**：`/pm report narrate <项目ID> [confirm]`——确定性数字→AI 段落→confirm 写入既有 `executiveSummary`（零 schema 改动）（commit cd07b94）。
- **R15 会议纪要归纳**：`/pm meeting summarize <项目ID> <速记> [confirm]`——AI JSON 草稿（防御解析）→confirm 建 draft 会议并挂行动项（commit 35affa8）。
- **统一落地（ADL-036）**：`core/ai-client.ts` 一次性文本生成封装（`ctx.llm.prepareCall`+`BlockAssembler`，按 `error.code` 中文降级）；AI 一律草稿 confirm 才入库；失败/无 key 优雅降级到手工/确定性路径；confirm 复用草稿不重复调模型省免费额度；核心台账离线可用。
- **验证**：每个功能配 verify-wbs / verify-report-ai / verify-meeting-ai（含成功路径与失败降级）；全 15 项 verify 退出 0、`pnpm run build` 通过。
- **真实端到端已通过（2026-10-11）**：已用真实 openrouter/free（凭据库、无环境变量启动）对三功能跑通——R13 confirm 落盘 25 任务、R14 rpt-0002 executiveSummary 数字未改、R15 mtg-0001 三行动项；无环境变量重启读回正常；临时项目已删净。免费池偶发超时已归一为中文 MODEL_TIMEOUT（重试即恢复）。
- **下一步**：Web 按钮为第二里程碑（v1 先斜杠命令）；「任务删除不级联」「免费池偶发超时重试」为已知限制。

## 上一阶段：生成型功能立项（2026-10-11）

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
- R13/R14/R15（智能 WBS/进度汇报叙述/会议纪要归纳）已完成并真实 openrouter/free 端到端验证（含重启读回，临时项目已删净）；随后完成 **A1（Web 端「AI 助手」面板，复用 core 草稿→confirm）** 与 **A2（任务显式级联删除 `/pm task delete <id> [cascade] confirm`）**，全 16 个 verify + build + frozen lockfile 绿。
- 首页 `/pm` 经上游只读核查确认注册正确、问题属宿主斜杠补全/会话跳转（ADL-038/KB-037/ISS-026）；以 Web 面板为稳定入口。v0.2.0 发布说明已起草（`docs/releases/v0.2.0.md`，**未打 tag**，待组织者独立验收）。
- 剩余需求仍暂缓/裁剪：R11 里程碑提醒、多人实时协作（ADL-031）、Excel 导入（ADL-030）。
- 上游 dsh 升级前按 `docs/test-cases.md` 执行完整兼容性回归。

## 当前状态（v0.7.1 最终可发布 · tag 将在最终提交创建；v0.7.0 已发布）
- **版本事实已前置到 v0.7.1（2026-10-14）**：`packages/dsh-pm-tool/package.json` = `0.7.1`。**v0.7.0 已正式发布**：注解 tag 对象 `b6ba06ac` → 提交 `217d8ae`。v0.7.1 = 稳定性补丁 S1/S2/S3 + 协作演进契约，**独立测试专家已最终签 PASS、可发布**；注解 tag 将在最终提交时创建（当前 HEAD `217d8ae`，最终 release commit SHA 待最终提交后确定）。历史 tag `v0.1.0`–`v0.7.0` 均未移动。
- **v0.7.1 范围（v0.7.0 之后）**：S1——move+renumber 回滚 AggregateError 及用户安全摘要；S2——ask-apply settings 60s 顺序重放幂等 + 真实新进程测试（非跨进程互斥）；S3——repo-format browser-safe 唯一真源 + 三级 CLI；协作演进契约 `docs/product/11-collaboration-ready-architecture.md`（当前不实现账号权限实时）。详见 `docs/releases/v0.7.1.md`。
- **验收（测试专家最终签 PASS）**：S1/S2/S3 **28/28 全 PASS**；**59 个 verify scripts 全绿**；隔离 guard **157 个资产文件零变化**；client bundle 完整哈希 `dd66be290d2d1568742821b10713243f0790edf78fdc8c43ce703de3550f1397`。
- **人工项**：**M-01 生产（prod）真实 Key 仍 MANUAL_PENDING（不阻塞 v0.7.1 发布）**；PoC 车道 `our-free-model`/`kilo-auto/free` 免费免 Key。G8/H5 不可逆动作仍 MANUAL_PENDING。
- **发布动作**：用户已授权最终发布/提交/正常 push/正式升级；本批**暂不 commit/tag/push**，待用户最终通知执行最终提交并打注解 tag。

# 版本更新记录 changelog.md

> 本文件按时间倒序记录「每次改动动了哪些文件、新增/修改了什么、为什么」；给维护者与迁移者使用，配合 git 提交历史一起阅读。格式参考 Keep a Changelog，版本号在阶段 3 产出可用功能后启用语义化版本。

日期格式：YYYY-MM-DD。类型：新增 / 变更 / 修复 / 环境 / 文档。

> **多方协作约定**：每条变更必须标注**改动平台标识**（如 `doubao-work`、`trae`，注册表见 `docs/collaboration.md` 第二节），并写清「改了哪些文件 / 做了什么 / 为什么 / 影响范围 / 验证」。完整条目模板见 `docs/collaboration.md` 第 4.1 节。

---

## [v0.5.0] 归档摘要 + 历史版本对账说明（2026-10-13，平台：doubao-work）

> 目的：发布收尾前把「版本事实」统一到 v0.5.0。本批**只新增归档摘要与对账说明，不搬运、不重排、不改写下列既有 `[未发布]` 条目的历史归属**（避免把历史提交错误归类到新版本）。

- **改动文件（版本事实/文档口径，不改产品 src、测试专家 docs、vendor、scripts、服务）**：
  - `packages/dsh-pm-tool/package.json`：`version` `0.1.0` → **`0.5.0`**（前置到当前开发线；产品 src 由另一 Agent 负责，未改）。
  - `docs/releases/v0.4.0.md`：**新建（事后补记）**，严格按真实 tag 回填——注解 tag 对象 `ca02969` → 指向提交 `1af5490`（2026-10-12），内容取 `git log v0.3.0..v0.4.0`（PoC 跨池降级链 + OPT-01~12 + PROD-01/02/03/05/08）。
  - `docs/releases/v0.5.0.md`：**新建（预览）**，诚实列已完成 / 预览、自动化 **41 绿** / guard **149 文件零变化**、H1–H6 与真实 Key（M1/A5）`MANUAL_PENDING`，并标注待打 tag 与发布前置条件。
  - `README.md`：新增「版本导航」表（v0.1.0–v0.4.0 已发布 tag + v0.5.0 预览），刷新阶段导航，去除 stale 的「已发布 v0.1.0」口径。
  - `docs/optimization-backlog.md`（roadmap）：对账确认 OPT-01~12 已随 v0.4.0 交付，移入「已消化」；待排期区清空，保留结构性长期项。
  - `docs/progress.md` / `docs/handoff.md`：把「当前状态（v0.4.1-integration，未 tag）」「v0.4.0 tag=1af5490」等混乱口径统一到 v0.5.0 预览线，并澄清 tag 对象(`ca02969`)与剥离提交(`1af5490`)是两个 SHA。
  - `AGENTS.md`：新增「自 v0.5.0 起版本/tag 一致」硬规则；`docs/onboarding-prompt.md`：更新文末易变快照。
- **历史版本对账说明（tag ↔ 发布说明 ↔ package.json）**：
  | 版本 | tag（注解）对象 → 指向提交 | 发布说明 | package.json |
  |---|---|---|---|
  | v0.1.0 | `ebd14a1` → `56b27c8`（2026-10-10） | `docs/releases/v0.1.0.md` ✅ | 历史为 0.1.0 |
  | v0.2.0 | `2f0ecab` → `2c2e039`（2026-10-11） | `docs/releases/v0.2.0.md` ✅ | — |
  | v0.3.0 | `41e515e` → `4b33b84`（2026-10-11） | `docs/releases/v0.3.0.md` ✅ | — |
  | v0.4.0 | `ca02969` → `1af5490`（2026-10-12） | 本批补 `docs/releases/v0.4.0.md` ✅ | — |
  | v0.5.0 | **待打 tag**（基线 `2682fc7`） | `docs/releases/v0.5.0.md`（预览） | **0.5.0（本批前置）** |
  > 历史 tag `v0.1.0`–`v0.4.0` **一律未移动/未重打**。此前漂移根因：package.json 长期停留 `0.1.0`、漏写 v0.4.0 发布说明、handoff 把注解 tag 对象与剥离提交混为「对不上」；本批逐项对齐。
- **影响范围 / 状态**：纯版本事实与文档口径；不打 tag、不提交（按要求）。自动化证据沿用独立测试专家冻结基线 `2682fc7`（41 绿 + guard 149），本批未改产品代码，不重跑自动化。
- **验证**：`node -e JSON.parse(package.json)` 通过；各 Markdown 结构与 `git diff --check` 干净；用 vendored `code-review`（只读）自查改动，发现写入本 Agent 自身 artifacts，不新增试点报告（code-review 已毕业试点）。

## [未发布] — 外部 Skill 自动路由治理：ADL-049 + AGENTS 自动选择要求（2026-10-13，平台：doubao-work）

- **改动文件（仅长期规范/索引）**：
  - `docs/decision-log.md`：置顶新增 **ADL-049**（vendored skill 由执行 Agent 按任务自动路由、无需用户点名）。
  - `AGENTS.md`：第 6 节在 vendor 治理条下追加一条简短**自动选择**规则（映射 grill-me/tdd/diagnosing-bugs/code-review + 简单任务可不加载 + 优先级 + 加载前验证/留痕）。
  - `docs/knowledge-base.md`（KB-038）/ `docs/progress.md` / `docs/handoff.md` / `docs/onboarding-prompt.md` 快照：同步自动路由规则与当前状态。
- **为什么**：项目所有者更新长期治理——vendored skill 不再要求用户显式指定，由 Agent 按上下文自动判断；需把映射、边界与优先级固化为长期规范。
- **自动路由精确语义（ADL-049，按 REQUEST CHANGES 修订后的实现 `src/core/external-skill-router.ts`）**：缺阻塞信息→`interaction` 追问、route=none（**全拦**）；`vendorIntegrityVerified` 必须 **true**（安全门硬前置，未过即 none）；根因未明→仅 `diagnosing-bugs`（**抑制 grill/tdd、不叠 code-review**）；实质歧义非 trivial→`grill-me`；新功能/可测修复非 trivial→`tdd`；交付边界→**追加 `code-review`（trivial 也保留）**；`isTrivial` 抑制 grill/tdd。优先级：项目规则 > 追问澄清 > 独立测试门 > skill 步骤；自动加载无需用户口令，但须先校 `verify-external-skills.mjs` 静态校验 PASS + sha256、逐次填试点报告。配套纯函数 + 校验脚本 `scripts/verify-external-skill-router.mjs` 由实现方落地。
- **影响范围 / 状态**：本批仅改规范/索引文档；**不改** vendor、政策正文（`docs/external-skills.md`，另一 Agent 维护）、验收矩阵、试点报告、路由代码。**自动路由实现已独立复核 APPROVE**：`scripts/verify-external-skill-router.mjs` **41 组断言全绿**（K1–K6、K3 安全门 false 拦截/true 放行、taskKind 留痕、冻结去重、确定性），**K 域专家 = PASS**。**自动路由 ≠ 毕业**——仍「试点可用，未毕业」：`code-review` 试点 PASS，其余 3 entry（grill-me/tdd/diagnosing-bugs）试点待做。
- **验证**：`git diff --check` 干净；`node scripts/verify-external-skills.mjs`（vendor 安全门）exit 0；`node scripts/verify-external-skill-router.mjs` **41 组断言全绿、exit 0**；路由实现结论由独立专家签发，本接线批不自判。**未提交（按要求）**。

## [未发布] — 外部（vendor）Agent Skills 长期规范接线：ADL-048 + AGENTS/索引（2026-10-13，平台：doubao-work）

- **改动文件（仅规范/索引，不碰落地物正文）**：
  - `docs/decision-log.md`：置顶新增 **ADL-048**（选择性 vendoring：锁上游 commit、仅 4 公开 entry + 声明依赖、项目规则优先、不跑 installer、安全静态校验 + 独立试点门、升级双审/回滚）。
  - `AGENTS.md`：第 6 节红线新增一条 vendor skill 治理规则（指向 `docs/external-skills.md` + `vendor/agent-skills/mattpocock/manifest.json` + `verify-external-skills.mjs`）；第 5 节文档地图补 `external-skills.md` / `docs/testing/` / `vendor/` 三行。
  - `README.md`：目录树补 `docs/external-skills.md`、`docs/testing/`、`vendor/` 入口。
  - `docs/knowledge-base.md`：置顶新增 **KB-038**（外部 skill 使用四步法与边界，指向政策/manifest/校验器）。
  - `docs/testing/README.md`：文档清单索引一行 `external-skills-acceptance.md`（仅索引，不改验收矩阵正文/结论）。
  - `docs/progress.md` / `docs/handoff.md`：补本批现状快照。
- **为什么**：外部 skills 落地物（`vendor/agent-skills/mattpocock/`、`docs/external-skills.md`、`docs/testing/external-skills-acceptance.md`、`packages/dsh-pm-tool/scripts/verify-external-skills.mjs`、试点模板）已由实施方落盘但未提交；需把它们接入长期规范与索引，让后续平台能发现并遵守，同时不与实施方争抢这些文件。
- **影响范围 / 状态（2026-10-13 独立测试专家签发后更新）**：纯文档接线，不改任何业务代码、vendor 正文、政策正文、验收矩阵正文、试点报告、package 校验器。**当前状态：试点可用，未毕业。** 自动化验收门 = **PASS**（静态/校验域 A–H、J 全 PASS，无 FAIL/BLOCKED/F1，MANUAL_PENDING 无）；**`code-review` 试点 = PASS**；其余 3 entry（`grill-me`/`tdd`/`diagnosing-bugs`）尚未出试点报告（NOT_RUN），各补 1 份后方可毕业。绑定：HEAD=`93eb093c20648618c3e1d2914a20340d22325f86`、上游 commit=`49dd158d1076134a641b33efb035946536778336`。
- **验证**：`git diff --check` 无空白/冲突标记；`node packages/dsh-pm-tool/scripts/verify-external-skills.mjs` 只读静态校验真实 vendor（PASS，只读、不执行 vendor 内容）；验收结论由独立测试专家按 `docs/testing/external-skills-acceptance.md` §7 逐域签发（本批接线方不自判）；未提交（按要求）。

- 修复：`/pm due [天数] [YYYY-MM-DD]` 新增可选 today 参数（日期粒度与时辰无关，computeReminders 已按本地日历日零点比较），verify-reminders 固化 today 并补「下午 15:30 仍稳定」用例，消除墙钟时刻边界抖动；连跑两遍 27/27 全绿。

## [未发布] — OPT-01~12 体验优化全量落地（2026-10-11，平台：doubao-work）

- OPT-01/02 提醒可点击切项目、3/7/14/30 天范围切换、按项目分组；OPT-03 记住上次选中项目（localStorage）。
- OPT-04 导出 Markdown 改前端 Blob 直接下载（文件名带项目名/时间戳）；OPT-05 批量改负责人/优先级/截止（走 `task batch update`）。
- OPT-06 网页选备份 JSON 按内容恢复（`restore-content`，两步确认+恢复前安全快照）；OPT-07 批量条淡入动画（尊重 reduced-motion）。
- OPT-08 narrate 可编辑落盘（`report narrateuse`）；OPT-11 空状态 AI CTA。
- OPT-09 面板纯键盘导航（`core/panel-kbd.ts` reducer：j/k/空格/Del/Enter，输入框与修饰键守卫）+ verify-keyboard.mjs。
- OPT-12 网页 csv/xlsx 按内容导入（`task import-content <pid> <文件名> <JSON内容>`，xlsx 仍 node 侧 SheetJS，不进 client bundle）+ verify-import-content.mjs。
- 验证：build 绿、新增 2 个 verify 共 27 个；`git diff --check` 干净。注：verify-reminders 在「当天下午时分」存在 Date 取整边界抖动（core 未改动，非本批回归）。

## [未发布] — 双模型车道（PoC 免费网关 / 生产官方 API，2026-10-11，平台：doubao-work）

- 新增 `core/model-route.ts` 统一选路：默认 `poc`（provider `our-free-model` / `openrouter/free`，第三方免费插件 dsh-our-free-model v2.1.0，免 Key，仅概念验证）；`prod` 按 Key 优先 DeepSeek 官方、其次 Kimi 官方（休眠，待所有者给 Key）。
- 新命令 `/pm model mode poc|prod`、`/pm model status`；模式持久化于 pmtool checks 表；Web AI 助手加 PoC/生产分段开关与 PoC 警示。
- 生产车道无 Key 时中文友好提示，**不回退免费车道**；verify-model-route 新增。全 24 项 verify 绿。
- 详见 ADL-044。

## [未发布] — 可达性修复 + 导出/打磨（2026-10-11，平台：doubao-work）

- **必修**：会议表整行可点击打开详情抽屉（`.pm-meeting-row`），行末新增「详情/右箭头」按钮（`.pm-meeting-detail-btn[data-id]`），hover 高亮+可点击光标；行动项「转任务」按钮补 `.pm-action-promote[data-meeting][data-action]`、已转换 `.pm-action-promoted`。
- 导出 JSON 文件名加时间戳 `pmtool-snapshot-YYYYMMDD-HHmm.json`；导出/备份成功改为顶部 Notice 反馈（含路径/计数）。
- 顶栏备份/导出按钮补 tooltip；会议行动项计数补「已转任务 x / 共 y」tooltip。
- 第二档控件补稳定选择器并在 verify-web 加契约：`.pm-ai-wbs-raw`、`.pm-ai-confirm`、`.pm-row-select`、`.pm-batch-bar`、`.pm-batch-complete`、`.pm-batch-delete`、`.pm-sort-select`。
- 验证：全 23 项 verify + build 退出 0。

## [未发布] — 第二档补齐（T2-A 可编辑/T2-B 批量/T2-C XLSX/T2-D 导出，2026-10-11，平台：doubao-work）

- **T2-A**：WBS 预览改为可编辑 Markdown textarea，`task wbs --raw` 取草稿、`task importmd` 按编辑后文本落盘（不调模型）。
- **T2-B**：任务多选复选框 + 批量工具条（标为完成/批量删除级联二次确认）+ 排序下拉（截止/优先级/进度）；core `task batch update|delete`。
- **T2-C**：`.xlsx` 离线导入（SheetJS 0.18.5 Apache-2.0，动态 import 不进 client bundle）。
- **T2-D**：导出 JSON 经浏览器 Blob 直接下载；导出 Markdown 运行命令弹窗路径（双分支）。
- 验证：新增 verify-importmd / verify-batch / verify-xlsx；全 **23** 项 verify + build + frozen-lockfile 退出 0。裁剪见 ADL-042（narrate/summarize 可编辑、批量改负责人表单、快捷键）。

## [未发布] — 第二档体验增强 T2-A/T2-C（2026-10-11，平台：doubao-work / 豆包工作）

- **T2-A**：AI 助手内置 WBS 模板一键填入 + localStorage 记忆上次模式/目标（不入库）。
- **T2-C**：`core/csv-import.ts` 纯 JS 离线解析 CSV（引号/转义/CRLF），`/pm task import *.csv [confirm]` 按表头「层级/标题/负责人/优先级/开始/截止/进度」还原父子树，复用 `addTask`；替代被裁的 LibreOffice，零新增依赖。
- 裁剪（ADL-042）：XLSX 导入、WBS 可编辑预览二次落盘、任务多选批量删除/列排序本期不做。
- 验证：新增 `verify-csv.mjs`；修复 R4 export 不覆盖报错语义回归；全 20 项 verify + build + frozen-lockfile 退出 0。

## [未发布] — 第一档离线增强 R16/R17/R18（2026-10-11，平台：doubao-work / 豆包工作）

- **R16 临期/逾期提醒**：新增 `core/reminders.ts`、`commands/due.ts`（`/pm due [天数] [项目ID?]`）、Web `ReminderStrip`；纯读时派生、不新增表、不做常驻调度（ADL-039）。验证：`verify-reminders.mjs`。
- **R17 会议行动项转任务**：`core/meetings.promoteActionToTask`（幂等回写 `action.taskId`）+ `meeting action promote` 命令 + Web 「转任务」按钮（ADL-040）。验证：`verify-promote.mjs`。
- **R18 备份/恢复**：`core/backup.ts` 扩到七实体、`commands/backup.ts`（`/pm backup` / `/pm restore ... confirm` 两步且恢复前自动安全快照）+ Web 一键备份按钮 + 新增 `docs/backup-sync.md`（云同步单写者指引）（ADL-041）。验证：`verify-backup.mjs`。
- 影响：均离线、不依赖 LLM、不新增宿主路由、配色仅用宿主 token；`backups/` 已加入 `.gitignore`。全量 build + verify（含新增 3 个专项）退出 0。

## [未发布] — A1 修复：AI 助手命令误带 /pm 前缀导致「不支持的命令」 + 补全不可发现深挖（2026-10-11，平台：doubao-work / 豆包工作）

- **改动文件**：`src/client/panel.tsx`、`scripts/verify-web.mjs`，及 KB-037 / ISS-026 / 本 changelog / 发布说明。
- **做了什么**：
  - **必修 bug（真实 Chrome 验收发现）**：`AiAssistant.lines()` 三条命令误拼了 `/pm ` 前缀（`/pm task wbs …`、`/pm report narrate …`、`/pm meeting summarize …`），而面板 execute 桥把整行直接喂给 `pm` handler、handler 只匹配裸子命令（`task`/`report`/`meeting`…），故三条都落空走到「不支持的命令」、根本没调模型。已改为裸子命令（`task wbs …` / `report narrate …` / `meeting summarize …` 及其 confirm 变体），与面板其它调用一致。
  - **Web 级联删除链路自查**：任务表单删除按钮现按 `data.tasks` 现场计算该任务子树大小——有子任务时弹窗明确「将同时删除 N 个子任务…不可撤销」并走 `task delete <id> cascade confirm`；无子任务维持原 `task delete <id> confirm`。
  - **补全调研结论**：欢迎页斜杠补全无 pm，经上游只读确认为宿主 `commands.list(agent)` 与会话/预置缓存决定，且插件侧 `commandUi.register` contribution 与 host 重名会抛 collision，**无受支持的插件侧做法**让 pm 进补全（详见 KB-037 源码路径）。
- **验证**：`pnpm run build` 绿；**全部 16 个 verify-*.mjs 退出 0**（verify-web 新增「裸子命令串 + 禁止 `/pm ` 前缀回归」断言）；`git diff --check` 干净。
- **影响范围**：A1 三按钮现在能真正调起模型草稿；Web 删除父任务走级联确认。

## [未发布] — A1 AI 助手 Web 面板 + A2 任务级联删除 + 首页 /pm 根因定位（2026-10-11，平台：doubao-work / 豆包工作）

- **改动文件**：`src/core/tasks.ts`、`src/commands/task.ts`、`scripts/verify-cascade.mjs`、`src/client/panel.tsx`、`src/client/panel.css`、`scripts/verify-web.mjs`，及 docs（ADL-037/038、KB-037、ISS-025/026、本 changelog、release v0.2.0 草稿）。
- **做了什么**：
  - **A2 级联删除**（ADL-037）：新增 `collectTaskSubtree`/`deleteTaskCascade`；`/pm task delete <id>` 无 confirm 先 dry-run 列出整棵子树；`confirm` 有子任务仍拒绝并引导；`cascade confirm` 才真删整棵、旁支不动；保留会议行动项跨表引用保护。新增 verify-cascade（dry-run 不落盘/拒绝不写盘/删3留旁支/重启读回）。
  - **A1 AI 助手 Web 面板**：项目工作台顶栏新增「AI 助手」按钮，三模式（拆解 WBS/汇报叙述/会议纪要）弹窗——「生成草稿」发一次预览命令（调一次模型），「确认入库」发 confirm 命令（复用进程内草稿缓存、不再调模型）；含 loading/按钮禁用防重复/中文错误/结果先预览显式确认才入库。**完全复用既有 core 与斜杠命令，未另写 LLM 调用层**。
  - **首页 /pm 根因**（ADL-038 / KB-037 / ISS-026）：注册结构与内置 command-goal 一致，问题属宿主 composer（斜杠补全截获 Enter、发送后主区不自动跳转）；插件无扩展点改宿主行为，以「点发送按钮+侧栏点最新会话」用法与 Web 面板为稳定入口，不假装修好。
- **验证**：`pnpm run build` 绿；**全部 16 个 verify-*.mjs 退出 0**（含新增 verify-cascade 与 verify-web 的 AI 面板契约）；`pnpm install --frozen-lockfile` 通过；`git diff --check` 干净。
- **影响范围**：新增 Web 入口与显式级联删除；旧命令行为与离线/确定性能力不变；配色仅用宿主 token。

## [未发布] — R13/R14/R15 真实 openrouter/free 端到端验证通过 + 超时中文归一加固（2026-10-11，平台：doubao-work / 豆包工作）

- **真实端到端（凭据库启动、无环境变量）**：
  - R13 `/pm task wbs p-0005 <企业官网改版目标>` → AI 产出 5 级 WBS，confirm 落盘 25 个任务（t-0003~t-0027，需求梳理/视觉设计/前后端开发/测试验收/上线 及 1.1~5.4 子任务）。
  - R14 `/pm report narrate p-0005` confirm → rpt-0002，executiveSummary 为依据确定性数字（0/25 完成、0%）撰写的真实中文叙述，**数字未被改动**。
  - R15 `/pm meeting summarize p-0005 <周会速记>` confirm → mtg-0001，解析出 议题3/决议2/行动项3（ai-001~003：张三/李四/王二）。
  - 无环境变量重启后 list 均读回；验证后临时项目 p-0005 及关联数据已删净。约 4~5 次真实模型调用。
- **加固**：`core/ai-client.ts` 的 `normalize()` 增加超时/中断识别（AbortError/ABORTED/TIMEOUT/ETIMEDOUT/匹配 abort|timeout 文案），归一为中文 `MODEL_TIMEOUT` 提示，不再把英文 `This operation was aborted` 直抛界面、不落库；verify-wbs 新增对应降级断言（stream reject AbortError → 中文提示、不写盘）。
- 新增档案：KB-036（免费池偶发超时 + Web 斜杠命令须点发送按钮、不能回车）、ISS-025（任务删除不级联，叶子→根逐层删）。

## [未发布] — R15 会议纪要归纳（2026-10-11，平台：doubao-work / 豆包工作）

- 新增能力：`/pm meeting summarize <项目ID> <粘贴速记> [confirm]`——AI 把原始速记归纳为 标题/摘要/议题/决议/行动项(负责人·截止日)，先预览草稿不落盘，confirm 才建 draft 会议并逐条挂行动项（复用既有 `addMeeting`/`addMeetingAction`）。
- 新增文件：`src/core/meeting-summarize.ts`（```json ``` 围栏剥取 + 防御性归一 + 草稿缓存）、`scripts/verify-meeting-ai.mjs`。
- 修改文件：`src/commands/meeting.ts`（summarize 子命令）、`src/index.ts`（meeting 分发传入 llm）。
- 降级：模型返回非 JSON / 失败 → 中文提示并引导手工 `/pm meeting add`；既有会议 CRUD 不受影响。
- 至此三功能（R13/R14/R15）代码完成，共 15 项 verify 全过。

## [未发布] — R14 进度汇报 AI 叙述（2026-10-11，平台：doubao-work / 豆包工作）

- 新增能力：`/pm report narrate <项目ID> [confirm]`——基于确定性采集（任务/里程碑/逾期统计）让 AI 只写「本周进展/风险/下周计划」段落，先预览不落盘，confirm 才把叙述写入既有进度快照的 `executiveSummary` 字段（**零 schema 改动**，复用 R9 `generateProgressReport`）。
- 新增文件：`src/core/report-narrate.ts`（确定性 brief 构造 + 叙述生成 + 草稿缓存）、`scripts/verify-report-ai.mjs`。
- 修改文件：`src/commands/progress-report.ts`（narrate 子命令）、`src/index.ts`（report 分发传入 llm）。
- 降级：模型失败（QUOTA/RATE_LIMIT…）→ 中文提示并引导 `/pm report generate` 确定性快照，台账不受影响。
- 安全：AI 只用我方给的数字，不编造、不碰台账；叙述为草稿，confirm 才落库。

## [未发布] — R13 智能 WBS 任务拆解（AI 草稿）（2026-10-11，平台：doubao-work / 豆包工作）

- 新增能力：`/pm task wbs <项目ID> <一句话目标> [confirm]`——AI 把目标拆解为 GitHub 缩进勾选清单，先 dry-run 预览（WBS 投影编号、不落盘），confirm 才复用草稿落盘为任务树（父子/编号沿用 `task import` 链路，confirm 不重复调模型）。
- 新增文件：`packages/dsh-pm-tool/src/core/ai-client.ts`（一次性文本生成封装：`ctx.llm.prepareCall`+`BlockAssembler`，按 `error.code` 归一为中文降级提示）、`src/core/wbs-ai.ts`（WBS 提示词 + 草稿缓存）、`scripts/verify-wbs.mjs`。
- 修改文件：`src/commands/task.ts`（wbs 子命令）、`src/index.ts`（inject 加 `llm`）、`package.json`（peer+dev 加 `@deepseek-ai/dsh-llm@0.2.1-alpha.2`）。
- 降级：无 key / 限流 / 空正文 → 中文提示并引导手工 `/pm task add`；核心任务台账离线可用（inject 缺 llm 时插件照常加载，13 项 verify 全过）。
- 技术依据：一次性调用范本 `deepseek-harness/packages/session/session-title-llm/src/index.ts`；默认路由 `openrouter-free`/`openrouter/free`。

## [未发布] — 生成型功能（智能 WBS/会议纪要/进度汇报叙述）正式立项：设计评审稿 + ADL-036（2026-10-11，平台：doubao-work / 豆包工作）

- 新增文件：`docs/generative-features-plan.md`——三功能立项设计与技术依据（一次性 LLM 调用真实 API 骨架、落点复用、降级策略、推荐开发顺序、文件级改动计划、待所有者拍板的决策点）。
- 修改文件：`docs/decision-log.md`（新增 ADL-036）、`docs/requirements.md`（新增 R13/R14/R15 评审稿，标注待编码）。
- 核心设计原则（ADL-036）：LLM 只做一次性文本生成、不依赖 function calling；确定性采集/校验/落盘全在我方代码；AI 输出一律草稿、confirm 才入库；无 key/失败优雅降级；每次生成只发一次模型请求省免费额度。
- 技术依据（已核实上游源码）：一次性调用范本 `packages/session/session-title-llm/src/index.ts`（`ctx.llm.prepareCall` + `BlockAssembler`）；错误按 `error.code`（RATE_LIMIT/QUOTA/INVALID_CREDENTIAL…）归一；智能 WBS 复用 `core/task-import.ts`、纪要复用 meeting 实体、汇报叙述叠加 `collectProjectReport` 确定性数字。
- 状态：本批为**立项设计 + 档案**，尚未编码；随后按里程碑逐个实现（智能 WBS → 进度汇报叙述 → 会议纪要归纳）。

## [未发布] — dsh 应用内 openrouter/free 实测打通 + MISSING_CREDENTIAL 排查沉淀（仅文档）（2026-10-11，平台：doubao-work / 豆包工作）

- 修改文件（**仅 docs，无业务代码、无 key 本体、无临时 PID/端口**）：
  - `docs/model-providers.md`：第 4.1 节状态推进为「dsh 应用内对话已实测通过（Free Models Router 一次成功）」；新增 **4.2 故障排查小节**（应用内报 `MISSING_CREDENTIAL`/“OPENROUTER_API_KEY which is not set” 的现象、根因、两种解法与诊断命令）。
  - `docs/knowledge-base.md`：新增 KB-035（MISSING_CREDENTIAL 排查：dsh 进程环境 vs credentials service；含「dsh 单轮约 9.5K tok、免费档按次计费不按 token」观察）。
  - `docs/issues-and-solutions.md`：新增 ISS-024（对应 MISSING_CREDENTIAL：现象/根因/解法/避坑）。
  - `docs/progress.md`、`docs/handoff.md`、`docs/onboarding-prompt.md`：把「仅剩 Web 点选确认」刷新为「模型通道（含 dsh 应用内对话）已全部实测打通；下一步仅待所有者决定是否立项生成型功能」。
- 实测事实（2026-10-11）：所有者首次在 dsh 网页选 Free Models Router 发「你好」报 `MISSING_CREDENTIAL`——根因是当时运行的 dsh 进程由「写 key 之前的旧终端」启动、进程环境无 `OPENROUTER_API_KEY`（key 本身有效，直连已 $0）；`ps eww -p <dsh pid>` 核实旧进程无该变量、全新 zsh 能读到（长度 73）。停旧 dsh、用已 `source ~/.zshrc` 的环境重启后，底部模型选择器选 Free Models Router 发「你好，用一句话介绍你自己」**第 1 次即成功**（puppeteer-core + 系统 Chrome 139 无头，KB-032）：助手正常回复、状态「已完成」、无 MISSING_CREDENTIAL/401/429，页脚约 9.5K tok（免费档按次计费，不按 token）。截图 `.tmp/ui-verify/llm-04-result-1.png`（gitignored，不入库）。
- 影响范围：仅文档口径同步；业务代码、数据、上游、profile 配置零改动。

## [未发布] — 修正一处残留错误启动命令并实测正确启动（2026-10-11，平台：doubao-work / 豆包工作）

- 修改文件（仅 docs）：`docs/progress.md` 第 103 行把错误的 `pnpm dsh --profile pm web` 改为 `pnpm dsh --profile pm`（指定 profile 后再加 `web` 会被当成 Web 应用的多余位置参数，报 "too many arguments. Expected 0 arguments but got 1: web"，即 ISS-007 记录的坑）；并把生成型能力前置条件刷新为「模型通道已就绪（ADL-035/KB-034），是否立项待所有者决定」。
- 为什么 / 影响范围：所有者照该命令启动时实际踩到该报错；仓库其余位置（tech-plugin-scaffold、knowledge-base、issues-and-solutions）口径本就正确，仅此一处残留。仅文档，无业务代码改动。
- 验证（2026-10-11，本机）：在上游目录用修正后的命令（等价 `node --import tsx/esm apps/cli/src/bin.ts --profile pm --no-open --port 0`，继承 ~/.zshrc 的 key）启动成功——日志出现 `[pm-tool] 存储领域 pmtool 已打开` 并打印带 token 的 `http://127.0.0.1:<port>/?token=...`，首页 HTTP 303（loopback cookie 鉴权正常），无 pi-ai/openrouter 报错；验证后已结束该测试进程、端口释放。

## [未发布] — OpenRouter key 已本机配置、openrouter/free 直连实测成功（仅文档状态同步）（2026-10-11，平台：doubao-work / 豆包工作）

- 修改文件（**仅 docs，无业务代码、无 key 本体**）：
  - `docs/model-providers.md`：第 4.1 节「尚未获得 key / 直连 401 属预期」改写为「key 已在所有者本机 `~/.zshrc` 配置（不入库）、openrouter/free 直连已于 2026-10-11 实测成功（$0、随机模型示例见 KB-034）」；并补一条经验——推理型免费模型会先吃满 `reasoning_tokens`，`max_tokens` 要给足（建议 ≥400），否则正文为空。
  - `docs/knowledge-base.md`：新增 KB-034（openrouter/free 免费自动路由实测行为：随机分配模型、纯文本 $0 可用、推理型吃满 reasoning tokens、每日 50 次、稳定 function-calling 不保证、核心台账保持离线）。
  - `docs/progress.md`、`docs/handoff.md`、`docs/onboarding-prompt.md`、`docs/requirements.md`：把「待所有者给 key / 当前无 key / 直连 401 属预期」统一刷新为「key 已本机配置、端点实测通过，仅剩所有者在 dsh Web 设置→模型点选 openrouter-free 发一句做应用内确认」。
- 实测事实（2026-10-11，所有者授权本机直连）：`GET /v1/key` 返回 `is_free_tier: true`、`free_model_daily_requests.limit = 50`、key 到期 2027-04-09；`POST /v1/chat/completions`（`model=openrouter/free`）两次真实调用均成功、`cost=$0`、`finish_reason=stop`（随机落到 `liquid/lfm-2.5-2.6b:free` 与 `nvidia/nemotron-3-ultra-550b-a55b:free`）。key 本体只在所有者本机 `~/.zshrc`（改前已备份 `~/.zshrc.bak-20261011-130537`），**不入库、不写入任何仓库文件**。
- 为什么：模型通道已从「待给 key」推进到「端点实测打通」，需同步档案口径，避免后续接手者误以为还在等 key。
- 影响范围：仅文档；业务代码、数据、上游、profile 配置零改动；下一步是否立项做生成型功能（智能 WBS/纪要/周报）仍待所有者决定。

## [未发布] — 配置零成本 OpenRouter 免费 LLM 通道（openrouter/free）+ 预留其他官方厂商接入位（2026-10-11，平台：doubao-work / 豆包工作）

- 新增文件：
  - `docs/model-providers.md`：模型接入通道可移植文档。记录工作原理（第三方 OpenAI 兼容模型走 `@deepseek-ai/dsh-llm-pi-ai` 的 `providers` 字典，不改 `DEEPSEEK_BASE_URL`）、当前启用的 OpenRouter 免费自动路由完整配置、key 从哪取/放哪（只放进程环境变量、dsh 不自动读 `.env`、绝不入库）、9 家预留但不启用的官方端点（DeepSeek 官方/OpenAI/Anthropic/Gemini/Groq/硅基流动/智谱 GLM/阿里百炼/本地 Ollama）注释 YAML 模板、切换/停用/升级上游复查点，以及所有者「约 3 分钟开通+验证」步骤与不依赖 dsh 的直连自检 curl。
- 修改文件：
  - `docs/decision-log.md`：新增 ADL-035（采用 OpenRouter 免费自动路由作零成本尽力而为 LLM 通道、核心保持离线、其他官方厂商以预留模板保留、免费随机模型不保证工具调用）。
  - `docs/knowledge-base.md`：新增 KB-033（llm-pi-ai 第三方 OpenAI 兼容端点配置 + profile 按 id 外挂 + apiKeyEnv 密钥不入库、不自动读 .env）。
  - `docs/requirements.md`、`README.md`、`docs/progress.md`、`docs/handoff.md`、`docs/onboarding-prompt.md`：生成型能力注记（**通道已就绪、具体功能仍待立项**）、文档地图加 `model-providers.md`、交接快照刷新。
- **仓库外改动（不入库，仅记录便于他机复现）**：`~/.dsh/profiles/pm/cordis.patch.yml` 在原有 `storage-json`、`ui-settings-general` 之外追加 `- id: llm-pi-ai ... providers.openrouter-free`（改前已备份为同目录 `cordis.patch.yml.bak-before-openrouter`）。`@deepseek-ai/dsh-llm-pi-ai` 本就随 base bundle 装载（原本零路由休眠），**未新装任何插件、未写任何 key**。
- 为什么：项目所有者拍板方案 B——先把零成本 OpenRouter 免费通道配好用于未来生成型能力，同时预留其他官方模型接入位但暂不启用；本批只做「模型通道配置 + 可移植文档 + 加载验证」，不实现具体 AI 业务功能（智能 WBS/纪要/周报仍按 ADL-032 暂缓）。
- 验证：`pnpm install --frozen-lockfile` 干净；`pnpm run build` 退出码 0（client bundle 153.00 kB）；**12 个** `verify-*.mjs` 全部退出码 0；`DSH_HOME=~/.dsh pnpm dsh --profile pm --dump-config` 退出码 0、组合中出现 `providers.openrouter-free` 且 `storage-json` root / `dsh-pm-tool` 完好；无 Key 真实宿主启动（随机端口、`[pm-tool] 存储领域 pmtool 已打开`、无 pi-ai/openrouter 启动报错），运行中下发的 `plugins/??dsh-pm-tool/client.js` 合并 bundle HTTP 200（153033 B、含 70 处 pm 界面串；无 cookie 访问根路径 401）。
- 边界与待办：当前**无 `OPENROUTER_API_KEY`**，真实对话未测（无 key 时 OpenRouter 直连返回 401 属预期）；待所有者填入 key 后按 `docs/model-providers.md` 第 4 节做一次真实对话即可最终确认。OpenRouter 免费限额（约 20 次/分、充值 <$10 时 50 次/天）与 slug 均以官网为准、可能变动。
- 影响范围：仅新增通道配置文档与档案；业务代码、数据、上游零改动；核心离线台账能力不受影响。

## [未发布] — Chrome 真实浏览器自动目视闭环 + 窄屏标签修复 + 浏览器/上游兼容决策（2026-10-11，平台：doubao-work / 豆包工作）

- 修改文件：
  - `packages/dsh-pm-tool/src/client/panel.css`：`.pm-view-tab` 增加 `white-space:nowrap; flex:0 0 auto`。为什么：390px 窄屏下视图标签此前被压到中文逐字断行（「全部任务」折成「部/任」），不美观；改为标签保持单行、标签条在 `≤760px` 容器查询下已有的 `overflow-x:auto` 内局部横滚，整页仍无横向溢出。
- 为什么：项目所有者要求「在请他本机抽检前，先用真实 Google Chrome 把 R5/R7–R12 面板完整自验一遍」。本角色此前无 GUI 权限，浏览器目视只能退化为 HTTP bundle 探测（KB-028）或等所有者手动。本批按 KB-032 首次做到了**无辅助功能授权、不另装 Chromium** 的真实 Chrome 自动点击/截图/主题/窄屏/控制台网络断言。
- 验证：`pnpm install --frozen-lockfile` 干净；`pnpm run build` 退出码 0（client bundle 153.00 kB）；**12 个** `verify-*.mjs` 全部退出码 0；`git diff --check` 干净。隔离 DSH_HOME（ISS-019）+ 富种子 + 随机端口 + 无 Key 启动真实宿主后，puppeteer-core 驱动本机 Chrome 139 逐屏操作：**27/27 用例通过，0 console error / 0 pageerror / 0 失败请求 / 0 同源 4xx-5xx**；看板统计数值与种子一致；浅/深色可读；786px 与 390px 整页无溢出。
- 决策沉淀：ADL-033（浏览器兼容仅 Chrome，Safari/Firefox 本期不支持）、ADL-034（上游 dsh 新版本兼容策略：peer 锁 v0.2.1-alpha.2 + profile link 装载 + 升级冒烟流程）；新增 KB-032（puppeteer-core + 系统 Chrome headless 自动目视法）。
- 影响范围：仅一处 CSS 窄屏体验微调 + 文档；业务逻辑、数据、上游零改动。截图存 `.tmp/ui-verify/shots/`（gitignored，不入库）。

## [未发布] — R12 关键字检索 / 统计看板 / Markdown 任务表导入（2026-10-11，平台：doubao-work / 豆包工作）

- 新增文件：
  - `packages/dsh-pm-tool/src/core/search.ts`：全库关键字检索（只读、不写盘）。对项目/任务/里程碑/风险问题/会议/汇报/交付物的关键文本做不区分大小写子串匹配，按类型分组稳定排序；`--type` 可选七类之一，非法类型中文报错。
  - `packages/dsh-pm-tool/src/core/stats.ts`：统计看板聚合（只读）。全项目或单项目：项目按状态计数、任务完成率、逾期任务/里程碑、未关闭风险按严重度、会议/汇报计数、交付物四态计数；`today` 可注入以保证验证确定性。
  - `packages/dsh-pm-tool/src/core/task-import.ts`：Markdown 任务表离线导入。解析 GitHub 风格缩进勾选清单（`- [ ]`/`- [x]`），按观测到的最小缩进步长归一化为 WBS 层级，缩进栈还原父子关系，复用 `addTask` 的编号/父级校验；`[x]` 记为已完成（progress=100）。dry-run 只投影预览不落盘。
  - `packages/dsh-pm-tool/src/commands/search.ts`、`src/commands/stats.ts`：`/pm search`、`/pm stats` 离线命令，全中文输出。
  - `packages/dsh-pm-tool/scripts/verify-r12.mjs`：专项验证（检索跨类与类型过滤、统计口径与逾期/风险聚合、导入 dry-run 不写盘与 confirm 落盘、缩进→WBS、[x] 已完成、负例与全新子进程读回）。
- 修改文件：
  - `commands/task.ts`：新增 `task import <projectId> <filePath> [confirm]` 子命令与帮助、错误类接线。
  - `index.ts`：注册 `search`/`stats` 路由与帮助、命令描述/hint；snapshot 已含全部表，无需扩。
  - `client/panel.tsx`：顶部新增「总览看板」开关，浏览器端基于 snapshot 派生跨项目统计卡片（项目总数/任务完成率/逾期项/未关闭风险）、逐项目明细与全局搜索框（与离线 `/pm search` 同口径）；颜色全部复用宿主 token。
  - `client/panel.css`：`.pm-board*` 样式（统计卡片、逐项目卡片、命中列表），容器查询窄屏单列，无硬编码 hex。
  - `scripts/verify-web.mjs`：bundle/css 契约增加 R12 界面串与 `.pm-board-projects` 断言。
- 为什么：实现需求 R12「关键字检索 + 统计看板 + 外部任务表导入」。检索/看板为只读派生视图，数据始终以各表现状为准；Web 看板与全局搜索做成浏览器端基于现有 snapshot 的派生，不新增宿主路由、不引入硬编码色（ADL-029）。Excel 导入（依赖 skill-office/LibreOffice、重）与多人实时协作（与 ADL-009 单用户本地离线定位冲突）本期裁剪（ADL-030/ADL-031）。
- 验证：`pnpm install --frozen-lockfile` 干净；`pnpm run build` 退出码 0（tsc 零错误，client bundle 152.96 kB）；**12 个** `verify-*.mjs` 全部退出码 0（新增 verify-r12.mjs）；`git diff --check` 干净；隔离 DSH_HOME + 隔离临时数据 + 随机端口 + 无 Key 真实宿主启动，存储领域打开、首页 303 种 cookie 鉴权，抓取含 `dsh-pm-tool/client.js` 的合并路由（HTTP 200，578732 B）断言含「总览看板/跨项目搜索/项目总数/任务完成率/逐项目明细」。
- 影响范围：仅新增检索/统计/导入能力与对应界面/测试，不改既有实体字段；业务数据与上游零改动。本机浏览器目视（看板卡片、全局搜索交互、窄屏）以项目所有者手动确认为准（KB-014/ADL-027）。

## [未发布] — R10 项目维度交付物台账（2026-10-10，平台：doubao-work / 豆包工作）

- 新增文件：
  - `packages/dsh-pm-tool/src/core/deliverable.ts`：交付物字段与 zod 校验（四态状态机、内嵌 `history[]` 变更留痕 schema、create/update 校验与中文错误描述）。
  - `packages/dsh-pm-tool/src/core/deliverables.ts`：离线 CRUD；创建写 `created` 留痕，状态/版本实际变化时按序追加只增留痕（支持 operator/changeNote），编号 `dlv-NNNN` 扫表续号，写操作走 `enqueueDomainWrite`。
  - `packages/dsh-pm-tool/src/commands/deliverable.ts`：`/pm deliverable add/list/get/update/delete` 五子命令，全中文输出与删除二次确认，详情倒序展示变更留痕（状态显示中文标签）。
  - `packages/dsh-pm-tool/scripts/verify-deliverables.mjs`：专项验证（CRUD、状态筛选、留痕追加规则、并发编号、写盘失败恢复、项目删除保护、0600/0700 权限、全新子进程 `--reopen` 读回续号）。
- 修改文件：
  - `core/storage.ts`：pmtool 领域注册新表 `deliverables`（**领域版本仍为 1**，KB-013）。
  - `core/projects.ts` + `commands/project.ts`：新增 `ProjectHasDeliverablesError`，有交付物的项目禁止删除并给中文提示。
  - `index.ts`：注册 deliverable 路由与帮助、命令描述/hint，`web snapshot` 增加 `deliverables`。
  - `client/panel.tsx`：新增「交付物」视图标签、交付物表格（状态筛选/搜索/变更次数列）、新增/编辑抽屉与只读变更留痕时间线、项目栏交付物计数，状态标签配色复用宿主 token。
  - `client/panel.css`：`.pm-deliverable-table` 与 `.pm-deliverable-history` 样式，submitted/accepted 状态色，无硬编码色值。
  - `scripts/verify-web.mjs`：种子数据、快照断言与 bundle/css 契约增加交付物项。
- 为什么：实现需求 R10「项目维度交付物台账，记录版本与状态变更」。dsh 原生 deliverables 绑定 agent 轮次/git 快照、不适合无 Key 离线手工台账，故复用其概念、数据层按 R7–R9 同款模式自研（ADL-028）。
- 验证：`pnpm install --frozen-lockfile` 干净；`pnpm run build` 退出码 0（tsc 零错误，client bundle 140.47 kB）；**11 个** `verify-*.mjs` 全部退出码 0；`git diff --check` 干净；隔离 DSH_HOME + 临时数据 + 随机端口 + 无 Key 真实宿主启动，存储领域打开、首页带 cookie 200，经单插件合并路由 `/plugins/??dsh-pm-tool/client.js&rev=` 抓到运行中 bundle（140500 B）断言含「交付物/筛选交付物状态/deliverable add/变更留痕/新增交付物」。
- 影响范围：仅新增交付物实体与其界面/测试，不改既有实体；业务数据与上游零改动，隔离临时数据仅含宿主 `workspace.json`。本机浏览器目视项以项目所有者手动确认为准（KB-014/ADL-027）。

## [未发布] — R9 独立复核通过并提交推送（2026-10-10，平台：doubao-work / 豆包工作）

- 改动文件：仅文档（本条及需求/进度/交接/决策/知识库等档案）；**未改动任何 R9 业务代码**——独立复核未发现缺陷，按 TRAE 交付原样接收。
- 做了什么：接手 TRAE 未提交的 R9 增量，先 `git status` 保护现场（未 pull、未覆盖、未重做），完成独立复核后随本提交一并推送 origin/main。
- 独立验证证据（命令与结果均在本机实测）：
  - 冻结安装 `pnpm install --frozen-lockfile` → Already up to date，退出码 0；
  - 构建 `pnpm run build`（tsc + 复制 css + tsdown client bundle）→ 退出码 0，无类型错误，产出 `lib/core/progress-report*.js` 与 `lib/client.js`；
  - 十个 `scripts/verify-*.mjs` 全部退出码 0，其中 `verify-reports.mjs` 覆盖自定义周期、五类异常聚合与排序、旧快照不回写/新快照更新、人工字段更新、8 类非法输入、Markdown 内容与 0600/拒覆盖/confirm、写盘失败恢复、4 并发编号、删除提示与 confirm、有报告禁删项目、全新子进程 `--reopen` 读回 5 份并续增 rpt-0007；
  - `git diff --check` 与新增文件行尾检查无空白错误；
  - 隔离 `DSH_HOME`（仓库内 `.tmp/r9-verify/`，已 gitignore）+ 隔离数据目录 + 随机端口 + 无 API Key 启动真实 `pnpm dsh --profile pm --no-open --port 0`：日志出现 `[pm-tool] 存储领域 pmtool 已打开`；带 token 首页跟随重定向 HTTP 200、无 token 401；启动清单含 `dsh-pm-tool/client.js`；抓取运行中服务实际下发的合并 client bundle（cookie 鉴权）断言含「进度汇报/筛选汇报状态/report generate/report export/固定快照/异常项/pm-report-table」。
- 边界（如实记录）：doubao-work 当前角色无 Mac 本机 GUI 驱动权限（`mac_computer_use_tool` 不支持、`computer_use_tool` 的 `cu` 不支持、`bu` 为隔离 Linux 且 loopback 不通），浅/深主题点击、786px 窄屏点击、控制台/网络的**人工目视**项无法由本侧独立复现；这些项由 ① `verify-web.mjs` 主题 token/无硬编码色/响应式契约、② 真实宿主下发新 bundle、③ TRAE 已完成的隔离真实浏览器记录（见下条与 test-cases）共同覆盖，最终以项目所有者本机手动确认为准（KB-014 / ISS-010）。
- 收尾：隔离测试服务已停止、随机端口已释放、隔离数据仅含宿主 `workspace.json`；真实 `data/` 与上游 `deepseek-harness` 无改动。
- 影响范围：R9 状态由「待验收」推进为「独立复核通过并推送」；不改变 R9 功能与数据模型。

## [未发布] — R9 固定快照进度汇报（2026-10-10，平台：trae / TRAE）

- 新增 `progress-report.ts`、`progress-reports.ts`、`progress-report-markdown.ts` 和 `commands/progress-report.ts`：实现自定义周期、固定快照、异常聚合、离线 CRUD 和精简 Markdown 导出。
- 修改 `storage.ts`、`projects.ts`、`commands/project.ts`、`index.ts`：增加 `reports` 表、项目删除保护、命令路由和 Web snapshot。
- 修改 `client/panel.tsx`、`panel.css`：新增“进度汇报”高密度表格、状态筛选、搜索、固定快照抽屉、异常列表和导出入口。
- 新增 `verify-reports.mjs`，扩展 `verify-web.mjs`；新增两份 R9 设计/实施计划，并同步需求、决策、测试、交付和接续档案。
- 原因与影响：按项目所有者确认的“自定义日期范围 + 固定快照 + 默认只含摘要和异常项”实现 R9；新增 `data/pmtool/reports/`，不修改上游。
- 验证：冻结安装、构建和十个验证脚本全部退出码 0；隔离 profile 真实浏览器验证旧快照不随任务变化、新快照反映最新状态、编辑、Markdown 导出、筛选、深色主题、786px 窄屏及重启读回。

## [未发布] — R8 会议纪要管理（2026-10-10，平台：trae / TRAE）

- 修复行动项表单固定列宽超过抽屉内容区的问题，改为两列自适应网格，窄屏退化为单列。
- 修复“保存会议”只保存会议基础字段的问题：现在会顺序保存所有已有行动项，并保存已填写但未单独点击“添加”的新行动项；任一步失败均保持抽屉打开。
- 新增 `docs/plans/2026-10-10-r8-meeting-notes-design.md`：固化完整字段、业务规则、离线命令、Web 交互、错误处理和验收标准。
- 新增 `docs/plans/2026-10-10-r8-meeting-notes.md`：给出 schema、CRUD、行动项关联、Web、回归和档案同步的文件级实施步骤。
- 新增 `src/core/meeting.ts`、`src/core/meetings.ts`、`src/commands/meeting.ts`：实现会议与稳定行动项 schema、离线 CRUD、排序、任务/问题关联和删除保护。
- 修改 `storage.ts`、`projects.ts`、`tasks.ts`、`risk-issues.ts` 及对应命令：增加 `meetings` 表、项目删除保护和被会议引用对象的删除保护。
- 修改 `index.ts`、`client/panel.tsx`、`client/panel.css`：接入 Web 快照、会议高密度表格、筛选搜索和会议/行动项右侧抽屉。
- 新增 `scripts/verify-meetings.mjs` 并扩展 `verify-web.mjs`；同步 README、测试、交付、进度、交接和知识档案。
- 更新 `docs/requirements.md` 至 v0.6，并新增 ADL-025：首版采用内嵌稳定行动项，未来通过幂等 promote 操作转 WBS 任务。
- 原因与影响：落实项目所有者选择的方案 1，并为方案 3 保持数据兼容；新增 `data/pmtool/meetings/`，不修改上游和已发布导出格式。
- 验证：冻结锁文件安装、构建和九个 `verify-*.mjs` 全部退出码 0；隔离 profile 真实浏览器 CRUD、关联、筛选、深色主题、786px 窄屏及重启读回通过。

## [未发布] — R7 风险与问题管理（2026-10-10，平台：trae / TRAE）

### 改动文件与内容
- 新增 `src/core/risk-issue.ts`、`risk-issues.ts` 和 `src/commands/risk-issue.ts`：实现 strict schema、类型专有字段约束、统一业务队列、`ri-NNNN` 编号及 `/pm risk-issue` 离线 CRUD/筛选/确认删除。
- 修改 `storage.ts`、`projects.ts`、`commands/project.ts`、`index.ts`：增加 `risk_issues` 表、项目删除保护、命令路由和 Web snapshot。
- 修改 `src/client/panel.tsx`、`panel.css`：增加风险与问题标签页、高密度表格、搜索、类型/状态筛选及右侧新增/编辑抽屉，继续跟随 dsh 原生主题。
- 新增 `scripts/verify-risk-issues.mjs`，扩展 `verify-web.mjs`；新增两份 R7 设计/实施计划。
- 更新根/包 README、AGENTS 及 requirements、decision-log、knowledge-base、issues、test-cases、delivery、progress、handoff、onboarding 等权威档案。

### 原因与影响
- 按项目所有者确认的单表模型完成 P1 的 R7；不新增插件包、不修改上游、不依赖 API Key。
- `pmtool` 领域版本保持 1，只新增 `risk_issues` 表；现有项目数据无需迁移。R4 Markdown 和整库 JSON 格式本批不升级。

### 验证
- 环境：macOS 15.6.1 arm64、Node v22.23.3、pnpm 11.28.5。
- `pnpm install --offline --frozen-lockfile`、`pnpm run build` 和 command/export/milestones/projects/risk-issues/storage/tasks/web 八个脚本全部退出码 0；风险问题专项覆盖 CRUD、筛选、字段组合、并发编号、失败恢复、权限、项目删除保护和全新进程读回。
- 隔离 `DSH_HOME` 和隔离数据目录真实浏览器验证：新增风险/问题、编辑关闭、类型/状态筛选、搜索、确认删除、重启读回均通过；786px 窄屏表格局部滚动，浅色/深色随宿主切换，控制台和网络无错误；临时服务已停止。
- 项目所有者随后使用真实 `pm-tool/data` 手动验证通过，并明确授权本批提交和推送。
- 首次表名使用连字符失败，已按 ISS-020 改为 `risk_issues`。

## [0.1.0] — MVP 首个可用版本（2026-10-10，平台：trae / TRAE）

- 发布 R1–R6 MVP：项目计划、三级 WBS、里程碑、可读 JSON 持久化、Markdown/整库 JSON 导出、离线命令和 dsh 顶级 Web 工作台。
- R5 Web 跟随 dsh 原生主题，项目所有者已完成手动验收；阶段 4 测试矩阵、交付说明、完整回归和真实宿主启动验证全部通过。
- 新增 `docs/releases/v0.1.0.md` 作为版本发布记录；版本边界、安装方式、验收证据和已知限制均可从仓库独立获取。
- 发布基线：包版本 `0.1.0`，Git tag `v0.1.0`；数据格式保持 `pmtool` per-record version 1。

## [未发布] — 阶段 4 测试与交付首批（2026-10-10，平台：trae / TRAE）

- 新增 `docs/test-cases.md`：建立 R1–R6 发布门禁、自动化覆盖矩阵、Web 手动用例、命令冒烟、数据迁移检查和未覆盖边界。
- 新增 `docs/delivery.md`：整理交付范围、文件清单、环境要求、构建装载、演示、备份恢复、已知限制和常见问题。
- 修改根/包 README、AGENTS、requirements、progress、handoff、onboarding：同步 R5 已验收、`9487c24` 已推送及阶段 4 MVP 测试交付完成状态。
- 原因与影响：让 MVP 可由新环境独立恢复、验证和演示；本批不改变业务代码、数据模型或上游源码。
- 验证：Node v22.23.3 / pnpm 11.28.5；冻结锁文件离线安装、构建、全部七个 verify 脚本和 profile 配置检查均退出码 0。因 TRAE 沙箱不能写真实 `~/.dsh`，按 ISS-019 复制到隔离 `DSH_HOME` 启动：插件存储领域打开，随机端口页面 HTTP 200，boot roster 包含 `dsh-pm-tool/client.js`；服务已停止。

## [未发布] — R5 所有者手动验收通过（2026-10-10，平台：trae / TRAE）

- 修改 `AGENTS.md`、`docs/progress.md`、`docs/handoff.md`、`docs/onboarding-prompt.md` 和本档案：记录项目所有者确认 R5 手动验收通过，阶段 3 MVP 完成，阶段 4 待启动。
- 原因与影响：同步真实验收结论和下一步接续点；无代码、需求或数据结构变更。
- 验证：沿用本批已通过的构建、七项回归和真实主题切换证据；本次仅文档状态更新，执行 `git diff --check`。提交和推送仍未授权。

## [未发布] — Web 工作台跟随 dsh 原生主题（2026-10-10，平台：trae / TRAE）

- 修改 `packages/dsh-pm-tool/src/client/panel.css`：移除固定白底、飞书蓝和独立字体，读取宿主 `--dsw-alias-*`、字体、字号和圆角变量；表格、按钮、标签、输入框、概览与抽屉随宿主主题即时更新。
- 修改 `scripts/verify-web.mjs`：增加主题变量契约与禁止固定十六进制配色检查；同步进度、交接、启动快照和包 README。
- 原因：项目所有者要求与 dsh 外壳统一视觉。影响仅限客户端呈现，业务命令和 JSON 结构未变。
- 验证：macOS + Node v22.23.3 + pnpm 11.28.5；构建及 command/export/milestones/projects/storage/tasks/web 七个脚本退出码均为 0。真实浏览器从“跟随系统”切到浅色再恢复，表格与抽屉无固定白底残留，730px 根容器无横向溢出，无当前实例控制台错误。
- 未覆盖：第三方主题逐一视觉验收及其他浏览器；尚未提交、未推送。

## [未发布] — R5 Web 高密度表格工作台重设计（2026-10-10，平台：trae / TRAE）

### 改动文件
- `src/client/panel.tsx`、`panel.css`、`assets.d.ts`：参考飞书多维表格重构为顶部项目切换 + 任务/里程碑高密度表格 + 项目概览；新增状态筛选、搜索、状态分组、彩色字段标签和右侧编辑抽屉。
- `package.json`、`pnpm-lock.yaml`、`pnpm-workspace.yaml`：增加 `lucide-react@1.55.0`。
- `tsdown.config.ts`：增加 CSS 文本内嵌插件，并把 Lucide 图标打入动态 bundle，避免浏览器运行时找不到外部模块。
- `verify-web.mjs`：增加表格、视图标签、右侧抽屉、内嵌样式与 Lucide 无外部依赖断言。
- 新增 `docs/plans/2026-10-10-dense-table-workbench.md`，记录确认方案与实施步骤。

### 为什么 / 影响范围
- 前两版卡片式仪表盘不符合项目经理高频录入与扫描场景；新版以表格为主界面，编辑表单只在右侧抽屉出现。
- Host 命令、业务规则、JSON 数据结构均未改变，仅重构 Web 客户端呈现与局部交互状态。

### 验证
- Node v22.23.3 / pnpm 11.28.5；构建和全部七个 `scripts/verify-*.mjs` 均退出码 0。
- 真实 dsh 页面验证顶部项目切换、任务/里程碑/概览视图、任务新增与清理、右侧抽屉和 725px 工作区；表格自身横向滚动，整页无横向溢出。
- 当前构建控制台无错误；临时服务在验证结束后关闭。
- 当前改动未提交、未推送，等待项目所有者分别授权。

## [未发布] — R5 顶级 Web 项目管理面板（2026-10-10，平台：trae / TRAE）

### 改动文件
- `package.json`、`pnpm-lock.yaml`、`tsconfig.json`、`tsdown.config.ts`：增加 React 客户端类型与动态 bundle 构建、`dsh.client` manifest 和 `./client` 导出。
- `src/client/index.tsx`、`src/client/panel.tsx`：注册侧栏“项目管理”和顶级主面板，提供项目、WBS、里程碑基础操作及响应式布局。
- `src/index.ts`：新增只读 `/pm web snapshot`；所有写操作继续复用既有 Host 命令。
- `scripts/verify-web.mjs`：验证无 Key 快照、manifest 与动态 bundle 契约。
- 更新 README/AGENTS 及 requirements、decision-log、knowledge-base、issues、progress、handoff、onboarding 快照。

### 为什么 / 影响范围
- 完成 R5 MVP，并实证独立外挂包可新增 dsh 顶级 Web 页面，无需修改上游或降级到设置卡片。
- Web 端不另建业务规则，继续以 Host 命令和 JSON 存储为唯一写入路径。

### 验证
- 环境：macOS 15.6.1 arm64、Node v22.23.3、pnpm 11.28.5。
- `pnpm run build` 与全部七个 `scripts/verify-*.mjs` 均退出码 0；`git diff --check` 通过后提交。
- 临时 pm profile 的 boot roster 包含 `dsh-pm-tool/client.js`；真实浏览器无 Key完成项目新建/编辑/删除、任务新建/完成/删除、里程碑新建/达成/删除并清理数据。
- 786px 窄屏截图无横向溢出，控件对比度正常；浏览器控制台和网络检查无错误。独立本地 Playwright npm 包未安装，浏览器验证使用 TRAE 集成自动化。

## [未发布] — R4 整库 JSON 数据包（2026-10-10，平台：trae / TRAE）

- 新增 `core/backup.ts`，扩展 `core/export.ts` / `commands/export.ts` / `verify-export.mjs`，支持 `/pm export json [目录] [confirm]`。
- 数据包格式版本 1，稳定排序，不含 checks；复用 0700/0600、覆盖拒绝和原子替换。
- 环境 Node v22.23.3 / pnpm 11.28.5；构建和 command/export/milestones/projects/storage/tasks 六个 verify 脚本全部退出码 0。
- JSON 专项覆盖格式版本、稳定排序、不含 checks、可读缩进、权限、覆盖保护与源数据不变；错误日志为主动负例/故障注入。

## [未发布] — R4 单项目 Markdown 报告导出（2026-10-10，平台：trae / TRAE）

### 改动文件
- 新增 `core/report.ts`、`core/export.ts`、`commands/export.ts`：聚合三类实体、渲染 Markdown、安全写入与覆盖保护。
- 修改 `src/index.ts`：接入 `/pm export markdown`；修改 `.gitignore` 忽略默认 `exports/`。
- 新增 `scripts/verify-export.mjs`：验证内容/顺序/转义、路径、权限、覆盖拒绝、confirm 原子覆盖、空项目和失败清理。
- 更新 README/AGENTS 及 requirements、decision-log、knowledge-base、issues、progress、handoff、onboarding 快照。

### 为什么 / 影响范围
- 落实 R4 单项目可读报告；报告不进入 storage-domain，JSON 继续作为唯一数据源。
- 默认导出目录稳定定位产品仓库，不受 dsh 启动目录影响；已有文件默认不覆盖。

### 验证
- 环境：macOS 15.6.1 arm64、Node v22.23.3、pnpm 11.28.5。
- `pnpm run build`、`verify-command.mjs`、`verify-storage.mjs`、`verify-projects.mjs`、`verify-tasks.mjs`、`verify-milestones.mjs`、`verify-export.mjs` 全部退出码 0。
- 导出专项覆盖内容/顺序/转义、默认路径定位、带空格目录、0700/0600、覆盖拒绝、confirm 原子覆盖、空项目和失败清理。
- 两次测试预期错误已按 ISS-015 修正；业务错误日志均为主动负例。Web 管理界面不在本批验证范围。

## [未发布] — 固化 R5 完成前自动提交推送授权（2026-10-10，平台：trae / TRAE）

### 改动文件
- `AGENTS.md`、`docs/collaboration.md`、`docs/onboarding-prompt.md`：记录临时授权起止范围、测试门槛和 R5 手动验收要求。
- `docs/decision-log.md`：新增 ADL-019。

### 为什么 / 影响范围
- 项目所有者授权 R5 完成前在每批全量回归通过后自动提交推送；R5 完成后自动终止并通知所有者手动验证。
- 不改变功能方案确认门槛、禁止 force push 等红线。

### 验证
- 与当前 R3 收尾一起执行构建和全部 verify 脚本，全部通过后自动提交推送。

## [未发布] — R3 里程碑编辑、确认删除与任务关联收尾（2026-10-10，平台：trae / TRAE）

### 改动文件
- 修改 `core/milestone.ts`、`core/milestones.ts`、`commands/milestone.ts`：增加状态一致性、更新和 confirm 删除。
- 修改 `core/task.ts`、`core/tasks.ts`、`commands/task.ts`：支持任务关联/解除同项目里程碑，并拒绝不存在或跨项目引用。
- 扩展 `verify-milestones.mjs`、`verify-tasks.mjs`：覆盖编辑、删除保护、关联、跨项目拒绝和重启读回。
- 更新 README/AGENTS 及 requirements、decision-log、knowledge-base、issues、progress、handoff、onboarding 快照。

### 为什么 / 影响范围
- 完成 R3/R6 离线闭环；防止里程碑状态与达成日期矛盾，以及删除产生任务悬空引用。
- 数据版本与布局不变；旧记录在读盘边界保持兼容，新增/更新按新规则校验最终记录。

### 验证
- 环境：macOS 15.6.1 arm64、Node v22.23.3、pnpm 11.28.5。
- `pnpm run build`、`verify-command.mjs`、`verify-storage.mjs`、`verify-projects.mjs`、`verify-tasks.mjs`、`verify-milestones.mjs` 全部退出码 0。
- tasks/milestones 专项覆盖同项目关联、跨项目/不存在引用拒绝、状态与达成日期一致性、更新、删除预览/确认、关联删除保护和重启读回。
- 首次负例对象选择错误已按 ISS-014 修正；四条错误日志为主动故障注入。Web 界面尚未实现，不在本批验证范围。

## [未发布] — R3 里程碑增查首个纵切（2026-10-10，平台：trae / TRAE）

### 改动文件
- 新增 `src/core/milestone.ts`、`src/core/milestones.ts`、`src/commands/milestone.ts`：Milestone schema、增查业务与 `/pm milestone add/list/get`。
- 修改 `src/core/storage.ts`、`src/core/projects.ts`、`src/commands/project.ts`、`src/index.ts`：增加 milestones 表、项目删除保护与命令分发。
- 新增 `scripts/verify-milestones.mjs`：覆盖时间线排序、字段/状态/日期校验、默认值、并发编号、失败恢复、权限和重启读回。
- 更新 README/AGENTS 及 requirements、knowledge-base、issues、progress、handoff、onboarding 快照。

### 为什么 / 影响范围
- 按 R3 最窄纵切先完成里程碑新增与查询；状态继续由用户手动维护，R11 自动提醒仍不做。
- pmtool 仍为 per-record 版本 1，仅增加 milestones 表，无数据迁移；有里程碑的项目禁止删除。

### 验证
- 环境：macOS 15.6.1 arm64、Node v22.23.3、pnpm 11.28.5。
- `pnpm run build`、`verify-command.mjs`、`verify-storage.mjs`、`verify-projects.mjs`、`verify-tasks.mjs`、`verify-milestones.mjs` 全部退出码 0。
- 里程碑专项覆盖增查、时间线排序、全部状态、日期/字段校验、默认值、并发编号、写入失败恢复、项目删除保护、0700/0600 和全新进程读回。
- 首次测试断言错误已按 ISS-013 修正；四条失败日志均为主动故障注入。真实 Web 管理界面尚未实现，不在本批验证范围。

## [未发布] — R2 WBS 任务编辑、删除、移动与重新编号收尾（2026-10-10，平台：trae / TRAE）

### 改动文件
- `src/core/task.ts`、`src/core/tasks.ts`：增加更新片段校验、任务更新/删除/移动/整树重新编号及循环保护。
- `src/commands/task.ts`、`src/index.ts`：接入 `/pm task update/delete/move/renumber`、confirm 预览与中文结果；树展示改用真实关系计算缩进。
- `scripts/verify-tasks.mjs`：覆盖更新合并校验、日期清空、父任务删除保护、root/跨项目/循环移动、编号保留、显式重编号、空洞与重启读回。
- 更新根/包 README、AGENTS 及 requirements、decision-log、knowledge-base、progress、handoff、onboarding 快照。

### 为什么 / 影响范围
- 完成 R2 离线 WBS 验收闭环；结构移动与编号重建分离，避免未确认的大范围编号改写。
- 不改变数据版本和落盘布局；现有任务记录无需迁移。

### 验证
- 环境：macOS 15.6.1 arm64、Node v22.23.3、pnpm 11.28.5。
- `pnpm run build`、`verify-command.mjs`、`verify-storage.mjs`、`verify-projects.mjs`、`verify-tasks.mjs` 全部退出码 0。
- 任务专项覆盖更新合并校验、日期清空、删除预览/确认、父任务保护、root/跨项目/循环移动、移动后编号保留、显式重编号、编号空洞、并发新增、0700/0600 和全新进程读回。
- 三条写入失败日志是主动故障注入；新增的重新编号中途失败验证确认已写记录可恢复、整棵树保持原编号。真实 Web 管理界面尚未实现，不在本批验证范围。

## [未发布] — 固化任务完成后分别确认提交与推送（2026-10-10，平台：trae / TRAE）

### 改动文件
- `AGENTS.md`、`docs/collaboration.md`：把任务完成后的 `git commit` 和 `git push` 改为两个独立的显式授权项。
- `docs/onboarding-prompt.md`：将“验证后主动询问是否提交、是否推送”接入标准启动提示词和交接快照。

### 为什么 / 影响范围
- 项目所有者要求每个任务完成后由执行平台主动询问是否提交和推送代码。
- 后续任何平台在完整回归通过后也必须先停下来询问；未明确授权时保留工作区改动，不自行提交或推送。

### 验证
- 环境：macOS 15.6.1 arm64、Node v22.23.3、pnpm 11.28.5。
- `pnpm run build`、`verify-command.mjs`、`verify-storage.mjs`、`verify-projects.mjs`、`verify-tasks.mjs` 全部退出码 0。
- 覆盖命令/存储、项目 CRUD、三级 WBS、并发编号、主动故障恢复、权限和全新进程读回。
- `git diff --check` 通过；本批仅改协作规则，未执行 Web 手动交互。

## [未发布] — 固化验证后主动规划并连续推进规则（2026-10-10，平台：trae / TRAE）

### 改动文件
- `AGENTS.md`、`docs/collaboration.md`：规定任务通过完整回归后，执行平台必须主动提出下一批文件级计划，所有者确认后立即继续实施。
- `docs/onboarding-prompt.md`：把连续推进规则接入标准启动提示词和当前交接快照。

### 为什么 / 影响范围
- 项目所有者要求每个任务完成并验证后由执行平台主动规划下一步，减少重复分派和等待。
- 仅调整协作流程，不改变业务代码；后续所有平台均须遵守。

### 验证
- 环境：macOS 15.6.1 arm64、Node v22.23.3、pnpm 11.28.5。
- `pnpm run build`、`verify-command.mjs`、`verify-storage.mjs`、`verify-projects.mjs`、`verify-tasks.mjs` 全部退出码 0。
- 覆盖命令/存储、项目 CRUD、三级 WBS、并发编号、故障恢复、权限与全新进程读回；故障日志为主动注入且恢复通过。
- 未执行真实 Web 手动交互：本批仅改协作规则，无业务行为变化。

## [未发布] — 固化每个任务完成后的完整回归与结果回报要求（2026-10-10，平台：trae / TRAE）

### 改动文件
- `AGENTS.md`、`docs/collaboration.md`：新增强制规则，每个任务完成后必须执行构建、全部既有 verify 脚本及本批专项验证。
- `docs/onboarding-prompt.md`：把完整回归和逐项结果回报要求接入标准启动提示词。

### 为什么 / 影响范围
- 项目所有者要求每个任务完成后都做相关功能的完整回归测试，并输出完整验证结果。
- 后续任何平台均须遵守；任一测试失败不得标记完成或提交，最终回报不能只写笼统的“测试通过”。

### 验证
- 环境：macOS 15.6.1 arm64、Node v22.23.3、pnpm 11.28.5。
- `pnpm run build`、`verify-command.mjs`、`verify-storage.mjs`、`verify-projects.mjs`、`verify-tasks.mjs` 均退出码 0。
- 回归覆盖命令与存储自检、项目 CRUD/校验/并发/重启读回、三级 WBS/关系/并发编号/项目删除保护/重启读回；两条“验证用写入失败”均为主动故障注入且恢复验证通过。
- 文档差异检查 `git diff --check` 通过；本条不改变业务代码。

## [未发布] — R2 WBS 任务增查首个纵切（2026-10-10，平台：trae / TRAE）

### 改动文件
- 新增 `src/core/task.ts`、`src/core/tasks.ts`、`src/commands/task.ts`：Task schema、三级 WBS 业务逻辑与 `/pm task add/list/get`。
- 修改 `src/core/storage.ts`、`src/core/projects.ts`、`src/commands/project.ts`、`src/index.ts`：增加 tasks 表、共享领域写队列、项目删除保护与 task 命令分发。
- 新增 `scripts/verify-tasks.mjs`：验证三级树、关系、默认值、并发编号、故障恢复、权限和重启读回。
- 更新 README/AGENTS 及 requirements、decision-log、knowledge-base、progress、handoff、onboarding 快照。
- `docs/issues-and-solutions.md`：新增 ISS-012，记录 DomainTable 无 `values()`、须用 `entries()` 的 API 边界。

### 为什么 / 影响范围
- 按 R2 最窄纵切先完成任务新增与查询，不同时引入编辑、删除、移动和重新编号。
- pmtool 仍为 per-record 版本 1，仅增加 tasks 表，无迁移；有任务的项目现在禁止删除。
- 项目所有者已手动验证 R1 update/delete 与日期/同名/confirm 功能通过。

### 验证
- `pnpm run build` 及 `verify-command/storage/projects/tasks.mjs` 全部退出码 0。
- 任务脚本覆盖至少三级 WBS、跨项目父任务拒绝、并发同级编号唯一、写盘故障恢复、0700/0600 和全新进程读回。

## [未发布] — R1 离线项目编辑、确认删除与输入防呆收尾（2026-10-10，平台：trae / TRAE）

### 改动文件
- `packages/dsh-pm-tool/src/core/project.ts`：增加更新片段 schema 与 `targetDate >= startDate` 联合校验。
- `packages/dsh-pm-tool/src/core/projects.ts`：统一写队列，增加同名检查、项目更新与删除。
- `packages/dsh-pm-tool/src/commands/project.ts`、`src/index.ts`：接入 `update` / `delete`、add/update 同名 `confirm`、删除预览及中文帮助。
- `packages/dsh-pm-tool/scripts/verify-projects.mjs`：覆盖日期、同名、更新、删除确认、权限、失败恢复和全新进程读回。
- `packages/dsh-pm-tool/README.md`、根 `README.md`、`AGENTS.md`：同步命令、规则、限制和当前状态。
- `docs/requirements.md`、`docs/decision-log.md`：更新 R1/R6 状态并新增 ADL-015 落地语义。
- `docs/knowledge-base.md`、`docs/issues-and-solutions.md`：新增 KB-016 统一业务队列模式、ISS-011 已确认重名项目更新边界。
- `docs/progress.md`、`docs/handoff.md`、`docs/onboarding-prompt.md`：同步验证结果和下一步 R2 接续点。

### 为什么 / 影响范围
- 按 ADL-012 与 requirements §5.3 收尾 R1 离线项目能力；无新增依赖、插件包、profile、数据版本或迁移，不修改上游。
- 名称 `trim` 后区分大小写精确比较；新增或实际改名同名时默认阻止，末尾 `confirm` 放行。删除不带 `confirm` 只提示，不写盘。
- 当前删除仅涉及 projects 记录；任务和里程碑加入后需补关联删除约束。仍仅支持单宿主进程写入。
- 数据版本保持 1；读盘 schema 不因新增日期业务规则而拒绝旧记录，日期关系在新增/更新写盘前校验，无需本批数据迁移。

### 验证
- macOS 15.6.1 arm64、nvm Node v22.23.3、pnpm 11.28.5。
- `pnpm run build`、`node scripts/verify-command.mjs`、`node scripts/verify-storage.mjs`、`node scripts/verify-projects.mjs` 全部退出码 0。
- 项目脚本验证增删改查、日期倒置拒绝、同名默认阻止/confirm 放行、删除预览不落盘、确认删除文件消失、0600 文件/0700 目录、并发写入、主动故障后恢复及全新进程读回更新/删除状态。

## [未发布] — 首批功能独立复核通过、推送并固化五项开发决策（2026-10-10，平台：doubao-work）

### 改动文件
- `docs/decision-log.md`：新增 ADL-012（删除 `confirm` 关键字、日期先后校验、同名默认阻止+confirm 放行）、ADL-013（R5 排在 R2/R3/R4 之后 + 顶级页面不可行时降级为卡片/区块+离线命令）、ADL-014（Node 版本口径澄清：以 nvm v22.23.3 为准）。
- `docs/requirements.md`：头部加复核后同步注记；R1 验收标准补编辑/删除 confirm、日期先后、同名规则并更新状态；R5 行补排序与降级形态；§5.3 增补项目删除/日期/同名/开发顺序四条业务规则。字段模型仍为 v0.4，未改字段。
- `docs/knowledge-base.md`：新增 KB-014（dsh Web 仅信任 loopback、拒绝 0.0.0.0、browser-trust 503、headless 为独立 profile、确定性脚本为离线回归准、真实浏览器点击须宿主机本机 GUI）、KB-015（Doubao 沙箱自带 node v22.23.2 遮蔽 nvm v22.23.3）。
- `docs/issues-and-solutions.md`：新增 ISS-010（非本机浏览器 503 / 0.0.0.0 被拒 / 部分 Agent 无本机 GUI 权限的定性与处理）。
- `docs/changelog.md`、`docs/progress.md`、`docs/handoff.md`、`docs/onboarding-prompt.md`：本条及进度/交接快照同步为「复核通过、已推送 origin/main、下一步交 trae 做 R1 收尾」。

### 做了什么 / 为什么
- 所有者授权后，把 trae 的 3 个本地提交（`b2ca50f`、`0128203`、`9dbb3f9`）**推送 origin/main**（`f9bda6e..9dbb3f9`），仓库与远程一致。
- 豆包工作对首批「项目新增/列表/详情」做了独立复核：构建与三个 verify 脚本全部退出码 0；真实 dsh Web 宿主启动确认加载插件；核验真实浏览器写出的 `p-0001/p-0002`（目录 0700、文件 0600）；用全新真实进程经同一命令处理器读回成功、无 Key 可用。结论：功能合格、建议验收。
- 所有者就复核报告的 5 个待确认项拍板（决定 2/3/4/5），按"仓库即唯一事实来源"要求立即固化，供 trae 克隆后直接照做。
- 关于决定 5（Node 版本）：复核时沙箱报告 v22.23.2，经 `nvm ls` 核实是 Doubao 沙箱自带 node 遮蔽，本机 nvm 默认实为 v22.23.3，故文档**维持 v22.23.3**（ADL-014 / KB-015）。

### 影响范围
- **仅文档与 git 推送，无任何业务代码/依赖/profile/上游改动**；不改变已推送的 3 个提交内容。
- 复核期间曾临时用 `--host 192.168.10.53` 绑定 LAN 做连通测试，服务已停止、未写入 profile；为安全 dsh 拒绝了 `--host 0.0.0.0`。
- 清理了仓库根 `.tmp/` 探测 scratch（含一个可按包 README 五条命令重建的一次性功能验证 DSH_HOME，本就 gitignore）；产品 `data/` 与受跟踪文件未受影响。
- 上游 `deepseek-harness` 工作区干净、HEAD 仍为基线 `d7432673`。

### 验证
- 推送后 `git status -sb` 显示本地与 origin/main 一致，`origin/main` HEAD = `9dbb3f9`。
- 复核证据：`pnpm run build` 退出 0；`verify-command/storage/projects.mjs` 退出 0（含约 20 类非法输入不落盘、10 并发不覆盖、写盘失败恢复、全新子进程重启读回与编号续增）；真实宿主日志 `[pm-tool] 存储领域 pmtool 已打开`；`p-0001/p-0002` 内容符合 schema、权限正确。
- 测试服务已停止，3080 端口空闲；产品仓库与上游均无意外改动。

## [未发布] — 精简豆包独立复核提示词（2026-10-10，平台：trae / TRAE）

### 改动文件
- `docs/doubao-validation-prompt.md`：删除重复的提交号、命令、验收细节和下一步技术预设，只保留复核目标、报告结构与禁止改动边界。
- `docs/changelog.md`、`docs/onboarding-prompt.md`：记录提示词改为由豆包按仓库 SOP 自行读取最新状态，避免双份信息失效。

### 为什么 / 影响范围
- 项目所有者确认豆包工作可直接读取项目文件，无需在提示词中重复仓库已有内容。
- 仅调整协作提示词，不改变代码、测试、需求或既有验证结论。

## [未发布] — 补齐真实 Web 功能验收与豆包独立复核提示词（2026-10-10，平台：trae / TRAE）

### 改动文件
- `docs/changelog.md`：补记真实宿主、浏览器 add/list/get、落盘与权限验证证据。
- `docs/progress.md`、`docs/handoff.md`、`docs/onboarding-prompt.md`：把首个项目增查增量更新为已通过真实 Web 功能验证，明确待豆包独立复核与下一步 R2 规划。
- 新增 `docs/doubao-validation-prompt.md`：可直接发送给豆包工作的完整提示词，要求独立执行自动化与 Web 验收、只读代码复核，并提交 R2 WBS 文件级计划；未经确认不编码。

### 为什么 / 背景
- 项目所有者要求不能只验证构建和脚本，还需验证真实功能；随后要求提交现有代码，并让豆包工作再做一次独立功能复核和下一步规划。

### 影响范围
- 仅新增/更新文档，不改变插件行为、依赖、profile 或数据模型。
- 浏览器验收产生 `data/pmtool/projects/p-0001.json`、`p-0002.json` 两条“浏览器功能验收”数据，位于已 gitignore 的 data 目录，按项目规则保留且不入库。
- 测试使用仓库内 `.tmp/dsh-home-functional` 作为一次性 DSH_HOME，未修改真实 `~/.dsh` 或上游文件；`.tmp/` 已被 Git 忽略。

### 验证
- 用临时 DSH_HOME 执行 `pnpm dsh --profile pm --dump-config`：可见 pm-tool、storage-domain、storage-json，root 指向 `pm-tool/data`。
- 启动真实 `pnpm dsh --profile pm --no-open`，浏览器无 API Key 验证：命令候选出现 pm；add 两次落盘为 p-0001/p-0002；list 显示 2 个项目；get p-0001 返回完整中文字段。
- 两个 JSON 与页面字段一致，projects 目录权限 0700、文件权限 0600；服务已停止，产品仓库除本次文档外无受跟踪运行产物，上游工作区干净。
- 初次自动化把参数拆成普通消息时复现 `MISSING_CREDENTIAL`，随后按 ISS-009 通过“候选中选择 pm → 同一命令后追加参数”完成验证；该现象不影响 pm 命令功能。

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
- 项目脚本验证使用独立系统临时目录（脚本打印路径并保留），原有脚本更新 data 下自检记录；真实浏览器功能验收随后完成，证据见上方独立条目。项目命令可在 Web 执行不代表 R5 项目管理面板完成。
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

## v0.4.1-integration（未打 tag，HEAD=main）
- 副驾（PROD-20）写路径加固：ask-apply 后端守卫（重读 domain 归属/允许字段/真实日期、updatedAt 冲突检测）、in-flight 并发去重（60s TTL，**内存态重启不持久**）、写库改走既有 updateTask 领域校验；--base malformed 直接报错。
- ask 上下文补齐：当前日历锚点 today/时区、会议行动项真实字段 title/owner/dueDate、汇报/交付物/风险状态摘要；缺实体明确标「暂无」，不臆断。
- 备份恢复：applyBackup 删除前全量 record schema + 关系（projectId/parentId/milestoneId）预检，坏备份不破坏已有 domain；restoreBackup(FromContent) 新增可注入 directory（默认不变），测试备份目录隔离。
- 新增非GUI集成回归 scripts/verify-integration.mjs（真实 storage 临时目录 + spawn 子进程 reopen 读盘）。
- 状态勘误：本轮 35 个 verify + 非GUI集成通过；**真实浏览器 GUI 端到端本轮被工具能力限制未运行**（独立 GUI 工具报"SubAgent 不支持电脑操作"，未用 shell/puppeteer 绕过）；历史临时截图不等于入库可复跑；原 e2e-web-real.mjs 仅 CSV/项目记忆，关键 GUI 清单待独立验收。

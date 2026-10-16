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

- **快照更新时间**：2026-10-17
- **最近更新平台**：doubao-work（**#22 AI 副驾写操作扩展**——副驾写从仅 task.update 扩到里程碑/风险/交付物/会议四类 create+update，HITL 确认草稿卡、确认才落库、取消零写，复用 ask-apply 守卫、零 schema、乐观锁冲突跳过、幂等。build=0、guard 72 脚本/72 通过/0 失败/0 污染；隔离 3161 真实 Chrome 浅/深两趟 8 步草稿/整批应用/取消零写全 OK。证据 `docs/verification/copilot-writes-20261017/`。已 commit+push main）
- **提交定位（本批已 push main）**：本批在 main 直接提交「#22 AI 副驾写操作扩展（四类实体 create+update，HITL 草稿卡）」并 `git push origin main`；不改 package.json version、不打 tag；发布基线仍 v0.7.3=`eb41b30`。
- **版本口径（2026-10-17 #22）**：已发布注解 tag `v0.1.0`–`v0.7.3`；本批为副驾写面扩展（非语义化版本发布），沿用 `package.json` 版本号。块结构不变：client.js（浏览态）+ client.editor.js（按需）+ client.formula-expr.js（按需）；未新增外部依赖（纯 TS）。
- **当前阶段 / 状态（2026-10-17）**：**#22 AI 副驾写操作扩展已核验（已 push main）**——副驾写从仅 `task.update` 扩到里程碑、风险、交付物、会议四类实体，每类支持创建+更新；保持 HITL（确认草稿卡，确认才落库、取消零写），复用既有 ask-apply 后端守卫，零存储 schema，乐观锁冲突跳过、重复 apply 幂等。`core/copilot.ts` `ALLOWED_OPS` 扩到 8 实体 op + 四类字段白名单/枚举/交叉约束（risk 必须 probability、禁 solution；issue 必须 probability=null、禁 responsePlan；deliverable 用 `name`；meeting 校验 meetingDate/startTime/durationMinutes/数组），`validateActions` snapshot 扩为可选四实体 id 集合、`task.update` 逐字节不变；`commands/ask.ts` `applyCore` 按 op 分发（create 注入 projectId 调 `add*`，update 核 projectId+比基线 `updatedAt` 不一致 `DispatchSkip` 跳过不覆盖后调 `update*`，`task.update` 仍走 `updateTask`），幂等键 SHA-256 命中拦截；`core/ask-copilot.ts` `COPILOT_SYSTEM` 放开四类实体并写明字段口径；`client/panel.tsx` `CopilotPanel` 收四实体清单传 id 集合，`task.update` 保留行内编辑、其余 op 渲染只读实体摘要卡（新建=新值、更新=旧值删除线→新值、「新建X/更新X · id」徽标）；`client/panel.css` 实体徽标/摘要/行样式复用 `--pm-*`（底层 `--dsw-*`）零 hex、跟随 `body[data-ds-dark-theme]`。全量 guard **72 脚本 / 72 通过 / 0 失败 / 0 污染**。
- **上一阶段（#25，2026-10-17，已并入 main）**：真 390px 窄窗响应式正式修复已核验——窄屏规则全隔离在 `@media (max-width:560px)`、≥1024 桌面几何零改动；骨架+9 视图 390px 无外壳溢出，宽内容容器内部横滚；dsw/pm token 零 hex 跟随浅深。guard 71/71（并入 main 后）。
- **备份目录口径（2026-10-14 更正）**：默认 builtin = 仓库 `packages/backups/`（`BUILTIN_DEFAULT='../../../backups/'` 相对 `packages/dsh-pm-tool/lib/core/backup.js`），**非** `packages/dsh-pm-tool/backups/`、**非**仓库根 `backups/`；优先级 **显式 directory 参数 > `DSH_PM_BACKUP_DIR` > builtin**。
- **验证（#22，2026-10-17）**：`pnpm build`=0；`node scripts/verify-isolation.mjs` **72 脚本 / 72 通过 / 0 失败 / 0 污染**（before=after=165）；新增 `verify-copilot-writes.mjs`（四类实体 create/update 解析校验、确认落库、取消零写、updatedAt 冲突跳过、幂等、非法/未知动作安全忽略、跨项目拒绝，离线确定性）；真实 Chrome headless 隔离实例（独立 DSH_HOME + 独立存储/备份 + 端口 **3161**，正式 3080=PID 66364 全程未变、3091 未监听，ISS-027 单 PID TERM）：浅/深两趟均 8 步草稿（4 新建/4 更新）、整批应用 8 步、取消零写、served bundle 含实体卡、0 console error；截图 `docs/verification/copilot-writes-20261017/`（10-draft / 11-after-apply / 12-cancel × light/dark + results/dom json）。
- **已知限制**：免费池随机模型纯文本可用、工具调用不保证、约 50 次/天、偶发超时重试即恢复；删根须叶子→根或用 cascade confirm；首页斜杠命令点发送按钮、发送后到侧栏点最新会话。
- **key 已配置、端点已实测（2026-10-11 更新）**：key 已由所有者写在其本机 `~/.zshrc`（仓库外、不入库；改前已备份 `~/.zshrc.bak-20261011-130537`）。所有者本机直连实测：`GET /v1/key` 返回 `is_free_tier: true`、`free_model_daily_requests.limit=50`；`POST /v1/chat/completions`（`model=openrouter/free`）两次真实调用均成功、`cost=$0`、`finish_reason=stop`（随机落到 `liquid/lfm-2.5-2.6b:free`、`nvidia/nemotron-3-ultra-550b-a55b:free`）。经验见 KB-034（推理型模型先吃满 reasoning tokens，`max_tokens` 要给足 ≥400）。
- **应用内已实测打通（2026-10-11 更新）**：在 dsh 网页底部模型选择器选 **Free Models Router**（openrouter-free/openrouter/free）发「你好，用一句话介绍你自己」，**第 1 次即成功**（puppeteer-core + 系统 Chrome 139 无头，KB-032）：助手正常回复、无 MISSING_CREDENTIAL/401/429。期间曾踩一次 `MISSING_CREDENTIAL`（“OPENROUTER_API_KEY which is not set”）——根因是 dsh 进程由「写 key 前的旧终端」启动、进程环境无该变量；停旧进程、用已 `source ~/.zshrc` 的环境重启即解（KB-035 / ISS-024，永久做法是在 Web「设置→模型」页把密钥录进 credentials service）。
- **新增协作硬规则**：每个任务完成后必须执行构建、当前全部 verify 脚本和本批专项验证；最终回报逐项列出环境、命令、退出码、关键证据和未覆盖边界，任一失败不得标记完成或提交。
- **连续推进规则**：每批验证完成后，执行平台主动提交下一批文件级计划；所有者确认后直接继续编码。
- **版本控制确认规则**：通常每批完成并验证后，提交与推送分别请所有者授权。**本轮（R9 收尾起的连续开发）所有者已一次性持续授权 doubao-work：仓库内代码/文档修改、正常 commit、`git push origin main` 可全自动执行，无需逐次请示**；仍禁止 force push/改写已推送历史/提交密钥或业务数据，删除他人成果、改全局配置、发布 npm/正式版本等不可逆外部操作仍须遵守安全规则。
- **授权状态**：本批在持续授权范围内提交推送（提交信息标 `[doubao-work]`，推送后核对 HEAD=origin/main）。
- **所有者已定规则（ADL-012～035）**：R12 检索/统计为只读派生、Web 看板基于 snapshot（ADL-029）；Excel 导入（ADL-030）、多人实时协作（ADL-031）、R11 里程碑提醒与生成型能力（ADL-032）本期暂缓/裁剪；浏览器兼容仅 Chrome（ADL-033）；上游 dsh 新版本按 peer 锁定 + 升级冒烟（ADL-034）；**OpenRouter 免费自动路由作零成本尽力而为 LLM 通道、核心保持离线、其他官方厂商预留模板（ADL-035）**。
- **下一步 / 遗留（2026-10-17）**：**#22 副驾写扩展已完成并核验并 push main**。下一步推进 **看板 P2**（跨卡片联动过滤、卡片自定义元素增强、completedDate 历史趋势真实数据 UI、markdown 富文本增强；completedDate 后端地基已就绪），之后按用户审美重设计 9 个视图。历史遗留：prod 真实 Key 录入仍 MANUAL_PENDING；关键路径**自动排期/压缩**（甘特B 长期观望）未做；#23 客观进度/#24 vitest·E2E·CI 未做；G8/H5 不可逆人工动作登记 MANUAL_PENDING；外部 vendor skills 其余 3 entry 待补试点报告。
- **最近一次交接（2026-10-17）**：doubao-work 完成 **#22 AI 副驾写操作扩展**并 push main。副驾写从仅 task.update 扩到里程碑/风险/交付物/会议四类 create+update，HITL 确认草稿卡、确认才落库、取消零写，复用 ask-apply 守卫、零 schema、乐观锁冲突跳过、幂等。`pnpm build`=0、guard **72 脚本/72 通过/0 失败/0 污染**（证据 `docs/verification/copilot-writes-20261017/`，浅/深各 3 张：草稿/整批应用/取消零写）；隔离端口 3161，正式 3080 未触；不改 package.json version、不打 tag。

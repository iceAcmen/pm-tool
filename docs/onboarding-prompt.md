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

- **快照更新时间**：2026-10-14
- **最近更新平台**：doubao-work（**v0.7.3 最终可发布：甘特拖拽手感与成功提示热修，代码审查 APPROVE、真实 Chrome 隔离端口 3120 22 项全绿 + 回归新增 7 项独立测试专家最终签 7/7 PASS**——根因修复 flex-wrap 致 scroll 宽 0 / quiet 单 refresh 即时更新 / inline aria-live 轻提示 ~3s 自消 / saving 锁防连拖 / 失败回落不吞错；正式 156 资产零变化、client `68238d1a…`（已实测锁定 `68238d1a37c4eccfe16ff1699b91310e304d47eddc01466ac19b5193892131d8`）；待用户最终通知执行最终提交打 tag**）
- **main 提交定位**：HEAD=`310c768`（[release] 发布 v0.7.2 甘特信息可视化增强；注解 tag `v0.7.2` 对象 `5d1c8591`→`310c768`，**v0.7.2 已正式发布**）；v0.7.3 拖拽热修候选在其上**未提交工作树**，v0.7.3 文档**暂不 commit/tag/push**（热修代码审查 APPROVE、Chrome 22 项全绿 + 回归 7/7 PASS，等用户最终通知）。
- **版本口径（2026-10-14 v0.7.3 最终可发布）**：已发布注解 tag `v0.1.0`–`v0.7.2`。**v0.7.2 已正式发布**：tag 对象 `5d1c8591` → 提交 `310c768`；`package.json` = **`0.7.3`**。**v0.7.3 热修代码审查 APPROVE、真实 Chrome 22 项全绿 + 回归 7/7 PASS、可发布**，注解 tag 将在最终提交时创建。v0.7.2：甘特信息增强范围内 **34/35 PASS**、guard 157 资产零污染、真实 Chrome 隔离端口 3102、client `dcf44a4a…`；v0.7.3：拖拽手感/成功提示热修、真实 Chrome 隔离端口 3120 **22 项全绿**、回归新增 7 项独立测试专家最终签 **7/7 PASS**、静态契约 verify-gantt-drag 退出 0、guard **156 资产零变化**、client `68238d1a37c4eccfe16ff1699b91310e304d47eddc01466ac19b5193892131d8`（已实测锁定）。
- **当前阶段 / 状态（2026-10-14）**：**v0.7.3 = 甘特拖拽手感与成功提示热修（零 schema）**——根因修复 `.pm-gantt` 无 `flex-wrap` 致 hint 与 labels/scroll 挤同一 flex 行、scroll 被 shrink 到宽 0（画布消失）；拖拽走 `run(...,{quiet:true})` 单 refresh、日期即时更新无需 F5（移除 onSaved 二次刷新）；quiet 成功不弹全字段深色大 Notice，改条下 inline `role=status`/`aria-live=polite`「已更新：起 ~ 止」约 3s 自清除；`saving` inflight 锁保存中禁连拖、finally 解锁防 ghost；失败回落条体自然回拖前坐标无残影、内联「更新失败，请重试」6s，quiet 不吞错（run catch 仍 setMessage 保留全局错误 Notice）；unmount clearTimeout；payload 白名单仍仅 startDate/dueDate。**真实 Chrome v139 headless（puppeteer-core，无 Key）独立端口 3120 22 项全绿**；回归新增 7 项（GI-WRITE-06/07+GI-WEB-16~20）独立测试专家最终签 **7/7 PASS**；🟡 GI-WEB-14 真 390 窄窗 = MANUAL_PENDING（不阻塞）、GI-CP-01~05 关键路径 = deferred。**PoC 车道 `our-free-model`/`kilo-auto/free` 免费免 Key；仅生产（prod）真实 Key 缺配（M-01），MANUAL_PENDING，不阻塞 v0.7.3 发布**。外部 skills：试点可用未毕业（`code-review` 试点 PASS；其余 3 entry 待补）。使用 vendor skill 前必读 `docs/external-skills.md` 守 8 条红线。
- **备份目录口径（2026-10-14 更正）**：默认 builtin = 仓库 `packages/backups/`（`BUILTIN_DEFAULT='../../../backups/'` 相对 `packages/dsh-pm-tool/lib/core/backup.js`），**非** `packages/dsh-pm-tool/backups/`、**非**仓库根 `backups/`；优先级 **显式 directory 参数 > `DSH_PM_BACKUP_DIR` > builtin**。
- **验证**：本批仅改版本文档口径，未改产品代码/测试专家 docs；等用户最终通知后执行最终 commit/tag/push。
- **已知限制**：免费池随机模型纯文本可用、工具调用不保证、约 50 次/天、偶发超时重试即恢复；删根须叶子→根或用 cascade confirm；首页斜杠命令点发送按钮、发送后到侧栏点最新会话。
- **本批验证（doubao-work，全部无 Key）**：Node nvm v22 / pnpm 11.28.5；`pnpm install --frozen-lockfile` 干净、`pnpm run build` 退出码 0（client bundle 153.00 kB）、**12 个** verify 全 0、`git diff --check` 干净；`DSH_HOME=~/.dsh pnpm dsh --profile pm --dump-config` 退出码 0、组合中 `providers.openrouter-free` 出现且 storage-json root / dsh-pm-tool 完好；无 Key 真实宿主（随机端口）启动成功（`[pm-tool] 存储领域 pmtool 已打开`、无 pi-ai/openrouter 报错），运行中 `plugins/??dsh-pm-tool/client.js` bundle HTTP 200（无 cookie 401）。
- **key 已配置、端点已实测（2026-10-11 更新）**：key 已由所有者写在其本机 `~/.zshrc`（仓库外、不入库；改前已备份 `~/.zshrc.bak-20261011-130537`）。所有者本机直连实测：`GET /v1/key` 返回 `is_free_tier: true`、`free_model_daily_requests.limit=50`；`POST /v1/chat/completions`（`model=openrouter/free`）两次真实调用均成功、`cost=$0`、`finish_reason=stop`（随机落到 `liquid/lfm-2.5-2.6b:free`、`nvidia/nemotron-3-ultra-550b-a55b:free`）。经验见 KB-034（推理型模型先吃满 reasoning tokens，`max_tokens` 要给足 ≥400）。
- **应用内已实测打通（2026-10-11 更新）**：在 dsh 网页底部模型选择器选 **Free Models Router**（openrouter-free/openrouter/free）发「你好，用一句话介绍你自己」，**第 1 次即成功**（puppeteer-core + 系统 Chrome 139 无头，KB-032）：助手正常回复、无 MISSING_CREDENTIAL/401/429。期间曾踩一次 `MISSING_CREDENTIAL`（“OPENROUTER_API_KEY which is not set”）——根因是 dsh 进程由「写 key 前的旧终端」启动、进程环境无该变量；停旧进程、用已 `source ~/.zshrc` 的环境重启即解（KB-035 / ISS-024，永久做法是在 Web「设置→模型」页把密钥录进 credentials service）。
- **新增协作硬规则**：每个任务完成后必须执行构建、当前全部 verify 脚本和本批专项验证；最终回报逐项列出环境、命令、退出码、关键证据和未覆盖边界，任一失败不得标记完成或提交。
- **连续推进规则**：每批验证完成后，执行平台主动提交下一批文件级计划；所有者确认后直接继续编码。
- **版本控制确认规则**：通常每批完成并验证后，提交与推送分别请所有者授权。**本轮（R9 收尾起的连续开发）所有者已一次性持续授权 doubao-work：仓库内代码/文档修改、正常 commit、`git push origin main` 可全自动执行，无需逐次请示**；仍禁止 force push/改写已推送历史/提交密钥或业务数据，删除他人成果、改全局配置、发布 npm/正式版本等不可逆外部操作仍须遵守安全规则。
- **授权状态**：本批在持续授权范围内提交推送（提交信息标 `[doubao-work]`，推送后核对 HEAD=origin/main）。
- **所有者已定规则（ADL-012～035）**：R12 检索/统计为只读派生、Web 看板基于 snapshot（ADL-029）；Excel 导入（ADL-030）、多人实时协作（ADL-031）、R11 里程碑提醒与生成型能力（ADL-032）本期暂缓/裁剪；浏览器兼容仅 Chrome（ADL-033）；上游 dsh 新版本按 peer 锁定 + 升级冒烟（ADL-034）；**OpenRouter 免费自动路由作零成本尽力而为 LLM 通道、核心保持离线、其他官方厂商预留模板（ADL-035）**。
- **下一步 / 遗留**：v0.7.3 拖拽热修**代码审查 APPROVE、Chrome 22 项全绿 + 回归 7/7 PASS，待用户授权最终提交打 tag**；后续 = 关键路径只读高亮（GI-CP 现行 deferred）、真 390 窄窗目视（GI-WEB-14）、M-01 prod 真实 Key 录入。G8/H5 不可逆人工动作登记 MANUAL_PENDING，待用户本人执行备份/恢复与删除确认时据实回填；为外部 vendor skills 的其余 3 entry（grill-me/tdd/diagnosing-bugs）各补 1 份试点报告以推进毕业（code-review 已 PASS；自动路由已生效但不改变毕业状态）；R11 里程碑提醒、多人协作、Excel 导入仍暂缓/裁剪。已知限制：免费池偶发超时重试即恢复（KB-036）、任务删除不级联需叶子→根逐层删（ISS-025）。
- **最近一次交接**：doubao-work 完成 **甘特拖拽手感与成功提示热修（v0.7.3）**——根因修复 `.pm-gantt` 无 `flex-wrap` 致 hint 与 labels/scroll 挤同一 flex 行、scroll 被 shrink 到宽 0（画布消失）；拖拽走 `run(...,{quiet:true})` 单 refresh、日期即时更新无需 F5；quiet 成功不弹全字段深色大 Notice，改 inline `role=status`/`aria-live=polite`「已更新：起 ~ 止」约 3s 自清除；`saving` inflight 锁保存中禁连拖、finally 解锁防 ghost；失败回落条体自然回拖前坐标无残影、内联「更新失败，请重试」6s，quiet 不吞错（run catch 仍 setMessage 保留全局错误 Notice）；unmount clearTimeout；payload 白名单仍仅 startDate/dueDate（零 schema）。代码审查 **APPROVE**；真实 Chrome v139 headless（puppeteer-core，无 Key）隔离实例独立 `DSH_HOME`+端口 **3120** **22 项全绿**；静态契约 `scripts/verify-gantt-drag.mjs` 退出 0；证据 `docs/verification/gui-gantt-drag-hotfix-20261014/`、验收矩阵 `docs/testing/gantt-information-acceptance.md`（新增 GI-WRITE-06/07+GI-WEB-16~20 共 7 项，独立测试专家最终签 **7/7 PASS**）；正式 data/backups/exports **156 资产本轮零变化**；本批 `lib/client.js` sha256 `68238d1a37c4eccfe16ff1699b91310e304d47eddc01466ac19b5193892131d8`（332139 B / 332.14 kB，**已实测锁定**）；ISS-027 精确 PID 流程继续遵守（隔离 PID=86864/3120，正式 3080=69064/3091=69065 未触）。本批仅回写版本/living docs（package.json 0.7.3 + releases/README/changelog/progress/handoff/onboarding），未改产品 src/测试 docs/证据、未提交。上一批 doubao-work 完成 **v0.7.2 甘特信息增强**（范围内 34/35 PASS，client `dcf44a4a…`）；外部 skills 自动路由 ADL-049 已生效，当前仍「试点可用、未毕业」。

# P2-6 AI 溯源治理 · 冻结确定性测试规格（2026-10-17，准备件 · 非实施）

> 状态：P2-6 **尚未实现**（仅设计 mockup `p2-6-ai-provenance.html`），本文是 P2-6 实施批启动后的**冻结测试门与确定性用例准备**，当前全部 NOT_RUN/MANUAL_PENDING，不代表已通过。
> 依据**真实当前源码**核对，不沿用旧「TV-AI-1 适配器 / 缺 Key 抛错」假设；prod 凭据由 dsh 请求时从凭据服务解析，插件进程 env 不预检测，`resolveModelRoute('prod')` 不因缺 env Key 抛错，且 prod 恒走 ark-plan、**不静默回退免费池**。
> 三通道严格分开：**L1 mock 缝**（fake gateway，零网络）/ **L2 离线真实闭环**（真实 core/命令/台账 + fake gateway，零写/撤销/错误归一可复现）/ **L3 真实模型生成**（需用户本人受控通道，MANUAL_PENDING）。离线治理项不得因未配真实 Key 判 BLOCKED。

## 0. 当前源码基线（核对自 packages/dsh-pm-tool/src）

- `core/ai-client.ts`：`generateDraft(llm, options)` 按候选链顺序尝试，首个成功返回；`EMPTY`（空正文）换下一候选；`normalizeError` 归一 MODEL_TIMEOUT/RATE_LIMIT/CONTEXT_OVERFLOW/INVALID_CREDENTIAL/NO_ADAPTER/MISSING_CREDENTIAL；`NON_RETRYABLE`（限流/容量/鉴权/无适配器/缺凭据）命中即抛不换池；单次 `AbortSignal.timeout(120000)`；`reasoningEffort` 在 prepareCall 阶段给齐、stream 不重复传。
- `core/model-route.ts`：poc=our-free-model/kilo-auto/free（4 候选全 off）；prod 按场景确定性 ark-plan 链（copilot flash high→pro high→glm off；wbs/meeting/narrative/title 各自链）；无 env 预检测抛错。
- `core/wbs-ai.ts`：`rememberDraft/recallDraft` 进程内 Map 缓存预览草稿（重启失效）；`previewWbsDraft` 产出导入计划，不直接落库。
- `commands/ask.ts`：预览→显式确认才 apply；`undoStore` 进程内 Map，`UNDO_TTL_MS=10min`、`listRecentUndo(limit=3)`、update 记原始记录/create 撤销删新建、`used` 一次性、重启失效；60s 确认幂等键在 `core/idempotency.ts`。
- 现网副驾面板（panel.tsx）：生成草稿→预览可编辑→「确认入库」复用进程缓存（不再调模型）；取消/预览零写；失败可重试或手工，台账不受影响。
- **确认入口（2026-10-17 协调裁定修正：WBS 导入非 AI 链）**：AI 溯源链（P6-F15 须全覆盖，不只 ask）= ask 多步 apply（commands/ask.ts）、汇报叙述确认（core/report-narrate.ts / progress-report.ts）、会议纪要建会+行动项（core/meeting-summarize.ts / meeting.ts，fake gateway stub），各自有进程内草稿缓存、confirm 复用不二次调模型；WBS `importTasksFromMarkdown` 落盘为**人工导入**，不记 AI 来源（P6-F16 负断言，不补 hook）。
- **现存缺口 P6-GAP-01**：撤销 update 回滚无人工新修改冲突守卫（见 §2c）。
- **未建（P2-6 新增）**：来源溯源面板（scope+指纹）、失效置灰/一键重校、离线降级条、置信度分档环、撤销冲突守卫与审计、半成功恢复一致性。

## 1. 通道定义与允许的断言

| 通道 | 做法 | 可断言 | 禁止 |
|---|---|---|---|
| L1 mock 缝 | 注入 fake LlmGateway（prepareCall/stream 脚本化返回/抛错），零网络 | 候选顺序、错误归一、不重试集、prepared call 契约、零写 | 不得声称真实模型质量 |
| L2 离线真实闭环 | 真实命令/core/隔离 DSH_HOME 台账 + fake gateway；断言台账前后哈希/写次数 | 草稿零写、确认才落库、撤销回滚、幂等、错误中文、降级不吞错 | 不得调收费模型/出网 |
| L3 真实模型 | 用户本人受控通道，真实生成草稿→确认→撤销 | 仅行为闭环与提示诚实，不评模型分数 | 不得用离线 mock 代替 L3 |

## 2. 冻结门 → 确定性用例（对应测试计划 P6-F01~F09）

| 门 | 通道 | 冻结确定性用例（实施后执行） | 当前 |
|---|---|---|---|
| P6-F01 四类可区分（人工/AI草稿/已确认/已失效，图标+虚线+文字+读屏，不单靠色） | L2 | fixture 造四类条目，断言 DOM 带可辨 role/aria 与文字标签，颜色非唯一编码；读屏名称可分 | NOT_RUN（UI 未建） |
| P6-F02 落库前预览：影响对象/字段 diff/来源记录可逐引用核对，引用实质支撑该句 | L2 | 预览快照列出将改实体+字段+来源记录 id；fake 句与来源逐条对应；不堆砌无关来源 | NOT_RUN（未建） |
| P6-F03 人工确认前绝不写入、不自动执行；草稿/拒绝零写；确认才落库；取消零写、幂等；validateActions 守卫不绕过 | L2 | 预览/拒绝/取消后台账哈希与写次数零变化；确认后仅目标实体落库；重复确认走 60s 幂等不双写；删除/越权步被白名单拒 | 现有确认流可测，新增溯源后复测 |
| P6-F04 撤销真实可见、限制/过期可见、回滚正确、留痕 | L2 | `undoStore`：10min TTL 过期条目不列出；仅最近 3 条；update 撤销回原记录、create 撤销删新建；`used` 二次撤销被拒；重启后句柄失效并引导 `/pm restore`；入口/剩余条数/过期提示可见 | 现网 ask-undo 可离线测，UI 留痕视图未建 |
| P6-F05 来源证据：每段带来源（N任务/N里程碑/口径版本）、确认人/时间/快照号，分组列依据可跳转 | L2 | 落库记录附来源集合+口径版本+确认时间+快照号；展开分组列依据记录 id；可跳转只读查看 | NOT_RUN（未建） |
| P6-F06 失效重校：引用删除/口径变更→置灰警告、不删、不参与汇总；一键重校前后对比、旧版留痕 | L2 | fixture 删被引记录/改口径→行置灰+警告条、不进汇总；重校后更新来源、旧版结论留痕可查；失效行不伪装有效 | NOT_RUN（未建） |
| P6-F07 离线降级/失败恢复：离线仅显缓存、不生成新建议；失败/拒绝/部分完成/超时/冲突有可行动状态+安全 fallback，不静默继续不吞错 | L1+L2 | fake gateway 抛 MODEL_TIMEOUT/RATE_LIMIT/CONTEXT_OVERFLOW/INVALID_CREDENTIAL/NO_ADAPTER/MISSING_CREDENTIAL 各自归一中文；NON_RETRYABLE 不换池；离线只显缓存草稿、禁用新生成按钮；台账不被部分写入 | 错误归一 L1 可测，降级条未建 |
| P6-F08 置信度诚实：无可验证模型置信度写「未提供」；禁无校准裸百分比环；只许定性分档且说明依据 | L1+L2 | fake 不返回置信度→UI 显「未提供」，不渲染 0-100 环/86% 数字；定性分档必须附依据来源数；禁止照抄 mockup 86% 环 | NOT_RUN（未建） |
| P6-F09 真实模型生成（草稿→确认→撤销） | L3 | 用户本人受控通道真实走一遍；仅验行为闭环与提示诚实；离线治理已由 F03/F04/F07 覆盖，不因未配 Key 把治理项判 BLOCKED | MANUAL_PENDING |

### 2b. 增补门（开发 p2-6-prep 评审后补，2026-10-17；实施后执行，当前 NOT_RUN）

| ID | 增补门 | 通道 | 确定性用例 | 当前 |
|---|---|---|---|---|
| P6-F10 来源引用带 project scope + 快照/修订指纹，可检测内容或口径变更（不只"存在"） | L2 | 每条 ref 存 projectId、被引记录快照哈希或 updatedAt 修订指纹、口径版本；记录被改/删/口径升版→指纹失配判失效，仅"记录仍存在"不得判有效；跨项目 id 同名不串用 | NOT_RUN（未建） |
| P6-F11 置信度不得凭来源数量造高低 | L1+L2 | 来源条数多≠高置信；无模型可验证置信一律「未提供」；定性分档必须另有可核验依据（且说明），禁止按 N 条引用映射高/中/低 | NOT_RUN（未建） |
| P6-F12 失效重校不得"删掉坏引用就把旧结论直接 fresh" | L2 | 重校必须对当前现存来源重新计算/重新生成结论并比对；仅清除失效标记、沿用旧结论即判 FAIL；旧版结论留痕可查、重校时间/人可溯 | NOT_RUN（未建） |
| P6-F13 apply 与 provenance 持久化半成功恢复 | L2 | 注入部分步成功、provenance/台账写失败：已写步与溯源记录一致或可回滚，不留"有结论无来源/有来源未落库"悬挂；重试幂等不重复写；失败给出可行动状态 | NOT_RUN（未建） |
| P6-F14 撤销拒覆盖确认后人工新修改 + 撤销审计 | L2 | 撤销前比对当前记录修订指纹/updatedAt：确认后被人工改过→拒覆盖并提示冲突（不静默回写）；撤销动作留审计（时间/对象/前后值/操作），非静默删除 | **现存缺口，见下 GAP-01** |
| P6-F15 覆盖全部 AI 确认入口（ask 多步 / 汇报叙述 / 会议纪要），不只 ask | L2 | 三个 AI 入口各自的草稿→确认→溯源→撤销/留痕都验；不得只测 ask-apply；report narrate、meeting summarize（fake gateway stub）同标准；WBS 导入不在此列 | NOT_RUN（未建） |
| P6-F16 无历史溯源不得一概标「人工」；WBS 人工导入不记 AI 来源；离线生成不可用不禁台账 CRUD | L2 | 早于溯源机制创建的历史记录标「来源未记录/历史」中性态，不臆断为人工；**WBS importTasksFromMarkdown 后断言「不产生 AI 来源条目」**；NO_LLM/离线仅禁用"新生成"，任务/里程碑/风险等台账增删改查照常可用 | NOT_RUN（未建） |

### 2c. 现存缺口（基于当前源码核实，须提给开发，非已具备）

- **P6-GAP-01（撤销覆盖人工新修改无守卫）**：现网 `commands/ask.ts` 撤销 update 分支（约 :226）直接 `table.put(change.original)` 恢复原快照，**未比对当前记录 updatedAt/修订指纹**；确认落库后若用户手工改过该记录，撤销会静默覆盖人工修改。create 分支仅判存在、不比对内容。apply 派发路径（约 :282）有 baseline updatedAt 冲突比较，但撤销回滚路径没有。P2-6 须补冲突守卫（F14），并补撤销审计。本缺口在现网即存在，独立测试不自行修产品。

## 3. 禁止与边界

- 不发明组织政策/阈值/保留期；未定项（置信分档阈值、快照保留期、在线分享）留待产品负责人拍板，不擅自定值。
- 不在本层启动 P2-6 产品实现；G3（P2-2 视觉门）未 PASS 前不进入 P2-6 实施批。
- 真实模型质量/分数不在离线门断言；L3 与 L1/L2 结论分开标注。

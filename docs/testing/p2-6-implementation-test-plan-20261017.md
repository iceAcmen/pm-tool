# P2-6 AI 溯源治理 · 实施期独立测试执行计划（2026-10-17）

> 性质：开发正式包交付后的**独立复验执行计划**，当前全部 **NOT_RUN / MANUAL_PENDING**，不代表已通过、非正式 PASS。冻结门见 `p2-6-deterministic-test-spec-20261017.md`；本件把 F01–F16 落成可执行夹具/断言顺序，并补现网只读探测证据。
> **并行例外（最新决策）**：P2-6 核心/治理/UI 候选可与 P2-2 并行开发与离线确定性测试；**最终验收/合入发布仍按门顺序，P2-6 不继承 P2-2 或原型的旧 PASS**，须在自身新 HEAD+产品 diff 上独立复验。UI 静态/功能自动结果**不当视觉 PASS**。
> 边界：本测试专家只写 `docs/testing` 与自有验证脚本，不改产品、不提交 git、不调收费模型、不碰宿主。

## 0. 现网只读探测证据（实施前基线，packages/dsh-pm-tool/src）

> 以下为正式实现前的现状事实，用于定位缺口；正式迁入版本交付后须在新代码上重测，不把现状当通过。

### 0.1 并发 / 写时 CAS（basis 与 baseline）
- `commands/ask.ts` `applyCore`（:239）对 update 步做 **baseline updatedAt 冲突比较**：tasks(:281-282)、milestones(:297-298)、risk/deliverable/meeting(:310/:323/:336)，`rec.updatedAt !== base` 抛 `DispatchSkip('内容已被他人更新，为避免覆盖未执行')`；链式 baseline(:354) 同目标后续步用本次落库新 updatedAt 比较，仅本次内存不持久。
- **撤销路径无 CAS（P6-GAP-01 仍在）**：`handleAskUndoCommand` update 分支(:226) 直接 `table.put(change.id, change.original)`，未比对当前记录 updatedAt/修订指纹；create 分支(:223) 仅判存在、不比对内容。确认落库后人工改过的记录会被撤销静默覆盖。
- 写路径每次真实写 bump updatedAt：`core/tasks.ts` updateTask(:209)、addTask(:124) 等；`core/task-checklist.ts` setTaskChecklistItemDone(:74/:134) **仅确有差异才 bump**（已相等直接返回不落盘）。
- 幂等：`core/idempotency.ts` 成功确认键 60s TTL(:24)，`applyKeyHash`(:142) 含 projectId+actorSegment+actions+baseline；幂等登记失败不回滚业务(:433)。

### 0.2 草稿缓存 / 重启持久化（history）
- 三链草稿均为**进程内 Map，重启失效**：WBS `core/wbs-ai.ts` draftCache(:46) remember/recall；汇报 `core/report-narrate.ts` narrativeCache(:71)；会议 `core/meeting-summarize.ts` draftCache(:94)。
- ask `undoStore` 进程内 Map(:171)，UNDO_TTL_MS=10min(:170)、listRecentUndo(limit=3)、used 一次性(:210)、重启失效并引导 `/pm restore`(:209)。
- 现网**无来源溯源元数据字段**（无 provenance/source/origin 枚举；`manualProgressNote` 是人工进度备注，不充当来源标记）。

### 0.3 确认入口（F15/F16；2026-10-17 协调裁定后修正：WBS 导入非 AI 链）
- **AI 溯源链（需 recordProvenance 落账 + 磁盘/重启断言）**：
  1. ask 多步 apply：`commands/ask.ts` applyCore（hook 已在）；
  2. 汇报叙述确认 executiveSummary 快照：`commands/progress-report.ts:103/:120`（**待补 hook**）；
  3. 会议建会+行动项 confirm：`commands/meeting.ts:135 addMeeting`、`:146/:164 addMeetingAction`（**待补 hook**，L2 用 fake gateway stub 驱动真实处理器）。
- **人工操作（不记 AI 来源，F16 中性「来源未记录」）**：WBS `importTasksFromMarkdown`（`core/task-import.ts:95`，经 addTask 落库）——**不补 hook**，磁盘断言改为「import 后不产生 AI 来源条目」。

### 0.4 安全转义现状
- 唯一 `dangerouslySetInnerHTML` 在 `client/board/widgets.tsx:739`（note 卡 markdown）；`renderMarkdown`(:31) 先整体转义 `& < > "`(:32) 再拼标签，原始 HTML/script 被中和。P2-6 新增 AI 文本渲染必须走同一转义，不得新增未消毒的 innerHTML。

## 1. 三通道与四链矩阵（真实/模拟分开）

| 通道 | 做法 | 可断言 | 禁止 |
|---|---|---|---|
| L1 mock 缝 | 注入 fake LlmGateway（prepareCall/stream 脚本化返回/抛错），零网络 | 候选顺序、错误归一、不重试集、prepared call 契约、零写、置信「未提供」 | 不得声称真实模型质量 |
| L2 离线真实闭环 | 真实命令/core/隔离 DSH_HOME 台账 + fake gateway；断言台账前后哈希/写次数 | 草稿零写、确认才落库、撤销回滚、幂等、错误中文、降级不吞错、半成功一致、撤销冲突守卫 | 不得调收费模型/出网 |
| L3 真实模型 | 用户本人受控通道，真实生成→确认→撤销 | 仅行为闭环与提示诚实 | 不得用离线 mock 代替；不评模型分数 |

AI 溯源链统一标准（F15）：ask-apply / report narrate / meeting summarize 各自走「草稿预览→确认前零写→确认落库→溯源→撤销/留痕」，不得只测 ask；WBS 人工导入按 F16 断言「不产生 AI 来源条目」，不要求溯源。

## 2. F01–F16 实施期执行用例（交付后逐条执行，当前 NOT_RUN）

> 每条给夹具、关键断言、通道；状态列默认 NOT_RUN，L3 项 MANUAL_PENDING。

| ID | 用例（夹具→断言） | 通道 | 状态 |
|---|---|---|---|
| P6-F01 四类可区分 | fixture 造 人工/AI草稿/已确认/已失效 四类条目；断言 DOM 带可辨 role/aria 与文字标签，颜色非唯一编码，读屏名称可分 | L2 | NOT_RUN |
| P6-F02 预览可核对 | 预览快照列出将改实体+字段+来源记录 id；fake 句与来源逐条对应，不堆砌无关来源；引用实质支撑该句 | L2 | NOT_RUN |
| P6-F03 确认前零写/幂等 | 预览/拒绝/取消：台账哈希与写次数零变化；确认后仅目标实体落库；重复确认走 60s 幂等不双写；删除/越权步被白名单拒；validateActions 守卫不绕过 | L2 | NOT_RUN |
| P6-F04 撤销可见/限制/回滚/留痕 | 10min TTL 过期条目不列出、仅最近 3 条；update 撤销回原记录、create 撤销删新建；used 二次撤销被拒；重启后句柄失效并引导 restore；入口/剩余条数/过期提示可见 | L2 | NOT_RUN |
| P6-F05 来源证据 | 落库记录附来源集合+口径版本+确认时间+快照号；展开分组列依据记录 id；可跳转只读查看 | L2 | NOT_RUN |
| P6-F06 失效置灰 | fixture 删被引记录/改口径→行置灰+警告条、不进汇总；失效行不伪装有效 | L2 | NOT_RUN |
| P6-F07 离线降级/失败恢复 | fake 抛 MODEL_TIMEOUT/RATE_LIMIT/CONTEXT_OVERFLOW/INVALID_CREDENTIAL/NO_ADAPTER/MISSING_CREDENTIAL 各自归一中文；NON_RETRYABLE 不换池；离线只显缓存草稿、禁用新生成按钮；台账不被部分写入 | L1+L2 | NOT_RUN |
| P6-F08 置信诚实 | fake 不返回置信度→UI 显「未提供」，不渲染 0-100 环/裸百分比；定性分档必须附可核验依据；禁照抄 mockup 86% 环 | L1+L2 | NOT_RUN |
| P6-F09 真实模型闭环 | 用户本人受控通道真实生成→确认→撤销；仅验行为闭环与提示诚实 | L3 | MANUAL_PENDING |
| P6-F10 指纹+scope | 每条 ref 存 projectId、被引记录快照哈希/updatedAt 修订指纹、口径版本；记录被改/删/口径升版→指纹失配判失效，仅「仍存在」不得判有效；跨项目 id 同名不串用 | L2 | NOT_RUN |
| P6-F11 置信不按来源数量 | 来源条数多≠高置信；无可验证置信一律「未提供」；禁按 N 条引用映射高/中/低 | L1+L2 | NOT_RUN |
| P6-F12 重校不冒充 fresh | 重校对现存来源重新计算/生成并比对；仅清失效标记沿用旧结论→FAIL；旧版结论留痕、重校时间/人可溯 | L2 | NOT_RUN |
| P6-F13 半成功恢复 | 注入部分步成功、provenance/台账写失败：已写步与溯源一致或可回滚，不留「有结论无来源/有来源未落库」悬挂；重试幂等不重复写；失败给可行动状态 | L2 | NOT_RUN |
| P6-F14 撤销拒覆盖人工新改+审计 | 撤销前比对当前记录修订指纹/updatedAt：确认后被人工改过→拒覆盖并提示冲突（不静默回写）；撤销留审计（时间/对象/前后值/操作）。**对应现网 GAP-01，须新代码具备守卫** | L2 | NOT_RUN（缺口待实现） |
| P6-F15 AI 链全覆盖 | ask-apply(ask:420) / report narrate(progress-report:122，待补 hook) / meeting summarize(meeting:165，待补 hook，fake gateway stub) 各自草稿→确认→溯源→撤销/留痕同标准；WBS 人工导入不在此列 | L2 | NOT_RUN |
| P6-F16 历史中性+离线不禁CRUD | 早于溯源机制的历史记录标「来源未记录/历史」中性态，不臆断人工；**WBS 人工 import confirm 断言「不产生 AI 来源条目」（本裁定覆盖 import 分支）**；NO_LLM/离线仅禁新生成，台账增删改查照常 | L2 | NOT_RUN |
| P6-X1 安全转义 | AI 草稿/叙述/会议文本经统一转义渲染，无新增未消毒 innerHTML；注入 `<script>`/事件属性被中和（对照 widgets.tsx:31 现状） | L2 | NOT_RUN |
| P6-X2 重启读回（持久化） | 重启后已确认落库记录的溯源来源/口径版本/审计仍可读（区别于现网进程内缓存重启失效）；草稿缓存可不持久，但已确认溯源必须持久 | L2 | NOT_RUN |

## 3. 每交付独立复验顺序（不继承旧 PASS）

1. 绑定：记录交付时 HEAD SHA + 产品 diff SHA（工作树指纹），P2-2 已验基线快照由开发唯一保存，本测试只等路径绑定、不并行生成。
2. 全量回归先跑：`build` 退出0、`vitest` 全绿、`coverage` 不退、`e2e` 确定性通过、`verify-isolation` 零污染；任一项失败即阻塞，不得过滤伪全绿。
3. 按 §2 逐链执行 L1/L2；F14/GAP-01 守卫缺失即 FAIL（不因现网已存在而豁免）。
4. L3 真实模型仅 MANUAL_PENDING，不由离线 mock 顶替。
5. 修复后受影响项必须复测；缺陷带可复现步骤+证据交开发；结论绑定被测 SHA。
6. G3 视觉门对 P2-6 UI 同样适用：静态/自动不当视觉 PASS，待主端带链接导航采证后独立审证。

## 4. 未决（留产品负责人拍板，测试不擅自定值）
- 置信定性分档阈值、快照/溯源保留期、在线分享（现网红线：离线本地、零外链、无网络请求）。
- ask-undo 10min TTL/最多 3 条是否调整；成功 Notice 组件形态执行期复核。

## 5. 边界
- 不启动产品实现、不改代码、不提交 git；原型（scratch，11/11、R-N5c 关闭）仅证明纯函数思路，**非 P2-6 正式 PASS**。
- 真实模型质量/分数不在离线门断言；L3 与 L1/L2 结论分开标注。

## 6. 独立复验结果（候选轮 · 2026-10-17）

> 独立测试专家复验，不采信开发自测。绑定与日志见 `p2-6-independent-verification-20261017.md` 与 `evidence-p2-6-20261017/`。本节只回填状态与证据，不改 §2 基线用例。

### 6.1 自动化回归（独立复跑，日志存证据目录）
| 门 | 结果 | 证据 |
|---|---|---|
| build（tsc+css+tsdown） | PASS 退出0 | 01-build.log |
| vitest 全量 | **PASS 184/184（16 文件）**；开发自报 178，独立复跑稳定 184（3× 复测一致；首跑 178 为一次性、未复现） | 02-vitest.log |
| coverage | PASS 退出0，子集阈值满足；All files 52.84 stmts / 85.32 branch（与基线持平，无回退）；provenance.ts 不在 coverage include 子集 | 03-coverage.log |
| verify-isolation | PASS 73/73，资产 169 before=after 零污染 | 05-verify-isolation.log |
| e2e | PASS（project/task 渲染、console errors=0，不出网不调模型） | 04-e2e.log |

### 6.2 F01–F16 / X1 / X2 回填（本轮独立判定）
| ID | 本轮判定 | 依据（源码+自动化，非全等于 L2 集成） |
|---|---|---|
| F01 四类可区分 | NOT_RUN（UI 未实现，无四类条目 DOM/role/aria） | panel.tsx:1911 仅静态「置信度未提供」文字，无台账视图 |
| F02 预览可核对 | NOT_RUN | 预览未列将改实体字段与来源记录 id 对应 |
| F03 确认前零写/幂等 | PARTIAL | 既有 60s 幂等/白名单守卫属现网，本批未重测；provenance 确认即 best-effort 写台账 |
| F04 撤销可见/限制/回滚/留痕 | PARTIAL | 10min TTL/最多3条/used/重启失效沿用现网未重测；F14 守卫+审计已接入 ask |
| F05 来源证据可跳转 | PARTIAL（r5 更新） | `/pm ask-provenance` 可读台账，UI 渲染最小只读来源列表（summary+refs 依据/上下文）；无分组展开/历史/跳转 |
| F06 失效置灰 | PARTIAL（r7） | classifyStale+ask-recheck 命令已接入并持久化；UI 置灰/警告条未渲染（待 G3/后续） |
| F07 离线降级/失败恢复 | NOT_RUN | 本批未注入模型错误；非本批新增，沿用现有降级 |
| F08 置信诚实 | PASS（静态） | CONFIDENCE_UNAVAILABLE=未提供，无 0-100/百分比接口；UI 静态文字一致 |
| F09 真实模型闭环 | MANUAL_PENDING（L3） | 不由离线 mock 顶替 |
| F10 指纹+scope | PASS（r7） | buildSourceRefs/validateSourceRefs/指纹/scope 单测覆盖；M-3 常量统一，版本死分支消除 |
| F11 置信不按来源数量 | PASS（静态） | 无按 N 条引用映射高/中/低接口 |
| F12 重校不冒充 fresh | PARTIAL（r7） | recheckProvenance 不可变历史+冻结；`/pm ask-recheck` 命令接入、recordRecheck 持久化、不洗白；UI 重校结果渲染未做 |
| F13 半成功恢复 | PARTIAL（r6） | 启动自动 sweep(index:112)+lazy sweep+pendingCount 暴露（B-2 基本关闭）；磁盘脚本 seed pending 幂等并入；仍非真实写失败注入、未测重启后再 sweep |
| F14 撤销拒覆盖+审计 | PASS（纯函数+ask 接入） | classifyUndoTarget 覆盖 update/create、批量部分冲突、recordUndoOutcome 审计；修复现网 GAP-01；磁盘脚本 seed 行标 used/undone；见 m-3/m-4 弱点 |
| F15 AI 链全覆盖 | PARTIAL（r6） | ask/report/meeting 三 AI 链 hook 真；磁盘集成落账+重启读回（B-3 核心 PASS）；report 任务标 context 非 basis、meeting draftCache 非磁盘；WBS 人工导入走 F16 |
| F16 历史中性+离线不禁CRUD | PARTIAL（r6） | WBS 人工 import 负断言（无 AI 条目）磁盘 PASS；历史中性态标注/离线 CRUD 仍未重测 |
| X1 安全转义 | PASS（静态） | 无新增 dangerouslySetInnerHTML；数据层原样保留，转义归未实现的 UI |
| X2 重启读回 | **PASS（r6，B-3 核心）** | verify-provenance-disk.mjs 真实 cordis+JsonStorageBackend(tmpdir)+spawnSync 新进程读回账本 kinds+业务记录；report/meeting 条目持久化可读回 |

### 6.3 阻塞项（必须先补，补前不得放行）与缺陷清单
见独立报告 §缺陷清单（B-1~B-3 阻塞，M-1~M-3 主要，m-1~m-5 次要）。本轮结论：**纯函数核心与回归自动化 PASS，整体候选 NOT PASS**。

**r8 最终状态快照（2026-10-17）**：核心/治理/次要 m-1~m-5 全部收口，离线确定性门 = PASS 候选（build0/193-193/coverage0/隔离75-75/e2e PASS）。剩余仅 UI 展示层（非核心，排 G3/后续）：F05 来源分组展开/跳转、F06 失效置灰、F12 重校结果渲染；命令层 ask-provenance/ask-recheck 已可用。非前置：F02 面板/F01/F07；F09 L3 MANUAL_PENDING。发布合入待 UI 展示层+G3 视觉门，不凭自动化绿单独放行。

### 6.4 第二轮补齐回填（同一 HEAD 21cdc94，tracked diff SHA `0b7fb29c…88435`）
- 独立复跑全门全绿：build0、vitest 184/184、coverage 退出0、隔离73/73零污染、e2e PASS（证据 `evidence-p2-6-r2-20261017/`）。
- F14 审计链成立（recordUndoOutcome 落盘+used 标记）；settings 有界淘汰成立；四链挂点仍真。
- 缓解：新增 `/pm ask-provenance` 可读台账并手动触发 sweep；B-1 残余（recheck/失效置灰/重校仍未接入）、B-2（sweep 非自动、无状态机、pending 未暴露）、B-3（四链集成/重启/边界测试缺，无并发双写用例）仍阻塞；M-1/M-2/M-3 未修。整体仍 NOT PASS。

### 6.5 第三轮回填（同一 HEAD 21cdc94，tracked diff SHA `822bf3b9…14f4`）
- 独立复跑全门全绿：build0、vitest 185/185（store 10 例）、coverage 退出0、隔离73/73零污染、e2e PASS（证据 `evidence-p2-6-r3-20261017/`）。
- F13 只读命令成立（返回 `{entries}`），UI 确认后拉取并渲染最小只读来源列表（summary+refs 依据/上下文）；sweep 闭环（pending→confirmed）成立但无启动钩子；无影响 diff 预览/撤销冲突明细/失效置灰。
- 放行前置：①#15 完整 UI 非本批硬阻塞（影响 diff/冲突明细挂后续 G3 批）；②四链真实领域命令级集成+重启读回=**强制阻塞（B-3）**。B-1 残余/B-2/M-1/M-2/M-3 仍未消。整体仍 NOT PASS。

### 6.6 第四轮回填（同一 HEAD 21cdc94，新增 verify-provenance.mjs SHA `95521b41…b5f1`）
- 独立复跑全门全绿：build0、vitest 185/185、coverage 退出0、隔离 **74/74**（新脚本纳入）零污染、e2e PASS（证据 `evidence-p2-6-r4-20261017/`）。
- verify-provenance.mjs 为内存假域：未驱动四真实命令、重启=内存克隆、并发非同目标、F13 未真实失败注入；**不满足 B-3/X2 真实磁盘重启**。
- 判定：影响 diff 预览/冲突明细**视觉面板非发布前置**（F14 守卫行为本身前置且已 PASS）；真实磁盘集成门=强制阻塞；UI 视觉待 G3。推荐顺序见独立报告 §8.5。整体仍 NOT PASS。

### 6.7 第五轮回填（同一 HEAD 21cdc94，与 r4 工作树一致，脚本 SHA `95521b41…b5f1`）
- 独立复跑全门全绿：build0、vitest 185/185、coverage 退出0、隔离 **74/74** 零污染、e2e PASS（证据 `evidence-p2-6-r5-20261017/`）。
- verify-provenance.mjs 真驱动真实账本 API（recordProvenance/listProvenance/sweepPending/recordUndoOutcome），内存假域 settings 行形状与真实表一致；但未驱动四真实命令、重启=内存克隆、并发非同目标、F13 未真实失败注入。
- **候选放行结论：NOT PASS（不可放行）**。PASS：F08/F11/F14/X1（静态/纯函数/守卫）；PARTIAL：F03/F04/F05/F10/F13/F15；BLOCKED：F06/F12（未接入）、X2（无真实重启）；NOT_RUN：F01/F02/F07/F16；MANUAL_PENDING：F09。
- 真实宿主 storageDomain 命令级集成补充方式推荐见独立报告 §9.4；最终拍板留用户。

### 6.8 协调裁定（2026-10-17）与修订后 B-3 验收口径
**协调裁定（独立测试认可，与 M-1/M-2 发现一致）：**
1. **WBS task import confirm = 人工导入，不记 AI 来源**。正确行为 = F16「来源未记录」中性态；**不补 hook**；磁盘断言改为「import 后不产生任何 AI 来源条目」（F16 正好覆盖 import 分支）。
2. **汇报 narrate confirm = AI 叙述确认**：**补 recordProvenance hook**（修 M-1，任务/里程碑确定性数字依据进 refs），并加磁盘/重启断言。
3. **会议 summarize confirm（离线需 llm）**：按 L2「真实命令 + 隔离台账 + fake gateway」注入确定性 llm stub，驱动真实处理器建会落账，可离线复现（修 M-2 自指口径）。

**修订后 B-3 真实磁盘集成门验收（替换原「四链」表述，WBS 移出 AI 链）：**
- 真实磁盘脚本（复用 cordis+JsonStorageBackend(tmpdir)+子进程重开同 root，见独立报告 §9.4）覆盖：
  - ask-apply 确认落账 → 子进程重启读回（X2）；
  - report narrate 确认落账（hook 新增）→ 重启读回，refs 挂确定性数字依据；
  - meeting summarize 经 fake gateway stub 真实建会落账 → 重启读回；
  - WBS import 后断言台账无 AI 条目（F16）；
  - F13 真实写失败→pending→重启 sweep 并入；F14 冲突守卫+审计落盘读回；同目标并发不丢。
- 仍强制：B-1 残余（F06/F12 接入）、B-2（自动 sweep/pending 暴露）、M-3 真实版本号；M-1/M-2 随 #2/#3 修复。

**r6 回填（2026-10-17，独立复跑 build0/187-187/coverage0/隔离75-75/e2e PASS）：**
| §6.8 验收项 | r6 结论 | 偏差 |
|---|---|---|
| ask-apply 落账→子进程重启读回（X2） | PASS | 真实 cordis+JsonStorageBackend(tmpdir)+spawnSync，读回 kinds+assignee |
| report narrate hook→重启读回、refs 数字依据 | PARTIAL | hook 真、持久化读回；任务标 context 非 basis，未断言 refs 数字存活 |
| meeting summarize 离线 stub→建会落账→重启读回 | PARTIAL | 进程内 recall 跳过 llm 确定性；draftCache 非磁盘，重启不重派生；持久化读回 PASS |
| WBS import 负断言（无 AI 条目） | PASS | 导入前后台账条数相等 |
| F13 真实写失败→pending→重启 sweep | PARTIAL | seed pending 幂等并入；非真实失败注入、未测重启后再 sweep |
| F14 冲突守卫+审计落盘读回 | PARTIAL | seed 行标 used/undone；未端到端跑 clean→restore/changed→refuse |
| 同目标并发不丢 | PARTIAL | 相同动作重放幂等、updatedAt 不推进；非分歧补丁真实竞争 |

**B-3 核心（真实磁盘命令级集成+X2 重启读回）= PASS 可关闭；F13/F14/并发深度降为次要观察项。** r6 后仍阻塞：B-1残余（F06/F12 未接入）；放行前必修 M-3（版本号硬编码1）。整体候选仍 NOT PASS。


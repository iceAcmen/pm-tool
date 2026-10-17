# P2-6 复测操作日志（2026-10-18，隔离实例 :3172）

- 被测实例：`http://127.0.0.1:3172/?token=Vsx9cIInacUzrKnMx0w68jrS3RMlRsn3bSCg5htdmL4`（未重启服务、未改代码）
- 驱动方式：Playwright（channel=chrome）真实 UI 点击，宿主 deepseek-harness `NODE_PATH=node_modules/.pnpm/node_modules`
- 数据根：`/tmp/dsh-p2-iso-20261017/data/pmtool/`（DSH_HOME=`/tmp/dsh-p2-iso-20261017/home`）
- 硬约束遵守：全程零 mock、零伪造；未删除/修改任何既有业务记录；未新增任何业务记录（模型阻断，未走到确认入库）。

## 前置阅读结论（决定走哪条 AI 路径）

1. 可经「真实 AI 助手」同时生成任务+交付物并写 AI 溯源的 UI 路径只有 **AI 副驾 ask → ask-apply**（`kind=ask-apply`，`ask.ts:459-473`，refs 由 `buildSourceRefs` 从真实落库动作构建）。
2. AI 助手「WBS 拆解」确认入库走 `task importmd ... confirm`（`task.ts:452`，人工 Markdown 导入），**不调 recordProvenance**，属 F16 负例，不产生 AI 溯源条目；且该面板无法创建交付物。
3. 溯源面板（`provenance-panel.tsx`）状态条：`生效中 / 已变更(警告) / 已失效 / 缺来源 / 待重校`；「已变更/已失效」警告条只在「立即重校」发现被引记录 changed/missing/manual-review 后出现，触发前提是先有已确认条目且其来源被删/改；本次范围禁止删改既有记录、且无草稿，故该条未触发（如实说明，不伪造）。
4. 记录落盘：`data/pmtool/tasks/*.json`、`data/pmtool/deliverables/*.json`；台账 `data/pmtool/settings/pmProvenanceLedger.json`（entries[]）。

## 逐步骤时间线（时间为本地 UTC+8）

| # | 时间 | 动作（真实 UI） | 结果 | 截图 |
|---|------|----------------|------|------|
| 1 | 00:32 | 浏览器打开实例 token URL，host 首页正常，控制台 0 错误 | 基线环境可达 | `shots/00-host-home.png` |
| 2 | 00:33 | 左侧导航点「项目管理」打开 PM 工作台（G3 验收项目） | 基线：5 任务 / 1 交付物，台账空 | `shots/01-pm-panel.png` |
| 3 | 00:35 | 顶部「AI 副驾·内嵌」打开建议层；车道显示「生产 Key」（prod，与 aiModelMode 一致） | 诊断/草稿待确认双页；无草稿 | `shots/02b-copilot-layer.png` |
| 4 | 00:36 | 副驾只读诊断输入：「两步计划：新建任务『P2-6 复测验证任务』(史冰冰/P1/2026-10-25)；新建交付物『P2-6 复测报告』(planned/2026-10-25)，不改现有记录」，点发送 | **错误气泡**：副驾暂不可用：当前模型通道 `ark-plan/deepseek-v4-1-flash-260910` 未配置或缺少适配器（NO_ADAPTER）。无计划、无草稿 | `shots/03-before-generate.png`、`shots/04-draft-plan.png`（草稿页空） |
| 5 | 00:37 | 副驾切「PoC 免费」车道，同一问题重发 | **错误气泡**：`openrouter/openrouter/free` 未配置或缺少适配器（NO_ADAPTER）。无计划、无草稿 | `shots/05-poc-diag.png`、`shots/06-poc-draft.png`（草稿页空） |
| 6 | 00:40→00:42 | 顶部「AI 助手」→ WBS 任务拆解，PoC 车道，填目标「官网改版拆解…」点生成草稿，轮询 140s | 预览始终为空，无草稿文本、无错误气泡（免费候选链静默超时/失败），未到确认入库 | `shots/07-aiassist-wbs-poc-pick.png`、`shots/08-aiassist-wbs-poc-result.png` |
| 7 | 00:44 | 副驾切回「生产 Key」，同一两步问题重发（复测 prod，取干净错误气泡） | NO_ADAPTER `ark-plan/deepseek-v4-1-flash-260910`；草稿页「暂无草稿」 | `shots/09-prod-ask-diag.png`、`shots/10-prod-ask-draft.png` |
| 8 | 00:44 | AI 助手 → 进度汇报叙述，prod，点生成草稿（零输入） | **预览错误**：AI 叙述暂不可用：`ark-plan/doubao-seed-2-1-lite-260915` 未配置或缺少适配器；可用 `/pm report generate` 确定性快照兜底 | `shots/11-narrate-prod-pick.png`、`shots/12-narrate-prod-result.png` |
| 9 | 00:45 | AI 助手叙述（面板默认车道）再次生成 | 同上 NO_ADAPTER `ark-plan/doubao-seed-2-1-lite-260915` | `shots/13-narrate-poc-pick.png`、`shots/14-narrate-poc-result.png` |
| 10 | 00:48 | AI 助手 → WBS 拆解，prod 车道，填官网改版目标生成草稿 | **预览错误**：AI 拆解暂不可用：`ark-plan/deepseek-v4-1-flash-260910` 未配置或缺少适配器；无草稿，未确认入库 | `shots/15-wbs-prod-pick.png`、`shots/16-wbs-prod-result.png` |

> 注：`shots/02-copilot-open.png` 与 01 同帧（该次切换未生效，被 02b 取代）；`04/06/10` 为切到「草稿待确认」后的空态截图，用于证明无草稿。

## 磁盘核对（本任务自身零业务写入）

- 本任务动作前 00:33 基线：`tasks/` 5 条（t-g3-1..t-g3-5）、`deliverables/` 1 条（dlv-0001）。
- 本任务全程所有 AI 调用均 NO_ADAPTER，未走到 apply/确认入库，**自身未写任何业务记录**。
- 台账 `pmProvenanceLedger.json`：`entries: []`，`updatedAt=2026-10-17T15:04:04.535Z` 本任务全程未变（无任何 ask-apply / wbs-import / report-narrate / meeting-summarize 条目）。
- 本任务唯一写入：设置项 `settings/aiModelMode.json`（切车道持久化，非业务记录；末次落盘 prod）。
- 注意：实例为多任务共享；本任务结束后（00:49）另一并行任务手工新增 `tasks/t-0001.json`（「O2 链接补证任务」），非本任务所写，本任务未改动/未删除。
- 既有记录原文见 `disk-baseline.md`（00:33 基线摘录）。

## 未执行项（如实声明）

- 未点击任何「确认入库」/「整批执行」（无草稿可确认）。
- 未执行 MANUAL_PENDING→DONE：F09 L3 真实操作未发生，本复测**不**将该用例标 DONE，维持 MANUAL_PENDING。
- 未触发「已变更/已失效」警告条：无已确认溯源条目，且范围禁止删改既有来源记录。
- AI 助手「会议纪要归纳」未单独尝试（与叙述/WBS 共用同一 LLM 网关与适配器判定，阻断原因相同）。

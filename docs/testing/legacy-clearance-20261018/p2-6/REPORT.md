# P2-6 复测报告（2026-10-18）—— 结论：BLOCKED（环境阻断，非功能失败）

## 一、结论（先说结果）

**BLOCKED**：隔离实例内所有真实 AI 通道（副驾 ask、AI 助手 WBS、进度叙述）均返回 `NO_ADAPTER`（「当前模型通道 … 未配置或缺少适配器」），**无任何草稿生成**，因此「确认入库 / MANUAL_PENDING→DONE / 溯源警告条」均未能真实发生；未 mock、未伪造、未新增或删改任何业务记录。F09 L3 用例维持 **MANUAL_PENDING**，不得标 DONE。

- 新增任务记录：**无**（未生成，无 id）
- 新增交付物记录：**无**（未生成，无 id）
- 溯源台账条目：**无**（`entries: []`）

## 二、证据链（补证前状态 → 动作 → 结果证据 → 结论）

### 补证前状态（基线，复测前）
- UI：G3 验收项目，5 任务 / 1 交付物，AI 溯源台账空（`shots/01-pm-panel.png`）。
- 磁盘：`data/pmtool/` 下 tasks 5、deliverables 1；台账 `entries: []`，`updatedAt=2026-10-17T15:04:04.535Z`（`disk-baseline.md`）。
- 车道设置：`settings/aiModelMode.json`（复测开始时 prod）。

### 动作 1：AI 副驾 ask（prod）请求「建 1 任务 + 1 交付物」真实计划
- 动作：只读诊断输入两步计划诉求，点发送（`operation-log.md` #4）。
- 结果证据：错误气泡「副驾暂不可用：当前模型通道 `ark-plan/deepseek-v4-1-flash-260910` 未配置或缺少适配器。」（`shots/09-prod-ask-diag.png` 干净气泡；首次同见 `shots/04-draft-plan.png`）；草稿待确认页「暂无草稿」（`shots/10-prod-ask-draft.png`）。

### 动作 2：副驾切 PoC 免费车道重发同一问题
- 结果证据：错误气泡「`openrouter/openrouter/free` 未配置或缺少适配器」（`shots/05-poc-diag.png`）；草稿页空（`shots/06-poc-draft.png`）。

### 动作 3：AI 助手 WBS 拆解（prod）生成草稿
- 结果证据：预览错误「AI 拆解暂不可用：`ark-plan/deepseek-v4-1-flash-260910` 未配置或缺少适配器」（`shots/16-wbs-prod-result.png`）；PoC 车道尝试 140s 无草稿（`shots/08-aiassist-wbs-poc-result.png`）。

### 动作 4：AI 助手进度汇报叙述（prod）生成草稿
- 结果证据：预览错误「AI 叙述暂不可用：`ark-plan/doubao-seed-2-1-lite-260915` 未配置或缺少适配器。你仍可用 /pm report generate 生成确定性快照」（`shots/12-narrate-prod-result.png`、`shots/14-narrate-poc-result.png`）。

### 结果证据（磁盘）
- 本任务自身：所有 AI 调用 NO_ADAPTER，未走到 apply/确认入库，**未写任何业务记录**；台账全程 `entries: []`、`updatedAt=2026-10-17T15:04:04.535Z` 未变（`disk-baseline.md`）。
- 本任务唯一写入：设置项 `aiModelMode.json`（切车道持久化，非业务记录）。
- 共享实例说明：本任务结束后（00:49）另一并行任务手工新增 `tasks/t-0001.json`（「O2 链接补证任务」），非本任务所写，未改动/未删除；deliverables 仍 1 条，台账仍空。

### 结论
模型通道在隔离 Web 宿主内全部 `NO_ADAPTER`，AI 草稿不可得，确认入库与状态迁移无对象可做 → **BLOCKED（环境缺模型适配器/凭据）**，非 P2-6 溯源功能缺陷。

## 三、阻断原因定位（代码 + 环境对照）

| 层 | 证据 |
|----|------|
| 路由 | `core/model-route.ts`：prod 候选走 `ark-plan`（Flash/Pro/GLM），poc 候选走 `our-free-model/kilo-auto/*`、`openrouter/free*` |
| 归一化 | `core/ai-client.ts:157-159`：上游 `NO_ADAPTER` → 中文「当前模型通道 X 未配置或缺少适配器」，且属 NON_RETRYABLE，不换池 |
| 环境 | 进程环境无 `CODING_PLAN_API_KEY`；DSH_HOME 内 `our-free-model/availability.json` 4 个免费候选全部 unavailable（region-blocked/unknown）；隔离 Web 宿主未注册 ark-plan / our-free-model / openrouter 的 LLM 适配器 |
| 表现 | 副驾 prod/poc、AI 助手 WBS prod、叙述 prod 均 NO_ADAPTER；WBS PoC 140s 静默无草稿 |

## 四、解除阻断所需（环境侧，非本次可做）

1. 隔离 Web 宿主装载/注册 LLM provider 适配器（ark-plan 方舟 Coding Plan；或可用的免费网关适配器），并在「设置→模型」录入方舟 Key（`CODING_PLAN_API_KEY`，凭据服务解析）。
2. 就绪后重跑本流程：副驾 ask 生成「任务+交付物」两步计划 → 整批执行 ask-apply → 核对台账 `kind=ask-apply` 条目（refs/confidence/undo/status=confirmed）与磁盘 JSON → 再按需重校观察「已变更/已失效」警告条。

## 五、证据清单（绝对路径，目录 `…/legacy-clearance-20261018/p2-6/`）

- `operation-log.md`：逐步骤时间线与截图映射
- `disk-baseline.md`：基线磁盘 JSON 摘录（既有记录未改动）
- `REPORT.md`：本报告
- `shots/00-host-home.png` … `shots/16-wbs-prod-result.png`（18 张，编号见 operation-log.md）

## 六、未完成项声明（不伪造）

- 未点确认入库 / 整批执行；无入库任务/交付物 id 与溯源字段可摘录。
- MANUAL_PENDING→DONE 未真实发生，F09 L3 维持 MANUAL_PENDING。
- 失效/警告条未触发（无已确认条目、禁止删改来源记录）。
- 会议纪要归纳未单独尝试（同网关同判定）。

---

# r9 复测（2026-10-18 03:55–04:02，实例重启后）—— 结论：PASS（F09 L3 DONE）

> 本章为权威复测结果；上方旧章为「补证前状态」（旧实例 NO_ADAPTER BLOCKED，其 mtime/旧数据根口径已作废，根因系旧实例早于 ark-plan 配置启动，重启后已加载）。

## 补证前状态（BLOCKED 已解除）

- 旧章 BLOCKED 仅适用于 02:49 启动的旧实例；03:35 实例重启（PID 10819）后 ark-plan 适配器已加载。
- 写入前进程级核验数据根 = `/Users/bytedance/Projects/dsh-pm/pm-tool/data/pmtool/`（仓库内 gitignored dev 数据，非用户业务；证据 `r9-ready/disk-evidence.md` §1）。
- provider 真实核验：直连 ark HTTP 200 + 真实补全；UI 生产车道真实返回计划，无 NO_ADAPTER（§2）。

## 动作（真实 UI，无 mock）

1. 副驾 ask（生产 Key）真实生成 1 步计划：新建交付物「P2-6 复测：AI 溯源验证报告」（planned / 2026-10-25）；task.create 步被 ALLOWED_OPS 剔除（设计内，不含 task.create）。
2. 真实点击「整批执行（1）」确认入库。
3. 磁盘核对交付物 JSON + 台账 entry；UI 目视溯源台账；真实「立即重校」；观察警告条。

## 结果证据

- 入库交付物：`deliverables/dlv-0001.json`（status=planned，dueDate=2026-10-25，name 带测试前缀）。
- 台账 entry：`prv-mvctk2dq-8ws70u`，`kind=ask-apply`，`status=confirmed`，`confidence=未提供`，`summary=已应用 1 条 AI 建议`，`refs=[]`（纯新建无依据，设计内），undo handle `undo-mvctk2dq-4l9kcp`（未使用），audit「业务已落库，溯源已登记」；重校 history conclusion=consistent。
- 溯源目视：AI 助手抽屉「AI 溯源台账」显示 AI 询问应用·与来源一致·置信度未提供·记录号·来源 0 条（`r9-ready/shots/05、06`）。
- 警告条（F06）：本 entry refs=[] 无失效对象，重校「一致 1 · 待处理 0」，不出现警告条属设计内正确，不编造失效场景。
- 截图：`r9-ready/shots/01-ask-diag.png`、`02-ask-draft.png`、`03-applied.png`、`04-deliverable-list.png`、`05-provenance-ledger.png`、`06-recheck.png`。
- 逐步骤时间线：`r9-ready/operation-log-r9.md`；磁盘/网络摘录：`r9-ready/disk-evidence.md`。

## 结论

**PASS**：F09 L3 真实模型闭环（生成→确认入库→台账登记→重校）真实走通，MANUAL_PENDING→**DONE**。
保留项：测试交付物 dlv-0001 与台账 entry 按要求留存不清；F09「撤销」步不实做（保留证据，撤销由 L2/F04 覆盖）；F06 警告条本流程设计内不触发。

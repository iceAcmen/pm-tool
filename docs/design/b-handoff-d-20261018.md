# B → D 交接：体验修复可执行探针与独立旅程清单（2026-10-18）

> B 独占 pm-tool 业务代码；A 写系统契约，D 做独立旅程验收。本文件给出 D 可直接复现的 headless 探针与 GUI 观察点。
> 基线 `6b0d2a3`；未 commit/push；未启停 3172；未写正式 data/exports/backups。

## 0. 回归基线（B 已绿，D 复跑确认）

```bash
cd /Users/bytedance/Projects/dsh-pm/pm-tool/packages/dsh-pm-tool
. "$HOME/.nvm/nvm.sh"; nvm use 22
npx vitest run                       # 473 通过
pnpm run build                       # tsc + css + tsdown，6 个产物
node scripts/verify-isolation.mjs   # 87/87，资产污染 0
```

## 1. Headless 命令探针（无需 GUI）

### 1.1 P0-04 draftId 一键确认 / plan 误贴零写 / 整批原子（合同 §7）
经 E2E 缝（`DSH_PM_E2E=1`，确定性 fixture，不调模型、不落库即失败路径）：

```bash
DSH_PM_E2E=1 node scripts/e2e.mjs   # 或复用既有 e2e 入口；观察 capture-fixture 草稿含 draftId
```

手测命令序列（真实模型可用时）：
1. `/pm capture <项目> "<会话文本>"` → 输出草稿编号 `draft-xxxx` 与一键确认命令；**不落库**。
2. `/pm capture-apply <项目> draft-xxxx` → 整批落库，返回短摘要（ID｜标题）。
3. 误贴 plan：把含 `plan:[{stepId...}]` 的 JSON 喂 capture-apply → 固定恢复文案、**零写入**、指路走 ask-apply。
4. 过期/错误 draftId → 报错给重试指路，不写入。
5. 任一候选非法 → 整批拒绝，已建 0 个。

纯逻辑单测：`src/core/capture.test.ts`（classifyCapturePayload 5 例）、`src/client/board/persist.test.ts`（碰撞/夹紧/下沉 6 例）。

### 1.2 P0-09 metric 人读摘要 + 原始字段（§6.2）
`/pm metric <项目>` 输出裸 JSON：`summary`（人读）+ `total/byKind/undoOutcomes/appliedSteps/pendingCount/last`，可直接 `JSON.parse`；小样本附“样本较少不下结论”。

### 1.3 task update 短摘要（§5）
`/pm task update <id> {"status":"done","progress":100}` → 首屏「任务已更新并保存：<id>｜标题 / 变更：状态：进行中 → 完成，进度：30% → 100%」，完整字段在折叠块。

## 2. GUI 独立旅程（对应权威用例 §12）

### 2.1 副驾 Portal（§3）
- 开关 AI 副驾前后，主内容框宽目测/尺测一致；1440 下主区 ≥640，外壳无横滚。
- 右缘拖 420–560（默认480），刷新保留；「—」最小化成竖标签、上下文不丢；ESC 关闭并焦点回到开关。
- 缩到 560–979 看底部 sheet ≤45vh；<560 全屏。

### 2.2 看板（§4）
- 布局编辑拖拽/缩放防碰撞；重叠被下沉/拒存；保存先落盘刷新成功才提示；刷新/重启保留。
- 「恢复默认」需二次确认；旧/越界/未知类型布局不白屏、走 banner 提示；长内容卡内滚；撤销 ≤20 步。
- **R4 修复（首屏误判全部未知）**：根因为首屏 `useState` 在 `registerKnownWidgetTypes` 副作用前执行、模块 KNOWN_TYPES 为空，导致 11 类既有卡全被跳过；改为显式传 knownTypes，旧布局身份/config/x/y/w/h 原样保留，仅未来未知类型跳过并合并为单条非阻断摘要。

### 2.3 反馈（§5 / J5）
- 成功短摘要不 dump 实体；错误单处持久、手动关。
- **J5 反馈分型**：命令层成功用 `[pm:summary]`/`[pm:detail]` 信封分离短摘要与完整字段；`parseFeedback` 纯函数分型，无信封的既有命令原样回退（不被吞）。成功提示 ≤2 行、无 HTML/MD/完整实体、3s 自动消失；完整字段进独立可展开详情卡（自带限高滚动）；错误判定集中、持久单处。
- task update 成功短摘要：`任务已更新｜t-0026 补充验收说明` + `已修改：说明`；保存成功后编辑抽屉关闭，`finally` 复位提交态，不卡「提交中」。
- 原生 `window.confirm` 清零：所有删除/级联走自定义 ConfirmDialog（对象类型+标题+ID+级联/影响数、danger 确认、ESC/取消、焦点归还、防重复）；备份/转任务/删已保存视图为中性确认。

### 2.4 P0-04 一键确认（§7 R-P2）
- 内嵌副驾「＋ 对话补档」→ 生成草稿 → 草稿卡预览候选（标题/截止/负责人/证据数）→ 「确认落库」按钮等价 `capture-apply <项目> <draftId>`，免抄命令/JSON；成功结果卡 + 撤销出口（`/pm task delete <id>` 溯源）；失败保留草稿可重试/放弃（R-P4）。

## 3. D 需自行取证、B 不写死的项
- rail OKR 重复（合同 §9.4 Open Decision：先探针取证，不臆造修复）。
- host 侧 CodeBlock ≥12 行折叠/复制（C 方负责宿主；B 只保证 pm 侧给“短摘要 + 可辨识原始块”）。

## 4. 已知边界（非缺陷）
- host 侧 CodeBlock ≥12 行折叠/复制（C 方负责宿主；B 只保证 pm 侧给“短摘要 + 可辨识原始块”）。

## 5. 附加 verify（B 新增）
- `node scripts/verify-no-native-confirm.mjs`：静态断言 `window.confirm=0`、confirmDanger 调用 ≥12。
- 隔离门 88/88、资产污染 0；单测 45 文件 / 487 通过（含 J5 真实链 task-feedback.test.ts：真实 handleTaskCommand → classifyFeedback → Notice 契约）；client-bundle/dashboard/ui-feedback/copilot/copilot-plan/ask-apply/p0-integration(28)/tasks/gui-contract/web/gantt-drag 全绿。
- **DEF-B1 根因（R4 fix3）**：BoardBento 用 `Object.keys(WIDGET_REGISTRY)` 取已知类型，而 registry 是 `Map`，`Object.keys(Map)` 运行时恒为 `[]`，故同步传入空 Set、11 类全被误判未知跳过。改为同源 `knownWidgetTypeSet()`（直接迭代 `WIDGET_REGISTRY.keys()`）；verify-client-bundle 新增从构建产物 `lib/client/board` 运行时加载 registry+persist 的断言（keys=16、默认 kept=8 skipped=0、未来未知仅跳过 1 条），并钉住构建产物 BoardBento 调用 helper、禁止 Object.keys(Map)。
- p1c-integration 固定 sleep(80) 与写队列外 fire-and-forget 钩子竞态，门控负载下偶发 rows=0；改轮询等待（超时即失败，不掩盖缺失），非产品回归。

## 6. 主端重载复验步骤（不重启 3172）
- **启动/构建 profile 必须是 `pm`（本包 dsh-pm-tool），不是 `web`**：`cd packages/dsh-pm-tool && pnpm run build`（profile=pm，tsc+cp panel.css+tsdown）；勿用 web profile 构建，否则 B 侧看板/反馈产物不进真实 bundle。
1. 主端重载前端（刷新工作台 / 重新加载插件前端），勿重启 3172 进程。
2. 进入「总览」：11 类既有卡（completionHero/milestoneDeliverable/projectScale/objectiveProgress/peopleLoad/riskMatrix/weeklyPlan/completionTrend/kpiMetric/recordList/queueCard）全部原样渲染，身份/config/坐标尺寸不变；仅未来未知类型跳过并给单条摘要。
3. 更多菜单「AI 副驾 · 侧边」与 overlay 事实一致。
4. J5：编辑某任务说明并保存 → 成功提示仅两行（`任务已更新｜<id> <标题>` + `已修改：…`），3s 自动消失，无完整实体/HTML/MD/内滚；完整字段在「查看完整字段」展开卡；抽屉保存后关闭，不卡「提交中」；错误提示持久单处。

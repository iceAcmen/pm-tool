# B4 项目看板集成终审（project-default / scope / 作用域隔离）· 2026-10-20

> QA 独立源码核 + targeted vitest 复跑（不信作者计数）。仅 targeted，未跑 full（等 isolation C2/污染修复）。GUI 后续由 Main 采证，QA 不冒 Gpass。

## 1. 复跑结果（独立）
`npx vitest run` 目标 4 文件 = **24/24 PASS**：
- `client/board/project-default-layout.test.ts` 6
- `client/board/scope-snapshot.test.ts` 4
- `client/board/persist.test.ts` 11
- `commands/dashboard.test.ts` 3

## 2. 逐项源码核对

### 2.1 scopeSnapshot 全数据收窄（scope-snapshot.ts:23-40）
- `projects` 仅留当前项目；tasks/milestones/riskIssues/meetings/reports/deliverables/okrs/okrInbox/habits/habitInbox 全部按 `projectId === projectId` filter。
- `settings/capabilities/dashboards` 经 `...snapshot` 原样透传（引用 identity 保持，测试断言 `toBe`）。
- `fileAssets: {}` 清空：fileAssets 元数据无 projectId 归属字段，项目快照清空防跨项目元数据泄漏（scope-snapshot.ts:37-38）。
- 只读不改写原快照（filter 产新数组，测试断言原数组长度不变）；可选缺省（undefined）回落 `[]` 不抛。
- 调用点：panel.tsx:1362 `data={scopeSnapshot(data, project.id)}` 传给项目级 BoardBento。

### 2.2 PROJECT_DEFAULT_LAYOUT = 7 卡（project-default-layout.ts:8-27）
- version=1、scope='project'，7 个 widget：completionHero / milestoneDeliverable / objectiveProgress / overdueSoon / peopleLoad / weeklyPlan / riskMatrix。
- 7 类型均在注册表；测试覆盖七类齐备（project-default-layout.test.ts:26-35）。

### 2.3 回退链 byProject > legacy(只读) > PROJECT_DEFAULT（persist.ts:188-200）
- `resolveProjectDashboard`：byProject[projectId] 命中优先 → legacy project 只读回退 → PROJECT_DEFAULT_LAYOUT；**不读个人 user 布局**，绝不写/重置 legacy。
- persist.test.ts:117-128 覆盖：scoped 胜出 / scoped 缺落 legacy / 双缺回退默认 / 项目解析不读 user。

### 2.4 save / reset 仅项目作用域，全局不受影响
- 前端 activeScope = `dashboardScopeFor(projectId)` = `project:<id>`（项目）/ `user`（全局）（persist.ts:180-182；BoardBento.tsx:42）。
- onSave → `dashboard put <scope>`；onReset → `dashboard reset <scope>`（panel.tsx:1371-1376 项目；3290-3296 全局）。
- 后端 dashboard.ts：put 只写 `storageKey(scope)`；reset 只 `delete(storageKey(scope))`（dashboard.ts:126,155）。项目级 reset 只清 `dashboard_project_<id>`，**不碰** `dashboard_user` 或 legacy `dashboard_project`。
- dashboard.test.ts:26-45 独立断言：put project:<id> 落 `dashboard_project_p-0001`、user 单独写、reset project:<id> 后本作用域 null 而 user 值保留；非法布局（缺 version/widgets）put 拒绝零写（store.size=0）。

### 2.5 旧布局不重置 / RGL / 16 卡 / history / responsive
- 旧布局经 sanitizeLayout 安全归一（未知跳过并列名、越界夹紧、碰撞下沉），不静默整份重置/白屏；persist.test.ts:83 11 类既有卡身份/config/坐标原样保留。
- RGL 仅在编辑态异步 chunk 加载；浏览态纯 CSS grid（BoardBento.tsx:3-4）。16 卡全局 bento、responsive 断点投影（projectToBreakpoint + ResizeObserver）为既有行为，本次 project-default 改动未触碰。
- history：仅保存后历史，不支持迁移前恢复，不放假撤销按钮（BoardBento.tsx:55 源码说明）。

## 3. 判定
- 静态 + targeted 24/24 PASS：scope 收窄、fileAssets 清空、PROJECT_DEFAULT 7 卡、回退链、save/reset 项目隔离、全局不变、旧布局不重置均 PASS。
- 未覆盖（后续）：RGL 拖拽/16 卡/responsive 的 GUI 视觉与交互由 Main native 采证（NOT_RUN）；未跑 full tsc/build（等 isolation 修复）。
- 结论：B4 项目看板集成**静态 code-ready**；非 Gpass，GUI NOT_RUN。

## 4. minor（不阻塞）
- project-default-layout.test 未显式断言 `widgets.length === 7` 与「byProject 胜出 legacy」的 identity 全等；源码 7 卡属实，测试覆盖七类齐备。
- dashboard.test 未显式断言 legacy `dashboard_project` reset 不受影响；源码 reset 仅删本作用域键，逻辑隔离成立。

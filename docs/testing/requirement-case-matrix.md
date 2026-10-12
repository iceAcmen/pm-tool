<!--
需求-用例矩阵。被测提交 a8e8ea4。状态由独立测试专家判定；未实测不 PASS。
-->
# 需求-用例矩阵（a8e8ea4）

> 状态图例：✅PASS / ❌FAIL / ⛔BLOCKED / ◻️NOT_RUN。
> 「自动化」列指既有 `scripts/verify-*.mjs`；凡标注「仅纯函数/契约」者，**不代表网页实测通过**。
> 证据列：脚本断言行或隔离回归日志 `docs/verification/verify-all-isolated-143708.log`（下称隔离日志）。

## A. 插件加载与注册

| 用例 | 自动化 | 状态 | 证据/缺口 |
|---|---|---|---|
| 插件被 dsh 装载，`/pm` 命令注册 | verify-command | ✅ | 隔离日志 L19-47：注册清单含全部子域，ping 返回中文 pong |
| 前端 bundle 激活并注册 main + sidebar.panellist | verify-client-bundle | ✅ | 脚本 L38-40：vm 加载 lib/client.js，apply 注册双 slot |
| client bundle 无残留外部依赖（zod 清零） | verify-client-bundle | ✅ | 脚本 L21 白名单；`lib/client.js` grep 仅 react/jsx-runtime；a8e8ea4 对应修复 9b15baa |
| 面板在真浏览器侧栏可见可开 | 无 | ⛔ | 仅 mock ctx 调 apply，未在真实 Chrome 渲染 |

## B. 七实体流程（CRUD + 状态机）

| 用例 | 自动化 | 状态 | 证据/缺口 |
|---|---|---|---|
| 项目：增查改删、同名/日期校验、删除 confirm、并发、重启读回、0700/0600 | verify-projects | ✅ | 隔离日志 L127-145；负例「验证用写入失败」为故障注入 |
| 任务 WBS：三级树、CRUD、移动/环保护/跨项目保护、重编号、并发、读回 | verify-tasks | ✅ | 隔离日志 L211-222 |
| 里程碑：增改删、状态一致性、任务关联删除保护、时间线排序、读回 | verify-milestones | ✅ | 隔离日志 L114-122 |
| 风险问题：CRUD、类型(风险/问题)、概率×影响、筛选、关闭、读回 | verify-risk-issues | ✅ | 隔离日志 L181-189 |
| 会议：会议+内嵌行动项、挂 taskId/riskIssueId、删除保护、读回 | verify-meetings | ✅ | 隔离日志 L105-113 |
| 汇报：冻结快照、异常聚合、旧快照不漂移、人工字段、非法输入、读回 | verify-reports | ✅ | 隔离日志 L172-180 |
| 交付物：四态、版本/状态只增留痕、仅留痕项、有交付物禁删项目、读回 | verify-deliverables | ✅ | 隔离日志 L56-64 |
| 七实体在**真实面板各 Tab** 渲染并可增删改 | verify-web（仅快照/manifest 契约） | ⛔ | 契约层 PASS；真实 DOM 交互未测 |

## C. 状态 / 日期 / 持久化

| 用例 | 自动化 | 状态 | 证据/缺口 |
|---|---|---|---|
| 实体状态机合法迁移、非法值回退 | verify-task-inline(nextStatus) | ✅ | 脚本 L4-7：todo→doing→done→todo，bogus→todo |
| 进度钳制 0–100、非数字归一 | verify-task-inline(clampProgress) | ✅ | 脚本 L9-14 |
| 日期清洗（仅 YYYY-MM-DD，斜杠/空→null） | verify-task-inline(cleanDate) | ✅ | 脚本 L16-19 |
| 人类可读 JSON、一记录一文件、权限 0700/0600 | verify-storage | ✅ | 隔离日志 L190-206 |
| 重启（新进程）读回一致、编号续增 | 各实体 verify | ✅ | 日志中「全新进程读回」「编号继续递增」 |
| due 墙钟固化 today、消除边界抖动 | verify-reminders/due | ✅ | 隔离日志 L161-165 |

## D. 项目隔离

| 用例 | 自动化 | 状态 | 证据/缺口 |
|---|---|---|---|
| 跨项目改他人任务被拒、不串数据 | verify-ask-apply | ✅ | 脚本 L53-54：`/拒绝不属于本项目/`，t-other 保持原值 |
| 项目删除前有关联实体被阻止 | verify-projects/milestones/risk/issues | ✅ | 各脚本「项目删除保护」 |
| 统计/检索不跨项目泄漏（单项目口径） | verify-r12 | ✅ | 隔离日志 L152-158 |

## E. AI 副驾（只读 + 确认草稿）

| 用例 | 自动化 | 状态 | 证据/缺口 |
|---|---|---|---|
| 提问只读、不写盘、给中文结论、上下文无 undefined | verify-ask-apply(ctx) / verify-copilot | ✅ | 脚本 L102-105；隔离日志 verify-copilot |
| 草稿 confirm 才落库、写动作走后端守卫 | verify-ask-apply | ✅ | 脚本 L43-46：assignee/status 真落 t-1 |
| 取消草稿即丢弃、不落库 | 未见断言 | ◻️ | **缺口**：已测 confirm/幂等，cancel 丢弃路径无断言 |
| 重复确认同一草稿幂等拦截 | verify-ask-apply | ✅ | 脚本 L66-75：第二次返回「幂等」，progress 不重复写 |
| 基线过期（他人更新 updatedAt 冲突）拒绝覆盖 | verify-ask-apply | ✅ | 脚本 L57-63：`/他人更新\|冲突/`，保持原值 |
| 非法字段（非法日期）拒绝、合法项仍落库（部分成功） | verify-ask-apply | ✅ | 脚本 L78-90：2026-02-30 被拒，t-1 已写 33 |
| 无 Key / 模型失败 / 超时 → 中文降级、台账不写 | verify-model-route / wbs / report-ai / meeting-ai | ✅ | 隔离日志：无 Key 引导、MODEL_TIMEOUT、限流降级 |
| PoC/生产双车道隔离、不回退免费车道 | verify-model-route | ✅ | 隔离日志 L123-125 |
| ask 抽屉在真浏览器多轮对话、草稿卡渲染 | 无 | ⛔ | 仅域/命令级；真实对话 UI 未测 |

## F. 导入导出 / 备份恢复

| 用例 | 自动化 | 状态 | 证据/缺口 |
|---|---|---|---|
| 导出 Markdown/整库 JSON、排序、覆盖需 confirm、失败清理 | verify-export | ✅ | 隔离日志 L65-80 |
| 备份含七实体、不含 checks/密钥 | verify-backup | ✅ | 脚本 L51-58 |
| restore 缺 confirm 只演练不写 | verify-backup | ✅ | 脚本 L65-67：任务数保持 2 |
| restore 预检（format/formatVersion）+ 先安全快照再替换 | verify-backup / core/backup | ⚠️ **产品逻辑✅ / 测试隔离FAIL（T-DEF-008）** | 产品逻辑：脚本 L70-73、backup.ts L130-134 precheck→快照→替换均真断言。**但** verify-backup.mjs:70 未传 directory，安全快照写入产品真实备份默认目录 `packages/backups/`（今日 50 个测试快照），测试隔离未证明，不能以产品逻辑正确掩盖设施污染 |
| csv / xlsx / markdown 导入解析、父子树、重启读回 | verify-csv/xlsx/importmd/import-content/r12 | ✅ | 隔离日志 L52-55、L85-92、L239-243 |
| 网页拖拽导入文件、预览→确认（OPT-12） | e2e-web-real（骨架未跑） | ⛔ | 脚本自述 GUI 未覆盖；非GUI等价由 verify-integration 承担 |
| 网页选备份/恢复（OPT 顶栏） | 无 | ⛔ | 域级 backup PASS；网页交互未测 |

## G. 看板 / 树 / 直达 / 行内 / 甘特 / 作战室（新视图）

| 用例 | 自动化 | 状态 | 证据/缺口 |
|---|---|---|---|
| 任务树构建/折叠数据 | verify-task-tree | ✅（仅纯函数） | 隔离日志 L209-210；真实折叠交互未测 |
| 行内改状态/进度/日期 → buildUpdate 过滤脏字段 | verify-task-inline | ✅（仅纯函数） | 脚本 L22-27；真实单元格→execute 接线未测 |
| 甘特：日期范围 padding、bar 几何、今日线 | verify-gantt | ✅（仅纯函数） | 脚本 L5-19 |
| 甘特拖拽位移换算（正拖/负拖/钳制 start≤due） | verify-gantt | ✅（仅纯函数） | 脚本 L22-31 |
| 甘特 DOM 拖拽 → shiftDatesByDrag → `execute('/pm task update')` 真落库 | 无 | ⛔ | **关键缺口**：拖拽数学对，UI 接线与落库未测 |
| 作战室 KPI 完成率/逾期/临期/未闭风险、agenda 排序、矩阵归格(closed 排除、critical→high) | verify-war-room | ✅（仅纯函数） | 脚本 L17-40；真实渲染未测 |
| 提醒/搜索命中携带 type+id，点击切项目+切 tab+开抽屉 | verify-web（选择器契约）/ 域 | ⛔ | `data-open-record/type/id` 存在；真实点击直达未测 |
| 全局搜索跨七类、--type 过滤、空/非法负例 | verify-r12 | ✅ | 隔离日志 L152 |

## H. 多选 / 键盘 / 项目记忆

| 用例 | 自动化 | 状态 | 证据/缺口 |
|---|---|---|---|
| 批量改负责人/优先级/截止、批量删除 | verify-batch | ✅ | 隔离日志 L10-12 |
| j/k/空格/Del/Enter 在 reducer 层移动/勾选/删除/打开、输入框守卫 | verify-keyboard | ✅（仅 reducer） | 隔离日志 L97-98；真实 DOM 焦点/树下导航未测 |
| 项目选择 localStorage 记忆、reload 回填 | e2e-web-real（骨架未跑） | ⛔ | 脚本 L60-67 为骨架，未真实执行 |

## I. 视觉 / UX（样式、窄屏、空态、主题、成本）

| 用例 | 自动化 | 状态 | 证据/缺口 |
|---|---|---|---|
| 亮/暗/跟随系统主题切换不破版 | 历史 27/27（仅 R5–R12 旧视图） | ⛔ | 新视图(TaskTree/GanttView/WarRoom/AskDrawer)未目视 |
| 390 窄屏无横向溢出（表格内滚） | 历史 27/27（旧视图）+ panel.css 修 tab nowrap | ⛔ | 新视图窄屏未目视 |
| 焦点态、空态 AI CTA、加载反馈、中文文案 | 无 | ⛔ | 未真实渲染确认 |
| 确认/取消/删除/恢复的操作成本可预期 | 域级 confirm 语义已测 | ◻️ | 真实流程成本待 GUI 实测 |

## 矩阵统计（本轮）

- 域/命令/集成/纯函数类 ✅：覆盖充分且断言为真（36 项 verify 退出 0，断言强度经代码审计，非 HTTP200/按钮存在式）。
- **⚠️ 降级项**：restore 安全快照（F 区）产品逻辑正确，但测试隔离 FAIL → T-DEF-008（测试设施缺陷），不得记 PASS。
- 真实浏览器 GUI / 页面样式 / 真实键盘交互 ⛔：全部 BLOCKED（本角色无 GUI 驱动，且禁止绕过）。
- ◻️ 缺口：ask 草稿「取消即丢弃」无断言（T-DEF-004）；真实流程 UX 成本待补测。
- 已知盲区（回归报告 §4.3，转记 NOT_RUN）：多进程并发写、dsh 真实 link 装载、3080 服务集成、大数据量/性能、locale 语言切换、大 Excel 边界。

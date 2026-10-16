# P1 批次最终集成回归 + AI 真实闭环取证 SUMMARY

- 日期：2026-10-17（Asia/Shanghai）
- 角色：独立验证工程师（只验证 / 截图，**未改任何业务代码、未执行 git commit/push**；临时改动均已还原）
- 被测包：`packages/dsh-pm-tool/`；服务：dsh（`--profile pm --no-open`，重启后新 token 连接）
- 取证目录：`docs/verification/p1-impl-20261017/screenshots/`（共 **44** 张；本轮覆盖重拍 6 张 + 1.3 行特写 1 张）
- 构建 / 测试：`pnpm run build` **退出 0**；`pnpm run test` **Test Files 7 passed / Tests 57 passed，退出 0**

> 口径说明：本报告「通过」= 有截图或磁盘回读证据；「待验证」= 当前环境无法自动化或需人工；未伪造任何 AI 结果。

---

## 一、P1 已完成项逐条结论

| # | P1 项 | 结论 | 证据（截图 / 回读） |
|---|---|---|---|
| ① | 抽屉分区 + 受控内联校验（七类抽屉） | **通过** | 任务 `drawer-task-open-light-1440`（01 基础信息 / 02 排期与进度 / 03 关联与仓库，弱分隔、底部固定操作条）；里程碑 `drawer-milestone-open-light-1440`（01/02）；风险 `drawer-risk-open-light-1440`（01/02）；交付物 `drawer-deliverable-open-light-1440`（01/02/03）；会议 `drawer-meeting-open-light-1440`（01/02）；汇报 `drawer-report-open-light-1440`（01/02，操作条 删除/导出 Markdown/取消/保存汇报）；项目 `drawer-project-open-light-1440`（01/02/03）。内联校验 `drawer-task-invalid-light-1440`：标题留空点「添加任务」→ 红框 + 红字「任务名称不能为空」+ 首错自动聚焦 title（`data-invalid=true`、`aria-invalid=true`、activeElement=title，脚本回读一致）。390 单列 `drawer-task-1col-light-390`（grid 单列 357px，操作条固定）。 |
| ② | 密度全局持久偏好（localStorage `pm-density`，根 `.pm-shell[data-density]`） | **通过** | `tasks-density-compact-light-1440`（切紧凑，`data-density=compact`、`localStorage.pm-density=compact`、行高 42px）；`tasks-density-compact-persist-light-1440`（**整页刷新重进后仍为紧凑**，`data-density=compact`、ls=compact、分段控件 active=紧凑）。密度只改行高/padding，不改列结构。 |
| ③ | ≤560 标签下拉 ViewSwitcher | **通过** | 闭合 `viewswitcher-closed-light-390`（当前视图名 + 计数徽标 + 下拉箭头，无横向溢出）；展开 `viewswitcher-open-light-390`（listbox **9 个视图**、计数徽标 22/1/0/1/1/0、概览/甘特/人员为「—」、选中项蓝色勾 `is-selected`）。脚本回读 `n=9`，选中=全部任务 check=true。 |
| ④ | 甘特 resize 手柄 + 键盘方向键改期 | **部分通过（落库/键盘通过；物理拖拽手势待人工）** | 手柄：常态 `::after` opacity=0，hover 后 **0→0.85**、`cursor=col-resize`（脚本回读，`gantt-grip-light-1440` / `gantt-grip-dark-1440`）；focus 环 solid 蓝 65,118,230（`gantt-bar-focus-light-1440`）；常驻键盘提示条 `gantt-kbdbar-focus-light-1440`（←→移动1天 / Shift←→调工期 / Enter打开抽屉 / Esc取消拖拽）。键盘落库回读：t-0003 基线 `10-11~10-25` → ArrowRight 移动 `10-12~10-26`（`gantt-keyboard-move-light-1440`）→ Shift+ArrowRight resize `10-12~10-27`（`gantt-keyboard-resize-light-1440`）→ 反向操作精确还原 `10-11~10-25`（`gantt-keyboard-restored-light-1440`，磁盘 `RESTORE_MATCH=true`）。 |
| ⑤ | 人员明细仅叶子（无 WBS 父阶段行） | **通过** | `people-leaf-expanded-light-1440`：展开「未分配」明细 6 条（4.3/5.1/5.2/5.3/6/7），堆叠条 open=6 与明细数 6 一致；磁盘核对 6 条 `hasChildren=false`（均为叶子，无根父阶段混入）。 |
| ⑥ | isTaskOverdue / clampProgress 口径统一 | **通过（逻辑 + 单测）** | `core/derived.ts` 导出唯一 `isTaskOverdue`，被 people-load / gantt / stats / reminders / progress-reports / report-narrate / war-room 共同引用，无各自重算；`derived.test.ts` 10 例冻结口径；`clampProgress` 由 `progress-derivation.ts/task-inline.ts` 统一，`progress-clamp.test.ts` 11 例；全量 57 测试通过。 |

### ⑥补：WBS groupRow 进度元信息收口（本轮修复复核）

- **修复点**：`packages/dsh-pm-tool/src/client/views/tasks.tsx:415`（WBS 父阶段分组行 `.pt-group .pt-gstage-meta`）由直接拼 `t.progress` 改为状态优先的钳制文案：`t.status==='done'→'已完成'`、`'in_progress'→'进行中'`、否则 `t.progress? \`${clampProgress(t.progress)}%\` : '待开始'`，杜绝父阶段聚合进度 >100 时把原始值直出。`clampProgress` 已在文件顶部 import（第 5 行），与 361/364 行叶子进度条/数字同源。
- **验证结论：通过（代码分支 + 单测 + 实页）**。`pnpm run build` 退出 0；`pnpm run test` **7 文件 / 57 用例全绿**。实页回读 7 个父阶段分组行 meta 均为 `进行中/待开始/日期/—`，无任何原始 >100 百分比；磁盘核对 p-0001 全部 22 条任务 `progress∈[0,50]`，无越界原值。
- **口径澄清（重要，避免误删数据）**：叶子行 **1.3「访谈核心业务部门」** 名称旁仍可见的琥珀色虚线 **「123」chip 不是进度，也不是 415 漏网**——它是 `tasks.tsx:338` 的**关联里程碑虚线 chip**（`{milestone && <span className="pt-wait" style={{borderStyle:'dashed'}}>{milestone.title}</span>}`），内容=里程碑 m-0001 的标题「123」；该行进度列正确显示 `30%`、状态 `done`。此为合法业务数据，按红线未改名/未删除里程碑，415 修复本身也不移除该 chip。证据特写 `tasks-1.3-row-light-1440`。
- **本轮重拍覆盖（同名）**：`tasks-default-light-1440`、`tasks-default-dark-1440`、`tasks-density-compact-light-1440`、`tasks-density-compact-persist-light-1440`（刷新后 `data-density=compact`/`ls=compact`/active=紧凑/行高 42，仍紧凑）、`tasks-card-light-390`、`drawer-task-invalid-light-1440`（红框 +「任务名称不能为空」+ 首错聚焦 title）。结束已把密度切回**舒适**（`data-density=comfortable`），基线计数不变。
- **局限**：当前数据集无 >100 原始进度，groupRow 的 clamp 边界无法用真实越界数据肉眼复现，正确性依赖代码分支与 `progress-clamp.test.ts`（11 例）；若后续构造 >100 聚合样本，建议补一张父阶段行钳制截图。


### 九视图桌面 1440 浅色（各 1 张）
`tasks-default-light-1440`、`gantt-default-light-1440`、`milestones-default-light-1440`、`risk-issues-default-light-1440`、`people-default-light-1440`、`meetings-default-light-1440`、`reports-default-light-1440`、`deliverables-default-light-1440`、`overview-default-light-1440`。空态诚实：风险（0）、交付物（0）均为图标 + 一句说明 + 单一去重 CTA，无伪装零值。

### 深色（tasks / gantt含手柄 / milestones / people / overview）
`tasks-default-dark-1440`、`gantt-default-dark-1440`、`gantt-grip-dark-1440`、`milestones-default-dark-1440`、`people-default-dark-1440`、`overview-default-dark-1440`。深浅两套均成立，深色面板/网格/条体/依赖线/关键路径 chip 全部跟随 token，无白色残留带。

### 390 窄窗
`viewswitcher-closed/open-light-390`、`tasks-card-light-390`（卡片堆叠，标题完整可读、无列叠印）、`gantt-default-light-390`（标签列收两行、时间轴横滑保留、粒度控件换行）、`drawer-task-1col-light-390`。

---

## 二、AI 真实闭环取证（走查「待验证」#1）—— **待验证（环境阻塞，未伪造）**

目标：真实模型 → 草稿卡（AI 待确认 / 勾选 / 实体徽标）→ 未确认不落库 → 勾选确认落库 → 撤销恢复。

> 说明：副驾草稿卡白名单仅 `task.update / milestone.create|update / risk.create|update / deliverable.create|update / meeting.create|update`（`core/copilot.ts` ALLOWED_OPS），**不含 `task.create`**，故可落库的确定性写操作选用 `milestone.create`（新建任务不在草稿卡支持范围内）。

逐步结果：

1. **打开 AI 副驾**：成功，`ai-copilot-open-light-1440`（PoC 免费 / 生产 Key 两车道切换、输入框、快捷问）。
2. **PoC 免费车道真实提问**（「请为当前项目创建里程碑「AI取证临时里程碑」，目标 2026-11-20，先给草稿」）：模型通道失败，气泡返回 **「副驾暂不可用：当前模型通道 openrouter/openrouter/free 未配置或缺少适配器」**，**未产生草稿卡**（`ai-draft-or-error-light-1440`）。
   - **未确认不落库（失败路径安全面）**：ask 前后磁盘里程碑均仅 `m-0001:123`，脚本回读 `LEAK-BEFORE-CONFIRM=[]`，ask 本身从不写库。
3. **生产 Key 车道**：返回 `PROD_KEY_MISSING：未检测到生产模型 API Key，本工具不会静默回退到免费公共网关`（`ai-prod-keymissing-light-1440`），符合「绝不静默回退」红线；未写任何数据。
4. **勾选确认落库 / 撤销**：因无草稿，**未能走到**；源码确认副驾操作条仅「整批执行 / 逐步执行 / 取消」，**无撤销入口**（见新发现 S2-1）。
5. **清理**：两条车道均未产生任何记录，无需删除；已把模型车道切回 PoC（磁盘 `aiModelMode=poc` 已核对）。
6. 结论：真实模型闭环在本环境**不可走通**（缺适配器 / 缺生产 Key），记为**待验证**，待环境配好 Key/适配器后按本流程复测。未使用 `fixture`/`entities` 测试缝冒充真实模型。

---

## 三、看板（总览看板）当前状态

- **当前卡片数 = 9**（DOM `.pm-bento-grid-static` 子节点 9；磁盘 `settings/dashboard_user.json` widgets=9，一致）。
- 布局完整无错乱：任务完成率 / 里程碑·交付物 / 项目状态·规模 / 客观进度·清单 / 成员负载 / 风险矩阵 / 未来按周计划等 9 格，坐标逐格一致。
- 持久化复核（非破坏，未增删卡以保护现有 9 卡）：`board-before-reload-light-1440` → 刷新重进重开 → `board-after-reload-light-1440`，9 格 `gridColumn/gridRow` **完全一致（PERSIST_MATCH=true）**，布局经 dsh-storage 落盘并在刷新后还原。
- 浏览态：`board-browse-light-1440`。

---

## 四、任务三：其余可自动化项

| 项 | 结论 | 证据 |
|---|---|---|
| 甘特移动 + resize 落库回读并还原 | **通过（键盘路径）** | 见 P1④；磁盘三次回读，最终精确还原基线。 |
| 看板布局持久化（刷新重开保持） | **通过（只读复核）** | board-before/after-reload，9 格逐格一致；未做增删卡改动以避免破坏现有看板。 |
| 加载 / 禁用 / 成功 toast | **待人工** | 包内未发现独立 toast/Notice 组件（仅 `panel.css` 一个 `--dsw-alias-toast-*` token）；成功 Notice 回写 payload 需在真实保存后人工确认。 |
| 物理指针拖拽（条体改期 / 边缘拖工期） | **待人工** | 仅验证了键盘写同一后端（startDate/dueDate）；真实鼠标拖拽手势未自动化。 |
| 键盘可达 / 读屏 / 200% 缩放 | **待人工** | 自动化无法覆盖 ARIA 朗读与缩放叠印。 |

---

## 五、数据清理与基线核对（结束前）

磁盘最终计数：tasks **22**、milestones **1**（仅 m-0001）、risk_issues **0**、meetings **1**、reports **1**、deliverables **0**、projects **4**，与开工基线一致；t-0003 已还原 `2026-10-11~2026-10-25 / done / 30`；board widgets=9；`aiModelMode=poc`。**无 AI 临时记录、无遗留改动。**

---

## 六、新增「待验证」项

- **TV-AI-1（核心）**：AI 副驾真实模型闭环（草稿卡 → 勾选确认落库 → 撤销恢复）。阻塞原因：PoC 通道 openrouter/free 缺适配器；生产车道 PROD_KEY_MISSING。需配好 Key/适配器后复测，重点补「确认落库列表可见 + 撤销回不存在」两段证据。
- **TV-DRAG-1**：甘特物理鼠标拖拽改期 / 边缘手柄拖工期手势（键盘落库已证，手势未覆盖）。
- **TV-NOTICE-1**：抽屉保存成功 Notice 回写 payload（§12.4 不变量③），需真实保存后人工确认。
- **TV-A11Y-1**：ARIA 朗读、200% 缩放不溢出/不叠印，需人工实测。

## 七、新发现问题（S 分级）

- **S2-1｜副驾确认落库后无「撤销」入口**：`client/panel.tsx:2381-2389` 操作条仅「整批执行 / 逐步执行 / 取消」，`取消`只清当前草稿、不回滚已落库记录；与设计 §12.2「写操作…可撤销」及任务二「撤销恢复」要求不符。建议补「撤销上一批」或落库前快照回滚；当前只能手动删除。
- **S2-2｜本环境模型双通道不可用（环境问题，非代码缺陷）**：PoC 缺适配器、生产缺 Key；导致真实 AI 闭环无法在此环境取证。
- **S3-1｜无独立 toast/成功 Notice 组件**：成功反馈形态需产品确认，§12.4「成功 Notice 回写 payload」当前无 UI 落点可自动化。
- **S3-2｜物理拖拽手势未纳入自动化**：建议后续补 pointerdown/move/up 的 E2E，与键盘路径并列回归。
- **S3-3｜关联里程碑 chip 易被误读为进度数字（观感项，非缺陷）**：叶子行 `tasks.tsx:338` 的虚线 chip 直接展示里程碑标题（当前测试数据标题即「123」），与进度列相邻，肉眼易误判为「123% 溢出」。建议给该 chip 加里程碑图标/前缀或 title 说明「关联里程碑：…」，与进度数字在视觉上区分；本轮未改数据、未改码。

## 八、跨批不变量（§12.4）复核

1. 深/浅两套成立，深色次要文字未回退（已目检 5 张深色）。**通过**
2. 空态诚实不伪装零值；AI 草稿未确认不落库（ask 失败路径已证不写库；成功路径待 TV-AI-1）。**部分通过**
3. 甘特依赖三态路由 / 关键路径只读派生未被破坏（gantt 截图三态连线、关键路径 chip 正常；关键路径单测 8 例通过）；抽屉成功 Notice 待 TV-NOTICE-1。**部分通过**
4. 零硬编码暖黄/新品牌色：组件规则均走 token（rgb 仅作 var 兜底），未发现硬编码暖黄/品牌 hex，蓝绿仅语义色。**通过**

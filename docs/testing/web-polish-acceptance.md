<!--
Web Polish 体验增量验收矩阵（开发前冻结门）。独立测试专家所有，ADL-045 / ADL-047 / AGENTS 6A。
其他角色（产品 PM / 开发）：只读引用，不得改本文件任何用例、步骤、断言与判定。
开发未开始前，全部用例初始 = NOT_RUN；PASS/FAIL/BLOCKED/MANUAL_PENDING 只能由测试专家实测后填。
本轮仅冻结三块候选需求：PROD-04（Web 任务移动/改父）、PROD-09（汇报趋势对比徽标）、PROD-10（会议↔任务反向链接）。
-->
# Web Polish 体验增量 · 验收矩阵（Web-Polish Acceptance，开发前冻结）

> 是什么：Web polish 阶段三块候选体验增量——**PROD-04 Web 任务移动/改父**、**PROD-09 汇报趋势对比徽标**、**PROD-10 会议↔任务反向链接**（产品契约见 `docs/product/03-incremental-proposals.md` PROD-04/09/10 行）在基线 **`fc94d93`**（[doubao-work][evidence] 归档副驾多步独立验收与主线状态）之上的开发前冻结验收门。
> 给谁：开发照此实现；有 GUI 执行能力的主端按本文采集原始证据；**PASS/FAIL 只由测试专家审证后给出**。
> 范围纪律：本门**只覆盖 PROD-04/09/10 三块**；既有人工项（真实 390px 窄视口 `PL-WEB-11` MANUAL_PENDING、外部 skills 试点、发布收尾 H1–H6）**不在本门重复登记、不作为本门阻塞项**；其他 P0/P1（PROD-01/02/03/05/06/07/08/11）不在本门验收范围。

## 0. 冻结口径（对齐 `03-incremental-proposals.md` 契约；以此为准）

**PROD-04 · Web 暴露任务移动/改父**
1. 任务行「⋯ 移动到…」→ 弹出「选择父任务」树选器；候选 = **同项目内除「自身 + 自身全部后代」外**的任务 + 「根层级」；自身与后代**不得**出现在可选项里（环路防护在 core）。
2. 落地调既有 `task move <id> <newParentId|null>`；环路/跨项目/自身/后代保护沿用 core（`TaskMoveCycleError` / `ParentTaskProjectMismatchError` / `ParentTaskNotFoundError`）。
3. **最终决策：Web 「确认移动」是改父 + 项目全量 renumber 的单一原子动作**——确认后同时重挂父级并对**整个项目**重建连续 `order`/`code`，**移动落盘即与树缩进一致**（被移动任务及其子树 code 前缀随新父重算），**不再是「旧编号保留 + 用户另点 renumber」**。动作须**原子 + 失败回滚**：renumber 中途失败则整树回退到移动前，不残留半写编号（core `renumberTasks` 已有 try/回滚骨架）。
4. **取消零写**：Web 选了候选但取消/关闭对话框，不得下发任何写命令；离线 `task move` 不带 `confirm` 仅返回预览文本、不落盘。
5. 拖拽缩进、同级「插到中间」order 重排属增强；本门只要求「移动到…菜单 + 树选器」最小闭环。

**PROD-09 · 汇报趋势对比徽标**
6. `ProgressReportTable` 每行与「上一份汇报」按**周期排序后相邻两份** diff，**固定三项指标**：`averageProgress`（任务平均完成率）、`overdue_task`（逾期任务数）、`exceptions` 总数；加小箭头徽标；纯前端按周期排序后相邻 diff。
7. **无前序空态**：第一份汇报（无上一份）不显示徽标，不抛 NaN/undefined。
8. **正 / 负 / 零**三态齐全；**零差一律显「持平 0」**；徽标**含文字箭头 + 数值**（如 `↑12%` / `↓3` / `持平 0`），**不得只用红绿颜色**（读屏/色盲可达）。
9. 输入乱序时**内部先按周期排序再相邻 diff**，结果确定，不依赖传入顺序。

**PROD-10 · 会议↔任务反向链接**
10. 任务若由某会议行动项 promote 而来（`meetings.actions[].taskId` 已回写），任务详情抽屉显示「来自会议 mtg-xxxx」**只读链接**。**多来源确定**：同一任务被多个会议行动项指向时，按 meeting `period/date`（会议日期）→ meeting `id` → action 稳定次序排序，取**确定的第一条**展示；可接受沿用现有 list 顺序，但**必须测确定性**（同数据两次读出的来源链接一致、跨进程重启读回一致）。
11. **零 schema 优先**：优先前端遍历 `meetings.actions` 反查 `taskId→meeting`（core 已有只读 `findMeetingActionByTask`），**不新增** `sourceMeetingAction` 字段；如确需派生字段须先过 schema 门（WP-NF-01）。
12. **缺失/会议删除安全**：行动项悬空（指向的任务被删）、或来源会议被删除后，反查安全返回空、抽屉**不崩、不显示悬空链接**。

## 1. 分层与判定图例（与 ADL-045/047 严格一致）

- **自动化门（AUTO）**：离线表驱动（纯函数 + 零写/不碰 schema 静态检查）。脚本全绿即该项 PASS 可推进；**FAIL 仍阻塞**。
- **GUI 门（GUI）**：真实浏览器实测硬门槛；**离线纯函数 / HTTP 200 不得替代网页实测 PASS**。
- **人工协作门（MANUAL_PENDING）**：必须用户本人配合才能验者，既不算 PASS 也不阻塞自动化；用户反馈失败即重开缺陷。
- **状态**：`PASS` / `FAIL` / `BLOCKED` / `NOT_RUN` / `MANUAL_PENDING`。开发前本矩阵**全部 NOT_RUN**。
- `FAIL / BLOCKED / NOT_RUN` ≠ 通过；结论必须绑定 `testedCommit` 与证据路径；新提交使受影响项过期须重测后再引用。

## 2. 证据格式

- **自动化证据**：`pnpm run build` 退出 0；新增 `scripts/verify-web-polish.mjs`（开发新增）断言候选过滤/环路三拒/编号保留与 renumber/重启读回/取消零写/相邻 diff 确定性/首行空态/正负零/反查与缺失安全）退出 0；同输入跑两次 `diff` 为空（确定性）。记录命令、退出码、覆盖点。
- **GUI 证据**：隔离实例（独立 `DSH_HOME` + 独立端口 + `DSH_PM_BACKUP_DIR`，**不碰 3080/3091 正式数据与仓库 data/**）；每用例 `env.json`（`testedCommit`/`nodeVersion`/`chromeVersion`/`port`/`executedAt`，**禁写 token/cookie/认证 URL**）+ 截图 + 关键控件 `outerHTML` dump + `data-*` 断言行。目录 `docs/verification/gui-web-polish-<ts>/<CASE_ID>/`。
- **零写证据**：GUI「取消/关闭」用例前后对隔离 storage 做 mtime/sha 对比，证明未写任何业务 JSON；网络面板仅 `web snapshot` 读。

## 3. 现状发现（开发前代码快照，基线 `fc94d93`）

> 独立测试专家在冻结时对当前源码/verify 的只读盘点；**不是验收结论**，仅供开发对照「哪些已有、哪些待建」。

- **PROD-04 核心/命令侧已在，Web UI 未建**：`core/tasks.ts` 已有 `moveTask`（拒自身 L282、父不存在 L284、跨项目 L285–287、后代/环路 L289–296；移动后追加到新父同级末尾）与 `renumberTasks`（按树重建 `order`/`code`，含失败回滚）；离线 `/pm task move <id> <父|root> [confirm]` 与 `/pm task renumber <pid> [confirm]` 已在（`commands/task.ts` L221–249、L499+），无 `confirm` 仅返回预览不落盘。**Web 端尚无「⋯ 移动到…」菜单/父任务树选器/拖拽**（`client/panel.tsx` grep 无 `moveTask`/`移动到`）；任务新建表单的 `parentId` select 仅用于新建，非移动既有任务。**最终决策提示**：现有 `moveTask` 单独调用是「改父但保留旧 code」；Web「确认移动」须在此之上**原子串接整项目 renumber**（改父+重编号同事务、失败整树回滚），使落盘即 code 与树缩进一致——core 已有两个原语，但「二者原子串接」的组合动作待建。
- **PROD-09 徽标未建**：`ProgressReportTable`（`panel.tsx` L2054–2104）逐行孤立展示，列为 周期/标题/状态/任务进度/里程碑/异常项/快照时间/操作，**无相邻 diff 徽标**；既有空态文案「暂无进度汇报」在案。
- **PROD-10 核心只读反查已在，Web 抽屉链接未建**：`core/meetings.ts` 已有 `findMeetingActionByTask(domain, taskId)`（L228，只读遍历 `meetings.actions[].taskId`）与 `promoteActionToTask`（回写 `action.taskId`，幂等 L268–277）；**Web 任务抽屉 `TaskForm`（`panel.tsx` L2904+）尚无「来自会议」只读链接区**。
- **既有 guard**：`pnpm run verify` = `pnpm run build` + `node scripts/verify-isolation.mjs`（跑全部 functional verify + 隔离 guard，当前 45 个 verify-*.mjs）。

## 4. 任务移动/改父冻结用例（PROD-04）

| CASE_ID | 最小步骤 / 输入 | 必含断言（缺一不可 PASS） | 门 | 状态 |
|---|---|---|---|---|
| WP-MOVE-01 | 打开任务 T 的「移动到…」树选器 | 候选列表 = 同项目内**除 T 自身 + T 全部后代**外的任务 + 「根层级」；T 自身与 T 的子孙**不在**可选项中；候选按树缩进呈现 | AUTO | ✅ PASS（verify-task-move-renumber 候选排除自身/后代；GUI `MOVE-picker.png`/`D-esc.png` 候选=根层级/需求梳理/视觉设计，不含被移动任务自身） |
| WP-MOVE-02 | 把 T 移动到 T 自身下 | 抛 `TaskMoveCycleError`「任务不能移动到自身下」；**零写**（storage 无变更） | AUTO | ✅ PASS（verify-task-move-renumber 环路自拒用例退出 0） |
| WP-MOVE-03 | 把 T 移动到 T 的某个子孙下 | 抛 `TaskMoveCycleError`「不能把任务移动到其子孙任务下」；**零写** | AUTO | ✅ PASS（verify-task-move-renumber 后代拒用例退出 0） |
| WP-MOVE-04 | 把 T（项目 A）移动到项目 B 的任务下 | 抛 `ParentTaskProjectMismatchError`「父任务不属于当前任务的项目」；**零写** | AUTO | ✅ PASS（verify-task-move-renumber 跨项目拒；另实测后端拒绝跨项目 `action.taskId`，同样零写安全） |
| WP-MOVE-05 | 移动到不存在的父 id | 抛 `ParentTaskNotFoundError`；**零写** | AUTO | ✅ PASS（verify-task-move-renumber 父不存在拒用例退出 0） |
| WP-MOVE-06 | 确认把 T 从根移入父 P 下 | **确认移动 = 改父 + 项目全量 renumber 单一原子动作**：落盘后 T 即挂在 P 下、整项目连续 `order`/`code` 已重建，**T 及其子树 code 前缀随 P 重算、与树缩进一致**（无「旧编号残留待用户再 renumber」）；renumber 中途失败则**整树回退到移动前**，不残留半写编号 | AUTO | ✅ PASS（verify-task-move-renumber 注入复合写入故障→整树回滚，退出 0；无半写编号残留） |
| WP-MOVE-07 | 移动（已含 renumber）后，重启进程 / 重新 snapshot 读回 | `parentId`/`order`/`code` 与落盘值逐字段一致、且 code 与树缩进一致；跨进程重启读回不变（持久化正确） | AUTO | ✅ PASS（GUI 落盘读回 t-0001=1 / t-0002=2 / t-0003=1.1 / t-0004=1.2，parent 树与 code 前缀逐字段一致） |
| WP-MOVE-08 | Web 选了候选父但点「取消」/关闭对话框；离线 `task move` 不带 `confirm` | 不发任何写命令、不调 `moveTask`；仅返回预览文本；隔离 storage 业务 JSON sha 前后不变 | AUTO | ✅ PASS（GUI 取消前后隔离 storage pmtool 全部业务 JSON sha 逐字节一致） |
| WP-MOVE-09 | 隔离实例打开面板 → 任务行「⋯」→ 「移动到…」 | 弹出父任务树选器；候选缩进成树、「根层级」可选；选中合法父后确认移动成功、任务出现在新父下 | GUI | ✅ PASS（`D-after-move.png`：t-0004 确认移动到「需求梳理」后落盘 parent=t-0001、code=1.2，与树缩进一致；对话框 `role=dialog aria-modal`） |
| WP-MOVE-10 | 移动失败（如选到后代/跨项目）时 | 抽屉/列表显示**可读中文错误文案**（带 `data-*` 断言行），**非仅变红**；列表不错乱、未移动任务保持原位 | GUI | ✅ PASS（AUTO error-path 断言 kind=error 且拒绝文案为中文「任务不属于会议项目/不能移动到…」；列表未移动任务保持原位、无 pageerror） |
| WP-MOVE-11 | 全程查网络面板 + storage mtime/sha（取消路径） | 取消/关闭**零写**：仅 `web snapshot` 读，无 `execute` 写命令；隔离 storage 业务 JSON sha 逐字节一致 | GUI | ✅ PASS（Escape/取消关闭后隔离 storage 业务 JSON sha 前后一致，仅读 snapshot） |

## 5. 汇报对比徽标冻结用例（PROD-09）

| CASE_ID | 最小步骤 / 输入 | 必含断言（缺一不可 PASS） | 门 | 状态 |
|---|---|---|---|---|
| WP-BADGE-01 | 3 份汇报，三项指标各不同 | 第 N 行徽标 = 与**周期排序后相邻第 N-1 行** diff；**固定三项**：`averageProgress`（完成率）、`overdue_task`（逾期任务数）、`exceptions` 总数；同输入跑两次逐字节一致（确定性） | AUTO | ✅ PASS（verify-report-diff 相邻三项 diff、同输入两次逐字节一致，退出 0） |
| WP-BADGE-02 | 仅 1 份汇报（无上一份） | 该行**不显示徽标**（或显「—」），不抛 NaN/undefined；布局不错位 | AUTO | ✅ PASS（verify-report-diff 首份 deltas=[] 无徽标；GUI `D-badges.png` 最旧一行无徽标） |
| WP-BADGE-03 | 构造 delta 分别 >0 / <0 / =0 | 三态齐全：上升 `↑`、下降 `↓`、持平 `持平 0`；徽标**含文字箭头 + 数值**，不只是色块 | AUTO | ✅ PASS（verify-report-diff 三态；GUI 样本含 `↑10`/`↑13` 与多个 `持平 0`） |
| WP-BADGE-04 | 传入乱序汇报（非时间序） | 内部先按 `periodStart` 升序再相邻 diff；输出与「已排好序」结果一致，不依赖传入顺序 | AUTO | ✅ PASS（verify-report-diff 乱序输入内部排序后与有序结果一致） |
| WP-BADGE-05 | 隔离实例打开「汇报」tab 看徽标 | 徽标为**可读文字 + 数字**（读屏可达，`outerHTML` dump 证明非仅 `background-color`）；绿/红仅作辅、不单独承担语义 | GUI | ✅ PASS（`D-badges.png`：`.pm-delta` outerHTML 含箭头+数值+`%`，`.pm-delta--flat` 显「持平 0」；非仅色块） |
| WP-BADGE-06 | 仅生成 1 份汇报时 | 首行无对比徽标、表格行列不塌陷；无 console 未捕获异常 | GUI | ✅ PASS（`D-badges.png` 最旧一行无徽标且行列完整；全程无 pageerror） |

## 6. 会议↔任务反向链接冻结用例（PROD-10）

| CASE_ID | 最小步骤 / 输入 | 必含断言（缺一不可 PASS） | 门 | 状态 |
|---|---|---|---|---|
| WP-SRC-01 | 任务 T 由会议 mtg-M 的行动项 promote 而来（`action.taskId` 已回写）；另造 T 被第二份会议行动项也指向 | 反查（前端遍历 `meetings.actions[].taskId` 或 core `findMeetingActionByTask`）返回来源；**零新字段**派生。**多来源确定**：按 meeting 会议日期 → meeting id → action 稳定次序取第一条；同数据两次/跨进程重启读出的来源链接**完全一致**（顺序可沿用现有 list，但必须测确定性） | AUTO | ✅ PASS（verify-meeting-source 多来源取首 + 同数据两次一致；GUI `D-source.png`：mtg-0002(10-08) 日期更新排首显「来自会议 mtg-0002」，另显「另 1 场」） |
| WP-SRC-02 | 普通新建任务 T（无任何 `action.taskId` 指向它） | 反查返回 `undefined`；任务抽屉不显示来源区块 | AUTO | ✅ PASS（verify-meeting-source 无来源任务反查空；普通任务抽屉无来源区块） |
| WP-SRC-03 | `action.taskId` 悬空（行动项曾指向的任务被删） | 反查安全返回空、不抛异常；不显示悬空 `mtg-xxx` 链接 | AUTO | ✅ PASS（verify-meeting-source 悬空 action 反查安全返回空、不抛错） |
| WP-SRC-04 | 来源会议 mtg-M 被删除后打开 promote 来的任务 T | 抽屉**不崩**；因会议已不存在，不显示悬空链接（或安全回退空态），无 console 未捕获异常 | AUTO | ✅ PASS（删除 mtg-0002 后重开 t-0004，`D-after-delete2.png` 来源仅剩 mtg-0001「需求评审会」、无悬空 mtg-0002 链接、无「另 N 场」、无 pageerror） |
| WP-SRC-05 | 隔离实例打开 promote 来的任务 T 抽屉 | 显示「来自会议 mtg-M · 会议标题」**只读链接**；点开切到该会议抽屉；本链接**只读**，不可在任务抽屉内编辑/删除 | GUI | ✅ PASS（`SRC-source-link.png`：显「来自会议 mtg-0002「迭代计划会」」只读链接；`SRC-meeting-drawer.png` 点击切到会议抽屉，无内嵌编辑/删除控件） |
| WP-SRC-06 | 普通任务 T 抽屉 | 不显示来源区块、不占位、不错位；与既有字段布局一致 | GUI | ✅ PASS（普通任务抽屉无 `.pm-source-link-button`、布局不塌陷；无 pageerror） |

## 7. 非功能门（AUTO + GUI）

| CASE_ID | 断言 | 门 | 状态 |
|---|---|---|---|
| WP-NF-01 | **零 schema 优先**：不新增/改任何 record schema、domain table、存储列；`taskRecordSchema`/`storage.ts` domain 版本未动；PROD-10 反查优先纯前端/core 只读派生，不新增 `sourceMeetingAction` 字段；`verify-storage.mjs`/`verify-web.mjs` 既有契约全绿 | AUTO | ✅ PASS（反查纯前端 `findMeetingSources` 遍历 `meetings.actions`，无新字段/列；既有 verify-storage/web 经 full guard 全绿） |
| WP-NF-02 | **build / full guard**：`pnpm run build`=0；`pnpm run verify`（build + `verify-isolation.mjs` 跑全部 functional verify + 隔离 guard）退出 0；不碰 3080/3091 正式数据与仓库 data/ | AUTO | ✅ PASS（`pnpm run build`=0；`verify-isolation.mjs`=0；正式 data/共享 backups **149 文件 hash+mtime 零污染**） |
| WP-NF-03 | **GUI 证据**：隔离实例（独立 `DSH_HOME`/端口/`DSH_PM_BACKUP_DIR`）；每用例 `env.json`+截图+`outerHTML` dump；敏感扫描无 token/cookie/认证 URL | GUI | ✅ PASS（端口 3095 隔离实例；`docs/verification/gui-web-polish-20261013/` 含 env.json + 12 张 png；敏感扫描无 token/cookie/认证 URL） |
| WP-NF-04 | **既有回归不破**：`verify-cascade`/`verify-task-tree`/`verify-tasks`/`verify-meetings`/`verify-promote`/`verify-reports` 全绿；新控件带稳定 `data-*`/语义 class 供 verify-web 断言行 | AUTO | ✅ PASS（full guard 跑全部 functional verify 退出 0；新控件 `.pm-move-picker`/`.pm-source-link-button`/`.pm-delta` 语义 class 稳定） |

## 8. 不擅判 / 留待实测项

- 真实「拖拽缩进」手感、同级「插到中间」order 重排属增强，本门不要求；若开发顺手实现，另起独立验证，不混入本门判定。
- **窄窗（真 ~390px）优雅降级不在本门重复登记**：沿用既有人工项 `people-load-acceptance.md` PL-WEB-11（MANUAL_PENDING）；本门不另立 390 阻塞项，不重复阻塞自动化交付。
- PROD-10 若开发判断「纯前端反查」在数据量大时性能不足、确需新增派生字段，须先过 WP-NF-01 schema 门并补决策记录，不得自行升 schema。
- 徽标三项指标已**冻结**为 `averageProgress` / `overdue_task`（逾期任务数）/ `exceptions` 总数；口径须与既有汇报快照字段对齐，零差一律显「持平 0」。落地后由主端在证据列出实际取值字段名，专家核对是否逐项对应。

## 9. 当前判定（已实测回填）

> 回填人：独立测试专家；`testedCommit = 85cb651`（工作树含 code review 补齐：panel.css/panel.tsx/commands/task.ts/core/tasks.ts + 新增 core/meeting-source.ts、core/report-diff.ts、3 个 verify 脚本，lib 已重建）；实测日期 2026-10-13；环境 macOS arm64 / Node 22.23.2 / Chrome 139 / pnpm。
> 执行方式：AUTO（build + full isolation guard + 3 个新专项 verify 全退出 0）+ 隔离真实浏览器 GUI（独立 `DSH_HOME`/端口 3095/`DSH_PM_BACKUP_DIR`，**未碰 3080/3091 与仓库 data/**）。证据目录 `docs/verification/gui-web-polish-20261013/`。

- **PROD-04 任务移动/改父 WP-MOVE-01..11：11 项 ✅ PASS**（AUTO 8 / GUI 3）。含 Escape 关闭对话框 + 卸载归还焦点到触发 ⋯ 按钮、取消零写、确认移动=原子改父+项目全量 renumber（落盘 code 1/2/1.1/1.2 与树缩进一致）、失败整树回滚、重启读回逐字段一致。
- **PROD-09 汇报徽标 WP-BADGE-01..06：6 项 ✅ PASS**（AUTO 4 / GUI 2）。乱序内部按周期排序后相邻 diff，固定三项 `averageProgress`/`overdue_task`/`exceptions`，含 `↑%` 与「持平 0」，最旧一份无上一份徽标。
- **PROD-10 会议反向链接 WP-SRC-01..06：6 项 ✅ PASS**（AUTO 4 / GUI 2）。多来源按会议日期倒序取确定第一 +「另 N 场」；删除来源会议后不显示悬空链接。
- **非功能 WP-NF-01..04：4 项 ✅ PASS**（AUTO 3 / GUI 1）。零 schema、build/full guard=0、正式 149 文件零污染、敏感扫描无密钥。

**汇总：PASS = 27 / FAIL = 0 / BLOCKED = 0 / NOT_RUN = 0 / MANUAL_PENDING = 0（真 390 窄窗沿用 PL-WEB-11，不在本门重复）。**

- **总门：✅ 通过**。三块候选（PROD-04/09/10）AUTO 门全绿 + 隔离真实浏览器 GUI 实测全绿，未碰正式数据、未改产品/未提交。**独立测试专家附注**：跨项目 `action.taskId` 被后端安全拒绝（「任务不属于会议项目」），跨项目来源在数据层即不可建，反查自然无悬空——为预期安全行为；唯一 driver 侧返工（in-app 删除按钮首次未点中）已用离线 delete + 重启读回补证，非产品缺陷。

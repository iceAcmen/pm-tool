# Oil O3/O4/O5 patch 独立 QA 复验（静态 + 离线单测，未启服务/GUI）· 2026-10-20

> 范围：作者 O3（失败不关抽屉）、O4（未保存草稿 dirty 确认）、O5（陈旧客观进度标注）补丁。QA 只读源码 + 独立复跑作者单测，不改业务源码；R4 旧 candidate 不含本改动，before/after 像素待 Main 新 build 采证。
> 口径：单测/静态绿 ≠ GUI PASS；交互、焦点实际表现、200%/拖缩归 Main。

## 1. 独立复跑结果

| 文件 | 用例 | 结果 |
|---|---|---|
| `src/core/ui-feedback.test.ts`（commandAccepted O3 等） | 13 | **PASS 13/13** |
| `src/client/shared/form-dirty.test.ts`（O4 快照比较） | 5 | **PASS 5/5** |

命令：`npx vitest run src/client/shared/form-dirty.test.ts src/core/ui-feedback.test.ts` → Test Files 2，Tests 18 passed，exit 0。

## 2. O3 失败不关抽屉（commandAccepted）· PASS

- 源码：`core/ui-feedback.ts:127 commandAccepted = !feedbackIsError(response)`；`panel.tsx:777` 写命令返回后取 `accepted`，`false` 不触发 onSaved 关层，错误原文 `setMessage` 就近可见；catch 路径也返回 false（780-783）。
- 作者门覆盖：业务拒绝（未找到/失败/权限拒绝）→ false；结构化成功信封 → true；无信封既有成功文本 → true；只读预览「尚未写入」不含错误词 → true（不误判失败）。
- 独立源码核对：失败文本未 throw 时也经 commandAccepted 拦截，不会误关抽屉；成功路径不另造成功正则，仅排除错误词。

**P2 观察（非 FAIL，不挡本次）**：`commandAccepted` 对**整段原始文本**（含 `[pm:detail]` 完整字段）跑 `feedbackIsError`。当前所有成功信封摘要均未嵌入「拒绝/无效/缺失/未找到/失败」等词（已 grep 核实），无现行误判；但未来 detail/摘要若合法出现这些词（如「已忽略缺失旧字段」）会被误判失败而保留抽屉。建议结构化成功信封（`[pm:summary]`）优先判真，错误词只在非结构化/失败段判定。留待后续，不回退。

## 3. O4 未保存草稿 dirty 确认 · PASS（限 TaskForm 范围）

- 快照采集：`shared/form-dirty.ts` `collectFormSnapshot(form)` 走 `FormData`，受控/非控 input、select、textarea、checkbox 多选统一归一；trim、空串/缺失等价、多选排序后比较（顺序抖动非 dirty）。
- TaskForm（`panel.tsx:3531-3550`）：mount `useLayoutEffect` 采集初始快照（含**非控 description** defaultValue）并 `registerGuard(tryClose)`，卸载注销。
- `tryClose`（3533-3543）：干净 → true 直接关；dirty → 调**既有 `confirmDanger`**（非 `window.confirm`）异步确认，立即返回 false 中止关闭，确认后才 onCancel。
- 三条关闭路径统一过守卫：DrawerPanel `requestClose`（3227-3230）→ `beforeClose`；ESC（capture 3246）、scrim 点击（3283）、X 按钮（3287）都走 requestClose，无旁路。
- `confirm-dialog.tsx`：打开即聚焦确认按钮、ESC 取消/Enter 确认、关闭归还焦点、overlay mousedown 取消，可访问性成立。
- 保存成功走 onSaved 直接关层，**不经守卫，不会二次弹确认**；取消按钮（3950 区）调 `tryClose()` 而非直接 onCancel，dirty 被拦下。
- 字段名核对：title/description/status/priority/assignee/parentId/startDate/dueDate/progress/milestoneId/repoUrl/branch/predecessorIds 全部带 `name`，FormData 可采；predecessorIds 复选框（3890）纳入快照。

**范围说明（非缺陷，须在验收中讲清）**：dirty 守卫仅 TaskForm `registerGuard`（1407）；project/milestone/risk-issue/meeting/report/deliverable/okr/habit 抽屉未注册守卫，其 ESC/取消丢弃草稿不弹确认。若 O4 范围仅任务草稿则成立，不得对外宣称「全抽屉未保存保护」。

## 4. O5 陈旧客观进度标注 · PASS

- TaskForm 接收 `stale`；客观进度（清单完成度/证据不足）只读展示（3772-3777），`stale` 时追加弱标注「（数据陈旧，重试后更新）」，**不进提交 payload**（3656-3659 仅传 manualProgress），不污染客观值。

## 5. 待 Main（新 build）采证，QA 不替代

- 真实 dirty/干净关闭、confirmDanger 焦点与 ESC、失败后抽屉与输入保留、陈旧标注视觉，均需 Main 在新 candidate 同页采前后证据；R4 旧 build 不含本补丁。
- tsc 全量未由 QA 复跑（并发 WIP 可能致无关红），作者声明 tsc clean 待稳定 checkpoint 复核。

## 结论

O3/O4/O5 静态 + 18 离线单测 **PASS**，无阻塞 FAIL；1 条 P2 观察（成功信封错误词整段扫描）+ 1 条范围说明（守卫限 TaskForm）。**不构成 GUI PASS**。

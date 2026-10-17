# Wave-2 / F2 表单行为五项 修复证据（E2 / E10 / E11 / F9 / F10）

- 实例：http://127.0.0.1:3172/ （headless Chrome，1440×900，light）
- 证据目录：`docs/testing/legacy-clearance-20261018/f2-forms/`
- 测试方法说明：E10 本地秒开难以观测 pending，采用**源码临时人工延迟**（`sessionStorage.pmE10DelayMs=1500` 注入到 `executeRaw`）实测，复测后已**移除临时手段**并最终重建；无 route 可用（执行走 dsh host SDK，非 fetch）。

---

## E2 内联错误 aria-describedby 绑定

**补证前状态**：基线探测（`baseline-probe.json`）任务表单空名提交已见 `task-title-error` id 与 `aria-describedby`；静态全量比对 27 个 `errorId` 与 27 个 `aria-describedby` 一一对应（`comm` 差集为空）。交付物表单基线因误点打开 CTA 未触发，本次补取证。

**动作**：开「新建任务」空名提交；切「交付物」视图开「新增交付物」空名提交；读取错误元素 id、控件 `aria-describedby`/`aria-invalid`、field `outerHTML`，截图。

**结果**（`final-probe.json`）：
- 任务：错误文案 `任务名称不能为空`，`id=task-title-error`，控件 `aria-describedby=task-title-error`、`aria-invalid=true`，`bound=true`；
  outerHTML：`<input name="title" aria-required="true" aria-invalid="true" aria-describedby="task-title-error"> … <span class="pm-field-error" id="task-title-error" role="alert">任务名称不能为空</span>`
- 交付物：`id=deliverable-name-error`，`aria-describedby=deliverable-name-error`，`aria-invalid=true`，`bound=true`。
- 截图：`final-e2-task-error.png`、`final-e2-deliverable-error.png`（基线：`baseline-e2-task-error.png`、`baseline-e2-deliverable-error.png`）。

**结论**：任务/交付物内联错误均具备「错误元素有 id + 控件 aria-describedby 指向该 id」完整绑定，无需补绑；其余 25 个字段静态核对全部 1:1 绑定。PASS。

---

## E10 异步提交防重（pending 禁用 + 加载态 + 二次提交不可能）

**补证前状态**：原提交仅靠全局 `busy` 禁用，无本地在途守卫、无「提交中…」加载态，存在双击/回车连发的同步窗口。

**动作 / 修复**：
1. 父级 `run` 增加模块在途守卫 `inflightRef`：并发第二次调用直接返回 `false`，不重复落库；
2. 七个抽屉表单（项目/任务/里程碑/风险问题/会议/汇报/交付物）接入 `useSubmitGuard`：`begin()` 在途拒绝重复，按钮 `disabled={disabled || submitting}`、`aria-busy`、文案切「提交中…」，`finally` 释放；
3. 临时 1500ms 延迟实测 pending 态，测后移除。

**结果**（`post-probe.json`，延迟注入实测）：pending 期间 9 个采样点（180ms–1620ms）按钮全部 `disabled=true`、`aria-busy=true`、文案 `提交中…`；二次点击被拦截（`blocked: 按钮 disabled，二次点击无效`）；`e10_rowDelta=1`（只落一条）。截图 `post-e10-pending.png`。
最终 bundle 无延迟快速连点两次：`e10_rowDelta=1`（`final-probe.json`），未产生重复记录。

**结论**：pending 期间按钮 disabled=true + 加载态「提交中…」+ 二次提交不可能（在途守卫 + 禁用双重）。PASS。临时延迟代码已移除。

---

## E11 保存返回上下文（筛选 / 排序 / 滚动不重置）

**补证前状态**（`baseline-e11-create.json`）：设 chip=全部、sort=dueDate、`.pm-shell` scrollTop=420 → 新建保存后 chip/sort 保留，但 **scrollTop 420→0**（打开抽屉 autofocus/开合把列表带回顶部，保存后未还原）。编辑路径因 opener 行可见而侥幸保留。

**动作 / 修复**：模块级记录「抽屉关闭期间」最后列表滚动位（打开期间不覆盖），`DrawerPanel` 打开时快照、关闭（保存成功/取消）时 `scrollTop` 还原；不改筛选状态、不碰焦点/tab 导航。

**结果**：
- 修复后（`post-e11.json`）：chip 全部 / sort dueDate / scrollTop 420 → 保存后 420，抽屉关闭；
- 最终（`final-probe.json`）：before `全部29 / dueDate / 420` → after `全部30 / dueDate / 420`，`drawerClosed=true`。

**结论**：保存成功后筛选、排序、滚动位置全部保留，不重置列表上下文。PASS。

---

## F9 成功反馈 role=status（可编程、不抢焦点）

**补证前状态**：Notice 一律 `role=status`，未区分错误变体（错误应 `role=alert`），且未显式声明 `aria-live`。

**动作 / 修复**：`Notice` 按变体分流——成功 `role=status` + `aria-live=polite`；错误 `role=alert` + `aria-live=assertive`（§7）；组件从不 `focus()`，两种变体均不抢焦点。

**结果**（`final-probe.json` `f9_notice`）：成功 Notice `role=status`、`aria-live=polite`、`focusedInside=false`（activeElement=BUTTON，未被通知抢走），文案「任务已新增并保存…」。截图 `final-f9-success-notice.png`（基线 `baseline-f9-success-notice.png`）。

**结论**：成功反馈 role=status + polite live region，不抢焦点。PASS。

---

## F10 stale 保留旧数据占位逻辑（§12-21）

**补证前状态**：代码库无「更新中/陈旧保留旧数据 + 最后更新时间」状态机；本地无远程，按规范仅补占位逻辑 + 单测，不启用真实远程。

**动作 / 修复**：新增纯零依赖模块 `src/core/stale-placeholder.ts`：`idleStaleSnapshot / beginRefresh（保留旧数据+标更新中）/ commitRefresh（替换+清陈旧+记时间）/ failRefresh（保留旧数据+标陈旧+记错误，绝不清空）/ isFresh / staleStatusLabel / lastUpdatedLabel`；新增 `stale-placeholder.test.ts`（6 用例）。

**结果**：`f10-stale-unittest.txt` —— 6 passed；模块与测试副本见 `f10-stale-placeholder.module.ts`、`f10-stale-placeholder.test.ts`。覆盖：刷新保留旧数据/updatedAt、成功替换、失败保留旧数据标陈旧、失败后再刷成功清除陈旧、时间标签格式化。

**结论**：stale 占位逻辑实现存在且单测全绿，面向未来远程/AI 路径预留，未接真实远程。PASS。

---

## 门禁结果
- `pnpm run build`：退出码 0（tsc + tsdown 通过）。
- `pnpm vitest run`：18 文件 / 209 用例全绿（含 F10 新增 6）。
- `pnpm run verify:isolation-only`：before=179 after=179，污染 0，PASS。

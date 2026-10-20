# B7 Growth 面板注入（okr/habit 受控表单）独立 QA · 2026-10-20

> author 809/build0，QA 独立 targeted 静态 + 复跑 16 例 PASS；不信作者全量计数，不启服务/浏览器，GUI 交互 later。

## 核验对象
- 契约 `views/growth-form-props.ts`（prefill 纯函数 + props 类型，不渲染/不 run）；组件 `views/okr-form.tsx`、`views/habit-form.tsx`；命令通道包装 `panel.tsx` OkrForm(4171)/HabitForm(4250)；视图 `okrs.tsx`/`habits.tsx`。
- 作者测试复跑：`growth-form-props.test.ts` 11 + `okr-model.test.ts` 5 = 16 PASS。

## 逐项结论（6/6 PASS）
| # | 关注点 | 证据 | 判定 |
|---|---|---|---|
| 1 | 无重复内部表单/导入 | panel 仅 103-104 单次导入 ExtOkrForm/ExtHabitForm；本地 OkrForm/HabitForm(4171/4250) 只是命令通道包装，UI 全交 Ext 组件；panel 0 处 records-listbox 导入（列表框由表单自带），无第二套 UI 重造 | PASS |
| 2 | values/prefill/status 隐藏字段保留 | `prefillOkrForm`(growth-form-props.ts:20-31) 映射 title/kind/owner/targetDate/primaryOkrId/relatedOkrIds/**status**/description，不回写 id/projectId；edit patch 带 status(panel:4207)，create 默认 draft(4234)；habit prefill 仅可编辑字段，status/checkIns/streak 系统字段不进表单（:40-48） | PASS |
| 3 | 命令精确 | 单条 `okr add ${projectId}`(4223)/`okr update ${record.id}`(4211)；`habit add ${projectId}`(4291)/`habit update ${record.id}`(4284)；视图 `okr confirm/ignore`、`habit checkin(今天/前1/前2天)/confirm/ignore` 经 run/act，无伪造 | PASS |
| 4 | 校验/busy/取消零写 | 组件内 `validateOkrForm`/`validateHabitForm` 就近拦截（空标题/超长/非法 okrId）；useSubmitGuard busy 禁用提交不清空；取消按钮仅 onCancel 关抽屉，零命令零写；失败 run=false→不 onSaved、保留输入 | PASS |
| 5 | listbox 键盘来自共享 | 类型/负责人/父目标/状态/关联 OKR 全用共享 `records/records-listbox.js`（ArrowUp/Down 环形、Enter 选中、Escape 关闭、aria-haspopup/expanded），缺失选项退回文本输入，不造名册 | PASS |
| 6 | AI 白名单不受影响 | `core/copilot.ts` ALLOWED_OPS 仍仅 task.update/milestone.create·update/risk.create·update/deliverable.create·update/meeting.create·update，无 okr/habit 写；表单/视图无 copilot 引用、无新增 AI 写操作 | PASS |

## 边界 / 残留
- 表单组件不 run()、不直写 store，值经 onSubmit 交回 panel 命令通道（源码静态核，作者测试 85-103 例同证）。
- GUI 交互（下拉键盘、校验就近、取消保输入、busy 态）NOT_RUN，归 Main 采证。
- B3：当前 helper 为 direct attach quickmanage 即时挂载，staging/finalize UI 待后续（计划 A11/A12/G03），本轮不审。

## 复跑（2026-10-20 独立）
- targeted vitest：`growth-form-props.test.ts` 11 + `okr-model.test.ts` 5 + `progress-report.test.ts`(U5) 12 = **28/28 PASS**。
- 源码复核：`copilot.ts` ALLOWED_OPS 仍仅 task.update/milestone.create·update/risk.create·update/deliverable.create·update/meeting.create·update，无 okr/habit/delete/asset，B7 注入未开放 AI 写。
- U5：`progressReportSourceTypeSchema = z.enum(['manual','session'])`（progress-report.ts:13），refine 强制 session 必带 sourceSessionId、manual 必为 null，互不混用。
- 范围边界：本轮仅核 copilot AI 白名单未变（无 okr/habit/delete/asset 写）；**AI 只读投影（readonly projection）未显式 QA**，待精确合同到位后再 targeted 复测，不计入本轮 PASS。

## 待合同/后端稳定后 targeted（冻结 backlog，现不跑）
精确合同已收到；QA 等后端补齐 + front 集成稳定后再 targeted（不 full rerun）：
- AI 投影：trim/max 截断、仅取文件 basename（不出绝对路径/目录）、剥离 URL、排除 deleted（软删）、仅 latest、限量 limit；**ALLOWED_OPS 保持不变**（无 okr/habit/delete/asset 写）。
- 逐项 targeted 断言；未稳定前不重跑 full。

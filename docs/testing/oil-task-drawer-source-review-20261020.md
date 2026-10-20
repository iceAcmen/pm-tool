# Oil `review` · task 抽屉源码同页评审（O1–O6，开给 front；静态 source review，非 GUI 实证）· 2026-10-20

> 范围：`client/panel.tsx` TaskForm + DrawerPanel + `panel.css`。批准原型 vs 真实 task 源码比对，**不是 Main GUI 实证**；新 candidate 能跑后再请 Main 同页同数据/视口截图 + route/state。旧 harness / Ego 数据不算 candidate。startup 最高优先，下列问题入 queue，不挡首 GUI。
> 定级 P0 阻断 / P1 重要 / P2 打磨；不套 Style Family，只对本项目自己的 `--pm-*` token。

## 总览

| # | 主题 | 位置（panel.tsx / panel.css） | 判定 |
|---|---|---|---|
| O1 | 抽屉焦点陷阱/归还 | panel.tsx 3214–3251 | 基本合格，1 处小补 |
| O2 | 深色原生 select/option | panel.css 20–22,181–183,231–236 | 已 PASS，保持勿改 |
| O3 | 按钮反馈 / 失败是否关抽屉 | panel.tsx 3629–3635,3892–3894,765–782 | **P1** |
| O4 | 破坏性确认 / 未保存草稿 | panel.tsx 3874–3891,3253,3216 | **P1**（dirty guard） |
| O5 | 只读客观进度陈旧 | panel.tsx 3493–3498,3714–3721 | P2 |
| O6 | preview 冻结版本/跨 task 引用 | B6-A07/A08（test plan §2.6） | 待 data 合同，不挡 |

---

## O1 焦点（P2，小补）
- **位置**：`DrawerPanel` Tab 循环 3218–3232、ESC 3216、卸载归还 opener 3246–3251；TaskForm title `autoFocus` 3658。
- **现状（保留）**：模态 `role="dialog" aria-modal`、可聚焦集合过滤 `getClientRects`、Shift+Tab 回绕、焦点 `preventScroll` 归还，已达标。
- **问题**：重开同一编辑抽屉时焦点固定落 title，不回到上次离开字段；非阻断。
- **可实施差异**：记录最后聚焦字段名，重开时优先 focus 该字段，失败回落 title。
- **验收**：Tab 不逃逸到宿主；ESC 关闭后焦点回触发按钮；重开焦点不跳顶。

## O2 深色原生 select（PASS，勿回退）
- **位置**：`panel.css:22 color-scheme:light`；`:183 color-scheme:dark`（`body[data-ds-dark-theme]` 作用域）；`:231-236` 显式 `select`/`option` 文字+底色+边框 token。
- **结论**：R3.2 已闭环，深色弹层不黑字黑底；静态保持，Main 仅补深浅两张 native 展开截图即可。

## O3 按钮反馈 / 失败是否关抽屉（P1 · evaluation gulf）
- **位置**：保存按钮 `disabled={disabled||submitting}` + `aria-busy` + 「提交中…」3892–3894（保留，良好）；提交 `3629-3635` 只要 `run()` truthy 即 `onSaved()` 关抽屉；`run()` 765–782 不解析 response 文本，只在 throw 时 setMessage。
- **问题**：命令被业务拒绝（返回「失败/错误/非法…」文本但未 throw）时，`run` 仍返回 truthy → 抽屉关闭、内联表单上下文丢失，用户只在全局消息看到错误，不知哪一栏被拒。
- **可实施差异**：`run`/TaskForm 对 response 做 `/失败|错误|非法|未通过|需为|不得低于|拒绝/` 判定：命中则**不关抽屉**、把错误文本 inline 到对应 Field（复用 `errors`/`role=alert`），按钮恢复可点；成功才 `onSaved()`，并在抽屉内给 `role=status` 短回执（如「已保存」），不依赖全局条。
- **验收**：非法业务拒绝后抽屉仍开、字段保留、错误就近可见；成功有可见回执；提交中按钮禁用且不重复提交。

## O4 破坏性确认 / 未保存草稿（P1 · draft-unsaved）
- **位置**：删除 `confirmDanger` 带子树计数 + 不可撤销文案 3874–3883（保留，良好）；取消按钮 3891、ESC 3216、scrim 点击 3253 均直接 `onCancel()`，无改动检测。
- **问题**：用户改了字段后点取消/按 ESC/点遮罩，未保存修改被静默丢弃，无「放弃未保存修改？」确认；description 用 `defaultValue` 非受控（3665），dirty 比较需一并纳入。
- **可实施差异**：用初始快照（task 原值 + 空新建）与当前受控值 + description 文本比对出 `dirty`；仅当 `dirty` 时取消/ESC/scrim 弹 `confirmDanger({title:'放弃未保存修改？', impact:'当前修改不会保存', confirmLabel:'放弃'})`，干净关闭直接走 `onCancel()`。删除确认逻辑不动。
- **验收**：无改动取消零确认即关；有改动取消先确认；确认放弃才关，确认则留在抽屉；删除仍走级联计数确认。

## O5 只读客观进度陈旧（P2）
- **位置**：`objectiveMap=deriveProgressMap(tasks)` 3493–3498；只读块 3714–3721。
- **问题**：B1-C2 stale 横幅下 `tasks` 是旧快照，客观进度 % 仍以「当前值」展示，无陈旧标注，可能误导。
- **可实施差异**：把外层 `stale` 传入 meta-block，陈旧时客观值后加弱标注「（数据陈旧，重试后更新）」，不参与可编辑提交。
- **验收**：stale 时只读客观值带陈旧标识；刷新成功后标识消失。

## O6 preview 冻结版本 / 跨 task 局部 ID 碰撞（待 data，不挡首 GUI）
- 已在测试计划 §2.6 立 **B6-A07**（selectedRefs 复合 taskId+entry+revision，防局部序号跨 task 碰撞、拒伪造悬空引用）、**B6-A08**（freeze 绑定原 revision，拒用最新正文冒充 contentSnapshot）。待 data 补合同后 QA 跑，B6 不称 PASS。

---

## Main 采证请求（新 candidate 可运行后，不等 B1–B8 全完）
- 同页同数据：打开同一 task 编辑抽屉，浅/深各一张；native 五态 select 展开一张；O3 故意触发一次业务拒绝看是否留抽屉；O4 改一字段点取消看是否弹确认。
- 记录 route/state、视口（1440/390）、运行版本 manifest 三元组；**before/after build fingerprint**：改动前后对 `lib/` 相关产物取 sha256 入证据目录。
- 旧共享 harness / Ego 浏览记录仅作工具观察，**不计入 candidate 验收**。

## 保留项（勿改）
焦点陷阱/归还、深色 color-scheme+显式 option、提交防重 `useSubmitGuard`、删除级联确认、客观/人工双轨只读块、安全 MarkdownView。

# R3-UX-001 Commit 终签复跑事实记录

> 候选已合并为 commit HEAD `3f0528a`。本文件只记录事实，不给 PASS/FAIL 判定。

## 候选指纹

- HEAD: `3f0528af160f32d89c9bf59a9a561e788a7b56b3`
- tracked 状态: clean（仅 1 个 untracked fixture script）
- lib/client.js: `07c3edb2...767da14` ✓
- lib/index.js: `64a48aec...b7e8` ✓
- lib/core/drawer-focus.js: `60d1e11f...9aa86` ✓
- lib/client/form-validation.js: `aeec0350...da84` ✓
- 新实例 PID: 95085，端口 3091
- 运行开始 UTC: 2026-10-12T19:52:01Z

## 项目空提交

- 焦点: INPUT name="name"（首个错误字段）
- 3 条持久内联错误（role=alert, .pm-field-error）：
  - project-name-error: "项目名称不能为空"
  - project-start-error: "请选择开始日期"
  - project-target-error: "请选择目标日期"
- aria-required=true, aria-invalid=true, aria-describedby 正确
- 必填星号 3 个

## target<start

- 错误: "完成日期不得早于开始日期"，aria-invalid=true，可见

## 浅色对比度 DOM 对象

- bodyBg: rgb(255,255,255)
- 错误文字色: rgb(97,102,107)
- 错误边框: rgb(236,19,19) 1px

## Esc 焦点归还

- title: BUTTON "逾期任务" (pm-title-cell)
- edit: BUTTON (pm-row-button)
- create: BUTTON "添加记录" (pm-add-button)

## console

- 交互 0 错误

## 零污染

- after.diff: cancellationUnchanged=true, 27 unchanged, 0 added/modified/deleted
- 本复跑未创建/删除任何数据（仅空提交触发验证后关闭抽屉）

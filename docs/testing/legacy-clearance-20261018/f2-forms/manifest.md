# F2 表单行为证据清单（manifest）

| 条目 | 证据文件 |
|---|---|
| E2 任务空名绑定（最终） | final-e2-task-error.png, final-probe.json(e2_task) |
| E2 交付物空名绑定（最终） | final-e2-deliverable-error.png, final-probe.json(e2_deliverable) |
| E2 基线 | baseline-e2-task-error.png, baseline-e2-deliverable-error.png, baseline-probe.json |
| E10 延迟实测 pending（disabled/aria-busy/提交中…/二次点击 blocked/rowDelta=1） | post-e10-pending.png, post-probe.json(e10_samples/e10_secondClick/e10_rowDelta) |
| E10 最终无延迟连点 rowDelta=1 | final-probe.json(e10_rowDelta) |
| E11 基线缺陷 420→0 | baseline-e11-create.json |
| E11 修复后 420→420 | post-e11.json, final-probe.json(e11_before/e11_after) |
| F9 成功 Notice role=status/polite/不抢焦点 | final-f9-success-notice.png, final-probe.json(f9_notice) |
| F10 stale 模块 + 单测 6 passed | f10-stale-placeholder.module.ts, f10-stale-placeholder.test.ts, f10-stale-unittest.txt |
| 汇总论述 | EVIDENCE.md |

门禁：build=0；vitest 18 文件/209 用例全绿；verify:isolation-only before=179 after=179 污染 0。

# P2-6 第八轮独立复验证据（2026-10-17，独立测试专家）

绑定：HEAD `21cdc94`（未提交工作树）；tracked diff SHA `5e28463657c05c866e07bbd58db840c01c8d2bdbc53c9eead84aee1fff2b69e9`。离线、隔离、不出网、不调模型。

| 文件 | 门 | 独立结果 |
|---|---|---|
| 01-build.log | tsc+CSS+tsdown | exit 0 |
| 02-vitest.log | vitest run | 16 文件 / 193 passed |
| 03-coverage.log | vitest --coverage | exit 0；All files 52.84 stmts / 85.32 branch（无回退） |
| 04-e2e.log | scripts/e2e.mjs | E2E PASS，console errors=0 |
| 05-verify-isolation.log | verify-isolation 聚合 | 75/75，169 资产 before=after 零污染 |
| 06-disk.log | verify-provenance-disk.mjs 单独直跑 | PASS（真实磁盘+子进程重启+ask-recheck） |

m-1~m-5 核真：m-1 refs 只取 appliedActions（ask.ts:458，跳过/拒绝/失败不入）；m-2 WBS 新任务 op=task.create + OP_TABLE 映射（task.ts:613，provenance.ts:16）；m-3 缺 postimage→absent/skip 不自比 clean（ask.ts:228，provenance.ts:343）；m-4 仅无冲突无失败才 used=true（ask.ts:248）；m-5 pending 写入前 capPendingEntries 去重裁剪（store.ts:160，:105）。
秘密扫描：NO-HIT。

# P2-6 第六轮独立复验证据（2026-10-17，独立测试专家）

绑定：HEAD `21cdc94`（未提交工作树）；tracked diff SHA `70d078242bb98f3f8db8959d97b017a3d0a402feb65033437b5884693cb1f173`。
新增 `scripts/verify-provenance-disk.mjs` SHA `c78eb984…c6eb9`（187 行）。离线、隔离 tmpdir、不出网、不调模型。

| 文件 | 门 | 独立结果 |
|---|---|---|
| 01-build.log | tsc+复制CSS+tsdown | exit 0 |
| 02-vitest.log | vitest run | 16 文件 / 187 passed |
| 03-coverage.log | vitest --coverage | exit 0；All files 52.84 stmts / 85.32 branch（provenance 仍在 include 子集外，无回退） |
| 04-e2e.log | scripts/e2e.mjs | E2E PASS，console errors=0 |
| 05-verify-isolation.log | verify-isolation 聚合 | 75/75 通过，169 资产 before=after 零污染 |
| 06-verify-provenance-disk.log | 磁盘集成单独直跑 | PASS（真实 cordis+JsonStorageBackend(tmpdir)+子进程重开） |

秘密扫描：NO-HIT（仅脚本名良性命中，无 token/key/Bearer/凭据）。

# P2-6 第七轮独立复验证据（2026-10-17，独立测试专家）

绑定：HEAD `21cdc94`（未提交工作树）；tracked diff SHA `1510489ddafe97133b0e02a5f19ebab3aebba43bf1fc00c1b6c74b96a7360439`。离线、隔离、不出网、不调模型。

| 文件 | 门 | 独立结果 |
|---|---|---|
| 01-build.log | tsc+CSS+tsdown | exit 0 |
| 02-vitest.log | vitest run | 16 文件 / 190 passed |
| 03-coverage.log | vitest --coverage | exit 0；All files 52.84 stmts / 85.32 branch（无回退） |
| 04-e2e.log | scripts/e2e.mjs | E2E PASS，console errors=0 |
| 05-verify-isolation.log | verify-isolation 聚合 | 75/75，169 资产 before=after 零污染 |
| 06-verify-provenance-disk.log | 磁盘集成单独直跑 | PASS（真实 cordis+JsonStorageBackend(tmpdir)+子进程重开，含 ask-recheck） |

本轮核：M-3 常量 CURRENT_SNAPSHOT_VERSION/CURRENT_RULE_REVISION 四处引用无生产残留；B-1 `/pm ask-recheck` 路由(index:190)→handleAskRecheckCommand 真实调 validateSourceRefs+recheckProvenance，recordRecheck 持久化、consistent 才计 supported、history 不可变追加不洗白。
秘密扫描：NO-HIT（仅脚本名良性命中，无 token/key/Bearer/凭据）。

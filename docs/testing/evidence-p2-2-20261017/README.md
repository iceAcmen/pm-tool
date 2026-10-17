# P2-2 独立复验证据索引（2026-10-17）

> 独立测试负责人原样留存本批复跑日志，未重跑、未改写；工作目录 `packages/dsh-pm-tool/`。
> 绑定 HEAD `21cdc94ba57ce7efb473e62373036b4b7ce6cd04` + 产品 src diff SHA `f5baf318f97876ed4eb2167102fbc0def80b9edc73b56c9100e4edebf0b83108`。
> 退出码由独立执行 shell 记录；日志正文为命令原始输出。G3 真实 GUI 目视门不在此目录（BLOCKED，无截图）。

| 文件 | 命令 | 记录退出码 | 关键证据（原文） |
|---|---|---|---|
| `01-build.log` | `pnpm run build` | 0 | `✔ Build complete in 143ms`；tsc 无错、tsdown 6 产物 |
| `02-vitest-164.log` | `pnpm test` | 0 | `Test Files 14 passed (14)` / `Tests 164 passed (164)` |
| `03-coverage.log` | `pnpm test:coverage` | 0 | `All files | 52.84 | 85.32 | 48.33 | 52.84`，无阈值失败 |
| `04-e2e.log` | `pnpm e2e` | 0 | `[OK] project.rendered`、`[OK] task.rendered`、`console.clean :: errors=0`、`E2E PASS` |
| `05-verify-isolation-73of73.log` | `node scripts/verify-isolation.mjs` | 0 | `[guard] 脚本：共 73，通过 73，失败 0`；`资产 before=169 after=169，污染 0`；正式 data/backups/exports 169 文件零变化 |

说明：
- 这些是 G1 构建/回归/隔离门的确定性日志；G2/G4 为静态核对，证据见 `../p2-2-independent-acceptance-20261017.md` §2/§3（对照源码与 grep 结论）。
- 日志不含真实浏览器渲染证据；G3 BLOCKED 期间不提供截图。

## 交付前秘密扫描（2026-10-17，独立测试）

- 扫描范围：本目录 5 份 `.log`（build/vitest/coverage/e2e/verify-isolation）。
- 检查项：Bearer、`sk-` 类密钥、api_key/secret/token/password 赋值、带凭据 URL（user:pass@host）、URL 参数 token/key、环境变量 KEY/TOKEN/SECRET/AUTH 值、外网/本地 URL、长串 hex/base64。
- 结论：**NO-HIT（0 命中）**；长串仅为测试夹具随机 id/任务 id 与校验短语，非凭据。无需脱敏，原件可随仓库发布。

# verify-isolation 16 失败 + 污染3 独立分类 · 2026-10-20

> QA 逐脚本实读日志 + 单独复跑（含 scrubbed env 复现）分类，不泛称「其它模块」，不自动判非 B3。未重跑 guard 全量。

## A. 独立单独复跑结果（退出码）
对 16 条 guard 清单逐条单独 `node scripts/<s>.mjs`，并以 `env -u PM_DATA_ROOT -u DSH_PM_BACKUP_DIR` 复现 guard 擦除环境，两者一致。

| 脚本 | 单独退出 | scrubbed 退出 | 判定 |
|---|---|---|---|
| verify-gantt-drag | **1** | 1 | 真失败（C1） |
| verify-integration | **1** | 1 | 真失败（C2） |
| verify-b2-materials | 0 | 0 | 单脚本绿，guard 批量 exit1 为串扰/顺序 |
| verify-backup | 0 | 0 | 同上 |
| verify-copilot-writes | 0 | 0 | 同上 |
| verify-deliverables | 0 | 0 | 同上 |
| verify-p0-integration | 0 | 0 | 同上 |
| verify-p1-integration | 0 | 0 | 同上 |
| verify-p1c-integration | 0 | 0 | 同上 |
| verify-p2a-export | 0 | 0 | 同上 |
| verify-p2c | 0 | 0 | 同上 |
| verify-reflect | 0 | 0 | 同上 |
| verify-task-repo | 0 | 0 | 同上 |
| verify-web-assignee-list | 0 | 0 | 同上 |
| verify-web-repo-link | 0 | 0 | 同上 |
| verify-web | 0 | 0 | 同上 |

> 14 条单脚本（含擦除 env）均 0；guard 批量却记 exit=1，属批量顺序/共享默认存储串扰或非确定性，非单脚本确定性缺陷，需 runner/顺序 triage，不按单脚本失败记账。

## B. 真失败精确错误

### C1 verify-gantt-drag.mjs:78 — 源码扫描断言 stale（非运行缺陷）【脚本侧已修 ready，待复跑】
- 错误（修复前）：`AssertionError: run 成功返回 true`；脚本对 client 源码做 `/return true/` 正则 match。
- 现状（静态核，未运行）：断言已改为行为契约——`const accepted = commandAccepted(response)` + `return accepted` + catch `return false`，不再绑定字面量 return true。
- 归属：前端 gantt drag（widget/拖拽提交），非 B3。
- 复跑：C2/污染修复后与 integration、full isolation 一并独立复跑。

### C2 verify-integration.mjs:107 — 恢复往返丢失 fileBundleId（备份契约漂移）
- 错误：`恢复后 domain 与旧备份一致` deepStrictEqual 失败；actual 备份对象**无** `fileBundleId`，expected(oldTxt) 带 `fileBundleId: 'c82cd37e16744432'`。
- 现象：`createBackup` 落盘的旧备份带 fileBundleId；`restoreBackupFromContent` 后 `collectBackup(domain)` 再收集时该字段丢失，deepEqual 不等。
- 归属：备份/数据（backup core；fileBundleId 与 B3 asset bundle 相关，需 backup owner 确认恢复链路是否应保留该字段；不自动归 B3）。
- 修法（owner）：恢复后快照/收集应保留 fileBundleId，或调整该断言口径，保证往返一致。

## C. 污染 3（正式 packages/backups，guard 运行期间新增）
精确资产名：
1. `packages/backups/pmtool-backup-2026-10-19T21-39-43-918Z.json`
2. `packages/backups/pmtool-backup-2026-10-19T21-39-43-918Z.json.files.0ef5530df557a453/89/89d31ea5a88c2f775aedf445794f4d864ae85549b363229fe232f5d1acce990a.md`
3. `packages/backups/pmtool-backup-2026-10-19T21-39-43-918Z.json.files.0ef5530df557a453/manifest.json`

- 现象：擦除 env（无 DSH_PM_BACKUP_DIR）下，某备份流程的 safetySnapshot/备份落入正式默认 `packages/backups`（脚本自身显式 backupDir 均指向 TMP，但 safetySnapshot 回落默认备份目录未被重定向/清理）。
- 归属：备份/数据；需 owner 定位具体调用并把 safetySnapshot 限定到隔离目录或运行后清理，避免正式资产被写。

## D. Owner 地图（按 scope，非 B3 自动豁免）
| 编号 | 问题 | Owner scope | 优先级 |
|---|---|---|---|
| C1 | gantt-drag 源码扫描 `/return true/` stale | 前端（gantt widget） | P2 |
| C2 | 恢复往返丢 fileBundleId，deepEqual 漂移 | 备份/数据（backup core） | P1 |
| 污染3 | safetySnapshot 写正式默认 backups | 备份/数据 | P1 |
| 批量串扰 | 14 条单脚本绿但 guard 批量 exit1（顺序/共享默认存储/非确定性） | runner/隔离门 + 对应 owner 复现 | P2 待 triage |

## E. 待办（dataowner，非本轮 QA 实现）
- 能力门 rootAvailable：注册 assetUpload/stageCancel/assetDownload 标志时**且**判 `describeFileRoot().source !== 'unavailable'`（rootAvailable），不能只在请求侧 fail-closed；否则 UI 显示上传入口后才失败。本轮仅记录，QA 不改业务。

## 结论
- 真确定性失败仅 C1/C2；污染3 归备份；14 条为批量串扰待 triage。B3 自身 targeted 48 例 PASS 不受上述影响。

## 复跑协议（owner 修复 C1/C2/污染后，QA 独立执行）
1. 先单脚本逐个复跑：C1 gantt-drag、C2 integration，各自 exit 0 才算修复。
2. 再独立跑 full guard（`node scripts/verify-isolation.mjs`），记录脚本通过/失败数 + 污染 diff。
3. 污染精确 test-generated 路径的删除**仅由 dataowner 执行**，QA 不删正式资产。
4. 14 条批量 exit1 的「级联污染」假设：单脚本全绿、仅批量红 → 疑似早期脚本写正式默认目录/共享默认存储后，使后续脚本确定性断言失败或非零退出；修复 C1/C2/污染后重跑，若 14 条转绿即证实为级联，仍红则按单脚本日志单独开。
5. 复跑前不重跑全量 guard（未修复前不重复）。

## 复跑结果（2026-10-20，独立）
- `node scripts/verify-isolation.mjs`：脚本 **93/93 通过，失败 0**；资产 before=after=228，**污染 0**，exit 0。
- C1 gantt-drag（行为契约断言）、C2 integration（fileBundleId 往返）均随全量转绿；污染3 safetySnapshot 已不再写正式默认目录，旧资产已由 owner 清除，WATCH 无新增。
- 14 条原「批量串扰」随修复转绿，级联假设关闭（未再单独开单脚本失败）。

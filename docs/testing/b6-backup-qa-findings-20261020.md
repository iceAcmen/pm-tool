# B6 汇报引用 + 备份 EXTRA 袋 独立 QA 复验与缺陷 · 2026-10-20

> QA 离线探针（临时脚本跑完即删，未留仓库）+ 源码只读；不改业务源码。静态/单测绿 ≠ GUI PASS。

## A. B6 progress-reports（作者 `scripts/verify-b6-report.mjs` 8 例）

独立复跑 `node scripts/verify-b6-report.mjs` → **PASS exit0**：preview 只读不落盘；复合 selectedRefs（taskId+entryId+revisionId）不跨任务撞号；源 edit 后旧 revisionId 冲突拒、不静默抓新；不带 revisionId 取最新；多选两任务 pl-1 同冻；未知任务/条目零写；伪造正文/作者/日期拒；update 不传 excerpts 保留、传真实 excerpts 替换。

### refs 路径正例复验（PASS，零写）
- 任意 revisionId 不存在（rv-999）→ 拒；跨项目 task → 拒；软删 entry → 拒；均零写（`freezeSelectedEntries` 132/136/144）。

### 独立探针 3 缺陷 · 已修复并 QA 复验全拒（2026-10-20 第二轮）

| # | 位置 | 原问题 | 修复后 QA 复验（临时探针跑完即删） |
|---|---|---|---|
| **B6-D1** | `core/progress-reports.ts` excerpts 路径 | 不校 `task.projectId === report.projectId`，跨项目真实条目被接受 | **PASS 拒**：「摘录任务不存在或不属于本报告项目（p-0001）：t-0002」零写 |
| **B6-D2** | 同上 | 不校 `entry.deletedAt`，软删条目被接受 | **PASS 拒**：「摘录条目不存在或已软删：t-0001/pl-1」零写 |
| **B6-D3** | `generateProgressReport` | excerpts+selectedRefs 并存静默忽略 refs，无互斥 | **PASS 互斥拒绝**（两字段并存报错，不静默丢弃） |

> 作者 `verify-b6-report.mjs` 8 例复跑仍 PASS。**backend API ready（selectedRefs 合同已交），非无合同 BLOCKED**；UI selectedRefs panel 接入 in progress，G 门等 front panel + Main 采证；source error UI 待前端，B6 不得 G PASS。

## B. 备份 #41 EXTRA 袋（settings/reflections/okrs/lessons/habits）· PASS

独立探针 L1–L4（隔离 DSH_PM_BACKUP_DIR，不碰正式 backups）：

| # | 场景 | 结果 |
|---|---|---|
| L1 | legacy 备份 `extra=undefined`（旧 7 表）恢复 | **整块跳过，okrs/habits/settings/lessons/reflections 全保留**，不清空（`backup.ts:219 if (extra !== undefined)`）· PASS |
| L2 | extra 显式 `{okrs: []}` | 仅 okrs 清空，未列出的 habits 保留 · PASS |
| L3 | extra 含白名单外表 `sessions` | 拒绝 + 自动回滚 + 零写（okrs/habits 仍=1）· PASS |
| L4 | extra 显式 okrs 行 | 替换为备份内容，habits 保留 · PASS |

- 语义：显式列出的白名单表才替换（显式空数组=意图清空该表）；未出现的表保持现状；白名单外表名拒绝。
- `checks/sessions` 为宿主会话/密钥表，不进 pm 备份（`backup.ts:38` 注释），合理，不归 pm 域。
- **待办（非本批 blocker）**：B3 `file_assets` 落地后需追加进 BACKUP_TABLES，实现文件包+db 一致备份/恢复计数一致；当前全 file+db 一致包未实现。

## C. B3 file-assets
`core/file-assets.ts`（177 行）已实现 10MiB/扩展名+声明 mediaType+magic 三重白名单/拒 active exe/html/svg/脚本/sha256 内容寻址/root 防穿越拒 symlink/tmp→fsync→rename 幂等；`file-assets.test.ts` **11 例 QA 复跑 PASS**；**待接 UI/路由 → NOTRUN，不能 PASS**。

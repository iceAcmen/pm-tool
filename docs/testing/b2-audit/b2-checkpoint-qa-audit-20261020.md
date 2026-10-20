# B2 checkpoint 独立 AUTO 验记录（QA，非作者 verify 复述）

> 日期 2026-10-20｜QA 独立执行，隔离临时 JSON root / 零正式数据 / 不联网 / 不改业务源码。
> 性质：**静态/AUTO 层 PASS ≠ 产品验收 PASS**；UI/full journey 归 Main GUI 采证。

## 1. 执行环境与基线（2026-10-20 最新复跑，旧 603/600 快照作废）

- 仓 HEAD `8dfed2d5a3ea7bd42be70dfbbdf0de1a977a3991`（工作树未提交，QA 不碰不提交；各 owner 改动分片见冻结清单）。
- `tsc --noEmit` 干净；build 成功。
- vitest **最新实测：60 文件 / 624 测试全 PASS**（随各 owner 加测增长；冻结清单所记 603 为当时快照，以本轮实测 624 为准，不存在 600/603 矛盾，二者是不同时点）。
- isolation `verify-isolation.mjs`：**90/90 通过，资产 before=after=201，污染 0**（QA 独立复跑，不沿用作者 PASS）。
- 作者门 `verify-b2-materials.mjs`：QA 独立复跑 PASS。

## 2. QA 独立用例结果（23/23 PASS；C8 已修复，原 WARN 关闭）

| 组 | 用例 | 结果 | 证据 |
|---|---|---|---|
| C1 | 跨项目交付物引用被拒（p-0001 交付物挂 p-0002 → error「交付物不属于当前项目」，异项目任务无 attachments） | PASS | 命令层 error，零写 |
| C1b | 同项目关联成功，frozenVersion=v1.0 / frozenName 快照 | PASS | 落库快照字段 |
| C2 | `javascript:alert(1)`、`data:text/html,<script>`、`ftp://`、非 URL 全拒；零新增链接；合法 https 落库 | PASS | EvidenceUrlInvalidError，零写 |
| C3 | 同任务并发 5 条 progressAdd 全 success、id 唯一、无丢更新 | PASS | 队列串行，全落 |
| C3b | 同一条目并发两次 edit 各 append revision（共 3 版），首版正文保留不覆盖 | PASS | revisions=3，首版原样 |
| C4 | create 拒收 attachments、update 拒收 progressLog、create 拒收未知键（strictObject） | PASS | schema parse throw |
| C5 | 坏 JSON / 空 author / 空 content 全拒，attachments/progressLog 条数不变（零写） | PASS | 计数不变 |
| C6 | 备份→恢复往返，attachments/progressLog 及 revisions 完整保留，新键不清 | PASS | createBackup/restoreBackup |
| C7 | 新进程（第二 facility 同 root）读回 att=2 / log=6 | PASS | 磁盘持久化生效 |
| C8 | **已修复**：refs 写时校验∈本任务 active attachments——悬空 `at-999` 拒且零写、合法 active ref 接受、已摘除 ref 拒且零写（`assertRefsOnActiveAttachments`，MaterialNotFoundError） | **PASS（原 WARN 关闭）** | 三向：悬空拒/合法收/摘除拒 |

## 3. 已核作者门（独立复跑，非照搬）

- `scripts/verify-b2-materials.mjs`：PASS（link/deliverable 冻结、重复/不存在零写、remove 不删源、P3 append revision、软删/restore、done 双读不误报、备份往返、AI 白名单拒写）。
- B2 合同：`B2-strict-schema合同-attachments-progressLog-20261020.md`；create/update 不接受 arrays，专用命令原子提交；删除仅 unlink 不删源。

## 4. 待 Main / 后续（NOT_RUN，不 PASS）

- UI 两区完整提交、取消保输入、200%/390/浅深像素、full journey：Main GUI 采证；B2 写操作等 data 原子 API，前端只读渲染，未接前不出现可点写入口（NOT_RUN，禁伪装可用）。
- data reports 持久 API（B6）待数据 owner 交合同后再测。

## 5. 结论

B2 数据层 AUTO（schema/双读/并发/新进程/备份/越界/XSS/零写/C8 refs 存在性）**独立 PASS 23/23**；C8 已修复关闭。整体发布仍以 B1 GUI 全 PASS 与 Main 采证为准，当前不称上线。

## 6. 追加复验：P0 编辑基本字段 + draft 两区同事务原子（防半写）· 2026-10-20

**问题口径**：编辑表单基本字段（progress/title/status…）与资料/进展两区是否同一次 put，避免「task update 成功、material commit 失败」半写。

**源码事实（独立读 `core/tasks.ts` updateTask / `core/task-materials.ts`）**：
- 基本字段先在队列外 `taskUpdateSchema.parse`（非法即抛，零写）；进入 `enqueueDomainWrite` 临界区后才归一化 draft 两区，任一校验失败在 `table.put` 之前抛出，**唯一一次 put 在全部归一化/parse 之后**，失败不落库。
- 同一次 `nextInput` 合并 `...fields` + `draftAttachments` + `draftProgressLog`，单条 `table.put(id, next)`；未提交的区保留现状（zoneKeep）。
- `commitTaskDraft`（`/pm material commit`）自身亦在同一临界区内先校验后单 put，失败零写。

**独立复跑**：`node scripts/verify-b2-materials.mjs` EXIT=0（PASS verify-b2-materials），覆盖 P0 段：
- 合法 `task update {progress:20, draft:{attachments:[deliverable],progressLog:[…]}}` → 基本字段+两区同落库。
- 非法 draft（不存在交付物 `t-9999`）→ error，`progress` 仍=20、attachments=1、progressLog=1 **全部保持原值，不半写**。
- 仅提交 attachments → 该区整体替换为 link，未提交的进展区保留。

**判定：PASS（数据层原子闭环）**。仍仅 AUTO 离线；GUI 表单同请求打包提交、取消零写待 Main 采证（NOT_RUN）。

### 6.1 批前恢复点（非 SHA 清单）独立核 —— 产品数据层 PASS，源码工作图层 GAP
- **产品数据备份（PASS）**：`core/backup.ts` 恢复前 precheck→before 内存快照+安全快照落盘→replaceAll，中途失败自动从 before 回滚；`node scripts/verify-backup.mjs` EXIT=0（隔离目录+默认 backups 未变+原子写+中途回滚 T1–T9+并发入队安全 T10–T11）。注：BACKUP_TABLES 仅 7 表（projects/tasks/milestones/risk_issues/meetings/reports/deliverables），不含 okrs/habits/settings。
- **源码工作图层（GAP，回 owner 补，非 QA 重置/删别人）**：当前指纹 `首批候选完整指纹-20261020.json` 仅存 sha256/bytes/mtime/mode，**无原始内容**；全仓无 `.patch/.orig/.bak/.diff/snapshot`。tracked 修改（25）可 `git checkout` 回基线 HEAD，但**未提交工作态旧版与 68 个自有 untracked 文件无法凭 SHA 清单恢复**。要求：每改域批前，owner 对自有 tracked 改动出 `git diff` patch 落可恢复目录，并复制自有 untracked 文件（仅本任务范围），不得用 reset 丢弃他人文件。

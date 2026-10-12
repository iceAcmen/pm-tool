<!--
round2 复验协议与基线。独立测试专家所有。被测基线提交 a8e8ea4。
本文件自包含：关键证据已写入仓库，不依赖任何本地 agent workspace。
-->
# round2 复验协议（T-DEF-008 / T-DEF-004 修复后）

> 状态：**等待开发修复 T-DEF-008 / T-DEF-004**。本文件锁定修复后的复验清单与修复前基线。
> 被测基线提交：`a8e8ea40e7b3add694b053142517369fae3b7a2a`。
> 总门：**仍 NOT PASS**（网页实测 / 页面样式 / 用户体验三类 BLOCKED 未解除；T-DEF-008/004 仍 OPEN）。修复这两项只是把"测试设施/功能缺口"清掉，**不会**自动解除 GUI BLOCKED，总门仍不 PASS。

## 1. 修复前基线（已固化，复验时比对）

固化时间：2026-10-12T15:33:12+0800，HEAD=a8e8ea4。

| 项 | 基线值 |
|---|---|
| `packages/backups/` 文件数 | **81**（含历史与今日测试快照） |
| 文件名清单 sha256（`ls -1 \| sort \| shasum -a 256`） | `49887565a79e044e9e543d22112cb5b04f88abcff9eaec3cb93eb5abd6560b52` |
| 内容 manifest sha256（每文件 sha256 后按名排序再摘要） | `95ea5300e6f6cc76a7d0cbaaedd7a5d28c332b11b4b743b443ee47e9c78f5f65` |

> 复验判定：
> - 若开发**只修代码不传 directory、不清理**：重跑 verify-backup 后，默认 `packages/backups/` 应**不再新增**文件（清单 hash 相对修复前的运行结果不再增长）。
> - 若开发**同批清理**了这批测试快照：文件数/清单 hash 应变为「清理后集合」，但**修复后的任何 verify 运行都不得再往该默认目录写新测试快照**。
> - 真实 `data/pmtool/` 任一时刻都不得被 verify 改写（projects/*.json mtime 基线为 2026-10-10）。

## 2. T-DEF-008（backup 隔离）复验清单

开发预期修复：给 `scripts/verify-backup.mjs:70` 的 `restoreBackup(domain, b.path)` **显式传隔离目录**（参照 verify-integration 传 BAKDIR）。

复验逐项（全部通过才关闭 T-DEF-008）：
1. **默认目录不污染**：修复后重跑 verify-backup，`packages/backups/` 清单 hash 相对「修复前基线」不增长（无新测试快照落入）。
2. **隔离目录生效**：安全快照改写到隔离的临时目录（系统临时目录 / 项目内 `.tmp`，非产品默认备份目录）。
3. **安全快照内容正确**：隔离目录内安全快照与恢复前全量数据 deepEqual（沿用 verify-integration 已有的强断言口径）。
4. **产品逻辑不退步**：restore 缺 confirm 仍只演练不写；预检 format/formatVersion 仍拒绝坏备份；备份仍不含 checks。
5. **真实 data 未动**：`data/pmtool/projects/*.json` mtime 仍为 2026-10-10。

> 测试专家独立复验，**不代改测试脚本、不代删备份文件**；开发清理动作与修复同批提交后由专家比对 hash。

## 3. T-DEF-004（ask 取消即弃）复验清单

开发预期新增断言：生成 ask 草稿 → **取消** → 不调用 ask-apply、领域无新增/变更记录。

复验逐项：
1. **取消不写库**：取消草稿前后，`domain` 七实体 deepEqual 不变；无 ask-apply 调用日志。
2. **取消不产生残留文件**：无新 record JSON、无安全快照。
3. **与 confirm 对照**：同一草稿 confirm 仍正常落库（幂等/冲突守卫不受影响）。

> **重要**：若开发**只补纯函数/域级取消断言**，T-DEF-004 的**网页 GUI 部分仍 BLOCKED**——真实 ask 抽屉点"取消"按钮是否真不写库，必须真实浏览器验证。纯函数通过 ≠ 抽屉取消可用。

## 4. 证据可携带性说明（不依赖本地 workspace）

- 本仓库内可携带的关键证据：
  - 回归报告：`verify-run-20261012-152121/REPORT.md` 与 `logs/_summary.tsv`、各 `<script>.log`（36/36 退出 0、e2e BLOCKED）。
  - 代码行：`src/core/backup.ts:19,199`、`scripts/verify-backup.mjs:48,70`、`scripts/verify-ask-apply.mjs`。
  - 本文 §1 基线 hash。
- 测试专家自留审计日志（**仅辅助、不可携带**）位于本机 agent workspace：
  `…/agents/s_000EgMVDudw/artifacts/logs/audit-round1-20261012.md`。
  其中决定性结论（基线 hash、36/36、隔离缺陷、真实 data 未动）已复制/摘要进本仓库文档；该外部日志丢失不影响本仓库结论的可追溯性。

## 5. 复验后如何出 round2 结论

- T-DEF-008/004 关闭 + GUI/视觉/UX 仍 BLOCKED → 总门**依旧 NOT PASS**，继续阻塞新功能。
- 只有当 GUI/视觉/UX 三类在真实浏览器实测通过（或由项目所有者明确以 BLOCKED 特批，须留痕），测试专家才可能出"五类全 PASS"终签。

---

## 6. round2 实测复验结果（独立测试专家执行，2026-10-12）

> 测试专家亲自跑专项、重算 hash、读源码；未采信开发"37 PASS"概述。
> **基线说明（勿误读）**：round1 被测基线 = `a8e8ea4`；本轮修复复验时为工作树改动，**之后已由开发提交为 `8b81eeb`**；本测试文档提交时当前 HEAD = `7a64fe4`（PM ADL-045 规则）。下文"工作树"指复验当下状态，不等于最新 HEAD。

### T-DEF-008（backup 隔离）—— ✅ **关闭（CLOSED）**

源码核实（亲自读 `scripts/verify-backup.mjs`）：
- L15 `import { …, defaultBackupDirectory }`；
- L24 跑前 `before = hashSet(defaultBackupDirectory)`；
- L75 `restoreBackup(domain, b.path, backupDir)`（已补第 3 参数）；
- L81 `assert.deepEqual(hashSet(defaultBackupDirectory), before, '默认 packages/backups 前后应不变')`。

专家独立执行与比对：
- 隔离环境（无空格 TMPDIR）亲自运行 `node scripts/verify-backup.mjs` → **退出码 0**，输出"隔离目录+默认backups未变"。
- 跑后重算默认目录 `packages/backups/`：**81 文件**，清单 sha256 `49887565a79e…`、内容 manifest `95ea5300e6f6…`，**与 §1 基线逐位一致**（无新增测试快照）。
- 安全快照落点在隔离 tmp（`.tmp/r2-isolated/tmp/pm-tool-backup-*`），**非**默认 `packages/backups/`。
- 真实 `data/pmtool/projects/p-0001.json` mtime 仍 2026-10-10，未触碰。

> 结论：默认目录不再被测试污染，隔离目录生效，安全快照内容由既有 deepEqual 断言保护。T-DEF-008 关闭。
> 待保留改动：`packages/dsh-pm-tool/scripts/verify-backup.mjs`（import + 传参 + 前后深等断言）。

### T-DEF-004（ask 取消）—— 域级分项 ✅ 关闭；GUI 分项 ⛔ 仍 OPEN/BLOCKED

- 亲自读 `scripts/verify-copilot-cancel.mjs`：spy `tasks.put`，断言取消/草稿产出分支 `writes === 0`、领域记录不变（assignee 仍"甲"）。**确为 domain/写计数级，无浏览器**。
- 域级分项（取消不写库）：**关闭**。
- GUI 分项（真实 ask 抽屉点"取消"按钮是否真不写库）：**仍 BLOCKED**，与协议一致——纯函数/域级通过 ≠ 抽屉取消可用。

### 新观察（次要，不阻塞）
- 专家隔离路径含空格（`Application Support`）时，backup/restore 在空格处截断 → ENOENT 失败。默认产品备份目录无空格不受影响；记为 S4 观察（路径含空格兼容性），交开发评估是否加固，不阻塞本轮。

### round2 总门
- T-DEF-008、T-DEF-004 域级分项已关闭；T-DEF-004 GUI 分项、以及**网页实测/页面样式/用户体验三类仍 BLOCKED**。
- 🔴 **总门仍 NOT PASS**：修复只清测试设施/域级缺口，未解除 GUI BLOCKED，禁止开始下一功能/发布候选。

---

## 7. round3 复验结果（T-DEF-009 路径空格/tokenizer，独立测试专家执行）

### 安全与边缘审计（亲自读 `src/commands/backup.ts:44-45`）
- Tokenizer 为纯正则 `/\"[^\"]*\"|'[^']*'|\\S+/g` + 去首尾引号，**无 eval、无 shell/child_process**。
- 引号内空格可整体捕获（`"/path with space"` → 单 token）；`restore <path> confirm` 的 confirm 门控正确（非 confirm 只演练，L59）。
- **未闭合引号**：不静默吞——`"/path` 因缺右引号回退为 `\\S+` 逐空格切分 → filePath 截断 → `readBackupFile` 抛 ENOENT（安全失败、不串路径、不会误恢复）。属可接受的失败方式（错误信息非"未闭合引号"，为 S4 体验项，不阻塞）。
- `restore-content` 分支用独立 `JSON.parse` 处理 JSON 内容，与路径 tokenizer 不混淆。

### 独立执行（含空格隔离 TMPDIR）
- 用此前失败的含空格 workspace 路径（`Application Support/...`）跑 `node scripts/verify-backup.mjs` → **退出码 0**，输出"隔离目录+默认backups未变"。
- verify-backup 现已强制含空格 storage root（`data root with space`）+ 含空格 backup dir + 第71行引号包裹 restore 路径，真实覆盖 tokenizer。
- 跑后重算默认 `packages/backups/`：**81 文件**，清单 `49887565…`、内容 manifest `95ea5300…`，**与基线逐位一致**；真实 `data/pmtool/projects/p-0001.json` mtime 仍 2026-10-10。

### T-DEF-009 → ✅ 关闭（CLOSED）
含空格路径端到端可用、tokenizer 安全、默认目录不污染。待保留改动：`src/commands/backup.ts`（tokenizer）、`scripts/verify-backup.mjs`（空格目录+引号路径断言）。

### round3 总门
- 🔴 **仍 NOT PASS**：T-DEF-008/009、T-DEF-004 域级已关闭；但**网页实测/页面样式/用户体验三类仍 BLOCKED**，T-DEF-004 GUI 分项仍 BLOCKED。禁止开始下一功能/发布候选，待真实浏览器实测证据。

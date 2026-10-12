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

---

## 8. round3 复验续（T-DEF-010 DSH_PM_BACKUP_DIR 隔离，独立测试专家执行）

### 代码审计（b2c8da3，core/backup.ts:21-27）
- `resolveBackupDirectory(override?)`：`env = override ?? process.env.DSH_PM_BACKUP_DIR`；`env && env.trim()` → `resolve(env)`，否则回 `BUILTIN_DEFAULT`（仓库级 `packages/backups/`）。
- 未传 directory 时 `createBackup`/`applyBackup`/`restoreBackup` 均走 `resolveBackupDirectory()`（:83/:207），即读 env。
- web `restoreBackupFromContent(domain, json)`（commands/backup.ts:32）与 CLI `restore <path>`（:60）均未传 directory → 实际回落 env，符合设计。

### 独立 node 实测（编译后 lib，只读）
- 未设 / 空串 / 纯空白 → 均回退仓库 `packages/backups/`。
- 含空格绝对路径（`/tmp/pm backup dir x`）→ 原样解析，无截断、无 shell。
- 相对路径 → 按进程 cwd 解析（调用方须传绝对路径，否则易错落 cwd）。
- override 优先于 env。

### 共享目录无泄漏证据
- 验证运行后重算仓库 `packages/backups/`：**81 文件**；自 15:33 基线后 **0 文件新增/改动**（最新 mtime 15:22）。说明隔离实例安全快照未回写共享目录。
- 专家侧 createBackup 试探因手写 domain 缺 `.table()` 在写文件前抛错，未产生任何文件，无污染。

### T-DEF-010 → ✅ 关闭（域/隔离级别）
env 覆盖各分支行为正确，共享 backups 零泄漏。**保留**：core/backup.ts 支持 `DSH_PM_BACKUP_DIR`、commands/backup.ts 透传。**GUI 行为（真实 .pm-restore-btn confirm 的快照落点与落库）仍待主执行证据**，未出前网页实测类不转 PASS。

---

## 9. round3 真实 Chrome GUI 证据初审（b2c8da3，独立测试专家审原始证据）

证据目录：`docs/verification/gui-round3-20261012T161500Z/`（env: testedCommit=b2c8da3、dirtyProductFiles=false、token 已脱敏）。以下结论**由专家读 before/after json + console.log 得出**，非照抄主端 SUMMARY。

### 已核实 PASS（有原始 diff 支撑）
- 插件加载：初始 console error 为空。
- 项目记忆：刷新/重开仍回填。
- 甘特真实拖拽：`t-0001` startDate 10-01→10-02、dueDate 10-10→10-11（**恰 +1 天落盘**）。
- 行内编辑：`t-0002` status todo→done、progress 0→80、dueDate 10-19→10-20。
- 提醒直达 / 全局搜索里程碑直达：截图在。
- 副驾取消：`t-0001.json` 前后**字节一致（cmp IDENTICAL）**，未写。
- 副驾确认：assignee 甲→赵六、status in_progress→done 落盘。
- 副驾 fixture：非法删除/非法进度被拒（SUMMARY，console 干净）。
- CSV 上传确认：任务数 4→6（新增 t-0005/t-0006 父子）。
- 更多菜单：备份/从备份恢复/导出MD/导出JSON 在列。
- 备份隔离：共享 `packages/backups` 81→81 不变；隔离目录无写（因 R3-DEF-001 在写快照前即阻断）。

### 🔴 R3-DEF-001（P0 / FAIL）——网页恢复命令未被路由
- 复现：更多→从备份恢复→选合法 `valid-backup.json`。
- 实际：console `Uncaught (in promise) Error: 不支持的命令。`，后接完整 `/pm` 帮助文本；**未出现恢复预览/确认界面**。
- 预期：`restore-content` 应进演练预览，确认后才恢复并写安全快照。
- 副作用：恢复写未发生（隔离目录空、共享仍 81）——缺陷表现为"功能不可用"而非"误写"。
- 处置：交开发修命令路由；专家不自行改。

### 当前门禁（冻结，未终签）
- 已执行子集：上述 PASS 有原始证据；**S1-20 恢复确认 = FAIL（被 R3-DEF-001 阻断）**；恢复取消/坏文件 = NOT_RUN。
- 其余大量用例 = NOT_RUN（XLSX、MD/JSON 下载、AI 草稿编辑、七实体全 CRUD、键盘、空态、浅暗主题、390/桌面、焦点、正式3080 只读冒烟——3080 尚未升级到 b2c8da3）。
- **总门：NOT PASS，冻结。** 待 R3-DEF-001 修复复测 + 剩余用例补证据后，专家才对网页实测/页面样式/用户体验三类逐一定性。

---

## 10. round3 复测缺陷口径更正（648a7aa，独立测试专家）

### R3-DEF-001（恢复命令路由/演练）→ ✅ 演练阶段关闭（CLOSED-drill）
- 复测（648a7aa）：合法备份上传后**演练反馈正确出现**，"不支持的命令"消失，restore-content 路由已通。
- 但**网页无确认/取消按钮**，恢复未真正执行——此点转入 R3-DEF-003，R3-DEF-001 本身（路由错误）判关闭。

### R3-DEF-002 → 降为网络/会话瞬断观察项（非产品 FAIL）
- 依据只读 `lsof`：同 PID 3082 恢复后仍在监听、启动日志无崩溃；Browser reload 可恢复，console 转 `ERR_NETWORK_IO_SUSPENDED`（电脑休眠期网络）。
- 不计确定产品 FAIL；待稳定性复测确认是否复现，当前按观察项挂起。此前"服务退出 P0"表述作废。

### 🔴 R3-DEF-003（P0 / FAIL）——网页恢复缺少确认/取消界面
- 现象：演练成功但网页**无确认/取消按钮**，真实 DOM `confirms=[]`、`dialogs=0`，无法进入恢复。
- 根因（源码 panel.tsx）：file `onChange` 仅做 dry-run `setMessage`，**未存 content/preview，也无 confirm 的 execute 调用**。
- 处置：交开发在页面内补 `restorePreview` + 确认/取消；专家不自行改。

### 当前门禁
- **总门：NOT PASS，冻结。** 恢复 confirm 链路被 R3-DEF-003 阻断（S1-20 仍不可达）。
- 此前已核实 PASS 的子集（甘特拖拽/行内编辑/副驾取消字节一致/确认落盘/CSV/备份隔离 81 不变）结论不变。
- 解除条件：R3-DEF-003 补确认/取消后，端到端验证 演练→confirm→落盘+隔离安全快照 + 取消不写 + 坏文件拒绝；并补齐其余 NOT_RUN 用例。

---

## 11. round3 复测：R3-DEF-003 UI 可达部分修复 + 新增 R3-DEF-004（confirm 端崩溃）

### R3-DEF-003（网页恢复缺确认/取消）→ 部分修复（UI 可达）
- 复测：页面内确认/取消按钮已出现，**取消子用例 PASS**——真实点取消后 task 计数仍 6、隔离 backups 0、无写入。
- 但**完整 confirm 被 R3-DEF-004 阻断**，故 R3-DEF-003 不判关闭：UI 壳已通，端到端恢复未达成。

### 🔴 R3-DEF-004（P0 / FAIL）——合法备份 confirm 抛"格式不符"
- 现象：点确认后 console `Uncaught: 合法备份格式不符`；tasks 仍 6、隔离 backups 0、共享 81 不变（恢复未发生）。
- 根因（源码 commands/backup.ts restore-content confirm）：对 JSON 先 `JSON.parse`，再把结果传入 core 内部**二次 parse**——合法备份被误判格式不符；且前端错误未 catch。
- 附加要求：坏文件 dry-run 应**真实校验**且**无 confirm 不写**（待证据）。
- 处置：交开发修二次解析与错误兜底；专家不自行改。

### 当前门禁
- **总门：FAIL / 冻结。** confirm 链路被 R3-DEF-004 阻断（S1-20 confirm 仍不可达）。
- 已核实 PASS：取消子用例（task 6/backups 0 不写）+ 此前甘特/行内/副驾/CSV/备份隔离子集。
- 解除条件：R3-DEF-004 修复后端到端 演练→confirm→落盘+隔离安全快照；坏文件 dry-run 真校验无 confirm；其余 NOT_RUN 用例补齐。

---

## 12. round3 新增观察 R3-DEF-005（BLOCKED/待定，先区分配置漂移）

### 🔍 R3-DEF-005（P0 观察，暂不定性）
- 现象：`dadff0a` 修复实例 PM 面板显示"暂无项目"；但隔离磁盘仍 projects 2 / tasks 6 / 其它实体各 1、backups 0、共享 `packages/backups` 81（**数据未被删**）。
- 对照：同一批数据在 `b6db502` UI 可见；`dadff0a` 重启后疑似内存/配置未加载到磁盘对应 storage root。
- 处置：执行端已停操作；开发**只读诊断**实际 storage root / domain 计数。**在确认不是测试配置漂移（DSH_HOME/storage 指向错位）前，不归因产品缺陷**。
- 状态：BLOCKED / 待诊断。若证实 storage root 指向正确但 UI 空，再升产品 FAIL；若为隔离配置漂移，则关闭、补正确 fixture 路径重测。

### 其它状态（不变）
- R3-DEF-004（confirm 二次 parse 崩溃）：**确认链路尚未复测**，仍 OPEN。
- R3-DEF-003：UI 可达、取消子用例 PASS；完整 confirm 待 R3-DEF-004/005 澄清。
- R3-DEF-002：休眠网络观察项；R3-DEF-001：演练关闭。

### 门禁
- **总门：FAIL / 冻结。** 恢复 confirm 未端到端达成 + R3-DEF-005 待诊断 + 大量用例 NOT_RUN。

---

## 13. round3 缺陷口径更正：R3-DEF-004 误报 → 测试设施 R3-TDEF-001

### R3-DEF-004（confirm"格式不符"）→ 撤销产品 FAIL 定性
- 真相：执行端用的 valid-backup 夹具本身是**旧 schema**（`format=pm-backup`/`version`），而当前产品为 `pm-tool-backup`/`formatVersion`。
- `dadff0a` 的 dry-run 已**真实预检并正确拒绝**该旧夹具；早期"演练没校验"才误把旧文件当合法，进而 confirm 被拒。
- 故此前"二次 parse 崩溃"不成立——恢复为正常校验行为。R3-DEF-004 **仍 OPEN**，但转为"待合法 schema 备份文件证据"，非确定产品 bug。

### R3-TDEF-001（测试设施缺陷）——夹具 schema 过期
- 执行端需改用**产品备份按钮生成的合法备份**再复测 confirm；不得再用旧 schema 夹具。
- 坏文件 dry-run 真校验（合法 schema 缺失即拒、无 confirm 不写）：**视为 PASS**。

### 当前状态
- 恢复 confirm 链路：仍待"合法备份按钮生成 + 端到端 confirm→落盘+隔离安全快照"证据。
- R3-DEF-005：仍 BLOCKED 待 3083 同 root 对照。
- 其余结论不变。**总门：FAIL / 冻结**（confirm 未端到端达成 + 大量用例 NOT_RUN）。

---

## 14. round3 复测：R3-DEF-005 关闭 + 新增 R3-DEF-006（web 备份错落目录）

### R3-DEF-005（UI"暂无项目"）→ ✅ 关闭（测试侧，非产品 FAIL）
- 对照：同 root 全新 3083 进程真实 UI 读出 p-0001/p-0002、tasks 6。
- 结论：旧 3082 为实例状态异常（域未重载），产品数据加载无缺陷。判定测试侧，不计产品 FAIL；错落/旧实例状态数据由测试侧清理，专家不删。

### 🔴 R3-DEF-006（P0 / FAIL）——Web 备份落点覆盖隔离 env
- 现象：Web 点备份成功，但文件落在 `deepseek-harness/backup/...`，env 隔离目录（DSH_PM_BACKUP_DIR）为空。
- 根因：router 给 handler 传 `backup`，handler 把 `tokens[0]`（即命令词 `backup`）误当 directory，导致**无参 web 备份覆盖了 DSH_PM_BACKUP_DIR**，未走隔离目录。
- 处置：交开发修参数解析（命令词不得当作 directory）；错落文件暂保留待开发处理。
- 影响：隔离备份目录为空 → 后续 confirm 用合法备份亦受影响，需先修 R3-DEF-006 再续。

### 当前状态
- confirm 链路：TDEF-001 旧夹具仍不合法；将等 R3-DEF-006 修好后用**产品生成的合法备份**继续端到端。
- R3-DEF-004 已降为"待合法文件证据"（非产品 bug）。
- **总门：FAIL / 冻结。** web 备份隔离被破坏（R3-DEF-006）+ confirm 未端到端 + 大量用例 NOT_RUN。

---

## 15. round3 复测：R3-DEF-004 根因更正 + R3-DEF-006 修复验证

### R3-DEF-006（web 备份错落目录）→ ✅ 路径修复已验证
- 3084 实例用产品备份按钮生成的**合法 backup 已正确落隔离目录**（DSH_PM_BACKUP_DIR）。参数解析（命令词不得当 directory）修复生效。

### R3-DEF-004（restore confirm）→ 仍 OPEN，根因更正为外层/内层编码混淆
- 新证据：**用产品生成的合法 backup** 仍被 dry-run 拒绝 → 确认为**产品命令编码 bug**（非测试夹具）。
- 根因更正：panel 端 `JSON.stringify(content)` 传的是 **JSON 字符串字面量**；handler 需先**解外层**得到 raw backup text，再 parse 成对象。开发此前"少 parse"的方向反了（应统一 decoder）。
- 要求：统一 decoder，并用**真实 panel 编码**回归测试，不得只在命令行直传对象测。

### R3-TDEF-001（测试设施）→ 仍成立
- 旧夹具 schema 过期问题依旧；但本轮已改用产品合法 backup，DEF-004 由该合法证据证明为真实产品 bug。

### 门禁
- **总门：FAIL / 冻结。** confirm 链路（R3-DEF-004 外层/内层编码）未通；R3-DEF-006 已修。恢复完整端到端（演练→confirm→落盘+隔离安全快照）仍待 decoder 修复证据；其余大量用例 NOT_RUN。

---

## 16. round3 恢复完整链端到端证据（3085，独立测试专家审原始证据）

证据：`docs/verification/gui-round3-20261012T161500Z/` 内 s1-20 before/after + 截图。专家逐项核原始 json，非照抄 SUMMARY。

### 独立核验结果（原始 diff）
- 漂移：`before/s1-20-drift-t-0003.json` progress=55。
- 恢复后：`after/s1-20-restored-t-0003.json` progress=**0**（回滚到恢复前）；task 数 6 不变。
- `after/s1-20-restore-result.json`：t3Progress=0；隔离 backups **3 个**（2→3，新增安全快照 `...13-06-36-202Z`）；sharedCount=**81**。
- `after/s1-20-shared-backup-count.txt`=81。
- 链：网页产品备份（落隔离目录）→ 上传演练 → 页面确认 → 成功提示 console 0 → 磁盘回 0 → 隔离目录新增安全快照 → 共享 `packages/backups` 不变。

### 缺陷判定更新
- **R3-DEF-003（网页恢复确认/取消）→ ✅ 关闭**：取消子用例此前已 PASS（task 6/隔离 0 不写）；本轮 confirm 端到端成功，UI 两步恢复闭环达成。
- **R3-DEF-004（外层/内层编码混淆）→ ✅ 关闭**：产品合法 backup 经演练+confirm 被正确解包落库，统一 decoder 生效。
- **R3-DEF-006（web 备份落隔离目录）→ ✅ 关闭**：3084/3085 产品备份落隔离 DSH_PM_BACKUP_DIR，未再覆盖 env。
- **R3-DEF-005**：已关闭（测试侧，3083 对照读出 2 项目/6 任务）。
- **R3-TDEF-001（测试设施）→ 仍 OPEN（不阻塞）**：夹具须改由产品 createBackup 生成；旧手写 schema 弃用。待开发/执行端更新 fixture 模板。

### 当前门禁
- **总门：仍 NOT PASS（不终签）**。恢复完整链已 PASS，但以下仍 NOT_RUN：XLSX、MD/JSON 下载、AI 草稿编辑、七实体全 CRUD、键盘树、空态、浅暗主题、390/桌面、焦点、正式3080只读冒烟（3080 尚未升级到被测提交）。网页实测类"恢复链"单项 PASS，不等于整类 PASS。

---

## 17. round3 增补证据：XLSX / 空态 / 深色主题（独立测试专家审原始证据）

### 独立核验
- **S1-17 XLSX 导入 → PASS**：`after/s1-17-xlsx-import.json` 显示 t-0007（根，WBS "6"）、t-0008（parent=t-0007，WBS "6.1"）父子落盘；console 0。
- **S1-22 空项目空态 → PASS**：截图显示"暂无任务记录" + "用 AI 一键生成 WBS" CTA，表头/计数/j·k 提示均在，无白屏/无报错。
- **S1-26 深色主题（606px）→ PASS（部分）**：深色调色板生效、中文文案/表格可读、根无横向溢出。**390px 窄屏仍未测**。
- 观察项（S4，不阻塞）：深色模式下"用 AI 一键生成 WBS"按钮文字对比偏低（深底深字），建议开发后续微调，但不影响本轮判定。

### 用例状态汇总（round3 已执行子集）
- PASS：插件加载/项目记忆/作战室/甘特拖拽+1天/提醒直达/搜索里程碑直达/行内编辑/副驾取消字节一致+确认落盘+拒绝非法/CSV 父子/XLSX 父子/更多菜单/备份隔离/恢复完整链（演练→confirm→回滚+隔离安全快照）/空态/深色主题606。
- 观察项：R3-OBS-001 网络瞬断（非产品）；深色 CTA 对比（S4）。

### 仍 NOT_RUN（不终签）
- MD/JSON 下载、AI 旧三模式（WBS/汇报/纪要草稿编辑）、七实体全 CRUD、键盘树 j/k/勾选/Del、390 窄屏、桌面宽屏完整遍历、焦点陷阱、正式3080只读冒烟（3080 未升级被测提交）。

### 门禁
- **总门：仍 NOT PASS / 不终签。** 已执行子集证据充分且大部分 PASS，但网页实测/页面样式/用户体验三类均存在 NOT_RUN 项，未达整类通过门槛。

---

## 18. round3 增补：MD/JSON 下载、390 状态、深色对比登记

### S1-18 导出下载 → PASS（专家 Read 原始文件）
- `after/s1-18-export.md`：标题"夹具项目（p-0001）"、## 任务 列 8 条（含负责人/进度/截止），中文渲染正常。
- `after/s1-18-export.json`：含 **七实体键** projects/tasks/milestones/riskIssues/meetings/reports/deliverables；**tasks=8**（t-0001~t-0008）；**无 checks 键**；console 0。MD/JSON Blob 下载均 completed。

### 390 窄屏 → NOT_RUN（非产品）
- CDP attempt 因 Browser Use session id 失效未执行；归执行环境，不判产品。待复测。

### 深色 CTA 对比 → 登记待修（不自动豁免）
- 现象：深色模式下"用 AI 一键生成 WBS"按钮文字对比偏低（深底深字）。
- 按长期质量门规则：**不写"不阻塞"自动豁免**，严重度不豁免。登记为视觉待修项，待视觉对比度标准量测（WCAG 对比比）后定级；在量测与修复前保留为开放项。

### 仍 NOT_RUN（不终签）
- 390 窄屏、桌面宽屏完整遍历、七实体全 CRUD、键盘树 j/k/勾选/Del、AI 旧三模式草稿编辑、焦点陷阱、正式3080只读冒烟。

### 门禁
- **总门：仍 NOT PASS。** S1-18 PASS；但存在 NOT_RUN 项 + 深色对比待修项，未达整类通过门槛。

---

## 19. round3 增补：任务树折叠 / 复选批量（专家审截图）

### S1-06 任务树 → PASS（折叠）
- 截图 s1-06：WBS 5"一级任务"为折叠态（▶），其子"二级子任务(5.1)"**不可见**；WBS 6"xlsx一级"为展开态（▼），子"xlsx二级(6.1)"可见。父折叠隐藏子行行为正确。
- 复选框：行1"逾期任务"真实勾选（蓝勾），按执行端报告批量工具栏出现、console 0（截图为勾选态，批量条为瞬态，专家采信执行端报告）。

### 键盘子用例 → 仅部分，不冒充 PASS
- 执行端诚实声明：j/k 移动、Del 删除、Enter 打开**未充分实测**；当前仅证 checkbox 勾选 + 批量条（经点击+Space）。
- 故键盘树（j/k 焦点移动/Del/Enter）保持 **NOT_RUN/部分**，不计 PASS，待键盘路径专项证据。

### 仍 NOT_RUN
- 键盘树 j/k/Del/Enter 全量、390 窄屏、桌面宽屏遍历、七实体全 CRUD、AI 旧三模式草稿编辑、焦点陷阱、正式3080只读冒烟。

### 门禁
- **总门：仍 NOT PASS。** 树折叠/勾选 PASS，但键盘等仍 NOT_RUN + 深色对比待修，未达整类通过门槛。

---

## 20. round3 增补：WBS PoC 草稿编辑确认（专家审 after json）

### S1-15 WBS 模式 → PASS
- before task count=8；after/s1-15-wbs-tasks.json 列出 9 条新任务（t-0009~t-0017），tasks 8→**17**。
- 根任务：t-0009"阶段一：计划准备" code=7；t-0013"阶段二：执行收尾" code=8。
- 7.x：7.1 编写测试计划 / 7.2 搭建测试环境 / 7.3 准备测试数据；8.x：8.1/8.2/8.3。
- **手工编辑落盘**：t-0017"【手工编辑】验收归档" parentId=t-0013、code=8.4——证明 textarea 可编辑并随确认入库，非仅原始草稿。
- console 0。

### AI 三模式状态
- WBS：PASS。
- 进度汇报叙述 / 会议纪要草稿编辑：**仍 NOT_RUN**。

### 仍 NOT_RUN
- 汇报/纪要两 AI 模式、键盘树 j/k/Del/Enter 全量、390 窄屏、桌面宽屏遍历、七实体全 CRUD、焦点陷阱、正式3080只读冒烟。深色 CTA 对比待修项开放。

### 门禁
- **总门：仍 NOT PASS。** WBS 模式 PASS，但汇报/纪要两模式与多项仍 NOT_RUN + 深色对比待修，未达整类通过门槛。

---

## 21. round3 增补：AI 汇报/纪要两模式（专家审 after json）

### S1-15 进度汇报叙述 → PASS（编辑保留）
- reports 1→2：rpt-0002 新生成，executiveSummary 末尾**保留手工编辑**"【手工编辑】本周结论已复核。"；snapshot tasks=17 与当前一致；console 0。

### S1-15 会议纪要 → 结构化确认 PASS，但自由文本编辑未落盘
- meetings 1→2：mtg-0002 结构化字段正确——标题"测试发布会议"、date 2026-10-12、topics[测试发布,回归测试]、decisions[本周完成回归测试]、actions 张三(10-15)/李四(10-16)。
- **缺陷**：草稿中自由追加的 `【手工编辑】纪要已核对` **未出现在 summary/任何字段**——生成后结构化确认忽略了 raw 自由文本追加。

### 🔴 R3-DEF-007（P1/产品缺陷）——会议纪要草稿自由编辑不保留
- 现象：纪要草稿 textarea 自由追加文本，结构化确认入库后丢失（对比汇报模式同操作保留）。
- 根因方向：纪要走结构化字段确认，未把 textarea 自由追加合并进 summary。
- 处置：交开发修；专家不自行改。汇报模式编辑保留不受影响。

### AI 三模式汇总
- WBS：PASS；汇报叙述：PASS（编辑保留）；会议纪要：结构化 PASS，**自由编辑保留 FAIL（R3-DEF-007）**。

### 仍 NOT_RUN
- 键盘树 j/k/Del/Enter 全量、390 窄屏、桌面宽屏遍历、七实体全 CRUD、焦点陷阱、正式3080只读冒烟。开放项：R3-DEF-007、深色 CTA 对比待修。

### 门禁
- **总门：仍 NOT PASS。** 新增产品缺陷 R3-DEF-007 + 多项 NOT_RUN + 深色对比待修。

---

## 22. round3 增补：键盘专项事实 + R3-TDEF-001 设施关闭

### 键盘子用例 → 部分证据，整体仍 NOT_RUN
- **已证**：真实 Chrome 首行按 j + Enter 打开第二行"临期任务"抽屉 → **j 移动 + Enter 打开**成立。
- **未证（不判 PASS）**：k 反向移动、Escape 关闭、Space 勾选——受抽屉焦点与 bu 按键映射干扰，无权威证据。
- Delete 无选中时无 dialog、无副作用（安全），但删除流未端到端证。
- 结论：键盘树仅 j/Enter 单项 PASS，其余 NOT_RUN，不计键盘整项通过。

### R3-TDEF-001（测试设施）→ ✅ 关闭
- 脚本 `scripts/gen-valid-backup-fixture.mjs`：建隔离 tmp storage + 真实 DomainFacility + 产品 `apply(ctx)`，经 `project add`/`task add`/`backup "<out>"` 用**产品 createBackup 当前 schema** 生成 fixture，弃手写旧格式。符合"由产品生成合法夹具"要求。
- 小隐患（待开发清理，不阻塞设施关闭）：脚本第 3 行 `export NVM_DIR=...; . nvm.sh` 是 shell 源码，误入 .mjs 文件会致 SyntaxError；建议移除或改为外部包装脚本后再执行。设计意图正确。

### 仍 NOT_RUN
- k/Escape/Space/Delete 键盘全量、390 窄屏、桌面宽屏遍历、七实体全 CRUD、焦点陷阱、正式3080只读冒烟。开放项：R3-DEF-007、深色 CTA 对比待修、fixture 脚本第3行 shell 行待清理。

### 门禁
- **总门：仍 NOT PASS。** 键盘仅单项 + 多项 NOT_RUN + R3-DEF-007 + 深色对比待修。

---

## 23. 吸收 PM 只读判定：对比度验收 + CRUD 分层用例（最终化）

### 深色空态 AI CTA → 判不通过（S2），不自动豁免
- 结论：深色模式"用 AI 一键生成 WBS"按钮文字对比不足，**判不通过（建议严重度 S2）**；撤销此前"不阻塞"措辞。
- 验收口径（须全达成才算该观察项关闭）：
  - 非文本可视组件（按钮边框/图标）对比 ≥ 3:1；
  - 文字与图标文字 ≥ 4.5:1；
  - 亮、暗主题各出 1 张截图，console 0；
  - 需用量测（对比度计算）证据，非目测放行。
- 在达标前保留为开放 FAIL 项，参与整类门禁。

### CRUD 分层最终用例（每实体至少"新建 + 删除"底线不降）
- **projects**：GUI 全 CRUD + 删除保护（关联数据拦截/确认）。
- **milestones**：GUI 全 CRUD + 特有逻辑（达成状态/日期）。
- **risk_issues**：GUI 完整增/改/删 + 特有逻辑（概率×影响矩阵归格、状态闭环）。
- **meetings**：GUI 完整增/改/删 + 特有逻辑（topics/decisions/actions 结构化）。
- **deliverables**：GUI 全 CRUD + 版本历史。
- **tasks**：补充 新建 + 删除/级联（父删子处理）。
- **reports**：渲染 / 编辑 / 删除（含 snapshot 只读）。
- 底线：任一实体缺"新建落盘 + 删除落盘"证据，该实体不计通过；不整体降为只测 tasks。

### 门禁影响
- **总门：仍 NOT PASS。** 深色 CTA 已计为开放 FAIL（S2），CRUD 分层用例尚未逐实体执行，均未达标。

---

## 24. R3-DEF-007 复测（3086，专家审 after json）

### R3-DEF-007（纪要草稿自由编辑不保留）→ ✅ 写入保留闭环
- after/r3-def007-meeting.json mtg-0003：`notes` 字段完整保留 **生成草稿全文 + 手工编辑"【手工编辑】纪要二次验收保留。"**；结构化字段 title"二次复验会议纪要"、date 2026-10-12、summary、topics[二次复验]、decisions[验证编辑保留]、action 王五截止 2026-10-18 均正确。
- meetings 2→3，console 0。
- 待补：服务**重启后读回**该 notes 仍在（持久化二次确认），随后正式关闭。当前判"写入已保留"，缺陷实质解除。

### 开放项 / 仍 NOT_RUN
- 深色空态 CTA 对比（S2，待量测）、重启读回验证。
- k/Escape/Space/Delete 键盘全量、390、桌面宽屏、逐实体 CRUD（projects/milestones/risk/meetings/deliverables/tasks 级联/reports）、焦点、正式3080只读冒烟。

### 门禁
- **总门：仍 NOT PASS。** R3-DEF-007 写入闭环，但对比 S2 + 大量 NOT_RUN 未达整类门槛。

---

## 25. R3-DEF-007 重启读回：持久化底层 PASS，但用户可见读回 FAIL（不能正式关闭）

### 复测事实（3088 同 root）
- 列表读回：mtg-0003 在列（共 3 份），summary/actions 正确；磁盘 `notes` 字段存在（含手工编辑 marker）。
- 缺陷：打开会议详情/编辑抽屉**完全不显示 notes 及手工编辑 marker**（panel.tsx 无 notes 引用）。

### 判定
- 底层持久化（磁盘写+重启读）：PASS。
- 用户可见读回 + 可再编辑：**FAIL**——R3-DEF-007 **不正式关闭**。
- 缺口（疑子缺陷）：会议详情/编辑抽屉必须把 `notes` 渲染为可见字段且可再编辑；当前仅写入侧保留，读取侧 UI 无绑定。交开发。

### 另：console 出现 1 条 404
- 需先辨识资源路径（疑 favicon/静态资源）再判定：若 favicon 类无业务影响仅记观察；若为插件关键资源 404 则升级。待证据提供该 404 URL。

### 门禁
- **总门：仍 NOT PASS。** R3-DEF-007 维持 OPEN（读取侧 UI 缺口）+ 对比 S2 + 404 待辨识 + 大量 NOT_RUN。

---

## 26. console 404 辨识结论

- 唯一 404：`GET http://127.0.0.1:3088/favicon.ico` net::ERR_ABORTED。
- 紧随其后 favicon-dark.svg / favicon.svg 均 200；pm-tool 插件 bundle / API 全部正常。
- 判定：**静态 favicon 观察项**（非插件核心资源），不计产品核心 FAIL；仅记录，不阻塞门禁（但深色 CTA 对比 S2 仍开放）。

### 门禁
- **总门：仍 NOT PASS。** R3-DEF-007 读取侧 UI 缺口 OPEN + 对比 S2 + 逐实体 CRUD/390/键盘/正式3080 等 NOT_RUN。

---

## 27. 深色 CTA 对比复测（4f42a3f / 3087）→ 仍 FAIL，保持开放

- 复测事实：文字清晰、文字/底对比约 9.84；但组件 computed background **透明**，组件/父背景 1:1；CSS 引用未定义变量 `--pm-accent` 等，`.dark` 选择器疑似未命中。
- 判定：**未达"非文本组件 ≥3:1"**（按钮本体无填充色，视觉上与背景无区分）。文字对比度虽高，但组件对比不达标 → 仍 FAIL。
- 证据状态：复测截图临时已见，待开发下一修复后正式保存对比度量测证据。
- 该项保持开放（S2），参与门禁。

### 门禁
- **总门：仍 NOT PASS。** CTA 组件对比 FAIL + R3-DEF-007 读取侧 UI 缺口 OPEN + 逐实体 CRUD/390/键盘/正式3080 等 NOT_RUN。

---

## 28. R3-DEF-007 关闭 + CTA 双主题复测（340bffb / 3089，专家看图判定）

### R3-DEF-007（会议 notes 读取侧 UI）→ ✅ 关闭
- 会议编辑抽屉新增 notes 字段；重启后 notes 完整显示手工 marker，可再编辑，console 0。
- 写入保留 + 磁盘持久化 + UI 可见可编辑三段全达成。

### 深色 CTA → PASS
- 截图 r3-cta-dark-fixed-3089.png：白底圆角按钮 + 黑字"用 AI 一键生成 WBS"，在深底上边界清晰；组件对比与文字对比均远超阈值。

### 浅色 CTA → 仍要求补强（组件对比不达标）
- 截图 r3-cta-light-fixed-3089.png：CTA 为浅灰 pill 落白底，**组件边界过淡**；文字对比约 18（OK），但**非文本组件与页面有效背景对比目测 <3:1**（执行端 20.1 系把透明 parent 当黑算，不适用浅色）。
- 处置：要求浅色模式 CTA 给出可见边框/更强填充（或 accent），使组件与白底 ≥3:1；当前不关闭该项。

### 门禁
- **总门：仍 NOT PASS。** R3-DEF-007 已关闭，但浅色 CTA 组件对比补强 + 逐实体 CRUD/390/键盘/正式3080 等 NOT_RUN。

---

## 29. CTA 亮色精确量测（340bffb）→ 维持 FAIL

- 量测：CTA bg `rgb(249,250,251)` vs 最近有效祖先 `pm-shell` `rgb(255,255,255)` → **组件对比 1.045:1**（远低于非文本组件 ≥3:1）；文字对比 18.08（OK）。
- 判定：340bffb 深色已修好，但**亮色未达标准（回归）**。CTA 门仍 FAIL，要求亮色 CTA 加可见边框/更强填充至组件 ≥3:1。

### 门禁
- **总门：仍 NOT PASS。** CTA 亮色组件对比 FAIL（深色 PASS）+ 逐实体 CRUD/390/键盘/正式3080 等 NOT_RUN。

---

## 30. CTA 双主题量测（27f1eca / 3090）→ 浅色仍 FAIL（文字 <4.5）

- 浅色：CTA bg `rgb(65,118,230)` vs 白底 → 组件对比 4.235（≥3 达标）；**白字对比 4.235 < 文字阈值 4.5**（仅差 0.265）。截图 r3-cta-light-3090.png 按钮可见，但按既定文字 ≥4.5 标准**不关闭**。
- 深色：bg `rgb(122,170,255)` vs `rgb(35,35,36)` → 组件 6.746、文字 `rgb(15,17,21)` 对比 8.118，PASS。
- 处置：浅色 CTA 需加深按钮底色或改深色文字，使文字对比 ≥4.5；组件 ≥3 已满足。

### 门禁
- **总门：仍 NOT PASS。** CTA 浅色文字对比 FAIL（深色 PASS）+ 逐实体 CRUD/390/键盘/正式3080 等 NOT_RUN。

---

## 31. CTA 证据纠正（3091 / 1a35927）→ 亮暗均回退待复测

- 纠正：3091 所谓"浅色"量测截图**实为深色背景**；`1a35927` 近白文字对蓝底对比仅 **2.227**——不可当浅色证据，且构成深色回归。
- 处置：此前 3090 深色 PASS（6.746/8.118）与浅色 4.235 的结论因环境未确认真浅色而**证据不可靠，亮暗两侧全部回退为待复测**。
- 复测要求：确认真浅色页面（白底）与真深色各取 1 张，量测 **文字≥4.5、组件≥3**；未达标前 CTA 门保持 FAIL/OPEN。

### 门禁
- **总门：NOT PASS。** CTA 亮/暗均待真环境复测 + 逐实体 CRUD/390/键盘/正式3080 等 NOT_RUN。

---

## 32. 执行设施 BLOCKED（3091 沙箱 Chrome 不可达）

- 现象：沙箱启动的 3091 真实 Chrome 数秒后 `mux connection refused`；任务显示 running 但跨沙箱不可达。已停我方 background task 防空跑。
- 定性：**执行设施 BLOCKED，非产品 FAIL**。CTA 亮/暗真环境复测、逐实体 CRUD、键盘全量、390、桌面宽屏、正式3080 冒烟等 GUI 项本阶段一律记 BLOCKED（执行侧），不计产品缺陷。
- 解锁方式：由 MainAgent 在**本机 Terminal 前台**运行 `.tmp/e2e-3082/start-3091.sh`，再由现有唯一 Chrome 标签继续采证。

### 门禁（本阶段）
- **总门：NOT PASS**（含执行设施 BLOCKED 项）。产品侧已通过结论不变，不因设施 BLOCKED 降为产品 FAIL，也不据此放行。待前台 Chrome 恢复后续测。

---

## 33. CTA 最终关闭 + 执行设施解除（a58ef72 / 前台 Chrome）

### CTA（深色空态 AI 按钮）→ ✅ 关闭
- 执行设施已解除（本机 Terminal 前台长驻 + 正确 token）。
- 深色：body `(21,21,23)`/祖先 `(35,35,36)`，按钮 `(249,250,251)`、字 `(15,17,21)` → 组件 15.026、文字 18.082。
- 浅色：body/祖先 `(255,255,255)`，按钮 `(15,17,21)`、白字 → 组件/文字 18.896。
- 截图 r3-cta-dark-a58ef72.png / r3-cta-light-final-a58ef72.png 专家亲验为真双主题，console 0。均达文字≥4.5、组件≥3。
- §32 执行设施 BLOCKED 解除（设施已恢复，剩余 GUI 可继续采证）。

### 仍待执行（NOT_RUN）
- 逐实体 GUI 全 CRUD、键盘全量、390、桌面宽屏/焦点、正式3080只读冒烟。

### 门禁
- **总门：仍 NOT PASS**（CTA 已关闭，但逐实体 CRUD 等仍 NOT_RUN）。

---

## 34. 逐实体 CRUD：projects → ✅ PASS

- GUI 新建 p-0003"R3 CRUD临时项目"→ 编辑名称 toast 已更新 → 删除 confirm 后 select 仅剩 p-0001/p-0002、toast 已删除。
- after/crud-project-p0003-deleted.txt：`created p-0003; edited name; deleted; file_absent=true; console_errors=0`（p-0003.json 磁盘不存在）。
- projects 新建/编辑/删除三段均有落盘证据 → PASS。删除保护待后续带关联数据用例单独验。

### 仍 NOT_RUN
- milestones / risk_issues / meetings / deliverables / tasks(新建+删除级联) / reports 的 GUI CRUD；键盘全量；390；桌面宽屏/焦点；正式3080只读冒烟。

### 门禁
- **总门：仍 NOT PASS。** 仅 projects CRUD 达，其余实体未逐一审。

---

## 35. 逐实体 CRUD：milestones → CRUD PASS，特有逻辑(达成切换)待补

- after/crud-milestone-m0002-deleted.txt：`created m-0002; edited; deleted; file_absent=true; console_errors=0`。
- 新建/改名/删除三段落盘证据成立 → CRUD PASS。
- **特有逻辑待补**：达成状态切换（m-0001 达成按钮存在，但本临时项未实测 toggle 落盘）；按 §23 口径，milestone 还需一条"点达成→磁盘 status/日期更新→可撤销"证据才算整项通过。

### 仍 NOT_RUN
- milestones 达成切换；risk_issues / meetings / deliverables / tasks / reports GUI CRUD；键盘全量；390；桌面宽屏/焦点；正式3080只读冒烟。

### 门禁
- **总门：仍 NOT PASS。**

---

## 36. 逐实体 CRUD：risk_issues → PASS

- after/crud-risk-ri0002-deleted.txt：`created ri-0002 high/high; edited title; status closed; deleted; file_absent=true; console_errors=0`。
- 新建（概率/影响 high/high）→ 改名 → status closed（闭环）→ 删除，磁盘仅 ri-0001、ri-0002 absent。
- CRUD + 闭环状态特有逻辑 PASS。矩阵格位视觉归格另已由作战室 [data-risk-cell] 证据佐证。

### 仍 NOT_RUN
- milestones 达成切换；meetings / deliverables / tasks / reports GUI CRUD；键盘全量；390；桌面宽屏/焦点；正式3080只读冒烟。

### 门禁
- **总门：仍 NOT PASS。**

---

## 37. milestones 特有逻辑（达成切换）→ 整项 PASS

- before/milestone-toggle-m0001.json：status=`planned`、achievedDate=null。
- after：真实 Chrome 点"标记达成"toast 保存、按钮 disabled；磁盘 status=`achieved`、achievedDate=`2026-10-12`、updatedAt 更新，console 0。
- 达成状态切换+日期落盘证据成立。milestones CRUD（§35）+ 达成切换（本节）全达成 → **milestone 整项 PASS**。
- 备注：撤销/回退未单独实测，可选补；不影响当前达成切换成立。

### 仍 NOT_RUN
- meetings / deliverables / tasks(新建+删除级联) / reports GUI CRUD；键盘全量；390；桌面宽屏/焦点；正式3080只读冒烟。

### 门禁
- **总门：仍 NOT PASS。**

---

## 38. 逐实体 CRUD：deliverables → PASS

- after/crud-deliverable-dlv0002-deleted.txt：`created dlv-0002 v1.0; edited v1.1 with change note; deleted; file_absent=true; console_errors=0`。
- 新建 v1.0 → 编辑升 v1.1 带变更注"版本升级"保存（版本历史）→ 删除 confirm，磁盘 absent、console 0。
- CRUD + 版本历史特有逻辑 PASS。

### 仍 NOT_RUN
- meetings GUI CRUD（结构化增改删）；tasks 新建+删除级联；reports 渲染/编辑/删除；键盘全量；390；桌面宽屏/焦点；正式3080只读冒烟。

### 门禁
- **总门：仍 NOT PASS。**

---

## 39. 🔴 R3-DEF-008（P1/产品缺陷）——meeting 编辑保存被白名单拒绝

- 现象：meetings GUI 新建 mtg-0004 成功（结构化字段 + notes）；但编辑名称/status 后点保存 → toast `会议参数不正确：包含不支持的字段；项目、行动项集合、来源、ID 和时间戳须使用专用命令或由系统维护。`，抽屉不关闭，磁盘仍旧标题/状态。console 0。
- 推测根因：MeetingForm payload 把 notes 或系统字段一并送入 meeting update，被字段白名单拒绝。
- 影响：meeting 编辑流程不可用；meeting CRUD **冻结**（新建已证，编辑 FAIL）。
- 处置：交开发修；**保留 mtg-0004 不删**待复测。专家不改代码。

### 门禁
- **总门：仍 NOT PASS（且新增 P1 FAIL）。** meeting CRUD 因 R3-DEF-008 不可判定通过；其余 tasks/reports CRUD、键盘全量、390、桌面宽屏/焦点、正式3080 冒烟仍 NOT_RUN。

---

## 40. 逐实体 CRUD：tasks（新建 + 删除级联）→ PASS

- after/crud-task-cascade-t0018-t0019.txt：`created parent t-0018 code9 and child t-0019; GUI delete parent confirm reported 1 child; deleted 2; both absent; console_errors=0`。
- 新建父子（child parent=t-0018）→ 删父 confirm 明确"含1子任务/删除全部/旁支不受影响"→ toast 已级联删 2，两 json 磁盘 absent、console 0。
- tasks 新建 + 删除级联特有逻辑 PASS。

### 仍 NOT_RUN
- reports 渲染/编辑/删除；meeting CRUD（被 R3-DEF-008 冻结）；键盘全量；390；桌面宽屏/焦点；正式3080只读冒烟。

### 门禁
- **总门：仍 NOT PASS（R3-DEF-008 P1 未修）。**

---

## 41. 逐实体 CRUD：reports → PASS

- after/crud-report-rpt0003-deleted.txt：`created rpt-0003 snapshot; edited title and executiveSummary; delete confirmed; file_absent=true; console_errors=0`。
- 生成固定快照 rpt-0003 → 编辑 title/executiveSummary → 删除 confirm，磁盘仅 rpt-0001/2、rpt-0003 absent、console 0。
- reports 渲染快照/编辑/删除 PASS（snapshot 只读性由快照字段固定佐证）。

### 逐实体 CRUD 汇总
- projects ✅、milestones ✅（含达成切换）、risk_issues ✅（含闭环）、deliverables ✅（含版本）、tasks ✅（含级联）、reports ✅。
- meetings ❌：新建已证，**编辑被 R3-DEF-008 P1 冻结**。

### 仍 NOT_RUN
- R3-DEF-008 修复复测；键盘 k/Escape/Space/Del 全量；390；桌面宽屏/焦点；正式3080只读冒烟。

### 门禁
- **总门：仍 NOT PASS（R3-DEF-008 P1 未修 + 多项 NOT_RUN）。**

---

## 42. 🟠 R3-DEF-009（P2/产品缺陷）——抽屉打开时快捷键越界 + Escape 不关闭

- 现象：任务列表 j+Enter 打开任务抽屉；抽屉打开时真实按 **Escape 不关闭**，随后按 **k 被写进聚焦的标题 input**（屏幕标题变"逾期任务k"）。焦点/快捷键边界不符合预期。
- 无污染：用关闭按钮丢弃，磁盘 t-0001 title 仍"逾期任务"，console 0。
- 根因方向：抽屉打开时未将列表快捷键（j/k/Space/Del）切走，Escape 关闭未绑定。
- 处置：键盘门 **FAIL/OPEN**；Space/Del 全量暂未测。交开发修，专家不改。

### 门禁
- **总门：仍 NOT PASS。** 新增 R3-DEF-009 P2 + R3-DEF-008 P1 未修；390、桌面宽屏/焦点、正式3080 冒烟仍 NOT_RUN。

---

## 43. R3-DEF-008 复测：编辑修复 → ✅ 关闭（删除待补）

- after/r3-def008-meeting-fixed.json：mtg-0004 title=`R3 临时会议-已修复`、status=`final`、updatedAt=15:44（编辑落盘）；保存后抽屉关闭、toast 更新。
- console 缓冲含**重启前 connection refused 历史噪音**，当前保存请求成功；以 toast+DOM+disk 判修复，网络瞬断仍为观察项。
- R3-DEF-008 编辑流程缺陷关闭。**meeting 删除仍待执行**（现场服务 mux 又断，恢复后补删除落盘证据）。

### 门禁
- **总门：仍 NOT PASS。** R3-DEF-009 P2 未复测、meeting 删除待补、键盘 Space/Del/390/桌面宽屏/正式3080 冒烟 NOT_RUN。

---

## 44. meeting 删除补证 + R3-DEF-008 全闭环 → meeting CRUD 整体 PASS

- after/r3-def008-meeting-deleted.txt：`mtg-0004 edited after fix then deleted via GUI confirm; file_absent=true`。
- 修复后 edit 成功（§43）→ GUI 删除 confirm → 列表消失、磁盘 mtg-0004 absent。
- R3-DEF-008 全闭环（编辑+删除）；meeting 新建/编辑/删除三段齐 → **meeting CRUD 整体 PASS**。

### 逐实体 CRUD 最终汇总（均已证新建+编辑+删除）
- projects ✅ / milestones ✅(+达成) / risk_issues ✅(+闭环) / meetings ✅ / deliverables ✅(+版本) / tasks ✅(+级联) / reports ✅(+快照)。

### 仍 NOT_RUN / 待复测
- R3-DEF-009（Escape/快捷键越界）未复测关闭；键盘 Space/Del 全量；390 窄屏；桌面宽屏/焦点；正式3080只读冒烟。

### 门禁
- **总门：仍 NOT PASS。** R3-DEF-009 P2 未复测 + 键盘/390/正式3080 等 NOT_RUN。

---

## 45. R3-DEF-009 复测 → 核心关闭；键盘剩余设施 BLOCKED

- j+Enter 仍 PASS。
- 修复后：抽屉内 Escape 真实关闭、未保存字段磁盘不变、焦点回 body → **Escape/抽屉越界核心缺陷关闭**。
- 关于"k 写入 input"：input 聚焦时输入 k 是浏览器正常文本输入，不应被全局快捷键拦截（当前行为正确，非产品缺陷）；据此撤销 §42 对该项的判错。
- 列表 k/Space/Del：因 Browser Use 按键映射无法产生可靠 selection → **Space/Del 记执行设施 BLOCKED/NOT_RUN**，不计产品 FAIL。

### 键盘项最终
- j+Enter PASS、抽屉 Escape 关闭 PASS、input 聚焦文本输入正常 PASS。
- 列表 Space 勾选 / Del 删除流：设施 BLOCKED（待可靠按键环境复测）。

### 仍 NOT_RUN
- Space/Del 列表流（设施）；390 窄屏；桌面宽屏/焦点；正式3080只读冒烟。

### 门禁
- **总门：仍 NOT PASS。** 无新增产品 FAIL；但 Space/Del（设施 BLOCKED）+ 390/桌面宽屏/正式3080 等 NOT_RUN 未达整类门槛。

---

## 46. 响应式 390 容器 + 焦点关闭 → 容器响应 PASS；viewport/焦点有条件

### 390 容器响应 → PASS（容器 query，非 viewport）
- 截图 r3-panel-390-container.png：PM 容器精确 390px，项目信息换行、KPI 瓦重排两行、工具栏纵向堆叠、表格内部横滚（状态/执行人右侧裁切为内滚）。
- 数据：shell client=390、scrollWidth=385、root 无横溢；Tab 条自身 1025 可横滚。宽屏恢复 733。
- 判：**容器级 390 响应 PASS**。**浏览器真 viewport 390 仍设施 BLOCKED**（CDP 不可用），不计产品 FAIL。

### 焦点关闭 → 关闭 PASS，焦点未回触发按钮记 P3 观察
- j+Enter 抽屉焦点在 INPUT；Escape 关闭后焦点回 BODY、console 0。
- 缺口（按严格口径不自动豁免）：关闭后焦点未恢复到触发按钮（a11y 惯例应回 trigger）。记 **R3-OBS-002 P3 观察**，交开发酌情修，不阻塞当前整类（但不豁免）。

### 仍 NOT_RUN
- 列表 Space/Del（设施）；真 viewport 390（设施）；正式3080只读冒烟。

### 门禁
- **总门：仍 NOT PASS。** 无新增阻塞产品 FAIL；真 viewport/Space·Del/正式3080 设施 BLOCKED 与 R3-OBS-002 P3 未达整类。

---

## 47. R3-OBS-002 焦点首版复测 → 仍 FAIL，保持 OPEN 不降级

- 复测：Escape 关闭 PASS，但 focusAfter 仍 BODY（opener 取 activeElement 不可靠）。
- 已交开发二修为显式 trigger ref。
- 处置：观察项保持 **OPEN（P3）**，不降级、不自动豁免；待二修后复测焦点回触发按钮。

### 门禁
- **总门：仍 NOT PASS。** R3-OBS-002 OPEN + 列表 Space/Del、真 viewport 390、正式3080 冒烟设施 BLOCKED/NOT_RUN。

---

## 48. 证据纪律纠正（降级待查，不擅判）

- 问题：crud-*-deleted.txt 等多为**执行端手写结论**（一句 created/edited/deleted），不能独立证明创建/修改/版本历史/级联。
- 处置：**§34-46 的 CRUD、390、焦点判 PASS 结论一律降级为"待原始证据（before/after json + 截图）重核"**；在拿到独立原始证据前不记全 PASS，不据一句话放行。
- 待纠正的定性（先列待查，不定性）：
  1. d88a332 冻结复测——待原始证据再判。
  2. 390 容器人工改 width 的样式验证**不能替代真 viewport**——真 viewport 仍待查，不算已验。
  3. Space 无响应**不等于**按键映射设施故障——不擅判为设施 BLOCKED，待查。
  4. 仅凭 Task running + 历史 console 日志**不能定性网络隔离**——§32 类设施结论也待查。
- 我只做最终判定，不执行 GUI；等完整原始证据 + 独立审计后再逐项定 PASS/FAIL/BLOCKED。

### 门禁
- **总门：仍 NOT PASS。** CRUD 等结论回炉待原始证据重核，不提前放行。

---

## 49. 吸收独立审计矩阵（gui-round3-gap-matrix.md）

- 审计确认：**7 CRUD（projects/milestones/risk/meetings/deliverables/tasks/reports）仅一行手写 txt，无 before/after JSON、无截图、无 ls 证明 → 全部降级待补采重核**（与 §48 一致）。
- **证据充分保留（绑各自版本，不外推）**：行内编辑 s1-08、甘特 s1-10、副驾取消 s1-12、副驾确认 s1-13、恢复链 s1-20、milestone toggle（缺一张按钮状态 GUI 截图，JSON 充分）。
- 待查不定性：审计第 18/78 行"进程存活证明跨沙箱/CDP 隔离根因"逻辑不成立——**网络隔离根因未证实**，不再擅自归产品或设施。3091 PID 26939 存活，沙箱不可达是 CDP 连接问题。
- 已建可冻结补采矩阵：`docs/testing/crud-recollection-matrix.md`（7 个冻结 CASE_ID + 取消保护 + 版本历史必要断言）。
- 当前唯一 3091 页面由采证端做 focus/真实 key 原始证据；我不改用例、不宣告完成。

### 门禁
- **总门：NOT PASS。** 7 CRUD 待补采、网络根因未定、真 viewport/Space·Del 待查。

---

## 50. 补采矩阵校准（冻结）+ 结论粒度原则

- 校准 `crud-recollection-matrix.md`：① p-r3t 等为逻辑别名，记录系统实际 p-NNNN， projects 改的是 name 非 title；② 取消删除以"数据未变"为预期，不强制抽屉关闭状态；③ 网络/CDP 统一表述为"监听已观测，网络/CDP 根因未证实"，不再写"沙箱不可达是 CDP 问题"。
- 原则：不笼统降级 §34-46 全部历史结论；按用例所缺证据逐条标"待补"，证据充分项（行内/甘特/副驾/恢复链等）不受影响。
- 矩阵已冻结，供采证端按 CASE_ID 补采。

### 门禁
- **总门：NOT PASS。**

---

## 51. 键盘/焦点补采（supplement-focus-keyboard，原始证据观察）

- keyboard-event-log.json：KeyJ/KeyK isTrusted=true 到达 BUTTON 目标；Enter/Escape/Delete 均 isTrusted。**Space 多种形式无任何事件**——仅记"该入口未到达"，不判产品 FAIL。
- t-0018：after-create json 已落盘（"FBKB删除测试行"）；after-cancel 与 after-create **逐字段一致**（取消保护：数据未变）；Delete 键盘 + 原生 confirm accept → delete-result "disk absent"；before/after-delete tasks 列表均 17（t-0018 已移除，夹具恢复）。
- env.json：runningCommit **UNVERIFIED**（服务早于 bundle 写入，不标 d88a332 验证）；realViewport 789×745（非 390）；DSH_HOME/backup 均隔离；正式 data 未触碰。
- 焦点：开抽屉后 Esc 焦点跳到 7 天提醒（焦点管理问题）；SUMMARY 尚缺独立 focus DOM 附件，已要求补。开发已获明确焦点证据，做一次最小修复期间冻结 GUI/3091。

### 判定
- 不判版本终签（commit UNVERIFIED）；仅记录本次观察。Space 无响应非产品 FAIL；焦点跳跃为待修项（并入 R3-OBS-002 系列）。

### 门禁
- **总门：NOT PASS。** 版本未绑定 + 7 CRUD 待补 + 焦点待修 + 真 viewport 390 待查。

---

## 52. 抽屉焦点修复（drawer-focus.ts / panel.tsx / verify-drawer-focus.mjs）只读审

- 版本：HEAD d88a332 + **3 个未提交文件**（panel.tsx M、drawer-focus.ts ??、verify-drawer-focus.mjs ??）。审证口径=workingTreeCandidate；**不能假写 dirty=false**，manifest 须 baseCommit+patch+artifact hash；待后续 commit 后二次验证才终签。

### 审证结论（可进入 GUI 复测）
- drawer-focus.ts：纯逻辑解耦正确。归还顺序 真实 pointer opener(仍在文档)→行 title/edit→.pm-add-row→任意行 title→null，**绝不落全局 .pm-button-primary/提醒条**；takeOpenerSpec 立即消费 pending。
- panel.tsx：useLayoutEffect 在 mount 时取已记录的 opener（不再读被 autoFocus 抢占的 activeElement）；TaskRow 加 data-pm-row；openActive 记录 rowId；pointerdown capture 记录最近 button/a。
- verify 脚本：伪 DOM 真跑编译产物四条路径（pointer/keyboard/行不可见 fallback/opener 已销毁 fallback/null/输入守卫），诚实声明非真 React，真时序待 GUI 复验。

### 待观察小隐患（不阻塞进入 GUI 复测）
- pending 模块级单例：当前单 PmPanel 单抽屉风险低；若未来多面板，跨面板 opener 泄漏需注意。
- 每次 pointerdown（含备份/tab/通知等非抽屉按钮）都会覆写 pending——非抽屉操作后若再开抽屉，可能把非抽屉按钮记成"脏 opener"。建议开发后续在非抽屉动作后清 pending；当前不阻塞，GUI 复测时观察归还目标是否符合预期即可。

### 门禁
- **总门：NOT PASS。** 修复仅逻辑验证（workingTreeCandidate），GUI 复测未做、未 commit、7 CRUD 待补、真 viewport 390 待查。

---

## 53. R3-OBS-002 焦点 GUI 复验（workingTreeCandidate）→ GUI PASS，待 commit 终签

- 候选指纹一致：baseCommit d88a332 + workingTreeCandidate=true，dirty 仅 3 产品文件（panel.tsx/drawer-focus.ts/verify 脚本，各带 sha256）；lib client SHA a3ba4f39…a20709b、drawer-focus.js SHA 60d1e11f…9aa86，与冻结值比对一致。
- 实测（js 读 activeElement + isTrusted）：
  1. title 路径：Esc 后 activeElement=BUTTON"逾期任务"（activeIsTitleOpener=true），旧"跳 7 天"不复现；
  2. edit 路径：Esc 后 activeIsEditBtn=true；
  3. create 路径：Esc 后回"添加记录"按钮；
  4. 键盘：KeyJ→Enter 开"临期"、KeyK→Enter 开"逾期"，isTrusted；
  5. 删除 fallback：测试行 t-0018 删除后抽屉关闭，activeElement=BUTTON"添加记录"(.pm-add-row)。
- console 窗口起点 0；真 viewport 789×745。
- 判定：**R3-OBS-002 焦点归还 GUI PASS（workingTreeCandidate）**。终签仍待产品 commit 后 hash 一致复跑。
- 小观察（非阻塞）：create-Esc 按钮 class 实测 `.pm-add-button`，与修复说明 fallback 选择器 `.pm-add-row` 存在类名并存/差异，但焦点均落在"添加记录"按钮——建议后续统一类名，不阻塞本项关闭。
- 证据诚实性：中间路径以 activeElement DOM 对象实测为准（非截图）；仅删除 fallback 一张截图持久化。

### 仍 NOT_RUN
- 真 390 viewport（CDP 仍 Session not found）；空格键入口；7 CRUD 补采（冻结矩阵）；正式3080只读冒烟。

### 门禁
- **总门：NOT PASS。** R3-OBS-002 GUI 已 PASS（候选），但 7 CRUD/viewport/Space/正式3080 未达，且终签待 commit 复跑。

---

## 54. CRUD 补采三 case（PROJ/MILE/RISK）独立审证统一判定

- 证据：docs/verification/gui-round3-20261012T161500Z/crud-recollect/CRUD-{PROJ,MILE,RISK}-01/（各 stage manifest.diff + copied JSON + NOTES + shots）。候选 lib/client.js a3ba4f39（冻结值）；runningCommit=UNKNOWN（按 workingTreeCandidate 口径，不要求=gitHead）。

### CRUD-MILE-01（m-0002）→ PASS
- create：diff added=[m-0002.json]，其余 27 不变；
- edit：重命名 R3T-Mile→R3T-Mile-改（contentModified=1，sha 变化）；
- 标记达成：cancel 阶段 JSON 实测 status=achieved、achievedDate=2026-10-12（非空达成逻辑正确）；
- cancel 保护：m-0002.json 仍在、列表仍在（取消=toggle 副作用，非数据回退错误）；
- delete：deleted=[m-0002.json]，milestones/ 只剩 m-0001，toast"里程碑已删除"。
- 首击"添加里程碑"无反应：源码核实里程碑 targetDate 为必填，空日期被原生校验拦截——非按钮 bug，属设计行为。

### CRUD-RISK-01（ri-0002）→ PASS
- create：added=[ri-0002.json]，JSON 实测 type=risk/probability=high/impact=high/status=open；
- edit：title→R3T-Risk-改、status open→closed（JSON 实测）；
- cancel 保护：cancellationUnchanged=true（added=0/modified=0/touch=0/deleted=0，28 unchanged），最干净；
- delete：deleted=[ri-0002.json]，risk_issues/ 只剩 ri-0001。

### CRUD-PROJ-01 → NOT_PASS（待补采/澄清），不判产品功能缺陷
- 现象：新建项目抽屉开、填名称、点"创建项目"3 次+Enter，抽屉不关、无 p-0003 落盘、console 0 错。
- 源码核实（panel.tsx:2474-2494）：表单无 novalidate；项目 name/startDate/targetDate 均带 HTML5 `required`；提交按钮隐式 type=submit；submit handler 仅在原生校验通过后 preventDefault 执行。
- 结论：采集端**只填名称、未填开始/目标日期**，空必填字段被浏览器原生 required 校验拦截（drawer 不关、不提交）——这是设计行为，**不是功能缺陷**。
- 待澄清（不擅自定性）：原生校验气泡（"请填写此字段"）是否真实出现并可见。截图为按钮高亮、无气泡，疑为 transient 气泡被截图时机错过。按用户硬规则，不据单张截图判 UX 缺陷。
- 待补采两步：①空日期提交时截图原生校验气泡是否出现；②补填 start/target 日期后提交，确认 p-0003 落盘。两步齐备后判 PROJ CRUD PASS。

### 门禁
- **总门：NOT PASS。** MILE/RISK CRUD 已 PASS；PROJ 待两步补采；MEET/DLV/TASK/RPT 四 case 仍待补；真 390 viewport、Space 入口、正式3080 冒烟 NOT_RUN；R3-OBS-002 终签待 commit 复跑。

---

## 55. §54 PROJ UX 结论修正：登记 R3-UX-001（P2）

源码/测试/需求三方独立核实（非单图推断）：
- panel.tsx:2474-2494：项目表单无 novalidate；name/startDate/targetDate 带 HTML5 required；提交按钮隐式 type=submit；onSubmit 仅在校验通过后 preventDefault 执行。**校验失败时 onSubmit 根本不运行，故无 Notice/console/落盘**——执行者误以为按钮坏。
- core/project.ts:18-23：startDate/targetDate 为 zod dateSchema（非 optional），实现层必填。
- verify-projects.mjs:126：`create({ name: '缺少日期' })` 列入 invalidInputs 必须报错——测试层必填。
- requirements.md §4.1：字段表**仅 name 标"（必填）"**，startDate/targetDate 仅注明 date 类型，未标必填。
- 页面事实：字段无星号/必填文字、无 aria-required/aria-invalid/aria-describedby；唯一反馈是浏览器原生气泡（transient，指向首个非法字段）。

### R3-UX-001（P2，UX/表单反馈）
- 缺陷：项目/里程碑新建表单缺**持久内联反馈 + 可见必填标识 + aria 属性**；校验失败仅靠原生气泡，用户无法判断"为什么没提交"。
- 规则歧义（不擅改 schema）：实现+测试要求日期必填，但 requirements §4.1 只声明 name 必填。本轮维持实现/测试的日期必填，补文档说明；schema 不动。
- 验收依据（修复后必达）：①空日期提交时出现**持久可见**错误摘要/字段内联提示（非转瞬气泡）；②必填字段有可见标识（*或"必填"文案）且 aria-required/aria-invalid/aria-describedby 接错误文本；③requirements §4.1 明确 startDate/targetDate 必填并与 zod 一致；④填齐日期后创建/编辑/删除全链落盘正常（功能 CRUD 另判）。
- 里程碑"首击无反应"同根因（targetDate 必填被原生拦截），并入本 UX 缺陷，不另立。

### PROJ 功能 CRUD（与 UX 缺陷分离）
- 仍由执行者补 start/target 日期走完整创建→编辑→删除链，p-0003 落盘/删除证据齐备后判功能 PASS。UX 缺陷不阻塞功能链补采，但 R3-UX-001 未修前总门不豁免。

### 门禁
- **总门：NOT PASS。** 新增开放 P2：R3-UX-001。MILE/RISK CRUD PASS；PROJ 功能链待补；MEET/DLV/TASK/RPT 待补；真 390/Space/正式3080 NOT_RUN；R3-OBS-002 终签待 commit 复跑。

---

## 56. PROJ 补全 + MEET + DLV 三 case 独立审证统一判定

候选 lib/client.js a3ba4f39（冻结值）；runningCommit=UNKNOWN（workingTreeCandidate 口径）。

### CRUD-PROJ-01（p-0003）→ PASS（功能链）
- invalid-nochange：diff cancellationUnchanged=true（27 不变）；DOM 实测 startDate/targetDate required、checkValidity=false、valueMissing=true、validationMessage="请填写此字段。"（outerHTML 已存）——**原生气泡确实出现并聚焦开始日期**（shots 可见）。空提交零写盘。
- create：added=[p-0003.json]，name=R3T-Proj项目、startDate=2026-10-01、targetDate=2026-12-31；
- edit：contentModified=1（name→R3T-Proj-改，sha 变）；
- cancel：cancellationUnchanged=true，p-0003 仍在；
- delete：deleted=[p-0003.json]，projects/ 只剩 p-0001/p-0002。
- 早期"按钮无反应"确证=空必填日期被原生校验拦截，非功能 bug。

### CRUD-MEET-01（mtg-0004）→ PASS
- create：added=[mtg-0004.json]，title=R3T-Meeting、meetingDate=2026-10-13、status=draft；
- edit：title→R3T-Meeting-改、status draft→final、summary="R3T正式纪要"（JSON 实测）；
- cancel：cancellationUnchanged=true（28 unchanged）；delete：deleted=[mtg-0004.json]，meetings/ 只剩 mtg-0001/2/3。
- participants=["R3T会议纪要笔记"] 为采集端把笔记文字误填入 participants 输入（notes 字段留空）——**属测试输入放置，非产品字段 bug**（participants 正确存数组、summary 正确落盘、notes 正确为空）。notes 持久化本轮回路未跑，但已在 R3-DEF-007/340bffb（mtg-0003 备注编辑抽屉重启读回）独立关闭，不重复计。

### CRUD-DLV-01（dlv-0002）→ PASS
- create：added=[dlv-0002.json]，version=v1.0、history[0]={field:created,to:planned,note:创建交付物}；
- edit：version v1.0→v1.1，**history 2 条完整**（created + {field:version,from:v1.0,to:v1.1,note:R3T变更说明}），版本历史+变更注断言满足；
- cancel：cancellationUnchanged=true；delete：deleted=[dlv-0002.json]，deliverables/ 只剩 dlv-0001。

### R3-UX-001 状态
- **保持 OPEN**：PROJ 功能链虽 PASS，但 §55 的 P2 UX（缺持久内联反馈/可见必填标识/aria；原生气泡虽存在但转瞬）不因功能通过关闭。requirements §4.1 文档歧义待补。

### 仍待补
- CRUD-TASK-01（级联 confirm 原始 diff，此前 t0018/t0019 级联 toast 已证但按矩阵纪律需 stage diff）；CRUD-RPT-01（快照 diff）。
- 真 390 viewport / Space 入口 / 正式3080 冒烟 NOT_RUN；R3-OBS-002 终签待 commit 复跑。

### 门禁
- **总门：NOT PASS。** 已 PASS：MILE/RISK/PROJ/MEET/DLV 五实体 CRUD + R3-OBS-002(候选)；开放：R3-UX-001(P2)；待补：TASK/RPT CRUD、真 viewport、Space、正式3080 冒烟、commit 复跑。

---

## 57. TASK/RPT 独立审证 + 7 实体 CRUD 总汇总

候选 lib/client.js a3ba4f39（冻结值）；3091 workingTreeCandidate。

### CRUD-TASK-01（t-0018 父 / t-0019 子）→ PASS
- create.diff added=[t-0018,t-0019]，JSON 实测 t-0018 parentId=null/code=9、t-0019 parentId=t-0018/code=9.1（父子关联落盘）；
- 删父原生 confirm 原文：「任务『R3T父任务』含 1 个子任务。确定删除…全部 1 个子任务…旁支任务不受影响…不可撤销」；
- cancel.diff cancellationUnchanged=true（29 unchanged，父子 hash 独立不变）；
- delete.diff deleted=[t-0018,t-0019]，tasks/ 只剩 t-0001~t-0017，toast"已级联删除 2 个任务（9 及其 1 个后代）；旁支不受影响"；
- 旁支 t-0001 SHA de13650c… 三阶段全程不变（级联不误删旁支）。

### CRUD-RPT-01（rpt-0003 固定快照）→ PASS（一处可选补采）
- 完整快照 JSON 落盘：snapshot 含全部 7 键 project/tasks(total=17)/milestones/meetings(inPeriod=3,decisions=2)/periodMilestones/periodMeetings/exceptions；periodStart=2026-10-01、periodEnd=2026-10-12；
- edit.diff contentModified=1：title→R3T快照汇报-改、executiveSummary ""→"R3T执行摘要"（period 字段 disabled 不可改）；
- cancel.diff cancellationUnchanged=true（28 unchanged）；delete.diff deleted=[rpt-0003.json]，reports/ 只剩 rpt-0001/2。
- 可选补采（不推翻）：before 基线在生成后才采，create-vs-precreate diff 未成立。按矩阵「生成固定快照+snapshot 字段」标准，完整初始快照 JSON + 干净 edit/cancel/delete 链已足够判 PASS；如需更严格创建溯源，可另补 create 前后目录 diff，非阻塞。

### 7 实体 CRUD 总汇总（补采后）
| 实体 | CASE | 结果 | 关键证据 |
|---|---|---|---|
| Project | CRUD-PROJ-01 | PASS | invalid-nochange 原生校验零写盘 + p-0003 全链 |
| Milestone | CRUD-MILE-01 | PASS | m-0002 create/edit/达成 toggle/cancel/delete |
| Deliverable | CRUD-DLV-01 | PASS | dlv-0002 v1.0→v1.1 history 2 条+变更注 |
| Task | CRUD-TASK-01 | PASS | t-0018/9 级联删除 confirm 原文+旁支 hash 不变 |
| Risk | CRUD-RISK-01 | PASS | ri-0002 high/high→closed/cancel 最干净 |
| Meeting | CRUD-MEET-01 | PASS | mtg-0004 create/edit(title/status/summary)/cancel/delete |
| Report | CRUD-RPT-01 | PASS | rpt-0003 完整快照 7 键 + edit/cancel/delete |

### 开放 / 待办
- **R3-UX-001（P2）OPEN**：项目/里程碑表单缺持久反馈/可见必填/aria；开发尚未构建修复。
- NOT_RUN：真 390 viewport（CDP）、空格键入口、正式3080 只读冒烟（3080 未升级被测提交）。
- R3-OBS-002 焦点 GUI PASS（候选），终签待产品 commit 后 hash 一致复跑。

### 门禁
- **总门：NOT PASS。** 7 实体 CRUD 已全 PASS（候选 a3ba4f39）；但 R3-UX-001 未修、真 viewport/Space/正式3080 NOT_RUN、终签待 commit 复跑，不可发布。

---

## 58. R3-UX-001 修复只读审 → 可进 GUI 复测（非 PASS）

- 候选：bundle SHA 07c3edb2…767da14；37 verify exit0。焦点补丁三文件（panel.tsx/drawer-focus.ts/verify-drawer-focus.mjs）确认未被覆盖。

### 只读审结论（源码/测试/文档，不凭开发 summary）
- form-validation.ts：纯函数无 React/DOM；isRealIsoDate 对齐 zod z.iso.date（拒 2/30/越月/未补零）；validateProjectForm 覆盖 name/start/target 缺值、非法日期、target<start（挂 targetDate）；文案与服务端 zod 一致；firstInvalidField 按填表顺序定首个错误。
- verify-form-validation.mjs：真实 import 编译产物断言（缺值逐字段/合法通过/纠正清错/target<start/非法日期/里程碑 title/targetDate 必填）；诚实声明 ARIA/内联渲染/焦点定位需 GUI。
- panel.tsx 集成：两表单加 noValidate（**受控校验非漏校验**）；Field 增可选 required/error/errorId（不传时渲染同旧版，**其他实体表单无回归**）；必填星号 aria-hidden；错误 span role=alert 且 id 唯一（project-name/start/target-error、milestone-title/target-error）；input aria-required/aria-invalid/aria-describedby 与错误 id 对应；setField 输入即重算纠错清错；submit 失败聚焦 elements.namedItem(first) 且不发命令；按钮与 Enter 同走 onSubmit。
- CSS：pm-field-required/pm-field-error/data-invalid 边框全部用宿主 token（--pm-danger=--dsw-alias-state-error-primary、--pm-blue），**不写死 hex，随深浅主题自适应**。
- 文档：requirements §4.1 起止日期补标「必填/不得早于」，与 zod 一致；ADL-046 记录维持 schema 不变、受控中文内联、ARIA/焦点留 GUI。

### 待确认小项（不阻塞进 GUI）
- verify-form-validation.mjs 是否已纳入 37 自动化 runner（grep 未见 package.json 引用）；请确认其被纳入全量，否则 37 绿口径未含本项。

### GUI 复验矩阵（R3-UX-001，真实 Chrome，全部需 PASS 才可关闭）
1. 空项目表单提交：出现**常驻**内联错误（非转瞬气泡）逐字段可见（名称/开始日期/目标日期）；console 0；projects/ 零写盘。
2. 焦点：提交后焦点落在**首个错误字段**（name）；输入纠正后该字段错误**实时消失**，全合法时提交成功落盘 p-xxxx。
3. ARIA：必填字段 aria-required=true、错误时 aria-invalid=true、aria-describedby 指向错误 span id（读屏可达）；必填星号可见。
4. Enter 与按钮点击**同路径**：在输入框按 Enter 与点"创建项目"行为一致。
5. 里程碑表单同 1-4（title/targetDate）。
6. 深浅主题切换：错误文字/星号/边框对比度均可见（不写死色）；390 容器不错位。
7. 回归：其他实体表单（task/risk/meeting/deliverable/report 编辑抽屉）无错误星号/aria 异常、提交行为不变。

### 门禁
- **R3-UX-001 仍 OPEN**：源码审通过可进 GUI，未真实浏览器验收前不关闭。总门：**NOT PASS**。

### §58 小项更新（2026-10-13）
- package.json 已新增 verify glob runner；`pnpm run verify` 实际 39 个脚本 exit0，日志含 verify-form-validation 与 verify-drawer-focus。
- candidate 现含 package.json dirty（runner 配置），**不改变 bundle 产物**；manifest 须把 package.json 一并纳入 candidate 文件清单。
- R3-UX-001 仍等真实 GUI 复验证据，不预判关闭。

---

## 59. R3-UX-001 + R3-OBS-002 新 bundle(07c3edb2) GUI 证据统一判定

候选 lib/client.js SHA 07c3edb2…767da14（workingTreeCandidate；终签待 commit 后 hash 复跑）。

### R3-UX-001 核心缺陷 → GUI PASS（候选），可关闭
原始证据 ux-r3-001/ 独立核实：
- 项目空提交：form noValidate=true；3 字段 aria-required=true；3 条 role=alert 持久内联错误（project-name/start/target-error，visible=true）；aria-invalid=true、aria-describedby 指向对应错误 span id；焦点落首个错误字段 INPUT name=name；3 个必填星号；console 0、projects/ 零写盘。
- name 输入"UX-R3-测试项目"后 project-name-error 实时消失（aria-invalid/describedby 移除），其余错误保留。
- target<start（start=2026-12-01/target=2026-10-01）：错误"完成日期不得早于开始日期"挂 targetDate、焦点落 targetDate。
- 填齐后创建 p-0003→toast→select 出现→GUI 删除 confirm→select 恢复 p-0001/2；final.diff cancellationUnchanged=true（27 不变，零污染）。
- 里程碑空提交：2 错误（title/target）、aria 正确、焦点落 title；创建 m-0002→删除清理。
- 浅色对比度：错误文字 5.77:1（≥4.5）、错误边框 4.51:1（≥3），均 PASS。
- 回归：任务编辑抽屉 requiredMarks=0、visibleErrors=0、ariaRequired/Invalid=0、formNoValidate=false——其他实体表单无星号/aria 泄漏。
- 结论：R3-UX-001「缺持久反馈/可见必填/aria/焦点定位/纠错清错」核心已修复并 GUI 验证。

### 分项 NOT_RUN（设施/自动化限制，非产品 FAIL；不并入缺陷关闭）
- **深色主题** NOT_RUN：当前 UI 无可靠主题切换开关（dsh 主题由系统控制），未伪造。本修复改了主题 token，按 ADL 深色错误文字/边框对比度**仍需实测**——列为独立样式子项 OPEN（设施阻塞），不因浅色 PASS 自动豁免深色。
- **表单 Enter 与按钮同路径** NOT_RUN：bu.press_key Enter 在输入框未触发提交（合成事件限制）；代码侧按钮 type=submit 在 form 内、Enter 本应走同 onSubmit，但未得 trusted 证据，记 NOT_RUN 非 FAIL。
- 真 390 viewport / Space 入口：NOT_RUN（CDP/按键事件未到达）。

### R3-OBS-002 新 bundle(07c3edb2) 复验
- 三条点击路径 Esc 归还均 PASS：title→pm-title-cell、edit→pm-row-button、create→pm-add-button；删除 fallback activeElement=BUTTON（非 body/全局 primary）。
- Enter isTrusted=true 打开抽屉（target pm-title-cell）。
- **KeyJ/KeyK NOT_RUN**：本轮 bu.press_key 未产生到达 document 的 trusted keydown；旧候选 a3ba4f39 的键盘行证据**不能沿用到新 bundle**。键盘行路径在 07c3edb2 上待补 trusted 证据。

### 总门事实（NOT PASS / 不可发布）
- 已 PASS（候选 07c3edb2）：7 实体 CRUD 全通；R3-UX-001 核心；R3-OBS-002 三点击路径+删除 fallback。
- OPEN/NOT_RUN：深色主题错误对比度（设施阻塞）；表单 Enter 一致性（自动化限制）；KeyJ/K 键盘行（新 bundle 待 trusted 证据）；真 390 viewport；Space 入口；正式3080 只读冒烟（3080 未升级被测提交）。
- 终签：R3-UX-001 与 R3-OBS-002 均为候选判定，待统一 commit 后 hash 一致复跑。

---

## 60. R3-TDEF-002 登记（测试隔离/数据安全）

### 缺陷事实
- 裸跑旧 `pnpm verify` 时，verify-command / verify-storage 等脚本默认读写**正式 data**（非隔离 tmpdir）；实际仅覆盖 `packages/dsh-pm-tool/.verify-tmp/pmtool/checks/selftest.json` 时间戳。
- S0 baseline 对比确认：其余 26 个业务实体文件 hash 完全不变、无增删；无可信字节级旧副本，保留当前探活记录，**不伪造历史字节证据**。
- 性质：测试设施隔离缺陷（非产品功能 FAIL），但涉及正式 data 写入路径，数据安全风险真实存在。

### 严重度
- **P1（测试隔离/数据安全）**。虽非产品代码缺陷，但默认写正式 data 违反"正式 data 只读"门禁。

### 开发修复（待验证，不预判关闭）
- 两脚本默认 `mkdtemp(tmpdir)` 隔离；新增 `verify-isolation` guard（前后 hash + mtime 守护正式 data 与 shared backups）；package runner 接入 guard；gitignore `.verify-tmp`。

### 关闭条件（全部满足才关）
1. 父进程完整守卫 verify **exit0**；
2. 正式 data（26 业务文件）manifest 零变化（hash/mtime 守护通过）；
3. shared `packages/backups/` 81 文件基线零污染。
- 任一项不满足 → 缺陷保持 OPEN 并回开发。

### 最终门清单更新（在 §59 基础上）
- 新增 OPEN：R3-TDEF-002（P1，待完整守卫 verify）。
- 其余不变：B 类（KeyJ/K、深色对比度、表单 Enter）与 C 类（真 390、Space）需 Main 真实 CU；D 类正式 3080 S0 先升级同 commit 再只读冒烟；E 类 commit 后 hash 复跑。
- **总门：NOT PASS / 不可发布。**

---

## 61. R3-TDEF-002 复审判定：guard 守护缺口，**不能关闭**，回开发

### 只读核实事实
- 源码 `src/core/backup.ts:19` BUILTIN_DEFAULT = `new URL('../../../backups/', import.meta.url)`，解析 = **`packages/backups/`**（真实共享备份目录，现 81 文件）。
- guard `verify-isolation.mjs` WATCH = [仓库 `data/`, `packages/dsh-pm-tool/backups/`(1 文件), `packages/dsh-pm-tool/backup/`(1 文件)]。
- **真实共享目录 `packages/backups/`（81 文件）不在 WATCH 内**；guard 守的是两个各 1 文件的 `packages/dsh-pm-tool/backups` 与 `backup`。
- env scrub 仅删 `DSH_PM_BACKUP_DIR`，但脚本默认 BUILTIN_DEFAULT 即落 `packages/backups/`；若任一 verify 脚本写备份，guard 无法察觉污染。

### 判定
- R3-TDEF-002 **保持 OPEN（P1）**。修复不完整：guard 未守护真实共享备份目录，数据安全门未真正闭合。
- 不算产品功能 FAIL；属测试设施 guard 配置缺陷。

### 回开发最小修复
1. WATCH 追加真实共享目录 `packages/backups/`（81 文件基线）；
2. 复核 `packages/dsh-pm-tool/backups`/`backup` 是否仍需保留（若为历史误生成，说明并保留基线）；
3. 修后完整 `pnpm run verify` exit0，guard before/after 含 `packages/backups/` 在内的正式清单零变化。
- 满足后再关 R3-TDEF-002。

### 计数口径更正
- 旧 §60 关闭条件③写"shared backups 81 文件"——现明确该 81 文件位于 **仓库根 `packages/backups/`**，非 `packages/dsh-pm-tool/backups`。guard 现守护的 69 文件计数未含真实共享目录，故不构成"81 零污染"证据。
- 总门：**NOT PASS / 不可发布。**

---

## 62. R3-TDEF-002 关闭（P1，复测通过）

### 只读核实（2026-10-13）
- guard WATCH 已修正为 [仓库 `data/`、仓库 `packages/backups/`(81)、仓库 `packages/backup/`]，注释明确对齐 BUILTIN_DEFAULT（从 lib/core 上三级解析到仓库 `packages/backups/`）。
- env scrub 只打印变量名不打印值。
- 独立轻跑 `node scripts/verify-isolation.mjs verify-command.mjs verify-storage.mjs`：exit0；before=149 / after=149；diff 空；脚本实际落 `/var/folders/.../pm-tool-verify-*-` 系统临时目录；目录权限 0700。
- 父完整 `pnpm run verify` exit0，149 文件 hash+mtime 零变化，backup 81 不增，selftest hash 不变。

### 判定
- **R3-TDEF-002 关闭（P1 测试隔离/数据安全）**。正式 data 与共享备份目录已被 guard 真实守护，默认隔离 tmpdir 生效。
- 注：`packages/dsh-pm-tool/backups`(1) 与 `backup`(1) 两个包内目录不在新 WATCH；经核实非 defaultBackupDirectory 落点，保留基线即可，不计入污染面。

### 终签清单状态（更新）
- 已 PASS：7 实体 CRUD、R3-UX-001 核心、R3-OBS-002 点击路径、R3-TDEF-002（本项）。
- 待 Main 真实 CU：KeyJ/K 键盘行、深色主题错误对比度、表单 Enter 同路径、真 390 viewport、Space 入口。
- 待办：正式 3080 S0 先升级同 commit 再只读冒烟；commit 后 bundle hash 复跑终签。
- **总门：NOT PASS / 不可发布。**

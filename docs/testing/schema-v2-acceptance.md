# Schema v2 验收矩阵（batch-1 执行中 · 被测 `d960445` 工作树）

> 目的：由独立测试专家冻结并**逐格判定** schema v2 验收。本文件**只记录用例与独立测试结论，不改产品代码、不产生提交**。
> 权威流程：ADL-045（独立测试门控）+ ADL-047（自动化门 / 人工协作门 MANUAL_PENDING 分层）+ AGENTS 6A。本目录为测试专家独占。
> **裁决冻结目标口径（开发须对齐，本矩阵据此验收）**：领域升 v2 且 `compatibleVersions` 仍含 1；旧 v1 读、更新一条即迁移 v2（其余不批量改写）；`predecessorIds` 任务级、`repoUrl/branch` 项目级；健康分纯派生不落盘；悬空依赖 doctor **只报告不自动自愈**；坏记录 clean fail 点名表/字段/路径、**禁止 backup-and-skip**；备份 `formatVersion` 仍为 1；`createBackup` 原子 tmp+rename、restore 进程内故障注入回滚（不声称跨进程事务）。

## 1.5 本轮执行记录（batch-1 业务候选，独立测试专家亲跑）

- **被测对象**：`testedCommit = d960445`（`[doubao-work][plan] 冻结schema v2契约与兼容验收矩阵`）之上的**未提交工作树**（batch-1 实现：storage/task/project/health/doctor + 5 个新 verify 脚本）。`dirtyProductFiles = true`（实现尚未提交；按 ADL-045 此结论仅绑该工作树，提交后须重测）。
- **环境**：macOS arm64、Node 22.23.2、pnpm；写库/备份全程 `DSH_PM_BACKUP_DIR` 隔离，默认 `packages/backups/` 跑前跑后 hash 一致。
- **亲跑命令与结果**：
  - `pnpm run build` → 退出 0（tsc + panel.css + tsdown，client bundle 731.96 kB，无 server-only require 残留迹象）。
  - 新增专项逐一 `node scripts/verify-{schema-v2,predecessors,health,doctor,gui-contract}.mjs` → **全部退出 0**。
  - `pnpm verify`（build + `verify-isolation` 串跑全量 guard）→ **退出 0**；`[guard] after manifest 文件数 = 150`、`正式 data/共享 backups hash+mtime 清单零变化`。
  - 独立探针（一次性、已清理）：手造 v1 信封 + 一条 `progress:150` 坏任务 → open 抛错中止、坏记录文件原地保留（**未 backup-and-skip**）。
- **本轮判定范围**：执行 A–F 全部可执行项、H 可执行项、G 的 precheck 相关项（G3/G5/G7）。**G1/G2/G4/G6（备份格式往返 / 原子写 / 中途回滚）显式留待第二批，保持 NOT_RUN(批2)，本轮不预判。**
- **敏感扫描**：工作树 diff 无 api key / secret / token / 宿主会话 / cookie 命中；备份仍只覆盖七实体、不含 checks/宿主会话/密钥。
- **GUI 口径（ADL-045 第 7/8 条）**：真实宿主浏览器本执行端无法驱动，`verify-gui-contract.mjs` 仅静态校验面板钩子齐备，**不替代真实浏览器实测**；凡 GUI 行诚实标 `BLOCKED`，不伪造 PASS。
- **逐案判定汇总**（AUTO 行为主，证据=对应专项脚本退出 0 + 全量 guard 退出 0）：
  - **PASS**：A1–A6；B1–B4；C1–C5（C5 本轮修复后改判 PASS）；D1–D4、D6、D7、D8；E1–E4；F1–F6；G3、G5、G7；H1–H4（H4 本轮隔离真实浏览器冒烟改判 PASS）。
  - **BLOCKED（GUI 表单级，面板挂载已证、逐字段交互受执行端所限）**：B5、C6、E5、F7；D5 的 GUI 两段证据部分（AUTO 删除/级联保护部分已 PASS）。
  - **MANUAL_PENDING（不可逆动作须用户本人）**：G8、H5。
  - **（已结案）第二批 backup**：G1/G2/G4/G6 由 NOT_RUN(批2) 改判 PASS（见 §1.5.2）。
- **总门结论：NOT PASS。** 理由：C5 诊断质量 FAIL + 多个 GUI 行 BLOCKED；且按裁决 G4/G6 本就不预判。待第二批落地后重测 G1/G2/G4/G6 并补真实 GUI 实测。

### 1.5.1 复跑记录（REQUEST CHANGES 已修，独立测试专家二次亲跑）

- **被测对象**：同一 `d960445` 工作树，batch-1 修复后（C5 中文点名 + 5 专项补强断言）。仍 `dirtyProductFiles = true`。
- **环境**：macOS arm64、Node 22.23.2；写库/备份全程隔离；正式实例 3080（owner 数据）零触碰。
- **复跑命令与结果**：
  - `pnpm run build` → **退出 0**（tsdown client bundle 739.51 kB，Build complete）。
  - 5 专项逐一 `node scripts/verify-{schema-v2,predecessors,health,doctor,gui-contract}.mjs` → **全部退出 0**。
  - `pnpm verify`（全量 guard）→ **退出 0**；`[guard] after manifest 文件数 = 151`、`正式 data/共享 backups hash+mtime 清单零变化`。
- **C5 修复核验**：`src/index.ts:92-93` 现结构化中文包装「`存储领域打开失败：` + `formatDomainOpenError`」；专项脚本输出断言「坏 v2 记录重开 clean fail，`formatDomainOpenError` 相对路径+表/键/字段中文点名，坏记录原地保留不隔离」。**C5 由 FAIL 改判 PASS。**
- **隔离真实浏览器补证（H4/B5/C6/E5/F7）**：
  - 起隔离 dsh web（`DSH_HOME=/tmp/dsh-home-iso-88gC`、端口 3082、`--profile pm`，profile 软链改绝对路径指向真实包，数据目录天然隔离、不碰 3080 owner）。
  - 隔离 HeadlessChrome 139 经 CDP 打开面板：**PM 侧边栏入口可点、「项目工作台/总览看板/新建项目」渲染成功、无 console 崩溃**。**H4 由 BLOCKED 改判 PASS（真实隔离浏览器冒烟：面板挂载+渲染无报错）。**
  - 表单级交互（B5 任务前置多选控件、C6 坏输入内联反馈、E5 repo 展示/外链、F7 健康灯/因子）：隔离空库，CDP WebSocket 在「点新建项目→dump 表单」步骤反复挂起被中止，**未能完成表单级真实点击取证**。按 ADL-045 第 8 条不伪造 PASS，此四行仍诚实标 BLOCKED（面板挂载已证，表单交互待可稳定驱动的真实执行端补采）。
- **敏感扫描**：工作树 diff 无 api key/secret/token/password/cookie 命中（隔离测试 token 为临时 URL 参数，已排除）；临时 CDP 驱动脚本已删除。
- **复跑后判定汇总**：PASS 增加 C5、H4；B5/C6/E5/F7 仍 BLOCKED（面板挂载 PASS、表单交互待补）；G1/G2/G4/G6 此轮仍 NOT_RUN(批2)（下一轮 §1.5.2 已签 PASS）；G8/H5 仍 MANUAL_PENDING。
- **总门结论仍：NOT PASS。** 理由：GUI 表单级行 B5/C6/E5/F7 仍 BLOCKED；且 G1/G2/G4/G6 按裁决留待第二批不预判。

### 1.5.2 复跑记录（第二批 backup 候选已完成，独立测试专家亲跑 G 项）

- **被测对象**：同一 `d960445` 工作树，batch-2 实现后（`backup.ts` +87/-24：`atomicWriteFile` 原子写、`applyBackup` 内部故障注入 seam、进程内回滚 + AggregateError 路径）。仍 `dirtyProductFiles = true`。
- **亲跑命令与结果**：
  - `node scripts/verify-backup.mjs` → **退出 0**（隔离目录 + 默认 backups 未变 + 原子写 + 中途回滚 T1–T9 全过）。
  - `pnpm verify`（全量 guard）→ **退出 0**；`[guard] after manifest 文件数 = 151`、正式 data/共享 backups hash+mtime 清单零变化。
- **G 项判定（证据=verify-backup 断言编号）**：
  - **G1 PASS**：`writeBackupFile` 恒写 `formatVersion:1`；导出备份七实体齐全。
  - **G2 PASS**：T8 v1 旧任务缺 `predecessorIds` 键仍过 `validateBackup` 并 `applyBackup` 往返内容一致；v2 新字段往返无损；未知 extra 字段被 strict schema 拒绝（不静默吞键）。
  - **G4 PASS**：T3 进程内注入前向中途故障 → 抛错含「已自动回滚」、任务数恢复 before=3、`deepEqual(titles)` 与 before 一致；T6 持续故障 → 回滚也失败 → `cause instanceof AggregateError` 且消息指向安全快照人工恢复。**边界诚实标注：仅验进程内故障注入回滚，不声称跨进程/强杀级事务。**
  - **G6 PASS**：`writeBackupFile` 走 `atomicWriteFile`（同目录 tmp + fsync + rename + fsync dir）；T1 原子写后无 `.tmp` 残留、T2 只读目录写失败不产生目标文件且无 tmp 残留。
  - 佐证：T4 precheck 悬空 projectId 零触碰（G3 加固）；T5 安全快照写失败即不进破坏写（G5 加固）；T7a/b 有数据生成快照、空库不生成。
- **敏感扫描**：工作树 diff 无 api key/secret/token/password/cookie 命中；隔离测试 token 不入库。
- **复跑后 G 项状态**：G1/G2/G4/G6 由 NOT_RUN(批2) 全部改判 **PASS**；G3/G5/G7 维持 PASS；G8 维持 MANUAL_PENDING。
- **总门结论仍：NOT PASS。** 理由：GUI 表单级行 B5/C6/E5/F7 仍 BLOCKED（待 GUI Agent 证据）；G8/H5 不可逆人工动作维持 MANUAL_PENDING。本批 G 项可先签。

### 1.5.3 复跑记录（独立 GUI 表单级补测 · 真实 Chrome/Browser Use，2026-10-13）

- **被测对象**：GUI 面源码 = `17ccc82`（`升级schema v2依赖仓库与健康诊断`）。会话进行中另一执行者把第二批原子写在途 WIP（`backup.ts`+`fs-atomic.ts`）提交为 `4b533ad`；该提交只动 backup 域，**不触及** panel/task/project/health GUI 源码，故本批 GUI 判定仍锚定 `17ccc82`。独立测试专家只采证、未改产品、未提交。
- **环境（全程隔离）**：`DSH_HOME=.tmp/gui-schema-v2/home`、storage root=`.tmp/gui-schema-v2/data`、`DSH_PM_BACKUP_DIR=.tmp/gui-schema-v2/backups`、`DSH_PM_E2E=1`；主实例端口 **3100**、坏盘实例端口 **3101**。正式 **3080(owner)/3091 全程未触碰**：跑前跑后独立 hash+mtime 复核正式 data/共享 backups **151 文件零变化**。token 仅临时内存，未写入证据/脚本。
- **AUTO 复跑（17ccc82 树）**：
  - `pnpm run build` → **退出 0**（tsdown client bundle 739.51 kB）。
  - 5 专项逐一 `node scripts/verify-{schema-v2,predecessors,health,doctor,gui-contract}.mjs` → **全部退出 0**。
  - `pnpm verify`（全量 guard）→ **退出 0**；`[guard] after manifest 文件数 = 151`、正式 data/共享 backups 零污染。
- **真实 Chrome/Browser Use 取证**（证据目录 `docs/verification/gui-schema-v2-20261013/`）：
  - **H4 复跑 PASS**：隔离真实 Chrome 打开面板，PM 侧边栏可点、4 个种子项目渲染、零 console error。
  - **B5 PASS**：任务抽屉前置多选复选框 `name=predecessorIds` 按已存 `predecessorIds=[t-0001]` 预勾选（`B5-taskform-predecessor-checked.png`）；任务行渲染「等待前置×1」chip（`H4-smoke-B5-waiting-chip.png`）；成环被服务端中文拒绝「前置依赖存在循环：任务不能间接地依赖自己」、GUI 弹中文失败通知、t-0001 磁盘零写（`B5-cycle-rejected-notice.png`+`hostlog`）。
  - **E5 PASS**：项目概览 repo 行渲染外链 `github.com/acme/demo-repo.git @main`、anchor href 正确；表单预填 repoUrl/branch；合法保存 `main→develop` 持久化（`E5-overview-repo-link-green-lamp.png`）。
  - **F7 PASS**：空项目灰灯「数据不足」（`F7-gray-lamp-empty-project.png`）、绿灯「100 分 无扣分项」、黄灯「75 分」因子扣分逐因子可读（`F7-yellow-lamp-factors.png`）；只读（查看后落盘记录数不变）。
  - **C6 PASS**：非法 repoUrl 内联中文错误（role=alert、aria-invalid）、提交拦截零写（`C6-E5-inline-repoUrl-error.png`）；坏记录隔离坏盘启动宿主日志中文 clean-fail 点名 + 工作台弹「项目存储未就绪。」alert、坏记录原地保留、backups 空（`C6-baddisk-*.png/txt`）。
- **诚实边界（不伪造 PASS）**：① B5 成环 GUI 通知为通用「任务操作失败…」，具体成环中文原因在宿主服务端日志（已取证）；② C6 坏记录工作台只展示通用「项目存储未就绪。」，表/键/字段级详细点名在宿主日志（已取证），未在工作台内联展开。
- **敏感扫描**：证据目录仅命中占位符 `token=<REDACTED>`，无真实 token/key/secret/password/cookie；临时种子脚本已删、隔离实例已停、端口已释放。
- **GUI 门判定**：B5/C6/E5/F7 由 BLOCKED 全部改判 **PASS**（真实浏览器证据齐备）；**D5 GUI 段补测亦改判 PASS**（取消/确认删除两路径均磁盘零写、后端中文点名引用方 A，证据 `D5-*`）。G8/H5 维持 MANUAL_PENDING。

### 1.5.4 最终独立签发（D5 GUI 补证到位，2026-10-13）

- **tested commits 绑定**：`17ccc82`（`[doubao-work][feat] 升级schema v2依赖仓库与健康诊断`）= AUTO 业务候选 + GUI 面；`4b533ad`（`[doubao-work][reliability] 原子化备份并恢复失败自动回滚`）= 第二批 backup。证据目录 `docs/verification/gui-schema-v2-20261013/`。独立测试专家只采证、未改产品、未提交。
- **D5 GUI 补证**：`D5-*.png/txt`——隔离 3100 造 A=t-0002.predecessorIds=[t-0001]、B=t-0001；取消删除 → 磁盘 manifest 与基线逐字节一致（零写）、关系仍在；确认删除 → 后端中文拒绝并点名引用方「任务 t-0001 仍被任务 t-0002 作为前置依赖，请先在 t-0002 解除」（`TaskReferencedByPredecessorError`/`assertNoPredecessorReferences`），B 与 A.predecessorIds 未被级联/改写。**D5 全 PASS。**
- **复跑（最终）**：`pnpm run build` → 退出 0（tsdown client bundle 739.51 kB）；`pnpm verify`（全量 guard）→ 退出 0；`[guard] after manifest 文件数 = 151`、正式 data/共享 backups hash+mtime 清单零变化。
- **50 用例终态**：**48 PASS + 2 MANUAL_PENDING（G8/H5）= 50**。**无 FAIL、无 BLOCKED、无 NOT_RUN。**
- **敏感扫描**：矩阵 + 证据目录仅命中 `token=<REDACTED>` 占位符与自述行，无真实 api key/secret/token/password/cookie；正式 3080(owner)/3091 全程未触碰。
- **最终结论：✅ 总门 PASS（自动化门 + GUI 门全绿）。** G8/H5 为不可逆人工动作，按 ADL-047 分层登记 MANUAL_PENDING，**不阻塞自动化门/GUI 门通过**；待用户本人在面板执行备份/恢复与删除确认时据实回填即可。schema v2 验收矩阵独立签发完成。

### 1.5.5 v0.6.0 候选重绑定（HEAD=a89740a，工作树干净）

- **重绑定提交链**：`17ccc82`（schema v2 feat）→ `4b533ad`（原子备份+回滚）→ `bd894f6`（契约完成归档）→ `30f8990`（独立验收与 GUI 证据签发）→ **`a89740a`（归档 v0.6.0 版本事实与主线完成状态）**。`package.json` version = **0.6.0**；`git status` 干净。
- **独立复跑（v0.6 候选 HEAD）**：
  - `pnpm run build` → 退出 0（tsdown client bundle 739.51 kB）。
  - 关键专项 `node scripts/verify-{schema-v2,predecessors,health,doctor,gui-contract,backup}.mjs` → **全部退出 0**。
  - `pnpm verify`（全量 guard）→ 退出 0；`[guard] after manifest 文件数 = 151`、正式 data/共享 backups hash+mtime 清单零变化。
- **产物 hash**：`lib/client.js` SHA-256 = `2c52040d4e40f809f9b65cd1ee5b81f9ad119d684fceab04d69188549e3bba41`；默认 `packages/backups/` 跑后 hash = `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`（空目录，零污染）。
- **50 用例终态复核**：**48 PASS + 2 MANUAL_PENDING（G8/H5）= 50**。**无 FAIL、无 BLOCKED、无 NOT_RUN。**
- **敏感扫描**：工作树干净、无新增 diff；证据目录 `gui-schema-v2-20261013/` 仅 `token=<REDACTED>` 占位符。
- **v0.6 候选结论：✅ 维持总门 PASS。** 重绑定至 `a89740a`，build/full guard/关键专项全绿；G8/H5 维持 MANUAL_PENDING 不阻塞。

### 1.5.6 正式运行态 R 记录（v0.6.0 升级重启后独立审证）

- **绑定**：代码 HEAD=`b6e35a6`（仅矩阵文档）；产品构建对应 `a89740a`。提交链 `17ccc82→4b533ad→bd894f6→30f8990→a89740a→b6e35a6`。
- **进程态（独立 lsof 核验）**：3080=PID **81589** LISTEN、3091=PID **81590** LISTEN；`GET /` 无 token → 两端口均 **401**；两实例日志均 `[pm-tool] 存储领域 pmtool 已打开`（各 1 次、无 error/fatal/crash）。
- **数据完整性（独立 manifest 比对）**：before=150、after=150（data 68 + packages/backups 82）；added=0、removed=0；**唯一 changed = `data/session_projcache/sessions/session-65c44795….json`**，其 sha256 前后均 `10baaa33…2396`、size 均 4552，仅 mtimeMs 刷新（服务端重开活跃会话固有行为，非内容写改）。`packages/backups` 82 文件 hash+mtime 全零变动。
- **v1 信封可读 & 不批量改写**：records=**26**，versionDist=`{"1":26}`——重启后全部 v1 记录成功加载，无任何记录被批量迁移/改写为 v2。
- **审证交叉**：与 Agent workspace artifact `release-v0.6.0-upgrade-evidence.md` 逐项一致（PID/401/pmtool opened/150 全等/session cache 例外/26 v1/82 backups）。
- **敏感扫描**：未取用一次性 token；未 commit/tag/push；未改 profile/keys/数据。
- **R 结论：✅ 正式运行态通过，可打 v0.6.0 tag。** schema v2 验收矩阵在运行态下维持 PASS：50 用例 48 PASS + 2 MANUAL_PENDING（G8/H5 不阻塞），无 FAIL/BLOCKED/NOT_RUN。

---

## A. v1 旧 JSON 兼容读取（无新字段也能读）

| CASE_ID | 场景 | 最小触发 | 必含断言（缺一不可 PASS） | 层 | 状态 |
|---|---|---|---|---|---|
| V2-A1 | 旧任务记录缺 `predecessorIds` 仍可读 | 造一条 v1 形状任务（不含 `predecessorIds` 键）写入 v2 运行库并重启读回 | 读回成功、不抛 unrecognized/missing；`predecessorIds` 读回为「空」语义（缺省空数组），其余 v1 字段值零漂移 | AUTO | PASS |
| V2-A2 | 旧项目记录缺 `repoUrl`/`branch` 仍可读 | 造一条 v1 形状项目（无两键）重启读回 | 读回成功；两字段读回为「空」语义；`name/status/dates/tags` 零漂移 | AUTO | PASS |
| V2-A3 | v1 备份（`formatVersion:1`）可被 v2 读取恢复 | 取一份真实 v1 备份 JSON，在 v2 运行时 `readBackupFile`/`restoreBackupFromContent` | 通过 `validateBackup`，不抛「formatVersion 不符」；恢复后七实体计数与原备份一致；新字段按空缺省（证据：全量 guard 内 verify-backup 往返） | AUTO | PASS |
| V2-A4 | 读 v1 备份后写回，旧记录不被「补全」成坏形 | v1 记录读入 → 不做任何编辑 → 再备份导出 | 导出记录不得丢失既有 v1 字段；可选新字段仅在有值时出现，空值不污染语义 | AUTO | PASS |
| V2-A5 | v1 strictObject 对「多余未知键」的既有行为不被 v2 放松 | 向 v2 写入对象塞入一个未定义键（如 `fooBar:1`） | 仍按既有 `unrecognized_keys` 拒绝，中文提示可读；不得因 v2 放宽成静默吞键（verify-schema-v2 断言点名 fooBar） | AUTO | PASS |
| V2-A6 | 域升 v2 仍兼容读 v1；更新即迁移到 v2 | 域以 v2 打开且 `compatibleVersions` 含 1；载入纯 v1 记录库，对其中**一条**记录做一次合法更新后重启读回 | 纯 v1 库可打开、不强制迁移即可读；被更新的那一条信封盖 v2；**其余未触碰 v1 记录信封仍为 1、不批量迁移**；外来 v3 版本文件读作缺席（verify-schema-v2 断言） | AUTO | PASS |

## B. v2 可选字段写回与重启读回

| CASE_ID | 场景 | 最小触发 | 必含断言 | 层 | 状态 |
|---|---|---|---|---|---|
| V2-B1 | `predecessorIds` 写入并重启读回 | 任务 A、B；给 A 写 `predecessorIds:[B]`；关闭域重开读 A | 读回 `predecessorIds` 精确等于 `[B]`（verify-predecessors） | AUTO | PASS |
| V2-B2 | `repoUrl`/`branch` 写入并重启读回 | 项目写合法 git URL + branch；重开读回 | 两字段原值落盘、读回相等；`updatedAt` 正常推进（verify-schema-v2 往返） | AUTO | PASS |
| V2-B3 | 不填新字段 = 合法可选 | 新建任务/项目完全不带新字段 | 创建成功、写回不报错；读回为缺省空语义 | AUTO | PASS |
| V2-B4 | 更新可单独改新字段、不动其它 | 只更新 `branch`；其它字段 JSON diff 应只含 `branch`/`updatedAt` | diff 最小、不误触归属/父/编号/时间戳（verify-predecessors 增改清） | AUTO | PASS |
| V2-B5 | 面板可编辑新字段（GUI） | 打开任务抽屉/项目编辑表单 | **PASS**（§1.5.3 真实 Chrome/Browser Use）：任务抽屉前置多选复选框 `name=predecessorIds` 渲染、按已存 `predecessorIds=[t-0001]` 预勾选；任务行渲染「等待前置×1」chip；成环（t-0001 勾选 t-0002 为前置）服务端中文拒绝「前置依赖存在循环：任务不能间接地依赖自己」、GUI 弹中文失败通知、t-0001 磁盘零写 | GUI | PASS |

## C. 人为坏字段 clean fail（写一半要不得）

| CASE_ID | 场景 | 最小触发 | 必含断言（缺一不可） | 层 | 状态 |
|---|---|---|---|---|---|
| V2-C1 | `predecessorIds` 含非任务 ID 串 | 写 `predecessorIds:["not-a-task"]` | clean 拒绝 + 中文字段提示；该任务记录**未写入/未改坏**，库计数前后相等（verify-predecessors 存在性拒绝） | AUTO | PASS |
| V2-C2 | `repoUrl` 非法格式 | 写 `repoUrl:"not a url"` | clean 拒绝 + 可读错误；项目未部分写入（verify-schema-v2 断言「不是地址」被拒） | AUTO | PASS |
| V2-C3 | `branch` 非法 ref | 写含空格 / 路径穿越符号的 branch | clean 拒绝；磁盘零变更（verify-schema-v2 断言 `bad~branch`、`x y` 被拒） | AUTO | PASS |
| V2-C4 | 字段类型错误（数组/标量串台） | `predecessorIds:"A"`（应为数组）或 `repoUrl:123` | zod 级类型拒绝，非静默 coercion；错误文案映射到中文标签 | AUTO | PASS |
| V2-C5 | 手改磁盘 JSON 制造坏记录后重启 | 直接编辑某记录 JSON 改坏一字段 → 重开域 | **PASS**（复跑：`src/index.ts:92-93` 结构化中文包装「存储领域打开失败：」+ `formatDomainOpenError`；专项断言坏 v2 记录重开 clean fail、相对路径+表/键/字段中文点名、坏记录原地保留不 backup-skip） | AUTO | PASS |
| V2-C6 | 面板坏输入的用户可见反馈（GUI） | 表单填非法 URL / branch 保存 | **PASS**（§1.5.3）：表单非法 repoUrl 内联中文错误「仓库地址需为 http(s)://、git:// 或 git@host:org/repo.git 形式」（role=alert、aria-invalid），提交被拦截、其它内容保留、磁盘零写；坏记录隔离坏盘启动（3101）宿主日志中文 clean-fail 点名表/键/字段并「不自动修复、不移动或隔离」，工作台弹中文 alert「项目存储未就绪。」（非 silent；详细点名在宿主日志），坏记录原地保留、backups 空（无 backup-and-skip） | GUI | PASS |

## D. predecessorIds 关系语义（存在 / 同项目 / 自指 / 成环 / 删除保护 / 重启读回 / 预检兜底 / 悬空只报告）

> 关系校验在 **写入路径** 与 **备份恢复预检 `precheckBackup`** 两处都生效。

| CASE_ID | 场景 | 最小触发 | 必含断言（缺一不可） | 层 | 状态 |
|---|---|---|---|---|---|
| V2-D1 | 被指 predecessor 存在 | A→B，B 真实存在 | 合法接受、落盘、重启读回关系成立（verify-predecessors） | AUTO | PASS |
| V2-D2 | 跨项目引用拒绝 | A 在项目 P1，predecessor 指向 P2 的任务 | clean 拒绝 + 「同项目」中文提示；A 零写（verify-predecessors） | AUTO | PASS |
| V2-D3 | 指向自身拒绝 | A.predecessorIds 包含 A 自己 | clean 拒绝；不得自引用落盘（verify-predecessors） | AUTO | PASS |
| V2-D4 | 成环拒绝 | A→B、B→C、C→A（或 A→B→A） | 环检测拒绝成环那一步；报错可读；已合法部分不被连带清空（verify-predecessors + precheckBackup DFS） | AUTO | PASS |
| V2-D5 | 删除被引用 predecessor 的保护 | B 是 A 的 predecessor；尝试删 B | **PASS**（§1.5.3 真实 Chrome 补证 GUI 段）：隔离 3100 造 A=t-0002.predecessorIds=[t-0001]、B=t-0001；抽屉点删除→原生 confirm「删除任务 需求评审？」→**取消**后磁盘 manifest 与基线逐字节一致、B 与 A.predecessorIds 均在；再**确认删除**→后端中文拒绝并点名引用方「任务 t-0001 仍被任务 t-0002 作为前置依赖，请先在 t-0002 解除」（`TaskReferencedByPredecessorError`/`assertNoPredecessorReferences` tasks.js:82），工作台弹中文 alert，B 与 A.predecessorIds 仍在、磁盘零写（证据 `D5-*.png/txt`） | AUTO+GUI | PASS |
| V2-D6 | 重启读回整组依赖链 | 建 A→B→C 合法链 → 重启 → 依次读回 | 三条记录 predecessorIds 完整、方向正确、无反转/丢边（verify-predecessors） | AUTO | PASS |
| V2-D7 | 预检兜底：备份里带环/悬空 predecessor | 手工构造含 A→B→C→环 + 一条悬空的 v2 备份，走 `precheckBackup`/restore | 在**触碰现有数据前**整份拒绝；现有库零变更（precheckBackup 已扩 predecessorIds 存在/同项目/自指 + DFS 成环预检） | AUTO | PASS |
| V2-D8 | 悬空依赖 doctor 只报告、不自动自愈 | 构造 A.predecessorIds 指向一个已被删除的 ID，跑体检/doctor | doctor **报告**该悬空边（点名 A 与悬空 ID），但**不自动删除/改写** predecessorIds；库记录零变更（verify-doctor 断言坏记录原地保留；命令端无 confirm/写分支） | AUTO | PASS |

## E. repoUrl / branch 格式与旧项目兼容

| CASE_ID | 场景 | 最小触发 | 必含断言 | 层 | 状态 |
|---|---|---|---|---|---|
| V2-E1 | 合法 git URL 通过 | `https://host/org/repo.git` 与 `git@host:org/repo.git` 两类 | 均接受、原样落盘读回（verify-schema-v2） | AUTO | PASS |
| V2-E2 | 非法 URL 拒绝 | 空后空格、含协议外垃圾、相对路径 | clean 拒绝 + 中文提示；项目零写（verify-schema-v2 断言「不是地址」被拒） | AUTO | PASS |
| V2-E3 | branch 合法 / 非法边界 | `main`、`feature/x-1` 接受；`bad~branch`、`x y` 拒绝 | 白名单字符口径与冻结契约一致；拒绝项零写（verify-schema-v2 断言） | AUTO | PASS |
| V2-E4 | 旧项目无此两字段完全正常 | 取基线已存在的旧项目 | 不强制补两字段、不报错、展示为空态而非「字段缺失异常」（v1 项目信封兼容读） | AUTO | PASS |
| V2-E5 | 面板仓库信息展示/编辑（GUI） | 项目详情显示 repoUrl/branch；编辑往返 | **PASS**（§1.5.3）：项目概览 repo 行渲染外链 `https://github.com/acme/demo-repo.git @main`（anchor href 正确）；项目表单预填 repoUrl/branch；合法保存 branch `main→develop` 持久化、updatedAt 推进；非法值内联错误拦截零写（见 C6） | GUI | PASS |

## F. 健康分（确定性 / 因子可解释 / 边界）

> 健康分为**纯离线派生**（对齐 ADL-039）：同一数据 → 同一分数；不写库、不带时钟/随机；today 可注入。

| CASE_ID | 场景 | 最小触发 | 必含断言（缺一不可） | 层 | 状态 |
|---|---|---|---|---|---|
| V2-F1 | 确定性 | 对同一数据集连算两次 | 两次分数逐因子相等；不依赖 `Date.now()`、随机、遍历顺序（verify-health 断言黄 63 双跑一致） | AUTO | PASS |
| V2-F2 | 因子可解释 | 取一份样本，请求「分数 + 因子分解」 | 返回总分且可拆到各因子，每因子贡献可复算回总分；不含黑箱单值（health.ts factors[] 带中文标签+计数+扣分） | AUTO | PASS |
| V2-F3 | 边界：空项目 | 0 任务的项目 | 不除零、不 NaN/Infinity；返回灰灯 `score=null` 与空因子说明（verify-health 断言灰灯空项目） | AUTO | PASS |
| V2-F4 | 边界：满分 / 全受阻 | 全 done → 上限分；全 blocked → 下限分 | 分被 clamp 在 [0,100]；不越界、不出现 101/-1（verify-health 断言扣分封顶） | AUTO | PASS |
| V2-F5 | 边界：日期未来/已过期 | dueDate 今天 / 昨天 / 明天各一 | 边界口径与既有 `computeReminders`（逾期=dueDate<今天）一致（注入 today，verify-health） | AUTO | PASS |
| V2-F6 | 只读派生、零写 | 计算健康分后断言库未变 | 计算前后任一表 `hashSet` 不变；不新表、不写 settings（healthFromStats 纯函数） | AUTO | PASS |
| V2-F7 | 面板健康分展示（GUI） | 项目视图展示健康分 + 因子 | **PASS**（§1.5.3）：空项目灰灯「数据不足 尚未拆分任务 暂不评分」；无扣分绿灯「100 分 无扣分项」；风险项目黄灯「75 分」因子扣分可读「逾期未完成任务1（-3）受阻任务1（-4）未闭环高影响风险1（-10）逾期里程碑1（-8）」；只读（查看后落盘记录数不变） | GUI | PASS |

## G. 备份兼容 与 restore 预检 / 失败回滚 / 原子写（本批仅验 precheck 相关项）

| CASE_ID | 场景 | 最小触发 | 必含断言（缺一不可） | 层 | 状态 |
|---|---|---|---|---|---|
| V2-G1 | 备份 `formatVersion` 仍为 1（不随域升 v2） | v2 运行库 createBackup | **PASS**（`writeBackupFile` 恒写 `formatVersion:1`；verify-backup T8 断言导出备份 formatVersion:1、七实体齐全） | AUTO | PASS |
| V2-G2 | `formatVersion:1` 备份往返兼容 | G1 备份（带新字段）→ restore 回隔离空库；再与 v1 旧备份互读 | **PASS**（verify-backup T8：v1 旧任务缺 `predecessorIds` 键仍通过 `validateBackup` 并 `applyBackup` 往返、内容一致；v2 新字段随往返无损；未知 extra 字段被 strict schema 拒绝） | AUTO | PASS |
| V2-G3 | 预检在动表前拦截坏记录 | 构造坏 task（坏 predecessorIds 或非法 repoUrl）放入备份后 restore | 在 `delete` 任何现有记录**之前**抛错；现有库逐表计数前后完全相等（precheckBackup 先行；verify-backup T4 悬空 projectId 零触碰） | AUTO | PASS |
| V2-G4 | restore 中途失败自动回滚（进程内故障注入） | **进程内注入**「预检通过但写表中途 put 抛错」后 restore | **PASS**（verify-backup T3：注入前向中途故障 → 抛错含「已自动回滚」、任务数恢复 before=3、`deepEqual(titles)` 与 before 一致；T6 持续故障 → 回滚也失败 → `cause instanceof AggregateError` 且消息指向安全快照。边界：仅验进程内故障注入回滚，不声称跨进程/强杀级事务） | AUTO | PASS |
| V2-G5 | 恢复前自动安全快照仍生效 | 当前库已有数据时触发 restore | 先写时间戳安全快照再动表；快照文件存在、落在 `DSH_PM_BACKUP_DIR`（verify-backup T7a/b：有数据生成快照、空库不生成；T5 快照写失败即不进破坏写） | AUTO | PASS |
| V2-G6 | createBackup 原子写、中断不留半成品/残留 | 注入写临时文件途中抛错 / rename 前中断 | **PASS**（`writeBackupFile` 走 `atomicWriteFile`：同目录 tmp + fsync + rename + fsync dir；verify-backup T1 原子写后无 `.tmp` 残留、T2 只读目录写失败不产生目标文件且无 tmp 残留） | AUTO | PASS |
| V2-G7 | 拒绝格式不符的伪备份 | `formatVersion:99` 或篡改 `format` 字段的文件 | `validateBackup` 干净拒绝、中文提示；不碰现有库 | AUTO | PASS |
| V2-G8 | GUI 备份/恢复按钮（人工不可逆确认） | 面板触发备份 + 一次恢复 | 恢复属不可逆动作，仍弹显式确认（ADL-047 第 5 条不受分层豁免）；确认前零写。**须用户本人执行/确认 → MANUAL_PENDING** | MANUAL_PENDING | MANUAL_PENDING |

## H. build / full guard / GUI 总门

| CASE_ID | 场景 | 最小触发 | 必含断言 | 层 | 状态 |
|---|---|---|---|---|---|
| V2-H1 | `build` 通过 | `pnpm run build`（tsc + css + tsdown） | 退出码 0；client bundle 不残留 server-only zod/域 require（tsdown 产物 731.96 kB，build 退出 0） | AUTO | PASS |
| V2-H2 | full guard 全绿含新增 verify | `pnpm verify`（verify-isolation 串跑全部 verify-*.mjs，含新增 5 个 schema-v2 专项） | 既有 150 文件不回归；全量 guard 退出 0；manifest 零变化 | AUTO | PASS |
| V2-H3 | 隔离默认 backups 不变 | 跑完整套 guard 前后 `hashSet(packages/backups)` | 前后一致（跑前跑后 hash 一致；guard 自报 data/共享 backups 零污染） | AUTO | PASS |
| V2-H4 | 真实浏览器 GUI 冒烟 | 真实 Chrome 打开隔离面板 | **PASS**（§1.5.3：隔离真实 Chrome/Browser Use 打开面板，PM 侧边栏可点、4 个种子项目渲染、零 console error；此前隔离 HeadlessChrome 冒烟亦已证面板挂载无崩溃）。注：表单级逐字段取证 B5/C6/E5/F7 已在 §1.5.3 同批 PASS | GUI | PASS |
| V2-H5 | 不可逆动作人工确认 | 面板删除被引用 predecessor / 恢复备份 | 必须用户本人确认动作；登记 MANUAL_PENDING，不阻塞自动化门 | MANUAL_PENDING | MANUAL_PENDING |

---

## 2. 交付与判门口径

- **自动化门（AUTO 全绿）**：AUTO 用例 PASS 即视为可推进当前交付（ADL-047）。A–H 可自动化项**全部 PASS**（A1–A6、B1–B4、C1–C5、D1–D4/D6–D8、E1–E4、F1–F6、G1–G7、H1–H3；C5 中文点名修复、G1/G2/G4/G6 第二批 backup 落地后均改判 PASS）。
- **GUI 门**：GUI 用例须真实浏览器证据；离线/纯函数绿不得替代。§1.5.3 独立 GUI 补测以真实 Chrome/Browser Use 完成：**B5/C6/E5/F7、D5(GUI 段)、H4 全部 PASS**（证据 `docs/verification/gui-schema-v2-20261013/`）。诚实边界：成环/坏记录/删除保护的详细中文点名在宿主服务端日志（已取证），工作台展示通用中文通知而非内联展开。
- **人工协作门**：G8/H5 不可逆动作登记 MANUAL_PENDING，按 ADL-047 **不阻塞自动化门/GUI 门**；待用户本人执行时据实回填。
- **FAIL 一律阻塞**；`BLOCKED/NOT_RUN` ≠ 通过；历史结论在新提交使受影响面变动后过期作废须重测。
- **最终结论：✅ 总门 PASS（绑定提交 `17ccc82` + `4b533ad`）。** 50 用例 = 48 PASS + 2 MANUAL_PENDING（G8/H5，不阻塞）；无 FAIL、无 BLOCKED、无 NOT_RUN。复跑 build=0、full guard=0（151 文件零污染）；敏感扫描 clean。schema v2 验收矩阵独立签发完成。

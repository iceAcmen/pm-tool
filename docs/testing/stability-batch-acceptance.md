<!--
稳定性地基批次验收矩阵（独立测试专家所有，ADL-045/047；开发前冻结，不写产品代码）。
其他角色只读引用，不得改本文件用例/断言/判定。状态只能由测试专家实测回填。
冻结日期：2026-10-14。冻结基线：v0.7.0 release commit `217d8ae`（仓库链接与人员补全批，30/30 PASS）。
严格覆盖顺序：S1 moveTaskAndRenumber 执行失败+回滚失败 AggregateError → S2 ask-apply 幂等键短 TTL 持久化 settings、跨进程/重启去重、inFlight 仍内存 → S3 项目级 repo CLI 输出与 client/core 校验真源一致。
本批只做稳定性加固，不实现账号/权限/实时协作；但把未来多人协作作为架构红线冻结（见第 5 节）。
-->
# 稳定性地基批次 · 验收矩阵（stability-batch）

> 是什么：为下一个**稳定性批次**先冻结独立验收计划——本文件只有用例与口径，不含任何产品实现。
> 三个硬骨头：**S1** = `moveTaskAndRenumber` 在「业务写失败 + 回滚也失败」时必须抛出**聚合错误 AggregateError**（而非吞掉回滚失败、留下半套状态）；**S2** = ask-apply 成功幂等键以短 TTL **持久化进 settings**，跨进程/重启重复确认返回「已执行」而非误报冲突，并发去重 `inFlight` **仍只在内存**；**S3** = 项目级 repo 的 CLI 输出与 client/form 校验都以 `core/repo.ts` 为**唯一真源**，不允许第二份口径漂移。
> 判定纪律：`FAIL / BLOCKED / NOT_RUN` 一律 ≠ 通过；GUI 实测是硬门槛（离线纯函数/HTTP200 不算网页实测 PASS）；严重度只排修复先后，不自动豁免。
> 初始状态：**全部 NOT_RUN**，分 AUTO / 集成 / GUI 三层；开发完成后由测试专家逐格实测回填 PASS/FAIL/BLOCKED。

## 0. 冻结决策（开发必须对齐，本矩阵据此验收）

### 0.0 AUTO/集成层执行汇总（2026-10-14，独立测试专家）

- **冻结工作树**：HEAD=`217d8ae`；client `lib/client.js` SHA=`dd66be290d2d1568742821b10713243f0790edf78fdc8c43ce703de3550f1397`。
- **build**：`pnpm build`=0（64ms）。
- **专项 verify 全绿**：
  - S1 `verify-task-move-renumber.mjs`：复合失败+回滚失败 AggregateError 聚合、外层回滚不吞错、旧 move 兼容。
  - S2 `verify-ask-apply.mjs` + `verify-ask-idempotency-integration.mjs`：settings 持久化幂等标记、跨进程新进程重放返回「已执行」、业务记录不二次更新。
  - S3 `verify-repo-format.mjs` + `verify-projects.mjs` + `verify-task-repo.mjs`：三端同 fixture 同判同文案、CLI 输出补全 repo、唯一真源无第二份正则。
- **full guard**：157 文件 hash+mtime 零污染。
- **多人红线 R1-R4 源码断言**：
  - R1 单写队列：ask.ts 写库走 `updateTask`/`enqueueDomainWrite`，无 `table.put` 绕队。
  - R2 baseline 不弱化：ask.ts L142-143 冲突比较保留，不为重启误报而降级静默覆盖。
  - R3 actor scope：`applyKeyHash` 含 `projectId + actorSegment`，可扩展加 actor 段。
  - R4 旧数据兼容：settings 表 passthrough，不新表、不触发迁移重写。
- **当前计数**：**全部 28 项 PASS**（S1: A1–A6=6、I1–I2=2、G1–G2=2；S2: A1–A8=8、I1–I2=2、G1=1；S3: A1–A5=5、I1=1、G1=1）。
- **S1-G2 裁决依据**：① 命令级 `handle task command` 真实 put 故障注入，`result.text` 含完整「移动并重新编号失败/原始错误/恢复失败(N项)」且无 stack，代码审查 APPROVE；② v0.6 R2 同 Notice/长文本渲染链已 GUI 实证（多行可滚动不截断）；③ S1-I1 磁盘/聚合形状 PASS。冻结生产 build 无故障入口 = 安全属性，不构成缺口。
- **总门：✅ PASS。** 稳定性地基批次验收通过。

### 0.1 现状勘察结论（冻结依据，逐符号引自基线 `217d8ae`）

- **S1 现状**：
  - `renumberProjectUnsafe`（`src/core/tasks.ts:486-498`）：写中途失败时逆序回滚已写记录；**若回滚本身又抛错**，已 `throw new AggregateError([error, ...rollbackErrors], '任务重新编号失败，且部分记录恢复失败')`；若回滚全部成功，则 `throw error`（原始错误）。
  - `moveTaskAndRenumber`（`src/core/tasks.ts:538-547`）外层 catch：按整项目快照 `before` **尽力回滚**，但回滚 `table.put` 用**空 `catch {}` 吞掉**（注释「回滚尽力而为；原始错误优先抛出」），随后 `throw error`。
  - **缺口（本批要验收封堵）**：外层 `moveTaskAndRenumber` 的快照回滚若中途失败，回滚错误被静默吞掉，调用方只看到原始错误、且无法区分「已干净回滚」与「回滚了一半」。
  - 既有同款先例：`src/core/backup.ts:231` 用 `cause: new AggregateError([applyError, rollbackError], 'apply 与 rollback 均失败')`——S1 的聚合口径须与之一致。
- **S2 现状**（`src/commands/ask.ts`）：
  - `recentDrafts = new Map<string, number>()`（L93）= 内存键→过期时间戳；`DRAFT_TTL_MS = 60_000`（L95）；仅当 `appliedCount > 0` 才写（L205）。
  - `inFlight = new Map<string, Promise<AskApplyResult>>()`（L94）= 内存并发去重，`finally` 里 `inFlight.delete(key)`（L208）。
  - 重复确认返回 `{kind:'success', text:'该计划已确认过，为避免重复写库未再次执行（幂等拦截）。'}`（L195）。
  - `draftKey = ${projectId}:${JSON.stringify(actions)}:${JSON.stringify(baseline)}`（L100）。
  - **缺口（本批要验收封堵）**：`recentDrafts` 纯内存——进程重启/跨进程后键丢失，重复确认会**再次执行写库**（与基线 updatedAt 不一致时还会误报「内容已被他人更新」）。
  - settings 持久化先例：`src/core/model-route.ts:106/113` 以 `domain.table('settings')` 存 `{ value, updatedAt }`——S2 成功幂等标记照此模式落 settings 表，**不新表、不把任何 token 当授权**。
- **S3 现状**：
  - 唯一真源 `src/core/repo.ts`：`repoUrlPattern` / `branchPattern`、`validateRepoRelation`（中文 issue）、`repoFieldLabels`、`omitEmptyRepoKeys`；`core/project.ts:3` 已 import 复用。
  - **漂移点**：`commands/task.ts:67`、`commands/deliverable.ts:30` 手写了重复的仓库格式文案（`http(s)://、git:// 或 git@host:org/repo.git；branch ≤64`）；`commands/task.ts:85`、`deliverable.ts:44` 手写渲染 `仓库：${repoUrl}${branch?`@${branch}`:''}`。
  - **缺口（本批要验收封堵）**：`commands/project.ts` 的 `renderProject`（L35-48）**完全没有渲染 `repoUrl/branch`**，`projectHelp`（L21-33）也未提及项目级 repo——即 core/project.ts schema 已接受这两字段，CLI `project get/add/update` 却不输出；client/project 表单口径也须与真源对齐。

### 0.1 版本与 schema 口径冻结

- **不升 domain 版本**：`core/storage.ts` 维持 `version: 2`、`compatibleVersions: [1]`。S2 复用既有 `settings` 表（`settingRecordSchema`）存幂等标记，**不新表、不动其它 record schema**；旧 v1/v2 数据读回零迁移重写。
- **backup `formatVersion` 保持 1**：本批不触碰备份版本门；S1 回归断言一次「createBackup 后 formatVersion 仍为 1」。
- **本批显式不做**：账号体系、权限模型、实时协作/多人在线、跨端同步。第 5 节红线是**架构约束**，不是本批实现项。

### 0.2 判定分层与命名

- **AUTO**：`scripts/verify-*.mjs` 专项离线可复算 + `pnpm build`=0 + full guard 零污染。
- **集成（I）**：故障注入表（monkeypatch `table.put` 第 N 次抛错）跑真实 domain + 落盘后读回断言。
- **GUI（G）**：隔离宿主 `http://127.0.0.1:3096`（独立 `DSH_HOME`/`DSH_PM_BACKUP_DIR`）真浏览器冒烟；3080/3091/正式 `data/` 全程 sha256+mtime diff 零触碰。

## 1. S1 用例（moveTaskAndRenumber 执行失败 + 回滚失败 AggregateError）

| CASE_ID | 层 | 用例 | 步骤/输入 | 通过门槛（断言） | 状态 |
|---|---|---|---|---|---|
| S1-A1 | AUTO | 普通失败 → 原始错误 + 干净回滚 | 在隔离库种子 3 任务项目；令 `renumberProjectUnsafe` 写第 2 条时抛错，且回滚全部成功 | 抛出**原始 error**（非 AggregateError）；本项目任务表读回与失败前快照逐字节一致（order/code/updatedAt 无残留） | ✅ PASS |
| S1-A2 | AUTO | 业务失败 + 内层回滚失败 → AggregateError | 令 renumber 写中途抛错，且逆序回滚 `table.put` 也抛错（`renumberProjectUnsafe` 既有路径） | 调用方收到 **`AggregateError`**；`error.errors[0]` = 原始业务错误、其后 = 各回滚错误；message 含「恢复失败」语义；不丢失原始错误身份 | ✅ PASS |
| S1-A3 | AUTO | 外层 moveTaskAndRenumber 快照回滚失败不吞错（**核心封堵**） | 先 `applyMoveUnsafe` 成功，再令 renumber 抛错；随后令外层 `before` 快照回滚 `table.put` 中途抛错 | 调用方收到的错误**聚合了原始错误 + 外层回滚错误**（不再是空 `catch{}` 静默吞掉）；错误对象可辨识为「回滚不完整」而非假装已回滚；**禁止**既不抛回滚错、又留下半套状态 | ✅ PASS |
| S1-A4 | AUTO | 聚合错误与 backup.ts 同构 | 对比 `renumberProjectUnsafe`/`moveTaskAndRenumber` 的 AggregateError 与 `backup.ts:231` 的 `cause: new AggregateError([applyError, rollbackError], …)` | 两处「apply 与 rollback 均失败」的错误形状一致（原始错在前、回滚错聚合在后、可读中文 message）；源码断言两处共用同一种错误构造口径 | ✅ PASS |
| S1-A5 | AUTO | 单写队列内事务、不并发半写 | 失败/回滚全程在 `enqueueDomainWrite` 单写链内；并发触发第二个写 | 第二个写排在回滚完成之后才执行；队列不嵌套入队死锁（承接 tasks.ts:380-382 注释口径）；磁盘最终态确定 | ✅ PASS |
| S1-A6 | AUTO | schema/信封/备份版本不抬 | 跑一轮失败→回滚→`createBackup` | storage version 仍 2、compatibleVersions 仍含 1；新备份 `formatVersion` 仍 1；无新表 | ✅ PASS |
| S1-I1 | 集成 | 故障注入表端到端落盘 | 用可注入的 fault-table：第 N 次 `put` 抛 EIO；经真实 domain 调 `moveTaskAndRenumber` | 落盘 JSON 最终可复算：要么完全等于失败前、要么错误对象诚实标注哪些记录未回滚；无「内存抛错但磁盘已半改」的撕裂 | ✅ PASS |
| S1-I2 | 集成 | 回滚不完整时 doctor 可检出 | S1-A3 制造「回滚了一半」的脏态后跑 `doctor` | doctor **只报告、不自动自愈**悬空/order 错乱（承接 V2 批红线）；不擅自重写用户数据 | ✅ PASS |
| S1-G1 | GUI | 成功路径树/code 一致回归 | 真 Chrome 3096 移动任务到新父级 | 树缩进、`code`（`1`、`1.1`）与 order 一致；无重号/跳号；宿主重启读回不变；正式 data/ 零污染 | ✅ PASS |
| S1-G2 | GUI | 故障构建错误文案可见 | 以注入构建在 GUI 触发同一复合失败 | 错误 toast/日志可见聚合错误的中文 message（原始因 + 回滚未竟），不是静默成功或泛化「操作失败」 | ✅ PASS（命令级 result.text + v0.6 R2 Notice 渲染链组合覆盖） |

## 2. S2 用例（ask-apply 幂等键短 TTL 持久化 settings / 重启去重 / inFlight 仍内存）

| CASE_ID | 层 | 用例 | 步骤/输入 | 通过门槛（断言） | 状态 |
|---|---|---|---|---|---|
| S2-A1 | AUTO | 成功即写短 TTL 标记到 settings 表 | `ask-apply` 成功应用 ≥1 条后查 `domain.table('settings')` | 写入一条幂等标记行（沿用 `{ value, updatedAt }` 形态，键名固定、含过期时间）；**不新表、不写 tasks、不写任何 token 当授权**；TTL = 60s 常量集中可查 | ✅ PASS |
| S2-A2 | AUTO | TTL 内同键重复 → 幂等拦截、零二次写 | 成功后立即同参数再确认一次 | 返回「已确认过/幂等拦截」success；**不触发第二次 `updateTask`**（appliedCount=0、磁盘 updatedAt 不变） | ✅ PASS |
| S2-A3 | AUTO | TTL 过期后标记失效、可重放 | 把系统/过期时钟拨过 60s 后再确认 | 标记被清理（或视为过期），重复确认照常执行一次；**不是永久去重** | ✅ PASS |
| S2-A4 | AUTO | 失败应用不写成功标记 | 令 `appliedCount = 0`（如全部 blocked/拒绝） | settings **不写**该幂等标记；计划可被修正后重试，不被假阳性拦截（承接 L205「仅 >0 才写」） | ✅ PASS |
| S2-A5 | AUTO | 跨进程/重启重复确认返回「已执行」而非误报冲突（**核心封堵**） | 会话 1 成功应用 → 丢弃内存 `recentDrafts`（模拟进程重启，从 settings 重读）→ 会话 2 同参数再确认 | 会话 2 返回**幂等拦截/已执行** success，**不二次写库**；**不得**因 baseline updatedAt 不一致而误报「内容已被他人更新」冲突 | ✅ PASS |
| S2-A6 | AUTO | inFlight 仍只在内存、不持久化 | 并发同键两路请求 + 查 settings | 并发两路共享同一 in-flight Promise（单写不双写）；settings **不含** in-flight 行；进程重启后 in-flight 自然清空（可接受），由 settings 成功标记兜底防重放 | ✅ PASS |
| S2-A7 | AUTO | 键作用域明确、不同 baseline/子集不误拦 | 同任务换一个重新生成的计划（不同 baseline）vs 同计划不同勾选子集 | 三者互不拦截（draftKey 含 actions + baseline 内容）；键显式含 `projectId` 作用域，跨项目绝不互相去重 | ✅ PASS |
| S2-A8 | AUTO | 标记写走单写队列、不旁路 | 源码断言 | settings 标记的 `put` 经 `enqueueDomainWrite` 单写链；**无** `table.put` 绕队直接写 | ✅ PASS |
| S2-I1 | 集成 | 双会话/双 DSH_HOME 重启往返 | 隔离 DSH_HOME：会话 A 应用 → 重建 domain（重启宿主）→ 会话 B 同参数再确认 | 会话 B 返回幂等拦截；落盘任务 `updatedAt` 自会话 A 后**未再变化**（无二次写）；正式 data/零污染 | ✅ PASS |
| S2-I2 | 集成 | TTL 时钟漂移诚实过期 | 手动把 settings 标记的过期时间写旧 → 再确认 | 视为过期、允许重放；不把过期标记当有效拦截 | ✅ PASS |
| S2-G1 | GUI | PoC plan apply + inFlight 双击只一次 + 新计划不误拦 | 真 Chrome 3096：① PoC 定向 prompt 生成计划→首次整批执行→成功文案+数据落盘；② 请求未完成时快速双击/真实 click 两次→inFlight/busy 只写一次、文案无异常；③ 重发 prompt 生成不同 actions/baseline→新 key 不被旧幂等标记误拦、照常执行（本轮实证 updatedAt 推进） | ① 首次 apply 成功文案+任务数据落盘；② 执行中按钮 disabled/aria-busy，双击不触发双写；③ 新计划（不同 actions/baseline）不被误拦；精确跨重启同 plan 幂等归 S2-I1 集成层，**不要求 UI 保留已执行 plan** | ✅ PASS |

## 3. S3 用例（项目级 repo CLI 输出与 client/core 校验真源一致）

| CASE_ID | 层 | 用例 | 步骤/输入 | 通过门槛（断言） | 状态 |
|---|---|---|---|---|---|
| S3-A1 | AUTO | 唯一真源、禁第二份正则 | 全仓 grep | project/task/deliverable 三处 repoUrl/branch 校验共同引用 `repo-format` 真源（`core/repo.ts` zod wrapper re-export，client 直引 browser-safe `repo-format`）；**全仓不存在第二份** repoUrl/branch 正则副本（源码断言） | ✅ PASS |
| S3-A2 | AUTO | 项目级 CLI 输出补全 repo | `project add/update` 带合法 repoUrl+branch，再 `project get` | `renderProject` 输出「仓库：url@branch」（空值显「未填写」），与 task/deliverable 命令渲染同形；`projectHelp` 列出 repoUrl/branch 可选说明 | ✅ PASS |
| S3-A3 | AUTO | CLI 校验文案 = 真源标签 | 项目写非法 repoUrl/branch | 中文错误经 `describeProjectValidation` → 复用 `repoFieldLabels`/`validateRepoRelation` 文案；**task/deliverable 命令里手写的格式 prose 不得是可漂移的第二份**（引用共享标签或删除重复文案） | ✅ PASS |
| S3-A4 | AUTO | 空串清除、零漂移 | `project update` 把 branch 传 `''` | 落盘该键被 `omitEmptyRepoKeys` 删除（非空串）；磁盘 diff 仅 repoUrl/branch/updatedAt，其它字段零漂移 | ✅ PASS |
| S3-A5 | AUTO | 旧项目兼容、不抬版本 | 放无 repoUrl/branch 键的旧项目记录进隔离库 | 读回按空语义处理；open 后磁盘零改写（无迁移重写）；schema version 不抬 | ✅ PASS |
| S3-I1 | 集成 | 三端同 fixture 同判 | 同一组 repoUrl/branch 合法/非法 fixture，分别过 (a) core zod、(b) CLI 命令输出/错误、(c) client 表单校验快照 | 三端**接受集合一致、拒绝集合一致、错误文案同源**；任一 fixture 不出现「core 拒而 CLI 收」或反之 | ✅ PASS |
| S3-G1 | GUI | 真浏览器项目表单 repo 往返 | 隔离 GUI 项目表单填 repoUrl+branch 保存，非法值当场保存 | 合法值落盘重启读回；非法值内联中文拦截（role=alert/aria-invalid）、零写；项目详情渲染与 CLI 一致 | ✅ PASS |

## 4. 文件边界与顺序依赖（冻结基线：v0.7.0 release `217d8ae`）

### 4.1 严格执行顺序：S1 → S2 → S3

1. **先 S1**：固化复合失败的错误聚合形状（tasks.ts）。S2 的「跨进程不误报冲突」依赖单写队列与基线比较不被弱化，须在 S1 把写/回滚纪律钉死之后做。
2. **再 S2**：把成功幂等标记持久化 settings（ask.ts）。
3. **后 S3**：补全项目级 CLI/client repo 输出并收拢到 `core/repo.ts` 真源。

### 4.2 文件边界（按模块切开，减少并行冲突）

- **S1**：`src/core/tasks.ts`（外层 catch 回滚错误聚合，与 backup.ts 同构）；`scripts/verify-task-move-renumber.mjs` 追加 S1 行。**不得碰** storage.ts 版本、backup.ts、doctor.ts。
- **S2**：`src/commands/ask.ts`（settings 持久化 + 重启重读）；settings 表新增固定键行（复用 `{ value, updatedAt }`，参考 `core/model-route.ts`）；`scripts/verify-ask-apply.mjs` 追加 S2 行。**不得**新表、不得把 inFlight Promise 持久化、不得实现账号。
- **S3**：`src/core/repo.ts`（如需导出共享渲染/标签）；`src/commands/project.ts`（renderProject + projectHelp）；`src/client/panel.tsx`（项目表单 repo 字段接线）；`scripts/verify-projects.mjs` / `verify-task-repo.mjs` 追加断言。
- **可并行**：S1（core/tasks.ts）、S2（commands/ask.ts + settings 键）、S3 后端（core/repo.ts + commands/project.ts）文件互不相交，可各自跑专项 verify。
- **串行闸门（唯一强制串行点）**：`src/client/panel.tsx` 由 S3 独占接线；本批 S1/S2 不碰 panel.tsx。
- **verify 脚本一律追加不重排**：各专项 verify 只在自己文件末尾追加本批 CASE 行，不动既有断言顺序。

## 5. 未来多人协作红线（本批冻结为架构约束，**不实现**）

> 以下是**架构红线**，本批只保证现有行为不与之冲突、并在代码注释/口径上预留扩展位；账号/权限/实时协作**本批一律不做**。

- **R1 单写队列**：一切写（含 S2 的 settings 幂等标记、S3 的项目 repo 更新）必须在 `enqueueDomainWrite` 单写链内；**禁止**任何新路径绕过队列直接 `table.put`（S2-A8 / S1-A5 即此红线的本批验收点）。
- **R2 optimistic baseline/version 冲突不可弱化**：ask-apply 的 baseline updatedAt 不一致必须**拒绝覆盖**（ask.ts:140 既有行为）；本批**不得**为「重启误报冲突」而把它降级成静默覆盖——正确做法是 S2 用幂等标记避免重放，而不是放宽冲突检测。
- **R3 幂等键作用域明确、跨用户不误去重**：`applyKeyHash` 当前含 `projectId + actorSegment`，**默认 `actorSegment=local-anonymous` 占位**；未来加入真实 actor/用户维度时直接替换该占位段，使「不同用户对同一计划的确认」**不被互相去重**。本批单用户无此问题，但冻结：键的作用域边界已预留 actor 段，禁止把当前 projectId 级键悄悄当成全局键。
- **R4 审计/actor 字段扩展位与旧数据兼容**：未来审计需要的 `actor`/操作人字段一律 optional 追加；旧记录（无该字段）读回照常、**不触发迁移重写**（承接 S1-A6/S3-A5 不抬版本口径）。
- **明确排除**：账号体系、登录鉴权、行级/字段级权限、多人实时在线与冲突合并、跨端同步——本批不验收、不实现。

## 6. 证据与判定要求

- AUTO：三个专项 verify（S1/S2/S3 各追加）+ `pnpm build`=0 + `verify-isolation.mjs` full guard 零污染；正式 `data/` 与共享 `backups/`/`exports` 前后 sha256+mtime diff。
- 集成：故障注入表 / 双 DSH_HOME 重启往返，落盘 JSON 读回断言，证据命名 `docs/verification/stability-20261014/`。
- GUI：隔离宿主 `http://127.0.0.1:3096`（独立 DSH_HOME），真 Chrome 冒烟；3080/3091/正式 data 全程不碰。
- 初始状态：全部 **NOT_RUN**。开发完成后由独立测试专家逐格实测回填 PASS/FAIL/BLOCKED；任何新提交使受影响历史结论过期，须重测后方可再引用。

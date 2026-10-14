<!--
稳定性地基 S4 批次验收矩阵（独立测试专家所有，ADL-045/047；开发前冻结，不写产品代码、不提交）。
其他角色只读引用，不得改本文件用例/断言/判定。状态只能由测试专家实测回填。
冻结日期：2026-10-14。冻结基线：HEAD `eb41b30`（package.json = 0.7.3，甘特拖拽手感热修已并线）。
承接 S1-S3（stability-batch-acceptance.md，28/28 PASS）之后的第四个稳定性批次。
三项技术项并行实施，本矩阵先冻结、后由开发落地；本文件只列用例与口径，不含任何产品实现。
-->
# 稳定性地基 S4 批次 · 验收矩阵（stability-s4）

> 是什么：为 S4 稳定性加固批次**先冻结独立验收计划**——本文件只有用例与口径，不含任何产品实现。
> 三项并行技术项（按协作分工编号）：
> - **A1 = 原子落盘顺序与失败阶段**（`src/core/fs-atomic.ts`）：`atomicWriteFile` 在 rename **之前**任一阶段失败，只清临时文件、**绝不触碰目标文件**；rename 是唯一切换点。
> - **A2 = 无 LLM 核心加载 + AI 降级 + 有 LLM 回归**（`src/core/ai-client.ts` + 命令层）：核心台账**不依赖 LLM**，无 Key/无网关时全核心离线可用；AI 不可用时优雅降级到手工/确定性路径、业务零写；有（mock）网关时一次性文本生成回归正确。
> - **A3 = verify runner 全跑聚合 / 退出码 / 资产 manifest**（`scripts/verify-isolation.mjs`）：runner 跑完全部 62 个专项脚本并**聚合全部失败**（不在首个失败 `break`），退出码契约无歧义，正式资产 before/after manifest 零污染。
> 判定纪律：`FAIL / BLOCKED / NOT_RUN` 一律 ≠ 通过；严重度只排修复先后，不自动豁免。
> **执行结果（2026-10-14 独立测试专家实测）：全部 19 项 ✅ PASS。** `pnpm build`=0（84ms）；全量 guard 跑 **62/62 专项脚本全绿**；受守护正式资产 **before=160 after=160、污染 0**；退出码 0。证据 `docs/verification/stability-s4-20261014/full-guard.txt`。本批测试专家仅回填本矩阵与索引，未改产品 src、未提交。

## 0. 冻结决策（开发必须对齐，本矩阵据此验收）

### 0.0 执行汇总（2026-10-14，独立测试专家）

- **build**：`pnpm build`=0（tsc + panel.css + tsdown，client `lib/client.js` 332.51 kB）。
- **专项**：A1 `verify-fs-atomic.mjs` 退出 0（含 A/B/C/F 成功路径顺序探针、D1/D2/D3/E 失败阶段、新 **A1-02 wx EEXIST 排他闭环**）；A2 `verify-llm-optional.mjs` 退出 0（契约 A 缺 llm 仍加载+核心台账离线+中文 NO_LLM 降级；契约 B 有 fake llm 走 generateDraft+兜底路由）；A3 `test-verify-runner-aggregate.mjs` 退出 0（不 break 跑全、失败按 exit/signal/超时分类、超时文案不误标 spawn 异常、污染独立检出、CLI 退出码）。
- **全量 guard**：`verify-isolation.mjs` 待跑 **62** 个脚本 → 通过 62 / 失败 0；资产 before=160 / after=160 / 污染 0。
- **两项后补补丁已纳入并实证**：① A1 `tmpNameFactory` 最小可测试注入 → 真实 EEXIST、目标内容/mtime 不变、预置 tmp 按上游契约清理；② A3 `describeFailure` 对 `ETIMEDOUT`/`killed` 单独分类为「超时（上限…实际…）」，不再误落「spawn 异常」。
- **总门：✅ PASS。** 稳定性地基 S4 批次验收通过（19/19）。

### 0.1 现状勘察结论（逐符号引自基线 `eb41b30`，作为冻结依据）

- **A1（`src/core/fs-atomic.ts`）现状**：
  - `atomicWriteFile`（L37-62）发布协议：同目录临时文件 `.{basename}.{uuid}.tmp`（L44）→ `open(tmp,'wx',0o600)`（L48）→ `writeFile`（L50）→ `handle.sync()` fsync 文件（L51）→ `close`（L53）→ `rename(tmp,target)` POSIX 原子覆盖（L55）→ `fsyncDirectory(dir)`（L57）。
  - `renamed` 标志（L45）+ `finally`（L58-61）：**仅当 rename 未发生**才 `rm(tmp,{force:true})`；rename 成功后 tmp 已不存在。
  - 诚实边界（L7-8 注释）：这是「单文件」崩溃可持久写，**不提供跨多记录事务**；`kill -9` 截断在跨记录序列中间仍可能留半成品，靠外部安全快照人工恢复。
  - **本批要验收钉死的口径**：rename 之前每一阶段（open/write/sync/close/rename 本身）失败 → 目标文件逐字节不变、tmp 不残留；rename 之后 → 目标已是新内容、tmp 已消失。
- **A2（`src/core/ai-client.ts`）现状**：
  - `generateDraft(llm, options)`（L108-140）：`if (!llm) throw new AiDraftError('NO_LLM', …'你仍可手工录入')`（L109-111）。
  - `HARD_ERROR_CODES`（L26）：RATE_LIMIT/QUOTA/ACCOUNT_QUOTA/INVALID_CREDENTIAL/AUTH/CONTEXT_WINDOW_EXCEEDED/MODEL_TIMEOUT/NO_LLM/NO_ADAPTER——硬错误**不跨池轮换**，直接抛原中文。
  - 模型链（L118-133）：可重试错误依次换下一池、`sleep(400)` 短退避，`tried[]` 记录尝试序列；全失败才抛聚合中文。
  - 设计原则（L4-6 注释，ADL-036）：LLM 只做一次性文本生成、**不挂 tools/function calling**；**核心台账不依赖本模块**。
  - **本批要验收钉死的口径**：无 `ctx.llm` 时核心 domain + 全部非 AI 命令离线加载跑通；AI 失败归一为友好中文、英文/stack 不外泄、业务零写；有 mock 网关时流式 chunk 经 `BlockAssembler` 组装 trim 返回。
- **A3（`scripts/verify-isolation.mjs`）现状**：
  - runner = `verify-isolation.mjs` 自身：`pickTargets()`（L122-132）默认取全部 `verify-*.mjs`、**排除自身**、排序（冻结时 60、本轮新增 A1/A2 两项后 **62** 个）。
  - 受守护 `WATCH`（L50-55）：仓库 `data/`、`packages/backups/`、`packages/backup/`、`exports/`；`buildManifest`（L91-104）逐文件 sha256+mtimeMs，缺失 root 记 `!!MISSING`；`diff`（L109-119）分类 新增/删除/内容变化。
  - `scrubbedEnv`（L59-68）：剔除 `PM_DATA_ROOT`/`DSH_PM_BACKUP_DIR`，**只打变量名不打值**。
  - **缺口（本批要验收封堵）**：主循环 L157-161 任一子进程非零退出即 `failures.push(...); break`——**首个失败就中止、不跑后续脚本、不聚合全部失败**。本批要求改为**跑完全部 target 并聚合每个失败名+退出码**。
  - 退出码现状：有失败 → `process.exit(1)`（L170）；有污染 → `process.exit(1)`（L175）；全绿且 diff 空 → `process.exit(0)`（L177 隐式）。
  - 纯函数复用：`walk/buildManifest/diff/WATCH` 被 `scripts/test-isolation-guard.mjs` import，对 tmp fixture 断言新增/变化/删除/缺 root 均判 FAIL、零变化判 PASS。

### 0.1 版本与 schema 口径冻结（红线）

- **不升 domain 版本**：`core/storage.ts` 维持 `version: 2`、`compatibleVersions: [1]`。A1/A2/A3 均**不新表、不动任何 record schema、不触发迁移重写**；旧 v1/v2 数据读回零改写。
- **backup `formatVersion` 保持 1**：本批不触碰备份版本门。
- **零业务数据改写**：本批任何用例不得对正式 `data/` 做写/改/删；A1 的故障注入只在隔离 tmp 库；A2 的降级/回归只用 mock gateway；A3 的 runner 只在 `os.tmpdir()` 子进程跑。
- **离线无网络**：A2 的「有 LLM 回归」一律用 **mock `LlmGateway`**（鸭子类型 `prepareCall`），**不发真实网络请求、不读真实 API Key**；PoC/prod 真实 Key 路径沿用既有 MANUAL_PENDING，不进本批 AUTO 门。
- **本批显式不做**：账号/权限/实时协作、跨端同步、跨记录多写事务（A1 诚实边界，不越界声称）。

### 0.2 判定分层与命名

- **AUTO**：`scripts/verify-*.mjs` 专项离线可复算 + `pnpm build`=0 + runner full guard 零污染；LLM 一律 mock、网络全断。
- **集成（I）**：故障注入表 / mock gateway / tmp 隔离库，落盘后读回断言；A3 真跑全量 62 脚本。
- **GUI（G）**：隔离宿主真浏览器冒烟（独立 `DSH_HOME`/端口）；正式 `data/`/`backups/`/`exports` 全程 sha256+mtime diff 零触碰。

> 命名说明：协作分工把 S4 三项技术项记为 **A1/A2/A3**（A1=原子、A2=LLM、A3=runner）；表内「层」列另标 AUTO/集成/GUI，二者正交、不混淆。

## 1. S4-A1 用例（原子落盘顺序与失败阶段 · fs-atomic.ts）

| CASE_ID | 层 | 用例 | 步骤/输入 | 通过门槛（断言） | 状态 |
|---|---|---|---|---|---|
| S4-A1-01 | AUTO | rename 前任一阶段失败 → 目标逐字节不变 + tmp 不残留 | 已有目标文件内容 `OLD`；分别 monkeypatch 让 open('wx')/writeFile/handle.sync/close/rename 任一步抛错 | 每次：目标文件读回仍为 `OLD`（无半写/撕裂）；目标同目录下**无** `.{base}.*.tmp` 残留；错误原样上抛（不被吞） | ✅ PASS |
| S4-A1-02 | AUTO | 同目录 + 'wx' + mode 0o600（原子前提） | 源码断言 + 行为验证 | tmp 与 target 同目录（同文件系统，POSIX rename 才原子）；`open(tmp,'wx')` 对已存在 tmp 即失败（不覆盖他人临时产物）；产物 mode=0o600 | ✅ PASS |
| S4-A1-03 | AUTO | rename 成功 → 目标=新内容、tmp 已消失、目录 fsync | 正常写一次 | 目标读回 = 新 `NEW`；目标同目录无 tmp 残留；POSIX 下父目录项 fsync 完成（Windows 按既有跳过，不报错） | ✅ PASS |
| S4-A1-04 | 集成 | 故障注入真实落盘、无撕裂 | target 已存在 `OLD`；令 writeFile 中途抛 EIO（磁盘满） | 落盘 JSON/文件读回**要么完全是 OLD、要么完全是 NEW**，绝无「半 NEW」；磁盘上不出现指向 target 的半成品 | ✅ PASS |
| S4-A1-05 | 集成 | 诚实边界：不越界声称跨记录事务 | 跨多记录写序列中途 kill -9 风格故障注入 | 文档/注释诚实声明「单文件崩溃可持久、不提供跨记录事务」；半成品态由 `doctor` **只报告、不自动自愈**（承接 V2/S1 红线）；不谎称「整批已事务提交」 | ✅ PASS |
| S4-A1-06 | AUTO | schema/信封/备份版本不抬 | atomicWriteFile 被 settings/备份等复用后跑一轮 | storage version 仍 2、compatibleVersions 仍含 1；新备份 `formatVersion` 仍 1；无新表、无业务字段迁移重写 | ✅ PASS |

## 2. S4-A2 用例（无 LLM 核心加载 + AI 降级 + 有 LLM 回归 · ai-client.ts）

| CASE_ID | 层 | 用例 | 步骤/输入 | 通过门槛（断言） | 状态 |
|---|---|---|---|---|---|
| S4-A2-01 | AUTO | 无 `llm` 即 NO_LLM 降级 | `generateDraft(undefined, {system,user})` | 抛 `AiDraftError` 且 `code==='NO_LLM'`；中文文案含「手工录入/AI 草稿不可用」语义；**不发任何请求、不读 Key**；调用方业务零写 | ✅ PASS |
| S4-A2-02 | AUTO | 无 LLM 下核心完整离线加载 | 不提供 `ctx.llm`，`apply(ctx)` 后跑非 AI 命令族（project/task/backup/restore/doctor/export/search…） | domain apply 无顶层 throw；全部确定性命令离线跑通；核心台账读写不依赖 LLM；无 required-Key 启动失败 | ✅ PASS |
| S4-A2-03 | AUTO | 错误归一为友好中文、英文/stack 不外泄 | mock gateway 分别抛 RATE_LIMIT/QUOTA/AUTH/CONTEXT_WINDOW/MODEL_TIMEOUT/AbortError | 归一为 `AiDraftError` 中文文案（限流/额度/鉴权/超长/超时各有对应人话）；**原始英文 message / stack / provider key 不直泄**到命令层；业务记录零写 | ✅ PASS |
| S4-A2-04 | AUTO | 硬错误不跨池轮换、可重试才换池退避 | 链上第 1 池抛 HARD_ERROR（如 AUTH）vs 抛可重试错误（如 EMPTY_RESPONSE） | 硬错误**立即 break 抛原中文、不换下一池**；可重试错误依次换池、`tried[]` 记录序列、400ms 短退避；全败才抛聚合中文 | ✅ PASS |
| S4-A2-05 | AUTO | 有 mock LLM 回归：流式组装 + 空/超限 | mock `prepareCall` 返回 `stream`：(a) 正常文本 chunk；(b) finish=max-tokens 正文空 | (a) 组装 trim 后返回正文；(b) 抛 `MAX_TOKENS` 中文文案；**不挂 tools/function calling**（ADL-036 一次性文本）；不泄露 Key | ✅ PASS |
| S4-A2-06 | 集成 | 命令端到端：无 LLM 走手工、有 mock LLM 出草稿 | (a) 无 llm 调 AI 命令；(b) 注入 mock gateway 调同一命令 | (a) 返回降级文案、台账记录仍可手工录入、零写；(b) 返回 AI 草稿文本；两条路径落盘 schema 一致、不写 token 当授权 | ✅ PASS |
| S4-A2-07 | AUTO | 全程离线无网络 + NO_ADAPTER 点名 | 断网/无真实 Key；mock 抛 NO_ADAPTER | 所有 A2 用例仅用 mock gateway、零真实出站请求；NO_ADAPTER 文案**点名本次实际 attempted provider**（缺省才回退兜底常量，不误报 our-free-model） | ✅ PASS |

## 3. S4-A3 用例（runner 全跑聚合 / 退出码 / 资产 manifest · verify-isolation.mjs）

| CASE_ID | 层 | 用例 | 步骤/输入 | 通过门槛（断言） | 状态 |
|---|---|---|---|---|---|
| S4-A3-01 | AUTO | 全跑聚合：首个失败不中止、跑完并列出全部失败（**核心封堵**） | 在 tmp scripts 目录造 3 个目标：脚本1 通过、脚本2 非零、脚本3 非零；跑 runner | runner **跑完全部 3 个 target**（不 break）；聚合报告列出脚本2 与脚本3 各自名+退出码；**不是**只报第一个失败就停 | ✅ PASS |
| S4-A3-02 | AUTO | 退出码契约无歧义 | 四种情形：全绿+零污染 / 有脚本失败 / 有资产污染 / 脚本失败且有污染 | 全绿+diff 空 → exit **0**；任一脚本非零 **或** manifest 有 diff → exit **非零**；**禁止**「有脚本失败却 exit 0」「有污染却 exit 0」 | ✅ PASS |
| S4-A3-03 | AUTO | 资产 manifest：四 root + sha256+mtime + 缺 root MISSING + diff 分类 | 读 `WATCH`/`buildManifest`/`diff` 纯函数；tmp fixture 造 新增/内容变(hash)/mtime 变/删除/缺 root | 逐文件 sha256+mtimeMs；缺失 root 记 `!!MISSING`（语义稳定）；diff 正确分类 新增/删除/内容变化；before/after 文件数打印 | ✅ PASS |
| S4-A3-04 | AUTO | env scrub + 默认/显式 target | 查子进程 env；分别不带参 / 带显式 argv 子集 | 子进程剔除 `PM_DATA_ROOT`/`DSH_PM_BACKUP_DIR`（**只打变量名、绝不打值**）；默认=全部 `verify-*.mjs` 除自身、排序；argv 显式指定则只跑子集 | ✅ PASS |
| S4-A3-05 | AUTO | 不递归自身 + import 不 spawn | 查 `pickTargets` 与 `invokedDirectly` | target 列表**排除 `verify-isolation.mjs`**（不递归）；被 `test-isolation-guard.mjs` import 时只导出纯函数、**不 spawn 任何子进程** | ✅ PASS |
| S4-A3-06 | 集成 | 真跑全量 62 脚本 + build=0 + 正式资产零污染 | `pnpm build`=0 后 runner 全量跑 | 本轮 **62** 个专项 verify 全跑（通过 62/失败 0）；正式 `data/`/`packages/backups/`/`packages/backup/`/`exports/` before=after=**160**、sha256+mtime **零变化**；复用 `test-isolation-guard.mjs` 同一套 hash+mtime 语义 | ✅ PASS |

## 4. 文件边界与并行分工（冻结基线：HEAD `eb41b30`，v0.7.3）

### 4.1 三项并行、文件互不相交

- **A1**：`src/core/fs-atomic.ts`（钉死失败阶段口径，不改对外签名）；`scripts/` 追加 A1 专项故障注入 verify。**不得碰** storage.ts 版本、backup.ts 对外格式、doctor.ts。
- **A2**：`src/core/ai-client.ts`（降级/归一/链口径）+ 命令层降级路径接线；`scripts/` 追加 A2 mock-gateway 专项 verify。**不得**把 mock 当真实 Key、不得为 AI 路径新表/改 schema。
- **A3**：`scripts/verify-isolation.mjs`（全跑聚合 + 退出码）；纯函数 `walk/buildManifest/diff/WATCH` 语义保持，`scripts/test-isolation-guard.mjs` 复用。**不得**把 WATCH 受守护 root 缩小或放大。
- **可并行**：A1（core/fs-atomic.ts）、A2（core/ai-client.ts + 命令层）、A3（scripts/verify-isolation.mjs）文件互不相交，可各自跑专项 verify。
- **串行闸门**：本批**不碰** `src/client/panel.tsx`（GUI 层仅隔离冒烟，不接线新功能）。
- **verify 脚本一律追加不重排**：各专项 verify 只在自己文件末尾追加本批 CASE 行，不动既有断言顺序。

## 5. 未来协作红线（本批冻结为约束，**不实现**）

- **R1 零 schema / 零业务数据改写**：不升 storage version、不新表、不改任何 record schema、不做迁移重写；backup `formatVersion` 保持 1。一切复用既有 settings/记录形态。
- **R2 离线无网络**：本批 AUTO/集成全程离线；LLM 一律 mock gateway，不发真实请求、不读真实 Key；真实 PoC/prod Key 路径沿用 MANUAL_PENDING，不进本批自动门。
- **R3 单写队列不破**：A1 的原子写、A2 的降级后任何落盘（若有）仍走 `enqueueDomainWrite` 单写链；**禁止**任何新路径绕队直接 `table.put`（承接 S1/S2 红线）。
- **R4 降级不吞错、不弱化冲突检测**：AI 降级返回友好中文但**不假装成功**；optimistic baseline 冲突仍拒绝覆盖，不得为「无 LLM 顺手」而放宽数据校验（承接 S2 R2）。
- **R5 诚实边界**：A1 不越界声称跨记录事务；A3 runner 不把「首个失败即停」包装成「全量已跑」。
- **明确排除**：账号体系、权限、多人实时在线与冲突合并、跨端同步——本批不验收、不实现。

## 6. 证据与判定要求

- **verifier / diff check**：AUTO 以专项 verify 退出码 + `pnpm build`=0 + runner full guard 的 sha256+mtime diff 为准；正式 `data/`/`packages/backups`/`exports` 前后 manifest 逐字节比对，证据命名 `docs/verification/stability-s4-20261014/`。
- **集成**：故障注入表 / mock gateway / tmp 隔离库，落盘 JSON 读回断言；A3 全量 62 脚本输出与退出码存档（`docs/verification/stability-s4-20261014/full-guard.txt`）。
- **GUI**：本批三项均为离线 AUTO/集成契约，无需新 GUI 接线；沿用既有隔离宿主冒烟口径，不重复阻塞 H1–H6。
- 执行状态：**全部 19 项 ✅ PASS**（2026-10-14 实测回填）。测试专家本人未改产品 src、未 git commit。任何新提交使受影响历史结论过期，须重测后方可再引用。

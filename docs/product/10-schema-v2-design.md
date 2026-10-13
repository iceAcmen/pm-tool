<!--
产出角色：资深产品经理 / 设计裁决落档
日期：2026-10-13（状态回写：当日已实现并独立验收总门 PASS）
变更摘要：v0.6.0 schema v2 批（PROD-11 任务 predecessorIds 依赖 / PROD-21 项目 repoUrl·branch / PROD-23 项目健康分 + 崩溃原子恢复）定稿为 P0 设计稿。所有者最终裁决（见 §二各节）：domain v2 + compatibleVersions[1] 同 commit；全部新字段 optional；健康分纯派生不落盘；坏记录 clean fail 中文诊断不静默隔离；备份原子写、恢复失败内存快照回滚；backup formatVersion 保持 1 且兼容旧备份。**已实现并通过独立验收总门 PASS（50 用例 = 48 PASS + 2 MANUAL_PENDING G8/H5，绑定提交 17ccc82 + 4b533ad）。**
-->

# 10 · schema v2 批（依赖 / 仓库 / 健康分 / 崩溃恢复）设计稿 · 契约已定 · 已实现·独立验收总门 PASS

> 本文是 v0.6.0「架构演进」批的唯一产品契约：**PROD-11** 任务 `predecessorIds[]` 前置依赖、**PROD-21** 项目 `repoUrl/branch`、**PROD-23** 项目健康分（概览红黄绿灯）、以及与之同批的**崩溃原子恢复**（备份原子写 + 恢复回滚 + `/pm doctor` 只读体检）。
> **状态（2026-10-13）：已实现并通过独立验收总门 PASS。** 验收矩阵（`docs/testing/schema-v2-acceptance.md`，测试专家所有）签发：**50 用例 = 48 PASS + 2 MANUAL_PENDING（V2-G8 面板备份/恢复按钮人工不可逆确认、V2-H5 删除被引用前置/恢复备份人工确认，按 ADL-047 分层登记、不阻塞自动化门/GUI 门）**；无 FAIL / BLOCKED / NOT_RUN；绑定提交 `17ccc82`（schema v2 依赖/仓库/健康诊断）+ `4b533ad`（原子化备份并恢复失败自动回滚）。build=0、full guard=0（151 文件零污染）。
> **三条红线不可破**：离线优先 / 单用户本地 / 所有写动作经既有 `/pm ...` 统一写通道。
> 基线代码事实（只读核查结论，勿重复调研）：
> - domain 定义在 `src/core/storage.ts`（`pmDomainSpec`，version 1，9 表，per-record 扁平布局）；记录 envelope `{version, record}`，单记录写入由 `dsh-storage-json` 保证（同目录临时文件 → fsync → rename 原子替换 → 目录 fsync）。
> - 写通道：`enqueueDomainWrite`（WeakMap 单飞队列）；`moveTaskAndRenumber` 已有「快照 + 尽力回滚」，但只覆盖进程内错误，**进程被杀时多条记录之间不是事务**。
> - 删除保护范式已存在：`TaskHasChildrenError`、`TaskReferencedByMeetingError`、`ProjectHas*Error`——PROD-11 照此加第三种跨记录保护。
> - 派生只读模块范式：`core/stats.ts`（ProjectStats 已有 overdueTasks / taskBlocked / openRiskByImpact / milestoneOverdue / completionRate）——健康分直接建在它上面。
> - 备份现状（`core/backup.ts`）：`format: 'pm-tool-backup'`、`formatVersion: 1`；恢复前自动安全快照；`createBackup` 当前是直接 `writeFile` 落最终路径（**本批要改为临时文件 + fsync + rename**）。

---

## 一、迭代定位与总原则

- 对应路线：`05-roadmap-and-tasks.md` v0.6.0 行——「domain v2 + 排期可视化」。PROD-22 甘特方案A已实现（只读条 + 拖拽改期），本批**不重复**。
- **domain version 1 → 2，且 compatibleVersions 必须包含 [1]，同一 commit 内落地**（所有者裁决）：v2 代码必须能读回 v1 时代写出的记录文件；旧数据零迁移重写、零人工介入。
- **新字段全部 optional**：缺省即 v1 行为，不填与今天完全等价；读旧记录（无该字段）不得报错。
- **健康分不落盘**：纯派生读数（仿 stats / reminders / people-load），不新增表、不写 settings。
- **不承诺跨进程 / 跨记录 ACID**：单条记录原子由底层保证；多条复合动作在崩溃时可能部分完成——恢复策略是「**打得开 + 查得清 + 可回滚**」，退路是既有 R18 备份/恢复。

## 二、PROD-11 · 任务 predecessorIds 前置依赖（P0，M）

### 用户故事
- **US-11a**：PM 建任务 B 时把「设计稿完成（t-0002）」设为前置；在 B 的抽屉看到一行 chips「前置：t-0002 设计稿完成」。
- **US-11b**：前置任务没完成时，B 行尾出现只读小标签「等待前置」（title 列出具体前置）；**系统不自动把 B 的 status 改成 blocked**，改不改状态仍由人定。
- **US-11c**：把 B 设为 t-0002 的前置会形成环 → 后端直接拒绝，中文说明，数据零变化。
- **US-11d**：有人想删 t-0002，而 B 仍依赖它 → 拒绝删除并点名「t-0002 仍被 t-0003 前置依赖，请先在 t-0003 解除」。

### 裁决边界（所有者拍板）
1. **字段**：task 记录新增 `predecessorIds?: string[]`，optional，缺省 `[]`。create/update 都接受；语义=**整体替换**，传 `[]` 即清空。
2. **写时校验（写队列内，仿 milestone 关系校验）**：每个 id 必须存在且**同项目**；禁止自指；沿 predecessor 边 DFS 不得回到自身（成环拒绝）。校验不过即中文报错、不写盘。
3. **删除保护**：`deleteTask` / `deleteTaskCascade` 删除前扫描，任何其他任务的 `predecessorIds` 引用被删任务 → 抛新 `TaskReferencedByPredecessorError`，文案点名引用方任务 id。
4. **阻塞派生只读**：`blockedBy` = 前置中 `status !== 'done'` 的任务列表，仅用于行内「等待前置」标签；**不回写 status**（防越权改写）。
5. **悬空引用处理（重要）**：`predecessorIds` 指向的任务若已不存在/跨项目——**doctor 只报告，不自动改**；修复必须由用户显式确认（见 §五 doctor），不做静默自愈。
6. **甘特依赖箭头**：P1（后续批），本批不做；关键路径自动排期维持「长期观望」。

### P0 验收条件
1. 新任务可设前置；旧任务记录读回无该字段，按 `[]` 处理、列表与详情行为与今天一致。
2. 环依赖（A→B→A）被拒绝；跨项目/自指/指向不存在任务被拒绝；报错全中文、盘上零变化。
3. 前置未完成时 B 显示「等待前置」；前置 done 后标签消失；B 的 status 全程不被系统改动。
4. 删除被引用任务被拒，且提示点名引用方；先解除依赖后删除成功。
5. 同数据两次启动读回，依赖关系渲染一致（确定性）。

### 文件级改动（预估）
- `src/core/task.ts`：`predecessorIds` 入 taskFields/create/update schema + describeTaskValidation 标签。
- `src/core/tasks.ts`：关系校验 + 环检测 DFS + 删除引用保护（新错误类）。
- `src/commands/task.ts`：create/update 透传。
- `src/client/panel.tsx`（+css）：TaskForm 前置依赖多选（同项目、排除自身）、任务行「等待前置」标签。
- `scripts/verify-predecessors.mjs`（新）。

## 三、PROD-21 · 项目 repoUrl / branch（P0，S-M）

### 用户故事
- **US-21a**：PM 在项目表单填好仓库地址与分支，概览页出现只读一行「仓库 org/repo ↗（main）」，点开新窗口直达；留空时该行不出现。
- **US-21b**：粘一个明显不像 URL 的值 → 表单内联中文报错，保存按钮不发请求；**全程不联网探测仓库是否真实存在**（离线优先）。

### 裁决边界（所有者拍板）
1. **字段位置：项目级**（`repoUrl?: string`、`branch?: string`，optional，缺省 `''`）。路线图原文提到的「任务/交付物级 repoUrl/branch」降级为 **P1 扩展**，本批不做。
2. **校验**：repoUrl 为空或匹配宽松 URL/git 正则即合法；branch ≤64 字符、不含空白/控制符；格式错误中文报错。**不做任何网络请求、不校验可访问性**。
3. **展示**：项目表单两个可选输入；概览只读一行，anchor `target=_blank rel=noopener`；为空不渲染。

### P0 验收条件
1. 项目表单可填/改/清空 repoUrl·branch；概览只读链接可点击打开；留空不显示。
2. 非法格式（非 URL、branch 含空白）被内联拒绝；合法值重启读回正确。
3. 整个流程无任何出站网络请求（verify 可断言无 fetch/探测）。

### 文件级改动（预估）
- `src/core/project.ts`：两字段 + 宽松正则校验 + describeProjectValidation 标签。
- `src/commands/project.ts`：透传。
- `src/client/panel.tsx`：ProjectForm 两输入、Overview 只读仓库行。
- `scripts/verify-projects.mjs` 扩展。

## 四、PROD-23 · 项目健康分（概览红黄绿灯，P0，M）

### 用户故事
- **US-23a**：PM 打开项目概览，顶部一张「项目健康」卡：● 78 黄灯，下方小字列出扣分由来（逾期任务×2 -6、高影响风险×1 -6…）；点一眼就知道要先处理什么。
- **US-23b**：一个还没拆任务的新项目 → 健康卡显示**灰色「数据不足」**，不出分、不硬算 0 分。

### 裁决边界（所有者拍板）
1. **纯派生、不落盘**：新 `core/health.ts` 纯函数，输入 domain + projectId + 注入的 today；基于既有 `collectStats` 的 ProjectStats 计算；不新增表、不写 settings、不进备份快照的计算口径变化列表。
2. **确定性公式**：基础分 100，逐项扣分（各项封顶，同数据两次计算逐字节一致）：
   - 逾期未完成任务：-3/个，封顶 -15；
   - 受阻任务（status=blocked）：-4/个，封顶 -12；
   - 未闭环风险 high / critical：-6 / -10 每个，封顶 -20；
   - 逾期里程碑：-8/个，封顶 -16。
   下限 0；**任务数=0 → 不出分，灯灰「数据不足」**。
3. **灯号**：≥80 绿 / 60–79 黄 / <60 红。factors[] 每条带中文标签+计数+扣分，UI 原样展开。
4. **不过度承诺**：卡上固定小字「健康参考分（自动计算，仅供排期参考，不做绩效评价）」。
5. **范围**：仅单项目概览卡；项目列表卡同步灯号、一键周报草稿复用 narrate → P1。

### P0 验收条件
1. 注入 today 构造 fixture：分数精确等于公式结果（含封顶边界）；同输入两次运行结果一致。
2. 空项目出灰灯、不出分；扣分列表逐条可对回 stats 数字。
3. 概览卡可见（稳定选择器），文案含「仅供排期参考」。

### 文件级改动（预估）
- `src/core/health.ts`（新）：纯函数 + 阈值表。
- `src/commands/stats.ts`：追加一行健康分输出。
- `src/client/panel.tsx`：Overview 摘要格新增健康卡（灯色+分数+扣分项列表）。
- `scripts/verify-health.mjs`（新）。

## 五、崩溃原子恢复（P0，M-L，同批交付）

### 诚实前提（不虚构 ACID）
单条记录写入已是原子（临时文件 + fsync + rename + 目录 fsync）。会留的尾巴：① 表目录 `.*.tmp` 残留；② 某条记录坏/手改坏 → open 直接 `invalid-record` 打不开工作台；③ 复合写中途被杀 → 记录间引用悬空（孤儿 parentId、predecessorIds 悬空、milestoneId 悬空）。**跨记录事务/WAL 明确不做。**

### 用户故事
- **US-RCa**：我批量改父+重编号时 dsh 被杀，重开工作台——工作台**能打开**；顶部横幅告诉我：检出 N 条悬空/不一致引用；未损坏的记录一条不丢；我可以凭已有备份回到完好状态。
- **US-RCb**：我手改坏了一条 JSON → 启动时**干净失败**，报错中文写明「记录 <table>/<key>（路径 …）不符合数据格式」，而不是悄悄把它藏起来。

### 裁决边界（所有者拍板）
1. **坏记录：clean fail + 路径中文诊断**。**不启用** `invalidRecords: 'backup-and-skip'` 静默移走记录；open 捕获 `invalid-record` 后抛中文错误，点名表、键、文件路径，由人决定怎么处理（配合备份恢复）。
2. **createBackup 原子写**：写备份走同目录临时文件 → fsync → rename 到最终路径（对齐 storage-json publish 协议）；目录 0700、文件 0600 不变。
3. **restore 失败自动回滚**：预检通过后、清空表之前，先把当前七表整体留在内存快照里；替换过程任一步失败 → 按内存快照整体写回，并提示安全快照路径；仍**不承诺跨进程崩溃时的跨记录一致**（进程被杀时退化为「用安全快照文件再 restore 一次」）。
4. **backup formatVersion 保持 1**：`validateBackup` 继续接受既有 v1 备份文件；新旧备份互读不拒绝。
5. **`/pm doctor` P0 只读**：遍历加载后的表做确定性体检——孤儿 parentId、parent 跨项目、predecessorIds 悬空、milestoneId 悬空、残留 `.tmp` 文件；输出中文报告。**只报告不改**；修复动作（如解除悬空依赖）必须用户显式确认（`confirm` / Web 按钮）才执行。
6. 启动横幅只展示 doctor 摘要计数，不自动修复任何记录。

### P0 验收条件
1. 人工塞坏 JSON 进某记录 → 启动干净失败，报错含表名/键/文件路径；工作台其余记录不被悄悄处理。
2. 留 `.*.tmp` 文件 → doctor 报告列出（只读，不自动删）。
3. 造一条 predecessorIds 悬空记录 → doctor 列出；不带 confirm 不修改；带 confirm 后该引用被移除且有日志。
4. 模拟 restore 中途失败 → 内存快照回滚，数据回到 restore 前；安全快照路径提示正确。
5. 旧 v1 备份文件可正常 restore；新导出备份 formatVersion 仍为 1。

### 文件级改动（预估）
- `src/core/storage.ts`：version 2 + compatibleVersions [1]；open 失败包装成中文诊断。
- `src/core/backup.ts`：createBackup 原子写；restore 内存快照回滚。
- `src/core/recovery.ts`（新）：doctor 纯函数（体检 + 显式确认才修复悬空引用）。
- `src/commands/doctor.ts`（新）；`src/commands/backup.ts` 文案补「恢复失败已自动回滚」。
- `scripts/verify-recovery.mjs`（新）、`verify-backup.mjs` 扩展原子写/回滚用例。

## 六、不做什么（本批边界）

- 不做甘特依赖箭头、关键路径自动排期（P1 / 长期观望）。
- 不做任务/交付物级 repoUrl·branch（P1 扩展）。
- 不做健康分项目列表灯号、周报草稿自动生成（P1）。
- 不启用 backup-and-skip 静默隔离坏记录；不做任何悬空引用自动自愈。
- 不做跨记录/跨进程事务、不做 WAL。
- 不联网验证仓库地址可访问性。
- 本批 docs-only 阶段：不改 `src/`、不改 `docs/testing/`、不翻转任何既有 PROD 的完成状态。

## 七、状态与门控

- **当前状态（2026-10-13）：已实现并通过独立验收总门 PASS——50 用例 = 48 PASS + 2 MANUAL_PENDING（V2-G8 / V2-H5 不可逆人工动作，待用户本人执行时据实回填）**（绑定提交 `17ccc82` + `4b533ad`；矩阵 `docs/testing/schema-v2-acceptance.md`，证据 `docs/verification/gui-schema-v2-20261013/`）。落地物：domain v2 + compatibleVersions[1]、任务 `predecessorIds`、项目 `repoUrl/branch`、`core/health.ts`、`core/recovery.ts`（doctor）、`backup.ts` 原子写+恢复回滚、5 个新增 verify 专项。
- **诚实边界**：G8/H5 两项不可逆动作（面板备份/恢复确认、删除被引用前置/恢复备份）按 ADL-047 不阻塞总门，但仍须用户本人在面板执行确认后才算最终闭环。
- 路线图登记：`docs/product/05-roadmap-and-tasks.md` v0.6.0 行与 2026-10-13 勘误；requirements 登记：`docs/requirements.md` 变更提案节。

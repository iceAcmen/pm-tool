<!--
v0.8 客观进度（objective progress）第一版验收矩阵（独立测试专家所有，ADL-045/047；开发前冻结，不写产品代码、不提交）。
其他角色只读引用，不得改本文件用例/断言/判定。状态只能由测试专家实测回填。
冻结日期：2026-10-15。实施基线：v0.7.4 HEAD `5fdb2d7`。
经所有者最终两规则裁决，覆盖此前 M3/M5 冲突方案：删除「done=100 优先 / 全勾封顶 90 / legacy 进 rollup」。
本文件只列用例与口径，不含任何产品实现。人工 override / effort / evidence link / doneAt 明确 deferred（见 §10）。
war-room doing bug 为独立热修先行项，不纳入本矩阵实现。
-->
# v0.8 客观进度 · 验收矩阵（objective-progress）

> 是什么：为 v0.8「客观进度」第一版**先冻结独立验收计划**——本文件只有用例与口径，不含任何产品实现。
> 一句话目标：**清单完成度只从 checklist 客观派生**；没有非空 checklist 就诚实 `value=null`（界面「证据不足」），绝不因 status=done 或历史手填 progress 伪造一个清单百分比。
> **最终两规则（覆盖此前冲突条款）**：
> ① 清单百分比 = `checked/total`，**全勾即 100%**；全勾但 `status!=done` 仅挂独立「待验收」标签——**不封顶 90、不自动改 status**。
> ② parent 只汇总**有非空 checklist 的后代叶子**（等权均值），**不混入历史 manual**；legacy progress（含 0）保留原值单独旁注；无 checklist → objective=null。
> 判定纪律：`FAIL / BLOCKED / NOT_RUN` 一律 ≠ 通过；严重度只排修复先后，不自动豁免。
> 初始状态：**全部 NOT_RUN**，分 AUTO / 集成 / GUI 三层。开发完成后由测试专家逐格实测回填。

## 0. 冻结决策（开发必须对齐，本矩阵据此验收）

### 0.0 现状勘察（引自基线 `5fdb2d7` / v0.7.4）

- **任务记录**（`src/core/task.ts`）：`taskRecordSchema` strictObject，现有 `progress: int 0..100`（**纯手填、旧记录必填**）、`status: todo/in_progress/blocked/done`。现状无 checklist、无派生真源。
- **现有进度消费点（本批统一到同一真源）**：
  - 甘特 `src/core/gantt.ts` `progressRatio`：`progress/100`；`status==='done'` 或 `progress>=100` 为完成态。
  - 汇报 `src/core/progress-reports.ts`：`averageProgress = Math.round(Σ task.progress / tasks.length)`——**对全部任务（含父/中间节点、含手填）平均，正是本批要纠正的口径**。
  - 快照 `src/core/progress-report.ts` tasks：`averageProgress: int 0..100`（本批加 `calcVersion` 并允许 `null`）。
  - 相邻对比 `src/core/report-diff.ts` `diffAgainstPrevious`：当前直接 `current - previous`（本批加异版本/一侧 null → delta=null）。
- **写路径**：`src/commands/task.ts` 落盘走单写链；任何 checklist 写不得绕队列直 `table.put`。
- **doctor**：承接 V2/S4 红线——只报告、不自动自愈、不自动迁移。

### 0.1 精简契约（公共 API 已冻结，类型名与开发一致）

**真源模块 `src/core/progress-derivation.ts`（纯函数、无副作用、无写库）**：
- `deriveProgressMap(tasks)`：**一次迭代、后序遍历 O(n)**，返回 `Map<taskId, TaskProgress>`。项目/父汇总在**同一次树计算**内完成、**只取叶子**（不再把父/中间节点均值进去）。
- `deriveTaskProgress(taskId, contextOrMap)`：便捷单点查询（参数不强绑，行为优先，内部复用同一份树计算结果）。

```ts
// schema：task 唯一新增 = 可选 checklist（不要 progressMode、不要 doneAt）
type ChecklistItem = { id: string; text: string; done: boolean }
// taskRecordSchema 增：checklist?: ChecklistItem[]

// 权威返回结构（叶子/父统一用此形状）
type TaskProgress = {
  value: number | null                                  // 有客观清单信号 0..100；无 = null（证据不足）
  source: 'checklist' | 'rollup' | 'none'              // 叶子来自 checklist；父/项目汇总来自 rollup；无信号 none
  checklist: { checked: number; total: number } | null // 叶子清单 3/5 单独字段；父节点为 null（不复用 coverage 语义）
  coverage: { coveredLeaves: number; totalLeaves: number } // 父=有非空清单后代叶子数 / 全部后代叶子数；叶子=自身清单口径
  pendingAcceptance: boolean                           // 全勾且 status!=='done'
  pendingAcceptanceCount: number                        // 子树内待验收节点计数
  legacyProgress: number | null                         // 历史手填 progress 原值单独带出，仅供旁注；绝不入 objective
  warnings: string[]                                   // 软告警 + 异常降级（见 §4/§5）都进这里
}

// 取值规则（业务已冻结不再变）：
//  · 叶子有非空 checklist → value = checked/total（全勾=100）；否则 value=null（source='none'）
//  · 父/项目 rollup → 只对「有非空 checklist 的后代叶子」等权；无 covered → value=null
//  · value 由原始分数汇总后**仅最终一次 round**（中间节点不逐节点 round，避免累积误差）
//  · legacy 一律不入 objective；status=done 不把无清单叶子伪造 100
//  · 全勾 && status!=='done' → pendingAcceptance=true（独立标签，不封顶 90、不改 status）
//  · status==='done' && 清单 checked<total → warnings 软告警（不改 value）

// reports: snapshot.tasks 增 calcVersion（旧记录缺省=0，新版=1）、averageProgress 可 null
//          相邻两份 calcVersion 不同 或 任一侧 averageProgress=null → avgProgress delta=null
```

### 0.2 口径红线（开发不得自改）

- **客观只认 checklist**：`value` 只能来自 `checked/total`。**禁止** `status=done` 把无清单 leaf 变成 100；**禁止** `legacy progress>0` 把无清单 leaf 算成客观完成。
- **不封顶、不自动改 status**：全勾就是 100；全勾未 done 只挂「待验收」标签，不封顶 90、不把 status 改成 done。
- **3/5 是 leaf 单独字段**：leaf 的清单进度分数 `checked/total` 与父节点 `coverage{coveredLeaves,totalLeaves}` 是两个维度，**不复用同一语义**。
- **coverage 不足改名**：当 `coveredLeaves < totalLeaves`，父节点标题/表头必须叫「已覆盖任务清单完成度」，**不得叫「整体完成率」**；全覆盖时才可叫「整体完成率」。
- **legacy 只旁注**：历史手填 `progress`（含 0）原值保留、单独旁注；**不进 objective、不进 rollup 均值**；派生全程只读、不回写。
- **无 progressMode 字段**：schema 不加 progressMode；兼容靠「有清单=客观、无清单=legacy 旁注」二分。
- **单一真源**：`src/core/progress-derivation.ts` 导出 `deriveProgressMap(tasks)`（一次后序 O(n) 返回 `Map<id,TaskProgress>`）与便捷 `deriveTaskProgress(id, …)`；甘特/任务树/概览/汇报四处只 import 此处，**不另起第二份派生/汇总循环**。
- **source 三值**：叶子 `source='checklist'`、父/项目汇总 `source='rollup'`、无信号 `source='none'`；**没有 'done'/'legacy' 作为 source**。legacy 经 `TaskProgress.legacyProgress` 单独带出旁注。
- **value 只最终 round**：汇总阶段先用原始 checked/total 分数累加，**仅最后一次 round**；中间节点不各自 round，避免累积误差。
- **项目汇总同一次树计算只取叶子**：项目级 averageProgress 与父 rollup 共用一次后序树遍历，只对叶子求和，不再把父/中间节点均值进去。
- **异常降级不挂死、不跨项目汇总**：缺 id / 父链成环 / 跨项目父引用等异常 → 记入 `warnings`，推导跳过异常子树、**不抛挂死、不把跨项目任务算进本项目**。
- **calcVersion**：旧快照缺省=0，新快照=1；异版本或一侧 null → 该 delta=null；历史快照不回填重算。

### 0.3 判定分层与命名

- **AUTO**：`scripts/verify-objective-progress.mjs` 专项离线断言 + `pnpm build`=0 + runner full guard 零污染；全程离线。
- **集成（I）**：tmp 隔离库落盘读回——checklist 命令、跨父子拒绝、重启读回、导入导出往返、备份/恢复往返、doctor 只读。
- **GUI（G）**：隔离宿主真浏览器冒烟（独立 `DSH_HOME`/端口）。

> 命名 `OP-`：`CK`=checklist schema/结构约束/命令、`LEG`=legacy 旁注、`DV`=leaf 派生、`RU`=父 rollup/coverage、`EX`=异常降级、`EV`=证据不足、`SRC`=单一真源+reports、`Q`=写队列、`BD`=边界、`G`=GUI、`DEFER`=deferred。所有节点统一返回 `TaskProgress`（见 §0.1）。

## 1. OP-CK 用例（checklist schema + 结构约束 + 命令）

| CASE_ID | 层 | 用例 | 步骤/输入 | 通过门槛（断言） | 状态 |
|---|---|---|---|---|---|
| OP-CK-01 | AUTO | v1 清单项仅 `{id,text,done}`、task 仅加可选 checklist | 造带 checklist 任务；读旧任务 | 每项恰 `id`(同任务内唯一)、`text`(非空)、`done`(boolean)；**无 doneAt/weight/title、无 progressMode 字段**；旧记录无 checklist 键照常读 | NOT_RUN |
| OP-CK-02 | AUTO | 内部节点禁挂 checklist | 对有子任务的父执行 `add` | 拒绝并中文文案「有子任务的任务不挂清单」；落盘后该父仍无 checklist | NOT_RUN |
| OP-CK-03 | AUTO | 反向：有非空 checklist 的任务禁收子节点（拒绝不删除） | 对已有非空 checklist 的叶子做「改为其父 / 接收子任务」 | **拒绝**该父子变更；**不删除**其已有 checklist；提示先清空清单才能改父子 | NOT_RUN |
| OP-CK-04 | AUTO | 独立单项命令 add/rename/remove，不整段替换 | 逐项 add→rename→remove | 每次只动目标 itemId，其余项逐字段不变；载荷不含整段数组替换；rename 只改 text | NOT_RUN |
| OP-CK-05 | AUTO | toggle 带期望 done 布尔，重试不反向翻转（**M-终**） | `toggle(task,item,expectedDone=true)`；对同一 item 用相同 expected 重试一次 | 第一次翻成 true；**重试不再反向翻回 false**（基于 expectedDone 校验当前态，幂等/重试安全）；错误期望态不强行翻 | NOT_RUN |
| OP-CK-06 | 集成 | 单项写盘读回一致 | tmp 库 toggle 一项 → 重读 | 仅该项 done 翻转；兄弟项与 task.progress/status 不被顺带改写 | NOT_RUN |

## 2. OP-LEG 用例（legacy 手填旁注，不进客观派生）

| CASE_ID | 层 | 用例 | 步骤/输入 | 通过门槛（断言） | 状态 |
|---|---|---|---|---|---|
| OP-LEG-01 | AUTO | 无 checklist → objective=null，legacy 仅旁注 | 旧 leaf 手填 progress=40、无清单、status=in_progress | `deriveLeaf={value:null}`；界面旁注「原手填 40%」；**该 40 不充当客观完成度** | NOT_RUN |
| OP-LEG-02 | AUTO | legacy>0 不伪造客观清单 100%（**最终红线**） | leaf legacy progress=80、无清单、非 done | 返回 `value=null`；**不得**因 legacy>0 显示 80%/100% 为客观进度 | NOT_RUN |
| OP-LEG-03 | AUTO | legacy 不进 parent rollup 均值 | 父下：L1 有清单=50，L2 legacy=40（无清单） | rollup 只对 L1 取均值=50；L2 的 40 **不进均值**，仅旁注 | NOT_RUN |
| OP-LEG-04 | AUTO | 派生只读、首开旧库零写 | 只读快照库仅打开/渲染 | 不补 checklist/progressMode、不回写 progress；库 sha256+mtime 零变化 | NOT_RUN |

## 3. OP-DV 用例（leaf 清单客观派生）

| CASE_ID | 层 | 用例 | 步骤/输入 | 通过门槛（断言） | 状态 |
|---|---|---|---|---|---|
| OP-DV-01 | AUTO | 清单百分比=checked/total，确定性 | 清单 4 项勾 1/2/3/4 | value=25/50/75/**100**；同输入恒同输出 | NOT_RUN |
| OP-DV-02 | AUTO | 全勾=100 + 待验收标签，不封顶不改 status（**最终规则①**） | 清单全勾(4/4) 但 status=todo | `value=100`；挂独立标签「待验收」；**value 不封顶 90、status 不被自动改 done** | NOT_RUN |
| OP-DV-03 | AUTO | done+未全勾 = 软告警不改百分比 | status=done 清单 5 项勾 2 | value 仍 = 40（2/5）；软告警「已完成但清单 2/5 未勾」；**不补勾、不改 value** | NOT_RUN |
| OP-DV-04 | AUTO | status=done 不伪造无清单 leaf 的 100% | leaf 无清单但 status=done | `value=null`（证据不足）；**不**因 done 显示 100% | NOT_RUN |
| OP-DV-05 | AUTO | 3/5 为 leaf 单独字段，不复用 coverage | source=checklist 勾 3/5 | leaf 暴露 `checklist={checked:3,total:5}` 单独渲染「3/5」；与父 coverage{coveredLeaves/totalLeaves} 不混用 | NOT_RUN |
| OP-DV-06 | AUTO | 无清单 → null 证据不足（非 0） | leaf 无清单 | `value=null`；界面「证据不足」，不渲染 0% 进度条 | NOT_RUN |
| OP-DV-07 | AUTO | status 变动不凭空改清单百分比 | todo→in_progress（清单不变） | value 不变；in_progress 不产生保底进度 | NOT_RUN |

## 4. OP-RU 用例（父=有清单后代叶子等权均值 + coverage）

| CASE_ID | 层 | 用例 | 步骤/输入 | 通过门槛（断言） | 状态 |
|---|---|---|---|---|---|
| OP-RU-01 | AUTO | parent=有清单后代叶子等权均值，不含父自身 | P 下 L1=50、L2=75（均有清单）；P 自身 progress=100 | value=round((50+75)/2)=**63**；P 自身 progress 不计 | NOT_RUN |
| OP-RU-02 | AUTO | 无清单叶子不进均值，只计入 totalLeaves | P 下 L1=50(清单)、L2=无清单 legacy=30、L3=无清单 | value=50（只 L1）；`coverage={coveredLeaves:1, totalLeaves:3}`；L2/L3 不拖低均值 | NOT_RUN |
| OP-RU-03 | AUTO | coverage 不足界面须叫「已覆盖任务清单完成度」（**最终规则②**） | 上例 covered=1<total=3 | TaskProgress.coverage={1,3}；界面据 coverage 命名为「已覆盖任务清单完成度」；**不得**显示「整体完成率」 | NOT_RUN |
| OP-RU-04 | AUTO | 全覆盖才可叫「整体完成率」 | P 下 L1=0、L2=100 均有清单 | value=50；`coverage={coveredLeaves:2,totalLeaves:2}`；界面可叫「整体完成率」 | NOT_RUN |
| OP-RU-05 | AUTO | covered=0 → value=null | P 下全部后代叶子无清单 | `value=null`，`coverage={coveredLeaves:0,totalLeaves:n}`；不因父手填显示伪百分比 | NOT_RUN |
| OP-RU-06 | AUTO | 中间节点不重复计、叶子=无后代、O(n) | P→M→L1/L2 | 参与集合={L1,L2}；M 自身不算叶子、不重复展开；单次遍历 O(n) 量级 | NOT_RUN |
| OP-RU-07 | 集成 | 父子变更后 rollup 重算确定 | 叶子改挂/删除后重算 | 新旧父按新 covered 集合重算；重命名/顺序不影响 | NOT_RUN |

## 5. OP-EX 用例（异常降级：不挂死、不跨项目汇总）

| CASE_ID | 层 | 用例 | 步骤/输入 | 通过门槛（断言） | 状态 |
|---|---|---|---|---|---|
| OP-EX-01 | AUTO | `deriveProgressMap` 一次后序 O(n) 返回全量 Map | 任意深度树 | 返回 `Map<taskId,TaskProgress>`；同一份 tasks 多次调用结果一致；单次遍历完成叶子/父汇总（不每层重扫全表） | NOT_RUN |
| OP-EX-02 | AUTO | 父链成环 → warnings、不挂死 | 构造 A→B→A 环 | 函数**正常返回不死循环**；环涉及节点记入 `warnings`；环子树被跳过、不参与错误汇总 | NOT_RUN |
| OP-EX-03 | AUTO | 缺 id / 悬空父引用 → warnings、不抛 | tasks 含缺 id 项 / parentId 指向不存在任务 | 正常返回；异常项进 `warnings`；合法节点照常派生 | NOT_RUN |
| OP-EX-04 | AUTO | 跨项目父引用不跨项目汇总 | 项目 P 下任务 parentId 指向项目 Q | P 的 rollup/averageProgress **不含** Q 的叶子；跨项目边记 `warnings`；不把 Q 进度混入 P | NOT_RUN |
| OP-EX-05 | AUTO | warnings/pendingAcceptanceCount 落位 | 树含 2 个待验收节点 + 1 个环 | 待验收叶子 `pendingAcceptance=true`；其父/根 `pendingAcceptanceCount=2`；环进对应 `warnings` | NOT_RUN |

## 6. OP-EV 用例（证据不足 / doctor 只读）

| CASE_ID | 层 | 用例 | 步骤/输入 | 通过门槛（断言） | 状态 |
|---|---|---|---|---|---|
| OP-EV-01 | AUTO | null 是「无信号」非 0 | source 无清单节点 | `value=null`（类型区分 number 0）；界面「证据不足」 | NOT_RUN |
| OP-EV-02 | AUTO | 派生零回写 | 对无清单/legacy 节点反复渲染/出汇报 | 不把派生值写回 progress/checklist；库不变 | NOT_RUN |
| OP-EV-03 | AUTO | doctor 只读报告不自动修 | 「done 但清单 2/5 未勾」记录跑 doctor | doctor **报告**软告警，不补勾/改 status/写库；零改动 | NOT_RUN |

## 7. OP-SRC 用例（单一真源 + reports calcVersion/diff）

| CASE_ID | 层 | 用例 | 步骤/输入 | 通过门槛（断言） | 状态 |
|---|---|---|---|---|---|
| OP-SRC-01 | AUTO | 四界面调同一真源 | 静态+行为：甘特/任务树/概览/汇报对同树取值 | 均来自 `progress-derivation.ts` 同一对纯函数；无第二份比值/rollup 实现 | NOT_RUN |
| OP-SRC-02 | AUTO | 快照加 calcVersion（旧=0 新=1）+ averageProgress 可 null | 新生成快照 vs 读旧快照 | 新快照 `calcVersion=1`；旧记录缺省按 `0`；项目无覆盖叶子时 `averageProgress=null` | NOT_RUN |
| OP-SRC-03 | AUTO | 异版本 / 一侧 null → delta=null | 相邻两份：(a)calcVersion 1 vs 0；(b)一侧 averageProgress=null | `diffAgainstPrevious` 该 `avgProgress` 返回 null（不渲染徽标）；同版本且两侧非 null 才相减 | NOT_RUN |
| OP-SRC-04 | AUTO | 历史快照不回填 | 新算法上线后旧快照仍在库 | 旧快照保持原 calcVersion/原值，不重算/回写 | NOT_RUN |
| OP-SRC-05 | AUTO | 甘特条=真源 value、纯渲染 | leaf=40 | 实心层=value/100；value=null 不画伪填充；不回写 progress | NOT_RUN |
| OP-SRC-06 | GUI | 四界面同屏一致 | 隔离实例造父/清单/legacy/全勾待验收/无信号树 | 甘特条、任务树行(含 3/5)、概览(label)、汇报快照同一 value/coverage；待验收/证据不足/原手填标记一致 | NOT_RUN |

## 8. OP-Q 用例（写队列 / 幂等）

| CASE_ID | 层 | 用例 | 步骤/输入 | 通过门槛（断言） | 状态 |
|---|---|---|---|---|---|
| OP-Q-01 | AUTO | 命令走单写链不绕队 | 代码断言 checklist add/toggle/rename/remove 经 domain 写路径 | 不绕队直 `table.put`、不整段替换数组 | NOT_RUN |
| OP-Q-02 | AUTO | toggle expectedDone 幂等重试安全 | 相同 expectedDone 连续调用 | 结果幂等（最终态=expectedDone），不反向翻转；预留 rev/actor 缺省兼容 | NOT_RUN |
| OP-Q-03 | 集成 | 连续写串行无丢失 | 快速 toggle+rename 多项 | 最终读回与操作序列一致；无覆盖丢失 | NOT_RUN |
| OP-Q-04 | AUTO | 写失败不半写、正式库零污染 | tmp 库注入落盘失败 | 失败不误改 status/progress；正式 data/ 不被触碰 | NOT_RUN |

## 9. OP-BD 用例（重启 / 导入导出 / 备份恢复 / doctor / 隔离）

| CASE_ID | 层 | 用例 | 步骤/输入 | 通过门槛（断言） | 状态 |
|---|---|---|---|---|---|
| OP-BD-01 | 集成 | 重启读回一致 | tmp 库写 checklist → 重启重开 | `{id,text,done}` 与派生按同一真源重算结果不变 | NOT_RUN |
| OP-BD-02 | 集成 | 导入导出往返保留 checklist | 导出→清空→导入 | 往返后 id/text/done 保留；空清单不丢不伪造；内部节点不误带清单 | NOT_RUN |
| OP-BD-03 | AUTO | 备份口径不擅自抬、恢复往返 | createBackup→restore tmp | 备份 formatVersion 与既有一致；旧备份可恢复；恢复后 checklist 不丢 | NOT_RUN |
| OP-BD-04 | 集成 | doctor 只读不迁移 | 旧记录库跑 doctor | 不自动迁移/补值；只读扫描，库零改动 | NOT_RUN |
| OP-BD-05 | AUTO | 正式资产零污染 | 专项 verify 前后 manifest | 正式 `data/`/`backups`/`exports` sha256+mtime before==after；GUI 隔离 DSH_HOME+端口，正式 3080/3091 不触 | NOT_RUN |
| OP-BD-06 | AUTO | build 无残留 + 全 guard 不回归 | `pnpm build`=0；runner 全量 | build 退出 0、无 server require 进 client；full guard 文件数不异常增减 | NOT_RUN |

## 10. OP-GUI 用例（隔离宿主冒烟）

| CASE_ID | 层 | 用例 | 步骤/输入 | 通过门槛（断言） | 状态 |
|---|---|---|---|---|---|
| OP-GUI-01 | GUI | 抽屉 toggle 即时派生、不刷库漂移 | 隔离实例勾一叶子项 | 行内 3/5 分数/甘特填充即时更新；不触发无关记录回写；标签正确 | NOT_RUN |
| OP-GUI-02 | GUI | 旧库打开零写 | 加载 v0.7.4 旧快照库仅浏览 | legacy 旁注显示、无报错；退出后隔离库 sha256+mtime 零变化 | NOT_RUN |
| OP-GUI-03 | GUI | 真 390 窄窗目视（沿用既有） | 收窄视口查 3/5/待验收/证据不足 | 不溢出截断（沿用 PL-WEB-11，无法实测则 MANUAL_PENDING 不阻塞） | NOT_RUN |

## 11. OP-DEFER 用例（v0.8 不做 —— 记 N/A 不计失败）

| CASE_ID | 层 | 用例 | 通过门槛（断言） | 状态 |
|---|---|---|---|---|
| OP-DEFER-01 | ➖ | 人工 override（锁死显示值） | 无 override 入口（N/A） | NOT_RUN |
| OP-DEFER-02 | ➖ | effort 工时权重 | 等权唯一口径（N/A） | NOT_RUN |
| OP-DEFER-03 | ➖ | evidence link（repo 提交/PR 自动判完成） | 完成只认 checklist 勾选 + status（N/A） | NOT_RUN |
| OP-DEFER-04 | ➖ | checklist `doneAt` 时间戳 | v1 仅 `{id,text,done}`（N/A） | NOT_RUN |
| OP-DEFER-05 | ➖ | 跨端同步 / 多人实时并发合并 | rev/actor 仅预留结构（N/A） | NOT_RUN |
| OP-DEFER-06 | ➖ | war-room doing bug 热修 | 独立先行，不纳入本矩阵（N/A） | NOT_RUN |

## 12. 文件边界（基线 v0.7.4 / `5fdb2d7`）

- **真源**：新增 `src/core/progress-derivation.ts`（`deriveProgressMap(tasks)` 一次后序 O(n) 返回 `Map<id,TaskProgress>` + 便捷 `deriveTaskProgress`）；四界面只 import 此处。
- **schema**：`src/core/task.ts` 仅加可选 `checklist?: {id,text,done}[]`；**不加 progressMode、不加 doneAt**。
- **命令**：`src/commands/task.ts` 增 `task checklist add/rename/remove/toggle <taskId> <itemId> <expectedDone>`；跨父子变更拒绝带非空 checklist 的叶子接收子节点。
- **汇报**：`src/core/progress-report.ts` tasks 加 `calcVersion`、`averageProgress` 放宽 `number|null`；`progress-reports.ts` 改走真源；`report-diff.ts` 加异版本/一侧 null→delta=null。
- **doctor**：可增「done 但清单未全勾」只读报告；只报告不自愈。
- **verify**：`scripts/` 追加 `verify-objective-progress.mjs`，追加不重排。

## 13. 红线（本批冻结为约束，不实现）

- **R1 客观只认 checklist**：value 只来自 checked/total；status=done / legacy>0 不得伪造无清单 leaf 的百分比。
- **R2 不封顶不改状态**：全勾=100；待验收只是标签，不封顶 90、不自动改 status。
- **R3 legacy 只旁注**：历史 progress 含 0 原值保留、不进 objective/不进 rollup 均值；派生只读不回写、无首载迁移。
- **R4 真源唯一 + coverage 命名诚实**：四界面共用真源；covered<total 必须叫「已覆盖任务清单完成度」，不得叫「整体完成率」。
- **R5 单写队列 + 结构互斥**：checklist 走单写链、不整段替换、toggle 带 expectedDone；内部节点与「有清单叶子」双向互斥（拒绝不删除）。
- **R6 诚实边界**：override/effort/evidence/doneAt/在线合并/war-room 热修一律 deferred 或独立先行。

## 14. 证据与判定要求

- **verifier / diff check**：AUTO 以 `verify-objective-progress.mjs` 退出码 + `pnpm build`=0 + runner full guard 的 sha256+mtime diff 为准；正式 `data/`/`backups`/`exports` 前后 manifest 逐字节比对，证据命名 `docs/verification/objective-progress-20261015/`。
- **集成**：tmp 隔离库落盘 JSON 读回；重启/导入导出/备份恢复往返逐字段；跨父子拒绝用例落盘断言。
- **GUI**：隔离宿主（独立 `DSH_HOME`+独立端口）真浏览器冒烟；正式 data/backups/exports 全程不碰。
- **不改产品不提交**：本文件由独立测试专家冻结；开发落地后由独立测试专家逐格实测回填。测试专家本人**不改产品 src、不 git commit**。任何新提交使受影响历史结论过期，须重测后方可再引用。
- 初始状态：全部 **NOT_RUN**。

<!--
v0.8 客观进度（objective progress）第一版验收矩阵（独立测试专家所有，ADL-045/047；开发前冻结，不写产品代码、不提交）。
其他角色只读引用，不得改本文件用例/断言/判定。状态只能由测试专家实测回填。
冻结日期：2026-10-14（v1 冻结；同日经反方评审 M1–M5 修订后重冻结）。冻结基线：HEAD `eb41b30`（package.json = 0.7.3，S4 并线点）。
本文件只列用例与口径，不含任何产品实现。人工 override / effort / evidence link / doneAt 明确 deferred（见 §10）。
war-room doing bug 为独立热修先行项，不纳入本矩阵实现。
-->
# v0.8 客观进度 · 验收矩阵（objective-progress）

> 是什么：为 v0.8「客观进度」第一版**先冻结独立验收计划**——本文件只有用例与口径，不含任何产品实现。
> 一句话目标：进度从客观信号确定性派生，收敛到**单一 core 真源**；没有客观信号就诚实返回 `value=null`（界面「证据不足」），绝不凭空造伪精确百分比。
> **反方 M1–M5 修订要点（相对初版）**：① 真源改为 `core/progress-derivation.ts`，统一返回 `{value:number|null, source, coverage}`；② checklist schema v1 只 `{id,text,done}`、内部节点禁挂、独立 add/toggle/remove/rename 命令；③ leaf 四级优先级 `done=100 > checklist 比例 > legacy progress 弱信号 > none`，清单来源 UI 必写「3/5」分数不裸 60；④ parent 只对后代叶子**有信号**者取均值并带 `coverage{signaled,total}`、迭代 O(n)；⑤ reports 加 `calcVersion`，跨版本/一侧 null 不算 delta、不回填历史。
> 判定纪律：`FAIL / BLOCKED / NOT_RUN` 一律 ≠ 通过；严重度只排修复先后，不自动豁免。
> 初始状态：**全部 NOT_RUN**，分 AUTO / 集成 / GUI 三层。开发完成后由测试专家逐格实测回填。

## 0. 冻结决策（开发必须对齐，本矩阵据此验收）

### 0.0 现状勘察结论（逐符号引自基线 `eb41b30`，作为冻结依据）

- **任务记录**（`src/core/task.ts`）：`taskRecordSchema`（L46-53）strictObject，现有 `progress: int 0..100`（L26，**纯手填、旧记录必填**）、`status: taskStatusSchema`。现状无 checklist / 无派生真源。
- **状态机**（`src/core/status.ts`）：`['todo','in_progress','blocked','done']`。
- **现有进度消费点（本批统一到同一真源）**：
  - 甘特 `src/core/gantt.ts` `progressRatio(progress,status)`（L78-80）：`progress/100`；`status==='done'` 或 `progress>=100` 为完成态。
  - 汇报快照 `src/core/progress-reports.ts`（L103）：`averageProgress = Math.round(Σ task.progress / tasks.length)`——**对全部任务（含父/中间节点）求平均，正是本批要纠正的重复计父口径**。
  - 快照 schema `src/core/progress-report.ts`（L35）：`averageProgress: int 0..100`（**本批要加 `calcVersion` 并允许 value=null**）。
  - 相邻对比 `src/core/report-diff.ts` `diffAgainstPrevious`（L41-56）：当前 `avgProgress = current - previous` 直接相减（**本批要加跨版本/一侧 null → delta=null 规则**）。
  - 项目概览/任务树在 `src/client/panel.tsx` 直读 `task.progress` / `snapshot.tasks.averageProgress`。
- **写路径**：`src/commands/task.ts` 经 `updateTask` 落盘；任何 checklist 写不得绕单写链直 `table.put`。
- **doctor**（`src/core/doctor.ts`）：承接 V2/S4 红线——只报告、不自动自愈、不自动迁移。

### 0.1 口径冻结（红线，开发不得自改）

- **M1 单一真源**：唯一模块 `src/core/progress-derivation.ts`，导出纯函数 `deriveTaskProgress(task, tasksById)`，返回**统一三元组**：
  - `value: number | null`（`null` = 无信号/证据不足，界面不渲染伪百分比）；
  - `source: 'done' | 'checklist' | 'legacy' | 'rollup' | 'none'`；
  - `coverage: { signaled: number, total: number }`（叶子=清单勾/总；父=有信号后代叶子数/全部后代叶子数）。
  - 甘特/任务树/概览/汇报**四处必须 import 此处**，禁止第二份派生实现。
- **M3 leaf 四级优先级（自上而下，命中即止）**：
  1. `status==='done'` → `value=100, source='done'`（即便清单未全勾，仅软告警、不自动补勾/改状态）；
  2. 有非空 checklist → `value=round(checked/total*100), source='checklist'`，`coverage={signaled:checked,total:len}`；
  3. 否则存在可读 legacy `progress` → `value=task.progress, source='legacy'`（**弱信号，界面标「原手填」**）；
  4. 否则 → `value=null, source='none'`（界面「证据不足」）。
- **M3 UI 分数直写**：`source='checklist'` 的 leaf，进度处**必须显式渲染分数「已勾/总数」（如 3/5）**，不得只裸渲染 60%。
- **M2 checklist schema v1**：每项仅 `{ id, text, done }` 三字段——**不要 `title`、不要 `doneAt`**（`doneAt` deferred，见 §10）。
- **M2 内部节点禁挂清单**：**有后代（子任务）的任务不得挂 checklist**；对内部节点 `add` 须拒绝。叶子=无后代任务。
- **M2 独立单项命令**：checklist 增删改走独立命令 `add / toggle / remove / rename`（按 itemId 单项操作），**禁止整段替换 checklist 数组**。
- **M4 parent rollup**：父/中间节点 `value = round(Σ signaled后代叶子 value / signaled数)`，`source='rollup'`；`signaled = value!=null` 的后代叶子数，`total = 全部后代叶子数`；`signaled=0 → value=null`。父自身/中间节点的 progress **不计入**。算法 **O(n)**（单次遍历建后代叶子集合并聚合，不递归重复计）。legacy 叶子算 signaled、其手填值计入均值但标「原手填」。
- **M5 reports**：快照 `tasks` 新增 `calcVersion`（int，本版=1）；`averageProgress` 允许 `number|null`（null=项目级无信号）。
- **M5 diff 规则**：相邻两份 `calcVersion` 不同，**或**任一侧 `averageProgress` 为 null → 该 `avgProgress` delta = `null`（不渲染对比徽标）。
- **M5 不回填历史**：旧快照保持原样，**不**因新算法重算/回写历史快照。
- **legacy 不迁移写库**：派生全程只读；旧 `progress` 不被回写、不触发首载迁移；但 legacy 值**参与** rollup 并在界面标「原手填」。
- **不抬触发全量迁移的 schema 变更**：旧 v1/v2 记录读回零改写；checklist/progressMode 为可选缺省兼容。

### 0.2 判定分层与命名

- **AUTO**：`scripts/verify-*.mjs` 专项离线可复算（真源纯函数/优先级/rollup/diff 规则断言）+ `pnpm build`=0 + runner full guard 零污染；全程离线。
- **集成（I）**：tmp 隔离库落盘读回——checklist 单项命令、重启读回、导入导出往返、备份/恢复往返、doctor 只读。
- **GUI（G）**：隔离宿主真浏览器冒烟（独立 `DSH_HOME`/端口），验证四界面同一三元组输出与旧记录零写。

> 命名：`OP-` = Objective Progress。`CK`=checklist schema/命令、`PM`=progressMode/legacy 兼容、`DV`=leaf 派生四级优先级、`RU`=父 rollup/coverage、`EV`=证据不足/legacy 旁注、`SRC`=单一真源跨界面+reports calcVersion/diff、`Q`=写队列、`BD`=边界、`G`=GUI、`DEFER`=deferred。

## 1. OP-CK 用例（checklist v1 schema + 内部节点禁挂 + 独立命令）

| CASE_ID | 层 | 用例 | 步骤/输入 | 通过门槛（断言） | 状态 |
|---|---|---|---|---|---|
| OP-CK-01 | AUTO | v1 清单项仅 `{id,text,done}` | 造一条带 checklist 任务 | 每项恰好 `id`(同任务内唯一非空)、`text`(非空)、`done`(boolean)；**不含 doneAt/weight/title**；strict 下多余字段可预测拒绝 | NOT_RUN |
| OP-CK-02 | AUTO | checklist 可选、旧记录缺省即无 | 旧任务无 checklist 键 | 无键 / `[]` 均合法读回；旧记录不报错、不补键；空清单=无 checklist 信号（不误判全完成） | NOT_RUN |
| OP-CK-03 | AUTO | 内部节点禁挂 checklist（**M2 核心**） | 对一个有子任务的父/中间节点执行 `add` | 被拒并中文文案「父任务/中间节点不挂清单」；落盘后该内部节点仍无 checklist；其 rollup 只统计后代叶子 | NOT_RUN |
| OP-CK-04 | AUTO | 独立单项命令 add/toggle/remove/rename（不整段替换） | 逐项：add 一项 → toggle → rename → remove | 每次只动目标 itemId；**其余清单项逐字段不变**；命令载荷不含整段数组替换；rename 只改 text 不动 id/done | NOT_RUN |
| OP-CK-05 | AUTO | id 稳定、text 非空 | add 空 text；add 重复 id | 空 text 被拒；id 由系统生成且 rename/remove 后仍稳定指向同一项（不靠数组下标定位） | NOT_RUN |
| OP-CK-06 | 集成 | 单项写盘读回逐字段一致 | tmp 库 toggle 一项 → 重读 | 仅该项 `done` 翻转、text/id 不变；兄弟项与 task.progress/status 不被顺带改写 | NOT_RUN |

## 2. OP-PM 用例（progressMode / legacy 弱信号兼容，不写迁移）

| CASE_ID | 层 | 用例 | 步骤/输入 | 通过门槛（断言） | 状态 |
|---|---|---|---|---|---|
| OP-PM-01 | AUTO | 旧记录无派生字段照常读 | v0.7.3 旧任务（仅 progress/status） | 读回不报错、不补 checklist/progressMode；派生按四级优先级落到 `source='legacy'`（有 progress）或 `'none'` | NOT_RUN |
| OP-PM-02 | AUTO | legacy 弱信号参与派生+标「原手填」、不回写 | legacy 任务 progress=40、无清单、非 done | 返回 `{value:40, source:'legacy'}`；界面显示 40 并标「原手填」；**落盘 progress 仍 40，未被派生改写** | NOT_RUN |
| OP-PM-03 | AUTO | 首次打开旧记录零写 | 对只读快照库只做打开/读取/渲染 | 全部文件 sha256+mtime 前后逐字节不变；无首载迁移、无补值写 | NOT_RUN |
| OP-PM-04 | AUTO | legacy 参与 rollup 但标原手填 | 父下叶子 L1(legacy=40)、L2(checklist=50) | 父 rollup 把 L1 的 40 当 signaled 计入均值；L1 对应展示处标「原手填」，不伪装成客观清单进度 | NOT_RUN |

## 3. OP-DV 用例（leaf 四级优先级派生）

| CASE_ID | 层 | 用例 | 步骤/输入 | 通过门槛（断言） | 状态 |
|---|---|---|---|---|---|
| OP-DV-01 | AUTO | 优先级 1：done=100 | (a)done+清单全勾；(b)done+清单勾一半；(c)done+无清单 | 三者均 `{value:100,source:'done'}`；(b) 触发软告警（见 OP-DV-05）但 value 仍 100 | NOT_RUN |
| OP-DV-02 | AUTO | 优先级 2：checklist 等权比例 | 清单 4 项勾 1/2/3 | `value=25/50/75, source='checklist'`，`coverage={signaled:1/2/3,total:4}`；同输入恒同输出 | NOT_RUN |
| OP-DV-03 | AUTO | 优先级 3/4：legacy 弱信号 vs none | (a)非done 无清单 progress=30；(b)非done 无清单且无可读 progress | (a) `{value:30,source:'legacy'}`；(b) `{value:null,source:'none'}`；优先级严格 done>checklist>legacy>none | NOT_RUN |
| OP-DV-04 | AUTO | checklist 来源 UI 必写分数不裸百分比（**M3**） | source='checklist' 勾 3/5 | 进度处渲染「3/5」分数（或等价分数直写）；**不只显示 60%**；coverage 可支撑分母展示 | NOT_RUN |
| OP-DV-05 | AUTO | done 但清单未全勾 = 软告警不自动修 | status=done 且清单 5 项只勾 2 | value 仍 100；界面**软告警**「已完成但清单 2/5 未勾」；**不自动补勾剩余项、不自动改 status、不静默写库** | NOT_RUN |
| OP-DV-06 | AUTO | 全勾未 done → 90 封顶 + 待验收 | 清单全勾但 status≠done | `value=90, source='checklist'`（绝不 100）；界面标「待验收」；status 不被自动改 done | NOT_RUN |
| OP-DV-07 | AUTO | status 变动不凭空 +% | todo→in_progress（清单无变化） | 派生 value 不因此凭空增减；in_progress 不产生保底进度 | NOT_RUN |
| OP-DV-08 | AUTO | 等权为 v1 唯一口径（weighted deferred） | 清单项夹带 weight 字段 | v0.8 忽略 weight、按等权；含 weight 输入不得改变 value（weighted 走 deferred） | NOT_RUN |

## 4. OP-RU 用例（父叶子 signaled 均值 + coverage，O(n)）

| CASE_ID | 层 | 用例 | 步骤/输入 | 通过门槛（断言） | 状态 |
|---|---|---|---|---|---|
| OP-RU-01 | AUTO | 父=后代叶子有信号均值，不含父自身 | P 下 L1=25、L2=75；P 自身 progress=100 | `value=round((25+75)/2)=50, source='rollup'`；P 自身 100 **不计入** | NOT_RUN |
| OP-RU-02 | AUTO | 中间节点不重复计 | P→M→L1=0、L2=100 | P 只对 {L1,L2} 求均值=50；M 自身 progress 不计、M 不当叶子再算 | NOT_RUN |
| OP-RU-03 | AUTO | coverage={signaled,total}（**M4**） | P 下三叶子：L1=50(清单)、L2=legacy=30、L3=无信号(null) | `value=round((50+30)/2)=40`；`coverage={signaled:2, total:3}`；L3(null) 不入分子分母、计入 total | NOT_RUN |
| OP-RU-04 | AUTO | signaled=0 → value=null（证据不足） | P 下全部后代叶子均 value=null | `value=null, source='rollup'`，`coverage={signaled:0,total:n}`；不因父手填显示伪百分比 | NOT_RUN |
| OP-RU-05 | AUTO | 叶子=无后代；O(n) 单次聚合 | 任意深度树；造 1 父多子孙 | 参与集合=全部无后代任务；同树多次求值结果一致；算法单次遍历（不递归重复展开同一叶子），复杂度 O(n) 量级 | NOT_RUN |
| OP-RU-06 | 集成 | 树变动后 rollup 重算确定 | 叶子改挂/删除后重算 | 新旧父各自按新后代叶子 signaled 集合重算；重命名/顺序不影响结果 | NOT_RUN |

## 5. OP-EV 用例（证据不足 legacy 旁注，不静默写库）

| CASE_ID | 层 | 用例 | 步骤/输入 | 通过门槛（断言） | 状态 |
|---|---|---|---|---|---|
| OP-EV-01 | AUTO | null=证据不足，非 0 | source='none' 节点 | 返回 `value=null`（类型区分于 number 0）；界面渲染「证据不足」，**不渲染 0% 进度条** | NOT_RUN |
| OP-EV-02 | AUTO | 派生只读、零回写 | 对 legacy/none 节点反复 get/渲染/出汇报 | 不把派生值/coverage 写回 progress/checklist；库文件不变 | NOT_RUN |
| OP-EV-03 | AUTO | doctor 只读报告、不自动修 | 「done 但清单 2/5 未勾」记录跑 doctor | doctor **报告**该软告警异常，**不自动**补勾/改 status/写 90；库零改动 | NOT_RUN |

## 6. OP-SRC 用例（单一真源 + reports calcVersion/diff）

| CASE_ID | 层 | 用例 | 步骤/输入 | 通过门槛（断言） | 状态 |
|---|---|---|---|---|---|
| OP-SRC-01 | AUTO | 四界面调同一真源 | 静态+行为：甘特/任务树/概览/汇报对同一份树取值 | 全部来自 `progress-derivation.ts` 同一对纯函数；diff 源码确认无第二份比值/rollup 公式 | NOT_RUN |
| OP-SRC-02 | AUTO | 快照加 calcVersion + averageProgress 可 null | 生成一份汇报快照 | `tasks` 含 `calcVersion=1`；`averageProgress` 允许 `number|null`（项目级无信号=null）；schema 类型随之放宽 | NOT_RUN |
| OP-SRC-03 | AUTO | 跨版本 / 一侧 null → delta=null（**M5**） | 相邻两份：(a)calcVersion 不同；(b)一侧 averageProgress=null | `diffAgainstPrevious` 对该 `avgProgress` 返回 `null`（不渲染徽标）；同版本且两侧非 null 才正常相减 | NOT_RUN |
| OP-SRC-04 | AUTO | 历史快照不回填 | 新算法上线后，旧快照仍在库 | 旧快照保持原 calcVersion/原值，**不被重算/回写**；仅新快照用新算法 | NOT_RUN |
| OP-SRC-05 | AUTO | 甘特条填充=真源 value、纯渲染不写库 | leaf 派生=50 | 实心层=value/100；value=null 时不画伪填充；渲染路径不回写 progress | NOT_RUN |
| OP-SRC-06 | GUI | 四界面同屏数值/分数一致 | 隔离实例造含父/清单/legacy/全勾待验收/无信号树 | 甘特条、任务树行（含 3/5 分数）、概览、汇报快照四处同一 `value/source/coverage` 与同一「待验收/证据不足/原手填」标记 | NOT_RUN |

## 7. OP-Q 用例（checklist 写路径走单写链，rev/actor 可扩展）

| CASE_ID | 层 | 用例 | 步骤/输入 | 通过门槛（断言） | 状态 |
|---|---|---|---|---|---|
| OP-Q-01 | AUTO | 独立命令走单写链、不绕队 | 代码断言 checklist add/toggle/remove/rename 经 domain 写路径 | 不绕过队列直 `table.put`；不整段替换数组（承接 S1/S2/S4 R3） | NOT_RUN |
| OP-Q-02 | AUTO | 写记录预留 rev/actor、缺省兼容 | 一次 toggle 落盘 payload | 可选 `rev`/`actor` 缺省不破坏旧读取；v0.8 不强依赖其值，结构允许未来并发冲突检测与操作人留痕 | NOT_RUN |
| OP-Q-03 | 集成 | 连续单项写串行无丢失 | 快速 toggle 两项 + rename 一项 | 最终读回各 item 状态与操作序列一致；无覆盖丢失 | NOT_RUN |
| OP-Q-04 | AUTO | 写失败不半写、正式库零污染 | 注入落盘失败（仅 tmp 库） | 失败不误改 status/progress；正式 data/ 不被本用例触碰 | NOT_RUN |

## 8. OP-BD 用例（重启 / 导入导出 / 备份恢复 / doctor / 隔离）

| CASE_ID | 层 | 用例 | 步骤/输入 | 通过门槛（断言） | 状态 |
|---|---|---|---|---|---|
| OP-BD-01 | 集成 | 重启读回一致 | tmp 库写带 checklist 任务 → 重启重开 | checklist `{id,text,done}`、派生三元组按同一真源重算结果不变 | NOT_RUN |
| OP-BD-02 | 集成 | 导入导出往返保留 checklist | 导出 → 清空 → 导入 | 往返后各 item id/text/done 保留；空清单不丢不伪造；内部节点不误带清单 | NOT_RUN |
| OP-BD-03 | AUTO | 备份 formatVersion 口径不擅自抬、恢复往返 | createBackup → restore 到 tmp | 备份信封 formatVersion 与既有一致；旧备份仍可恢复；恢复后 checklist 不丢 | NOT_RUN |
| OP-BD-04 | 集成 | doctor 只读不迁移 | 旧记录库跑 doctor | 不因新字段自动迁移/补值；只读扫描报告异常，库零改动 | NOT_RUN |
| OP-BD-05 | AUTO | 正式资产零污染 | 本批专项 verify 前后 manifest | 正式 `data/`/`packages/backups/`/`exports/` sha256+mtime before==after；GUI 隔离 DSH_HOME+独立端口，正式 3080/3091 不触 | NOT_RUN |
| OP-BD-06 | AUTO | build 无残留 + 全 guard 不回归 | `pnpm build`=0；runner 全量跑 | build 退出 0、无 server require 进 client；full guard 文件数不异常增减 | NOT_RUN |

## 9. OP-GUI 用例（隔离宿主真浏览器冒烟）

| CASE_ID | 层 | 用例 | 步骤/输入 | 通过门槛（断言） | 状态 |
|---|---|---|---|---|---|
| OP-GUI-01 | GUI | 抽屉 checklist toggle 即时派生、不刷库漂移 | 隔离实例勾一叶子项 | 行内分数/甘特填充即时更新；不触发无关记录回写；待验收/证据不足/原手填标记正确 | NOT_RUN |
| OP-GUI-02 | GUI | 旧库打开零写 | 加载 v0.7.3 旧快照库仅浏览 | legacy 旁注显示、无报错；退出后隔离库 sha256+mtime 零变化 | NOT_RUN |
| OP-GUI-03 | GUI | 真 390 窄窗目视（沿用既有项） | 收窄视口查分数/待验收/证据不足文案 | 不溢出截断（真 390 沿用 PL-WEB-11，无法实测视口则记 MANUAL_PENDING 不阻塞） | NOT_RUN |

## 10. OP-DEFER 用例（v0.8 明确不做 —— 记 N/A，不计失败）

| CASE_ID | 层 | 用例 | 通过门槛（断言） | 状态 |
|---|---|---|---|---|
| OP-DEFER-01 | ➖ | 人工 override（锁死显示值） | v0.8 无 override 入口；误造 override 字段视为越界（N/A） | NOT_RUN |
| OP-DEFER-02 | ➖ | effort 工时权重 | 不按人天加权；等权为唯一口径（N/A） | NOT_RUN |
| OP-DEFER-03 | ➖ | evidence link（repo 提交/PR 自动判完成） | 完成只认 checklist 勾选 + status=done；不接外链自动判完成（N/A） | NOT_RUN |
| OP-DEFER-04 | ➖ | checklist `doneAt` 时间戳 | v1 清单仅 `{id,text,done}`，不存 doneAt；未来再加（N/A） | NOT_RUN |
| OP-DEFER-05 | ➖ | 跨端同步 / 多人实时并发合并 | rev/actor 仅预留结构，不实现在线合并（N/A） | NOT_RUN |
| OP-DEFER-06 | ➖ | war-room doing bug 热修 | 该热修独立先行，**不纳入本矩阵实现/验收**（N/A） | NOT_RUN |

## 11. 文件边界与并行分工（冻结基线：HEAD `eb41b30`，v0.7.3）

- **真源**：新增 `src/core/progress-derivation.ts`（`deriveTaskProgress(task, tasksById)` 唯一导出，返回 `{value,source,coverage}`）；甘特/任务树/概览/汇报**只 import 此处**。
- **checklist schema/命令**：`src/core/task.ts` 增可选 `checklist: {id,text,done}[]`（不含 doneAt）；`src/commands/task.ts` 增独立 `task checklist add|toggle|remove|rename`；内部节点 add 拒绝。
- **汇报**：`src/core/progress-report.ts` 快照 tasks 加 `calcVersion`、`averageProgress` 放宽为 `number|null`；`src/core/progress-reports.ts` L103 改走真源；`src/core/report-diff.ts` `diffAgainstPrevious` 加跨版本/null→delta=null。
- **doctor**：`src/core/doctor.ts` 可增「done 但清单未全勾」只读报告项；只报告不自愈。
- **verify**：`scripts/` 追加 `verify-objective-progress.mjs`；一律追加不重排既有断言。
- **GUI 串行闸门**：GUI 仅隔离冒烟；真 390 沿用 PL-WEB-11。

## 12. 未来协作红线（本批冻结为约束，**不实现**）

- **R1 零静默写库**：派生只读；打开旧记录/渲染/出汇报不补值回写；旧 progress 仅 legacy 弱信号、不被覆盖。
- **R2 无伪精确**：无信号返回 `value=null`（证据不足），禁止 0%/x% 冒充；status 变动不凭空 +%；checklist 来源必显分数。
- **R3 单写队列不破**：checklist 一切单项操作走单写链、不整段替换、不绕队直写；rev/actor 仅预留。
- **R4 单一真源**：四界面共用 `progress-derivation.ts`；发现第二份派生实现即 FAIL。
- **R5 诚实边界**：v0.8 只做等权；override/effort/evidence/doneAt/在线合并/war-room 热修一律 deferred 或独立先行，不越界声称。

## 13. 证据与判定要求

- **verifier / diff check**：AUTO 以 `verify-objective-progress.mjs` 退出码 + `pnpm build`=0 + runner full guard 的 sha256+mtime diff 为准；正式 `data/`/`packages/backups`/`exports` 前后 manifest 逐字节比对，证据命名 `docs/verification/objective-progress-20261014/`。
- **集成**：tmp 隔离库落盘 JSON 读回；重启/导入导出/备份恢复往返逐字段。
- **GUI**：隔离宿主（独立 `DSH_HOME`+独立端口）真浏览器冒烟；正式 data/backups/exports 全程不碰。
- **不改产品不提交**：本文件由独立测试专家冻结；开发落地后由独立测试专家逐格实测回填。测试专家本人**不改产品 src、不 git commit**。任何新提交使受影响历史结论过期，须重测后方可再引用。
- 初始状态：全部 **NOT_RUN**。

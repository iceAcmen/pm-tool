<!--
副驾多步规划（PROD-24）验收矩阵（开发前冻结门）。独立测试专家所有，ADL-045 / ADL-047 / AGENTS 6A / 6A。
其他角色（产品 PM / 开发）：只读引用，不得改本文件任何用例、步骤、断言与判定。
开发未开始前，全部用例初始 = NOT_RUN；PASS/FAIL/BLOCKED/MANUAL_PENDING 只能由测试专家实测后填。
本批只改 docs/testing/，不改产品代码 / schema / 提交。
-->
# 副驾多步规划 · 验收矩阵（Copilot Multi-Step Acceptance，开发前冻结）

> 是什么：PROD-20「AI 项目副驾」的多步规划增量（**PROD-24**）在 **P0 基线 `3b20850`** 之上的开发前冻结验收门。产品契约见 `docs/product/08-copilot-multistep-design.md`（设计稿）与 P0 技术收敛稿（seam 勘察后按裁决裁剪，未落盘）；本矩阵是**唯一权威用例集**。
> 给谁：开发照此实现；有 GUI 执行能力的主端按本文采集原始证据；**PASS/FAIL 只由测试专家审证后给出**（ADL-045 第 8 条）。
> 范围纪律：本门**只覆盖 PROD-24 P0 范围**。旧 H1–H6（v0.5.0 发布收尾四块门，见 `release-closeout-acceptance.md`）已闭环，**不在本门重复、不作为本门阻塞项**。P1（计划持久化 / 撤销上次计划命令 / 多轮重规划 / 扩充 op）**不在本门验收范围**。

## 0. 冻结口径（设计契约 + P0 裁决；以此为准，开发不得越线）

1. **不改 schema / 不新表 / 不写 settings / 不跨重启恢复**：domain 仍 v1、9 张表；计划**只活在前端内存（CopilotPanel state）与单次 ask 响应**，关面板即消散；不新增计划表、不新增 settings 写、不做命令级服务端计划缓存。
2. **四段链路不变**：模型提议 → 后端验证 → 用户确认 → 确定性落盘。**唯一写动作 `task.update`**，patch 白名单 5 标量：`status(todo|in_progress|blocked|done)` / `progress(0-100 整数)` / `assignee(字符串)` / `startDate` / `dueDate`（合法 YYYY-MM-DD 且 start≤due）。其余 op 一律拒绝。
3. **新数据契约**：模型可输出 `{"plan":[…]}` 或 `{"steps":[…]}`，每步 `{stepId, title, reason, action, needs[], riskNote?}`；`action` 复用既有 `CopilotAction`。`stepId` 重复 → 后者拒；`reason` 空 → 该步标黄「模型未说明原因」但**不拒**；`riskNote?` 仅展示、绝不阻断。
4. **旧输出兼容**：模型若仍只输出 `{"actions":[…]}`，解析器自动包成平凡计划（每步 `needs:[]`、无依赖无理由），v0.5 全部既有 E2E 与 `verify-copilot / verify-ask-apply / verify-copilot-cancel` **不得破**。
5. **DAG 坏步局部拒、不拖全部**：环成员 / 悬空 stepId（needs 指向不存在步）/ 自指 → 只拒该步并给原因，**其下游依赖步级联拒**；合法独立步照常入序、照常可执行。**但整份 >8 步（或触及 >10 任务）→ 整份拒绝**，一条不发，文案引导模型拆小。这是命令行长 JSON 风险的唯一控制手段（不搞文件传参 / 命令缓存）。
6. **同目标隐式串行 + 链式 baseline**：两条步 patch 同一 taskId → 无论模型怎么写 needs，按数组先后**强制串行**；整批提交内某步成功后，服务端把该 task 新 `updatedAt` 刷进 baseline，供同目标后续步做冲突比较——**不被误判为「他人已改」**。
7. **真实外部冲突仅拒相关步 + 依赖级联**：跨调用（逐步模式、或用户在面板手动改过台账）仍按原始 baseline 比较；他人动过 → 该步按 v0.5 原样拒「内容已被他人更新，为避免覆盖未执行」，**其余步继续**；该步的下游依赖步一并拒。
8. **整批 + 逐步两种确认**：同一勾选集合，整批一次 `ask-apply <projectId> <selected ordered actions> --base <baseline>`；逐步为前端逐步调 `ask-apply`（每次重读 domain）。**不新增执行命令、不新增计划命令**。
9. **勾选 / 标量编辑 / 跳过 / 取消**：每步一行 checkbox 默认全选，取消勾选 = 不进本次提交；行内只允许改白名单标量，改完即时重跑前端 `validateActions`，非法行标红并禁用确认；【再聊聊/取消】关卡 = **磁盘字节零变化**（沿用 s1-12 / `verify-copilot-cancel` 断言法）。
10. **幂等 / 部分成功 / 不自动补偿**：复用 v0.5 `recentDrafts`(60s TTL) + `inFlight`(Promise 去重)，幂等键由 `projectId+JSON(actions)` 扩为 `projectId+JSON(selectedOrderedActions)+JSON(baseline)`；逐步模式每步子集不同、键天然不同。结果文案带 stepId+title 逐行汇报。**P0 明确不做自动回滚 / 自动补偿 / 自动重试失败步**（唯一写是 5 标量 update，无删除/无级联/无创建，失败步不污染他人；已成功步如需还原由用户手工改）。
11. **降级零写**：无 Key / 鉴权失败（复用 `PROD_KEY_MISSING_TEXT`）、限流/额度尽、输出乱码抽不到 plan、上下文超长 → 一律只给中文降级或诊断正文，**计划卡不出现 / 零落库**；一次提问只发一次模型请求，「再聊聊」不重调模型（省额度）。
12. **GUI 计划卡**：拓扑列表、checkbox、行内标量编辑、拒绝红行、3 条确定性软风险（琥珀、不禁用）、【整批执行】【逐步执行】【再聊聊/取消】按钮、结果逐步汇报；卡片打开期间 snapshot 关键 `updatedAt` 变化 → 卡顶一行琥珀提示，**前端不自动重发模型**。

## 1. 分层与判定图例（与 ADL-045/047 严格一致）

- **自动化门（AUTO）**：离线表驱动纯函数（`parseCopilotPlan / validatePlanDAG / orderPlanSteps` + 复用 `validateActions`）+ ask-apply 守卫（链式 baseline / 幂等键 / 部分成功 / 零写静态检查）。脚本全绿即该项 PASS 可推进；**FAIL 仍阻塞**。
- **GUI 门（GUI）**：真实浏览器实测硬门槛；**离线纯函数 / HTTP 200 不得替代网页实测 PASS**。
- **人工协作门（MANUAL_PENDING）**：必须用户本人配合才能验者（真实模型限流/乱码/免费额度、真 390px 窄窗目视），既不算 PASS 也不阻塞自动化；用户反馈失败即重开缺陷。
- **状态**：`PASS` / `FAIL` / `BLOCKED` / `NOT_RUN` / `MANUAL_PENDING`。开发前本矩阵**全部 NOT_RUN**。
- `FAIL / BLOCKED / NOT_RUN` ≠ 通过；结论必须绑定 `testedCommit` 与证据路径；新提交使受影响项过期须重测后再引用。

## 2. 证据格式

- **自动化证据**：开发新增/扩展 `scripts/verify-copilot-plan.mjs`（解析/兼容/DAG/环/缺依赖/预算/同目标串行）、扩展 `scripts/verify-ask-apply.mjs`（链式 baseline / 幂等键含 baseline / 部分成功逐行）、新增 `scripts/verify-copilot-plan-cancel.mjs`（真实 storage spy `table.put` 计数 = 0、字节零变化）。记录命令、退出码、覆盖点。
- **GUI 证据**：隔离实例（独立 `DSH_HOME` + 独立端口 + 独立 storage root，**不碰 3080 正式数据与仓库 data/**）；每用例 `env.json`（`testedCommit`/`nodeVersion`/`chromeVersion`/`port`/`executedAt`，**禁写 token**）+ 截图 + 关键控件 `outerHTML` dump + `data-*` 断言行。目录 `docs/verification/gui-copilot-multistep-<ts>/<CASE_ID>/`。
- **零写证据**：GUI 用例前后对隔离 storage 做 mtime/sha 对比，证明「取消 / 降级 / 仅出草稿」未写任何业务 JSON；网络面板仅 `web snapshot` 读。
- **降级证据**：真实模型故障用真实免费额度触发者登记 MANUAL_PENDING；自动化侧用注入 `LlmGateway` 抛错 / 返回乱码来等价覆盖。

---

## 3. 解析与数据契约层（自动化门 AUTO）

> 被测对象（建议落点 `src/core/copilot.ts` 新增纯函数，保留现有导出）：`parseCopilotPlan(text)`、`validatePlan(plan, {taskIds})`（= `validatePlanDAG` 环/缺依赖局部拒+级联 + 预算护栏 + 复用 `validateActions` 逐步字段）、`orderPlanSteps(steps)`（同目标隐式串行 + 拓扑序）。

| CASE_ID | 最小输入 / 步骤 | 必含断言（缺一不可 PASS） | 门 | 状态 |
|---|---|---|---|---|
| CMP-PARSE-01 | 旧格式 `{"actions":[{"op":"task.update","id":"t-1","patch":{"assignee":"赵六"}}]}` | 自动包成平凡计划：每步 `needs:[]`、有 `stepId/title/action`；**不报错、不丢步**；后续可经既有 ask-apply 正常落库（向后兼容） | AUTO | ⏸ NOT_RUN |
| CMP-PARSE-02 | 新格式 `{"plan":[{stepId:"s1",…}]}` 与 `{"steps":[{…}]}` 两种键 | 两种键均能解析；每步字段 `stepId/title/reason/action/needs` 就位；`action` 复用 `CopilotAction` 形状 | AUTO | ⏸ NOT_RUN |
| CMP-PARSE-03 | 模型输出含 markdown 围栏 + 前后噪声（"诊断…```json{…}```完"） | 稳健抽出计划块；诊断正文（去 json 块后）独立返回、不混入计划 | AUTO | ⏸ NOT_RUN |
| CMP-PARSE-04 | 乱码 / 非 json / 空串 / 两者都抽不到 | `steps=[]`、`rejected` 记录原因、**不抛错**；前端只显示诊断正文（"模型未给出可执行步骤"） | AUTO | ⏸ NOT_RUN |
| CMP-CONTRACT-01 | 同一份计划里两步共用同一 `stepId:"s1"` | 后者被拒（`rejected` 带原因），前者仍在；**不得**因重复 stepId 整份拒绝 | AUTO | ⏸ NOT_RUN |
| CMP-CONTRACT-02 | 某步 `reason:""`（空） | 该步**不拒**，仅标黄「模型未说明原因」；其余步不受影响 | AUTO | ⏸ NOT_RUN |
| CMP-CONTRACT-03 | 某步带 `riskNote:"改完需同步周会"` | 原样透传展示字段；**不参与**任何拒绝 / 不禁用确认 / 不写库 | AUTO | ⏸ NOT_RUN |
| CMP-CONTRACT-04 | 某步 `action` 缺 `op` / `id` / `patch` 非对象 | 该步进 `rejected`（复用 `validateActions` 字段校验），其余合法步照常 | AUTO | ⏸ NOT_RUN |

## 4. DAG 拓扑 / 坏步局部拒 / 预算护栏（自动化门 AUTO）

| CASE_ID | 最小输入 / 步骤 | 必含断言（缺一不可 PASS） | 门 | 状态 |
|---|---|---|---|---|
| CMP-DAG-01 | s1→s2（`s2.needs=["s1"]`）、s3 独立 | 拓扑序输出 **s1 在 s2 前**；s3 位置确定（同级按数组序兜底）；两次运行顺序逐字节一致（确定性） | AUTO | ⏸ NOT_RUN |
| CMP-DAG-02 | 环：`s1.needs=["s2"]` 且 `s2.needs=["s1"]`，另有独立 s3 | **环成员 s1/s2 均被拒**（原因「依赖无法解析」），**独立 s3 照常入序、照常可执行**；不得整份拒绝 | AUTO | ⏸ NOT_RUN |
| CMP-DAG-03 | `s3.needs=["sx"]`（sx 不存在） | s3 被拒（原因「依赖 sx 无法解析，已跳过该步」）；**依赖 s3 的下游 s4 级联拒**；不依赖环的步照常 | AUTO | ⏸ NOT_RUN |
| CMP-DAG-04 | 自指：`s1.needs=["s1"]` | s1 被拒；其余独立步照常 | AUTO | ⏸ NOT_RUN |
| CMP-DAG-05 | 整份 9 步（≤10 任务） | **整份拒绝**「计划过大（9 步），请拆成 ≤8 步」；**一条不发、accepted=0**；不得出现「8 步放行 + 1 步局部拒」 | AUTO | ⏸ NOT_RUN |
| CMP-DAG-06 | 8 步但触及 11 个不同 taskId | **整份拒绝**（任务数 >10 护栏）；一条不发 | AUTO | ⏸ NOT_RUN |
| CMP-DAG-07 | 8 步且触及 ≤10 任务（边界） | 通过预算护栏，进入 DAG/字段校验，正常入序 | AUTO | ⏸ NOT_RUN |
| CMP-CHAIN-01 | s1 改 t-1 `{assignee:"甲"}`、s2 也改 t-1 `{status:"done"}`（模型无需 needs） | 无论模型如何写 needs，**两步按数组先后强制串行**；s2 用 s1 落库后的新 `updatedAt` 做链式 baseline，**不被误判「他人已改」**；两步都落库 | AUTO | ⏸ NOT_RUN |
| CMP-CHAIN-02 | s1 改 t-1、s2 改 t-2、s3 也改 t-1 | 同目标 t-1 的两步（s1/s3）相对串行；s2 与 t-1 步不冲突时按拓扑序执行；**不引入并行写**（仍走 `enqueueDomainWrite` 串行，DAG 只定顺序与级联跳过） | AUTO | ⏸ NOT_RUN |

## 5. 白名单 / 字段校验（复用 validateActions，自动化门 AUTO）

| CASE_ID | 最小输入 / 步骤 | 必含断言（缺一不可 PASS） | 门 | 状态 |
|---|---|---|---|---|
| CMP-ACTION-01 | 计划含 `task.delete / task.create / task.move` 步 | 该步进 `rejected`（原因「不允许的操作 X」），**不进可勾选列表**；其余 `task.update` 合法步照常 | AUTO | ⏸ NOT_RUN |
| CMP-ACTION-02 | `status:"doing"` / `progress:200` / `dueDate:"2026-02-30"` / `dueDate:"10/01"` / `patch:{foo:1}` / 空 patch | 逐字段复用 v0.5 校验，各自被拒且原因分别对齐「非法状态 / 进度须 0-100 / 日期须合法 YYYY-MM-DD / 未知字段 / 空 patch」；**非法步不拖合法步** | AUTO | ⏸ NOT_RUN |
| CMP-ACTION-03 | 同一次 patch 给 `startDate:"2026-12-01"` + `dueDate:"2026-10-01"` | 被拒「开始日期不得晚于截止日期」；正常区间放行 | AUTO | ⏸ NOT_RUN |
| CMP-ACTION-04 | 步目标 `t-9999`（不存在）/ `t-other`（属别项目 projectId≠当前） | 解析阶段目标不存在即拒；**ask-apply 落库前重读 domain 再校验一次归属**，跨项目步即便 patch 合法也拒且**不动其原值** | AUTO | ⏸ NOT_RUN |

## 6. 冲突 / 链式 baseline / 幂等 / 部分成功（ask-apply 守卫，自动化门 AUTO）

> 被测对象：`handleAskApplyCommand` 扩展（链式刷新 baseline、逐行带 stepId/title、幂等键含 baseline）。复用 `verify-ask-apply.mjs` 假域。

| CASE_ID | 最小输入 / 步骤 | 必含断言（缺一不可 PASS） | 门 | 状态 |
|---|---|---|---|---|
| CMP-APPLY-01 | 整批提交：勾选 3 步按拓扑序拼成 action 数组，一次 `ask-apply … --base baseline` | 3 步按序落库；返回文案「已应用 3 步（s1 …；s2 …；s3 …）」带 stepId+title | AUTO | ⏸ NOT_RUN |
| CMP-APPLY-02 | 逐步模式：前端逐步调 `ask-apply`，每步独立重读 domain | 每步独立校验、独立落库；前一步结果展示后再发下一步；**不共享整批 TTL 误判为重复** | AUTO | ⏸ NOT_RUN |
| CMP-CONFLICT-01 | 计划生成后、确认前，他人把 t-3 的 `updatedAt` 改了；s3 改 t-3，s1/s2 改别的 | **仅 s3 被拒**「内容已被他人更新，为避免覆盖未执行」；s1/s2 照常落库；s3 的下游依赖步一并拒；文案逐行说明哪步被挡、为什么 | AUTO | ⏸ NOT_RUN |
| CMP-CONFLICT-02 | 基线 `--base` 格式非法（malformed 对象） | **直接报错中止**，防误覆盖；不静默 ignore、不写任何库 | AUTO | ⏸ NOT_RUN |
| CMP-IDEM-01 | 同一勾选集合（含同一 baseline）60s 内重复确认 | 第二次返回「该计划已确认过，为避免重复写库未再次执行（幂等拦截）」；**目标只写一次**（updatedAt 只前进一次） | AUTO | ⏸ NOT_RUN |
| CMP-IDEM-02 | 同一 actions 但 baseline 不同（重新生成计划）/ 逐步模式不同子集 | 幂等键 = `projectId+JSON(selectedOrderedActions)+JSON(baseline)`，不同 baseline / 不同子集 **不互相误拦** | AUTO | ⏸ NOT_RUN |
| CMP-PARTIAL-01 | 一批中 2 步合法、1 步写库抛错、1 步 task.delete | 合法 2 步落库；失败步文案「写库失败（…）」；delete 步拒「不允许的操作」；**三类结果互不影响**，总体 kind 仍 success | AUTO | ⏸ NOT_RUN |
| CMP-COMP-01 | 一批中 s2 落库失败 | **不自动回滚 s1**、不自动补偿、不自动重试 s2；s1 保留已落库值；无第二次未经确认的写 | AUTO | ⏸ NOT_RUN |
| CMP-ZERO-01 | 仅「出草稿 / 取消」分支：造任务 → validatePlan 产出草稿（只读）→ spy `table.put` | **写计数 = 0**、领域字段（assignee 等）不变；沿用 `verify-copilot-cancel` 断言法 | AUTO | ⏸ NOT_RUN |

## 7. 降级 / 零写（自动化门 AUTO + 人工 MANUAL_PENDING）

| CASE_ID | 最小输入 / 步骤 | 必含断言（缺一不可 PASS） | 门 | 状态 |
|---|---|---|---|---|
| CMP-DEG-01 | 注入 `LlmGateway` 抛 `PROD_KEY_MISSING` / 鉴权失败 | 返回既有 `PROD_KEY_MISSING_TEXT`；**计划卡不出现**；台账零变化 | AUTO | ⏸ NOT_RUN |
| CMP-DEG-02 | 注入 `LlmGateway` 抛限流 / 额度尽错误 | 中文降级「免费模型限流/额度用完，稍后再试」；零落库 | AUTO | ⏸ NOT_RUN |
| CMP-DEG-03 | 注入模型返回乱码 / 抽不到 plan | 诊断正文照常显示；卡区「模型未给出可执行步骤」+ rejected 原因；**零落库** | AUTO | ⏸ NOT_RUN |
| CMP-DEG-04 | 上下文超长（项目数据过大） | 中文降级「项目数据太大，请缩小范围后重试」；零落库 | AUTO | ⏸ NOT_RUN |
| CMP-DEG-05 | 真实免费模型实际限流 / 乱码 / 无 Key 实机 | 真实故障下降级文案与零写行为同 AUTO 断言；受额度/认证所限，登记待所有者本人反馈 | MANUAL_PENDING | ⏸ NOT_RUN |

## 8. GUI 计划卡与交互（GUI 门）

> 被测：`panel.tsx` `CopilotPanel` 草稿卡→计划卡升级。隔离实例实测；主端按实现后实际 `data-*` 核对，不臆测选择器。fixture 走 `DSH_PM_E2E=1` 的 `ask fixture <pid>` 缝（需扩成多步：含 delete 步 + 环依赖）。

| CASE_ID | 最小步骤 | 必含断言（缺一不可 PASS） | 门 | 状态 |
|---|---|---|---|---|
| CMP-GUI-01 | `ask fixture <pid>` 出多步计划 | 计划卡按**拓扑序**逐行渲染：每行 checkbox + stepId + title + reason（「为什么：…」）+ 行内标量编辑控件；标题区「操作计划（N 步，将影响 M 条任务，需确认）」 | GUI | ⏸ NOT_RUN |
| CMP-GUI-02 | 计划含 task.delete 步 | 该步显示为**拒绝红行**「已拒绝：不允许的操作 task.delete（t-…）」，**无 checkbox、不可勾选、不进提交列表** | GUI | ⏸ NOT_RUN |
| CMP-GUI-03 | 取消勾选 s3，再点【整批执行】 | 提交只含其余步；s3 不落库；结果逐行带 stepId+title 汇报 | GUI | ⏸ NOT_RUN |
| CMP-GUI-04 | 把某行 status 改成非法值（如 doing）/ progress 编成 200 | 该行**标红**、【整批执行】【逐步执行】**禁用**；改回合法值后恢复可用（前端即时重跑 validateActions） | GUI | ⏸ NOT_RUN |
| CMP-GUI-05 | 行内编辑合法标量（status 下拉四态 / progress 数字 / assignee / start·dueDate）后确认 | 编辑值进入本次提交、并落库；起止倒挂即时标红禁用 | GUI | ⏸ NOT_RUN |
| CMP-GUI-06 | 点【逐步执行】 | s1 跑完**先展示该步结果** → 用户确认 → 再 s2；每步独立重读 domain；逐步结果逐行可见 | GUI | ⏸ NOT_RUN |
| CMP-GUI-07 | 软风险 3 条确定性规则命中：①progress=100 但 status≠done；②目标 dueDate 早于今天且步改 in_progress；③assignee 是全项目从未出现的人名 | 对应行显示**琥珀色**软风险文案（「口径可能不一致 / 该任务已逾期 / 新负责人，确认不是错别字」）；**不禁用确认**；模型给的 riskNote 原样一行展示 | GUI | ⏸ NOT_RUN |
| CMP-GUI-08 | 卡打开期间，隔离 storage 把某关键任务 updatedAt 改掉（模拟他人改动） | 卡顶出现一行**琥珀提示**「你打开草稿后台账有变化，确认时将逐行重新核对」；**前端不自动重发模型**、不自动重绘计划 | GUI | ⏸ NOT_RUN |
| CMP-GUI-09 | 点【再聊聊/取消】关卡 | 隔离 storage 业务 JSON **mtime/sha 前后逐字节一致**；网络面板仅 web snapshot 读，无写命令；不调用 ask-apply | GUI | ⏸ NOT_RUN |
| CMP-GUI-10 | 同勾选集合 60s 内连点两次【整批执行】 | 第二次命中幂等拦截文案「该计划已确认过，未再次执行」；目标只写一次 | GUI | ⏸ NOT_RUN |
| CMP-GUI-11 | 收窄窄窗（真 viewport ~390px 或窄侧栏） | 计划卡/红行/软风险/按钮纵向堆叠、可横滚，无横向溢出/文字重叠；真 390 视口目视待所有者确认 | MANUAL_PENDING | ⏸ NOT_RUN |
| CMP-GUI-12 | 全程网络面板 + storage mtime/sha | 出草稿 / 取消 / 降级全程**零写**；正式数据（3080/3091、仓库 data/）**零污染**；fixture 用独立临时项目、结束删净 | GUI | ⏸ NOT_RUN |

## 9. 非功能门（AUTO + GUI）

| CASE_ID | 断言 | 门 | 状态 |
|---|---|---|---|
| CMP-NF-01 | **计划不持久化**：不新增/改任何 record schema、domain table、settings 写、命令级服务端计划缓存；`core/storage.ts` domain 版本未动（仍 v1）；关面板计划即消散、重启不恢复旧计划 | AUTO | ⏸ NOT_RUN |
| CMP-NF-02 | **唯一写动作 task.update**：grep 新增代码无 `task.delete/task.create` 落库路径；patch 仅 5 标量；不自动改 milestone/risk/meeting/report/deliverable/project | AUTO | ⏸ NOT_RUN |
| CMP-NF-03 | **旧链路回归不破**：`pnpm run build` 退出 0；既有 `verify-copilot.mjs`（legacy+加固）、`verify-ask-apply.mjs`、`verify-copilot-cancel.mjs` 全绿；v0.5 E2E fixture 用例不破 | AUTO | ⏸ NOT_RUN |
| CMP-NF-04 | **正式数据零污染**：GUI 全程隔离 `DSH_HOME`/端口/storage root；`docs/verification/` 证据 env.json 仅含 commit/port/node/chrome/相对 fixture 说明，**无 token/cookie/认证 URL** | AUTO+GUI | ⏸ NOT_RUN |

## 10. 不擅判 / 留待实测项

- 真实模型限流 / 乱码 / 免费额度、无 Key 实机体验，受系统能力/认证所限 → CMP-DEG-05 登记 `MANUAL_PENDING`，**不阻塞**自动化门；所有者反馈失败即重开缺陷。
- 真 390px 窄窗目视（CMP-GUI-11）沿用 People-Load PL-WEB-11 口径：容器人工拉宽不算 viewport，以真 viewport 复测为准。
- 软风险 3 条规则的文案与命中口径以实现后实际命中证据为准；主端在证据列出实际触发行，专家核对是否覆盖全部 3 条且**未误禁用确认**，不达标转 FAIL。
- P1（计划持久化 / 撤销上次计划 / 多轮重规划 / 扩充 op）**不在本门**；若开发顺手实现，另起独立验证，不混入本门判定。
- 旧 H1–H6（v0.5.0 发布收尾四块门）已在 `release-closeout-acceptance.md` 闭环，**本门不重复、不作为本门阻塞项**。

## 11. 当前判定（开发完成后由独立测试专家回填）

> 回填人：独立测试专家；`testedCommit =`（待填，须为实现提交）；执行日期 / 环境 / 隔离实例端口 / 证据目录 待实测后补。

- 开发前状态：**全部用例 NOT_RUN**（CMP-PARSE/ CONTRACT/ DAG/ ACTION/ APPLY/ CONFLICT/ IDEM/ PARTIAL/ COMP/ ZERO/ DEG/ GUI/ NF 共 **51 项**；其中 `MANUAL_PENDING` 2 项＝CMP-DEG-05 真实模型故障、CMP-GUI-11 真 390 窄窗，均不阻塞自动化门）。
- 门控结论：待开发实现后，自动化门全绿 + GUI 门逐项审证 + MANUAL_PENDING 项登记，再由测试专家给 PASS/FAIL；`FAIL / BLOCKED / NOT_RUN ≠ 通过`。

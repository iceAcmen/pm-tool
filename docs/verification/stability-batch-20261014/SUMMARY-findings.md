# 稳定性批次 GUI 采证摘要（stability-batch）

基线：client `lib/client.js`=dd66be290d2d1568742821b10713243f0790edf78fdc8c43ce703de3550f1397（实测一致），HEAD=217d8ae。隔离 3096，正式 3080/3091/data 未碰。只采证不判矩阵。

## S1-G1 成功路径树/code 一致回归 — 事实
- 项目A 移动「T7-W5-新任务」(t-0001) 到父 T1：toast「任务已移动到父任务 t1，并重编为 1.1」。
- 磁盘读回：t-0001 code=1.1、parentId=t1；T1=code 1 parent=null。重启宿主后再读回仍 code=1.1/parent=t1，未变。
- 截图 `S1-G1-moved-tree.png`。

## S1-G2 复合失败错误文案可见 — 仍 BLOCKED（无故障缝）
- 核 client/lib/client.js=dd66be29（与冻结一致；命令层 formatAggregateCommandError 多行格式化已在 src/commands/task.ts:160，输出=「原始错误：…/恢复失败（N项）：」且 sanitize 去 stack）。
- 但要在 GUI Notice 触发该聚合文案，需 moveTaskAndRenumber 主写失败+回滚也失败（core/tasks.ts:561 AggregateError），即真磁盘故障注入。
- 冻结 build 无任何 E2E/forceFail/public execute 注入缝；面板 MovePicker 正常/环校验走普通 Error，不产生 AggregateError 多行 Notice。
- 未用 JS DOM 伪造 Notice。隔离 scratch fault build 代价高（需改 core+重 build，违反冻结），按用户许可跳过。
- 交主执行端：在 fault-injection build 上触发 MovePicker 复合失败，截图多行 Notice（移动并重新编号失败/原始错误/恢复失败(N项)、可滚、无 stack）。

## S2-G1 副驾确认→重复→重启 — 部分采到（PoC 真 plan）
- PoC 定向 prompt「把 T1 进度改为30」确实生成可确认计划卡（s1 将 T1 进度设为30%，整批/逐步按钮）。
- 首次「整批执行」→「已应用 1 步」，t1 progress=30、updatedAt=09:50:32。
- 同 prompt 重发→PoC 重新生成**措辞略异**的计划（"确认T1进度设为30%"），再执行→又写一次，updatedAt=09:52:44。
- **诚实结论**：UI 在 apply 后丢弃 plan 对象；重发 prompt 生成的 actions 字符串不同→draftKey 不同→未命中幂等拦截。本环境无法经「重新打字 prompt」复现「同 plan 二次确认→幂等拦截」；60s 内重启重放亦因 plan 已丢、无同 actions/baseline 可重放。未伪造幂等 PASS。
- 真幂等段（同 plan 二次确认文案/重启后已执行不二次写）需保留 plan 对象的重放通道或固定 actions，交主执行端。

### S2-G1 补充：apply 防重（双击）证据
- PoC prompt「T1 进度改40」→ 计划卡 s1 更新 T1 进度为40%（带整批/逐步按钮），截图 `S2-G1-plan-card.png`。
- 对 apply 按钮真实 `click(ref, clicks=2)` 双击（不等首响应）：before updatedAt=09:52:44.355 → after=09:55:48.958，**只推进一次**（progress=40 落盘一次），未二次写。
- Notice「已应用 1 步（s1 t1 更新任务 T1 进度为40%）」；apply 后 plan 按钮组（整批/逐步/再聊聊）从 DOM 移除（plan 清除），截图 `S2-G1-after-apply.png`。
- 限制如实：BU click clicks=2 作为原子双击事件发出；DOM/磁盘证明后端只处理一次，按钮 busy 去重生效。无法在浏览器内再注入第三个独立并发请求，故「防重窗口外第三击」未测。

## S3-G1 项目表单 repo 往返 — 事实
- 编辑项目 p-a 表单含 repoUrl(placeholder=https://host/org/repo.git)+branch 字段。
- 非法值 `not-a-url`：内联中文错误「仓库地址需为 http(s)://、git:// 或 git@host:org/repo.git 形式」、输入框红框 aria-invalid，保存被拦（抽屉未关）。截图 `S3-G1-illegal-inline-error.png`。
- 合法值 `https://github.com/org/p-a.git`+`main`：错误消失、保存成功；磁盘 p-a repoUrl/branch 落盘；重启读回仍一致。

## 收尾
- 3096 已停；正式 3080/3091 up 未触；敏感扫描证据目录无 token。

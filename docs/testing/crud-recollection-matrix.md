# CRUD 补采矩阵（7 实体，可冻结 ID / 最小步骤 / 必含断言）

> 目的：§34-46 的 7 个 CRUD 仅一行手写 txt，证据不足。本矩阵供采证端按冻结 ID 补采原始证据，测试专家据此独立重核。
> 维护：测试专家（本目录独占）；不改产品代码、不删正式数据。

## 0. 通用前置纪律（每条用例必带）
- 在每条用例证据目录记录 `testedCommit`（实际运行提交）+ `dirtyProductFiles=false`；不引用过期 env.json。
- 用例里的 p-r3t / m-r3t 等均为**逻辑别名**；系统实际生成 p-NNNN 等真实 ID，**必须记录实际 ID，不强制伪造别名 ID**。
- 每个实体用例必须产出：① 创建后实体 JSON；② 编辑前后 JSON diff；③ 删除确认对话框截图（含取消保护演示）；④ 删除后 `ls` 输出证明目标 absent；⑤ 关键按钮 click 前后 `outerHTML` dump（不只用 textContent/disabled 目测）。
- 取消保护：删除 confirm 弹出后先点**取消**，证明**数据未变**（目标仍在、磁盘字段不变）；取消后抽屉是否关闭**不强制**（关抽屉也合法）。再点**确认**完成删除。两段都要证据。
- **Dialog 等效证据口径（替代原生 dialog 像素截图）**：原生 confirm 截图受工具限制时，可接受以下组合替代——① 真实 dialog API 返回的 message/type **与 result**（取消/确认）；② 取消分支与确认分支各自的实体 JSON（证明数据未变 / 已删 absent）；③ **触发按钮 outerHTML dump**（原生 window.confirm 无 DOM 节点，不采对话框 outerHTML）；④ 触发瞬间页面截图。**硬约束：必须走真实 confirm，不得提前 patch/覆盖 window.confirm；不得用 JS click 阻塞 30s 致遗留弹窗干扰用户。** 门槛不降。
- 证据目录：`docs/verification/gui-round3-<ts>/crud/<CASE_ID>/`（before.json / after.json / ls-before.txt / ls-after.txt / shots/*.png）。

---

## 1. 冻结用例矩阵

| CASE_ID | 实体 | 最小步骤 | 必含断言（缺一不可 PASS） |
|---|---|---|---|
| CRUD-PROJ-01 | projects | GUI 新建（记录实际 p-NNNN）→ 编辑 **name** → 删除（先取消后确认） | 创建后实际 ID 的 JSON 存在且字段对；编辑前后 **name** diff；取消后该项目数据未变；确认后 ls projects/ 无该 ID；console 0 |
| CRUD-MILE-01 | milestones | 新建 m-r3t → 编辑名称 → 标记达成(outerHTML before/after) → 删除 | m-r3t.json 全生命周期；达成后 status=achieved+achievedDate；按钮 outerHTML disabled 同步；取消后仍在/确认后 absent |
| CRUD-RISK-01 | risk_issues | 新建 ri-r3t(high/high) → 编辑 title → status closed → 删除 | ri-r3t.json 各阶段；概率/影响 high/high 落盘；闭环 status=closed；矩阵格位截图；取消/确认两段 ls |
| CRUD-MEET-01 | meetings | 新建 mtg-r3t(结构化+notes) → 编辑 title/status(outerHTML) → 删除 | mtg-r3t.json edit 前后 diff（证明 edit 真改）；notes 保留；编辑表单截图；取消后在/确认后 absent |
| CRUD-DLV-01 | deliverables | 新建 dlv-r3t v1.0 → 升 v1.1 带变更注 → 删除 | **v1.0 与 v1.1 两版 JSON + history 数组快照**（版本历史必要断言）；变更注落盘；取消/确认两段 ls |
| CRUD-TASK-01 | tasks(级联) | 新建父 t-r3tP + 子 t-r3tC(parent=父) → 删除父 | 父子 JSON 创建后快照；级联 confirm 对话框截图（含"将删除2条/旁支不受影响"）；**取消后父子均在**；确认后 ls tasks/ 两文件均 absent |
| CRUD-RPT-01 | reports | 生成 rpt-r3t 固定快照 → 编辑 title/executiveSummary → 删除 | rpt-r3t.json snapshot 字段固定；编辑前后 diff；取消后在/确认后 absent；console 0 |

## 2. 不擅判事项（先待查）
- 3091/CDP：**监听已观测（PID 26939），网络/CDP 根因未证实**——不擅自归产品或设施。
- 真 viewport 390：容器人工改 width 不算 viewport，待 CDP 恢复后真 viewport 复测。
- Space 无响应：不等于按键映射设施故障，待原始 key 证据再判。

## 3. 当前判定
- 7 CRUD：全部**待本矩阵补采后重核**，当前不记 PASS。
- 证据充分保留（绑各自版本，不外推）：行内编辑 s1-08、甘特 s1-10、副驾取消 s1-12、副驾确认 s1-13、恢复链 s1-20、milestone toggle（缺 GUI 截图，待补一张按钮状态图）。
- **总门：NOT PASS。**

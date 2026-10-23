# P0 context / 窄集 / metric 原证独立审查 R1

> 2026-10-23，trae，独立测试专家，非 Main、非开发、非 GUI 执行端。本单仅审已封包 P0ContextMetricR1 的 695 件原证；唯一新增本报告同名前缀文件。

## 1. 有限裁决

**PASS_LIMITED_CONTEXT_GUI：RA-P0001 的 t-0001 有材料、t-0006 空材料两次真实 ask、相关任务投影及不确认退出关闭。**

**PASS_LIMITED_NARROW_CONFIRM_GUI：RA-P0002 仅第三真实 ask 的 description/evidenceUrl/repoUrl/branch 合法窄集整批明确确认、title 禁止步可见拒绝及旧五标量保留通过。整 RA-P0002 不签 PASS。**

**PASS_LIMITED_CURRENT_METRIC_GUI：RA-P0006 的真实 capture + ask-apply 两 kind、一次 clean undo、生产留痕/计数、p-0002 空值及同实例 reload 复读关闭。** appliedSteps=3 是三份 basis 引用，不是三个不同任务、三个计划步或三个仍生效操作。

`remainingContextSlice=[]`，`remainingCurrentMetricSlice=[]`。本窄集/title 子片无剩余；**整 P0002 的其余 GUI 拒绝仍 NOT_RUN**，详见第 6 节。没有新增产品 FAIL；不签全部 context、全部故障、全页面样式/UX、P0 整域、P1、B8、父目标或 ordinary commit 准入。

## 2. 合同、角色与候选

负责人本子单：“独立测试专家非Main非开发”“只读审已封包P0ContextMetricR1695原件”“唯一写面docs/testing/p0-context-metric-gui-review-20261023-r1*新文件”“不执行产品/GUI/build/install/services/Git/凭据”“只签有限层与exact remaining”“审结明确released/STOP，不等待新派”。父授权持续补全部未验至普通 commit，不含 push/release；本子角色没有 Git 或父出口签字权限。

依据：[AGENTS](../../AGENTS.md)、[collaboration §9/§11](../collaboration.md)、[精确派单 §2](../plans/2026-10-23-p0-p1-sealed-review-dispatch.md#2-p0新封包695原件)、[原成长合同 §2](remaining-governance-cases-20261021.md#2-p0底座与采集闭环)、[最终继承 §5 第2组](op-growth-final-inheritance-20261022-r1.md#5-给-main-的最小合并动作)。本单明确覆盖通用拉取、安装、构建、产品回归、livingdocs 同步和 Git 收尾要求。不改旧 testing/原证，不清共享 dirty，不新增用例或功能。

| 身份/原件 | 本次独立核实与有限继承 |
| --- | --- |
| [695 件 index-r1](../../reports/all-pending-evidence-20261021/P0ContextMetricR1/index-r1.json) | 695/695 大小与 SHA 同；索引 113819 bytes，SHA `ae49ad09eea486eccc8deff48c14a0afac63ce6aa7fb150e23922c7226434010`；索引后新增空 |
| [原 Successor114 index-r1](../../reports/all-pending-evidence-20261021/Successor114GuiR1/index-r1.json) | 166/166 大小与 SHA 同；索引 SHA `556127531637e1f4bfde0899cafe7c1186b2caa79368dc9f86d4d95cf4edd47a`，不覆索引、不重新签其 GUI |
| 基线与候选 | 基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`；114 声明/521 完整包输入与 Combined114 原清单准确绑定，不拿父 dirty、HEAD 或版本代候选 |
| 冻结字节资格 | 本次核归档 [source-files](../../reports/all-pending-evidence-20261021/CombinedSuccessor114R1/source-files.json)、[complete-inputs](../../reports/all-pending-evidence-20261021/CombinedSuccessor114R1/complete-inputs.json)及 binding/close 逐键；冻结实体字节沿[原整回归专家](combined-successor114-regression-review-20261022-r1-report.md)与[原 GUI 专家](copilot-prefix114-gui-retest-20261022-r1-report.md#原包与运行归属)继承，未访问 private 冻结/运行根 |
| 部署与网关 | 原 3264/PID10975、3261/PID60386；冻结 `/private/tmp/pmtool-combined-successor114-20261022-r1`，runtime `/private/tmp/pmtool-successor114-gui-runtime-20261022-r1`，均只记录归档身份，不探活 |
| 开关/模型 | 原宿主 DSH_PM_E2E=0；保存模式 prod，updatedAt=`2026-10-22T15:15:07.681Z` 未变。网关为原获准确定性依赖，不签外部模型/Key可用性；本包 model-status 原 RPC 有“未就绪”，不能沿旧就绪提示宣称当前真实外部模型已验证 |
| 范围纠正 | binding.scope 仍提 P1004，但本派单 §2 和原观察明确排除 P1004；本角色不审 §3 P1、不据宽 scope 扩权 |

prod 点击、标准 F5 恢复、宿主装载和 profile 归属只沿原 Successor114 GUI 准确来源继承；未读取 entry/token/profile/key，不新探活。原 first-load/cache 与宿主 Git/bundle 身份未完整声明的边界保留，不新增成本 P0 有限门前置。

原 capture 合法创建/来源已由[原 capture 专家](p0-capture-remaining-gui-review-20261023-r1-report.md)关闭。本次只核其已存生产账本在后续保持，不重 capture/attach/session/lesson/check/GM01/HC01、不重新签原来源整域。

## 3. 原请求、回答与目视

本角色对 **全部 17 张原 PNG** 调用 view_image 实际目视，另目视 **7 张原 JPEG**：narrow-tab-0/1/2、narrow-confirm-0/3、narrow-undo-metric-5/13。179 帧全部核原事件引用和 SHA，但不称全部帧均已目视或连续完整录屏。selfreader 只验结构/字节，不能替代上述目视。

| 原动作 | 原 RPC / 网关 | 实际目视与语义 |
| --- | --- | --- |
| 有材料 ask | `a447b137-af23-4125-8484-7f98149c7fa8` / seq16，`2026-10-22T20:33:26.939Z` | [回答](../../reports/all-pending-evidence-20261021/P0ContextMetricR1/context-material-visible.png)与[投影](../../reports/all-pending-evidence-20261021/P0ContextMetricR1/context-material-projection.png)：t1 备注无、证据有、dlv-0001、四资料及两条有效进展；明确不构成完成验收，无可执行步骤；投影同任务、未开始、未指派、0%、证据有 |
| 有材料退出 | 关闭副驾，无 apply | [退出图](../../reports/all-pending-evidence-20261021/P0ContextMetricR1/context-material-exit-noapply.png)：回任务页，副驾关闭；业务/文件根与初态精确同 |
| 空材料 ask | `8b5ae244-df0f-4644-aefc-67719432aef0` / seq17，`2026-10-22T20:34:06.918Z` | [空材料图](../../reports/all-pending-evidence-20261021/P0ContextMetricR1/context-empty-visible.png)：t6 保留真实备注，证据/交付物/资料/进展均无，不能确认实际完成，不编造；投影 t6、未开始/未指派/0%、证据无 |
| 空材料退出 | 关闭副驾，无 apply | [退出图](../../reports/all-pending-evidence-20261021/P0ContextMetricR1/context-empty-exit-noapply.png)与保存根无变化；“空材料”不是无备注 |
| 第三 ask | `23d86ed2-c105-4291-8975-e698566d140f` / seq18，`2026-10-22T20:34:45.206Z` | 真实生产解析两建议：s1 四合法字段，s2 title 禁止；尚未确认时零业务写，不是执行者手 seed 页面/数据库 |
| 整批明确确认 | `c70de059-7085-43db-9915-c5ed9ea20091` | [确认前](../../reports/all-pending-evidence-20261021/P0ContextMetricR1/narrow-before-confirm.png)可读 s1、勾选、整批执行（1）及“已拒绝：s2 t-0006：未知字段 title”；实际发出的 ask-apply 恰 s1，没有 title |
| 确认后 | 返回“已应用 1 步” | [确认后观察](../../reports/all-pending-evidence-20261021/P0ContextMetricR1/narrow-confirm-after-timeout.png)与[撤销前](../../reports/all-pending-evidence-20261021/P0ContextMetricR1/narrow-applied-before-undo.png)显示暂无草稿、真实撤销入口及10分钟/一次性说明；四合法值由真实请求和落盘证明，草稿控件没有逐一展示四值，不冒全部字段可见性 |
| clean undo | `25ac04c3-9446-423f-81f8-c7dbccf891aa`，实际 handle `undo-mvk02xb0-khgm5a` | 返回“已撤销 1 项（tasks/t-0006）”；[撤销后图](../../reports/all-pending-evidence-20261021/P0ContextMetricR1/narrow-undone.png)入口消失，原 JPEG 显示对应前后状态；t6 原字节恢复 |

三条真实 [gateway 原请求](../../reports/all-pending-evidence-20261021/P0ContextMetricR1/gateway-real-requests.json)与 owner 的归档 NDJSON 逐结构相符。独立按问题文本/rpcId/时序绑定，每次一个 `/v1/messages`，fixture.text 与真实 RPC 回答逐字一致；不是 Main “realAskRequests=3”直接升级签字。17 对 RPC 均完整配对，真正 ask3/apply1/undo1；`ask-undo list` 只读列表不计第二撤销。捕获窗口 exception 行为0，不声称全 console/全运行期无错。

白名单上下文与原 JSON 相符：t1 四资料分别为 QA规范、冻结 QA交付物V1、QA 中文 文件.md、version-two.md；取 pl-1 最新 rv3 正文与同日异 ID 的 pl-3，排除 pl-2 软删及旧修订。证据有无、交付物引用、备注、任务状态准确；不投 project2 的 t2，不泄内部 relPath/文件存储路径。这里只证本两种合法输入，不签所有恶意上下文/长内容或模型自然语言能力。

## 4. 写入、恢复与 metric

独立核 **17 保存态、432 份业务原 JSON**，逐份匹配其 roots 大小/SHA；确认前各态31项，确认后32项。files 两项、backups 四项只保存原摘要表，本包没有六份字节 payload，故仅签归档摘要一致，原 payload 资格沿原专家，不冒本次重新读取 private 字节。

确认前九个后续态均与 context-before 的31项根清单完全相同。实际确认仅 t6 与三份 settings 有差异：新增 `askApplyIdempotency.json`，更新 `pmProvenanceLedger.json`、`pmProvenancePending.json`；不笼统排除 settings。t6 的实际合法值为：

```json
{
  "description": "P0002合法窄集20261023",
  "evidenceUrl": "https://example.com/acceptance/p0002",
  "repoUrl": "https://example.com/repository/pm-tool",
  "branch": "acceptance-p0"
}
```

旧五标量 assignee=`""`、status=`todo`、progress=0、startDate/dueDate 原来无键，确认后仍无键；不把“无键”改写为 null 已保存。title、priority、ID及其他原键不变，额外只更新 updatedAt。t6 确认前/撤销后均453 bytes，SHA **`0405adff651cbc3f46aa7b2503423c093c11b3811cbd2e361f6a0586b5d1853f`**，Buffer逐字节全等，不仅字段等或 Main `undoTaskByteExact=true`。

撤销真实只改 t6 和 ledger。幂等记录保留、pending仍为空且更新后的字节保留；不能写“全库回到确认前”。ledger 保留原 capture entry，新增 ask-apply 的 applied 留痕并追加 undone，undo.used false→true；不删除历史或重新写成从未执行。

| 账本/原结果 | 实核 |
| --- | --- |
| capture | `prv-mvjzrmpz-wczgnh`，refs=t5/t6 两份 basis，旧 entry 不变 |
| ask-apply | `prv-mvk02xb4-v9ovm8`，refs=t6 一份 basis，audit=applied/undone |
| metric p1 | total2，byKind={ask-apply:1,capture:1}，appliedSteps3，pending0，undoOutcomes={undone:1,conflict:0,failed:0} |
| 最近时间 | `2026-10-22T20:35:22.528Z` 为最近 entry.createdAt，不伪称最近撤销时间或本地日期转换 |
| metric p2 | total/applied/pending=0，byKind={}，last=null，撤销各计数0，暂无留痕 |
| reload | 同origin3264；timeOrigin `1792700878266.6`→`1792701362376`，第二 metric 逐值等，所有已保存业务/files/backups 摘要与撤销后完全同 |

[p1 首次图](../../reports/all-pending-evidence-20261021/P0ContextMetricR1/metric-after-undo-visible.png)、[p2 空图](../../reports/all-pending-evidence-20261021/P0ContextMetricR1/metric-other-project-visible.png)、[reload 图](../../reports/all-pending-evidence-20261021/P0ContextMetricR1/metric-reentry-visible.png)实际可读计数、last/null与只读/小样本声明；这是既有宿主真实命令读出口，不是新增 metric 统计页，也不签新宿主重启。

[来源图](../../reports/all-pending-evidence-20261021/P0ContextMetricR1/provenance-after-undo-visible.png)与 RPC 显示：ask-apply 的旧 postimage 在撤销后诚实 changed/needs-regen，capture 两源 consistent；只是查询派生 recheck，不洗旧账本。没有 `rejected` metric 键，不虚构拒绝计数、不把 title 拒绝算入账本；conflict/failed=0 只是本样本，不能冒已实测两种撤销故障。

宿主会话、private/profile/cache、正式根和全盘不在本包 WATCH；不签全 data 零写、全机零污染。Main 后续采证可追加 owner 网关日志，本审计只保护 seq16/17/18 原行，不冻结整份活日志。

## 5. 原 timeout 与自有审计失败

**原 round03/04 两个 timeout 保留，不洗绿、不重 ask/apply。**

round03 在响应已保存后，等待诊断 tab 中不存在的草稿标题“补充合法备注”。[timeout 图](../../reports/all-pending-evidence-20261021/P0ContextMetricR1/narrow-after-timeout.png)仍是只读诊断；narrow-tab 三原帧实际呈诊断→草稿、勾选与 title 拒因，[切 tab 后图](../../reports/all-pending-evidence-20261021/P0ContextMetricR1/narrow-tab-visible.png)有操作计划，narrow-tab-events.rows=[]，根清单同。不是新 ask；未单独记录点击时间，不编造 click trace。

round04 响应/落盘已成功，随后等待瞬时“已应用”文字超时。之后独立保存观察显示撤销入口，再走真实 clean undo；确认事件仅一次 ask-apply，没有重放。原瞬时 toast 持续时间/完整首次可见性不签；本 limited confirmation 按明确按钮、实际请求、原落盘和后续入口裁定，不依赖 toast 截图。本695索引没有外层 execution-receipts，不能编造原所有脚本 exit0；timeout 根因按原指令事实、归档等待条件与图/帧交叉解释，不伪造完整外层错误栈。

本角色环境：macOS/bash、现有 nvm Node **v22.23.3**；pnpm **11.28.5**只沿原环境引用，未运行/安装。实际自有命令均在仓库根，Node绝对路径为 `/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node`：

```sh
node --check docs/testing/p0-context-metric-gui-review-20261023-r1-reader.mjs
node docs/testing/p0-context-metric-gui-review-20261023-r1-reader.mjs audit
node --check docs/testing/p0-context-metric-gui-review-20261023-r1-reader.mjs
node docs/testing/p0-context-metric-gui-review-20261023-r1-reader.mjs audit-r2
node docs/testing/p0-context-metric-gui-review-20261023-r1-reader.mjs audit-r3
node --check docs/testing/p0-context-metric-gui-review-20261023-r1-reader.mjs
node docs/testing/p0-context-metric-gui-review-20261023-r1-reader.mjs seal
node --check docs/testing/p0-context-metric-gui-review-20261023-r1-reader.mjs
node docs/testing/p0-context-metric-gui-review-20261023-r1-reader.mjs seal-r2
```

前三次syntax exit0；首 [audit](p0-context-metric-gui-review-20261023-r1-audit.json) exit1，误把 ask-undo list 计撤销；[r2](p0-context-metric-gui-review-20261023-r1-audit-r2.json) exit1，按文件名顺序错配网关问题，连带窄集组未完成。均为自有 reader 错误，不是产品 FAIL，原失败保留。只改 reader 后，[r3](p0-context-metric-gui-review-20261023-r1-audit-r3.json) **八组全成立、errors=[]、实际exit0**，保护875份明列输入，包含旧失败审计；前轮原证无漂移。没有 import/执行 Main 脚本、产品测试或 assert 来替目视。

首 [seal](p0-context-metric-gui-review-20261023-r1-seal.json) 实际exit1：正文自引用seal文件尚未创建，链接检查报缺文件；875输入及三原网关行没有漂移。保留该失败文件，只修自引用校验，新增最终 [seal-r2](p0-context-metric-gui-review-20261023-r1-seal-r2.json) 重核875输入与三网关原行，绑定 reader/三轮 audit/report/首失败seal，正文链接和空白一并核验，具体第四次syntax及终核退出以真实工具结果为准。自有写入仅本前缀 wx 新文件，不覆盖失败审计或原件。准备时 rg 不存在 exit127、指定 memory 入口不存在 exit1，只是工具定位事实，不计产品红；没有 Git 调用。仓库为权威依据，不用平台记忆替代原合同。

## 6. Exact Remaining 与释放

**本 §2 已封包实际采得的 context / 合法窄集+title / 当前 metric+cleanundo 有限层审结。** 原 RA-P0001 本双输入链、RA-P0006 本两kind/cleanundo/空/reload 链不再派重复动作。

整 RA-P0002 仍有原未采 GUI 断言：非法 evidenceUrl/repoUrl；过长 description/branch 与原 branch 非法值；其他禁止字段 priority/manualProgress/checklist；原非法 dueDate 守卫；AI 提议 wrapped 的人工裁决保护。原 SOURCE/AUTO 按[既有继承](op-growth-final-inheritance-20261022-r1.md#4-p0p3-逐-id-继承)保留，不由本合法样本升级 GUI PASS。title 已闭，不重复；branch 单独合法的既有 schema 结论保留，不恢复旧“branch 必须 repo”错误限制。只补上述旧断言，不扩 AI04/05、全 URL/长度/失败矩阵或新统计字段。

四合法值逐字段控件展示、浅色/其他视口/200%/键盘/读屏/完整样式矩阵、撤销冲突与失败实际 GUI、真实外部模型、宿主重启均 **NOT_SIGNED_THIS_ROLE**；这些是有限签字边界，不在本单自动新开必补门。父全部适用门与其余原派单仍由 Main 非重叠汇合，不据本件宣布已全验或允许 ordinary commit。

**released/STOP。** 本角色没有源码/builder、浏览器、端口/profile、业务/files根锁，无长运行子进程；不等待新派、不接续 Main、不执行 commit/push/tag/release/正式切换。Main继续原有效父单的非重叠余证，本件不扩大父出口。

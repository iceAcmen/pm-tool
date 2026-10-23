# 原 RA-P3004 失败表单保输入范围裁定 R1

> 2026-10-23，平台 trae，独立测试合同范围裁定专家；非开发、非 GUI 执行端。只裁原 RA-P3004 的关联失败保稿边界，不签未采 GUI、全 P3004、当前组合或父 ordinarycommit。

## 1. 裁定

**不豁免原关联失败保稿断言，不改判产品 FAIL；原 BLOCKED 保留。可用既有“空 OKR 选项时的文本 ID 回退”入口，澄清原用例的负例夹具，恢复真实 missing/B 关联拒绝与表单保稿采证。** 尚未采到该失败旅程，本文只确认适用范围与最小步骤，不给它 PASS。

“只有白名单选择”准确描述原已关联 F5、选项非空的表单，**不能外推为整个 HabitForm 的全部能力**。原候选组件已有条件分支：选项非空用 listbox，选项缺失或为空退回文本 ID 输入。B7 props 契约明确记载回退，原 B7 独立 QA 亦明确记录。发现的是既有入口，不是批准新增 raw-ID 功能。

在非空白名单状态，要求将 missing/B 作为新关联值从菜单直接提交，超出该控件的可达能力；此具体操作前提不适用。**不因此把原 RA-P3004 整体或其他可达入口判 N/A。** 空选项回退仍应遵守原同项目存在性校验、拒绝零写和失败保稿要求。

## 2. 父指令与本批权限

负责人原句：

> 父持续全部已实现未验独立收口至ordinarycommit，无新增暂停功能/push/release/正式切。你独立测试合同范围裁定专家，不开发/GUI。唯一写 docs/testing/p3004-original-scope-resolution-20261023-r1* 新文件，允许自有/tmp reader；禁产品/livingdocs/plans/原testing/封件写、运行产品/GUI/build/install/服务/Git/privatefreeze/runtime/凭据。

本报告由本次范围裁定授权产生，仅新建本前缀 report/audit/seal；自有 reader 在 `/tmp`。本角色不运行通用开工的 fetch/pull/install/build/verify，不更新 livingdocs/plans，不执行任何 Git 动作，也不将父普通提交授权下放成本角色权限。STOP 仅结束本角色，不停止 Main 或父持续收口任务。

最新接续原句：“Main已续接，当前新冻结六修完整输入与统一回归中；请继续原P3004范围裁定原子单，不重复派、不新增用例/门/功能。完成后回精确原适用GUI步骤/结论/报告seal；Main会续可达采证。”本文仅完成本原子单；不重新派发 Main 的冻结、回归或已证动作，也不审签新六修。

依据 [AGENTS §6A](../../AGENTS.md#6a-独立测试门控adl-045长期硬规则)、[collaboration §9](../collaboration.md#九独立测试门控adl-0452026-10-12-起长期硬规则) 与 [§11.4/11.5](../collaboration.md#114-测试对象合法种子与不变量)：采证者不得自行改用例；专家可澄清错误入口/夹具并记录替代；SOURCE 不补 GUI，局部结论不扩成全项。本文不作所有者特批，不将 BLOCKED 转 MANUAL_PENDING。

## 3. 原需求与测试授权

| 原依据 | 明确承诺 | 本断言适用关系 |
| --- | --- | --- |
| [P3 开发需求 §2.1 第4/5项、§2.2、§2.5](../design/deep-integration-v2-p3-dev.md#二x7-习惯层可开发契约)，L24–25/34/64–69 | 可选 okrId、同项目存在性校验、只读派生、人定稿、前端命令通道 | 关联拒绝/零写有原需求依据；不要求为每个表单状态新增任意 ID 入口 |
| [原 RA-P3004](remaining-governance-cases-20261021.md#5-p3习惯与周期占位)，L65 | add/update 合法关联、跨项目关联提交；“未关联如实，非法关系保输入/零写” | 保输入是已发布原测试断言，不是本次追加；同时明确涉及未关联状态 |
| [原继承 §4/§5 第6组](op-growth-final-inheritance-20261022-r1.md#5-给-main-的最小合并动作)，L124/138/142 | 第二合法目标、missing/失败保稿、按 OKR 只读集合；无合法入口则具体 BLOCKED | missing 是存在性承诺的原细化；将它安排在已关联 F5 的菜单直接输入，是入口前提过窄，不是新增产品缺陷 |
| [B7 props 契约](../../packages/dsh-pm-tool/src/client/views/growth-form-props.ts#L52-L87)，L52–61/84–87 | 错误/busy 保输入；OKR 选项缺失退回文本 ID，存在性由后端校验 | 为既有回退与草稿保留提供实际组件契约依据，不把代码注释单独升成所有者追加需求 |
| [B7 原独立 QA](b7-growth-panel-qa-20261020.md#逐项结论66-pass)，L15–16/21 | run=false 不 onSaved、输入保留；缺失选项退回文本；GUI NOT_RUN | 佐证当时组件范围与 SOURCE 预期；不继承为真实 GUI 通过 |

早期 [requirements.md](../requirements.md) L5–7 声明其为历史 MVP 基线，当前 OKR/习惯以专项合同与源码共同核对。不能用早期七实体快照否认后续能力；也不能用其他页面的失败恢复要求追加习惯 raw-ID 控件。

## 4. 原候选与 SOURCE 可达性

原候选身份仅按 [source-binding](../../reports/all-pending-evidence-20261021/P2OkrRemainingR1/candidate-source-binding.json) 与 [原114 complete-inputs](../../reports/all-pending-evidence-20261021/CombinedSuccessor114R1/complete-inputs.json) 引用：基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，114 声明变更/521 完整输入。不是本次 Git 核验，不证明当前组合身份。

[本次 audit](p3004-original-scope-resolution-20261023-r1-audit.json) 精确核到当前 habit-form、growth-form-props、form-validation、core/habits、commands/habit 五文件的 bytes/SHA 与原114清单一致；封存 panel 副本与 binding/complete 精确一致。只核指定文件，不声称复核全521或全2372件。

| 真实 SOURCE | 可达判断与限制 |
| --- | --- |
| [HabitForm 组件](../../packages/dsh-pm-tool/src/client/views/habit-form.tsx#L20-L37)，L23–36/65–75 | 草稿由 useState 保存；非空选项为 listbox，否则显示 `gf-habit-okr` 文本输入。文本回退不是菜单搜索框 |
| [listbox](../../packages/dsh-pm-tool/src/client/views/records/records-listbox.tsx#L58-L84)，L58–60/115–135 | 搜索只改 query，choose 只提交真实 option.value；过滤为零匹配不会令 `okrOptions.length` 变零，不触发文本回退 |
| [原冻结 panel](../../reports/all-pending-evidence-20261021/P2OkrRemainingR1/frozen-source/src/client/panel.tsx#L3222-L3285)，L889–894/3246–3284 | 本项目集合经 projectId 过滤后注入；空集合自然到回退。handleSubmit 发真实 add/update，只有成功才 onSaved；不是发命令必先关表单 |
| [原冻结 run](../../reports/all-pending-evidence-20261021/P2OkrRemainingR1/frozen-source/src/client/panel.tsx#L818-L837) | 命令响应经 commandAccepted 判成功；业务拒绝返回 false、错误呈现，不触发成功关层。refresh 不等于重新预填或实测保稿 |
| [当前 panel](../../packages/dsh-pm-tool/src/client/panel.tsx#L3240-L3298)，L830–849/901–906/3240–3298 | 只读观察到同样的过滤、提交、成功关层机制；**整文件 SHA 不同于原114**，不据此签当前组合或继承全 panel |
| [前端校验](../../packages/dsh-pm-tool/src/client/form-validation.ts#L310-L334) | ID 仅检查字母/数字/连字符/下划线；格式合法的不存在 ID 与真实异项目 ID 可以从文本回退提交，其他字段须全部合法 |
| [后端关联守卫](../../packages/dsh-pm-tool/src/core/habits.ts#L152-L162)，L292–320 | missing/B 分别抛存在性/项目归属错误；update 在关联验证后才 put。原失败保稿仍需真实 GUI 与写边界证据，SOURCE 不代验 |

这条跨来源链证明回退属于**原被测候选的已有能力**。没有读取 privatefreeze/runtime，没有把当前新增代码倒推为原候选能力。

## 5. 已证与未证分账

[原独立审证 §4.3](p2-okr-habit-remaining-gui-review-20261023-r1-report.md#43-p3004-合法更换非法命令与原未证边界) L92–100 保持不变；本次核其报告 bytes/SHA 与原 seal 一致，仅引用原专家判定，不重签 GUI。

| 原对象 | 本次范围结论 |
| --- | --- |
| 第二合法同项目目标保存/重开、只读身份集合 | 仅保留原限定 PASS/READ，不重复派动作，不扩成聚合页面或 F7 长历史 |
| missing/B 后端命令拒绝零写 | 保留原限定判定；真实 RPC 分别 `8c2f4488-2d9d-4e91-a56c-6ab7009bfedc` / `6531f516-aaad-43b6-84b3-4568add11a47`。本次只核选定原件与 index，零写沿原连续 root 审证，不重新签全 root |
| 非空 F5 白名单防输入 | 原 GUI 展开菜单呈三项同项目集合、不含 missing/B；SOURCE 证明不是任意 ID 写入口。只保原选项观察与 SOURCE 边界，不另签未采搜索/全键盘矩阵 |
| missing/B 失败表单保稿 | **BLOCKED 保留，非产品 FAIL**。命令发送前 `dialogs=[]`，失败后合法重开不是同一个未关闭草稿 |
| 空选项文本回退的关联失败保稿 | SOURCE 适用，真实 GUI **NOT_RUN**；是原 BLOCKED 的最小补证入口，不自动转 PASS |

指定原件：[菜单](../../reports/all-pending-evidence-20261021/P2OkrRemainingR1/round16-habit-options.json)、[命令前状态](../../reports/all-pending-evidence-20261021/P2OkrRemainingR1/round16-before-command-negative.json)、[missing](../../reports/all-pending-evidence-20261021/P2OkrRemainingR1/round16-habit-missing-rejected-command.json)、[B拒绝](../../reports/all-pending-evidence-20261021/P2OkrRemainingR1/round16-habit-cross-rejected-command.json)、[snapshot](../../reports/all-pending-evidence-20261021/P2OkrRemainingR1/round16-snapshot-aggregation-cycle-command.json)。本次实读该时点仅 A/B 两项目，各有 OKR，没有现成空选项项目；不谎称夹具已经备齐。

在本次限定原证中**没有发现同候选真实关联失败且草稿仍开的证据**；没有遍历全历史封包，不作“历史绝无此证”断言。已有足证应先交原指针，符合下节断言即可审，不为补证重复旧命令成功/失败链。

## 6. 原用例最小澄清

仅替代原继承 §5 第6组“在已关联 F5 的非空菜单直接 missing 提交/保稿”的入口与负例夹具前提，**不替代 missing/B 错误断言、不新增测试 ID、不更改产品需求**。正例、人工 final、集合、F7 全部仍按原已签/未签边界。

1. **先绑定候选与合法夹具。** Main 在获准隔离实例中优先使用已有本项目 OKR 集合为空、合法未关联 habit 的项目 E；保实际 ID 和 snapshot。若无此夹具，可在 Main 既有合法隔离夹具准备权限内，经正常项目/习惯创建通道准备最小 E 与无 okrId 的 habit H；先记录准备写入，再开始负例零写基线。不得删除原 A/B 目标、移动目标、改库、改 props 或伪造缺失 snapshot。本文不实际准备夹具，不扩大 Main 的数据写授权。
2. **打开真实编辑表单。** 在 E 的习惯页点 H 的“编辑”；确认已有 `gf-habit-okr` 文本回退实际出现，且本项目 OKR 确为空。若实际只剩菜单、候选不符或入口未达，记录具体 BLOCKED，回交专家，不改产品凑证。
3. **missing 原负例。** 所有其他字段填合法值，至少留一项不同于已存记录的合法未提交文字作为保稿标识；关联填当轮核实不存在、格式合法的 ID。原 `okr-not-found-20261023` 仅在该实例仍确认不存在时可用。点击真实“保存”，采表单→真实 habit update RPC→`kind=error`/“未找到关联目标”→原表单仍开；该精确关联 ID、title/goal/frequency/notes 均与失败前草稿一致，不能回退成已存记录。记录请求 payload，禁止 title/长度/格式错误先行截断而冒存在性拒绝。
4. **B 原负例。** 同一未关草稿只将关联改为当轮已证存在、projectId≠E 的 B 项目目标，再保存。采真实归属拒绝“关联目标不属于指定项目”、同一表单仍开且精确 B ID 与其他未提交文字保留；不以“没有找到 B”冒跨项目校验。无须重做已有宿主 composer 两命令。
5. **失败写边界与结束。** 每次保存前后回读连续隔离业务根与 H 全字段/字节：两次失败均零写，H 的稳定 ID、projectId、原可选关联、status/checkIns/streak/时间与其他字段不变。原关联拒绝正文真实可见；仅核原关系失败旅程，不扩全反馈矩阵。最后可按既有“取消”关闭，作为正常结束动作，不另立取消/busy验收门；不为本负例强加成功保存/final/重启/F7 新门。

E/H 从未关联状态开始，与原 F5 的“已关联同项目目标”不同，明确标为**仅负例夹具澄清**：依据原 P3004“未关联如实”、P3 `okrId` 可选，以及 update 对 `current.projectId` 的同一校验路径。它可证明非法关联输入在失败草稿中保留、整条记录不半写；**不冒原已关联 F5/非空历史的失败实测**。该正例/历史范围不能由此补证扩大。

这是需求范围内已实现路径的恢复门：真实**关系错误**、原草稿连续保留、零业务写三者同时成立才可交独立专家定向关闭。任意 title 错误只能证明其自身校验/保稿，不关闭 missing/B；菜单搜索无匹配、合法重开、HTTP200、纯函数断言也不关闭本缺口。

## 7. 审计与停止

本次实执行环境：macOS/darwin、现有 bash、Node `v22.23.3`；未调用 pnpm。本角色产品测试 NOT_RUN，GUI NOT_RUN。自有 reader 只用 fs/path/crypto/assert，不 import 产品、不调用旧 reader/采证脚本、不访问网络/服务/profile/凭据/Git。

实际审计命令（macOS，仓库根；语法与最终 seal 结果以 seal 文件为准）：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/p3004-original-scope-resolution-20261023-r1-reader.mjs audit
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check /tmp/p3004-original-scope-resolution-20261023-r1-reader.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/p3004-original-scope-resolution-20261023-r1-reader.mjs seal
```

audit、reader 语法检查实际均 exit0：26 个明确输入指纹、7 个指定原封包文件对 index 相符、5 个实际源码对原114输入相符。数字是文件核对数，不是功能数/产品 PASS。最终 `p3004-original-scope-resolution-20261023-r1-seal.json` 复读指纹、核 report 本地链接与空白并绑定 report/audit/reader，保护仅这些明确输入，不声称整树或全盘零污染。

探索设施：`rg` 不可用 exit127，改用 bounded find/grep/nl；指定 memory 入口不存在 exit1，以仓库为准；`login=false` 工具参数不支持，未执行该命令，后续普通 shell 可用。首次宽 find 仅返回文件名且输出过大，随后限定目录/深度；未打开其额外列出的私有冻结文件或读取被持久化的大输出，不将路径名列出冒内容审证。这些均非产品 FAIL。

**本范围裁定完成，资源释放，STOP。** 原 BLOCKED 未洗绿；后续仅由 Main 按本澄清采原断言、不同执行/判定角色独立审证。本角色不占源码/builder/GUI/端口/业务根锁，不停止其他任务，不提交、不 push/release、不正式切换，不签父 ordinarycommit。

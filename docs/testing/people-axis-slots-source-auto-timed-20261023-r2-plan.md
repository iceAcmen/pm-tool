# 人员轴文字槽与容量最小 SOURCE/AUTO 独立审阅计划

记录本轮有限审阅方法与停止条件，供 Main 正式释放候选后交接；不是产品验收报告。2026-10-23，平台 `trae`，角色：独立人员轴 SOURCE/AUTO 审阅专家，非开发、非 Main GUI。

## 1. 父派单与当前状态

父派单关键原句：

> 独立人员轴最小SOURCE/AUTO审阅专家，非开发/MainGUI。父授权全部既有未验至ordinarycommit；当前唯一两源developer arun_6adacece7cfef4f845ad7640在途，禁止读活源或抢写。
> 此刻先写测试计划，等Main send正式released handoff才实审，不能提前签。
> 只写docs/testing/people-axis-slots-source-auto-timed-20261023-r2*与自有tmp，其他只读；不git/fetch/install/fullbuild/lib/browser/desktop/runtime/profile/正式/产品业务。Main唯一整build/GUI。
> 原FDaxis报告最终封件仍在途不claimreleased，仅可text报告范围参考；原真实GUI红不洗。
> scope只有现CSS可收缩布局/两卡/排期姓名span/点独立姓名数字span及height容量保原14+i15/xPct/flip/MAX/公式/事件/core/schema，保前姓名修。
> 原5case(people-load1/people-scale4)验证派生不变；不写CSS镜像tests、不新GUI矩阵，不基静态metrics签视觉。
> developer释放后Main通知封根，独立核seal/readback真实exit/SHA，别重hash全树8000或复制依赖。
> 若可只审原5case执行记录是admissible非独立AUTO，有限source独立结论仍可，Main新整回归再独立总审。
> 每步真实UTC起止/argvexit完整stdout/stderr/子outer不双计。
> released后目标10分钟报告audit/seal/子actualreadback0/receipt reread/released。
> 完成旧red/未覆盖原GUI保留，不代整P1006/P功能/commit。不要向用户重复问权限。

- 已完成：只读指定合同、开发计划、前序长姓名与轴定位 handoff；本计划先落。
- 当前状态：`PLAN_READY / WAIT_MAIN_RELEASED_HANDOFF`。未读当前两源、未审开发者在途封件、未签 SOURCE/AUTO。
- 后续起点：Main 正式 send released handoff，并明确有限冻结根及文件清单。开发者文档出现完成、封件存在或旧前任 released 均不能代替本起点。
- 父 ordinary commit 仅是父任务终点，不转成本角色 git 权限；本单结束也不代父候选放行。

依据：[Main 修复单](../plans/2026-10-23-people-axis-overflow-repair.md)、[独立合同 §5](people-fd-axis-gui-timed-20261023-r1-minimal-repair-contract.md#5-精确追加允许范围负责人后续明确授权)、[唯一开发计划](../plans/2026-10-23-people-axis-slots-capacity-developer-plan.md)、[长姓名前序](../plans/2026-10-23-people-long-name-developer-handoff.md)、[轴定位前序](../plans/2026-10-23-people-axis-overflow-developer-handoff.md)。使用 writing-plans 的任务拆分方法；本单不采用其实现、worktree、提交或额外审批步骤。

## 2. 所有权与候选识别

唯一写范围：本前缀下 plan/report/audit/seal/readback 等文件，及自有 `/tmp/people-axis-slots-source-auto-timed-20261023-r2/`。其他角色 testing、开发 plan/handoff、旧姓名与 FDaxis 原件均不修改。

正式交接后仅读 Main 指定冻结输入，不读活源，也不自行复制全树或依赖。要求收到：

1. 当前开发者身份、正式 released 通知原句/时间、冻结根、两源 before/after、逐差异和对应大小/SHA。
2. developer plan/handoff、seal、真实 readback 与其完整执行收据；实际子退出码、receipt reread 及 STOP/released 能相互核对。
3. 原 5 case 的冻结测试/必要 import 闭包、执行配置/oracle、argv、cwd、UTC、完整 stdout/stderr、退出码及输入指纹；仅按有价值的需要读取。
4. Main 候选登记中本两源对应关系；基线提交如有只引用 Main 登记，不运行 git，不把 HEAD/version/旧全树件数当认领证据。

前序文档声明的 before 锚（目前仅文档引用，尚未本角色独立实核）：

| 对象 | SHA-256 | 字节 |
| --- | --- | ---: |
| `packages/dsh-pm-tool/src/client/views/people.css` | `8665e0874b0995a77bcd119fbcd892eaeb853593ce4014bce33100d270a995f4` | 14066 |
| `packages/dsh-pm-tool/src/client/views/people.tsx` | `e41ab4ec75a04b47fef95595cfde2bc1e915a319ce81ccba6cc99885259ac6a6` | 26112 |

锚不一致、after 漂移、收据未完成或范围不清时：停止相关审阅并报 Main 最小缺件；不补造候选，不通过读活源自行弥补。

## 3. 最小源码审阅

只对上述两文件冻结的 original before → after 作完整逐差异审阅。开发者差异是待核证据，不是 oracle；自行从原件计算差异（`diff` 返回 1 表示存在差异，保留真实退出码，不改称 0）。每个 hunk 记录文件/行段、原文、改后、对应合同、独立判断。

| 检查项 | 独立检查方法与通过边界 |
| --- | --- |
| S1 范围与前姓名修复 | 两源全部 hunk 逐项审；CSS 仅现 wrapper/两卡/卡头/排期内槽/点文本槽/容量配合。原 `.pp-name` 的 `min-width:0`、局部 overflow/ellipsis、nowrap 与完整 `{row.display}` 来源保留。无他页、全局、断点、字段、fixture 改动。 |
| S2 收缩与滚动边界 | 读冻结前后现布局上下文，确认仍原列比例与既有断点，现两卡和内槽允许收缩。无整页裁切、删列、图卡新增横滚、缩小字号掩盖问题；排期合理内滚仍限内部。这仅证明源码合同边界，不证明实际无溢出。 |
| S3 排期姓名文本 | 必要 span 的原字符串仍完整进入 DOM，原显示顺序、按钮 accessible 名称来源及任务事件不变。局部视觉省略不变成字符串截断。核 title/aria/隐藏元素是否改变名称或制造重复，不把 title 单独当 accessible 名称保证。 |
| S4 点姓名与数字 | 独立 span 保完整原 name 与原数值表达式，DOM/name-value 顺序和可访问来源不丢；数字不被姓名整体 ellipsis/收缩隐藏。核 flip 样式是否反转语义/文字顺序、宽度约束参照是否为原点图。实际 accessible tree、视觉数字可见仍待 Main GUI。 |
| S5 高度容量 | 高度只适配既有 dots 最后一行容量（开发计划为 `Math.max(124,lastTop+24)`，以实际源码核准）。保空/少行下限与最后行容量，原 `14+i*15`、点序、left/xPct、flip 不改。15行末中心224只作源码容量算术核对，不是 GUI 视觉结论。 |
| S6 行为与派生不变 | 对两源原上下文核 formula/MAX/阈值/统计/过滤/来源、xPct/flip、任务打开/返回和事件绑定未变；检查新增呈现表达式无事实截断或副作用。core/schema 不在修改范围；未独立扫描全树，不声称全仓零变更。 |

SOURCE 结论只限实际读到的冻结两源及逐差异。静态几何、CSS 规则、文本来源均不升级成 GUI、完整无障碍或整个人员功能 PASS。

## 4. AUTO 的最小价值与证据层级

优先审新开发原 5 case 执行记录，避免重复低价值运行：

- `people-load.test.ts` 原 1 case：wrapped 不计入 open；完整具体 oracle 以正式冻结原件为准。
- `people-scale.test.ts` 原 4 case：刻度下限、未分配驱动、过滤不缩尺、2倍数+2；按冻结原测试逐例核，不改/新增测试。
- 核 2 文件/5 case 完整输出、真实退出与输入 SHA、原 oracle 未削弱、配置只包含原范围、依赖只读、自有缓存，无漏例或合并名称掩盖。
- 开发执行记录核对一致只记 `ADMISSIBLE_DEVELOPER_AUTO_RECORD`，**不是独立 AUTO PASS**。原前序姓名 5例也不自动覆盖本 after 候选。

仅记录不足且自行执行有实质价值时，在 Main 已释放的有限冻结源上，使用既有只读依赖、自有 HOME/TMPDIR/cache/out，独立编排原 5 case **最多一次**。不运行开发者生成的 runner/review/seal 脚本来代独立验证，不复制依赖，不安装，不全 build、不写 lib。窄 type 同样最多一次且仅在新增 TSX 类型风险无法由差异确定时执行；不可隔离则记未执行，不退回宽检查。

执行前把实际冻结根、既有 Node/Vitest/TypeScript 路径、只读依赖映射和独立配置记录为真实 argv；不预填不存在的路径或退出。本轮允许完全不另跑 AUTO：有限 SOURCE 可单独结论，AUTO 保持记录审证层级，Main 新整回归后另由专家总审。

不写 CSS 镜像测试、不新 GUI 矩阵、不跑 verify 全系列/宽回归；不得把窄 type 或原 5 case 派生绿签成呈现通过。

## 5. 封件真实性与独立日志

正式 released 后从零独立核：有限 seal 条目的真实字节/SHA、before/after 及实际差异、开发 readback 子实际 exit、完整 stdout/stderr、其 receipt 实际 reread 与通知一致。只核本两源与必要收据/配置，不重 hash 全树约8000件、不复制 node_modules；如原 seal 为宽清单，仅核本单有限子集，明确覆盖分母。

每个实际执行步骤记录 UTC start/end、cwd、argv、PID（可取得时）、exit/signal、完整 stdout/stderr、耗时和父子关系。工具前期只提供 wall time 而无绝对起止者如实标不足，不追填。等待 Main、人工审阅/编辑区间和子命令分列；outer 总时间含 child，不累加双计。

若交付边界需加载 vendor `code-review`：先读 external-policy/manifest，对 13 registered 指纹及该静态检查覆盖的文件逐件核，执行只读 static；不扩到未注册项、不 installer/Git/worktree。只用规范/合同两轴，不采用其 setup 或开发验收替代；校验未完成就不加载。规划阶段尚未加载 vendor，不声称已校指纹。

本角色独立 runner 仅作为自有计时/收据工具。最终 seal 绑定本 plan/report/audit、所需有限审阅输入及执行证据；seal 不包含自己或后生成 readback，避免自引用循环。独立子 checker 逐件读回并返回真实退出码，父记录 actualReadbackExit，再实际 reread 收据；回读失败不签 released。不伪造 readback=0，修复自有封件时保留失败历史。

## 6. released 后目标 10 分钟顺序

1. 0–2分钟：记录 Main 正式通知，冻结根/开发封件/readback 两源有限实核；异常即停受影响项。
2. 2–6分钟：两源 before→after 全 hunk 和关键原上下文，完成 S1–S6；仅 source 判断。
3. 6–8分钟：原 5 case 记录可采纳性审查；仅确有必要才一次独立原5例/窄type，不为赶时限隐瞒失败或补宽回归。
4. 8–10分钟：写 report/audit，列实际结论、差异/收据与未覆盖，seal→独立子实际 readback→receipt reread→向 Main 交正式有限报告及 STOP/released。

10分钟是目标而非伪造结果的截止；若缺件/漂移/失败超时，报告真实已完成、实际耗时及停止原因，未验不签。

## 7. 报告与保留项

正式报告分别列：`有限 SOURCE`、`开发 AUTO 记录 admissibility`、`独立 AUTO（仅真实另跑者）`、`GUI NOT_RUN / WAIT_MAIN`、`封件完整性`。当前所有实审项均 `NOT_RUN`，没有 PASS/FAIL 结论。

原独立 FD 合同确证图卡极窄、标题纵排、姓名数字越卡/相叠、外壳二维横滚的真实 GUI 红项仍保留。本轮不核或认领原 FDaxis 最终封件 released；合同文本只作红项/范围参考。FD实际 MAX8 与 F1/FL MAX10缺证不混同。

Main 后续唯一合 build/整回归、沿原 F1/FL 与 FD四宽及原轴动作实采并独立审证；不增矩阵，修后不能借旧原图，受影响旧 GUI 不自动继承。完整原门未齐前，不代整 `RA-P1006` / P功能 / 父 ordinary commit，不 push/release/正式切。

## 8. 计划准备期设施记录

首次工具参数 `login=false` 不受当前执行器支持，返回设施错误，未实际运行所请求 shell；随后去除此参数。`rg` 不存在，实际 exit127，改用有限 find/sed；指定 memory 两入口不存在，ls exit1，不据此推断项目状态。此前只读文档命令工具给了 wall time/exit/stdout，未给每步绝对 UTC，保留这一局限，不回造时间。

实际 UTC 检查点：`2026-10-23T03:10:28Z` 开始有限准备，`2026-10-23T03:11:31Z` 写计划前。自有 timed runner 启用后，计划读回以真实子进程收据为准。准备期无产品源、测试执行、git、依赖写、build、GUI、runtime 或正式配置动作。

## 9. Main 正式释放后的接续记录

前文当前状态为先落计划时的历史记录。Main 后续正式通知：

> 正式source已释放：Main实读docs/plans/2026-10-23-people-axis-slots-capacity-developer-handoff.md和/tmp/people-axis-slots-capacity-developer-20261023/readback.json status0/PID69051；timing-summary还有receiptReread真实可读。114件封同，两源新CSS7fa9e31329595f05fe846999eafc21208ec7ee011e86883e44afd223743c1594/TSXd32a316ab25b958fc1bd93f14b157e8da1f75556f419ea72f72ab708f85c107b。
> 前序FD最终已实读report/readback actualStatus0child68704/STOP，姓名SOURCE有限PASS仅前CSS，axis旧四宽FAIL不洗。

通知后首次真实计时为 `2026-10-23T03:14:46.356Z`；通知接收本身没有工具级绝对时间，不倒推伪造。先前计划原件读回子0、receiptReread=true，随后才开始冻结件实审。

- 已完成：Main handoff/真实收据读回，两源冻结 before/after 独立差异与完整 after 上下文，S1–S6，原 5例 oracle/执行记录、窄type记录审查，有限38件及附加真实收据身份实核，vendor static与注册13指纹后只读 code-review。
- 不另跑：原5例/窄type。当前 delta 无派生变更、原记录已足，重复它们不能证明布局；只给 admissible 开发记录，不冒称独立AUTO。
- 结论与封件：见同前缀 report/audit；本角色 STOP/released 必须仍以实际 readback子0及receipt reread为准，不由本记录预填。
- Main 前序FD最终释放仅为后续通知事实，本角色未另核其最终封件；旧四宽FAIL仍保留。

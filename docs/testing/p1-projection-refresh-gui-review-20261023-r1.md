# P1004 旧投影刷新独立 GUI 审证 r1

> 2026-10-23，平台 `trae`；角色：独立测试专家，非 Main、非开发、非 GUI 执行者。只审 `P1ProjectionRefreshR1` 379 件原证及必要的原合同/部署继承元数据。唯一新增写面为本报告同前缀文件。

## 1. 有限裁决

**RA-P1004：数据刷新部分 PASS；首次打开目标后的层可达/直接退出 FAIL，完整 GUI/样式/UX 不通过。** 已确证副驾覆盖 TaskForm 的呈现缺陷，不是产品缺证或必须本人配合的 `MANUAL_PENDING`。最小化副驾、露出字段、顶部关闭、重新展开回原卡是成功恢复，不是首次无遮挡通过。

| 分层 | 本轮裁决 | 精确边界 |
| --- | --- | --- |
| 原件完整性/身份 | PASS（证据层） | 379 件 bytes/SHA 全匹配；部署/候选只继承原封存记录，不探活 |
| 功能/集成数据链 | 有限 PASS | t6 未指派/0 → 人主 save → 最新快照/负责人/47；旧答不改、无再次 ask |
| GUI 投影呈现 | 有限 PASS | 旧答与最新值并列，数据截至更新、更新旁注清楚；同会话回原卡成功 |
| GUI 目标身份 | 有限 PASS | 正确 t6 编辑表单，标题/负责人/47 与 DB 对齐；打开时 DOM focus 为 title |
| 首次层可达/退出、样式、UX | FAIL | title 焦点在被副驾覆盖的目标中；首次打开/取消后双层仍存，须另行最小化恢复 |
| 原 B8 完整键盘/焦点归还 | 未签，仍需原证 | 没有 Tab/Enter/ESC 全链；末态 focus 是 BODY，不能宣称归还 opener 或键盘通过 |
| 产品/AUTO/GUI 执行 | NOT_RUN（本角色） | 本轮只读核证与 `view_image` 目视，未运行产品、采证器或 GUI |

本件只给上述子段签字，**不签全 P1、全 B8、全部已实现未验、ordinary commit 或发布**。Main 不能把自身观察、自有 assert 或本件的部分 PASS 合成总 PASS。原 B8 其他 ID 和原状态不改，不增新 ID。

## 2. 授权、合同与冻结对象

本次派单原句：

> pm-tool父授权独立分工补全部已实现未验至ordinary commit（无push/release）。你为独立测试专家非Main/非开发/非GUI执行者。只读审P1ProjectionRefreshR1379原件；不跑产品/GUI/build/install/service/Git/凭据，不改代码/livingdocs/原件/其他testing。唯一写面docs/testing/p1-projection-refresh-gui-review-20261023-r1*新文件。

先读 [AGENTS](../../AGENTS.md)、[协作 §9/§11](../collaboration.md)、[派审 §3](../plans/2026-10-23-p0-p1-sealed-review-dispatch.md#3-p1新封包379原件)、[治理原单 RA-P1004](remaining-governance-cases-20261021.md#3-p1呈现与保护面)、[继承 §5](op-growth-final-inheritance-20261022-r1.md#5-给-main-的最小合并动作)及原 B8 [扩展清单](gui-b8-expanded-checklist-20261020.md)、[批次合同](b1-b8-coverage-mapping-20261020.md)、[层合同](remaining-layer-map-20261021.md)。派审只裁 §3，未审 §2 P0 封包。通用 fetch/pull、install/build、livingdocs/Git 收尾在此明确只读分工内不执行。

| 绑定项 | 原件认领/本轮核验 |
| --- | --- |
| 基线 | `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`；来自封存声明，未执行 Git，不以 HEAD 代表 dirty 候选 |
| 候选 | `CombinedSuccessor114R1`，version `0.7.4`，114 source / 521 complete-input 声明；`source-binding-close.source` 与原 source map 完全相等 |
| 冻结目录 | `/private/tmp/pmtool-combined-successor114-20261022-r1`，仅当作元数据字符串；未访问/探活 private 目录 |
| 宿主 | 沿 `Successor114GuiR1/host-start.json`：3264 / PID10975，包指向上述冻结包，DSH_PM_E2E=0；candidate/source/client.js 声明 SHA 与原 sealed 文件匹配 |
| gateway | 沿原 `gateway-binding.json`：3261 / PID60386，`realExternalModel=false`；不探活，不重调模型/改 fixture |
| GUI 同上下文 | 原 DOM 十态均 `http://127.0.0.1:3264`、timeOrigin `1792701362376`、深色、inner `1440×718`，outer `1440×857`、DPR2 |
| 用例/实体 | 原 `RA-P1004` / K13；F6 当前既有 `p-0001/t-0006`，WBS5，标题 `P0真实采集限流跟进20261023` |

本轮只核封存候选、完整输入清单与部署记录的内容和指纹；**没有重核 521 份 private 运行文件、当前源码、模块装载或服务健康**。DPR2/pageScaleFactor1 不是原生 200% 证明；1440×718 不能填成 B8 的1440×900整格。

## 3. 自有 reader 与数据原证

[独立 reader](p1-projection-refresh-gui-review-20261023-r1-reader.mjs)只用 Node 内置 fs/path/crypto/assert，未 import 产品或执行 Main 脚本。Main 原 `execution-scripts` 仅被读取/哈希，未运行其 assert。

[audit](p1-projection-refresh-gui-review-20261023-r1-audit.json)记录全部 398 个明确输入的 bytes/SHA：379 件原证、原 index、9 份合同文档、9 份部署/候选元数据及其索引。原索引 SHA 为 `a54921eab0e930448a3db6d2d046bfefd1ef20f7b7fd9dfe0d1b970fd05deca1`，62889 B；379件总计10596943 B、零不符。

| 原动作 | RPC/时点（UTC 2026-10-22；页面为次日 +08 时间） | 对照结果 |
| --- | --- | --- |
| 旧 ask | `48a7bf18-c55d-4572-8e80-a71e2226dce4`，20:38:46.017 请求 / .048 返回 | `/pm ask p-0001` 真实命令；gateway sequence19、`/v1/messages`、.035，context 含真实 t6，确定性 fixture 文本与旧答完全相等 |
| 主表单修改未保存 | `normal-edited-before-save` | assignee 为 `P1004刷新负责人`，输入 progress 为 `047`；DB 仍未指派/0，未保存零写 |
| 人主 save | `58fec4f8-531b-4cd1-bd70-02f925f4e782`，20:39:08.527 / .567 | `/pm task update t-0006`；明确 success，负责人/进度摘要可见；真实归一 progress47 |
| save 后自动 snapshot | `b48539b7-f600-4af9-b6cc-9f80362e3029` | `/pm web snapshot`，不是又一次主 save 或模型请求 |
| 副驾手点刷新 | `b433d443-14e2-403d-9279-fef9b55b2e09`，20:39:08.861 / .869 | `/pm web snapshot`；返回 t6 record 与最新原始 DB 完全相等，不以 HTTP200 代 GUI |
| 刷新后的旁注/旧答 | DOM 20:39:08.886 | `04:38:45` → `04:39:08`；负责人/47% 与“回答后该任务又有更新，已按最新状态显示”并列，旧答仍未指派/0 |
| 返回同会话旧卡 | DOM 20:40:01.964 | dialogs=[]，原答逐字保留、投影仍最新；只证明当前会话返回，不证明 reload/新进程旧历史 |

四份事件中合计 7 条请求，全部 response 按 rpcId 配对；ask1、task.update1、web snapshot2、ask-provenance2、model status1。刷新/打开/恢复/返回未见新 ask；gateway 原请求仅该一次封存记录，**不宣称全局模型请求总量、真实外部模型质量或网络认证通过**。

展开旧答后的20:39:08.653态已经显示最新负责人/47%及04:39:08（保存后的自动snapshot已触发）。手动刷新证明现有按钮确实再次读取snapshot，不证明“点刷新前投影仍旧值”或“手点使字段第二次跳变”；不混淆自动刷新与手动刷新。

DB 核验为十态 × 26份原始 `data/pmtool` 文件 =260份，逐一核 bytes/SHA；存储为 `{version:2, record:...}`。初态/编辑未保存两态与初态全同；保存后只 `data/pmtool/tasks/t-0006.json` 改变；随后六态 DB 字节全同。

**精确字段变化**：assignee 空→`P1004刷新负责人`、progress0→47、updatedAt→`2026-10-22T20:39:08.538Z`，另 `manualProgress` 从缺省→null（原主表单 payload 明确带null）。不把“只一个任务文件变”说成“只有两个字段变”；标题、状态、项目、稳定ID等未变。本件不扩展到 OP manualProgress 业务门。

每态 roots 有32路径，另6份 files/backups 只保指纹声明不变，未交对应 raw 字节；**零额外 DB 写有原字节支持，6份附件/备份仅声明级保护，不声称全盘零污染**。

## 4. 独立目视与失败/恢复分界

以下9张 PNG、6张帧全部经 `view_image` 独立观看，不凭 Main 口述或 DOM/assert 替目视。70帧全部核 SHA，只目视下列6帧，不声称看完70帧或完整录像。

| 原图/帧 | 独立观察 |
| --- | --- |
| [旧投影](../../reports/all-pending-evidence-20261021/P1ProjectionRefreshR1/old-projection-visible.png) | 旧答与任务卡都未指派/0%，数据截至04:38:45，无更新旁注 |
| [未保存编辑](../../reports/all-pending-evidence-20261021/P1ProjectionRefreshR1/normal-edited-before-save.png) | 副驾已最小化，主 TaskForm 的新负责人和 `047` 输入可见，不冒落盘成功 |
| [人保存后旧答](../../reports/all-pending-evidence-20261021/P1ProjectionRefreshR1/old-answer-after-human-update.png)、[刷新](../../reports/all-pending-evidence-20261021/P1ProjectionRefreshR1/projection-refreshed.png) | 旧答不变，新负责人/47%及更新旁注清晰可读，保存 toast 在背景；不冒模型重新解释 |
| [首次打开](../../reports/all-pending-evidence-20261021/P1ProjectionRefreshR1/projection-target-open.png)、[save-refresh-29帧](../../reports/all-pending-evidence-20261021/P1ProjectionRefreshR1/frames/normal-save-refresh-29.jpg) | 右侧任务抽屉已开，副驾叠在其上；标题/负责人/47被压在下面，仅露左窄条。DOM focus title 不能证明可见焦点/可交互 |
| [target-fields-visible](../../reports/all-pending-evidence-20261021/P1ProjectionRefreshR1/target-fields-visible.png)、[target-return-0](../../reports/all-pending-evidence-20261021/P1ProjectionRefreshR1/frames/target-return-0.jpg) | 文件名“visible”不等实际无遮挡；20:39:23 的图/帧仍是副驾遮 TaskForm |
| [取消后保留图](../../reports/all-pending-evidence-20261021/P1ProjectionRefreshR1/cancel-target-current.png)、[target-return-2](../../reports/all-pending-evidence-20261021/P1ProjectionRefreshR1/frames/target-return-2.jpg) | TaskForm 滚至资料/日志段，副驾仍前置；取消后保存态仍有编辑任务 dialog。不能洗成直接取消成功 |
| [target-visible-return-1](../../reports/all-pending-evidence-20261021/P1ProjectionRefreshR1/frames/target-visible-return-1.jpg) | 最小化后底部取消/保存控件才完整露出，是恢复后的状态，不是此前取消有效 |
| [最小化后字段](../../reports/all-pending-evidence-20261021/P1ProjectionRefreshR1/target-uncovered-fields.png)、[target-visible-return-2](../../reports/all-pending-evidence-20261021/P1ProjectionRefreshR1/frames/target-visible-return-2.jpg) | 正确同t6标题、负责人、47字段可见，右缘有最小化副驾入口，顶部关闭可见 |
| [回旧卡](../../reports/all-pending-evidence-20261021/P1ProjectionRefreshR1/return-old-answer-card.png)、[target-visible-return-6](../../reports/all-pending-evidence-20261021/P1ProjectionRefreshR1/frames/target-visible-return-6.jpg) | TaskForm 已关，副驾再次展开，旧答/最新卡/更新旁注保留；恢复路径有限 PASS |

**timeout 分层**：[executor-observations](../../reports/all-pending-evidence-20261021/P1ProjectionRefreshR1/executor-observations.json)与原 raw-report 明确记载首次cancel pointer未关闭、等待timeout。四份 events 是 RPC+frame，不含该 click 的原异常栈、精确坐标或完整等待记录；图/帧独立确证双层持续和未关闭，不据两张图间隔推算timeout时长，不据观察文字断言浏览器命中栈根因。**遮层缺陷有独立视觉原证，不需要把未交异常栈补造为证据。**

## 5. 确证缺陷与原 B8 接缝

**缺陷定位：RA-P1004 / 副驾“打开任务”→TaskForm 的层转换，优先级中（存在可恢复路径，但阻塞该原 GUI/UX 门，不默认豁免）。**

- Expected：刷新卡打开正确任务后，其当前字段/焦点可见且主退出入口可操作；用户直接取消/关闭能返回原答与最新投影，不须先发现另一浮层最小化。不要求新按钮、新页面或重写模型结果。
- Observed：首次打开正确t6，副驾保留在TaskForm之上，挡住被focus的title、主要字段与下部操作区；原cancel未关闭，图/帧仍保两层。须另点最小化，才能看到负责人/47，使用现有顶关闭再展开回原卡。
- 依据：治理原 RA-P1004 的“正确task入口/focus/结果变化”；原 layer-map §1 的“popup层不被裁切/挡主入口”、原 B8 TaskForm/取消与焦点旅程。不是追溯启用 AGENTS §6A.1 待表决设计提议，也不强行要求浮层从不共存。
- 原始打开 dialog 的 bbox 正处进场动画（x897.27/right1457.27），后态稳定x880/right1440；本件不拿瞬时动画越界另开水平溢出FAIL。

接缝范围只映 **RA-MENU-30 只读投影退出、RA-DR-34 TaskForm深态、两层共存的 P1004 当前链**，提供局部失败/恢复证据。不是这两个 B8 整条的新总FAIL或PASS；浅色、390、长内容、键盘、默认/pilot及其他表单依原未签格继续。原 B8 映射中的1184页面格、42抽屉、39菜单、16卡与3专项不改状态/分母；本图高718不签900整格，不能把既有U4/HC01等独立签字全废或全继承。

## 6. Exact Remaining / 最小修复复验合同

以下是同原 ID 的缺陷闭环，不新增功能或原ID。Main继续其他原采证；本件不开发、不冻结其余在途成果、不结束父任务。

1. **RA-P1004 首次打开/直接退出仍FAIL。** 开发先为该入口转换留下能复现当前遮层的失败回归（红），再只修副驾→TaskForm 层/焦点交接。可保留副驾状态并在进入TaskForm时让出交互面；不销毁旧答、不清历史、不靠重模型/改业务数据掩盖问题。具体实现由开发决定；本专家未读活源码或自改产品。
2. **同链 GUI 复验。** 在新认领候选，按原旧ask未指派/0→人TaskForm负责人/47主save→展开副驾→点现有刷新→同t6“打开任务”→直接现有取消/顶关闭→回旧卡。保首次打开、实际pointer/目标bbox/操作前后、失败或成功的原图帧/RPC/DB；不先最小化后再冒首次成功。复验需证明直接退出有效、可见目标焦点、旧答不变和最新投影保留。
3. **原 B8 键盘/焦点仍未签。** 仅该接缝补既有 Tab/Enter/ESC与退出归焦原步骤，不要求另外新建全球矩阵。当前末态BODY不是opener归焦PASS；缺链不移成MANUAL_PENDING，也不凭DOM focus title签无遮挡。
4. **保护回归与继承。** 对同TaskForm主save/未提交取消、副驾最小化保上下文/展开原卡、刷新只读/单模型请求/只t6主写做受影响范围回归；修复后绑定新source diff/清单/产物/实例。旧数据原证可由专家按无数据行为变化限定继承，旧失败留存，不把114的GUI当新修已激活。若实际改全局样式/共享portal，由Main列真实受影响原DR/MENU，交独立专家裁继承，不自行扩大重测或全量洗绿。

候选source map可供开发定位 `client/panel.tsx`、`client/shared/drawers/sidecar-portal.tsx`及相应入口/样式；这是封存路径级接缝提示，不是已证根因或要求都修改。不改上游/全局z-index体系，不新增模型/数据写策略。本件开给开发与GUI执行者，**Main不得自签修复后PASS；须独立专家审新原证**。ordinary commit总出口仍待原各域门，本FAIL不因父commit授权自动豁免。

其余 RA-P1001/2/3/5/6、P0/P2/P3、B8其他原条目均非本件审结对象，准确剩余沿原治理/继承§5和原B8映射；不把本件局部结论抵销其余未采项，不重采已有获签链。

## 7. 运行记录、输入保护与 released/STOP

运行环境 macOS/bash；自有reader实际 Node `v22.23.3`，pnpm11.28.5仅项目约定，未调用。仓库根执行以下自有核证命令，各条独立运行：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/p1-projection-refresh-gui-review-20261023-r1-reader.mjs audit
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/p1-projection-refresh-gui-review-20261023-r1-reader.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/p1-projection-refresh-gui-review-20261023-r1-reader.mjs seal
```

audit同命令首次exit1：原继承index为`{files:...}`，reader初稿错误按裸路径索引；第二次exit1：原DB为`version/record`信封，reader初稿误按裸record。两次均未生成audit，不是产品FAIL；仅修自有reader，第三次exit0，379/260/7/1ask/1save/70frames如上，发现并保留manualProgress缺省→null。`--check`、seal结果以[seal记录](p1-projection-refresh-gui-review-20261023-r1-seal.json)为准；seal再次逐件回核398输入与首个audit相等，并核报告本地链接/行尾空白。

探索命令仅cat/sed/grep/ls/find/Node内置解析/哈希；`rg`不可用exit127后改grep/find，记忆指定入口不存在，没有用私有记忆裁决。未运行Main脚本、产品verify/Vitest/e2e、build/install、浏览器/桌面自动化、模型/凭据/配置、服务/PID操作或任何Git命令。`view_image`只读本地原图，不是GUI执行。

输入保护只覆盖audit列明398文件，前后SHA/size零漂移；未改379原件/其索引、其他testing、livingdocs、源码、vendor、业务库或private运行根。唯一新增为本前缀报告/reader/audit/seal，不删除、清理或覆盖他人成果；并行新采证不纳本冻结、不据此判失败。

**released / STOP：本子任务审结并释放自有写面；不持有源码、builder、GUI、端口/profile或业务根锁。原3264/3261实例保持原样。Main继续父单其他原采证；本件不提交、不推送、不tag/release、不冒总任务完成。**

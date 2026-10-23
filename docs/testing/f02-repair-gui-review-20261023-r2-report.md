# 原 F02 修后最小 GUI 合同独立审证 R2

2026-10-23，平台 trae，独立原 F02 GUI 审证专家。非开发、非 GUI/产品测试执行端；Main 唯一 builder/GUI/桌面执行端。

## 1. 有限裁决

**原 F02 §6 最小复验 slice：PASS_LIMITED_GUI。** 修后同候选的默认外 label、真实 option 内 span 指针选择稳定闭合且选择零写；闭合后唯一首点 Main 指针保存完整成功、关层及正常重开；一次同字节原键盘选择/Enter 主保存对照成功，正常取消后 `dialogs=[]`。原 R1 round17/19 红证、R2 诊断及本轮设施失败全部保留，不改写历史。

**SOURCE/AUTO 分开：** 精确继承 [独立组合 R2](f02-combined-regression-review-20261023-r2-report.md) 的 `PASS_LIMITED_COMBINED_SOURCE` / `PASS_LIMITED_COMBINED_REGRESSION_EVIDENCE`。本角色不执行或重签产品回归，不以 JSDOM、Main assert、summary 或封工具 exit0 签 GUI；本次 GUI 结论来自原帧/PNG 目视、实际命中、原生事件、RPC/raw/roots 的联合审证。

**不签** P1004、其他六修、F01、P3004、全 P1005、完整 B8、父 ordinarycommit、push/release/正式切换。只关闭 [原 R1 §6](six-repairs-pointer-gui-review-20261023-r1-report.md#6-原默认-label-场景最小红--修--复验合同) 的精确 remaining，不新增 consumer/viewport 矩阵，不重做两 L2 final 或关系保存，不要求暂停父持续原授权。

## 2. 授权与方法

本子单原句的核心限制：

> 限定原six-repairs-pointer-gui-review-20261023-r1-report.md §6最小复验合同，只审Main新reports/all-pending-evidence-20261021/F02RepairGuiR2/index-r1.json对应1457件与其seal-r1.json/真实seal-outer-receipt.json，不跑Main或产品脚本。
>
> 唯一仓库新写docs/testing/f02-repair-gui-review-20261023-r2*；自有/tmp只纯fs/path/crypto/assert reader及真实outer receipts。其他全只读。
>
> 不读活runtime/凭据/正式配置，不探端口/浏览器，不build/install/verify/git/fetch，不改livingdocs/产品/旧报告/原证，不spawn。

已读 [AGENTS](../../AGENTS.md)、[collaboration §9/§11](../collaboration.md)、原 R1 §6、[原生 trace R2 更正](f02-option-native-trace-review-20261023-r2-report.md)、组合 R2 及 [真实 seal-tool receipt](f02-combined-regression-review-20261023-r2-seal-tool-receipt.json)、新 GUI summary。明确子单替代通用 fetch/build/全回归/livingdocs/Git 收尾 SOP。

前轮 **round26 有一对只读 snapshot RPC**，不是零 RPC；没有业务写。这一更正沿用原 trace R2，不能被旧 summary 覆盖。诊断“关闭后额外 trigger 激活”保留其已签强支持而非排他根因边界。

自有 reader 仅使用 Node 内置 fs/path/crypto/assert，读封存包并核指纹、结构与链接；不 import/eval 原脚本、配置、产品或测试，不 spawn。四份冻结源码、采证 helper/harness/outer 仅作文本审查；未读取其外部 helper、live/private runtime 或 profile 实体。包内配置仅纳入指纹，不解析凭据。

## 3. 封件与精确装载

证据根：`reports/all-pending-evidence-20261021/F02RepairGuiR2/`。完整逐件结果见 [最终独立 audit](f02-repair-gui-review-20261023-r2-audit-r2.json)；首 reader 失败原件见 [首 audit](f02-repair-gui-review-20261023-r2-audit.json)。

| 对象 | 独立核到的结果 |
| --- | --- |
| index-r1 | **1457/1457 普通文件**，逐 size/SHA 全同；物理集合恰为索引成员加 index/seal/outer，共 **1460**，无软链/缺件/额外 |
| index SHA256 | `dd6a6874f648c216e51a3c85018cd647388d5cbb721daa8044b415ed50b25fb3` |
| seal-r1 / 真实 outer | 1457、index SHA 相同；实际 outer **status0 / signal=null / stderr空**，stdout 载明1457/index及仅dlv1变；不引用预计成功码 |
| 候选 | `CombinedF02RepairR2`，baseline `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，version `0.7.4`，source **124** / complete **525** |
| 组合原证绑定 | combined index SHA `b7d00adf033966ba94b69eab250b9781d89de532c32e243ff40793159c28f275`，独立报告/封存/真实工具收据指纹与 summary 声明一致 |
| 新宿主 | **3269 / PID22463**；host-start/ready/activation 相同；实际封存 cwd、argv、监听输出及 profileLink 同候选包，`DSH_PM_E2E=0`、pilot 默认 OFF |
| 原浏览器合并响应 | `browser-script-2.js` **2599193 B** / SHA `b3366523782e3caf167ea5173b0a2a79765a01f8b8b68a922cd2b1f074164312` |
| 独立提取 | offset **875361**，片段 **1720359 B**，全合并响应中唯一匹配；SHA `682647fb67cafca6e97e8d80bce0bae983b46da135873ebe316c86e758a44058` |
| 复原 built | 精确 ASCII `//# sourceMappingURL=client.js.map` **34 B、无 newline**；**1720393 B** / SHA `3be9d4a0bbc595bb0038e50787d33d38d47120237f7ab93fba40d1dc624f8159`，同 built/host/activation |
| 浏览器上下文 | 新3269 origin，timeOrigin `1792712721380.9`；原1440×718、DPR2、深色，帧pageScaleFactor1；不把图片工具缩放当新视口或200% |
| 帧索引 | **298/298** 原帧内嵌 SHA 同物理文件且成员全同；backup17、restore132、precheck6、precheck2 42、apply9、prepare27、pointer28、keyboard37 |

四份冻结源码逐 size/SHA 同525声明；listbox **5059 B / `aeb3d15125ad311f335cfb09d348c0402b9925da9d4979df8b2ceb402725275f`**，DOMtest **10641 B / `841e3fa0591c7a83213572650a73d7c63cf277e50e1ecf56197e8c0e58cc6057`**。仅 listbox/test 两项 delta 的完整物理核验继承独立组合报告；本角色不冒称又读完 private freeze 的525输入及依赖。candidate早期 `runtimeLoaded=false` 不否认后续实际装载，也不以HEAD/version代dirty候选。

Main原15组命令的 start-marker 保留 **真实 argv/cwd/parentPid**，outer记录真实起止/status/stdout/stderr。源码解释 receipt.argv 缺失：`spawnSync` 结果没有 `spawnargs`，JSON省略undefined；不是伪造补argv。**childPid未捕获，不补造**；parentPid不能当childPid。PID/端口只是封存时点事实，不声称审证时服务仍健康。

## 4. Fixture、恢复与设施失败

旧3268正常 `/pm backup` 一次，RPC `3081c124-8c0e-4031-a2ed-282bcac82d48`，outer0。旧roots44→48：恰新增正常备份JSON和实际 `.files.0f14dfc55e09f346` 侧车3件，原44项全同，不说整个旧root零变。JSON **33939 B / `54acc65746e6a2a27442d899d37b88e176be50a6a2c78738d2f0d2077af2a4b1`**，transfer绑定JSON及两md/manifest指纹；不误找固定`.files`路径。

新宿主预检一次、标准双确认实际恢复一次，RPC `5d7356b0-daf0-44fa-90fa-c8c79b7f1666` 完整成功；之后只读校正，不重放backup/restore。七类普通表按record.id、额外六表按 `[storageKey,record]`，**13表38记录逐结构全同备份**。`reconcile2` outer0，实际首项目 **QA-A-fixture-F5**。会话不在备份，本单不承诺会话迁移。

| 原动作 | 真实结果和归因边界 |
| --- | --- |
| restore入口 | **outer1**：`networkidle0` 导航20000ms超时；原末PNG已见宿主/首次说明页，尚无restore RPC。保留设施失败，不称产品恢复失败 |
| first precheck | **outer1**：首次 `.pm-shell` 8000ms等待超时；原PNG仍宿主页。后续实际项目管理坐标命中并正常进入，不永久停点、不改产品洗绿 |
| apply | **outer1**：标准恢复成功后误等旧 `QA-G A` 6000ms；原成功RPC/末PNG实际项目/38记录相符，不称restore未完成或outer0 |
| first reconcile | **outer1**：把extra tuple当裸record，`rawById[row.id]`断言错；仅reader断言边界，非记录丢失 |
| reconcile2 | **outer0**：纠正tuple读取，逐结构38记录一致；没有追加恢复写 |

恢复确认原PNG呈现的样式不作本单恢复UI样式签字；这些材料只证明合法fixture来源和失败归因，不把外围界面质量扩入F02，也不因修正一次设施断言追加历史门。

原对象固定 `p-0001 / dlv-0001 / QA交付物V1 / v1 / m-0001`。恢复初态accepted，**正常 Main表单 fixture准备单列**：accepted→planned一次，RPC `0d521bfe-6fff-4e8c-bc05-2b1dcd72b3b6`；完整成功/关层、raw planned，history2→3。不是旧round17未保存稿，不手seed，不计作本轮accepted首点保存。准备选择本身零写，主保存唯一。

## 5. 原指针闭合与唯一首点保存

**PASS_LIMITED_GUI_SELECTION / PASS_LIMITED_GUI_FIRST_SAVE。**

实际生产form仍用外 `LABEL.pm-field`。指针打开 `button[aria-label="交付物状态"]`，accepted实际目标为option内 **SPAN**，bbox `1183 / 399.125 / 207 / 20.296875`，中心 `(1286.5,409.2734375)`，`elementFromPoint`命中SPAN且属于原目标；helper用 `page.mouse.click` 坐标，不用HTMLElement.click/dispatchEvent/programmatic save。

原被动native trace有8条phase观测，可按相邻capture/bubble归为打开、选项、主save、重开四组，**不是八次输入**：

| console 时间戳ms | target / phase | trusted/detail/defaultPrevented | 状态 |
| --- | --- | --- | --- |
| 1792713143512.030 | accepted option SPAN / capture | true / 1 / false | planned；expanded=true，popup/backdrop在 |
| 1792713143518.604 | 同SPAN / bubble | true / 1 / true | accepted；expanded=false，popup/backdrop无 |
| 1792713144902.555 | 实际保存BUTTON / capture | true / 1 / false | accepted；expanded=false，无遮罩 |
| 1792713144906.018 | 同保存BUTTON / bubble | true / 1 / false | accepted；仍闭合 |

option path为 `SPAN→BUTTON[role=option]→DIV[role=listbox]→DIV.rb-lb→LABEL.pm-field→…→FORM`。之后直到主save/重开，**没有额外 `BUTTON#deliverable-status` click**；不是把本轮trace换成JSDOM。冻结SOURCE的option局部preventDefault与实际事件一致；与旧诊断的detail0 trigger重开链构成修前/修后支持，但不扩大为所有浏览器/消费者的排他因果确证。

closure原件 **63个采样、1013.700ms**（含初始点；过程更新曾写62，精确总数以原件为63），逐sample均accepted、expanded=false、无popup/backdrop；immediate/stable PNG与前中后frames一致。planned初态raw/roots与选中后逐结构全同，**选择零RPC、零业务写**；随后保存才有请求。

保存中心 `(1363.4375,658.1328125)`，实际 `BUTTON.pm-button.pm-button-primary / 保存更改`，`hitIsTarget=true`、无popup/backdrop。只有一次Main指针save，无第二次补点、keyboard绕路或强制submit：

- RPC **`39061c8f-8c75-47b9-9581-e09481f3bc38`**：request `23:52:24.914Z`，response `23:52:24.946Z`，同rpcId，`result.ok=true / kind=success`；payload为dlv1/accepted，原独立response同events。
- raw **1125 B / `1d7f498d00ca010eb81bcfe51fdc63690ff5068d51b63cb28e71292cd9de4133`**，accepted，updatedAt `23:52:24.923Z`，history3→4；名称/版本/项目/里程碑/合法备注及原历史保持，仅追加planned→accepted留痕。
- 显式关层原PNG及状态dialogs=[]，列表已验收1；正常指针重开原记录，status仍accepted。原response后另有3对只读snapshot，与保存RPC分列，不能说全轮只有1个RPC。

观察器仅document capture/bubble `passive:true`，读event/path/focus/expanded并console，不取消默认动作、不写DOM/props/store；cleanup两监听移除。reader未执行harness或未封存外部connect helper，不能据此担保所有外部helper内容。

## 6. 原键盘对照与保全

**PASS_LIMITED_GUI_KEYBOARD_CONTROL。** 同3269/timeOrigin/实际装载，原一次对照沿pointer正常重开稿：native Tab到trigger，Enter打开、ArrowUp/Down、Enter选accepted；选择前后roots全同，零选择RPC/写。20条focus记录为采样，不冒20次Tab；有trigger和最后Main保存BUTTON。

native Tab到Main保存、Enter主save一次，trace保存BUTTON capture/bubble `isTrusted=true / detail=0`，RPC **`a8d97ba8-51ee-4437-8feb-81e960fc4096`** 请求 `23:52:49.992Z` /成功响应 `23:52:50.029Z`，同rpcId；raw accepted。旧history4条全保，未新增状态历史，仅updatedAt变到 `23:52:50.013Z`。关层→正常指针重开accepted→正常取消，末 `dialogs=[]`。正常重开/退出仍有指针动作，不把整个keyboard轮称全旅程纯键盘，也不拿该保存替代指针首点。

全包 **25段raw × 38 = 950/950** 字节对应各roots；完整恢复后每段44roots，最终 **仅 `data/pmtool/deliverables/dlv-0001.json` 变**。恢复后→final的37条非目标raw逐字同，覆盖tasks、旧反思、两L2原final、资料/附件元数据等；只保全字节，不重签其业务门。t1仍3414 B / `e9be08cfba6ad98a796ddd12da0a1bf68b5b68cb7634941ffdc132744059f938`，旧反思仍979 B / `710d08dba2d29c586e554a3b4df671b8881b5bb5d329da17b47531dd3a4bb332`。

其余6项为2份files、backup JSON及实际侧车3件，指纹前后全同。**本包没有复制这些private原资产字节，本角色只核封存指纹/标准restore/记录关系，不冒物理逐字读原资产或全机/正式服务零污染。** 最终dlv1 **1125 B / `1f549e70554d1673638b37d0e9f5c208b69737a9c53c3b9e9c2783ea475144a6`**。

## 7. 独立目视与真实自有收据

本专家实际 `view_image` **28件原图：20 PNG + 8原frames**，不操作GUI：

- pointer六PNG：planned-edit、accepted-menu、accepted-immediate-selection、accepted-stable-selection、accepted-closed-after-save、accepted-reopened。
- keyboard七PNG：status-native-focus、menu、accepted-selected、main-save-native-focus、closed-after-save、accepted-reopened、final-normal-exit。
- prepare两PNG：original-accepted-edit、planned-closed-after-save。
- 设施五PNG：restore-error-state、precheck-error-state、apply-explicit-confirm、apply-error-state、reconcile2-restored-current-f5。
- frames：r2pointer-5/11/12/19/27.jpg；r2keyboard-5/16/36.jpg。

目视确认菜单/字段、稳定闭合、首save按钮可见、保存反馈与列表、正常重开、键盘焦点环与末取消。图片本身不证明DOM backdrop节点、isTrusted或rpcId，这些分别由原探针/事件/RPC支持。仅本包深色原视口，不签新矩阵/全样式/全UX。

环境：macOS/bash、既有绝对路径nvm Node **v22.23.3**；pnpm11.28.5仅项目口径，本角色未调用。实际自有命令（仓库根）：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/f02-repair-gui-review-20261023-r2-reader.mjs audit
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/f02-repair-gui-review-20261023-r2-reader.mjs audit2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check /tmp/f02-repair-gui-review-20261023-r2-reader.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/f02-repair-gui-review-20261023-r2-reader.mjs format
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/f02-repair-gui-review-20261023-r2-reader.mjs seal
```

audit真实 **exit1**：1457封件/298frames/950raw已核到同，末尾误要求正常backup新增后的旧roots整体全同；保留首失败文件，不算产品FAIL。仅修自有reader，audit2真实 **exit0 / errors=[]**，正确只准新增正常backup四件、原44项全保，再核完整保存/选择/raw链；未重跑任何Main或产品测试。

format核报告链接/尾空白/围栏、输入保全，并以纯结构读取补核原历史及9个snapshot中的dlv1与保存raw全等、全事件请求/响应配对；seal再次保全1460输入及引用/自有输出，不循环自指纹。**format/seal最终真实末码以运行后写的本前缀 `-format-tool-receipt.json` / `-seal-tool-receipt.json` 为准，不预填outer成功。** 详见 [命令审计](f02-repair-gui-review-20261023-r2-command-audit.md) 与 [已执行reader真实收据](f02-repair-gui-review-20261023-r2-reader-tool-receipt.json)。

## 8. Remaining 与释放

**原R1 §6这一个最小slice remaining已关闭；无须补件或重跑有效产品测试/GUI。** 当前GUI PASS只绑定本包index、source/实际built及宿主、合法fixture和原默认label/option-span/首save/一次键盘场景。相关SOURCE/AUTO由独立组合原报告有限继承，父其余未决门仍照原合同汇合，不扩大当前签字。

本角色产品测试执行、GUI执行、build/install/verify/Git/网络/服务操作均 **0次/NOT_RUN**；独立封件核对/原图审证已执行。仓库唯一新增本前缀报告/audit/命令审计/format/seal与真实后置工具收据；其他只读。未改livingdocs/产品/旧报告/原证，不读活runtime/凭据/正式配置，不探端口、不spawn、不停服务。

**本原子审证完成后路径 released / STOP，通知Main。** 本角色未持有builder/GUI/桌面/端口/profile/数据锁或后台会话；不签父ordinarycommit，不新增暂停父goal功能。

# 原 P1L2-F02 六修候选指针 GUI 独立复验审证 R1

2026-10-23，平台 trae，独立 GUI 审证及原 F02 最小复验合同角色。非开发、非 GUI 执行端；Main 唯一 builder/GUI。

## 1. 有限裁决

**P1L2-F02：FAIL_LIMITED_GUI，原指针选择缺陷仍未关闭。** 本包不是“后台保存失败”，也不足以更正为纯设施故障。

- round17 实际选“计划中”后字段改变，但菜单持续存在，等待关闭 4000ms 失败；round19 同一未关闭稿再选“已验收”后菜单仍在。两次真实状态与原图支持原选择闭合红项，不是只凭 selector 超时下结论。
- round19 唯一主保存尝试之前，按钮中心实际命中 **`DIV.rb-lb-backdrop`，`hitIsButton=false`**。随后菜单消失、抽屉仍开、6000ms 无 response、RPC rows=[]、raw 零变。这次点击实际落在遮罩，**未证明原生 submit、保存 callback 或后端被调用**；不另开后台保存 FAIL。
- SOURCE 支持“option 选择未阻止默认动作、外 label 可能再激活 trigger”的优先诊断方向；**本包没有浏览器 click/default action/composedPath 事件 trace，不把此方向签为确证根因**。backdrop 的局部修复已装载，但不等于 option 选择缺陷已修。

本单只签上述原有证切片和原件保全。**不签 P1004、其他修、F01、全 P1005、完整 B8、父普通提交、发布或正式切换。** 旧 L2 两反思的 final 不在本单，不读写其当前 runtime，也不修改旧报告。

## 2. 授权与原依据

本轮负责人限定：

> 父持续原授权所有已实现未验独立收口至ordinarycommit，无push/release/正式切。Main唯一builder/GUI。你独立GUI审证/原F02最小复验合同角色，非开发/GUI。唯一新写docs/testing/six-repairs-pointer-gui-review-20261023-r1* 与自有/tmp reader。
>
> 限定原P1L2-F02；只能签原有证切片；不要新门/新需求/追加全B8；不签P1004/其他修/全P1005/父commit。完成released STOP通知Main。

依据为 [AGENTS](../../AGENTS.md)、[原 F02 合同 §5](p1-l2-events-gui-review-20261023-r1.md#5-p1l2-f02-与失败收据)、[原 listbox SOURCE/AUTO 报告](p1005-listbox-backdrop-source-auto-20261023-r1.md)。[组合整回归有限 PASS](combined-six-repairs-regression-review-20261023-r1-report.md)明确不补新 host/GUI。

本轮明确子单覆盖通用 fetch/pull、build/install、全产品测试、livingdocs 同步及 Git 收尾默认动作。唯一仓库新写本报告、审计、命令审计、auditseal；自有 `/tmp` reader 仅用 Node 内置 fs/path/crypto/util，不 import/eval/执行 Main 脚本、其 assert、产品或测试，不 spawn 子角色。

## 3. 封件与精确候选

证据根：`reports/all-pending-evidence-20261021/SixRepairsPointerGuiR1/`，下称“本包”。[独立审计](six-repairs-pointer-gui-review-20261023-r1-audit.json)含逐项 SHA/size、七段 raw/roots、四轮收据/状态/帧、实际命中及 SOURCE 摘录。

| 对象 | 独立核对 |
| --- | --- |
| [index-r1.json](../../reports/all-pending-evidence-20261021/SixRepairsPointerGuiR1/index-r1.json) | **353/353 普通文件** size/SHA 相同，物理成员集合相同；index SHA `f1e91ef80a75e63a331ba900a0588561a1b7807aa364199e6124ef07d716fe7c` |
| [seal-r1](../../reports/all-pending-evidence-20261021/SixRepairsPointerGuiR1/seal-r1.json) / [outer receipt](../../reports/all-pending-evidence-20261021/SixRepairsPointerGuiR1/seal-outer-receipt.json) | index SHA/353相符；原真实 outer exit0，signal=null，stderr 空，stdout `rootDiffs: []`。不是以 seal 自填 exit 代实际收据 |
| candidate/source/complete 声明 | baseline `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，version `0.7.4`，**124/525**；host绑定两份声明 SHA。只核声明及本单4份必要源码，不冒重新物理核完525产品输入 |
| [host-start](../../reports/all-pending-evidence-20261021/SixRepairsPointerGuiR1/host-start.json) / [activation-binding-r2](../../reports/all-pending-evidence-20261021/SixRepairsPointerGuiR1/activation-binding-r2.json) | 本轮 **3268 / PID9103**，原 cwd 为上游目录；`DSH_PM_E2E=0`、pilot 默认 OFF。浏览器状态统一3268 origin、timeOrigin `1792709371669.3` |
| 原浏览器合并响应 | **2599139 bytes**，SHA `b01f629fe3d174c75a0ddd2e923ba1cb973eeae5baaec6ae77c7b91070290de2`；不是单插件文件 |
| 独立提取 | 从**字节 offset875361 取1720305**，片段 SHA `2879edeee5c231abba7bf50a900d8ff395fdd7eb024f27c67c1b06b4b77f577a`，在合并响应中唯一匹配 |
| 补回尾注释 | 精确 ASCII `//# sourceMappingURL=client.js.map`，**34 bytes、无换行**；恢复1720339 bytes，SHA **`ba7e013dfc9094dea4646e36e8f193399861bb02bffa4dbc888c9cb7c0e3aa31`**，同 built-artifacts/host/activation |
| 44帧内部索引 | round15/16/17/19分别19/5/4/16帧；所有帧内嵌 SHA 同实际封件，**44/44**，无异常、无删失败轮 |

candidate 的 `runtimeLoaded=false` 是早期候选声明，不拿它否认后来本包 activation/浏览器原字节；也不拿 version/HEAD 代实际装载。本角色未执行 Git、探活、接触 profile、活凭据、private freeze/runtime 或正式服务；PID、cwd、端口是原封存元数据，不声称审证时现场服务健康。

四份封存源码逐字节相符 complete-inputs 和 source map：

| 本包 frozen-source 相对路径 | bytes / SHA256 |
| --- | --- |
| `src/client/views/records/records-listbox.tsx` | 4886 / `db16c2e6dcb9c574855b9f0bc82f2d976b7f1756a8d0abcab275c4bbc07683f2` |
| `src/client/views/records/records-deliverable-pointer-dom.test.tsx` | 9159 / `6de116ba10c320a162f1c465958f428ca9023e328b67827581db9ea23df42aec` |
| `src/client/panel.tsx` | 191954 / `341675c4dd31b87d05264de520a4c198edbb3c3476f2f87d8f38cc80ba1d83d6` |
| `src/client/views/records.css` | 6842 / `9cc498a0771c109a779b0b2eb073c675ba7f27c46c75a3b4efb9e45f8a984ce6` |

## 4. 原轮次、RPC 与零写范围

**实际对象为 `p-0001 / dlv-0001 / QA交付物V1 / v1 / m-0001`；本包开始时 DB 已 accepted。** round17 planned 只是表单稿，没完成其计划中的主保存。round19 改回 accepted 也是同一稿；不能签 planned→accepted 的本轮持久化迁移、事件新建或业务保存成功。

| 轮次 / 断言 | 裁决及实际证据 |
| --- | --- |
| round15 打开原交付物编辑 | **PASS_LIMITED_GUI_READ**；outer0。原编辑图/字段为accepted、合法备注，列表已验收1项；仅一对 `/pm web snapshot` RPC，rpcId `4f89c657-89ee-4aa7-89ae-0a1bc614dad2` 同请求/响应且 kind=success；拆raw `{version:2,record}` 后同snapshot，不以HTTP200独签 |
| round16 指针打开状态菜单 | **PASS_LIMITED_GUI_OPEN**；outer0、rows=[]。五个实际 option 出现，未提交；只是打开切片 |
| round17 planned选择/关闭 | **FAIL_LIMITED_GUI_SELECTION**；outer1，`Waiting failed: 4000ms exceeded`。字段及高亮已计划中、菜单仍在、末帧持续近4秒；rows=[]。随后脚本计划中的planned主保存未到达 |
| round18 | **NOT_RUN**；仅作者计划，本包索引无任何round18成员，不能计一次执行、取消或成功 |
| round19 accepted选择/主保存尝试 | **原 F02 GUI FAIL 延续；保存逻辑 NOT_REACHED/未证执行**。outer1、6000ms response timeout，rows=[]；选择后仍菜单，点击前保存中心命中backdrop而非按钮；点击后菜单收起、dialog仍开，非保存成功 |

[round17收据](../../reports/all-pending-evidence-20261021/SixRepairsPointerGuiR1/round17-outer-receipt.json)、[round19收据](../../reports/all-pending-evidence-20261021/SixRepairsPointerGuiR1/round19-outer-receipt.json)、[实际主保存命中](../../reports/all-pending-evidence-20261021/SixRepairsPointerGuiR1/round19-save-pointer-target.json)为原事实。主保存bbox `x1319.875/y639.84375/w87.125/h36`，中心 `(1363.4375,657.84375)`；scrollIntoView 后命中仍是 fixed backdrop，不能把 ElementHandle 的目标按钮身份冒成实际 click target。

四轮 rows 没有 Runtime exception；实际异常是两条 Puppeteer等待超时，原 stderr/stack保留。没有网络失败响应、后端错误或业务异常 trace；**缺少浏览器事件 trace 不等于设施已坏**，也不能据无exception断言整个浏览器无任何错误。

七段为 list、edit、menu、round17-error、round19-before、after、error；每段 **42项roots=36份data/pmtool raw+6项files/backups指纹**。七段roots深比较全等；**252/252 raw**同各roots SHA/size。六项 files/backups仅核封存指纹，不访问未复制的 private 原字节。

dlv1始终773 bytes，SHA `21c1acd4b326480167a83be72c34576320af9a8e7fe31e7ba0b4f1cde59ec1b0`，accepted、updatedAt `2026-10-22T20:51:42.107Z`、history仍2条。t1原3414 bytes及旧task-done原979 bytes分别保持 `e9be08cfba6ad98a796ddd12da0a1bf68b5b68cb7634941ffdc132744059f938`、`710d08dba2d29c586e554a3b4df671b8881b5bb5d329da17b47531dd3a4bb332`。

这是本包采证窗口的有限保全，不声称全机/正式数据零污染。两事件记录只随原raw整体指纹保全，**不审签其draft/final，不执行edit/final**。

## 5. SOURCE、GUI 与设施推断分离

[锁定 listbox](../../reports/all-pending-evidence-20261021/SixRepairsPointerGuiR1/frozen-source/src/client/views/records/records-listbox.tsx#L58-L139)及独立提取的实际下发代码均明确：

1. `choose`先 `onChange(option.value)`、再 `setOpen(false)`；两个effects不重新置open=true。trigger 的click是toggle。
2. backdrop click有 `preventDefault()`、`setOpen(false)`；**option 的click只有choose，没有preventDefault**。所以“已经写setOpen(false)”不证明浏览器默认动作完成后仍保持关闭；backdrop与option是不同接点。
3. 实际下发 `RecordsDeliverableForm` 把status listbox嵌在隐式外label内，trigger是第一个可标记button；onChange只setField/校验，不发保存。form只有submit调用onSaveDeliverable，成功才onSaved。此源码直接从已核bundle读得，不导入产品。
4. [records.css](../../reports/all-pending-evidence-20261021/SixRepairsPointerGuiR1/frozen-source/src/client/views/records.css#L33-L42)是fixed/inset0、z30 backdrop及z31 menu，与实际保存中心被遮罩命中一致。

**确证：** 指针选项令状态改变，却未稳定闭合；主保存坐标被仍存在的backdrop截住；点击后关闭菜单但未提交。不是旧bundle遗漏backdrop修，也不能归为“正确保存按钮已触发、后端无响应”。

**推断而非确证：** option处理时关闭使选项节点卸载，浏览器外label默认激活可能随后再点关联trigger，抵消关闭。这与两轮字段改变/trigger焦点/菜单仍在、源码差异和既有backdrop局部AUTO因果相容；**未观测本轮额外trigger的次数、事件目标/顺序、isTrusted/detail/defaultPrevented/composedPath，不补造这些字段**。不能把既有JSDOM D04/D06的backdrop trace冒成本轮option trace。

原D01/D02用JSDOM `dispatchEvent`＋显式focus＋`HTMLElement.click()`，虽覆盖生产form/option与span，却无浏览器布局/真实命中/默认动作时序等价保证。因此原35条SOURCE/AUTO及组合DOM绿保留其窄边界，**不推翻本次GUI红，也不据GUI红伪称原AUTO当时失败**。[panel副本](../../reports/all-pending-evidence-20261021/SixRepairsPointerGuiR1/frozen-source/src/client/panel.tsx)还含旧原生select表单，不能把那个不同入口当成当前records listbox或本轮已执行提交。

## 6. 原默认 label 场景最小红 / 修 / 复验合同

本节仅细化原合同 §5“实际表单指针选accepted→popup闭合→明确主save＋一次原键盘对照”；不是追加门或新需求。

**红证：** 本包round17/19保留为真实GUI红。开发应在实际生产form+overlay、现有默认外label和真实option/button内span接点定位选择后的open最终状态；当前JSDOM全绿不能冒成已复现浏览器红。必要浏览器诊断由**Main唯一GUI端**补原命中/事件链，不由本角色或开发接手GUI；若未采到trace继续明确未证。

**修复范围：** 聚焦选择click/default action与外label交互。优先验证option局部默认动作取消是否消除额外激活，或采用等价且保留标签语义的局部修法；工程选择由开发依据实证决定，不能仅凭本报告称根因已定。不得以全局截click、改库、改业务状态机、删标签语义、改正式profile、强制programmatic save、第二次补点或keyboard绕路洗红。既有backdrop行为和键盘功能须保持。

**最小复验步骤，交Main，当前本角色不执行：**

1. 绑定修后source/dirty候选、built/实际浏览器字节、新实例/开关及合法原fixture。先实读dlv1状态；若沿原planned→accepted切片，必须通过正常表单主保存准备planned并实核RPC/raw，**单列fixture准备**。不能以round17未保存稿当DB planned，也不手seed。
2. 实际records编辑表单，指针打开状态、指针选accepted。字段正确且菜单/backdrop稳定消失、expanded=false；选中本身零保存RPC/零业务写。保留真实命中、选择前后原图/帧；若复验option内span与button的点击落点不同，按原接点记录，不能程序click绕坐标。
3. 明确**一次**Main主save，先核可见按钮中心命中按钮/其子元素而非backdrop，再真实指针点击。完整deliverable-update request/response同rpcId且成功、accepted payload/raw/页面结果一致；关闭编辑抽屉、正常重进读回。非目标任务、旧反思、两L2反思和资料字节保全；本单不要求重新创建或定稿反思。
4. 同候选按原键盘选择/Enter主save切片对照一次，记录实际结果；不以此取代第2/3步。开发受影响回归沿既有7案DOM与原相关28案及实际改动映射，候选完整回归仍归父既有门，本单不另起全B8/其他consumer GUI。
5. Main提交真实原图/帧、RPC、前后raw/roots、失败原件和outer收据给独立专家复验。若选择仍开，停止该链并保红；若主save坐标仍命中遮罩，不算触发submit或后台失败，不盲补点洗成首点成功。若以设施原因请求更正，须给原实际命中/事件链与修正后同切片实证，不能只报后续绿。

**精确remaining：** 原F02默认label选择稳定闭合；闭合后真实一次主save完整链；同字节一次原键盘对照及受影响回归审证。无须本单重做已签旧L2创建/重复/final、P1004、其他六修、全P1005/全B8；不承担父提交汇合。

## 7. 独立目视、命令与停止

本专家实际 `view_image`目视 **9件**已封存原图/帧，非运行GUI：round15-deliverable-edit.png、round16-pointer-menu.png、round17-error-state.png、round19-after-accepted-selection.png、round19-error-state.png；frames/round17-3.jpg、round19-3.jpg、round19-8.jpg、round19-15.jpg。前四状态见accepted→planned→accepted与菜单持续，末图/帧见滚至底部主save可见、菜单已消失但dialog未关，无成功状态。

原viewport 1440×718、DPR2，帧pageScaleFactor1；仅本包深色原切片。图片工具显示的缩放尺寸不当页面视口/200%；不追加浅深矩阵。

运行环境：macOS/bash、既有 nvm Node **v22.23.3**绝对路径；pnpm11.28.5仅项目口径，本角色未调用。自有真实执行（仓库根）：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/six-repairs-pointer-gui-review-20261023-r1-reader.mjs audit
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check /tmp/six-repairs-pointer-gui-review-20261023-r1-reader.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/six-repairs-pointer-gui-review-20261023-r1-reader.mjs seal
```

audit真实exit0、errors=[]、warnings=[]；语法与seal实际终码记录于本前缀命令审计。seal保护**360个声明输入**、报告链接/尾空白及自有输出指纹，输出为本前缀`-auditseal.json`，不自指纹。不冒产品完整回归或GUI执行。

准备时首次请求login=false工具不支持，**没有shell进程/末码**；rg缺失实际exit127，改find/grep/sed。原frame哈希“疑似不一致”为探索误读，经独立44/44核实未成立，不登记产品/封件FAIL。所有其他只读命令完成0；[命令审计](six-repairs-pointer-gui-review-20261023-r1-command-audit.md)保留这些失败/未执行边界。

**本角色产品测试执行NOT_RUN、GUI执行NOT_RUN；独立封件核对/原图目视/审证已执行。** 未改产品/plans/livingdocs/旧testing/原封件，未build/install/网络/服务/Git，未执行Main脚本或spawn子角色。无本角色长运行进程、builder/GUI/端口/profile/数据锁；未停改服务。**released / STOP，交Main按原父授权继续，不要求暂停父goal。**

# 原 F02 选项原生默认激活诊断独立审证 R2

本报告给 Main 和原 F02 接续专家使用：只裁 `F02OptionNativeTraceR2` 的原诊断封件，不验修后代码或新 GUI。2026-10-23，平台 trae，独立原 F02 GUI 诊断审证专家；非开发、非 GUI 执行端。

## 1. 有限结论

**封件完整性核对通过；原生 label 默认激活根因获得强支持，但不是排他性因果确证。原 F02 的 `FAIL_LIMITED_GUI` 保留，修后 GUI 为本单 `NOT_RUN`，不签新 GUI PASS。**

真实观测补足了旧 R1 缺失的关键事件链：planned option 内 span 的 trusted/detail1 click，在 document bubble 时已经改值并关闭；随后没有采证脚本追加输入，关联 trigger button 出现 trusted/detail0 click，重新打开。实际下发源码的 choose 确实执行 close，trigger 确实 toggle；所以本轮不是“choose 从未关闭”，而是“关闭后额外 trigger 激活抵消关闭”。

这个直接近因已经观测到；外 label 默认动作是与源码、composedPath、focus 和事件时序最相符的解释，可支持原合同的 option 局部默认动作修复方向。**不把 detail0/trusted 单独当作 label 来源证明，不把单轮观察当作修前/修后干预对照。** 本包未证明新 `preventDefault` 已生效、主保存成功或新候选全部通过。

**摘要口径纠正：round26 不是零 RPC。** [原 events](../../reports/all-pending-evidence-20261021/F02OptionNativeTraceR2/round26-events.json)有一对只读 `/pm web snapshot`，rpcId `7d6d3707-4a30-4824-ab2e-8edf8c62645c`，请求/成功响应齐全；没有业务写 RPC。封存 summary、07:13 接续及修复计划中“无/零 RPC”的描述不能替代原件。本报告追加更正，不覆盖这些原件；该偏差不推翻 round28 诊断链或零业务写结论。

## 2. 原子授权与规则

负责人原句的有效边界：

> 父持续原授权全部已实现未验至ordinarycommit，无新增暂停功能/push/release/正式切。Main唯一builder/GUI。
>
> 你的原子单仅审 reports/all-pending-evidence-20261021/F02OptionNativeTraceR2 全443件。
>
> 唯一仓库新写docs/testing/f02-option-native-trace-review-20261023-r2*与自有/tmp reader，其他只读。
>
> 禁止产品/测试/plans/livingdocs/旧testing/封件写、运行产品/GUI/build/install/服务/Git/privatefreeze/runtime/凭据/spawn。本子单覆盖通用fetch/pull/build及git收尾SOP。
>
> 完成结论/仍原§6remaining/路径释放STOP通知Main。

已读 [AGENTS](../../AGENTS.md) 与 [collaboration §9/§11](../collaboration.md)：执行与审签分离、原候选与实际运行字节分别绑定、当时有效证据不回填、不扩子项结论。参考 [旧 F02 R1](six-repairs-pointer-gui-review-20261023-r1-report.md)、[原修复计划](../plans/2026-10-23-f02-option-default-repair.md)、[07:13 接续](../plans/2026-10-23-0713-continuation.md)。

本单不重新派 F01、不追加新门/全 B8，不接父提交汇合。明确子单覆盖通用 fetch/pull、install/build、产品回归、livingdocs 和 Git 收尾；Main 保持唯一 builder/GUI，父全部原授权继续。

## 3. 全量封件与真实收据

证据根：`reports/all-pending-evidence-20261021/F02OptionNativeTraceR2/`。独立 reader 只使用 Node 内置 fs/path/crypto/util，不 import/eval/执行原 round、harness 或 Main sealer，不读取其 private freeze/runtime。

| 核对对象 | 独立结果 |
| --- | --- |
| [index-r1](../../reports/all-pending-evidence-20261021/F02OptionNativeTraceR2/index-r1.json) | **443/443** 索引成员实际 size/SHA 相同；物理集合恰为 443 件加 index/seal/outer 三附属件，共 **446** 普通文件，无缺失/额外/软链 |
| index SHA256 | `9cbb0bf2737874fc0ebcfae5bcc19666fc25563f8b9f1f707a716e9de0033e7b` |
| [seal-r1](../../reports/all-pending-evidence-20261021/F02OptionNativeTraceR2/seal-r1.json) | 443 与 index SHA 相符；`independentVerdict=PENDING` 是原作者声明，不冒作专家 PASS |
| [真实 seal outer](../../reports/all-pending-evidence-20261021/F02OptionNativeTraceR2/seal-outer-receipt.json) | 实收 inner 子进程 exit0、signal=null、stderr 空；stdout `files:443 / clicks:6 / roots:44 / rootDifferences:[]`，时间和 argv 保留，不仅引用自填 seal.exit |
| 原 sealer 源码 | 已只读审查复制过滤、五源码对 complete 校验、roots/trace/cleanup 检查与 spawnSync 收据生成；本角色未运行 |
| 原帧内部索引 | round26/27/28 分别 **7/20/13**，共 **40/40** 内嵌 SHA 同实际原帧；帧集合相同 |
| [自有独立 audit](f02-option-native-trace-review-20261023-r2-audit.json) | 一次 audit 实际 exit0，894 项检查、errors=[]；含全部逐项实际指纹、收据、事件/path、raw/roots、实际 bundle 摘录与局限 |

原 seal outer 是封工具 wrapper 对 inner 的实际收据，不能据此补造未封存的外层工具 transcript。07:13 声称工具直接终码0仍是 Main 记录；本角色只独立核到包内上述真实收据及对应内容。

## 4. 候选、运行与实际下发代码

| 对象 | 核到的范围 |
| --- | --- |
| combined candidate/source/complete | baseline `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，version `0.7.4`，source **124**、complete **525**；声明计数/基线/host引用 SHA 一致 |
| host/ready/activation及收据 | 原 **3268 / PID9103**、cwd 上游目录、profileLink 指向原六修隔离包；`DSH_PM_E2E=0`、pilot 默认 OFF；真实 host setup status0、activation outer exit0，监听/argv/cwd封存结果齐 |
| 本轮浏览器状态 | 全九段统一 `http://127.0.0.1:3268`、timeOrigin `1792709371669.3`，1440×718、DPR2；不是审证时重新探活 |
| 合并浏览器响应 | 实际 **2599139 bytes**，SHA `b01f629fe3d174c75a0ddd2e923ba1cb973eeae5baaec6ae77c7b91070290de2` |
| 独立提取插件片段 | offset **875361**、**1720305 bytes**，唯一匹配，SHA `2879edeee5c231abba7bf50a900d8ff395fdd7eb024f27c67c1b06b4b77f577a` |
| 补回精确尾注释 | ASCII `//# sourceMappingURL=client.js.map`，34 bytes、无换行；恢复 **1720339 bytes**，SHA `ba7e013dfc9094dea4646e36e8f193399861bb02bffa4dbc888c9cb7c0e3aa31`，同 built-artifacts/host/activation |

candidate 的 `runtimeLoaded=false` 属早期声明，后来实际 activation 和浏览器字节另有证据，不能以该字段否认后来装载。**未独立重核 private 中525输入、455产物、tracked diff或新增文件原件；本包没有这些完整原字节，声明不等全量物理验证。** 不读取当前产品文件来冒充修前候选或 Main 正在改的修后候选。

五份封存源码均与 complete-inputs 的 size/SHA 完全一致；其中 listbox、DOMtest、CSS 另与124份 dirty source 声明对应，form/overlay不在 dirty 清单，不误记为缺源码：

| frozen-source 相对路径 | bytes / SHA256 |
| --- | --- |
| `src/client/views/records/records-listbox.tsx` | 4886 / `db16c2e6dcb9c574855b9f0bc82f2d976b7f1756a8d0abcab275c4bbc07683f2` |
| `src/client/views/records/records-deliverable-form.tsx` | 9686 / `e2eb1ef86b8e568c78e4ea6f71c4f4fcb19a477d0b5c40b5d07510ceec0f9ca8` |
| `src/client/views/records/records-deliverable-pointer-dom.test.tsx` | 9159 / `6de116ba10c320a162f1c465958f428ca9023e328b67827581db9ea23df42aec` |
| `src/client/views/records/records-overlay.tsx` | 1316 / `dfd1f68b4ffe3eaf10bbc95e47c567bf5d63c32919bd9770ca58759173498beb` |
| `src/client/views/records.css` | 6842 / `9cc498a0771c109a779b0b2eb073c675ba7f27c46c75a3b4efb9e45f8a984ce6` |

直接从已核实际合并响应提取的 listbox/form 与源码逻辑一致：option `onClick: () => choose(option)` 无取消默认动作；choose 先 onChange 再 close；trigger toggle；backdrop 单独 preventDefault 再 close；form 的 status listbox 在 `label.pm-field` 内，选择只 setField/校验，显式 submit 才调用 onSaveDeliverable。两个 effects 没有再次置 open=true。此处为旧实际字节的源码审查，不是运行产品测试。

## 5. 原事件链、被动脚本与因果边界

[原 trace](../../reports/all-pending-evidence-20261021/F02OptionNativeTraceR2/round28-native-click-observations.json)共六条 phase 观测，可按相邻 capture/bubble 归为三组 click；没有记录 event identity，不说成“六次点击”。原 stdout 中完整 clicks 与 trace 逐结构一致，时间严格递增。

| console 时间戳 ms | phase / 实际 target | trusted / detail / defaultPrevented | value；expanded / popup / backdrop |
| --- | --- | --- | --- |
| 1792710626262.447 | capture / trigger value SPAN | true / 1 / false | accepted；false / false / false |
| 1792710626279.629 | bubble / 同 SPAN | true / 1 / false | accepted；true / true / true |
| 1792710626484.976 | capture / planned option SPAN | true / 1 / false | accepted；true / true / true |
| 1792710626488.719 | bubble / 同 option SPAN | true / 1 / false | planned；false / false / false |
| 1792710626491.424 | capture / BUTTON#deliverable-status | true / 0 / false | planned；false / false / false |
| 1792710626494.927 | bubble / 同 trigger BUTTON | true / 0 / false | planned；true / true / true |

option 路径为 `SPAN → BUTTON[role=option] → DIV[role=listbox].rb-lb-menu → DIV.rb-lb → LABEL.pm-field → … → FORM → … → document/window`。后续 trigger 路径从 `BUTTON#deliverable-status → DIV.rb-lb → 同结构 LABEL.pm-field` 开始。option capture focus 是 option，bubble focus 为 BODY；后续 trigger capture/bubble focus 是 trigger。这与 option 关闭导致卸载、外 label 转激活首个关联控件相容；**未直接记录 isConnected 或 label.control/for，不将“卸载/关联控件身份”写成额外实测字段。**

[指针命中](../../reports/all-pending-evidence-20261021/F02OptionNativeTraceR2/round28-planned-pointer-target.json) bbox x1183/y290.234375/w207/h20.296875，中心 `(1286.5,300.3828125)` 实际命中 planned SPAN，`hitIsTarget=true`。原脚本在该真实 `ElementHandle.click()` 后只有状态采集、等待与只读采集，没第二次点 trigger、keyboard 输入、dispatchEvent 或 HTMLElement.click 来重放这条额外激活。

[round28 源码](../../reports/all-pending-evidence-20261021/F02OptionNativeTraceR2/round28-source.mjs)的诊断注入只创建 document capture/bubble `passive:true` click listeners，读取 target/composedPath/focus/value/expanded/menu/backdrop 并 console.debug。**注入观察器没有 preventDefault/stopPropagation、DOM/props/store 写。** 原脚本还正常执行指针、截图和取消；“被动”限定观察器，不声称整轮无用户动作。harness 的 connect 上游 helper 不在本封件，不能凭该脚本独立担保所有外部 helper 内容；这里没有读取或执行该未封 helper。

[closure](../../reports/all-pending-evidence-20261021/F02OptionNativeTraceR2/round28-popup-closure-observation.json)实收 `closed=false / 4000ms exceeded`；稳定末状态和原图菜单仍开。原脚本主动捕获该超时，所以 **round28 outer0 是诊断收集成功，不是选择通过**。

[cleanup](../../reports/all-pending-evidence-20261021/F02OptionNativeTraceR2/round28-passive-observer-cleanup.json)实收 removed2；源码按原 capture 标志移除两监听，releaseObject 后正常 backdrop 点击/取消，再采状态并 detach/disconnect。[移除后计数](../../reports/all-pending-evidence-20261021/F02OptionNativeTraceR2/round28-observer-removal-after-clicks.json)6→6、不增，最终 dialogs=[]。这些共同支持已移除本观察器；没有把“监听移除收据”扩成浏览器全局监听清理。

因果支持程度分层：

1. **直接确证的近因**：真实选项处理后已闭合，随后额外 trusted trigger click 令其重开；不是单凭 wait timeout 推断。
2. **强支持的根因解释**：旧实际源码默认动作未取消、label 路径、focus迁移、2.705ms 后 detail0 trigger 串联，支持 native label 默认激活。采证脚本无额外输入，削弱 Main 补点、观察器自行造事件及纯 effects 自开等替代解释。
3. **未作排他确证**：只有单轮同源封存，console 时戳不是 event.timeStamp；没 pointerdown/up、native activation 调用栈、label.control、isConnected，也没修前/修后浏览器干预对照。trusted/detail0 不唯一标识 label 触发源，未封 helper/其他脚本行为也未穷尽。缺口是诊断局限，**不是本单新增门或要求重放原 round**。

不回填旧 R1 为“当时已有 trace”，不更正旧 F02 为纯设施或后台保存失败，不以诊断收据0洗成修后GUI绿。

## 6. 九状态原件、七段零写与原图

核心连续七段为 round27 list/edit，round28 before/menu/after-selection/stable/cancel。每段 **44项 roots = 38份 data/pmtool raw + 6项 files/backups 指纹**，全部深比较相同；**266/266** 核心 raw 字节对应 roots。

另保 round26-error、round27-current-after-readiness-failure 两段，分别仍44/38且同基线；全包 **342/342** raw 与 roots size/SHA一致。不会把九段说成七段或沿用旧包36份raw的口径。六项 files/backups只有封存指纹，未访问private原字节，不声称独立比完其物理内容。

原对象 `p-0001 / dlv-0001 / QA交付物V1 / v1 / m-0001`，库初态 accepted，history 2条，updatedAt `2026-10-22T20:51:42.107Z`。整个窗口 dlv1维持773 bytes/SHA `21c1acd4b326480167a83be72c34576320af9a8e7fe31e7ba0b4f1cde59ec1b0`。planned 是未保存表单稿，取消后列表仍已验收；不证明 DB planned、planned→accepted 本轮写迁移或业务保存。

非目标任务、旧反思、两 L2 原记录及 E/H 等都在38份 raw/44指纹保全内；只核原字节，不重审其 final或功能门。t1的3414 bytes/SHA `e9be08cfba6ad98a796ddd12da0a1bf68b5b68cb7634941ffdc132744059f938`和旧反思979 bytes/SHA `710d08dba2d29c586e554a3b4df671b8881b5bb5d329da17b47531dd3a4bb332`不变。

| 轮次 | 实际收据与范围 |
| --- | --- |
| round26 | outer1，`assert(picker.asElement())`失败；原图是E习惯页，尚未走到本轮F02选择。实有一对只读snapshot成功RPC，不是零RPC；保存/业务写未执行。不能把准备时序失败扩大为F02设施免责 |
| round27 | outer0，rows=[]，正常从E切A/交付物列表进入原编辑；只读观察和打开，accepted初态 |
| round28 | outer0，rows=[]，真实planned选择后重开、4秒仍开；移除观察器、正常取消完成。零保存RPC、零受监视业务字节变化 |

本专家实际 `view_image` 一次必要目视 **8件原图/帧**：round26-error-state.png、round27-original-deliverable-diagnostic-start.png、round28-status-menu-before-selection.png、round28-after-planned-pointer-selection.png、round28-stable-selection-end.png、round28-after-normal-cancel.png、frames/round28-3.jpg、frames/round28-9.jpg。

目视与状态一致：编辑初值已验收；菜单展开可见五项；选择后字段和高亮为计划中、菜单仍在；等待末图仍在；取消末图无抽屉、原列表仍已验收。frame9 与 frame7/8同SHA、时间到23:10:30.744，支持等待末仍开。图片无法显示2.705ms的中间 closed，那个瞬态仅由trace支持，**不说原图拍到了瞬态或看到了DOM backdrop节点**。

仅本包深色、1440×718、DPR2，帧pageScaleFactor1；图片工具缩放不算新视口或200%验收。不签其他主题/视口/消费者/完整旅程。zero-write限定采证窗口及声明roots，不冒全机或正式服务零污染。

## 7. 自有验证、原 remaining 与释放

环境：macOS/bash，既有绝对路径 nvm Node **v22.23.3**；pnpm11.28.5仅项目口径，本角色未调用。真实自有验证命令在仓库根执行：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/f02-option-native-trace-review-20261023-r2-reader.mjs audit
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check /tmp/f02-option-native-trace-review-20261023-r2-reader.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/f02-option-native-trace-review-20261023-r2-reader.mjs seal
```

audit实际工具exit0、errors=[]；已执行的语法检查实际exit0。首个自有seal实际 **exit1**，451输入changes=[]，只读snapshot补核的fileAssets整对象断言不成立；[首封失败原件](f02-option-native-trace-review-20261023-r2-auditseal.json)完整保留。独立字段检查已证两个fileAssets的公开字段与raw同，唯一raw独有键是`relPath`，不是业务数据变化。这是自有补核断言边界错误，不是产品或原封件FAIL。

只修自有reader，`seal2`对fileAssets公开字段全等、raw独有键严格只准`relPath`且对应封存files指纹，其他10类仍整record比较；不重跑443全量audit、不读产品源码、不运行产品。最终输入保全、自有文件指纹、首封失败原件指纹及补核结果见 [二次独立封存](f02-option-native-trace-review-20261023-r2-auditseal-r2.json)，命令为：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/f02-option-native-trace-review-20261023-r2-reader.mjs seal2
```

seal不自指纹，终态记录按真实执行结果，不预填GUI PASS。完整命令、准备阶段失败和工具终码口径见 [命令审计](f02-option-native-trace-review-20261023-r2-command-audit.md)，封后真实命令收据单列且不参与循环指纹。

本子单的封件审查/原图目视已执行；产品测试、GUI执行、修后SOURCE/AUTO/GUI均 **NOT_RUN（本角色范围外）**。不拿自有894项完整性检查替产品全回归或独立修后门。

**仍仅原 [R1 §6 remaining](six-repairs-pointer-gui-review-20261023-r1-report.md#6-原默认-label-场景最小红--修--复验合同)**：修后同候选默认label的指针选择稳定闭合且选择零写；真实一次首点主save命中按钮/子节点、完整成功RPC/payload/raw/关层/重进读回；同字节一次原键盘对照及受影响回归审证。需要planned初态时只能按原正常表单主save准备，单列夹具写。本报告不重列新测试合同，不要求重采旧round或新全B8，不签两文件开发红绿、父普通提交/发布/正式切。

仓库唯一新增为本前缀报告/audit/命令审计/auditseal及封后真实命令收据，自有 `/tmp` reader归本角色；其他只读。未改产品、产品测试、plans、livingdocs、旧testing、封件；未build/install/服务/Git/privatefreeze/runtime/凭据/spawn，未运行Main sealer或原round。本角色无后台会话、builder/GUI/端口/profile/数据锁，未停止或改任何服务。

**本原子审证完成，路径 released / STOP，通知 Main 按原父持续授权继续原缺陷修复和剩余验收；不要求暂停父任务。**

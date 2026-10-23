# P1L2-F02 开发诊断与交接

> 记录限定指针交互子单的真实 DOM 诊断、最小 delta、红绿收据和仍待证明的浏览器边界，供 Main 与独立专家接续。2026-10-23，平台 trae；不是 GUI 审签或父出口。

## 1. 当前结论

**仅修复了真实 DOM 确证的 backdrop 默认激活缺陷；不声称已关闭 P1L2-F02。**

- 原 1077 件 P1L2EventsR1 逐 SHA/bytes 核对相符，原件只读；原 index SHA `bcd70eb34ec33b4c1cec4d88e86eba30d3fc0488e939725cd191de82557c2180`。记录见 [baseline](2026-10-23-p1005-deliverable-pointer-baseline.json)。
- 原源码在真实 React DOM 中：指针事件模型点击 option button 或内部 span 都能选 accepted 并关闭 popup，随后实际 submit button click 产生一次正确表单回调；直接重复 trigger 也正常。**不能据原 ASSERT 或 screenshot 将 option→label→重开说成已证根因。**
- 另一个生产行为稳定失败：点实际 backdrop 后，外层 label 默认激活它的关联 trigger，第二次 click 抵消关闭。真实 form+overlay 与最小生产 listbox+label 都红，移除 label 的 div 对照绿；不是 helper mirror。
- 只取消 backdrop click 的默认动作，同一 SHA 的 7 例两轮全绿，4 个旧专项 28 例全绿。原 GUI pointer 命中、accepted 选择后仍开、主 save 无 RPC 尚需 Main 收集新证据；原专家有限 GUI FAIL 不被本开发绿覆盖。

父原句与文件/资源授权见 [plan](2026-10-23-p1005-deliverable-pointer-plan.md)。本单未做 Git、build/install/noEmit、GUI、服务、业务落盘；不接 L2 命令/P1004，不改 testing/原件/livingdocs/上游/全局/private 入口。ordinary commit、唯一 builder/GUI 与专家审签仍归父分工。

## 2. 原证可判与不可判

原专家 [全文](../testing/p1-l2-events-gui-review-20261023-r1.md) 已读，含 §4/§7；F01 不属本单。原 round08/09/10/11/12 events 分别有 4/6/3/3/29 帧。round08–11 rows 全空；round12 rows 仅 request/response，没有 pointer/focus/submit 行。

帧 metadata 只有 `offsetTop/pageScaleFactor/deviceWidth/deviceHeight/scrollOffsetX/scrollOffsetY/timestamp`。原 state 只保存 dialog bbox、按钮文本/aria/disabled 和焦点摘要，没有 option/trigger/save bbox、pointer 坐标、`elementFromPoint`、composedPath、CSS computed transform/pointer-events/z-index 或 pointer capture 状态。

原 `record()` 只开 Runtime.exceptionThrown、RPC request/response 和 Page.screencastFrame，并不记录 Input.dispatchMouseEvent 或 DOM 事件。原 round09 调 `textButton('已验收')` 再 `textButton('保存更改')`；经公开封存 helper 只读追到“全 document 找第一个文本完全相等且有 client rect 的 button，再 elementHandle.click”。**选择器意图可追溯，但实际命中不能由 helper 代码倒推。** 未运行这些脚本、未访问其 private import/凭据路径。

实际本轮静态目视原 `frames/round09-deliverable-accepted-0.jpg` 与 `-5.jpg`：前者 trigger 计划中，后者已验收且菜单仍可见。图片文件 1500×748，帧 metadata 视口 1440×718、scale1；截图像素不能直接当 CSS 输入坐标。仅确认现象，不据两张图判因果或 GUI PASS。

必要生产源码：listbox choose 调 `onChange` 后 `setOpen(false)`；trigger toggle；backdrop 关闭；option 为 button，内有 span。deliverable-form 外层是 label，submit 先校验再调用 `onSaveDeliverable`。overlay 只有全局 Escape 和 scrim click，没有本子树 pointer capture/焦点拦截。现有 CSS 是 fixed backdrop z30 / absolute menu z31；**仅源码声明，不代表原浏览器 computed/containing block/命中已核**。

## 3. 真实 DOM 红与最小化

环境 macOS/bash、Node `v22.23.3`、Vitest `2.1.9`、React/ReactDOM `18.3.1`、JSDOM `25.0.1`。pnpm11.28.5仅引用环境，不调用。

生产 form/listbox/overlay 均原字节快照到每轮新 tmp 输入；只在已有公开 callbacks 边界记参数，不写数据、不 import private panel、不 stub 产品逻辑。用 native DOM pointerdown/mousedown/focus/pointerup/mouseup 和 `.click()` 进入 React 事件链，capture/bubble/focus/submit 与 HTML 回读保存在每例 observations。**无真实坐标、layout、浏览器 pointer capture；MouseEvent 型 pointer 名称及程序 click 不能冒实际用户 pointer。JSDOM label 默认 click 可报 isTrusted=true，也不是浏览器采证。**

首轮 dom-r1：D01 option button / D02 option span 选择并主 save、D03直接 trigger、D05 false-save 保留和重试均绿；D04真实 backdrop 红。第二轮追加最小化对照 D06 label / D07 div：D04/D06红，其余5绿。旧源码保持相同，未人为改坏源码/fixture造红。

四个可证伪解释与结果：

| 解释 | 预测与实际 |
| --- | --- |
| label 默认激活 | backdrop 原 click 后出现第二次 trigger click；最小 label 红、div 绿，符合 |
| React 状态更新错误 | 去 label 仍应红；实际 div 绿，不支持此局部原因 |
| overlay 干预 | 去 overlay/form 后应消失；实际最小 listbox+label 仍红，排除此局部原因 |
| 浏览器 CSS 命中/transform | JSDOM 不能判断；只保留给 Main，不把它说成已排除或已证 |

红 D04 capture：`trigger(detail0) → backdrop(detail0) → trigger(detail1)`，backdrop bubble `defaultPrevented=false`，最终 expanded=true，save回调零调用。绿：只有 `trigger → backdrop`，backdrop bubble `defaultPrevented=true`，expanded=false。D06无form/overlay仍出现相同默认第二 click；D07不出现。原始过程及最终收据见 [facts-r2](2026-10-23-p1005-deliverable-pointer-facts-r2.json)，首版facts保留；它只提取自有原件，不重判专家原 GUI。

收尾自查补齐test样本的交付物`dueDate:null`、里程碑`achievedDate:null`，没改生产逻辑；最终test9159字节。用最终test在新输入`red-final`执行dom-r2冻结旧listbox（先校SHA等baseline），仍D04/D06红，其余5绿；并行两个新candidate输入各7绿。**未把主树源码恢复/改坏来造红**；red-final receipt 的`inputs`记录调用前主树，`actualSourceInputs/originalFrozenSource`明确记录实际执行的冻结旧源码，不能混用。

## 4. 精确 delta 与 SHA

唯一已修改生产文件：[records-listbox.tsx](../../packages/dsh-pm-tool/src/client/views/records/records-listbox.tsx#L109-L113)，1 行替换为 5 行；backdrop handler 增加 `event.preventDefault()` 和原因注释，仍 `setOpen(false)`。没有给所有 click 添加 preventDefault/stopPropagation，不改 choose/trigger/键盘/save/overlay/CSS。

新增 [真实 DOM test](../../packages/dsh-pm-tool/src/client/views/records/records-deliverable-pointer-dom.test.tsx)，7例；`records-deliverable-form.tsx` 没改。其余写面只有本前缀 plans 与 `.tmp/p1005-deliverable-pointer-20261023-r1/`。精确 unified delta 在交付 [delta](2026-10-23-p1005-deliverable-pointer-delta.patch)，新 test 全文件单列 seal 指纹。

| 输入/输出 | bytes / SHA256 |
| --- | --- |
| 修前 listbox | 4737 / `790533aed66fa35a6258e8a37c345058b8204d9d91cb86684e48453218f9cf7d` |
| 候选 listbox | 4886 / `db16c2e6dcb9c574855b9f0bc82f2d976b7f1756a8d0abcab275c4bbc07683f2` |
| dom-r2、初次两green相同test（历史） | 9124 / `7319b70546ed58e135ab677a15670535e99314fea99b90bb8c9bdd2e0dc56258` |
| 最终test，red-final及两green-final相同 | 9159 / `6de116ba10c320a162f1c465958f428ca9023e328b67827581db9ea23df42aec` |
| dom-r2 结果 | 6785 / `3889788cfd9ff1333d35a3aece8a969a5bdb32fb29c53a09f711c5de1ece5aa5` |
| green-r2 结果 | 2849 / `b19e32443d3bf5a9d96695bbebe2e539690412c3afdea4c181996bea8f4c7a67` |
| red-final 结果 | 6799 / `f0e117f08a1915f560e7d76f2e412328f98704b49c54027ede7db435338668bf` |
| green-final-r2 结果 | 2865 / `5a37be0d3097096601fe33da58976ecf884fade67ecfe5040295a01e84063ab0` |
| affected 结果 | 12352 / `a237d8853211dc4b9847e20b9e2f2ee8d021183b5e8f44f26b841a9bae435e3c` |

候选基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` 仅引用原专家声明，不声称当前 dirty HEAD 或新 bundle身份。每轮 receipt 有实际源码/测试输入、原字节 snapshot、完整 argv/cwd、退出码、config/cache/output 指纹与声明依赖前后 SHA。React和ReactDOM明确用同一 `.tmp/widget-poc/node_modules` 来源；既有 package store 只读链接，避免混身份，不复制/安装依赖。依赖保护范围是声明 React/ReactDOM/JSDOM 文件集合，不冒全依赖树/全磁盘。

## 5. 完整验证记录

以下为历史实际执行记录（repo根），runner 拒绝覆盖已有输出，**不要原样重跑旧阶段**。Main 接续使用新轮名字/新根；内部真正 Vitest 的完整命令、cwd、QA_POINTER_EVIDENCE_ROOT/TMPDIR/XDG_CACHE_HOME/VITE_CACHE_DIR 均在同名 `*-receipt.json`，不是主包默认配置/缓存。

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node packages/dsh-pm-tool/scripts/verify-external-skills.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/plans/2026-10-23-p1005-deliverable-pointer-run.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p1005-deliverable-pointer-run.mjs audit
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p1005-deliverable-pointer-run.mjs dom-r1
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p1005-deliverable-pointer-run.mjs dom-r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p1005-deliverable-pointer-run.mjs green-r1
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p1005-deliverable-pointer-run.mjs affected
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p1005-deliverable-pointer-run.mjs green-r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p1005-deliverable-pointer-run.mjs vendor-final
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p1005-deliverable-pointer-run.mjs facts
diff -u .tmp/p1005-deliverable-pointer-20261023-r1/dom-r2/src/client/views/records/records-listbox.tsx packages/dsh-pm-tool/src/client/views/records/records-listbox.tsx
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p1005-deliverable-pointer-run.mjs red-final
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p1005-deliverable-pointer-run.mjs green-final-r1
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p1005-deliverable-pointer-run.mjs green-final-r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p1005-deliverable-pointer-run.mjs facts-r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/plans/2026-10-23-p1005-deliverable-pointer-run.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/plans/2026-10-23-p1005-deliverable-pointer-check.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p1005-deliverable-pointer-run.mjs seal
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p1005-deliverable-pointer-check.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/plans/2026-10-23-p1005-deliverable-pointer-check.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/plans/2026-10-23-p1005-deliverable-pointer-run.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p1005-deliverable-pointer-run.mjs seal-r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p1005-deliverable-pointer-check.mjs r2
```

| 命令/专项 | exit / 结果 |
| --- | --- |
| vendor首次与末次 | 0 / 静态完整性门通过，不是独立验收 |
| node --check、audit、facts | 0 / 语法、1077原件、局部事实提取完成 |
| dom-r1 | 1 / 4绿1红，真实backdrop不闭；保留原 stdout/stderr/receipt |
| dom-r2 | 1 / 5绿2红，D04/D06红；相同生产字节最小化 |
| green-r1、green-r2 | 各0 / 相同test SHA，7/7；直接pointer模型option/button/span/save、trigger、backdrop、false-save及label/div |
| red-final | 1 / 最终test9159字节在冻结原生产listbox上5绿2红，保持必要红 |
| green-final-r1、green-final-r2、facts-r2 | 各0 / 最终test同SHA两轮7/7；事实提取0 |
| affected | 0 / records-options 8、payloads 11、history 3、form-validation 6，共28 |
| unified diff | 1 / 正常表示两文件有差异，不是产品测试失败 |
| seal与两脚本语法 | 0 / 认领delta之外无输入漂移 |
| 首版final-check | 1 / 输入输出SHA相符，但报告自引用当时尚未生成的本检查输出，链接失败；失败收据保留，不是产品FAIL |
| seal-r2、final-check r2 | 0 / 校自有输出SHA、Markdown链接/尾空白；仅延后本轮自引用到写出后核存在，不豁免其他链接；不是独立门 |

各测试轮 sourceDrift=0、声明 dependencyDrift=false。dom-r1和dom-r2的红不删；dom-r1 test 7990字节 SHA见receipt，后加最小对照后 test为表中9124字节，不谎称首轮与最终test同字节。

探索非产品错误：`rg`不可用exit127，随后用find/grep/sed；记忆根/可选CODING_STANDARDS/CONTRIBUTING/GLOSSARY不存在exit1；两次定位公开helper目录失配exit2，随后在公开封包找到真实helper。均不判产品FAIL，不访问缺失引用里的private路径。初次依赖resolve显示主包未直接提供ReactDOM/JSDOM，改用既有widget只读依赖；未安装。广域目录探索仅用于找已存在依赖/公开脚本，随后限定读取，不纳入产品验证。无网络请求。

build/install/noEmit、默认全包verify、GUI/RPC/rawDB回读、旧全B8和其他表单GUI本轮均 **NOT_RUN**，归Main与独立专家；不把35例开发绿冒总门。新DOM test所需ReactDOM/JSDOM不增加包依赖，沿已有DOM测试的独立adapter模式；默认主包直接运行是否有这些依赖本轮未声明可用。

## 6. Main 最小真实 GUI 诊断/复验步骤

下列为原 F02 的新证采集建议，不替专家改用例或签字。Main 先把诊断补证动作与专家原 §5/§7对齐；完整原 B8复验由父另做。

1. Main唯一build绑定新候选（基线+delta+新test SHA、依赖、产物、宿主提交/补丁、PID/port、browser context/target、开关）；本单不使用原PID/port作为当前健康证明。合法fixture承接原实体时核实际p1/dlv1/m1和旧任务/反思原字节；不同实例先合法恢复并读取真实ID，不手拼DB。
2. 在目标 `dialog[aria-label="编辑交付物"]` 内唯一匹配 `#deliverable-status`、accepted的`button[role=option]`及`button[type=submit]`。不要全document文本首匹配。先记录各bbox/scroll/visualViewport/DPR及全部相关祖先的computed transform、position、z-index、pointer-events、overflow。
3. 针对trigger、accepted option与主save分别取实际CSS中心坐标，动作前记录`elementsFromPoint(x,y)`；顶部命中须为对应button或其后代。若被backdrop/其他节点命中，先保留失败与命中栈，不能通过programmatic `.click()`绕过后宣称pointer成功。重取scroll后bbox，不从1500×748帧换算输入坐标。
4. 临时页面级诊断监听capture/bubble的pointerdown/up、mousedown/up、click、focusin/out、submit及got/lostpointercapture，记录target、composedPath、坐标、pointerId、detail、defaultPrevented、activeElement和事件后microtask/animation-frame的expanded/菜单/backdrop；不记录token/认证字段、不改产品源码。由Main自有诊断输出保存并结束后移除监听。
5. 真实pointer打开→真实pointer选accepted→稳定闭合→明确pointer主save。绑定过程帧与DOM链、匹配RPC request/response、可见结果、前后rawDB。若选项后仍开，观察是否有额外trigger click及其原始target：本轮没有证明原option路径发生该事件。
6. 在不触发提交的诊断切片补一次真实pointer重复trigger及一次命中backdrop，核新candidate backdrop不默认激活trigger、零RPC/零写；若指针本来命中backdrop，首击仅关popup，不应自动转为save。随后再明确点主save，不能无依据把首击零RPC定后台FAIL。
7. 对照原round12的Space/ArrowDown/Enter选择与实际focus/Enter save，保存原键盘语义证据；它不代pointer。结束后解绑诊断监听。若无正确命中/真实事件链，保持具体诊断BLOCKED而非MANUAL_PENDING。

## 7. 受影响索引

| 文件/行为 | 旧证据与本轮覆盖 | 接续 |
| --- | --- | --- |
| listbox backdrop 默认激活 | 原round09/10无点击链；本轮D04/D06红→绿，D07div控制 | Main真实命中及专家审证；不覆盖原accepted pointer红 |
| deliverable状态/里程碑、主save | form/normalize/submit未改；D01/D02/D03/D05与28旧专项 | 原pointer目标链需新GUI；原keyboard切片作对照 |
| 共享meeting状态/action、report状态/source/周期listbox | 搜索所得调用点；本改动仅backdrop但共享源码变更，未跑这些GUI/完整旧专项 | Main与专家按文件→用例映射裁受影响重测或继承；不由本开发签整体 |
| overlay、CSS、业务、reflect/L2/P1004 | 没改，没接业务修复或旧证重签 | 不扩大本单；父按实际候选另核 |

## 8. 交付自查

已加载 code-review，按 Standards / Spec 两轴自查。固定点用自有dom-r2冻结输入与baseline SHA，不跑Git；spec为用户本单、专家原 §5/§7和本plan。本轮未启动双review子代理，不冒双独立review，采用本开发顺序双轴自查，偏差写在 [试点](2026-10-23-p1005-deliverable-pointer-pilot.md)。

**Standards：** 唯一生产修改在授权listbox内，明确注释、无全局重构、新抽象或安全/数据写问题。未改form/overlay/共享档案。测试使用公开生产组件，不helpermirror、不private出口；native DOM证据不冒GUI。无新增硬规则违例发现；全包默认test依赖可用性及其他表单GUI是明确未验证边界。

**Spec：** 确证并修局部backdrop红，不给未知option点击根因补代码。**原accepted pointer close/主save完整链仍缺浏览器证据，不能标F02完成**；本delta不是全量修复证明。Main需要按第6节与原专家合同补证后判是否还需限定修复，不接新功能。

## 9. 输入保护与停止

最终 [seal-r2](2026-10-23-p1005-deliverable-pointer-seal-r2.json) 核baseline所有声明输入，只有已认领listbox delta允许变化，且候选/最终test SHA须等green-final-r2实际输入；原1077件与其index、已声明form/overlay/样式/旧专项/协作文档不得漂移。附全部本前缀输出及tmp输入/config/cache/result/observations SHA、新test SHA、diff命令exit。首版seal/final-check保留；检查自引用问题只改自有检查器，不改生产候选。seal自身不自指纹；不声称共享dirty全树或全盘零污染。

本轮只启动有界同步Vitest子进程，均已退出；未持有builder/端口/profile/业务锁，也未停任何服务。seal-r2及 [final-check-r2](2026-10-23-p1005-deliverable-pointer-final-check-r2.json) 完成后释放本子单写面；final-check-r2单独绑定seal-r2 SHA，不自包含其未来输出。**released / STOP。** GUI/PASS/总门及ordinary commit未自签；无push/release。

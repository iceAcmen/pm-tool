# A19 编号反馈修后视觉审证与手动取值诊断

> 2026-10-22，平台 trae，独立测试专家，非开发、GUI 执行端或 builder。供 Main 继续全部未验功能收口。仅写本前缀；本报告判定不等于编号整门、A19 整项、总门或发布通过。

## 1. 独立结论

**GNHD-01 原“成功/失败反馈裁切”在本候选、本次 1440×900 深色场景局部复验 PASS，可关闭该视觉缺陷。手动取值两轮均未成功，不能签整体 PASS；产品与设施归因仍待最小命中对照，不提前开确证产品修复。**

| 对象与原合同 | 独立判定 | 证据与范围 |
| --- | --- | --- |
| GNHD-01 原视觉 FAIL，原审查 §4/7、原合同 §14.4.4/6、14.5 | **PASS_LIMITED / 原裁切已关闭** | 两张 copied 与 denied 真原图全文分别为“已复制”“已复制”“复制失败”；编号 1/2 常驻，反馈位于编号下方，不覆盖标题列。历史“已…”/“复…”原图、FAIL 保留，不倒改旧结论。 |
| §14.4.1/2 两合法编号及布局 | PASS_LIMITED | 同页两行 code=1/2，62px 编号格，原图同时包含表头与标题；反馈 bbox 在编号格水平范围内。标题 bbox 原采集遗漏，不能称全量 bbox 合同已齐。 |
| §14.4.3/4/5 实际 Tab/Enter、系统值、复原 | PASS_LIMITED | 原 runner 真实 Tab 循环核到两个按钮、Enter；两焦点环原图可见，DOM outline 为 solid 2px；pbpaste 严格为 1/2，反馈只在对应行，随后复原。没有用直接 focus、writer mock 或 DOM Range。 |
| §14.4.6 真实权限拒绝、诚实状态与提示 | PASS_LIMITED | Browser.setPermission 真拒绝后等待失败，“复制失败”完整，code=1，title/aria 有手动提示，无假成功。原句要求的新上下文未由此轮 default context 权限切换补齐，不称不同上下文全链通过。 |
| 手动取值尝试 r1 | **失败原证保留 / 不签成功** | 等反馈消失后双击；selected.selection 为空，Meta+C 后 pbpaste 保留 2，不等于目标 1。后截图重新出现失败态，不能与较早 selected 时刻混为一态。 |
| 手动取值尝试 manual-r2 | **失败原证保留 / 归因待诊断** | 失败态与 userSelect=text 在拖选前后均成立；真实 mouse down/move/up 后选区仍空，系统 2≠目标 1。不是超时未等失败，不是 writeText 返回假成功；命中起点存在按钮间隙混杂，尚不能确证产品字形内选取失败。 |
| §14.4.7 既有 AUTO 引用 | PASS_LIMITED / 不重跑 | 原 A19 coverage 的 D-05 所在 15 项、编号反馈 5 项、clipboard 3 项有绿行与 coverage exit0；完整回归范围按既有独立报告和 scope-correction，不扩大静态测试为人工选区 PASS。 |
| 两轮四根内容与 r1 mtime/size | PASS_LIMITED | 已交双清单逐键相等；data 23 文件、files 2 文件、backups/exports 空；r1 另有 17 个目录及 25 文件元数据相等。仅声明根/采证时段，不是正式全资产或整盘零写。 |
| B1-GUI-02 / 编号整体、全部未验功能、发布 | **未签 PASS** | 手动成功未闭；精确产品归因待最小补证，原不同上下文与遗漏 bbox 不补造。没有 MANUAL_PENDING 转换，不新增精确计时、取消计时或全矩阵要求。 |

**判定责任**：上述局部 PASS 与未签事项仅由本独立专家给出；Main 只采证、修复已确证缺陷并引用此报告，不自签整体。本次没有新确证产品缺陷，故不派产品修改，也不把原执行 exit0 改成测试 PASS。

## 2. 授权、方法与范围

本次原句边界：“独立GNHD01修后真实GUI原证审证/手动取值诊断，非开发/GUI”“仅docs/testing/a19-number-visual-retest-review-20261022*+自有tmp”“禁产品/other testing/livingdocs/buildinstall/producttest重跑/GUIservice/privatecredentials/commit”。持续父目标是全部已有未验功能收口，不扩大本专家角色。

只读核对 [AGENTS](../../AGENTS.md)、[collaboration §9/11](../collaboration.md)、[原视觉报告 §4/7](gui-numbers-habit-dark-review-20261021.md)、[结构/AUTO 独立报告](objective-number-independent-retest-20261021.md)与[原合法两编号合同 §14](independent-acceptance-batch1-closure-plan-20261021.md#14-接续审证纠正b1-gui-02-缺-code-前置不可合法构造2026-10-21)。最新共享档案只用于确认多方在途，没有改它们。按具体授权，不 fetch/pull/install/build、不重跑任何产品测试或 vendor verifier，不操作 Main GUI/服务，不进入原脚本所指 private、profile 或凭据路径。

本专家实际目视 9 张原 PNG：native 菜单、initial、两焦点、两 copied、denied、manual-selection、manual-r2 selected；另目视 r1 合成帧 000019.jpg。原 44+3 件 compositor JPEG 全部核 SHA，但没有宣称逐帧全部目视或拥有完整输入事件录像。截图是已交真图，不生成替代图、不删翻译弹窗、不插 DOM Range 来证明人工动作。

[只读 audit](a19-number-visual-retest-review-20261022-audit.mjs)使用 Node 内置 fs/crypto/util，只读取显式公开文件清单及 number-visual 原件；从不 import 产品、测试或 GUI collector。报告为中文通用 Markdown；程序字段是机器可检的证据索引，不自动生成视觉判定。

Vendor 根因路由本轮保持拦截：政策已读，但本派单禁止 producttest 重跑，未运行 verify-external-skills、未置 vendorIntegrityVerified=true、未加载 vendor skill。不能为了形式校验越过本次授权。平台记忆指定路径不可用，判定完全来自仓库和原件。

## 3. A19 候选与真实实例绑定

完整建造/回归范围只引用 [A19 完整回归独立报告](a19-full-regression-evidence-review-20261022.md)与 [candidate-scope-correction](../../reports/all-pending-evidence-20261021/A19/candidate-scope-correction.md)。原 candidate 不覆盖；五旧 probe 只保存与来源绑定，本轮没有执行。声明 531=526 Main 输入+5旧来源；F2/F3/F5 十六件及 Board 夹具另算。453 是最终产物，不是假造构建前后清单。首复制中止、首 coverage FAIL、封候选设施失败及 NOT_CAPTURED 保留。

| 对象 | 原值 / 本次核对 |
| --- | --- |
| baseline，仅基线 | `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`；不能单独代表 dirty 产品 |
| candidate SHA256 | `e6ae8366eeaae4293d4d960cfe4002bf249b10f148aad13f97eecdb28fee25d7`；r1 binding 与原件实算相等 |
| 实际插件输出 | `/private/tmp/pmtool-a19-closure-20261022-r2/packages/dsh-pm-tool`；本专家未进入该树 |
| host-start / ready | 原 PID86987、3249、上游 cwd、pm profile 的原 argv 相符；只读归档，不实时探测或启停 |
| 浏览器 | target `D9157A2EB8596AC74524928D5DC9F5EE`，origin `http://127.0.0.1:3249`，timeOrigin `1792634747265.7`；loaded/r1/native/manual-r2 一致 |
| actual loaded 响应 | 2579410 bytes，SHA `16abba2b181491bb6c70e8c5b8bbaac2c9c8f5babfa721e8adb776a4b4775744`；原 fromDiskCache=false |
| 原记录执行片段 | 1700578 bytes，SHA `812ca14e66af6706dd67c59a9ad3eada79f8311d55fef3201cf8a952406171f1`；按原 first/length 对归档响应复算一致 |
| client.js 产物声明 | SHA `2e1458d744e424cf795af46b652ba723ba14bc680ced53fd3af44a5613665267` 与 loaded.sourceSha 一致；本轮不独立读取 lib 重证 uniqueComplete |
| tasks.tsx / tasks.css | SHA 分别 `c37f046188f763486010e9867117ca90899c4983b09fd163f4d004007f6f2dc1` / `101a5f01bbd77dd8f234bbe2145df143cbc35682841f8317f5f18d8247d961b4`；当前静态字节与 A19 sourceHashes 一致 |

早期 environment.json 指未启动、后来中止的非 r2 skeleton；不能拿它覆盖实际 host-start 与 r2-runtime-binding。历史 objective-number 报告的 tasks/CSS hash 与 A19 并不完全相同，本报告不以旧报告自动签当前全文件；仅核本接缝仍为原编号常驻、按钮旁独立反馈、1600ms timer，并引用当前 A19 原完整 coverage。

### 3.1 同 origin 菜单100%

[原菜单图](../../reports/all-pending-evidence-20261021/A19/number-visual/native/menu100-original.png)实际可见 3249、Chrome 菜单100%，还可见翻译 popup。receipt 原时刻 `2026-10-22 10:21:16 +0800`，早于 r1 initial `02:21:51.449Z`，同 target/origin/timeOrigin。可以作为本次同页100%前置的有限证据，不能用它倒签昨日3205/3213或更早 loaded/seed画面的缩放。

原图包含菜单与 popup 是事实，不裁除后伪装干净原图；中间 AX 查询没有完整持久化，不能重建为原日志。r1 CSS viewport=1440×900、PM=1160×900、bodyWidth=1440；manual-r2 dpr=2，而 r1 采样 dpr=1，CSS viewport仍1440×900。dpr 和 screencast 的720×450 metadata不是原生200%文字缩放证明。原外窗高度857与 CSS高度900分别保留，不说截图就是完整可见外窗，不据此新增产品FAIL。

## 4. 修后视觉、复制与保护

两 copied 原图分别可见绿色完整“已复制”，denied 原图可见完整黄色“复制失败”。反馈 bbox x601/right647，在 code-cell x593/right655 的62px内；原值单独保持1/2。实际目视任务标题起于相邻列，不与反馈重叠。原 state 的 taskBBox 查询对 `.pt-code` 的 parent 使用直接 `.pt-task`，该结构不命中，字段被 JSON 省略；不把“未捕获”写成零宽、不造 bbox，不因此推翻原图证明的局部无覆盖。

r1 成功采样 `02:21:52.197Z` / `02:21:53.798Z`，系统值1/2；复原 `02:21:53.649Z` / `02:21:55.365Z`。elapsedObserved 1740.2/1625.1ms 包含动作/等待与采证开销，不作为精确 timer偏差 FAIL。生产 timer=1600、当前原 AUTO 的1599/1600ms合同绿、GUI实际复原三层分开；约1.6秒原要求无需加新精度门。

r1 两个复制前均实际 Tab 到目标且核 activeElement；原图蓝色焦点环完整，copied 的 outline均 solid2px。Enter不打开行，不保存业务；第二行反馈出现时第一行已复原，系统值没有串行。拒绝权限后真实按钮 click，waitForFunction等“复制失败”再采，而非早采样误判。

双四根 manifest 每键相同：data23、files2、backups0、exports0；r1 before/after metadata 的25文件与17目录 size/mtime相同。r2只交内容清单，没有交自身 mtime双清单，不写成两轮mtime都已独立核。r1 execute requests与command/run/done事件均空，只覆盖实际collector监听范围；不泛化为所有网络或正式运行根全盘保护。本专家没有读取真实业务根，原图/归档manifest的范围不能升级为实际全库现场复算。

当前 A19 原 coverage 行：`d04-d05-d11-contract.test.ts`15项（含 D-05 的5条）、`tasks-number-feedback.test.tsx`5项、`tasks-clipboard.test.ts`3项，coverage原 exit0。本轮只读日志、不重跑旧code/clipboard；D-05 fallback仍是防御性静态组件合同，原§14已撤销非法无code GUI前置，不再要求重注入。

## 5. 手动取值失败与机制反证

### 5.1 两轮不能互相洗绿

| 轮次 | 原实际步骤与观测 | 判断 |
| --- | --- | --- |
| r1 | hover后 wait无feedback，字形中点双击，立刻 selected采样 `02:21:57.017Z`为“1/2”、selection空；Meta+C/pbpaste为2；随后manual-selection.png又出现“复制失败” | 失败态特例CSS已经退回，双击可能重新调用copyHandle触发新异步失败。较晚截图与较早selected不能拼成“失败态双击成功/已测试字形内失败态”的证据。 |
| manual-r2 | failed `02:24:40.859Z`、selected `02:24:40.955Z`，两者都是失败态、userSelect=text；从 x614.625,y594.81640625 mouse-down，5步拖至x606 mouse-up，Meta+C，clipboard2≠expected1 | 真拖选/系统取值失败成立，但起点在 value bbox右界613.625之外1px，落在按钮4px间隙方向；不是字形内启动选择的对照。没有保存原mousedown hit target或普通文本对照，产品与设施不能唯一归因。 |

两个原 exit.json 为0仅表示runner到末尾，不对selection或matches断言成功。r1 selected之后的较晚截图和原frame也能显示新失败态，但不证明此前存在选区；manual-r2原result明确matches=false。不能用系统保2证明“复制编号1失败时系统回写错误2”，它是上一行正常复制的残值。

### 5.2 Chrome 是否阻止button选择

已冻结产品结构：[tasks.tsx 331–355](../../packages/dsh-pm-tool/src/client/views/tasks.tsx#L331-L355)中 `.pt-code-val`仍在真实button内；[tasks.css 213–240](../../packages/dsh-pm-tool/src/client/views/tasks.css#L213-L240)只在 `.failed .pt-code-val`加 `user-select:text`。button有gap4px、hidden/ellipsis；feedback是button外的status，不是独立原编号取值控件。该结构与归档真实DOM观测一致。

公开 Chromium 原源码核对到 commit `9934a79cf7767f9499034385822697008a5c11b0`（2026-10-22T02:23:07Z），是机制参考，**不是本机Chrome实际二进制版本认领**：

1. [HTMLButtonElement::CanStartSelection](https://github.com/chromium/chromium/blob/9934a79cf7767f9499034385822697008a5c11b0/third_party/blink/renderer/core/html/forms/html_button_element.h#L112)无条件返回false。因此从按钮本身/其间隙启动选择存在拒绝路径。
2. [Node::CanStartSelection](https://github.com/chromium/chromium/blob/9934a79cf7767f9499034385822697008a5c11b0/third_party/blink/renderer/core/dom/node.cc#L2016-L2041)在非draggable、usedUserSelect=text/all的子树可以直接返回true，之后才递归parent。这是对“button里面文字永远不可选，子span设text也无效”的明确反证。
3. [SelectionController::CanMouseDownStartSelect](https://github.com/chromium/chromium/blob/9934a79cf7767f9499034385822697008a5c11b0/third_party/blink/renderer/core/editing/selection_controller.cc#L122-L130)检查命中node的CanStartSelection，HandleMousePressEvent用InnerNode设置是否允许开始选取。计算样式text不等于原mousedown命中text子节点。

**归因裁决**：已有真用户动作取值失败；r1执行时态与failed特例不匹配，r2拖选起点是button间隙，设施混杂明确存在；只凭这两件不能签“产品可用”，也不能确证“button子span字形内选择被Chrome一律阻断”。最可能的可解释路径是命中button而非text子树，但原命中日志与本机版本缺件，仍属待证推断，不指定开发修复。生产行onPointerDown对button等交互目标不会focusRow，未看到它 preventDefault选择的静态依据；不据此排除全部宿主事件影响。

## 6. 交 Main 的最小诊断合同

**这是既有手动取值缺口的先行诊断，不是产品开发派单；本专家没有执行下面动作。** 保留原退出、失败帧、87原件和候选，禁止往DOM插Range、修改user-select/class/React props/业务JSON、替换writer、伪造选区或改系统权限来洗绿。不增加取消计时精度/200%矩阵，不重跑旧code/clipboard。

| ID | Main最小动作与原件 | 可区分的结论 |
| --- | --- | --- |
| GNHD-MAN-D01 | 同已冻结候选/3249页，真拒绝复制并等失败；观测失败class、code、value bbox、userSelect、可见frame/timeOrigin。本次从**字形bbox内部中点**真实双击或拖选到字形另一侧，Meta+C后pbpaste；记录动作前后selection。可用只读elementFromPoint/事件target观察命中，不调用focus/selection API写入 | 失败态、字形内真实命中且2仍不等1，才排除原r1时态与r2间隙混杂；不能以DOM/text样式代替实际选区和系统值 |
| GNHD-MAN-D02 | 同页选择一个现有、按钮外、非输入/无交互动作的普通可见文本片段作**真实鼠标选择+Meta+C+pbpaste**控制；记录原文本/选区/系统值，不新插fixture、不触发产品提交 | 普通文本成功而目标失败支持产品接缝缺陷；两者皆失败先查设施/焦点/原生复制，不给产品豁免 |
| GNHD-MAN-D03 | 若可读取公开版本信息，保存本机Chrome版本及target/origin/timeOrigin，不读取profile/private/凭据。只取必要目标命中/输入事件时点和原帧，不要求重采整47帧或全页矩阵 | 把参考Chromium机制与当时真实版本/命中连上；缺件明确保留，不靠最新源码倒认历史二进制 |

停止条件：若失败态在真正mousedown前已消失，该次只记未覆盖，再按原按钮真实动作取失败态；**不改变1600ms时长、不新增计时验收门**。若普通文本控制失败，先交设施诊断，不改产品。若目标成功，仅可关闭本手动分支，不能自动补签原不同上下文与遗漏bbox或其他功能。

**仅在D01失败、D02控制成功且原候选/命中/失败态连续性成立后**，独立专家可另开 `GNHD-MAN-01 / P2` 产品缺陷。届时必要先行红就是上述目标字形内原生选择取值失败，控制是普通文本可复制与既有两合法编号正常按钮复制、全文反馈、复原和四根零写；开发只修编号人工取值接缝和必要同域测试，不改模型/schema/计时/任务列，不由本专家自改产品再验。当前不声称这项确证红已运行，也不把未来控制合同写成PASS。

原§14.3的新拒绝上下文、14.4.2标题bbox如Main已保存则优先交已存片段，不为补完整门强行全量重采；不能以本次default-context权限切换倒签“另一个上下文”。这只是列原合同未覆盖边界，不新增门。

## 7. 原件指纹、检查与释放

[Main index](../../reports/all-pending-evidence-20261021/A19/number-visual/index.json)恰87件原件（另有index自身），本专家对87件逐SHA/bytes实算全部一致；[result](a19-number-visual-retest-review-20261022-result.json)保留完整87键。index SHA为 `8dda28819fc76d0424ee42cc30242421ef5e6846b8aaee0d1b89ba2a13bfad67`。

| 关键原件 | SHA256 |
| --- | --- |
| native/menu100-original.png | `158b07c1c395563aecfd9d6fbd5a0cc44a12e69577528c3955504615096546bc` |
| r1 copied-0.png / copied-1.png | `46fb465b65ef4f2fd2a7a04d8f57df904c94c68e91d64f027ba3b77cc183ae2a` / `723b0b55031a9e6bd4328b385d7a161ced4f5e1beed0487cc5691005d5f5d81b` |
| r1 denied.png | `eab8f96c38453fa445527e9cd477802aca72794c1248b14f46506b6418abba67` |
| r1 copied-results.json | `21fe4f397e547be7c839414367e5161622be8fe49997da13581c5f58b906c994` |
| r1 manual-selection.json | `92034894e4263dfaf6c4809a7f1b836de93f0c6e679292b0d8f321f4618fbcfa` |
| manual-r2 result.json | `4fc8b06cc1fa44a0b6d3fbd8531b7c8346d04b8f46cf9ef0845916aa5369f427` |
| r1 before/after roots（相同） | `73b5372bdce8b6716919ee8a86885d5ab491304146a6424aedb77a61a2a20f48` |
| r1 before/after metadata（相同） | `a9bad2d55086e740eb9504bd2e105abc8d2e6181e6430e80965f9dd67eae6b7d` |

本轮实际环境macOS/darwin arm64、Node v22.23.3；pnpm11.28.5仅引用原A19执行环境，本专家未运行pnpm。自有命令均仓库根执行，只审文件；capture以110条精确公开路径记录SHA/bytes/mtimeNs/inode，起点是capture时刻，**不追溯声称此前全部阅读已有mtime保护**。新文件仅本报告、audit、before、result、seal五件，没有自有GUI/服务/tmp运行根。

```sh
cd /Users/bytedance/Projects/dsh-pm/pm-tool
env -i PATH=/usr/bin:/bin NODE_DISABLE_COMPILE_CACHE=1 /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/a19-number-visual-retest-review-20261022-audit.mjs
env -i PATH=/usr/bin:/bin NODE_DISABLE_COMPILE_CACHE=1 /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a19-number-visual-retest-review-20261022-audit.mjs capture
env -i PATH=/usr/bin:/bin NODE_DISABLE_COMPILE_CACHE=1 /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a19-number-visual-retest-review-20261022-audit.mjs audit
git diff --check -- 'docs/testing/a19-number-visual-retest-review-20261022*'
env -i PATH=/usr/bin:/bin NODE_DISABLE_COMPILE_CACHE=1 /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a19-number-visual-retest-review-20261022-audit.mjs seal
```

语法、capture、audit实际exit0，audit17项一致；它的0表示审计完成，**手动失败被如实保存**，不代表手动或整门PASS。git差异格式与seal最终退出/110路径漂移/集合及Markdown链接检查见[seal](a19-number-visual-retest-review-20261022-seal.json)，不会通过改期望消除漂移。公开Chromium源码使用只读WebFetch/curl核机制，无下载执行或安装；一次WebFetch头文件返回空，改curl成功，原错误不当产品FAIL。rg不可用，使用find/grep，不安装工具。

**本角色审证完成、资源释放、STOP。** 没有产品测试/构建/GUI/服务器或后台审计进程在运行，不触碰或停止Main PID86987、浏览器29351或正式实例，未改产品/他人testing/livingdocs/原件/privatecredentials，未commit/push。Main可沿本局部关闭和最小诊断继续已授权收口；本报告不宣布全部功能完成。

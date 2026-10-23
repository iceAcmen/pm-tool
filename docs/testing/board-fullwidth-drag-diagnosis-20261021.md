# B1-GUI-01 全宽卡首次拖动独立诊断

> 2026-10-21，trae，独立诊断/测试审证专家。给 Main 开发与采证端使用：审新三态原证，区分目标未达与确证布局异常，并交有界修复合同；不是修复、整门验收或发布批准。

## 1. 有限结论

| 对象 | 结论 | 边界 |
| --- | --- | --- |
| 首次真实指针拖动后顶部大洞、整组下推 | **有限 FAIL，B1-FW-01** | 六卡从连续17行变成顶部空12行、占至29行；松手后仍保持，截图与 DOM/实测高度一致。失败对象是本轮编辑画面，不冒称落盘坐标错误。 |
| “A 从首行到实际 D 下方” | **未达到，不能签已执行** | A 到了初始 D 底所在 row12；但松手前实际 D 已被推至 row22..24，A 仍在 D 上方。静态目标行不等于实际相对目标。 |
| 合法 fixture / 首次 mouse grab | **有效，有明确覆盖边界** | 六卡 type、下限、空默认配置与生产目录相符；重进初态显示全宽/连续/无相交。首拖真实输入命中、576px移动且产生 placeholder；不是点到不能拖的控件。缺完整导出与视频，不升级为整个前置门 PASS。 |
| 生产逻辑根因 | **两个机制复现；历史会话内部草稿待补证** | RGL `compactType=null` 保序碰撞下推；产品松手压实结果恰等于初始布局，RGL 的同值 props 检查不采用它，内部下推态可继续显示。生产方法复现与原证一致，未观测该 GUI 会话 React draft。 |
| 第二/第三拖、三撤销、后续保存/取消 | **未取得执行原证** | 只有 `drag0/drop1/drag1` 三态。第二拖目标离屏中止来自父单补充事实与源脚本防护；没有错误日志可核精确离屏坐标，不编造三次已执行。 |
| B1-GUI-01 完整门 / 当前全包放行 | **BLOCKED，且上述 FAIL 未关闭** | 缺完整原动作、录像、草稿导出、保存/取消窗口保护及历史会话下发绑定；截图和纯函数不能合成整门 PASS。Launcher A5 不在本单对象内，可由原 owner 继续同时审。 |

旧 [A0 原证审查](a0-gui-raw-review-20261021.md) 的 r3 八卡局部结果不被抹除。本次是后来新六卡原证，有限 FAIL 不追改旧报告“当次未见确证产品 FAIL”的历史结论，也不沿用旧八卡 PASS 给新种子签字。

## 2. 父单与授权边界

负责人原句保留：“独立诊断B1-GUI-01全宽fixture新确证观察，只写docs/testing/board-fullwidth-drag-diagnosis-20261021*及自有tmp，禁止改产品/他人testing/living docs/build/install/共享lib/启服务/private/凭据/MainGUI/commit。父持续分工授权。”

另保留判定要求：“区分未达到A-D目标动作 vs 确证实际大洞/下推缺陷”“原fixturefullwidth/mousegrab是否有效”“不能改原动作或把截图无录屏扩成整门PASS”“该源Main从未改，A0插件453不变；LauncherA5无影响可继续同时审。”

按该限定授权，仅新增本前缀报告、检查器、结果 JSON。无产品/其他专家文档/living docs 改动，无 pull、install、产品 build、共享 lib 写入、启停服务、GUI/浏览器操作、凭据读取、commit/push。只读 `/tmp/pmtool-board-original-drag-20261021.mjs` 这份指定设施源码，**未执行，也未读取其导入的 GUI helper 或指向的私有 runtime/数据**。报告所称 runtime/PID 均来自仓内 A0 声明，不是现场探测。

依据为 `AGENTS.md`、`collaboration.md` §9/§11，以及 [原收口计划 §5](independent-acceptance-batch1-closure-plan-20261021.md#5-b1-gui-01-看板连续拖动)、[fixture 澄清](board-fixture-clarification-20261021.md) 和 [A0 actual 差异审查](a0-gui-raw-review-20261021.md#42-actual-不替换原句)。不引入待表决设计矩阵，不接手 Launcher/Finder。

方法采用原证复算、截图独立目视、生产纯函数/已安装依赖方法的隔离调用。TypeScript 仅在内存擦除类型后求值四个无副作用模块；无编译文件输出、无产品构建或 React/DOM 挂载。依赖方法实验不是新 GUI 执行，反事实坐标不写进 Main 原证。

## 3. 原证与候选绑定

原证根：`reports/all-pending-evidence-20261021/A5/board/`。

| 原件 | sha256 | 使用 |
| --- | --- | --- |
| [original-drag-states.json](../../reports/all-pending-evidence-20261021/A5/board/original-drag-states.json) | `0e7076935543cb6b88c31b029fb3ef93a062b99853ad79d6b57330c63925af04` | 三态 bbox/transform、实测高度、指针记录 |
| [fixture-import.json](../../reports/all-pending-evidence-20261021/A5/board/fixture-import.json) | `d0f1b393681a2af07c8a80363f3168c1e71e20d447736a0c7dddeb81615c5c9d` | 标准导入/保存/重进声明及7项数据指纹 |
| [专家 fixture](board-fixture-clarification-20261021-fixture.json) | `41c91b49024270667b5a43e2f927bc43c478b8b69384c95b157aa01643176b87` | 六卡身份、完整合法尺寸/config |
| Main 指定 `/tmp/…original-drag…mjs` | `9f30bd0175eb4c6a22ad106188856880efc684df5690e0296ab5c15c1184d30f` | 检查真实输入调用、guard、截图时点；未执行 |

三张拖动 PNG 已逐张目视，尺寸均1440×900，hash 完整保存在 [result](board-fullwidth-drag-diagnosis-20261021-result.json)。初态六卡连续；drop 帧有占位与拖动卡；松手帧顶部大面积空白，只有 A 在当前屏幕底部可见。未从截图推断屏外卡丢失，JSON仍有六个相同 ID。

候选引用：文档基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，产品基线 `2a7603023bc54ef13d788e50069ee3fde4671bf3` 加原 A0 未提交候选。A0 candidate hash `2b6265bd1953c186f553d4092fa98ff87f2a14480a82e04383cc63255e0de071`，version0.7.4；声明宿主 `1142fb74f2bbcc54dc9499054c0448c9b876cbf2`、3205/PID27767，不将 HEAD 代替 dirty 候选。

本次只读复核的关键源：

| 文件 | sha256 |
| --- | --- |
| `editor.tsx` | `5ddf057cf5bb0eab59dbb31233b59c586959705f452b56f59bc88d8a885cf6f8` |
| `editor-ops.ts` | `ade6c08dd648dc02cb6813c89d159e59116052e0d3701eabd3cef414e7d06601` |
| `projection.ts` | `622977c899038d7c95b36b27673d879051c996d380e12b6a17e6630ac0794555` |
| `persist.ts` | `0a34fdf50f930b2ab794edba65c67ff2ed1448b86495fc3884534d2b06f3ffa5` |

检查器将11个相关源码/现有测试文件逐一与 A0 `final-build-proof.json.after.sources` 比较，全部相同；`editor.tsx`/ops/widgets 亦与 fixture 澄清记录相同。主树 board 无 tracked diff。A0 归档 proof 的364源/453产物完整键集及 hash 前后相同，`all-built-files.json` 仍有453项。**本轮没有重新读取私有隔离树或现场453产物，不把归档相等说成再次现场核验。** 原 bundle 声明仍为 editor `e2e6d960…94b2d57`、主 client `5ae7808c…9ec`，无本专家引入的产物变化。

本轮新 GUI 会话没有实际下发 bundle、浏览器版本/原生100%菜单与当前开关的新增绑定。缺口影响完整门与“历史会话内部根因已现场证明”的表述，不否认三态原证中的可见异常。Launcher 当前认领和 A5 变更不转为看板源码改动或放行依据。

## 4. 三态独立复算

固定 A=`w-hero`，B=`w-ms-deliver`，C=`w-scale`，D=`w-obj`，E=`w-load`，F=`w-risk`。三态 x 均为0，w均为12，h依次6/2/2/2/2/3。坐标用真实 transform 的平移量及 grid-relative bbox 双重复算：`y=(translateY-12)/48`；宽936px符合960px、12列、内padding12的 RGL 公式。

| 状态 / UTC | A/B/C/D/E/F 的显示网格 y | max(y+h) | 顶洞 | grid / stage scrollHeight |
| --- | --- | --- | --- | --- |
| drag0 / 12:55:11.409Z | 0 / 6 / 8 / 10 / 12 / 14 | 17 | 无 | 828 / 856px |
| drop1 / 12:55:12.869Z | 12 / 18 / 20 / 22 / 24 / 26 | 29 | `[0,12)` | 1404 / 1432px |
| drag1 / 12:55:13.409Z | 12 / 18 / 20 / 22 / 24 / 26 | 29 | `[0,12)` | 1404 / 1432px |

这里是 **RGL 显示网格坐标**，不是已导出的 canonical JSON。松手后的真实 draft 未采到，不替它造值。

三态都有六卡、零二维相交。初态撤销字段 `true` 的语义是 **disabled=true**；drop/drag1 的 `false` 是按钮已可用，不误判成不能撤销。实际撤销未执行。

grid bbox 高度也分别为828/1404/1404px；stage bbox 高度为861/1437/1437px。两种高度不是一个字段，不能把 stageHeight 写成1432px。实际 stage scrollHeight 比 grid 高28px，符合原 padding8+20；bbox又多5px，原证未采 computed box/scrollbar，不进一步归因。

grid 高度与末卡底行符合 `48*maxBottomRow+12`，没有额外巨型尾部 spacer 证据。**问题是整组上方空洞与全组额外576px，不是“grid 高度算错”或底部无界空区。** `.pm-shell.scrollTop` 三态都是377.5，scrollHeight1277→1853（+576）；滚动偏移未变，排除用视口滚动假象解释该纵向变化。横向发生16px内滚不改变 y。

松手前后记录相隔540ms；源脚本在 mouseup 后等待 dragging class 消失并再等270ms，松手帧无 placeholder。支持“不是仅按住时的瞬时预览”，但只证明这一稳定采样点，不声称长期多次采样或录像全过程。

## 5. fixture 与动作分别判定

### 5.1 fixture 合法，不是下限造假

生产 `widgets.tsx` 描述符 AST 与附件6/6相符：A min3×6、B4×2、C3×2、D3×2、E4×2、F3×3，空默认 config合法。`parseLayout` 和 `sanitizeLayout` 对附件不跳卡、不夹紧、不下沉。全部 ID唯一，六卡相邻覆盖17行，未加 spacer 或非法业务字段。

标准UI路径由 `fixture-import.json.boundary` 声明，并与重进/drag0矩阵相符。该文件中 `draft` 的窄宽/旧高 bbox 未带稳定时点，和其后 `state` 全宽矩阵不同；**不将过渡 draft 当初态，也不因这一过渡数组判附件非法**。没有新导出文件核隐藏的 min/config，相关完整回读仍未覆盖。

导入 before/after7个文件键集相同，无新增/删除，仅 `/pmtool/settings/dashboard_user.json` hash变；其他项目/tasks/session/workspace6项不变。这是**已列7项、该初始化窗口**的有限保护事实，不扩为所有资产/backup/export、三拖或取消零写。未完成的 `original-drag-boundary.json` 不存在，不能继承脚本末尾未执行的保护清单。

### 5.2 grab 有效，目标参照没有完成

脚本先 `scrollIntoView`，再抓实际卡 bbox 的 `x+100/y+22`，调用 `mouse.down`、30步 `mouse.move`、采drop、`mouse.up`。start `(634,58.828125)`，destination `(634,634.828125)`，都在可见视口内；纵移576px。A实际顶从36.828125到612.828125，首拖确实命中并移动。标题边缘不是 ×/缩放柄，观察与 `.pm-rgl-item-wrap` 拖柄链一致；本轮没有证据把 mousegrab 无效作为主因。

| 判断 | 原证值 | 结论 |
| --- | --- | --- |
| 初始 D 底 | 600.828125px | A目标顶612.828125px已越过初始 D 底 |
| drop帧实际 D 底 | 1176.828125px | D已经下推，不再是原屏幕位置 |
| drop帧 A 顶 | 612.828125px | 在实际 D 上方，差564px |
| drop placeholder 顶 | 564.828125px，row11 | 同样没到实际 D 下方，且比 A实际顶落后一行 |
| 松手显示顺序 | A→B→C→D→E→F | A仍排在D前，原相对目标和“之后返回”前提均未达 |

RGL `onDrag` 在 move 前构造 placeholder，解释了占位落后一行的可能机制；源与原值相符，但无逐mousemove日志，不把它写成已全程跟踪。不能只凭 `targetRow:12` 声称 placeholder也已到row12。

**对前澄清的有限纠正：** 全宽确实消除了横向空带，但 [fixture 澄清 §2/§4.1](board-fixture-clarification-20261021.md) 的“不会压回首行”和“A可在D下方压实”不能作为此运行链的保证。碰撞使 A仍是最小y卡，压实整组会还原初态，A可以回首行。附件本身合法；应修复布局行为/同步，不用换卡宽、减高度、扩大视口、数字输入或任意delta来绕过。

第二拖函数的 guard 位于 `mouse.down` **之后**、目标 `mouse.move` **之前**，异常时 finally 只有 disconnect，没有显式 mouseup。保留这一设施风险给 Main：后续恢复须按其当前真实按钮状态安全处理，不自动接续、不假称第二拖已落位；本专家没有操作其 GUI。是否实际残留按下状态没有本轮后续原证，不能定案。

## 6. 生产链与可反驳诊断

### 6.1 真实接线

- [editor.tsx:480-490](../../packages/dsh-pm-tool/src/client/board/editor.tsx#L480-L490)：RGL `compactType={null}`；start入一次历史；stop用 `reverseFromBreakpoint` 后 `compactVertical` 写draft。**已经调用压实，不是漏加调用。**
- [editor-ops.ts:137-161](../../packages/dsh-pm-tool/src/client/board/editor-ops.ts#L137-L161)：按输入y稳定升序，从0找无碰撞位置；不会重建鼠标相对 D 的插入意图。
- [projection.ts](../../packages/dsh-pm-tool/src/client/board/projection.ts)：编辑 activeCols固定12，正反投影直接复制x/y/w/h；没有这轮窄断点缩放原因。
- [persist.ts](../../packages/dsh-pm-tool/src/client/board/persist.ts)：parse/clamp/碰撞下沉，**没有对无碰撞空洞向上压实**。把这个方法叫 vertical compact 的注释不等于实际 gravity-up 行为。
- [BoardBento.tsx:280-309](../../packages/dsh-pm-tool/src/client/board/BoardBento.tsx#L280-L309)：UI导入只改草稿；显式保存才走 `activeScope=user` 持久化与快照确认。这次首拖未保存，没有证据指向存储造成当次画面下推。

只读已安装 `react-grid-layout@1.4.4`：`lib/ReactGridLayout.jsx` onDrag/stop、getDerivedStateFromProps；`lib/utils.js` moveElement/compact/compactItem/sortLayoutItems；`lib/GridItem.jsx` 指针位置换算；实验调用对应 `build/*.js` **现存依赖文件**，不是写/构建共享插件 lib。

### 6.2 假设与实验结果

| 假设 / 可证伪预测 | 本轮实验与反证 | 诊断 |
| --- | --- | --- |
| H1：null compact、输入顺序下推；逐步移动会得到原证六y | 调实际 utils，对初态A逐行1..12执行moveElement+compact(null)，终态精确为12/18/20/22/24/26 | **复现**。null禁止向上重力，不禁止碰撞下沉；输入数组A在最前。 |
| H2：压实值回到初态，同值props导致内部态未同步 | 调实际 reverse+compact得到0/6/8/10/12/14，全部widgets等于附件。activeDrag=null时调实际RGL getDerived，返回null，内部布局仍是下推态 | **机制复现**，不是只假设mouseup先后。换成新对象但同值仍null；仅改变一个y，立即采用新props。 |
| H3：compactVertical自己不能消洞 | 对原证矩阵调用生产函数，洞消失；fresh synchronize也得初态 | **本例反驳**。不能据此全面证明其他种子、单卡或所有算法性质。 |
| H4：parse/persist/projection造成首拖远推 | 12列reverse无缩放；parse+sanitize紧凑结果不变，原下推无碰撞结果则保留洞；首拖根本未保存 | **本例不支持存储归因**；存储也不会事后替UI消洞。 |

RGL 的关键条件在 `ReactGridLayout.jsx:150-172`：比较 **nextProps.layout 与 prevState.propsLayout**，不是比较 nextProps.layout 与已经变化的内部 state.layout。children判断看 key/data-grid，产品六卡key未换。因此“setDraft创建新对象”不足以保证它重新采用布局。`onDragStop` 先回调产品，再设置内部`layout:newLayout, activeDrag:null`；同值归一结果就可能与内部旧下推态分离。

该链无需把 React batching 或时序竞态当唯一原因：实验在 activeDrag已清空时仍返回null。不过**没有真实会话drop后导出、draft/RGL内部快照或回调日志**，所以“该GUI已发生canonical=初态、DOM=下推态”目前是强支持解释，不是现场原证事实。最小补件是保留当前态时的标准草稿导出/相关已保存日志，不要求先重做三拖或重建插件。

两卡最小实验亦复现：A高6/B高2，逐步向下拖A得到12/18，产品压实回0/6。反证：直接单步把A设row12、B仍row6时，它们不相交，null compact得到12/6，不复现链式下推。**不能用一次applyGeometry、手造最终布局或仅测compact，代替多帧生产拖动接缝。**

仅用于分辨机制的反事实：同种子/同逐行目标，将依赖 compactType改为vertical，终态为A11/B0/C2/D4/E6/F8，总17行且A确在D下方。未改产品、未GUI执行、未推荐将这些坐标冻结为唯一验收值，也不表示“直接改为vertical”已通过被动显示/导入/撤销回归。

## 7. 最小修复合同与测试前置

此节是交开发的方案/验收约束，不授权本专家改产品。Main另批确认文件级方案并由测试专家先冻结测试，再实现；B1-FW-01 未关闭前，不进入该功能发布。

### 7.1 两项都要修

1. **拖动意图与碰撞排序：** 针对实际移至D下方的A，稳定布局应保留A在D之后；碰撞处理不能让A始终排第一、所有邻卡不断逃到其下方。依据真实 oldLayout/oldItem/newItem/目标，或经验证的RGL垂直策略实现；最终允许垂直填洞，不硬锁row12。
2. **提交后显示与canonical一致：** 无论最终草稿与操作前相同还是不同，RGL稳定显示都必须采用它，网格高度跟随；不得保留内部下推态。单纯再调用compact、克隆同值对象、加延时、改为被动onLayoutChange回写，都不是本例充分修复。

固定保护：不删卡、不改ID/type/config/minW/minH/w/h；不做全局重新排版；不改持久化/schema/宿主/依赖版本；不靠夹低卡高、缩小宽度或扩大视口通过。每个显式拖/缩放只入一次撤销历史，被动宽度/面板变化不能新增历史或回写canonical。只修同步但A回首行，也不能算原动作已通过。

### 7.2 文件级建议

| 文件 | 建议范围 | 必要性 / 验证 |
| --- | --- | --- |
| `src/client/board/editor.tsx` | dragStop/resizeStop与RGL受控布局同步，保持显式提交边界 | 正是本例接线；不改保存路由、不使用被动回写兜底 |
| `src/client/board/editor-ops.ts` | 仅当需要抽出显式拖动提交/意图解析时新增小纯函数；不要重写通用compact或arrange | 能直接锁住旧布局+多帧next+目标的关系 |
| `src/client/board/editor-drag-stop.test.tsx`（开发待确认新文件） | 真实BoardEditor+RGL的组件接缝测试 | 必须观察props/draft、RGL显示、一次历史，而非只调用替代模型 |
| `src/client/board/editor-ops.test.ts` / `editor-compact.test.ts` | 添加六卡原种子与两卡多帧最小回归 | 保留原完整fixture，不将任意单卡x变化当原三拖覆盖 |

`persist.ts`、`projection.ts`、`board.css`、dashboard命令目前无必要修改证据。若修复方案确需动它们，先给新增影响与测试理由，不顺手扩范围。现有compact测试侧重删除填洞/已紧凑恒等；snapshot测试覆盖oldItem/撤销纯数据，不覆盖RGL同值props重同步。不能仅增加同级纯测试后宣布GUI修复完成。

### 7.3 实现前冻结的测试

| 编号 | 类型 / 前置 | 必须观测 |
| --- | --- | --- |
| FW-T01 | AUTO，现有RGL1.4.4+生产组件；原六卡连续fixture | 多次move的原路径，松手后顶部不留12行洞，卡数/身份/尺寸/config不变、零相交、稳定画面=草稿 |
| FW-T02 | AUTO，同值归一分支；先让内部layout变化，再提交与旧props相同的合法布局 | 同值与不同值分支均同步；不能靠新对象引用蒙混；关联高度正确 |
| FW-T03 | AUTO，连续显式拖/缩放与三次undo；包含被动ResizeObserver/开关面板 | 每动作一次历史，逆序恢复，末态undo disabled；被动变化不写草稿/历史 |
| FW-T04 | GUI，原附件经标准UI导入/save/重进，原1440×900/浅/100% | 原A→实际D下方、B→初始A区、同A返回上半区；drop相对目标与最终布局分别采；连续录像可见，不以任意三delta替代 |
| FW-T05 | GUI/集成，FW-T04后原两拖保存、另拖取消 | 导出草稿=显示；保存重进/后端同dashboard一致；取消不落盘；逐窗口全写根保护白名单 |

FW-T01/T02须先出现与本缺陷相符的红结果，再修复转绿；其最终断言由选定修复接缝落实。本诊断检查器是旧机制诊断工具，**不是可直接给所有editor修复转绿的回归测试**。

Main补采仍须按原澄清记录实际D底、A/placeholder顶、pointer buttons与滚动祖先；目标离屏时用原获准真实滚动/指针方法，设施异常先安全收尾，不改原动作。在现有异常态能补只读export时先补，不能为补一个值而操作本专家无权控制的MainGUI。

修复后只由唯一builder或隔离输出构建并重新认领变动接缝/产物，开发执行受影响测试和全部当前verify；专家独立复验。无变化Launcher A5无需因本单重建或重采；其独立门不由这里签字。

## 8. 验证记录、限制与交接

工具环境 macOS/darwin arm64，Node22.23.3，已安装TypeScript5.9.3，RGL1.4.4；pnpm11.28.5是合同口径，**本专家未运行pnpm**。检查器使用已有Node内置API和已有依赖，无安装。

```sh
cd /Users/bytedance/Projects/dsh-pm/pm-tool
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node packages/dsh-pm-tool/scripts/verify-external-skills.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/board-fullwidth-drag-diagnosis-20261021-check.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/board-fullwidth-drag-diagnosis-20261021-check.mjs --output
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/board-fullwidth-drag-diagnosis-20261021-check.mjs --red
git diff --check -- 'docs/testing/board-fullwidth-drag-diagnosis-20261021*'
```

| 实际执行 | 退出 / 结果 |
| --- | --- |
| 只读外部skills静态校验 | 0，2个注册vendor指纹一致；不是产品测试或独立放行 |
| `node --check` | 0，诊断工具语法有效 |
| `node …check.mjs --output` | 0，21原件/相关源码指纹稳定，三态复算、11源码与A0证明一致、生产机制断言成立；只生成自有result |
| `node …check.mjs --red` | **1，预期诊断红断言**：生产RGL内部显示12/18/20/22/24/26，而compact props为0/6/8/10/12/14；不是新GUI或验收PASS |
| 自有文本/链接、git diff空白检查 | 检查方式与最终快照见收尾补记；未跟踪文件另核末尾换行/行尾空白与本地链接 |
| 产品build/install/vitest/全部verify、真实GUI/录像 | **本单未运行，明确禁止**；不声称修复通过或当前完整回归通过 |

诊断工具迭代保留三次早期失败：跨vm数组原型导致deepStrictEqual误报；RGL CommonJS入口没有default属性；两卡“单步跳到12也下推”的预测被实际结果12/6反驳。前两项已修正**自有工具**，第三项作为§6.2反证保留并改用多帧最小实验。均未改产品/原证，也没有把它们算GUI产品FAIL。

Skill试点留在本授权报告：`taskKind=rootCause`，仅加载`diagnosing-bugs`，来源commit `49dd158d1076134a641b33efb035946536778336`；静态sha/bytes校验后 `vendorIntegrityVerified=true`。增量是用原三态+生产接缝区分“无压实”与“同值props未同步”，并保留单步不复现反证；不叠grill/tdd/code-review，不执行HITL/setup/installer、不联网、不写home/全局/vendor/data、不绕独立门。修复、发布及清理步骤因授权范围不执行；不另写默认试点目录，不称skill毕业。

**交接出口：** Main保留原证并处理B1-FW-01的有界修复/测试前置；目前“实际大洞/下推”有限FAIL，“A到D目标未达”和完整门缺证分别登记。现场canonical分离、三拖全过程、save/cancel保护尚未证实。其他专家及Launcher A5继续原分工，本报告不更改其判定或服务。

### 8.1 收尾补记

结果快照 `2026-10-21T13:04:38.690Z`：checker sha256 `baa19c61c886834297e771cdc8c2c12fc706c82261d1dcb27066fa028cb9867d`；result sha256 `703affbeac5b7ba553a38c5c9f942608f3cfc1c562133a7855cd4d42427d175e`。最后复读21原件指纹全部相等，11相关源仍与A0证明相符。两次`--red`均exit1且同一坐标差异；`--output`完成后的多次诊断均exit0，不因诊断断言成立而说产品已绿。

文本/链接检查exit0、0问题；git diff空白检查exit0。只读git status显示本前缀三个自有未跟踪文件，board源码无改动；未创建自有tmp，不宣称并行工作区所有文件零变化。原脚本静态正文已存入result的`mainScript.sourceText`，用于以后审原调用而非执行GUI；检查器当前仍要求指定原tmp脚本存在，这是可重复执行的设施前置，不是产品依赖。

除上表主命令外，收尾两条只读复核命令如下（同一macOS仓库根，不写任何文件）：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node -e 'const fs=require("fs"),path=require("path"); const base="docs/testing",files=fs.readdirSync(base).filter(n=>n.startsWith("board-fullwidth-drag-diagnosis-20261021")); const errors=[]; for(const n of files){const p=path.join(base,n),s=fs.readFileSync(p,"utf8"); if(!s.endsWith("\n"))errors.push(p+": no final newline"); s.split("\n").forEach((l,i)=>{if(/[\t ]+$/.test(l))errors.push(p+":"+(i+1)+": trailing whitespace")}); if(n.endsWith(".md"))for(const m of s.matchAll(/\]\(([^)]+)\)/g)){const t=m[1].split("#")[0]; if(t&&!/^[a-z]+:/i.test(t)&&!fs.existsSync(path.resolve(base,t)))errors.push(p+": missing "+t)}} console.log(JSON.stringify({files,errors},null,2)); process.exitCode=errors.length?1:0'
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node -e 'const fs=require("fs"),c=require("crypto"); const base="docs/testing/board-fullwidth-drag-diagnosis-20261021"; const r=JSON.parse(fs.readFileSync(base+"-result.json")); const failures=Object.entries(r.evidence).filter(([p,h])=>c.createHash("sha256").update(fs.readFileSync(p)).digest("hex")!==h.sha256).map(([p])=>p); console.log(JSON.stringify({snapshot:r.at,files:r.candidateReference.proofSourceMatches.length,stable:failures.length===0,failures,checkerSha:c.createHash("sha256").update(fs.readFileSync(base+"-check.mjs")).digest("hex"),resultSha:c.createHash("sha256").update(fs.readFileSync(base+"-result.json")).digest("hex")},null,2)); process.exitCode=failures.length?1:0'
git status --short -- 'docs/testing/board-fullwidth-drag-diagnosis-20261021*' packages/dsh-pm-tool/src/client/board
```

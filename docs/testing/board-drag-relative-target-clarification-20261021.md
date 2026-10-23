# 原三拖相对区域可执行性澄清

> 2026-10-21，trae，独立测试专家。仅冻结原 B1-GUI-01 的区域含义、具体目标与反证，交 Main 继续既有采证；不改产品、不执行 GUI、不新增验收门、不签整门 PASS。

## 1. 授权与结论范围

父负责人原句：“好的，按之前的盘点文档和这个分工方案继续推进，直到把所有没验完的功能全部验完，再把所有代码都提交为止，才算完成任务，中途不要停下来。”来源：[父执行记录 §1](../../reports/all-pending-acceptance-execution-20261021.md)。当前子单明确为“独立测试专家仅原动作可执行性澄清，不产品/GUI/新门”，只写本前缀及自有 tmp；禁止他人 testing、产品、living docs、build/install/service/MainGUI/private/commit。父提交授权不转移给本专家。

Main 补充事实：fresh3214 已经标准 UI 导入原六卡、保存、重进，没有拖动；指定公共 [initial-relative.json](../../reports/all-pending-evidence-20261021/A6/board/initial-relative.json) 可读。本专家只核该文件，不探测实例、读取运行私有根、操控 Main Chrome 或据此声明修后 bundle 已现场绑定。

依据：

- [原合同 §5](independent-acceptance-batch1-closure-plan-20261021.md#5-b1-gui-01-看板连续拖动)：“A 从首行拖到 D 下方”“B 拖到 A 原位置附近”“A 再拖回上半区”，三撤销、另两拖保存、另一次拖动取消。
- [原澄清 §4.2](board-fixture-clarification-20261021.md#42-第二拖-b-到初始-a-位置附近) 已定义原 A 为 `[x=0,w=12,y=0..6)`，并明确建议 B 顶边 y≈4；不是本单新增 row4。
- [诊断 §7](board-fullwidth-drag-diagnosis-20261021.md#7-最小修复合同与测试前置)：必须保实际 D 后的拖动意图、显示与 canonical 同步、每显式手势一次历史。
- [独立复验 §7](board-fullwidth-independent-retest-20261021.md#7-gui-精确缺证与-main-接续)：修后 SOURCE/FW-T01..03 有限 PASS；原 AUTO 第二目标5只证明历史，不替原 GUI 第二拖。
- `AGENTS.md`、`collaboration.md` §9/§11.4/§11.5/§11.7：原有歧义由专家最小澄清，不能让采证端临场改动作，也不要求负责人另填矩阵/重批已授权范围。

**本次澄清结论：row4 合法且在本修后源码/真实 RGL 多帧调用中可执行；row0 不足以形成第二次离散变化。** 第二拖冻结为原 A 六行区域内 B 顶边 row4，而非原 A 顶点 row0。没有改三张卡的身份、原相对区域或原 undo/save/cancel 合同；没有将三个任意 delta 替换原三拖。本单只闭合动作定义，原 GUI 门不由本文升级。

## 2. 不随拖动更新的原区域

固定身份：A=`w-hero`，B=`w-ms-deliver`，D=`w-obj`，其余 C/E/F 沿原 fixture。初态 A `(x,y,w,h)=(0,0,12,6)`；B `(0,6,12,2)`。初态完整布局保存后重进、空撤销栈的要求不变。

固定 canonical 区域 `R_A={0<=x<12, 0<=y<6}`，来自 **layout-before 中原 A**，不来自当前 A、第一拖后 B、滚动后的屏幕顶或原 D 的初态屏幕坐标。原 A 顶点是区域的上边界，不是“原位置附近”的唯一合法点。

冻结第二落点：`B.x=0`，请求顶边 row4。B 的两行 footprint 为 `[4,6)`，完整包含于原 A 六行区；真实卡矩形高度84px，落到 row4 后其底恰到原 A 原矩形底。故即使只采用更窄的“B 整个卡矩形留在原 A 空间内”定义，也成立。

row5 不作为本轮目标：其顶仍在六行区，但两行 footprint `[5,7)` 超出该区；原文未规定必须整卡包含，所以这里**不追溯宣布所有 row5 操作违反旧合同**。本轮选择更强且已建议的 row4，并实际调用验证。历史 AUTO row5 不改写、不借用为本轮原 GUI 原证；Main 不临场用 row5 或其他位置替代。

### 2.1 Main 可直接使用的相对定位

当前真实网格 bbox 顶 `G`，原行高36、margin12、内 padding12；内容行零顶 `Y0=G+12`，步距48。滚动后重新读 `G`，不要沿用旧屏幕 y。抓取位置距被拖卡顶 `g` 保持同一手势不变，例如22px，x 取实际卡左+100px，避开按钮/×/缩放柄。

| 动作 | 冻结的真实相对目标 | 松手前/后可观察定义 |
| --- | --- | --- |
| 第一拖 | 同一 A 从初态首行到**实际 D 下方**；row12 是输入种子，不是唯一终态 | 松手前同帧 `A.top>=D.bottom`（viewport屏幕y）；另记占位顶。稳定后 `A.y>=D.y+D.h` 且 A 已离开原首卡区。D 若移动必须重新参照，不凭旧 D 底签动作。 |
| 第二拖 | B 顶边落在 `Y0+4*48`，指针目标约 `Y0+192+g`；对应原 A 区 `[4,6)` | 记录 B 原位置、实际拖动卡顶、占位、指针/滚动及导出。稳定布局必须不同于第一态，完整字段保持。目标不随当前 A 改；不以按钮 enabled 代替不同布局。 |
| 第三拖 | 第一拖同一 A 从实际 D 后返回原 A 区上沿，输入顶边 row0，指针约 `Y0+g` | 抓取前证实 A 仍位于 D 后，松手前目标在 canonical 顶部；稳定 A 回上部并形成第三个不同布局。不是拖当前已经首行的卡凑次数。 |

第二指针目标可在同一个 row4 内少量移动，使最后帧清楚；**不是再增加一次手势或允许离开原区域**。无视口内目标时沿原允许的真实纵滚祖先滚动再读 bbox，不扩大 viewport、不造鼠标状态、不输数字、不重导入。所有指针坐标仍在1440×900可见区域内。

指定初态 JSON：`G=402.328125`、A.top=`414.328125`、A.bottom=`690.328125`；未滚动时 row4 B 顶为 `606.328125`、底 `690.328125`，g=22 的指针 y≈`628.328125`。这是**初态参考**，不作为后续滚动后的绝对屏幕目标。六卡左534、右1470，右端超出1440；x≈634的抓取区仍可见，不据此修改卡宽。原横向/外壳保护与滚动规则继续有效。

## 3. 修后真实组件的实际调用

这是经执行得到的组件观察，不是手造最终数组或推算 GUI。环境 macOS/darwin arm64，Node22.23.3，React/react-test-renderer18.3.1、RGL1.4.4、Vitest2.1.9、zod4.6.5。pnpm11.28.5 仅为项目环境口径，本单未执行 pnpm。

只复制6个相关生产模块及原 fixture 到自有 `/private/tmp/pmtool-board-relative-target-20261021-Zb0DFW/`，链接已安装 closure/node_modules 只读；缓存/日志只在自有 tmp。挂载生产 BoardEditor，实例 `instanceof RGL`；按实际 `onDragStart/onDrag/onDragStop` 多帧调用，逐帧 React act。没有 mock RGL/布局状态机；设施仅提供测宽960、rAF、window/document监听和 span卡体，未模拟 DraggableCore 原生输入。

以下按 A/B/C/D/E/F 固定顺序列 y：

| 实际状态 | 请求路径 | drop及稳定 y | 相对目标/变化 |
| --- | --- | --- | --- |
| 初态 S0 | 原 fixture | `0/6/8/10/12/14` | 连续17行 |
| S1 第一拖 | A，row1..12，12帧 | `11/0/2/4/6/8` | A11在实际D `[4,6)` 后；不是拿初始D `[10,12)`判断 |
| S2 第二拖 | B，row1..4，4帧 | `11/4/0/2/6/8` | B在原A的 `[4,6)`；S2≠S1，A仍在实际D `[2,4)` 后 |
| S3 第三拖 | 同 A，row10..0，11帧 | `0/10/6/8/12/14` | A回原首区；S3≠S2，不要求S3等于初态 |
| undo1 | 原“撤销”控件回调 | `11/4/0/2/6/8` | 完整等S2 |
| undo2 | 同控件 | `11/0/2/4/6/8` | 完整等S1 |
| undo3 | 同控件 | `0/6/8/10/12/14` | 完整等S0，disabled=true |

逐稳定态独立断言：RGL完整几何=renderCard收到的完整canonical；六ID/type/config/x/w/h/min保持，零碰撞，`max(y+h)=17`，renderer网格inline height=`828px`。**此高度不是浏览器 stageHeight/bbox**，没有从公式造现场尺寸。

保存/取消没有裁掉：三undo后另做 A→实际D后、B→row4 两次真实组件多帧调用；真实“保存布局”回调仅一次 `onSave('user',完整S2布局)`、成功后onExit一次；从捕获的保存参数重挂生产组件仍等S2。随后同A→row0形成不同草稿，点真实“取消”回调仅onExit、不调用onSave；再从原保存参数重挂仍等S2。**onSave由自有spy承接，重挂由实验安排，未执行后端保存、原生页面刷新或全根保护。** 此项只解原动作可继续性，不签FW-T05。

### 3.1 两种 row0 反证

第一拖后 B 已row0。真实 start→stop目标row0（无move）时 S2等S1，产品仍保存一次重复历史。第三拖A返回后，三个undo回调得到 **S1→S1→S0**，最后disabled，不能声称三次不同状态的逆序恢复。

另经真实 `onDrag` 请求路径 `1→0→0` 后 stop0，B仍row0，全部稳定字段仍等S1。这反驳“只要走了拖动调用或鼠标曾移动，就能算第二离散态”。没有新产品FAIL判定；本单只解释该目标不满足原“三次离散变化”的取证含义。

### 3.2 占位滞后反证

B依次请求1/2/3/4时，最后实际B4，但RGL activeDrag占位仍2；再一次同格row4 `onDrag`，实际B4、占位4，完整布局不变。真实组件断言已观察该分离。

因此不能把单张占位旧帧当作B没有到row4，也不能只看指针/请求row4就声称实际卡已到。Main保同帧实际拖动卡、占位、指针与滚动，稳定导出另核；需要清楚末帧时在目标同格内真实移动再采，不改目标。该额外同格回调的原生事件可达性本专家没测试，不能要求 Main 伪造事件或把组件值倒填录像。

## 4. 源与原证指纹

基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`。修后源码身份与独立复验result一致，不以HEAD/version代dirty候选或现场下发身份。

| 对象 | sha256 |
| --- | --- |
| 修后 editor.tsx | `ba1bf91211c87c068fe0bb4cb887249f1c321e2eecb20885d6745b2cd3086761` |
| editor-ops.ts | `ade6c08dd648dc02cb6813c89d159e59116052e0d3701eabd3cef414e7d06601` |
| 原 fixture | `41c91b49024270667b5a43e2f927bc43c478b8b69384c95b157aa01643176b87` |
| Main initial-relative.json | `ad51758720d838a8109e62010f353ca00b34a058d1189ee1f44e89d916c90e5a` |
| 最终自有组件实验 | `e9b432a6971e3b84d19cb433a37647afda0ee07068f16d391c9106accb054910` |
| 最终r2输出 | `81472792a2035edbbccd462ede5f0a39f5403d8ef3fa615d2ff79dfa9cf57d5c` |

[freeze](board-drag-relative-target-clarification-20261021-freeze.json) 存13个源码/原件指纹、依赖关键文件指纹及自有tmp；[实际result](board-drag-relative-target-clarification-20261021-result.json) 存每帧请求、真实RGL数组/占位、稳定完整widgets、undo/save/cancel及实际argv/cwd/exit。r2时点 `2026-10-21T14:02:03.217Z`，源/原件及副本未漂移、列出的依赖文件未漂移。不是整工作区零变化，也没有现场读取closure lib/服务/profile。

[归档](board-drag-relative-target-clarification-20261021-archive.json) 保存自有实验源码、配置、冻结生产模块/fixture副本、两轮stdout及退出记录；不覆盖他人原测试、fixture或报告。旧r1两项与最终r2四项都是动作解释实验，不作为新产品门。

## 5. 命令、结果与交接

运行环境 macOS，仓库根 `/Users/bytedance/Projects/dsh-pm/pm-tool`，实际Node路径固定如下。配置和自有实验文件由apply_patch创建；没有手改生产副本。

```sh
cd /Users/bytedance/Projects/dsh-pm/pm-tool
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/board-drag-relative-target-clarification-20261021-check.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/board-drag-relative-target-clarification-20261021-check.mjs --freeze
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/board-drag-relative-target-clarification-20261021-check.mjs --run r1
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/board-drag-relative-target-clarification-20261021-check.mjs --run r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/board-drag-relative-target-clarification-20261021-check.mjs --archive
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/board-drag-relative-target-clarification-20261021-check.mjs --audit
git diff --check -- 'docs/testing/board-drag-relative-target-clarification-20261021*'
```

`--freeze`/`--archive`禁止覆盖已存在证据；再次运行用未用过的标签。内部真实Vitest argv为Node运行已有closure的 `node_modules/vitest/vitest.mjs run --config <自有tmp>/vitest.config.mjs --reporter verbose`，cwd为自有tmp下插件包。

| 动作 | 实际结果 |
| --- | --- |
| freeze与内部git rev-parse | exit0；六卡初态bbox相对行/高逐一等fixture，editor等已有限PASS源码 |
| r1内部Vitest | exit0，2/2；外层工具异步UUID无法用整数终端接口回收，外层exit不冒认，内部exit/output已保存 |
| r2外层/内部Vitest | exit0/0，4/4；无signal/error；四项分别为原row4完整序列、row0重复历史、占位同格追帧、多帧回row0 |
| 语法、归档及收尾文本/链接/指纹检查 | 收尾补记记录实际退出；不把文档检查当产品验收 |
| build/install/整包verify/启停服务/GUI/MainChrome/后端保存及真实刷新 | NOT_RUN，本单禁止；无新门或放行结论 |

收工交Main：按§2原区域冻结继续原三拖与三逆序undo；另两拖保存、另一拖取消、真实刷新/导出/后端回读、录像、每窗口白名单保护均沿原§5/fixture§5-6，不删减也不新增矩阵。若row4实际无不同稳定态，保原证交专家，不临场换row5、卡ID或任意delta。无需负责人另填表或重新批准本范围。

本专家只闭合动作澄清。修后SOURCE/AUTO有限PASS照原报告保留；FW-T04/FW-T05、历史GUI FAIL与整门由后续绑定的新GUI原证审签，本单不改他人登记或结论。

### 5.1 收尾补记

语法检查exit0；`--archive` exit0，归档14项；`--audit` exit0，[audit](board-drag-relative-target-clarification-20261021-audit.json) 时点 `2026-10-21T14:04:42.174Z`，13冻结对象/14归档指纹相符、列出的依赖无漂移、文本末尾换行/尾空白/相对链接零问题。`git diff --check` exit0，因新文件未跟踪，文本检查另覆盖新文件，不把空diff冒称内容验收。

只读 `ps -axo pid,command | grep '[n]ode.*board-relative-target-20261021-Zb0DFW'` exit1且无匹配，结合两轮内部Vitest exit0记录确认没有自有实验进程需等待；没有发任何kill/服务命令。全部新增只在指定前缀及selftmp，没有改产品/原fixture/其他testing/livingdocs，也没有build/install/MainGUI/private读取/commit。归档含冻结生产**证据副本**，不属于生产修改；本单不宣称并行其他owner没有变化。

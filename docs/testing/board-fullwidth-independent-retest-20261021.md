# 全宽看板独立复验

> 2026-10-21，trae，独立测试专家。给 Main、负责人和后续专家使用：仅审看板文件级 SOURCE/AUTO 候选及原合同缺证；不开发、不签 GUI 整门、不签全 dirty 候选。

## 1. 有限结论

| 对象 | 独立结论 | 证明范围 |
| --- | --- | --- |
| SOURCE：限定修复与 RGL 内部同步机制 | **有限 PASS** | 实际冻结源码仅 editor 有产品差异；真实 RGL 1.4.4 接缝符合原 §7。没有发现本范围新增确证产品 FAIL。内部 API 风险见 §5。 |
| FW-T01 | **AUTO PASS** | 原六全宽卡与两卡真实组件、多帧碰撞链、A 在实际 D 后、卡集/完整字段/尺寸保持、零相交、显示=canonical。不是原生指针 GUI。 |
| FW-T02 | **AUTO PASS** | 原合法同值 6→7→6 与不同值 6→7；内部先变化，同值提交后显示/高度采用 canonical；重复三次同值提交补验通过。 |
| FW-T03 | **AUTO PASS** | 三拖/三撤销、拖缩混合、一次手势一次历史、被动测宽/面板不写；增补顶部与内部洞、撤销恢复洞、20 步上限及设施释放。 |
| FW-T04 | **NOT_RUN** | 尚未收到绑定本修后候选的新 build/下发与真实原三拖/三撤销证据。本专家禁止 build、服务和 Main GUI 操作。 |
| FW-T05 | **NOT_RUN** | 同候选的两拖保存/刷新回读、另拖取消/刷新回读及逐窗口全写根保护未提供。 |
| B1-FW-01 原 GUI FAIL / B1-GUI-01 整门 / 全包 dirty 放行 | **不签 PASS** | 源码/AUTO 修复已独立验证，不覆盖或抹除原 GUI FAIL；原门须经新版 GUI 复验。本报告不改变其他领域进度和结论。 |

独立重跑同一最终测试文件：**旧 HEAD editor：5 failed / 31 passed，exit 1；新冻结 editor：36 passed，exit 0**。另增补 **9/9，exit 0**。这 45 个通过断言来自两个限定运行，不是全包回归数量。

## 2. 授权、合同与写边界

父原句及持续分工见 [父执行记录](../../reports/all-pending-acceptance-execution-20261021.md)。本专家当前指令为“独立测试专家复验，不开发”，只写 `docs/testing/board-fullwidth-independent-retest-20261021*`、同前缀 evidence 和自有 tmp；禁止产品、他人 testing、living docs、lib/build/install、服务/MainGUI、凭据/private、commit。指定公共自有开发 tmp 的只读例外没有扩展为其他私有运行目录访问。

先读 `AGENTS.md`、`collaboration.md`，完整 [诊断 §7/FW-T01..05](board-fullwidth-drag-diagnosis-20261021.md#7-最小修复合同与测试前置)、[原六卡/动作澄清](board-fixture-clarification-20261021.md)、原 fixture、[Main 收口计划](../plans/2026-10-21-bridge-board-objective-closure.md) 和 [开发交接](../../reports/board-fullwidth-developer-20261021.md)。最新 progress/handoff/onboarding/changelog 及相关需求/ADL/知识/问题条目作只读接续扫描。

本单没有 pull/fetch、install、build、写共享 worktree/lib、触碰宿主/profile/正式数据、启动或停止服务、操作浏览器/桌面、访问凭据或 commit/push。通用开工/同步 living docs 流程在本单按明确限定授权不执行；不存在产品改动审批或父提交权限继承。

实际写根只有：

- 本报告、同前缀检查器及 `board-fullwidth-independent-retest-20261021-evidence/`。
- 自有 `/private/tmp/pmtool-fw-independent-retest-20261021-7ry62y/`，包括复制的源/测试/配置、Vite cache 与补验原始观察。

只链接已安装 `/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules`，没有写共享源码或安装依赖。没有执行开发 recheck 脚本；原 A6 日志只作对照，不作为本专家新运行结果。没有读取开发 tmp 内其他对象或任何 GUI helper/private runtime。

## 3. 独立冻结与候选

[冻结记录](board-fullwidth-independent-retest-20261021-evidence/freeze.json) 时点 `2026-10-21T13:27:20.592Z`，候选 ID `board-FW-independent-source-20261021`，基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`。package version `0.7.4` 是声明，不是已发布/装载身份。

| 对象 | sha256 |
| --- | --- |
| 旧 HEAD editor | `5ddf057cf5bb0eab59dbb31233b59c586959705f452b56f59bc88d8a885cf6f8` |
| 修后 editor | `ba1bf91211c87c068fe0bb4cb887249f1c321e2eecb20885d6745b2cd3086761` |
| 最终 editor-drag-stop.test.tsx | `973fa516de33a957292a7d996d6f778d765d924f480d2534b1513625074faa79` |
| editor tracked diff | `6253c7aed451a7ce54d779525167768f6a3e300c178c6d5552b0d4a0a707ac5c` |
| 原专家 fixture | `41c91b49024270667b5a43e2f927bc43c478b8b69384c95b157aa01643176b87` |
| 未改 editor-ops.ts | `ade6c08dd648dc02cb6813c89d159e59116052e0d3701eabd3cef414e7d06601` |
| Main vitest.config.ts | `ef1b61eba0c112e523e535e6794c85612874522e4413665c8970a997ab4124c8` |
| pnpm-lock.yaml | `646a1a27770cc32b8f07195a3e3c5b7c038aae7040dc408749719f8d76963caa` |

冻结逐一记录 11 个相关源/测试、package/config/tsconfig/lock、fixture、合同和 A6 原件。复制前后指纹相同。board 的 tracked diff 仅 `editor.tsx`，新增组件测试单独认领；Main 的 tsx include 已包含 `.test.tsx`，本专家没有改它。

[归档清单](board-fullwidth-independent-retest-20261021-evidence/archive.json) 保存全部相关源/原最终测试/原 fixture、自有两个配置/补验测试及观察；每个原始运行有 stdout/stderr 合并文本与独立 `*-exit.json`（argv、cwd、开始/结束、exit/signal、输出 hash）。旧源码也归档，主树从未回退。

## 4. 实际方法与断言

环境为 **macOS/darwin arm64，Node v22.23.3**；实际解析 React/react-test-renderer **18.3.1**、RGL **1.4.4**、Vitest **2.1.9**、TypeScript **5.9.3**、zod **4.6.5**。RGL 解析的 react-dom 为 **19.3.1**。pnpm **11.28.5** 是合同口径，本单未执行 pnpm；运行 Node 的 Vitest CLI。

挂载生产 `BoardEditor` 与真实 RGL；组件实例 `instanceof RGL`。原最终 7 组件用例与原 ops18/compact6/geometry5 共 36 断言，在新自有 tmp 重新执行。没有 mock RGL/布局业务状态机；仅提供 `clientWidth`、rAF、ResizeObserver、window/document 监听设施、空宿主依赖与简单 span 卡内容。

组件级直接调用真实 RGL `onDragStart/onDrag/onDragStop`、`onResizeStart/onResize/onResizeStop`，每帧经 React `act`；没有覆盖 DraggableCore 原生 mouse/pointer 输入。通过生产 renderCard 接收的完整 widget 观察 canonical，同时断言 RGL state、卡 transform/宽高、grid inline height、同一实例与撤销按钮。这些像素是 renderer 的渲染属性，**不是浏览器实际 bbox/stageHeight**。

### 4.1 同测试旧源反证

[独立 red/green 记录](board-fullwidth-independent-retest-20261021-evidence/independent-red-green.json) 绑定同一测试 hash、fixture、依赖与配置：

| 旧源确证红例 | 新源 |
| --- | --- |
| 六卡：A y12 小于实际 D 底24，未在 D 后 | 通过 |
| 两卡碰撞链：B y6，而非顶部0 | 通过 |
| 同值缩放：B..F 显示7/9/11/13/15，canonical6/8/10/12/14 | 通过 |
| 三拖：稳定显示与 canonical 分离 | 通过 |
| 拖/缩放/缩放：三次撤销未回原完整状态 | 通过 |

原 29 纯函数测试两轮均通过，不把这些原控制项冒称新增缺陷断言。不同值缩放和被动含洞控制也在旧源通过，反证没有将全部旧行为判坏。

### 4.2 九项独立增补

[最终补验源码](board-fullwidth-independent-retest-20261021-evidence/source/packages/dsh-pm-tool/src/client/board/independent-fw-boundaries.test.tsx)、[原始观察](board-fullwidth-independent-retest-20261021-evidence/source/additional-observations.json) 与 [9/9 日志](board-fullwidth-independent-retest-20261021-evidence/independent-additional-r2.txt)：

1. 在真实同值 resize 的内部下推态，原静态同步对同值 props 返回 null；适配在 `activeDrag` 非空也返回 null，清空后序号变化采用 canonical。传入 state 不被改写，已同步同序号再次调用返回 null。
2. start 与 12 次 move 不改 canonical/提交序号/保存或 localStorage；stop 只一次提交、清 activeDrag/oldLayout/oldDragItem/placeholder；一次撤销回原六卡且按钮 disabled。
3. 连续三次合法 6→7→6，各次真实下推后同步，序号1/2/3；三个独立历史，三撤销后 disabled。
4. 合法顶部与内部洞 y=`3/11/15/19/23/27`，640/390/1024/960 被动测宽及 window resize 保留完整数据、实例、序号0、无历史/保存。
5. 该含洞初态三真实多帧拖动、三逆序撤销逐字恢复；再测宽仍保洞。
6. 无 move 的有效 drag stop 与重复 stop 负控制，不新增第二次提交/历史。
7. 21 次同值手势只保留既有20步历史；恰20次撤销后 disabled。
8. 未知卡 ID 的真实拖动方法负控制，不生成历史/提交，不原地修改输入 fixture。
9. 卸载断开 ResizeObserver 与相同 resize listener，不调用保存/重置。

补验首轮 **exit1，8绿/1设施失败**：测试用 `structuredClone(state)` 克隆了 React children 中的 `Symbol(react.element)`，抛 `DataCloneError`，尚未进入产品断言。只改自有测试为浅保留 children/其他字段、分别克隆 layout/propsLayout/activeDrag；原 [失败文本](board-fullwidth-independent-retest-20261021-evidence/independent-additional.txt) 与 exit 保留。复跑9绿，不把设施失败算产品 FAIL，不改任何产品源。

## 5. RGL 内部 API 独立风险审查

1. [editor.tsx:22-44](../../packages/dsh-pm-tool/src/client/board/editor.tsx#L22-L44) 通过类型断言继承真实 RGL 类，依赖 `getDerivedStateFromProps`、`activeDrag/propsLayout` 与原生同步顺序。这些不是跨版本公共承诺；package 将 RGL 精确锁 **1.4.4**，本轮实际依赖亦为1.4.4，关键依赖文件 hash 在 freeze 登记。升级或替换 RGL 后本结论不能继承。
2. 原 RGL stop 是“先调用产品 callback，再 setState 清 activeDrag”。适配把提交序号推进与同步分开，等 activeDrag 清空才失效比较缓存；不直接覆盖实例 state，不重挂载/换 key，不定时重试。原静态方法对 `propsLayout:undefined` 走正常 children/布局同步。本轮静态正负控制和真实组件停止链均通过。
3. [start/stop 接线](../../packages/dsh-pm-tool/src/client/board/editor.tsx#L511-L524) 只在 drag start 打开 vertical；resize/idle 仍 null，[commitGeometry](../../packages/dsh-pm-tool/src/client/board/editor.tsx#L214-L219) 回用生产 reverse/compact、推进序号并关闭 dragging。原 oldItem 历史函数未改；被动 onLayoutChange 没有写草稿入口。含洞负控制与同值历史证明其当前边界，没有作全局布局整理。
4. 原 RGL `shouldComponentUpdate` 不识别新增 canonicalRevision。当前 BoardEditor 每次渲染重新创建 children；stop 还清 activeDrag，因此实际显示重绘，并已由卡 style/grid height 断言验证。今后 memoize children、改批处理/事件装载或仅推进序号而无这些更新时，须重新覆盖渲染接缝，不能只沿用 state 断言。
5. `unknown as` 绕过内部完整 state 类型；本单无整包 TypeScript 检查/build，不能据 Vitest 的类型擦除宣布类型/打包通过。现存 React18/ReactDOM19 解析组合及宿主实 React 运行不由 react-test-renderer18 验收，Main 应在唯一构建和真实宿主中继续验证。本专家不调整依赖。

以上是明确的维护/覆盖风险，不是本范围确证新 FAIL，也不是豁免后续 GUI 门的理由。

## 6. 命令与退出

以下命令环境均为 macOS，仓库根 `/Users/bytedance/Projects/dsh-pm/pm-tool`，Node 路径固定为 `/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node`。

```sh
cd /Users/bytedance/Projects/dsh-pm/pm-tool
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/board-fullwidth-independent-retest-20261021-check.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/board-fullwidth-independent-retest-20261021-check.mjs --freeze
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/board-fullwidth-independent-retest-20261021-check.mjs --run
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/board-fullwidth-independent-retest-20261021-check.mjs --additional
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/board-fullwidth-independent-retest-20261021-check.mjs --additional independent-additional-r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/board-fullwidth-independent-retest-20261021-check.mjs --vendor
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/board-fullwidth-independent-retest-20261021-check.mjs --drift
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/board-fullwidth-independent-retest-20261021-check.mjs --archive
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/board-fullwidth-independent-retest-20261021-check.mjs --audit
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/board-fullwidth-independent-retest-20261021-check.mjs --result
```

`--freeze` 是一次性保护，不能在已有 freeze 上覆盖重跑；后续复验用新自有根并重新认领。自有配置通过 apply_patch 创建，缓存根固定自有 tmp；没有改复制的 Main config。运行器内部实际命令完整 argv/cwd/exit 已登记，不以外层exit0遮掩旧红exit1。

| 实际命令/动作 | exit / 结果 |
| --- | --- |
| `node --check`，初次/后续 | 0 / 语法有效 |
| `--freeze` 内 git rev-parse/diff/status/diff-stat/show 五命令 | 均0；冻结 manifest 与复制指纹已独立回读 |
| `--freeze` 首次外层短等待调用 | **NOT_CAPTURED**：工具返回异步执行ID，未提供可回收的匹配终端接口；不以文件存在伪造外层exit。后续 `--drift` 明确exit0复核冻结完整/稳定，所有实际测试exit均直接记录 |
| `--run` 外层 | 0，取得预期旧红/新绿 |
| 内部 Vitest 原最终测试，旧 editor | **1，5 failed / 31 passed**，预期产品反证 |
| 内部 Vitest 原最终测试，新 editor | **0，36 passed** |
| `--additional` 外层/内部 | **1/1，8 passed + DataCloneError设施失败**，原件保留 |
| `--additional independent-additional-r2` 外层/内部 | **0/0，9 passed** |
| `--vendor` 外层/内部 | 0/0，2个注册vendor静态sha/bytes一致，不执行vendor正文 |
| `--drift` 及内部最终HEAD/diff | 0；基线/受测文件/依赖/副本/patch无变化 |
| `--archive`，初次/收尾 | 均0，初43项、补最终检查后45项原证/源码副本指纹归档 |
| `--audit` | 0，新文件末尾换行/行尾空白/相对链接零问题，git diff检查exit0 |
| `--result` | 0，45项归档指纹、13份内部退出记录与stdout hash全部相符 |
| 只读 `cat/sed/find/grep/nl/git status` 查看命令 | 均0；只用于接续与源码审查，不算产品测试 |
| 两个指定平台记忆文件 `cat` | 均1，路径不存在；以仓库事实继续 |
| 初始 `rg --files docs reports ...` | 127，rg不可用；改用find/grep，只读检索完成 |
| build/install/coverage/整包类型检查/全部verify/新宿主/真实GUI | **NOT_RUN（本单禁止或非授权执行范围）**，不引用旧全集结果替代 |

`--vendor` 仅做 AGENTS 所要求的只读完整性检查。`taskKind=delivery`，虽静态完整性通过，但原 GUI FAIL/整门未闭仍受政策 §6.1 阻塞规则；本单未加载/执行 vendor skill，不制造试点毕业或由 skill 代判结论。

## 7. GUI 精确缺证与 Main 接续

本单没有新的 bundle/build manifest、宿主提交/实例PID/端口/browser/功能开关认领。父记录的旧运行与 A5 六卡异常原证属于历史候选；本专家没有现场探测服务，不能推断现在已下发修后 editor。即使随后 Main 新 build 完成，也须提供同源码字节绑定证据，不用 version/HEAD/作者36绿代替。

Main 沿原合同补件，不开发新方向：

1. 唯一builder精确同步这两个文件及原fixture，绑定总候选、依赖、整包类型/build/全集/全部verify；freeze/产物/实际下发三层分别认领。不得以本专家自有tmp承载服务。
2. **FW-T04**：原1440×900、浅主题、真实100%菜单；标准UI导入原六卡、user保存后重进、空撤销栈与 layout-before 完整字段。真实A→实际D下方、B→初始A区、同A回上半区，三逆序undo。每drop保实际D底/A与placeholder顶/pointer坐标及buttons/滚动祖先，稳定态六卡bbox/显示与导出/实际stageHeight及连续无遮挡录像。AUTO第二拖目标5只证明历史，不等于原GUI第二拖。
3. **FW-T05**：另两真实拖动保存→提示→reload重进→导出及同dashboard落盘回读；另一次真实拖动形成不同草稿后cancel→reload，显示/导出仍等保存版。每窗口全键集/hash/mtime、实际storage/backup/export/附件写根保护；只允许对应 dashboard_user 的明确保存写，三拖/undo/cancel零业务写，localStorage历史另列。
4. 新证据交独立专家复验；如确证FAIL，仅即时报告Main、保source不动，不取消Launcher/OP/资料等其他已授权领域。

## 8. 收尾快照

[机器结果](board-fullwidth-independent-retest-20261021-result.json) 包含本有限判定、13个内部命令的全部argv/cwd/exit/输出hash、45项归档校验及报告/检查器指纹。[最终漂移记录](board-fullwidth-independent-retest-20261021-evidence/drift.json) 时点 `2026-10-21T13:32:39.252Z`：受测文件与原件无漂移、依赖关键文件无漂移、复制源码无漂移、HEAD与editor patch无漂移；两次漂移检查均exit0。此事实只涵盖manifest列出的对象，不宣称全工作区或未观察写根零变化。

文本/链接检查exit0、零问题；原测试旧红exit1、新36绿exit0，补验设施失败exit1与修正后9绿exit0均逐份保留，不覆盖旧原证。收尾的证据校验exit0；没有测试子进程仍需等待，没有服务/GUI动作。

本专家 SOURCE/AUTO 子单完成。FW-T04/T05保持 **NOT_RUN**、不签整门，不改他人testing/living docs，不提交；Main继续原分工的唯一构建、原GUI采证与其他领域验收。

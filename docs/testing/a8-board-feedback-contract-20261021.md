# A8 看板反馈先行最小测试合同

> 2026-10-21，平台 trae，独立测试专家。给 Main 实现、采证与独立复验使用：只关闭已确证 A6-BGUI-01 保存成功误用错误横幅，以及同一反馈接缝的受影响分支；不开发产品、不代签 GUI 或积压总门。先发布用例，再冻结当前源码观察红；新源码须由 Main 交件后另行复验。

## 1. 授权与范围

- 父授权原句（本派单引用）：“按之前盘点文档和分工继续推进直到所有没验完功能验完并代码提交，中途不停止”。完整历史原句见 `docs/testing/a6-board-gui-independent-review-20261021.md` §2。本子单不继承父最终提交权。
- 本次明确有界授权：只写 `docs/testing/a8-board-feedback-contract-20261021*` 与自有 tmp；不写产品、其他 testing、livingdocs，不 build、不 GUI、不操作服务、不接触凭据、不 commit。Main 是唯一 GUI、builder 和产品本项写者。故不执行常规 fetch/pull、install/build、全包 verify 或 livingdocs 同步。
- 依据：`AGENTS.md` §6A；`docs/collaboration.md` §9、§11.3–11.5；`docs/testing/a6-board-gui-independent-review-20261021.md` A6-BGUI-01；`docs/plans/2026-10-21-precheck-and-board-feedback-closure.md` 步骤3–5。
- 任务终点：先交本合同及隔离执行设施；独立只读冻结现源，记录可执行 SOURCE/真实组件红态；Main 新源交件后按同合同复验。缺交件不改产品自行“修绿”。
- A6-BGUI-01 沿用 **P2 / FAIL**，严重度只排修复优先级，不默认豁免，不把数据保存成功当反馈通过。旧 A6 FAIL 与原图保留。
- 不改保存/刷新/撤销/导出/持久化链、不添加新产品，不扩新 UI 矩阵，不规定新全站设计。Board 异步 chunk 实际字节绑定、正式保护不由本专家执行；仅在新 GUI 补件中列出。

## 2. 现源接缝与最小建议

以下行号来自先行读到的主树，后续冻结报告另认领源码字节，不用 HEAD 单独代表 dirty 候选。

| 文件与行 | 当前事实 | 最小建议（由 Main 实现） |
| --- | --- | --- |
| `packages/dsh-pm-tool/src/client/board/BoardBento.tsx:49-52,261-265` | `banner` 只有字符串；所有 banner 与 editorError 共用 `pm-bento-validation` + `role=alert`；editorError 文案优先 | 明确消息 kind 与 text；成功 `role=status`，失败/加载错误 `role=alert`。不靠“成功/失败”等文案正则猜类型。editorError 同时存在时始终优先错误样式及文案。 |
| `BoardBento.tsx:295-308` | 保存先 onSave，再 refreshAndConfirm，之后 setLayout/savedLayout/banner；catch 设错误并重抛 | 保留调用顺序、scope 和异常传播；仅设置成功/错误消息种类。成功文案保留“布局已保存并刷新。”。刷新失败也必须是错误，不能把已落盘后刷新失败的提示当落盘失败证据。 |
| `BoardBento.tsx:310-319`；`editor.tsx:251-256` | 重置没有父 catch banner；编辑器吞异常并注明 banner 处理。父重置仅在刷新函数存在时刷新 | 最小补齐失败可见反馈并保持原异常语义；不借本合同改重置数据或缺失刷新通道的原策略。刷新 false/reject 必须错误而非旧成功残留。 |
| `BoardBento.tsx:103-122` | queue 追加走 onSave→必有刷新通道→确认刷新→setLayout/banner | 同样显式分成功/错误，不改追加算法、不重排旧卡、不改变 activeScope。 |
| `BoardBento.tsx:154-166,264` | startEdit 清 banner/editorError；加载失败设 editorError；关闭同时清两者 | 保留清除、重试、关闭语义。不得隐藏真实错误来使“无错误横幅”绿。 |
| `packages/dsh-pm-tool/src/client/panel.css:45-46,2004-2005`；`board/board.css:240-245` | 已有 `--pm-success`；validation 背景/边/字使用 `--pm-st-overdue`；已有局部 success token 示例 | 新成功样式仅限反馈横幅，使用既有 success token；错误保留 validation。可复用结构再加成功 modifier；不能全局把 validation 改绿，也不写硬编码成功色。 |

保存 catch 现文案“保存失败，未落盘”在刷新失败时不证明未写盘；本单不据此开保存链修复。若 Main 校正文案，需区分“操作未完成/刷新失败”与未验证的落盘结论，不改变数据结果。本合同不强制重写该历史文案。

## 3. 先行 SOURCE 与真实 React 组件用例

### 合法 fixture 与观察方法

- 空业务 Snapshot：projects/tasks/milestones/riskIssues/meetings/reports/deliverables 均为空数组，无凭据、无 fetch、无真实数据路径。
- 输入布局采用已审定 `docs/testing/board-fixture-clarification-20261021-fixture.json` 原字节，先调用真实 parseLayout 证明合法；不改稳定 ID/config/尺寸。project scope 复用此合法布局，使用本地虚构 `proj-a8-feedback`，不写存储。
- 挂载真实 `BoardBento`，其 hooks、消息分支、render 和回调必须实际运行；不能复制 banner 表达式或纯函数判定来冒充组件。
- 可 mock 宿主 UI/卡片展示、浏览器 globals 与动态 editor 接口捕获；保存/重置/queue 调用的是实际父回调。动态 editor 被替代时只证明父反馈，不声称真实 BoardEditor/RGL、落盘、浏览器或 chunk 通过。至少一条成功与重置失败可进一步使用真实 BoardEditor 接缝；设施不支持时单列边界。
- 用 deferred Promise 观察落盘在途、刷新在途与完成，记录调用次数/顺序、作用域、完整 layout 和 savedLayout 前后值。onSave/onReset/refresh 为 stub，仅记录参数/结果，不做网络/磁盘操作。关闭 mock globals、unmount，禁用网络。

| ID | 精确初态、动作与断言 |
| --- | --- |
| BF-S01 | SOURCE：枚举全部 setBanner 成功/失败点、editorError 的优先渲染与关闭；成功路径只能 success kind/status/既有 success token，失败不能带 success modifier。人工复核 AST/源码上下文，不以 grep 文案单独放行。 |
| BF-C01 | 保存成功：挂载→真实点击“布局编辑”→捕获 editor props→调用其 onSave(`user`, F1)。先挂起 onSave，后放行并挂起刷新，此两阶段均不能显示本次成功；刷新 resolve true 后消息为“布局已保存并刷新。”且 role=status，不匹配错误语义/色 token。onSave 一次、refresh 一次，完整 F1 与 activeScope 不变、layout/savedLayout 在刷新完成后才更新。 |
| BF-C02 | 保存失败三支：onSave reject、refresh reject、refresh resolve false。每支独立挂载；父回调 reject，role=alert/错误样式、无成功消息；onSave reject 不调用刷新，其余各一次；不得成功更新 layout/savedLayout。另测缺失刷新函数：已调用 onSave，必须 reject/错误，不假称未落盘。 |
| BF-C03 | 重置成功：真实编辑器接口调用 onReset；onReset resolve→refresh true 后才有“已恢复默认布局。”/status/success token。scope 为 activeScope；默认解析和 savedLayout 变化与原链一致。实际 BoardEditor 补测必须按“恢复默认”第一次武装、第二次明确确认，不跳过二次确认。 |
| BF-C04 | 重置失败：onReset reject、refresh reject、refresh false，分别无本次成功、可见 alert/错误，保留 layout/savedLayout，父异常仍可被编辑器原 catch 处理。追加序列：先重置成功，再同一挂载重置失败，不得残留旧成功。缺失刷新函数按原允许策略观察登记，不在本单改成新保存政策。 |
| BF-C05 | queue 成功：初态合法布局无 queueCard，真实点击“＋ 添加补记队列”；onSave/refresh 在途不得提前显示本次成功；按钮添加中/disabled 保持。完成后“已添加补记队列并保存到个人布局。”/status/success；queue 只追加一次，已有完整 widgets 字段保留，不移动旧卡；隐藏追加入口。 |
| BF-C06 | queue 失败：onSave reject、refresh reject、refresh false、缺失 refresh 四支；错误可见/alert、没有成功消息，不更新 layout、不隐去追加入口，按钮 finally 恢复可用；每支核 onSave/refresh 调用次数与 activeScope。 |
| BF-C07 | 加载错误与优先级：动态 import reject→“编辑器加载失败：…”/alert，editorLoading 结束。真实可达竞争：queue 先挂起，startEdit 失败，再 queue 成功（banner+editorError 并存），加载错误文案及样式必须优先；不能因 banner success 渲染绿色错误。此项用动态加载 stub，明确不是网络 chunk 测试。 |
| BF-C08 | 关闭/重试：对 success、普通 error、editorError（包括 C07 并存）分别真实点击 aria-label=关闭，反馈移除；再次“布局编辑”清两种旧态，在 loading 未出现旧 success，重试失败为新 error，重试成功可进入 editor。关闭不得调用保存/重置/刷新，不改变 layout/savedLayout。 |
| BF-C09 | 作用域与清理回归：C01/C03/C05 至少各复测 projectId=`proj-a8-feedback`，activeScope 精确为 `project:proj-a8-feedback`；原 user 路径仍是 user；不因 editor 参数 scope 改写父项目归属。每个用例结束 unmount，mock 恢复、零网络、无实际盘写。 |

“成功不为错误”依据实渲染 class/role 与该 class 的实际 CSS token，而不是必须改成某个固定类名。允许相同基础布局类加成功 modifier，须证明 CSS 覆盖确实生效、错误仍原样。React renderer 没有 CSS 计算/目视能力，自动结果只签父反馈结构与 token 接线，视觉须新 GUI 原证。

## 4. 隔离执行设施与命令约束

环境：macOS/darwin arm64，nvm Node 22；项目 pnpm 11.28.5。本单不安装依赖。主包 package 声明 React/test-renderer 18.3.1；已探测主包 renderer 解析为 MODULE_NOT_FOUND，不能将声明当可用。优先复用既有隔离依赖，实解析与版本/指纹须登记。

- 自有根：`docs/testing/a8-board-feedback-contract-20261021-selftmp/`。冻结 source/dep、观察器、Vitest config/cache/result 都只写此根；禁止共享 `node_modules/.vite`、`.vitest` 或 Main 缓存。
- 只允许 Vitest 的 transform/真实组件执行；不调用 tsc/tsdown/pnpm build，不写 lib，不启动浏览器或服务。测试需绝对指定私有 config、root 与 cacheDir，单 worker、关闭 coverage/watch；不能直接 `pnpm test` 默认共享缓存。
- 依赖缺口优先给 Main 设施建议，不自行 install。测试脚本及精确命令由本前缀文件提供；新源复验须另建轮次，不覆盖红态日志。
- 冻结项至少有 baseline HEAD、被测源文件清单/hash、相关 tracked diff、fixture、CSS、package/lock、实际解析依赖及缓存根。观察结束对读取输入再核 hash；有并发变化须标漂移并另认领，不能把旧结果扩大到新字节。

## 5. 交给 Main 的新 GUI 补件

Main 按本合同采原始证据，不自判 PASS；只用新候选、新运行实例，不用 A7/A6 旧网件倒签。主合同既定三拖/三撤销、save/reload、不同草稿 cancel/reload 及保护回读继续按原步骤，本单不复制或加宽 UI 矩阵。

| ID | Main 采证动作、结果与边界 |
| --- | --- |
| BF-G01 | 原合法全宽 fixture，按既有保存/取消旅程显式保存；完整过程录屏/帧，覆盖保存中→成功反馈→真实 reload→重进完整导出。成功文本确为保存结果，非 error 色/alert，不用 React 重挂替代 reload。保存版完整 JSON 对上原旅程回读。 |
| BF-G02 | 隔离故障设施下分别保存命令失败、落盘后刷新失败；记录故障注入边界与原命令/刷新结果，实际页面 error，无成功假态；恢复设施后重试成功、关闭可用。不能改保存链/正式数据来制造故障，不能只凭“未落盘”文案断定零写。不可备 fixture 就 BLOCKED，不伪造失败图。 |
| BF-G03 | 重置二次确认，首次仅武装、第二次执行；成功与隔离 reset/refresh 失败分别录证，错误不被吞、不残留旧 success。queue 无卡初态显式追加，成功与隔离刷新失败各录证，失败仍可重试。只操作隔离业务，不在正式页面重置。 |
| BF-G04 | 加载失败/关闭/重试以及可达 banner+editorError 并存优先级；真实动态加载故障若不可隔离，列 BLOCKED 与具体原因，不能把 C07 stub 当 GUI。反馈长文案沿现有布局可读、关闭按钮可到达，目视现有浅/深主题成功/错误区分；不增四视口/200% 新矩阵。 |
| BF-G05 | 新候选基线+diff+新文件/hash、实际宿主完整 SHA/补丁、Main build 完成和产物 manifest、实例/profile/端口/PID/flags/浏览器 document 绑定。实际 uncached 入口 **与异步 client.editor.js** 响应原字节/hash及装载序列同时交件。正式及隔离保护沿旧主合同补真实写根 hash+mtime/目录存在/保存布局字节等；本单只列补件，不执行、不签保护。 |

GUI FAIL/BLOCKED 保持独立门，不自动转 MANUAL_PENDING。本合同没有本人认证任务；需要本人者必须说明具体不可替代动作。自动子项 PASS 不扩为完整 GUI、B1-GUI-01、B8、积压总门、Launcher、正式切换、发布或提交批准。

## 6. 当前状态与复验交件

- 合同：**先行就绪**；用例在产品修复前定稿，本专家不写产品实现。
- 当前源码 SOURCE/组件：待本前缀独立冻结报告记录；不以合同存在宣布通过。
- A6-BGUI-01：历史 **FAIL** 保留；新 GUI：**BLOCKED（待 Main 新实例原证）**。
- Main 最小交件：本次改动文件与新 hash/diff、真实组件用例命令/红绿原日志、明确没有改保存链的接缝对照；随后新 GUI BF-G01–05 原件。新源、共享文件或依赖有变化必须另冻结，不能覆盖现源红证。
- 收口由独立专家依据同用例审证；本单不改其他 testing/livingdocs，不 commit。

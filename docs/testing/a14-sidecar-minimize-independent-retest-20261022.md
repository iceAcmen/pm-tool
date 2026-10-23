# SM01 最小化保上下文独立复验

> 2026-10-22；平台 trae；独立测试专家。授权原句见[自有计划](a14-sidecar-minimize-independent-retest-20261022-plan.md)。仅本前缀写入；不改产品、不 install/build/GUI/services/credentials/commit，不写共享 livingdocs。

## 1. 有限结论

**SM01 修复候选有限 SOURCE / AUTO PASS。GUI、真实 fresh-handle clean/mixed 旅程 NOT_RUN；不签完整 RA-AI04、实例激活或发布。**

签字对象为 `new/frozen` 的 385 文件源码清单 SHA256 `24e55592a6b573467f8ee5fa7daccc5da24d660fa97f9a63631c07c606af8632`，不是 HEAD、旧 lib 或 Main 当前服务。本次没有发现该有限修复的新增产品 FAIL。原 SM01 产品 FAIL、原 r1/r2/r3 和原 GUI 失败均保留，不改写历史。

| 用例/对象 | 独立结果 | 证明范围 |
| --- | --- | --- |
| 原专家 r3 的逐项复验 | control exit0，A01/A02/A03 各 exit1 | 原源码、原动作、原期望，重现控制绿/三红 |
| 同源旧候选 `old` | control exit0，A01/A02/A03 各 exit1 | 开发开工冻结基底；不是拿并发主树重冻旧失败 |
| 新候选、原测试字节 | control/A01/A02 exit0，A03 exit1 | 原 A03 在读取已卸载节点时设施中断，保留失败，不宣称原件全绿 |
| 同一单行采样适配 `old` | control exit0，A01/A02/A03 各 exit1 | 适配仍能抓原产品缺陷 |
| 同一单行采样适配 `new` | control/A01/A02/A03 全 exit0 | 同动作、同期望，三红转三绿 |
| 独立边界对照 | 旧 3/3、新 6/6，均 exit0 | 真实父子、关闭/ESC/切项目；新版保上下文与当前节点复查 |
| 受影响回归 `new` / `current` | 各 18 文件188/188，exit0 | panel/bridge/确认/投影/capture，独立重新执行，不以开发121自签 |
| `new` / `current` noEmit | 各 exit0 | 完整冻结源码、`--noEmit --incremental false`；tsconfig 排除测试源码，非测试类型检查 |
| SOURCE AST/CSS/原下发审证 | 12 条校验，exit0 | 单一稳定 aside/CopilotPanel、原接线、隐藏样式；非布局引擎/真实焦点证明 |
| GUI / 新 fresh handle clean、mixed | NOT_RUN | 待 Main 新 builder、新实例、新 gateway 本轮句柄；不使用 A12 遗留 undo handle 补 RPC |

`testNamePattern` 排除的 pending/skipped 不算 PASS；每次合同运行只执行1项。旧红的 exit1 是原产品失败，父汇总 exit0 只表示退出码符合预定对照，不把旧红转成 PASS。

## 2. 候选认领与并发范围

基线 `HEAD=origin/main=9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，包 version0.7.4。dirty 候选还须绑定 tracked patch、新文件与源清单。主包 tracked patch SHA256 `fe8cf7361ba5a1b2084ef3e06355599442be5ca90c84ba34c86c33cff8a40bde`；[新文件清单](a14-sidecar-minimize-independent-retest-20261022-selftmp/r1/main-new-sources.json)保留完整指纹。

| 输入 | SHA256 |
| --- | --- |
| old 源清单，384文件 | `c28dfb873bb21ed7956f9c56ae970c05a8284cf38e21c8a2dd9df553f98c5d9b` |
| new 源清单，385文件 | `24e55592a6b573467f8ee5fa7daccc5da24d660fa97f9a63631c07c606af8632` |
| 修后 panel.tsx | `0d2a4560e74adb137084d2e37b34625e4b2e5b1801ec76e72fce5b689ccffe03` |
| 修后 panel.css | `87ca4fc9f0899d87b3103fcc279a791839a23e921de6511a81086d85d9e54246` |
| 新产品回归测试 | `95e4396e2be961e58aaca045299e45ed339e9b883063479d0066e3953e9eee61` |
| 未改 sidecar-portal.tsx | `a3a5e70e459fd74b3454757bcd419e7a2e44b8adce41685dc522dcc494c0ab5d` |
| 原专家测试 | `5c6a6b9df5a00b42a1ee9e8ebf1a8e004065822783fd2faccad6a9418b115821` |
| 自有采样适配，旧/新相同 | `a707115b91dad74bb4d96d8a3d5dc0b5c5719392588045ec74838e0588928d46` |

清单 SHA 是排序对象 JSON 的 SHA，不是 bundle/目录名。`new=开发before冻结+释放三文件`，与开发 after-r2 逐文件相同；没有修改任何产品副本来取得 PASS。原 r3 到开发基底的10份差异为 stage-client、任务导入/表格、文件暂存与 asset-route 既有增量，完整列表见 [scopes](a14-sidecar-minimize-independent-retest-20261022-selftmp/r1/scopes.json)。因此另跑精确原 r3，不把基底差异误报为 SM01 修复。

`current` 是单独冻结/单独回归与 noEmit 的主树域。本轮采样时其 src 与 new 一致、过程主 src 漂移0；current 另带主树 pnpm-lock 指纹。后续并发源码变更不自动继承本结论，须按接缝重测。A13 新增13项原证变化单列，不重冻旧失败、不签这些新增原生 GUI 证据。

## 3. A03 设施纠正的独立判断

**接受为有效设施纠正，不是偷改期望。** 原 L229 在最小化/展开之后找到 checkbox 实例；L233 切到 diagnosis，草稿控件正常卸载；L235/L237 再读旧实例 `.props`，抛 `Unable to find node on an unmounted component.`。旧版 checks=[] 不触发这一读取异常，但后续3项/false/71/未发送值断言会红；新版保留3项后暴露的是设施生命周期错误，不是“读到了错误业务值”。

仅在自有副本把原时点的 props 转为普通值，整文件严格验证只有一次下列机械替换，动作、record、全部 expect/expect.soft 和零确认检查均未改：

```ts
const checks = f.m.root.findAll(node => node.type === 'input' && 'data-copilot-check' in node.props).map(node => ({ props: { ...node.props } }))
```

[新域 diff](a14-sidecar-minimize-independent-retest-20261022-selftmp/r1/new/sampling-only.patch)、[旧域 diff](a14-sidecar-minimize-independent-retest-20261022-selftmp/r1/old/sampling-only.patch)和两域相同适配 SHA 可核。适配旧 control0/三红1、新全0，排除通过降低期望掩盖旧缺陷。另有独立 `fresh-nodes` 用例在新版最小化/展开后及模式往返后**重新查当前节点**，验证s2=false、progress74、未发送文本、消息、最新title/baseline与 openedAt 陈旧提醒；不依赖被冻结的旧节点证明新版保值。

原专家测试及冻结失败未修改；本次新原 A03 的 [stderr](a14-sidecar-minimize-independent-retest-20261022-selftmp/r1/new-A03.stderr.log)、reporter、command exit1 都保留。不能表述成“原字节 A03 已通过”。

## 4. 行为与未覆盖边界

独立真实 React18 PmPanel/CopilotPanel/TaskTable；只 mock 浏览器设施和 transport，合法 fixture 经过实际 project/task schema。原合同使用归档 ask/snapshot/TaskForm payload，唯一 undo handle 为惰性隔离值，transport 拒绝真实或测试 undo。没有 host handler、RPC、模型、业务落盘；正常保存的历史业务事实只由原 GUI/JSON证明，不拿桩证明后端写算法。

AST 验证 `closeSidecar`、`setSelected`、resize、refresh 与旧版完全相同；CopilotPanel 一处、props完全相同、无新增 key。aside 固定为 Fragment 第一子项，`hidden={copilotMin}`；独立循环3次身份不变、零追加请求。PostCSS 检查隐藏 `display:none` 的双类/属性优先级覆盖原 `display:flex`，无重要性覆盖，原 fixed 不入流、body内滚规则保留。

关闭/重开确实卸载本地输入/undo、父模式沿旧语义保留；隐藏时真实 EventTarget 的 Tab 没有被全局 preventDefault，ESC关闭/归焦ref回调/监听移除旧新同绿。展开态带输入/undo切项目：旧新都保留同一个子身份、本地上下文，tasks/projectId/baseline转新项目、零自动写；这是**既有**语义对照，不表示该跨项目本地 handle 可在后端执行。新版隐藏态换项目的 props 接线也由重新执行的产品回归覆盖，不锁旧任务。

补档未确认文本/候选、三条撤销边界、主表单取消/失败/成功、snapshot失败重试、只读来源投影、确认取消等受影响回归均重跑。**hidden祖先结构、CSS、EventTarget与focus mock不替代真实 DOM Tab顺序、activeElement、指针命中、屏幕阅读树、主列实际宽度、滚动或主保存可达。** 这些仍 GUI NOT_RUN，不签“真实焦点/尺寸已验”。

## 5. 命令与环境

macOS Darwin24.6.0 arm64；既有 nvm Node **v22.23.3**；React/renderer18.3.1、Vitest2.1.9、TypeScript5.9.3；pnpm未调用。复用 A12 只读依赖，物理根是 A11/all-closure `.pnpm`；单 fork、`--no-cache`、无增量编译。每次测试 HOME/TMPDIR/XDG_CACHE_HOME/DSH_HOME 在自有前缀，环境白名单没有凭据。

全部26条测试/类型子命令的 **完整 argv、cwd、环境、开始结束、原退出码/signal** 在 [commands.json](a14-sidecar-minimize-independent-retest-20261022-selftmp/r1/commands.json)，可读逐条 shell argv 在 [commands.md](a14-sidecar-minimize-independent-retest-20261022-selftmp/r1/commands.md)。原 stdout/stderr/reporter 和 observations 单独保留；[runs](a14-sidecar-minimize-independent-retest-20261022-selftmp/r1/runs.json)不折叠任何原退出码。

主执行索引（macOS、仓库根、已有 nvm Node22；只索引已执行过程，不能覆盖既有r1）：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/a14-sidecar-minimize-independent-retest-20261022-run.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a14-sidecar-minimize-independent-retest-20261022-run.mjs r1 prepare
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a14-sidecar-minimize-independent-retest-20261022-exec.mjs r1 run
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a14-sidecar-minimize-independent-retest-20261022-source-audit-r2.mjs r1
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a14-sidecar-minimize-independent-retest-20261022-exec.mjs r1 finalize
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a14-sidecar-minimize-independent-retest-20261022-delivery.mjs r1
```

语法检查0；run父0；source-audit最终0；finalize父0。prepare工具异步只返回execution ID，未取得工具末态码，登记 `NOT_CAPTURED`，不编造父0；冻结/对照/末次finalize已独立完整核验。自有 SOURCE 审查初轮因 `includes('pm-sidecar')` 把 chrome/actions/tab 的display混进 aside合同，exit1；仅精确限定 `.pm-sidecar` 类，不改CSS。中间move工具未保留预期目标文件，adapter首次ENOENT exit1、零审证；恢复自有失败代码、保留设施记录与可重现exit1后另行成功。细节见 [设施记录](a14-sidecar-minimize-independent-retest-20261022-infrastructure.md)。未掩掉任何产品或原专家失败。

18文件数量：launch-handshake23、retention12、provenance-panel16、gd-overlay11、form-dirty7、contract-pilot11、stage-client12、tasks-import-confirm9、ask-copilot-b7 4、ask-projection11、capture28、refresh-confirm6、panel-cancel-close5、panel-checklist2、panel-launch5、panel-restore9、copilot-task-fields6、copilot-validate11；合计188。两个域均实际重新执行，不相加为376条不同用例。

## 6. 原证与保护

[原证核验](a14-sidecar-minimize-independent-retest-20261022-selftmp/r1/original-audit.json)：原198文件一致、110/110帧hash一致（本轮未GUI目视）；A12声明512输入/453产物一致；原apply0、三个设施失败1、finish缺freshundo1原样保留。正常TaskForm外改payload/snapshot/完整t1历史/t2/ledger字节对齐；原事件区间无非list undo；展开距expiry212015ms。只说明原时点，不读取或恢复当前旧handle。

原 mixed 前 uncached 完整combo SHA256 `e10bf9b3fd69e2c0a8d744c146362a2e1c235e38a0cb5d6059f74cc692c76cda`，A12 client SHA256 `3bc4a1723f10e8f0393eceb48841007e52e9ebafdc4b37f98dc0a970151bc3b7`；完整唯一loader段与timeOrigin/target一致。**这是旧实例原证，不是修后下发。**

| 保护 client.js | SHA256 | mtimeMs，前后相同 |
| --- | --- | --- |
| 主lib | `966417debf740ac3553db5c901d33261163da2fa68290f4751362b1d0408aa35` | `1792562365978.0774` |
| A11 lib | `279d952a9652eb2dd075c9b449bb0201184c90fe27da3dde94e86efbd8d62219` | `1792600145290.8684` |
| A12 lib | `3bc4a1723f10e8f0393eceb48841007e52e9ebafdc4b37f98dc0a970151bc3b7` | `1792614392266.1296` |
| A13 lib | `7f037fce5115157101afb64cef7b7fd0e470742ac3eb96a11cabe0a43e56ae7c` | `1792618072489.9258` |

[start](a14-sidecar-minimize-independent-retest-20261022-selftmp/r1/start.json) / [finish](a14-sidecar-minimize-independent-retest-20261022-selftmp/r1/finish.json)逐文件保护：main src/lib、A11/A12/A13 lib、A12/A13 src、原r1/r2/r3、全部开发冻结、A12与mixed原证、14,573条物理依赖文件/软链和六处公共缓存。上述不可变根SHA/mtime漂移0；四个自有source冻结漂移0、输入漂移0。

A13原证首轮13项变化集中在 `final/materials/native-import/{csv-invalid,xlsx-invalid}/`；交付末检另新增3项 `final/main/fresh-files/{before-project.json,inspect-state.json,inspect-state.png}`。两次差异分别在finish与delivery-check，均为并发写域见证，不能代Main证明归因或判PASS。本角色未覆盖任何A13文件、未触及3242旧freeze/服务。

未检查/操作正式data/profile/凭据/上游，不把所列根保护扩称全机零污染。完整目录清单SHA（含mtime）与最后保护复核见 [protected-manifests](a14-sidecar-minimize-independent-retest-20261022-selftmp/r1/protected-manifests.json)、[交付末次核验](a14-sidecar-minimize-independent-retest-20261022-selftmp/r1/delivery-check.json)。

交付脚本实际exit0；不可变保护根继续零漂移，SOURCE首轮设施失败重新归档exit1，6份自有脚本语法检查均0，40条命令索引完成。commands.json SHA256 `209df0ca0a36e240c6a607e02f9d2d41a1bcc4ab79c9b03b13ba54f866355488`；protected-manifests.json SHA256 `200791bf07652056434fba3f45f7f8425eababb1bde3e86b47fc030b241cf991`。最后产品/原证/依赖保护时点为 `2026-10-21T22:11:26.188Z`；此后的自有文档状态补记不改变冻结产品结果。

## 7. 释放与 Main 接续

本专家释放自有测试子进程，不持有产品文件、builder、GUI、端口/profile或服务；保留全部冻结/失败，不commit。Main可据本有限SOURCE/AUTO审签继续**唯一新隔离输出**构建；新源码/bundle/宿主/开关/实例/页面身份逐层重新绑定，旧A13实际3242继续原生文件GUI不受影响。

后续按原SM-G01/02：新gateway生成合法三步→明确确认→记录本进程fresh handle→最小化→正常TaskForm人工外改主保存→展开保原undo/输入/草稿→明确mixed undo/重试，另同目标链式clean对照；补真实隐藏层布局/指针/键盘/滚动/主保存可达。必须新fixture/新handle/新完整下发与原始GUI证据，不能RPC补A12遗留句柄。独立专家再判GUI/整项；livingdocs由Main同步。

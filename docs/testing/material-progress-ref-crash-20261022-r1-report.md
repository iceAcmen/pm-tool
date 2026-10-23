# 资料进展引用崩溃独立必要红报告

> 2026-10-22，trae，独立必要红专家，非开发、非 GUI。先行合同已执行，原产品与他人证据未改；本角色 STOP。

## 有限结论

**FAIL_NECESSARY_RED（SOURCE/AUTO）**。真实 React18 DOM 组件实测 7 项：3 控制绿、4 必要红，Vitest 原退出码 **1**。审计退出码 0 仅证明原红/证据/隔离一致，不代表产品通过。

| 发现 | 实测与根因 | 最小范围 |
| --- | --- | --- |
| MPRC-01 / P1：合法引用点击导致资料草稿子树崩溃 | N01 既有资料 index0、N03 新资料 c-2 index1、N04 新文件 c-3 index2，正常作者/正文后真实 `.click()`，均在原组件 `task-draft-materials.tsx:431:69` 抛 `Cannot read properties of null (reading 'checked')`，栈为 `basicStateReducer → updateReducer → updateState → TaskDraftMaterials`。事件回调把 `e.currentTarget.checked` 留在函数 updater 中，React 在 handler 返回后执行它，此时 currentTarget 已清空。 | 仅该组件引用 onChange 的事件值读取时机和必要真实 DOM 回归。 |
| MPRC-02 / P2：只加两条新链接时无法选 c-2 | N02 原组件加两合法 link，上抛信封准确含 c-1/c-2、errors=[]，但 DOM 没有任何 `.pm-prog-ref input`，计划点击未到达；没有 TypeError，外层标记仍在。`refOptions` 的 useMemo 依赖 `session.attachmentOps`；原 OpsSession 对同一数组 push，引用未变，所以普通 rerender 不重算。文件暂存改变 stagedRows 才意外刷新，N03/N04 的三个选项因而可见。 | 同组件 refOptions 必须在真实 journal 变化后重算。仍为原 RA-M06，不增加新 UX/dirty/样式要求。 |

MPRC-01 不是“所有 setState 必然延迟”，也不是文件格式或后端 alias 单因；本轮没有强制 timer、StrictMode、hook mock、手动清空事件或自造草稿状态。React 某次可能 eager 计算，不代表以后安全。C01 真实 SyntheticEvent 内 currentTarget 是 input，返回后两次均为 null；同一 React18 生产 `executeDispatch` 原文在 `react-dom.development.js:9038–9042` 明确置入/清空 currentTarget。`persist()` 不解决这个 dispatch 生命周期问题。

## 用例与原件

| ID | 实际执行 | 判定与未到达边界 |
| --- | --- | --- |
| C01 | JSDOM createRoot，真实 checkbox 两次 click；事件内 checked=true/false、currentTarget 是真实 input；返回后 null/null | 控制 PASS，正确快照事件值的 Probe 可正常更新；Probe 不是产品替身。 |
| C02 | 原 `createOpsSession`：两 link + file + progress，validate/build 保 refs=[c-2,c-3] | 控制 PASS，仅生产会话单信封语义，stageId 只是客户端合法形状，不冒真实上传或落库。 |
| C03 | 原组件两 link + 22 byte 真 stage，不选 refs→追加进展→一次 `addTask`→submissionRef=true 卸载 | 控制 PASS，真 task/三附件/一个 file_asset/字节一致；无 DELETE。不是 GUI TaskForm 主保存或有 refs 旅程通过。 |
| N01 | 通过原 addTask 建合法既有两资料→正常作者/正文→click index0 | FAIL，第一次点击崩，第二次选择/追加/主保存 NOT_REACHED；原已有 task/data 不变。 |
| N02 | 新建两 link→正常作者/正文→计划 click index1 | FAIL，选项缺失，实际 click/追加/主保存 NOT_REACHED。不是设施找错 selector，也不是点击崩溃。 |
| N03 | 新建两 link + 真 stage c-3→正常作者/正文→click index1（c-2） | FAIL，三个 checkbox 初态全未选，点击即崩；文件 click/refs追加/主保存 NOT_REACHED。 |
| N04 | 同合法种子，先 click index2（文件 c-3） | FAIL，同一错误；c-2 click/refs追加/主保存 NOT_REACHED。 |

N03/N04 原始链分别为：POST 201（22 byte `qa-note.md`）→点击前 staging 两文件、三个 refs 选项可见→真实 click→组件 render TypeError→ErrorBoundary 记录并卸载本专家外层标记子树→原 cleanup 调生产 DELETE 200 `{ok:true,removed:true}`→staging 清空。点击前后 domain/data 全相等，task/file_asset 零，主保存次数 0。**暂存清理是崩溃引发正常卸载清理的结果，不另判 cancel 路由缺陷，也不应靠停 cleanup 掩盖崩溃。**

本专家外层 `data-qa-shell`/ErrorBoundary 只采集组件失败，不是真 PM shell；未挂载 parent TaskForm。C03 的 title/description 是合法单 `addTask` 参数，不冒称在 TaskForm 中填了它们。Main 的旧 U4r2/3257 真 PM shell 消失、reload 恢复和重复点击仍属其在途 GUI 原证，本件未冻结、未写、未审签 `MaterialRemainingR1`。

- [计划合同](material-progress-ref-crash-20261022-r1-plan.md)、[测试原件](material-progress-ref-crash-20261022-r1-cases.test.tsx)、[运行器](material-progress-ref-crash-20261022-r1-run.mjs)。
- [原 Vitest JSON](material-progress-ref-crash-20261022-r1-selftmp/r1/vitest.result.json)、[原 stdout](material-progress-ref-crash-20261022-r1-selftmp/r1/vitest.stdout.txt)、[原 stderr/栈](material-progress-ref-crash-20261022-r1-selftmp/r1/vitest.stderr.txt)、[命令/PID/环境/退出码](material-progress-ref-crash-20261022-r1-selftmp/r1/vitest.command.json)。
- [N01 既有资料](material-progress-ref-crash-20261022-r1-selftmp/r1/observations/4-N01/observations.json)、[N02 新链接缺选项](material-progress-ref-crash-20261022-r1-selftmp/r1/observations/5-N02/observations.json)、[N03 c-2 点击/真stage](material-progress-ref-crash-20261022-r1-selftmp/r1/observations/6-N03/observations.json)、[N04 file 点击/真stage](material-progress-ref-crash-20261022-r1-selftmp/r1/observations/7-N04/observations.json)；各 case 的 raw-stage 保留上传字节/sidecar。
- [结构化审计及原件 hashes](material-progress-ref-crash-20261022-r1-audit-r1.json)、[终核](material-progress-ref-crash-20261022-r1-selftmp/r1/close.json)、[本轮封存索引](material-progress-ref-crash-20261022-r1-selftmp/r1/sealed-evidence.json)。封存索引针对运行轮原件，报告/后补审计在轮外，不覆盖原轮。

## 候选与设施

- 完整自有冻结旧 `/private/tmp/pmtool-u4-closure-20261022-r2/packages/dsh-pm-tool` 的 src/scripts/locale/配置共 **511 输入文件**，全部逐字比对；不复制/使用 lib/coverage/artifacts。基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` 只读引用 U4 delivery-boundary；原 manifest/父相对 patch/newFiles/hash 同时复制认领，未运行 Git。
- [候选](material-progress-ref-crash-20261022-r1-selftmp/r1/candidate.json)：
  `task-draft-materials.tsx` SHA256=`66af8221d089a2ad65fa4d831be218c4a78d3299c23239cfaf750497c4edc2ae`；
  `b2-ops.ts` SHA256=`8a320006116558f4627bf612913bb7e7d661340980cbf7baf7492f343f4fc8e4`。
  两文件及 stage-client/staged-lifecycle/task-materials/asset-route 与主树本轮前后相等。**core/tasks.ts 与主树已不同**（Cycle 在途后继），C03 保存控制只认旧 U4 副本，不签当前后继 tasks.ts，也不阻断/锁其工作。
- 原 U4 完整依赖普通复制 **13579 文件/1030 内部软链**；既有 Main 兼容 DOM 设施完整复制 **1595 文件/2 内部软链**。均零共享 inode、零外链；[独占核验](material-progress-ref-crash-20261022-r1-selftmp/r1/dependency-ownership.json)。
- DOM 设施来源为先前 Main 已授权建立的 `/private/tmp/pmtool-f02-dom-deps-20261022`；本批只复制、不安装，锁 SHA=`15fa558af385790ad5b7a1778d9e92429f8be65d48f528c2997009b49524b973`。React/ReactDOM **18.3.1** 同一实例 alias，JSDOM **25.0.1**，Vitest **2.1.9**，Node **v22.23.3**，macOS；项目 pnpm11.28.5 仅约定，本批没执行 pnpm。
- 原 U4 React18/ReactDOM19 import 探测原 exit **1**，错误 `Cannot read properties of undefined (reading 'S')` 保在 [facility-react-dom19.json](material-progress-ref-crash-20261022-r1-selftmp/r1/facility-react-dom19.json)，**只计设施兼容性失败，不计产品红**。随后真实 DOM 控制和三条崩溃在兼容 React18 实例成立。
- File 为真实 JSDOM File；FileList array-like 注入只代表 chooser 交付，不是 native chooser。fetch 仅进程内 adapter 调原 asset-route、真实 Cordis/JsonStorage/DomainFacility，零网络；未 mock 产品 onChange、OpsSession、状态 hook、验证/保存/回收逻辑。
- no-cache/singleFork/min-maxWorkers=1/fileParallelism=false，白名单环境只含自有 HOME/TMP/cache/DSH_HOME/data/files；不继承 key/正式根/真实模型。原 U4 src/scripts/deps/lib、DOM deps/lock、主 lib 终核无字节/文件/链接/inode差异，主七个读取接缝文件前后未漂移。此保护范围不外推全盘零变；没有冻结 Cycle 三文件/两测试、ATF 在途或 Main GUI 证据。

## 最小开发交接与复验

1. 产品修改仅 `src/client/shared/task-draft-materials.tsx`：引用 onChange **在事件 handler 内同步快照 checked 布尔值**，updater 只用该布尔值与 prev，不保留事件对象或从迟到 DOM 节点重读。不要用 persist、setTimeout、永久 currentTarget mock 或吞 TypeError 改成假绿。
2. 同文件 refs 候选在 journal 变化后可靠重算；可取消此处没有收益的 memo，或以已存在的真实 revision 信号作依赖。保原 alias/journal/一次主保存语义，不需要改 OpsSession、core/tasks、stage 路由、cleanup、全局 dirty/错误壳/样式。
3. 仅新增/补同域真实 DOM 引用回归；原 N01..04 Oracle 保留，修后必须实际选 c-2+file、追加信封 refs 精确、单主保存真实 at-ID/字节正确，不能只断“不抛”。保无 refs 保存、正常取消 cleanup、submissionRef 成功卸载不 DELETE 控制；相关取消/成功生产测试复验由后继独立专家安排。
4. Main 另派开发和不同独立复验专家，修后 SOURCE/AUTO 及统一新候选构建仍分门；Main 唯一 builder/GUI 接续原 RA-M06/J03，旧 U4r2 服务不会因源文件修复自动生效。本专家不 build、不跑全回归、不新增 GUI 步骤、不签修后或整项 PASS。

## 命令、退出码与停止

运行环境 macOS + Node22；从仓库根执行：

```sh
env -i HOME=/Users/bytedance PATH=/Users/bytedance/.nvm/versions/node/v22.23.3/bin:/usr/bin:/bin \
  /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check \
  docs/testing/material-progress-ref-crash-20261022-r1-run.mjs
env -i HOME=/Users/bytedance PATH=/Users/bytedance/.nvm/versions/node/v22.23.3/bin:/usr/bin:/bin \
  /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node \
  docs/testing/material-progress-ref-crash-20261022-r1-run.mjs r1
env -i HOME=/Users/bytedance PATH=/Users/bytedance/.nvm/versions/node/v22.23.3/bin:/usr/bin:/bin \
  /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node \
  docs/testing/material-progress-ref-crash-20261022-r1-audit.mjs r1
```

依次退出码 **0 / 1 / 0**。运行器内部原 ReactDOM19 探测 exit1、实际 Vitest exit1，未吞失败；所有测试均执行，无 skipped。runner PID **47649**、Vitest 子 PID **48069** 均已退出，未停任何服务。已完成先行报告，不触产品、其他报告/livingdocs、Git、服务、上游、网络、GUI、真实模型/key/正式 data；**STOP**。

最终另用 Node22 对 `sealed-evidence.json` 的每个普通文件重算 bytes/SHA256、每个软链重读 link：**16764 条全部一致，exit0**。输出为 `{"sealedEntries":16764,"unchanged":true,"exit":0}`；此终核不重跑产品、不改封包，也不将原 Vitest exit1 改绿。

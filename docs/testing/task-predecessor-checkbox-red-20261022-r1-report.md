# 前置复选框崩溃独立必要红报告

> 2026-10-22，trae，独立测试先行，非开发、非 GUI。**FAIL_NECESSARY_RED / RELEASE_STOP**。本角色交开发与不同专家复验，STOP，不提交、不签修后或整项 PASS。

## 结论与最小范围

**TPC-01 / P1 确证**：真实 `TaskForm` 编辑已有任务，在主保存前点击前置复选框使表单子树卸载。兼容真实 ReactDOM r3 实际 **7 项：2 控制绿、1 控制失败、4 目标必要红；Vitest exit1**，没有 skipped。不能概括“全部控制绿”。

- N01：初始合法 t1.predecessorIds=[t4]，t4 无前置；真实编辑 t4、input 改标题、click t1，未 submit 即崩。
- N02：已有 t4.predecessorIds=[t2]，改标题、真实反选 t2，未 submit 即崩。不是成环触发专有问题。
- N03：已有 t4 无前置，首次 click t2 **成功**、已选1/FormData=[t2]；rapid 标题+搜索 input 后 click t1 崩。不能因为第一次 eager 更新成功就断言安全。后续取消 t2/t1 **NOT_REACHED**。
- N04：已有 t4 选 t2，rapid 标题+搜索 input 后 click t1 崩；取消/重选 t2 **NOT_REACHED**。

四条捕获均为 `Cannot read properties of null (reading 'checked')`，栈：

```text
panel.tsx:2938:41
basicStateReducer -> updateReducer -> updateState -> useState
TaskForm (panel.tsx:2530:39)
```

冻结源最小产品位置 `packages/dsh-pm-tool/src/client/panel.tsx:2936–2940`：`setCheckedIds(prev => ...)` 把 `e.currentTarget.checked` 留到 React updater。C01 真实事件内 currentTarget 是 input、选/取消值 true/false，dispatch 后 null/null；没有 timer、手清事件、hook mock 或自造状态模型。**本轮没有修产品再自验**。

交开发仅建议这个 handler 的最小差异，非本角色已实施：

```diff
- onChange={e => setCheckedIds(prev => {
+ onChange={e => {
+   const checked = e.currentTarget.checked
+   setCheckedIds(prev => {
      const next = new Set(prev)
-     if (e.currentTarget.checked) next.add(row.task.id); else next.delete(row.task.id)
+     if (checked) next.add(row.task.id); else next.delete(row.task.id)
      return next
- })}
+   })
+ }}
```

updater 只使用同步布尔快照、稳定 row ID 和 prev；不依赖 persist、不捕获晚到 DOM checked、不吞 TypeError，不改资料 refs/cleanup/服务端循环逻辑/renderer/样式/schema。实际变量为 **checkedIds/setCheckedIds**，不是派单疑似名 setPredecessorIds。

**TPC-02 / 单列控制失败，交 Main 裁范围**：C02 真实已有 t4 选 t2，搜索“候选任务1”后，footer 仍“已选 1 项”，但 FormData 已为空。`panel.tsx:2925` 隐藏选中 checkbox，submit `:2633` 从 DOM FormData 取集合，可能使隐藏关系丢失。r3 已实际证到搜索后 FormData 丢项，**未执行 submit/取消**，没有证明持久化已经被清；不是 null checked 根因，也不混入 TPC-01 修复。Main 应另认领合同/先行缺陷处置，不由本专家旁改产品或扩范围。

## 测试与原件

| 用例 | 实际结果 | 边界 |
| --- | --- | --- |
| C01 | PASS，真实 React18 createRoot 选/取消，同步快照准确、dispatch 后 currentTarget=null | Probe 只作设施控制，不代实际 TaskForm |
| C02 | FAIL，初始选项正确、搜索隐藏后 FormData=[]/footer1/无异常 | 搜索恢复与干净取消未到达，单列 TPC-02 |
| C03 | PASS，实际 TaskForm 连续标题与搜索输入，最终标题准确、表单存在、零调用 | 非保存/GUI通过 |
| N01–N04 | FAIL，上述四条真实 TaskForm null checked | 所有后续未到达动作保留，不冒修后选取消已验 |

所有 7 例：`calls=[]`（run/fetch/onSaved/onCancel/onChanged/onError 都未触发），fixture 前后 SHA 一致。产品例 Task 记录经原 `taskWriteSchema` 校验，ID/项目/初态关系合法、无初始环；静态输入记录不模拟状态、不冒原 F5 数据副本。**本轮不接持久化后端，不写业务库**；零业务写来自未 submit 的调用边界，加 Main 原业务 roots 对照，不冒 JSON 落盘回读。

- [先行合同](task-predecessor-checkbox-red-20261022-r1-plan.md)、[唯一源测试](../../packages/dsh-pm-tool/src/client/task-predecessor-refs-dom.test.tsx)。
- [r3 原测试 JSON](../../reports/all-pending-evidence-20261021/TaskPredCheckboxRedR1/r3/vitest.result.json)、[stdout](../../reports/all-pending-evidence-20261021/TaskPredCheckboxRedR1/r3/vitest.stdout.txt)、[完整 stderr/栈](../../reports/all-pending-evidence-20261021/TaskPredCheckboxRedR1/r3/vitest.stderr.txt)、[命令/PID/白名单环境/退出码](../../reports/all-pending-evidence-20261021/TaskPredCheckboxRedR1/r3/vitest.command.json)。
- [N01](../../reports/all-pending-evidence-20261021/TaskPredCheckboxRedR1/r3/observations/4-N01/observations.json)、[N02](../../reports/all-pending-evidence-20261021/TaskPredCheckboxRedR1/r3/observations/5-N02/observations.json)、[N03](../../reports/all-pending-evidence-20261021/TaskPredCheckboxRedR1/r3/observations/6-N03/observations.json)、[N04](../../reports/all-pending-evidence-20261021/TaskPredCheckboxRedR1/r3/observations/7-N04/observations.json)、[C02](../../reports/all-pending-evidence-20261021/TaskPredCheckboxRedR1/r3/observations/2-C02/observations.json)：每步 HTML/输入/集合/计数/错误/调用/fixture。
- [审计](task-predecessor-checkbox-red-20261022-r1-audit.json)逐例保完整 component stack、步骤和未到达边界，审计 exit0 **不代表产品通过**。

## 候选与设施边界

- 原 `CombinedRepairR1/r2` 基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`、107 声明、515 输入、version0.7.4，从 Main 原件只读认领；[本轮 candidate](../../reports/all-pending-evidence-20261021/TaskPredCheckboxRedR1/r2/candidate.json)与原 tracked diff/newFiles/source hashes 同存。源 SHA=`fa07af612db1546e8df66cb31fb081087eb8aefcf60fd58d8484dca6664a0947`。
- 唯一新源 test SHA=`06b0de03361b8003f101595be145e1c645b5b02666e08a0ffa093e6d00246e4f`。主树并行新 dirty/ReportExportRedTest 不锁、不回退；本结果只绑定旧冻结源，不给并行修后 PASS。
- 实际完整 TaskForm 和所有子组件保留；[测试 transform](../../reports/all-pending-evidence-20261021/TaskPredCheckboxRedR1/r2/virtual-adapter.diff)仅追加 `export { TaskForm }`，虚拟 SHA=`4d5f1d438b91aee026966ed89b5ae8979dedac2d79b72b4b2d45f7ebbffd219f`。自有虚拟结果仅供 diff/sha，运行 import 原冻结 panel，经 Vitest transform 导出；未改原文件或暴露生产 API。
- 原项目依赖独占复制 **13579文件/1030内部软链**，MaterialRefDevR1 DOM 副本 **1595文件/2内部软链**，逐字相等、零共享 inode、零外链。DOM lock SHA=`15fa558af385790ad5b7a1778d9e92429f8be65d48f528c2997009b49524b973`；React/DOM18.3.1、jsdom25.0.1、Vitest2.1.9、Node22.23.3、macOS，不 install/pnpm/build/noEmit。
- r1 原 exit2：adapter diff stdin 得0而期待1，产品 **NOT_RUN**，原设施错误保留；后用自有虚拟文件差异生成。
- r2 原 Vitest exit1：1绿6失败，真实 lucide 原依赖读取另一 React dispatcher，`useContext null`，产品点击 **NOT_REACHED**；只计设施失败。r3 **仅配置 inline 原 lucide-react** 让其经 Vite 同一 alias，不 mock 图标或 hook，源/test/依赖均未改。
- 原 ReactDOM19 import 兼容失败作为既有设施原件引用保存，没有冒本轮重跑。r2 源/脚本/deps/lib/MaterialRefDOM/主lib/package/lock/唯一test保护0，r3借自有r2未写；封存三轮指纹核验0，不外推全盘或并行产品不变。

## Main 原 GUI 只读审证

加载原件 `CombinedGuiR1/loaded-binding.json` 完整下发 SHA=`14414cd388b1c638a4c75863ea1f26972eab88d48f696b3d330d6b48785516f1` 已与 `loaded-complete.js`重核；插件 compiled SHA=`09219cf81820294161dbdbdced09e73094b000a7d7e1d2e5b8c42f399fabb0db` 按 Main binding 只读引用。父 candidate 的 runtimeLoaded:false 为冻结时历史，真实加载按后来的 binding，不覆原。

原 `25-o3-console-events.json` 两条 error 含完整 TypeError/TaskForm 栈和 `slot entry crashed in 'main'`；实际 bundle **49299:36** 是 `if (e.currentTarget.checked)`。原 20r2 请求+响应证明 `/pm task update t-0001 {"predecessorIds":["t-0004"]}` 合法成功。独立目视原23图：PM工作台/已有任务编辑和改名可见；原24图仅宿主侧栏、主区为空。**同源崩溃对应成立**，不是仅口述、HTTP200 或离线替 GUI。

原21→22r2只有 `data/session_projcache/sessions/...json` 宿主会话缓存变；原23→24所有 roots 零变，`data/pmtool/`/files/backups业务根均零变。原运行器 businessDelta 曾未排宿主缓存，审计新增 corrected 字段解释，不洗原字段。明确名单16原件前后与最终重核一致，Main整根仍在途、不封/覆盖；不签三次完整GUI、修后或全部O3通过。资料refs J03与CF循环原因已修属另外门，本bug在submit前，绝不混。

## 命令与交接

运行环境 macOS + nvm Node22.23.3；从仓库根执行，均白名单 HOME/PATH：

```sh
env -i HOME=/Users/bytedance PATH=/Users/bytedance/.nvm/versions/node/v22.23.3/bin:/usr/bin:/bin \
  /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/task-predecessor-checkbox-red-20261022-r1-run.mjs
env -i HOME=/Users/bytedance PATH=/Users/bytedance/.nvm/versions/node/v22.23.3/bin:/usr/bin:/bin \
  /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/task-predecessor-checkbox-red-20261022-r1-run.mjs r1
env -i HOME=/Users/bytedance PATH=/Users/bytedance/.nvm/versions/node/v22.23.3/bin:/usr/bin:/bin \
  /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/task-predecessor-checkbox-red-20261022-r1-run.mjs r2
env -i HOME=/Users/bytedance PATH=/Users/bytedance/.nvm/versions/node/v22.23.3/bin:/usr/bin:/bin \
  /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/task-predecessor-checkbox-red-20261022-r1-followup.mjs
env -i HOME=/Users/bytedance PATH=/Users/bytedance/.nvm/versions/node/v22.23.3/bin:/usr/bin:/bin \
  /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/task-predecessor-checkbox-red-20261022-r1-followup.mjs r3
env -i HOME=/Users/bytedance PATH=/Users/bytedance/.nvm/versions/node/v22.23.3/bin:/usr/bin:/bin \
  /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/task-predecessor-checkbox-red-20261022-r1-audit.mjs
```

退出码依次 **0 / 2 / 1 / 0 / 1 / 0**。r2 runner66429/子67208，r3 runner67846/子67865均结束；观察等待进程66669也已结束，未停服务。完整JSON/console/error保真，未build/noEmit/全verify/GUI/真实模型/key/vendor/data写。接手曾只读 `git status --short`，与“无git”严格口径有偏差，本轮除此未执行Git，不fetch/commit/push/tag/stage，明确披露不冒零Git调用。

Main 下一步：派非本测试角色开发 TPC-01 最小 handler + 必要回归，**不同独立专家**先复验原 N01–N04 到完整选/取消/rapid旅程及控制，再 Main唯一新冻结/构建/受影响完整回归/真实3260后继GUI。TPC-02另裁范围、保原红，不能因TPC-01局部修绿关闭该失败。当前发布/最终普通commit仍 STOP，父任务尚未完成；本角色不跟进产品后自验。

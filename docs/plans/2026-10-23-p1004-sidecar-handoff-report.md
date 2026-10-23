# P1004 限定修复开发交付与 Skill 试点记录

> 本文件记录开发侧输入、根因、精确增量、实际红绿与交付边界，供 Main 重新认领并交独立测试专家复验。不是独立 PASS、GUI 通过或父单完成声明。

## 1. 交付对象

平台 `trae`，开发角色，2026-10-23；授权与文件锁见 [计划](2026-10-23-p1004-sidecar-handoff-plan.md)，有效合同是 [独立报告 §6](../testing/p1-projection-refresh-gui-review-20261023-r1.md#6-exact-remaining--最小修复复验合同)。父授权普通 commit 仍由 Main 收齐原门后处理，本子单没有 Git 写。

**产品仅改** `packages/dsh-pm-tool/src/client/panel.tsx`：+15/-5，相对本次开工 dirty 字节的 [精确补丁](2026-10-23-p1004-sidecar-handoff-green-r2-delta.patch)。不是 HEAD diff 全部认领，也没有覆盖其它在途改动。

**新增回归** `packages/dsh-pm-tool/src/client/panel-sidecar-task-handoff.test.tsx`：252行，真实 PmPanel、CopilotPanel、DrawerPanel、TaskForm；只替身 DOM 设施与命令传输。没有 helper 镜像、私有导出变换、模型重发或正式业务写。

**自有文档/设施**仅 `docs/plans/2026-10-23-p1004-sidecar-handoff-*`：plan、run、report、逐轮 source/receipt/stdout/stderr/observations、baseline、delta、vendor-final 日志与 seal。完整新增清单与 SHA 见 `seal.json` 的 evidence，临时输入根见各 receipt；全部只读保留，不清理原件。

## 2. 根因与最小实现

红前先建真实入口回归，红后比较三条假设：

| 假设 | 可证伪预期 | 实际 |
| --- | --- | --- |
| 打开入口没有让出副驾交互层 | 正确任务/焦点已出现，副驾仍 hidden=false/display:flex | 两次有效红均成立；真实 CSS 中副驾z60、抽屉z30，未改CSS |
| 目标或焦点选错 | 实际字段/activeElement不是同t6 | 未成立：标题、负责人/47与title autoFocus正确 |
| ESC监听冲突造成原失败 | 原ESC会卸载副驾或归焦错误 | 当前DOM控制项原本绿；不把它当新增确证缺陷，不推断原pointer命中栈 |

根因是副驾投影入口直接调用通用 `openRecord`，只打开抽屉，没有转换副驾可见状态。修复只在副驾有效 task 入口记录临时 handoff，抽屉存在时让同一副驾 aside `hidden=true`，不显示最小化标签；最终抽屉关闭恢复显示并清 handoff。交接期间停用副驾 ESC 监听，继续沿用 DrawerPanel capture/dirty 守卫、TaskForm autoFocus、既有 opener 归焦。

未修改通用 `openRecord`、TaskForm写/取消逻辑、DrawerPanel、sidecar-portal、CSS、上游或全局z-index。不会由普通任务表入口触发新让层；同一副驾子树不重挂载，旧答/最新投影/未发送输入保留。

## 3. 指纹与隔离

HEAD 前后均 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，dirty候选不能用HEAD替代。

| 文件 | 本次输入SHA256 | 交付SHA256 |
| --- | --- | --- |
| panel.tsx | `581f2882323e729afa7f7f5b7ff40e73a8a9831c2c30b9a263baad74fc7f521d` | `a58e21657daa79d41255a4e1fd929b8d084101fdf8b7a236eaf9c0205d08247d`（191668B） |
| 新test | 红r3/r4均使用右值 | `1e1e6bf1586ff32f3dc8526e904707b7159bb5b4c27b9f67e299161231e6e64b`（12325B） |
| sidecar-portal.tsx（只读） | `e2e9054e9ad0d7a7e9f3c0020760a2c48a8c477ae44af6b01c2a509e8e4204dc` | 同输入 |

每轮独占新 `/tmp/pmtool-p1004-sidecar-handoff-*`：复制407输入（src+package+lock），原依赖只读链接；DOM轮用既有 `.tmp/widget-poc` React/ReactDOM18.3.1、jsdom25.0.1，lucide由Vitest内联变换以保持同一React身份；renderer旧专项使用插件既有React18.3.1。配置/cache/temp/JSON均在独占根，无 pnpm wrapper/install/build。

逐轮 source 记录实际输入与依赖读链接，全部 `inputDrift=[]`。seal对红r4→当前仅panel变化、绿r2→当前源零漂移再核。依赖清单只声明路径及部分package指纹，不冒所有依赖字节/全盘零污染。未访问114/521 private冻结入口、产物、活库或运行服务；工具栈显示 `/private/tmp` 是新自有 `/tmp` 的macOS规范化路径，不是旧冻结目录。

## 4. 实际验证

运行环境 macOS，Node `v22.23.3`，Vitest `2.1.9`；pnpm约定11.28.5，本角色未调用。以下均从仓库根执行，完整argv/cwd/exit在同标签receipt，不覆盖失败。

```sh
cd /Users/bytedance/Projects/dsh-pm/pm-tool
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p1004-sidecar-handoff-run.mjs red
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p1004-sidecar-handoff-run.mjs red-r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p1004-sidecar-handoff-run.mjs red-r3
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p1004-sidecar-handoff-run.mjs red-r4
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p1004-sidecar-handoff-run.mjs green red-r4
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p1004-sidecar-handoff-run.mjs affected
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p1004-sidecar-handoff-run.mjs green-r2 red-r4
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p1004-sidecar-handoff-run.mjs affected-r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node packages/dsh-pm-tool/scripts/verify-external-skills.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/plans/2026-10-23-p1004-sidecar-handoff-run.mjs
git diff --check -- packages/dsh-pm-tool/src/client/panel.tsx packages/dsh-pm-tool/src/client/panel-sidecar-task-handoff.test.tsx docs/plans/2026-10-23-p1004-sidecar-handoff-plan.md docs/plans/2026-10-23-p1004-sidecar-handoff-run.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p1004-sidecar-handoff-run.mjs seal
```

| 标签 | 实际退出码/结果 | 精确意义 |
| --- | --- | --- |
| red | 1，7设施失败 | lucide外部React与DOM React身份不一致，useContext异常；不是产品红 |
| red-r2 | 1，7设施失败 | 缺jsdom CSS.escape/scrollIntoView设施；只修新test，保日志，不改产品 |
| red-r3、red-r4 | 各1，6红1绿 | 同一未修panel真实打开后副驾display:flex；title autofocus正确，ESC/归焦控制绿 |
| green、green-r2 | 各0，7/7绿 | 真实直接取消/顶关闭/ESC、dirty确认取消保稿/明确放弃、主save、重复交接与旧卡/最新值/归焦 |
| affected、affected-r2 | 各0，3文件22/22绿 | SM01 retention12、error-prefix5、cancel-close5；原误列不存在的drawer-focus.test.ts未执行、不计覆盖，r2清单已纠正 |
| vendor静态（开工/交付） | 0 | 注册vendor静态门，不是独立验收；最终stdout与逐13件SHA/bytes在seal |
| `node --check` / `git diff --check` | 0 / 0 | 自有设施语法/已跟踪增量行尾检查，不是产品构建或类型检查 |
| seal | 见最终seal实际 `ok` 与命令终码 | 指纹/证据封存，不是专家签字 |

raw stdout/stderr全部保留：有效红/绿有原TaskTable key警告；旧renderer专项另有MaxListenersExceededWarning。未删警告、不修改其它代码。首次轮exec工具返回异步ID后，write_stdin schema不一致（要求execution_id）无法poll；通过已落盘receipt观察结束，后续最终轮均核收据，不留未决测试进程。

## 5. Skill试点与双轴自查

锁定vendor `mattpocock` commit `49dd158d1076134a641b33efb035946536778336`，先读external-skills全文/manifest，static exit0，逐13件SHA/bytes MATCH后 `vendorIntegrityVerified=true`。不是工具毕业。

| 自动路由 | 实际增益 | 与高位规则冲突的跳过 |
| --- | --- | --- |
| rootCause→仅diagnosing-bugs | 先造真正入口红，设施红与产品红分开，三假设有反证；诊断期间不改产品 | 不运行HITL脚本/浏览器/服务/Git bisect；不删除临时失败原证 |
| 根因已明feature→tdd | 沿同一真实接缝红→最小+15/-5→两轮绿，保读写边界与历史 | 接缝已经负责人/专家明示，不重复确认；无codebase-design/GLOSSARY则跳过；不因七个同接缝保护断言另拆新功能 |
| delivery→code-review | 用本次dirty输入精确delta分别查Standards/Spec，不认领HEAD已有全量diff | 不运行setup；不向用户再问fixed-point；未提供子代理执行工具，双轴由本开发自查而非伪称并行独立审查 |

brainstorming已比较临时隐藏/全局调层/关闭重建三方案；writing-plans已列文件级计划并持续更新状态。既有授权不再问常规确认、不执行skill的commit/worktree/整包回归/livingdocs收尾，理由和范围在计划§1。

**Standards：** 产品增量局限panel，没有全局门户/层体系/业务扩展；复用hidden规则、既有焦点/守卫而非新helper。发现执行器错误列不存在test，已改清单并加缺文件硬检查、r2实际22绿。其余未见本增量违反已生效代码规则；不把上游smell启发式当硬门。

**Spec：** task入口让层、原子树/旧答/最新投影/历史保留、直接取消/关闭与归焦在DOM层有证。无新按钮、新业务写或模型调用。真实pointer/bbox/可见焦点/Tab-Enter-ESC旅程与样式/UX仍未测，不从DOM推GUI。

越权检查全部“否”：installer/setup、home/全局配置、活库写、上游改、独立自签、未授权删除/覆盖/推送、联网抓vendor、复制改vendor、直接触发隐藏依赖、调用未vendored skill、重建HITL脚本。仅写授权panel/新test/本前缀与自有tmp。

**测试专家结论：本角色不填写。** 原RA-P1004首次遮层FAIL保留；新源码仅开发交付，等待Main新候选整包构建/GUI采证、独立专家复验。不登记MANUAL_PENDING，不签ordinary commit或父总门。

## 6. 未覆盖与released/STOP

DOM证明生产hidden/display、真实autoFocus/事件/dirty/cancel/ESC/opener与同子树状态；jsdom无真实layout/hit-test，`.click()`不能复现pointer被遮的浏览器命中/timeout，也不自动执行浏览器Tab/Enter默认行为。数据是schema合法内存snapshot/传输替身，不证明真实DB/单外部模型请求计量或本机服务已加载。

Main唯一重新认领本delta+新test和实际输入/产物/实例，再按原专家§6采首次打开无遮挡/可见焦点→直接现有取消/顶关闭→回旧卡；补原B8 Tab/Enter/ESC/归焦与未提交取消/主save/只t6主写保护原证。新test无需私有export适配，但Main普通全测须沿既有DOM独立依赖/config分组纳入，不能因未声明jsdom依赖而假称已跑。本角色未build/install/noEmit/full verify/GUI/服务/Git写，旧114 GUI不继承为本修已激活。

**released / STOP：** 封存终码确认后释放panel、新test及本前缀所有自有写面；不持builder、GUI、lib、port/profile/data或Git锁，不再扩写。Main继续原父单；本子任务不commit/push/tag/release、不结束父目标、不清理tmp或任何他人成果。

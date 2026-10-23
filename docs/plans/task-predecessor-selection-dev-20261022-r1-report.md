# TaskPredSelectionDevR1 开发交回

> 本文件记录前置选择器两处修复、开发自测原证与未闭边界，供 Main 和不同独立专家接续；平台 trae，2026-10-22。不是独立验收报告，不签 PASS，始终 `RELEASE_STOP`。

## 授权与范围

- 父派单原句：“父多角色/确证修复持续授权，全部验完普通commit，无push/tag/service。”本子角色仅开发，不独立验收；“只业务write src/client/panel.tsx，自有TaskPredSelectionDevR1 docs自有报告，Main统一livingdocs”“不要install/build/sharedcache/noemit默认/Gitwrite/GUI/key/vendor/正式data/上游”。
- 执行既有 [闭环计划](2026-10-22-task-predecessor-selection-closure.md)，已读 AGENTS、collaboration 最新授权、四 livingdocs 当前接续、需求/决策/知识库/问题档案及两独立必要红报告。主树其他合法在途修改保留，不 fetch/pull/stage/commit/push/tag。
- 已加载 brainstorming / writing-plans，直接采用父任务已批准的最小方案与计划，不重复确认、不另创方案、不按技能通用提示中途 commit/worktree；本次明确禁止 vendor，不加载或执行第三方 skill。
- 唯一业务修改为 `packages/dsh-pm-tool/src/client/panel.tsx`；自有 runner/audit 和本报告归开发。独立测试、`docs/testing/`、livingdocs、renderer、ask、后端、CSS/API/schema 均未编辑，不新增 UI 或隐藏字段。

## 两处修改

1. checkbox 事件中同步读取 `const checked = e.currentTarget.checked`；函数式 updater 只用该布尔值、既有稳定任务 ID 与 `prev`，不晚读 event，不 persist、不吞异常。
2. 主 submit 改为 `Array.from(checkedIds)`；搜索只影响显示。其他字段仍按原逻辑取值，不加 dummy hidden field，不改后端显式 `[]` 清空语义。

[作者差异](../../reports/all-pending-evidence-20261021/TaskPredSelectionDevR1/r1/product.diff)为两段 `+10/-7`；逆向移除两处修改后的整份 panel SHA 与原红源相等，故未把已有 panel 历史差异认领为本次修改。

## 输入与设施

- 基线提交 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`；version `0.7.4` 仅作输入，不表示发布或已加载。
- 旧 panel SHA `fa07af612db1546e8df66cb31fb081087eb8aefcf60fd58d8484dca6664a0947`；修后 SHA `581f2882323e729afa7f7f5b7ff40e73a8a9831c2c30b9a263baad74fc7f521d`。
- [candidate](../../reports/all-pending-evidence-20261021/TaskPredSelectionDevR1/r1/candidate.json)与 [完整输入清单](../../reports/all-pending-evidence-20261021/TaskPredSelectionDevR1/r1/complete-inputs.json)记录当前后继源独占副本：实际 **519 个包输入，其中 402 个 src 输入**。不是 519 个业务改动，也不冒所有 113 等预数或全包审签。
- [相对旧设施的 source 合并清单](../../reports/all-pending-evidence-20261021/TaskPredSelectionDevR1/r1/source-merge-vs-old.json)：新增原隐藏提交测试、独立 ask 鉴权测试、报告摘录测试；改变 panel、ask、报告 renderer；没有移除。这些并行合法输入不是本角色修改，不因存在于冻结源就宣称本角色测了它们。
- 原七测试 SHA `06b0de03361b8003f101595be145e1c645b5b02666e08a0ffa093e6d00246e4f`，原五提交测试 SHA `ff3897e963641159ffd6d59e9bf0a8a2d8c52631857b630dcc9470e2437b1988`；原件只读、原样复制执行，无 oracle 修改。
- 包依赖独占复制实际 13579 文件 / 1030 内部软链；DOM 依赖 1595 文件 / 2 内部软链。字节相等，共享 inode 与外链均 0。React/ReactDOM 18.3.1、jsdom 25.0.1、Vitest 2.1.9，DOM lock SHA `15fa558af385790ad5b7a1778d9e92429f8be65d48f528c2997009b49524b973`。
- [虚拟 adapter](../../reports/all-pending-evidence-20261021/TaskPredSelectionDevR1/r1/virtual-adapter.diff)仅追加 `export { TaskForm }`；真实 TaskForm/全部子组件保留，r3 同实例 alias + inline 原 lucide。旧 red config/worker 从未运行；全部运行配置、HOME/TMP/cache/DSH_HOME/file/backup 根只指向自有 `TaskPredSelectionDevR1/r1`。

## 开发自测

| 执行 | 实际结果 | 边界 |
| --- | --- | --- |
| 原七例，原测试原样执行一次 | 1 文件 / 7 例：6 绿、1 红、0 skipped；exit 1 | N01–N04 四目标全绿，C01/C03 绿；C02 原裸 FormData 断言仍红 |
| 原真实主 submit 五例 | 1 文件 / 5 例全绿、0 skipped；exit 0 | 保留真实主 save → handler/core → 内存关系回读 oracle |
| 受影响关系与 TaskForm 子集 | 18 文件 / 182 例全绿、0 skipped；exit 0 | 关系拒绝/解除重试、资料历史/原子文件、验证/取消/清单/错误反馈；不称全量回归 |
| 资料引用真实 DOM 子集 | 1 文件 / 5 例全绿、0 skipped；exit 0 | 真实引用切换/取消、合法字节与 stage 归属；不扩大 GUI 通过 |

原七 [JSON](../../reports/all-pending-evidence-20261021/TaskPredSelectionDevR1/r1/original-seven/vitest.result.json)、[stderr](../../reports/all-pending-evidence-20261021/TaskPredSelectionDevR1/r1/original-seven/vitest.stderr.txt)、[summary](../../reports/all-pending-evidence-20261021/TaskPredSelectionDevR1/r1/original-seven/summary.json)、[逐步原证](../../reports/all-pending-evidence-20261021/TaskPredSelectionDevR1/r1/original-seven/observations/)完整保留。

- N01 实际标题输入后选反向 t1、submit 前存活；N02 实际取消已有 t2、submit 前存活。均未保存/调用 handler，不宣称已保存成环关系。
- N03 首选 t2 → rapid 标题/搜索 → 选 t1 → 取消 t2 → 取消 t1，已完整到达；N04 已有 t2 → rapid → 选 t1 → 取消 t2 → 重选 t2，已完整到达。没有把原红未到达动作冒作原先通过。
- C02 搜索隐藏 t2 后 DOM FormData `[]`、footer 仍 1，失败保持原样；搜索恢复/干净取消未到达。开发不裁其新 adapter/期望，不以真实提交绿洗成“全部原控制绿”；须由不同专家判实际合同。

原五真实提交的 [JSON](../../reports/all-pending-evidence-20261021/TaskPredSelectionDevR1/r1/real-submit-five/vitest.result.json)、[逐例原证](../../reports/all-pending-evidence-20261021/TaskPredSelectionDevR1/r1/real-submit-five/observations/)保原 oracle：三控制和 N01/N02 均一次主 submit → 原 task handler/core success → 一次 tasks/t4 put → 一次 onSaved，payload/core 回读都是 `[t-0002]`。N01/N02 保存前 DOM FormData 仍 `[]`、footer1，但真实保存没有清除关系。仅证明合法内存领域链，不冒 JSON 落盘/重启回读/宿主完整 run/GUI。

受影响 [18 文件命令配置](../../reports/all-pending-evidence-20261021/TaskPredSelectionDevR1/r1/affected/vitest.config.mjs)、[逐例结果](../../reports/all-pending-evidence-20261021/TaskPredSelectionDevR1/r1/affected/summary.json)，资料 DOM [结果](../../reports/all-pending-evidence-20261021/TaskPredSelectionDevR1/r1/material-refs-dom/summary.json)均保命令和原始输出。其中真实 JSON/文件用例只写自有 tmp/files；不把这些独立接缝测试扩大为隐藏关系的 JSON 持久化旅程。

## 命令与未闭边界

运行环境 macOS + nvm Node 22.23.3；未运行 pnpm，不安装依赖。从仓库根执行：

```sh
env -i HOME=/Users/bytedance PATH=/Users/bytedance/.nvm/versions/node/v22.23.3/bin:/usr/bin:/bin \
  /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/plans/task-predecessor-selection-dev-20261022-r1-run.mjs
env -i HOME=/Users/bytedance PATH=/Users/bytedance/.nvm/versions/node/v22.23.3/bin:/usr/bin:/bin \
  /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/task-predecessor-selection-dev-20261022-r1-run.mjs
env -i HOME=/Users/bytedance PATH=/Users/bytedance/.nvm/versions/node/v22.23.3/bin:/usr/bin:/bin \
  /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/plans/task-predecessor-selection-dev-20261022-r1-audit.mjs
env -i HOME=/Users/bytedance/Projects/dsh-pm/pm-tool/reports/all-pending-evidence-20261021/TaskPredSelectionDevR1/r1/home \
  PATH=/Users/bytedance/.nvm/versions/node/v22.23.3/bin:/usr/bin:/bin \
  /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/task-predecessor-selection-dev-20261022-r1-audit.mjs
```

四条命令实际 exits 为 **0 / 1 / 0 / 0**。开发 runner exit 1 保留 C02 红，子执行 exits 按顺序为 **1 / 0 / 0 / 0**。runner PID79328，子 PID79891/79984/80034/80154 全部结束，signal/error 均空；没有设施失败重跑。每组完整命令、cwd、白名单 env、PID、时间、退出码及输出由自有 `vitest.command.json` / `stdout` / `stderr` 记录，不删失败、不混设施审计与产品结论。

[close](../../reports/all-pending-evidence-20261021/TaskPredSelectionDevR1/r1/close.json)核原 checkbox r2/r3、原 submit r1、两个原测试/独立报告、主 lib/package/lock 与自有冻结源/两套依赖均零增删改，facilityError=null；主 src 后继仅观察，不锁定其他合法新增。上述是列明资产的保护结果，不外推整盘、正式数据或整父任务不变。

[开发原证审计](../../reports/all-pending-evidence-20261021/TaskPredSelectionDevR1/audit-r1.json)实际重核 **16985 条文件/软链指纹**零漂移，核四目标完整到达、五次真实提交的命令/单次写入/关系回读，并保 C02 红；audit exit 0 只表示这些原证一致，不是独立 PASS。13:11:38Z 审计时主 panel SHA 与候选相等，仅作该时点观察；不会阻塞后续其他合法新增。另只读 `git --no-optional-locks diff --check -- packages/dsh-pm-tool/src/client/panel.tsx docs/plans/task-predecessor-selection-dev-20261022-r1-run.mjs docs/plans/task-predecessor-selection-dev-20261022-r1-audit.mjs docs/plans/task-predecessor-selection-dev-20261022-r1-report.md` exit 0；其 Git 检查只覆盖 tracked 差异，不冒新未跟踪文档的自动校验。

开发源审查：受控 Set 转数组没有过滤丢项；空 Set 仍发显式 `[]`，创建仍按原有非空才带字段；事件在同步取 checked 后不再被 updater 引用。后端自身/跨项目/循环拒绝、清空和失败保稿接口不变。该源审查不代独立审签；隐藏关系的完整 JSON 持久化/真实宿主/GUI 与 C02 裁定仍未闭。

本轮没有 build/noEmit/default 全 verify/GUI/模型/API Key/vendor/正式数据/上游/服务操作/Git write。接手只读 Git status、rev-parse 与作者输入绑定用只读 diff/ls-files；一次广义文件名查找与一次只读进程列表查询产生过量输出，随后改为限定自有根/精确自有 PID，无停进程或操作其他角色服务。平台记忆资源与给定本地路径不可用，以当前仓库文档为准。

独立专家接续四目标完整旅程、原五主保存及 C02 合同裁定；Main 汇总 livingdocs、唯一新构建/全回归/实际新源加载与 GUI，确认选择/取消/隐藏保存/循环拒绝保稿→解除重试。本子任务不触旧 107 冻结树、旧 3260/PID71922 或其 lib，不启停任何服务。父全部门与最终普通 commit 仍由 Main 按持续授权收口；当前 `RELEASE_STOP`。

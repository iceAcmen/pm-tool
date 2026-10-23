# P1004 副驾任务交接实施计划

> 本文件记录本次限定开发任务的授权、方案、文件锁与验证，供 Main 和独立测试专家接续；不是验收结论。
> writing-plans 所提 executing-plans 子技能当前不可用；由本开发角色按下面步骤连续执行，不另开角色或 Git worktree。

**目标：** 修复现有副驾“打开任务”到 TaskForm 的让层、焦点与直接退出返回，不改变旧答和最新投影。

**架构：** 推荐使用仅该入口生效的临时交接状态，在 TaskForm 存续时隐藏同一副驾子树及侧边标签，退出后重新显示原子树。沿用 TaskForm autoFocus、dirty 守卫与 DrawerPanel 既有 opener 归焦，不修改全局层级。

**技术：** TypeScript、React 18.3.1、Vitest 2.1.9；真实 React DOM + 既有 jsdom 25.0.1，仅在新建 `/tmp` 独占输入副本中运行。

## 1. 授权与边界

- 负责人原句：“既有父授权持续验全部已实现未验、修确证缺陷、最后ordinary commit；不push/release。你是开发角色，不独立验收，Main唯一builder/GUI。”
- 本子单原句：“任务只修副驾‘打开任务’→TaskForm层/焦点交接，保留旧答与最新投影、不增业务写、不清history/重模型，不改上游/全局zindex体系。”
- 当前合同：`docs/testing/p1-projection-refresh-gui-review-20261023-r1.md` §5/§6，原 RA-P1004，相关原 RA-MENU-30 / RA-DR-34。不新增专家 ID，不改原报告或原 FAIL。
- 本角色不运行 build/install/服务/GUI/Git 写，不改 testing/reports 原件、livingdocs、活库、private 冻结入口、上游、vendor 或全局配置。父单 ordinary commit 留 Main，不自动提交。
- 按本次明确授权跳过 brainstorming 常规追问/实施确认/commit/worktree，writing-plans 执行选项/频繁 commit，以及 SOP fetch/pull、地基构建、全 verify、livingdocs 更新。原因：对象、写面和持续闭环已明确，本子单显式禁止这些动作。不跳过独立测试门。
- vendor 政策 §6.1 的 FAIL 不准入解释为禁止新功能/验收/发布，不禁止本次专家确证缺陷诊断与修复，依据 ADL-045 阻塞期间允许修缺陷和本子单明确要求。

## 2. 输入认领与互斥

- 平台 `trae`，角色开发；HEAD `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`。主树 dirty，HEAD 不代表候选。
- `panel.tsx` 输入 SHA256 `581f2882323e729afa7f7f5b7ff40e73a8a9831c2c30b9a263baad74fc7f521d`，已有 diff +173/-126，保留。
- `sidecar-portal.tsx` 输入 SHA256 `e2e9054e9ad0d7a7e9f3c0020760a2c48a8c477ae44af6b01c2a509e8e4204dc`，已有 diff +47/-17，本次只读。
- package.json SHA256 `8098dfa788025596ee1e4664969e4ffd4a69dee664950931313ac0d648cd55a9`；pnpm-lock.yaml SHA256 `646a1a27770cc32b8f07195a3e3c5b7c038aae7040dc408749719f8d76963caa`，只读，不安装。
- 本开发暂持下列精确写锁，其他任务不改该接缝；Main 持唯一 builder/GUI 锁，本角色不持 lib/端口/profile/data 锁：
  - 修改：`packages/dsh-pm-tool/src/client/panel.tsx`，仅副驾任务打开回调、短暂让层/ESC 条件，不重构 DrawerPanel。
  - 新增：`packages/dsh-pm-tool/src/client/panel-sidecar-task-handoff.test.tsx`，真实 PmPanel/CopilotPanel/TaskForm DOM 接缝专项。
  - 新增：本前缀 `plan.md`、`run.mjs`、`*-receipt.json`、`*-stdout.log`、`*-stderr.log`、`*-observations.json`、`*-source.json`、`*-delta.patch`、`report.md`，只存开发原证/试点报告。
- 红绿在不同新 `/tmp/pmtool-p1004-sidecar-handoff-*` 根复制输入；配置、cache、临时输出全部属于该根。既有依赖只读链接；114/521 冻结输入/产物不访问不修改。

## 3. 方案比较与诊断顺序

1. 推荐临时隐藏同一副驾，并禁止其 ESC 监听处理任务抽屉的退出。目标是一次进入/退出能返回原 opener、旧答与最新卡，无重挂载或请求。
2. 调低副驾 z-index 或提升抽屉：会改变其它浮层排序与交互，超出限定任务，不选。
3. 关闭副驾再重建，或打开时永久最小化：前者丢本轮状态，后者还要求用户额外展开才能归焦，不选。

以上为待红验证的最小实现方向，不把封存路径提示当已证根因。

- [x] 阅读 AGENTS、collaboration §9/§11、专家合同、external-skills 全文和 manifest。
- [x] 只读 static verifier exit 0，mattpocock 全13件逐 SHA/bytes MATCH；锁定 commit `49dd158d1076134a641b33efb035946536778336`。
- [x] `rootCause` 仅加载 diagnosing-bugs；不叠 tdd/code-review，未修改产品。
- [x] 建真实 DOM 专项，未修 red-r3/red-r4 均实际6红1绿、exit1；前两轮设施错误保留、不当产品红。
- [x] 红后列3条可证伪假设：未转换可见状态、错目标/焦点、ESC冲突。观测正确title且副驾hidden=false/display:flex；原ESC/归焦控制绿，定位为入口缺让层。
- [x] 确定根因后重新校 tdd 三正文指纹并加载，应用 panel 最小+15/-5增量。
- [x] 同一测试在新绿输入运行，7/7、exit0；直接取消/顶关闭/ESC、autoFocus/归焦、dirty保稿/明确放弃、主保存与同一原卡/最新投影/历史均覆盖。
- [x] 旧受影响专项两轮均实际3文件22/22、exit0；runner原清单误列不存在的drawer-focus.test.ts，未执行不计数，已移除并增加缺文件硬检查，affected-r2复跑完成。
- [x] 交付前校 code-review 指纹并加载；双轴开发自查不等独立验收，发现与边界见最终试点报告。
- [x] 精确增量patch、输入/输出SHA、全部命令exit已交付最终report；最终封存和写锁释放记录以同前缀seal.json实际结果为准。

## 4. 验证与 Main 接续

运行环境 macOS；直接 Node `/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node`，不用 pnpm wrapper。专项命令：

```sh
cd /Users/bytedance/Projects/dsh-pm/pm-tool
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p1004-sidecar-handoff-run.mjs red-r4
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p1004-sidecar-handoff-run.mjs green red-r4
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p1004-sidecar-handoff-run.mjs affected-r2
```

这是实际历史命令，不可覆盖已生成收据。重跑绿/受影响可用新的 `green-rN`/`affected-rN` 标签；红受当前主源码保护，不允许拿已修源码冒未修输入。独占红目录保留真实原输入，没有修改产品造红。jsdom 能证真实事件、hidden/display、autoFocus、dirty/cancel/ESC 与归焦，不能证明像素遮挡、pointer 命中、浏览器 Tab 默认移动、完整键盘/样式/UX。

Main 收到增量后唯一重新认领/整包 build，再按专家 §6 同链采首次打开与直接退出、真实 pointer/bbox/焦点、旧答/最新值、RPC/DB 及原 B8 键盘步骤；专家审新原证。本开发不签 PASS、不代称旧114 GUI 已加载修复、不结束父单或普通 commit 总出口。

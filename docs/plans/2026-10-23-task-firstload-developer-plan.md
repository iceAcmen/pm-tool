# 任务首读开发实施记录

日期：2026-10-23，平台 trae，角色仅开发，不签独立 PASS。

**目标**：第一次有效 snapshot 成功之前不显示空库事实；首次失败可重试；成功空库和已有成功数据的陈旧恢复保持真实语义。

**结构**：在真实 PmPanel 中新增 hasSnapshot 与独立首读请求状态。只在原 generation 有效且 snapshot 成功的路径设置已读；不改 launcher、StrictMode 守卫、handshake、任务来源、时间或 DrawerPanel/ConfirmHost。

**技术**：现有 React 18、Vitest、jsdom/createRoot；只读复用既有依赖，无安装。

## 授权

父派单原句：

> 父原授权全部既有未验/确证修复至ordinarycommit，Main唯一整builder/GUI/desktop。你开发唯一产品写packages/dsh-pm-tool/src/client/panel.tsx及新增panel-firstload.test.tsx，唯一文档docs/plans/2026-10-23-task-firstload-developer-*及自有/tmp，禁止其他产品/原testing/livingdocs/整build/服务/GUI/git/push/runtime/正式。限单替代fetch/install/buildSOP。

> test同指纹红绿，隔离src/config/depsreadonly/cache/outer/timing逐步收据，必要narrowtype及既有相关邻接；不整build/source审后由Main合并L8只build一次。每步真实开始结束耗时和效率复盘handoff，开发不自PASS。读证不要宽scan整个全树耗时，只做declaredsrc/input/ownednonowned delta。真实handoff/seal/readback/释放后STOP。

输入：[Main 方案](2026-10-23-task-firstload-repair.md)、[独立先行合同](../testing/tasks-failure-gui-timed-20261023-r3-firstload-plan.md)、AGENTS、collaboration §9/§11。明确方案无未决产品选择，不重复审批；brainstorming/writing-plans 的 worktree/git/整回归步骤按本单授权跳过。通用 livingdocs 由 Main 接续。L8 后继输入 125/526，gantt 两源不改。

自有根：`/tmp/task-firstload-developer-20261023-QO7zxE`。基线提交只继承封存 manifest，不查询 git。记时从自有 runner 首次实际执行开始；此前读取只有工具 wall time，不补造起止。

## 文件与步骤

1. 已执行：限定输入及写面基线、逐步 outer 收据。监测已声明源码、完整包输入 manifest、指定合同与本单文档；不扫描报告全树或 runtime/private/正式/data/lib。
2. 已执行：新增 `packages/dsh-pm-tool/src/client/panel-firstload.test.tsx`，真实 createRoot 先红，覆盖延迟项目/空成功/首败重试/已有成功后失败重试/Strict 旧响应。首三轮设施补齐后 red-r3 为 6 失败、3 通过；类型补齐 executeRaw 后原 panel 隔离 red-r4 同为 6 失败、3 通过。
3. 已实现待独立审源：`panel.tsx` 首读状态、页头未知文案、首读内容门和旧数据 banner 条件；Loading/首败用现有类与 role=status，无新 CSS。
4. 已执行：red-r4/green-r2 同测试指纹，首读 9/9；affected-r2 邻接 30/30；type-r2 窄 noEmit 为 0。type 首轮缺必填 executeRaw 的真实终码 2 留原件，只补测试传输参数，未改断言或产品 API。
5. 进行中：精确源码差异/声明输入增量，开发 handoff 与效率复盘；真实 seal/readback 验字节和终码后释放两产品写权并 STOP。最终事实回读自有 `outer-readback.status.json`、`released.json`，不在本记录预签完成或 PASS。

## 验证边界

所有执行命令由自有 `outer.mjs` 驱动；每轮隔离 src/config/cache/output/HOME/TMPDIR，仅依赖链接只读。保存展开 argv、Node/依赖 realpath/version/SHA、完整 stdout/stderr、child/outer 起止与单调耗时。测试红绿只允许 panel 字节变动，测试 oracle 指纹保持相同。

Main 后续唯一冻结整包构建、完整回归与真实 GUI；独立专家审源及原 FE/FS 采证。开发不把窄测绿称 PASS，不动 O4 的 DrawerPanel/ConfirmHost，不执行 git/服务/GUI/正式切换。

负责人最新补充：另两项独立红为 O4 确认 Escape 仍开、stale banner 左长列叠压。已收到但不追加本单写面；本单只收束首读封交，释放后交 Main 排同 panel 后继，合并 L8 与同域后继一次整 build。O4 注册顺序根因未签，不按推断抢改。

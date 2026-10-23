# 副驾前缀开发子单 R1

> 本文件记录本开发子单的范围、执行步骤与停止条件，供 Main 和不同独立复验专家接续；不是验收结论。

**Goal:** 按已批准计划修复 S112-PREFIX-01，保留错误原文及同场景单前缀。

**Architecture:** 仅副驾 send catch 调用既有 `prefixFeedbackOnce`；命令、传输、分类器、成功/取消与写边界不改。直接迁移独立 R2 五例，不改变 oracle。

**Tech Stack:** macOS/bash、Node v22.23.3、已有 pnpm 11.28.5 依赖普通独占副本、Vitest 2.1.9、React 18.3.1。

## 授权与范围

- 来源：负责人本轮子单，以及 `2026-10-22-copilot-error-prefix-closure.md`、`../testing/successor112-auth-gui-prefix-20261022-r1-plan.md` 和同名 report。
- 父任务原目标保留：“父持续多角色验全部修确证缺陷后ordinarycommit已授权”。本角色是不同开发，非独立验收；ordinarycommit 为 Main 的后续动作，本子单不执行 Git。
- 业务唯一写面：`packages/dsh-pm-tool/src/client/shared/drawers/sidecar-portal.tsx`，仅导入 helper 及 send catch 一行。
- 新测试输入：`src/client/copilot-error-prefix.test.tsx`、`src/client/copilot-error-prefix-fixture.json`。逐字节迁移独立 `-r2-component.fixture.tsx`，仅 transcript 相对读取与 observations 可选；fixture 精确复制独立 `-transcript.json`。
- 自有文档/证据：`docs/plans/copilot-error-prefix-dev-20261022-r1*`、`reports/all-pending-evidence-20261021/CopilotPrefixDevR1/`。
- 唯一 tmp：`/private/tmp/pmtool-copilot-prefix-dev-20261022-r1`。只普通复制旧 112 依赖并核 bytes/SHA、inode、外链，不 install/build/service/GUI/key；不写上游、旧 tests、共享 lib、vendor、data、其他 testing 或 livingdocs。
- 并行 Main 仅 OP 新 3263 原 F2 GUI 补证；本轮不操作该服务。原 112 实例不变，不称新源码已装载。

## 执行清单

- [x] 通读 AGENTS/collaboration、指定计划/独立报告；只读核 519 主包输入与旧冻结相等。
- [x] 核已有 helper 与真实传输 throw 原文边界；原 R2 为同五例 2 绿 3 红，不覆盖重跑先行原件。
- [x] 记录修改前输入及保护对象，新增两测试输入，执行唯一两行业务修改。
- [x] 新冻结 521 完整包输入；原 112 声明替换 sidecar hash 并新增两项，实际核 114。
- [x] 普通复制旧 112 依赖；核字节、不同 inode、全部软链内归属。
- [x] 原五例、受影响 sidecar/transport/helper 集合、原 tsconfig noEmit；完整 argv/cwd/env/PID/stdout/stderr/exit/warnings 留自有证据。
- [x] 自查 exact patch、断言迁移与保护边界，归档 SHA/完整输入/停止报告；仅开发自测，独立复验待 Main 另派。

## Skill 选择

已读取 brainstorming/writing-plans，设计与执行顺序沿现有获批计划，不重复审批、不另建功能方案、不执行其通用 commit/worktree 步骤。项目自动路由按 trivial 已定窄修抑制 grill/tdd，交付边界选择 `code-review`。只读静态校验 exit0，mattpocock 锁 `49dd158d1076134a641b33efb035946536778336`，13 文件 bytes/SHA 一致；无 installer/setup。固定点采用旧 112 exact 字节和父基线，不执行 skill 的 Git/setup。无子代理派发能力，不冒称两个独立 review；仅开发自查两轴，签字交不同专家。

## STOP

范围扩大、helper 不满足原合同、冻结漂移或外链/共享 inode 即停止，保留原失败。交给 Main 的是开发自测，不自签 PASS、不提交、不结束父 goal。不同 SOURCE/AUTO 专家新冻结独立复验后，由 Main 唯一后继 builder 完整认领、构建/回归、新 GUI 采证，再由不同 GUI 专家审签。

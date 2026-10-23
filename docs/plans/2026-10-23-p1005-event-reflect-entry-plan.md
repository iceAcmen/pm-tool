# P1005 事件反思入口修复实施方案

> 记录 P1L2-F01 开发侧方案、授权和执行检查点，给 Main 与独立测试专家接续；不替代专家原报告或验收结论。平台 trae，2026-10-23。
> writing-plans 的通用 worktree、提交和再确认步骤不适用本子单；按本次明确授权执行，不调用缺失的 superpowers 子技能。

**目标：** 两种已实现事件反思经既有 reflect 命令按真实反思 ID 完整查看、人工 edit/final，保留任务 ID 入口。

**架构：** 命令遇到 `ref-` 目标时精确读取 reflections 表，不先查任务、不选最新事件；其余目标保持 getTask → getReflection 的原链。复用 updateReflectionDraft/finalizeReflection，不变更核心模型、钩子或写路径。sourceId 按 sourceEvent 从 taskId/milestoneId/deliverableId 派生，只展示、不落库。

**技术栈：** macOS / 现有 nvm Node 22.23.3 / TypeScript / Vitest 2.1.9 / 真实 Cordis、DomainFacility、JsonStorageBackend。不调用 pnpm、安装、构建、noEmit、整 verify、GUI、服务或 Git。

## 授权与合同

- 负责人本次原句：“你开发只修P1L2-F01；Main唯一builder/GUI，独立测试另角色。”
- 原句：“写面最小仅src/commands/reflect.ts与新src/commands/reflect-l2-entry.test.ts，core/reflect.ts若必须先说明具体原因”。
- 原句：“不install/build/GUI/服务/Git/noEmit/整verify；专项在自己新/tmp输入/依赖读链接/isolatedcache/config/output独立运行……不用mirrorhelper。”
- 原句：“Main后继整包认领+GUI专家签，不自称PASS。结束release源码锁/STOP。”
- 父 ordinary commit 由 Main 在父出口齐后执行；本子单不提交、不推送、不发布。
- 依据：AGENTS；collaboration §9/§11；`docs/testing/p1-l2-events-gui-review-20261023-r1.md` 全文及 §4.1；`docs/design/deep-integration-v2-p1-dev.md` §四；external-skills 全文与 manifest。
- 非目标：P1L2-F02/Listbox、P1004、index、panel、CSS、新页面、会议、业务新功能、来源迁移、给事件补 taskId、livingdocs、原 testing/原证、vendor、上游、home、正式 data。
- Main 独占整包 lib/、GUI、服务/端口/profile；本子单独占上述两源码和本计划前缀，临时根 `/tmp/pm-p1005-event-reflect-entry-6iR2yc`。

## 方案选择

1. 采用现有 `/pm reflect <任务ID|反思ID> [edit "<markdown>"|final]`：直接命中稳定反思 ID，改动最小，适用于全部真实 reflection 记录。
2. 不采用“把 getReflection 改成事件智能匹配”：会改变原任务查询语义，可能夺走旧 task-done，超出本缺陷。
3. 不采用“新命令/页面/会议工作流”：增加路由及交互写面，原复用合同不需要。

来源展示：完整 view 输出 sourceEvent/sourceId，任务 ID 只在真实存在时显示；末尾 JSON 保持原记录全文。list 保留摘要形状，增加真实 sourceEvent/sourceId/milestoneId/deliverableId 供识别。项目不存在时，查看和写操作明确返回 error；未知/坏 ID、空编辑、不支持动词不写盘。不把成功业务事件/自动草稿称成人定稿。

## 文件级任务

### 1. 建立隔离输入与诊断红（已完成）

- 新增 `packages/dsh-pm-tool/src/commands/reflect-l2-entry.test.ts`。
- 真实 Context + Storage + JsonStorageBackend + DomainFacility 打开 pmDomainSpec，每用例独立临时 JSON 根；不 fake 业务域、不手 seed 成功反思。
- addProject/addTask/addMilestone/addDeliverable 正常创建，updateTask(done)/updateMilestone(achieved)/updateDeliverable(accepted) 触发既有 ensure 钩子，等待真实队列完成。
- 两事件无 taskId；保留关联 todo 任务与旧 task-done，按真实记录 ID 经 handleReflectCommand 查看。
- 准备自有临时输入副本、node_modules 只读依赖链接、Vitest 配置、缓存、日志和输出清单；不用现有 mirrorhelper，不加载 lib 或 index。
- 先运行单条 milestone 查看用例，记录有效产品红，设施失败单列保留。
- 实际 red-view exit1：真实 `ref-mvk198vr-c3sc1m` 被当任务，返回“未找到任务”；完整 red-contract exit1，10项红。有效诊断不是 SOURCE 推导或坏 fixture。

### 2. TDD 最小修复（已完成）

- 修改 `packages/dsh-pm-tool/src/commands/reflect.ts`：扩帮助、精准目标分支、项目存在性、来源展示/list；保持原 task ID 查询。
- 不修改 `core/reflect.ts`：table.get + 原 finalize/updateDraft/getReflection 已足够。
- 针对真实 markdown known/pending/blank/gaps、edit 不自动 final、final/repeat/reload、稳定身份、旧记录及关联任务字节保护逐项红绿。
- 兼容：旧任务入口查看/edit/final；task-done 反思 ID 也可精确定位。final 后 edit 不回退状态，沿原核心合同；提示据真实状态生成。
- 拒绝：未知 ref、非法 ID、未知任务、无反思任务写、项目缺失、空编辑/不支持操作；读和拒绝前后全数据字节相同。
- 首轮 green exit1（7绿/3红）：自有断言误要求 JSON 省略的 optional 字段显式存在，不是产品缺陷；仅纠正断言。green-r2 exit0（10/10）；交付自查补同库两事件连续定稿后 green-final exit0（11/11），产品源码未再变。

### 3. 专项回归与交付自查（已完成，最终指纹见 seal）

- 在自有隔离输入上运行新命令专项；必要原专项只运行 `src/core/reflect.test.ts`、`reflect-l2.test.ts`、`reflect-file-count.test.ts` 各一次。原 verify-reflect/p1c 会 import lib/index，本子单不运行。
- code-review 仅做开发质量自查：逐行对输入副本与本次输出，用原合同核来源映射、精确命中、拒绝/无写、兼容与编辑状态；不操作 Git/setup、不自封 PASS。
- 记录 vendor 完整性、diagnosing-bugs → tdd → code-review 路由、真正改变的决定及8项越权检查；静态校验不是独立验收。
- 输出本次输入前后 delta、每文件 SHA/size、完整命令/exit、有效红/绿与设施失败、输出指纹。并行非自有变化另列，不归本修复。
- Main 后继认领整包新候选、构建/回归及 GUI，专家按 §4.1 复验审签；本子单全部 GUI/宿主装载 NOT_RUN。
- 原三个专项各一次，regression exit0（3文件/24项）；code-review 自查完成，独立双角色审查未执行，不冒独立结论。vendor-final exit0，13文件指纹仍相符。
- 初始436项输入中两处非自有 Listbox 在途变化单列，不触碰、不归本任务，也不继承为已测；见最终 seal.nonOwnedDelta。
- collect实际exit0，归档7条子进程执行收据、42个自有fixture审计/最终原始JSON与真实源码delta。结果与试点已写自有前缀；最终seal成功后两源码写锁释放并STOP，任何seal失败保原件且不称已封存。

## 命令与检查点

环境和路径固定，完整实际命令追加到自有结果文档；临时执行器记录 subprocess argv/cwd/exit 与 stdout/stderr，不覆盖旧红日志。

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node packages/dsh-pm-tool/scripts/verify-external-skills.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p1005-event-reflect-entry-runner.mjs capture
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p1005-event-reflect-entry-runner.mjs red-view
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p1005-event-reflect-entry-runner.mjs red-contract
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p1005-event-reflect-entry-runner.mjs green
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p1005-event-reflect-entry-runner.mjs green-r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p1005-event-reflect-entry-runner.mjs regression
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p1005-event-reflect-entry-runner.mjs green-final
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p1005-event-reflect-entry-runner.mjs vendor-final
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p1005-event-reflect-entry-runner.mjs collect
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p1005-event-reflect-entry-runner.mjs seal
```

已执行：vendor 静态校验 exit0，mattpocock 13 文件全部 SHA/bytes 与 manifest 相符；source.commit `49dd158d1076134a641b33efb035946536778336`。`rg` 不可用 exit127；探索不存在的 `scripts/verify-p1-l2.mjs` exit1，非产品红。记忆指定根不存在，仓库为依据。未执行 Git/拉取和通用地基步骤，因本次明确禁止且 Main 唯一 builder。

停止条件：命令专项及必要回归结果、dirty 字节认领和边界已交 Main，即释放两源码写锁并 STOP；不开始下一功能、不更改父状态。

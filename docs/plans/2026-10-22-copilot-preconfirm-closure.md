# 副驾确认前冲突与逐步依赖修复计划

> 给限定开发、Main 和独立专家逐步执行。已读取 brainstorming / writing-plans 技能；持续收口授权与先行独立合同已明确，不增加审批或分批提交。开发不得改专家原件或自签 PASS。

**目标：** 关闭 PC01/PC02 两项已独立确证的既有 P1 缺陷，保留正常同目标链式确认、独立继续、最新只读投影和人工改动。

**结构：** 计划生成时保存执行基线，确认首步使用该快照。逐步模式维护本次成功步骤集合，只为实际成功目标推进基线；后续独立目标继续保生成时基线，前置未应用则不发送依赖。后端当前整批守卫与协议保持。

**技术：** TypeScript、React18、现有副驾 transport、Vitest2.1.9、Node22.23.3；macOS / pnpm11.28.5。

## 1 范围与设计选择

有效合同：[独立先行计划](../testing/a14-preconfirm-conflict-contract-20261022-plan.md)、[两项必要红](../testing/a14-preconfirm-conflict-contract-20261022.md)、RA-AI04 / CMP-CONFLICT-01 / ADL-054。原确认前外改 GUI 送最新基线覆盖改派为 FAIL；逐步首步“应用0步”仍发依赖为 AUTO FAIL。不是新增功能。

采用保存计划基线与本次成功集合的局部方案。仅禁用陈旧计划会丢掉“独立继续”；扩展后端为跨调用计划存储超出缺陷范围，均不采用。明确重新生成才建立新基线；取消清理计划；只读投影仍使用实时 tasks。

开发独占 `packages/dsh-pm-tool/src/client/shared/drawers/sidecar-portal.tsx` 和新 `packages/dsh-pm-tool/src/client/shared/drawers/copilot-preconfirm.test.tsx`。必要纯辅助只限同域 helper/test，先报告理由；不改 panel/TaskForm/backend/schema/model/其他页面。Main 当前 A14 freeze / lib / host 保留作旧证据；开发不得 build 或使用共享缓存。

## 2 执行顺序

1. 读仓库规则及独立合同；对主树和 A14 完整源冻结/差异、新文件、依赖与旧 lib 保护认领。按原专家测试控制0/0、必要红1/1复现，记录 executable/argv/cwd/环境/exit/原 reporter；不降低期望。
2. 生成时记录执行基线，确认使用该基线。使用既有 openedAt 或明确同域基线状态均可；必须覆盖扩展实体的既有键，不能只保 tasks 而丢后续已批准扩写基线。
3. 逐步结果按实际“已应用”判断，不能仅用 `kind=success`；前置未成功则显式跳过依赖、独立继续。成功后重读快照只更新本次成功目标的基线，不洗白其余待执行目标的外改。取得 fresh undo 只与本次实际成功关联，不误捞旧句柄。
4. 自有无缓存测试：原两控制仍绿/两必要红转绿、正常同目标链式、首步零应用/失败依赖跳过、后续独立目标发生外改、勾选/编辑/取消/再生成、四扩展基线、最小化/输入/undo相关回归，完整冻结 noEmit。失败记录保留；不声明 GUI PASS。
5. 三文件以内成果与精确补丁/原结果交回，释放写域。不同专家 SOURCE/AUTO 复验；Main 唯一新输出构建/全回归/新实例/完整 uncached 下发，然后按 PC-G01..04 原步骤真 GUI 采证，专家判定。

## 3 验证和收尾

开发执行环境必须自有 HOME/TMPDIR/cache；禁止 install/build/sharedlib/GUI/services/credentials/commit。命令在自有冻结包根按实录参数：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node <自有runner.mjs> before
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node <自有runner.mjs> after
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node <现有Vitest入口> run <真实组件测试> --no-cache --maxWorkers=1 --minWorkers=1
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node <现有tsc入口> --project <冻结包>/tsconfig.json --noEmit --incremental false
```

具体路径/argv必须由开发写 command.json，以上占位不能当已运行证据。Main 最终新候选再运行 build、coverage、完整 guard、Launcher及专项；真实模型必需本人条件另列。普通 commit 仅在全部适用独立门闭合后统一执行，无 push/tag/发布/正式切换。

开发报告写 `reports/a15-copilot-preconfirm-developer-20261022*`；Main负责后续 livingdocs，testing目录仅专家写。并行微信成果保留，不清树。

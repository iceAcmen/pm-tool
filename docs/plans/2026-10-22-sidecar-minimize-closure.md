# 副驾最小化保上下文修复计划

**Goal:** 关闭独立专家确证的 SM-01，最小化与展开保留当前副驾状态，使正常人工修改后仍能从本轮入口执行受保护的撤销。

**Architecture:** 当前 `copilotMin ? button : aside` 卸载 CopilotPanel，丢失本地上下文。采用稳定位置挂载同一个 aside/CopilotPanel，以 hidden 控制最小化可见性，竖标签另行显示。保持关闭、切项目、真正卸载、后端句柄和冲突守卫的现有语义。

**Tech Stack:** macOS、nvm Node22、pnpm11.28.5、React18、TypeScript、Vitest。

本计划执行 brainstorming 的范围与方案辨别、writing-plans 的文件级步骤；持续收口授权覆盖此确证缺陷，不另设确认停点或中途提交。独立先行合同为 [SM-01报告](../testing/a14-sidecar-minimize-contract-20261022.md)；不存在额外产品设计歧义。另选上提所有 state 会扩大接口，按 undo list 重建则不能保草稿且可能捞取历史句柄，均不采用。

## 文件、影响与互斥

| 文件 | 用途与边界 |
| --- | --- |
| `packages/dsh-pm-tool/src/client/panel.tsx` | 固定 CopilotPanel 生命周期，仅改变最小化分支；关闭/切项目语义保持 |
| `packages/dsh-pm-tool/src/client/panel.css` | 必要时补 `.pm-sidecar[hidden] { display:none }`，不占位、不拦指针/焦点/无障碍树 |
| `packages/dsh-pm-tool/src/client/sidecar-minimize-retention.test.tsx` | 真实父子组件控制、最小化、人工主保存与未确认草稿回归 |
| `reports/a14-sidecar-minimize-developer-20261022*` | 开发冻结、旧红/新绿、原命令退出码、释放清单 |

开发仅持有上述产品文件，不修改后端、sidecar撤销算法、模型、资料/导入/schema、其他专家目录。Main继续A13冻结实例的原生文件GUI，旧lib不覆盖；独立专家仅审证。

## 执行步骤

1. 读取独立原合同及r3测试，冻结自有候选、源码指纹/patch/新增清单。复现控制exit0与三条合同红各exit1；仅在自有隔离测试目录运行，不修改专家原件。
2. 在稳定Fragment位置保留aside/CopilotPanel；最小化仅hidden，竖标签独立可见。实际隐藏规则覆盖display:flex。保持props实时刷新，禁止自动ask/apply/undo或恢复旧handle。
3. 同一用例旧红转绿；补真实组件隐藏/焦点可达、表单取消/失败、投影刷新/草稿/三条句柄边界，运行受影响panel/bridge/sidecar/确认组件回归及noEmit。使用no-cache与隔离输出，禁止整包build/sharedlib/GUI/服务。
4. 开发交完整hash/退出码/保护清单并释放，交不同独立专家复验。Main待SOURCE/AUTO通过后唯一新输出构建、实例认领和实际完整下发。
5. Main新生成fresh三步计划→确认→最小化→正常TaskForm外改主保存→展开保入口→明确mixed撤销；另clean对照、未发送文本/勾选编辑保留与隐藏主操作/键盘补证。旧A12失败句柄不补救冒充修后证据。

## 收尾

独立GUI判定、受影响回归、最新总门继续。Main更新changelog/progress/issues/knowledge/handoff/onboarding；所有适用门完成后才统一普通commit。无push/tag/发布或正式服务切换授权。

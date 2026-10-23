# O4/stale R1 实际工具收据

2026-10-23，trae，独立专家；报告/审计正文已经冻结，以下只记实际封回，不倒填执行。命令环境macOS arm64/bash、绝对Node22.23.3、cwd `/Users/bytedance/Projects/dsh-pm/pm-tool`。

自有根 `/private/tmp/tasks-o4-stale-source-auto-20261023-r1-3pcNKs`。外层命令为绝对Node执行该根 `run.mjs <阶段>`；唯一摘要收拢为同Node执行 `compact.mjs`。具体argv、child状态和此前全部测试命令/起止在audit及各 `outer-*.status.json`，无省略失败轮。

| 实际阶段 | 开始→结束（2026-10-23 UTC） | 单调秒 | 真实退出码 |
| --- | --- | --- | --- |
| publish | 02:56:41.285→02:56:41.308 | 0.024 | 0 |
| compact | 02:58:10.144→02:58:11.350 | 1.204 | 0 |
| seal | 02:58:19.756→02:58:20.760 | 1.005 | 0 |
| readback | 02:58:25.290→02:58:25.540 | 0.249 | 0 |

seal工具返回exit0（tool wall 1.1986秒），readback工具返回exit0（tool wall 0.4136秒）；工具wall与程序单调耗时是不同口径，不相加。

- 自有seal实际SHA `bd08a6e7e95cc45c5e44044f34be60c48d0875f940fce337ea15bd87afa1f498`，322225字节。
- readback实核1775对象（1711字节文件、64软链记录），0差异；四份plan/scope-contract/report/audit逐SHA核同，选定任务源/合同未变。仓库本前缀seal/readback是实际文件副本；未认领并行people活源/全候选。
- 原开发seal独立8819对象/0差异；本seal只绑定本轮隔离证据和四文档，不把两个分母混用，不含最终toolreceipt/released。release阶段会单独绑定本receipt/readback指纹。
- 原/修同oracle confirm 2红/9绿→11绿、transport 1红/23绿→24绿；原首读9/邻38/type0仅审。Strict最终body仍 `NOT_PASS_OBSERVATION`；原GUI/stale视觉/旧error恢复未关闭。

此收据写后才调用 `run.mjs release`。释放事实只以实际 `released.json` 和自有 `outer-release.status.json` 为准；此文不提前宣称已释放。释放后不再编辑/续测/执行Main构建、GUI或git，Main按scope-contract及原合同接续。

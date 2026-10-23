# 任务确认 Escape 与陈旧通知开发计划

2026-10-23，trae，仅开发角色，不签独立 PASS。

**目标**：仅修独立确证的确认 Escape 仍开与 stale 通知成为 shell 额外横列两红。

**结构**：真实 DrawerPanel 关闭入口查询所属 document 中已显示的确认层，阻止下层重复 dirty confirm；不修改确认模块或猜注册顺序。原陈旧通知块原样移至 `.pm-main` 首个纵向内容位置，保原因、旧数据、重试和旧错误卡。

**技术**：React18、真实 PmPanel/createRoot/StrictMode、Vitest、jsdom；transport 仍用原 renderer；只读既有包及 tmpwidget 依赖。自有输出 `/tmp/task-o4-stale-developer-20261023-MqM0UL`。

## 原授权与边界

负责人原句（本单派单）：

> 你是唯一同panel接续开发，父授权全既有未验确证修复到ordinarycommit持续，无新功能/push/release/正式切，Main唯一整build/GUI/desktop。限单替代fetch/install/build/git/livingdocs。

> 仅已确证两红，最小写权panel.tsx、panel-transport-error-feedback.test.tsx、新panel-confirm-escape.test.tsx、自有docs/plans/2026-10-23-task-o4-stale-developer-{plan,handoff}.md。

> 调查确认显示查询机制：确认打开时下层不重进dirty confirm，Escape只退确认保草稿焦点，Enter弃原合同；同windowcapture顺序未知不臆造根因。

> 若确实需confirm-dialog.tsx只读可见查询导出/现有机制调整，先给Main精确文件/最小diff理由暂停该源写等认领，但继续stale/先红。

> stale原块移.pm-main宽位，不CSS或清旧error。按原先行真实组件redgreen，同oracle指纹、Strict/两listener序列有证；相关首读/退出/transport/launch窄回归和type。

> 依赖只读既有tmpwidget/包，独立src/HOME/tmp/cache输出；不整build，不服务/浏览器/产品数据/正式。不改testing或livingdocs。

> 所有步骤真实起止耗时，设施错误原日志保，不当产品PASS；交最小源清单变化（首读126/527下一实际增量），handoff/seal/readback实际0/releasedSTOP；开发不签PASS。Main并行3270人员FL，勿碰runtime。

已读 [Main合同](2026-10-23-task-o4-stale-repair.md)、[首读handoff](2026-10-23-task-firstload-developer-handoff.md)、[独立首读报告](../testing/tasks-firstload-source-auto-20261023-r1-report.md)、[O4合同](../testing/tasks-failure-gui-timed-20261023-r3-o4-escape-plan.md)、[stale合同](../testing/tasks-failure-gui-timed-20261023-r3-stale-layout-plan.md)、AGENTS及collaboration §9/§11。父合同已明确方案，不重复用户审批。brainstorming/writing-plans 的另开worktree/git/全构建由本单明确授权替代，缺失执行技能不安装。无 CSS、确认模块、其他产品写。

## 步骤与状态

1. 已执行：首读 released=STOP、outer-readback 实0；126/527声明输入逐条核一致，panel `b83eba55…` 保存原副本。限定声明监测，不宽扫runtime/报告树。自有 runner 从 baseline 开始记录真实起止及单调耗时；此前工具阅读仅 wall time，不补造完整时间。
2. 已执行：vendor静态校验实0，mattpocock13文件SHA/bytes逐条相同；锁定 `49dd158d1076134a641b33efb035946536778336`，vendorIntegrityVerified=true。诊断只用 diagnosing-bugs，复现后可测修复用tdd，交付才加载code-review；不叠审替专家、不跑setup/HITL/installer。
3. 已执行：新增 `panel-confirm-escape.test.tsx`，真实组件同一次 window capture 事件，原注册/逆序两调度、Strict双首读；11项覆盖确认Escape保说明/归焦、再确认Enter放弃及clean/dirty原入口。transport新增1项保旧数据/原因/重试/旧error卡与main位置。Strict卸载后opener归焦另留缺口，不以删除断言掩盖原3红历史，最终范围明确见handoff。
4. 已实现待独立审：panel原stale块逐字移入main，原关闭入口两行查询已显示确认层。两种同步事件顺序均保显示直到React提交，不查模块current瞬时值；`confirm-dialog.tsx` 无需额外写，已及时回报Main。没有CSS、旧错误清除或新增确认API。
5. 已执行：最终r3同两测试字节，原panel确认2红/9绿及stale1红/23绿，修后11/11与24/24；首读9/9、renderer邻接38/38、两修改测试与首读沿真实导入链窄noEmit实0。初type只含新确认/首读，扩大纳入transport后8处旧act隐式返回产生type2，仅改为void块并补既有必填executeRaw禁用桩，完整回跑最终r3；未改定时步长或预期。原清单卸载设施告警在原panel对照同样出现，原日志保、不签卸载验收。
6. 已执行审计/进行中封交：audit实0，红绿src仅panel差异；首读ec0字节不变，127/528声明增量，nonownedDelta=[]仅限声明路径，依赖package.json指纹不变。自有handoff正文冻结后实际seal/readback/释放STOP，最终状态仅读收据，不在本文预填终码。Main唯一合并整build/完整回归/原GUI及专家审签，父ordinarycommit门齐后才操作。本单无git写权。

## 诊断约束

现有 ConfirmHost 用 `.pm-confirm-dialog` 显示层，没有只读状态导出。上下层同window capture且stopPropagation不排同目标其他listener，只支持重入调查，不能据此签真实注册顺序根因。最小查询复用实际显示层，先用两序列真实组件证实；不新增全局事件管理、CSS或确认API。stale结构断言只证位置，视觉门仍待Main。

原错误保留：`rg`缺失、误读 shared/confirm-dialog.tsx、不存在confirm-dialog.test.tsx、记忆路径不可达均是读取设施问题，不是产品缺陷。起步误宽输出git status/目录及进程列表只读且未改任何运行实例；后继改为声明输入及限定路径，不能称全机零污染。

初transport对象身份断言打印失控，核自有worker PID59005/cwd后只TERM该PID，原真实exit1/Worker exited unexpectedly保留；改为同义标量父class断言，未动期望。源红/绿与窄类型每轮独立src/config/HOME/tmp/cache，全部日志、oracle/SHA、真实起止及效率复盘见[开发handoff](2026-10-23-task-o4-stale-developer-handoff.md)和自有summary.json。本单没有整功能完成或整体百分比更新，不把开发绿扩为专家PASS。

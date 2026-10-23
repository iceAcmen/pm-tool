# 首读误空缺陷最小修复

2026-10-23，trae。负责人已授权确证缺陷修复/独立验收到本批普通提交。依据[固定任务专家先行合同](../testing/tasks-failure-gui-timed-20261023-r3-firstload-plan.md)，不是新增功能。

目标：第一次真实snapshot尚未成功时显示正在读取；只有成功确认无项目才展示“暂无项目/建立第一个项目”。首次失败诚实显示读取失败与重试，不把从未成功读取的数据说成“上次旧数据”；既有成功后的陈旧数据保留与重试不改。

Main已只读确认`data`初值empty，`busy`与`launchMountRef.snapshotReady`只控制指示/认证，render的`!project→EmptyWorkspace`直接消费未知集合。优先新增“是否曾成功取得snapshot”状态，只在当前有效generation的真实success设置，render区分未知/成功空/已成功旧内容。直接以busy替换整个页面会影响已加载页面刷新，故不采用；共享empty数据模型不改。

唯一产品写面：`packages/dsh-pm-tool/src/client/panel.tsx`与新增`src/client/panel-firstload.test.tsx`。真实PmPanel测试先红：延迟有项目、success后有项目；延迟空库、success后空引导；首次reject可重试而无假旧数据；已有success后refresh reject保旧数据/陈旧提示/retry；Strict旧generation不宣布就绪。范围只原firstload/受影响读取，不增加表单/取消功能或矩阵。

开发隔离src/cache/output、只读既有依赖，保存同test红绿/完整argv/输入SHA/耗时，禁止整build/GUI/服务/其他产品写。独立源审后与已PASS L8合并唯一冻结回归，避免两次整包；原真实首读/FS新候选GUI由Main固定任务专家审。原O4确认Escape问题另由专家判定，不抢其源码写面；无push/release/正式切。

brainstorming/writing-plans按已明确缺陷合同应用，未决产品选择0，继续原授权不重复确认。最终进度/计时日志由Main统一，开发完成不是独立PASS。

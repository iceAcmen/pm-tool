# 任务前置选择器缺陷修复计划

> 父授权持续确证修复；开发与独立复验分开，Main唯一builder/GUI端，全部余项验完后普通commit，不push/tag/release/正式切换。

**目标：** 前置复选在React事件结束后仍可安全更新，搜索过滤不丢已选关系。

**依据：**

- [TPC01先行](../testing/task-predecessor-checkbox-red-20261022-r1-report.md)：真实TaskForm七项2控绿/1控制失败/4崩红；React updater晚读currentTarget.checked使组件卸载；新3260GUI同栈确证。
- [TPC02真实提交先行](../testing/hidden-predecessor-submit-red-20261022-r1-report.md)：五项3控制绿/2必要红；搜索隐藏已选t2后，真实主保存发[]并由正确后端清空关系。内存领域回读已证，不冒正式JSON损失。

**唯一业务文件：** `packages/dsh-pm-tool/src/client/panel.tsx`。

1. 在前置checkbox事件内同步取checked，再给函数式updater；只用布尔值、稳定ID及prev，不persist/吞异常。
2. 主保存前置数组由完整受控checkedIds生成，搜索只影响显示。不要添加伪隐藏选项、修改后端清空语义或新schema。
3. 原七项C02仅FormData期望与提交策略可能需独立兼容澄清：开发不改测试，用实际payload保持和原五例防关系丢失验证；旧C02结果保真，复验专家判其实际合同。
4. 开发自有冻结/config/tmp/cache跑原目标四红及控制、原真实提交五例和必要受影响关系/TaskForm回归，不build共享lib。
5. 不同独立专家在后继源复验，Main唯一新build/全回归并采真实选/取消/搜索隐藏仍save、循环拒绝保稿→解除retry GUI；并行renderer/ask修复不锁不覆盖。

**范围：** 不改资料refs、表单其他字段、样式/上游/TaskSchema/commands或资料原子提交。原失败/原封包保留；新增测试由专家所有，不让开发改oracle或自签PASS。

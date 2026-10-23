# 会议行动项布局收口

依据 `docs/testing/a10-meeting-gui-independent-review-20261021.md` A10-MGUI-F01/§5，沿父持续验收修复授权。Main唯一builder/GUI，开发只认领records meeting表单与局部CSS/用例。

`src/client/views/records/records-meeting-form.tsx` 将行动项行与添加动作放入专属全宽容器；`src/client/views/records.css` 让每项独立全宽、控件限宽与随实际抽屉宽度换行。保稳定ID、同项目task/issue选择、主保存/行保存/转任务/删除、顺序callback及失败保稿/取消，不改全局panel表单栅格或schema/原子性。

先行真实组件结构/已存0/1/2行用例保红；最小修复后作者/独立SOURCE/AUTO，Main新冻build/产物与实例、原1440浅0/1/2行动项编辑/关联/clear/取消连续GUI复验，后续窄深矩阵按既有合同。原payload/原磁盘字节缺证各实际保存时另采，不重序列化旧wrapper冒原件。

最终全部回归及统一普通commit，无push/tag/正式切换。运行环境macOS、nvmNode22、pnpm11.28.5。

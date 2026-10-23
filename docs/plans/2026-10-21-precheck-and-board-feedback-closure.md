# 恢复预检与看板反馈最小收口计划

**目标：** 关闭独立审证确证的 A7-RV01 长路径外壳横滚与 A6-BGUI-01 成功显示错误样式。授权来自全部在途验收父任务；持续执行，不另开产品范围。

**方案：** 恢复预检进入既有 `.pm-main` 纵向区，完整警告和输出在局部可靠折行，动作保留原双确认。看板明确区分成功消息与错误消息，使用现有 token 显示成功；持久化、刷新、撤销链不变。继续 Main 唯一 builder/GUI，专家独立审判。

**运行环境：** macOS、nvm Node 22、pnpm 11.28.5。brainstorming/writing-plans 用于现有合同落地；用户已授权持续修复和最后统一提交，技能默认逐步询问/提前 commit 不适用。

## 文件、步骤与验证

1. `src/client/panel-restore-path.test.ts`：真实 PmPanel 先行补长原文保全、预检位于 pm-main 而非第三 shell 列的结构回归。旧 A7 保红，修后绿；双确认、取消和输入校验原用例一起跑。
2. `src/client/panel.tsx`：只移动原预检块到 pm-main；为 warning 和动作行加入局部类。`src/client/panel.css`：限宽、min-width:0、长路径/原文保留换行并折行、摘要 max-height 内滚和动作换行。不得全局隐藏横向溢出。
3. `src/client/board/BoardBento.tsx` 及同目录新的真实组件测试：明确保存/重置/补记成功与失败语义，失败刷新不能成功，editorError 优先错误；成功用现有 success token，错误沿既有 validation。不以文案猜语义。专家先定最小测试条款，Main 写真实组件用例后修复。
4. 所有修改精确复制到已有隔离候选；重新认领源码/差异/产物。唯一 build 后新 A8 实例采真实完整入口与异步 editor chunk，不用 A7/A6 旧网络倒签。
5. RV01-LONG/CANCEL/CONFIRM/REACH/WIDTH 原步骤采证；看板新实例真实三拖/三撤销、save/reload、cancel/reload及成功/失败样式，完整写根 hash+mtime/目录存在/保存布局字节单列。原 A6/A7 FAIL 原件保留。
6. 专家独立复验、受影响自动回归与最终全集、全部 verify、Launcher 完整出口。之后同步父执行记录与交接文档，最后统一普通提交；不 push、tag 或正式切换。

依据：`docs/testing/a7-restore-gui-independent-review-20261021-repair-contract.md`，`docs/testing/a6-board-gui-independent-review-20261021.md` §1/7。两缺陷不等于数据恢复/保存失败；文件名称仅记录接缝，尚无明确原合同，不扩修。

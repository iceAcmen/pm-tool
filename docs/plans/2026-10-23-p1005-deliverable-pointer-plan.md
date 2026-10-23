# P1L2-F02 交付物指针诊断与最小修复计划

> 记录本子单的方案、文件所有权和停止条件，供 Main 与独立专家接续。平台 trae，2026-10-23。仅诊断/开发，不签 GUI 或父门。

**Goal:** 先判真实 React DOM 能否复现交付物指针选择后 popup 不闭合、重复 trigger 不闭合及主 save 不提交，再决定是否修复。

**Architecture:** 挂载生产 `RecordsDeliverableForm`、`RecordsListbox` 与 `RecordsOverlay`，只在回调边界记录 payload；不复制业务 helper 实现、不调用服务。既有依赖只读链接且 React/ReactDOM 明确同源。DOM 不负责浏览器布局与真实命中，不能替代 Main GUI。

**Tech Stack:** macOS、nvm Node v22.23.3、既有 Vitest 2.1.9、React 18.3.1、ReactDOM、JSDOM；pnpm 11.28.5 仅环境引用，本单不调用。

## 原句与边界

- 父原句：“pm-tool父既有授权验全部已实现未验/修确证缺陷至ordinarycommit，无push/release。”
- 子单对象：“你开发限定P1L2-F02交付物指针选择/主save，不碰L2命令/P1004。”
- 子单禁令覆盖通用 SOP 的 Git、build/install/noEmit、GUI/服务、livingdocs 同步步骤；已有明确授权，不再常规问授权。
- 原 1077 件 `P1L2EventsR1` 及 testing/vendor 均只读；不访问元数据中的 private 路径。
- 最大产品写面：`src/client/views/records/records-listbox.tsx`、`records-deliverable-form.tsx` 和新对应真实 DOM test。overlay 只读，若证实其共享根因先说明具体范围，不静默扩面。
- Main 唯一 builder/GUI；本单自有 `docs/plans/2026-10-23-p1005-deliverable-pointer-*` 与 `.tmp/p1005-deliverable-pointer-20261023-r1/`。不持有构建、服务、端口、profile 或数据锁。

## 小方案

1. **采用：原证核对 + 真实 DOM 诊断。** 原脚本只读，检查 event/frame 结构、坐标、命中、transform、遮层证据。真实表单指针事件分别命中 trigger、option button/内 span、重复 trigger、主 save，记录 capture/bubble/focus/submit 与未提交回调零调用。
2. **条件采用：产品真红后最小修复。** 两次稳定复现并定位真实事件链后加载 tdd；一次只改因果必需的组件。保留键盘对照、失败保留与旧 options/payload/history/form-validation 专项。
3. **无红时停止产品修改。** 不以 helper mirror、keyboard 绿、原 ASSERT 或单截图定根因；交具体 Main 真实 pointer/bbox/elementFromPoint/事件链采证步骤，保留专家有限 GUI FAIL。

## 文件级任务

### 任务 1：政策与原证核对

- 读取 `AGENTS.md`、`docs/collaboration.md` §9/§11、专家原报告全文（含 §4/§7）、`docs/external-skills.md` 全文与 manifest。
- 运行只读 `verify-external-skills.mjs`，逐 SHA 校验 vendor；先仅加载 `diagnosing-bugs`。
- 自有 runner：`docs/plans/2026-10-23-p1005-deliverable-pointer-run.mjs`；登记必要源码、测试、依赖、原 1077 件封包输入指纹；不执行原脚本。

### 任务 2：真实 DOM 诊断

- 自有 tmp 下诊断 test/config/cache/output/input；生产源码按原字节快照，既有 node_modules 只读链接。
- 测试真实 form/overlay/listbox，不暴露 private 入口；从 DOM 按 pointerdown/mousedown/focus/pointerup/mouseup/click 执行，分别点击 option button 与内部 span。
- 必查：选择后 label accepted、popup 与 backdrop 消失、重复 trigger 一次关、未 save 零业务回调、主 save 精确一次 accepted；记录 native 事件路径/焦点/submit、实际 React 身份。
- DOM 无 layout/hit-test；JSDOM 默认激活可标 isTrusted=true，但不能冒真实浏览器输入。坐标命中与 transform 遮层仍由 Main 采证。

### 任务 3：条件修复与专项

- 创建 `packages/dsh-pm-tool/src/client/views/records/records-deliverable-pointer-dom.test.tsx` 作为诊断反馈环；仅确证根因后将相应红用例作为回归并修改生产源码。
- 条件修改上述两个生产文件之一或两者；不动 CSS、panel、sidecar、index、业务、reflect。
- 每轮新 input/cache/config/output；原输入不覆盖。运行旧 `records-options.test.ts`、`records-payloads.test.ts`、`records-history.test.ts`、`form-validation.test.ts`；若实际修改 listbox 另映射其他调用点供 Main/专家裁复验，不自行扩 GUI 门。

### 任务 4：交付与 STOP

- 精确 delta/输入输出 SHA/完整命令与 exit、历史失败及设施边界写到自有 report/receipts/seal。
- delivery 重新核 vendor、加载 code-review，自查不签专家 PASS；试点记录并入本前缀文档，不改共享试点目录。
- Main 绑定新候选后做真实 pointer/bbox 命中、原键盘切片与受影响原 B8 复验；本单不重采已通过的业务事件、不接下一功能。
- 所有子进程退出、释放本写面后 `released / STOP`；不执行 ordinary commit，父出口归 Main。

## 当前检查点

- [x] 已读限定协作规则、专家全文、vendor 政策/manifest。
- [x] 只读静态门退出 0，diagnosing-bugs 两文件 SHA 与 manifest 相符。
- [x] 原 1077 件独立核指纹相符；原 CDP 无点击命中/事件链。
- [x] 原 option/button/span 与主 save 在 DOM 正常；backdrop 默认激活 label 的局部红已复现和最小化，不冒原选项 GUI 根因。
- [x] 只取消 backdrop click 默认动作；同 SHA 7 用例两次绿、4 旧专项 28 例绿，原 GUI 红仍待 Main 复验。
- [x] 交付自查、试点已记录；最终字节保护与释放结果以 seal/final-check 为准，Main真实GUI仍待执行。

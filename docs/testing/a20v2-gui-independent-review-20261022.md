# A20V2 slash-only `/pm` 正文可见性 GUI 原证独立复核

> 2026-10-22，角色：独立 GUI 测试专家。本文只审查 A20V2 `gui-contract-r6` 已采集原证并判定 SR-G01..SR-G07；未修改产品源码，未运行或停止服务，未触碰正式端口、上游或既有测试报告。

## 1. 限定结论

**A20V2 slash-only `/pm` 正文可见性 GUI 局部复验 PASS。**

| 用例 | 状态 | 独立判定 |
| --- | --- | --- |
| SR-G01 | PASS | 成功结果只有一个可见 `role=status` 容器，首行、末行与材料行完整 |
| SR-G02 | PASS | 错误结果只有一个可见错误叶，原文一致 |
| SR-G03 | PASS | session A 标记 1 次，session B 标记 0 次 |
| SR-G04 | PASS | 非 pm 事件 `command/run.name='goal'`；pm 插件状态反馈前后均为 0 |
| SR-G05 | PASS | `/pm backup` 对应请求 1 次，面板既有反馈 1 处，conversation 副本 0 |
| SR-G06 | PASS | 无效 restore 对应请求 1 次，面板错误反馈 1 处，conversation 副本 0 |
| SR-G07 | NOT_APPLICABLE | 宿主页面无合法 UI 卸载/禁用入口；生命周期已由 AUTO SR-A06 覆盖并独立 PASS |

本结论只关闭 A20V2 的 slash-only `/pm` 正文可见性缺陷。它**不自动关闭 RA-P0007、不签署 A20 总门，也不授权提交、推送、tag、发布或正式服务切换**。

## 2. 候选与原证绑定

- 基线提交：`9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`
- 候选 manifest：`reports/all-pending-evidence-20261021/A20V2/candidate.json`
- manifest SHA256：`c0e678055ee2dee6be40f99ebe52f88843a7de9933a26c87007d1678f834946b`
- `lib/client.js` SHA256：`a5e3586bfbd641c59bdb4978c29d8489c94f0eb0711a9c6e2ba2992aa235ea39`
- 采证时 profileLink：`/private/tmp/pmtool-a20v2-closure-20261022-r1/packages/dsh-pm-tool`
- 隔离运行根：`/private/tmp/pmtool-a20v2-runtime-20261022-r1`
- 隔离端口 / PID：`3255` / `44229`
- session A：`session-f944155e-10d6-4c7c-8bbd-c214fe0c98fa`
- session B：`session-66484c81-8f5b-4b56-8ab9-bed27e1cf58d`
- 最终 GUI 批次：`reports/all-pending-evidence-20261021/A20V2/gui-contract-r6/`

独立复算 manifest 与冻结树 `lib/client.js` 的 SHA256，均与上述声明一致。SOURCE SR-S01..S07、AUTO SR-A01..A10 已由 `a20v2-source-auto-independent-retest-20261022.md` 对同一候选判定 PASS。此次仅审查已封存 GUI 原证，不对运行实例做实时操作。

## 3. 逐项审证

### SR-G01：PASS

- 请求 `rpcId=8fe3e724-3d0b-4cba-b0be-96cbc687b4ac`，session A 从宿主 composer 执行 `/pm reflect t-0004`；对应 `command/run` 与 `command/done` 的 `commandId` 均为 `cmd-dbd5385f-22`。
- 原始结果为 `kind=success`。`g01-success.json` 记录一个可见 `LgN1xW_notice`，位于 conversation，`visibleNoticeCount=1`、`commandCards=0`。
- 首行 `复盘 ID：ref-mvj42quw-uq3nhz`、末行三反引号、材料行 `资料区已登记：1 个文件（质量由人复核）` 均在同一状态容器中完整存在。
- 材料字段在同一结果的句级摘要和内嵌 JSON 中各出现一次，属于同一 `role=status` 容器的正文内容，不是两个 UI 容器。
- 已实际目视 `g01-success.png`：页面只有一条成功状态条，正文首尾与材料内容可见。

### SR-G02：PASS

- 请求 `rpcId=0370d6ad-9a93-403e-ad6e-2772f75d3e98`，session A 执行 `/pm reflect t-9999`；对应结果 `commandId=cmd-dbd5385f-23`、`kind=error`。
- 原文 `未找到任务：t-9999。` 只出现于一个可见错误叶：`visibleErrorLeafCount=1`；无成功状态容器、无命令卡。
- 已实际目视 `g02-error.png`：顶部只有一个错误 Toast，文案未加前缀、未截断。

### SR-G03：PASS

- 请求 `rpcId=ea7242d4-f424-4a9c-801f-ad180c5a5342` 的目标明确为 session A，结果 `commandId=cmd-dbd5385f-24`。
- 唯一标记 `复盘 ID：ref-mvj42quw-uq3nhz` 在 session A 为 1 次，在 session B 为 0 次。
- 已实际目视 `g03-session-a.png` 与 `g03-session-b.png`：A 显示该 `/pm` 正文状态条；切换到 B 后不显示该标记。B 中既有宿主失败记录及 `/goal` 历史不构成 `/pm` 串线。

### SR-G04：PASS

- 请求 `rpcId=c9cef5dc-0a4c-4f57-8741-2b0e78aa3b49` 的命令行为 `/goal `，事件为 `command/run.name='goal'`，结果为宿主原有 goal 文案。
- `pmStatusBefore=0`、`pmStatusAfter=0`，证明 pm 插件未新增状态回显。
- 已实际目视 `g04-non-pm.png`：页面新增的是宿主 `/goal` 命令及其原有结果，没有 pm 状态条或 Toast。

### SR-G05：PASS

- r6 全部请求中与 `/pm backup` 对应的请求严格 1 次：`rpcId=d57a489c-a82f-460e-9783-95a1fb5d41ed`。
- `panelFeedback` 只有一项 `备份完成...`；`conversationCopies=0`。
- `g05-panel-success.json` 只有一个位于 pm 面板内的 `pm-result-card`，`commandCards=0`。
- 已实际目视 `g05-panel-success.png`：面板只有一张既有“备份完成”反馈卡，conversation 无同正文副本。

### SR-G06：PASS

- 无效恢复路径请求严格 1 次：`rpcId=5487e848-c033-408d-bfc9-a55c13815dc9`，命令为 `/pm restore "/private/tmp/a20v2-definitely-missing-backup.json"`。
- 返回 `kind=error`，面板错误反馈只有一项，`conversationCopies=0`。
- `g06-panel-error.json` 只有一个位于 pm 面板内的 `pm-result-card pm-result-card--error`，`commandCards=0`。
- 已实际目视 `g06-panel-error.png`：面板只有一张既有恢复失败反馈卡，conversation 无第二份错误。

### SR-G07：NOT_APPLICABLE

- r6 页面与宿主既有导航中没有合法的测试插件卸载或禁用入口。按合同不得伪造 UI 卸载动作，因此本项记 `NOT_APPLICABLE`。
- 同一候选的 AUTO SR-A06 已独立 PASS：真实 Cordis Context 卸载后零新增通知，重复装载/卸载不累计监听。该 AUTO 结果覆盖生命周期，不替换其他 GUI 用例。

## 4. 证据清单与目视记录

已读取 `gui-contract-r6/summary.json` 及同目录全部 7 份逐项 JSON；已逐张实际目视同目录全部 7 张 PNG：

- `g01-success.json` / `g01-success.png`
- `g02-error.json` / `g02-error.png`
- `g03-session-a.json` / `g03-session-a.png`
- `g03-session-b.json` / `g03-session-b.png`
- `g04-non-pm.json` / `g04-non-pm.png`
- `g05-panel-success.json` / `g05-panel-success.png`
- `g06-panel-error.json` / `g06-panel-error.png`

r6 `console=[]`。旧 `gui-core` 只作同候选成功/错误可见性的辅助对照；最终逐项判定以 r6 为准。

## 5. 独立边界

本轮没有运行、启动或停止任何服务，没有访问正式端口，没有修改产品、上游、冻结候选、既有 FAIL/PASS 报告或其他测试产物。除本报告外不产生仓库写入。

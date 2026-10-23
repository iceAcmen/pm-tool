# 任务页 stale 通知最小布局修复合同

记录原叠压缺陷和最小复验，给 Main 与同 panel 唯一开发使用；本专家仅写合同，不开发或执行 GUI。

日期：2026-10-23；平台：trae；固定任务域真实接续。原角色 `arun_6adabe9c7cfef4f845ad6d4e` 已 finished，followup 明确拒绝需新 spawn；此次接续不冒称原角色仍在运行，不重做已审 GUI。

## 1. 原独立红与依据

沿 [R3 报告](tasks-failure-gui-timed-20261023-r3-report.md) 和 [原审计](tasks-failure-gui-timed-20261023-r3-audit.json) 的 `staleBannerLayoutOverlap=FAIL_LIMITED_VISUAL`：已有成功快照后真实拒读，通知挤为左侧长列，导航/顶栏文案叠压。依据 [原 §6.1](remaining-journey-cases-20261021.md#61-页面矩阵) 的文案不重叠、控件可达；不是新增全站 banner 设计规范。

原件为 [TimedTasksLoadingR2](../../reports/all-pending-evidence-20261021/TimedTasksLoadingR2/index-r1.json)，index SHA256 `73df3c773564d27a1212aa4da8312c3aa3a67a1199a94cfd9c1364a2e03b1e36`；[失败 PNG](../../reports/all-pending-evidence-20261021/TimedTasksLoadingR2/round02-read-failed-visible.png)、[恢复 PNG](../../reports/all-pending-evidence-20261021/TimedTasksLoadingR2/round02-retry-recovered.png) 已由原专家审看，本轮只继承该已签原段。原候选 `CombinedF02RepairR2`、基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，实际 1440×770/深色/DPR2，不是 900 高或原生 200% 整格。

首读修后 `panel.tsx` SHA256 `b83eba55bb0f40e69599af04d95adb9c6f3133ceab645fef3d6f92734ab14cf4` 仍把已有成功后的通知置于 `.pm-shell` 内、`NavRail` 前；`panel.css` L262–267 是横向 shell 与纵向 `.pm-main`。这支持最小位置修正，**不替代修后真实视觉证据或运行时精确布局归因**。

## 2. 唯一写者与最小文件合同

父范围仅所有已实现未验及确证修复至 ordinarycommit；不新增功能、push、release 或正式切换。Main 唯一整包 builder/GUI；首读两文件已释放后，由 Main 调度同 panel 唯一开发，和 L8/O4 合并一次整包构建。不得抢写或借首读 SOURCE/AUTO 绿关闭本红。

| 文件 | 最小动作 / 不变量 |
| --- | --- |
| `packages/dsh-pm-tool/src/client/panel.tsx` | 将**已有成功后的同一** `{hasSnapshot && stale && !busy && ...}` 通知块从 `NavRail` 前移入 `.pm-main` 的纵向内容宽位，例如其首个子块。保留 `role="status"`、原陈旧文案、重试按钮及 `void refresh()`；不把通知留作 rail/main 的额外 flex 列，不把未知首读伪装为旧数据。 |
| `packages/dsh-pm-tool/src/client/panel-transport-error-feedback.test.tsx` | 唯一开发先补真实组件位置断言：失败后通知归 `.pm-main`、不作 `.pm-shell` 直接子列；同时保留成功旧数据、原原因及可用重试，成功后陈旧通知消失。先红后绿，位置断言不能宣称视觉通过。 |
| `packages/dsh-pm-tool/src/client/panel.css` | 默认不改。只有移位后真实证据仍有局部折行/宽度缺陷，才由 Main 认领最小 `.pm-stale-banner` 局部补丁并重测；不改变 shell/rail/topbar、token、全局样式或抽屉。不得作为额外重设计授权。 |

不得清空成功数据、禁掉重试、增加全局错误清除/取消入口、改 domain/schema/命令/来源/时间或其他页设计。旧错误卡不在此修复对象内。

O4 **只引用** [既有最小合同](tasks-failure-gui-timed-20261023-r3-o4-escape-plan.md)，不另定义事件规则或将注册先后假设写成已证根因。

## 3. Main 原动作的最小真实复验

1. 冻结合并候选：记录基线、tracked diff、新文件指纹、全部声明输入、产物、真实宿主/端口/PID、页面与开关。旧包不冒新候选，Main 唯一写整包输出。
2. 在有合法项目/任务的隔离库，成功读取后记录项目、任务 ID/字段、当前筛选和可见行；不通过 DOM/返回体修改制造初态。用原 FS 方法只拒一次真实 snapshot，保原原因与实际请求/失败。
3. 在 **1440 / 1024 / 768 / 390** 四个真实浏览器 CSS viewport（原合同目标高度 900）分别采通知可见态：通知在内容纵向宽位；导航、顶栏、全通知文案和“重试”无叠压/裁切；Tab 可达重试，主控件可达，外壳不产生二维横滚。记录实际 inner/outer、宿主/PM 容器宽、主题、pilot、原生 zoom；达不到目标高度如实记 BLOCKED，不用假尺寸。
4. 各宽由原“重试”控件发出真实读取，成功后通知消失、旧项目任务仍正确，无意外业务写；交失败→点击/键盘→在途→成功的连续真实原证。不能用 HTTP200、jsdom、bbox 或一张末截图替代过程。
5. 交原脚本文本、实际 stdout/stderr/终码、逐步起止与耗时、请求/响应、前后声明 roots/raw、状态 JSON、PNG/必要连续帧及 seal/readback。DOM/bbox/滚宽只作辅助，由独立专家审目视与交互后给各有限结论。

此处四宽是本次明确最小复验，不新造全站矩阵或新分母。浅深/100/原生200%、默认OFF/pilot ON等其余原 §6.1 条件仍沿原 ID 和既有缺口；本轮未提供的条件不能关闭整格，也不追溯扩大原 1440×770 有限结果。

## 4. 分层判定与停止

- stale 叠压仍为 **FAIL_LIMITED_VISUAL**，待上述修后封件；本合同存在不等修复通过。
- 原成功旧数据保留/重试去陈旧标的有限 PASS 保留其旧候选与步骤，布局变更的受影响段需新证；未受影响且字节/接线一致者由专家逐项决定继承，不机械重放全部旧 GUI。
- 原 `persistentOldErrorCardAfterSuccess=BLOCKED_RECOVERY_UX` **保持独立**。须解释原卡是当前失败还是历史错误，并交原恢复路径可辨原证；不以本通知移位/消失当错误卡恢复 PASS，不自行要求清除全部历史卡。
- 本专家合同完成即 STOP；不签整任务页/O4/O5/B8/父 ordinarycommit，也不碰 Main 的并行 3270 人员恢复。后继由 Main 唯一开发/整 build/GUI，独立专家仅审明确新封件。

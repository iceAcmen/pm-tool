# 任务页首读误空最小先行合同

日期：2026-10-23。角色：trae 独立 GUI 原证专家，非开发、非 GUI 执行。仅交 Main 实现与采证，不新增功能、oracle 或矩阵。

## 1. 先行缺陷

**FAIL_LIMITED_GUI：首次 snapshot 尚未返回时，已有项目的隔离库被呈现为“暂无项目／建立第一个项目”。**

原依据为 [remaining-journey-cases §6.1](remaining-journey-cases-20261021.md#61-页面矩阵) 的 tasks FE、loading/busy 诚实及无无来源示例。原包 [index-r1](../../reports/all-pending-evidence-20261021/TimedTasksLoadingR2/index-r1.json) 为 613 件，SHA256 `73df3c773564d27a1212aa4da8312c3aa3a67a1199a94cfd9c1364a2e03b1e36`，独立逐件核验无差异。

[实际首读 PNG](../../reports/all-pending-evidence-20261021/TimedTasksLoadingR2/round01-loading-visible.png) 与状态 JSON 的时间为 `01:45:02.400Z`；同一 RPC 请求 `01:45:02.011Z`，真实 success 返回 `01:45:05.494Z`。首读原响应 `holdMillis=3481`，返回 3 项目、11 任务，当前 A 项目实际 10 任务。故障不是合法空库，也不是从无结果筛选借来的画面。

候选限 `CombinedF02RepairR2`，基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，旧宿主 3269/PID22463，新 Chrome PID48286；实际 1440×770、DPR2、深色，原生 zoom 未核。本计划不签 `RA-V-tasks-1440-dark-100-loading` 整格，不绑定新 L8。

## 2. Main 文件级最小方案

| 对象 | 用途与影响边界 |
| --- | --- |
| `packages/dsh-pm-tool/src/client/panel.tsx` | 先查首个 snapshot 请求状态与空项目渲染分支。请求未完成时呈现已有加载状态，不把未知项目集合当已确认空库；只有真实 success 确认空集合后才显示首项目引导。保留已有任务成功显示及旧 snapshot 陈旧恢复链，不改 domain、schema、命令或正式实例。 |
| `packages/dsh-pm-tool/src/client/panel-transport-error-feedback.test.tsx` | Main 先核现有测试覆盖；在既有真实组件测试内补首读延迟时不误空、成功后按返回值显示的受影响回归。独立专家不写或执行产品测试，不重跑无关已签任务变更/rollback/ask。 |
| 本前缀新复验证据报告 | 原 FE 首读动作重复采证，并核本次变更影响的 FS 重试链；不以自动绿或 HTTP200代 GUI 通过。 |

这里只确定可见状态错误，**未确定源码根因**。文件为原候选清单中可核的优先调查对象，不把实现位置或修复办法假称已验证。

## 3. 原动作复验边界

1. Main 认领修后候选、tracked diff、新文件指纹、产物与真实实例；唯一 builder/GUI/桌面职责不变。不复用本包冒充新候选。
2. 在有真实项目/任务的合法隔离库，正常进入任务页，hold 首个真实 snapshot 至少 3 秒，采未返回实际 PNG/必要连续帧；此时不得出现“暂无项目／建立第一个项目”的空库事实。
3. 释放真实传输，不改返回体或 DOM。原 success 后显示正确项目、任务；原错误/重试分支按原合同，不引入新的全局取消按钮。
4. 交原请求/响应、前后 roots/raw、脚本文本、viewport/zoom/开关、逐步真实 timing 与封件索引；可见通过只签该有限段。900 高、各档浅深/原生200%仍按原 ID 缺口，不新造矩阵。

停止条件：本专家给计划后不开发。Main 修复后交封件，由同一固定专家复验；未封件不裁 PASS。父 ordinarycommit、B8、整任务页与无关已授权工作由 Main 统筹，本计划不签或暂停它们。

## 4. 同域后续

负责人补充：Main 正采原 O5 表单四态与 O4 仅说明 dirty 退出；`TimedO5FormR1`、`TimedTaskDirtyR1` 尚待封。O4 真确认为 `dialog`，首次错误等待 `alertdialog` 的真实 exit1 保留为执行设施失败，不定为产品失败。封后沿原 O5/O4 合同由本固定专家接续，不读取未封目录，不重派专家或重验已签其他任务。

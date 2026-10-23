# O4 说明 dirty 确认 Escape 最小先行合同

日期：2026-10-23；角色：同域固定独立原证专家，非开发/GUI 执行。本计划限原 TaskForm O4，不新增矩阵或全抽屉守卫。

## 1. 原合同与当前证据级别

原 [RA-TOOL04](remaining-journey-cases-20261021.md#7-ci与工具试点) 要求：clean 直关、dirty confirm；ESC 保留、Enter 放弃、焦点归还。原 [O4-5](main-o3-o5-samepage-assertions-20261020.md#o4-未保存草稿-dirty-确认重点) 明确确认层 ESC 取消关闭弹层，内容保留、焦点归还触发按钮。

Main 本次报告：`TimedTaskDirtyR1` 的 `round01-error-state` / `round02-error-state` 原图和 fields 中草稿仍在；第一次等待 `alertdialog` 出错，实际确认 role 为 `dialog`，真实 exit1 留存。后续正确识别确认后按 Escape，确认仍在；Main 将交已封件。

**候选红项：确认内 Escape 无法退出。当前独立状态为 BLOCKED_SEAL_PENDING，不假称已看未封 PNG 或独立 FAIL。** 封后若原图、时间、正确 role 与真实按键链支持以上观察，按原 O4-5 判 `FAIL_LIMITED_GUI`。role=`dialog` 本身不判产品缺陷；首次 locator 假设错误是执行设施失败，不用 exit0 或后续成功覆盖 exit1。

## 2. 最小修复调查

| 对象 | Main 动作与影响边界 |
| --- | --- |
| `packages/dsh-pm-tool/src/client/panel.tsx` 内 `DrawerPanel` / `requestClose` | 查已有 window capture Escape 是否在确认已打开时再次触发外层 close guard；仅处理确认与 TaskForm 退出事件的归属，不能丢未保存说明，不扩大所有抽屉 dirty 保护。 |
| 现有 `ConfirmHost` / `confirmDanger` 实现与原确认测试 | 核确认内 Escape 是否先取消当前确认，是否被外层捕获重新调用替换。优先复用既有确认可见状态/事件归属机制；未核源与事件前不指定重写、全局 listener 次序或万能 stopPropagation 方案。 |
| 本前缀封后审证补片 | 绑定精确候选与原 O4 分支，保留两次真实失败及实际取消/Enter 结果；不执行产品 tests、Main 脚本或浏览器。 |

Main 提供的 capture 顺序解释是**待证假设**，不是已确定根因。若要改产品，先记录最小文件/diff 与受影响原用例，再由 Main 唯一 build/GUI 采证。独立专家不开发或自验收。

## 3. 原分支的最小复验

1. 原任务抽屉 fresh clean，保持原字段；只改 description 后由原退出入口触发实际 `dialog`，保存初态/说明/确认焦点与原始事件。
2. 在确认内按真实 Escape：确认关闭，原任务抽屉仍开，description 原字节保留；焦点归还原触发控件。不能用点击取消的成功代替 Escape。
3. 重新触发 dirty 确认，按原 Enter 放弃分支：确认和抽屉按原合同退出，任务/资料/记录 roots 无业务写。Main 已获准先用实际“取消”按钮退出确认保草稿、再继续 Enter 原分支；这是继续采证，不是修好了 Escape。
4. 同包保留首次错误 locator 的 exit1、正确 role 后 Escape 实际失败、恢复/Enter 原证；脚本只按文本审，交真实子终码、roots/raw、PNG/必要帧、焦点、按键时间及完整 seal。

尚未采到的 clean、各原退出入口、保存后不二次弹等分支保持原状态，不按本片扩大为 O4 全项 PASS，不重已签任务变更/rollback/ask。固定专家等 Main 通知封件后接续；封件前不读取新目录，不另派新专家。

## 4. 封后独立裁定

本节追加，不覆盖以上“封前待审”历史。Main 已交 [TimedTaskDirtyR1/index-r1](../../reports/all-pending-evidence-20261021/TimedTaskDirtyR1/index-r1.json)，315 件，SHA256 `9d324c405a4bd92fbc8cb98bcf298be037f6edc8ec89be29674ee62798310f20`；逐件独立核验无差异，6 态 roots/raw 同，31 帧、0 RPC。

**确认内 Escape：FAIL_LIMITED_GUI。** follow 正确定位真实 `dialog` 后调用真实 `page.keyboard.press('Escape')`；action `02:00:11.308Z` 至 `02:00:17.409Z` 等待确认消失失败，真实外层 exit1。独立目视 [round02-error-state PNG](../../reports/all-pending-evidence-20261021/TimedTaskDirtyR1/round02-error-state.png) 和前后必要帧，`02:00:17.488Z` 仍有“放弃未保存修改？”确认与任务抽屉，说明原字节 `\nO4计时验证仅草稿_20261023` 保留。首次错 `alertdialog` 的 exit1 不算产品失败；本 follow 的实际按键后状态违反原 O4-5。

**取消按钮保草稿、X 再确认/Enter 放弃：PASS_LIMITED_GUI 各自子段。** 取消后焦点回 description，说明未丢；X 后确认初焦点“放弃修改”，Enter 后 dialogs=0，焦点回“编辑 F3-fixture-F5”，业务 roots/raw 不变。此成功不抵消 Escape FAIL。

封件 `frozen-panel.tsx` 与候选源码清单 SHA `341675c4dd31b87d05264de520a4c198edbb3c3476f2f87d8f38cc80ba1d83d6` 同；`frozen-confirm-dialog.tsx` 与 complete-inputs 的 `src/client/confirm-dialog.tsx` SHA `20ac37fb455e783f44bd539349bb4f8dd65c7b3e8334d5960f68380bde51fdcd` 同，均仅读文本。`DrawerPanel` L2238、L2256 与 `ConfirmHost` L66、L69 是同 window capture Escape；TaskForm L2504–2517 dirty 会再次调用 confirmDanger，后者 L33–37 可替换 current。**可疑重入条件已有静态支持，但真实 listener 顺序与 current/resolve 运行链未采，根因仍未签。** 修复先解决已确认可见行为，按 §2–3 受影响范围交新封件，不自行开发或扩大重测。

## 5. 剩余原退出吸收与合并调度

追加 [TimedTaskDirtyRemainingR1](../../reports/all-pending-evidence-20261021/TimedTaskDirtyRemainingR1/index-r1.json)：755 件，SHA256 `9c92455036dee16a4ace746a1e50cd26d52b8674e18e8d0bbea54840bad48edf`，15态/83帧、47根/41raw同、0RPC、outer14.352秒exit0。独立逐件指纹、15态 PNG/fields/焦点及原脚本文本核对后，**clean fresh X/scrim/cancel直关、dirty fresh scrim/cancel→取消保说明→再confirm→Enter放弃，各 PASS_LIMITED_GUI**。说明保留为原 `\nO4-scrim-仅草稿` / `\nO4-cancel-仅草稿`；取消后焦点归还对应触发控件，放弃后归还同任务编辑按钮。此补包不重原确认Escape FAIL、不签多选dirty/保存后不二次弹或O4整项。

Main 已启动首载 `panel.tsx` 独占写。**O4 本计划只交 Main 合并调度，不另开抢写 panel 的开发任务。** 最小事件合同为：确认打开时本次键盘动作由确认层处理，下层抽屉不能对同一次 Escape 再起 dirty confirm；确认取消仅关确认、保原说明与任务抽屉，Enter原放弃仍可用。

可核源码机制：上下层都在同一 window capture keydown，抽屉没有确认层事件归属判断；`stopPropagation` 不能阻止同一事件目标上其余 listener，`confirmDanger` 可直接替换 current。这足以提出上层模态/事件归属的修复调查；**不等于已证明“抽屉先执行”的具体注册顺序**，实际先后/current resolve轨迹不在封件中，不能照抄 Main 猜测为运行时真根因。Main 应核该机制后实施最小门控，交修后原确认Escape与受影响既有退出分支封件；未受影响且字节一致的成功子段由专家审继承，不无故全部重放。

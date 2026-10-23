# 任务首读 SOURCE/AUTO 独立窄审 R1

记录首读修复的有限独立结论，给 Main 合并接续；不能用于 GUI、整任务或父 ordinarycommit 放行。

2026-10-23，trae，固定任务域新接续独立专家。原 `arun_6adabe9c7cfef4f845ad6d4e` 已 finished、followup 明确拒需新 spawn；本轮不重做原已审 GUI。已读 AGENTS、collaboration §9/11、10:15 必要接续、原 R3 报告/审计及首读/O4 合同。显式派单替代通用 fetch/install/build/git/livingdocs，本专家没有这些动作或产品写。

## 有限结论

**PASS_LIMITED_SOURCE_AUTO，仅首读最小修复及本表实际自动范围。** 源差异符合先行合同，未发现范围内源缺陷；自有隔离真实组件复测原版 6 红/3 绿、修后 9 绿。**修后 GUI 为 BLOCKED_NEW_GUI_EVIDENCE**，须 Main 交新候选真实封件；原首读 GUI FAIL 不被自动绿洗掉。

| 对象 | 独立核验 |
| --- | --- |
| 基线 / 声明输入 | `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`；声明 source126 / 包输入527。126含15 launcher路径，交叠111包路径统一前缀后 SHA 全同；不是宽扫全候选、整 build 或运行身份。 |
| 原 panel | `341675c4dd31b87d05264de520a4c198edbb3c3476f2f87d8f38cc80ba1d83d6` |
| 修后 panel | `b83eba55bb0f40e69599af04d95adb9c6f3133ceab645fef3d6f92734ab14cf4` |
| 红绿同测试 | `ec0bcc59fb57b925968ba533c2075ef21f39f7c120a252b8935027b280777277` |
| 开发封件 | `/private/tmp/task-firstload-developer-20261023-QO7zxE`，4452对象实核差异0：4292字节文件、160软链目标记录。readback4452；handoff/seal/readback真实 outer均0、released=STOP，非开发自PASS。 |
| 源差异 | 每轮416输入/src410，最终红绿 src 差异仅 panel；修后三轮同 panel/test。原 launcher mount effect、DrawerPanel及之后定义逐字不变。 |
| 原自动证据 | 同测试 red-r4 exit1＝6红/3绿；green-r2 exit0＝9/9；affected-r2 exit0＝23+5+2共30/30；type-r2 exit0。本专家审原邻接/type，不声称重新运行。 |
| 独立复测 | 自有目录、真实 PmPanel/createRoot/StrictMode，只替 DOM/transport；red child exit1＝6红/3绿，green child exit0＝9/9，29条观察（HTML/content/calls/handshake/fixture）与开发最终绿逐字一致。不是浏览器视觉证据。 |

实现把初始空集合视为未知，以独立 snapshotPending 和当前有效 generation 控制就绪；成功空库才显示首项目引导，首败可重试，已有成功后失败保数据。测试覆盖项目延迟、空成功、首败/重试、成功后陈旧恢复、成功空后失败、Strict旧 empty/project/reject 和通用命令 busy。不宣称 schema 全验证、同 generation 多并发响应排序或整页覆盖。

## 红项与先行合同

原 stale 左长列顶栏叠压 **FAIL_LIMITED_VISUAL 保留**。已新增 [最小布局先行合同](tasks-failure-gui-timed-20261023-r3-stale-layout-plan.md)：通知移入内容纵向宽位，保成功旧数据/重试，四真实 viewport 交原证；不额外重设计。

原 oldError 卡恢复 **BLOCKED_RECOVERY_UX 保持独立**，不能因通知消失/移位转绿；原 O4确认 Escape FAIL 仅引 [既有合同](tasks-failure-gui-timed-20261023-r3-o4-escape-plan.md)，不签注册顺序根因。原已签 GUI 子段继续保持其原候选/动作范围，本轮未重采或扩签。

## 计时与设施边界

macOS arm64/bash、Node22.23.3；复用只读 Vitest2.1.9、React18.3.1、jsdom25.0.1，TypeScript5.9.3仅原证。pnpm11.28.5是环境口径，本轮未调用。src/config/cache/HOME/TMPDIR/output均自有临时根；依赖只核声明 package.json/有效别名，不声称依赖全树或全机零污染。

实际命令、起止、耗时、终码见 [逐步收据](tasks-firstload-source-auto-20261023-r1-command-receipts.md)，结构化依据见 [审计](tasks-firstload-source-auto-20261023-r1-audit.json)。首个计时点至审计结束257.691秒；红绿外层并行5.380秒，不能把5.311+5.373双计。早期阅读/手工编辑仅工具 wall time，无完整起止，不倒填。原开发设施错误/type2、全部红轮以及本轮 rg缺失、JSONC/软链解析错误均保留，不当产品新缺陷或以绿覆盖。

效率限制：起步摘要输出过大、误认JSONC/软链/路径域导致额外读证；修正为结构化限定摘要。未为审局部重新 build 或重跑已审 GUI；无整功能完成事件、整体百分比=null。

## 封交与停止

正文冻结后以本前缀 `seal.json` / `readback.json` / `seal-tool-receipt.md` / `release.json` 的实际结果闭环，不提前补造封存收据。仓库仅写本前缀与上述 stale 合同；未读活 runtime/private/凭据或触碰并行3270人员恢复。

完成封回即 **STOP**。Main按原父授权调同panel唯一开发 O4/stale，合并L8一次整build，再交受影响真实GUI；本报告不签整任务页/O4/O5/B8/父ordinarycommit，不授权提交/push/release/正式切。

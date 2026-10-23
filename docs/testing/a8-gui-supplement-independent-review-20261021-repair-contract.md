# A8 恢复错误重复前缀最小复验合同

> 2026-10-21，trae，独立 GUI 原证审证专家。给 Main 与后继独立专家使用：仅登记已生效反馈合同下的确证缺陷及先行用例，不开发、不操作 GUI/服务、不签总门。

## A8-RV02：P2，局部 GUI FAIL

- 对象：冻结 A8，基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` 加 A8 候选补丁及源指纹；宿主 `1142fb74f2bbcc54dc9499054c0448c9b876cbf2`，原证 origin3219。不是 A9 当前源码的结论。
- 有效依据：[原补采合同](batcha-independent-findings-and-main-worklist-20261021.md) §4.3 B1-GUI-03 明确“备份预检单前缀/长错误持久且单处”；[批准修复计划](../plans/2026-10-21-batch1-closure-fixes.md) §3 明确场景前缀去重。不是待表决设计矩阵或新增文案偏好。
- 新原证：[hash.json](../../reports/all-pending-evidence-20261021/A8/restore/negative-r3/hash.json) 与 [hash.png](../../reports/all-pending-evidence-20261021/A8/restore/negative-r3/hash.png)，时间 `2026-10-21T15:05:02.781Z`，实际结果卡为“恢复失败：备份/恢复失败：manifest 与元数据不符：fa-0001”。原图已独立目视，两重场景前缀确实可见。missing/path 同轮独立拒绝另审，不拿 r2 旧反馈冒充本轮错误。
- 源定位使用已冻结 A8 独立复验副本：`core/ui-feedback.ts:144-150` 的 `prefixFeedbackOnce` 只识别完全相同的 prefix；`commands/backup.ts:82,116` 返回“备份/恢复失败：…”；`client/panel.tsx:1191` 再加“恢复失败：”。组合场景已有前缀不被识别，形成重复。原完整响应另在主报告认领，不读当前 lib 代证。
- 这是反馈契约失败，不是备份校验失效、事务失败、数据丢失或两个独立缺陷；P2 不默认豁免。旧 FAIL/原件全部保留。

## 最小修复边界

| 文件 | 最小动作 | 不做 |
| --- | --- | --- |
| `packages/dsh-pm-tool/src/core/ui-feedback.ts` 及对应原测试 | 在已有场景前缀接缝中识别明确的备份/恢复组合前缀，避免再嵌套恢复场景；仅采用明确允许的场景映射，保留原因原文 | 不全局删除所有“失败”，不改成功信封/错误分类，不正则清洗原因正文 |
| `packages/dsh-pm-tool/src/client/panel-restore-path.test.ts`，必要的真实组件测试 | 真实 PmPanel 收到“备份/恢复失败：原因”时结果卡只有一个场景前缀；完整原因、输入和拒绝边界保持 | 不 mock PmPanel 本体，不仅测 helper，不绕过生产命令返回 |
| `commands/backup.ts` / `client/panel.tsx` | 若 Main 选择在原调用点统一明确场景，则仅处理反馈组装并登记所选影响 | 不改 precheck/confirm/rollback/sidecar 协议，不借机实现 filename 投影或新恢复功能 |

允许保留“备份/恢复失败：原因”或统一为“恢复失败：原因”，但只能有一个场景前缀且原因完整。不锁定新类名、色值或新的文件名展示要求。开发按父持续授权执行，独立专家只维护本前缀。

## 先行测试与新原件

1. **RV02-A01**：原 `prefixFeedbackOnce` 同前缀中文/英文冒号、无前缀 Error/string 继续原期望；组合备份/恢复前缀不得再被包恢复前缀。原因中确有“恢复失败”的正文必须保留，不删 stack 之外的合法原因、不吞多行。
2. **RV02-C01**：真实 PmPanel 本机路径预检独立返回 hash/缺侧车/relPath 越界三类原错误；等待每类特定完成信号，再取结果卡。一次持久 alert、单场景前缀、完整原因及完整路径输入保留，零恢复 confirm。旧 format/JSON 错误路径及正常完整预检/两确认/取消回归。
3. **RV02-G01**：Main 唯一 GUI 端在新认领隔离实例逐类采上述三错误的原截图/帧、脱敏请求结果与稳定 JSON。不能仅等待任意旧“恢复失败”，不能用 r2 历史 error 代新错误。
4. **RV02-G02**：同窗口原三根完整键/hash 前后零差异；需要 mtime 的取消保护按已有缺口补当时真实前后记录，不事后造 before、不扩全 disk 门。原成功/关闭/复制接缝回归，未采不签。
5. **RV02-ID**：新 dirty 源/补丁/声明/产物/实例/开关及 uncached 完整响应另认领，受影响反馈 GUI 与组件结果不得继承旧 A8；不覆写 A8 原 FAIL。

本合同先行交付；本专家不运行产品测试、不修代码、不等待后继全部矩阵。最终有限分层结论见同前缀主报告。

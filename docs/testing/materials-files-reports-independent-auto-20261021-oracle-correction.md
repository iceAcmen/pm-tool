# 给原余计划 Owner 的 Oracle 纠正回执

> 2026-10-21，Main核定证据后独立复核；只改本专家自有断言/报告，不修改他人计划。接收方：`remaining-journey-cases-20261021.md` / 总登记的原测试计划owner。旧轮原红完整保留，不删除、不把旧输出改成绿。

## RA-R01 / RA-J04

- 有效证据：`b6-backup-qa-findings-20261020.md` §A明确独立冻结PASS：源edit后旧revisionId冲突拒、不静默抓新；`src/client/views/records/records-wiring.md` L102附近注明后端复核当前修订与stale拒绝。Main核定本轮未授权新增“selectedRefs主动选任意历史版”。
- 原余计划要求E1已有rv1/2/3却选rv2经selectedRefs保存，与有效已冻结合同冲突。旧轮`RA-R01/AUTO-selected-historical`失败重分类为 **ORACLE_CONFLICT**，不是产品FAIL、不能驱动弱化stale守卫。
- 本专家新轮：同F3的rv2 selectedRefs明确拒绝且库/字节零写；preview当前rv3+E3rv1→真实report命令save，摘录正文/作者/日期/三元组一致；源改rv4/作者并软删后，该已存汇报不变；完整匹配的真实历史rv2 excerpts路径另外合法保存并冻结。
- 请原计划owner纠正RA-R01/J04的“当前版在当时冻结”动作与历史excerpts分路，保留剩余GUI完整旅程；不得把新期望自动倒填旧录屏或改为随源更新。

## RA-M03

- 有效B2 ops复验`b2-p3-ops-retest-qa-20261020.md`Q2/Q7等只规定软删可恢复/稳定ID/历史保全，没有明确“对已active条目第二次restore必须成功”。Main未找到更晚有效幂等成功授权，原余计划属单方追加。
- 旧轮`RA-M03/AUTO-idempotent-retry`失败重分类为 **ORACLE_CONFLICT**。现production对active重复restore返回未找到可恢复条目的error，前后零写；unknown entry必须继续拒绝，不能为了假幂等吞错误。
- 本专家新轮保留软删→候选排除→首次restore同ID及全部revisions原样的真实正例；active重复和unknown两错误分支逐项零写。请原计划owner删去未经授权的成功幂等期望，而非改产品或改旧证据。

## 保留与后续

原 `01E1Jl/1XffrJ/FYWXrI/U5NQMs/rVmeKk`的stdout/results/assertion文本均不改；读最终报告应先读本纠正。独立最新执行用新的子ID和源指纹认领，不以总数代签。含字节JSON-only恢复与不完整预检两项仍是真实产品接缝问题，和这两个oracle纠正互不替代。

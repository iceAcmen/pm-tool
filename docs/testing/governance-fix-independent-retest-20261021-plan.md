# GG 四缺陷与受影响治理独立复验计划

> 2026-10-21，trae，独立测试专家。仅本前缀文档、evidence 与 selftmp 可写；不开发，不签整个 dirty、Main 构建或 GUI。

## 授权与对象

父授权原句：“好的，按之前的盘点文档和这个分工方案继续推进，直到把所有没验完的功能全部验完，再把所有代码都提交为止，才算完成任务，中途不要停下来。”

来源 `reports/all-pending-acceptance-execution-20261021.md`。本次具体授权仅 GG-01..04 修后及文件变动后的治理 AUTO。禁止产品、其他 testing、living docs、install、shared build/lib、service、GUI、private/credentials、commit。通用 SOP 的安装/构建/提交在本子任务不执行；多人 dirty 不拉取合并、不删除成果。

已读 AGENTS、collaboration §11、原治理 report/fix-contract/plan/worker/runner、开发报告和最终 13 例。旧原件只读，旧失败保留。

## 执行

- [x] 核父任务、授权、旧原证和开发交件。
- [x] 在同前缀 selftmp 冻结 current sources、patch、新文件、完整实际依赖指纹；独立复制旧 expert 冻结包及原 worker，不修改原件。
- [x] 旧 source + 原 expert worker 真实命令重现四缺陷，保存全部 exit/stdout/stderr/JSON；supervisor 原红 observed exit1。
- [x] current source 自有 tsc，32 ID/62子断言、reopen2/2；同13最终hash红绿、独立4负例追加17/17。原worker空串/undefined oracle保首败，副本改捕获完整首态。
- [x] 原治理23文件283/283与15类verify；P0原设施exit1保留、副本28/28，P3仅改自有固定日志路径。
- [x] 修后F6标准包10refs、生产路径预检/空目标恢复、生产命令演练零写/非法schema拒/confirm完整恢复，ids/expected与合法富历史完整。
- [x] 前后源码、实际依赖、输出和写根审计；逐旧32ID索引/报告/交件完整。seal实际exit0，3384原证hash一致，4411最终写操作外写0、自有运行进程空。

## 新增文件

本前缀 `run.mjs`、`extra-body.ts`、`report.md`、`id-status.json`、`gui-handoff.md`、`audit-result.json` 与 evidence/selftmp。运行器复制原 worker/guard 到自有副本；新增路径字段和所有副本适配另记 hash/diff，不覆盖原件。

## 判定

真实 FAIL 立即告知 Main，继续不受影响复验，不修产品。冻后 backup/commandbackup 漂移单列，当前结论只绑定冻结对象；必要时第二轮 fresh freeze 重测受影响范围。GUI 全部 NOT_RUN，真实模型 MAIN_NOT_RUN，不转 MANUAL_PENDING。有限 SOURCE/AUTO PASS 不等全门或发布。

最终第二轮 `run-2ACog5` 已包含两轮间 Main backup修复；source/deps/runtime102源零漂移。最终外层exit0、补充finalize/seal实际exit0；报告与逐32ID索引及交件完成。首轮漏production apply的F6设施失败与旧P0错误保留，不改产品补fixture。仅有限SOURCE/AUTO PASS，GUI32项和Main真实模型未验。

# 治理与成长即时独立发现

> 给 Main 修复与复验排程使用；只记录有限 AUTO 确证，不签 GUI 或整包。平台 trae，独立测试专家，2026-10-21。完整结论以同前缀报告及冻结 evidence 为准。

## 已确证

以下在自有生产 tsc 输出、真实 Context + JSON backend + 生产 command 中复现。第三轮完整冻结根 `/private/tmp/governance-growth-independent-auto-20261021-soAcAa`，对应同名前缀 evidence 已归档；`candidate.json`、`copy-before.json` 认领被测源码，`commands-domain.json` 留参数、返回和前后库内容。独立领域 55 PASS / 7 FAIL / 0 BLOCKED，7红归四缺陷。第二轮总编排没有最终 exit，不冒充闭环。最小修复合同见 [fix-contract](governance-growth-independent-auto-20261021-fix-contract.md)。

| 缺陷 / ID | 确证现象 | 接缝 / 最小修复方向 |
| --- | --- | --- |
| GG-01 / RA-AI05 / P1 | 10 条明确 ask-apply 全部成功，四个 create 的新记录存在，但 ledger 仅 6 个 update 来源。第三轮逐类红证：`milestones/m-0002`、`risk_issues/ri-0002`、`deliverables/dlv-0002`、`meetings/mtg-0002` 均缺refs；真实undo postimages有全部新ID。 | `commands/ask.ts` dispatch 返回新建 ID，但 `appliedActions` 仍保留无 ID 的 create action；`buildSourceRefs` 仅收有 ID 的 action。保生产白名单与只取真正 applied，不扫全库补造来源。 |
| GG-02 / RA-AI04 / P1 | 同任务 s1 改派→s2 改进度，两步成功，无人工修改时 undo 只撤 1 项；回退 s2 后被 s1 自己的过渡 postimage 判成人工冲突，最初 assignee 未恢复。 | `handleAskUndoCommand` 逆序逐项全对象比较接缝。保外部改动拒覆盖，修同目标链式撤销的内部过渡守卫，不能关闭全对象冲突校验。 |
| GG-03 / RA-AI04 / P1 | 两目标确认后人修改其中一条；mixed undo 正确保该条且还原 clean 条，但 ledger `undo.used=true`，进程句柄仍可重试，账本与真实状态不符。 | `recordUndoOutcome` 对 `kind='undone'` 无条件置 used；mixed 返回有 reverted 时仍传 undone。保审计历史与合法重试，不把混合成功当全批耗尽。 |
| GG-04 / RA-P1001 / P2 | 新项目只有未跟进 session 绑定任务，无到期任务；`queue list` 输出 top=该 absent 条目，而非 top=null/rest 中列示。 | `deriveQueue` Top1 选择未排除 absent。现行 P1 §2.2 K9 与源码注释均承诺缺席仅折叠列示、不进 top，不是新门。 |

## 设施与口径纠正

- 首轮 RA-AI03 漏 `confirm`，实际仅出删除确认提示。第二轮补真实 `task delete ... confirm` 与回读确认不存在后，missing/manual-review、两次 history 追加均 PASS；首轮不是产品 FAIL。
- 首轮 RA-P0007 固定等 20ms，反思钩子落盘异步晚于断言。第二轮有界等待真实记录，单点幂等/edit/final PASS；不改生产 hook。
- 首轮 export/archive 绝对目录违反已开启隔离模式；第二轮使用 `outbound` / `outbound-history` / `archive-minimal` 相对子目录，真实导出/静态性/覆盖/TTL/审计/archive/review PASS。
- `verify-p0-integration.mjs` 两处把 `readdirSync` 当构造器；第三轮首个纠正版只修一处仍在第二处报设施 TypeError。补充最终自有副本移除两处 `new`，全部28/28、exit0；原件及失败日志保留，不改他人测试。见 `p0-final-execution.json`/`p0-final-adapted.mjs`。
- `verify-p3a.mjs` 试写固定 `/tmp/p3a-verify.log` 被 guard 拒绝，**没有实际写到该文件**。仅自有副本改日志路径。guard 是进程级辅助，不声称全盘 OS sandbox。
- 第二轮 branch-only（`branch:'no-repo'`）实际允许。用例“branch 无 repo 按现有关系拒”与 `core/repo.ts:validateRepoRelation`、PROD-21 可选字段格式合同不符：当前只分开校格式，无 repo 必填约束。撤销该 FAIL，补合法 branch-only 与非法格式的生产校验一致性；不凭测试新增仓库依赖。
- 首轮 reopen 把 extra 表 entries 插入顺序当内容差异，且误覆盖首轮部分命令/结果文件。第二轮分 mode 输出、按 key 排序/deepEqual，真实新进程内容与 session 回读 PASS；首轮只能引用留存 stdout/冻结代码，不补造丢失参数文件。

## 剩余边界

GUI 全 32 ID 未在本专家执行，不等 PASS；Main 仍为唯一 GUI/builder/service 操作端。真实 key/网络模型未读取未调用，Main-only 不自动写为本人 MANUAL_PENDING。P2-6 r8 F13 深故障、分歧并发和新冲突明细页仍非前置；上述真实已承诺守卫失败只按精确 ID 重开。

补充收尾：Main在本轮后改动 `core/tasks.ts`、`core/task-materials.ts`、`core/file-asset-store.ts`，均在实际102文件运行依赖链；相关 task add/update/material集成结果不得直接继承给新源码。冻结候选绿/红不被覆盖，纯函数未受影响结论只按自身依赖保留；详见 `dependency-scope-final.json` 与终态报告。

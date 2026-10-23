# 当前完成率基线有限独立审计 R1

2026-10-23，trae，独立范围/完成率基线审者，非开发、GUI 或产品测试执行端。

## 1. 裁决与权限

**BASELINE_NOT_FINAL；不签父完成，不准入 ordinary commit。** 精确整体百分比仍为 null，不是 0%。本件确认非零完成下界，不猜 90%，不把末版总报告“新增整 PASS=0”当历史累计清零。

父原句：“父全已实现未验到全部ordinarycommit授权/新要求每步耗时和每整功能验完给整体%。”本限单只新增 `docs/testing/acceptance-percent-baseline-20261023-r1*` 和自有 `/tmp/acceptance-percent-baseline-20261023-r1-reader.mjs`；其余只读。限单替代通用 fetch/build/livingdocs/Git。未读取记忆、运行产品/tests/Main reader、联网、操作 browser/ports/runtime/profile/正式资产或 Git；不读其他 tmp。只读明列开发 source125/complete526 封件元数据及两项明确源指纹。

## 2. 分母与去重

权威链：[register §1–7](remaining-acceptance-register-20261021.md) → [delta-ledger](remaining-acceptance-delta-20261022-ledger.md) → [末版 R3 §2/6](final-remaining-acceptance-reconcile-20261023-r3-report.md) / `table-r3.json`，遵循原 `reports/acceptance-progress-20261023-r1.json`。

| 项目 | 审计结果 |
| --- | --- |
| 原索引 | 1489 唯一 ID；252 原合同 + 1184 matrix + 53 补充标签 |
| 原验收分母 | 1436；matrix 1152 基础 + tasks stale/noresult 32，全部保留 |
| 整 ID N/A | 仅 OP-DEFER-05/06，共 2；原多人实时合并/独立 war-room 后置 |
| 当前适用验收 | 1434；没有删除 owner 普通字段、页面格或原待验动作 |
| 最终普通提交 | 必需 +1，未完成；整体计数分母 1435 |
| 完整完成下界 | 5 个原验收 ID + 提交 0；下界 5/1435 = 0.35%，**不是精确整体完成率** |
| 精确完成数 / 百分比 | null / null，等待其余原 ID 的有效整断言映射 |
| confirmed 必要本人 | 0；不造 MANUAL_PENDING 或 PASS |

DR30/MENU14/MENU26 只对 **popup 子断言** N/A，[LG03 §1/3/5](a8-layer-gap-contract-review-20261021.md)、[B8 §4.1](b8-existing-evidence-mapping-20261022-r1.md)明确普通 owner 填/清、保存/重进及键盘仍验，故不再减 3 个 ID。

去重按原 ID，不按截图/文件/断言行数。一个 ID 多个报告或多处合同引用只计一次；不同原 ID 共用真实动作不因共用证据再次增计，也不擅自合并其原合同。53 项按原索引 `originalContracts=[]` 精确列在机器报告；其中含 U4、16 卡、读屏等登记项，**只排除重复计量，不撤销父门**。这些补充项到原 ID 的完整对应尚未全证实，须原范围 owner 最小确认；不自行删门或扩分母。

## 3. 完整 PASS 下界与候选继承

仅以下五项全原断言可继承完成：[OP 原独立 §1/3/4](objective-independent-auto-20261021.md)、[独立继承 §3.1/3.2](op-growth-final-inheritance-20261022-r1.md)，原 disposition/domain 行已直接比对。旧报告的“仅 AUTO”不扩大 GUI；这五项的原合同本身全部为纯派生/源码断言，无 GUI 余断言。

| 原 ID | 完整原断言 |
| --- | --- |
| OP-EX-01 | 100/1000/10000 深树全量 Map、确定性、计数与后序源码 |
| OP-EX-02 | 纯函数环降级不挂死、合法 leaf 保留 |
| OP-EX-03 | 缺 ID/悬空父降级、合法节点不吞 |
| OP-EX-05 | 两待验 leaf + 环，pending 不造数 |
| OP-RU-06 | F2 中间层只计 leaf、不重复累计 |

两文件直接实核：`progress-derivation.ts` 17727B / `c0d6177b96ce702d0c5bea17d8bbea47bc4b16ad3b1f58acc886e6d6d0032c1b`；`status.ts` 1150B / `6e3c4ba783b561293376646ba4a561851787a98ab455c43be2c40064479d9f32`。原独立输入 → Combined complete525 → L8 complete526 → 当前明列源码均同；派生模块运行时仅导入 status，两者不依赖甘特呈现，不受本次 L8 变更影响。五项逐一原报告路径、§、时段、候选和原因在机器报告 `complete`；本件不发明新 oracle、不重新执行旧实验。

当前候选仅按明列 `main-source125.json/main-complete526.json` 认领元数据，baseline `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`。与 CombinedF02RepairR2 比：source 123 同/1 变/1 增，complete 524 同/1 变/1 增，无删除。唯一变为 gantt.tsx，新文件 gantt-status.test.tsx；完整 SHA/大小见机器报告。125/526 未有独立 SOURCE 总签，未核当前产物/实例/开关，**旧 1707/41/7/95 全绿不能签新候选**；本件只签上述纯函数五 ID 继承，不签 L8、新组合回归或 GUI。

## 4. 最少待核与停止

1. L8 后继：按原 [T01–T04](l8-gantt-refresh-defect-20261023-r3-test-plan.md) 的独立 SOURCE/AUTO、唯一新组合及受影响 GUI 补签；不重开已终结诊断或无关纯算法。
2. 原 AUTO 25 项中扣本件 5 项，余 20 项及“余动作已闭”的原 ID：只交各原断言的最终候选继承理由或有效补签。OP-EX-04 含真实跨项目 move，不能沿仅纯算法相同签整项；OP-Q-04/OP-RU-04 的 R3 精确断言索引为空，先对原已签行，不造新测试。完整候选列表在机器报告。
3. 原 matrix/层/卡：沿现有已签时段/对象/开关匹配。14 格只是部分映射；其他索引未匹配 **不等原图不存在、不要求重采全部**。只核真正缺少的原动作/继承，不加待表决新矩阵。53 补充登记项的对应关系一并作有限文档确认。
4. 全适用门独立齐后，由 Main 按父授权执行最终 ordinary commit；本审者不操作 Git。本次没有整功能总门完成事件，不冒触发“整功能完成百分比”。

以上是最少补链，不是新总范围循环。精确分子未核完的 1429 项为“本审计未确证完成”，不等于新增失败、已确认均未通过或必须新采 1429 次。父范围/既有 FAIL/BLOCKED/NOT_RUN/旧 PASS 原件均保留；必要本人仍为 0。

## 5. 计时、效率与封签

环境 macOS/bash、nvm Node v22.23.3，仅内置 fs/path/crypto/assert/perf_hooks。未调用 pnpm 11.28.5（仅项目环境约定）。

自有 reader 的各次实际开始/结束/耗时/输入 SHA 追加在本前缀 `-timing.jsonl`。启动前 shell 步骤只有实际工具墙钟收据，起末时刻无法准确重建，单列机器 `timingLimits`，不回填为主动计时；首个明确 UTC 锚点 01:56:03 不代表任务真正开始。初次 reader 语法失败 exit1、工具 wall 0.1274 秒保留；修括号后启动成功，不当产品失败。

效率复盘：rg 不可用后初次 find 未限制深度，进入冻结依赖清单，已停止两个自有查找会话；一次合读大附表和一次摘要输出过宽。未读取工具私有输出文件，改为 maxdepth1 与结构化短字段。未复制 12MB 总表，机器结果只保去重 ID、引用、五项证明和精确差异。后续复用本基线的计数及证据索引，在同候选内按原功能域连续补链；不把 reader 毫秒耗时当全部审证工时，也不宣称提速倍数。

实际命令为 `/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/acceptance-percent-baseline-20261023-r1-reader.mjs <mode>`，mode 为 inspect/summarize/detail/proof/text/generate/check/seal/readback/receipt-check。前期成功读取与失败如上；最终模式的真实 exit、wall、PID、输出回读以本前缀 `-seal.json`、`-seal-tool-receipt.json`、`-readback.json`、`-readback-tool-receipt.json`、`-release.json` 为准，不提前填预计成功。封签不循环自哈希，timing 在每次模式结束追加，单列其可变性质。

真实 seal/readback/toolreceipt 完成后，仅本子单 **STOP/released**；无产品/构建/GUI/进程/端口/业务锁，不清临时或他人成果，不继续新范围、不准入 commit。

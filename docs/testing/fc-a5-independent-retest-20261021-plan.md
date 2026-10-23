# A5 独立复验计划与最小裁定

> 给 Main、负责人及后继专家使用：限定 A5 AUTO 的对象、原件继承和复验步骤；不签 Finder、真实认证或 GUI 总门。

2026-10-21，平台 trae，独立测试专家。本轮依负责人派单、父持续分工授权、AGENTS §6A、collaboration §9/11 与 A4 报告执行。使用 writing-plans 的分步方式记录测试计划；本轮不是产品开发，不创建 worktree、不提交，计划路径按本轮明确授权收缩到 testing 前缀。

## 授权与对象

- 只写 `docs/testing/fc-a5-independent-retest-20261021*` 与本专家新建 tmp。
- 不改产品、他人 testing、living docs；不 pull/build/install、启动产品服务、改 profile、读 runtime/private/凭据、操作 Main GUI、commit/push。
- 只读 A5 candidate/patch/作者原证、A4 报告/合同及已有专家原测试；复制完整 launcher 和 23 源，链接既有依赖。TMPDIR/TMP/TEMP 都指向自有 tmp。
- Chrome 使用全新 headless user-data-dir，生产 loopback 仅自有 `listen(0)` fixture。生产 browser-open 只注入 EventEmitter spawn，不执行 macOS open/dsh，不模拟真实认证成功。
- 读取指纹不代表 OS 写保护。仅声明实际 WATCH 范围，不声明全盘零污染。

## P04 最小裁定

A4 报告 §2 已明确：同一当前旅程合法回告先到 S4，迟到 OS 失败必须保留 S4；无本轮回告的失败仍 S6/false、撤 nonce。A4-P04 的 `outcome.endsWith('failure')` 把 `early-failure` 也判为 S6，是旧探针与新合同不一致，不是 A5 必须恢复的行为。

1. 保存 A4 原件 hash，逐字节复制并复跑，保留其 exit1，不改原件。
2. 仅在自有纠正副本中，在原 `endsWith('failure')` 分支之前加入 `early-failure` → `S4/Chrome/true` 与 nonce single-use false 断言。
3. 普通 failure、cancel-error、replace-error、P10 及其他断言完全不变。保存原/副本 hash 与统一 diff。
4. 不放宽任何产品合同，不要求错误旧期望全绿，不把作者外层 exit1 改写为 exit0。

## 执行清单

1. 已核：A5 candidate23、patch/current diff、主树/隔离树/专家副本一致；A4→A5 恰为声明三文件；各已结束轮次453产物与A0指纹一致。
2. 已跑：自有副本 package 九原文件56/56、control DOM7/7、专家原8/8，全部exit0。
3. 已跑：A2 additional 原9/9、followup 实际原10/10、最终A3原13/13，全部exit0，保真实35秒等待与原期望。
4. 已跑：A4 原26中25过/唯一P04旧期望失败，exit1保留；三行最小纠正副本26/26 exit0，原件/hash与统一diff保留。
5. 已跑：三路 currentS4→OS success/nonzero/error/default 真实5秒 timeout，12组生产DOM/app/core/loopback/open保S4/true。
6. 已跑：无回告9组S6/false撤nonce、仅verify3组、cancel6组、替换6组、生产controller已ready3组、core failure1组；专项40/40 exit0。
7. 已收尾：所有轮次源/453产物/原测试件指纹不变，7个日志明确Chrome PID不存在、自有root/runner无残留；保护WATCH另有14项其他分工路径变化，原差异保留。作者红绿边界已审，有限AUTO PASS，不签N1/N2或GUI总门。

## 命令

环境 macOS + Node v22.23.3；不执行 pnpm/install/build。在仓库根运行，runner 拒覆盖旧结果：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/fc-a5-independent-retest-20261021-run.mjs setup
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/fc-a5-independent-retest-20261021-run.mjs initial
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/fc-a5-independent-retest-20261021-run.mjs a2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/fc-a5-independent-retest-20261021-run.mjs a3
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/fc-a5-independent-retest-20261021-run.mjs a4-original
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/fc-a5-independent-retest-20261021-run.mjs a4-corrected
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/fc-a5-independent-retest-20261021-run.mjs probes
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/fc-a5-independent-retest-20261021-run.mjs final
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/fc-a5-independent-retest-20261021-evidence-check.mjs
```

Main A4 被动观察 N1 correctOrigin200/S4 与 N2 reopen仍S3属于另一真实 GUI/client 桥诊断；本轮不操作、不审签，不用本轮 AUTO 覆盖该缺口。

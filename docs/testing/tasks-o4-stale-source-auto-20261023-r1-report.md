# O4/stale SOURCE/AUTO 独立窄审 R1

2026-10-23，trae，固定任务域独立专家；非产品开发/GUI执行。沿[本轮计划](tasks-o4-stale-source-auto-20261023-r1-plan.md)、Main [repair](../plans/2026-10-23-task-o4-stale-repair.md)/[handoff](../plans/2026-10-23-task-o4-stale-developer-handoff.md)、首读报告及O4/stale先行合同。限单替代fetch/install/build/livingdocs/git；仓库只写本前缀，自有tmp为 `/private/tmp/tasks-o4-stale-source-auto-20261023-r1-3pcNKs`。

## 有限结论

**PASS_LIMITED_SOURCE_AUTO：仅本最小源修复和下表自动范围。** 未发现范围内新增源缺陷；不签整任务页/O4/stale视觉/错误恢复/父ordinarycommit。原O4 `FAIL_LIMITED_GUI`、stale `FAIL_LIMITED_VISUAL` 和旧error `BLOCKED_RECOVERY_UX` 保留，待Main新包真实原证，不以jsdom代替。

开发封根 `/private/tmp/task-o4-stale-developer-20261023-MqM0UL`：8819对象独立实核0差异（8499字节文件、320软链目标记录），readback8819/0；handoff/seal/readback真实outer均0、released=STOP。seal SHA `2476c090eb1527f7045fd51ec46d3d9d69c38657f478ac5f517b6da6b15d50e7`。不是重复开发自PASS。

| 固定对象 | SHA256 |
| --- | --- |
| 修panel | `afe188bda04c8d27df5c74037c4a4a9872eb0f0f132b06c6df370b10bc45c0b6` |
| 最终同oracle transport | `e1bc7607fdbaeecb7de6f36708b99b2f416937d5c22105850a7346648723b14f` |
| 最终同oracle confirm | `99bf57340577783747c56e33452634c5f953c66ba451c70ffa60bae859a92d40` |

基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`；内部声明126→127、527→528只差panel/transport和新confirm，112交叠包路径SHA同。开发最终七轮416输入/src411，原/修源码只panel不同、两oracle同字节；本轮四隔离复测同样src411/只panel差异。未重扫people活源，不把127/528认作当前全候选/整build/运行身份。

源差异逐字核：原stale块移入`.pm-main`首子块，保原条件/文案/status/refresh/数据；DrawerPanel仅注释+所属document确认DOM查询两行，确认显示时不重入dirty守卫。忽略空行后与合成最小差异完全同。confirm-dialog/CSS/index/首读测试不变；无需确认模块改动。transport保原23项，新增合法schema fixture位置/数据/原因/重试测试；raw禁用桩与8处act void仅修类型。

## 自动证据

| 对象 | 原封件实审 | 本专家独立复测 |
| --- | --- | --- |
| confirm最终 | red-r3 exit1，2红/9绿；green-r3 exit0，11绿 | exit1＝2红/9绿 → exit0＝11绿；两实际capture回调序列相反、33观察与开发绿逐字同 |
| transport最终 | exit1＝1红/23绿 → exit0＝24绿 | 同oracle exit1＝1红/23绿 → exit0＝24绿，保旧任务/原因及重试；不清旧error |
| 首读 / 邻接 / 窄type | affected-dom-r3 9绿/0；affected-renderer-r3 38绿/0；type-r3 exit0 | 仅审已封inputs、JSON、stdout/stderr、child/outer，不重跑，不签卸载设施/全类型 |

**Strict邻接不被11绿洗掉。** 初原版第三红为Strict Enter卸载后焦点body，修后及本轮两Strict序列仍body；最终非Strict两序列才断言退出归opener。Strict确认Escape保draft/归trigger/Enter退出通过，最终归焦是 `NOT_PASS_OBSERVATION`。按[范围补片](tasks-o4-stale-source-auto-20261023-r1-scope-contract.md)，不新增人为Strict GUI门，不宣称全焦点已修；Main必须核原实际退出归焦，若真实流程body按原O4合同失败。

## 命令与计时

macOS arm64/bash，绝对Node22.23.3；React/react-dom/renderer18.3.1、jsdom25.0.1、Vitest2.1.9，TypeScript5.9.3仅原证。pnpm11.28.5未调用。每轮src/config/HOME/TMPDIR/cache/output自有，依赖仅只读现有声明软链/package.json，非依赖全树验证。

实际外层命令如下，`<阶段>`依表；child argv/cwd/PID/版本/环境、完整stdout/stderr、JSON及SHA均在[审计](tasks-o4-stale-source-auto-20261023-r1-audit.json)和自有各轮内。

```sh
# macOS，仓库cwd，不执行pnpm/install/build
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /private/tmp/tasks-o4-stale-source-auto-20261023-r1-3pcNKs/run.mjs <阶段>
```

| 阶段 | 开始→结束（2026-10-23 UTC） | 秒 / 实终码 |
| --- | --- | --- |
| inspect | 02:54:08.535→02:54:12.435 | 3.900 / 0 |
| vendor | 02:54:08.527→02:54:08.638 | 0.112 / 0，13文件SHA+静态校验 |
| red-confirm / green-confirm | 02:54:30.575→02:54:40.895 / 02:54:30.573→02:54:41.002 | 10.320 / 1；10.429 / 0 |
| red-transport / green-transport | 02:54:56.006→02:55:03.092 / 02:54:56.014→02:55:03.085 | 7.085 / 1；7.070 / 0 |
| audit | 02:55:11.047→02:55:11.442 | 0.396 / 0 |

四复测child是绝对Node执行自有`node_modules/vitest/vitest.mjs run src/client/panel-confirm-escape.test.tsx --config vitest.owned.config.mjs`，transport两轮换为`src/client/panel-transport-error-feedback.test.tsx`，各自cwd、fork/worker1。原窄type子命令为`node node_modules/typescript/bin/tsc -p tsconfig.narrow.json --noEmit --incremental false`。仅上述阶段outer总和39.312秒、去重区间并集21.818秒、首计时至audit62.915秒；不加child/outer、不含早期手编与文档耗时，不报告整功能百分比。

初transport对象toBe打印失控、122.869秒exit1/Worker exited unexpectedly、开发记录精确TERM59005全保；原ps/lsof工具原输出不在封件，未冒独立复查身份。初O4 3红/8绿、type-r2真实exit2/8处旧act类型错、两次oracle重冻/回跑均保原receipt/SHA，不用最终绿覆盖。原panel邻接对照14绿/0同有requestAnimationFrame缺失/React detached/MaxListeners stderr；本轮key/cache警告亦全保，不称无错误。读证rg缺失/两个错误路径/长progress输出和会话轮询限制见audit，不当产品缺陷。

code-review锁定vendor已校验，仅采用Standards/Spec方法，各无新增范围内源发现；父限单覆盖git/setup/宽scan/安装/额外归档，无可用子代理工具、不冒双审。这是审阅辅助，不代独立门。效率后继：固定oracle/type后最多两轮并行，比较标量避免失控输出；本轮不重build/已封邻接/已签GUI，早期摘要仍过大，后继只取结构化必要段。

## 封交与停止

正文冻结后实际执行seal/readback，结果仅见本前缀`seal.json`/`readback.json`/`toolreceipt.md`/`released.json`，不提前伪造。Main全源独立门齐后合L8及其已认领people修复，唯一一次整build/完整回归，再交原O4退出与stale四viewport、错误恢复新GUI封件审签。父适用门齐才ordinarycommit；本专家不git/整build/GUI/正式操作，封回后STOP。

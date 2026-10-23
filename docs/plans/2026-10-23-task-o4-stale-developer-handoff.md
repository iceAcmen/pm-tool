# 任务确认 Escape 与陈旧通知开发交接

2026-10-23，trae，仅开发角色。两红最小源修复与开发自测已执行，**不签独立 PASS，不关闭原 GUI 红项**。正文冻结后才运行 handoff/seal/readback，实际释放事实必须回读自有 `released.json`、`outer-readback.status.json`，不在正文预造收据。

## 合同与最小变化

负责人原句/唯一写面/停止条件见[自有计划](2026-10-23-task-o4-stale-developer-plan.md)。首读原 released=STOP、outer-readback=0 已实读；继承 [Main合同](2026-10-23-task-o4-stale-repair.md)、[首读独立报告](../testing/tasks-firstload-source-auto-20261023-r1-report.md)、[O4先行合同](../testing/tasks-failure-gui-timed-20261023-r3-o4-escape-plan.md)和[stale先行合同](../testing/tasks-failure-gui-timed-20261023-r3-stale-layout-plan.md)。父既有未验/确证修复至ordinarycommit范围持续，不扩新功能/push/release/正式切；Main唯一整builder/GUI/desktop。

唯一产品变化：

- `packages/dsh-pm-tool/src/client/panel.tsx`：原 `{hasSnapshot && stale && !busy && (...)}` 块逐字从NavRail前移到 `.pm-main` 首子块；原文/role/status/重试/refresh/旧数据均保。DrawerPanel原requestClose入口新增注释和所属document显示查询：`if (asideRef.current?.ownerDocument.querySelector('.pm-confirm-dialog')) return`，确认显示时不重入dirty守卫。
- `packages/dsh-pm-tool/src/client/panel-transport-error-feedback.test.tsx`：原23项保留，新增1项真实renderer测试归main而非shell列、失败保原项目任务/原因、重试在途保数据、成功去stale但不清旧error；补既有必填executeRaw禁用桩，8处act定时回调改void块，仅满足类型，不改时间/断言。
- 新增 `packages/dsh-pm-tool/src/client/panel-confirm-escape.test.tsx`：真实PmPanel/createRoot/DOM，只替环境和transport；11项覆盖Strict双首读/两capture顺序确认Escape保说明归焦、再确认Enter放弃、clean X/scrim/cancel/Escape直关、dirty scrim/cancel/Escape确认取消与再Enter。

**无需额外 `confirm-dialog.tsx` 写权，已及时明确回Main。** 显示查询不依赖ConfirmHost模块current在settle后的瞬时值：同一同步window keydown分发内，确认DOM仍在，直到React提交；两实际listener序列都证实门控有效。原版在本DOM环境原注册序列控制绿，反转序列红；这只证明此实验的两序列行为，**不签旧真实GUI注册顺序/根因**。未新建isActive导出，不改CSS/确认模块/domain/schema/命令/时间/来源，不清旧error卡，不碰people后继或3270。

| 对象 | SHA256 |
| --- | --- |
| 首读原panel/本批最终所有红轮 | `b83eba55bb0f40e69599af04d95adb9c6f3133ceab645fef3d6f92734ab14cf4` |
| 修后panel/最终所有绿与type/工作树 | `afe188bda04c8d27df5c74037c4a4a9872eb0f0f132b06c6df370b10bc45c0b6` |
| 最终同oracle transport | `e1bc7607fdbaeecb7de6f36708b99b2f416937d5c22105850a7346648723b14f` |
| 最终同oracle confirm Escape | `99bf57340577783747c56e33452634c5f953c66ba451c70ffa60bae859a92d40` |
| 首读测试，仅读/未改 | `ec0bcc59fb57b925968ba533c2075ef21f39f7c120a252b8935027b280777277` |

声明基线继承 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`、首读已封 `main-source126.json` / `main-complete527.json`。baseline逐条一致；audit实0，最终七轮全部src仅panel红绿差异，两个oracle完全同字节，源码/配置/依赖声明指纹前后不变。`summary.json`另验证两个capture trace实际顺序相反、Strict确实两个snapshot、panel除原块移位与两行门控外逐字一致（只归并空行比较）。

交Main `main-source127.json` / `main-complete528.json`：**126→127、527→528**，原panel/transport改字节，新确认测试1项。非自有声明delta空只对这些输入及指定合同成立；不是宽扫完整候选、运行身份或整build，未监测未知新增/依赖全树/runtime/data/lib/正式树。Main后来people等变化须另重新合并认领，不拿本清单声称其候选已冻结。

## 实证与环境

自有证据根 `/tmp/task-o4-stale-developer-20261023-MqM0UL`，真实根 `/private/tmp/task-o4-stale-developer-20261023-MqM0UL`。每轮独立src/config/HOME/tmp/cache/output，416输入/src411；DOM轮只读链接 `.tmp/widget-poc/node_modules` 的React/react-dom/jsdom，原renderer轮React别名用包自身，避免两React。Node绝对入口 `v22.23.3`、macOS arm64；React/react-dom/react-test-renderer18.3.1、jsdom25.0.1、Vitest2.1.9、TypeScript5.9.3、Zod4.6.5。未调用pnpm、install、整build。

每轮保存完整stdout/stderr、JSON报告、child status与outer真实起止/单调耗时、cwd/argv/Node/依赖realpath与版本/SHA、输入与隔离配置；O4原DOM/草稿/焦点/调用/capture callback SHA trace，首读原29观察也留存。project/task fixture由生产write schema解析，无数据文件写入。

所有表内轮次的真实外层调用为：

```sh
# macOS，已有Node22，仓库cwd；不调用pnpm/build/install
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node \
  /tmp/task-o4-stale-developer-20261023-MqM0UL/run.mjs <轮次>
```

红/绿子命令在各自隔离cwd：绝对Node + `node_modules/vitest/vitest.mjs run src/client/panel-confirm-escape.test.tsx --config vitest.owned.config.mjs`；transport轮仅换成 `src/client/panel-transport-error-feedback.test.tsx`。affected-dom轮为首读测试；affected-renderer轮为transport、panel-launch-handshake、panel-checklist-toggle、shared/form-dirty，原panel对照只跑后三者。每轮fork/worker1，cache全自有。

窄type-r3子命令：

```sh
# cwd=/private/tmp/task-o4-stale-developer-20261023-MqM0UL/type-r3
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node \
  node_modules/typescript/bin/tsc -p tsconfig.narrow.json --noEmit --incremental false
```

include仅两本批测试、首读测试和已有d.ts，沿真实panel导入链，原strict/NodeNext/react-jsx不改；有outDir配置但noEmit，无整lib写。vendor轮绝对Node调用仓库 `scripts/verify-external-skills.mjs`，自有cwd/HOME/tmp/cache，实0；mattpocock13文件另逐SHA/bytes核同。

## 真实计时

全表为2026-10-23 UTC，outer起止/秒/真实终码；child独立收据在各轮内，不能与outer重复相加。

| 轮次 | 开始Z | 结束Z | 秒 | 终码/实结果 |
| --- | --- | --- | --- | --- |
| baseline | 02:33:39.063 | 02:33:39.399 | 0.336 | 0，126/527同 |
| vendor | 02:33:39.065 | 02:33:39.192 | 0.127 | 0，静态+指纹 |
| red-o4 | 02:36:06.609 | 02:36:17.271 | 10.663 | 1，2目标红+1 Strict退出归焦缺口，8绿 |
| red-transport | 02:36:06.576 | 02:38:09.442 | 122.869 | 1，设施中止，Worker exited unexpectedly |
| red-o4-final | 02:39:30.475 | 02:39:36.172 | 5.698 | 1，2红/9绿 |
| red-transport-final | 02:39:30.470 | 02:39:35.435 | 4.965 | 1，1红/23绿 |
| green-o4 | 02:40:14.085 | 02:40:21.230 | 7.145 | 0，11/11 |
| green-transport | 02:40:14.078 | 02:40:20.489 | 6.412 | 0，24/24 |
| affected-dom | 02:40:33.141 | 02:40:40.603 | 7.462 | 0，首读9/9 |
| affected-renderer | 02:40:33.133 | 02:40:42.629 | 9.496 | 0，38/38，有原设施stderr |
| type | 02:40:33.130 | 02:40:46.161 | 13.032 | 0，仅新确认/首读 |
| red-o4-r2 | 02:42:06.812 | 02:42:25.075 | 18.263 | 1，2红/9绿 |
| red-transport-r2 | 02:42:06.791 | 02:42:21.736 | 14.946 | 1，1红/23绿，已补必填raw |
| affected-renderer-original | 02:42:07.443 | 02:42:24.470 | 17.028 | 0，14/14，同样有原卸载设施stderr |
| type-r2 | 02:42:06.803 | 02:42:33.760 | 26.957 | 2，纳入transport后8处旧act返回类型错 |
| red-o4-r3 | 02:43:48.866 | 02:44:02.268 | 13.403 | 1，最终2红/9绿 |
| red-transport-r3 | 02:43:48.865 | 02:44:00.671 | 11.807 | 1，最终1红/23绿 |
| type-r3 | 02:43:49.997 | 02:44:09.174 | 19.178 | 0，最终两测试+首读/真实导入链 |
| green-o4-r3 | 02:44:20.566 | 02:44:30.653 | 10.088 | 0，最终同oracle11/11 |
| green-transport-r3 | 02:44:20.785 | 02:44:29.765 | 8.980 | 0，最终同oracle24/24 |
| affected-dom-r3 | 02:44:37.542 | 02:44:43.651 | 6.110 | 0，最终首读9/9 |
| affected-renderer-r3 | 02:44:37.529 | 02:44:45.280 | 7.751 | 0，最终38/38，原设施stderr保 |
| audit | 02:45:01.352 | 02:45:02.782 | 1.430 | 0，同oracle/src/127/528/声明delta |

人工编辑/恢复也有真实wall区间，非CPU：tests 02:33:55.075–02:36:06.564＝131.489秒；恢复及oracle调整02:38:04.412–02:39:30.639＝86.227秒；panel编辑02:39:45.008–02:40:14.420＝29.412秒；本交接从documentation-start真实开始，结束后写documentation-end.interval.json。首次阅读/mktemp/runner手编只有工具wall time，没有完整起止，不补造。summary自身真实计时见summary.status.json；最终封交收据在下节命令实际执行后落盘。

截至audit：baseline→audit墙钟683.719秒，执行命令outer求和344.143秒，实际区间并集去重215.633秒，不把并行双计或与人工wall重复相加。明确返工含transport设施122.869秒、扩大类型后26.957秒及重新冻结回跑；不是产品开发纯耗时。本批不报告整功能完成/整体百分比，不以局部绿抬父进度。

## 原失败、缺口与效率

初transport `expect(banner.parent).toBe(main)`打印renderer对象失控；核自有Vitest PID58982、worker PID59005和cwd后，只TERM59005。原终码1、Worker exited unexpectedly、未完测试JSON警告及stdout/stderr原件全保；该轮不作产品红/PASS。改为同义父class标量与shell children布尔断言，最终原panel真实红只为pm-shell≠pm-main。未杀服务、未按共有字符串杀进程。

初O4有**StrictMode Enter放弃后焦点body而非opener的额外观察**，原版/修后都留DOM焦点原件，未加产品修复。最终明确仅非Strict断言卸载归opener，Strict仍断言确认Escape归原触发控件/保草稿/Enter退出，Strict最终焦点只记原观察，不判通过。这是单独待Main/专家定范围的邻接缺口，不能因最终11绿把初3红或该缺口洗掉；原真实GUI的listener顺序仍未证。

原清单邻接stderr有 `ReferenceError: requestAnimationFrame is not defined`、React detached commit警告及MaxListeners；原panel同14项对照也复现。只报告用例断言数和真实0，不称卸载设施/焦点验收通过，不改其源/测试或吞日志。已有TaskTable key警告与cache.dir deprecated同样保留。type-r2的8处原回调返回对象是真type2，仅在自有可写transport文件改void块，补必填raw不放宽oracle，最终七轮重新认领同字节。旧错误卡恢复仍BLOCKED独立，布局/GUI未由jsdom替代。

改进：起步应先把**两修改测试一起**纳入type、所有act回调预核void、断言比较标量；避免两次oracle重冻与重跑。无界对象打印的原证保留且补120秒子进程上限，不放宽断言换绿。重复隔离转译并发4轮比2轮慢，本次原真实耗时不支持倍数提速；后继先定完整oracle和类型再红绿，最多两轮并行。Main仍一次合并整build，未为局部审重复整回归。

vendor策略已完整实核后按诊断→tdd→交付code-review阶段分离；只读自查Standards/Spec，确认最小diff、既有API、无新抽象/额外源写、已定合同。缺少独立子代理工具，不冒双审；不执行vendor git/setup/安装/全局/HITL步骤，不让vendor覆盖父合同或独立门。起步误宽只读git status/目录/进程输出和rg/错误路径/记忆不可达保工具记录；后继限定声明，不声称从未运行git读取或全机零污染。没有git写/stage/commit/fetch/push、runtime文件/服务/产品数据/正式/GUI/desktop操作。

## Main 接续与停止

1. 回读自有 `handoff.json`、`seal.json`、`readback.json`、`released.json`及outer终码，核三产品/两文档SHA；封件是源与开发证，不是已build/装载/独立PASS。
2. 固定专家先审本最小source/auto原证；Main按原O4确认Escape/受影响退出、stale四viewport既定合同交新GUI封件。原未受影响段由专家决定继承；本单不签O4整项/stale视觉/旧error恢复。
3. Main合并已批准L8、首读、本修复及其已认领people后继，重新认领全部声明输入，唯一一次整build/完整回归/原GUI/专家审签。此处只127/528，不抢整lib、不动3270，父全适用门齐后Main才ordinarycommit；无push/release/正式切。
4. 本单最后命令严格顺序执行，真实终码与起止落同名outer收据。readback验全部封件和本单源文档、声明非自有delta后写released=STOP；成功后不再编辑、续功能或抢Main资源。

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/task-o4-stale-developer-20261023-MqM0UL/run.mjs documentation-end
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/task-o4-stale-developer-20261023-MqM0UL/run.mjs handoff
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/task-o4-stale-developer-20261023-MqM0UL/run.mjs seal
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/task-o4-stale-developer-20261023-MqM0UL/run.mjs readback
```

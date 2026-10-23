# F02 修后完整候选组合回归独立审证 R2

2026-10-23，trae，独立组合回归原证审查专家，非开发、非 GUI、非产品测试重执行端。

## 1. 有限裁决

**SOURCE：PASS_LIMITED_COMBINED_SOURCE。AUTO：PASS_LIMITED_COMBINED_REGRESSION_EVIDENCE。**

唯一对象为 `CombinedF02RepairR2/index-r2.json` 对应冻结候选。独立 reader **10组全部实核通过，errors=[]，真实外层exit0**；补充来源链/产物绑定及受阻观察结构核验有效，审证窗口终核实际exit0。不是直接采用 Main 的绿色 summary。

**新host / GUI / 样式 / UX / 父全部门 / 普通commit：NOT_SIGNED_THIS_ROLE。** 原 F02 `FAIL_LIMITED_GUI`、后台保存 `NOT_REACHED` 保留；修后真实浏览器尚无本件证据。新freeze未装载；当前3268仍旧六修是派单事实，本角色不探活或读取其runtime。没有以AUTO或DOM冒充GUI，不新增B8门，不重派F01/P3004两保存。

## 2. 授权与方法

负责人原句核心范围：

> 你是独立组合回归审证专家，非开发/GUI。父goal全部已实现未验持续到普通commit，不新增暂停功能/push/release/正式切；Main唯一builder/GUI。
>
> 仅审本完整候选冻结/tsc/bundle/noemit/full162files1707/DOM6files41/special2files7/全95verify/guard/close0+1816 seal。
>
> 不要重跑已经有效全绿产品测试或Mainexecutor。可以用自有/tmp纯fs/path/crypto/assert reader读取本repo封件、主包当前525声明输入，以及此新freeze声明的src/scripts/locale/rootpackageconfigs/lib/三依赖和旧六修lib作必要read-only物理核。
>
> 唯一仓库新写docs/testing/f02-combined-regression-review-20261023-r2*，其他只读；自有/tmp reader与输出。明确子单替通用fetch/pull/build/livingdocs/Git收尾。

后续原句：

> Main已接续，未重复派单；1816封件与新freeze保持原字节，等你原有限组合审结论，之后再启新host。请完成后写原唯一docs/testing/f02-combined-regression-review-20261023-r2*并通知；不要新增产品/GUI执行。

已读 [AGENTS](../../AGENTS.md)、[collaboration §9/§11](../collaboration.md)、[计划](../plans/2026-10-23-f02-combined-regression.md)、[execute](../plans/2026-10-23-f02-combined-execute.mjs)、[seal](../plans/2026-10-23-f02-combined-seal.mjs)、[原六修独立报告](combined-six-repairs-regression-review-20261023-r1-report.md)、R2/R3来源报告及原F02合同。未加载vendor。自有reader只使用内置fs/path/crypto/assert；没有import/eval产品、配置、adapter、原脚本，没有spawn。

仓库只新增本前缀文件；其他生成输出均在自有 `/tmp/f02-combined-regression-review-20261023-r2/`。仅读声明人工工件；索引fixture软链只lstat/readlink，不follow。未接触服务、profile、业务data/backups、凭据或其他角色private对象；唯一工具元数据读取为本角色这次reader的精确实际执行收据，不扫描工具runtime。

## 3. 精确候选与1816封件

| 对象 | 独立实核 |
| --- | --- |
| 证据根 | `reports/all-pending-evidence-20261021/CombinedF02RepairR2/` |
| freeze | `/private/tmp/pmtool-combined-f02-repair-20261023-r2` |
| baseline | `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`；引用Main freeze内实际HEAD检查，不由本角色执行Git，不用HEAD代dirty候选 |
| source / 完整输入 | **124 / 525**；Main和freeze物理逐bytes/SHA、实际完整集合一致 |
| 父六修到当前 | **525→525，仅2修改、523不变、无新增/删除**；source仍124 |
| dirty归属 | changed73、新文件51及parent/source并集全等；逐hunk反向恢复本轮baseline，再正向原六修diff，73项父字节SHA与原source一致；新文件清单原字节不变 |
| version /装载 | `0.7.4`，`runtimeLoaded=false`；不是发布或宿主身份 |
| index | **377747 B / `b7d00adf033966ba94b69eab250b9781d89de532c32e243ff40793159c28f275`** |
| 成员 | **1816 = 1772普通文件 + 44fixture软链**；逐SHA/size/readlink、无重复/越界，物理集合完全相同；加index/seal为1818件 |
| Main seal | 2280 B / `c4d80c483b9924631bb299559d83c18f3f897bb5febcbb4b8582f6c038367913`；index/分母/来源报告绑定一致 |

| 两项delta | 修前 bytes / SHA256 | 修后 bytes / SHA256 |
| --- | --- | --- |
| `src/client/views/records/records-listbox.tsx` | 4886 / `db16c2e6dcb9c574855b9f0bc82f2d976b7f1756a8d0abcab275c4bbc07683f2` | **5059 / `aeb3d15125ad311f335cfb09d348c0402b9925da9d4979df8b2ceb402725275f`** |
| `src/client/views/records/records-deliverable-pointer-dom.test.tsx` | 9159 / `6de116ba10c320a162f1c465958f428ca9023e328b67827581db9ea23df42aec` | **10641 / `841e3fa0591c7a83213572650a73d7c63cf277e50e1ecf56197e8c0e58cc6057`** |

来源、逐成员、diff恢复、各原始收据及95逐exit详见 [最终审计](f02-combined-regression-review-20261023-r2-audit-final.json)。数量不是功能数或GUI覆盖数。

## 4. 来源报告与精确继承

本轮8份来源报告全部实核bytes/SHA；原六份指纹与原六修封件完全一致。

- [R2 SOURCE/DOM9](f02-option-default-source-auto-20261023-r2-report.md)：8882 B / `19d6ede7cee232c7ee992a867f3193ac952e44f2a6b0d653a1815854716f3d32`。
- [R3 related28](f02-related28-infrastructure-retest-20261023-r3-report.md)：8669 B / `2a227ba16cdd7c1a016b2504401b7e3550d710e0023449967bdbf35c1c6c6877`。
- 原R2执行：379823 B / `1c9cba8b2d3c04c187efa06356aefd89f383dbb9c968f47622a115eb0ac59d57`；**37断言绿、4文件suite EEXIST、success=false、真实exit1**实核保留。
- R3校正收据真实child0、四文件28、stderr空；只继承有效related28，不伪造新的37合并执行。

未变模块的窄门精确继承原六修报告已经裁定的边界：P1004 handoff、P1005 reflect-entry、P2007 archive-projection、P2002 outbound-slot、P2004 KR-related的本轮产品字节均未变，其旧范围不扩大。P1005 listbox已变化，**原4886字节SOURCE不能直接签当前5059**，由R2/R3绑定及本轮组合原证替接其受影响SOURCE/AUTO。原P1004早期panel、reflect早期index不冒当前组合版本；原P2004设施outer1历史同样不洗白。

原F01/P3004已签的两保存按父原有限结论保持，不要求重派；本件不重新审签其GUI。其余未决GUI、父历史/rest/FL/MAX/L8/native/VoiceOver/B8与总出口仍按既有原合同和状态，不追加新门。

## 5. 设施、依赖与产物保护

原executor SHA `b976982c5e1463e67246092698dda2da5653e58b13cc57734e13d4937547a249`；新executor SHA `8df5ea7a3625b519efd3a174e29e4028b6d4ffb09074ff47f7457e77e2d19063`。独立按**九个唯一字串替换**重建全文，等实际新executor；仅out/freeze/old、父source/complete与归属名、R2/R3报告、两delta校验。未执行Main包装器。

scheduler/full/DOM/special配置逐字仅旧→新路径重定位；checklist/C02原设施字节不变。三专项SHA与父全等，未改oracle。full和DOM仍分别使用声明配置，JSDOM/lucide内联及TaskForm虚拟export不冒宿主业务。

| 物理保护 | 实核 |
| --- | --- |
| Main输入 / Main lib | 525 / 463，前置manifest与当前全等 |
| 旧六修lib / 新lib | 455 / 455，旧lib与原built-artifacts全等，新lib与当轮built-artifacts全等 |
| launcher | 冻结26份与保护manifest全等，Main对应26份逐字全等 |
| 新包依赖 | 13579普通文件 + 1030内部软链 |
| 新DOM依赖 | 1595普通文件 + 2内部软链 |
| 新upstream依赖 | 14394普通文件 + 1031内部软链 |

三依赖全量当前bytes/SHA及成员等保护before和父已签副本manifest；逐link解析保持内部相对归属，拒绝外链而不follow；新三组副本相互共享inode0。复制时Main收据shared/external/changed均[]。

**旧三依赖实体不在本次物理读取范围，因此其旧→新inode不共享继承Main复制时收据及原六修独立核验，不伪称本角色现场复核旧inode。** 未读旧freeze源码/依赖或未声明私有资源。新upstream25及入口归属沿已签未变设施与本轮封存manifest继承，不把本件变成新宿主测试。

新lib相对父仅`client.js`、`client.js.map`、`client/views/records/records-listbox.js`三变。实际client **1720393 B / `3be9d4a0bbc595bb0038e50787d33d38d47120237f7ab93fba40d1dc624f8159`**；source map内listbox emitted文本与当轮4699 B JS逐字相同，局部preventDefault存在。绑定的是构建产物，**不是当前3268下发字节**。

## 6. Main已发生命令与结果

环境：macOS arm64，既有nvm Node **22.23.3**、Vitest **2.1.9**、TypeScript **5.9.3**、React/ReactDOM **18.3.1**、JSDOM **25.0.1**；pnpm11.28.5为原环境口径，本角色未运行pnpm/install。原UTC `2026-10-22T23:*`对应北京时间2026-10-23，不改写原时间。

下面全部是**封存Main原执行，不是本角色重跑**。绝对node为 `/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node`；`<pkg>`为本候选包，Vitest `<out>`为本封件根。实际argv/cwd/白名单env/时间/PID/stdout/stderr完整在最终审计`commands`。

| 动作 / 原完整参数 | outer PID/exit | child PID/exit及实核结果 |
| --- | --- | --- |
| executor `freeze` | 18789/0 | dirty候选及输入冻结；无另列测试child |
| `node <pkg>/node_modules/typescript/bin/tsc -p tsconfig.json` | 18877/0 | 18878/0 |
| CSS复制后`node <pkg>/node_modules/tsdown/dist/run.mjs --config tsdown.config.ts` | 18907/0 | 18908/0 |
| `node <pkg>/node_modules/typescript/bin/tsc -p tsconfig.json --noEmit --incremental false` | 18925/0 | 18926/0 |
| Vitest `run --config <out>/vitest-full.config.mjs --no-cache --coverage --reporter=default --reporter=json --outputFile=<out>/full.result.json` | 18948/0 | 18949/0；**162文件/1707 passed** |
| Vitest `run --config <out>/vitest-dom.config.mjs --no-cache --reporter=default --reporter=json --outputFile=<out>/dom.result.json` | 19561/0 | 19562/0；**6文件/41 passed** |
| Vitest `run --config <out>/vitest-special.config.mjs --no-cache --reporter=default --reporter=json --outputFile=<out>/special.result.json` | 19588/0 | 19589/0；**2文件/7 passed** |
| `node scripts/verify-isolation.mjs`，无追加参数 | 19609/0 | 19610/0；**95/95逐脚本exit0** |
| `node scripts/test-isolation-guard.mjs` | 19897/0 | 19898/0；守卫正负fixtures |
| executor `close` | 20001/0 | 实际stdout `CLOSE exit=0`、收尾保护 |
| Main seal脚本 | 未单列 | 实际工具0来自明确派单；独立核1816/index/seal，不补造外层PID/raw |

全部outer/child signal=null；实际收据证明**全序列不重叠**。full `23:34:35.831Z`结束，special `23:34:59.787Z`开始。本轮没有原六修首special过早并行问题。

结果逐文件/逐断言passed，无fail/pending/todo；JSON的describe suite数566/13/3不是文件数。full+DOM并集恰525输入中168个产品test，无重叠/遗漏；产品实例**1748**，special7另列。原full1707、原DOM39及原special同7全部用例fullName保留；DOM只追加D08/D09。原四模块coverage阈值不变，真实89.40/83.15/85.89/89.40满足原门，不称全包coverage；noEmit不包含产品tsconfig排除的test。

## 7. Fixture来源、原始观察及污染边界

原full `report-export-excerpts.test.ts`的真实domain/command fixture先读rawReportPath，再写`{fixed,raw,initialRevisions}`。8份本轮frozen-before内raw为version2，解析后record**逐结构等fixed**；snapshotAt均在full实际执行时间窗内，manual/session均具备。special沿同`R1_RAW_TMP`读取这些材料，未改schema.parse、stress或probe oracle，本reader不执行schema/renderer。

9份专项输出实核：作者150000反引号段、长度300024经真实schema接受、返回301085 B且caught=null；4份旧renderer比较逐字相等；0/3/17/1800四种围栏完整保六字段literal。原六修首special真实exit1/七失败及stderr3928 B继续存在，不改写为从来全绿。

本轮pointer D01..D09原事件封存；D08/D09各一次document bubble option-path click，defaultPrevented=true、isTrusted=false、calls=[]。handoff原28记录、12个DOM观察目录与8份OKR React18观察保留；OKR的run/onCreate/onEdit/onSaved/fetch全部空。只证明组件/自动边界，不证明trusted pointer、bbox/焦点布局、真实RPC、raw保存或重进。

本轮stderr **full12973 B、DOM857 B、verify7617 B**保留：TaskTable key、MaxListenersExceededWarning及负向输入/导出/写入控制日志；special/guard stderr空不代表全部无警告。

verify逐95原stdout退出行与实际当前scripts默认集合完全相同；仅沿原排除guard自身及verify-real-model，没有新增skip。guard验证增/改/删、缺根出现/消失语义。WATCH五根都在**新freeze且MISSING**，before=5/after=5是五标记，不是正式五文件；“污染0”只限此守卫范围，不证明未访问的正式业务/全机/real-model/B8。

## 8. 自有命令、设施原件与终封

自有reader实际外层执行ID `eafea4a32c1b1a2a713eb4c88cb0d724`、PID21127、exit0、status=exited、outputComplete=true；仅精确读取本角色execution.json核终码，未以summary预计码代真实末码。

```sh
cd /Users/bytedance/Projects/dsh-pm/pm-tool
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/f02-combined-regression-review-20261023-r2-reader.mjs audit
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/f02-combined-regression-review-20261023-r2-trace.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/f02-combined-regression-review-20261023-r2-trace-reconcile.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/f02-combined-regression-review-20261023-r2-reader.mjs stability
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/f02-combined-regression-review-20261023-r2-seal.mjs
```

audit **0**；trace **1**，原件保留：来源链/产物/目录已核，末尾误把OKR calls对象当数组。新增reconcile只核原对象四个空回调数组及fetch，实际 **0**；不改旧helper，不重复已绿组。stability实际 **0**：封件/index、Main/freeze输入、Main/旧/新lib、launcher、三组新依赖前后全等。seal末码见 [实际工具收据](f02-combined-regression-review-20261023-r2-seal-tool-receipt.json)。

准备阶段memory路径ls **1**、误读不存在guard helper的cat **1**、补充inline helper EISDIR **1**全部记录，非产品FAIL；login=false不受工具支持，未起shell、无末码。EISDIR后只补目录层级；所有已完成其他只读命令0。详见 [命令审计](f02-combined-regression-review-20261023-r2-command-audit.md) 与 [命令收据](f02-combined-regression-review-20261023-r2-command-receipts.json)。

[seal](f02-combined-regression-review-20261023-r2-seal.json)绑定报告、最终/原失败审计、实际命令、reader/trace原件、候选index/seal。seal自身及随后tool-receipt不循环自指纹。**产品测试/构建/install/noEmit/verify/GUI/网络/服务/Git执行均0次。**

## 9. 精确Remaining与停止

本子单组合SOURCE/AUTO原证已有效审结，**没有待重跑产品测试或待补组合设施项**。

Main继续原 [F02合同§6](six-repairs-pointer-gui-review-20261023-r1-report.md#6-原默认-label-场景最小红--修--复验合同)：新候选host/实际浏览器字节/开关及合法fixture绑定；默认label真实指针选择稳定闭合；闭合后唯一首点主save完整RPC/request-response/raw/页面关闭及正常重进；同字节一次原键盘对照。若需要planned初态，正常表单保存准备并单列fixture，不把旧未保存稿当DB、不手seed、不补第二点洗红。

其他六修只沿父已有未决GUI/样式/UX原合同汇合，具体继承未变字节的原有限证据；**不追加B8，不重派F01/P3004两保存，不重做旧L2创建/重复/final**。父全部适用门齐后ordinarycommit的裁决归Main及各独立原门，本件不签父完成、不commit/push/release/正式切。

**released / STOP，通知Main。** 自有同步命令已退出；未持有builder、GUI、端口、profile、数据锁或服务。保留所有证据不删除；不要求暂停已授权父goal。

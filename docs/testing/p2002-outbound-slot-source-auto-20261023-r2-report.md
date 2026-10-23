# P2002 出站位独立 SOURCE/AUTO R2 报告

> 2026-10-23，trae，独立 SOURCE/AUTO 专家。**RA-P2002-OUTBOUND-SLOT 的本次三源接线及限定自动断言：有限 PASS。GUI 未执行、整组合未裁决、父 ordinarycommit 准入未裁决。原 GUI FAIL 保留；无 push/release/正式切换。released，STOP。**

## 1. 授权与边界

负责人原句：“父goal持续授权全部已实现未验独立收口至ordinarycommit，无push/release/正式切；你独立SOURCE/AUTO专家，不开发/GUI。”

本子单按 [原 R1 §5.1](p2-outbound-history-review-20261023-r1.md#51-最小-source-与复验合同) 及 [本次窄测计划](p2002-outbound-slot-source-auto-20261023-r2-plan.md) 先审开发 result/handoff/seal/runner/test/delta，再必要独立补测。不是新功能，不追加门，不重做已验历史恢复、31/29 天 TTL、三档导出、K16 或其他已有限通过项。

唯一写本 `r2*` 新文件与自有 `/tmp/p2002-source-auto-r2-Vxx6jU`。原 R1 supplement、testing、开发封件均只读；没有产品修改、整包 build/install、GUI/服务/Git 操作、Main plans/livingdocs 修改，未访问 privatefreeze/runtime/正式 profile。保留原 dirty；三源写锁已由开发 released，本角色没有重新认领产品写权。

依据 AGENTS §6A、collaboration §9/11。通用拉取、构建、全回归、更新 livingdocs、提交动作受本子单明确边界约束，不在此执行。父授权持续不等于本专家可操作 Git 或冒签父门。

## 2. 对象与开发封件独立审查

候选 baseline `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` 仅引用原封件；不核 HEAD、不把该 SHA 或 package version 当 dirty 候选。绑定当前实际源：

| 文件 | bytes | SHA256 |
| --- | --- | --- |
| `src/index.ts` | 21961 | `43d9c3f0ef754143f2082357695b708be048b8bcaf6975205dd9b9ce58e3f299` |
| `src/client/panel.tsx` | 191954 | `341675c4dd31b87d05264de520a4c198edbb3c3476f2f87d8f38cc80ba1d83d6` |
| `src/client/views/tasks.tsx` | 77665 | `5639b455c452d69686355e8b4e65daa1d91b82ef9965a5f085074d044a7771e6` |

前缀均为 `packages/dsh-pm-tool/`。开发 ownDelta 恰为这三源，与当前字节一致；delta.patch 是接手 dirty→修后差异，不是 HEAD 全候选 diff。

| 独立核验 | 结果及限定 |
| --- | --- |
| 开发 seal 的 artifact 清单 | 76/76 SHA/bytes 一致；不重新执行其 runner，不读其 tmp |
| 同版最终 RED | 原三源绑定及 test 指纹一致，8/8 连接断言红，真实 exit1；不是早期 schema/jsdom/依赖装配首败 |
| 同版最终 GREEN | 修后三源及 test 绑定一致，8/8，exit0；8 份内嵌观察原字节 SHA/bytes 一致 |
| 邻接 | 原六文件 54/54，exit0；没有重跑或改这些 tests |
| 最终三轮开发保护 | receipt 中 signal/error 无异常，非 owned/依赖/隔离源码 delta 均0 |
| 开发 GREEN 读链 | 8 个 JSON fixture、13 次真实 snapshot；任务/audit/sent/archive 等前后全 DB 字节一致，0 put/delete |
| selfcheck | 与实际三源、同版 test、保护及 DB 观察一致；开发自查不是独立 PASS 的替代 |

[初审 development-audit](p2002-outbound-slot-source-auto-20261023-r2-development-audit.json) 保留首次整树比较未满足；[范围复审 development-audit-r2](p2002-outbound-slot-source-auto-20261023-r2-development-audit-r2.json) 有25项核验，其中23项 SOURCE/AUTO 满足，2项“当前全树=旧开发输入”明确不满足，**不把它们改写成全同或产品 FAIL**。

当前比开发运行源另有 `src/client/views/okrs.tsx` 变化及新增 `okrs-related.test.tsx`。六邻接 tests 不导入 panel/OKR；其余源输入与开发最终运行一致。当前 OKR 是独立视图呈现，不在本任务视图路径；本补测复制当前完整 src 并实际 import panel、只呈现任务视图，不签 OKR 或整组合。此差异不能用来声称旧8项/54项是当前整树重新执行。

开发 seal 原九项 nonOwnedDelta（四 livingdocs、五 testing）完整留在独立 audit，不回退或归为开发写入；本次从 capture 至终审监测输入无新增漂移。旧原1690包的历史核件声明仅引用，不重复扫描原案、也不继承为当前宿主证明。

## 3. SOURCE 读链

1. [index.ts:230–242](../../packages/dsh-pm-tool/src/index.ts#L230-L242)：沿既有 `readExportAudit(domain)`，为真实项目逐一建 null map，`Date.parse` 比较绝对时间取最大；无项目/不可解析 at 跳过，投影仅 `{at,format}`。不触发 sent TTL、归档或写队列，不暴露 targetPath/完整 audit。
2. [export.ts:167–195](../../packages/dsh-pm-tool/src/core/export.ts#L167-L195)：既有 reader 过滤类型/format/targetPath/finite itemCount，坏数组或缺行回空；日期合法性在 snapshot 判断。不修改 reader 或生产写语义。
3. [panel.tsx:1374](../../packages/dsh-pm-tool/src/client/panel.tsx#L1374)：`data.latestExports?.[project.id] ?? null` 按当前真实项目传入，不借别项目，不在浏览器引入含 fs 的 core/export。
4. [tasks.tsx:268–283](../../packages/dsh-pm-tool/src/client/views/tasks.tsx#L268-L283)：共用静态 slot；真实 ISO 同时进 `time.datetime/title`，HH:MM 沿 [既有 hhmm](../../packages/dsh-pm-tool/src/client/views/tasks.tsx#L75-L79) 提取字面时刻，**不是自动换算用户本地时区**。
5. [实际路径](../../packages/dsh-pm-tool/src/client/views/tasks.tsx#L1559-L1565)：树顶层 groupRow、子层 leafRow、状态分组 leafRow 共用该 slot；任务标题格独占换行，编辑动作仍在独立操作格。DOM 与 CSS 源可证明结构意图，不能证明真实浏览器布局。

用户提及 exportSent 映射，实际字段为 `latestExports`，来源为长期 `pmExportAudit`，不是活跃 `pmExportSent` 或 archive。这符合原 §5.1 真 audit 合同，不静默改需求；T05 专门让 sent/archive 比 audit 晚，验证它们不污染投影及 B 的 null。

## 4. 必要独立窄测

环境 macOS/darwin，既有 nvm Node `v22.23.3`，Vitest `2.1.9`；真实 Cordis、DomainFacility、JsonStorageBackend，React18/react-dom/jsdom。pnpm 未调用。源码副本、配置、缓存、HOME/TMPDIR/文件根全在本次 tmp，现有依赖只读链接；收据绑定复制源、config、Node、依赖根文件/链接及原测试指纹。

fixture 通过真实 project/task schema 写入隔离 JSON backend；恶意/坏 settings 是既有 reader 防御输入，不冒历史真实发送。真实 `apply` 注册 command，真实 `web snapshot` 输出进入真实 PmPanel/TaskTable；仅捕获宿主注册接口，不启服务、不替业务函数。jsdom 的 matchMedia/CSS.escape/scrollIntoView 等沿已声明设施，不作为 GUI 能力。

| ID | 独立结果 | 有效观察 |
| --- | --- | --- |
| T01 | PASS | +08:00 更旧记录不抢最大值，C 独立 at/format，B 坏记录拒绝；map 项目全集、仅 at/format，路径不泄露 |
| T02 | 首轮测试假设错误；单项纠正复测 PASS | 五行父/子/孙层、折叠/展开集合及编号保持；每实际行一 slot，操作格仅编辑、slot 在标题格，清单/blocked 源值保留 |
| T03 | PASS | C 显示独立 `04:05`/ISO，不借 A `08:09`；refresh 同源；选 B 后卸挂保持持久选择与“未导出” |
| T04 | PASS | 状态分组五真实行包含孙层 blocked 与 wrapped，五 slot；分组头没有冒充 slot |
| T05 | Asia/Shanghai 与 UTC 各 PASS | `03:10:11-05:00` 的真实时刻晚于 A 旧 `08:09:10Z`，即使字面较小/数组末为旧值也取它；MAX_VALUE finite count 可读，Infinity/date越界拒绝；sent/archive 不作源；完整 ISO/title 与字面 `03:10` 两 TZ 一致 |

三轮实际执行：首轮4绿/1测试假设错误，T02纠正后1绿，UTC T05 1绿。**5个唯一用例最终满足，T05执行两 TZ；不称13/13，也不把跳过的 S01–S08 算绿。** 三轮总计12次真实 snapshot、7份观察（含首轮失败），DB每份11或13文件、0业务put/delete、各命令前后零写、卸载关闭后同字节，包含 audit/sent/archive updatedAt。

T02首轮错断言 inline `row.style.gridTemplateColumns`；当前实际值在 `--pt-grid-columns`，CSS:212 消费该变量，真实 DOM 列值以72px结尾。专家仅在自有 tmp 副本把这**唯一一行**改为读取 custom property；原 R1 supplement未改，首轮原日志/输入/观察全保。[audit.testCorrection](p2002-outbound-slot-source-auto-20261023-r2-audit.json) 绑定首错原文及逐字节单变更证明。未为此改产品，也未把 test error 伪装成产品红。

原 React key warning 在开发 RED/GREEN 与本三轮均存在，stderr 保留；不越界修它、不追加本出站位新门或声称警告全清。

## 5. 实际命令与错误

以下在仓库根运行，直接用已存在 Node，不装环境。内层 Vitest 完整 argv/cwd/env/UTC始末/exit/signal/error 与 stdout/stderr 见各 `*-receipt.json`/日志；工具运行日期为本地10月23日，收据保留真实 UTC10月22日时刻，未改系统时钟。

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/p2002-outbound-slot-source-auto-20261023-r2-runner.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/p2002-outbound-slot-source-auto-20261023-r2-runner.mjs capture
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/p2002-outbound-slot-source-auto-20261023-r2-runner.mjs review-r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/p2002-outbound-slot-source-auto-20261023-r2-runner.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/p2002-outbound-slot-source-auto-20261023-r2-runner.mjs narrow
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/p2002-outbound-slot-source-auto-20261023-r2-runner.mjs t02-corrected
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/p2002-outbound-slot-source-auto-20261023-r2-runner.mjs utc
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/p2002-outbound-slot-source-auto-20261023-r2-runner.mjs audit
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/p2002-outbound-slot-source-auto-20261023-r2-runner.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/p2002-outbound-slot-source-auto-20261023-r2-runner.mjs selfcheck
```

三次语法检查exit0；capture外层异步终止码未回传，state/初审audit已回读，不捏造exit；初审两项全树比较未满足如实保留。review-r2 exit0；narrow exit1（T02测试假设错误），t02-corrected/utc/audit/selfcheck exit0。窄重测二轮并行但各有独立 inputs/output，无共享写根。

[selfcheck](p2002-outbound-slot-source-auto-20261023-r2-selfcheck.json) 复核三轮三源与当前字节全同、内嵌 JSON 原字节 SHA/size 全同、保护输入 delta0、尾空白0。只查询本次 capture 精确 argv 的 pgrep exit1 表示已无匹配，不是杀进程、产品失败或 capture 外层退出码。

辅助只读命令：`rg`不可用exit127，指定 memory 文件不存在exit1；无需安装或扩大搜索。`grep`/`sed`/Node结构化阅读均保原输出；不把 command-execution 的输出暂存当获准仓库产物。未运行旧开发失败轮、产品 verify、完整构建或原案采证。

## 6. 原门继承与 Main 尚欠

SOURCE/AUTO 有限 PASS 只绑定上述三源及观测范围。原 RA-P2002 的 GUI FAIL **没有被本轮改签**。原历史恢复/TTL/恶意 web/P2007 量化有限结果按原审签范围保留；core/export/backup/review/archive未变，不无理由全重测；K16及其他门原结论不由本专家重裁。

Main 尚欠原 §5.1 链，不增加新矩阵：

| 原合同待办 | 必须补的证据 |
| --- | --- |
| 新组合对象 | 同一新 baseline/diff/新增指纹及并行变化→真实构建产物→新宿主/PID/开关绑定；旧host未装本修复不能代签 |
| 真源与项目隔离 | 新host真实 snapshot 的 A 最新 audit 映射→A行可见“已导出/最近时刻/外部唯一”，B无audit显示未导出且不借A时间 |
| 真实有效行 | 当前顶层/子层/状态分组实际任务行可见，折叠展开不改变归属；分组头不能代任务行；沿原 U4 受影响流程 |
| 真实重进 | 切项目/refresh/浏览器真实 reload 或重进后同项目同源同标识；本 jsdom 卸挂不是浏览器reload |
| 编辑与显示 | 长标题/完整出站文本不遮挡编辑，实际浏览器中打开/取消原编辑可达；本 CSS/DOM 声明不替目视/布局/UX |
| 零写与回归 | 真 GUI 读取/切项目/重进前后业务/tasks/audit/sent/archive/files根证据；Main原整build/fullregression及受影响入口回归 |

C/时区/MAX 的本补充 AUTO 反例不变成额外强制 GUI 新门；不要求重做原31/29合法恢复或三档成功/覆盖。可执行 GUI 缺口仍待Main，不冒 MANUAL_PENDING，不签整P2/整组合/发布或父提交。

## 7. 封存与停止

[audit](p2002-outbound-slot-source-auto-20261023-r2-audit.json) satisfied=true 是本有限断言满足，不是父 PASS。[seal](p2002-outbound-slot-source-auto-20261023-r2-seal.json) 索引本前缀产物、protected inputs 与自有 tmp 文件；封存前后保护结果及终止码见最终回传/收据。覆盖只是本次明确监测的源码、原案/开发输入与依赖根，不是全机或未访问的正式/private根零写证明。

最终封存命令（执行结果以实际工具回传为准，不以文件存在补造外层收据）：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/p2002-outbound-slot-source-auto-20261023-r2-runner.mjs seal
```

测试子进程均 spawnSync 收到实际终止码，无残留测试 child；不持有产品、builder、GUI、服务、端口或 profile 资源。仅保留可复核 tmp，不删除原成果。新 SOURCE/AUTO 结果交 Main 统一候选认领；不自行 commit、不推送、不发布、不正式切换。**released，STOP。**

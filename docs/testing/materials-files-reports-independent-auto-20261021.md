# 资料、真文件、固定汇报独立 AUTO 结论

> 2026-10-21，trae，独立测试专家。只判本人真实执行的AUTO；**整体未PASS**。父授权见 `reports/all-pending-acceptance-execution-20261021.md`。本角色仅写本前缀/testing evidence/自有tmp，没有改产品、其它testing/livingdocs、共享lib、install、整包build、service、GUI、上游、正式data/profile、commit/push。

## 结论先行

- 五项原文件P1经末轮新源独立复验，具体断言转绿：root/祖先symlink、create filealias与双alias同hash（md/txt只一份final）、prepare/validation/部分DB故障补偿、update one-envelope文件、真实组件unmount迟到201/abort/remount/commit-success不删。只签冻结AUTO，不签GUI和整包。
- **两个真实恢复接缝仍FAIL**：MFR-B-01 / RA-J06，JSON-only `restore-content confirm`不能恢复标准含文件F5；MFR-B-02 / RA-F07，JSON-only预检对可识别越界relPath仍success。失败确认库/字节零写；生产路径恢复/事务回滚通过，不可替代该UI消费路径。
- 首红“旧rv2 selectedRefs必须成功 / active重复restore必须成功”已按Main核定旧B6/B2纠正为 **ORACLE_CONFLICT**，非产品FAIL。旧输出不覆盖，产品守卫未为此修改；详见 [纠正回执](materials-files-reports-independent-auto-20261021-oracle-correction.md)，已交原计划owner。
- 原余合同GUI全部NOT_RUN；RA-J04完整旅程未独立执行，仅材料/报告子断言支持，不凑一个整体AUTO PASS。

## 候选与指纹

末轮原证：[fiKpOr](materials-files-reports-independent-auto-20261021-evidence/materials-files-reports-independent-auto-20261021-fiKpOr/)。基线`2a7603023bc54ef13d788e50069ee3fde4671bf3`、HEAD`9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`加candidate里的tracked.patch/newFiles。先取全src hash，复制副本逐文件相等才执行，TS仅自有输出；主树/隔离A0差异与A0 lib清单保留但A0未使用。前后无src漂移；审计时相关依赖仍一致，不代表未来变更可继承。

| src相对路径 | 末轮SHA256 |
| --- | --- |
| core/tasks.ts | `c3e0d8a379b5dbbe41331ba42df265711c90a12dbcb8a47955ee70c4d4723fe3` |
| core/task.ts | `ad71b6d1b26e386e297c8f3c6a555252772c5247ab94b3ceec89c787eb21646b` |
| core/task-materials.ts | `6188f2bf92910c39ca9933dbdc91af00c597564838a712bd9f3c342ca63289f2` |
| core/file-assets.ts | `56e98ea6a8943468e69f7bc1a5e89ae6223b0f6d9ff010dee9c1a1a1b8853fc4` |
| core/file-asset-store.ts | `b961bf1f20cb92cc887e36b7a80bbd1b58606840e91e6ae7742c5fa8ab833ac1` |
| core/backup.ts | `eb27edca81944b7af844af8923b7d379052d540f1630b7ed9ec41e86eb41be47` |
| commands/backup.ts | `52707c029b85c5887e5d9c2d7bb9a079e64f2c3aed42c987e26ed462344db736` |
| core/progress-reports.ts | `279b6ca7a41b4ccabe88a59340a631751a53d864726c47eafd81e1b759813d0b` |
| client/shared/task-draft-materials.tsx | `66af8221d089a2ad65fa4d831be218c4a78d3299c23239cfaf750497c4edc2ae` |

全src/声明/只读依赖/自有测试与产物hash在candidate/own-lib/evidence-sha256；[逐ID及当前源指纹](materials-files-reports-independent-auto-20261021-id-map.json)保每断言、命令exit、前后值、原错误和按依赖的失效项。不用HEAD/version/作者总数代表被测source。

## 有意义覆盖审核

先读原B2/B3/B6冻结结论，保历史不倒填当前。task-materials/schema、task-ops和b2-ops确实覆盖稳定ID、append、aliases/互斥；旧task-ops用了fakeDomain，故只作纯引擎支持，本专家主断言另用真实JSON domain。file-backup纯字节测试确实检查hash/缺包/bundle/jsonSha与增量回滚，不能替代全表事务。progress-report/schema/Markdown与stage-client覆盖枚举/协议/载荷，不能替代真实宿主认证/GUI。

旧asset-route/backup部分测试有替身domain，本专家不靠它们签集成；旧staging并发只要求fulfilled≤2，可全失败而绿，旧abort探针也曾在安装监听前emit，无有效中断保证。本轮补生产upload监听就绪后的aborted、真实JSON全事务、生产组件迟到201。StrictMode仅renderer包装，**没执行浏览器严格双effect**，不给该分支GUI或真实DOM PASS。

## 精确 ID

表中PASS只对所列AUTO断言。所有标GUI的原门都NOT_RUN；M05/F03/F08为原AUTO-only。`id-map.json`逐子断言映射而非用verify计数填表。

| ID | AUTO范围 / 结果 | GUI与剩余边界 |
| --- | --- | --- |
| RA-M01 | PASS，basic+link备注+E1 append rv4单层命令，E2/E3/stable ID保全 | NOT_RUN主表单一次提交/重开 |
| RA-M02 | PASS，非法basic/author/URL整批DB/data/files零写 | NOT_RUN前端保输入/合法修正 |
| RA-M03 | PASS，softDelete保全四版/候选排除/首次restore；active重复和unknown error零写 | NOT_RUN可见列表；不新增成功幂等 |
| RA-M04 | PASS，源v2不改冻结、remove不删源/history | NOT_RUN人工“更新最新”指定动作，不能拿remove/readd替代 |
| RA-M05 | PASS，非空raw拒、空首次raw允许、apply增量保史 | AUTO-only，无整体GUI扩大 |
| RA-M06 | PASS，两link别名正确at-ID、坏alias整包拒 | NOT_RUN新建草稿未提前写 |
| RA-M07 | PASS，旧新双读、archive/review/check只读、export真实审计、basic保键 | NOT_RUN实际浏览；最小archive非全量history包 |
| RA-F01 | PASS，stage/cancel/dedup/finalize、单/双filealias md/txt、update文件 | NOT_RUN原生选文件/刷新 |
| RA-F02 | PASS，真实req监听后abort零写、组件late201清stage/重挂不串、retry、commit后不删 | NOT_RUN真实GUI/严格双effect |
| RA-F03 | PASS，白名单、0/10MiB+1/边界、magic/协议/UTF8、root及祖先、无配置failclosed | AUTO-only；二进制只magic非完整解码；旧340c反例另标旧函数 |
| RA-F04 | PASS，真route/DB/字节sha与安全头、401/403、未绑定/越项目、中文空格名 | NOT_RUN宿主真认证/下载文件，gate adapter非认证验收 |
| RA-F05 | PASS，shared断联源保留、GC dry/apply仅元数据未保护孤儿 | NOT_RUN实际断联；无GC UI不新增 |
| RA-F06 | PASS，标准路径恢复core7+extra6、共享/multi-rev/soft-delete/字节，新PID41859→41870 | NOT_RUNUI；JSON-only入口FAIL另见J06 |
| RA-F07 | 路径损坏/缺字节/relPath及中途table/byte故障回滚PASS；content预检FAIL | NOT_RUNUI错误/保原库 |
| RA-F08 | PASS，旧7表保extra、domain basic保新键；v0.7.3 schema拒新数据且零文件变 | 原发布binary/实际pilot OFF未验；历史tag core重编译不是发布bundle |
| RA-R01 | PASS，rv2 stale拒零写、rv3+E3真命令保存、合法历史rv2 excerpts对照 | NOT_RUN当前版勾选，按Oracle纠正 |
| RA-R02 | PASS，refs/excerpts互斥、unknown/B/softdeleted、伪作者/日期/正文拒零写 | NOT_RUN错误后重试 |
| RA-R03 | PASS，rv3 refs与rv2 excerpts两已存报告源rv4/作者/软删后固定；旧calcVersion缺键不回填 | NOT_RUN详情/preview/export旅程 |
| RA-R04 | PASS，manual/session枚举、非空trim/manual-null，update来源只读 | NOT_RUN任务会议实际来源展示 |
| RA-R05 | PASS，真实安全AST、固定MD字节与覆盖守卫，项目web/plain出口安全 | NOT_RUNGUI；web/plain不是固定report出口，原单需owner核口径 |
| RA-J03 | PASS，prepare第二stage/末尾validation/真实asset put后task失败回滚及原子保存子段 | NOT_RUN完整取消/保留/放弃/一次主save |
| RA-J04 | NOT_RUN整旅程，M01/M03/R01..05子段独立支持 | NOT_RUN整旅程，不抄子项PASS |
| RA-J06 | FAIL，合法F5 JSON-onlyconfirm拒字节恢复且零写 | NOT_RUN两步危险确认/重进；路径恢复绿不能替代 |

## 运行与证据

macOS，nvm Node`v22.23.3`，现有pnpm11.28.5依赖只读；唯一node_modules来自`/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules`。真实Cordis Storage/JsonStorageBackend/DomainFacility生产pmDomainSpec；真实命令handler（不含宿主dispatch）和route，只有传输/gate或一次故障缝受控，不自造domain。

| 末轮命令（自有package cwd；均由run加guard preload） | exit / 实际 |
| --- | --- |
| `node node_modules/typescript/bin/tsc -p <自有历史v0.7.3>/tsconfig.qa.json` | 0，历史tag core输出，当前只读deps，非原发布bundle |
| `node node_modules/typescript/bin/tsc -p tsconfig.qa.json` | 0，完整生产src自有输出，无整包build |
| `node worker.mjs domain` | 1，69 PASS/2 FAIL；失败仅两恢复接缝 |
| `node worker.mjs reopen` | 0，1 PASS，新PID逐表/字节一致；与上项共70 PASS/2 FAIL |
| `node scripts/verify-b2-materials.mjs` | 0，只作经审核支持 |
| `node scripts/verify-b3-bytes.mjs` | 0，只作经审核支持 |
| `node scripts/verify-b6-report.mjs` | 0，只作经审核支持 |
| `node node_modules/vitest/vitest.mjs run --config vitest.qa.config.mjs <14个审核文件>` | 0，14files/126tests；完整argv在commands.json，不扩成逐ID全过 |
| `node node_modules/vitest/vitest.mjs run --config vitest.qa.config.mjs --reporter=default --reporter=json --outputFile=<own>/component-results.json component.test.tsx` | 0，7/7真实组件断言 |
| 同上 `root.test.ts` / root-results.json | 0，自有5/5（当前3、旧反例2）；Vitest路径模糊同时重跑作者file-root5，原日志10/10，不重复计独立5 |
| 根目录 `node docs/testing/materials-files-reports-independent-auto-20261021-audit.mjs <fiKpOr证据根>` | 0，23ID/源指纹及原证索引，不是产品测试 |

全部命令实际绝对argv/cwd/time/exit/stdout/stderr hash在commands.json。子进程guard观测的写操作仅自有根且无denied；这是Node函数审计，**非OS sandbox/全盘零变**，也不无依据扩大Vitest fork保护范围。无网络/service/GUI结论。

收口另以Node逐文件sha256核末轮`evidence-sha256.json`：76文件、0不一致；只检查自有前缀Markdown的相对链接，全部存在，exit0。该文档/原证自检不构成产品PASS。

## Fixtures、历史轮与下一步

[GUI交接单](materials-files-reports-independent-auto-20261021-gui-handoff.md)已给F3/F4/F5标准JSON+完整侧车、原生源文件、ids/expected、逐ID提交/取消/原证字段。F3 sha=`7c28e49e68fb9c6197c9b9ac11b793e7f1deb0b17514417d568386f48de20c56`；F4=`8f7a1fd1458724d145e8e2ec9adc748ca80b849180c5ad0080169c4ab67d6bf3`；F5=`8f9bf659a59077af3753900b9fec43dbca752673e59516d025f649a1982f8b4c`。settings为真实export审计，pilot是localStorage；sessions/checks不入包；所有包原/重命名路径bytes预检均通过。

旧`01E1Jl/1XffrJ/FYWXrI/U5NQMs/rVmeKk/uctDgH/Px66nt`保持原输出。首轮设施JSX/risk/绝对export、第三轮archive最小包/200状态、Px66nt TS2322与固定25ms等待误差已逐项留痕；最新类型修正及真实传输状态等待后独立复验绿。旧340c产物/源码副本在末轮反例文件，实际证明配置根上层link existing/missing均可穿出；新源两路均拒零写，Darwin固定tmp正例通过。

Main下一步仅修/核两恢复接缝、按GUI交接单采当前候选原证；原计划owner纠正Oracle与出口边界。专家复验新修复/受影响范围后再判门，不由本报告授权build/service/提交或发布。角色本轮执行及报告已完成，产品验收未闭门。

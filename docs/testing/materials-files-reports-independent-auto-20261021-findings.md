# 资料、文件、汇报即时独立缺陷单

> 给 Main 修复及其他专家接续使用。2026-10-21 首轮真实 AUTO；未改产品、未启服务、GUI NOT_RUN。原证前缀目录首轮 `materials-files-reports-independent-auto-20261021-01E1Jl`；以其 candidate/source-before/own-lib-sha256 为被测对象，不以 A0 lib 代替。首轮仍有自有设施失败，下面只列已确证生产行为。

**较新Oracle纠正优先**：[纠正回执](materials-files-reports-independent-auto-20261021-oracle-correction.md)。原文“二次restore成功幂等/旧rv2selected保存失败”只保历史冲突，不再视产品FAIL；新轮按已冻B6当前版守卫及B2首次restore合同执行，不改产品、不改旧证据。

**末轮 `fiKpOr` 结论优先**：[正式角色报告](materials-files-reports-independent-auto-20261021.md)。下列MFR-F-01..05的具体AUTO已新源独立复验通过（非GUI）；配置根上层existing/missing反证亦通过，旧340c真实函数穿出另留证；TS2322经Main明确string修正后自有tsc退出0。仅MFR-B-01/B-02两恢复接缝仍FAIL，70个领域子断言通过/2失败、组件7/7、根上层自有5/5；相关源审计时无漂移。不把旧即时单再当未修现状。

## 即时报 Main

| 缺陷 | 精确映射 / 严重度 | 生产行为与最小重现 | 修复边界 |
| --- | --- | --- | --- |
| MFR-F-01 | RA-F03 / P1 | 在自有 file root 的 hash 前2目录建指向自有 tmp 外部目录的 symlink，`storeAssetBuffer`成功写到该 root 外。`resolveWithinRoot`仅 lstat最终节点，未检祖先；不是读取正式路径。 | file-assets.ts根/祖先真实路径校验；保已有幂等和合法根。 |
| MFR-F-02 | RA-F01、RA-M06文件交叉、RA-J03 / P1 | `addTask` draft 含 `addFile(stageId,clientId=c-file)` 和 `progress add refs=[c-file]`，真实Stage已存在却报“引用的资料项 c-file 不在本任务当前资料区”。pure ops先执行而file别名未入映射。 | tasks.ts / file promotion与draft ops接缝；别名必须指向最终实际at-ID，同hash两个alias仍可正确解析。 |
| MFR-F-03 | RA-J03、RA-F01失败路径 / P1 | stage→真实addTask(file+末尾空author)抛错，DB零写但新增内容寻址最终字节；plans/prepare发生在补偿try之外。首轮具体新增 `df/df96c651a37a62f4030ddfad913cbfafed2540c71de29c2ecfaf3f3bc4880ca5.md` 22字节，stage保留。 | 从准备/纯ops校验失败起覆盖回滚，保stage重试、不删共享既有字节；勿仅改成功路径。 |
| MFR-F-04 | RA-F01已有任务加文件、RA-J03 / P1 | 真实`task update`基本title+draft.addFile(stageId)报“未知资料操作：addFile”，主保存失败；新建无alias同hash保存已通过。 | task update与文件计划同一临界区；不能改成二命令后声称原子。 |
| MFR-F-05 | RA-F02、RA-J03取消路径 / P1 | 第二轮 `1XffrJ`真实`TaskDraftMaterials`先经生产upload返回201/真stage、延迟fetch continuation→卸载→放行成功，`onDraft`仍被调用1次，取消DELETE未执行。5个其他组件断言通过；不是自建模型或GUI。 | onPickFile成功分支须验证卸载/abort代际，迟到stage立即安全回收，finally状态亦守卫；真main成功不删final资产。 |

## 合同冲突与设施分离

- RA-M03要求再次restore幂等；当前生产`progress restore`再次调用返回error“未找到可恢复的进展条目”，不是成功。但首次restore已保全四修订/稳定ID。需按已批准合同裁定，不把首次成功扩大为幂等。
- RA-R01/J04要E1 rv2历史版；当前selectedRefs只接受latest，按旧冻结合同拒旧rv2“源已更新，请重新预览”。excerpts直路径合法历史rv2成功。先核合同选择，不静默让Main改选latest后标原用例PASS。
- 首轮RA-M07错误用了普通项目报告render入口当完整资料export；须换实际资料导出入口再判，不据此开产品缺陷。
- 首轮RA-R05设施给了隔离禁止的绝对导出路径；将改自有相对子目录再跑。
- 首轮F5种子risk漏probability导致后续backup暂未执行；补合法字段，不改产品schema。
- 首轮组件测试因自有Vite默认classic JSX报React未定义，非生产缺陷。改自有测试配置为automatic后复验。

现有作者脚本b2-materials/b3-bytes/b6-report各exit0，targeted14文件123断言exit0；以上不覆盖四确证缺陷，不据总数填逐ID。完整终报告及F3/F4/F5预检包继续产出。

## 第二轮设施与有效范围

- F3/F4/F5标准备份及字节预检均成功；RA-F07 hash/missing/path拒绝、实际JSON库中途table-write/byte-promotion一次故障和回滚均通过。
- RA-F06首次恢复成功，比较时遇到JSON省略`undefined`可选键（deliverable.branch/repoUrl）导致自有deepEqual红。应对JSON语义归一后逐字段重测；不据此开产品缺陷，不把后续新进程尚未运行写PASS。
- RA-M07实际资料export及RA-R05相对隔离export已通过；首轮错误设施保留不抹除。
- 第二轮主树`client/views/tasks.tsx`漂移，冻结源ebd763d3…→结束c6b84a4a…。领域与直接TaskDraftMaterials测试不依赖该消费视图；不签任务列表/表单GUI接线及整包候选。

## Main 最小修复测试合同（冻结）

完整源指纹、真实调用/前后/先红原证见 [repair-contract](materials-files-reports-independent-auto-20261021-repair-contract.md)，第二轮 `1XffrJ`。五项全部 P1，不延展新功能。

| 修复边界 | 必须复验的最小断言 |
| --- | --- |
| file-assets根/祖先symlink | root和hash祖先symlink穿出皆拒；final symlink/绝对/穿越仍拒；正常根读写/同hash复用不被破坏；所有拒绝DB/字节零写，外部也仅自有tmp |
| create filealias+progress | 新文件c-file解析最终at-ID；同hash两clientId都解析同最终at-ID；坏alias整包拒绝，不半建/不遗留最终字节 |
| prepare/validation/partial failure | 错基本字段、末尾坏op、prepare任一点和已写部分DB后的故障均回滚；无新final字节、原stage仍可retry、原共享字节不删；合法修正一次成功 |
| update one-envelope文件 | 既存task basic+addFile+进展一次真command成功，稳定ID/全部旧revision不动，stage消费；上述所有失败零写/保stage，不拆即时attach+basic冒充原子 |
| TaskDraftMaterials真实组件 | unmount late201不publish且取消真stage；abort不publish/不落库；StrictMode实际双effect需DOM工具或MainGUI补证，renderer仅包装不冒称双effect；main commit-success/submissionRef=true卸载不DELETE final资产；失败busy恢复、重开无残留 |

先红已独立执行的 `worker.mjs` 四项和 `component.test.tsx` late201可引用；同hash两个alias/更早prepare及partial故障作为最小受影响回归继续补。二次restore与历史selectedRefs合同差异留上节，Main核较新有效规则，本专家不偷换latest。

## 新轮有限复验与两个恢复接缝红项

`rVmeKk`全新冻结（不覆盖旧红）：root/祖先symlink、create单/双filealias、prepare第二stage失败零final、末尾validation零写、真实task put一次故障回滚、update one-envelope文件皆通过；真实组件6/6通过。仅签此冻结源的具体AUTO，领域开发仍在途，不能当最终产品候选；source-before/after仅原作者新增atomic测试漂移，本专家未跑该新增文件。二次restore/历史rv2红仍保留。

| 新确证 | 真实调用/前后 | 最小后续 |
| --- | --- | --- |
| MFR-B-01 / RA-J06、RA-F06 GUI接缝 / P1 | 当前panel选本地文件→`restore-content JSON.stringify(content)`；独立真handler对标准createBackup+完整precheck通过F5先preview success，再confirm返回“含file_assets但未提供备份文件路径/摘要，无法校验字节，拒绝恢复”。空目标DB/data/files全不变。原证 `rVmeKk/content-restore-observation.json`及`RA-J06/AUTO-content-file-restore`先红。 | 不能删除F5 metadata/侧车来假通过；先核现已批准恢复入口如何让字节bundle进入标准precheck/confirm，可修既有路径或明确能力与合法路径入口。Main用路径CLI播种可测其它页，不构成UI恢复PASS。 |
| MFR-B-02 / RA-F07预检 / P2 | F5副本仅`extra.file_assets[0].relPath='../outside'`，真实`restore-content`演练仍success，DB/data/files零写；`validateBackup`只验envelope，未调用完整precheck。生产完整precheck/confirm能拒绝。原证 `rVmeKk/content-precheck-observation.json`与`RA-F07/AUTO-content-precheck-path`先红。 | 当前可识别的schema/关系/relative安全应在preview先拒；无法JSON-only检字节时明确未检，而非用路径restore绿替代此入口。不得为此弱化真正恢复的字节守卫。 |

## 自有设施纠正留痕

- 第三轮archive误要求最小archive包包含progressLog，已按其实际最小保存合同改核attachments+旧新evidence，完整history仍由标准backup比较；不是产品丢史。
- 第三轮即传已有task upload期待201错误：生产此路径200，只有stage路径201。已改正确200/assetId结构后中文空格RFC5987+sha通过。
- `pm-b1-pilot`实为localStorage，不是DB settings。第三轮起F5改用真实exportProjectMarkdown出站审计生成settings，旧假的同名setting不再使用；仅domain basic写保新键已AUTO，实际pilot开关仍GUI NOT_RUN。

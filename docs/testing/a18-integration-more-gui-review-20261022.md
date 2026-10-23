# 旧 A13 产品 P0/P1/P2 补件有限独立审证

> 2026-10-22，trae，独立测试专家。供 Main 和项目所有者按原件核对有限结论；只审已交 `A18/integration-more`，不开发、不操作 GUI、不运行产品，不签整项或矩阵。Main 是采证端、没有 PASS 判定权。报告与自有 audit 是本次唯一可写范围。

## 1. 结论与授权

**有限审证完成，存在 1 处实际输出 FAIL 和多项覆盖 BLOCKED；不作全部融合、旧 A13、Main 新 A18 或发布 PASS。** 原计划 ID 不覆盖、不改写。用户持续“全部未验/确证独立、最后统一普通 commit”保持；本专家未 commit/push，释放不等提交或发布授权。

本批按负责人派单，限 `RA-P0004/0005/0007/0008`、`RA-P1001/1002/1003`、`RA-P2001/2002/2005/2006`。依据 [remaining-governance](remaining-governance-cases-20261021.md)、[原 GUI handoff](governance-growth-independent-auto-20261021-gui-handoff.md)、[修后交件](governance-fix-independent-retest-20261021-gui-handoff.md) 与 [材料交件](materials-files-reports-independent-auto-20261021-gui-handoff.md)，适用 AGENTS、collaboration §9、§11，不追溯新增待表决矩阵。

Main 后续补充明确不扩批：新的 SOURCE/AUTO 149 files、1552、pin11/453，以及已审 verify 三脚本建议、后续 habits 修复，**不纳本轮证据和冻结输入**，由各自专家审。主工作树 `src/scripts/habits` 从未列为本次不可变资源；Main 可按已有授权和独立门继续修复。A18 growth-more 970、A16 G04 和其他已审签只保原件，不重复判定。

## 2. 被测身份与证据完整性

证据根 `reports/all-pending-evidence-20261021/A18/integration-more/`；下表中的短步骤目录均相对该根。不能因目录为 A18 就换用新 A18 产品身份。

| 身份字段 | 核对结果 |
| --- | --- |
| 基线提交 | `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`；这是 dirty 候选基线，不是候选全部 |
| 被测插件 | `A13/candidate-final.json`，隔离树 `/private/tmp/pmtool-a13-closure-20261022` |
| 候选 manifest SHA256 | `d70267f974fb9aa8aaf496a4f1d49abef33d26d410b6a453eb4569fadaa9a51f` |
| tracked patch 声明 | `824d9c3c96095731580fac8edffbaced9998d5b8e245affbbb8c342e07df507b`；完整 sourceHashes 514、artifacts 453 逐件实读吻合 |
| 宿主提交声明 | `1142fb74f2bbcc54dc9499054c0448c9b876cbf2`；不以插件 HEAD 代宿主 |
| 原运行根声明 | `/private/tmp/pmtool-a13-materials-runtime-20261022`，3242；本专家未访问该活跃根、profile 或服务 |
| client.js SHA256 | `7f037fce5115157101afb64cef7b7fd0e470742ac3eb96a11cabe0a43e56ae7c` |
| 原/恢复加载 | 原 `1792618531950.5`、恢复重进 `1792629235910.3`、后续加载 `1792629530324.2`，不混成一轮不间断采样 |
| 完整加载实证 | 原与后续加载响应均 2581559 bytes，SHA `69656e3d1164c9a26bea86a31138adc42167fc8abcacb66941ef7ed211b405fa`；归一化完整 client 段 1702727 bytes，仅在 offset 875361 出现一次，status 200、非缓存、frame/target 绑定吻合；不是用 HTTP 200 代 GUI |
| 索引 | 5755/5755 文件 bytes/SHA 吻合，无未列新增；index SHA `a63688282f1d09226c68db11aca065731e39312a23c1cd60504d8637cb81a4ce` |
| observations | 83 步逐条重算 exit/events/diff；SHA `c42f22f60e772c8facae86307ffbc36dac9d4a3c04046b4c7d37ed1e084878b6` |
| 帧 | 2490 帧与原 frames.json/hash 一致；哈希全验不等逐帧目视，只抽必要动作 |
| recovery/exportview | 索引内副本分别 90/12 文件，与 A18 原本体逐件 bytes/SHA 相同，原副本和本体均保留 |

A13/A14/A16/A18 声明的源码件数分别 514/515/519/520，产物均 453；声明指纹全部一致，隔离完整 `src/lib` 纳保护。后三套仅保护，**不是其验收**。共享 `.bin` 十件 A16→A18 的历史漂移只引用 [A19 原诊断](../../reports/a19-shared-bin-drift-diagnosis-20261022.md)，不恢复或读写共享依赖、不洗白原漂移、不混为本轮产品字节变化。

## 3. 真执行链与原失败保留

83 个采集步骤中，80 个 `exit.json=0`，3 个 `exit.json=1`，此数是**采集退出状态，不是80项产品PASS**。75 条真实 `/api/commands/execute` POST 对应 user `command/run`；74 条匹配同 commandId 的 `done`，1 条保留未完成。请求 `agentId` 与本次绑 task 的 session 均为 `session-792b22a6-e1db-428a-8816-4e86592a7262`；重启后没有捏造新绑定。

宿主实际仍在 hero、输入提交后清空、command cards 数为 0。代表 PNG 确证可见命令输入和空 hero；**不声称成功/错误/反思文字已在 hero 可见**。本报告的响应判定来自原 WebSocket `done` 和 raw JSON，不要求增加原规格未承诺的导航，也不借本报告关闭其他宿主反馈缺陷。

| 原失败/边界 | 原件与有限结论 |
| --- | --- |
| 错误导航/行定位 | `pm-nav-1792628312815`、`task-open-1792628284542` 原 exit=1 保留；后 `task-open-1792628337556` 实际表单回读成立，不将旧失败删掉或追溯作成功 |
| 绝对路径 markdown 导出 | `command-1792628884311` 收到 error done“导出失败”；原件保留。只判本次路径执行失败，不从无私有日志推断根因 |
| 绝对路径 web 导出 | `command-1792628886114` 只有 POST/run，无 done，采集 exit=1；**BLOCKED 完成结果**，不算成功、失败业务写或 exactly-once 重试 |
| 宿主恢复 | 原 listener-before 3242 查询 exit=1、stdout空；prior-pid 查询 exit=1、stdout空。start.json 声明新 PID61433、同源码/根、精确3242、私有stdio；ready、合法重进、session/notes/reflect/lesson回读与后续全段加载支持恢复。原 PID8390 消失原因未确证，本专家不读取 privatelogs/token，不额外启停进程 |
| 跨样本差异 | 79 个相邻成功样本桥接的非零差异仅该 session_projcache 内容哈希，业务表/附件/备份/导出没有桥接新增或删除；不是原始根完全静止。markdown 默认覆盖拒绝本步同样有该缓存变化，业务/导出零写 |

## 4. P0 有限结果

以下 PASS **只修饰写明的实际步骤**，不是完整 ID 或完整 GUI 门。

| 原 ID | 有限判定与原证 | 不签范围/最小补件 |
| --- | --- | --- |
| RA-P0004 | **PASS：attach-evidence 链接支路**。`command-1792628258613` HTTPS 真写，仅 t1 evidenceUrl/updatedAt 改、真实来源账本 refs 指向 t1；`...1792628266445` javascript 返回 error、四根本步零写。`task-open-1792628337556` 实际 TaskForm 标题/证据字段回读，取消零写；未自动 done/清单 | **BLOCKED：capture 模型候选另一支路**，本批未采模型，不以 attach 的 kind=capture 账本代 capture 模型旅程 |
| RA-P0005 | **PASS：本次同 task/session 两绑、合并 note、项目 list/task notes、B项目空、恢复新 host 回读**。`...1792628217125/8225795/8234077/8242049/8250016`；仅一绑定 `session-mvisk1k4-flv5zz`，两 note 原顺序保留；`...1792629326047/9328329` 回读一致 | 不把 F5 restore 当 sessions 恢复，也不声称任意会话/多任务全集 |
| RA-P0007 | **PASS：t1 已有草稿幂等保留、edit、明确 final、repeat final、恢复回读**。`...1792628764465/8773080/8786598/8795187/8804583/8813217/9330196`；final重试零写 | t1反思 `ref-mvi5z85j-yk04ji` 原 createdAt=`2026-10-21T13:44:55.303Z`，不是本轮新生成；**BLOCKED：真无材料 task 新 done→gap**。t3不可当空材料种子，见下节；不签失败钩子或 milestone/dlv事件 |
| RA-P0008 | **PASS：仅现有 t7 overdue-untouched 提示和只读措辞**。`...1792628839354` 仅1提示、t7、最终由人、不写业务；原全部任务卡亦有非验收声明 | **BLOCKED：五类合法fixture与展开/打开目标**。缺 done2/5、真无材料done、100非done、D+2等对应旅程；沿既有 check 入口补，不加新检查页 |

### 文件资料反思输出缺陷

**A18-IM-01 / FAIL，影响 RA-P0007 的文件资料文本呈现。**

`command-1792628831682` 把 t3 done，`...1792628833825` reflect 返回并存 raw：

```json
{
  "taskId": "t-0003",
  "attachments": [{"id": "at-1", "kind": "file", "assetId": "fa-0001"}],
  "sourceEvent": "task-done",
  "status": "draft",
  "materialsLine": "资料区已登记：（质量由人复核）",
  "gaps": []
}
```

这是从两份原 raw 摘取的对应字段，`materialsLine` 是报告别名，不是产品新增 schema。实际 task 有一文件材料，故 **`gaps=[]` 不证明无材料gap失败**；实际材料声明却缺类型/数量，是可复核文本缺陷。旧 A13 `src/core/reflect.ts` 的 `buildReflectionDraft` 只统计 link/deliverable，file-only 时 parts 为空；本专家只读源，不执行函数或改产品。

最小修复为已有反思构造处诚实列文件资料；保 `taskHasMaterials` 合法口径，不删除 t3附件来制造无材料。由开发在获准候选修，独立复验本原证及现有 link/deliverable 路径。另用生产既有 task add/update 创建真正无材料新任务，明确 done→reflect→重试/回读，补原 P0007 空材料门；不发明新功能。

## 5. P1 有限结果

| 原 ID | 有限判定与实际步骤 | 仍未覆盖 |
| --- | --- | --- |
| RA-P1001 | **PASS：空 list/open、写打开设置、本次排序、PM 添加 queue card、展开**。`...1792628379122/8386306` list空且零写，open写 pmQueueOpened；`...1792628412435` t5 today/P1；`...1792628421224` 原 due<start负例拒且零写；后 `...1792628501585` 合法 start10/17、due10/18、P0/blocked；`queue-add-1792628480746` 真实布局写；list t7 top/迟到4天、t5 rest | **BLOCKED：absence-only/缺席历史及跟进入口完整旅程**，不凭两同名行猜task，映射按raw id；不签全排序全集 |
| RA-P1002 | **PASS：普通 mute/rest/UI unmute；关键 mute仍top；最后UI unmute**。`...1792628512618` 静音t5；`queue-rest-1792628540593/8551676` rest已静音及真实unmute；`queue-rest-1792628565203` 实际mute t7，`...1792628586389` t7 muted=true仍top，lateDays=4；`queue-rest-1792628747685` 真unmute | **BLOCKED：到期TTL真实历史读取**，未交合法过去静音种子，不改时钟。unmute 删除 pmQueueMute 是本次明确可逆设置动作，不报业务删除 |
| RA-P1003 | **PASS：真实当前时段08:00..09:00 quiet→topnull/rest2→PM展开→off恢复**。`...1792628596520/8611332` 为2026-10-22 00:23Z采样，实际 quietMode=true；`queue-rest-1792628657288` 两项保留，`...1792628678447/8691332` 清 quiet并恢复top。截图与raw相符，未注入GUI时钟 | 不签跨午夜/边界矩阵或其他时区；quiet off 删除 pmQueueQuiet 是明确恢复设置 |

## 6. P2 有限结果

| 原 ID | 有限判定与实际步骤 | 仍未覆盖 |
| --- | --- | --- |
| RA-P2001 | **PASS：三档相对 a18 真生成、三档默认覆盖拒、明确confirm覆盖、实际file HTML只读打开、改源重开静态不跟随**。`...1792629336046/9338595/9340797` 三档；`...1792630051872/0054340/0056297` 拒；`...1792630058648/0060889/0063006` confirm；`integration-export-view` 两次原HTML打开与归档字节；`...1792630139989` 仅t1 description/updatedAt变，三档不变 | 无script、控件、外部资源/请求，plain实档保留；**BLOCKED：恶意HTML注入fixture GUI/完整内容安全矩阵**。正常文档无script不等恶意内容已验 |
| RA-P2002 | **PASS：本次audit/sent读取与append-only历史前缀保留**。`...1792629345226/9347928` 原读；audit/sent 从F5既有1条→三档后4条→confirm后7条；旧4条逐字段相同，未改业务task | **BLOCKED：31天archive/29天active、task出站位真实重开**。按既有标准备份/restore预检确认补合法历史，再既有 export audit/sent/archive 入口采，不等31天、不改时钟 |
| RA-P2005 | **PASS：仅t9 wrapped状态及stats/queue/check/reflect命令切片**。`...1792628835147/8836440/8837783/8839354/8840950` wrapped≠done，stats完成2/10且wrapped1，queue/check不列t9，t9无反思记录、reflect诚实暂无草稿 | **BLOCKED：people/board/客观聚合、清单不变量、AI拒wrapped整旅程**。本报告不把概览或环图旁见提升为全部consumer PASS；缺真生产aggregate只补既有入口和合法清单种子，不加聚合功能 |
| RA-P2006 | **PASS：真实t9来源lesson add/edit→人final→repeat→list/新host回读**。`...1792628854464/8876155/8878290/8880174/8882475/9331496`；早期输入原本就是字面 `\n`，存一行blank并gap，不冒充多行；后 `...1792630015691` 真实structured3marks新 `lesson-mvitmn83-0tmvsn`，known/pending/blank各1，`...1792630045861/0049214` 人final/list | 后structured新lesson不代替早期literal原件，不冒充其多行edit；不签经验全集或徽章/视口矩阵 |

三档冻结字节（源改前后6份副本同hash，非重生成）：

| 文件 | bytes | SHA256 |
| --- | --- | --- |
| p-0001-report.md | 3205 | `8a2b559460354df881d1a04c0d5dc7f9035fe9f4cde830844c0341aa6591b0c8` |
| p-0001-report.txt | 3242 | `42f2694b6aec22ef2aeae1ecf33924a1608f3d9976a7dd2a17d7e65c6de9b0a3` |
| p-0001-snapshot.html | 12556 | `021f3c37baa8078370048f6d8538ab98120c9ac2b34cfbac4b0e2e304a36f5fd` |

file HTML 原件顶部标“只读快照·非实时”，生成时刻`2026-10-22T00:47:42.210Z`；controls0、外部资源0、请求仅本file、console无错误，冻结后的同文档不包含源新增说明。只读文件两次重开不等任务表单重开；时间、内容、文件哈希三者分别核对。

## 7. 审计、目视和保护释放

审证环境 macOS darwin arm64、Node v22.23.3；不 install/build、不运行任何 verify 或产品测试。命令在仓库根：

```sh
node docs/testing/a18-integration-more-gui-review-20261022-audit.mjs
node docs/testing/a18-integration-more-gui-review-20261022-audit.mjs seal
```

终轮 audit **退出0、34/34断言成立**，其中含“原FAIL/BLOCKED数据仍诚实保留”断言，不等产品34项PASS。首次自有audit因误读lesson为draft.lines中断退出1；后纠正为实际lines。两次中间断言分别错误要求宿主cache零写、禁止正常queue设置删除，均由原件纠正，未改业务Oracle或原证。缺 `rg`、一个尝试定位的JPG文件名不存在是审证工具边界，未伪称成功读取。

代表目视限宿主 bind输入/空hero、TaskForm标题、queue添加/普通静音rest/关键静音/quiet两项/解除静音、reflect final输入、structured lesson输入、源改前后fileHTML；具体路径/hash在自有audit `visual`，另见少量原帧辅助，不逐张堆2490帧。1440×718 dark/dpr2为实际步骤采样，loaded1440×900及本地file1440×900单独记，不签宽深/缩放/键盘/六态矩阵，也不声称反思图已可见。

保护基线10770文件，包括5755原索引全件、复制与原recovery/exportview、原loaded/seed、原独立治理/材料/既审growth原件和四隔离完整源码/lib。audit开始/结束指纹无新增/删除/内容或mtime变化；最终 seal 再比同基线并封报告/audit/script指纹。**不监控Main livingdocs、新A18测试产物、主工作树产品、旧3242活跃文件或凭据。** 原始证据永久保留不因本轮释放允许覆盖；本次隔离候选审证冻结在seal无漂移后结束。

**释放：本次有限报告完成，不持有build、端口、GUI、数据、共享依赖或主源写锁；不再阻塞Main按授权采纳已独立审过的scripts/helper或修复habits。** 如继续本报告缺口，只补上表最小既有入口，由Main采、独立专家审；新候选须重新认领受影响证据，旧结论不自动继承。未签capture模型、milestone/dlv事件、TTL/31天历史、wrapped四consumer全集、Main新A18GUI或整发布门；用户最后统一普通commit约定不变。

本报告、[自有audit](a18-integration-more-gui-review-20261022-audit.json)、[审计脚本](a18-integration-more-gui-review-20261022-audit.mjs) 和 [最终seal](a18-integration-more-gui-review-20261022-seal.json) 构成完整回件；不更新其他testing/livingdocs。

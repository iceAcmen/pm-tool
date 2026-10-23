# 客观进度原ID保留与当前合同补充

> 从属 [总登记](remaining-acceptance-register-20261021.md)，独立专家计划，不回填原 `objective-progress-acceptance.md` 的 NOT_RUN 为 PASS。Main用隔离F2和真实命令采证，专家逐ID审签。ADL-050/055及后续wrapped合同优先；不改原历史计划。

## 1. 口径纠正

- 原OP-CK01“task仅新增checklist”和§12/§13“人工/工时/证据deferred”仅为当时版本边界。ADL-055已批准 `effortHours/evidenceUrl/manualProgress/manualProgressNote` 可选字段，completedDate复用已有字段；B2再新增attachments/progressLog。因此**不能用task含这些已批准键判FAIL**。Checklist item仍恰 `{id,text,done}`，同task唯一；不接受item doneAt/weight/title/progressMode。
- `objective` 只由清单派生；`display=manual??objective`、mode明确，人工显示不是违反“客观不造数”。所有原“甘特/列表必须显示value”测试改为同时核objective真源+当前display的模式，不能人工覆盖看成objective变化。
- wrapped仍可展示其自身清单事实，但不进父/项目覆盖分子分母、不挂pendingAcceptance、不入done/open/催办、不触发task-done复盘；F2-L8专门补。不能用旧“全勾且非done必pending”误判wrapped。
- 零写仅对derive/doctor/只浏览/取消；生成新汇报/导出/queue open有明确合法写，不要求整个库全零写。旧原OP-BD05端口3080/3091换成本轮保护正式3172/PID44388及profile；所有正式资产不操作。
- 原390“无法实测→人工”的历史工具能力前提已变，Main具桌面能力；本轮390按GUI采，不自动MANUAL_PENDING。“备份不抬formatVersion”以当前已批准B3/extra扩备份版本为准，不用旧版本约束拒新格式；新旧兼容/清单保全仍要验。

## 2. 原矩阵逐ID执行映射

下表列出原所有CASE_ID；默认NOT_RUN，原步骤/断言继续有效，只有§1和下表显式修订处替代。每原ID单独交录证目录，可关联同次运行具体assertion/时间段，不凭verify脚本exit0笼统覆盖。

| 原精确ID | fixture / 初态 / Main动作及提交点 | 预期与原证 / 修订 |
| --- | --- | --- |
| OP-CK-01 | F2旧task及真实checklist add读回；纯schema负例多item键/重复ID | item三键、旧record缺checklist可读；**task字段限制按§1替代**，不禁已批准新字段 |
| OP-CK-02 | F2-P已有子任务→真实checklist add | 拒绝/中文且父无清单，存储零写 |
| OP-CK-03 | L1已有非空清单→真实move/add子到L1 | 拒绝且保原清单/父子，不静默清单 |
| OP-CK-04 | 新独立leaf逐add→rename→remove，每步提交 | 只目标item字段变化；无整数组普通update替换 |
| OP-CK-05 | 真实toggle期望true→同载荷重试→相反/非法期望 | 幂等最终true，不反向翻；记录真实API参数/返回，不用自造模型 |
| OP-CK-06 | L1 toggle一项→磁盘/新domain读回 | 兄弟项/status/legacy progress不被附带改 |
| OP-LEG-01 | 无清单旧leaf progress40，derive及GUI | objective=null，“原手填40%”旁注不进objective，manual另显不混为legacy |
| OP-LEG-02 | 无清单progress80无manual，derive及GUI | objective=null，不能伪造客观80/100 |
| OP-LEG-03 | P仅L1=50及无清单legacy40子 | 父=50、covered1/total2，不平均成45 |
| OP-LEG-04 | 合法旧包恢复隔离库→只开/关闭列表 | 无首载补键/回写，业务库sha/mtime相同；禁止queue open等额外写动作混入 |
| OP-DV-01 | 4项leaf逐勾1/2/3/4，每步提交后derive | 25/50/75/100，同输入确定 |
| OP-DV-02 | F2-L4全勾todo | objective100/pending，status仍todo；wrapped另RA-OP03 |
| OP-DV-03 | F2-L5 done 2/5 | objective40+软告警，不自动补勾/改status |
| OP-DV-04 | F2-L6 done无清单 | objective=null，不因done=100 |
| OP-DV-05 | 独立leaf3/5 | checklist字段3/5与coverage1/1不同维度，GUI各标签对应 |
| OP-DV-06 | F2-L7空数组及缺键各测 | objective=null不是0，证据不足；非空零勾才0 |
| OP-DV-07 | L1真实update todo→in_progress，仅status提交 | 清单比率不变、不保底，updatedAt只合法目标变化 |
| OP-RU-01 | P下两清单leaf50/75，Plegacy100 | 父63，原分数等权/只最后round，父legacy不计 |
| OP-RU-02 | P下L1清单50、L2无清单legacy30、L3缺键 | objective50、coverage1/3；wrapped另RA-OP03 |
| OP-RU-03 | 同1/3树→task/board显示 | 叫已覆盖任务清单完成度不叫整体完成率 |
| OP-RU-04 | P下0/100两非空清单 | objective50、coverage2/2，可整体完成率 |
| OP-RU-05 | P所有leaf缺清单/仅legacy | objective=null，coverage0/n，不因父legacy伪填 |
| OP-RU-06 | F2 P→M→L1/L2→derive | 仅leaf，不重复父中间；源码遍历/计数或标定输入阶梯复杂度辅助，不用单次快耗时证O(n) |
| OP-RU-07 | 清单leaf合法改挂父/删除后derive | 新旧父集合重算一致；title/order改变不变百分比 |
| OP-EX-01 | 纯函数深树100/1000/10000合法结构 | Map全量、重复确定、后序一次树计算，无每层全表扫描，存源码及计数探针原证 |
| OP-EX-02 | **仅纯函数**A→B→A+合法独立leaf | 返回不挂死、环warnings/跳异常；不可导入生产坏库 |
| OP-EX-03 | **仅纯函数**缺ID/悬空parent+合法leaf | 正常返回warnings，合法节点不被吞 |
| OP-EX-04 | **仅纯函数**P parent跨Q | warning不跨项目混算；真实move跨项目拒绝作为集成补证 |
| OP-EX-05 | **仅纯函数**2待验收leaf+环 | pendingCount正确，环warnings，不额外造待验收 |
| OP-EV-01 | 缺清单leaf vs 非空全false | null vs0类型/显示可辨 |
| OP-EV-02 | F2 derive/只读preview调用前后对照 | 不回写progress/checklist；**生成/保存报告合法写另记，不要求该新报告零写** |
| OP-EV-03 | L5跑真实doctor | 报done未全勾不自修，库相同 |
| OP-SRC-01 | F2四消费点源码引用+实际值对照 | 一个objective真源；**mode/display按ADL055分轨，不禁止meta解析** |
| OP-SRC-02 | F0新报告/历史旧快照 | 新calcVersion1，无覆盖averageProgress=null；旧缺键按0读不写 |
| OP-SRC-03 | 相邻快照1vs0/任侧null/同1皆有值 | 异版本/null delta=null，合法同版差值正确 |
| OP-SRC-04 | 原历史快照sha→浏览新算法/新报告→原sha | 历史不重算回填，新增报告不修改旧 |
| OP-SRC-05 | 清单40/无信号/人工70三fixture甘特 | 无manual时填40/空；人工mode显70明确人工，objective仍40。不能人工填充当客观70 |
| OP-SRC-06 | F2依次tasks/tree/gantt/overview/reports，同候选 | objective/coverage同真源，人工badge/证据不足/3/5/pending一致；每页原证与当时快照 |
| OP-Q-01 | command/checklist域源码调用链 | 经enqueueDomainWrite，不普通update整数组，交入口到put核读链 |
| OP-Q-02 | 同OP-CK05真实期望toggle重试 | 幂等；预留rev/actor不变新增多人合同 |
| OP-Q-03 | tmp真实domain两项toggle/rename排队 | 最终序列不丢；用真实并发分歧非相同请求重放冒充 |
| OP-Q-04 | tmp真实存储adapter注入写失败→命令→读回 | 拒绝不半写/不改status-progress；正式资产零污染，只隔离故障 |
| OP-BD-01 | F2写清单→Main终止其精确隔离PID→新进程读回 | id/text/done不丢、派生同值，进程实际新PID |
| OP-BD-02 | 有损Markdown export与业务数据恢复分开 | **字段往返用当前支持的JSON备份/恢复数据通道**；Markdown为渲染不是可重放全量库，不能新增“任意MD导入恢复清单ID”需求。若原实现承诺另有lossless import，交接口核后再测 |
| OP-BD-03 | 当前createBackup/旧合法包precheck/restore | 新清单及旧格式兼容；**已批准新formatVersion不能用旧固定版本判FAIL** |
| OP-BD-04 | 合法旧记录库doctor | 不迁移/补值，逐文件manifest相同 |
| OP-BD-05 | Main既有保护清单/隔离runner前后 | 正式3172/profile不操作，隔离roots有证；不执行本轮禁止的正式读写/启停 |
| OP-BD-06 | Main唯一隔离build+full guard全verify | 逐命令/exit/错误/guard资产变化，不共用lib、client不require server；计数辅助非全部PASS |
| OP-GUI-01 | L1抽屉勾项→保存/即时命令按现入口→四页 | 真写后即时派生一致、无无关回写；开关/payload注明，不把草稿未保存值当已落盘 |
| OP-GUI-02 | 合法v0.7.4旧包恢复后只浏览任务 | 旁注/无报错/退出零写，不混queue opened/export audit |
| OP-GUI-03 | 真390 F2→看清单/待验收/证据不足 | GUI记录viewport不溢出/裁切；与RA-V-tasks-390对应可复用，能力不足BLOCKED非默认本人 |
| OP-DEFER-01 | 被ADL055**部分替代** | 人工显示/清除是现合同RA-OP01/02；禁止人工污染objective仍测，不继续N/A |
| OP-DEFER-02 | 实际effort字段已批准，权重仍后置 | RA-OP04工时读写；objective等权不受工时影响；不增加effort权重 |
| OP-DEFER-03 | evidenceUrl已批准，Git自动裁决仍后置 | RA-OP04链接合法性/显示；有证据链接不自动勾/完成，不增加Git同步 |
| OP-DEFER-04 | checklist doneAt仍N/A，task completedDate已批准 | item不加doneAt；RA-OP05复用完成日期，不新造字段 |
| OP-DEFER-05 | 多人实时合并仍N/A | 无新同步/actor协议实施门，单域串行写仍OP-Q覆盖 |
| OP-DEFER-06 | war-room doing热修独立，不纳此原门 | 不新增热修功能；当前基础状态显示回归已在B8/F1涵盖 |

以上N/A/替代仅为合同范围标注，不称已执行PASS；表中同一fixture变化须fresh副本或合法恢复，禁止各行互相影响比率。

## 3. 后续合同新增补测ID

| ID / 门 | Fixture / 初态 | Main动作 / 提交点 | 预期与证据 |
| --- | --- | --- | --- |
| RA-OP01 / AUTO+GUI | F2 L1 objective50、legacy40无manual | 主表单设manual30+note来源→save→重进四消费点；再manual0 | manual30/0有明确人工徽标/备注，objective仍50、checklist/status不变；0不能因falsey消失；项目客观均值不掺manual |
| RA-OP02 / AUTO+GUI | RA-OP01已保存manual30 | 点击清除manual→主save→重进；另无清单task人工40→clear | null回落objective50；无清单回落null/证据不足不是legacy/0；取消清除draft零写 |
| RA-OP03 / AUTO+GUI | F2 P下L1=50+L8 wrapped1/1 | derive→父/项目显示→queue/stats/check→人改L8非wrapped→重算 | wrapped不进coverage分母分子/pending/done/open；自身清单事实可显；改回纳入集合并挂pending，不自动验收 |
| RA-OP04 / AUTO+GUI | F2 L1 effort3.5、合法evidence https://example.com/qa；另负数/非法协议 | basic update工时/证据→save→export/重进；负例提交 | 持久显示、缺省老库parse安全；非法值按当前生产校验拒绝；不改变清单比率/自动完成；不能把effort当权重 |
| RA-OP05 / AUTO+GUI | 非done L1 | 真实update status done→查看completedDate；命令显式纠正日期→revert非done→重进 | done记本地当天/显式值采纳，revert清除；表单只读，不造doneAt/自动补历史日期 |
| RA-OP06 / AUTO | F2 L1=1/3、L2=2/3，另中间层及无清单 | 纯derive/新报告同一树→深层重组不变leaf | 原分数最终一次round为50，不逐层round累计误差；project/parent同口径，结构变化不重复leaf |

## 4. Main执行次序

先schema/派生表驱动与OP-Q/BD真实隔离命令，再四页GUI及RA-OP。Main交原ID到真实assertion/时间段的索引，专家逐条审核；缺原证NOT_RUN，不能引用“1130个测试全绿”当OP独立签字。旧独立OP计划没有已验结果，ADL055的作者GUI可作线索但不当本轮独立PASS。

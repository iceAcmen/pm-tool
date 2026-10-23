# 有来源AI与深度融合/成长采证单

> 从属 [总登记](remaining-acceptance-register-20261021.md)。独立专家，全部新增ID NOT_RUN；Main按真实schema及隔离写链采证。依据 P2-6 r8、ADL-055、#22扩实体和 `deep-integration-v2-p0/p1/p2/p3-dev.md` 的有效能力范围，历史“全量已验/直接push”不是本轮结论/权限。

## 1. AI来源失效与确认守卫

F6必须通过真实dispatch+provenance生成refs，不只seed假行。确定性模型可以用现有隔离gateway/DSH_PM_E2E fixture，**不得人工拼页面计划/成功快照/改库绕生产校验**。真实模型另采一次非空来源运行：有可用授权则Main执行，不为取key读正式profile；确需本人授权才MANUAL_PENDING。

| ID / 门 / 原对应 | Fixture / 初态 | Main动作 / 提交点 | 预期 / 原证 |
| --- | --- | --- | --- |
| RA-AI01 / AUTO+GUI / F05 | F6至少2任务及milestone/risk/deliverable/meeting真实来源，已确认账本refs非空 | 开来源台账→按kind展开→打开每个有效来源→返回台账→重进；查ask-provenance实际输出 | 有标题/表/ID/角色/冻结时间与版本、来源跳转正确项目实体；同名不跳错；UI非空分组与refs JSON对齐，不用refs=[]成功继承。ask-provenance可sweep pending，允许账本补偿，不业务写 |
| RA-AI02 / AUTO+GUI / F06/F12 | RA-AI01旧账本；选一真实任务来源 | 用另正常入口**update标题/正文**→再开账本→点重校（真实ask-recheck projectId）→刷新/新进程 | changed失效弱化/原因、结论needs-regen；该项不计supported；旧账本/旧history保留，仅追加新history，不洗白旧结论；四消费点不自动重调模型 |
| RA-AI03 / AUTO+GUI / F06/F12 | RA-AI01另一可合法删除源，保旧ref | 按真实删除保护合法delete来源→台账展开/点击→重校；再重校一次 | missing/手工复核诚实，不删历史来源、不导航错误实体、失效不计supported；两次history追加，旧项不改。若delete保护阻止，用可删除独立源新fixture，不绕保护 |
| RA-AI04 / AUTO+GUI / CMP确认/冲突/撤销 | F6计划s1/s2同task及s3独立，另一副本s1被正常用户update | 出计划零业务写→取消/出草稿再生成→勾选编辑→**整批/逐步明确确认**；分别真实冲突、clean撤销、changed撤销、混合撤销 | 同目标链式baseline正确、外部改动拒相关步及依赖、独立继续；取消零写、不自动补偿；撤销clean还原、changed拒覆盖/混合used不误烧，逐步结果和账本匹配，句柄有界不跨重启。原CMP NF-only5字段按后续#22/K2替代 |
| RA-AI05 / AUTO+GUI / #22+B7 | F6新/已存四扩展实体，task有attachments/progressLog | 四类每个create/update合法各一，经当前ALLOWED_OPS；夹delete/跨项目/未知字段/wrapped/task资料数组写建议→确认 | 仅task.update及milestone/risk/deliverable/meeting create/update白名单落库；拒越权/跨项目；资料/日志只读投影不提议写，unknown/wrapped拒；refs只取applied，创建/更新正确op；计划拓扑/预算/部分成功沿有效合同 |
| RA-AI06 / AUTO + GUI + 本人条件 / F09 | F6无key/鉴权失败/限流/乱码/超长/取消请求隔离adapter；另真实授权模型 | 各故障真实gateway返回→观察中文降级/诊断→cancel→再正常请求；真实模型一次确认非空来源并重校 | 故障零业务写、无假计划成功、busy/abort恢复；原CMP超时120s按AI请求合同，不混launcher10min TTL；真实模型结果仅当次支持。模型环境需本人认证项记MANUAL_PENDING，AUTO确定性不豁免 |

cross-project来源失效、schema/rule版本变化不要求绕production将task搬跨项目：在真实来源验证纯函数白盒fixture分别变project/version→应manual-review/needs-regen；作为RA-AI02/03 AUTO子断言，GUI只采真实可达changed/missing。不凭旧“F13/F14深度观察”把真实崩溃/并发分歧新增全局硬门；现有确认/撤销主旅程已涵盖其承诺分支。

## 2. P0底座与采集闭环

每个命令项保存真实参数形状和返回/存储/重进；GUI门覆盖规格已承诺入口/呈现，只有命令承诺的能力可以用宿主真实命令面板采（不是要求Main新增导航）。输入ID均由总账ids映射，不用示例ID直接写正式库。

| ID / 能力 / 门 | Fixture / 初态 | Main动作 / 提交点 | 预期 |
| --- | --- | --- | --- |
| RA-P0001 / K1 / AUTO+GUI | F3材料/描述/session，另无材料task | ask读上下文→观察相关task投影/文字→cancel | description/证据/交付物有无准确，缺信息诚实，不编造；attachments/progressLog只读，草稿零业务写 |
| RA-P0002 / K2 / AUTO+GUI | F6合法task | task.update提议description/evidenceUrl/repoUrl/branch合法窄集→**确认**；未知title/priority/manual/checklist及非法URL/过长值 | 白名单/最终task schema校验一致；非法行拒不写，已有5标量保留不倒退；branch无repo组合按现有repo关系拒，wrapped人裁决不AI写 |
| RA-P0003 / K4 / AUTO+GUI | F0对话“整理测试任务与证据链接”，合法capture candidates | capture草稿→取消；再capture-apply明确确认→查创建任务和provenance→重进 | 观察模式不落业务任务；候选白名单/日期/URL复核，创建结果可查、kind capture、支持的撤销提示/路径真实；不另要求未承诺自动事务回滚 |
| RA-P0004 / K3 / AUTO+GUI | F0/F3任务、合法https及javascript负例 | attach-evidence真命令→确认返回→task重进/来源；capture候选附evidence另一例 | 合法证据持久/溯源、非法链接拒零写；只挂链接不自动checklist/done；使用既有最小撤销说明，不新增第二undo体系 |
| RA-P0005 / K9 / AUTO+GUI | F5任务+session文字标识 | session bind task/session/note→同对再bind追加note→list/notes→新进程 | 同task/session不重复失关联、note沉淀可追，其他项目隔离；append仅若现行实现支持，规格可选不作缺失FAIL |
| RA-P0006 / K12 / AUTO+GUI | F6真实applied/rejected/undo/不同kind账本 | metric project→与账本逐条核对→重进重复查询 | byKind/applied/undo/pending及最近时间真实，无数据诚实0/省略不编造；只读无业务写 |
| RA-P0007 / X6-L1 / AUTO+GUI | F5有材料task和无材料task各一 | 人update done→看reflect草稿→再done重复→edit补材料→**人final**→重进 | task-done单点幂等、known/pending/blank及gap诚实；best-effort反思失败不阻断task保存；人final不自动验收、无激励徽章 |
| RA-P0008 / K6 / AUTO+GUI | F2 done2/5、无材料done、进度100非done；日期D-1与D+2，wrapped另项 | check task/project→task检查卡展开→开目标→仅查看退出 | 五类现行规则命中及措辞“最终由人”，未覆盖≠未完成、不改status/progress/材料；progressLog叙事不冒充完成材料，wrapped不催办 |

## 3. P1呈现与保护面

| ID / 能力 / 门 | Fixture / 初态 | Main动作 / 提交点 | 预期 |
| --- | --- | --- | --- |
| RA-P1001 / K11排序/open / AUTO+GUI | F1到期todo/P0/blocked/迟到3天以上，F5绑定未跟进task | queue list→open明确打卡→展开rest→task跟进→刷新 | 严重度/到期稳定、top1/rest/lateDays/缺席结存真实；open写pmQueueOpened，list/snapshot读派生不冒充常驻通知 |
| RA-P1002 / K11 mute / AUTO+GUI | 同fixture可mute普通项及关键blocked项；合法过去mutedAt历史由标准备份导入 | mute普通→展开rest→unmute；mute关键→重读；过期记录按真实D读取 | mute压主动top但rest可见已静音；关键豁免符合合同；到期派生恢复，不隐藏历史；每次settings写可逆 |
| RA-P1003 / K11/K19 quiet / AUTO+GUI | 当前真实本地时刻已知，设置包含当前时段from/to | quiet from/to→list/UI→off；纯函数跨午夜/边界独立子断言 | quiet时top为空、rest仍见/不打扰，off恢复；不改墙钟；过界AUTO注入参数不是GUI伪时钟 |
| RA-P1004 / K13刷新 / AUTO+GUI | F6旧ask投影task current值 | 正常入口改task→回旧投影→点刷新→打开task→回旧历史卡 | 最新快照/数据截至时间更新、只读投影不留旧ask时刻值、不自动重调模型；正确task入口/focus及结果变化 |
| RA-P1005 / X6-L2 / AUTO+GUI | F5关联task+milestone+deliverable | milestone改achieved及deliverable改accepted分别保存→reflect查看→重复相同状态→人edit/final | 两种sourceEvent/关联清单/证据gap真实、各幂等、best-effort；task.deliverableId未知/跨项目拒不半写 |
| RA-P1006 / K19/K6 / AUTO+GUI | F1+FL人员MAX尺度，合法历史startD-31/updateD-8由schema备份恢复；blocked3天以上 | people负载事实/建议/烂尾标签筛选→打开task→返回 | 不伪造倦怠分/硬WIP/拒单、建议不自动砍缓；阈值按实际合同与today核、无signal不判烂尾，浏览零业务写 |

## 4. P2出站与长寿

| ID / 能力 / 门 | Fixture / 初态 | Main动作 / 提交点 | 预期 |
| --- | --- | --- | --- |
| RA-P2001 / K18三档 / AUTO+GUI | F5已存task/交付物/反思/材料/里程碑/note | 明确export markdown/web/plain到隔离root；web本地打开；改task后再开原文件 | 三档内容源一致、静态只读非实时+时间、HTML自含无外依赖/脚本注入、plain无HTML；默认覆盖拒绝、confirm才覆盖；原文件不跟随变更 |
| RA-P2002 / K18审计/30d / AUTO+GUI | F5加合法历史pmExportSent 31天/29天、pmExportAudit既有历史（通过标准备份恢复） | export一次→读audit/sent/archive→task出站关联位→再export | audit只增/历史不删，31天sent入archive、29天留active；只显出站位不改task；合法历史无需等31天、不改Date.now |
| RA-P2003 / X7建议 / AUTO+GUI | F5 OKR objective A及KR，另B项目objective；两建议pending | okr suggest→inbox→一confirm/一ignore→重复confirm→**人clear processed**→重进 | pending不创建OKR；确认创建draft不自动定稿、忽略留痕；clear只processed保pending；跨项目/重复受真实保护，不把旧空inbox导航PASS当确认已验 |
| RA-P2004 / X7单父/软联 / AUTO+GUI | 同项目两objective和KR | add/update KR primaryOkrId A+related B→树→切关联→人confirmed；自指/跨项目/不存在提交 | 只一个主归属、related可见不计权重、不变主树；非法关系零写/保输入；D12全kind现有关联按原schema另验不发明字段 |
| RA-P2005 / X2 / AUTO+GUI | F1单独可收尾task/交付物；清单和逾期明显 | 人status wrapped→stats/queue/check/people/board/reflect→AI提议wrapped | 不done、不open、不催办、不task-done反思；清单自身事实不抹掉、不进客观聚合；徽标中性且非正式完成；AI拒，不能仅环图29%证所有口径 |
| RA-P2006 / X3 / AUTO+GUI | F5 wrapped任务，lesson draft已知/待核/留白 | lesson add→edit补材料→**人final**→list/重进 | 经验与任务来源真实，缺材料留白、不自动final、无徽章；合法正文持久，不绕人工裁决 |
| RA-P2007 / K16/X5 / AUTO+GUI | F5含done/wrapped/achieved/反思known行/资料/日志 | archive输出最小包+字段说明；review D-7..D→JSON/MD→重进；仅查看导出文件 | archive只读业务/不写K18审计、最小包不是完整backup；review周期/量化/known来源正确，wrapped不当正式done；源库业务零变；GUI仅已承诺素材卡/文件入口，不新增一页 |

## 5. P3习惯与周期占位

| ID / 能力 / 门 | Fixture / 初态 | Main动作 / 提交点 | 预期 |
| --- | --- | --- | --- |
| RA-P3001 / 建议确认 / AUTO+GUI | F5同项目OKR与两habit suggestions | suggest→inbox未确认→一confirm一ignore→重复confirm→重进 | 未确认无habit记录；确认轻建draft，ignored保留；rationale/关联OKR可见，不自动定稿 |
| RA-P3002 / 两天补记 / AUTO+GUI | 新habit今日D，合法同项目 | checkin D、D-1、D-2分别显式提交；重试同日；未来D+1/D-3提交 | 当天+两天可写且backfilled可见，同日幂等；未来/超窗拒绝且streak/checkIns不改；不用history fixture规避生产写窗 |
| RA-P3003 / 档案/长历史 / AUTO+GUI | F7合法备份历史，已有多连续段/月 | 标准precheck/confirm导入→derive→14天/月份折叠→重进；纯函数today=D及D+3各断言 | 空日不补、断签current0而longest/totalDays保留，14日D-13含/D-14分历史；按月可展开，不全量挤卡。纯函数日期注入独立，不修改GUI墙钟 |
| RA-P3004 / OKR/人final / AUTO+GUI | F5 habit带同项目okrId，另B项目OKR | add/update合法关联→按OKR只读聚合→**人final**→重试final/重进；跨项目关联提交 | 关联同项目校验、聚合不写/不计错、final幂等仅人；未关联如实，非法关系保输入/零写 |
| RA-P3005 / 周期占位 / AUTO+GUI | 当前cycle-hooks/CYCLE_HOOKS及habit cycleDue | 静态核调用链+实际cycleHookPoint返回→snapshot/习惯页查看 | daily-archive/quarterly-review enabled=false、不注册后台调度/通知、无伪“已提醒”；H6仅调研不要求实现，不因后台未触发开FAIL |

## 6. 提交与审证边界

先交RA-AI01..03原证并注明每个ref对应真实dispatch；再确认/撤销和P0-P3按最小旅程交。Main执行确定性AUTO和GUI原步骤，专家审证，不允许“组织者282/326/399绿”升级全部融合PASS。

旧P2-6 r8核心离线门保留，UI F05/F06/F12补真实有来源闭环；历史明确非前置的F02 diff预览、新冲突明细页、F13深故障/分歧并发观察不由本计划追溯增加全局新门。已承诺source失效提示/重校历史、现有确认守卫必须实证；读屏/缩放/失败态与旅程单共享同候选原证映射。

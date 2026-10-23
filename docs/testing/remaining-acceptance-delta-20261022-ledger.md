# 余项逐 ID 台账

> 从属 [有限对账主报告](remaining-acceptance-delta-20261022.md)。仅引用原专家已签范围；“仍需”是已有合同余动作，不是本角色测试或新派单。E01..E24 的独立报告、候选与原证根见主报告 §3。每行保留原 ID；同一原证只复用其实际动作区间。

## 1. 原体验与第一批

这里“旧PASS保留待继承”不等当前候选PASS，“修后AUTO”不等修后视觉。原 D-01..13 取批准盘点 §3.1；B1八项取原收口计划，RA-D补分支仍分别列出。

| ID | 已签子范围 | 证据/候选 | 仍需最小动作或证据 | 影响域 |
| --- | --- | --- | --- | --- |
| D-01 | 三原拖/三逆undo、save/reload/cancel内容 | E03/A8 | 精准cancel mtime/目录/LS与session边界；16卡/跨宽另见B/W，不重三拖 | board |
| D-02 | R4窄浅卡库/单主按钮历史PASS | 总登记§5/R4 | 宽档互斥→390转换/面板让位→cancel，见RA-D02 | board |
| D-03 | R4静态顶条历史PASS | 总登记§5/R4 | 深色滚动中底/反馈/开关面板/Tab主save→重进 | board |
| D-04 | R4工具条分组历史PASS | 总登记§5/R4 | 按当前board/panel/css diff核继承；无影响不再测 | board |
| D-05 | 合法code1/2、Tab/Enter/系统值/拒绝；反馈结构修后AUTO | E04/E07 | GNHD-01修后真实全文反馈、手动取值/原bbox与计时边界，原视觉FAIL仍开 | tasks |
| D-06 | R4唯一主按钮历史PASS | 总登记§5/R4 | 合法级联/阻止确认→cancel→隔离失败保输入→retry | task-delete |
| D-07 | R4单击/键盘调期历史PASS、甘特双轨修后AUTO | E07 | 真实候选阈值内移动零日期写、双击/Enter详情与焦点返回 | gantt |
| D-08 | R4任务↔里程碑历史PASS | 总登记§5/R4 | 当前TaskForm/checklist接缝继承；J02顺带重证实际主save | task-links |
| D-09 | 单前缀/390局部、真实A18常驻红卡/复制与部分恢复 | E03/E19 | 标记catch原因/同值竞争、全原深色反馈路径/BF未采项；不重复普通网络故障 | feedback |
| D-10 | R5手工MD历史、当前修订/固定/安全preview子项 | E08 | session生成/无ID拒、固定MD保存/导出/重进，见R01..05 | report |
| D-11 | R4draft关联主save历史PASS | 总登记§5/R4 | 当前draft cancel/save与quick即时加/移/跨项目拒分开 | task-links |
| D-12 | 深色无效OKR就近唯一错误 | E04 | 原schema全kind合法选择/标题/重进、跨项目/未知ID保输入 | okr |
| D-13 | F7十四条/月展开/D-13分界/390局部 | E04 | 同origin菜单与实例绑定、收起/刷新重进/历史字节回读；不再重复已签月份展开 | habit |
| B1-GUI-01 | 三拖三undo、持久内容与client/editor下发 | E03/A8 | 精准cancel保护/原门环境继承，见D01/BF-G05 | board |
| B1-GUI-02 | 两值/焦点/拒绝/只读子项；结构修后 | E04/E07 | GNHD-01真实视觉仍未签；手动选择取值/反馈复原原证 | tasks |
| B1-GUI-03 | 深色就近拒、A10三前缀负例、A18复制/恢复局部 | E04/E03/E19 | 其余四页浅深/关闭焦点/长错误与标记原因；逐文档缩放索引 | feedback |
| B1-GUI-04 | 合法F7显示/十四日分界/月展开 | E04 | 预检cancel/确认完整保护、收起重进/同origin身份与幂等拒绝；P3002负例可精确复用E20 | habit |
| B1-DESK-01 | 新Finder首投/N1N2回告/S4与箭头局部 | E11 | 新app指针双击→个人Chrome PM原动作/mounted snapshot/完整loaded链，不读旧token | launcher |
| B1-DESK-02 | nonce/Origin/替换cancel AUTO、真实130/601s HTTP | E01/E02/E11 | 真浏览器替换旧回告/认证/当前旅程/重放与安全cancel原证；same-mounted hash-only另补 | launcher |
| B1-PATH-01 | 四格build/export与新进程断言、六根保护 | E01 | 优先补原argv/child status/环境索引，缺档保BLOCKED；当前路径字节无影响可继承 | export |
| B1-PATH-02 | 四格build/settings与新进程断言、六根保护 | E01 | 同上，仅补settings原独立child/路径/时间索引，不全重跑四格 | settings |
| BA-DEF-01 | 单引号路径引用修后AUTO | E02 | BA-PATH01完整stub argv与safe app身份；不再修原引号bug | launcher |
| BA-DEF-02 | 当前旅程撤销/迟到异步修后AUTO | E02 | BA-JOURNEY01真GUI；原FAIL保，不以10min允许旧旅程 | launcher |
| BA-DEF-03 | 真实组件复制代际AUTO、A/B系统复制局部GUI | E01/E02 | 当前共享反馈变更的继承与未采竞争GUI；不怀疑已签A/B字节 | feedback |
| BA-PATH-01 | POSIX语法/路径值局部AUTO | E02 | 各路径stub解析后node/launcher完整argv原件、注入仅值不执行 | launcher |
| BA-JOURNEY-01 | 内存生命周期/HTTP支持，部分新tab回告 | E01/E02/E11 | 同control A→B替换、释放旧A403、B合法mount N2才200、replay403 | launcher |
| BA-JOURNEY-02 | 新旅程替换/reopen/retry/cancel/back旧句柄拒 | E02 | 最终launcher差异继承核定；无影响无需再跑内存动作 | launcher |
| BA-COPY-01 | A75/B43字节、B清旧反馈、真实denied | E01/A0 | 环境/原片缺档保，当前context接缝精确继承；新同值竞争不借这四态 | feedback |
| BA-COPY-02 | 原组件迟到writer代际隔离修后AUTO | E02/E18 | 当前源码diff继承；真实GUI竞争另合同，不重复同AUTO模型 | feedback |
| BA-TTL-01 | 130012.600ms首次200/S4 HTTP | E01 | 与实际合法认证/mount GUI桥关联；不再等130s重复HTTP子项 | launcher |
| BA-TTL-02 | 601005.036ms首次403/仍S3 HTTP | E01 | 无新AUTO余件，最终生命周期源码差异继承；不用已消费N1替本例 | launcher |
| BA-TTL-03 | TTL内替换/cancel旧句柄立即拒AUTO | E02 | 最终diff继承；真旧回告分支关联BA-JOURNEY01 | launcher |

### B1-B8 汇总域

这些是原批次域，不与其下用例相加为功能完成率；其详细余件取后文每个原 ID。

| ID | 已签子范围 | 证据/候选 | 仍需最小动作或证据 | 影响域 |
| --- | --- | --- | --- | --- |
| B1 | dark/默认与pilot静态历史、task/反馈部分真实旅程 | E03/E04/E09/E19 | 默认OFF/ON各真实task旅程、loading/error/stale/noresult与四宽原生矩阵/入口，按DR/MENU/RA-V映射 | tasks-shell |
| B2 | 稳定资料/多rev/软删/raw守卫AUTO及append/freeze GUI | E05/E08 | 组合basic/link/progress主save、两类失败保输入、draft别名/最新冻结/旧新双读完整旅程 | materials |
| B3 | 原五安全/原子缺陷修后、中文暂存/新task去重/下载/严格effects | E05/E15/E16 | 共享断联/原生取消、宿主收件后迟201GUI、全表字节备份/故障回滚，原安全AUTO按diff继承 | file-backup |
| B4 | 原三拖/三undo/save持久局部、board多sort/公式AUTO | E03/E09 | project/legacy/scope隔离、跨宽拖缩/16卡公共序列、BF失败/精准cancel；任务U4另独立门 | board |
| B5 | 甘特双轨/历史键盘及风险/人员AUTO | E07/E12 | 甘特点按阈值/详情、四态ms、risk填充320、people只读负载/烂尾及对应矩阵 | planning |
| B6 | meeting稳定行/局部8档、固定当前摘录/安全preview | E08/E10 | 会→任务→交付完整旅程、issue正关联、session报告/安全MD保存导出、对应菜单/长内容/200% | records |
| B7 | AI01..03来源门关闭、PC/四update局部、习惯正负/人final与确认守卫 | E13/E14/E16/E20 | A19关联展示/A20材料声明、AI四create/再生成base/模型故障、OKR/成长剩旅程、矩阵 | growth-copilot |
| B8 | 多个独立有限子域报告与A18接口95原证 | E18/E22 | 全适用ID映射/剩GUI矩阵/读屏/最终候选继承与全回归、独立总出口；不以局部报告统一提交 | integration |

## 2. 旅程、看板与并发

| ID | 已签子范围 | 证据/候选 | 仍需最小动作或证据 | 影响域 |
| --- | --- | --- | --- | --- |
| RA-D02 | D02历史子项 | 总登记§5 | 宽→390卡库/配置互斥和cancel零布局写 | board |
| RA-D03 | D03历史静态子项 | 总登记§5 | 深色滚至中底/反馈叠层→关闭回画布→Tab主save | board |
| RA-D06 | 删除domain历史/主按钮 | 总登记§5 | 合法F3父子/链接/file确认范围、取消与隔离失败重试 | task-delete |
| RA-D07 | 甘特SOURCE/AUTO与历史键盘 | E07 | 阈值内移零写、双击/Enter详情、焦点归还 | gantt |
| RA-D10 | MD安全预览/固定摘录局部 | E08 | session无ID/合法ID新建→save→source只读及manual互不串 | report |
| RA-D11 | draft关联历史 | 总登记§5 | draft cancel/save、quick即时加/移/跨项目拒与主save不重复 | task-links |
| RA-D12 | 深色非法ID就近拒局部 | E04 | 全kind合法可辨标题/同项目保存，未知/跨项目拒保输入 | okr |
| RA-J01 | 目标表单/原状态局部，不是整旅程 | E09/E14 | 默认OFF异常卡→同task主save→原卡更新返回/reload；ON同路；cancel分支 | board-task |
| RA-J02 | 会议主save/稳定行ID/局部布局 | E10 | action转task确认→补ms/dlv主save→回会议重复转换不建第二task | meeting-task |
| RA-J03 | 原子domain/filealias与fresh同hash保存局部 | E05/E15/E16 | 两资料+progress+真file完整取消/保留/放弃→fresh一次save/reopen，ID/refs/字节 | materials |
| RA-J04 | rv4追加/软删恢复/固定当前摘录/rv5后仍旧正文 | E08/A11 | 组合缺basic/link、主动选复合refs、再软删源后固定、MD保存/export；历史rv2仅excerpts | report |
| RA-J05 | 真空done反思gap/check、既有反思人final/习惯确认局部 | E20/E21/E22 | done→check→补材料人final→OKR/KR→habit确认→checkin完整串联/失败重试 | growth |
| RA-J06 | 新恢复入口AUTO；两确认/13表/双byte/非空安全快照局部 | E06/E03 | UI实际备份→precheck/cancel→confirm→新宿主全入口/字节回读，错误恢复另F07 | backup |
| RA-B401 | scope静态/部分历史 | 总登记§5 | legacy只读→A保存→B默认保存→Areset→全局重进，settings隔离/file投影不串 | board |
| RA-B402 | 单宽三拖/重进 | E03 | 四宽投影各drag/resize/save→回1440→真实新宿主；合法clamp/不相交/不丢卡 | board |
| RA-B403 | board多sort/filter/公式AUTO历史 | 总登记§5 | 两规则方向/filter实际顺序持久；合法/空/非法公式→修正save | board |
| RA-B404 | 原save/cancel内容 | E03 | 精准cancel保护；受控save失败保draft→恢复retry；scope隔离 | board |
| RA-N01 | 导入busy/retry、file busy、确认guard AUTO | E16/E19/E14 | 原task主save延迟双点与OKR/habit确认fresh；same-frame未采不能代；取消在途AI | concurrency |
| RA-IM01 | 原生CSV/XLSX六GUI、新缺标题列/trace、失败保preview重试 | E17/E15/E19 | 旧trace/纠正动作缺档保；未签same-frame/host后失败边界先映射原合同，不要求I/O exactlyonce | import |

## 3. 材料、文件与汇报

| ID | 已签子范围 | 证据/候选 | 仍需最小动作或证据 | 影响域 |
| --- | --- | --- | --- | --- |
| RA-M01 | AUTO单信封保史；GUI仅E1 append | E05/E08 | 同一次basic+link备注+append主save→重开，E2/E3完整保 | materials |
| RA-M02 | AUTO两类非法混合零写 | E05 | GUI非法basic/合法ops及合法basic/非法ops→保输入→合法一次save | materials |
| RA-M03 | AUTO软删/首次restore/重复error；GUI软删恢复四版 | E05/E08 | 软删时报告候选排除与重复active/unknown错误原件；不重复首次restore | materials |
| RA-M04 | AUTO冻结版本不随源/移除保源 | E05 | 源改名V2后真实冻结显示→既有手动更新最新→断联；入口不明交原owner，不偷换remove/readd | materials |
| RA-M05 | 原真实raw拒/空首次raw/apply保史AUTO | E05 | AUTO-only，最终task/material接缝diff继承；无GUI新门 | materials |
| RA-M06 | 两link别名/坏alias整包拒AUTO | E05 | 新draft选c2→save后refs正确atID、坏alias不半建/取消零写 | materials |
| RA-M07 | AUTO旧新双读/派生/无关basic保键 | E05 | GUI各既有读出口与basic主save保全部键；archive最小不叫全history | materials |
| RA-F01 | stage/dedup/latecleanup AUTO；fresh原生取消/同hash单save/reopen与后续卸载 | E05/E15/E16 | 原生sheet取消未采原动作；file与progress alias组合；旧首次load缺档保不倒签；新候选继承 | file |
| RA-F02 | 真实取消/ConnectionFailed重选save、正确file disabled恢复、自动严格effects14/14 | E16 | host已收字节后迟201 GUI未采；Strict真实DOM已签，不再用renderer重新争论 | file |
| RA-F03 | 白名单/大小/magic/root/祖先/failclosed AUTO，staging安全修后 | E05/A13独立staging | AUTO-only，当前安全接缝继承/专项复验，不新增恶意文件GUI/完整解码需求 | file |
| RA-F04 | 两22byte授权下载/匿名401、安全头/中文名/新asset补证 | E03/E15 | 最终source继承；完整权限/所有类型仅原AUTO范围，旧响应evicted缺档保，不重复已签GET | file |
| RA-F05 | AUTO共享断联/GCdry/apply | E05 | UI断T→另一task真下载→断末不自动删；GC仅既有隔离命令，无GCUI不新增 | file |
| RA-F06 | AUTO13表/字节/新Node；GUI确认/双byte/重进部分 | E05/E06/E03 | 实际UI备份与全13表新宿主重进/download；F5不同包按ids，不混sessions入backup | backup |
| RA-F07 | AUTO损坏/提升/落盘回滚、新完整precheck；GUI三预检拒零写 | E05/E06/E03 | 隔离实际提升/写失败UI保原库→恢复回读；不重hash/missing/path三拒子项 | backup |
| RA-F08 | 旧7表兼容/保extra/历史schema拒新键AUTO | E05 | 实际pilotOFF无关basic写保新键；原发布binary只隔离兼容评估不清键降版 | backup |
| RA-R01 | AUTOcurrent/stale及历史excerpts；GUI当前两候选默认全选固定 | E05/E08 | 主动取消/重选复合refs与软删/跨项目不可选；不要求rv2 selected成功 | report |
| RA-R02 | AUTO互斥/未知rev/B/softdelete/伪正文零写 | E05 | 实际错误保输入→合法preview/save，不拼旧参数造成功 | report |
| RA-R03 | AUTO各改源固定；GUIrv5/作者后原report同byte | E05/E08 | 源再软删→旧详情/preview/export/新进程保持；旧calc键不回填 | report |
| RA-R04 | manual/session/trim/null/source只读AUTO；旧F5来源显示局部 | E05/E03/E21 | 无sessionID拒→合法ID新生成/保存→MD编辑来源不改；bind已签不等报告source生成 | report |
| RA-R05 | AST/MD覆盖AUTO、危险MDpreview局部、项目三档另签 | E05/E08/E21 | 安全MD实际save/reopen/固定MDexport拒覆盖/confirm；cancel稳定GUI；不把项目web/plain作固定报告出口 | report |

## 4. OP 原57 ID与后续6 ID

E07中的原 `case-disposition` 是逐断言指针。未变派生/命令守卫先请原独立专家按最终diff核继承；仅未能继承的接缝重测。以下不把较新复验“本轮未重跑”改为原历史FAIL，不无理由重复深树/环/纯函数测试。

| ID | 已签子范围 | 证据/候选 | 仍需最小动作或证据 | 影响域 |
| --- | --- | --- | --- | --- |
| OP-CK-01 | 三键/旧parse AUTO；修后schema局部 | E07 | 最终schema继承；GUI含新键不能按旧task仅checklist误判 | op-domain |
| OP-CK-02 | 父有子拒清单AUTO | E07原索引 | 最终命令/task写接缝继承或必要复验，非再开GUI门 | op-domain |
| OP-CK-03 | 非空清单leaf拒加子AUTO | E07原索引 | 同上，保清单与树不变量 | op-domain |
| OP-CK-04 | checklist CRUD AUTO | E07原索引 | 最终入口继承；新增UI行不是自动证明原CRUD | op-domain |
| OP-CK-05 | expected true重试幂等AUTO | E07原索引 | 最终toggle接缝继承；真实UI错误/重试未签则原GUI合同另补 | op-domain |
| OP-CK-06 | AUTO保兄弟/status/legacy；真实Space100/50 | E07/E09 | 原4消费点剩报告/重试边界，不重已签第二UUID两次写 | op |
| OP-LEG-01 | legacy40无清单null组件 | E07 | 原合法旧leaf真实GUI旁注/无客观值，与OPGUI02合并 | op |
| OP-LEG-02 | legacy80无manual/null组件 | E07 | 同上，不能statusdone伪造客观100 | op |
| OP-LEG-03 | 50+无清单父=50/1of2 AUTO | E07原索引 | 精确比例GUI标签变体；纯derive继承 | op |
| OP-LEG-04 | 原旧record浏览零写AUTO | E07 | 合法旧包只浏览/退出原manifest，不混queue/export副作用 | op |
| OP-DV-01 | 1..4项25/50/75/100 AUTO | E07原索引 | 最终derive继承，无新增四遍GUI门 | op-domain |
| OP-DV-02 | 全勾todo100/pending组件，真实toggle局部 | E07/E09 | 原待验收可见标签/报告点，与GUI01合并 | op |
| OP-DV-03 | done2of5/客观40 AUTO与实际目标口径 | E07/E22 | 完整软告警/未勾可见原GUI断言；五check往返不用重采 | op |
| OP-DV-04 | done无清单null组件 | E07 | 合法真实GUI证据不足，不把done写100 | op |
| OP-DV-05 | checklist3of5与coverage1of1 AUTO | E07原索引 | 两标签真实可辨；不可拿t12的2of5代3of5完整变体 | op |
| OP-DV-06 | 缺键/空数组null vs非空零勾0组件 | E07 | 真实标签可读/不造值，与矩阵合并 | op |
| OP-DV-07 | 只status更新不改比率AUTO | E07原索引 | 最终写语义继承，合法status动作顺带GUI | op-domain |
| OP-RU-01 | 原分数最终63等权AUTO/父组件63 | E07/E09 | 未变derive继承；人工不掺父/项目报告，见RAOP01 | op |
| OP-RU-02 | 覆盖1of3/只清单leaf AUTO | E07原索引 | 原比例GUI实际label，不用原F2的2of3替代全部 | op |
| OP-RU-03 | 部分覆盖命名组件/父63显示局部 | E07/E09 | 原1of3文案真实task/board对齐，非整体完成率 | op |
| OP-RU-04 | 0/100→50/2of2 AUTO | E07原索引 | 纯derive继承，原GUI标签按其合同映射 | op-domain |
| OP-RU-05 | 全legacy无清单null AUTO | E07原索引 | 纯derive继承，真实证据不足与oldbrowse合并 | op-domain |
| OP-RU-06 | 多层仅leaf/阶梯深树AUTO | E07 | 最终算法diff继承，不以一次耗时证明O(n) | op-domain |
| OP-RU-07 | 合法move/delete重算AUTO | E07原索引 | 最终move/delete语义继承；wrapped迁父另RAOP03 | op-domain |
| OP-EX-01 | 100/1000/10000深树计数AUTO | E07原索引 | 未变算法继承，无须再造GUI深树 | op-domain |
| OP-EX-02 | 纯函数环防御AUTO | E07原索引 | 最终diff继承，不将坏库导入生产 | op-domain |
| OP-EX-03 | 缺ID/悬空parent防御AUTO | E07原索引 | 同上，不新增GUI缺ID种子 | op-domain |
| OP-EX-04 | 跨项目parent防御/真实拒AUTO | E07原索引 | 同上，合法通道不能跨项目写 | op-domain |
| OP-EX-05 | 两pending+环warnings AUTO | E07原索引 | 同上，不重复执行同纯函数反例 | op-domain |
| OP-EV-01 | null vs0组件可辨AUTO | E07 | 真实GUI标签与DV06合并 | op |
| OP-EV-02 | derive零写/新report仅新增 | E07/E09 | 原报告其他变体/最终只读继承；报告保存本来合法写 | op |
| OP-EV-03 | doctor告done未全勾不自修AUTO | E07原索引 | 最终doctor/读语义继承，不要求再开GUI | op-domain |
| OP-SRC-01 | 原FAIL修后四组件同真源 | E07 | 最终panel/tasks/overview/gantt/report调用链继承与实际跨页 | op |
| OP-SRC-02 | 新calc1/无覆盖null、旧0 AUTO；实际report66 | E07/E09 | null/旧0及66值真实入镜，不能DOM存在代完整可读 | op |
| OP-SRC-03 | 不同版/null delta与同版差值AUTO | E07原索引 | 最终report差异接缝继承；非强制新增所有GUI变体 | op-domain |
| OP-SRC-04 | 历史snapshot不回填AUTO | E07/E08 | 最终源改后旧report字节/出口剩件，与R03合并 | op |
| OP-SRC-05 | 原FAIL修后40/null/manual70/0组件；实际30/0/50/100局部 | E07/E09 | 精确40/null/70真实甘特mode标签；日期仅合法写，不用30替70全部 | op |
| OP-SRC-06 | 三消费点真实值/原组件同源 | E07/E09 | reports人工30/0与全fixture即时/coverage/pending标签，见GUI01 | op |
| OP-Q-01 | 真enqueue写链SOURCE/AUTO | E07原索引 | 最终commands/checklist/task写语义继承 | op-domain |
| OP-Q-02 | 目标态重试AUTO | E07原索引 | 最终toggle接口继承，不新增多人rev/actor协议 | op-domain |
| OP-Q-03 | 分歧并发串行AUTO | E07原索引 | 最终queue写链继承；仅接缝变动重测，不冒same请求重放 | op-domain |
| OP-Q-04 | 真实JSON publish EIO零半写AUTO | E07原索引 | 最终task/material事务受影响才复验；不混预host失败GUI | op-domain |
| OP-BD-01 | 新Node领域读回AUTO | E07 | 真dsh精确PID换进程后清单/派生回读，与F06合并；历史stop缺档保 | op-runtime |
| OP-BD-02 | JSON支持通道往返AUTO | E07 | 最终备份接缝继承；MD有损不是全量库恢复入口 | op-domain |
| OP-BD-03 | 新备份/旧格式兼容AUTO | E07/E05 | 当前backup差异继承/必要兼容复验，format允许有效新版本 | backup |
| OP-BD-04 | 合法旧库doctor不迁移AUTO | E07原索引 | 最终doctor/读schema继承；不以新包browse代全部旧包 | op-domain |
| OP-BD-05 | 部分旧保护与新95限定五缺根 | E01/E03/E18 | 最终实际允许保护根hash/mtime/目录；不声称全机或读正式凭据 | isolation |
| OP-BD-06 | A18interface原95/构建/453有限继承 | E18 | 最终有A19/A20/U4差异另唯一build/全部适用verify与原exit、client无server require | build |
| OP-GUI-01 | 第二UUID Space100/50跨三页/取消不撤即时写 | E09/E22 | 报告点/其余mode/失败重试未签，合并OP余旅程，不重两Space | op |
| OP-GUI-02 | 旧读schema/领域零写AUTO | E07 | 合法v0.7.4旧包真实只browse/关闭零写与legacy旁注 | op |
| OP-GUI-03 | generic390历史局部不等F2全门 | E04 | 真390 F2清单/pending/null标签/可达性，同格矩阵精确复用 | op |
| OP-DEFER-01 | 已被ADL055部分替代，人工双轨AUTO/局部GUI | E07/E09 | RAOP01/02余件；不是N/A，不准污染objective | op |
| OP-DEFER-02 | 工时3.5/拒负数AUTO，权重仍后置 | E07 | RAOP04实际表单/出口；不新增effort权重 | op |
| OP-DEFER-03 | 协议原FAIL修后AUTO；Git自动裁决仍后置 | E07 | RAOP04实际非法输入保输入与合法显示；不新增Git同步 | op |
| OP-DEFER-04 | item不加doneAt，task completedDate AUTO | E07 | RAOP05原只读/日期revert GUI；不造字段或补旧值 | op |
| OP-DEFER-05 | N/A多人实时合并 | 原objective§2 | 无本批实施/采证，不写PASS | out-of-scope |
| OP-DEFER-06 | N/A war-room热修独立范围 | 原objective§2 | 无本批新增热修，基础状态回归归B8 | out-of-scope |
| RA-OP01 | 人工30/0主save、objective50/父63保持 | E07/E09 | 报告consumer/真实完整徽标，父/项目客观66不掺manual | op |
| RA-OP02 | 有清单0→clear→save/null/50 | E07/E09 | 无清单40→clear/null、cancel-clear零写；不重有清单clear | op |
| RA-OP03 | wrapped聚合/改todo AUTO；当前静态上下2of10一致 | E07/E09/E21 | 真迁父→改todo→各consumer/queue/stats/check/people/board，清单本身保 | op |
| RA-OP04 | 3.5/http(s)及负/协议拒AUTO修后 | E07 | GUI保存/重进/export、非法保输入零写，不能effort作权重 | op |
| RA-OP05 | 当天/显式值/revert AUTO；t8done当天局部 | E07/E22 | 原L1 done→只读completedDate→合法纠正→revert清除/reopen | op |
| RA-OP06 | 原分数最终一次round50 AUTO | E07原索引 | 最终derive/report文件diff继承，无新GUI要求 | op-domain |

## 5. 治理与 P0-P3

E12 的32 ID有限AUTO均保留，最终影响由源/写接缝决定；不是所有32都需要重新跑。原AI01..03来源GUI已完整限定关闭，不再重派；其所属A12字节不能代新Main全GUI。

| ID | 已签子范围 | 证据/候选 | 仍需最小动作或证据 | 影响域 |
| --- | --- | --- | --- | --- |
| RA-AI01 | 原合同来源GUI PASS，十来源/同名ID正确返回重进 | E12/E13/A12 | 最终导航/panel差异继承；无原来源功能性剩件，不重十跳 | provenance |
| RA-AI02 | changed/needsregen/history与三mode共台账GUI PASS | E12/E13/A12 | 最终消费接缝继承，不新增四种生成/四面板或毫秒时间门 | provenance |
| RA-AI03 | missing/两重校/原history/新进程GUI PASS | E12/E13/A12 | 同上；历史TERM原输出缺档仅设施，不重删来源/重启 | provenance |
| RA-AI04 | GGclean/mixed AUTO修后；PC-G01..04与freshundo有限GUI | E12/E14/E15 | 再生成实际base/原剩changed/mixed ledger及生命周期/故障GUI按合同映射；cancel/edit已签不重 | copilot |
| RA-AI05 | 四create refs/白名单AUTO；四update clean/conflict/freshundo GUI | E12/E14 | 四类create实际GUI、delete/跨项目/未知字段/wrapped/资料数组拒，applied-only refs | copilot |
| RA-AI06 | 各adapter故障/abort/恢复AUTO | E12 | 既有真实故障/取消/120s范围GUI与一次真实模型非空来源/重校；本人条件见主报告§6 | model |
| RA-P0001 | 真描述/材料/多rev/软删投影AUTO | E12 | 有/无材料ask可见context/投影→cancel，草稿零业务写 | copilot |
| RA-P0002 | 窄集/旧标量/branch单独合法/非法拒AUTO | E12 | 合法窄集明确确认+非法URL/长值/unknown/wrapped原GUI，保普通字段 | copilot |
| RA-P0003 | capture草稿/确认/真实新task来源AUTO | E12 | 真composer草稿cancel→再生成captureapply→任务/来源/reentry，原撤销说明 | capture |
| RA-P0004 | https/evidence来源/非法protocol+TaskForm回读有限 | E12/E21 | capture模型候选另一支路；attach已签不重 | evidence |
| RA-P0005 | 两bind/note合并/list/notes/B隔离/新host回读 | E12/E21 | 无本有限同对余动作；最终session接缝继承，sessions非F5恢复表 | session |
| RA-P0006 | metric逐账/空0null/只读AUTO | E12 | applied/rejected/undo/kind真实账本→metric对应原命令/回读，不编GUI统计页 | metric |
| RA-P0007 | 新真空done/gap/反思幂等；既有draft edit/人final与新host回读 | E12/E21/E22 | A20文件计数FAIL修后；已有呈现通道读新材料/原完整空分支、失败hook仅继承AUTO；不重t8造空 | reflection |
| RA-P0008 | 五规则准确命令+卡+各ID打开/cancel有限PASS | E12/E22 | task单项入口、叙事非材料/wrapped剩件先映射；**不重25步**，阈值/失败矩阵不新增本切片前置 | check |
| RA-P1001 | GGabsence AUTO修后、list/open/queuecard/rest排序GUI局部 | E12/E21 | absence-only/缺席历史/正常跟进→刷新目标；不重普通queue添加 | queue |
| RA-P1002 | mute/rest/unmute关键豁免GUI；TTL AUTO | E12/E21 | 合法过去mute标准恢复后的到期派生实际呈现；不改墙钟 | queue |
| RA-P1003 | 当前08..09 quiet/top空rest/off GUI | E12/E21 | 最终queue/settings接缝继承；跨午夜AUTO已签不要求再等待午夜GUI | queue |
| RA-P1004 | 正常改后snapshot/零模型调用AUTO | E12 | 旧ask投影→刷新→真实最新值/时间→开目标/回旧卡，不能OP四页代 | projection |
| RA-P1005 | achieved/accepted/L2幂等与非法关联AUTO | E12 | 两正常表单事件→反思/source→repeat→人edit/final，合法关联 | reflection |
| RA-P1006 | 合法D-31/D-8负载/烂尾/阈值AUTO | E12 | people同MAX/未分配/建议/烂尾筛选→目标返回；不造WIP/倦怠评分 | people |
| RA-P2001 | 三档相对export/拒覆盖/confirm/本地静态不跟随 | E12/E21 | 恶意内容原安全GUI/内容覆盖矩阵；绝对web未done保BLOCKED不算成功 | export |
| RA-P2002 | 31/29d/audit归档AUTO；本次前缀只增GUI/命令 | E12/E21 | 合法历史包标准恢复→export→31archive/29active与task出站位重开 | export |
| RA-P2003 | OKR建议不建档/confirmdraft/ignore/repeat/clear隔离AUTO | E12 | 两建议实际inbox→confirm/ignore/repeat→人clear processed保pending→reentry | okr |
| RA-P2004 | 单主父/软联/人confirmed/非法拒AUTO | E12 | 真KRprimaryA+relatedB树/切关联/人确认；非法自指/B/missing保输入，D12全kind另映 | okr |
| RA-P2005 | 人wrapped stats/queue/check/reflect命令有限、AI拒AUTO | E12/E21 | people/board/objective真实消费者、清单保留、AI拒wrapped GUI；不要静态环图扩全口径 | wrapped |
| RA-P2006 | wrapped来源lesson/三marks/人final/重复/新host回读 | E12/E21 | 最终lesson/export接缝继承；旧literal反斜杠n一行保历史，不假称三行edit | lesson |
| RA-P2007 | archive最小包/review周期/不写K18 audit AUTO | E12 | 真命令JSON/MD→既有素材/文件入口/重进，wrapped非done；不新建一页 | archive |
| RA-P3001 | pending不建habit/confirmdraft/ignore/repeat/reentry守卫GUI | E12/E20 | **A19自身OKR展示FAIL在修**，只原开发/独立复验与局部新GUI；不重守卫全旅程 | habit |
| RA-P3002 | D/D-1/D-2/重复今日正例与D+1/D-3拒零写 | E16/E20 | 负例错误文字视觉未签；优先核现有呈现，不把hero空截图当错误可见 | habit |
| RA-P3003 | F7多月/十四日边界/月展开390局部与D+3 derive AUTO | E12/E04 | 同origin绑定/收起刷新重进/原history bytes；不是E15新空三天替旧长史 | habit |
| RA-P3004 | 编辑保史、人final/repeat、B拒、解绑后正常原OKR主save/reopen | E12/E16/E20 | 另一同项目目标/missing/失败保输入与按OKR只读聚合现有通道；无GUI入口先原owner澄清，不造FAIL | habit |
| RA-P3005 | cycleHook enabledfalse/无scheduler调用AUTO | E12 | 当前snapshot/cycleDue占位诚实呈现原件；不要求实现H6后台 | habit |

## 6. B8 抽屉42条

原真实入口 `layer-map.json` 尚无完整独立运行映射签署，本层保持 **BLOCKED（映射/完整步骤）**，不是42个功能FAIL。下列局部来源只支持写明切片。每行未签动作均沿原layer-map §1/§2的键盘、显式主save或cancel、实际合法生产校验失败保输入要求；没有远端失败路径不捏造错误态。

| ID | 已签子范围 | 证据/候选 | 仍需最小动作或证据 | 影响域 |
| --- | --- | --- | --- | --- |
| RA-DR-01 | 选择/取消局部非390整态 | E14 | 390真实AI入口→键盘选择→cancel，入口/disabled理由 | ai-layer |
| RA-DR-02 | 真实深色副驾局部 | E14 | 深色能力入口/键盘选→cancel精确条目映射 | ai-layer |
| RA-DR-03 | 未见完整条目签署 | 原layer§2 | 浅色真实能力选/理由→cancel | ai-layer |
| RA-DR-04 | 公式守卫AUTO历史 | 总登记§5 | 非法白名单公式→save失败→修正成功，不半写 | board-layer |
| RA-DR-05 | 交付物domain历史 | 总登记§5 | 新dlv合法ms/note save/reopen、fresh cancel | deliverable-layer |
| RA-DR-06 | 四扩展正常dlv说明主save局部 | E14 | 深色note/清milestone主save重开/长内容 | deliverable-layer |
| RA-DR-07 | dlv说明/历史保留局部 | E14 | 全预填→note cancel/save fresh、原历史保 | deliverable-layer |
| RA-DR-08 | 空会议加行动行主save局部 | E10 | 决策/行动项完整新建→save/reopen、取消不写 | meeting-layer |
| RA-DR-09 | 深色行动行/摘要主save局部 | E10/E14 | 状态/合法issue及task关联→主save，长菜单 | meeting-layer |
| RA-DR-10 | 稳定行动ID/新行cancel/关联主save局部 | E10 | 决策与完整合法行动关联组合save/reopen | meeting-layer |
| RA-DR-11 | ms说明正常主save局部 | E14 | 真实合法到期/四态save/reopen、非法日期不半写 | milestone-layer |
| RA-DR-12 | 当前两refs默认全选preview/save | E08 | 主动复合refs选择、period校验/preview零写 | report-layer |
| RA-DR-13 | 深色危险MDpreview/canceldata | E08 | 深色MD实际save/reopen，固定来源只读 | report-layer |
| RA-DR-14 | 固定rv4→源rv5不随变 | E08 | 浅色edit/safeMD主save，source/period不改 | report-layer |
| RA-DR-15 | risk response正常保存局部 | E14 | probability/impact/owner全预填→save | risk-layer |
| RA-DR-16 | risk domain历史 | 总登记§5 | 深色新risk合法枚举→save；非法日期保输入 | risk-layer |
| RA-DR-17 | 深色habit编辑保史/重关联主save | E16/E20 | 该条title编辑/目标关联及键盘映射，不改长史 | habit-layer |
| RA-DR-18 | habit cancel/编辑局部深色非浅整态 | E16/E20 | 浅色edit→cancel/save，对照历史 | habit-layer |
| RA-DR-19 | suggest两pending→confirm/ignore/reentry | E20 | A19新自身目标行真实可见，余键盘/映射；不重guard | habit-layer |
| RA-DR-20 | add/update关系AUTO | E12 | 手工新habit合法title/OKR→save，跨项目拒保输入 | habit-layer |
| RA-DR-21 | DAG守卫历史 | 总登记§5 | 390真实依赖tree搜索多选cancel/save，无焦点陷阱 | task-layer |
| RA-DR-22 | 390任务工具条局部不等长抽屉 | E03 | 390 FL长task滚到底主save/cancel，外壳边界 | task-layer |
| RA-DR-23 | OKR关系AUTO | E12 | 深色KR主归属/软联save，非法同项目守卫 | okr-layer |
| RA-DR-24 | OKR关系AUTO | E12 | 浅色KR编辑save/cancel零写 | okr-layer |
| RA-DR-25 | 建议guard AUTO | E12 | OKR两建议真实confirm/ignore/reentry、draft不自动confirmed | okr-layer |
| RA-DR-26 | KR primary AUTO | E12 | 新KR选同项目primary/save，missing/B拒 | okr-layer |
| RA-DR-27 | objective add真实命令局部 | E20 | 新objective手工title/owner save、cancel零写 | okr-layer |
| RA-DR-28 | 多个真实新项目局部 | E15 | 精确入口键盘/空白拒/取消及重开，字段回读 | project-layer |
| RA-DR-29 | project历史CRUD | 总登记§5 | 预填description改/save，stable projectId | project-layer |
| RA-DR-30 | owner补全历史 | 总登记§5 | 实际候选键盘选择save/reopen，不锁候选数 | project-layer |
| RA-DR-31 | project状态历史 | 总登记§5 | 当前schema状态select→save/reopen | project-layer |
| RA-DR-32 | settings路径AUTO局部 | E01 | 深色合法口径save→新进程回读，隔离根 | settings-layer |
| RA-DR-33 | settings AUTO局部 | E01 | 默认口径可见/cancel/合法save，不迁移 | settings-layer |
| RA-DR-34 | 深色task追加rev与basic局部 | E08/E19 | 完整basic+ops组合主save/reopen/人工客观分区 | task-layer |
| RA-DR-35 | 多rev/preview长内容局部 | E08 | FL basic/清单/材料/进展/依赖滚过全部区save/cancel | task-layer |
| RA-DR-36 | 任务↔ms历史PASS | 总登记§5 | 现候选选择/清ms主save、反向一致 | task-layer |
| RA-DR-37 | freshfile新task单save、取消局部 | E15 | basic+material+progress组合new save/cancel，关联J03 | task-layer |
| RA-DR-38 | 深色freshfile局部 | E15/E16 | 深色新task组合+校验错误可读，稳定默认样式 | task-layer |
| RA-DR-39 | 人工assignee主save真实局部 | E14 | 候选键盘选/清owner主save，真实未分配 | task-layer |
| RA-DR-40 | DAG AUTO历史 | 总登记§5 | predecessor搜索/勾/cancel/save，自指/环/B拒 | task-layer |
| RA-DR-41 | priority真实命令/表单预填局部 | E22 | P0/P1/P2实际键盘选择主save重开/标签 | task-layer |
| RA-DR-42 | done/ref与wrapped命令、进度口径局部 | E21/E22 | 五态菜单选择人主save、wrapped/AI拒原口径 | task-layer |

## 7. B8 菜单39条

| ID | 已签子范围 | 证据/候选 | 仍需最小动作或证据 | 影响域 |
| --- | --- | --- | --- | --- |
| RA-MENU-01 | board配置历史 | 总登记§5 | 三density真实菜单cancel/save持久与键盘/ESC | board-layer |
| RA-MENU-02 | sort AUTO历史 | 总登记§5 | 真实升降save/reentry，同数据顺序 | board-layer |
| RA-MENU-03 | 指标派生历史 | 总登记§5 | percent/integer格式save，不改源 | board-layer |
| RA-MENU-04 | priority/milestone sort AUTO PASS | 总登记§5 | 当前合法field菜单主save，原误判不重开 | board-layer |
| RA-MENU-05 | save history前缀局部 | E03 | 打开≤5历史→preview/cancel零写→恢复主save/reentry | board-layer |
| RA-MENU-06 | scope历史静态 | 总登记§5 | A/B/个人/内置切scope save/reset，legacy不改 | board-layer |
| RA-MENU-07 | 甘特历史 | 总登记§5 | 日周月menu→刻度/焦点，不写日期 | gantt-layer |
| RA-MENU-08 | risk/issue历史 | 总登记§5 | kind tab计数/开行/返回，真实scope | risk-layer |
| RA-MENU-09 | issue正关联未采 | E10明确未采 | F3同项目真正issue选→主save；B不偷写 | meeting-layer |
| RA-MENU-10 | 行稳定ID主save局部 | E10 | 四态action菜单主save/reentry，状态语义 | meeting-layer |
| RA-MENU-11 | ai001→t1→null局部 | E10 | 同project搜索task→选→主save，完整keyboard/菜单 | meeting-layer |
| RA-MENU-12 | 深色task关联局部 | E10 | 深色menu候选/焦点归还，不拿nativezoom菜单代 | meeting-layer |
| RA-MENU-13 | dlv已有ms显示局部 | E03 | 选/清ms主save且note保 | deliverable-layer |
| RA-MENU-14 | dlvowner历史 | 总登记§5 | 实际owner选/清save/reentry | deliverable-layer |
| RA-MENU-15 | 五态domain/wrapped规则 | E12 | 当前五态菜单人主save，不按原图4项排wrapped | deliverable-layer |
| RA-MENU-16 | 任务快照export历史 | 总登记§5 | 当前筛选/有序范围真实文件，联U4，不写task | task-layer |
| RA-MENU-17 | manual会议状态历史 | 总登记§5 | draft/final实际menu主save，final仅人 | meeting-layer |
| RA-MENU-18 | 命名视图旧合同 | 原journey§6 | 内置/自定义/default切→reentry，联U401/402 | task-view |
| RA-MENU-19 | 原提醒导航历史 | 总登记§5 | 实际胶囊开target→返回，不后台通知/status写 | reminder |
| RA-MENU-20 | report状态schema AUTO | E05 | 当前合法状态menu主save/reopen且snapshot固定 | report-layer |
| RA-MENU-21 | A/B任务命令隔离局部 | E20 | 键盘switcher→列表/关联候选同步不串 | navigation |
| RA-MENU-22 | 多次更多→预检真实路径 | E03/E15 | 顶栏更多所有真实项映射/返回，危险动作仅cancel | navigation |
| RA-MENU-23 | milestone四态/reflect AUTO | E12 | 真实四态select→主save，achievedDate/reflection按合同 | milestone-layer |
| RA-MENU-24 | 390precheck/更多局部 | E03 | 390更多menu滚/Tab/ESC，实际浮层不裁，焦点还 | navigation |
| RA-MENU-25 | 风险impact AUTO历史 | 总登记§5 | 实际impact选/save/reentry | risk-layer |
| RA-MENU-26 | 风险owner AUTO历史 | 总登记§5 | 真实owner选/清→save/reentry | risk-layer |
| RA-MENU-27 | probability AUTO历史 | 总登记§5 | 真实prob选/save→矩阵反映 | risk-layer |
| RA-MENU-28 | closed不入矩阵AUTO历史 | 总登记§5 | 状态菜单save→closed退出矩阵实际呈现 | risk-layer |
| RA-MENU-29 | risk/issue type合同历史 | 总登记§5 | 当前create/update允许则选/save，否则只读说明，不能凭原图强造可改 | risk-layer |
| RA-MENU-30 | A16diagnosis消息/投影局部 | E14 | 真实只读诊断/相关task投影→exit零业务写 | ai-layer |
| RA-MENU-31 | selection编辑/cancel深宽局部非390 | E14 | 390计划勾/编辑/cancel与焦点折行，原AI04合同 | ai-layer |
| RA-MENU-32 | 深色PC确认/逐条反馈局部 | E14 | 拒行/软风险原反馈、草稿真实dispatch/refs，标记error另E19余件 | ai-layer |
| RA-MENU-33 | 未见浅态完整签署 | 原layer§3 | 浅色同原真实plan/明确确认→逐条结果，不用illustrative | ai-layer |
| RA-MENU-34 | delete保护domain历史 | 总登记§5 | 多选危险确认cancel零写/合法confirm，联D06，不新增全delete可undo | task-delete |
| RA-MENU-35 | 改父/checklist互斥AUTO | E07 | 实际合法newparent主save/非法自指清单父拒，tree不破 | task-layer |
| RA-MENU-36 | 命名视图旧四态 | 原journey§6 | query/chip/group/sort命名/default保存重进/cancel，联U4 | task-view |
| RA-MENU-37 | 原生import/export局部 | E17/E19 | 实际share/export只读文件、全menu keyboard/映射；旧trace保 | task-layer |
| RA-MENU-38 | board多sort不是task多sort | 原U4裁决 | task旧四sort兼容+U4两规则方向保存/reentry | task-view |
| RA-MENU-39 | growth页更多部分导航 | E20/E21 | growth上下文真实顶栏更多各实际项返回，不能MENU22替此上下文 | navigation |

## 8. 16 卡、矩阵、工具与工程

卡type存在/三拖六卡不等16卡逐条动作完成。每个W ID沿原journey §6.2：F1加/配置→拖缩→save/restart→删/undo→cancel，内容值按同fixture权威派生；以下只指出特异余动作，公共序列仍需映射原证。没有逐卡独立全步骤签署，均为NOT_RUN或局部证据待映射，不列16个FAIL。

| ID | 已签子范围 | 证据/候选 | 仍需最小动作或证据 | 影响域 |
| --- | --- | --- | --- | --- |
| RA-W-completionHero | 状态/客观计数局部 | E09 | 原卡公共序列/coverage文案与人工不混 | board-card |
| RA-W-completionTrend | 历史派生 | 总登记§5 | 原公共序列/无历史真实empty，不编趋势 | board-card |
| RA-W-divider | type历史 | 原journey§6 | 公共序列/无伪统计/分隔不挤 | board-card |
| RA-W-formulaCard | 白名单AUTO历史 | 总登记§5 | 公共序列/合法空/非法→修正，不eval/静默0 | board-card |
| RA-W-kpiMetric | KPI格式历史 | 总登记§5 | 公共序列/合法指标同fixture与格式 | board-card |
| RA-W-milestoneDeliverable | 关联显示局部 | E03 | 公共序列/真实ms/dlv值及可达 | board-card |
| RA-W-objectiveProgress | objective父/项目局部 | E09 | 公共序列/partialcoverage/objective与display分轨 | board-card |
| RA-W-overdueSoon | 部分到期/queue显示 | E21/E22 | 公共序列/异常卡→TaskForm→回原卡值刷新 | board-card |
| RA-W-peopleLoad | 负载AUTO历史 | E12 | 公共序列/MAX/未分配/实际目标跳转 | board-card |
| RA-W-projectScale | 规模历史 | 总登记§5 | 公共序列/项目scope实际计数 | board-card |
| RA-W-queueCard | 添加queue/rest/mute/quiet局部GUI | E21 | 公共序列/TTL/absence-only余件，已签添加不重复 | board-card |
| RA-W-recordList | multiSort/filter AUTO历史 | 总登记§5 | 公共序列/两规则方向/filter、真实有序行集合 | board-card |
| RA-W-riskMatrix | 风险domain历史 | 总登记§5 | 公共序列/closed排除/320填充另AT01 | board-card |
| RA-W-statusRing | done/wrapped计数局部 | E09/E21 | 公共序列/权威状态分母，非客观coverage | board-card |
| RA-W-textNote | Markdown安全历史 | E05 | 公共序列/合法长MD与协议安全 | board-card |
| RA-W-weeklyPlan | type/日期派生历史 | 总登记§5 | 公共序列/空周诚实empty/计划真实日期 | board-card |
| RA-AT01 | 无当前320填充独立签署 | 原journey§6.2 | 真320浅深填充risk格→列表/返回/Tab，轴数可读/closed排除 | accessibility |
| RA-AT02 | ARIA/键盘AUTO仅辅助 | 原journey§6.2 | 真VoiceOver任务/AI确认/危险确认/OKRlistbox label/role/state/错误/模式音频与焦点 | accessibility |
| RA-U401 | 原SOURCE FAIL；A13先行合法控制2/32红 | 总登记§6/A13先行 | 当前缺陷门后原分工两规则priority升/due降→named/default save→reload/新host/B/A/旧tree兼容 | task-view |
| RA-U402 | 原SOURCE FAIL；A13先行控制/红 | 总登记§6/A13先行 | 隐藏已有可选列→save/reload→恢复→切项目，保query/chip/group/sort/code/title | task-view |
| RA-GAP-U4 | 已承诺未实现裁决，不是运行崩溃 | 总登记§6 | U401/402有限合同实施/独立门，非自由列/公式/团队同步 | task-view |
| RA-CI01 | 原run39557586592/core绿 | E24/9b1a8c5 | 原日志可直接复用；dirty候选不能声称远端已验，不为此提前push/dispatch | ci |
| RA-CI02 | 无harness时明确SKIP原记录 | E24 | 有宿主/Chrome条件现有e2e真实执行；无条件保SKIP/NOT_RUN不叫PASS | ci |
| RA-TOOL01 | 两次有界EGO无返回/切稳定工具 | E24 | 原能力/失败事实归档，不重装/改系统或为试点停产品 | tools |
| RA-TOOL02 | 同条件效率未完 | E24 | 可用时同机同候选同冷热边界记录冷1热2；对照不可用BLOCKED观察，不挡主线 | tools |
| RA-TOOL03 | O3/O5旧18AUTO，仅TaskForm相关 | 总登记§5 | 真实业务拒save保draft→retry；FS旧snapshot拒读→stale标注只读→retry消失/新值 | feedback |
| RA-TOOL04 | TaskForm dirty AUTO/多次cancel局部 | E15/E16 | clean/description-only/多选顺序dirty的ESC/scrim/X/cancel各fresh、保留/放弃焦点、save后不二弹 | task-layer |

### 页面矩阵的每个精确 ID

普通台账不伪造1184行手写状态。`-index-r2.json` 逐项展开原grammar，**每格均带id、原合同指针、fixture/状态动作、已签局部来源、仍需、影响域**；初版 `-index.json` 保留文档核对记录，不是旧产品执行：

- `RA-V-<route>-<1440|1024|768|390>-<light|dark>-<100|200>-<empty|typical|dense|long|loading|error>`，12 routes共1152格。
- tasks额外 `stale/noresult` 同四宽浅深100/200，共32格。
- 原route为 `dash/overview/tasks/gantt/milestones/risk-issues/people/meetings/reports/deliverables/okrs/habits`。width为原生缩放前目标CSS宽、height900；200%后真实inner与宿主/PM容器单列，不拉大窗口抵消缩放。
- **无完整精确格独立PASS自动映射**。E10会议局部8档、E11箭头4档、E09人工/清单、E19深色1440×718错误、A8后续原生200%属于各自限定时点/控件；不能据同width/theme将六态全页批量标PASS。
- 原矩阵映射缺证维持BLOCKED，未执行格保NOT_RUN；读取参考样例不洗旧BLOCKED。Main先把已采原步骤映到具体格与时间段交原专家核，够覆盖者不重采，只补格内缺的主要动作/恢复/键盘/目视。

## 9. 已落的反馈/确认局部合同

此处只索引现有独立子合同，不重跑它们或把AUTO绿借给GUI。其余报告的断言编号以原reporter为细索引，不新增为独立产品功能分母。

| ID | 已签子范围 | 证据/候选 | 仍需最小动作或证据 | 影响域 |
| --- | --- | --- | --- | --- |
| BF-S01 | A8 SOURCE/真实组件有限PASS | a8-feedback-precheck-independent-retest-20261021.md | 最终BoardBento/error优先源码继承 | board-feedback |
| BF-C01 | 保存/刷新在途与成功组件AUTO | 同上 | AUTO继承，真实保存G01已签不重复 | board-feedback |
| BF-C02 | save/refresh reject/false/缺callback AUTO | 同上 | GUI相应G02，不借组件作真实失败 | board-feedback |
| BF-C03 | reset武装/确认成功AUTO | 同上 | GUI G03实际二次确认 | board-feedback |
| BF-C04 | reset失败与成功→失败AUTO | 同上 | GUI G03失败不残留旧success | board-feedback |
| BF-C05 | queue添加/busy保布局AUTO；实际添加局部 | 同上/E21 | GUI G03余失败/refresh，原成功不重 | board-feedback |
| BF-C06 | queue失败/恢复按钮AUTO | 同上 | GUI G03真实边界，不自造业务成功 | board-feedback |
| BF-C07 | 动态import失败/优先级组件AUTO | 同上 | GUI G04真实chunk失败与banner并存 | board-feedback |
| BF-C08 | close/retry/清旧反馈AUTO | 同上 | GUI G04关闭/重试，标记catch另原context合同 | board-feedback |
| BF-C09 | project/user scope清理AUTO | 同上 | 最终scope相关diff继承，主B401实际scope另采 | board-feedback |
| BF-G01 | 真实save成功绿色/完整layout重进 | E03/A8 | 精准cancel保护与最终继承，不重三拖/save已签支 | board-feedback |
| BF-G02 | 未见完整真实失败签署 | 原BF合同§5 | save命令失败、已存后refresh失败→诚实error/保draft→retry/close | board-feedback |
| BF-G03 | queue实际成功局部 | E21 | reset二确认成功/失败、queue refresh失败/retry，scope实际 | board-feedback |
| BF-G04 | 源AUTO不是GUI | 原BF合同§5 | actual chunk失败/close/retry/error优先/长文本浅深；不可达具体BLOCKED | board-feedback |
| BF-G05 | A8 client+editor完整下发 | E03 | 最终候选/实例/flags/实际editor与允许保护根，旧PID缺档保 | build |
| PC-G01 | 原base整批冲突拒s1/s2、独立s3应用 | E14/A16 | 最终sidecar/panel差异继承，不重原task冲突 | copilot |
| PC-G02 | clean三步同目标链式成功 | E14/A16 | 同上，freshundo原byte已签；其他生命周期另原AI04 | copilot |
| PC-G03 | 逐步s1应用0/s2不发/s3继续 | E14/A16 | 同上，kindsuccess不能冒前置已应用 | copilot |
| PC-G04 | Space取消s1/edit55/minexpand/cancel与再生成cancel | E14/A16 | 再生成后的实际执行base/raw生成身份；不能cancel替执行发包 | copilot |
| TF-X08 | 原catch marker错误卡AUTO/context adapter20/新16 | E18/A18 | 真GUI标记reason/常驻全文/复制/无动作，原TTL无contextFAIL保 | feedback |
| GNHD-01 | 结构/长全文AUTO修后 | E07 | 修后两合法code实际成功/denied完整可读、手动取值/布局；旧visualFAIL仍开 | tasks |
| A18-GM-01 | 原实际GUI FAIL/13组件必要红 | E20/E23 | A19原唯一开发→独立复验→新局部GUI，不派第二developer | habit |
| A18-IM-01 | 原file-only材料行FAIL/4纯函数红 | E21/E23 | A19闭后按A20原计划修filecount/不回算旧draft，独立及新声明原证 | reflection |

## 10. 释放

本台账只是审签范围的引用与余项清单，不给整个ID或目标新增PASS。机器校验检查原合同每个普通ID没有漏行、矩阵精确展开和本前缀链接/字段，不执行产品。A19/A20与五类check原角色保持原分工，不启动、不抢锁、不改报告。

本角色无GUI/builder/服务/产品写资源，无后台会话；文档交回后释放。Main继续已有任务直至真正全部适用门闭合并统一普通提交；本报告不执行或授权push/发布。

# 完整旅程、B8与工程采证单

> 从属 [总登记](remaining-acceptance-register-20261021.md)。全部新增ID初始NOT_RUN；Main采原证、专家判定。表内F0..F7/FL/FD/FE/FB/FS引用总登记fixture，动作顺序不可临场改预期。每个ID都交候选、初末库、录屏时间段、页面状态、console、提交载荷的脱敏结构及真实存储diff。

## 1. 13类补余与即时关联

batchA原8项与新增BA用例不删；下表补原8项以外分支。D04/D08只继承R4窄浅具体子项待接缝diff；当前布局/表单改动时重采RA-J01/02，不重开历史误判。

| ID / 对应 / 门 | Fixture / 初态 | Main按序动作与提交点 | 预期 / 原证 |
| --- | --- | --- | --- |
| RA-D02 / D02 / GUI | F1看板未编辑，1440浅 | 打开编辑→卡库→配置A→再卡库→配置B；改窗390重复；不保存取消 | 卡库/配置互斥、画布让位不遮主按钮、窄档可退回；取消布局零写。各开关态bbox/录屏，不能仅末截图 |
| RA-D03 / D03 / GUI | F1看板长画布，1440深 | 进入编辑滚至中/底→弹提示→打开卡库/配置→关闭回画布；Tab到主保存 | sticky/顶条/反馈叠层不压卡或阻点击；工具条清楚一个主提交入口；记录滚动和焦点可见，保存重进 |
| RA-D06 / D06 / AUTO+GUI | F3父任务另有子任务、里程碑/交付物链接及文件 | 开删除危险确认→取消零写；按现行domain删除保护合法确认；再受控落盘失败后重试 | 确认列明实际范围；拒绝不丢输入/误称成功；级联或阻止与现行delete contract及domain实际相符，源交付物不因软引用被删；交precheck返回/存储diff。不能自定“所有删除可undo” |
| RA-D07 / D07 / GUI | F1甘特合法时间区间，100% | 单击条→短移动未越阈值→双击→关详情→选条按Enter→键盘调期保存→重进 | 单击只选不误拖写；双击/Enter详情；低于实际源码阈值零日期写、超过阈值真调期；焦点归还条。先登记候选阈值常量及事件时间，不猜200ms |
| RA-D10 / D10 / GUI | F3进展与session记录，宽深 | manual汇报编辑MD→预览→取消；session空ID提交→合法ID新建→保存→重进；编辑已存来源 | manual/session校验互不串；无ID拒绝零写，合法来源持久，来源编辑只读且update不改；安全预览、不双份错误。联RA-R01..05 |
| RA-D11 / D11 / AUTO+GUI | F3任务已保存，交付物V1及B项目V2 | 主表单加关联→取消→重开加关联主保存；另quick-manage即时加/移除；非法跨项目即时提交 | draft只在主保存写，取消零写；即时命令成功即写且主保存不重复；移除只断联、保V1源；跨项目拒绝。分别载荷/DB时间/IDs，不能把draft PASS当即时PASS |
| RA-D12 / D12 / GUI | F5至少一个objective/KR与各可关联kind实体 | OKR选择kind对应关联→同项目保存→重进；跨项目/未知ID非法提交；深色观察错误 | 全现有kind可选且关联显示可辨标题，不裸ID误导；中文就近错误、保输入零写。kind列表取当前OKR关联schema逐项记录，不发明新kind |

## 2. 完整用户旅程

| ID / 门 | Fixture / 初态 | Main动作 / 明确提交点 | 预期与结束点 |
| --- | --- | --- | --- |
| RA-J01 / GUI | F1，默认pilot OFF，从全局dash异常卡开始 | 点逾期/受阻任务→TaskForm改截止/负责人→**主保存**→返回原卡→刷新/重进；另pilot ON同路线 | 同实体/同项目、焦点和上下文返回，卡数据反映已存值；无新窗口错项目；默认/pilot分别录开关，取消分支零写 |
| RA-J02 / GUI | F0同项目会议、合法action item | 新会议→保存→行动项转任务确认→任务补里程碑/交付物→**保存**→回会议，再次同项转换 | 稳定行动项关联真实任务；重试不造第二任务；里程碑/交付物双向可见；会→任务→交付物返回有上下文，非法关联保输入 |
| RA-J03 / GUI | F3+F4新建task draft | 基础字段+两资料+进展+选真文件→**取消/保留/放弃**；重建同输入→**一次主保存**→重开 | 取消无任务/资料/日志/暂存残留；保存原子单信封，重开保稳定ID和字节；不能成功一半再宣称一次原子 |
| RA-J04 / GUI | F3已有多active修订 | 编辑E1追加rv4→软删E1→恢复E1→选rv2+E3生成汇报→**保存**→改源rv5→重开汇报→编辑MD/预览/导出 | 历史rv1..3不被重写、恢复保全；固定摘录仅选中三元组、旧汇报不跟随rv5；导出与已存汇报正文/来源一致。联RA-M/RA-R |
| RA-J05 / GUI | F5/FB | 标任务done触发复盘草稿→查check→人补材料并final→OKR/KR关联→习惯建议确认→打卡/重进 | 所有正式状态由人显式；check提示不自动验收；失败重试保输入/不重复草稿；联RA-P系列与原OP |
| RA-J06 / GUI | F5完整备份，另合法空目标库 | UI备份→预检→取消零写→预检→**明确confirm**→重进tasks/文件/records/growth→下载核字节 | 两步确认、恢复前快照、extra表/文件一致；可恢复展示与原包一致，失败不半库；联RA-F06/07 |

### 2.1 看板持久、跨宽与并发入口补点

| ID / 门 | Fixture / 初态 | Main动作 / 提交点 | 预期与结束点 |
| --- | --- | --- | --- |
| RA-B401 / AUTO+GUI | F1 A/B项目scope、个人及旧legacy布局各异；仅合法settings历史包导入 | 先A无byProject读legacy→A保存→B无legacy读projectDefault→B保存→A重置→全局重进 | byProject>legacy只读>projectDefault；项目默认7卡、全局16种保留，save/reset只对应project:<id>，legacy/个人无改，不跨项目任务/资料；fileAssets投影清空不泄B |
| RA-B402 / AUTO+GUI | F1已存canonical12布局，卡ID/坐标全部记录 | 1440→1024→768→390→回1440，各档拖/缩一可区分卡→各**save**→服务重启/重进 | canonical12↔12/8/4/1实际容器断点投影，合法clamp/minW/minH无相交丢卡，旧布局不被新默认清空、不自动重排；各步canonical/viewport bbox/原始录屏，不能只最后一宽 |
| RA-B403 / AUTO+GUI | F1记录卡，合法多sort/filter/公式，各数据可辨 | 设置priority/dueDate两规则及filter→save/reopen；公式合法→空集→非法→修正 | 合法白名单/方向/稳定tie、max3沿看板原闸；filter无任意表达式；公式结构化错误、不eval/静默0；空态真实，记录实际字段/行集合与计算结果 |
| RA-B404 / AUTO+GUI | F1 scope和布局已存 | 改卡配置/移动未save→cancel→重进；受控保存失败→保留draft→恢复重试save→重进 | 取消/失败不写已存布局，失败有原因/可重试，不清卡；成功真实持久、全局/project/root隔离 |
| RA-N01 / AUTO+GUI | F3/FE 真实task主save延迟、F5 OKR/habit确认，各fresh | 连点两次主保存/confirm→观察busy/aria-busy→等待响应→重进；另取消在途上传/AI | 既有busy和串行链拒双写/重复确认、不丢ops历史；UI busy诚实可恢复，失败输入保留，取消不继续未确认写；只覆盖已存在这些入口，不新增全局“取消请求”按钮 |
| RA-IM01 / AUTO+GUI | F0隔离项目，当前verify导入样例的合法CSV/XLSX及非法列/日期样例 | 原生选文件→preview→cancel零写→重新preview→**confirm**→重进WBS；非法样例preview | ADL043现有预览/确认/层级/行错误与导入schema一致；不只读HTTP200、不凭早期Excel暂停结论排除当前入口；模板及解析行结果/ID/拒绝原证归档 |

## 3. 资料、修订与原子写

| ID / 门 | Fixture / 初态 | Main动作 / 提交点 | 预期 / 必交细节 |
| --- | --- | --- | --- |
| RA-M01 / AUTO+GUI | F3已保存task E1三版/E2软删/E3活跃 | UI编辑基本字段+E1正文+link备注→**主保存一次** | edit走单层draft ops单命令；stable at/pl ID，E1仅append rv4，E2全保留，E3逐字段不变；raw arrays不能覆盖历史 |
| RA-M02 / AUTO+GUI | RA-M01原始F3副本 | edit主表单 basic非法日期+合法ops→提交；basic合法+非法author/URL op→提交；再合法修正 | 两种失败均basic/material/log零写、输入保留；修正成功一次写。存储/载荷对照，不绕前端校验伪成功 |
| RA-M03 / AUTO+GUI | F3 active E1三版 | 软删E1确认→读列表/汇报选择→恢复→再次恢复 | deletedAt出现且三版原文全留；常规列表/选进展排除软删；恢复清deletedAt、同ID/同修订、二次恢复幂等；不要物理删除 |
| RA-M04 / AUTO+GUI | F3交付物V1关联冻结 | 源交付物改名/版本V2→查看任务→手动“更新最新”→移除关联 | 自动变化不改frozenName/version；手动动作才更新；断联不删源/日志旧ref。截图和冻结前后JSON，不仅最新版本 |
| RA-M05 / AUTO | F3+F0空task | 调真实material commit：F3非空raw→空task合法raw；F3 material apply rename/append/delete/restore；坏op+basic update | 非空commit中文拒绝且历史零写；空task首次raw允许；apply增量保史；真实commands/material.ts已有保护，**不得凭旧摘要判缺失** |
| RA-M06 / AUTO+GUI | F0新建task draft，c-1/c-2资料别名 | draft add两个link→progress refs选c-2→save；另非法alias取消/提交 | 提交后refs解析到真实at-ID且正确资料；坏别名整批拒绝，不半建任务；新建draft每次变更未提前写 |
| RA-M07 / AUTO+GUI | F3 legacy evidenceUrl/deliverableId与新数组并存 | 浏览→export/archive/review/check→仅改basic标题保存→重开 | 双读可见、不会删新键/旧键、进展叙事不冒充材料；只读派生不物理迁移，basic写保留所有新数组/历史 |

## 4. 真文件与恢复

| ID / 门 | Fixture / 初态 | Main动作 / 提交点 | 预期 / 证据 |
| --- | --- | --- | --- |
| RA-F01 / AUTO+GUI | F4普通/重复字节，F0draft | 原生文件选择上传→离开/卸载→取消；重进选两同hash文件→save→刷新 | 文件暂存/取消清理无DB/字节残留；保存后finalize资产不被卸载DELETE；同hash不误删/重复资产，记录stage/最终资产ID与目录manifest |
| RA-F02 / AUTO+GUI | F4上传3s延迟/传输拒绝 | 开始上传→取消abort→离开；另失败→重试→save | 无卸载setState警告/悬挂busy；输入/文件行可恢复、最终一次正确关联。StrictMode AUTO真实组件清理补证，不重写自建模型 |
| RA-F03 / AUTO | 纯tmp file root，现有安全fixtures | 合法各白名单类型；空、10MiB+1、ext/mime/magic不符、html/svg/exe/路径穿越/symlink；无配置生产upload | 白名单/大小/根隔离按真实函数拒绝，不执行恶意文件、不写正式路径；未配置fail-closed；每个负例输出拒绝类型+DB/根manifest |
| RA-F04 / AUTO+GUI | F4已成功挂接file asset，无cookie另浏览器 | 授权下载→实际字节sha256核源；匿名请求同资源→观察拒绝；中文/空格文件名下载 | 授权源字节一致；401/403不泄露；nosniff/no-store/安全disposition；不保存鉴权header/cookie，原证只脱敏响应 |
| RA-F05 / AUTO+GUI | 同一asset两任务引用 | 断联一条→下载另一条→断最后一条→gc dry-run→**明确apply仅隔离孤儿** | 不因断联删共享源；归零不自动永久删；dry-run只列、apply只孤儿；UI不提供GC时命令门证明，GUI只断联 |
| RA-F06 / AUTO+GUI | F5含新表/文件/共享refs/多rev/软删 | createBackup→空目标precheck→confirm→新进程重开→下载 | core/extra/settings按当前BACKUP_TABLES/EXTRA实际清单逐表对照，字节sha256/relative manifest一致；不凭“7表”旧快照判当前少表，明确真实备份表集合 |
| RA-F07 / AUTO+GUI | F5合法包副本与同库before | 各副本篡一文件hash/缺字节/relPath越界；受控提升/落盘失败→precheck或confirm→重进 | 能预检者预检拒绝，提升失败事务回滚/恢复前快照可核；表和字节无半提升。故障只在隔离adapter/tmp；GUI显示真实错误、保原库可用 |
| RA-F08 / AUTO | 历史合法7表备份、当前F5新键数据，独立兼容副本 | 旧包restore预检→confirm；新包用历史二进制只做隔离读取/往返评估；pilot OFF再basic写 | 旧格式兼容清楚；旧binary不接受新键时诚实只读/forward fix，不清键降版；关flag不丢新字段，严禁将正式恢复当试验 |

## 5. 固定汇报、session与导出

| ID / 门 | Fixture / 初态 | Main动作 / 提交点 | 预期 |
| --- | --- | --- | --- |
| RA-R01 / AUTO+GUI | F3 E1/E3活跃、E2软删、QA-B条目 | 按D-2..D周期选E1 rv2与E3 rv1→预览→save→重进 | 选择复合taskId/entryId/revisionId；正确作者/日期/正文/来源；软删/越项目不可选也后端拒；预览零写，保存固定摘录 |
| RA-R02 / AUTO+GUI | 同F3输入 | selectedRefs+excerpts同时提交；未知rev/别项目/软删refs逐个提交 | 后端互斥及存在性/同项目/软删拒绝，表零写，中文错误保输入；改为合法再preview/save一次成功 |
| RA-R03 / AUTO+GUI | RA-R01已存汇报 | 源E1追加新rev、改作者、软删→重进旧汇报详情/preview/export | 已存摘录/快照不变，不静默“更新最新”；来源仍可说明冻结版本；旧快照缺键不回填 |
| RA-R04 / AUTO+GUI | F5真实session绑定任务，manual/session各报告 | session无ID→合法绑定ID→session save；manual无ID save；edit报告标题MD→save | sourceType manual/session枚举、session要求非空sourceSessionId/manual为null、update不能改来源；任务会议来源显示可追溯。若现合同仅非空不额外要求一定“宿主session存在” |
| RA-R05 / AUTO+GUI | RA-R01报告、恶意Markdown note单独合法字段 | 编辑含表/代码/脚本协议链接→preview/save；导出MD/web/plain→源变更 | 安全AST无脚本执行、纯文本无HTML、关联里程碑/note可见；导出冻结不随源变；默认覆盖拒绝、confirm覆盖，路径仅隔离 |

## 6. B8界面矩阵与精确ID展开

依据路线图B1/B4/B8及§7.1..7.3、原 `gui-b8-expanded-checklist-20261020.md`、当前mapping纠正。**仅指定页面/抽屉/菜单/卡片范围**，不把待表决全局组件合同追溯。旧自动表数/截图数不构成设计覆盖。

### 6.1 页面矩阵

精确ID采用 `RA-V-<route>-<width>-<theme>-<zoom>-<state>`；route取下表12个值，width取1440/1024/768/390，theme=`light/dark`，zoom=`100/200`，state=`empty/typical/dense/long/loading/error`。合法笛卡尔格全部NOT_RUN；一个格必须做该状态动作，不是同一截图重复命名。页面矩阵manifest由自有 `remaining-plan-check-20261021.mjs --matrix` 在stdout列出；不会执行GUI/写产品。

width为缩放前浏览器CSS viewport目标，height=900；记录200%后实际innerWidth/innerHeight，不用强拉窗口抵消原生缩放。host shell/侧栏/PM容器宽度单列；布局断点以实际容器计，不把DPR=2/CSS transform认200%。Main通过浏览器菜单显示100%/200%录证，再做Tab/滚动/主要控件动作；窗口物理能力不足格为BLOCKED，非自动本人待验。

| route | typical fixture及动作 / 提交 | empty / dense / long | loading / error及恢复 |
| --- | --- | --- | --- |
| dash | F1编辑看板，16种卡各一已保存配置；开卡库/配置→取消/保存→重进 | F0默认空卡；FD长画布；FL标题/公式说明/文本 | FE首载不假数据；FB读失败→retry恢复画布/旧布局 |
| overview | F1 A/B项目scope切换→开卡→返回；project save/reset | F0新项目；FD/FL项目卡；个人/legacy布局不串 | FE/FB→retry；旧scope内容不冒充当前项目 |
| tasks | F1默认OFF及pilot ON分别列表/树→选task→改draft/取消 | F0；FD筛选/分组长列表；FL标题编号/抽屉 | FE/FB→retry；FS联RA-TOOL03；tasks额外 `RA-V-tasks-<width>-<theme>-<zoom>-stale/noresult`，先旧快照后拒读/不命中词 |
| gantt | F1跨度/依赖/关键路径/今天线→选条/Enter→合法调期保存 | F0；FD多条依赖；FL标签，内时间轴滚动不误算外壳溢出 | FE/FB→retry，失败日期不半写 |
| milestones | F1四种合法状态、achievedDate→编辑保存/清取消 | F0；FD20条；FL标题及关联任务 | FE/FB→retry，非法日期保输入 |
| risk-issues | F1风险/问题各枚举→矩阵→开行→合法保存 | F0；FD20条含closed不入矩阵；FL描述 | FE/FB→retry，局部写拒保输入 |
| people | F1同MAX刻度、未分配列、负载建议→筛选/打开task | F0；FD20负责人；FL姓名 | FE/FB→retry，浏览/筛选零业务写 |
| meetings | F3决策/四态行动项→编辑/保存→开关联task | F0；FD20会议；FL决策/行动项 | FE/FB→retry，失败不误关 |
| reports | F3固定摘录→详情/preview→安全MD编辑保存 | F0；FD20汇报；FL长异常/正文 | FE/FB→retry，source error诚实不自动入报 |
| deliverables | F3五态/里程碑/note→编辑解除milestone→保存 | F0；FD20条；FL名/版本/note | FE/FB→retry，搜索命中note/milestoneId，失败保输入 |
| okrs | F5有objective/KR/软关联+建议→树/确认/忽略 | F0；FD20条；FL长rationale | FE/FB→retry，失败关联无半写，已确认不重复 |
| habits | F7历史+建议→展开14日/月→confirm/ignore→允许补记 | F0；FD20习惯；FL长title/note | FE/FB→retry，超窗拒绝零写，空日不补 |

每格共同预期：主要文案/错误/全标签不重叠裁切、控件可达、外壳无二维横滚、表格/时间轴内部合理滚动；主写行为成功可重开，取消零写，loading/busy诚实可取消/重试，无无来源示例/白屏。视觉目视与DOM滚宽/bbox/焦点探针一起交，**探针不替代独立目视**。典型格主要动作已在完整旅程可复用，必须同候选/尺寸/状态/原时间段。

### 6.2 12抽屉、39菜单、16卡有界台账

- 抽屉精确ID `RA-DR-01`..`RA-DR-42` 按真实manifest原条目冻结在 [抽屉/菜单映射](remaining-layer-map-20261021.md) §2，覆盖project-create/project-edit/task/milestone/risk-issue/meeting/report/deliverable/okr/habit/ai/settings十二类真实抽屉；不机械生成“十二类×六态”新合同。每条有初态/动作/主保存或取消；不存在远端loading的纯本地表单不伪造加载组件。四档/200%由所属页RA-V覆盖，开关不是全抽屉dirty新要求。
- 菜单精确ID `RA-MENU-01`..`RA-MENU-39` 原条目映射已冻结在同文§3（按条目ID字典序）；Main交 `layer-map.json` 原条目ID、设计路径、真实路由/trigger/项名称、命令或纯前端动作，专家核运行接线，**实际入口映射未交目前BLOCKED**。每条有F1/F5等实体→开menu→Tab/箭头/Enter/ESC→合法命令或取消；写前记录目标/确认，原设计不存在的写动作不新增，不能凭数39“覆盖”。disabled/read-only理由与实际行为对应，ESC焦点归还。
- 卡精确ID `RA-W-<kind>`：`completionHero/completionTrend/divider/formulaCard/kpiMetric/milestoneDeliverable/objectiveProgress/overdueSoon/peopleLoad/projectScale/queueCard/recordList/riskMatrix/statusRing/textNote/weeklyPlan`。F1逐卡加/配置→拖缩→save/restart→删/undo→cancel；公式只白名单，filter/sort合法和坏值，不任意eval；Markdown安全。卡内容值按同fixture/domain派生，与计数/日期/coverage原证核对；无记录trend/weekly诚实empty，divider无伪统计。联原B1-GUI01、RA-U401，仅看板记录卡multiSort沿既有max3，不重开误判。
- `RA-AT01 / GUI`：F1+FL风险矩阵，真viewport320×900浅/深100%；开填充矩阵点击最高风险格→列表/返回、横滚/Tab。完整轴标签/格内数可读不二维外滚、closed排除；填充态不是空矩阵截图，记录格和对应真实IDs。
- `RA-AT02 / GUI`：真实macOS VoiceOver，1440浅100%，F3任务抽屉+F6 AI确认卡+F5危险确认/OKR listbox。键盘读出label/role/state/错误/进度模式，Tab/箭头/ESC不陷阱，取消与主提交焦点/播报可辨；交VoiceOver开启状态、音频录屏/逐条转录和元素上下文。ARIA静态不是读屏通过；若系统确需本人允许记录必要本人动作，不笼统转人工。
- `RA-U401 / AUTO+GUI`：F1另选3平面任务，同优先级/不同截止和同截止/不同code。设两规则priority升序→dueDate降序→save命名视图/default→刷新/服务重进→切B→回A；预期有序稳定、方向明确、同项目恢复/跨项目不串、旧四态存储兼容、WBS树保旧父子结构。当前SOURCE FAIL待Main有限修复，原boardmultiSort PASS不覆盖。
- `RA-U402 / AUTO+GUI`：F1任务表隐藏一已有可选列→保存视图→刷新/重进→恢复该列→切项目；预期列偏好实际生效与同项目恢复/隔离、不丢其他query/chip/grouped/sort、不删记录、不破编号标题可识别及已承诺复制；无任意列schema/自定义列设计器新范围。

## 7. CI与工具试点

| ID / 门 | 初态 / Main步骤 | 预期 / 原证与边界 |
| --- | --- | --- |
| RA-CI01 / AUTO（远端只读） | 当前`.github/workflows/ci.yml`与对应GitHub已运行commit；通过已可用授权只读查询最近core job详情/日志 | 记录run ID/commit/job/结论/依赖及各步exit，失败不叫本机替代PASS；没有授权访问且必须本人登录记MANUAL_PENDING，其他可查证继续；不触发push/workflow改配置 |
| RA-CI02 / AUTO | Main隔离副本运行现有e2e；一份无harness，一份明确宿主/Chrome装载 | 无宿主SKIP exit0归SKIP/NOT_RUN非E2E PASS；有条件真实执行归实际结果，core job绿不代替；远端仅查已有记录，不新增宿主下载方案 |
| RA-TOOL01 / 工具AUTO+GUI | EGO同space短能力探测；隔离F0固定tasks进入/填标题/取消/返回；连续两次探测 | 记录版本/space、调用/耗时/返回、401/启动挂起/恢复；有界失败即切稳定工具，产品用例照常；不重装/改系统/打印认证 |
| RA-TOOL02 / 工具GUI观察 | EGO与现有Aha/稳定浏览器同机同候选F0、同入口脚本、同冷/热计时边界；各冷1热2次任务填表取消+12路由导航+真文件选择后取消 | 每次记录成功/失败/恢复次数/耗时，禁止只报最快/提升百分比；Aha不可用BLOCKED对照、不为试点挡产品门；不宣称固定次数证明工具整体稳定 |
| RA-TOOL03 / O3/O5 / GUI | F3真实任务抽屉，合法输入，后端返回真实业务拒绝；FS旧snapshot读失败后打开抽屉 | O3失败不onSaved关层/输入保全、重试合法成功关层；O5只读“数据陈旧，重试后更新”不进payload，retry后消失且更新值；同页完整录屏/输入diff，联BA-COPY |
| RA-TOOL04 / O4 / GUI | F3 task表单clean/dirty（仅description、多选内容/顺序）；ESC/scrim/X/cancel分支各fresh | clean直关、dirty confirm；ESC保留/Enter放弃、焦点归还、保存成功不二次弹；仅TaskForm既有范围，不新增所有抽屉守卫。18单测旧PASS留原范围 |

## 8. 执行记录要求

Main只填actual observation/文件/时间/exit，不在原证回填“PASS”。每ID拆AUTO/GUI/本人实际结果，由专家签字。菜单映射、无法达成的状态或宿主外依赖交最小阻塞说明，继续可执行格；不得用fake date/非法schema填历史、DOM覆盖错误文案或纯函数模型当production组件。

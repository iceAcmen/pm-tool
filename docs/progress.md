# 工作进度流水账 progress.md

> 本文件记录项目「每个阶段已完成、进行中、待办」的最新状态；给维护者/迁移者快速判断进度使用。每次有进展即更新，最新内容置顶。

## 2026-10-24 当前：168项已封存，全部工作树干净（trae）

负责人再次指出168项仍显示后，已对3个历史工作树执行可恢复的`git stash push --include-untracked`，分别保存114/9/45项。全部168项从stash对象逐SHA回读一致，21个已登记工作树实际Git状态均为空，原分支HEAD不变。恢复入口见[记录](archives/2026-10-24-historical-worktrees/retirement.json)。纠正此前98同字节引用：其中39项仅为主目录本机忽略原证，不在daedefc提交；已全部进入本机stash，未冒随main传输。当前产品、验收安排及服务保持原状态，本轮只保存恢复说明和同步档案。

## 2026-10-24 多工作树186项状态补查（trae）

负责人截图显示186项变更，现已对全部21个Git工作树核对：主`main/daedefc`干净并已同步，历史树合计58跟踪改动/128未跟踪。18依赖软链已通过本机共用Git exclude忽略；其余168项中98份与主版本同字节，70份独有原件及3份差异补入[历史存档](archives/2026-10-24-historical-worktrees/status.md)，包括5份此前未入主档的补测脚本和旧截图。原件保留、未合并旧产品代码；旧树的差异仍可显示，不能把“main干净”说成所有工作树干净。凭据文本扫描及复制回读通过，本轮只补齐前次已授权的存档提交推送，用户手动验收安排不变。

## 2026-10-23 当前状态存档与提交推送授权（trae）

负责人本轮明确要求先存档当前进展和状态并提交推送，保存为在途检查点，不标验收完成。详见[存档](archives/2026-10-23-manual-acceptance/status.md)及[完整验证记录](archives/2026-10-23-manual-acceptance/validation.md)。源码与已验证528输入同，独立组合SOURCE/AUTO有限PASS实封回；原full1721、有效DOM61、专项7、有效verify95，原失败及补执行保；本轮启动器56/56、vendor静态核验0。用户手动验收及原GUI缺口待反馈。源码和必要摘要入Git，约7GB运行/采证副本本机保留不删除，无tag/发布/正式切。原1435计量的最终验收提交里程碑仍未完成，本次存档不冒该里程碑。

## 当前续验：反馈有限补签与两项原因缺陷修复（2026-10-22，trae）

- **2026-10-23 用户改为手动验收**：负责人认为自动GUI验收过程过长，明确要求重启服务并自行验收，发现问题后再反馈。新候选隔离服务已在`127.0.0.1:3271`重启，PID `77151`，带token入口就绪；无token访问返回401符合预期。自动SOURCE/AUTO门保持原结论，剩余GUI项登记为用户手动验收待反馈；不切正式服务、不推送/发布。
- **2026-10-23 手动验收演示数据**：按负责人要求，仅向3271隔离运行根写入自然语言演示数据：2项目、16任务、3里程碑、4风险问题、2会议、2汇报、5交付物、3 OKR、2习惯。全部通过真实`/pm`命令写入，最终`web snapshot`计数一致；正式数据与仓库`data/`未触碰。
- **2026-10-23 11:40新合包实证**：[回归及恢复](plans/2026-10-23-combined-tasks-people-regression.md#1140实际回归封交)。人员轴两源开发/独立SOURCE实释放0后，Main新129/528八delta，freeze45.285秒、构建0/full1721/DOM有效61/报告专项7/verify有效95/guard/close0；原DOM缺jsdom及P0异步原exit1保，均最小补执行不改oracle。1869件实readback0，旧主lib/三依赖/launcher同；独立组合r2正文有限SOURCE/AUTO PASS已落，末封收据尚待，不冒GUI。P26原20整ID候选需新包重绑，余6精确明列，进度json单列不加入下界。新3271未起，原全门及普通提交持续。
- **2026-10-23 11:15精确接续**：[集中段](plans/2026-10-23-1015-timed-continuation.md)。O4/stale独立源门实回读0有限PASS；FD四宽/图轴有限FAIL及姓名有限SOURCE PASS末回读0已实收，审证区间1078.754秒不是整功能工时。轴CSS定位批零源改14件回读0，Main按父确证修授权补现people.tsx/css文本槽/行容量，独立合同§5先行，唯一新继任及独立源审分离。26原P ID历史继承并行补链，不重已签动作。合executor/3271host仅准备语法0，未冻结/构建/启动；整体精确%仍null，下界1.74%非实际，原全门齐才ordinarycommit。
- **2026-10-23 10:58追加修复**：name CSS原批已实封回0释放，FDaxis独立确证图窄列/文案相叠/外壳横滚有限FAIL，[Main顺序最小认领](plans/2026-10-23-people-axis-overflow-repair.md)另唯一CSS开发在途，不覆盖原name成果、不改TSX/公式/数据。原source审/GUI全门待，整体下界1.74%非精确；全源齐再一次合build。
- **2026-10-23 10:55实收**：[集中最新段](plans/2026-10-23-1015-timed-continuation.md)。20原AUTO独立PASS/实回读0，完成下界已升25/1435=1.74%仍非精确整体。O4/stale开发127/528红2→11绿/红1→24绿、首读9/邻接38/type0已释放，独立源审在途；原Strict归焦缺口保。人员F1FL有限事实/返回零写PASS，长姓名FAIL、MAX目视/AUTO缺；唯一people.css开发在途。FD四宽12态1848/axis补片595封0，图轴窄列/外滚交独立审与最小追加合同；P2002refresh原同视口缺口r5已封回有限PASS。合build脚本仅prepare/syntax0，未冻结/构建/提交/推送/发布/正式切，原全父验收至普通提交保持。
- **2026-10-23 10:38实收**：[集中接续最新段](plans/2026-10-23-1015-timed-continuation.md)。首读独立SOURCE/AUTO有限PASS，原6红/3绿→修后9绿、邻接30/type0原证已审、封回0；同panel唯一开发续已确证O4/stale。3270正常恢复F1/FL→人员计数/MAX/筛选/任务及建议目标返还已封651/1406件，8态28/110根同、产品无RPC写，独立人员审在途。实际两包均1440×900深100，先前浅标签纠正不计浅格；FL长名压数/状态交独立裁定。20原AUTO继承专家在途。总%仍未核定、下界0.35%非真实完成率，每步时间和失败保，无整功能完成/新build/提交/推送/发布/正式切。
- **2026-10-23 10:15计时接续**：[本段实证/固定角色/下一步](plans/2026-10-23-1015-timed-continuation.md)。L8独立r7 SOURCE/AUTO有限PASS+真实seal/readback0，GUI仍待；进度基线独立分母1435/完成下界5＝0.35%非精确整体，台账已同步，原证映射继续。任务固定专家判首读误空/O4confirmESC/陈旧banner叠压三红，多数退出/读取恢复有限PASS；首读panel开发在途，其他panel修后继合并一次整回归。Main新3270PID53831准备F1人员实例，欢迎已退出但会话composer不达，尚未restore，下一原PMMore恢复入口。每步timing追加、无整功能完成事件/无新build/stage/push/release/正式切。
- **2026-10-23计时与百分比执行**：[执行合同/预算/交接](plans/2026-10-23-timed-acceptance-execution.md)。每步日志已追加，原中断耗时null、首新浏览器55.049秒超时保且纠正；detached新Chrome同3269恢复，连续原FE/FS/noresult采8态613件，index73df3c77…封实际0、根同，独立待审不自PASS。首读未完成却显示暂无项目原图保，重试陈旧提示消失/旧错误卡留。整体百分比分母核原252+1184及最终commit，适用/继承审未成故null，不冒0%；每整功能完成必须百分比/耗时/效率反思/下一改进。本批预算24–40有效小时仅估计，无build/push/release/正式切。
- **2026-10-23执行效率调整**：[复核与后续规则](plans/2026-10-23-acceptance-efficiency-adjustment.md)。改按功能域闭门、先复用旧证再补缺、采证时核入镜与完整RPC、固定候选连续验、集中封件/短交接和有界工具恢复；不减少独立验收或原父范围。本次只读复核/文档，尚无提速统计。
- **2026-10-23 09:15实际状态**：[负责人询问/完整接续](plans/2026-10-23-0915-status-checkpoint.md)。L8开发125/526两文件红3→窄46/type0/seal1321/readback0已released，但独立源审中断尚未PASS，不新build。F1/FL/FD202封件生产预检恢复与独立完整性有限准入0，GUI尚未验；P2002真树有限PASS，仅原刷新同屏118补图独立未封签。总范围R3仍不准父commit，seal实0但readback外层收据缺。三审后台killed/sendfinished、替补并发limit5失败，清本窗已终角色pending后仍失败；CU显示菜单281.8s无缩放证，原ownedCDPtarget缺失/已知3269和3263页0，未替换重放。用户中断后gitdiffcheck0/原件保，继续原全父未验/native/B8/旅程/继承，未stage/push/release/正式切。
- **2026-10-23 09:00接续**：[实审/原证/全父后继](plans/2026-10-23-0900-continuation.md)。原P1下部缺图与KR展示缺陷独立有限关闭；P1004旧处理卡Tab有限PASS而原ask对象继承BLOCKED。L8原3263重进/真刷新后wrapped仍待办，310/110帧封outer0交独立缺陷/先行计划；gantt1宿主cache新增保，业务不变。P2002真实三任务父/子新增命令认领、old44同，折叠/展开/edit-cancel/refresh/reentry/reload读47根同，708/182帧12态封outer0交独立树审；prepare1响应wrapper错误不重父写。F1FL生产schema定位及全父逐ID对账在途；继续确证修复/native/VoiceOver/B8/全部出口到ordinarycommit，无产品/build/stage/push/release/正式切。
- **2026-10-23 08:45接续**：[原证/收据/全部后继](plans/2026-10-23-0845-continuation.md)。Main正常暂访原3267只补rest下部：t22项目/缺席标签与t18过期普通无静音标记真实图、t21已跟进不在完整rows；710/93帧9态对原final同封实outer0交独立P1在途，无bind/save/restore/open/TTL重做。scroll1错locator保、follow只续已展开行；正常返回3269/当前44roots对P2final全同。P2独立仍在审，FL/MAX纯只读实物locator新在途，K16原有限已关闭；继续L8/native/VoiceOver/B8所有父出口到全部ordinarycommit，无产品/build/stage/push/release/正式切。
- **2026-10-23 08:36接续**：[实证/收据/全部后继](plans/2026-10-23-0836-continuation.md)。K16已独立有限PASS，9known/2gaps与done/wrapped/reload复读原切片关闭，实seal0，周期整门不签。Main同3269 P2002真audit→A七顶层/状态分组各1slot、B未导出、长标题edit/cancel、refresh/reentry/reload；KR自身related恰1邻接/第二root独立/reentry/reload。1761/245帧/35态44roots0变封seal2outer0交独立P2审在途；seal1正则误判只读ask-provenance的1保。原P1004ask正文未恢复，只既有处理卡自然前一刷新→nativeTab真到opener，交专家判断承接；当前A7全parentnull，树子层/折叠不冒已采。继续原3267rest/FL MAX/L8/native/VoiceOver/B8父全部ordinarycommit，无产品/build/stage/push/release/正式切。
- **2026-10-23 08:21接续**：[实证/收据/后继](plans/2026-10-23-0821-continuation.md)。P1004首次遮层/直接取消X独立有限PASS、Enter/表单内Tab/ESC/可见归焦有限PASS，真实seal0；原native Tab到opener实际0仍NOT_RUN，只补原步不重ask/save。Main同3269新会话真实archive一次/两review（后者真reload后复读）→原package/README/file→四反思known9/gap2逐字→12态44root0变，717件/156帧sealed outer0交独立K16在途。files复合快捷键、reentry误等待临时命令跨reload两个设施1保，后继沿原成功数据只续余步，无重archive/reload。当前新会话composer，原副驾卡需先正常观察，不能伪称原focus仍在；P2002/KR/rest/FL MAX/L8/native/VoiceOver/B8及父全部ordinarycommit继续，未改产品/build/stage/push/release/正式切。
- **08:10 K16后继预检更正**：当前四个p-0001真实反思known为4/1/1/3＝9、gap为0/1/1/0＝2，详见[08:08第3节](plans/2026-10-23-0808-continuation.md#接下来的原余件)。此前“known10”后继摘要不作为当前oracle；不改旧报告、不编辑反思凑数。原三记录7句AUTO历史边界保，后继按当前四ID/真实文本采9句2gap。
- **2026-10-23 08:08接续**：[原证/命令/后继](plans/2026-10-23-0808-continuation.md)。F02原§6最小GUI独立PASS_LIMITED_GUI、remaining关闭，真实seal0已读/released，不重这一个slice。Main同3269原P1004合法正常准备0→一次真实ask/gateway1→人负责人47主save→只读刷新→首次无遮挡title真实命中→直接cancel/X/nativeEnter-Tab-ESC三退出/归焦，1314件179帧封outer0交独立GUI在途。prepare实际save success后错期待null导致outer1保，后继只读校正、不重save；全窗仅t6变，最终只updatedAt变，37非目标raw/两L2/dlv/资料附件保，gateway已恢复。当前owned3269副驾展开、无dialog、focus原打开任务；继续K16 known10/gap2 archive、P2002/KR/rest/FL MAX/L8/native/VoiceOver/B8与父全部ordinarycommit，无新产品/build/full重跑/stage/push/release/正式切。
- **2026-10-23 07:55接续**：[实际命令/原失败/后继](plans/2026-10-23-0755-continuation.md)。新组合独立SOURCE/AUTO有限PASS，seal工具实0。新3269/PID22463实际浏览器插件片段复原client1720393B/SHA3be9d4a0…；标准备份含侧车与一次恢复成功，13表38记录同。Main原F02 planned正常主save准备→accepted指针稳定闭/选中零写→唯一首点save完整RPC/raw/关层重开，原nativeTab/Enter对照一次成功；1457封outer0交独立GUI，当前修后GUI PENDING、旧FAIL保。全窗仅dlv1变、37非目标raw与两L2/资料附件保；navigation/入口/旧名称等待/tuple reader的四设施1原件保、无重restore。当前owned3269无dialog，继续原P1004/K16/P2002/KR/rest/FL MAX/L8/native/VoiceOver/B8全部至ordinarycommit，无stage/push/release/正式切。
- **2026-10-23 07:37接续**：[新组合实证/命令/后继](plans/2026-10-23-0737-continuation.md)。R2 SOURCE/DOM9+R3原28有限PASS闭原9+28子门，旧37设施1/R3wrapper1及只读收据校正保。Main新 `CombinedF02RepairR2`124/525仅2delta，freeze/tsc/bundle/noEmit/full162/1707、DOM6/41、专项2/7、95verify/guard/close全inner/outer0；455built/client1720393B/SHA3be9d4a0…，主旧lib/源/三依赖/launcher保护同，1816封工具0。另独立组合审在途，GUI/新host NOT_RUN、3268旧字节，F02原FAIL保。收审后新host标准备份/附件恢复F5、planned真实准备→accepted稳定闭→唯一首点save/键盘，其他六修/历史rest/FL MAX/L8/native/VoiceOver/B8与父全出口继续至ordinarycommit，无stage/push/release/正式切。
- **2026-10-23 07:28接续**：[独立门/更正/父出口/后继](plans/2026-10-23-0728-continuation.md)。893原P3004负例独立有限GUI PASS余0；443原生trace强支持默认激活、旧F02FAIL保，更正round26实有一对只读snapshot RPC、无业务写。109开发独立SOURCE/DOM9有限PASS，37断言绿但真实1为专家identity重复wx设施，related28/合并门BLOCKED、独立R3仅28补证在途。原F01不重。父execution实际已定位、已恢复同步，原逐域/本人/总出口路径详见接续；新组合计划/runner已成NOT_RUN，门齐Main唯一新freeze/完整回归/原首点save键盘及六修/历史rest/FL MAX/L8/native/VoiceOver/B8全部至ordinarycommit。无build/GUI/业务写/stage/push/release/正式切。
- **2026-10-23 07:20接续**：[F02实际开发与后继](plans/2026-10-23-f02-option-default-development.md)。Main按原专家§6只改listbox option局部preventDefault/choose与DOMtest追加D08/09，原7保；原525修前全同、修后仅2变/523同。真实red7绿+2必要红exit1，同testSHA green9/9与related28/28工具/子exit0、stderr空，109开发封工具0。派单恢复，443trace、893P3004负例、109开发分别独立新审在途，不自签门；F02旧GUI FAIL/首save NOT_REACHED仍保，新GUI NOT_RUN，F01不重做。当前3268仍旧字节、无新build/host/业务写；源门齐Main唯一新freeze/完整回归/原首点save键盘复验及父全部余项至ordinarycommit，无stage/push/release/正式切。
- **2026-10-23 07:13接续**：[完整证据/命令/后继](plans/2026-10-23-0713-continuation.md)。独立原L2 F01有限GUI PASS余项零；F02原指针FAIL保，首save实际遮罩命中/后台NOT_REACHED。Main正常E=p3/H=habit-mvk5br0w-ff4ta7未关联夹具，真实同表单missing/B两关系拒绝、5字段稿保、11状态44roots同，893封独立GUI待审。新增443原生trace证option真实click先闭、随后无Main输入的detail0可信trigger再开；监听移除/正常取消、零写，Main工程诊断不自签独立因果。F02最小两文件计划已成，产品未改/红绿NOT_RUN；当前owned3268 A交付物页无dialog、DBaccepted/两L2final/E-H保。原角色均finished、新建派单工具暂不可用，未重复派/自验收；Main继续必要红修准备与其余原GUI，全门齐后父全部ordinarycommit。无stage/push/release/正式切。
- **2026-10-23 06:58接续**：[原范围/命令/现态](plans/2026-10-23-0658-continuation.md)。独立1822件六修整回归有限PASS已收；Main新3268/PID9103复用六修freeze，525输入及实际bundle装载同；正常新F5备份/真实附件侧车网页预检明确restore成功一次。两原L2反思完整view/Shift+Enter三类材料edit/draft/explicitfinal/repeat/reload1507封交独立GUI，前后仅两反思变/旧3264导出后三根零变；换行提前发第一行的真实部分写及各设施失败保。指针新候选字段选择后menu仍开、Main单次save零RPC/dialog保/零写，353封交另一独立原F02审；不自判FAIL、round18仅编写NOT_RUN，DBplanned准备未save。当前owned3268编辑交付物开/DBaccepted、两L2final；继续原P3004/rest/六修其余GUI/FL MAX/L8/native/B8及父全门后ordinarycommit，无stage/push/release/正式切。
- **2026-10-23 06:37接续**：[当前完整结果与余项](plans/2026-10-23-0637-continuation.md)。Main新六修124声明/525完整输入、12delta独占freeze；tsc/bundle/noEmit0、full162/1707、DOM6/39、报告专项2/7、全95verify与guard/close0，1822件封交独立组合审。报告专项首并行早于full生成合法夹具exit1保，full0后同断言专项r2才0，原警告保；不冒GUI/父PASS。P1历史独立仅指定切片PASS，下部rest一条可见图和FL/MAX未签；P3004原专家明确既有空OKR文本回退负例夹具可采missing/B关系错误保稿零写，原BLOCKED不豁免。下一步新host标准恢复最新3264F5、六修原GUI、rest/失败稿/FL MAX/L8/native/B8，总门齐后本批全部普通commit，无push/release/正式切。
- **2026-10-23 06:28接续**：[新权威接续](plans/2026-10-23-0628-continuation.md)。中断三r1实核finished，P2002/KR两r2独立SOURCE/AUTO有限PASS、F7收起/reload/历史保全r2有限GUI PASS已收；六修源门齐，仍未新组合build/GUI。Main新3267/PID3133复用114，原GG合法历史标准恢复，真两sessionbind/过期mute/仅缺席rest/正常t21跟进刷新/reload及t23历史33/10日人员筛选打开返回2122封交独立；3264 F5/3266 F7保护0diff，owned页已回3264。错等待/未dispatch/漏前缀原失败保，不重复restore/save；FL MAX仍欠，P3004原失败保稿另独立范围裁定。Main继续唯一新freeze完整回归/六修原GUI、native/B8/L8/全部出口后ordinarycommit，无push/release/正式切。
- **2026-10-23 06:11续验**：[当前接续](plans/2026-10-23-0611-continuation.md)。2372独立审结仅KR软关联可见性FAIL；最小views修+新test开发RED1→8/8、邻59/59/封0，released后交独立SOURCE/AUTO。Main新F7原14条历史标准恢复至冻结114的新3266/PID98161，收起/刷新/reload/重进及8月纵滚231件封，交独立GUI审；3264新F5前后保护0差异且owned页已返回。首intro/错误等待/首seal错文件名失败与未收终码保，r2封0不洗红。P2002独立源门仍在途，未新build/commit；继续原P1历史/MAX、全修统一候选/回归/原GUI、L8/native/B8和父ordinarycommit，无push/release。
- **2026-10-23 05:55任务出站修交回**：[开发最终收据](plans/2026-10-23-p2002-outbound-slot-handoff.md)仅index/panel/tasks三源delta，原8项有效红→开发8/8、相邻54/54及vendor/selfcheck/collect实际0，九项并行文档变化保；三锁released。Main已交另一独立SOURCE/AUTO角色新 `testing/p2002-outbound-slot-source-auto-20261023-r1*`，不以自测代PASS，新整包未build/GUI。目标/习惯2372仍独立审，另只读explorer定位原F1/FL/F7标准fixture与未签最小历史动作，禁止重复GUI或新阈值；下一步接各审后最小原修、新候选完整回归GUI与父所有余门/ordinarycommit。
- **2026-10-23 05:52 原拒因签字与目标/习惯续验**：[P0002新拒因独立有限PASS](testing/p0002-reason-recap-gui-review-20261023-r1-report.md)组合前签后原 `exactRemaining=[]`，不扩当前修复候选或确认前逐字段展示；旧缺图/恢复失败保。Main新 `P2OkrRemainingR1`2372封交独立：真实第二目标与primaryA/relatedB KR保存、切软联及人定稿；missing/self/异项目精确错误保输入，B页动态隔离/重复拒绝/Bclear只删processed保A/Bpending与重进；习惯第二同项目目标保存/重开/刷新、missing/B真实命令零写拒、只读归属集合1及cycleDue预留读回。KR软关联真实落盘但tree/reload无关联行，交专家裁原P2004承诺，不自判。Habit无rawID表单，命令拒不冒失败表单留稿；F7历史未补。17轮保错label/menu/无menu时ESC退出/Meta-KeyA拼接、round01/09终码未收；首seal命名roots误读exit1保，r2核原部分副本并排UI对象exit0，不重GUI或改旧封件。P2002开发仍独锁index/panel/tasks，主不整build；当前ownedChrome3264已reload在OKR页，原业务除3个正常新OKR/1习惯关联/pmOkrInbox明确写之外，其他roots同。继续两角色收件、最小修/独立源门、新候选回归GUI、P1历史/MAX/F7/native/B8/L8及总出口ordinarycommit，无stage/push/tag/release/正式切换。
- **2026-10-23 05:35 出站独立裁决**：[1690件原审](testing/p2-outbound-history-review-20261023-r1.md)恶意web/31-29历史分流/reviewdone-wrapped量化与重进有限PASS；任务出站位确证FAIL，历史未接线不再自动N/A。Main已核index现snapshot无audit，按原§5.1派开发只index/panel/tasks真源传值及所有实际行只读slot，三source锁在途，其他四修保，不提前整build。P0002新拒因439仍独立目视在审；继续不重叠余项。
- **2026-10-23 05:35 K16源门审结**：[独立SOURCE/AUTO](testing/p2007-archive-projection-source-auto-20261023-r1-report.md)四专项35/35＋独立字节3/3、seal exit0，原reader设施首败保；与P1004/P1005两修四个有限源码子门已齐。等待P2出站/任务位范围和P0002新拒因目视审，继续不重叠原余项；新组合未freeze/build/装载，不把当前dirty源与114运行互换。
- **2026-10-23 05:34源码子门与出站封包**：P1005[事件入口](testing/p1005-reflect-entry-source-auto-20261023-r1-report.md)独立10/10＋11/11＋24/24有限SOURCE/AUTO PASS；[Listbox backdrop](testing/p1005-listbox-backdrop-source-auto-20261023-r1.md)有效独立DOM7/7＋旧28/28有限PASS，原设施首轮失败保；原两GUI FAIL不改签。K16遗漏[独立确证](testing/p2007-archive-known-gaps-red-20261023-r1.md)，开发仅archive投影/真schema test交回旧5红→9/9/affected35/35，另独立SOURCE/AUTO在途，新修均未装114。`P2OutboundFixtureR1`1690封交独立：正常t7done/t8wrapped→review1/1/ms1/known10/avg100及reload同；真实恶意title web本地打开无img/事件属性/弹窗、单file请求；标准含附件backup修改仅两条31/29历史audit/sent测试记录、侧车字节保/摘要重绑→真实precheck零写/confirm仅2settings＋安全包→两导出audit4→5→6/active4→5/31归档value保/29active，原业务/资料字节同。任务页/抽屉/reentry无出站slot，独立裁原承诺范围，Main不预判N/A或新功能。P0002原结果已丢的[合同修订](testing/p0002-reason-visibility-recovery-20261023-r1-report.md)准一次新观察；`P0RejectedReasonRecapR1`439封，1ask/1GUI apply/1gateway匹配，原badbranch最终0应用1未执行、同挂载真实滚动后完整句入镜，50 WATCH键七末段零变/目标snapshot全同，交独立补签；旧457不可见/175无法恢复不洗。父后继需等待上述门/最小缺陷合同，Main统一新冻结/全回归/新宿主原GUI；继续P1历史/MAX、OKR关系/F7/native/B8/L8及总出口ordinarycommit，无stage/push/tag/release/正式切换。
- **2026-10-23 05:16审结与P2文件续验**：P1004[独立SOURCE/AUTO](testing/p1004-handoff-source-auto-20261023-r1-report.md)仅锁定隔离输入7/7＋22/22有限PASS，最终seal已具体声明P1005两源码并行变化，不继承当前组合候选或GUI。P0002[独立审](testing/p0-rejected-remaining-gui-review-20261023-r1-report.md)关闭八拒/wrapped/data子片，纠正前条“diagnosis完整可见”：正文RPC/DOM有，但原画面没拍到，原因目视仍BLOCKED。Main按原合同只读重开，`P0RejectedReasonSupplementR1`175封/roots零变，当前只读诊断剩旧持久applied t6、草稿为空，未重ask/apply；另专家只审既有结果恢复/最小复验步骤，不因缺图新增功能。`P2ArchiveReviewR1`192封：真实archive/review与package/README本地打开，源7句known＋两gap对比archive三反思known/gaps全空；review7句/里程碑1/无done时null正确，前后业务/files/backups零变，另独立原缺陷合同在途，Main不自签。正常命令新建t7后标done及t8后人wrapped，恶意HTML仅合法title/description字段、用于既有出站安全及P2007量化余链，原t1/t3/t6和旧反思不改；`P2OutboundFixtureR1`在采。P1005两个开发仍封交中；Main不触锁，不整build、不stage/commit/push/tag/release/切正式。父余项和ordinarycommit目标继续。
- **2026-10-23 05:05负例封包与三缺陷闭环**：新 `P0RejectedRemainingR1/index-r1.json`457封交独立GUI审：两真实ask/一明确apply，8协议/长度/越权/日期建议逐行拒、AIwrapped页面拒、非法branch最终task schema拒且诊断可见0应用/1未执行，前后全部pmtool/files/backups根字节同；不重title/合法窄集/context/metric。round01入口等待及round03成功ask后错tab名称失败保，不重ask/apply。P1004开发已[交付](plans/2026-10-23-p1004-sidecar-handoff-report.md) panel精确+15/-5及真实DOMtest，原有效红6红1绿、两green各7/7、两affected各22/22；独立SOURCE/AUTO在途，不自签GUI。P1005[独立FAIL](testing/p1-l2-events-gui-review-20261023-r1.md)：L2事件完整view/edit/final入口缺陷及交付物指针选择/save有限失败；已分派两个不重叠开发接缝，后者先诊断，允许有证采证归因更正，不盲改。旧114/521与3264/PID10975保持，不冒新源码装载；新整包候选待各修/独立源门齐由Main唯一build。当前ownedChrome3264宿主snapshot；P1历史/MAX、P2出站/31-29/archive/review/OKR、F7/native/B8/L8仍续，无stage/commit/push/tag/release/正式切换。
- **2026-10-23 04:54派审恢复与L2续证**：P0指定context/窄集title/metric三片[独立有限PASS](testing/p0-context-metric-gui-review-20261023-r1-report.md)，原P0002其他GUI负例仍NOT_RUN。P1004[数据刷新有限PASS、首次遮层/直接退出FAIL](testing/p1-projection-refresh-gui-review-20261023-r1.md)，两审released；开发按原§6红/最小层焦点修/复验合同在途，Main唯一后继builder，旧114运行不冒新修。Main新 `P1L2EventsR1/index-r1.json`1077和receipt补包6封存：F5 m1/dlv1真实主save各生成milestone-achieved/deliverable-accepted、关联t1仍todo时pending/gaps，两次同状态真保存不重反思，t1与旧task-done字节保；命令read/reload无业务写。原reflect任务入口只返旧task-done，两新反思无taskId，未误改旧记录冒人edit/final；该入口与原X6-L2对应交独立P1005专家在途，不自签。保首副驾遮/旧selector/pointer save零RPC/键盘恢复，各timeout及2真实exit1收据；原自动receipt scan0因元数据无command，补包不改1077索引。114/521冻结、3264/PID10975，当前ownedChrome为宿主snapshot会话；其余P1历史/MAX、P2出站/OKR、F7/native/B8/L8继续。无stage/commit/push/tag/release/正式切换，父出口未准入。
- **2026-10-23 04:43 P0/P1续采**：[capture独立有限PASS](testing/p0-capture-remaining-gui-review-20261023-r1-report.md)已签P0003、P0004 capture支路与capture计量子段，不重跑。新 `P0ContextMetricR1/index-r1.json`695原件：t1材料/t6空材料两真实ask只读投影、退出及确认前全部业务/files/backups字节同；合法description/evidence/repo/branch一项GUI确认、unknown title可见拒绝，旧5标量保；UI clean undo t6包字节恢复，metric ask-apply1/capture1/basis3/undo1/p2空0-null/reload同。新 `P1ProjectionRefreshR1/index-r1.json`379原件：保旧ask，正常task主save只t6负责人/47变化，真实snapshot刷新/时间/更新旁注、打开t6与回旧卡，无第二模型请求。副驾叠在任务抽屉上导致首次cancel未生效/timeout，最小化后可查看字段和顶部关闭，原图/帧保，不自签UX。两封包待独立派审：原capture专家已finished，send_message不能追加；本窗spawn/followup工具未暴露，不伪称已在审。Main继续非重叠P1–P3/native/B8，父总出口未准入。114/521与3264/PID10975/3261网关保持；无新产品源码/build/服务/Git写，两个新seal actualexit0，两P0错等待timeout保。
- **2026-10-23 04:30中断恢复与P0**：旧格式浏览127及[40旁注补审](testing/op-legacy40-supplement-review-20261023-r1-report.md)均有限独立PASS；前一40专家被中断killed且无产物，替补已release。EGO空间13在恢复时`task space not found`，P0原命令尚未执行，失败保；转已有隔离Chrome新owned页继续114/3264/PID10975，现有确定性网关两真实capture请求。首草稿不apply退出业务/filesbyteexact，第二draftId明确apply创建t5/t6、t5首https证据及capture refs2真实落盘，metric1capture/2basis与账本同，刷新重进/证据表单/provenanceconsistent复读。`P0CaptureRemainingR1/index-r1.json`336封存交另一GUI审，仅P0003/4与metriccapture子段，不签P0001/其他metric/P1–P3/B8。原native错误窗口仍具体BLOCKED，Main继续非重叠context/P1–P3，无源码改动、无stage/commit/push/tag/release/正式切换。
- **23:46OP补门已签**：[R2独立有限PASS](testing/op-growth-remaining-gui-review-20261022-r2-report.md)已交，原R1两报告66/保存后字段/错误/日期/todo看板/pending/甘特40-null-manual70指定缺口闭。L8甘特旧文字疑点仍不签wrapped，需核现有刷新同步，旧bare127另审在途。Main原生缩放定位：EGO p3属3265，CDP browser window1617976668/maximized/1470×857，实际1458×734；桌面主窗口21031是旧Launcher，space25559 hidden，不用错窗截图签菜单。继续定位正确窗口与原native/P0–P3/B8，无产品改动或Git提交。
- **23:45补证交审**：`OpGrowthRemainingR2/index-r1.json`348原件、12实际执行收据子集封存交另一GUI专家；两原报告完整66、工时/证据保存字段与两错误正文、日期稳定值、真正todo看板/pending、精确甘特40/null有排期及同任务manual70/objective40已采。07错误等待/12错标签探针失败保，11L8后端wrapped但甘特文字陈旧不代签。另新114/3265/PID16671/runtime `/private/tmp/pmtool-op-legacy-runtime-20261022-r1` 经标准旧格式4502byte预检/两确认恢复，11业务文件只浏览前后byte/SHA/mtime/ctime/inode同，127原件交另一独立GUI审。两补门在途，Main继续原native/键盘及P0–P3/B8；未改产品、未stage/commit/push/tag/release/正式切换。
- **23:27独立两门已交**：114 [完整回归有限PASS](testing/combined-successor114-regression-review-20261022-r1-report.md) 与 [单前缀GUI有限PASS](testing/copilot-prefix114-gui-retest-20261022-r1-report.md) 均已审结；S112-PREFIX-01在原401/429全文及正常恢复范围关闭，旧112失败保留。Main正补OP原专家具体缺口，仍用112/3263/PID7387；`OpGrowthRemainingR2`两份既有报告通过正常横向滚动完整曝光66%，未重生成，待封存交审。继续字段/真正todo看板/精确40及旧包浏览，然后P0–P3/B8/总出口；父目标未完成，尚未stage/commit。
- **23:18新114全回归/GUI交审**：新 `/private/tmp/pmtool-combined-successor114-20261022-r1`114声明/521包输入、directtsc/bundle/noEmit/full161文件1691/DOM3文件17/special2文件7/default95/guard/close全actual0，`CombinedSuccessor114R1/index-r1.json`1687交不同整回归审；首归档扫cache symlink目录EISDIR1保，另lstat不follow封0，不称全程零设施失败。新3264PID10975标准F5真实restore/新client可执行唯一绑定，原401/429全文单前缀、健康后续input解锁，业务/files仅明确prod click timestamp不同；`Successor114GuiR1/index-r1.json`166/6execution全0交另GUI专家。OP943已[有限独立审签](testing/op-growth-remaining-gui-review-20261022-r1-report.md)，精确甘特40/有排期null、todo看板错页/报告完整66%曝光/未入镜字段/旧barebrowse/native门仍留，不冒整OP。下一步114两审→补OP具体缺口→P0–P3六组/B8/总出口/ordinarycommit；旧3260/3262/3263/封包/dirty保，无stage/push/tag/release/正式切换。
- **23:04前缀独立门与OP封包**：前置16–19功能子链和固定MD出口已分别[有限独立签](testing/successor112-predecessor-gui-review-20261022-r1-report.md)/[有限独立签](testing/successor112-fixed-export-gui-review-20261022-r1-report.md)，遮挡/clean取消/日期辅助等边界保；AUTH原因/429/正常有限PASS但双前缀完整提示FAIL。最小两行sidecar修+新test/fixture开发后，[不同SOURCE/AUTO5/250/noEmit有限PASS](testing/copilot-error-prefix-independent-retest-20261022-r1-report.md)，实核114声明/521输入，新[后继114计划](plans/2026-10-22-successor114-prefix-regression.md)已落，Main唯一freeze进行，旧3262/3263仍112。`OpGrowthRemainingR1/index-r1.json`943件/27执行原收据：原F2标准restore、无清单manual40/clear取消零写/clear落null、工时证据合法重开/非法拒保稿、done当天/纠正/revert只读日期、wrapped移P与todo纳回父63→75覆盖2/3→3/4、人工30/0报告均66、人工70甘特/390标签及2354→7387新host回读已交另一独立GUI审。原number/locator/viewport/seal syntax失败保，不签OP整域；精确甘特40/legacybrowse/P0–P3/B8余项仍续。ISS042/KB045沉淀，无stage/push/tag/release/正式切换。
- **22:31新GUI747封存**：[112整回归有限独立PASS](testing/combined-successor112-regression-independent-review-20261022-r1-report.md)已签。新3262/PID92870同EGO13p3标准F5真实预检/两确认恢复，fullclient去宿主省略sourceMap尾注后可执行1719080byte唯一offset875361绑定；原全字节不等记录保。16/17前置选取消重选/隐藏save保t3，18反向成环真实拒原库不变保标题/选择，19解除retry保存重开；21真实401正确失效/22真实429与正常恢复，双“副驾暂不可用”前缀新反证另独立红合同。36真实手动rpt2固定两摘录，41源rv4+软删，43实际UI MD1468byte六字段/两旧正文各一次、报告JSONexact。`Successor112GuiR1/index-r1.json`747原件交三个不同专家，Main不自签；datefill只DOM/真实setterinputchange、locator/等待/copy/CLI挂起与首次seal误纳lane timestamp1均保真，只有明确模式选择时间戳写不同，不称全settings零写。新GUI审/前缀修、OP成长六组/B8/最后普通commit继续，未stage/push/tag/release/正式切换。
- **21:51后继112完整回归**：新独占冻结 `/private/tmp/pmtool-combined-successor112-20261022-r1`、112声明/519包输入，直接tsc/bundle/noEmit、普通160文件1686、DOM3文件17、原stress/probes2文件7、默认95verify、guard/close均实际exit0。coverage lines89.4/branches82.62/functions85.89；主输入/主lib/旧107lib不变。首freeze设施比较笔误exit1与首full上游依赖未解析exit1（159文件1675通过、ask未collect）完整保留，自有依赖入口补齐后full-r2成功，未改产品/旧tests。`CombinedSuccessor112R1/execution-receipts.json`已存原终码，独立整回归审在途。F07[中途提升回滚有限审签](testing/restore-midpromotion-gui-review-20261022-r1.md)已PASS，仅指定回滚子门；旧实例/blocker/573封包保。新3262独立runtime准备中，修后三GUI与原OP成长/B8/总出口及最后普通commit继续，未stage/push/tag/release/正式切换。
- **21:33后继准备**：三修各独立SOURCE/AUTO门齐：rendererR2原13+stress1+probes6+54=74/noEmit0；ask原11+affected199=210/noEmit0；panel正式适配七+真实submit五+18/182+资料DOM5=21文件199，无实际FAIL。旧裸FormData原7仍6绿1红，独立判旧oracle前提、原证保，不产品dummyfield。源码声明去重实核**112**、包519，文件级[后继构建计划](plans/2026-10-22-combined-successor-112-regression.md)已落，Main唯一新freeze/build未执行，新3262尚未起。F07[原小步](testing/restore-midpromotion-gui-case-20261022-r1.md)已真实source37/ae→prechecksuccess→confirmENOTDIR→watch抓项目替换与A创建后回收/13表双byte安全包exact→新87385/3260回读，573封包不同GUI审在途；15首download0byte/首sealexit1保，22重采22byte正确/HTTP未捕。共享1799[有限GUI签](testing/shared-asset-unlink-gui-review-20261022-r1.md)命令断联/另一下载/末断保源/GC0→0，直接UI断联仍未签。ISS039..041/KB043..044已沉淀。全余项/OP成长/B8/父goal/最后普通commit继续，未stage/push/tag/release/正式切换。
- **21:10接续**：[备份/非空恢复/新host](testing/ui-backup-nonempty-reentry-gui-review-20261022-r1.md)有限独立PASS七core/六extra与下载，F07回滚仍缺；[ATF新GUI](testing/atf-combined-runtime-gui-review-20261022-r1.md)有限签rate停链/partialerror不冒计划/正常恢复/busy关闭fresh解锁，AUTH原因仍FAIL、signal取消未签。共享fa1三引用真实host命令依次断联、另一GUI下载22byte、末断不自动删asset/byte、dryrun/apply0，`shared-index`1799件、prior1537同，另独立共享审在途（GC按metadata保护不因taskrefs0自动孤儿）。rendererR2开发74/74/noEmit0交不同复验在途，ask开发11+199=210绿交不同复验；panel统一修受控集合/同步checked在自测收尾，不动旧107实例。恢复故障puretmp布置仅只读explorer在途。父goal/全部余项/普通commit继续，未stage/push/tag/release/正式切换。
- **20:55续采封存**：CombinedGuiR1/continuation-index1537件/25续执行7非零，旧J03468同；备份与ATF已派不同GUI审证。54非空restore→71922新host（精确64680TERM/消失再启动）实际tasks/materials+download/会议/报告/交付物/习惯/OKR回读，六extra与双22byteSHA完整一致，原route留OKRtimeout及按钮含badgeexact误选保；不冒F07回滚或整恢复门。前置搜索隐藏[真实提交独立红](testing/hidden-predecessor-submit-red-20261022-r1-report.md)五项3控2红，原handler/core内存回读清关系，panel两缺陷统一开发；[ask鉴权独立红](testing/ask-auth-feedback-red-20261022-r1-report.md)8控制0/3鉴权1，另ask开发。rendererR1新stressRangeError确证FAIL，R2迭代开发在途原13/54/6有限绿保，Main等三修不同独立门齐再唯一后继build。全余项/最后普通commit继续，未stage/push。
- **20:45新闭件与新缺陷**：[107完整回归审证](testing/combined-repair-full-regression-review-20261022-r1.md)有限PASS 159文件1667断言/95verify，原close/guard标记边界保；[J03新GUI](testing/j03-combined-gui-review-20261022-r1.md)有限签引用/保留放弃0残留/一次t4保存/稳定at2-at3/重开与22byte下载，468原件40图，坏别名等缺证不扩整项。3260同107/runtime精确60387→64680重启、3261仍60386；AUTH真实401被`ask.ts`含Key错误文本改成PROD_KEY_MISSING另独立先行，之前Main缺key设施误诊已更正；429/partial-error无计划/正常恢复/busy关闭新开原证继续。TaskForm前置复选null.checked新[独立必要红](testing/task-predecessor-checkbox-red-20261022-r1-report.md)7项2控绿1控制失败4崩红，panel2938确证，搜索隐藏已选FormData丢项另派真实submit红，不混根因。固定MD renderer单文件+15/-1开发13/54绿交另一独立SOURCE/AUTO在途。网页确认备份47成功、54合法非空恢复成功含安全快照，七core表逐字段一致、六extra原件与双byte包已复制，新host/rollback未采。新原证 `CombinedGuiR1/raw-continuation.md`；全余项/父goal/普通commit仍续，未stage/push/tag/release。
- **20:14接续**：新 `CombinedGuiR1` 自有runtime `/private/tmp/pmtool-combined-gui-runtime-20261022-r1`、host3260/PID60387、确定性gateway3261/PID60386已启动，包归属为107声明的 `CombinedRepairR1/r2`，EGO同space13/p3进入；首次等待PM未打开/欢迎层超时保，观察后关闭欢迎层。原完整F5 JSON14830byte及双22byte侧车已找到并通过新宿主标准路径预检，confirm与GUI采证继续。材料[独立有限审证](testing/material-meeting-report-gui-review-20261022-r1.md)签两拒零写/单信封、会议真转换、current冻结、session来源只读；**固定MD缺已选两摘录/来源有限FAIL**，另派不同专家先行必要红，未改业务/不以旧概括冒成功。三修新GUI、完整备份非空恢复、OP成长/B8及父goal未闭；未stage/commit/push，旧实例/原封包保留。
- **20:04新输出**：Main冻结精确**107**声明/515包输入（19:51估108纠正），r2 `/private/tmp/pmtool-combined-repair-20261022-r2` 直接tsc/tsdown/noEmit/coverage/full/default95/guard/close均0；普通158文件1662测试+独立配置DOM5测试，合159文件1667项全部实际执行，历史key/MaxListeners等警告保。首r1 pnpm因复制身份自动install后build0，不能冒原依赖同字节；原install/警告/产物保，r2新冻结直接工具/原13579依赖复制。尚未新起实例/GUI/独立整回归审，旧U4r2保留。UI备份旧3257真实fail缺file字节，原ENONET返回/零业务写在新BackupRemainingR1，不冒备份完成；完整合法恢复链继续。材料2852封包独立审证在途，父总目标/普通commit未闭。
- **19:51汇合**：ATF[独立SOURCE/AUTO](testing/ai-terminal-independent-retest-20261022-r1-report.md)8/10/43/175及legacy/noEmit/close全0、910保护无漂移；MaterialRef[独立SOURCE/AUTO](testing/material-progress-ref-independent-retest-20261022-r1-report.md)原7/新5/affected194/noEmit全0，原设施失败保。三缺陷门汇合，Main唯一新冻结 `CombinedRepairR1`（108输入声明，新build未完成），旧U4r2不动。`MaterialRemainingR1`2852件/57执行15非零封存交独立：M02两拒零写/合法重建，J02action→t12双关联/取消/来源返回/repeat零写/issue关联解绑，Rcurrent两三元组固定/源rv4软删旧摘录及安全MD实存导出/拒覆盖confirm，Rsession空ID拒/合法保存只读；J03崩溃原证保，修后GUI另新候选继续。父总门/备份恢复/OP成长/B8仍余项，未commit/push/tag/发布。
- **19:19接续**：Cycle不同专家[有限SOURCE/AUTO PASS](testing/cycle-feedback-independent-retest-20261022-r1-report.md)：原10/新29/affected134/noEmit均0，GUI仍待新build。AIremaining[有限GUI审证](testing/ai-remaining-gui-review-20261022-r1.md)关闭再生成真实base/四create/mixed来源，认证/限流分型FAIL及纯非法拒因缺证保。ATF两文件开发已交106后继、8/10/43/175/legacy/noEmit开发绿，不同独立复验在途；r2治理tmp设施越界原证保，r3自有tmp重新执行。Main旧3257材料M02两拒根零变、合法重建仅t1变并重开；J03两资料+文件真实点击c2引用两次使PM卸载/暂存清理，已独立必要红定位，不手改源码。`MaterialRemainingR1`新原证在途，会议旅程继续；B8既有原件精确映射另专家在途，未统一build/commit/push。
- **19:01 ATF先行**：[终止错误独立报告](testing/ai-terminal-failure-20261022-report.md)8控制绿/10必要红，确认terminal error/aborted后部分正文被当成功、硬故障误EMPTY继续池、取消又发下一候选。仅 `ai-client.ts`/必要同域tests的[修复计划](plans/2026-10-22-ai-terminal-failure-closure.md)已派独立开发，不进入Cycle三文件；原verify盲区及首轮设施失败保。新build须等两修复独立SOURCE/AUTO并统一认领，旧GUI仍U4r2，材料/会议/恢复采证可继续。
- **18:58后继**：循环反馈开发仅三产品文件/两tests交回，后继104输入，原10/新29/affected134开发自测绿；不同独立SOURCE/AUTO复验在途，未新build。`AIremainingR1` 506件/19执行含6失败封存，仍认旧U4r2 102冻结：再生成实际base、四create/实体回读、五非法无计划和mixed仅合法riskapplied、auth/rate真实失败与normal恢复交独立GUI。网关路径query设施已另r2修并精确替换24241→26667，host24242/3258不变；产品终止失败被EMPTY误报并继续候选的先行独立红在途。Main继续材料/会议/恢复原旅程；旧封包不改，不把104主源当旧实例已加载。
- [最终范围对账](testing/final-remaining-acceptance-reconcile-20261022.md)已明确父目标未完成、不得统一commit；A20/U4仅各自局部门PASS。继续反馈/副驾/材料旅程/OP成长/文件恢复/B8原合同余项。
- [反馈R3](testing/feedback-remaining-gui-20261022-r3.md)有限签原文/复制/同值quiet迟到copy隔离、可达关闭、O4干净三入口与description-only按钮取消/放弃、O3拒后保稿重试、O5真实S0 0/1→S1 1/1。封存 `FeedbackRemainingR1` 230件、27执行含6失败、49观察，102产品输入无漂移；不签全反馈，确认ESC失败/错误可见性/其他余段保留。
- [循环原因先行](testing/cycle-feedback-reason-20261022.md)确认P2两缺陷：具体关系原因被兜底吞、排查建议误画权限不足。8控制绿/2必要红，最小[修复计划](plans/2026-10-22-cycle-feedback-reason-closure.md)已派独立开发，限tasks/command/ResultCard和必要tests；新修尚未build/复验，不外推旧U4r2已加载。
- [OP/P0–P3继承](testing/op-growth-final-inheritance-20261022-r1.md)保留89原ID并归并最小余动作，不重已签check/GM01/HC01/反思/queue等；未签GUI仍待。
- 新副驾隔离host3258/PID24242、模型依赖gateway3259/PID24241，runtime `/private/tmp/pmtool-ai-remaining-runtime-20261022-r1`，仍加载U4r2旧bundle。EGO唯一space13，p1反馈/p2权威命令/p3副驾；当前prod接线EMPTY失败、gateway零请求，正只读诊断。只真实宿主命令建立合法project/task，不手拼业务库。未commit/push/tag/release，旧服务/共享dirty/微信成果保留。

## 最新收口：A20V3 与 U4 独立总门 PASS（2026-10-22，trae）

- [A20V3 总门](testing/a20v3-total-gate-independent-review-20261022.md)已 PASS；[U4 r2 总门](testing/a13-u4-gui-total-retest-r2-20261022.md)已签 RA-U401、RA-U402、U4 整项 PASS。本轮收口既有缺陷与已承诺排序/列显隐，未新增暂停功能。
- 最终冻结候选 `/private/tmp/pmtool-u4-closure-20261022-r2`：build/noEmit/coverage exit 0，155/155 文件、1590/1590 测试；全部默认 verify 95/95、guard selftest exit 0，保护资产 before=5/after=5、污染 0。Launcher 文件未变，按独立报告继承 56/56 与 verify。
- [U4 交付边界](../reports/all-pending-evidence-20261021/U4/delivery-boundary.json)绑定 A20V3 父候选、10 文件增量 patch、32 GUI 与 39 回归证据；code-review 双轴审查三项治理缺口已关闭。原 FAIL/警告/缺件和 EGO 物理点击兼容边界保留，未写成零警告或工具毕业。
- 正准备选择性暂存清单；普通 commit 尚未执行，须先等独立专家按 remaining acceptance 总登记完成最后范围对账。A20V3/U4 的局部门不外推父任务全部完成。不 push/tag/发布/切正式；3256/3257暂保，3248/3249/3255保留。完整状态见[执行记录](../reports/all-pending-acceptance-execution-20261021.md)最新条目；下方早期在途状态按历史读取。
- 当前由独立对账专家核全部已签/未签、继承、不适用与必要本人条件，Main继续不受影响的归档，按其最小剩余动作续验；微信试点仍另行接续，不以本轮 PM 局部门替代其验收。

## 微信独立本机试点接续（2026-10-21，trae，权限已修复/四群当前画面已采到）

- 所有者提供四群并要求修复-25211；私有白名单已保存。Terminal/TRAΕ辅助功能与Terminal录屏经系统界面修复、重开Terminal复验：doctor0、两权限true、AX0、窗口1。
- 微信4.1.15聊天控件仍不可读，新增本机 `ocr_reader.py`/pilot 的 OCR 配置方式，处理搜索弹层、常用会话分类、前台缓存、剪贴板时序、图片引用和标题图标。r13/r14 同源码连续两轮4/4、失败0，最后可见窗口16条完整文本消息（4/5/2/5），原文/裁图/置信度与当前画面草稿在Git忽略data。
- 25/25专项开发自验、语法、读取指纹与私有权限检查符合预期，未独立PASS。重复核验三群新增0；一群漏识时间分隔，5个窗口条目记gap，不认作真实新增。完整历史/增量完整率/无人值守待验，watch明确拒绝，定时未启动。
- 最新报告 `reports/wechat-pilot-20261021/四群OCR兼容修复与实测.md`、最终源码zip/指纹索引及14轮过程日志已归档；兼容计划 `docs/plans/2026-10-21-wechat-ocr-compatibility.md`。trae后续核历史/时间分隔与增量，再交独立审证；不改下方PM产品候选/门状态，不commit/push。

## 当前接续：持续验完全部积压并最后提交（2026-10-21，trae，在途）

- 负责人明确批准按盘点和EGO/OIL分工持续验完全部已有未验功能并最后commit；未授权本批push/发布。原句、资源owner及状态见[执行记录](../reports/all-pending-acceptance-execution-20261021.md)，总用例见[独立登记](testing/remaining-acceptance-register-20261021.md)。
- **10:29续采（2026-10-22）**：A19GM01有限GUI门关闭；完整回归原结果/531声明源453最终产物有限独立PASS。五旧probe未执行的原candidate扩义另补正，原失败/NOT_CAPTURED保。新增HC01旧习惯卡长OKR裁切确证FAIL，先行合同在途、未改产品；A20/U4等待当前缺陷门。编号视觉两合法值/成功失败全文/零写新87件交独立，手动选择两轮空不冒通过；继续未受影响P0008余件，不重25步五check。全余项/最终独立总门/普通commit仍续，无push/tag/发布，详执行记录10:29。
- **10:12续采（2026-10-22）**：A19不同专家SOURCE/AUTO190项/noEmit有限PASS；新唯一r2输出150files1563tests/coverage/95guard/Launcher56全0、531输入453产物/保护零漂移，原复制中止/缺fixture回归FAIL/五旧probe终检设施失败保。新3249/86987完整client加载/标准F5恢复，建议三态自身标题ID、missing/无关联、1440深/390长文本19步699件交独立，原nav转场timeout保；A19GUI门在途，A20/U4未实施。OKR处理797件与材料组合292件/重开可见43件有限独立PASS，原不足/失败不洗。A20有限计数plan已落等待；全部余项/总门/普通commit续，详执行记录10:12。
- **09:44续采（2026-10-22）**：A19仅habits/新test开发交回，原13红保、新13/10/10/11绿、首affected缺fixture失败保/补原输入131绿、完整noEmit0、502输入153原件/限定保护零漂移；不同专家复验在途，未新build。五check25步1628件796帧准确规则/目标cancel/只读有限独立PASS，无需重采。OKR三suggest→真confirm新draftKR/ignore留痕→重复拒→clear两processed保pending→重进14步797件交独立，nav badge设施失败保，空hero不冒反馈可见。独立余项逐ID对账已交，A20/U4未实施，全部余项与最终普通commit仍续，详执行记录09:44，无push/tag/发布/正式切换。
- **09:25续采（2026-10-22）**：接口完整95原证与依赖/453产物独立有限PASS；反馈正常失败词标题及discard/close后新编辑成功有限GUI PASS（原modal后关闭/标记原因竞争未采BLOCKED保）。真空t8新draftgap/幂等/检查目标open/cancel482件有限独立PASS；原filet3空计数FAIL不洗。A19仅habits/必要tests限定开发开始，A20仅4红/12+31控制先行交回等待。check五规则真实任务/清单设置/同卡5提示逐IDopencancel25步1628件交独立，A18freeze/lib未变，全部剩余与普通commit仍续，详执行记录09:25。
- **09:03续采（2026-10-22）**：A18导入错误GUI有限独立PASS，两格式597原件455帧；正常失败词标题成功/error关闭续采162件在审。已采纳独立AST接口helper与两script唯一断言，另输出noEmit/95guard/selftest/Launcher56/verify全0，保护5文件污染0/453产物同A18，完整原证再独立审证。完整自有依赖13613files1030内部links/外链共享inode漂移0，原10bin历史BLOCKED保。P0-P2补件限定session/queue/导出等PASS但file-only反思材料声明无数量FAIL，t3非空材料不能补gap；A20先行测试准备。A19展示缺陷待当前独立门闭后有限实施，全部剩余/总门/最终普通commit继续，详执行记录09:03，无push/tag/发布。
- **08:55续采（2026-10-22）**：A18有限独立SOURCE/AUTO PASS（原20红保、自有context adapter20/新16绿），新唯一build与固定11.28.5复核149files1552tests/453产物无变；95首93/95两旧静态断言红/保护0，独立准确adapter二绿/8反对照有效，待当前审证释放后主script改与完整重跑。新3248/63429/fullclient绑定/F5恢复，CSVXLSX错误红常驻+全文复制+retry/reopen597件在审；A16G04/四扩展有限GUI PASS，未采再生成执行base保BLOCKED。成长守卫PASS但建议自身OKR展示FAIL，A19先行13红/20控制绿与最小计划待实施，共享10bin前缀漂移诊断保。P0-P2补证83步5755件在审，旧3242无listener后同A13root/source合法重启61433、完整下发/新进程回读另采，退出原因缺证不猜。全部积压/总门/最后普通commit仍续，详执行记录08:55，无push/tag/发布。
- **08:15续采（2026-10-22）**：A18错误context六文件开发已释放，新增13红→13绿/最终16绿，原五TF-F与72/14/PC/扩展/87/53/noEmit0；原20仍19绿1红，旧helper未传context与默认string兼容接缝由不同专家独立核adapter，原红保，不先build。A13旧实例成长补证33步970原件：D+1/D-3真实拒绝、人final/repeat、两suggest仅收件→页面confirm/ignore、重复confirm拒、跨项目关联拒、正常重新关联save/reopen；空hero命令结果不可见及三设施exit1保。新两独立审证与A16原G04/扩展继续，所有积压/总门/最终普通commit未完成，执行记录08:15最新。
- **07:55续采（2026-10-22）**：A17独立原五红已绿但新增20反例19绿/1红，明确catch原因含成功信封标记仍反转success卡消失，完整SOURCE/AUTO FAIL。新A18最小错误context计划/限定开发进行，不构建失败A17；A17空3248只预备未启服。A16四扩展/selection原GUI审证继续，旧freeze/lib/host不变，全部积压/最终commit仍续，执行记录07:55最新。
- **07:47续采（2026-10-22）**：EXT-BASE四红→绿有限独立通过，新A16唯一输出148files1522tests/519输入453产物、build/noEmit/coverage/95guard/Launcher56全0；实际3247/source下发绑定，PC-G01/02/03/min/cleanundo有限独立GUI PASS。selectioncancel/regenerate/四扩展cleanapply4/undo4和正常外改后confirm0原证1008件交审。上传fault/busy及习惯正路径有限GUI PASS，StrictEffects兼容DOM两轮14/14有限独立AUTO PASS；CSV/XLSXbusy/fail/retry/reentry有限PASS但全局英文异常success卡P2FAIL，A17一行catch+14test作者绿已释放、独立复验在途。原停进程/旧trace/未执行成长/矩阵/读屏/U4及最终整门/普通commit仍续，A16旧lib与正式不动，详见执行记录07:47。
- **07:07续采（2026-10-22）**：PC01/02限定独立SOURCE/AUTO PASS（原0/0/1/1→新全0，23/87/noEmit0），但真实父层四扩展缺base四P1 FAIL，新最小计划/限定panel开发进行，未build新输出。三组补件独立有限PASS，旧缺trace/busy及整门保留。新F02真实uploadhold→cancel全根零写、连接失败保输入→重选原件真实201→一次主save新t2/共享fa1→真实重开原证交审；成长习惯今日/两天补记/重复/编辑save与重开已采，剩余仍续。旧A13/A14lib/实例不覆盖，最终总门/commit未完成，执行记录07:07为最新接续。
- **06:47续采（2026-10-22）**：fresh文件/SM01clean-mixed已采业务子项有限独立PASS，main完整下发/原下载安全头/匿名body/再卸载与clean消息真实视口补件交三组独立专家；原BLOCKED/错误留。新导入六preview/非法日期/缺标题列表头原生路径含完整命令/console与根对照已补，busy失败仍待。PC01/02两P1独立FAIL及先行两红成立，A15限定副驾基线/逐步依赖开发进行，旧A14冻结/实例不覆盖；全门/成长/矩阵/读屏/U4/最终commit继续，执行记录06:47为当前接续。
- **06:32续采（2026-10-22）**：SM01有限独立SOURCE/AUTO PASS后唯一新A14输出build/noEmit/coverage0、146files1479tests、95guard/Launcher56与verify0，旧lib不变；新prodgateway3244/host3245/PID25245实际完整client下发、标准F6恢复。fresh空库原生文件取消零残留/两同byte单次save一新资产/重开/22byte下载与匿名401交审；CSV/XLSX六功能子项独立GUI PASS，trace/非法列/busy失败仍缺。新freshhandle mixed保人工改派、clean还原三步原证交审；确认前外改仍被覆盖的疑点已独立合同诊断，不自签FAIL。其余成长/矩阵/读屏/U4/全门和最终commit继续，详见执行记录06:32。
- **06:08续采（2026-10-22）**：A13原生CSV/XLSX六路径已采并交独立审证：各preview/cancel、重新chooser/confirm、非法日期预检拒；CSV t4/t5、XLSX t6/t7正常创建，XLSX同名误选轮保留并按ID补件。取消/非法例只hostsession变、业务/files/backups不变。SM01开发三文件交回121/noEmit0，原A03采样纠正待新独立专家核，不先构建新候选。fresh空库任务上传→下载完整闭环及其余治理/矩阵/U4/最终commit仍续；见执行记录06:08补记。
- **05:56最新候选A13（2026-10-22）**：中文upload/header、staging symlink与import文件名有限独立SOURCE/AUTO通过；新独立输出build/noEmit/coverage0、145files/1467tests、453产物，95verify/guardselftest/Launcher56与verify全0，旧A11/A12/main lib不变。新3242/3243实际宿主与完整client下发已认领，原生中文stage→cancel、同hash两stage→主save/reopen与CSV preview/cancel已采待审，fresh上传/CSV确认/XLSX/非法日期仍续。来源RA-AI01..03独立补审PASS。A14实际A12 mixedapply后最小化丢freshundo入口，独立SM01 P1 FAIL已先行合同与限定开发，未做mixedundo，不捞旧handle。当前总门/剩余旅程矩阵/读屏/U4/模型/最终提交未完，未commit/push；详见执行记录05:56补记。
- **04:39最新候选A12（2026-10-22）**：来源行ID有限独立SOURCE/AUTO16+52+5/noEmit通过，独立输出树build/noEmit/coverage0、143files/1345tests；旧A11lib保留。A12来源十条逐跳、正常改/删源与四次重校原命令/原JSON/真实重启78113→79214已采待审。A11会议局部F01和E01补证独立通过、四档浅深8次explicitcancel零写；总览上卡五态新可见补证待审，Finder新50722/3228与18px/N1N2真实S4待审。全部剩余旅程/矩阵/读屏/U4/模型/最终出口仍未完，未commit/push，下面A11/A7历史数字不代表最新总门。
- **00:39最新候选A11（2026-10-22）**：总览done计数/启动器箭头/会议局部布局均已有限独立SOURCE/AUTO复验；Main隔离build/noEmit/coverage0，142files/1329tests，453产物/source指纹零漂移。新3225/PID32660与3226/PID32661采真实F2/F5/会议主save；A10来源missing及连续两次重校原件已交专家。新界面GUI、剩余完整旅程/全矩阵/层卡/读屏/全97出口尚未闭，未commit/push；后面A7及历史数字不代表最新整门结果。
- **22:32较新候选A7**：回告/全宽拖动/OP三P1/编号反馈/五文件原子缺陷/GG四守卫/两网页备份恢复接缝均已修，独立有限SOURCE/AUTO分别通过；不等GUI或整包放行。A7唯一隔离build0，135files/1262tests与coverage门0、95隔离verify0/五保护文件无变化、Launcher56/56；完整全部verify与真实模型边界及最终审签仍待。
- **真实GUI当前**：新A6main3214/PID45502及A7restore3216/PID54592合法入口与actual完整uncached下发已认领。A6原六卡r5三不同拖/三逆序undo与另savecancel真实reload/download一致，交专家审证；A7路径恢复十三表/双22字节附件一致，cancel零写、真实中文文件下载首hash一致，交专家审证。其余完整旅程、OP四消费/编号视觉、治理32GUI、B8原生200%/读屏及Finder新client重入尚未闭。
- 最小修复/证据/剩余范围沿[22:29持续记录](../reports/all-pending-acceptance-execution-20261021.md)与新plans，A6/A7source/patch/产物/instance分开；主树lib/正式profile/原3172与3199不改。以下1134/49/3205是早期流水，不能替代A7最新状态；仍未commit/push。
- 当前产品=已推送2a76030加未提交batchA修复；HEAD/远端仍9b1a8c5，不用HEAD代替dirty候选。已修路径引用、旧nonce与异步代际、复制新消息及迟到结果；专家复验仍继续，真实GUI/桌面未最终审签。
- 作者最新回归：隔离build/command通过，插件125文件1134/1134、launcher49/49、顺序guard95/95污染0；首轮file-root测试创建空assets造成污染1已保留并修设施，未删WATCH/忽略错误。原证及影响见[候选记录](../reports/batcha-fix-candidate-20261021.md)。
- Main唯一builder，隔离tree `/private/tmp/pmtool-all-closure-20261021`；新宿主3205/PID27767，runtime `/private/tmp/pmtool-closure-runtime-20261021`，独立Chrome已真实进入/新建验收项目。正式3172/PID44388、旧3199/PID880、pm软链/主树lib/正式资产不改。
- EGO两次CLI探测无输出，精确停止对应CLI后用现有Chrome继续；独立专家已核任务表多规则排序/列显隐属既有合同缺口，batchA闭门后有限补齐。下一步Main按batchA新用例冻结/采证，专家审证；不结束当前任务或提前提交。

## 当前接续：整体盘点完成，产品候选已推送待独立审签（2026-10-21，trae）

- [整体盘点与实施计划](plans/2026-10-21-project-status-and-next-implementation.md)为本次状态入口；以下按日期保留流水，旧“17 ahead/未提交”、P2-2 BLOCKED、Excel/客观进度/人员补全未做等状态须结合后续证据读取。
- 本轮已fetch/pull，`HEAD=origin/main=9b1a8c5`；产品候选`2a76030`已提交推送，之后仅文档；开工时无未提交产品代码，仅`.preview/`临时未跟踪目录。
- 尚未找到绑定`2a76030`的专家最终结论。第一批13类/launcher有历史子项PASS、Main复验与1130/97/44自动记录，最终GUI原证、三项自查及TTL合同待核，不能标整体通过。
- `v0.7.4`远端tag已存在，tag对象`30c99e7`→提交`5fdb2d7`（2026-10-14）；当前main含其后增量、包版本仍0.7.4。源码已提交不等发布或正式已加载；旧P2-2 G3已由后续12门PASS终审关闭，当前新版仍另验。
- 当前实施次序：A候选审签/确证修复→B完整旅程与B8验收→C共性工程加固/发布准备→D真实使用与新需求选择。测试专家判定、Main采证、开发修复分开；未放行前不开始新功能。
- [EGO/OIL试点补盘](../reports/ego-oil-pilot-status-20261021.md)：EGO原生网页试用曾成功，后期启动/认证仍不稳定，同条件性能对照未完成；OIL安全审及review补丁静态验证通过，O3/O5真实故障态待采。未找到全量工具替换/设计接管决定；本次建议EGO可用时优先网页操作、OIL作界面评审第二意见，不升格为新强制规则。
- 本轮只盘点与同步文档，未改产品/testing/服务、未重建或跑GUI，未commit/push。37项源码指纹匹配、97条历史退出码均0；本批文档检查不改变产品门。下一步由协调者接审签包、独立专家核合同与证据，角色尚未派发。

## 协作约定已更新：负责人指令检查（2026-10-21，trae，本批提交推送已获准）

- 所有者授权不符合已生效约定时指出冲突、请其完善或暂停相关动作；ADL-058/collaboration §11.7、AGENTS、KB-041 已落盘，自本次授权起使用。
- Agent先查上下文并补工程细节，只对实质冲突暂停；须给具体依据和恢复条件，不把愿景、审美或粗略想法当违规，不把所有复盘建议升格。明确的新规则修订按最新授权处理。
- 本批纯文档，产品候选仍 `2a76030`、最后已推送文档提交 `969f2dd`，专家审签待办保持；不改代码、数据、服务或发布状态。由各后续Agent应用规则，协调者按实际案例检验，当前下一步仍为专家核证。
- 所有者同日另授权本批 commit/push；当前规则提交可用 `git log -1 --format=%H -- docs/collaboration.md` 定位。纯文档检查通过，产品与专家文件零差异，不据此改变产品独立门。

## 当前接续：候选提交与推送获准，准备专家审签（2026-10-21，trae）

- 产品候选已提交 `2a7603023bc54ef13d788e50069ee3fde4671bf3`（`2a76030`）；后续哈希补记仅文档。专家被测产品以此提交及37项源码指纹为准，待推送后接续。
- 所有者原句：“提交代码并推送，准备进入专家审签流程”。本批按授权冻结 Git 候选，不等独立 PASS/发布；此前未授权 Git 状态为历史。
- 审签入口：[`reports/batch1-expert-signoff-20261021.md`](../reports/batch1-expert-signoff-20261021.md)。其中有当前源码指纹、97 项原始退出码、服务快照、自查发现和证据不足项。
- code-review 发现三个待专家核定的实现边界：App 单引号路径、旧 nonce 绑定、ResultCard 新消息复制状态。最终 GUI 归档原证与 TTL 合同也有缺口，不据旧摘要直接签 PASS。
- 下一步由独立测试专家核候选、维护测试合同和缺陷/补采要求；Main 只按既定步骤采证。未放行前不开新功能、不切正式服务、不发布。

## 第一批现有候选验收收口（2026-10-21，trae，四项遗留已修复复验/待独立判定）

- 原始证据索引：[`reports/batch1-closure-raw-evidence-20261021.md`](../reports/batch1-closure-raw-evidence-20261021.md)；证据根 `/private/tmp/pm-batch1-closure-20261021/`。Main 只记录现象，不给整批 PASS。
- 已采：看板连续三拖/撤销/保存/取消、1440 编号和复制成功/失败、真实深色与 OKR/备份错误、schema 合法长历史与超窗零写、Finder 指针双击、路径 P0-P3 配对。
- 已修确证缺陷：宽屏根分组行编号空白；两项路径设施；launcher 控制页空白；Finder 回告失败补试与成功清 hash；连续拖动撤销操作前快照；恢复错误单前缀；复制成功/失败可见且可注入核值。
- 最终 GUI：Finder 启动器自拉起 3199，真实 snapshot 后 S4 且地址栏无 `pm-launch`；三拖三撤销严格逆序回初态；非法备份单前缀；复制显示“已复制”，捕获参数与原文一致。均待独立专家审证，不自判 PASS。
- 回归：launcher 44/44、verify PASS；插件 124 文件/1130 项、build exit0；最终 97 个 verify 97/97 exit0。历史 `verify-real-model` 首轮波动仍保留。正式 3172/PID44388 未变化。无 commit/push。
- 下一步：把更新后的原始证据交独立测试专家逐项审签；在结论前不开始新功能、不发布、不提交。

## 复盘后工作规划（2026-10-21，trae，建议已落盘，未开始产品改动）

- [下一步分批计划](plans/2026-10-21-post-retrospective-roadmap.md)：第一批收口13类体验/launcher候选；同期对齐接续、授权与插件/宿主来源；随后核共性工程缺口、按完整旅程兑现既有设计，再根据真实使用安排新功能。各批按独立门推进，不按历史现象数量估修复量。
- 当前独立报告仍有宽深/连续拖动/错误层级/长历史/Finder等未测项及两项隔离路径问题；已通过子项按同候选和影响范围保留，不写全量PASS。微信是独立已部署试点，待本人权限/白名单后采证，不自动写正式台账。
- 本轮仅只读状态与写规划/交接文档，未build/verify/GUI、未改产品/服务、未commit/push；由当前协调者确认本批范围和执行owner后，测试专家制定/确认剩余用例，有能力者采证，开发只修确证缺陷。

## 本机独立试点：微信 Mac 桌面采集（2026-10-21，trae，已部署/未启动真实采集）

- 所有者已明确批准部署；独立本地工具与现有产品候选分开。环境 macOS15.6.1 arm64/微信4.1.15/Python3.12.15，WeChat-MCP0.3.1 锁提交 `c6c600ae…0164`；运行根 `~/.local/share/wechat-project-pilot/`，数据根 `data/wechat-pilot/`（Git 忽略）。
- 20/20 开发自验、读取模块指纹核对、shell语法和Git忽略检查符合预期；不等独立验收。只读、空群白名单、15分钟间隔、本地规则动态草稿，未发消息/调用云模型/写正式台账/启用登录自启，未改产品或正式服务。
- 实际权限诊断 `doctor` exit2：辅助功能=false、屏幕录制=false、微信已运行、桌面未锁、AX=-25211。**真实群采集与定时运行尚未启用**；下一步本人开启 Terminal 的辅助功能/屏幕录制并提供完整群名，执行端继续真实采证。说明与入口见 `reports/wechat-pilot-20261021/`；本批未commit/push。

## 最新知识沉淀：开放式深度复盘（2026-10-21，trae，文档已落盘，未提交/推送）

- **成果**：[全报告](retrospectives/2026-10-21-deep/00-report.md)、164项现象、360条主摘录+60条补充、73假设逐项校验、五角色两轮对抗与第三轮独立裁决、来源覆盖/指纹与整改清单。TRAE可访问历史不完整，不宣称全对话无遗漏；重复来源不算独立证据。
- **规范同步**：ADL-057、collaboration §11、AGENTS入口、KB-039与ISS-028～032；修订旧授权/历史生成能力及诊断/事务表述。仅文档研究，不改代码/testing，不运行build/verify/GUI，不切正式服务；产品验收结论仍以下方独立报告为准。
- **收尾新增事实**：本机上游 `1142fb74f2` UI提交与只读入口不一致，P-ADD-01/H-ADD-01另作 [边界补审](retrospectives/2026-10-21-deep/08-late-boundary-evidence.md)，实际批准例外与正式宿主版本待协调者核清；不据Git作者身份定责，不自动回退。
- **下一步/由谁继续**：当前开发owner与Main采证者继续下方13类/launcher候选，独立测试专家按既定用例审证；复盘整改涉及代码/测试设施的项先另定计划，不借知识归档开新功能。验证明细见 [文档检查](retrospectives/2026-10-21-deep/07-validation.md)。

## 最新接续：13 类体验修复候选（2026-10-21，doubao-work，未提交 / 未放行 / 非独立 GUI PASS）

> 口径：源码闭合与作者/独立子用例自验 ≠ GUI PASS；独立 13 项 GUI 尚未跑完，未跑项一律 NOT_RUN，不提前判通过。本批未 commit/push，最终 Git 由组织者统一安排。

- **基线**：HEAD `06a131cd5fdc4486dd74afe89cc4c5630f0a4c98`（短 `06a131c`），本地领先 `origin/main` 17 个提交；本批 client 候选与 launcher 候选均在工作树未提交。正式 3172 进程未改，真实 data / 11 张个人卡 / 全部配置保留。
- **候选（未提交，共 9 文件 = 基线 7 + D-10 新增 2；跨 core/client，非仅 client 域）**：
  - P1-1 反馈层级双轨：`core/ui-feedback.ts`（结构化成功信封直接判成功，中文错误关键词仅兜底非结构化裸返回，避免「已修复错误清单/失败项已清零」类成功串误判红）+ `core/ui-feedback.test.ts`；`client/panel.tsx` 恢复/备份/导出 MD/导出 JSON 四处本地成功改走成功信封，错误站点不动。
  - P1-2 OKR 语义对齐：父主归属保持 KR-only（计入权重唯一父目标，primaryOptions 仅 objective）；软关联块全 kind 恒显，新增 `relatedOptions`（全量 OKR，标注目标/KR）由 panel 注入；不砍 kind、不加 schema、不动权重/进度裁决。文件 `client/views/growth-form-props.ts`、`client/views/okr-form.tsx`、`client/panel.tsx`。
  - 就绪回告 bridge：新增纯模块 `client/launch-handshake.ts`(+test)，仅面板挂载且 snapshot 成功后解析 `#pm-launch=<port>.<nonce>`、清参数保业务 hash、POST `127.0.0.1:<port>/api/entered {nonce}`（credentials omit，无 cookie/token，2xx 即止，失败不假成功不重试）；index 注册不算就绪。launcher receiver 由 launcher 执行者写，本 slice 不碰。
  - D-10 空态接线（R5 新增 2 文件）：`client/views/reports.tsx`（空态提前 return 前提取 formOverlay，空/非空分支共用覆盖层）+ `client/views/reports-entry-guard.test.ts`（静态合同）。
- **独立已测（R4 检查点 + D-10 manual 子项，子用例/静态，非全量 GUI）**：bridge 14/14；verify-ui-feedback OK；verify-p2b-okr 26/26；verify-form-validation 通过（ARIA/内联错误留 GUI）；records 域独立 61/61；`pnpm run build` exit0。launcher 候选（执行者另写，未提交）独立单测 42/42、verify exit0。
- **作者主根复跑（开发自验，非独立门）**：`pnpm test` 1118 passed (123 files) exit0；`pnpm run build` exit0；`node scripts/verify-isolation.mjs` 聚合 95/95、失败 0、正式资产 before=after=232 污染 0 exit0（作者主根 guard，非独立门）。
- **13 类 GUI 状态（R4 窄视口 675×745 浅主题；宽视口/深主题未测；子项 PASS ≠ 完整矩阵）**：
  - 权威来源：独立 R4/R5 报告 `docs/testing/independent-acceptance-r4-firstfindings-20261021.md`（sha `986d190d…1e726f`）§7 收口矩阵 + R5.3；下列 PASS 均为窄视口 675×745 浅主题实测子项，宽视口/深主题/dense/自由画布拖拽/危险确认级联/sticky/点按阈值未测，**子项 PASS ≠ 整项 PASS**。
  - D-01 **PASS 子项**：看板卡点 ×移除→↶撤销恢复、自动排版压实且可撤销无模态；**NOT_RUN** 连续拖卡远推空白（675px 虚拟化画布坐标不可靠，不判 FAIL）。旧「删任务 t-0001 缺 undo」为对象误判，已撤回，不新增任务撤销。
  - D-02 **PASS 子项**：配置模态仅 1 个 primary「应用位置与尺寸」、卡片库按概览/进度/列表/指标/内容分组渐进、备份/恢复/导出菜单 0 primary；**NOT_RUN** 宽档互斥细节。
  - D-03 **PASS 子项**：概览 header `static/auto` 不压卡；**NOT_RUN** sticky 滚动叠层。
  - D-04 **PASS**：任务工具条四组（筛选/视图/密度/导出）分组，「新建任务」为 header primary 主位。
  - D-05 **PARTIAL**：窄视口不渲染表格 `.pt-code`；编号格+复制按钮待宽视口（CDP 不可用）NOT_RUN。
  - D-06 **PASS 子项**：新增抽屉仅「添加任务」primary、编辑抽屉仅「保存更改」primary（删除为 danger 非 primary）；**NOT_RUN** 任务删除危险确认级联。
  - D-07 **PASS 子项**：ArrowRight 整体平移 1 天持久化、Shift+→延长 1 天工期持久化（落库 start/due）、里程碑可达、单击选中不弹抽屉；**NOT_RUN** 点按像素阈值。
  - D-08 **PASS**：T1↔M1 里程碑双向关联持久化 + M1 卡回显「关联任务(1)」闭环。
  - D-09 **PARTIAL**：交付核对短 advisory 只读不下完成裁决；**NOT_RUN** 分级配色/顶层错误横幅。
  - D-10 **PASS 子项（R5 manual，非整项）**：空态 form 挂载、source/preview、script/img-onerror/jsHref 探针转义无活元素；manual 10-15~10-21 保存 `rpt-0001`→重开留存、安全渲染，无 AI/key（独立重建 `lib/client.js` sha `1b3f05d7…02733`）；**未测** AI session 来源、宽视口、深主题。
  - D-11 **PASS（草稿路径双向落盘，独立 GUI 双证）**：T1 草稿 select 选 D1→点独立「关联交付物」（待提交 0→1）→主「保存更改」；重开任务 chip 落盘、D1 卡只读反查 T1，零 schema 不回写；即时写 `materialDeliverableCmd` 路径未单独复测。旧 select-only 误判 FAIL 已撤回，误判直连补丁已回退、零代码改动。
  - D-12 **PASS 子项**：软关联通俗解释（仅展示引用/不计权重/不参与裁决）、伪造 `okr-zzz-notexist` 内联拒绝；**NOT_RUN** 错误是否顶层横幅。
  - D-13 **PASS 子项**：同日两次打卡幂等（累计/连续/最长=1，单条）；**BLOCKED** 长历史折叠（后端仅 2 天回填窗，不绕校验，待真实多日或合法 fixture，非产品 BUG）。
  - 运行实例：新隔离 3199 = PID 66544（iso3，旧 33859 已 tester 核 TERM）；正式 3172 = PID 44388 全程只读未动。
- **BLOCKED（环境能力，非产品缺陷）**：B-L1 真实 Finder 双击 E2E——子代理 cu 桌面只能由 Main 操作，不得用终端 `open`/exec 冒充点击，待 Main 采桌面证据交独立判；B-L2 3172 未加载 client bridge（receiver 在 launcher 进程内），不期待 S4，不得把「3172 无回告」当产品 FAIL。
- **app stable 候选（作者已交付，非仓内构建目标）**：两 bundle 均在主交付候选目录 `/Users/bytedance/Documents/dsh-pm-tool/本地启动器候选-20261021/`：`PM工作台.app`（不烤端口，走启动器默认 3172；烤稳定 nvm v22.23.3 node + 仓内 `launcher/bin/pm-launcher.mjs` 绝对路径，identifier `local.dev.pm-launcher`，不写全局/不复制凭据）、`PM工作台-隔离验收.app`（烤 `PM_HOST=127.0.0.1`/`PM_PORT=3199`）。最终根 `/Users/bytedance/Documents/dsh-pm-tool/PM工作台.app` 尚未放置，仅因独立验收未过；`launcher/dist` 只是 make-app 默认输出目录，不是当前 artifact。
- **隔离 worktree 两项 exit1（只读确认，非候选回归，未改测试）**：verify-export 硬编码 `/pm-tool/exports/` 目录名正则；verify-settings 为隔离运行路径/子进程入口（`--reopen` cwd 含空格路径）阻塞，非缺文件（冻结树 `src/index.ts` 实际存在、与主仓同，21091B）。主根 95/95 已绿，独立规范 cwd 待复验，不猜缺树、不删改测试，测试移植性如需修另行界定、不优先展开。
- **下一步**：Main 采集 Finder 双击/控制窗/3199 mounted snapshot ready/有效 nonce S4 与各拒绝例桌面证据 → 独立判；13 项 GUI 跑完据实更新，剩余实证缺陷由 client 统一机制补修（不逐 case CSS、不改数据/11 卡/配置）；docs/progress/handoff/onboarding/changelog 待独立结果后再补「通过」结论。

## 最新限定专项：总览宽高与排版（2026-10-20，doubao-work）

只修看板，未继续全系统迁移。代码已冻结，正式3172已重载；代表卡数字宽高、真实拖缩保存、刷新和服务重启保持均已采证，位置移动/错误恢复/撤销/取消零写已补测。11张卡及全部配置保留，推荐多列布局已通过UI保存，原布局有备份。114文件1025单测+build+94隔离脚本通过；8场景每场11卡实际碰撞和slot越界0。独立代码审查及GUI原始证据专项审证PASS，无阻断项；该局部结果不代表全系统验收。下一步仅交付本专项并等待用户确认。

最后更新：2026-10-18（doubao-work 完成 **P1 深度融合·呈现+交互层**：K11 补记队列/K13 对话内投影/K6 完整版/X6-L2 完整复盘草稿流/K19 保护面组件已实现并 push main；build=0、vitest 326/326、verify-isolation 80/80/0 污染、verify-p1-integration 45/45（真实命令+真实 JSON 落盘+幂等+负例）；未碰 3172；规格 `docs/design/deep-integration-v2-p1-dev.md`、验证 `docs/design/deep-integration-v2-p1-verify.md`、证据 `docs/verification/p1-20261018/`。历史：P0 深度融合·底座+采集闭环已 push；P2-2 Token 2.0 视觉基准仍为进行中候选未放行）

## 当前阶段：P1 深度融合 · 呈现+交互层·已核验（2026-10-18，doubao-work，已 push main）

- **目标**：P0 验收通过后的呈现+交互阶段（S1 完整化 + S3 深化），5 分片并行（文件级互斥）+ 组织者契约层（storage sourceEvent 枚举扩展、queue 骨架与路由）+ 集成验证。
- **已实现 5 项能力**：
  - K11 补记队列（读时派生：到期未达/严重度排序/迟到标识/Top1+折叠/mute 二态+TTL/关键项豁免/K9 缺席/时段静默；命令 queue open|list|mute|unmute|quiet；snapshot 携带 queue；看板队列卡）
  - K13 对话内只读投影（相关任务卡/处理结果/下一步入口；**防过时**——渲染时最新状态+「数据截至」+刷新）
  - K6 完整版呈现（tasks 视图核对卡，三组规则，「提示不代替人验收」）
  - X6-L2 完整复盘草稿流（milestone achieved/deliverable accepted 钩子→完整草稿；关联任务清单+留白；人定稿；deliverableId 存在性/同项目校验补齐）
  - K19 保护面组件（loadFacts 纯事实/stanceSuggestions 建议砍缓/staleStanceTags 烂尾标签；people 负载卡；无裁决无硬上限）
- **验证**：`pnpm build`=0；`pnpm test` 30 文件 / **326 用例全绿**；`verify-isolation.mjs` **80 脚本 / 80 通过 / 失败 0 / 污染 0**（176 资产 before=after）；`verify-p1-integration.mjs` **45/45**；分片自验 p1a 22/22、p1c 22/22、队列卡 SSR 13/13。
- **能力边界**：K11 打开时呈现≠常驻推送（H6 P3 悬置）；mute 不隐藏打开视图；X6-L2 草稿≠定稿；K19 无 WIP 硬上限；K6 只提示；写操作全可逆。
- **下一步**：P2 X7 愿景/OKR 层（K11 周期触发接线点已预留）；H6 P3 立项（先调研宿主通知能力）；K2 窄集复核后扩界；真实宿主渲染与真实 LLM 草稿质量留待用户真实实例复核。

（P0 阶段已收口并 push，详情见 changelog 与 `docs/design/deep-integration-v2-p0-verify.md`，此处不再赘述。）

## 进行中候选：P2-2 Token 2.0 视觉基准（2026-10-17，doubao-work；未提交 / 未放行）

- **范围**：冻结视觉规范（`docs/design/p2-2-visual-token-baseline-20261017.md`，唯一视觉真源）+ 单层语义 token 层 + 对已实现的 P2-1 左导航、P2-5 命名视图/复合过滤/导出/只读快照做视觉校准；不另造功能、不改名、不全局粗替换。**P2-6 AI 溯源治理未启动、零实现**（仅预留 AI 槽位 token，不启用）。
- **开发侧自测（未提交候选）**：`pnpm build`=0；vitest **164/164**；`test:coverage` 退出 0；`pnpm e2e` PASS（console errors=0）；`verify-isolation.mjs` **73/73 通过、失败 0、污染 0**（before=after=169）。
- **脚本修正（不改生产业务行为）**：独立测试 G2 静态/受影响 G4 通过、G1 七项阻塞；开发按当前契约修正 7 个 verify 脚本的陈旧断言——移除已删除的 `progressRatio`/`nextStatus` 导入与断言、`commitDates(id,payload)` quiet 落库契约、`prepareCall` 阶段 `reasoningEffort`（high/off）与 stream 透传一致性、prod 确定性路由/候选链/失败回退、hex 有限语义白名单（mask `#000`、品牌平涂白字 `#fff`，注释先剥离，状态色硬编码仍被拒）；并补边界/反例（progressFill 旁字段不伪造、0≠null、超界钳制、parseProgressInput 非法/空白/NaN/Infinity、路由档位链顺序）。
- **阻塞**：真实浏览器目视门（浅/深 × 1440/768/390）当前执行通道无法采集视觉证据，判 BLOCKED；结构与静态计算不替代目视 PASS，未发布。
- **未做**：未 commit/push/部署；changelog / ADL / 发布登记待独立测试 PASS + 协调人放行后补写；P2-6 AI 溯源治理零实现。

## 当前阶段：#24 测试框架 + CI·已核验（2026-10-17，doubao-work）

- **目标**：不推翻 verify-isolation，引入正式测试体系——① vitest 离线确定性纯函数单测（criticalPath / settings 默认归一化校验 / resolveTaskProgressMeta 客观人工双轨 / validateActions 四实体白名单交叉约束）；② v8 覆盖率门（阈值按本批子集真实实跑略降留余量）；③ 确定性 E2E 固化为可重复 `pnpm e2e`（隔离 DSH_HOME/独立存储备份/非生产端口，DSH_PM_E2E=1 不调模型不出网）；④ GitHub Actions（build/verify-isolation/vitest+coverage 必经，e2e 独立 job，real-model smoke 不进必经）。
- **实现**：
  - `vitest.config.ts`：node 环境，`include src/**/*.test.ts`，v8 `include` 收窄 settings/copilot/progress-derivation/gantt 四模块，阈值 lines40/branches80/functions35/statements40（实跑 45.02/86.25/42.37/45.02 留余量）。
  - 4 个 `src/core/*.test.ts`：gantt.criticalPath(8)/settings(6)/progress-meta(5)/copilot-validate(10)，共 29 用例，纯离线零网络。
  - `tsconfig.json` exclude 测试文件（不进 lib bundle）；`package.json` devDeps 加 vitest/@vitest/coverage-v8/puppeteer-core，scripts 加 test/test:coverage/e2e。
  - `scripts/e2e.mjs`：自启隔离宿主/临时 DSH_HOME/非生产端口/puppeteer-core 真实 Chrome 断言渲染+console 干净，缺 harness/Chrome 时 SKIP exit 0，ISS-027 单 PID TERM。
  - `.github/workflows/ci.yml`：core job（Node22+pnpm，install→build→verify-isolation→test:coverage），e2e 独立 job（headless chromium，缺 harness SKIP）。
- **验证**：`pnpm build`=0；`verify-isolation.mjs` **73 脚本 / 73 通过 / 失败 0 / 污染 0**（before=after=165）；vitest **29/29**，子集 All files lines 45.02/branches 86.25/functions 42.37 过门槛；`pnpm e2e` 本机可重复 PASS（端口 3171 用完即 DOWN，正式 3080=PID 66364 未变、3091 未监听）。本机无 gh 登录，未观测 GitHub Actions 实跑。
- **边界**：未改任何业务 src 逻辑/存储 schema/模型路由；只加 devDeps；版本仍 0.7.4、不打 tag；real-model smoke 不进必经；覆盖率门槛仅针对本批模块（其余 core 由集成门覆盖）。
- **下一步**：看板 P2（联动过滤/卡片元素增强/completedDate 历史趋势 UI/markdown 增强）→ 9 视图重设计；prod 真实 Key 仍 MANUAL_PENDING；CI 端 e2e 因缺宿主为 SKIP、GitHub 实跑待有 gh 环境复核。

## 历史阶段：#23 客观进度补全·已核验（2026-10-17，doubao-work）

- **目标**：补 v0.7.4 deferred 的客观进度四件事——doneAt 完成日期、effort 实际工时、evidence 证据链接、人工 override（显式「人工设定」标记，与客观派生区分、保留来源口径）；客观进度以清单 checked/total 派生，无信号显「证据不足」不伪造百分比；派生纯函数只读无 I/O；新字段加法式、可选、向后兼容、旧数据安全读入、无需迁移。
- **实现**：
  - `core/task.ts`：加法式新增可选 `effortHours`(≥0 数)、`evidenceUrl`(≤2048 trim)、`manualProgress`(0..100 int，null 清除)、`manualProgressNote`(≤500)；create/update schema 与校验标签同步。
  - `core/progress-derivation.ts`：纯函数 `resolveTaskProgressMeta(task, derived)` 返回 objective/manual/display/mode/manualNote；`deriveProgressMap` 客观派生零改动。
  - `core/tasks.ts`：`manualProgress===null` 时连带清除 `manualProgressNote`。
  - `client/panel.tsx`：TaskForm 只读客观块（清单 fraction + 客观值/证据不足 + 完成日期）+ 工时/证据/人工设定输入与橙色「人工设定 n%」徽标/清除按钮/备注；本地 Task 类型补可选字段。
  - `client/panel.css`：`.pm-meta-*`/`.pm-manual-*` 样式，消费 `--pm-*`（`--dsw-*`）零 hex，跟随 `body[data-ds-dark-theme]`。
- **验证**：`pnpm build`=0；`verify-isolation.mjs` **73 脚本 / 73 通过 / 失败 0 / 污染 0**（before=after=165）；新增 `verify-task-meta.mjs`（effort/evidence 读写缺省、人工显式标记不污染客观、清除回落、旧记录无新字段安全 parse、done↔completedDate 关系，离线确定性）。隔离真实 Chrome headless（独立 DSH_HOME/存储/备份/端口 **3162**，正式 3080=PID 66364 未变、3091 未监听，ISS-027 单 PID TERM）：浅/深两趟人工态（证据不足+3.5h+证据链接+人工 30% 徽标）与客观态（2/4=50%、无徽标）逐项 OK、0 console error。证据 `docs/verification/progress-meta-20261017/`。
- **边界**：仅加法式可选字段、不改既有字段语义、不破坏性迁移；客观派生逻辑零改动；零新增外部依赖；不做 #24 vitest/E2E/CI。
- **下一步**：看板 P2（联动过滤/卡片元素增强/completedDate 历史趋势 UI/markdown 增强）→ 9 视图重设计；prod 真实 Key 仍 MANUAL_PENDING。

## 历史阶段：#22 AI 副驾写操作扩展·已核验（2026-10-17，doubao-work）

- **目标**：副驾 explorePlan/apply 从仅 `task.update` 扩到里程碑、风险、交付物、会议四类实体，每类支持「创建 + 更新」；保持 HITL（确认草稿卡，确认才落库、取消零写），复用既有 ask-apply 后端守卫，零存储 schema 改动，乐观锁冲突跳过、重复 apply 幂等。
- **实现**：
  - `core/copilot.ts`：`ALLOWED_OPS` 扩到 8 个实体 op；四类实体字段白名单 + 枚举/交叉约束校验（risk 必须 probability、禁 solution；issue 必须 probability=null、禁 responsePlan；deliverable 用 `name` 非 title；meeting 校验 meetingDate/startTime HH:mm/durationMinutes 1-1440/数组字段）；`validateActions` snapshot 扩为可选四实体 id 集合，`task.update` 逐字节不变。
  - `commands/ask.ts`：`applyCore` 按 op 分发——create 注入 projectId 调 `addMilestone/addRiskIssue/addDeliverable/addMeeting`；update 查记录、核 projectId、比基线 `updatedAt`（不一致 `DispatchSkip` 跳过不覆盖）调 `updateMilestone/updateRiskIssue/updateDeliverable/updateMeeting`；`task.update` 仍走 `updateTask`；幂等键 SHA-256 命中拦截重复 apply。
  - `core/ask-copilot.ts`：`COPILOT_SYSTEM` 放开四类实体 create/update 并写明字段口径。
  - `client/panel.tsx`：`CopilotPanel` 收四实体清单并传 id 集合给校验；`task.update` 保留行内编辑，其余 op 渲染只读实体摘要卡（新建=新值；更新=旧值删除线→新值），徽标区分「新建X/更新X · id」。
  - `client/panel.css`：实体徽标/摘要/行样式，颜色复用 `--pm-*`（底层 `--dsw-*`）零 hex，跟随 `body[data-ds-dark-theme]`。
- **验证**：`pnpm build`=0；`verify-isolation.mjs` **72 脚本 / 72 通过 / 失败 0 / 污染 0**（before=after=165）；新增 `verify-copilot-writes.mjs`（四类实体 create/update 解析校验、确认落库、取消零写、updatedAt 冲突跳过、幂等、非法/未知动作安全忽略、跨项目拒绝，离线确定性）。隔离真实 Chrome headless（独立 DSH_HOME/存储/备份/端口 **3161**，正式 3080=PID 66364 未变、3091 未监听，ISS-027 单 PID TERM）：浅/深两趟均 8 步草稿（4 新建/4 更新）、整批应用 8 步、取消零写、served bundle 含实体卡、0 console error。证据 `docs/verification/copilot-writes-20261017/`。
- **边界**：零 schema、零新增外部依赖；模型路由层只读不改；不做 #23 客观进度、#24 vitest/E2E/CI、#25 窄窗（已并入 main）。
- **下一步**：看板 P2（联动过滤/卡片元素增强/completedDate 历史趋势 UI/markdown 增强）→ 9 视图重设计；prod 真实 Key 仍 MANUAL_PENDING。

## 历史阶段：#25 真 390px 窄窗响应式正式修复·已核验（2026-10-17，doubao-work，已并入 main）

- **目标**：GI-WEB-14 / PROD-07 遗留的真 390px 窄窗从 MANUAL_PENDING 转正式修复；390px 视口下面板骨架（顶栏/抽屉/弹窗/表单/按钮组）+ 9 视图无重叠/裁切/横向外壳溢出，≥1024 桌面不变。
- **做法**：全部窄屏规则隔离在 `@media (max-width:560px)`，不命中桌面；天然宽内容（任务表 `.pt-scroll`、甘特 `.pm-gantt-scroll`、数据表 `.pm-table-scroll`）容器内部横滚，外壳不溢出。
  - `panel.css`：顶栏换行/内距收敛、项目菜单钳 92vw、抽屉 `min(560px,100vw)`+单列表单、move-picker 不锁宽、副驾编辑行 6→2 列、矩阵 3→2、图例换行、旧人员名列不锁 130px。
  - `tasks.css` 搜索通栏/工具条换行/主按钮通栏；`people.css` 固定 6 列网格→可换行卡片（隐藏表头、卡片头纵向、说明可换行）；`meetings.css` 行动项 4 固定列→单列堆叠；`milestones.css` 概览条换行/率格不锁 180；`risk-issues.css` 内距收敛/矩阵首列 44/第二行换行；`deliverables.css` 双栏→单列；`gantt.css` 工具栏换行/左标签 150px/时间轴内部横滚；`overview.css`/`reports.css` 补 ≤560（快照 7→3 列）。
  - 顺手去两处硬编码白：`.pt-primary` `#fff`、`.pm-chip-primary` `rgb(255,255,255)` 均改 `--dsw-alias-label-primary-foreground`。
- **验证**：`pnpm build`=0；`verify-isolation.mjs` **71 脚本 / 70 通过 / 1 失败（仅 verify-export.mjs 硬编码 `/pm-tool/exports/` 路径在 worktree 下不匹配，已知环境假象，非回归）/ 污染 0**；`verify-gui-contract.mjs` 补 #25 静态契约（每视图+骨架含 560 断点、零 hex、内部横滚容器）。隔离真实 Chrome 390px（独立 DSH_HOME/存储/备份/端口 3155，软链指 worktree 包，正式 3080=PID 66364 未变）：真实响应体证明聚合包含 #25 标记+560 断点，浅/深 ×9 视图+新建抽屉 20/20 无外壳溢出。证据 `docs/verification/narrow390-20261016/`。
- **边界**：零新增依赖、零 schema、零业务逻辑、未改 tsx DOM 契约；不做 #22/#23/#24。
- **下一步**：待协调者在主树恢复全绿后统一 rebase/合并到 main；之后看板 P2 → 9 视图重设计。

## 历史阶段：#21 口径配置化·已核验（2026-10-16，doubao-work）

- **口径清单（原值→设置键，现值即默认）**：健康分每逾期任务 3/每受阻 4/每高风险 6/每严重风险 10/每逾期里程碑 8；封顶 15/12/20/16；灯线绿 80/黄 60；临期窗口 7；过载阈值 5。`core/stats.ts` 逾期为严格 `dueDate<today`、本无数字阈值，不杜撰宽限键。
- **core 可注入、缺省回落**：新增 `core/settings.ts`（默认值锁定、`SETTING_FIELDS` 元数据、`normalizeProjectSettings` 整数/区间/灯号倒挂校验、`sameSettings`）；`scoreFromInputs/computeProjectHealth/computeReminders/groupOpenTasksByAssignee/computeKPI/buildAgenda` 接受可选 settings，不传=默认（默认等价），命令行显式参数优先；纯函数/确定性/零写。
- **持久化/命令/UI**：`commands/settings.ts`（`/pm settings` 查看 / `put <json>` 局部合并+整份校验 / `reset` 回落默认），settings 表透明存取+原子写；`web snapshot` 透传 `settings`；顶部「更多」→「口径设置」抽屉，13 字段分组、整数/区间/绿灯≥黄灯内联校验、保存/恢复默认；配色 `--pm-*`（`--dsw-*` 重映射）零 hex，跟随 `body[data-ds-dark-theme]`。
- **验收**：`pnpm build`=0；`verify-isolation.mjs` **71/71 通过、失败 0、污染 0**（before/after=162/162）；新增 `verify-settings.mjs`（默认等价/覆盖/非法/局部合并/reset/全新进程 --reopen 读回/UI 契约/零写 grep），`verify-health.mjs` 补自定义覆盖，`verify-gui-contract.mjs` 补 #21 静态钩子。隔离 Chrome 3141 浅趟默认抽屉→改绿灯线 80→60 保存→概览灯号黄→绿；深趟原生 dark 抽屉。证据 `docs/verification/settings-20261016/`（10-light / 11-after-change / 12-dark）。
- **边界**：不做 #22 副驾写扩展、#23 客观进度、#24 vitest/E2E/CI、#25 390 窄窗；不配生产 Key。
- **下一步**：看板 P2（联动过滤/卡片元素增强/completedDate 历史趋势 UI/markdown 增强）→ 9 页面重设计；GI-WEB-14 真 390 窄窗目视、prod 真实 Key 仍 MANUAL_PENDING。

## 当前阶段：GI-CP 关键路径只读高亮 CPM·已核验（2026-10-16，doubao-work）

- **core 纯函数 `criticalPath(tasks)`（src/core/gantt.ts）**：predecessorIds 依赖图 AON 正/反向遍历，ES/EF/LS/LF（相对组件起点天偏移）、slack=LS−ES，**slack=0 → 关键路径**；确定性、无 I/O、无随机、无墙钟、不调用 run/execute、不回写派生字段、零 schema。
- **诚实降级**：成环 3 色 DFS 标 inCycle、跳过遍历不高亮、不自动打断/改期；缺日期标 missingDate、不补日期/不顺延；自指/悬空计数剔除；多连通分量（并查集）各自取组件最大 EF，短分量无假正时差；多结束汇点 LF=组件最大 EF、内部 min 传播；空输入不抛。
- **甘特只读高亮（gantt.tsx/gantt.css）**：关键条 `pm-gantt-bar--critical`（2px 强调环+淡衬底，ring 不被 overdue/blocked 覆盖）、关键边 `pm-gantt-link-path--critical` 加粗+强调箭头、图例「关键路径 N」、「循环不可计算」「缺日期段已跳过」徽标与 tooltip、条 tooltip「关键路径（总时差 0 天）」、左标签「关键」徽标；配色全走 dsw 别名 token（底层 `--dsw-*`）零 hex，跟随 `body[data-ds-dark-theme]`。
- **验收**：`pnpm build`=0；`verify-isolation.mjs` **70/70 通过、失败 0、污染 0**（before/after=162/162）；新增 `verify-critical-path.mjs`（线性链数值/时差分支/成环/缺日期/多分量/自指悬空/空输入/确定性/零写静态 grep），`verify-gui-contract.mjs` 补静态钩子。真实 Chrome headless 隔离 3131（独立 DSH_HOME/存储/备份，正式 3080=PID 66364 未变）：GI-CP-01 链三条+关键边 2/3+图例+tooltip；CP-02 成环不高亮；CP-03 缺日期无条+未排期；CP-04 深色趟零写哈希一致；CP-05 拖链尾 t-0003 前置 t1/t2 逐字节不变、progress/pred 不动、不顺延。证据 `docs/verification/gui-critical-path-20261016/`（10-light / 11-after-drag / 12-dark）。
- **边界**：只读显示；自动排期/压缩/改期（甘特B 长期观望）本批不做；vitest/E2E/CI 留 #24；不配生产 Key。
- **下一步**：看板 P2（联动过滤/卡片元素增强/completedDate 历史趋势 UI/markdown 增强）→ 9 页面重设计；GI-WEB-14 真 390 窄窗目视、prod 真实 Key 仍 MANUAL_PENDING。

## 历史阶段：看板 P1 拖拽落列/筛选级联/迁移链/窄卡省略·已核验（2026-10-16，doubao-work）

- **P1-① 拖拽像素落列**：编辑器 RGL 启用 isDroppable + onDrop，按松手像素换算的 layoutItem.x/y 落位（点 ＋ 仍追加末尾兜底）；真实浏览器拖拽「任务状态环」落栅格中部、非末尾；onDrop 增加坐标兜底防御。修复阻断缺陷：卡片库原 in-flow 挤压栅格到 7px，改为工具条独占一行、卡片库为左侧窄抽屉、栅格在右侧保持真实宽度并正确重算 colWidth。
- **P1-② 切实体二次级联**：切换数据源实体后，字段选项更新、已选筛选字段/操作符/值整体清空，不残留旧实体筛选；字段→操作符按类型联动。
- **P1-③ 迁移链补全**：persist 迁移改为有序 MIGRATIONS + stepMigrations 逐级 1→…→LAYOUT_VERSION（缺级/跳步抛错，保留 v1）；新增 verify-migration（v1 保留、跳级拒绝、合成链 v1→v2→v3 逐级经过）。
- **P1-④ 窄卡省略**：项目名 flex+min-width:0+单行 ellipsis+title 全名，窄卡不溢出不撑破。
- **验收**：pnpm build=0；verify-isolation 68/68、0 污染（before/after=160/160）；块结构 client.js（gzip≈202KB）+ client.editor.js（≈76KB）+ client.formula-expr.js（≈11.6KB），编辑器块自包含；深+浅截图见 docs/verification/p1-*.png。
- **下一步**：看板 P2（跨卡片联动过滤、卡片自定义元素增强、completedDate 历史趋势真实数据 UI、markdown 富文本增强）→ 9 页面重设计（先出深+浅设计稿待确认）。

## 历史阶段：看板 P0 编辑态异步拆分 + 持久化迁移 dsh-storage·已核验（2026-10-16，doubao-work）

- **成果**：看板浏览态首屏 gzip 由 288.77KB 降到约 **202KB（净回收约 86.6KB / -30%，超出约41KB预期）**；看板布局由 localStorage 改为经 dsh-storage（pmtool 领域 settings 表）跨设备持久化。
- **编辑态异步拆分**：浏览态用纯 CSS 静态栅格渲染、不再静态加载 RGL/zod/expr；编辑器（RGL+卡片库+配置面板+zod 闸门）拆为 `lib/client.editor.js`（gzip≈75.75KB）、公式 expr-eval 拆为 `lib/client.formula-expr.js`（gzip≈11.58KB），均在需要时经 `require.async` 加载；`tsdown.config.ts` 复刻宿主分块机制（client.[name].js + chunk banner + 动态 import 改写）并做运行时 helper 内联与死引用清理，保证异步块自包含。
- **持久化迁移**：新增后端命令 `src/commands/dashboard.ts`（`dashboard put/reset <scope>`）、`web snapshot` 新增 `dashboards:{user,project}`；前端 `persist.ts` 去 localStorage/zod 改结构校验 + 迁移，读写经 execute，`panel.tsx` 经 GlobalBoard 透传；保存中/失败有提示、失败不落盘。
- **提前落地的 P2 后端地基**：Task 新增可选 `completedDate`（状态流转自动采集：非 done→done 记当天/显式日期、done→其它清除）；新增纯函数 `buildCompletionHistory`（只统计真实 completedDate、零数据显式空态、不造假）；新增 `task backfill-completed`（旧 done 据 dueDate 显式推断、无据不编造）。
- **验收**：`pnpm build`=0；`node scripts/verify-isolation.mjs` 67/67 通过、0 污染（before/after=160/160）；新增 verify-dashboard / verify-completed-date，扩展 verify-client-bundle、verify-formula 改指；真实 dsh 宿主（dev 重启 PID 70706/3080）：编辑器块请求 200（无 404）、加卡→保存→整页刷新后仍在、恢复默认→刷新后回默认。深色+浅色、浏览态+编辑态截图与证据见 `docs/verification/p0-bento-perf-20261016/`。
- **下一步**：看板 P1（像素落列/筛选二次级联/迁移链补全/窄卡项目名省略）→ P2（联动过滤/卡片元素增强/completedDate 历史趋势 UI/markdown 增强）→ 9 页面重设计（先出深+浅设计稿待确认）。

## 历史阶段：稳定性地基 S4 + war-room KPI 热修 v0.7.4·19/19 PASS + 真实 Chrome PASS（2026-10-14，doubao-work）

- **背景**：v0.7.3（`eb41b30`）之后的稳定性补丁——不含新业务功能，只做地基加固与一处真实 KPI bug 热修。**全程零 schema**（domain 仍 v1、表集合未变，`taskStatusSchema=z.enum([todo,in_progress,blocked,done])` 拒收 `doing`）。
- **A1 fs-atomic 契约（`src/core/fs-atomic.ts`）**：`atomicWriteFile` 发布协议「同目录 tmp `.{basename}.{uuid}.tmp` → `open(tmp,'wx',0o600)` 排他 → write → fsync → close → `rename` POSIX 原子覆盖 → fsyncDirectory」；rename 前 open/write/sync/close/rename 任一失败，`finally` 仅在 rename 未发生时 `rm(tmp,{force:true})`，**目标文件逐字节不变、tmp 不残留**；rename 后目标即新内容、tmp 已消失。新增可选 `options.tmpNameFactory` **仅测试注入**（制造确定性 tmp 名/真实 EEXIST），生产不传时仍默认 `randomUUID`、对外行为完全不变。专项 `verify-fs-atomic.mjs` 退出 0（含 wx EEXIST 排他闭环 A1-02）。
- **A2 LLM optional 真实 Context（`src/index.ts` + `ai-client`）**：llm **不再列入 inject**（缺 llm 的 profile 仍激活插件），运行期 `ctx.reflect.get('llm',false)` 懒读真实 Context、命令被调时才取并透传 task/meeting/report 三条 AI 命令；缺 provider 时 `generateDraft` 抛中文 `NO_LLM` 降级、核心 domain 与全部非 AI 命令离线可用、业务零写；硬错误码不跨池轮换、英文/stack 不外泄；有 fake llm 走 generateDraft+兜底路由。专项 `verify-llm-optional.mjs` 退出 0。
- **A3 verify runner 聚合 + timeout 分类 + 资产 manifest（`scripts/verify-isolation.mjs`）**：主循环改为任一子进程失败也记录但**不 break**，全部 62 个 `verify-*.mjs` 跑完后聚合「共 N/通过 P/失败 F」；超时（默认 10min/个，`PM_TOOL_ISOLATION_TARGET_TIMEOUT_MS` 可调）经 `describeFailure` 对 `ETIMEDOUT`/`killed` **单独分类为「超时（上限…实际…）」**、不误落 spawn 异常；子进程 env scrub 剔除 `PM_DATA_ROOT`/`DSH_PM_BACKUP_DIR`（只打变量名不打值）；正式数据/备份/导出 root（守护清单见 `verify-isolation.mjs` 的 `WATCH`）跑前跑后各算一次 sha256+mtime manifest 做集合 diff，任一新增/删除/变 hash/变 mtime 即单独计污染失败；退出码无歧义（任一脚本失败或污染→exit 1，全绿 diff 空→exit 0）。`walk/buildManifest/diff/WATCH/runOne/runGuard` 导出供 `test-isolation-guard.mjs`/`test-verify-runner-aggregate.mjs` 复用同一套判定。
- **war-room「进行中」KPI 热修**：根因 `computeKPI` 误判 `status==='doing'`（真枚举 `in_progress`）致「进行中」KPI 恒为 0。`status.ts` 新增纯谓词 `isDoneStatus`/`isInProgressStatus`（`TASK_STATUSES` 未变）；`war-room.ts` 的 inProgress 改用 `isInProgressStatus(t.status)`（修复点），done/overdue 抽闭包 `isTaskDone=isDoneStatus(s)||progress>=100`、KPI 与 buildAgenda 复用、语义不变；`verify-war-room.mjs` 补真枚举五态回归守卫。
- **口径与边界**：**零 schema**（不新增表列、不升 domain、不改落盘布局）；不自动排程/改期/顺延，doctor 仍只读不自愈。**v0.8「客观进度」（checklist/progress-derivation/汇报 calcVersion）矩阵已冻结但未实现（NOT_RUN/deferred）**，本批只携带其前置 war-room 热修，不声称已交付。
- **验收（S4 独立测试专家实测）**：总门 **✅ 19/19 PASS**；`pnpm build`=0；全量 guard **62/62** 专项全绿；权威资产 **before=160/after=160、污染 0**、退出码 0。矩阵 `docs/testing/stability-s4-acceptance.md`，证据 `docs/verification/stability-s4-20261014/full-guard.txt`。
- **验收（war-room 真实 Chrome 隔离实例）**：真实 Chrome v139 headless（puppeteer-core，无 Key）独立 `DSH_HOME`+独立 storage root+独立备份目录+端口 **3122**；面板表单构造 p-0001+5 任务，KPI 实测 总数5/完成率40%/**进行中=1（blocked 不计；修复前渲染 0）**/逾期1/状态分布2·1·1·1/议程仅一条逾期/磁盘 5 条全真枚举/console·pageerror=0；`verify-war-room.mjs`、`verify-web.mjs` 退出 0。证据 `docs/verification/gui-war-room-status-20261014/`。
- **计数差异（如实分开，非矛盾）**：S4 guard = **160**、war-room 轮 = **159**——两轮计数差异为**跨轮 session / 缓存文件自然轮转**所致；每轮内部均严格 before=after、污染 0，属各自独立零污染结论，非正式资产漂移。
- **ISS-027 精确 PID 流程（继续遵守）**：隔离 PID 8436（首轮 patch root 误指上一轮 scratch）→修正重启 PID **9859**，均 `--port 3122`/`--no-open`；仅对 8436/9859 分别 `kill -TERM` 一次验 EXITED、3122=DOWN；正式 3080=PID 93536/3091=PID 93537 启动前后均 LISTEN、PID 未变。首轮 5 条误写仅落 `.tmp` 隔离 scratch、已清，正式 `data/` 未受影响。
- **零污染 / client hash（已实测锁定）**：S4 **160**、war-room **159** 资产均 before=after、changed/added/removed=0；`shasum -a 256 packages/dsh-pm-tool/lib/client.js` = `9d0b118c6f469856c5c7caee52175a88b0a2082fc4333daf2b2a45bc2302aa8b`（**332510 B / 332.51 kB**，最终 build 已稳定、实测锁定）。
- **状态**：本批仅回写版本/living docs 口径（package.json 0.7.4 + releases/README/changelog/progress/handoff/onboarding），**未改产品 src、未改测试专家 docs、未改证据、未提交**。
- **下一步**：待用户授权执行最终 commit/注解 tag `v0.7.4`/push（client sha256 已实测锁定 `9d0b118c…`）；v0.8 客观进度实现、GI-WEB-14 真 390 窄窗目视、GI-CP 关键路径、M-01 prod 真实 Key 仍为后续/人工项。

## 历史阶段：甘特拖拽手感与成功提示热修 v0.7.3·代码审查 APPROVE / Chrome 22 项全绿 + 回归 7/7 PASS（2026-10-14，doubao-work）

- **背景**：用户在 v0.7.2（`310c768`）实测反馈——拖拽成功后弹出**全字段深色大卡 Notice**（任务ID/WBS/项目/父任务/标题/说明/负责人/状态/优先级/起止/进度/里程碑 13 行 dump），盖住甘特工作台（与 `ClipboardTemp/f97c15cd….png` 一致）。
- **功能（热修）**：①根因修复 `.pm-gantt` 无 `flex-wrap` 时，hint(`flex-basis:100%`) 与 labels(230px)/scroll(flex:1) 挤同一 flex 行竞争，致 `scroll` 被 shrink 到宽 0（画布消失）；加 `flex-wrap:wrap`，hint 独占下一行，首行宽度不随 hint 出现/消失变化。②拖拽走 `run(...,{quiet:true})`、单 refresh：松手即落盘+就地重渲染，日期即时更新无需 F5，移除 `onSaved()` 二次刷新。③quiet 成功不弹全字段大 Notice，改条下 inline `role=status`/`aria-live=polite`「已更新：起 ~ 止」约 3s 自清除。④`saving` inflight 锁：保存中禁连拖、`finally` 解锁，防并发覆盖/ghost。⑤失败回落：条体从未本地改动、未 refresh 自然回落拖前坐标无残影，内联「更新失败，请重试」6s；quiet 不吞错（run catch 仍 `setMessage`，全局错误红框 Notice 保留）。⑥unmount `clearTimeout` 清状态定时器；payload 白名单仍仅 `startDate`/`dueDate`。
- **口径与边界**：**零 schema**（只读既有 startDate/dueDate/progress/predecessorIds，不新增表列、不改 taskRecordSchema、不升 domain、不动 storage.ts）；不自动顺延后继；仅动 `src/client/panel.tsx` 交互层 + `panel.css` 一行 flex-wrap（产品代码热修另计，本批只回写文档口径）。
- **验收（真实 Chrome 隔离实例，执行端采证 + 测试专家回填）**：真实 Chrome v139 headless（puppeteer-core，无 API key），独立 `DSH_HOME`+独立 storage root+独立备份目录+空闲端口 **3120**；**22 项全绿**（拖前 clientWidth=768>0 / 拖后 bars=9·svg·arrow 均在 / 拖拽即时更新无需 F5 / `.pm-notice` count=0 无全字段大卡 / inline role=status 文本正确 / ~3.5s 自消 / 连拖只落≈1 步无 ghost / <4px 点开抽屉零写 / 横滚 220px 后拖不误触 / 父虚线派生条不可拖 / 故障内联错误 / 故障全局错误不被 quiet 吞 / 故障条 geom 576px 前后一致回落 / 故障服务端零写 / 重载读回 bars=9 / 重启读回 progress=40·predecessorIds 未动 / console·pageerror=0）；静态契约 `scripts/verify-gantt-drag.mjs` 退出 0（A flex-wrap / B quiet 单次 refresh / C catch 不吞错 / D saving 锁+unmount timer / E aria-live / F payload 两键）。证据 `docs/verification/gui-gantt-drag-hotfix-20261014/`。
- **回归新增 7 项（独立测试专家最终签 7/7 PASS）**：GI-WRITE-06/07 + GI-WEB-16~20，覆盖拖拽后 DOM 在/日期即时更新（GI-WEB-16）、成功 Notice 不替换工作台（GI-WEB-17）、失败回落原图并提示（GI-WEB-18+GI-WRITE-06）、快速连拖/拖后点击/横滚/父条不可拖（GI-WEB-19/20）、白名单+重启读回（GI-WRITE-07）、正式数据隔离（GI-WEB-20）；判定权已由测试专家回填为 **7/7 PASS**。
- **ISS-027 精确 PID 流程（继续严格遵守）**：隔离监听 PID=86864 / `--port 3120` / cwd=`~/Projects/dsh-pm/deepseek-harness` / `--no-open`；仅对 86864 `kill -TERM` 一次（优雅退出，未用 KILL/未 pkill），验 EXITED、3120=DOWN；正式 3080=PID 69064 / 3091=PID 69065 启动前后均 LISTEN、PID 未变（8326=69065 内部口）。
- **零污染 / client hash（已实测锁定）**：正式 `data/`/`backups`/`exports` **156 资产文件本轮零变化**（before=after=156，changed/added/removed=0）；`shasum -a 256 packages/dsh-pm-tool/lib/client.js` = `68238d1a37c4eccfe16ff1699b91310e304d47eddc01466ac19b5193892131d8`（332139 B / 332.14 kB），bundle 含 `pm-gantt-bar`、宿主合并 bundle HTTP 200。
- **状态**：本批仅回写版本/living docs 口径（package.json 0.7.3 + releases/README/changelog/progress/handoff/onboarding），**未改产品 src、未改测试专家 docs、未改证据、未提交**。
- **下一步**：待用户授权执行最终 commit/注解 tag `v0.7.3`/push；GI-WEB-14 真 390 窄窗目视、GI-CP 关键路径、M-01 prod 真实 Key 仍为后续/人工项。

## 历史阶段：甘特排期视图信息增强 v0.7.2·独立测试专家最终签 34/35 PASS（2026-10-14，doubao-work）

- **功能**：在 v0.7.1=`02f42d1` 基线上对甘特「信息可读性」做增强——**根因修复 `--pm-accent` 从未定义致甘特条 `color-mix` 退化为透明**（正式定义 `--pm-accent: var(--dsw-alias-state-business-primary)`，全色值走宿主语义变量不写死 hex）；起止日期直显（`labelDates` MM-DD~MM-DD + 窄条外置 sideLabel，不只藏 tooltip）；0/部分/100 进度条内实心层按 `progress/100` 填充（done/≥100=完成态，纯渲染不写库）；`predecessorIds` 为唯一真源的只读 SVG 依赖箭头（`pointer-events:none`，自指/成环/悬空/缺日期诚实 skipped 降级）；父子 effectiveRange 只读派生（`min(子 start)~max(子 due)` 虚线派生条，不回写父日期）；ARIA + `localTodayIso()` 本地今日线轴外钳制 + 里程碑缺 targetDate 返回 null 防 NaN；拖拽整条平移、落库 payload 白名单仅 `startDate`/`dueDate`，不动 progress/predecessorIds/status/assignee、不自动顺延后继。
- **口径与边界**：**零 schema**（只读 v0.7.1 既有 startDate/dueDate/progress/predecessorIds，不新增表列、不改 taskRecordSchema、不升 domain、不动 storage.ts）；**关键路径 deferred**（GI-CP-01~05 未新增最长路径/高亮代码，按裁决 N/A 不计失败，成环/缺日期降级由 GI-PURE-05 `dependencyEdges.skipped` 覆盖）；不做自动排程/自动改期/自动补日期/自动顺延，doctor 仍只读不自愈。
- **验收（独立测试专家最终签，2026-10-14，含真实浏览器）**：范围内 **34/35 PASS**——AUTO 纯函数 11/11、INT 写路径 5/5、COLLAB 红线 4/4、GUI 14/15；**父 effectiveRange 聚焦 GUI 复验 PASS**（父派生范围 `min(子 start)~max(子 due)` 虚线条、不回写父日期、无排期子→不画父条，浏览器聚焦复验通过）；**🟡 GI-WEB-14 真 390 窄窗 MANUAL_PENDING**（实测视口 768px，沿用 PL-WEB-11 留所有者本人目视，不阻塞）；GI-CP-01~05 全部 ➖ N/A deferred。`pnpm build`=0、`verify-gantt.mjs`/`verify-gui-contract.mjs`/`verify-isolation.mjs`=PASS；真实 Chrome headless 隔离实例（独立 `DSH_HOME` + 端口 3102，正式 3080/3091 未触）证据 `docs/verification/gui-gantt-information-20261014/`；正式 `data/`/`backups`/`exports` **157 资产文件零污染**（before=after）。被测基线 = `02f42d1` 之上未提交工作树；client bundle 完整哈希 `dcf44a4a…`（`shasum -a 256 packages/dsh-pm-tool/lib/client.js` 实测）。验收矩阵 `docs/testing/gantt-information-acceptance.md`。
- **状态**：本批仅回写版本/living docs 口径（package.json 0.7.2 + releases/README/changelog/progress/handoff/onboarding），**未改产品 src、未改测试专家 docs、未改证据、未提交**。
- **下一步**：聚焦父日期 GUI 复验（父 effectiveRange 拖拽边界）**已 PASS**；待用户授权执行最终 commit/tag/push（注解 tag `v0.7.2` 指向最终 release commit）；关键路径高亮、真 390 窄窗目视、M-01 prod 真实 Key 为后续/人工项。

## 历史阶段：Web polish 三件套 PROD-10→09→04 已实现·独立验收 27/27 PASS（2026-10-13，doubao-work）

- **功能**：v0.5.2 Web 侧三缺口一次补齐——PROD-10 任务抽屉顶部只读显示「来自会议 mtg-xxxx · 会议标题」并一键直达该会议（前端反查 `meetings.actions[].taskId`）；PROD-09 进度汇报表每行与时间相邻上一份固定快照 diff 三指标并出「↑5% / ↓1 / 持平0」文字箭头徽标；PROD-04 任务行「⋯ 移动到…」树选择器改父，一次确认＝原子改父+项目全量 renumber。
- **口径与边界**：**零 schema**（domain 仍 v1、9 表）。PROD-10 多来源按会议日期倒序→id 倒序确定性取第一条、附「另 N 场」提示，来源会议删除则安全隐藏；PROD-09 在全量 periodEnd/id 排序列表上求相邻（不受搜索/状态筛选影响），三指标＝averageProgress / overdue_task 异常数 / exceptions 总数，首份无徽标、零差显「持平0」、文字+箭头非仅靠色；PROD-04 选择器排除自身+后代（后端环检测仍为硬门），后端单写队列内原子复合、失败整树回滚、取消零写，P0 不做拖拽/中间插序。
- **验收（独立测试矩阵签发，2026-10-13）**：总门 **PASS——27/27**，0 FAIL/BLOCKED/NOT_RUN；MANUAL_PENDING=0（真 390 窄窗沿用 PL-WEB-11 不在本门重复）。AUTO：`build`=0、full isolation guard=0、3 个新专项 verify（`verify-meeting-source.mjs` / `verify-report-diff.mjs` / `verify-task-move-renumber.mjs`）全退出 0；GUI：隔离实例端口 3095 真实 Chrome 逐用例过证（证据 `docs/verification/gui-web-polish-20261013/`）；正式 data/ 与 backups 149 文件 hash+mtime 零污染。产品契约见 `docs/product/09-web-polish-design.md`；验收矩阵 `docs/testing/web-polish-acceptance.md`。
- **状态**：本批仅回写产品/living docs 状态，**未改 `src/`、未改 `docs/testing/`、未提交**。
- **下一步（主线）＝schema v2**：PROD-11（任务 `predecessorIds[]` 依赖）、PROD-21（repoUrl/branch 仓库联动）、PROD-23（项目健康分 + 崩溃原子恢复）。

## 历史阶段：PROD-24 副驾多步规划已实现·独立验收 PASS（2026-10-13，doubao-work）

- **功能**：把 PROD-20 副驾的扁平动作数组升级为多步计划卡——模型可输出 `{"plan":[…]}`（每步 stepId/title/reason/action/needs[]/riskNote?），前端按 DAG 拓扑渲染、每行 checkbox 默认全选、行内只允许改 5 标量（非法即时标红禁用确认）、3 条确定性软风险琥珀提示（不禁用）；【整批执行】一次 ask-apply，【逐步执行】前端逐步调（每次重读 domain）；拒绝红行（如 task.delete / 环依赖）不可勾选。
- **口径与边界**：domain 仍 v1、零新表、不写 settings、计划只在前端内存（关面板即消散）；唯一写动作 `task.update`（patch：status/progress/assignee/startDate/dueDate）；DAG 环/悬空/自指**只拒该步**（其下游级联拒），整份 >8 步（或 >10 任务）**整份拒绝**；同目标任务隐式串行 + **链式 baseline**（整批内后者用前者落库后的 updatedAt，不误判冲突）；跨调用真实外部冲突仅拒相关步 + 依赖级联；幂等键扩为 `projectId+JSON(selectedOrderedActions)+JSON(baseline)`（60s）；取消/降级零写（27 个业务 JSON sha/mtime/size 全不变）；旧 `{"actions":[…]}` 输出自动包平凡计划、v0.5 链路回归不破。
- **验收（独立测试矩阵签发，2026-10-13）**：总门 **PASS**——49 项 AUTO/GUI 可自动项全绿，0 NOT_RUN/0 FAIL/0 BLOCKED；自动化门 `build` 退出 0、44 个 verify 脚本全绿（新增 `verify-copilot-plan.mjs` / `verify-copilot-plan-cancel.mjs`，扩展 `verify-ask-apply.mjs`）、正式 `data/` 与 backups 149 文件 hash+mtime 零污染；GUI 门在隔离实例 127.0.0.1:3093 真实 Chrome headless（未碰 3080/3091/data）逐用例过证。**2 项 MANUAL_PENDING（不阻塞）**：CMP-DEG-05（真实免费模型限流/乱码/无 Key 实机）、CMP-GUI-11（真 390px 窄窗目视）。产品契约见 `docs/product/08-copilot-multistep-design.md`；验收矩阵 `docs/testing/copilot-multistep-acceptance.md`；GUI 证据 `docs/verification/gui-copilot-multistep-20261013/`。
- **状态**：本批仅回写产品/living docs 状态，**未改 `src/`、未改 `docs/testing/`、未提交**（多步候选在工作树）。
- **下一步（主线）**：**Web 体验补齐 = PROD-04（任务「移动到…」Web 改父）/ PROD-09（汇报表相邻完成率·逾期·异常数对比徽标）/ PROD-10（任务详情显示「来自会议」并直达）**；三者均为纯前端/小改 core、不动 schema。**其后才进 schema v2**：PROD-11（任务 predecessorIds 依赖）、甘特B 关键路径、PROD-23 健康分。

## 历史阶段：PROD-07 人员与负载视图 v0.5.1 已实现·独立验收 PASS（2026-10-13，doubao-work）

- **功能**：新增顶层「人员」tab，跨项目按 `task.assignee` 归一化（trim+空白折叠+casefold）聚合未完成任务；每卡出未完成/待办·进行中·受阻、逾期/临期/P0、跨项目数、最近截止；按风险排序（逾期→受阻→临期→最近截止），「未分配」桶固定置顶；点任务行复用 `openRecord` 切项目+切tab+开抽屉，全程只读派生。
- **口径与边界**：逾期＝`status!=='done' && progress<100 && dueDate<今天`（与 stats/reminders 同口径）；**不拆多负责人字符串、不自动合并相似名、不建人员表、不动 domain/schema、不发写命令**。P1（相似名软提示/j·k 导航+记忆/涉众提示）后续做。
- **验收（独立测试矩阵签发，2026-10-13）**：**28 PASS / 0 NOT_RUN / 0 FAIL**；**1 项 MANUAL_PENDING＝真实 390px 窄屏目视**（工具受限，须所有者本人在真浏览器确认）。产品契约与验收/反例见 `docs/product/07-people-load-view-design.md`。
- **状态**：本批仅回写产品/living docs 状态，**未改 `src/`、未改 `docs/testing/`、未提交**。
- **下一步（主线）**：**AI 副驾多步规划**（PROD-20 升维方向；v0.6 架构演进侧的 PROD-11 关键路径/崩溃原子恢复按需并行）。

## 历史阶段：外部 vendor Agent Skills 引入 + 长期规范接线（2026-10-13，doubao-work）

- **决策（ADL-048）**：以只读 vendoring 引入首批 `mattpocock/skills`（grill-me/tdd/code-review/diagnosing-bugs + 纯文档依赖 grilling），锁上游 commit `49dd158d1076134a641b33efb035946536778336`；项目规则优先、不跑 installer、不写 home/全局、不替代独立测试门；升级走双审、回滚只改 manifest commit。
- **决策（ADL-049 自动路由，实现 `src/core/external-skill-router.ts`）**：vendored skill 不再要求用户显式指定，由纯函数按结构化信号确定性路由——缺阻塞信息→`interaction` 追问 route=none（**全拦**）；`vendorIntegrityVerified` 必须 **true**（安全门硬前置）；根因未明→仅 `diagnosing-bugs`（**抑制 grill/tdd、不叠 code-review**）；实质歧义非 trivial→`grill-me`；新功能/可测修复非 trivial→`tdd`；交付边界→**追加 `code-review`（trivial 也保留）**；`isTrivial` 抑制 grill/tdd。自动加载无需用户口令，但须先校静态校验 PASS + sha256、逐次留试点报告；优先级「项目规则 > 追问澄清 > 独立测试门 > skill 步骤」。
- **落地物**：`vendor/agent-skills/mattpocock/`（只读正文 + manifest.json）、治理政策 `docs/external-skills.md`、独立验收门 `docs/testing/external-skills-acceptance.md`、离线静态校验器 `packages/dsh-pm-tool/scripts/verify-external-skills.mjs`、试点报告模板 `docs/templates/external-skill-pilot-report.md`（本批均未改其正文）。
- **状态（2026-10-13 独立测试专家签发）**：**试点可用，未毕业。** 自动化验收门 = **PASS**（静态/校验域 A–H、J 全 PASS，无 FAIL/BLOCKED/F1，MANUAL_PENDING 无）；**`code-review` 试点 = PASS**（报告 `docs/verification/external-skills/pilot-01-code-review.md`）；其余 3 entry（`grill-me`/`tdd`/`diagnosing-bugs`）尚未出试点报告（NOT_RUN），各补 1 份试点报告后方可毕业。**自动路由实现已独立复核 APPROVE**：`verify-external-skill-router.mjs` **41 组断言全绿**（K1–K6、K3 安全门 false 拦截/true 放行、taskKind 留痕、确定性）、**K 域专家 = PASS**。绑定：上游 commit=`49dd158d1076134a641b33efb035946536778336`。**自动路由 ≠ 毕业**。**下一步**：为其余 3 entry 各补 1 份试点报告以推进毕业；使用 vendor skill 仍须先读 `docs/external-skills.md` 守 8 条红线。

## 历史阶段：第一档离线增强 R16/R17/R18 已实现（2026-10-11，doubao-work）

- **R16 临期/逾期提醒**：`/pm due [天数] [项目ID?]`（默认全部项目 7 天）+ Web 面板提醒条；纯读时派生、不做常驻调度（ADL-039）（commit 1b9bf67）。
- **R17 会议行动项转任务**：`/pm meeting action promote <mtg> <ai> [confirm]`（幂等回写 action.taskId）+ Web 「转任务」按钮（ADL-040）（commit 93a8c71）。
- **R18 备份/恢复**：`/pm backup` / `/pm restore <文件> confirm`（恢复前自动安全快照）+ Web 一键备份按钮 + `docs/backup-sync.md`（ADL-041）（commit 0a27862）。
- **验证**：新增 verify-reminders / verify-promote / verify-backup 三个专项；build + 全量 verify 退出 0；`backups/` 已 gitignore。
- **下一步**：第二档体验增强（AI 助手体验/列表效率/纯 JS CSV·XLSX 导入/导出入口）进行中或待办；生成型功能（R13-15）已端到端跑通。

## 历史阶段：生成型功能（R13/R14/R15）已实现（2026-10-11，doubao-work）

- **R13 智能 WBS**：`/pm task wbs <项目ID> <目标> [confirm]`——AI 拆解为勾选清单草稿→dry-run 预览→confirm 复用草稿落盘为任务树（commit 9775cf3）。
- **R14 进度汇报 AI 叙述**：`/pm report narrate <项目ID> [confirm]`——确定性数字→AI 段落→confirm 写入既有 `executiveSummary`（零 schema 改动）（commit cd07b94）。
- **R15 会议纪要归纳**：`/pm meeting summarize <项目ID> <速记> [confirm]`——AI JSON 草稿（防御解析）→confirm 建 draft 会议并挂行动项（commit 35affa8）。
- **统一落地（ADL-036）**：`core/ai-client.ts` 一次性文本生成封装（`ctx.llm.prepareCall`+`BlockAssembler`，按 `error.code` 中文降级）；AI 一律草稿 confirm 才入库；失败/无 key 优雅降级到手工/确定性路径；confirm 复用草稿不重复调模型省免费额度；核心台账离线可用。
- **验证**：每个功能配 verify-wbs / verify-report-ai / verify-meeting-ai（含成功路径与失败降级）；全 15 项 verify 退出 0、`pnpm run build` 通过。
- **真实端到端已通过（2026-10-11）**：已用真实 openrouter/free（凭据库、无环境变量启动）对三功能跑通——R13 confirm 落盘 25 任务、R14 rpt-0002 executiveSummary 数字未改、R15 mtg-0001 三行动项；无环境变量重启读回正常；临时项目已删净。免费池偶发超时已归一为中文 MODEL_TIMEOUT（重试即恢复）。
- **下一步**：Web 按钮为第二里程碑（v1 先斜杠命令）；「任务删除不级联」「免费池偶发超时重试」为已知限制。

## 上一阶段：生成型功能立项（2026-10-11）

- **零成本 OpenRouter 免费 LLM 通道已配置（doubao-work，ADL-035）**：通过已随 base bundle 装载的 `@deepseek-ai/dsh-llm-pi-ai`（原本零路由休眠、无需新装），在本机 `~/.dsh/profiles/pm/cordis.patch.yml` 按 id 补上 `providers.openrouter-free` → OpenRouter 免费自动路由模型 `openrouter/free`（Free Models Router，OpenAI 兼容 `https://openrouter.ai/api/v1`，`api=openai-completions`，`apiKeyEnv=OPENROUTER_API_KEY`）。**key 不入库、不写 patch**，只引用环境变量。
- **本批不实现任何生成型业务功能**：智能 WBS/纪要/周报仍按 ADL-032 暂缓；本批只做「通道配置 + 可移植文档 `docs/model-providers.md` + 加载验证」。DeepSeek 官方/OpenAI/Anthropic/Gemini/Groq/硅基流动/智谱/百炼/本地 Ollama 以注释 YAML 模板预留，当前全部不启用。
- **本批验证（全部无 Key）**：`pnpm install --frozen-lockfile` 干净、`pnpm run build` 退出码 0（client bundle 153.00 kB）、**12 个** verify 全 0、`git diff --check` 干净；`--dump-config` 退出码 0 且 `providers.openrouter-free` 出现、storage-json root 与 dsh-pm-tool 完好；无 Key 真实宿主启动（随机端口、`[pm-tool] 存储领域 pmtool 已打开`、无 pi-ai/openrouter 报错），运行中下发 `plugins/??dsh-pm-tool/client.js` bundle HTTP 200（153033 B、含 pm 界面串；无 cookie 401）。
- **key 已配置、端点已实测（2026-10-11 更新）**：key 已由所有者写在其本机 `~/.zshrc`（仓库外、不入库；改前已备份 `~/.zshrc.bak-20261011-130537`）。所有者本机直连实测：`GET /v1/key` 返回 `is_free_tier: true`、`free_model_daily_requests.limit=50`；`POST /v1/chat/completions`（`model=openrouter/free`）两次真实调用均成功、`cost=$0`、`finish_reason=stop`（随机落到 `liquid/lfm-2.5-2.6b:free`、`nvidia/nemotron-3-ultra-550b-a55b:free`）。经验沉淀见 KB-034（推理型模型先吃满 reasoning tokens，`max_tokens` 要给足 ≥400）。
- **应用内已实测打通（2026-10-11 更新）**：所有者在 dsh 网页底部模型选择器选 **Free Models Router**（openrouter-free/openrouter/free）发「你好，用一句话介绍你自己」，**第 1 次即成功**（puppeteer-core + 系统 Chrome 139 无头，KB-032）：助手正常回复、状态「已完成」、无 MISSING_CREDENTIAL/401/429（约 9.5K tok；免费档按次计费不按 token）。
- **踩到并已解的坑**：首次发消息曾报 `MISSING_CREDENTIAL`（“OPENROUTER_API_KEY which is not set”）——根因是当时 dsh 进程由「写 key 之前的旧终端」启动、进程环境无该变量；停旧进程、用已 `source ~/.zshrc` 的环境重启即解（详见 KB-035 / ISS-024；永久做法是在 Web「设置→模型」页把密钥录进 credentials service）。
- **本批决策/知识沉淀**：ADL-035、KB-033（llm-pi-ai 第三方 OpenAI 兼容端点配置 + profile 按 id 外挂 + apiKeyEnv 不入库、不自动读 .env）、KB-034（openrouter/free 免费自动路由实测行为）、KB-035/ISS-024（MISSING_CREDENTIAL 排查：进程环境 vs credentials service）。

## 上一批：Chrome 真实浏览器自动目视闭环 + 窄屏标签修复 + 浏览器/上游兼容决策（2026-10-11）

- **Chrome 真实浏览器自动目视闭环（doubao-work）**：按 KB-032 用 puppeteer-core 25.13 驱动本机已装 Google Chrome 139（headless，不另装 Chromium、不要系统辅助功能授权）。隔离 DSH_HOME（ISS-019）+ 覆盖每类实体的富种子 + 随机端口 + 无 Key 启动真实宿主，对 R5 面板/R7/R8/R9/R10/R12 做真实点击：七个 ViewTab 逐屏渲染、项目切换、总览看板统计数值（项目总数 2 / 完成率 40% / 逾期 1 / 未关闭风险 4，与种子一致）、全局搜索跨类分组命中、新增交付物→编辑抽屉→删除确认弹窗取消/confirm 删除、浅色与深色对比可读、786px 与 390px 整页无横向溢出。**27/27 用例通过，0 console error / 0 pageerror / 0 失败请求 / 0 同源 4xx-5xx**。
- **本批唯一代码改动**：`client/panel.css` `.pm-view-tab` 加 `white-space:nowrap; flex:0 0 auto`，修复 390px 窄屏视图标签中文逐字断行，改为标签单行、标签条内部横滚。
- **本批验证**：`pnpm install --frozen-lockfile` 干净、`pnpm run build` 退出码 0（client bundle 153.00 kB）、**12 个** verify 全部退出码 0、`git diff --check` 干净。
- **本批决策/知识沉淀**：ADL-033（浏览器兼容仅 Chrome，Safari/Firefox 本期不支持）、ADL-034（上游 dsh 新版本：peer 锁 v0.2.1-alpha.2 + profile link 装载 + 升级冒烟流程）、KB-032（puppeteer-core + 系统 Chrome headless 自动目视法）。截图存 `.tmp/ui-verify/shots/`（gitignored）。
- **暂缓项仍不变**：R11 里程碑提醒与生成型能力、多人实时协作、Excel 导入继续暂缓/裁剪（ADL-030/031/032）。

- **R12 已实现并通过验证（doubao-work）**：新增只读全库关键字检索 `/pm search <关键字> [--type ...]`（七类实体不区分大小写子串、按类型分组）与只读统计看板 `/pm stats [项目ID]`（项目状态计数、任务完成率、逾期、未关闭风险按严重度、交付物四态）；新增 Markdown 任务表离线导入 `/pm task import <项目ID> <清单.md> [confirm]`（GitHub 缩进勾选清单还原 WBS，`[x]` 记已完成，dry-run 不写盘）。Web 顶部新增「总览看板」，基于最新 snapshot 在浏览器端派生跨项目统计卡片、逐项目明细与全局搜索，不新增宿主路由、配色只用宿主 token。检索/看板不新增表、领域版本仍为 1（ADL-029）。
- **R12 验证通过**：冻结安装干净、构建退出码 0（client bundle 152.96 kB）、**12 个** verify 全部退出码 0（新增 verify-r12.mjs，含跨类/类型过滤、统计口径、导入 dry-run vs confirm、缩进→WBS、负例与全新进程读回；verify-web.mjs 扩展 R12 界面串/`.pm-board` 契约）；`git diff --check` 干净；隔离 DSH_HOME + 隔离数据 + 随机端口 + 无 Key 真实宿主启动，存储领域打开、cookie 鉴权，抓取含 dsh-pm-tool 的合并 bundle（HTTP 200）断言含「总览看板/跨项目搜索/项目总数/任务完成率/逐项目明细」。本机浏览器目视项以所有者手动确认为准（KB-014）。
- **R12 裁剪与暂缓结论**：Excel 导入（依赖 skill-office/LibreOffice，ADL-030）、多人实时协作（与单用户本地定位冲突，ADL-031）本期不做；R11 里程碑提醒与智能 WBS/纪要/周报等生成型能力（依赖常驻调度与 API Key）继续暂缓（ADL-032），需求中如实保留为「暂缓/裁剪」。
- **R10 已实现并通过验证（doubao-work）**：pmtool 领域新增 `deliverables` 表（id `dlv-NNNN`，字段名称/版本/负责人/状态/位置/计划交付日期/说明 + 内嵌只增 `history[]`）；离线 `/pm deliverable add/list/get/update/delete`，状态四态 planned/in_progress/submitted/accepted，状态或版本变化自动留痕（可带操作人与说明），有交付物的项目禁止删除；Web 新增「交付物」标签（筛选/搜索/台账表格/编辑抽屉/变更时间线/项目栏计数）。dsh 原生 deliverables 绑定 agent 轮次不适用离线台账，按 ADL-028 复用概念、数据层自研。
- **R10 验证通过**：冻结安装干净、构建退出码 0（client bundle 140.47 kB）、**11 个** verify 全部退出码 0（新增 verify-deliverables.mjs，含留痕规则、并发、失败恢复、删除保护、权限、全新进程读回续号）；隔离 DSH_HOME + 无 Key 真实宿主启动并抓到运行中 bundle 断言含 R10 界面；业务数据与上游零改动。本机浏览器目视项以所有者手动确认为准（KB-014）。
- **R9 已独立复核并推送（doubao-work）**：冻结安装、构建、十项 verify 全部退出码 0；隔离 DSH_HOME + 隔离数据 + 随机端口 + 无 Key 真实宿主启动成功（存储领域打开、带 token 200/无 token 401、启动清单与运行中下发 bundle 含 R9 界面）；未改业务代码原样接收；本机浏览器目视项边界见 KB-014。
- **R9 已实现（trae）**：自定义日期范围生成固定快照，保存任务/里程碑/会议摘要、周期事件和五类异常；支持人工摘要更新、确认删除及精简 Markdown 导出。
- **R9 Web 已实现**：新增进度汇报表格、筛选、搜索、生成/编辑抽屉、固定快照和异常详情。
- **R9 完整回归通过**：冻结安装、构建和十个验证脚本均退出码 0；隔离 profile 真实浏览器证明旧快照不随任务变化、新快照反映最新状态，编辑、导出、主题、786px 窄屏和重启读回通过。
- **R8 已实现**：会议和稳定行动项离线 CRUD、筛选、排序、任务/问题关联及跨表删除保护完成；未来 promote 所需 `taskId` 和稳定行动项 ID 已保留。
- **R8 Web 已实现**：新增会议表格、状态筛选、搜索、完成统计，以及会议和行动项右侧抽屉。
- **R8 完整回归通过**：冻结安装、构建和九个验证脚本均退出码 0；隔离 profile 真实浏览器新增、关联、完成、筛选、深色主题、786px 窄屏和重启读回通过。
- **R8 手动验收通过**：项目所有者确认行动项布局和“保存会议”联动保存修复有效，并授权本批提交与推送。
- **R7 已实现**：风险与问题共用 `risk_issues` 表，离线命令支持增查改删、关闭及类型/状态筛选；项目仍有记录时禁止删除。
- **R7 Web 已实现**：项目工作台新增“风险与问题”高密度表格、搜索、类型/状态筛选和右侧新增/编辑抽屉，无 API Key 可用。
- **R7 完整回归通过**：冻结锁文件离线安装、构建及八个 `verify-*.mjs` 均退出码 0；专项覆盖并发、故障恢复、权限和全新进程读回。
- **R7 真实浏览器通过**：隔离数据完成风险/问题新增、问题关闭、筛选、搜索、确认删除及重启读回；786px 窄屏局部滚动、浅/深主题和控制台/网络检查均正常。
- **R7 版本控制状态**：项目所有者手动验证通过，并已明确授权本批提交和推送。
- **R5 已实现**：外部 `clientBundle` 注册 dsh 顶级“项目管理”面板和侧栏入口；项目列表/详情、项目新建/编辑/删除、WBS 新建/完成切换/删除、里程碑新建/达成/删除均复用 Host 命令，无 API Key 可用。
- **R5 手动验收已通过**：2026-10-10 项目所有者确认验收通过；保留高密度任务/里程碑表格和右侧编辑抽屉，颜色、字体、字号及主要圆角跟随 dsh 原生主题。
- **主题专项验证**：真实浏览器通过宿主设置切换浅色并恢复跟随系统，表格和抽屉同步变化，730px 根容器无溢出；构建及全部七个验证脚本退出码 0。
- **独立页面 spike 已通过**：pm profile 的 `__DSH_BOOT__` roster 包含 `dsh-pm-tool/client.js`，不需要设置卡片降级，也未修改上游。
- **真实浏览器自动验证通过**：三类视图、任务新增与清理、右侧抽屉和 725px 工作区正常；表格局部横向滚动，整页无横向溢出，控制台无当前构建错误。
- **全量回归通过**：`pnpm run build` 与 command/export/milestones/projects/storage/tasks/web 七个 verify 脚本均退出码 0；故障日志均为既有主动负例。
- **阶段 4 MVP 交付完成**：新增 `docs/test-cases.md` 与 `docs/delivery.md`，整理 R1–R6 测试矩阵、手动验收、安装启动、演示、备份和已知限制。
- **交付级验证通过**：Node v22.23.3 / pnpm 11.28.5；冻结锁文件离线安装、构建、七个验证脚本、profile 配置检查均退出码 0；隔离 profile 真实启动成功，页面 HTTP 200 且 boot roster 包含 `dsh-pm-tool/client.js`。
- **v0.1.0 发布**：项目所有者授权创建 Git tag 与发布记录；发布说明见 `docs/releases/v0.1.0.md`，发布决策见 ADL-023。
- **授权状态**：本次授权仅覆盖 v0.1.0 发布提交、普通推送和 tag 推送；后续版本控制动作恢复分别确认。

### 🧭 跨平台协作基座（2026-10-10 新增，已就绪）
- 根 `AGENTS.md`（任何 AI/IDE 接手先读）、`docs/collaboration.md`（多方同步规则 + 平台标识）、`docs/knowledge-base.md`（KB-001～010 已验证知识）、`docs/handover-archive-doubao.md`（豆包阶段完整存档）。
- 约定：仓库即唯一事实来源；任何平台开工前先 pull + 扫描 `docs/` 最新档案，改动后在 `changelog.md` 标注平台标识并同步需求/决策/踩坑/知识；禁 force push。
- 接手平台不局限于 TRAE：新平台首次接入按 `docs/collaboration.md` 第八节自检并登记平台标识。

### ✅ 阶段 3 第 0 步已完成（最小插件端到端打通）
- 在独立仓库新建最小插件包 `packages/dsh-pm-tool/`（`/pm` 离线命令 + 存储领域 `pmtool`），`pnpm install` 与 `tsc` 构建一次通过。
- 基于 web 模板派生专属 profile `pm`，以 `link:` 绝对路径装入插件并自动激活；`--dump-config` 可见插件与存储三件套。
- profile 补丁把 storage-json 的 `root` 覆盖到产品目录 `pm-tool/data`（已 gitignore）；启动日志打印 `[pm-tool] 存储领域 pmtool 已打开`，宿主自身数据也写入该目录。
- Web 斜杠命令目录列出 `pm`，无 API Key 执行 `/pm ping` 返回中文 pong（有截图）。
- 两个确定性脚本（`scripts/verify-storage.mjs`、`scripts/verify-command.mjs`）直接运行已构建插件的真实代码：selftest 写入并读回 `pm-tool/data/pmtool/checks/selftest.json`（人类可读、目录 0700）。
- 实测发现并修复真实 bug：`table.put()` 异步写盘漏 `await`（处理器改为 async）。
- 已提交（`9e5d539`）并经项目所有者**验收通过、推送 origin/main**；随后补 `41b9db5` 说明验收/推送与移交。
- **后续阶段 3 业务编码与阶段 4 测试移交 TRAE 或其他 IDE/Agent 执行，本侧暂停**；接手导引见根 `AGENTS.md` 与 `docs/handoff.md` 第 0 节。

### ✅ 阶段 3 业务功能（R1–R9 已完成）
- 按需求 **v0.7** 实现项目计划 R1 / WBS R2 / 里程碑 R3 / 持久化与 Markdown 导出 R4 / Web 界面 R5 / 离线命令 R6 / 风险与问题 R7 / 会议纪要 R8 / 进度汇报 R9。
- **落盘布局已定稿并扩展（ADL-011/024）**：单领域 `pmtool` 分表 per-record、不建 index.json；projects/tasks/milestones/risk_issues 均已实现，checks 保留。
- 第三方独立顶级 Web 页面与外部包浏览器构建已按 ADL-022 实测打通。

---

## 阶段 2 需求分析（✅ 已定稿 v0.3 并获确认、已推送）

### ✅ 已完成
- 完成 dsh 能力可行性调研（本地官方源码 + 官方 cookbook/包 README 双路印证），沉淀 `docs/feasibility-map.md`。
- 经项目所有者交互确认四项关键决策（见 ADL-007）：离线优先混合模型、人类可读 JSON+Markdown 存储、先做 dsh Web 界面、最小闭环 MVP。
- 确定 MVP 技术架构（见 ADL-008）：`storage-domain` + `storage-json` 落盘、用户命令（离线）/模型工具（在线）双入口、独立插件包 + 专属 profile。
- 产出需求评审稿 v0.3：R1–R12 模块与可测试验收标准、Project/Task/Milestone 数据模型、数据落盘目录约定与业务规则、非功能需求。
- 项目所有者确认三项补充决策（ADL-009）：`data/` 暂不入库（已写入 `.gitignore`）、里程碑到期提醒暂缓（R11→P2）、生成型能力一期仅预留接口不实现。
- 需求 v0.3 经项目所有者确认定稿；`docs/handoff.md` 已刷新；阶段 2 文档提交并推送 GitHub。

---

## 阶段 1 环境搭建（✅ 已完成）

### ✅ 已完成
- 核实 dsh 官方仓库、技术栈、安装要求与插件架构（官方来源交叉验证，见 ADL-001）。
- 本机只读环境摸底：macOS 15.6.1 arm64、git 2.39.5；原仅 Doubao 自带 Node、无 pnpm/Homebrew。
- 经项目所有者确认 4 项关键决策：目录、独立仓库策略、nvm 安装方式、第一阶段接远程。
- 安装 nvm + Node v22.23.3 + corepack/pnpm 11.28.5，配置 `~/.zshrc`（见 ISS-001/ISS-004）。
- 创建工作区 `~/Projects/dsh-pm/`；浅克隆上游 dsh **v0.2.1-alpha.2**（基线哈希 `d743267388641bc76f17c45ce8b4c231aed1d32c`，分支 master）。
- `pnpm install` 成功（354 个工作区项目，约 1m17s，原生模块正常）。
- `pnpm run build` 成功（原生 addon + host + 357 个 client 产物，退出码 0）。
- 运行验证通过：`pnpm dsh web` 在 http://127.0.0.1:3080 启动，带令牌认证后根路径 HTTP 200、页面 `DSH Local Build` 正常返回；验证后已关闭服务。
- 初始化本产品独立 git 仓库 `pm-tool`（默认分支 main），建立完整标准档案（README/docs/skills/packages）。
- 生成 GitHub SSH 密钥并由项目所有者添加到账户 iceAcmen，`ssh -T git@github.com` 认证通过。
- 配置仓库级提交身份 Ice \<835687152@qq.com\>（未改全局）；首次提交 `12bcad3` 并推送 main 到 `git@github.com:iceAcmen/pm-tool.git`，跟踪 origin/main。

## 后续任务
- R13/R14/R15（智能 WBS/进度汇报叙述/会议纪要归纳）已完成并真实 openrouter/free 端到端验证（含重启读回，临时项目已删净）；随后完成 **A1（Web 端「AI 助手」面板，复用 core 草稿→confirm）** 与 **A2（任务显式级联删除 `/pm task delete <id> [cascade] confirm`）**，全 16 个 verify + build + frozen lockfile 绿。
- 首页 `/pm` 经上游只读核查确认注册正确、问题属宿主斜杠补全/会话跳转（ADL-038/KB-037/ISS-026）；以 Web 面板为稳定入口。v0.2.0 发布说明已起草（`docs/releases/v0.2.0.md`，**未打 tag**，待组织者独立验收）。
- 剩余需求仍暂缓/裁剪：R11 里程碑提醒、多人实时协作（ADL-031）、Excel 导入（ADL-030）。
- 上游 dsh 升级前按 `docs/test-cases.md` 执行完整兼容性回归。

## 当前状态（v0.7.4 最终可发布 · tag 将在最终提交创建；v0.7.3 已发布）
- **版本事实已前置到 v0.7.4（2026-10-14）**：`packages/dsh-pm-tool/package.json` = `0.7.4`。**v0.7.3 已正式发布**：注解 tag `v0.7.3` → 提交 `eb41b30`（甘特拖拽显示热修）。v0.7.4 = 稳定性地基 S4（fs-atomic 契约/tmpNameFactory 测试缝、LLM optional 真实 Context、runner 聚合+timeout 分类+资产 manifest）+ war-room「进行中」KPI 热修，**独立测试专家实测 S4 19/19 PASS、真实 Chrome 隔离端口 3122 PASS，可发布**；注解 tag 将在最终提交时创建（被测基线 = `eb41b30` 之上未提交工作树，最终 release commit SHA 待最终提交后确定）。历史 tag `v0.1.0`–`v0.7.3` 均未移动。
- **v0.7.4 范围（v0.7.3 `eb41b30` 之后，零 schema）**：A1 fs-atomic 钉死 rename 前失败只清 tmp 不碰目标、`wx` EEXIST 排他、tmpNameFactory 仅测试缝生产默认不变；A2 llm 不 inject、懒读 `ctx.reflect.get('llm',false)` 真实 Context、缺 provider 中文 NO_LLM 降级核心离线；A3 runner 跑完全部 62 专项并聚合失败（不 break）、timeout 单独分类、正式资产 before/after sha256+mtime manifest 零污染；war-room `doing`→`in_progress` KPI 热修（修复前进行中恒 0）。详见 `docs/releases/v0.7.4.md`。
- **验收（独立测试专家实测 + 真实 Chrome）**：S4 **19/19 PASS**、全量 guard **62/62** 全绿、权威资产本轮 **before=160/after=160 零污染**；war-room 真实 Chrome **3122** 逐项 PASS、正式 **before=159/after=159 零污染**（160 vs 159 = 跨轮 session/cache 自然轮转、各轮 before==after，如实分开）。client sha256 已实测锁定 `9d0b118c6f469856c5c7caee52175a88b0a2082fc4333daf2b2a45bc2302aa8b`（332510 B）。
- **人工项**：**v0.8 客观进度（checklist/progress-derivation/汇报 calcVersion）= NOT_RUN/deferred**（矩阵已冻结未实现）；**M-01 生产（prod）真实 Key 仍 MANUAL_PENDING（不阻塞 v0.7.4 发布）**，PoC 车道 `our-free-model`/`kilo-auto/free` 免费免 Key；GI-WEB-14 真 390 窄窗、GI-CP 关键路径仍 deferred/MANUAL_PENDING；G8/H5 不可逆动作仍 MANUAL_PENDING。
- **发布动作**：本批**暂不 commit/tag/push**，待用户最终通知执行最终提交、打注解 tag（client sha256 已实测锁定）。

## P2 深度融合：对外+长寿层（2026-10-18 完成并 push main）

- **范围**：K18 单向出站（三档导出+出站日志两类）、X7 愿景/OKR 层（独立实体+收件区+树形权重）、X2 收尾标记（wrapped 口径波及 11+ 处）、X3 失败经验（句级标注草稿纪律）、K16 档案最小保存包、X5 述职素材（三段结构）。
- **推进**：P2 规格文档 → 契约层（wrapped 枚举+okrs/lessons 表+4 路由+snapshot 字段，基线 326 不回退）→ 4 分片并行（文件级互斥：A export/B okr/C wrapped+lesson+archive/D review+前端）→ 集成（panel.tsx okrs 视图接线+Snapshot.okrs）→ verify-p2-integration.mjs 56/56 → 证据+档案 → commit+push（[doubao-work]）。
- **门禁**：build=0；vitest 37 文件 / 399/399（基线 326 → 399，新增 73）；guard 84/84 失败 0 污染 0；集成 56/56；分片自验 a 26/26、b 26/26、c 28/28、d 通过；既有 verify-export 不回退。
- **遗留**：okrs 收件区面板内直接渲染留 P3（本期命令提示入口）；出站关联位 latestExport prop 面板传入留 P3（现安全落「未导出」）；P3 立项：H6 常驻推送、X7 习惯层、K11 周期触发（cycleDue 类型已预留）。

## P3 深度融合：纵向+宿主层（2026-10-18 完成并 push main）

- **范围**：X7 习惯层（会话派生习惯轻确认+2 天补记窗回填+streak 断签重置/累计档案永久+克制清单文本归档+关联 P2 OKR）、K11 周期触发接线（占位不启用）、H6 常驻推送立项调研（调研+结论+拍板条件，零代码）。
- **推进**：P3 规格 → 契约层（habits 表+路由+snapshot）→ 3 分片并行（A 习惯后端/B 习惯前端/C H6 调研）→ 集成（panel.tsx habit 视图接线+Snapshot.habits）→ verify-p3-integration.mjs 29/29 → 证据+档案 → commit+push（[doubao-work]）。
- **门禁**：build=0；vitest 38 文件 / 427/427（基线 399 → 427，新增 28）；guard 全通过/0 污染；集成 29/29；分片自验 p3a 22/22。
- **H6 结论（待用户拍板）**：宿主无外部通知渠道；推荐维持「应用内打开面板即派生」（ADL-039 现状），不立项宿主级推送；路线 A 四前提（书面接受常驻常开+新 ADL、通道可达、接受改上游成本、凭据真实验收）。调研文档：`docs/design/deep-integration-v2-h6-research.md`。

## 可达性修复：OKR/习惯导航与页面、两收件区、K13 副驾（2026-10-18，3172 真实 GUI PASS · 675×745，未 commit/push）

- **GUI 实测 PASS（675×745）**：OKR/习惯桌面左导航「目标与习惯」组与窄屏切换器同源可达；两收件区（pmOkrInbox/pmHabitInbox）由 snapshot 透传到页面，confirmed=已采纳不计待确认/不显写按钮；队列离板回总览、全局刷新、浏览器 reload 三持久化路径均 PASS，只见队列卡、无「＋」新增入口；PM 副驾真实问 t-0008 出现投影卡并可打开抽屉，仅 PM 插件内只读、非宿主全局聊天。
- **根因**：桌面左导航缺 okrs/habits（仅窄屏 ViewSwitcher 有）；pmOkrInbox/pmHabitInbox 未由 snapshot 透传、panel 未注入 inbox；K13 副驾在总览看板只切状态不挂载层。
- **修复**：nav「目标与习惯」组与窄屏同源（buildNarrowSwitcher 模型派生+防漏测试）；snapshot 透传 okrInbox/habitInbox（confirmed=已采纳不计待确认/不显写按钮，confirm/ignore 成功后 refresh，未携带只显命令提示不伪造）；副驾总览下先退出全局看板再开层；刷新 await 父级成功才盖「数据截至」，失败保旧时钟。
- **边界**：个人看板布局为用户明确触发的可逆写，正式业务数据未改、不入 git；H6 常驻推送仍暂停（未实现）；未碰 3172 进程。

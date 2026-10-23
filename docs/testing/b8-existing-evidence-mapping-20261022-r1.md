# B8 既有证据映射与最小余证 r1

> 2026-10-22，平台 trae，角色：不同独立 B8 范围映射专家。只读合同、既有独立报告和限定归档索引；不是 GUI 执行端、开发、模型或产品测试角色。唯一写面为 `docs/testing/b8-existing-evidence-mapping-20261022-r1*`。Main 继续父任务，本子任务交回后 STOP。

## 1. 有限结论

**既有证据的有界映射已交付；不签全 B8，不签全部既有未验完成，也不准入普通 commit。** 这不是重开已签 U4、HC01 或把所有余格判产品 FAIL。

[机器映射](b8-existing-evidence-mapping-20261022-r1.json)保留原 **1184 格、42 抽屉、39 菜单、16 卡、RA-AT01/02 和 RA-CI02**，共 1284 个不同 ID。找到 **14 个页面格**能关联尺寸/状态相符的已签局部动作，全部只记部分映射；1170 格在本轮已审签索引中没有精确片段，**不是1170格原证已确认不存在，更不是要求重采1170格**。没有给整格、整层或整卡新增 PASS。

机器中 `originalLedger` 与旧矩阵字段原样保留；`signedParts / segmentRefs / minimumRemaining / nonExactEvidence` 是本件追加映射。旧 FAIL、BLOCKED、NOT_RUN、未捕获字段和明确继承边界不能被这些字段覆盖。计数是文档 ID，不是功能数、通过率或截图分母。

## 2. 授权与候选

父授权原句：

> 父授权已持续批准按盘点/分工多角色验全部已有未验再普通commit，不push/tag/release。

子任务原句的核心边界：

> 只读审既有证据，不GUI/产品/模型/测试运行。……输出机器映射+有限独立结论+Main具体可执行余动作，不能签全B8/普通commit。

依据为 [AGENTS](../../AGENTS.md)、[collaboration §9/§11](../collaboration.md)、[最终对账 §4.4/§7.6](final-remaining-acceptance-reconcile-20261022.md)、[原 journey §6](remaining-journey-cases-20261021.md)、[原 layer-map](remaining-layer-map-20261021.md)及[扩展清单](gui-b8-expanded-checklist-20261020.md)。本轮明确禁令限制通用 fetch/pull、地基执行、livingdocs 同步和 Git 收尾；不机械执行这些动作。

| 对象 | 本件引用边界 |
| --- | --- |
| 基线 | `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，来自派单/报告；没有读写 Git，HEAD 不代表 dirty 候选 |
| U4 r2 | 旧102输入、3257/PID88698为被测历史，原manifest SHA `26f093c3f8fbc243a28cb736f452b6fc8aa1ed90ec7403bc14a94fac4948fba9`；[r2签字](a13-u4-gui-total-retest-r2-20261022.md)保留 |
| Cycle继任 | [独立报告](cycle-feedback-independent-retest-20261022-r1-report.md)已签104输入 SOURCE/AUTO，10/29/134分别通过，未build/GUI；旧3257不能证明新修已激活 |
| 在途ATF | `core/ai-client.ts`及新test由他人开发；本件没有读取活业务源码、冻结它们或签新模型接缝 |
| 共享资源 | Main唯一 EGO13 p1/p2/p3 GUI、唯一builder；本件不探活、起停或操作任何实例、profile、业务根 |

既有GUI只归其原候选。Cycle报告的三产品窄增量支持定位原因/权限呈现接缝，没有改 U4排序、四列控件或 HC01；**足以继续引用原局部签字，不足以签当前整包继承**。Main最后候选如再含ATF变更，应按实际依赖关联ID，不把同HEAD或104清单当最终已build身份。

## 3. 页面格映射

原 grammar 保留：12 routes × 四宽 × 浅深 × 100/200 × 六态 =1152，tasks另stale/noresult=32。height为缩放前900；200%记录实际inner与宿主/PM容器，不拉大窗口抵消缩放。

| 精确格范围 | 已映原证/原时间 | 已签部分及最小余件 |
| --- | --- | --- |
| `RA-V-meetings-{1440,1024,768,390}-{light,dark}-100-typical`，8格 | [A11会议](a11-meeting-layout-gui-review-20261021.md)的 `widths100-r3`；机器逐格列first/last-select/cancelled路径、实际起止、origin/timeOrigin | 两行动项局部全宽、内滚末select、ArrowDown/Tab、显式cancel/零data写可复用。补该格尚缺主save/实际issue/对应键盘或恢复；不据两行造dense/long。1024背景792/739、768背景709/707横滚仍未关闭 |
| `RA-V-dash-1440-light-100-typical` | [A8](a8-gui-supplement-independent-review-20261021.md)，`original-three-r2/states.json`逐状态原戳 | 三原拖/undo及六卡布局、另save-cancel内容可复用。原动作native100前置需回绑；不升16卡或整看板格 |
| `RA-V-{tasks,overview,gantt}-1440-light-100-typical`，3格 | [A11 OP可见补审](a11-overview-visible-final-review-20261021.md)；UTC 20:24:45.914..48.470及20:26:52.614..54.578两段 | 人工30/0、有清单clear/Space100↔50、上下计数和甘特标签；同合法F2不等原F1全动作。报告consumer、无清单clear、调期/详情/其他主旅程未随之签 |
| `RA-V-tasks-1440-dark-100-typical` | [A19编号](a19-number-visual-retest-review-20261022.md)，UTC02:21:51.449..55.365；另[A16](a16-extension-selection-gui-review-20261022.md)、[A11材料](a13-materials-report-gui-review-20261021.md)各归自己的原段 | 编号系统copy/全文反馈、计划选择取消、材料主save分别可复用，**不能拼成一条同候选完整典型旅程**。A19 native100前置成立，A16/A11原生档位待回绑；default/pilot双旅程仍缺 |
| `RA-V-reports-1440-dark-100-typical` | [A11材料/固定报告](a13-materials-report-gui-review-20261021.md) | current默认全选固定/源rv5后重入/危险MDpreview可复用；原生档位、主动重选、MD实save/export/session/恢复仍缺 |

上述14格只是局部动作落位。机器 `segments` 细分原报告、实际对象、时间与缩放证据等级，`matrix` 每格保留原初态/动作，不把route公共余件要求在每格重复执行。不同候选的子段并列供复用，不合成一条假完整旅程。

**非精确格证据仍保留价值：**

- [HC01](a19hc-gui-independent-review-20261022.md)深色1440×1000/390×844长卡已签；高度不符900，只补长卡视觉，不签习惯900格，不重HC01。
- U4的390×844只映菜单排序/列偏好和指定裁切，不猜全部原图theme/nativezoom，不签tasks390×900全格。
- A18反馈/OKR/资料可见补件及旧A13成长/融合实际1440×718；主save、confirm/ignore等动作保留，不能用loaded1440×900改写实际尺寸。
- A19建议pending/confirmed/ignored是收件条目状态，不是习惯页六态；missing/unlinked仅pending，不跨态签。
- F7的390×900长史可读已签，但theme/原生档位、3213实例/同origin与历史保护未齐；先补旧绑定及收起重进，别重新恢复14条增加截图。
- [A8 native记录](../../reports/all-pending-evidence-20261021/A8/restore/native-zoom/execution.md)证明真实200和1440×900→720×450，非DPR；尚非精确格独立签字，状态/动作/候选对应仍缺。旧“450=200”已被较新约150口径纠正，不能恢复旧成功说法。
- [A20V2 slash](a20v2-gui-independent-review-20261022.md)是宿主conversation/面板反馈切片，不是十二route矩阵；不能代OKR repeat错误视觉或其他ResultCard。

## 4. 抽屉与菜单

[JSON `layers`](b8-existing-evidence-mapping-20261022-r1.json)一条对应一个原ID，包含原manifest ID、原fixture/动作、旧台账、[历史源码入口图](../../reports/layer-entry-map-source-20261021.json)的route/component/trigger/controls/命令、已签切片与具体余件。**source locator不等runtime layer-map**；本件未重新扫描81层活源码。

| 原ID | 可精确复用 | 最小未签部分 |
| --- | --- | --- |
| DR08/09/10、MENU09/10/11/12 | A11行布局、ai001非空task关联/clear、再次主save真实三命令、第三新行cancel、浅深末select取消 | issue正关联/解除、两旧行同次标题/状态主save、四态有效选择、故障保稿retry、菜单/ESC焦点；risk/空项不替issue，ai002一直null不算解除 |
| DR12/13/14、DR34/35 | A11 current固定/修订/安全preview；A18一次basic+原link备注+E1 append；[43件可见补审](a18-material-composition-gui-review-20261022-visible.md)备注/rv4/四短版/clean cancel | 两非法组合保输入后合法修正、新draft别名/file组合、MD实save、对应浅态、FL全部区/键盘；不重一次主save或43件可见补件 |
| DR06/07/11/15/39 | A16四正常表单description/responsePlan/summary、assignee主save，分别原record/历史保全 | 原条目其他字段：note/清ms、到期四态、prob/impact、真实候选选/清；深宽成功不替浅态或菜单动作 |
| DR17/18/19/25、MENU39 | 习惯原OKR重联/人final、GM01自身关联/长建议行、HC控制、OKR同项目confirm/ignore/clear保pending、growth部分导航 | 对应键盘、另一同项目目标/missing/失败保稿、浅态、repeat错误视觉/异项目动态反例、growth更多每实际项；不重guard/GM01/HC01 |
| MENU18/36/38、MENU21视图部分 | U4 r2双sort/方向/换序/legacy清链、named/default/A-B/reload、四列及父叶分组头、MENU18 ESC归焦 | 首先从已签原件整理实际opener/时间/控件索引。MENU36原fresh cancel/未明示chip/group组合和其他旧shortcut若仍缺，先找原件，仅补缺；不重U4。MENU21的键盘切项目/关联候选同步不由A-B视图隔离替代 |
| DR01/02、MENU30/31/32/33 | A16深宽副驾真实选择/edit/min/cancel、四update clean/conflict/freshundo | 能力选择drawer另入口；390/浅色、再生成实际apply base、四create/规定拒行、软风险/refs及完整键盘；不重PC已签三路径/四update |
| DR21/40、MENU35 | DAG/move既有AUTO、Cycle具体原因SOURCE/AUTO | 新候选真实依赖选择循环拒保稿→解除retry、390树可达；合法迁父/非法自指或带清单父拒。旧3257不是新Cycle GUI |
| MENU22/24/37及其余原ID | A10更多预检/390四按钮局部、原导入/出站有限切片；其余保旧台账具体引用 | 对应真实popup项、原生菜单/Tab/ESC、当前筛选文件/只读返回、危险cancel/真实保护；不把“导航到过”签成整条 |

没有在表内另列的ID仍有机器逐条旧签切片与余件，不被删除。工程变化只重绑定受影响entry；全局CSS/入口变化由Main交实际接缝继承，不能默认全废旧证或全继承。

### 4.1 最小合同澄清

1. **DR08**：[LG02](a8-layer-gap-contract-review-20261021.md)已明确新会议先建→编辑→action显式保存。原“未存会议原子建action”无有效承诺，不新增实现。
2. **DR30/MENU14/MENU26**：同报告LG03已明确owner popup是P1参考、不入门。沿原专家N/A；普通owner填/清→save/reopen仍验，TaskForm assignee补全不被裁掉。
3. **DR04/MENU01**：历史source map只见只读表达式/白名单构建器与两密度档。请原合同owner仅指明既有有效失败入口、按实际两档的步骤解释；不让Main造自由表达式/第三档。本件不自行N/A。
4. **1184格**：register/journey与父批准范围明确保留；本轮没有发现哪一原格已被证明**只**源于AGENTS §6A.1未生效提议。若有此具体反证，只交ID、原来源及批准时间作最小澄清，继续其他格。不新设全球组件六态/四视口合同，也不静默豁免原B8。

## 5. 十六卡与专项

A8六卡原layout精确为：`w-hero→completionHero`、`w-ms-deliver→milestoneDeliverable`、`w-scale→projectScale`、`w-obj→objectiveProgress`、`w-load→peopleLoad`、`w-risk→riskMatrix`。

**真实抓拖仅原A和B，即hero/ms-deliver。** scale/obj/load/risk是压实或同布局观察，不据六卡bbox给六卡都签drag/resize。三undo是布局撤销，非每kind删除undo；六卡完整JSON参与save/reload与cancel/reload可共同引用，未签精准cancel mtime/LS。queue/rest/OP等只能映内容或业务动作，不能替该kind加/配置/拖缩/删undo全链。

全部16 `RA-W-*` 在JSON逐条列原特异余件；无整卡PASS。Main只补未签kind步骤与同fixture权威内容：formula白名单合法/empty/失败修正，trend/weekly无记录诚实empty、divider无伪统计、MD安全；不扩大组件新规范或把type注册当动作。

| 专项 | 已有可保留 | Main原合同余动作 |
| --- | --- | --- |
| RA-AT01 | legacy320看板/交付漏斗已签，非risk填充；风险AUTO辅助 | 真320×900浅/深100，F1+FL填充risk最高格→实际IDs列表→返回/Tab/局部横滚，轴/格数可读、closed排除。不要空矩阵或别种矩阵替代 |
| RA-AT02 | legacy I8 ARIA26仅辅助，未真VoiceOver | macOS真实VoiceOver，1440×900浅100：TaskForm、AI确认、危险确认/OKR listbox；开启状态、音频/转录+元素时间上下文，label/role/state/error/进度模式、Tab/箭头/ESC、取消/主提交归焦 |
| RA-CI02 | 既有run39557586592/9b1a8c5 core success，e2e host missing SKIP/exit0 | 按原现有e2e合同无harness份保SKIP；有合法宿主/Chrome份在Main隔离最终候选实际执行审证。不push/dispatch、不新增宿主下载方案，SKIP不转PASS |

以上仍是可执行缺证，不能直接转MANUAL_PENDING。只有真实系统权限/认证拦截且确须本人那一步，登记具体动作与错误；不移交整轮。

## 6. Main接续

下面只整理原动作，不新增用例或抢在途分工：

1. **先索引封存，不重采。** 从JSON每条 `evidenceRefs/segments/sourceLocatorOnly` 获取已有report→原根→精确对象/时段。Main唯一写自己新的runtime `layer-map`/格映射索引，列实际候选、入口、控件/项、命令或前端动作、fixture ID、时间、原文件。U4 MENU18/36/38、HC01、OP Space、GM01、M01/43件、六导入已有成功段不重测。
2. **候选接缝。** 不锁或读取在途ATF；由Main按开发交回后实际最终diff/新增输入认领唯一隔离build、bundle、宿主、flags/实例。Cycle104补新原因GUI/O3；受影响ResultCard/依赖层重新绑，其余U4/HC01原有限范围保留。不能用旧3257或旧102宣布新修生效。
3. **按旅程补层。** 原J02/M02/J03/J04与成长/副驾余动作一起采，对应表中DR/MENU同步映射。会议只补issue/两旧行状态与失败，材料只补非法组合/新draft，副驾只补再生成执行base/四create及原拒行，视图先补索引。缺入口先用§4.1最小澄清，不造功能。
4. **看板合并公共步骤。** 复用已签六卡save/cancel；仅未签kind加/配置/拖resize、该kind删undo、跨宽canonical/scope与失败恢复。每kind原值/动作自己对应，不给十六卡共享一张“已保存”图批签。
5. **只补格内缺口。** 14个部分格先核同尺寸/状态/候选/原时段，再补未签主动作/键盘/恢复/目视；其他1170格先找封存原件。FE/FB/FS依原合法fixture，原生200绑定实际inner与PM容器。会议中宽背景横滚、718/844/1000高度差与原缩放缺档不得洗成完整格。
6. **专项与总出口。** 补320填充、VoiceOver和本机现有e2e，交不同独立专家审证；全部可执行原范围无FAIL/BLOCKED/NOT_RUN、继承与真实本人条件已逐域裁决后，才由Main按父授权普通commit。此件不stage/commit、push/tag/release或结束父任务。

## 7. 本轮自检与释放

运行环境：macOS/bash；纯文档生成器实际Node `v22.23.3`，项目pnpm11.28.5未调用。生成命令在仓库根：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/b8-existing-evidence-mapping-20261022-r1.mjs
```

退出0：读取64个列明文档/限定状态索引，JSON解析、原ID集合1284唯一、1184/42/39/16/3计数、证据引用与输入前后SHA一致；唯一生成写入为本前缀JSON。拒绝覆盖已有输出。机器记录每个实际输入path/bytes/SHA；未枚举或重审12921原件，不读取当前产品源码、lib、依赖、活业务、profile或credentials。原报告的SHA校验/GUI/回归均是**引用**，不是本轮重做。

`rg`不可用exit127后改find/grep；一次尝试 `C0/ci/core.log` 不存在，随后正确读取 `observation.json/detail.json`及原`log.txt`片段，未据旧猜测路径判缺档。本件生成前纠正纯文档字段名，未运行产品。文档/链接自检只核自有产物，结果见[自检记录](b8-existing-evidence-mapping-20261022-r1-selfcheck.json)，不作产品测试结论。

本轮 **产品测试、verify/e2e、build/install、GUI/VoiceOver/模型、Git与服务均NOT_RUN（明确禁止）**。未fetch/pull，不写其他testing/原封包/livingdocs/vendor或业务数据，不用memory覆盖仓库。

**资源释放 STOP。** 没有后台会话、源码锁、builder、GUI连接、端口、依赖或业务根占用。Main父任务继续；本报告仅交B8有限映射与余证，不签全B8或普通commit。

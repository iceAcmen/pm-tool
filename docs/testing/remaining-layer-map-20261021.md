# B8抽屉与菜单稳定映射

> 独立专家计划，非原型即实现/通过。源为本机批准路线所引用 `全页面混合设计-20261019/master-manifest.json`，SHA256 `b0b93c8e080109245da82aafa7d578dd87648692bcaa73907135e9216fc22635`；以covered内kind分组、id字典序冻结如下投影。交接仅需本文，不依赖私人目录原件；Main如需设计目视对照应交对应原图脱敏副本。
>
> 所有ID NOT_RUN；真实运行入口映射尚待Main提交 `layer-map.json`，这层映射缺证目前BLOCKED，不因此判产品缺失。原型route参数/demo/示例ID、interaction=illustrative、选项数目不是生产URL/API/枚举硬约束；实际有效数据合同优先。参考图不是GUI原证，不逐像素照抄。

## 1. 通用执行

- 初態F0/F1/F3/F5/F6/F7/FL引用[总登记](remaining-acceptance-register-20261021.md)；明确宽390/深主题的条目按其要求，其余1440×900浅100%。每条开真实入口、Tab/箭头/Enter、ESC返回且焦点归还，观察popup层不被裁切/挡主入口。
- 下表“保存”表示显式主提交；“取消”关闭草稿不落业务写；命令/preview入口有正常只读返回；主表单ops/危险确认按已有合同，不扩大全抽屉dirty守卫。每条先成功/取消，再该类型合法生产校验失败保输入；无生产失败路径的本地菜单不捏造红态。
- 记录fixture真实ID、opener、组件/可观察入口、输入/提交时间、原证/回读、主题/尺寸；不能将原型截图当已采。同一条属于menu也属于drawer时只复用同一时间段，不重复计全系统完成率。

## 2. 42条抽屉态

| 精确ID | 原manifest ID | fixture / 初态 | 动作 / 提交点及预期 |
| --- | --- | --- | --- |
| RA-DR-01 | ai-pick-390 | F6，390 | 开真实AI能力入口→键盘选择→取消；入口/按钮纵向可达，不自动写 |
| RA-DR-02 | ai-pick-dark | F6，深 | 开能力入口→选已有能力→取消；真实深色/状态可辨，非虚构能力按钮 |
| RA-DR-03 | ai-pick-light | F6，浅 | 同02浅态，能力/disabled理由真实 |
| RA-DR-04 | board-formula-error | F1配置公式卡 | 输入现有白名单解析失败公式→保存失败→修正→保存；错误就近/画布不被半写，不用原图“设计未求值”当实际成功 |
| RA-DR-05 | drawer-deliverable-create-light | F0新建交付物 | 空表单→填合法字段/里程碑/note→save；取消副本零写 |
| RA-DR-06 | drawer-deliverable-edit-dark | F3 V1，深 | 编辑note/清milestone→save→重开；清关联真实null，长内容可读 |
| RA-DR-07 | drawer-deliverable-edit-light | F3 V1 | 预填所有现有字段→改note→cancel/save分别fresh，内容不丢/历史保留 |
| RA-DR-08 | drawer-meeting-create-light | F0新会议 | 空表单→决策/行动项→save→重开，取消不提前写 |
| RA-DR-09 | drawer-meeting-edit-dark | F3会议，深 | 改行动项状态/关联→save，深层菜单可达 |
| RA-DR-10 | drawer-meeting-edit-light | F3会议 | 预填→改决策/行动项→save，稳定行动项ID保留 |
| RA-DR-11 | drawer-ms-edit | F1里程碑 | 改合法到期/状态→save/reopen，非法日期不半写 |
| RA-DR-12 | drawer-report-create-light | F3有进展 | 新建固定汇报选周期/复合refs→preview零写→save |
| RA-DR-13 | drawer-report-edit-dark | 已存RA-R01，深 | 编辑MD→preview/save，固定来源不能被edit改 |
| RA-DR-14 | drawer-report-edit-light | 已存RA-R01 | 快照只读/MD可编辑，源改变不重算旧报告 |
| RA-DR-15 | drawer-ri-edit | F1真实risk | 预填→改概率/影响/负责人→save，枚举按有效schema非原图三态数 |
| RA-DR-16 | drawer-risk-dark | F0新risk，深 | 填合法枚举→save；非法日期保输入/中文错误 |
| RA-DR-17 | habit-edit-dark | F7 habit，深 | 改title/关联同项目OKR→save/reopen，不改checkIns历史 |
| RA-DR-18 | habit-edit-light | F7 habit | 同17浅；取消不写 |
| RA-DR-19 | habit-inbox | F5两pending | 打开→confirm一/ignore一→reopen，未确认不建habit |
| RA-DR-20 | habit-new | F0 | 新习惯→合法title/OKR→save，跨项目拒/输入保留 |
| RA-DR-21 | narrow-dep-tree | F1合法依赖树，390 | 打开任务依赖选择→搜索/多选→cancel/save，窄态不陷焦点/DAG不破 |
| RA-DR-22 | narrow-task-drawer | F3，390 | 打开task长内容→滚到底→保存/取消，满宽适配不横滚 |
| RA-DR-23 | okr-edit-dark | F5 KR，深 | 改主归属/软联→save，单父/同项目 |
| RA-DR-24 | okr-edit-light | F5 KR | 同23浅；取消零写 |
| RA-DR-25 | okr-inbox | F5两建议 | 打开→确认/忽略→重进，草稿不自动confirmed |
| RA-DR-26 | okr-new-kr | F5 objective | 新KR→选同项目primary→save；不存在/跨项目拒 |
| RA-DR-27 | okr-new-objective | F0 | 新objective→title/owner→save；取消零写 |
| RA-DR-28 | project-create | F0 | 新项目合法title→save/reopen，空白拒不半写 |
| RA-DR-29 | project-edit | F1 QA-A | 预填→改description→save，projectId不被改 |
| RA-DR-30 | project-owner-open | F1多负责人 | 项目负责人候选键盘选择→save/reopen；候选实际人数不锁5 |
| RA-DR-31 | project-status-open | F1 | 项目状态选有效schema项→save/reopen，不用原型例枚举替生产 |
| RA-DR-32 | settings-dark | F5当前口径，深 | 开设置→改合法口径→save→新进程读回，路径仅隔离 |
| RA-DR-33 | settings-default | F0默认口径 | 开→默认显示→取消/合法save，零迁移/不写正式settings |
| RA-DR-34 | task-edit-dark | F3，深 | basic+ops长内容→save/reopen，人工/客观分区、反馈诚实 |
| RA-DR-35 | task-edit-long | FL+F3 | 滚过基础/清单/资料/进展/依赖全部区→save/cancel，长信息内滚不丢主入口 |
| RA-DR-36 | task-milestone-open | F1里程碑 | 选择/清关联→主save，反向里程碑关联任务一致 |
| RA-DR-37 | task-new | F0 | 空表单→basic/material/progress draft→save，cancel零写 |
| RA-DR-38 | task-new-dark | F0，深 | 同37深且校验错误可读，真实默认样式 |
| RA-DR-39 | task-owner-open | F1多负责人+未分配 | 候选选择/清空→save，补全真实，不造新人名结果 |
| RA-DR-40 | task-predecessor-tree | F1合法树 | 搜索勾选/取消/保存，不能自指/环/跨项目、无关联选项真实 |
| RA-DR-41 | task-prio-open | F1 task | P0/P1/P2选择→save→重开，键盘/标签 |
| RA-DR-42 | task-status-open | F1 task | 五态选择→人save，wrapped非done/AI拒，原OP/反思联验 |

## 3. 39条菜单/弹层态

| 精确ID | 原manifest ID | fixture / 初态 | 动作 / 提交点及预期 |
| --- | --- | --- | --- |
| RA-MENU-01 | board-config-density | F1记录卡配置 | 三档有效密度切换→cancel/save，菜单不截断，布局持久 |
| RA-MENU-02 | board-config-dir | F1记录卡配置 | 排序升/降各选→save重进，同数据顺序对照 |
| RA-MENU-03 | board-config-numberFormat | F1指标卡 | 百分比/整数有效格式→save，不改源数值 |
| RA-MENU-04 | board-config-sort | F1记录卡 | 选当前合法sort字段→save，priority/milestone有效，不重新开已撤误判 |
| RA-MENU-05 | board-history-pop | F1已有两保存布局 | 打开≤5历史→预览→cancel零写→另恢复并save重进 |
| RA-MENU-06 | board-scope-open | F1 A/B/个人/内置作用域 | 切scope→save/reset项目，其他scope/legacy不写 |
| RA-MENU-07 | ctl-gantt-gran | F1甘特 | 日/周/月切换→看刻度/焦点，纯视图不改日期 |
| RA-MENU-08 | ctl-risk-tab | F1风险/问题 | Tab切换/打开行/返回，计数与实际kind一致 |
| RA-MENU-09 | menu-actIssue | F3会议/同项目问题 | 行动项关联问题→主save，跨项目不可偷写 |
| RA-MENU-10 | menu-actStatus | F3四态行动项 | 状态选择→主save/重进，稳定item ID不丢 |
| RA-MENU-11 | menu-actTask | F1+F3会议 | 搜索同项目task→选择→主save，实际候选数量不锁25 |
| RA-MENU-12 | menu-actTask-dark | 同11深 | 同流程深色可达，焦点归还 |
| RA-MENU-13 | menu-dvMilestone | F3 V1 | 选/清里程碑→主save，note保留 |
| RA-MENU-14 | menu-dvOwner | F1+F3 | 选/清负责人→主save/reopen，实际候选非固定5 |
| RA-MENU-15 | menu-dvStatus | F3 V1 | 现行五态选择→人save；原图4选不是排除wrapped |
| RA-MENU-16 | menu-export | F1过滤任务表 | 导出当前筛选快照→核范围/顺序；无写原task |
| RA-MENU-17 | menu-mtStatus | F3会议 | draft/final选择→主save，正式化仅人 |
| RA-MENU-18 | menu-named-view | F1 task视图 | 选内置/自定义/default→重进，与U4恢复联验 |
| RA-MENU-19 | menu-reminder | F1临期/逾期 | 打开胶囊→跳target→返回，不发后台通知/不改status |
| RA-MENU-20 | menu-rpStatus | RA-R01报告 | 按当前report schema状态→主save/reopen，快照仍固定 |
| RA-MENU-21 | menu-switcher | F1 A/B | 键盘切项目→列表/关联候选更新、不串数据 |
| RA-MENU-22 | menu-top-more | F5 | 打开→逐真实navigation/data管理项→取消危险写；无假“成功”按钮 |
| RA-MENU-23 | ms-status-open | F1里程碑 | 四有效状态→主save，achievedDate/反思按合同 |
| RA-MENU-24 | narrow-menu | F1，390 | 更多菜单打开/滚动/Tab/ESC，内容不被屏外裁切 |
| RA-MENU-25 | ri-impact-open | F1 risk | 选有效影响程度→主save/reopen |
| RA-MENU-26 | ri-owner-open | F1 risk/多人员 | 选择/清负责人→save/reopen |
| RA-MENU-27 | ri-prob-open | F1 risk | 选择有效概率→save→矩阵反映 |
| RA-MENU-28 | ri-status-open | F1 risk | 当前schema状态→save，closed不入矩阵 |
| RA-MENU-29 | ri-type-open | F1 risk/issue | type按当前create/update合同→save/拒绝，如不可变应只读说明，不能凭原图强造可改 |
| RA-MENU-30 | sidecar-diagnosis | F6只读诊断 | 打开AI返回→查看相关任务投影→退出，零业务写 |
| RA-MENU-31 | sidecar-draft-390 | F6，390 | 计划卡勾选/编辑/取消→焦点/折行，联RA-AI04 |
| RA-MENU-32 | sidecar-draft-dark | F6，深 | 草稿/拒行/软风险→确认→逐条结果，非illustrative成功 |
| RA-MENU-33 | sidecar-draft-light | F6，浅 | 同32浅，记录真实dispatch/refs |
| RA-MENU-34 | tasks-batch-confirm | F1独立可删tasks | 多选危险确认→取消零写→合法确认（现行保护），联D06 |
| RA-MENU-35 | tasks-parent | F1树 | 选合法新父→save，非法自指/带清单父拒不改树 |
| RA-MENU-36 | tasks-saveview | F1修改query/chip/grouped/sort | 命名保存→设default→重进，联U4，取消不写 |
| RA-MENU-37 | tasks-share | F1当前过滤+合法CSV/XLSX模板 | 导出/分享菜单→实际只读文件；导入preview→cancel/confirm；不虚构外部分享渠道 |
| RA-MENU-38 | tasks-sort | F1 task表 | 旧四sort兼容及U4新多规则→保存/重进，不把原图单sort当裁掉U4 |
| RA-MENU-39 | top-more-menu | F5 growth页 | 顶栏更多导航/data入口→返回，与22同能力但真实growth上下文另采 |

## 4. 其他覆盖关系

16卡精确ID及四档页面矩阵按 [旅程单](remaining-journey-cases-20261021.md) §6；上面共81个设计条目有的本身是分段/助手卡而非真正menu/drawer，分类沿原manifest用于追溯，不据分类要求造新控件。12类真实抽屉从project-create到settings全部由上述映射覆盖；真实默认/pilot/隐藏入口/命令入口须Main明示，不能因仅导航可达就判状态通过。

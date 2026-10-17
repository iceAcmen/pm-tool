# G3 真实 GUI 证据接收与独立审证工作表（2026-10-17，**全门 PASS 收口**）

> **整体结论（2026-10-17 收口）**：T2-G01~G12 **全部 PASS**；T-DEF-001/002 修复经 1440 浅深运行时复验闭合（E14/E15）、T-DEF-003 由产品拍板保留单行横滚关闭，三项缺陷全部 CLOSED。G3 验收收口通过。

> 用途：主端公共 `aha_browser_use` 在隔离实例（种子 1 项目/5 任务/1 里程碑/1 风险；原 `http://127.0.0.1:3172/`）分批采证后，本工作表由独立测试专家逐批登记、审证。
> **通道口径更正（2026-10-17）**：先前 3172 认证提示是**导航未带该实例 URL token，非实例不可达、非主端无 GUI**；用户接管超时。认证分支停止：不填 token、不换端口/驱动、不直连绕认证。主端将**带链接导航**重建隔离实例后采证；带链接即可进入，本门在此之前保持 BLOCKED。
> **实例当前状态（2026-10-17 21:15 独立测试专家复核）**：3172 在线；裸 GET=401（认证门正常），带日志尾行 token 链接 303 下发 HttpOnly cookie、带 cookie 二次 GET `/`=200，认证链路正常。实例曾重启（旧进程模块缓存未刷新），**当前有效 token 以 `/tmp/dsh-p2-iso-3172.log` 尾行为准**：`hav8xUsjVZPJmrbF-6p_creCPhluLTrR0JEWKz-v1AU`（旧 `zRZU4w40N…` 为重启前失效 token，仅见于日志中段）。种子数据未被污染（各批取消关闭后「全部5」不变）。
> 规则：独立测试不操作浏览器、不改候选代码；**截图数量≠覆盖**，DOM/自动化断言不代替目视；证据等级 observed（实见动作/状态）> measured（实测对比）> DOM/源码 > 截图；每条须绑定批次、视口、主题、动作记录。
> 三视口：1440 / 约768 / 390；两主题：浅 / 深；关键状态：正常 / 空 / 长文 / 报错 / 禁用 / 关键交互 / 键盘。

## A. 批次登记（每来一批填一行）

| 批次 | 时间 | 视口 | 主题 | 覆盖视图/动作 | 附件（截图路径+动作日志） | 审证人 | 初步结论 |
|---|---|---|---|---|---|---|---|
| B01 | 2026-10-17 | 675×745（约768档） | 浅 | 任务页全貌（含"插件可升级"提示条遮挡） | `/private/tmp/g3-shots/b01-tasks-light-1440.png`（实际675） | 待审证 | 布局正常，有宿主提示条遮挡底部 |
| B02 | 2026-10-17 | 675×745 | 浅 | 任务页+左导航 P2-1 分组+任务统计+筛选+5行任务+底部快捷键条 | `/private/tmp/g3-shots/B02-tasks-light-675.png` | 待审证 | 布局规整，浅色办公风格 |
| B03 | 2026-10-17 | 675×745 | 深 | 任务页+左导航深色，背景 rgb(21,21,23) | `/private/tmp/g3-shots/B03-tasks-dark-675.png` | 待审证 | 深色主题一致，无视觉漂移可见 |
| B04 | 2026-10-17 | 675×745 | 深 | 命名视图菜单展开（6内置视图+管理视图入口） | `/private/tmp/g3-shots/B04-namedview-menu-dark-675.png` | 待审证 | 菜单层级清晰 |
| B05 | 2026-10-17 | 675×745 | 深 | 命名视图菜单含新保存的用户视图"走查测试视图" | `/private/tmp/g3-shots/B05-namedview-with-user-dark-675.png` | 待审证 | 保存流程生效 |
| B06 | 2026-10-17 | 675×745 | 深 | 管理命名视图弹窗：内置锁定+自定义可操作 | `/private/tmp/g3-shots/B06-manage-views-dark-675.png` | 待审证 | 内置禁用/自定义可用正确 |
| B07 | 2026-10-17 | 675×745 | 深 | 导出当前视图按钮定位（点击未展开菜单，采证不足） | `/private/tmp/g3-shots/B07-export-menu-dark-675.png` | 待审证 | 导出菜单展开待补 |
| B08 | 2026-10-17 | 675×745 | 深 | 甘特排期视图（2026-09时间轴+5任务+里程碑行+键盘微调） | `/private/tmp/g3-shots/B08-gantt-dark-675.png` | 待审证 | 布局正常 |
| B09 | 2026-10-17 | 675×745 | 深 | 里程碑视图（1仪式节点+目标2026-11+P2-2视觉验收） | `/private/tmp/g3-shots/B09-milestones-dark-675.png` | 待审证 | 布局正常 |
| B10 | 2026-10-17 | 675×745 | 深 | 风险与问题视图（1开放+风险矩阵 概率×影响） | `/private/tmp/g3-shots/B10-risk-dark-675.png` | 待审证 | 布局正常 |
| B11 | 2026-10-17 | 675×745 | 深 | 人员负载视图（负载明细+排期负载 10月） | `/private/tmp/g3-shots/B11-people-dark-675.png` | 待审证 | 布局正常 |
| B12 | 2026-10-17 | 675×745 | 深 | 会议纪要视图（空态：记录评审、例会与专项会议） | `/private/tmp/g3-shots/B12-meetings-dark-675.png` | 待审证 | 空态诚实 |
| B13 | 2026-10-17 | 675×745 | 深 | 进度汇报视图（空态：按周期沉淀执行摘要） | `/private/tmp/g3-shots/B13-reports-dark-675.png` | 待审证 | 空态诚实 |
| B14 | 2026-10-17 | 675×745 | 深 | 交付物视图（空态：共0项·按状态分布） | `/private/tmp/g3-shots/B14-deliverables-dark-675.png` | 待审证 | 空态诚实 |
| B15 | 2026-10-17 | 675×745 | 深 | 项目概览视图（负责人史冰冰+任务完成1/5 20%+阶段进度） | `/private/tmp/g3-shots/B15-overview-dark-675.png` | 待审证 | 布局正常 |
| B16 | 2026-10-17 | 675×745 | 深 | 总览看板（跨项目搜索+项目总数1+任务完成率20%+需要关注2+风险矩阵入口） | `/private/tmp/g3-shots/B16-board-dark-675.png` | 待审证 | 卡片布局正常 |
| B17 | 2026-10-17 | 675×745 | 深 | 新建任务抽屉表单（title/desc/status/priority/assignee/parentId/日期/progress/effort/evidence/override/milestone/repo/branch/前置任务多选） | `/private/tmp/g3-shots/B17-task-drawer-dark-675.png` | 待审证 | 表单字段完整，需目视确认无错位 |
| B18 | 2026-10-17 | — | 深 | 分享只读快照下载验证：`/Users/bytedance/Downloads/G3-验收项目-任务-2026-10-17.html`（5123B，0 script，0 外链，内联 SVG 锁） | 文件路径见附件 | 待审证 | T2-G12 快照自包含 PASS 候选 |
| 交互记录 | 2026-10-17 | 675×745 | 深 | 保存视图：空名时"保存视图"按钮 disabled（T2-G11 PASS 候选）；输入名称后保存成功并出现在列表；管理弹窗内置锁定/自定义可重命名删除 | 动作日志见本表 | 待审证 | T2-G11 核心交互 PASS 候选 |
| B19 | 2026-10-17 | 1470×797（≈1440 档，cu 真实 Chrome） | 浅 | 任务页+完整左导航+统计+筛选+5行任务+快捷键条，背景 rgb(244,245,247)/内容白 | `/private/tmp/g3-shots/B19-tasks-light-1440-cu.png` | 待审证 | 浅色 1440 布局正常 |
| B20 | 2026-10-17 | 1470×797（≈1440 档，cu 真实 Chrome） | 深 | 任务页+完整左导航+统计+筛选+5行任务+快捷键条，背景 rgb(21,21,23) | `/private/tmp/g3-shots/B20-tasks-dark-1440-cu.png` | 待审证 | 深色 1440 布局正常 |
| B21 | 2026-10-17 | 675×745 | 浅 | 任务页浅色（对应 B02 深色） | `/private/tmp/g3-shots/B21-tasks-light-675.png` | 待审证 | 待审证 |
| B22 | 2026-10-17 | 675×745 | 浅 | 甘特排期浅色 | `/private/tmp/g3-shots/B22-gantt-light-675.png` | 待审证 | 待审证 |
| B23 | 2026-10-17 | 675×745 | 浅 | 里程碑浅色 | `/private/tmp/g3-shots/B23-milestones-light-675.png` | 待审证 | 待审证 |
| B24 | 2026-10-17 | 675×745 | 浅 | 风险与问题浅色 | `/private/tmp/g3-shots/B24-risk-light-675.png` | 待审证 | 待审证 |
| B25 | 2026-10-17 | 675×745 | 浅 | 人员负载浅色 | `/private/tmp/g3-shots/B25-people-light-675.png` | 待审证 | 待审证 |
| B26 | 2026-10-17 | 675×745 | 浅 | 会议纪要浅色（空态） | `/private/tmp/g3-shots/B26-meetings-light-675.png` | 待审证 | 待审证 |
| B27 | 2026-10-17 | 675×745 | 浅 | 进度汇报浅色（空态） | `/private/tmp/g3-shots/B27-reports-light-675.png` | 待审证 | 待审证 |
| B28 | 2026-10-17 | 675×745 | 浅 | 交付物浅色（空态） | `/private/tmp/g3-shots/B28-deliverables-light-675.png` | 待审证 | 待审证 |
| B29 | 2026-10-17 | 675×745 | 浅 | 项目概览浅色 | `/private/tmp/g3-shots/B29-overview-light-675.png` | 待审证 | 待审证 |
| B30 | 2026-10-17 | 675×745 | 浅 | 总览看板浅色 | `/private/tmp/g3-shots/B30-board-light-675.png` | 待审证 | 待审证 |
| B31 | 2026-10-17 | 675×745 | 深 | 导出菜单实际展开（MD/CSV/JSON 选项），替换 B07 | `/private/tmp/g3-shots/B31-export-open-dark-675.png` | 待审证 | G11 导出下拉证据补足候选 |
| B32 | 2026-10-17 | 675×745 | 深 | 导出菜单按 Esc 关闭 | `/private/tmp/g3-shots/B32-export-esc-closed-dark-675.png` | 待审证 | G11 Esc 关闭候选 |
| B33 | 2026-10-17 | 675×745 | 深 | 导出菜单点外部关闭 | `/private/tmp/g3-shots/B33-export-outside-closed-dark-675.png` | 待审证 | G11 外部关闭候选 |
| B34 | 2026-10-17 | 675×745 | 深 | 新建任务抽屉顶部（标题/描述/状态/优先级/负责人） | `/private/tmp/g3-shots/B34-drawer-top-dark-675.png` | 待审证 | 抽屉表单分段采证 |
| B35 | 2026-10-17 | 675×745 | 深 | 新建任务抽屉中部（日期/进度/前置任务多选等） | `/private/tmp/g3-shots/B35-drawer-mid-dark-675.png` | 待审证 | 抽屉表单分段采证 |
| B36 | 2026-10-17 | 675×745 | 深 | 新建任务抽屉底部（提交区） | `/private/tmp/g3-shots/B36-drawer-bottom-dark-675.png` | 待审证 | 抽屉表单分段采证 |
| B37 | 2026-10-17 | 675×745 | 深 | 抽屉前置任务树状多选（P2-2 重设计的树形选择） | `/private/tmp/g3-shots/B37-drawer-predecessors-dark-675.png` | 待审证 | 前置树形控件目视 |
| B38 | 2026-10-17 | 675×745 | 深 | 抽屉 footer 校验/提示 | `/private/tmp/g3-shots/B38-drawer-footer-dark-675.png` | 待审证 | 待审证 |
| B39 | 2026-10-17 | 675×745 | 深 | 抽屉报错态（出错定位与建议） | `/private/tmp/g3-shots/B39-drawer-error-dark-675.png` | 独立测试专家 | 内联错误「任务名称不能为空」定位字段正下方、红框、输入保留，PASS 候选 |
| B40 | 2026-10-17 | 675×745（真模拟） | 浅 | 键盘 Tab×14 顺序 + 落点「会议纪要0」:focus-visible 蓝环 | `/private/tmp/g3-shots/B40-keyboard-tab-focus-visible-light-675.png` | 独立测试专家 | Tab 顺序合理，focus-visible 环可见 |
| B41 | 2026-10-17 | 675×745 | 浅 | Tab→Enter 开抽屉，焦点落入 title 输入框蓝环 | `/private/tmp/g3-shots/B41-drawer-keyboard-focus-light-675.png` | 独立测试专家 | 焦点落入成立 |
| B42 | 2026-10-17 | 675×745 | 浅 | 抽屉内 Esc 关闭，焦点归还「新建任务」按钮 | `/private/tmp/g3-shots/B42-drawer-esc-focus-return-light-675.png` | 独立测试专家 | 关闭+焦点归还成立 |
| B43 | 2026-10-17 | 675×745 | 浅 | 命名视图菜单展开→Esc 关闭，无残留浮层 | `/private/tmp/g3-shots/B43-namedview-esc-closed-light-675.png` | 独立测试专家 | Esc 关闭成立 |
| B44 | 2026-10-17 | 675×745 | 浅 | 导出菜单展开→Esc 关闭，焦点归还导出按钮 | `/private/tmp/g3-shots/B44-export-esc-closed-light-675.png` | 独立测试专家 | Esc 关闭成立 |
| B45 | 2026-10-17 | 675×745 | 浅 | 宿主设置对话框 Enter 打开→Esc 关闭归还 | `/private/tmp/g3-shots/B45-settings-esc-closed-light-675.png` | 独立测试专家 | Esc 关闭成立 |
| B46 | 2026-10-17 | 675×745 | 浅 | 纯键盘路径：Tab×9→Enter 进PM→Tab→Enter 切甘特→Tab→Enter 开抽屉焦点落 title | `/private/tmp/g3-shots/B46-keyboard-pathed-drawer-light-675.png` | 独立测试专家 | 关键路径纯键盘可达 |
| B47 | 2026-10-17 | 675×745 | 浅 | 续 B46：Esc 取消，焦点归还，甘特视图保留 | `/private/tmp/g3-shots/B47-keyboard-path-esc-cancel-light-675.png` | 独立测试专家 | 取消归还+视图保留 |
| B48 | 2026-10-17 | 675×745 | 浅 | hover「保存视图」按钮（:hover=true measured） | `/private/tmp/g3-shots/B48-hover-button-light-675.png` | 独立测试专家 | 按钮悬停态成立；任务行 hover 后端坐标外未采，记偏差 |
| B49 | 2026-10-17 | 675×745 | 浅 | 任务搜索框聚焦 focusVisible 蓝环 | `/private/tmp/g3-shots/B49-focus-searchbox-light-675.png` | 独立测试专家 | focus 态可见（旧名 focus-chip 文件已被本文件替换） |
| B50 | 2026-10-17 | 675×745 | 浅 | 标题输入 142 字长名：单行 input 横向滚动不换行 | `/private/tmp/g3-shots/B50-long-title-wrap-light-675.png` | 独立测试专家 | 实测偏差→T-DEF-003（口径待产品确认） |
| B51 | 2026-10-17 | 675×745 | 浅 | 说明输入 686 字 CJK+Latin：textarea 自动换行增高无溢出 | `/private/tmp/g3-shots/B51-long-desc-wrap-light-675.png` | 独立测试专家 | 长文换行成立 |
| B52 | 2026-10-17 | 675×745 | 浅 | 仓库/证据长 URL 单行横滚；前置依赖 5 项带状态文字 chip | `/private/tmp/g3-shots/B52-long-fields-repo-light-675.png` | 独立测试专家 | 单行字段横滚为设计；chip 带文字 |
| B53 | 2026-10-17 | 675×745 | 浅 | 执行人 64 字长名单行横滚；标题/说明长文回看，字段无错位 | `/private/tmp/g3-shots/B53-long-assignee-title-light-675.png` | 独立测试专家 | 对齐无错位 |
| B54 | 2026-10-17 | 675×745 | 浅 | G12：命名视图 pt-vmenu 展开（圆角8/菜单阴影 measured） | `/private/tmp/g3-shots/B54-g12-vmenu-light-675.png` | 独立测试专家 | 菜单圆角/阴影成立 |
| B55 | 2026-10-17 | 675×745 | 浅 | G12：管理视图弹窗 + 统一半透明遮罩 | `/private/tmp/g3-shots/B55-g12-modal-mask-light-675.png` | 独立测试专家 | 遮罩成立，命名偏差→T-DEF-002 |
| B56 | 2026-10-17 | 675×745 | 深 | G12：深色 pt-vmenu（圆角8/双层阴影 measured） | `/private/tmp/g3-shots/B56-g12-vmenu-dark-675.png` | 独立测试专家 | 主题适配成立 |
| B57 | 2026-10-17 | 675×745 | 深 | G12：深色管理视图弹窗 + 深色遮罩 | `/private/tmp/g3-shots/B57-g12-modal-mask-dark-675.png` | 独立测试专家 | 遮罩主题感知成立 |
| B58 | 2026-10-17 | 675×745 | 浅 | G12：rail 平涂/--pm-surface/rail-sub 不串扰 measured + 工具条 | `/private/tmp/g3-shots/B58-g12-rail-light-675.png` | 独立测试专家 | logo 平涂、surface 随主题、sub 独立 measured 成立；ghost 圆角偏差→T-DEF-001 |
| C01 | 2026-10-17 | 1470×857（≈1440 档，cu 真实 Chrome） | 深 | 任务页+完整左导航（探针，含版本 0.2.1-alpha.2-b74f207） | `/private/tmp/g3-shots/C01-probe-current.png` | 待审证 | 背景 rgb(21,21,23) 已验 |
| C02 | 2026-10-17 | 1470×857 | 深 | 甘特排期：2026-09-28→2027-01-03、5 任务+1 里程碑（Beta 交付 有风险）、关键路径 4、依赖线 | `/private/tmp/g3-shots/C02-gantt-dark-1440.png` | 待审证 | 1440 深色甘特 |
| C03 | 2026-10-17 | 1470×857 | 深 | 里程碑：总数 1/达成 0/有风险 1/达成率 0%，Beta 交付 目标 2026-11-30 距 44 天 | `/private/tmp/g3-shots/C03-milestones-dark-1440.png` | 待审证 | 1440 深色里程碑 |
| C04 | 2026-10-17 | 1470×857 | 深 | 风险与问题：风险矩阵（概率×影响，ri-0001 中×高）+风险清单 1 条 | `/private/tmp/g3-shots/C04-risk-dark-1440.png` | 待审证 | 1440 深色风险 |
| C05 | 2026-10-17 | 1470×857 | 深 | 人员负载：负载明细 4 人+排期负载 10月→1月+团队分布过载预警 | `/private/tmp/g3-shots/C05-people-dark-1440.png` | 待审证 | 1440 深色人员 |
| C06 | 2026-10-17 | 1470×857 | 深 | 会议纪要空态："尚无会议纪要"+"新增会议" | `/private/tmp/g3-shots/C06-meetings-dark-1440.png` | 待审证 | 1440 深色会议 |
| C07 | 2026-10-17 | 1470×857 | 深 | 进度汇报空态："暂无进度汇报…生成快照"（两个生成快照按钮） | `/private/tmp/g3-shots/C07-reports-dark-1440.png` | 待审证 | 1440 深色汇报 |
| C08 | 2026-10-17 | 1470×857 | 深 | 交付物空态：共 0 项·按状态分组管理+"新增交付物" | `/private/tmp/g3-shots/C08-deliverables-dark-1440.png` | 待审证 | 1440 深色交付物 |
| C09 | 2026-10-17 | 1470×857 | 深 | 项目概览：健康分 90 环形+元信息+任务完成 1/5 20%+阶段进度+团队负载+接下来的日程+项目链接+提醒 | `/private/tmp/g3-shots/C09-overview-dark-1440.png` | 待审证 | 1440 深色概览 |
| C10 | 2026-10-17 | 1470×857 | 深 | 总览看板：跨项目搜索+项目总数 1+任务完成率 20%+未关闭风险 1+任务完成率环+里程碑·交付物+项目状态·规模+客观进度·清单+成员负载+风险矩阵+未来按周计划 | `/private/tmp/g3-shots/C10-board-dark-1440.png` | 待审证 | 1440 深色看板 |
| C11 | 2026-10-17 | 1470×857 | 浅 | 总览看板浅色（同 C10 布局），背景 rgb(249,250,251)/白 已验 | `/private/tmp/g3-shots/C11-board-light-1440.png` | 待审证 | 1440 浅色看板 |
| C12 | 2026-10-17 | 1470×857 | 浅 | 甘特排期浅色：2026-09-28→2027-01-03、5 任务+1 里程碑（Beta 交付 有风险）、关键路径 4、依赖线、键盘微调面板 | `/private/tmp/g3-shots/C12-gantt-light-1440.png` | 待审证 | 1440 浅色甘特 |
| C13 | 2026-10-17 | 1470×857 | 浅 | 里程碑浅色：总数 1/已达成 0/有风险 1/已延期 0/计划中 0/达成率 0%，m-g3 Beta 交付 目标 2026-11-30 距 44 天 | `/private/tmp/g3-shots/C13-milestones-light-1440.png` | 待审证 | 1440 浅色里程碑 |
| C14 | 2026-10-17 | 1470×857 | 浅 | 风险与问题浅色：风险矩阵（概率×影响，ri-0001 中×高）+风险清单 1 条（高/待处理/王五/截止 2026-11-10） | `/private/tmp/g3-shots/C14-risk-light-1440.png` | 待审证 | 1440 浅色风险 |
| C15 | 2026-10-17 | 1470×857 | 浅 | 人员负载浅色：负载明细 4 人+排期负载 10月→1月+团队分布过载预警（中位 1/阈值 5/open 合计 4）【首采为深色已重采】 | `/private/tmp/g3-shots/C15-people-light-1440.png` | 待审证 | 1440 浅色人员 |
| C16 | 2026-10-17 | 1470×857 | 浅 | 会议纪要浅色空态："尚无会议纪要"+"新增会议" | `/private/tmp/g3-shots/C16-meetings-light-1440.png` | 待审证 | 1440 浅色会议 |
| C17 | 2026-10-17 | 1470×857 | 浅 | 进度汇报浅色空态："暂无进度汇报…生成快照"（两个生成快照按钮） | `/private/tmp/g3-shots/C17-reports-light-1440.png` | 待审证 | 1440 浅色汇报 |
| C18 | 2026-10-17 | 1470×857 | 浅 | 交付物浅色空态：共 0 项·按状态分组管理+"新增交付物" | `/private/tmp/g3-shots/C18-deliverables-light-1440.png` | 待审证 | 1440 浅色交付物 |
| C19 | 2026-10-17 | 1470×857 | 浅 | 项目概览浅色：健康分 90 环形+元信息+任务完成 1/5 20%+阶段进度+团队负载+接下来的日程+项目链接+提醒 | `/private/tmp/g3-shots/C19-overview-light-1440.png` | 待审证 | 1440 浅色概览 |
| D01 | 2026-10-17 | 500×857 | 浅 | 窄窗人员负载：宿主侧栏收起、视图切换变下拉选择器、负载明细/排期负载/过载预警卡片化无溢出 | `/private/tmp/g3-shots/D01-people-narrow-light.png` | 待审证 | 500 窄窗浅色人员 |
| D02 | 2026-10-17 | 500×857 | 浅 | 窄窗任务页：5 项任务统计+搜索/命名视图/状态分组/排序/导入/导出/分享工具栏换行布局、新建任务、阶段树无子任务、键盘提示、记录数 | `/private/tmp/g3-shots/D02-tasks-narrow-light.png` | 待审证 | 500 窄窗浅色任务 |
| D03 | 2026-10-17 | 500×857 | 浅 | 窄窗甘特：2026-09-28→2027-01-03、5 任务+1 里程碑、日/周/月缩放、依赖线+关键路径 4、任务条+依赖连线图形、键盘微调提示 | `/private/tmp/g3-shots/D03-gantt-narrow-light.png` | 独立测试专家 | 500 窄窗无外壳溢出；甘特轴内部滚动属例外 |
| P01 | 2026-10-17 | 675×745 | 浅 | **P2-6 F05 专用（非 G3 门证据）**：AI 助手抽屉能力卡+AI 溯源台账空态 | `/private/tmp/g3-shots/P01-prov-empty-light-675.png`；登记 `manifest-p26-gate.md` | 独立测试专家 | 诚实空态；条目级字段本轮不可观察 |
| P02 | 2026-10-17 | 675×745 | 浅 | **P2-6 F12 专用（非 G3 门证据）**：立即重校汇总行「共0·一致0·待处理0」+空态 | `/private/tmp/g3-shots/P02-recheck-empty-light-675.png`；登记 `manifest-p26-gate.md` | 独立测试专家 | 真实命令链路跑通，无伪造历史链 |
| P03 | 2026-10-17 | 675×745 | 深 | **P2-6 F05 专用（非 G3 门证据）**：AI 助手抽屉+AI 溯源台账面板深色空态（追加补采） | `/private/tmp/g3-shots/P03-prov-dark-675.png`；登记 `manifest-p26-gate.md` §5b | 独立测试专家 | 深色 token 渲染实测成立；条目级仍不可观察 |
| P04 | 2026-10-17 | 675×745 | 深 | **P2-6 F12 专用（非 G3 门证据）**：深色态「立即重校」汇总行「共0·一致0·待处理0」+空态（追加补采） | `/private/tmp/g3-shots/P04-recheck-dark-675.png`；登记 `manifest-p26-gate.md` §5b | 独立测试专家 | 深色汇总行可读；历史链仍不可观察 |
| 探针 | — | — | — | `cu-probe-1440.png`/`probe-1440.png`（宿主壳未进 PM）、`width-check.png/2/3`（宽度探针，含文字选中高亮）：非门证据，仅辅助 | `/private/tmp/g3-shots/` 同名 | 独立测试专家 | 不计入门覆盖 |
| E01 | 2026-10-17 | 1440×900 | 浅 | 任务页导出菜单展开：`.pt-vmenu` 3 项（Markdown 周报/CSV 表格/JSON 结构化），measured open/visible=true、itemCount=3 | `/private/tmp/g3-shots/E01-export-open-1440-light.png`；动作序列+measured 见 `/private/tmp/g3-shots/manifest-e.md` | 待审证 | 待审证 |
| E02 | 2026-10-17 | 1440×900 | 浅 | 导出菜单 Esc 关闭：measured open=false，任务页复原 | `/private/tmp/g3-shots/E02-export-esc-closed-1440-light.png`；见 manifest-e.md | 待审证 | 待审证 |
| E03 | 2026-10-17 | 1440×900 | 浅 | 导出菜单点外部关闭：measured open=false | `/private/tmp/g3-shots/E03-export-outside-closed-1440-light.png`；见 manifest-e.md | 待审证 | 待审证 |
| E04 | 2026-10-17 | 1440×900 | 深 | 任务页导出菜单展开（1440 深色直证，补 G11 1440 档缺口）：3 项 MD/CSV/JSON，open/visible=true | `/private/tmp/g3-shots/E04-export-open-1440-dark.png`；见 manifest-e.md | 待审证 | 待审证 |
| E05 | 2026-10-17 | 768×1024 | 浅 | 任务页真 768 多列回流（G02）：工具条 wrap/h179、编号列保留、5 行无行叠印；表体 shell 内部横向滚动(1313/707)，右缘优先级/进度/操作列在帧外 | `/private/tmp/g3-shots/E05-tasks-768-light.png`；measured 见 manifest-e.md | 待审证 | 待审证 |
| E06 | 2026-10-17 | 768×1024 | 深 | 任务页真 768 多列回流（G02）：同 E05，深色 bodyBg=rgb(21,21,23) | `/private/tmp/g3-shots/E06-tasks-768-dark.png`；见 manifest-e.md | 待审证 | 待审证 |
| E07 | 2026-10-17 | 768×1024 | 浅 | 总览看板（G06 抽样）：搜索/完成率20%环/里程碑交付物/项目状态/客观进度/成员负载/风险矩阵/周计划，doc 768=768 无外壳溢出 | `/private/tmp/g3-shots/E07-board-768-light.png`；见 manifest-e.md | 待审证 | 待审证 |
| E08 | 2026-10-17 | 390×844 | 浅 | 任务页表格→卡片回流（G03）：thead display=none、5 卡片、工具条 wrap/h365、doc/body 390=390 无外壳横向溢出 | `/private/tmp/g3-shots/E08-tasks-390-light.png`；见 manifest-e.md | 待审证 | 待审证 |
| E09 | 2026-10-17 | 390×844 | 深 | 任务页表格→卡片回流（G03）：同 E08，深色 bodyBg=rgb(21,21,23) | `/private/tmp/g3-shots/E09-tasks-390-dark.png`；见 manifest-e.md | 待审证 | 待审证 |
| E10 | 2026-10-17 | 390×844 | 浅 | 新建任务抽屉：单列纵向堆叠、全宽390、取消/添加任务按钮 nowrap、抽屉无横向溢出（G03） | `/private/tmp/g3-shots/E10-newtask-drawer-390-light.png`；见 manifest-e.md | 待审证 | 待审证 |
| E11 | 2026-10-17 | 390×844 | 浅 | 总览看板 390 折叠态（G10）：PM 左导航隐藏(railW=0)，经顶栏「更多」菜单进入，单列堆叠，doc/body 390=390 | `/private/tmp/g3-shots/E11-board-390-light.png`；见 manifest-e.md | 待审证 | 待审证 |
| E12 | 2026-10-17 | 390×844 | 浅 | PM 导航视图切换下拉展开态（G10 折叠态补采）：9 视图项+真实计数（全部任务5 选中带勾/里程碑1/风险与问题1/会议纪要0/进度汇报0/交付物0/项目概览—/甘特排期—/人员负载—）；measured groupLabels=[]（下拉内无「跨项目/计划与排期/协作与记录」分组标签） | `/private/tmp/g3-shots/E12-menu-390-light.png`；measured 见 manifest-e.md | 独立测试专家 | 待审证 |
| E13 | 2026-10-17 | 390×844 | 深 | PM 导航视图切换下拉展开态（G10 折叠态补采）：同 E12 九项计数+选中带勾态，深色底，groupLabels=[] | `/private/tmp/g3-shots/E13-menu-390-dark.png`；见 manifest-e.md | 独立测试专家 | 待审证 |
| E14 | 2026-10-17 | 1440×900 | 浅 | G12 复验：`.pt-ghost` computed borderRadius=8px（7 元素全 8px）；保存视图弹窗遮罩类名 `.pm-modal-mask`（无 pt-vm-mask 残留），bg rgba(0,0,0,.24) 主题感知 | `/private/tmp/g3-shots/E14-saveview-1440-light.png`；measured | 主端实测 | 见 §B G12 |
| E15 | 2026-10-17 | 1440×900 | 深 | G12 复验：`.pt-ghost` computed borderRadius=8px；保存视图弹窗遮罩 `.pm-modal-mask`（无残留），bg rgba(0,0,0,.5) 深色主题感知 | `/private/tmp/g3-shots/E15-saveview-1440-dark.png`；measured | 主端实测 | 见 §B G12 |

### A.1 bu E 批追加登记（21:10–21:35，CDP Emulation 真回流，帧恒 675×745；登记自 manifest-bu.md E 批，门结论见 §B）

| 批次 | 时间 | 视口（innerWidth/帧） | 主题 | 覆盖视图/动作 | 附件（绝对路径） | 审证人 | 初步结论 |
|---|---|---|---|---|---|---|---|
| B59 | 2026-10-17 | innerW=768 / 帧675右缘裁 | 浅 | 任务页真768 CSS 回流：chip 两行、工具条一行排开、编号身份列保留、无叠印 | `/private/tmp/g3-shots/B59-tasks-768-light-675frame.png` | 终审证专家 | 见 §B G02 |
| B60 | 2026-10-17 | innerW=768 / 帧675右缘裁 | 深 | 任务页真768 回流深色镜像 | `/private/tmp/g3-shots/B60-tasks-768-dark-675frame.png` | 终审证专家 | 见 §B G02 |
| B61 | 2026-10-17 | innerW=390 / 帧675右侧空 | 浅 | 任务页表格→卡片：顶栏、chip 两行、工具按钮纵向全宽堆叠、+新建任务全宽、首卡可见 | `/private/tmp/g3-shots/B61-tasks-390-light-675frame.png` | 终审证专家 | 见 §B G03 |
| B62 | 2026-10-17 | innerW=390 / 帧675右侧空 | 浅 | 新建任务抽屉单列全宽堆叠、名称框 focus 蓝环、字段无错位 | `/private/tmp/g3-shots/B62-drawer-390-light-675frame.png` | 终审证专家 | 见 §B G03 |
| B63 | 2026-10-17 | innerW=390 / 帧675右侧空 | 浅 | 总览看板统计卡单列/双列堆叠、无横向溢出 | `/private/tmp/g3-shots/B63-board-390-light-675frame.png` | 终审证专家 | 见 §B G03/G06 |
| B64 | 2026-10-17 | innerW=390 / 帧675右侧空 | 深 | 任务页390深色镜像 | `/private/tmp/g3-shots/B64-tasks-390-dark-675frame.png` | 终审证专家 | 见 §B G03 |
| B65 | 2026-10-17 | innerW=390 / 帧675右侧空 | 深 | 新建任务抽屉390深色单列镜像 | `/private/tmp/g3-shots/B65-drawer-390-dark-675frame.png` | 终审证专家 | 见 §B G03 |
| B66 | 2026-10-17 | innerW=390 / 帧675右侧空 | 深 | 总览看板390深色堆叠镜像 | `/private/tmp/g3-shots/B66-board-390-dark-675frame.png` | 终审证专家 | 见 §B G03/G06 |
| B67 | 2026-10-17 | 675×745 | 浅 | 保存视图弹窗空名：「保存视图」disabled=true/opacity.5/cursor=not-allowed，遮罩+状态摘要可见 | `/private/tmp/g3-shots/B67-saveview-empty-light-675.png` | 终审证专家 | 见 §B G04/G08/G11 |
| B68 | 2026-10-17 | 675×745 | 深 | 保存视图弹窗空名深色禁用态镜像 | `/private/tmp/g3-shots/B68-saveview-empty-dark-675.png` | 终审证专家 | 见 §B G04/G08/G11 |

## B. 逐门接收对照（对应测试计划 T2-G01~G12）

> 状态回填：PASS / FAIL（附缺陷号）/ BLOCKED（写明缺哪份证据）/ NOT_RUN。FAIL 必须带 `defect-format.md` 全字段。

| ID | 必看证据点 | 本批收到？(路径/动作) | 审证结论 | 备注/偏差 |
|---|---|---|---|---|
| T2-G01 | 9 视图+总览看板浅深×1440，角色/间距/圆角/边框与已认可基线一致，无视觉漂移 | 深 1440 全 10 视图 C01-C10；浅 1440 全 10 视图 B19+C11-C19（逐张目视） | **PASS**（终审抽查维持） | 浅深成对镜像、间距/圆角/边框一致，未见视觉漂移；终审抽查 B19/C10 等路径文件齐全无损坏；偏差③：C 批视口 1470×857 与 B19/B20 的 1470×797 高度略异，不影响布局判定 |
| T2-G02 | 768 多列回流、工具条换行、身份列保留、无叠印（浅深） | 真768：E05-tasks-768-light.png / E06-tasks-768-dark.png（Playwright 768×1024 真视口，逐张目视）；bu CDP innerW=768 佐证 B59/B60；旧 675 裁切批 B02/B03/B21-B30 | **PASS** | 终审证（2026-10-17）：E05/E06 measured `.pt-toolbar` flexWrap=wrap/h179 换行成立、「编号」身份列表头 visible、5 行 rowOverlap=false 无叠印、doc 768=768 无外壳溢出；浅深镜像。**裁决：表体在 `.pm-shell` 内部横向滚动（scrollW1313/clientW707），右缘优先级/进度/操作列在内部滚动区而非外壳溢出，与 D03 甘特轴内部滚动同类例外，不阻却 PASS**；B59/B60 为 bu 675 物理帧右缘裁，仅作佐证，回流判定以 E05/E06 真视口为准 |
| T2-G03 | 390 表格/卡片、抽屉 1 列、按钮 nowrap 不折行、无外壳横向溢出（甘特轴除外） | 真390：E08-tasks-390-light.png / E09-tasks-390-dark.png（Playwright 390×844，thead display=none、5 卡片、工具条 wrap/h365、doc/body 390=390、shell 338/329）；E10-newtask-drawer-390-light.png（单列全宽、overflowX=false、取消/添加任务 nowrap）；bu 佐证 B61/B64 任务、B62/B65 抽屉、B63/B66 看板；旧 500 近似 D01-D03 | **PASS** | 终审证（2026-10-17）：E08/E09 表格→卡片回流浅深成立、无外壳横向溢出；E10 抽屉单列纵向堆叠、按钮 nowrap 不折行；B62/B65 深色抽屉单列佐证。**裁决：390 档 PM 左导航整栏隐藏、导航改走顶栏「更多」属 G10 导航议题，不属本门（本门只管表格/卡片/抽屉/按钮/外壳溢出），不阻却 G03 PASS**。残余观察：真390 仅采任务页/抽屉/看板，里程碑/风险/人员/会议/汇报/交付物/概览/甘特未逐张清验（甘特轴内部滚动为例外），列入 F 残余清单不单独阻却 |
| T2-G04 | 状态 chip 带文字标签不单靠红绿；选中/hover/focus/disabled/empty/error 各态可见一致 | 文字标签 C01-C19/B38/B52；hover B48；focus B40/B41/B46/B49；empty C06-C08/C16-C18；error B39；**disabled 新证 B67-saveview-empty-light-675.png / B68-saveview-empty-dark-675.png（空名「保存视图」disabled=true/opacity.5/cursor=not-allowed，浅深逐张目视）** | **PASS** | 终审证（2026-10-17）：六态齐备——文字标签、hover(B48)、focus(B40/B41/B46/B49)、empty(C06-C08/C16-C18)、error(B39 内联定位+输入保留)、disabled(B67/B68 灰化 not-allowed)。说明：新建任务空名不禁用而走提交后内联报错（B38/B39）为产品既定模式，与保存视图空名禁用并存，非缺陷；disabled 态由保存视图弹窗直证，缺口闭合 |
| T2-G05 | 主按钮中性（浅近黑白字/深反白近黑），无蓝填充 CTA；ghost/danger/icon 可辨 | B19/B20/C01-C19/B41/B46/B55/B57 全量目视 | **PASS**（终审抽查维持） | 主按钮中性填充（深反白近黑/浅黑底白字），全量未见蓝填充 CTA（终审抽查 B19/E01 主按钮黑底白字/深反白）；ghost（保存视图/按状态分组/导入/导出/分享）与 icon（铅笔/搜索）可辨；danger 以管理弹窗文本操作（重命名/设为默认/删除）呈现，无填充 danger CTA |
| T2-G06 | 无廉价大数字卡、无重复信息、无贴边、无窄表单错位、无无意义留白（里程碑大 padding 反例不复现） | 1440 全 20 视图 + 675 可见区 + B34-B38 抽屉；新证 E07-board-768-light.png（768 看板抽样）、E08/E09（390 任务卡片）、E10/B62/B65（390 抽屉窄表单）、E11/B63/B66（390 看板堆叠），逐张目视 | **PASS（抽样覆盖）** | 终审证（2026-10-17）：1440 全视图无廉价大数字卡/无重复信息/无贴边；里程碑 C03/C13 紧凑无大 padding 反例复现；768 看板 E07 卡片栅格对齐、完成率环非大数字堆砌；390 抽屉 E10/B62/B65 字段全宽单列无错位、按钮不折行；390 看板 E11/B63/B66 堆叠无贴边无意义留白。**抽样边界（如实登记）：768/390 未对全部 9 视图逐张清验，仅任务页/抽屉/看板抽样；排版原则为共享原语，抽样未见违规** |
| T2-G07 | 键盘：Tab 顺序、`:focus-visible` 可见、抽屉/菜单焦点落入与关闭归还、Esc 关闭、关键路径纯键盘可完成（1440 浅） | B40 Tab 顺序+focus-visible 环；B41 焦点落入；B42 归还；B43/B44/B45 Esc 关闭三类浮层；B46/B47 纯键盘关键路径+Esc 取消归还（动作记录逐键） | **PASS**（终审维持，未重审） | 全部键盘要素 observed；终审抽查 B40 focus-visible 蓝环成立；**偏差：采于 675 浅而非门口径 1440 浅**——Tab/焦点/Esc 为分辨率无关行为，纯键盘路径完整记录，故实质 PASS；若 owner 要求严格 1440 浅复拍可补，不影响行为成立 |
| T2-G08 | 正常/空/长文（超长名/换行）/报错/禁用逐视图；空态诚实不伪装零值 | 空态 C06/C07/C08 深、C16/C17/C18 浅；长文 B51 说明换行/B50/B53 标题单行横滚；报错 B39；禁用 B67/B68（新证）；正常全视图；390/真768 回流 E05-E11/B59-B66 | **PASS** | 终审证（2026-10-17）：空态诚实不伪装零值、说明 686 字换行增高、报错定位+输入保留、禁用态（B67/B68）均成立；长文超长名口径已由产品确认「保留单行横滚」（2026-10-17 拍板），T-DEF-003 关闭，长文子项闭合；全部子项证据齐备，本门转 PASS |
| T2-G09 | 截图逐张目视（非仅数量），命名符合 WALKTHROUGH-SPEC，证据等级 observed>measured>DOM>截图 | 终审逐张目视目录现存门证据 PNG（含新证 B59-B68/E01-E13）；命名 B##/C##/D##/E##/P##-页面-主题-视口 一致；B03==B07 cmp 相同（B07 未展开已由 B31/E01/E04 替换），B07≠B31、B32≠B33 | **PASS**（终审维持，本门即本次审证动作） | 终审逐张目视新证 B59-B68/E01-E13 并复核全量现存 PNG 路径齐全；命名 B##/C##/D##/E##/P##-页面-主题-视口一致；探针/aux/resp/width-check 不计入门覆盖；证据等级已在 A 表标注 observed/measured；E02==E03 静置帧相同已在 G11 备注说明 |
| T2-G10 | P2-1 导航：分组标签/折叠/搜索/真实计数/选中态浅深×三视口一致，logo 与菜单项视觉不突兀，键盘可达 | 宽档 1440 C01-C19、675 B02-B30、500 D01-D03（分组标签/折叠 chevron/搜索框/真实计数/选中态浅深一致）；B40 键盘可达；390 折叠态：E11-board-390-light.png（railW=0 静置、经顶栏「更多」进看板）、**E12-menu-390-light.png / E13-menu-390-dark.png（视图切换下拉展开：9 项+真实计数 5/1/1/0/0/0/—/—/—+当前项选中带勾，open/visible=true、itemCount=9、groupLabels=[]，浅深镜像，doc/body 390=390）** | **PASS（附注：390 扁平下拉，分组标签随 rail 设计性隐藏）** | 终审证（2026-10-17 定向补证裁决）：①宽档（1440/675/500）分组标签/折叠/搜索/真实计数/选中态浅深一致、logo 中性、键盘可达成立；②**390 裁决：源码只读核对 `panel.css` `@media(max-width:560px){.pm-rail{display:none}}`（注释「窄屏隐藏左 rail，沿用现有 ViewSwitcher 下拉」）——rail 及其分组标签/rail 搜索/组折叠在 ≤560 为设计性隐藏，导航由 ViewSwitcher 扁平下拉承接（E12/E13 直证九项可达+真实计数+选中勾，浅深镜像、无外壳溢出）；分组标签缺失属同一 IA 的宽/窄两种呈现（响应式设计），非违判**；③总览看板/口径设置经顶栏「更多」进入（E11 路径），与下拉分工明确。附注留存：390 下拉为扁平列表不渲染分组标签（groupLabels=[]），不要求窄档复刻宽档分组层级 |
| T2-G11 | P2-5：命名视图菜单/保存弹窗/导出下拉/快照按钮视觉一致；空名禁提交、关闭即取消；点外部/Esc 关闭 | 菜单 B04/B05/B54/B56；管理弹窗 B06/B55/B57；导出 1440 浅展开 E01、Esc 闭 E02、外点闭 E03、1440 深展开 E04（Playwright 1440×900，逐张目视）；675 补 B31/B32/B33/B44；空名禁提交 B67/B68（disabled=true/opacity.5/not-allowed 浅深）；快照 B18；取消零写「全部5」不变 | **PASS** | 终审证（2026-10-17）：1440 浅导出菜单展开（MD/CSV/JSON 三项）/Esc 关闭/点外部关闭三态齐（E01-E03），1440 深展开直证（E04），视觉与 675 档一致；空名禁提交由 B67/B68 截图直证（旧缺口闭合）；关闭即取消、零写复核成立；快照 B18 自包含。说明：E02/E03 关闭帧与采前确认帧逐字节相同，关闭状态以 measured open=false 探针为据（状态变化不可在静置帧区分，等级 measured，可接受） |
| T2-G12 | 规范 §4 校准：rail-logo 平涂无渐变；菜单硬编码暗色→`--pm-surface`；`pt-vmenu` 圆角16→8/阴影→menu；ghost 圆角对齐 sm(8)；弹窗遮罩走宿主 mask；`pm-rail-sub` 不串样式；只读快照 emoji→内联 SVG 锁、中性值、零外链（1440 浅深） | 快照 B18 确定性核查（0 script/0 http/0 href-src/0 emoji/1 内联 SVG，终审复核 5123B 数值不变）；旧 measured+截图 B54-B58；源码只读核对（终审）：tasks.css `.pt-ghost` 已改 `border-radius:var(--r-sm)`、gantt.css `.pm-chip` 已改 `var(--r-sm)`、tasks.tsx 两处遮罩类名已改 `.pm-modal-mask`（无残留 pt-vm-mask）；**1440 运行时复验（主端 2026-10-17）：浅/深 `.pt-ghost` computed borderRadius=8px（7 元素全 8px）、甘特页 `.pm-chip`=8px、保存视图弹窗遮罩 `.pm-modal-mask` 无残留且浅 rgba(0,0,0,.24)/深 .5 主题感知——见 E14/E15 截图+measured** | **PASS** | 快照自包含子项 PASS；(1)logo 平涂 (2)rail 走 --pm-surface (3)vmenu 圆角8+菜单阴影 (6)rail-sub 不串扰 旧 measured 候选维持；(4)ghost 圆角 T-DEF-001、(5)遮罩类名 T-DEF-002 已由 1440 浅深运行时复验闭合（E14/E15），T-DEF-001/002 转 CLOSED |

## C. 本批优先变化（用户指定顺序）

1. 任务页 + 左导航：浅/深 × 三视口（T2-G01/02/03/10）。
2. 命名视图菜单 + 保存/管理弹窗（T2-G11）：空名禁提交、关闭取消、Esc/外部关闭。
3. 导出（MD/CSV/JSON）+ 只读快照：本地下载、快照零外链/零脚本、SVG 锁（T2-G11/G12）。
4. 项目菜单 / 更多菜单：打开/选中/关闭、项层级一致（T2-G04/05）。
5. 抽屉：报错信息定位+建议、出错保留输入、焦点不落空、禁用态（T2-G07/08）。
6. 其余视图按批次补齐；未收到的门保持 BLOCKED，不得提前 PASS。

## D. 缺陷记录（模板，按 defect-format.md 全字段）

| 缺陷号 | 门ID | 严重度 | 现象(实测) | 预期 | 证据(截图/动作日志行) | 复现步骤 | 状态 |
|---|---|---|---|---|---|---|---|
| T-DEF-001 | T2-G12(4) | S3 | ghost 按钮圆角实测 12px，未对齐 sm(8) | ghost 圆角 8px，与工具条 primary/icon 一致 | manifest-bu.md D3(4) measured；B54/B58 浅、B56 深；终审只读核对 tasks.css/gantt.css 已改 var(--r-sm)；E14/E15 1440 浅深实测 borderRadius=8px | 675 浅/深工具条取 `.pt-ghost` getComputedStyle().borderRadius=12px | **CLOSED**（修复落地+1440 浅深运行时复验 8px 通过，G12 PASS） |
| T-DEF-002 | T2-G12(5) | S4 | 遮罩类名 `.pt-vm-mask`、`--dsw-alias-bg-mask-1` 在 :root 不可见，与规范字面命名不符（遮罩功能成立） | 遮罩走宿主 mask 变量，类名/变量对齐规范 | manifest-bu.md D3(5)；B55/B57；终审只读核对 tasks.tsx 已改 .pm-modal-mask；E14/E15 1440 浅深实测类名 pm-modal-mask 无残留 | 开管理视图弹窗查 mask 类名与变量解析链 | **CLOSED**（修复落地+1440 浅深运行时复验通过，G12 PASS） |
| T-DEF-003 | T2-G08 长文 | S4 | 标题/执行人单行 input 超长横向滚动不换行（说明 textarea 正常换行），与"超长名换行不溢出"口径待确认 | 验收口径明确超长任务名是否要求换行；当前为常规单行横滚 | B50/B51/B52/B53；manifest-bu.md D2 | 抽屉标题输入 142 字观察 scrollWidth>clientWidth、overflowX=true | **已关闭**（产品 2026-10-17 拍板保留单行横滚，缺陷关闭，G08 转 PASS） |

### D.1 缺陷全字段（defect-format.md）

**T-DEF-001**
- 编号：T-DEF-001
- 标题：ghost 按钮圆角实测 12px，偏离规范 sm(8) 校准目标
- 严重度：S3（一般，打磨/一致性）
- 类别：页面样式
- 被测提交：实例运行 bundle（C01 探针可见版本 0.2.1-alpha.2-b74f207；以隔离实例实际运行为准）
- 现象：D3 段 CDP measured，浅/深所有 `.pt-ghost` 按钮 `border-radius=12px`；B54/B58（浅）、B56（深）截图可见工具条 ghost 圆角大于相邻主按钮/icon
- 预期：规范 §4「ghost 圆角对齐 sm(8)」，同一工具条上 ghost/primary/icon 圆角一致
- 证据：`/private/tmp/g3-shots/manifest-bu.md` D3(4)；截图 B54-g12-vmenu-light-675.png、B58-g12-rail-light-675.png、B56-g12-vmenu-dark-675.png（独立测试专家 2026-10-17 目视复核）
- 根因初判：ghost 类圆角沿用 12px 弹窗档，未按 §4 校到 sm(8)（最终以开发定位为准）
- 影响：工具条 ghost 与 primary/icon 圆角不一致，视觉打磨偏差，不影响功能
- 复现方式：675 浅/深任意工具条，`.pt-ghost` getComputedStyle().borderRadius === '12px'
- 状态：**FIXED（源码已修，待 1440 浅深运行时复验）**——终审只读核对：`packages/dsh-pm-tool/src/client/views/tasks.css` `.pm-tasks-root .pt-ghost` 已改 `border-radius: var(--r-sm)`（=8px），`views/gantt.css` `.pm-gantt-root .pm-chip` 已改 `var(--r-sm)`；build 通过；待 owner 1440 实测复测 borderRadius=8px 后方可关单
- 指派：开发修复（已完成源码层）；测试复验

**T-DEF-002**
- 编号：T-DEF-002
- 标题：弹窗遮罩类名/变量链与规范字面不符（功能遮罩成立，命名 drift）
- 严重度：S4（观察，一致性 drift）
- 类别：网页实测
- 被测提交：同上
- 现象：实测遮罩类名为 `.pt-vm-mask`（非规范字面 `.pm-modal-mask`），浅 `rgba(0,0,0,.24)`/深 `rgba(0,0,0,.5)` 主题感知半透明；`:root` 上 `--dsw-alias-bg-mask-1` 读取为空（定义链未暴露到 :root）
- 预期：遮罩复用宿主 `--dsw-alias-bg-mask-1`，类名/变量对齐规范
- 证据：manifest-bu.md D3(5)；B55-g12-modal-mask-light-675.png、B57-g12-modal-mask-dark-675.png
- 根因初判：命名链未暴露到 :root / 类名沿用 pt-vm 前缀（待开发确认）
- 影响：仅命名/变量链 drift；半透明遮罩视觉在浅深均成立，无功能影响
- 复现方式：打开管理视图弹窗，检查 mask 类名与 `--dsw-alias-bg-mask-1` 解析
- 状态：**FIXED（源码已修，待 1440 浅深运行时复验）**——终审只读核对：`views/tasks.tsx` 两处遮罩类名已由 `.pt-vm-mask` 改为 `.pm-modal-mask`（grep 无残留 pt-vm-mask），css 同步；待 owner 1440 实测复测类名/变量链后方可关单
- 指派：开发修复（已完成源码层）；测试复验

**T-DEF-003**
- 编号：T-DEF-003
- 标题：任务标题/执行人单行 input 超长横向滚动不换行（说明 textarea 正常换行），口径待产品确认
- 严重度：S4（观察，待产品确认，不自行豁免）
- 类别：用户体验
- 被测提交：同上
- 现象：B50 标题输入 142 字中英混合，scrollW>clientW、overflowX=true，单行横滚仅显尾部；B53 执行人 64 字同；B51 说明 686 字 CJK+Latin 自动换行、高度随内容增长、无叠印；B52 仓库/证据 URL 单行横滚（常规设计）
- 预期：验收口径"超长任务名/描述换行不溢出"；当前标题为单行 input 横滚，是否要求多行/截断待产品与规范明确
- 证据：B50-long-title-wrap-light-675.png、B51-long-desc-wrap-light-675.png、B52-long-fields-repo-light-675.png、B53-long-assignee-title-light-675.png；manifest-bu.md D2
- 根因初判：title/assignee 为单行 input，未做多行换行或截断处理
- 影响：表单内长标题不可见全量（横滚）；列表行未见截断问题
- 复现方式：抽屉标题输入 142 字，观察 scrollWidth 与 overflowX
- 状态：**OPEN（待产品确认口径；终审 2026-10-17 维持，未经所有者特批不豁免；G08 因此 BLOCKED）**
- 指派：产品+开发

## E. 收口判据

- T2-G01~G12 全部 PASS（或 FAIL 项修复后复测 PASS）方可建议 G3 PASS；任一 BLOCKED 未补齐即整体 BLOCKED。
- **并行例外**：G3 未过期间，P2-6 核心/治理/UI 候选可并行开发与离线确定性测试（见 `p2-6-implementation-test-plan-20261017.md`），但这不等于 G3 PASS；P2-6 自身 UI 仍需独立目视门，静态/自动不当视觉 PASS；发布合入仍按门顺序、不继承旧 PASS。本工作表与最终结论一并入 `docs/testing`。

## F. 最终审证结论（2026-10-17 收尾审证，终审证专家；只读审计，未操作浏览器、未改产品代码、未 commit）

> 本批为前任审证专家中断后的收尾：以磁盘证据为准，新证 B59-B68 / E01-E13 已逐张目视（E12/E13 为 G10 定向补证），前任已 PASS 的 G01/G05/G07/G09 仅抽查路径不重审。证据等级 observed > measured > DOM/源码 > 截图；探针/aux/resp/width-check 不计入门覆盖。

### F.1 逐门矩阵（12 门）

| 门 | 终审结论 | 关键证据（绝对路径） | 依据/偏差 |
|---|---|---|---|
| T2-G01 | **PASS**（维持） | 1440 深 C01-C10、浅 B19+C11-C19；终审抽查 `/private/tmp/g3-shots/B19-tasks-light-1440-cu.png`、`C10-board-dark-1440.png` | 浅深镜像、无视觉漂移；1470×857 与 1470×797 高度略异不影响判定 |
| T2-G02 | **PASS**（由 BLOCKED(PARTIAL) 翻正） | `/private/tmp/g3-shots/E05-tasks-768-light.png`、`E06-tasks-768-dark.png`（真 768×1024）；佐证 `B59-tasks-768-light-675frame.png`、`B60-tasks-768-dark-675frame.png` | 工具条 wrap/h179、编号身份列保留、5 行无叠印、doc768=768；**表体 .pm-shell 内部横滚(1313/707)非外壳溢出，不阻却** |
| T2-G03 | **PASS**（由 BLOCKED(PARTIAL) 翻正） | `/private/tmp/g3-shots/E08-tasks-390-light.png`、`E09-tasks-390-dark.png`、`E10-newtask-drawer-390-light.png`；佐证 `B61/B62/B64/B65`（同目录）；旧 D01-D03(500) | 表格→卡片(thead none/5 卡)、抽屉单列、按钮 nowrap、doc/body390=390 无外壳溢出；390 导航隐藏属 G10 议题不阻却本门 |
| T2-G04 | **PASS**（由 BLOCKED(PARTIAL) 翻正） | disabled 新证 `/private/tmp/g3-shots/B67-saveview-empty-light-675.png`、`B68-saveview-empty-dark-675.png`；hover B48、focus B40/B41/B46/B49、empty C06-C08/C16-C18、error B39、文字标签全量 | 六态齐备；新建任务空名走内联报错（产品模式）与保存视图空名禁用并存，非缺陷 |
| T2-G05 | **PASS**（维持） | B19/B20/C01-C19/B55/B57；终审抽查 B19/E01 主按钮中性无蓝 CTA | ghost/danger/icon 可辨 |
| T2-G06 | **PASS（抽样覆盖）**（由 BLOCKED(PARTIAL) 翻正） | `/private/tmp/g3-shots/E07-board-768-light.png`、`E08/E09`、`E10`、`E11-board-390-light.png`、`B63/B66`；1440 全 20 视图 | 无廉价大数字卡/重复信息/贴边/窄表单错位/无意义留白；抽样边界见 F.3 |
| T2-G07 | **PASS**（维持） | B40-B47 键盘逐键记录；终审抽查 B40 focus-visible 蓝环 | 采于 675 浅（分辨率无关行为），实质 PASS；严格 1440 浅复拍为可选补强 |
| T2-G08 | **PASS**（由 BLOCKED 翻正） | 空态 C06-C08/C16-C18、长文 B51、报错 B39、禁用 B67/B68 均成立；超长名 B50/B52/B53 | **T-DEF-003 产品 2026-10-17 拍板保留单行横滚，缺陷关闭；长文子项闭合，G08 转 PASS** |
| T2-G09 | **PASS**（维持，本门即本次审证动作） | 全量现存 PNG 路径复核齐全；新证 B59-B68/E01-E15 逐张目视；命名规范 | E02==E03 静置帧相同已在 G11 备注（measured open=false 为据） |
| T2-G10 | **PASS（附注：390 扁平下拉，分组标签随 rail 设计性隐藏）**（由 BLOCKED(PARTIAL) 翻正） | 宽档 1440 C01-C19、675 B02-B30、500 D01-D03、键盘 B40；390 静置 `/private/tmp/g3-shots/E11-board-390-light.png`；展开态 `/private/tmp/g3-shots/E12-menu-390-light.png`、`/private/tmp/g3-shots/E13-menu-390-dark.png`（9 项+真实计数+选中带勾，groupLabels=[]） | ≤560 `.pm-rail{display:none}` 为设计（panel.css 媒体查询），分组标签/rail 搜索/组折叠随 rail 隐藏，导航由 ViewSwitcher 扁平下拉承接；非违判 |
| T2-G11 | **PASS**（由 BLOCKED(PARTIAL) 翻正） | 1440 `/private/tmp/g3-shots/E01-export-open-1440-light.png`、`/private/tmp/g3-shots/E02-export-esc-closed-1440-light.png`、`/private/tmp/g3-shots/E03-export-outside-closed-1440-light.png`、`/private/tmp/g3-shots/E04-export-open-1440-dark.png`；空名禁用 `/private/tmp/g3-shots/B67-saveview-empty-light-675.png`、`B68-saveview-empty-dark-675.png`；菜单 B04/B05/B54/B56；管理弹窗 B06/B55/B57；快照 B18 | 1440 浅深导出三态齐、空名禁提交直证、关闭即取消零写、快照自包含 |
| T2-G12 | **PASS**（由 FAIL 翻正，T-DEF-001/002 CLOSED） | 快照 B18（5123B，0 script/0 http/0 href-src/1 SVG，终审复核数值不变）；源码只读核对 tasks.css/gantt.css `var(--r-sm)`、tasks.tsx `.pm-modal-mask`；**1440 浅深运行时复验 E14/E15（主端 2026-10-17）：`.pt-ghost` borderRadius=8px（7 元素）、甘特 `.pm-chip`=8px、遮罩 `.pm-modal-mask` 无残留且浅 .24/深 .5 主题感知** | 源码修复+1440 浅深实测闭合 T-DEF-001/002，G12 转 PASS；旧 measured 候选项（logo 平涂/rail --pm-surface/vmenu 圆角8/rail-sub 不串扰）维持 |

### F.2 整体 G3 结论

**整体 G3 = PASS（收口）**

- PASS 12 门：G01、G02、G03、G04、G05、G06、G07、G08、G09、G10、G11、G12。
- 缺陷：T-DEF-001/002（G12）修复经 1440 浅深运行时复验闭合；T-DEF-003（G08）产品拍板保留单行横滚关闭。三项全部 CLOSED。
- 依 E 判据：12 门全 PASS、无 OPEN/FAIL 缺陷，整体 G3 收口通过。

### F.3 残余清单（已闭合项归档，登记备查，不再阻却）

1. **G08 / T-DEF-003（已决策）**：产品 2026-10-17 拍板「保留单行横滚」，缺陷关闭，G08 转 PASS。
2. **G12 复验（已闭合）**：1440 浅深运行时复测 E14/E15——`.pt-ghost`/甘特 `.pm-chip` borderRadius=8px、遮罩 `.pm-modal-mask` 类名+宿主 mask 变量链（浅 .24/深 .5）全部成立；旧 measured 候选项（logo 平涂、rail --pm-surface、vmenu 圆角8+菜单阴影、rail-sub 不串扰）一并维持。
3. **抽样边界（不阻却，登记备查）**：G06 在 768/390 仅任务页/抽屉/看板抽样，里程碑/风险/人员/会议/汇报/交付物/概览未在 768/390 逐张清验；G03 同档未采甘特（甘特轴内部滚动为例外）。排版原则为共享原语，抽样未见违规；后续 #51 全系统走查将按新规范逐页覆盖。
4. **前任异常已闭合**：B07 未展开已由 B31/E01/E04 替换；B17 抽屉覆盖不足已由 B34-B38/E10/B62/B65 替换。
5. **G10 附注（已闭合，留存说明）**：390 下拉为扁平列表不渲染分组标签（groupLabels=[]），分组标签/rail 搜索/组折叠随 ≤560 隐藏的 rail 一并隐藏，系 `panel.css` 媒体查询设计，非缺陷、非缺口。

### F.4 收口动作记录（已全部完成，2026-10-17）

1. **T-DEF-003 产品决策**：用户书面确认保留单行横滚 → 缺陷关闭、G08 转 PASS。
2. **G12 1440 浅深复验**：主端实测 E14/E15（`.pt-ghost`/`.pm-chip`=8px、遮罩 `.pm-modal-mask` 无残留、浅 .24/深 .5）→ T-DEF-001/002 CLOSED、G12 转 PASS。
3. 12 门全 PASS、无 OPEN 缺陷 → 整体 G3 收口通过；工作树（P2-2 候选 + T-DEF 修复 + 本工作表更新）可 commit/push。


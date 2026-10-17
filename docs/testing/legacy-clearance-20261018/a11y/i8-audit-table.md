# I8 读屏播报 — DOM 级 aria 语义审计表（无 AT 环境）

- 被测提交：`380802c`；方法：Playwright 抽样关键控件，DOM 级解析可访问名来源/角色/状态属性（`/tmp/a11y-i8.log`、`/tmp/a11y-i8b.log`）。
- **重要声明：本环境无屏幕阅读器/AT，下表全部结论统一标「AT 实测待专项」，不得视为 PASS，不得伪造播报结果。**

## 审计表

| # | 控件（定位） | 可访问名来源 | 角色 | 状态可推导性 | 结论 |
|---|---|---|---|---|---|
| 1 | 左 rail 导航项「全部任务 5」(`.pm-rail-item.active`, nav-rail.tsx:75) | 可见文本（label 文本+计数） | 原生 button | `aria-current="page"` 表达当前视图，可推导 | AT 实测待专项 |
| 2 | rail 搜索框(`.pm-rail-search input`) | aria-label「搜索导航项」 | 原生 search input | — | AT 实测待专项 |
| 3 | 项目切换器 trigger(`.pm-project-switcher-btn`) | 可见文本「G3 验收项目」 | 原生 button | `aria-haspopup=listbox`、`aria-expanded=false` | AT 实测待专项 |
| 4 | 主 CTA「新建任务」(`button.pt-primary`) | 可见文本 | 原生 button | 无 disabled/aria-disabled（空名不禁用为产品既定双轨） | AT 实测待专项 |
| 5 | 视图切换器·命名视图 trigger(`.pt-viewswitch-btn[aria-label=切换命名视图]`) | aria-label「切换命名视图」 | 原生 button | `aria-haspopup=listbox`、`aria-expanded=false` | AT 实测待专项 |
| 6 | 视图切换器·导出 trigger(`aria-label=导出当前视图`) | aria-label「导出当前视图」 | 原生 button | `aria-haspopup=menu`、`aria-expanded=false` | AT 实测待专项 |
| 7 | 状态 chip 选中「全部 5」(`.pt-chip.active`) | 可见文本（含计数） | 原生 button | `aria-pressed=true`，选中态可编程推导 | AT 实测待专项 |
| 8 | 刷新数据 icon 按钮(`button[aria-label=刷新数据]`) | aria-label「刷新数据」 | 原生 button | — | AT 实测待专项 |
| 9 | 分享按钮(`aria-label=分享只读快照`) | aria-label「分享只读快照」 | 原生 button | — | AT 实测待专项 |
| 10 | 排序 select(`.pm-sort-select`) | aria-label「任务排序」 | 原生 combobox(select) | — | AT 实测待专项 |
| 11 | 密度分段「舒适」(`.pt-density-seg button.active`) | 可见文本 | 原生 button | **无 aria-pressed/aria-selected，仅 class active → 选中态不可编程推导（缺口）** | AT 实测待专项 |
| 12 | 保存视图按钮(`.pm-save-view`) | aria-label「另存为新命名视图」 | 原生 button | — | AT 实测待专项 |
| 13 | 按状态分组切换(`.pm-group-toggle`) | 可见文本 | 原生 button | `aria-pressed=false` 可推导 | AT 实测待专项 |
| 14 | 抽屉关闭 × 按钮(`.pm-drawer header .pm-icon-button`) | aria-label「关闭抽屉」 | 原生 button | — | AT 实测待专项 |
| 15 | 抽屉首字段「任务名称 *」 | 隐式 label 包裹（Field 组件） | 原生 textbox(input) | `required`（aria-required=true）必填可推导 | AT 实测待专项 |
| 16 | 内联错误「任务名称不能为空」(`.pm-field-error[role=alert]#task-title-error`) | 角色 alert 文本 | role=alert | 输入框 `aria-invalid=true` + `aria-describedby=task-title-error` 绑定成立（实测） | AT 实测待专项 |
| 17 | Notice 成功/反馈条（源码 panel.tsx:2000，本次未触发） | 可见消息文本；关闭按钮 aria-label「关闭通知」 | role=status | role=status 隐式 polite；成功态本次未触发，未取证 | AT 实测待专项 |
| 18 | AI 副驾开关按钮(`.pm-copilot-open`) | 可见文本「AI 副驾」 | 原生 button | `aria-pressed=false` 可推导 | AT 实测待专项 |
| 19 | 「更多」顶栏菜单(`.pm-top-more`) | 可见文本「更多」 | 原生 button | `aria-expanded=false` | AT 实测待专项 |
| 20 | 甘特条(`.pm-gantt-bar[role=button]`, gantt.tsx:322) | aria-label 富文本（标题/日期/工期/状态/进度/前置/关键路径+按键提示） | role=button（tabIndex=0） | 状态/进度/关键路径写入 aria-label | AT 实测待专项 |
| 21 | 人员堆叠条 D-02(`.pp-bar`, people.tsx:252) | aria-label「open N：逾期 x，临期 y，进行中 z」 | role=img | 纯展示图，无可操作态；无键盘 | AT 实测待专项 |
| 22 | 里程碑状态 chip D-04(`span.ms-chip`, milestones.tsx:168) | 可见文本（已达成/有风险/计划中） | **裸 span，无 role/aria** | 仅颜色+文本，无可编程状态 | AT 实测待专项（缺口） |
| 23 | 里程碑交付物 chip(`span.ms-chip-deliv` onClick, milestones.tsx:204) | 可见文本 | **裸 span+onClick，无 role/tabIndex/键盘** | 不可键盘激活 | AT 实测待专项（缺口/I5） |
| 24 | 风险矩阵圆点(`.ri-mcell`, risk-issues.tsx) | 无 | **裸 div，无 role/tabindex/aria** | 不可键盘定位列表 | AT 实测待专项（缺口/I5） |
| 25 | bento 状态堆叠条 D-01(`SegRow` 裸 `<i>`, widgets.tsx:216-218) | 无 | 裸元素，无 role/aria/键盘 | 分段占比不可编程播报 | AT 实测待专项（缺口） |
| 26 | 会议/汇报筛选 seg(`.mt-seg`/`.rp-seg`, role=group) | 可见文本 | group + 裸 button | **无 aria-pressed/selected，选中仅 class → 状态不可推导（缺口）** | AT 实测待专项 |

## 小结
- 名来源健全项：图标按钮普遍有 aria-label（刷新/分享/抽屉关闭/视图 trigger），表单走隐式 label，chip/开关用 aria-pressed，rail 当前项用 aria-current。
- DOM 级缺口（待 AT 专项复核，不冒充实测失败）：密度/会议/汇报分段无 aria-pressed；里程碑 chip 裸 span；里程碑交付物 chip 与风险矩阵圆点裸可点件无角色/键盘；bento 堆叠条无 role/aria。
- 截图：`i8-inline-error.png`（内联错误+aria-describedby 现场）。

# G3 cu 通道补采工作清单（2026-10-17 晚，供主端 cu 执行）

> 背景：cu（桌面真实 Chrome）为平台主端专属通道，子代理/组织者均被平台拒绝（"Subagent暂不支持操作电脑相关操作，请在MainAgent完成"）。
> bu（Aha 会话）子代理可用，但物理视口固定 675×745、截图恒 675×745；CDP Emulation 只改 CSSOM 不改截图像素、Browser.setWindowBounds 无权限（CDP error -32000: Browser window not found）。
> 因此 **1440 档 / 390 档像素证据、以及 1440 档键盘证据，只能由主端 cu 采证**。本清单即供主端直接执行；或主端批准改用 bu 675 档替代证据（需在验收工作表登记通道偏差）。

## 入口（已核实，实例在线，无需重启）
- token 链接（免认证）：`http://127.0.0.1:3172/?token=zRZU4w40N-iWYoDVPBGrUqpCt8bsuodeFhghQT0ZjQ8`（失效则重读 `/tmp/dsh-p2-iso-3172.log` 尾行）
- DSH_HOME=/tmp/dsh-p2-iso-20261017/home；种子项目 p-g3：5 任务/1 里程碑/1 风险
- cu 流程：cmd+L 输入链接回车 → 宿主 AX 树按 **Description=项目管理** 定位点击 → 进入 PM 工作台
- 主题切换：设置对话框内按 **title=浅色/深色** 的 CheckBox 点击；关闭按钮 title=关闭；**切主题后 PM 面板重置，须重新点击 项目管理 进入**
- Chrome pid 会变需重查；窗口状态会变需重查；防休眠：每条命令前 `pgrep -x caffeinate`，缺失则 `nohup caffeinate -dimsu >/dev/null 2>&1 &`

## 命名与落盘
- 截图写入 `/private/tmp/g3-shots/`；先 `ls` 取当前最大编号（已有 B01-B31+），从下一号续；本批建议前缀 `cu-` 或续 B 号，**严禁覆盖既有文件**
- 每张图登记清单 `/private/tmp/g3-shots/manifest-cu-main.md`（文件名/实际视口/主题/页面/动作序列/观察）

## A. 1440 档其余视图 浅/深（任务页已有 B19/B20，跳过）
视口：窗口 resize ≈ **1470×797**（对齐 B19/B20），截图前记录实际视口。9 页 × 浅+深 = 18 张：
甘特(gantt) / 里程碑(milestones) / 风险(risk) / 人员(people) / 会议(meetings) / 进度汇报(reports) / 交付物(deliverables) / 项目概览(overview) / 总览看板(board)
先浅色 9 页，再切深色复采 9 页。

## B. G12 live UI 规范校准（1440 浅+深目视，6 项）
1. rail-logo 平涂无渐变（源码锚点 panel.css:208 `.pm-rail-logo`）
2. 左导航菜单背景随主题切换走 `--pm-surface`（无硬编码暗色）——浅/深实测背景色对比
3. 命名视图下拉圆角≈8、菜单式阴影（源码锚点 views/tasks.css:396 `.pt-vmenu`）
4. ghost 按钮圆角对齐 sm(8)
5. 弹窗遮罩为宿主 mask（panel.css:929 `.pm-modal-mask{background:var(--dsw-alias-bg-mask-1)}`）
6. `.pm-rail-sub` 无样式串扰（panel.css:216；nav-rail.tsx:125 已用独立类 pm-rail-group-items）
每项记 PASS/FAIL 观察 + 关键截图。

## C. 键盘证据（1440 浅）
- Tab 顺序合理；`:focus-visible` 焦点环可见（截图）
- 打开新建任务抽屉：焦点落入；关闭后焦点归还触发点
- Esc 关闭命名视图菜单 / 导出菜单 / 设置对话框
- 纯键盘关键路径：全键盘完成 进入PM→切换视图→打开抽屉→Esc/保存（逐键动作记录）

## D. 状态/边界态（1440 浅）
- hover（任务行/按钮）截图；focus 态；disabled 态（空名"保存视图"按钮 disabled 等）
- error：触发表单错误（必填缺失提交），记录错误信息定位 + 出错后输入保留
- 长文：超长任务名/描述换行不溢出

## E. 390 档整档（浅+深）
- 任务页表格→卡片回流；左导航折叠态；抽屉单列；按钮 nowrap 不折行；无外壳横向溢出（甘特轴除外、内部滚动）；总览看板
- 方式：优先窗口 resize；若 Chrome 最小宽度限制达不到 390，用 DevTools 设备模拟（Cmd+Opt+I → Cmd+Shift+M → 设宽 390）并记录实际视口；两者皆不可行则采最窄可达宽度并如实记录偏差

## 硬约束
- 只读测试运行实例；不改仓库代码；不 commit/push；不代填门结论（T2-G01~G12 由独立测试专家审证回填）；采不到如实记录，不伪造。

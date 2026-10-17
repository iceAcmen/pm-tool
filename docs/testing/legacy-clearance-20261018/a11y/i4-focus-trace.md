# I4 无焦点陷阱 — 焦点轨迹取证（补证）

- 被测实例：`http://127.0.0.1:3172/?token=…`（隔离只读实例，未重启服务）
- 被测提交：`380802cccda65b160175cd9741cd265879a2b199`（2026-10-18 00:08，工作树仅本证据目录未跟踪）
- 方法：Playwright 真实键盘 `page.keyboard.press('Tab')`，逐次记录 `document.activeElement` 的 tag/role/aria/文本/归属；headless Chrome 1440×900 light。
- 范围：新建任务抽屉（模态）+ 导出菜单 + 命名视图菜单；未写任何记录（抽屉未提交即 Esc 关闭）。

## 补证前状态
- 清单 I4「无焦点陷阱」标「待验证，见 §12-18」，补证前不得勾达标；源码 `panel.tsx` DrawerPanel（2661–2693）仅有 Esc 关闭 + rAF 焦点归还，**未见任何 Tab 循环/焦点锁定代码**（无 trap、无 roving、无 inert）。

## 动作与结果证据

### A. 新建任务抽屉（模态，role=dialog aria-modal=true）
动作：点「新建任务」→ 首焦点落「任务名称」输入框 → 连续 Tab×30（扩展轨迹 `/tmp/a11y-i4ext.log`、`/tmp/a11y-i4esc.log`）。

| 步骤 | 焦点元素 | 归属 |
|---|---|---|
| OPEN | input「任务名称 *」（隐式 label） | 抽屉内 |
| Tab#1 | textarea「任务说明」 | 抽屉内 |
| Tab#2 | select「状态」（todo/进行中/受阻/已完成） | 抽屉内 |
| Tab#3 | select「优先级」（P0/P1/P2） | 抽屉内 |
| Tab#4 | input「执行人」 | 抽屉内 |
| Tab#5 | select「父任务」（根任务/1–5） | 抽屉内 |
| Tab#6–#9 | 开始日期 date 输入组 | 抽屉内 |
| Tab#10–#13 | 截止日期 date 输入组 | 抽屉内 |
| Tab#14 | input number「完成进度」 | 抽屉内 |
| Tab#15 | input number「实际工时（小时，可选）」 | 抽屉内 |
| Tab#16 | input「证据链接（可选）」 | 抽屉内 |
| Tab#17 | input number「人工设定进度」 | 抽屉内 |
| Tab#18 | textarea「人工设定备注」 | 抽屉内 |
| Tab#19 | select「关联里程碑」 | 抽屉内 |
| Tab#20 | input「仓库地址（可选）」 | 抽屉内 |
| Tab#21 | input「分支（可选）」 | 抽屉内 |
| Tab#22 | input search「搜索前置任务」(aria-label) | 抽屉内 |
| Tab#23–#27 | 前置任务复选框 ×5（1 需求梳理…5 上线发布） | 抽屉内 |
| Tab#28 | button「取消」 | 抽屉内 |
| Tab#29 | button「添加任务」(primary) | 抽屉内 |
| **Tab#30** | **BODY（无焦点元素）** | **离开抽屉** |
| **Tab#31** | **button aria-label=「新建会话」（宿主应用 rail，类名 `S1HjAG_brand`，非 PM）** | **逃逸到宿主壳** |
| Tab#32 | button「收起侧边栏」（宿主） | 宿主 |
| Tab#33 | button「新建会话」（宿主） | 宿主 |
| Tab#34 | button「插件」（宿主） | 宿主 |
| Tab#35 | button「自动化任务」（宿主） | 宿主 |
| Tab#36 | button「项目管理」（宿主 rail，`S1HjAG_panelActive`） | 宿主 |

判定要点：
1. **不逃逸？不成立。** 抽屉内可聚焦项耗尽后（#29 添加任务），Tab#30 落空、#31 直接进入宿主应用 rail，焦点逃出模态、逃出 PM 面板，背景无 inert/锁定。
2. **循环回首元素（不困死）？不成立。** 无 wrap：末项之后不回到「任务名称」，而是穿出到背景；既无陷阱也无循环。
3. **Esc 关闭并归还焦点：成立。** Esc 后焦点回到 opener「新建任务」按钮（`pt-primary`，inDrawer=false/inPM=true），见 `/tmp/a11y-i4.log` ESC_AFTER；此点同时复核 I3（抽屉路径 PASS）。

截图：`i4-drawer-open.png`（打开首焦点）、`i4-drawer-after-tabs.png`、`i4-drawer-closed.png`（Esc 归还后）。

### B. 导出菜单（role=menu，非模态浮层）
动作：点「导出当前视图」→ Tab×8（`/tmp/a11y-i4.log`）。

| 步骤 | 焦点元素 | 归属 |
|---|---|---|
| OPEN | button「导出当前视图」(aria-haspopup=menu, aria-expanded=false) | trigger |
| Tab#1 | menuitem「MD Markdown 周报」 | 菜单内 |
| Tab#2 | menuitem「CSV CSV 表格」 | 菜单内 |
| Tab#3 | menuitem「JSON JSON 结构化」 | 菜单内 |
| Tab#4 | button「分享只读快照」 | **逃出菜单到工具栏** |
| Tab#5 | button「舒适」(密度) | 面板背景 |
| Tab#6 | button「紧凑」 | 面板背景 |
| Tab#7 | button「新建任务」 | 面板背景 |
| Tab#8 | button「需求梳理」(行标题) | 面板背景 |

- 非模态菜单不要求陷阱，Tab 离开菜单属常规；但 **Esc 关闭后焦点未归还 trigger**：落到行标题「需求梳理」（EXP_ESC_AFTER），记为 I3 附属缺口（非本项判据主体）。
- 截图：`i4-export-menu-open.png`。

### C. 命名视图菜单（role=listbox，非模态浮层）
动作：点「切换命名视图」→ Tab×8。

| 步骤 | 焦点元素 | 归属 |
|---|---|---|
| OPEN | button「切换命名视图」(aria-haspopup=listbox) | trigger |
| Tab#1–#6 | option 各内置视图（全部任务/我的任务/进行中/已逾期/本周到期/风险视图） | 菜单内 |
| Tab#7 | button「管理视图…」 | 菜单内 |
| Tab#8 | chip「全部 5」 | **逃出菜单** |

- Esc 关闭后焦点落到 chip「全部 5」，**未归还 trigger**（NV_ESC_AFTER），同为 I3 附属缺口。
- 截图：`i4-namedview-menu-open.png`。

## 结论
**I4 = FAIL。**
- 模态抽屉：无焦点陷阱、无循环回绕；末项后 Tab 逃逸至宿主应用 rail（Tab#31 起为宿主壳按钮），违反「焦点全程停留浮层内 / 循环回首元素」；仅「Esc 关闭归还 opener 焦点」成立。
- 缺口定位：`src/client/panel.tsx` DrawerPanel（2661–2693）缺焦点锁定/Tab 循环（对照 APG dialog 焦点圈）；菜单 Esc 焦点未归还 trigger（`src/client/views/tasks.tsx` 405–437 两个菜单 effect 仅关闭，无 focus() 归还）。
- 说明：本项为 DOM/键盘 observed 取证，AT 实机焦点环表现仍待专项；不冒充实测通过。

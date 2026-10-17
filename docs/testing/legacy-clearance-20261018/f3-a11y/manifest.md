# F3 可达性四项修复证据清单（I4 / I3 / I6 / I7）

- 日期：2026-10-18
- 范围：Wave-2 F3，仅改浮层焦点管理 / 菜单焦点归还 / tab 键盘与角色 / 看板键盘替代；未动视觉 token、CSS 布局、表单校验提交、Notice、O1。
- 被测实例：http://127.0.0.1:3172/（token 以 /tmp/dsh-p2-iso-3172.log 尾行为准）
- 浏览器：Chrome headless 1440×900 light，真实 page.keyboard 操作。

## 证据结构（补证前状态 → 动作 → 结果证据 → 结论）

| 条目 | 补证前（before/） | 动作 | 结果证据（after/） | 结论 |
|---|---|---|---|---|
| I4 浮层焦点陷阱 | `before/baseline-probe.txt`（Tab 不循环、末项后逃逸无锁定）、`before/baseline-i4-trace.txt`、`before/i4-drawer-*.png` | DrawerPanel 增加 Tab/Shift+Tab 循环回绕（asideRef 收集可见可聚焦元素，首尾回绕，不逃逸不困死） | `after/verify-i4.txt`（Tab×20 escapedCount=0；末项 Tab / 首项 Shift+Tab 均回绕抽屉内；Esc 归还「新建任务」）、`after/i4-drawer-open.png`、`after/i4-drawer-wrapped.png`、`after/i4-drawer-closed.png` | PASS |
| I3 菜单 Esc 归还 trigger | `before/baseline-probe2.txt`（焦点在选项按 Esc → activeElement=BODY，未归还） | 命名视图/导出两菜单记录 trigger ref，Esc 关闭后 rAF focus 归还 | `after/verify-i3.txt`（两菜单选项内 Esc → 焦点分别回到「切换命名视图」「导出当前视图」按钮，menuGone）、`after/i3-namedview-open.png`、`after/i3-export-open.png` | PASS |
| I6 自定义 tab 方向键 + tabpanel | `before/baseline-probe.txt`、`before/baseline-probe2.txt`（方向键不动、无 tabpanel 关联、孤立 role=tabpanel） | 三处 tablist 补 roving tabindex + ←/→/↑/↓/Home/End 移动选中并跟随焦点；tab 加 aria-controls，面板加 role=tabpanel/aria-labelledby；移除无主 role=tabpanel | `after/verify-i6-lane-copilot.txt`（车道/副驾方向键翻转+焦点跟随+面板关联）、`after/verify-i6-risk.txt`（风险/问题方向键翻转+panel 关联翻转）、`after/i6-dom-excerpt.md`、`after/i6-ai-assistant.png`、`after/i6-copilot.png`、`after/i6-risk-seg.png` | PASS |
| I7 看板拖拽键盘替代 | `before/baseline-i7.txt`（wrap tabindex=null 不可聚焦；ConfigPanel 无坐标/尺寸输入） | wrap 可聚焦（tabIndex=0 role=group，aria-label），Enter 选中、方向键步进移动（碰撞交换不重叠）；ConfigPanel 增列 X/行 Y/宽 W/高 H 键盘数字输入（边界夹紧）；不干预鼠标拖拽 | `after/verify-i7.txt`（10 张 wrap 全 tabindex=0；ArrowRight 完成一次移动 selected=true；X/Y/W/H 输入齐备且键盘写入生效）、`after/i7-editor.png`、`after/i7-after-arrowright.png`、`after/i7-cfg-panel.png` | PASS |

## 门禁（after/gate-*.txt）

- build：`gate-build.txt` BUILD_EXIT=0（tsc + tsdown 成功）
- vitest：`gate-vitest.txt` VITEST_EXIT=0（18 files / 209 tests 全过）
- isolation：`gate-isolation.txt` ISO_EXIT=0（before=172 after=172，污染 0，PASS）
- 最终 bundle 重启后冒烟：`smoke-final-bundle.txt`（8 Tabs escapedCount=0，Esc 归还「新建任务」）

## 改动源码（4 文件）

- `packages/dsh-pm-tool/src/client/panel.tsx` — I4 抽屉焦点陷阱；I6 车道/副驾 tab 键盘 + tabpanel 关联；移除孤立 role=tabpanel
- `packages/dsh-pm-tool/src/client/views/tasks.tsx` — I3 两菜单 Esc 归还 trigger
- `packages/dsh-pm-tool/src/client/views/risk-issues.tsx` — I6 风险/问题 tab 键盘 + tabpanel
- `packages/dsh-pm-tool/src/client/board/editor.tsx` — I7 wrap 可聚焦 + 方向键移动 + 配置面板坐标/尺寸输入

## 备注

- I6 风险/问题 tablist 仅在有记录时渲染（空态为诚实空态，既有行为未改）；复测时临时建 1 条记录取证，测后已删除（行数 1→0）。
- I7 键盘移动为 draft 态改写，未点「保存」不落库；鼠标 RGL 拖拽链路未改动。

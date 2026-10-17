# Manifest — 键盘可达性与 ARIA 四项补证（I4/I6/I7/I8）

- 任务：legacy-clearance-20261018 · a11y 专项（只取证判定，不改代码，不重启服务，不留记录）
- 被测实例：`http://127.0.0.1:3172/?token=Vsx9cIInacUzrKnMx0w68jrS3RMlRsn3bSCg5htdmL4`（只读为主）
- 被测提交 SHA：`380802cccda65b160175cd9741cd265879a2b199`（2026-10-18 00:08 +0800；工作树仅本证据目录未跟踪，无其他改动）
- 取证日期：2026-10-18；环境：headless Chrome 1440×900 light，Playwright 真实键盘事件。

## 结论索引

| 项 | 结论 | 证据文档 |
|---|---|---|
| I4 无焦点陷阱 | **FAIL**（抽屉无陷阱/无循环，末项后 Tab#31 逃逸至宿主 rail；Esc 归还 opener 成立） | `i4-focus-trace.md` |
| I6 自定义 tab 完整 | **FAIL**（tablist/tab/aria-selected 齐备且翻转；方向键移动、tabpanel 关联缺失） | `i6-tab-dom.md` |
| I7 拖拽键盘替代 | **部分存在**（甘特 ←/→/Shift+←/→/抽屉改日期存在；看板卡片位移/缩放无键盘替代） | `i7-drag-alternative.md` |
| I8 读屏播报 | **DOM 审计完成，全部「AT 实测待专项」，不伪造 PASS** | `i8-audit-table.md` |

## 证据文件清单（绝对路径）

### 文档
- `/Users/bytedance/Projects/dsh-pm/pm-tool/docs/testing/legacy-clearance-20261018/a11y/i4-focus-trace.md`
- `/Users/bytedance/Projects/dsh-pm/pm-tool/docs/testing/legacy-clearance-20261018/a11y/i6-tab-dom.md`
- `/Users/bytedance/Projects/dsh-pm/pm-tool/docs/testing/legacy-clearance-20261018/a11y/i7-drag-alternative.md`
- `/Users/bytedance/Projects/dsh-pm/pm-tool/docs/testing/legacy-clearance-20261018/a11y/i8-audit-table.md`

### 截图（关键帧）
I4：
- `i4-drawer-open.png`（新建任务抽屉打开，首焦点任务名称）
- `i4-drawer-after-tabs.png`（连续 Tab 后）
- `i4-drawer-closed.png`（Esc 关闭归还焦点）
- `i4-export-menu-open.png`（导出菜单）
- `i4-namedview-menu-open.png`（命名视图菜单）

I6：
- `i6-risk-seg.png`（风险/问题 tablist）
- `i6-ai-assistant.png`（模型车道 tablist）
- `i6-copilot.png`（副驾模式 tablist + 车道）

I7：
- `i7-gantt.png`（甘特条 role=button）
- `i7-gantt-bar-enter.png`（Enter 开抽屉）
- `i7-board-view.png`（总览看板浏览态）
- `i7-board-editor.png`（RGL 布局编辑，无位置控件）
- `i7-board-cardlib.png`（卡片库键盘可及添加按钮）

I8：
- `i8-inline-error.png`（内联错误 role=alert + aria-describedby 现场）

（以上截图同目录：`/Users/bytedance/Projects/dsh-pm/pm-tool/docs/testing/legacy-clearance-20261018/a11y/`）

## 原始轨迹日志（留档，非交付正文）
- `/tmp/a11y-i4ext.log`（抽屉 Tab×30 全轨迹）、`/tmp/a11y-i4esc.log`（逃逸落点 Tab#31–36）、`/tmp/a11y-i4.log`（菜单轨迹+Esc）
- `/tmp/a11y-i6.log`（三处 tablist 按键轨迹）
- `/tmp/a11y-i7.log`（甘特/看板实测）
- `/tmp/a11y-i8.log`、`/tmp/a11y-i8b.log`（DOM 审计抽样）

## 合规声明
- 未重启服务；未新增/修改/删除任何业务记录（新建任务抽屉未提交即 Esc；看板编辑取消未保存；甘特方向键落库路径按不写数据要求未执行，仅源码取证）。
- I8 无 AT 环境，所有播报类结论均标「AT 实测待专项」，未冒充 PASS。

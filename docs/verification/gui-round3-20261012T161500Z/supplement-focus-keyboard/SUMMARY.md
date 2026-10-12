# supplement-focus-keyboard — 原始证据汇总（执行端只录事实，不判 PASS/FAIL）

被测实例：3091，**运行提交未证实**（服务 23:57:25 启动，bundle 23:59 才写入）。仓库 HEAD=d88a332（只读）。框架 loader rev=57359a8d2317（非业务 bundle，业务版本 unknown）。真实 viewport=789x745。证据文件实际时间戳 2026-10-12T16:11:02Z~16:17:10Z UTC。
数据根 .tmp/e2e-3082/data/pmtool 仅含夹具 p-0001/p-0002；全程只读核对，正式 data/pmtool 未触碰。

## 1. 焦点诊断（ref-first 观察-操作-再观察；未用 JS focus()）

| 时刻 | 事实（activeElement） |
|---|---|
| 开抽屉前（PM 面板按钮刚点开后） | BUTTON aria="项目管理"（panelRow panelActive） |
| 点击真实任务标题"逾期任务"(d47:e112) 后 | `.pm-drawer` 打开；activeElement = **INPUT name=title value="逾期任务"**（截图见焦点环在标题输入框） |
| 真实 Escape 后 | 抽屉关闭（drawerStillVisible=false）；activeElement = **BUTTON text="7 天" class="pm-reminder-range pm-button-primary"**（截图焦点环在"7 天"） |

- 关键点：Esc 后焦点**既未回真实 opener**（"重新打开 逾期任务"/"编辑 逾期任务" 两个按钮 sameAsActive=false），也**不是回 body**——而是落在提醒范围"7 天"按钮上。console 0 条；任务行未被修改（标题仍"逾期任务"）。
- 对照历史：§46 曾记"Esc 后焦点回 BODY"，§47 记"焦点仍 BODY"；本运行实例观测为"7 天"按钮——行为与历史不一致，交测试专家判定（运行提交未证实，可能二修前后差异）。
- 注：本诊断未给真实 opener 按钮建立显式焦点锚点（opener 即被点击的标题按钮本身）；按口径不得 JS focus() 替产品恢复。

## 2. 键盘（window/document 捕获阶段只读监听，未 dispatch synthetic 事件）

监听窗口 __keyLog / __docLog（isTrusted 均为 true）。

| 键（press_key 写法） | 是否到达页面 keydown | 产品行为 |
|---|---|---|
| `j`（字符形）/ ` ` / `Space` / `space` / `Space` | **未到达**（keyLog 0 条，多次） | 无 |
| `KeyJ`（code 形） | 到达 isTrusted | 活动行下移：行0→行1（Enter 探针打开"临期任务"证实） |
| `KeyK` | 到达 isTrusted | 活动行上移：行1→行0（Enter 探针打开"逾期任务"证实） |
| `Enter` | 到达 isTrusted | 打开活动行抽屉（标题 input 聚焦） |
| `Escape` | 到达 isTrusted | 关闭抽屉（未保存） |
| `Delete` | 到达 isTrusted | 见 §3 |

- **结论事实**：本执行设施按键映射——特殊键 Enter/Escape/Delete 用其名可到达；字母键需用 code 形（KeyJ/KeyK）才可到达；**空格三种写法（" "/"Space"/"space"）均未产生 keydown 事件**，因此"空格勾选"无法在本设施实测——记设施 NOT_RUN，不判产品 FAIL。
- 字符形 `j` 到达 0 条 ≠ 产品无键盘支持（KeyJ 实测 j/k 导航正常工作）。

## 3. Delete 批量删除流（仅对新建专用测试行 t-0018）

- 前置：UI 新建"FBKB删除测试行" → 磁盘 t-0018.json 落盘（before 17 文件 → after 18，见 after-create-t-0018.json）。
- 鼠标勾选该行 checkbox（选择语义，status 仍 todo，磁盘未变）。
- Delete 到达但前置条件记录：焦点在 checkbox INPUT 时 Delete 被正确忽略（无 dialog、无删除）；焦点在 BUTTON 时 Delete 无选中行=无操作。
- **取消分支**：焦点在 body（blur 后）+ 1 行选中 → Delete → **原生 confirm() 阻塞出现**（bu.js 超时即原生对话框特征）→ handle_dialog(cancel) → 行仍在、磁盘 18 文件不变（DISK_UNCHANGED_AFTER_CANCEL，after-cancel-t-0018.json）。
- **真删分支**：再次 Delete → 接受 confirm → toast"已批量级联删除 1 个任务（含后代）" → 行消失、磁盘 t-0018.json absent、目录回到 17 文件（与 before 完全 diff 为空）。
- 未触碰任何历史/夹具行；正式库未写。

### 取消/确认分支 hash 实证（实际计算）
- t-0018 落盘后 vs 取消后：两份留存 JSON `sha256 均为 ebb0821a455975bb5e33fac05b6903920697be6db75d64366e7d50cb0b0760b7`，diff IDENTICAL → 取消分支内容零变化。
- 17 个夹具任务文件 mtime ≤ 1791811173，本次证据首写盘 1791821462 → 会话期间无夹具文件被写（mtime 级证据）。
- **缺口（诚实标注）**：17 个夹具行的内容级 sha256 未在会话前预存，仅文件名清单 + mtime + t-0018 个案 hash；夹具内容级前后一致性无原始数据可证。

## 4. 真 viewport 390/1280

- 仅试公开 CDP 方法一次：`Emulation.setDeviceMetricsOverride {width:390,...}` → 错误 `CDP protocol error -32001: Session with given id not found.`（与历史失败一致，未重复重试）。
- 当前真实 innerWidth/innerHeight=789x745。未改 DOM 宽度冒充 viewport。**真 390/1280 viewport = NOT_RUN（设施）**，错误原文保留。

## 5. console / 网络

- 观测窗口内 console_messages = 0 条（未把历史 connection refused 缓冲计入；本次缓冲起测即为 0）。

## 未完成项（交测试专家/后续）

- 空格勾选：设施按键映射未把空格送达 → NOT_RUN。
- 真 viewport 390/1280：CDP session not found → NOT_RUN。
- 焦点回 opener：本实例观测为"7 天"按钮（非 opener、非 body），运行提交未证实，不判。
- 截图说明：bu.screenshot 每次覆写同一临时文件，最终仅保留 final-state-17rows.png；各中间状态均有上述 js 测量值佐证。

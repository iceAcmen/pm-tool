# I6 自定义 tab 模式完整 — DOM 摘录 + 按键轨迹（补证）

- 被测提交：`380802c`；方法：Playwright 真实键盘（focus → ArrowRight/ArrowLeft/Enter/Space）+ DOM 摘录；1440×900 light。
- 补证前状态：清单 I6「tablist/tab/tabpanel/aria-selected/方向键齐全」标待验证，补证前不得勾达标。

## 全局定位结果（任务视图 + 各 PM 面板）
页面内 role=tablist 共 3 处（宿主 dockkit 标签条 `_tabStrip_*` 属宿主壳，不计入 PM 取证）：

| # | tablist | 位置 | 源码 |
|---|---|---|---|
| T1 | `aria-label="筛选记录类型"` `.ri-seg` | 风险与问题视图 | `views/risk-issues.tsx:136-149` |
| T2 | `aria-label="模型车道"` `.pm-lane-switch` | AI 助手面板 / AI 副驾（compact） | `panel.tsx:514-523` |
| T3 | `aria-label="副驾模式"` `.pm-copilot-mode` | AI 副驾面板 | `panel.tsx:2339-2344` |

另：`section.pm-view[role=tabpanel]`（`panel.tsx:1044`）孤立挂载，无 aria-labelledby/aria-owns，不归属任何 tablist（A2 实测：labelledby=null, owns=null）。

## T1 风险与问题 `.ri-seg`（按键轨迹见 `/tmp/a11y-i6.log` B 段）

DOM 摘录（实测 outerHTML）：
```html
<div class="ri-seg" role="tablist" aria-label="筛选记录类型">
  <button type="button" role="tab" aria-selected="true" class="on">风险 <span class="n">1</span></button>
  <button type="button" role="tab" aria-selected="false" class="">问题 <span class="n">0</span></button>
</div>
```

| 检查点 | 结果 |
|---|---|
| tablist/tab 角色齐备 | 成立 |
| 每个 tab 有 aria-selected 且随激活翻转 | 成立（风险=true / 问题=false，点击切换翻转） |
| 方向键 →/← 移动选中 | **不成立**：focus 风险 tab 后按 ArrowRight，焦点仍留「风险 1」、aria-selected 仍 true，不移动不翻转；ArrowLeft 同（B2/B3） |
| Enter/Space 激活 | 原生 button，click 激活成立；Space 在已激活 tab 上 no-op（无 roving 切换） |
| role=tabpanel 关联 | **缺失**：正文 `.ri-body` 无 role=tabpanel、无 aria-controls/aria-labelledby |
| onKeyDown 方向键 | 源码无（`risk-issues.tsx:136-149` 仅 onClick） |

## T2 模型车道 `.pm-lane-switch`（C 段）

DOM 摘录：
```html
<div class="pm-lane-switch pm-model-lane" role="tablist" aria-label="模型车道">
  <button type="button" role="tab" aria-selected="true" class="pm-lane-poc is-on">⚡ PoC 免费</button>
  <button type="button" role="tab" aria-selected="false" class="pm-lane-prod">🔑 生产 Key</button>
</div>
```
- aria-selected 齐备；**ArrowRight 不移动焦点、不翻转**（C2 仍停 PoC）；Enter 在激活项 no-op（C3）；无 tabpanel（车道切换无对应面板）；源码 `panel.tsx:515-520` 仅 onClick，无方向键处理。

## T3 副驾模式 `.pm-copilot-mode`（D 段）

DOM 摘录：
```html
<div class="pm-copilot-mode" role="tablist" aria-label="副驾模式">
  <button type="button" data-active="true" role="tab" aria-selected="true">只读诊断</button>
  <button type="button" role="tab" aria-selected="false">草稿待确认</button>
</div>
```
- aria-selected 齐备；**ArrowRight 不移动、不翻转**（D2）；Enter no-op（D3）；诊断/草稿两块内容区无 role=tabpanel 关联；源码 `panel.tsx:2340-2343` 仅 onClick。

## 旁证（非 tab 模式，不计入判据）
- 甘特工具粒度 `.pm-seg`（日/周/月）：裸 button 组，**无 role=tablist/tab**（E 段实测 `role:null`），属普通按钮组，不冒充 tab。
- 会议 `.mt-seg`/汇报 `.rp-seg` 筛选：role=group，裸 button，无 aria-pressed/aria-selected（源码 `meetings.tsx:142`、`reports.tsx:125`），非 tab。

## 结论
**I6 = FAIL。**
- 成立项：三处均有 tablist/tab/aria-selected，选中态可编程翻转；Enter/Space 经原生 button click 可激活。
- 缺口：① 三处均**无方向键 →/← 移动选中**（无 roving tabindex、无 onKeyDown）；② 均**无 role=tabpanel 关联**（T1 正文/T2 车道/T3 模式面板未挂 tabpanel/aria-controls）；③ 孤立 `section[role=tabpanel]`（panel.tsx:1044）无归属。
- 定位：`views/risk-issues.tsx:136-149`、`panel.tsx:514-523`、`panel.tsx:2339-2344`。
- 截图：`i6-risk-seg.png`、`i6-ai-assistant.png`、`i6-copilot.png`。AT 实机播报待专项，本项不冒充实测通过。

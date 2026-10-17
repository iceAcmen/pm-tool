# 规范批 C1–C10 / D-01~D-06 / F-1~F-3 · 独立方法审查（2026-10-17）

> 性质：**只读方法审查，不是产品修复、不是视觉 PASS、不代开发改代码**。审查对象（规范方所有，本件不改其文件）：`docs/design/system-ui-audit-preparation-20261017.md` §5 契约 C1–C10、§7.1 缺陷 D-01~D-06、§9 F-1~F-3、§9.3 静态规则，及 `system-ui-control-inventory-20261017.csv`（348 行 = 342 NOT_RUN + 6 BLOCKED）。
> 方法：独立对真实源码逐条核真缺陷位置与现状，判断修复建议是否符合无障碍语义与仓库现有模式、是否最小、是否把自动检查当视觉放行；真实键盘/AT 表现仍归 G3，本审查不判实测通过。
> 排期：D 类修复可在 P2-6 后合并批次执行，**不同时改产品**；修复后由独立测试专家对受影响项复测。

## 1. 结论摘要

- C1–C10 契约矩阵：**方法成立、状态诚实**（已存在 / 候选 / P2-6 待实现分开，未冒充实装），可作为 G3 走查骨架；仅 1 处交叉引用需修（见 §4-N1）。
- D-01~D-06：**6 条缺陷位置全部对源码核真成立**，修复方向符合无障碍语义；**建议最小内联修复、本批不新抽公共可点组件**（见 §3），避免新组件/新 class 破坏现有 `pm-linkable/pm-link-on` 视觉。
- F-1 PR 模板、F-2 契约目录、F-3 静态规则：**最小且未把自动当视觉放行**；F-3 规则 2 需加「纯布局容器豁免」防误报（见 §5）。
- 6 条 BLOCKED 依据真实（源码已核真静态缺口，键盘/AT 被 G3 通道阻塞），342+6=348 算术自洽，无 PASS 冒充。

## 2. C1–C10 契约矩阵审查

- **成立项**：每条给角色/解剖/状态/交互/无障碍/异常恢复/视觉责任/验收证据；C7 副驾明确「已存在部分待采证、P2-6 溯源/撤销/失效行未启动不得当实装」，C8 空 Key/离线=AUTO、真实在线=MANUAL_PENDING，与本测试分层一致；C2 区分 `role=status`（成功/信息）与 `role=alert`（错误）、C4 焦点落入/归还、C5 可见 label 禁 placeholder、C6 seg 用原生 button+aria-pressed，语义正确。
- **定位**：契约 Status 已注明 C1/C2/C4/C6 待 G3 核、C7 部分待实现、C3/C5/C8/C9/C10 候选，冻结后回填，未提前判通过。
- **不构成验收**：契约是走查骨架，存在性/状态/对比度/键盘仍须 G3 真实目视与 AT，自动静态断言只是输入。

## 3. D-01~D-06 独立核真与修复评审

> 源码核对均在 `packages/dsh-pm-tool/src`；「核真」= 该 onClick/缺失语义属实。

| 缺陷 | 源码核真 | 无障碍判断 | 最小修复建议（本测试意见） | 自动可验标准是否可接受 |
|---|---|---|---|---|
| D-01 状态柱 `board/widgets.tsx:151` | 成立：`div.pm-hero-barrow` `onClick=onLink('status',st)`，active 仅 class `pm-link-on`，无 role/tabIndex/onKeyDown/aria-pressed | 这是**可再点的筛选开关（toggle）**，用 `role=button`+`aria-pressed` 正确，不用 link | 优先**原生 `<button type="button">`**（仓库现有筛选开关均为原生 button+aria-pressed：panel.tsx:851/1430、reports.tsx:130、tasks.tsx:894），保留现有 class 与样式，补 Enter/Space；不新抽组件 | 可接受：断言原生 button 或 role=button、tabIndex、onKeyDown 含 Enter/Space、选中 aria-pressed |
| D-02 人员堆叠条 `widgets.tsx:332` | 成立：`div.pm-barrow` `onClick=onLink('assignee',display)`，active 仅 class，无语义/键盘/选中态 | 同 D-01 的 toggle 筛选；可访问名用负责人显示名 | 同 D-01，原生 button+aria-pressed，可访问名=负责人显示名，样式 class 不动 | 可接受；另断言可访问名非空 |
| D-03 配置伪 tab `board/editor.tsx:365` | 成立：`.pm-cfg-tabs` 内 `span` `onClick=setTab(t)`，选中仅 class `on`，无 tablist/tab/aria-selected/方向键；各 tab 对应条件面板（369+） | 互斥配置组，ARIA **tablist/tab/tabpanel + roving tabindex + 左右方向键** 语义正确；但比 D-01/02 重 | 最小实现：外层 `role=tablist`、页签 `role=tab`+`aria-selected`+`tabIndex`、面板 `role=tabpanel`，方向键切换；**只补语义属性，不改版式/配色**。若评估成本高，退而求其次的最小方案是按原生 button 组+aria-pressed，但完整 tab 模式仍是首选 | 可接受：断言 tablist/tab/aria-selected/方向键绑定 |
| D-04 里程碑关联 chip `views/milestones.tsx:204` | 成立：`span.ms-chip-deliv` `onClick=onOpenTask(t)`，无 role/tabIndex/键盘 | 动作是「打开已存在任务记录」（无 URL 跳转），仓库同类可点行用 `role=button`（panel.tsx:1581）；建议 **button 与 link 二选一保持与现仓库一致**，不强制 link | 建议 `role=button`（或原生 button）+tabIndex=0+Enter 激活，可访问名=任务标题+code；避免 role=link 却无 href/导航语义 | 可接受：role/tabIndex/键盘激活/非空可访问名 |
| D-05 未排期行 `views/gantt.tsx:457` | 成立：空 `div.pm-gantt-row--unscheduled` 仅 `title`+`onClick=onEdit(t)`，无 role/tabIndex/键盘/可访问名；自闭合无嵌套子元素 | 关键录入入口（未排期→设起止）键盘可达，S2 合理；**元素本身无文本，可访问名只能来自 aria-label**，title 不算编程名 | `role=button`+tabIndex=0+Enter/Space 触发 onEdit+`aria-label="打开任务 {code} 排期"`；保留行高/占位样式 | 可接受；须断言 aria-label 非空（仅 title 不算） |
| D-06 配置关闭 `board/editor.tsx:362` | 成立：`button.pm-cfg-x` 文本仅 `×`，无 aria-label | 图标/符号按钮缺可访问名，修复 trivial 且正确 | 加 `aria-label="关闭配置"`（或等价可见名），不动样式 | 可接受；规则须区分「仅符号」与「有可见文本」按钮，后者不报 |

### 3.1 公共收敛建议的边界（重要）
- §7.1 建议「抽公共 Clickable 统一语义/键盘/选中态」作为**后续收敛方向**可以，但**本批最小修复不建议为此新造公共组件**：仓库当前可点件都是内联 role=button+onKeyDown（gantt.tsx:342/347、panel.tsx:1581/1588），并无现成公共可点件；新组件/新 class 有视觉漂移风险。先按现有内联范式逐处补语义，待 G3 确认模式重复出现后再评估收敛。
- D-01/D-02/D-04/D-05 修复必须**复用现有 className 与视觉**，只加语义/键盘属性，不得借此重绘卡片/条/行。

## 4. 需规范方修正的小项（非阻塞）

- **N1（交叉引用悬空）**：C1（§246）引用「§7 D-07 待验证假设」，但 §7.1 只有 D-01~D-06，无 D-07；焦点归还现状在 §7.2 假设 H-4。建议改为指向 H-4，避免编号漂移。
- **N2（D-05 名称来源）**：自动规则须明确「title 属性不构成可访问名」，D-05 必须以 aria-label 提供名称，否则静态门会误放。
- **N3（H-2 全量图标按钮）**：除 D-06 外其余符号按钮 aria-label 全量未核，应由 F-3 规则 1 静态扫一遍产出清单，再交读屏/G3，不写成已成立缺陷。

## 5. F-1~F-3 与静态规则审查

- **F-1 PR 模板（§9.1）**：最小、必要；含语义 token/状态/交互/表单/响应式/无障碍/异常/复用勾选与「自动门结果 + 人工目视位」，明确自动不替代 G3；通过。目视证据位要求 G3 采证编号或截图，未把静态结果当视觉。
- **F-2 组件契约目录**：未来件，与 C1–C10 一致；不阻塞本批。
- **F-3 扩展 verify-gui-contract（§9.3）**：方向正确，且明言「只产出清单定位、严重度由独立测试判、不替代对比度/键盘/读屏」。逐条：
  - 规则 1 符号按钮可访问名（对应 D-06）：可接受，需排除有可见文本的按钮。
  - 规则 2 可点裸元素语义+键盘（D-01/02/04/05）：**需加豁免**——纯布局/容器 div/span 带 onClick 委托（事件冒泡容器）不应报；应只对「自身承担动作」的可点元素断言，避免大面积误报。
  - 规则 3 自定义 tab 完整（D-03）：可接受。
  - 规则 4 选中态可编程（aria-pressed/aria-selected）不靠 class：可接受。
  - 规则 5 焦点归还只报「待人工核」不直接 FAIL：恰当，符合静态能力边界。
  - 规则 6 异步 pending 禁用防重：可接受。
- F-3 现有脚本为文本正则断言（如 gantt 条 tabIndex/aria-label），升级为 AST 遍历可减少误报，但不得借此断言对比度、配色或视觉观感。

## 6. BLOCKED 依据与分母核对

- 6 条 BLOCKED/待GUI-AT = CTL-223(D-06)/339(D-01)/340(D-02)/341(D-03)/342(D-04)/343(D-05)，均为**源码已直读核真的静态缺口**，真实键盘/AT 被 G3 通道阻塞故标 BLOCKED，未标 FAIL、未标 PASS，口径正确。
- 台账计数独立复算：NOT_RUN/待证 342 + BLOCKED/待GUI-AT 6 = 348，与分层（SUB46/PLACEMENT11/INTEGRATION274/SEMANTIC12/BACKDROP5）自洽，零 PASS。
- BLOCKED ≠ 通过：修复后的键盘/AT 表现必须经 G3（或具备通道一方采证后）独立复测，静态补属性本身不构成 a11y PASS。

## 7. 边界

- 本审查不改规范文件、不改产品、不提交 git；D 类修复由开发按最小方案实施，独立测试专家对受影响项复测并回填台账状态。
- 本件不评判审美；视觉一致性（H-1 等假设）留待 G3 实测 computed 色值后再登记，当前不下 drift 结论。

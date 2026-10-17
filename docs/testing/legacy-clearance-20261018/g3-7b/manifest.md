# G3-7 全视图补证（后半：进度汇报 / 交付物 / 项目概览）+ G3-6 甘特 390 采证

- 采证日期：2026-10-18
- 被测实例（只读；未改代码 / 未写数据 / 未重启服务）：隔离实例 `http://127.0.0.1:3172/?token=…`（token 取 `/tmp/dsh-p2-iso-3172.log` 尾行）
- 采证档：768×1024、390×844 × 浅/深；每视口×主题全新临时 context（`colorScheme: light|dark`，宿主 `body[data-ds-dark-theme]` 随动），不碰用户会话
- 判据（system-ui-spec §8 / checklist G3-6、G3-7）：零外壳横向溢出（`scrollingElement.scrollWidth ≤ clientWidth`）、零裁切、无破版/叠印/遮挡；表体/时间轴在 `.pm-shell` 内部横滚属已裁决例外；G3-6 甘特时间轴允许内部横滑，身份信息不进横滑区
- 导航走真实点击：768 点左侧 `.pm-rail` 导航项；390 rail 整栏隐藏（`display:none`），点 `.pm-view-switcher-btn` 展开 `.pm-view-menu` 扁平下拉（9 项 + 计数 + 选中带勾）后点目标项
- 每帧测量：`doc/body scrollWidth/clientWidth/innerWidth`；越界扫描（`.pm-shell` 内可见元素 `right > innerWidth+1`，标注内部横滚祖先）；遮挡扫描（每个可见按钮中心 `elementFromPoint` 须命中自身/后代；`.pm-view-switcher` 与 `.pm-top-actions` 几何重叠量）

## 补证前状态

- checklist G3-7 标「（待验证项）」：里程碑/风险/人员/会议/汇报/交付物/概览 768/390 未逐张清验；facts F.4 抽样边界——768/390 仅任务页/抽屉/看板抽样，汇报/交付物/概览为缺口；G3-6 390 甘特此前未采。
- 本批只做汇报/交付物/概览三视图 + 390 甘特；里程碑/风险/人员/会议由并行子代理覆盖。

## 动作

1. 新 context → 带 token 链接进入 → 点宿主侧栏「项目管理」（`button[aria-label="项目管理"]`）载入 PM 工作台。
2. 768：rail 点目标视图；390：ViewSwitcher 下拉点目标项；等待视图根节点（`.pm-rp-root` / `.pm-dv-root` / `.pm-ov-root` / `.pm-gantt-root`）。
3. `fullPage=false` 整视口截图；记录 doc/body 宽度；越界扫描 + 按钮中心遮挡扫描 + switcher/top-actions 重叠量。
4. 目视（整帧 + 顶部条带裁切放大）+ 测量双判。

## 证据表（14 帧）

| 文件 | 视图 | 视口 | 主题 | doc scrollW/clientW（innerW） | 越界 | 遮挡证据 | 结论 |
|---|---|---|---|---|---|---|---|
| G3-7-reports-768-light.png | 进度汇报 | 768 | light | 768/768（768） | 0 | 无；空态诚实居中，rail 选中高亮 | PASS |
| G3-7-deliverables-768-light.png | 交付物 | 768 | light | 768/768（768） | 0 | 无；统计带 6 列、筛选 chips、记录卡完整 | PASS |
| G3-7-overview-768-light.png | 项目概览 | 768 | light | 768/768（768） | 0 | **轻微叠印**：`.pm-top-actions`「新建项目」(top54,h32) 与刷新图标按钮中心 `elementFromPoint` 命中 `.pm-crumb-bar`（crumb top64–100，与按钮 54–86 重叠 22px）；「更多」自身命中；无外壳溢出 | **FAIL（轻微叠印）** |
| G3-7-reports-768-dark.png | 进度汇报 | 768 | dark | 768/768（768） | 0 | 无；浅深镜像 | PASS |
| G3-7-deliverables-768-dark.png | 交付物 | 768 | dark | 768/768（768） | 0 | 无；浅深镜像 | PASS |
| G3-7-overview-768-dark.png | 项目概览 | 768 | dark | 768/768（768） | 0 | 同 light：新建项目/刷新中心命中 crumb-bar，下半部伸入 crumb 行；无外壳溢出 | **FAIL（轻微叠印）** |
| G3-7-reports-390-light.png | 进度汇报 | 390 | light | 390/390（390） | 0 | 无；switcher top=99 落于操作条（56–88）下方，overlapY=0；新建项目/更多/刷新自身命中 | PASS |
| G3-7-deliverables-390-light.png | 交付物 | 390 | light | 390/390（390） | 0 | **遮挡**：switcher top=64/h47 与 top-actions(56–88) 重叠 23.8px；新建项目/更多/刷新中心命中 `pm-view-switcher-btn`；视图内「＋新增交付物」按钮可见；统计带无横溢 | **FAIL（遮挡/叠印）** |
| G3-7-overview-390-light.png | 项目概览 | 390 | light | 390/390（390） | 0 | **遮挡**：同 deliverables，switcher 重叠 23.8px，新建项目/更多/刷新被遮；hero/统计卡本体无破版 | **FAIL（遮挡/叠印）** |
| G3-7-reports-390-dark.png | 进度汇报 | 390 | dark | 390/390（390） | 0 | 无；switcher top=99，overlapY=0；浅深镜像 | PASS |
| G3-7-deliverables-390-dark.png | 交付物 | 390 | dark | 390/390（390） | 0 | 同 light：switcher 重叠 23.8px，三枚顶栏按钮被遮；浅深成对 | **FAIL（遮挡/叠印）** |
| G3-7-overview-390-dark.png | 项目概览 | 390 | dark | 390/390（390） | 0 | 同 light：switcher 重叠 23.8px，三枚顶栏按钮被遮；浅深成对 | **FAIL（遮挡/叠印）** |
| G3-6-gantt-390-light.png | 甘特排期 | 390 | light | 390/390（390） | 0 | 内部横滑成立：`.pm-gantt-scroll` scrollW 2000 / clientW 166；身份列 `.pm-gantt-labels`(150px) 在滚动区**外**（`labelsInsideScroll=false`、与 scroll 为兄弟节点）；程序化 scrollLeft 0→600 生效，身份列 left 恒 65 不动；外壳 doc=390 无横溢 | PASS（G3-6 内部横滑例外） |
| G3-6-gantt-390-dark.png | 甘特排期 | 390 | dark | 390/390（390） | 0 | 同 light：scroll 2000/166、身份列固定不进横滑、doc=390；浅深镜像 | PASS（G3-6 内部横滑例外） |

## 逐视图结论

- **进度汇报 reports — PASS（4/4）**：768/390 × 浅/深 doc=视口宽、零越界、零遮挡；390 switcher 落于操作条下方（top=99，overlap=0），顶栏按钮自身命中；空态诚实居中。
- **交付物 deliverables — 部分 PASS**：768 浅/深 PASS（doc=768、统计带/chips/记录卡完整、零遮挡）；**390 浅/深 FAIL**：`.pm-view-switcher` 上移（top=64）压住 `.pm-top-actions`（56–88）23.8px，新建项目/更多/刷新中心命中 switcher 按钮（elementFromPoint）；视图内「＋新增交付物」按钮可见、统计带无横溢、doc=390 无外壳溢出。附注：390 统计带 6 列未折叠、标签逐字竖排（内容完整无裁切），属密度/美观项，非本门硬判据。
- **项目概览 overview — 部分 PASS**：**390 浅/深 FAIL**：与交付物同型 switcher 遮挡（23.8px，新建项目/更多/刷新被遮）；**768 浅/深 FAIL（轻微叠印）**：新建项目/刷新按钮中心命中 `.pm-crumb-bar`（按钮 54–86 与 crumb 64–100 重叠 22px），「更多」正常；无外壳横向溢出，hero/信息栅格/统计卡/阶段进度条本体无破版。
- **G3-6 甘特（390 浅/深）— PASS**：时间轴内部横滑合法成立（scroll 2000/166，scrollLeft 可移动），身份列（任务/WBS 编号+标题+关键标记+里程碑带）固定在滚动区外、不随横滑移动；外壳 doc=390 零横溢。

## 汇总

- 三视图 12 帧：**6 PASS / 6 FAIL**（FAIL：overview 768 浅/深轻微叠印 2 帧；deliverables 390 浅/深、overview 390 浅/深 switcher 遮挡 4 帧）；甘特 2 帧 PASS（G3-6 单独计）。
- 全部 14 帧外壳横向溢出 = 0（768 帧 768/768，390 帧 390/390；甘特横滑封闭在 `.pm-gantt-scroll` 内部）。
- 遮挡缺陷与并行子代理在风险/人员 390 记录的 switcher 遮挡同型（23.8px、elementFromPoint 命中 `pm-view-switcher-btn`），可合并归为同一缺陷族。
- 测量明细：`measurements.json`（scrollWidth/clientWidth/innerWidth/越界全量/遮挡全量/switcher 重叠量/甘特 scroll 与身份列几何）。

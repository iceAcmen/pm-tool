# A19HC HC01 GUI 原始证据独立审查

> 2026-10-22，平台 trae，独立 GUI 测试专家。仅审查 Main 已采原始证据；未开发、未修改产品代码、未重跑浏览器。

## 1. 结论

| 项目 | 结论 | 边界 |
| --- | --- | --- |
| HC01 GUI | **有限 PASS** | 绑定候选在 1440×1000、390×844 深色真实页面中，旧习惯卡长 OKR 完整自然换行，无截断、横向溢出或卡片/按钮/图标挤坏；普通 `<strong>` 保持字面文本，声明保留 |
| 未关联建议控制样本 | **有限 PASS** | “QA 未关联建议”未凭空出现 OKR 行，“采纳并建习惯草稿”“忽略”两个按钮正常可见 |

本结论仅关闭 HC01 指定 GUI 视觉门，不扩成 GM01、全习惯页、A19 总门、发布门或提交门。

## 2. 候选与运行绑定

基线提交为 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`；dirty 候选以 `candidate.json` 和文件指纹认领，不以 HEAD 单独代表。

| 对象 | SHA256 |
| --- | --- |
| `reports/all-pending-evidence-20261021/A19HC/candidate.json` | `03efd7b68efc22247c677b48fed66cdcb1746c9275b66b1d8d071f8f329f5bb2` |
| `packages/dsh-pm-tool/src/client/panel.css` | `3cc0b0ed08ea34462ded8154b05f394a46f02c6577dea5da12c495aafa0f700b` |
| `packages/dsh-pm-tool/src/client/views/habits.tsx` | `ab7e625808b6c4308068c26376c02d7fae9b59fc812ab9b77484c29633bd4964` |
| `packages/dsh-pm-tool/src/client/views/habits-card-wrap.test.tsx` | `071c2b0488e88078d15f6436c1798cced495706c15bf8ecbfcf435c343459d0d` |

`runtime-binding.json` 指向隔离插件树 `/private/tmp/pmtool-a19hc-closure-20261022-r1/packages/dsh-pm-tool`，采证宿主为 `127.0.0.1:3250`。独立复算确认：

- 冻结树三份候选文件与上表逐哈希一致。
- 冻结树 `lib/client/index.js` SHA 为 `dce0c2df8549058a2504012ce13d6b20e58036296f3b0f1818b7d4b774371a25`，与 runtime 记录一致。
- 冻结树 `lib/client/panel.css` SHA 为 `3cc0b0ed08ea34462ded8154b05f394a46f02c6577dea5da12c495aafa0f700b`，与候选 CSS 及 runtime 记录一致。

因此，候选、隔离 runtime、下发 bundle 与 CSS 的证据绑定一致。

## 3. 逐图目视主判

### `habit-desktop-exact-1440.png`

- SHA256：`a4703fc56eb38c57f85a5100c924bf573c4c94fa3fbfd6c5541d5ffab6b9b5be`；实际尺寸 1440×1000。
- “QA 采纳习惯草稿”和“F5习惯”两张旧习惯卡均完整呈现。
- 长 OKR 在卡内自然换行，连续编号未截断；未见页面或卡片横向溢出。
- `<strong>仅供人阅读</strong>` 以普通文本显示；“（只展示，不参与裁决）”完整保留。
- 卡片边界、编辑按钮、三枚打卡按钮及链接图标均正常，未见挤压、重叠或裁切。

### `habit-mobile-390.png`

- SHA256：`0cc3fab9ab15b53db1521b09ccddfed61c1a5de29a7b5bae0861bb9cc1f68ed1`；实际尺寸 390×844。
- 两张旧习惯卡及各自长 OKR 均完整可见；长中文、字面 `<strong>`、连续编号和声明均自然多行换行，无截断或横向溢出。
- 三枚打卡按钮自然换为两行，未超出卡片；编辑按钮和链接图标尺寸、位置正常。
- 未见卡片结构被撑坏、控件重叠或图标压缩消失。

### `suggestion-unlinked-control-1440.png`

- SHA256：`2711e386f5177b798108196c71e0b9b812e476081c62f95ca7e166b74c09da18`；实际尺寸 1440×1000。
- “QA 未关联建议”只显示未关联说明，没有凭空出现“关联 OKR”行。
- “采纳并建习惯草稿”“忽略”两个按钮完整、正常可见，未见挤压或裁切。

三张指定截图均未发现 HC01 范围内视觉问题，因此无缺陷坐标可列。

## 4. 探针辅助核对

探针仅作目视结论的辅助，不替代主判：

- 1440 页面 `scrollWidth=clientWidth=1440`；390 页面 `scrollWidth=clientWidth=390`。
- 两个视口中两张旧习惯卡的 OKR 文本均为 `scrollWidth=clientWidth`。
- 390 下 badge 宽 269、高 143.375，文本宽 235、高 133.375；图标为 11×11。
- 未关联建议探针记录 `hasOkrLine=false`，动作恰为“采纳并建习惯草稿”“忽略”。
- 两份探针及三张截图的实际 SHA 均与 `evidence-manifest.json` 一致。

## 5. 证据与边界

原始证据位于 `reports/all-pending-evidence-20261021/A19HC/gui-main/`。Main 仅采集证据且未作判定，本报告为独立审签。

既有 `a19-habit-card-wrap-independent-retest-20261022.md` 的 SOURCE/AUTO 有限 PASS，以及 `a19hc-full-regression-independent-review-20261022.md` 的完整自动回归有限 PASS，边界保持不变。本报告不证明：

- GM01 或完整建议旅程；
- 全习惯页、其他视口、浅色主题或全量交互；
- A19 总门、发布候选、提交或推送放行。

**STOP：HC01 指定 GUI 证据有限 PASS；不外扩。**

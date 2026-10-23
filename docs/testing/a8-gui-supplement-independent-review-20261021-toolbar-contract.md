# A8 390 任务工具条局部修复合同

> 2026-10-21，trae，独立 GUI 原证专家。给 Main 开发/采证与后继独立审证使用：只关闭既有矩阵下的任务工具条越界，不把任务控件问题归因于恢复 preview，不扩新功能或全局 UI 合同。

## A8-TW01：P1，实际 390 浅色 GUI 局部 FAIL

- 最新派单明确追加 A8 `restore/width` 原件及当前工具条画面，本角色仍只写本前缀/selftmp，不操作 GUI、服务、产品、构建或提交。
- 有效依据：[remaining-journey-cases](remaining-journey-cases-20261021.md) §6 已生效 tasks 页面矩阵与共同比例可达/无外壳二维横滚要求；[A7 RV01 修复合同](a7-restore-gui-independent-review-20261021-repair-contract.md) RV01-WIDTH 已指定长路径390浅/深。本条不是将待表决 AGENTS §6A.1 全局建议追溯生效。
- 原证 `A8/restore/width/precheck-390-{light,dark}.json`：actual390×900，shell x56/right390、client329/scroll357，差28px。两主题 hash 取消边界0另签，不用零写替代布局。
- 原证 `current-390-toolbar-visible.png/json`（15:10:37.902Z）：独立目视可见“模板/导入/导出/分享”所在行的分享按钮被右边界裁掉，底部外壳水平滚条可见。不是只凭 probe 判 FAIL。
- Main 提供“分享 right413 > shell right390”的只读 probe 为补充定位事实。当前上述 JSON 仅含 shell bbox，没有各按钮 bbox；因此本专家独立核定的是 PNG 的真实裁切 + shell 28px 横滚，**不冒称已重算413**。若后补公共 bbox，可另绑定，不读私人 runtime 取它。
- `precheck-390-dark.png` 目视预检 warning 长路径折行、正文内部纵向滚动、确认/取消完整可见；无证据将28px归 preview。preset chips 既有横向内滚是另轴，不直接判其裁片为缺陷。
- 绑定冻结 A8 产物与 origin3219/document1792594413115.3；当前 A9 import 源变更不倒签此旧 GUI。DPR1/2 不证明原生100/200，本条只签当前实际390条件，不签完整缩放矩阵。

## 最小文件边界

| 文件 | 最小修复 | 禁止扩张 |
| --- | --- | --- |
| `packages/dsh-pm-tool/src/client/views/tasks.css` | 在 tasks 既有 action 子簇加入可收缩限宽/局部 wrap，让模板、导入、导出、分享完整按钮和标签在实际容器内排布；保既有 tokens 与宽屏分组 | 不全局 overflow-x:hidden，不隐藏分享/删控件/缩小字掩盖，不改 preview CSS 去背任务条问题 |
| `packages/dsh-pm-tool/src/client/views/tasks.tsx` | 仅 CSS 无法区分子簇时添加专属 class；既有动作与 aria/菜单不变 | 不重写导入、分享、任务数据语义，不接新功能；A9 owner 须协调文件互斥 |
| 既有任务 UI/样式合同测试 | 覆盖受限动作簇结构、全部按钮/标签保留，宽屏/窄屏规则不互相覆盖 | DOM/计算 bbox 只作辅助，不冒充 GUI PASS |

已读冻结 A8 tasks.css:47–52、781–834：toolbar/pt-tools 自身已有 wrap/限宽，不能笼统再改父层认修完。`tasks.tsx:1099–1178` 四按钮同属 `.pt-seg.pt-seg-data`；`tasks.css:77–80` 给 `.pt-seg` flex/gap/min-width，但没有内层 wrap。已有独立数据段可直接局部修，不需新增 JSX class 或万能全站组件。外层 wrap 不会让同一个 nowrap 子簇的四按钮自行分行；是否只需该规则仍由 Main 修后 GUI 证明。

## 先行复验

1. **TW01-390**：同原 F5/同任务入口，390×900浅/深分别长预检→滚到任务工具条→纯键盘依次到模板/导入/导出/分享，不实施分享外发。采每个按钮完整标签 bbox 与原 PNG/连续帧；shell client=scroll，按钮 right≤实际内容右缘，不需要外壳横滚找动作。
2. **TW01-AXIS**：preset chips 的既有内部横滚仍可用；完整预检 warning/pre/action 的限宽、全文内滚和确认/取消可达不退化。不把合法局部滚动等同外壳溢出。
3. **TW01-WIDE**：1440浅/深及原受影响中宽规则核全部动作分组/菜单/焦点；既有100/200矩阵继续由 Main 采原生菜单与 actual 尺寸，不因本局部修复宣布全部矩阵绿。
4. **TW01-PROTECT**：预检/取消和只读工具条导航按原三根完整键/hash前后零差异，保存历史/取消 mtime 缺口不借此造证；不扩大全disk。
5. **TW01-ID**：新源/差异/声明、Main唯一build、新产物/实例/uncached完整响应另认领；若纳入A9，写清新增源范围及受影响回归，不能用A8旧字节自签修后。

Main 按父持续授权修当前确证问题，独立专家判定。旧 A7-RV01、A8-RV02、A8-TW01 原 FAIL 均不抹除；本条未授权整项/发布/commit，不触碰其他 testing/livingdocs。

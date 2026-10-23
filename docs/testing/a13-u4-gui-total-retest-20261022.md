# A13 U4 GUI + 总门独立复验

> 2026-10-22，角色：独立测试专家。本文只裁决当前冻结 U4 候选的 RA-U401 GUI、RA-U402 GUI、CSS 漂移、完整回归与 U4 整项总门；不裁决 U4 之外余项，不授权 commit、push、tag、release 或服务切换。

## 1. 最终裁决

| 对象 | 裁决 | 独立结论 |
| --- | --- | --- |
| RA-U401 GUI | **FAIL** | 两规则初态、`C,A,B`、命名视图、A/B 隔离和最终恢复有原证；但 390px 下旧排序控件右侧被裁，既无文档横滚也无所属动作段内部横滚，违反既定“控件可达、全标签不裁切”合同。方向变更、规则换序及旧快捷清链也缺独立 GUI 原证 |
| RA-U402 GUI | **BLOCKED** | 四列逐项隐藏和全隐藏桌面截图可见；最终刷新/重进回读只证明负责人、优先级两列隐藏被持久化。截止日期、进度的刷新/重进恢复链，以及父行、状态分组头的真实 GUI 同源效果无原证 |
| 当前 CSS 漂移复验 | **PASS** | r6 `7e97...` 到当前 `a8e1...` 仅增加一条固定 grid fallback；后续同选择器的 `var(--pt-grid-columns, ...)` 仍覆盖，未改 U4 动态列轨道。当前聚焦测试 40/40 和修订后的静态合同均绿 |
| 完整回归 | **PASS（有警告）** | build、`tsc --noEmit`、155 files / 1589 tests、coverage、95/95 verify 与隔离污染门原证完整且 SHA 匹配；首轮静态合同失败保留，r2 修订后全绿 |
| U4 整项总门 | **FAIL** | RA-U401 存在当前候选可复现 GUI 缺陷；RA-U402 GUI 仍有可补证缺口。SOURCE/AUTO 与完整回归通过不能替代 GUI 门 |

**最终裁决：当前冻结 U4 候选整项 FAIL，不可据本文进入提交、推送或发布。**

AGENTS §6A.1 四视口、浅深色、200% 全矩阵仍是待表决提议，本轮没有把它追溯为硬门。本轮只应用 RA-U401/402 既定用例、A13 先行计划及已生效的 GUI/证据规则。

## 2. 候选与证据绑定

- 基线提交：`9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`
- 冻结候选：`/private/tmp/pmtool-u4-closure-20261022-r1`
- manifest：`reports/all-pending-evidence-20261021/U4/candidate-evidence-manifest.json`
- manifest SHA256：`a3ac6bb4d58d773a7b8f798bb37b88fb06ebd14e51f0587cc18d2ccf9ec44d1c`
- GUI 原始记录 SHA256：`ea411e3049b567ba51920fbc57500a28ca3a1889ca8a675cae97a4b15bb1eca1`
- bundle `lib/client.js` SHA256：`758446a9b8886c39f2d4012313a8450c11be137458034f6840745f41fff1ddc4`
- 当前 `tasks.css` SHA256：`a8e1fa53f09c60f6fd56d515d9dad42a5e36486c4acd61e4c0ca2fdac946a82d`
- r6 旧 `tasks.css` SHA256：`7e97c87576a245a48eba5ffb2fb26e3da0e0eeb921f8b3b686d23b385409127b`

独立复算 manifest 声明的候选源码/测试、bundle、GUI、回归、保留失败轮次和原始记录共 **41 项**，`41/41` 与声明 SHA256 一致。聚焦复跑后再次复算 8 个 U4 文件，`8/8` 零漂移。

冻结目录不是独立 Git worktree，不能用目录内 HEAD 代表候选；本结论以基线提交、manifest、逐文件 SHA 和证据 SHA 联合绑定。

## 3. RA-U401 GUI

### 3.1 已证范围

- `01-wide-two-sort-all-columns.png`：真实设置面板显示 `priority asc -> dueDate desc`，真实三任务行序为 `C,A,B`。
- `10-sort-query-before-save.png`、`11-view-saved.png`：查询 `U4-` 与两规则并存，命名视图 `U4 双排序视图` 已保存。
- `13-project-b-isolated-default.png`、`14-project-b-own-default-restored.png`：B 未继承 A 默认，随后恢复 B 自有旧排序视图。
- `u4-project-isolation.json`：A/B 项目键并存且隔离；A 最终回读两规则、查询和列偏好，页面正文顺序仍为 `C,A,B`。
- `u4-mobile-keyboard.json`：命名视图菜单 Escape 后焦点回到 `button[aria-label="切换命名视图"]`。

方向变更后的 `C,B,A`、规则换序后的 `B,C,A` 只有执行端口述，没有独立截图、录像或对应页面状态 JSON。它们不计 GUI 原证；SOURCE/AUTO 只能补强实现可信度，不能替代该 GUI 步骤。A 项目中用旧快捷排序明确清空多规则也无 GUI 原证。

### 3.2 390px 确认缺陷

`16-mobile-390-sidebar-collapsed.png` 与 `u4-mobile-collapsed.json` 共同记录：

- viewport、`documentElement.scrollWidth`、`body.scrollWidth` 均为 `390`；
- 任务根为 `x=70..371`，三条任务卡为 `x=75..366`，表体没有顶出文档；
- chip 行右侧项目超出首屏，但 `.pt-chips` 明确配置 `overflow-x:auto`，属于既定局部横向可达区域，本身不判缺陷；
- 动作段中的旧排序控件 bbox 为 `x=335.28125..422.78125`，右侧超过 viewport `32.78125px`；截图中“按 WBS 编号”标签实际被右边界裁切。

当前源码中 `.pt-tools` 允许换行，但“视图设置 / 按状态分组 / 旧排序”共同位于不换行、无 `overflow-x:auto` 的 `.pt-seg-org`。因此该超出部分既不能通过文档横滚到达，也没有所属段的内部横滚机制。仅证明 `scrollWidth=390` 不能把被隐藏裁切判为可达。

复现步骤：

1. 以 manifest 绑定候选进入项目 A 的“全部任务”。
2. 将真实浏览器 viewport 设为 `390x844`，收起宿主侧栏。
3. 保持 A 默认命名视图，观察任务工具条的组织动作段。
4. “按 WBS 编号”右侧和完整标签被裁；横向滚动文档无效，该动作段也无独立横向滚动。

预期：控件及完整标签位于任务根内，或由明确的局部横向滚动区域完整可达。实际：控件部分落在 viewport 外且无对应滚动容器。

因此 RA-U401 GUI 为 **FAIL**，不是证据型 BLOCKED。

## 4. RA-U402 GUI

### 4.1 已证范围

- `04/06/07/08`：负责人、优先级、截止日期、进度分别取消后，对应桌面表头和真实行单元同步消失。
- `12-saved-all-optional-columns-hidden.png`：四个可选列同时隐藏时，编号、标题和操作仍可见。
- 最终 `u4-project-isolation.json`：A 保存状态含 `assignee:false`、`priority:false`；刷新/重进后的页面正文只显示截止日期、进度和操作，证明这两列偏好真实恢复且未串到 B。
- `09-all-optional-columns-hidden.png` 与 `debug-panel-disappeared.png` 只显示宿主壳，按既定排除清单不作正向或负向产品证据。

### 4.2 证据缺口

- 最终 localStorage 没有 `dueDate:false`、`progress:false`；现有证据不能证明这两列隐藏经保存、真实刷新和服务重进后仍恢复，再由用户恢复并保存。
- 没有父任务行或状态分组头在列显隐时的真实 GUI 截图/结构化状态。
- 全隐藏截图只证明当时渲染，不证明全隐藏状态跨刷新持久。

这些是执行端可补的 GUI 原证，不属于必须用户本人配合事项，不能转 `MANUAL_PENDING`。当前没有证据证明列显隐功能行为错误，故 RA-U402 GUI 精确判为 **BLOCKED**，不判 FAIL，也不判 PASS。

## 5. CSS 漂移复验

r6 冻结 CSS 与当前候选逐行 diff 仅为：

```css
.pm-tasks-root .pt-grid {
  display: grid;
  grid-template-columns: 22px 28px 62px minmax(0, 1fr) 128px 64px 108px 148px 72px;
  grid-template-columns: var(--pt-grid-columns, 22px 28px 62px minmax(0, 1fr) 128px 64px 108px 148px 72px);
}
```

新增第一条声明是固定 fallback；支持 CSS custom properties 的当前 Chromium 使用随后声明，U4 通过 `--pt-grid-columns` 下发的动态列轨道仍生效。桌面四列逐项截图也与此一致。

独立复跑（macOS arm64，Node `v22.23.3`，Vitest `2.1.9`，未安装/更新依赖）：

```sh
cd /private/tmp/pmtool-u4-closure-20261022-r1/packages/dsh-pm-tool
./node_modules/.bin/vitest run \
  src/core/task-views.test.ts \
  src/core/task-tree-u4.test.ts \
  src/client/views/task-views-u4.test.tsx \
  src/client/views/tasks-number-feedback.test.tsx \
  --no-cache
node scripts/verify-ui-feedback.mjs
```

- Vitest：exit 0，4 files，**40/40**。
- `verify-ui-feedback.mjs`：exit 0，输出 `verify-ui-feedback OK`。
- 保留 `TaskTable` 子项缺少唯一 `key` 的既有 React warning；不改写为“零警告”。

CSS 漂移受影响复验结论为 **PASS**。第 3.2 节 390px 缺陷来自当前既有动作段布局，不由这一行 fallback 引入，二者不得混为同一结论。

## 6. 完整回归

| 层 | 原证 | 裁决 |
| --- | --- | --- |
| build r2 | exit 0，20s | PASS |
| `tsc --noEmit` | exit 0 | PASS |
| Vitest coverage r2 | 155/155 files，1589/1589 tests，exit 0 | PASS |
| coverage | statements 89.4%，branches 82.41%，functions 85.89%，lines 89.4% | 记录值 |
| isolation selftest | exit 0 | PASS |
| `verify-isolation.mjs` r2 | 95/95；保护资产 before=5、after=5、污染=0，exit 0 | PASS |

首轮 `coverage.exit.json` 和 `guard.exit.json` 的 exit 1 均保留。首轮实际失败为旧固定 grid 字符串断言和旧 `flattenVisible` 调用形状；当前 manifest 绑定修订合同：

- `tasks-number-feedback.test.tsx`：`bace029fc20f46cc8e65b075879966d97e2cd5e4e24a4d1673af3a528a157e1f`
- `verify-ui-feedback.mjs`：`3694be0b1a53a886968a8de83ca76ed3a8169c9aacd6e84589b8af3eb54dd056`

r2 原证还保留 React `key`、`MaxListenersExceededWarning`、测试环境 `requestAnimationFrame is not defined` 等 warning，以及故障分支预期错误日志。它们未导致 r2 失败，本报告不授权豁免或关闭这些警告。

完整回归结论为 **PASS（有警告）**；它不能覆盖第 3 节真实 GUI FAIL。

## 7. 最小修复与补证

开发先修复第 3.2 节动作段裁切，不能只隐藏溢出或只证明文档 `scrollWidth=390`。修后最小补证：

1. 390x844、宿主侧栏收起，记录 `.pt-tools`、`.pt-seg-org` 和三个控件的 client/scroll bbox；完整标签与控件须在根内，或实录局部滚动前后均可达。
2. 同一合法三任务中各留一份方向变更、规则换序的页面状态证据，包含规则字段/方向和实际行序；再留旧快捷排序后多规则已清空的证据。
3. 对截止日期、进度分别完成隐藏、保存、真实刷新、服务页面重进、恢复、再保存，并回读项目键。
4. 用含父任务且开启状态分组的合法 fixture，留父行、叶行、状态分组头在列显隐前后的真实 GUI 证据。
5. 绑定修后新 manifest、bundle、实例和全部受影响回归；由独立专家复验。无需追补待表决的全矩阵。

## 8. 警告、边界与失效规则

- 本轮未把 09/debug 两图当证据，未把执行端方向/换序口述当原证。
- localStorage missing/property/get/set 故障仍沿用已通过的 SOURCE/AUTO；本 GUI 轮未注入浏览器故障 adapter，不能称其 GUI PASS。
- 未审 U4 之外整包余项、正式服务、发布版本或业务价值验收。
- 候选任一 U4 源码/测试、`tasks.css`、修订静态合同、package/lock、bundle、fixture、运行实例或证据字节变化，相关结论按受影响范围失效。
- 第 3.2 节修复会使 RA-U401 GUI 和相关 CSS/窄屏证据失效，必须重测；RA-U402 补证若不改字节，可继续绑定本 manifest。
- HEAD、版本号、SOURCE/AUTO PASS、完整回归 PASS、GUI PASS 和 U4 总门互不替代。

# A13 U4 GUI + 总门独立复验 r2

> 2026-10-22，角色：独立测试专家。本文只审阅 Main 已采集的原始证据并裁决冻结 U4 r2 候选；未运行或改写 GUI 用例，未修改产品、Main 原始证据、vendor、data 或既有测试报告。本文不授权 commit、push、tag、release 或正式服务切换。

## 1. 最终裁决

| 对象 | 裁决 | 独立结论 |
| --- | --- | --- |
| RA-U401 | **PASS** | r1 已证双规则初态、命名视图、A/B 项目隔离和焦点归还；r2 新证补齐方向变更、规则换序、旧快捷清链，并修复和复验 390px 组织动作段裁切。 |
| RA-U402 | **PASS** | r1 已证四列逐项隐藏及全隐藏；r2 新证补齐截止日期、进度的保存、刷新、页面重进、恢复与再保存，并证明状态分组头、父行、叶行和动态 grid 轨道同源。 |
| U4 整项总门 | **PASS** | RA-U401、RA-U402 均通过；r5 为 155/155 文件、1590/1590 测试，r6 为 95/95 verify、保护资产污染 0。自动回归只作受影响回归证据，没有替代 GUI 裁决。 |

**最终裁决：与本文绑定的冻结 U4 r2 候选整项 PASS。**

本结论只关闭 U4 当前合同，不裁决 U4 之外余项，也不等于整包发布批准。AGENTS §6A.1 的四视口、浅深色、200% 矩阵仍是待表决提议，本轮未追溯为硬门。

## 2. 候选与指纹绑定

- 基线提交：`9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`
- 冻结候选：`/private/tmp/pmtool-u4-closure-20261022-r2`
- 隔离运行根：`/private/tmp/pmtool-u4-runtime-20261022-r2`
- 实例：`127.0.0.1:3257`，PID `88698`
- 实例复核：PID 仍监听 `127.0.0.1:3257`；argv 含 `--profile pm --port 3257`；cwd 为只读上游 `/Users/bytedance/Projects/dsh-pm/deepseek-harness`
- manifest：`reports/all-pending-evidence-20261021/U4/candidate-evidence-manifest.json`
- manifest SHA256：`26f093c3f8fbc243a28cb736f452b6fc8aa1ed90ec7403bc14a94fac4948fba9`
- Main 原始记录 SHA256：`19dd93578139f564c610c7d6279db99333a9daabddb4682bb744a62561a0a485`
- bundle `lib/client.js` SHA256：`51234141fa6b34182492dbd294b60cb62320aa68aa8004111d6e5b12a6eee055`
- bundle `lib/core/reflect.js` SHA256：`6b53e4534de33f327978fcebe7886a1571febecf6945f2fac4910b53852703c5`

独立复算 manifest 所列 bundle、9 个 U4 源码/测试文件、32 个 GUI 文件、最终回归、保留失败轮次和原始记录，共 **60/60** 项 SHA256 一致，零失配。

冻结目录不是独立 Git worktree，HEAD 不能单独代表候选。本结论以基线提交、候选绝对路径、manifest 逐文件指纹、bundle 指纹、实例和原证联合绑定。

## 3. r1 缺口关闭核验

### 3.1 RA-U401

| r1 缺口 | r2 原证 | 审证结论 |
| --- | --- | --- |
| 第二规则方向变更缺证 | `02-direction-change.*`：`priority asc -> dueDate asc`，实际顺序 `t-0009,t-0008,t-0007` | 已关闭 |
| 规则换序缺证 | `03-rule-reorder.*`：`dueDate asc -> priority asc`，实际顺序 `t-0008,t-0009,t-0007` | 已关闭 |
| 旧快捷清链缺证 | `04-legacy-sort-clears-rules.*`：`sorts=[]`、`sort=dueDate` | 已关闭 |
| 390px 旧排序控件被裁 | `16-mobile-fixed-bbox.*` | 已修复并关闭 |

r1→r2 的运行时代码差异只有 `tasks.css` 在 `max-width:560px` 下为 `.pt-seg-org` 增加换行、最大宽度和盒模型；另增一条静态合同测试。排序、命名视图、持久化和任务树源码未变。因此 r1 的 A/B 项目隔离、默认视图恢复及 Escape 焦点证据按受影响面审查后可继承。

### 3.2 390px bbox

`16-mobile-fixed-bbox.json` 与截图共同记录：

- viewport、document、body 宽度均为 `390`；
- 任务根、`.pt-tools`、`.pt-seg-org` 均为 `x=70..371`，`clientWidth=scrollWidth=301`；
- “视图设置”位于第一行，“按状态分组”和旧排序控件位于第二行；
- 三个组织动作子项右边界分别为 `371`、`181.265625`、`306.765625`，均未超过任务根右边界 `371`；
- 截图中的“按 WBS 编号”标签完整可见。

r1 的右边界 `422.78125` 且无可达滚动区问题不再出现。RA-U401 的产品缺陷已关闭。

## 4. RA-U402 核验

### 4.1 截止日期与进度持久化

- `05`：截止日期隐藏并保存，表头/单元格消失，项目键写入 `dueDate:false`。
- `06`：真实浏览器刷新后仍隐藏，双排序顺序仍为 `C,A,B`。
- `07`：离开任务页再进入后仍隐藏。
- `08`：截止日期恢复并再保存，四个可选列均显示。
- `09`：进度隐藏并保存，表头/单元格消失，项目键写入 `progress:false`。
- `10`：真实浏览器刷新后仍隐藏。
- `11`：离开任务页再进入后仍隐藏。
- `12`：进度恢复并再保存，四个可选列均显示。

同一命名视图 ID `vw-mvja5rgq-ogxvq` 在各步骤保持稳定，排序规则和查询未被列偏好更新清除。

### 4.2 父行、叶行与状态头

- `13-grouped-parent-leaf-all-columns.json`：状态分组头、父任务 `t-0010`、叶任务 `t-0011` 及普通叶行均为 9 个 grid cell。
- `14-grouped-due-hidden.json`：隐藏截止日期后，状态分组头及所有任务行同步降为 8 个 cell。
- `15-tree-parent-leaf-due-hidden.json`：树视图父行和叶行均为 8 个 cell，计算轨道一致为 `22px 28px 62px 367px 128px 64px 148px 72px`。

截图证明真实页面处于对应分组/树和列设置状态；同名结构化 JSON 是该浏览器页面的 DOM 状态记录。二者结合足以关闭 r1 的同源证据缺口。

### 4.3 EGO React handler 适配器

本轮对 `05/08/09/12/14` 的适配器证据作**有限接受**：

1. 调用对象是当前真实页面节点已绑定的生产 React `onChange`，保存调用当前保存按钮的生产 `onClick`，没有另造业务函数或直接伪写 localStorage。
2. 每次调用后均观察真实 React 重渲染、表头/单元格变化和项目键写入；截止日期、进度还分别经过真实刷新和离页重进复核。
3. JSON 明示 `adapter`，Main 原始记录明确声明它不等于物理指针链，证据没有隐瞒执行方式。
4. r1 已证明同一组真实控件可呈现四列逐项隐藏；r2 没有修改控件绑定或持久化逻辑。

接受范围仅限本轮产品回调、渲染和持久化合同。它**不证明 EGO 的物理点击/CDP 事件派发兼容性**，也不应成为未来 GUI 用例默认替代方式；若后续修改控件绑定、事件语义或可点击性，相关证据失效并须重新采集真实用户动作链。

## 5. 自动回归与污染门

| 层 | 原证结果 | 裁决 |
| --- | --- | --- |
| r5 build | exit 0，25 秒 | PASS |
| r5 `tsc --noEmit` | exit 0，18 秒 | PASS |
| r5 Vitest coverage | 155/155 test files，1590/1590 tests，exit 0 | PASS |
| coverage | statements 89.4%，branches 82.41%，functions 85.89%，lines 89.4% | 记录值 |
| r6 `verify-isolation.mjs` | 95/95；保护资产 before=5、after=5、污染 0，exit 0 | PASS |
| r6 `test-isolation-guard.mjs` | 增、改、删及缺目录语义 fixture 全绿，exit 0 | PASS |

r3、r4 和 r5 首次 verify 的失败原证均保留。失败分别来自冻结树缺仓库级 fixture、F3/F5 侧车/expected fixture、vendor 目录；补齐只读输入后 r5/r6 全绿，没有删改失败历史。

回归 stderr 仍含既有 React `key`、`MaxListenersExceededWarning`、测试环境 `requestAnimationFrame is not defined` 和故障分支预期错误日志。本报告不把它们写成“零警告”，也不授权关闭这些既有警告。

## 6. 残余边界与失效规则

- 本专家只审证，没有自行执行 GUI 步骤；Main 也没有连续录像。截图、同名结构化页面状态、localStorage 回读及同一实例链共同构成本轮原证。
- localStorage 缺失、属性访问异常、get/set 异常沿用已通过的 SOURCE/AUTO；本 GUI 轮没有注入浏览器故障适配器，不扩大为故障路径 GUI PASS。
- 390px 只裁决 r1 已确认的组织动作段裁切，不扩大为待表决的完整响应式矩阵。
- manifest 是本轮声明范围的逐项绑定，不代表对冻结目录所有未列字节作全树签名。
- 候选任一 U4 源码/测试、`tasks.css`、package/lock、bundle、fixture、实例或证据字节变化，相关结论按受影响范围失效；事件绑定或控件可点击性变化会使第 4.3 节适配器继承立即失效。
- HEAD、版本号、SOURCE/AUTO PASS、完整回归 PASS、GUI PASS、U4 总门 PASS 和发布批准互不替代。

## 7. 独立审证动作

运行环境：macOS arm64 / Darwin 24.6.0。仅执行只读核验：

- 完整阅读 `AGENTS.md`、`docs/collaboration.md` §9/§11、A13 U4 先行计划及 r1 独立报告。
- 复算 manifest 所列 60 项 SHA256，并单独复算两个 bundle、manifest 和 Main 原始记录。
- 逐项读取 `gui-r2/01..16` 的结构化 JSON并目视关键截图。
- 对比 r1/r2 `src`：仅 `tasks.css` 与 `tasks-p0-toolbar.test.ts` 变化，共 9 行新增。
- 读取 r3..r6 退出记录、Vitest JSON、coverage 输出、verify 输出和污染门结果。
- 只读核对 PID `88698` 的监听端口、argv 与 cwd。

未运行产品构建、测试或 GUI 用例；自动回归结论来自已绑定原证，不冒充本专家重新执行。

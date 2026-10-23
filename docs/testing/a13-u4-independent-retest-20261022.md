# A13 U4 SOURCE / AUTO 修后独立复验

> 2026-10-22，角色：独立测试专家。本文仅裁决 RA-GAP-U4、RA-U401、RA-U402 的 SOURCE / AUTO 修后结果；不签 GUI，不签 U4 整项总门，不授权提交、推送、发布或服务切换。本轮未修改产品源码、测试 Oracle、reports、旧报告、服务或依赖，未启动或停止任何服务进程。

## 1. 最终裁决

| 对象 | 层 | 裁决 | 独立结论 |
| --- | --- | --- | --- |
| RA-GAP-U4 | SOURCE | **PASS** | `sorts` / `columns` 为旧 v1 四态上的可选加法字段，白名单固定为 4 个排序字段和 4 个已有可选列；未新增业务 schema、自由字段、自由列或同步能力 |
| RA-U401 | SOURCE | **PASS** | normalize、same/describe/save/parse/serialize、树同层 comparator、TaskTable 首载/apply/update/default/project switch、旧快捷清链及真实设置控件均已接通 |
| RA-U401 | AUTO | **PASS** | r6 对应 23 项通过，覆盖有序规则、方向/换序、坏链兜底、重复保首、树/折叠、空日期、稳定 tie、display progress、命名视图与项目隔离 |
| RA-U402 | SOURCE | **PASS** | 四列显隐贯穿表头、叶行、父行、状态头，并与 CSS 轨道变量同源；编号、标题、操作、复制与折叠保留 |
| RA-U402 | AUTO | **PASS** | r6 对应 15 项通过，覆盖四列逐项隐藏、父/叶占位、恢复与持久、项目隔离，以及 localStorage missing/get/property/set 失败 |
| 旧兼容与边界 | BASE | **PASS** | 10/10；旧 v1、六内置视图、旧四态、旧单排序、旧 WBS 与坏值兜底保持 |
| GUI / 真实刷新 / 服务重进 | GUI | **NOT_RUN** | 本轮未审真实浏览器、浏览器刷新、服务重进、视觉或键盘证据 |
| build / 全量回归 | 总门前置 | **NOT_RUN** | 本轮仅执行聚焦 Vitest 与 `tsc --noEmit`，未运行 build、全量 Vitest、coverage 或全部 verify |
| U4 整项总门 | 总门 | **未裁决** | 本文不得外推为 GUI PASS、完整回归 PASS 或 U4 整项 PASS |

**裁决：RA-GAP-U4 SOURCE PASS；RA-U401 SOURCE/AUTO PASS；RA-U402 SOURCE/AUTO PASS。**

## 2. 候选身份与证据绑定

- U4 修后轮次：`docs/testing/a13-u4-preplan-20261021-selftmp/r6/`
- r6 `candidate.json` SHA256：`0d36f275baa4046f325997e4c84497d37e27f5f8998d58b31163b6b2170da3ab`
- 基线提交：`9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`
- 产品 base：`2a7603023bc54ef13d788e50069ee3fde4671bf3`
- r6 tracked patch SHA256：`ebea56ab0427e056d01537cd6b49c04301bceafe01e747611ce0bd378c38f510`
- r6 source manifest：394 项；`source-before.json` SHA256 `ea3362f29a6f6ec9fe80b7ac9ea419e7f9b3bdf1a31e571d483d1dead91c3a43`
- 独立复算当前 394 项源码：**零漂移**；与 r6 的 `frozenSourceDrift=[]`、`liveSourceDrift=[]` 一致。
- r6 audit 同时记录 `inputDrift=[]`、`dependencyContentDrift=[]`、`dependencyCacheDrift=[]`。
- U4 准入基线 A20V3 manifest SHA256：`6409de168a76a72d8ad691cf96a44ac7d0b4f9f2dae0f43886326ef63f23bec2`；前序独立报告已判 A20 总门 PASS。该结论仅作为 U4 准入，不代替本轮 U4 验收。

r6 manifest 中遗留“先行 red 准备”的 scope 文案，但 manifest、完整源码指纹、patch、命令和结果均绑定修后字节；该旧标签不改变本轮逐断言审证，也不得用来扩大结论。

## 3. SOURCE 逐层核验

| 合同层 | 核验结果 |
| --- | --- |
| 有限数据合同 | `TaskViewSortRule` 只允许 `code/dueDate/priority/progress` × `asc/desc`；`TaskViewColumns` 只允许 `assignee/priority/dueDate/progress`。未知键被丢弃，不写任务业务 schema，不含自由表达式、自由列或团队同步 |
| normalize 与兼容 | 非数组、非法成员、未知字段、坏方向使整链回旧 `sort`；合法重复字段保首；坏列逐键按可见处理；旧 v1、六内置 ID 和四态精确兼容 |
| 完整视图模型 | `sameTaskViewState` 比较规则顺序/方向和四列有效显隐；`describeTaskViewState` 表达规则链及隐藏列；save/update/rename/default/parse/serialize 均保留可选偏好 |
| 树排序 | comparator 只传给 `indexChildren` 的根和同父分组；`flattenVisible` 仍做父子前序与整支折叠；规则并列回旧 numeric WBS code，再以输入序防御性稳定 |
| 排序值 | 截止日期缺失在 asc/desc 均置末；progress 使用 `resolveTaskProgressMeta(...).display`；旧无多规则路径仍保原单排序方向 |
| TaskTable 接线 | 首挂载、apply、update/save-as 的 `currentState`、默认恢复、项目切换均读写 sorts/columns；旧 `pm-sort-select` onChange 明确 `setSorts([])` |
| 真实设置控件 | 字段、方向、上移、下移、删除、追加及四列 checkbox 均连接真实 state；重复字段由已用 option 禁用，最多为固定四字段，不引入任务表 max3 |
| DOM 与轨道 | 表头、叶行、父行、状态头按同一 `columnVisible` 条件渲染；全部消费 `--pt-grid-columns`，全显 fallback 与旧 9 轨布局一致；隐藏列不留对应 DOM 或轨道 |
| 存储失败 | 缺属性、属性访问抛错、get 抛错均回会话内存；set 抛错后 `memoryOnly` 阻止后续 get-null 覆盖刚保存状态，键仍按项目隔离 |

未发现 SOURCE 层错误 Oracle、越过有限合同的实现或阻塞性缺口。

## 4. AUTO 原证与独立复跑

### r6 冻结 Oracle

| 命令层 | 原始结果 | 判读 |
| --- | --- | --- |
| FIXTURE 阶段 | exit 0；2 passed、51 phase-filter skipped | 合法三任务与树 fixture 通过生产 schema；skip 仅因分阶段过滤 |
| SOURCE/AUTO/BASE 阶段 | exit 0；51 passed、2 phase-filter skipped、0 failed | SOURCE 3、RA-U401 23、RA-U402 15、BASE 10 全绿 |
| 漂移审计 | 五类 drift 均为空 | 测试前后冻结源码、主树源码、固定输入和受监控依赖未漂移 |

`red.result.json` SHA256 为 `18d7fe230583554c6045adfeb32b97b559489de0ecd0ef920ffa8290e306d058`；本轮直接解析逐项 assertion，不采用摘要口述替代原证。

### 独立命令

环境：macOS arm64，Node `v22.23.3`，已有 Vitest `2.1.9` / TypeScript `5.9.3`；未安装或更新依赖。

```sh
cd /Users/bytedance/Projects/dsh-pm/pm-tool/packages/dsh-pm-tool
./node_modules/.bin/vitest run \
  src/core/task-views.test.ts \
  src/core/task-tree-u4.test.ts \
  src/client/views/task-views-u4.test.tsx \
  --no-cache
./node_modules/.bin/tsc -p tsconfig.json --noEmit
```

- 聚焦 Vitest：exit 0，3 files、**35/35**。实际计数为 `task-views.test.ts` 29、`task-tree-u4.test.ts` 2、`task-views-u4.test.tsx` 4；主执行“34/34”摘要少计 1 项，以本次真实输出为准。
- `tsc --noEmit`：exit 0，stdout/stderr 为空。
- 命令后再次复算 r6 的 394 项源码：零漂移。

## 5. 产品同域测试质量

未发现会把错误行为判绿的反向 Oracle。新增测试使用生产 `taskWriteSchema`、真实 `flattenVisible`、真实 `TaskTable` 和真实持久层，不另造排序引擎。

同域新增测试自身覆盖偏窄：

- `task-tree-u4.test.ts` 只覆盖同层排序、折叠和 tie 回旧 WBS。
- `task-views-u4.test.tsx` 只直接覆盖一条两规则链、单列隐藏、一次控件保存和 set-fails；未单独覆盖控件换序/删除、旧快捷清链、四列逐项、状态头、真实项目切换。
- 这些缺口由冻结独立 Oracle 的 51 项及 SOURCE 逐行审查补足，因此不构成本轮 SOURCE/AUTO FAIL；但这两份产品测试不能脱离 A13 Oracle 单独作为 U4 验收证明。

## 6. 警告与未覆盖边界

r6 `red.stderr.log` 与本轮独立聚焦复跑均保留：

```text
Warning: Each child in a list should have a unique "key" prop.
Check the render method of `TaskTable`.
```

该 warning 未使测试失败，且不是本报告授权豁免或关闭的缺陷；本轮结论是“exit 0 且有既有 warning”，不是“零告警”。

以下均未审，不得从 SOURCE/AUTO PASS 外推：

- 真实浏览器中设置面板的视觉、键盘、焦点、窄屏、浅深色和 200%；
- 真正浏览器刷新与服务重进后的持久恢复；
- F1 落盘业务库、真实任务 ID 与实际 localStorage 回读；
- build、全量 Vitest/coverage、全部 `verify-*.mjs`、bundle/宿主装载；
- GUI 中表头/叶行/父行/状态头 bbox、滚动、全显布局和复制反馈。

## 7. GUI 与完整回归交接

Main / GUI 执行端须沿既定 RA-U401/402 步骤采原证，不得自行改用例：

1. 用合法 F1 三任务从真实设置控件配置 `priority asc → dueDate desc`，逐次改方向、换序、删除，并用旧快捷排序确认多规则明确清空。
2. 分别执行另存、更新、设默认、真实浏览器刷新、服务重进、A→B→A；回读项目键、视图 ID、规则/列 JSON、实际行序。
3. 四列逐项隐藏和全部隐藏各一次；核表头、叶行、父行、状态头及 grid 轨道，确认编号、标题、操作、复制、折叠仍可达。
4. 覆盖 localStorage missing/property/get/set 故障 adapter 的 UI 会话行为；失败不抛、不清输入、不串项目，不声称禁存储时跨刷新永久保存。
5. 在同一候选上执行 build、全量 Vitest/coverage、全部适用 verify 与隔离污染门；保留完整 stdout/stderr/exit 和 warning。
6. GUI 执行端只交原始证据；PASS/FAIL/BLOCKED 仍由独立测试专家复核。完成上述步骤前，U4 GUI 与整项总门保持未裁决。

## 8. 失效规则

- r6 tracked patch、394 项 source manifest、两份 U4 新测试、Oracle、package/lock 或依赖内容任一变化，本 SOURCE/AUTO 结论按受影响范围失效。
- `task-views.ts` 的 normalize/same/describe/save/parse/serialize、`task-tree.ts` comparator、`task-views-persist.ts` 失败降级、`tasks.tsx` 首载/apply/save/update/default/project switch/控件/DOM、`tasks.css` grid 变量任一变化，相关 RA 结论必须重测。
- 新 build、bundle、服务实例或 GUI 证据必须绑定同一候选；HEAD、版本号、源码存在、AUTO PASS 与 GUI PASS 不能互相替代。
- 纯文档变化不自动使行为结论失效，但不得改写本报告的候选身份、warning、NOT_RUN 边界或裁决层级。

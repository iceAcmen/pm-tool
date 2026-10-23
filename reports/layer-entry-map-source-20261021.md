# 81 项只读源码入口映射

> 给 Main 后续真实 GUI 定位使用。配套 `layer-entry-map-source-20261021.json` 仅说明当前主树源码接线，不能当运行 layer-map、默认可达证据或独立测试判定。

## 范围与身份

- 依据 `docs/testing/remaining-layer-map-20261021.md` 的 42 个 `RA-DR` 与 39 个 `RA-MENU` 精确 ID；父持续授权见 `reports/all-pending-acceptance-execution-20261021.md`。
- 本子任务只有只读源码定位权限；只新增本前缀 JSON/MD，未修改产品、testing、living docs，未 commit/push。
- 未运行 GUI、install、build、服务、业务命令或产品测试；未读取业务 data、private、认证或凭据。不执行通用开工 SOP 中会改变工作树/运行环境的 pull/install/build。
- 首次引用源字节冻结：`2026-10-21T13:42:50.450Z`，即北京时间 `21:42:50.450`。主树 HEAD `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` 仅用于定位，不能代表未提交产品候选。
- JSON `sources` 冻结 38 个源码文件与 4 个直接合同/派单文件的 SHA256；仅限定这些实际参考源，不冻结整树，也不阻塞 Main 的其他域修复。

## 如何读 JSON

`layers` 严格一条对应一个 ID，共 81 条。每条记录原 manifest ID、fixture/宽度/主题/业务上下文、`entryRef`、实际最小定位动作及缺口说明。

用 `entries[layer.entryRef]` 取得该条的完整 `currentSourcePath`、`component`、`route`、真实 `trigger`、`observableControls`、相关 `commands` 与 `frontendOnly`。`triggerOverride` / `observableOverride` 覆盖共用入口的具体控件。`productionNavigation.routeDefinitions` 将 route 引用展开为生产面板状态，不是 URL。

这是标准 JSON 的归一化结构，不依赖平台对话或私人目录。浅/深/390、objective/KR、tasks/growth 等条目复用接线，但保留独立上下文；不意味着可以复用同一张截图或同一次动作证明全部状态。

读取并展开单条或全部条目到标准输出的示例如下。仅读报告，不启动产品、不写文件。运行环境为 macOS，已有 Node CLI：

```sh
cd /Users/bytedance/Projects/dsh-pm/pm-tool
node - <<'NODE'
const fs = require('node:fs')
const m = JSON.parse(fs.readFileSync(
  'reports/layer-entry-map-source-20261021.json', 'utf8'
))
const rows = m.layers.map(layer => {
  const entry = m.entries[layer.entryRef]
  const refs = [...new Set([
    ...m.commonSourceRefs, ...entry.sourceRefs,
    ...(layer.additionalSourceRefs ?? []),
  ])]
  return {
    ...entry, ...layer,
    route: m.productionNavigation.routeDefinitions[entry.route],
    trigger: layer.triggerOverride ?? entry.trigger,
    observableControls: layer.observableOverride ?? entry.observableControls,
    entryNotes: entry.notes ?? null,
    mappedAt: m.mappedAt,
    sourceStatus: layer.sourceStatus ?? m.scope.defaultSourceStatus,
    runtimeReachability: m.scope.runtimeReachability,
    testingVerdict: null,
    referencedSources: refs.map(ref => m.sources[ref]),
  }
})
console.log(JSON.stringify(rows, null, 2))
NODE
```

`selector` 是源码导出的 CSS 候选；`text`、`hasText`、`descendant`、`adjacentLabel` 是分步查找说明，不是拼成的 CSS。文本字段有动态数/标题时，使用实际 fixture 的身份再过滤。所有 selector 尚未经真实 DOM 验证，元素存在于源码不等于已装载。

尤其注意 records 交付物名称/备注、汇报周期日期没有 `name` 属性；应按 `label.pm-field` 的文本查后代输入，不能照旧表单找 `input[name=name]`、`textarea[name=note]` 或周期 `name`。原生 select/datalist 的展开列表可能属于浏览器/系统 UI，不保证能从 DOM 获取。

## 生产入口

- `client/index.tsx` 注册 `main` slot，panel ID `pm-tool`；宿主侧栏名称是「项目管理」。本 81 项没有独立插件页面 URL。
- 桌面从 `.pm-rail-item` 的真实标签进入视图；390 从 `.pm-view-switcher-btn` → `.pm-view-menu-item` 进入相同视图。合法宿主 URL、实际实例/端口/认证由 Main 新证据提供。
- 新建/编辑项目、任务、里程碑、风险、OKR、习惯、AI、设置沿 `panel.tsx` 的 `DrawerPanel`。
- 会议/交付物/汇报默认页面已由 `panel` 注入 records 回调，页内 `openCreate/openEdit` 优先 `RecordsOverlay` 与 `Records*Form`。旧 panel 表单不能未经入口核对当默认产品接线。
- 习惯/OKR 收件区是页面内 section；前置依赖是 TaskForm 内联搜索/多选区；甘特粒度与风险类型是分段按钮。沿原 manifest 分类追溯，不为 drawer/menu 分类新增控件或页面。
- 更多菜单实际是 `.pm-top-menu`，不是共享 `MenuPop` 的必然实例。分享按钮直接生成只读 HTML 下载，不存在由此推断出的外部分享菜单。

## 缺口与边界

源码定位状态为 `SOURCE_LOCATED` 69 条、`SOURCE_PARTIAL` 6 条、`SOURCE_UNCONFIRMED` 6 条。这是接线定位计数，不是测试结果；81 条运行可达性均未确认。

| 精确 ID | 当前源码事实 | 对后续定位的影响 |
| --- | --- | --- |
| RA-DR-30 | ProjectForm 的负责人为普通 `input[name=owner]`，没有 list/datalist | 候选菜单 opener 未确认；只能定位文本输入 |
| RA-MENU-14 | 默认 RecordsDeliverableForm 的负责人为无 name 的普通输入 | 未找到负责人候选 popup，不借旧表单补入口 |
| RA-MENU-26 | RiskIssueForm 的负责人为普通 `input[name=owner]` | 未找到人员候选 popup |
| RA-MENU-09 / 11 / 12 | 默认 `.rb-action-row` 不渲染问题/任务关联选择器；旧 ActionEditForm 有原生 select，但未找到默认页面进入旧表单的用户 opener | task/issue 关联菜单保持 SOURCE_UNCONFIRMED；深态也不凭旧源码认领 |
| RA-DR-04 | 当前公式 UI 是白名单口径/字段/条件构建器，表达式预览只读 | 直接输入 parser-error 公式的动作入口未确认；能观察现有构建校验错误，不自行改专家用例 |
| RA-DR-08 | RecordsMeetingForm 行动项区是 `meeting &&` 条件 | 当前新建态只定位会议字段/决议保存；先建后编辑是另一个提交边界 |
| RA-DR-09 / RA-MENU-10 | action 状态有 `#action-status-<index>`，保存走本行「保存」；「保存会议」仅传会议字段 | 不把主保存说成 action 草稿提交；09 关联部分仍缺入口 |
| RA-DR-35 | TaskForm 有客观进度只读信息、资料/进展 ops；未找到独立清单编辑控件 | 长态按实际区定位，不能声称可编辑清单已接线 |
| RA-MENU-01 | 配置「显示元素」内排版密度只有「舒适」「紧凑」 | 不用原条目三档要求造第三项，也不自行裁测试合同 |
| RA-MENU-38 | TaskTable 只有旧四 sort；TaskViewState 只有 query/chip/grouped/sort，无排序规则数组/列偏好 | 保留总登记 §6 的 RA-GAP-U4、RA-U401/02 缺口，不实现、不改 N/A |

以下是已找到入口的提交差异，不作为新增功能要求或 testing 结论：

- OKR 的「新建 OKR」为一个入口，默认目标 O；KR 在 `#gf-okr-kind` 里切换。同项目父目标/软关联的候选范围不同。
- 习惯创建按钮是「新建习惯」，收件区确认是「采纳并建习惯草稿」；设置保存按钮是「保存口径」，不是设计或旧文案「保存设置」。
- 副驾确认按钮真实文案为「整批执行（勾选数）」和「逐步执行」；cancel 仅清本地计划，apply 才发 `ask-apply`。
- TaskTable MovePicker 选择候选即调用 `task move ... --renumber confirm`，没有第二个保存按钮。取消从遮罩返回。
- 看板下拉有个人/项目/内置三个本地 scope 选项，但 `BoardBento.onSave/onReset` 使用 `activeScope`，忽略回调传入 scope：总览写 `user`，项目概览写 `project:<id>`。不能按下拉标签推断后端目标；A/B 从各自 overview 进入。
- 任务导出菜单真实文案为「Markdown 周报」「CSV 表格」「JSON 结构化」；文件来自当前 `visible` 集合，不是顶栏项目/整库导出。
- TaskTable 的 `importPreview.confirm` 当前存的是与预览相同的 `task import-content` 命令串，未见追加 `confirm`。仅交源码接线给 Main/专家核对；本次未执行、未判行为或修复。
- 提醒里的任务标题打开任务详情；里程碑标题仅跳里程碑视图。旁边「标记完成」与 `+1`/`+7` 会写，不能作为只读跳转动作。
- 报告 preview 需要真实 capability；所选 refs 仍受当前 revision 合同，不因本映射增加任意历史版本选择。final 报告编辑默认新 draft，固定来源不因此重算。

总 register 与旧合同明确 N/A/排除项保留；本报告没有新判 N/A，没有把「未定位」变成产品 FAIL，也没有把旧有限 PASS 转抄为本轮结论。R11/H6 常驻通知、自由公式/列设计器、U3 提案、全抽屉 dirty 守卫等不因设计层枚举被重新立项。

## 哈希与漂移

每条实际参考源集合是 `commonSourceRefs + entry.sourceRefs + additionalSourceRefs`。Main 只需对相应文件重算哈希，再核精确接缝 diff；不应要求所有无关域停修。

若 panel 漂移，先查改变的是该条的导航、回调注入、opener、命令还是无关桥接逻辑，再刷新受影响条目。其他源漂移按引用关系标记；同 HEAD、相同 version、无源码变动都不证明已装载。

合同文件漂移也须复核精确 ID/动作，不静默沿旧映射；早于首次哈希冻结的读数不作为同候选前后原证。

本报告交付核对时点/变化列表见 JSON `drift`。后续 Main 必须新建 runtime layer-map，绑定实际候选差异、构建产物、装载实例、开关、fixture 真 ID、真实 opener/控件、动作时间段与原证；独立专家审证。这里的 source map 不填 testing 判定。

## 文档自检

本次只用文件读取、源码搜索、Git 状态/HEAD、Node JSON 解析与 SHA256 运算。`rg` 未安装后用 `grep/find`；未为此安装工具。

- 精确清单比对：42 drawer + 39 menu，共 81；无遗漏、重复或悬空 `entryRef`。
- selector 类名文本核对：入口引用源内未发现缺失的受检 `pm-* / pt-* / dv-* / mt-* / rp-*` 类名。这只是文本检查，不证明 CSS selector 在真实 DOM 命中。
- 引用源哈希复核：13:47:30.927Z 的 42 文件均与首次冻结一致。最终交付再次核对见 JSON。
- 产品验证、运行可达、GUI、焦点、主题、缩放、业务写/取消零写、数据恢复：本任务均未执行；不签 PASS。

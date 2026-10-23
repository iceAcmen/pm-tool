# U4 任务命名视图有限修复实施计划

> **执行约束：** 按仓库 ADL-045/047/057 与独立先行计划逐步实施；最终只做一次普通提交，不执行通用模板里的逐任务提交，不推送、打 tag、发布或切换正式服务。

**目标：** 关闭 RA-U401/RA-U402：任务命名视图支持有限多规则排序、四个既有可选列显隐及项目级持久化，同时保持旧四态、六个内置视图、WBS 树和业务数据不变。

**架构：** `core/task-views.ts` 作为新旧视图状态的唯一归一化、相等和摘要来源；`core/task-tree.ts` 通过可选同层 comparator 保持父子前序；`TaskTable` 负责编辑状态、控件和按同一列模型渲染表头/父行/叶行/状态头；localStorage 薄层只修复写失败后的会话内存回读。

**技术栈：** TypeScript、React 18、Vitest、react-test-renderer、现有 CSS token 与 Lucide 图标。

---

## 方案选择

1. **采用：核心归一化 + 同层 comparator + 条件渲染。** 单一状态模型同时驱动排序、DOM 与 grid 轨道，最符合现有模块边界，也能保证父子连续。
2. **不采用：先把扁平任务全局排序再建树。** `indexChildren()` 会再次按 WBS 编号排序，且全局排序容易拆散父子关系。
3. **不采用：仅用 CSS 隐藏固定列。** 会保留空 DOM 单元和固定轨道，违反父行/叶行/表头同源及无错列合同。

## Task 1：锁定红例与补产品同域测试

**文件：**
- 修改：`packages/dsh-pm-tool/src/core/task-views.test.ts`
- 修改：`packages/dsh-pm-tool/src/core/task-tree.test.ts`
- 新增：`packages/dsh-pm-tool/src/client/views/task-views-u4.test.tsx`
- 引用：`docs/testing/a13-u4-preplan-20261021-cases.test.tsx`

1. 运行 `node docs/testing/a13-u4-preplan-20261021-run.mjs r4`，预期 fixture 通过、产品红例失败。
2. 把核心归一化、稳定同层排序、四列显隐、保存/项目隔离与 localStorage 写失败回读覆盖到产品同域测试。
3. 不修改独立专家的测试 Oracle。

## Task 2：扩展视图纯模型

**文件：**
- 修改：`packages/dsh-pm-tool/src/core/task-views.ts`
- 测试：`packages/dsh-pm-tool/src/core/task-views.test.ts`

1. 新增可选 `sorts` 与 `columns`，字段仅限 `code/dueDate/priority/progress` 与 `assignee/priority/dueDate/progress`。
2. 合法规则去重并保序；任一非法成员使整链回空，继续使用旧 `sort`。
3. 列缺键或坏值按可见处理；未知列忽略。
4. `sameTaskViewState()` 把空规则/全显与旧状态视为等价；方向、顺序或显隐变化判 dirty。
5. `describeTaskViewState()` 增加规则顺序/方向与隐藏列摘要，旧状态文案保持兼容。

## Task 3：保持 WBS 树的同层多规则排序

**文件：**
- 修改：`packages/dsh-pm-tool/src/core/task-tree.ts`
- 测试：`packages/dsh-pm-tool/src/core/task-tree.test.ts`

1. 给 `indexChildren()` / `flattenVisible()` 增加可选 comparator。
2. comparator 只作用根与同父兄弟；并列回落 numeric WBS code，再回落输入稳定顺序。
3. 折叠、孤儿根、父在子前及旧无 comparator 行为保持不变。

## Task 4：接入 TaskTable 状态与控件

**文件：**
- 修改：`packages/dsh-pm-tool/src/client/views/tasks.tsx`
- 测试：`packages/dsh-pm-tool/src/client/views/task-views-u4.test.tsx`

1. 首挂载、apply、保存、更新、设默认和项目切换全部读写 `sorts/columns`。
2. 旧单排序选择器仍保留；用户选择后清空多规则，明确回到旧路径。
3. 新增紧凑“视图设置”菜单：最多展示当前有限规则列表，可添加合法字段、改方向、调整顺序、删除；四个已有列使用原生 checkbox。
4. 多规则 comparator 使用既有优先级、ISO 日期和 `resolveTaskProgressMeta().display` 口径；无日期始终在末尾。
5. grouped 与树模式都应用同一规则；不修改任务对象或编号。

## Task 5：列 DOM 与网格轨道同源

**文件：**
- 修改：`packages/dsh-pm-tool/src/client/views/tasks.tsx`
- 修改：`packages/dsh-pm-tool/src/client/views/tasks.css`
- 测试：`packages/dsh-pm-tool/src/client/views/task-views-u4.test.tsx`

1. 表头、叶行、父行和状态分组头仅渲染可见可选列。
2. 由 `data-columns` 组合生成桌面 grid 轨道；全显时保持原九列尺寸。
3. 窄屏沿既有卡片布局隐藏相应字段，不新增横向滚动。
4. 编号、标题、选择、移动、操作、复制和折叠始终保留。

## Task 6：修复 localStorage 写失败回读

**文件：**
- 修改：`packages/dsh-pm-tool/src/client/views/task-views-persist.ts`
- 测试：`packages/dsh-pm-tool/src/client/views/task-views-u4.test.tsx`

1. `setItem` 失败后标记该项目键使用会话内存。
2. 同会话后续 `getItem()` 返回 null 时不以空仓覆盖已保存内存态。
3. 缺失、属性访问失败、读取失败和跨项目隔离均不抛；不承诺跨刷新同步。

## Task 7：专项 GREEN、冻结与独立复验

1. 运行产品同域测试与 `node docs/testing/a13-u4-preplan-20261021-run.mjs <新轮次>`，要求 SOURCE/AUTO/BASE 全绿。
2. 在隔离冻结树运行 build、noEmit、Vitest coverage、默认 `verify-isolation.mjs`、guard selftest 和 Launcher（若指纹变化则重跑）。
3. 启动隔离服务，以专家既定 RA-U401/402 步骤采集真实 GUI：配置、另存/更新、默认、刷新/重进、A/B 项目隔离、列隐藏/恢复、故障恢复、键盘与窄屏。
4. 由独立测试专家审证并明确给出 U4 PASS/BLOCKED；开发不自验收。
5. U4 PASS 后继续剩余台账，不以本批 PASS 代替最终整包回归。

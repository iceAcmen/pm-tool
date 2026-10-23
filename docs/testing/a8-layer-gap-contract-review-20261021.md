# A8 五疑点独立合同核验

> 给 Main 与接手专家使用。按已生效承诺判定 explorer 的五疑点，附生产组件/命令原证、最小修复和 GUI 采证合同。2026-10-21，平台 trae，独立测试专家；仅 SOURCE/组件/内存命令有限结论，不签 B8 总门。

## 1. 结果

| 疑点 | SOURCE 有限结论 | 原承诺 / 确证范围 | GUI |
| --- | --- | --- | --- |
| Records action select 不见 | **FAIL，LG-01 / P1** | R8、ADL-025、R8 设计明确已有任务/问题关联与解除；默认真实 MeetingsView 编辑挂 RecordsMeetingForm，实际 action 行只有标题/负责人/截止/状态/保存/转任务/删除，没有关联选择控件 | NOT_RUN |
| create action 仅 editing | **NOT_APPLICABLE，LG-02** | R8 是会议 add/update 与 action add/update 分命令；旧生产 MeetingForm 同样仅已存会议挂 MeetingActions。未找到要求“首次会议保存原子建行动项”的有效承诺；真实组件先建会议→重开编辑→新增行动项成功。不为新建态造新功能 | NOT_RUN；RA-DR-08 需按下文明确步骤执行 |
| owner popup 缺 | **NOT_APPLICABLE，LG-03** | 原 T8 §0.3 第8条/参考行明确 ProjectForm、RiskIssueForm、DeliverableForm owner datalist 为 P1、不入门；P0 只有 task assignee 补全。候选数据来源含 owner 不等于 owner 输入已承诺 popup | 不签 popup PASS；相关选择菜单不适用，普通字段保存 GUI 仍 NOT_RUN |
| task checklist editor 未接 | **FAIL，LG-04 / P1，限已有清单 toggle** | ADL-050 与原 OP-GUI-01 明确抽屉勾一叶子项；真实 PmPanel→TaskTable.onEdit→TaskForm，合法两项清单显示50%/1/2但0 checkbox、0清单条目操作入口。后端真实 add/toggle 可用 | NOT_RUN |
| task import confirm 未加 confirm | **FAIL，LG-05 / P1** | ADL-043、OPT-12、RA-IM01：预览零写、确认落盘。真实 TaskTable→FileReader→生产 handleTaskCommand；确认重复 dry-run，任务仍0，却关闭预览并调用 onSaved；同内容命令加 confirm 正向控制建2条正确父子任务 | NOT_RUN |

**同一行动项接缝另有确证 FAIL：LG-01b / P1。** `docs/test-cases.md:144` 明确“新增或编辑行动项后直接点击保存会议，重开应读回”。真实组件改变标题后主保存只发 `meeting update`，ai-001 标题仍旧值；本行保存才发 `meeting action update`。不能把开发的 records 行内保存说明当负责人撤销原验收承诺，也不能以错误测试步骤为由忽略这个真实退化。

结论不是全部产品验收：3 个正向控制 PASS 不抵销4个合同断言 FAIL；4个失败属于行动项两接缝、清单入口、导入确认。U4 多排序/列偏好明确排除，不重签其他领域与 B8。

## 2. 候选、计划与原证

- 先计划：[plan](a8-layer-gap-contract-review-20261021-plan.md)，后执行：[probes](a8-layer-gap-contract-review-20261021-probes.test.tsx) / [runner](a8-layer-gap-contract-review-20261021-run.mjs)。LG-01b 在最终轮执行前补原承诺与断言。
- 父授权/资源 owner：`reports/all-pending-acceptance-execution-20261021.md`；explorer 只读定位：`reports/layer-entry-map-source-20261021.json/md`。没有重新探索81层。
- HEAD `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` 仅基线；dirty 产品源全部复制冻结，tracked patch留自有 tmp、SHA登记，不能把HEAD当被测候选。
- 最终r4：`/private/tmp/pmtool-a8-layer-gap-b0X9LM`，开始 `2026-10-21T14:48:34.522Z`、结束 `14:48:37.300Z`；完整源哈希、合同哈希、依赖与保护前后见 [r4-execution.json](a8-layer-gap-contract-review-20261021-r4-execution.json)。结束全部源漂移0。
- [r4-stdout](a8-layer-gap-contract-review-20261021-r4-stdout.txt)、[stderr](a8-layer-gap-contract-review-20261021-r4-stderr.txt)、[逐例结果](a8-layer-gap-contract-review-20261021-r4-vitest.json)、[生产命令/组件原观察](a8-layer-gap-contract-review-20261021-r4-observations.jsonl)。内存 domain 沿仓库现有模式，生产组件/工厂/handler/领域函数未 mock；window/document/FileReader 和 execute传输为环境设施。
- macOS、nvm Node `v22.23.3`、pnpm `11.28.5`、React/renderer `18.3.1`、Vitest `2.1.9`。主树renderer实际缺包；复用父隔离树已有依赖只读链接，未install。

执行命令（在仓库根，macOS + bash）：

```sh
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm use 22 >/dev/null
node docs/testing/a8-layer-gap-contract-review-20261021-run.mjs r4
```

runner 自有子进程命令为 `node <父隔离依赖>/vitest/vitest.mjs run --config <自有tmp>/vitest.config.mjs --no-cache`；`cache:false`，`cacheDir` 在自有tmp。runner外层正常0表示证据已归档，**不是测试绿**；Vitest原exit1已登记。

| 轮次 | 结果 / 外层 / 子进程 | 分类 |
| --- | --- | --- |
| 首轮无后缀 | 外层0，Vitest1，未收集用例 | 主树缺renderer设施失败；原日志/源冻结保留，非产品FAIL |
| r2 | 外层0，Vitest1，3绿/3红 | 1红为图标编辑按钮错查文本；另有卸载HTMLElement桩缺失警告。均保留，不作为GUI/产品结论 |
| r3 | 外层0，Vitest1，3绿/3合同红 | 仅更正图标aria-label及HTMLElement环境桩；原业务断言不改 |
| r4 | 外层0，Vitest1，3绿/4合同红 | 新增LG-01b原合同断言；其余结论重复成立 |

四轮共享主树lib、主树`.vite/.cache`前后相同；r2-r4另核父隔离依赖`.vite/.cache`前后相同。只证明这些 WATCH 根，未扫描正式资产、凭据或其他人的 tmp。没运行build/GUI/service/commit，没改产品/其他testing/livingdocs。

## 3. 承诺与真实调用链

**行动项**：`requirements.md:41,197`、`decision-log.md` ADL-025、`plans/2026-10-10-r8-meeting-notes-design.md:58-62,78,96-97`、B6-A04、`test-cases.md:144`。`panel.tsx:864-875,1376-1381` 注入回调→`meetings.tsx:70-73,227,315-325` 实际编辑 opener→RecordsForm。`records-meeting-form.tsx:39-51` 持有关联值，但`:193-238` 无编辑控件；`:86-95` 主保存只调用onSaveMeeting，`:100-105` 行内保存调用onSaveAction；工厂`shared/records-callbacks.ts:69-74` 翻译真实action命令。旧`panel.tsx:3433-3444,3520-3528,3584-3595` 具主保存action链和关联select，但没有作为当前默认页面 opener，不能借它补默认PASS。

**新建态**：上述R8设计把actions禁止放进meeting普通add/update，并要求分命令。旧`:3520`同样`meeting &&`；Records`:193`条件延续原边界。RA-DR-08 的“空表单→行动项→save”未成为负责人另授权的原子创建需求。

**owner**：T8冻结`:53-60,102`最具体；2026-10-21状态校准只是“人员补全已有”，不扩大原T8范围。`panel.tsx:912-919,1528,2688-2690`候选只喂TaskForm；Project/Risk普通owner，RecordsDeliverable`:120-121`普通输入。真实交付物组件自由输“全新人名”/清空分别输出owner值，无popup；这个控制只签组件payload，不签持久化。

**清单**：原OP-GUI-01`:187`明确抽屉toggle；ADL-055人工双轨没有取消清单操作。`panel.tsx:1521-1546` TaskForm拿真实task；`:2723-2730`只读比率。生产`commands/task.ts:701-738`→`core/task-checklist.ts`现有单写函数可add/toggle，前端缺入口不是后端坏，更不是全新自由编辑器承诺。

**导入**：`tasks.tsx:1126-1128` preview及confirm串相同；`:1253-1255`将预览的success误当落盘success→关闭。`commands/task.ts:541,565-584`末尾confirm才执行真实import；现有`verify-import-content.mjs`确认正例也明确带confirm。此处不归罪命令防写守卫，正向控制证明后端正常。

## 4. Main 最小修复合同

实现与 GUI采证均由 Main 独占。本专家不写产品；每接缝新增/更新产品tests，先红后修，交新源/diff/产物/装载身份后独立复验。共享builder仍唯一Main。

### LG-01 / LG-01b：行动项

- 最小文件：`client/views/records/records-meeting-form.tsx`；选项透传必需时仅 `client/views/meetings.tsx`、`client/panel.tsx`；必要类型仅 `client/shared/records-props.ts`。不改会议schema/域、既有关联保护或promote语义。
- 表单按会议projectId提供任务与type=issue候选（禁止跨项目及risk）；每类含空值解除、保现关联与stable ai-ID。不可用无关联空列表覆盖已存ID；不通过数组下标认领被测实体。
- 恢复已存会议主保存提交action草稿的旧承诺，可调用既有action回调顺序提交；所有必要action成功才onSaved关闭，失败保输入/可重试。不把raw actions塞进meeting update、不增加跨会议/action事务或新建原子创建新需求。保行内保存/新增/删除/转任务，新增项只在真实显式提交后写。
- AUTO最低：LG-01/01b转绿；两个已有ai-ID含关联标题状态修改/解除/保历史；空/新行、失败不关与取消零回调、非法同域选择拒绝；原records callbacks/payload与meeting命令专项受影响回归。不继承旧行内PASS扩大主保存PASS。

### LG-04：清单

- 最小文件：`client/panel.tsx` TaskForm区及组件测试；可复用小组件但不要求创造全功能编辑器。必要样式在现有作用域内，不改core/checklist schema/派生/队列。
- 展示现有leaf checklist逐项text/stable ID及可操作勾选；显式动作只发既有 `task checklist toggle <taskId> <itemId> <true|false>`（这里参数是**目标态**，不是旧态），刷新后同一派生真源更新。父任务禁挂、无清单诚实空态、busy/失败不假勾。不得整数组覆盖、改legacy/status/manual或为本批加任意清单编辑器。
- AUTO最低：LG-04入口转绿、目标态命令正确、重复目标幂等、中文失败保实态、取消/浏览零写；原OP-GUI-01对应派生/人工/父汇总影响检查，受影响TaskForm与dirty guard回归。不重跑OP/AI全门。

### LG-05：导入

- 最小文件：`client/views/tasks.tsx`及真实组件→命令测试；确认串末尾加`confirm`，保原preview不带confirm、内容JSON不篡改；不改commands或CSV/XLSX解析器、不顺带扩文件格式。
- AUTO最低：同LG-05实际输入两条树应入库、preview0/confirm2、重进父子/code/负责人对应；cancel/非法样例0写；XLSX同入口确认后真实入库，busy防重复/失败保preview。文件名/模板问题未在本任务重开。

## 5. 精确 GUI 采证单（当前全部 NOT_RUN）

以下仅修复后Main在其自有隔离合法实例执行，不由本专家起服务。每例交source/产物/实际下发hash、开关、实体ID、视口主题、动作时间与录像/截图、实际命令脱敏结构、存储前后diff、控制台错误；录原生菜单，不借纯组件当GUI。

| ID / 关联原用例 | 初态与动作（不能自行改提交点） | 预期与原证 |
| --- | --- | --- |
| LG-G01 / RA-DR-09/10、RA-MENU-09/11/12 | A/B各合法任务与issue，A另risk；A会议有ai-001/ai-002。1440浅进会议→真实编辑会议→ai-001分别关联A task+issue→**只点主保存会议**→重进。深主题同ai-002走两个关联选择器。再清空两个关联→主保存→重进 | 同项目可选/可清；B与risk不混入issue候选；稳定ID不丢，合法链接持久；深层焦点可归还。不把本行保存冒主保存。负例可由Main受控adapter提供真实拒绝，不能改正式库 |
| LG-G01b / test-cases144、RA-MENU-10 | 已存ai-001标题/状态初值固定。改标题及状态→不点行内保存→**主保存会议**→重进；另显式新增行只填草稿后取消，重新进入新增行→主保存 | 主保存保存action变更；取消分支无新增/修改；新增真实ID只生成一次；失败不关层且旧值保持。记录会议字段和action实际分命令边界，不要求新原子全事务 |
| LG-G02 / RA-DR-08、RA-J02 | 空新会议→填标题日期/决议→**新增会议**→从会议页真实编辑刚创建ID→添加行动项→按明确action保存→重进→转任务确认→返回同ai-ID重复转 | 原分命令旅程成立；不要求未存会议有action入口。此单纠正本次RA-DR-08执行步骤，不回写其他专家文件，需协调专家采用；promote幂等仍原合同 |
| LG-G03 / 原T8参考行 | 项目/风险/交付物负责人普通输入自由填/清空→显式保存→重进；不要求popup、人员池或清单设计器 | 普通字段CRUD照验，popup选择条目记NOT_APPLICABLE；TaskForm原assignee datalist用例不受此收缩，不签T8全门 |
| LG-G04 / OP-GUI-01、RA-DR-35 | 合法leaf两项1/2、legacy40/status todo/manual30；父汇总另一leaf固定。TaskForm重开→Tab到未勾项→Space显式勾选→观察/重进；再次明确设false；再受控命令拒绝一次 | checklistID/text/目标态正确；客观50→100→50，manual仍30、status/legacy不变；父项目客观同源变化，待验收按原语义；失败不伪成功，无关记录零写；390長条目可达、滚动不丢主保存 |
| LG-G05 / RA-IM01 | 独立空项目选合法两层CSV→preview→cancel→查0条；重选同文件→**确认落盘**→重进WBS。XLSX合法样例同旅程；非法日期样例→preview | preview/cancel0写，confirm真实创建、父子编号/字段正确；无假success关层。记录实际命令是否带confirm及真实CSV/XLSX解析结果，不只截图“成功” |

## 6. 收口与继承

- 本报告签署者：独立测试专家（trae），只签冻结source/真实React组件与内存命令范围。运行装载、浏览器可见/布局/焦点/用户旅程未执行，均NOT_RUN；不是MANUAL_PENDING，不把Main-only误转给本人。
- 五项结果已回报；Main下一动作按上述三文件边界修确证缺陷、唯一隔离build、采LG-G01/01b/04/05及既有受影响旅程，再由专家审新候选。不实现owner popup、新建原子action或U4。
- 相关源改变使本报告对应旧证据失效；只按接缝复验，不沿同HEAD/version继承。其他任务在途成果不覆盖，尚未commit/push。

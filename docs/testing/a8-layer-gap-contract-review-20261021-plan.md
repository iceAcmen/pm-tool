# A8 五疑点合同核验计划

> 给 Main 与独立测试专家使用。先冻结本次具体用例，再执行 SOURCE/生产组件/纯命令验证；本文件不是 B8 总门或 GUI 判定。2026-10-21，平台 trae，角色独立测试专家。

## 1. 授权与边界

- 父任务：`reports/all-pending-acceptance-execution-20261021.md`，负责人授权按分工验完在途、最后普通 commit，尚不 push。
- 本子任务原句范围：核 explorer 已定位的五疑点是否属于已有承诺缺陷；仅写 `docs/testing/a8-layer-gap-contract-review-20261021*` 与自有 tmp；不改产品/其他 testing/living docs，不 build 共享 lib，不 GUI/service/credentials/commit。
- 当前 HEAD `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，主树脏候选由 Main 持续修复，不 pull/install/build。HEAD 不代替本轮冻结字节；执行前复制生产 src 到独立 tmp、记录哈希及 tracked diff、结束复核相关源漂移。
- 已读 AGENTS、collaboration §9/11、父任务、explorer MD。按 writing-plans 的先计划后执行方式工作，计划位置与动作以本次明确可写范围为准。
- 不重跑资料、文件、AI 或 OP 全门，不重复 81 层探索，不签 B8。原 U4 多排序/列偏好按本次明确指令排除；不引用其他报告把它们变成本批缺陷。

## 2. 具体用例（执行前冻结）

| ID | 对象与初态 | 步骤 / 真实提交点 | 预期及判定依据 |
| --- | --- | --- | --- |
| LG-01 | 默认 meetings records 编辑态；合法同项目会议与稳定 ai-001；含已有 taskId/riskIssueId | 核 panel→MeetingsView→RecordsMeetingForm 默认调用链；挂生产组件，枚举可操作关联输入/选择器；改变标题/状态→行动项本行保存；捕获真实 callbacks 工厂翻译的命令；对照关联值保留 | R8/ADL-025 与 R8 设计「同项目任务/问题下拉」「解除关联」及 B6-A04 要求旧 CRUD 不退化。不能用旧 ActionEditForm 未挂载源码证明默认可操作。若真实组件没有关联操作入口可签 SOURCE/组件有限 FAIL，GUI 仍 NOT_RUN |
| LG-01b | LG-01 同一稳定 ai-001、编辑已存会议 | 改行动项标题→仅点击主「保存会议」→生产 handler 回读；与本行保存正向控制比较 | 2026-10-21 22:48 补充原合同 `docs/test-cases.md:144`，明确主保存应提交 action 变更；下一轮执行前追加此断言，不把行内保存的新实现说明当负责人撤销旧承诺 |
| LG-02 | 新会议，尚无 meeting ID；另编辑已存会议 | 挂真实 RecordsMeetingForm 新建态，填合法日期/标题/决议，检查行动项新增入口与回调；编辑态追加本行并保存，捕获 add 命令；对照旧 R8 会议/action 分命令及当前 records 合同 | 判断是否有「首次会议主保存同时创建 action」的有效承诺；不把 RA-DR-08 新枚举步骤自动当新增原子创建需求。既有 CRUD 可在先建后编辑完成时，此疑点可 NOT_APPLICABLE；错误测试步骤在本报告澄清，不改原 testing |
| LG-03 | ProjectForm/RiskIssueForm/RecordsDeliverableForm owner 输入 | 核 T8 原验收 §0.3 与后续批准记录；核默认调用链/候选传参；检查实际 owner 输入及已有值/自由编辑提交（可执行的生产交付物组件） | T8-P0 仅 task assignee，owner 同款 datalist 明确 P1 不入门。无后续有效扩展承诺则候选 popup 缺失 NOT_APPLICABLE；不因截图/设计菜单枚举增功能 |
| LG-04 | 已存叶子任务合法两项清单，1/2；非空数组/稳定 item ID | 从生产 PmPanel 通过真实任务入口打开实际 TaskForm；枚举清单文本/checkbox/可执行动作；对照 OP-GUI-01「抽屉 toggle」；生产 handleTaskCommand 的 checklist add/toggle 仅作可用链反证 | ADL-050 与 OP-GUI-01 要求清单实际可勾选，不能只展示百分比。若实际抽屉缺已承诺 toggle，有限 SOURCE/组件 FAIL；不擅自扩大为全新清单编辑器/原子 bulk 替换。GUI 仍 NOT_RUN |
| LG-05 | 独立内存 domain 合法项目；合法 CSV 两层树；生产 TaskTable | 用环境 FileReader 提供真实 CSV 内容→调用生产 input.onChange/onload→真实 execute 调生产 handleTaskCommand dry-run；点击生产「确认落盘」调用 run→同生产 handler；对照末尾加 confirm 的正向控制；记录命令、任务数量、预览是否关闭 | ADL-043、OPT-12 verify-import-content、RA-IM01：preview 零写，confirm 真落盘。不得自行修 confirm 字符串再称实际 UI 通过。源码+真实组件→生产命令行为能确证时有限 FAIL；不称 GUI PASS |

## 3. 执行设施与证据

1. 只复用已装 Node 22 / pnpm 11.28.5 / vitest / react-test-renderer；无安装、无外网、无凭据。`rg` 不可用，改用 grep/find。
2. 自有 `/private/tmp/pmtool-a8-layer-gap-*` 复制生产 src，依赖只读链接；独立 vitest 配置 `cache:false`，输出/报告/tmp 全在自有目录；禁止主树 Vitest/Vite cache 写入。
3. 环境桩仅替代 window/document/FileReader/宿主传输，业务组件、callbacks、command handler、领域函数都用生产源；内存 domain 沿仓库已验模式，不代表真实 JSON 持久或浏览器。
4. 每例保执行脚本、stdout/stderr、外层 exit、冻结 source/合同 sha256、生产命令与观察；失败设施与产品反例分开报告。
5. 结论采用 SOURCE 有限 PASS/FAIL/NOT_APPLICABLE；尚待真实页面采证的 GUI 一律 NOT_RUN。FAIL 给 Main 文件级最小修复、影响回归、精确 GUI 动作；Main 唯一实现/采证，不由本专家改产品。

## 4. 状态

- [x] 读取规则、父任务及 explorer 定位。
- [x] 冻结五项具体测试步骤与判定边界。
- [x] 自有 tmp 前三轮执行并保原证；首轮缺依赖、二轮图标 opener/环境桩错误保留，不作产品 FAIL。
- [x] 补原主保存承诺的同接缝断言，执行最终独立副本：r4 七例3控制绿/4合同红，子进程exit1，非全绿。
- [x] 复核相关源漂移0，共享lib/cache WATCH前后相同；结果与最小修复/GUI合同已写同前缀主报告。

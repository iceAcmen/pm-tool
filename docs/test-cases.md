# MVP 测试与验收用例

> 适用版本：R1-R10（v0.1.0 基线 + 后续 R7/R8/R9/R10）。本文给开发者、验收人和后续接手平台使用；自动化脚本是回归依据，真实 dsh Web 是交付验收依据。

最后更新：2026-10-10（doubao-work：新增 R10 交付物用例，共 11 个 verify）

## 1. 测试环境

- macOS 15.6.1，Apple Silicon（arm64）
- nvm Node v22.23.3，pnpm 11.28.5
- dsh v0.2.1-alpha.2，专属 profile `pm`
- 插件目录：`~/Projects/dsh-pm/pm-tool/packages/dsh-pm-tool`
- 数据目录：`~/Projects/dsh-pm/pm-tool/data`（不入 git）
- 核心 CRUD 不配置 API Key

每个非交互 shell 先执行：

```sh
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm use 22 >/dev/null
```

## 2. 发布门禁

在插件目录执行：

```sh
pnpm install --offline --frozen-lockfile
pnpm run build
node scripts/verify-command.mjs
node scripts/verify-storage.mjs
node scripts/verify-projects.mjs
node scripts/verify-tasks.mjs
node scripts/verify-milestones.mjs
node scripts/verify-risk-issues.mjs
node scripts/verify-meetings.mjs
node scripts/verify-reports.mjs
node scripts/verify-deliverables.mjs
node scripts/verify-export.mjs
node scripts/verify-web.mjs
```

验收标准：

1. 每条命令退出码均为 0。
2. 构建生成 `lib/index.js` 与 `lib/client.js`。
3. `command/storage` 会更新真实 `data/pmtool/checks/selftest.json`；其余脚本使用系统临时目录，不污染业务数据。
4. 日志中的“验证用写入失败”和导出失败堆栈是故障注入负例；只有脚本最终非 0 才算失败。
5. 提交前执行 `git diff --check`，不得有空白错误。

## 3. 自动化覆盖矩阵

| 需求 | 脚本 | 关键覆盖 |
|---|---|---|
| R1 项目计划 | `verify-projects.mjs` | CRUD、日期、同名确认、删除确认、并发、失败恢复、重启读回、0700/0600 |
| R2 WBS | `verify-tasks.mjs` | 三级树、CRUD、移动、循环/跨项目保护、显式重编号、并发、重启读回 |
| R3 里程碑 | `verify-milestones.mjs` | CRUD、日期排序、达成一致性、任务关联与删除保护、重启读回 |
| R4 持久化/导出 | `verify-storage.mjs`、`verify-export.mjs` | 可读 JSON、Markdown/整库 JSON、排序、权限、覆盖确认、原子写与失败清理 |
| R5 Web | `verify-web.mjs` + 手动用例 | 快照、manifest、动态 bundle、主题 token、三类实体界面操作 |
| R6 离线命令 | `verify-command.mjs` 及各实体脚本 | 无 API Key、中文输出、真实命令处理器 |
| R7 风险与问题 | `verify-risk-issues.mjs`、`verify-web.mjs` + 手动用例 | CRUD、关闭、类型/状态筛选、专有字段、并发、故障恢复、项目删除保护、重启读回及 Web |
| R8 会议纪要 | `verify-meetings.mjs`、`verify-web.mjs` + 手动用例 | 会议/行动项 CRUD、稳定 ID、任务/问题关联、删除保护、并发、故障恢复、权限、重启读回及 Web |
| R9 进度汇报 | `verify-reports.mjs`、`verify-web.mjs` + 手动用例 | 自定义周期固定快照、五类异常聚合排序、旧快照不回写、人工字段更新、非法输入、Markdown、并发、删除保护、重启读回及 Web |
| R10 交付物管理 | `verify-deliverables.mjs`、`verify-web.mjs` + 手动用例 | 交付物 CRUD、状态筛选、版本/状态只增留痕规则、负责人变更不留痕、并发编号、写盘失败恢复、有交付物禁删项目、0600/0700、重启读回续号及 Web |
| R12 检索/看板/导入 | `verify-r12.mjs`、`verify-web.mjs` + 手动用例 | 检索跨类与 `--type` 过滤、空关键字/非法类型负例、统计全量/单项目口径与完成率/逾期/风险聚合、导入 dry-run 不写盘与 confirm 落盘、缩进→WBS、[x] 已完成、空清单/坏项目/坏路径负例、重启读回；Web 总览看板与全局搜索 bundle 契约 |

## 4. 手动 Web 验收

启动：

```sh
cd ~/Projects/dsh-pm/deepseek-harness
pnpm dsh --profile pm --no-open
```

打开终端打印的带 token URL，首次提示 API Key 时选择“稍后配置”，再点击左侧“项目管理”。

| ID | 操作 | 预期结果 |
|---|---|---|
| WEB-01 | 不配置 API Key 打开项目管理 | 页面正常加载，无模型凭据错误 |
| WEB-02 | 新建项目，填写负责人、日期、状态 | 顶部项目选择器出现新项目，刷新后仍在 |
| WEB-03 | 编辑项目名称和状态 | 标题与状态立即更新，重启后保留 |
| WEB-04 | 新建根任务、子任务和第三级任务 | WBS 编号与父子关系正确 |
| WEB-05 | 编辑任务负责人、状态、优先级和进度 | 表格行与分组同步更新 |
| WEB-06 | 新建里程碑并关联任务 | 里程碑表可见，任务显示关联 |
| WEB-07 | 将里程碑标记为已达成 | 状态为已达成且实际日期有效 |
| WEB-08 | 删除仍有关联任务的里程碑 | 明确阻止并提示先解除关联 |
| WEB-09 | 尝试删除有任务/里程碑的项目 | 明确阻止，不产生孤儿记录 |
| WEB-10 | 搜索、状态筛选、状态分组 | 表格结果与条件一致 |
| WEB-11 | 打开新增/编辑抽屉后关闭 | 焦点和页面状态正常，无数据误写 |
| WEB-12 | 在 dsh 设置切换浅色/深色/跟随系统 | 表格、标签、输入框和抽屉同步切换 |
| WEB-13 | 收窄窗口 | 页面根容器不横向溢出；宽表仅在表格区域滚动 |
| WEB-14 | 打开浏览器控制台 | 当前构建无 error；网络中 `client.js` 正常加载 |
| WEB-15 | 新增一条风险和一条问题 | 风险显示概率/应对，问题显示解决方案，刷新后仍在 |
| WEB-16 | 编辑问题并将状态改为已关闭 | 表格状态更新为“已关闭”，重启后保留 |
| WEB-17 | 使用类型、状态筛选和搜索 | 结果只包含符合条件的记录 |
| WEB-18 | 在抽屉中确认删除风险或问题 | 确认后记录删除；项目下仍有记录时项目删除被阻止 |
| WEB-19 | 点击顶部「总览看板」 | 出现跨项目统计卡片（项目总数/任务完成率/逾期项/未关闭风险）与逐项目明细，逾期项高亮 |
| WEB-20 | 在看板搜索框输入关键字 | 跨项目分组命中任务/里程碑/风险/会议/汇报/交付物，点击可跳转所属项目 |
| WEB-21 | 收窄看板窗口 | 逐项目卡片单列排布，无横向溢出 |

## 5. 离线命令冒烟

可在 dsh 输入框整行执行：

```text
/pm ping
/pm project list
/pm task list <projectId>
/pm milestone list <projectId>
/pm risk-issue list <projectId> all all
/pm search 需求
/pm search 需求 --type task
/pm stats
/pm stats <projectId>
/pm task import <projectId> 任务表.md
/pm task import <projectId> 任务表.md confirm
/pm export markdown <projectId>
/pm export json
```

预期：

- 输出简体中文，命令不触发模型调用。
- `search`/`stats` 为只读、不写盘；`task import` 不带 `confirm` 只预览，带 `confirm` 才落盘。
- 导出文件分别位于 `exports/<projectId>-report.md` 和 `exports/pmtool-backup.json`。
- 已有导出文件不带 `confirm` 时拒绝覆盖。

## 6. 数据与迁移检查

1. `data/pmtool/projects|tasks|milestones|risk_issues/<id>.json` 一条记录一文件，可直接阅读。
2. 目录权限为 0700，记录文件为 0600。
3. 关闭并重启 dsh 后记录仍可读取。
4. 导出 JSON 不包含 `checks` 自检记录。
5. 不允许两个 dsh 宿主同时写同一个 `data` 目录。

## 7. 当前验收结论

- 自动化：冻结锁文件离线安装、构建与十二个验证脚本已通过（R12 新增 verify-r12.mjs，R10 新增 verify-deliverables.mjs）。
- Web：项目所有者于 2026-10-10 确认 R5 手动验收通过。
- R7 Web：隔离 profile 完成新增、编辑关闭、筛选、搜索、确认删除和重启读回；浅/深主题、786px 窄屏局部滚动、控制台和网络检查通过。
- R8 Web：隔离 profile 完成项目、任务、问题、会议及行动项新增，验证关联、完成状态、筛选、搜索、深色主题、786px 横向滚动和重启读回；控制台和网络无错误。
- R8 行动项表单：所有控件不得超出抽屉内行动项容器；新增或编辑行动项后直接点击“保存会议”，重开抽屉应读回行动项变更。
- R9 固定快照：生成第一份报告后修改源任务，旧报告指标不变；新生成报告反映最新状态；编辑人工摘要不改变快照。
- R9 Markdown：默认只含摘要、聚合、周期事件和异常项，不输出完整任务明细；覆盖须 `confirm`。
- R9 Web：生成/编辑/筛选/搜索/导出可用，深色主题、786px 表格局部滚动、重启读回、控制台和网络检查通过。
- R10 留痕：创建产生一条 `created`；仅当状态或版本实际变化时追加留痕（同批先状态后版本各一条），仅改负责人/名称/位置等不留痕；删除交付物须 `confirm`，有交付物的项目禁止删除。
- R10 Web：交付物标签新增/编辑/状态筛选/搜索/变更时间线可用，项目栏显示交付物计数，深色主题、窄屏、重启读回待所有者本机目视确认（自动化 bundle 契约已通过）。
- R12 检索/看板：`/pm search` 跨七类实体不区分大小写命中、`--type` 过滤正确；`/pm stats` 完成率/逾期/未关闭风险按严重度聚合口径与 verify-r12 一致；导入 dry-run 不写盘、confirm 按缩进还原 WBS 父子、`[x]` 落为已完成，重启读回正确。
- R12 Web：顶部「总览看板」跨项目统计卡片、逐项目明细与全局搜索为浏览器端基于 snapshot 的派生，bundle 契约（verify-web）已通过；本机目视（卡片/搜索交互/窄屏）待所有者确认。
- **Chrome 139 无头 CDP 自动目视（2026-10-11，doubao-work，macOS arm64 / Chrome 139.0.7258.155 / dsh v0.2.1-alpha.2）**：按 KB-032 用 puppeteer-core 驱动本机已装 Chrome（headless，不另装 Chromium、不要辅助功能授权），隔离 DSH_HOME + 富种子 + 随机端口 + 无 Key，对 R5/R7/R8/R9/R10/R12 做真实点击：侧栏进入面板、七个 ViewTab 逐屏渲染、项目切换、总览看板统计卡片数值（项目总数 2 / 任务完成率 40% / 逾期 1 / 未关闭风险 4，与种子一致）、全局搜索跨类分组命中、新增交付物→编辑抽屉→删除确认弹窗取消（记录仍在）→confirm 删除（记录消失）、浅色与深色均对比可读、786px 与 390px 整页无横向溢出（表格内部局部横滚）。**结果 27/27 用例通过，0 console error / 0 pageerror / 0 失败请求 / 0 同源 4xx-5xx**。期间修了一处窄屏体验：`.pm-view-tab` 加 `white-space:nowrap; flex:0 0 auto`，使 390px 下视图标签单行、标签条内部横滚而非中文断行。
- **R13/R14/R15 真实 openrouter/free 端到端（2026-10-11，doubao-work，凭据库启动、无环境变量）**：
  - R13 `/pm task wbs p-0005 <企业官网改版目标>` → AI 产出 5 级 WBS，confirm 落盘 25 个任务（t-0003~t-0027，需求梳理/视觉设计/前后端开发/测试验收/上线 及 1.1~5.4 子任务）。✅
  - R14 `/pm report narrate p-0005` confirm → rpt-0002，executiveSummary 为依据确定性数字（0/25 完成、0%）撰写的中文叙述，数字未被改动。✅
  - R15 `/pm meeting summarize p-0005 <周会速记>` confirm → mtg-0001，解析出 议题3/决议2/行动项3（ai-001 张三、ai-002 李四、ai-003 王二）。✅
  - 无环境变量重启后 task/meeting/report list 均读回上述内容；验证后临时项目 p-0005 及关联数据已删净。约 4~5 次真实模型调用（免费档按次计，<50/天）。
  - 已知限制：免费池偶发 `This operation was aborted`/超时，重试即恢复（已归一中文 MODEL_TIMEOUT，KB-036）；斜杠命令在 Web 须点发送按钮、不能回车（KB-036）；任务删除不级联、需叶子→根逐层删（ISS-025）。
- 未覆盖：Windows/Linux、Safari/Firefox（按 ADL-033 本期不支持，仅承诺 Chrome）、多个宿主并发写、超大数据量性能、上游 dsh 新版本兼容性（升级冒烟流程见 ADL-034）。

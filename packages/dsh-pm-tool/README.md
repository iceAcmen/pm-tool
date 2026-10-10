# dsh-pm-tool（项目管理工作台插件）

> 这个目录是什么、给谁用、怎么用：它是本项目自研的 **DeepSeek Harness（dsh）插件包**，在 dsh 之上提供面向项目经理的能力（项目计划、WBS 任务拆解、里程碑、可读文件存储）。给开发与迁移者阅读；按本文命令即可构建并装载到本地 dsh。

- 当前阶段：R1–R9 已完成并推送；R9 由 trae 实现、doubao-work 独立复核（冻结安装/构建/十项 verify/隔离真实宿主）通过，本机浏览器目视项以所有者手动确认为准。下一步 R10。
- 运行环境：macOS 15.6.1 arm64 + Node v22.23.3（nvm）+ pnpm 11.28.5；上游 dsh 基线 **v0.2.1-alpha.2**（MIT）。

## 当前能力

- `/pm ping`：离线连通性自检，不依赖模型或 API Key。
- `/pm selftest`：经 `@deepseek-ai/dsh-storage-domain` + `dsh-storage-json` 写入并读回一条记录，落为可读 JSON。
- `/pm project add/list/get/update/delete`：项目增删改查，中文输出，无需配置模型。
- `/pm task add/list/get/update/delete/move/renumber`：WBS 任务增查改删、移动与显式重新编号，支持至少三级父子结构。
- `/pm milestone add/list/get/update/delete`：里程碑增查改删与按目标日期查看项目时间线。
- `/pm risk-issue add/list/get/update/delete`：风险与问题统一台账、关闭及类型/状态筛选。
- `/pm meeting add/list/get/update/delete` 与 `meeting action add/update/delete`：会议纪要、稳定行动项及任务/问题关联。
- `/pm report generate/list/get/update/delete/export`：自定义周期固定快照、异常汇总与精简 Markdown。
- `/pm export markdown <projectId> [目录] [confirm]`：导出项目、WBS 和里程碑 Markdown 报告。
- `/pm export json [目录] [confirm]`：导出整库业务数据包（不含 checks）。

## 项目命令（在 dsh 对话输入框整行输入）

```text
/pm project add {"name":"PM 上线计划","description":"完成首版交付","owner":"Ice","status":"planning","startDate":"2026-10-10","targetDate":"2026-10-31","tags":["MVP","客户 A"]}
/pm project list
/pm project get p-0001
/pm project update p-0001 {"owner":"史冰冰","status":"active","targetDate":"2026-11-15"}
/pm project delete p-0001
/pm project delete p-0001 confirm
/pm task add {"projectId":"p-0001","title":"需求确认"}
/pm task add {"projectId":"p-0001","parentId":"t-0001","title":"访谈用户"}
/pm task list p-0001
/pm task get t-0001
/pm task update t-0001 {"status":"in_progress","progress":30}
/pm task move t-0002 t-0004
/pm task move t-0002 t-0004 confirm
/pm task delete t-0002
/pm task delete t-0002 confirm
/pm task renumber p-0001
/pm task renumber p-0001 confirm
/pm milestone add {"projectId":"p-0001","title":"首版发布","targetDate":"2026-12-31"}
/pm milestone list p-0001
/pm milestone get m-0001
/pm milestone update m-0001 {"status":"achieved","achievedDate":"2026-12-30"}
/pm milestone delete m-0001
/pm milestone delete m-0001 confirm
/pm risk-issue add {"projectId":"p-0001","type":"risk","title":"供应商延期","impact":"high","probability":"medium","responsePlan":"准备备选供应商"}
/pm risk-issue add {"projectId":"p-0001","type":"issue","title":"测试环境不可用","impact":"critical","solution":"联系运维修复"}
/pm risk-issue list p-0001 all open
/pm risk-issue get ri-0001
/pm risk-issue update ri-0001 {"status":"closed"}
/pm risk-issue delete ri-0001 confirm

/pm meeting add {"projectId":"p-0001","title":"项目周会","meetingDate":"2026-10-10"}
/pm meeting list p-0001 all
/pm meeting action add mtg-0001 {"title":"完成验收","owner":"Ice","taskId":"t-0001"}
/pm meeting action update mtg-0001 ai-001 {"status":"done"}
/pm meeting action delete mtg-0001 ai-001 confirm
/pm report generate p-0001 2026-10-01 2026-10-31 {"title":"十月进度汇报","executiveSummary":"总体可控"}
/pm report list p-0001 all
/pm report get rpt-0001
/pm report update rpt-0001 {"status":"final","nextPlans":["完成验收"]}
/pm report export rpt-0001
/pm report delete rpt-0001 confirm
/pm export markdown p-0001
/pm export markdown p-0001 ./my-reports
/pm export markdown p-0001 ./my-reports confirm
/pm export json
/pm export json ./my-backups confirm
```

新增成功会返回实际 ID；后续命令请使用返回的 ID（`p-0001` 是空库的首个 ID）。删除不带 `confirm` 只返回项目摘要和确认命令，不会写盘；带 `confirm` 才删除。`/pm project` 显示帮助。

| 新增字段 | 输入约定 |
|---|---|
| `name` | 必填非空文本，首尾空白会去除，正文大小写保留 |
| `startDate`、`targetDate` | 必填真实日历日期 `YYYY-MM-DD`；`targetDate` 不得早于 `startDate` |
| `description`、`owner` | 文本；省略时为空字符串 |
| `status` | `planning` / `active` / `paused` / `done` / `archived`；省略时为 `planning` |
| `tags` | 可选文本数组，例如 `["MVP","客户 A"]` |

`add` 后使用完整 JSON 对象，`update <id>` 后使用只含待改字段的 JSON 片段（英文双引号）。`id`、`createdAt`、`updatedAt` 由系统维护；未知字段、空更新、类型错误、不存在或先后颠倒的日期均在写盘前拒绝。

项目名称会去除首尾空白后做区分大小写的精确比较。新增同名项目、或把项目实际改名为已有名称时默认阻止；确认确需重名，可在原 `add` / `update` 命令末尾追加 `confirm`。已获准重名的项目更新其他字段时不会重复要求确认。

数据经 `ctx.storageDomain` 落到 `data/pmtool/projects/<id>.json`，格式为 `{ "version": 1, "record": {...} }`，一条项目一文件。列表枚举表，不维护 `index.json`；保留旧 `checks` 表。新增表不改变既有自检记录格式，无需迁移。

Web 端通过侧栏“项目管理”进入顶级面板；采用高密度表格工作台，颜色、字体及字号跟随 dsh 原生主题，支持顶部项目切换、任务/里程碑/风险问题表格、项目概览、搜索筛选、状态分组和右侧新增/编辑抽屉，无需 API Key。项目有任务、里程碑或风险问题时禁止删除。当前仍为单用户、单宿主进程使用，禁止多个宿主同时写同一数据目录。

任务新增时系统生成全局短 ID、同级 `order` 和 WBS 编号（如 `1`、`1.2`、`1.2.1`）。默认 `parentId:null`、状态 `todo`、优先级 `P1`、进度 `0`；项目和父任务必须存在且属于同一项目。`milestoneId` 可关联同项目已存在里程碑，更新时用 `null` 解除关联。`update` 可用 `null` 清空可选日期，但不能直接修改项目、父任务、编号和系统字段。删除、移动与重新编号必须带 `confirm` 才写盘；有子任务时禁止删除父任务，移动不能跨项目或形成循环。

里程碑新增要求项目、标题和目标日期；默认状态 `planned`、实际达成日期 `null`、说明为空。状态支持 `planned / at_risk / achieved / missed`，由用户手动维护；`achieved` 必须填写 `achievedDate`，其他状态必须为 `null`。删除必须带 `confirm`，有关联任务时禁止删除。列表按目标日期升序、同日按 ID 排序；到期提醒第一版不做。

风险与问题共用 `data/pmtool/risk_issues/<id>.json`，以 `type=risk|issue` 区分。状态为 `open / monitoring / closed`，影响为 `low / medium / high / critical`；风险必须填写 `probability` 和可选 `responsePlan`，问题使用 `solution` 且概率固定为 `null`。创建后不能修改项目或类型，删除必须带 `confirm`。

进度汇报写入 `data/pmtool/reports/<id>.json`。日期范围筛选周期会议和里程碑，任务统计取生成瞬间当前状态；快照生成后不可修改，源数据变化不会改写旧报告。默认 Markdown 只含摘要、聚合指标、周期事件和异常项，不包含完整任务明细。

Markdown 导出默认写入产品仓库 `exports/<projectId>-report.md`；相对目录也以产品仓库为基准，绝对目录和 `~/` 可直接指定。报告包含项目概览、按真实父子关系展开的 WBS 和按日期排序的里程碑。已有文件默认拒绝覆盖，末尾加 `confirm` 才原子覆盖；报告不写入 storage-domain，JSON 始终是唯一数据源。

整库 JSON 默认写入 `exports/pmtool-backup.json`，包含格式版本、导出时间和按 ID 排序的 projects/tasks/milestones，不包含 checks 自检数据；覆盖规则与 Markdown 相同。为保持 v0.1.0 格式稳定，R7 的 risk_issues、R8 的 meetings 和 R9 的 reports 暂未加入该导出。

## 从源码构建

```sh
# 运行环境：macOS + nvm Node v22.23.3 + pnpm 11.28.5
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 22 >/dev/null
cd ~/Projects/dsh-pm/pm-tool/packages/dsh-pm-tool
pnpm install        # 安装类型依赖（dsh 包固定 0.2.1-alpha.2，cordis ~4.0.5-alpha.1）
pnpm run build      # 产物输出到 lib/（不入库）
node scripts/verify-command.mjs
node scripts/verify-storage.mjs
node scripts/verify-projects.mjs
node scripts/verify-tasks.mjs
node scripts/verify-milestones.mjs
node scripts/verify-risk-issues.mjs
node scripts/verify-meetings.mjs
node scripts/verify-reports.mjs
node scripts/verify-export.mjs
node scripts/verify-web.mjs
```

八个脚本应退出码 0。command/storage 写入 `data/pmtool/checks/selftest.json`；业务与 Web 脚本使用独立系统临时目录。

项目脚本验证真实插件处理器与真实 JSON 后端：增删改查、日期与同名校验、confirm 防误操作、旧表兼容、并发写入不覆盖、落盘可读性与 0700/0600 权限、全新进程读回更新/删除结果及编号接续。输出中的“验证用写入失败”为主动注入的预期错误，用来验证失败后队列恢复。命令验证不代表 R5 Web 管理界面完成。

任务脚本覆盖三级任务树、更新与日期清空、确认删除、父任务保护、跨项目/循环移动拒绝、移动后保留编号、显式重新编号、并发新增和全新进程读回。

里程碑脚本覆盖增查改删、状态一致性、任务关联保护、时间线排序、并发编号、写入失败恢复、项目删除保护、权限和全新进程读回。

风险问题脚本覆盖增查改删、关闭、类型/状态筛选、类型专有字段、并发编号、写入失败恢复、项目删除保护、权限和全新进程读回。

进度汇报脚本覆盖自定义周期、固定快照、异常聚合、人工字段更新、精简 Markdown、并发编号、失败恢复、项目删除保护、权限和全新进程读回。

导出脚本覆盖内容与排序、Markdown 转义、默认路径定位、0700/0600、覆盖保护、confirm 原子覆盖、空项目和失败清理。

Web 脚本覆盖只读快照、`dsh.client` manifest 和动态 bundle 契约；真实页面验收需启动 pm profile 后点击侧栏“项目管理”。

## 装载到本地源码版 dsh（web profile 的派生 profile：pm）

```sh
cd ~/Projects/dsh-pm/deepseek-harness
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 22 >/dev/null

# 1) 基于 web 模板创建专属 profile（首次会启动，看到启动后可 Ctrl-C）
pnpm dsh --profile pm --from-default-profile web

# 2) 以 link 方式装入本插件（源码运行官方支持 link:<绝对目录>，复用 checkout 的依赖）
pnpm dsh plugin --profile pm add link:/Users/bytedance/Projects/dsh-pm/pm-tool/packages/dsh-pm-tool

# 3) 检查配置树，确认 pm-tool 已生效
pnpm dsh --profile pm --dump-config

# 4) 启动（指定 --profile 后不要再加 app 动词 web；加 --no-open 可不弹浏览器）
#    终端会打印带一次性 token 的 URL，浏览器打开后点击侧栏“项目管理”
pnpm dsh --profile pm
```

> 改动本包源码后需重新 `pnpm run build` 并重启 dsh。

## 目录

```
dsh-pm-tool/
├── package.json        # 插件清单与 dsh.bundle 声明
├── tsconfig.json       # 独立 ESM/NodeNext 编译配置
├── tsdown.config.ts    # 浏览器动态 client bundle 构建
├── cordis.patch.yml    # 组合包补丁：激活本插件，复用现有 pm profile 存储配置
├── src/index.ts        # 插件入口：注册 /pm 命令、打开存储领域
├── src/client/         # 项目管理顶级面板与侧栏入口
│   ├── panel.tsx       # 工作台结构、标签页与交互
│   └── panel.css       # dsh 原生主题 token 与容器响应式布局
├── src/core/project.ts  # Project schema 与字段提示
├── src/core/task.ts     # Task schema、枚举与字段提示
├── src/core/milestone.ts # Milestone schema、状态与字段提示
├── src/core/risk-issue.ts # RiskIssue schema、枚举与类型专有字段
├── src/core/meeting.ts # Meeting/MeetingAction schema 与稳定 ID
├── src/core/storage.ts  # 统一 pmtool 领域（checks + projects + tasks + milestones + risk_issues）
├── src/core/projects.ts # 项目增删改查与领域统一写队列
├── src/core/tasks.ts    # 任务管理、关系校验、移动与 WBS 编号
├── src/core/milestones.ts # 里程碑增查与时间线排序
├── src/core/risk-issues.ts # 风险问题 CRUD、筛选和编号
├── src/core/meetings.ts # 会议、行动项 CRUD 与跨表关联保护
├── src/core/progress-reports.ts # 固定快照聚合与进度汇报 CRUD
├── src/core/progress-report-markdown.ts # 摘要与异常项 Markdown
├── src/core/report.ts   # 项目/WBS/里程碑 Markdown 渲染
├── src/core/export.ts   # 导出路径、覆盖保护与原子写入
├── src/commands/project.ts # 命令解析与中文输出
├── src/commands/task.ts # WBS 任务命令解析与中文输出
├── src/commands/milestone.ts # 里程碑命令解析与中文输出
├── src/commands/risk-issue.ts # 风险问题命令解析与中文输出
├── src/commands/meeting.ts # 会议纪要与行动项命令
├── src/commands/progress-report.ts # 进度汇报命令与导出
├── src/commands/export.ts # Markdown 导出命令
├── scripts/verify-projects.mjs # 项目增删改查与重启验证
├── scripts/verify-tasks.mjs # 任务完整回归、并发编号与重启验证
├── scripts/verify-milestones.mjs # 里程碑增查、排序与重启验证
├── scripts/verify-risk-issues.mjs # 风险问题完整回归与重启验证
├── scripts/verify-meetings.mjs # 会议、行动项、关联和重启验证
├── scripts/verify-reports.mjs # 固定快照、异常与 Markdown 验证
├── scripts/verify-export.mjs # Markdown 内容、路径与覆盖验证
├── scripts/verify-web.mjs # Web 快照、manifest 与 bundle 验证
├── scripts/verify-command.mjs  # 命令自检
├── scripts/verify-storage.mjs  # 存储自检
├── locale/{en,zh}.json # 界面展示标题/描述
└── lib/                # 构建产物（不入库）
```

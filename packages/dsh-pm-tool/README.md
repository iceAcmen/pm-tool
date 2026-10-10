# dsh-pm-tool（项目管理工作台插件）

> 这个目录是什么、给谁用、怎么用：它是本项目自研的 **DeepSeek Harness（dsh）插件包**，在 dsh 之上提供面向项目经理的能力（项目计划、WBS 任务拆解、里程碑、可读文件存储）。给开发与迁移者阅读；按本文命令即可构建并装载到本地 dsh。

- 当前阶段：R1/R2/R3 离线核心功能完成；R4 已实现单项目 Markdown 报告导出。
- 运行环境：macOS 15.6.1 arm64 + Node v22.23.3（nvm）+ pnpm 11.28.5；上游 dsh 基线 **v0.2.1-alpha.2**（MIT）。

## 当前能力

- `/pm ping`：离线连通性自检，不依赖模型或 API Key。
- `/pm selftest`：经 `@deepseek-ai/dsh-storage-domain` + `dsh-storage-json` 写入并读回一条记录，落为可读 JSON。
- `/pm project add/list/get/update/delete`：项目增删改查，中文输出，无需配置模型。
- `/pm task add/list/get/update/delete/move/renumber`：WBS 任务增查改删、移动与显式重新编号，支持至少三级父子结构。
- `/pm milestone add/list/get/update/delete`：里程碑增查改删与按目标日期查看项目时间线。
- `/pm export markdown <projectId> [目录] [confirm]`：导出项目、WBS 和里程碑 Markdown 报告。

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
/pm export markdown p-0001
/pm export markdown p-0001 ./my-reports
/pm export markdown p-0001 ./my-reports confirm
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

当前限制：整库 JSON 打包和 Web 管理界面尚未实现，R5 最后开发。项目有任务或里程碑时禁止删除。单用户、单宿主进程使用，禁止多个宿主同时写同一数据目录。

任务新增时系统生成全局短 ID、同级 `order` 和 WBS 编号（如 `1`、`1.2`、`1.2.1`）。默认 `parentId:null`、状态 `todo`、优先级 `P1`、进度 `0`；项目和父任务必须存在且属于同一项目。`milestoneId` 可关联同项目已存在里程碑，更新时用 `null` 解除关联。`update` 可用 `null` 清空可选日期，但不能直接修改项目、父任务、编号和系统字段。删除、移动与重新编号必须带 `confirm` 才写盘；有子任务时禁止删除父任务，移动不能跨项目或形成循环。

里程碑新增要求项目、标题和目标日期；默认状态 `planned`、实际达成日期 `null`、说明为空。状态支持 `planned / at_risk / achieved / missed`，由用户手动维护；`achieved` 必须填写 `achievedDate`，其他状态必须为 `null`。删除必须带 `confirm`，有关联任务时禁止删除。列表按目标日期升序、同日按 ID 排序；到期提醒第一版不做。

Markdown 导出默认写入产品仓库 `exports/<projectId>-report.md`；相对目录也以产品仓库为基准，绝对目录和 `~/` 可直接指定。报告包含项目概览、按真实父子关系展开的 WBS 和按日期排序的里程碑。已有文件默认拒绝覆盖，末尾加 `confirm` 才原子覆盖；报告不写入 storage-domain，JSON 始终是唯一数据源。

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
node scripts/verify-export.mjs
```

六个脚本应退出码 0。command/storage 写入 `data/pmtool/checks/selftest.json`；业务脚本使用独立系统临时目录。

项目脚本验证真实插件处理器与真实 JSON 后端：增删改查、日期与同名校验、confirm 防误操作、旧表兼容、并发写入不覆盖、落盘可读性与 0700/0600 权限、全新进程读回更新/删除结果及编号接续。输出中的“验证用写入失败”为主动注入的预期错误，用来验证失败后队列恢复。命令验证不代表 R5 Web 管理界面完成。

任务脚本覆盖三级任务树、更新与日期清空、确认删除、父任务保护、跨项目/循环移动拒绝、移动后保留编号、显式重新编号、并发新增和全新进程读回。

里程碑脚本覆盖增查改删、状态一致性、任务关联保护、时间线排序、并发编号、写入失败恢复、项目删除保护、权限和全新进程读回。

导出脚本覆盖内容与排序、Markdown 转义、默认路径定位、0700/0600、覆盖保护、confirm 原子覆盖、空项目和失败清理。

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
#    终端会打印带一次性 token 的 http://127.0.0.1:3080 URL，浏览器打开后输入 /pm ping
pnpm dsh --profile pm
```

> 改动本包源码后需重新 `pnpm run build` 并重启 dsh。

## 目录

```
dsh-pm-tool/
├── package.json        # 插件清单与 dsh.bundle 声明
├── tsconfig.json       # 独立 ESM/NodeNext 编译配置
├── cordis.patch.yml    # 组合包补丁：激活本插件，复用现有 pm profile 存储配置
├── src/index.ts        # 插件入口：注册 /pm 命令、打开存储领域
├── src/core/project.ts  # Project schema 与字段提示
├── src/core/task.ts     # Task schema、枚举与字段提示
├── src/core/milestone.ts # Milestone schema、状态与字段提示
├── src/core/storage.ts  # 统一 pmtool 领域（checks + projects + tasks + milestones）
├── src/core/projects.ts # 项目增删改查与领域统一写队列
├── src/core/tasks.ts    # 任务管理、关系校验、移动与 WBS 编号
├── src/core/milestones.ts # 里程碑增查与时间线排序
├── src/core/report.ts   # 项目/WBS/里程碑 Markdown 渲染
├── src/core/export.ts   # 导出路径、覆盖保护与原子写入
├── src/commands/project.ts # 命令解析与中文输出
├── src/commands/task.ts # WBS 任务命令解析与中文输出
├── src/commands/milestone.ts # 里程碑命令解析与中文输出
├── src/commands/export.ts # Markdown 导出命令
├── scripts/verify-projects.mjs # 项目增删改查与重启验证
├── scripts/verify-tasks.mjs # 任务完整回归、并发编号与重启验证
├── scripts/verify-milestones.mjs # 里程碑增查、排序与重启验证
├── scripts/verify-export.mjs # Markdown 内容、路径与覆盖验证
├── scripts/verify-command.mjs  # 命令自检
├── scripts/verify-storage.mjs  # 存储自检
├── locale/{en,zh}.json # 界面展示标题/描述
└── lib/                # 构建产物（不入库）
```

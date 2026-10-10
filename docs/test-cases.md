# MVP 测试与验收用例

> 适用版本：R1-R7（v0.1.0 基线 + 未发布 R7）。本文给开发者、验收人和后续接手平台使用；自动化脚本是回归依据，真实 dsh Web 是交付验收依据。

最后更新：2026-10-10（trae / TRAE）

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

## 5. 离线命令冒烟

可在 dsh 输入框整行执行：

```text
/pm ping
/pm project list
/pm task list <projectId>
/pm milestone list <projectId>
/pm risk-issue list <projectId> all all
/pm export markdown <projectId>
/pm export json
```

预期：

- 输出简体中文，命令不触发模型调用。
- 导出文件分别位于 `exports/<projectId>-report.md` 和 `exports/pmtool-backup.json`。
- 已有导出文件不带 `confirm` 时拒绝覆盖。

## 6. 数据与迁移检查

1. `data/pmtool/projects|tasks|milestones|risk_issues/<id>.json` 一条记录一文件，可直接阅读。
2. 目录权限为 0700，记录文件为 0600。
3. 关闭并重启 dsh 后记录仍可读取。
4. 导出 JSON 不包含 `checks` 自检记录。
5. 不允许两个 dsh 宿主同时写同一个 `data` 目录。

## 7. 当前验收结论

- 自动化：冻结锁文件离线安装、构建与八个验证脚本已通过。
- Web：项目所有者于 2026-10-10 确认 R5 手动验收通过。
- R7 Web：隔离 profile 完成新增、编辑关闭、筛选、搜索、确认删除和重启读回；浅/深主题、786px 窄屏局部滚动、控制台和网络检查通过。
- 未覆盖：Windows/Linux、Safari/Firefox、多个宿主并发写、超大数据量性能、上游 dsh 新版本兼容性。

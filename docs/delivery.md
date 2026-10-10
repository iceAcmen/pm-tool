# MVP 交付说明

> 本文是 pm-tool 的安装、启动、演示、备份和限制说明。产品仓库是唯一事实来源，上游 dsh 只读。

最后更新：2026-10-10（trae / TRAE）

## 1. 交付范围

已交付：

- R1 项目计划：项目新增、查看、编辑、确认删除。
- R2 WBS：至少三级任务、编辑、移动、确认删除、显式重新编号。
- R3 里程碑：增删改查、时间排序、任务关联和达成状态。
- R4 存储与导出：人类可读 JSON、项目 Markdown、整库 JSON。
- R5 Web：dsh 顶级项目管理面板，高密度表格、右侧抽屉、宿主主题跟随。
- R6 离线命令：无 API Key 可使用 `/pm` 完成核心操作。
- R7 风险与问题：统一台账、离线 CRUD、关闭、筛选、持久化和 Web 抽屉。
- R8 会议纪要：离线 CRUD、稳定行动项、任务/问题关联、删除保护和 Web 抽屉。
- R9 进度汇报：自定义周期固定快照、异常汇总、精简 Markdown、离线命令和 Web 抽屉。

未纳入本次：

- R10 交付物台账。
- R11 到期提醒。
- 生成型 AI 功能、多人协作、多宿主并发写、导入 Excel/Markdown。

## 2. 交付清单

| 类型 | 路径 |
|---|---|
| 插件源码 | `packages/dsh-pm-tool/src/` |
| 构建与依赖 | `packages/dsh-pm-tool/package.json`、`tsconfig.json`、`tsdown.config.ts` |
| 回归脚本 | `packages/dsh-pm-tool/scripts/verify-*.mjs` |
| 使用说明 | `packages/dsh-pm-tool/README.md` |
| 测试用例 | `docs/test-cases.md` |
| 环境恢复 | `docs/handoff.md` 第 3 节 |
| 需求与约束 | `docs/requirements.md`、`docs/decision-log.md` |
| 数据目录 | `data/`，本机生成且不入 git |
| 默认导出目录 | `exports/`，可再生且不入 git |

已发布基线为 Git tag `v0.1.0`；R7 已推送，R8 当前为未提交改动，状态见 `docs/onboarding-prompt.md`。

## 3. 环境要求

- macOS 15.6.1，Apple Silicon（已验证）
- nvm Node v22.23.3
- pnpm 11.28.5
- dsh v0.2.1-alpha.2 源码位于 `~/Projects/dsh-pm/deepseek-harness`
- 产品仓库位于 `~/Projects/dsh-pm/pm-tool`

加载 Node：

```sh
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm use 22
```

## 4. 构建与验证

```sh
cd ~/Projects/dsh-pm/pm-tool/packages/dsh-pm-tool
pnpm install --frozen-lockfile
pnpm run build

for script in scripts/verify-*.mjs; do
  node "$script"
done
```

全部命令须退出码 0。详细覆盖和负例日志解释见 `docs/test-cases.md`。

## 5. 首次装载

先按 `docs/handoff.md` 第 3 节准备上游。然后：

```sh
cd ~/Projects/dsh-pm/deepseek-harness

# 首次创建 pm profile；启动成功后可按 Ctrl-C
pnpm dsh --profile pm --from-default-profile web

# 挂载本地插件
pnpm dsh plugin --profile pm add \
  link:/Users/bytedance/Projects/dsh-pm/pm-tool/packages/dsh-pm-tool
```

编辑 `~/.dsh/profiles/pm/cordis.patch.yml`，确保包含：

```yaml
- id: storage-json
  name: '@deepseek-ai/dsh-storage-json'
  config:
    root: /Users/bytedance/Projects/dsh-pm/pm-tool/data
```

检查组合配置：

```sh
pnpm dsh --profile pm --dump-config
```

配置中应包含 `dsh-pm-tool`，且 `storage-json.config.root` 指向产品仓库 `data`。

## 6. 日常启动

先构建插件，再启动宿主：

```sh
cd ~/Projects/dsh-pm/pm-tool/packages/dsh-pm-tool
pnpm run build

cd ~/Projects/dsh-pm/deepseek-harness
pnpm dsh --profile pm --no-open
```

打开终端打印的 `http://127.0.0.1:<端口>/?token=...`。如果 3080 被占用，先关闭已有 dsh 实例，或使用 CLI 支持的其他端口。不要绑定 `0.0.0.0`。

进入后：

1. API Key 提示选择“稍后配置”。
2. 点击左侧“项目管理”。
3. 从顶部切换项目，在任务、里程碑、风险与问题、会议纪要、进度汇报和项目概览间切换。

## 7. 推荐演示流程

1. 新建一个项目，设置负责人、起止日期和状态。
2. 新建三级 WBS，编辑负责人、优先级和进度。
3. 新建里程碑，将任务关联到该里程碑。
4. 展示搜索、筛选、分组和右侧编辑抽屉。
5. 新增风险与问题，将问题改为已关闭，再按类型/状态筛选。
6. 在 dsh 设置切换浅色/深色主题。
7. 生成一份固定快照进度汇报，修改源任务后对比新旧快照，再导出精简 Markdown。
8. 执行项目 Markdown 和整库 JSON 导出。
9. 重启 dsh，确认数据仍在。

## 8. 数据备份与恢复

推荐先通过命令生成数据包：

```text
/pm export json
```

输出：`exports/pmtool-backup.json`。

当前版本尚未实现自动导入。完整本机迁移时：

1. 停止 dsh，避免复制过程中写入。
2. 备份整个 `pm-tool/data/`。
3. 在目标机恢复到同一目录并保持仅当前用户可读写。
4. 重新构建插件、检查 profile 后启动。
5. 执行 `/pm project list` 和手动 Web 冒烟。

不要把含真实业务内容的 `data/` 或 API Key 提交到 git。

## 9. 已知限制

- 仅支持单用户、单宿主进程写同一数据目录。
- 当前没有数据导入命令；JSON 数据包用于备份、审阅和后续迁移实现。
- v0.1.0 的整库 JSON 导出格式尚未包含 R7 风险问题、R8 会议纪要和 R9 进度汇报；完整迁移请备份整个 `data/`。
- dsh Web 只支持本机 loopback 安全访问，不提供局域网远程访问。
- 插件使用 `link:`，源码变更后必须重新构建并重启 dsh。
- 上游固定为 v0.2.1-alpha.2；升级前需重新验证 manifest、动态 bundle 和主题 token。
- 生成型能力未实现，不需要也不会读取模型 API Key。
- R9 尚未接 schedule、AI 自动撰写或 PDF；任务没有状态事件历史，不能推断“本周期完成任务”。

## 10. 常见问题

### 端口已占用

出现 `EADDRINUSE 127.0.0.1:3080` 表示已有进程占用端口。关闭原有 dsh 终端实例后重试；不要启动多个宿主共同写同一数据目录。

### 页面没有项目管理入口

在插件目录重新运行 `pnpm run build`，再重启 dsh；然后用 `pnpm dsh --profile pm --dump-config` 确认 `dsh-pm-tool` 已激活。

### 页面空白或 bundle 激活失败

先运行 `node scripts/verify-web.mjs`。该脚本检查 client manifest、动态模块包装、内嵌 CSS 和客户端外部依赖。

### 数据未落在产品仓库

检查 `~/.dsh/profiles/pm/cordis.patch.yml` 中 `storage-json` 的 `root`，并用 `--dump-config` 查看最终值。

## 11. 验收状态

- R1-R9 自动化完整回归：通过（构建 + 十个验证脚本）。
- R5 真实界面手动验收：项目所有者于 2026-10-10 确认通过。
- profile 配置：包含 `dsh-pm-tool`，存储根目录指向 `pm-tool/data`。
- 真实宿主：隔离 profile 成功加载插件并启动随机端口；带 token 页面 HTTP 200，boot roster 包含 `dsh-pm-tool/client.js`。
- 阶段 4 MVP 测试与交付：通过；Windows/Linux、其他浏览器和上游升级兼容性仍为未覆盖边界。
- R7 真实浏览器：隔离 profile 下 CRUD、筛选、重启读回、浅/深主题及 786px 窄屏通过。
- R8 真实浏览器：隔离 profile 下会议/行动项 CRUD、任务/问题关联、筛选、深色主题、786px 窄屏和重启读回通过。
- R9 真实浏览器：隔离 profile 下新旧固定快照对照、编辑、导出、筛选、深色主题、786px 窄屏和重启读回通过。

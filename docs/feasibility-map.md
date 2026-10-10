# dsh 能力可行性地图 feasibility-map.md

> 本文件记录「dsh 现有能力 → 本项目管理工具需求」的复用/新建判断与技术依据；给阶段 3 开发选型使用，读完即可知道每个功能该站在 dsh 哪个扩展点上做。信息基于上游官方仓库 master（基线 **v0.2.1-alpha.2**）的官方文档与包 README，每条标注置信度与来源。
>
> 同名飞书云文档（排版增强版，仅作阅读便利，**迁移以本 Markdown 为准**）：<https://bytedance.larkoffice.com/docx/Xv73d04Kco8ppJxrrhfcYdNLn5g>

- 文档状态：阶段 2 调研结论（2026-10-10）
- 置信度标记：**【官方明确】** 官方文档/README 直接写明；**【源码推断】** 据包结构与描述合理推断，阶段 3 需验证；**【待确认】** 官方未给第三方接入示例，需开发期做技术验证（spike）。

## 一、总体判断

dsh **没有**拿来即用的「项目管理成品」：其 `plan / todo / goal` 都是**会话内（session-scoped）**的智能体行为（服务于一次对话的规划、待办、目标），不是跨会话、跨项目持久的项目档案。但 dsh 提供了搭建本工具所需的**全部地基**：类型化文件存储、用户命令、模型工具、Web 界面插槽、定时提醒、交付物声明、技能与文档转换。因此路线是——**上游只读、以独立外挂插件包实现 PM 业务实体**，不改框架一行代码。

## 二、逐功能「复用 vs 新建」对照

| PM 功能 | dsh 现有能力（包） | 现有能力本质 | 本项目判断 |
|---|---|---|---|
| 项目计划 | `packages/plan/plan-mode`（`/plan`、用户评审后退出） | 智能体单次任务的「规划模式」，计划经人评审才生效；非持久项目档案 | **借鉴后新建**：学其「评审后生效」理念，项目计划实体用存储域自建 |
| WBS 任务拆解 | `packages/todo/tool-todo`（`todo_write`，基于会话事件日志） | 会话级待办清单（TodoItem + 事件），随对话存在 | **借鉴后新建**：学其「条目 + 事件」模式，WBS 需跨会话持久、支持父子层级，用存储域自建 |
| 里程碑 | `packages/goal/*`（ctx.goals 生命周期 + `/goal` 命令 + 模型工具） | 每会话一个目标的状态机（创建/暂停/恢复/完成/阻塞） | **借鉴后新建**：学其生命周期状态机与「命令 + 工具」双入口，里程碑实体持久化到文件 |
| 风险与问题管理 | 无直接对应包 | —— | **全新自研**：基于存储域定义 Risk/Issue 实体，用命令/工具/界面暴露 |
| 会议纪要 | 无直接业务包；可借 `session`（对话记录）、`skill`（模板）、`document`（导出） | 会话日志可作素材，Office 技能可成稿 | **全新自研**：纪要实体 + 模板生成；智能归纳属生成型能力（P1，需模型） |
| 进度汇报（周报/月报） | `packages/schedule`（持久定时提醒，可周期触发）+ `session`/存储数据 | schedule 负责「到点触发」，报告内容需自行汇总生成 | **触发复用、内容新建**：用 schedule 做周期触发，报告实体与渲染自建；智能汇报属 P1 生成型 |
| 交付物管理 | `packages/deliverables`（`tool-present` 交付声明 + `workspace-changes` git 快照变更 + Web 轮尾渲染） | 声明「本轮交付了哪些工作区文件」并记录 git 变更 | **高度复用 + 轻扩展**：直接复用交付声明/变更记录，补一层项目维度的交付物台账（P1） |

辅助可复用能力：

| 能力 | 包 | 用途 |
|---|---|---|
| 技能/模板 | `packages/skill`（`skill-filesystem`、`skill-office` 含 Word/PPT/Excel） | PM 工作流指令模板；后续导入/导出 Office |
| 文档转 PDF | `packages/document/office-to-pdf` | 报告/计划导出 PDF |
| 附件 | `packages/attachment`（内容寻址本地存储） | 交付物/纪要附件 |
| 后台任务 | `packages/jobs`（ctx.jobs） | 批量导入、报告生成等长任务 |

## 三、数据存储（对应已确认决策：人类可读文件）

- dsh 存储四件套【官方明确，来源：`packages/storage/*/README.zh.md`】：
  - `@deepseek-ai/dsh-storage`：存储中枢（`ctx.storage`），注册具名后端；
  - `@deepseek-ai/dsh-storage-domain`：**领域数据形态（`ctx.storage.domain`）**——带 schema 校验、可发变更事件的类型化键值域，**这是定义 Project/Task/Milestone 等实体的正确位置**；
  - `@deepseek-ai/dsh-storage-json`：**JSON 文件后端（后端名 `json`）**，在配置的 `root` 目录下把领域数据存为**美化打印、可读可编辑的 JSON**；默认 `single` 布局每个单元一份 `<unit>.json`，另有 `per-record` 每条记录一文件；原子写入、目录权限 `0o700`、记录键名限 `[a-zA-Z0-9_-]+`；
  - `@deepseek-ai/dsh-storage-sqlite`：SQLite 后端（数据量大/高并发时备选，单用户 MVP 不需要）。
- 会话数据默认走 `session-persistence-jsonl`（`session.vN.jsonl[.zstd]`），属对话日志，**不应用来存项目业务数据**。
- **本项目选型**：`storage-domain`（schema 校验）+ `storage-json`（可读 JSON 落盘），把 `root` 指向产品仓库内的数据目录，使数据天然可读、可被 git 版本管理、可迁移；在此之上**渲染 Markdown 概览/报告**满足「人类可读 + 汇报导出」。
- 配置形态（官方 README 示例）：

  ```yaml
  - name: '@deepseek-ai/dsh-storage'
  - name: '@deepseek-ai/dsh-storage-json'
    config:
      root: /path/to/pm-tool/data   # 必填，JSON 文件根目录
  - name: '@deepseek-ai/dsh-storage-domain'
    config:
      backend: json
  ```

## 四、Web UI 扩展（对应已确认决策：先做 Web 界面）

官方明确支持四条界面扩展路径【官方明确，来源：`docs/cookbook/adding-a-settings-card.zh.md`、`extension-cookbook.zh.md`、`adding-a-package.zh.md`】：

1. **设置卡片**：插件用 Config schema（schemastery `z.object`，含 Volatile 易失字段）声明配置表单，`form.state/form.mutate` 读写；
2. **插件详情页插槽**：`ctx.slots.inject('plugins.detail.actions' | 'plugins.detail.badge' | 'plugins.detail.section')` 向他人/本插件页面注入按钮、徽标、区块；
3. **对话业务节点 / 工具卡片**：`ConversationNodeDefinition` + `conversation.chat.node` 键控渲染器；工具用 `presentCall/presentResult` 出卡片；
4. **浏览器半侧（client 插件）**：`package.json` 声明 `dsh.client`（含 platform/inject）并导出 `./client`（lazy-CJS factory，用官方 `clientBundle` tsdown preset）。

- **【待确认】** 第三方包「新增一个独立顶级页面（如专属『项目管理』页）」的接入方式：内置包有页面先例，但 cookbook 未写第三方完整示例。阶段 3 先做一次技术验证；**MVP 落地策略**：优先用「设置卡片 + 插件详情区块 + 工具卡片」组合出可视化界面（官方路径稳妥、可演示），独立顶级页面作为增强项。

## 五、工具与命令（双入口设计的依据）

- **模型工具**：`defineTool`（类型化）或 JSON Schema `ToolDefinition`，经 `ctx.tools.register(...)` 注册；参数 schema **自动进入系统提示词**、自动校验；支持 `output.schema/render`、UI 卡片、后台任务（`ctx.jobs.start`）。来源：`docs/cookbook/adding-a-tool.zh.md`。
- **用户命令**：经 `ctx.commands` 注册斜杠命令，**由人直接触发、不消耗模型轮次**（`/goal` 即官方范例）。来源：`docs/cookbook/extension-cookbook.zh.md`、`packages/goal/command-goal`。

## 六、离线能力（对应已确认决策：离线优先）

- **【官方明确】** 用户命令（`ctx.commands`）、存储域增删改查（Host 侧服务，不向模型暴露）、定时提醒，在**完全不配置 API Key** 时也能运行；官方开发文档亦说明无 Key 时真实 API 的端到端测试自动跳过。
- **强依赖模型**的部分：模型工具被智能体实际调用、以及一切内容生成（智能 WBS 建议、纪要归纳、周报撰写）。
- **设计结论**：MVP 的结构化增删改查全部走「**人操作的斜杠命令 + Web 表单（离线可用）**」；模型工具/生成能力作为 P1 在线增强，需 Key 时才启用。

## 七、第三方插件形态与装载

- 包结构遵循 `adding-a-package`：`packages/<组>/<包>/`（`package.json`、`tsconfig.json`、`src/index.ts`、`locale/en.json`+`zh.json`、`README.md`）；`package.json` 不变式：`private:true`、版本与根一致、`type:module`、`main: lib/index.js`、`cordis` 同时在 peer/devDependencies；Host 包用 `tsconfig.host.json`、Client 包用 `tsconfig.client.json`。
- 装载：profile（`$DSH_HOME/profiles/<name>`，含 package.json + dsh.profile manifest + `cordis.patch.yml`）组合插件；配置叠加顺序为 组合包 patch → profile patch → home 级 patch → `--patch`；插件依赖经 `dsh plugin --profile <name> <pnpm 参数>` 安装；可用 `dsh --profile web --dump-config` 查看生效配置树。
- **本项目落地形态（阶段 3 细化并先报备）**：在独立仓库 `pm-tool` 内自研一个（或一组）dsh 插件包 + 一个**专属 profile** 来挂载；本地以工作区依赖/`file:` 方式被 dsh 引用，后续可选择发布为 npm 包（打 `dsh-plugin` topic）。
- **【待确认】** 本地未发布包被 dsh profile 装载的具体联调细节，阶段 3 首个开发任务即验证此链路。

## 八、对需求的直接影响（结论）

- MVP（项目计划 / WBS / 里程碑 / 保存导出）**全部可在离线、无 Key 条件下实现并演示**，数据为可读 JSON + 渲染 Markdown，界面走官方稳妥的卡片/插槽路径。
- 风险问题、会议纪要、进度汇报、交付物台账顺延 P1/P2，其中生成型能力（智能拆解、纪要、周报）预留工具接口、按需接模型。
- 阶段 3 需优先做两个小验证（不阻塞需求定稿）：① 第三方 Web 界面的可达形态；② 独立仓库插件包被本地 dsh profile 装载的链路。

## 九、主要来源

- 架构与扩展点：<https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/architecture.zh.md>
- Cookbook：<https://github.com/deepseek-ai/deepseek-harness/tree/master/docs/cookbook>（adding-a-package / adding-a-tool / adding-a-settings-card / extension-cookbook 的 `.zh.md`）
- 存储：`packages/storage/storage-json/README.zh.md`、`packages/storage/storage-domain/README.zh.md`
- 相关包：`packages/plan/plan-mode/README.zh.md`、`packages/todo/README.zh.md`、`packages/goal/README.zh.md`、`packages/deliverables/README.zh.md`、`packages/schedule/README.zh.md`、`packages/session/README.zh.md`、`packages/skill/README.zh.md`
- CLI/profile 装载：`apps/cli/README.zh.md`

# 共享事实包（FACTS ONLY · 禁止从中推导视角，只提供事实）

> 本文件只列经过核验的事实与路径，不给任何「应该往哪个方向做」的视角或结论。
> 本轮为**纯设计探讨**：不得修改任何代码、配置、依赖；唯一交付物是设计文档。

## 1. 两个仓库（均可直接读源码）

- 插件仓库（产品本体）：`/Users/bytedance/Projects/dsh-pm/pm-tool`
  - 插件包：`packages/dsh-pm-tool`（name `dsh-pm-tool`，**v0.7.4**，private，MIT）
  - 文档：`docs/`（含 `feasibility-map.md` 能力可行性地图、`tech-plugin-scaffold.md` 插件骨架、`requirements.md`、`changelog.md`、`product/`、`design/` 等）
- 宿主仓库（dsh = DeepSeek Harness，代号 Cordis 框架，上游只读）：`/Users/bytedance/Projects/dsh-pm/deepseek-harness`
  - 能力包：`packages/<组>/<包>/`，每个包组根目录有 `README.zh.md`（中文导览，建议直接读）
  - 应用：`apps/cli`、`apps/desktop`、`apps/desktop-host`、`apps/web`
  - 插件运行器：`packages/extensions/{cordis-host-runner,cordis-client-runner,tool-cordis,ui-cordis}`
- **禁止阅读**（防止被上一轮结论锚定）：
  - `pm-tool/docs/design/deep-integration-brainstorm-20261017.md`
  - `pm-tool/docs/design/forward-design-proposal-20261017.md`

## 2. 现状：pm-tool 是什么

定位：面向项目经理的桌面/本地 Web 工作台（dsh 宿主里的一个独立插件）。已实现的业务能力（见 `packages/dsh-pm-tool/src/`）：

- 实体：project（项目）、task（任务/WBS 父子树、甘特图、关键路径）、milestone（里程碑）、risk-issue（风险与问题）、meeting（会议纪要）、progress-report（周报/月报固定快照 Markdown）、deliverable（交付物，四态状态机、只增 history）、people（人员负载）
- 命令：`/pm ...` 斜杠命令族（project/task/milestone/risk-issue/meeting/report/deliverable/search/stats/health/doctor/due/backup/model/dashboard/settings/ask），**由人直接触发、不消耗模型轮次**
- AI 能力（在线增强）：`/pm ask`（AI 生成建议，带 provenance 溯源、apply/undo/recheck）、suggestion-engine、wbs-ai、external-skill-router
- Web UI：独立业务面板（`src/client/`：nav-rail、board 基于 react-grid-layout、overview/tasks/gantt/milestones/people/risk-issues/meetings/reports/deliverables 视图）、自带 panel.css、design tokens、字体
- 数据：人类可读、美化打印的 JSON 文件，落盘在产品仓库数据目录，可被 git 管理；provenance-store（溯源）；backup
- 有 doctor 自检、verify-isolation 脚本、完整测试

## 3. 现状：与宿主的「接入面」（已核验，事实）

- Host 侧入口 `src/index.ts`：`export const inject = ['commands', 'storageDomain']`
  - Cordis 语义：inject 中每个服务是**必需依赖**，缺失则 fiber 停在 INACTIVE
  - `llm` **不**列入 inject（无 Key profile 也要激活）；运行期 `ctx.reflect.get('llm', false)` 懒读，缺失则中文 NO_LLM 降级
- 对等依赖：`@deepseek-ai/cordis ~4.0.5-alpha.1`、`dsh-commands / dsh-llm / dsh-storage / dsh-storage-domain 0.2.1-alpha.2`
- 存储：`storage-domain`（带 schema 校验、可发变更事件的类型化键值域）+ `storage-json`（JSON 文件后端）；另有 sqlite 后端备选
- Client 注入（`package.json` 的 `dsh.client`，platform=web）：
  - `@deepseek-ai/dsh-api-remotes/client`（仅类型导入）
  - `@deepseek-ai/dsh-api-session-controller/client`（`ISessions`，仅类型导入）
  - `@deepseek-ai/dsh-client-ui-layout/client`（`MainPanelId`）
  - `@deepseek-ai/dsh-client-ui-sidebar/client`（仅类型导入）
- 装载：`cordis.patch.yml` 以 bundle patch 形式 `- insert: - id: pm-tool` 激活；本地 link 装载，改代码需重新 build 并重启
- 已核验的「隔离」事实（grep 结果）：
  - Host 侧 `src/core`、`src/commands` 中**没有任何事件订阅**（无 `ctx.on(...)`）——即无事件流接入
  - 业务 UI 为自己的独立面板/样式，不依赖宿主会话渲染
  - 官方文档已明确的扩展路径：设置卡片、插件详情页插槽（`plugins.detail.*`）、对话业务节点/工具卡片（`ConversationNodeDefinition`、presentCall/presentResult）、浏览器半侧 client 插件
- 工具注册机制：`defineTool` / `ctx.tools.register(...)`，参数 schema 自动进系统提示词、自动校验，支持 output schema/render、UI 卡片、后台任务

## 4. 宿主已有、但 pm-tool 基本未使用的能力（事实清单，按官方 README 定位）

| 包组 | 官方定位（README 原意） | 关键性质 |
|---|---|---|
| `session` | 持久会话数据平面：持久化 seam/后端、检查点策略、投影、基于日志的标题、外发会话遥测 | 会话日志 `session.vN.jsonl` |
| `context` | 不定义工具、为每次请求添加**持久且模型可见**的上下文 | 模型可见上下文 |
| `plan` | 引导 agent 先探索设计再执行的「计划模式」（`/plan`，用户评审后退出/生效） | **会话内**规划行为，非跨会话项目档案 |
| `goal` | 每会话一个持久完成目标 + 模型工具 + 用户命令 + 自动续行 | **会话级**目标状态机 |
| `todo`（tool-todo） | 会话级待办清单（TodoItem + 事件，基于会话事件日志） | **会话级**，随对话存在 |
| `jobs` | 后台任务：注册表约定、进程本地存储、面向模型的任务工具（`ctx.jobs`） | 长任务 |
| `schedule` | Host 拥有的**持久定时提醒**与任务管理，可周期触发 | 到点触发 |
| `mcp` | 连接外部 MCP 服务器，调用其工具、读取其资源 | 外部工具生态 |
| `subagent` | 委派 seam、进程内/进程外后端、面向模型的委派工具 | 多智能体 |
| `workflow` | 由模型编写、可扇出 subagent 的编排脚本 | 智能体编排 |
| `skill` | 技能/模板（skill-filesystem、skill-office 含 Word/PPT/Excel） | 工作流模板 |
| `guard` | 循环卫生：重复工具提醒、单次工具调用超时 | 行为护栏 |
| `interaction` | 斜杠命令、一次性审批、权限预设、运行中 agent 暂停等待人类决定的问答 seam | 人机协作 |
| `deliverables` | 记录每轮交给用户的内容：显式文件交付 + 观察到的工作区改动（git 快照、绑定 agent 轮次） | 轮次交付留痕 |
| `compaction` | 会话压缩：自动压缩、`/compact`、工具输出修剪 | 上下文管理 |
| `telemetry` | 遥测传输插件 | 观测 |
| `document` | 含 office-to-pdf 等文档转换 | 导出 |
| `attachment` | 内容寻址的本地附件存储 | 附件 |
| 其他 | `browser-use`、`computer-use`、`sandbox`、`shell`、`terminal`、`ssh`、`lsp`、`feedback`、`identity`、`credentials`、`settings`、`preset`、`spill`、`workspace`、`fs`、`host`、`sdk`、`acp`、`api`、`boot`、`bundle`、`core`、`client`、`web`、`ptc-runtime` 等 | — |

> 重要既有判断（来自 `docs/feasibility-map.md`，2026-10-10 阶段2 调研结论）：dsh 的 `plan/todo/goal` 都是**会话内（session-scoped）智能体行为**，不是跨会话、跨项目持久的项目档案；pm-tool 因此选择「上游只读、以独立外挂插件在 storage-domain 自建 PM 业务实体」。dsh 没有拿来即用的项目管理成品，但提供了类型化文件存储、用户命令、模型工具、Web 插槽、定时提醒、交付物声明、技能与文档转换等地基。

## 5. 硬约束与用户画像

- 硬约束：**纯探讨、不改任何代码**；上游 harness 仓库只读；产品一贯原则——离线优先（结构化增删改查无 Key 可用）、人类可读文件存储、不推翻现状、可逆。
- 用户画像：字节在职 PM；未来可能以个人开发者身份维护本产品；追求**国际领先**水准；厌恶空泛、low、口号式表达。
- 决策用途：本次脑暴产出将用于决定 pm-tool 与 dsh 宿主「深度融合」的产品方向与路线；阶段 0–2 先确认「方向空间是否有明显遗漏」，再进入对抗论证。
- 这是**重跑**：上一轮（v1，2026-10-17）失败的方法论原因是——视角被组织者预先设定、子智能体之间没有辩论、方案没有被论证。本轮在发散阶段**严禁预置任何视角框架**，不评分、不批评，想法池全部保留。

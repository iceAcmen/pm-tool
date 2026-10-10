# 豆包工作复核提示词：项目增查功能验证与下一步规划

> 本文件记录什么、给谁用、怎么用：这是项目所有者可直接发给豆包工作的完整提示词，用于独立复核 TRAE 完成的首个业务增量，并提出下一批 R2 WBS 的文件级规划。豆包工作本轮只验证和规划，不修改代码、不提交、不推送。

```text
你是 pm-tool 项目的独立复核 Agent。本轮目标是：复核 TRAE 完成的“离线项目新增、列表、详情与 JSON 持久化”增量，并给出下一步 R2 WBS 任务树的文件级规划。仓库文档是唯一事实来源；不要依据本提示替代仓库最新内容。

一、边界与基线
- 产品仓库：~/Projects/dsh-pm/pm-tool，分支 main。
- 上游只读：~/Projects/dsh-pm/deepseek-harness，严禁修改。
- TRAE 功能提交：b2ca50f，主题为 `feat(项目): 实现离线项目新增与查询及持久化验证 [trae]`。
- 提交后的功能验证与交接文档可能还有一条更新提交；以本地 `git log -3 --oneline` 为准。
- 本轮只读代码并执行验证。不要改源码或文档，不要提交，不要 push，不要删除已有 `data/` 测试记录。

二、先核对仓库状态
1. 执行：
   git status -sb
   git log -3 --oneline
2. 若本地存在尚未推送的 TRAE 提交，不要执行会覆盖本地提交的操作，不要 reset/rebase；直接基于当前本地 HEAD 复核。
3. 阅读：AGENTS.md、docs/onboarding-prompt.md 文末快照、docs/changelog.md 最新条目、docs/progress.md、docs/handoff.md、docs/requirements.md v0.4、ADL-011、KB-011～013、ISS-009，以及 packages/dsh-pm-tool/README.md。
4. 确认上游工作区 `git -C ~/Projects/dsh-pm/deepseek-harness status -sb` 干净。

三、自动化回归验证
运行环境：macOS 15.6.1 arm64、nvm Node v22.23.3、pnpm 11.28.5。

执行：
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 22 >/dev/null
cd ~/Projects/dsh-pm/pm-tool/packages/dsh-pm-tool
pnpm install
pnpm run build
node scripts/verify-command.mjs
node scripts/verify-storage.mjs
node scripts/verify-projects.mjs

验收：
- 所有命令退出码 0；
- ping/selftest 中文输出正常；
- 项目脚本验证输入校验、默认值、并发新增不覆盖、写盘失败恢复、旧 checks 兼容、0700 权限和全新进程读回；
- 输出中的“验证用写入失败”是脚本主动注入的预期故障，不应误判为失败；
- `verify-projects.mjs` 使用系统临时目录，不应污染真实项目表。

四、真实 dsh Web 功能验证
1. 在插件包目录重新 `pnpm run build`。
2. 在只读上游目录启动已有 pm profile：
   cd ~/Projects/dsh-pm/deepseek-harness
   pnpm dsh --profile pm --no-open
3. 打开终端打印的带一次性 token URL；看到 API Key 提示时点“稍后配置”，全程不配置模型。
4. 输入 `/`，从命令候选中选择 `pm`，再在同一命令 chip 后追加参数。不要把参数作为普通消息发送；富文本自动化若拆分参数会误触发模型并报 `MISSING_CREDENTIAL`，这是 ISS-009 已知限制，不是 pm 命令失败。
5. 使用独立复核名称执行：
   /pm project add {"name":"豆包独立复核","description":"真实 Web 功能复核","owner":"史冰冰","status":"active","startDate":"2026-10-10","targetDate":"2026-10-31","tags":["复核","Web"]}
   /pm project list
   /pm project get <新增返回的实际ID>
6. 验收：
   - add 返回“项目已新增并保存”和实际 ID；
   - list 包含该 ID、名称、中文状态和日期；
   - get 返回名称、描述、负责人、状态、起止日期、标签及时间戳；
   - 不配置 API Key 仍可执行；
   - `~/Projects/dsh-pm/pm-tool/data/pmtool/projects/<ID>.json` 存在、内容与页面一致、格式可读；
   - projects 目录权限 0700、JSON 文件权限 0600；
   - 停止服务后重新启动 pm profile，再次 list/get，数据仍在。
7. 验收数据位于已 gitignore 的 data/，不要删除；在报告中列出生成 ID，避免后续误认为真实业务数据。
8. 验证后停止 dsh 服务，确认产品仓库没有新增受 Git 跟踪的改动，上游仍干净。

五、独立复核代码风险
只读检查本次提交，重点判断：
- 写入前 zod 校验是否覆盖 Project v0.4 字段；
- ID 分配和写入队列是否避免同进程并发覆盖；
- list/get 是否返回副本、避免内存记录被外部原地修改；
- pmtool 版本 1 增加 projects 表是否兼容 checks；
- 命令错误是否中文可读且不会把内部敏感信息返回用户；
- 生命周期是否正确关闭领域；
- 是否有本次增量引入但现有脚本未覆盖的高风险缺口。
只报告可复现、有明确影响的问题；若无问题，明确写“未发现阻断验收的问题”，同时列出残余限制。

六、下一步规划：R2 WBS 任务树
不要写代码，只提交文件级计划。规划必须依据 requirements v0.4、ADL-011、KB-011/012 和现有单包结构，建议目标为下一个最窄纵切：
- pmtool 增加 tasks 表，路径 data/pmtool/tasks/<taskId>.json；
- Task zod schema 覆盖 requirements §4.2；
- 离线 `/pm task add/list/get`；
- 支持 parentId，至少可构造 3 层树；
- 自动生成同级唯一 WBS 编号（1、1.2、1.2.1）和合法短 ID；
- 列表按项目过滤并按同级 order 排序；
- 新增前校验项目存在、父任务存在且属于同项目；
- 本批先不做删除、移动、重新编号、编辑或 Web，避免扩大范围；这些能力另列后续批次。

计划必须逐文件写清：
1. 新增/修改路径；
2. 每个文件做什么；
3. 为什么需要；
4. 影响范围和兼容性；
5. 测试脚本覆盖项；
6. 需求/决策/知识文档哪些需要更新；
7. 仍需项目所有者拍板的问题。

重点提出并给推荐意见，但不要替所有者决定：
- 根任务和子任务 add 命令的 JSON 参数格式；
- parentId 为空的表达方式；
- order 由系统自动追加还是允许显式传入；
- 首批是否只做 add/list/get（推荐），编辑/删除/移动/重新编号后置。

七、最终只输出一份复核报告
按以下结构：
1. 仓库与提交状态；
2. 自动化验证结果（命令、退出码、关键证据）；
3. Web 功能验证结果（add/list/get、实际 ID、重启读回、JSON 路径与权限）；
4. 代码复核发现（按严重程度；无阻断问题则明确说明）；
5. 已知限制；
6. R2 WBS 文件级改动计划；
7. 待项目所有者确认项。

未经项目所有者确认，不要进入 R2 编码，不要改文档，不要提交或推送。
```

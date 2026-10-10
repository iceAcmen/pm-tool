# R8 会议纪要设计

## 目标与边界

R8 在现有 `dsh-pm-tool` 插件内增加离线会议纪要管理。首版支持手工录入、查看、编辑、筛选和删除会议纪要，并在纪要内维护议题、决议和行动项；行动项可以关联同项目已有任务或问题。

首版不调用模型、不读取会话内容、不自动创建任务，也不实现附件、通知和日历同步。后续可在配置 API Key 后增加智能归纳，并增加“行动项转 WBS 任务”，但不能为此破坏首版数据。

## 数据模型

会议纪要使用 `pmtool` 领域内的 `meetings` 表，一条纪要一个 JSON 文件：

```text
data/pmtool/meetings/mtg-0001.json
```

### Meeting

| 字段 | 类型 | 规则 |
|---|---|---|
| `id` | string | `mtg-0001` 形式，全局递增 |
| `projectId` | string | 必须指向已存在项目，创建后不可修改 |
| `title` | string | 必填非空 |
| `meetingDate` | date | 必填，真实 `YYYY-MM-DD` |
| `startTime` | string \| null | 可选 `HH:mm` |
| `durationMinutes` | int \| null | 可选，1–1440 |
| `location` | string | 线下地点或会议链接 |
| `facilitator` | string | 主持人 |
| `recorder` | string | 记录人 |
| `participants` | string[] | 参会人，去除空白和重复项 |
| `status` | enum | `draft` 草稿 / `final` 已定稿 |
| `summary` | string | 会议摘要 |
| `topics` | string[] | 议题列表 |
| `decisions` | string[] | 决议列表 |
| `actions` | MeetingAction[] | 内嵌行动项 |
| `sourceType` | enum | 首版固定 `manual`；预留 `session` |
| `sourceSessionId` | string \| null | 首版固定 `null`，预留会话来源 |
| `createdAt/updatedAt` | datetime | 系统维护 |

### MeetingAction

| 字段 | 类型 | 规则 |
|---|---|---|
| `id` | string | 纪要内稳定编号 `ai-001`，删除后不复用 |
| `title` | string | 必填非空 |
| `owner` | string | 负责人 |
| `dueDate` | date \| null | 可选截止日期 |
| `status` | enum | `todo` / `in_progress` / `done` / `cancelled` |
| `taskId` | string \| null | 可关联同项目已有 WBS 任务 |
| `riskIssueId` | string \| null | 只可关联同项目且 `type=issue` 的问题 |

行动项 ID 独立于数组下标。更新、删除和未来转任务都通过 `meetingId + actionId` 定位，避免数组排序变化破坏引用。

## 业务规则

1. 会议按 `meetingDate` 降序、同日按 ID 降序显示。
2. `projectId`、ID、来源字段和审计时间不可通过普通更新修改。
3. 行动项关联任务或问题时，目标必须存在且属于同一项目；`riskIssueId` 不接受风险记录。
4. 删除已被行动项关联的任务或问题时阻止删除，提示先解除会议行动项关联。
5. 删除会议必须带 `confirm`；项目下仍有会议时禁止删除项目。
6. 会议删除会随记录删除其内嵌行动项，不修改关联的任务或问题。
7. 首版允许行动项同时关联一个任务和一个问题，用于记录“该任务负责解决该问题”的会议结论。

## 命令设计

```text
/pm meeting add {JSON}
/pm meeting list <projectId> [all|draft|final]
/pm meeting get <meetingId>
/pm meeting update <meetingId> {JSON片段}
/pm meeting delete <meetingId> confirm

/pm meeting action add <meetingId> {JSON}
/pm meeting action update <meetingId> <actionId> {JSON片段}
/pm meeting action delete <meetingId> <actionId> confirm
```

会议 `add/update` 管理会议基础信息、议题和决议，不允许直接替换 `actions`；行动项只能通过 `meeting action` 子命令修改，避免客户端覆盖其他行动项。

未来增加而首版不实现：

```text
/pm meeting action promote <meetingId> <actionId> [parentTaskId|root] confirm
```

该命令将行动项转换为 WBS 任务，并把新任务 ID 回写到 `taskId`。若已有 `taskId` 则拒绝重复创建，保证操作幂等。首版稳定的行动项 ID、负责人、截止日期和状态字段可直接映射，无需迁移会议数据。

## Web 交互

项目工作台增加“会议纪要”标签页：

- 表格列：日期、标题、状态、主持人、参会人数、行动项完成数、更新时间。
- 工具栏：状态筛选、标题/摘要/参会人搜索、新增会议。
- 点击行或编辑按钮打开右侧抽屉。
- 抽屉上半部编辑会议基础字段、议题、决议；议题和决议使用可增删的紧凑文本列表。
- 抽屉下半部显示行动项列表，可新增、编辑、完成、解除关联和确认删除。
- 任务与问题关联使用下拉选择，仅列出当前项目记录。
- 删除会议使用浏览器确认并调用 Host `confirm` 命令。
- 窄屏继续使用局部滚动和右侧抽屉，颜色、字体和状态标签跟随 dsh 主题。

Web 只调用 Host 命令，不复制关联校验和编号规则。

## 错误处理与验收

所有输入使用 strict Zod schema。未知字段、非法日期/时间/状态、重复行动项 ID、不存在或跨项目关联、把风险当作问题关联等情况均拒绝写盘并返回中文错误。

验收标准：

1. 无 API Key 可完成会议和行动项 CRUD。
2. 行动项可关联同项目任务和问题，非法关联被拒绝。
3. 状态筛选、搜索、排序和行动项完成统计正确。
4. 删除确认、项目删除保护和关联对象删除保护生效。
5. 并发新增不重复编号，写入失败后队列可恢复。
6. JSON 可读，目录 0700、文件 0600，重启后完整读回。
7. Web 在浅色/深色和 786px 窄屏下可操作，控制台和网络无错误。
8. 现有全部验证脚本继续通过。

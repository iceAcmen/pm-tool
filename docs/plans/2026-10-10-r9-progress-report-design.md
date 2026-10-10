# R9 进度汇报设计

## 范围

R9 首版离线生成项目进度汇报，采用项目所有者确认的“自定义日期范围 + 固定快照 + Markdown 默认只含摘要和异常项”。不调用模型、不接 schedule、不导出 PDF；这些能力后续独立增强。

日期范围用于标识汇报周期，并筛选周期内会议和目标/达成日期落入周期的里程碑。现有任务没有状态变更历史，不能可靠推断“本周期完成”，因此任务统计取生成瞬间的项目全量当前状态，并在报告中明确“当前快照”。

## 数据模型

新增 `pmtool/reports/<reportId>.json`，ID 为 `rpt-0001`。

通用字段：

- `id`、`projectId`
- `title`
- `periodStart`、`periodEnd`
- `status`: `draft | final`
- `executiveSummary`
- `completedWork[]`、`nextPlans[]`、`blockers[]`
- `snapshotAt`
- `snapshot`
- `sourceType: manual`、`sourceSessionId: null`
- `createdAt`、`updatedAt`

`snapshot` 固定保存：

- 项目名称、负责人、状态、目标日期
- 任务总数、各状态数量、平均进度
- 里程碑总数、周期内里程碑
- 周期内会议数量与决议数
- 异常项：受阻任务、逾期未完成任务、有风险/错过里程碑、未关闭高/严重风险问题、逾期未完成会议行动项

生成后 `projectId`、日期范围、`snapshotAt`、`snapshot` 和来源字段不可修改；普通更新只允许标题、状态和人工撰写字段。项目有报告时禁止删除。

## 命令与导出

```text
/pm report generate <projectId> <periodStart> <periodEnd> {可选JSON}
/pm report list <projectId> [all|draft|final]
/pm report get <reportId>
/pm report update <reportId> {JSON片段}
/pm report delete <reportId> confirm
/pm report export <reportId> [目录] [confirm]
```

Markdown 默认写入 `exports/<reportId>-progress.md`，只含：

- 汇报基本信息
- 管理摘要
- 当前任务/里程碑/会议汇总
- 本周期里程碑和会议决议
- 人工填写的已完成事项、下期计划、阻塞项
- 异常项

不输出完整任务、风险和会议明细。已有文件默认拒绝覆盖，`confirm` 原子覆盖。

## Web

项目工作台新增“进度汇报”标签：

- 表格列：周期、标题、状态、总体进度、异常数、生成时间。
- 支持状态筛选、搜索、新建快照。
- 右侧抽屉创建时填写周期和人工摘要；编辑时日期范围及快照只读。
- 抽屉展示聚合指标和异常列表，提供保存、导出和确认删除。
- Web 只调用 Host 命令，不复制快照计算规则。

## 验收

无 API Key 可完成生成、查询、编辑人工字段、删除和 Markdown 导出；源数据修改后旧报告保持不变，新报告反映新状态；日期、项目和更新字段严格校验；并发编号、故障恢复、0700/0600、新进程读回、Web 浅深主题和 786px 窄屏全部验证。

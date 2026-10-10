# R7 风险与问题管理设计

## 目标与边界

R7 在现有 `dsh-pm-tool` 插件内增加离线风险与问题管理，不新建插件包、不修改上游。用户可在 `/pm risk-issue` 命令和项目管理 Web 面板中新增、查看、编辑、关闭、筛选和删除记录；全部操作不依赖 API Key。

本批只实现结构化管理，不实现模型生成、自动预警、通知、风险评分公式或任务关联。R7 数据暂不进入既有 Markdown/整库 JSON 导出，避免未经确认修改已发布的备份格式；后续可单独决策导出格式升级。

## 数据模型

风险与问题共用 `pmtool` 领域内的 `risk_issues` 表，一条记录一个 JSON 文件（storage-domain 表名仅允许小写字母、数字和下划线）：

```text
data/pmtool/risk_issues/ri-0001.json
```

通用字段：

- `id`：`ri-0001` 递增短 ID。
- `projectId`：所属项目。
- `type`：`risk` 或 `issue`。
- `title`、`description`、`owner`。
- `impact`：`low` / `medium` / `high` / `critical`。
- `dueDate`：可选日期，使用 `null` 清空。
- `status`：`open` / `monitoring` / `closed`。
- `createdAt`、`updatedAt`。

风险专有字段：`probability`（`low` / `medium` / `high`）和 `responsePlan`；问题专有字段：`solution`。为保持单表 JSON 稳定，专有字段始终存在：不适用的概率为 `null`，不适用的文本为空字符串。风险必须提供概率；问题必须将概率保持为 `null`。

## 行为与数据流

命令统一为：

```text
/pm risk-issue add {JSON}
/pm risk-issue list <projectId> [type=all|risk|issue] [status=all|open|monitoring|closed]
/pm risk-issue get <id>
/pm risk-issue update <id> {JSON片段}
/pm risk-issue delete <id> confirm
```

新增、更新、删除复用当前领域业务队列，确保 ID 分配、项目存在校验和项目删除保护不发生单宿主竞态。删除不带 `confirm` 只显示预览。项目仍有风险或问题时禁止删除，避免孤儿记录。

Web 快照增加 `riskIssues` 数组。项目面板新增“风险与问题”标签页，沿用现有高密度表格、搜索、类型/状态筛选和右侧抽屉，不引入新视觉体系；颜色、字体继续跟随 dsh 主题。新增和编辑都调用 Host 命令，不在浏览器复制业务校验。

## 错误处理与验收

所有输入使用 strict Zod schema；未知字段、非法枚举、无效日期、不存在项目和不适用字段组合均拒绝写盘并返回中文错误。核心验收：

1. 风险与问题均可新增、编辑、关闭、筛选和确认删除。
2. 重启后记录完整，编号继续递增。
3. 并发新增不覆盖；注入一次写失败后队列可恢复。
4. JSON 可读，目录 0700、文件 0600。
5. Web 无 Key 可完成基础 CRUD，主题和窄屏行为不退化。
6. 全部既有验证脚本继续通过。

# 数据备份 / 恢复与云同步指引（R18）

本文档给谁用：所有使用 pm-tool 的人。用途：在不依赖宿主云的前提下，离线把项目台账备份成 JSON、必要时恢复，以及如何把数据/备份放到 iCloud、坚果云等同步盘实现多设备查看。**只给指引，不擅自改变存储路径。**

## 1. 备份范围（重要）

- 只覆盖 pmtool 领域的七类实体：`projects / tasks / milestones / risk_issues / meetings / reports / deliverables`。
- **不包含**宿主 dsh 的会话/聊天数据、`checks` 自检表、以及任何 API 密钥（密钥本就不入库）。
- 备份为带时间戳与格式 manifest 的单个 JSON：`pmtool-backup-<时间戳>.json`，格式 `format:'pm-tool-backup'`、`formatVersion:1`。

## 2. 命令用法（离线）

```
/pm backup                 # 备份到仓库 backups/，输出文件绝对路径与各类计数
/pm backup ~/pm-backups     # 备份到指定目录
/pm restore backups/pmtool-backup-xxx.json        # 演练：只读校验、不落盘
/pm restore backups/pmtool-backup-xxx.json confirm   # 真正恢复
```

- 默认备份目录：产品仓库 `backups/`（已加入 `.gitignore`，不入库）。
- **恢复是两步操作**：先演练确认文件无误，再 `confirm`。
- **恢复前自动安全快照**：若当前库已有数据，系统会先在同目录自动写一份 `pmtool-backup-...` 再恢复，避免误覆盖。

## 3. Web 入口

项目管理面板头部「备份」按钮：一键生成备份并弹窗显示文件路径与各类计数。恢复因需指定本地文件路径，v1 通过斜杠命令完成。

## 4. 多设备同步（云同步，单写者）

把 `data/`（pmtool 实际存储）或 `backups/` 放到 iCloud / 坚果云等同步盘，即可在多台机器查看同一份台账。**务必遵守单写者原则**：

1. **同步前先关闭 dsh**，避免两端同时写造成文件冲突。
2. 不要在两台设备同时打开并写入同一台账。
3. 建议每天用 `/pm backup` 手动留一个时间戳快照，再同步整个 `backups/` 目录。
4. 从同步盘取回备份后，用 `/pm restore <文件> confirm` 恢复（会先自动存安全快照）。

> 本插件不擅自修改存储路径；若要把 `data/` 挪到同步盘，请由使用者自行配置 storage-json 的 root，并确保同一时刻只有一个 dsh 实例在写。

## 5. 常见问题

- **备份会不会包含密钥？** 不会。密钥（如 OpenRouter key）由宿主 credentials service / 环境变量管理，pmtool 领域不存密钥。
- **恢复后 ID 会乱吗？** 恢复按备份原样还原全部 ID；后续新增实体的编号基于当前已有最大 ID 自增，不会冲突。
- **误恢复怎么办？** 恢复前已自动生成安全快照，按该快照路径再 `/pm restore` 一次即可回退。

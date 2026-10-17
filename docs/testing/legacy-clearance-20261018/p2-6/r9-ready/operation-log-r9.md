# P2-6 r9 复测操作日志（2026-10-18，实例 http://127.0.0.1:3172/，PID 10819，生产 Key 车道）

> 时间为 CST（UTC+8）；磁盘 createdAt 为 UTC（=CST-8h）。全程未改代码、未重启实例、未删改任何既有记录。

| # | 时间 | 动作（真实 UI / 网络） | 结果 | 截图/证据 |
|---|------|------------------------|------|-----------|
| 1 | 03:5x | 写入前数据根核验：patch storage-json root + cwd + UI/磁盘任务数（22）一致；确认根为仓库内 gitignored dev 数据，非用户业务 | 可继续；O2 锚点不在此根，不触碰 | `disk-evidence.md` §1 |
| 2 | 03:5x | 直连 ark `chat/completions` 最小调用（deepseek-v4-1-flash-260910） | HTTP 200，补全「正常」，usage total=10 | `disk-evidence.md` §2.1 |
| 3 | 03:55 | 宿主 UI 进「项目管理」插件 → 打开「AI 副驾·内嵌」，确认生产 Key 车道 is-on | 面板正常，无 NO_ADAPTER | `shots/01-ask-diag.png` |
| 4 | 03:56 | 副驾输入两步诉求（新建任务 + 新建交付物，均带「P2-6 复测：」前缀、2026-10-25）并发送（真实模型调用） | 返回 1 步计划：新建交付物「P2-6 复测：AI 溯源验证报告」/计划中/2026-10-25；task.create 步被 ALLOWED_OPS 校验剔除（设计内） | `shots/02-ask-draft.png` |
| 5 | 03:58 | 真实点击「整批执行（1）」确认入库（不 mock） | 草稿清空，交付物落库；台账登记 ask-apply/confirmed | `shots/03-applied.png`；`disk-evidence.md` §3 |
| 6 | 03:59 | 磁盘核对：`deliverables/dlv-0001.json` 出现；`settings/pmProvenanceLedger.json` 新增 entry prv-mvctk2dq-8ws70u | 字段与 UI 一致 | `disk-evidence.md` §3 |
| 7 | 04:01 | UI 切「交付物」视图目视新记录 | 待开始 1 项，名称/交付日 10-25 一致 | `shots/04-deliverable-list.png` |
| 8 | 04:02 | 打开「AI 助手」抽屉查看 AI 溯源台账（只读） | AI 询问应用·与来源一致·置信度未提供·记录号 prv-mvctk2dq-8ws70u·来源 0 条；无警告条 | `shots/05-provenance-ledger.png` |
| 9 | 04:02 | 真实点击「立即重校」（只读治理，追加不可变历史） | 共 1 条·一致 1·待处理 0；重校历史 1 次；仍无警告条（refs=0，无失效对象，设计内） | `shots/06-recheck.png`；台账 history[0] |

## MANUAL_PENDING→DONE 说明

- 用例 P6-F09（L3 真实模型闭环）在冻结门规格中状态列为 `MANUAL_PENDING`；其真实触发方式即「受控通道真实生成 → 确认入库」。本轮第 4–5 步真实完成生成与确认，F09 由 MANUAL_PENDING 迁移为 **DONE（L3 已实测）**，无伪造。
- F09 规格中的「撤销」步本轮**不执行**：协调方要求测试交付物 + 台账保留作为持久溯源证据；撤销 create 将删除 dlv-0001 并破坏证据。撤销能力由离线 L2（F04）覆盖，台账已记录 undo handle（未使用）。

## 未做项（如实声明）

- 未执行撤销（保留证据，见上）。
- 未触发 F06 失效/警告条：本 entry refs=[]，无依据记录可被改/删，属设计内不触发；不编造失效场景，也不删改既有记录去制造失效。
- 未改动任何既有任务/交付物/台账历史条目；未改代码、未重启 3172。

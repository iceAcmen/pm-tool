# P2 深度融合（对外+长寿）验证记录

> 日期：2026-10-18 · 平台：doubao-work（组织者集成验证）· 范围：P2 六项（K18 单向出站/X7 愿景/OKR 层/X2 收尾标记/X3 失败经验/K16 档案最小保存包/X5 述职素材）
> 依据：`docs/design/deep-integration-v2-p2-dev.md`（P2 规格）与 S4/S5 效果图；不动 3172、未触碰正式 data/（verify-isolation 污染 0）

## 一、门禁汇总

| 门 | 命令 | 结果 |
|---|---|---|
| 构建 | `pnpm run build`（tsc 严格 + tsdown） | exit 0 |
| 全量单测 | `pnpm test`（vitest） | **37 文件 / 399 用例全绿**（基线 326 → 399，新增 73） |
| 隔离门禁 | `node scripts/verify-isolation.mjs` | **84 脚本 / 84 通过 / 失败 0 / 污染 0**（176 资产 before=after） |
| P2 集成链 | `node scripts/verify-p2-integration.mjs`（本批新增） | **56/56 PASS**（真实命令 + 真实 JSON 落盘） |
| 分片自验 | verify-p2a-export.mjs 26/26、verify-p2b-okr.mjs 26/26、verify-p2c.mjs 28/28、verify-p2d 通过（日志随证据） | PASS |

修正说明（均为脚本断言/路径口径问题，非实现缺陷，修正后全绿）：
1. `scripts/verify-p2b-okr.mjs` import 路径从分片私有临时编译目录 `.okr-build` 改为正式构建产物 `lib`（隔离门环境下无 .okr-build）。
2. `scripts/verify-ui-feedback.mjs` taskStatusLabels 键序断言由 4 键更新为 5 键（P2 X2 枚举新增 wrapped，tasks.tsx 分组/筛选单一来源跟随，wrapped 以中性灰徽章独立呈现，不进 done 视觉体系）。
3. `scripts/verify-p2-integration.mjs` 初版断言按实现口径修正（okr 树返回为 `{tree, orphans}`、收件区信封 `{entries:[...]}`、AI 动作 op 为点号 `task.update`、export 成功文案「活跃已发」/「数据包已生成」、lesson 空白行归一化进 gaps 而非 lines、archive 文案「非全量镜像」）。

## 二、P2 集成链（verify-p2-integration.mjs 56 项，真实 Context + 临时 JSON 根 + 真实命令 handler）

### K18 单向出站（19 项全过）
- 三档真实落盘：`web`（自包含 HTML：页首「只读快照 · 非实时数据」声明 + 生成时间 ISO + `@media (prefers-color-scheme: dark)` 浅深双态 + 无 script/link 外链）；`plain`（纯文本无 markdown 符号 + 时间戳）；`markdown`（证据/交付物/复盘引用附录 + footer 数据源声明）。
- 出站日志两类（settings 表条目，均走 enqueueDomainWrite）：
  - 审计只增流 `pmExportAudit`：条目形状 `{at, projectId, format, targetPath, itemCount}`，第二次导出追加不删（3→4），长期保留。
  - 动作已发日志 `pmExportSent`（TTL=30 天）：`partitionSentEntries(entries, nowIso, ttl)` 纯函数注入验证——40 天前条目判过期进 expired、10 天前活跃进 active；过期条目在下次导出时归档到 `pmExportSentArchive` 长期保留。
- `export audit [项目ID]` / `export sent [项目ID]` 只读列出；`export json` 既有档保留（不写项目出站日志）。
- 覆盖行为：同路径再导出默认拒（error 提示加 confirm 指令），末尾 `confirm` 覆盖成功。
- 成功文案含「外部文件为唯一事实源」声明与日志摘要。

### X7 愿景/OKR 层（12 项全过）
- `okr add`：objective/KR 落库（draft）；KR `primaryOkrId` 单父归属；跨项目 primaryOkrId →「父目标不属于指定项目」（中文拒因）。
- 树形派生 `buildOkrTree`：objective 为根、KR 挂父；`relatedOkrIds` 软关联进 `relatedTargets` 标注 related（可见不计权重）。
- 收件区机制（未确认不生效的保证点）：`suggest` 只追加 `pmOkrInbox`（信封 `{entries:[...]}`），**okrs 表零写入**；`confirm` 才创建 draft 记录 + 建议标 confirmed；`ignore` 建议保留标 ignored；`inbox clear` 清 confirmed/ignored、**保留 pending**（季度回访集中清空语义）。

### X2 收尾标记（6 项全过）
- 人显式 `task update {status:'wrapped'}` 转换成功，返回文案明示「已收尾 ≠ 正式完成」。
- 不催办：逾期 wrapped 从 queue top/rest 均排除。
- 检查：`overdue-untouched` 等 done 类规则对 wrapped 不命中。
- 统计：`stats` 单列「已收尾」。
- AI 禁写：`validateActions` 对 `op:'task.update'` + `patch:{status:'wrapped'}` 返回中文拒因「AI 不得直接写 wrapped（已收尾是人显式决策，请由人手动收尾）」。
- 复盘钩子：wrapped 转换不触发 reflections 草稿。

### X3 / K16 / X5（19 项全过）
- `lesson add <项目ID> <JSON>`（markdown 输入：`原因：…`→known、`待核：…`→pending、`待补：…`→blank+gaps 留白）真实落库 draft；`lesson list` 只读列出；`lesson final` 人定稿。
- `archive <项目ID> [目录]`：`package.json`（origin=pm-tool、exportedAt/archivedAt、tasks/deliverables/evidence/reflections/milestones 通用字段）+ `README-字段说明.md`；原任务数据 before=after 零改动；文案含「非全量镜像」；**未写 K18 出站日志**。
- `review <项目ID> [起] [止]`：Markdown 三段「做了什么/量化结果/关键产出」+ 同数据 ```json```；done 任务入素材（done=true）；**wrapped 条目 done=false**（不计完成数）；复盘 known 行入素材。

## 三、能力边界核对（不夸大，逐项对照验收标准）

| 验收项 | 实现口径 | 核对 |
|---|---|---|
| K18 出站只读非双向同步 | 导出为瞬时快照，外部文件为唯一事实源，不级联不镜像不回写；本期仅本地导出+只读快照文件，不预设 GitHub/不写外部平台；撤持续状态页/实时移动页 | ✅ |
| X7 agent 只提建议人确认 | suggest 零写入 okrs 表，confirm 才建 draft，未确认进收件区不自动生效；draft→confirmed 仅人 update；cycleDue 仅类型预留，不实现周期调度；习惯层（每日补记/续接/66 天/streak）未做（P3） | ✅ |
| X2 收尾标记不代替 done | wrapped 不催办、不计 done/open、不参与进度派生、check 不命中、复盘钩子不触发、AI 禁写；前端中性灰徽章「已收尾·非正式完成」不进入 done 视觉体系 | ✅ |
| X3/X5 句级标注、留白不编造 | lesson/review 句级 known/pending/blank；证据不足 gaps 留白；review 无完成条目 avgDoneProgress=null 不伪造 | ✅ |
| K16 最小保存包非全量镜像 | 仅任务/交付物/证据/复盘 known 行/里程碑通用字段 + 字段说明 README；不含评论/活动流/OKR/积分 | ✅ |
| 写操作纪律 | 所有写走 enqueueDomainWrite；导出/归档默认拒覆盖 confirm 才覆盖；建议未确认不生效；未触碰宿主常驻通知能力、未影响运行中服务 | ✅ |

## 四、3172 体验路径（P2 前端可见项）

- 视图切换器新增「目标（OKR）」入口（panel.tsx 接线，okrs 视图树形呈现：objective 根→KR 单父归属、软关联行虚线标注「关联」不计权重、孤儿单列不丢弃、draft/confirmed 状态徽章；收件区入口走命令通道 confirm/ignore，snapshot 未携带收件区时仅显示命令提示不伪造）。
- 任务视图：wrapped 条目「已收尾 · 非正式完成」中性灰徽章；出站关联位（latestExport prop 由面板按项目审计派生传入——面板集成时为安全缺省「未导出」占位，只显示不回写；前端无数据一律空态不注入示例）。
- web 快照档：单文件自包含（浅深跟随系统），页首只读声明 + 生成时间，空节「暂无数据」。
- 真实业务数据不进入 UI（示例均为验证脚本种子，标注虚构）。

## 五、证据文件（docs/verification/p2-20261018/）

- `verify-p2a-export.log`（K18 分片自验 26/26）、`verify-p2b-okr.log`（X7 分片自验 26/26）、`verify-p2c.log`（X2+X3+K16 分片自验 28/28）、`verify-p2d.log`（X5+前端分片自验）
- `verify-p2-integration.log`（集成链 56/56）、`verify-isolation.log`（隔离 84/84、污染 0）、`full-test.log`（37 文件 / 399 全绿）

## 六、遗留

1. P2 收口时的前端接线（panel.tsx okrs 视图切换器 + Snapshot.okrs 字段）由组织者集成步完成并已含入本批构建/测试/隔离门禁。
2. okrs 视图收件区：snapshot 未携带 settings 收件区条目（`pmOkrInbox` 为命令层 settings 键），前端当前仅显示命令提示；如需面板内直接渲染建议列表，P3 可扩展 snapshot 透传（本期按「不伪造数据」要求留命令提示入口）。
3. 出站关联位 latestExport：面板集成时未传入该 prop（安全落「未导出」）；P3 可由面板消费 `readExportAudit`（按 projectId 取最近导出时间）传入，本期只显示不回写的机制已就绪。
4. P3 立项项：H6 常驻推送、X7 习惯层（每日补记/续接/66 天窗口/streak）、K11 周期触发（cycleDue 已类型预留）。

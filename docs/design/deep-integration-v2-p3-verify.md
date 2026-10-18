# P3 深度融合（纵向+宿主）验证记录

> 日期：2026-10-18 · 平台：doubao-work（组织者集成验证）· 范围：P3（X7 习惯层 / K11 周期接线占位 / H6 常驻推送立项调研）
> 依据：`docs/design/deep-integration-v2-p3-dev.md`（P3 规格）与 S5 效果图；H6 调研 `docs/design/deep-integration-v2-h6-research.md`；不动 3172、未触碰正式 data/（verify-isolation 污染 0）

## 一、门禁汇总

| 门 | 命令 | 结果 |
|---|---|---|
| 构建 | `pnpm run build`（tsc 严格 + tsdown） | exit 0 |
| 全量单测 | `pnpm test`（vitest） | **38 文件 / 427 用例全绿**（基线 399 → 427，新增 28） |
| 隔离门禁 | `node scripts/verify-isolation.mjs` | **脚本全通过 / 失败 0 / 污染 0**（176 资产 before=after） |
| P3 集成链 | `node scripts/verify-p3-integration.mjs`（本批新增） | **29/29 PASS**（真实命令 + 真实 JSON 落盘） |
| 分片自验 | verify-p3a.mjs **22/22**（习惯后端真实链路）；分片B 渲染自检（react/jsx-runtime 执行组件 vdom 断言三场景）；分片C 调研（证据分级 E1-E6 结论文档） | PASS |

## 二、P3 集成链（verify-p3-integration.mjs 29 项，真实 Context + 临时 JSON 根 + 真实命令 handler）

### X7 习惯层（25 项全过）
- **add 落库**：`/pm habit add <项目ID> <JSON>` 建 draft 记录，可关联 OKR（同项目）；**跨项目 okrId → 中文拒因**「不属于指定项目」。
- **补记窗**：`checkin <id> <YYYY-MM-DD> [note]`——今天打卡 backfilled:false；昨天回填 backfilled:true；**3 天前超窗中文拒**（「只能打卡今天或过去 2 天内…」）。
- **streak 派生（today 注入纯函数）**：连续 2 天 → current=2；**断签（缺口>2 天）current 重置 0，longest/totalDays 永久保留**（2/2 不清零）；2 天窗内缺口（10/10→10/12）算连续；`buildHabitArchive` 输出「当前连续 N 天 · 历史最长 M 天 · 累计 X 天」纯文本。
- **收件区（未确认不生效）**：`suggest` 只追加 `pmHabitInbox`（信封 `{entries}`），**habits 表零写入**；`confirm` 建 draft + 建议标 confirmed；`ignore` 保留标 ignored；`habit inbox` 只读列出。
- **定稿**：`habit final` draft→final；重复 final 幂等。
- **K11 周期接线占位**：`CYCLE_HOOKS=['daily-archive','quarterly-review']`；`cycleHookPoint` 恒返回 `enabled:false` +「未启用」理由；**无 setInterval/后台进程/宿主 schedule 调用**。
- **list / snapshot**：`habit list` 含 streak 文本档案；`web snapshot` 携带 `habits` 数组，既有字段零破坏；`habits/<id>.json` 真实落盘。

## 三、能力边界核对（不夸大）

| 验收项 | 实现口径 | 核对 |
|---|---|---|
| 习惯建议不自动生效 | suggest 只进收件区零写入，confirm 才建 draft，ignore 保留标 ignored | ✅ |
| streak 是文本档案非激励动效 | 「当前连续 N 天 · 历史最长 M 天 · 累计 X 天」纯文本；无积分/连胜动效/徽章；空日如实留空不补 | ✅ |
| 周期接线是占位不启用 | cycleHookPoint enabled:false；无定时器/后台进程；文件头注释「H6 未实现前不启用」 | ✅ |
| H6 未实现不标注为已实现 | H6 调研结论文档独立（证据分级 E1-E6），明确「当前未实现」；前端习惯视图无任何推送/提醒能力标注 | ✅ |
| 写操作纪律 | 所有写走 enqueueDomainWrite；补记窗超窗拒写；定稿仅人触发；未触碰宿主常驻通知能力；未影响运行中服务 | ✅ |
| 依赖 P2 OKR 实体 | habit.okrId 关联 + 同项目存在性校验 + 跨项目拒因 | ✅ |

## 四、H6 调研结论（详见 `docs/design/deep-integration-v2-h6-research.md`）

- **宿主 Web/Chrome 形态不提供任何外部通知渠道**（无系统通知/邮件/出站 webhook/托盘角标/手机推送）——证据：cordis 导出面无定时器 API（E2 行号）、`notification` 帧为助手流式输出块非系统通知（E2）、UI 插槽全在窗口内无托盘/角标（E2）、宿主 schedule 到期只投回原会话（E2）、Desktop Electron 未对插件暴露通知通道（E2）。
- **推荐方案：本期维持路线 B（应用内/打开面板即派生，ADL-039 现状），不立项路线 A（宿主级推送），H6 保持「未实现」**。
- **拍板条件（路线 A 若被选择须全部满足）**：① 所有者书面接受常驻常开+可选联网/外部渠道（新 ADL supersede ADL-009/039）；② 通道可达（改 Electron 主进程 IPC，或 launchd/外部 webhook/邮件）；③ 接受改上游/外部服务的升级覆盖与维护成本；④ 提供凭据并真实验收。
- **簿记修正**：任务书将「离线优先、无后台常驻」记为 ADL-011，仓内 ADL-011 实为落盘布局；基调实际锚在 ADL-009（离线优先）+ ADL-039（打开面板即派生）——调研分片已按仓内原文修正（`decision-log.md:148-153,204-208,346-354`）。
- **未开发任何常驻推送/后台进程代码**（调研分片 git status 仅新增文档，src/ 零改动）。

## 五、3172 体验路径（P3 前端可见项）

- 视图切换器新增「习惯」入口：习惯列表（title + draft/confirmed/final 状态徽章 + streak 纯文本档案 + 打卡记录含「补记」标注 + OKR 关联标题）+ 收件区入口（confirm/ignore 命令通道；snapshot 未携带收件区时仅命令提示不伪造）+ 打卡入口（今天/回填过去 2 天按钮，走命令通道）。
- 空态：无习惯记录 → 空态占位 + 命令提示；空日 → 行内「空日如实留空，不自动补记」占位；不注入示例数据。

## 六、证据文件（docs/verification/p3-20261018/，本地留存）

- `verify-p3a.log`（习惯后端分片自验 22/22）、`verify-p3-integration.log`（集成链 29/29）、`verify-isolation.log`（隔离/污染 0）、`full-test.log`（38 文件 / 427 全绿）

## 七、遗留

1. **H6 立项调研已完成，待用户拍板**（路线 A 四个前提条件见 §四）；拍板前不开发任何常驻推送/后台进程。
2. 习惯视图收件区：snapshot 未携带 `pmHabitInbox`（settings 命令层键），前端仅命令提示；如需面板内直接渲染建议列表可扩展 snapshot 透传（同 P2 okrs 遗留，均留后续批次）。
3. P4 候选：H6 拍板后实施（若选路线 A：宿主级通知扩展需外部协作）；X8（待回填）周期接线点同 K11 模式仅类型预留。

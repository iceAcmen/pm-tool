# O1 方案②实施复测说明（主 CTA 上移页头 · 九视图统一落点）

> 基线：`../O1-O2-说明.md`（O1 复测 `rect.x=1486.66/right=1593.70 > innerWidth=1440`，仍在外，需裁决）。
> 实施：主 CTA 从 `.pt-toolbar` 移出，常驻顶栏（与全局「新建项目」同层）；空态 CTA 全部保留；不改表单/焦点/a11y 逻辑。

## 1. 改动面（9 文件，+54/-23）
- `client/panel.tsx`：顶栏 `.pm-top-actions` 内按当前视图注入唯一视图 CTA（IIFE 解析 label/action）；overview/people 返回 null，不硬造。
- `client/panel.css`：新增 `.pm-view-cta`（accent 描边 + accent 12% tint 底 + `--pm-link` 色文字，8px 圆角；**不走近黑实心**，用户指令优先于 §9 H1 中性填充）。
- 视图页头主按钮移除（空态 CTA 保留）：`tasks.tsx`、`gantt.tsx`、`milestones.tsx`、`risk-issues.tsx`、`meetings.tsx`、`reports.tsx`、`deliverables.tsx`。

## 2. 1440 浅色 · 九视图 CTA rect（全部视口内 PASS）

| 视图 | CTA 文案 | x | right | y | 判定 |
|---|---|---|---|---|---|
| 全部任务 tasks | 新建任务 | 997.84 | 1099.97 | 15.34 | PASS |
| 甘特排期 gantt | 新建任务 | 997.84 | 1099.97 | 15.34 | PASS |
| 里程碑 milestones | 新增里程碑 | 983.56 | 1099.97 | 15.34 | PASS |
| 风险与问题 risk-issues | 登记风险/问题 | 965.17 | 1099.97 | 15.34 | PASS |
| 会议纪要 meetings | 新增会议 | 997.84 | 1099.97 | 15.34 | PASS |
| 进度汇报 reports | 生成快照 | 997.84 | 1099.97 | 15.34 | PASS |
| 交付物 deliverables | 新增交付物 | 983.56 | 1099.97 | 15.34 | PASS |
| 项目概览 overview | （无，设计上不渲染） | — | — | — | N/A |
| 人员负载 people | （无，设计上不渲染） | — | — | — | N/A |

- 旧工具条主按钮残留扫描：`.pt-toolbar/.pt-tools .pt-primary`=0、甘特 `.pm-chip-primary`=0（全视图）。
- 深色 1440 抽测 tasks/milestones/deliverables：落点一致（right=1099.97），`--pm-link`=#7aaaff、tint 底，无回潮。

## 3. 768 / 390 回归
- 768：顶栏切换器与操作条垂直重叠 `ov_sw=0`；CTA「新建任务」可见（x=412/right=514/y=54）。
- 390：`ov_sw=0`；CTA「新建任务」可见（x=176/right=274/y=56）；顶栏两行流式、次要 AI 按钮收敛「更多」，无叠印无遮挡。

## 4. 视觉 token 取用说明
- 文字色：`--pm-link`（浅 #4868b2 / 深 #7aaaff，均 ≥4.5:1），不拿 `--pm-accent`(#4176e6) 作文字（守 §5.2）。
- 底：`--pm-tint-accent`（accent 12% tint）；描边：`--pm-accent`；圆角 sm 8px；字重 550。
- 层级：全局「新建项目」= ghost（透明底+线边），视图 CTA = accent 描边+tint，二者层级清晰；**无近黑实心按钮**。

## 5. D3 交付物漏斗填充态（320 浅色，首次可渲染复测）
- 项目 p-0001「浏览器功能验收」→ 交付物视图：6 格漏斗填充（总数 1 项 / 已验收 0 / 进行中 0 / 已提交 0 / 待开始 1 / 验收通过率 0%），两列换行、标签数值可读、无逐字竖排断裂、无竖线（D3 修复生效）。
- 截图：`D3-320-light-deliverables-funnel.png`、`D3-320-light-funnel-clip.png`；数值：`d3-funnel-evidence.json`。
- D2 风险矩阵：本实例无风险种子数据，维持「代码级修复 + 待种子实例复验」，不造数。

## 6. 门禁结果
- `pnpm run build`：退 0（tsc + tsdown bundle 通过）。
- `pnpm vitest run`：18 文件 / 209 测试全绿。
- `pnpm run verify:isolation-only`：PASS，正式 data/backups/exports 176 文件 hash+mtime 零污染。

## 7. 证据文件
- 测量：`o1-after-measurements.json`；D3：`d3-funnel-evidence.json`。
- 帧：`1440-light-tasks.png`、`1440-dark-tasks.png`、`768-light-tasks-topbar.png`、`390-light-tasks-topbar.png`、D3 两张。

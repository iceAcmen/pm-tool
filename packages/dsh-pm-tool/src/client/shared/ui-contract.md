# 共享前端契约（B1 冻结版 · 供 planning / records / growth 等后续分片只读消费）

> 本文件由共享前端 owner（B1/B4）维护；后续端到端分片只**消费**此处的 token 与既有原语，
> **不回写** `panel.tsx`、不新增 flag、不改 core、不内联 hex。需要把新视图接进壳层时，
> 把组件与期望 props 交给共享 owner，由其在 `panel.tsx` 统一合并接线，避免并写冲突。
> 冻结点：基线 HEAD `8dfed2d`；B1 静态合同 `shared/contract-pilot.test.ts`。

## 1. 所有权边界（硬约束）

- `panel.tsx`：唯一由共享 owner 维护，分片不得直接编辑；新视图通过 owner 合并 props 接线。
- `src/core/**`（schema/commands/storage/派生/检查/备份/导出/copilot 白名单）：数据 owner，只读引用纯函数，不改。
- 服务、3080/3091、真实 GUI、commit/push：主端/单一提交者，分片不做。
- 深链：B1 不增宿主 URL 路由；项目/视图/命名视图选择走既有 localStorage 持久化恢复。

## 2. 可消费 CSS token（全部在 `.pm-shell` 作用域，深浅自动跟随 `body[data-ds-dark-theme]`）

只引用变量，**禁止内联 hex / rgba 硬编码**；缺色时向共享 owner 申请 token，不自行造色。

- 文字：`--pm-ink`（主文字）、`--pm-secondary`、`--pm-muted`、`--pm-text`、`--pm-ink-muted`。
- 表面：`--pm-surface`（基础面）、`--surface`（层1）、`--surface-2`（抬升弹层）、`--pm-canvas`、`--pm-surface-muted`、`--pm-hover`。
- 描边：`--pm-line`、`--pm-line-soft`、`--pm-line-strong`。
- 语义：`--pm-accent`（主交互蓝）、`--pm-success`、`--pm-warning`、`--pm-danger`、`--pm-blue-soft`。
- 状态色（任务五态，勿另造）：`--pm-st-todo / --pm-st-progress / --pm-st-blocked / --pm-st-done / --pm-st-due / --pm-st-overdue`。
- 间距：`--sp-1:4 --sp-2:8 --sp-3:12 --sp-4:16 --sp-5:20`。
- 字号：`--t-10 … --t-14`（正文 ≥14，输入 ≥16，移动端不缩到 12 以下正文）。
- 圆角：`--r-sm:8px`、`--r:12px`；阴影：`--pm-shadow-menu`、`--pm-shadow-modal`；动效：`--pm-motion-fast`、`--pm-motion-base`。
- 字体：`--pm-font-sans`、`--pm-font-brand`、`--pm-font-mono`。
- 主题：壳层已声明 `color-scheme: light` / 深色 `color-scheme: dark`；原生 `select/option` 已全局显式底色文字，**不要再写透明 option 或 `outline:none`**。

## 3. 壳层已提供的反馈原语（分片直接复用，禁止重造）

- busy：壳根 `aria-busy` + 顶部 `.pm-busy-indicator`；视图只需把 `disabled={busy}` 接到既有按钮。
- 读取失败：壳层保留旧数据、显示 `.pm-stale-banner`（含「重试」按钮），错误原文进 `ResultCard`。
- 成功：`FeedbackToast`（`pm-toast--success`，role=status，3s 自动消逝）。
- 错误：`ResultCard`（error role=alert，结构化 action/复制/关闭）；权限类自动加「权限不足」通用标签，原始原因原样保留，不静默合并。
- 键盘：全局 `:focus-visible` 2px 环已在；自定义控件必须保留可见焦点，禁止 `outline:none`。
- 试点开关：`pm-b1-pilot`（localStorage，默认 off），壳根 `data-pilot="on|off"`；新视觉层一律门控在 `[data-pilot="on"]` 下，off 旧页原样。

## 4. 视图接线 props（由 panel 注入，分片按此声明组件入参）

- 单项目视图（如 overview）：`project, tasks, milestones, riskIssues, meetingsCount, reportsCount, deliverablesCount, settings, onEditProject`。
- 看板（BoardBento）：`data: Snapshot`；`actions={ openRecord, pickProject, runCommand, refreshBoard }`；`persistence={ onSave(scope,layout), onReset(scope) }`。
- 数据口径一律复用 core 纯函数（derived / progress-derivation / labels / war-room / task-tree 等），不在视图手算健康分/完成率/逾期。
- 持久化：视图偏好沿用 localStorage（`pm-view / pm-density / pm-selected-project` 先例），不写 core schema。

## 5. 既有七态不得覆盖（非回归）

busy 加载、空（无项目/无记录）、无结果（筛选无命中）、陈旧（读取失败保旧+重试）、错误重试、成功 toast、权限不足。
分片新增页面必须显式覆盖空/无结果/错误，不得只做 happy path。

## 6. 验收边界

- 静态/单测/构建由分片自测；真实像素、200%、跨宽保存、刷新重启、持久化与失败恢复旅程由 Main GUI 采证。
- 本契约稳定 ≠ 生产放行；B1 全部 GUI QA PASS 前不称上线。

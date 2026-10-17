# P2-2 Token 2.0 迁移映射表（G2-A05/A06/A07）

> 冻结日期：2026-10-17；配套 `p2-2-visual-token-baseline-20261017.md`。
> 动作码：`alias` 旧名保留为同值别名（本批不改名、不删除）；`close` 补定义/闭合历史未定义；
> `new` 新增语义层；`keep` 局部保留不动；`host` 宿主别名直接消费，插件不覆写。
> 清点口径：`packages/dsh-pm-tool/src/client/` 全部 CSS + TSX 内联 `var(--*)`；清点日 HEAD=21cdc94 基线 + 本批改动。

## 1. 宿主别名直接消费（host，插件不覆写、不替换）

`--dsw-alias-bg-base / bg-layer-1/2/3 / bg-mask-1 / bg-module-platform / border-l1..l4 /
button-primary-fill / button-primary-hover / button-info-hover / interactive-bg-active /
interactive-bg-hover / interactive-bg-hover-danger / label-primary / label-primary-foreground /
label-secondary / label-tertiary / label-caption / state-business-primary / state-business-tertiary /
state-danger / state-error-primary / state-error-secondary / state-idle-primary /
state-success-primary / state-success-secondary / state-warn-primary / state-warn-label /
state-warning-text / toast-bg / toast-label / link`；
`--dsw-radius-xs/sm/md/lg/xl/panel`；`--dsw-font-family / -brand`；`--dsw-static-deepseek-600 / -neutral-500`；
`--ds-font-family-code`；`--dsh-content-font-size`。
说明：宿主主题优先；插件只在别名缺失时用 §3 fallback，不硬覆盖宿主自定义板卡取值（G2-A08/A13）。

## 2. 旧 token 保留为同值别名（alias，本批不改名不删除）

| 旧 token | 解析目标（同值） | 备注 |
|---|---|---|
| `--pm-accent` | `--dsw-alias-state-business-primary` | 品牌动作色 |
| `--pm-blue` / `--pm-blue-hover` / `--pm-blue-soft` | accent / button-info-hover / business-tertiary | 旧别名保留 |
| `--pm-ink` | label-primary | 主文本 |
| `--pm-secondary` | label-secondary | 次正文 |
| `--pm-muted` | 浅色强制 #696e74（AA 5.14）；深色走宿主 | 辅助文本 |
| `--pm-line` | border-l2 | 常规边框 |
| `--pm-line-soft` | border-l1 | 弱分隔 |
| `--pm-hover` | interactive-bg-hover | 悬停底 |
| `--pm-surface` / `--pm-canvas` | bg-base / bg-layer-1 | 表面/画布 |
| `--pm-danger` / `--pm-success` / `--pm-warning` | state-error/success/warn-primary | 状态色 |
| `--pm-on-primary` | label-primary-foreground | 主按钮文字（P0-5） |
| `--pm-link` | host link → fallback #4868b2（AA 5.39） | 文本链接 |
| dsh-flat `--ink/--ink-2/--muted/--faint/--surface/--surface-2/--surface-3/--line/--line-2/--line-3` | 同层别名 | 视图层消费，保留 |
| dsh-flat 状态 `--c-done/--c-prog/--c-block/--c-late/--c-todo`（含 `-d` 深色变体） | 宿主状态别名 | 状态点/进度条，保留 |

## 3. 历史未定义/无 fallback 别名闭合（close，G2-A07）

| 历史消费名 | 闭合目标 | 消费点（清点日） |
|---|---|---|
| `--c-link` | `--pm-link` | tasks.css pt-milestone-chip（3 处） |
| `--hover-bg` | `--pm-hover` | deliverables/milestones/reports/people chip/行 hover（5） |
| `--line-soft` | `--pm-line-soft` | tasks.css 分隔、reports.css 筛选条（6） |
| `--pm-border` | `--pm-line` | panel.css 批量输入/导入预览/悬停边框/风险格（4） |
| `--pm-bg` | `--pm-canvas` | panel.css 顶栏菜单（1 用 + 兜底 1） |
| `--pm-text` | 新语义 `--pm-text`（label-primary） | panel.css 勾选/行状态/KPI（3） |
| `--pm-line-strong` | `--dsw-alias-state-idle-primary`（fallback #d4d4d4） | 待办点/里程碑节点（9） |
| `--pm-accent-soft` | business-tertiary（fallback #e4edfd） | 链接 chip 底/悬停（2） |
| `--pm-faint` | `--faint` | 抽屉分组/提示（5，原带 fallback） |
| `--pm-ink-muted` | `--pm-secondary` | 撤销条文字（1，原带 fallback） |
| `--pm-surface-muted` | `--surface-2` | 撤销条底（1，原带 fallback） |
| `--pm-progress` | `--c-prog` | 试用提示（1，原带 fallback） |

## 4. 新增语义层（new，加性，不改旧值）

- 文本：`--pm-text`（label-primary）、`--pm-text-2`（label-secondary）。
- 浅底 tint：`--pm-tint-accent/success/warning/danger`（替代各处手写 color-mix 百分比）。
- 阴影：`--pm-shadow-menu`（轻）、`--pm-shadow-modal`（中）；暗色在 `body[data-ds-dark-theme] .pm-shell` 覆写加深。
- 动效：`--pm-motion-fast 120ms`、`--pm-motion-base 180ms`（只动 transform/opacity）。
- 图表：`--pm-chart-s1/s2/s3` 启用；`--pm-chart-s4` 不定义、不启用（未来有真实多序列需求再定；G2-A11）。
- P2-6 预留：`--pm-ai-surface / --pm-ai-edge / --pm-ai-mark`，只定义不启用。

## 5. 局部保留（keep，本批不动）

- 间距 `--sp-1..12`、字阶 `--t-10..26`、圆角 `--r-xs/sm/r/lg/xl/2xl`、字距 `--ls-*`、层阶 `--z-*`、缓动 `--ease`。
- 旧阴影 `--shadow-1/2/3`（既有视图继续用；新浮层走 §4 语义阴影）。
- 板卡预测状态色 `--pm-st-done/progress/blocked/overdue/todo/due`（panel.css 1868+，局部调色，本批不统一）。
- 视图局部 token：`--ov-lamp`（overview 健康环）、`--diag`（诊断条）。

## 6. 静态门结果（开发自跑，独立测试复测）

- 全仓 `var()` 未定义扫描：**0 命中**（CSS + TSX 内联）。
- AA 实算（白底）：muted #696e74=5.14、faint #71767c=4.58、link #4868b2=5.39、on-primary 白/近黑=18.90；faint 落 surface-2=4.23 禁用（改 muted）。
- 零暖黄/新品牌色/品牌蓝填充 CTA/渐变（装饰性 scroll mask 除外）/玻璃/光晕；S4 不定义、不启用。

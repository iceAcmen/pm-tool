# 设计图（Mockup）交付规范（P1/P2，2026-10-17）

为 P1/P2 需求产出**高保真静态设计图**：自包含 HTML + 用 puppeteer 渲染截图 PNG。
本批**只做静态设计图，不改业务代码、不提交 git**（提交由 Organizer 统一完成）。

## 必读
- 设计方案：`docs/design/forward-design-proposal-20261017.md`（§5 token、§6 组件契约、§9 响应式、§11.2/11.3 清单）
- 现网截图（风格基线，仅参考）：`docs/verification/full-regression-20261017/screenshots/`

## 技术形态
- 每个需求一个自包含 HTML 文件（内嵌 CSS，不依赖外部资源与网络），放置：
  - P1：`docs/design/mockups/p1/{id}.html`
  - P2：`docs/design/mockups/p2/{id}.html`
- 用 puppeteer-core（`/Users/bytedance/Projects/dsh-pm/pm-tool/.tmp/warroom-20261014/node_modules/puppeteer-core`）
  + Chrome（`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`）渲染截图，输出到对应目录 `png/`：
  - 桌面：视口 1440×900，`{id}-light-1440.png` / `{id}-dark-1440.png`
  - 移动：视口 390×844，`{id}-light-390.png`
  - 深色切换：`document.body` 加 `data-ds-dark-theme`，mockup 内须自带深色 token 变量
- 每张图必须用真实感的中文 PM 内容（项目名、任务、负责人、日期、风险），禁止 Lorem ipsum；
  每张图顶部或侧边可放小字标注（不遮挡主体）：需求编号 + 展示的状态/决策点。

## 必须遵守的 token（摘自方案 §5，深浅两套）

**浅色**：`--bg:#fff`；`--surface:#fff`；`--surface-2:#f5f6f7`；`--surface-3:#edeef2`；
`--ink:#1c1c1e`；`--ink-2:#61666b`；`--muted:#696e74`；`--faint:#71767c`（仅白底）；
`--line:rgba(0,0,0,.10)`；`--line-2:rgba(0,0,0,.12)`；`--line-3:rgba(0,0,0,.04)`。
**深色**：`--bg:#101113`；`--surface:#16181c`；`--surface-2:rgba(255,255,255,.06)`；`--surface-3:#262a30`；
`--ink:#e8eaed`；`--ink-2:#b3b8c0`；`--muted:#9b9ea3`；`--faint:#8c8f94`；
`--line:rgba(255,255,255,.10)`。
**主按钮（中性 primary）**：浅色 `#0f1115` 白字；深色 `#f0f2f5` 近黑字。
**语义色（浅）**：进行/链接 `--c-prog:#4176e6`；完成 `--c-done:#22c55e`；阻塞/临期 `--c-block:#f59e0b`；
逾期/危险 `--c-late:#ef4444`；待办 `--c-todo:#d4d4d4`。深色：prog `#4868b2`、done `#4ed17e`、block `#dd8629`、late `#f25a5a`、todo `#7f8287`。
**字阶**：22/750 页面标题；16/650 区块标题；14/400 正文（lh 1.45）；12/600 chip/标签；11/500 元信息；10/650 eyebrow；18/700 数据。
**间距**：4/8/12/16/20/24/32；页面 24，卡片 16，窄窗 12。**圆角**：卡片 12，按钮/输入 8，chip 4。
**规则**：无渐变、无玻璃拟态、无暖黄/偏黄；卡片贴合内容、不贴边不空荡；状态必须有文字标签（不只靠色）；
所有数据数字用 `font-variant-numeric:tabular-nums`。

## 质量门槛
- 每个 HTML 在浏览器打开无横向滚动（除明确标注的甘特时间轴）；截图渲染完整、文字无遮挡。
- 每张图须能回答：这是哪个需求、服务什么决策、展示了什么状态；浅/深两套都要成立（移动类除外）。
- 脚本放 `.tmp/`（gitignored）。
- 开工前 `pgrep -fl caffeinate`，缺失则 `nohup caffeinate -dimsu >/dev/null 2>&1 &`；`uname` 必须为 Darwin。

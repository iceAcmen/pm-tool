# P2-2 视觉基准与 Token 2.0 冻结规范（2026-10-17）

> 状态：**冻结（开发前）**。本文件是本批（P2-2 Token 2.0 + 新界面视觉校准）的唯一视觉真源；
> 独立测试计划见 `docs/testing/p2-batch-test-plan.md`（测试专家所有，本文件不改其用例/门槛）。
> 作者：开发负责人（产品代码与非 testing 文档写入方）。
> 上游依据：`docs/design/forward-design-proposal-20261017.md` §2/§5、`mockups/p2/p2-2-token-2.html`、
> 已认可批次截图（`docs/verification/batch2-rework-20261016/*`）、宿主只读主题
> `deepseek-harness/packages/client/ui-theme/src/styles/design-platform.css` + `base.css`。

## 0. 范围与非目标

### 0.1 本批做（P2-2）
1. 在现有两层变量（旧 `--pm-*` 语义层 + dsh-flat `--*`）之上，**加性**建立单层语义 token 层：
   宿主别名优先 → fallback；旧 token 全部保留为别名、解析到同值，**不改名、不删除、不全局粗替换**。
2. 闭合现存未定义变量（`--c-link` 等 12 项，见 §5）。
3. 校准**已实现的新界面**：P2-1 左分组导航、P2-5 命名视图切换器/管理弹窗/导出菜单、只读 HTML 快照、
   顶栏项目下拉与更多菜单。只调视觉 token 与既有样式，**不改任何业务逻辑、零 schema、不改交互行为**。
4. 补图表序列（S1–S3 启用；S4 不定义、不启用，未来有真实多序列需求再定）、阴影、动效 token。

### 0.2 本批不做（防越界）
- **P2-6 AI 溯源治理**：未实现，全部 NOT_RUN/BLOCKED，本批只预留 `--ai-*` 语义槽位，不采用 mockup 紫色品牌色。
- **不重做** P2-1 IA 导航、P2-5 命名视图/复合过滤/导出/只读快照的功能与布局契约。
- 不改甘特/看板/抽屉行为；不动宿主 `deepseek-harness`（只读）；不写真实 `data/`；离线优先。
- 不把 mockup 示意值（27px/14px/40px、86% 环、渐变 logo）当实现要求；mockup 装饰元素（渐变、紫色 stat 卡）不采纳。

## 1. 冻结视觉规则（深浅都成立）

### 1.1 总原则（来自 visual-craft / ux-ui-audit System 模式）
- 视觉质量 ≠ 大留白/大字号/卡片堆砌/渐变/阴影；**密集专家工具保持扫描效率**，不无故拉高行高/卡片高。
- 容器为结构与交互而存在，不为「把一切装进卡片」；边框与阴影**不同时上**（平面分区靠 hairline 边框，浮层才用阴影）。
- 间距来自小而 intentional 的阶（§1.5），不把每个局部尺寸都提成全局 token。
- 状态色不只靠红绿：**图标 + 文字标签 + 色**三者并列；disabled 与 read-only 是不同概念。
- 数字一律 `font-variant-numeric: tabular-nums`；正文/数据不使用等宽替代。

### 1.2 色彩角色（宿主别名优先，fallback 仅在别名缺失时生效）
| 角色 | 语义 token（新层） | 解析来源（浅） | 用途边界 |
|---|---|---|---|
| 画布 | `--pm-canvas` | `--dsw-alias-bg-base` | 面板最底层背景 |
| 表面 | `--pm-surface` | `--dsw-alias-bg-layer-1` | 卡片/菜单/弹层容器 |
| 表面抬升 | `--pm-surface-2` | `--dsw-alias-bg-layer-2` | 输入底、悬停浅底、徽章底 |
| 文本主 | `--pm-text` | `--dsw-alias-label-primary` | 标题/正文主色 |
| 文本次 | `--pm-text-2` | `--dsw-alias-label-secondary` | 次要正文（AA 5.80:1 白底） |
| 文本辅助 | `--pm-muted` | 浅色强制 `#696e74`（5.14:1）；深色走宿主 tertiary | 次要说明；**可上 surface-2**（4.75:1） |
| 文本装饰 | `--pm-faint` | 浅色强制 `#71767c`（4.58:1 白底） | 仅画布/表面上的元信息；**落 surface-2 仅 4.23:1，禁用，改 muted** |
| 品牌动作 | `--pm-accent` | `--dsw-alias-state-business-primary` | 链接、选中态、焦点描边；**不做大面积 CTA 填充** |
| 主按钮底 | `--pm-primary-fill` | `--dsw-alias-button-primary-fill`（浅近黑/深反白） | 唯一主按钮；中性，非品牌蓝填充 |
| 主按钮字 | `--pm-on-primary` | `--dsw-alias-label-primary-foreground` | 已存在，保留 |
| 链接 | `--pm-link` | 浅 `#4868b2`（5.39:1 AA）；深走宿主 link | 文本链接；不用 4.23:1 的 #4176e6 作文字 |
| 成功 | `--pm-success` | `--dsw-alias-state-success-primary` | 仅 done/完成 |
| 警告 | `--pm-warning` | `--dsw-alias-state-warn-primary` | 阻塞/待办提醒 |
| 危险 | `--pm-danger` | `--dsw-alias-state-error-primary` | 逾期/删除/错误 |
| 边框弱 | `--pm-line` | `--dsw-alias-border-l2` | 常规分隔 |
| 边框更弱 | `--pm-line-soft` | `--dsw-alias-border-l1` | 组内分隔、卡片内 hairline |
| 悬停底 | `--pm-hover` | `--dsw-alias-interactive-bg-hover` | 行/项 hover |

**禁止**：暖黄/偏黄底、新品牌色、品牌蓝大面积填充 CTA、渐变、玻璃拟态、光晕、彩色投影。
图表 S4：**不定义、不启用**；未来有真实多序列需求再定，本期不进任何 UI 面。

### 1.3 表面与浮层
- 平面视图：白/深底 + hairline 边框，无阴影。
- 浮层（下拉/菜单/弹窗）：`--pm-surface` + 菜单边框 + 菜单阴影（§1.6）；圆角 8px（菜单）/12px（弹窗）。
- 遮罩：复用宿主 `--dsw-alias-bg-mask-1`，不自造半透明黑。

### 1.4 圆角（跟随宿主，不自造）
`xs 4 / sm 8 / md 12 / lg 16 / xl 20 / panel 28`，经 `--r-xs/--r-sm/--r/--r-lg/--r-xl/--r-2xl` 别名；
控件统一 sm(8)，菜单 sm(8)，弹窗 md(12)。**不允许同一工具条上 ghost/primary 圆角不一致。**

### 1.5 间距阶（theme-independent，沿用现有 `--sp-*`）
`sp-1 4 / sp-2 8 / sp-3 12 / sp-4 16 / sp-5 20 / sp-6 24 / sp-8 32 / sp-9 40 / sp-10 48 / sp-12 64`。
组件内边距绑定阶；页面局部留白不提成 token。里程碑式「大内边距撑场面」为反例，禁止复现。

### 1.6 阴影与动效 token
- 阴影：`--pm-shadow-menu`（下拉/菜单：0 1px 2px + 小范围弥散）、`--pm-shadow-modal`（弹窗：中等弥散）；
  深色由宿主别名/暗色覆写自动提亮，不机械反色。
- 动效：`--pm-motion-fast 120ms`（hover/选中）、`--pm-motion-base 180ms`（展开/面板）；
  缓动复用宿主 `--ease`（cubic-bezier(.22,.61,.36,1)）；只动 transform/opacity；尊重 `prefers-reduced-motion`；
  退出短于进入（约 60–70%）。

### 1.7 字阶与字重
- 沿用宿主系统栈（`--pm-font-sans`），不打包新字体、不引入远程字体；数字 tnum。
- 角色：页面标题 16/700、区块标题 13.5/650、正文 13–14/400、标签/元信息 11–12/600、数据 tabular。
- 不通过放大所有标题解决层级竞争；先减少竞争性强调。

### 1.8 状态契约（组件层）
default / hover / focus-visible（2px 品牌色描边 + 1px offset）/ pressed / selected / disabled（降透明度+语义属性）/
read-only（视觉与语义都区别于 disabled）/ empty / error / stale 各自可辨；键盘可完成关键路径，Esc 关浮层，焦点归还。

## 2. Token 2.0 分层（加性，不替换）

```
宿主原始别名（--dsw-*，只读，不改）
        ↑ 引用
单层语义层（--pm-* 新名：color/text/surface/line/control/motion/chart）
        ↑ 别名保留（旧 --pm-* 与 dsh-flat --* 全部 = 同值别名，本批不删）
既有组件样式（渐进迁移：新界面先切新语义层，旧视图不动）
```

- 命名语法：`--pm-<category>-<role>[-state]`（category: color/text/surface/line/control/motion/chart）。
- 每个语义 token：宿主别名优先 → 项目 fallback；fallback 仅补 AA 中性与缺失项，不覆盖宿主主题。
- 旧 token 本批全部保留为别名（解析到同值），迁移映射表见 §5；阶段停在 mockup 阶段 1–2（别名并存），不做阶段 3 全切。
- 预留槽位（本批只定义不启用）：`--pm-ai-surface / --pm-ai-edge / --pm-ai-mark`（未来 P2-6 人工/AI 区分，
  中性底 + 虚线边 + 文字/图标，**不用紫色品牌色**）；`--pm-chart-s1..s3` 启用；`--pm-chart-s4` 不定义、不启用。

## 3. 文件所有权

| 文件 | 所有权 | 本批动作 |
|---|---|---|
| `src/client/panel.css` | 开发（本批） | 加语义层、闭合未定义、校准 rail/菜单/顶栏 |
| `src/client/views/*.css` | 开发（本批） | 仅校准 P2-5 菜单/弹窗/ghost/密度段，不动布局 |
| `src/client/nav-rail.tsx` | 开发（本批） | 仅修 class 碰撞（`pm-rail-sub` 复用），不改逻辑 |
| `src/core/task-export.ts`（快照 HTML） | 开发（本批） | 中性值对齐冻结规范、emoji→内联 SVG、保持自包含/无外链/转义 |
| `src/core/design-tokens.ts`（新增）+ `*.test.ts` | 开发（本批） | 纯模块 token 契约 + vitest 边界测试 |
| `docs/design/*`、`docs/decision-log.md`、`docs/changelog.md`、`docs/progress.md`、`docs/handoff.md`、`docs/onboarding-prompt.md` | 开发（本批） | 批次关闭时更新；本冻结规范先行 |
| `docs/testing/**` | **测试专家** | 开发只读，不写 |
| `src/client/views/*.tsx` 业务行为、`src/core/*` 业务逻辑、schema、看板行为 | 不归本批 | 零改动 |
| `~/Projects/dsh-pm/deepseek-harness` | 只读 | 零改动 |

## 4. 校准对象清单（只调视觉，不动功能）

1. **P2-1 左导航**
   - `.pm-rail-logo` 去 `linear-gradient`，改中性/品牌平涂（无渐变）；
   - active 项的 12% 蓝 tint 抽为 `--pm-tint-accent` 语义；浅色 AA 已用 deepseek-600，保留；
   - 修复 `.pm-rail-sub` 同时充当「副标题」与「折叠组容器」的 class 碰撞（容器改名，副标题保留）；
   - 搜索框/分组标签/计数（tnum）对齐 §1 阶与字阶。
2. **菜单/浮层**（项目下拉、视图切换菜单、更多菜单、P2-5 `pt-vmenu`/`pt-vm`）
   - 硬编码暗色 `rgb(24,25,27)` 与裸阴影 → `--pm-surface` + `--pm-shadow-menu/modal`；
   - `pt-vmenu` 圆角 16→8、阴影 shadow-3→menu；弹窗遮罩改宿主 mask；
   - 选中/hover 统一 `--pm-hover` / `--pm-tint-accent`。
3. **ghost/主按钮**：`pt-ghost` 圆角对齐控件 sm(8)；主按钮中性填充（T2-G05），ghost/danger/icon 可辨。
4. **只读快照**（`buildTaskSnapshotHtml`）：保持离线自包含；中性值对齐 §1.2；🔒 emoji → 内联 SVG 锁；
   状态 chip 保留文字标签；不引入外链/字体。
5. **闭合未定义变量**（§5）。

## 5. 迁移映射表（骨架；实现期以全仓 `var()` 清点补全，G2-A05）

动作码：`alias`（旧名保留为同值别名）/ `close`（补定义闭合）/ `new`（新增语义）/ `keep`（局部保留不动）。

| 现存 token | 动作 | 新语义层落点 | 说明 |
|---|---|---|---|
| `--pm-accent/--pm-blue/--pm-blue-hover/--pm-blue-soft` | alias | `--pm-accent` | 旧名保留 |
| `--pm-ink/--pm-secondary/--pm-muted/--pm-line/--pm-line-soft/--pm-hover/--pm-surface/--pm-canvas/--pm-danger/--pm-success/--pm-warning/--pm-on-primary/--pm-link` | alias | §1.2 新语义名 | 旧名 = 同值别名 |
| dsh-flat `--ink/--ink-2/--muted/--faint/--surface/--surface-2/--surface-3/--line/--line-2/--line-3/--c-done/--c-prog/--c-block/--c-late/--c-todo` | alias | 同 §1.2/状态色 | 旧名保留，不删 |
| `--c-link`（tasks.css 3 处，未定义） | **close** | `--pm-link` | 闭合并改指链接语义 |
| `--hover-bg`（5 处，无 fallback） | **close** | `--pm-hover` | 多视图 chip/行 hover |
| `--line-soft`（6 处，未定义） | **close** | `--pm-line-soft` | 分隔 hairline |
| `--pm-border`（5 处，无 fallback） | **close** | `--pm-line` | 边框 |
| `--pm-bg`（2 处，无 fallback） | **close** | `--pm-canvas/--pm-surface` | 菜单底 |
| `--pm-text`（3 处，无 fallback） | **close** | `--pm-text` | 文本主 |
| `--pm-line-strong`（9 处，无 fallback） | **close** | 中性 idle/灰（宿主 idle 别名） | 待办点/里程碑节点 |
| `--pm-accent-soft`（2 处） | **close** | `--pm-tint-accent` | 链接 chip 浅底 |
| `--pm-faint`（带 fallback） | **close** | `--pm-faint` | 补正式定义 |
| `--pm-ink-muted/--pm-progress/--pm-surface-muted`（带 fallback） | **close** | 对应语义 | 补定义 |
| `--sp-*/--t-*/--r-*/--ls-*/--ease/--z-*` | keep | 保留 | 间距/字阶/圆角/动效/层阶，不动 |
| `--pm-st-*`（板卡预测状态色，panel.css 1868+） | keep | 不动 | 板卡局部调色，本批不统一 |
| `--ov-lamp/--diag/--unscheduled`（视图局部） | keep | 不动 | 局部组件 token |
| `--pm-chart-s1..s3` | new | 图表序列 | 启用；`--pm-chart-s4` 不定义、不启用 |
| `--pm-ai-*` 三槽位 | new（仅定义） | 未来 P2-6 | 不启用 |

## 6. 门与限制（对应测试计划 G1–G5）

- G1：`pnpm run build` / `pnpm test`(+coverage) / `verify-isolation` 全量 / `pnpm e2e`（SKIP 须 exit 0 诚实标注）。
- G2：迁移映射全覆盖、旧别名同值可解析、零未定义 var、宿主别名优先、计算 AA、零暖色/新品牌/渐变/光晕。
- G3：浅/深 × 1440/768/390 真实浏览器逐视图目视（独立测试专家执行；开发只做截图自查）。
- G4：P0/P1 已 PASS 项零回退（主按钮中性、浅色对比、甘特三态/关键路径、抽屉校验/Notice、看板互斥、
  空态诚实、AI 草稿不落库、390 回流、全局密度、项目下拉消歧）。
- G5：结论绑定被测 SHA + 工作树指纹；真实/模拟分开；MANUAL_PENDING 只留给用户本人项。

### 已知限制（不默默跳过）
- 当前执行通道无法采集真实浏览器视觉证据；本批以宿主只读主题源码与已认可批次截图作为静态基线，
  浅/深 × 三视口的真实浏览器目视门（G3）由独立测试专家在取得独占后执行，开发侧不以静态计算替代目视结论。
- 深色次文本/状态色以宿主别名已调优值为准，开发侧只做计算复核，不重调暗色板。
- 本文件陈述的对比度、层级与 token 解析均为**设计约束与静态计算结果**；未经真实浏览器取证的外观效果，
  不在本文件表述为「已通过」或「已达标于界面」。

## 7. 外部设计方法留痕（如何影响本批决定）

- 引入的外部设计参考包均已做完整性与边界校验（清单与字节一致、无越界文件），具体校验过程属内部记录，不在此展开。
- **通用可用性清单（采纳）**：正文/链接 4.5:1 对比度、可见焦点态、尊重减弱动效偏好、图标用 SVG 而非 emoji、
  悬停反馈 150–300ms；这些已落入 §1 约束。其营销首页式（紫色品牌、衬线展示字体、证言大图）方案与离线专家工具定位不符，**不采纳**。
- **视觉工艺审计（采纳）**：最小干预、保护已可用项、把重复出现的分歧聚类为系统漂移；密集专家工具不拉高行高/卡片高，
  容器为结构而存在，边框与阴影不同时上——已落入 §1.1/§1.3。
- **设计系统评审（采纳）**：primitive→semantic→component 按需分层、按意图命名、暗色不是机械反色、
  旧别名先建迁移图再渐进迁移、所有状态纳入组件契约——已落入 §2 与迁移映射表。
- **AI 产品设计（仅预留）**：仅用于为未来 P2-6 预留人工/证据/生成/已核区分、来源可见、拒绝与撤销的槽位，本批不实现。
- **产品发布范围方法（采纳）**：in/out-of-scope 表、保留质量门、把未决项显式标注为待决策，已用于 §0 与本批边界。
- 冲突处置：外部建议与仓库硬规则/宿主主题冲突时，以仓库为准，已在 §1/§2 落地。

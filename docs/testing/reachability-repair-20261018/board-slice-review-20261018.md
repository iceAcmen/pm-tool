# Board 切片独立评审（queue 聚合 / 队列卡 / 显式加卡）— 2026-10-18

> 独立测试专家只读审证；未改生产源码、未提交。范围仅限已交付 board 源码：
> `queue-aggregate.ts` / `queue-aggregate.test.ts` / 重写 `queue-card.tsx` / `BoardBento.tsx` 增量。
> panel 侧（nav/inbox/K13）仍 WIP，不在本切片；**本切片结论 ≠ 全局 PASS**，GUI 证据仍 PENDING。
> 审证时点工作树含作者 WIP，未对半成品下 FAIL。

## 1. 独立执行的自动化

- `npx vitest run src/client/board/queue-aggregate.test.ts` → **17/17 PASS**（本层独立复跑，非引用作者结论）。
- 全量 build / 438 tests：待 panel 收口后在交付提交上复跑，本切片不代判。

## 2. 已核对通过（静态 + 单测）

### 2.1 注册表 / 重复（对 C1）
- `WIDGET_REGISTRY` 原本已含 `queueCard`（根因不在注册）；`WIDGET_CATALOG` 由 registry 派生，添加目录可列出。
- 编辑器 `addWidget` / `addWidgetAt` 均有单实例守卫 `draft.widgets.some(w => w.type===type) → return`，编辑器路径不会重复加 queueCard。
- 浏览态「＋ 添加补记队列」按钮在 `hasQueueCard`（任一 `type==='queueCard'`）为真时隐藏，双路径都防重复。

### 2.2 显式加卡 / 位置不变 / 失败处理（对 C5）
- `adoptQueueCard` 只在末尾空闲行追加：`y = max(y+h)`、`x=0`、旧卡位置/尺寸/配置一律不动，不触发重排。
- 失败：`execute` 在 `kind='error'` 时 throw（client/index.tsx:28）→ catch 落到错误 banner，`setLayout(next)` 不执行，无乐观改写、不留半成品布局。
- 成功：`onSave('user', next)` 后才 `setLayout(next)` + 成功 banner。
- 作用域语义：取 resolveDashboard 结果（user>project>fallback）复制后强制 `scope:'user'`；后端 `dashboard put` 轻校验（version 整数、widgets 数组），`execute` 错误会抛；保存后 user 层优先于 project（persist.ts 三层回退）。

### 2.3 聚合（项目/全局 scope）
- 跨项目合并 `Record<projectId,Queue>`，条目携带 `projectId/projectName`（由 `data.projects` 建名表）；看板为跨项目全局视图，聚合口径正确。
- 排序 blocked > p0 > late（lateDays 降序）> due（dueDate 升序）> taskId 兜底，与后端 severity 序一致。
- quietMode：任一项目静默即全局降级 → top 置空、全部并入 rest 折叠列示（注释说明静默窗为全局设置）。
- mute：非豁免退出 top 仍留 rest；blocked 或 lateDays>0 豁免进 top（`isExemptFromMute`，有单测）。
- 顶层三态区分：`missing`（无 queue 字段）/ `malformed`（queue 非对象）/ `ready`（含空对象），不拿假空态冒充。

### 2.4 卡片呈现（对 C3/C4）
- missing / malformed 分支给中性提示，**不显示「暂无条目」假空态**；ready 空才显示诚实空态。
- 静音按钮仅在命令通道就绪时渲染（`channelReady`），通道缺失不渲染僵尸按钮；busy 禁用。
- 「打开」走 `actions.openRecord(projectId,'task',taskId)` 直达，不新建写路径。
- 后端字段镜像核对：`core/queue.ts` 产出 taskId/title/status/priority/dueDate/progress/severity/lateDays/muted/absent/mutedUntil/backlog/quietMode/openedAt/top/rest，与 `queue-aggregate.ts` 宽松收窄一致。
- CSS 类（pm-queue-card/empty/quiet-banner/summary/chip/rest/toggle/tag/badge/btn-mute）在 panel.css 均存在。

## 3. 已由组织者发作者必修（本层不重复开）

- **M-1（必修，已闭环 2026-10-18 晚）**：子项目级坏数据被无声吞掉后落 ready 空。作者已修：`{p:null}`/`{p:{bad:1}}` → malformed；混合坏项 → `partial` 提示保留好项；结构合法但条目全坏 → ready 空 + partial banner；`queue-aggregate.test.ts` 17/17 绿（本层复跑）。
- 复审新见已闭环：
  - **N2（已修）**：partial + 有效空 改为独立文案「有效数据中暂无条目 / 仍有部分异常未能读取，无效部分已跳过」（queue-card.tsx:166-170），非 partial 空态保留「暂无到期未达条目」，不再同屏误导。
  - **N3（已修）**：partial banner 复用 `.pm-queue-quiet-banner`，死修改类已从卡片与 CSS 删除。

## 4. 新观察（轻微，非阻塞，交作者裁量；不要求带病豁免特批）

| # | 级别 | 观察 | 建议 |
|---|---|---|---|
| O1 | S3 低 | 聚合丢弃每项目 `openedAt`，卡头不再显示旧卡/§2.3 的「上次打开 HH:MM」，只剩静态「打开时整理」 | 决定恢复展示还是显式裁剪；非可达性阻塞 |
| O2 | S4 低 | 加卡用固定实例 id `w-queue`；若既有布局（手改/遗留）已占 `i='w-queue'` 但为别的类型，追加会 RGL key 重复 | 仿编辑器 `nextId()` 生成唯一 i |
| O3 | S4 提示 | mute 失败靠全局 panel 消息（`run()` 吞错返回 bool，卡片忽略返回值仍调 refreshBoard）；且 `run()` 已刷新，卡片 refreshBoard 冗余 | 卡片读返回值 announce 失败 / 去掉冗余刷新 |
| O4 | 观察 | 从 project/fallback 采纳会把快照冻结进 user 层，后续 project 层修改不跟随 | 标准个人化语义，建议在文档写明预期，非缺陷 |

## 5. 本切片未覆盖（待后续）

- 全量 build / vitest 438 绿复跑（待 panel 收口、在交付提交上做）。
- GUI：C1 添加目录可见、C3 填充态非假空、C5 保留旧布局+显式加卡跨刷新、C6 675/390 不溢出——主端采证后专家审，当前 PENDING。
- panel 侧 nav 入口、OKR/习惯 inbox 透传、K13 副驾投影、原生聊天边界——另一切片。

## 6. 切片结论

board 切片静态 + 定向单测**通过**；M-1 必修闭环前，board 相关 GUI 门保持 PENDING，**不盖全局 PASS**。

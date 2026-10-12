<!--
产出角色：资深产品经理
日期：2026-10-12
基于提交：882fda4
变更摘要：⑤ 分版本迭代规划 + 任务拆解。本表为 PROD 编号的**唯一权威定义**；03/04 中提到的代号如与本表不一致，以本表为准。
-->

# 05 · 分版本迭代规划 + 任务拆解

> 本文是**机器可读的需求/任务表**。新需求统一用 `PROD-xx` 编号（与既有 R##/ADL-###/KB-###/OPT-## 不冲突）。
> 列含义：编号 | 类型 | 优先级 | 解决痛点(UX-##) | 方案摘要 | 影响模块/文件 | 成本 | 风险 | 依赖 | 所属迭代 | 验收标准。
> 成本：S≤2 人日 / M 3–6 人日 / L 1–2 周 / XL>2 周。优先级 P0/P1/P2。

## 一、迭代划分总览

| 迭代 | 主题 | 是否改 schema/domain | 包含 PROD |
|---|---|---|---|
| **v0.4.0 速赢** | 纯前端、零 schema、立刻提效 | 否（domain v1 不动） | PROD-02, 08, 09, 10 |
| **v0.5.0 核心体验** | 把 PM 高频视图做对 | 否（order 重排小改 core） | PROD-01, 03, 04, 06, 07, 05 |
| **v0.6.0 架构演进** | domain v2 + 排期可视化 | 是（新增可选字段，向后兼容） | PROD-11, 22, 21, 23 |
| **v0.7.0+ 旗舰** | AI 副驾升维 | 否（只读 snapshot + 草稿写） | PROD-20 |

---

## 二、需求任务表（权威）

| 编号 | 类型 | 优先级 | 痛点 | 方案摘要 | 影响模块/文件 | 成本 | 风险 | 依赖 | 迭代 | 验收标准（可测试） |
|---|---|---|---|---|---|---|---|---|---|---|
| PROD-02 | 增量 | **P0** | UX-03/04 | 提醒条 & 全局搜索命中携带 type+id，点击切项目+切tab+打开对应抽屉 | `panel.tsx` ReminderStrip/GlobalBoard；新增 `onOpenRecord(type,id)` 回调串通 PmPanel | S | 低 | 无 | v0.4.0 | 点一条「逾期任务」提醒：切到该项目、自动切「全部任务」tab、右侧打开该任务抽屉；全局搜索点一条里程碑命中同理；verify-web 断言选择器 |
| PROD-08 | 增量 | P2 | UX-15/16 | 顶栏低频按钮(备份/恢复/导出MD/导出JSON)收进「⋯更多」菜单；view tab 用 localStorage 记忆 | `panel.tsx` pm-top-actions | S | 低 | 无 | v0.4.0 | 顶栏主区只余 AI/新建/更多/刷新；备份/导出在「⋯」内可用；切项目后回到上次 tab |
| PROD-09 | 增量 | P2 | UX-13 | 汇报表每行与上一份比完成率/逾期/异常数，加 ↑↓ 徽标 | `panel.tsx` ProgressReportTable | S | 低 | 无 | v0.4.0 | 相邻两份汇报，完成率变化有方向徽标；仅 1 份时不显示 |
| PROD-10 | 增量 | P2 | UX-14 | 任务详情抽屉显示「来自会议 mtg-xxx」（前端反查 meetings.actions[].taskId） | `panel.tsx` TaskForm | S | 低 | 无 | v0.4.0 | 由行动项 promote 而来的任务，抽屉显示来源会议链接，点击打开该会议 |
| PROD-01 | 增量 | **P0** | UX-01 | 任务表默认树视图(父子/折叠)，状态分组降级为可切换「树\|看板」 | `panel.tsx` TaskTable/TaskGroup；新增树构建 | M | 中 | PROD-03 键盘兼容 | v0.5.0 | 默认按父子渲染可折叠；状态看板仍可切换；j/k 导航在树下仍正确；verify-keyboard 补用例 |
| PROD-03 | 增量 | P1 | UX-05 | 任务行状态/进度/截止单元格行内编辑，不开抽屉 | `panel.tsx` TaskGroup；复用 `task update` | M | 中 | 无 | v0.5.0 | 行内改状态立即落库并刷新；弹层不与 j/k 冲突 |
| PROD-04 | 增量 | P1 | UX-06 | Web 暴露「移动到…」改父（拖拽为增强）；core 补同级 order 插序 | `commands/task.ts` move 分支；`core/tasks.ts` moveTask/order；`panel.tsx` 任务行菜单 | M | 中 | PROD-01 | v0.5.0 | 网页上把任务 A 移为任务 B 的子任务成功且不产生环；同级插序后 code 重排正确；verify-cascade 扩展 |
| PROD-06 | 增量 | P1 | UX-09 | 从现存 owner/assignee/participants 去重生成人员候选，输入框自动补全+归一化 | `panel.tsx` ProjectForm/TaskForm/RiskIssueForm；datalist | M | 低 | 无 | v0.5.0 | assignee 输入可下拉选已有人员；新人员可手填；trim 归一 |
| PROD-07 | 增量 | P1 | UX-09 | 总览看板加「按人」子tab：选人→跨项目未完成任务+临期/逾期 | `panel.tsx` GlobalBoard | M | 低 | PROD-06 | v0.5.0 | 选人后列出其跨项目未完成任务，逾期置顶 |
| PROD-05 | 增量 | P1 | UX-07/08 | 项目概览升级：接下来14天条带+里程碑时间线+概率×影响风险矩阵+异常Top5 | `panel.tsx` Overview | L | 低 | PROD-02(日程条带直达) | v0.5.0 | 概览含三块新区；风险按概率/影响正确落格；条带项可点直达 |
| PROD-11 | 增量(演进) | P2 | UX-12 | 任务新增 `predecessorIds[]`（可选依赖），domain v2 向后兼容旧记录 | `core/task.ts` schema；`core/storage.ts` domain version→2；命令 task 表单 | M | 中 | 无 | v0.6.0 | 旧 v1 记录读回不报错；新任务可设前置依赖并做环检测；不设依赖时行为不变 |
| PROD-22 | 颠覆 | P1 | UX-02 | 甘特排期台A：任务按起止画条、里程碑菱形，拖拽条=改日期 | `panel.tsx` 新 GanttView 组件 + task update 日期 | M-L | 中 | PROD-05 时间线经验 | v0.6.0 | 每个未完成任务按 start/due 画条；拖拽后日期落库；里程碑落在轴上 |
| PROD-21 | 颠覆 | P2 | UX-11 | 任务/交付物加可选 repoUrl/branch 字段，UI 渲染成可点链接（仓库联动A） | `core/task.ts`/`deliverable.ts`；`panel.tsx` 详情 | S-M | 低 | 与 PROD-11 同批 v2 | v0.6.0 | 任务可填仓库/分支链接并可点击打开；为空时不显示 |
| PROD-23 | 颠覆 | P2 | Persona B | 项目健康分(0-100,可解释)+红黄绿灯+一键周报草稿 | `core/stats.ts` 派生公式；`panel.tsx` 概览灯号 | M | 低 | 无 | v0.6.0 | 健康分=确定公式可复算；逾期/高影响风险扣分可见；周报草稿复用 narrate |
| PROD-20 | 颠覆 | P1 | UX-10 | AI 项目副驾：对话式读 snapshot→诊断→把改动做成确认草稿卡 | 新命令 `/pm ask`；`core/` 新增 ask 编排；`panel.tsx` 对话抽屉 | L | 中 | 生产车道Key | v0.7.0+ | 提问给中文结论(只读)；任何写动作渲染成草稿卡需确认才落库；无Key/失败降级 |

---

## 三、MVP 快速项 vs 长期重大改版

**MVP 快速项（v0.4.0，纯前端、本周可上）**：PROD-02、08、09、10。
**核心体验（v0.5.0）**：PROD-01、03、04、06、07、05。
**架构演进（v0.6.0，才动 schema）**：PROD-11、22、21、23。
**长期旗舰（v0.7.0+）**：PROD-20。
**标记为长期观望、本期不排**：仓库联动 B（Git 自动桥）、甘特 B（关键路径自动排期）。

## 四、编码落地提示（给研发）

- **统一写通道**：所有面板动作走 `execute('/pm ...')`；读走 `web snapshot`。新增前端交互优先复用既有命令，避免新增后端命令。
- **稳定选择器**：新增控件务必加 `data-*`/语义 class（仓库惯例，verify-web 依赖契约）。
- **domain v2 兼容**：v0.6.0 新增字段全部 optional，读旧记录（无该字段）不得报错；storage.ts version 升到 2 并在 decision-log 记一条 ADL。
- **verify 脚本**：每个 PROD 至少补一个 `scripts/verify-*.mjs` 或扩展 verify-web/verify-keyboard。
- **不要碰**：另一开发线正在修的 OPT-03 持久化、OPT-11 空态 CTA 相关文件；本批只在 `docs/product/` 新增。

## 落地状态勘误（v0.4.1-integration @ 9f6a6cf，未 tag）
- PROD-22 甘特方案A（只读+拖拽改期，无关键路径）已实现未发版；PROD-20 副驾 MVP（只读诊断+确认草稿卡+ask-apply 后端守卫）已实现未发版。
- 本轮 35 verify + 非GUI集成通过；真实浏览器 GUI 端到端未跑（工具受限），关键 GUI 清单待独立验收。
- 下一步起点：PROD-11 关键路径/甘特B、崩溃原子恢复、副驾多步规划，均属 v0.6 架构演进。

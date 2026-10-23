# 已有行动项、清单和导入入口缺口收口

父授权为全部在途验收及确证缺陷修复，最后统一提交。依据独立专家 `docs/testing/a8-layer-gap-contract-review-20261021.md` §4：LG-01/01b、LG-04、LG-05 为旧承诺缺陷；不补 owner popup、不做未保存会议原子行动项、不扩 U4。

1. 会议开发只认领 `src/client/views/records/records-meeting-form.tsx`、`src/client/views/meetings.tsx`、必要 `src/client/shared/records-props.ts` 和同范围测试；Main负责 `panel.tsx` 透传。恢复既有主保存草稿、同项目任务/issue选择与解除；用既有action命令，失败保输入不关闭，不改schema/领域/跨动作事务。先独立原probe保红，再作者修绿，独立专家复验。
2. 导入开发只认领 `src/client/views/tasks.tsx` 和新的对应真实组件命令测试。原preview保持演练，confirm加原有末尾 `confirm`；错误保预览，串行busy防重。CSV/XLSX解析与后端不改，取消零写、合法两层输入落盘和重进。
3. Main独占 `panel.tsx` TaskForm，使用既有leaf清单 stable ID/text 和 `task checklist toggle` 目标态命令。显式勾选才写、失败不假勾、父任务只读、空态诚实，不改status/manual/legacy/核心派生。不创造自由清单设计器。真实组件/OP定点回归。
4. 继续 Main 唯一隔离builder/GUI，A8旧候选原证保留；新独占源全部收束后重新冻结并build新实例。按 LG-G01/01b/04/05 完整页面动作补件，独立判定；受影响回归和最后全集/全部verify后才统一普通commit。不push/tag/正式切换。

环境为 macOS、nvm Node22、pnpm11.28.5。已用 brainstorming/writing-plans 核已有目的、边界与最小方案；frontend-design 仅用于现有样式/可达性，不改产品设计矩阵。

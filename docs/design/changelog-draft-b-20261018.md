# Changelog 草稿（B 方 · 2026-10-18 体验修复）

> 仅草稿，供合并时定稿；不改 A 的 system spec/AGENTS。基线 HEAD `6b0d2a3`。

## 修复（P0-03/04、P0-09、副驾/看板/反馈）

### AI 副驾（合同 §3，R-S1–R6）
- 副驾从 flex 兄弟改为 Portal `position:fixed` 浮层（`role=region`，非 modal），开关前后主列宽完全一致，不再挤压主内容。
- 桌面 420–560px 可调（默认 480，右缘手柄热区 12px/可视 8px），宽度持久化到 `pm.sidecar.width`。
- 最小化为 40px 竖标签（保留上下文）；ESC 关闭并归还焦点到开关按钮；内部滚动。
- 响应式：≥980 右侧浮层；560–979 底部 sheet ≤45vh；<560 全屏。

### 总览看板（合同 §4，R-B1–B12）
- 编辑器响应式断点列数 12/8/4/单列（≥1200/≥996/≥768/<768），替代固定 cols=12。
- 保存前 bbox 碰撞检测，重叠整批拒存；持久化前 sanitize：未知类型跳过并列名、越界夹紧、碰撞垂直下沉，不静默重置。
- 撤销栈 ≤20 步（离散动作入栈）；两步保存（落盘 → 快照刷新成功才 setLayout + 成功提示）；重置二次确认；卡体 `min-height:0 + overflow-y:auto`。
- **R4 修复**：首屏在 registerKnownWidgetTypes 副作用前用空 KNOWN_TYPES 误判全部未知；改为显式传 knownTypes，11 类旧卡原样渲染，未知类型合并单条非阻断摘要。菜单「AI 副驾 · 内嵌」更名「AI 副驾 · 侧边」。

### 反馈分型（合同 §5 / J5）
- **J5 反馈分型**：命令层成功用 `[pm:summary]`/`[pm:detail]` 信封分离；纯函数 `parseFeedback` 分型，无信封的既有命令原样回退（不被吞）。成功提示 ≤2 行、无 HTML/MD/完整实体/内滚、3s 自动消失；完整字段进独立可展开详情卡（限高滚动）；错误集中判定、持久单处。
- task update 成功短摘要：`任务已更新｜<id> <标题>` + `已修改：…`；保存成功后抽屉关闭、finally 复位提交态，不卡「提交中」。
- 原生 `window.confirm` 清零：12 处全部换自定义 ConfirmDialog（`confirm-dialog.tsx`），展示对象类型+标题+ID+级联/影响数，danger 确认、ESC/取消、焦点归还、防重复；备份/转任务/删已保存视图为中性确认。
- 破坏性动作（看板重置）武装态二次确认；错误单处持久提示。

### P0-04 capture（合同 §7）
- 草稿稳定句柄 `draft-<ts>-<seq>`（10 分钟内存 TTL）；内嵌副驾草稿卡「确认落库」按钮等价 `capture-apply <项目> <draftId>`，预览候选、成功结果卡 + 撤销出口，免抄命令/JSON；保留内联 JSON 高级路径。
- 副驾 plan 块误贴：分类为 copilot-plan，固定恢复文案、零写入、指路二选一。
- 整批预校验通过才写，任一不合法整批拒绝；draftId 过期/不存在给重试指路；失败保留草稿可重试/放弃。

### P0-09 metric（合同 §6.2）
- 裸 JSON 对象（可 `JSON.parse`，机器契约不变）内含人读 `summary`（中文类型计数/采纳步数/撤销/最新时间，简短独立、不复制原始字段名）+ 原始计数字段，小样本不下结论。

## 测试
- 单测：45 文件 / 487 通过（基线 458；新增反馈分型/metric 契约/看板 registry 同源/旧布局 fixture/J5 真实链/DEF-B1 knownTypes 钉住等）。**DEF-B1**：`Object.keys(Map)` 恒为 [] 致 11 类全跳过，改同源 `knownWidgetTypeSet()` 迭代 `WIDGET_REGISTRY.keys()`；verify-client-bundle 加构建产物运行时断言（keys=16、kept=8、skipped=0、未来未知仅跳 1）。J5 真实链：内存隔离 domain 调真实 `handleTaskCommand('update …')` 得 CommandResult，再走与 panel 同一生产函数 `classifyFeedback`，断言摘要≤2 行/无 details·任务ID·围栏、完整字段仅进 detail、成功 TTL=3000、错误持久。
- 隔离门 88/88 通过，正式 data/backups/exports hash+mtime 零污染；新增 `verify-no-native-confirm.mjs`（window.confirm=0）。p1c-integration 固定 sleep(80) 竞态改为轮询等待（仅测试健壮性，非产品改动）。

# Oil `review` 同页评审 · task 抽屉（04 资料 / 05 进展）源码静态，像素待 Main · 2026-10-20

> 方法：官方 Oil `review` 模式（P0/P1/P2 + 一行证据 + 可执行修复 + verification checklist）。项目判为 **C 成熟**（已有 `--pm-*` token、成熟引擎、对比度/迭代痕迹），**只对照本项目自己的设计语言，不套任何 Style Family**。本件为源码静态评审，**不替代 Main 真实前后像素**；GUI 未采证前所有 observed 项标 Needs verification。Oil 结论只作候选缺陷，定级仍归独立测试门。

## Context
- Surface：桌面 web，task 新建/编辑抽屉（form/detail），规划 04 资料区 + 05 进展日志。
- Primary user task：给任务挂已有交付物/安全链接、记一条进展并本地保存。
- Primary CTA：抽屉底部「保存」primary；区内「＋关联交付物 / ＋添加链接 / ＋记一条进展」。
- Constraints：B2 后端 atomic ready、UI 未接线；不做真文件（B3/U2）；local-first；取消零写。

## Findings

### P1（important）— 04/05 两区缺 success 与 permission-denied 显式状态（Hard Rule 2 状态覆盖）
- Evidence：现 `panel.tsx` 内 success `notify` 仅见于口径设置/恢复默认（1541/1556），stale banner+retry（882-883）、error `role=alert` 路径存在；但资料多选保存、进展追加/编辑成功，以及「能力待接入/无权限」置灰态在当前源码无对应显式状态。
- Diagnosis：evaluation gulf（保存后看不出 did it work）。
- Why it hurts：多引用/日志保存后用户无法确认是否落库，易重复提交。
- Fix：UI 接线时为「资料已保存 / 进展已记录」给 `role=status` 短回执（3s），完整结果进结果卡；无权限/待接入区按规格 §2.6③ 置灰并写原因，不放假按钮。
- Acceptance check：保存成功有可见回执+清单更新；拒绝态有原因；Main 截图回填。

### P1 — 反馈闭环三问未显式覆盖（Hard Rule 5）
- Evidence：规格 §2.2/§3.3 定义了打开/复制/移除/预览/取消动作，但源码未见「保存后 what changed（新增了哪几条）+ what's next（可继续记一条/关闭）」闭环。
- Diagnosis：evaluation gulf。
- Fix：保存后回执点出变更摘要（如「已关联 2 项交付物 · 新增 1 条进展」），移除仅断联给中性回执且不删源；取消明确回到列表且零写（快照比对）。
- Acceptance check：动作后能回答 did it work / what changed / what's next；取消前后存储 diff=0。

### P2（polish）— 约束先于提交、可点性 signifier（Hard Rule 3）
- Evidence：非法协议（javascript:/data:/ftp:）就近 `role=alert`+保输入已在规格；现网 icon-only 关闭/清空按钮均带 `aria-label`（3257/3160/2255），应保留。
- Fix：URL 输入框提交前就近提示「仅 http/https」；必填（日期/作者/正文）在聚焦时给 L1 内联提示，错误时标红+首错聚焦；保持 icon-only 一律带可见文字或 aria-label。
- Acceptance check：格式/必填约束在提交前可见；无裸图标歧义。

### P2 — 一致性与间距刻度（Hard Rule 6/8）
- Evidence：资料行/日志条目须复用 `--pm-surface/--pm-line` 与既有 8px 刻度、圆角 8/12，不另造色板。
- Fix：两区卡片与现有抽屉 FormSection 同间距/同密度；长 MD 走单一安全 renderer，密度只改排版。
- Acceptance check：与 01–03 节并排无突兀间距/色值；静态 token 抽查。

## 不计为缺陷（正例，保留）
- stale 旧数据保旧内容+标陈旧+retry（panel.tsx 670/882）；非法协议/失败保输入；串行写+busy 守卫；链接安全 renderer；icon-only 均有 aria-label。

## Verification checklist（Main 采证后逐条勾）
- [ ] 主 CTA 单一明显（保存）
- [ ] loading / empty / error / success / permission-denied 五态齐备
- [ ] 动作后反馈闭环（成功了吗/变了什么/下一步）
- [ ] 跨区组件与文案一致
- [ ] 可点元素有 signifier，icon-only 有标签
- [ ] 错误可预防+可恢复+给修复方向
- [ ] 默认值/渐进披露降低负担
- [ ] CRAP：层级/对齐/间距/成组有意
- [ ] 无 emoji 混搭、图标成套

## Needs verification（不冒 PASS）
- Ego CU 已观察「输入后 cancel 抽屉仍在」——**不等于取消零写 PASS**，须存储快照 diff=0 才算；该 harness 为旧共享壳，非最新生产/认可 design 验收。
- 所有像素/对比/390/200% 待 Main 隔离 candidate 采证；本件仅源码静态候选清单。

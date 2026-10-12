# R3-UX-001 GUI 终验事实记录

> 本文件只记录事实，不给 PASS/FAIL/BLOCKED 判定。判定权归独立测试专家。

## 运行候选指纹

- baseCommit: `d88a3325275878a77129179dbf8578a25c5e6511`
- workingTreeCandidate: true
- lib/client.js SHA256: `07c3edb2c8f4f40b54bfb7473b77e287e9323367f5177d953796a4d4b767da14`
- lib/index.js SHA256: `64a48aecf941057f75df5e0906dba66622d42f464cd97b51261ff9a370e7b7e8`
- lib/core/drawer-focus.js SHA256: `60d1e11fdee3bc7ae3c7a9f13cc5ef9489e3444bc3e0cee2bd9634f25e29aa86`
- 实例: 隔离 3091，PID 76612，DSH_HOME/backups 均隔离
- 运行开始 UTC: 2026-10-12T18:54:55Z

## 项目表单（R3-UX-001 核心）

### 空提交
- form noValidate=true；name/startDate/targetDate 均 aria-required=true
- 必填星号 3 个（.pm-field-required, aria-hidden=true）
- 空提交后焦点落在 INPUT name="name"（首个错误字段）
- 3 条持久内联错误（role=alert, .pm-field-error, visible=true）：
  - project-name-error: "项目名称不能为空"
  - project-start-error: "请选择开始日期"
  - project-target-error: "请选择目标日期"
- 错误字段 aria-invalid=true，aria-describedby 指向对应错误 span id
- console 0 错误；projects/ 零写盘

### 输入纠正清错
- name 输入 "UX-R3-测试项目" 后，project-name-error 实时消失（aria-invalid 移除、aria-describedby 移除、span 不可见）
- start/target 错误仍保留（仅 name 被纠正）

### target<start
- startDate=2026-12-01, targetDate=2026-10-01 提交
- targetDate 错误: "完成日期不得早于开始日期"（role=alert, aria-invalid=true, aria-describedby=project-target-error）
- 焦点落在 INPUT name="targetDate"

### 成功创建+删除清理
- 填齐 name/startDate/targetDate → 按钮提交成功
- toast: "项目已新增并保存。"
- projectSelect 出现 p-0003:UX-R3-测试项目
- GUI 编辑项目 → 删除 → 原生 confirm accept → toast: "项目已删除：p-0003｜UX-R3-测试项目。"
- projectSelect 恢复 p-0001/p-0002
- collect-evidence final.diff: cancellationUnchanged=true（27 unchanged, 0 added/modified/deleted）

### Enter vs 按钮
- 按钮 type="submit"，点击提交成功
- bu.press_key("Enter") 在输入框中未触发表单提交（合成事件限制，非产品行为判定）

## 里程碑表单

### 空提交
- title/targetDate aria-required=true；必填星号 2 个
- 空提交焦点落在 INPUT name="title"
- 2 条持久错误：milestone-title-error "里程碑标题不能为空"、milestone-target-error "请选择目标日期"
- aria-invalid=true, aria-describedby 正确

### 成功创建+删除清理
- 填齐 title/targetDate → toast: "里程碑已新增并保存。"
- 列表出现 m-0002:UX-R3-测试里程碑
- GUI 编辑 → 删除 → confirm accept → toast: "里程碑已删除：m-0002｜UX-R3-测试里程碑。"
- 列表恢复 1 条记录

## 主题对比度

### 浅色（当前主题，bodyBg=rgb(255,255,255)）
- 错误文字色: rgb(97,102,107) on 白底 → 对比度约 5.77:1
- 错误边框色: rgb(236,19,19) 1px on 白底 → 对比度约 4.51:1
- 截图: 07-light-theme-errors.png

### 深色
- NOT_RUN：当前 UI 无可靠主题切换开关（dsh 主题由系统/设置控制），未伪造

## 其他实体表单回归

- 任务编辑抽屉：inputCount=6, requiredMarks=0, visibleErrors=0, ariaRequired=0, ariaInvalid=0, formNoValidate=false
- 无意外错误星号/aria 属性泄漏到其他实体表单

## 焦点键盘复验（新 bundle）

### Esc 焦点归还
- title 路径：点击任务标题 → Esc → activeElement=BUTTON "逾期任务" (pm-title-cell)
- edit 路径：点击编辑按钮 → Esc → activeElement=BUTTON (pm-row-button)
- create 路径：点击添加记录 → Esc → activeElement=BUTTON "添加记录" (pm-add-button)

### 键盘导航
- Enter: isTrusted=true, target=BUTTON.pm-title-cell, 打开抽屉
- KeyJ: NOT_RUN（bu.press_key 未产生到达 document 的 trusted keydown）
- KeyK: NOT_RUN（同上）

### 删除 fallback
- 项目 p-0003 / 里程碑 m-0002 删除后抽屉关闭，activeElement 不在 body 上
- collect-evidence final.diff cancellationUnchanged=true

## 390 viewport / Space
- NOT_RUN（真 viewport 390 CDP 不可用；Space 按键事件未到达）

## console
- 整轮测试 console error = 0（初始 reload 连接噪声已记录为基线，后续交互 0 新错误）

## 零污染证明
- collect-evidence before → final diff: cancellationUnchanged=true, 27 files unchanged
- 正式 data/pmtool/ 未触碰

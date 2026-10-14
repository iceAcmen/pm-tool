# v0.7 T7/T8 独立 GUI 采证摘要

被测基线：`lib/client.js` sha256=`e75ee229a067b64f8c8d546410ec50ba19f723acfca405ceeb1111a62135cfbd`，HEAD=37cbcca。隔离端口 3096（独立 DSH_HOME/data/backup），正式 3080/3091/data 未触碰。只采事实，不判矩阵、不改产品/提交。

## T7-W5 任务/交付物 repo 链接只读行
- 任务 t3（项目A）详情抽屉顶部只读链接行：`data-repo-link` div 文本=`https://github.com/org/r.git@main`，内层 anchor href=`https://github.com/org/r.git`、target=`_blank`、rel=`noopener noreferrer`。截图 `T7-W5-task-detail-link.png`。
- 交付物 d2（项目B）详情：`https://gitlab.com/org/d.git@develop`，anchor target=_blank/rel=noopener。截图 `T7-W5-deliverable-detail-link.png`。
- 重启宿主后重开 t3：值未变（同 @main/href）。截图+txt `T7-W5-restart-readback.txt`/`.png`。

## T8-W2 点选候选回填
- 执行人 input `list=pm-assignee-list`，初始值=`alice`。datalist DOM options=`['Alice','Bob','张三,李四','张三']`（项目A可见来源）。截图 `T8-W2-datalist-open.png`。
- 选 Alice 后 input 回填显示 `Alice`（原始大小写形态）。截图 `T8-W2-after-select.png`。

## T8-W4 候选随 snapshot 刷新
- 重启后 datalist 候选变为 `['Alice','Bob','新人王五','张三,李四','张三']`：保存的自由名 `新人王五` 出现；`alice/ALICE/'  alice  '` 写法未单独出现（已合并进 Alice）。

## T8-W6 归一+自由输入落盘
- 候选区仅 **1 个 Alice**（`alice`(t1)/`ALICE`(ri-1 risk owner)/`  alice  `(mtg-1 participants) 全部 casefold+trim 合并）。
- 自由输入 `新人王五` 保存 → t1.json assignee=`新人王五`；重启后读回仍=`新人王五`。截图 `T8-W6-free-input-saved.png`。

## 正式 data 零污染
- 全程 DSH_HOME/DSH_PM_BACKUP_DIR 指向 v07-scratch 隔离目录；正式 3080/3091 在跑未操作。

## 未做/局限
- T8-W4 步骤3「经 API 把 t1 assignee 改为全新人名后重开」——本轮直接通过 GUI 把 t1 改为 `新人王五` 后重启观察候选刷新，等价覆盖「新候选出现、旧写法合并」。
- native datalist 下拉为 OS 级弹窗，截图未渲染浮层；候选列表以 DOM `<option>` 为准（已采）。

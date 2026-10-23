# 人员图轴继任开发交接

2026-10-23，trae。**源码未改，因精确越范围定位暂停并交 Main；不是修复完成或独立 PASS。** 只新增本角色 plan/handoff 及 `/tmp/people-axis-overflow-developer-20261023/` 收据。

## Main 最小接续

定位见[计划](2026-10-23-people-axis-overflow-developer-plan.md)。CSS 两列和排期 nowrap 是待验证的宽度传递路径，不把独立合同的 min-width 猜测称根因。

**需要 Main 处理的精确边界：**
- `people.tsx:464–468` 点图姓名和数值共用直接文本节点；整体省略不能保证数值可见，换行与15px点行距冲突。若采用最小独立姓名/数值槽，须另授该 TSX 位置呈现写权，本角色未写。
- `people.css:147` 固定124px与 `people.tsx:199–200` 逐行 `14+i*15`：FD15行最后中心224px。这是纵向容量定位，不能靠宽度分配修好；所需容器容量处理涉及现行文字槽/宽度范围之外的呈现决策，交 Main 精确另授权，未擅改。
- 可继续的 CSS 部分是 `.pp-lower`、两卡、排期内槽收缩与标题文字槽；本轮未投半成品。无主页面裁切、图卡新增横滚、假省略数值、新断点或版式。

姓名前序 readback 已实际0且 released；当前继任仅两源认领如下，未碰旧姓名封件。主树其他变化、基线提交、全树输入和运行身份由 Main 认领，不引用 HEAD/version 冒充当前候选。

| 对象 | 当前实核 SHA-256，前后保持 | 字节 |
| --- | --- | ---: |
| people.css | `8665e0874b0995a77bcd119fbcd892eaeb853593ce4014bce33100d270a995f4` | 14066 |
| people.tsx（只读） | `e41ab4ec75a04b47fef95595cfde2bc1e915a319ce81ccba6cc99885259ac6a6` | 26112 |

## 实际执行

环境：macOS，直接使用已有 Node v22.23.3；无安装/依赖/缓存写、无源码改动。以下收据均含真实 UTC 起止、耗时、PID、argv、退出、完整 stdout/stderr。

| 步骤 | 开始 → 结束 UTC | 耗时/结果 |
| --- | --- | --- |
| before 两源认领 | 02:59:18.496Z → 02:59:18.509Z | 0.00494s，status0 |
| vendor 只读静态校验 | 02:59:18.508Z → 02:59:18.650Z | 0.14024s，status0，注册13+23件指纹一致；未注册项原样 SKIPPED |
| 源码原行摘录 | 02:59:18.627Z → 02:59:18.685Z | 0.05660s，status0；初选行段部分偏移，后用 grep-n 定位到计划所列实际行号，未改写原收据 |
| diagnosing-bugs 原件只读 | 02:59:33.767Z → 02:59:33.778Z | 0.00724s，status0；运行反馈循环步骤未执行 |
| code-review 原件只读 | 02:59:33.771Z → 02:59:33.777Z | 0.00436s，status0；仅封交自查 |
| 文档编辑前检查点 | 02:59:44.846Z → 02:59:44.852Z | 0.00577s，status0；不是 apply 工具内部耗时 |

早期工具仅给墙钟耗时，没有绝对起止，未补造。真实设施失败：`rg` 不存在 status127；仓库 `tmp` 不存在，find status1，输出改用自有绝对 `/tmp`；指定 memory 入口不存在，ls status1，以当前仓库为准。

**偏差如实保留：** 最初误执行一次只读 `git status --short`，status0，输出过宽；不符合本单禁 Git 命令，未进行任何 Git 写操作，此后未再执行 Git。不能写成“未运行 Git”。未 fetch/pull/install/build/lib/service/browser/desktop/formal/runtime，无业务写；living docs 与 testing 只读，不改全局/系统或任何他源。

本轮未运行 people-scale/core5：产品源零改动，不引入接口或派生变化，重复这5例不能验证布局。未 type、未整build/全回归，GUI NOT_RUN；不得把静态绿或封回0当人员 PASS。规范轴：暂停权限之外改动并保留原文/事件/列；合同轴：红项未修，必须仍记待修/待复验，不签完成。

## 封件与停止

runner、命令输出、两源认领、自有文档均封在 `/tmp/people-axis-overflow-developer-20261023/seal.json`。该封件只证明定位交接完整、源码未变，不是产品验收。`readback.json` 实际子进程 status0 且 receiptReread=true 后才为 STOP / released；开始封件前不预填结果。

可复制命令（cwd=`/Users/bytedance/Projects/dsh-pm/pm-tool`，macOS，既有 Node）：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/people-axis-overflow-developer-20261023/runner.mjs claim after
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/people-axis-overflow-developer-20261023/runner.mjs seal
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/people-axis-overflow-developer-20261023/runner.mjs readback
```

Main 接续：先裁定上述精确呈现范围、重新认领唯一人员源写者；源修后独立审源，全部独立源释放齐才与 task 合一次冻结构建/完整回归，沿 F1/FL 与原 FD 四宽/图轴原动作真实 GUI 复验。MAX8/原事实不变；F1/FL MAX10原证缺口仍独立待补。父 ordinary commit 仍须原门齐，不转成本角色 Git 权限，不 push/release/正式切。

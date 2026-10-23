# R3 独立读证工具收据

2026-10-23，macOS/bash，`node` 实际解析到 `/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node`；cwd=`/Users/bytedance/Projects/dsh-pm/pm-tool`。本工具仅自有 `/tmp` 内置 reader，无 child_process、产品/tests import、网络、GUI 或 Git。

## 1. 关键真实工具调用

以下为本次已执行记录，不是要求重新执行所有命令。工具 Wall time 包含启动/传输，与 reader 内部步骤时间分列；reader每次真实开始/结束/pid/elapsed在 `/tmp/tasks-failure-gui-timed-20261023-r3-timing.jsonl`，封后只保留、不删除。

| 实际命令 | 工具 Wall time 秒 / 真实终码 | 返回关键内容 |
| --- | --- | --- |
| `node /tmp/tasks-failure-gui-timed-20261023-r3-reader.mjs verify` | 1.1868 / 0 | 613/index给定SHA，逐件无差异、8态raw/roots同、240帧 |
| `node /tmp/tasks-failure-gui-timed-20261023-r3-reader.mjs forensic` | 0.2626 / 0 | 原RPC/roots/状态独立摘要；存储包裹比较假阴性保留 |
| `node /tmp/tasks-failure-gui-timed-20261023-r3-reader.mjs binding` | 0.1986 / 0 | 原报告必要四副本同；初摘要未展开旧index.files结构 |
| `node /tmp/tasks-failure-gui-timed-20261023-r3-reader.mjs binding-index` | 0.2205 / 0 | 正确展开原index.files；四副本与tracked diff/新增/变更清单指纹吻合 |
| `node /tmp/tasks-failure-gui-timed-20261023-r3-reader.mjs forensic-structured` | 0.3675 / 0 | 结构化摘要；仍保留version/record包裹误比较，未判产品缺陷 |
| `node /tmp/tasks-failure-gui-timed-20261023-r3-reader.mjs rpc-records` | 0.3541 / 0 | version2.record与两次真实success tasks全同，3项目/11任务/A10 |
| `node /tmp/tasks-failure-gui-timed-20261023-r3-reader.mjs subverify-o5` | 0.7279 / 0 | 280/给定SHA，4态同，89帧 |
| `node /tmp/tasks-failure-gui-timed-20261023-r3-reader.mjs subverify-o4` | 0.7909 / 0 | 315/给定SHA，6态同，31帧 |
| `node /tmp/tasks-failure-gui-timed-20261023-r3-reader.mjs subfacts-o5` | 0.5023 / 0 | 脚本/字段/4态原证，2读RPC/1success；五候选副本同613 |
| `node /tmp/tasks-failure-gui-timed-20261023-r3-reader.mjs subfacts-o4` | 0.4978 / 0 | 6态原证、0RPC、两次真实exit1与恢复exit0分层 |
| `node /tmp/tasks-failure-gui-timed-20261023-r3-reader.mjs subsummary-bound-o5` | 0.4266 / 0 | source/complete-inputs冻源全同、timing40行匹配 |
| `node /tmp/tasks-failure-gui-timed-20261023-r3-reader.mjs subsummary-bound-o4` | 0.4187 / 0 | source/complete-inputs冻源全同、timing47行匹配 |
| `node /tmp/tasks-failure-gui-timed-20261023-r3-reader.mjs subverify-o4r` | 0.6771 / 0 | 755/给定SHA，15态同，83帧 |
| `node /tmp/tasks-failure-gui-timed-20261023-r3-reader.mjs subfacts-o4r` | 1.0461 / 0 | 15态说明/确认/焦点/0RPC，五副本同613 |
| `node /tmp/tasks-failure-gui-timed-20261023-r3-reader.mjs subsummary-bound-o4r` | 0.8833 / 0 | 冻源全同、timing76行匹配，保原14.352秒exit0 |
| `node /tmp/tasks-failure-gui-timed-20261023-r3-reader.mjs compact-o4r` | 0.2156 / 0 | clean3与dirty2原链各状态/说明/焦点、真实逐步时间 |
| `node /tmp/tasks-failure-gui-timed-20261023-r3-reader.mjs audit-summary` | 0.8235 / 0 | 四包613/280/315/755，33态、各包raw/roots同 |

`read` / `subread-o5` / `subread-o4` / `subread-o4r` 仅输出原JSON或脚本文本，均真实终码0；包括capture/retry/noresult/harness、三个O4原脚本、O5原脚本、Remaining原脚本、观察/字段/错误/roots。`summary` 与初 `subsummary-o4/o5` 真实终码0，仅摘要，不是产品测试；冻confirm未列在changed-source时的假阴性已以complete-inputs正确声明校正，原自有/tmp摘要不覆盖。

`begin/end visual-review`、`begin/end o5-o4-review`、`begin/end o4remaining-review` 与报告预备阶段为自有审证墙钟，不是GUI执行。33次 `view_image` 实际PNG及9次必要JPEG均工具返回成功；不能给无单调用时钟的图像动作虚填毫秒，目视包含在对应审证阶段计时。

## 2. 启动限制与释放核对

| 真实结果 | 处理 |
| --- | --- |
| 初 `exec_command pwd(login=false)` 被工具拒绝：`custom shell and login=false are not supported yet` | 未发生shell执行；改默认参数的pwd实际0。 |
| 两次初rg命令真实127，`rg: command not found` | 改限定ls/sed/grep/内置fs，不安装。 |
| 记忆路径ls真实1，不存在 | 不将平台记忆当仓库证据，按本地原合同。 |
| 初广域find工具10.0224秒仍运行，未取得其终码 | 不伪填exit0；后续只核已知路径。 |
| `pgrep -f '^find docs/testing reports -type f -name \*TimedTasks\*'` 真实1，Wall0.2050秒，无输出 | 精确自有早期扫描已无匹配进程；不检查/停止Main或产品实例。 |

原 Main 浏览器启动外层 status0 附带ETIMEDOUT，在 Main 活账有明确 `FAILED_TIMEOUT` 更正；本角色未重放启动，也不将该0当成功释放证明。O4首次 locator exit1和follow真实确认Escape exit1原件完整保留；pointer/Remaining exit0不抵消它们。

## 3. 封存与回读

最后仅对本前缀文档做格式/链接/JSON校验，并对四包做交付前指纹保护回读；不是产品回归。真实 `seal`、`readback` 工具返回及新封件SHA见本前缀后续封存工具回执，避免封件循环自签。

未执行 install/build/noemit/full Vitest/all verify/GUI/网络/runtime/private/正式/Git，不把这些未运行项宣称通过。本角色的所有Node读证命令均已同步返回，无子进程runner或后台服务；STOP只结束本批审证，不表示父功能门或commit已关闭。

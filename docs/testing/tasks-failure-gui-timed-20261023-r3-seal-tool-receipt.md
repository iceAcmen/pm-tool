# R3 封存与回读实际工具回执

2026-10-23。本收据是封件生成后的工具结果记录，**不循环放入自身seal**，不代表产品整项通过。

## 1. 真实执行

环境：macOS/bash，cwd=`/Users/bytedance/Projects/dsh-pm/pm-tool`，Node22.23.3。

| 实际命令 | 工具 Wall time 秒 | 真实终码 / 返回 |
| --- | --- | --- |
| `node --check /tmp/tasks-failure-gui-timed-20261023-r3-reader.mjs` | 0.1997 | 0，语法检查无输出；不是产品测试 |
| `node /tmp/tasks-failure-gui-timed-20261023-r3-reader.mjs validate-docs` | 0.2170 | 0，5份报告/计划/审计/收据，缺链接0、行尾空白0、audit JSON可解析 |
| `node /tmp/tasks-failure-gui-timed-20261023-r3-reader.mjs end report-seal` | 0.1531 | 0，报告预备阶段关闭；与新补片审证重叠，不累加算效率 |
| `node /tmp/tasks-failure-gui-timed-20261023-r3-reader.mjs seal` | 0.7353 | 0，四输入包保护回读全部same、changed=[]；生成自有/tmp执行seal |
| `shasum -a 256 /tmp/tasks-failure-gui-timed-20261023-r3-seal.json` | 0.5027 | 0，`12e975f271831acd1ae9891e43a3c29f2f7f93c3658be47edcd81e71a5053738` |
| `node /tmp/tasks-failure-gui-timed-20261023-r3-reader.mjs readback` | 0.2021 | 0，`2026-10-23T02:17:03.411Z`，5份reportMembers逐件bytes/SHA同seal、allMatch=true、行尾空白0 |
| `shasum -a 256 docs/testing/tasks-failure-gui-timed-20261023-r3-seal.json` | 0.1332 | 0，`7bd3b49b13bdf724cb096292f520f22755e214a9ad33297487ab6dd96e6ea64e` |

[仓库seal](tasks-failure-gui-timed-20261023-r3-seal.json)认领5份最终产物及四包给定SHA；完整自有/tmp执行seal绑定22份原始审计/摘要/阶段时间，包括早期设施假阴性和后续正确解析，原件不抹。回读原结果保留 `/tmp/tasks-failure-gui-timed-20261023-r3-readback.json`；逐步计时原账保留 `/tmp/tasks-failure-gui-timed-20261023-r3-timing.jsonl`。

## 2. 有限结论与释放

**STOP/released。** 原封包613/280/315/755共1963件逐件指纹初核与交付前保护回读一致；33态实际PNG已独立审看，不拿文件数作覆盖率。首载误空、确认Escape不退出及陈旧提示有限叠压红项保留；无结果/O5弱标恢复、O4各已采退出链仅有限PASS；旧错误卡恢复UX疑点和原未采动作保留。

全部自有Node命令均同步返回，无产品测试/GUI runner或后台服务；先前自有find已精确查无匹配，不触碰Main进程、端口、profile、正式服务、Git或产品写者。Main首载panel写者独占，O4只交 [最小合同](tasks-failure-gui-timed-20261023-r3-o4-escape-plan.md)供合并调度。

本角色结束本批审证，不签整任务页/O3/O4/O5整项/B8/父ordinarycommit。Main原父授权不被扩大或暂停；同域后续已封修后证据继续由同一固定专家承接，不另派新角色。

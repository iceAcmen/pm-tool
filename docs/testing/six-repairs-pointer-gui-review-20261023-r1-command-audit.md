# 原 F02 指针 GUI 独立审证命令审计 R1

2026-10-23，trae独立专家；macOS/bash，仓库根 `/Users/bytedance/Projects/dsh-pm/pm-tool`。此文件记录本角色执行，不是 Main 产品命令重执行清单。

## 1. 真实失败和工具边界

| 动作 | 实际结果 / 处理 |
| --- | --- |
| 首次 `exec_command` 请求 `pwd` 且 `login=false` | 工具拒绝：`custom shell and login=false are not supported yet`；无已启动shell、无进程退出码，不能填exit1 |
| 修正后 `pwd` | exit0，确认仓库根 |
| `rg --files docs/testing reports/all-pending-evidence-20261021/SixRepairsPointerGuiR1` | exit127，`rg: command not found`；未install，后续改为限定find/grep/sed |
| 准备中疑似frame哈希失配 | 不是执行失败或产品FAIL；独立reader对44帧实际逐SHA核同，warnings=[]；没有为此修改封件 |

## 2. 全部只读调用组

以下每条实际shell调用均已结束，**exit0**。为避免重复整段长argv，JSON内置reader按用途标识；没有任何一条调用产品或采证脚本。

1. `cat AGENTS.md`；`ls /`。
2. `find reports/all-pending-evidence-20261021/SixRepairsPointerGuiR1 -maxdepth 2 -type f`。
3. `find docs/testing -maxdepth 1 -type f -name 'p1005-listbox*'`，仅限定前缀发现。
4. `cat docs/testing/p1-l2-events-gui-review-20261023-r1.md`。
5. `cat docs/testing/combined-six-repairs-regression-review-20261023-r1-report.md`。
6. `cat` 内置 research-guide SKILL及其 research-report reference，只读技能指导；未执行其外网/安装动作。
7. `cat` 本包 seal-r1、seal-outer-receipt、execution-summary；`head -100` 本包index。
8. `cat docs/testing/p1005-listbox-backdrop-source-auto-20261023-r1.md`，不重执行旧runner。
9. `cat` 本包activation-binding-r2、host-start、combined-candidate。
10. 内置Node `-e`：解析index，打印成员路径/bytes；只读，不import成员。
11. `cat` 本包round17-source、round19-source、round19-save-pointer-target、round17/19 outer receipt；不执行源码或其assert。
12. `cat` 本包round15/16/17/19 events。
13. `cat` 本包frozen-source的records-listbox、records-deliverable-pointer-dom.test，均不import/运行。
14. `cat` 本包round15-list-roots、sidecar-copy-binding、round15-list-raw中的dlv1。
15. 内置Node `-e`：解析五份本包UI JSON的字段/状态；不访问browser。
16. `head -35` 本包combined-source-files、complete-inputs、built-artifacts。
17. `grep -n -E 'onSaveDeliverable|saveDeliverable|deliverable update|RecordsDeliverableForm'` 本包panel副本。
18. `sed -n '30,46p'` 本包records.css副本。
19. `cat` 本包harness-source、round16-source、round15-outer-receipt，只读原作者设施和动作，不运行。
20. 内置Node `-e`：读取本角色audit，输出四份source绑定、已核bundle中选定SOURCE摘录及360输入计数。
21. `sed -n '3930,3986p'` 本包panel副本；`nl -ba` 本包records-listbox副本。
22. `find docs/testing -maxdepth 1 -type f -name 'six-repairs-pointer-gui-review-20261023-r1*'`，确认自有输出。

上述所有本包相对路径前缀为 `reports/all-pending-evidence-20261021/SixRepairsPointerGuiR1/`。原件中的 private/runtime/profile/PID/argv只作封存元数据读取，不follow访问它们。353成员的SHA使用Buffer，未解析/输出封存profile/gateway凭据内容。

## 3. 自有 reader 和终封

仅内置fs/path/crypto/util；没有 `child_process`、产品import、eval、Main assertion执行或外部依赖。生成JSON使用`wx`拒绝覆盖，手写报告/reader用apply_patch。实际命令：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/six-repairs-pointer-gui-review-20261023-r1-reader.mjs audit
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check /tmp/six-repairs-pointer-gui-review-20261023-r1-reader.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/six-repairs-pointer-gui-review-20261023-r1-reader.mjs seal
```

audit实际outer **0**，353件/44帧/4份源码/252raw实核相同、七段各42roots深比较无变，errors=[]、warnings=[]；--check实际outer **0**。seal的校验结果和输入/输出指纹完整存于本前缀`-auditseal.json`，**真实outer末码以本次exec_command完成回执为准，不以文件存在或JSON自填字段倒推**；不捏造工具UUID/PID。

终封再次比对audit的360个保护输入、正文链接及尾空白，未重执行产品。终封校验成功不把原GUI FAIL转绿；最终报告维持F02有限红及后台未到达裁决。

## 4. 原图与未执行事项

实际`view_image`成功目视9件封存原图/帧，完整清单见报告§7；这是静态原图审阅，**不是GUI执行**，无重放/新截图或浏览器操作。

本角色产品build/install/noEmit/test/verify/GUI/网络/服务/Git执行 **0次**；未spawn子角色、未修改Main或其他角色成果、未接手父普通提交。原 Main round15/16 outer0、17/19 outer1和seal outer0均来自已核原收据，只读核验不是本角色跑这些命令。

无长运行session、产品/端口/profile/数据锁；本写面终封后 **released / STOP**，通知Main继续原父授权，不暂停父goal。

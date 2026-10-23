# 首读窄审封回与释放实际收据

记录封件生成后的真实工具结果，供 Main 实收核对；此后置收据不循环加入原 seal，不代表 GUI/整任务通过。

环境：macOS arm64/bash，cwd=`/Users/bytedance/Projects/dsh-pm/pm-tool`，Node22.23.3。下表 action 均实际展开：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node \
  /private/tmp/tasks-firstload-source-auto-20261023-r1-reader.mjs <action>
```

日期2026-10-23；UTC起止，秒取单调计时，Tool秒仅该调用wall time，不与内部秒相加。

| action | 开始Z→结束Z | 内部秒 / Tool秒 | 实际终码 / 回读 |
| --- | --- | --- | --- |
| validate | 02:29:08.304→02:29:08.313 | 0.0068 / 0.1433 | 0，4正文产物，缺链接0、行尾空白0，JSON可解析 |
| seal | 02:29:11.669→02:29:12.830 | 1.1601 / 1.2901 | 0，开发4452对象保护回读changed=[]；4正文/856自有原件已封 |
| readback | 02:29:18.580→02:29:18.769 | 0.1883 / 0.3013 | 0，4正文/856原件全匹配，changed=[]、allMatch=true |
| release | 02:29:22.606→02:29:22.622 | 0.0155 / 0.1317 | 0，STOP/released；精确56808/56809已退出，ps空stdout/status1 |

[seal](tasks-firstload-source-auto-20261023-r1-seal.json) 为153739字节，SHA256 `01bfe44b3c2b281110c246cddc769ff7a2c1cefed6d5262d4e4fe675348c001b`；[readback](tasks-firstload-source-auto-20261023-r1-readback.json) 为284字节，SHA256 `5e70521bc49ca4df7b887d1a3bc47854a50a4e6db49880ae9632341321f89d4a`。seal的856原件含独立红绿src820、实际stdout/stderr/JSON/观察、读取错误原件与封前计时快照；持续追加的活计时不循环纳入，后置readback/release另留真实收据。

[release](tasks-firstload-source-auto-20261023-r1-release.json) 已真实写并返回0。没有自有服务、GUI、端口/profile或产品写锁；不停止Main进程，不触碰3270人员恢复。报告正文/审计/先行合同已封，不再修改或扩大本批范围。

**实收闭环：首读 PASS_LIMITED_SOURCE_AUTO；修后首读GUI BLOCKED_NEW_GUI_EVIDENCE；原 stale FAIL_LIMITED_VISUAL、oldError BLOCKED_RECOVERY_UX、O4确认Escape FAIL 保留。** 独立复测6红/3绿→9绿，同测试指纹；原邻接30/type0只审封证。没有整任务/O4/O5/B8/父ordinarycommit PASS。

本角色 **STOP/released**。Main按 [stale最小合同](tasks-failure-gui-timed-20261023-r3-stale-layout-plan.md) 与既有O4合同调同panel唯一开发，合并L8一次整build/受影响GUI再交独立审；本轮未fetch/install/build/git/改livingdocs，无push/release/正式切。

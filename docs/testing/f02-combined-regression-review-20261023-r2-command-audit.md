# F02 组合 R2 独立审证实际命令

2026-10-23，trae，macOS arm64，cwd `/Users/bytedance/Projects/dsh-pm/pm-tool`，绝对nvm Node22.23.3。只读人工证据；本文件不是Main测试执行记录。

## 1. 实际主审命令

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/f02-combined-regression-review-20261023-r2-reader.mjs audit
```

真实exit **0**。初次工具异步返回string execution ID，不兼容integer `write_stdin` schema，未传错误类型轮询，也未重跑。仅读取**本角色这次精确**execution.json：ID `eafea4a32c1b1a2a713eb4c88cb0d724`、PID21127、status=exited、exitCode=0、outputComplete=true。原审计10组全绿、errors=[]；此真实工具末码不来自审计expectedExit。

## 2. 补充helper与最小修正

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/f02-combined-regression-review-20261023-r2-trace.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/f02-combined-regression-review-20261023-r2-trace-reconcile.mjs
```

trace真实exit **1**：末尾将OKR calls误当数组，实际为`{onCreate:[],onEdit:[],onSaved:[],run:[]}`。原脚本及`trace-attempt1.json`保留，不改为成功。来源链/raw记录、source map绑定、DOM目录、handoff28已经核完。

新增reconcile真实exit **0**，只补原calls对象四空数组和fetchCalls，继承原已绿字段，没有再执行来源链、Main脚本或产品测试。原10组reader绿不重跑。

## 3. 审证窗口终核

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/f02-combined-regression-review-20261023-r2-reader.mjs stability
```

真实exit **0**，8.3517s。仅前后稳定性核对：index/seal、Main/freeze525输入、Main463/旧455/新455lib、launcher26、新三依赖manifest无变化。不是build/noEmit/测试重执行。

## 4. 封存

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/f02-combined-regression-review-20261023-r2-seal.mjs
```

生成报告、最终审计、原失败原件、命令收据及seal；仅写授权前缀及自有/tmp。实际封存末码单独见`f02-combined-regression-review-20261023-r2-seal-tool-receipt.json`，不在seal内自填预测0冒真实退出。

## 5. 准备命令与失败保留

| 原动作 | 实际结果 / 最小处理 |
| --- | --- |
| `ls /projects/-Users-bytedance-Projects-dsh-pm-pm-tool--p2-11b908a9362bd421871f` | exit1，路径不存在；未找到记忆，不再扩搜private目录 |
| `exec_command`带`login=false`调用reader | 工具拒绝：`custom shell and login=false are not supported yet`；没有shell进程或末码。去掉参数后仅一次实际主审 |
| `cat packages/dsh-pm-tool/scripts/verify-isolation.mjs packages/dsh-pm-tool/scripts/lib/isolation-guard.mjs` | exit1，后一helper不存在；第一原守卫已完整读到，不import/执行它 |
| inline fs读取`dom-observations`直接把首成员当文件 | exit1，`EISDIR: illegal operation on a directory, read`，errno=-21/syscall=read；之后先withFileTypes辨目录，仅读层级/声明成员，补原tsconfig，不影响已绿主审 |
| 其他cat/head/sed/wc/ls与fs只读摘要 | 逐次实际exit0；`sed 410..710`为空因文件287行，随后仅读150..287获得§9/§11，不误报规则不存在 |

完整主要命令、失败stderr、主审原终码及Main原argv/env/95逐exit在`command-receipts.json`和`audit-final.json`。inline只读摘要使用`node --input-type=module -e`及内置fs，未eval/import产品；没有为无单独PID的读命令补造PID或执行ID。

实际工具检索未找到兼容string ID的轮询器，没有通过错误schema传参。主审实际进程已用本角色精确收据确认退出；所有后续必要自有命令同步结束。

**产品build/install/noEmit/full/verify/GUI/服务/网络/Git/spawn均0次；未执行Mainexecutor。released / STOP。**

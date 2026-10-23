# 原 F02 GUI 审证 R2 命令审计

2026-10-23，trae独立原F02 GUI审证；仓库根为 `/Users/bytedance/Projects/dsh-pm/pm-tool`。只读审证，不执行Main/产品/GUI，不spawn。

## 1. 只读准备

使用 `pwd`、`cat`、`head`、`sed`、`ls` 及绝对Node路径的 `-e` 纯fs/JSON读取，范围限AGENTS、collaboration §9/§11、三份指定旧报告及组合seal/真实receipt、新F02RepairGuiR2封存包、自有reader及本前缀输出。没有读取工具runtime、凭据、正式配置、live服务/profile。

最初 `rg` 不在环境，实际 **exit127 / /bin/bash: rg: command not found**；改用既有cat/sed及纯fs reader，不安装工具。不据该失败扩大产品或GUI缺陷。其余只读shell命令均实际exit0，无在途会话。

有一次cat输出因76.5KB被工具截断；没有读取工具自动保存的runtime日志路径。后续直接对封件用纯fs/JSON读原字段，未把预览当完整原件。

## 2. 自有reader真实执行

以下全部在仓库根；Node为macOS既有nvm **v22.23.3**，无pnpm/install/build/verify。

| 实际命令 | 工具exit / wall | 结果 |
| --- | --- | --- |
| `node /tmp/f02-repair-gui-review-20261023-r2-reader.mjs audit` | **1 / 0.6607s** | 1457成员及三附属、298frame、950raw核到一致；末尾旧backup全roots零变断言范围错误 |
| `node /tmp/f02-repair-gui-review-20261023-r2-reader.mjs audit2` | **0 / 0.5633s** | 只准正常旧backup新增JSON/侧车四件，原44项全同；完整候选/closure/pointer/keyboard/RPC/raw链核验errors=[] |
| `node --check /tmp/f02-repair-gui-review-20261023-r2-reader.mjs` | **0 / 0.0916s** | 初次自有reader语法检查 |
| `node --check /tmp/f02-repair-gui-review-20261023-r2-reader.mjs` | **0 / 0.1448s** | 增加纯结构format补核后的最终reader语法检查 |

上表`node`完整绝对路径均 `/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node`，全argv/真实stdout与PID边界见 `f02-repair-gui-review-20261023-r2-reader-tool-receipt.json`。audit2的真实stdout仍显示旧标签mode=audit，记录真实参数audit2，不改造输出。

首失败audit保留，未覆盖；自有reader只修旧roots正常新增断言与空可选repoUrl/branch的raw省略语义。本轮fs/hash重核不是重复产品测试。原Main四次设施失败及其原字节均未修改；GUI红/绿与设施收据分层。

## 3. 原图与后置验证

实际 `view_image` 28件，完整名单见本前缀report §7，全部为既有封件原PNG/JPG；无浏览器/桌面操作或额外截图。过程闭合采样更新曾称62，实核原closure为含初始点63，最终报告按原件63/1013.700ms记载。

自有reader `format`：报告链接/尾空白/围栏，1460封件及引用保全，原历史和snapshot/RPC结构补核。

自有reader `seal`：保护同1460封件及引用，自有报告/audit/首失败audit/命令审计/真实reader及format收据的指纹；seal自身与随后真实工具收据不循环自指纹。

**format/seal只在工具实际返回后写收据**，分别见本前缀 `-format-tool-receipt.json` / `-seal-tool-receipt.json`；本文件不预填末码。两命令完整参数：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/f02-repair-gui-review-20261023-r2-reader.mjs format
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/f02-repair-gui-review-20261023-r2-reader.mjs seal
```

## 4. 零执行与释放边界

产品测试/GUI执行/build/install/verify/网络/端口/服务/Git/子进程spawn均0次。未改livingdocs、旧testing、产品、Main原封件。仓库只新增指定前缀；自有reader仅 `/tmp/f02-repair-gui-review-20261023-r2-reader.mjs`。

本角色无后台会话、builder/GUI/桌面/端口/profile/业务数据锁，未停任何服务。有限报告与真实后置收据完成后 **released / STOP，交Main**；不签父ordinarycommit，不暂停父原goal，不要求重跑有效产品测试或新增门。

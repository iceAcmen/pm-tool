# F02 related28 R3 命令审计

> 2026-10-23，trae 独立 AUTO 补证专家。只记录本角色已执行动作，非再次执行建议。所有测试子收据来自实际 spawnSync 返回，不用外层exit推造子exit。

## 1. 实际环境与路径

macOS arm64/bash，仓库 cwd `/Users/bytedance/Projects/dsh-pm/pm-tool`；绝对路径 nvm Node22.23.3，未初始化nvm、未调用pnpm。已有Vitest2.1.9，四声明依赖只读链接。隔离根 `/tmp/f02-related28-infrastructure-retest-20261023-r3-independent-7c914a`。

外层四个收集阶段及封存均以以下 `env -i` 白名单执行，不继承凭据。此代码列示完整 runner run 历史命令；prepare/finish 使用同一env/node/runner，仅最后参数不同；reconcile/seal使用相同env/node、自有 `reconcile-seal.mjs`。

```sh
# macOS/bash；实际 cwd 为仓库根；本命令已执行一次且绿后未重跑。
env -i PATH=/Users/bytedance/.nvm/versions/node/v22.23.3/bin:/usr/bin:/bin HOME=/tmp/f02-related28-infrastructure-retest-20261023-r3-independent-7c914a/home TMPDIR=/tmp/f02-related28-infrastructure-retest-20261023-r3-independent-7c914a/tmp XDG_CONFIG_HOME=/tmp/f02-related28-infrastructure-retest-20261023-r3-independent-7c914a/config XDG_CACHE_HOME=/tmp/f02-related28-infrastructure-retest-20261023-r3-independent-7c914a/cache LANG=en_US.UTF-8 TZ=Asia/Shanghai CI=1 NO_COLOR=1 /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/f02-related28-infrastructure-retest-20261023-r3-runner.mjs run
```

全部产品执行的实际子 argv（`shell=false`）如下。cwd 为隔离 `inputs`，env 完整保存在 [校正执行收据](f02-related28-infrastructure-retest-20261023-r3-execution-reconciled.json)，stdout/stderr/result也在收据内及自有output原始文件中：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /Users/bytedance/Projects/dsh-pm/pm-tool/packages/dsh-pm-tool/node_modules/.pnpm/vitest@2.1.9_@types+node@22.20.5_supports-color@7.2.0/node_modules/vitest/vitest.mjs run src/client/views/records/records-options.test.ts src/client/views/records/records-payloads.test.ts src/client/views/records/records-history.test.ts src/client/form-validation.test.ts --config /tmp/f02-related28-infrastructure-retest-20261023-r3-independent-7c914a/config/vitest.mjs
```

## 2. 外层工具与子进程真实终码

| 对象 / 必要动作 | 真实结果 |
| --- | --- |
| 自有 runner `prepare` | 外层0；原17输入与封件/副本匹配、641依赖与R2匹配、原index/seal和R2证据绑定 |
| 自有 runner `run` | 外层0；下述两个语法检查0、唯一Vitest子0，28/28及4文件passed |
| 自有 runner `finish` | **外层1**；自己的wrapper误写依赖描述，缺少exit字段，生成原BLOCKED汇总；原件保留 |
| 新自有收据校正器 `reconcile` | 外层0；核对独立子原始收据/原28结果，不重跑测试；新语法检查0，最终有限PASS |
| 新自有收据校正器 `seal` | 真实终码与seal SHA见随后单独 `seal-tool-receipt.json`，不从payload假定0 |

外层已观察终码及原始关键stdout记录在 [工具收据](f02-related28-infrastructure-retest-20261023-r3-command-tool-receipts.json)。这些是本角色依据实际 exec_command 返回记录的事实，不冒充独立外部审签。

实际子进程收据：

| 真实 argv | exit / signal / error / stderr |
| --- | --- |
| `node --check /tmp/f02-related28-infrastructure-retest-20261023-r3-runner.mjs` | 0 / null / null / 空 |
| `node --check /tmp/f02-related28-infrastructure-retest-20261023-r3-independent-7c914a/config/vitest.mjs` | 0 / null / null / 空 |
| 上述唯一Vitest argv | **0 / null / null / 空** |
| `node --check /tmp/f02-related28-infrastructure-retest-20261023-r3-reconcile-seal.mjs` | 0 / null / null / 空 |

三次 `--check` 仅检查自己的新工具/新config语法，不是noEmit或产品验证。校正器仅读取第一次Vitest现存原始收据，没有第二次产品执行。

## 3. 只读定位与异常

- `cat AGENTS.md`、`find docs/testing -maxdepth 2 -iname '*f02*'`、只读R2报告/审计/封件index/seal、指定两文件/四测试/声明导入；各实际读取命令0。大R2 auditseal显示被工具截断，未访问平台自动保存的private输出，后续仅用Node结构化读取原仓库文件。
- `rg --files docs/testing -g '*f02*'` 实际127：rg未安装；改find，不安装。
- `ls /projects/-Users-bytedance-Projects-dsh-pm-pm-tool--p2-11b908a9362bd421871f`、`cat /user_profile.md` 各实际1：记忆根/文件不存在，未根据私有记忆判门。
- `ls /Users/bytedance/.nvm/versions/node` 实际0，仅定位既有Node，不改home或全局配置。
- 若干 `node --input-type=module -e` 只读结构化摘要/指纹，以及 `sed/cat` 本角色自有输出诊断；各0。无spawn/noEmit/install/build/服务/网络/Git。
- apply_patch仅新增两个自有 `/tmp` 工具及本R3前缀文档/收据；runner生成的其他文件仅自有隔离/tmp及本R3前缀。旧R2六文件、开发封件和所有产品/依赖未修改。

## 4. 资源与边界

唯一Vitest及三个语法检查使用允许的 `spawnSync`，有timeout、shell=false并收集真实argv/cwd/env/pid/exit/stdout/stderr；无额外服务、任意shell子进程、子角色派单。Vitest正常返回exit0，未触发超时/kill，未调用任何停服命令。

未执行fetch/pull/install/build/noEmit/full/allverify、GUI、宿主/服务、Git、privatefreeze/runtime、凭据访问、Main/开发/旧专家runner或seal。未扫描正式端口或修改profile；没有借本单展开B8/整包/新门。

**released / STOP**：所有必要命令同步结束；不删除隔离原件、不重跑绿测试。交Main汇合原9+28自动子门及其余父门；原GUI FAIL和修后NOT_RUN不变。

# F02 SOURCE/AUTO R2 命令审计

> 2026-10-23，trae 独立专家。记录本角色真实执行与异常；不是产品或 GUI 收据。

运行环境：macOS/bash，仓库根 `/Users/bytedance/Projects/dsh-pm/pm-tool`，绝对路径 nvm Node22.23.3。未运行 nvm 初始化、pnpm、安装或网络。

## 已执行

| 命令 / 对象 | 真实终码与说明 |
| --- | --- |
| `pwd`；`cat AGENTS.md`、`docs/collaboration.md`、`docs/external-skills.md` | 各0，只读规则 |
| `ls /projects/-Users-bytedance-Projects-dsh-pm-pm-tool--p2-11b908a9362bd421871f` | 1，记忆根不存在；未据私有记忆裁决 |
| `rg --files docs/plans docs/testing reports/all-pending-evidence-20261021/F02OptionDefaultDevelopmentR2` | 127，rg未安装；改find，不为此重试安装 |
| `cat` 原F02合同、repair/development、原P1005映射、两产品文件、四专项、form/overlay、开发index/check/seal/red收据/config/identity/stderr | 各0，只读；多路径cat也是读取，不执行其脚本 |
| `head -n 45` baseline-complete、`head -n 60` baseline | 各0，读取数据结构 |
| `find` 本封件maxdepth2、maxdepth1；本新testing前缀maxdepth1 | 各0，只读成员定位，未删除 |
| `ls` widget-poc/node_modules；`ls -l` 四指定依赖；`ls` 独立output | 各0，只读现有依赖或自有输出 |
| 本角色reader `prepare` | **0**；109件/525输入/17副本/641依赖/1286保护输入实核 |
| 本角色runner，一次合并9+28 | **1**；37产品断言绿，但4 related suite afterAll EEXIST。工具同步结束，无executionId或未收终码 |
| `cat` 独立stdout/stderr；`head -n 55` 独立results | 各0；results为单行JSON，工具展示被截断，未访问平台自动生成的private输出路径；完整JSON由自有finisher读取 |
| 本角色finisher `1` | **0**；参数1为上行已观察真实终码；审计明确AUTO28/37 BLOCKED，SOURCE/DOM9有限PASS，保护输入零漂移 |

apply_patch 只创建自有 `/tmp` reader/runner/finish/seal 和本新testing前缀文件；未修改产品、plans、livingdocs、旧testing或原封件。没有执行 Main runner/seal，未导入其assert；测试仅执行用户指定产品/测试副本。

## 完整执行命令

```sh
# macOS/bash；仓库根。初核真实exit0。
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/f02-option-default-source-auto-20261023-r2-reader.mjs prepare

# 一次产品专项；真实exit1。env -i确保不继承凭据，重定向仅存本角色原日志。
env -i PATH=/Users/bytedance/.nvm/versions/node/v22.23.3/bin:/usr/bin:/bin HOME=/tmp/f02-option-default-source-auto-20261023-r2-independent-eeSeQV/home TMPDIR=/tmp/f02-option-default-source-auto-20261023-r2-independent-eeSeQV/tmp XDG_CONFIG_HOME=/tmp/f02-option-default-source-auto-20261023-r2-independent-eeSeQV/config XDG_CACHE_HOME=/tmp/f02-option-default-source-auto-20261023-r2-independent-eeSeQV/cache LANG=en_US.UTF-8 CI=1 QA_POINTER_EVIDENCE_ROOT=/tmp/f02-option-default-source-auto-20261023-r2-independent-eeSeQV/output/observations /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/f02-option-default-source-auto-20261023-r2-runner.mjs /tmp/f02-option-default-source-auto-20261023-r2-independent-eeSeQV > /tmp/f02-option-default-source-auto-20261023-r2-independent-eeSeQV/output/stdout.txt 2> /tmp/f02-option-default-source-auto-20261023-r2-independent-eeSeQV/output/stderr.txt

# 后核/有限判定，真实exit0；未再运行测试。
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/f02-option-default-source-auto-20261023-r2-independent-eeSeQV/config/finish.mjs 1

# 独立封存命令；终码见另存本前缀seal-tool-receipt，不用payload自填exit代实际工具终码。
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/f02-option-default-source-auto-20261023-r2-independent-eeSeQV/config/seal.mjs
```

有效Vitest CLI argv由独立runner在同进程委托为 `node <现有vitest真实路径>/vitest.mjs run --config <自有root>/config/vitest.mjs`，完整参数和env见本前缀execution.json。使用singleThread worker，不调用 `child_process/spawn`；这是测试执行，不是启动宿主/服务或派发子角色。

## 停止边界

未执行 build/install/noEmit/full/allverify/GUI/服务/Git/privatefreeze/runtime/凭据/spawn。未重新执行红或开发green，未运行独立第二次产品专项。原GUI FAIL与修后NOT_RUN不改签，父整门未签。

独立seal保护报告/审计及原失败；其自身与后续seal-tool-receipt不自指纹。最终工具收据独立记录seal实际终码；不改写已封报告来制造循环。

**released / STOP**：同步测试已经退出，无本角色长运行进程、builder/GUI、端口、profile或数据锁。交 Main 协调原28设施补证与父剩余门，不请求暂停无关已授权工作。

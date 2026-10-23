# 六修组合候选完整回归执行计划

**Goal:** 将六项已独立审结 SOURCE/AUTO 的修复绑定到同一完整候选，完成构建、产品测试、DOM、报告专项、全部确定性 verify 与污染守卫，随后继续原 GUI 余项。

**Architecture:** Main 唯一 builder/GUI。新独占冻结和证据目录，普通复制并核依赖字节、inode 和内部链接；旧114及所有运行实例保留。专家只审本轮原证，不由 Main 判 PASS。

**Tech Stack:** macOS，现有 Node22.23.3、pnpm11.28.5依赖，Vitest2.1.9、TypeScript5.9.3、React18/JSDOM25。

本计划按负责人持续授权直接执行；不新增功能，不推送、发布或切正式服务。writing-plans 的另问执行方式、频繁提交不适用本批已明确分工和总出口约定。

1. 新建 `2026-10-23-six-repairs-execute.mjs`，从只读114 executor派生可复核执行器；新 `CombinedSixRepairsR1`、`/private/tmp/pmtool-combined-six-repairs-20261023-r1`。按真实 Git 差分/新增清单认领全部产品输入，不硬编码数量。另核旧114→当前每个包输入差异，绑定六份专家原报告。只复制原小型docs/vendor设施；不复制整个reports或共享tmp。
2. 沿114已验证scheduler/document/C02/报告stress/probe设施，逐字核原变换。新增三个真实DOM文件从full排除，放DOM组与原三个一同运行，统一自有React/ReactDOM/JSDOM、lucide内联；反思handler和archive专项仍在full。各设施声明不是GUI。
3. 依次执行 `freeze / tsc / bundle / noemit / full / dom / special / verify / guard / close`。每条内层及外层spawnSync记录argv/cwd/白名单env/PID/时刻/实际exit/signal/error、完整stdout/stderr。长任务由外层独占收据追踪，不从文件存在反推退出码。测试JSON给实际分母，原警告/失败保留。
4. close核主产品输入/主lib、旧114lib、冻结全部输入和launcher、三组依赖字节保护，绑定新产物；任一失败只修确证问题并保原失败，受影响重测，不冒总门绿。交独立组合审证。
5. 新host标准恢复当前3264 F5，保KR/第二目标/habit关系、3反思、t7done/t8wrapped、31/29审计。沿原六份GUI合同采首次交接/直接退出/焦点、两reflectId view-edit-final-reentry、pointer选择主save、K16known10/gap2、P2002行出站、KR树与reload；之后继续FL/MAX、L8与桌面B8原欠项。

运行环境为仓库根，命令示例：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-six-repairs-execute.mjs freeze
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-six-repairs-execute.mjs full
```

本计划不是测试结论。全部适用独立出口齐后才exactstage本批全部代码和文档作普通commit；本轮未stage/commit。

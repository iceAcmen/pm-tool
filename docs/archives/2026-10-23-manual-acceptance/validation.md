# 存档所依据的验证记录

环境：macOS arm64，nvm Node22.23.3；原已验证隔离候选使用TypeScript5.9.3、Vitest2.1.9、React18.3.1、JSDOM25.0.1。pnpm11.28.5为项目环境口径，本次存档未安装依赖。

下表是已完成并经独立审证的原执行，不是本次重复运行；cwd/白名单环境、起止时间、产物指纹见本目录evidence内command.json。当前528插件输入与原候选一致，本次未改产品代码。

| 阶段 | 原退出码 | 完整原命令 |
| --- | ---: | --- |
| tsc | 0 | /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /private/tmp/pmtool-combined-tasks-people-repair-20261023-r1/packages/dsh-pm-tool/node_modules/typescript/bin/tsc -p tsconfig.json |
| bundle | 0 | /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /private/tmp/pmtool-combined-tasks-people-repair-20261023-r1/packages/dsh-pm-tool/node_modules/tsdown/dist/run.mjs --config tsdown.config.ts |
| noemit | 0 | /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /private/tmp/pmtool-combined-tasks-people-repair-20261023-r1/packages/dsh-pm-tool/node_modules/typescript/bin/tsc -p tsconfig.json --noEmit --incremental false |
| full | 0 | /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /private/tmp/pmtool-combined-tasks-people-repair-20261023-r1/packages/dsh-pm-tool/node_modules/vitest/vitest.mjs run --config /Users/bytedance/Projects/dsh-pm/pm-tool/reports/all-pending-evidence-20261021/CombinedTasksPeopleRepairR1/vitest-full.config.mjs --no-cache --coverage --reporter=default --reporter=json --outputFile=/Users/bytedance/Projects/dsh-pm/pm-tool/reports/all-pending-evidence-20261021/CombinedTasksPeopleRepairR1/full.result.json |
| dom | 1 | /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /private/tmp/pmtool-combined-tasks-people-repair-20261023-r1/packages/dsh-pm-tool/node_modules/vitest/vitest.mjs run --config /Users/bytedance/Projects/dsh-pm/pm-tool/reports/all-pending-evidence-20261021/CombinedTasksPeopleRepairR1/vitest-dom.config.mjs --no-cache --reporter=default --reporter=json --outputFile=/Users/bytedance/Projects/dsh-pm/pm-tool/reports/all-pending-evidence-20261021/CombinedTasksPeopleRepairR1/dom.result.json |
| dom-new | 0 | /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /private/tmp/pmtool-combined-tasks-people-repair-20261023-r1/packages/dsh-pm-tool/node_modules/vitest/vitest.mjs run --config /Users/bytedance/Projects/dsh-pm/pm-tool/reports/all-pending-evidence-20261021/CombinedTasksPeopleRepairR1/vitest-dom-new.config.mjs --no-cache --reporter=default --reporter=json --outputFile=/Users/bytedance/Projects/dsh-pm/pm-tool/reports/all-pending-evidence-20261021/CombinedTasksPeopleRepairR1/dom-new.result.json |
| special | 0 | /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /private/tmp/pmtool-combined-tasks-people-repair-20261023-r1/packages/dsh-pm-tool/node_modules/vitest/vitest.mjs run --config /Users/bytedance/Projects/dsh-pm/pm-tool/reports/all-pending-evidence-20261021/CombinedTasksPeopleRepairR1/vitest-special.config.mjs --no-cache --reporter=default --reporter=json --outputFile=/Users/bytedance/Projects/dsh-pm/pm-tool/reports/all-pending-evidence-20261021/CombinedTasksPeopleRepairR1/special.result.json |
| verify | 1 | /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node scripts/verify-isolation.mjs |
| verify-p0-r2 | 0 | /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node scripts/verify-isolation.mjs scripts/verify-p0-integration.mjs |
| guard | 0 | /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node scripts/test-isolation-guard.mjs |

full：163文件/1721项通过。DOM原41项通过、两collector失败；dom-new仅补执行20项，合61。verify原94/95通过，P0脚本按原断言串行复跑28/28，95项各有有效通过执行。专项7项、guard通过。原exit1保留，不能写成首次全绿。独立只签当前适用自动门，不签GUI、时序永久修复或发布。

本次额外验证（均实际退出0）：

```sh
# macOS，cwd：pm-tool/launcher
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --test test/contract.state.test.mjs test/browsers.controller.test.mjs test/app.loopback.test.mjs test/control-html.test.mjs test/cancel.race.test.mjs test/journey-race.test.mjs test/loopback-security.test.mjs test/local-app.test.mjs test/browser-open.test.mjs
# 56/56通过；原输出见evidence/launcher-default-tests.txt

# cwd：pm-tool/packages/dsh-pm-tool
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node scripts/verify-external-skills.mjs
# 2个注册vendor全部静态指纹匹配
```

提交前还核对候选指纹、Git远端基线、暂存文件大小、凭据扫描与diff空白。GUI和手动体验验收未通过本表代签，当前待负责人反馈。

暂存528插件输入与验证对象逐文件一致，未包含`node_modules`、`lib`、业务`data`或备份目录；新增最大文件约13.1MiB。2041个新增/变更文件的凭据扫描无新命中。生产源码、启动器和本轮编辑档案的默认`git diff --cached --check`退出0；完整原始审证文本另有348条尾空格/末尾空行提示，均限历史patch/日志/独立正文，原件保持字节不变，不为消除格式提示改写专家证据。

# 首读窄审实际命令与收据

记录本专家已执行命令及真实结果，给 Main 回读；命令成功不等整项或 GUI PASS。

环境：macOS arm64/bash，仓库 cwd=`/Users/bytedance/Projects/dsh-pm/pm-tool`，Node22.23.3，pnpm未调用。自有 reader 为 `/private/tmp/tasks-firstload-source-auto-20261023-r1-reader.mjs`；原证/收据根 `/private/tmp/tasks-firstload-source-auto-20261023-r1`。

## 1. 外层实际命令

下表各 action 均实际展开以下命令；日期均2026-10-23，起止为UTC，秒为单调计时，不把并行重复相加。完整 argv/cwd/PID 与失败栈保留同名 JSON 和 `timing.jsonl`。

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node \
  /private/tmp/tasks-firstload-source-auto-20261023-r1-reader.mjs <action>
```

| action / 实际轮次 | 开始Z | 结束Z | 秒 | 终码 / 结果 |
| --- | --- | --- | --- | --- |
| inspect首次 | 02:23:17.300 | 02:23:17.309 | 0.008 | 1，误按JSON读取tsconfig JSONC，设施错误留存 |
| inspect校正 | 02:23:36.565 | 02:23:36.580 | 0.014 | 0，限定状态/依赖结构 |
| verify首次 | 02:23:36.573 | 02:23:36.586 | 0.013 | 1，误把软链目录当字节文件，EISDIR留存 |
| verify校正 | 02:24:22.738 | 02:24:25.862 | 3.124 | 0，4452对象＝4292文件+160软链，差异0 |
| replay-red | 02:24:22.727 | 02:24:28.044 | 5.311 | 1，同测试原panel，6失败/3控制通过，无设施失败 |
| replay-green | 02:24:22.733 | 02:24:28.107 | 5.373 | 0，同测试修后panel，9/9 |
| verify保护回读 | 02:26:10.688 | 02:26:12.044 | 1.353 | 0，封件不变；路径域归一前的暂时false不是产品缺陷 |
| verify最终 | 02:27:26.859 | 02:27:27.744 | 0.884 | 0，source126/包527交叠111一致，仅panel红绿src差异 |
| audit | 02:27:34.955 | 02:27:34.991 | 0.035 | 0，29观察逐字同、同oracle、有效依赖指纹同 |
| checkpoint report | 02:27:35.587 | 02:27:35.588 | 0.0003 | 0，报告阶段起点，仅记时 |

`checkpoint report` 的实际 argv在上述模板后另加 `report`。报告/合同编辑只有实际 apply_patch 工具回执，不倒填编辑起止；封后实际 validate/seal/readback/release另外登记后置收据，不预造终码。

## 2. 真实组件子命令

两轮 cwd 分别为自有根 `replay-red` / `replay-green`。从开发已封src做隔离副本，未复制/运行其 outer 或 evidence 脚本；cache/config/src不写开发根。仅转写配置的root/cache/output为自有路径，沿原node环境、单fork worker1、真实PmPanel、原测试字节及有效React别名，无installer/build。

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node \
  node_modules/vitest/vitest.mjs run src/client/panel-firstload.test.tsx \
  --config vitest.owned.config.mjs
```

red子进程PID56808，02:24:23.364Z→02:24:28.040Z，4.677秒，status1；green子进程PID56809，02:24:23.370Z→02:24:28.105Z，4.734秒，status0。两者signal/error=null；完整stdout/stderr、JSON断言/观察及子收据保存自有根。外层status分别1/0是真实工具终码，红不是设施错误。

开发原封证据中的最终邻接命令指定 `panel-transport-error-feedback.test.tsx panel-launch-handshake.test.tsx panel-checklist-toggle.test.tsx`，实际23/5/2共30项全绿；type为 `node node_modules/typescript/bin/tsc -p tsconfig.narrow.json --noEmit --incremental false`，实际0。二者本轮**只独立审原证，未重跑**，全部实际argv/起止/status绑定审计中的developerEvidence；不能说“独立重跑39+type”。

## 3. 起步设施与保留

未预先计时的合同/源读取、`ls`、限定 `grep/sed`、内置Node摘要及技能读取只有工具wall time，完整输出在平台工具回执，不当精确阶段总耗时。两次`rg`不可用127，记忆路径不可读1，摘要eval语法错误1；试探`style.css`/`styles.ts`不存在的grep真实2。范围修正后只读实际`panel.css`必要规则，不把这些问题归产品。

原开发red/red-r2的CSS.escape/定位设施错误、type缺必填executeRaw的status2、最终red-r4的6红，全部保留原包。原GUI首读/O4/stale失败与oldError BLOCKED沿原独立审计保留，不重审/重采；没有本轮GUI PASS。精确 `ps -p 56808,56809 -o pid=,command=` 已实返空stdout/status1（无匹配），不使用模糊kill，不触碰Main进程。

# P2OKR-R1-01 最小开发交付

2026-10-23，平台trae，角色开发子单。**仅实现及开发自测，不自 PASS、不关独立门、不 Git 提交/push。** 父原句、授权边界及停止条件见 `design.md`，独立测试先行合同只读 `docs/testing/p2-okr-habit-remaining-gui-review-20261023-r1-report.md` §6。

## 产品范围

仅改 `packages/dsh-pm-tool/src/client/views/okrs.tsx`（+16/-9），新增同目录 `okrs-related.test.tsx`。提取既有 Link2/关联行 markup，root 原呈现不变；对应 KR 消费自己的 `kr.related`，orphan 同一呈现窄复用。空关联不出容器。未改 model/index/panel/tasks/CSS/core、schema、primary、权重、存储、确认动作或按钮。

actual `src/client/views/okr-model.ts` 已为 KR/orphan 独立供给 `related: OkrViewRecord[]`；模型只读SHA=`1fb062b742aa6eed6c2c4db8ab834aa192114e8d03cc5162be6fe9ab947c4c1a`。

## 候选与指纹

基线 HEAD=`9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，原dirty全部保留。有效接手字节以 `baseline.json`（capture-r2）为准，不以HEAD代dirty身份。

| 对象 | SHA256 |
| --- | --- |
| 原视图 / RED | `2408f42a166060596cd7d72462fe34ffcba5c7a69f2f0233da17a102c4926b8f` |
| 修后视图 / GREEN / AUTO | `122516a490b80da4a2fc9da0da66fb1283062efb3c54827c8a8399e3a28bc128` |
| 新 test / RED / GREEN / AUTO 同 oracle | `a95e115726bbdd1e08e6793f66a01f9aceaa996ca50cfbd1cb80527bde71c176` |

## 实际测试

环境：macOS/darwin、Node **v22.23.3**、Vitest **2.1.9**、React **18.3.1**。pnpm未调用，依赖未安装。DOM设施只读借用既有 `.tmp/widget-poc/node_modules` 匹配React/ReactDOM/JSDOM，不接管其运行目录。实际测试源副本位于 `/tmp/pm-p2004-kr-related-PBNUBC/<stage>/inputs`；HOME/TMPDIR/cache/报告均自有/tmp。

| 实际 runner stage | 工具终码 / 结果 |
| --- | --- |
| capture 首轮 | **NOT_COLLECTED**；executionID、错误范围和定向TERM见facility，不冒称0 |
| capture-r2 | 0，1804份保护输入、13份vendor指纹相符 |
| vendor-initial / vendor-final | 各0；既有只读静态校验，无产品PASS含义 |
| red | **1**；7失败/1通过，失败均“KR内关联行预期1、实际0”，非设施失败 |
| green | **0**；8/8，同oracle，clear/restore与主父/children/状态/冻结输入/零调用 |
| affected | **0**；4文件59/59，含new test8、okr-model11、growth-form-props11、core/okr29 |
| runner语法检查、两产品git diff --check | 各0，无全构建或全回归含义 |

实际执行命令（macOS，仓库根；首capture已中止，不重复覆盖）：

```sh
cd /Users/bytedance/Projects/dsh-pm/pm-tool
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p2004-kr-related-runner.mjs capture
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p2004-kr-related-runner.mjs capture-r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p2004-kr-related-runner.mjs vendor-initial
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p2004-kr-related-runner.mjs red
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p2004-kr-related-runner.mjs green
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p2004-kr-related-runner.mjs affected
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p2004-kr-related-runner.mjs vendor-final
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/plans/2026-10-23-p2004-kr-related-runner.mjs
git diff --check -- packages/dsh-pm-tool/src/client/views/okrs.tsx packages/dsh-pm-tool/src/client/views/okrs-related.test.tsx
```

实际子命令逐字在stage receipt：Node调用既有 `packages/dsh-pm-tool/node_modules/vitest/vitest.mjs run --config /tmp/pm-p2004-kr-related-PBNUBC/<stage>/vitest.config.mjs`，cwd是该stage inputs。未替换产品模块；测试读取真实OkrsView与buildOkrTree。

## 证据与保护

同前缀 `*-stdout.log`/`*-stderr.log` 保原红正文；`*-receipt.json` 保同步实际子进程exit/signal/error；`*-inputs.json` 保全隔离src、新test、config、Node、借用依赖及主树源码指纹；`*-output.json` 保逐案原DOM状态和Vitest原报告正文。原始副本仍在自有/tmp，不覆盖旧证。

RED/GREEN/AUTO各1805份输入的运行前后保护差分、隔离source差分、借用依赖差分均0。输入记录深冻结；渲染及rerender未调用run/onSaved/onCreate/onEdit/fetch。此结论只覆盖本DOM观测，不冒称真实业务根/RPC/全盘零污染。

最终 `seal.json` 绑定source/test/相对接手 `source-delta.patch`、新增文件清单、全部实际收据及产物指纹，并机械复核ROOT原DOM相同、1→0→1关联行、所有回调零调用和RED→GREEN仅视图变化。**封存终码见另增 `seal-tool-receipt.json`，本报告不提前推造0。** 首capture误读testing历史临时目录和设施失败保真见facility，r2有效范围不含该目录；不存在任何testing写入。

## 后续与释放

brainstorming/writing-plans 已应用；vendor TDD自动路由和交界code-review开发自查留 `pilot.md`。没有安装缺失superpowers、setup或未vendor脚本，没有自称双子代理独立review。

**fullbuild/全verify/全回归/真实GUI/newhost：本单未运行。** 未访问正式3080/3091，不操作服务、凭据、privatefreeze或Main runtime；首误扫testing历史selftmp的只读边界例外已单列，不将其抹成“所有临时目录零读”。未写livingdocs，不 Git add/commit/push/tag/release。所有现有dirty不恢复、不删。

本单交付后释放 `okrs.tsx`、`okrs-related.test.tsx` 两源写锁并 **STOP**。另一独立SOURCE/AUTO角色审新候选原红/修后邻测；Main唯一builder组织新freeze、全构建/全回归、新host与原第6组GUI复验，再交不同审证专家。源/model/core未改是否继承由专家判，不由本开发签。P2OKR-R1-01仍待独立关门，开发8绿/59绿不得代PASS或ordinarycommit。

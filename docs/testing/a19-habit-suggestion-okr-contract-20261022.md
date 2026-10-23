# A19 习惯建议自身 OKR 展示原红报告

> 2026-10-22，平台 trae，独立测试专家、非开发。报告既有 RA-P3001 / A18-GM-01 的先行合同、真实组件原红与设施状态，供 Main 接续；STOP，不签 PASS，不开发、不签 GUI 或整门。

## 1. 有限结果

**原必要红成立：13 项展示断言全部失败，均为建议自身条目缺“关联 OKR”文本。组件控制 10 项和原样 habit-model 控制 10 项成立。** 这是 1 个既有展示缺陷的多态/边界测试，不是 13 个新功能或新产品缺陷。原 [A18 §5.1 GUI FAIL](a18-growth-more-gui-review-20261022.md#51-a18-gm-01建议关联-okr-未展示) 保留，不重复全审、不覆盖原报告、不用本轮组件测试移签其 GUI。

**设施保护 BLOCKED**：共享依赖内 10 个 `node_modules/.bin/*` 文件 SHA 与 mtime 漂移，bytes未变；来源未确证。原 seal `preserved=false/released=false/exit1` 保留，不为释放把它改绿。产品源码/冻结、主lib/旧lib、A18原审计保护4179路径无漂移。自有测试PID已退出，实际执行资源释放，与保护门是否通过分开表达。

Main 仍须等 **A18 反馈独立门闭**，再获得 `habits.tsx` + 必要同域测试的有限实施授权；本合同/原红不是立即改源码或新build许可。最后统一commit由Main/负责人处理，本角色无commit/push授权。

## 2. 候选与原证

- 完整当前包自有冻结为本前缀 `-selftmp/r1/frozen/`，500输入文件，其中src388。HEAD=origin/main=`9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` 仅基线，dirty候选另绑定 tracked patch、新输入清单与完整manifest，不能拿HEAD代替候选。
- manifest SHA `9c9d6ea9479c146d8bd742b77375a1dd33d95f5f7ee7fc2f4f0c0eb3fa415fd0`；tracked patch SHA `02fb3d70dfb2ffa38c38e9fecee11deab5263efb2fbbec54512018cf68ce7e4e`；新输入清单 SHA `3672a7e09442fa85e8cda655177f9962921608c4f3fc7b14e96259811f6e2227`。完整认领见 [candidate](a19-habit-suggestion-okr-contract-20261022-selftmp/r1/candidate.json)。
- 当前 `habits.tsx` 与原A13对应文件逐字一致：14634bytes，SHA `53b7791a183b6d7343ead5e902fd5d1232f25a7a22d9e3f579158ef652e3fe76`。模型4956bytes，SHA `89f7dd229583427be4e83f07e9e552056389834e91b0d10a9658a1747169f08a`；原测试4015bytes，SHA `f4ec28d31c9d32146480133c3f82b8e68ab4dd91d3e756ac9999d7e8313dd5d6`，未修改。
- `A18/growth-more/index.json` 的970原件逐文件SHA/bytes符合，JSON全解析、未列原件0；33步骤仅核完整性与保护，**不重复A18全业务/全部帧独立目视审签**。
- 原红fixture来自 `pm-habit-1792627598950` 与 `pm-habit-1792627703623` 的完整command/run→done `web snapshot`，与归档 `raw/settings/pmHabitInbox.json` 全文相等。真实建议 `habitsug-mvis68gb-1d1smn` / `habitsug-mvis6kdy-j32ckl` 自身okrId均 `okr-mvi5z847-33y3xk`，同项目真实标题 `F5目标`；重进分别confirmed/ignored。原actual建议段无该ID。只提取归档组件输入，不调用产品命令、服务或live数据。

## 3. 执行结果

环境macOS darwin/arm64，OS24.6.0，Node `v22.23.3`；React/react-test-renderer18.3.1、Vitest2.1.9、Vite5.4.21，项目既有pnpm11.28.5依赖只读，未运行pnpm。自有HOME/TMPDIR/XDG_CACHE_HOME/DSH_HOME、白名单env、compile cache禁用、自有cacheDir、`--no-cache`/cache:false/单fork/1worker；不继承凭据，不启动网络或GUI。

| 命令/组 | 原退出 | 实际结果与边界 |
| --- | --- | --- |
| `node --check ...-run.mjs` | 0 | 语法有效 |
| `node ...-run.mjs freeze` | 0 | 完整输入500、原970件一致、Habits与A13逐字相同；无build |
| `necessary-red` | **1** | **0成立/13失败**；原pending、confirmed、ignored、自身不同目标/重排、missing/缺refs、当前标题刷新、同名不同ID、长文本均在自身关联标签断言失败 |
| `component-controls` | 0 | **10/10成立**：三态理由/稳定ID/动作、三态无关联、外项目筛除/不借同名、冻结props零run、confirm/ignore真实button参数及false不刷新、真实HabitForm/RecordsListbox原提交接口 |
| `original-model-controls` | 0 | **10/10成立**：原标题精确解析、缺失/undefined回退、原计数/状态/streak/日期分组；原测试不改 |
| `node ...-run.mjs run` 聚合 | **1** | 保原必要红，不把“预期失败”转退出0 |
| `node ...-run.mjs seal` | **1** | 自有PID已退出，原/冻结无漂移；共享10bin漂移，保护未过 |
| `node --check ...-check.mjs` 首轮 | **1** | 自有检查器line10引号笔误，未执行；原失败记 `check-initial-syntax-error.json`，仅修本检查器 |
| `node --check ...-check.mjs` 修后 | 0 | 仅自有检查器语法有效，不改原红/原seal |
| `node ...-check.mjs` 首轮 | **1** | 误用JSON键顺序比较，4179条原指纹同值被误报；原 `final-check.json` 保留，不当产品/原证漂移事实 |
| `node ...-check.mjs` r2 | **1** | 逐字段核原4179/当前源/冻结差异0，原reporter一致；11077唯一监测文件仅10bin漂移，设施BLOCKED；自有资源释放、不签PASS |
| `git diff --check -- 本前缀` | 0 | 本前缀无空白差错；不是产品或保护门PASS |

必要红组的10个控制被testNamePattern排除；控制组的13个原红被排除，共同实际覆盖23项，不能把reporter中的pending算产品通过或未写用例。原模型另10项实际执行。每组argv/cwd/env/PID/起止/exit/signal/stdout/stderr/JSON reporter与观测全文保留在 [r1](a19-habit-suggestion-okr-contract-20261022-selftmp/r1/summary.json)，summary SHA `676608c976f5663f9b47ce0df63cfe7a8cdcd85ab46baf8f18afc77c7d6c2a3e`。

当前13红都在首个关联标签断言停止，标题/原ID/重排/刷新/长标题后续正断言**本轮尚未到达**，不称这些边界已验通过；它们作为修后必须完整执行的合同保留。无关联和不借目标的负控制已实际执行。DOM全文/普通文本断言不是窄屏布局、浏览器可见、读屏或后端写守卫证据。

完整命令（macOS仓库根）：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/a19-habit-suggestion-okr-contract-20261022-run.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a19-habit-suggestion-okr-contract-20261022-run.mjs freeze
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a19-habit-suggestion-okr-contract-20261022-run.mjs run
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a19-habit-suggestion-okr-contract-20261022-run.mjs seal
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/a19-habit-suggestion-okr-contract-20261022-check.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a19-habit-suggestion-okr-contract-20261022-check.mjs
git diff --check -- 'docs/testing/a19-habit-suggestion-okr-contract-20261022*'
```

## 4. 最小修复与复验交接

具体 [计划与测试矩阵](a19-habit-suggestion-okr-contract-20261022-plan.md)、[可执行cases](a19-habit-suggestion-okr-contract-20261022-cases.test.tsx) 已先行落盘。`PmPanel` 当前按selected项目过滤okrs后注入Habits；建议各自身okrId用原resolver精确命中**当前注入清单**，不要新增后端查询/project字段/模型裁决。

获准后最小产品范围是 `src/client/views/habits.tsx` 建议li内的只读关联行，命中“标题（原ID）”、missing保旧ID、无关联省略或诚实“未关联”。必要同域组件测试可由开发另新增；不覆盖本独立原件。不改confirm/ignore/final、HabitForm/Records controls、backend/schema、habit-model兼容行为、统计/aggregate、其余成长功能。

只读长标题需要自然换行、ID普通文本可辨；局部有限GUI补件建议原1440深色和390窄档，只核新增关联行不撑宽、不压按钮/理由/状态；不把待表决完整矩阵升格为本批新门。不预授权全局CSS或通用语义重构。修后新独立SOURCE/AUTO -> Main唯一新构建/实际下发 -> 原两建议pending→confirm/ignore→重进GUI补证与必要边界 -> 独立复验，不能用本轮20控制成立替代任一步。

## 5. 设施异常与STOP

保护原A18审计4179路径、A13/A14/A16完整源/453产物/旧报告/原失败、主源码与配置/lib、A11/A12旧lib。**不把Main其他新增/在途证据纳零写，不声称整盘零污染**。原970件复核只读。

共享依赖变化精确限定为10个 `.bin`：react的loose-envify；vitest的vite/vite-node/vitest/why-is-node-running；typescript的tsc/tsserver；vite的esbuild/rollup/vite。before/after SHA、bytes与mtime全部保留在 [summary](a19-habit-suggestion-okr-contract-20261022-selftmp/r1/summary.json) 和 [seal](a19-habit-suggestion-okr-contract-20261022-selftmp/r1/seal.json)；不是仅时间变化。变更mtime约UTC00:30:38.610～00:30:40.371，与执行尾段交叠，但无写入者证据，不能归因给Main或本方。执行器无install/build、未调用.bin脚本，不由此反推漂移来源确定。

不恢复/删除/修改这些共享文件，不追加测试去洗绿；设施BLOCKED交Main核共享依赖写者及后续隔离方式。原 `seal.released=false` 表示整体保护断言未过，不能当自有进程还在运行。

自有Vitest PID60836/60845/60856均已退出（ps退出1、stdout空），冻结/测试命令已结束，没有GUI/服务/端口/builder占用。最终自有check逐项核reporter/原红、原4179路径/当前源/冻结及资源状态，首轮比较键顺序的误报结果 `final-check.json` 不覆盖；更正为逐字段SHA/bytes/mtime后另写 `final-check-r2.json`。监测唯一文件11077个；如10bin漂移仍在，退出仍1、保护BLOCKED，不伪写全绿。**资源释放，报告STOP，不签PASS，不开始产品修复/新功能，不commit/push。**

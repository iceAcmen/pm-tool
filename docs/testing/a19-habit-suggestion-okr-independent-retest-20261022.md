# A19 建议自身 OKR 展示独立复验报告

> 2026-10-22，平台 trae，不同独立测试专家、非开发。只对 A18-GM-01 修复的 SOURCE/AUTO 给有限判定，供 Main 接续；不签 GUI、全习惯或整门。

## 1. 有限结论

**SOURCE：有限 PASS。AUTO：有限 PASS。资源释放。** 未发现本批展示修复的确证产品缺陷。原必要13、controls10、model10、作者11、独立新增15及受影响131全部实际通过，全生产 noEmit exit0。不同测试共190，不将首轮受影响80与131再累计；作者175仍是作者自验，不冒充独立结论。

**本轮 GUI：NOT_RUN，不移签。原 A18-GM-01 GUI FAIL 保留，待新候选实际装载与有限 GUI 补证独立关闭。旧 A19 共享10bin历史设施 BLOCKED 原样保持。** 新副本隔离证明不能证明旧漂移已解决，也不推断历史写入者。

本次授权仅本前缀和自有 tmp 可写，禁产品/其他testing/livingdocs/build/install/GUI/services/credentials/commit/sharedcache/lib。Main 保持主源静态、仅旧A18实例采既有旅程。本角色未运行上述禁止动作，没有共享builder/服务/GUI所有权，不转为开发修缺陷或开启下一功能。

## 2. 候选认领

最终[作者Markdown](../../reports/a19-habit-suggestion-okr-developer-20261022.md) SHA `0c3276591abd4865a3e2107369f9a437ef39a229bf6b2e48c95f11e36db5961c`；作者153件索引逐文件SHA/bytes/JSON核对、无未列文件，索引SHA `dc8ae3cf855dafca5ef84bd7f499f116bb671287cbc23acef4bc7be06a353cd6`。作者seal/close原exit0、8407枚举条目无漂移与资源释放核实，不据作者绿直接签PASS。

基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` 仅基线；当前未提交候选以[完整认领](a19-habit-suggestion-okr-independent-retest-20261022-selftmp/r3/candidate.json)、tracked binary diff、新输入清单和冻结manifest绑定，不能用HEAD代替。

| 对象 | SHA256 |
| --- | --- |
| `src/client/views/habits.tsx`，15422 bytes | `f8434485002b4b6aab494655ee31613c7caec15a9a4a5a3e9b87568f07f766f3` |
| 新同域 `habits-suggestion-okr.test.tsx`，5036 bytes | `8d7220cff8f01ed9d43dd00d1e59584936f4aa7ed68612aa40b56f00ca7cc709` |
| 独立完整冻结508输入/389 src的manifest | `1655cac041d2ab1219a4d6a8a16559c2f37ef6f104c6a8ceaf46cc4f609369e7` |
| 完整包tracked binary patch | `c2ae0780e9847f52a47fc9b5ed274ec14ec9f4fd8a16d810058f6f876b29e13f` |
| 全仓tracked binary patch，与作者修后相同 | `ee83a92415f06bb2793a224c46031849222e013592c4565e70b79b819ea0aced` |
| 新产品输入清单，与作者修后相同 | `0948743344c358c6e31ef57ba67cb188231bd6c332d7affec3927ebcf4e6c6ea` |

作者修前/修后仅上述两文件内容差异；本轮主源与作者修后502声明输入逐字相等。独立另完整冻结README/.gitignore/workspace/core配置/包内docs，共508源输入；不复制或写lib/运行数据/生成目录。自有树 `/private/tmp/pmtool-a19-independent-retest-20261022-r3/frozen`。508与作者502/旧520等计数口径不同，不虚称旧manifest全相同。

源码审查确认：建议按 `s.projectId` 筛除明示外项目refs，再用既有resolver精确ID解析；未带项目字段的最小refs沿父层同项目预过滤合同。`panel.tsx:889-891,1452-1460` 的实际过滤与注入未改。建议li的普通p保自身ID，missing回退旧ID，无关联省略；未改模型/schema/confirm/ignore/final/统计/sharedCSS。局部自然换行规则只作源码/组件证据，不称窄屏通过。

## 3. 原命令与结果

环境 macOS darwin/arm64、OS24.6.0、Node `v22.23.3`；Vitest2.1.9、Vite5.4.21、React/react-test-renderer18.3.1、TypeScript5.9.3。pnpm11.28.5为项目约定，**本轮没有调用pnpm或安装器**。白名单env，独占HOME/TMPDIR/DSH_HOME/XDG_CACHE_HOME，禁compile cache、cache:false/--no-cache、单fork/1worker、固定Node直入工具JS，不执行.bin/shim。

| 阶段/组 | 原exit | 实际结果 |
| --- | ---: | --- |
| 首freeze | **1** | 自有检查器把独立副本inode差异当内容差异；没有产品测试执行，原失败保留 |
| r2 freeze | **1** | 自有版本读取误假设顶层Vite存在；复制后停在版本信息，原失败保留 |
| r3 freeze | 0 | 作者最终原证与候选认领、508输入冻结、完整依赖隔离 |
| necessary，原cases `^HS-R` | 0 | **13/13**，后续标题/原ID/重排/当前刷新/missing/普通文本断言实际到达 |
| controls，原cases `^HS-C` | 0 | **10/10**，三态结构、无关联、过滤、零run与原表单接口 |
| model，原样 `habit-model.test.ts` | 0 | **10/10**，不改原断言 |
| author，原样新同域test | 0 | **11/11** |
| independent，自有新增case | 0 | **15/15**，详下节 |
| affected首轮，原9文件 | **1** | **80绿/1套件加载失败**，准确缺原BoardBento fixture，完整ENOENT/reporter保留 |
| 全包 `tsc --noEmit --incremental false -p <frozen包>/tsconfig.json` | 0 | 全生产源码类型检查，stdout/stderr均0bytes；非构建 |
| run外层 | **1** | 保受影响fixture设施原失败，不将预期失败洗为0 |
| supplement，原fixture原样复制后原12文件 | 0 | **131/131，12文件**；原9 + ResultCard/复制/core反馈，不改产品或测试期望 |
| seal / close | 0 / 0 | 限定保护零漂移、精确PID退出、原外层真实退出回执与自有更正diff归档 |
| 语法 / 本前缀diff检查 | 0 | 自有文件检查，不替代产品或GUI门 |

原necessary组排除10 controls，controls组排除13 necessary；reporter pending为testNamePattern过滤，不是通过或漏写测试。受影响stderr保既有TaskTable缺key warning，不擅改其他产品，不声称所有测试stderr为空。

所有argv/cwd/env/PID/起止/originalExit/signal/stdout/stderr/reporter与观察全文在 [r3原证](a19-habit-suggestion-okr-independent-retest-20261022-selftmp/r3/)。外层真实execution.json/output另在 `close/`；不能仅凭文件存在补造退出。受影响原文件列表在 `affected-original-files.json` 与 `supplement/affected-files.json`。

完整阶段原命令（仓库根macOS；已存在输出拒覆盖，不要求覆盖重跑）：

```sh
env -i PATH=/usr/bin:/bin NODE_DISABLE_COMPILE_CACHE=1 /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/a19-habit-suggestion-okr-independent-retest-20261022-run.mjs
env -i PATH=/usr/bin:/bin NODE_DISABLE_COMPILE_CACHE=1 /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/a19-habit-suggestion-okr-independent-retest-20261022-close.mjs
env -i PATH=/usr/bin:/bin NODE_DISABLE_COMPILE_CACHE=1 /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a19-habit-suggestion-okr-independent-retest-20261022-run.mjs freeze
env -i PATH=/usr/bin:/bin NODE_DISABLE_COMPILE_CACHE=1 /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a19-habit-suggestion-okr-independent-retest-20261022-run.mjs run
env -i PATH=/usr/bin:/bin NODE_DISABLE_COMPILE_CACHE=1 /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a19-habit-suggestion-okr-independent-retest-20261022-run.mjs supplement
env -i PATH=/usr/bin:/bin NODE_DISABLE_COMPILE_CACHE=1 /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a19-habit-suggestion-okr-independent-retest-20261022-run.mjs seal
env -i PATH=/usr/bin:/bin NODE_DISABLE_COMPILE_CACHE=1 /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a19-habit-suggestion-okr-independent-retest-20261022-close.mjs
env -i PATH=/usr/bin:/bin NODE_DISABLE_COMPILE_CACHE=1 /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a19-habit-suggestion-okr-independent-retest-20261022-run.mjs index
git diff --check -- 'docs/testing/a19-habit-suggestion-okr-independent-retest-20261022*'
```

## 4. 独立反例

[自有15项](a19-habit-suggestion-okr-independent-retest-20261022-cases.test.tsx) 实际挂载未mock的HabitsView，各断言定位稳定建议ID及自身关联p，不在全页借habit卡标题：

- IR-ID ×3：前后缀近似ID、其他建议/习惯关联干扰；只精确自身ID。
- IR-PROJECT ×3：完整refs中前置外项目同ID、跨项目同名、同项目另一ID；重排/切项目后只显示自身正确关联，冻结props原样，零run/onSaved。
- IR-MISSING ×3：undefined/[]/只有外项目命中ID；每态保旧ID、不借同名或别目标，不说未关联。
- IR-NONE ×3：无ID省略关联、不借邻目标、不增操作；三态原按钮结构保持，零自动命令。
- IR-ACTION ×2：confirm和ignore分别准确 `habit <action> <稳定建议ID>`；false不刷新、true仅一次刷新；更新到processed、标题改名、卸载重挂后原ID/理由/状态保留，无写按钮或额外run。
- IR-TEXT ×1：script/img/javascript链接外形逐字是普通p字符串，无innerHTML/活动元素/新role/aria-live。只组件文本，不声称SSR、读屏、窄屏或真实浏览器安全验收。

## 5. 原红、设施补件与保护

原[先行报告](a19-habit-suggestion-okr-contract-20261022.md)、原13红、seal exit1/preserved=false/released=false、历史10bin漂移全部只读保留。作者修前原13同样逐项在关联标签失败，核原reporter与exit1；本轮13修后全链绿不改原件。

BoardBento只补 `docs/testing/board-fixture-clarification-20261021-fixture.json` 原件到自有冻结；源/副本SHA/bytes一致且前后不变，无期望修改、无产品adapter。首次80绿/加载失败exit1不覆盖。

自有检查器两次设施失败保完整回执/输出；仅修自己跨副本内容判定及嵌套Vite版本读取。自有追加SSR设施要求因顶层react-dom不可用未执行，改用既有真实renderer普通文本断言；修改前cases/run、精确diff及理由均在 `r2/`、`r3/close/own-*-correction.*`。原合同/作者test/fixture一字未改，不把自有设施失误列产品FAIL。

完整依赖从指定 `/private/tmp/pmtool-a19-owned-deps-20261022/node_modules` 复制到自有 `...-r3/dependencies/node_modules`；13613普通文件hash/bytes/link一致，1030链接逐条realpath闭合在自有副本，外链0/共享inode0。源及副本全量SHA/bytes/mtime/inode前后无漂移。shim历史绝对前缀只文本、未修改/执行；**不扩大为动态绝对解析全闭合**。

[终seal](a19-habit-suggestion-okr-independent-retest-20261022-selftmp/r3/seal.json)：24708枚举条目、22378唯一路径，包含作者原证/原A19专家全件、A18完整冻结与453旧产物、原GUI970索引及原件、A13/A14/A16与其他指定旧源/lib、主完整输入/主lib/既有cache精确根、Launcher源和测试及指定依赖源。全部新增/删除/SHA/bytes/mtime/inode差异0。没有构建或写入旧453产物。

未监控Main其他合法新增GUI/docs/runtime或整盘，不声称整盘零污染。未读取凭据、操作profile或服务，无HTTP/GUI调用。自有8个测试/类型检查PID `82581/82629/82713/82730/82757/82771/82801/83086` 全退出，ps原exit1/空stdout；所有freeze/run/supplement/seal外层已真实exited，tmp原件保留供审证、不删除资源。

## 6. 释放与接续

**本角色完成并释放，有限SOURCE/AUTO PASS。** Main可据同一认领候选另安排唯一新构建/完整verify/coverage与实际下发；本报告不替那些门。随后按原计划补两建议pending→confirm/ignore→重进及1440深色/390长标题、missing/无关联局部GUI证据，交独立专家审签。

原A18-GM-01 GUI FAIL、历史10bin BLOCKED及其他全部积压/总门保持各自原范围；没有普通commit/push/tag/发布/正式切换。本角色不继续开发或开启reflection/U4。

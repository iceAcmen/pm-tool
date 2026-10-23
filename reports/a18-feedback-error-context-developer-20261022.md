# A18 明确 catch 错误上下文开发交回

> 2026-10-22，trae，唯一 A18 开发。给 Main 与不同独立专家核源码、原红与开发绿、保护和释放；本报告不自签 PASS，不签 GUI、整门或 commit。

## 1. 当前状态与重要边界

已按批准的 [有限计划](../docs/plans/2026-10-22-feedback-error-context-closure.md)实现：已知 run catch 将可选 `{ kind: 'error' }` 独立传到生产 `classifyFeedback`、ResultCard 和 FeedbackToast。该上下文下全文作为非结构化原因，`isError=true`、`action=null`、`detail=null`、`autoDismissMs=null`，显示持久 alert，不产生成功 toast 或可执行原因动作，保留原 `Error.message`/`String(error)` 与单次场景前缀，全文可复制。

**开发新增测试原 13 红 → 同原测试 13 绿，最终补证 16/16 绿；但原专家完整 20 反例仍为 19 绿 / 1 红，run 原 exit1，不标全绿。** 原 TF-X08 的真实错误卡断言已通过 role/aria-live/错误类名/图标，随后停在原 `expectError()` 第 60 行无上下文调用 `classifyFeedback(card().props.message).autoDismissMs`：`expected 3000 to be null`。原全文/复制断言在这个旧用例中仍未到达，不能记为已执行。

这是需要不同专家审证的 oracle 接缝：批准计划要求缺省 string 调用保持原成功信封行为，已知 error 必须从 catch 独立给类别。**不以扫描英文/中文前缀、删标记、注册全局字符串类别或改旧 expect 洗绿。** Main 在本轮中亦明确要求保原红、必要 adapter 由不同专家在其自有拷贝记录完整 diff。开发没有制作该 adapter、没有改任何 testing 原件。最终 A18 同域测试用原 TF-X08 的生产信封与完整正文，实测上下文路径的全文、复制、持久和无 toast；同时断言该同一字符串缺省调用仍为 structured success / TTL3000。

下一步：不同专家冻结当前完整源并独立复验，处理其自有 oracle adapter，审证原失败与最终源码。只有其有限 SOURCE/AUTO 放行后 Main 才唯一新 A18 build/GUI；不构建失败 A17，不覆盖 A16 或以旧 3247 证明新修复。积压整门、最后统一普通 commit 仍未关闭。

## 2. 授权与写面

负责人首句及范围：

> 限定开发TF-X08 catch原因含成功标记反转已独立P2FAIL；用户持续既有验收/确证修复/独立分工/最后统一commit授权。读AGENTS/collab、docs/plans/2026-10-22-feedback-error-context-closure.md与a17-transport-feedback-independent-retest报告/plan/cases及selftmpr1TF-X08原红。只认领panel.tsx消息状态/catch/Toast与ResultCard透传、client/result-card.tsx可选显式error上下文、core/ui-feedback.tsclassify可选context、client/panel-transport-error-feedback.test.tsx与必要samearea测试，reports/a18-feedback-error-context-developer-20261022*。若超此写面先报告；不backend/schema/model/refresh语义/其他页面/其他testing/livingdocs/build/install/GUI/services/credentials/commit/sharedlib/cache。

继续要求：Main 唯一 builder/GUI，A16 source/lib/host3247 与原证保持；先自有完整 src 冻结原失败对照，专家 expect 不改；context 内存可选、不改协议、默认字符串行为保持；success/close 清上下文、旧 timer/copy 与同值新消息代际隔离；原 20/五组/14/65/53/PC/扩展/noEmit 用 no-cache 单 fork 白名单自有 HOME/TMP/cache；报告后释放、不自签 PASS、不同专家再审。后续 Main 原句：

> 原expectError若直接classifyFeedback(message)不传新context而期望null，与计划旧string默认成功控制存在接缝差异：不得改旧expert原件/扫描正文洗绿；真实错误卡/Toast/全文copy保持原预期，若需oracle adapter交不同专家修其自有拷贝记录完整diff/旧红保。

实际仅写三个产品文件、三个必要 same-area 测试与本前缀 report/run/check/selftmp：

- `client/panel.tsx`：消息、context、generation 同一 state；普通新消息/close 默认清 error；仅 run catch 明确给 error；透传两处反馈组件；Toast layout 代际+timer 校验。
- `client/result-card.tsx`：可选 context/messageGeneration；分类和复制/详情代际包含 context kind 与新消息编号。
- `core/ui-feedback.ts`：可选 FeedbackContext；显式 error 提前完整非结构化返回，原默认分型代码不变。
- `client/panel-transport-error-feedback.test.tsx`：保原14，增加9条真实面板测试。
- `client/result-card.test.ts`：保原4，增加3条同值 context/复制代际测试。
- `core/ui-feedback.test.ts`：保原原件内容，追加4条显式类别/缺省兼容测试。

没有改 backend/schema/model/CSS/refresh/恢复/导出/其他页面/其他 testing/livingdocs/package/lock/构建资源。quiet 成功仍按旧策略不发新全局消息，不新增清旧消息政策；普通新 success 清 error。四 type/PC/extension 在途改动全部保留。未 fetch/pull 在途脏树，未 install/build/全 verify/GUI/服务/凭据/commit/push/tag/正式切换。记忆绝对入口不存在，以仓库为准；rg 不可用，使用 grep。已读 brainstorming/writing-plans，沿既有已批准计划执行，不额外写计划或提交。Vendor 路由未加载：现独立 FAIL 且本批禁其他写面，遵 external-skills §6.1 的门拦截，不跑 installer/全局配置或借 skill 代替独立门。

## 3. 完整候选

HEAD/origin 均 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，不单独代表 dirty 候选。最终 freeze：

```text
/Users/bytedance/Projects/dsh-pm/pm-tool/reports/a18-feedback-error-context-developer-20261022-selftmp/after-r2/frozen
```

每轮完整复制 `src/scripts/package.json/pnpm-lock.yaml/tsconfig.json/vitest.config.ts`，388 源文件，另原样复制 TF/独立20/PC/扩展测试、合法 board fixture 及 replay。`before-r1` 与原 A17 专家完整产品输入逐文件内容一致，不回改 catch 制造红；`before-r2` 只追加开发测试；`after-r1` 实现13绿；`after-r2` 只补三条面板证据，产品实现未再变。每轮 `candidate.json`、`candidate-tracked.patch`、`candidate-new-inputs.json`、`source-at-freeze.json`、`frozen-inputs.json` 认领完整输入与他人在途，不夺其归属。最终 `approved-source-delta.json` 仅上述六源码/测试文件。收尾保存逐文件 diff，未 touch 其他源码。

| 最终对象 | SHA256 |
| --- | --- |
| panel.tsx | `fa07af612db1546e8df66cb31fb081087eb8aefcf60fd58d8484dca6664a0947` |
| result-card.tsx | `3bf14c4de117ce5e9577f7db0ed8e4bf81196492fd794be95f6df40310dca352` |
| ui-feedback.ts | `94bab4055958c6abb22caf6343173b8e643c58c9da85a28e421b5ef7f86d35d7` |
| panel-transport-error-feedback.test.tsx | `b6c4b78e9fc86012134b1dda9e6ce78b2fc8dd9eef487362681bcf0d1976862a` |
| result-card.test.ts | `cde00f00437f802fefaf542d880f54abf9202eae9c45a3f07ca75d270ae85566` |
| ui-feedback.test.ts | `5687ee7ecefa3680c8794a5e167f6ff1f041da71266fbbc6f8ab8f221094fac0` |
| 完整 frozen-inputs manifest | `e0f2c6ee187843ed9184b3016705817c3cb67ddea95ecb50a3d14cb87ebc06f8` |
| tracked binary patch | `02fb3d70dfb2ffa38c38e9fecee11deab5263efb2fbbec54512018cf68ce7e4e` |
| 新产品输入 manifest | `3672a7e09442fa85e8cda655177f9962921608c4f3fc7b14e96259811f6e2227` |

## 4. 实际开发验证

环境 macOS Darwin24.6.0 arm64，Node22.23.3；既有 pnpm11.28.5 依赖只读使用、未执行 pnpm。React/renderer18.3.1、Vitest2.1.9、TypeScript5.9.3，真实解析目录见 candidate。所有 Vitest node、`--no-cache`、`cache:false`、单 fork/1 worker；每轮 HOME/TMPDIR/XDG_CACHE_HOME/DSH_HOME 与 Vite cacheDir 在自身 out。env 只 PATH/HOME/TMPDIR/XDG_CACHE_HOME/DSH_HOME/CI/LANG/TZ/NODE_DISABLE_COMPILE_CACHE 加 TF/PC input/observations，无凭据继承。fixture 禁 fetch，仅宿主 execute/clipboard/browser globals，不 mock 产品 PmPanel/TaskTable/ResultCard/classifier、不自建状态模型。

| 命令 ID（精确 argv 见各轮 command.json） | before-r1 | before-r2 | after-r1 | 最终 after-r2 |
| --- | --- | --- | --- | --- |
| success-control TF-C01/02 | 0，5绿 | 0，5绿 | 0，5绿 | 0，5绿 |
| explicit-context-control TF-C03 | 0，5绿 | 0，5绿 | 0，5绿 | 0，5绿 |
| original-five-retest TF-F01 | 0，5绿 | 0，5绿 | 0，5绿 | 0，5绿 |
| recovery-control TF-C04 | 0，2绿 | 0，2绿 | 0，2绿 | 0，2绿 |
| independent-counterexamples20 | 1，19绿1红 | 1，19绿1红 | 1，19绿1红 | **1，19绿1红** |
| developer-a18-context | 未运行 | **1，0绿13红** | **0，13绿** | **0，16绿** |
| existing-regression65 六原文件+本区新增7 | 未运行 | 未运行 | 0，72绿 | 0，72绿 |
| developer-transport14 原14过滤 | 未运行 | 未运行 | 0，14绿 | 0，14绿 |
| revised-pc4 | 未运行 | 未运行 | 0，4绿 | 0，4绿 |
| expert-extension28 | 未运行 | 未运行 | 0，28绿 | 0，28绿 |
| parent-extension4 | 未运行 | 未运行 | 0，4绿 | 0，4绿 |
| independent23 | 未运行 | 未运行 | 0，23绿 | 0，23绿 |
| developer-extension23 | 未运行 | 未运行 | 0，23绿 | 0，23绿 |
| affected-regression87 | 未运行 | 未运行 | 0，87绿 | 0，87绿 |
| panel-and-import-regression53 | 未运行 | 未运行 | 0，53绿 | 0，53绿 |
| noemit 完整tsconfig | 未运行 | 未运行 | 0，无诊断 | 0，无诊断 |

四 TF 过滤组 pending12/12/12/15 是同文件其他组，均分别执行，不记 PASS。原开发14过滤 pending最终9；A18过滤 pending46，是保留的其他测试，另已回归。六原文件65+追加核心4/卡3=72，不把新增或重叠统计当唯一用例总数。before-r2 的13失败都是产品行为断言，非导入失败；failedSuites 由包含 describe 的 reporter 统计，完整原 JSON保留。

16项覆盖：普通/quiet 原生产信封+action+空白尾部原因全文持久、原 TF-X08 精确全文/复制、无错误动作按钮且只有 snapshot/一次写命令；正常 success 清 context/close再开；同正文两次 catch 清复制及旧resolve/reject不串；直接 ResultCard 同值 context双向切换清详情/复制，旧resolve/reject不串；同值同context新代际；同值新success重计时、旧timer已经排队晚调用不藏新toast；相同正文 catch→正常success→catch 旧复制双结果隔离；显式 error 无关键词原因也error，默认成功信封/动作/成功含失败/Failed/Error 不变。全组开发绿不是独立验收。

完整执行入口（仓库根；绝对Node不加载真实HOME配置）：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check reports/a18-feedback-error-context-developer-20261022-run.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a18-feedback-error-context-developer-20261022-run.mjs freeze before-r1
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a18-feedback-error-context-developer-20261022-run.mjs run before-r1
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a18-feedback-error-context-developer-20261022-run.mjs final before-r1
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a18-feedback-error-context-developer-20261022-run.mjs freeze before-r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a18-feedback-error-context-developer-20261022-run.mjs run before-r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a18-feedback-error-context-developer-20261022-run.mjs final before-r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a18-feedback-error-context-developer-20261022-run.mjs freeze after-r1
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a18-feedback-error-context-developer-20261022-run.mjs run after-r1
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a18-feedback-error-context-developer-20261022-run.mjs final after-r1
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a18-feedback-error-context-developer-20261022-run.mjs freeze after-r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a18-feedback-error-context-developer-20261022-run.mjs run after-r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a18-feedback-error-context-developer-20261022-run.mjs final after-r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check reports/a18-feedback-error-context-developer-20261022-check.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a18-feedback-error-context-developer-20261022-check.mjs
```

每轮 freeze/run/final 原 exit **0/1/0**；所有 run 的1保留失败，不用 final0覆盖。check语法/收尾0仅设施保护与释放，非产品门。执行器拒覆盖已有轮次。每条真实 argv/cwd/env/PID/时间/原exit/signal/stdout/stderr/reporter/observations 完整保存在 selftmp；noEmit 为 Node+既有tsc `--project <完整冻结包>/tsconfig.json --noEmit --incremental false`，原 test exclude 不变，未 emit/lib。

| 最终证据 | SHA256 |
| --- | --- |
| commands.json | `2dda22cff43dc37c5419df12d373cbf8fcc46ee107e33b246bcb84a8e4569ec0` |
| summary.json | `04995fddb56c9d20b4a2f9718debfc93e9e2d8417effe357252041c674e5e4b1` |
| 原20反例新reporter | `b3473710cbbca1166fc2207f8a1076bf8fc60bbf757a3d6a4808beb72f1cd68c` |
| 原20反例新stderr | `b2856e05b02f4322882cc30e24aedfa13a0474af2bcb213be706708947bef685` |
| 新16开发反例reporter | `ef6ae2b5db893850761fb14fa0106e46154eb58c5b93b12d51ac6c7889b2ce5c` |

## 5. 保护、释放与未覆盖

最终 `final-after-r2/final.json`：`protectionOk=true`、`protectedDrift={}`、`frozenDrift={}`、`sourceDrift={}`、`testsDrift=[]`、`declaredA16Drift=[]`、`noRecordedChildren=true`、`released=true`、`developerCommandsAllZero=false`、`independentSignoff=false`。294保护根有重叠，不当独立文件数；含完整主产品输入、主lib/旧A11..A16、实际A16 source/lib及声明产物、原开发/专家报告与失败输入/输出、实际两处依赖全树和继承声明cache。均前后hash/bytes/mtime无漂移，复制精度仅同域比较。Main持续追加 GUI原证/新 runtime 非零写根，不误报其合法新增为污染，不覆盖。

`close-r1/close.json` 另逐字/mtime核四轮整个out与各轮终检清单，核全部原command/stdout/stderr/reporter哈希、原专家 TF-X08 原红原exit/reporter/观测及最新主源，保存逐文件diff和自身report/run/check指纹。精确本角色全部测试PID查询已不存在；ps原exit1空输出是无这些PID，未停任何服务。原A17专家r1/r2、开发before/after设施失败和本批before13红/原TF-X08旧红/两轮修后oracle红均完整保留。没有新建失败A17输出、没有覆盖或访问3247实例。

GUI、computed style/颜色/读屏、原生chooser、真实传输故障、后端事务/落盘、Main完整build/verify、实际新A18宿主下发尚未执行或审签。真实面板 JSX/离线证据不能代替这些门。Main仍等待 extension selection 独审和无关治理采证，本开发没有重叠。交回后不再写本批产品/冻结输出；不同专家独立审证，然后 Main 唯一新A18输出/GUI，最终积压整门闭合后统一commit；无push/tag/发布/正式切换。

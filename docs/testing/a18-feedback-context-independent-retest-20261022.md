# A18 错误上下文独立 SOURCE/AUTO 复验

> 2026-10-22，trae 独立测试专家，非开发。给 Main 与接续专家核候选、原红、独立 adapter、回归及释放；只签本批有限 SOURCE/AUTO，不签 GUI、整门或 commit。

## 1. 有限结论

**SOURCE PASS；有限 AUTO PASS（采用下述独立接口 adapter）。原样20仍为 FAIL：19绿1红，不撤销、不洗绿。GUI BLOCKED / 本角色未审签；整门未放行。** 本角色已释放，没有源码写者/build/GUI/服务占用，Main 可按批准计划成为唯一 builder 建新 A18 输出；旧 A16/A13 源和产物不能证明新修复激活。

原 TF-X08 已独立原样运行：真实卡 role=alert、assertive、error class、AlertTriangle/无Check均通过，第60行 `classifyFeedback(card().props.message).autoDismissMs` 仍为3000，原 exit1、完整 reporter/stderr/观测保留。该次全文/复制断言未到达，不记 PASS。随后独立 adapter 原20为20/20，原 TF-X08 的全文显示、原文复制确实执行；另16项独立反例补持久/无动作/Toast/context/generation/复制/timer竞争，全部通过。没有产品缺陷修补、没有改原五 expect。

## 2. Adapter 判断

批准设计要求**缺省 string 成功信封行为不变**，只在已知 run catch 传独立内存错误类别。原第60行取正文却没取真实卡 context，不能同时满足“同一字符串缺省 TTL3000”与“该调用 TTLnull”；修改产品扫中文/英文前缀、注册字符串类别或删原因标记均违反批准边界。

独立合理更正是仅让这条 TTL 断言采用**实际生产卡的 context**，而不是另造类别。自有副本唯一差异：

```diff
-  expect(classifyFeedback(card().props.message).autoDismissMs).toBeNull()
+  expect(classifyFeedback(card().props.message, card().props.context).autoDismissMs).toBeNull()
```

删除这一处插入即完整逐字原件，未移除/放宽断言，fixture/名称/步骤/原expect其余字节完全相同；原五独立文件未改。该 helper 在其全部旧20中使用新接口，原失败不能转述成“原件20全绿”。完整原件、副本、diff和理由在 `selftmp/r3/adapter-original.test.tsx`、`frozen/docs/testing/*-adapter.test.tsx`、`adapter-diff.stdout.log`、`adapter-contract.json`。

独立16项覆盖：

- 原 TF-X08 精确生产信封正文，普通/quiet 两路径 alert/图标/全文/复制/20秒持久/无toast/无动作，且同字符串缺省仍success/TTL3000。
- 动作标记+空白尾部原因普通/quiet全文复制与60秒持久，只有关闭/复制按钮、无任何原因执行；原宿主仅snapshot与一次写命令。
- 相同正文 error→success→error，context清除/恢复、generation递增、详情清除、迟到复制resolve/reject不污染；同正文同error新代际也隔离。
- close重开后正常消息不残留context，旧复制晚到隔离；卸载旧卡后重挂同错误的复制晚到隔离。
- 同值success过期后重现并重新完整计时；已排队旧timer跨catch/close/新success多次晚到不隐藏新toast。
- 当前复制拒绝真实失败反馈、只复制重试不重发命令；quiet成功保原不发新全局消息策略，不新增清旧消息政策。

这是 JSX/宿主边界自动化，不是浏览器实测、后端真实事务、颜色/读屏或真实网络失败证据。

## 3. 完整候选与 SOURCE

父授权完整见 [计划](a18-feedback-context-independent-retest-20261022-plan.md)。已读 AGENTS、collaboration §9/§11、批准错误context计划、A17合同/原20/完整selftmp、A17/A18报告与run/check/原日志。未 fetch/pull 脏树、未install/build/fullverify/GUI/services/credentials/commit；只新增本 testing 前缀，未启动其他 Agent。技能仅用于理解已批准计划与测试组织，不另开产品设计或vendor流程。指定memory入口不存在，以仓库为准。

自有当前完整主源冻结：`docs/testing/a18-feedback-context-independent-retest-20261022-selftmp/r3/frozen`。完整 `src/scripts/package.json/pnpm-lock.yaml/tsconfig.json/vitest.config.ts`，388源文件，逐文件与开发 after-r2一致。HEAD/origin均 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，不是单独候选身份；tracked patch、新输入清单和全manifest共同认领在途成果，不夺他人归属。

相对开发before-r1只有六个批准文件：`client/panel.tsx`、`client/result-card.tsx`、`core/ui-feedback.ts`和对应三个same-area测试。逐文件diff保留；其他全部输入内容不变。已审三个产品delta：消息/context/generation同state；仅run catch赋error；普通新通知/关闭清context；ResultCard/Toast同源分类、依上下文和generation隔离复制/timer。共享classifier默认分支从 `const parsed = parseFeedback(message)` 到文件末尾全部逐字原样。refresh/恢复/导出源码路径未扩修；后端/schema/model/CSS/API/其他页面不动。

| 文件 | SHA256 |
| --- | --- |
| panel.tsx | `fa07af612db1546e8df66cb31fb081087eb8aefcf60fd58d8484dca6664a0947` |
| result-card.tsx | `3bf14c4de117ce5e9577f7db0ed8e4bf81196492fd794be95f6df40310dca352` |
| ui-feedback.ts | `94bab4055958c6abb22caf6343173b8e643c58c9da85a28e421b5ef7f86d35d7` |
| panel-transport-error-feedback.test.tsx | `b6c4b78e9fc86012134b1dda9e6ce78b2fc8dd9eef487362681bcf0d1976862a` |
| result-card.test.ts | `cde00f00437f802fefaf542d880f54abf9202eae9c45a3f07ca75d270ae85566` |
| ui-feedback.test.ts | `5687ee7ecefa3680c8794a5e167f6ff1f041da71266fbbc6f8ab8f221094fac0` |

完整冻结manifest `e0f2c6ee187843ed9184b3016705817c3cb67ddea95ecb50a3d14cb87ebc06f8`；tracked patch `02fb3d70dfb2ffa38c38e9fecee11deab5263efb2fbbec54512018cf68ce7e4e`；new-input manifest `3672a7e09442fa85e8cda655177f9962921608c4f3fc7b14e96259811f6e2227`。细节见r3 `candidate.json/source-at-freeze.json/frozen-inputs.json`。

## 4. 独立执行与原证审计

环境macOS Darwin24.6.0 arm64 + Node22.23.3；既有pnpm11.28.5依赖只读、未执行pnpm。React/renderer18.3.1、Vitest2.1.9、Vite5.4.21、TypeScript5.9.3；真实依赖解析目录见candidate。全部node/no-cache/cache:false/单fork/1worker；HOME/TMPDIR/XDG_CACHE_HOME/DSH_HOME和cacheDir在自有r3；env仅PATH/HOME/TMPDIR/XDG_CACHE_HOME/DSH_HOME/CI/LANG/TZ/NODE_DISABLE_COMPILE_CACHE，测试额外TF/PC输入/观测，禁网络/无凭据继承。仅fixture宿主execute/clipboard/browser globals，不mock产品或自建状态模型。

| 命令ID | 原exit | passed/failed/pending | 判定 |
| --- | --- | --- | --- |
| original-counterexamples20 | **1** | **19/1/0** | **原件FAIL保留** |
| adapter-counterexamples20 | 0 | 20/0/0 | 独立adapter有限PASS |
| independent-context-counterexamples | 0 | 16/0/0 | PASS |
| success-control | 0 | 5/0/12 | PASS |
| explicit-context-control | 0 | 5/0/12 | PASS |
| original-five-retest | 0 | 5/0/12 | PASS，原五不改 |
| recovery-control | 0 | 2/0/15 | PASS，原CSV/XLSX保预览/busy/retry |
| original-a18-13 | 0 | 13/0/49 | PASS，同原13名称/断言 |
| developer-a18-16 | 0 | 16/0/46 | PASS |
| original-regression65 | 0 | 65/0/7 | PASS，原65名称均在当前72内 |
| current-regression72 | 0 | 72/0/0 | PASS |
| developer-transport14 | 0 | 14/0/9 | PASS |
| revised-pc4 | 0 | 4/0/0 | PASS |
| expert-extension28 | 0 | 28/0/0 | PASS |
| parent-extension4 | 0 | 4/0/0 | PASS |
| independent23 | 0 | 23/0/0 | PASS |
| developer-extension23 | 0 | 23/0/0 | PASS |
| affected-regression87 | 0 | 87/0/0 | PASS |
| panel-and-import-regression53 | 0 | 53/0/0 | PASS |
| noemit | 0 | 完整原tsconfig无诊断 | PASS，不emit |

过滤项pending/skipped不是PASS，其他组已分别执行；组间有重叠，不相加充独立总数。`adapter-diff`和六源码`diff`原exit1表示预期差异，不替代产品结论。r3 freeze/original/adapted/final原exit **0/1/0/0**；check语法及执行均0。准确命令：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/a18-feedback-context-independent-retest-20261022-run.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a18-feedback-context-independent-retest-20261022-run.mjs freeze r3
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a18-feedback-context-independent-retest-20261022-run.mjs original r3
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a18-feedback-context-independent-retest-20261022-run.mjs adapted r3
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a18-feedback-context-independent-retest-20261022-run.mjs final r3
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/a18-feedback-context-independent-retest-20261022-check.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a18-feedback-context-independent-retest-20261022-check.mjs
```

所有真实argv/cwd/env/PID/时间/原exit/signal/stdout/stderr/reporter/观测在r3 `<id>.command.json`和`commands.json`，noEmit为Node+既有tsc `--project <完整冻结>/tsconfig.json --noEmit --incremental false`，原test exclude未变。执行器拒覆盖旧轮。

独立审证开发四轮完整sealed目录与终检manifest一致（hash/bytes/mtime），核全部commands/stdout/stderr/reporter对原索引；原13红同名→13绿、最后16，原65→72保所有名称；原A17 r2五红与新五绿同名。原A17独立r1完整封存与所有原审计条目的命令/日志/reporter再核；旧角色失败、开发早期board-fixture ENOENT、先前mtime工具失败及原TF-X08 role红/TTL红均保留。完整索引与失败正文见r3和final-r3 `original-audit*.json`，不是只引用开发口述。

本执行器r1 freeze原exit1（skipped误计17而非5）、r2 freeze原exit1（Vite顶层软链登记ENOENT）均为设施失败，不是产品FAIL；未覆盖旧轮，各自 `freeze-failure.md`和残留输入/证据保留。已修自有统计/依赖解析另开r3，无安装、无产品改动。原13用当前同名过滤重跑并核开发after-r1原测试字节；未回改产品制造旧红。

## 5. 哈希、保护和释放

关键新原始证据SHA256：

| 证据 | SHA256 |
| --- | --- |
| commands.json | `e6e692ac64afb126a42e05d63ad08695a4748a1ff69ffd7e3233f7fe329e027d` |
| summary.json | `e96b259d3ca436ec187c39ebd2ae03dce384272af2d6b47f38f098174e62bf25` |
| 原20 reporter | `f25ddae45b8e488ed83023d1eecbdd5c868b940bb32094a64f41fed9516141ed` |
| adapter20 reporter | `18b420dd72e40d5dbde1e2e7266d965895321936193c98bbd37fe37f8d23d3fa` |
| adapter完整diff | `ed6f91687937b1d3a6918c920ff8a24f7ec1fa6910eda1348b3779c0e563e8a5` |
| 独立16 reporter | `2f0abfe786653fbe90426066bd38db9b59f2f18b5e557948898c9b3d5d79d50d` |

`final-r3/final.json`及`review-r3/review.json`：`protectionOk=true`、`protectedDrift={}`、`sourceDrift={}`、`frozenDrift={}`、`declaredA16Drift=[]`、`noRecordedChildren=true`、`released=true`。review再次核完整r3封存、精确期望数量/退出、env/配置、原TF-X08失败位置/状态、adapter唯一差异与完整名称、精确原正文两路径全文复制观测；`liveDrift=[]`。

300保护根含重叠、不充独立文件数：完整主产品输入/主lib、A11..A14lib/旧A13相关源码、A16实际完整声明src/scripts/package/lock/config/lib与声明artifacts、全部继承原专家/开发证据及A18开发完整selftmp、真实依赖两树和声明cache；均前后hash/bytes/mtime零漂移。自有冻结与复制原测试单独核，同域mtime不与复制树精度混比；唯一自有adapter新增已认领，不算主源变动。r1/r2失败目录也另封存。只对已列根下结论，不宣称全盘零写。

A16实际 `/private/tmp/pmtool-a16-closure-20261022` 原panel仍fe58，声明产物无漂移；**3247不访问、不操作、不重启**。Main唯一GUI持续A13growth旧source，新合法证据/runtime不列零写根，不误记污染、不复制或覆盖；本轮无浏览器、服务、上游、profile、业务数据/凭据操作。记录的自有子PID精确ps原exit1/空输出证实均退出，未停其他进程。

## 6. 交回

有限SOURCE/AUTO PASS绑定上述完整dirty候选和adapter理由。Main收到后可唯一新A18 build/完整回归/新宿主/完整下发，按原实际CSV/XLSX失败恢复GUI合同补受影响证据。正式GUI、样式/读屏/原生chooser、真实网络故障/后端事务落盘、整项/全部积压门仍未审签，不以自动绿、旧A13/A16/3247替代。

本角色只写本testing前缀、没有源码写占用，已释放；不启动其他Agent、不commit/push/tag/发布/正式切换。最后统一普通commit仍须全部适用门闭合，由Main依原持续授权收尾。

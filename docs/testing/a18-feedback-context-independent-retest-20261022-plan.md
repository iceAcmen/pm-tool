# A18 错误上下文独立 SOURCE/AUTO 复验计划

> 2026-10-22，trae 独立测试专家，非开发。记录本次范围、oracle 与执行步骤，供 Main 和接续专家复核；不签 GUI、整门或提交。

## 授权

负责人原句：

> 独立A18错误context SOURCE/AUTO复验，非开发，无GUI/build。用户原持续授权全部已实现未验/确证修复/独立分工最后统一commit；读AGENTS/collab§9/11、docs/plans/2026-10-22-feedback-error-context-closure.md、reports/a18-feedback-error-context-developer-20261022.md+run/check/全部selftmp、docs/testing/a17-transport-feedback-independent-retest-20261022.md及原TFX08cases/selftmp。只写docs/testing/a18-feedback-context-independent-retest-20261022*及自有selftmp；禁产品/其他testing/livingdocs/install/build/fullverify/GUI/services/credentials/commit/sharedlib/cache。完整主源冻结自有、白名单env/no-cache/单fork，原测试/失败字节保护；核6文件delta/原13红新13/16/旧五及成功5显式5恢复2原65现72/开发14/原20/PC4/extensions28+4+23+23/87/额外53/noemit。重要：原20仍19绿1红，真实ResultCard role alert已绿，expectError函数第60行classifyFeedback(card.props.message)没新context仍TTL3000。已批准设计保旧string成功行为，不能扫英文/中文前缀/改原件洗绿。由你独立判断是否合理adapter，仅自有copy将此分类断言传实际card.props.context，并保完整diff/原expect其它字节/不减语义；原TFX08完整正文/复制/role/持久/無action仍必须实际执行，另独立补counterexamples针对Toast/context清除/同值messageGeneration/copy/timer races。先跑原件如实FAIL，然后独立adapter新绿如果成立明确理由，原五expect不改。核源码/全部保护/原作者日志/实际产物A16未动。Main唯一GUI继续A13growth旧source，不把其合法新增证据当污染；A16原3247全保不探。结束给有限SOURCE/AUTO PASS/FAIL/BLOCKED及hash/保护/释放，不签GUI/整门，无源码写占用，Main收到有限PASS才新A18唯一build。不得启动其他agent。

本次具体授权覆盖通用流程：不 fetch/pull 在途脏树、不安装/构建/全 verify、不写 livingdocs、不提交。已阅读 AGENTS、collaboration §9/§11、批准计划、A17/A18 开发与独立报告、执行器/检查器、原测试。memory 指定入口不存在，以仓库为准。沿已批准设计组织测试，不新开产品设计，不加载 vendor/installer，不派其他 Agent。

## Oracle 与步骤

1. 自有完整冻结当前 `src/scripts/package.json/pnpm-lock.yaml/tsconfig.json/vitest.config.ts`，保存 HEAD/origin、tracked binary patch、新输入指纹、hash/bytes/mtime。核与开发最终 after-r2 完整输入一致；与 before-r1 差异严格为六个获准文件。逐文件 diff 以及原 classifier 默认分支完整保真核对。
2. 审证全部开发四轮 selftmp、终检/close、原 A17 selftmp：原命令/退出/标准输出/错误/reporter 对索引，完整封存目录逐字/mtime，原 13 红到相同名称 13 绿/最终16、原65到72，以及原五红到同名五绿。原失败与设施失败不覆盖、不豁免。
3. 先在当前冻结源原样执行原20，预期19绿1红，第60行 TTL3000 与 null 冲突。原用例其余全文/复制在该次未到达，诚实记录。原五 expect 一字不改。
4. 若原失败与已批准缺省 string 规则确实不一致，独立制作自有 adapter：唯一替换为 `classifyFeedback(card().props.message, card().props.context)`，保存原件/副本/完整 diff，验证去除此唯一插入即逐字原件。原20另跑，不改变任何原断言/fixture/步骤/名称。
5. 新独立反例实际挂载 PmPanel/TaskTable/ResultCard，不 mock 产品或自建状态模型。精确原 TF-X08 正文全文显示/复制/alert/持久/无动作；动作标记与长空白原因；同值正文 error-success-error 的 context、generation、复制 resolve/reject；关闭重开；同值新消息 timer 重计时；过期 timer 在 error/关闭/新 success 后晚到；当前复制拒绝及卸载后旧复制；quiet 成功保持原策略。
6. 独立执行成功5、显式5、原五5、恢复2、六文件当前72、开发原14/新增16、PC4、扩展28+4+23+23、受影响87、额外53与完整原 tsconfig noEmit。另用开发 after-r1 原测试副本执行同原13，不覆盖它；旧红以原记录审证，不回改产品造红。
7. node/no-cache/cache:false/单fork/1worker，白名单 env、自有 HOME/TMPDIR/XDG_CACHE_HOME/DSH_HOME/cacheDir，禁网络/凭据继承。每条保存 argv/cwd/env/PID/起止/原退出/signal/stdout/stderr/reporter/观测。
8. 核完整主源/冻结/全部原证、实际依赖/既有 cache、主lib与 A11..A16 声明输入/产物 hash/bytes/mtime，A16 原3247不探。Main A13 growth 新 GUI 证据不列零写根。精确自有 PID 已退出才释放；设施漂移单列不降 oracle。

## 文件与有限判定

只新增本前缀 `-plan.md`、`-run.mjs`、`-cases.test.tsx`、`-check.mjs`、`-selftmp/` 和 `.md`。原样20仍保 FAIL；独立说明 adapter 是否合理后，有限 SOURCE/AUTO 才能另判 PASS/FAIL/BLOCKED。GUI、实际新产物/宿主下发、原网络失败恢复、样式/读屏与整门未审签。有限PASS仅交 Main 唯一新 A18 build，不倒签 A16/A13旧源。

环境 macOS + Node22.23.3，既有 pnpm11.28.5 依赖只读，不执行 pnpm。

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/a18-feedback-context-independent-retest-20261022-run.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a18-feedback-context-independent-retest-20261022-run.mjs freeze r1
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a18-feedback-context-independent-retest-20261022-run.mjs original r1
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a18-feedback-context-independent-retest-20261022-run.mjs adapted r1
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a18-feedback-context-independent-retest-20261022-run.mjs final r1
```

进度：计划先落；候选、原红、adapter、回归和释放以最终报告与原始 selftmp 为准。

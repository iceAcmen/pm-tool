# A17 明确 catch 反馈开发交回

> 2026-10-22，trae，开发角色。给 Main 与不同独立专家核对修后完整 SOURCE/AUTO 候选、原始失败和资源释放；本报告不签独立 PASS，不签 GUI、整项完成或提交。

## 1. 派单与执行边界

负责人原句：

> 限定开发A15-IM-GUI-01/A17明确catch反馈已独立五必要红；用户持续既有验/修确证/独立分工/最后统一commit授权不再审批。读AGENTS/collab、docs/plans/2026-10-22-transport-error-feedback-closure.md、docs/testing/a17-transport-feedback-contract-20261022{.md,-plan.md,-cases.test.tsx,-run.mjs}/selftmpr2红。独占packages/dsh-pm-tool/src/client/panel.tsx仅run catch和newclient/panel-transport-error-feedback.test.tsx、reports/a17-transport-feedback-developer-20261022*。不classifier/ResultCard/CSS/refresh/sidecar/backend/模型/其他testing/livingdocs/build/install/GUI/services/credentials/commit/sharedlib/cache。Main唯一builderGUI，actualA16已冻结tree/build/instance3247/sourcepanelfe58...旧lib绝不动，Main正在PC/扩展原证。先完整src自有freeze原控制绿/五红原expect不改；复用已有prefixFeedbackOnce明确执行失败保Error.message/String(error)全文，不能新增英文关键词扫业务成功标题。原TF-F五全绿，TF-C成功含失败/Failed/Error仍success、控制显式error、同预览busy/false/retry/quiet/原全文copy及原65相关/noEmit完整跑，额外PC/扩展受影响回归保base改动不退。原panelfe58其他全文（尤其baseline）不改；所有失败原reporter/exit/hash保护前后，no-cache单fork白名单env自有HOME/TMP/cache。报告精确candidate/newfile/diff/原argv与保护交回释放，不自签PASS，Main不同专家复验才新输出/故障GUI。

已读 AGENTS、collaboration §9/§11、[已批准计划](../docs/plans/2026-10-22-transport-error-feedback-closure.md)、A17 原合同/计划/测试/执行器及 r2 原冻结、红测和终检；核对当前接续文档。依本批明确范围，没有 fetch/pull 脏树、install/build、全量 verify、livingdocs 或版本控制动作。没有加载 vendor skill 或 installer。记忆入口文件不存在，以仓库实际合同为准。

## 2. 最小实现

唯一既有产品改动是 `packages/dsh-pm-tool/src/client/panel.tsx:824`：

```tsx
setMessage(prefixFeedbackOnce('执行失败', error))
```

复用原 helper 的 Error.message/String(error) 转换和一次前缀，保留完整原因；catch 既有 false/busy/inflight/quiet 路径不改。没有新增英文关键词、helper、信封政策或协议。refresh catch、分类器、ResultCard、CSS、副驾、后台和模型不改。

新增同域 `src/client/panel-transport-error-feedback.test.tsx`：真实 PmPanel/TaskTable/生产结果卡链，5 类异常 × 普通/quiet 共 10 项，加 3 项既有前缀不重复、1 项长多行全文复制及超过 3 秒持久，共 14 项。只提供宿主 execute/最小 browser globals/clipboard 边界，禁止网络；不替产品分类器或结果卡。

`catch-only-audit.json` 和 [精确增量](a17-transport-feedback-developer-20261022-selftmp/check-r1/catch-delta.stdout.patch) 证明原 `fe58…` panel 全文仅此一行替换，尤其原五类扩展 baseline、刷新和其他原文逐字不变。完整产品输入的前后差异仅 `client/panel.tsx` 与新增测试。

## 3. 完整候选

三轮都是自有完整 `src/scripts/package.json/pnpm-lock.yaml/tsconfig.json/vitest.config.ts` 冻结，不借 A16 冻结做测试、不产生 lib。before-r1 为 387 源文件，与 A17 专家 r2 的产品输入指纹一致；after-r1/after-r2 为 388。第二轮修后所有产品输入与第一轮修后逐文件 bytes/hash 一致，未改测试期望。

基线 HEAD/origin 均 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，不单独代表 dirty 候选。修后认领为 [after-r2/candidate.json](a17-transport-feedback-developer-20261022-selftmp/after-r2/candidate.json)，冻结根：

```text
/Users/bytedance/Projects/dsh-pm/pm-tool/reports/a17-transport-feedback-developer-20261022-selftmp/after-r2/frozen
```

| 对象 | SHA256 |
| --- | --- |
| 原 panel | `fe58fff88560141bf6d6886c93b6e8a38b82f2ee5c1c6a23bb4059116f3d71ac` |
| 修后 panel | `e0918704df4a308028a0a89c742c11421b787d3e18655c830d9b887213fa34fc` |
| 新同域测试，6629 bytes | `24fc128f15f27417baf8b4b3d04718f237fa77a08a91569c44464cb447ca371c` |
| 完整冻结输入 manifest | `7abc537324d531a58a75bc1bbae26b8b1b7886cd52b8519c54bbd71a33babc29` |
| package tracked binary patch | `3c16463427f3c55aed147075efb800ee0c9eec7cb645ae61c5118cbef6519744` |
| package 新输入清单/指纹 | `3db993fd88b0a12ef02aefdbb0f54fe4d5229eb2c76e6828a86f7ac5041277a2` |
| catch 精确增量 patch | `983709c05194220cab487babadde3c6cc0de4f29265092bb2e931f245447d13e` |
| 新测试完整增量 patch | `47e6ee13172da11249624167e5c00bc6a99fe1af301bdc760948cfd9b4d982e9` |

完整 tracked diff 和 new-input list 位于同轮 `candidate-tracked.patch` / `candidate-new-inputs.json`；它们包含已有 dirty 工作，不表示本开发认领他人改动。新测试完整字节见 [new-test-delta](a17-transport-feedback-developer-20261022-selftmp/check-r1/new-test-delta.stdout.patch)。

本角色另外仅新增本前缀报告、`-run.mjs`、`-check.mjs` 和 `-selftmp/` 证据。源码/测试最终版本未在补 fixture 时改动。

## 4. 实际测试

环境：macOS Darwin 24.6.0 arm64，Node 22.23.3，既有 pnpm 11.28.5 依赖但未执行 pnpm；React/react-test-renderer 18.3.1，Vitest 2.1.9，Vite 5.4.21，TypeScript 5.9.3。依赖只读解析到 `/private/tmp/pmtool-all-closure-20261021/.../.pnpm`。

每条子命令的精确 argv/cwd/白名单 env/PID/start/end/原 exit/signal 在各轮 `commands.json` 和 `<id>.command.json`；stdout/stderr、JSON reporter、观测及哈希均原样保留。这里的退出码来自原子进程，不用外层收集器或“passed 数”代替。

| 分组 / 命令 ID | before-r1 原 exit / 通过 / 失败 | after-r2 原 exit / 通过 / 失败 |
| --- | --- | --- |
| TF-C01/02 `success-control` | 0 / 5 / 0 | 0 / 5 / 0 |
| TF-C03 `explicit-context-control` | 0 / 5 / 0 | 0 / 5 / 0 |
| TF-F01 `necessary-red` | **1 / 0 / 5** | **0 / 5 / 0** |
| TF-C04 `recovery-control` | 0 / 2 / 0 | 0 / 2 / 0 |
| TF-R01 `existing-regression65` | 0 / 65 / 0 | 0 / 65 / 0 |
| `developer-transport` | 未运行，测试尚未新增 | 0 / 14 / 0 |
| 专家修订 PC `revised-pc` | 未运行 | 0 / 4 / 0 |
| 专家真实父层扩展 `expert-extension` | 未运行 | 0 / 28 / 0 |
| 原父层四必要用例 `parent-extension` | 未运行 | 0 / 4 / 0 |
| A15 专家 `independent23` | 未运行 | 0 / 23 / 0 |
| 既有扩展同域 `developer-extension23` | 未运行 | 0 / 23 / 0 |
| 九文件受影响 `affected-regression87` | 未运行 | 0 / 87 / 0 |
| 八文件 `panel-and-import-regression` | 未运行 | 0 / 53 / 0 |
| 完整项目 `noemit` | 0 | 0 |

过滤式分组 pending 为 12/12/12/15，是同一原专家文件中其他分组未执行，不能算通过；四组分别运行完毕。表中通过数存在跨分组重复，不宣称独立用例总数。

成功信封的“失败复盘 / Failed delivery / Error register”和无信封合法英文成功仍 success；原详情/摘要/复制原文控制保留。五 catch 为 alert/assertive/警告图标、持久，原全文可复制。原 CSV/XLSX 父子链 pending 单请求、失败保同预览/输入、false/解锁、明确同一确认行 retry 后才收起；未提前 refresh 或重复 execute。

原六文件：ui-feedback、result-card、result-card-copy、panel-checklist-toggle、panel-launch-handshake、launch-handshake。九文件和额外八文件完整路径、命令与各断言见 [after-r2/commands.json](a17-transport-feedback-developer-20261022-selftmp/after-r2/commands.json) 和 [summary.json](a17-transport-feedback-developer-20261022-selftmp/after-r2/summary.json)。

所有 Vitest 使用 `--no-cache`、node 环境、单 fork/1 worker、独立 HOME/TMPDIR/XDG_CACHE_HOME/DSH_HOME；PATH/LANG/TZ/CI/NODE_DISABLE_COMPILE_CACHE 和显式 TF/PC 证据路径白名单，不继承凭据。cacheDir 也只在本角色自有目录。完整 noEmit 的原 argv 为 Node + 既有 `typescript/bin/tsc --project <完整冻结包>/tsconfig.json --noEmit --incremental false`；沿原 tsconfig 编译所有生产源，测试仍按原 exclude，未 emit/build。

## 5. 失败保真与设施补正

before-r1 五必要红全部为原 `expected 'status' to be 'alert'`，不是导入失败。原用例与专家 r2 文件字节完全相同，修后绿沿同一原步骤/expect；未改独立合同。

after-r1 额外八文件组原 exit **1**，44 个用例绿、0 个断言失败、**1 个套件失败**：自有冻结漏复制 `docs/testing/board-fixture-clarification-20261021-fixture.json`，BoardBento-feedback 原 mock 读取时报 ENOENT。不是“44绿即通过”，也未归为产品缺陷。原 [stderr](a17-transport-feedback-developer-20261022-selftmp/after-r1/panel-and-import-regression.stderr.log)、[reporter](a17-transport-feedback-developer-20261022-selftmp/after-r1/panel-and-import-regression.result.json)、命令/完整首轮 summary 均保留。

只修自有 runner 的冻结依赖清单，在新 after-r2 冻结内复制并校原 fixture，随后全部分组重跑；不覆盖 after-r1，不改 fixture 源、产品或任何测试。after-r1 其余分组原 exit 均 0，包括 noEmit；其完整记录没有被新绿覆盖。原 A14 tasks-only PC oracle、旧 FAIL/报告也未改；本轮明确复跑的是专家已修订五类 base 的 PC 四用例，不倒签旧 oracle。

附加只读诊断原 exit1：错误把主树 mtime 与 cpSync 复制冻结的 mtime 直接比较，复制保时存在亚毫秒精度损失；bytes/hash 相同不是产品漂移。原完整输出/哈希、原 argv/exit 留在 [close-check-r1](a17-transport-feedback-developer-20261022-selftmp/close-check-r1/)。更正为主树对 `source-at-freeze.json`、冻结对其自身 manifest 的同域时间戳检查后 exit0，SOURCE/冻结/71 保护根均无漂移。不改产品、测试或原失败。本轮初查 rg 缺失 exit127、记忆入口不存在 exit1 后按仓库文件读取继续，也没有转为产品结论。

## 6. 保护与释放

三轮 run/final 都核完整冻结 bytes/hash/mtime、原专家文件，以及原 A15 包/专家报告、A17 r2 全 selftmp、A16 专家三套冻结与静态文件、A11..A14 lib、实际 A16 全产品输入/lib、主树 lib、实际依赖和已声明共享 cache。after-r2 共 **71 个保护根**；有重叠根，不把条目数当独立文件数。全部受保护根无新增/删除/内容/mtime 漂移；A16 candidate 已声明 sourceHashes/artifacts 再逐文件校验无漂移。当前主树完整输入与最后修后冻结匹配。保护仅限已列根，不声称全盘零写。

Main 正在写的 A16 GUI 日志/runtime 不作零写目标、不复制覆盖。实际 A16 `/private/tmp/pmtool-a16-closure-20261022` 的 panel 仍 `fe58…`、旧 lib 不变；派单给的 3247 实例未访问、重启或探凭据。该旧 GUI 不证明新 catch 生效。没有操作服务、profile、上游、正式数据、模型或共享输出。

各轮精确测试/采集子 PID 查询均已退出。最终 [final-after-r2/final.json](a17-transport-feedback-developer-20261022-selftmp/final-after-r2/final.json) 的 `protectionOk/sourceMatches/noRecordedChildren/released` 均 true，`independentPass/built/guiExecuted/servicesOperated/commitExecuted` 均 false。released 只表示资源交回，不是验收。

[check-r1/check.json](a17-transport-feedback-developer-20261022-selftmp/check-r1/check.json) 校原红、首轮设施失败、所有 reporter/日志哈希、最终退出/用例数、成功 controls、完整 SOURCE 差异和 fixture 补正前后产品一致。SHA256 `51ab1372135568f6a71ad3df5bde9016663d69ec01e3ebe33e11b88fac30f1a9`。检查器 exit0 是作者证据一致性检查，不是独立 PASS。

实际执行入口，仓库根、macOS + 上述 Node：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check reports/a17-transport-feedback-developer-20261022-run.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a17-transport-feedback-developer-20261022-run.mjs freeze before-r1
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a17-transport-feedback-developer-20261022-run.mjs run before-r1
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a17-transport-feedback-developer-20261022-run.mjs final before-r1
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a17-transport-feedback-developer-20261022-run.mjs freeze after-r1
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a17-transport-feedback-developer-20261022-run.mjs run after-r1
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a17-transport-feedback-developer-20261022-run.mjs final after-r1
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a17-transport-feedback-developer-20261022-run.mjs freeze after-r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a17-transport-feedback-developer-20261022-run.mjs run after-r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a17-transport-feedback-developer-20261022-run.mjs final after-r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a17-transport-feedback-developer-20261022-check.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a17-transport-feedback-developer-20261022-close-check.mjs
```

入口会拒绝覆盖已存在轮次，不应原地重跑覆盖；复验专家应另建自有完整候选。所有真正测试命令和原退出取各轮 command JSON；`git diff --no-index` 两个增量采集原 exit1 表示有差异，不是测试失败。

## 7. 交回后的工作

开发不自签 PASS，交回并释放 `panel.tsx` / 新同域测试所有权；未经新派单不再写产品。下一步由不同独立专家基于上述修后完整候选复跑 SOURCE/AUTO、审证原红转绿及受影响回归。Main 保持唯一 builder/GUI；独立复验后再另建新输出，完整回归、新实例/实际下发和原 CSV/XLSX 故障恢复 GUI 按专家合同采证。

真实浏览器、computed style/颜色、读屏、原生 chooser 和新异常的真实后台/事务未由本开发验证；原 A15 P2 FAIL、旧 GUI/全矩阵缺口不覆盖、不倒签。不得把作者绿或旧 A16/3247 页当新 GUI PASS。持续最后统一 commit 授权不重复审批，但本子任务没有 commit/push/tag/发布或正式切换；整门闭合与最终统一动作仍归 Main。

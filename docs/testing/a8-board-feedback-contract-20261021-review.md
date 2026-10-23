# A8 看板反馈现源冻结独立审证

> 2026-10-21，trae 独立测试专家。给 Main 修复交件及后续专家复验使用：本报告对应先行 [合同](a8-board-feedback-contract-20261021.md)，只签冻结 SOURCE/真实 BoardBento 父反馈，不开发产品，不签 GUI、保存落盘、正式保护或积压总门。

## 1. 判定与 Main 最小接续

**当前父反馈子项 FAIL；A6-BGUI-01 P2 不豁免。** 真实组件最终 r3 为 **27 项：17 通过、10 失败，exit 1**。不是“全部功能通过”或“保存失败”；成功回调已完成，但消息接错错误横幅。

| 用例 | 冻结源位置 | 原始观察与判定 |
| --- | --- | --- |
| BF-C01 / C09 | `BoardBento.tsx:295-308,261-265` | user/project 保存均完整调用一次保存、一次刷新并更新 layout/savedLayout，随后实渲染“布局已保存并刷新。×”/`pm-bento-validation`/`role=alert`；两项 **FAIL**。 |
| BF-C03 / C09 | `BoardBento.tsx:310-319,261-265` | user/project 重置成功均是“已恢复默认布局。×”/validation/alert；两项 **FAIL**。 |
| BF-C05 / C09 | `BoardBento.tsx:103-122,261-265` | user/project queue 追加成功均是“已添加补记队列并保存到个人布局。×”/validation/alert；两项 **FAIL**。追加完整旧 widgets 保留、scope 正确、调用次数正确，不判追加算法失败。 |
| BF-C04 | `BoardBento.tsx:310-319`；`editor.tsx:251-256` | reset reject、refresh reject、refresh false，父 callback reject、layout/savedLayout 不变，反馈数组均为空；三项 **FAIL**。另成功→失败序列仍显示旧“已恢复默认布局。×”；一项 **FAIL**。编辑器吞异常的接缝为 SOURCE 事实，本次未执行真实 editor。 |
| BF-C02 / C06 | `BoardBento.tsx:109-121,299-308` | 保存四失败支、queue 四失败支都为错误反馈，不显示成功；调用次数、未成功更新父布局符合合同。**父观察域通过**，不证明磁盘零写。 |
| BF-C07 / C08 | `BoardBento.tsx:154-166,261-265` | queue 在途→编辑器加载失败→queue 成功的可达并存状态，editorError 文案与错误 class/alert 优先；成功/普通错误/加载错误关闭、失败重试及成功重试均可完成。**父观察域通过**。 |
| BF-C01/C05 pending | 同上保存与 queue 回调 | 两阶段 deferred 观察无本次成功、无提前父布局更新；queue 在途 disabled，完成后入口隐藏。**时序子项通过**，末成功仍红，不把末态漏检当通过。 |
| BF-S01 | `BoardBento.tsx:52,117,119,155,163,262,264,304,306,319`；`panel.css:2004-2005` | AST 枚举7处 setBanner、3处 setEditorError、唯一反馈标签 validation/alert；CSS 该类的边/背景/字都用 `--pm-st-overdue`。**语义接线 FAIL**；AST 枚举/解析命令本身 exit 0 不等产品 PASS。 |

六个成功失败项与四个重置失败项是同一反馈范围的10个用例失败，不膨胀为10个独立产品缺陷。旧 A6 原图/FAIL 完整保留。

**给 Main：** 按 [先行合同:20-27](a8-board-feedback-contract-20261021.md#L20-L27) 仅给消息明确 kind/text、success/status/既有 token，editorError 优先错误；补父 reset catch 可见错误并保留原 rejection，不改保存/刷新/默认解析/追加/撤销链。不能全局把 validation 改绿或按文案猜颜色。真实编辑器接口、双确认、CSS 视觉与新实例网件由 Main 按 BF-G01–05 补证。未收到 Main 新源交件，本报告没有擅自取更新源复验。

## 2. 冻结身份与隔离

[freeze.json](a8-board-feedback-contract-20261021-selftmp/freeze.json) 时点 **2026-10-21T14:41:37.320Z**（本机22:41:37），候选 `A8-feedback-source-before-Main-handoff`，基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`。本单读20份限定输入，复制后逐字节核对；相关 tracked diff 与范围 status 各自归档。HEAD 不代替 dirty 候选，也不继承 A7/A6 运行身份。

| 字节对象 | sha256 |
| --- | --- |
| BoardBento.tsx | `53fd597bb305ad3f969fe31b2c28d4abf46e2a39a30c4fc48ff80ce2411721bd` |
| panel.css | `ac1186c558a4550896fbc1036603d23c53ec4f68a5becabce331fbf9275c4500` |
| board.css | `7be41947c6f3239ebd10eaae4a833279d1fb024f2585f6132b66e50f82e48c63` |
| editor.tsx（只归档及读接缝，未执行） | `ba1bf91211c87c068fe0bb4cb887249f1c321e2eecb20885d6745b2cd3086761` |
| 合法原 fixture | `41c91b49024270667b5a43e2f927bc43c478b8b69384c95b157aa01643176b87` |
| 先行合同 | `8092f6a61f9e30bdfffc2fc68cf729a92de037f6457d34230b591a587dc260ad` |
| tracked diff（含相关主树在途差异） | `b7e2fe99b6ed4b12ced3c5443f22509d9f7721d1684cf8054bc233da68ecbf18` |

全部20输入及 package/lock/config/其他源的 hash 在 freeze；归档位于 [frozen](a8-board-feedback-contract-20261021-selftmp/frozen)。这是只读机械复制，不是产品实现或 shared worktree 改动。

**环境：** macOS/darwin arm64，实际 Node v22.23.3，React 18.3.1、react-test-renderer 18.3.1、Vitest 2.1.9、TypeScript parser 5.9.3。pnpm 11.28.5 为项目口径，本单未执行 pnpm。主包 renderer 解析确实 MODULE_NOT_FOUND，复用了已安装公共隔离依赖 `/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules`，未安装或改依赖。RGL 1.4.4 仅登记解析身份，本测试没有执行它。

自有 node_modules 软链只供读取依赖；`root/cacheDir` 精确指向本 selftmp，单 worker、coverage/watch 关闭，TMPDIR/TEMP/TMP、Node compile cache 与所有日志都限本 selftmp。三轮 [postcheck](a8-board-feedback-contract-20261021-selftmp/postcheck-r3.json) 均：输入 drift=[]、copiesUnchanged=true、depUnchanged=true、cachesUnchanged=true。只看主包/隔离依赖各 `.vite`/`.vitest` 四个已枚举缓存根及登记依赖，**不声明整个共享依赖、Main 工作区、磁盘或正式服务零变化**。

## 3. 实际方法与覆盖边界

- [测试设施](a8-board-feedback-contract-20261021-selftmp/feedback.test.tsx) 真实挂载 BoardBento，实际运行 hooks/render、点击编辑/queue/关闭以及生产父 onSave/onReset。仅替代 CrossProjectPeople、卡片 render/registry、未调用试算的 query 展示接口、动态 editor module 与 persistence/refresh 通道；未替代反馈表达式、状态、保存父链、真实 persist/parseLayout、projection 或 appendQueueCard。
- 使用原fixture无改写；保存 F1 只将末卡 risk 的 y 加1，保持稳定ID/config/尺寸，真实 parseLayout 验合法且零碰撞。空业务数组与虚构项目ID，零真实业务文件、零 credentials。
- 原成功和失败 row 保存完整父布局/快照、调用参数与反馈：见 [observations-r3.json](a8-board-feedback-contract-20261021-selftmp/observations-r3.json)。用 deferred Promise 把保存与刷新分开，不以 await 完成一个瞬间替代在途观察。
- C07/C08 的动态加载失败来自 Vitest mock factory reject。实际错误文本带 Vitest 包装信息，这是**设施注入的 Promise rejection**，不当真实 chunk 故障或新产品报错；只证明父 catch/优先级/关闭/重试。r3 明确等待 `vi.dynamicImportSettled()`，不拿未完成 import 的空态当产品失败。
- 保存刷新失败 row 中 save stub 已记录 phase=`saved`，但仍显示“保存失败，未落盘”；故文案不证明磁盘未写。本单不写存储、不改保存链、不据此修新产品；Main 若校正文案不得声称未经回读的落盘结论。
- 没有执行真实 BoardEditor/RGL、双确认 GUI、浏览器计算样式/截图、真实 reload、chunk 网络、宿主、正式及隔离资产保护。SOURCE 能证 editor doReset 吞异常，但实际双确认/用户旅程仍需 BF-G03。**17项通过只覆盖明确父组件观察，不是完整合同或 GUI PASS**。
- 测试 stub fetch 禁止网络；unmount/globals 恢复，未调用业务导出/附件/存储。不读取任何 profile/凭据/运行服务配置。没有 build/lib 写入、服务/GUI 动作、commit 或写其他 testing/livingdocs。

## 4. 全部实际验证命令与结果

在 macOS 仓库根执行，Node 使用已有 nvm22绝对路径，无需安装。精确 argv/cwd/起止/exit/signal/log hash 保存在各轮 `run*.json`。

```sh
cd /Users/bytedance/Projects/dsh-pm/pm-tool
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a8-board-feedback-contract-20261021-freeze.mjs freeze
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a8-board-feedback-contract-20261021-freeze.mjs run
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a8-board-feedback-contract-20261021-freeze.mjs run-r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a8-board-feedback-contract-20261021-freeze.mjs run-r3
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a8-board-feedback-contract-20261021-selftmp/source-audit.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/a8-board-feedback-contract-20261021-freeze.mjs
git diff --check -- 'docs/testing/a8-board-feedback-contract-20261021*'
```

| 命令/轮次 | 退出码与结果 | 证据 |
| --- | --- | --- |
| freeze | 0；20输入源/dep/diff冻结并复制核一致 | `freeze.json`、`tracked.diff`、`scope-status.txt` |
| run/r1 | 1；27项13通过14失败；混有设施错误，不能整体当产品FAIL | `run.json`、`run.log`、`vitest.json`、`observations.json` |
| run-r2 | 1；27项9通过18失败；异步 import 未settle导致假空态，不能整体当产品FAIL | `run-r2.json/log`、`vitest-r2.json`、`observations-r2.json`、`feedback-r2.test.tsx.txt` |
| run-r3 | 1；27项17通过10失败；剩余10全对应§1反馈合同，不含上述设施错误 | `run-r3.json/log`、`vitest-r3.json`、`observations-r3.json`、`feedback-r3.test.tsx.txt` |
| source-audit | 0；TS AST 解析无diagnostic、枚举7+3 setter/唯一validation alert标签 | `source-audit.json` |
| node --check / git diff --check | 各0；自有runner语法及已跟踪diff空白检查 | 命令实输出为空；不是产品类型/build/完整回归 |

实际 Vitest 子命令（r3）：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules/vitest/vitest.mjs run --config /Users/bytedance/Projects/dsh-pm/pm-tool/docs/testing/a8-board-feedback-contract-20261021-selftmp/vitest.config.mjs --reporter=verbose --reporter=json --outputFile.json=/Users/bytedance/Projects/dsh-pm/pm-tool/docs/testing/a8-board-feedback-contract-20261021-selftmp/vitest-r3.json
```

r1 设施用了 Vitest2不支持的 `toHaveBeenCalledExactlyOnceWith`，且把编辑器异常做成 getter，异常发生在 React render而非 import catch，造成 unmounted renderer；只修自有设施。r2 换 mock factory reject、兼容断言，但漏等 dynamic import，空 props/反馈属设施时序。r3 等实际 import settled；源副本始终相同、原两轮输出保留，未以新文件覆盖红日志。r1当时未保存精确测试脚本副本，不事后冒造；r2/r3有逐轮脚本/config副本。只读检索中 rg不可用 exit127、指定memory文件不存在 exit1；改用仓库文件/grep/find继续，不算产品错误。

## 5. 接续状态

先行合同与现源独立冻结观察已交；当前反馈门 **FAIL**，GUI **BLOCKED（待 Main 新实例原证）**。Main 可以继续本项已授权最小修复与补采，不能把本单17通过或P2当豁免。本专家未启动任何等待中的服务/GUI/构建进程。

下一输入由 Main 提供：新源文件清单/hash/diff、真实组件红绿日志、接缝对照；再提供新 GUI BF-G01–05。新源交件后另根冻结、按同合同复验，不改本次旧红证；Board实际chunk、正式保护仅由Main补件，本专家本轮没有执行或审签。父“持续验完及最后提交”仍归 Main，本子单没有宣称父任务完成或提交批准。

审签：trae 独立 A8 反馈 SOURCE/父组件专家；产品实现与 GUI/builder owner：Main。

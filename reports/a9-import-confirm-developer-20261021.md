# A9 LG-05 导入确认开发交接

> 给 Main 和独立测试专家使用。记录本批有界修复、红绿原证、候选指纹和未验边界；仅开发侧结果，不签独立 PASS。2026-10-21，平台 trae，开发角色。开发执行已结束，释放本批文件，后续由 Main 冻结构建/GUI、专家复验。

## 1. 授权与对象

父负责人原句见 `reports/all-pending-acceptance-execution-20261021.md`：“好的，按之前的盘点文档和这个分工方案继续推进，直到把所有没验完的功能全部验完，再把所有代码都提交为止，才算完成任务，中途不要停下来。”

本批派单原句：“开发角色有界修既有LG-05导入确认重复dryrun。父授权按分工验完所有在途修确证最后Maincommit无push。只写packages/dsh-pm-tool/src/client/views/tasks.tsx及新的同目录真实组件→生产命令tests，reports/a9-import-confirm-developer-20261021*。不写panel.tsx/其他产品/独立testing/livingdocs，不build共享lib/共享cache/GUI/服务/credentials/commit。读AGENTS/collab、docs/testing/a8-layer-gap-contract-review-20261021.md LG05及probes/§4/5、docs/plans/2026-10-21-existing-entry-gaps-closure.md。先红再修，preview原不加confirm，确认串加末尾confirm/内容不改，CSV/XLSX真实解析/确认落库、previewcancel0/confirm树2+父子/字段，失败不关preview并重试、busy防重复。不要改commands/import解析器，不补U4/模板新功能。自有tmp复制source只读链接/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules/React renderer18.3.1/Vitest2.1.9，私有cache no-cache，不install。主树该文件已有OP/GNHD修必须保留。交新hash/红绿argvexit/diff/受影响回归/GUI未验，完成释放，不自PASS。”

依据：A8 合同报告 LG-05、§4/5 及只读 probes；`docs/plans/2026-10-21-existing-entry-gaps-closure.md` 第2/4项。已读 AGENTS/collaboration 和当前接续，工作树为多角色在途候选，不执行 pull、install、共享 build、livingdocs 同步或 commit。父任务最后提交权不继承为本开发角色提交权。

可写文件只有：

- `packages/dsh-pm-tool/src/client/views/tasks.tsx`：末尾确认参数、本地同步锁/在途禁用/错误提示。
- `packages/dsh-pm-tool/src/client/views/tasks-import-confirm.test.tsx`：新生产组件到生产命令/JSON 存储测试。
- `reports/a9-import-confirm-developer-20261021*`：本报告、私有副本执行器和逐轮原证。

## 2. 最小修复

原预览命令和 JSON 内容保持原字节；确认串仅追加末尾 ` confirm`。同步 ref 防同一帧重复提交，state 呈现在途禁用，确认在途禁止取消/重新选文件。`run=false` 或拒绝承诺均保留原预览与确认串、显示中文就近 alert，解除 busy 后可重试；仅成功关闭预览并调用一次 `onSaved`。

未改 CSV/XLSX 解析、命令 handler、模板、其他产品代码或样式。基于红轮冻结的已有 OP/GNHD 源做差异，自有 developer.patch 只含导入相关3处改动，保留客观进度和编号反馈。

## 3. 候选认领

HEAD 仅基线：`9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，不代表 dirty 候选。每轮 `*-execution.json` 有完整源文件 SHA256、tracked patch、依赖版本/指纹、argv/exit 和保护根前后清单。

| 文件/证据 | 最终 SHA256 |
| --- | --- |
| `src/client/views/tasks.tsx` | `9789e5811ab09dcbc1c561ccec463e905795b34da1eb7f996bab73d8d21ef91e` |
| 新 `src/client/views/tasks-import-confirm.test.tsx` | `6abe9c211e2e38f5b4cfd5ab9c1b184263547d0609441c4d1357ac2ad6f1ea86` |
| 报告执行器 `*-run.mjs` | `c45d613422e4887b0247041b38e09a6def0a0194617bf270835b4658c36b4d4c` |
| `*-regression-r3-developer.patch` | `2b58abbb1a4383c81583f1911cd03efe1a7d5aa9eee7e8e08f68cc64072a203f` |

红轮源保留 `/private/tmp/pmtool-a9-import-BAqXTS/src`；最终回归源为 `/private/tmp/pmtool-a9-import-JISXMM/packages/dsh-pm-tool/src`。tracked.patch 包含本文件原有 OP/GNHD，developer.patch 则只含本角色新增导入差异。新测试未跟踪，不在 git diff 内，其全部字节已在最终私有源和指纹中认领。

本开发角色没有构建产物、服务/浏览器、开关或装载身份可认领；那些不能以源哈希代替，须由 Main 新冻候选补齐。

## 4. 执行环境与红绿

macOS + bash；nvm Node `v22.23.3`、pnpm `11.28.5`；React/renderer `18.3.1`、Vitest `2.1.9`。只读链接指定父树 node_modules，不 install。副本保持源码字节，后续回归恢复仓库目录层级并只读复制专家 F2/f2-backup；没有改专家原文件或其测试断言。

每轮外层退出码就是子进程退出码。如下均从仓库根运行；逐轮实际完整 argv 在对应 execution.json，原 stdout/stderr/逐例 vitest.json 均同前缀另存，不覆盖失败轮：

```sh
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm use 22 >/dev/null
node reports/a9-import-confirm-developer-20261021-run.mjs red
node reports/a9-import-confirm-developer-20261021-run.mjs green-confirm
node reports/a9-import-confirm-developer-20261021-run.mjs green-confirm-r2
node reports/a9-import-confirm-developer-20261021-run.mjs red-busy
node reports/a9-import-confirm-developer-20261021-run.mjs green-busy
node reports/a9-import-confirm-developer-20261021-run.mjs green-final
node reports/a9-import-confirm-developer-20261021-run.mjs green-final-r2
node reports/a9-import-confirm-developer-20261021-run.mjs regression regression
node reports/a9-import-confirm-developer-20261021-run.mjs regression-r2 regression
node reports/a9-import-confirm-developer-20261021-run.mjs regression-r3 regression
node reports/a9-import-confirm-developer-20261021-run.mjs typecheck typecheck
git diff --check -- packages/dsh-pm-tool/src/client/views/tasks.tsx
```

| 轮次 | exit / 原结果 | 解释 |
| --- | --- | --- |
| red | 1；1红 | 原确认命令缺末尾confirm，修前红 |
| green-confirm | 1；1红 | 加后缀后真JSON写入异步，旧按钮未返Promise，测试过早观察；设施等待失败保留 |
| green-confirm-r2 | 0；1绿 | 测试等待传输完成，生产确认后缀修复，真实落库/关闭存储重开字段成立 |
| red-busy | 1；1绿3红，1未处理拒绝 | 同帧2次提交、false/reject无就近错误；本组修前红 |
| green-busy | 0；4绿 | 加同步锁、错误处理后同组全绿，无未处理拒绝 |
| green-final | 1；7绿1红 | 原解析器预览未做日期校验；测试原预期不成立，保原证并登记边界，不改解析器 |
| green-final-r2 | 0；9绿 | 非法列预览拒绝；首行非法日期真实确认拒绝，零写保预览；分阶段如实测试 |
| regression | 1；227绿，2套收集失败 | 私有复制未保持仓库层级/F2缺失，非产品回归结论 |
| regression-r2 | 1；248绿1失败 | 保持层级后剩f2-backup缺失，设施失败 |
| regression-r3 | 0；22文件/249绿 | 补齐原fixture副本，原回归断言未改 |
| typecheck | 0 | 私有 tsc `--noEmit --incremental false`，未写lib |
| diff --check | 0 | 指定产品文件无空白错误 |

Vitest 子命令统一为 `node <指定父树依赖>/vitest/vitest.mjs run --config <自有副本>/vitest.config.mjs --no-cache`，`cache:false`、`cacheDir=<自有tmp>/vite-cache`；TMPDIR 在自有 runtime。typecheck 子命令为 `node <指定父树依赖>/typescript/bin/tsc --noEmit --incremental false -p <自有副本>/tsconfig.json`。

最终9专项经真实 TaskTable→FileReader设施→execute/run传输→handleTaskCommand→CSV/XLSX解析→现有JSON存储：preview0、CSV/XLSX cancel0、confirm2；关闭存储后新DomainFacility回读父子/编号1与1.1/中文负责人/优先级/日期/进度。另覆盖同帧2次点击只发1命令、在途禁取消/重选、false/reject保原文重试成功。实际命令、结果、任务记录与重开清单见 `*-green-final-r2-observations.jsonl` 和 `*-regression-r3-observations.jsonl`。

受影响回归22文件/249断言覆盖任务组件/工具栏/编号/剪贴板/响应式/可见层、OP列表/树/总览/甘特消费、任务反馈/操作/行内更新/命名视图、客观进度及协议兼容。最终 stderr 有既有 TaskTable 列表缺 key 的 React warning，未处理异常为0；没有为本批扩范围修 key。

全部轮 sourceDrift=[]；WATCH 主树lib、主树node_modules/.vite/.cache、父依赖node_modules/.vite/.cache 的内容与mtime前后相同。只证明这些5根，未扫描正式资产/凭据或他人临时目录，不声称全机零变化。

## 5. 未覆盖与交回

- **GUI NOT_RUN**：未操作浏览器/桌面或启动服务；LG-G05 的原生CSV/XLSX选择、WBS重进、页面错误/焦点/样式与真实装载仍由 Main 按专家§5采证。不是 MANUAL_PENDING，本角色无权转由所有者。
- **解析器旧边界**：日期不在预览阶段校验；本次非法日期零写只证明首行非法确认拒绝。第二行/后续行非法时可能先写前面的合法任务（来源：`csv-import.ts`按行addTask），本角色未执行该分支、不保证全文件原子性。原 `green-final` 日期oracle失败保留，需专家/Main确认归属，不能将本批9绿当非法文件全集PASS。
- **传输边界**：false/reject重试为受控“未执行命令”失败；未证明服务已提交但回复丢失时重试幂等，现有后端未加导入幂等协议。
- **全包验证 NOT_RUN**：没有build/全量verify/宿主/GUI/独立复验；按本派单由唯一Main在全部独占源收束后执行。开发不自PASS、不提交/推送、不更新livingdocs、不触碰docs/testing。
- 下一动作：Main/专家核本源/新测试hash与developer.patch；对LG-05/AUTO受影响范围独立复验；Main重新冻结构建及LG-G05采证，再由专家判定。OP/GNHD只是本次回归绿，不扩大为旧GUI继承结论。

## 6. 方法留痕

已读 brainstorming/writing-plans，沿已批准收口计划和A8最小合同，不另造设计决策/计划文件或提交。vendor静态校验exit0、manifest SHA/bytes一致；锁 `49dd158d1076134a641b33efb035946536778336`，`vendorIntegrityVerified=true`。可测修复路由tdd用于逐组红绿；delivery路由code-review进行本角色差异的标准/合同两轴自查，不签专家门。不可用的并行子代理步骤以开发侧本地两轴审阅记录，不冒充独立评审；跳过缺失codebase-design/setup/installer。所有8条vendor越权红线未执行，未写home/业务根/上游。

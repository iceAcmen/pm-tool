# A20 文件资料反思声明先行合同

> 2026-10-22，平台 trae，独立先行测试、非开发。给 Main 和后续独立复验者使用；只细化既有 A18-IM-01 / RA-P0007，先计划再原函数 RED/control，结束 STOP，不签 PASS。

## 1. 原授权与边界

负责人原句：

> 独立先行合同A18-IM01 file-only反思材料声明空计数，非开发。只docs/testing/a20-file-reflection-contract-20261022*和自有tmp;禁产品/other testing/livingdocs/build/install/GUIservice/credentials/commit。读AGENTS/collab、docs/testing/a18-integration-more-gui-review-20261022.md§4原t3不是无材料/实际files1但materialstext（质量由人复核）无类型数量，remainingP0007；currentcore/reflect.ts/buildReflectionDraft、taskmaterials/taskHasMaterials/filetypes/reflectionmodels/tests。冻结当前源，真实生产函数fileonly/混合link+dlv+file count原必要红及真无材料gap/control;先plan然后原测试，只读已有依赖用Main完整自有副本/private/tmp/pmtool-a19-owned-deps-20261022/node_modules而非共享旧树，Node工具入口/no-cache单fork白名单env/cwd自有，不pnpm。限定只显示已登记文件个数/保quality人复核、不得读取外文件/推断已完成/改taskHasMaterials/验收裁决，不改历史反思、不补旧记录迁移/新feature。后续有限core/reflect/newtests修复在当前feedback95门闭+habitdefect门闭后；你先行plan/red不授权提前产品写。原A18filet3断言保，新fixture原合法schema，源/自有depshash保护，反例说明不要把multipletests当新功能。结束中文报告原red/control/保护/释放STOP不PASS。

本次明确限定覆盖通用 fetch/pull、安装/构建、全部 verify、livingdocs 同步与提交要求；不更新其他 testing 文件。已读 AGENTS、collaboration §9/11、A18 §4、remaining-governance 的 RA-P0007、当前 reflect/task-materials/task/storage/file-assets 与相关原测试。工作树为多人在途 dirty 候选，不清理、不回退、不重整依赖。源冻结是自有副本的字节认领，不取得 Main 的源写锁或唯一 builder。

- 唯一仓库写域：`docs/testing/a20-file-reflection-contract-20261022*`。
- 临时写域：本前缀 `-selftmp/r1/`，含完整冻结输入、完整自有依赖副本、HOME/TMP/cache/runtime、日志与审计。
- 不写产品、其他 testing/livingdocs、原证、旧依赖/缓存/lib、正式或隔离服务、业务库或凭据；不运行 pnpm、installer、build、GUI、服务、commit/push。
- 写入顺序：本计划 → 测试/执行器 → freeze → 未修生产函数 RED/control → 中文报告 → seal/释放/STOP。

## 2. 已知事实与修复上限

[A18 §4](a18-integration-more-gui-review-20261022.md#4-p0-有限结果) 原 t3 的附件为 `at-1 / file / fa-0001`。原反思 `ref-mvisx864-w3fqsq` 是 draft、task-done，材料行实际为 `资料区已登记：（质量由人复核）`，`gaps=[]`。报告的 materialsLine 是摘录别名，**不是新增 schema**。原 t3 不是空材料；原空材料 GUI 门仍 BLOCKED，不能拿这个文件例子关闭。

当前 `buildReflectionDraft` 只统计附件的 link/deliverable；`taskHasMaterials` 已把非空附件数组视作已登记材料。因此本缺陷是已有草稿构造的文件类型/数量遗漏，不是 gap 判定错误。

**后续最小方向，当前不实施**：只在 `core/reflect.ts` 附件计数块加 `kind === 'file'` 数量，并在已有 parts 后追加 `${files} 个文件`（files>0）；维持既有链接/交付物计数和 `（质量由人复核）`，继续已核“登记事实”，不评判内容质量。允许必要的同域新增 tests；不改 schema/模型/`taskHasMaterials`、check 规则、外文件读取、文件 join/解析、自动完成/定稿、历史反思、迁移或其他事件。

文件个数按当前任务已登记的 file 附件项计，不借外文件内容或全局资产总数。多文件、混合数组、重排是**同一个已有计数缺陷的反例**，不是多个新功能。不要求新 API、页面、入口或全矩阵。

## 3. 可执行合同

测试直接 import **冻结的完整未改生产模块** `buildReflectionDraft`，不拷贝函数片段、不 mock 其实现。原 raw 只读核 index 的 bytes/SHA 与 JSON；从实际 record 用当前 `taskWriteSchema` / `reflectionRecordSchema` 验合法性。新 fixture 用原 schema parse，file 项只有合法 assetId/addedAt 等键，无 path 假字段。域控制沿原 tests 使用内存 Map，不落业务库。

| ID | 初态/步骤 | 断言与预期 |
| --- | --- | --- |
| FR-R01 | 原 t3 record + 原 draft.at，调用生产构造函数 | 材料行包含 `1 个文件` 且保质量由人复核；未修源必要 RED |
| FR-R02 | 合法新 task，2 个不同 at/asset file 项 | 精确 `2 个文件`，不笼统计 1；未修源 RED |
| FR-R03 | 合法新 task，1 link + 1 deliverable + 1 file | 原 `1 条链接`/`1 项交付物` 保，另有 `1 个文件`；未修源 RED |
| FR-R04 | 合法新 task，2 link + 1 deliverable + 2 file，重排 | 两种顺序计数一致，只新增文件数量事实；未修源 RED |
| FR-C01 | 原 t3 及原反思 raw | 原 file 数1、draft/sourceEvent、空计数实际行、`gaps=[]` 均保留；同源生产输出与原 draft 一致。不把原错行提升为修后 oracle |
| FR-C02/03 | 真空材料：旧可选键缺省 / 空 attachments+checklist | `taskHasMaterials=false`，gap为既有待补文案，不生成资料行 |
| FR-C04 | 只有合法 progressLog 叙事 | 叙事不冒充完成材料，gap仍在 |
| FR-C05 | 只有合法非空 checklist（done=false） | 保原材料口径、gap空；不改清单done，不生成资料行 |
| FR-C06 | 旧 evidenceUrl + deliverableId | 原两行/旧ID保、gap空，不自动造文件计数 |
| FR-C07 | link+deliverable 无 file | 原材料行精确不变，无虚构 `0 个文件` |
| FR-C08 | file-only | 材料谓词true、gap空、质量由人复核；本控制不要求缺失的计数 |
| FR-C09 | 合法附件及 metadata schema、非法 path file反例 | 原 file union 接受 assetId，不接受外 path 假字段；只核 schema，不上传/读取字节 |
| FR-C10 | 冻结原task，重复生产构造调用 | 输入/状态/进度/附件全文不变，输出确定；材料行不含自动验收/完成裁决 |
| FR-C11/12 | 内存域中已存在旧 draft / final，再调用原 ensureReflectionOnDone | 原记录全文不变、put=0；不重算旧草稿、不迁移、不自动final |
| 原控制 | 原样运行 reflect.test.ts、reflect-l2.test.ts、task-materials.test.ts | 保原断言、原退出与全部结果；L2只作受影响模块控制，不冒 milestone/dlv GUI 验收 |

红组和控制组分开执行，红的原 exit=1 不转换成成功；加载/设施错误不冒充产品 RED。C01 是保原证控制，后续修后不要求新函数继续输出错行；后续只保 raw 不变，并将新函数对原合法 task 的期待按 R01 验，不修改原历史记录。

这轮真空材料 **纯函数 gap 控制** 不等 RA-P0007 的生产 done→持久化→命令→重进 GUI 门，原 BLOCKED 保留。没有 GUI/服务授权，不补跑其完整旅程。

## 4. 冻结与执行保护

完整复制当前包 src/scripts/locale 和 package/lock/workspace/tsconfig/vitest/tsdown/cordis配置到自有冻结树，保字节。记录 HEAD、origin、tracked binary diff、新输入清单指纹、完整输入 SHA/bytes/mtime，不以 HEAD 代 dirty 候选。lib 只做前后保护，不复制/重建。

依赖来源固定为 `/private/tmp/pmtool-a19-owned-deps-20261022/node_modules`，先记录完整指纹，再完整复制到本轮自有树；保相对软链，每条解析目标必须留在本轮依赖根，全部 bytes/hash/link 与来源相同。不链接旧共享 A14/A18 树，不调用 `.bin` 或 pnpm。真实 Node 入口调用自有 `vitest/vitest.mjs`。

白名单 env 仅 PATH/HOME/TMPDIR/XDG_CACHE_HOME/DSH_HOME/CI/LANG/TZ/NODE_DISABLE_COMPILE_CACHE，目录均自有；不继承 API Key/cookie/令牌/代理/NODE_OPTIONS。Vitest 配置自有、include 白名单、`cache:false` + `--no-cache`、forks/singleFork/1worker、不使用主包配置隐含 setup。

保护范围：当前完整输入与 lib、指定 A18 原报告/本测试用到的 index/raw/commands、来源完整依赖、自有冻结输入与完整依赖。核文件新增/删除、bytes/SHA、软链目标及 mtime。Main 其他新增证据、业务数据/外文件/凭据/服务不扫描，不声称整盘零污染。若主源并发漂移，诚实报告，冻结结果只绑定本轮字节；不能回退 Main。

每次执行保存 argv/cwd/env/PID/起止/原exit/signal/stdout/stderr/reporter。seal 检查已记录子 PID 消失并封存报告/计划/测试/执行器 hash，再释放，原红不删。

环境：macOS + Node v22.23.3；已有依赖只读，未安装/构建。

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/a20-file-reflection-contract-20261022-run.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a20-file-reflection-contract-20261022-run.mjs freeze
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a20-file-reflection-contract-20261022-run.mjs run
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a20-file-reflection-contract-20261022-run.mjs seal
git diff --check -- 'docs/testing/a20-file-reflection-contract-20261022*'
```

## 5. 停止与后续

- [x] 计划先落盘，原件/源码/合法 fixture 边界已核。
- [x] 原必要 RED 4/4、control 12/12、原测试 31/31 已执行并保原日志/退出码。
- [x] 中文报告与执行后保护零漂移已交，精确PID已退出，释放/STOP；最终seal再核同基线，原件见本前缀 `-selftmp/r1/seal.json`。

后续 **当前 feedback95 门闭 + habitdefect 门闭** 后，才由 Main/负责人再明确授权有限 `core/reflect.ts` + 必要新增 tests；本计划和原 RED 都不授予提前产品写。修后由不同验收角色复验原 RED/control，Main 另按原 P0007 合同补真空材料既有旅程、认领新候选/实际下发，再独立审证。当前不承诺修复/验收/发布，不签 PASS，不 commit。

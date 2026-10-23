# A20 文件资料反思声明原 RED 报告

> 2026-10-22，平台 trae，独立先行测试、非开发。供 Main 和后续独立复验者核原件；只交 A18-IM-01 / RA-P0007 的有限合同、未修生产函数原红与控制，STOP，不签 PASS。

## 1. 结果与身份

先落 [计划](a20-file-reflection-contract-20261022-plan.md)，再写 [测试](a20-file-reflection-contract-20261022-cases.test.ts) / [执行器](a20-file-reflection-contract-20261022-run.mjs)，冻结后运行。**必要红 4/4、原 exit=1 保留；材料控制 12/12、原测试 31/31 成立、exit=0。** 未改产品、`taskHasMaterials`、schema、历史反思或原 A18 报告；未安装/构建、GUI/服务、凭据读取、commit/push。

| 冻结身份 | 本轮实证 |
| --- | --- |
| 基线 / origin | `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，dirty 候选另有 patch + 新文件清单，不以 HEAD 代候选 |
| 当前完整输入 | 11 个根：src/scripts/locale、package/lock/workspace、两 tsconfig、vitest/tsdown/cordis配置；src 388文件 |
| tracked patch SHA256 | `5ad71775cda2875dc441598e3aea644b17d5f26901cb590e5dde7f24f67c0aff` |
| 完整输入 manifest SHA256 | `60ecb5cddefae292fca26848bc025bd5d212e62b667a79944078dd08d958a54d` |
| 新文件清单 SHA256 | `7944d47ad7ceb742510597cfa2f6099835f9b70f32762dbff6f4ba853b61a828` |
| 未改 reflect.ts SHA256 | `5ee9a958e33fbd5207ee9851892a291eb3351994e46820aced250b0ae3d97ffd` |
| 完整依赖副本 manifest SHA256 | `44c6101239ca12ec6703282c6d2671f6136177e05e00d60c64878ccc7dd5d98d` |
| 依赖来源 | `/private/tmp/pmtool-a19-owned-deps-20261022/node_modules`，只读完整复制，不用旧共享树 |
| 本轮依赖 | 本前缀 `-selftmp/r1/frozen/node_modules`，14,643条目，1,030软链全部解析在自有根内；与来源 bytes/hash/link 一致 |
| 环境 | macOS darwin arm64 / Darwin24.6.0，Node v22.23.3，Vitest2.1.9；已有依赖只读、不运行pnpm |

完整字段见 [candidate.json](a20-file-reflection-contract-20261022-selftmp/r1/candidate.json)，全部输入/新文件/依赖 manifests 和 patch 均在同自有根永久保原。生产模块从完整冻结源直接 import，不裁剪/复制函数、不 mock 其实现。

## 2. 原 t3 与必要红

[原 A18 §4](a18-integration-more-gui-review-20261022.md#4-p0-有限结果) 的 t3 本来就有 `at-1 / file / fa-0001`，**不是无材料**。读取原 raw task/reflection/commands 三件，逐件核 A18 index 的 bytes/SHA、JSON及同 commandId 的 reflect done；当前原 schema parse 成立。没有删除附件来造假 gap。

原 reflection 是 `ref-mvisx864-w3fqsq`、draft、task-done；材料行实际 `资料区已登记：（质量由人复核）`，`gaps=[]`，本轮 FR-C01 逐字段保原且生产构造输出与其完整 draft 相同。materialsLine 只属原报告别名，未新增字段。原错行保作历史实证，不作为修后继续输出错行的 oracle。

| 原必要断言 | 实际生产材料行 | 原结果 |
| --- | --- | --- |
| FR-R01 原t3，1 file | `资料区已登记：（质量由人复核）` | RED：缺 `1 个文件` |
| FR-R02 合法新 task，2 file | `资料区已登记：（质量由人复核）` | RED：缺 `2 个文件` |
| FR-R03 1 link + 1 deliverable + 1 file | `资料区已登记：1 条链接、1 项交付物（质量由人复核）` | RED：缺 `1 个文件` |
| FR-R04 2 link + 1 deliverable + 2 file、正序/逆序 | 两序均 `资料区已登记：2 条链接、1 项交付物（质量由人复核）` | RED：缺 `2 个文件`，原计数/重排一致控制先成立 |

各 file 附件先经 `attachmentItemSchema`、新完整 task 经 `taskWriteSchema`；不是原先拒绝的 `path:'/x'` 假file。多文件/混合/重排是**一个已有文件计数缺陷的反例**，不当新功能或多项产品。

红组 16 个注册测试中只执行 R4，C12 按名称过滤为 skipped；控制组只执行 C12、R4 skipped。**两组互补共执行16项，不把过滤 skipped 算通过，不存在未执行的必要红。** 所有红均是 file count 断言，不是 transform、schema、timeout或模块加载失败。

原件：[红 reporter](a20-file-reflection-contract-20261022-selftmp/r1/necessary-red.result.json)、[真实生产输入/输出](a20-file-reflection-contract-20261022-selftmp/r1/necessary-red.observations.jsonl)、[stderr](a20-file-reflection-contract-20261022-selftmp/r1/necessary-red.stderr.log)，均原样保留。

## 3. 控制与未覆盖

FR-C01..12 全部成立：原 t3 1file/错行/gaps空；真无材料缺省键与空数组均 `taskHasMaterials=false`、gap为原 `待补：交付验收材料与证据链接`；progressLog叙事不充材料；非空未勾清单仍按原谓词登记材料、done不变；旧evidenceUrl/deliverableId双读与无file的链接/交付物文本精确保；file-only仍有人复核措辞且不开假gap；schema接受合法assetId、拒非法path；纯构造输入全文不变、无质量裁决；已有历史draft/final两内存域调用原 ensureReflectionOnDone 全文不变、put=0。

原测试原样执行：`reflect.test.ts` 10/10、`reflect-l2.test.ts` 9/9、`task-materials.test.ts` 12/12，共31。原材料测试中“file kind不接受”的标题是早期描述，其实际断言拒绝带path/无assetId的非法项；本轮不改原测试，也不据标题否认合法file联合类型。

原件：[控制 reporter](a20-file-reflection-contract-20261022-selftmp/r1/material-controls.result.json)、[控制实际输入/输出](a20-file-reflection-contract-20261022-selftmp/r1/material-controls.observations.jsonl)、[原测试 reporter](a20-file-reflection-contract-20261022-selftmp/r1/original-tests.result.json)。

真空材料这里只是**生产纯函数 gap 控制**，不关闭原 RA-P0007 的 done→落盘→reflect→重试/重进 GUI 缺口；原 BLOCKED 与 A18-IM-01 FAIL 不变。L2原测试不代 milestone/dlv GUI。没有附件读取/上传/字节质量评判或验收裁决，不读取asset外文件、不按文件材料推断任务已完成；fixture的status/date是既有显式输入。

## 4. 命令与保护

运行环境 macOS + nvm Node22.23.3。以下命令在仓库根；实际三个 Vitest 进程的 cwd 均为自有 `r1/frozen`，直接 Node 自有 `vitest/vitest.mjs`，自有配置/输出，`--no-cache` + cache:false / forks.singleFork / 1worker，白名单env不继承凭据、代理、NODE_OPTIONS。详细 argv/cwd/env/时间/PID/原退出/signal/stdout/stderr 见 [commands.json](a20-file-reflection-contract-20261022-selftmp/r1/commands.json)。

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/a20-file-reflection-contract-20261022-run.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a20-file-reflection-contract-20261022-run.mjs freeze
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a20-file-reflection-contract-20261022-run.mjs run
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a20-file-reflection-contract-20261022-check.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a20-file-reflection-contract-20261022-run.mjs seal
git diff --check -- 'docs/testing/a20-file-reflection-contract-20261022*'
```

语法检查/freeze原退出0；run原退出1（必要红保留），其中红进程73880退出1、材料控制73892退出0、原测试73925退出0，均无signal/error。自有 [证据复核](a20-file-reflection-contract-20261022-check.mjs) 退出0、47条原件核对成立，**这是对原红/控制/保护的核对，不是47项产品PASS**。

执行后18保护根、15,614条目的 SHA/bytes/link/mtime 零漂移：当前完整输入/lib、指定A18原报告/index/本轮三原件、来源完整依赖；冻结生产输入与本轮完整依赖另核零新增/删除/内容/mtime漂移。保护前后 manifests 和 [summary](a20-file-reflection-contract-20261022-selftmp/r1/summary.json) 保原。未监控Main其他新证据、业务库、外文件、凭据/服务或整盘，不宣称整盘零污染。

自有最终seal再次比同保护基线、冻源/依赖/测试原件，并封本前缀交付文件 hash，结果以 [seal.json](a20-file-reflection-contract-20261022-selftmp/r1/seal.json) 为准。单PID查询73880/73892/73925退出1、stdout空，三个测试进程已消失；不以取消状态替代退出、不模糊杀任何服务。工具侧rg不可用，改用find/grep；一次仅文件名的记忆定位越出项目、权限拒绝后已精确停止其自有find PID70786，没有读出记忆或凭据内容，不将这项定位说成成功。

## 5. 释放与后续停止条件

**本轮释放/STOP，不签 PASS。** 不持有产品写锁、builder、端口、GUI、业务数据或共享依赖锁；自有源/完整依赖/测试原红与报告保留，不删除/重整。最终seal仅再次保护核验，不改变原红。

后续必须等 **当前 feedback95 门闭 + habitdefect 门闭**，再由 Main/负责人授权有限 `core/reflect.ts` + 必要新增tests：只加已登记file计数到原材料行、保质量由人复核，不改taskHasMaterials/模型/schema、自动完成/验收、历史记录或迁移。修后独立复验保原t3 raw，并对该合法task期待包含1file；C01的旧函数等于错行仅留作本轮baseline，不要求修后函数继续错行。Main另沿原P0007既有入口补真空材料旅程交独立审证。**本先行计划/red不授权提前产品写、下一功能、构建、commit或发布。**

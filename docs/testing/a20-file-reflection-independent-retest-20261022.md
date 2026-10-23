# A20 文件资料反思声明独立限定复验

> 2026-10-22，A20 独立测试专家。仅审查并复验指定两文件候选的 SOURCE/AUTO 层；不修改产品代码、Main 文档、服务或业务数据，不替代 RA-P0007 真实持久化/GUI 门，不扩大 A20 总门或发布范围。

## 1. 限定结论

| 层级 | 结论 | 证据摘要 |
| --- | --- | --- |
| SOURCE | **有限 PASS** | 两个候选 SHA 与派单一致；相对未修 `reflect.ts` 仅在 `buildReflectionDraft` 附件计数块增加 file 数量及对应注释，未改 `taskHasMaterials`、schema、历史幂等、L2 或验收裁决 |
| AUTO | **有限 PASS** | 新增专项 5/5、reflect 10/10、reflect-l2 9/9、task-materials 12/12、先行合同 adapter 16/16；完整 `tsc --noEmit` 退出 0 |
| A20 本次 SOURCE/AUTO | **有限 PASS** | FR-R01..R04 修后输出成立；FR-C01 原 raw 不变，历史 draft/final 不迁移；输入不变及既有 gap/措辞成立 |
| RA-P0007 真实持久化/GUI | **NOT_RUN（范围外）** | 未启动服务、未写业务数据、未执行 done→落盘→命令→重进 GUI；本报告不得用于关闭该门 |
| A20 总门 / 提交 / 发布 | **不作结论** | 本次授权只覆盖两文件 SOURCE/AUTO，不扩展到整包构建、实际下发、GUI、提交或发布 |

本轮无 SOURCE/AUTO `FAIL` 或执行性 `BLOCKED`。上述 PASS 只绑定本报告第 2 节两文件字节；任一候选漂移即失效。

## 2. 候选身份与源码审查

环境：macOS Darwin 24.6.0 arm64，Node `v22.23.3`，Vitest `2.1.9`，TypeScript `5.9.x`。基线 HEAD 为 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`；dirty 工作树另有多人在途成果，本轮未清理、回退或写入。

| 文件 | 派单 SHA256 | 复验前/后 SHA256 | 结果 |
| --- | --- | --- | --- |
| `packages/dsh-pm-tool/src/core/reflect.ts` | `3423fef5553c3314577698439022310e463ab28c2f42c7476f4886d101cf433b` | 同左 | 无漂移 |
| `packages/dsh-pm-tool/src/core/reflect-file-count.test.ts` | `059a67a3dbeda0ab72284564fc627b52b3ca57bb57e7f405d489b09c4f9da16a` | 同左 | 无漂移 |
| 未修冻结 `reflect.ts` | `5ee9a958e33fbd5207ee9851892a291eb3351994e46820aced250b0ae3d97ffd` | 同左 | 原基线成立 |

当前候选与 `/private/tmp/pmtool-a20-retest-20261022.Oe1DAh/package` 中实际受测两文件逐字节一致。相对未修源的完整差异只有：

1. `buildReflectionDraft` 注释补充“按已登记附件项统计链接、交付物和文件数量，不读取附件内容或判断质量”。
2. 既有附件计数块增加 `a.kind === 'file'` 的数量。
3. 既有 `parts` 顺序在链接、交付物后追加非零 `${files} 个文件`。

没有其他源码差异；`taskHasMaterials(task)` 调用及其实现未改，schema/model 未改，`ensureReflectionOnDone` 历史幂等未改，milestone/deliverable L2 未改，未增加文件读取、质量推断、自动完成、定稿、迁移或验收裁决。

新增测试共 5 项，覆盖 file-only、同资产两附件按 2、混合顺序、重排/输入不变/不造零数量、无 file 时原链接与交付物文案。

## 3. 执行方法与命令

只把当前 `src` 与 TypeScript/Vitest 配置复制到临时根，依赖固定为先行合同已认领的只读 `/private/tmp/pmtool-a19-owned-deps-20261022/node_modules`。未运行 pnpm、installer、build、缓存、服务或 GUI。

所有测试命令 cwd：

```text
/private/tmp/pmtool-a20-retest-20261022.Oe1DAh/package
```

共同白名单环境和 Node 直达前缀：

```sh
env -i \
  PATH=/Users/bytedance/.nvm/versions/node/v22.23.3/bin:/usr/bin:/bin \
  HOME=/private/tmp/pmtool-a20-retest-20261022.Oe1DAh/home \
  TMPDIR=/private/tmp/pmtool-a20-retest-20261022.Oe1DAh/runtime \
  XDG_CACHE_HOME=/private/tmp/pmtool-a20-retest-20261022.Oe1DAh/cache \
  DSH_HOME=/private/tmp/pmtool-a20-retest-20261022.Oe1DAh/dsh \
  CI=true LANG=zh_CN.UTF-8 TZ=UTC NODE_DISABLE_COMPILE_CACHE=1 \
  /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node
```

四组指定回归与新增专项均使用：

```sh
node_modules/vitest/vitest.mjs run <测试文件> \
  --no-cache --pool=forks --poolOptions.forks.singleFork=true \
  --maxWorkers=1 --minWorkers=1 --reporter=verbose
```

依次替换 `<测试文件>` 为：

```text
src/core/reflect-file-count.test.ts
src/core/reflect.test.ts
src/core/reflect-l2.test.ts
src/core/task-materials.test.ts
```

先行合同临时 adapter 额外设置：

```sh
FR_FIXTURE=/private/tmp/pmtool-a20-retest-20261022.Oe1DAh/evidence/replay-input.json
FR_OBSERVATIONS=/private/tmp/pmtool-a20-retest-20261022.Oe1DAh/evidence/contract-observations.jsonl
```

执行文件：

```sh
node_modules/vitest/vitest.mjs run src/core/a20-contract-adapter.test.ts \
  --no-cache --pool=forks --poolOptions.forks.singleFork=true \
  --maxWorkers=1 --minWorkers=1 --reporter=verbose
```

完整 TypeScript 检查：

```sh
node_modules/typescript/bin/tsc --noEmit --pretty false
```

## 4. 精确结果

| 执行项 | 原退出码 | 精确结果 |
| --- | ---: | --- |
| `reflect-file-count.test.ts` | 0 | 1 file passed，5 tests passed |
| `reflect.test.ts` | 0 | 1 file passed，10 tests passed |
| `reflect-l2.test.ts` | 0 | 1 file passed，9 tests passed |
| `task-materials.test.ts` | 0 | 1 file passed，12 tests passed |
| 临时先行合同 adapter | 0 | 1 file passed，16 tests passed（FR-R01..R04、FR-C01..C12） |
| 完整 `tsc --noEmit --pretty false` | 0 | 无诊断输出 |

指定四组加新增专项合计 **36/36**；adapter 是对先行合同的额外直接核验，不重复扩称为产品功能数。

## 5. 合同与不变量实证

- FR-R01：原 t3 合法 file-only 输入修后材料行是 `资料区已登记：1 个文件（质量由人复核）`，`gaps=[]`。
- FR-R02：两个 file 附件输出 `2 个文件`；新增专项另证同一 `assetId` 的两个不同附件仍按附件项计 2。
- FR-R03：link + deliverable + file 精确输出 `1 条链接、1 项交付物、1 个文件`，顺序不变。
- FR-R04：2 link + 1 deliverable + 2 file 正序、逆序均精确输出 `2 条链接、1 项交付物、2 个文件`。
- 无 file 输入仍精确保留 `1 条链接、1 项交付物（质量由人复核）`，不虚构 `0 个文件`。
- 真无材料的缺省键与空数组继续产生 `待补：交付验收材料与证据链接`；progressLog 叙事不充材料。
- file-only 继续 `taskHasMaterials=true`、`gaps=[]`；所有材料行保留“质量由人复核”，不出现验收通过、自动定稿、文件已完成、质量合格或已读取。
- adapter 对输入递归冻结并在构造前后深比较；重复构造确定，附件顺序及字段未被修改。
- FR-C11/C12：已有历史 draft/final 调用 `ensureReflectionOnDone` 后全文不变、`put=0`，未重算、未迁移、未自动 final。

原 A18 证据仍保留错行，不被修后纯函数输出覆盖：

| 原件 | 当前 SHA256 | A18 index 登记 |
| --- | --- | --- |
| `raw/tasks/t-0003.json` | `90708820eaa16f8de9adcc6b66d37b0a3a0a78fee91ee5413985ca25a1fc545f` | 一致 |
| `raw/reflections/ref-mvisx864-w3fqsq.json` | `73c9ca2c401dd2f2820b4468f33edc68d5b7a742126ec2a0869ecf2175e5d576` | 一致 |

原 reflection 仍为 `draft` / `task-done`、`gaps=[]`，历史材料行仍为 `资料区已登记：（质量由人复核）`。修后只影响以后调用构造函数得到的新草稿文本。

## 6. 边界与执行卫生

- 未执行整包 build、全部 verify、真实宿主激活、生产保存、命令重读、重进或 GUI；不能据此关闭 RA-P0007，也不能宣称实际下发可见。
- 未读附件外部字节、未上传文件、未写业务数据库，未修改服务或正式端口。
- 未修改既有 `docs/testing` cases；adapter 仅位于 `/private/tmp`。
- 第一次临时复制因范围过宽包含包内历史产物，已对本轮精确 PID `22739`、`22740`、`22734` 执行 TERM 后停止；未模糊杀进程、未触及服务。权威执行使用后续精确 `src` 副本。
- 仓库内本轮唯一写入是本报告；未修改产品代码、Main 文档或其他测试资产，未 commit/push。

**最终判定：指定两文件候选的 SOURCE/AUTO 有限 PASS。该结论不得外推为 RA-P0007 真实持久化/GUI PASS、A20 总门 PASS、提交许可或发布许可。**

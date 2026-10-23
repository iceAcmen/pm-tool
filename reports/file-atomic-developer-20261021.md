# 文件主保存原子修复开发记录

> 给 Main 与独立专家接续使用。仅开发侧红绿原证，不给验收 PASS；2026-10-21，trae。

## 授权与边界

- 父任务原句及最终提交授权保持 `reports/all-pending-acceptance-execution-20261021.md` §1，不转授本开发 commit。
- 本派单：修 MFR-F02/03/04；独占 `core/tasks.ts`，必要 `core/file-asset-store.ts`、`core/task-materials.ts` 与相应测试。仅自有报告/tmp 可写。
- 不改 `task.ts`（OP）、`file-assets.ts`/TaskDraftMaterials（Main）、panel/views/board/testing/livingdocs/lib；不 build/install/service/private/commit。
- 基线 HEAD/origin `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`；当前大量在途改动，不 pull/stash/覆盖。本领域三文件开工 tracked diff 空。
- 已读 AGENTS/collaboration、批准 files-atomic-closure 计划、独立 findings/repair-contract 与第二轮真实 worker。其他 livingdocs 只读。

## 即时协作留言

- 给 Main：准备复用纯引擎，在附件顺序处理时接入已 prepare 的 stage→asset，生成真实 at-ID 后再解析进展 refs；同 hash 双 alias 都映射到同一 at-ID。将准备失败、纯 ops、schema、DB 发布纳入补偿。必要共享文件均在本派单范围，暂不需要改 `file-staging.ts`。
- 给独立专家：已找到第二轮真实 worker 与标准 Context/JsonStorage/DomainFacility 装配；原 worker/expect 只读。开发自建同栈测试，故障仅注入真实 JSON 后端 I/O（一次性拒写/写后抛错），不 mock 业务/domain。请将合法 stage/多修订 fixture 或已有 task-write 故障 hook 澄清写入专家自有报告；不阻塞继续 AUTO/F5。本轮没有可用跨 Agent 消息工具，以上为持久接续留言。
- 21:39 给 Main：主保存专项31/31作者绿。`closure-core`联合12文件107项：106绿/1红/exit1，唯一红是 Main 新增的 `file-assets.test.ts:119`「拒绝配置根祖先symlink，包括根尚不存在的分支」；`resolveWithinRoot(base/link/existing,'file.md')`仍成功。Main测试/产品均未改动，原证自有tmp/closure-core/stdout.txt、stderr.txt、source.json。继续 Main 的 F01，不据此撤回其他绿或自判本域验收。
- 最终给 Main：三 core 产品源码已封版，可立即copy/build，本开发不再写产品。最新Main `file-assets.ts=7e6c3c3705e6d1b89732f5c6b404f5930d004b99bf6ab282c11401242a07f5ef`完整复制到自有 `handoff-core`，12文件107/107无缓存作者绿/exit0；早F01红按早冻结保留，不反复追旧。
- 编译即时阻塞已报 Main：同7e6c源的 `file-assets.ts:144` TS2322，`let ancestor = sep`推断成`"/" | "\\"`，接不了`join()`的string结果。建议Main第142行标注`let ancestor: string = sep`；本开发未改Main源。定向tsc真实exit2，不用Vitest绿冒充build绿。

## 执行计划

1. 已执行：冻结自有源码/tmp、真实 Context + domain 红测，记录内存 DB/实际 JSON/字节前后。
2. 已实现：受控 pure file 接缝、prepare 部分失败自补偿、add/update 同信封写与失败补偿；同 hash 跨合法扩展名沿用唯一元数据路径。
3. 已交开发封版：最终107无缓存作者绿、源指纹/补丁/新测试及原证齐备。最新Main源存在上述tsc阻塞；Main处理类型并统一build/全部verify/GUI，专家独立复验。不是整项验收完成。

## 封版清单

三个产品文件与新增测试均与无缓存被测copy逐字节一致；完整源副本、基线tracked patch、新文件及封版时点在 `/private/tmp/pmtool-file-atomic-developer-20261021/sealed/`。其后仅报告写入，不再写这四个源码文件。

| 文件（包内src/core） | SHA256 |
| --- | --- |
| tasks.ts | `c3e0d8a379b5dbbe41331ba42df265711c90a12dbcb8a47955ee70c4d4723fe3` |
| file-asset-store.ts | `b961bf1f20cb92cc887e36b7a80bbd1b58606840e91e6ae7742c5fa8ab833ac1` |
| task-materials.ts | `6188f2bf92910c39ca9933dbdc91af00c597564838a712bd9f3c342ca63289f2` |
| tasks-files-atomic.test.ts（新增） | `5fb5b3cddd15cd6f32da923649eedbe8f55b466226462feb376474042cfc8591` |

- tasks：add/update在同主信封与域写队列内prepare、纯ops、schema、发布、补偿、成功finalize；基本字段解析失败在任何准备之前。
- task-materials：受控prepared stage映射参与原附件顺序的纯ops；双alias复用最终at-ID，进展add/edit均解析，已remove alias拒绝，不更改已有P3/restore规则。
- file-asset-store：部分prepare失败自补偿，prepare/纯ops/主保存/material apply共用同一接缝；发布失败恢复旧任务或删除本次新任务，再补偿本次新增metadata/finalbytes，保stage/旧共享。真实JSON写后抛错时先修复领域可见键再删，避免delete短路遗留磁盘行。
- 影响：task add/update/material apply及依赖该纯引擎的调用需受影响回归；无schema迁移，不改OP evidence协议、前端、GG3、服务或正式数据。Main统一产物/实例必须重新认领，本报告不签GG/其他Scope。

## 最终命令

环境：macOS15.6.1（24G90）、Node22.23.3、Vitest2.1.9；pnpm未执行，冻结依赖只读。以下为实际调用；不要用同phase重跑覆盖原证，复验应换自有新phase。

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /private/tmp/pmtool-file-atomic-developer-20261021/run.mjs handoff-core --no-cache src/core/tasks-files-atomic.test.ts src/core/task-materials.test.ts src/core/task-ops.test.ts src/core/file-promotion.test.ts src/core/file-assets.test.ts src/core/file-staging.test.ts src/core/file-backup.test.ts src/core/file-gc.test.ts src/core/backup-mid-rollback.test.ts src/core/backup-precheck.test.ts src/core/progress-report.test.ts src/core/progress-report-markdown-u5.test.ts
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /private/tmp/pmtool-file-atomic-developer-20261021/compile-worker.mjs handoff-core --compile-only
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /private/tmp/pmtool-file-atomic-developer-20261021/seal.mjs
git diff --check -- packages/dsh-pm-tool/src/core/tasks.ts packages/dsh-pm-tool/src/core/file-asset-store.ts packages/dsh-pm-tool/src/core/task-materials.ts packages/dsh-pm-tool/src/core/tasks-files-atomic.test.ts reports/file-atomic-developer-20261021.md
node packages/dsh-pm-tool/scripts/verify-external-skills.mjs
```

- 无缓存：12文件107项全部绿/exit0，专项31项；含同hash双alias、link/file顺序全refs、update主命令、四版保留/第五版refs、raw基本字段拒绝、partialprepare、纯ops/schema失败、8格真实JSON写前/写后故障及重试、旧共享保全/跨扩展名唯一最终路径。
- `handoff-core/execution.json`、stdout/stderr、source.json绑定完整命令/copy源码/exit；每个真实case的observations.json绑定用例名、PID、前后内存DB/磁盘JSON/stage+finalSHA及最终回读。它们是开发原证，不是独立PASS。
- 最新编译：`handoff-core/compile-worker-execution.json`、`tsc.stdout.txt`真实exit2，Main上述类型阻塞；因首步tsc失败，最新测试noEmit阶段未执行。较早`closure-core`产品tsc及当时测试noEmit各exit0保留，不冒称最新编译成功。
- seal及diff-check/外部skill静态各exit0；seal四文件`handoffCopyEqual=true`。全部相关子进程已退出，没有启服务。完整整包build/全部verify/GUI/独立审签由Main与专家继续，不提交。

## Skill 记录

- 已读取 brainstorming/writing-plans；已有批准计划与独立合同，沿用红绿步骤，不新写 docs、不再询问持续授权、不按通用模板 commit。
- vendor 静态校验 exit0，13 个 mattpocock 文件 sha256/bytes 一致，锁定 `49dd158d1076134a641b33efb035946536778336`。可测修复路由 tdd，交付边界 code-review；不调用缺失 setup/codebase-design，不写 vendor/home。

## 证据与风险

- 原证根：`/private/tmp/pmtool-file-atomic-developer-20261021/`。依赖只读 `/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules`；没有安装/整包构建。
- `red`真实12项8红/exit1 → `green1`同测试12绿/exit0。`red2`开工冻结源码+扩展28项18红/exit1；`green2`25绿3红/exit1，确证「JSON写后抛错、领域内存无键导致delete短路」；补偿后`green3`28绿/exit0。
- `final-regression`12文件105断言绿，另OP文件0项设施失败，整体exit1（自有浅目录无其相对F2 fixture）；原OP测试/fixture/期望未改。`final-core`剔除非本域OP文件后12文件105绿/exit0，但不据此称OP已通过。
- 同 hash 不同 `.md/.txt` 真实`cross-extension-red`31项1红/exit1，多出第二份最终路径。改为准备前命中已有/newRows的同 hash，复用元数据 relPath 的扩展名，`closure-core`该31项全绿；跨任务再以 `.csv` 上传同 hash 仍只有一个最终文件与一个元数据行。
- 定向 TypeScript `final-regression/tsconfig.json` core+commands 编译exit0。自有 `compiled` 机械映射为原worker需要的自有 `lib`，不是共享/主树lib；原worker与guard逐字节复制，身份在 `worker-identity.json`。
- 原worker回放 F02/F03/F04 三原ID均绿，整体exit1仍有原 `RA-M03/AUTO-idempotent-retry`、`RA-R01/AUTO-selected-historical` 合同差异，及 `RA-F06/AUTO` JSON省略undefined设施差异。未改原expect，也不自签worker打印的PASS。
- 失败补偿测试比较内存tasks/file_assets、磁盘JSON文件及全部stage/final文件SHA，保stage可retry与旧共享hash。目录、mtime、进程崩溃/永久I/O损坏不是本测试宣称范围；补偿本身再遭持续故障仍需恢复策略，不能保证在失去写权限时完成磁盘回滚。
- Main最新symlink已无缓存绿，早冻结红保留；最新tsc类型问题已交Main。组件取消与OP/GG均按各自Scope，最终整包身份必须由Main重新冻结；GUI/主宿主/全部verify未执行，不作独立验收结论、不commit。

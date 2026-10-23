# 网页备份接缝开发记录

> 给 Main 与独立测试专家接续使用。2026-10-21，trae，开发角色；作者验证不构成独立 PASS。

## 授权与计划

- 父任务及持续执行授权：`reports/all-pending-acceptance-execution-20261021.md`；本子任务不 commit、不 push。
- 已批准方案：`docs/plans/2026-10-21-backup-web-closure.md`。仅写 `src/commands/backup.ts`、必要 `src/core/backup.ts`、相应测试及本报告/自有 tmp。
- 面板/GUI/整包构建/新 candidate 归 Main；testing/独立判定归专家；不改其他产品、livingdocs、schema 白名单、lib、安装、服务、私有配置或凭据。
- 基线 HEAD：`9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`；当前为共享 dirty 候选，不能以 HEAD 表示本次源码。
- 使用原 `fiKpOr/fixtures/F5` 的完整标准 JSON、侧车及 `expected.json`。不去掉 `file_assets`，不发明上传或内嵌 bytes 格式。

### 文件级步骤

1. [开发已执行] 新增 `packages/dsh-pm-tool/src/commands/backup-web.test.ts`：真实 Context/Storage/JsonStorageBackend/DomainFacility、生产 schema、真实 command handler；内容越界先红后绿。
2. [开发已实现] `core/backup.ts`：共用只读内容/路径预检；schema/关系/文件元数据安全先验，含文件 content 明确未检侧车字节；路径校验侧车和提升时的媒体/大小/内容寻址。
3. [开发已实现] `commands/backup.ts`：演练调用完整预检，合法路径安全 quote，错误 token/额外 confirm 零写拒绝；确认重新读取并同级校验。
4. [作者自验已执行] 原 F5 合法路径/坏 hash/缺字节/越界/关系、原 F3 content 无附件兼容、legacy 保 extra、全表/字节/安全快照/事务回滚。
5. [待 Main/专家] 自有 compile/no-cache/新进程读回及原证归档已执行；下一步 Main 新 candidate build/GUI，专家独立复验，尚无 PASS。

## 设施与 Skill

- 自有输出：`.tmp/backup-web-developer-20261021/`，只读依赖链接到 `/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules`；不执行 install 或整包 build。
- 写计划采用已批准方案，不另改 plans/livingdocs；原 SOP 的 pull/install/build/commit 被本次更具体共享资源分工限制取代，不在 dirty 主树拉取或重建。
- memory 路径不存在，以仓库为准；当前 shell 无 `rg`，使用 `grep/find`。
- vendor 静态校验 `node packages/dsh-pm-tool/scripts/verify-external-skills.mjs` exit 0，mattpocock 锁定 `49dd158d1076134a641b33efb035946536778336`，13 文件 sha256/bytes 一致；`vendorIntegrityVerified=true`。
- taskKind=feature（已确证可测修复），采用 tdd；接口/方案由本次派单及既定独立合同确认，不再追问。真实 domain 回读遵守项目证据规则，不受 vendor “勿查 DB”泛化限制。交付阶段追加 code-review，不调用缺失 setup/codebase-design，不替专家签字。

## 实现与指纹

- `precheckBackupContent`、`precheckBackupFile` 与确认的 `applyBackup` 共用只读 `precheckBackupSource`。路径 JSON 与其摘要来自一次读取，避免旧两次读取错配；确认不复用旧演练成功状态。
- 七表 schema、原白名单 extra 的现存 `pmDomainSpec.valueSchema`、主键/数组、父任务同项目/无环、文件归属/引用/sha/relPath 在字节缺失提示之前校验。未改 `storage.ts`、白名单、格式版本或原 key/value 恢复规则，legacy 缺 extra 仍保留当前额外表。
- 标准侧车继续使用现有 `precheckBackupBytes` 验 manifest/jsonSha/bundle/hash/missing；另复用提升时 `validateUploadedFile` 与内容寻址规则，先拒绝实际大小、媒体或 canonical relPath 不一致。
- 恢复仍走原单域写队列、十三表替换、安全快照先落盘、DB/新字节回滚；本批未重写事务。
- 候选原证：[candidate.json](backup-web-developer-20261021-tmp/evidence/candidate.json)、[tracked.patch](backup-web-developer-20261021-tmp/evidence/tracked.patch)、三项冻结源 `.txt`、全源码/自有编译产物指纹、[原证 SHA256 索引](backup-web-developer-20261021-tmp/evidence/sha256.json)。最终主树三源与冻结副本一致，final-8 全 src 前后也一致；不以 HEAD 或旧 MainA6build0 代替。

| 文件 | 最终 SHA256 |
| --- | --- |
| `src/commands/backup.ts` | `48369dafe70023bce1ebdf5a82d7b2475627ea6d6b58036187c8845491cf8cdd` |
| `src/core/backup.ts` | `a4c302bd7646478deb56a61070b4a50262c1b220805f2013a036c2d5b0870295` |
| `src/commands/backup-web.test.ts` | `d7d79c55d839fcab6b3c9a3f45350e62c44f2488deccc990d96b902fa8bac6ce` |

原命令/core SHA 与 fiKpOr 专家冻结值相同：`52707c...` / `eb27ed...`。新增测试的首次红测源另存指纹，不是基线已有测试。F5 JSON 仍 `8f9bf659a59077af3753900b9fec43dbca752673e59516d025f649a1982f8b4c`，expected `b2af85cd52e9a6c773d5418dfd7891d392b4c40883600cc57e52c08581055bb6`；完整侧车/ids 指纹见 candidate，原包未修改。

## 实际红绿

运行环境：macOS，Node `v22.23.3`，现有 pnpm 11.28.5 依赖只读。每轮采用自有源码副本、自有 `tsconfig.qa.json/out`、自有 Vite cache、`--no-cache`、单 worker、120 秒有界子进程。真实 handler 调用，不用 fakeDomain；故障注入仅原 `BackupWriteHooks`，每笔 DB/字节仍为真实写入。

| 自有轮次 | compile exit | Vitest exit / 实际 |
| --- | --- | --- |
| red-1 | 2，新增测试表名推断错误 | 1，真实 content 越界误报 success，1 红 |
| green-1 | 0 | 0，1/1 |
| red-path-2 | 0 | 1，缺侧车/hash/missing 演练误报 success，3 红/3 绿 |
| green-path-2 | 0 | 0，6/6 |
| red-quote-3 | 0 | 1，未 quote 回显及四尾参，5 红/6 绿；三尾参真恢复了自有空库 |
| red-schema-4 | 2，新增测试可选 text 推断错误 | 1，父跨项目/父链环/extra 先检缺口 3 红；另两回滚比较仅空目录变化，19 绿 |
| green-all-4 | 0 | 0，24/24 |
| red-byte-semantic-5 | 0 | 1，摘要匹配但实际 size/mime/relPath 错误，3 红/24 绿 |
| green-regression-5 | 0 | 0，4 文件 42/42 |
| final-6 | 0 | 0，4 文件 42/42；额外全新 Node 读回 exit 0 |
| red-metadata-7 | 0 | 1，保 file 引用却缺 file_assets 的不完整包误报无附件 success，1 红/27 绿 |
| final-8 | 0 | 0，4 文件 43/43；全新 Node 读回 exit 0，最终候选 |

红测保留全部 stdout/stderr/断言与失败 before/after。两次新增测试类型错误已修正，不称产品编译故障；回滚初轮只多空 JSON 表目录，记录/字节相同，不擅改后端清目录。末轮使用现存 schema 合法十三表前态、旧共享 A、目标新 B；原 F5 不删行，故障后十三表、持久 JSON 文件和共享 A 字节严格回原态，B 删除，安全快照可完整预检。

完整 argv/cwd/time/exit：[final-8/commands.json](backup-web-developer-20261021-tmp/evidence/final-8/commands.json)。在其自有 `package` cwd 实际运行：

```sh
node node_modules/typescript/bin/tsc -p tsconfig.qa.json
node node_modules/vitest/vitest.mjs run --config vitest.qa.config.mjs --no-cache --reporter=default --reporter=json --outputFile=/Users/bytedance/Projects/dsh-pm/pm-tool/.tmp/backup-web-developer-20261021/final-8/vitest.json src/commands/backup-web.test.ts src/core/backup-precheck.test.ts src/core/backup-mid-rollback.test.ts src/core/file-backup.test.ts
node reopen.mjs
```

末轮专项 28、现有 file-backup 9、precheck 5、mid-rollback 1；不是完整插件回归。新 PID `51209 → 51225` 从恢复库只读打开，十三表与 expected 全字段/稳定 ID/共享/三修订/软删一致，两文件各 22 字节且 hash 精确匹配，sessions/checks 空，读回目录清单前后不变：[reopen 原证](backup-web-developer-20261021-tmp/evidence/final-8/reopen.stdout.txt)。旧 final-6 新进程原证保留，不冒充最终源码。

共享 `.vite/vitest/results.json` 前后 SHA 同为 `3985a9b4ef3eee5228c1d45e53efca59587bf329cd9d3505856fc444fc109019`；[sentinel](backup-web-developer-20261021-tmp/evidence/final-8/shared-cache-sentinel.json)。自有源码/运行/缓存/备份/字节根在 `.tmp/backup-web-developer-20261021/`，原证持久归档在本报告前缀；archive 后再逐字节核对 exit 0，184 件原证零不一致。没有整盘 OS 写审计，不冒称全盘零污染。

## Main 命令接口

- 不新增上传协议。`execute('restore ' + quotedPath)` 做完整演练；两次明确危险确认后才 `execute('restore ' + quotedPath + ' confirm')`。返回仍是现有 `CommandResult.kind/text`；演练 error 不开放确认，输入错误保留。
- `quotedPath` 是整条真实本机路径 token：无双引号用 `"原路径"`，含双引号但不含单引号用 `'原路径'`；空/控制字符/同时含两种引号拒绝。已导出服务器侧 `quoteBackupPath`；前端不要导入带 Node 依赖的命令模块，可按同一协议 quote。不将 `JSON.stringify(path)` 当有反斜杠转义的路径协议。
- 后端严格拒绝多余尾参、未闭合或拼接 token；只允许缺省演练或单个 confirm。演练文本回显安全 quote 的完整 `/pm restore ... confirm`，含额外表/文件计数；确认成功不再夹带“尚未恢复”的演练文本。
- content-only 含附件必须 error，正文明确“仅 JSON、未检验侧车字节、需本机完整路径与同目录侧车”；越界/hash 缺失/关系错误先报真实内容错误。保留 file 引用却缺 file_assets 的不完整包也先报文件资产缺失，不借缺元数据伪称无附件成功；原 F3 与合法无 file 的 legacy JSON-only 演练/确认保持兼容。
- Main 仍负责显式本机路径 input、取消零写、双确认、恢复后重进/下载与真实 GUI 原证；不读浏览器 File.path、不从文件名猜路径。本后端没改 panel，也未进入 3214 服务。

## 自查与未覆盖

- Standards 自查：写文件限本派单；没有改 schema/白名单、其他产品、testing/livingdocs、shared lib/install/service/private/credentials/Git。Spec 自查：原标准包及 sidecar、真实内容/路径预检、旧包保全、安全快照/回滚、quote 协议均有作者断言；没有新增备份格式/上传/嵌入 bytes。code-review 是开发自查，当前无子代理调用工具，不伪称独立双代理审查或 PASS。
- 预检只读，确认重新读当前路径并同级校验；没有新增 preview 内容指纹锁定协议。两次操作间合法包被外部替换、确认过程中外部并发改 sidecar 的竞态不由本轮证明已解决，需专家按合同判风险。
- 不包括宿主 dispatch/认证、pack/bundle 装载、真实网页输入/取消/两危险确认、下载/样式/体验矩阵、历史发布 binary、整包 build 与全部 verify。原始目录级空表副作用已留证；安全快照为允许的恢复前新增文件，不把事务回滚说成全部根零写。
- 下一步：Main 依据上列三源 hash 同步到新 candidate，唯一 build/重新认领运行实例后按专家 GUI 合同采证；专家复验 MFR-B01/B02、路径/完整字节及受影响备份表保全。父任务最终普通 commit 由 Main 在全部门收口后执行，本子任务不签字、不 commit。

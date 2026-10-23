# A13 中文原生上传请求头修复回件

> 给 Main 与独立测试专家接续使用：只记录四文件 SOURCE 改动、开发红绿自验和释放指纹，不自签独立 PASS。平台 trae；实际日期 2026-10-22，前缀按父派单保留 20261021。

## 授权与终点

负责人原句：

> 开发仅修已确证A13U01中文nativeuploadrawheaderinvalid。先读AGENTS/collab/plan docs/plans/2026-10-21-unicode-upload-closure.md及**已完成先行专家** docs/testing/a13-unicode-upload-contract-20261021-plan.md/cases/red，遵照其线协议：encodeURIComponent整名+x-pm-file-name-encoding uri-component；服务端严格新标记单decode，legacy无marker旧ASCII/旧encoded+malformedpercent容错保持；拆现sanitize避免doubledecode；protocolinvalid无body/无write/gate先行，安全/10MiB/bytes等不改。独占4产品files client/shared/stage-client.ts/.test.ts, core/http/asset-route.ts/.test.ts，仅reports/a13-unicode-upload-developer-20261021前缀。自有freeze/test/no-cache旧红新绿+相关回归/noemit，禁止install/build/sharedlib/GUI/service/credentials/otherdocs/commit。MainA11/A12existinglib不改，新A13待你释放后唯一冻建+原nativepicker。用户goalcontinue持续验已有最后Main普通commit无push，不新功能。case详细跨request/stage/directattach/encode/双decode守卫遵照；不降低旧安全或写root。完整hash/report释放，SOURCE不自签独立PASS。

- 已读 AGENTS、collaboration、指定修复计划、专家 plan/cases/red 及当前进度/交接。依该批明确授权，不 fetch/pull/install/build/全部 verify，不改共享档案、上游、服务、profile、凭据或版本控制。
- 本批终点是限定 SOURCE 修复和回件释放；父目标“持续验已有、最后 Main 普通 commit、无 push、不新功能”保留，但不扩成开发端 GUI/build/commit 权限。
- 专家原件只读；未直接重放其 `red.mjs`，因该脚本会覆盖专家 `red.json`。本次用自己的旧源码冻结副本配新测试重放红例。
- 四文件修前均与专家原证 SHA256 相同，无既有 diff；没有覆盖其他在途产品改动。

## 改动

| 文件（均在 `packages/dsh-pm-tool/src/`） | 内容与影响 |
| --- | --- |
| `client/shared/stage-client.ts` | 完整 `encodeURIComponent(fileName)`；非空名才加 `x-pm-file-name-encoding: uri-component`；空/缺名仍空头且无标记。保持 Blob/signal/同源/no-store/类型/无 taskId/响应映射。 |
| `client/shared/stage-client.test.ts` | 真实 Headers/Request 截断，中文原件、百分号/空格/+/#/?、字面 `%2F`、ASCII、空/缺名；raw Unicode 平台拒绝仍保留；原错误/取消测试继续运行。 |
| `core/http/asset-route.ts` | 拆分解码和纯 sanitize。新标记严格一次解码，非法编码/UTF-8、空/未知/数组/重复标记、缺/空/非ASCII/控制/重复名头拒绝；认证先行，协议拒绝在 body 收集前。无标记保留旧 decode 容错。 |
| `core/http/asset-route.test.ts` | 真实 upload handler + Cordis/JSON/domain/合法项目任务，记录每请求前后 data/files/staging/记录；暂存、取消、直挂、下载/hash、legacy、新协议非法、单decode、路径/控制、类型、10MiB和认证。 |

未改 direct client、download 实现、业务 schema、GC/TTL/promotion、文件安全底座、配置根选择或任何共享 lib。新协议拒绝原始逗号合并名头；合法文件名的逗号由整名编码变为 `%2C`，不与合并头混同。原 rawHeaders 可见时额外核同名重复头，大小写不敏感。legacy 不新增这些编码要求。

## 候选与原件

- HEAD、本地 origin/main ref：`9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`；不代表全仓 dirty 候选。
- 原件实读 `/private/tmp/pmtool-a11-native-files/QA 文件 原件.md`，22 字节，sha256 `87ef7d4f570468db73bd600a35b913cba4f82d5101a4e559536ecab8cf472d1a`。没有替造内容冒充原件。
- 本批冻结在 [selftmp](a13-unicode-upload-developer-20261021-selftmp/) 的 `old`、`new`、`new-r2`；源码复制前后逐文件相等。`old` 产品保留修前版本，仅复制相同新测试；修前红与修后绿使用相同两测试字节。
- `before.json`/三个 `*-manifest.json` 认领全 src 和 package/lock/tsconfig/vitest 配置；`four-files.patch` 认领四文件相对 HEAD 的完整 diff；`release.json` 认领释放状态。依赖指纹在 `new-r2-dependencies.json`，只读复用已有安装，不是本轮安装。

最终四文件 SHA256：

| 文件 | SHA256 |
| --- | --- |
| `client/shared/stage-client.ts` | `3d47b8fb194cb221b7518c4f121aea93dc650b3bc1bdc1aaa8749b11b954b5d1` |
| `client/shared/stage-client.test.ts` | `dc6b7424e588afba3dc4c05c9dd29c7f19fd14e17d1b7d2ebd7fce05725d50d7` |
| `core/http/asset-route.ts` | `bac973650943798090c148f6245121781c2e7a080cb5b30f108b0ac793e1da80` |
| `core/http/asset-route.test.ts` | `c0d623ed9884cff1def7c508d588fd970c6c490aecc69b211de0875ebe4ef01e` |

完整指纹以 [release.json](a13-unicode-upload-developer-20261021-selftmp/release.json) 为准；报告/runner/冻结副本、命令输出、逐请求原证的索引见 [index.json](a13-unicode-upload-developer-20261021-index.json)。

## 命令与结果

环境：macOS arm64、现有 nvm Node `v22.23.3`、Vitest `2.1.9`、TypeScript `5.9.3`。未运行 pnpm；项目约定 pnpm `11.28.5`。运行目录是仓库根；runner 逐命令记录实际 argv、cwd、exit、stdout、stderr。

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a13-unicode-upload-developer-20261021-run.mjs prepare
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a13-unicode-upload-developer-20261021-run.mjs red
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a13-unicode-upload-developer-20261021-run.mjs green
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a13-unicode-upload-developer-20261021-run.mjs noemit
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a13-unicode-upload-developer-20261021-run.mjs green-r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a13-unicode-upload-developer-20261021-run.mjs noemit-r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a13-unicode-upload-developer-20261021-run.mjs finish
```

| 命令 | exit / 结果 / 原证 |
| --- | --- |
| `prepare` | 0；四文件修前与专家指纹匹配，冻结旧 src；监视共享 lib 和指定业务根。 |
| `red` | 子测试 exit1，runner exit0（确认预期红）；2files/79tests：25失败、54通过。[red.json](a13-unicode-upload-developer-20261021-selftmp/red.json)。中文真实生产调用为 ByteString TypeError → StageUnavailable(network)，未发送网络；其他红为标记缺失/协议无效仍进入旧路径。 |
| `green` | exit1；129条断言通过，但1个 React suite 因主树现有依赖缺 `react-test-renderer` 无法加载。不算整轮通过，不覆盖失败原证。[green-related.json](a13-unicode-upload-developer-20261021-selftmp/green-related.json)。 |
| `noemit` | 0；冻结新源码原 tsconfig，`--noEmit --incremental false`，无编译输出。[noemit.json](a13-unicode-upload-developer-20261021-selftmp/noemit.json)。 |
| `green-r2` | 0；使用既有完整隔离依赖，11files/171tests全绿；无 cache、单 worker。 [green-related-r2.json](a13-unicode-upload-developer-20261021-selftmp/green-related-r2.json)。 |
| `noemit-r2` | 0；同最终冻结源码、完整只读依赖，原 tsconfig noEmit。[noemit-r2.json](a13-unicode-upload-developer-20261021-selftmp/noemit-r2.json)。 |
| `finish` | 0；源/配置与冻结一致、依赖无漂移、专家五文件未改、共享 lib/所监视业务根前后相同；完整 patch/指纹释放。 |
| `node packages/dsh-pm-tool/scripts/verify-external-skills.mjs` | 0；静态校验两注册 vendor 指纹，不执行 vendor 脚本、不写文件。此脚本自己的静态 PASS 不是 A13 独立 PASS。 |
| `git diff --check -- <四产品文件> reports/a13-unicode-upload-developer-20261021-run.mjs` | 0；无空白错误，不改 git 索引。 |

11个测试文件的精确集合：`stage-client.test.ts`、`asset-route.test.ts`、`file-assets.test.ts`、`file-staging.test.ts`、`file-root.test.ts`、`file-promotion.test.ts`、`tasks-files-atomic.test.ts`、`asset-client.test.ts`、`staged-lifecycle.test.ts`、`task-draft-materials-stage.test.tsx`、`preview-route.test.ts`。完整相对路径/argv在命令原证。

实际 Vitest 参数：`run --no-cache --maxWorkers=1 --minWorkers=1 --reporter=verbose <上述文件>`。首轮用主树 node_modules；最终只读依赖根为 `/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules`，不改其文件。自有 TMPDIR、隔离 FILE_ROOT；主保存原子测试亦指定自有 `PM_FILE_ATOMIC_TMP`。

## 用例映射与边界

- C01/C02/C03：生产 stageAsset 经原生 Headers/Request；整名编码且响应不再 decode，Blob/signal/同源原约定不变；错误分类/取消仍运行。平台 raw Unicode 仍拒绝，不修改 Headers 或绕过构造凑绿。
- S01/S02：真实 JSON 域与隔离字节；暂存 opaque stageId/201/22/hash，取消两次幂等，无提前最终资产；直挂返回 Unicode/22/hash，同字节重传零新增，错项目403。真实 download handler 回读原件 Buffer、RFC5987、安全头，未绑定任务403；不是浏览器下载或宿主真认证。
- S03：旧 ASCII/空格/+、旧中文 URI 编码、旧 malformed-percent 原结果保持。无标记分支与新标记非法严格拒绝分开。
- S04/S05：6种 malformed/UTF-8 与未知/空/数组/重复/缺名/非ASCII/控制；stage/direct 两入口400，bodyReads=0、data/files/任务/资产前后完全相等；认证先行。
- S06/S07/S08：实际 stage和真实asset持久化保 `%2F/%5C/%2E` 字面片段；Windows/相对路径取basename、剥CR/LF/NUL；活动类型/未知扩展仍拒绝且零写。
- G01/G02：空body、10,485,760边界成功、边界+1及声明超限分别413；错误magic/MIME/UTF-8/NUL/脚本拒绝，实际stage/direct零写；既有白名单正/负例相关回归全绿，二进制magic不是完整图片/PDF解码。
- G03：本批没有改配置根/防越界/symlink/共享字节底座；`file-root`、`file-assets`、promotion、主保存原子性相关回归已重跑。**并未新执行全部“新header×root/祖先/最终节点symlink”交叉矩阵**，历史 RA-F03 是否继承由专家按精确未变依赖指纹审定，不在这里自签继承。
- G04：无gate/401/403/抛错先于非法协议，body未读、DB/字节零写；download未绑定覆盖。本轮 fake req/res/gate 是传输适配，存储和字节真实；宿主真认证/全部跨项目下载矩阵仍须专家/Main接续。
- 旧 abort 回归保持运行；其既有“安装监听前 emit”只证明旧测试结果，不冒称有效流式 abort 新原证。专家原 RA-F02 有正确监听后的独立原证；此次 collectBounded未改，继承由专家审定。

逐请求 `observations.json` 保真实头形态、输入size/hash、响应、bodyReads、安全头、请求前后 data/files（含staging）指纹、任务和资产记录；在 `green-related-r2-tmp/a13-route-*`。只核所列根，不声称全盘零写。共享 Main A11/A12 lib前后完全一致，未用其作为新A13源码生效证据。

## 方法与交付自查

- 已加载 brainstorming/writing-plans 说明，沿负责人已批准、专家先行冻结的设计/计划执行；不另写其他docs、不再发起方案选择或commit步骤。
- vendor静态指纹已核；`taskKind=feature` 为可测修复，自动使用锁定 `tdd`；`taskKind=delivery` 使用 `code-review`。来源 `49dd158d1076134a641b33efb035946536778336`，`vendorIntegrityVerified=true`。只读原文，按项目规定跳过setup/未vendored依赖与提交步骤，试点留痕合并本回件。
- Standards轴自查：四文件范围、既有API/同源/安全/错误契约保持，生成报告仅指定前缀；无上游/正式数据/共享产物/安装/服务/GUI/凭据/提交操作。
- Spec轴自查：整名编码、新旧分支、一次decode和纯sanitize、拒绝顺序均与专家合同对应；集成/底座继承和GUI未覆盖明确列出。工具未提供并行独立review子代理，本段是开发自查，不冒称两个独立审签角色。

## 释放与下一步

四产品文件已释放，无本任务运行进程。仅新增本前缀report/runner/index/selftmp产物；未写其他docs、共享lib、服务或git索引。

SOURCE修复和开发自验已交付，**独立AUTO/GUI/PASS仍待审；未标整个A13、RA-F01/04、用户完整上传旅程或全部积压完成**。专家依据这份patch、最终指纹、原始命令和请求观察复验；Main在接收释放后唯一冻建新A13、绑定产物/实例，沿GUI01/02/03原生picker→stage取消/主保存→重进→下载/hash继续采证。全部既有门闭合后才由Main普通commit；无push、新功能、发布或正式切换。

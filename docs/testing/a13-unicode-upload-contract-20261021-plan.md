# A13 中文文件名上传先行最小测试合同

> 给 Main 与限定开发使用：先读本合同及 cases，再按 red 原证修复；本专家只确证现有缺陷和定义复验，不实现产品、不判新 GUI 通过。平台 trae，独立测试专家 A13；实际执行日 2026-10-22，前缀按父派单保留 20261021。

## 1. 父派单与权限

负责人原句：

> 独立专家快速确证/先行最小测试合同：Main A11原生filechooser中文22byteQA文件原件.md实际fetchheaders非Latin1失败，尚未发HTTP。原A11/materials/native-files/chooser-selected.png/unicode-upload-failure.json/png/before-open/failure-boundary真实原件；计划docs/plans/2026-10-21-unicode-upload-closure.md。你只写docs/testing/a13-unicode-upload-contract-20261021前缀，禁止产品/GUI/build/services/install/credentials/commit。读AGENTS/collab/remaining旅程RA-F01/04，stage-client.ts/asset-route.ts/tests定位x-pm-file-name rawunicode，真实fetch/Request Headers构造白盒可自有tmp测红（不发网），已承诺中文名兼容ASCII守卫。限定最小编码/服务端解码契约、非法编码/双解码/旧ASCII/路径sanitize/类型及大小不放宽，先行plan/cases/red交Main给dev，不扩功能。独立F03/F01等已有AUTO结果不洗白新缺陷。完成释放。

- 本次仅新增同前缀 `-plan.md`、`-cases.md`、`-red.mjs`、`-red.json`、`-red.md`。不改其他专家文件、共享档案、业务字节或现有原证。
- 禁止产品/GUI/build/services/install/credentials/commit；不 fetch/pull、不新建 worktree、不触碰 profile/端口。不调用原生网络 fetch， `.invalid` URL 只供 Request 构造。
- 权限以本条明确范围为准，通用 build/完整回归/档案同步由 Main 后续处理，不在子任务中执行。依据 AGENTS §6A、collaboration §9、§11.1/11.3/11.5，开发、Main 采证与独立审签分离。
- 终点：确证缺陷、交出先行合同及可重放红例，然后释放；不接下一功能，不把红测交付写成产品完成。

## 2. 原证与候选

- 原始 A11：[原生选择](../../reports/all-pending-evidence-20261021/A11/materials/native-files/chooser-selected.png)、[页面 JSON](../../reports/all-pending-evidence-20261021/A11/materials/native-files/unicode-upload-failure.json)、[页面截图](../../reports/all-pending-evidence-20261021/A11/materials/native-files/unicode-upload-failure.png)、[之前](../../reports/all-pending-evidence-20261021/A11/materials/native-files/before-open.json)、[失败边界](../../reports/all-pending-evidence-20261021/A11/materials/native-files/failure-boundary.json)。全保留，指纹收录于 red.json。
- chooser 原件可见 `QA 文件 原件.md`、22 字节、已选中；页面 JSON 记录 3226 / 1440×900 / dark，报 `Failed to execute 'fetch' on 'Window': Failed to read the 'headers' property from 'RequestInit': String contains non ISO-8859-1 code point.`。这是已有 GUI 原证审阅，不是本专家重新操作 GUI。
- 源文件 `/private/tmp/pmtool-a11-native-files/QA 文件 原件.md` 实读 22 字节，sha256 `87ef7d4f570468db73bd600a35b913cba4f82d5101a4e559536ecab8cf472d1a`。前后 data/files/backups manifest 仅路径前导 `/` 口径不同，归一后完全一致；只证明记录覆盖根，不声称全盘。
- 当前基线 HEAD / 本地 origin/main ref 均 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`。dirty 候选另由 red.json 的 scope、trackedDiff、scopedUntrackedFiles、源码前后 sha256 认领；A11 candidate/patch/environment 原件指纹同时绑定。未认领 A13 bundle、运行服务或全仓候选。
- 当前定位：`stage-client.ts:68–89` 把 raw 文件名写入 `x-pm-file-name`；同域测试直接返回 mock Response，未构造真实 Headers。`asset-route.ts:69–80,153` 已有容错 URI 解码及 basename/control sanitize；不得再在前一层解码后重复调用现有解码逻辑。
- [剩余旅程](remaining-journey-cases-20261021.md) §4 RA-F01/04 与[原文件专项](materials-files-reports-independent-auto-20261021.md) §4 为上位合同。先前 RA-F01/03/04 AUTO 仅保留原执行范围，**未覆盖原生中文上传 Headers 构造，不能关闭本缺陷**。

## 3. 最小线协议

此处冻结可测试的编码选择，范围仅为既有文件名传递，不增加文件类型、入口或格式：

1. 新暂存客户端有非空文件名时发送 `x-pm-file-name: encodeURIComponent(fileName)` 及 ASCII 标记 `x-pm-file-name-encoding: uri-component`。完整文件名编码，包括 `%`、空格、`+`；不能仅替换中文、不能用 Latin1 转字节伪装、不能丢名改随机 ASCII 名。
2. 无文件名保持既有空名/缺名行为，不发一个空的已编码协议信封。body/Blob/signal、content-type、x-pm-media-type、same-origin/no-store、无 x-pm-task-id、201 信封保持原契约。
3. 服务端先判标记。`uri-component` 分支要求一个非空 ASCII 文件名头，严格 `decodeURIComponent` **恰好一次**；非法 `%` 或不合法 UTF-8、缺名、重复/数组形态、未知/空标记均 400 `invalid_request`，不回落原字符串或成功信封。此类拒绝在 collectBounded/stageUpload/attach 之前，DB/字节零写；认证 gate 仍先行。
4. 解码后进入仅做 basename/控制字符移除/trim/空名回落的 sanitize。拆分现有 decode 与 sanitize，禁止“先 decode 再调用仍含 decode 的 sanitize”。残余 `%2F`/`%2E` 是字面文件名片段，禁止递归解码。
5. **无标记的旧请求**沿现有兼容逻辑：旧 ASCII 原名及旧 URI 编码名维持原结果；旧 malformed-percent 容错也保留，随后仍受原 sanitize/类型限制。不把旧 ASCII 中的 `%`/`+` 当新协议，不新增旧请求编码要求。新标记的非法编码必须严格拒绝，二者不能混同。
6. 两路径共用 upload 路由的文件名解析：无 taskId 仍 stage；有 taskId 仍 attach 且同项目校验不变。不得为方便而改变 direct client、认证、存储 schema、GC、promotion、TTL 或下载实现。
7. 10 MiB = 10,485,760 字节上限；Content-Length 预检、流式累计、empty/abort、原扩展名/MIME/magic/UTF-8/活动文本检查、root/祖先/最终节点 symlink、防越界全部保持。原白名单包括 png/jpg/jpeg/gif/webp/pdf/md/markdown/txt/csv，不增加 html/svg/exe。
8. download 继续现有 RFC5987 `filename*=UTF-8''...`、nosniff/no-store、任务挂接/项目认证与精确原字节。文件名编码不得改内容 hash、size 或共享资产生命期。

## 4. 文件级开发与复验顺序

| 步骤 | 文件 / owner | 动作与验收边界 |
| --- | --- | --- |
| 1 | 本前缀 red / Main 接收 | 重放现有红例，核源字节和证据候选；当前出口 1 是真实缺陷，不能当设施全绿 |
| 2 | `client/shared/stage-client.test.ts` / dev | 先新增真实 Headers/Request 构造的 fetch 截断测试，测中文、特殊字符、旧 ASCII、body/signal/头不变量；禁止直接 mock 成功绕校验 |
| 3 | `core/http/asset-route.test.ts` / dev | 按 cases 用真实 upload handler 测编码/兼容/非法/一次解码及同等级 guard；适配器 only 不等真实存储集成 |
| 4 | `client/shared/stage-client.ts`、`core/http/asset-route.ts` / dev | 仅实现上述协议和单次解码，不改其他产品文件。非此范围需求或守卫语义分歧先回 Main |
| 5 | 新候选专项原证 / 独立专家 | 重认领四文件及依赖指纹，复验 cases 的 AUTO，并核 RA-F03 原守卫可继承/需重测项；不沿旧 PASS 宣告新修复绿 |
| 6 | build/instance/GUI / Main 唯一 owner | 新构建与实际下发绑定后按 RA-F01/04 采原生 chooser→stage→cancel/remount、主保存→重进→授权下载/hash；不得拿旧 A11/A12 运行实例证明新代码 |
| 7 | 最终审证 / 专家 | AUTO 与 GUI 分开判，全部剩余门沿总登记，不发布/提前 commit。Main 负责共享档案和开发接续 |

后续受影响范围：客户端文件名头 → RA-F01/02/J03 的入口；服务端解析 → RA-F03 安全、F01 暂存/直挂；下载未改但中文真实上传来源需在 RA-F04 新链路接续。旧底座 AUTO 不全部抹掉，也不洗白新缺陷。

## 5. 当前交付状态

- [cases](a13-unicode-upload-contract-20261021-cases.md) 已先行冻结；[red](a13-unicode-upload-contract-20261021-red.md) 记录三红三对照及完整命令/边界。
- 缺陷 **A13-U01：FAIL / 确证，尚未修复**。三条红例同一根因，不计成三个独立缺陷。
- 服务端新协议、安全接缝复验、新 GUI、构建与最终整门均 **NOT_RUN**。不因本次不允许 GUI 而改成 MANUAL_PENDING。
- 本次合同交付结束，交 Main 给限定 dev；本专家释放，无运行中的本任务进程，不继续产品/GUI/服务或下一功能。

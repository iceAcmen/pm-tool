# A13-G03-STAGE-SYMLINK 限定开发交付

本报告给 Main 与独立测试专家核两文件候选、原始退出码和覆盖边界；是开发自验，不签独立 PASS。实际执行 2026-10-22，前缀沿父派单保留 20261021。平台 trae / 开发。

## 派单与范围

负责人原句：

> 开发限定修确证A13G03STAGESYMLINK，先读AGENTS/collab/独立docs/testing/a13-unicode-upload-independent-retest-20261021-selftmp/report.md/audit/additional-results及新docs/plans/2026-10-21-staging-symlink-closure.md。你独占core/file-staging.ts和同域newtest，reports/a13-staging-symlink-developer-20261021前缀。复用既有file-root resolveWithinRoot祖先/根/子路径保护，root/ancestor/staging symlink route实际拒零write，正常stage/direct/opaqueid/ttl/readconsume/cancel/finalize不改，共享asset不得外删。不可改stage-client/asset-route（已unicode修后释放）/file-root/store/task/panel/globalconfig。必要不同文件先回Main工程事实，不自扩。自有freeze/no-cache旧3红/新绿+生命周期回归/noemit；不install/build/sharedlib/GUI/services/credentials/其他docs/commit。独立原负例目标都selftmp，严禁复跑写正式路径。MainA11/A12旧树继续GUI，仅主src修改下一A13唯一build。报告完整hash/exit/边界并释放，不自签独立。

已读上述合同、独立原证及最新接续档案。按本批明确限制，不执行通用 SOP 中的 fetch/pull/install/build/全 verify/其他档案同步/commit；不继承 Main 的 GUI、整包构建或服务权限。

可写产品文件仅：

- `packages/dsh-pm-tool/src/core/file-staging.ts`：复用现有 `file-assets.ts` 的 `resolveWithinRoot`，保护暂存目录、bin/json/tmp 路径与读/删除边界。
- `packages/dsh-pm-tool/src/core/file-staging-symlink.test.ts`：新增同域开发回归。

其余写入全在本报告前缀。独立 `docs/testing/` 只读；未改 stage-client、asset-route、file-assets/file-root、store、task、panel、配置、vendor、依赖或 git 索引。

## 实现与冻结

暂存层在根解析前检查当前生效的 explicit / isolated / profile 路径，避免根解析器的 `mkdir` 先穿过链接创建缺失子目录。优先级照既有规则，实际解析与生产无配置 fail-closed 仍由原 resolver 决定；无新增配置。

创建 staging 前与创建后分别检查目录/最终子节点；写前检查两个 tmp 路径，rename 前复查最终路径。load/prepare/consume 通过已保护路径；expire/cancel/finalize 清理前检查 bin 与 sidecar。sweep 先检查整批 bin/json，不能将链接误当损坏元数据或孤儿文件删除。正常字节、MIME/10MiB 守卫、15分钟 TTL、ID 形式、prepare 保留与消费/取消幂等逻辑未改；不调用共享资产 GC、不增添资产外删。

基线 HEAD `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` 只是基线，不代表脏树候选。开工旧 staging SHA256 `57f95fb58c0315bab73b568b205670e425707ba0fd10a38168f17399815e30db`。

| 自有源码 | 最终 SHA256 |
| --- | --- |
| `core/file-staging.ts` | `3c643d5a47beeccad22908bb2c57a0d9d415b72243a169540ffa9638dc6f8e81` |
| `core/file-staging-symlink.test.ts` | `3e48dedb7f9dec655cbfd9e7e00edc488a971f4b0a6182a56681212a79209f26` |

[old-freeze.json](a13-staging-symlink-developer-20261021-selftmp/old-freeze.json) / [candidate-freeze.json](a13-staging-symlink-developer-20261021-selftmp/candidate-freeze.json) 保留完整 src 指纹、四配置、tracked patch、新文件清单；[file-staging.patch](a13-staging-symlink-developer-20261021-selftmp/file-staging.patch) 为本改动补丁，新测试全文在主 src 与冻结树。独立 G03 副本仅将原件读路径替换为自有 `original.md`，断言/步骤/预期不改；原件22字节 SHA256 `87ef7d4f570468db73bd600a35b913cba4f82d5101a4e559536ecab8cf472d1a`。

## 执行与结果

运行环境：macOS arm64，现有 nvm Node `v22.23.3`、Vitest `2.1.9`、TypeScript `5.9.3`；未运行 pnpm（约定版本11.28.5）。依赖只读链接 `/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules`。HOME/TMPDIR/TEMP/FILE_ROOT/原子测试根为本前缀 selftmp；所有 symlink 目标均在各自自有临时目录，不写正式路径。

仓库根实际执行命令：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node packages/dsh-pm-tool/scripts/verify-external-skills.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a13-staging-symlink-developer-20261021-run.mjs freeze-old
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a13-staging-symlink-developer-20261021-run.mjs red
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a13-staging-symlink-developer-20261021-run.mjs red-new
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a13-staging-symlink-developer-20261021-run.mjs freeze-new
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a13-staging-symlink-developer-20261021-run.mjs green-g03
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a13-staging-symlink-developer-20261021-run.mjs green-new
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a13-staging-symlink-developer-20261021-run.mjs noemit
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a13-staging-symlink-developer-20261021-run.mjs regression
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a13-staging-symlink-developer-20261021-run.mjs finish
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a13-staging-symlink-developer-20261021-run.mjs finish-r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a13-staging-symlink-developer-20261021-run.mjs finish-r3
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a13-staging-symlink-developer-20261021-run.mjs release-owned
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a13-staging-symlink-developer-20261021-run.mjs index
git diff --check -- packages/dsh-pm-tool/src/core/file-staging.ts packages/dsh-pm-tool/src/core/file-staging-symlink.test.ts reports/a13-staging-symlink-developer-20261021-run.mjs
```

| 命令 | 退出码、关键结果 |
| --- | --- |
| verify-external-skills | 0，注册 vendor 文件 SHA256/bytes 符合 manifest；不是独立门 |
| freeze-old / freeze-new | 各0，复制前后 src 一致，依赖不安装、输出不构建 |
| red | Vitest exit1 / runner exit0（验证预期红）：3红/4绿/10过滤未跑；三stage入口201越声明根 |
| red-new | exit1：36红/4绿，开发追加40项修前对照原件保留 |
| green-g03 | exit0：7/7，原三stage400/rejected，DB及链接目标零写；四direct保持400 |
| green-new | exit0：40/40，根/祖先/staging/bin/json × 七生命周期动作，三根来源缺失子目录零写，以及正常TTL/重试/单次消费/取消/共享hash保持 |
| regression | exit0：13文件208/208；原11文件171项 + 独立追加17项 + 十类型stage/direct20项，无过滤未跑 |
| noemit | exit0：冻结原tsconfig `--noEmit --incremental false`，stdout/stderr空，无产物写入 |
| finish / finish-r2 / finish-r3 | 各exit1，非自有源并发变化使全树核对不成立；全部失败快照保留，未改测试 oracle |
| release-owned | exit0，仅两自有文件释放；core/shared/config与已测冻结一致，非当前整树放行 |
| index | exit0，两自有源hash再次核对，报告/runner/完整原证hash索引落盘于同前缀index.json |
| git diff --check | 0，本批 tracked diff 无空白错误 |

每个测试/noemit 子进程的绝对 argv、cwd、白名单环境、start/end、真实exit/signal、完整stdout/stderr及hash见 selftmp 同名 `.json`。所有 Vitest 采用 `--no-cache --maxWorkers=1 --minWorkers=1`；208与40为不同测试集，7项G03已含在208内，不重复计成255项独立覆盖。

[audit.json](a13-staging-symlink-developer-20261021-selftmp/audit.json) 及后续 audit-r2/r3 保留新旧 G03 逐请求record路径/hash、状态、bodyReads、payload、DB/磁盘差异与旧真实bin字节。旧三红均实际新增22字节同hash，未清理；新三例均400、bodyReads=1（路由原先先读取合法body）、before=after。请求/res/gate为受控适配，真实生产routes/JSON domain/字节落盘执行；不冒称宿主真认证或GUI。

## 并发事实与释放

终核时其他任务新增 `commands/task-import-filename.test.ts`，后又变化 `commands/task.ts`、`client/views/tasks.tsx`、`client/views/tasks-import-confirm.test.tsx`。未修改/回退任何非自有文件；这些差异的冻结/当前完整hash见 [release-owned.json](a13-staging-symlink-developer-20261021-selftmp/release-owned.json)。先前误解释“新test在candidate里”已更正于 [finish-r1-error.md](a13-staging-symlink-developer-20261021-selftmp/finish-r1-error.md)；实际它在冻结后新增。三个全树核对失败不是本修复自验失败，也不被删除或改写为0。

释放时两自有文件、全部core/shared模块、配置与被测冻结一致。独立原目录/计划、全可达依赖内容和所监视 `lib/data/assets/files/backups/包assets` 最后审计均未变化。Node API guard 六次run记录 denied=0；noemit写操作0。guard不是OS sandbox，exit回调不保证每个worker完整日志，不声称全盘/所有用户数据零写。

**两文件所有权已释放；未自签独立，未签当前整树。** 当前Main整树存在未纳入本冻结的其他task import变化，故noemit/208回归只认本candidate；Main需合并认领最新源后唯一A13build/当前整树回归，不能拿旧A11/A12实例或本类型检查当新产物已激活。

未install/build/读写共享lib/GUI/启动停止服务/profile切换/凭据处理/其他docs写入/commit/push。原native chooser GUI、原生取消/保存/重进/下载字节、RA-F01/F04和整个A13仍待Main按专家合同采证及独立判定。未覆盖敌对并发inode交换/TOCTOU、OS权限全矩阵、随机ID的tmp节点注入或全部跨项目GC；沿用既有resolveWithinRoot检查强度，不宣称新增OS级原子隔离。

## 方法记录

采用已批准收口计划的三步文件级执行，不另写plans。vendor完整性已静态核对，mattpocock锁commit `49dd158d1076134a641b33efb035946536778336`；taskKind=feature（可测修复）参考tdd，delivery参考code-review。实际作用是先保原三红、再检查正常/安全边界与工程范围；不调用缺失skill/setup、不联网、不将方法自查当独立测试。无可用子Agent调用，双轴review由本开发按项目规则/批准方案自查，不伪称独立双人review。

下一步仅由独立专家复验这两份hash及同域负例，Main接下一A13唯一构建与原GUI旅程；本角色不扩文件、不继续新功能。

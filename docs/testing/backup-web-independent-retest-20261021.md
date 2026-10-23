# 网页备份接缝独立复验结论

> 给 Main、负责人及后继专家使用。2026-10-21，trae，独立测试角色；仅签冻结 SOURCE/AUTO。真实装载与 GUI 未采，**整体门 BLOCKED，不签整 dirty 或发布**。

## 结论

- **MFR-B-02 / RA-F07：SOURCE/AUTO PASS，旧假预检关闭。** content 可识别 schema/关系/越界先拒；含附件明确“未检验侧车字节、需本机完整路径”，不假称成功。路径演练/确认同级校验缺包、缺字节、hash、实际 size/mime/canonical relPath；失败全表、数据和字节零写。
- **MFR-B-01 / RA-F06、RA-J06：SOURCE/AUTO PASS，批准的本机路径接缝关闭。** 原 F5 完整 JSON+侧车经真实 PmPanel→真实 handler 演练→两次确认后，十三业务表、稳定 ID、共享附件、三修订/软删、双22字节恢复一致；JSON-only F5仍诚实拒绝，F3/legacy无附件兼容。**RA-J06完整 GUI 仍 NOT_RUN，不因路径 AUTO成功签 GUI关闭。**
- 新 panel 导致旧 bridge 证据受影响，本轮重跑路径5、真实 launch5、bridge23及原独立追加14，**47/47**；未继承旧 panel hash 下的 PASS。
- 最终同一冻结源 **99/99 两轮、各 exit0**；全新 Node 读回 **exit0**。没有当前产品 FAIL。首轮98/99是一条自有菜单动作遗漏，纠正仅自有探针，旧红保留。

## 候选与证据

父授权和批准方案：[父执行记录](../../reports/all-pending-acceptance-execution-20261021.md)、[closure计划](../plans/2026-10-21-backup-web-closure.md)。原 FAIL：[MFR终报告](materials-files-reports-independent-auto-20261021.md)、[findings](materials-files-reports-independent-auto-20261021-findings.md)、[GUI交接](materials-files-reports-independent-auto-20261021-gui-handoff.md)；本轮不改它们。

基线产品 `2a7603023bc54ef13d788e50069ee3fde4671bf3`，HEAD `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，加本轮 [tracked.patch](backup-web-independent-retest-20261021-evidence/tracked.patch) / 新文件清单 / 实际源指纹；HEAD、version不是 dirty身份。全src、声明、只读依赖、原/复制fixture身份见 [candidate](backup-web-independent-retest-20261021-evidence/candidate.json)，自有生产编译见 [产物清单](backup-web-independent-retest-20261021-evidence/compiled-output.json)。没有 pack、宿主、PID/端口、认证、功能开关/GUI上下文认领，未使用 Main旧lib。

| 文件 | 本轮 SHA256 |
| --- | --- |
| commands/backup.ts | `48369dafe70023bce1ebdf5a82d7b2475627ea6d6b58036187c8845491cf8cdd` |
| core/backup.ts | `a4c302bd7646478deb56a61070b4a50262c1b220805f2013a036c2d5b0870295` |
| commands/backup-web.test.ts | `d7d79c55d839fcab6b3c9a3f45350e62c44f2488deccc990d96b902fa8bac6ce` |
| client/panel.tsx | `a8c00f81e3f4240b33cc18545a91bda1f7d8f60e6d4f48f27e1395ad5b47804b` |
| client/panel-restore-path.test.ts | `82ae2401311a588358969f201ecb01984d12e99b1b317ea0ace5e19ffdead805` |
| client/panel-launch-handshake.test.tsx | `f338a24048fed1a43fa96847a9e5525f2601958da1c6b30a1269a77ddac2cb2b` |

原F5 JSON `8f9bf659a59077af3753900b9fec43dbca752673e59516d025f649a1982f8b4c`、expected `b2af85cd52e9a6c773d5418dfd7891d392b4c40883600cc57e52c08581055bb6`；全侧车复制/最终指纹相等，不删metadata、不重造fixture。全源和声明前后无漂移；源码实际冻结在本前缀selftmp。Main A7红绿与开发final-8、MFR原件逐字节归档 [索引](backup-web-independent-retest-20261021-evidence/external-original-archives.json)，只支持其各自范围，不把作者结论当专家结果。

## 执行结果

环境 macOS arm64、nvm Node `v22.23.3`，现有 pnpm11.28.5依赖只读链接；无 install、整包build、sharedlib或service。真实 Cordis Context + Storage + JsonStorageBackend + DomainFacility +生产schema；故障仅原 BackupWriteHooks。真实 PmPanel/ConfirmHost/hooks，替身仅 browser环境、FileReader读取与宿主传输adapter。adapter同生产index语义：error抛错，success返回text，不mock panel/confirm，不冒充宿主dispatch/浏览器GUI。

| 实际轮次 | exit / 断言 |
| --- | --- |
| current-compile，自有生产 tsc | 0 |
| current-backend，28专项+precheck5+mid-rollback1+file-backup9 | 0，43/43 |
| current-panel-bridge，路径5+launch5+bridge23+独立14 | 0，47/47 |
| current-seam，独立真实面板→handler | 1，8/9；取消后菜单未重开，非产品失败 |
| current-reopen | 0 |
| legacy-backend，原52707c/eb27ed + 同新测试 | 1，17绿/26红；MFR-B01/B02均实际success≠error红 |
| legacy-panel，旧eebdc2 + 当前路径/launch测试 | 1，5绿/5红；旧无路径入口5红，launch5绿 |
| current-stability，纠正前原件 | 1，98/99；同菜单设施遗漏 |
| current-r2、current-r3，纠正菜单一步后 | 各0，99/99，0 pending |
| current-r3-reopen | 0；新PID57394/父57352，十三表全字段及双字节精确等于expected，读取目录不变 |

全部真实 argv/cwd/隔离环境/start/end/exit/signal/stdout/stderr指纹：[首轮commands](backup-web-independent-retest-20261021-evidence/commands.json)、[最终commands](backup-web-independent-retest-20261021-evidence/followup-commands.json)。最终逐用例 [r3 JSON](backup-web-independent-retest-20261021-evidence/current-r3.vitest.json)，新进程完整表/字节/清单 [原stdout](backup-web-independent-retest-20261021-evidence/current-r3-reopen.stdout.txt)。不是整个插件回归。

复现实行命令的 cwd 为 `docs/testing/backup-web-independent-retest-20261021-selftmp/frozen`：

```sh
node node_modules/typescript/bin/tsc -p tsconfig.qa.json
node node_modules/vitest/vitest.mjs run --config vitest.qa.config.mjs --no-cache --maxWorkers=1 --minWorkers=1 --reporter=default --reporter=json --outputFile=/Users/bytedance/Projects/dsh-pm/pm-tool/docs/testing/backup-web-independent-retest-20261021-selftmp/current-r3.vitest.json src/commands/backup-web.test.ts src/core/backup-precheck.test.ts src/core/backup-mid-rollback.test.ts src/core/file-backup.test.ts src/client/panel-restore-path.test.ts src/client/panel-launch-handshake.test.tsx src/client/launch-handshake.test.ts src/client/bridge-panel-independent-retest-20261021-additional.test.tsx backup-web-independent-retest-20261021-seam.test.tsx
node reopen.mjs
```

这些命令所需 `NODE_OPTIONS/QA_OWN/QA_AUDIT/PM_BACKUP_WEB_TMP/PM_BACKUP_FIXTURE_DIR/QA_REOPEN_TARGET` 完整原值在最终commands；不可去掉环境在正式目录运行。执行器/复跑器使用结构化生成输出，手写仅本前缀文件。

## 边界与反证

- 空路径按钮disabled；doublequote/CR/LF前端拒，tab/NUL通过真实后端拒且零写。空格、apostrophe及字面反斜杠路径原文双引号token成功，不以JSON.stringify(path)当shellescape。后端onekind支持含doublequote的单引号token；前端全部doublequote拒是**安全可接受子集**，不签前端支持后端全集。两kind、断token、尾拼接/额外confirm拒零写。
- 演练→取消、dialog取消零写；第一次确认只开dialog、不发confirm，第二次才执行原路径；预检失败保输入、无成功preview。预检成功后sidecar外部损坏，confirm重新完整预检拒绝、保preview、DB/files不变。**合法包外部替换不做preview摘要锁定**，本批准合同没有新协议，不声称此竞态已解决；Main如要绑定确认前同一包需另核范围。
- 回滚覆盖合法十三表前态、共享A保留、仅目标B新字节撤销、表写/字节提升一次故障、安全快照完整可预检；安全快照是允许新增，不写“全根零写”。旧包保extra/file_assets字节，sessions/checks不入备份。保Key不读/复制凭据，不新增上传/内嵌bytes。
- 共享 `.vite/vitest/results.json` 前后均 `3985a9b4ef3eee5228c1d45e53efca59587bf329cd9d3505856fc444fc109019`。Node函数写根审计无denied，作用域是所拦截Node操作，不是OS sandbox/整盘零污染；没有查看正式业务/private根。
- 证据校验首轮143绿/1红是把独立追加测试也当原产品src比较，后改逐项核原候选及单列新增设施，不改产品；原失败在 `evidence-check-pre-report.json` 保留。菜单纠正原探针/指纹保留，旧红和新绿不覆盖。
- 原证校验159/159、exit0：[final检查](backup-web-independent-retest-20261021-evidence/evidence-check-final.json)；追加live源码/声明检查最终165/165、exit0：[live-final](backup-web-independent-retest-20261021-evidence/evidence-check-live-final.json)。10426次所拦Node写操作全部在自有根、0denied。校验含源码/声明/fixture、stdout/stderr、原件归档、逐用例数、syntax及vendor，不构成额外产品GUI PASS；收尾无本前缀运行中进程。

## 交给 Main

Main按本轮六源指纹与完整candidate同步新A7，唯一build、重新绑定实际下发/插件宿主/实例/开关；按 [本轮计划](backup-web-independent-retest-20261021-plan.md) 和原GUI交接采实际路径label/input→完整预检→cancel清单→再预检→第一次按钮→第二危险dialog→真恢复→重进records/growth/tasks→下载双hash，错误/保输入/原库清单及完整args/exit/逐态截图或录像。GUI源码变化则重认领并重测受影响证据。

本角色真实GUI/样式/体验/宿主认证/下载/发布binary/全量verify均 **NOT_RUN**；缺装载和完整GUI使整门 **BLOCKED**，不转MANUAL_PENDING，不授权提交/发布。只写指定前缀，未改产品/其他testing/livingdocs、shareddeps/lib、服务、MainGUI、私有配置/credentials或commit。

Skill：writing-plans收窄为本次测试计划；vendor静态门exit0、13文件逐指纹相等，`vendorIntegrityVerified=true`，锁49dd158。delivery自动code-review仅作标准/合同两轴自查，不执行setup/install/commit，不把它当PASS；当前无子代理调用工具，未伪称双代理。标准轴未发现本角色越界；合同轴只认本次SOURCE/AUTO，GUI与合法外部替换摘要锁明确未覆盖。此记录并入本前缀，不写其他试点目录。

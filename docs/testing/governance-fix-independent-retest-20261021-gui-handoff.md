# 修后 F6 标准包与 Main 采证交件

> 2026-10-21，trae，独立测试专家。只交fixture与既定步骤，不执行GUI；有限AUTO PASS不等GUI或整门PASS。

## 1. 使用修后包

标准包、sidecar目录、ids、expected均位于：

`docs/testing/governance-fix-independent-retest-20261021-evidence/run-2ACog5/green-corrected/`

| 字段 | 值（相对上述目录） |
| --- | --- |
| `path` | `F6-ui-standard/pmtool-backup-2026-10-21T14-08-30-668Z.json` |
| `sha256` | `c786212c1a5b0023d4a5b8e75b32ed4f4c3dde192b9b0e3901eeb857c1490035` |
| `sidecarPath` | `F6-ui-standard/pmtool-backup-2026-10-21T14-08-30-668Z.json.files.b32d49ce07d04d7a` |
| `fileBundleId` | `b32d49ce07d04d7a` |
| `idsPath` | `F6-ui-ids.json` |
| `expectedPath` | `F6-ui-expected.json` |
| `sourceFixturePath` | `F6-backup/pmtool-backup-2026-10-21T14-07-54-031Z.json` |
| `sourceFixtureSha256` | `cf67c2734ee82f9fb02759a8317232cfbe14cd7f7a327159f4ae9af7e5eef3b3` |
| `referenceCount` | `10`，六update+四create，唯一table/id，全部basis |
| `precheckMethod` | 生产 `precheckBackupFile` 实际路径与合法schema/关系/sidecar |
| `emptyTargetRestore` | 全新空目标生产restore，完整领域字段相等；只归一化exportedAt/fileBundleId |

`F6-ui-standard.json`记录**selftmp原路径**，归档副本实际路径按上表解析，不混用已归档父路径。新增字段是交件元数据，不修改产品schema：sourceFixturePath/sourceFixtureSha256/path/sha256/sidecarPath/fileBundleId/idsPath/expectedPath/referenceCount/expectedCreates/precheckMethod/emptyTargetRestore/runtimeUndoNotPortable/sessionsNotInStandardBackup。索引包含标准包与完整sidecar的sha/bytes。

绝对标准包路径（macOS，Main仅在已授权隔离实例内预检/确认）：

```text
/Users/bytedance/Projects/dsh-pm/pm-tool/docs/testing/governance-fix-independent-retest-20261021-evidence/run-2ACog5/green-corrected/F6-ui-standard/pmtool-backup-2026-10-21T14-08-30-668Z.json
```

## 2. ID 与合法内容

项目A=`p-0001`，来源任务一=`t-0001`，来源任务二=`t-0002`；跨项目B=`p-0002`、任务=`t-0003`。四update旧来源为`m-0001/ri-0001/dlv-0001/mtg-0001`；四create真实新ID：

| table | newID | 生产确认 step |
| --- | --- | --- |
| milestones | `m-0002` | s7 |
| risk_issues | `ri-0002` | s8 |
| deliverables | `dlv-0002` | s9 |
| meetings | `mtg-0002` | s10 |

ID来自实际生产confirm/dispatch落库及undo postimages，非预灌来源。F6-gateway-draft.json有固定adapter完整流、生产parse 10 actions，F6-nonempty-ledger.json有10refs；F6-created-records.json/命令原证可复核。这里只列本包ID，不据此写死其他轮ID。

保留来源任务一真实link attachment `at-1`；进展`pl-1`三版（首/二/三），`pl-2`两版且deletedAt软删；refs与材料/history字段完整。`F6-ui-expected.json.preservedMaterials`给完整JSON，不改合法fixture为“容易通过”的空材料。2项目/3任务、四扩展各2、3settings；reports/file_assets均0，不充固定报告或共享文件字节门。

session不入标准backup，其原库新进程回读单列。内存undo handle不可跨进程恢复，包内ledger handle仅历史；GUI undo旅程必须在Main本轮合法重新确认后取新handle。旧F6缺四create只能作为旧红证，不能作修后PASS。

## 3. Main 下一动作

保持原 `governance-growth-independent-auto-20261021-gui-handoff.md` 的32 ID既定步骤，不新增设计门。先绑定本报告最终10生产文件hash、Main实际bundle/实例/开关/数据根/PID/端口/浏览器及本包hash；若源码不一致先复核受影响范围。

F6在Main授权**空隔离目标**使用生产路径预检，cancel保原库，再预检/confirm及危险确认；保存真实前后库、原控件动作、返回与持续页面证据。来源台账按kind展开/四个create各跳真实实体；正常改来源一→changed/重校/history追加，合法删来源二→missing/拒错误导航/两次history保留。不得手工补refs或关闭守卫。

clean/mixed/外改/失败恢复仍按原AI04合同生成该实例合法计划、explicit confirm及actual handle，不能使用标准包过期handle。GG-01..04本专家仅SOURCE/AUTO关闭，GUI需Main原证与独立审签。

32 GUI目前NOT_RUN；真实单模型Main未跑记MAIN_NOT_RUN，不转MANUAL_PENDING。完整资料/文件共享字节、其他功能GUI及Main整dirty候选不由本交件签字。

# F1 / FL 新合法样本 R3 准备

2026-10-23，trae，Main。按[原总登记§4](../testing/remaining-acceptance-register-20261021.md#4-fixture-总账)、[生产API定位](2026-10-23-f1-fl-production-schema-r3.md)，新建可重建样本，不伪造缺失的历史原包。父已授权本轮现有功能采证及合法fixture准备。

## 文件与真实写面

- 新`docs/plans/2026-10-23-f1-fl-fixture-r3-*.mjs`和`reports/all-pending-evidence-20261021/F1FLFixtureR3/`：只准备合法样本，保存API返回、别名/真实ID、逐字段/日期/人员预期、标准JSON/空资产侧车、生产预检/恢复与真实outer收据。
- 专用新tmp `/private/tmp/pmtool-f1-fl-fixture-20261023-r3` 的隔离JSON domain、files/backups/安全快照/cache；绝不写当前3269/原OP/正式业务，不启服务、不整build。
- 沿 CombinedF02RepairR2冻结lib的生产API，记录其git/candidate/source与必要模块SHA，当前gantt开发不共用输出。后继新候选未变core的继承由独立专家审，不把旧lib视作修后显示。

## 新F1R3工程认领

- A24平面：todo8/in_progress6/blocked2/done7/wrapped1；B2另两todo，实际ID/code由API返回。
- 甲13项：todo4/in_progress3/blocked1/done4/wrapped1；乙9项：todo2/in_progress3/blocked1/done3；未分配2项todo。
- D实际本地今天；甲T01 start D-31/update D-8/progress20/due D-1；甲B01 update D-4/due D+7，blocked建议不被逾期先吞；乙B02 due D-1；T02和未分配T07 due D；其余open due D+7。done/wrapped不催办，wrapped非done。
- 基线人物page open8/6/2、默认阈值5、maxX10；board全部四段共享MAX13。两者不同公式分别交原证，不统一改口径。

## 合法历史与FL后继

1. Main正常真实addProject/addTask生成26行，保存每次payload/实际record；collectBackup后仅新历史包准备createdAt/updatedAt连贯历史。
2. `precheckBackupContent`与`restoreBackupFromContent`实际执行；无file资产仍经生产完整预检。再createBackup→precheckBackupFile封标准包；没有直接put或改runtimeJSON。
3. FL独立domain正常恢复本F1包，再用真实update长title240/description2000/长姓名保三分组，真实材料link200/note500、多修订content2000/author80及同项目meeting/deliverable/OKR/habit各20记录。生产上限失败交真实差异，不能写非法库。
4. FD20人员为另认领variant，保A24五态，实际重新计算人员预期；不沿用两人MAX。不把FL和FD与OP树混入F1。

本准备结果是Main生成/预检事实，不能自签产品PASS。后继GUI经新隔离候选标准恢复，由Main按原people/长密合同采证、独立专家裁。无产品改动、push/tag/release/正式切。

# 人员 FD / 图轴有限 GUI 与姓名源审证 r1

日期：2026-10-23；独立原证审证：trae。Main 唯一 GUI/整 build。本角色只读封件，仅写本前缀和自有 `/tmp` 内置 reader；本单替代 SOP 的 fetch/install/build/living docs/git。追加姓名源审仅读已封旧两源、差异、收据，未读当前产品树、后继轴源或活库，未运行产品/schema/tests/浏览器/网络。**本角色 STOP / released 仅在最终 readback 实际 status0、收据写入并回读后生效，不表示父任务通过。**

## 1. 独立结论

**四宽 FD 姓名串槽及外层横滚 FAIL；1440 FD 图轴窄列、标题纵排、姓名/数字/刻度相叠另 FAIL。** 最小合同已早发，后续精确追加见 [合同 §5](people-fd-axis-gui-timed-20261023-r1-minimal-repair-contract.md#5-精确追加允许范围负责人后续明确授权)；不以 Main metric 作独立目视或根因证明。

| 原 ID / 有限断言 | 结论 | 原证与范围 |
| --- | --- | --- |
| `RA-V-people-1440-dark-100-dense` / 姓名不串槽、外壳无二维横滚 | FAIL | top/expanded/scroll PNG；姓名横穿负载条、OPEN、日期/状态；横向滚条属于人员外层而非单独排期内滚 |
| `RA-V-people-1024-dark-100-dense` / 同上 | FAIL | expanded/scroll PNG；长姓名串槽、事实列受挤、底部外层横滚 |
| `RA-V-people-768-dark-100-dense` / 同上 | FAIL | expanded PNG、帧53；姓名串到 OPEN/日期并越出行，负载构成标题被挤成纵列，底部外层横滚 |
| `RA-V-people-390-dark-100-dense` / 同上 | FAIL | expanded/scroll PNG、帧78；姓名压到数字/日期并越出卡，底部外层横滚 |
| `RA-V-people-1440-dark-100-dense` / 图轴文本可读与不重叠 | FAIL，另红 | `fd-axis-final-visible-r2.png`、`fd-axis-horizontal-r2-3.jpg`：团队分布卡极窄、标题纵排，点姓名/数值溢出，刻度与文字相叠 |
| 上述四原 ID / 未分配行展开两项、浏览无业务写 | PASS，有限子断言 | 每宽 expanded PNG 和页面态；任务 code7/8、原 `t-0007/t-0008`，随后收起/滚动；81帧无RPC请求，12态根/原始业务字节一致 |
| FD 数值/原件一致性，不含视觉可读或全阈值 | PASS，有限审证 | 合法备份、七主表生产 snapshot/原始实体一致；开放14负责人各1、未分配2、总16；20姓名不是20开放行 |
| 姓名修复 SOURCE / 原 `.pp-name` 单处差异 | PASS，有限源范围 | 封存旧源+原diff核算新字节；57B、CSS新SHA匹配；原TSX全文不变，完整DOM姓名及事件来源未改 |
| 姓名批原人员/scale AUTO 两文件五用例执行 | ADMISSIBLE，原执行记录5/5 | 真实开发子进程status0、配置/收据/原stdout/stderr指纹；不是本角色独立重跑，也不是姓名CSS呈现或RA-P1006 AUTO PASS |
| 姓名修后 GUI、后继轴 SOURCE/GUI | NOT_RUN / 后继不属本单 | 旧封件运行旧CSS；不得把旧坏图或姓名SOURCE移作轴后继通过 |
| 整 `RA-P1006` / 同MAX10 / 整页面格 / 其余AUTO / native200 / 浅格 / 父commit | 不签；原缺证保持NOT_RUN | F1/FL旧有限PASS及姓名FAIL留原报告；本FD轴是MAX8，不补MAX10，全格更多状态未跑 |

依据：原 [旅程单 §6.1 people](remaining-journey-cases-20261021.md#61-页面矩阵)、[F1/FL/FD 总登记](remaining-acceptance-register-20261021.md)、[RA-P1006 治理单](remaining-governance-cases-20261021.md)、[fixture r3](f1-fl-fixture-integrity-20261023-r3.md)、[F1/FL原报告/合同/readback](people-f1-fl-gui-timed-20261023-r1-report.md)及 collaboration §9/§11。上表只签明确子断言，不新增 ID/设计/矩阵；四个共享预期已有失败，但四个整格未完成，不能记整格PASS。

## 2. 封件与身份

| 原封件 | 实际成员核验 | 索引 SHA-256 |
| --- | --- | --- |
| [TimedPeopleFDR1](../../reports/all-pending-evidence-20261021/TimedPeopleFDR1/index-r1.json) | 1848/1848，大小/SHA无不一致、无符号链接 | `0a7083032a656c00198411db370714c5a1d118aadffcc4d2f5dca71c93a14421` |
| [TimedPeopleFDAxisR1](../../reports/all-pending-evidence-20261021/TimedPeopleFDAxisR1/index-r1.json) | 595/595，同上 | `c2c3f6c4d0115967a85d76510006901f1e43ad85dd7021442d639758a79f9309` |

两目录未入索引的仅各自 index/seal，均实际回读。FD seal SHA `1d2b8893e7813074b18514a1ea7bab66910c2047719a4930fceb024aaebe9570`；axis seal SHA `24aae62e33a5e227569b2cbf6e9f9a301cf530986ece8c804a7cf2df8630d0ad`。Main outer短ID `32d.../88dd...` 与status0来自负责人移交，封件未含该outer原收据，**不冒充本角色核到了原outer**；本角色另交自己的实际outer。

candidate/source-files/complete-inputs/built-artifacts 在两包及原F1包逐字节相同；activation两包相同。旧 `CombinedF02RepairR2`、baseline `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`、v0.7.4、Main、源登记124/完整输入525。455项产物声明与Main `actual-runtime-artifacts-check.verified`逐项相同；只比封存元数据，不打开private/lib，不把登记数当实际当前全树审源。

原host-start/ready绑定3270、PID53831、timeOrigin `1792721533243.5`。17态origin/timeOrigin一致，真实viewport `1440/1024/768/390 × 900`、DPR2；body `data-ds-dark-theme` / `rgb(21,21,23)`及真实图为深色、基准CSS100、帧pageScaleFactor1。没有菜单原生缩放证据，不把DPR2当native200，不计浅格或新L8/后继激活。

## 3. 原动作、字节和目视边界

FD原标准包实际1061218B/SHA `5eaf296ca3f091b23d4e8ddcfa41ac2492cdacfe8f70c325a4dee795bbb9231d`，与fixture r3实际备份字节相同。A24/B2、五态8/6/2/7/1、A open16；A20个distinct姓名各80字符，14人各open1、未分配2，其余姓名只在已完成任务中。原数据刻度`[0,2,4,6,8]`、中位1、阈值5；本次图轴可读失败，不据DOM数字签轴目视PASS。

原r3脚本名称继承恢复设施，实际替换为FD path，value/selection守卫、生产预检→页面确认→危险dialog确认→成功→snapshot，RPC三请求/响应逐ID对应成功；不是重跑FL。恢复成功建立安全快照，**准备有合法写，零写仅限其后FD浏览/展开/滚动**。七主表snapshot及raw实体与备份逐记录一致；六extra表与raw实体/空集合一致，不运行生产schema。

12个FD态与5个axis态的111根清单完全相同；每态109份业务原始字节实际大小/SHA核对，另2安全备份只有清单指纹：`backups/pmtool-backup-2026-10-23T02-32-54-830Z.json`、`backups/pmtool-backup-2026-10-23T02-44-52-713Z.json`。不称111份字节全回读，不扩成活库实时WATCH或所有污染根零写。

全部81个FD产品帧、18个axis产品帧及59个准备帧的记录/文件SHA链接已核。独立目视12个四宽产品PNG、5个axis PNG、1确认PNG；抽看FD帧12/30/53/78及axis末帧3，共5帧，**不称158帧逐帧目视**。axis原wheel垂直定位后再横滚，before/visible/follow/horizontal/final图保留：垂直段看不到图轴不作PASS，最后真实横滚后才确证卡/刻度重叠。Main辅助shell client1155/scroll3637、view879/3383只作定位，不定根因。

原viewports脚本未在每宽`top`前滚回顶；1024/768/390的top真实图继承前宽滚动位置。expanded通过真实点击首行自动进入视野；本单按实际expanded/scroll签有限断言，不按文件名覆盖页面顶部、整个dense状态或全旅程。没有采标签筛选/打开任务返回全链，不借F1/FL PASS给本FD。

## 4. 姓名有限 SOURCE / 原 AUTO

已读[开发handoff](../plans/2026-10-23-people-long-name-developer-handoff.md)、`/tmp/people-long-name-developer-20261023`的seal/readback/原两源/原diff/review/regression。seal SHA `b3cf74ffe10345701e112e955a17f68904356d389e6e8ba84dfeaeb4ff91fe1a` 与真实readback stdout相同；原子PID64146、status0，02:54:10.472Z→02:54:10.549Z。独立实核13份稳定封存文件；2份当前产品路径不再读，而以封存旧CSS+原diff核算新字节、旧TSX+seal对应不变。**不是重核此刻主树15项，也不改姓名原封件。**

唯一改动：

```css
.pm-pp-root .pp-name { min-width: 0; font-size: var(--t-13); font-weight: 650; color: var(--ink); line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
```

原行其余属性逐字相同；14009→14066B，旧SHA `60925a4083ce8740b610c7949038bafda823fe48b483a55d3e3f16d1163514ba` → 新SHA `8665e0874b0995a77bcd119fbcd892eaeb853593ce4014bce33100d270a995f4`；TSX26112B/SHA `e41ab4ec75a04b47fef95595cfde2bc1e915a319ce81ccba6cc99885259ac6a6`不变。原行独立`pp-name` span仍`{row.display}`，按钮toggle、原任务稳定ID打开、标签过滤与建议事件接线全文未改；不改行列/头像/OPEN/日期/状态/响应断点/派生。完整DOM文本未截短，不等真实可访问树或视觉省略已经GUI验过。原diff实际exit1表示有差异，不是失败洗成0。

原回归02:51:28.428Z→02:51:30.045Z，子PID63555、status0：`people-load.test.ts`1用例及`people-scale.test.ts`4用例，总2文件5通过；隔离config及完整stdout/stderr实核。stderr `cache.dir is deprecated`原保留。本角色未执行/导入测试，未核测试输入实体或重新证明阈值全集；开发handoff的wrapped排除/下限/过滤不缩尺等说明不当额外独立行为实测。有限准入只认原执行记录，不签本次CSS AUTO行为、RA-P1006整体AUTO或新轴后继。

## 5. 合同时间与当前移交

02:54:03.420Z检查点前已发独立轴红证/CSS最小合同。发送时“合入当前未封”与旧开发ID是当时依据先前消息的假设；负责人后续纠正姓名已封released，本报告与合同§4明确更正，**不能改旧封件或复活finished开发**。Main顺序另认领CSS续批、继任ID另给。

03:03:08.050Z检查点前按负责人新明确授权追加合同§5：`people.tsx`仅既有dots高度/点姓名数值独立槽/必要排期姓名span；`people.css`仅现wrapper/卡/内部收缩/文本槽/高度。保top14+i15、原xPct/flip/name/value/事件/MAX/core/schema，不新增卡或断点、不全局裁切。Main所报“CSS124px/末点224、TSX同节点”只是后继开发定位移交，**本角色未读后继源、不独立确证该根因或选择实现**。原CSS-only/禁TSX限制被§5精确替代，不静默扩权。

Main另安排新继任、审新轴源、唯一合build/全回归和原F1/FL、FD四宽/轴动作修后采证；本单不再续派、不签新轴源或父ordinary commit。

## 6. 实际验证、计时与收据

环境：macOS darwin、既有Node v22.23.3；cwd本仓库。仅Node内置fs/path/crypto/assert/child_process，无安装。命令为自有reader的`inspect TimedPeopleFDR1`、`inspect TimedPeopleFDAxisR1`、`analyze`、`name-review`、`checkpoint`、`outer`、`finalize-audit`、`seal`、`readback`：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/people-fd-axis-gui-timed-20261023-r1-reader.mjs outer
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/people-fd-axis-gui-timed-20261023-r1-reader.mjs finalize-audit
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/people-fd-axis-gui-timed-20261023-r1-reader.mjs seal
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/people-fd-axis-gui-timed-20261023-r1-reader.mjs readback
```

核件首次FD02:53:14.591Z→02:53:15.139Z=0.548s，axis02:53:21.089Z→02:53:21.714Z=0.625s；封存前完整语义03:05:07.426Z→03:05:07.905Z=0.479s；姓名源审03:01:30.254Z→03:01:30.262Z=0.008s。读图用真实检查点包围：四宽02:54:51.070Z→02:56:48.303Z；选帧03:02:11.937Z→03:04:14.094Z，期间包含合同追加，不冒充纯读图净时或工具内部逐图精确起止。首次实际检查点为02:52:05Z，最终总区间见readback。

Main四宽原动作真实时段：1440 `02:45:32.187→34.083` 1.896s；1024 `34.084→35.631` 1.547s；768 `35.634→37.663` 2.029s；390 `37.665→38.516` 0.851s（均同02:45分钟Z）。原timing有135条/65已结算step，含F1/FL历史嵌套与失败，全保于audit，不累计成FD净时、不把旧F1/FL返工计成本FD新执行。效率仅称短结构、有限原证/差异、早发合同减少重复采坏图，无同条件对照，不宣称倍数。

失败保留：rg127；首shape把平铺索引当信封导致371.8KB输出，其他若干摘要过宽，未打开工具私有落盘；相对tmp与猜错封存脚本名各exit1后改按确切路径；reader首次错误认为ticks在末尾而exit1，改按实际位于点文本之前的原序列后通过，不改证据。全部起止/错误在[audit](people-fd-axis-gui-timed-20261023-r1-audit.json)。工具未给逐命令绝对起止者不补造秒；核心内置核验和Main原timing均有真实起止。

最终[outer](people-fd-axis-gui-timed-20261023-r1-outer.json)四个实际独立子进程再核2443件、17态/RPC/帧/原字节及姓名封件；[seal](people-fd-axis-gui-timed-20261023-r1-seal.json)封本报告/合同/audit/outer四件及reader、两包index/seal锚；[readback](people-fd-axis-gui-timed-20261023-r1-readback.json)实际check子进程核后父进程写收据并回读，status0才STOP/released。本角色审证工作2/2封件加姓名有限源审已交，整RA-P1006通过0、人员整矩阵PASS0/96；不扫描/捏造父总分母。全回归/GUI仅Main后继执行，本角色未执行，不能报“产品测试通过”。

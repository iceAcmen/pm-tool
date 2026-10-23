# 人员 F1 / FL 有限 GUI 审证 r1

日期：2026-10-23；独立审证：trae。Main 唯一产品/GUI/整 build 执行端。本角色只读封件，只写本前缀与自有 `/tmp` 内置 reader；本单替代 fetch/install/build/living docs/git。**审证工作结束不等整功能完成；STOP / released 仅在同前缀 readback 实际 status0、收据写入并回读后生效。**

## 1. 结论

**FL 长姓名呈现 FAIL，最小修复先行合同已交；整 RA-P1006 未闭门。** [修复合同](people-f1-fl-gui-timed-20261023-r1-minimal-repair-contract.md) 只限 `people.tsx/people.css` 姓名文字槽，不改事实、MAX、阈值、事件或业务数据，不新设计；Main 修后才采受影响原有限段，不重复采已证坏图。

| 原 ID / 有限断言 | 独立结论 | 证据与边界 |
| --- | --- | --- |
| RA-P1006 / F1 事实、建议、标签筛选、T01/B01 打开/ESC/回人员、浏览零业务写 | PASS，有限段 | 八态原 PNG、页面状态、53 帧记录；28 根逐态原始字节相同 |
| RA-P1006 / FL 数值事实、建议、筛选、展开八项、原任务/建议目标返回、浏览零业务写 | PASS，有限段 | 八态原 PNG、页面字段、78 帧记录；109 份业务原始字节逐态相同，另1安全备份只有清单指纹 |
| RA-P1006 / FL 长姓名可读呈现；RA-V-people-1440-dark-100-long / 不重叠子断言 | FAIL | `fl-view-r1.png`、`fl-expanded-r1.png` 及帧0/28/77：80字姓名横穿负载条、OPEN 8/6、到期、状态；非 Main 自判 |
| RA-P1006 / 同 MAX10 | NOT_RUN，图轴目视缺证 | 页面状态刻度0/2/4/6/8/10与原登记匹配，但本轮原图未展现下方坐标轴，不能以 DOM 数字替代目视 |
| RA-P1006 / SOURCE、AUTO、继承 | NOT_RUN | 未取得本 ID 的独立历史原证及相关输入差异；fixture 有限准入不是产品 AUTO PASS |
| 人员原矩阵整格 / 整 RA-P1006 | 不签 PASS | 已证布局 FAIL；其余全宽/浅深/原生200%、F0/FD/FE/FB、整格共享预期未采，不转 MANUAL_PENDING |

依据：[原治理单 RA-P1006](remaining-governance-cases-20261021.md#3-p1呈现与保护面)、[原旅程单 §6.1](remaining-journey-cases-20261021.md#61-页面矩阵)、[总登记 F1/FL 与继承](remaining-acceptance-register-20261021.md)、[fixture r3 有限准入](f1-fl-fixture-integrity-20261023-r3.md)、collaboration §9/§11。没有新增 ID 或矩阵。原负责人授权保留在 audit，不把父 ordinary commit 授权移成本角色提交/发布授权。

## 2. 对象与完整性

| 封件 | 成员全部实际大小/SHA核验 | 索引 SHA-256 |
| --- | --- | --- |
| [TimedPeopleF1R1](../../reports/all-pending-evidence-20261021/TimedPeopleF1R1/index-r1.json) | 651/651；0不匹配/符号链接 | `e1bb910eeacee0bb5ac6c698b87d1200a6343628b9653c2c38feda1ecc344988` |
| [TimedPeopleFLR1](../../reports/all-pending-evidence-20261021/TimedPeopleFLR1/index-r1.json) | 1406/1406；0不匹配/符号链接 | `3184d0654832e907688864e6abab621419212aac6a6012707923414b337be97f` |

两包额外文件只有各自 index/seal，也实际回读并指纹登记。candidate/source-files/complete-inputs/built-artifacts 四封件逐字节相同：CombinedF02RepairR2、baseline `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`、v0.7.4、Main、源登记124/输入登记525。455项构建声明全部与 Main 实际产物全hash记录相同；本角色不打开 private/lib、不重核当前主树或新 L8/后继，不把124/525元数据当实际源码审读。

运行身份来自原 host-start/ready 与两包 activation：3270/PID53831。两包真实 dark/deep、1440×900、DPR2、CSS基准100，portal/pilot null（默认OFF）。F1原口述/light脚本错误保留；FL correctedLabels 已封。F1 body `data-ds-dark-theme` 与 FL `rgb(21,21,23)`、真实图片一致；不计浅格，CSS100/DPR2不当原生缩放菜单证据。

fixture 原始字节与 r3 有限准入备份一致：F1 13042字节/SHA `ed69b80870239f0a96e66a9469e3a7e6d4a93213dcbe53abf595777c7d0d3134`；FL 1061394字节/SHA `4805e3843edb2a93849124cbd6c1f72ee08f059604fc34ffc238bd09b8868c2f`。生产 snapshot 七主表、原始 version2/record 落盘实体与完整备份逐记录相同；不运行生产schema。

## 3. 原动作与目视

A=`p-0001` 平面24，B另2；五态8/6/2/7/1，open16、完成7/29%。甲/乙/未分配事实总数13/9/2，open8/6/2。wrapped仍是清单事实但不进入open；看板13与人员MAX10不同公式，不能混用。T01=`t-0001` startD-31/updateD-8；blocked B01=`t-0015` updateD-4。两包筛选仅留T01标签，关闭后恢复三条建议；T01/B01字段与稳定实体相符，打开title获焦、ESC关后回原项目人员页，未提交状态变化。无signal的B02没有烂尾标签。本有限样本不证明所有阈值边界或全路径零写。

F1正常预检、危险dialog两层确认、confirm→snapshot真实RPC可对应；恢复成功文字是「已恢复备份」。FL r3同标准path链三个请求/响应均成功，生产确认真实建立安全快照；不是用HTTP200代替GUI。F1三轮误等dialog/MAX/「恢复完成」、sources目录漏建r1封包失败与r2续封全保；FL r1 ENOTDIR、r2 MetaA未清由value守卫拒提交、tripleclick清理及r3成功全保。准备恢复有合法写，**零写仅限之后人员浏览段**。

独立 view_image：16个产品态PNG全部目视，另1确认PNG及14个选定帧。全部131产品帧SHA及记录链接核过，但不虚称131帧逐帧目视。FL帧42上传设施code=-7失败，不记已目视、不判产品FAIL；对应原态PNG与其他帧足以确证本次重叠。姓名重叠不因数据记录正确而PASS；任务标题已有省略与原目标可达不被扩成新设计。

F1八根清单SHA均 `437c8e0b02c38305f2ef861ca248092c7ef07e2c5a2cfaaff916379e1bdaab04`。FL八份110根清单SHA均 `5f3d9d947aaa274373bf113fd410963ba86235499f68705a956329453b7997c8`；每态109原始字节实核，余 `backups/pmtool-backup-2026-10-23T02-32-54-830Z.json` 13042字节/SHA `aaa8dad41641aad2cbf9bb46495e76444ce529567e52b35f88bbc0e09c266374` 只在清单，不能称110份字节全回读。这是证据覆盖边界，非产品失败。

## 4. 计时、效率与收据

Main 两包计时按事件id去重：53个已结算step，45个顶层command；每步真start/end/elapsed与失败都在 [audit](people-f1-fl-gui-timed-20261023-r1-audit.json)，不把嵌套重复加总。F1三轮误等待7.807/7.395/7.314秒共22.516秒；F1 r2封包0.625秒/实际exit0可由FL已封timing补齐，不改F1原包。FL r3生产恢复02:32:53.693Z→02:32:57.055Z=3.362秒；原人员动作02:33:24.080Z→02:33:29.455Z=5.375秒。FL封包outer f207e743/status0为Main本轮交代，包内timing止于开始，不冒充本角色拿到了该outer原收据。

本角色F1核件02:30:55.549Z→02:30:55.726Z=0.177秒，语义核验02:34:40.370Z→02:34:40.531Z=0.161秒；FL有限核件02:38:12.544Z→02:38:13.280Z=0.736秒，语义核验02:38:23.173Z→02:38:23.218Z=0.045秒。每项内置核验独立记录起止。目视阶段用真实命令检查点包围，不虚造工具未提供的逐次精确wallclock；首次记录10:29:49+0800到最终readback检查点总耗时见readback。

两封件审证2/2=100%是工作完成率；整RA-P1006通过0/1=0%，本报告签出的人员整矩阵PASS为0/96=0%。父总进度未交当前冻结分母，不扫描/捏造，不增加整功能完成数。效率改进是依据真实value/RPC/dialog等待、按域合短报告、缺陷先发窄合同；没有同条件对照，不宣称工具效率倍数。剩余原同MAX补证仅需同已采条件滚到真实轴；SOURCE/AUTO仅补原独立结论与差异，均不扩范围。

设施问题如实保留：rg exit127/指定记忆入口不存在；首次摘要误展开全index，后两次仍过宽，后续收窄；自有reader先误把存储信封当实体exit1后按record更正；FL110根全字节预期exit1后明确109+1缺口，不洗为全完整；有界等待工具终态接口不兼容，未取得其exit收据，不冒充0。未运行产品/Main脚本/浏览器/网络查询、install/build/git，未读活库/private/正式根，未改原封件、其他testing或living docs。

环境：macOS darwin，既有Node v22.23.3，cwd本仓库；只用Node内置模块。实际命令：`node /tmp/people-f1-fl-gui-timed-20261023-r1-reader.mjs inspect <上述封件名> <上述SHA>`、`analyze <封件名>`、`outer`、`seal`、`readback`。最终outer重新逐件核2057成员；[outer](people-f1-fl-gui-timed-20261023-r1-outer.json) 保存真实子PID/status/stdout/stderr，[seal](people-f1-fl-gui-timed-20261023-r1-seal.json) 封本报告/合同/audit/outer四件及reader指纹，[readback](people-f1-fl-gui-timed-20261023-r1-readback.json) 由独立check子进程实核四件和seal，再由父进程写收据并回读。收据实际status0后 **STOP / released**，不续派、不commit/push/release/正式切换。修后新候选的影响/继承另审，原GUI不自动续签。

# A8 GUI 新补件有限独立审证

> 2026-10-21，trae，新独立 GUI 原证审证专家。给 Main、负责人及后继独立专家使用：只审归档 A8 新补件与明确可继承 A7 下载/重进，不执行 GUI 或产品测试，不签 J06/B8/积压总门。

## 1. 结论先行

| 对象 | 有限独立结果 | 边界 |
| --- | --- | --- |
| 恢复错误重复前缀 | **FAIL，A8-RV02/P2** | 新 hash/missing/path 原结果卡为“恢复失败：备份/恢复失败：…”，违反已生效 B1-GUI-03 单前缀合同；[最小修复/先行测试合同](a8-gui-supplement-independent-review-20261021-repair-contract.md)已交，不改恢复事务或 filename 合同 |
| 390 任务工具条 | **FAIL，A8-TW01/P1** | 真实浅色 PNG 的分享按钮裁切、shell 横滚28px；深色同 shell 几何缺口。归因任务 `.pt-seg-data` 内簇，不归 preview；[最小合同](a8-gui-supplement-independent-review-20261021-toolbar-contract.md)已交 |
| A8 完整 client + editor 实际下发 | **PASS，字节绑定子项** | 两个 uncached200 原完整响应/唯一片段，独立重算并恢复本地 map 尾注后精确等 A8 artifact SHA；不倒填 A6，不把此项升为完整启动/正式版本身份 |
| 三原动作、三逆序撤销 | **PASS，当前观察域 GUI/完整内容** | 16态、164原帧逐帧目视，actualDafter / frozenBrow4 / sameAtop；三 undo 完整 JSON 等 S2/S1/S0，末 disabled |
| 两拖保存/reload、不同草稿取消/reload | **PASS，布局内容/行为子项** | 15态、241原帧逐帧目视；保存版=两次真实重载回读，盘上完整 value 同保存版；不签整个 data 根零写或取消阶段 mtime/LS 全保护 |
| 保存成功反馈 A6-BGUI-01 复验 | **PASS，当前浅色已交保存支** | fixture 的实际 status + success modifier/计算 style，显式保存原帧000117为绿色成功提示；旧 A6 红色 FAIL不抹，不扩 BF-G02–04全部错误/重置/queue/加载 GUI |
| 长预检/取消、两确认、十三表/双资产与安全快照 | **PASS，明确行为/内容子项** | 1440当前浅色 preview 不撑第三列；键盘取消2px焦点、Enter后关闭/三根hash0；空库/带前库第一确认0写，第二确认后全字段一致，真实安全快照 JSON+manifest+侧车hash可对照 |
| A7 双下载、安全头、匿名拒绝、五入口重进 | **PASS，归档 A7 子项** | 两个22byte实际下载重算双SHA；实际200安全头与新匿名401；会议/汇报/交付/OKR/习惯原帧/PNG/JSON一致、三根hash0。不替代 A8/A9全页面 |
| J06/B1-GUI-01/B8/全部积压 | **不签整门，FAIL/BLOCKED保留** | 两项确证 FAIL；取消精准mtime/LS、原生100/200完整矩阵、全部13表重启重进及其他完整旅程仍缺证；不是 MANUAL_PENDING |

本轮完成有限审证并释放。Main继续既有确证修复/补采；不以本子单结束宣称父任务完成。

## 2. 授权与原证方法

父原句见 [执行记录](../../reports/all-pending-acceptance-execution-20261021.md) §1；本轮依据其23:05补记、负责人本次明确限定及后追加 `A8/restore/width` 原件。可写只有 `docs/testing/a8-gui-supplement-independent-review-20261021*` 与其 selftmp；Main唯一GUI/builder。已读 AGENTS、collaboration §9/11、A6/A7报告与修复合同、A8反馈先行合同和 SOURCE7/72独立PASS报告、原单前缀与页面矩阵条款。

未 fetch/pull、install/build、跑产品 verify/组件、GUI/浏览器、调用服务、读credentials/私人runtime/当前lib、写sharedcache或其他testing/livingdocs、commit。规则与限定授权一致，不机械执行常规开工构建/收尾同步。引用外部 research-guide 的原证优先、反证和不确定性分层；不运行vendor或引入外部证据替代仓库合同。两个记忆入口不存在、rg不可用，已用仓库事实/find/grep继续，不算产品失败。

审阅用 [selftmp](a8-gui-supplement-independent-review-20261021-selftmp/) 中38张完整帧联系表，逐帧看完688张原图；不裁剪，保原文件名与相对原戳。另按原尺寸看成功000117、恢复/错误/工具条/记录截图。联系表只是审阅辅助，不是新GUI执行原证。原frame字节逐项校hash，不以计数代替目视。局部 compositor 帧不是OS全屏录像，不声称光标/窗口无遮挡或帧间无未见状态。

## 3. 候选、继承与下发

- A8 `candidate.json`：baseline `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，hostGitHead `1142fb74f2bbcc54dc9499054c0448c9b876cbf2`，patch SHA `5236c4b518d503e625830a6a9176b86014b199e3f7cba893f9255691deb18957`；502源/声明指纹、453产物，drift=[]。基线/0.7.4不单独代表 dirty 候选。
- sync有507条：与candidate重叠502条相同，另5条是 Launcher独立probe测试，**不在candidate**，不把“sync多5”判源码污染或签整个Launcher。post-source drift=[]。已冻结 SOURCE/AUTO 副本375份src逐字节等 A8；package/lock一致，tsconfig不在candidate，不假称完整声明全认领。
- SOURCE7/72有限PASS仅继承到这份冻结 A8，不继承 A9之后 panel/tasks 变更。对 A7已有395源清单逐项比，改变只有 panel/path-test/panel.css/BoardBento/board.css五项；原 backup命令/core、资产/records源未变。旧A7恢复callback未变的SOURCE事实由72报告审签，新的preview呈现必须用A8原图，不能继承旧布局FAIL或倒签旧图。
- setups/environment只给自有origin3218/3219、非敏感profile骨架、plugin隔离树解析声明与home patchSha；公开A8目录没有启动PID/完整启动原日志。实际响应/document可绑定下列已交动作；**不签BF-G05所有启动字段**，不读私人runtime补PID。宿主SHA为候选归档声明，不当作本专家实时查询宿主。

| 原响应 | 全响应 bytes / SHA256 | 完整执行段及独立恢复产物 |
| --- | --- | --- |
| main/loaded-r2/combo-1.txt，3218 | 2562339 / `155198915b038d0b12c42c21fafe19bb7f8dbc31df060e2f098d5cf20a483585` | offset875361/1683507bytes，段SHA `9eb9c79a0f8417fcfcd44f0f4a39b0639fc756242c87ea7a8d37e2f22fc421b9`；恢复本地尾注得1683539bytes，SHA `3b89daf38af25eff079214ba8b3fa121738d5b9d6177ecd8cb250e851a83dcfc` |
| main/loaded-r2/combo-2.txt，editor | 408722 / `14256debd1f4a60cec998a04edf26d14eff9ef86bcede48531ad5b6b842fcced` | offset0/408663bytes，段SHA `65226dd679dbdcae11798fe193920e5b12efeb27343dec4ad9828f7d98127784`；恢复本地尾注得408702bytes，SHA `89edce8deae392d9289720044a01b918567d16935f26f887e00def5cbbe9a6a2` |
| restore/loaded/combo-1.txt，3219 | 同上述client全响应SHA | 同client完整段/恢复产物SHA；editorMounted=false，不要求该页面无编辑器时装editor |

每段 second index=-1，status200/fromDiskCache=false。恢复步骤仅去宿主追加 `;\n` 并补本地 `//# sourceMappingURL=<name>.map`，恢复结果hash精确等manifest，不读取或重建当前lib，也不是假造网络原证。3218 loaded-r2的document1792594710765.7绑定fixture/原三拖/保存前；保存、取消真实reload的document1792594903420.2与1792594907088.6由states归档，不用React重挂替代。恢复document1792594413115.3及相同client原响应单列。

首main/loaded仅client、不覆盖editor；首board/r1 data URL设施 `ERR_UNSUPPORTED_RESOLVE_REQUEST` exit1保留，不使用。新r2对原A6执行脚本的diff只有helper/evidence/output适配，全部动作与oracle未改；两outer-exit均0，executedSha精确等归档execution。

## 4. 看板动作、保存与保护

按 A/B/C/D/E/F 的原ID顺序：

| 稳定态 | y | 独立结果 |
| --- | --- | --- |
| S0 | 0/6/8/10/12/14 | 完整JSON等原F1，undo disabled |
| S1 | 11/0/2/4/6/8 | drop时A已在实际当前D之后，稳定A11≥D4+h2；原操作不是“某个delta” |
| S2 | 11/4/0/2/6/8 | B落冻结原A区row4，不随第一拖更新该区 |
| S3 | 0/10/6/8/12/14 | 仍抓同A回top，三态均不同 |
| undo1/2/3 | S2/S1/S0 | 三份完整导出逐字节相等，末disabled |
| save-draft / saved-reentered / cancel-reentered | 11/4/0/2/6/8 | 三份完整导出/盘record.value相同 |
| cancel-draft | 0/10/6/8/12/14 | 实际不同草稿后取消，不是空动作 |

164原帧可见A越过实际D、B回row4、同A上移、三次撤销与导出交替；241原帧可见两拖、显式保存、绿色成功、宿主loading/重进、不同第三拖、取消/loading/重进。每拖start命中正确ID、down/drop buttons=1、原真实30步move+末同格move/mouseup；这些由脚本+同帧观测+原画面交叉核，不声称合成帧里带真实光标。

13稳定态六ID/type/config/x/w/h/min完整不变、bbox与JSON相符、零相交；grid高828、stage bbox高861/scrollHeight856，外壳client=scroll1155。A8 stable11和旧A6 stable6均由各次原实测认领，原目标合同不硬锁pur实验位置。全宽卡超stage的水平范围属于原stage内部轴，不把它当当前外壳横滚或“顶部大洞”。

成功：fixture/result实际 `role=status`、`pm-bento-validation--success`、背景success10%/边30%且alerts=[]，原图绿色；显式save的原帧000117也完整绿色“布局已保存并刷新。”，而非旧红图。该帧只签保存成功支；未采保存失败/刷新失败/重置/queue/加载优先GUI，不由72组件stub代替。

保护限定七根：隔离data/files/backups/exports、仓库data/pmtool、仓库packages/backups、正式pm插件软链。原件包含目录存在/mtime、完整文件键/bytes/hash、软链target/mtime、完整layout原文及实际localStorage。

| 窗口 | 可签事实 | 明确保留 |
| --- | --- | --- |
| 三拖/三undo | 七根entries及layout/LS完整相同，hash+mtime/dirs零差异 | 不是全disk/未列附件字节根零污染 |
| save→两次reload→cancel整体 | 仅隔离data内settings目录/dashboard_user和session目录/该session文件有变化；其余六根完全相同。layout原文hash精确等manifest、record.value等保存版 | 不说“只有layout写”或“整个data零写”；session原字节未交，不能确定其字段/写入原因 |
| LS整体 | 仅 `pm-dash-layout-history:user` 变化，旧1条变2条：新首条完整等保存版、余下精确等旧历史，取消草稿未入历史 | 正常savehistory不判污染；无取消前独立LS快照，不签取消阶段LS零变 |
| cancelBefore→final | PM完整键/hash、files/backups相同；session哈希 `b31ee694…`→`97f3b380…` 确有差异 | 不能签整个data根0；cancelBefore只有hash缺mtime/目录/LS，本条仍BLOCKED，不以整段before/after冒充精准取消保护 |

软链target原件为仓库主包，前后target/mtime不变，只签“不变”，不据此批准正式版本或操作正式服务。没有扩扫描正式全库/额外assets新门。

## 5. 恢复新原证

- **RV01-LONG当前局部PASS**：原长F5路径/warning/13表摘要/命令全文仍在；shell1155=1155、main923=923、pre887=887，preview在pm-main不再第三shell列；1440原PNG目视路径折行、确认/取消完整可见。
- **CANCEL当前行为/hash子项PASS**：原Tab到cancel的focus为solid2px，Enter后 `long-cancel.json/png` 预检关闭且没有confirm动作，三根完整键/hash0。31帧末仍保前一compositor画面，后续稳定PNG/JSON补实际关闭，不能拿末旧帧判产品坏，也不冒称全部焦点回归已采。
- **CONFIRM空/非空PASS子项**：两组原帧分别可见预检→第一次危险dialog→第二明确确认→恢复结果；各自firstBefore=firstAfter三根0，之后19份业务envelope逐key重建SHA，精确等F5十三表全部字段与稳定ID；extra settings按键值对，不误当实体id。共享fa1、E1三revision/E2两版软删、报告session来源等随完整字段一致；两份22byte资产relPath/hash等原侧车。
- **带前库安全快照PASS子项**：前库是已恢复F5，再恢复同F5，真实新增 `/backups/pmtool-backup-2026-10-21T14-58-41-593Z.json`，SHA `d75584fd96c676af41c90c72212ecc69a6739412949d463b94ea8ad77969af6e`。backup-readback完整对象重新序列化含尾换行，精确等盘hash；七类+extra全文等前库F5。sidecar bundleId `912ec881a25afc36`，manifest jsonSha/2files/size/relPath/SHA与JSON及after完整清单匹配；manifest重建SHA `21cb874d6c536a29c5c3227a0b0679f02fd26dbe73daf93268cb75b65d1fd981`。原侧车双字节独立读取重算，目标侧车以after完整hash清单认领，不虚称本专家读私人runtime。不是只看“自动存快照”提示；同F5前库不夸成异构前库/故障回滚/独立快照再次恢复全部实测。
- **negative-r3拒绝/存储PASS子项**：hash=`manifest与元数据不符fa1`、missing=`缺少字节bundle拒绝恢复`、path=`manifest路径越界../outside.md`，三类各有不同稳定原错误与保留对应本副本路径、原before/after三根完整键/hash0。各等待该类完成结果的原件可辨，不用任意旧error猜本类已完成。文案三例都违单前缀，A8-RV02另FAIL。r1菜单设施中止/r2早读旧反馈保留无PASS。
- **390追加**：118原帧逐帧目视深浅主题真实切换、同长路径预检/取消；三根hash0。warning折行、pre局部纵向内滚、两动作可见，不见preview自身造成横向外溢。实际shell329/357的28px缺口仍FAIL；新滚到工具条PNG明确分享裁切，归 `.pt-seg-data`。Main口述probe按钮right413是定位补充，公开JSON未列按钮bbox，本专家不冒称重算413；旧源CSS已定位该内簇缺wrap。

## 6. A7 继承补件

下载/五route结论先绑定A7自身origin3216/document1792592794569与A7完整client。A7→A8五处差异不能自动继承全页面视觉；本轮只保原数据/下载协议与未改record组件接缝，A8新panel的全呈现另测。

- `download-r2/QA 中文 文件.md` 与 `version-two.md` 逐字节22byte，重算分别 `87ef7d4f570468db73bd600a35b913cba4f82d5101a4e559536ecab8cf472d1a` / `875a72ee9315a77dc0407dbfe29ce8823dfd2671e3c785ee69ffc6e18dbb2522`，等F5资产。before/after三根完整键/hash0。
- download-r2 responses=[]保留为首次头缺证；独立新ownedtab的download-headers原extra/response均actual200，Content-Length22、text/markdown、no-store、nosniff及RFC5987中文UTF-8名解码精确一致。浏览器附件导航ERR_ABORTED不等下载失败，不改记录为正常页面导航。
- 新匿名context同两资源actual401、JSON错误73bytes、no-store/nosniff、未得到源字节；响应原body未归档，只签状态/已交拒绝元数据，不宣称逐字节重新审匿名body或完整认证安全总门。
- reentry的16原帧与五PNG/JSON：F5会议/mtg-0001/手动来源/原决议，汇报rpt-0001/qa-f5-session与原风险快照，交付V1/里程碑/合法note，F5目标，F5习惯+OKR关联与诚实空打卡。三根hash0；不造reflections/lessons额外GUI已重进，不把建议徽标0当主档0。
- 后补native-menu-100实际图可见3216/100%，只认该后来文档当时截图，不倒签上述较早动作或A8各document的原生100/200。file标签faID仍按A7-NAME01定位条目，未找到新明确展示合同，不扩修。

## 7. 实际验证与缺口

本专家环境 macOS/darwin arm64、实际Node v22.23.3、Swift/AppKit；pnpm11.28.5为Main项目口径，本角色未执行pnpm。

Main原前置（不是本专家重跑）：隔离包cwd的 `pnpm exec tsc --noEmit`、`pnpm run build`、`pnpm exec vitest run --coverage --maxWorkers=1 --minWorkers=1 --no-cache` 均exit0，136files/1272tests，Statements/Lines77.91、Branches86.09、Functions79.22。95verify/A7Launcher56旧原退出已有A7报告，不冒称A8新全部verify/真实模型/Launcher出口已执行。

本专家在macOS仓库根实运行：

```sh
cd /Users/bytedance/Projects/dsh-pm/pm-tool
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a8-gui-supplement-independent-review-20261021-selftmp/audit.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a8-gui-supplement-independent-review-20261021-selftmp/audit.mjs r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a8-gui-supplement-independent-review-20261021-selftmp/audit.mjs r3
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a8-gui-supplement-independent-review-20261021-selftmp/contacts.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a8-gui-supplement-independent-review-20261021-selftmp/final-check.mjs
git diff --check -- 'docs/testing/a8-gui-supplement-independent-review-20261021*'
```

- audit首轮780校验、7红、exit1保原 `audit-result.json`：四类parser/范围错误（sync多5probe/sidecar按不存在assetId取/缺bundle匹配错词/误猜missing路径），以及实际cancel宿主session变更、原帧戳倒序。只修自有审证设施并分层登记真实差异，不改产品/原件/oracle逃红。r2 899校验exit0；r3增加375冻结src与完整响应恢复hash，1277归档校验exit0。它们是证据校验数，不是产品测试/业务场景数。
- 两次单独Swift生成three/save联系表，exit0（9/13表）；contacts.mjs六次串行Swift各exit0（1/2/2/4/1/6表），精确argv/时间/输出在selftmp。全部module-cache在selftmp，未写sharedcache。
- 688原帧hash相同；三拖戳单调。save的000204比000203早7.827ms，width000014/17各早0.318/1.864ms；保原接收顺序和原戳，不伪改成单调或声称已经封完整mp4。它们不独自证明业务失败。
- 两次只读 `diff -u` A6→A8执行脚本均exit1，含义是helper/evidence/out路径适配差异已见，不是产品测试FAIL；业务步骤未变。Node语法/报告/归档漂移检查结果见final-check，未做被禁止的产品完整回归。

**Main下一步仅两份最小合同及已存缺口**：修反馈组合场景前缀、任务数据工具段局部wrap；按新候选重测受影响组件/真实GUI。取消阶段只补原已要求的当时hash+mtime/dirs/LS及session变化最小归因原件，不扫全disk或事后造before。剩余BF-G02–04、危险确认完整键盘/焦点、1440/390深浅及其他既有档位原生100/200、UI备份、全十三表重启重进、故障回滚与其他完整旅程继续原合同，不因本子项放行。

审签：trae新独立A8 GUI原证审证专家；采证/产品/builder：Main。本角色只写本前缀/selftmp，不修改旧FAIL、他人testing或livingdocs，不提交；无自有GUI/服务资源需接管。本有限审证完成，释放。

# A18 正常特殊标题与错误卡关闭恢复补件独立 GUI 审证

> 2026-10-22，trae，独立测试专家，非开发、非 GUI 执行端。记录本包已采有限控制、原失败、冻结身份和缺证，供 Main 与接续专家复核；不签新 Main、整门、发布或 commit。

## 1. 有限结论

**实际 t-0001 正常保存标题 `Failed delivery · Error register · 失败标题`，以及明确丢弃草稿、关闭实际错误卡后重新编辑同输入并正常保存，两条路径分别有限 GUI PASS。** 本包错误保输入/预宿主零写与实际关闭零写有原件互证。原“模态抽屉后关闭卡”尝试 **execution exit1/30秒超时保留，关闭动作 BLOCKED、未成功**；不是“保草稿穿越关闭 PASS”。完整 A18 错误上下文 GUI 合同仍 **BLOCKED**。

| 既有合同切片 | 独立结论 | 精确范围与证据 |
| --- | --- | --- |
| A17 TF-C01 的合法成功标题含失败/Failed/Error | **有限 GUI PASS** | 仅所采一个真实生产 TaskForm 标题，command/done success、实际 success toast/status、无alert、真实任务JSON/snapshot；不签全部独立AUTO控制 |
| A17 TF-F01/RA-N01 的实际传输失败保输入、不误画成功 | **有限 GUI PASS** | 一个预host ConnectionFailed，原原因完整存在于alert；续采PNG可见红卡/警告，原同标题input保留、保存/取消可用、零业务/文件/备份写；不签host已收件后事务回滚 |
| 原错误卡背后关闭并保草稿继续保存 | **BLOCKED，原失败保留** | page.click返回后等卡hidden超时30000ms，未生成closed/success/after-roots；卡仍在，不能替换成成功 |
| 明确取消/放弃草稿→关闭实际错误卡 | **有限 GUI PASS** | 续采关键帧有“放弃未保存修改？”和“放弃修改”；closed实际状态无标题input、无alert/旧原因；关闭前后三根完全相等 |
| 关闭后正常消息恢复 | **有限 GUI PASS，仅可观察呈现** | 同实体重新编辑、重新输入 `Error register · Failed delivery · 成功重试`，一次真实update+snapshot；success PNG绿色边/Check、无alert/旧错误、任务已更新 |
| 关闭时原未提交草稿仍保留 | **不签 PASS，原路径 BLOCKED** | 续采已明确丢弃原草稿，后来重输同值；不是同一个表单草稿穿越关闭 |
| A18 TF-X08：catch 原因含成功/summary/detail/action标记、持续全文/无动作 | **GUI BLOCKED，本包未采** | 实际错误原因只有 Failed to fetch；成功返回带summary/detail不等错误原因带标记，不借SOURCE/AUTO |
| 同值message、generation、迟到copy/timer、quiet/重挂/复制竞争 | **GUI BLOCKED，本包未采** | 续采是不同成功文本、没有真实复制或竞争控制，不扩成全context清除实测 |
| 新Main/三个interface script最新修正、完整95、habitfix、全导入/整项/commit | **不审签、不放行** | 字节/范围只绑定旧A18 freeze；其他任务或子项PASS不能代替整门 |

本包有限切片未发现新的产品 FAIL；未采是 BLOCKED，不转 MANUAL_PENDING 或默认豁免。原 A18 导入审证报告不改动，其“成功特殊标题/关闭后消息缺证”由本补件仅补上述切片，不倒签当时原包；带标记原因等缺口继续保留。

## 2. 授权、有效合同与角色

完整负责人限定原句和先行步骤见 [本单计划](a18-feedback-controls-gui-review-20261022-plan.md)。已读 [AGENTS](../../AGENTS.md)、[collaboration §9/11](../collaboration.md)、[A18原导入GUI报告](a18-import-feedback-gui-review-20261022.md)及其计划、[A18 SOURCE/AUTO报告](a18-feedback-context-independent-retest-20261022.md)及计划、[批准方案](../plans/2026-10-22-feedback-error-context-closure.md)、[A17合同](a17-transport-feedback-contract-20261022-plan.md)与原TF-X08。沿有效合同审证，不自行新增或替换GUI步骤，不把待表决矩阵当已生效硬门。

Main是原GUI执行端，仅采原件，无PASS；本角色只读文件/源/日志与本地图片后独立判定，没有执行产品函数、原采证器或GUI。具体禁令优先于通用fetch/pull、build/install/fullverify/livingdocs/提交闭环；脏树及并行成果不合并、不修改、不清理。只新增本testing前缀，未改其他testing/产品/原报告。

记忆只作辅助，所读项目topic不用于A18证明；指定user_profile/project_memory文件未在当前memory列表中出现，不创建或补写。研究指导仅用于原件互证和不确定性表达，无网络研究/工具安装/新产品设计/vendor执行。

## 3. 冻结候选与真实宿主绑定

候选树 `/private/tmp/pmtool-a18-closure-20261022`，version0.7.4，dirty基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，宿主原认领 `1142fb74f2bbcc54dc9499054c0448c9b876cbf2`。基线/version不单独代表dirty候选；宿主身份仅引原记录，不追认上游修改授权。

| 对象 | 独立SHA256核定 |
| --- | --- |
| A18 candidate.json | `2d533a1d214c0ae68739b354aac2e0d85b37ca6735c256d3dd3820bce3c191b9` |
| 完整tracked patch | `1b2becbaa4c910d0d7052ec42127bd3856e57cf49d30c72ec4d3ad55a6921fd4` |
| pinned11/proof.json | `0ec201301bb5beee4077fe8816e630f209f6678e6e22a4bd6f51c56e6d6d142e` |
| feedback-controls/index.json | `82eec647fb29e976d0ced8a66295e096d525d5b25846b853277ea1c3134d3019` |
| 冻结lib/client.js，1705501字节 | `9ab0c3e0d94751870a53507530d899d4a711bda4fbe5c2b474ebd66127cc06bb` |
| 完整loaded响应，2584301字节 | `b4a54301e085753ab4193ae1284156ac779064ec097d7e775970a3d6a9e9f708` |
| 唯一完整执行段，1705469字节 | `21d941ca10d41935a5416b58f6da29f2b5520e8bf93396e850de526a68eea343` |

**520声明source和453artifacts全部字节hash与candidate吻合，pinned11 source/artifacts逐项相同且原漂移数组为空。** loaded独立按原宿主分隔去sourceURL/sourceMappingURL、补换行分号重算，完整执行段offset875361、second=-1；不靠短哨兵/HTTP200认GUI。

原host-start于00:36:22.708Z登记 **3248/PID63429**、cwd只读上游、插件指本A18；host-ready于00:36:29.199Z同PID/端口。loaded target **BA817F66FCE81BD58357C4B50BFFDF2C**、`timeOrigin=1792629512672.7`；补件七实际状态同origin/timeOrigin，无另一页替换证据。实际inner1440×718、outer1440×857、DPR2、深色；PNG原像素2880×1436，合成JPG1440×718/pageScaleFactor1。DPR2不是200%文本缩放。

Main动态src/scripts及interface三个脚本后续修正不纳本保护根；本签字仅旧freeze，不能因新Main源码/报告存在转移到新Main或最新95。A18冻结声明完整不漂移的结论与Main合法并行更改分开。

## 4. 正常含失败词标题的真实成功

固定原证根 [feedback-controls](../../reports/all-pending-evidence-20261021/A18/feedback-controls/)，四轮ID：

| 原轮 | 执行/观察事实 |
| --- | --- |
| edit-1792630675226 | 00:57:57.977Z，原F5 t-0001编辑，title为`Failed delivery · Error register · 失败标题`；无command、三根零写 |
| save-1792630731626 | 00:58:53.254Z任务更新时间；seq29/30生产update/done success，seq31/32真实snapshot；00:58:53.393Z实际观察，00:58:53.779Zfeedback取证 |
| error-close-1792630785648 | 00:59:47.321Z单请求预host失败；00:59:47.371Z错误态；01:00:17.681Z原execution exit1/30秒超时 |
| error-close-continued-1792630886239 | 01:01:26.891Z仍保错误/输入；01:01:27.249Z实际关闭态；seq33/34 update/done success、seq35/36 snapshot；01:01:27.863Z实际成功态 |

首次save生产payload实际title与input逐字相同，返回真实`[pm:summary]任务已更新...`/`[pm:detail]`信封。原feedback为一个 `pm-toast pm-toast--success` status、alerts=[]、cards=[]；不是“常驻ResultCard成功控制”，本包成功走toast。实际PNG/关键帧绿色边、Check、标题含Failed/Error/失败仍成功，不误红；抽屉标题input消失，任务表真ID仍t-0001。

edit/raw与save/raw全7任务逐件核：t-0002..t-0007字节保持；t-0001所有既有字段除title/updatedAt外逐字段保持，另**从字段缺省新增`manualProgress:null`**，与真实payload一致。历史/引用未丢，但不能声称全记录仅标题变化，也不把本轮扩成富历史编辑全部验收。save/raw SHA与after-roots一致，snapshot任务全部字段与raw吻合。

首次save根仅 `/pmtool/tasks/t-0001.json` 改变，宿主session本窗口没有变化；files/backups不变，未新增/删除任何根项。edit还留原导入成功消息，不把旧消息当本轮成功。原标题input焦点环可见不等完整纯键盘/读屏验收。

## 5. 原失败与实际续采关闭恢复

原故障脚本匹配精确3248命令URL RequestStage，从POST取实际命令，仅首条 `/pm task update t-0001 ` 用 ConnectionFailed 失败；没有替产品成功响应、DOM或handler。原failed-request完整行等于续采生产update行（含同title和全部字段），无业务run/done，commands=[]，before/error-roots三根完全相同。仅证明请求未到宿主时零写。

原错误全文：

```text
执行失败：client api: commands/execute failed: Failed to fetch
```

原error.json为alert、同title保留、保存/取消disabled=false。原error.png因视口滚动，**全局卡在视口外**，不称该图看到完整错误全文；续采retained-draft.png和原error最后关键帧可见红卡边/警告、正文右侧被模态抽屉遮住，完整原因由原alert文字互证，不签全文无遮挡样式/复制。续采时距原error观察 **99520ms**，仍同错误、同输入、同三根；合成帧不是99.52秒连续录屏。

原脚本发出page.click关闭结果卡后，等待`.pm-result-card` hidden失败。原execution为exit1，工具stdout保留：

```text
TimeoutError: Waiting for selector `.pm-result-card` failed: Waiting failed: 30000ms exceeded
```

原失败没有closed.json/success.json/after-roots，不用脚本未执行到的exit0分支签成功。stdout栈指原脚本第31行hidden等待，**不是声称page.click自身报告timeout**。原按钮DOM disabled=false不证明可点：冻结DrawerPanel为role=dialog/aria-modal=true，有正常Tab焦点限制及全屏scrim；CSS layer fixed/inset0/z-index30。PNG/JPG明确卡处于模态抽屉/遮罩背后。归因为该正常模态交互边界下后台卡不可达，不独立认定新的“关闭handler坏了”产品FAIL；无hit-test/点击回执去精确分离遮罩与焦点机制，不把源码推测写成实测每一环。

续采原脚本顺序：observe保留态→点击抽屉“取消”→若确认则“放弃修改”→等标题input消失→点击实际“关闭结果卡”→等卡hidden→closed→重新选t-0001编辑→**重新输入**同title→保存。关键JPG `continued/000002`实际出现“放弃未保存修改？”并说明关闭将丢弃内容；不是只靠脚本if分支猜确认发生。closed.png及closed.json无旧alert/原因/标题input，closed-roots=before-roots；在途草稿已弃、关闭零写。

随后一次正常update/snapshot，真实t-0001标题为`Error register · Failed delivery · 成功重试`，其余既有字段仅updatedAt变化；其他6任务与首次save/raw逐字段一致。after-root仅t-0001改变、无session变化、files/backups不变；续采无独立raw副本，**落盘证明来自三根hash变化+生产snapshot全字段**，不伪造“续采raw重新读回/重启后读回”。成功PNG绿色边/Check、实际状态无alert/旧错误、标题input消失，可签错误关闭后新正常消息的有限可观察恢复。

续采没有单独记录success toast的class/role/live探针，**不把首次save的status实测移植给续采**；冻结普通消息默认清context及success toast分支只作静态支持，不声称浏览器读取内存context或全代际清除。续采success PNG的长变更摘要末尾有省略号，不签全文无遮挡/复制；原JSON/生产全文仍保存，不因截图截断更改原件。

## 6. 原件完整性、目视与未覆盖边界

162索引文件bytes/hash全部吻合，无额外未索引原件；含index自身目录163文件。四轮合成帧数量 **24/14/41/24，共103**，所有元数据与全部JPG hash核验。原error轮41帧仅00:59:46.374→00:59:47.816Z状态变化，不拿它填充30秒等待缺帧或99秒常驻全录像。

**独立目视全部7个实际PNG**：edit/actual、save/actual、error/draft、error/error、continued/retained-draft、continued/closed、continued/success。另目视8个JPG：error/000040；save/000013；continued/000001/000002/000003/000015/000021/000023。分别包含原失败后台红卡、确认放弃、关闭后主界面、重输入中、提交busy及新success。不是全103帧逐帧目视，也不是本角色重新操作GUI。

source/artifacts/完整loaded/原helper/execution/observations/所有四轮JSON、commands与task raw均已文件审计。执行脚本原依赖A18 helper复用A6采证函数、浏览器依赖来自既有A16，只读源码了解记录边界，不执行/导入、不读取helper中的私有凭据路径。53个补件固定文本按Bearer/token URL/sk模式无命中，仅启发式脱敏检查，不声称绝对无秘密。

**原SOURCE/AUTO的原20仍19绿1红、adapter20/16反例有限通过不替GUI。** 原导入报告中的带标记原因、同帧双点、宿主收件后事务、其他矩阵/旧trace缺口保留；原Main95的两红及A19设施门由原报告分别管理，本单不重跑、不洗绿、不借interface后续审签扩大范围。habit实体在补件初始根已存在但不由本单创建/验收，不签新habitfix或全data“本轮无写”。

## 7. 本角色执行、保护与释放

环境macOS darwin/arm64、现有Node **v22.23.3**；未调用pnpm/安装/构建/产品测试。实际命令及退出：

```sh
# macOS，仓库根，仅Node内置纯文件审计
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/a18-feedback-controls-gui-review-20261022-audit.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a18-feedback-controls-gui-review-20261022-audit.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/a18-feedback-controls-gui-review-20261022-audit.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a18-feedback-controls-gui-review-20261022-audit.mjs r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a18-feedback-controls-gui-review-20261022-audit.mjs seal
```

两次语法检查exit0；首次审计 **exit1**，23断言中4项false，完整结果保留 [audit](a18-feedback-controls-gui-review-20261022-audit.json)。原因：自有扫描器将“标题input消失”误写成“全部页面fields为空”，且假设raw无新增字段。读取原件后仅改本扫描器为实际title字段消失，并如实核新增manualProgress:null；无产品/oracle/原件变更，不降低失败保输入/实际关闭语义。第二审计 **exit0，23项结构断言成立**，另存 [audit-r2](a18-feedback-controls-gui-review-20261022-audit-r2.json)，不覆盖首轮。seal结果见 [seal](a18-feedback-controls-gui-review-20261022-seal.json)，结构绿不等整门PASS。

原四轮内exit为edit0/save0/error1/continued0；原工具error stdout与execution均实存。edit工具stdout为out路径；save/continued父工具最终退出回执本包未独立归档者未知，不因脚本内exit0补造父终端0。本角色探索rg不可用两次exit127，后换find/grep；大输出聚合grep尝试exit2保留为探索失败，不是产品FAIL。文档链接预检exit1仅因尚未生成seal链接，生成后再只读核对；不把预检说成全绿。所有有效断言/关键数值在r2，原产品执行未重跑。

保护基线取自首轮audit：**2720固定输入** bytes/hash/mtime，另完整520冻结source/453artifact；包括原A18固定build/pin11/fullverify/final/import-fault/feedback-controls、原SOURCE/AUTO及导入报告/计划、规则/批准方案，和四个已存在旧lib：

- `/private/tmp/pmtool-a12-closure-20261021/packages/dsh-pm-tool/lib`
- `/private/tmp/pmtool-a13-closure-20261022/packages/dsh-pm-tool/lib`
- `/private/tmp/pmtool-a14-closure-20261022/packages/dsh-pm-tool/lib`
- `/private/tmp/pmtool-a16-closure-20261022/packages/dsh-pm-tool/lib`

Main动态src/scripts、当前runtime、共享依赖全树及合法新GUI证据不纳本零写根，不能据本单宣称全盘零写或清除A19历史漂移。前后比较及本前缀文件指纹在seal；只新增本前缀plan/audit脚本/两轮audit/报告/seal，无其他文件写。

负责人告知原涉及PID已结束，按该事实不探活/不重启/不停止；本包host记录只证明采证时身份，不伪造本角色核当前退出。本角色只有已结束的同步文件命令，无子测试、GUI连接、builder、服务或凭据占用；保护核定后**释放、STOP**。未commit/push/tag/发布/正式切换。

剩余最小补件仍为原合同catch原因含成功/动作标记的真实GUI，以及未采关闭/同值/复制竞争控制；由Main仅采、独立专家审签。本单不实施补测，不签整项或最后普通commit。

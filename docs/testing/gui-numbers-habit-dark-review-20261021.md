# 编号、习惯历史与深色 OKR 原证独立审查

> 2026-10-21，平台 trae，独立测试专家。执行、开发、GUI 采证为 Main，判定为本专家。只审本轮已交非敏感原件；只写本前缀及自有 tmp。不签 B1-GUI-02/03/04 整门、batchA、全部功能或发布。

## 1. 即时结论

**新增确证产品视觉 FAIL：GNHD-01 / P2，编号复制成功和失败文字裁切。** 不是 Clipboard 值错误，不是权限拒绝假成功，也不是 runner 未等异步。已即时通知 Main；缺陷未复验关闭。

| 原门 / 子项 | 本轮判定 | 限定范围 |
| --- | --- | --- |
| B1-GUI-02 §14.4.1/2，编号列 | 局部 PASS | 1440×900 原图同时可见表头和合法 code 1/2，两行未叠任务列；长标题正常省略，不等于编号反馈可省略。未补齐标题/值子元素全部 bbox。 |
| B1-GUI-02 §14.4.3/4/5，键盘与系统值 | 局部 PASS | r2 两次真实 Tab 到按钮、Enter，焦点环均 2px；pbpaste 严格为 1/2，DOM 反馈仅在对应行，下一行复制前前行已复原。不签精确 1600ms 计时、全程动作录像或读屏。 |
| B1-GUI-02 §14.4.6，拒绝权限诚实状态 | 局部 PASS | r2 等到异步失败后 cells=复制失败/2，无已复制假成功；CDP 改真实 Clipboard 权限，不注入 writer。未实测手动选择复制，也不是另开上下文的全链证据。 |
| B1-GUI-02，成功/失败反馈可见可读 | **产品视觉 FAIL，GNHD-01** | copied-0/1 为绿色“已…”；denied 为黄色“复…”。DOM 完整字串和 aria-label 不替代目视可读。 |
| B1-GUI-02，只读保护 | 局部 PASS | 已交 initial/steps 的完整七文件键集与 hash 相同，0 新增/删除/修改。仅此 root/时段，非正式全资产或全部写根。 |
| B1-GUI-03 §7.3，深色 OKR 就近拒绝 | 局部 PASS | 真实保存步骤脚本与截图/JSON相符：编辑抽屉保留、标题与不存在 ID 保留，全页面唯一 role=alert 就近呈现，红框/错误全文可辨；无第二处成功反馈。 |
| B1-GUI-03，失败写保护 | 局部 PASS | 新建 QA OKR **之后**、非法保存之前的 domain manifest 五文件与之后完全相同。不是新建零写、不是全 data/backups/exports 零变化。 |
| B1-GUI-03 §7.1/2/4..7 完整深色旅程 | BLOCKED / 未完整覆盖 | 本帧确实深色，但本次主题控制选择/新建前置原步骤未到；四页面、错误关闭/焦点、长错误持久及浅深往返不能由该帧补齐。A0 ResultCard 局部结论保留，不合并成整门。 |
| B1-GUI-04 / F7，恢复后记录与显示 | 局部 PASS | 已交 restoredRecord 与 F7 fixture 对象全字段一致；14 条唯一日期、streak 3/3/14、近期5条、旧月份1/4/4。不是标准备份原始字节到落盘 envelope 的独立比对。 |
| B1-GUI-04 §8.2/3/4，分界、月份展开结果 | 局部 PASS | 10-08=D-13 平铺，10-07=D-14 在旧10月；10/9/8月默认折叠后真实 button 点击，aria-expanded 依次 TFF/TTF/TTT，日期倒序、备注/补记与 fixture 一致。未签收起/刷新重进的全部动作。 |
| B1-GUI-04，月份/390显示不改该习惯 | 局部 PASS，执行记录限定 | 归档脚本实际读取前后原文件并 Buffer.equals，结果 recordUnchanged=true；只签 Main 此执行比较，未收到原始前后 bytes/hash，不能声称专家另算双 manifest。 |
| B1-GUI-04，390布局 | 局部 PASS | 实际目视390×900图可读，HTML scrollWidth=390、pm-shell scrollWidth=329；这一态无外壳横向溢出。下方8月内容需纵滚，不判丢失；非全页/200%矩阵。 |
| B1-GUI-04，合法生成/预检/取消/确认/安全快照及后续写门 | BLOCKED / 未完整覆盖 | schema/streak/createBackup/precheck exit0 是本派单补充事实；fixture 元数据和预检/二次确认画面可核，但生成日志/标准备份字节、恢复完整过程、安全快照、取消 manifest、幂等/三天前拒绝未齐。 |
| 三项原门、总门 | **未获完整 PASS** | 已验子项、视觉 FAIL、缺证分开。截图/测试数量、当前装载/100%不升级总门；无 MANUAL_PENDING 转换。 |

## 2. 授权与审查方法

负责人原句：“独立GUI原证审证，Main执行专家判。只写docs/testing/gui-numbers-habit-dark-review-20261021*及自有tmp，不产品/他人testing/living docs/build/install/服务/private/凭据/MainGUI/commit。”随后补充：“Main继续3组确证修复，未重复派你任务；继续原GUI numbers/habit/dark审证。请结论将原门局部已验/缺证精确映射，不能升整门。你有新发现请即时发。”

父任务持续分工只继承本次审证范围，不接手 Main 修复、不重复派新专家、不操作 Main GUI。按明确派单不 pull/install/build/启停服务/提交，不改 living docs、他人 testing 或原证，不访问 private/runtime 实际路径或凭据。已交脚本中的 private 路径只作执行链说明，绝不跟读、运行或重放。

只读依据：

- [AGENTS](../../AGENTS.md)、[collaboration §9/11](../collaboration.md)，ADL-045/047/057/058。
- [原 batch1 closure](independent-acceptance-batch1-closure-plan-20261021.md) §6/7/8/13/14，尤其 §14 已撤销缺 code GUI 前置。
- [总登记 F7](remaining-acceptance-register-20261021.md#4-fixture-总账)、[父任务](../../reports/all-pending-acceptance-execution-20261021.md)。
- [A0 raw review](a0-gui-raw-review-20261021.md)、[A3 loaded/current zoom 独立审查 §6](fc-a3-independent-retest-20261021.md#6-main-加载和-current-zoom-原证)、[A5独立复验](fc-a5-independent-retest-20261021.md)。

本专家实际目视 r2 六张编号图、OKR一图、习惯八图及 native-menu 一图，共16原图；另看两张编号局部4倍最近邻放大图。自有 tmp `/tmp/gui-numbers-habit-dark-review-20261021-c5HaJ2/` 仅截图裁切脚本/输出/Swift缓存。没有看未持久交件的录像，不因录像存在于 Main tmp 宣称已审。结构比较用 Node 内置 fs/crypto/util，未执行产品脚本或生成业务 fixture。

## 3. 候选与证据继承

### 3.1 冻结对象

- 文档基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，产品基线 `2a7603023bc54ef13d788e50069ee3fde4671bf3`，插件0.7.4。
- A3 candidate sha256 `a614d2c827b4ad18e0acb39d57dd5c699f152928533d2544c29cce96341b84b4`；A5 candidate `9b0afc17ac171543184d3d885ce8ebd470c9d532855038c4b6dd063e841a9f6a`；A5 patch `3b12aa7b5ce3582a1fe291dd775981d4cb31ad010ce82cb767e56bab083b17b7`。
- A3→A5 的23项清单恰有三处变更：`launcher-app.mjs`、`launcher-core.mjs`、`browser-open.test.mjs`。本轮编号/OKR/习惯产品断言不因该 Launcher 修复抹除，Launcher/Finder受影响断言不能自动继承。
- A0 全453产物当前字节曾由 A3/A5独立专家核对；本专家只核已交453项索引和A3/A5三个bundle声明相同，不读 Main 隔离树重算453项，不称本轮重新构建。client.js `5ae7808cb3bcdb3f8e2577c84a587080f6dbd4f87b516a9520266a84872ac9ec`。
- 本次复核从13:15:14Z发现主树 `panel.tsx` 已不匹配 A5 认领；Main 正在另批修复，保留变化，不回退、不改 checker 转绿。**本报告绑定原冻结插件及已交历史帧，不能给修后当前候选自动 PASS。** 新 panel 涉及刷新/挂载就绪，相关装载/刷新/重进须重认领复验；无变化数据断言可后续按接缝继承。GNHD-01 的历史视觉 FAIL 不因另处修复自然关闭。

### 3.2 actual combo 与菜单100%的最小继承

继承 A3独立报告 §6 的真实浏览器载入同字节插件执行核心/PM可见局部 PASS；本轮另算已交完整响应 hash `e9404eb6f474b191b7b284aa04cfe3211440fb5a74f526d1c6ff3e657c1b1d60` 及提交片段 hash，均相符。该响应 fromDiskCache=true，不能声称本轮新网络传输；末尾 sourceMappingURL 不在同字节执行核心中，不误判为不同插件。

本专家目视菜单确为100%，对应本地19:50、3205、Chrome PID29351/window23677。它早于本轮 numbers-r2 12:07Z 和 OKR13:02Z，但**相同地址/图片尺寸不是同会话连续性证明**。

最小补件裁决：

1. **3205编号/OKR：** 优先补同一 browser/context/page 或 target alias、时间/时区映射、菜单帧至新帧之间无 origin zoom 变更的已保存步骤索引，及1440×900 CSS viewport/PM容器。足够则继承同 origin 100%前置，不要求逐按钮重拍菜单、不全量重采。无法回绑时仅在后续缺陷复验入口先拍菜单100%并同段采相关动作；不能拿后来菜单倒签旧帧。
2. **3213习惯：** 是新 origin，不能直接继承3205原生缩放。补本 origin 同段菜单100%和 page/instance alias、主题、CSS viewport/外窗/PM容器，再采尚缺的收起/重进动作；390沿该会话索引可复用。不要求重新恢复已完整保留的14条记录来增加截图数。
3. **运行身份：** 3205已有 actual combo 的局部核验可继承未变化执行段；3213 setup归档脚本依赖未归档的 setup/start 输入，只支持 Main 的端口/路径说明，未闭实际 PID/cwd/argv/profile/下发绑定。Main补脱敏索引和实际响应指纹，禁止交private文件或认证值。不要求为无变化插件重build。

以上只解除环境子缺口的最小路径，不改变本次历史菜单裁决、不追溯早期zoom、不为200%全球矩阵签字。

## 4. 编号原证、缺陷与历史

### 4.1 r2局部结果

[initial.json](../../reports/all-pending-evidence-20261021/A3/numbers-r2/initial.json) 两 code-cell 均62px，x593/right655；两行y583.1875/625.1875，编号1/2非空。原图任务文字从右侧相邻列开始，未被编号覆盖；第二行标题省略是任务列自身行为，本报告不把它判失败。

[执行脚本](../../reports/all-pending-evidence-20261021/A3/execution-scripts/pmtool-number-closure-20261021.mjs) 真实键盘 Tab 循环核 activeElement 到目标按钮，Enter后等待“已复制”，读取系统 pbpaste，再等反馈消失。无直接 focus 冒充Tab，无 writer mock。结果时刻12:07:42.918Z/44.624Z，expected/clipboard各为1/2；copied数组各为`["已复制","2"]`与`["1","已复制"]`。时间差不直接当1600ms精确计时证据。

真实 Browser.setPermission denied 后点击第一行，脚本等“复制失败”再取状态，12:07:46.270Z结果`["复制失败","2"]`，alerts为空。没有顶层alert是此组件局部反馈结构，不自造要求“必须顶层alert”；手动提示仅见生产 title/aria接线，未 hover/选择实际采证，不签手动复制旅程。

### 4.2 GNHD-01

| 字段 | 发现 |
| --- | --- |
| 严重度/对象 | P2，产品 GUI 反馈可读性；不豁免，不等 Clipboard 功能 FAIL |
| 原依据 | 原计划 §14.4.4/6 显示已复制/复制失败及提示，§14.5 反馈/控件无裁切；不是追溯200%新矩阵 |
| 原证 | [copied-0](../../reports/all-pending-evidence-20261021/A3/numbers-r2/copied-0.png)、[copied-1](../../reports/all-pending-evidence-20261021/A3/numbers-r2/copied-1.png)、[denied](../../reports/all-pending-evidence-20261021/A3/numbers-r2/denied.png)，实际目视并裁切放大确认“已…”/“复…” |
| 已核接缝 | `tasks.css:213-222`按钮 max-width100%/nowrap/hidden，val也hidden/ellipsis；固定62px列中还有padding/gap/11px图标。`tasks.tsx:315-326`在同一val里用较长成功/失败字串替换code。该组合与原帧裁切一致 |
| 不是何物 | 不把DOM完整文字、绿色/黄色、系统复制正确当视觉PASS；不把拒绝权限本身当产品失败；不新增全局布局需求 |
| 给 Main 的最小修复/复验 | 限编号反馈呈现与相关样式/契约，使成功/失败文字可读且不盖任务列，失败可取原编号；保持两合法code、1600ms复原、不改数据。新候选在同1440场景重验两行Tab/Enter、系统值、拒绝权限及前后manifest，交对应截图与可审过程，受影响自动契约由Main唯一执行 |

本专家不指定必须拓宽列/新增toast/重写组件，交 Main 保持既有组件边界修复。修前截图保留；当前还没有该缺陷修后原件。

### 4.3 r1不覆盖

[r1 steps](../../reports/all-pending-evidence-20261021/A3/numbers/steps.json) 首行 outline=none0px，不能签其首行焦点可见；denied采样为1/2，未保存等待失败过程，不凭这一早采样判“失败未出现”。r2明确增加异步等待且两焦点均2px，分别弥补局部弱证，不涂改r1，也不拼成全程录像。

## 5. 深色 OKR

[OKR JSON](../../reports/all-pending-evidence-20261021/A5/dark/okr-inline-error.json) 与[原图](../../reports/all-pending-evidence-20261021/A5/dark/okr-inline-error.png)实际目视一致：编辑标题“QA 深色关联错误验收”，关联输入`okr-zzz-notexist`，输入红边、唯一红字错误位于字段说明之后，全文换行没有截断，保存/取消仍在。错误bbox243.5×43.5，全文在本宽屏可辨。只签本抽屉这一次状态，不签整个深色系统色彩/对比度矩阵。

新到[归档执行脚本](../../reports/all-pending-evidence-20261021/A5/execution-scripts/pmtool-okr-dark-error-20261021.mjs)核实本次生产“保存”点击、等就近错误和全页role=alert采样；不是手改DOM制造错误。脚本从已打开的编辑抽屉开始，**没有记录主题入口选择和QA OKR新建动作**。派单补充说明这两个前置真实执行，报告保留说明但不把其升级为已审完整动作。

五domain文件包括新OKR、项目、dashboard设置、两任务。before=after=5，逐键hash相同。新建一个合法OKR是原计划已有前置，不是越界产品新增，不要求把它删掉来证明“全程零写”。侧栏OKR的0与主档存在同样不能直接当总数错；本报告不扩badge产品裁决。

A0 raw review 的四态ResultCard复制/失败有限PASS保留；其3秒持久、关闭焦点和浅深往返未齐，不能拿此OKR截图补签。Main只需补原§7未闭分支和本帧前置/环境索引，已核非法保存五文件无须重建fixture重复采。

## 6. F7恢复、月份与保护

### 6.1 合法性和恢复结果分层

[F7元数据](../../reports/all-pending-evidence-20261021/A0/habit/fixture.json)记录标准backup类型/counts、文件hash `842759ed3bb840baceda73bb3dddef201eaa56803f38569a3ed7f3735a1470ce`、当前schema对象及streak。父任务记最早生成末尾ctx.dispose误用造成exit1、之后修清理；本派单明确最新生成/预检exit0，但**未交最终生成脚本/日志/完整backup字节**。不重开schema产品缺陷，不把仅凭说明的exit0签成独立AUTO闭门。

[empty](../../reports/all-pending-evidence-20261021/A3/habit/empty.png)可见“暂无项目”，precheck/danger-confirm两图实际可读，先演练再二次确认。precheck中右侧底页缩窄、表头竖断和横滚可见；当时1440/100%与容器测量未齐，先登记该恢复预览布局异常待绑定，不凭此给新确证布局FAIL或引入新设计门。

[restore-continued](../../reports/all-pending-evidence-20261021/A3/habit/restore-continued.json)保存真实回读`restoredRecord`及文件hash；归档continue脚本明确取存储 envelope 的`.record`。其对象全字段与fixture.habit相等；**不把JSON对象等同原始文件字节**。未读取其private runtime文件，不能核存储envelope bytes/hash，也不能以尝试重序列化补造原bytes。

续采文件清单只有5个data文件，未列安全backup。本专家不推断“未生成安全快照”：可能实际backup根/采样范围不同，当前缺路径/hash/原确认响应，交Main补范围。没有cancel before/cancelled原件，不能凭最终恢复成功倒推出取消零写。

### 6.2 runner超时更正

新到[restore runner](../../reports/all-pending-evidence-20261021/A5/execution-scripts/pmtool-habit-restore-20261021.mjs)在两次确认之后用特定成功文字等待，末尾才写`restore-steps.json`；一旦早处超时，内存before/cancelled不会持久。续采真实记录存在且展示完整，**这不是恢复产品失败证明**。具体第几次超时/exit未交，不能凭Main摘要选唯一失败点。

原runner还以`习惯\n0`精确文本找菜单。生产页该0是待确认习惯建议数，不是habitRecord数；真实主档已有一条、14次记录与待确认0可以同时成立。新continue脚本改为真实`.pm-rail-label=习惯`，避免把徽标数误当恢复结果。

### 6.3 分界、展开与390

近期倒序`10-21/20/18/12/08`五条；更早10月1条（10-07）、9月4条、8月4条，合计14。current=3/longest=3遵循生产`deriveHabitStreak`相邻日期gap≤2同段，而不是另造“每天连续”算法把10-18→20当断签FAIL。

[history observations](../../reports/all-pending-evidence-20261021/A3/habit/history-observations.json)与history归档脚本互核：实际定位`button[aria-expanded]`点击，不是summary或改DOM。月份状态逐次TFF/TTF/TTT。目视month-1和month-2可见对应展开内容，month-3中8月按钮/部分内容在本纵向视口下缘；JSON可核全8月倒序及标记，不声称原图已目视全部8月四行。完整录像/纵滚范围交Main补，不重算截图数量当覆盖。

history脚本比较同一habit原文件before Buffer和after Buffer，`recordUnchanged=true`是实际执行比较，有比单独布尔声明更强的代码链，可签该执行比较局部。**仍缺供专家独立复算的前后原字节/hash；更不能扩大为全库/备份/导出零写。** 窄图htmlWidth=390无外壳横溢出，说明文字/备注换行可辨；不判纵滚为丢失、不签native200%。

原计划还要求展开后收起、刷新并重进默认折叠、今天打卡两次同日幂等、三天前命令拒绝且零写；本包未保存相应原件，不能以14条不变或旧自动脚本数量填PASS。

## 7. 交 Main 的最小补件

本表只补原门，不新增需求。优先交当次已保存原件，无法恢复的证据才补采；不要求读private/凭据，不把Main有能力的项转本人待验。

| 编号 | 最小补件 | 关闭何子缺口 |
| --- | --- | --- |
| GNHD-M01 | 按§3.2补3205同会话/同origin菜单100%继承索引；3213补本origin100%及实例/实际下发/viewport绑定 | 环境、产物/实例绑定；不追溯旧帧 |
| GNHD-M02 | 持久、脱敏、可审的相关录像/步骤事件时点及hash。确实无可审原片时只补仍缺动作，不全量复拍已验状态 | 完整动作；截图/归档脚本不合成全程 |
| GNHD-M03 | GNHD-01修后新candidate、反馈截图/DOM布局及两行复制/拒绝权限/零写复验、受影响AUTO日志；D-05/tasks-clipboard原完整自动门日志引用 | 编号视觉缺陷与§14自动契约；旧复制局部PASS按diff审继承 |
| GNHD-M04 | OKR本次宿主深色选择/QA新建前置索引；原§7未闭四页、关闭错误、顶层错误持久/复制/焦点、浅深往返对应片段 | 深色完整旅程；不重复非法保存五文件已验部分 |
| GNHD-M05 | F7最终生成/预检exit0日志、当前schema/streak/createBackup脚本、非敏感标准backup字节/hash；实际3213恢复响应/安全快照路径指纹；恢复前/取消后元数据 | 合法历史链、取消/安全恢复门。未保存cancel不能倒填；必要时同fixture只重验取消段 |
| GNHD-M06 | 原habit前后bytes或只含hash的双清单；收起/刷新重进默认折叠、今天幂等与三天前拒绝零写原件；8月可见纵滚片段 | 原§8未闭状态/写边界；已验14天分界和三月展开结果不为增加数量重采 |

Main正在修的其他三组缺陷不在本报告接手范围，不因本发现重派全任务。当前已核视觉FAIL须明确排入修复/复验，完整GUI门继续不放行。原正式保护差异及Finder缺口由其自有专家继续，本报告不改结论、不清现场、不签总门。

## 8. 自有验证与收尾

macOS/darwin，Node v22.23.3；pnpm版本仅引用父执行环境11.28.5，本专家未运行pnpm。只新增本报告、[checker](gui-numbers-habit-dark-review-20261021-check.mjs)、[result](gui-numbers-habit-dark-review-20261021-result.json)，以及自有tmp截图裁切输出。checker只读显式allowlist，禁止循证据字段去读runtime/profile；其exit0只代表比较一致，视觉FAIL/缺证不由它自动裁决。

验证命令（macOS，既有nvm Node22，不安装/构建/服务/GUI）：

```sh
cd /Users/bytedance/Projects/dsh-pm/pm-tool
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/gui-numbers-habit-dark-review-20261021-check.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/gui-numbers-habit-dark-review-20261021-check.mjs --output
git diff --check -- 'docs/testing/gui-numbers-habit-dark-review-20261021*'
```

首轮syntax exit0，checker exit1，唯一一致性告警为正在修复的主树panel与A5不同；七文件/五文件比较、F7对象/分界/月份、A3→A5三文件、combo响应和菜单图指纹均相符。未改工具期望来消除此告警，后续结果保留快照和当前变更边界。Swift仅解释执行AppKit裁切非敏感已交编号图，3张局部输出存在；未操作桌面或录制新GUI。

收尾复核快照 `2026-10-21T13:23:50.535Z`：

| 命令/核查 | 实际结果 |
| --- | --- |
| `node --check ...check.mjs` | exit0，工具语法可用 |
| `node ...check.mjs --output` | **exit1**，47原件逐hash保存；唯一告警仍为当前panel不同A5。已核47原件与源allowlist在本次复核期间无进一步变化 |
| `git diff --check -- ...本前缀*` | exit0；未跟踪文件另以Node检查尾换行/行尾空白/Markdown本地链接，exit0，0问题 |
| 自有Swift截图裁切第二次同步执行 | exit0，1.8767s；仅AppKit读原PNG、最近邻裁切写自有tmp，无产品构建或GUI |
| 产品全集/专项/AUTO/GUI执行 | **未执行**，按派单禁止build/install/服务/MainGUI；本轮只审Main原证，不称重新跑完整回归 |

checker sha256 `10207e6308cffb4fe36cd68913485f20a2a4c9d6e2605d08d19cfe642c4a2503`；result sha256 `2fb78356e5c190403d808bd2f36f3668c51eb3a49c795a41004c1a7b9a9b20d7`。重跑会改变result时间，引用须绑定快照。关键原件hash：

- numbers-r2 steps：`c511a15e4c639a275fa26242e8fd0294ba97d1481181e2b9be2ddf1f4b12ba74`。
- copied-0：`2e24489eee2ad4d98be39a4d32959569638c1bac64eddadec658cba6764281d5`；denied：`97480ea5003304b33665e4e42cdd609eedea9864fa18a727112f49c54265fe66`。
- OKR JSON：`ceff2ccba62fe1a0b0ce4d27b713219f50ddf70dc69c3c64109879540fd58edd`。
- restore-continued：`b5a93a41dcdfedada338e7d42d90775497c5df48e9cd3839e1ac4c0ba729ddfe`。
- history-observations：`a525cdd6616d53902b89c72285cfc24868baca62cc9a2b87d36509a2a0c7384d`。

**最终出口：编号复制功能/焦点/有限零写、深色OKR就近拒绝/有限零写、F7展示/月份与390有限PASS；编号反馈裁切产品视觉FAIL；缺证及修后候选未认领保持BLOCKED。没有完整B1-GUI-02/03/04或总门PASS。**

负责人收尾确认：Main已读GNHD-01，交同tasks开发作最小修复和必要CSS，后续新build、不覆盖旧帧；缺证按§7逐项补。本专家本轮有限原审证完成，不继续开执行任务、不占Main GUI/build/服务，释放审证执行槽。已签子项仍绑定旧原证，不给未来修后候选或整门自动继承；新件另行独立审查。未提交、未推送。

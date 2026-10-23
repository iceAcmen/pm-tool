# A6 看板 GUI 原证独立审证

> 2026-10-21，平台 trae，角色为独立审证专家。给 Main、负责人和接手专家使用：只审归档 A6 的原三拖、三撤销、保存/取消及实际入口装载/环境子项；不执行 GUI、不开发、不签 B8/总门/OP/Launcher，不继承 A7 当前产物。

## 1. 判定与即时发现

| 对象 | 独立结论 | 边界 |
| --- | --- | --- |
| r5 原 A→实际 D 后、B→原 A 区 row4、同 A→顶部 | **观察域局部 PASS** | 真实输入设施、149 张原帧逐帧目视、同帧目标和完整导出交叉核对；不是将任意三 delta 当原动作。编辑器 chunk 的实际字节身份仍缺证，不能升级为完整候选绑定 PASS。 |
| r5 三逆序撤销 | **观察域局部 PASS** | 完整 JSON 字节逐一等 S2/S1/S0，末撤销 disabled；七稳定态几何与导出一致、零碰撞。 |
| save-cancel-r1 两拖保存/真实 reload 回读、不同草稿取消/reload | **功能与已枚举内容 hash 子项 PASS** | 保存后及取消后完整导出严格等保存版；取消草稿不同；只在已枚举 data 根看到 dashboard_user 保存变更。未签完整磁盘内容、mtime/全资产保护。 |
| 保存成功反馈 | **局部 FAIL：A6-BGUI-01，P2** | 原帧明确显示“布局已保存并刷新。”却为红底/红边/红字错误样式；不把成功误导为错误。已即时报告 Main。严重度不构成豁免。 |
| A6 client.js 实际 uncached 完整入口响应 | **局部 PASS** | 归档 combo 2558216 字节、唯一完整执行片段、片段 hash、manifest 的 source hash 一致。只签入口，不签异步 editor chunk。 |
| 新自有 3214/PID45502 与原生菜单 100% | **环境记录子项 PASS / 后续具体缺证** | 启动/解析目标记录和实际 Chrome29351/window23677 原图可核；原菜单时点可见100%。后续 document 重载不倒签，宿主完整 git SHA/后续原生缩放记录未随窗口保存。 |
| FW-T04 完整候选身份、FW-T05 完整保护、B1-GUI-01 整项 | **BLOCKED；且反馈存在上述 FAIL** | 局部动作成功不补齐 chunk/窗口保护缺证，不扩为整项 PASS，不抹除历史 B1-FW-01。 |

**已通知 Main 的最小修复对象：** 保存成功提示的语义/样式接线。原 [B1-GUI-01 合同 §5](independent-acceptance-batch1-closure-plan-20261021.md#5-b1-gui-01-看板连续拖动) 明确要求“全程无错误横幅”。此项不是新设计矩阵，亦非保存数据失败。

原证 [000096.jpg](../../reports/all-pending-evidence-20261021/A6/board/save-cancel-r1/frames/000096.jpg)，compositor原戳 `1792592138.740572`，接收时间 `2026-10-21T14:15:38.772Z`（视频相对时间约4.271秒），sha256 `36162874009f27e260d386c2ad1c9572a47cb4492fe4800f18867f7c26327963`。前帧仍为编辑器，后续进入宿主 loading 并重进；故这是保存后的真实成功提示，不是混入其他错误截图。fixture 导入保存的原帧000009也呈同类红色提示，作为同源佐证，不计两个独立缺陷。

## 2. 授权、方法与证据冻结

父原句：“好的，按之前的盘点文档和这个分工方案继续推进，直到把所有没验完的功能全部验完，再把所有代码都提交为止，才算完成任务，中途不要停下来。”来源：[父执行记录 §1](../../reports/all-pending-acceptance-execution-20261021.md)。本子单只授权写 `docs/testing/a6-board-gui-independent-review-20261021*` 与 selftmp。父最终提交权限不转移给本专家。

已读 AGENTS、collaboration §9/§11、最新 progress/handoff/onboarding 入口、[诊断 §7](board-fullwidth-drag-diagnosis-20261021.md#7-最小修复合同与测试前置)、[独立复验 §7](board-fullwidth-independent-retest-20261021.md#7-gui-精确缺证与-main-接续)、[row4 最小合同 §2](board-drag-relative-target-clarification-20261021.md#2-不随拖动更新的原区域)。没有 fetch/pull、install/build、执行产品测试、服务操作、GUI/浏览器调用、读取 private/runtime/credentials、改他人 testing/livingdocs/lib 或 commit。

自有 [freeze](a6-board-gui-independent-review-20261021-selftmp/r2/freeze.json) 时点 `2026-10-21T14:27:43.488Z`，枚举491份归档输入的路径/字节/hash/本次归档mtime；这些mtime是**审证时文件元数据**，不能冒充业务操作前后mtime。原 [r5 manifest](../../reports/all-pending-evidence-20261021/A6/board/original-three-r5/manifest.json) 的184项全部逐字节核对；364动作原帧各自原hash、序号、时间戳和两份mp4容器样本全部核对。save-cancel原目录未提供独立manifest，其全部文件由本次freeze认领。

[机器审证](a6-board-gui-independent-review-20261021-selftmp/r2/audit.json) 保存13稳定态、电影样本时间、原保护窗口、95条verify命令、全部前置exit记录及精确缺口。[漂移](a6-board-gui-independent-review-20261021-selftmp/r2/drift.json) 核491份枚举输入零字节漂移，不声明整个工作区或 A7/其他 owner 零变化。

收尾第一次文本/归档检查exit1，只有父执行记录出现新增22:13/22:29进度补记；A6原证、合同与本审证输入其余490份未漂移。该living记录由Main持续维护，补记确认A7另认领，并未改变本子单授权/合同；这不是A6污染，也不覆盖旧freeze。原 [final-audit.json](a6-board-gui-independent-review-20261021-selftmp/final-audit.json) 保留该变化；最终另存r2检查结果。

实际审证环境：macOS/darwin arm64，Node v22.23.3，系统 Swift/AppKit。本单未运行 pnpm；11.28.5 是项目环境口径。依赖身份只比较 A6 sync 与原独立SOURCE报告的归档指纹，未以当前 node_modules/lib 替代 A6。

## 3. 候选与实际入口装载

| 归档对象 | 身份 |
| --- | --- |
| A6 sync 基线 | `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`；不是 dirty 候选单独身份 |
| sync | 528份 sourceHashes，copyDrift=[]，Main唯一builder；不是每项都属于本看板审签 |
| editor.tsx | `ba1bf91211c87c068fe0bb4cb887249f1c321e2eecb20885d6745b2cd3086761`，等原独立SOURCE复验 |
| editor-drag-stop.test.tsx | `973fa516de33a957292a7d996d6f778d765d924f480d2534b1513625074faa79` |
| editor-ops.ts | `ade6c08dd648dc02cb6813c89d159e59116052e0d3701eabd3cef414e7d06601` |
| fixture | `41c91b49024270667b5a43e2f927bc43c478b8b69384c95b157aa01643176b87` |
| package / lock | `c50ccd376a46dbf8ae9c05e9425edcecc4e052e79e748e172780137276848d66` / `646a1a27770cc32b8f07195a3e3c5b7c038aae7040dc408749719f8d76963caa` |
| A6 artifacts | 453项产物指纹；未读取当前lib |
| client.js | `1726375a196ea672f322f793a51169004348de9bc8a5e0ef28fb4a8873048c68` |
| client.editor.js | `89edce8deae392d9289720044a01b918567d16935f26f887e00def5cbbe9a6a2`，只有产物manifest，实际响应尚缺 |
| client.js.map / index.js | `b6a22645495693642f60f6be0287afabebaba460af879798a2a45d10c5024861` / `6cb0a8024b088df743b308fa81017cf71e49799b270e774129368f3b02ac1591` |

[combo.json](../../reports/all-pending-evidence-20261021/A6/loaded/combo.json) 的原执行设施启用 Network、禁用缓存、捕获实际 Script response body；没有注入业务fetch。原响应 sha256 `b900e6924016f49968c26d6ad89c9d0db1330b7d7daad0723cec2015ddbec556`，offset875361处1679384字节片段 sha256 `ad49eeb854a09c8ce3280a35d78e96b741bd628f2da7b55e5e2e983244373cfa`；完整片段第二次索引=-1。独立重算响应长度/hash、该范围hash及唯一索引均一致。sourceSha与A6 artifacts记录一致；未读取当前source bundle，不能将此表述为本专家另从当前lib重新生成匹配。

**具体接缝缺证：** [归档 combo:31960](../../reports/all-pending-evidence-20261021/A6/loaded/combo-1.txt#L31960) 的 `startEdit` 使用 `require.async("./client.editor.js")`。已抓 combo 指向 `client.js`，原设施也明确仅过滤这个入口。因此“client.js完整匹配”不证明异步editor执行字节。需要 Main 提供当时已存的 chunk 网络原件/装载日志或相应最小绑定；不能从已更新 A7 lib 回填，更不能伪造当时网络响应。拿不到旧原件则该子项缺证保留，新实例另采另签。

本轮用户补充“pm上游1142…、A7新backup/panel已同步但board源/依赖不变、A6旧运行保内存client”照实记为**Main补充事实**。归档 main-start/setup 未保存完整宿主SHA，补充事实不代替实际启动时点完整绑定；也不推断 A7 改动必然污染 A6 已归档 GUI。

## 4. 原 GUI 逐帧目视与动作

原 [r5 execution](../../reports/all-pending-evidence-20261021/A6/board/original-three-r5/execution.mjs) 与 [save/cancel execution](../../reports/all-pending-evidence-20261021/A6/board/save-cancel-r1/execution.mjs) 仅用 Puppeteer真实mouse move/down/up、真实button click、导出下载和page.reload。命中探针记录 start 的elementFromPoint；每拖保存 start/down/drop 三段、buttons0/1/1、30次move与末同格小move，finally mouse.up。DOM evaluate仅观察，本单未执行这些脚本。

全部原帧在按序、带原文件名/相对时间的自有联系表中逐帧目视：r5八张表覆盖000000..000148；save-cancel十一张表覆盖000000..000214；fixture一张表覆盖13原帧。关键drop PNG和保存反馈原帧另外按原尺寸目视。联系表只作为专家审阅辅助，保完整帧缩放，不成为新执行原证。没有以截图数量或DOM全绿代替目视。

| 段 | 实际目视过程与原证 |
| --- | --- |
| r5约0.000..0.317秒 | 初态、导出面板真实开关、滚动定位；卡库/配置未打开；S0导出等原fixture、撤销disabled。 |
| r5约0.369..1.071秒 | A浅蓝拖动态沿真实路径越过D；drop A.top728.828125≥当前D.bottom427.828125，placeholder.top679.828125；此处A底超视口并非远推稳定态，松手后回可见D后。 |
| r5约2.286..2.971秒 | B从当前顶部向原A区row4移动；placeholder最终row4。drop实际卡顶比row4多1px来自末同格move，松手后严格row4，不拿占位旧帧或仅目标指针冒签。 |
| r5约4.318..4.940秒 | 同A抓取前仍在D后；实际向顶部返回，浅蓝手势结束，稳定A row0。 |
| r5约6.040..6.649秒 | 导出面板开关与三次撤销交替；逐字节恢复S2/S1/S0，末disabled。没有保存。 |
| save/cancel约0.399..2.993秒 | 原A→实际D后与B→row4两拖完成，稳定保存草稿。 |
| save/cancel约4.271..5.683秒 | 保存成功红色提示、真实宿主loading、PM选择及重进编辑；导出严格等save-draft。 |
| save/cancel约6.023..6.627秒 | 同A形成不同cancel-draft；不是空手势凑取消。 |
| save/cancel约7.861..9.036秒 | 取消离开编辑、真实reload loading、PM选择、重进/导出；保存版保持。 |

本轮是**浏览器viewport合成原帧**，不是OS全屏录像；没有地址栏或cursor overlay。指针身份由原输入脚本/同帧hit与buttons和连续手势画面交叉证明，没有声称看到了实际光标。没有拼假业务画面或裁剪；部分raw帧栅格为720×450，reload时还出现1440×718/1440×770，封装代码按整帧缩放到首帧1440×900，因此不能声称mp4全程原分辨率、全程CSS固定900或OS窗口无遮挡。稳定动作states均为1440×900浅主题；reload过渡单列，不以过渡尺寸倒签原生zoom。

mp4独立ISO BMFF检查：r5共149样本、容器时长7.048333秒，save/cancel共215样本、9.435秒；分别sha256 `773c148ff5b7c979b36e61ba4654ec6ac915315b3cce9286c812a43242ba7e90`、`bb8f8cd39aa5db57b59002784e53cc6f2bfbf3cb05c2810c15c85092aed04fd4`。原帧戳严格递增，与样本时间最大差约1.59/1.61ms，符合原封装1000时间基量化。原序列最长无新帧约1.085/1.112秒，处于松手等待/稳定导出前；不伪称恒定fps或间隔内另有目视原帧。

## 5. 完整布局与保护窗口

按原A/B/C/D/E/F顺序：

| 状态 | y | 完整回读/几何 |
| --- | --- | --- |
| S0 | 0/6/8/10/12/14 | 等原fixture，undo disabled |
| S1 | 6/0/2/4/12/14 | A6≥D4+2；不硬锁pure实验A11，原合同允许不同合法稳定位置 |
| S2 | 6/4/0/2/12/14 | B footprint=[4,6)，完整落原A区；不同于S1 |
| S3 | 0/10/6/8/12/14 | 同A回原顶部；不同于S2 |
| undo1/2/3 | S2/S1/S0 | 每份导出含scope/version/widgets及所有字段，字节严格相同，末disabled |
| save-draft / saved-reentered / cancel-reentered | 6/4/0/2/12/14 | 三份完整导出字节严格相同 |
| cancel-draft | 2/10/0/8/12/14 | 与保存版完整数据不同；松手前顶区目标、最终合法压实位置，不另硬锁row0 |

13个稳定态均六ID/type/config/x/w/h/min完整保持、bbox y与导出相符、936px宽/原卡高保持、canonical零相交，grid bbox.height=828px、stage bbox.height=861px、stage.scrollHeight=856px，外壳scrollWidth=clientWidth=1155。口头“stage856”具体对应scrollHeight，不能把bbox861混成矛盾；初次commentary已纠正该指标混淆。

原r1 null scrollIntoView、r2/r3下载未完成设施失败保留无PASS。r4虽三撤销可逆，实际S2=`9/15/0/2/4/6`，B row15并非冻结row4；不借别名或ref6把它当成功，也不抹除该轮偏离。r5是独立新原动作序列。

| 窗口 | 可核范围 | 未覆盖边界 |
| --- | --- | --- |
| fixture import/save/reenter | data三键→四键，只新增dashboard_user，项目/原session/workspace hash不变 | files/backups/exports/附件/mtime未随窗口列全 |
| r5三拖/三undo | data四键/hash前后相同，files={}、backups={} | 只有文件hash，未登记目录存在/mtime/localStorage/其他实际写根 |
| 保存 | data四键保留，仅dashboard_user `4619103f…`→`3d75c879…`；files/backups枚举不变 | 无保存记录完整原字节副本，不能独立对盘JSON完整字段等导出作hash重建 |
| cancel/reload | cancelBefore与after三枚举根严格相同 | 同上；不是完整全磁盘无写证明 |

保存后timeOrigin=`1792592138725.9`、取消后=`1792592142326.7`，不同于原r5/保存前=`1792591190212.5`；同origin3214，原帧确见加载/PM选择，支持真正重载，不用React重挂替代。原菜单100%时点document=`1792590615531.4`，之后combo重载document=`1792591190212.5`。未见zoom动作不等独立保存了每个新document的原生菜单100%，不会倒签此前或后续。

## 6. 前置原日志与本专家实际命令

原前置不是本专家运行：[build目录](../../reports/all-pending-evidence-20261021/A6/build) 的四项有效exit为noEmit0、build0、tests-r2 0（133文件/1229 tests）、verify0（95/95）。原tests首轮exit1，archive两例受“候选隔离模式仅允许相对导出子目录”拦截，按原件保留，不把它覆盖成绿。r2记录明确未设isolated-export覆盖、显式隔离file root；本单未独立执行这些产品用例或审签所有1229断言。

原verify列出的守护根是**隔离worktree**内data、packages/backups、packages/backup、exports、assets，before=after5、污染0；日志使用“正式”词不使它成为实际正式3172/旧3199/pm软链/主树资产保护证据。95条实际命令全列在audit.verifyCommands，本单只核退出及原日志，不签其所有业务范围。

本专家实际执行，运行于macOS仓库根：

```sh
cd /Users/bytedance/Projects/dsh-pm/pm-tool
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/a6-board-gui-independent-review-20261021-check.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a6-board-gui-independent-review-20261021-check.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a6-board-gui-independent-review-20261021-check.mjs r2
swift -module-cache-path docs/testing/a6-board-gui-independent-review-20261021-selftmp/swift-cache docs/testing/a6-board-gui-independent-review-20261021-contact.swift reports/all-pending-evidence-20261021/A6/board docs/testing/a6-board-gui-independent-review-20261021-selftmp/fixture fixture-import-frames
git diff --check -- 'docs/testing/a6-board-gui-independent-review-20261021*'
```

- Node语法、首次/r2原证审计、fixture联系表、diff检查均exit0；r2核491原件、13稳定态、364帧及两份视频样本时间，零断言失败。
- 首次Node审计读mediaDuration而非movieDuration，得到6.6567/9.0367；修自有检查器解析mvhd再用新r2根，得7.0483/9.435。两轮结果都保留，未改视频。
- 自有Swift初次两次联系表生成调用，分别以r5/save-cancel为输入、输出本selftmp对应目录；全部19张联系表已落成，但末AVFoundation导出JSON含NaN触发 `NSInvalidArgumentException: Invalid number value (NaN) in JSON write` / Abort trap6（外层134）。原图逐帧审阅仍有效，错误属于审证设施、不算产品FAIL；未伪称这两次命令exit0。后改自有Swift仅生成联系表，用Node结构化MP4解析替代，fixture实运行exit0。没有再次覆盖原表或原证。
- 只读cat/find/sed/grep与图像查看只用于审证，不计产品测试。初rg127不可用、两个指定memory路径不存在exit1，已用仓库事实继续。
- GUI runner只有stdout `{states:16,last:'undo3'}` / `{states:15,last:'cancel-reentered'}`、final boundary，无独立外层exit原件；不以这些声称执行命令exit0。

## 7. Main 最小接续与签署范围

1. **修确证A6-BGUI-01成功红色横幅**：不改本报告/原证；绑定新候选的实际反馈接线与原成功提示，再采成功/失败区分及受影响回归。若A7已改相邻panel，须提供影响对照并按新字节审，不用新源码“解释成旧图已正确”。
2. **补异步editor实际装载最小绑定**：只有A6既存原件可补A6；当前lib已A7不当旧source。拿不到旧原件保BLOCKED，新实例另认领。无需本专家探测服务或读取private。
3. **补精确保护缺口**：操作窗口实际写根/附件解析、全键集hash+mtime、目录存在信息、保存dashboard完整落盘副本、localStorage历史；正式端口/profile/必要既有保护记录只补原已要求范围。不能凭日志“正式”字样签正式保护，不要求全disk扫无关新门，不能事后造操作前mtime。
4. **环境子项**：补实际宿主完整启动SHA、后续已存document/原生菜单记录；不能倒签100%或把缺证自动归本人MANUAL_PENDING。后续新实例的combo/菜单另采另签，当前局部观察不因单纯同origin自行升级。

原B1-FW-01顶部大洞/显示与导出分离现象在r5这七稳定态未再出现；可签该**观察症状复验局部PASS**，历史FAIL原件仍保留。完整FW-T04候选/装载链缺件与FW-T05保护缺件，以及本次保存反馈FAIL，决定当前**不签B1-GUI-01整项、B8、积压总门、OP、Launcher或发布**。

审签者：trae独立A6看板GUI原证专家。采证者：Main。开发者：原board开发角色；本专家未修改产品。写根仅本前缀文件/selftmp；没有未退出的自有审证进程或需要继续等待的GUI/服务任务。本子单收口，由Main按父持续授权继续限定缺陷/补采，不以本子单替代父积压任务完成。

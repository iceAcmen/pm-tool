# 全部既有未验功能最终范围对账

> 给负责人、Main 和接续独立专家使用。2026-10-22，平台 trae，角色为独立验收范围对账专家，非开发、非 GUI 执行端。仅审已有合同、专家报告和归档指纹；本文是总范围结论，不是新的产品测试、用例或局部 PASS 扩义。唯一写面为本文件。

## 1. 总范围裁决

**当前不允许把全部本批代码统一普通 commit；父目标尚未完成。**

这不是否定 A20V3 或 U4 的 PASS，也不是发现整包运行失败。准确状态为：**本批最终候选已有完整自动回归及多个独立局部门 PASS，但原总登记仍有可执行 GUI/旅程未签和最终继承映射缺口，不能宣布全部既有未验功能验完。** Main 可以同步档案、准备选择性 stage 清单，但应等待总范围缺口关闭，不能据本报告执行 stage/commit。本文不执行任何 Git 写动作。

父任务原句，见[执行记录 §1](../../reports/all-pending-acceptance-execution-20261021.md#1-父任务与授权)：

> “好的，按之前的盘点文档和这个分工方案继续推进，直到把所有没验完的功能全部验完，再把所有代码都提交为止，才算完成任务，中途不要停下来。”

| 判断对象 | 当前结论 | 依据与边界 |
| --- | --- | --- |
| A19 GM01 / HC01 | 指定展示缺陷已分别关闭 | GM01 建议自身关联和 HC01 旧卡换行分别有独立 GUI 签字；不是整习惯页 PASS |
| A20 总门 | PASS | [A20V3 报告 §1/§8](a20v3-total-gate-independent-review-20261022.md)仅裁 A20 与 U4 准入，不授权提交，不裁其他积压 |
| U4 整项 | PASS | [U4 r2 报告 §1/§6](a13-u4-gui-total-retest-r2-20261022.md)仅关闭 RA-U401/RA-U402；明确“不裁决 U4 之外余项” |
| 全部既有未验功能 | **未验完 / 不予总范围 PASS** | [总登记 §2/§7](remaining-acceptance-register-20261021.md)要求所有适用 ID、历史继承、本人条件及逐域总出口；以下 §4 保留可执行缺口 |
| 全部本批代码统一 commit | **当前不准入** | collaboration §9.3、§11.5；授权为验完后的普通 commit，不是未签余项豁免 |
| 父目标完成 | **否** | 验收总出口未闭，且尚未完成父目标要求的普通 commit；两项分别记录 |
| push / tag / 发布 / 正式切换 | 本次不授权 | 不以 commit 授权推导其他动作；也不要求为普通 commit 增加发布专属门 |

直接阻断“已经全部验完”的现存反证至少包括：[A18 反馈控制 §1](a18-feedback-controls-gui-review-20261022.md)明确保留标记原因、同值代际/复制竞争 GUI BLOCKED；[A16 选择/扩展 §1](a16-extension-selection-gui-review-20261022.md)保留再生成后的实际执行 base 缺证；[材料组合补审 §1](a18-material-composition-gui-review-20261022-visible.md)明确不签 RA-M02、RA-J03、RA-J04；[原旅程 §6](remaining-journey-cases-20261021.md)的页面/层/卡/320/读屏还没有全范围签署。任一项都不能由 A20/U4 自动回归数取代。

## 2. 依据、截点与候选

完整读取：`AGENTS.md`、`docs/collaboration.md`（含 §9/§11）、父执行记录、[总登记](remaining-acceptance-register-20261021.md)、[A18 截点对账](remaining-acceptance-delta-20261022.md)、[逐 ID 台账](remaining-acceptance-delta-20261022-ledger.md)、原 [journey](remaining-journey-cases-20261021.md)、[objective](remaining-objective-cases-20261021.md)、[governance](remaining-governance-cases-20261021.md)、[layer-map](remaining-layer-map-20261021.md)。另核 A19HC、A20/A20V2/A20V3、U4 r1/r2 及 §3 所列新增专家报告。原台账 E01..E24 的报告与原证指针保留，不覆盖其 A18 截点状态。

只读核对时点：**2026-10-22 18:02:03 +0800**。Git 基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，工作树 dirty；当前身份是基线加本批差异，不能用 HEAD 或包版本单独认领。

| 对象 | 本次实读指纹 / 核对结果 |
| --- | --- |
| A19HC candidate | `03efd7b68efc22247c677b48fed66cdcb1746c9275b66b1d8d071f8f329f5bb2`，与两份 A19HC 专家报告一致 |
| A20V3 candidate | `6409de168a76a72d8ad691cf96a44ac7d0b4f9f2dae0f43886326ef63f23bec2`，与 A20V3/U4 准入引用一致 |
| U4 r2 manifest | `26f093c3f8fbc243a28cb736f452b6fc8aa1ed90ec7403bc14a94fac4948fba9` |
| U4 r2 专家报告 | `7b73f4f2fa7a3b8bcea95acf4258e369f91ff9c94427ebeb7e047c0e05c5be8d`，与交付边界登记一致 |
| U4 delivery-boundary | `b0fa26dd004431d978a8ef156351160bc65564c15256e0f321b28c2f9c7f76c8`；是交付元数据，不是 U4 外总签字 |
| 当前产品改动全集 | A20V3 `source-files.sha256` 95 项，加 U4 `increment-files.sha256` 10 项，去重为 **102 项**；主树逐项 SHA 一致，missing=0、differences=0 |
| 当前 Git 路径集合 | packages/launcher 65 个 tracked 差异，加限定 src/scripts/launcher 37 个未跟踪输入；全部被上述 102 项认领，unclaimed=0 |
| U4 r2 声明原证 | GUI 32 件 + 最终回归 11 件 + 保留失败 5 件，共 **48 件**逐 SHA 一致；不冒称本次重审全部截图或全冻结树 |

U4 冻结树为 `/private/tmp/pmtool-u4-closure-20261022-r2`。专家报告的 3257/PID88698 是被测实例记录，本角色未探活或操作。只读字节核对证明当前本批代码没有脱离所审候选，**不证明该候选未执行的功能已经验收**。102/48 是文件数，不是功能数或通过率。

## 3. A18 以后有效补签与取代

下面只更新原台账的具体余件，不重写原 FAIL/BLOCKED，也不把局部报告合并成全系统 PASS。

| 域 / 原余件 | 最新独立签署 | 本次有效处置 |
| --- | --- | --- |
| GM01 / RA-P3001 建议自身 OKR 展示 | [A19 建议 GUI](a19-habit-association-gui-review-20261022.md)及[补正](a19-habit-association-gui-review-20261022-correction.md) | pending/confirm/ignore、缺失/无关联和长内容的指定展示关闭；699 原件所属 A19。五旧 Launcher probes 仅保存，执行扩义撤回；不推翻 GM01 真实证据 |
| HC01 旧习惯卡长 OKR 裁切 | [SOURCE/AUTO](a19-habit-card-wrap-independent-retest-20261022.md)、[A19HC 回归](a19hc-full-regression-independent-review-20261022.md)、[GUI](a19hc-gui-independent-review-20261022.md) | 指定三文件与 1440×1000/390×844 深色旧卡视觉关闭；未关联建议控制通过。自动报告里的 GUI BLOCKED 由专门 GUI 件补齐，不变成整 A19 门 |
| GNHD-01 反馈裁切 | [A19 编号视觉 §1](a19-number-visual-retest-review-20261022.md) | 两编号、真实系统复制、全文成功/拒绝反馈及复原的 1440×900 深色切片关闭；不再派修原裁切 |
| 编号手动取值诊断 | [补证独立审查](a19-number-manual-diagnostic-independent-review-20261022.md) | GNHD-MAN-D01..03 关闭；D5 字形内真实拖选、native Copy、系统值和普通文本控制成立。D3/D4 失败保留；不同浏览器上下文、标题 bbox 仍未签，不重做已成功手动诊断 |
| RA-M01 组合主保存及重开可见 | [组合报告](a18-material-composition-gui-review-20261022.md)、[可见补审](a18-material-composition-gui-review-20261022-visible.md) | 一次 basic+原 link 备注+E1 append、E2/E3/冻结/字节保全及重开备注/rv4/E1 四版可见关闭；不再重保存或重采这 43 件，不扩新任务文件组合和两非法组合 |
| RA-P2003 同项目建议处理 | [OKR 旅程报告](a18-okr-journey-gui-review-20261022.md) | 三 pending、一 confirm draft KR、一 ignore、重复拒、clear 两 processed 保第三 pending、重进切片关闭；原错误视觉、异项目动态反例不随之关闭 |
| RA-P0008 三个台账余件 | [A19 check 余件 §1](a19-p0008-check-remainder-review-20261022.md) | task 单项、叙事非材料、wrapped 在 check 消费点关闭；继承 A18 五规则 25 步，不再派“补五规则/这三个余件”。不扩成所有 wrapped 消费点或界面矩阵 |
| A20 file-count / RA-P0007 | [A20 SOURCE/AUTO](a20-file-reflection-independent-retest-20261022.md)、[运行时原报告](a20-runtime-reentry-gui-independent-review-20261022.md)、[A20 总门裁决](a20-total-gate-independent-review-20261022.md) | 原业务落盘/重读/同根重进有限通过；旧正文不可见 FAIL 保留，由同候选链 A20V2 新可见性证据定向取代；RA-P0007 整体可按专家明示记 PASS_LIMITED，不恢复为旧 FAIL |
| A20V2 / A20V3 | [V2 GUI](a20v2-gui-independent-review-20261022.md)、[V3 总门](a20v3-total-gate-independent-review-20261022.md) | SR-G01..06、SOURCE/AUTO 已签；SR-G07 N/A。V3 仅两个 verify 修正，补完整回归后解除 A20 BLOCKED，准入 U4；不外推其他 slash 命令/未采错误旅程 |
| RA-GAP-U4 / RA-U401/402 | [SOURCE/AUTO](a13-u4-independent-retest-20261022.md)、[r1](a13-u4-gui-total-retest-20261022.md)、[r2](a13-u4-gui-total-retest-r2-20261022.md) | SOURCE 缺口已补；r1 的 390 裁切 FAIL 和列持久缺证由 r2 定向修复/补证关闭，当前整 U4 PASS。不再采方向/换序/旧快捷清链/四列持久/父叶分组头相同切片 |

## 4. 逐域已签与未签

本节与原逐 ID 台账并读。未逐一重新列出的子断言保留原台账，不删除 ID；“未签”指适用合同尚缺原证或最终继承，不把每个缺口新判产品 FAIL。

### 4.1 第一批体验、Launcher 与 B1-B8

| 域 / 原 ID | 已签可保留 | 尚未签及最小原动作 |
| --- | --- | --- |
| 看板 D01..04、B1-GUI01、RA-D02/03、RA-B401..404 | A8 三原拖/三 undo、save/reload/cancel 内容与 client/editor 下发；R4 分组/唯一主按钮等历史切片 | 精准取消保护、宽窄卡库/配置互斥让位、深色中底滚动叠层、项目/legacy/scope save/reset 隔离、跨宽拖缩投影、公式/多 sort 实际保存、失败重试。D04 先核无行为差异继承，不重三拖 |
| 编号 D05 / B1-GUI02 | §3 GNHD-01 与 MAN-D01..03 已闭，原合法值/焦点/复制保留 | 原不同浏览器上下文拒绝链及遗漏标题 bbox；先交已存原件。U4 已改 tasks/CSS，编号整门还需接缝继承说明；不能再把手动失败诊断当当前未闭产品缺陷 |
| 删除 D06 / RA-D06 / MENU34 | 原唯一主按钮、domain 保护等历史切片 | 合法关联父子任务的危险确认范围、cancel 零写、真实隔离失败保输入与重试；不加“所有删除必须 undo” |
| 甘特 D07 / RA-D07 / B5 | 原键盘调期持久与 OP 双轨修后 AUTO | 实际阈值内移动零日期写、双击/Enter 详情与焦点返回；日/周/月视图、相应页面状态原证，不重已签键盘子项 |
| 关联 D08/D11/D12 | 任务↔里程碑、draft 交付物主保存历史 PASS；深色非法 OKR 就近拒 | 当前 draft cancel/save 与 quick 即时加/移/跨项目拒分开；原 OKR schema 全 kind 合法标题/重进与非法保输入，不能用一个非法 ID 代全合法集 |
| 反馈 D09 / B1-GUI03 / TF-X08 / BF-G02..04 | A18 两格式普通网络错误、常驻全文/67byte copy/retry，正常失败词标题与明确 discard/close 后新编辑成功；单前缀/分享裁切局部修后 | 真 catch 原因含 summary/detail/action 标记、无原因动作、同值 generation/迟到 copy/timer、原关闭保稿分支；BF 保存/刷新失败、reset 两确认失败恢复、queue refresh、chunk 失败关闭重试；O3/O5 同页另行，不借普通 Failed to fetch 外推 |
| 长历史 D13 / B1-GUI04 | 合法 F7 十四条/月展开/D-13 分界/390 局部与习惯三天正负写守卫 | 原同 origin/实例绑定、收起刷新重进/历史字节、预检 cancel 的保护缺证；不重已签月份展开或非法越窗写 |
| Launcher / DESK01/02 / BA-JOURNEY01 / BA-PATH01 | 路径/nonce/代际/TTL 有限 AUTO，130/601 秒 HTTP，新 tab N1/N2 S4 与箭头四档已签 | 完整 Finder→个人 Chrome PM 原动作/实际 loaded 链、同 control A→B 替换旧回告拒、same-mounted hash-only 回告；优先补原 stub 完整 argv/child status/env。新 tab 不等 same-mounted，HTTP 不等认证 GUI |
| PATH01/02 | 四格十二命令及六根保护已有有限 PASS | 只补原 argv、子进程状态和路径/环境索引；缺档保历史边界，未变路径断言先继承，不重跑全部四格 |
| B1 / 任务壳 | 导入、编号、OP、U4 和部分表单/错误旅程分别已签 | 默认 pilot OFF/ON 各异常卡→同任务保存返回、loading/error/stale/noresult、对应层及页面矩阵；U4 排序整项不能代任务页整项 |
| B2 / 材料 | §3 组合写与历史可见，增量保史/raw 守卫 AUTO | §4.2 的两非法组合、新建别名组合、冻结更新最新、旧新双读；B2 不等 RA-M01 切片 |
| B3 / 文件恢复 | 安全/原子修后 AUTO、fresh 原生取消/去重/save/download、故障重选、Strict effects 已签 | §4.2 的共享断联、host 收件后迟 201 GUI、完整 UI 备份与非空恢复/故障回滚；不因 Strict 自动门重开 renderer 争论 |
| B4 / 看板 | 三拖/撤销/保存及 board multiSort/字段白名单局部已签 | 上述看板 scope/跨宽/配置/16 卡公共动作、失败恢复；tasks U4 已闭，不与 board 引擎混算 |
| B5 / 规划与人员 | 甘特、风险、人员数据层历史与治理 AUTO | 甘特点按、里程碑四态/完成日期、people MAX/未分配/烂尾建议目标返回、320 填充风险；不是未实现 |
| B6 / 记录 | 会议稳定行主 save/取消/局部八档，当前摘录固定与安全 preview | 会→任务→交付完整串联、issue 真正关联、manual/session 报告保存/导出及长菜单/键盘/缩放；不重做会议两行保存 |
| B7 / 成长与副驾 | 来源 AI01..03、PC 三路径/四 update、习惯/OKR守卫及 §3 新闭门 | §4.3 的四 create/再生成执行、故障/取消、P0-P3 剩余、关系/聚合呈现；不是 A20 或 HC01 门 |
| B8 / 总集成 | 当前最终 AUTO 已签，多份限定 GUI 已签 | 全适用 ID 与历史继承的总出口、原矩阵/层/卡/320/读屏；缺少此层正是不能统一 commit 的范围缺口 |

### 4.2 旅程、材料、文件、固定汇报与 OP

| 原 ID / 域 | 已签可保留 | 最小剩余原动作 |
| --- | --- | --- |
| RA-J01/02/03/04/05/06 | 多个子段分别有签字，J03 原子 domain/J04 修订固定/J06 恢复片段保留 | J01 默认/试用发现异常→主 save→返回原卡；J02 同行动项转任务→补 ms/dlv→回会议重复转换；J03 两资料+进展+真文件的取消/保留/放弃与一次主 save；J04 主动选 current 复合 refs→固定→源再软删→旧 MD 出口；J05 done/check→人补材料 final→OKR/habit/checkin 串联；J06 UI 创建备份→预检 cancel/confirm→完整新宿主回读。不能拼不同候选/任务子段冒完整旅程 |
| RA-M01..07 | M01 新组合/可见补件，M03 append/软删/首次恢复；M05 非空 raw 拒/空首次 raw/apply AUTO | M02 两非法组合保输入后合法修正；M03 候选排除与重复 active/unknown 拒；M04 V2 不改冻结→既有更新最新→断联；M06 两 link 别名+progress refs 新 draft 与坏 alias；M07 原双读出口/basic 保键。M05 AUTO-only 不添 GUI |
| RA-F01..05 | fresh 中文两同 hash 一次 save/重开/下载安全头/匿名拒，abort/失败重试与 Strict effects AUTO；白名单/根/symlink 修后及共享 GC AUTO | F01 原生 sheet cancel 未采动作、与 progress alias 组合；F02 真 host 收字节后迟 201/取消 GUI；F05 断一引用→另一下载→断末不自动删除，GC 用现有隔离命令。F03/F04 已签安全/字节断言先按修后接缝继承，不新增恶意文件 GUI 或完整解码 |
| RA-F06/07/08 | 路径恢复 13 表/双字节、新预检接缝 AUTO；两确认/带前库安全快照/三预检拒等 GUI 子项 | F06 真 UI 备份到非空恢复、新宿主全入口/字节回读；F07 隔离提升/写失败 UI 保原库与恢复；F08 旧格式兼容/实际 pilot OFF 保键按原 AUTO 合同核定。sessions 不在 F5 备份表，不加新恢复表 |
| RA-R01..05 / D10 | current refs 固定、rv5 后旧报告不变、安全 preview，manual/session/互斥/覆盖守卫 AUTO | current 取消重选复合 refs/软删越项目不可选；错误保输入后成功；源软删后旧详情/preview/export；session 无 ID 拒/合法 ID 生成保存/来源只读；安全 MD 实际 save/reopen/固定 MD 导出拒覆盖与 confirm。固定报告只有 MD 出口，项目 web/plain 不冒固定报告三档 |
| OP 原 57 ID / RA-OP01..06 | 原派生/守卫/深树/队列写、修后三消费点/人工双轨有限 AUTO，实际 30/0/clear、Space100/50 三页和报告 66 已签 | 先逐断言继承未变纯 derive/深树/幂等/doctor，不重造 10000 节点；GUI 合并补报告 manual30/0、无清单 manual40→clear/null/cancel-clear、wrapped 迁父/改 todo 后集合与消费者、effort/evidence 合法/拒/出口、completedDate done/纠正/revert/只读、合法旧包只 browse 零写、F2 真390标签与新宿主回读。RA-OP06 原 AUTO-only 不添 GUI |
| RA-N01 / RA-IM01 | file busy/恢复、CSV/XLSX 六原生路径/非法列/新 trace/失败保 preview 重试已签 | 原 task/OKR/habit fresh 延迟主提交防双写与取消在途 AI；仅保原合同要求的同帧/host 后失败边界，未采不说通过。非法后行预检已修，不新增导入 I/O exactly-once/全文件事务需求 |

原 journey 中 rv2 `selectedRefs` 成功和 active 二次 restore 成功已由[有效 Oracle 纠正](materials-files-reports-independent-auto-20261021-oracle-correction.md)取代：current revision 用 selectedRefs，历史用 excerpts，重复 active restore 是 error 零写。上表不恢复旧错误预期；branch 单独合法也不新增“必须 repo”。

### 4.3 治理与 P0-P3

原 32 ID 的有限 AUTO 保留，最终只继承未受影响断言。下列“关闭”不涉及全页面/本人业务价值验收。

| 原 ID | 已签 / 有效继承范围 | 未签及最小原动作 |
| --- | --- | --- |
| RA-AI01..03 | A12 十来源/同名跳转、changed/missing/重校历史/新进程、三个 mode 共台账原 GUI 门已闭 | 无原来源功能性剩件；最终 panel/导航/接线差异重绑定，不重删来源、重校或十次跳转；历史 stop 缺档独立保留 |
| RA-AI04 | GG clean/changed/mixed AUTO、A16 PC-G01..03、选择编辑/最小化/cancel、fresh clean/mixed 相关 GUI | 再生成后真实执行 base/原请求；其余 changed/mixed/失败撤销和句柄生命周期按原证映射。已签取消不是再生成执行，已签 fresh undo 不重做 |
| RA-AI05 | 四 create 来源/白名单 AUTO；四 update clean/conflict/fresh undo GUI | 四 create 实际 GUI、delete/unknown/跨项目/wrapped/资料数组拒、applied-only refs 与计划拓扑；不重四 update |
| RA-AI06 | adapter 故障/abort/恢复 AUTO | 既有真实故障/限流/乱码/取消/正常恢复 GUI、一次真实授权模型非空来源与重校；本人条件见 §6 |
| RA-P0001/02/03/04/06 | context/窄集/capture/metric AUTO，attach 合法/非法+TaskForm 回读切片 | 有/无材料 ask 可见 context 后 cancel；合法窄集明确确认与非法拒；capture draft cancel→确认→任务/来源/reentry；capture 附 evidence 支路；metric 与真实账本逐条读回。不新建统计页面 |
| RA-P0005 | 同 task/session 两 bind、notes、项目隔离及新 host 回读已签 | 未变同对断言可继承，无需重 bind；不称 sessions 已由 F5 恢复 |
| RA-P0007 | A20V3 继承的 RA-P0007 PASS_LIMITED 及既有反思人 final 切片保留 | 不重 file-only/mixed/empty 新草稿。进程 PID 缺件、非空历史 final 仅 AUTO、其他命令/键盘/视觉质量等按原专家限定记录，不拿此局部门代 J05 或 L2 |
| RA-P0008 | 五规则25步及 task/叙事/wrapped-check 三余件已闭 | 不再补相同业务切片；相应层/可达/矩阵最终映射仍另列，不新增全阈值/失败矩阵前置 |
| RA-P1001/02/03 | queue list/open/rest、普通 mute/unmute/关键豁免、当前 quiet/off GUI，TTL/absence AUTO | absence-only/缺席历史/跟进目标刷新、合法过去 mute 到期实际呈现；quiet 跨午夜 AUTO 继承，不等午夜重测 |
| RA-P1004/05/06 | 最新 snapshot 零模型调用、L2 幂等/关联守卫、people 负载阈值 AUTO | 旧 ask 投影→刷新→最新值/时间→目标返回；achieved/accepted 两真实事件→反思→人 edit/final；people 同 MAX/未分配/烂尾筛选与打开目标，不增 WIP/倦怠裁决 |
| RA-P2001/02 | 三档相对出站/覆盖确认/本地只读不跟随源、审计前缀只增 GUI及 31/29 天 AUTO | 原恶意内容安全 GUI、合法31/29天历史导入后出站位/归档重开；绝对 web 原未 done 历史保缺档，不补造历史成功 |
| RA-P2003/04 | §3 建议处理切片；单主父/软联/非法关系 AUTO | 原重复拒错误可见、异项目动态隔离/clear；KR primaryA+relatedB 树/切关联/人确认、非法保输入与全 kind。A20V2 只测 reflect 错误，不自动签这次 OKR 错误 |
| RA-P2005 | wrapped stats/queue/check/reflect 命令切片、AUTO不计客观/保清单/AI拒；§3补 check | people/board/objective 实际消费者与改回 todo，AI拒 wrapped GUI；不拿 check 消费点外推全部 |
| RA-P2006/07 | lesson 来源/三标记/人final/repeat/新host读回、archive/review AUTO | lesson 未变核心切片继承；archive/review 真命令 JSON/MD与现有文件/素材入口、周期/量化回读，最小 archive 不等完整 backup，不新建页面 |
| RA-P3001/02 | 建议 confirm/ignore/repeat 守卫、GM01 展示，D/D-1/D-2/repeat及D+1/D-3拒已签 | 原错误正文可见及对应层/键盘未签；不重复建议自身关联与三天写入 |
| RA-P3003/04/05 | F7历史/断签 AUTO与月展开局部，关联编辑/人final/跨项目拒/解绑重联 GUI，cycle disabled AUTO | F7收起刷新/同源/历史保护；另一同项目目标/missing/失败表单保输入；按 OKR 只读聚合与 cycleDue 现有通道认领。无聚合按钮先核合同和现有命令/读出口，不新造按钮、不判产品 FAIL；不要求 H6 后台 |

### 4.4 界面层、专项与工程

| 域 | 已签 / 继承 | 未签范围与处置 |
| --- | --- | --- |
| 原 RA-V 页面矩阵 | 会议局部八档、Finder箭头四档、人工/清单/恢复/HC01/U4/反馈各限定视口切片 | 原 journey §6.1 的12 route×四宽×浅深×100/200×六态及 tasks stale/noresult，原索引展开1184格。**没有独立完整精确格映射总签署**；先映已有时间段/候选/状态，只补格内未覆盖动作/恢复/键盘/目视，不用局部图批量置绿 |
| RA-DR01..42 / MENU01..39 | 各业务表单、关联/导入/副驾/视图有限动作已签 | 原 layer-map 要真实入口/trigger/item/命令/目标映射与键盘/主save或cancel/合法校验。尚无完整独立运行映射出口；U4可复用 MENU18/36/38 的排序/视图切片，不代其余层 |
| RA-W 十六卡 | 三拖六卡、部分计数、queue/OP/记录卡引擎已签 | 原各卡 add/config→拖缩→save/restart→删/undo→cancel 及内容权威值，公共步骤先复用；六卡拖动或 type 存在不等十六卡操作。formula/empty/Markdown安全按原卡合同，不扩大组件新规范 |
| RA-AT01 / RA-AT02 | 风险派生/ARIA/键盘 AUTO 仅辅助 | 真320浅深填充风险格→列表返回/Tab；真实 VoiceOver 任务/AI确认/危险确认/OKR listbox 播报与焦点原证。当前没有该完整独立审签，不转本人整轮 |
| RA-U401/402 / RA-GAP-U4 | 当前 r2 整 U4 PASS | 无本原有限排序/四列功能剩件。adapter 仅获当前真实 React 回调/渲染/持久有限接受，不是物理点击兼容或未来默认替代；localStorage 故障沿 SOURCE/AUTO，不添 GUI 故障前置 |
| RA-TOOL03/04（O3/O5/O4） | 原18 AUTO、部分 dirty cancel/save 片段 | 原 O3 真业务拒保存保稿→retry；FS旧snapshot拒读→stale只读/不入payload→retry更新消失，同页审证；O4仅TaskForm clean/description-only/多选内容顺序的ESC/scrim/X/cancel与保留/放弃焦点，不扩全抽屉dirty |
| RA-CI01 | run39557586592 / commit9b1a8c5 的 core 原日志可保留 | 不称 dirty候选远端已验，不为此 push/dispatch新workflow；必要认证另列 |
| RA-CI02 | 无 harness 的远端 e2e SKIP 保留 | 原合同本机有宿主/Chrome条件下现有 e2e 要实际执行/审证；当前没有绑定最终候选的新结论。没有条件保 SKIP/NOT_RUN，不当 PASS；不新增宿主下载方案 |
| 最终 build/AUTO/guard/Launcher | U4 r5 build/noEmit、155文件1590测试，r6 95/95及selftest已独立PASS；Launcher父链继承 | 无产品字节变更不要求又跑相同全量；须将以上原exit/警告/保护范围与本次最终候选引用绑定，并补总域继承，不以完整AUTO当GUI或全资产证明 |

**矩阵边界**：上述 RA-V/DR/MENU/W/AT 是父总登记与原 remaining 合同已列的 B8 范围，不能静默删掉；AGENTS §6A.1 的全组件设计签字、全球六态和四视口提议仍未生效，**不得另升硬门，也不得追加给 U4**。U4专家不追溯待表决矩阵，正确；这不等于其裁决已经豁免原独立 B8 合同。若核到某原格其实只源于未批准提议，须由合同 owner 指明依据作最小范围澄清，不能直接要求 Main 重采全部1184格。

## 5. 有效继承与不得继承

| 接缝 / 已核事实 | 可以继承什么 | 不得外推什么 |
| --- | --- | --- |
| A20V3→U4十文件增量，当前102项一致 | A20V3的反思后端、slash事件/session接缝、package/lock和Launcher未被U4改动；按原专家判定保留 RA-P0007 PASS_LIMITED、SR-G01..06、Launcher56/verify 的限定继承 | 新 client bundle hash不同不能冒原实例；未采其他命令反馈、键盘/矩阵仍未签。U4总门不签A20以外全部域 |
| A19HC→当前：527项中514项相同，13项不同、missing0 | habits.tsx/panel.css及HC01测试字节未变，HC01 SOURCE/AUTO/指定视觉保留；GM01建议行在HC01 SOURCE审查中未变，可保原GM01展示切片与补正 | 不用HC01三图继承全习惯页、P3004聚合或GM01全部旅程 |
| A18→当前：520项中504相同，16项不同、missing0 | 已签且未变的数据/会话/队列/来源断言保留，原修后资料/字节/安全AUTO用各自最新报告；纯derive/深树先核断言依赖继承，不盲目全重测 | reflect、tasks/task-tree/task-views、habits、全局panel.css、index事件/inject与verify接缝已变；不能沿A18旧任务表、反思文本、全页视觉或slash错误可见性结果 |
| OP/材料/来源旧报告 | 原独立签字历史有效；最新95/1590可作受影响AUTO回归旁证；GUI已闭动作优先作时间段映射 | SOURCE/AUTO覆盖不相等于未执行GUI；历史未重跑不等产品失败，也不凭“模块未改”签原未验动作 |
| Launcher五旧probes | 保存来源与历史独立修后断言；未变接缝核定后可继承历史指定范围 | A19/A19HC/A20/V3的九文件56项都没有执行这五probes；不得累计为当前61项或说已重跑，不因缺文件强迫新建/重跑 |
| 旧缺档/警告 | 原失败/超时、原未捕获parent末码/stop、绝对web未done、共享10bin漂移按历史保留；后续新证关闭当前特定缺口 | 新执行不能证明旧时刻曾发生什么；不能说全盘零污染、零warning；缺档不是自动产品FAIL或本人条件 |

本次对 A19 531项回读还有5个 missing，均是五旧probes不在主树，原补正明确其为外部旧来源保存。该事实不等删除在途成果或本批102项候选缺失；不要求把这五件搬进产品、也不恢复已撤回的执行说法。

最终剩余的继承动作是**文件/接缝→原ID/原断言→原证/候选→受影响回归或继承理由**，不是再建验收体系。独立专家逐域补签映射即可；不能由 Main 自写“全绿”替代。

## 6. 不适用、后置与必要本人条件

| 类别 / 原对象 | 当前处置 | 对统一commit/父目标的影响 |
| --- | --- | --- |
| SR-G07 | 独立已判 NOT_APPLICABLE：宿主无合法卸载UI，AUTO SR-A06覆盖生命周期 | 不补造卸载按钮，不阻该局部门；不叫GUI PASS |
| OP-DEFER05/06、item doneAt、effort权重、Git自动裁决 | 原objective合同 N/A/后置；人工/工时/证据/任务completedDate已被ADL055部分替代者仍适用 | 不以旧deferred排除已实现双轨，也不重启后置功能 |
| H6/R11常驻推送、多人实时合并、自动排期、Git自动同步、AI计划跨重启恢复、U3提案、微信产品接入、OIL新设计接管 | 总登记排除 | 不纳本批缺口，不要求实现；微信本机独立在途保留，不纳统一产品stage |
| RA-TOOL01/02、EGO/OIL毕业与效率 | 两次有界失败/切稳定工具事实、OIL安全PASS保留；同条件效率未完成为工具观察 | 原合同明确不为试点阻主线，不要求重装或证明全面更快；O3/O5产品体验门仍在§4 |
| `verify-real-model.mjs` | guard明确排除真实网络smoke；97个verify文件包含runner自身和该smoke，默认实际执行95不是漏掉两个确定性门 | 不强迫把随机模型纳确定性全绿；RA-AI06另有一次真实授权模型合同，须核条件/结果 |
| RA-AI06真实模型/认证 | 当前仍未见本批一次非空来源真实模型审签，也未见实际拦截证明一定必须本人 | 先由有能力Main只核合法配置/授权可用状态；可执行则继续；只有认证/系统动作确须本人且有真实错误时转MANUAL_PENDING，不能因未尝试直接转人工 |
| Finder/原生缩放/chooser/390/320/VoiceOver | 原父登记已确认Main具桌面能力 | Main-only不等user-only；当前可补证缺口仍BLOCKED/NOT_RUN。确有系统权限拒绝时仅必要本人一步另列，不移交整轮 |
| RA-CI01只读登录 | 已有旧run可复用；新候选不需要借本批push去造远端run | 确须本人登录才MANUAL_PENDING；不把远端e2e SKIP算通过 |
| 删除/覆盖/恢复/正式对象 | 隔离按原明确确认执行；正式部署/数据操作本批排除 | 人工分层不免高风险确认；本角色不执行任何该类动作 |

**本次不能凭现有材料新签某个整域为 MANUAL_PENDING。** 当前列的是条件待核；只有必要本人动作被具体证实时，按ADL047登记且不阻可自动化验收，非PASS，反馈失败重开。即使所有真正本人条件都单列，§4中其余可执行缺口仍足以阻止“全部验完”。

## 7. 最小剩余动作与交回 Main

以下只是已有合同余动作的归并顺序，**不新增用例，不授权产品修改，不重新派重复任务**。优先审已有未映射原件，足够则独立补签；确无原件才由原GUI执行端按原步骤采，不让本对账专家执行测试或GUI。

1. **先修正收口口径并登记最终候选。** Main将progress/handoff/onboarding/changelog顶部“最终commit”解释同步为“A20/U4局部门已闭，全部余项待总审”；不能改testing旧报告或reports原证。选择性stage清单保留全部102项认领输入及必要文档/自有专家成果，排除data/lib/node_modules/private/.preview/运行副本/无关微信成果；本报告不实际stage。
2. **反馈与副驾直接未签门。** 先查TF-X08标记catch、同值copy/timer/原关闭保稿和O3/O5同页已有原件；补未采段。AI04只补再生成实际执行base及原剩撤销/故障，AI05只补四create和规定拒绝；不要重做PC三路径/四update/cleanundo/编辑cancel。
3. **材料/汇报/会议完整旅程。** 只补M02两非法组合、J03新建两资料+progress+file取消/一次保存、R current主动选择/源软删固定/安全MD实存导出/session来源、J02行动项转换→任务ms/dlv→回会议重试、D11即时关联及D12合法全kind。M01主save/E1四版可见、旧append/软删/首次restore与CSV/XLSX六路径均复用。
4. **OP与成长有限余链。** 原F2一次合并manual无清单clear、报告消费、wrapped迁父/改回、工时证据/完成日期/旧包只读/390；P0 capture/metric/context，P1 absence/TTL/旧投影刷新/L2/people，P2历史出站/单父软联/各wrapped消费/archive，P3长史收起/关系失败/聚合和周期现有出口。P0008五规则和三个新余件、GM01、HC01、A20三新反思不重采。
5. **文件恢复与原第一批桌面。** 只补共享断联、host收件后迟201 GUI、UI备份→非空恢复→新宿主全表/字节与真实失败回滚，Finder完整PM/loaded/替换/same-mounted链及原PATH字段；优先原存档，不重复130/601秒HTTP或fresh同hash上传下载。历史parent/stop缺档只保真，不设“追证明历史全部退出0”新门。
6. **把上述实际旅程映射到原B8层/卡/格，补空缺专项。** 先按原layer-map补真实入口与动作索引，既有GUI时间段可以多ID复用但不拼凑假整格；补16卡公共动作、看板scope/跨宽、320填充、VoiceOver、原现有e2e。只补原合同未覆盖格内动作，待表决全球矩阵不加入。
7. **独立总出口之后才统一commit。** 专家按最终候选逐域确认已签/有效继承/已批准N/A/真正MANUAL_PENDING，所有可执行门无FAIL/BLOCKED/NOT_RUN才准入。当前最终build/1590/95/Launcher有签且102项不变，纯文档同步不需要无理由重跑全套；如果随后发生产品/依赖/接缝变化，只重认领受影响范围并做必要回归。Main按原授权完成一次普通commit后再记录父目标完成，不push/tag/发布/切正式。

若补证中发现真实产品缺陷，先交原开发/独立专家按原授权和既有门处理；“产品不再改”不能被本角色解释成豁免FAIL，也不由本角色主动开新代码修改。本次可继续的直接动作是采证、审证、继承映射和Main文档同步。

## 8. 本次核验与释放

运行环境：macOS，bash，现有nvm Node `v22.23.3`；pnpm `11.28.5`仅引用已有被测环境，本角色未调用。`rg`不可用exit127，改用find/grep；指定本地记忆入口不存在，权威判断来自仓库。未fetch/pull、install/build、导入产品、运行verify/Vitest/e2e、操作GUI/浏览器/服务、读取credentials/活数据、加载vendor正文、修改Git/配置。

本次实际核验均为只读：完整文档读取；Git status/diff路径/未跟踪输入列表；Node内置fs/crypto解析candidate与SHA清单；102个主树声明输入、48件U4声明原证、候选/报告/边界指纹；A18/A19/A19HC/A20逐路径继承差异。文件读取/指纹/集合检查命令均exit0，结果见§2/§5。没有重跑任何已有审计执行器，也没有重复GUI目视判定。文档格式/相对链接自检只证明本文件可读，不构成产品PASS。

本文件自检：Node内置文件解析核35个相对链接，missing=0、尾随空白=0、exit0；`git diff --check -- docs/testing/final-remaining-acceptance-reconcile-20261022.md` exit0。新文件未跟踪，因此空白检查另以实际文本读取完成，不以Git无输出代替。`git status --short -- docs/testing/final-remaining-acceptance-reconcile-20261022.md`仅显示本文件`??`，未暂存。自检不导入产品、不生成其他文件、不连接网络或服务。

**本轮产品测试与GUI：NOT_RUN（本派单明确禁止），不是测试全通过。** 最终1590/95等结果均明确引用原专家和原执行证据；本角色没有重新执行、没有自签产品。

唯一新增文件为本文；livingdocs由Main同步，选择性stage清单由Main生成。原报告、原证、产品、vendor/data、Git/服务均未写。不占用源码、builder、GUI、端口、profile、依赖或业务根，无长运行进程需接管。**总范围对账交回，角色资源释放，STOP；Main父任务继续，当前不得以A20/U4局部PASS结束父目标或统一commit。**

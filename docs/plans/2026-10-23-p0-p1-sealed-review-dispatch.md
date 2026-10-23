# P0/P1 两封包独立派审检查点

2026-10-23，trae，Main原证采集记录，**不是独立PASS**。

负责人父授权：“直到把所有没验完的功能全部验完，再把所有代码都提交为止…中途不要停下来”。本单只补原合同的审证，不开新功能；未授权push/tag/release/正式切换。

原capture专家已审结 [有限PASS](../testing/p0-capture-remaining-gui-review-20261023-r1-report.md)，`remainingCaptureSlice=[]`。禁止重capture/attach/session/lesson/check/GM01/HC01。04:43检查点曾因finished专家不可追加且工具未暴露而待派；04:44恢复spawn后已分别派给两位独立专家。新结论：P0指定三片[有限PASS](../testing/p0-context-metric-gui-review-20261023-r1-report.md)；P1数据刷新部分[有限PASS、首次遮层/直接退出FAIL](../testing/p1-projection-refresh-gui-review-20261023-r1.md)。两审均released/STOP，Main按后者§6缺陷合同另派开发修P1004，继续非重叠原采证。历史工具阻点不当产品FAIL或人工豁免。

## 1. 独立审证角色边界

角色非Main/非开发/非GUI执行者；只读封包/原报告/既有合同，使用自有reader及view_image独立目视。不得跑Main执行脚本/产品test/build/install/GUI/服务/凭据/Git，不改原件/其他testing/livingdocs。写面只用两个新前缀：

- `docs/testing/p0-context-metric-gui-review-20261023-r1*`
- `docs/testing/p1-projection-refresh-gui-review-20261023-r1*`

先读AGENTS、collaboration §9/§11、[原成长合同](../testing/remaining-governance-cases-20261021.md)以及[最终继承§5](../testing/op-growth-final-inheritance-20261022-r1.md)。父代码主树dirty不可代候选。被测114/521冻结输入、3264/PID10975、既有3261/PID60386确定性网关；部署来源只继承原Successor114GUI的准确归属，不新探活或读private入口。实际原件含RPC、页面DOM/截图/帧、pmtool/files/backups前末指纹、真实gateway行。PNG与数据不互相替代。

## 2. P0新封包：695原件

[索引](../../reports/all-pending-evidence-20261021/P0ContextMetricR1/index-r1.json)、[Main观察](../../reports/all-pending-evidence-20261021/P0ContextMetricR1/executor-observations.json)。

- P0001：t1有材料/t6空材料真实ask→只读答/相关task投影→不确认退出。核投影、网关白名单上下文及描述/证据/交付物/资料/进展准确，业务与文件字节不变。
- P0002窄片：第三真实ask产生description/evidenceUrl/repoUrl/branch合法窄集和title禁止步；GUI整批明确确认合法项、title拒因可见、旧五标量不变。其余URL/长度/wrapped等GUI负例未执行，不能签整P0002。
- P0006：真实UI clean undo、t6包字节恢复、生产账本保ask-apply/capture与applied/undone；metric两kind、basis3、undo1/pending0、p2空0/null、reload一致。现合同无rejected字段，拒绝计数不得编造；冲突/失败零只是本样本计数，不冒实测两故障。
- round03/04等错tab标题/瞬时toast导致timeout保。响应/保存成功后分别真实选tab/独立观察，不重放ask/apply。自有执行审计对照原帧与RPC，不因Mainassert绿签GUI。

只给有限分层结果及准确remaining；不扩P0全域/父目标/普通commit。

## 3. P1新封包：379原件

[索引](../../reports/all-pending-evidence-20261021/P1ProjectionRefreshR1/index-r1.json)、[Main观察](../../reports/all-pending-evidence-20261021/P1ProjectionRefreshR1/executor-observations.json)。

P1004原链：旧ask投影t6未指派/0→正常task主表单改负责人/47→主save→展开副驾→真实snapshot刷新/数据截至/更新旁注→打开同t6→回旧答卡。只一模型请求；未改旧回答，只有task业务记录变化，刷新与目标浏览不留额外业务写。

**原始遮层观察必须裁明**：点击“打开任务”后副驾仍叠在任务抽屉上，首次cancel指针没有关闭，timeout与图/帧保。最小化副驾露出正确字段、现有顶部关闭→再展开副驾回原卡成功。不得把恢复后的末图冒首次无遮挡通过；先独立判P1004分层/原B8接缝影响，再判断是否确证缺陷及需要先行红/最小修复，Main不得自签FAIL/PASS或自改代码。

审结注明可继承、准确剩余、输入保护与released/STOP。Main按仍有效父单继续其余原采证。

## 4. 04:54接续与P1005新包

P0 `remainingContextSlice=[]`、`remainingCurrentMetricSlice=[]`，P0002原URL/长度/其他禁止字段/wrapped GUI负例仍NOT_RUN，不重有证正例。P1004首次打开TaskForm被副驾覆盖，原专家确证FAIL；开发只修原层/焦点交接，保旧答、不重模型、不增业务写。Main唯一后继builder，旧114实例不冒新修，源码开发不能自签修后GUI。

Main另封 `P1L2EventsR1/index-r1.json`1077件和 `P1L2EventsReceiptSupplementR1/index-r1.json`6件。原F5里程碑m1与交付物dlv1正常主save各产生正确事件反思、关联t1待核/gaps，两次同状态真实保存无重复，旧任务与旧task-done反思字节保，命令read/reload零业务写。原 `/pm reflect t-0001` 只选旧task-done，两事件无taskId，未以误改旧记录冒edit/final。只读独立专家审P1005事件片和该入口对应关系，唯一写面 `docs/testing/p1-l2-events-gui-review-20261023-r1*`；不预判缺陷或整项PASS。1077原封包receipt自动scan因元数据无command为0，6件补包只绑定两真实失败收据，原索引不改；其他selector/指针失败保留，不洗成全程零失败。

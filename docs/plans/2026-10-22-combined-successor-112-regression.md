# 三修后继112候选构建与回归执行计划

> Main唯一builder/GUI。三处不同专家SOURCE/AUTO门已齐；父持续授权验全部并最后普通commit，无push/tag/release/正式切换。此为构建设施选择，不新增产品或用户审批。

## 已确认身份

- 基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`。
- 原107 `CombinedRepairR1/r2` + 原四新tests + renderer新增声明，实际去重 **112**；panel/ask原已在107仅替换其hash，renderer此前未认领故须新增。完整包输入519（原515+4新tests）。
- renderer SHA `94290aaf54764628161e84f11d1bd495f7cb965c4178ea155d52b2d28ac99fbf`：[独立74/noEmit PASS](../testing/fixed-report-export-fence-independent-retest-20261022-r2-report.md)。
- ask SHA `084efb5b33e7cda7368b87c4708f87f460d28588f3e7476cadfad2de0fd35884`：[独立210/noEmit PASS](../testing/ask-auth-feedback-independent-retest-20261022-r1-report.md)。
- panel SHA `581f2882323e729afa7f7f5b7ff40e73a8a9831c2c30b9a263baad74fc7f521d`：[独立正式21文件199 PASS](../testing/task-predecessor-selection-independent-retest-20261022-r1-report.md)。
- 3260当前87385 + gateway3261/60386仍是107；F07故障blocker/数据必须保留，不能让该实例冒新修装载。

## 唯一新冻结及设施

1. 新纯tmp `pmtool-combined-successor112-20261022-r1`，自有证据 `reports/all-pending-evidence-20261021/CombinedSuccessor112R1/`。复制当前完整src/scripts/locale/package输入，声明112、tracked product patch、新文件表、父专家及包指纹；不得覆盖旧107、主lib或任何seal。
2. 包依赖从原CombinedRepairR1/r2已独占13579/1030复制并重定位绝对内链；DOM依赖采用TaskPredSelectionRetestR1/r1已核React18/DOM18/jsdom25独占副本。普通复制校inode/bytes/内部链接，不install/pnpm自动改身份。
3. 使用直接typescript编译、CSS复制与tsdown bundle，不用先前r1会自动install的pnpm run入口。构建命令/PID/exit/stdout/stderr全部原样保留。
4. ask新test引用真实上游pi stream：自有复制其既已核上游相关输入，设置`ASK_AUTH_PI_STREAM`到独占源路径，不能临时symlink上游或伪适配classifier。完整全量执行前核此默认路径。

## 正式回归与诊断边界

- 全普通测试仅exclude三DOM：资料refs、前置refs、前置hidden-submit；普通预期160文件1686项仅作计划，实际JSON统计为准。
- DOM独立配置真实React18 alias+inline lucide，virtual transform只`export { TaskForm }`；三个DOM预期17项。前置C02采用**原独立专家已审adapter**，只该测试正文适配，不修改src旧test或产品；原裸FormData7项6绿1红保在旧诊断，不把这红涂绿。
- 复用 `docs/testing/task-predecessor-selection-independent-retest-20261022-r1-adapter.mjs` 中`adaptC02`，校原testSHA/实际adapterSHA，另复制到本设施。不要把专家配置整段硬编码旧freeze路径作为新源。
- panel-checklist旧renderer测试需真实完整document/RAF设施，采用专家已审 r3-facility 的setup和一行document测试适配；不得改断言或产品callback，记录diff。旧RAF/detached/TypeError设施失败全部保真；新stderr仍有key/listener警告不宣称零warning。
- 原report stress1/probes6专项另用原独立test做必要合并检查；不混入全量计数或重复计为新tests。
- 全coverage/noEmit/默认95verify/guard/close，保护主完整输入/主lib/107lib及封包不变。最终完整退出凭证单独record，避免close只有文件无execution的问题。
- 最后独立整回归审证只审完整原件、计数/覆盖/身份与设施adapter合法性，不重复产品测试；与本次开发分开。

## 新实例与GUI

门齐/构建实测后新端口3262及自有runtime，网关可复用自有3261但profile/API/model开关另绑定。旧3260/F07/3257/3258等保，不正式切换。

Main同EGO13p3新导航，不newSpace/page；新fullclient段/hash/profile/PID与112绑定。原F5整包标准restore，补前置选/取消/搜索隐藏保存/循环拒绝保稿→解除retry、401中文失效/429/正常恢复、固定MD含冻结摘录源软删后导出。新反馈必须按原合同留真实请求/响应、页面可见与字节，不把SOURCE/AUTO替GUI。之后继续原OP成长/B8/其他未采项。

F07RemainingR1/index573独立审在途；原故障库只保，不再成功恢复遮失败。全父总出口仍未闭，不能此刻stage/commit。

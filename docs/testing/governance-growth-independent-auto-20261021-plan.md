# 治理与成长独立 AUTO 执行计划

> 供 Main 与独立测试专家核对执行范围、输入和证据。平台 trae，角色独立测试专家，2026-10-21。本文不新增功能、设计或平台，不代表整门 PASS。

## 1. 授权与边界

父任务原句：“好的，按之前的盘点文档和这个分工方案继续推进，直到把所有没验完的功能全部验完，再把所有代码都提交为止，才算完成任务，中途不要停下来。”

原句来源：`reports/all-pending-acceptance-execution-20261021.md` §1。本子任务另受负责人明确限制：只写 `docs/testing/governance-growth-independent-auto-20261021*`、同前缀 evidence 和自有 tmp；不改产品、他人 testing、living docs，不 install/build 共享产物、不启服务、不碰 Main GUI、私有凭据或正式根、不 commit。生产 TypeScript 编译仅写自有 tmp。已装依赖只读使用 `/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules`。

已读 AGENTS、collaboration、总 register、remaining-governance-cases 全文（§1..6）及 P0-P3 有效规格。遵守 P2-6 r8、ADL-055 与 #22 有效边界；不把非前置观察、设计提议、组织者验证数升级整门。

## 2. 文件与执行顺序

1. 新建本计划，冻结主树当前源码、声明、用例、真实依赖闭包指纹、基线 HEAD、tracked diff、新文件清单；复制源码和必要 scripts 到自有 tmp。Main 正在改 bridge/panel/board/OP task，按实际依赖判断漂移影响。
2. 新建同前缀 `run.mjs`、`worker.mjs`、`guard.mjs`：前者只编排自有输出；后者调用真实 Context、JSON backend、DomainFacility、产品 command/领域函数，不注册虚构业务模块。guard 拒外部写和网络，不是 OS sandbox，不夸大全盘保护。
3. 在自有 tmp 执行 tsc（生产编译）、当前既有治理/成长 verify 与相关单元测试。逐命令保存参数、时间、stdout/stderr、exit。既有断言独立复验，不用总数回填 32 个 ID。
4. RA-AI01..03：生产 gateway 固定流输出，真实 ask → 生产解析/校验 → 明确 ask-apply，非空 refs；正常 update/delete 后 ask-recheck 两次、新进程读回。另以真实 refs 做 cross-project/version 白盒负例，不把不可达非法库灌入 GUI。
5. RA-AI04..06：确认链式 baseline、外部冲突/依赖/独立步、取消零业务写、clean/changed/mixed undo；四实体 create/update、未知字段/wrapped/跨项目/资料数组拒绝；故障 adapter 经生产 gateway，不读 key、不出网。busy/abort 与真实模型交 Main 原证，不假装本专家执行 GUI。
6. RA-P0001..08：上下文、窄集、capture、attach、session、metric、反思幂等/人工 final、五检查规则。通过真实 command、真实 JSON 回读及失败写边界验证。
7. RA-P1001..06：queue list/open/mute/unmute/quiet、最新 snapshot 投影、L2 反思与关系负例、负载事实/建议/历史阈值。日期白盒注入与真实本地时段分开；不改墙钟。
8. RA-P2001..07：三档 export/注入/覆盖/静态性、31/29 天 sent 经合法标准备份恢复、审计只增、OKR 建议与关系、wrapped 各消费点、lesson edit/final、archive/review 零业务写。
9. RA-P3001..05：habit 建议/确认/忽略、D/D-1/D-2/重复/D+1/D-3、合法多月历史/断签、OKR 聚合与 final、禁用周期钩子。
10. 输出 F5/F6 标准 createBackup + precheck 合法包、非空 ledger、ids/expected、GUI 最小采证单与逐 ID AUTO/GUI/本人状态。记录历史继承/失效理由，终态只签实际有限 AUTO；GUI 待 Main 同候选原证。

## 3. 判定与即时通报

- 确证产品 FAIL：保失败原证、精确对象/调用/前后值/接缝，立即通报 Main；不修产品。
- fixture 或 oracle 不合法：记设施 BLOCKED/纠正，保首轮，不冒充产品 FAIL；仍继续独立可执行项。
- 每项 AUTO 分“已测 PASS 子断言 / FAIL / BLOCKED / NOT_RUN”；GUI 初态 NOT_RUN，收到可核 Main 原证后另审。真实模型 Main-only，不自动标本人 MANUAL_PENDING。
- 旧 PASS 仅保其冻结范围；无相关依赖指纹/diff 不继承当前。当前源码/依赖漂移按接缝失效，不用 HEAD/version 代替。

## 4. 进度

- [x] 授权、有效合同和禁止范围核对。
- [x] 自有计划先落盘。
- [x] 输入冻结与隔离执行设施。
- [x] 既有断言独立复验与精确补测。
- [x] F5/F6、逐 ID 状态和 Main GUI 最小交件。
- [x] 漂移/写根审计与有限结论。

第三轮执行前：纠正 branch-only 非法的 oracle；将四扩展 create 来源分为四项断言，确认输入严格使用生产 gateway 输出的生产解析结果；补 changed-only 撤销与真实 storage 写失败下 task-done best-effort。只改本专家脚本。前两轮保留，其中第二轮编排未取得完整 exit，不作整轮通过证据。

交件完成不代表门通过：第三轮soAcAa领域55绿/7红/0阻塞，7红归四缺陷，29 ID仅有限AUTO绿/3 ID红；既有unit283/283、补充P0副本28/28、新进程2/2。主树实际领域依赖随后漂移，新候选受影响集成待复验；GUI/网络模型待Main原证。最小修复合同已优先交Main，本专家没有等待新代码或改产品。

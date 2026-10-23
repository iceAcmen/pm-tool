# AI 剩余 GUI R1 独立审证计划

> 2026-10-22，trae，独立 GUI 审证专家，非开发、非 GUI 执行端。仅审原证，不执行产品测试。

## 1. 授权与边界

本次负责人原句：

> 独立GUI审证专家，非开发非GUI。唯一写面docs/testing/ai-remaining-gui-review-20261022-r1*新件，禁其他testing/产品/原证/livingdocs/上游/Git。持续原用户分工验所有未验后commit授权。

原父目标仍为所有既有未验功能全部验完后普通 commit；本子任务不签整门，不执行任何 Git 动作。本次明确只读边界优先于通用 fetch/pull、install/build、全回归及 livingdocs 更新流程。

本批对象：`reports/all-pending-evidence-20261021/AIremainingR1/index.json` 的 506 件；19 个原执行记录含 6 个 exit1；05..10 再生成实际 base、11..16 四 create、18..25 白名单及 applied-only、26..28 故障/恢复。被测仅旧 U4r2：102 项来源声明中87插件项实际在冻结树，15 Launcher项另只读回读；主树 Cycle 后继不属于本 GUI 候选。

不得运行 Main helper/seal/原 tests，不操作浏览器、模型、端口、profile、业务根或凭据。3258/3259/3257/3256/3248/3249/3255 及正式服务均不探不动。六个 `liveLogsExcluded` 活日志不锁、不校不可变；只读其封存副本。旧失败和原签不覆盖。

## 2. 有效依据

- `AGENTS.md`、`docs/collaboration.md` §9/§11。
- `final-remaining-acceptance-reconcile-20261022.md` §4.3。
- `remaining-governance-cases-20261021.md` RA-AI04/05/06。
- A16 `extension-selection` 原报告/计划、PC-G01..04、EXT-BASE 的有限签署。
- `ai-terminal-failure-20261022-report.md`：仅引用原错误分型结论，不重复执行其 tests，不自修。

## 3. 审证步骤

1. 记录只读输入的 SHA/bytes/mtime；复算封包全部声明文件、102 项来源声明（87冻结插件输入、15非冻结Launcher回读）、lib 与实际归档 loaded-complete 的完整唯一 client 段。网络载入元数据没采则明示，不伪造 cache/frame/请求时点。
2. 各 raw 与对应 roots 逐项匹配；业务、settings、session 及 files/backups 分开。只读副本不冒称全盘零污染。
3. 用真实 requestId/rpcId 配对请求和响应；drain 的 at 不当 wire 时点。模型 BODY/fixture 是依赖控制，不是人工计划/成功 snapshot。检查生成、取消、人工保存、显式再生成、确认及来源落盘。
4. 直接打开原 PNG 独立目视关键状态。单图不证明完整录屏、全卡详情、全 console、矩阵或云模型通过。
5. 输出逐子断言有限 PASS/FAIL/BLOCKED 和原签继承/缺口；最后回读保护清单并释放 STOP。不签整个 AI04/05/06 或 commit。

## 4. 本批产物

只新增本前缀 plan、audit.mjs、审计 JSON、中文报告和释放 JSON。自有审计仅使用 Node 内置 fs/path/crypto/assert，输出 exclusive-create，存在即拒绝覆盖；不导入产品模块、不调用 subprocess/网络/浏览器。证据审计绿只表示文件断言成立，不替代 GUI/产品总门。

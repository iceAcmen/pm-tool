# 循环依赖错误原因与权限分类先行计划

> 2026-10-22，trae，独立测试专家，非开发、非 GUI；给 Main/开发必要红和最小修复合同，不签修后 GUI、整域或全部 commit。

## 授权与目标

负责人原句：

> 独立测试专家先行必要红/最小合同，非开发非GUI。持续既有缺陷修复授权，Main GUI/builder。唯一写面docs/testing/cycle-feedback-reason-20261022*新文件，不产品/livingdocs/其他testing/原证/git/服务/GUI。
>
> 判断是否现合同真实产品缺陷（错误原因/权限误导），必要红最小真实command+ResultCard控制（不要新增宽英文regex/改原oracle），建议最小type PredecessorRelationError类/已有错误体系或窄handler/权限分类原因规则，不能光匹配泛用建议中的权限。
>
> 若需要测试只在完整自有冻结输出、既有依赖白名单/no-cache单worker、不build/install，产品全102输入保护/既有lib和其他专家报告保护，不用主工作树运行自测。先计划后必要红，原失败日志保留；不独立改产品自验。

本具体范围覆盖通用同步、构建、living docs 和 Git SOP。新增本前缀计划、cases、runner、selftmp、报告。不探活或操作任何端口；3257 U4r2 只作为被测冻结来源，不触碰 3256/3248/3249/3255/正式实例。Main 的 seal 由 Main 自行完成；本角色仅只读已有 41..46 原件，不替其封包或依口述补证。

## 依据与预判

- 已读 `AGENTS.md`、`docs/collaboration.md` §9/§11，当前 progress/handoff/onboarding/changelog。
- 原 `main-o3-o5-samepage-assertions-20261020.md` O3-1/2 要求真实业务拒绝保稿、错误呈现、显式修正后成功；`feedback-remaining-gui-20261022-r2-method.md` §2 明确仅 t9 反选 t8 的输入依赖适配，保存与响应必须真实，不外推物理兼容或 O4。
- 错误原因依据 `docs/design/system-ui-spec-20261017.md` §6.2 已有“原因 + 怎么修”语义；不借其中尚未取证的 aria 绑定或待表决矩阵新增门。已有 ResultCard“权限不足”是原因分类，不能把泛用排查建议当已发生的权限拒绝。
- 45 原 RPC 外层 `ok:true`、内层 `kind:error`，返回任务兜底文字；不是注入。`core/tasks.ts` 的 BFS 抛普通 Error，`commands/task.ts` 未纳入已知业务错误分支；ResultCard 扫整段“权限”造成误标。预判为现有错误反馈缺陷，须由真实最小红验证，不改既有 oracle。
- 原图 42/45 抽屉仍开，但错误卡在视口外；不签完整 O3 GUI 可见性，也不新增布局修复授权。

## 顺序与用例

1. **先计划（本件）**，再新增纯测试与冻结 runner；原文件不改。
2. 从 U4r2 复制完整包输入 `src/scripts/package.json/pnpm-lock.yaml/tsconfig.json/vitest.config.ts/tsdown.config.ts/cordis.patch.yml/locale`，不复制 lib；逐字认领全输入。仅使用 U4r2 已有完整 node_modules 白名单，复制后重定位内部软链，拒绝外链/共享 inode；不 install/build。
3. CF-C01：生产 API 建两个项目和九个任务，再真实 command 建合法 t8→t9；生产 core 反选 t9→t8 必须抛现有循环原因、领域数据及 put 次数零变。
4. CF-R01（必要红）：同合法种子，真实 command 拒绝仍 `kind:error`，**返回含明确循环原因**而非存储/权限兜底；保持零写，错误 context 分类持久，生产卡无权限标签。失败前先留实际 response/原 console.error/写记录。
5. CF-R02（独立必要红）：读取 45 的真实 RPC 原文，加生产 run 的单次前缀，生产 ResultCard **不显示“权限不足”**。一般存储排查建议不能证明权限拒绝；保全文/error/alert/无动作。
6. CF-C02：同被拒草稿只解除前置，真实 command retry 成功，一次任务 put，成功信封/3秒策略不误红。
7. CF-C03 两例：真实 command 更新合法标题含“失败/Error/Failed”和“权限/permission”，成功信封仍成功、不产生权限标签。
8. CF-C04 两例：生产卡收到明确“权限不足”及“EACCES: permission denied”失败原因仍有权限标签。只控制已有分类的明确正例，不要求所有英文 `not allowed/denied` 都等价权限。
9. CF-C05：真实存储依赖 get 抛未知 Error，command 保守 error/不泄露堆栈或路径；不把所有 Error 原文直接透出。属于 AUTO 依赖故障控制，非真实磁盘故障。
10. CF-C06：既有 typed 错误（不存在里程碑）保持原原因和零写，不破坏已知错误分支。

## 环境、保护与停止

macOS、Node v22.23.3；pnpm11.28.5 仅被测背景，不调用。Vitest2.1.9/react18.3.1/react-test-renderer18.3.1 从既有 U4r2 副本使用。runner 只在本前缀 selftmp 内运行测试；`--no-cache`、一个 fork/worker、白名单 PATH/HOME/TMPDIR/XDG_CACHE_HOME/DSH_HOME，不继承密钥或网络配置。

保护：A20V3 95项与 U4 10项合并去重102输入，主树及各原冻结归属；完整主树/源冻结包输入与已有 lib；现存其他 testing 顶层报告/脚本/合同、指定 A18 原失败日志；U4 原 manifest、已读取 41..46 原证。Main 合法新增原件不算污染，不封其在途目录；全量原证封包审签仍待 Main。所有已有保护文件核 bytes/SHA/mtime，声明 hash 另核；不声称覆盖未列出的全磁盘资产。

依赖外链、候选漂移、白名单不完整、无真实组件/command、设施错误或保护漂移时停止，不修产品或原断言。红测 exit1 原样保留，禁止改红为绿；若设施失败，仅新自有轮次修设施，原失败不覆盖。

## 交回范围

优先建议：沿已有业务 Error 类模式新增窄 `PredecessorRelationError`，把当前四个关系校验（自身/不存在/跨项目/循环）纳同类及已知 handler；保留未知错误兜底、BFS/队列/写边界/协议。另收窄 ResultCard 的权限原因判定，只认明确权限拒绝或已有类型，不能仅匹配泛用建议中的“权限”。不预定新增协议、全局正则、schema 或多页改造。

开发完成后须不同独立复验原红与控制、受影响回归；Main 唯一新 builder/GUI，认领新候选并按原 O3 修后重采，不覆盖 U4r2/41..46。本角色不改产品自验、不签修后 GUI/全量 commit。

## 进度

- [x] 只读合同、原 RPC 和生产链，明确候选/角色。
- [x] 本先行计划落盘。
- [x] 完整自有冻结与保护核对：r1 freeze exit0；102声明/854保护对象无漂移，依赖13579文件/1030内部软链，外链/共享inode零。
- [x] 控制和必要红：10项8绿2红、原exit1/response/零put/console栈保留；未改原oracle或产品。
- [x] 有限结论、最小开发合同、释放交回：close exit0无残留测试进程；封包230字节指纹/27执行含6失败/49观察/102声明及完整loaded段核对，首次自有审计失败保留；六原图已目视，不签错误卡可见/修后GUI/整域或全部commit。

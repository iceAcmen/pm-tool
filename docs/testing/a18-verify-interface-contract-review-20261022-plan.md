# A18 两项 Verify 接口契约独立复核计划

> 2026-10-22，trae 独立测试角色，非开发。给 Main 复核两项静态 oracle、最小 adapter、反对照及保护范围；不签全部验收门。

负责人派单原句：

> 独立核A18全部verify两静态断言失效并给必要adapter，非开发。用户持续验全部/缺陷修复独立最后统一commit。已A18feedback-context-independent-retest有限SOURCE/AUTO PASS，Main唯一A18build/noemit/coverage149files1552tests0、pin11.28.5同453产物无变，rawfullverify93/95两FAIL保护0见reports/all-pending-evidence-20261021/A18/full-verify/guard.{stdout,stderr}.txt。失败scripts/verify-gantt-drag.mjs105run catch必须setMessage但已publishMessage完整context；scripts/verify-ui-feedback.mjs234Notice classifyFeedback(message)现带context。只docs/testing/a18-verify-interface-contract-review-20261022*及自有tmp；禁产品/scripts主源/其他testing/livingdocs/build/install/GUI/services/credentials/commit/sharedlib/cache。读AGENTS/collab、A18plan/独立report6file源码delta；冻结完整当前源码，自有node-no-cache/独有HOMEcache；先原两个脚本执行保真实红，再核是否只失效oracle，给最小自有script adapter diff保原断言语义(quiet catch仍global error完整原因，Notice生产classify带实际context)，不能仅放宽regex导致错误回归漏；新增反对照旧broken实现/quiet误吞/分类缺context须红，真实PmPanel测试补证明。只独立报告推荐主scripts准确可接受修改/原红新绿，Main另决定更新脚本且完整95重跑，无自签全门。源/lib/原件保护只不纳Main新GUI/selfruntime；资源结束释放。

## 范围与步骤

已读 AGENTS、collaboration §9/11、批准 A18 计划、开发和独立报告及六文件 delta、Main 原 full-verify 日志。按本次明确边界，不 fetch/pull 在途脏树，不 install/build、不写 livingdocs/主脚本、不全95重跑、不 GUI/services/credentials/commit。指定 memory 入口不存在，仓库为准。沿批准设计组织独立测试，不新开产品设计、vendor 或其他 Agent。

1. 冻结完整当前 src/scripts/package/lock/配置，保存 dirty 基线、完整 tracked patch、新输入清单与指纹；Main A18 唯一已构建 lib 只复制，不重构。核六文件与已审候选、Main 声明源/453产物对应。
2. 自有 HOME/TMPDIR/XDG/DSH_HOME、白名单 env、Node22 no-cache；原样执行两个原脚本，保存真实 exit/stdout/stderr，必须先见预期 oracle 红。
3. 最小 adapter 只替换这两条失效断言。新增独立 AST 契约 helper 检查 catch 无 quiet 条件、完整 prefixFeedbackOnce 原因及显式 error context、同一 state 及实际 ResultCard/FeedbackToast 接线、各生产分类器实参；其余脚本断言字节不变。
4. 在自有冻结副本测试旧 A17 broken、quiet 条件吞错、丢原因/缺 context 和组件断开等反对照。每次保存 diff/退出/失败正文，原冻结不改。旧实现只作负例，不修产品。
5. 真实 PmPanel/TaskTable/ResultCard source 挂载补证明普通/quiet 全文、复制、常驻、无动作/无toast、失败无refresh及成功quiet单refresh。重跑既有独立16和当前同域62，过滤 pending 单列。负例跑同一真实面板测试，必须真实红。
6. 前后保护完整主输入/主lib、Main A18已声明输入/lib、已有原两个脚本/全部引用原证、真实只读依赖与既有缓存。Main 新 GUI/selfruntime 不纳零写根，不访问其服务或凭据。保存精确 PID 退出及资源释放。

## 判定

只给这两个 oracle 与有限 SOURCE/AUTO 的 PASS/FAIL/BLOCKED。Main 原95仍93绿2红保留，不能用本轮adapter二绿倒签95或GUI。Main另决定更新主脚本/helper，再跑完整95和保护。可写对象仅本前缀 plan/helper/cases/run/report/selftmp；所有手工修改用 apply_patch。macOS + Node22.23.3，既有 pnpm11.28.5依赖只读，不执行pnpm。

进度：r3完整冻结、两原红、两adapter绿、历史三文件与七种变体反对照、真实面板6/既有独立16/同域62、保护及退出复核均完成。有限SOURCE/AUTO PASS，原两FAIL保留；Main原93/95不倒签。56声明保护根及冻结原件零漂移，已释放。最终helper使用非verify前缀保持目标95；r1旧名问题与r2设施失败完整保留。结论与下一步见同名前缀独立报告，主脚本是否更新/全95重跑由Main另决定。

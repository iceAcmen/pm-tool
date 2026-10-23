# A8 反馈与恢复预检新源独立复验

> 2026-10-21，trae，新独立复验专家。给 Main、负责人与后继审证者使用：本报告只签冻结新源的有限 SOURCE/AUTO，保留 A6/A7 旧 FAIL，GUI 另列 BLOCKED；不是全部在途、发布或提交放行。

## 1. 结论

**本轮有限 SOURCE/AUTO：PASS。GUI：BLOCKED，待 Main 新 A8 原证。未确证新增产品缺陷，不开新产品修复合同。本子单结束，不等待无限 GUI。**

| 对象 | 独立结果 | 精确范围 |
| --- | --- | --- |
| 原专家 r3 看板27项 | **27/27，exit0** | 原精确测试副本逐字节复用，未改 fixture/oracle；保存、重置、queue、失败支、并存错误优先、关闭/重试、user/project scope 与在途观察 |
| 真实 PmPanel 原路径/回告 | **path6 + launch5 = 11/11，exit0** | 未 mock PmPanel/ConfirmHost/bridge；原路径预检、取消、两确认、输入拒绝、错误；snapshot 与新旧 nonce/卸载回告门 |
| Main 看板作者9项独立执行 | **9/9，exit0** | 新源真实父组件及 modifier；这是独立执行作者例，不冒充新增独立设计用例 |
| 补充长路径/bridge | **2 + 23 = 25/25，exit0** | 同原长路径/输出，真实危险对话框取消/第二明确确认边界；原 bridge 全部23项未改副本复跑 |
| SOURCE 接缝 | **7项 PASS，最终命令exit0** | 显式 kind/text、error优先、CSS覆盖、原业务链/恢复协议、局部约束与真实反馈记录 |
| GUI、布局/颜色目视与完整候选运行绑定 | **BLOCKED** | 本单明确 noGUI/no服务/no build；没有新 A8 实际入口/chunk/运行实例/旅程/保护原件 |

共 **72 次测试执行全绿，0 FAIL、0 pending、0 todo**，来自6份测试文件。包含作者例与重叠回归，不称72个独立业务场景或72个缺陷。逐项用例名、命令、退出与边界见 [final-check.json](a8-feedback-precheck-independent-retest-20261021-selftmp/final-check.json)。

## 2. 授权与方法

- 本派单原句：“只写docs/testing/a8-feedback-precheck-independent-retest-20261021*和自有tmp，不改产品/Main测试/其他testing/livingdocs、不build/noGUI/no服务/credentials/commit。”
- 父负责人持续授权“验完所有在途并最后统一commit”，只授权本专家此有限复验；Main 唯一 builder/GUI，父最终提交权不转移。本单不 fetch/pull、install/build、全包 verify、不改 livingdocs、不提交。
- 已读 AGENTS、collaboration §9/§11、批准收口计划、A6 GUI 报告、A7 repair contract、A8 合同/review/main-author。遵循 [本轮计划](a8-feedback-precheck-independent-retest-20261021-plan.md)，不扩 scope/persistence/refresh，不改原 fixture/oracle 偷 PASS。
- 测试仅 Vitest transform 和真实 React renderer；Board 用原专家宿主展示/动态 editor 捕获替身，实际 BoardBento hooks/render/父 callback、真实 parseLayout/追加/投影运行。PmPanel/ConfirmHost/launch bridge 未 mock，只替代浏览器环境和宿主传输。
- 原合法看板 fixture 原字节未改；保存变化仍按原专家末卡 y+1，原测试真实 parseLayout 验合法。恢复长路径/输出与 Main 原 long 用例相同，无真实恢复或业务文件写入。
- 网络替身只提供受控结果或禁止网络；不读 profile、runtime、credentials、不启动服务或浏览器。卸载与 globals 恢复沿原设施执行；Vitest子进程均已退出。

## 3. 新源冻结身份

冻结时点 **2026-10-21T14:49:39.103Z（本机22:49:39）**，候选 `A8-feedback-precheck-Main-new-source-independent`，基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，包版本0.7.4。**基线/版本不单独代表 dirty 候选，更不是 Main 新 build 或正式服务版本。**

[freeze.json](a8-feedback-precheck-independent-retest-20261021-selftmp/freeze.json) 认领406份输入：当前包全 `src/`、package/lock/tsconfig、相关合同/计划、原合法fixture、原专家精确r3测试/旧冻结源、A7旧panel及提供的A8作者日志。逐字节复制至自有 frozen，含13份主树新增源码/测试清单与指纹；冻结全源方便解析真实导入，不意味着全源均已验收。

| 焦点文件 | sha256 |
| --- | --- |
| `src/client/board/BoardBento.tsx` | `43d4bc943867e78226eb861a2e6875717d42c519687027bc58c21617e8a786d6` |
| `src/client/board/board.css` | `646ab1916c506e0bd890a2052f157cc550ba18d871114483b0e21cb36013e280` |
| `src/client/panel.tsx` | `41980e6751aade45d97af89d964b566107fdd7c419af13eb9638655547f151cb` |
| `src/client/panel.css` | `ac1186c558a4550896fbc1036603d23c53ec4f68a5becabce331fbf9275c4500` |
| `src/client/panel-restore-path.test.ts` | `0adc62edace5788eb230710313f1aa08882a5dc3db80384cd4f23deb83fdf4df` |
| `src/client/panel-launch-handshake.test.tsx` | `f338a24048fed1a43fa96847a9e5525f2601958da1c6b30a1269a77ddac2cb2b` |
| `src/client/board/BoardBento-feedback.test.tsx` | `57ba3f107a0e43e6f7ca9c42cc88935856988bb9ba2f707bef8ae346208a5797` |
| `src/client/launch-handshake.ts` | `fd4466ba53668864268f983b75c65b1cf8ae74369513ab08fbb73052c6b0d95b` |
| 原合法 fixture | `41c91b49024270667b5a43e2f927bc43c478b8b69384c95b157aa01643176b87` |

相关包全src/package/lock [tracked.diff](a8-feedback-precheck-independent-retest-20261021-selftmp/tracked.diff) sha256=`8bdbeae918dd7eebaca49087223e56633f9c8829ccc3b26f088116a5f570c6a0`。它含其他在途差异，不能把 diff 全部当本专家已审签范围；新增文件在 [scope-status](a8-feedback-precheck-independent-retest-20261021-selftmp/scope-status.txt) 和 freeze逐项登记。

环境：macOS/darwin arm64，实际 Node **v22.23.3**，React/renderer **18.3.1**、Vitest **2.1.9**、TypeScript parser **5.9.3**、Vite **5.4.21**、PostCSS **8.5.30**。pnpm11.28.5仅项目口径，本轮未执行pnpm。实际依赖来自授权只读根 `/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules`，条目、package、React/renderer CJS 指纹见freeze；CSS解析器的实解析指纹另在SOURCE原件。

仅自有 `a8-feedback-precheck-independent-retest-20261021-selftmp/` 内有依赖软链、root/cache/TMP/Node缓存和输出。每轮显式 `--no-cache`、私有config/root/cache、单worker、关闭watch/coverage。没有写共享node_modules缓存或lib。

## 4. SOURCE 与真实观察

详见 [source-r2.audit.json](a8-feedback-precheck-independent-retest-20261021-selftmp/source-r2.audit.json) 与 [真实反馈记录](a8-feedback-precheck-independent-retest-20261021-selftmp/expert.observations.json)。

1. **BF-S01-kind-priority PASS**：AST枚举8处setBanner（含2处清除；其余为明确kind/text），唯一反馈标签 `BoardBento.tsx:262–268`。成功status+successmodifier；editorError并存时始终alert、不带successmodifier。26条实际反馈记录与结构吻合，包括C07加载错误+queue成功并存，不按文案猜颜色。
2. **BF-S01-persistence-refresh PASS**：与旧专家Board字节比对，去除setBanner表达式后，保存try/catch/finally、queue try/finally AST相同；重置新try内业务AST与旧重置body相同，新catch可见error后仍重抛。scope还是activeScope，保存/queue仍必需refresh，重置无refresh仍按原允许策略。没有把刷新失败当磁盘零写；保存错误文案改为“操作未完成”，不再声称“未落盘”。
3. **BF-S01-CSS-new PASS（SOURCE）**：PostCSS解析真实 `panel.css:2020–2021` 与 `board.css:240–244`。旧validation继续用overdue错误边/底/字；新 `.pm-bento .pm-bento-validation--success` 为背景success10%、边色success30%、文字既有pm-ink。新specificity **(0,2,0)** 高于旧 **(0,1,0)**，两规则无!important；border-color覆盖旧border shorthand颜色，保留宽/样式。pm-success由既有shell token继承；关闭按钮color继承。**不是计算色值、对比度或目视PASS。**
4. **RV01-local-CSS PASS（SOURCE）**：preview min-width0/max-width100%；warning normal+anywhere；pre pre-wrap+anywhere、36vh上限和局部auto内滚；actions独立flex-wrap。新增规则均局部，不靠新增全局overflow-x:hidden或截短路径掩盖。
5. **RV01-original-protocol PASS**：新panel与归档A7旧panel的完整恢复确认/取消callback，经TypeScript printer去注释后AST相同，包括第一次confirmDanger、第二明确确认、原path/content命令选择、成功后清预检与refresh、错误catch。当前主树相对HEAD的path新增是此前A7接缝，不误认为本A8重写恢复协议。
6. **RV01-bridge-source PASS**：冻结实际bridge、panel的snapshotReady/active/generation/hashchange与卸载门，未修改；真实panel五集成例及原bridge23例另执行通过。POST仅为注入fetch，不签launcher接收端或真实HTTP。
7. **BF-C-real-modifiers PASS**：26条真实renderer记录中status只配successmodifier，所有alert没有successmodifier；对应保存/重置/queue的错误、加载优先、关闭/重试末态。旧27项最后的CSS用例只是“error仍红”的观察，**本轮没有拿它单独签成功样式**，由第3项补新SOURCE。

[长路径补证](a8-feedback-precheck-independent-retest-20261021-selftmp/supplement.observations.json) 保留完整路径、完整输出、warning、危险对话框全文和命令序列：预检直接属于pm-main，不是shell第三主列；动作行两按钮。第一次确认只开对话框，取消仅两条原请求；第二明确确认才发送完整 `restore "<原路径>" confirm` 和后续snapshot。没有测量scrollWidth、bbox、焦点或真实文件内容，不代签RV01 GUI。

## 5. 旧失败与精确影响

| 文件/接缝 | 原证与本轮处理 | 不继承/不扩大 |
| --- | --- | --- |
| Board消息及reset catch | 旧专家27项17绿10红保原件；同r3副本新源27全绿，原六成功/四重置反馈失败在父观察域消失 | 不关闭A6真实GUI缺陷或完整B1-GUI-01 |
| Board成功CSS | 原A6成功红色帧、旧validation error观察保留；新SOURCE补specificity与实反馈modifier | 不用旧A6入口/chunk或新源码倒签旧红图 |
| panel结构/CSS | 作者原long1红5绿→path6+launch5全绿的归档已核；本轮独立复跑及长确认补测全绿 | 原A7-RV01 P1 GUI FAIL与原图保留；不扩为所有宽/深/缩放PASS |
| 原恢复协议/bridge | 与A7恢复callback相同、相关新源与原用例重测 | 仅允许继承“该callback未改”的SOURCE事实；完整恢复十三表/侧车/写根保护仍需绑定新运行证据 |
| 编辑器/持久化/运行 | 本轮冻结供接缝读源、未修改 | 不签真实BoardEditor/RGL/二确认GUI、chunk、reload、真实磁盘保存/恢复或正式保护 |

Main作者旧日志原件全部未修改，提供的A8目录已复制锁hash：

- `precheck/red` exit1，6项1红5绿，具体为parent=`pm-shell`而非`pm-main`；`green` exit0，11项全绿。
- `board-feedback/red-r2` exit1，其中两成功例被Vitest2不支持的 `toHaveBeenCalledExactlyOnceWith` 阻断，不能把该轮全部失败当产品FAIL；`red-r3` exit1，9项5红4绿，已是有效旧成功语义红；`green` exit0，9项全绿。
- “绝对fixture路径越界”是本派单提供的另一作者设施失败事实。当前所交A8归档目录未见其首轮完整独立原日志；照实保留来源层级，不补造或声称已独立核该日志。已提供旧日志不删除、不覆盖。
- 旧专家r1/r2设施失败及r3有效红见原review，本单不原地重跑、不改原件。

本专家设施也诚实保留：首次freeze因从pnpm包根解析传递依赖vite而MODULE_NOT_FOUND，exit1、尚未产freeze；只改自有解析为vitest→vite→esbuild后freeze0。首次SOURCE审计漏处理自闭合JSX标签，`onSave 0 !== 1`、exit1；只修自有parser遍历后r2 exit0，原stdout/stderr/postcheck及r1精确脚本保留。未改产品、fixture或期望结果，不算新增产品FAIL。

## 6. 全部验证命令与原件

macOS仓库根执行。执行器为 [run.mjs](a8-feedback-precheck-independent-retest-20261021-run.mjs)，每次精确子进程argv/cwd/起止/exit/signal、日志hash在 selftmp 对应 `*.execution.json`，原stdout/stderr与Vitest JSON一并保存。

```sh
cd /Users/bytedance/Projects/dsh-pm/pm-tool
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a8-feedback-precheck-independent-retest-20261021-run.mjs freeze
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a8-feedback-precheck-independent-retest-20261021-run.mjs expert
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a8-feedback-precheck-independent-retest-20261021-run.mjs panel
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a8-feedback-precheck-independent-retest-20261021-run.mjs author
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a8-feedback-precheck-independent-retest-20261021-run.mjs source
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a8-feedback-precheck-independent-retest-20261021-run.mjs source-r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a8-feedback-precheck-independent-retest-20261021-run.mjs supplement
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a8-feedback-precheck-independent-retest-20261021-selftmp/final-check.mjs
```

freeze首轮1/修设施后0；expert0、panel0、author0、source首轮设施1/source-r2 0、supplement0、final-check0。三组早期测试的精确测试源/配置仍保原字节；后续SOURCE/补测设施另按轮保存脚本副本。没有build或全包verify；本有限授权不做该类出口，由Main负责，不假称已完成。

final-check另执行七项Node `--check`（run/source-audit/final-check及四私有config）和本前缀 `git diff --check`，均exit0；逐条完整argv和退出见final-check。报告属于新增未跟踪文件，diff检查不冒充全文格式验证。

## 7. 收口与剩余门

本轮各postcheck及最终14:53:30Z检查：406枚举输入与frozen副本零字节漂移，登记依赖/解析器指纹无变化，原专家测试复制hash相同；各轮四个已枚举共享 `.vite/.vitest` 根的存在信息/文件hash+mtime无变化。**只签这些观察根，不声明全node_modules、整个工作区、全磁盘或正式服务零污染。**

**给Main的有限接续：** 当前源码可作为本轮SOURCE/AUTO通过对象继续既有A8唯一build和GUI采证，不要更改本报告/旧原证。按原A7 RV01-LONG/CANCEL/CONFIRM/REACH/WIDTH与A8 BF-G01–05交新实例的完整入口+异步editor实际响应字节、候选/宿主/产物/实例/flags绑定、真实保存/取消/reload/失败重试、长路径可达及原保护证据。没有新增矩阵或新产品要求。

GUI保持 **BLOCKED（不是MANUAL_PENDING）**，原A6-BGUI-01/A7-RV01 GUI FAIL历史保留；不签B8、B1整项、全部积压、Launcher、正式切换、发布、commit。以后焦点源/fixture/依赖变动使受影响结论过期，须另冻结复验，不覆盖本轮。

审签：trae，新独立A8反馈/恢复预检SOURCE/AUTO复验专家。产品/Main测试、builder/GUI owner：Main。本单写根仅本前缀与selftmp，无在跑自有进程；依负责人有限终点要求，本轮任务结束。

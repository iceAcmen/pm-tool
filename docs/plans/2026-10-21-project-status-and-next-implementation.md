# pm-tool 整体盘点与后续实施计划

> 给项目负责人、协调者、开发与独立测试专家使用。以2026-10-21拉取后的Git、当前源码及专家报告盘点实现、验证、提交和发布四层状态；后续批次是建议，不扩大本次授权。事实引用仓库相对路径，测试专家目录只读。

**Goal:** 收口现有候选与验证积压，明确真正未实现的范围，再按真实使用价值安排开发。

**Architecture:** 保持独立外挂插件、离线台账与人类可读JSON；复用现有命令、视图、冻结和测试设施。插件、宿主、运行服务及微信本机试点分别认领。

**Tech Stack:** macOS、nvm Node v22.23.3、pnpm 11.28.5、TypeScript/React/Cordis、Vitest、现有verify脚本；微信试点沿用独立Python环境。

## 1 当前整体判断

项目已经覆盖从计划、任务、排期、会议、风险到汇报、交付物的主要业务链路，并增加AI副驾、客观进度、资料/文件、OKR、习惯及档案能力。当前重点是已有增量的验收与交付收口，尚无依据把全系统标为完成。

| 层 | 本轮核实结果 | 依据与限制 |
| --- | --- | --- |
| Git | `HEAD=origin/main=9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，ahead/behind均0 | `git fetch origin`、`git pull --ff-only origin main`、`git rev-list --left-right --count HEAD...origin/main` |
| 产品候选 | `2a7603023bc54ef13d788e50069ee3fde4671bf3`已提交、已推送；之后仅文档变更 | `git diff 2a76030 HEAD --name-only`；[审签包](../../reports/batch1-expert-signoff-20261021.md) |
| 未提交产品代码 | 0；盘点开工时仅有未跟踪`.preview/` | `git status -sb`及`git diff HEAD -- packages launcher`；不将临时预览计为功能 |
| 最后已有版本tag | 远端`v0.7.4`已存在，2026-10-14指向`5fdb2d7525b669244a735c8e3018306c299c1b91` | tag对象`30c99e7077ad38538265d5025b35cce3b97a998f`；`git ls-remote --tags origin v0.7.4 'v0.7.4^{}'` |
| 当前版本号 | `package.json=0.7.4`，main包含tag之后的大量增量 | 版本号相同不证明新功能已发布；历史tag不移动，新版版本号在发布准备时另定 |
| 自动化记录 | 上轮插件1130/1130、build exit0、97/97 verify、launcher44/44及verify exit0 | [审签包](../../reports/batch1-expert-signoff-20261021.md)、[逐项退出码](../../reports/batch1-final-verify-20261021.tsv)；本轮只核记录，不重跑产品测试 |
| 独立验收 | 未找到绑定`2a76030`的最终专家报告 | 当前[收口计划](../testing/independent-acceptance-batch1-closure-plan-20261021.md)仍是计划；[R4/R5](../testing/independent-acceptance-r4-firstfindings-20261021.md)只覆盖较早候选的部分子项 |
| 运行服务 | 本轮只读定位3172/PID44388、3199/PID880；pm插件软链指主工作树包 | 这是端口/路径快照，不证明进程加载当前源码；本轮不重启、不改软链 |
| 宿主 | 本机源码记录`1142fb74f2`，其批准例外及正式加载身份仍待核 | [宿主边界补审](../retrospectives/2026-10-21-deep/08-late-boundary-evidence.md)；插件tag不代表整个宿主 |

37项候选源码指纹本轮全部匹配，97条验证记录均为exit0。以上是候选与记录完整性核对，未产生新的独立PASS。

## 2 已实现能力与验收层次

“历史已验”仅指对应日期、候选和范围；新改动受影响的部分须由专家决定重测或继承。不同编号体系存在交叉，不能相加得出总功能完成率。

| 能力 | 当前实现与提交 | 验证现状 | 下一步 |
| --- | --- | --- | --- |
| R1–R6 项目/WBS/里程碑/持久化导出/Web/离线命令 | 已实现、已提交推送；具备早期MVP发布记录 | 历史验收已完成；当前任务表/抽屉/共享反馈发生后续改动 | 回归受影响核心动作，不重开未受影响的历史需求 |
| R7–R10 风险问题/会议/固定汇报/交付物 | 已实现、已提交推送 | 有历史验收；新版资料关联、汇报表单及反馈待完整收口 | 会议→任务→交付→汇报旅程 |
| R12 检索/统计/Markdown导入及CSV/XLSX导入 | 已实现、已提交推送 | ADL-043已取代“不做Excel”；当前命令与网页上传入口存在 | 保留离线导入/预览/确认/重进回归 |
| R13–R15 AI WBS/汇报叙述/纪要归纳 | 已实现、已提交推送 | 确定性路径已有验证；真实模型仅支持当次调用结论 | 核当前界面入口、失败降级、确认前零写 |
| R16–R18 打开时提醒/行动项转任务/备份恢复 | 已实现、已提交推送 | 历史验证存在；备份已扩至extra表及文件资产，范围须重新核 | 复验新表、附件字节与失败回滚 |
| PROD 任务树/行内编辑/改父/搜索直达/相邻汇报对比/会议来源 | 已实现、已提交推送 | [Web polish](../testing/web-polish-acceptance.md)等历史专项通过；当前新版任务和records改动不能直接继承全部结果 | 当前核心旅程验收 |
| 人员负载/人员补全/项目及任务交付物仓库链接 | 已实现、已提交推送 | [人员负载](../testing/people-load-acceptance.md)、[仓库与补全](../testing/repo-link-assignee-completion-acceptance.md)有历史PASS | PROD-06不是未实现；人员聚合保持只读 |
| 甘特/依赖/只读关键路径/健康分/口径设置 | 已实现、已提交推送 | 甘特历史独立验收；关键路径与设置后续采证存在；当前D-07点按阈值未验完 | 当前调期、反馈、焦点与重进回归 |
| 客观进度/人工设定/工时/证据/完成日期 | 已实现、已提交推送；`task.ts`、`progress-derivation.ts`及#23记录可查 | [原OP矩阵](../testing/objective-progress-acceptance.md)仍全NOT_RUN；后续开发验证及GUI记录不能代替该矩阵回填 | 专家核实际范围、已覆盖项和仍需补测项，不能再写“客观进度未实现” |
| AI多步副驾/四类实体写扩展/撤销守卫 | 已实现、已提交推送 | [多步P0](../testing/copilot-multistep-acceptance.md)历史PASS；#22扩写另有验证；当前新版副驾须核受影响范围 | 确认→落库→冲突→撤销旅程；计划跨重启保存仍未做 |
| P2-1导航/P2-5命名视图、复合筛选、导出快照/P2-2语义颜色 | 已实现、已提交推送 | [G3终审](../testing/g3-evidence-receipt-20261017.md)§F已签12门PASS，旧P2-2 BLOCKED已被后续终审取代 | 当前B1–B8/13类改动另验；不将旧视觉缺陷重开 |
| P2-6 AI来源台账、重校、失效提示 | 后端与`provenance-panel.tsx`界面均已实现、已提交推送 | [r8](../testing/p2-6-independent-verification-20261017.md)签核心治理PASS候选；[次日总证](../testing/legacy-clearance-20261018.md)真实AI流程成功，但该流程refs为空 | 验有来源条目的跳转/改动失效/重校/历史；该真实成功不覆盖这些分支 |
| 深度融合P0–P3 | capture/会话绑定/窄集建议/缺席归档/metric/check/复盘/队列/投影/保护面/出站/OKR/失败经验/档案/述职/习惯均已实现推送 | [P0](../design/deep-integration-v2-p0-verify.md)、[P1](../design/deep-integration-v2-p1-verify.md)、[P2](../design/deep-integration-v2-p2-verify.md)、[P3](../design/deep-integration-v2-p3-verify.md)为组织者集成验证；[可达性专项](../testing/reachability-repair-20261018.md)独立PASS范围有限 | 不将组织者“核验”扩大为全部能力独立PASS；补完整旅程 |
| B1–B7新版页面、资料/进展、真文件、16卡、records及growth表单 | 当前源码已实现主要内容并推送；B1任务试用`pm-b1-pilot`默认OFF，共享dark安全层另计 | [B1–B8映射](../testing/b1-b8-coverage-mapping-20261020.md)有专项AUTO及Main采证；B8完整集成未整体签字 | 默认页与试用页分别列出；多页矩阵、状态、附件/恢复/汇报全链路待验 |
| 外部skill校验与自动路由 | 已实现推送 | [专家末次K域复判](../testing/external-skills-acceptance.md)为PASS；总体试点可用、未毕业 | 其余entry实际试点报告按现政策补；不再称路由零实现或全部未复验 |
| EGO/OIL工具试点 | EGO曾真实完成原生表单/上传/12页导航，OIL已导入且实际review | OIL独立安全审PASS及18项补丁单测；EGO后期存在启动挂起/401，性能对照未完；OIL的O3/O5真实故障态GUI待补 | [试点结论与使用建议](../../reports/ego-oil-pilot-status-20261021.md)：EGO可用时优先网页操作，稳定回归/桌面有备选；OIL仅评审第二意见，未全量接管设计 |
| 本地启动器 | 已实现、候选已提交推送；隔离.app交付已存在 | 42项旧独立单测、44项最新开发单测；Finder及安全边界未最终独立签字 | 本批优先收口；正式入口投放与服务切换需另有授权 |
| 微信桌面采集试点 | 本机工具已部署；计划与入口文档已随`2a76030`归档，运行代码/数据不在产品源码范围 | 20项开发自验；上次doctor权限false、白名单空；真实采集及定时未启动 | 本人权限/群名后真实采证；不是pm-tool正式接入 |

## 3 已做但未验证完的具体积压

### 3.1 当前第一批候选

| 对象 | 有效历史已验范围 | 仍需独立确认 |
| --- | --- | --- |
| D-01 看板连续拖动/压实/撤销 | R4删卡、撤销、自动排版子项PASS | 新修三拖三撤销逐态、保存重进、取消零写的最终原证 |
| D-02 卡库/配置互斥与主按钮 | R4单主按钮、分组卡库子项PASS | 宽档互斥、面板让位与窄档转换 |
| D-03 顶条与层级 | R4静态顶条不压卡子项PASS | 滚动/sticky叠层、反馈后画布可用 |
| D-04 工具条分组 | R4范围PASS | 新候选继承是否成立，由专家核变更影响 |
| D-05 编号/复制 | R4宽屏NOT_RUN；Main已修编号并报告复验 | 宽屏、键盘、成功/拒绝提示及复制原证 |
| D-06 抽屉与删除 | R4唯一主按钮子项PASS | 危险确认及级联，失败/取消保输入 |
| D-07 甘特点击/键盘 | R4键盘调期、持久化、单击选中子项PASS | 点按阈值、双击/Enter详情与焦点 |
| D-08 任务↔里程碑 | R4该双向流程PASS | 按当前影响范围继承或重测 |
| D-09 反馈分级/错误 | R4短advisory子项 | 当前深色、长错误、单处反馈及恢复单前缀最终原证 |
| D-10 汇报Markdown | R5手工编辑/预览/安全/保存重开子项PASS | session来源、宽深、源进展摘录冻结及当前集成 |
| D-11 任务↔交付物 | R4显式关联后主保存的草稿路径PASS | 即时写路径单独复测及两路径不变量 |
| D-12 OKR关联/错误 | R4说明与非法ID拒绝子项PASS | 全kind关联选择、深色及顶层错误 |
| D-13 习惯历史 | R4同日幂等PASS | 合法长历史、14天边界与按月折叠；Main采证待审 |
| Launcher | 旧独立静态/42项单测PASS | Finder→合法认证→mounted snapshot→当前nonce→S4、安全负例及取消/重入 |
| export/settings隔离路径 | 旧独立隔离阻塞；Main已修并报告配对成功 | 对新候选两个PATH用例独立复验 |

[最新审签包](../../reports/batch1-expert-signoff-20261021.md)还列三项代码自查：`.app`生成器未转义单引号路径、旧nonce可能确认新旅程、ResultCard新消息沿用旧复制状态。它们是待复现核定的问题，本轮未修。nonce实现10分钟与专家旧合同120秒不一致，由专家澄清合同后处理。

最终录屏、三次撤销逐态、复制参数等部分原证未完整归档；现存恢复错误JSON仍为修复前双前缀。不能仅据Main“观察成功”判通过，也不能把该旧JSON当新候选再次失败。第一批有8个既定GUI/桌面/PATH用例，专家逐项审证后才给本批结论。

### 3.2 第一批之外的验证债

1. B8全系统：12个入口可达不等于12页全部状态、四档浅深、键盘、失败恢复和原生200%通过。已有B8有效合同按其范围补，不将全局待表决矩阵自动升格。
2. B2/B3/B6：多修订active历史、软删保全、真文件暂存取消/提交/重进、表与字节备份恢复、选进展→预览→固定汇报。旧打包FAIL已被后续模块表门和可达采证取代，不能继续当现行启动阻断。
3. P2-6：有真实来源的治理全链；refs为空的成功示例不能证明来源修改/删除后的失效处理。
4. 客观进度与深度融合：专家将原OP计划及后续组织者记录对齐当前候选，逐项确认可继承与必须重测，补尚无完整独立报告的能力。
5. 原生200%、读屏专项及风险矩阵320px填充态：历史[总证](../testing/legacy-clearance-20261018.md)仍列待补；CSS模拟或DOM语义不代替真实相应测试。
6. CI：配置和本机验证已实现；本轮未查GitHub运行结果。E2E缺仓库外宿主会SKIP exit0，不能把远端job绿当真实宿主E2E通过。
7. 工具试点：EGO/Aha同条件效率未测完；OIL真实失败保输入与陈旧反馈尚无最终候选完整GUI原证。工具安装/安全PASS/成功使用不等全部场景稳定或设计模式毕业。

## 4 验证完但未提交的情况

本轮开工时没有这样的产品批次。先前独立PASS、作者验证全绿、复盘文档、微信计划以及13类/launcher候选，均已经在main历史及`2a76030`里归档。现在积压的是“已提交待验”与“已提交但发布/运行身份未收口”。

`progress/handoff/onboarding`中“17 ahead”“未commit/push”是授权前流水记录。旧PROD路线表、requirements和发布说明也有旧状态，必须按本轮入口读取。本轮新盘点与同步文档本身尚未提交推送，不列为未提交功能。

## 5 尚未实现与明确暂缓

| 能力 | 真实范围 | 后续处置 |
| --- | --- | --- |
| R11/H6 后台常驻推送 | 未实现；R16打开面板时提醒已实现。K11每日归档/季度回访钩子仅`enabled:false`占位 | 保持暂缓；[H6调研](../design/deep-integration-v2-h6-research.md)要求另决策，不能自动接定时器 |
| 多人实时协作/跨设备冲突合并 | 未实现，ADL-031裁剪；单写者备份/同步指引不是多人协作 | 有真实多人需求后单独立项 |
| 甘特自动排期/压缩/自动改期 | 未实现；只读关键路径与人工拖动调期已实现 | 继续长期观望 |
| Git自动桥、提交/PR自动同步或判完成 | 未实现；repoUrl/branch只是链接 | 不从仓库链接能力推定自动同步 |
| AI计划跨重启保存/自动追问多轮重规划 | 未实现；计划前端内存、撤销句柄进程内限时 | 单独价值评审；现有撤销已实现，不再整体列“无撤销” |
| 任务表多规则排序/列显隐及持久化 | 部分未实现：看板记录卡多规则排序已有[U4专项PASS](../testing/b4-u4-multisort-qa-20261020.md)；任务命名视图仍只有query/chip/grouped/单sort，没有列显隐模型 | B8专家核路线合同的实际承诺，已承诺缺口单列修复；未承诺扩展排后续 |
| U3 snapshotRef选取器联动 | 提案，未见正式接线；已实现的selectedRefs固定摘录是另一范围 | 保持提案，不能当当前验收失败 |
| 微信→pm-tool待确认动态→正式记录 | 尚无产品接入；只有本机只读采集试点 | 真实试点有收益后再定义数据入口、确认和验收 |
| 自动构建锁/程序化指令拦截/自动审签 | 未实现；ADL-057/058为协作约定 | 用现有任务与证据报告先检验效果，不立即造新平台 |

不得把Excel、生成型功能、人员补全、只读关键路径、客观进度、OKR/习惯或AI溯源整体列作“未实现”。视觉认可稿也不证明所有页面/状态已兑现。

## 6 分批实施顺序

建议按门安排，暂不承诺日期。下列角色是建议分工，未声称已经派发。每个代码批次均须先确认范围与测试合同，开发自测与专家判定分离；提交、推送、正式切换各核有效授权。

### 批次A 当前候选独立审签与确证缺陷修复

由协调者先接[审签包](../../reports/batch1-expert-signoff-20261021.md)，测试专家先核8个既定用例、三项自查及TTL差异，再决定补采/缺陷。Main只按专家步骤采证；开发只修确证问题。

| 文件 | 用途与影响 | 验证 |
| --- | --- | --- |
| `launcher/src/local-app.mjs`、`launcher/test/local-app.test.mjs` | 经确证后处理路径引用，影响生成的.app壳 | 含空格/单引号路径、实际生成脚本语法与执行目标，注入负例不执行任意指令 |
| `launcher/src/launcher-app.mjs`、`launcher/test/app.loopback.test.mjs`、`loopback-security.test.mjs` | 经确证后绑定当前旅程并处理TTL合同 | 旧回告/重入/切浏览器/replay/TTL/取消安全负例，真实Finder闭环 |
| `src/client/panel.tsx`、`result-card-copy.ts`及既有复制测试 | 经确证后重置新message复制状态，影响共用结果反馈 | 先复制A再显示B，B不得显示旧“已复制”；拒绝/成功与原文值 |
| `src/client/board/editor.tsx`、`editor-ops.ts`；`launch-handshake.ts`；`core/ui-feedback.ts` | 只有补采确认仍失败才继续改 | 三拖三撤销、保存/取消零写、snapshot后S4、单前缀 |
| `scripts/verify-export.mjs`、`verify-settings.mjs` | 当前已修，先独立复验，不预设重写 | 普通/含空格/改名路径配对，真实重启读回与写根隔离 |
| `reports/batch1-*`及living docs | 绑定最终源码/产物/运行，补原始证据索引 | 每用例有候选、环境、步骤、原证；专家另在testing写结论 |

上述`src/`、`scripts/`相对`packages/dsh-pm-tool/`；launcher测试路径相对`launcher/test/`。本批出口为范围清楚、证据齐全的独立结论。无PASS继续当前修复/补测，不开新功能；PASS后才准备正式交付。

### 批次B 现有功能完整旅程及B8验收

沿用B1–B8和既有设计合同；先由专家把历史PASS、后续改动及真实缺口映射到当前候选。一次只选一条完整业务旅程，上一条闭门后再推进下一条。

| 旅程 | 先核文件 | 完成条件 |
| --- | --- | --- |
| 看板发现异常→任务修改→返回 | `client/board/`、`client/views/tasks.tsx`、`client/panel.tsx`（TaskForm） | 默认/试用范围明确，上下文与焦点保持，保存重进、失败恢复成立 |
| 会议→任务→资料/文件→交付物 | `client/views/meetings.tsx`、`client/views/deliverables.tsx`、`client/shared/task-draft-materials.tsx`、`core/task-materials.ts`、`core/file-staging.ts`、`core/file-asset-store.ts` | 稳定ID/多修订/软删、关联和真附件不丢；取消零写 |
| 进展→固定汇报→编辑→预览→导出 | `client/views/reports.tsx`、`client/views/records/`、`core/progress-reports.ts`、`core/progress-report-markdown.ts`、`core/export.ts` | 同项目/软删/互斥拒绝，源修改不改变旧摘录，manual/session都覆盖 |
| 客观进度及治理/成长 | `core/progress-derivation.ts`、`commands/ask.ts`、`client/provenance-panel.tsx`、`client/views/okrs.tsx`、`client/views/habits.tsx` | 无信号不造数；有来源失效与重校留史；OKR/习惯跨重进成立 |
| 备份恢复 | `core/backup.ts`、`core/file-backup.ts`、`commands/backup.ts` | extra表与字节一致，legacy备份兼容，失败回滚，不碰正式数据 |

目录简称仍相对插件包`src/`。局部loading/error/长内容/键盘、四档浅深及原生200%按已批准合同补采；全局设计提议是否升格由负责人另定。若任务列显隐等属于已承诺但未实现的当前合同，专家先拆出有限缺口，由开发按方案补齐，不能静默排除。

### 批次C 共性工程加固与发布准备

富历史、多入口校验、文件恢复问题若阻塞批次B，应提前作为当前缺陷处理；其余先核现有设施，再补确证缺口。候选/模块表/隔离runner都已存在，避免整套重造。

- 装载与隔离：核`tsdown.config.ts`、`scripts/verify-client-module-table.mjs`、`verify-isolation.mjs`、现有冻结工具；故意漏声明资源/同步块/污染写根应被检出，正常异步块可加载。
- CI：核`.github/workflows/ci.yml`、`scripts/e2e.mjs`及远端真实运行。记录SKIP原因；若要让CI执行宿主E2E，先定宿主来源/安装方案，不把当前SKIP写PASS。
- 发布文档：`package.json`、新版本release、README、progress/handoff/onboarding。先核验收、插件及宿主身份、隔离部署、回滚点，再选择新版本号；历史`v0.7.4`不能承载当前全部增量。
- 正式动作：所有者明确授权后切profile与正式实例，按ISS-027精确PID流程记录旧停/新起。`.app`最终投放与正式服务分别核对象，不因为main已推就自动部署。

出口为可从仓库复原的受验候选与明确发布范围；没有独立门及发布授权不执行正式切换。

### 批次D 真实业务试用与新功能选择

微信本机试点在原授权内独立继续。本人提供必要系统权限和群白名单后，先采一次真实窗口，检查群标题、连续窗口/缺口/重复、原文来源和本地草稿。文件为[试点计划](2026-10-21-wechat-desktop-pilot.md)、`reports/wechat-pilot-20261021/`及已部署本机工具；不自动写pm台账、发消息或接云模型。

用真实项目走上述业务链，记录能否减少手工录入、需要核对什么、漏信息在哪里。只有这些证据支持收益时，再评审微信产品接入、计划持久化或任务视图扩展；H6、多人和自动排程保持暂停。

## 7 验证、授权与本次边界

本轮运行Git只读/正常快进同步、源码/文档检索、tag远端核对、37项源码指纹、97项exit记录和端口/软链检查；只修改盘点及入口文档。未install/build/verify/GUI，未改变源码、testing原稿、业务数据、服务或profile，未commit/push。纯文档无行为差异不要求盲目重跑产品全套，依据collaboration §11.5。

后续代码批次在已认领的隔离候选目录，由唯一构建者执行。macOS完整前置命令：

```sh
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm use 22 >/dev/null
cd /Users/bytedance/Projects/dsh-pm/pm-tool/packages/dsh-pm-tool
pnpm install --frozen-lockfile
pnpm run build
pnpm test
node scripts/verify-isolation.mjs
```

上面的主树路径仅用于说明包位置；实际验收须替换为该批认领的隔离包路径，避免覆盖正在使用的bundle。专家核runner覆盖的全部适用`verify-*.mjs`，真实模型按本批合同单列；若未纳入runner，另跑并记录，不把SKIP当通过。Launcher在认领的`launcher/`执行`pnpm test`及`pnpm run verify`。GUI/桌面另按专家用例，不由这些命令替代。

最先推进批次A。计划本身不等于新增代码、提交推送或发布授权，也不自动启动测试专家代理；负责人确认具体实施批次后，再按既有授权与门限执行。

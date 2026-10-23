# HC01 既有习惯卡长 OKR 先行合同与必要原红

> 2026-10-22，平台 trae，独立先行测试槽，非开发。给 Main 分派不同开发、不同复验、实际 GUI 使用；只交本缺陷最小范围及原证，不签产品完成、全习惯或发布。

## 1. 结论与范围

**先行合同已交：必要4 RED，控制9/9绿，限定保护零漂移，资源释放 STOP。HC01仍为有限视觉FAIL、未修复；本轮 GUI NOT_RUN。** 不以真实组件或CSS机制断言冒充布局/视觉PASS。[GM01原有限关闭](a19-habit-association-gui-review-20261022.md#1-最终结论)直接引用，不重复其全部守卫、不重开旧A18全门。

最小修复对象只在 `.pm-habit-card` 内原 `.pm-habit-okr`：badge `max-width:100% / min-width:0 / overflow-wrap:anywhere`，必要时原文本最小flex容器允许收缩，原Link2不压缩。候选文件仅 `src/client/panel.css` 的该旧卡规则、`src/client/views/habits.tsx` 的必要旧卡块及必要同域tests。**原图标、标题解析、正文、裁决声明、短badge外形、状态/编辑/打卡控制保持；不新增OKR编号、不改内容、不造新UI、不改suggestion/shared/shell/core/schema/统计。** 本角色没有修改这些文件。

[计划与完整父派单](a19-habit-card-wrap-contract-20261022-plan.md)在冻结前已落，依据 AGENTS §6A、collaboration §9/11。本批写根仅本前缀和 `/private/tmp/pmtool-a19-hc01-contract-20261022-r1/`；未 fetch/pull、install/build、pnpm/bin、GUI/服务/凭据/commit/push，未改他人testing或livingdocs。

## 2. 原件与候选

[原报告§7](a19-habit-association-gui-review-20261022.md#7-单列旧卡缺陷-a19-hc-01)和原390/1440图均只读独立目视；原view/exit/raw/frames冻结审计。390顶部两旧卡连续串右侧裁切明显；1440保原报告的有限FAIL，不增加为完整外壳/全矩阵判定。两原采集exit均0只是采集完成，不是视觉通过。

| 对象 | 绑定 |
| --- | --- |
| 390原证 | `A19/habit-association/width-1792634972808/actual.png`，原view CSS viewport390，原exit0 |
| 1440原证 | `A19/habit-association/suggestion-visible-1792634962691/actual.png`，原view CSS viewport1440，原exit0；PNG像素尺寸不冒viewport |
| 原habit | `habit-mvi5z84q-32ztau` / F5习惯；`habit-mviwizum-xt2ji6` / QA采纳习惯草稿 |
| 原OKR | `okr-mvi5z847-33y3xk`，原完整title含普通`<strong>`外形及连续72字符 |
| 基线/HEAD观察 | `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，不能单独代表dirty候选 |
| 冻结 | 508完整包输入/389src，`frozen-manifest.json` SHA `95dd7ba5e7f80a9712370998645a80495b8126a8ce287cfd3b947cd1948c3fc6` |
| tracked patch | SHA `c2ae0780e9847f52a47fc9b5ed274ec14ec9f4fd8a16d810058f6f876b29e13f` |
| `habits.tsx` | 15422bytes，SHA `f8434485002b4b6aab494655ee31613c7caec15a9a4a5a3e9b87568f07f766f3` |
| `panel.css` | 325791bytes，SHA `87ca4fc9f0899d87b3103fcc279a791839a23e921de6511a81086d85d9e54246` |

完整认领、新输入清单、依赖指纹与原图SHA见 [candidate](a19-habit-card-wrap-contract-20261022-evidence/candidate.json)、[原证绑定](a19-habit-card-wrap-contract-20261022-evidence/original-review.json)。raw按真实version/record及收件区record.value信封解包，原字段完整保留；没有产品adapter、未手造原GUI历史。历史月份反例为单独合法旧日期组件fixture，未混充原GUI种子。

## 3. 原命令与结果

环境 macOS darwin/arm64、OS24.6.0，固定Node v22.23.3、Vitest2.1.9、React/react-test-renderer18.3.1、PostCSS8.5.30。pnpm11.28.5仅项目约定，未调用。白名单env、独占HOME/TMPDIR/DSH_HOME/XDG_CACHE_HOME，禁Node compile cache、`cache:false / --no-cache`、单fork且min=maxWorkers=1，固定Node直达自有完整副本Vitest JS，不跑旧bin/shim。

| 阶段 | 原exit | 原结果 |
| --- | ---: | --- |
| `node --check ...-run.mjs` | 0 | 自有脚本语法 |
| `node ...-run.mjs freeze` | 0 | 完整源、原证与独占依赖冻结 |
| `node <owned-vitest> run ... --testNamePattern ^HC-R` | **1** | 4/4必要RED，9控制由pattern过滤 |
| 同命令 `^HC-C` 首轮 | **1** | 6绿/3自有设施错误，4必要由pattern过滤；原件保留 |
| `node ...-run.mjs run` 外层 | **1** | 保真实失败，不把预期红洗成0 |
| `supplement`原case diff | **1** | 正常diff表明自有更正，不是产品测试失败 |
| `supplement`必要组 | **1** | 同4/4 RED，明确断言诊断，无加载失败 |
| `supplement`控制组 | 0 | **9/9绿**，补正确fixture及日志后原期望保持 |
| `node ...-run.mjs supplement` 外层 | **1** | 保必要红 |
| `node ...-run.mjs seal` | 0 | 固定保护/源/依赖无漂移，四测试PID退出 |
| 自有语法/本前缀 `git diff --check` | 0 | 不替代产品或GUI门 |

完整可复制外层命令见[计划§4](a19-habit-card-wrap-contract-20261022-plan.md#4-冻结执行命令)，每组完整实际argv/cwd/env/PID/起止/exit/stdout/stderr/reporter在 [evidence](a19-habit-card-wrap-contract-20261022-evidence/)。不把两轮4红累加成8不同用例，也不把过滤skipped签PASS。

必要红精确断点：R01原badge max-width不存在；R02 min-width不存在（首轮Vitest undefined诊断保，补件以空串显式断言）；R03正文确含原连续72字符但overflow-wrap不存在；R04原svg没有不压缩约束。R03/R04失败后后续防裁切/文本容器断言未到达，不虚称它们已通过。无文本容器本身不是新增UI硬要求。

控制9项覆盖原两长卡全文/Link2/声明/无新ID与活动HTML、短title外形/原四按钮、missing原ID/无关联省略、新四建议自身内容/局部换行/状态控件、旧月份展开收起/补记/原字段、原编辑全量对象/三个打卡参数与true才刷新、重排/标题刷新/重挂零run及禁用控制。**只有组件接口，不宣称真实写入、历史迁移、键盘、窄屏布局或浏览器安全全部通过。**

首控制3错属于自有设施：两条观察序列化React Fiber循环，短title用例漏onEdit却期待编辑。只修自有观察/fixture，另补host-only文本子节点筛选与实际执行命名的标题刷新控制；原产品/原测试/原红无更改。原冻结case保留，补件新case单独文件及[精确diff/理由](a19-habit-card-wrap-contract-20261022-evidence/supplement/correction.json)绑定，不覆盖首失败。前期三个raw路径只读ENOENT与不可用memory检索不计产品红。

## 4. 保护与释放

[seal](a19-habit-card-wrap-contract-20261022-evidence/seal.json)：**15669固定条目**的新增/删除/SHA/bytes/mtimeNs/inode差异0，包括完整声明包输入、主lib/指定cache、指定原两GUI目录、原HC报告/seal、GM01独立报告、AGENTS/collaboration与指定依赖源。冻结副本源无漂移，完整依赖源及副本无漂移。

依赖从 `/private/tmp/pmtool-a19-owned-deps-20261022/node_modules` 全量复制，**13613普通文件/1030links**，全内容/SHA/bytes/link相等，逐link realpath闭合在自有副本，外链0/共享普通inode0。bin历史绝对前缀只文本未改未执行；不扩大为所有可执行绝对解析闭合。

测试PID **93005/93040/93275/93284** 均精确ps返回exit1/空stdout，已退出。没有builder、GUI连接、服务动作；不停止Main或正式实例。tmp原件保留供复核，不删除。保护只自freeze起固定根，不监控Main新增docs/GUI/live runtime、全testing/整盘，不声称零全盘污染。

## 5. Main 接续 / STOP

Main据本合同另派不同开发，仅旧卡badge/CSS及必要文本flex容器/图标修复；不同独立专家复验必要4与控制9，真实GUI另采新候选/加载绑定，原两habit长title/72串在1440深色与390深色完整可读、短title/新建议行不回归、图标/声明/状态/编辑/打卡不遮挡，并核原habit/checkIns/inbox/OKR及四根前后。新索引不得覆盖原699件。

**本独立先行槽结束、资源释放 STOP。** 没有修后候选、修后GUI或独立放行，不提前签HC01、全页、全部积压、commit或发布。

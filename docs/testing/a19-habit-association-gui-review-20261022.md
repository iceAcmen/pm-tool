# A19 习惯建议自身 OKR 展示有限 GUI 闭门审证

> 2026-10-22，平台 `trae`，独立测试专家，非开发、非 GUI 采集端。供 Main 按有限缺陷接续使用；只审既有原件、不运行构建或采集器，不签整习惯页、完整余项门或发布。

## 1. 最终结论

**A19 / 原 A18-GM-01：有限 GUI PASS，关闭“建议条目未展示自身关联 OKR”这一展示缺陷。限定保护 PASS，资源释放。** 原 A18 报告与原 13 RED 不改写；关闭只绑定本次新 A19 候选与原 GUI 补件，不追溯把旧失败改绿。

**另确证 A19-HC-01：既有习惯记录卡长 OKR 徽章横向裁切，有限视觉 FAIL，未修复。** 它是未改的记录卡区域，不是本批新增建议关联行的回归，不能因 GM01 通过把整页签绿；最小合同见 §7。严重度只排优先级，不构成豁免。本角色不开新开发、不签 A20、普通 commit 或发布总门。

| 对象 / 原合同 | 独立判定 | 有限范围 |
| --- | --- | --- |
| GM01 / RA-P3001：pending→confirmed/ignored→正常重进，自身目标展示 | **有限 GUI PASS / 关闭** | 两有效建议各自身当前标题与原 ID、理由、状态保留；不借 habit 卡证明 |
| missing / 无关联 | **有限 GUI PASS** | 真 suggest 原不存在 ID，诚实显示原 ID；无关联整行省略，不借他目标；只采 pending，不移签 missing 三态 GUI |
| 真 confirm / ignore 与写入边界 | **有限 GUI PASS** | confirm 仅一条关联 draft；ignore 不建档；旧 habit/原字段与历史、inbox 原键、OKR 保持 |
| 新建议行长标题 / 1440、390 深色局部 | **有限视觉 / UX PASS** | 当前标题刷新；普通 HTML 外形文本及连续 72 字符、原 ID 换行可读，不压自身状态/按钮；只签本行 |
| 保护完整性 | **限定 PASS** | 3937 个固定文件前后 SHA、bytes、mtimeNs、inode 无变化；不是全盘或实时 runtime 零写 |
| 既有习惯卡长目标徽章 A19-HC-01 | **有限视觉 FAIL** | 合法长标题/连续编号右侧被裁；本批未改此卡及 CSS，需单独最小修复/复验 |
| 全习惯、按 OKR 聚合、全矩阵、错误恢复、完整余项门、A20、发布 | **本批未签** | 不增加成 GM01 的新门，不替换其他专家原结论 |

## 2. 授权与方法

父派单明确：独立 A19 习惯建议自身 OKR 展示 GUI 缺陷闭门审证，非开发/GUI；仅写 `docs/testing/a19-habit-association-gui-review-20261022*` 及自有 audit，禁产品、其他 testing、livingdocs、build/install/GUI/services/credentials/commit。只核必要建造链原件，不自运行 build；SOURCE/AUTO 不代 GUI；仅两个宽度、本缺陷局部，不签 global 矩阵。原导航 Timeout 保留，发现旧卡另缺陷只列最小合同，不自改。

后续 Main 明确保持 A19 源码/产物/699 原件静态，要求交最终有限结论、源和报告 SHA、剩余具体缺件与释放，不重做旧 A18。Main 另采 `A19/number-visual` 仅导航/宽度/clipboard；**该新增目录、实时 runtime/页面状态/剪贴板不在本保护集合，不冲突、不继承本结论。**

依据 [AGENTS](../../AGENTS.md)、[collaboration §9/11](../collaboration.md)、[原有限计划 §3/4](a19-habit-suggestion-okr-contract-20261022-plan.md)、[原 13 RED](a19-habit-suggestion-okr-contract-20261022.md)、[不同专家 SOURCE/AUTO 最终报告](a19-habit-suggestion-okr-independent-retest-20261022.md) 与 [原 A18-GM-01](a18-growth-more-gui-review-20261022.md#51-a18-gm-01建议关联-okr-未展示)。已读旧 A18 定义，只引用其失败，不重做旧 A18 业务/全 GUI 审验。

使用 Node 内建 fs/crypto/assert 解析、原件 SHA、完整请求/事件与 raw 相接、四根差异重算；`view_image` 独立目视原 PNG/JPG，不操作浏览器、不生成替代图、不调用产品接口。GUI 结论来自图像、真实动作链、每条自身 ID 与原业务记录共同支持，**18+5 条文件审计断言、SOURCE/AUTO、150/1563 回归数本身都不是 GUI PASS**。

## 3. 候选与实际装载

基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`、宿主声明提交 `1142fb74f2bbcc54dc9499054c0448c9b876cbf2`；基线不代 dirty 候选。实际树 `/private/tmp/pmtool-a19-closure-20261022-r2`，531 声明源码输入、453 产物逐件 SHA 匹配，fixture 输入及 5 个继承 Launcher probe 另明确认领。

| 对象 | SHA256 / 实核 |
| --- | --- |
| [candidate.json](../../reports/all-pending-evidence-20261021/A19/candidate.json) | `e6ae8366eeaae4293d4d960cfe4002bf249b10f148aad13f97eecdb28fee25d7` |
| `habits.tsx`，15422 bytes | `f8434485002b4b6aab494655ee31613c7caec15a9a4a5a3e9b87568f07f766f3`，同不同专家 SOURCE/AUTO 签源 |
| `habits-suggestion-okr.test.tsx` | `8d7220cff8f01ed9d43dd00d1e59584936f4aa7ed68612aa40b56f00ca7cc709`，同独立复验 |
| tracked patch / new inputs | `f50844acb9a0aa7a74c796a71431bd856d2f1e022fc9dfc117b0c17474dc99e2` / `200408c53cc7da4e0c4a5195171967ac75b6158c0212a1f5f683bf6177cee930` |
| [SOURCE/AUTO 报告](a19-habit-suggestion-okr-independent-retest-20261022.md) | `b3dd111b4e8650858b22c6d94c71eaa759c6fb828b4c081bf9b47ddb24442044`；本轮只核绑定，不重跑 |
| client.js / loader 规范化完整段 | `2e1458d744e424cf795af46b652ba723ba14bc680ced53fd3af44a5613665267` / `812ca14e66af6706dd67c59a9ad3eada79f8311d55fef3201cf8a952406171f1` |
| 完整 combo | 2579410 bytes，`16abba2b181491bb6c70e8c5b8bbaac2c9c8f5babfa721e8adb776a4b4775744` |
| [loaded/result.json](../../reports/all-pending-evidence-20261021/A19/final/loaded/result.json) | `75f4d5581e3220cbaa8b7809f4f64b8680f33e61cee34566d7d1ae250120a928` |
| 原 GUI [index.json](../../reports/all-pending-evidence-20261021/A19/habit-association/index.json) | `f0bdc8eac0566a644452e876343614a19e6b7e6afbaa4724377acf1ace9f3aa5` |

loader 去末尾 sourceURL/sourceMappingURL 后补换行/分号，完整段 **1700578 bytes** 在 combo offset **875361** 唯一命中，第二处 -1；不是短哨兵或整个 combo 冒充 client。原请求 `87103.123`、frame/target `D9157A2EB8596AC74524928D5DC9F5EE`，200、非 disk cache。

[host-start/ready](../../reports/all-pending-evidence-20261021/A19/final/) 认领新隔离 **3249 / PID86987**、插件 r2 包；18 成功步骤 actual/view 全为 `http://127.0.0.1:3249`、`timeOrigin=1792634747265.7`，与 loaded 相接。逐步骤未另采 targetId，不伪称每步重新量过 target；本角色未查活服务或凭据。早 `environment.json` 是中止准备阶段骨架，`r2-runtime-binding.json` 是未起服时更正，实际运行以之后 host-start/ready 与 loaded 为准。

## 4. 合法种子与自身对象

原 `final/seed/{precheck,first-confirm,restored}.{json,png}` 显示正常预检、两次 UI 确认及恢复。实存文件是 **F5/backup.json**，SHA `8f9bf659a59077af3753900b9fec43dbca752673e59516d025f649a1982f8b4c`；seed.exit 边界文字虽写“F6”，对象以实际路径/字节与原备份为准，不改原件。首次业务 raw 的全部 habit/OKR 与 F5 backup.extra 完全相等，不手写 JSON 种子、不改历史。

原目标 `okr-mvi5z847-33y3xk` / `F5目标`。四次生产 suggest、user run/done 和 settings 信封完整相接，各仅新增/更新 `pmHabitInbox.json`，旧 habit/OKR 全字段不变：

| 建议稳定 ID | 自身对象 | 实际 GUI 状态 |
| --- | --- | --- |
| `habitsug-mviwgthg-lmdjlu` | QA 采纳习惯草稿 / 原 F5 OKR | pending→confirmed，重进保持；当前标题+原 ID |
| `habitsug-mviwh2or-orovb8` | QA 忽略习惯建议 / 原 F5 OKR | pending→ignored，重进保持；自身标题+原 ID |
| `habitsug-mviwhbc8-a95d2k` | QA 缺失目标建议 / `okr-qa-missing-original-reference` | pending，显示自身原 ID，不借 F5 标题或原 ID |
| `habitsug-mviwhikk-v0e83e` | QA 未关联建议 / 没有 okrId 键 | pending，省略关联行，不借记录卡目标 |

missing ID 原本确实不在 OKR 表，不是漏恢复。候选 `core/habits.ts:414-455` 明确 suggest 可引用尚未建立目标，confirm 才验存在/项目，故是真合法 suggest；**本轮不点击其 confirm，不签缺失确认拒绝 GUI**。每条断言按 `view.suggestions[id]` 与同 raw inbox 条目比，不在全页借标题。

confirm 新建 **`habit-mviwizum-xt2ji6`**：同项目/原 OKR、draft、空 checkIns、streak 三计数 0、独立新 ID；原条目仅变 status，新增 confirmedHabitId/processedAt。ignore 只改自身 status/ignoredAt，无新 habit；confirmed 条及其新 draft 完整保持。原四条 id/at/projectId/title/rationale/okrId 不变，原 F5 habit 的状态、普通字段、原 checkIns/streak 全保，未自动 final。

## 5. 完整步骤与原始账

根：[A19/habit-association](../../reports/all-pending-evidence-20261021/A19/habit-association/)。**19 步，18 成功 + 1 原导航失败；26 事件 / 13 请求 / 13 对 run-done，含 7 业务命令 + 6 snapshot**。各 request 原 line 对 run.args 完整相等，name=pm、source.kind=user、固定原 session、submittedAttachments=[]；done 均 success。采证 exit0 不代业务或专家判定。

请求原件是 `/api/commands/execute` 的 client-request/rpcId/method/payload，collector 从真实 page.request 保存 postData；POST 机制沿 [原 A18 RPC 源码审证](a18-growth-more-gui-review-20261022.md#4-命令输入请求与事件) 引用。**本包没有另存 HTTP method/status/header，不冒称每步 Network POST/200；浏览器实际输入/点击、请求正文、run/done 与 raw 均已相接。**

| 原 step（时间后缀） | 原 exit / 业务 seq | 独立有限结果 |
| --- | --- | --- |
| host-open `1792634770204` | 0 | 原 owned session/composer；只读 |
| command `1792634784038` / `1792634795946` | 0 / 13→14、15→16 | 两 F5 suggest；仅 inbox |
| command `1792634807916` / `1792634817411` | 0 / 17→18、19→20 | missing / 无关联合法建议；仅 inbox |
| nav `1792634827620` | **1** / snapshot21→22 | 首切 PM 后仍 tasks；等习惯30秒超时；无 after/raw，不伪填零写或成功 |
| nav `1792634874169` | 0 | 读现状后正常重试成功；自身 pending 目标可见 |
| confirm `1792634886688` | 0 / 23→24，snapshot25→28 | 真点该建议采纳；仅新 draft + inbox |
| ignore `1792634894762` | 0 / 29→30，snapshot31→34 | 真点第二忽略；仅 inbox，原习惯均不变 |
| reenter `1792634905223` | 0 | 全部任务→习惯；三态、自身目标和完整 raw 保留 |
| host-open `1792634916951` | 0 | 正常切宿主，零业务写 |
| command `1792634928532` | 0 / 35→36 | 真实生产 OKR update 长标题，仅该目标 title/updatedAt 变 |
| nav `1792634940470` | 0 / snapshot37→38 | 当前快照刷新，两有效建议采用新标题，原 ID 不变 |
| width `1792634952489` / visible `1792634962691` | 0 / 0 | 1440 深色局部关联行全文可读 |
| width `1792634972808` / visible `1792634986861` | 0 / 0 | 390 深色，confirmed/ignored 长关联行可读、换行 |
| visible `1792634996320` / `1792635005070` | 0 / 0 | 正常滚到 missing / 无关联，原 ID或无行、理由、按钮可见 |

全 18 成功步骤的四根 diff 独立重算吻合：**7 预期写步骤 / 11 只读零业务写步骤**。写分别四 suggest、confirm、ignore、OKR title update；不是“全旅程零写”。files/backups/exports 每成功步骤均无新增/删除/内容变化；137 个四表 raw 文件逐件 SHA 绑定 after-roots，6 snapshot 的 habit/OKR/inbox 与对应完整 raw 相等。

相邻成功采样另有 **8 处原 session_projcache 指纹变化**，只有 `/session_projcache/sessions/session-9d713d48-47cb-4993-b794-3f1f5a085317.json`；业务表、files/backups/exports 无间隙额外变更。没有 session 正文原件，不猜确定原因。失败 nav 无 after，不能独立称失败步骤“四根零写”；之后成功链支持继续审本有限展示，不签导航设施 bug、延迟或恢复 SLA。

## 6. 独立目视与局部边界

**699/699 原件 SHA/bytes 完全相符，加 index 共700；19 compositor manifests、325/325 JPG SHA 匹配，JSON 全可解析，未列文件0。实际独立目视 14 PNG + 10 JPG = 24 路径**，逐图观察与指纹见 [visual](a19-habit-association-gui-review-20261022-visual.json)。不是声称目视所有325帧，也不把帧数当通过用例数。

confirm 连续000002/3/4与完成000019、ignore连续000002/3/4与完成000023、真实 pending/processed 原 PNG、正常重进及局部滚动图共同展示自身关联与原动作。325帧中两处原 timestamp 约11ms倒序：missing命令000003→000004，ignore000000→000001；后一对 SHA相同。原文件/manifest不重排，详情见 [supplement.inversions](a19-habit-association-gui-review-20261022-supplement.json)。文件编号不是严格绘制时间顺序；原采证是 compositor 连续事件，不假称完美全录屏或以早帧冒终态。

长标题由真实 `okr update` 产生，含 `<strong>仅供人阅读</strong>` 外形文本及连续 **72** 字符。原图显示尖括号文本，不作粗体/HTML控件；确认和忽略条各取当前标题，原理由、ID和状态不变，不修改 habit 或 inbox。1440 深色已采确认建议全文；390 深色已采确认/忽略两条完整关联行，missing和无关联经真实局部滚动可见。**不冒称1440长标题下所有四条都在同一屏可见。**

390关联行自身宽 **243px**，scrollWidth=clientWidth=243、overflowWrap=anywhere，正文/原ID正常换行，状态与按钮未被新增行遮挡；body scrollWidth=clientWidth=390。1440 body两值=1440。图上仍有既有外壳局部横滚条与旧卡裁切，**body不撑宽≠整外壳无横滚≠整页通过**。DPR原loaded=1、正常1440和局部390 PNG采样=2、width390当步=1；compositor CSS宽度分别1440/390、pageScaleFactor=1，DPR不冒充200%文本缩放。

未采跨项目同名动态GUI、多不同有效目标GUI、missing confirmed/ignored GUI、键盘/读屏、浅色/1024/768/200%、错误恢复、新进程再读、聚合和全部成长旅程。组件/独立AUTO已有对应边界，只保原有限SOURCE/AUTO，不移签真实GUI，也不把这些未采项追加成GM01最小修复的新门。

## 7. 单列旧卡缺陷 A19-HC-01

**有限视觉 FAIL，建议 P2，未修。** 原图 [width390/actual.png](../../reports/all-pending-evidence-20261021/A19/habit-association/width-1792634972808/actual.png) 顶部“QA采纳习惯草稿”和“F5习惯”的 `.pm-habit-okr` 徽章，长目标/连续编号右侧被裁；[1440局部图](../../reports/all-pending-evidence-20261021/A19/habit-association/suggestion-visible-1792634962691/actual.png) 顶部旧卡同样裁连续编号。对比下方新增建议行却能完整换行，不能给旧卡借 PASS。

候选 `habits.tsx:174-179` 的旧卡渲染块与原 A18 逐字相同；完整 `panel.css` 与 A18 同 SHA `87ca4fc9f0899d87b3103fcc279a791839a23e921de6511a81086d85d9e54246`，其2920-2923为 inline-flex / width:fit-content、没有新增建议行的 anywhere规则。只确证当前呈现与相关机制，不猜历史首次出现版本，不定为新A19回归。

**给 Main 的最小合同，不是本角色实施授权：**

| 项 | 最小范围 / 验收 |
| --- | --- |
| 对象 | 仅 `.pm-habit-card` 内既有 `.pm-habit-okr` 文本容器；新建议行保持已签实现 |
| 文件候选 | `src/client/views/habits.tsx` 中该旧卡块及必要同域 tests；确需CSS时仅 `src/client/panel.css` 的 `.pm-habit-okr` 规则，经Main明确范围；不改全局shell/shared controls |
| 要求 | 合法长目标与连续编号在卡内自然换行，不靠隐藏裁切；短目标、装饰图标/裁决声明、状态/编辑/打卡控件可读不重叠，不引入自动写入/聚合 |
| 原证定位 | 上述 width390/actual、1440局部actual及各自 view/nodes/raw OKR；目标仍 `okr-mvi5z847-33y3xk`、原长title，勿手造历史 |
| 新最小补件 | 新候选/实际装载绑定，1440深色与390深色下该两habit卡长目标全文和连续编号可读、短标题控制、新建议行不回归；原habit/checkIns/inbox/OKR字段及四根前后；新目录归档不覆盖699原件 |
| 本轮剩缺件 | **GM01无缺件**；HC01缺修复后的上述局部原图/状态/四根和独立复验，当前不存在修后索引，不虚构路径 |

不因该单列有限FAIL重开全部旧A18、扩完整矩阵或代签A20。协调者依现有独立门安排当前确证修复与后续工作，普通commit持续授权不能代替独立总门。

## 8. 原建造链与失败保真

本角色只审 [build-r2](../../reports/all-pending-evidence-20261021/A19/build-r2/)、[fixture补件](../../reports/all-pending-evidence-20261021/A19/build-fixture-supplement/)、[build-final proof](../../reports/all-pending-evidence-20261021/A19/build-final/proof.json) 必要原件；没有构建/安装/重新跑测试或读共享依赖。每个最终receipt的label/argv/cwd/PID/exit/start/end与candidate.rows逐项相同，原完整命令保在对应 `.exit.json`，不以摘要假造执行。

| Main 原执行（macOS，Node v22.23.3 / pnpm11.28.5，r2隔离树） | 原 exit / 结果 |
| --- | --- |
| pinned pnpm `--version`；`tsc --noEmit` | 各0，11.28.5 / 完整noEmit |
| `tsc -p tsconfig.json`；`tsdown --config tsdown.config.ts` | 各0，453实际产物认领；CSS原清单13件只记复制清单、无独立退出字段，不伪填0 |
| `vitest run --coverage --maxWorkers=1 --minWorkers=1 --no-cache`，fixture补件后 | 0，**150 files / 1563 tests** |
| `node scripts/verify-isolation.mjs`；`node scripts/test-isolation-guard.mjs` | 各0，**95/95**，限定5文件保护污染0 |
| pinned pnpm `test` / `run verify`（Launcher） | 各0，**56/56 / verify**；包括明确继承5probe，不冒Main源 |

原准备复制过广后精确中止、未build且部分树保留；首无fixture coverage **exit1** 及缺输入保留，补合法原fixture后才新绿；proof记录的原finalizer把5个旧probe误查Main路径而FileNotFoundError保持，本轮不冒称取到未归档原stderr。最终候选显式5 inheritedLauncher origins逐字匹配，Main路径确实不存在。新副本/绿回归不洗旧10bin历史设施BLOCKED、旧原13RED/原seal失败，也不以本GUI签完整构建/依赖治理或发布门。

## 9. 审计、保护与释放

本轮命令环境：macOS darwin/arm64，固定 nvm Node `v22.23.3`，cwd本仓库根；pnpm11.28.5只为原执行约定，本角色未调用。所有自有写仅本前缀。

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/a19-habit-association-gui-review-20261022-audit.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a19-habit-association-gui-review-20261022-audit.mjs freeze
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a19-habit-association-gui-review-20261022-audit.mjs audit
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a19-habit-association-gui-review-20261022-audit.mjs supplement
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a19-habit-association-gui-review-20261022-audit.mjs visual
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a19-habit-association-gui-review-20261022-audit.mjs seal
git diff --check -- 'docs/testing/a19-habit-association-gui-review-20261022*'
```

最终 freeze/audit/supplement/visual/语法/本前缀diff/终seal均exit0；audit18/18、supplement5/5文件证据检查成立。首freeze旧临时树依赖软链exit1、首audit误把ANSI彩色stdout当纯文本exit1、首supplement误设帧时间单调exit1、再次supplement误把props类型变化当旧卡渲染变化exit1全部保留，详 [自有失败记录](a19-habit-association-gui-review-20261022-failures.md) 与本前缀 `-failure-*.json`。更正只作用自有检查器，未改原产品/测试/fixture/collector/699原件。

保护3937固定文件：699/index及全raw/frame、归档loaded/seed/build原件、A19完整声明源/453产物/fixture/继承5probe原源、旧A18完整声明源/453产物与原GUI原件、原13RED/不同专家复验固定回执及已读合同。**不纳Main动态源/livingdocs、其他在途testing、number-visual、活runtime/业务库/profile/凭据、服务、共享依赖/cache。** 从本freeze到终seal无新增/删除/SHA/bytes/mtimeNs/inode差异；起步只读早于freeze不追溯称覆盖。

[终seal](a19-habit-association-gui-review-20261022-seal.json) 绑定本报告/源审计产物完整SHA，报告自身SHA以其中 `owned` 的本报告条目为准。**本角色完成、释放/STOP**：没有测试子进程、builder、GUI连接或服务动作；不停止Main的3249，不修改页面/剪贴板，不删除临时原件、不提交。Main可领取GM01这一有限关闭结果与单列HC01最小合同；其他余项及最终普通commit仍各按现有效合同，不扩大本签字。

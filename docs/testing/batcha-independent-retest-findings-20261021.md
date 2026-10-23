# batchA 修复候选独立复验

> 给 Main 持续读取：独立复验端只写 testing 自有产物，不改产品、测试源、vendor、living docs，不构建或写主树 lib，不 commit/push、不启动产品服务。本文逐缺陷/设施判定，不给 batchA 或全系统 PASS。2026-10-21，平台 trae，独立测试专家角色。

## 最新结论（第五轮，第四轮设施修复后复核）

**三项源码/AUTO缺陷及具体测试设施缺陷局部 PASS；GUI、真实 TTL、Main 全量回归尚未审签，整批不 PASS。** 首轮空目录污染与第三轮设施 FAIL 保留，未被复跑抹除。

| ID | 独立判定 | 证据边界 |
| --- | --- | --- |
| BA-DEF-01 | **PASS：POSIX引用缺陷/AUTO** | 既有两份launcher测试12/12；各路径语法/完整字面值绿。完整stub argv、safe app/Finder旅程仍未审。 |
| BA-DEF-02 | **PASS：源码/内存/既有loopback复验** | 顺序撤销6分支、独立8项异步竞态、Main新journey-race3项+原cancel.race6项皆绿；ready后不杀、取消幂等、真隔离瞬时node退出有原证。GUI/Finder/真实TTL不包含在此PASS。 |
| BA-DEF-03 | **PASS：真实React组件/AUTO** | 原组件4/4+writer3/3，专家补充组件7/7，抽离静态contract11/11；真实系统clipboard/权限/深主题/焦点原证未审。 |
| BA-INF-01 | **PASS：具体file-root设施修复** | 第四轮、第五轮各两份新完整布局assets缺失初态，原5/5、exit0、assets始终不存在、真实guard manifest零变化；生产file-asset-store与guard未改。全量pnpm test/verify-isolation顺序回归仍待Main，不是全局隔离门PASS。 |
| BA-TTL-01/02 | **NOT_RUN：真实130s/601s** | 假时钟白盒通过不替代真实计时/HTTP。 |
| BA-JOURNEY-01、BA-COPY-01及原GUI/Finder | **NOT_RUN：等待Main原证** | 未读取私有入口/凭据，未自行浏览、启服或采GUI。旧缺证BLOCKED保留原范围，本轮未执行新GUI者NOT_RUN。 |

### 当前候选和原证

- 产品基线`2a7603023bc54ef13d788e50069ee3fde4671bf3`，HEAD`9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`加未提交修复。最终关键指纹：launcher-app=`b41e5fbaf8fe7679fe1516f92c516c24d89b60b636db529a002f2e727d3a5c19`；result-card=`c7c2578c2b3799c422ff202bde7b2003492e3688a30dac3ee84c9e3b4c9e517b`；file-root.test=`88b573dcd19d54266a5d4c7fcc506a2d6f38e55c5218bbb6e9bfa228528f212d`。第五轮新增核对launcher package与journey-race；24个文件测试前后无变化，拷贝源指纹一致。
- 第四轮[结果与命令](batcha-independent-retest-result-20261021-r4.json)；第五轮[结果与全部指纹/命令](batcha-independent-retest-result-20261021-r5.json)。环境macOS、Nodev22.23.3、Vitest2.1.9、React/test-renderer18.3.1，自有tmp副本，只读链接Main隔离依赖，未build/install。
- 第五轮[launcher12/12](batcha-independent-retest-launcher-20261021-r5.txt)、[ready/cancel+新竞态9/9](batcha-independent-retest-launcher-races-20261021-r5.txt)、[原7+静态11](batcha-independent-retest-component-20261021-r5.txt)、[专家组件7/7](batcha-independent-retest-component-additional-20261021-r5.txt)、[设施5/5一](batcha-independent-retest-fileroot-1-20261021-r5.txt)、[设施5/5二](batcha-independent-retest-fileroot-2-20261021-r5.txt)。六条子命令均exit0；独立竞态记录在JSON probes。没有运行Main全量build/vitest/95项guard，不能回填其整体结果。
- 具体设施修复：Vitestfactory保留fs其他真实导出，mkdir默认vi.fn(actual.mkdir)透传真实现，只有builtin分支mockResolvedValueOnce；非builtin三个路径仍走真实创建，finally清调用记录。第四/第五轮已分别证明新根零污染；原5项真实路径行为保留。修复不涉及产品路径选择、生产fail-closed、WATCH或sentinel，也没有清除真实assets。
- 第五轮cancel测试的瞬时node为原用例自拉起、用controller对精确child取消，退出原证9/9，不是启动dsh/launcher产品服务。未改正式/隔离服务、profile、数据、系统设置，不执行git commit/push。

### Main 收件后的动作

1. 把以上**具体候选局部PASS**绑定到新冻结清单；launcher源码已变，不得继承旧生成app/Finder产物身份。Main继续唯一builder，不使用主树lib。
2. 保留首次95/95+空目录污染1和本报告根因/第三轮失败；交新候选顺序全量pnpm test、verify-isolation的命令/exit/原根清单，专家再审整体设施门。既存空目录不是正式数据损坏，无擅自删除授权。
3. 继续原batchA缺陷单、TTL裁决与remaining总登记的GUI原证；不新扩大资料/OP/总矩阵。完整原证到件后逐ID审，不用本局部结论开始下一功能、提交或发布候选。

## 0A. 第三轮历史设施失败（已由第四/第五轮修复）

**BA-INF-01仍FAIL**。Main刚改 `file-root.test.ts`，第三轮独立副本两份都为**4/5、exit1**，错误 **`TypeError: Cannot redefine property: mkdir`**，位于`:69`对`import * as fileSystem from 'node:fs/promises'`命名空间执行vi.spyOn。原ESM内建模块namespace属性不能直接重新定义。两根均保持assets缺失且manifest零变化，但这是测试在spy阶段失败，不能据此判设施已修好。

- 被测测试文件sha256 `1a81af3c41d25525c289232cb0447ed6534950f970ed9067d87f0f189a6cbb79`；file-asset-store产品源码未改。第三轮复制前后21项指纹一致。第三轮launcher12/12、组件原7/7+静态11/11、专家组件7/7、8项竞态复验仍保持通过，第二轮局部PASS可继承，不扩大为整项。
- [第三轮结果/全部命令与指纹](batcha-independent-retest-result-20261021-r3.json)、[设施一失败原文](batcha-independent-retest-fileroot-1-20261021-r3.txt)、[设施二失败原文](batcha-independent-retest-fileroot-2-20261021-r3.txt)。
- 最小修复补充合同：选用Vitest可拦截的模块factory（保留真实其余fs导出，作用限定该测试文件/分支、finally复原），或§3已给的独立模块路径fixture。不得直接spy不可配置的ESM namespace、不得把整套真实fs用例全部mock掉；显式/isolated/profile仍需真实落目录，生产fail-closed仍需真实错误，builtin需核选择和mkdir参数。
- Main修后交**新空根初态**原5项全绿+manifest不变，再交顺序完整pnpm test/verify-isolation原证。不预建根、不改guard、不以失败时零变化放行。第三轮失败保留，不覆写首轮/第二轮空目录归因。
- 本执行器的所有`.log`已经在第三轮以逐字节sha256校验归档为同名`.txt`，见JSON rawLogArchives。`.log`被仓库通用规则忽略，`.txt`不忽略；下方旧链接若指向`.log`，使用同basename的`.txt`即可接续，两者字节相同。第三轮直接生成`.txt`。没有删除旧原证。

## 0. 第二轮局部判定（07:46Z，设施项已被0A更新）

Main 读取首轮 findings 后已更新 launcher-app；专家第二轮只复制并运行，未写产品。**下方首轮 FAIL 是历史，不再当作第二轮候选仍有相同缺陷。** BA-INF-01 则仍未修复。

| 对象 | 第二轮判定 | 准确范围 |
| --- | --- | --- |
| BA-DEF-01 | **PASS（AUTO/源码引用缺陷）** | 生成器未再变，第二轮两份 launcher 测试 12/12/exit0再次验证；BA-PATH-01完整 argv/Finder 等剩余原证仍待采。 |
| BA-DEF-02 | **PASS（已交源码及内存/原loopback AUTO复验范围）；GUI NOT_RUN** | 顺序失效6分支、迟到probe取消/返回4格、probe替换1格、真实controller迟到异常2格、重入取消1格均通过。不是 Launcher/TTL/Finder整项PASS。 |
| BA-DEF-03 | **PASS（真实React组件与源码）；GUI NOT_RUN** | 产品组件4/4 + writer3/3；专家组件补充7/7；新位置contract-pilot11/11。真实系统剪贴板、深主题/焦点/持久错误原证仍待Main。 |
| BA-INF-01 | **FAIL（测试设施隔离），仍阻塞设施收尾** | 第二轮两个新的空根副本依然各5/5且产生空assets/sentinel变化，与首轮同型。真实产品数据未被本复验读取或写入。 |
| BA-TTL-01/02/03 | **130s/601s真实计时NOT_RUN；替换/取消内存部分PASS** | 原假时钟测试保持白盒通过；不把它当真实时钟/HTTP、GUI认证结论。 |

第二轮：[完整原证及候选指纹](batcha-independent-retest-result-20261021-r2.json)、[12项launcher](batcha-independent-retest-launcher-20261021-r2.txt)、[原7项与静态11项](batcha-independent-retest-component-20261021-r2.txt)、[专家7项组件补充](batcha-independent-retest-component-additional-20261021-r2.txt)、[设施新副本一](batcha-independent-retest-fileroot-1-20261021-r2.txt)、[设施新副本二](batcha-independent-retest-fileroot-2-20261021-r2.txt)。所有子命令exit0表示其用例本身通过，设施manifest仍有变化，不能据此判隔离PASS。

### 0.1 新候选与继承/失效

- 第二轮 `launcher-app.mjs` sha256 **`b41e5fbaf8fe7679fe1516f92c516c24d89b60b636db529a002f2e727d3a5c19`**，相对产品基线的当前 tracked diff 文本指纹 `0780a382a8bff9f810468b31fab11bea7cfe4ae7d111c9aa919dc3ab9d290ede`。其他关键文件指纹同首轮；第二轮21个源码/配置文件前后无变化，副本已拷项逐字节一致。
- 变化：invalidateEntered 同时废弃缓存并调用 cancelStartup；新 openCurrentJourney 在入口捕获代际，probe/失败/ownedStart全程核代际；launchOwned迟到失败也核代际；detect成功返回亦核代际。对真实控制器的 ready/非owned保护未改，第二轮重叠时9201/9202各收到准确SIGTERM，旧URL零保留、零投递、S0。
- 新source使旧Launcher app/GUI产物身份过期，需要Main重新冻结/生成safe app并采证，不可从3205“在运行”或旧录屏推断装载。ResultCard/文件域本轮无进一步差异，其第二轮独立断言不因launcher变更自动失效。
- 第二轮补齐原 `tsconfig.json`（jsx=react-jsx）与 package.json 后，原4个组件用例全部通过；首轮“React is not defined”仅专家复制设施失误，原日志保留，没有更改产品或降低用例。

### 0.2 ResultCard 原语与复制代际边界

- 原真实组件4项覆盖A成功后B清反馈、A迟到resolve/reject不得给B标结果、A失败原文保留与B清旧失败；writer3项覆盖完整参数/resolve/reject/API缺失。不是自建copyState模型。
- 专家新增7项覆盖B先成功后A迟到resolve/reject、A→B→A代际不复活、纯结构化成功不常驻及隐藏期间旧复制、权限error的alert/assertive/原文/关闭、持久成功action/status/polite/详情切消息收起、卸载后旧writer不影响新卡。
- 抽离前后仍调用相同classifyFeedback/extractBackupPath/shouldPersistResultCard；className、error role/aria、原文展示、详情、action callback、复制原文/路径及失败文案保留。生产panel接线未注入测试writer；React renderer为dev依赖，锁文件版本18.3.1与React18.3.1匹配，未引入运行时renderer。
- generation守卫证明**反馈不跨消息污染**，不能证明已经发出的旧系统clipboard操作可取消，也未承诺同一message内多个copy请求按发起顺序仲裁。真实剪贴板内容和权限拒绝由BA-COPY-01 GUI原证核对；不因这些未覆盖边界自行扩大新硬门或宣布全反馈层PASS。

### 0.3 Main 当前可继续

按§3合同修file-root设施，交全新根清单和顺序全量回归原证；同时继续既有计划的补采。候选再次变化须重新绑定受影响证据。逐域/GUI最终审签仍等Main原始包，资料/OP/总矩阵顺序不变，不授权push/发布或下一功能。

## 1. 即时结论（第一轮，07:41Z）

| 对象 | 本轮结论 | 原证及边界 |
| --- | --- | --- |
| BA-DEF-01 | **PASS（路径引用源码及已有 AUTO 范围）** | 两项 launcher 测试文件共 12/12，exit 0；包含普通/空格/中文/单引号/特制字面量、语法和完整变量值。新 safe app、实际 stub argv、Finder 原证尚未审，不表示 BA-PATH-01/Finder 整项通过。 |
| BA-DEF-02 | **FAIL（顺序句柄修复通过，但异步竞态未闭）** | 顺序 open/reopen/retry/switch/cancel/back 旧句柄均拒；下列迟到探测和失败可复现。Main 先修，不以 12/12 扩大为 Launcher PASS。 |
| BA-DEF-03 | **源码修复方向成立，组件独立执行待补设施后复验；GUI NOT_RUN** | 第一轮副本遗漏 tsconfig 的 JSX 配置，4 个组件用例报 React is not defined；这是专家副本设施错误，不开产品 FAIL。writer 3/3、更新后的 contract-pilot 11/11。补拷原 tsconfig/package 元数据后重验。 |
| BA-INF-01：file-root 测试污染 | **FAIL（设施隔离），根因链确证** | 两份全新源码副本各运行原 file-root.test.ts 5/5，均产生空 assets；真实 guard manifest 从 `assets\|!!MISSING` 到空 map，报“删除 sentinel”。不是文件或业务 JSON 删除，不是正式数据损坏。 |
| BA-TTL-01/02 | **NOT_RUN（真实 130s/601s）** | 原测试的假 Date.now 白盒断言通过，不替代真实计时/HTTP，保持原专家 10min 裁决。 |
| GUI | **NOT_RUN，等待 Main 新候选原证** | 派单给出 3205/PID27767、新独立 Chrome profile、隔离运行根；这些是 Main 声明，专家未读取 entry-url/browser-ws/凭据、未自行连服务。不是已审签运行绑定。 |

原证：[副本执行结果](batcha-independent-retest-result-20261021.json)、[launcher 输出](batcha-independent-retest-launcher-20261021.txt)、[组件首轮输出](batcha-independent-retest-component-20261021.txt)、[设施副本一](batcha-independent-retest-fileroot-1-20261021.txt)、[设施副本二](batcha-independent-retest-fileroot-2-20261021.txt)。执行器：[独立复验脚本](batcha-independent-retest-20261021.mjs)。

## 2. BA-DEF-02 未闭分支与最小修复合同

这些是当前 BA-DEF-02 的异步复验，不是扩大下一阶段新硬门。内存探针使用真实 createLauncherApp；控制器失败/重入探针使用真实 createDshController + 假 spawn/ready/terminate，未拉起进程，PID9101/9201/9202仅 fixture。

### 2.1 P1：迟到探测复活取消/替换的旅程

- 位置：`launcher-app.mjs:107-109,162-169,194-201`。open/retry 在 await 探测之前增加 journey，但返回后未核当次 journey；launchOwned 到开始启动时才取 journey，错误地认领取消后的新代际。
- 实测四格：open 等探测 → cancel/back → 释放 running/stopped。全部先 S0 后 S3、opens=1；stopped 两格还 starts=1，迟到新句柄均有效。
- 实测替换：旧 open 探测阻延 → retry 完成新投递 → 旧探测返回。opens=2；retry 的当前句柄被清除（false），旧操作迟到铸的新句柄反而 true。
- 合同：在 open/retry 入口捕获请求代际；探测结果、探测缓存更新、决策/失败、启动、投递均必须属于该代际。取消/返回/替换后，旧成功及旧异常不能新开窗口、新起 owned、新铸句柄或更改状态/缓存。不得仅在 controller.start 返回后守卫。有效最新旅程仍须正常 S3→S4。

### 2.2 P1：旧启动失败覆盖新状态

- 位置：`launcher-app.mjs:141-153`，只特殊处理 STARTUP_ABORTED，其他错误未检查 launchJourney。
- 真实控制器 IO 缝实测：owned 等 ready → cancel → ready Promise reject，S0→S6；另一格旧 owned 等 ready → retry 探测 running/投递 → 有效新回告达 S4 → 旧 ready reject，S4→S6。
- 合同：成功与失败对称守卫代际，任何被撤销启动的迟到错误都不得覆盖当前状态。真实 ready Promise reject 与 STARTUP_ABORTED 分别回归；当前旅程真失败仍须诚实 S6。

### 2.3 P1：重入覆盖 controller 的单个 flight，取消遗漏旧未就绪 child

- 位置：`dsh-controller.mjs:start` 的 `flight=f` 与 cancelStartup 的单对象回收。此模块未改，属于修复边界暴露的既存重入风险，不能描述为本轮新引入回归。
- 真实控制器 IO 缝实测：第一次 owned ready 尚未返回 → retry 再次判断 stopped/再 start → cancel。spawn 两个 fixture，仅第二个9202收到 SIGTERM；第一个9201当时未就绪却未回收，后来 ready=true。最终 S0/零投递/URL 已弃，不证明没有遗留先前启动。
- 合同：Main 可在编排入口阻止重叠 owned，或让控制器明确管理所有在途 owned；不指定重构方案。替换/取消应回收自己尚未就绪的准确对象，已 ready、非 owned、现有服务保持不动。新旧请求次序、取消、ready边界都保留回归，不以“旧 URL 已弃”代替 child 生命周期闭合。

### 2.4 select-browser 观察，不单独开 FAIL

- Chrome 已投递 → 只改偏好 Safari → 原句柄 false；偏好改回 Chrome → 原句柄 true，投递浏览器仍 Chrome、opens=1。这来自 rec.browser 与可变 selectedBrowser 比较，不是记录不可逆失效。
- 当前 control UI 选择菜单只在 S0/S1；S3/S4 的 switch-browser 是显式换旅程并清 map，因此没有在真实 UI 证明“只改偏好造成现旅程被冒充”。
- 保留旧专家裁决：select-only 不必等于投递新旅程；不因上述 direct API 观察单开失败。修复时区分偏好与实际旅程浏览器，不借改偏好悄悄重投 token；显式 switch/open/retry/cancel/back 的旧回告仍必须拒绝。

## 3. BA-INF-01 设施根因与修复合同

### 3.1 确证链及归因限制

1. `file-root.test.ts:9-18` 在 beforeEach 删除全部根覆盖及 dev/test 信号，即使父命令设 isolated root 也会被清除。
2. `file-root.test.ts:63-68` 设置 DSH_DEV=1 后调用 describeFileRoot，且只检查 source、不清理 builtin 根。
3. `file-asset-store.ts:31,80-82` 从模块 URL 上四级解析到仓库根 assets，并 await mkdir(mode0700)。虽然注释称“包内”，实测与真实路径算术均为仓库根，不依赖 cwd；仅改测试 cwd 无法隔离。
4. 两份互不共写且初始 assets 缺失的副本，都用未改产品/测试源码运行，5/5且留下 entries=[]。
5. 用真实 verify-isolation 的 buildManifest/diff 比较，均 before 含 `assets|!!MISSING`、after为空，恰好复现 Main 首轮 sentinel 变化类型。

因此这条测试有充分能力造成首次空目录变化，并发 pnpm test 与 guard 的监测窗口可以捕获。**尚无 Main 首轮时间线原证，不能唯一排除其他写者或断言已逐时点证明首次历史进程归因。** 首轮“95/95但污染1”保持失败历史；第二轮零变化只证明那轮没再新增，不闭首轮。

### 3.2 最小修复范围（Main 实施，专家不改）

- 优先修测试设施：builtin fallback 用例在自有独立模块路径/临时完整布局验证；或提供不触盘的根选择 seam 并单独验证真实 mkdir。选择由 Main 按局部代码判断，不改生产 fail-closed/precedence 需求。
- 不准通过预建仓库 assets、删除 WATCH/sentinel、忽略空目录变化、复跑覆盖旧失败、rm 真根“恢复零变化”来让 guard 变绿。不删除/覆盖用户或 Main 已有目录。
- beforeEach/afterEach 的环境恢复和临时 fixture 清理须 finally 可靠。父命令 env 指向 tmp 不够，因为本用例主动清环境。仅 cwd 改 tmp 同样不够。
- 复验合同：在新的完整源码隔离树 assets 不存在初态，单跑 file-root 原5个行为仍通过、外层根无新增；再顺序执行 pnpm test 与 guard，分别记录前后根清单、exit、全量输出。若继续并行，必须独立输出及根监测能覆盖两者，不能再共用受守护根或混淆归因。
- 现有首次空目录列为“设施副作用，零文件条目”；历史修复闭合与正式数据保护分开。需要既存空目录处置时另交 Main 记录/获得相应授权，专家不清。

## 4. 候选与执行身份

- 产品基线 `2a7603023bc54ef13d788e50069ee3fde4671bf3`，HEAD `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` 加未提交 batchA；首轮 tracked diff sha256 `b9ecd5b95d5ad44bd5e96d51cae2001e565f0e19e49026b75a41bd01c2da0a15`。此指纹为脚本截取文本形式，逐文件字节指纹为 JSON sourceHashes/copyHashes 权威对象。
- `launcher-app.mjs` sha256 `dd6ec83f410729ceef22871baa352e9af56cd344395a02c309372b6d06e1befe`；`local-app.mjs` `1feaba02db033136e9786a7310a96a72c7332114faece5295b5b44545f058f9b`；`result-card.tsx` `c7c2578c2b3799c422ff202bde7b2003492e3688a30dac3ee84c9e3b4c9e517b`。首轮前后19个源码/声明文件指纹无变化，已拷项一致。
- macOS/darwin，nvm Node v22.23.3；链接 Main 隔离树的 node_modules，只读依赖、不安装/构建，副本独占输出。Vitest v2.1.9，React renderer18.3.1。主树 lib 与 Main 构建树均未写。
- 12项 launcher 测试原有 HTTP 集成在测试期间自行建/关随机 loopback；这是授权的原测试 IO，不是起 dsh/launcher 产品服务。其他探针无监听、无进程拉起、无 Finder/browser 操作。
- 不读取或输出实际凭据、私有 entry-url/browser-ws、浏览器 profile/正式业务文件；原测试的合成认证值未作为真实 URL 使用或输出。
- 下一阶段资料/OP/总矩阵按 remaining-acceptance-register 和既有计划执行，无新增全局门。

复现入口（macOS + nvm Node22，依赖由 Main 已冻结提供）：

```sh
cd /Users/bytedance/Projects/dsh-pm/pm-tool
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm use 22 >/dev/null
node docs/testing/batcha-independent-retest-20261021.mjs r6
```

具体子命令、cwd、exit 已逐条保存在 JSON commands；执行器 exit0仅表示原证生成成功，不表示各断言或产品通过。后续报告追加新轮，不覆盖首轮失败/设施纠正。

# A19 建议自身 OKR 展示开发交接

> 2026-10-22，平台 trae，有限开发角色。记录 A18-GM-01 的修复、原红新绿、完整输入与保护，供 Main 和不同独立专家复验；本角色不签独立 PASS、GUI 或整门，报告交回即释放、STOP。

## 授权与范围

负责人原句：

> 有限开发A18GM01建议自身关联OKR不显示，当前A18SOURCEAUTO/GUIcontrols/import切片/接口全95已独立PASS且释放，用户持续全部已验/修确证独立最后统一commit。读AGENTS/collab、docs/plans/2026-10-22-habit-suggestion-okr-closure.md、docs/testing/a19-habit-suggestion-okr-contract-20261022-plan.md+report/redcases/selftmp、a18-growth-moreGUIFAIL。只认领packages/dsh-pm-tool/src/client/views/habits.tsx和新增necessarysamearea tests，reports/a19-habit-suggestion-okr-developer-20261022*；禁otherproduct/reflection/backend/schema/confirmignore/final/sharedCSS/aggregate/other testing/livingdocs/install/build/GUIservices/credentials/commit/sharedcachelib。最小每有自身okrId建议pending/confirmed/ignored普通块显示关联OKR:精确当前同projecttitle+原ID；missing/无清单保ID不借同名另一项目/habit/suggestion。无okrId保持原不显示。可用既有resolveHabitOkrTitle但必须过滤到s.projectId;原习惯渲染不扩改。必要局部自然换行防长ID/标题撑宽，仅habits文件不得sharedcss。先完整主src冻结原13red/10control/model10(专家原件不改)，真实组件修后同原test绿、补作者用例、受影响habit/okr/forms/feedback/typecheck；白名单env/no-cache单fork/toolNode入口，完整自有依赖副本从/private/tmp/pmtool-a19-owned-deps-20261022/node_modules复制进自有tmp、内部link闭合/独立inode/全hash前后，不用旧sharednode_modules或pnpm重整。前原A19shared10bin漂移FAIL保，newcopy13613/1030闭合证明只本次，不洗旧。Main保持A18sourcefreeze453lib/3248/正式不动；你报告freeze/fulltrackedpatch/newinputs/原红新绿/保护/所有raw命令exit/释放，不自PASS、不build。source若当前scripts3更新已生效保相同，主输入你冻期间Main只其他GUI/docs不产品。后不同专家复验，本角色结束不自动开reflection/U4。

收尾追加：

> Main接续，保持原唯一写者范围，不重复开发。请完成最终报告、全noEmit、保护/释放校验后直接通知我；原红与新绿保留。已看到necessary13、controls10、model10、author11、affected80绿，尚需最终报告，不能自判独立PASS。勿build/GUI/commit，勿reflect/U4。

已读 AGENTS、collaboration §9/11、有限计划、A19 原合同/用例/报告/selftmp、A18-GM-01、接口95独立报告/释放及依赖漂移诊断。专项授权覆盖通用拉取、安装/构建、整包verify、livingdocs/提交步骤；脏树不清理、不同角色成果不覆盖。本次源码唯一写者限两个文件，没有共享 builder、端口或 GUI 所有权。

## 有限实现

- `src/client/views/habits.tsx`：建议 pending/confirmed/ignored 三态统一新增普通 `p` 文本；精确自身 `s.okrId` 命中当前清单时显示标题及原 ID，missing/undefined/空清单回退原 ID，无关联省略整行。不新增查询、链接、动作、播报、统计或裁决。
- OKR props 在本文件兼容可选项目字段；明确有 `projectId` 的条目只允许 `o.projectId === s.projectId`，无字段的最小 refs 保持父层原有同项目预过滤合同。原 `HabitOkrRef`/resolver/后端/schema 未改。完整混合清单的外项目同 ID 另有作者用例，不靠同名/索引解析。
- 新行局部 `minWidth:0/maxWidth:100%/overflowWrap:anywhere`，复用原理由文本类；不改 shared CSS，不套记录卡 inline-flex，不把 DOM 规则当窄屏布局结论。
- 新增同域 `habits-suggestion-okr.test.tsx`：11 作者用例。原习惯卡片与建议动作片段逐字相等，见 `close/self-review.json`；confirm/ignore/true 才刷新、processed 无按钮由原专家控制实际执行。

实际产品差异只有上述两文件，指纹：

| 文件 | SHA256 |
| --- | --- |
| `habits.tsx` | `f8434485002b4b6aab494655ee31613c7caec15a9a4a5a3e9b87568f07f766f3` |
| `habits-suggestion-okr.test.tsx` | `8d7220cff8f01ed9d43dd00d1e59584936f4aa7ed68612aa40b56f00ca7cc709` |

## 输入冻结

基线 HEAD/origin 均 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，仅基线，不代替 dirty 候选。自有根 `/private/tmp/pmtool-a19-habit-suggestion-okr-developer-20261022`，修前 `red/`、修后 `green/` 分开保留；复制完整 src/scripts/locale 与 package/lock/tsconfig/vitest/tsdown/cordis，不带 lib。src388→389；全部枚举输入501→502（不同历史计数是否含声明目录/根文件须按实际 manifest，不能冒充旧520/521清单）。

| 对象 | 修前 | 修后 |
| --- | --- | --- |
| manifest SHA | `1e38aed3fe2d0c64437cb043f6ac8f0e61f2a2cb0d4306f3237531d99f432690` | `7728273e14896a35b11de469ed60fa11c7343d10acd3e08fcb4b05fe92f009f1` |
| 全仓 tracked binary patch SHA | `f508bd3281e2c720d246b1a1701facd172888359dd97e5e65a356d4a17ee5f29` | `ee83a92415f06bb2793a224c46031849222e013592c4565e70b79b819ea0aced` |
| 新产品输入清单 SHA | `014cebec25bd1c515765481e8688c5bcc6ca2159a58958d3fdc2df070c23e3e8` | `0948743344c358c6e31ef57ba67cb188231bd6c332d7affec3927ebcf4e6c6ea` |

详 `red/`、`green/` 的 candidate/manifest/full-tracked.patch/new-inputs/status 与采集命令；`close/owned.patch` 只含本轮 habits 差异，`close/new-author-test.tsx` 保新文件全文。三条已生效接口脚本逐字等于释放输出，`scripts3-binding.json`；未回退这些新脚本。

原专家 cases 按字节复制到自有树，原目录及 selftmp 全量保护，未运行会写原 testing 的专家执行器。重放输入来自原 `r1/replay-input.json`，`fixture-binding.json` 绑定原 SHA、summary、原 seal 与十条漂移。没有重审全部 A18 GUI 或读取 live 业务/凭据。

## 执行结果

macOS darwin/arm64、OS24.6.0、Node22.23.3；项目约定 pnpm11.28.5，**本角色未调用 pnpm**。固定 Node 直接进入自有副本 Vitest2.1.9/TypeScript5.9.3，React18.3.1。白名单 env，自有 HOME/TMPDIR/DSH_HOME/XDG_CACHE_HOME，`NODE_DISABLE_COMPILE_CACHE=1`，cache:false、`--no-cache`、单 fork、1 worker；不继承凭据、不 install/build/启动网络服务。

| 执行 | 原 exit | 实际结果 |
| --- | ---: | --- |
| freeze | 0 | 完整主输入修前冻结、复制依赖、三script相等 |
| 修前 necessary | **1** | **0绿/13红**，逐项均在自身关联标签断言失败；原红保 |
| 修前 controls/model | 0/0 | 10/10、10/10 |
| red 外层 | **1** | 不把预期红洗成 exit0 |
| 修后 necessary/controls/model/author | 0/0/0/0 | **13/13、10/10、10/10、11/11** |
| affected 首轮 | **1** | **80用例绿，但9套件中1套件加载失败**；缺 `board-fixture-clarification-20261021-fixture.json`，不能称完整回归绿 |
| 全包 typecheck | **0** | `tsc --noEmit --incremental false -p <green包>/tsconfig.json`；完整生产源码，stdout/stderr空 |
| green 首外层 | **1** | 保上述 fixture 设施失败，不改原件 |
| supplement affected | **0** | 只补原只读 fixture 到自有tmp、保前后指纹，再跑原9文件+ResultCard/复制/ui-feedback：**12文件131/131** |
| supplement 外层 | 0 | 输入补件/既有断言不改、无产品再次开发 |
| seal | **0** | 限定保护/依赖/输入/fixture零漂移，自有PID退出 |
| close | **0** | 原13红首断言/新绿reporter回核，独占patch/newtest/外层原exit归档、语法/diff/static校验、153证据文件索引 |

必要组的10 controls与control组的13 necessary因testNamePattern排除，reporter pending不是通过或缺写用例。原习惯模型10另实际执行。131与首80覆盖有重叠，不加总成211；修后总计175实际不同测试（13+10+10+11+131），不是独立验收数量。

原80组和补131组均保存既有 `TaskTable` 缺key React warning，非本批文件，不擅改，也不声称所有stderr为空；本报告不把该warning升级为独立产品结论。首 fixture ENOENT 的 stderr/exit/reporter完整保留；补件并非原测试 adapter 或更改断言。

完整逐条 argv/cwd/白名单env/PID/起止/原exit/signal/stdout/stderr/reporter/必要观察正文均在本报告 [证据目录](a19-habit-suggestion-okr-developer-20261022-evidence/)；`close/index.json` 指纹153文件，self不计入。外层实际执行回执另归档 `close/outer-*.execution.json` 与原stdout，不以文件存在补造进程退出。受影响文件全文清单在 `supplement/related-files.json`。

仓库根复核入口（macOS，已存在输出拒覆盖，不重复执行 freeze/green/seal）：

```sh
env -i PATH=/usr/bin:/bin NODE_DISABLE_COMPILE_CACHE=1 /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check reports/a19-habit-suggestion-okr-developer-20261022-run.mjs
env -i PATH=/usr/bin:/bin NODE_DISABLE_COMPILE_CACHE=1 /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check reports/a19-habit-suggestion-okr-developer-20261022-close.mjs
git diff --check -- packages/dsh-pm-tool/src/client/views/habits.tsx packages/dsh-pm-tool/src/client/views/habits-suggestion-okr.test.tsx 'reports/a19-habit-suggestion-okr-developer-20261022*'
```

实际阶段入口依次为固定 Node `...-run.mjs freeze/red/green/supplement/seal` 与 `...-close.mjs`，退出见上表。typecheck原完整argv在 `green/typecheck.command.json`，Vitest各组不通过pnpm/.bin。语法、diff及只读 `verify-external-skills.mjs` 均0；外部skill route=none，原独立FAIL尚未闭时按external-skills §6.1不加载vendor，不跑setup，不借作者自查签PASS。brainstorming/writing-plans读取仅辅助按已批准有限计划执行，不另写计划/提交；frontend只保既有排版，不重设计。

## 依赖与保护

完整自有依赖**从指定 `/private/tmp/pmtool-a19-owned-deps-20261022/node_modules` 复制**到本次 `.../packages/dsh-pm-tool/node_modules`，不链旧 shared node_modules，不安装或重整。修前/修后/补件/终封存均全量 SHA/bytes/mtime/inode核对：

- **13613 普通文件**同名单/hash/bytes，每个副本dev/inode不同于源；**1030软链**逐条realpath落本次副本内，外链0、共享inode0。`dependencies/source-before/source-after/copy-before/copy-after/copyproof/closure-after.json` 保全量。普通shim文本里的历史绝对前缀未改，不执行shim，不把“link闭合”扩大为所有动态运行解析绝对闭合。
- 新副本、指定依赖源前后漂移0；此证明**只属于本次复制/执行**。原 A19 shared10bin SHA/mtime漂移、seal exit1/preserved=false/released=false及设施BLOCKED完整保，既不恢复旧bin，也不借新副本证明洗旧FAIL。
- 限定保护**8407枚举条目**，含重叠根，不说8407唯一文件。覆盖原A18 audit的4179路径、A19全部原件/selftmp、A11/A12/A13/A14/A16/A18/interface旧lib、A18完整冻结输入、Main lib/既有cache精确根及固定依赖证明；`protection-before/after.json`，差异0。A18的453旧产物不变，未构建新lib。
- 主输入冻结期间产品差异只有 `habits.tsx`/新增test；修后主产品与green冻结逐字一致，其余输入无漂移。未监控Main其他合法GUI/docs/runtime新增或全盘，不声称整盘零写。
- 正式profile link/realpath前后相同；lsof两次原exit1（请求还包括无listener的3080/3091，stdout仍有3172/3248），不是没服务：**3172/PID44388、3248/PID63429两次stdout逐字相同**。只读定位，无HTTP/GUI连接，不停/重启/修改服务或profile。
- 自有测试/TypeScript PID76531/76548/76559/77159/77165/77172/77178/77185/77222/77606均退出，ps原exit1/空stdout；外层freeze/red/green/supplement/seal均真实exited。无运行builder/测试/GUI/服务所有权。临时输入/证据保留供复核，不删除文件。

工具探索中 `rg` 缺失exit127改用指定grep/find；memory路径不存在exit1；读取尚未生成的自有文件exit1、精确PID消失的ps/pgrep exit1均不当产品失败。这些不是上述产品运行命令；未安装工具、未读取凭据、未用全进程输出来推断历史写者。

## 释放与下一步

**实现与开发自验交付，不签独立 PASS。** 全noEmit、原必要红→新绿、原控制、作者补例、受影响回归及保护已记录，资源释放，STOP；本角色不重复开发、不自动开启reflection/U4、不build/GUI/commit/push/tag/正式切换，不改livingdocs/其他testing。

Main下一步仅交**不同独立专家**复验同原A19合同和本次完整候选/补件/保护；原A18-GM-01 GUI FAIL待新候选实际构建装载后的原两建议pending→confirm/ignore→重进及1440深色/390长标题ID局部采证独立关闭。新builder/GUI由Main按独立门另安排，本开发未执行，DOM普通文本/换行测试不替代浏览器布局、读屏、写入守卫或总门。最后统一commit仍由Main沿已授权适用独立验收闭门后处理。

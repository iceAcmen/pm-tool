# A11 会议布局独立 SOURCE/AUTO 有界复验

> 给 Main 与独立测试接续者使用：只复验 A10-MGUI-F01 修后源码、真实组件及受影响自动化，保留旧 GUI FAIL 和缺证。平台 trae，独立测试专家；文件沿任务日期 2026-10-21，实际执行 UTC 2026-10-21 16:32–16:36（北京时间 2026-10-22 凌晨），不是产品发布/父总门结论。

## 1. 结论

**限定 SOURCE/AUTO 局部 PASS；A10-MGUI-F01 的旧 GUI FAIL 保留，修后 GUI NOT_RUN。** 没有发现本批限定增量改变表单业务处理、原控件属性或非行动项 records 样式。不能据此宣称实际不重叠、长菜单不裁切或 200% 通过。

| 层与对象 | 本轮独立结果 | 证据范围 |
| --- | --- | --- |
| 源码与增量 | 有限 SOURCE PASS | 修前字节匹配 A10 candidate，修后三释放 hash 匹配；业务前缀 6611 bytes 完全相同、非行动项表单前部/底部相同，40 个控件属性/option 内容 AST 条目相同 |
| 布局规则 | 有限 SOURCE PASS | 15 个局部 action 规则；专属全宽单列容器、可收缩控件、命名 container 两档增强、完整可见标签；未新增隐藏/clip/ellipsis/display:none，非 action CSS AST 完全相同 |
| 原相关真实组件与合同测试 | 有限 AUTO PASS | 七文件 54/54 两轮，退出码均 0；没有修改原测试 |
| 独立追加 | 有限 AUTO PASS | 七项两轮 7/7、退出码均 0；真实 RecordsMeetingForm + callback + command + 内存领域，不 mock 产品组件 |
| records 周边回归 | 有限 AUTO PASS | 八文件 42/42、退出码 0；总计 103 个不同修后用例，不用重复执行次数扩大覆盖 |
| 同版布局反证 | 有效预期红 | 旧 A10 表单/CSS，最终同版原布局测试六项全红、退出码 1；失败为缺容器/规则，不是依赖缺失或空 raw 文本 |
| 实际布局/长菜单/200% | NOT_RUN | 未运行 GUI、headless DOM 或浏览器布局引擎；SOURCE 规则与组件树不能签 bbox、不重叠、菜单可读性 |
| A10-MGUI-F01 | **旧 GUI FAIL 保留** | 修后必须另绑 Main 产物与 actual 下发、重新采证再审；本报告不关闭 GUI 缺陷 |
| A10-MGUI-E01 | **原 BLOCKED 缺证保留** | 本轮没补原命令 payload/回包、原磁盘字节及逐点 wrappers；内存领域 AUTO 不能替代 |

## 2. 授权与所有权

本次负责人限定：“独立测试专家限定A10-MGUI-F01修后SOURCE/AUTO，不GUI、不产品build或更改。”只写 `docs/testing/a11-meeting-layout-independent-retest-20261021*` 与 selftmp。Main 唯一 builder/实际 GUI；父持续验完在途、最后普通 commit 的授权不转成本专家提交权限。

已核 AGENTS、collaboration §9/11、[最新父任务](../../reports/all-pending-acceptance-execution-20261021.md)、[A10 §5 合同](a10-meeting-gui-independent-review-20261021.md#5-缺陷与-main-最小合同)、实际 [closure plan](../plans/2026-10-21-meeting-action-layout-closure.md)、[开发交付](../../reports/a11-meeting-action-layout-developer-20261021.md)及修前/修后增量。通用 fetch/pull/install/build/更新 livingdocs/commit 不执行，以本次明示角色边界为准。

未改产品/全局 CSS/schema/callback/domain、其他文档或 vendor；未 install/pull/noEmit/产品 build/verify、未读主树 lib、未共享构建、未启动/连接真实服务、未操作 GUI、未读取 credentials/活跃私有 runtime、未 commit/push。没有加载或执行 vendor skill，未声明其路由/毕业。新增的是自有计划、runner、测试、proof、报告与证据，非新功能。

## 3. 候选与指纹

基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` 仅是 Git 基线，不代表 dirty 候选。独立冻结复制全 `src` 381 文件及 package/lock/tsconfig/vitest 声明；不复制 lib 或业务数据。原 Git 状态为表单/CSS tracked 修改、布局测试 untracked，已另存 [tracked patch](a11-meeting-layout-independent-retest-20261021-selftmp/scoped-tracked.patch) 和完整 [冻结认领](a11-meeting-layout-independent-retest-20261021-selftmp/freeze.json)。

路径相对 `packages/dsh-pm-tool/`，完整 SHA256：

| 文件 | bytes | 修后 SHA256 |
| --- | ---: | --- |
| `src/client/views/records/records-meeting-form.tsx` | 18126 | `d88c9bee1d2571f7ada3551bc8b7b5f1e7c98d7c2417f78a80a06f4766bb9388` |
| `src/client/views/records.css` | 6842 | `9cc498a0771c109a779b0b2eb073c675ba7f27c46c75a3b4efb9e45f8a984ce6` |
| `src/client/views/records/records-meeting-layout.test.tsx` | 9242 | `6c7a15bc744675af0fda91dcb289366a41491e0f8107bef8c4f7d0ffd6f00344` |

修前表单 `80315b722efe83d0508a407e2cab3496ac175191fa3ca1bf2ce65d6c1aa9edcf`，CSS `5c6e93e1f19f75efd228657842e5ac278f839497d4c224331c5735838beac7a7`，均独立对照 A10 candidate.sourceHashes，不只信开发口述。最终原布局测试在旧/新副本完全同 hash。

独立追加测试 12980 bytes，SHA256 `860379f6bbad7e1d18a5388f880f8a21c5ccbf104b4d542652964986c8845b06`；原文件与两轮被测副本相等。全源字节见 [source-manifest](a11-meeting-layout-independent-retest-20261021-selftmp/source-manifest.json)，独立 A10→A11 增量见 [form patch](a11-meeting-layout-independent-retest-20261021-selftmp/form-independent.patch)、[CSS patch](a11-meeting-layout-independent-retest-20261021-selftmp/css-independent.patch)。

相对 A10 全源另有 overview/overview-done-card.test 两项变化，明确归别的子批，不归会议修复；本轮未测试或签其功能。会议 domain/command/payload/callback/listbox/panel、全局 panel.css 与 A10 hash 相同，不能把跨子批增量全归本专家或沿旧 GUI 倒签新实际加载。

## 4. 断言与影响

[源码审计](a11-meeting-layout-independent-retest-20261021-selftmp/source-audit.json)额外检查全部 input/textarea/select/option/RecordsListbox/button/form/fieldset 属性与 option 内容；`onSubmit`、onChange/onClick、disabled、aria、value、IDs、过滤与失败处理字节/AST未变。声明中的 15 个 action 规则均为局部选择器，旧 viewport media 改为命名容器增强；未改全局栅格、字体缩小或删标签。

独立追加具体观察：

| ID | 原动作与断言 | 边界 |
| --- | --- | --- |
| IND01 | 六可见标签，长原选项/值全文保留，task 同项目、issue 正向、risk/跨项目排除，行按钮齐全 | 组件树全文，不签原生 select 长菜单显示 |
| IND02 | 两旧行“失败/错误”标题、状态/负责人/截止主保存，关联 clear→restore；稳定 ID、创建历史、来源及其他会议字段保留，先 meeting 再逐行命令 | 注入 run 使用生产 CommandResult.kind，不是完整 PmPanel/传输信封 GUI |
| IND03 | 新行填长标题及 task/issue 后取消，全部内存表 JSON 序列相同、命令零次 | 非原磁盘/全机零写 |
| IND04 | 首新行成功、次新行失败保稿；完整已存提示，retry 只新增未成功行，ai-001/002 不重复 | 顺序分命令，非多 action 原子事务 |
| IND05 | busy/disabled 即使直接调用 handler 仍拒改字段/加行/取消/写，false 解锁 | 受控 Promise，不是真网页点击或键盘 |
| IND06 | 第二行保存/转任务/删除按 stable ID 与原 confirm，第一行保留 | 内存命令与确认注入，不签危险模态 GUI |
| IND07 | 外层 projectId 不同仍以会议实际 projectId 筛选/保存，非法候选 handler 值拒绝 | 实际合法 fixture，未回填 F5 为 issue |

影响继承索引：

| 改动接缝 | 受影响旧证 | 本轮处理与后续 |
| --- | --- | --- |
| 行容器、标签、局部 CSS | A10 1440 浅色两行裁切/重叠 FAIL；修后布局未测 | SOURCE/AUTO局部绿，旧 FAIL 留存；Main 新 actual 下发后重采0/1/2行完整控件/关联/clear/取消 |
| 原业务处理/控制属性/命令/存储 | A9-F01/A10 成功接受 SOURCE/AUTO 与稳定ID/取消局部证 | 未变接缝可有界继承；本轮还复跑原54及追加七项，不重签完整业务/GUI门 |
| shared records.css | reports/listbox/history 周边 | 非 action AST 不变；八文件42绿，不扩成相关页面新视觉 PASS |
| Main 新 build/运行实例 | 旧A10产物/装载及GUI身份 | 本专家未 build/绑定 A11实际下发；不得以源码绿代替新产物/实际加载 |

## 5. 命令、退出码与原证

运行环境：macOS arm64，nvm Node `v22.23.3`；项目约定 pnpm `11.28.5`，本轮未执行 pnpm。只读依赖根 `/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules`：React/renderer18.3.1、Vitest2.1.9、Vite5.4.21、TypeScript5.9.3。用独立 config、单 worker、`--no-cache`、coverage disabled；HOME/TMP/XDG只指 selftmp，Node compile cache disabled，子进程仅传列明环境，不继承业务凭据。

仓库根本轮实际命令如下；runner保护不覆盖既有原证，重跑需另用新输出前缀：

```sh
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm use 22 >/dev/null
node docs/testing/a11-meeting-layout-independent-retest-20261021-run.mjs freeze
node docs/testing/a11-meeting-layout-independent-retest-20261021-run.mjs audit
node docs/testing/a11-meeting-layout-independent-retest-20261021-run.mjs old-layout
node docs/testing/a11-meeting-layout-independent-retest-20261021-run.mjs original-r1
node docs/testing/a11-meeting-layout-independent-retest-20261021-run.mjs independent-r1
node docs/testing/a11-meeting-layout-independent-retest-20261021-run.mjs extra
node docs/testing/a11-meeting-layout-independent-retest-20261021-run.mjs original-r2
node docs/testing/a11-meeting-layout-independent-retest-20261021-run.mjs independent-r2
node docs/testing/a11-meeting-layout-independent-retest-20261021-run.mjs finish
node docs/testing/a11-meeting-layout-independent-retest-20261021-proof.mjs
```

| 命令 | 实际 exit | 结果/原件 |
| --- | ---: | --- |
| freeze | 外层未回收 | yield=1000返回异步execution ID，不能补造外层exit；freeze.json完整落盘，后续同步audit/finish/proof重新确认完整冻结一致、进程退出 |
| audit | 0 | [source-audit.json](a11-meeting-layout-independent-retest-20261021-selftmp/source-audit.json)，40 AST/业务前缀/15规则 |
| old-layout | 1 | [old-layout.json](a11-meeting-layout-independent-retest-20261021-selftmp/old-layout.json)，六项有效预期红；首轮就是最终同版，无设施失败 |
| original-r1 / original-r2 | 各0 | [r1](a11-meeting-layout-independent-retest-20261021-selftmp/original-r1.json) / [r2](a11-meeting-layout-independent-retest-20261021-selftmp/original-r2.json)，各7文件54/54 |
| independent-r1 / independent-r2 | 各0 | [r1](a11-meeting-layout-independent-retest-20261021-selftmp/independent-r1.json) / [r2](a11-meeting-layout-independent-retest-20261021-selftmp/independent-r2.json)，各七项全绿 |
| extra | 0 | [extra.json](a11-meeting-layout-independent-retest-20261021-selftmp/extra.json)，八文件42/42 |
| finish | 0 | [final-audit.json](a11-meeting-layout-independent-retest-20261021-selftmp/final-audit.json)，381冻结/主源/两共享缓存根无漂移 |
| proof | 0 | [proof.json](a11-meeting-layout-independent-retest-20261021-selftmp/proof.json)，声明/依赖/追加测试一致、无runner；812证据文件索引 |

所有 Vitest 子进程的**完整绝对 command、argv、cwd、白名单 env、exit/signal、逐用例结果、stdout/stderr 原日志指纹**都在各阶段 JSON 与 [proof完整argv汇总](a11-meeting-layout-independent-retest-20261021-selftmp/proof.json)中，没有用 runner“记录成功”替代测试进程 exit。实际 argv 为 `Node <既装vitest/vitest.mjs> run <该轮所有文件> --config <该轮私有vitest.config.mjs> --maxWorkers=1 --minWorkers=1 --no-cache --reporter=default --reporter=json --outputFile <该轮vitest.json>`，全部文件展开由原 JSON 保留。

原七文件：布局6、meeting-entry11、records-callbacks9、payloads11、options8、entry-guard3、form-validation6。周边八文件：period4/history3/preview6/preview-authoritative6/reports-entry4/report-preview-client7/visible-layer5/form-dirty7。原测试未删改，所有修后 pending=0。反证旧源六红不计产品当前 AUTO FAIL，不删除原红。

共享依赖 `.vite`/`.vitest` 两根文件内容与 mtime前后相同；全src381文件、三释放源、依赖package与四声明配置前后相同。只证明列明 WATCH，不声称全机/所有业务资产零污染；Main并发 build输出不在本专家读写根。全部原件见 [evidence-index](a11-meeting-layout-independent-retest-20261021-selftmp/evidence-index.json)，末次输入指纹与独立diff argv/exit在 proof。

## 6. 缺证与释放

仍未签 bbox/添加按钮不叠、原生长 task/issue 菜单、200%/窄深、真实键盘滚动、失败网络恢复、服务 restart、实际传输 payload/返回、原磁盘字节、R8/B8/全部 kinds/父总门、发布或普通 commit 准入。本轮无需新 headless DOM；不把其可选能力当实际 GUI。

Main继续当前已授权工作：新候选冻结→唯一隔离 build→新产物/actual下发认领→按 A10 §5/原计划采1440浅色0/1/2行的全部控件、关联/clear/主保存/取消；原缺证单及父合同中的其余旅程继续，待新原证由独立专家判 GUI。不另加 atomic、多action事务、owner popup或新issue回填要求。

本有界复验完成并释放。`pgrep -fl '[a]11-meeting-layout-independent-retest-20261021-run.mjs'`实际exit1/空输出，无本轮runner；未留下测试进程、共享builder或GUI等待。不更新其他专家/livingdocs，不提交，不暂停父不受影响执行。

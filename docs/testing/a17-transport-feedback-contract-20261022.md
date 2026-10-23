# A17 传输反馈先行合同与独立必要红报告

> 2026-10-22，平台 trae，独立测试专家，非开发。供 Main/开发接续 A15-IM-GUI-01 最小修复；只签当前冻结 SOURCE/AUTO 控制与必要红，不签修后、新 GUI、发布或 commit。

## 1. 结论

**成功控制 PASS；当前产品 FAIL。** 真实 PmPanel → TaskTable.run → 生产 ResultCard 的五类明确 catch 异常，均返回 false、解锁，却显示 `status/polite/Check`，不是 `alert/assertive/AlertTriangle`。复现 A15-IM-GUI-01 / P2，不能用严重度默认豁免；不是“失败命令被接受/写成功”。

| 原样独立执行 | r1 原 exit / passed / failed | r2 原 exit / passed / failed | 有限判定 |
| --- | --- | --- | --- |
| TF-C01/02 成功标题控制 | 1 / 2 / 3 | **0 / 5 / 0** | r1 三红是自有 fixture 动作行位置错误，完整保留；仅修 fixture，成功语义/原文控制 PASS |
| TF-C03 显式执行失败原因控制 | **0 / 5 / 0** | **0 / 5 / 0** | 既有 prefixFeedbackOnce/classify/真实卡已可正确持久报错、复制全文；不是 panel 修复 |
| TF-F01 真实 catch 必要红 | **1 / 0 / 5** | **1 / 0 / 5** | 当前产品 FAIL；两轮所有必要红步骤/expect 逐字相同 |
| TF-C04 CSV/XLSX busy→失败保预览→同预览明确 retry | **0 / 2 / 0** | **0 / 2 / 0** | 真实父子组件有限 AUTO PASS，非 GUI/真实后端落盘 |
| TF-R01 原六文件既有回归 | **0 / 65 / 0** | **0 / 65 / 0** | 原测试/完整冻结源独立复跑，有限 PASS |

过滤式分组的 pending 分别为 12/12/12/15；它们是其他分组未执行的用例，不是 PASS。五个分组均已独立运行。执行器 `run` 自身 exit0 只是收集完毕，**不覆盖 Vitest necessary-red 原 exit1**。

计划先落：[plan](a17-transport-feedback-contract-20261022-plan.md)。完整原命令、JSON reporter、观测与审证：[selftmp](a17-transport-feedback-contract-20261022-selftmp/)、[review.json](a17-transport-feedback-contract-20261022-selftmp/review.json)。本轮不改产品。

## 2. 最小修复合同

**推荐 `packages/dsh-pm-tool/src/client/panel.tsx:823-826` 的 `run catch` + 必要同域测试足够；通常无需新增 helper 或改 classifier/ResultCard/CSS/API。** panel 已导入 `prefixFeedbackOnce`。在已知 catch 边界传递中文“执行失败”前缀或显式失败原因，保 Error.message/String(error) 原全文。当前 TF-C03 5/5 证明既有 helper、分类器和生产卡能同源尊重该前缀；这只是推荐，不预定实现。

必须保持：

- 已知 catch 显示错误卡/alert/assertive/警告图标，不能靠新增 Failed/Error 英文关键词广扫业务正文。合法成功信封标题“失败复盘 / Failed delivery / Error register”仍成功；现有无信封英文成功也不误红。
- catch 返回 false、inflight/busy 解锁；quiet catch 不吞错误；失败不关闭局部预览/输入、不提前 refresh，不重复 execute，明确 retry 后才走原生产链。
- 原英文原因全文仍显示和可复制，不删词/截断/用通用一句话覆盖；成功短摘要、详情、动作、3s语义及复制代际不退化。
- 当前非 Error 对象已有转换为 `[object Object]`；本合同保现有 String(error) 原样，不新增 unknown 序列化/API需求。
- 不因 return false 已正确而只修 return；本缺陷正是 catch 丢失原因类别后卡呈现错误。

若开发采用结构化原因，须说明必要同域 helper/test 与生产 classifyFeedback/ResultCard 如何同源消费；仅新增原因而真实卡仍字符串重分类不能算修复。共享 classifier/ResultCard/CSS 如确需改动，会扩大 O3/成功信封/复制/全页反馈受影响范围，须新候选与相应独立回归，不由本建议自动授权。

`executeRaw` 静态实核：`client/index.tsx:20-31` 将 remote 非 ok / command.kind=error 转为 throw，`execute` 返回 text；panel run只收 execute字符串，raw主要供副驾。故 `run catch` 已足以识别 throw，**不推荐改 raw/宿主协议/全 commandAccepted**。

`refresh catch:765-774` 是 O5/B1-C2 读取失败保旧数据、stale、本地 retry；本轮没有新增其必要红，也不预设“写成功但 refresh false 就必须写失败”的 Oracle。既有 panel/launch 回归通过只能证明原测试覆盖，不宣称所有 refresh错误已正确。刷新另沿现合同采证和判定，不扩此修复。

## 3. 原合同与 A15 原件

已核 AGENTS §6A、collaboration §9/§11、remaining-journey RA-N01/RA-IM01、main-o3-o5-samepage-assertions O3/O5及 A15 独立原报告。当前开发已释放不等 A16 自动或新 GUI 已 PASS；本角色不覆盖 A16输出/冻结，不借其报告放行。通用 fetch/pull/install/build/livingdocs/commit 与本派单冲突的动作未执行。

A15 所有 **604索引文件 bytes/hash** 再核一致；commands真实 `event.data`，不是原错误层摘要。CSV preview/retry seq81..84、XLSX seq89..92 的 filename、content、confirmLine和返回 text抽取到本轮 replay-input，未改原件。原失败两个 data/files/backups diff均空，错误窗口没有业务 run，与原预host故障事实相符，不证明真实事务回滚。

**只重新目视原 CSV/XLSX failed 两张 PNG，未新 GUI、未目视全部帧。** CSV 全局卡显示完整英文错误和成功勾号，局部重试提示在视口下；XLSX 图局部预览/重试提示/确认取消可见，全局卡在视口外，不能借此签其分类。两图：

- `csv-failed.png` SHA256 `039797f50d106c37f7cbcf9f19b0f0f47461130600300cf292f619bbc0ee0a84`
- `xlsx-failed.png` SHA256 `60f40e320926d53b7b08826abc7feeba1ed5c95c0e58c3f1164362fd6a0d95ff`

原图实际仍 A13 materials3242/PID8390/timeOrigin1792618531950.5，非本新冻结：沿 A15 报告原 identity，不探服务/凭据。旧有限 GUI恢复性 PASS、P2 FAIL、同帧 GUI、已进入宿主事务失败、旧漏 trace、全 RA/矩阵/发布缺口原样保留。本轮 JSX自动树不是浏览器 computed style/颜色/读屏/原生 chooser验收；只静态可见现有 error class → `--pm-danger` 接线。

## 4. 自有完整候选与设施审证

基线 HEAD/origin均 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，不能独自代表 dirty候选。r1/r2都完整复制当前387源文件 + scripts/package/lock/tsconfig/vitest；两轮产品输入逐文件内容完全一致、冻结后无 hash/bytes/mtime漂移。r2：

| 认领 | SHA256 |
| --- | --- |
| tracked binary patch | `df51f772eb7f99fdff50d7e52e3e060591258b580b7d08aaebfb6f03da33e226` |
| complete frozen input manifest | `a16f30fbd20df21cdd9d5d8c1084223922f28eb8ba743a0de0f576ed48fa7a4d` |
| product new-input list/fingerprints | `f3b84f8a15b594bab84f0907eb837c2bca70a3042ce2549cc939a6ebcf5be446` |

环境 macOS Darwin24.6.0 arm64 / Node22.23.3 / React与react-test-renderer18.3.1 / Vitest2.1.9 / Vite5.4.21，既有 pnpm11.28.5依赖但不运行pnpm。软链实际解析到既有 `/private/tmp/pmtool-all-closure-20261021/.../.pnpm`；只读使用，未 install。

每轮自有 HOME/TMPDIR/XDG_CACHE_HOME/DSH_HOME，PATH/LANG/TZ/CI/NODE_DISABLE_COMPILE_CACHE白名单；不继承 credentials。Vitest无缓存、node环境、单fork/1worker；生产组件/分类器均未mock，宿主 execute、FileReader和最小browser globals提供边界 fixture，fetch拒绝。恢复性测试宿主成功返回引用原文，未执行后端，没有宣称持久落库。

**设施失败保留**：r1 TF-C01 的动作行放在 detail之后，parseFeedback按既有规则将其当详情原文，故3项 detail相等断言失败。r1成功 role/class/accepted断言已成立，但整用例仍FAIL，不只取绿片段。r2仅把同一动作行移到成功信封前，仍由生产 builder构造，详情原文/复制原文期望不降。check逐字证实仅这一行改变，所有必要红保持原样；两轮原stdout/stderr/reporters/观测全保留。未修产品parser、未将此fixture错误转产品缺陷。

其他工具错误：rg不可用exit127后用find/grep；误查`.test.tsx`/不存在helper/index.ts读错各1/2，后定位真实文件；一次轮询调用参数与实际工具不符，改用返回的execution_id取得真实final，未重启/中断在途测试。记忆仅轻查当前项目topic、以仓库为准，没有访问凭据或修改全局。

## 5. 实际命令、退出与交回

所有命令运行于仓库根，macOS + Node22.23.3；每条执行器内 Vitest精确 argv/cwd/env/开始结束/PID/原码均在两轮 `commands.json`与各`*.command.json`，不是用执行器0推算子码：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/a17-transport-feedback-contract-20261022-run.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a17-transport-feedback-contract-20261022-run.mjs freeze r1
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a17-transport-feedback-contract-20261022-run.mjs run r1
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a17-transport-feedback-contract-20261022-run.mjs final r1
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a17-transport-feedback-contract-20261022-run.mjs freeze r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a17-transport-feedback-contract-20261022-run.mjs run r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/a17-transport-feedback-contract-20261022-check.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a17-transport-feedback-contract-20261022-check.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a17-transport-feedback-contract-20261022-run.mjs final r2
```

上述九条各0。final r2已封存：protectionOk=true、全输入与主树差异为空、noRecordedChildren=true、released=true；精确查询PID45180/45188/45201/45225/45237的ps原exit1/stdout空，表示这些PID不存在，不是产品FAIL。check审证0仅表明完整两轮同源/fixture纠正/原红与 reporter 相符，不是修后PASS。r1/r2每个分组原码见§1；原necessary-red共两轮exit1 / 5失败均为 `expected 'status' to be 'alert'`，不是导入/编译失败。

保护当前产品输入/lib、A11..A14 lib、A13相关源、A15整个原包/专家报告、A16三冻结完整产品输入与静态计划/测试、实际依赖及共享cache。r1/r2保护无新增删除/内容mtime变化；A16持续日志不当零写目标，不复制覆盖其freeze。自有临时freeze/cache/home之外只新增指定A17前缀计划/测试/runner/check/本报告。未写产品/其他testing/livingdocs、未build/install/GUI/services/credentials/commit/push。

下一步交开发按§2最小域修复，再由新独立专家绑定修后完整候选复跑必要红→绿和成功/恢复/受影响回归，Main唯一builder再采既有实际GUI，不由本专家修产品自验。本角色已终检释放；Main继续无关PC/成长，不签整项/发布。

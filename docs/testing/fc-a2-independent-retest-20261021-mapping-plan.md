# Chrome 应用名映射 P1 最小修复测试单

> 给 Main 开发与独立复验者使用。2026-10-21，平台 trae，独立测试专家。此单先于修复，仅写测试合同，不改冻结 A2 17 源；实际 Finder、OS 投递与认证仍由 Main 采证。

## 1. 即时裁决与来源

**FC-A2-03 / P1 / FAIL：显示标签 Chrome 未映射到真实应用 Google Chrome。** 源码已确定缺口，Main 新到干净 OS 原证进一步确认该命令在本机确实 exit1。当前不应继续以“已有 Chrome 忽略 --args”作为唯一根因。

原证：[open-chrome-clean-probe.json](../../reports/all-pending-evidence-20261021/A2/finder/open-chrome-clean-probe.json)：

```text
at: 2026-10-21T19:45:11.320443
argv: ["open","-a","Chrome","--args","--app=http://127.0.0.1:3211/"]
exit: 1
stderr: Unable to find application named 'Chrome'
```

这是 Main 执行的**干净无认证 URL**独立探测，专家只审该原件；不是 Finder 动作本身的逐调用退出记录，不重放旧 token，不证明新页面或 S4。该诊断命令没有进入 argv 解析之后的 Chrome 行为，因而尚不能判断映射后 `--args` 是否被已运行 Chrome 处理。

## 2. 源码因果与既有合同

1. [browsers.mjs:L8-23](../../launcher/src/browsers.mjs#L8-L23) 区分 `label:'Chrome'` 与 `app:'Google Chrome.app'`；discover 通过存在性验证真实应用，却仅返回原对象。
2. [pm-launcher.mjs:L44-54](../../launcher/bin/pm-launcher.mjs#L44-L54) 把发现结果 `.map(b => b.label)` 后交给app，真实app身份丢失。
3. [launcher-app.mjs:L124-128](../../launcher/src/launcher-app.mjs#L124-L128)、L145/L216直接把selectedBrowser显示标签传给openBrowserArgs。
4. `launcher-core.mjs` 的openBrowserArgs把choice直接放进 `-a`，没有Chrome→Google Chrome映射；`resolveBrowserOpen`也只检label集合，最后仍传choice，现有入口不调用它。
5. 原 [browsers.controller.test.mjs](../../launcher/test/browsers.controller.test.mjs) 正好断言 `-a Chrome`，只测了自设argv，不验证LaunchServices识别，故49绿不覆盖这个P1。

既有 [launcher README](../../launcher/README.md) §1/状态表、[Finder合同](independent-acceptance-batch1-closure-plan-20261021.md) §9要求向所选真实浏览器投递、收到工作台并由合法回告到S4；`discoverBrowsers/resolveBrowserOpen`的契约是仅列存在者、不可用选择回退默认。名称映射是落实既有承诺，不新增认证方案。普通control tab与Chrome专用工作台窗可以并存，不能仅因control tab合同废除现有app模式测试。

## 3. 最小改动边界

Main负责开发，本专家不改产品。建议在现有浏览器解析边界明确分开**显示label**与**启动app目标**，复用discovery已有app元数据，或者等效的稳定最小名称映射。Chrome至少解析为 `Google Chrome` / 已验证 `Google Chrome.app` 路径或bundle标识；页面及旅程仍显示Chrome，不把系统名写成用户选择。不要为此建立新浏览器框架。

| 文件 | 可执行最小改动及影响 |
| --- | --- |
| `launcher/src/browsers.mjs` / `launcher/src/launcher-core.mjs` | 修复label→真实应用目标解析及相应argv；仅选择一个清晰归属，不在两处复制不一致映射；保默认/不可用回退 |
| `launcher/bin/pm-launcher.mjs` / 必要app接缝 | 如果复用discovered元数据，保留实际目标并让生产投递走同一解析；捕获spawn error、OS非零exit及有界结果；不得只修未被生产调用的helper |
| `launcher/test/browsers.controller.test.mjs`、相关contract/app测试 | 更正错误的`-a Chrome`期望，补发现→选择→生产argv与异步结果，而不是只测手写映射 |
| `launcher/src/control-html.mjs` 与原DOM测试 | 另修FC-A2-01的失败偏好/实际投递一致性；不可认为名称修正自动关闭偏好失败 |

普通URL投递可选，既有openBrowserArgs已支持 `{appWindow:false}`；若Main选普通tab，明确将Chrome/Edge模式改为tab并同步原app模式断言。**映射是当前必修；模式切换不是从当前probe推导的唯一必修。** 映射后即使OS exit0，也必须实测冷/已运行浏览器收页；app模式无法满足时可改普通URL操作数，不能隐式跨profile重投认证URL。

异步等待只等 `open` 命令退出，不用`-W`等浏览器退出。OS失败不得S4、不重复首投、不打印stderr中潜在认证URL；只输出可脱敏类别/安全建议。保认证/TTL/nonce/Origin/所有权；不杀3211/PID510、正式或未知服务，不读取runtime/private。

## 4. 先行最小用例

当前均为修后 **NOT_RUN**，未实施不签PASS。原报告X05/X06B仍FAIL。本单只细化实际浏览器投递，不改变原Finder启动必须指针双击、安全/认证门或引入新矩阵。

| ID / 门 | 初态、步骤 | 预期与原证 |
| --- | --- | --- |
| FC-MAP-01 / AUTO | 注入仅存在Google Chrome.app；discover→UI label Chrome→生产解析，输入干净URL | label仍Chrome；实际argv应用目标可解析为Google Chrome/明确app路径，不是Chrome。执行生产链而非独立手写字典 |
| FC-MAP-02 / AUTO | 分别Chrome/Edge/Safari/Firefox/系统默认及不可用选择；含空格中文路径、URL `?x=1&y=2#fragment` | 真实目标映射正确、URL一个完整参数、无壳拼接；默认无`-a`；不可用沿原合同回退，不静默误指另一已安装应用 |
| FC-MAP-03 / AUTO | 模拟spawn error、open exit1、exit0、超过有界等待；生产app接缝消费实际异步结果 | 失败诚实反馈、不S4、不复投；exit0最多S3。取消后旧结果不倒灌、不杀ready服务；日志无敏感URL |
| FC-MAP-04 / OS | 新认领修后候选，Main在明确获准上下文对**干净无认证本地页**只投一次，保存命令/exit/安全stderr | `-a`实际目标被OS找到，exit0；只签命令成功，不以exit0/S3当收页。禁止通过不明`open -a`路由到未授权个人Chrome |
| FC-MAP-05 / GUI | 无敏感自有冷Chrome/同一已运行Chrome各一个不同普通页；对修后模式检查真实收到URL/title/HTTP请求和浏览器身份 | 两条件都实际收页；若保`--args`，已运行态也必须证明收页。若失败，保原失败，切普通tab后新候选复验，不手工补开页冒充产品投递 |
| FC-MAP-06 / GUI | 原Finder指针启动全新owned旅程→选Chrome→正常open→真实工作台mount/snapshot→合法entered→control自动S4 | 真实所选浏览器收到本轮批准首投，S4来自当前认证回告。不得重放3211旧token或读凭据，关闭/取消与原安全负例不退化 |
| FC-MAP-07 / AUTO | 原49、DOM6、原8及X01/02/03/04/05/06B/07/08/09/10受影响回归 | 全部适用自动项绿；实际app.browser/argv与latest一致，偏好FAIL不可用映射/OS绿豁免 |

Main只采OS/GUI原证，不自签PASS；专家审新manifest/patch/源码hash、运行绑定、映射后的逐命令exit以及真实收页。19:45干净probe不证明99281的每一次原spawn退出，更不签Finder全链或3212 Safari兼容。新源变更后重新认领，不能继续沿用A2 17清单当完整修后候选。

## 5. 交接结论

当前确定P1：FC-A2-01偏好失败后实际投递默认；FC-A2-02异步OS失败不反馈；FC-A2-03Chrome显示名直接用作OS应用名。FC-A2-02/03是旧基线接缝，需修复而非凭原49豁免。`--args`已有运行处理是**映射后待证风险**，不是这份exit1的已确定原因。

此单与[A2独立报告](fc-a2-independent-retest-20261021.md)共同交Main；所有原证、失败与早先待证解释保留。只写自有前缀，无产品/17源修改、无build/install/启服/commit/push或Main GUI操作。

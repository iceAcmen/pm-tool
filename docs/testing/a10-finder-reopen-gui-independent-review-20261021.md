# A10 Finder 首次与重开有限独立审证

> 给 Main、负责人及接续专家使用：只签已归档的首次/重开回告与控制页观察结果，列明原动作、实际加载绑定和样式缺口；不是整个 Launcher、B8、全部积压或发布结论。2026-10-21，trae，独立测试专家。

## 1. 有限结论

**N1/N2 的真实回告与同 control 成功显示：局部 PASS。完整、绑定 A10 实际加载字节的 Finder GUI 旅程：BLOCKED。浏览器选择框存在确证局部样式 FAIL（A10-FG-V01，P2）。**

| 对象 | 判定 | 证明边界 |
| --- | --- | --- |
| 首投 N1、重开 N2 的 OS 投递与 exit0 | 局部 PASS | 被动原日志确有两次 `open -a Google Chrome`，重开只有 clean origin + N2 hash；不把 OS exit0 当登录或挂载成功 |
| N1/N2 正确 Origin 回告 200 | 局部 PASS | 同 control60787、Origin3217，两别名各一份请求/200；源码分支支持 POST/有效 nonce 后回告。没有请求 body、完整响应 body 或浏览器网络原件 |
| N1/N2 同 control 成功显示 | GUI 观察局部 PASS | 两张 S4 原图、重开正文 JSON、末次只读状态 S4/confirmedtrue 一致；不把成功文案单独当鉴权证明 |
| 新标签实际 PM mount/snapshot 的完整原动作链 | BLOCKED | 本次负责人补充事实及执行记录明确真实 AX 动作；归档未含对应原 action/response、匿名目标文档代际、PM 页面/成功快照原证，不靠口述补签 |
| source → build → personal Chrome 实际 loaded bytes | BLOCKED | 冻结/构建/当前隔离字节可核；个人 Chrome12221 没有实际入口、完整响应字节或加载归属原证。别的 origin 下发不能代证3217 |
| 同一已挂载 PM 只变 hash，不重新 mount | NOT_RUN GUI | 本轮是 OS 新 tab，再关翻译/点 PM；旧42项只属组件 AUTO，不能升级为这个 GUI 分支或全部42项功能 GUI |
| 浏览器选择框下箭头尺寸 | FAIL，P2，A10-FG-V01 | 初态及选择 Chrome 后均异常放大；局部修复合同见§5，不据此判整个 Launcher/B8 |

依据：[AGENTS](../../AGENTS.md) §6A、[collaboration](../collaboration.md) §9/11、[父任务](../../reports/all-pending-acceptance-execution-20261021.md) §1、[既有回告合同](reopen-handshake-diagnosis-20261021.md) §5。本轮没有发现可确证的“当前 N2 不发回告”产品缺陷；旧 N2 失败历史保留，不被新有限结果改写。

## 2. 授权与候选

父负责人原句：“好的，按之前的盘点文档和这个分工方案继续推进，直到把所有没验完的功能全部验完，再把所有代码都提交为止，才算完成任务，中途不要停下来。”

本专家本次明确范围：“独立有限FinderGUI审证专家，只写docs/testing/a10-finder-reopen-gui-independent-review-20261021*及selftmp，不GUI/service/runtimeprivate/credentials/product/build/otherdocs/commit。”Main 唯一 GUI 执行端，父任务仍在途。本专家不继承父 commit 权限，不更改其他 testing/livingdocs，不安装/构建/拉取/发请求/启停服务，不读取 runtime 私有根或个人浏览器凭据。仅只读仓库原证和已经声明的隔离候选 source/lib 文件做指纹核对。

| 绑定 | 值 |
| --- | --- |
| 产品基线 | `2a7603023bc54ef13d788e50069ee3fde4671bf3`，父记录给出；不能单独代表 dirty |
| 文档/工作树基线 | `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` |
| A10 candidate SHA256 | `c142866eac4fb87159e7af36df2c52b3cda84f0e780d5b9ae4d7614e7968eda3` |
| A10 tracked patch SHA256 | `caddc276e6b83d6f79850cc8c1490afdc6a1c5f9409cd8d160fa066cc632c715` |
| 宿主声明提交 | `1142fb74f2bbcc54dc9499054c0448c9b876cbf2`，是 candidate 声明，不是本轮运行回读 |
| 冻结 client.js SHA256 | `894a515cee081225687ef8ba887f55a51762ecc481c0d3c3613f035e9c202d2f`，不是个人 Chrome loaded hash |
| 隔离候选 | `/private/tmp/pmtool-all-closure-20261021`；只核已声明512 source/453产物，不运行 |
| Main 提供的进程链 | launcher18791/control60787 → owned19068:3217 → personal Chrome12221 |

[审计r2](a10-finder-reopen-gui-independent-review-20261021-r2.json)：candidate 与 sync 的512项 source 清单一致，candidate 与 artifacts 的453项清单一致；隔离候选512/512 source、453/453产物当前哈希相符。app.bin 指纹和两个归档环境 fixture 指纹相符；六帧逐文件 SHA 相符。这些是身份和一致性检查，不是运行激活或实际下发 PASS。

主树检查为 **506/512 相符**：`views/overview.tsx` 已与 A10 冻结不同；五个 `launcher/test/fc-*.test.mjs` 在主树 ENOENT，但均存在于隔离候选且 hash 相符。不把临时专家测试只在隔离树存在认成产品删除，也不把 overview 在途变化倒签为 A10。这六项保留在r1/r2，未“清树”或恢复。结论只绑定上述 A10 冻结，不能套当前全部主树。

## 3. 已审原证与时间链

已全文审读 [execution.md](../../reports/all-pending-evidence-20261021/A10/finder/execution.md)、[app.json](../../reports/all-pending-evidence-20261021/A10/finder/app.json)、[passive.ndjson](../../reports/all-pending-evidence-20261021/A10/finder/passive.ndjson)、[S4-reopen.json](../../reports/all-pending-evidence-20261021/A10/finder/S4-reopen.json)、[state-after-reopen.json](../../reports/all-pending-evidence-20261021/A10/finder/state-after-reopen.json)、[process-record](../../reports/all-pending-evidence-20261021/A10/finder/process-record.txt) 及两份 fixture。独立目视5张 PNG和6张实际 compositor JPG，不声明更多录屏/完整动作覆盖。

| UTC | 原件观察 |
| --- | --- |
| 15:54:30.932 → 31.364 | 默认 `open` 投递无凭据 control60787，exit0 |
| 15:56:34.299 | 控制页真实菜单有系统默认/Chrome/Safari；r2正文为 Chrome、尚未启动。三帧显示菜单展开、Chrome选择及关闭 |
| 15:56:37.869 → 38.490 | 首投 N1，正确应用名 Google Chrome，query token 已脱敏，exit0 |
| 15:57:45.498 | 无别名204，与后续200分开；根据已核 receiver 分支属于 OPTIONS，不计 entered 成功 |
| 15:57:45.539 → 45.540 | N1 request/response，同60787，Origin3217，200；随后 S4-first 原图显示成功 |
| 15:58:24.949 → 25.349 | 再次 OS 投递 `http://127.0.0.1:3217/#pm-launch=60787.N2`，无 query token，exit0 |
| 15:59:15.914 | 第二次无别名204，同样单列，不合并为 N2 回告 |
| 15:59:15.915 | N2 request/response，同60787，Origin3217，200 |
| 16:00:00.683 / 16:01:24.280 | 重开成功正文；末次只读 state 为 S4/true/Chrome/3217，原状态没有 token/nonce/URL 字段 |

N1/N2 的 `open-start` 到200分别 **67671ms / 50966ms**，不是 nonce 铸造时点或精确 TTL 测量。两次请求由 observer 同一 req/res 闭包的别名关联，不是仅按时间拼接。observer 未记 method：200/OPTIONS 区分由已绑定 `loopback.mjs` 的 POST/OPTIONS 分支和原事件共同支持，不伪称已有完整网络包或响应体。

目视原件：[Finder app](../../reports/all-pending-evidence-20261021/A10/finder/before-doubleclick.png)、[控制初态](../../reports/all-pending-evidence-20261021/A10/finder/control-initial.png)、[首次S4](../../reports/all-pending-evidence-20261021/A10/finder/S4-first.png)、[重开点击时](../../reports/all-pending-evidence-20261021/A10/finder/reopen-click.png)、[重开S4](../../reports/all-pending-evidence-20261021/A10/finder/S4-reopen.png)。控制六帧的 metadata 为1440×718、pageScaleFactor1；**不是原生100%菜单证明**。截图没有个人 Chrome 地址栏或 PM 页，不能据此签成功清 hash、目标 tab、PM mount/snapshot。

`before-doubleclick.png` 证明真实 Finder 可见指定 app，不单独证明双击动作；`reopen-click.png` 显示按钮变浅，不单独证明动作提交成功。执行记录、后续实际进程/投递/回告支持已陈述链，但原 action/response 缺口仍单列。首目录输入未生效和首 Chrome 严格文本匹配失败保留；r2依据实际 `C\nChrome` 后缀定位不是产品缺陷。新 tab/关闭翻译/PM AX点击属于负责人补充事实，不把未归档原件伪装成已目视。

## 4. 观察设施与旧证据继承

[entry全文](../../reports/all-pending-evidence-20261021/A10/finder/pmtool-a10-finder-entry-20261021.mjs) SHA `e3c239fafa8c28495dfdf97ec84e10c75f0db88b9f13d68b342d0aec17560d86`：设置自有3217/DSH_HOME/隔离files/backups，删指定敏感环境键，先导入 observer 再导入生产 bin；不实现替代 PM 或自造就绪。不因键名过滤推断全环境无凭据。

[passive全文](../../reports/all-pending-evidence-20261021/A10/finder/pmtool-a10-finder-passive-20261021.mjs) SHA `6699a6798db19f0fd038dea6e7ebde64b46a808a6658d787f360ffa647bf8bea`：原 spawn 和 HTTP emit 各透传一次；仅附 data/end/finish/exit/error观察；真实 nonce 只作内存 Map 键，落盘仅N别名，query token脱敏。没有额外 fetch/POST、重发 nonce、cookie复制或直接改生产状态。未包裹 `verifyEntered/onEntered`，没有 request method、完整响应内容、PM snapshot或loaded byte记录。不能以此源码证明所有 Main 行为或全环境零污染。

| 旧报告 | 本次继承边界 |
| --- | --- |
| [fcA5](fc-a5-independent-retest-20261021.md) | 原late OS失败等 AUTO结果保留。A10 manifest 与 A5列出的6个 src/bin交集逐一hash相同，另外5个生产文件未列在 A5该 source表，不能误说5个已变化或全11项都已继承；不签旧169套件执行为169个独立GUI场景 |
| [bridge/panel42](bridge-panel-independent-retest-20261021.md) | bridge/index/两测试hash相同；panel整文件已变。原冻结与当前 panel 的握手ref/refresh/mount/cleanup块原字节完全一致，可有界保留该局部机制证据；不是重新跑42项、整panel新依赖图PASS或真实hash-only GUI |
| [A0真实TTL](a0-paths-board-review-20261021.md) §5 | 原130012.600ms→200/S4和601005.036ms→403/S3保留为旧HTTP/内存结果。当前receiver hash相同，app仍600000ms单次/旅程守卫，fcA5亦核TTL模型未改；仅沿用未改变TTL规则的旧局部结果，不声称本次Finder实等10分钟或证明浏览器认证/CORS拒绝全集 |

Main 后来 panel/overview 变更须另绑定候选与受影响门。既有只读 controls API 和过滤后的 state 可以审，不需要追读私有根、真实 nonce或URL来“补证”。正式3172/PID44388、旧3199/PID880在 process-record 中可见；该 argv快照没有完整 cwd/监听/写根前后检查，不能据此声称本轮全系统零污染。

## 5. 最小补件与修复合同

### A10-FG-V01：选择框 SVG 无界放大

**确证局部视觉 FAIL，P2。** 控制初态和首组三帧显示巨大的下箭头、很高的浏览器选择框，系统默认文字被挤成两行；r2选择 Chrome 后最后一帧仍有同样巨大箭头，不是单次菜单遮挡。

静态接缝：[control-html.mjs](../../launcher/src/control-html.mjs) L17仅给 `.browser-select` min-height48，`.chevron`只设颜色；L77生成SVG没有 width/height/class，L174裸 `svg('chevron')`放进flex选择框。没有 `.browser-select > svg`尺寸约束，源码与截图症状一致；**不是已有 `.chevron`规则已正确作用于生成元素**。文件hash `3b4a30c7b6393b3c2131e62a038358763bd3f8fa20a05aa09bf7562275289a9e` 与冻结及主/隔离树相符；控制实际HTML响应原字节仍缺，因此不扩大为整个新加载图的归因结论。

最小开发范围仅 `launcher/src/control-html.mjs` 和同域控件测试：为选择框实际SVG增加明确小尺寸及不伸缩约束，例如局部18×18px；不改所有SVG、状态机、nonce/CORS/TTL、浏览器映射或PM布局。修前真实DOM测SVG/trigger bbox，修后验证初态、Chrome选择、菜单展开/关闭、选择后焦点归还，且open/reopen/S4同步不退化；Main在实际control1440和390补图后独立复验。18px为建议实施值，不虚构已有设计规格；本专家不实施修复，也不要求全B8矩阵来关闭这个局部项。

### 有限证据补件

1. **原动作/目标链**：Main仅归档已采 Finder双击、翻译窗关闭、PM AXPress原 action/response 的脱敏摘录，含时间、app/window/匿名tab、动作返回和之后PM可见/快照成功类别；没有的项明确“未采”，不要事后制造。PM截图只裁业务区域，不能包含私人地址或真实 nonce。新标签与同文档hash-only分别登记。
2. **actual loaded绑定**：Main提供已有实际3217响应/模块装载原件及与A10 frozen client 的完整字节绑定。个人Chrome不能安全取得时继续BLOCKED；若另走获准自有browser新旅程，必须另建证据/候选/别名链，不能倒填本N1/N2。不得启个人Chrome CDP、复制凭据、重发nonce或追runtime root找URL。
3. **观察器下轮最小字段**：仅补 req.method、请求匿名ID、匹配res finish、entered结果类别；不记录真实body/nonce/cookie。若要证明snapshot/清hash，在实际PM提供对应非敏感布尔/类别与时序，不用control成功文案代替。

这些是当前审证缺口与局部缺陷修复合同，不是新增产品功能或新发布批准。Main按有效父任务继续不受影响的在途验收；本专家释放，不接GUI或接管父任务。

## 6. 实际检查与收尾

环境：macOS/darwin arm64，审计使用 nvm 已装Node `v22.23.3`，仓库根。未运行pnpm、产品测试/verify或构建；不假称本轮重跑fcA5/42/TTL。

```sh
cd /Users/bytedance/Projects/dsh-pm/pm-tool
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a10-finder-reopen-gui-independent-review-20261021-audit.mjs r1
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a10-finder-reopen-gui-independent-review-20261021-audit.mjs r2
```

两条已实际结束，**r1 exit1（20/21一致性检查）、r2 exit1（21/22）**，共同唯一红是上述主树512项不能当成同一冻结候选。不是当前产品测试FAIL，也不改退出码为绿。r1比较器未拆 A5的 `{sha256, isolatedSha256}` 对象，交集计数错误为0；只修自有审计器，r2正确为6个相同，原r1保留。r2另加panel握手块精确比对为相同。两个fixture的 `node --check`各exit0，只语法检查，**没有执行fixture**。

另只读审 Main 的 A10 `pnpm exec tsc --noEmit`、`pnpm run build`、coverage、`verify-isolation`原exit均0；build UTC15:33:14.386392→22.064247。没有由本专家复跑，没有因此签全部97 verify、实际loaded、GUI或发布。全部原证指纹、512/453对比、六帧索引、两别名请求/响应保存在[r2](a10-finder-reopen-gui-independent-review-20261021-r2.json)，未覆盖r1。

仅新增本前缀报告、审计脚本和JSON；没有改其他文档、产品或他人原证，没有运行产品/浏览器服务或后台任务，无服务需要本专家清理。没有监测所有依赖/业务/系统根，**不声明全盘零污染**。有限审证到此交付，父持续验收/最终提交任务未完成，push/tag/发布未授权。

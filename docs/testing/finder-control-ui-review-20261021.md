# Finder 控制页独立审证与最小修复合同

> 2026-10-21，平台 trae，独立测试专家角色。Main 为真实 Finder/Chrome 操作及原证采集者，本专家只审证、诊断和判定。本文仅签指定控制页缺陷，不是 A0、batchA、Finder 完整旅程或全系统 PASS。

## 1. 有限裁决

| 编号 / 优先级 | 判定 | 可核依据与边界 |
| --- | --- | --- |
| FC-DEF-01 / P1 | **FAIL：浏览器下拉展开事件未绑定** | `control-html.mjs:L92,L98` 确定的事件接线缺陷；Main 点击后 JSON 为 `expanded="false"`、`options=0`，截图无列表。源码与现象一致；尚未到完整点击录屏，不能据单截图签 Finder 全链。 |
| FC-DEF-02 / P1 | **FAIL：控制页缺少服务端权威状态自动同步** | `control-html.mjs:L74-75,L104` 首载一次 GET、动作响应一次重绘；无 polling/SSE/WebSocket/message/focus 同步。`onEntered()` 仅改服务端 S4，回告响应返回工作台请求方，不送给控制页。确定源码缺口；同一真实实例 server S4/UI S3 配对原证尚未到，GUI 分支 **BLOCKED（待交证）**。 |
| safe app 与源码身份 | **限定身份核对一致** | A0 主树/隔离树/manifest 14/14一致；额外核读6个基线依赖，两树一致且与产品基线相同；app 两文件实际hash与safe-app.json一致。不是运行解析全过程、Finder 双击或服务装载 PASS。 |
| B1-DESK-01/02、BA-JOURNEY-01 与 batchA | **未获 PASS，当前两缺陷阻塞收口** | S3→S4 UI、真实认证/mount、全部安全负例与 Finder 原始录屏不能由源码或服务器200替代。不转 MANUAL_PENDING，不开 U4。 |

优先级只排修复顺序，不是豁免。这两项是基线已有控制页缺口，并非14文件路径/复制修复新引入；不能把历史49项单测局部 PASS 解释为已测过下拉及状态同步。

## 2. 授权与对象

负责人原句摘录：“仅审证/诊断，仅写docs/testing/finder-control-ui-review-20261021*，禁止改产品/build/install/启服/commit/push或profile”；“不要凭假设判PASS”；“新源码缺陷可修复但未过batchA不能开U4”。

补充事实来自本轮派单：Main 约18:57真实 Finder 鼠标双击新 safe app；launcher PID83992/control58570/目标3205；随后隔离Chrome新tab重看同一真实control，不代替Finder启动；旧正式PID44388和旧隔离PID880不动。**这些启动/PID事实在本轮属于负责人/Main说明，尚未用完整录屏和脱敏运行索引独立闭门。** 本专家不连接其端口、不查进程、不读runtime/private凭据，不读取home/profile文件。只按白名单读取非敏感app壳与plist用于hash/引用核对，不执行壳。

依据：[AGENTS](../../AGENTS.md) §6A、[collaboration](../collaboration.md) §9/§11、[remaining登记](remaining-acceptance-register-20261021.md)、[batchA即时单](batcha-independent-findings-and-main-worklist-20261021.md)、[原Finder合同](independent-acceptance-batch1-closure-plan-20261021.md) §9/§13与batchA新artifact重绑定条款。当前派单覆盖本专家通用pull/install/build/living docs/提交SOP，不扩写其他专家原件。

- HEAD/文档基线：`9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`。
- 产品基线：`2a7603023bc54ef13d788e50069ee3fde4671bf3` + A0未提交14文件；不能用HEAD当干净发布产品。
- candidate SHA256：`2b6265bd1953c186f553d4092fa98ff87f2a14480a82e04383cc63255e0de071`；tracked.patch：`fdeadce4b7c39298dc8d2c1d56f5b5854f914893817d7c1eb884f698afc3400a`。
- Main隔离源码根：`/private/tmp/pmtool-all-closure-20261021`；app：`/private/tmp/pmtool-closure-runtime-20261021/app/PM工作台-全部积压验收.app`。
- 壳明确引用该隔离源码的 `launcher/bin/pm-launcher.mjs`，Node22.23.3，PM_HOST=127.0.0.1、PM_PORT=3205、独立DSH_HOME。壳引用源码是动态依赖，壳hash不变也不能证明其引用源码未变。

## 3. 源码诊断

### 3.1 FC-DEF-01：展开分支不可由真实按钮触达

[control-html.mjs](../../launcher/src/control-html.mjs) 的完整因果链：

1. L71 初始 `menuOpen=false`。
2. L92 触发器是普通 `<button id="browser-toggle">`，没有 `data-act`；`aria-haspopup/listbox` 只是语义，不会替普通button执行展开。
3. L98 只给 `document.querySelectorAll('[data-act]')` 返回的节点赋 `onclick`；该集合不会包含这个按钮。
4. `id==='browser-toggle'` 是 `b.dataset.act` 的分支，不是DOM id判断。按钮缺属性，所以该分支虽然存在，实际没有触发入口。
5. L99只绑定已经渲染的 `[data-browser]` 选项；menu关闭时根本没有这些选项。L103 Escape仅把menu置false；主题/关闭按钮各自按id绑定，但不绑定browser-toggle。
6. 没有其他点击委托、原生select/details行为或外部脚本提供展开；L97每次重绘替换root，任何绑定也必须随渲染恢复。

**结论确定：按这份完整页面源码进行普通鼠标点击、Enter/Space激活，不能把menuOpen从false改true。** 除非另行改DOM、注入处理器或调用脚本改变状态；这些不属于真实产品入口，不能用于验收。默认只有一个候选浏览器也不是解释：源码即使只有系统默认项，展开时也应至少有一个option。

### 3.2 FC-DEF-02：权威状态有变化，控制页没有接收路径

链路分层如下：

- 控制页 `act()`（L74）POST `/api/action`，只消费该请求返回的快照并render。
- 首载 `refresh()`（L75/L104）GET `/api/state`一次，之后无再次调用。全页检索未发现轮询、SSE/EventSource、WebSocket、postMessage、visibility/focus刷新或自动重载。
- [launcher-app.mjs](../../launcher/src/launcher-app.mjs) L194-196等待打开旅程完成；已运行服务的L124-129投递URL后设置S3。L67-74的 `onEntered()` 校验当前已用句柄，转S4并返回新快照。
- [loopback.mjs](../../launcher/src/loopback.mjs) L105-133接合法 `/api/entered`，调用onEntered，并把S4 JSON返回**发起回告的工作台**。它没有通知此前已完成的 `/api/action` 请求，也没有control订阅通道；L84-88只是被动GET。
- [pm-launcher.mjs](../../launcher/bin/pm-launcher.mjs) L57-64只是把app回调接到server，未增加广播。
- [launch-handshake.ts](../../packages/dsh-pm-tool/src/client/launch-handshake.ts) L54-68只判断回告 `res.ok`，L82-87成功清hash；重试器只负责工作台回告，不刷新控制页。两个tab内JS变量不会因同一Node服务变更而自动共享。

**确定缺口的条件**：控制页已读完首载状态、已消费open响应S3，随后合法当前回告令server变S4；没有新控制页动作/重载时，该控制页仍保有S3。只是重绘主题或ESC也会重绘旧快照，不会读server。

**反证/边界**：回告若早于open快照读取，动作响应可能已经是S4；若早于尚未完成的首载GET，GET也可能读到S4。用户后来重载/新开control，或触发能返回当前S4的动作，也可能见S4。故不写“所有运行永远不能显示S4”，不因旧S4截图推翻同步缺口；必须采“响应S3→随后权威S4”的有序链。本缺陷是反馈缺失，不是server回告失效或伪造认证成功。

现有 [control-html.test.mjs](../../launcher/test/control-html.test.mjs) 最后一个首屏测试将 `querySelectorAll` 固定返回 `[]`，只断言innerHTML文字；它未执行真实按钮，也未模拟晚到server更新。49/49历史AUTO结果因此不覆盖这两条。没有重跑或把测试数量当新证据。

## 4. Main 已到原证

证据根：`reports/all-pending-evidence-20261021/A0/`。以下均是原证审阅，不是本专家GUI执行；时点为UTC（本地+08:00）。

| 原证 | 已核事实 | 不能推出的事实 |
| --- | --- | --- |
| `finder/safe-app.json`，10:54:50.364Z | 创建记录、3205、壳/plist指纹；实际文件匹配 | 该JSON自身写明 `created artifact only; Finder not executed`，只描述创建时边界；不否认Main随后双击，也不证明随后双击 |
| `gui/finder-control-initial.json/png`，10:58:40.105Z | 真实control URL为127.0.0.1:58570；viewport1440×718、dpr2；S1文案/按钮可见 | DPR2不等200%缩放；缺完整Finder录屏/运行索引，不签启动门 |
| `finder/browser-toggle-after.json/png`，11:00:57.477Z | `expanded="false"`、options0；目视无listbox，S1保持 | JSON未带点击事件轨迹/URL/DOM处理器；单张不能独立证明点击动作，但与确定源码缺陷及Main说明相容 |
| `finder/control-after-open.json/png`，11:02:25.369Z | 仍是S1文案 | 可能尚在探测/请求等待；不能据此判打开按钮坏，更不能称server S4/UI S3 |
| `finder/control-settled-open.json`，11:02:59.977Z | 稳定后已有S3“已在浏览器投递，等待已进入回告” | 没有server快照、entered响应、mount/snapshot证据，不能证明此时server已S4 |

三个PNG（initial、browser-toggle-after、control-after-open）字节相同，SHA256均 `d688e97bd28cb965db2f3f0f8e47ffa481c4ac27e55f11d1f44a471341661647`。相同画面相容于页面无变，但不是三次独立动作证明，也不无证据指控复制造假。截图中箭头异常放大为附带观察，本轮不据此追加第三项缺陷/新视觉矩阵。

当前仍缺同一control实例的脱敏有序记录：open响应S3→工作台真实mount/snapshot→合法entered200/server S4→不重载的control仍S3及状态读取次数。Main可继续正在采的原步骤，不为补证重启旧正式或重做已经保存的Finder启动动作。

## 5. 最小修复合同（只交 Main 实施）

### 5.1 文件与范围

| 文件 | 最小行为改动/回归 | 禁止扩大 |
| --- | --- | --- |
| `launcher/src/control-html.mjs` | 将browser-toggle接入现有data-act机制或按id显式绑定，两者选一；每次render可靠重绑。增加自动接收真实server状态的路径。 | 不改产品数据、上游、认证、TTL/nonce/Origin、浏览器启动/进程所有权；不换原生壳、不新造成功按钮 |
| `launcher/test/control-html.test.mjs` | 真节点/真实DOM事件验证展开、选项、重绘重绑；异步状态同步、迟到响应、关闭清理验证。 | 不再以querySelectorAll返回空数组的字符串断言充当交互测试；不写自建状态模型代替生产页面脚本 |
| server文件（仅如确需） | 若选推送订阅，限定 `loopback.mjs` 和必要app接缝，并单独认领安全/生命周期回归。 | 不为这两处缺陷无理由重写launcher编排；现有GET可承担同步时优先不扩server改动 |

自动同步可复用现有只读 `/api/state` 做有界、串行状态读取，也可用真实server订阅；合同不强制某种新技术。**定时器只安排读取，不按时间/进度直接转S4**，不修改权威状态来源。旧实现报告“定时器只用于视觉进度”的历史描述不得解释成允许模拟成功；若协调者找到仍有效的禁止轮询合同，采用真实订阅并交接缝，不静默修改该合同。

同步须保留当前未提交浏览器选择、菜单/详情与焦点、主题及必要请求内存元数据；同状态不反复替换root打断点击。刷新与动作并发时旧响应不得覆盖新旅程/最新状态。关闭页/关闭窗口停止读取、断开订阅并弃迟到回调，但不停止dsh。请求失败不得假S4、不得无限并发/静默丢失后续恢复机会；保当前可辨状态。

### 5.2 有界复验用例

从属原B1-DESK与BA-JOURNEY，不扩大视口/主题/缩放矩阵。全部修后用例当前NOT_RUN，执行Main，最终判定独立专家。

| ID / 门 | 初态与步骤 | 预期与原证 |
| --- | --- | --- |
| FC-01 / AUTO+GUI | 同冻结control S1；鼠标点展开→选Chrome→再次展开→Escape；另Tab聚焦按钮Enter/Space展开，选项激活 | expanded真、options与实际state.browsers对应；选择值持久至动作负载；重绘后仍可用，Escape收起且焦点可辨。录屏/事件/逐态DOM，真实打开argv只保存浏览器及脱敏目标，不落句柄 |
| FC-02 / AUTO+GUI | 首载完成；控制页open先收到S3；仅延迟真实工作台回告，不伪造snapshot；工作台合法mount/snapshot后放行当前回告 | entered200/server S4→控制页无需reload/额外按钮自动S4。交同control/同旅程顺序、只读状态请求或订阅记录、两端截图/录屏、hash清理事实；句柄仅N1别名 |
| FC-03 / AUTO+GUI | S3未有合法回告；分别错origin/旧旅程/重复/过期按既定安全单；一次同步读网络失败后恢复 | 无有效回告不S4；拒绝响应不被UI当成功；恢复后仅反映最新权威态。沿用既定TTL10min，不新增真实超时矩阵、不以读取服务200判认证 |
| FC-04 / AUTO，GUI沿原关闭步骤 | 首载GET/旧同步读在途→新动作或新旅程→释放旧响应；同步期间操作菜单/选择；关闭窗口后释放在途响应 | 旧快照不倒灌、菜单不被每次同步关闭、焦点/偏好不被无变化重绘重置；关闭后无后续网络/DOM异常，ready服务不被停 |

先保留修前到件，Main交新候选diff/新增清单、受影响源码与实际运行链；专家不得自己改产品后自验。控制页是Node入口动态渲染的源码，不等于插件client bundle：只改该文件不需要靠插件build“使它生效”，但现存launcher已导入旧模块，不能声称改磁盘后旧进程自然更新。由Main按精确PID重认领新的隔离launcher/control；本专家不启停服务。

app壳若仍引用同一绝对入口且字节未变，可以据依赖链保留壳身份并重新绑定新源码/运行实例；若重新生成app，应认领新hash，不要求机械沿用旧14文件或旧壳字节。新增控制页/测试改动使14文件清单不再完整，须形成新冻结候选，**不能重写原A0证据为修后通过**。

受影响回归：全部launcher现有测试/verify、回告bridge接缝、Finder下拉与S3/S4、安全/取消/关闭；Main按仓库收尾要求在其隔离输出执行最终完整回归并归档逐命令exit。无变化的数据/PATH/复制断言按diff由各专家继承，不因新增UI缺陷机械撤销旧局部PASS，也不借局部PASS放行整体。batchA未PASS前继续修复/补测/文档，**不开始U4实现、不发布或切正式profile**。

## 6. 指纹与审证验证

下列额外源码hash在主树=隔离树=产品基线；app两项actual=创建manifest：

| 对象 | SHA256 |
| --- | --- |
| `launcher/src/control-html.mjs` | `29d2beb3c38335f67272273fa28e5454b5822aab8467bc5cc071068c9a4cad28` |
| `launcher/src/loopback.mjs` | `6dce1acea2e7064c1fea75c171bfdf345874d670d6bd0160478979eb0a7a62ba` |
| `launcher/bin/pm-launcher.mjs` | `3bd85661e87f98daeaecf979cbcc5f9470918967f62a604fe1ede59b04ae4f19` |
| `launcher/src/panel-model.mjs` | `6e1a7460025c3887e4a8251f22ca661668ed6c6e9ad03c3f96c956eb9d079a62` |
| `launcher/test/control-html.test.mjs` | `32c944bceb98378247ff73a94a8c31f5eaea2071e3711c280fff7e9d2cac626f` |
| `launch-handshake.ts` | `c7303c993809b41790f9f299d9818c73facbcb888dbe058aab414b20a1081057` |
| app `Contents/MacOS/launch` | `c3e1f64cdbb3e0e8e2403dd14deaabaceaca94922f909978aee6c23a8db2d5c1` |
| app `Contents/Info.plist` | `2829180873585be366432e818ba0ef6f07b26e0f4780d2e4e08866d250ec40f4` |
| `finder/safe-app.json` | `b34ad3dfebfcf4e10794a28958a6414f646028602771916e0d3298a529c19293` |
| `finder/browser-toggle-after.json` | `981f2f2b0a5d0c088f81303f3c79ecc9f4afcf57bdc1b7372ca6b99e5e76a105` |
| `finder/control-after-open.json` | `f51fad291368918bb2260249c77aaf40950ea8dd96fea49a78d8002ec28e0be7` |
| `finder/control-settled-open.json` | `d87db8e9bc33f1db435ca2d98fd0c35c2a61a33d990f55d1668f10fb61c3f9b1` |
| `gui/finder-control-initial.json` | `40b7c5d66fdc8f4195c98133e5529ef7ef02600b5c7f89e319c4bf69a279026e` |

自有[只读checker](finder-control-ui-review-20261021-check.mjs)逐hash复核14源、6依赖、壳两件及8份固定原证（包括settled JSON，hash从stdout可复算）；不加载/执行产品模块，不连接HTTP、不读取任何凭据文件。初轮11:04:12.809Z输出身份无矛盾、14/14、依赖6/6、app2/2；`refreshReferences=2`仅是函数定义+首载调用，`automaticSyncSymbols=[]`。文本扫描是定位辅证，因果结论来自完整源码及请求接线阅读，不以关键词缺失代替诊断。

运行环境：macOS/darwin，审证Node `v22.23.3`；本专家未执行pnpm，不能冒称独立核实其版本。复核命令（只读，无安装/构建/启服）：

```sh
cd /Users/bytedance/Projects/dsh-pm/pm-tool
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/finder-control-ui-review-20261021-check.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/finder-control-ui-review-20261021-check.mjs
```

最终复核11:08:01.358Z：上述两命令均exit0；14/14、依赖6/6、app2/2与8份原证身份无矛盾，`integrityFailures=[]`。两自有文件的末尾换行、行尾空白及本地链接检查exit0。没有执行产品回归，所有修后用例仍NOT_RUN，真实server S4/UI S3配对仍待证。

本轮只写本文与同前缀checker。未build/install/产品测试/启停服务/改profile/commit/push，未更新living docs或他人testing原件。工作记忆路径不存在、rg不可用，改用明确路径/grep与Node结构化JSON，不安装工具。**exit0只是审证身份/文档工具检查成功，两个源码FAIL和GUI待证门不因此转绿。**

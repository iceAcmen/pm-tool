# Reopen N2 回告独立诊断

> 给 Main、修复开发和后继独立专家使用：记录现有客户端握手的可复现根因、反证、最小修复测试合同与真实旅程缺证。只签本次实际源码/桥接实验，不签整个 Launcher、全产品或真实认证 GUI。2026-10-21，trae，独立诊断角色。

## 1. 有限结论

**生产客户端 bridge 的跨旅程回告合同：FAIL，确定 P1。修复未实施。Main 真实 N2 旅程的完整 GUI 判定：仍待原证，不签 GUI FAIL。**

| 对象 | 诊断裁决 |
| --- | --- |
| N2-01：N1已成功，同面板收到新hash N2 | **确定源码根因**：retrier 的成功状态按实例存活而非按当前令牌归属；`done=true` 在读新hash之前返回true，不发N2 |
| 仅hash变化/再次点击已选PM | 插件没有hashchange回告触发；当前PM同key不保证重新挂载。与同实例吞N2组合可造成持续S3 |
| N2-02：旧请求在途期间换hash | **确定源码缺陷，非声称本次真实已发生**：旧N1成功按“回包时的当前hash”清理N2；全实例inflight又合并N2调用 |
| 完整reload反证 | 新文档/新retrier可以发送N2；旧实例done **不能单独解释**“正确目标完整reload、PM重挂载且snapshot成功后仍无请求” |
| Main真实N1/N2 | 已审仓内S4/S3画面与JSON；被动日志尚未复制，N2目标文档/reload/snapshot原证不足。负责人补充事实原样保留，不升格完整GUIFAIL |
| A5 lateOSFailure、B1、habit | 不在本轮审签范围；不重签A4或A5 AUTO，不改其候选与门状态 |

依据：[本轮计划](reopen-handshake-diagnosis-20261021-plan.md)、[三轮审证索引](reopen-handshake-diagnosis-20261021-evidence.json)、[A3](fc-a3-independent-retest-20261021.md)、[A4](fc-a4-independent-retest-20261021.md)、AGENTS §6A、collaboration §9/11。三轮均直接执行未修改生产 bridge，不是重写一个同名假实现。

## 2. 最小根因与实验

### N2-01：成功幂等范围错置

位置：`packages/dsh-pm-tool/src/client/launch-handshake.ts:L99-L111`；实际调用方 `panel.tsx:L728-L738,L741-L767`。

1. 同一 `createLaunchHandshakeRetrier` 实例，hash为合成N1。
2. 调用 `reportReady()`，fetch替身返回ok；N1清hash，闭包done变true。
3. 只将当前hash改为合成N2，再次调用 `reportReady()`。
4. 实际返回true，但fetch调用列表仍只有N1，N2 hash保留。正确合同应分别回告N1/N2。

R05三轮均红；R06证实换port同样被吞，不是某种nonce字符解析问题。根因不是launcher未铸新句柄，而是客户端第104行在重新解析hash之前短路。`reportReady=true`只是该实例的历史成功，不能证明当前旅程已回告。

最小红例可直接作为修复测试迁入生产测试文件；也已在[探针](reopen-handshake-diagnosis-20261021-run.mjs) R05执行：

```ts
let hash = '#pm-launch=18345.N1'
const sent: string[] = []
const r = createLaunchHandshakeRetrier({
  getHash: () => hash,
  replaceState: cleaned => { hash = cleaned },
  fetchImpl: async (_url, init) => {
    sent.push(JSON.parse(String(init?.body)).nonce)
    return { ok: true } as Response
  },
})
await r.reportReady()
hash = '#pm-launch=18345.N2'
await r.reportReady()
expect(sent).toEqual(['N1', 'N2']) // 当前实际只有N1，修复前必须红
```

### 触发和 React 生命周期

panel把retrier保存在 `useRef`；普通render/成功刷新不重建它。首次读取由 `useEffect(..., [])` 触发，成功refresh统一调用reportReady，未监听hashchange。[AST原件](reopen-handshake-diagnosis-20261021-panel-ast.json)保留这些实际语句及行号。全client的ts/tsx只读搜索未找到hashchange；index只用固定 `pm-tool` key注册面板，不在注册时回告。

只读宿主 `packages/client/ui-layout/src/client/AppFrame.tsx:L40-L42` 按 `activePanelId` 调用 `renderSlot(...entryKey)`；`stores.ts:L94-L95` 重复选择PM仅再次赋同一ID。**已经在PM时再点PM不是强制remount合同**；真正切到其他面板再切回是否卸载仍受slot实现影响，本轮未实测，不作推断。

因此需同时解决“新token可处理”和“已就绪面板观察新token的触发”。只重置done而不补触发，hash-only旅程可能仍没有下一次ready；只加监听而不改done，则监听调用也会吞N2。

### N2-02：旧成功清掉新令牌

位置：`launch-handshake.ts:L82-L86,L101-L111`。

`armLaunchHandshake` 在开始解析N1，await完成后却重新取当前hash再strip，没有确认当前token仍是N1。R07：挂住N1 fetch→当前hash换成业务路由+N2→释放N1成功。实际N2被清掉，仅保业务路由；正确合同是旧成功不清N2。

R08进一步表明N2的ready借用了N1同一个Promise，最终只发N1。R10正控制：旧N1失败时不会清N2，后续ready能发N2。此缺陷属于同一跨旅程归属问题的另一个窗口；本次负责人描述N1已成功后再reopen，**不以该竞态解释全部真实N2现象**。

## 3. 独立 DOM 与完整刷新反证

使用现有Chrome/puppeteer、全新自有profile、本地file fixture和**未修改生产bridge**。按钮仅模拟调用ready，不代替真实snapshot，不是完整生产React面板。

| 实验 | 三轮实际观察 |
| --- | --- |
| N1 ready | 内存fetch调用N1，hash清除 |
| 同一file文档导航到N2 hash | timeOrigin不变、原生hashchange出现；调用仍只有N1 |
| 同页真实点fixture Ready按钮 | 仍只有N1，N2 hash仍在，错误列表为空 |
| 完整page.reload后点Ready | timeOrigin变，新实例调用N2，hash清除 |

[DOM原件](reopen-handshake-diagnosis-20261021-dom.json)与各轮JSON有完整状态。未启HTTP服务器、未发实际POST、不含真实nonce、未连接Main Chrome12221；request拦截只允许自有file路径。`blockedRequests=[]`仅描述fixture页面，**不声明整个Chrome/系统零网络**。

此反证必须保留：Main“真实cmdR/PM后仍无N2请求”不被简单改名为“其实没按刷新”。需要区分动作已执行与**哪一个tab/文档实际被reload、当时N2是否仍在、PM是否重挂载并成功snapshot**。本轮无权操作或连接Main来补这个链。

## 4. Main 原证与观察设施审查

父分工补充事实：A4 launcher12047/control62000→已有自有3212 host4480；N1真实POST correctOrigin200与自动S4；真实control reopen，OS exit0 clean URL/N2到普通Chrome12221既有tab，N2 hash存在，S3/confirmedfalse；Main AX点PM、刷新数据、cmdR/PM后仍无N2请求。**这是补充事实来源，不等本专家已审到对应全部原件。**

实际已审：

- `A4/finder/N1-auto-S4.json`：12:37:26.351Z，同control62000，S4/true/Chrome/navigation1；截图目视“工作台已打开/已由受认证工作台回告进入”。
- `A4/finder/N2-waiting.json`：12:37:26.843Z，同control62000，S3/false/Chrome/navigation1；截图目视等待回告。与上一帧仅492ms，不能单凭该即时等待帧签长期失败。
- `travel-observations.json`有菜单、Chrome、首投S3；没有N2持续观察、目标host tab或完整reload成功snapshot序列。
- `safe-app.json`绑定environment-only wrapper与文件hash，但仍写“created only; no Finder action yet”；它不是Finder动作原件，也未绑定observer source。
- 审证时 `A4/finder/passive.ndjson`不存在；未追读其runtime根。N1真实POST200/精确Origin、N2 OS exit0和长期无请求尚缺可审原件。

特准只读的 `/private/tmp/pmtool-a4-passive-observer-20261021.mjs`：

- 调原spawn一次，返回原child；对open仅附exit/error监听。调用原HTTP emit一次，返回原结果；没有额外POST/verify/状态转换。
- 新增request data/end观察在内存解析body得到N别名，随后清临时text；日志只记别名/Origin/端口/HTTP状态，URL里的pm-launch换别名，query token脱敏。响应finish闭包关联同一request，不是仅按时间猜别名。
- 它**没有**包裹生产verifyEntered/onEntered，亦未直接记before/after权威状态；不能声称完全落实A4建议的全部观测字段。原生handler200通常可支持有效verify后entered，但需原日志与实际entry接线绑定，不能仅凭source补造请求结果。
- Source可解释观测机制，不能证明实际已装载、未中断或N2无请求持续多久。N1首成功是有效正控制的补充事实；原日志到件后再独立审，不把缺证误写成观察器无效。

仅核该source，SHA256 `21b25bfcee4afb246954534ba597997d52db4be86da47630ffe3d336c1795988`；已在自有tmp保存安全源码副本。未执行observer，不读auth/runtime/private其他设施。

## 5. 最小修复与测试合同

本节是给开发的修复合同，**不是本专家实施授权**。建议仅修改以下范围；其他Main分工继续，不把此项膨胀成新Launcher架构：

| 文件 | 最小目的与验收 |
| --- | --- |
| `src/client/launch-handshake.ts` | 成功/在途按当前 `(port, nonce)` 归属；同token并发去重，跨token不借旧成功；完成前核当前token，旧结果不清/确认新token |
| `src/client/panel.tsx` | 面板实际挂载且已有成功snapshot后，新合法hash能触发本轮检查/必要refresh；失败snapshot不回告，卸载清listener，普通业务hash不发；不得在index全局注册时伪造就绪 |
| `src/client/launch-handshake.test.ts` | 迁入R05/R06/R07/R08四红例，保R01-R04/R09/R10正控制与既有解析/权限/清hash用例 |
| 面板组件专项测试文件，由开发先报备命名 | 必须执行真实PmPanel；成功snapshot后同实例加N2，不手工调用helper冒充接线，等实际回告；覆盖未就绪/失败/卸载/业务hash/同token重复/完整reload |

具体不变量：

1. 完成状态只证明某个本轮token，不是“此面板以后永远成功”。新port/new nonce必须独立尝试；不可把nonce写盘/日志/URL查询参数。
2. 旧N1成功只能清仍属于N1的当前参数；新N2仍在时必须保留它，不能清整条业务路由。
3. 新N2出现时旧请求可在途，但N2等待不得返回旧成功冒充已回告；旧finally也不能清掉新任务的inflight归属。排队或并行由开发选最小实现，只验证外部行为。
4. 只在真实PM mount和成功snapshot门内回告；失败保hash等待后续成功刷新，不新增无限重试，不注入认证，不手工POST。hash变化不是已登录证明。
5. 仅hash事件接线不足以改变HTTP/Origin/CORS模型；保持credentials omit、body仅nonce、receiver的精确Origin/single-use/TTL不改，不给reopen直接标S4。

真实补采最小合同交Main：继续既有自有3212，保真实control reopen、脱敏OS类别/exit、目标tab匿名ID与文档代际、N2是否仍在的布尔、PM可见与成功snapshot结果类别、同control状态时间线及被动request/finish别名。**不用截图/日志输出真实hash、不追读nonce、不从个人Chrome抓cookie/token，不手工POST**。完整reload用目标文档代际确认，不以按键名代替结果。如果该轮nonce因TTL/消费失效，不追读它，下一次真实control动作开新旅程，原N1/N2历史不覆盖。

新变更需重新认领plugin源码与由Main唯一builder产物/运行装载，专家另复验受影响bridge/面板/真实旅程。A5仅launcher lateOSFailure绿不能继承到这项client跨旅程修复；既有N1成功也不替代N2新证据。

## 6. 候选、命令与结果

基线HEAD `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，产品基线 `2a7603023bc54ef13d788e50069ee3fde4671bf3`。**只认领实际4文件，不称其为全dirty候选**：

- bridge SHA256 `c7303c993809b41790f9f299d9818c73facbcb888dbe058aab414b20a1081057`，与产品基线相同；A4的23项manifest未列它，本轮另补认领。
- panel SHA256 `195c3cababcbca069b2c47e3042f667736e3c4038bdc78c341d55989849ed90d`，与A4 manifest相同；不把HEAD替代该dirty字节。
- index与原bridge测试也与产品基线相同；完整hash在索引。四轮4文件before=after=冻结副本，无源码漂移。
- 宿主两个只读片段仅作生命周期补证，不证明实际3212装载：AppFrame SHA256 `c45f1ed8ba134bba265af4ac1f9786067f686b8572a13e3617d489cf929644ea`；stores SHA256 `b2b34de29bb7ff749323aeae94d7dc6758debe6f5cdd2dc3985da485a9d239a1`。

环境：macOS/darwin，Node `v22.23.3`，独立Chrome `139.0.7258.155`。复用现有typescript/puppeteer，无install；TypeScript仅内存去类型，不运行构建、不写lib或依赖缓存。无完整React组件执行：当前直接react-test-renderer/react-dom入口不可用，未安装；DOM只签生产bridge与原生文档行为。

| 实际命令/轮次 | UTC时点与结果 |
| --- | --- |
| `node …-run.mjs r1` | 12:49:21.217→26.199；6绿/4红，DOM复现；首轮工具返回异步ID，未保存工具最终exit，JSON保结果，不补造 |
| `node …-run.mjs r2` | 12:50:04.330→07.293；6绿/4红，工具实际exit1，DOM复现 |
| `node …-check.mjs`内部 `node …-run.mjs r3` | 12:51:23.858→29.458；6绿/4红，spawn实际exit1/signal null/stderr空，DOM复现 |
| `node …-run.mjs r4 --pure` | 12:55:56.840→56.956；6绿/4红，工具实际exit1；纯函数修复合同入口，DOM明确NOT_RUN |
| `node …-check.mjs` | 实际exit0；确认三轮同四红、字节/归档/退出检查，**不等产品PASS** |
| `node packages/dsh-pm-tool/scripts/verify-external-skills.mjs`及check内复核 | 实际exit0，只读静态；两注册vendor PASS，未注册目录不受此审计 |
| `ego-browser skill` | 实际exit0，只读使用说明；未创建EGO任务或连接共享浏览器，DOM用显式全新隔离profile |
| `node --check …-run.mjs`、`node --check …-check.mjs` | 各实际exit0，仅脚本语法；不是产品类型门 |
| 自有Markdown链接/围栏/4源码指纹检查 | 实际exit0，初次11链接存在、围栏配对、源码漂移0；不是GUI验收 |

四红为R05/R06/R07/R08，六绿为R01-R04/R09/R10。[R3退出原件](reopen-handshake-diagnosis-20261021-r3-execution.json)、[R1](reopen-handshake-diagnosis-20261021-r1.json)、[R2](reopen-handshake-diagnosis-20261021-r2.json)、[R3](reopen-handshake-diagnosis-20261021-r3.json)、[R4纯函数](reopen-handshake-diagnosis-20261021-r4.json)均保留。最小修复测试入口在仓库根、固定Node22运行：

```sh
cd /Users/bytedance/Projects/dsh-pm/pm-tool
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/reopen-handshake-diagnosis-20261021-run.mjs r5 --pure
```

已归档r1-r4不能覆写。`--pure`的10项全是正确行为断言，可在修复后转绿；默认DOM模式是保留旧症状的诊断，不是修复验收入口。后续开发迁入生产测试或使用纯模式，另按§5跑真实PmPanel及GUI门；本轮没有修复后绿例，不以checker exit0替代它。

## 7. 收尾与交接

仓内只新增本前缀；tmp为 `/tmp/pmtool-reopen-handshake-diagnosis-20261021.uOtK7e`，含冻结只读源码副本/fixture/profile/原件，不删除。三个自有Chrome PID15769/15964/16263均browser.close后ps不存在；所有诊断子命令已结束。没有产品服务或Main资源需要本专家清理。

未build/install/完整回归、未改产品或上游、未操作MainGUI、未读真实nonce/凭据/运行私有根、未commit/push。未监测全系统/所有业务根，**不声明全盘零污染**。当前观察到A5 launcher源码变化由其owner继续；本报告不重冻23项，不干扰Main B1/habit。

Skill留痕：rootCause仅加载已校验 `diagnosing-bugs`，锁commit `49dd158d1076134a641b33efb035946536778336`，vendorIntegrityVerified=true；先留红反馈环，再用同页/新实例和成功/失败反证划范围。跳过其修产品、commit、HITL未vendored脚本等越界步骤，不叠TDD/code-review，不签skill毕业。研究方法用于区分原证/补充事实/源码/fixture，合成N1/N2仅为负责人明准的软件测试种子，不当真实旅程数据。

接续由Main派客户端开发按§5最小合同修复，独立专家另审新候选；Main只补上述脱敏原证。**本轮诊断已完成，客户端缺陷未修、真实GUI门未签。**

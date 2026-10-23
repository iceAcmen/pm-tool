# 启动器控制页缺陷收口实施计划

> 执行Main，独立测试专家审证。依据[FC-DEF-01/02与既定复验用例](../testing/finder-control-ui-review-20261021.md)。负责人已授权持续修复、验收和最终普通提交；本计划不增加推送、发布或正式服务切换。

**目标：**修复浏览器选择框无法展开及权威回告后控制页不自动更新两处确证缺陷。

**方案：**沿用现有控制页事件机制与只读`/api/state`。轮询安排读取，S4只来自服务端权威状态；不按时间模拟成功。比较状态后才重绘，保留主题、菜单、焦点和当前选择；动作启动后废弃旧读响应，关闭后停止读取并丢弃迟到结果。

**环境：**macOS、nvm Node22.23.3、pnpm11.28.5；独立候选树`/private/tmp/pmtool-all-closure-20261021`。主树lib不构建，上游只读。

## 文件与影响

| 文件 | 用途 | 影响 |
| --- | --- | --- |
| `launcher/src/control-html.mjs` | 给browser-toggle接现有data-act；增加串行定时读取、代际保护、同态去重绘与关闭清理 | 仅控制页，不改nonce/TTL/Origin/进程控制 |
| `launcher/test/control-html.test.mjs` | 运行生产内联脚本的事件/异步回归 | 保留原首屏与安全断言 |
| 必要的新`launcher/test/control-html-sync.test.mjs`和`launcher/package.json` | 若现测试壳不适合，新增真实DOM页面执行测试并接命令 | 不自建业务状态模型、不把静态字符串当GUI |
| 本计划、changelog、修复报告、交接档案 | 记录新候选及受影响证据 | 原A0和专家原件保留 |

## 选择依据

显式绑定id或给按钮增加data-act都可修第一处；采用data-act复用已有分支。第二处可选SSE或串行只读轮询；当前只读GET已存在，选轮询可避免增加服务端通道与安全接缝。轮询必须有限单请求、失败后仍可恢复，关闭即停止；若查到生效的禁止轮询合同，改用订阅并先交专家收缩或修订合同。

## 执行顺序

1. 按专家FC-01..04先补测试，记录修前失败。真实DOM事件验证按钮及重绑；延迟GET/动作响应验证旧态不倒灌，关闭弃迟到结果。
2. 实施两处最小修复。读取时保留局部theme/菜单/详情/选择及nonce元数据；同权威状态不反复替换root。动作开始使旧读取过期，状态读取独立串行运行，慢启动期间仍可显示真实S2并取消。
3. 同步精确文件到隔离树，运行全部launcher测试并保存命令、cwd、开始/结束、stdout/stderr/exit及前后hash。新清单A1另建，不覆盖A0已审证原件。
4. 新的隔离launcher需重新启动并认领。旧83992/control58570动态导入旧control源码不会自动更新；仅精准核PID后停止自有launcher，不动3205/PID27767或正式44388/旧880。
5. Finder真实双击新绑定app→选Chrome→等待认证页面实际mount/snapshot→回告200→控制页自动S4；延迟旧旅程/取消/replay等沿原安全单。不读正式cookie，不以手工POST替代就绪桥。
6. 独立专家审FC复验和受影响安全/关闭/焦点原证。未过batchA不开始U4。
7. 最终本批全集回归、档案同步、专家整体放行后普通提交。中途不提交候选、不推送。

## 技能与授权留痕

brainstorming与writing-plans用于方案和文件级执行计划；现有父授权与专家合同已明确，不重复询问开发或提交授权。模板中的频繁commit与当前“全部验完再提交”冲突，遵从负责人。

vendor静态校验2026-10-21本轮exit0、两个注册vendor全部文件sha/bytes一致。当前有FC确证FAIL，按external-skills§6.1前置本轮不放行vendor自动调用；不把校验绿当验收PASS，不运行installer/setup或写全局。通用测试先行流程仍执行，独立门不变。

## A2复验缺陷修复范围

[独立A1复验](../testing/fc-fix-independent-retest-20261021.md)另确证FC-RT-01/02/03。继续同一控制页修复：只读同步与动作分离；动作POST以35s边界覆盖30s owned启动并允许取消独立送达；动作响应用独立序号拒旧；浏览器偏好串行发送并保留最后选择，打开等偏好完成；按稳定id、browser或action身份恢复焦点。关闭同时中止在途读写。没有改服务端认证、TTL或进程管理。

作者复验使用专家八项真实DOM探针的只读副本，不改专家原件，另建A2候选与日志；再交独立专家复跑49+3+8及真实慢启动取消。A1失败证据保留。35s超时后只保留权威读取，不把网络中止当服务停止或操作回滚。

## A3偏好失败和OS投递接缝

依据[A2独立失败与先行用例](../testing/fc-a2-independent-retest-20261021.md)及[映射计划](../testing/fc-a2-independent-retest-20261021-mapping-plan.md)，继续修三项P1。控制页打开前若存在未保存偏好，最多重试一次；仍失败就保选择并就近提示，不发送open。浏览器显示label与OS名称统一映射；工作台投递采用普通URL参数与tab，避免已有进程argv投递差异，control仍普通tab。新`launcher/src/browser-open.mjs`使生产OS命令有界等待error/exit；只等open退出、不等浏览器退出、不重投旧认证URL、输出安全错误类别。`launcher-app.mjs`等待投递结果并核旅程代际，失败落S6、撤销句柄，owned认证URL始终finally丢弃；合法回告先到S4不得被迟到投递响应降回S3。

文件：control-html与DOM6；launcher-core/browsers映射、browser-open新模块、bin接线、launcher-app异步消费；原浏览器测试修正tab期望，新增真实生产投递接缝测试及package test登记，相关README/spec仅同步本次行为。隔离树精确同步，新A3清单/新增文件指纹；不build插件lib。作者跑原49+新增+DOM6+原8+A2失败探针，独立复验后Main全新Finder冷/已运行真实收页与S4采证。正式、旧3205/3211服务不动。

## A4旅程归属与成功态生命周期

[A3独立复验](../testing/fc-a3-independent-retest-20261021.md)的P11/P12/P13确证两项P1。最小改`launcher-app.mjs`：每轮开始冻结浏览器，probe/start/OS await、nonce铸造/校验、投递结果都用该份值；偏好只影响后继旅程。`launcher-core.mjs`新增begin-journey清旧成功/confirmed/旧详情，reopen无新回告仅S3，早到本轮回告仍保S4。相关browser-open/journey测试先保红例，修后53+新增、DOM7、原8、A2两文件、A3探针复验。JSDoc注明void或Promise接缝。新A4清单，不改A3已走通首次原件；旧4194不作修后运行身份。

## A5晚到OS失败不得覆盖当前合法进入

[A4独立复验](../testing/fc-a4-independent-retest-20261021.md)确证FC-A4-01：existing/owned/reopen本轮有效回告先到S4，迟到OS错误会写S6且confirmed=true。仅app三处catch增加同旅程已确认S4守卫，owned仍执行finally弃URL；状态机进入明确failure时清confirmed，避免矛盾状态。先补三路径红例，再修、冻结A5、受影响原测试与专家新探针重跑。真实N1/200原证保留，N2新回告未到仍记S3，不凭“已打开URL”签成功。

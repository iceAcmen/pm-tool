# 反馈剩余 GUI 原合同澄清与审证计划

> 2026-10-22，平台 trae，独立测试专家，非开发、非 GUI 执行端。给 Main 按原合同补证、交独立审签；不新增产品用例，不签全部代码 commit。

## 1. 派单与资源边界

负责人本次原句：

> 作为独立测试专家先行澄清和审证，非开发、非GUI执行。用户已持续授权Main按盘点分工补全部既有未验功能后普通commit，禁止push/release/正式切换。
>
> 只新增docs/testing/feedback-remaining-gui-20261022-r1*文件，其他testing/原证/产品/livingdocs禁写。不要fetch/pull/install/build/test/GUI/服务/凭据/git写。
>
> Main当前唯一GUI/build写者，用EGO space13 p1 3257 frozen U4r2(/private/tmp/pmtool-u4-closure-20261022-r2),最终102产品字节不变。
>
> 先输出原合同未签feedback最小准确步骤/预期及可接受控制边界，查有无已存可用原证（尤其同值generation/timer/迟到copy、原关闭保稿O4/O3/O5），不是另造用例。
>
> Main拟CDP Fetch在精确commands execute请求阶段阻断，回符合真实接口的明确error message含summary/detail/action和长原因；不伪成功不DOMsetState，clipboard延迟 adapter仅原copy竞争。判断这些方法是否符合原合同并列绑定字段。
>
> 当前HEAD9b1a8c5 dirty保留，3248/3249/3255禁止动，3256/3257也不停止。

本角色仅新增本前缀计划、报告及必要纯文件审计记录；不覆盖旧件。具体派单优先于通用拉取、构建、测试、livingdocs 同步和提交 SOP。Main 的持续普通 commit 授权不转移给本角色，也不豁免未验门。本次不加载 vendor、不探活端口、不读取认证材料。

## 2. 已核原合同

- [AGENTS](../../AGENTS.md)及[collaboration §9/§11](../collaboration.md)。
- [最终范围对账 §4.1/§4.4/§7](final-remaining-acceptance-reconcile-20261022.md)。
- [A18 反馈控制 GUI 报告](a18-feedback-controls-gui-review-20261022.md)及[原计划](a18-feedback-controls-gui-review-20261022-plan.md)。
- [A18 context SOURCE/AUTO 原报告](a18-feedback-context-independent-retest-20261022.md)、[原计划](a18-feedback-context-independent-retest-20261022-plan.md)、[原16反例](a18-feedback-context-independent-retest-20261022-cases.test.tsx)。
- [A17 原合同](a17-transport-feedback-contract-20261022-plan.md)、[原报告](a17-transport-feedback-contract-20261022.md)和[原 TF-X08](a17-transport-feedback-independent-retest-20261022-cases.test.tsx)。
- [O3/O4/O5 同页断言](main-o3-o5-samepage-assertions-20261020.md)、[原静态/18 AUTO 报告](oil-o3-o4-o5-patch-qa-20261020.md)及[批准错误 context 方案](../plans/2026-10-22-feedback-error-context-closure.md)。
- 生产 `panel.tsx`、`result-card.tsx`、`ui-feedback.ts`、`client/index.tsx`；宿主连接/Remote 接口只读用于判断注入边界，不当 GUI 证据。

只澄清上述余项。BF-G02..04 的看板/reset/queue/chunk 另由原执行合同负责，本次不借反馈 context 切片外签。未生效设计矩阵不追加。

## 3. 顺序与判定规则

1. 先逐条还原 TF-X08/A18-X01..10 与 O3/O4/O5 的对象、初态、动作、预期，保留原 ID，不把近似路径替换成原路径。
2. 先查现有报告、A0/A18 原证索引及历史本机交付指针。分别记录真实 GUI 原件、已独立签署可继承切片、SOURCE/AUTO 旁证和未找到的原证；不从源码判 GUI PASS。
3. 只读核候选清单及反馈接缝字节。最终候选沿 A20V3 的95项加 U4 的10项覆盖去重102项；记录主树/冻结树差异和局部源码身份，不能只认 HEAD/version。
4. 判断 Main 拟用请求阶段明确错误与 clipboard Promise 延迟是否落在原合同依赖边界。协议、命中请求、正文、释放时序、真实渲染和存储证据须绑定；不批准伪成功、DOM/setState 或后台回调绕过模态。
5. 本报告先交 Main 采证。没有新的原件路径时保留 GUI BLOCKED；收到新路径后仅在本前缀另存补审，核完整绑定并目视实存图片后再有限审签，不运行 GUI/产品测试。
6. 不扩大为全部积压、整页矩阵、全部 commit、工具毕业或正式切换放行。产品字节改变、方法越界或对象不明时，暂停相关签字，交 Main/原 owner；不改产品处理。

## 4. 状态

- 已完成：指定合同、原报告/测试与生产接缝读取；旧 A0 不同值复制、A18 modal 后关闭失败/明确 discard 续采和历史 O4 指针定位。
- 已完成：Main 拟用控制边界的先行澄清。
- 已完成：[先行报告](feedback-remaining-gui-20261022-r1.md)已落，含最小步骤、准确RPC失败信封、绑定字段、102字节核对、继承与缺证清单。
- 等待 Main：`FeedbackRemainingR1` 已见完整下发/初态及填写、暂停请求在途原件，未有完整结果链；本角色不采证，收到完整路径后继续有限审签。

## 5. 本角色验证

环境 macOS + bash；仅使用已有命令及 Node22.23.3 内置 fs/crypto 做文件读取/解析/指纹，可新增本前缀审计结果。未调用 pnpm、Vitest、verify、采证器或浏览器；不因文档核验成功声称产品测试通过。所有实际结果及探索失败在最终报告登记。

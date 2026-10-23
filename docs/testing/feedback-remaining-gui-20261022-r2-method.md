# 反馈剩余 GUI R2 最小方法澄清

> 2026-10-22，平台 trae，独立测试专家，非开发、非 GUI。给 Main 唯一 GUI 执行端先行采证依据；本件只澄清方法和原合同层级，不签用例、整域、commit 或发布。旧 R1 和原失败保持不变。

## 1. 本轮派单与边界

负责人本次原句摘录：

> 独立测试专家，非开发/GUI。持续用户验全部余项再commit授权，Main唯一GUI。唯一写面docs/testing/feedback-remaining-gui-20261022-r2*新文件；旧testing/报告/原证/产品/livingdocs不写。
>
> 是否可以当前input真实React onChange({target/currentTarget:实际node})仅完成这一checkbox选择，然后实际保存按钮，真实请求/host拒/零写/渲染？不手setState/假响应/假DOM，不后台ResultCard模态绕行。明确只本input依赖适配，不把U4许可自动外推。
>
> 核原批准合同是否将这些指定成GUI必要，原批准出处充分可澄清AUTO-only、N/A仅当合法据足，不为收工豁免。
>
> 先方法，再待封包只读审证/目视，签有限实际切片不整域/commit。102字节未变/U4r2freeze3257。禁fetch/pull/install/build/test/GUI/services/credentials/git写，3248/3249/3255/3256/3257均不动。

本具体派单覆盖通用同步、构建、回归和 livingdocs 写入 SOP。本专家没有继承 Main 的 GUI/build 或普通 commit 权限。不读取凭据，不探活、不停服务，不加载 vendor，不执行原采证器/测试器。Main 的新合法原件是明确在途成果，不记作污染。

## 2. O3 单一 checkbox 适配：有条件允许

**仅允许当前 3257、EGO space13/p1、tasks 编辑 t-0009 的真实 `input[name="predecessorIds"][value="t-0008"]`，调用该节点当前绑定的生产 React `onChange`，完成一次反向前置选择。保存必须实际按钮触发，后续必须真实生产请求、真实 host 业务拒绝与真实渲染。**

这不是继承 [U4 r2 §4.3](a13-u4-gui-total-retest-r2-20261022.md) 的许可，而是依据 [collaboration §9.5/§11.4](../collaboration.md) 和 [O3 原同页合同](main-o3-o5-samepage-assertions-20261020.md) 对本 input 独立澄清。O3 要验证拒绝后不开成功出口、保留原草稿、显式修正才成功；没有规定必须靠伪成功信封或绕模态关闭。循环依赖属于原“业务拒绝文本”类别，不新增需求。

### 2.1 为什么这个对象适合

- 生产 `panel.tsx:2933..2941` 的 onChange 只读取实际 `currentTarget.checked`，按该 row 的稳定任务 ID 更新受控前置集合；提交 `panel.tsx:2633/2647/2683..2692` 从真实 FormData 取前置数组，调用 run，只有 success 才 onSaved 关层。
- 可选集合排除自己，但不预先排除间接成环；生产界面也说明“真正成环由后端拒绝”。`core/tasks.ts:97..107` 沿 predecessorIds 检测循环，命中任务 ID 抛出“前置依赖存在循环：任务不能间接地依赖自己”。
- 已实读在途 `26-legal-control-events-events.json`：一次真实 `/pm task update t-0008` 携带 `predecessorIds:["t-0009"]`，随后真实 snapshot 请求。它是合法种子请求旁证，**尚未独立签其响应/落盘**。
- `27-business-draft.json` 实存为空字段/无 PM 卡/无 dialog、BODY 焦点；与负责人所述 unmount 相容，不能作为已选反向依赖或业务拒绝证据。三次 click/Space 的原 execution、错误与 reload 必须保留；本轮尚未拿到这三段完整封包，不能从描述确定根因或判“只是 EGO 的错”。

### 2.2 精确控制和停止条件

1. Main 先恢复同页合法入口，确认 t-0008/t-0009 同项目、种子已真实保存；记录本轮 reload/timeOrigin 与新表单实例。不得声称跨 reload 保留了原草稿或旧 Promise。
2. 仅定位当前可见、connected、未禁用、所属真实编辑 t-0009 表单的上述 input；记录 value、checked、所属表单/label、实际绑定存在。旧页面节点或任意同名 checkbox 不可用。
3. 适配事件的 target 与 currentTarget 必须都是这个实际节点，不能另造 `{checked:true}` 目标。若需准备输入值，只可用该真实 input 的原生 checked 属性准备本次选中值，再调用其现有 onChange；这是**单一控件的输入依赖适配**，必须明示，不是物理点击证据。禁止写 checked attribute、伪造隐藏 input/FormData、改 DOM 文本/class/role、改 React state/props/fiber/handler、直接调内部 setter 或改任务数据。
4. 等生产 React 重渲染，实存截图和页面状态证明该选项/已选计数一致、其他草稿仍在；随后实际点击当前“保存更改”。本许可不包含保存按钮 React onClick、表单 onSubmit/run/execute 的后台调用。
5. 不安装本请求的错误/成功注入；若已存在精确 Fetch 故障规则，先按原 finally 恢复并保存恢复记录。本链必须穿到 host。请求正文须为 t-0009 的真实 update，前置集合含 t-0008；保存实际请求与 host command/done/result/原因关联。
6. 拒后记录同一表单实例、全部原输入/前置选择、错误可见、控件解锁、无成功 toast/无 onSaved 关闭，以及拒绝前后 tasks/reports/实际写根逐字零写。session 日志写入与业务零写分开，不用源码推导回滚。
7. 按原 O3-2 从同一草稿修正必要关系、明确再保存，证明真实合法成功才写且关闭/提示。若反选解除也无法物理执行，可仅对**同一 input** 再调用其真实 onChange 解除选中，逐次明示；不外推其他 checkbox 或其他用例。
8. 目标不唯一、真实绑定不存在、重渲染仍 unmount、保存物理不可达、响应/零写缺失或候选变动，停止该链，保留 BLOCKED/实际失败，不加新替代字段、不伪补成功。

接受范围仅为 O3 的生产回调、表单提交、业务拒绝保稿及显式重试合同。**物理 click/Space 的完整交互仍未验证；本适配不能关闭物理兼容问题、O4 的纯键盘/顺序抖动断言或整任务页门。** 不允许调用模态背后的 ResultCard onClose/copy，原后台卡关闭超时原样保留。

## 3. A18 精确 AUTO fixture 与 GUI 的层级更正

### 3.1 原批准依据

| 原始依据 | 明确范围 |
| --- | --- |
| [批准错误 context 最小方案](../plans/2026-10-22-feedback-error-context-closure.md) §执行顺序2/3/4 | 要求正常消息/关闭清 context、旧 timer/复制代际不串；先在自有 SOURCE/AUTO 实现反例并独立复验，然后 Main 新宿主/实际导入故障恢复 GUI。未指定 GUI 必须返回 mock 同一 M 或手调 timer。 |
| [原独立 SOURCE/AUTO 计划](a18-feedback-context-independent-retest-20261022-plan.md) §授权/Oracle5/有限判定 | 派单明确“SOURCE/AUTO复验”“无GUI/build”；新增同值 messageGeneration/copy/timer races 属该自有自动反例。GUI/整门不由该计划签。 |
| [原16反例](a18-feedback-context-independent-retest-20261022-cases.test.tsx) X03/X05/X07 | success(message) 使用 execute.mockResolvedValueOnce(message)；X07 替换 setTimeout/clearTimeout 并直接执行捕获 callback。它们不是实际 host 的成功返回或自然 browser timer。 |
| [原独立报告](a18-feedback-context-independent-retest-20261022.md) §1/2/4 | 原样20仍19绿1红；独立 context adapter20与新增16有限 AUTO 已签。明确“不是浏览器实测、后端真实事务”。不能改口成原20全绿。 |
| [反馈 GUI 补件原计划](a18-feedback-controls-gui-review-20261022-plan.md) §授权 | 明确标记原因 GUI 未采继续 BLOCKED、不能借 AUTO；未把 mock 的精确 M 成功或手动 timer 指定为 GUI 必要。 |

R1 §4 将全部 X01..10 逐条展开为 GUI 最小动作，**把 AUTO 专用 fixture 误强化为精确 GUI 必要步骤**。本件只更正以下三项；不改 R1，不抹其当时 BLOCKED，不把所有 GUI 或一般竞态降为 AUTO-only。

### 3.2 有限裁决

| 原项 | 本次精确层级澄清 | 仍保留的边界 |
| --- | --- | --- |
| X03 resolve/reject，error M → success M → error M | **当前 task update 路径的精确同完整 M GUI 链 N/A；原 X03 保留 AUTO-only。** 原 M 以“执行失败：Response parsing failed…”开头，含原 action/TAB/尾部 LF；当前 task update 成功始终以 `[pm:summary]任务已更新｜…` 起始、detail 为完整 renderTask，与 M 不同。 | 不是 X03 GUI PASS，不删除原 AUTO 断言；一般真实成功清 context/详情、可达同值错误新代际/旧 copy 隔离仍须真实有限原证。不同字符串真实成功可验证清 context，但不得命名为“X03精确同值全链通过”。 |
| X05 resolve/reject，close → success M → error M | **同上，仅精确 success M 支链 GUI N/A，X05 原 mock 全链 AUTO-only。** | 真实可达 close 清卡及之后正常消息恢复仍适用；模态背后关闭不可达不因本澄清转 PASS，discard→close→新编辑不可冒保稿穿越关闭。 |
| X07 人为已排队旧 timer 多次晚到 | **指定手动 callback 控制为 AUTO-only，不纳本次真实 GUI 必要步骤。** 原批准未要求 GUI 注入 fake timers/禁 clearTimeout/重放 callback；不新增此控制许可。 | X07 不记 GUI PASS。合法真实成功约3秒提示及重新出现后的自然到期行为仍按原合同审证；自然等待不能声称已证明旧 callback 晚到。 |

上述 N/A 有双重依据：批准文件把这些精确反例放在 SOURCE/AUTO；当前所选真实 GUI 的 task update 返回语法不能等于原 mock M。**不声称已证明所有宿主命令/所有未来入口永远无法返回 M**，也不以 updatedAt 单一字段就推出全接口不可能。生产 `commands/task.ts:313..330` 的固定前缀与 renderTask（含 updatedAt）共同说明当前链不符合原 mock 完整字节。

X06 的原 AUTO 成功 fixture 同样不是 task update 实际全文，当前未找到合法同完整字符串 GUI 原链；本轮**不顺带裁其 N/A/PASS**。X08 quiet 实际成功、X09 当前复制拒绝重试、X10 同执行世界卸载旧 Promise 仍按各自合法可达原证判断；reload 销毁执行世界不能替 X10。新包中 X01/X02 普通、X04 quiet 同值 copy 与真实关闭等，只能签所采实际切片。

## 4. 接收截点与后续审证

2026-10-22 **18:25:39 +0800**，只读 Node 内置 fs/crypto 核对 exit0：

- A20V3 的95项 + U4增量10项去重102个声明输入，主树相同，missing/mismatch 均空；87个插件归 U4r2、15个 Launcher 归 A20V3父冻结，相同。102是文件数，不是字节数或功能数。
- U4 manifest SHA `26f093c3f8fbc243a28cb736f452b6fc8aa1ed90ec7403bc14a94fac4948fba9`；U4r2独立报告 SHA `7b73f4f2fa7a3b8bcea95acf4258e369f91ff9c94427ebeb7e047c0e05c5be8d`。
- Main 当前完整 loaded 2597521byte，SHA `7d4312dae04a9e979246a6cd241fc51e2312c4b15b8ed3361ff2212e67d8b0e1`；沿 R1 完整执行段认领，不能据此签本轮 GUI。
- R1计划 SHA `5eb3104077cb5adbe5e292c48e2e30b6ade8a0d740eddedd139e00e30cda249d`，R1报告 SHA `2e864ca7639c368b968e1d7d87e1e1ddd12a93bd8de6c4bf3d35b3da9a50b820`；原16反例 SHA `4d33b7a59a6f524af7602d7fa5bbf70f15eda22e997828310c7d3ce21ba75b81`。本轮未改原件。

已见 Main 新原件 `08/11/13..24`：精确普通错误、带 action/TAB 尾部、复制235byte、常驻与迟到 copy resolve/reject等。这里只接收为在途材料；未独立目视/核完整 index/退出与恢复，**不签 GUI PASS**。quiet 标记原因两段是否覆盖其实际入口及整个原观察时长须封包核查，不能借普通71秒自动给 quiet60秒通过。

Main seal 后仅只读审：完整执行/index/SHA/原失败退出、候选和实例/页面挂载段、精确响应正文/系统复制字节、普通与 quiet 实际 run、迟到 copy 时序/当前复制、真实关闭/dirty取消、O3完整 host拒绝和重试、O5合法 S0/S1读取与只读标注。逐图目视，按 [R1 §7](feedback-remaining-gui-20261022-r1.md) 的绑定字段裁有限切片；不重采、不运行测试、不封 Main 原证。

## 5. 本角色核验记录

环境 macOS/bash，Node v22.23.3；pnpm仅引用被测环境，未调用。实际使用 cat/sed/grep/find/ls 只读定位及 Node 内置文件读取/JSON解析/SHA；没有产品测试或 GUI，二者 **NOT_RUN（本派单禁止）**。

探索退出如实记录：rg 不存在 exit127，改 find/grep；指定 `/user_profile.md` 与 `/projects/.../project_memory.md` 不存在，ls exit1，未创建/读其他项目记忆；一次宽 find 输出过大，随后限 maxdepth1/2，无产品失败含义；父执行记录定向 grep 未命中 exit1，不据此说原证不存在。102项与合同指纹只读核对 exit0，非产品/GUI测试通过。

18:27:06 +0800 再核，Node 内置 fs/path/crypto（绝对命令 `/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node`，内联只读程序）exit0：本文件9个相对链接 missing=[]、尾随空白=[]，R1两文件/原16反例/U4r2报告/U4manifest的 originalDrift=[]，主树102项 productDrift=[]。Main 原证目录顶层122项，未见 index/seal/execution/manifest/raw-report 命名文件；这是本截点待封包，不是全盘缺证判断，也不限制 Main 合法续采。未目视在途图片、未写原证索引，封包审签仍待 Main。

唯一新增本 R2 前缀文档；不修改旧 testing/原报告/原证/产品/livingdocs，不运行 fetch/pull/install/build/test/GUI/service/credential 或 Git 写。3248/3249/3255/3256/3257 均未操作，无 builder/浏览器连接或长运行进程占用。**方法已交 Main；封包审签待收到原件，不签整域或统一 commit。**

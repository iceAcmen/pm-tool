# A13：治理 GUI 的确定性 gateway 与宿主命令接线

日期：2026-10-22；按派单保留文件名 20261021。平台：trae；角色：只读接线探索，不执行、不判独立 PASS。

授权范围：只新增本报告。未改产品、build、server、GUI、credentials 或 Git；不读正式 profile/Key，不复述已完成来源诊断。工作树 HEAD 为 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，产品仍为 dirty 候选；本文源码行号不是 Main A12 实例已装载的证明。

## 1. 最短接线结论

1. **RA-AI04 用真实副驾 ask 的 3 步 plan，RA-AI05 另出 8 步实体 plan。不存在当前 GUI 合法的 10 步计划。** `PLAN_MAX_STEPS=8`，10 步整包拒绝；原 F6 worker 的 10 actions 是 `parseCopilotActions → ask-apply` 领域路径，不经过副驾 `parseCopilotPlan → validatePlan` 的预算门。旧 `actions` 格式还会被 GUI 包成无依赖平凡步，不能用来测同任务依赖链。[S1][S2]
2. **不复用旧 restore 的 undo handle。** 备份可以恢复合法业务初态，但 `undoStore` 是当前进程内 Map；旧 ledger 元数据不是可用句柄。必须本轮 ask、GUI 明确 apply、真实 `ask-undo list` 查询新 handle，再在同进程 10 分钟内撤销。[S3]
3. **已有可直接运行的 gateway CLI 在上游测试支持包，不在 F6 worker。** 复用 `packages/test-support/llm-mock-server/src/bin.ts`，它提供 Anthropic Messages HTTP/SSE、可指定成功正文和故障序列。F6 worker 的 `ctx.provide('llm', gateway)` 只是进程内测试注入，不是 HTTP 服务，不能直接接现有宿主。[S2][S4]
4. **保持生产 ask 代码，隔离 `llm-pi-ai` 配置接 `ark-plan → 127.0.0.1`，副驾选「生产 Key」。** 这里是生产车道代码上的确定性模拟，不是真实模型验收。只给隔离进程一个无权限的 dummy 环境值，不录入凭据、不读取正式 profile。[S5][S6]
5. **命令能力的真实 GUI 入口是宿主会话 composer 的 `/pm` 命令输入。** 不是一个另有“Commands”按钮的独立页面，也不是 PM 副驾问答输入。PM 插件注册一个带 `input` 的 Host command `pm`，宿主 `/` 菜单领取其参数；所有子命令走真实 `remote.commands.execute`，结果落会话 command flow。[S7][S8]

## 2. Main 可复用的启动与配置

以下是给 Main 的待执行片段，本轮均未运行。环境：macOS、nvm Node 22、pnpm 11.28.5。沿 Main 自有隔离候选和 profile 接续；**不要运行现有 `scripts/e2e.mjs`**：它默认读取 `~/.dsh/profiles/pm`、软链其 node_modules、直接写种子 JSON，并自行启动宿主/浏览器，越过本次边界。只复用其 `DSH_PM_E2E` 入口知识。[S9]

### 2.1 必须先有的对象

- `A13_RUNTIME`：Main 认领的独立 runtime，含自有 `home/profiles/pm`、data/files/backups；不得把 Main 当前采其他 GUI 的 runtime 原地切路由/重启。没有自有 profile 时由 Main 从已认领无密钥隔离骨架派生，不从正式 pm profile 拷贝。
- `A13_T1/A13_T2`：**正常 GUI/宿主 task add 输出**或合法标准恢复初态中实际存在的同项目两任务 ID；两者不同。它们不是手填不存在的示例 ID。
- RA-AI05 所需同项目 milestone/risk/deliverable/meeting 也从正常入口创建/合法恢复取得；不能拿 RA-AI03 已删源继续当 update 目标。
- 不需要 seed refs、改 settings JSON 或 patchDB；模型响应只带建议动作，refs/new IDs/undo 由生产 dispatch 生成。
- 端口先由 Main 核空闲和 owner。下例 `3240` gateway、`3241` host **仅为待认领建议，不宣称空闲**；本报告不探端口、不启动。

### 2.2 3 步正文生成与现成 gateway CLI

在 Main 自有终端中先设置上述真实 ID 与 runtime；下面生成的是模型响应文本，不是数据库文件。`s1/s2` 同任务，`s3` 独立；用非 done 的状态避免把 task-done 反思副作用混入 clean undo 原值比对。

```sh
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm use 22 >/dev/null

: "${A13_RUNTIME:?Main 必须先认领隔离 runtime}"
: "${A13_T1:?填正常入口返回的任务一 ID}"
: "${A13_T2:?填正常入口返回的任务二 ID}"
HARNESS=/Users/bytedance/Projects/dsh-pm/deepseek-harness
TSX_IMPORT="file://$HARNESS/node_modules/tsx/dist/esm/index.mjs"
GATEWAY_PORT=3240

PLAN_TEXT="$(node --input-type=module -e '
const [t1,t2] = process.argv.slice(1);
if (!t1 || !t2 || t1 === t2) throw new Error("需要两个不同的真实任务 ID");
const plan = [
  {stepId:"s1",title:"推进任务一",reason:"本轮链式确认采证",
   action:{op:"task.update",id:t1,patch:{status:"in_progress",progress:62}},needs:[]},
  {stepId:"s2",title:"任务一改派",reason:"依赖前一步",
   action:{op:"task.update",id:t1,patch:{assignee:"治理采证甲"}},needs:["s1"]},
  {stepId:"s3",title:"推进独立任务二",reason:"不依赖任务一",
   action:{op:"task.update",id:t2,patch:{progress:22}},needs:[]}
];
process.stdout.write("隔离确定性建议，尚未写入业务。\n```json\n"
  + JSON.stringify({plan}) + "\n```");
' "$A13_T1" "$A13_T2")"

cd "$A13_RUNTIME"
env -i PATH="$PATH" HOME="$A13_RUNTIME/home" TMPDIR=/private/tmp \
  node --import "$TSX_IMPORT" \
  "$HARNESS/packages/test-support/llm-mock-server/src/bin.ts" \
  --host 127.0.0.1 --port "$GATEWAY_PORT" \
  --sequence success --repeat-last --success-text "$PLAN_TEXT"
```

CLI 前台运行输出 ready/request/result JSONL；Main 需另行按现有采证设施保存原始 stdout、精确 PID/argv/cwd、正文指纹。未配置 `--api-key` 时服务器接受任意测试 x-api-key；它只有 `/v1/messages`，**不是** `/v1/chat/completions`。不用 installer、pnpm install 或上游 build。[S4]

`TSX_IMPORT` 指向的现有文件已只读确认存在。实际 SDK/config 加载及成功请求仍 NOT_RUN，不能把源码匹配写成网络已通。

### 2.3 隔离 profile route patch

在**Main 自有隔离** `home/profiles/pm/cordis.patch.yml` 的现有补丁中按 id 替换 `llm-pi-ai` 配置；保留原 storage、pm-tool、主题和 client 组合，不覆盖整份文件。以下是配置内容，不是本轮文件改动：

```yaml
- id: llm-pi-ai
  name: '@deepseek-ai/dsh-llm-pi-ai'
  config:
    providers:
      ark-plan:
        displayName: A13 isolated deterministic gateway
        api: anthropic-messages
        baseURL: http://127.0.0.1:3240
        apiKeyEnv: DSH_PM_LOCAL_GATEWAY_KEY
        retryPolicy:
          mode: normal
          maxRetries: 0
        compat:
          forceAdaptiveThinking: true
        models:
          - id: deepseek-v4-1-flash-260910
            contextWindow: 262144
            maxTokens: 32768
            reasoningEfforts: { off: null, high: high }
          - id: deepseek-v4-pro-ga-260813
            contextWindow: 262144
            maxTokens: 32768
            reasoningEfforts: { off: null, high: high }
          - id: glm-5-3-flash-260828
            contextWindow: 262144
            maxTokens: 32768
            reasoningEfforts: false
```

这三个 ID **必须与当前 `resolveModelRoute('prod','copilot')` 一致**；随意写 `a13-model`/`deepseek-flash` 不会被插件选中。`baseURL` 不加 `/v1`，Messages SDK 会调用 `/v1/messages`。协议及 thinking 字段来自当前 adapter schema 和 adaptive-gateway 测试，不是 OpenAI SSE 字段拼装。[S5][S6]

按 id patch 整体替换 adapter config，不是 providers 深合并。若 Main 隔离组合里已有另一适配器注册 `ark-plan`，先在**自有隔离组合**移除/禁用重复 owner；不要动正式插件。该替换没有声明 narrative 的 Doubao 模型，本方案只接本轮 ask/capture 的 copilot 路由，不承诺全部生成场景。

只测最短 E2E 时无需上述 route patch：Main 原隔离进程已有 `DSH_PM_E2E=1`，副驾输入精确 `fixture` 可出两合法 task 步加三拒步；输入 `entities` 可出八实体步。但二者都不能产出本单所需“三步含独立 s3”的完整 RA-AI04，且不覆盖 gateway 故障/真实上下文。[S3][S9]

### 2.4 隔离宿主启动环境

Main 若需要新宿主，必须先完成自有 profile/候选 package 链接认领；这里不代建、不触碰 Main 已运行实例。不读正式 Key、`~/.dsh` 或 `~/.zshrc`。**cwd 也改为自有 runtime**：当前 credentials fallback 包含 invocation cwd 的 `.env`，只清环境而仍 cwd 在上游不足以保证不读那里配置。[S10]

```sh
cd "$A13_RUNTIME"
env -i PATH="$PATH" HOME="$A13_RUNTIME/home" TMPDIR=/private/tmp \
  DSH_HOME="$A13_RUNTIME/home" \
  DSH_PM_ISOLATED_ROOT="$A13_RUNTIME" \
  DSH_PM_FILE_ROOT="$A13_RUNTIME/files" \
  DSH_PM_BACKUP_DIR="$A13_RUNTIME/backups" \
  DSH_PM_LOCAL_GATEWAY_KEY=isolated-not-a-secret \
  DSH_PM_E2E=0 \
  node --import "$TSX_IMPORT" "$HARNESS/apps/cli/src/bin.ts" \
  --profile pm --host 127.0.0.1 --port 3241 --no-open
```

dummy 仅供 loopback 协议认证，无真实模型权限，不是 credentials 录入。`DSH_PM_E2E=0` 确保输入不会短路生产 ask。新 cwd 与绝对 bin/import 路径仍需 Main 首次验证宿主支持；失败保留基础设施阻塞，不回落正式 profile。ready URL/token 只留 Main 私有文件，不写报告。停进程遵守 ISS-027 的精确单 PID 流程。

`model status` 的 prod ready 判断读 `CODING_PLAN_API_KEY`，dummy 不会使它亮“就绪”；这是展示启发式，不是 `buildProdCandidates` 的拒绝门。当前 prod 候选不预检真实 Key，adapter 实际按 `DSH_PM_LOCAL_GATEWAY_KEY` 解析。不要为了亮灯设置真实/假 `CODING_PLAN_API_KEY`。[S5]

## 3. RA-AI04..06 的真实 GUI 动作与障碍

### 3.1 副驾路径

`项目管理 → 切换项目 → AI 副驾`，有浮层 `aside[aria-label="AI 副驾"]`；最小化时点 `展开 AI 副驾，保留此前上下文`。选 `[role=tablist][aria-label="模型车道"]` 内「生产 Key」，实际命令是 `model mode prod`；仍留「只读诊断」tab，在底部输入普通问题如 `治理链式三步采证`，点 `aria-label="发送"`。[S11]

不要把 `/pm ask ...` 整条命令输入副驾：它会作为问题再次包装。也不要选宿主聊天底部模型来代替副驾 lane；副驾使用插件 model mode 自行 resolve route。

响应被生产 parser 接收后，**需手动切「草稿待确认」**，没有自动跳 tab。核 `data-copilot-plan`、`data-copilot-step` 的 s1/s2/s3；任务行能编辑的 GUI 控件仅 status/progress/assignee/startDate/dueDate，description/evidenceUrl/repoUrl/branch 可随模型 action 到后端，但没有对应行内编辑器。扩展实体卡是摘要/旧新值对照，不是可编辑表单。[S11]

取消按钮 `data-copilot-cancel` 只 `clearPlan()`，不发写命令。切回诊断再次普通问题生成；核业务 manifest 不变，别把 `model mode prod` 的 settings 写入算成草稿业务写。

明确提交是 `data-copilot-apply-batch`「整批执行（3）」或 `data-copilot-apply-stepwise`「逐步执行」，**这里没有额外确认 modal**。提交后用 `ask-provenance <项目ID>` 对照新批次，undo 按钮为「撤销 · 整批 3 步」或各 step label；保存本轮 `ask-undo list` 返回的实际 handle。重复撤销/重启失效在宿主命令输入用同一真实 handle 查验，不能手造一个像 handle 的字符串。[S3][S11]

### 3.2 确认/撤销接缝，不可假称路径已覆盖

| 场景 | 可达方式与源码限制 |
| --- | --- |
| 整批同目标链 + 独立任务 | 3 步 plan 合法；后端同次 dispatch 推进 baseline，逆序 undo 抓每步完整 original/postimage。正常采 clean/mixed/changed 分支。 |
| 出草稿后人工改，再确认 | `openedAt` 仅 stale 提示，`runApply` 使用**当时 props 的 `baselineMap`**，不是 openedAt。若 PM 已刷新到人工改动后的任务，旧草稿确认会拿新 baseline，不能证明旧基线冲突；扩展实体 baselineMap 更没有时间戳。 |
| 保旧基线的真实 GUI 冲突 | 两个正常 UI 客户端：A 出草稿不刷新；B 宿主 task update/正常任务保存改 T1；A 在未收到新快照条件下点整批执行。需记录 A 发出的真实 `--base` 和 B 改后 updatedAt；若 A 自动刷新而基线变新，该轮不构成冲突原证，登记接缝。 |
| 逐步依赖拒/独立继续 | `forStepwiseApply` 去掉 needs，前端逐条发并重读 tasks。当前循环没有“前一步失败 → 跳过依赖步”的 client 状态机。后端跨调用也不保存已执行 step 集合；若返回 kind:error，PM bridge 抛错，整个逐步循环停止，独立后续步也不继续；若返回 success 但应用0步，循环仍继续。逐步按钮不能自动证明整批依赖拒语义；保留实际返回给专家。 |
| clean undo | apply 后不人工改，当前进程内立即点新 handle；核任务回到实际 apply 前值，ledger 追加审计。 |
| changed/mixed undo | apply 后用 B 正常改 T1，A 不关闭副驾点新 undo；T1 应拒覆盖，独立 T2 可还原，同目标先前步保留；后端 `used=false` 保留可重试。 |
| mixed 再试入口 | `runUndo` 只要 execute resolve 就从**本地按钮列表**移除 handle，即使返回部分撤销成功而后端 used=false；通过宿主 `/pm ask-undo <实际handle>` 再试。若全冲突返回 kind:error，client bridge 抛错，按钮留存。 |
| 逐步撤销列表 | 每步查询全进程 `ask-undo list` 第一条，不是返回 apply 自定义 undoId；只显示最多三条，重启/关闭副驾不保证按钮可重建。失败/幂等后也查询，可能拾取上一次 handle；需核实际新批次关联，不能凭按钮 label 定身份。 |
| 幂等 | 相同 actions+base 在 60s 内重放会拦。换分支用正常新任务/新项目或真实重新生成基线，不能删幂等 settings 来绕过。 |

这些是当前源码接缝，非本轮 GUI FAIL/PASS；Main 在专家既定 RA-AI04 步骤里保真实现象并交专家判定，不自行改用例。[S3][S11]

### 3.3 RA-AI05：8 步独立响应

现有 `entities` E2E 入口动态选本项目四表第一条作 update，加四 create，共八步；要求每表有一合法可更新旧记录。GUI 普通输入 `entities` 的 JSON 引号不阻止后端 `/entities/` 匹配，**但仅当该新隔离进程 `DSH_PM_E2E=1`**。此入口 bypass model/context，仅算解析/确认/实体守卫采证，不算 B7 只读模型上下文或网络模型。[S3][S11]

完整 gateway 模式可把 §2.2 `plan` 替换为以下八个合法 action，按序包为 `{stepId:"e1".. "e8",title,reason,action,needs:[]}`；所有 update id 来自本轮真实同项目记录：

```js
[
  {op:"milestone.create",patch:{title:"A13新里程碑",targetDate:"2026-11-30"}},
  {op:"milestone.update",id:msId,patch:{description:"A13更新说明"}},
  {op:"risk.create",patch:{type:"risk",title:"A13新风险",impact:"low",probability:"low"}},
  {op:"risk.update",id:riskId,patch:{responsePlan:"A13响应计划"}},
  {op:"deliverable.create",patch:{name:"A13新交付物"}},
  {op:"deliverable.update",id:deliverableId,patch:{description:"A13交付说明"}},
  {op:"meeting.create",patch:{title:"A13新会议",meetingDate:"2026-10-22"}},
  {op:"meeting.update",id:meetingId,patch:{summary:"A13更新摘要"}}
]
```

这不是可直接带未绑定变量执行的脚本，而是响应 action 形状。日期可用实际 D；创建不填预造 ID，真实 ID 由 dispatch 分配。同名冲突/原状态保护仍以实际领域校验为准。

delete/跨项目/unknown/wrapped/attachments/progressLog 拒绝样例**另开 ≤8 步响应**，不往八步后追加导致整包预算拒。将五拒例加一条合法独立更新，即可区分逐字段拒与预算拒。每个非法建议使用真实对象/真实 foreign ID；不写 refs/undo 字段，不经任意 JS 改页面 steps。

B7 模型上下文仅在正常 gateway ask 路径投影 task 资料/日志，file 资料裁掉 url/assetId/note 等；上下文原始 request body 需 Main 采用自有日志设施采集。现成 CLI 只输出请求次数/路径/behavior，不保存 body；F6 worker gateway-calls 是历史领域原证，不是这轮网络原证。[S4][S11]

### 3.4 RA-AI06 故障与请求取消

同一 CLI 支持 `--sequence auth_error,success` / `rate_limit,success` / `malformed_json,success` / `context_overflow,success` / `stall,success`，`--repeat-last`。文字乱码用 `--sequence success --success-text '乱码且没有计划结构'`；超计划预算用 9 步响应，超上下文用 `context_overflow`，不可把三者混称一个“超长”用例。慢正文用 `slow_success`、`--chunk-delay-ms`。[S4]

故障序列是**每条实际 HTTP 请求**消费一次，不是每点发送消费一次。虽配置 adapter `maxRetries:0`，插件仍有三候选链，非硬错误会在同一个 ask 内继续请求；`auth_error,success` 可能同一 ask 第二候选就恢复。要观察最终失败可先 `--sequence auth_error --repeat-last`，下一阶段由 Main 精确停 gateway 单 PID 后以 success 重起同端口；不重启宿主以保当前 undo。原始 request/result 和副驾返回必须配对，不凭配置名判已覆盖失败。[S4][S5]

无 Key 分支：自有隔离环境去掉 `DSH_PM_LOCAL_GATEWAY_KEY`，保持 apiKeyEnv 指向该变量，且自有 home/cwd 没该引用的持久记录；不能去读正式凭据来判“无 Key”。认证失败不保证同 F6 内存 mock 的 `INVALID_CREDENTIAL` 文案：实际 pi-ai 将 HTTP 401/403 归 `AUTH`，插件 normalize 只特殊识别 `INVALID_CREDENTIAL` 等，可能成为泛化中文生成失败。保留真实结果给专家，不能引用旧 mock 固定中文作为本轮预期已达。[S6][S12]

**当前副驾没有“停止请求”控件/AbortController。** `send` 等待 `execute`，`generateDraft` 使用 `AbortSignal.timeout(120000)`；草稿取消只 clearPlan，ESC/关闭副驾仅卸载 UI，不传服务端 abort。每候选都有 120s bound，整次多候选不等于总共 120s。`stall` 可观察超时恢复，不能证明用户取消请求。RA-AI06 真 cancel-request GUI 分支须据此交接为未可达接缝，不得用关闭窗口/停 gateway 冒充用户请求取消。[S3][S11]

真实授权模型非本地模拟范围；它的一次非空来源确认/重校不能由 gateway 继承。是否确需本人认证由 Main 按已有授权核，不以此接线报告标 MANUAL_PENDING。

## 4. P0~P3：宿主真实 commands UI 接入

### 4.1 实际入口与返回

Main 在同一隔离宿主回到会话主面板，创建/打开**普通主会话**，在 composer 输入 `/`，选 `pm`（项目管理命令）或直接输入 `/pm ` 后参数并提交。先 `/pm ping` 确認命令可达，保存会话 command/run、command/done 返回；不是发自然语言让模型执行。子代理 session 的命令目录在当前 UI 会返回空，不能拿它当宿主不支持命令。[S7][S8]

菜单只注册 `pm` 一项，input hint 尚未列完整治理子命令；没有 `habit` 等单独菜单项不代表缺 handler。精确命令名称使用下面表，不靠 hint 猜测。Host `ui-commands` 挂在 `conversation.input.overlay` 和 `/` input trigger；web-app bundle 含该 client row。实际 Main profile/bundle 是否已启用、普通会话能否打开，仍需 Main 真实 GUI 核对，不由源码存在替代。[S7][S8]

PM 顶级面板自己的 execute bridge 也调用同一 `remote.commands.execute`，但没有任意命令文本框；AI 副驾问题框不可替代。命令成功后 PM 页面不保证自动更新，需回 PM 手动刷新/重进。错误必须读**持久结果节点中的 handler kind/text**，不能以 composer 消失或 submission admitted 视为业务成功。[S7][S8]

### 4.2 已承诺子命令精确映射

下表 `P/T/H/O/S/L` 分别指总账真实 project/task/habit/okr/suggestion/lesson ID，`D` 是当前本地日期，`OUT` 是 Main 自有隔离绝对目录；不是直接执行的示例值。所有 JSON 为原始参数对象，不给 JSON 再套一层 JS 字符串。只要求命令入口的项在宿主 command flow 采；有 PM 页面承诺的投影、来源、队列、人员、OKR/习惯档案同时回相应既有页面采。[S13]

表内 `<JSON>` 的最小合法 body：OKR suggest 为 `{"title":"A13建议","kind":"objective","rationale":"本轮采证"}`，OKR add 为 `{"title":"A13目标","kind":"objective"}`；habit suggest 为 `{"title":"A13习惯建议","rationale":"本轮采证"}`，habit add 为 `{"title":"A13习惯"}`；lesson add 为 `{"taskId":"实际wrapped任务ID","markdown":"待核：需补本轮材料"}`。关联项再加实际同项目 `primaryOkrId`/`okrId`，不手填记录 id/projectId/status/checkIns/streak 到建议 body。建议标题文本是合法测试输入，不是预造来源。

| ID | 宿主命令参数形状 / 既有 PM 呈现 |
| --- | --- |
| RA-P0001 | `/pm ask P 问题`，正常 gateway 返回诊断和 task 只读投影；非 fixture。上下文 request 原证另采。 |
| RA-P0002 | gateway action `task.update` 的 patch 带 description/evidenceUrl/repoUrl/branch，副驾明确 apply；负例另出 plan。人工正常改用 `/pm task update T {"description":"说明"}`，不把人工写当 AI 确认。branch 单独合法，按原 handoff 更正，不沿旧采证单笔误人为加 repo 前提。 |
| RA-P0003 | `/pm capture P "会话文字"` → 输出真实 `draft-...` → `/pm capture-apply P draft-...`；副驾内「对话补档→生成草稿→放弃草稿/确认落库」已有按钮，新增任务撤回是 `/pm task delete T`，不是 ask-undo。 |
| RA-P0004 | `/pm attach-evidence T https://example.com/evidence`；另 javascript 负例；任务重进及来源台账。证据 URL 是测试输入，不声称网页真实内容证据。 |
| RA-P0005 | `/pm session bind T 会话ID "note"` 两次；`/pm session list P`、`/pm session notes T`。绑定 session ID 取真实主会话，不另造房间身份。 |
| RA-P0006 | `/pm metric P`；对照当前 ask/capture/evidence/undo ledger 和 pending，重进。 |
| RA-P0007 | `/pm task update T {"status":"done"}`；`/pm reflect T`、`/pm reflect T edit "材料"`、`/pm reflect T final`；`/pm reflect list P`。 |
| RA-P0008 | `/pm check T` 或 `/pm check P`；现有任务检查卡展开/打开目标，不新增检查页。 |
| RA-P1001 | `/pm queue list P`、`/pm queue open P`；PM 队列 top/rest 和 task 跟进/刷新。 |
| RA-P1002 | `/pm queue mute T 7`、`/pm queue unmute T`；合法过期历史只能标准恢复，rest 中仍可见。 |
| RA-P1003 | `/pm queue quiet HH:MM HH:MM`、`/pm queue quiet off`；时段包含真实当前时刻，不改墙钟。 |
| RA-P1004 | 正常 task update 后回原副驾投影，点「刷新/打开任务」，不用再 ask。 |
| RA-P1005 | 正常里程碑/交付物页面分别保存 achieved/accepted；`/pm reflect list P` 找对应 sourceEvent，任务型 `/pm reflect T edit/final` 不冒充全部实体反思编辑入口，实体原呈现沿专家步骤。 |
| RA-P1006 | PM「人员」事实/建议/烂尾筛选和任务打开返回；不存在需另发的 `/pm people ...` 子命令。 |
| RA-P2001 | `/pm export markdown P OUT`、`/pm export web P OUT`、`/pm export plain P OUT`；覆写原文件时对应命令尾 `confirm`；真实打开导出 HTML/文件。 |
| RA-P2002 | `/pm export audit P`、`/pm export sent P`；archive 核 settings 原证/任务出站位，不臆造 `/pm export archive`。31/29天合法历史走标准备份恢复。 |
| RA-P2003 | `/pm okr suggest P <JSON>`、`/pm okr inbox P all`、`/pm okr confirm S`、`/pm okr ignore S`、`/pm okr inbox P clear`；PM OKR inbox/tree。 |
| RA-P2004 | `/pm okr add P <JSON>`、`/pm okr update O {"primaryOkrId":"实际A","relatedOkrIds":["实际B"]}`、`/pm okr tree P`、`/pm okr update O {"status":"confirmed"}`；PM 主树/软联。 |
| RA-P2005 | `/pm task update T {"status":"wrapped"}`；`/pm stats P`、queue/check、PM 人员/看板/反思；AI wrapped 拒例另 plan。 |
| RA-P2006 | `/pm lesson add P <JSON>`、`/pm lesson edit L "markdown"`、`/pm lesson final L`、`/pm lesson list P`；沿既有素材入口，不新增 lesson 页面。 |
| RA-P2007 | `/pm archive P OUT`（覆盖才 `confirm`）、`/pm review P YYYY-MM-DD YYYY-MM-DD`；review 返回 JSON+Markdown，不宣称自动写文件；打开实际 archive/素材。 |
| RA-P3001 | `/pm habit suggest P <JSON>`、`/pm habit inbox P`、`/pm habit confirm S`、`/pm habit ignore S`；PM 习惯建议区。 |
| RA-P3002 | `/pm habit checkin H YYYY-MM-DD "note"`，分别真实 D/D-1/D-2；D+1/D-3 负例；PM 档案。 |
| RA-P3003 | F7 标准预检/明确恢复后 `/pm habit list P` 与习惯页最近14天/月份折叠；不直接改 checkIns/streak。 |
| RA-P3004 | `/pm habit add P <JSON>`、`/pm habit update H {"okrId":"实际同项目OKR"}`、`/pm habit final H`；取消关联 `{"okrId":null}`；PM 按 OKR 只读聚合。 |
| RA-P3005 | `/pm web snapshot` 的 habits/cycleDue 与 PM 占位说明；**没有 `/pm cycleHookPoint` 命令**。`cycleHookPoint` 是 core 白盒函数，AUTO 原证另用；GUI 不要求后台触发。 |

## 5. 交给 Main 的阻塞清单

- 当前来源 F6 的历史 restore ledger 不能提供本轮运行时 undo；先真 ask/explicit apply，别修饰旧 refs。
- 10 步 GUI 不合法；按 3 步链与 8 步实体两次响应，拒例另计划。保留 `{"plan":[...]}`，不用旧 actions 丢 needs。
- 普通 ask 的真实 pipeline 可用现成 Messages CLI + 隔离 ark-plan route；仅设置 DSH_PM_E2E 不足以覆盖真实上下文/网络故障。
- 当前基线刷新、逐步 needs、混合撤销按钮/新 handle 查询、无请求停止控件均需真实原证/专家处理；本报告不实施产品修复。
- CLI HTTP request body 采集不是现成 stdout 的内容；Main 如需 B7 prompt 原证，应另用自有受控采集设施，不把历史 worker body 冒成新宿主请求。
- Host command UI 要 ordinary session + ui-commands/client dependencies；若现有隔离 profile 不具备，标入口设施缺口并在 Main 自有组合补齐，不新增产品页、不绕为 shell RPC 的 GUI PASS。
- 新 cwd 的绝对 CLI/import 启动、route 实际装载、端口空闲、SDK 流恢复、Main candidate 实际 bundle 均未执行验证。所有 GUI 结论仍由独立专家给出。

## 6. 证据索引与本轮验证

本轮只读 `cat/sed/grep/find/git status/git rev-parse`；本机无 `rg`，改用 grep/find。未安装依赖、未 fetch/pull（dirty 并发及本轮只读边界）、未跑 build/verify/E2E/GUI；无产品测试结果可报。报告本地链接检查无缺失、两段 shell 块 `bash -n` 均退出0；没有执行其中命令。检查只证明本文件存在及 Markdown/引用/命令语法可读，不构成能力 PASS。

- <a id="s1"></a>**[S1]** [生产计划 parser/预算](../packages/dsh-pm-tool/src/core/copilot.ts)：`parseCopilotPlan` L350-L387，`PLAN_MAX_STEPS`/`validatePlan` L433-L466；[需求](../docs/requirements.md) PROD-24 预算合同。
- <a id="s2"></a>**[S2]** [原治理 GUI handoff](../docs/testing/governance-growth-independent-auto-20261021-gui-handoff.md)；[F6 worker](../docs/testing/governance-growth-independent-auto-20261021-evidence/governance-growth-independent-auto-20261021-soAcAa/frozen-package/worker.mjs) L65-L89 内存 gateway、L181-L213 十 actions。
- <a id="s3"></a>**[S3]** [生产 ask/apply/undo](../packages/dsh-pm-tool/src/commands/ask.ts)：E2E 两入口 L10-L80，生产 route/context L85-L145；`undoStore`、`handleAskUndoCommand`、`applyCore`、`handleAskApplyCommand`。
- <a id="s4"></a>**[S4]** 上游只读：[mock CLI](file:///Users/bytedance/Projects/dsh-pm/deepseek-harness/packages/test-support/llm-mock-server/src/bin.ts)、[参数](file:///Users/bytedance/Projects/dsh-pm/deepseek-harness/packages/test-support/llm-mock-server/src/cli.ts)、[Messages server](file:///Users/bytedance/Projects/dsh-pm/deepseek-harness/packages/test-support/llm-mock-server/src/index.ts)。
- <a id="s5"></a>**[S5]** [当前模型路由](../packages/dsh-pm-tool/src/core/model-route.ts)：ark-plan 三候选、`getModelMode`/`describeLanes`；[ai-client](../packages/dsh-pm-tool/src/core/ai-client.ts)：prepared call、重试与 120000ms timeout。
- <a id="s6"></a>**[S6]** 上游只读：[pi-ai config](file:///Users/bytedance/Projects/dsh-pm/deepseek-harness/packages/llm/llm-pi-ai/src/config.ts)、[协议/provider](file:///Users/bytedance/Projects/dsh-pm/deepseek-harness/packages/llm/llm-pi-ai/src/provider.ts)、[adapter 测试](file:///Users/bytedance/Projects/dsh-pm/deepseek-harness/packages/llm/llm-pi-ai/tests/adapter.spec.ts) L795-L839 adaptive-gateway。旧 [model-providers](../docs/model-providers.md) 只复用 patch-id 机制，不继承旧 provider/Key 默认。
- <a id="s7"></a>**[S7]** [插件 command 注册/分发](../packages/dsh-pm-tool/src/index.ts) L207-L215、L313-L350；[PM client bridge](../packages/dsh-pm-tool/src/client/index.tsx) L19-L34。
- <a id="s8"></a>**[S8]** 上游只读：[ui-commands 注册](file:///Users/bytedance/Projects/dsh-pm/deepseek-harness/packages/client/ui-commands/src/client/index.ts)、[会话目录/领取/execute](file:///Users/bytedance/Projects/dsh-pm/deepseek-harness/packages/client/ui-commands/src/client/service.ts) L98-L126、L377-L425；[web-app patch](file:///Users/bytedance/Projects/dsh-pm/deepseek-harness/packages/bundle/web-app/cordis.patch.yml) L369-L370。
- <a id="s9"></a>**[S9]** [现有 E2E 脚本](../packages/dsh-pm-tool/scripts/e2e.mjs)；[A6 隔离启动脚本](all-pending-evidence-20261021/A6/execution-scripts/pmtool-a6-start-host-20261021.mjs)：仅参考隔离 root/精确 PID 记录，不执行。
- <a id="s10"></a>**[S10]** 上游只读：[credentials-local 源码](file:///Users/bytedance/Projects/dsh-pm/deepseek-harness/packages/credentials/credentials-local/src/index.ts)：环境/home/cwd fallback；未读任何实际凭据文件。
- <a id="s11"></a>**[S11]** [副驾完整行为](../packages/dsh-pm-tool/src/client/shared/drawers/sidecar-portal.tsx)：`send`/`runApply`/`runUndo`/cancel 与 tabs；[lane](../packages/dsh-pm-tool/src/client/shared/drawers/model-lane.tsx)；[面板](../packages/dsh-pm-tool/src/client/panel.tsx) L1457-L1500，仅 tasks 构造 baselineMap。
- <a id="s12"></a>**[S12]** 上游只读：[pi-ai finish/error 映射](file:///Users/bytedance/Projects/dsh-pm/deepseek-harness/packages/llm/llm-pi-ai/src/stream.ts) L42-L70；[verify-ai-client](../packages/dsh-pm-tool/scripts/verify-ai-client.mjs) 是 mock 对象离线测试，不代替实际 adapter。
- <a id="s13"></a>**[S13]** [remaining 治理原用例](../docs/testing/remaining-governance-cases-20261021.md)、原 handoff；当前 `commands/{task,capture,session,metric,reflect,check,queue,export,okr,lesson,review,archive,habit}.ts` 的 help/handler；[周期占位](../packages/dsh-pm-tool/src/core/cycle-hooks.ts)。只读引用，不修改专家用例。

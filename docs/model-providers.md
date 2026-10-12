# 模型接入通道 model-providers.md

> **本文件记录什么 / 给谁用 / 怎么用**：本文件记录 pm-tool 运行时（dsh / DeepSeek Harness）**如何接入第三方 / OpenAI 兼容大模型**——当前启用了哪条零成本通道、密钥放哪、如何开通验证，以及哪些官方厂商端点是「预留但不启用」的模板。给**项目所有者（史冰冰）**在需要开通/更换模型时照抄命令，也给**后续接手的编码 Agent**理解通道结构、避免把密钥写进仓库、升级上游时复查配置。本文不涉及任何具体 AI 业务功能（智能 WBS / 纪要 / 周报仍暂缓），只做「模型通道」这一层。
>
> 运行环境（下文命令默认）：macOS + zsh + nvm Node v22.23.3 + pnpm 11.28.5；每条非交互命令前先 `export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 22 >/dev/null`。

---

## 双车道（ADL-044，2026-10-11）

pm-tool 的 AI 生成功能（智能 WBS / 汇报叙述 / 纪要归纳）现按**当前车道**选路，默认 `poc`。

| 车道 | provider | 默认模型 | Key | 用途红线 |
|---|---|---|---|---|
| `poc`（默认） | `our-free-model`（第三方插件 dsh-our-free-model v2.1.0，clone 于 `~/Projects/dsh-pm/dsh-our-free-model`，commit 7e3a1da） | `kilo-auto/free`（Kilo 免费自动路由；2026-10-11 实测免 Key 一次成功，~5.6s 返回正文） | 免 | **仅概念验证/界面原型/需求推演**；公共网关可能记录内容，**不得用于核心代码合并、生产提交** |
| `prod` | 优先 `deepseek-official`（base 内置），其次 `kimi-official`（baseURL https://api.moonshot.cn/v1） | deepseek-chat / kimi-k2-0905-preview | 需 `DEEPSEEK_API_KEY` / `KIMI_API_KEY` | 生产开发；**未给 Key 时给中文引导，不回退免费车道** |

- 切换：`/pm model mode poc` ｜ `/pm model mode prod` ｜ `/pm model status`（不回显明文 Key）。Web：AI 助手抽屉顶部分段开关。
- 模式持久化在 pmtool checks 表（`aiModelMode`），默认 poc。
- 插件安装：`dsh plugin --profile pm add ~/Projects/dsh-pm/dsh-our-free-model`；**不要再在 cordis.patch.yml 加该插件条目**（重复 loader id 会报错）。llm-pi-ai 只追加了 `kimi-official`；`deepseek-official` 由 base 内置，重复声明会启动报 "already declared"。
- 生产 Key 待所有者提供：配置到启动 dsh 的进程环境（如 `~/.zshrc`，不入库），重启 dsh 后 `/pm model status` 显示就绪。

---

## 0. 一句话工作原理

pm-tool 的核心台账（项目/任务/里程碑/风险/纪要/汇报/交付物）**始终离线、不依赖任何模型**。要接第三方模型，走的是 dsh 自带的 `@deepseek-ai/dsh-llm-pi-ai` 适配器（通过它的 `providers` 字典声明网关端点与模型），**而不是**去改 `DEEPSEEK_BASE_URL`——后者是 dsh 内置 DeepSeek 官方直连适配器（`dsh-llm-deepseek`，走 `anthropic-messages` 协议）专用的，二者路由名不冲突、可同时存在。pi-ai 适配器对「目录不认识的自建网关」要求同时给出 `api`（协议）、`baseURL`、非空 `models` 列表与 `apiKeyEnv`（密钥引用）。**本地/无密码服务（如 Ollama）也必须给一个占位 key**，因为 pi-ai 的 OpenAI 兼容实现坚持要 key 或 `Authorization` 头。

> 权威字段定义以源码为准（本文件据此整理，不臆造）：
> - 配置结构与字段表：`~/Projects/dsh-pm/deepseek-harness/packages/llm/llm-pi-ai/README.zh.md`
> - 字段 schema：`packages/llm/llm-pi-ai/src/config.ts`（`Config.providers` 为「以路由名为键的字典」；每条 provider 的字段 `apiKeyEnv/displayName/api/baseURL/models[]/modelOverrides/compat/defaultContextWindow/defaultMaxTokens/headers/reasoning/retryPolicy/...`）
> - 协议枚举：`packages/llm/llm-pi-ai/src/provider.ts` 的 `PROTOCOLS`——仅 `openai-completions` / `openai-responses` / `anthropic-messages` 三种可手写声明
> - 密钥解析：`packages/llm/llm-pi-ai/src/auth.ts`——`apiKeyEnv` 先查 dsh 凭据存储记录，查不到再回落到**启动进程环境变量**；**dsh 不自动加载 `.env` 文件**（上游无 dotenv 依赖）
> - 穷尽式字段真源（生成产物）：`deepseek-harness/docs/config-catalog.zh.md#deepseek-aidsh-llm-pi-ai`

---

## 1. 当前已启用：OpenRouter 免费自动路由（零成本、尽力而为）

### 1.1 通道事实（2026-10-11 经公开端点实测，数值可能随 OpenRouter 调整）

| 项 | 值 | 来源 |
|---|---|---|
| 路由名（本仓库侧） | `openrouter-free`（自起名，非 OpenRouter 目录 provider） | 本机 `cordis.patch.yml` |
| 实际模型 slug | `openrouter/free`（OpenRouter 官方「Free Models Router」） | `GET https://openrouter.ai/api/v1/models` 实测返回，name=「Free Models Router」、context_length=200000、prompt/completion 单价均为 `$0` |
| 协议 `api` | `openai-completions` | OpenRouter 提供 OpenAI 兼容端点 |
| `baseURL` | `https://openrouter.ai/api/v1` | OpenRouter 官方文档 |
| 鉴权头 | `Authorization: Bearer $OPENROUTER_API_KEY`（可选加 `HTTP-Referer` / `X-Title`，非必须） | OpenRouter 官方文档 |
| 免费档限额 | **20 次/分钟**；充值不足 $10 时 **50 次/天**，累计充值 ≥$10 后升到 1000 次/天 | https://openrouter.ai/docs/api-reference/limits （**会变动，以官网为准**） |
| 是否免绑卡 | 注册即用免费 key，免费模型不扣费 | OpenRouter Keys 页 |

> ⚠️ **能力边界（务必知晓）**：`openrouter/free` 由 OpenRouter **在免费模型池里自动分配**一个免费模型，具体每次落到哪个模型不确定。**纯文字生成（问一句答一句）可用、够用**；但要用它**稳定驱动 agent 的工具调用（function calling）不保证**——不同免费模型工具调用能力参差。因此本项目对它的定位是「**尽力而为的文本生成通道**」：核心台账永远离线、不依赖它；未来智能 WBS/纪要/周报接它时按「能跑就跑、失败优雅降级」设计，不把核心流程押在免费随机模型上。

### 1.2 已写入本机 profile 的配置（仓库外，不入库）

这条 provider 已经合并进 **`~/.dsh/profiles/pm/cordis.patch.yml`**（在原有 `storage-json`、`ui-settings-general` 之外**追加**，未覆盖原有条目；改动前已备份为同目录 `cordis.patch.yml.bak-before-openrouter`）。**`@deepseek-ai/dsh-llm-pi-ai` 无需额外安装**——它已随 base bundle 装载（`id: llm-pi-ai`），原本「零路由休眠」，本配置只是给它补上 `providers`。等价的 patch 片段如下（供他机复现 / 排错对照）：

```yaml
# 在 ~/.dsh/profiles/pm/cordis.patch.yml 中（按 id 整体替换 llm-pi-ai 的 config）
- id: llm-pi-ai
  name: '@deepseek-ai/dsh-llm-pi-ai'
  config:
    providers:
      openrouter-free:
        displayName: OpenRouter 免费自动路由
        apiKeyEnv: OPENROUTER_API_KEY      # 只引用环境变量名，绝不写真实 key
        api: openai-completions
        baseURL: https://openrouter.ai/api/v1
        models:
          - id: openrouter/free
            name: Free Models Router
            contextWindow: 200000          # 实测目录值；免费随机模型更小可再调小
```

> 该条目按 id 匹配到 base bundle 已装载的 `llm-pi-ai` 并**整体替换其 config**（app boot 不做深度合并）。组合后可用 `DSH_HOME=~/.dsh pnpm dsh --profile pm --dump-config`（在上游目录 `~/Projects/dsh-pm/deepseek-harness` 跑）看到 `providers.openrouter-free`。

### 1.3 密钥放哪（关键：key 绝不入库）

- **从哪取 key**：浏览器打开 https://openrouter.ai → 注册 → 右上头像 → **Keys** → **Create Key**，复制 `sk-or-v1-...`。免费档无需绑卡。
- **放哪**：只放**进程环境变量 / 仓库外**。dsh **不会自动读 `.env`**，所以二选一：
  1. **临时（当前终端）**：启动 dsh 前在同一个 shell 里 `export OPENROUTER_API_KEY='sk-or-v1-...'`，再 `pnpm dsh --profile pm --no-open`。关掉终端即失效。
  2. **长期（用户全局，由你自己决定）**：把 `export OPENROUTER_API_KEY='sk-or-v1-...'` 写进你自己的 `~/.zshrc`。
     > ⚠️ 这条要**你本人**来做，Agent 不会代改 `~/.zshrc`（属全局/系统配置红线）。加完后 `source ~/.zshrc` 或重开终端生效。
- **禁止**：把真实 key 写进本仓库任何文件、写进 `cordis.patch.yml`、写进 git。`.gitignore` 已覆盖密钥与 `data/`、`node_modules/`、构建产物。

---

## 2. 预留但不启用：其他官方厂商端点模板

> 以下全部是**预留位，当前一律不启用**（在 `cordis.patch.yml` 里以注释形式保存）。将来要改用某家时：把对应片段**取消注释、填好环境变量名与 model id、按需调整 contextWindow**，重启 dsh 即可；同时建议把第 1 节的 `openrouter-free` 整段注释掉，避免两个路由并列造成选择困惑。每个片段都给了 `api` 协议、`baseURL`、示例 model、`apiKeyEnv` 环境变量名，以及注册/实名/付费备注。

```yaml
# ============ 预留模板（默认全部注释掉，按需取消其一）============
# - id: llm-pi-ai
#   name: '@deepseek-ai/dsh-llm-pi-ai'
#   config:
#     providers:
#
#       # —— DeepSeek 官方（OpenAI 兼容端点；付费）——
#       # 注意：这与 dsh 内置 deepseek-official（走 anthropic-messages）是两条不同路由，可并存。
#       # 注册/实名：platform.deepseek.com → API Keys；按量付费。
#       # deepseek-official:
#       #   displayName: DeepSeek 官方(OpenAI兼容)
#       #   apiKeyEnv: DEEPSEEK_API_KEY
#       #   api: openai-completions
#       #   baseURL: https://api.deepseek.com/v1
#       #   models:
#       #     - id: deepseek-chat
#       #       name: DeepSeek V3 (chat)
#       #       contextWindow: 64000
#
#       # —— OpenAI 官方（付费）——
#       # platform.openai.com → API keys；按量付费。
#       # openai-official:
#       #   displayName: OpenAI 官方
#       #   apiKeyEnv: OPENAI_API_KEY
#       #   api: openai-completions        # 也可用 openai-responses
#       #   baseURL: https://api.openai.com/v1
#       #   models:
#       #     - id: gpt-4o-mini
#       #       contextWindow: 128000
#
#       # —— Anthropic 官方（付费；必须用 anthropic-messages 协议）——
#       # console.anthropic.com → API keys；按量付费。
#       # anthropic-official:
#       #   displayName: Anthropic 官方
#       #   apiKeyEnv: ANTHROPIC_API_KEY
#       #   api: anthropic-messages
#       #   baseURL: https://api.anthropic.com/v1
#       #   models:
#       #     - id: claude-sonnet-4-5
#       #       contextWindow: 200000
#
#       # —— Google Gemini（OpenAI 兼容端点；有免费额度）——
#       # aistudio.google.com → API key。
#       # gemini:
#       #   displayName: Google Gemini
#       #   apiKeyEnv: GEMINI_API_KEY
#       #   api: openai-completions
#       #   baseURL: https://generativelanguage.googleapis.com/v1beta/openai/
#       #   models:
#       #     - id: gemini-2.0-flash
#       #       contextWindow: 1000000
#
#       # —— Groq（OpenAI 兼容；有免费额度，速度快）——
#       # console.groq.com → API keys。
#       # groq:
#       #   displayName: Groq
#       #   apiKeyEnv: GROQ_API_KEY
#       #   api: openai-completions
#       #   baseURL: https://api.groq.com/openai/v1
#       #   models:
#       #     - id: llama-3.3-70b-versatile
#       #       contextWindow: 128000
#
#       # —— 硅基流动 SiliconFlow（OpenAI 兼容；有免费模型）——
#       # siliconflow.cn → 控制台 → API 密钥。
#       # siliconflow:
#       #   displayName: 硅基流动
#       #   apiKeyEnv: SILICONFLOW_API_KEY
#       #   api: openai-completions
#       #   baseURL: https://api.siliconflow.cn/v1
#       #   models:
#       #     - id: Qwen/Qwen2.5-7B-Instruct
#       #       contextWindow: 32768
#
#       # —— 智谱 GLM（OpenAI 兼容；glm-4-flash 免费）——
#       # open.bigmodel.cn → API 管理。
#       # zhipu-glm:
#       #   displayName: 智谱 GLM
#       #   apiKeyEnv: ZHIPU_API_KEY
#       #   api: openai-completions
#       #   baseURL: https://open.bigmodel.cn/api/paas/v4
#       #   models:
#       #     - id: glm-4-flash
#       #       contextWindow: 128000
#
#       # —— 阿里云百炼 DashScope（OpenAI 兼容模式）——
#       # bailian.console.aliyun.com → API-KEY；需开通。
#       # dashscope:
#       #   displayName: 阿里百炼
#       #   apiKeyEnv: DASHSCOPE_API_KEY
#       #   api: openai-completions
#       #   baseURL: https://dashscope.aliyuncs.com/compatible-mode/v1
#       #   models:
#       #     - id: qwen-turbo
#       #       contextWindow: 128000
#
#       # —— 本地 Ollama（完全离线、免费；需先 pull 模型）——
#       # 先 `ollama pull qwen2.5:7b`；本地无密码，按 README 必须给占位 key。
#       # ollama-local:
#       #   displayName: 本地 Ollama
#       #   apiKeyEnv: OLLAMA_API_KEY          # 值给任意占位串，如 `export OLLAMA_API_KEY=ollama`
#       #   api: openai-completions
#       #   baseURL: http://127.0.0.1:11434/v1
#       #   models:
#       #     - id: qwen2.5:7b
#       #       contextWindow: 32768
```

---

## 3. 切换 / 停用 / 升级复查

- **临时停用 OpenRouter**：把 `~/.dsh/profiles/pm/cordis.patch.yml` 里 `- id: llm-pi-ai` 整段删除或注释，重启 dsh 即回到「离线、无模型」状态（核心台账不受影响）。
- **换厂商**：取消第 2 节某模板注释、填好 `apiKeyEnv` 指向的环境变量、（若该目录不认识）确认 `api/baseURL/models` 齐全，重启 dsh。
- **升级上游 dsh 时的复查点**（呼应 ADL-034）：
  1. `llm-pi-ai` 的 `compat` 开关集合与 config schema 是**漂移门禁钉在 pi-ai 类型上**的，上游升级可能新增/改名字段——先看 `src/config.ts`、`src/catalog.ts` 与 `docs/config-catalog.zh.md` 是否有字段变动；
  2. `api` 协议枚举（`src/provider.ts`）是否仍是三种；
  3. 升级后跑一次 `--dump-config` 确认 `openrouter-free` 仍出现、无 `PiAiCatalogError`；
  4. pi-ai 的工具调用参数流补丁（`patches/@earendil-works__pi-ai@1.0.2.patch`）升级后需重新应用/撤销。

---

## 4. 开通并验证（所有者操作，约 3 分钟）

1. **拿 key**：https://openrouter.ai 注册 → Keys → Create Key，复制 `sk-or-v1-...`。
2. **设环境变量**（二选一）：
   - 临时：`export OPENROUTER_API_KEY='sk-or-v1-...'`（在启动 dsh 的同一个终端）。
   - 长期：自行把上行写进 `~/.zshrc` 并 `source ~/.zshrc`（Agent 不代改）。
3. **启动并选用模型**：
   ```sh
   export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 22 >/dev/null
   cd ~/Projects/dsh-pm/deepseek-harness
   DSH_HOME=~/.dsh pnpm dsh --profile pm --no-open     # 打开终端打印的带 token 的 http://127.0.0.1:<port>
   ```
   浏览器打开后：**设置 → 模型**里应能看到 `openrouter-free` / `openrouter/free`，选中它，在对话里发一句「你好」做真实对话测试。

### 4.1 不依赖 dsh 的直连自检 curl（判断 key / 网络是否通）

在**已 `export OPENROUTER_API_KEY=...`** 的终端跑：

```sh
# ① key 有效性与余额/限额（GET /key，需鉴权）
curl https://openrouter.ai/api/v1/key \
  -H "Authorization: Bearer $OPENROUTER_API_KEY"

# ② 真实对话：用免费自动路由发一句话
curl -X POST https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openrouter/free",
    "messages": [{"role":"user","content":"用一句话回答：你好"}]
  }'
```

**预期判读（已实测，2026-10-11）**：
- **未设置 key**：直连会返回 **401 Unauthorized**——这是预期，说明端点与网络通、只是缺 key。
- **设置 key 后（本项目现状）**：`/key` 返回账户限额 JSON；本项目实测 `is_free_tier: true`、`free_model_daily_requests.limit = 50`。`/chat/completions`（`model=openrouter/free`）返回一段模型回复，**具体模型由免费池随机分配**（实测两次分别随机到 `liquid/lfm-2.5-2.6b:free` 与 `nvidia/nemotron-3-ultra-550b-a55b:free`），两次均 `cost=$0`、`finish_reason=stop`。
- **当前状态（2026-10-11，全部打通）**：key 已由所有者配置在其本机 `~/.zshrc`（`export OPENROUTER_API_KEY=...`，仓库外、不入库；改前已备份 `~/.zshrc.bak-20261011-130537`），**openrouter/free 直连已实测成功**，**dsh 应用内对话也已实测通过**：在 Web 底部模型选择器选 **Free Models Router**（openrouter-free / openrouter/free）发「你好，用一句话介绍你自己」，第 1 次即成功（助手正常回复、状态「已完成」、无 MISSING_CREDENTIAL/401/429）。至此模型通道（配置 + 直连 + 应用内）全部打通；**下一步仅待所有者决定是否立项做生成型功能（智能 WBS/纪要/周报）**。
- **经验（推理型免费模型）**：随机分到的若为推理型模型，会先把 `max_tokens` 预算**全部计入 `reasoning_tokens`**，导致正文为空。**务必把 `max_tokens` 给足（建议 ≥400）**，正文才留得下空间。稳定工具调用仍不保证（ADL-035 口径）。

### 4.2 故障排查：应用内报 `MISSING_CREDENTIAL` / “OPENROUTER_API_KEY which is not set”

- **现象**：网页选 Free Models Router 发消息，报错 `llm-pi-ai: no credential for provider route "openrouter-free"; its profile resolves OPENROUTER_API_KEY, which is not set`（错误码 `MISSING_CREDENTIAL`）。但 key 本身有效、直连 curl 能成功。
- **根因**：dsh 的 `apiKeyEnv` 读的是**启动该 dsh 进程时的进程环境变量**（见 KB-033）。若 dsh 是在「往 `~/.zshrc` 写入 key **之前**就开着的旧终端」里启动的，进程环境里根本没有 `OPENROUTER_API_KEY`，与 shell 后来加载与否无关。
- **诊断**（把 `<dsh pid>` 换成实际进程号）：
  ```sh
  ps eww -p <dsh pid> | tr ' ' '\n' | grep OPENROUTER_API_KEY   # 无输出=旧进程没继承到该变量
  ```
- **解法（二选一）**：
  1. **重启到新环境**：停掉旧 dsh，用已 `source ~/.zshrc`（能 `echo $OPENROUTER_API_KEY` 看到值）的**全新终端**重启 dsh（等价 `pnpm dsh --profile pm`）。
  2. **永久且与启动终端无关（推荐）**：在 dsh Web「**设置 → 模型（Models）**」页直接为该 provider 录入密钥——写入 dsh **credentials service**（正是上面报错提示的目标），此后任何终端启动的 dsh 都能取到，不必依赖 shell 环境。

## PoC 车道说明（v0.4.1）
- 默认 PoC provider=our-free-model / model=kilo-auto/free（随机路由，偶有思考耗尽正文空）。
- 已实现按任务类型候选降级链（结构化任务给足预算/低思考）；免费池固有波动，成功率实测见 verify-model-route。
- 官方 Key 暂不配置；生产无 Key → PROD_KEY_MISSING 文案，不回退、不静默用免费池。
- DSH_PM_E2E=1 时 ask-fixture 测试缝可用（不调模型，固定诊断+动作，仍走同 parse/validate/ask-apply 写路径）。

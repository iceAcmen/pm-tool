# 个人开发者付费方案 personal-billing-plan.md

> **本文件记录什么 / 给谁用 / 怎么用**：当所有者（史冰冰）**离开字节、不再有豆包工作企业版内部套餐**，需要以**个人开发者身份**同时做两件事——① 用 AI 写代码（维护 pm-tool 及其他个人项目）；② 让 pm-tool 这套自建应用继续跑 AI 功能（智能 WBS / 副驾 / 会议纪要 / 周报等）。本文件给出**最省钱且合规**的付费组合、申请入口、三个 Key 分别填在哪、dsh 配置片段、防封号红线与离职切换清单，照着抄即可。
>
> 与本文配套的技术文档：`docs/model-providers.md`（讲 dsh 如何配置 provider 的机制细节）。本文只管「**个人买什么、多少钱、怎么配、别踩什么坑**」。
>
> 价格与条款更新时间：**2026-10-17**（来自方舟 / DeepSeek 官方文档）；订阅价格、模型 ID、活动政策可能调整，下单前以官方页面为准。

---

## 0. 一句话结论

**没有「一份便宜订阅同时全包」的方案**——Coding Plan 官方明确禁止把额度导出给自建应用。所以必须分三条通道，个人月成本约 **¥43**：

| 通道 | 服务 | 解决什么 | 计费 | 月成本 |
|---|---|---|---|---:|
| ① 日常开发 | **方舟 Coding Plan（Lite）** | 在 Claude Code 等编程工具里写代码 | 订阅包月 | **¥40** |
| ② pm-tool 的 AI | **方舟标准 API（DeepSeek）** | 自建应用里的 AI 生成 | 按 token 后付费 | **约 ¥3** |
| ③ 敏感数据兜底 | **本地 Ollama** | 涉密/隐私内容、断网、省钱 | 免费（本地算力） | **¥0** |
| | | | **合计** | **约 ¥43/月** |

> 首月更便宜：方舟 Coding Plan 新用户首月 **¥9.9**（首两月活动，见第 6 节）。

---

## 1. 为什么不能只用一个 Coding Plan（核心决策点）

这是整个方案的关键，方舟官方条款写得非常明确：

- **"套餐额度仅在 AI 编程工具中生效，不可用于 API 调用。"**
- **"在非 AI 编程工具中使用方舟 Coding Plan 对应的 Base URL 和 API Key，有可能被识别为滥用/违规，导致订阅停用或账号封禁。"**

两条通道的边界：

| 你的行为 | 属于哪类 | 能不能用 Coding Plan |
|---|---|---|
| 在 Claude Code / Cursor / Cline 里写代码 | AI 编程工具内调用 | ✅ 可以 |
| pm-tool 里点「生成 WBS / 副驾 / 纪要」 | 第三方自建应用的 API 调用 | ❌ 不可以，踩红线 |

pm-tool 是 dsh（DeepSeek Harness）里的**自建应用**，它的 AI 调用正好属于「API 调用 / 非 AI 编程工具」。把 Coding Plan 的 Key 配进 pm-tool = 官方定义的滥用，可能直接**停用订阅甚至封号**。

所以结论是：**日常开发用订阅（便宜），自建应用按量（用量极小，几乎不花钱），两条通道的 Key 不能混用。**

---

## 2. 通道一：方舟 Coding Plan（日常开发，¥40/月）

### 2.1 是什么

火山引擎（火山方舟）对外公开售卖的编码订阅，一个套餐聚合多家主流模型，可在编程工具里自由切换：

- **模型**：Doubao Seed 系列（含 Seed-Evolving / 2.1 / 2.0）、GLM 系列、DeepSeek 系列（V4-Pro / V4-Flash / V4.1-Flash）、Kimi 系列、MiniMax 系列等，还含 Embedding 向量化模型。
- **编程工具**：Claude Code、Cursor、Cline、Roo Code、Kilo Code、OpenCode、TraeCode、Codex CLI 等。
- **特点**：套餐额度在所有支持的工具间共享；高峰期多租户隔离、平稳降速。
- **离职后可用性**：这是**对外公开商品**，个人手机号注册、个人微信/支付宝即可购买，**不依赖字节员工身份**。

### 2.2 套餐与价格

| 套餐 | 适用 | 月价 | 新用户首月 | 用量（以 Doubao Seed Lite、Claude Code 普通模式估算） |
|---|---|---:|---:|---|
| **Lite** | 中等强度，适合大多数人 | **¥40** | **¥9.9** | 每 5 小时约 1,200 次请求；每周约 9,000；每订阅月约 18,000 |
| Pro | 复杂/高强度项目 | ¥200 | ¥49.9 | Lite 的 5 倍（每 5 小时约 6,000，每月约 90,000） |

- 额度按 **5 小时窗口 / 周 / 月** 三层限流，**耗尽后不扣账户余额**，等下一周期自动恢复（5 小时窗口按首次请求滚动；每周一 00:00 重置；每月 1 日 00:00 重置）。
- 个人开发者 **Lite 足够**；Pro 适合开 Agent Team 多任务并发的重度场景。

### 2.3 申请与配置（Claude Code 为例）

1. **注册**：打开火山方舟（console.volcengine.com/ark）→ 个人手机号注册 → 完成**个人实名认证**（个人主体即可）。
2. **购买**：进入「Coding Plan 活动页 / 开通管理」→ 订阅 **Lite（首月 9.9）**。购买即开通，**无需**单独创建模型/推理接入点。
3. **在 Claude Code 接入**（Coding Plan 专用 Base URL，注意和标准 API 地址不同）：
   - Anthropic 协议（Claude Code 用）：`https://ark.cn-beijing.volces.com/api/coding`
   - OpenAI 协议（Cursor / Cline / OpenCode 用）：`https://ark.cn-beijing.volces.com/api/coding/v3`
   - 环境变量（写进你自己的 `~/.zshrc`，仓库外）：
     ```sh
     export ANTHROPIC_BASE_URL='https://ark.cn-beijing.volces.com/api/coding'
     export ANTHROPIC_AUTH_TOKEN='<方舟 Coding Plan 的 API Key>'
     export ANTHROPIC_MODEL='doubao-seed-evolving'   # 或 deepseek-v4.1-flash 等，可在工具里切换
     ```
   - ⚠️ 不要用 `https://ark.cn-beijing.volces.com/api/v3`（那是标准 API 地址，不会消耗套餐额度，会产生额外按量费用）。
4. 模型选择建议：日常用 **doubao-seed-2.1-lite / deepseek-v4.1-flash**（快、省额度）；重难点问题再切 **glm-5.3 / deepseek-v4-pro / kimi-k3**（抵扣系数高、额度消耗快）。

---

## 3. 通道二：方舟标准 API（pm-tool 自建应用，约 ¥3/月）

### 3.1 为什么选它

pm-tool 是自建应用，必须走**标准 API 按量付费**。选择方舟标准 API 而非 DeepSeek 官方的理由：

- **价格与 DeepSeek 官方完全一致**（分毫不差，见 3.2），没有加价；
- **同一个火山账号**：Coding Plan、标准 API、发票、用量全在一起，不用再单独注册 DeepSeek、单独充值，最省心。
- DeepSeek 官方的优势仅在「新版本首发、并发配额更高（Flash 官方 2500）」，个人 pm-tool 用量下无感。

### 3.2 价格表（方舟标准 API = DeepSeek 官方，元/百万 token）

峰谷计费：高峰 = 北京时间周一至周五（不含法定节假日）9:00–12:00、14:00–18:00；空闲 = 其余时段（含周末/法定节假日全天），空闲价为高峰一半。

| 模型 | 输入·缓存命中（空/高） | 输入·缓存未命中（空/高） | 输出（空/高） |
|---|---|---|---|
| **DeepSeek-V4.1-Flash**（推荐） | 0.02 / 0.04 | **1 / 2** | **4 / 8** |
| DeepSeek-V4-Pro | 0.15 / 0.30 | 4.5 / 9 | 13.5 / 27 |

> 上下文 1M、输出最大 384K；默认开思考、可手动关闭。模型支持自动前缀缓存（命中后输入极便宜）。

### 3.3 开通与接入

1. 同一个火山账号，在方舟控制台开通**在线推理（标准 API）后付费**，创建 API Key（环境变量名 `ARK_API_KEY`）。
2. 标准 API 端点（OpenAI 兼容）：
   - Base URL：`https://ark.cn-beijing.volces.com/api/v3`
   - 鉴权：`Authorization: Bearer $ARK_API_KEY`
   - **支持 Model ID 直调**（无需创建推理接入点），`model` 字段填模型 ID，如 `deepseek-v4-1-flash`（以控制台「模型列表」实际 Model ID 为准）。
3. 直连自检 curl：
   ```sh
   curl -X POST https://ark.cn-beijing.volces.com/api/v3/chat/completions \
     -H "Authorization: Bearer $ARK_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"model":"deepseek-v4-1-flash","messages":[{"role":"user","content":"用一句话回答：你好"}]}'
   ```

### 3.4 dsh 里的 provider 配置

在 `~/.dsh/profiles/pm/cordis.patch.yml` 给 `llm-pi-ai` 追加 provider（**只写环境变量名，不写明文 Key**）。机制细节见 `docs/model-providers.md`：

```yaml
- id: llm-pi-ai
  name: '@deepseek-ai/dsh-llm-pi-ai'
  config:
    providers:
      ark-standard:
        displayName: 方舟标准 API
        apiKeyEnv: ARK_API_KEY
        api: openai-completions
        baseURL: https://ark.cn-beijing.volces.com/api/v3
        models:
          - id: deepseek-v4-1-flash
            name: DeepSeek V4.1 Flash
            contextWindow: 1024000
          - id: deepseek-v4-pro
            name: DeepSeek V4 Pro
            contextWindow: 1024000
```

### 3.5 成本为什么只要 ¥3

pm-tool 的 AI 是**非实时、一次性文本生成**，且大量复用系统提示/模板（自动命中前缀缓存）。按一组保守假设估算：

- 每月约 150 次生成，每次输入约 12k（其中 80% 缓存命中）、输出约 2k，按高峰价保守算：
  - 输入未命中 2.4k × 2 元/百万 ≈ 0.0048 元；输入命中 9.6k × 0.04 ≈ 0.0004 元；输出 2k × 8 元/百万 ≈ 0.016 元
  - 每次约 **0.021 元**，150 次 ≈ **¥3.2/月**
- 若大量在空闲时段（周末/晚上）使用，成本再减半，约 ¥1.5–2/月。
- 以上为**假设口径估算**，实际以方舟账单为准；即便用量翻倍也在 ¥10 以内。

---

## 4. 通道三：本地 Ollama（敏感数据兜底，免费）

涉密项目台账、客户信息、隐私内容，或想彻底免费、断网可用时，用本地模型。你有 M 系列 Mac，可本地跑。

1. 安装：`brew install ollama`（或官网下载），启动后 `ollama pull qwen3:8b`（中文/通用均衡；轻量可选 `qwen3:4b`，代码可选 `qwen2.5-coder:7b`）。
2. dsh provider 配置（本地无密码，但 pi-ai 要求**给一个占位 Key**）：
   ```yaml
       ollama-local:
         displayName: 本地 Ollama
         apiKeyEnv: OLLAMA_API_KEY          # 值给任意占位串，如 export OLLAMA_API_KEY='ollama'
         api: openai-completions
         baseURL: http://127.0.0.1:11434/v1
         models:
           - id: qwen3:8b
             name: Qwen3 8B 本地
             contextWindow: 32768
   ```
3. 定位：**兜底而非主力**——本地小模型能力不及云端大模型，复杂结构化生成可能失败，失败时优雅降级，核心台账永远离线不受影响。

---

## 5. 三个 Key 分别填在哪（速查表）

| Key | 通道 | 用在哪 | 怎么填 |
|---|---|---|---|
| **方舟 Coding Plan Key** | ① 日常开发 | Claude Code / Cursor 等 | `ANTHROPIC_BASE_URL=.../api/coding`、`ANTHROPIC_AUTH_TOKEN=Key`（写 `~/.zshrc`） |
| **`ARK_API_KEY`（标准 API）** | ② pm-tool | dsh provider `ark-standard` | dsh Web「设置→模型」录入 credentials，或 `export ARK_API_KEY=...`；provider 指向 `/api/v3` |
| **`OLLAMA_API_KEY`（占位）** | ③ 本地兜底 | dsh provider `ollama-local` | `export OLLAMA_API_KEY='ollama'`，值任意 |

> Key 录入方式（二选一）：① 环境变量（dsh 不自动读 `.env`，需写 `~/.zshrc` 并在启动 dsh 前生效）；② 更推荐在 dsh Web「设置 → 模型」直接录入 **credentials service**，此后任何终端启动都能取到，与启动终端无关。

---

## 6. 首月选型实测（花 ¥9.9 横向选模型）

新用户首月 9.9，建议先做一次低成本横向选型，再决定长期主力：

1. 订阅 Lite 首月，在 Claude Code 里用同一组真实任务（写功能、改 bug、读长代码库）分别测：**doubao-seed-evolving、deepseek-v4.1-flash、glm-5.3、kimi-k3、minimax-m3**。
2. 对比：代码正确率、长上下文跟随、速度、额度消耗（抵扣系数）。
3. 确定 1 个日常主力 + 1 个攻坚备用；之后按需在工具里切换。
4. 注意：**一个实名认证主体只能享受一次首购优惠**（该主体下任一账号用过即失效）。

---

## 7. 红线与防封号清单（务必遵守）

- [ ] **绝不把 Coding Plan 的 Key 配进 pm-tool / 任何自建应用或第三方 API** —— 官方定义为滥用，会停用/封号。
- [ ] **不碰官方 Claude（Anthropic）**：官方条款不覆盖中国大陆，2026 年封号大幅加码（网页 / Claude Code / 官方 API / 云厂商转售全渠道均有风险，账号与订阅都可能无预警封禁，申诉成功率极低）。要用 Claude 体验就用「Claude Code 客户端的壳 + 方舟国产模型的芯」。
- [ ] **真实 Key 绝不入库**：不写进 git、不写进 `cordis.patch.yml` 明文（只用 `apiKeyEnv` 引用环境变量名）、不贴进对话/文档；`.gitignore` 已覆盖密钥。
- [ ] **标准 API「低优（低优先级）」通道别用于实时交互**：价格约为常规一半，但可能排队/延迟，适合离线批处理；pm-tool 交互走常规。
- [ ] **用最新模型**：pm-tool 选 `deepseek-v4-1-flash`（输入 2/输出 8），别用方舟上旧的 `deepseek-v4-flash`（输入 3/输出 9）。
- [ ] **别配错产品**：方舟「AI 数据湖 / LakeAIService」（DeepSeek 输入 12 / 输出 24）是另一个产品，不是标准推理 API，不要把它当标准 API 接入。
- [ ] 升级上游 dsh 后，按 `docs/model-providers.md` 第 3 节复查 provider 配置与字段是否漂移。

---

## 8. 离职切换清单（照此执行）

**离职前（企业版还能用时，提前办好）：**
- [ ] 注册**个人火山引擎账号**（个人手机号 + 个人微信/支付宝，与工作账号完全隔离）
- [ ] 完成个人实名认证
- [ ] 花 ¥9.9 订阅 Coding Plan Lite，完成首月选型（第 6 节）
- [ ] 开通标准 API 后付费，创建 `ARK_API_KEY`
- [ ] 装好本地 Ollama 并 pull 模型
- [ ] 在 dsh 个人 profile 配好 `ark-standard` + `ollama-local`（第 3、4 节），验证三路均可跑通

**离职当天 / 之后：**
- [ ] 确认 dsh / Claude Code 里所有 Key 均来自**个人账号**，移除任何工作账号凭据
- [ ] 日常开发走 Coding Plan，pm-tool 走标准 API，敏感内容走 Ollama
- [ ] 关闭工作账号相关的自动续费 / 授权
- [ ] 每月初看一眼方舟账单与用量，按需调整（用量极小一般无需改）

**月度运维（约 1 分钟）：**
- [ ] 检查 Coding Plan 是否到期、是否需续费（建议开自动续费）
- [ ] 看标准 API 实际花费，确认没有异常用量
- [ ] 确认 Ollama 服务可用（`ollama list`）

---

## 9. 关键链接

| 用途 | 链接 |
|---|---|
| 火山方舟控制台 | https://console.volcengine.com/ark |
| 方舟 Coding Plan 套餐概览 | https://docs.volcengine.com/docs/ark/coding-plan-personal-plan-overview |
| 方舟 Coding Plan 常见问题 | https://ark.volcengine.com/region:cn-beijing/docs/coding-plan-personal-faq |
| 方舟标准 API 快速入门 | https://docs.volcengine.com/docs/ark/quick-start |
| 方舟模型价格（含 DeepSeek） | https://docs.volcengine.com/docs/ark/model-pricing |
| DeepSeek 官方定价 | https://api-docs.deepseek.com/zh-cn/quick_start/pricing |
| 配套技术文档 | 本仓库 `docs/model-providers.md` |

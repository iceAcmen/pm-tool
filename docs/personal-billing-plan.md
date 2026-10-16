# 个人开发者付费方案 personal-billing-plan.md

> **本文件记录什么 / 给谁用 / 怎么用**：当所有者（史冰冰）**离开字节、不再有豆包工作企业版内部套餐**，以**个人开发者身份**做两件事——① 用 AI 写代码（维护 pm-tool 及其他个人项目）；② 让 pm-tool 这套运行在 dsh（DeepSeek Harness）里的应用继续跑 AI 功能（智能 WBS / 副驾 / 会议纪要 / 周报等）。本文件给出**最省钱且合规**的组合、申请入口、Key 填在哪、dsh 接入步骤、防封号红线与离职切换清单。
>
> 与本文配套的技术文档：`docs/model-providers.md`（dsh 配置 provider 的机制细节）。一键脚本：`packages/dsh-pm-tool/scripts/setup-keys.mjs`。
>
> 价格与条款更新时间：**2026-10-17**（来自方舟官方文档）；订阅价格、模型 ID、活动政策可能调整，下单前以官方页面为准。

---

## 0. 一句话结论

**pm-tool 就活在 dsh 里，而方舟官方明确支持 DeepSeek Harness 接入 Coding Plan。** 所以个人单机场景下，一个 Coding Plan 就能同时覆盖"日常开发 + pm-tool 的 AI"，无需为 pm-tool 单独买标准 API：

| 通道 | 服务 | 解决什么 | 计费 | 月成本 |
|---|---|---|---|---:|
| ① dsh 开发 + pm-tool | **方舟 Coding Plan（Lite）** | dsh / Claude Code 写代码；pm-tool 在 dsh 内的 AI | 订阅包月 | **¥40** |
| ② 敏感数据兜底 | **本地 Ollama** | 涉密/隐私内容、断网、额度耗尽 | 免费（本地算力） | **¥0** |
| ③ 标准 API（可选） | **方舟按量后付费** | 仅在独立部署 / 团队协作 / 额度兜底时才需要 | 按 token | 非固定 |
| | | | **个人单机月固定** | **¥40** |

> 首月更便宜：Coding Plan 新用户首月 **¥9.9**（见第 6 节）。

---

## 1. 关键前提：方舟官方支持 DeepSeek Harness 接入 Coding Plan

这是整个方案成立的基础，方舟官方有明确依据：

- 方舟控制台「订阅 → Coding Plan」的「多生态兼容，无缝融入您的工具」里，**DeepSeek Harness 与 Claude Code、Codex、OpenCode、OpenClaw、Hermes Agent 等并列**（dsh 归类为 Agent）；
- 方舟有专门文档 **《DeepSeek Harness 接入 Coding Plan 个人版》**，并提供官方 `ark-plan-api` 插件自动配置；
- 支持模型：Doubao Seed 系列、DeepSeek V4.1-Flash/V4-Pro、GLM-5.3、Kimi K3、MiniMax-M3 等（见第 2 节）。

### 1.1 红线的真实边界：是否"经由官方支持的工具"

FAQ 原文有两句：①「套餐额度仅在支持的 Coding 工具中生效，不能用于 API 调用」；②「在非 AI 工具中使用对应的 Base URL 和 API Key，有可能被识别为滥用/违规，会导致订阅停用或账号封禁」。

这里的"API 调用 / 非 AI 工具"是**特定含义**——指**绕过官方支持的工具、把 Coding Plan 当成通用后端来编程调用**，而不是指"底层走 HTTP"。官方支持的工具（含 dsh）底层也是 HTTP，但属于"在支持的工具内使用"，合规。

| 你的调用方式 | 判定 |
|---|---|
| 在 Claude Code / Cursor / Cline / Codex 等官方支持的编程工具里 | ✅ 合规 |
| 在 **DeepSeek Harness（dsh）** 里（含 dsh 主对话与 dsh 内的插件） | ✅ 合规 |
| **pm-tool（dsh 内插件）** 复用 dsh 的 Coding Plan provider，请求由 dsh 发出 | ✅ 合规 |
| 自己写的独立脚本 / 独立服务，拿 key 直接调 /api/coding | ❌ 违规 |
| 把 key 配进官方未支持的第三方 SaaS / 应用 | ❌ 违规 |
| pm-tool 将来**脱离 dsh 独立部署**、自己持 key 调用 | ❌ 违规（需走标准 API） |

### 1.2 pm-tool 走套餐合规的两个前提

1. 用**官方支持的方式**让 dsh 接入 Coding Plan（第 2 节三种方式任选）；
2. **pm-tool 保持在 dsh 内运行**（当前架构即如此）。一旦脱离 dsh 独立部署，就必须改用标准 API（第 4 节）。

> 说明：条款没有逐字写"dsh 内第三方插件"这一情形。"pm-tool 走 dsh 套餐"是基于「dsh 被官方支持 + pm-tool 在 dsh 内、请求由 dsh 发出」的合理推断；满足上述两个前提即落在官方支持范围内。

---

## 2. 通道一：方舟 Coding Plan（dsh 开发 + pm-tool，¥40/月）

### 2.1 套餐与价格

| 套餐 | 适用 | 月价 | 新用户首月 | 用量（以 Doubao Seed Lite、Claude Code 普通模式估算） |
|---|---|---:|---:|---|
| **Lite** | 中等强度，适合大多数人 | **¥40** | **¥9.9** | 每 5 小时约 1,200 次；每周约 9,000；每订阅月约 18,000 |
| Pro | 复杂/高强度、Agent Team 并发 | ¥200 | ¥49.9 | Lite 的 5 倍（每订阅月约 90,000） |

- 额度按 **5 小时窗口 / 周 / 月** 三层限流；耗尽后**不扣余额**，等周期自动恢复（5 小时窗口按首次请求滚动，每周一/每月 1 日 00:00 重置）。
- 个人开发者 **Lite 足够**，pm-tool 的用量与开发共享同一额度，但 pm-tool 用量很小，基本无感。
- 这是**对外公开商品**，个人手机号注册、个人微信/支付宝即可购买，**不依赖字节员工身份**。

### 2.2 核心参数

- **Base URL**（Coding Plan 专用，注意和标准 API 不同）：
  - 兼容 Anthropic 协议（Claude Code）：`https://ark.cn-beijing.volces.com/api/coding`
  - 兼容 OpenAI 协议（dsh / Cursor / Cline / Codex）：`https://ark.cn-beijing.volces.com/api/coding/v3`
  - ⚠️ **不要用 `https://ark.cn-beijing.volces.com/api/v3`**：那是标准 API，不消耗套餐额度，会额外计费。
- **Model Name**（全小写，或复制开通管理页模型名）：`doubao-seed-evolving`、`doubao-seed-2.1-pro`、`doubao-seed-2.1-lite`、`doubao-seed-2.0-mini`、`deepseek-v4.1-flash`、`deepseek-v4-flash`、`deepseek-v4-pro`、`glm-5.3`（glm-latest）、`glm-5.3-flash`、`kimi-k2.7-code`、`kimi-k2.8-preview`、`kimi-k3`、`minimax-m3`。
- Model Name 不支持填 `Auto`；如需 Auto，用 `ark-code-latest` 在控制台切换（3–5 分钟生效）。

### 2.3 让 dsh 接入 Coding Plan（三种方式，任选其一）

**方式 1：ArkCLI Helper 自动化助手（官方推荐）**
```sh
npm install -g @volcengine/ark-cli@latest
arkcli --version
arkcli auth login            # 选择项目（可默认全部资源）→ 消费模式选 coding-plan
arkcli helper                # Plan profile 选 coding-plan_cn-beijing_personal → 选默认 model → AI Agent 选 DeepSeek Harness
```

**方式 2：dsh Web UI 手动配置**
1. `npx @deepseek-ai/dsh web`，打开 `http://127.0.0.1:3080/`；
2. 左下角「设置 → 模型」，在 DeepSeek 卡片选「自定义设置」：
   - API 密钥：填 Coding Plan 的 API Key；
   - API 地址：`https://ark.cn-beijing.volces.com/api/coding/v3`；
   - 添加模型（如 `deepseek-v4.1-flash`），保存。
3. 或「添加自定义提供方」：协议与地址对应为 `openai-completions`/`openai-responses` → `/api/coding/v3`，`anthropic-messages` → `/api/coding`。
4. 回到对话页，输入框右下角模型下拉选 **Ark Coding Plan** 下的模型即可。

**方式 3：ark-plan-api 官方插件（自动配置）**
在 dsh 对话框直接发送：
```
帮我安装下面的插件：curl -fsSL -o dsh-ark-plugin-install.sh "https://lf3-static.bytednsdoc.com/obj/eden-cn/ylwslo-yrh/ljhwZthlaukjlkulzlp/ark-cli-outer-resource/dsh-ark-plugin-install.sh" && bash dsh-ark-plugin-install.sh --plugin-name ark-plan-api
```
插件装好后，「设置 → 模型」自动添加 Agent Plan / Coding Plan / 后付费 provider，只需填 API Key。

> 也可以直接运行一键脚本完成 provider 配置：`node packages/dsh-pm-tool/scripts/setup-keys.mjs`（见第 5 节）。

### 2.4 模型选择建议

日常用 `doubao-seed-2.1-lite` / `deepseek-v4.1-flash`（快、省额度）；重难点再切 `glm-5.3` / `deepseek-v4-pro` / `kimi-k3`（抵扣系数高、额度消耗快）。

---

## 3. 通道二：本地 Ollama（敏感数据兜底，免费）

涉密台账、客户信息、隐私内容，或断网、套餐额度耗尽时使用。M 系列 Mac 可本地跑。

1. 安装：`brew install ollama`，启动后 `ollama pull qwen3:8b`（轻量 `qwen3:4b`；代码 `qwen2.5-coder:7b`）。
2. dsh provider（本地无密码，但 pi-ai 要求**占位 Key**，值任意，如 `ollama`）：
   ```yaml
       ollama-local:
         displayName: 本地 Ollama
         apiKeyEnv: OLLAMA_API_KEY
         api: openai-completions
         baseURL: http://127.0.0.1:11434/v1
         models:
           - id: qwen3:8b
             name: Qwen3 本地
             contextWindow: 32768
   ```
3. 定位：**兜底而非主力**——本地小模型能力不及云端，复杂生成可能失败，失败时优雅降级，核心台账永远离线。

---

## 4. 通道三：方舟标准 API（可选，按量）

### 4.1 什么时候才需要

- pm-tool **脱离 dsh 独立部署**（独立进程自己持 key）——此时走 Coding Plan 才属违规，必须用标准 API；
- **团队协作**（FAQ 明确：团队协作请用按量 API；Coding Plan 面向个人）；
- Coding Plan 额度耗尽时的**付费兜底**；
- 个人单机在 dsh 内使用时**不需要**，充值少量备用即可。

### 4.2 价格（方舟标准 API = DeepSeek 官方，元/百万 token）

高峰 = 北京时间周一至周五（不含法定节假日）9:00–12:00、14:00–18:00；空闲 = 其余（含周末/节假日全天），空闲为高峰一半。

| 模型 | 输入·缓存命中（空/高） | 输入·缓存未命中（空/高） | 输出（空/高） |
|---|---|---|---|
| DeepSeek-V4.1-Flash | 0.02 / 0.04 | 1 / 2 | 4 / 8 |
| DeepSeek-V4-Pro | 0.15 / 0.30 | 4.5 / 9 | 13.5 / 27 |

- 接入：Base URL `https://ark.cn-beijing.volces.com/api/v3`，环境变量 `ARK_API_KEY`，Model ID 直调（如 `deepseek-v4-1-flash`），无需创建接入点。
- 「低优」通道别用于实时交互（可能排队）；别配错「AI 数据湖」（输入 12/输出 24，另一产品）。

---

## 5. Key 填在哪（速查表）与一键脚本

> **最快方式：一键脚本。** 运行 `node packages/dsh-pm-tool/scripts/setup-keys.mjs`（交互模式），引导你粘贴 Key、选择存储位置、自动备份并幂等写入；先空跑预览加 `--dry-run`，自动化用 `--non-interactive`（Key 从环境变量读）。脚本强制把真实 Key 写在仓库外、`cordis.patch.yml` 只写环境变量名。

| Key | 用途 | 用在哪 | 怎么填 |
|---|---|---|---|
| **`CODING_PLAN_API_KEY`** | 主：dsh 内开发 + pm-tool | dsh provider `ark-plan`（/api/coding/v3） | dsh Web「设置→模型」录入，或 `export CODING_PLAN_API_KEY=...` |
| **`OLLAMA_API_KEY`（占位）** | 本地兜底 | dsh provider `ollama-local` | `export OLLAMA_API_KEY='ollama'`，值任意 |
| **`ARK_API_KEY`（可选）** | 标准 API：独立部署/团队/兜底 | dsh provider `ark-standard`（/api/v3） | 仅在需要时录入 |
| Claude Code 专用（可选） | 用 Claude Code 而非 dsh | `ANTHROPIC_BASE_URL=/api/coding`、`ANTHROPIC_AUTH_TOKEN=Key` | 写 `~/.zshrc` |

> Key 录入二选一：① 环境变量（写 `~/.zshrc`，并在启动 dsh 前生效）；② 推荐 dsh Web「设置→模型」录入 **credentials service**，此后任何终端启动都能取到。

---

## 6. 首月选型实测（¥9.9）

1. 订阅 Lite 首月，在 dsh 用同一组真实任务（写功能、改 bug、读长库）分别测：`doubao-seed-evolving`、`deepseek-v4.1-flash`、`glm-5.3`、`kimi-k3`、`minimax-m3`。
2. 对比代码正确率、长上下文跟随、速度、额度消耗，确定 1 个日常主力 + 1 个攻坚备用。
3. **一个实名认证主体只能享受一次首购优惠**（该主体下任一账号用过即失效）。

---

## 7. 红线与防封号清单

- [ ] 让 dsh 接 Coding Plan 必须走**官方支持方式**（ark-plan-api 插件 / ArkCLI Helper / Web UI 手动填 `/api/coding/v3`）。
- [ ] **不要把 Coding Plan key 拿到 dsh 之外**，配进独立脚本/独立服务/未支持的第三方应用——属滥用，会停用/封号。
- [ ] pm-tool 若**脱离 dsh 独立部署**，改用标准 API（`/api/v3`），不要继续用 Coding Plan key。
- [ ] Base URL 不要填 `/api/v3` 走套餐（会额外计费）；Coding Plan 用 `/api/coding` 或 `/api/coding/v3`。
- [ ] **团队协作**用标准 API，不要多人共用一个 Coding Plan。
- [ ] **不碰官方 Claude（Anthropic）**：官方条款不覆盖中国大陆，2026 年封号大幅加码（网页 / Claude Code / API / 转售全渠道均有风险）。要用 Claude 体验就用"Claude Code 壳 + 方舟国产模型芯"。
- [ ] **真实 Key 绝不入库**：不写 git、不写进 `cordis.patch.yml` 明文（只用 `apiKeyEnv` 引用名）；脚本会强制校验写入路径在仓库外。
- [ ] 用最新模型：选 `deepseek-v4.1-flash`（输入 2/输出 8），别用旧 `deepseek-v4-flash`（输入 3/输出 9）。

---

## 8. 离职切换清单

**离职前（企业版还能用时）：**
- [ ] 注册**个人火山引擎账号**（个人手机号 + 个人微信/支付宝，与工作账号隔离），完成个人实名认证
- [ ] ¥9.9 订阅 Coding Plan Lite，完成首月选型（第 6 节）
- [ ] 用官方方式（或一键脚本）让 dsh 接入 Coding Plan，确认 pm-tool 走套餐可跑通
- [ ] 装好本地 Ollama 并 pull 模型
- [ ] （可选）开通标准 API 后付费、充值少量备用，记录独立部署/团队场景

**离职当天 / 之后：**
- [ ] 确认 dsh / Claude Code 里所有 Key 均来自**个人账号**，移除工作账号凭据
- [ ] 日常 dsh 开发 + pm-tool 走 Coding Plan；敏感内容走 Ollama
- [ ] 关闭工作账号相关自动续费/授权

**月度运维（约 1 分钟）：**
- [ ] 看 Coding Plan 是否到期（建议自动续费）、用量是否触顶
- [ ] 确认 Ollama 可用（`ollama list`）；标准 API 仅在有使用时看账单

---

## 9. 关键链接

| 用途 | 链接 |
|---|---|
| 火山方舟控制台 | https://console.volcengine.com/ark |
| Coding Plan 套餐概览 | https://ark.volcengine.com/region:cn-beijing/docs/coding-plan-personal-plan-overview |
| **DeepSeek Harness 接入 Coding Plan** | https://docs.volcengine.com/docs/ark/coding-plan-personal-ai-deepseek-harness |
| Coding Plan 常见问题 | https://ark.volcengine.com/region:cn-beijing/docs/coding-plan-personal-faq |
| 方舟模型价格（含 DeepSeek） | https://docs.volcengine.com/docs/ark/model-pricing |
| 方舟 Agent Plan | https://www.volcengine.com/activity/agentplan |
| 配套技术文档 | 本仓库 `docs/model-providers.md` |

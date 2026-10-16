# 模型与 Provider 配置（三档路由）

本文说明 pm-tool 生产 Key 如何按场景选择模型、如何配置 Key、以及缓存与成本策略。

## 一、离线优先：AI 是「可降级的增强」

- 核心台账（项目/任务/里程碑/风险/交付物/会议/排期）**完全离线、不依赖 LLM**；断网、无 Key、模型失败均不影响台账读写。
- AI 全部是「一次性文本生成、不挂 function calling」，经 dsh 宿主（`dsh-llm`）调用，失败时归一为中文提示并给出手工流程。

## 二、三档路由：按场景选模型，不做「一刀切」

路由实现见 `src/core/model-route.ts`，思考档位经 `src/core/ai-client.ts` 透传。
候选链按「已就绪的 Key」动态构建——未配置的厂商不进链，自动落到下一档。

| 场景 (`AiTaskKind`) | 主力（默认） | 降本兜底 | 升级档 | 思考档位 | maxTokens |
|---|---|---|---|---|---:|
| 副驾问答 `copilot` | DeepSeek **flash**（high） | Kimi（off） | DeepSeek **v4-pro**（high） | **high** | 4000 |
| WBS 拆解 `wbs` | DeepSeek **flash**（off） | qwen3-coder-flash → Kimi（off） | — | off | 8192 |
| 会议纪要 `meeting` | **qwen3-coder-flash**（off） | DeepSeek flash → Kimi（off） | — | off | 6000 |
| 报告叙述 `narrative` | **qwen-turbo**（off） | DeepSeek flash → Kimi（off） | — | off | 6000 |
| 会话标题 `title` | **qwen-turbo**（off） | DeepSeek flash（off） | — | off | 600 |

要点：
- **只有副驾开思考**（需要日期锚定推理、输出可靠 JSON 计划）；其余场景显式 `off`，避免产生 reasoning tokens。
- 副驾遇到复杂问题时，可显式升级到 `deepseek-v4-pro`。
- DeepSeek 一个 Key 即可覆盖全部场景（开箱即用）；阿里 Key 是「锦上添花」，用于叙述/标题/纪要 JSON 进一步降本。

## 三、Provider 与模型

| Provider | 协议 | 模型 | 说明 |
|---|---|---|---|
| `deepseek-official` | anthropic-messages | `deepseek-flash`、`deepseek-v4-pro` | **base 内置**，无需在 profile 声明；默认 catalog 见 `llm-deepseek/src/models.ts` |
| `aliyun-official` | openai-completions | `qwen-turbo`、`qwen3-coder-flash` | pi-ai provider，需在 profile 声明 |
| `kimi-official` | openai-completions | `kimi-k2-0905-preview` | pi-ai provider |

> 老端点 `deepseek-chat`（DeepSeek V3）已由 `deepseek-flash`（DeepSeek V4.1-Flash）承接；旧名仅在迁移期保留。

### 阿里 provider 声明（已加入 `~/.dsh/profiles/pm/cordis.patch.yml`）

```yaml
- id: llm-pi-ai
  name: '@deepseek-ai/dsh-llm-pi-ai'
  config:
    providers:
      aliyun-official:
        displayName: 阿里百炼（DashScope）
        apiKeyEnv: DASHSCOPE_API_KEY
        api: openai-completions
        baseURL: https://dashscope.aliyuncs.com/compatible-mode/v1
        models:
          - id: qwen-turbo
            name: Qwen Turbo
            contextWindow: 1000000
          - id: qwen3-coder-flash
            name: Qwen3 Coder Flash
            contextWindow: 1000000
```

## 四、Key 配置：只走环境变量，绝不入库

Key 只由「启动 dsh 的进程环境」或 Web「设置→模型」凭据服务提供，**不写入仓库、不写入 profile、不在日志回显**。

| 环境变量 | 覆盖场景 |
|---|---|
| `DEEPSEEK_API_KEY` | 全部场景（主力 + 升级） |
| `DASHSCOPE_API_KEY`（或 `ALIBABA_CLOUD_API_KEY`） | 叙述/标题/纪要降本 |
| `KIMI_API_KEY` / `MOONSHOT_API_KEY` | 兜底 |

示例（写入 shell 启动文件或当前会话）：

```bash
export DEEPSEEK_API_KEY="sk-..."
export DASHSCOPE_API_KEY="sk-..."
```

切换车道：

```bash
/pm model mode prod   # 生产：官方 API
/pm model mode poc    # 验证：免费网关（仅概念验证，勿用于生产）
/pm model status      # 查看各档 provider/model 与就绪状态
```

无 Key 时，`/pm model status` 与首次调用会给出明确中文提示，且 `copilot` 以外场景会自动跳过未配置厂商。

## 五、Prompt Caching（自动，无需手动标记）

- 缓存由适配器/上游自动完成，token usage 中体现为 `cacheReadTokens` / `cacheWriteTokens`。
- 保持「稳定前缀字节稳定」：副驾把**项目快照放在 user 最前、问题放在最后**，多轮追问时只有问题部分 miss，快照命中缓存。
- 系统提示与确定性数据 JSON 结构稳定，同样利于命中。

## 六、成本（2026-10 单价，重度使用假设）

按「一个 PM 重度使用」（副驾约 220 次/月、WBS 与纪要各约 12 次、叙述约 20 次，输入按 70% 缓存命中）测算：

- **三档路由合计约 3.3 元/月**；全 Pro 对照约 13.7 元/月，节省约 76%。
- 成本绝对值极低，重点是把路由/缓存/思考档位的架构做对。

## 七、后续可扩展（尚未落地）

- **Batch API**：非实时的批量 WBS/纪要走批处理，单价再降（DeepSeek 批处理约半价）。
- **峰谷调度**：把可延迟任务放到谷时窗口（DeepSeek 谷时约半价）。
- **预算护栏 / 按场景计量**：按场景统计 token 与花费，设月度上限与告警。
- **本地 Ollama 兜底**：敏感数据或零成本场景走本地模型。
- 副驾思考档位进一步细化（`low` 用于简单追问、`max` 仅用于关键规划）。

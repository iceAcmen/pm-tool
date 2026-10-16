/**
 * R13 智能 WBS 拆解：把「一句话目标/需求文本」交给模型，产出 GitHub 风格
 * 缩进勾选清单（- [ ]），再复用既有 task-import 的解析/预览/落盘链路。
 *
 * AI 只产出「草稿 Markdown」，绝不直接写库：无 confirm 只预览（dry-run），
 * confirm 才走 importTasksFromMarkdown 落盘（ADL-036）。
 */
import { generateDraft, type LlmGateway } from './ai-client.js'
import { planTaskImport, type TaskImportPlan } from './task-import.js'
import type { ModelRoute } from './model-route.js'
import type { PmDomain } from './storage.js'

const WBS_SYSTEM_PROMPT = [
  '你是资深项目经理，负责把用户的项目目标拆解为 WBS（工作分解结构）任务清单。',
  '严格要求：',
  '1. 只输出 GitHub 风格缩进勾选清单，每一行形如 "- [ ] 任务标题"（子任务多缩进 2 个空格）。',
  '2. 第一行是最高层的阶段/可交付物，其下缩进挂子任务；一般 3~5 个顶层、每个顶层 2~4 个子任务。',
  '3. 任务标题用简短中文动宾短语，不要带负责人、日期、编号或额外解释。',
  '4. 不要输出清单以外的任何文字、不要代码围栏、不要 Markdown 标题。',
].join('\n')

/**
 * 生成 WBS 勾选清单草稿（只调一次模型，不落盘）。
 * @throws {AiDraftError} 模型不可用或正文为空时抛出，由命令层降级。
 */
export async function generateWbsMarkdown(
  llm: LlmGateway | undefined,
  goal: string,
  route?: ModelRoute,
): Promise<string> {
  return generateDraft(llm, {
    system: WBS_SYSTEM_PROMPT,
    user: `请把以下项目目标拆解为 WBS 勾选清单：\n${goal}`,
    maxTokens: 8192,
    models: route?.models,
  })
}

/** 把模型草稿解析为 dry-run 预览计划（复用 task-import，含项目存在性/空清单校验）。 */
export function previewWbsDraft(domain: PmDomain, projectId: string, markdown: string): TaskImportPlan {
  return planTaskImport(domain, projectId, markdown)
}

// ---- 草稿缓存：confirm 复用同一次生成，不再重复调用模型（省免费额度，约 50 次/天）----
// 仅进程内；重启后需重新生成一次，符合「单轮交互内确认」的预期。
const draftCache = new Map<string, string>()

/** 预览时记录草稿；返回可在命令行复述的缓存键（projectId + goal）。 */
export function rememberDraft(projectId: string, goal: string, markdown: string): string {
  const key = `${projectId}\n${goal}`
  draftCache.set(key, markdown)
  return key
}

/** confirm 时按 (projectId, goal) 取上次草稿；未命中返回 undefined。 */
export function recallDraft(projectId: string, goal: string): string | undefined {
  return draftCache.get(`${projectId}\n${goal}`)
}

/**
 * R8 旧持久汇报正文兼容解析（纯函数，零 DOM/零执行）。
 *
 * 背景：旧版本把 AI 确认命令尾注（「确认命令：/pm report narrate <id> confirm」或整行裸同型命令）
 * 一并写进了 executiveSummary。按批准边界：旧记录原文非破坏保留、不迁移/删除存储对象；
 * 仅在显示层把这类「独立成行的历史操作尾注」从正文剥离，收进次级「历史操作信息」折叠区留痕，
 * 默认不作为正文展示，且不提供任何会修改数据的按钮。
 *
 * 严格尾注规则（避免误删正文示例）：
 * 1. 只处理代码围栏 ``` 之外、独立成行的尾注；围栏内的同型命令原样保留；
 * 2. 中文前缀行：整行 trim 后以「确认命令：/确认命令:」开头，其后为 /pm 命令；
 * 3. 裸命令行：整行即一条持久 AI 确认命令（report narrate / meeting summarize … confirm），无其他散文；
 * 4. 引用块 >、行内示例、夹在句子中的命令、非 confirm 结尾的命令一律不动。
 */

export interface LegacyNoteSplit {
  /** 剥离尾注后的正文（原样保留其余行，仅规整多余空行）。 */
  body: string
  /** 被隔离出的原始命令行（仅留痕展示，绝不执行）。 */
  legacyCommands: string[]
}

const FENCE = /^\s*```/
// 中文前缀：确认命令：/确认命令: 后接 /pm 命令（全角/半角冒号）。
const CONFIRM_PREFIX = /^确认命令[:：]\s*(\/pm\s+\S[\s\S]*)$/
// 裸整行持久 AI 确认尾命令：report narrate / meeting summarize，以 confirm 结尾。
const BARE_CONFIRM_CMD = /^\/pm\s+(report\s+narrate|meeting\s+summarize)\b[\s\S]*\bconfirm\b\s*$/

export function splitLegacyCommandNote(raw: string): LegacyNoteSplit {
  if (!raw) return { body: '', legacyCommands: [] }
  const lines = raw.split('\n')
  const body: string[] = []
  const legacyCommands: string[] = []
  let inFence = false
  for (const line of lines) {
    if (FENCE.test(line)) {
      inFence = !inFence
      body.push(line)
      continue
    }
    if (inFence) {
      body.push(line)
      continue
    }
    const trimmed = line.trim()
    const prefixMatch = CONFIRM_PREFIX.exec(trimmed)
    if (prefixMatch) {
      legacyCommands.push(prefixMatch[1].trim())
      continue
    }
    if (BARE_CONFIRM_CMD.test(trimmed)) {
      legacyCommands.push(trimmed)
      continue
    }
    body.push(line)
  }
  return {
    body: body.join('\n').replace(/\n{3,}/g, '\n\n').trim(),
    legacyCommands,
  }
}

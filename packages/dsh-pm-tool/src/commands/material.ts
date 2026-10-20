/** /pm material：任务资料区（B2，仅 link | deliverable 软引用）离线命令。
 *
 * 能力边界：link 仅 http/https、离线不探测；deliverable 只存软引用 id + 关联时刻冻结版本/名称快照；
 * remove 仅从本任务数组摘掉，绝不删交付物记录/URL/源；本批不支持 file（随 U2/B3 再加）。
 */
import type { CommandResult } from '@deepseek-ai/dsh-commands'
import {
  addLinkAttachment,
  addDeliverableAttachment,
  removeAttachment,
  commitTaskDraft,
  applyTaskOpsToTask,
  MaterialNotFoundError,
  MaterialDuplicateError,
  ProgressAuthorEmptyError,
  ProgressContentEmptyError,
  EvidenceUrlInvalidError,
} from '../core/task-materials.js'
import { attachFileToTask, applyTaskOpsWithFiles, FileAssetRejectedError, gcOrphanAssets, writeAssetManifest, describeFileRoot } from '../core/file-asset-store.js'
import { ASSET_MAX_BYTES } from '../core/http/limits.js'
import { getTask } from '../core/tasks.js'
import type { AttachmentItem } from '../core/task.js'
import type { PmDomain } from '../core/storage.js'
import { buildSuccessEnvelope } from '../core/ui-feedback.js'

/** strict base64：无空白/换行，字符集与结尾填充受限；encoded 长度先于 decode 预检。 */
const STRICT_BASE64_RE = /^[A-Za-z0-9+/]+={0,2}$/
function decodeBoundedBase64(input: string): { ok: true; bytes: Buffer } | { ok: false; reason: 'too_large' | 'invalid' } {
  const maxEncoded = Math.ceil(ASSET_MAX_BYTES / 3) * 4 + 4
  if (input.length > maxEncoded) return { ok: false, reason: 'too_large' }
  if (!STRICT_BASE64_RE.test(input)) return { ok: false, reason: 'invalid' }
  let bytes: Buffer
  try {
    bytes = Buffer.from(input, 'base64')
  } catch {
    return { ok: false, reason: 'invalid' }
  }
  if (bytes.length > ASSET_MAX_BYTES) return { ok: false, reason: 'too_large' }
  return { ok: true, bytes }
}

export const materialHelp = [
  '任务资料区命令（离线）：',
  '  /pm material link t-0001 {"url":"https://example.com/spec","title":"需求说明书","note":"评审稿"}',
  '  /pm material deliverable t-0001 {"deliverableId":"dlv-1","note":"验收交付物"}',
  '  /pm material file t-0001 {"fileName":"a.md","mediaType":"text/markdown","base64":"…","note":"…"} （≤10MiB，内容寻址去重）',
  '  /pm material apply t-0001 {"attachmentOps":[{"op":"addLink",...}],"progressOps":[{"op":"add",...}]} （保历史的增量编辑）',
  '  /pm material remove t-0001 at-1',
  '  /pm material commit t-0001 {"attachments":[...],"progressLog":[...]} （仅空任务首次整体写入；非空请用 apply）',
  '  /pm material list t-0001',
  '  /pm material gc [--apply] （孤儿字节回收；默认 dry-run 只列出未引用内容寻址文件）',
  '  /pm material manifest [p-0001] （从 DB 生成可迁移资产清单 manifest.json，相对路径）',
  '  /pm material root-status （查看文件根来源/路径；未配置时生产 upload 拒绝）',
  '说明：链接只支持 http/https 且不联网探测；关联交付物冻结版本/名称快照；file 登记资产并挂接，移除不删源；commit 两区一次原子落库，任一校验失败整批零写。',
].join('\n')

function renderItem(item: AttachmentItem): string {
  if (item.kind === 'link') {
    return `· ${item.id}｜链接${item.title ? `「${item.title}」` : ''}：${item.url}${item.note ? `｜备注：${item.note}` : ''}｜${item.addedAt.slice(0, 10)}`
  }
  if (item.kind === 'file') {
    return `· ${item.id}｜文件资产 \`${item.assetId}\`${item.note ? `｜备注：${item.note}` : ''}｜${item.addedAt.slice(0, 10)}`
  }
  const frozen = item.frozenVersion ? `（冻结版本 ${item.frozenVersion}${item.frozenName ? ` · ${item.frozenName}` : ''}）` : ''
  return `· ${item.id}｜交付物 \`${item.deliverableId}\`${frozen}${item.note ? `｜备注：${item.note}` : ''}｜${item.addedAt.slice(0, 10)}`
}

function parseJson(argument: string): { ok: true, value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(argument) }
  } catch {
    return { ok: false }
  }
}

export async function handleMaterialCommand(rawInput: string, domain?: PmDomain): Promise<CommandResult> {
  const input = rawInput.trim()
  if (!input || input.toLowerCase() === 'help') return { kind: 'success', text: materialHelp }
  const match = /^(\S+)(?:\s+([\s\S]*))?$/.exec(input)!
  const action = match[1].toLowerCase()
  const rest = (match[2] ?? '').trim()
  if (!['link', 'deliverable', 'file', 'apply', 'remove', 'commit', 'list', 'gc', 'manifest', 'root-status'].includes(action)) {
    return { kind: 'error', text: `不支持的资料区操作。\n${materialHelp}` }
  }
  if (!domain) return { kind: 'error', text: '任务存储未就绪，请检查 pm profile 的存储配置及宿主日志。' }

  const parts = rest.split(/\s+/).filter(Boolean)

  // 孤儿 GC 不需要任务 ID：默认 dry-run 只列出，--apply 才删未引用内容寻址字节。
  if (action === 'gc') {
    const apply = rest.includes('--apply')
    const res = await gcOrphanAssets(domain, { apply })
    const head = apply
      ? `孤儿 GC 已清理 ${res.removed.length} 个未引用字节`
      : `孤儿 GC 预览（dry-run，未删除）：${res.orphans.length} 个未引用字节；加 --apply 才删除`
    return { kind: 'success', text: buildSuccessEnvelope([head], [...res.removed, ...res.orphans.filter(o => !res.removed.includes(o))].join('\n')) }
  }

  // P1 可迁移清单：从 DB file_assets 生成根 manifest.json，相对路径，可按 projectId 过滤。
  if (action === 'manifest') {
    const projectId = parts[0]
    const { manifest } = await writeAssetManifest(domain, projectId)
    const scope = projectId ? `（项目 ${projectId}）` : '（全部项目）'
    return { kind: 'success', text: buildSuccessEnvelope([`资产清单${scope}：${manifest.count} 项`], manifest.assets.map(a => `${a.relPath}｜${a.size}B｜${a.fileName}`).join('\n')) }
  }

  // F2 文件根状态（本地 doctor 可显绝对路径；不进 snapshot/LLM 投影）。
  if (action === 'root-status') {
    const { dir, source } = await describeFileRoot()
    const label: Record<string, string> = {
      explicit: '显式 DSH_PM_FILE_ROOT',
      isolated: '隔离 DSH_PM_ISOLATED_ROOT/files',
      profile: 'DSH_HOME/profile',
      'builtin-dev': '包内 dev 回退（生产不可用）',
      unavailable: '未配置（生产 upload fail-closed）',
    }
    const lines = [`来源：${source}（${label[source] ?? source}）`, dir ? `路径：${dir}` : '路径：无']
    if (source === 'unavailable') lines.push('提示：生产请设置 DSH_PM_FILE_ROOT，或由 profile 提供 DSH_HOME。')
    return { kind: source === 'unavailable' ? 'error' : 'success', text: buildSuccessEnvelope(['文件根状态'], lines.join('\n')) }
  }

  const taskId = parts[0]
  if (!taskId) return { kind: 'error', text: '缺少任务 ID。\n' + materialHelp }

  try {
    if (action === 'list') {
      const task = getTask(domain, taskId)
      if (!task) return { kind: 'error', text: `未找到任务：${taskId}` }
      const items = task.attachments ?? []
      if (!items.length) return { kind: 'success', text: `任务 ${taskId} 暂无资料项。` }
      return { kind: 'success', text: buildSuccessEnvelope([`资料项 ${items.length} 条｜${taskId}`], items.map(renderItem).join('\n')) }
    }

    if (action === 'remove') {
      await removeAttachment(domain, taskId, parts[1] ?? '')
      return { kind: 'success', text: buildSuccessEnvelope([`已从任务 ${taskId} 移除资料项 ${parts[1] ?? ''}（未删源）`]) }
    }

    const parsed = parseJson(parts.slice(1).join(' '))
    if (!parsed.ok) return { kind: 'error', text: `参数须为合法 JSON 对象，请使用英文双引号；本次未写入。\n${materialHelp}` }

    if (action === 'commit') {
      // raw commit 整体重建会丢 P3 历史/稳定 ID：仅允许空任务首次整体写入；非空一律改用 apply ops。
      const existing = getTask(domain, taskId)
      if (!existing) return { kind: 'error', text: `未找到任务：${taskId}` }
      if ((existing.attachments?.length ?? 0) > 0 || (existing.progressLog?.length ?? 0) > 0) {
        return { kind: 'error', text: '该任务已有资料/进展，raw commit 会重建并丢失修订历史；请改用 material apply 的 attachmentOps/progressOps。' }
      }
      const next = await commitTaskDraft(domain, taskId, parsed.value as Parameters<typeof commitTaskDraft>[2])
      const atts = (next.attachments as AttachmentItem[] | undefined) ?? []
      const logs = (next.progressLog as unknown[] | undefined) ?? []
      return { kind: 'success', text: buildSuccessEnvelope(
        [`任务 ${taskId} draft 已原子提交：资料 ${atts.length} 条 / 进展 ${logs.length} 条`],
        atts.map(renderItem).join('\n'),
      ) }
    }

    if (action === 'apply') {
      const ops = parsed.value as Parameters<typeof applyTaskOpsToTask>[2]
      const hasFile = (ops.attachmentOps ?? []).some(o => o.op === 'addFile')
      const next = hasFile
        ? await applyTaskOpsWithFiles(domain, taskId, ops)
        : await applyTaskOpsToTask(domain, taskId, ops)
      const atts = (next.attachments as AttachmentItem[] | undefined) ?? []
      const logs = (next.progressLog as unknown[] | undefined) ?? []
      return { kind: 'success', text: buildSuccessEnvelope(
        [`任务 ${taskId} ops 已应用：资料 ${atts.length} 条 / 进展 ${logs.length} 条（历史保留）`],
        atts.map(renderItem).join('\n'),
      ) }
    }

    if (action === 'file') {
      const v = parsed.value as { fileName?: string; mediaType?: string; base64?: string; note?: string }
      const decoded = decodeBoundedBase64(String(v.base64 ?? ''))
      if (!decoded.ok) {
        return { kind: 'error', text: decoded.reason === 'too_large'
          ? `文件超过 ${ASSET_MAX_BYTES} 字节上限。`
          : 'base64 非法：须为无空白的标准 base64 字符串。' }
      }
      const result = await attachFileToTask(domain, taskId, {
        originalName: String(v.fileName ?? '').trim(),
        declaredMediaType: v.mediaType?.trim() || undefined,
        bytes: decoded.bytes,
        note: v.note,
      })
      return { kind: 'success', text: buildSuccessEnvelope(
        [`已登记文件资产｜${result.asset.id}｜${result.asset.fileName}（${result.asset.size} 字节）${result.alreadyAttached ? '｜已挂接，去重' : ''}`],
        renderItem(result.attachment),
      ) }
    }

    if (action === 'link') {
      const item = await addLinkAttachment(domain, taskId, parsed.value as Parameters<typeof addLinkAttachment>[2])
      return { kind: 'success', text: buildSuccessEnvelope([`已挂链接｜${item.id}｜${(item as AttachmentItem).kind === 'link' ? (item as AttachmentItem & { url: string }).url : ''}`], renderItem(item as AttachmentItem)) }
    }

    const item = await addDeliverableAttachment(domain, taskId, parsed.value as Parameters<typeof addDeliverableAttachment>[2])
    return { kind: 'success', text: buildSuccessEnvelope([`已关联交付物｜${item.id}｜${(item as AttachmentItem).kind === 'deliverable' ? (item as AttachmentItem & { deliverableId: string }).deliverableId : ''}`], renderItem(item as AttachmentItem)) }
  } catch (error) {
    if (error instanceof EvidenceUrlInvalidError || error instanceof MaterialNotFoundError
      || error instanceof MaterialDuplicateError || error instanceof ProgressAuthorEmptyError
      || error instanceof ProgressContentEmptyError || error instanceof FileAssetRejectedError) {
      return { kind: 'error', text: error.message }
    }
    return { kind: 'error', text: `资料区操作失败：${error instanceof Error ? error.message : String(error)}` }
  }
}

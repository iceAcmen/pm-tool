/**
 * G-D AI 内容助手覆盖层（drawer kind='ai'）：能力选择 → 生成草稿 → 预览/编辑 → 人确认后入库。
 * 从 panel.tsx 按实体抽离，命令通道（execute）与确认后入库语义零变更：
 *  - WBS：task wbs --raw 预览，确认走 task importmd <project> <markdown> confirm（不调模型）；
 *  - 汇报：report narruse 预览，确认走 report narrateuse <project> <cleaned>；
 *  - 纪要：meeting summarize 预览，确认走 meeting summarize <project> <transcript> confirm <cleaned>。
 * 失败保留已输入内容（text/preview 不清空），错误走 ErrorBlock + 重试；确认成功走 Receipt，完成才关闭。
 */
import { useState } from 'react'
import Sparkles from 'lucide-react/dist/esm/icons/sparkles.mjs'
import ListTree from 'lucide-react/dist/esm/icons/list-tree.mjs'
import FileText from 'lucide-react/dist/esm/icons/file-text.mjs'
import ClipboardList from 'lucide-react/dist/esm/icons/clipboard-list.mjs'
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left.mjs'
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw.mjs'
import RotateCcw from 'lucide-react/dist/esm/icons/rotate-ccw.mjs'
import Eye from 'lucide-react/dist/esm/icons/eye.mjs'
import Code2 from 'lucide-react/dist/esm/icons/code-2.mjs'
import Check from 'lucide-react/dist/esm/icons/check.mjs'
import { MarkdownView } from '../markdown-view.js'
import { ProvenancePanel } from '../../provenance-panel.js'
import { ErrorBlock, Receipt } from '../ui/index.js'
import { LaneSwitcher } from './model-lane.js'

/** WBS 结构化预览：把缩进的 `- [ ]` / `- [x]` 清单渲染成任务树（所见即所得）。 */
function WbsTreeView({ markdown }: { markdown: string }) {
  const rows: { depth: number, done: boolean, title: string }[] = []
  markdown.split('\n').forEach(line => {
    const m = /^(\s*)[-*]\s+\[([ xX])\]\s+(.*)$/.exec(line)
    if (m) {
      const indent = m[1].replace(/\t/g, '  ').length
      rows.push({ depth: Math.floor(indent / 2), done: m[2].toLowerCase() === 'x', title: m[3].trim() })
    }
  })
  if (!rows.length) return null
  return <div className="pm-wbs-tree">
    {rows.map((r, i) =>
      <div key={i} className={'pm-wbs-row' + (r.done ? ' is-done' : '') + (r.depth === 0 ? ' is-top' : '')}
        style={{ paddingLeft: 10 + r.depth * 18 }}>
        <span className="pm-wbs-box">{r.done ? <Check size={11}/> : null}</span>
        <span className="pm-wbs-title">{r.title}</span>
      </div>)}
  </div>
}

// AI 预览清洗：去掉「AI 归纳草稿」头、「确认命令：」行、「以上为草稿…」尾注与 [pm:action] 协议行，
// 展示与落盘（narrateuse / summarize confirm）都只保留纯正文，尾注/命令不进保存内容（content/action 分离）。
const cleanAiPreview = (raw: string) => raw.split('\n')
  .filter(l => !/^(AI 归纳草稿|确认命令：|以上为草稿|\[pm:action\])/.test(l.trim()))
  .join('\n')
  .trim()

export function AiAssistant({ projectId, execute, disabled, onConfirmed, onOpenRecord }: {
  projectId: string
  execute: (line: string) => Promise<string>
  disabled?: boolean
  onConfirmed: () => void
  onOpenRecord: (recordType: string, id: string) => void
}) {
  const [mode, setMode] = useState<'wbs' | 'narrate' | 'summarize'>(() => {
    try {
      const m = localStorage.getItem('pm-ai-mode')
      if (m === 'wbs' || m === 'narrate' || m === 'summarize') return m
    } catch { /* ignore */ }
    return 'wbs'
  })
  const [text, setText] = useState(() => {
    try { return mode === 'wbs' ? (localStorage.getItem('pm-ai-goal') || '') : '' } catch { return '' }
  })
  const [lane, setLane] = useState<'poc' | 'prod'>('poc')
  const switchLane = (next: 'poc' | 'prod') => {
    setLane(next)
    void execute(`model mode ${next}`)
  }
  const [preview, setPreview] = useState('')
  const [working, setWorking] = useState(false)
  const [stage, setStage] = useState<'pick' | 'create'>('pick')
  const [docView, setDocView] = useState<'preview' | 'edit'>('preview')
  // 失败保输入：错误独立成块，不清空 text/preview；重试保留已输入内容。
  const [error, setError] = useState<string | null>(null)
  // 确认成功回执：入库完成后在抽屉内展示 Receipt，点「完成」才关闭并刷新。
  const [confirmed, setConfirmed] = useState<{ capName: string, snippet: string } | null>(null)
  // P2-6：确认入库后自增，用于重挂载台账面板触发只读刷新（F05/F06/F12 展示层）。
  const [provTick, setProvTick] = useState(0)

  const CAPABILITIES = [
    { key: 'wbs' as const, icon: ListTree, name: 'WBS 任务拆解', desc: '一句话目标 → 结构化任务清单', tag: '任务' },
    { key: 'narrate' as const, icon: FileText, name: '进度汇报叙述', desc: '项目数据 → 进展 / 风险 / 下周计划', tag: '汇报' },
    { key: 'summarize' as const, icon: ClipboardList, name: '会议纪要归纳', desc: '会议速记 → 议题 / 决议 / 行动项', tag: '会议' },
  ]

  const WBS_TEMPLATES: [string, string][] = [
    ['官网改版', '为一个小型企业官网改版项目制定工作分解，覆盖需求梳理、视觉设计、前后端开发、测试验收、上线'],
    ['App 版本迭代', '为一个 App 新版本迭代制定工作分解，覆盖需求、设计、开发、联调、灰度发布、复盘'],
    ['活动筹备', '为一次线上活动筹备制定工作分解，覆盖方案、物料、推广、执行、数据复盘'],
  ]

  const needsInput = mode !== 'narrate'
  const canGenerate = !working && !(needsInput && !text.trim())

  const lines = (): { preview: string; confirm: string } => {
    if (mode === 'narrate') {
      // OPT-08：预览可编辑，确认按编辑后文本落盘（report narrateuse，不再调模型）。
      // 落盘前清洗尾注/action 行，避免草稿说明与确认命令被写进 executiveSummary（旧记录非破坏）。
      return { preview: `report narrate ${projectId}`, confirm: `report narrateuse ${projectId} ${JSON.stringify(cleanAiPreview(preview))}` }
    }
    if (mode === 'wbs') {
      const goal = text.trim()
      // --raw：只返回原始 Markdown 清单，供下方可编辑预览；确认时用编辑后文本走 importmd（不调模型）。
      return { preview: `task wbs ${projectId} ${goal} --raw`, confirm: `task importmd ${projectId} ${JSON.stringify(preview)} confirm` }
    }
    const transcript = text.trim()
    return { preview: `meeting summarize ${projectId} ${transcript}`, confirm: `meeting summarize ${projectId} ${transcript} confirm ${JSON.stringify(cleanAiPreview(preview))}` }
  }

  const pickCapability = (next: 'wbs' | 'narrate' | 'summarize') => {
    if (working) return
    setMode(next); setText(''); setPreview(''); setDocView('preview'); setStage('create'); setError(null); setConfirmed(null)
    try { localStorage.setItem('pm-ai-mode', next) } catch {}
  }

  const backToPick = () => {
    if (working) return
    setStage('pick'); setError(null)
  }

  const fillTemplate = (goal: string) => {
    if (working) return
    setText(goal); setPreview(''); setError(null)
    try { localStorage.setItem('pm-ai-goal', goal) } catch {}
  }

  const generate = async () => {
    if (!canGenerate) return
    setWorking(true); setError(null); setPreview('')
    try {
      setPreview(await execute(lines().preview))
    } catch (error) {
      // 失败保输入：仅记录错误，text 与已编辑内容保留，可重试或改手工录入。
      setError(error instanceof Error ? error.message : String(error))
    } finally {
      setWorking(false)
    }
  }

  const confirm = async () => {
    if (working || !preview) return
    setWorking(true); setError(null)
    try {
      await execute(lines().confirm)
      const cap = CAPABILITIES.find(c => c.key === mode)
      const snippet = cleanAiPreview(preview).split('\n')[0]?.slice(0, 28) ?? ''
      setConfirmed({ capName: cap?.name ?? 'AI 草稿', snippet })
      // 确认入库后只读刷新溯源台账（面板自拉取；自增 tick 触发重挂载重载）。
      setProvTick(t => t + 1)
    } catch (error) {
      // 失败保输入：保留 preview 与 text，错误进 ErrorBlock，可重试。
      setError(error instanceof Error ? error.message : String(error))
    } finally {
      setWorking(false)
    }
  }

  const hints: Record<typeof mode, string> = {
    wbs: '一句话目标，例如：为企业官网改版做拆解（需求/设计/开发/测试/上线）',
    narrate: '将基于项目确定性数据（任务/里程碑进度）生成本周进展、风险与下周计划叙述。',
    summarize: '粘贴会议速记/原始记录，AI 归纳议题、结论与行动项（负责人/截止日）。',
  }

  const currentCap = CAPABILITIES.find(c => c.key === mode)

  if (confirmed) {
    return <div className="pm-ai">
      <Receipt
        result="已确认入库"
        detail={`「${confirmed.capName}」已按当前文本写入项目台账${snippetClause(confirmed.snippet)}；未确认前不进入任何统计，关闭后回到能力选择可继续下一条。`}
        next={<button type="button" className="pm-button pm-button-primary" onClick={() => onConfirmed()}>完成</button>}
      />
      <ProvenancePanel
        key={provTick}
        projectId={projectId}
        execute={execute}
        onOpenRecord={onOpenRecord}
      />
    </div>
  }

  return <div className="pm-ai">
    {stage === 'pick' ? <>
      {/* 能力选择首页 */}
      <div className="pm-ai-hero">
        <span className="pm-ai-hero-badge"><Sparkles size={16}/></span>
        <div>
          <h3>AI 内容助手</h3>
          <p>选择一个能力，AI 基于项目真实数据生成草稿，确认后才入库。</p>
        </div>
      </div>
      <LaneSwitcher lane={lane} busy={working} onChange={switchLane}/>
      <p className={'pm-ai-lane-note' + (lane === 'poc' ? ' pm-lane-warning' : ' pm-lane-note')}>{lane === 'poc'
        ? 'PoC 为公共免费网关，仅用于概念验证，内容可能被记录。'
        : '生产车道使用官方 API + 自有 Key，未配置 Key 时会给出中文引导。'}</p>
      <div className="pm-ai-cap-grid">
        {CAPABILITIES.map(c => {
          const Icon = c.icon
          return <button key={c.key} type="button" className="pm-ai-cap" disabled={working} onClick={() => pickCapability(c.key)}>
            <span className="pm-ai-cap-icon"><Icon size={18}/></span>
            <span className="pm-ai-cap-body">
              <span className="pm-ai-cap-name">{c.name}</span>
              <span className="pm-ai-cap-desc">{c.desc}</span>
            </span>
            <span className="pm-ai-cap-tag">{c.tag}</span>
          </button>
        })}
      </div>
    </> : <>
      {/* 创作视图 */}
      <div className="pm-ai-create-head">
        <button type="button" className="pm-ai-back" onClick={backToPick} aria-label="返回能力选择"><ArrowLeft size={16}/></button>
        <span className="pm-ai-create-title">{currentCap?.name}</span>
        <LaneSwitcher lane={lane} busy={working} onChange={switchLane} compact/>
      </div>
      <p className="pm-ai-hint">{hints[mode]}</p>
      {needsInput && mode === 'wbs' && (
        <div className="pm-ai-templates">
          {WBS_TEMPLATES.map(([label, goal]) =>
            <button key={label} type="button" className="pm-chip" disabled={working} onClick={() => fillTemplate(goal)}>{label}</button>,
          )}
        </div>
      )}
      {needsInput && (
        <textarea
          className="pm-ai-input"
          rows={mode === 'summarize' ? 6 : 3}
          value={text}
          disabled={working}
          placeholder={hints[mode]}
          onChange={event => {
            const v = event.currentTarget.value
            setText(v)
            if (mode === 'wbs') try { localStorage.setItem('pm-ai-goal', v) } catch {}
          }}
        />
      )}
      <button type="button" className="pm-ai-generate" disabled={!canGenerate || disabled} onClick={() => void generate()}>
        {working
          ? <><RefreshCw size={15} className="pm-spin"/> 生成中…</>
          : <><Sparkles size={15}/> 生成草稿</>}
      </button>
      {error && (
        <ErrorBlock
          title="生成失败"
          what={error}
          howToFix="可修正输入后重试，或改用手工录入，核心台账不受影响。"
          retryLabel="重试（保留已输入内容）"
          onRetry={() => void generate()}
        />
      )}
      {preview && (
        <div className="pm-ai-result pm-ai-preview">
          <div className="pm-ai-result-head">
            <div className="pm-ai-seg">
              <button type="button" className={docView === 'preview' ? 'is-on' : ''} onClick={() => setDocView('preview')}><Eye size={13}/> 预览</button>
              <button type="button" className={docView === 'edit' ? 'is-on' : ''} onClick={() => setDocView('edit')}><Code2 size={13}/> 编辑</button>
            </div>
            <button type="button" className="pm-ai-regen" disabled={working} onClick={() => void generate()} title="重新生成"><RotateCcw size={14}/></button>
          </div>
          {docView === 'preview' ? (
            mode === 'wbs'
              ? <WbsTreeView markdown={preview}/>
              : <MarkdownView source={cleanAiPreview(preview)}/>
          ) : (
            <textarea
              className={'pm-ai-input pm-ai-markdown' + (mode === 'wbs' ? ' pm-ai-wbs-raw' : ' pm-ai-raw')}
              rows={mode === 'wbs' ? 12 : 9}
              value={preview}
              disabled={working}
              onChange={event => setPreview(event.currentTarget.value)}
            />
          )}
          <div className="pm-ai-result-actions pm-ai-actions">
            <button type="button" className="pm-ai-confirm-btn pm-ai-confirm" disabled={working || !preview} onClick={() => void confirm()}>
              <Check size={15}/> 确认入库
            </button>
          </div>
          {/* P2-6 溯源静态标记：只列实际依赖对象，置信度恒未提供，不按来源数评分。 */}
          <div className="pm-ai-provenance-note" aria-label="溯源说明">
            来源仅记录本次实际依赖对象｜置信度：未提供（不按来源数量评分）
          </div>
        </div>
      )}
      <p className="pm-ai-footnote">AI 结果为草稿，需点「确认入库」才写入项目；失败时可重试或改用手工录入，核心台账不受影响。</p>
    </>}
    {/* P2-6 溯源台账（F05 来源证据 / F06 失效置灰 / F12 重校历史）：只读展示，独立拉取，不写业务。 */}
    <ProvenancePanel
      key={provTick}
      projectId={projectId}
      execute={execute}
      onOpenRecord={onOpenRecord}
    />
  </div>
}

function snippetClause(snippet: string): string {
  return snippet ? `（${snippet}…）` : ''
}

/**
 * P2 X7 愿景/OKR 层视图（只读呈现，零写、不下裁决）。
 *
 * 树形呈现：objective 为根，KR 按 primaryOkrId 单父主归属挂载（权重只认这一条）；
 * 软关联「关联目标」行可见、标注「关联」、不计权重。
 * 收件区入口：待确认归属建议数；confirm/ignore 走面板命令通道（如既有模式），
 * 未确认不自动生效。快照未携带收件区时只显示命令提示，不伪造建议数据。
 *
 * 样式类名前缀 .pm-okr-* 定义在 panel.css（只追加区块，浅深双态 token 自适应）。
 */
import Inbox from 'lucide-react/dist/esm/icons/inbox.mjs'
import Target from 'lucide-react/dist/esm/icons/target.mjs'
import Link2 from 'lucide-react/dist/esm/icons/link-2.mjs'
import Pencil from 'lucide-react/dist/esm/icons/pencil.mjs'
import Plus from 'lucide-react/dist/esm/icons/plus.mjs'
import {
  buildOkrTree,
  countPendingInbox,
  filterInbox,
  okrStatusLabel,
  type OkrInboxSuggestion,
  type OkrViewRecord,
} from './okr-model.js'
import { MarkdownView } from '../shared/markdown-view.js'
import type { Run } from './types.js'

export interface OkrsViewProps {
  projectId: string
  /** 数据源 snapshot.okrs；缺省为空数组。 */
  okrs?: OkrViewRecord[]
  /** settings 收件区 pmOkrInbox；snapshot 未携带时为 undefined（只显示命令提示）。 */
  inbox?: OkrInboxSuggestion[]
  run?: Run
  onSaved?: () => void
  /** 打开新建 OKR 抽屉。 */
  onCreate?: () => void
  /** 打开编辑抽屉（record 为快照全量记录，description 等兼容位一并回显）。 */
  onEdit?: (record: OkrViewRecord) => void
}

const KIND_LABEL: Record<OkrViewRecord['kind'], string> = {
  objective: '目标 O',
  'key-result': '关键结果 KR',
}

export function OkrsView({ projectId, okrs = [], inbox, run, onSaved, onCreate, onEdit }: OkrsViewProps) {
  const tree = buildOkrTree(okrs, projectId)
  const pending = countPendingInbox(inbox, projectId)
  const suggestions = filterInbox(inbox, projectId)

  const act = async (command: string) => {
    if (!run) return
    const ok = await run(command)
    if (ok) onSaved?.()
  }

  return (
    <div className="pm-okr-root">
      {/* §1 页头由外层 PageShell bare 壳提供统一 padding，视图只出标题/副题/CTA，不自加左右 padding。 */}
      <header className="pm-okr-head">
        <div className="pm-okr-head-text">
          <h1>愿景 → 年度目标 → 项目归属</h1>
          <p className="pm-okr-sub">X7 愿景/OKR 层：单父主归属计权重，软关联可见不计权重；草稿由人定稿，前端不下裁决。</p>
        </div>
        {onCreate && (
          <button type="button" className="pm-okr-btn pm-okr-btn-primary" onClick={onCreate}>
            <Plus size={14}/>新建 OKR
          </button>
        )}
      </header>
      {/* 树形：objective 根 → KR 子节点；软关联行单独标注「关联」。 */}
      <section className="pm-okr-tree" aria-label="目标归属树">
        {tree.roots.length === 0 && tree.orphans.length === 0 ? (
          <div className="pm-okr-empty pm-card">
            <Target size={22}/>
            <h3>暂无 OKR 记录</h3>
            <p>由人录入或经收件区确认归属后在此呈现；前端不自动创建、不自动定稿。</p>
            {onCreate && (
              <button type="button" className="pm-okr-btn pm-okr-btn-primary" onClick={onCreate}>
                <Plus size={14}/>新建首个 OKR
              </button>
            )}
          </div>
        ) : (
          tree.roots.map(root => (
            <div className="pm-okr-node pm-card" key={root.record.id} data-kind={root.record.kind}>
              <div className="pm-okr-node-top">
                <span className="pm-okr-kind">{KIND_LABEL[root.record.kind]}</span>
                <h3 className="pm-okr-title">{root.record.title}</h3>
                <span className={`pm-okr-status pm-okr-status--${root.record.status}`}>
                  {okrStatusLabel(root.record.status)}
                </span>
                {onEdit && (
                  <button type="button" className="pm-okr-btn pm-okr-btn-ghost" aria-label="编辑此 OKR" onClick={() => onEdit(root.record)}>
                    <Pencil size={12}/>编辑
                  </button>
                )}
              </div>
              {root.record.owner && <div className="pm-okr-meta">负责人：{root.record.owner}</div>}
              {root.record.targetDate && <div className="pm-okr-meta">目标日期：{root.record.targetDate}</div>}
              {root.record.description?.trim() && (
                <MarkdownView source={root.record.description} density="compact" className="pm-okr-desc"/>
              )}

              {root.children.length > 0 && (
                <ul className="pm-okr-krs">
                  {root.children.map(kr => (
                    <li className="pm-okr-kr" key={kr.record.id}>
                      <span className="pm-okr-kind pm-okr-kind--kr">{KIND_LABEL[kr.record.kind]}</span>
                      <span className="pm-okr-kr-title">{kr.record.title}</span>
                      <span className="pm-okr-own-note">主归属：{root.record.title}</span>
                      <span className={`pm-okr-status pm-okr-status--${kr.record.status}`}>
                        {okrStatusLabel(kr.record.status)}
                      </span>
                      {onEdit && (
                        <button type="button" className="pm-okr-btn pm-okr-btn-ghost" aria-label="编辑此关键结果" onClick={() => onEdit(kr.record)}>
                          <Pencil size={12}/>编辑
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {root.related.length > 0 && (
                <div className="pm-okr-related">
                  {root.related.map(rel => (
                    <span className="pm-okr-related-row" key={rel.id}>
                      <Link2 size={11}/>关联：{rel.title}（{rel.id} · 只展示，不参与权重）
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}

        {/* 无有效父目标的 KR：诚实单列，不伪造归属。 */}
        {tree.orphans.length > 0 && (
          <div className="pm-okr-orphans pm-card">
            <h3>未归属关键结果（待指定主归属）</h3>
            {tree.orphans.map(o => (
              <div className="pm-okr-kr pm-okr-kr--orphan" key={o.record.id}>
                <span className="pm-okr-kind pm-okr-kind--kr">{KIND_LABEL[o.record.kind]}</span>
                <span className="pm-okr-kr-title">{o.record.title}</span>
                <span className="pm-okr-own-note">未挂主归属</span>
                {onEdit && (
                  <button type="button" className="pm-okr-btn pm-okr-btn-ghost" aria-label="编辑此关键结果" onClick={() => onEdit(o.record)}>
                    <Pencil size={12}/>编辑
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 收件区入口：待确认归属建议；confirm/ignore 走命令通道，未确认不生效。 */}
      <section className="pm-okr-inbox pm-card" aria-label="待确认归属建议">
        <header className="pm-okr-inbox-head">
          <Inbox size={15}/>
          <h2>待确认归属建议</h2>
          <span className="pm-okr-inbox-count">{pending} 待确认</span>
        </header>

        {inbox === undefined ? (
          <p className="pm-okr-inbox-hint">
            快照未携带收件区数据；请在命令行查看：<code>/pm okr inbox {projectId}</code>。前端不伪造建议。
          </p>
        ) : suggestions.length === 0 ? (
          <p className="pm-okr-inbox-hint">暂无待处理建议。agent 代起草的归属建议在此等待人确认，未确认不进入主档。</p>
        ) : (
          <ul className="pm-okr-suggestions">
            {suggestions.map(s => (
              <li className="pm-okr-suggestion" key={s.id} data-state={s.state ?? 'pending'}>
                <div className="pm-okr-suggestion-main">
                  <span className="pm-okr-suggestion-id">{s.id}</span>
                  <span className="pm-okr-suggestion-title">{s.title}</span>
                  <span className="pm-okr-kind pm-okr-kind--mini">{KIND_LABEL[s.kind]}</span>
                  <span className="pm-okr-suggestion-at">{s.at.slice(0, 16).replace('T', ' ')}</span>
                </div>
                {s.rationale && <p className="pm-okr-suggestion-rationale">{s.rationale}</p>}
                <div className="pm-okr-suggestion-actions">
                  {s.state === 'confirmed' ? (
                    <span className="pm-okr-adopted-tag">已采纳</span>
                  ) : s.state === 'ignored' ? (
                    <span className="pm-okr-ignored-tag">已忽略</span>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="pm-okr-btn pm-okr-btn-primary"
                        disabled={!run}
                        onClick={() => void act(`okr confirm ${s.id}`)}
                      >采纳并写入归属</button>
                      <button
                        type="button"
                        className="pm-okr-btn pm-okr-btn-ghost"
                        disabled={!run}
                        onClick={() => void act(`okr ignore ${s.id}`)}
                      >忽略</button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

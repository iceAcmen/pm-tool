/**
 * 交付物视图（重设计 v2 · dsh 主题对齐版）。
 *
 * 按状态分组：已验收 / 已提交 / 进行中 / 待开始。
 * 顶部总览带 + 状态筛选 chips。卡片含名称、版本、负责人、关联里程碑、交付时间、位置、验收进度条。
 *
 * 视觉基准：artifacts/redesign/deliverables/index.html；主题 token 由 panel.css .pm-shell
 * 统一重映射为 dsh --dsw-* 别名。样式见 deliverables.css，全部 scope 在 .pm-dv-root 下。
 */
import { useState } from 'react'
import Plus from 'lucide-react/dist/esm/icons/plus.mjs'
import FileText from 'lucide-react/dist/esm/icons/file-text.mjs'
import MapPin from 'lucide-react/dist/esm/icons/map-pin.mjs'
import Inbox from 'lucide-react/dist/esm/icons/inbox.mjs'
import Upload from 'lucide-react/dist/esm/icons/upload.mjs'
import Search from 'lucide-react/dist/esm/icons/search.mjs'
import SearchX from 'lucide-react/dist/esm/icons/search-x.mjs'
import css from './deliverables.css?raw'
import { MarkdownView } from '../shared/markdown-view.js'
import type { Deliverable, Milestone, Task } from './types.js'

const STATUS_LABEL: Record<string, string> = {
  planned: '待开始',
  in_progress: '进行中',
  submitted: '已提交',
  accepted: '已验收',
}

/** 验收进度条宽度（按状态近似，展示用）。 */
function progressOf(status: string): number {
  switch (status) {
    case 'accepted': return 100
    case 'submitted': return 80
    case 'in_progress': return 45
    default: return 0
  }
}

const STATUS_ORDER = ['accepted', 'submitted', 'in_progress', 'planned'] as const
type StatusGroup = typeof STATUS_ORDER[number]

interface DeliverablesProps {
  deliverables: Deliverable[]
  milestones?: Milestone[]
  tasks?: Task[]
  onCreate: () => void
  onEdit: (d: Deliverable) => void
}

export function Deliverables(props: DeliverablesProps) {
  const { deliverables, milestones, onCreate, onEdit } = props
  const [filter, setFilter] = useState<'all' | StatusGroup>('all')
  const [query, setQuery] = useState('')

  // 统计
  const total = deliverables.length
  const accepted = deliverables.filter(d => d.status === 'accepted').length
  const inProgress = deliverables.filter(d => d.status === 'in_progress').length
  const submitted = deliverables.filter(d => d.status === 'submitted').length
  const planned = deliverables.filter(d => d.status === 'planned').length
  const reviewed = accepted + submitted
  const passRate = reviewed > 0 ? Math.round((accepted / reviewed) * 100) : 0

  // 里程碑 id → title 映射
  const msById = new Map((milestones ?? []).map(m => [m.id, m.title]))

  // 文本搜索：名称 / 版本 / 负责人 / 位置 / 关联里程碑标题（大小写不敏感）
  const q = query.trim().toLowerCase()
  const matches = (d: Deliverable): boolean => {
    if (!q) return true
    const msTitle = d.milestoneId ? msById.get(d.milestoneId) ?? '' : ''
    const haystack = `${d.name} ${d.version} ${d.owner} ${d.location} ${d.description} ${msTitle}`.toLowerCase()
    return haystack.includes(q)
  }

  // 分组（在文本搜索 + 状态筛选之上叠加）
  const groups = STATUS_ORDER.map(status => ({
    status,
    items: deliverables.filter(d => d.status === status && matches(d)),
  }))
  const visibleGroups = groups.filter(g => filter === 'all' || filter === g.status)
  const anyMatch = visibleGroups.some(g => g.items.length > 0)

  return (
    <div className="pm-dv-root">
      <style>{css}</style>

      {/* 页头 */}
      <div className="dv-pagehead">
        <div>
          <h1>交付物</h1>
          <div className="dv-sub">
            共 <b>{total}</b> 项交付物 · 按状态分组管理
          </div>
        </div>
      </div>

      {total === 0 ? (
        /* 空态 */
        <div className="dv-empty pm-card">
          <div className="dv-empty-ico"><Inbox size={22}/></div>
          <h3>暂无交付物</h3>
          <p>交付物是项目阶段产出的正式文档、原型、脚本等。创建第一项交付物，开始追踪验收进度。</p>
          <button type="button" className="dv-btn-primary" onClick={onCreate}><Plus size={14}/> 新增交付物</button>
        </div>
      ) : (
        <>
          {/* 总览带 */}
          <section className="dv-ovband pm-card">
            <div className="dv-ov-row">
              <div className="dv-ov-cell">
                <span className="dv-ov-lab">总数</span>
                <span className="dv-ov-val">{total}<small>项</small></span>
                <span className="dv-ov-sub">需求→上线全流程</span>
              </div>
              <div className="dv-ov-cell">
                <span className="dv-ov-lab">已验收</span>
                <span className="dv-ov-val dv-tone-done">{accepted}<small>项</small></span>
                <span className="dv-ov-sub">封存归档</span>
              </div>
              <div className="dv-ov-cell">
                <span className="dv-ov-lab">进行中</span>
                <span className="dv-ov-val dv-tone-prog">{inProgress}<small>项</small></span>
                <span className="dv-ov-sub">制作打磨中</span>
              </div>
              <div className="dv-ov-cell">
                <span className="dv-ov-lab">已提交</span>
                <span className="dv-ov-val dv-tone-todo">{submitted}<small>项</small></span>
                <span className="dv-ov-sub">等待验收评审</span>
              </div>
              <div className="dv-ov-cell">
                <span className="dv-ov-lab">待开始</span>
                <span className="dv-ov-val dv-tone-todo">{planned}<small>项</small></span>
                <span className="dv-ov-sub">排期在后续阶段</span>
              </div>
              <div className="dv-ov-cell">
                <span className="dv-ov-lab">验收通过率</span>
                <span className="dv-ov-val dv-tone-done">{passRate}<small>%</small></span>
                <span className="dv-ov-sub">
                  {reviewed > 0 ? `${accepted} / ${reviewed} 已提交项通过` : '暂无已提交项'}
                </span>
              </div>
            </div>
          </section>

          {/* 筛选行：状态 chips（带 role=group） + 文本搜索框 */}
          <div className="dv-filter-row">
            <div className="dv-filters" role="group" aria-label="筛选交付物状态">
              <button type="button" className={`dv-chip ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}>
                <span className="dv-dot" style={{ background: 'var(--ink-2)' }}/>全部 <span className="dv-cnt">{total}</span>
              </button>
              {groups.map(g => (
                <button type="button" key={g.status}
                  className={`dv-chip ${filter === g.status ? 'active' : ''}`}
                  data-tone={g.status}
                  onClick={() => setFilter(filter === g.status ? 'all' : g.status)}>
                  <span className="dv-dot"/>{STATUS_LABEL[g.status]} <span className="dv-cnt">{g.items.length}</span>
                </button>
              ))}
            </div>
            <label className="dv-search">
              <Search size={14}/>
              <input value={query} onChange={e => setQuery(e.target.value)}
                placeholder="搜索记录" aria-label="搜索记录"/>
            </label>
          </div>

          {/* 分组列表 */}
          {!anyMatch ? (
            <div className="dv-nomatch pm-card">
              <div className="dv-nomatch-ico"><SearchX size={20}/></div>
              <h3>无匹配记录</h3>
              <p>未找到与「{query.trim()}」匹配的交付物。尝试更换关键词或清除筛选。</p>
            </div>
          ) : (
            visibleGroups.map(g => (
              <section className="dv-group" key={g.status}>
                <div className="dv-g-head">
                  <span className="dv-g-dot" data-tone={g.status}/>
                  <h2>{STATUS_LABEL[g.status]}</h2>
                  <span className="dv-g-count">{g.items.length} 项</span>
                  <span className="dv-g-line"/>
                </div>
                {g.items.length === 0 ? (
                  <div className="dv-group-empty">暂无此状态交付物</div>
                ) : (
                  <div className="dv-g-grid">
                    {g.items.map(d => {
                      const pct = progressOf(d.status)
                      return (
                        <div className="dv-dcard pm-card" data-status={d.status} key={d.id}
                          onClick={() => onEdit(d)} role="button" tabIndex={0}>
                          <div className="dv-d-top">
                            <div className="dv-d-name">
                              <div className="dv-d-ico">
                                {d.status === 'submitted' ? <Upload size={14}/> : <FileText size={14}/>}
                              </div>
                              <h3>{d.name}</h3>
                            </div>
                            <span className="dv-d-ver">{d.version || '—'}</span>
                          </div>
                          <div className="dv-d-meta">
                            {d.owner && (
                              <span className="dv-ow">
                                <span className="dv-av2">{d.owner.slice(0, 1)}</span>{d.owner}
                              </span>
                            )}
                            {d.milestoneId && msById.has(d.milestoneId) && (
                              <span className="dv-ms">关联 {msById.get(d.milestoneId)}</span>
                            )}
                            {d.dueDate && (
                              <span className="dv-due">交付 <b>{d.dueDate.slice(5)}</b></span>
                            )}
                          </div>
                          {d.location && (
                            <div className="dv-d-loc">
                              <MapPin size={11}/>{d.location}
                            </div>
                          )}
                          {/* 多行描述五环节：卡面以安全 Markdown 可见，不只在抽屉表单里编辑。 */}
                          {d.description?.trim() && (
                            <MarkdownView source={d.description} density="compact" className="dv-d-desc"/>
                          )}
                          <div className="dv-d-prog">
                            <span className="dv-track">
                              <i style={{
                                width: `${pct}%`,
                                background: d.status === 'accepted' ? 'var(--c-done)'
                                  : d.status === 'in_progress' ? 'var(--c-prog)'
                                  : d.status === 'submitted' ? 'var(--c-block)'
                                  : 'transparent',
                              }}/>
                            </span>
                            <span className="dv-pct">{pct}%</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>
            ))
          )}
        </>
      )}
    </div>
  )
}

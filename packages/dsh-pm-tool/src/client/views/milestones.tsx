/**
 * 里程碑视图（重设计 v2 · dsh 主题对齐版）。
 *
 * 旅程式时间轴：节点按目标日期排序，状态四态（achieved / at_risk / missed / planned）。
 * 顶部紧凑达成率总览带，数字全部从 props 派生。
 *
 * 视觉基准：artifacts/redesign/milestones/index.html；主题 token 由 panel.css .pm-shell
 * 统一重映射为 dsh --dsw-* 别名。样式见 milestones.css，全部 scope 在 .pm-ms-root 下。
 */
import Plus from 'lucide-react/dist/esm/icons/plus.mjs'
import Pencil from 'lucide-react/dist/esm/icons/pencil.mjs'
import CircleCheck from 'lucide-react/dist/esm/icons/circle-check.mjs'
import CircleAlert from 'lucide-react/dist/esm/icons/circle-alert.mjs'
import CircleX from 'lucide-react/dist/esm/icons/circle-x.mjs'
import Flag from 'lucide-react/dist/esm/icons/flag.mjs'
import Inbox from 'lucide-react/dist/esm/icons/inbox.mjs'
import { localTodayIso, isMilestoneMissed } from '../../core/derived.js'
import css from './milestones.css?raw'
import type { Milestone, Task, Run, View } from './types.js'

const STATUS_LABEL: Record<string, string> = {
  planned: '计划中',
  at_risk: '有风险',
  achieved: '已达成',
  missed: '已延期',
}

/** 距今天数；无日期返回 null。 */
function daysUntil(date: string | undefined, today: string): number | null {
  if (!date) return null
  return Math.round((Date.parse(`${date}T00:00:00`) - Date.parse(`${today}T00:00:00`)) / 86_400_000)
}

interface MilestonesProps {
  milestones: Milestone[]
  tasks: Task[]
  disabled?: boolean
  onCreate: () => void
  onEdit: (m: Milestone) => void
  run?: Run
  onSaved?: () => void
  onOpenTask?: (t: Task) => void
  onGotoView?: (v: View) => void
}

export function Milestones(props: MilestonesProps) {
  const { milestones, tasks, disabled, onCreate, onEdit } = props
  const today = localTodayIso()

  // 按目标日期排序（core/listMilestones 已排，但组件内再保险一次）
  const sorted = [...milestones].sort(
    (a, b) => (a.targetDate || '').localeCompare(b.targetDate || ''),
  )

  // 聚合：每个里程碑关联的任务 → 负责人去重
  const tasksByMilestone = new Map<string, Task[]>()
  for (const t of tasks) {
    if (!t.milestoneId) continue
    const arr = tasksByMilestone.get(t.milestoneId) ?? []
    arr.push(t)
    tasksByMilestone.set(t.milestoneId, arr)
  }

  // 统计：延期统一走 isMilestoneMissed 纯谓词（与卡片同口径），其余状态互斥不重复计数。
  const total = sorted.length
  const achieved = sorted.filter(m => m.status === 'achieved').length
  const missed = sorted.filter(m => isMilestoneMissed(m, today)).length
  const atRisk = sorted.filter(m => m.status === 'at_risk' && !isMilestoneMissed(m, today)).length
  const planned = sorted.filter(m => m.status === 'planned' && !isMilestoneMissed(m, today)).length
  const rate = total ? Math.round((achieved / total) * 100) : 0

  return (
    <div className="pm-ms-root">
      <style>{css}</style>

      {/* 页头 */}
      <div className="ms-pagehead">
        <div>
          <h1>里程碑</h1>
          <div className="ms-sub">
            共 <b>{total}</b> 个仪式节点 · 从需求冻结到验收交付
          </div>
        </div>
        {!disabled && (
          <button type="button" className="ms-btn-primary" onClick={onCreate}>
            <Plus size={14}/> 新增里程碑
          </button>
        )}
      </div>

      {total === 0 ? (
        /* 空态 */
        <div className="ms-empty pm-card">
          <div className="ms-empty-ico"><Inbox size={22}/></div>
          <h3>暂无里程碑</h3>
          <p>里程碑是项目阶段的仪式性节点。创建第一个里程碑，开始追踪项目旅程。</p>
          {!disabled && <button type="button" className="ms-btn-primary" onClick={onCreate}><Plus size={14}/> 新增里程碑</button>}
        </div>
      ) : (
        <>
          {/* 紧凑达成率总览带 */}
          <section className="ms-ovband pm-card">
            <div className="ms-ov-row">
              <div className="ms-ov-cell">
                <span className="ms-ov-lab">总数</span>
                <span className="ms-ov-val">{total}<small>个节点</small></span>
                <span className="ms-ov-sub">需求→上线全旅程</span>
              </div>
              <div className="ms-ov-cell">
                <span className="ms-ov-lab">已达成</span>
                <span className="ms-ov-val ms-tone-done">{achieved}<small>/{total}</small></span>
                <span className="ms-ov-sub">
                  {achieved > 0 ? `${achieved} 个节点已验收` : '暂无已达成节点'}
                </span>
              </div>
              <div className="ms-ov-cell">
                <span className="ms-ov-lab">有风险</span>
                <span className="ms-ov-val ms-tone-block">{atRisk}<small>项</small></span>
                <span className="ms-ov-sub">{atRisk > 0 ? '临近节点需关注' : '无风险节点'}</span>
              </div>
              <div className="ms-ov-cell">
                <span className="ms-ov-lab">已延期</span>
                <span className="ms-ov-val ms-tone-late">{missed}<small>项</small></span>
                <span className="ms-ov-sub">
                  {missed > 0 ? '目标日已过未达成' : '无延期'}
                </span>
              </div>
              <div className="ms-ov-cell">
                <span className="ms-ov-lab">计划中</span>
                <span className="ms-ov-val ms-tone-prog">{planned}<small>项</small></span>
                <span className="ms-ov-sub">未来待达成</span>
              </div>
              <div className="ms-ov-cell ms-ov-rate-cell">
                <span className="ms-ov-lab">达成率 · {rate}%</span>
                <span className="ms-ov-rate-track">
                  <i style={{ width: `${(achieved / total) * 100}%`, background: 'var(--c-done)' }}/>
                  <i style={{ width: `${(atRisk / total) * 100}%`, background: 'var(--c-block)' }}/>
                  <i style={{ width: `${(missed / total) * 100}%`, background: 'var(--c-late)' }}/>
                </span>
              </div>
            </div>
          </section>

          {/* 竖向时间轴 */}
          <div className="ms-tl">
            {sorted.map(m => {
              const linkedTasks = tasksByMilestone.get(m.id) ?? []
              const owners = [...new Set(
                linkedTasks.map(t => t.assignee?.trim()).filter(Boolean) as string[],
              )]
              const days = daysUntil(m.targetDate, today)
              const isMissed = isMilestoneMissed(m, today)

              return (
                <div className="ms-node" data-status={m.status === 'missed' || isMissed ? 'missed' : m.status} key={m.id}>
                  <div className="ms-mk">
                    {m.status === 'achieved' ? <CircleCheck size={12}/>
                      : m.status === 'at_risk' ? <CircleAlert size={12}/>
                      : m.status === 'missed' || isMissed ? <CircleX size={12}/>
                      : <Flag size={12}/>}
                  </div>
                  <div className="ms-mcard pm-card">
                    <div className="ms-c-top">
                      <div className="ms-c-title">
                        <span className="ms-c-code">{m.id}</span>
                        <h3>{m.title}</h3>
                      </div>
                      <span className={`ms-chip ms-chip-${m.status === 'missed' || isMissed ? 'late' : m.status}`}>
                        {STATUS_LABEL[m.status === 'missed' || isMissed ? 'missed' : m.status] ?? m.status}
                      </span>
                      {!disabled && (
                        <button type="button" className="ms-row-btn" aria-label={`编辑 ${m.title}`}
                          onClick={() => onEdit(m)}>
                          <Pencil size={13}/>
                        </button>
                      )}
                    </div>
                    <div className="ms-c-meta">
                      <span className="ms-dt">目标 <b>{m.targetDate || '未定'}</b></span>
                      {m.achievedDate
                        ? <span className="ms-dt">达成于 <b>{m.achievedDate}</b></span>
                        : days !== null && days >= 0 && m.status !== 'achieved'
                          ? <span className="ms-dt">距目标 <b>{days} 天</b></span>
                          : null}
                      {isMissed && m.status !== 'achieved' && days !== null && days < 0 && (
                        <span className="ms-late-note">已过 {-days} 天</span>
                      )}
                    </div>
                    {(owners.length > 0 || linkedTasks.length > 0) && (
                      <div className="ms-c-row3">
                        {owners.length > 0 && (
                          <span className="ms-owners">
                            <span className="ms-lab">负责</span>
                            {owners.map(o => (
                              <span className="ms-ow" key={o}>
                                <span className="ms-av2">{o.slice(0, 1)}</span>{o}
                              </span>
                            ))}
                          </span>
                        )}
                        {linkedTasks.length > 0 && (
                          <span className="ms-deliv">
                            {linkedTasks.map(t => (
                              <span className="ms-chip-deliv" key={t.id}
                                onClick={() => props.onOpenTask?.(t)}>
                                {t.title} <span className="ms-v">{t.code}</span>
                              </span>
                            ))}
                          </span>
                        )}
                      </div>
                    )}
                    {m.description && (
                      <div className="ms-c-desc">{m.description}</div>
                    )}
                  </div>
                </div>
              )
            })}
            {/* 末端收口 */}
            <div className="ms-tl-end">
              <span className="ms-end-mark"><span className="ms-end-dot"/>旅程终点 · 全部里程碑完成</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

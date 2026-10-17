/**
 * P2-1 左分组导航（驾驶舱 rail）：跨项目看板 / 当前项目 / 计划与排期 / 协作与记录。
 * 纯展示 + 本地搜索过滤 + 折叠态 localStorage 持久化；视图切换/打开看板/设置由 panel 注入。
 */
import { useMemo, useState, type ReactNode } from 'react'
import { buildNavModel, filterNavGroups, toggleCollapsed, type NavEntry, type NavCountMap } from '../core/nav.js'
import LayoutDashboard from 'lucide-react/dist/esm/icons/layout-dashboard.mjs'
import Gauge from 'lucide-react/dist/esm/icons/gauge.mjs'
import ListChecks from 'lucide-react/dist/esm/icons/list-checks.mjs'
import ChartGantt from 'lucide-react/dist/esm/icons/chart-gantt.mjs'
import Milestone from 'lucide-react/dist/esm/icons/milestone.mjs'
import ShieldAlert from 'lucide-react/dist/esm/icons/shield-alert.mjs'
import UserRound from 'lucide-react/dist/esm/icons/user-round.mjs'
import CalendarDays from 'lucide-react/dist/esm/icons/calendar-days.mjs'
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up.mjs'
import Package from 'lucide-react/dist/esm/icons/package.mjs'
import SlidersHorizontal from 'lucide-react/dist/esm/icons/sliders-horizontal.mjs'
import Search from 'lucide-react/dist/esm/icons/search.mjs'
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down.mjs'

const COLLAPSE_KEY = 'pm-nav-collapsed'

const ICONS: Record<string, ReactNode> = {
  dash: <LayoutDashboard size={17}/>,
  overview: <Gauge size={17}/>,
  tasks: <ListChecks size={17}/>,
  gantt: <ChartGantt size={17}/>,
  milestones: <Milestone size={17}/>,
  'risk-issues': <ShieldAlert size={17}/>,
  people: <UserRound size={17}/>,
  meetings: <CalendarDays size={17}/>,
  reports: <TrendingUp size={17}/>,
  deliverables: <Package size={17}/>,
}

export interface NavRailProps {
  /** 当前项目视图 key（dashOpen 时无 active 项目项）。 */
  view: string
  dashOpen: boolean
  hasProject: boolean
  projectName?: string
  counts: NavCountMap
  onPickView: (view: string) => void
  onOpenDash: () => void
  onOpenSettings: () => void
}

export function NavRail({
  view, dashOpen, hasProject, projectName, counts, onPickView, onOpenDash, onOpenSettings,
}: NavRailProps) {
  const [query, setQuery] = useState('')
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => {
    try {
      const raw = localStorage.getItem(COLLAPSE_KEY)
      return raw ? new Set(raw.split(',').filter(Boolean)) : new Set<string>()
    } catch { return new Set<string>() }
  })

  const groups = useMemo(() => {
    const model = buildNavModel(counts, { projectName, hasProject })
    return filterNavGroups(model, query)
  }, [counts, projectName, hasProject, query])

  const toggle = (id: string) => {
    setCollapsed(prev => {
      const next = toggleCollapsed(prev, id)
      try { localStorage.setItem(COLLAPSE_KEY, [...next].join(',')) } catch { /* ignore */ }
      return next
    })
  }

  const renderItem = (item: NavEntry) => {
    const isActive = item.key === 'dash' ? dashOpen : (!dashOpen && view === item.key)
    return (
      <button
        key={item.key}
        type="button"
        disabled={item.disabled}
        aria-disabled={item.disabled || undefined}
        /* W-DEF-005：rail 分组项当前视图用 aria-current="page" 表达选中（导航语义），未选中省略 */
        aria-current={isActive ? 'page' : undefined}
        className={`pm-rail-item${isActive ? ' active' : ''}`}
        onClick={() => {
          if (item.disabled) return
          if (item.key === 'dash') onOpenDash()
          else onPickView(item.key)
        }}
      >
        <span className="pm-rail-ico">{ICONS[item.key]}</span>
        <span className="pm-rail-label">{item.label}</span>
        {item.count !== undefined && <span className="pm-rail-count">{item.count}</span>}
      </button>
    )
  }

  return (
    <aside className="pm-rail" aria-label="主导航">
      <div className="pm-rail-brand">
        <span className="pm-rail-logo" aria-hidden="true">P</span>
        <div>
          <div className="pm-rail-name">PM 工作台</div>
          <div className="pm-rail-sub">DeepSeek Harness</div>
        </div>
      </div>
      <div className="pm-rail-search">
        <Search size={14}/>
        <input
          type="search"
          placeholder="搜索导航…"
          aria-label="搜索导航项"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>
      <nav className="pm-rail-nav">
        {groups.map(g => g.collapsible ? (
          <div key={g.id}>
            <button
              type="button"
              className={`pm-rail-section${collapsed.has(g.id) && !query ? ' collapsed' : ''}`}
              aria-expanded={!(collapsed.has(g.id) && !query)}
              onClick={() => toggle(g.id)}
            >
              <span className="pm-rail-section-title">{g.title}</span>
              <ChevronDown size={14} className="pm-rail-chev"/>
            </button>
            {/* P2-2：折叠组容器独立类名 pm-rail-group-items，避免与副标题 .pm-rail-sub 类名碰撞 */}
            {(!collapsed.has(g.id) || !!query.trim()) && (
              <div className="pm-rail-group-items">{g.items.map(renderItem)}</div>
            )}
          </div>
        ) : (
          <div key={g.id}>
            {g.id === 'project' && <div className="pm-rail-divider" aria-hidden="true"/>}
            <div className="pm-rail-group-label">{g.title}</div>
            {g.items.map(renderItem)}
          </div>
        ))}
      </nav>
      <div className="pm-rail-foot">
        <button type="button" className="pm-rail-item" onClick={onOpenSettings}>
          <span className="pm-rail-ico"><SlidersHorizontal size={17}/></span>
          <span className="pm-rail-label">口径设置</span>
        </button>
      </div>
    </aside>
  )
}

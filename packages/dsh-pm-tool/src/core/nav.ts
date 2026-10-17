/**
 * P2-1 左导航纯模型：分组 / 计数 / 搜索过滤 / 折叠切换。
 * 零 DOM、零墙钟、零 localStorage（持久化由组件读写），便于单测。
 */

/** 导航目标：跨项目看板 'dash' 或九个项目视图 key（与 client View 字面量对齐）。 */
export type NavTarget =
  | 'dash'
  | 'overview' | 'tasks' | 'gantt' | 'milestones' | 'risk-issues' | 'people'
  | 'meetings' | 'reports' | 'deliverables'

/** 各项目视图的现行计数（缺省不显示徽标）。 */
export interface NavCountMap {
  tasks?: number
  milestones?: number
  riskIssues?: number
  meetings?: number
  reports?: number
  deliverables?: number
}

export interface NavEntry {
  key: NavTarget
  label: string
  count?: number
  /** 无项目上下文时置灰（aria-disabled），不可点击。 */
  disabled?: boolean
  /** 搜索附加关键词（标签子串未命中时兜底匹配）。 */
  keywords?: string[]
}

export interface NavGroupModel {
  id: string
  title: string
  /** 是否可折叠（计划与排期 / 协作与记录）；跨项目 / 当前项目为固定组。 */
  collapsible: boolean
  items: NavEntry[]
}

/** 视图中文标签（面包屑与导航同源，避免散落字面量）。 */
export const VIEW_LABELS: Record<string, string> = {
  tasks: '全部任务',
  gantt: '甘特排期',
  milestones: '里程碑',
  'risk-issues': '风险与问题',
  people: '人员负载',
  overview: '项目概览',
  meetings: '会议纪要',
  reports: '进度汇报',
  deliverables: '交付物',
}

/**
 * 组装导航模型。无项目时「项目概览」及两个项目组全部置灰；
 * 计数只挂在有现行数据的视图上，缺省不渲染徽标。
 */
export function buildNavModel(
  counts: NavCountMap,
  opts: { projectName?: string; hasProject: boolean },
): NavGroupModel[] {
  const { projectName, hasProject } = opts
  const projectDisabled = !hasProject
  const num = (n?: number) => (n === undefined ? undefined : Math.max(0, n))

  return [
    {
      id: 'cross',
      title: '跨项目',
      collapsible: false,
      items: [{ key: 'dash', label: '总览看板', keywords: ['dashboard', 'board', '全局'] }],
    },
    {
      id: 'project',
      title: hasProject && projectName ? `当前项目 · ${projectName}` : '当前项目',
      collapsible: false,
      items: [{ key: 'overview', label: '项目概览', disabled: projectDisabled }],
    },
    {
      id: 'plan',
      title: '计划与排期',
      collapsible: true,
      items: [
        { key: 'tasks', label: '全部任务', count: num(counts.tasks), disabled: projectDisabled },
        { key: 'gantt', label: '甘特排期', disabled: projectDisabled, keywords: ['gantt', 'timeline', '时间线'] },
        { key: 'milestones', label: '里程碑', count: num(counts.milestones), disabled: projectDisabled },
        { key: 'risk-issues', label: '风险与问题', count: num(counts.riskIssues), disabled: projectDisabled, keywords: ['risk', 'issue', '风险', '问题'] },
        { key: 'people', label: '人员负载', disabled: projectDisabled, keywords: ['people', '成员', '负载', 'assignee'] },
      ],
    },
    {
      id: 'records',
      title: '协作与记录',
      collapsible: true,
      items: [
        { key: 'meetings', label: '会议纪要', count: num(counts.meetings), disabled: projectDisabled, keywords: ['meeting', '会议', '纪要'] },
        { key: 'reports', label: '进度汇报', count: num(counts.reports), disabled: projectDisabled, keywords: ['report', '汇报', '周报'] },
        { key: 'deliverables', label: '交付物', count: num(counts.deliverables), disabled: projectDisabled, keywords: ['deliverable', '交付', 'artifact'] },
      ],
    },
  ]
}

function matches(entry: NavEntry, q: string): boolean {
  if (!q) return true
  const hay = [entry.label, ...(entry.keywords ?? [])].join(' ').toLocaleLowerCase()
  return hay.includes(q)
}

/** 按搜索词（标签/关键词子串，大小写不敏感）过滤；命中为空的整组隐藏。 */
export function filterNavGroups(groups: NavGroupModel[], query: string): NavGroupModel[] {
  const q = query.trim().toLocaleLowerCase()
  return groups
    .map(g => ({ ...g, items: g.items.filter(item => matches(item, q)) }))
    .filter(g => g.items.length > 0)
}

/** 纯折叠切换：返回新的折叠 id 集合（不就地改 Set）。 */
export function toggleCollapsed(collapsed: ReadonlySet<string>, id: string): Set<string> {
  const next = new Set(collapsed)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  return next
}

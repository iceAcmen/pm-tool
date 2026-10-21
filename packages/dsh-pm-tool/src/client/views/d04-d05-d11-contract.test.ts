/**
 * D-04 任务工具条四段分组（SH-2）/ D-05 编号列恒显可复制句柄（SH-2）/ D-11 交付物反查关联任务（SH-7）
 * 静态合同门（不渲染、不写库、不改 schema）。R 像素与交互采证由独立 QA 在已签名会话完成。
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const tasksTsx = readFileSync(join(here, 'tasks.tsx'), 'utf8')
const tasksCss = readFileSync(join(here, 'tasks.css'), 'utf8')
const dvTsx = readFileSync(join(here, 'deliverables.tsx'), 'utf8')
const dvCss = readFileSync(join(here, 'deliverables.css'), 'utf8')

describe('D-04 任务工具条四段视觉分组 + 密度收末端次要位', () => {
  it('四段 seg 容器齐备：视图切换 / 视图持久化 / 组织 / 数据，密度单独成段', () => {
    for (const cls of ['pt-seg pt-seg-view', 'pt-seg pt-seg-persist', 'pt-seg pt-seg-org', 'pt-seg pt-seg-data', 'pt-seg pt-seg-density']) {
      expect(tasksTsx).toContain(cls)
    }
  })

  it('DOM/Tab 顺序：视图切换 → 持久化(保存) → 组织(分组/排序) → 数据(模板/导入/导出/分享) → 密度', () => {
    const iView = tasksTsx.indexOf('pt-seg-view')
    const iSave = tasksTsx.indexOf('pm-save-view')
    const iGroup = tasksTsx.indexOf('pm-group-toggle')
    const iSort = tasksTsx.indexOf('pm-sort-select')
    const iTpl = tasksTsx.indexOf('pm-import-template')
    // 用 JSX 可见标记定位（shareSnapshot 处理函数在组件上部先定义，不能用其源码位置代表 DOM 顺序）
    const iShare = tasksTsx.indexOf('<Share2 size={14} />分享</button>')
    const iDensity = tasksTsx.indexOf('pt-seg-density')
    expect(iView).toBeGreaterThan(-1)
    expect(iSave).toBeGreaterThan(iView)
    expect(iGroup).toBeGreaterThan(iSave)
    expect(iSort).toBeGreaterThan(iGroup)
    expect(iTpl).toBeGreaterThan(iSort)
    expect(iShare).toBeGreaterThan(iTpl)
    expect(iDensity).toBeGreaterThan(iShare)
  })

  it('CSS：段间 hairline 分隔，密度段收末端（margin-left:auto）并标注全局偏好', () => {
    expect(tasksCss).toContain('.pm-tasks-root .pt-seg')
    expect(tasksCss).toMatch(/\.pt-seg-density\s*\{[^}]*margin-left:\s*auto/)
    expect(tasksTsx).toContain('密度（全局偏好）')
  })

  it('主操作「新建任务」不在工具条内重复造等权按钮（页头 CTA 由 panel 承担）', () => {
    expect(tasksTsx).not.toContain('新建任务</button>')
  })
})

describe('D-05 编号列恒显稳定句柄（code/短 ID），可点击复制并反馈', () => {
  it('句柄恒显：WBS code 优先，缺省回退短 ID（t.id），禁止空白', () => {
    expect(tasksTsx).toContain('const wbs = (t.code ?? \'\').trim()')
    expect(tasksTsx).toContain('const handle = wbs || t.id')
    expect(tasksTsx.match(/\{taskHandleButton\(t\)\}/g)).toHaveLength(2)
  })

  it('复制到剪贴板（经 copyHandleToClipboard）+ 瞬时「已复制」反馈，不回写任务编号', () => {
    expect(tasksTsx).toContain('copyHandleToClipboard')
    expect(tasksTsx).toContain('copyHandle')
    expect(tasksTsx).toContain('已复制')
    expect(tasksTsx).toContain('pt-code-btn')
    expect(tasksTsx).toContain('pt-code-btn-missing')
  })

  it('CSS：句柄等宽、存量短 ID 弱化、可点击 affordance 与焦点环，列内不溢出不叠印', () => {
    expect(tasksCss).toContain('.pm-tasks-root .pt-code-btn')
    expect(tasksCss).toContain('font-family: var(--pm-font-mono)')
    expect(tasksCss).toContain('.pt-code-btn-missing')
    expect(tasksCss).toMatch(/\.pt-code-btn:hover\s*\{/)
    expect(tasksCss).toMatch(/\.pt-code-btn:focus-visible\s*\{/)
    expect(tasksCss).toContain('text-overflow: ellipsis')
  })

  it('既有编号列宽固定，不挤压任务名（grid 62px 列保留）', () => {
    expect(tasksCss).toMatch(/grid-template-columns:[^;]*62px/)
  })

  it('【Minor 返修】writeText reject/缺失不得假成功：仅 resolve 才报已复制，失败给温和手动复制提示', () => {
    expect(tasksTsx).toContain('copyHandleToClipboard')
    expect(tasksTsx).toContain('复制失败')
    // 不再无条件在调用前 setCopiedHandleId；成功态由 Promise resolve 后设置。
    expect(tasksTsx).not.toContain('navigator.clipboard?.writeText(value).catch(() => {})')
  })
})

describe('D-11 交付物侧只读反查关联任务（零 schema、不回写）', () => {
  it('经 collectTaskMaterials 的 deliverableId 建反查映射，状态用 taskStatusLabels', () => {
    expect(dvTsx).toContain('collectTaskMaterials')
    expect(dvTsx).toContain('linkedByDeliverable')
    expect(dvTsx).toContain("mat.kind !== 'deliverable'")
    expect(dvTsx).toContain('taskStatusLabels')
  })

  it('卡片展示「关联任务」：句柄 + 状态 + 标题；无关联诚实显示「暂无关联任务」', () => {
    expect(dvTsx).toContain('关联任务')
    expect(dvTsx).toContain('暂无关联任务')
    expect(dvTsx).toContain('dv-d-task-handle')
    expect(dvTsx).toContain('dv-d-task-title')
  })

  it('SH-3 接缝可选 onGotoTask 跳转，未接线时静态展示不报错', () => {
    expect(dvTsx).toContain('onGotoTask?: (taskId: string) => void')
    expect(dvTsx).toContain('onGotoTask ?')
  })

  it('CSS：反查块句柄等宽、状态 chip、标题省略，链接有 hover/焦点 affordance', () => {
    expect(dvCss).toContain('.pm-dv-root .dv-d-tasks')
    expect(dvCss).toContain('.dv-d-task-link')
    expect(dvCss).toMatch(/\.dv-d-task-link:hover\s*\{/)
    expect(dvCss).toMatch(/\.dv-d-task-link:focus-visible\s*\{/)
  })

  it('零 schema：不新增交付物字段、不回写任务（视图只读取 tasks，无 setTasks/写盘调用）', () => {
    expect(dvTsx).not.toContain('setTasks(')
    expect(dvTsx).not.toContain('deliverableId:')
  })

  it('【Minor 返修】关联任务按钮点击必须阻止冒泡，仅开任务抽屉、不触发卡片 openEdit（事件契约）', () => {
    // 卡片级 openEdit 保持在卡片 div 上。
    expect(dvTsx).toContain('onClick={() => openEdit(d)}')
    // 内联任务跳转按钮先 stopPropagation 再 onGotoTask，且键盘事件同样止泡。
    const btnBlock = dvTsx.slice(dvTsx.indexOf('dv-d-task-link'))
    expect(btnBlock).toContain('e.stopPropagation()')
    expect(btnBlock).toContain('onGotoTask(lt.id)')
    expect(btnBlock).toContain('onKeyDown')
  })
})

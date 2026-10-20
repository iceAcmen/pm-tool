/**
 * D-06 任务抽屉骨架静态合同门（C-04 唯一主操作 / C-08 抽屉骨架 / 资料网格标签常驻）。
 * 无 jsdom，源码级断言：子区「追加进展/保存修订」不得再用 pm-button-primary；
 * footer 唯一主操作=保存更改/添加任务；资料表单常驻 label，不用 placeholder 兼标签。
 * 真实渲染/旅程由隔离 GUI 与独立 R 复验，本测试不替代截图。
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const draftSrc = readFileSync(resolve(HERE, 'task-draft-materials.tsx'), 'utf-8')
const editorSrc = readFileSync(resolve(HERE, 'task-materials-editor.tsx'), 'utf-8')
const panelSrc = readFileSync(resolve(HERE, '..', 'panel.tsx'), 'utf-8')
const panelCss = readFileSync(resolve(HERE, '..', 'panel.css'), 'utf-8')

describe('C-04 一个抽屉仅一个视觉主按钮：子区追加/保存修订降级为次按钮', () => {
  it('草稿面板「追加进展（草稿）」不再是 pm-button-primary', () => {
    // 按钮文案存在，但不得携带 primary 修饰。
    expect(draftSrc).toContain('追加进展（草稿）')
    const addBtn = /<button[^>]*onClick=\{addProgress\}[^>]*>[\s\S]*?追加进展（草稿）/.exec(draftSrc)
    expect(addBtn, '应定位到追加进展按钮').toBeTruthy()
    expect(addBtn![0]).not.toContain('pm-button-primary')
  })

  it('草稿面板内联「保存修订」不再是 pm-button-primary', () => {
    expect(draftSrc).toContain('保存修订')
    const saveEdit = /<button[^>]*onClick=\{saveEdit\}[^>]*>[\s\S]*?保存修订/.exec(draftSrc)
    expect(saveEdit, '应定位到保存修订按钮').toBeTruthy()
    expect(saveEdit![0]).not.toContain('pm-button-primary')
  })

  it('即时写编辑器「追加进展」「保存修订」均不再是 pm-button-primary', () => {
    const add = /<button[^>]*onClick=\{submitProgressAdd\}[^>]*>[\s\S]*?追加进展/.exec(editorSrc)
    expect(add, '应定位到即时写追加进展按钮').toBeTruthy()
    expect(add![0]).not.toContain('pm-button-primary')
    const rev = /<button[^>]*onClick=\{\(\) => submitEdit\(entry\.id\)\}[^>]*>[\s\S]*?保存修订/.exec(editorSrc)
    expect(rev, '应定位到即时写保存修订按钮').toBeTruthy()
    expect(rev![0]).not.toContain('pm-button-primary')
  })

  it('TaskForm footer 唯一 primary = 保存更改/添加任务', () => {
    const footer = /<div className="pm-drawer-actions">([\s\S]*?)<\/div>\s*<\/form>/.exec(panelSrc)
    expect(footer, '应定位到 TaskForm footer').toBeTruthy()
    const primaries = footer![1].match(/pm-button-primary/g) ?? []
    expect(primaries).toHaveLength(1)
    expect(footer![1]).toMatch(/保存更改|添加任务/)
  })
})

describe('D-06 资料区网格化、标签常驻（不用 placeholder 兼标签）', () => {
  it('草稿面板链接/交付物表单带常驻 label 字段', () => {
    expect(draftSrc).toMatch(/<label[^>]*>[\s\S]*?资料链接/)
    expect(draftSrc).toMatch(/<label[^>]*>[\s\S]*?交付物/)
  })

  it('资料表单 CSS 走网格/规整排布，控件对齐不挤作一团', () => {
    expect(panelCss).toMatch(/\.pm-mat-form\s*\{[^}]*display:\s*grid/)
  })
})

describe('公共接缝接线（依赖交付物，panel 只消费不另造）', () => {
  it('D-11：DeliverableTable 以类型化 onGotoTask 透传，不再 spread cast', () => {
    const block = /<DeliverableTable([\s\S]*?)\/>/.exec(panelSrc)
    expect(block, '应定位到 DeliverableTable 挂载').toBeTruthy()
    expect(block![1]).toContain('onGotoTask={gotoTaskFromDeliverable}')
    expect(block![1]).not.toContain('as Record<string, unknown>')
  })

  it('D-07/D-08：GanttView 接收 onOpenMilestone，find 失败诚实反馈不打开 undefined', () => {
    expect(panelSrc).toContain('onOpenMilestone={openMilestoneFromGantt}')
    expect(panelSrc).toMatch(/openMilestoneFromGantt[\s\S]*?未找到里程碑/)
  })

  it('D-10：旧报告管理摘要消费 MarkdownEditor，保存走 sanitizeMarkdownDraft 不双清', () => {
    expect(panelSrc).toContain('<MarkdownEditor')
    expect(panelSrc).toMatch(/executiveSummary:\s*sanitizeMarkdownDraft\(summary\)/)
  })
})

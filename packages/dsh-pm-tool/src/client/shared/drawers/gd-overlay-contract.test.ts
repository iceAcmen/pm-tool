/**
 * G-D「目标与 AI 生产迁移」静态合同门（无浏览器/jsdom，node 纯读源码）。
 *
 * 覆盖实体抽离边界与不可降级语义：
 *  - panel.tsx 只挂载，不再内联定义 AiAssistant / CopilotPanel / LaneSwitcher；
 *  - AI 助手：确认后入库、失败保输入（catch 不清 text/preview）、成功走 Receipt；
 *  - AI 副驾：旧值→新值 diff、非法行禁用整批/逐步、取消只清本地（零写）、失败保草稿；
 *  - 口径设置：13 字段纯校验、成功 Receipt、失败保输入。
 * 本文件只做结构/合同断言，行为级纯逻辑由 okr-model/habit-model/settings-drawer 单测覆盖。
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const panelTsx = readFileSync(join(here, '..', '..', 'panel.tsx'), 'utf-8')
const assistant = readFileSync(join(here, 'ai-assistant.tsx'), 'utf-8')
const sidecar = readFileSync(join(here, 'sidecar-portal.tsx'), 'utf-8')
const settings = readFileSync(join(here, 'settings-drawer.tsx'), 'utf-8')
const lane = readFileSync(join(here, 'model-lane.tsx'), 'utf-8')

describe('G-D 实体抽离边界（panel 只挂载，覆盖层独立成文件）', () => {
  it('panel.tsx 从 shared/drawers 导入 AiAssistant 与 CopilotPanel', () => {
    expect(panelTsx).toContain("from './shared/drawers/ai-assistant.js'")
    expect(panelTsx).toContain("from './shared/drawers/sidecar-portal.js'")
  })

  it('panel.tsx 不再内联定义三个抽离组件', () => {
    expect(panelTsx).not.toContain('function AiAssistant(')
    expect(panelTsx).not.toContain('function CopilotPanel(')
    expect(panelTsx).not.toContain('function LaneSwitcher(')
    expect(assistant).toContain('export function AiAssistant(')
    expect(sidecar).toContain('export function CopilotPanel(')
    expect(lane).toContain('export function LaneSwitcher(')
  })
})

describe('AI 助手：确认后入库 / 失败保输入 / 成功 Receipt', () => {
  it('生成失败 catch 只 setError，不清空 text/preview（保输入可重试）', () => {
    const genBlock = assistant.slice(assistant.indexOf('const generate = async'), assistant.indexOf('const confirm = async'))
    // 只取 catch 块（generate 开头的 setPreview('') 是新一轮生成前清旧预览，非失败清输入）。
    const genCatch = /catch \(error\) \{[\s\S]*?\}\s*finally/.exec(genBlock)?.[0] ?? ''
    expect(genCatch).toContain('setError(')
    expect(genCatch).not.toContain("setText('')")
    expect(genCatch).not.toContain("setPreview('')")
  })

  it('确认成功后才 setConfirmed 并渲染 Receipt；按钮文案「确认入库」', () => {
    expect(assistant).toContain('确认入库')
    expect(assistant).toContain('setConfirmed(')
    expect(assistant).toContain('<Receipt')
    // 确认命令不调模型：wbs 走 importmd confirm / narrateuse / summarize confirm。
    expect(assistant).toContain('importmd')
    expect(assistant).toContain('narrateuse')
    expect(assistant).toContain('summarize')
  })

  it('失败错误走 ErrorBlock（what/howToFix/重试），不清旧数据', () => {
    expect(assistant).toContain('<ErrorBlock')
    expect(assistant).toContain('howToFix')
    expect(assistant).toContain('onRetry')
  })
})

describe('AI 副驾：diff / 非法行禁用 / 取消零写 / 失败保草稿', () => {
  it('实体更新展示 旧值 → 新值 diff，新建只列新值', () => {
    expect(sidecar).toContain('pm-copilot-entity-from')
    expect(sidecar).toContain('pm-copilot-entity-to')
    expect(sidecar).toContain('→')
  })

  it('非法行（validateActions rejected）禁用整批/逐步执行按钮', () => {
    expect(sidecar).toContain('invalidStepIds')
    expect(sidecar).toContain('validateActions(')
    expect(sidecar).toMatch(/disabled=\{busy \|\| anyInvalid/)
  })

  it('取消（clearPlan）只清本地步骤，不发任何命令（零写）', () => {
    const m = /const clearPlan = \(\) => \{[^}]*\}/.exec(sidecar)
    expect(m, 'clearPlan 定义存在').not.toBeNull()
    expect(m![0]).not.toContain('execute(')
    expect(m![0]).toContain('setSteps([])')
  })

  it('执行失败 catch 只追加错误消息，不清空步骤（草稿保留可改）', () => {
    const applyCatch = sidecar.slice(sidecar.indexOf('const runApply = async'), sidecar.indexOf('const editablePatch'))
    expect(applyCatch).toContain('执行失败：')
    expect(applyCatch).not.toContain('setSteps([])')
  })
})

describe('口径设置：13 字段校验 / 成功 Receipt / 失败保输入', () => {
  it('复用 SETTING_FIELDS 与纯校验 validateSettingsValues', () => {
    expect(settings).toContain('SETTING_FIELDS')
    expect(settings).toContain('validateSettingsValues(')
  })

  it('保存成功展示绿色 Receipt；校验失败仅提示不覆盖已输入值', () => {
    expect(settings).toContain('<Receipt')
    const saveBody = settings.slice(settings.indexOf('const save = async'), settings.indexOf('const resetAll'))
    expect(saveBody).toContain('validateAll()')
    // 失败分支只 notify，不 setValues 清空。
    expect(saveBody).not.toMatch(/setValues\([^)]*\[\]|setValues\(\{\}\)/)
  })
})

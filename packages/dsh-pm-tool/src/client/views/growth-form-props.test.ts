import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import {
  prefillOkrForm,
  prefillHabitForm,
} from './growth-form-props.js'
import { validateOkrForm, validateHabitForm } from '../form-validation.js'

// B7 growth 前端边界：既有 okr/habit CRUD/checkin/confirm 全在命令通道，本片只交付
// 可注入的表单 props 契约 + 预填纯函数，不重造抽屉、不新增 AI 白名单、不直接改数据。

const HERE = dirname(fileURLToPath(import.meta.url))
const read = (rel: string) => readFileSync(resolve(HERE, rel), 'utf8')

describe('B7 prefillOkrForm：编辑预填映射，不回写 id/projectId', () => {
  it('把既有 OKR 记录映射为表单值，relatedOkrIds 逗号拼接，缺键留空不崩', () => {
    const v = prefillOkrForm({
      id: 'o1', projectId: 'p1', title: '目标 A', kind: 'objective',
      primaryOkrId: null, relatedOkrIds: ['o2', 'o3'], owner: '张三',
      targetDate: '2026-12-31', status: 'draft', description: '描述',
    })
    expect(v).toEqual({
      title: '目标 A', kind: 'objective', owner: '张三', targetDate: '2026-12-31',
      primaryOkrId: '', relatedOkrIds: 'o2,o3', status: 'draft', description: '描述',
    })
    expect('id' in v).toBe(false)
    expect('projectId' in v).toBe(false)
  })

  it('KR 携带父目标；旧记录缺 owner/targetDate/description 留空合法', () => {
    const v = prefillOkrForm({
      id: 'k1', projectId: 'p1', title: 'KR', kind: 'key-result',
      primaryOkrId: 'o1', relatedOkrIds: [], status: 'confirmed',
    })
    expect(v.primaryOkrId).toBe('o1')
    expect(v.relatedOkrIds).toBe('')
    expect(v.owner).toBeUndefined()
    expect(v.targetDate).toBeUndefined()
    expect(v.description).toBeUndefined()
  })
})

describe('B7 prefillHabitForm：映射可编辑字段，状态由确认通道决定、不进表单', () => {
  it('title/goal/frequency/notes/okrId 映射，status/checkIns/streak 不泄漏进表单', () => {
    const v = prefillHabitForm({
      id: 'h1', projectId: 'p1', title: '晨跑', status: 'confirmed',
      goal: '5km', frequency: '每天', notes: '空腹', okrId: 'o1',
      checkIns: [], streak: { current: 3, longest: 7, totalDays: 30 },
    })
    expect(v).toEqual({ title: '晨跑', goal: '5km', frequency: '每天', notes: '空腹', okrId: 'o1' })
    expect('status' in v).toBe(false)
    expect('checkIns' in v).toBe(false)
    expect('streak' in v).toBe(false)
  })
})

describe('B7 边界守卫：视图走命令通道确认/打卡，不新增 AI 白名单', () => {
  it('okrs 视图 confirm/ignore 经 run() 命令，不伪造建议', () => {
    const src = read('./okrs.tsx')
    expect(src).toContain('okr confirm')
    expect(src).toContain('okr ignore')
    expect(src).toContain('run(')
    expect(src).not.toMatch(/copilot|ALLOWED_OPS/)
  })

  it('habits 视图 checkin（今天/过去2天）/confirm/ignore 经命令，streak 纯文本不重算', () => {
    const src = read('./habits.tsx')
    expect(src).toContain('habit checkin')
    expect(src).toContain('habit confirm')
    expect(src).toContain('habit ignore')
    expect(src).toContain('run(')
    expect(src).not.toMatch(/copilot|ALLOWED_OPS/)
  })

  it('core/copilot 白名单不含 okr/habit 写（AI 只读投影，未授权写）', () => {
    const copilot = read('../../core/copilot.ts')
    expect(/okr/i.test(copilot)).toBe(false)
    expect(/habit/i.test(copilot)).toBe(false)
  })
})

describe('B7 独立表单组件：受控草稿 + 校验，不发命令、不直写 store', () => {
  it('okr-form 复用 validateOkrForm、只经 onSubmit 交值，内部无 run/命令串', () => {
    const src = read('./okr-form.tsx')
    expect(src).toContain('validateOkrForm')
    expect(src).toContain('onSubmit')
    // 剥掉注释行后，不得出现真实命令执行/直写 store
    const code = src.split('\n').filter(l => !l.trim().startsWith('*') && !l.trim().startsWith('//')).join('\n')
    expect(code).not.toMatch(/\brun\s*\(|\bstore\.\w+\s*=|execute\s*\(/)
    expect(code).not.toMatch(/import\s*\{[^}]*\brun\b/)
  })

  it('habit-form 复用 validateHabitForm、只经 onSubmit 交值，不设 status/streak', () => {
    const src = read('./habit-form.tsx')
    expect(src).toContain('validateHabitForm')
    expect(src).toContain('onSubmit')
    const code = src.split('\n').filter(l => !l.trim().startsWith('*') && !l.trim().startsWith('//')).join('\n')
    expect(code).not.toMatch(/\brun\s*\(|\bstore\.\w+\s*=|execute\s*\(/)
    expect(code).not.toMatch(/import\s*\{[^}]*\brun\b/)
    expect(code).not.toContain('streak:')
  })

  it('growth-form.css 零裸色，全部走 token', () => {
    const css = read('./growth-form.css')
    const hits = css.split('\n').filter(l =>
      /#[0-9a-fA-F]{3,8}\b|rgba?\s*\(/.test(l.replace(/var\([^)]*\)/g, '')))
    expect(hits).toEqual([])
  })

  it('校验器真实拦截空标题/超长/非法 okrId（组件复用同一函数）', () => {
    expect(validateOkrForm({ title: '', kind: 'objective' }).title).toBeTruthy()
    expect(validateHabitForm({ title: '' }).title).toBeTruthy()
    expect(validateHabitForm({ title: 'x', okrId: 'bad id!' }).okrId).toBeTruthy()
  })

  it('OKR/habit 选择复用 records-listbox（import-only，选项由 props 注入，不造名册）', () => {
    const okr = read('./okr-form.tsx')
    const habit = read('./habit-form.tsx')
    expect(okr).toContain("from './records/records-listbox.js'")
    expect(habit).toContain("from './records/records-listbox.js'")
    expect(okr).toContain('ownerOptions')
    expect(okr).toContain('primaryOptions')
    expect(habit).toContain('okrOptions')
    // 缺失选项时退回输入，不强制内置成员清单
    expect(okr).toContain('ownerOptions &&')
    expect(habit).toContain('okrOptions &&')
  })
})

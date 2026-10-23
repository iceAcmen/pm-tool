import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

export const originalTestSha = '06b0de03361b8003f101595be145e1c645b5b02666e08a0ffa093e6d00246e4f'
export const sha = data => createHash('sha256').update(data).digest('hex')

// Test-only contract correction. No production code or old test is written.
export function adaptC02(original) {
  assert.equal(sha(original), originalTestSha)
  const before = `    await mount(['t-0002']); assertSelection(['t-0002'])
    await fill('.pm-pred-search', '候选任务1'); assertSelection(['t-0002'])
    await fill('.pm-pred-search', ''); assertSelection(['t-0002'])
    const cancel = [...container.querySelectorAll('button')].find(n => n.textContent === '取消')
    expect(cancel, 'fixture clean cancel').toBeDefined()
    await act(async () => { cancel!.click() })
    expect(calls).toEqual([{ kind: 'onCancel' }])`
  const after = `    await mount(['t-0002']); assertSelection(['t-0002'])
    const fixtureBefore = digest(records)
    await fill('.pm-pred-search', '候选任务1')
    const hidden = observe('C02-adapted-hidden-before-restore')
    expect(hidden.formPresent).toBe(true)
    expect(caught).toEqual([])
    expect(hidden.checkboxes).toEqual([{ id: 't-0001', checked: false, type: 'checkbox' }])
    expect(hidden.selected, '原生 FormData 仅表示可见控件，不冒完整提交集合').toEqual([])
    expect(hidden.footer).toBe('已选 1 项')
    expect(calls).toEqual([])
    expect(digest(records)).toBe(fixtureBefore)
    await fill('.pm-pred-search', ''); assertSelection(['t-0002'])
    const cancel = [...container.querySelectorAll('button')].find(n => n.textContent === '取消')
    expect(cancel, 'fixture clean cancel').toBeDefined()
    await act(async () => { cancel!.click() })
    expect(calls).toEqual([{ kind: 'onCancel' }])
    expect(digest(records)).toBe(fixtureBefore)
    observe('C02-adapted-clean-cancel-complete')

    // Separate remount: actual submit capture, not part of the zero-write cancel phase.
    await act(async () => { root!.unmount(); root = undefined })
    calls = []
    await mount(['t-0002'])
    const submitFixture = digest(records)
    await fill('.pm-pred-search', '候选任务1')
    const beforeSubmit = observe('C02-adapted-hidden-before-real-submit')
    expect(beforeSubmit.selected).toEqual([])
    expect(beforeSubmit.footer).toBe('已选 1 项')
    expect(calls).toEqual([])
    const form = container.querySelector<HTMLFormElement>('form.pm-drawer-form')!
    let submitCount = 0
    form.addEventListener('submit', () => { submitCount++ })
    const save = [...container.querySelectorAll('button')].find(n => n.textContent === '保存更改')
    expect(save).toBeDefined()
    expect(save!.disabled).toBe(false)
    await act(async () => { save!.click() })
    expect(submitCount).toBe(1)
    expect(calls.map(c => c.kind)).toEqual(['run'])
    const match = /^task update (t-\\d+) ([\\s\\S]+)$/.exec(calls[0].line)
    expect(match).not.toBeNull()
    expect(match![1]).toBe('t-0004')
    const payload = JSON.parse(match![2])
    expect(payload.predecessorIds, '业务合同：真实 submit 保完整受控 t2').toEqual(['t-0002'])
    expect(payload.title).toBe('已有任务四')
    expect(caught).toEqual([])
    expect(container.querySelector('form.pm-drawer-form')).not.toBeNull()
    expect(digest(records)).toBe(submitFixture)
    events.push({ label: 'C02-adapted-real-payload-mapping', submitCount,
      beforeFormData: beforeSubmit.selected, footer: beforeSubmit.footer, payload,
      boundary: '真实主 submit 捕获，run=false；不冒 handler/core/JSON/GUI' })`
  assert.equal(original.split(before).length, 2, 'C02 body must match exactly once')
  const adapted = original.replace(before, after)
  assert.equal(adapted.replace(after, before), original, 'Only C02 body replaced')
  return { before, after, adapted, originalSha256: sha(original), adaptedSha256: sha(adapted),
    otherSixAndAllHelpersUnchanged: true,
    scope: 'C02 DOM artifact recorded; restore/clean cancel completed; separate remount real payload capture',
    productionCodeTransform: 'export TaskForm only', oldTestWritten: false }
}

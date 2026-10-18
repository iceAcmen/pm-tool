import { describe, it, expect } from 'vitest'
import { splitLegacyCommandNote } from './legacy-note.js'

describe('R8 旧持久正文历史命令尾注隔离', () => {
  it('剥离中文前缀「确认命令：/pm report narrate … confirm」尾注，正文保留', () => {
    const raw = [
      '## 本期进展',
      '完成了核心模块交付，风险可控。',
      '确认命令：/pm report narrate p-0005 confirm',
    ].join('\n')
    const r = splitLegacyCommandNote(raw)
    expect(r.legacyCommands).toEqual(['/pm report narrate p-0005 confirm'])
    expect(r.body).toContain('完成了核心模块交付，风险可控。')
    expect(r.body).not.toContain('确认命令')
    expect(r.body).not.toContain('narrate')
  })

  it('剥离整行裸命令尾注（report narrate / meeting summarize … confirm）', () => {
    const raw = '结论：下周收尾。\n/pm report narrate p-0005 confirm\n'
    const r = splitLegacyCommandNote(raw)
    expect(r.legacyCommands).toEqual(['/pm report narrate p-0005 confirm'])
    expect(r.body).toBe('结论：下周收尾。')

    const r2 = splitLegacyCommandNote('纪要如下。\n/pm meeting summarize p-0001 t123 confirm')
    expect(r2.legacyCommands).toEqual(['/pm meeting summarize p-0001 t123 confirm'])
    expect(r2.body).toBe('纪要如下。')
  })

  it('代码围栏内同型命令原样保留，不误删', () => {
    const raw = [
      '正文见下。',
      '```',
      '/pm report narrate p-0005 confirm',
      '```',
      '收尾说明。',
    ].join('\n')
    const r = splitLegacyCommandNote(raw)
    expect(r.legacyCommands).toEqual([])
    expect(r.body).toContain('/pm report narrate p-0005 confirm')
  })

  it('句子中夹叙的命令、非 confirm 命令、引用行一律不动', () => {
    const raw = [
      '可参考 /pm report list 查看历史，不必执行。',
      '> /pm report narrate p-0005 confirm（这是引用示例）',
      '另：/pm report get p-0005 是查询命令。',
    ].join('\n')
    const r = splitLegacyCommandNote(raw)
    expect(r.legacyCommands).toEqual([])
    expect(r.body).toBe(raw)
  })

  it('无尾注时 body 原样返回、legacyCommands 为空；空输入安全', () => {
    const plain = '干净的执行摘要，不含任何命令。'
    const r = splitLegacyCommandNote(plain)
    expect(r.legacyCommands).toEqual([])
    expect(r.body).toBe(plain)
    expect(splitLegacyCommandNote('')).toEqual({ body: '', legacyCommands: [] })
  })

  it('多条尾注全部隔离，正文规整多余空行', () => {
    const raw = [
      '第一段。',
      '',
      '',
      '确认命令：/pm report narrate p-0005 confirm',
      '/pm meeting summarize p-0001 abc confirm',
    ].join('\n')
    const r = splitLegacyCommandNote(raw)
    expect(r.legacyCommands).toHaveLength(2)
    expect(r.body).toBe('第一段。')
  })
})

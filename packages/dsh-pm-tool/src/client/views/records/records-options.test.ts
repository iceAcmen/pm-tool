import { describe, it, expect } from 'vitest'
import {
  MEETING_STATUS_OPTIONS,
  DELIVERABLE_STATUS_OPTIONS,
  REPORT_SOURCE_OPTIONS,
  optionLabel,
  filterOptions,
  moveHighlight,
  indexOfValue,
} from './records-options.js'

describe('状态选项与 core 真源一致，不另造状态词', () => {
  it('会议两态；交付物五态（含 wrapped 已收尾，人可手动写入）', () => {
    expect(MEETING_STATUS_OPTIONS.map(o => o.value)).toEqual(['draft', 'final'])
    expect(DELIVERABLE_STATUS_OPTIONS.map(o => o.value))
      .toEqual(['planned', 'in_progress', 'submitted', 'accepted', 'wrapped'])
    expect(optionLabel(DELIVERABLE_STATUS_OPTIONS, 'wrapped')).toBe('已收尾')
  })
  it('optionLabel 命中中文；未知值原样回显；空值返回空串', () => {
    expect(optionLabel(MEETING_STATUS_OPTIONS, 'final')).toBe('已定稿')
    expect(optionLabel(MEETING_STATUS_OPTIONS, 'xx')).toBe('xx')
    expect(optionLabel(MEETING_STATUS_OPTIONS, null)).toBe('')
  })
  it('U5 汇报来源两态 manual/session，label 为手动撰写/会话生成', () => {
    expect(REPORT_SOURCE_OPTIONS.map(o => o.value)).toEqual(['manual', 'session'])
    expect(optionLabel(REPORT_SOURCE_OPTIONS, 'manual')).toBe('手动撰写')
    expect(optionLabel(REPORT_SOURCE_OPTIONS, 'session')).toBe('会话生成')
    expect(filterOptions(REPORT_SOURCE_OPTIONS, '会话').map(o => o.value)).toEqual(['session'])
  })
})

describe('filterOptions：不区分大小写匹配 label/hint/value，空词全量', () => {
  const opts = [
    { value: 'a', label: '林澜', hint: '项目负责人' },
    { value: 'b', label: '陈屿', hint: '前端' },
  ]
  it('按中文姓名/角色子串过滤', () => {
    expect(filterOptions(opts, '林').map(o => o.value)).toEqual(['a'])
    expect(filterOptions(opts, '前端').map(o => o.value)).toEqual(['b'])
  })
  it('空词返回全量且为新对象副本', () => {
    const out = filterOptions(opts, '  ')
    expect(out.map(o => o.value)).toEqual(['a', 'b'])
    expect(out[0]).not.toBe(opts[0])
  })
  it('交付物 wrapped 可按中文「已收尾」/ value「wrapped」/ hint 过滤命中', () => {
    expect(filterOptions(DELIVERABLE_STATUS_OPTIONS, '已收尾').map(o => o.value)).toEqual(['wrapped'])
    expect(filterOptions(DELIVERABLE_STATUS_OPTIONS, 'wrapped').map(o => o.value)).toEqual(['wrapped'])
    expect(filterOptions(DELIVERABLE_STATUS_OPTIONS, '收尾').map(o => o.value)).toEqual(['wrapped'])
  })
})

describe('moveHighlight：环形移动，空列表 -1', () => {
  it('上移越界回卷到末项，下移到首项，空列表保持 -1', () => {
    expect(moveHighlight(0, 3, -1)).toBe(2)
    expect(moveHighlight(2, 3, 1)).toBe(0)
    expect(moveHighlight(-1, 3, 1)).toBe(0)
    expect(moveHighlight(0, 0, 1)).toBe(-1)
  })
})

describe('indexOfValue：按 value 定位，无匹配 -1', () => {
  it('命中返回索引，空值/无匹配 -1', () => {
    expect(indexOfValue(DELIVERABLE_STATUS_OPTIONS, 'submitted')).toBe(2)
    expect(indexOfValue(DELIVERABLE_STATUS_OPTIONS, 'wrapped')).toBe(4)
    expect(indexOfValue(DELIVERABLE_STATUS_OPTIONS, null)).toBe(-1)
  })
})

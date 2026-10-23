// 执行器只把本新test复制到独占tmp/src/client；产品组件/Markdown/原tests不改。
import fs from 'node:fs'
import { createElement } from 'react'
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, expect, it, vi } from 'vitest'
import { CopilotPanel } from './shared/drawers/sidecar-portal.js'

const transcript = JSON.parse(fs.readFileSync(process.env.PREFIX_TRANSCRIPT!, 'utf8')) as {
  auth: { kind: string; text: string }; rate: { kind: string; text: string }; normal: { kind: string; text: string };
}
let mounted: ReactTestRenderer | undefined
const visibleText = (n: ReactTestInstance): string => n.children.map(c => typeof c === 'string' ? c : visibleText(c)).join('')
const cases = [
  ['P-AUTH', transcript.auth, transcript.auth.text],
  ['P-RATE-PREFIX', transcript.rate, transcript.rate.text],
  ['C-RAW', { kind: 'error', text: 'Failed to fetch\n完整传输原因' }, '副驾暂不可用：Failed to fetch\n完整传输原因'],
  ['C-COLON', { kind: 'error', text: '副驾暂不可用:完整传输原因' }, '副驾暂不可用:完整传输原因'],
  ['C-SUCCESS', transcript.normal, transcript.normal.text],
] as const

afterEach(() => {
  if (mounted) act(() => mounted!.unmount())
  mounted = undefined
  vi.unstubAllGlobals()
})

it.each(cases)('%s 真实组件保完整原因且同场景前缀仅一次', async (id, response, expected) => {
  vi.stubGlobal('fetch', () => { throw new Error('本专项禁止网络') })
  const calls: string[] = []
  const writes: string[] = []
  const saved = vi.fn()
  let next = response
  const execute = async (line: string) => {
    calls.push(line)
    if (line === 'model status') return '当前模式：prod'
    if (line === 'ask-provenance p-0001') return '{"entries":[]}'
    if (!line.startsWith('ask p-0001 ')) {
      writes.push(line)
      throw new Error(`未授权命令：${line}`)
    }
    // 仅传输替身，原index.tsx对command.kind=error也抛原文Error，不替模型分类/生成。
    if (next.kind === 'error') throw new Error(next.text)
    return next.text
  }
  const executeRaw = async (line: string) => {
    writes.push(line)
    throw new Error(`本专项禁止写命令：${line}`)
  }
  await act(async () => {
    mounted = create(createElement(CopilotPanel, {
      projectId: 'p-0001', tasks: [], milestones: [], riskIssues: [], deliverables: [], meetings: [],
      baselineMap: {}, execute, executeRaw, disabled: false, onSaved: saved, mode: 'diagnosis',
    }))
  })
  const find = (key: string, value: unknown) => mounted!.root.findByProps({ [key]: value })
  const send = async (q: string) => {
    act(() => find('className', 'pm-copilot-input').props.onChange({ target: { value: q } }))
    expect(find('aria-label', '发送').props.disabled).toBe(false)
    await act(async () => { find('aria-label', '发送').props.onClick() })
  }
  await send(`专项只读问题 ${id}`)
  const bubbles = () => mounted!.root.findAllByProps({ className: 'pm-copilot-bubble pm-copilot-ai' })
  const actual = visibleText(bubbles()[0])
  const unlocked = find('className', 'pm-copilot-input').props.disabled === false
  const placeholderRemoved = !visibleText(mounted!.root).includes('思考中')
  expect(writes).toEqual([])
  expect(saved).not.toHaveBeenCalled()
  expect(unlocked).toBe(true)
  expect(placeholderRemoved).toBe(true)
  expect(bubbles()).toHaveLength(1)
  next = transcript.normal
  await send(`专项健康后续 ${id}`)
  const recovered = visibleText(bubbles()[1])
  expect(recovered).toBe(transcript.normal.text)
  expect(writes).toEqual([])
  expect(saved).not.toHaveBeenCalled()
  expect(calls).toEqual([
    'model status', 'ask-provenance p-0001',
    `ask p-0001  ${JSON.stringify(`专项只读问题 ${id}`)}`,
    `ask p-0001  ${JSON.stringify(`专项健康后续 ${id}`)}`,
  ])
  fs.appendFileSync(process.env.PREFIX_OBSERVATIONS!, JSON.stringify({
    id, input: response, expected, actual, recovered, calls, writes,
    savedCalls: saved.mock.calls.length, unlocked, placeholderRemoved,
    layer: 'real component AUTO; not GUI or backend terminal/zero-write proof',
  }) + '\n')
  expect(actual).toBe(expected)
})

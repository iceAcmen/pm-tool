import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { isDeepStrictEqual } from 'node:util'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'docs/testing/p1-l2-events-gui-review-20261023-r1'
const evidence = 'reports/all-pending-evidence-20261021/'
const p1 = evidence + 'P1L2EventsR1/'
const supplement = evidence + 'P1L2EventsReceiptSupplementR1/'
const combined = evidence + 'CombinedSuccessor114R1/'
const gui = evidence + 'Successor114GuiR1/'
const inputs = {}
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex')
function read(relative) {
  if (path.isAbsolute(relative) || relative.split('/').includes('..')) throw new Error('Unsafe input path')
  const target = path.join(root, relative)
  if (!fs.lstatSync(target).isFile()) throw new Error(`Not a regular file: ${relative}`)
  const bytes = fs.readFileSync(target)
  inputs[relative] = { bytes: bytes.length, sha256: sha(bytes) }
  return bytes
}
const json = relative => JSON.parse(read(relative).toString('utf8'))
function write(suffix, value) {
  const target = path.join(root, prefix + suffix)
  if (fs.existsSync(target)) throw new Error(`Refusing overwrite: ${target}`)
  fs.writeFileSync(target, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' })
}
function checkIndex(base, selected) {
  const index = json(base + 'index-r1.json')
  const entries = index.files ?? index
  const names = selected ?? Object.keys(entries)
  const rows = names.map(name => {
    if (!entries[name]?.sha256) throw new Error(`Missing sealed row: ${name}`)
    read(base + name)
    const actual = inputs[base + name]
    return { name, declared: entries[name], actual, match: actual.sha256 === entries[name].sha256 && actual.bytes === entries[name].bytes }
  })
  return { index: inputs[base + 'index-r1.json'], declaredCount: Object.keys(entries).length, checkedCount: rows.length, mismatches: rows.filter(row => !row.match), rows }
}
function rawMap(round) {
  const base = p1 + round + '-raw/'
  const result = {}
  function walk(relative) {
    for (const entry of fs.readdirSync(path.join(root, base + relative), { withFileTypes: true })) {
      const next = relative + entry.name
      if (entry.isDirectory()) walk(next + '/')
      else if (entry.isFile()) {
        read(base + next)
        result[next] = inputs[base + next]
      } else throw new Error(`Nonregular raw input: ${next}`)
    }
  }
  walk('')
  return result
}
function delta(before, after) {
  return [...new Set([...Object.keys(before), ...Object.keys(after)])].sort()
    .filter(key => before[key]?.sha256 !== after[key]?.sha256)
    .map(key => ({ key, before: before[key] ?? null, after: after[key] ?? null }))
}
function command(file) {
  const value = json(p1 + file + '.json')
  const result = value.body?.result?.value?.result
  const text = result?.text ?? ''
  const fenced = /```json\n([\s\S]*?)\n```/.exec(text)
  let parsed
  if (fenced) parsed = JSON.parse(fenced[1])
  else if (text.startsWith('{')) parsed = JSON.parse(text)
  return { file, line: value.line, status: value.status, rpcId: value.body?.rpcId, result, parsed }
}
const sourceNames = [
  'src/commands/reflect.ts', 'src/core/reflect.ts', 'src/index.ts',
  'src/core/milestones.ts', 'src/core/deliverables.ts', 'src/core/storage.ts',
  'src/client/views/records/records-listbox.tsx',
  'src/client/views/records/records-deliverable-form.tsx',
  'src/client/views/records.css',
]
if (process.argv[2] === 'capture-r2') {
  for (const file of ['AGENTS.md', 'docs/collaboration.md',
    'docs/testing/remaining-governance-cases-20261021.md',
    'docs/testing/op-growth-final-inheritance-20261022-r1.md',
    'docs/design/deep-integration-v2-p1-dev.md']) read(file)
  const seals = {
    p1: checkIndex(p1),
    supplement: checkIndex(supplement),
    combined: checkIndex(combined, ['candidate.json', 'source-files.json', 'source-files.sha256',
      'complete-inputs.json', 'built-artifacts.json', 'tracked-product.diff', 'new-product-files.txt',
      'upstream-inputs.json', 'upstream-mappings.json']),
    deployment: checkIndex(gui, ['host-start.json', 'host-ready.json', 'setup-provenance.json',
      'fixture-binding.json', 'final-source-binding.json', '04-loaded-0.js', '04-loaded-0.json']),
  }
  const complete = json(combined + 'complete-inputs.json')
  const candidate = json(combined + 'candidate.json')
  const source = json(combined + 'source-files.json')
  const closing = json(p1 + 'source-binding-close.json')
  const sourceRows = sourceNames.map(name => {
    const relative = 'packages/dsh-pm-tool/' + name
    const text = read(relative).toString('utf8')
    return { name, frozenDeclaration: complete[name], current: inputs[relative],
      matchesFrozen: inputs[relative].sha256 === complete[name]?.sha256,
      lines: text.split('\n').map((text, i) => ({ line: i + 1, text })) }
  })
  const rounds = ['round01-start', 'round05-milestone-before-save', 'round05-milestone-after-save',
    'round06-milestone-repeat-before', 'round06-milestone-repeat-after',
    'round09-deliverable-before-save', 'round09-error-state', 'round10-error-state',
    'round11-after-escape', 'round12-status-keyboard', 'round12-save-focus', 'round12-after-save',
    'round13-repeat-before', 'round13-repeat-after', 'round13-reflect-linked-task-visible',
    'round13-reflection-list-visible', 'round14-snapshot-reentry-visible']
  const maps = Object.fromEntries(rounds.map(round => [round, rawMap(round)]))
  const dom = Object.fromEntries(rounds.map(round => [round, json(p1 + round + '.json')]))
  const transitions = [
    ['round01-start', 'round05-milestone-after-save'],
    ['round05-milestone-after-save', 'round06-milestone-repeat-after'],
    ['round09-deliverable-before-save', 'round09-error-state'],
    ['round09-error-state', 'round10-error-state'],
    ['round10-error-state', 'round11-after-escape'],
    ['round11-after-escape', 'round12-after-save'],
    ['round13-repeat-before', 'round13-repeat-after'],
    ['round13-repeat-after', 'round14-snapshot-reentry-visible'],
  ].map(([from, to]) => ({ from, to, changes: delta(maps[from], maps[to]) }))
  const events = Object.keys(seals.p1.rows.reduce((acc, row) => {
    if (row.name.endsWith('-events.json')) acc[row.name] = true
    return acc
  }, {})).map(file => {
    const event = json(p1 + file)
    const requests = (event.rows ?? []).filter(row => row.type === 'request')
    const responses = (event.rows ?? []).filter(row => row.type === 'response')
    return { file, frameCount: event.frames?.length ?? 0,
      requests: requests.map(row => ({ at: row.at, rpcId: row.body?.rpcId,
        method: row.body?.method, line: row.body?.payload?.args?.line,
        response: responses.find(response => response.body?.rpcId === row.body?.rpcId) ?? null })) }
  })
  const commands = [
    'round05-main-save-response', 'round06-milestone-repeat-response',
    'round12-main-save-response', 'round13-repeat-response',
    'round13-reflect-linked-task-command', 'round13-reflection-list-command',
    'round13-current-snapshot-command', 'round14-snapshot-reentry-command',
    'round14-reflection-list-reentry-command',
  ].map(command)
  const last = 'round14-snapshot-reentry-visible'
  const db = name => {
    const wrapper = json(p1 + last + '-raw/data/pmtool/' + name + '.json')
    if (wrapper.version !== 2 || !wrapper.record) throw new Error(`Unexpected storage wrapper: ${name}`)
    return wrapper.record
  }
  const task = db('tasks/t-0001')
  const reflections = ['ref-mvi5z85j-yk04ji', 'ref-mvk0iiij-42f7xa', 'ref-mvk0n0me-25tmos']
    .map(id => db('reflections/' + id))
  const before = maps['round01-start']
  const after = maps[last]
  const preserved = ['tasks/t-0001', 'reflections/ref-mvi5z85j-yk04ji'].map(name => {
    const key = 'data/pmtool/' + name + '.json'
    return { key, before: before[key], after: after[key], byteExact: before[key]?.sha256 === after[key]?.sha256 }
  })
  const rootTransitions = transitions.map(({ from, to }) => ({
    from, to, changes: delta(json(p1 + from + '-roots.json'), json(p1 + to + '-roots.json')),
  }))
  const snapshot = commands.find(row => row.file === 'round14-snapshot-reentry-command').parsed
  const snapshotMatches = ['tasks/t-0001', 'milestones/m-0001', 'deliverables/dlv-0001'].map(name => {
    const [table, id] = name.split('/')
    const raw = db(name)
    return { name, structuralMatch: isDeepStrictEqual(snapshot[table].find(row => row.id === id), raw) }
  })
  const receiptMetadata = Object.keys(json(supplement + 'index-r1.json'))
    .filter(name => name.endsWith('/execution.json')).map(name => json(supplement + name))
  const audit = { at: new Date().toISOString(), role: 'independent-read-only-review',
    productExecution: 'NOT_RUN', guiExecution: 'NOT_RUN', seals,
    candidateBinding: { candidate, sourceCount: source.count, completeInputCount: Object.keys(complete).length,
      sourceMapEquality: isDeepStrictEqual(source, closing.source),
      closing, host: json(gui + 'host-start.json'),
      loadedClientSha256: inputs[gui + '04-loaded-0.js'].sha256,
      declaredBuiltClient: json(combined + 'built-artifacts.json')['client.js'] },
    sourceRows, maps, transitions, rootTransitions, events, commands, dom,
    raw: { task, milestone: db('milestones/m-0001'), deliverable: db('deliverables/dlv-0001'),
      reflections, preserved, snapshotMatches },
    originalReceiptScan: json(p1 + 'execution-receipts.json'), receiptMetadata,
    inputs,
  }
  write('-audit-r2.json', audit)
  console.log(JSON.stringify({ sealedP1: seals.p1.checkedCount, sealedSupplement: seals.supplement.checkedCount,
    mismatches: Object.fromEntries(Object.entries(seals).map(([name, result]) => [name, result.mismatches])),
    sources: sourceRows.map(({ name, matchesFrozen }) => ({ name, matchesFrozen })),
    transitions: transitions.map(({ from, to, changes }) => ({ from, to, changed: changes.map(row => row.key) })),
    preserved, snapshotMatches, inputs: Object.keys(inputs).length }, null, 2))
  if (Object.values(seals).some(result => result.mismatches.length)) process.exitCode = 1
} else if (process.argv[2] === 'binding') {
  const meta = json(gui + '04-loaded-0.json')
  const response = read(gui + '04-loaded-0.js')
  const executable = response.subarray(meta.offset, meta.offset + meta.executableBytes)
  const reconstructed = Buffer.concat([executable, Buffer.from('//# sourceMappingURL=client.js.map')])
  const complete = json(combined + 'complete-inputs.json')
  const taskSource = read('packages/dsh-pm-tool/src/core/tasks.ts')
  const checks = {
    response: response.length === meta.responseBytes && sha(response) === meta.responseSha256,
    executable: executable.length === meta.executableBytes && sha(executable) === meta.executableSha256,
    unique: response.indexOf(executable) === response.lastIndexOf(executable),
    reconstructed: reconstructed.length === meta.fullClientBytes && sha(reconstructed) === meta.fullClientSha256,
    getTaskSource: sha(taskSource) === complete['src/core/tasks.ts'].sha256,
  }
  write('-binding.json', { at: new Date().toISOString(), checks,
    executable: { bytes: executable.length, sha256: sha(executable) },
    reconstructed: { bytes: reconstructed.length, sha256: sha(reconstructed) },
    normalization: 'Only the exact 34-byte sourceMappingURL tail comment is restored; not a product build',
    taskSource: { declaration: complete['src/core/tasks.ts'], actual: inputs['packages/dsh-pm-tool/src/core/tasks.ts'],
      getTaskLines: taskSource.toString('utf8').split('\n').slice(247, 252) },
    inputs })
  console.log(JSON.stringify(checks, null, 2))
  if (Object.values(checks).some(value => !value)) process.exitCode = 1
} else if (process.argv[2] === 'seal-r2') {
  const audit = json(prefix + '-audit-r2.json')
  const binding = json(prefix + '-binding.json')
  const protectedInputs = { ...audit.inputs, ...binding.inputs }
  const drift = []
  for (const [relative, expected] of Object.entries(protectedInputs)) {
    read(relative)
    if (inputs[relative].sha256 !== expected.sha256 || inputs[relative].bytes !== expected.bytes) {
      drift.push({ relative, expected, actual: inputs[relative] })
    }
  }
  const outputs = {}
  for (const suffix of ['-reader.mjs', '-audit.json', '-audit-r2.json', '-binding.json', '-seal.json', '.md']) {
    read(prefix + suffix)
    outputs[prefix + suffix] = inputs[prefix + suffix]
  }
  const report = read(prefix + '.md').toString('utf8')
  const whitespace = report.split('\n').flatMap((line, index) => /[ \t]+$/.test(line) ? [index + 1] : [])
  const brokenLinks = [...report.matchAll(/\]\(([^)]+)\)/g)].map(match => match[1])
    .filter(link => !/^(https?:|file:|#)/.test(link))
    .filter(link => path.resolve(root, 'docs/testing', link.split('#')[0]) !== path.join(root, prefix + '-seal-r2.json'))
    .filter(link => !fs.existsSync(path.resolve(root, 'docs/testing', link.split('#')[0])))
  write('-seal-r2.json', { at: new Date().toISOString(), inputCount: Object.keys(protectedInputs).length,
    drift, outputs, whitespace, brokenLinks,
    deferredSelfLink: prefix + '-seal-r2.json',
    scope: 'Only declared repository evidence and necessary source; no live/private/runtime access',
    resourcesReleased: true, state: 'STOP' })
  if (!fs.existsSync(path.join(root, prefix + '-seal-r2.json'))) throw new Error('Seal output absent')
  console.log(JSON.stringify({ drift, whitespace, brokenLinks, outputs }, null, 2))
  if (drift.length || whitespace.length || brokenLinks.length) process.exitCode = 1
} else {
  throw new Error('Use capture-r2, binding or seal-r2')
}

import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'

const repo = '/Users/bytedance/Projects/dsh-pm/pm-tool'
const prefix = join(repo, 'docs/testing/a13-native-import-gui-review-20261022')
const base = join(repo, 'reports/all-pending-evidence-20261021/A13')
const native = join(base, 'final/materials/native-import')
const tree = '/private/tmp/pmtool-a13-closure-20261022'
const json = path => JSON.parse(readFileSync(path, 'utf8'))
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const fingerprint = path => ({ path, bytes: statSync(path).size, sha256: sha(readFileSync(path)) })
const walk = path => readdirSync(path).sort().flatMap(name => {
  const child = join(path, name)
  return statSync(child).isDirectory() ? walk(child) : [child]
})
const candidate = json(join(base, 'candidate-final.json'))
const current = path => existsSync(path) ? sha(readFileSync(path)) : null
const verifyMap = map => Object.entries(map).map(([path, expected]) => ({
  path, expected, actual: current(join(tree, path)),
})).filter(row => row.expected !== row.actual)
const watched = [
  ...walk(native), ...walk(join(base, 'final/materials/loaded')),
  ...walk(join(base, 'build-final')), ...walk(join(base, 'full-verify')),
  join(base, 'candidate-final.json'), join(base, 'environment-final.json'),
  join(base, 'product-tracked.patch'),
  ...['commands.ndjson', 'errors.ndjson', 'start.json', 'ready.json', 'end.json', 'save-exit.json']
    .map(name => join(base, 'final/materials/native-files/save-round', name)),
  ...[
    'AGENTS.md', 'docs/collaboration.md',
    'docs/testing/remaining-journey-cases-20261021.md',
    'docs/testing/a13-import-filename-contract-20261021-plan.md',
    'docs/testing/a13-import-filename-contract-20261021-cases.md',
    'docs/testing/a13-import-filename-contract-20261021-red.md',
    'docs/testing/a13-import-filename-independent-retest-20261021.md',
    'docs/testing/a13-import-filename-independent-retest-20261021-selftmp/new-r3/candidate.json',
    'docs/testing/a10-preflight-success-independent-retest-20261021.md',
    'docs/testing/a9-existing-entries-independent-retest-20261021.md',
  ].map(path => join(repo, path)),
  ...walk('/private/tmp/pmtool-a11-native-import'),
  ...[
    '/private/tmp/pmtool-a13-import-confirm-20261022.mjs',
    '/private/tmp/pmtool-a13-native-pick-20261022.py',
    '/private/tmp/pmtool-a13-native-path-20261022.swift',
    '/private/tmp/pmtool-a13-final-gui-20261022.mjs',
    '/private/tmp/pmtool-a13-file-collector-20261022.mjs',
  ],
]

if (process.argv.includes('--seal')) {
  const inputs = json(prefix + '-inputs.json')
  const evidenceDrift = inputs.files.map(row => ({ path: row.path, expected: row.sha256, actual: current(row.path) }))
    .filter(row => row.expected !== row.actual)
  const sourceDrift = verifyMap(candidate.sourceHashes)
  const artifactDrift = verifyMap(candidate.artifacts)
  const result = {
    at: new Date().toISOString(), evidenceDrift, sourceDrift, artifactDrift,
    owned: readdirSync(join(repo, 'docs/testing')).filter(name => name.startsWith('a13-native-import-gui-review-20261022'))
      .filter(name => name !== 'a13-native-import-gui-review-20261022-final-check.json')
      .map(name => fingerprint(join(repo, 'docs/testing', name))),
    boundary: 'Read-only evidence audit; no GUI/product execution/build/install/services/credentials/git writes.',
  }
  writeFileSync(prefix + '-final-check.json', JSON.stringify(result, null, 2) + '\n')
  const drift = evidenceDrift.length + sourceDrift.length + artifactDrift.length
  console.log(JSON.stringify({ mode: 'seal', evidenceDrift: evidenceDrift.length, sourceDrift: sourceDrift.length, artifactDrift: artifactDrift.length }))
  process.exitCode = drift ? 1 : 0
} else {
  const files = [...new Set(watched)].map(fingerprint)
  if (!existsSync(prefix + '-inputs.json')) {
    writeFileSync(prefix + '-inputs.json', JSON.stringify({ at: new Date().toISOString(), files }, null, 2) + '\n')
  }
  const normalize = map => Object.fromEntries(Object.entries(map).map(([path, hash]) => [path.replace(/^\/+/, ''), hash]))
  const roots = value => Object.fromEntries(Object.entries(value.roots ?? value).map(([root, map]) => [root, normalize(map)]))
  const diff = (before, after) => {
    const a = roots(before), b = roots(after), out = {}
    for (const name of new Set([...Object.keys(a), ...Object.keys(b)])) {
      const x = a[name] ?? {}, y = b[name] ?? {}
      out[name] = {
        beforeCount: Object.keys(x).length, afterCount: Object.keys(y).length,
        added: Object.keys(y).filter(key => !(key in x)),
        removed: Object.keys(x).filter(key => !(key in y)),
        changed: Object.keys(x).filter(key => key in y && x[key] !== y[key]),
      }
    }
    return out
  }
  const readNative = (dir, name) => json(join(native, dir, name))
  const zeroWrite = {}
  for (const dir of ['csv-cancel', 'xlsx-cancel', 'csv-invalid', 'xlsx-invalid']) {
    zeroWrite[dir] = {
      beforeAt: readNative(dir, 'before.json').at, afterAt: readNative(dir, 'after.json').at,
      preview: diff(readNative(dir, 'before.json'), readNative(dir, dir.includes('invalid') ? 'after.json' : 'preview-roots.json')),
      after: diff(readNative(dir, 'before.json'), readNative(dir, 'after.json')),
    }
  }
  const parseEvents = rows => rows.map(row => {
    const event = row.event ?? row
    const data = event.data ?? {}
    const item = { at: row.at, type: event.type, seq: event.seq, commandId: data.commandId }
    if (event.type === 'command/run') {
      item.name = data.name
      if (data.args?.trim().startsWith('task import-content')) {
        const match = data.args.trim().match(/^task import-content (\S+) ("(?:[^"\\]|\\.)*") ("(?:[^"\\]|\\.)*")( confirm)?$/)
        if (!match) return { ...item, argsParseError: true, argsSha256: sha(data.args) }
        const filename = JSON.parse(match[2])
        const content = JSON.parse(match[3])
        const bytes = Buffer.from(content, filename.endsWith('.xlsx') ? 'base64' : 'utf8')
        Object.assign(item, {
          projectId: match[1], filename, confirm: !!match[4],
          argsSha256: sha(data.args), previewArgsSha256: sha(data.args.replace(/ confirm$/, '')),
          contentBytes: bytes.length, contentSha256: sha(bytes),
        })
      } else item.operation = data.args?.trim().split(/\s+/).slice(0, 3).join(' ')
    } else {
      item.kind = data.kind
      if (data.text?.startsWith('{')) {
        try {
          const snapshot = JSON.parse(data.text)
          item.snapshotTasks = snapshot.tasks?.map(task => ({
            id: task.id, projectId: task.projectId, parentId: task.parentId, code: task.code,
            title: task.title, assignee: task.assignee, priority: task.priority,
            startDate: task.startDate, dueDate: task.dueDate, progress: task.progress, status: task.status,
          }))
        } catch { item.textParseError = true }
      } else item.text = data.text
    }
    return item
  })
  const passivePath = join(base, 'final/materials/native-files/save-round/commands.ndjson')
  const passive = parseEvents(readFileSync(passivePath, 'utf8').trim().split('\n').map(line => JSON.parse(line)))
  const confirms = {}
  for (const dir of ['csv-confirm', 'xlsx-confirm']) {
    const before = readNative(dir, 'before-tasks.json')
    const after = readNative(dir, 'confirmed-tasks.json')
    const reopened = readNative(dir, 'reopened-tasks.json')
    const cancel = dir.replace('confirm', 'cancel')
    const frames = json(join(native, dir, 'frames/frames.json')).frames
    confirms[dir] = {
      originalExit: readNative(dir, 'exit.json'),
      frames: {
        count: frames.length, firstAt: frames[0].at, lastAt: frames.at(-1).at,
        declaredHashMismatch: frames.filter(frame =>
          frame.sha256 !== current(join(native, dir, 'frames', frame.file))).map(frame => frame.file),
      },
      previewAgainstPriorCancel: diff(readNative(cancel, 'after.json'), readNative(dir, 'preview-roots.json')),
      roots: diff(readNative(dir, 'preview-roots.json'), readNative(dir, 'confirmed-roots.json')),
      added: Object.keys(after).filter(key => !(key in before)).map(key => ({ file: key, ...after[key].record })),
      changedExisting: Object.keys(before).filter(key => JSON.stringify(before[key]) !== JSON.stringify(after[key])),
      reopenedEqual: JSON.stringify(after) === JSON.stringify(reopened),
      events: parseEvents(readNative(dir, 'command-events.json')),
    }
  }
  const actualReentry = ['t-0006', 't-0007'].map(id => {
    const raw = readNative('xlsx-confirm', id + '-raw.json')
    const page = readNative('xlsx-confirm', id + '-actual-reopened.json')
    const confirmed = readNative('xlsx-confirm', 'confirmed-tasks.json')[id + '.json']
    const selectableOtherTasks = page.fields.filter(field => field.name === 'predecessorIds').map(field => field.value)
    return {
      id, at: page.at, rawEqualsConfirmed: JSON.stringify(raw) === JSON.stringify(confirmed),
      rawSha256: current(join(native, 'xlsx-confirm', id + '-raw.json')),
      fields: Object.fromEntries(page.fields.filter(field => field.name && field.name !== 'predecessorIds')
        .map(field => [field.name, field.value])),
      selectableOtherTasks, excludesSelf: !selectableOtherTasks.includes(id),
    }
  })
  const pages = {}
  for (const dir of ['csv-cancel', 'xlsx-cancel', 'csv-confirm', 'xlsx-confirm', 'csv-invalid', 'xlsx-invalid']) {
    const name = dir === 'csv-cancel' ? 'preview-current.json' : dir.includes('invalid') ? 'rejected.json' : 'preview.json'
    const page = readNative(dir, name)
    pages[dir] = {
      at: page.at, origin: page.origin, timeOrigin: page.timeOrigin, viewport: page.viewport, dark: page.dark,
      importText: page.pm.text.split('\n').filter(line => /已解析上传文件|导入失败|dueDate|2026-02-30|1[.｜]/.test(line)),
      buttons: page.buttons.filter(button => /确认落盘|取消/.test(button.text)),
    }
  }
  const loaded = json(join(base, 'final/materials/loaded/result.json'))
  const combo = readFileSync(join(base, 'final/materials/loaded/combo-1.txt'))
  const client = readFileSync(join(tree, 'packages/dsh-pm-tool/lib/client.js'))
  const normalized = client.toString().replace(/(?:\r?\n)?\/\/# sourceURL=([^\r\n]+)(?:\r?\n)?$/, '')
    .replace(/(?:\r?\n)?\/\/# sourceMappingURL=[^\r\n]*(?:\r?\n)?$/, '')
  const segment = Buffer.from(normalized + (normalized.endsWith('\n') ? '' : '\n') + ';\n')
  const first = combo.indexOf(segment), second = first < 0 ? -1 : combo.indexOf(segment, first + 1)
  const relevant = ['client/views/tasks.tsx', 'commands/task.ts', 'core/csv-import.ts', 'core/task.ts',
    'client/index.tsx', 'client/panel.tsx', 'client/views/tasks.css', 'client/panel.css',
    'client/views/tasks-import-confirm.test.tsx', 'commands/task-import-filename.test.ts']
  const independent = json(join(repo, 'docs/testing/a13-import-filename-independent-retest-20261021-selftmp/new-r3/candidate.json'))
  const inheritance = relevant.map(path => {
    const key = 'packages/dsh-pm-tool/src/' + path
    const old = independent.source.files[path]
    return { path: key, a13: candidate.sourceHashes[key], independent: old?.sha256,
      mainNow: current(join(repo, key)) }
  })
  const output = {
    at: new Date().toISOString(), auditEnvironment: { node: process.version, platform: process.platform, arch: process.arch },
    candidate: {
      baseline: candidate.baseline, hostGitHead: candidate.hostGitHead, tree,
      candidateSha256: current(join(base, 'candidate-final.json')), patchSha256: current(join(base, 'product-tracked.patch')),
      declaredPatch: candidate.trackedPatchSha, sourceCount: Object.keys(candidate.sourceHashes).length,
      artifactCount: Object.keys(candidate.artifacts).length, sourceDrift: verifyMap(candidate.sourceHashes),
      artifactDrift: verifyMap(candidate.artifacts),
    },
    fixtures: walk('/private/tmp/pmtool-a11-native-import').map(fingerprint),
    loaded: { ...loaded, computed: { comboSha256: sha(combo), comboBytes: combo.length, clientSha256: sha(client),
      segmentSha256: sha(segment), segmentBytes: segment.length, first, second, uniqueComplete: first >= 0 && second < 0 } },
    zeroWrite, confirms, passive, pages, inheritance, actualReentry,
    correction: readNative('xlsx-confirm', 'reentry-correction.json'),
    buildExits: ['build', 'coverage', 'noemit'].map(name => json(join(base, 'build-final/' + name + '.exit.json'))),
    fullVerify: json(join(base, 'full-verify/summary.json')),
    boundary: 'Audit only. Summaries are not fabricated missing command events or GUI evidence. Source/artifact reads do not rerun product.',
  }
  writeFileSync(prefix + '-observations.json', JSON.stringify(output, null, 2) + '\n')
  console.log(JSON.stringify({ sources: output.candidate.sourceCount, artifacts: output.candidate.artifactCount,
    sourceDrift: output.candidate.sourceDrift.length, artifactDrift: output.candidate.artifactDrift.length,
    watchedFiles: files.length, uniqueComplete: output.loaded.computed.uniqueComplete }))
  process.exitCode = output.candidate.sourceDrift.length || output.candidate.artifactDrift.length ? 1 : 0
}

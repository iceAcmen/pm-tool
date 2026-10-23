import { readFileSync, existsSync, readdirSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repo = resolve(here, '../..')
const prefix = 'fc-a3-independent-retest-20261021'
const output = join(here, `${prefix}-evidence-check.json`)
if (existsSync(output)) throw new Error('不覆盖已有原证')
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const sha = p => hash(readFileSync(p))
const json = p => JSON.parse(readFileSync(p, 'utf8'))
const evidence = join(repo, 'reports/all-pending-evidence-20261021')
const loaded = join(evidence, 'A2/loaded')
const meta = json(join(loaded, 'combo-exact-response.json'))
const source = readFileSync(join('/private/tmp/pmtool-all-closure-20261021', 'packages/dsh-pm-tool/lib/client.js'))
const response = readFileSync(join(loaded, 'combo-exact-1.txt'))
const sourceCore = source.subarray(0, source.indexOf(Buffer.from('//# sourceMappingURL')))
const first = response.indexOf(sourceCore)
const segment = response.subarray(first, first + sourceCore.length + 2)
const event = meta.events[0]
const checks = {
  sourceHash: hash(source) === event.sourceSha256,
  responseHash: hash(response) === event.responseSha256,
  responseBytes: response.length === event.bytes,
  exactSourceCorePresent: first >= 0,
  firstOffset: first === event.firstOffset,
  unique: response.indexOf(sourceCore, first + 1) === -1,
  segmentHash: hash(segment) === event.segmentSha256,
  segmentBytes: segment.length === event.segmentBytes,
  comboSeparator: response.subarray(first + sourceCore.length, first + sourceCore.length + 2).toString() === ';\n',
}
const native = json(join(loaded, 'native-menu-100.json'))
checks.nativeImageHash = sha(join(loaded, 'native-menu-100.png')) === native.sha256
const finderDir = join(evidence, 'A3/finder')
const approvedFinderNames = ['control-open-result.json', 'control-open-result.png', 'menu.png', 's4-proof.json', 'control-auto-s4.png', 'host-mount-ax.txt', 'safe-app.json']
const finder = approvedFinderNames.map(name => ({
  path: `reports/all-pending-evidence-20261021/A3/finder/${name}`, sha256: sha(join(finderDir, name)),
}))
const open = json(join(finderDir, 'control-open-result.json'))
const proof = json(join(finderDir, 's4-proof.json'))
checks.finderChromePreference = open.events[0].state.selectedBrowser === 'Chrome'
checks.finderActionS3 = open.events.at(-1).state.status === 'S3'
checks.finderServerS4 = proof.server.state.status === 'S4' && proof.server.state.confirmed === true
checks.finderDomS4 = proof.dom.status === 'S4' && proof.dom.confirmed === true
checks.finderControlNotReloaded = proof.dom.navigationCount === 1 && proof.dom.polls === 248
checks.finderHostMounted = proof.hostAX.includes('项目工作台') && proof.hostAX.includes('建立第一个项目')
const rounds = ['initial', 'a2', 'probes', 'probes-r2', 'followup-r3'].map(mode => {
  const resultPath = join(here, `${prefix}-${mode}-result.json`)
  const r = json(resultPath)
  const commands = r.commands.map(command => {
    const log = readFileSync(join(repo, command.log), 'utf8')
    const summary = Object.fromEntries(['tests', 'pass', 'fail', 'cancelled', 'skipped'].map(key => [key, Number(log.match(new RegExp(`^# ${key} (\\d+)$`, 'm'))?.[1] ?? -1)]))
    return { ...command, hashValid: hash(Buffer.from(log)) === command.sha256, summary }
  })
  return { mode, resultSha256: sha(resultPath), commands, sourceChanges: r.sourceChanges.length,
    artifactChanges: r.artifactChanges.length, launcherChanges: r.launcherChanges.length,
    candidateSha256: r.candidateSha256, candidateAfterSha256: r.candidateAfterSha256 }
})
const pids = new Set()
for (const name of readdirSync(here).filter(name => name.startsWith(prefix) && name.endsWith('.txt'))) {
  const text = readFileSync(join(here, name), 'utf8')
  for (const match of text.matchAll(/"event":"browser","pid":(\d+)/g)) pids.add(Number(match[1]))
}
const processCheck = [...pids].map(pid => {
  const p = spawnSync('ps', ['-p', String(pid), '-o', 'pid=,comm='], { encoding: 'utf8' })
  return { pid, exists: p.status === 0 && Boolean(p.stdout.trim()), psExit: p.status, output: p.stdout.trim() }
})
const result = { at: new Date().toISOString(), node: process.version,
  checks, combo: { firstOffset: first, sourceHash: hash(source), responseHash: hash(response), sourceCoreBytes: sourceCore.length,
    sourceCoreHash: hash(sourceCore), segmentBytes: segment.length, segmentHash: hash(segment),
    boundary: '原证segment含源core后combo分隔符;不含sourceMappingURL，非整source文件逐字包含；CDP响应fromDiskCache=true，不证明新网络传输' },
  native: { metadataSha256: sha(join(loaded, 'native-menu-100.json')), imageSha256: sha(join(loaded, 'native-menu-100.png')),
    boundary: '仅当前2026-10-21T19:50帧菜单100%；不追溯旧截图zoom' },
  finder, finderMissing: ['Finder指针动作持久原始记录', 'environment-only wrapper原件（本专家禁读runtime，当前仅hash声明）',
    '首次生产open逐命令argv/exit/时间原件', '直接entered响应与本轮回告关联原证', '完整Finder/S4全部合同与reopen'],
  rounds, ownBrowserProcesses: processCheck,
  boundary: '未连接任何既有浏览器或产品服务；只读允许reports原件和既有lib；ps仅记录本轮自有Chrome PID，无kill' }
writeFileSync(output, JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify({ output, checks, processes: processCheck, rounds: rounds.map(r => ({ mode: r.mode, summaries: r.commands.map(c => ({ label: c.label, exit: c.exit, ...c.summary })) })) }))
if (Object.values(checks).some(c => !c) || processCheck.some(p => p.exists)) process.exitCode = 1

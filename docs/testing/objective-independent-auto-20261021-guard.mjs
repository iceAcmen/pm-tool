// 写根与离线保护；所有测试子进程先加载，非操作系统 sandbox。
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { syncBuiltinESMExports } from 'node:module'
import net from 'node:net'

const own = fs.realpathSync(process.env.QA_OWN)
const audit = process.env.QA_AUDIT
const auditFd = fs.openSync(audit, 'a', 0o600)
const writeAudit = fs.writeSync.bind(fs)
const realpath = fs.realpathSync.bind(fs)
const exists = fs.existsSync.bind(fs)
function normalized(value) {
  if (typeof value === 'number') return null
  return path.resolve(value instanceof URL ? fileURLToPath(value) : Buffer.isBuffer(value) ? value.toString() : String(value))
}
function writeCheck(value, operation) {
  const target = normalized(value)
  if (target === null) return
  let ancestor = target
  while (!exists(ancestor)) ancestor = path.dirname(ancestor)
  const actual = path.resolve(realpath(ancestor), path.relative(ancestor, target))
  const allowed = actual === own || actual.startsWith(own + '/')
  writeAudit(auditFd, JSON.stringify({ pid: process.pid, operation, target, actual, allowed, at: new Date().toISOString() }) + '\n')
  if (!allowed) throw new Error(`QA_WRITE_OUTSIDE_OWN: ${operation} ${actual}`)
}
for (const name of ['writeFile', 'appendFile', 'mkdir', 'rm', 'rmdir', 'unlink', 'chmod', 'truncate', 'utimes']) {
  const original = fsp[name].bind(fsp)
  fsp[name] = (...args) => { writeCheck(args[0], name); return original(...args) }
  for (const suffix of ['', 'Sync']) {
    const key = name + suffix
    if (typeof fs[key] !== 'function') continue
    const originalFs = fs[key].bind(fs)
    fs[key] = (...args) => { writeCheck(args[0], key); return originalFs(...args) }
  }
}
for (const name of ['rename', 'copyFile', 'cp', 'link', 'symlink']) {
  const check = args => {
    if (name === 'rename') writeCheck(args[0], name + ':source')
    writeCheck(args[1], name + ':destination')
  }
  const original = fsp[name].bind(fsp)
  fsp[name] = (...args) => { check(args); return original(...args) }
  for (const suffix of ['', 'Sync']) {
    const key = name + suffix
    const originalFs = fs[key].bind(fs)
    fs[key] = (...args) => { check(args); return originalFs(...args) }
  }
}
const writable = flag => typeof flag === 'number'
  ? !!(flag & (fs.constants.O_WRONLY | fs.constants.O_RDWR | fs.constants.O_CREAT | fs.constants.O_TRUNC))
  : /[wa+]/.test(String(flag ?? 'r'))
for (const [object, key] of [[fs, 'open'], [fs, 'openSync'], [fsp, 'open'], [fs, 'createWriteStream']]) {
  const original = object[key].bind(object)
  object[key] = (...args) => {
    const flag = key === 'createWriteStream' ? args[1]?.flags ?? 'w' : args[1]
    if (writable(flag)) writeCheck(args[0], key)
    return original(...args)
  }
}
const forbidden = value => {
  const p = normalized(value)
  if (!p || p.startsWith(own + '/')) return
  if (/\/\.dsh\/|\/pmtool-closure-runtime-20261021\/|\/pm-tool\/(?:data|backups|exports)(?:\/|$)/.test(p)) {
    throw new Error(`QA_FORBIDDEN_ASSET_READ: ${p}`)
  }
}
for (const [object, key] of [[fs, 'readFile'], [fs, 'readFileSync'], [fsp, 'readFile'],
  [fs, 'readdir'], [fs, 'readdirSync'], [fsp, 'readdir'], [fs, 'createReadStream']]) {
  const original = object[key].bind(object)
  object[key] = (...args) => { forbidden(args[0]); return original(...args) }
}
const offline = () => { throw new Error('QA_OFFLINE_NETWORK_FORBIDDEN') }
net.connect = offline
net.createConnection = offline
net.Socket.prototype.connect = offline
net.Server.prototype.listen = offline
globalThis.fetch = offline
syncBuiltinESMExports()

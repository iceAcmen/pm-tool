// 自有子进程写根保护，不声称是操作系统 sandbox 或全盘审计。
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { syncBuiltinESMExports } from 'node:module'
import net from 'node:net'

const own = fs.realpathSync(process.env.QA_OWN)
const fd = fs.openSync(process.env.QA_AUDIT, 'a', 0o600)
const audit = fs.writeSync.bind(fs)
const exists = fs.existsSync.bind(fs)
const realpath = fs.realpathSync.bind(fs)
const normalize = v => typeof v === 'number' ? null :
  path.resolve(v instanceof URL ? fileURLToPath(v) : Buffer.isBuffer(v) ? v.toString() : String(v))
function check(v, op) {
  const target = normalize(v)
  if (!target) return
  let ancestor = target
  while (!exists(ancestor)) ancestor = path.dirname(ancestor)
  const actual = path.resolve(realpath(ancestor), path.relative(ancestor, target))
  const allowed = actual === own || actual.startsWith(own + '/')
  audit(fd, JSON.stringify({ pid: process.pid, op, target, actual, allowed }) + '\n')
  if (!allowed) throw new Error(`QA_WRITE_OUTSIDE_OWN ${op}: ${actual}`)
}
for (const name of ['writeFile', 'appendFile', 'mkdir', 'rm', 'rmdir', 'unlink', 'chmod', 'truncate', 'utimes']) {
  for (const [o, key] of [[fsp, name], [fs, name], [fs, name + 'Sync']]) {
    if (typeof o[key] !== 'function') continue
    const orig = o[key].bind(o)
    o[key] = (...a) => { check(a[0], key); return orig(...a) }
  }
}
for (const name of ['rename', 'copyFile', 'cp', 'link', 'symlink']) {
  for (const [o, key] of [[fsp, name], [fs, name], [fs, name + 'Sync']]) {
    if (typeof o[key] !== 'function') continue
    const orig = o[key].bind(o)
    o[key] = (...a) => {
      if (name === 'rename') check(a[0], key + ':source')
      check(a[1], key + ':destination')
      return orig(...a)
    }
  }
}
const writable = v => typeof v === 'number'
  ? Boolean(v & (fs.constants.O_WRONLY | fs.constants.O_RDWR | fs.constants.O_CREAT | fs.constants.O_TRUNC))
  : /[wa+]/.test(String(v ?? 'r'))
for (const [o, key] of [[fs, 'open'], [fs, 'openSync'], [fsp, 'open'], [fs, 'createWriteStream']]) {
  const orig = o[key].bind(o)
  o[key] = (...a) => {
    if (writable(key === 'createWriteStream' ? a[1]?.flags ?? 'w' : a[1])) check(a[0], key)
    return orig(...a)
  }
}
function readCheck(v) {
  const target = normalize(v)
  if (!target || target.startsWith(own + '/')) return
  if (/\/\.dsh\/|\/pmtool-[^/]+-runtime[^/]*\/|\/pm-tool\/(?:data|assets|exports|backups)(?:\/|$)|\/deepseek-harness\//.test(target)) {
    throw new Error(`QA_FORBIDDEN_READ: ${target}`)
  }
}
for (const [o, key] of [[fs, 'readFile'], [fs, 'readFileSync'], [fsp, 'readFile'],
  [fs, 'readdir'], [fs, 'readdirSync'], [fsp, 'readdir'], [fs, 'createReadStream']]) {
  const orig = o[key].bind(o)
  o[key] = (...a) => { readCheck(a[0]); return orig(...a) }
}
const offline = () => { throw new Error('QA_NETWORK_OR_SERVICE_FORBIDDEN') }
net.connect = offline
net.createConnection = offline
net.Socket.prototype.connect = offline
net.Server.prototype.listen = offline
globalThis.fetch = offline
syncBuiltinESMExports()

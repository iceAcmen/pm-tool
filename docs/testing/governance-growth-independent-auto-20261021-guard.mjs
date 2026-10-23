// 测试进程离线与写根保护；不是操作系统 sandbox。
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { syncBuiltinESMExports } from 'node:module'
import net from 'node:net'

const own = fs.realpathSync(process.env.QA_OWN)
const fd = fs.openSync(process.env.QA_AUDIT, 'a', 0o600)
const log = fs.writeSync.bind(fs)
const exists = fs.existsSync.bind(fs)
const realpath = fs.realpathSync.bind(fs)
const normalized = v => typeof v === 'number' ? null : path.resolve(
  v instanceof URL ? fileURLToPath(v) : Buffer.isBuffer(v) ? v.toString() : String(v))
function check(value, operation) {
  const target = normalized(value)
  if (!target) return
  let ancestor = target
  while (!exists(ancestor)) ancestor = path.dirname(ancestor)
  const actual = path.resolve(realpath(ancestor), path.relative(ancestor, target))
  const allowed = actual === own || actual.startsWith(own + '/')
  log(fd, JSON.stringify({ pid: process.pid, operation, target, actual, allowed }) + '\n')
  if (!allowed) throw new Error(`QA_WRITE_OUTSIDE_OWN: ${operation} ${actual}`)
}
for (const name of ['writeFile', 'appendFile', 'mkdir', 'rm', 'rmdir', 'unlink', 'chmod', 'truncate', 'utimes']) {
  for (const [obj, key] of [[fsp, name], [fs, name], [fs, name + 'Sync']]) {
    if (typeof obj[key] !== 'function') continue
    const original = obj[key].bind(obj)
    obj[key] = (...args) => { check(args[0], key); return original(...args) }
  }
}
for (const name of ['rename', 'copyFile', 'cp', 'link', 'symlink']) {
  for (const [obj, key] of [[fsp, name], [fs, name], [fs, name + 'Sync']]) {
    const original = obj[key].bind(obj)
    obj[key] = (...args) => {
      if (name === 'rename') check(args[0], key + ':source')
      check(args[1], key + ':destination')
      return original(...args)
    }
  }
}
const writable = flags => typeof flags === 'number'
  ? !!(flags & (fs.constants.O_WRONLY | fs.constants.O_RDWR | fs.constants.O_CREAT | fs.constants.O_TRUNC))
  : /[wa+]/.test(String(flags ?? 'r'))
for (const [obj, key] of [[fsp, 'open'], [fs, 'open'], [fs, 'openSync'], [fs, 'createWriteStream']]) {
  const original = obj[key].bind(obj)
  obj[key] = (...args) => {
    if (writable(key === 'createWriteStream' ? args[1]?.flags ?? 'w' : args[1])) check(args[0], key)
    return original(...args)
  }
}
for (const [obj, key] of [[fs, 'readFile'], [fs, 'readFileSync'], [fsp, 'readFile'],
  [fs, 'readdir'], [fs, 'readdirSync'], [fsp, 'readdir'], [fs, 'createReadStream']]) {
  const original = obj[key].bind(obj)
  obj[key] = (...args) => {
    const p = normalized(args[0])
    if (p && !p.startsWith(own + '/') && /\/\.dsh\/|\/pmtool-.*runtime[^/]*\/|\/pm-tool\/(?:data|backups|exports)(?:\/|$)/.test(p)) {
      throw new Error(`QA_FORBIDDEN_ASSET_READ: ${p}`)
    }
    return original(...args)
  }
}
const offline = () => { throw new Error('QA_OFFLINE_NETWORK_FORBIDDEN') }
net.connect = offline
net.createConnection = offline
net.Socket.prototype.connect = offline
net.Server.prototype.listen = offline
globalThis.fetch = offline
syncBuiltinESMExports()

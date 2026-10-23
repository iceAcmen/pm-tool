// 测试设施保护，不冒充系统沙箱。日志用原始 fd 写入，避免递归。
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
const normalized = value => typeof value === 'number' ? null
  : path.resolve(value instanceof URL ? fileURLToPath(value) : String(value))
function check(value, operation) {
  const target = normalized(value)
  if (!target) return
  let ancestor = target
  while (!exists(ancestor)) ancestor = path.dirname(ancestor)
  const actual = path.resolve(realpath(ancestor), path.relative(ancestor, target))
  const allowed = actual === own || actual.startsWith(own + '/')
  log(fd, JSON.stringify({ pid: process.pid, operation, target, actual, allowed }) + '\n')
  if (!allowed) throw new Error(`QA_WRITE_OUTSIDE_OWN ${operation} ${actual}`)
}
for (const key of ['writeFile', 'appendFile', 'mkdir', 'mkdtemp', 'rm', 'rmdir', 'unlink',
  'chmod', 'truncate', 'utimes']) {
  for (const [object, name] of [[fs, key], [fs, key + 'Sync'], [fsp, key]]) {
    if (!object[name]) continue
    const original = object[name].bind(object)
    object[name] = (...args) => { check(args[0], name); return original(...args) }
  }
}
for (const key of ['rename', 'copyFile', 'cp', 'link', 'symlink']) {
  for (const [object, name] of [[fs, key], [fs, key + 'Sync'], [fsp, key]]) {
    const original = object[name].bind(object)
    object[name] = (...args) => {
      if (key === 'rename') check(args[0], name + ':source')
      check(args[1], name + ':destination')
      return original(...args)
    }
  }
}
const writable = flag => typeof flag === 'number'
  ? !!(flag & (fs.constants.O_WRONLY | fs.constants.O_RDWR | fs.constants.O_CREAT | fs.constants.O_TRUNC))
  : /[wa+]/.test(String(flag ?? 'r'))
for (const [object, name] of [[fs, 'open'], [fs, 'openSync'], [fsp, 'open'], [fs, 'createWriteStream']]) {
  const original = object[name].bind(object)
  object[name] = (...args) => {
    const flags = name === 'createWriteStream' ? args[1]?.flags ?? 'w' : args[1]
    if (writable(flags)) check(args[0], name)
    return original(...args)
  }
}
for (const [object, name] of [[fs, 'readFile'], [fs, 'readFileSync'], [fsp, 'readFile'],
  [fs, 'readdir'], [fs, 'readdirSync'], [fsp, 'readdir'], [fs, 'createReadStream']]) {
  const original = object[name].bind(object)
  object[name] = (...args) => {
    const target = normalized(args[0])
    if (target && !target.startsWith(own + '/') &&
      /\/(?:\.dsh|\.ssh|\.config|pmtool-closure-runtime-20261021)\/|\/pm-tool\/(?:data|backups|exports|private)(?:\/|$)/.test(target)) {
      throw new Error(`QA_FORBIDDEN_READ ${target}`)
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

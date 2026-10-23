import fs from 'node:fs'
import path from 'node:path'
import childProcess from 'node:child_process'
import http from 'node:http'
import { syncBuiltinESMExports } from 'node:module'

const root = process.env.A11_ROOT
if (!root) throw new Error('Private audit root required')
const log = event => fs.appendFileSync(path.join(root, 'resources.ndjson'),
  `${JSON.stringify({ time: new Date().toISOString(), observerPid: process.pid, ...event })}\n`)
log({ type: 'node-start', cwd: process.cwd(), argv: process.argv })
const spawn = childProcess.spawn
childProcess.spawn = function (...args) {
  const child = Reflect.apply(spawn, this, args)
  log({ type: 'spawn', pid: child.pid, executable: args[0], argv: args[1] })
  child.once('exit', (exit, signal) => log({ type: 'child-exit', pid: child.pid, exit, signal }))
  return child
}
const listen = http.Server.prototype.listen
http.Server.prototype.listen = function (...args) {
  this.once('listening', () => log({ type: 'fixture-listen', address: this.address() }))
  this.once('close', () => log({ type: 'fixture-close' }))
  return Reflect.apply(listen, this, args)
}
syncBuiltinESMExports()

/**
 * 浏览器发现与选择（macOS）。只列本机实测存在的浏览器；不读 cookie、不读凭证。
 */
import { existsSync } from 'node:fs'
import { openBrowserArgs } from './launcher-core.mjs'

/** 原型下拉选项；仅在本机实测存在时列出。 */
const KNOWN = [
  { id: 'chrome', app: 'Google Chrome.app', label: 'Chrome' },
  { id: 'safari', app: 'Safari.app', label: 'Safari' },
  { id: 'firefox', app: 'Firefox.app', label: 'Firefox' },
  { id: 'edge', app: 'Microsoft Edge.app', label: 'Microsoft Edge' },
]

/**
 * 扫描应用目录，返回本机存在的浏览器列表（默认浏览器恒为首项）。
 * @param {string} appsDir 可注入的应用目录（测试用）。
 * @param {(p:string)=>boolean} exists 可注入的存在性检查。
 * @returns {{id:string,label:string,app:string}[]}
 */
export function discoverBrowsers(appsDir = '/Applications', exists = defaultExists) {
  const found = KNOWN.filter(({ app }) => exists(`${appsDir}/${app}`))
  return found
}

function defaultExists(p) {
  return existsSync(p)
}

/**
 * 解析所选浏览器为 open 命令参数；所选不可用时回退系统默认浏览器。
 * @param {string} choice 用户选择（系统默认浏览器 / 某浏览器名）。
 * @param {{id:string,label:string,app:string}[]} discovered
 * @returns {{argv:string[], fallback:boolean}}
 */
export function resolveBrowserOpen(choice, discovered = []) {
  const labels = new Set(discovered.map((b) => b.label))
  if (choice !== '系统默认浏览器' && !labels.has(choice)) {
    // 所选不可用：回退默认浏览器，不报错失败。
    return { ...openBrowserArgs('系统默认浏览器', ''), fallback: true }
  }
  return openBrowserArgs(choice, '')
}

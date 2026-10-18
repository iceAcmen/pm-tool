// 合同 §5.3：原生 window.confirm 清零；所有破坏性/后果性动作走自定义 ConfirmDialog（confirmDanger）。
// 静态扫描 src/client：禁止 window.confirm 字面量；confirmDanger 调用点数量 >= 12（面板 10 + tasks 2）。
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = join(import.meta.dirname, '..', 'src', 'client')
const files = []
;(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p)
    else if (/\.(tsx|ts)$/.test(name)) files.push(p)
  }
})(root)

let nativeConfirm = 0
let dangerCalls = 0
for (const f of files) {
  const text = readFileSync(f, 'utf8')
  // 去掉行注释后再统计，避免把说明性注释算成调用。
  const code = text.split('\n').map(l => l.replace(/\/\/.*$/, '')).join('\n')
  nativeConfirm += (code.match(/window\.confirm\s*\(/g) || []).length
  dangerCalls += (code.match(/confirmDanger\s*\(/g) || []).length
}

if (nativeConfirm !== 0) {
  console.error(`FAIL：仍存在 ${nativeConfirm} 处 window.confirm，必须替换为 confirmDanger`)
  process.exit(1)
}
if (dangerCalls < 12) {
  console.error(`FAIL：confirmDanger 调用点仅 ${dangerCalls}（期望 >=12）`)
  process.exit(1)
}
console.log(`verify-no-native-confirm OK：window.confirm=0，confirmDanger 调用 ${dangerCalls} 处`)

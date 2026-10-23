import fs from 'node:fs'
import assert from 'node:assert/strict'
const repo='/Users/bytedance/Projects/dsh-pm/pm-tool'
const source=repo+'/reports/all-pending-evidence-20261021/CombinedF02RepairR2/executor-source.mjs'
let code=fs.readFileSync(source,'utf8')
code=code.replaceAll('CombinedF02RepairR2','CombinedL8RepairR3')
  .replaceAll('/private/tmp/pmtool-combined-f02-repair-20261023-r2','/private/tmp/pmtool-combined-l8-repair-20261023-r3')
  .replaceAll('/private/tmp/pmtool-combined-six-repairs-20261023-r1','/private/tmp/pmtool-combined-f02-repair-20261023-r2')
  .replaceAll('CombinedSixRepairsR1/source-files.json','CombinedF02RepairR2/source-files.json')
  .replaceAll('CombinedSixRepairsR1/complete-inputs.json','CombinedF02RepairR2/complete-inputs.json')
code=code.replace(
  "'src/client/views/records/records-deliverable-pointer-dom.test.tsx',\n    'src/client/views/records/records-listbox.tsx'",
  "'src/client/views/gantt-status.test.tsx',\n    'src/client/views/gantt.tsx'",
)
const oldReviews='"f02-related28-infrastructure-retest-20261023-r3-report.md"]'
assert(code.includes(oldReviews))
code=code.replace(oldReviews,'"f02-related28-infrastructure-retest-20261023-r3-report.md","l8-gantt-source-auto-review-20261023-r3-report.md"]')
assert(code.includes("assert.equal(Object.keys(priorInputs).length,525)"))
assert(code.includes("'src/client/views/gantt-status.test.tsx',\n    'src/client/views/gantt.tsx'"))
assert(!code.includes('CombinedSixRepairsR1/'))
const target=repo+'/docs/plans/2026-10-23-combined-l8-r3-executor.mjs'
fs.writeFileSync(target,code,{flag:'wx'})
console.log(JSON.stringify({prepared:true,target,parent:'CombinedF02RepairR2',changes:['gantt.tsx','gantt-status.test.tsx'],executedBuild:false}))

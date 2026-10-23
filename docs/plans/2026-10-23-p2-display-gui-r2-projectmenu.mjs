import {createHarness} from '/private/tmp/pmtool-f02-repair-gui-harness-20261023-r2.mjs'
const h=createHarness('P2DisplayRepairGuiR2'),{browser,page}=await h.connect()
let stop
try{
  stop=await h.record(page,'round07-project-menu')
  await h.textButton(page,'QA-A-fixture-F5')
  const ui=await h.state(page,'round07-project-menu-open')
  console.log(JSON.stringify({buttons:ui.buttons,fields:ui.fields}))
}finally{if(stop)await stop();await browser.disconnect()}

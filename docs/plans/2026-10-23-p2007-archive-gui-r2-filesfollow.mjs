import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-f02-repair-gui-harness-20261023-r2.mjs'
const h=createHarness('P2007ArchiveRepairGuiR2'),{browser,page}=await h.connect()
const dir=h.runtime+'/exports/p2007-archive-repair-gui-r2'
let stop
try{
  const target=JSON.parse(await fs.readFile(h.out+'/round03-owned-file-tab.json')).targetId
  const filePage=await browser.targets().find(t=>t._targetId===target)?.page()
  assert(filePage,'original owned file tab must remain')
  const prior=JSON.parse(await fs.readFile(h.out+'/round03-export-originals.json'))
  for(const row of prior){const b=await fs.readFile(row.originalPath);assert.equal(b.length,row.bytes);assert.equal(h.sha(b),row.sha256)}
  assert.equal(new URL(filePage.url()).pathname,dir+'/package.json')
  stop=await h.record(filePage,'round04-files-follow')
  await filePage.bringToFront()
  await filePage.mouse.wheel({deltaY:12000})
  await filePage.waitForFunction(()=>scrollY>0,{timeout:5000})
  await filePage.screenshot({path:h.out+'/round04-file-0-bottom.png'})
  await h.save('round04-file-0-bottom-scroll.json',await filePage.evaluate(()=>({scrollX,scrollY,innerHeight,scrollHeight:document.documentElement.scrollHeight,url:location.href})))
  await filePage.keyboard.press('PageUp')
  await filePage.screenshot({path:h.out+'/round04-file-0-reflections-lower.png'})
  await filePage.keyboard.press('PageUp')
  await filePage.screenshot({path:h.out+'/round04-file-0-reflections-upper.png'})
  await h.save('round04-file-0-reflection-scroll.json',await filePage.evaluate(()=>({scrollX,scrollY,innerHeight,scrollHeight:document.documentElement.scrollHeight,url:location.href})))
  await filePage.goto('file://'+dir+'/'+encodeURIComponent('README-字段说明.md'),{waitUntil:'load',timeout:15000})
  const s=await filePage.evaluate(()=>({at:new Date().toISOString(),url:location.href,title:document.title,text:document.body.innerText,timeOrigin:performance.timeOrigin}))
  assert.equal(s.text,await fs.readFile(dir+'/README-字段说明.md','utf8'))
  await h.save('round04-file-1.json',s)
  await filePage.screenshot({path:h.out+'/round04-file-1.png'})
  await stop();stop=null
  await page.bringToFront()
  await h.state(page,'round04-after-files')
  console.log({actualFileBodyEqual:true,originalTabReused:true,priorKeyboardFacilityFailureRetained:true})
}catch(e){await h.save('round04-error.json',{error:String(e),stack:e.stack});await h.state(page,'round04-error-state');throw e}
finally{if(stop)await stop();await browser.disconnect()}

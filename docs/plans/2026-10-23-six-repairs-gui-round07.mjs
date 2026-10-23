import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-six-repairs-gui-harness-20261023.mjs'
const h=createHarness('SixRepairsGuiR1')
const binding=JSON.parse(await fs.readFile(h.out+'/backup-copy-binding.json'))
const backup=JSON.parse(await fs.readFile(binding.target))
const source=binding.source+'.files.'+backup.fileBundleId
const target=binding.target+'.files.'+backup.fileBundleId
await fs.cp(source,target,{recursive:true,errorOnExist:true,force:false})
const items=[]
async function walk(dir){
  for(const e of await fs.readdir(dir,{withFileTypes:true})){
    const p=dir+'/'+e.name
    if(e.isDirectory())await walk(p)
    else {
      const rel=p.slice(target.length+1),b=await fs.readFile(p),original=await fs.readFile(source+'/'+rel)
      assert.deepEqual(b,original)
      items.push({rel,bytes:b.length,sha256:h.sha(b)})
    }
  }
}
await walk(target)
await h.save('sidecar-copy-binding.json',{source,target,items,correction:'Actual standard suffix .files.<fileBundleId>; prior content-only rejection retained. No backup JSON changes.'})
const {browser,page}=await h.connect()
let stop
try {
  stop=await h.record(page,'round07')
  await page.focus('input[placeholder="粘贴备份成功提示中的完整路径"]')
  await page.keyboard.type(binding.target)
  await h.textButton(page,'预检本机备份')
  await page.waitForSelector('.pm-restore-confirm',{visible:true,timeout:10000})
  const ui=await h.state(page,'round07-file-prechecked')
  console.log({text:ui.text?.slice(-2200),buttons:ui.buttons.slice(-12),dialogs:ui.dialogs})
} catch(e) {await h.state(page,'round07-error-state');throw e}
finally {if(stop)await stop();await browser.disconnect()}

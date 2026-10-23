import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-six-repairs-gui-harness-20261023.mjs'
const h=createHarness('SixRepairsGuiR1')
const backupResponse=JSON.parse(await fs.readFile(h.out+'/round02-backup-command.json'))
const result=backupResponse.body.result.value.result
assert.equal(result.kind,'success')
const backup=result.text.match(/文件：([^\n]+)/)[1].trim()
const content=await fs.readFile(backup)
const doc=JSON.parse(content)
await fs.copyFile(backup,h.runtime+'/backups/current-f5-backup.json',fs.constants.COPYFILE_EXCL)
const sidecar=backup+'.files'
if(await fs.stat(sidecar).catch(()=>null))await fs.cp(sidecar,h.runtime+'/backups/current-f5-backup.json.files',{recursive:true,errorOnExist:true,force:false})
await h.save('original-f5-backup.json',content.toString())
await h.save('backup-copy-binding.json',{at:new Date().toISOString(),source:backup,target:h.runtime+'/backups/current-f5-backup.json',bytes:content.length,sha256:h.sha(content),sidecar:!!await fs.stat(sidecar).catch(()=>null),counts:{projects:doc.projects.length,tasks:doc.tasks.length},extra:Object.fromEntries(Object.entries(doc.extra??{}).map(([k,v])=>[k,v.length]))})
const {browser,page}=await h.connect()
try {
  assert.equal(new URL(page.url()).origin,'http://127.0.0.1:3264')
  await fs.writeFile(h.runtime+'/private/return-url',page.url(),{flag:'wx',mode:0o600})
  const scripts=[],pending=[]
  const onResponse=r=>{
    if((r.headers()['content-type']??'').includes('javascript'))pending.push(r.buffer().then(async b=>{
      const file='browser-script-'+scripts.length+'.js'
      scripts.push({pathname:new URL(r.url()).pathname,file,bytes:b.length,sha256:h.sha(b)})
      await h.save(file,b.toString())
    }))
  }
  page.on('response',onResponse)
  await page.goto(await fs.readFile(h.runtime+'/private/entry-url','utf8'),{waitUntil:'domcontentloaded'})
  await page.waitForSelector('[aria-label="项目管理"]',{timeout:10000})
  await Promise.all(pending);page.off('response',onResponse)
  await h.save('browser-script-binding.json',scripts)
  const ui=await h.state(page,'round03-new-entry')
  console.log({origin:ui.origin,buttons:ui.buttons,text:ui.text?.slice(0,1000)})
} finally {await browser.disconnect()}

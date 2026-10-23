import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-f02-repair-gui-harness-20261023-r2.mjs'
const h=createHarness('P2007ArchiveRepairGuiR2'),{browser,page}=await h.connect()
const dir=h.runtime+'/exports/p2007-archive-repair-gui-r2'
let stop
try{
  const files=['package.json','README-字段说明.md'],originals=[]
  await fs.mkdir(h.out+'/exported-originals',{recursive:true})
  for(const name of files){
    const b=await fs.readFile(dir+'/'+name)
    await fs.writeFile(h.out+'/exported-originals/'+name,b,{flag:'wx'})
    originals.push({name,originalPath:dir+'/'+name,bytes:b.length,sha256:h.sha(b)})
  }
  await h.save('round03-export-originals.json',originals)
  const snapshot=JSON.parse(await fs.readFile(dir+'/package.json'))
  const rows=[]
  for(const reflected of snapshot.reflections){
    const source=JSON.parse(await fs.readFile(h.out+'/round02-before-archive-raw/data/pmtool/reflections/'+reflected.id+'.json')).record
    const known=source.draft.lines.filter(l=>l.mark==='known').map(l=>l.text)
    assert.deepEqual(reflected.knownLines,known)
    assert.deepEqual(reflected.gaps,source.draft.gaps)
    for(const key of ['id','sourceEvent','status','createdAt','updatedAt'])assert.equal(reflected[key],source[key])
    for(const key of ['taskId','milestoneId','deliverableId'])assert.equal(reflected[key],source[key]??null)
    rows.push({id:source.id,sourceEvent:source.sourceEvent,status:source.status,known,gaps:source.draft.gaps,excluded:source.draft.lines.filter(l=>l.mark!=='known'),archive:reflected})
  }
  assert.equal(rows.length,4);assert.equal(rows.reduce((n,r)=>n+r.known.length,0),9);assert.equal(rows.reduce((n,r)=>n+r.gaps.length,0),2)
  await h.save('round03-source-archive-byte-observations.json',{rows,knownCount:9,gapCount:2,role:'Main raw collection; independent verdict pending'})
  const filePage=await browser.newPage()
  await h.save('round03-owned-file-tab.json',{at:new Date().toISOString(),targetId:filePage.target()._targetId})
  stop=await h.record(filePage,'round03-real-file-open')
  for(const [i,name] of files.entries()){
    await filePage.goto('file://'+dir+'/'+encodeURIComponent(name),{waitUntil:'load',timeout:15000})
    const s=await filePage.evaluate(()=>({at:new Date().toISOString(),url:location.href,title:document.title,text:document.body.innerText,timeOrigin:performance.timeOrigin}))
    assert.equal(s.text,await fs.readFile(dir+'/'+name,'utf8'))
    await h.save('round03-file-'+i+'.json',s)
    await filePage.screenshot({path:h.out+'/round03-file-'+i+'-upper.png'})
    if(i===0){
      await filePage.keyboard.press('Control+End')
      await filePage.keyboard.press('Meta+ArrowDown')
      await filePage.screenshot({path:h.out+'/round03-file-0-lower.png'})
      await filePage.keyboard.press('PageUp')
      await filePage.screenshot({path:h.out+'/round03-file-0-reflections.png'})
      await h.save('round03-file-0-scroll.json',await filePage.evaluate(()=>({scrollX,scrollY,innerHeight,scrollHeight:document.documentElement.scrollHeight,url:location.href})))
    }
  }
  await stop();stop=null
  await page.bringToFront()
  await h.state(page,'round03-after-files')
  console.log(JSON.stringify({originals,knownCount:9,gapCount:2,reflections:rows.map(r=>({id:r.id,known:r.known.length,gaps:r.gaps.length}))}))
}catch(e){await h.save('round03-error.json',{error:String(e),stack:e.stack});await h.state(page,'round03-error-state');throw e}
finally{if(stop)await stop();await browser.disconnect()}

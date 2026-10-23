import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-six-repairs-gui-harness-20261023.mjs'
const h=createHarness('SixRepairsGuiR1')
const {browser,page}=await h.connect()
const id='ref-mvk0iiij-42f7xa'
let stop
try {
  stop=await h.record(page,'round11')
  await h.state(page,'round11-milestone-before')
  const markdown='已核：里程碑 m-0001 的原达成记录已回读  来源保持\n待核：关联任务 t-0001 尚未完成\n待补：里程碑签字扫描件'
  await h.save('round11-human-material.json',{id,markdown,source:'Main via native composer input; explicit edit followed by final'})
  for(const [label,line] of [['edit','/pm reflect '+id+' edit "'+markdown+'"'],['final','/pm reflect '+id+' final'],['repeat','/pm reflect '+id+' final']]){
    const response=await h.command(page,line,'round11-milestone-'+label)
    assert.equal(response.result.value.result.kind,'success')
    await page.waitForFunction((prefix)=>document.body.innerText.includes(prefix),{timeout:5000},label==='edit'?'草稿已更新':'已定稿：'+id)
    await h.state(page,'round11-milestone-'+label+'-ui')
    await h.save('round11-milestone-'+label+'-body.json',await page.evaluate(()=>({text:document.body.innerText})))
    const record=JSON.parse(await fs.readFile(h.runtime+'/data/pmtool/reflections/'+id+'.json')).record
    assert.equal(record.status,label==='edit'?'draft':'final')
    assert.equal(record.id,id);assert.equal(record.sourceEvent,'milestone-achieved');assert.equal(record.milestoneId,'m-0001')
    assert.deepEqual(record.draft.lines.map(l=>l.mark),['known','pending','blank'])
    console.log({label,id,status:record.status,marks:record.draft.lines.map(l=>l.mark),gaps:record.draft.gaps})
  }
} catch(e){await h.state(page,'round11-error-state');throw e}
finally {if(stop)await stop();await browser.disconnect()}

import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-six-repairs-gui-harness-20261023.mjs'
const h=createHarness('SixRepairsGuiR1')
const {browser,page}=await h.connect()
const id='ref-mvk0iiij-42f7xa'
let stop
try {
  stop=await h.record(page,'round12')
  await h.state(page,'round12-after-short-first-submit')
  const markdown='已核：里程碑 m-0001 的原达成记录已回读  来源保持\n待核：关联任务 t-0001 尚未完成\n待补：里程碑签字扫描件'
  const line='/pm reflect '+id+' edit "'+markdown+'"'
  await page.focus('[contenteditable=true]')
  await page.keyboard.down('Meta');await page.keyboard.press('KeyA');await page.keyboard.up('Meta')
  const parts=line.split('\n')
  for(let i=0;i<parts.length;i++){
    if(i){await page.keyboard.down('Shift');await page.keyboard.press('Enter');await page.keyboard.up('Shift')}
    await page.keyboard.type(parts[i])
  }
  await h.save('round12-composer-before-send.json',await page.evaluate(()=>({text:document.querySelector('[contenteditable=true]')?.innerText})))
  await h.state(page,'round12-three-lines-entered')
  const waiting=page.waitForResponse(r=>new URL(r.url()).pathname==='/api/commands/execute'&&r.request().postData()?.includes('reflect '+id+' edit'),{timeout:15000})
  await page.click('button[aria-label="发送消息"]')
  const res=await waiting,body=await res.json()
  await h.save('round12-milestone-edit-command.json',{requestedLine:line,status:res.status(),body})
  assert.equal(body.result.value.result.kind,'success')
  await page.waitForFunction(()=>document.body.innerText.includes('待补：里程碑签字扫描件'),{timeout:5000})
  await h.state(page,'round12-milestone-edit-ui')
  await h.save('round12-edit-body.json',await page.evaluate(()=>({text:document.body.innerText})))
  const record=JSON.parse(await fs.readFile(h.runtime+'/data/pmtool/reflections/'+id+'.json')).record
  assert.equal(record.status,'draft');assert.deepEqual(record.draft.lines.map(l=>l.mark),['known','pending','blank'])
  for(const label of ['final','repeat']){
    const response=await h.command(page,'/pm reflect '+id+' final','round12-milestone-'+label)
    assert.equal(response.result.value.result.kind,'success')
    await page.waitForFunction((id)=>document.body.innerText.includes('已定稿：'+id),{timeout:5000},id)
    await h.state(page,'round12-milestone-'+label+'-ui')
    await h.save('round12-'+label+'-body.json',await page.evaluate(()=>({text:document.body.innerText})))
  }
  console.log({id,marks:record.draft.lines.map(l=>l.mark),draftBeforeFinal:record.status})
} catch(e){await h.state(page,'round12-error-state');throw e}
finally {if(stop)await stop();await browser.disconnect()}

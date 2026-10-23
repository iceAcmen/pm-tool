import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-six-repairs-gui-harness-20261023.mjs'
const h=createHarness('SixRepairsGuiR1')
const {browser,page}=await h.connect()
const fixture=JSON.parse(await fs.readFile(h.out+'/round21-fixture-identity.json','utf8'))
const draft={title:'保稿H未提交文字20261023',goal:'未提交目标原文20261023',frequency:'工作日',notes:'未提交备注原文20261023'}
async function replace(selector,text) {
  await page.click(selector,{clickCount:3})
  await page.keyboard.type(text)
}
async function fields() {
  return page.evaluate(()=>[...document.querySelectorAll('.gf-root input,.gf-root textarea')].map(n=>({id:n.id,value:n.value,disabled:n.disabled})))
}
let stop
try {
  stop=await h.record(page,'round24')
  await h.state(page,'round24-before-negative-draft')
  await replace('#gf-habit-title',draft.title)
  await replace('#gf-habit-goal',draft.goal)
  await replace('#gf-habit-freq',draft.frequency)
  await replace('#gf-habit-notes',draft.notes)
  for (const [label,id,errorText] of [
    ['missing',fixture.missingId,'未找到关联目标'],
    ['cross',fixture.cross.id,'关联目标不属于指定项目'],
  ]) {
    await replace('#gf-habit-okr',id)
    await h.save('round24-'+label+'-draft-before-save.json',await fields())
    await h.state(page,'round24-'+label+'-before-save')
    const waiting=page.waitForResponse(r=>new URL(r.url()).pathname==='/api/commands/execute'&&r.request().postData()?.includes('habit update '+fixture.H.id),{timeout:10000})
    await page.click('.gf-actions .gf-btn--primary')
    const res=await waiting,body=await res.json()
    await h.save('round24-'+label+'-save-response.json',{status:res.status(),request:JSON.parse(res.request().postData()),body})
    assert.equal(body.result.value.result.kind,'error')
    await page.waitForFunction(s=>document.body.innerText.includes(s),{timeout:5000},errorText)
    await h.save('round24-'+label+'-draft-after-rejection.json',await fields())
    const after=await h.state(page,'round24-'+label+'-after-rejection')
    const visible=await page.evaluate(s=>({
      text:document.body.innerText,
      errorNodes:[...document.querySelectorAll('[role=alert],.pm-feedback,.pm-notice,pre,span,p,div')].filter(n=>n.childElementCount===0&&n.innerText?.includes(s)&&n.getClientRects().length).map(n=>({tag:n.tagName,cls:n.className,text:n.innerText,bbox:n.getBoundingClientRect().toJSON()})),
      active:{tag:document.activeElement?.tagName,id:document.activeElement?.id},
    }),errorText)
    await h.save('round24-'+label+'-rejection-visible.json',visible)
    assert(after.dialogs.some(d=>d.label==='编辑习惯'))
    console.log(JSON.stringify({label,id,kind:body.result.value.result.kind,fields:await fields(),errors:visible.errorNodes,dialogs:after.dialogs.length}))
  }
} catch(e) {
  await h.save('round24-error.json',{error:String(e),stack:e.stack})
  await h.state(page,'round24-error-state')
  throw e
} finally {if(stop)await stop();await browser.disconnect()}

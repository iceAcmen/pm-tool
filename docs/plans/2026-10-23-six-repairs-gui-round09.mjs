import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-six-repairs-gui-harness-20261023.mjs'
const h=createHarness('SixRepairsGuiR1')
const {browser,page}=await h.connect()
let stop
try {
  stop=await h.record(page,'round09')
  await h.state(page,'round09-restored-current')
  const newSession=await page.evaluateHandle(()=>[...document.querySelectorAll('button')].find(n=>n.getClientRects().length&&n.innerText.trim().startsWith('新会话')))
  assert(newSession.asElement());await newSession.asElement().click()
  await page.waitForSelector('[contenteditable=true]',{visible:true,timeout:10000})
  const snap=await h.command(page,'/pm web snapshot','round09-snapshot')
  assert.equal(snap.result.value.result.kind,'success')
  const parsed=JSON.parse(snap.result.value.result.text)
  await h.save('round09-live-snapshot.json',parsed)
  assert.equal(parsed.tasks.length,8);assert.equal(parsed.okrs.length,4);assert.equal(parsed.habits.length,1)
  await h.command(page,'/pm reflect-list p-0001','round09-reflect-list')
  await h.state(page,'round09-list-ui')
  const outside=await page.evaluate(()=>({text:document.body.innerText,focus:document.activeElement?.outerHTML.slice(0,300),scroll:[...document.querySelectorAll('main,section,article,div')].filter(n=>n.scrollHeight>n.clientHeight+100&&n.clientHeight>200).slice(-12).map(n=>({tag:n.tagName,cls:n.className,scrollHeight:n.scrollHeight,clientHeight:n.clientHeight}))}))
  await h.save('round09-outside-list.json',outside)
  console.log({counts:{tasks:parsed.tasks.length,okrs:parsed.okrs.length,habits:parsed.habits.length},tail:outside.text.slice(-3000),scroll:outside.scroll})
} catch(e){await h.state(page,'round09-error-state');throw e}
finally {if(stop)await stop();await browser.disconnect()}

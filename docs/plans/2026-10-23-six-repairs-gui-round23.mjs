import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-six-repairs-gui-harness-20261023.mjs'
const h=createHarness('SixRepairsGuiR1')
const {browser,page}=await h.connect()
let stop
try {
  stop=await h.record(page,'round23')
  const E=await page.evaluateHandle(()=>[...document.querySelectorAll('[role=option]')].find(n=>n.innerText.includes('QA-E-habit-negative-20261023')))
  assert(E.asElement());await E.asElement().click()
  await page.waitForFunction(()=>!document.querySelector('[role=listbox]'),{timeout:6000})
  const habits=await page.evaluateHandle(()=>[...document.querySelectorAll('.pm-shell button')].find(n=>/^习惯(\s*\d+)?$/.test(n.innerText.trim())))
  assert(habits.asElement());await habits.asElement().click()
  await page.waitForFunction(()=>document.querySelector('.pm-shell')?.innerText.includes('负例夹具习惯H'),{timeout:6000})
  const list=await h.state(page,'round23-E-habit-list')
  console.log(JSON.stringify({text:list.text,buttons:list.buttons.slice(-18),fields:list.fields}))
  const edit=await page.evaluateHandle(()=>[...document.querySelectorAll('.pm-shell button')].find(n=>n.innerText.trim()==='编辑'&&n.getClientRects().length))
  assert(edit.asElement());await edit.asElement().click()
  await page.waitForSelector('input#gf-habit-okr',{visible:true,timeout:6000})
  const form=await h.state(page,'round23-original-H-edit-text-fallback')
  await h.save('round23-H-form-fields.json',await page.evaluate(()=>[...document.querySelectorAll('.gf-root input,.gf-root textarea')].map(n=>({id:n.id,value:n.value,disabled:n.disabled}))))
  console.log(JSON.stringify({dialogs:form.dialogs,fields:form.fields,buttons:form.buttons.slice(-10)}))
} catch(e) {
  await h.save('round23-error.json',{error:String(e),stack:e.stack})
  await h.state(page,'round23-error-state')
  throw e
} finally {if(stop)await stop();await browser.disconnect()}

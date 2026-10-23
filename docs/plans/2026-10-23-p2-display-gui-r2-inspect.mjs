import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-f02-repair-gui-harness-20261023-r2.mjs'
const h=createHarness('P2DisplayRepairGuiR2'),{browser,page}=await h.connect()
try{
  assert.equal(new URL(page.url()).origin,'http://127.0.0.1:3269')
  const s=await h.state(page,'round00-initial')
  const host=await page.evaluate(()=>({
    buttons:[...document.querySelectorAll('button')].filter(n=>n.getClientRects().length).map(n=>({text:n.innerText,aria:n.getAttribute('aria-label'),title:n.title})),
    links:[...document.querySelectorAll('a')].filter(n=>n.getClientRects().length).map(n=>({text:n.innerText,href:n.getAttribute('href')})),
    editables:[...document.querySelectorAll('[contenteditable]')].map(n=>({visible:!!n.getClientRects().length,text:n.innerText})),
    headings:[...document.querySelectorAll('h1,h2,h3')].map(n=>n.innerText),
    sidecar:[...document.querySelectorAll('[class*="sidecar"]')].filter(n=>n.className.includes('portal')).map(n=>({className:n.className,hidden:n.hidden,text:n.innerText}))
  }))
  await h.save('round00-entry-observation.json',host)
  console.log({dialogs:s.dialogs,host})
}finally{await browser.disconnect()}

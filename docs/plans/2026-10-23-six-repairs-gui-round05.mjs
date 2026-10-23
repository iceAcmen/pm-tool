import {createHarness} from '/private/tmp/pmtool-six-repairs-gui-harness-20261023.mjs'
const h=createHarness('SixRepairsGuiR1')
const {browser,page}=await h.connect()
try {
  await h.state(page,'round05-observed')
  const ui=await page.evaluate(()=>({origin:location.origin,pathname:location.pathname,text:document.body.innerText.slice(-6000),buttons:[...document.querySelectorAll('button')].filter(n=>n.getClientRects().length).map(n=>({text:n.innerText,aria:n.getAttribute('aria-label')}))}))
  await h.save('round05-outside.json',ui)
  console.log(ui)
} finally {await browser.disconnect()}

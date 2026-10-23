import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-gui-capture-harness-20261023.mjs'
const h=createHarness('SixRepairsGuiR1')
const {browser,page}=await h.connect()
let stop
try {
  const before=await h.state(page,'round01-old-f5-before')
  assert.equal(before.origin,'http://127.0.0.1:3264')
  console.log({origin:before.origin,dialogs:before.dialogs,buttons:before.buttons.filter(b=>/会话|消息/.test(b.text+' '+b.aria))})
  stop=await h.record(page,'round01')
  if(!await page.$('[contenteditable=true]')){
    await h.textButton(page,'新会话')
    await page.waitForSelector('[contenteditable=true]',{timeout:15000})
  }
  await h.command(page,'/pm backup','round01-backup')
  await h.state(page,'round01-old-f5-after-backup')
} finally {if(stop)await stop();await browser.disconnect()}

import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-f02-repair-gui-harness-20261023-r2.mjs'
const h=createHarness('P2DisplayRepairGuiR2'),{browser,page}=await h.connect()
let stop
try{
  assert.equal(new URL(page.url()).origin,'http://127.0.0.1:3269')
  stop=await h.record(page,'round03-native-tab')
  await h.state(page,'round03-native-before')
  async function focus(){
    return page.evaluate(()=>{
      const n=document.activeElement,box=n?.getBoundingClientRect(),style=n?getComputedStyle(n):null
      return {at:new Date().toISOString(),tag:n?.tagName,text:n?.innerText,aria:n?.getAttribute('aria-label'),placeholder:n?.getAttribute('placeholder'),bbox:box?.toJSON(),outline:{color:style?.outlineColor,width:style?.outlineWidth,style:style?.outlineStyle},centerHits:box?document.elementFromPoint(box.x+box.width/2,box.y+box.height/2)===n:false}
    })
  }
  const steps=[{input:'initial',focus:await focus()}]
  // 从页面现有自然焦点前进；不先focus opener，不点击打开、不输入或发送。
  for(let i=0;i<18;i++){
    await page.keyboard.press('Tab')
    const observed=await focus()
    steps.push({input:'native Tab',focus:observed})
    if(observed.text?.trim()==='打开任务'){
      await h.state(page,'round03-native-opener-visible')
      break
    }
  }
  await h.save('round03-native-tab-steps.json',{steps,reached:steps.at(-1).focus.text?.trim()==='打开任务',oldAnswerRestored:false,context:'正常PM重进后恢复的既有撤销批次处理卡；原ask正文未恢复，不冒同原ask上下文'})
  await h.state(page,'round03-native-after')
  await page.click('button[aria-label="最小化为侧边标签（保留上下文）"]')
  await h.state(page,'round03-native-minimized')
  console.log(JSON.stringify({steps}))
}catch(e){await h.save('round03-native-error.json',{error:String(e),stack:e.stack});throw e}
finally{if(stop)await stop();await browser.disconnect()}

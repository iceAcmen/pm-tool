import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-f02-repair-gui-harness-20261023-r2.mjs'
import {centeredPointer} from './2026-10-23-f02-gui-r2-helpers.mjs'
export async function collectExit(method){
  assert(['cancel','x','keys'].includes(method))
  const h=createHarness('P1004RepairGuiR2'),{browser,page}=await h.connect()
  const phase='p1004exit-'+method
  let stop
  const tabs=[]
  try{
    assert.equal(new URL(page.url()).origin,'http://127.0.0.1:3269')
    stop=await h.record(page,phase)
    await h.state(page,phase+'-before')
    if(method==='cancel'){
      assert(await page.$('[role=dialog][aria-label="编辑任务"]'))
    }else{
      assert(!(await page.$('[role=dialog]')))
      if(method==='keys'){
        let reached=false
        for(let n=0;n<80;n++){
          const focus=await page.evaluate(()=>({tag:document.activeElement?.tagName,name:document.activeElement?.getAttribute('name'),text:document.activeElement?.textContent?.trim(),inSidecar:!!document.activeElement?.closest?.('.pm-sidecar')}))
          tabs.push(focus)
          if(focus.inSidecar&&focus.tag==='BUTTON'&&focus.text==='打开任务'){reached=true;break}
          await page.keyboard.press('Tab')
        }
        assert(reached,'Native Tab cannot reach the original opener; no pointer fallback')
        await h.state(page,phase+'-opener-native-focus')
        await page.keyboard.press('Enter')
      }else{
        const open=await page.evaluateHandle(()=>[...document.querySelectorAll('.pm-sidecar button')].find(n=>n.innerText.trim()==='打开任务'))
        await centeredPointer(h,page,open.asElement(),phase+'-original-opener')
      }
      await page.waitForSelector('[role=dialog][aria-label="编辑任务"]',{timeout:5000})
      await h.state(page,phase+'-first-target-open')
    }
    assert.equal(await page.$eval('input[name="assignee"]',n=>n.value),'P1004刷新负责人')
    assert.equal(await page.$eval('input[name="progress"]',n=>n.value),'47')
    assert(await page.$eval('.pm-sidecar',n=>n.hidden))
    if(method==='keys'){
      await page.keyboard.press('Tab')
      await h.state(page,phase+'-target-native-tab')
      await page.keyboard.press('Escape')
    }else{
      const button=method==='x'?await page.$('[role=dialog] button[aria-label="关闭抽屉"]'):
        (await page.evaluateHandle(()=>[...document.querySelectorAll('[role=dialog] button')].find(n=>n.innerText.trim()==='取消'))).asElement()
      await centeredPointer(h,page,button,phase+'-unique-direct-exit')
    }
    await page.waitForFunction(()=>!document.querySelector('[role=dialog]')&&!document.querySelector('.pm-sidecar')?.hidden,{timeout:5000})
    await h.state(page,phase+'-returned-original-card')
    const text=await page.$eval('.pm-sidecar',n=>n.innerText)
    assert(text.includes('负责人未指派、进度0%'))
    assert(text.includes('负责人：P1004刷新负责人'))
    await page.waitForFunction(()=>document.activeElement?.textContent?.trim()==='打开任务'&&!!document.activeElement?.closest?.('.pm-sidecar'),{timeout:5000})
    const focus=await page.evaluate(()=>{
      const n=document.activeElement,b=n.getBoundingClientRect(),hit=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2),css=getComputedStyle(n)
      return {tag:n.tagName,text:n.textContent?.trim(),bbox:b.toJSON(),hit:{tag:hit?.tagName,text:hit?.textContent?.trim()},centerHitsFocus:hit===n||n.contains(hit),outline:{style:css.outlineStyle,width:css.outlineWidth,color:css.outlineColor},sidecarHidden:document.querySelector('.pm-sidecar')?.hidden}
    })
    await h.save(phase+'-actual-return-focus.json',focus)
    assert(focus.centerHitsFocus)
    await h.state(page,phase+'-visible-return-focus')
    const before=JSON.parse(await fs.readFile(h.out+'/'+phase+'-before-roots.json'))
    const after=JSON.parse(await fs.readFile(h.out+'/'+phase+'-visible-return-focus-roots.json'))
    assert.deepEqual(after,before)
    await h.save(phase+'-observations.json',{method,uniqueDirectExitAttempts:1,rootsEqual:true,oldAnswerAndLatestProjectionPreserved:true,tabs,returnFocus:focus,independentGUI:'PENDING'})
    console.log({method,uniqueDirectExitAttempts:1,rootsEqual:true,returnFocus:focus.text,sidecarHidden:focus.sidecarHidden})
  }catch(e){
    await h.save(phase+'-error.json',{error:String(e),stack:e.stack,tabs})
    await h.state(page,phase+'-error-state')
    throw e
  }finally{if(stop)await stop();await browser.disconnect()}
}

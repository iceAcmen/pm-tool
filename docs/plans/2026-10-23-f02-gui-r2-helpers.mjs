import assert from 'node:assert/strict'
export async function centeredPointer(h,page,handle,name){
  assert(handle)
  await handle.scrollIntoView()
  const target=await handle.evaluate(n=>{
    const b=n.getBoundingClientRect(),hit=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2)
    return {bbox:b.toJSON(),tag:n.tagName,text:n.innerText,hit:{tag:hit?.tagName,cls:hit?.className,text:hit?.innerText},hitIsTarget:hit===n||n.contains(hit),popup:!!document.querySelector('.rb-lb-menu'),backdrop:!!document.querySelector('.rb-lb-backdrop')}
  })
  await h.save(name+'-pointer-target.json',target)
  assert(target.hitIsTarget,'Actual coordinate is obstructed; do not supplement this click')
  await page.mouse.click(target.bbox.x+target.bbox.width/2,target.bbox.y+target.bbox.height/2)
}
export async function selectPointer(h,page,label,name){
  const trigger=await page.$('button[aria-label="交付物状态"]')
  await centeredPointer(h,page,trigger,name+'-trigger')
  await page.waitForSelector('[role=option]',{visible:true,timeout:4000})
  await h.state(page,name+'-menu')
  const option=await page.evaluateHandle(s=>[...document.querySelectorAll('[role=option]')].find(n=>n.innerText.trim()===s)?.querySelector('span'),label)
  await centeredPointer(h,page,option.asElement(),name+'-option-span')
  await h.state(page,name+'-immediate-selection')
  const closure=await page.evaluate(()=>new Promise(resolve=>{
    const start=performance.now(),samples=[]
    const tick=()=>{
      const sample={at:performance.now(),popup:!!document.querySelector('.rb-lb-menu'),backdrop:!!document.querySelector('.rb-lb-backdrop'),expanded:document.querySelector('#deliverable-status')?.getAttribute('aria-expanded'),status:document.querySelector('#deliverable-status')?.innerText}
      samples.push(sample)
      if(sample.popup||sample.backdrop||sample.expanded!=='false')resolve({stable:false,start,samples})
      else if(performance.now()-start>=1000)resolve({stable:true,start,samples})
      else requestAnimationFrame(tick)
    }
    tick()
  }))
  await h.save(name+'-stable-closure.json',closure)
  assert(closure.stable,'Selection is not stably closed; stop this chain')
  assert(closure.samples.every(s=>s.status?.trim().startsWith(label)))
  await h.state(page,name+'-stable-selection')
}
export async function mainPointerSave(h,page,name){
  const save=await page.evaluateHandle(()=>[...document.querySelectorAll('[role=dialog] button')].find(n=>n.innerText.trim()==='保存更改'))
  assert(save.asElement())
  const waiting=page.waitForResponse(r=>new URL(r.url()).pathname==='/api/commands/execute'&&r.request().postData()?.includes('deliverable update dlv-0001'),{timeout:12000})
  await centeredPointer(h,page,save.asElement(),name+'-main-save')
  const response=await waiting,body=await response.json()
  await h.save(name+'-main-save-response.json',{status:response.status(),request:JSON.parse(response.request().postData()),body})
  assert.equal(body.result.value.result.kind,'success')
  await page.waitForFunction(()=>!document.querySelector('[role=dialog][aria-label="编辑交付物"]'),{timeout:5000})
  await h.state(page,name+'-closed-after-save')
}
export async function observeNativeClicks(h,page,name){
  const cdp=await page.createCDPSession(),clicks=[],tag='[F02-R2-'+name+']'
  cdp.on('Runtime.consoleAPICalled',e=>{
    if(e.args[0]?.value===tag)clicks.push({timestamp:e.timestamp,observation:JSON.parse(e.args[1].value)})
  })
  await cdp.send('Runtime.enable')
  const installed=await cdp.send('Runtime.evaluate',{
    expression:`(() => {
      const id=n=>n instanceof Element?{tag:n.tagName,id:n.id,cls:n.className,role:n.getAttribute('role'),text:n.textContent?.trim().slice(0,80)}:{tag:String(n)};
      const observe=phase=>e=>console.debug(${JSON.stringify(tag)},JSON.stringify({phase,type:e.type,isTrusted:e.isTrusted,detail:e.detail,defaultPrevented:e.defaultPrevented,target:id(e.target),path:e.composedPath().map(id),focus:id(document.activeElement),status:document.querySelector('#deliverable-status')?.innerText,expanded:document.querySelector('#deliverable-status')?.getAttribute('aria-expanded'),popup:!!document.querySelector('.rb-lb-menu'),backdrop:!!document.querySelector('.rb-lb-backdrop')}));
      const capture=observe('capture'),bubble=observe('bubble');
      document.addEventListener('click',capture,{capture:true,passive:true});document.addEventListener('click',bubble,{capture:false,passive:true});
      return {capture,bubble};
    })()`,returnByValue:false,
  })
  assert(!installed.exceptionDetails);const objectId=installed.result.objectId;assert(objectId)
  return async()=>{
    const r=await cdp.send('Runtime.callFunctionOn',{objectId,functionDeclaration:'function(){document.removeEventListener("click",this.capture,true);document.removeEventListener("click",this.bubble,false);return {removed:2}}',returnByValue:true})
    await h.save(name+'-native-click-observations.json',{boundary:'Browser-only passive listeners, no DOM/default action/store/props mutation; native pointers only. Main does not issue independent GUI verdict.',cleanup:r.result.value,clicks})
    await cdp.send('Runtime.releaseObject',{objectId});await cdp.detach()
  }
}

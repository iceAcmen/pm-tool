import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {createHarness} from '/private/tmp/pmtool-f02-repair-gui-harness-20261023-r2.mjs'
export const h=createHarness('L8GanttRefreshR3')
export const repo='/Users/bytedance/Projects/dsh-pm/pm-tool'
export const runtime='/private/tmp/pmtool-op-growth-runtime-20261022-r1'
export async function roots(name){
  const values={}
  for(const root of ['data','files','backups']){
    async function walk(dir){
      for(const e of await fs.readdir(dir,{withFileTypes:true})){
        const p=dir+'/'+e.name
        if(e.isDirectory())await walk(p)
        else{
          const b=await fs.readFile(p),rel=p.slice(runtime.length+1)
          values[rel]={bytes:b.length,sha256:h.sha(b)}
          if(rel.startsWith('data/pmtool/')){
            const dst=h.out+'/'+name+'-raw/'+rel
            await fs.mkdir(dst.slice(0,dst.lastIndexOf('/')),{recursive:true})
            await fs.writeFile(dst,b,{flag:'wx'})
          }
        }
      }
    }
    try{await walk(runtime+'/'+root)}catch(e){if(e.code!=='ENOENT')throw e}
  }
  await h.save(name+'-roots.json',values)
  return values
}
export async function state(page,name){
  const r=await roots(name)
  const ui=await page.evaluate(()=>({
    at:new Date().toISOString(),origin:location.origin,timeOrigin:performance.timeOrigin,
    viewport:{innerWidth,innerHeight,outerWidth,outerHeight,dpr:devicePixelRatio},
    text:document.querySelector('.pm-shell')?.innerText,
    dialogs:[...document.querySelectorAll('[role=dialog],[role=alertdialog]')].map(n=>({text:n.innerText,aria:n.getAttribute('aria-label')})),
    controls:[...document.querySelectorAll('.pm-shell button,.pm-shell select')].filter(n=>n.getClientRects().length).map(n=>({tag:n.tagName,text:n.innerText,aria:n.getAttribute('aria-label'),value:n.value,title:n.title,options:n.tagName==='SELECT'?[...n.options].map(o=>({text:o.text,value:o.value})):undefined})),
    l8:[...document.querySelectorAll('.pm-shell *')].filter(n=>n.children.length===0&&n.textContent==='F2-L8').map(n=>({tag:n.tagName,cls:n.className,parent:n.parentElement?.innerText,grandparent:n.parentElement?.parentElement?.innerText,bbox:n.getBoundingClientRect().toJSON()})),
  }))
  await h.save(name+'.json',ui)
  await page.screenshot({path:h.out+'/'+name+'.png'})
  return {r,ui}
}
export async function copyBindings(){
  const copies={
    'original-r2-report.md':'docs/testing/op-growth-remaining-gui-review-20261022-r2-report.md',
    'original-r2-index.json':'reports/all-pending-evidence-20261021/OpGrowthRemainingR2/index-r1.json',
    'original-r2-final-roots.json':'reports/all-pending-evidence-20261021/OpGrowthRemainingR2/15-objective40-null-stable-roots.json',
    'original-r2-final-ui.json':'reports/all-pending-evidence-20261021/OpGrowthRemainingR2/15-objective40-null-stable.json',
    'original-host-start.json':'reports/all-pending-evidence-20261021/OpGrowthRemainingR1/host-reentry-start.json',
    'original-host-ready.json':'reports/all-pending-evidence-20261021/OpGrowthRemainingR1/host-reentry-ready.json',
    'original-source-binding.json':'reports/all-pending-evidence-20261021/OpGrowthRemainingR2/source-binding-close.json',
    'original-complete-inputs.json':'reports/all-pending-evidence-20261021/CombinedSuccessor112R1/complete-inputs.json',
  }
  const bindings={}
  for(const [dst,src]of Object.entries(copies)){
    const b=await fs.readFile(repo+'/'+src)
    await h.save(dst,b.toString('utf8'))
    bindings[dst]={original:src,bytes:b.length,sha256:h.sha(b)}
  }
  await h.save('original-bindings.json',bindings)
}
export async function sameOriginal(r){
  const old=JSON.parse(await fs.readFile(h.out+'/original-r2-final-roots.json','utf8'))
  assert.deepEqual(r,old)
}

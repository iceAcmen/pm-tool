/**
 * control HTML 渲染（纯函数）：由面板视图模型生成自包含页面字符串。
 * 容器 = 普通浏览器 tab（127 loopback）；红绿灯/齿轮纯装饰，不伪装原生窗。
 * 页面内不嵌入 token；不读 cookie；关闭窗口只关本页，不停止服务。
 */

const TOKENS = `
:root{color-scheme:light;--bg:#edf0f5;--surface:#fff;--soft:#f5f6f8;--line:#e0e4eb;--ink:#222b37;--muted:#687483;--accent:#4669ab;--accent-soft:#eef3fc;--ok:#27734f;--warn:#a96b26;--danger:#a84040;--shadow:0 24px 70px rgba(37,50,73,.14),0 2px 7px rgba(37,50,73,.06)}
[data-theme=dark]{color-scheme:dark;--bg:#202329;--surface:#2a2d33;--soft:#32353c;--line:#444951;--ink:#eef1f5;--muted:#adb6c3;--accent:#91b1ef;--accent-soft:#353f53;--ok:#8ccfaa;--warn:#e1b777;--danger:#eca1a1;--shadow:0 24px 70px rgba(0,0,0,.27),0 2px 7px rgba(0,0,0,.15)}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 -apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;min-height:100vh;display:grid;place-items:center;padding:20px}button,select{font:inherit}button{cursor:pointer;border:0;background:none;color:inherit}button:disabled{cursor:default;opacity:.6}button:focus-visible,select:focus-visible{outline:3px solid var(--accent);outline-offset:3px}h1,h2,p{margin:0}
.window{width:min(100%,420px);border:1px solid var(--line);background:var(--surface);border-radius:16px;box-shadow:var(--shadow)}
.titlebar{height:48px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line);padding:0 18px;background:var(--soft);border-radius:16px 16px 0 0}
.lights{display:flex;gap:7px;width:70px}.light{width:11px;height:11px;border-radius:50%;background:#ff6058}.light:nth-child(2){background:#ffbd2e}.light:nth-child(3){background:#28c840}
.window-label{font-size:13px;font-weight:550;color:var(--muted)}.quiet-icon{width:34px;height:34px;display:grid;place-items:center;border-radius:6px;min-height:34px}.quiet-icon:hover{background:var(--line)}
.body{padding:26px 24px}.brand{display:flex;align-items:center;gap:14px;margin-bottom:20px}.app-icon{width:52px;height:52px;border-radius:14px;background:var(--accent);color:#fff;display:grid;place-items:center;flex-shrink:0}.app-icon svg{width:30px;height:30px}.brand h2{font-size:21px;font-weight:650;letter-spacing:-.5px}.brand p{font-size:13px;color:var(--muted);margin-top:2px}
.status-line{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:600}.status-dot{width:7px;height:7px;background:var(--ok);border-radius:50%}.status-dot.off{background:var(--muted)}.sub{margin:6px 0 0 15px;color:var(--muted);font-size:14px}
.form-label{display:block;margin:18px 0 8px;font-size:14px;font-weight:550}.browser-field{position:relative}.browser-select{width:100%;min-height:48px;display:flex;align-items:center;justify-content:space-between;padding:0 14px;border-radius:8px;border:1px solid var(--line);background:var(--surface)}.browser-current{display:flex;align-items:center;gap:10px}.browser-mark{width:25px;height:25px;border-radius:7px;display:grid;place-items:center;background:var(--accent-soft);color:var(--accent);font-size:12px;font-weight:700}.chevron{color:var(--muted)}
.browser-select>svg{width:18px;height:18px;flex:0 0 18px;color:var(--muted)}
.menu{position:absolute;left:0;right:0;top:54px;background:var(--surface);padding:5px;border:1px solid var(--line);border-radius:10px;box-shadow:var(--shadow);z-index:4}.menu button{display:flex;width:100%;align-items:center;gap:10px;padding:9px 10px;min-height:44px;text-align:left;border-radius:6px}.menu button:hover{background:var(--soft)}.menu .selected{margin-left:auto;color:var(--accent)}
.primary{width:100%;min-height:48px;padding:11px 18px;background:var(--accent);color:#fff;border-radius:9px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:9px;margin-top:20px}.secondary{border:1px solid var(--line);border-radius:8px;padding:10px 14px;min-height:44px;background:var(--surface);width:100%}.text-btn{color:var(--muted);font-size:13px;min-height:34px;padding:4px 6px;text-decoration:underline;text-underline-offset:3px}.row{display:flex;gap:10px;margin-top:18px}.row>*{flex:1}
.state-main{text-align:center;padding:14px 0 4px}.state-icon{width:54px;height:54px;border-radius:50%;background:var(--soft);color:var(--ok);display:grid;place-items:center;margin:0 auto 14px}.state-icon svg{width:25px;height:25px}.state-main h2{font-size:21px;font-weight:650}.state-main p{font-size:14px;color:var(--muted);margin-top:8px}
.steps{margin:18px 0 6px;padding:0;list-style:none}.steps li{display:flex;align-items:center;gap:12px;padding:9px 0;font-size:14px;color:var(--muted)}.steps li.active{color:var(--ink);font-weight:550}.step-icon{width:22px;height:22px;border-radius:50%;background:var(--soft);border:1px solid var(--line);display:grid;place-items:center;font-size:12px;flex-shrink:0}.done .step-icon{background:var(--accent-soft);color:var(--accent);border-color:transparent}.progress-track{height:4px;background:var(--line);border-radius:4px;overflow:hidden;margin:14px 0}.progress-fill{height:100%;background:var(--accent);transition:width .3s}.spin{width:16px;height:16px;border:2px solid var(--line);border-top-color:var(--accent);border-radius:50%;animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
.safe-line{margin-top:14px;padding:12px 14px;background:var(--soft);border-radius:9px;font-size:13px;color:var(--muted)}.details{margin-top:12px;padding:14px;background:var(--soft);border-radius:8px;font-size:13px;line-height:1.7;color:var(--muted);word-break:break-word}
.footer{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:13px 21px;border-top:1px solid var(--line);font-size:13px;color:var(--muted)}.privacy{display:flex;align-items:center;gap:6px}.privacy svg{width:14px;height:14px}
.theme-switch{display:flex;gap:6px;justify-content:flex-end;margin-bottom:12px}.theme-switch button{border:1px solid var(--line);border-radius:8px;min-height:38px;padding:6px 12px;font-size:13px}.theme-switch[aria-pressed=true]{background:var(--accent-soft)}
@media(prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
`

const ICONS = {
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  chevron: '<path d="m7 10 5 5 5-5"/>',
  check: '<path d="m5 12 4 4 10-10"/>',
  shield: '<path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Z"/><path d="m8 12 3 3 5-6"/>',
  error: '<path d="M12 4v9M12 17v1"/><circle cx="12" cy="12" r="10"/>',
  app: '<path d="M7 20V4h7a5 5 0 0 1 0 10H7M7 8h7a1 1 0 0 1 0 2H7"/>',
}
const svg = (name) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`

/** HTML 转义（视图文本/浏览器名进入 DOM 属性与文本）。 */
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

/**
 * @param {object} viewModel buildPanelViewModel 结果
 * @param {{initialState?:object}} [ctx] 服务端初始状态（不含 token）
 */
export function renderControlHtml(viewModel, ctx = {}) {
  const base = ctx.initialState ?? viewModel
  const initial = JSON.stringify({ ...base, csrfNonce: ctx.nonce ?? '' }).replace(/</g, '\\u003c')
  return `<!doctype html>
<html lang="zh-CN" data-theme="${esc(viewModel.theme)}">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>PM 工作台 · 启动器</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='16' fill='%234669ab'/%3E%3Cpath d='M23 45V19h11c13 0 13 17 0 17H23M23 25h10c5 0 5 5 0 5H23' fill='none' stroke='white' stroke-width='4'/%3E%3C/svg%3E">
<style>${TOKENS}</style>
</head>
<body>
<section class="window" aria-label="PM 工作台启动窗口">
  <div class="titlebar">
    <span class="lights" aria-hidden="true"><span class="light"></span><span class="light"></span><span class="light"></span></span>
    <span class="window-label">PM 工作台</span>
    <button class="quiet-icon" id="theme-toggle" aria-label="切换浅色深色">◐</button>
  </div>
  <div class="body" id="root"></div>
  <footer class="footer"><span class="privacy">${svg('shield')}仅在这台 Mac 上运行</span><button class="text-btn" id="close">关闭窗口</button></footer>
</section>
<script>
const INIT=${initial};
const ICONS=${JSON.stringify(ICONS)};
let state=INIT; let menuOpen=false; let detailOpen=false;
let stopped=false; let syncTimer=null; let reading=false; let actionBusy=false; let revision=0; let readController=null;
let actionTicket=0; let pendingBrowser=null; let preferenceFlight=null; const actionControllers=new Set();
let preferenceError='';
let localTheme=state.theme||'light';
function esc(s){ return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function svg(name){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+ICONS[name]+'</svg>'; }
function acceptState(next){
  if(!next||stopped)return;
  const merged={...next,csrfNonce:state.csrfNonce||'',theme:localTheme};
  if(pendingBrowser!==null)merged.selectedBrowser=pendingBrowser;
  if(JSON.stringify(merged)===JSON.stringify(state))return;
  state=merged; render();
}
function scheduleSync(){
  if(stopped||syncTimer!==null)return;
  syncTimer=setTimeout(()=>{syncTimer=null;void refresh();},500);
}
function stopSync(){
  stopped=true;revision+=1;
  if(syncTimer!==null){clearTimeout(syncTimer);syncTimer=null;}
  readController?.abort();
  actionControllers.forEach(controller=>controller.abort());
}
async function postAction(payload){
  const controller=new AbortController();actionControllers.add(controller);
  // owned 启动允许最多30s；读取和取消独立进行，POST也必须有结束边界。
  const deadline=setTimeout(()=>controller.abort(),35000);
  try{
    const r=await fetch('/api/action',{method:'POST',signal:controller.signal,headers:{'content-type':'application/json','x-csrf-nonce':state.csrfNonce||''},body:JSON.stringify(payload)});
    const j=await r.json();
    return r.ok?j.state:null;
  }finally{clearTimeout(deadline);actionControllers.delete(controller);}
}
async function saveBrowser(){
  try{
    while(!stopped&&pendingBrowser!==null){
      const browser=pendingBrowser;revision+=1;
      const next=await postAction({type:'select-browser',browser});
      if(stopped)return;
      revision+=1;
      if(next&&pendingBrowser===browser)pendingBrowser=null;
      if(next)acceptState(next);
      // 失败时保留本地选择，等下一次用户选择/打开再尝试，避免无限写请求。
      if(!next)break;
    }
  }catch(e){ /* 不把失败的偏好写入显示成权威成功。 */ }
  finally{preferenceFlight=null;scheduleSync();}
}
async function act(payload){
  if(stopped)return;
  if(payload.type==='select-browser'){
    preferenceError='';
    pendingBrowser=payload.browser;
    if(!preferenceFlight)preferenceFlight=saveBrowser();
    return preferenceFlight;
  }
  if(actionBusy&&payload.type!=='cancel')return;
  if(payload.type!=='cancel'&&preferenceFlight)await preferenceFlight;
  if(payload.type!=='cancel'&&pendingBrowser!==null){
    if(!preferenceFlight)preferenceFlight=saveBrowser();
    await preferenceFlight;
    if(pendingBrowser!==null){
      preferenceError='浏览器选择未保存，请重新选择后重试。';
      render();return;
    }
  }
  if(stopped||(actionBusy&&payload.type!=='cancel'))return;
  const ticket=++actionTicket;actionBusy=true;revision+=1;render();
  try{
    const next=await postAction({...payload,browser:pendingBrowser||state.selectedBrowser||state.browser});
    if(!stopped&&ticket===actionTicket&&next){revision+=1;acceptState(next);}
  }catch(e){ /* 保留当前权威状态；只读同步仍可恢复，不模拟成功。 */ }
  finally{if(ticket===actionTicket){actionBusy=false;render();}scheduleSync();}
}
async function refresh(){
  if(stopped)return;
  if(reading){scheduleSync();return;}
  reading=true;const requestRevision=revision;
  const controller=new AbortController();readController=controller;
  const deadline=setTimeout(()=>controller.abort(),3000);
  try{
    const r=await fetch('/api/state',{signal:controller.signal});const j=await r.json();
    if(!stopped&&requestRevision===revision&&r.ok)acceptState(j.state);
  }catch(e){ /* 读取失败保持真实旧态；下次串行读取可恢复。 */ }
  finally{clearTimeout(deadline);if(readController===controller)readController=null;reading=false;scheduleSync();}
}
function chrome(){ return state.browser||'系统默认浏览器' }
function actionsRow(actions){ return '<div class="row" aria-busy="'+actionBusy+'">'+actions.map(a=>'<button class="'+(a.kind==='primary'?'primary':a.kind==='secondary'?'secondary':'text-btn')+'" data-act="'+esc(a.id)+'"'+(actionBusy&&a.id!=='cancel'?' disabled':'')+'>'+esc(a.label)+'</button>').join('')+'</div>' }
function body(){
  const v=state.view||state.status;
  if(v==='S2'){ const steps=['检查本地服务','准备工作台','打开浏览器'].map((t,i)=>'<li class="'+(i<state.step?'done':i===state.step?'active':'')+'"><span class="step-icon">'+(i<state.step?svg('check'):i===state.step?'<span class="spin"></span>':String(i+1))+'</span>'+t+'</li>').join('');
    return '<div class="state-main"><h2>正在打开工作台</h2><p>完成后将在所选浏览器打开；取消不会停止已有服务。</p></div><ol class="steps">'+steps+'</ol><div class="progress-track" aria-label="启动进度"><div class="progress-fill" style="width:'+([24,63,88][state.step]||0)+'%"></div></div>'+actionsRow([{id:'cancel',label:'取消打开',kind:'secondary'}]); }
  if(v==='S3'){ return '<div class="state-main"><div class="state-icon">'+svg('arrow')+'</div><h2>已在浏览器投递，等待已进入回告</h2><p>等待受认证工作台 mount 后回告；启动器不自动判定已登录、不以按钮冒充成功，也不重放进程启动令牌。</p></div>'+actionsRow([{id:'report-auth-error',label:'看到登录 / 认证错误',kind:'secondary'},{id:'switch-browser',label:'更换浏览器',kind:'text'}]); }
  if(v==='S4'){ return '<div class="state-main"><div class="state-icon">'+svg('check')+'</div><h2>工作台已打开</h2><p>已由受认证工作台回告进入'+(state.browser?'（'+esc(state.browser)+'）':'')+'，可以开始工作了。</p></div>'+actionsRow([{id:'reopen',label:'再次打开',kind:'primary'},{id:'switch-browser',label:'更换浏览器',kind:'text'}]); }
  if(v==='S5'){ return '<div class="state-main"><div class="state-icon" style="color:var(--danger)">'+svg('error')+'</div><h2>已打开，但当前浏览器未登录</h2><p>该浏览器没有本机服务签发的签名 cookie；启动器不重放进程启动令牌、不注入会话。请在该标签页完成登录，或换用已有登录态的浏览器。</p></div>'+actionsRow([{id:'finish-login',label:'在该标签页完成登录',kind:'primary'},{id:'switch-browser',label:'换用已登录的浏览器',kind:'secondary'},{id:'toggle-detail',label:'查看详情',kind:'text'}])+(detailOpen&&state.detail?'<div class="details" role="region">'+esc(JSON.stringify(state.detail))+'</div>':''); }
  if(v==='S6'){ const target=(state.host||'127.0.0.1')+':'+(state.port||3172); return '<div class="state-main"><div class="state-icon" style="color:var(--danger)">'+svg('error')+'</div><h2>暂时无法打开</h2><p>'+esc(state.detail?.detection||'本地服务暂不可用。')+'</p></div><div class="safe-line">没有停止任何程序，项目数据和现有服务保持不变。</div>'+actionsRow([{id:'retry',label:'重新尝试',kind:'primary'},{id:'toggle-detail',label:'查看详情',kind:'secondary'},{id:'back',label:'返回启动入口',kind:'text'}])+(detailOpen&&state.detail?'<div class="details" role="region">访问地址：'+esc(target)+'<br>检测结果：'+esc(state.detail.detection||'')+'<br>处理结果：'+esc(state.detail.outcome||'')+'<br>建议：'+esc(state.detail.suggestion||'')+'</div>':''); }
  // S0 / S1
  const running=v==='S1';
  const currentBrowser=state.selectedBrowser||state.browser||'系统默认浏览器';
  const options=(state.browsers||['系统默认浏览器']).map(b=>'<button role="option" aria-selected="'+(currentBrowser===b)+'" data-browser="'+esc(b)+'"><span class="browser-mark">'+(b==='系统默认浏览器'?'↗':esc(b.charAt(0)))+'</span>'+esc(b)+(currentBrowser===b?'<span class="selected">'+svg('check')+'</span>':'')+'</button>').join('');
  return '<div class="brand"><div class="app-icon">'+svg('app')+'</div><div><h2>PM 工作台</h2><p>DeepSeek Harness · 本地入口</p></div></div>'
    +'<div class="status-line"><span class="status-dot '+(running?'':'off')+'"></span>'+(running?'工作台已在运行':'工作台尚未启动')+'</div><p class="sub">'+(running?'将打开现有服务，不重复启动；复用依赖该浏览器既有登录态。':'点击打开后，自动启动本地服务。')+'</p>'
    +'<div class="form-label" id="browser-label">打开方式</div><div class="browser-field"><button class="browser-select" id="browser-toggle" data-act="browser-toggle" aria-labelledby="browser-label" aria-haspopup="listbox" aria-expanded="'+menuOpen+'"><span class="browser-current"><span class="browser-mark">'+(currentBrowser==='系统默认浏览器'?'↗':esc(currentBrowser.charAt(0)))+'</span>'+esc(currentBrowser)+'</span>'+svg('chevron')+'</button>'+(menuOpen?'<div class="menu" role="listbox" aria-label="选择浏览器">'+options+'</div>':'')+'</div>'
    +(preferenceError?'<p class="safe-line" role="alert">'+esc(preferenceError)+'</p>':'')
    +actionsRow([{id:'open',label:'打开 PM 工作台',kind:'primary'}]);
}
function render(){
  if(stopped)return;
  const focusedId=document.activeElement?.id;
  const focusedBrowser=document.activeElement?.dataset.browser;
  const focusedAction=document.activeElement?.dataset.act;
  document.body.dataset.theme=localTheme;
  document.getElementById('root').innerHTML=body();
  document.querySelectorAll('[data-act]').forEach(b=>b.onclick=()=>{ const id=b.dataset.act; if(id==='toggle-detail'){detailOpen=!detailOpen;render();return;} if(id==='browser-toggle'){menuOpen=!menuOpen;render();return;} act({type:id,browser:state.selectedBrowser||state.browser}); });
  document.querySelectorAll('[data-browser]').forEach(b=>b.onclick=()=>{ state.selectedBrowser=b.dataset.browser; menuOpen=false;render(); act({type:'select-browser',browser:state.selectedBrowser});document.getElementById('browser-toggle')?.focus(); });
  const t=document.getElementById('theme-toggle'); if(t)t.onclick=()=>{ localTheme=localTheme==='dark'?'light':'dark';state.theme=localTheme; render(); };
  const c=document.getElementById('close'); if(c)c.onclick=()=>{ stopSync();document.querySelector('.window')?.remove(); };
  const focused=focusedId?document.getElementById(focusedId):focusedBrowser?[...document.querySelectorAll('[data-browser]')].find(b=>b.dataset.browser===focusedBrowser):focusedAction?[...document.querySelectorAll('[data-act]')].find(b=>b.dataset.act===focusedAction):null;
  focused?.focus();
}
document.addEventListener('keydown',e=>{ if(e.key==='Escape'){ menuOpen=false; detailOpen=false; render();document.getElementById('browser-toggle')?.focus(); } });
window.addEventListener('pagehide',stopSync,{once:true});
render(); refresh();
</script>
</body>
</html>`
}

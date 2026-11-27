'use strict';
// =====================================================================
// OUTREMER — Ludimus v2: tela de criação/seleção de personagem no visual pintado do Lote 4
// (couro, pergaminho, molduras de ferro e latão, plaquinhas esculpidas) com o herói pintado
// ao vivo num arco de pedra. Só troca a aparência: ids, cliques e textos (PT/EN) ficam iguais.
// =====================================================================
(function(){
const A4='assets/lote4/ui/', A5='assets/lote5/ui/';
const css=document.createElement('style'); css.id='lote5-ui'; css.textContent=`
#screen-create{background:radial-gradient(ellipse at 50% 45%,rgba(0,0,0,.15),rgba(0,0,0,.72) 75%),url(${A5}cc_fundo.jpg) center/cover no-repeat fixed,#0c0907!important}
#screen-create .create-box,#front-saves .create-box{background:linear-gradient(rgba(26,17,9,.32),rgba(10,6,3,.62)),url(${A4}couro.png) 0 0/128px repeat!important;
  border:14px solid transparent!important;border-image:url(${A4}moldura.png) 22 round!important;background-clip:padding-box!important;box-shadow:0 10px 40px rgba(0,0,0,.85)!important}
#screen-create .create-box{width:min(1180px,100%)!important;padding:8px 22px 8px!important;margin:4px auto!important}
#screen-create .create-box>h1{font-family:'Cinzel',serif!important;font-weight:700!important;font-size:28px!important;letter-spacing:.22em!important;text-align:center;margin:0!important;line-height:1.15!important;
  color:#f0c878!important;text-shadow:0 2px 0 #3a2410,0 0 18px rgba(240,180,80,.35)}
#screen-create .subtitle{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:16px!important;text-align:center;color:#d8c49a!important;margin:0 0 4px!important}
#screen-create .create-box>h1::after{content:'';display:block;height:6px;margin:3px auto 0;width:260px;background:linear-gradient(90deg,transparent,#c9a35a 20%,#f0c878 50%,#c9a35a 80%,transparent) center/100% 1px no-repeat}
#screen-create label{font-family:'Cinzel',serif!important;font-weight:700;font-size:12px!important;letter-spacing:.12em;text-transform:uppercase;color:#e2bd6e!important;margin:4px 0 3px!important;text-shadow:1px 1px 0 #000}
#screen-create label small{font-family:var(--ui);text-transform:none;letter-spacing:0;color:#bba98a;font-weight:400}
#screen-create .cc-note{color:#cbb894!important;font-size:12px!important}
#screen-create input[type=text]{background:url(${A4}pergaminho.png) 0 0/170px repeat!important;color:#2a1a0c!important;font-family:'Cinzel',serif!important;font-weight:700;font-size:18px!important;
  border:6px solid transparent!important;border-image:url(${A4}slot.png) 12 stretch!important;padding:4px 10px!important;margin-bottom:2px!important;box-shadow:inset 0 0 10px rgba(110,70,20,.45)}
#screen-create .seg,#screen-create .cc-tpl button,#front-saves .seg{border:5px solid transparent!important;border-image:url(${A4}plaquinha.png) 10 fill stretch!important;background:none!important;
  color:#f6e6c4!important;text-shadow:1px 1px 0 #000;border-radius:0!important;font-family:var(--ui);filter:brightness(.92) saturate(.9);transition:filter .12s,transform .12s}
#screen-create .seg:hover,#screen-create .cc-tpl button:hover,#front-saves .seg:hover{filter:brightness(1.12)}
#screen-create .seg.on,#screen-create .cc-tpl button[style*="232, 192, 112"]{filter:brightness(1.25) saturate(1.1) drop-shadow(0 0 5px rgba(255,200,100,.65))!important;color:#fff!important}
#screen-create .cc-tpl button{padding:3px 8px!important;font-size:12px!important}
#screen-create .cc-sw b{border:2px solid #7a5a28!important;box-shadow:inset 0 0 0 1px rgba(0,0,0,.6),0 1px 2px rgba(0,0,0,.6);width:24px!important;height:24px!important}
#screen-create .cc-sw b.on{border-color:#f0c878!important;outline:1px solid #000;box-shadow:0 0 6px rgba(255,200,100,.8)!important}
#screen-create .cc-step span{font-family:'Cinzel',serif;font-weight:700;color:#f0dcb0!important}
#screen-create .cc-picks div{background:url(${A4}slot.png) 0 0/100% 100% no-repeat!important;border:none!important;color:#e8d8b8!important;min-height:46px!important;padding:8px 6px!important}
#screen-create .cc-picks div b{color:#f0c878!important}
#screen-create .cc-skills{background:url(${A4}pergaminho.png) 0 0/220px repeat!important;border:2px solid #6a4a22!important;box-shadow:inset 0 0 22px rgba(110,70,20,.5);max-height:200px!important;padding:6px 8px!important}
#screen-create .cc-skills h4{font-family:'Cinzel',serif!important;color:#5a3412!important;font-weight:700!important;border-bottom:1px solid rgba(90,52,18,.35);letter-spacing:.08em}
#screen-create .cc-skills span{background:rgba(255,246,220,.35)!important;border:1px solid #8a6a3a!important;color:#2a1a0c!important;border-radius:2px}
#screen-create .cc-skills span:hover{background:rgba(255,236,190,.75)!important}
#screen-create .cc-skills span.on{background:linear-gradient(#7a2a1c,#4a160e)!important;border-color:#f0c878!important;color:#fff3d8!important;box-shadow:0 0 4px rgba(240,190,90,.7)}
#screen-create button.start{border:6px solid transparent!important;border-image:url(${A4}plaquinha.png) 10 fill stretch!important;background:none!important;font-family:'Cinzel',serif!important;
  font-weight:700;font-size:19px!important;letter-spacing:.14em;color:#fff1cf!important;text-shadow:0 2px 0 #000,0 0 10px rgba(255,190,90,.5);padding:5px!important;margin-top:6px!important;filter:saturate(1.05)}
#screen-create button.start:hover:not([disabled]){filter:brightness(1.15) drop-shadow(0 0 8px rgba(255,190,90,.6))}
#screen-create button.start[disabled]{filter:grayscale(.75) brightness(.6)!important;cursor:not-allowed}
#screen-create .linkbtn,#front-saves .linkbtn{color:#e2bd6e!important;font-family:'Cinzel',serif;text-decoration:none!important;letter-spacing:.06em}
#screen-create .linkbtn:hover,#front-saves .linkbtn:hover{color:#fff1cf!important}
#screen-create .look-box.cc-prev{background:linear-gradient(rgba(14,9,4,.55),rgba(14,9,4,.8)),url(${A4}couro.png) 0 0/128px!important;border:6px solid transparent!important;border-image:url(${A4}moldura.png) 22 round!important;margin:4px 0 6px!important;padding:2px!important;justify-content:center}
#screen-create .look-box.cc-prev,#screen-create #preview{display:none!important}
#screen-create .create-box .linkbtn{margin-top:2px!important;display:inline-block}
#screen-create .cc-grid{margin-top:0!important}
@media (min-width:761px){ #screen-create{padding-top:4px!important;padding-bottom:4px!important} }
.cc-shrine{position:relative;display:flex;flex-direction:column;align-items:center}
.cc-shrine canvas#cc-hero{width:258px;height:350px;image-rendering:pixelated;display:block;filter:drop-shadow(0 8px 14px rgba(0,0,0,.7))}
.cc-shrine .cc-hero-name{font-family:'Cinzel',serif;font-weight:700;font-size:20px;letter-spacing:.12em;color:#f0c878;text-shadow:0 2px 0 #000,0 0 10px rgba(240,180,80,.4);margin-top:2px;min-height:24px;text-align:center}
.cc-shrine .cc-hero-sub{font-size:12px;color:#cbb894;text-align:center;min-height:16px}
@media (min-width:1100px){ #screen-create .cc-grid{grid-template-columns:1fr 310px 1.15fr!important;gap:18px!important;align-items:start} }
@media (max-width:1099px){ .cc-shrine canvas#cc-hero{width:240px;height:326px} }
@media (max-width:760px){ #screen-create .create-box{padding:10px 10px!important;border-width:10px!important} .cc-shrine canvas#cc-hero{width:200px;height:271px} #screen-create .create-box>h1{font-size:26px!important} }
#front-saves .create-box h2{font-family:'Cinzel',serif;color:#f0c878!important;letter-spacing:.12em}
#front-saves .slot{background:url(${A4}pergaminho.png) 0 0/200px!important;border:2px solid #6a4a22!important;color:#2a1a0c}
#front-saves .slot b{color:#2a1a0c!important;font-family:'Cinzel',serif}#front-saves .slot small{color:#5a4024!important}
#front-saves button.start{border:6px solid transparent!important;border-image:url(${A4}plaquinha.png) 10 fill stretch!important;background:none!important;font-family:'Cinzel',serif!important;font-weight:700;color:#fff1cf!important}
`;
document.head.appendChild(css);
// ---- arco de pedra com o herói pintado ao vivo ----
const arco=new Image(); arco.src=A5+'cc_arco.png';
let cv=null, nameEl=null, subEl=null, face=0, t0=0, lastK='', shown=false;
const HOLD=[6000,1600,1600,1600]; // frente fica mais tempo
const FACES=['down','left','up','right'];
function mount(){ const box=document.querySelector('#screen-create .create-box'); if(!box||box.querySelector('#cc-hero')) return !!box&&!!cv;
  const grid=box.querySelector('.cc-grid'); if(!grid||grid.children.length<2) return false;
  const mid=document.createElement('div'); mid.className='cc-shrine';
  mid.innerHTML='<canvas id="cc-hero" width="300" height="407"></canvas><div class="cc-hero-name"></div><div class="cc-hero-sub"></div>';
  grid.insertBefore(mid,grid.children[1]); const prev=box.querySelector('.cc-prev'); if(prev) mid.appendChild(prev);
  cv=mid.querySelector('canvas'); nameEl=mid.querySelector('.cc-hero-name'); subEl=mid.querySelector('.cc-hero-sub');
  cv.addEventListener('click',()=>{ face=(face+1)%4; t0=performance.now(); });
  return true; }
function heroCanvas(){ const L2=window.LOTE2; if(!L2||!L2.compose||!L2.dressOf||!L2.camadas||!L2.camadas.ready||typeof chosenLook==='undefined'||!chosenLook) return null;
  try{ return L2.compose(L2.dressOf({look:chosenLook})); }catch(e){ return null; } }
function draw(now){ if(!cv) return; const g=cv.getContext('2d'), W=cv.width, H=cv.height; g.clearRect(0,0,W,H); g.imageSmoothingEnabled=false;
  // fundo do vão do arco: penumbra com luz de tocha
  g.save(); g.beginPath(); g.moveTo(92,330); g.lineTo(92,150); g.quadraticCurveTo(92,82,151,64); g.quadraticCurveTo(211,82,211,150); g.lineTo(211,330); g.closePath(); g.clip();
  const gr=g.createRadialGradient(151,250,10,151,230,170); gr.addColorStop(0,'#5a3a1e'); gr.addColorStop(.45,'#2a1a0e'); gr.addColorStop(1,'#0a0604'); g.fillStyle=gr; g.fillRect(0,0,W,H);
  const fl=.85+.15*Math.sin(now/170)+.05*Math.sin(now/53); g.fillStyle=`rgba(255,170,80,${.10*fl})`; g.fillRect(0,0,W,H); g.restore();
  if(arco.complete&&arco.naturalWidth) g.drawImage(arco,0,0,W,H);
  // brilho no pedestal
  const pg=g.createRadialGradient(151,346,4,151,346,70); pg.addColorStop(0,`rgba(255,210,130,${.30*fl})`); pg.addColorStop(1,'rgba(255,190,100,0)'); g.fillStyle=pg; g.fillRect(70,300,170,90);
  const e=heroCanvas(); const M=window.LOTE2&&LOTE2.camadas&&LOTE2.camadas.meta&&LOTE2.camadas.meta.corpo;
  if(e&&M){ const k=JSON.stringify(chosenLook); if(k!==lastK){ lastK=k; face=0; t0=now; } if(now-t0>HOLD[face]){ face=(face+1)%4; t0=now; } const f=FACES[face], row=f==='up'?1:f==='down'?0:2, flip=f==='right', fr=0, S=3.1, bob=Math.round(Math.sin(now/480)*1.2);
    g.fillStyle='rgba(0,0,0,.42)'; g.beginPath(); g.ellipse(151,347,34,9,0,0,7); g.fill();
    g.save(); g.translate(151,346+bob); g.scale(S*(flip?-1:1),S); g.drawImage(e.cv,fr*M.cw,row*M.ch,M.cw,M.ch,-M.ax,-M.ay,M.cw,M.ch); g.restore(); }
  else if(typeof chosenLook!=='undefined'&&chosenLook&&typeof drawPlayerLook==='function'){ /* sem camadas pintadas: fica só o arco */ }
  try{ const n=document.getElementById('char-name'); if(nameEl&&n) nameEl.textContent=n.value||''; const rd=document.querySelector('#cc-race .seg.on'); const sx=document.querySelector('#sex-m.on,#sex-f.on');
    if(subEl) subEl.textContent=[rd&&rd.textContent,sx&&sx.textContent].filter(Boolean).join(' · '); }catch(err){} }
function loop(now){ const sc=document.getElementById('screen-create'); if(sc&&sc.style.display!=='none'&&getComputedStyle(sc).display!=='none'){ if(!shown){ shown=true; face=0; t0=now; } if(mount()) draw(now); } else shown=false; requestAnimationFrame(loop); }
requestAnimationFrame(loop);
// ---- tela inicial pintada (Ludimus v2): arte de fundo, brasão, título em Cinzel dourado, plaquinhas do Lote 4 ----
(function(){
const st=document.createElement('style'); st.id='lote5-title'; st.textContent=`
#screen-title{background:#0c0907!important;overflow:hidden!important}
#screen-title::before{content:'';position:absolute;inset:-2%;background:url(${A5}tela_titulo_bg.jpg) 50% 50%/cover no-repeat;animation:ttPan 46s ease-in-out infinite alternate;z-index:0}
#screen-title::after{content:'';position:absolute;inset:0;z-index:0;pointer-events:none;background:
  linear-gradient(90deg,rgba(8,5,3,.82) 0%,rgba(8,5,3,.55) 24%,rgba(8,5,3,0) 46%),
  radial-gradient(ellipse at 60% 40%,rgba(0,0,0,0) 45%,rgba(0,0,0,.55) 100%),
  linear-gradient(rgba(0,0,0,0) 70%,rgba(0,0,0,.5))}
@keyframes ttPan{from{transform:scale(1.02) translate(0,0)}to{transform:scale(1.08) translate(-1.2%,-.8%)}}
#screen-title #title-art{display:none!important}
#screen-title .title-box{position:absolute!important;z-index:2;left:max(3vw,24px)!important;top:50%!important;bottom:auto!important;transform:translateY(-50%)!important;width:min(440px,92vw)!important;
  display:flex!important;flex-direction:column;align-items:center;background:none!important;border:0!important;box-shadow:none!important;padding:0!important;text-align:center}
#screen-title .tt-crest{width:clamp(86px,19vh,150px);height:auto;display:block;margin:0 auto -4px;filter:drop-shadow(0 6px 10px rgba(0,0,0,.75)) drop-shadow(0 0 22px rgba(255,190,90,.28));animation:ttGlow 5s ease-in-out infinite alternate}
@keyframes ttGlow{from{filter:drop-shadow(0 6px 10px rgba(0,0,0,.75)) drop-shadow(0 0 14px rgba(255,190,90,.18))}to{filter:drop-shadow(0 6px 10px rgba(0,0,0,.75)) drop-shadow(0 0 26px rgba(255,200,110,.42))}}
#screen-title .game-title{display:block!important;margin:0!important;font-family:'Cinzel',serif!important;font-weight:700!important;font-size:clamp(38px,8.4vh,64px)!important;letter-spacing:.12em!important;white-space:nowrap;line-height:1.05!important;padding-left:.14em;
  background:linear-gradient(180deg,#fff6d2 0%,#f3cf7e 38%,#b47a2c 58%,#e8bd6c 78%,#8a5a1e 100%);-webkit-background-clip:text;background-clip:text;color:transparent!important;-webkit-text-stroke:1px rgba(52,26,6,.55);
  filter:drop-shadow(0 3px 0 #2a1608) drop-shadow(0 0 16px rgba(255,180,80,.32));text-shadow:none!important}
#screen-title .tagline{display:block!important;font-family:'Cormorant Garamond',serif!important;font-style:italic;font-size:clamp(15px,2.4vh,19px)!important;color:#f1dfb8!important;text-shadow:0 2px 3px #000,0 0 10px rgba(0,0,0,.8);margin:4px 0 clamp(10px,2.6vh,22px)!important;white-space:nowrap}
#screen-title .tagline::before,#screen-title .tagline::after{content:'';display:inline-block;width:26px;height:1px;vertical-align:middle;margin:0 8px;background:linear-gradient(90deg,transparent,#d7ae62)}
#screen-title .tagline::after{background:linear-gradient(90deg,#d7ae62,transparent)}
#screen-title .menu{display:flex!important;flex-direction:column!important;flex-wrap:nowrap!important;gap:clamp(5px,1.1vh,9px)!important;align-items:stretch!important;width:min(280px,86vw)}
#screen-title .menu button{width:100%!important;min-width:0!important;margin:0!important;padding:clamp(7px,1.45vh,11px) 14px!important;border:6px solid transparent!important;border-image:url(${A4}plaquinha.png) 10 fill stretch!important;background:none!important;border-radius:0!important;
  font-family:'Cinzel',serif!important;font-weight:700!important;font-size:clamp(14px,2.2vh,17px)!important;letter-spacing:.12em;color:#fff1cf!important;text-shadow:0 2px 0 #000,0 0 8px rgba(255,190,90,.35);filter:brightness(.95) saturate(.95);transition:filter .14s,transform .14s;cursor:pointer}
#screen-title .menu button:hover,#screen-title .menu button:focus-visible{filter:brightness(1.22) saturate(1.1) drop-shadow(0 0 7px rgba(255,200,100,.6));transform:translateX(3px);outline:none}
#screen-title .menu #t-new{font-size:clamp(15px,2.5vh,19px)!important;filter:brightness(1.08) saturate(1.1) drop-shadow(0 0 6px rgba(255,190,90,.35))}
#screen-title .tt-lang{position:absolute;z-index:3;top:14px;right:16px;display:flex;gap:4px}
#screen-title .tt-lang button{border:5px solid transparent;border-image:url(${A4}plaquinha.png) 10 fill stretch;background:none;font-family:'Cinzel',serif;font-weight:700;font-size:13px;letter-spacing:.1em;color:#e8d6ae;padding:4px 10px;cursor:pointer;filter:brightness(.7) saturate(.8)}
#screen-title .tt-lang button.on{filter:brightness(1.2) drop-shadow(0 0 5px rgba(255,200,100,.6));color:#fff}
#screen-title .studio-tag{z-index:3!important;position:absolute!important;bottom:10px!important;left:50%!important;transform:translateX(-50%);display:flex;align-items:center;gap:8px;white-space:nowrap;
  font-family:'Cinzel',serif!important;font-size:11px!important;letter-spacing:.18em;color:rgba(240,220,180,.72)!important;text-shadow:0 1px 2px #000}
#screen-title .studio-tag::before{content:'';width:22px;height:22px;background:url(assets/logo-seal.png) center/contain no-repeat;opacity:.85;filter:drop-shadow(0 0 6px rgba(255,140,80,.4))}
#screen-title .front-pop{z-index:5;background:radial-gradient(ellipse at center,rgba(10,6,3,.55),rgba(0,0,0,.82))!important;backdrop-filter:blur(2px)}
#front-options .create-box,#front-credits .create-box{background:linear-gradient(rgba(26,17,9,.32),rgba(10,6,3,.62)),url(${A4}couro.png) 0 0/128px repeat!important;
  border:14px solid transparent!important;border-image:url(${A4}moldura.png) 22 round!important;background-clip:padding-box!important;box-shadow:0 10px 40px rgba(0,0,0,.85)!important}
#screen-title .front-pop .create-box{width:min(560px,94vw)!important;max-height:92vh;overflow:auto;padding:16px 22px!important}
#screen-title .front-pop h2{font-family:'Cinzel',serif!important;font-weight:700;color:#f0c878!important;letter-spacing:.14em;text-align:center;text-shadow:0 2px 0 #000;margin:0 0 10px!important}
#screen-title .front-pop h2::after{content:'';display:block;height:1px;width:200px;margin:6px auto 0;background:linear-gradient(90deg,transparent,#d7ae62,transparent)}
#front-options .opt{display:flex;align-items:center;gap:10px;color:#ecdcb8!important;font-family:var(--ui);margin:6px 0;padding:6px 10px;background:url(${A4}pergaminho.png) 0 0/200px;border:2px solid #6a4a22;color:#2a1a0c!important}
#front-options select{background:#f3e5c2;color:#2a1a0c;border:1px solid #6a4a22;font-family:var(--ui);padding:2px 4px}
#front-options .controls-help{color:#d8c49a!important;font-size:12px;line-height:1.45;margin-top:10px;background:rgba(0,0,0,.3);padding:8px 10px;border:1px solid rgba(215,174,98,.25)}
#front-credits p{color:#e8d8b8!important;text-align:center}#front-credits b{color:#f0c878}
#front-saves .slot canvas{background:radial-gradient(circle,rgba(255,220,150,.35),rgba(0,0,0,0) 70%)}
#front-saves .slot .seg{font-family:'Cinzel',serif!important;font-weight:700}
#front-saves .slot{height:auto!important;min-height:54px;width:100%!important;cursor:default;align-items:center!important;padding:6px 10px!important;box-sizing:border-box}
#front-saves .slot>div{min-width:0}#front-saves .slot b{color:#2a1a0c!important;font-family:'Cinzel',serif;font-size:15px;line-height:1.2}#front-saves .slot small{display:block;line-height:1.25;color:#5a4024!important;font-size:12px}
#front-saves .slot .seg{padding:5px 12px!important;font-size:13px!important;white-space:nowrap}
#front-saves .slot.empty{opacity:.82;min-height:46px}
@media (max-width:760px){ #front-saves .slot{flex-wrap:wrap!important;gap:6px 8px!important} #front-saves .slot>div{flex:1 1 55%!important} #front-saves .slot .seg{padding:4px 9px!important;font-size:12px!important} #front-saves .slot.empty>div{flex:1 1 40%!important} }
#screen-title .front-pop .linkbtn{display:block;margin:10px auto 0!important;font-family:'Cinzel',serif;letter-spacing:.1em;color:#e2bd6e!important}
@media (max-width:760px){
  #screen-title::before{background-position:58% 50%}
  #screen-title::after{background:linear-gradient(rgba(8,5,3,.72) 0%,rgba(8,5,3,.25) 30%,rgba(8,5,3,0) 48%,rgba(8,5,3,.35) 62%,rgba(8,5,3,.85) 100%)}
  #screen-title .title-box{left:50%!important;top:0!important;bottom:0!important;transform:translateX(-50%)!important;justify-content:space-between;padding:58px 0 54px!important;width:92vw!important;height:100%;box-sizing:border-box}
  #screen-title .tt-head{display:flex;flex-direction:column;align-items:center}
  #screen-title .tt-crest{width:min(120px,30vw)}
  #screen-title .game-title{font-size:min(52px,12.5vw)!important}
  #screen-title .tagline{white-space:normal!important;font-size:15px!important}
  #screen-title .menu{width:min(300px,80vw)}
  #screen-title .menu button{padding:10px 14px!important;font-size:16px!important}
}
@media (min-width:761px){ #screen-title .tt-head{display:contents} }
`;
document.head.appendChild(st);
function mountTitle(){ const sc=document.getElementById('screen-title'); if(!sc||sc.querySelector('.tt-crest')) return; const box=sc.querySelector('.title-box'); if(!box) return;
  const head=document.createElement('div'); head.className='tt-head'; const img=new Image(); img.className='tt-crest'; img.alt=''; img.src=A5+'titulo_brasao.png'; head.appendChild(img);
  const h1=box.querySelector('.game-title'), tg=box.querySelector('.tagline'); if(h1) head.appendChild(h1); if(tg) head.appendChild(tg); box.insertBefore(head,box.firstChild);
  const cur=window.LANG||'pt', lg=document.createElement('div'); lg.className='tt-lang';
  lg.innerHTML='<button data-l="pt" title="Português">PT</button><button data-l="en" title="English">EN</button>';
  lg.querySelectorAll('button').forEach(b=>{ if(b.dataset.l===cur) b.classList.add('on'); b.onclick=()=>{ if(b.dataset.l!==cur&&typeof window.setLang==='function') window.setLang(b.dataset.l); }; });
  sc.appendChild(lg); }
// a arte antiga em pixel (dragão no canvas) não roda mais: o fundo pintado a substitui
try{ if(typeof stopTitleArt==='function') stopTitleArt(); if(typeof startTitleArt==='function') window.startTitleArt=function(){}; }catch(e){}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mountTitle); else mountTitle();
// retratos pintados (camadas do Lote 2) na lista de personagens, no lugar do bonequinho em pixel
if(typeof renderSlots==='function'){ const _rs5=renderSlots; window.renderSlots=renderSlots=function(){ const r=_rs5.apply(this,arguments);
  try{ const L2=window.LOTE2, M=L2&&L2.camadas&&L2.camadas.ready&&L2.camadas.meta&&L2.camadas.meta.corpo; if(!M||!L2.compose||!L2.dressOf) return r;
    document.querySelectorAll('#front-saves canvas[data-i]').forEach(c=>{ const sv=readSlot(+c.dataset.i); if(!sv||!sv.look) return; let e=null; try{ e=L2.compose(L2.dressOf({look:sv.look,equip:sv.equip||{}})); }catch(x){ try{ e=L2.compose(L2.dressOf({look:sv.look})); }catch(y){} } if(!e||!e.cv) return;
      c.width=60; c.height=84; c.style.width='45px'; c.style.height='63px'; const g=c.getContext('2d'); g.clearRect(0,0,60,84); g.imageSmoothingEnabled=false; const k=Math.min(60/M.cw,84/M.ch)*1.15;
      g.save(); g.translate(30,80); g.scale(k,k); g.drawImage(e.cv,0,0,M.cw,M.ch,-M.ax,-M.ay,M.cw,M.ch); g.restore(); }); }catch(err){}
  return r; }; }
})();
window.LOTE5UI={mount,draw};
})();

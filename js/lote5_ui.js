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
window.LOTE5UI={mount,draw};
})();

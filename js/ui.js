'use strict';
// =====================================================================
// OUTREMER — janelas estilo UO (arrastáveis, várias abertas, o jogo não para),
// retrato da HUD sem piscar e escolha da cidade onde nascer. Carrega por último.
// =====================================================================
// o mundo só para no menu (Esc); mochila, livro, fabricar e conversa ficam abertos com o jogo rodando
paused = function(){ return menuOpen; };
closePanels = function(except){ if(except!=='menu'&&menuOpen) closeMenu(); if(mapOpen) toggleMap(false); };
(function(){
  const css=document.createElement('style'); css.textContent=`
  .gpanel:not(#menu-panel){background:none!important;pointer-events:none;align-items:flex-start!important;justify-content:flex-start!important;padding:0!important}
  .gpanel:not(#menu-panel) > .gbox{position:absolute;pointer-events:auto;max-height:86vh;box-shadow:0 0 0 2px #0a0807,0 6px 18px rgba(0,0,0,.6);border:2px solid #6a5434;background:linear-gradient(#1e1812,#14100c)}
  .gpanel .ghead{cursor:move;user-select:none;touch-action:none;background:linear-gradient(#3a2c1c,#241a10);margin:-14px -14px 8px!important;padding:6px 10px;border-bottom:1px solid #5a4630}
  .gpanel .ghead b{font-family:'Cinzel',serif}
  .gpanel.front-win{z-index:85}
  #skills-panel .sk-head{cursor:move}
  #hud-portrait{width:52px;height:60px;background:radial-gradient(#4a3a26,#1a120a);border:2px solid #8a6a3a;border-radius:3px;image-rendering:pixelated;flex:none}
  @media (max-width:760px){ #hud-portrait{width:36px;height:42px} }`;
  document.head.appendChild(css);
  // retrato próprio (o antigo desenhava o corpo do After Light por cima a cada quadro)
  const mb=document.getElementById('mini-body'); if(mb){ mb.style.display='none'; const pc=document.createElement('canvas'); pc.id='hud-portrait'; pc.width=26; pc.height=30; mb.parentElement.insertBefore(pc, mb.parentElement.firstChild); }
})();
let winZ=90;
function makeDraggable(win, handle, key){
  const pos=(()=>{ try{ return JSON.parse(localStorage.getItem('outremer_win_'+key)||'null'); }catch(e){ return null; } })();
  const place=()=>{ if(win.dataset.placed) return; win.dataset.placed=1; const r=win.getBoundingClientRect();
    const x = pos ? pos[0] : Math.max(4,(innerWidth-r.width)/2), y = pos ? pos[1] : Math.max(4,(innerHeight-r.height)/2);
    win.style.left=Math.min(Math.max(0,x),innerWidth-60)+'px'; win.style.top=Math.min(Math.max(0,y),innerHeight-40)+'px'; };
  let shown=false; new MutationObserver(()=>{ const vis=win.parentElement.style.display!=='none' && getComputedStyle(win.parentElement).display!=='none'; if(vis && !shown){ shown=true; place(); if(+win.parentElement.style.zIndex!==winZ) win.parentElement.style.zIndex=++winZ; } else if(!vis) shown=false; }).observe(win.parentElement,{attributes:true,attributeFilter:['style']});
  win.addEventListener('pointerdown',()=>{ if(+win.parentElement.style.zIndex!==winZ){ shown=true; win.parentElement.style.zIndex=++winZ; } });
  handle.addEventListener('pointerdown',e=>{ if(e.target.tagName==='BUTTON') return; e.preventDefault(); const sx=e.clientX, sy=e.clientY, ox=win.offsetLeft, oy=win.offsetTop;
    const mv=ev=>{ win.style.left=Math.min(Math.max(-win.offsetWidth+80,ox+ev.clientX-sx),innerWidth-60)+'px'; win.style.top=Math.min(Math.max(0,oy+ev.clientY-sy),innerHeight-30)+'px'; };
    const up=()=>{ removeEventListener('pointermove',mv); removeEventListener('pointerup',up); try{ localStorage.setItem('outremer_win_'+key,JSON.stringify([win.offsetLeft,win.offsetTop])); }catch(e){} };
    addEventListener('pointermove',mv); addEventListener('pointerup',up); });
}
for(const p of document.querySelectorAll('.gpanel')){ if(p.id==='menu-panel') continue; const box=p.querySelector('.gbox'), h=p.querySelector('.ghead'); if(box&&h) makeDraggable(box,h,p.id); }
// janela de skills (K) também arrasta
(function(){ const sk=document.getElementById('skills-panel'); if(!sk) return; sk.style.position='fixed'; sk.style.pointerEvents='auto'; sk.style.zIndex=88;
  const h=sk.firstElementChild||sk; h.classList.add('sk-head'); const fake=document.createElement('div'); fake.appendChild(sk.cloneNode(false));
  let pos=null; try{ pos=JSON.parse(localStorage.getItem('outremer_win_skills')||'null'); }catch(e){}
  if(pos){ sk.style.left=pos[0]+'px'; sk.style.top=pos[1]+'px'; sk.style.right='auto'; }
  h.addEventListener('pointerdown',e=>{ if(e.target.tagName==='BUTTON') return; e.preventDefault(); const sx=e.clientX, sy=e.clientY, ox=sk.offsetLeft, oy=sk.offsetTop; sk.style.right='auto';
    const mv=ev=>{ sk.style.left=(ox+ev.clientX-sx)+'px'; sk.style.top=(oy+ev.clientY-sy)+'px'; };
    const up=()=>{ removeEventListener('pointermove',mv); removeEventListener('pointerup',up); try{ localStorage.setItem('outremer_win_skills',JSON.stringify([sk.offsetLeft,sk.offsetTop])); }catch(e){} };
    addEventListener('pointermove',mv); addEventListener('pointerup',up); }); })();
// Esc fecha a janela de cima (como no UO) antes de abrir o menu
addEventListener('keydown',e=>{ if(e.key!=='Escape'||!running||document.activeElement.tagName==='INPUT') return;
  const open=[...document.querySelectorAll('.gpanel')].filter(p=>p.id!=='menu-panel'&&getComputedStyle(p).display!=='none').sort((a,b)=>(+b.style.zIndex||0)-(+a.style.zIndex||0));
  if(open.length){ e.stopImmediatePropagation(); const p=open[0]; if(p.id==='inv-panel') closeInventory(); else if(p.id==='craft-panel') closeCraft(); else if(p.id==='act-panel') closeActions(); else if(p.id==='trade-panel') closeTrade(); else p.style.display='none'; } }, true);
// retrato: rosto do personagem, desenhado uma vez por mudança (sem piscar)
let portraitKey='';
const _updU = update;
update = function(dt){ _updU(dt); if(!running||!player) return;
  const key=JSON.stringify([player.equip.head,player.look.hair,player.look.skin,player.look.style,player.look.beard,player.ghost,player.equip.body]); if(key===portraitKey) return; portraitKey=key;
  const c=document.getElementById('hud-portrait'); if(!c) return; const g=c.getContext('2d'); g.imageSmoothingEnabled=false; g.clearRect(0,0,26,30);
  g.save(); g.translate(13,54); g.scale(2,2); drawHuman(g,0,0,{face:'down',phase:0,moving:false,look:player.look,weapon:'fists',wAng:0,head:player.equip.head,body:player.equip.body}); g.restore(); };
// ---------------- onde nascer ----------------
const SPAWNS = [
  ['Aurélia','A capital murada do Lorde Aurélio. Tudo à mão; os arredores são tranquilos.'],
  ['Porto do Trigo','Porto fluvial das planícies, com banco e mercado. Bom começo para quem comercia.'],
  ['Vila Cruzada','Vila de veteranos na estrada real. Goblins e lobos por perto.'],
  ['Folhaverde','Cidade da floresta: madeira, ervas e arcos. Bosque fechado e bichos à espreita.'],
  ['Acre Livre','Bazar do litoral sul. Muita gente, muita troca.'],
  ['Vila da Rena','Aldeia de peles no norte gelado. Para quem quer começar no frio e no perigo.'],
];
let cSpawn='Aurélia';
(function(){ const box=document.querySelector('#screen-create .cc-grid > div:last-child'); if(!box) return;
  const lab=document.createElement('label'); lab.textContent='Onde você chega'; const sel=document.createElement('div'); sel.className='cc-tpl'; sel.id='cc-spawn';
  const note=document.createElement('div'); note.className='cc-note'; note.id='cc-spawn-note';
  const render=()=>{ sel.innerHTML=''; for(const [n,d] of SPAWNS){ const b=document.createElement('button'); b.textContent=n; if(n===cSpawn){ b.style.borderColor='#e8c070'; b.style.color='#fff'; } b.onclick=()=>{ cSpawn=n; render(); }; sel.appendChild(b); }
    note.textContent=(SPAWNS.find(s=>s[0]===cSpawn)||[])[1]||''; };
  box.insertBefore(note, box.firstChild); box.insertBefore(sel, box.firstChild); box.insertBefore(lab, box.firstChild); render(); })();
const _findSpawn = findSpawn;
findSpawn = function(){ if(SW && regions.some(r=>r.name===cSpawn)) SW.spawn=cSpawn;
  const r=regions.find(r=>r.name===SW.spawn)||regions[0]; const cx=Math.floor(r.x+r.w/2), cy=Math.floor(r.y+r.h/2); let best=null, bd=1e9;
  for(let y=r.y;y<r.y+r.h;y++) for(let x=r.x;x<r.x+r.w;x++){ const i=idx(x,y); if((map[i]!==TL.WALK&&map[i]!==TL.ASPH)||objGrid[i]) continue; const d=Math.hypot(x-cx,y-cy); if(d<bd){ bd=d; best=[x,y]; } }
  return best || _findSpawn(); };

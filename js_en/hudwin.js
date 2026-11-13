// =====================================================================
// JANELAS DO HUD MÓVEIS E MINIMIZÁVEIS + MOCHILA SEMPRE À VISTA (estilo UO)
// Status, relógio/menu e diário ganham uma alça (arrastar) e um botão "–" (minimizar).
// A mochila fica aberta num canto: os itens ficam "jogados" dentro dela, em qualquer posição,
// e podem ser arrastados; tocar num item abre as ações (usar, vestir, largar).
// =====================================================================
(function(){
const LS=(k,v)=>{ try{ if(v===undefined) return JSON.parse(localStorage.getItem('outremer_hw_'+k)||'null'); localStorage.setItem('outremer_hw_'+k,JSON.stringify(v)); }catch(e){ return null; } };
const css=document.createElement('style'); css.textContent=`
  .hw-bar{display:flex;align-items:center;gap:4px;height:16px;margin:-4px -4px 3px -4px;padding:0 2px;cursor:grab;touch-action:none;user-select:none}
  .hw-bar .hw-grip{flex:1;height:8px;border-top:2px dotted rgba(200,160,90,.55);border-bottom:2px dotted rgba(200,160,90,.55);opacity:.8}
  .hw-bar button{all:unset;width:18px;height:16px;line-height:14px;text-align:center;font:700 14px sans-serif;color:#e8c070;background:rgba(0,0,0,.35);border:1px solid #6a5434;border-radius:3px;cursor:pointer}
  .hw-min>*:not(.hw-bar){display:none!important} .hw-min{width:auto!important;min-width:0!important;padding:3px 6px!important;height:auto!important}
  .hw-min .hw-bar{margin:0;height:auto}.hw-min .hw-bar .hw-grip{display:none}
  .hw-min .hw-bar::before{content:attr(data-name);font:600 11px 'Pixelify Sans',sans-serif;color:#e8c070;margin-right:4px}
  #bag-gump{position:absolute;z-index:6;pointer-events:auto;touch-action:none;filter:drop-shadow(2px 4px 4px rgba(0,0,0,.6))}
  #bag-gump canvas{display:block;width:216px;height:176px;image-rendering:pixelated}
  #bag-gump .hw-bar{position:absolute;left:0;right:0;top:0;margin:0;height:22px;z-index:2}
  #bag-gump .hw-bar .hw-grip{border:none}
  #bag-gump.hw-min canvas{display:block!important;width:52px;height:42px}
  #bag-gump.hw-min .hw-bar{inset:0;height:auto;opacity:0}
  #bag-tip{position:absolute;pointer-events:none;background:rgba(18,14,10,.92);border:1px solid #6a5434;color:#f0e6d0;font:11px 'Pixelify Sans',sans-serif;padding:2px 6px;border-radius:3px;white-space:nowrap;display:none;z-index:9}
  body:not(.playing) #bag-gump{display:none}
  body.uo #bag-gump, body.uo2 #bag-gump{display:none}
  @media (max-width:760px){ #bag-gump canvas{width:162px;height:132px} }
`; document.head.appendChild(css);

// ---------- arrastar / minimizar ----------
function makeWin(el,key,name,opts={}){
  if(!el||el.dataset.hw) return; el.dataset.hw=1;
  const bar=document.createElement('div'); bar.className='hw-bar'; bar.dataset.name=name; bar.innerHTML='<span class="hw-grip"></span><button title="Minimizar">–</button>';
  el.insertBefore(bar,el.firstChild);
  const btn=bar.querySelector('button');
  const st=LS(key)||{}; const narrow=Math.min(innerWidth,innerHeight)<500 && innerWidth<innerHeight;
  const setMin=m=>{ el.classList.toggle('hw-min',m); btn.textContent=m?'+':'–'; st.min=m; LS(key,st); if(opts.onMin) opts.onMin(m); };
  btn.addEventListener('pointerdown',e=>{ e.stopPropagation(); e.preventDefault(); setMin(!el.classList.contains('hw-min')); });
  const place=(x,y)=>{ const r=el.getBoundingClientRect(); x=Math.min(Math.max(0,x),innerWidth-Math.min(r.width,60)); y=Math.min(Math.max(0,y),innerHeight-24);
    el.style.left=x+'px'; el.style.top=y+'px'; el.style.right='auto'; el.style.bottom='auto'; };
  if(st.pos) requestAnimationFrame(()=>place(st.pos[0],st.pos[1]));
  else if(opts.defPos&&(narrow||opts.always)){ const t=setInterval(()=>{ if(!document.body.classList.contains('playing')) return; clearInterval(t); requestAnimationFrame(()=>{ const [x,y]=opts.defPos(); place(x,y); }); },300); }
  if(st.min!=null) setMin(st.min); else if(opts.minNarrow&&narrow) setMin(true);
  const drag=e=>{ if(e.target===btn) return; e.preventDefault(); e.stopPropagation(); const r=el.getBoundingClientRect(), sx=e.clientX, sy=e.clientY; let moved=false;
    const mv=ev=>{ if(Math.abs(ev.clientX-sx)+Math.abs(ev.clientY-sy)>4) moved=true; place(r.left+ev.clientX-sx, r.top+ev.clientY-sy); };
    const up=()=>{ removeEventListener('pointermove',mv); removeEventListener('pointerup',up);
      if(moved){ const q=el.getBoundingClientRect(); st.pos=[q.left,q.top]; LS(key,st); } else if(el.classList.contains('hw-min')) setMin(false); };
    addEventListener('pointermove',mv); addEventListener('pointerup',up); };
  bar.addEventListener('pointerdown',drag);
  return {setMin};
}
makeWin(document.getElementById('stats'),'stats','Life');
makeWin(document.getElementById('clock'),'clock','Menu',{minNarrow:true,defPos:()=>[innerWidth-90,4]});
const tryJournal=()=>{ const j=document.getElementById('journal'); if(j) makeWin(j,'journal','Chat',{minNarrow:true,defPos:()=>{ const r=document.getElementById('stats').getBoundingClientRect(); return [4,r.bottom+6]; }}); else setTimeout(tryJournal,500); }; tryJournal();

// ---------- mochila ----------
const BW=108, BH=88, IN={x:14,y:26,w:80,h:54}; // área de dentro (em pixels da arte)
const g0=document.createElement('div'); g0.id='bag-gump'; g0.innerHTML=`<canvas width="${BW}" height="${BH}"></canvas>`;
document.getElementById('hud').appendChild(g0);
const tip=document.createElement('div'); tip.id='bag-tip'; document.getElementById('hud').appendChild(tip);
const cv=g0.querySelector('canvas'), g=cv.getContext('2d'); g.imageSmoothingEnabled=false;
// posição padrão: canto de baixo à direita, acima dos botões de toque
g0.style.left=(innerWidth-230)+'px'; g0.style.top=(innerHeight-260)+'px';
makeWin(g0,'bag','Backpack',{always:true,defPos:()=>{ const small=innerWidth<760, w=small?166:222, port=innerWidth<innerHeight;
  if(port) return [innerWidth-w-4, innerHeight-450];
  if(small){ const c=document.getElementById('clock').getBoundingClientRect(); return [innerWidth-w-4, c.bottom+4]; }
  return [innerWidth-w-8, innerHeight-260]; }});
// arte da mochila (couro), pintada uma vez
const art=document.createElement('canvas'); art.width=BW; art.height=BH;
(function paint(){ const a=art.getContext('2d'), P=(x,y,w,h,c)=>{ a.fillStyle=c; a.fillRect(x,y,w,h); };
  const hs=(x,y,s)=>{ let h=(x*374761393+y*668265263+s*1442695)|0; h=Math.imul(h^(h>>>13),1274126177); return ((h^(h>>>16))>>>0)/4294967295; };
  // corpo do saco: forma arredondada
  for(let y=14;y<BH-2;y++) for(let x=4;x<BW-4;x++){ const cx=(x-BW/2)/(BW/2-4), cy=(y-50)/38; if(cx*cx*.9+Math.max(0,cy)**2*1.1>1.02 && y>40) continue;
    const sh=.72+.28*(1-Math.abs(cx))-(y>BH-12?.15:0), n=hs(x>>1,y>>1,3)*.14+hs(x,y,7)*.08; P(x,y,1,1,`rgb(${(118*sh+n*60)|0},${(78*sh+n*40)|0},${(44*sh+n*24)|0})`); }
  // boca aberta (escura) com borda dobrada
  for(let y=IN.y-4;y<IN.y+IN.h+2;y++) for(let x=IN.x-3;x<IN.x+IN.w+3;x++){ const cx=(x-BW/2)/(IN.w/2+3), cy=(y-(IN.y+IN.h/2))/(IN.h/2+3); if(cx*cx+cy*cy*.8>1) continue;
    const d=Math.sqrt(cx*cx+cy*cy*.8), n=hs(x,y,11)*.12; const k=.18+.22*(1-d)+n+(cy<-.4?-.06:0); P(x,y,1,1,`rgb(${(96*k)|0},${(62*k)|0},${(36*k)|0})`); }
  // aba de cima (tampa aberta para trás)
  for(let y=2;y<20;y++) for(let x=18;x<BW-18;x++){ const cx=(x-BW/2)/(BW/2-18), t=(y-2)/18; if(Math.abs(cx)>1-(1-t)*.25) continue;
    const k=.62+.3*t+hs(x>>1,y,5)*.1; P(x,y,1,1,`rgb(${(110*k)|0},${(72*k)|0},${(40*k)|0})`); }
  P(20,19,BW-40,2,'#3a2412');
  // costura
  a.fillStyle='#d8b878'; for(let x=10;x<BW-10;x+=4){ const y=Math.round(50+Math.sqrt(Math.max(0,1-((x-BW/2)/(BW/2-6))**2))*30); P(x,y,2,1,'#c8a868'); }
  for(let x=22;x<BW-22;x+=4) P(x,5,2,1,'#c8a868');
  // alças e fivela
  P(BW/2-3,0,6,22,'#5a3a1e'); P(BW/2-3,0,1,22,'#7a5230'); P(BW/2-6,14,12,8,'#c8a040'); P(BW/2-4,16,8,4,'#3a2412'); P(BW/2-1,15,2,6,'#e8d080');
  P(2,40,6,24,'#5a3a1e'); P(BW-8,40,6,24,'#5a3a1e'); P(2,40,1,24,'#7a5230'); P(BW-3,40,1,24,'#3a2412');
  // sombra interna perto da boca
  a.fillStyle='rgba(0,0,0,.35)'; a.beginPath(); a.ellipse(BW/2,IN.y+3,IN.w/2,5,0,0,Math.PI*2); a.fill();
})();
// posições dos itens dentro da mochila (por espaço do inventário)
let pos=LS('bagpos')||{};
const slotPos=i=>{ if(!pos[i]){ const r=(k)=>{ let h=(i*2654435761+k*40503)>>>0; h^=h>>>15; return (h%1000)/1000; }; pos[i]=[IN.x+4+r(1)*(IN.w-24), IN.y+4+r(2)*(IN.h-24)]; } return pos[i]; };
const ICS=16;
function icon(id){ return ICON_IMG[id]||(ICON_IMG[id]=Object.assign(new Image(),{src:ICONS[id]})); }
function bagItems(){ const L=[]; for(let i=HOTBAR;i<SLOTS;i++){ const s=inv[i]; if(s) L.push([i,s]); } return L; }
let dragI=-1;
function drawBag(){
  g.clearRect(0,0,BW,BH); g.drawImage(art,0,0);
  if(g0.classList.contains('hw-min')) return;
  const L=bagItems(); L.sort((a,b)=>slotPos(a[0])[1]-slotPos(b[0])[1]);
  for(const [i,s] of L){ const [x,y]=slotPos(i), im=icon(s.id); if(!im.complete) continue;
    g.fillStyle='rgba(0,0,0,.35)'; g.fillRect(Math.round(x)+3,Math.round(y)+ICS-2,ICS-4,2);
    g.drawImage(im,Math.round(x),Math.round(y),ICS,ICS);
    if(s.qty>1){ g.font='6px monospace'; g.fillStyle='#000'; g.fillText(s.qty,Math.round(x)+ICS-5,Math.round(y)+ICS+1); g.fillStyle='#f0e0b0'; g.fillText(s.qty,Math.round(x)+ICS-6,Math.round(y)+ICS); }
    if(i===dragI){ g.strokeStyle='#e8c070'; g.strokeRect(Math.round(x)-.5,Math.round(y)-.5,ICS+1,ICS+1); } }
  if(!L.length){ g.fillStyle='rgba(240,220,170,.45)'; g.font='7px monospace'; g.fillText('empty',BW/2-10,IN.y+IN.h/2+3); }
}
const toArt=e=>{ const r=cv.getBoundingClientRect(); return [(e.clientX-r.left)*BW/r.width,(e.clientY-r.top)*BH/r.height]; };
function itemAt(x,y){ const L=bagItems(); for(let k=L.length-1;k>=0;k--){ const [i]=L[k], [px,py]=slotPos(i); if(x>=px-1&&x<=px+ICS+1&&y>=py-1&&y<=py+ICS+1) return i; } return -1; }
function actionsFor(i){ const s=inv[i]; if(!s) return; const it=ITEMS[s.id], A=[];
  A.push([it.wear?'Wear':it.weapon?(player.weapon===s.id?'Sheathe weapon':'Wield'):'Use', ()=>{ useSlot(i); drawBag(); }]);
  // pôr na barra de atalhos (1–0)
  const free=[...Array(HOTBAR).keys()].find(k=>!inv[k]);
  if(free!=null) A.push(['Put on bar ('+((free+1)%10)+')', ()=>{ inv[free]=inv[i]; inv[i]=null; renderHotbar(); drawBag(); }]);
  if(typeof dropSlot==='function') A.push(['Drop on the ground', ()=>{ dropSlot(i); drawBag(); }]);
  A.push(['Close', ()=>{}]);
  openActions(it.name+(s.qty>1?' ×'+s.qty:''), A); }
cv.addEventListener('pointerdown',e=>{ if(g0.classList.contains('hw-min')) return; const [x,y]=toArt(e); const i=itemAt(x,y); if(i<0) return;
  e.preventDefault(); e.stopPropagation(); dragI=i; const p0=slotPos(i).slice(), sx=x, sy=y; let moved=false;
  const mv=ev=>{ const [nx,ny]=toArt(ev); if(Math.abs(nx-sx)+Math.abs(ny-sy)>2) moved=true;
    pos[i]=[Math.min(Math.max(IN.x-2,p0[0]+nx-sx),IN.x+IN.w-ICS+2), Math.min(Math.max(IN.y-4,p0[1]+ny-sy),IN.y+IN.h-ICS+2)]; drawBag(); };
  const up=()=>{ removeEventListener('pointermove',mv); removeEventListener('pointerup',up); dragI=-1; tip.style.display='none';
    if(moved) LS('bagpos',pos); else actionsFor(i); drawBag(); };
  addEventListener('pointermove',mv); addEventListener('pointerup',up); });
cv.addEventListener('pointermove',e=>{ if(dragI>=0||e.pointerType==='touch') return; const [x,y]=toArt(e), i=itemAt(x,y);
  if(i<0||!inv[i]){ tip.style.display='none'; return; } tip.textContent=ITEMS[inv[i].id].name+(inv[i].qty>1?' ×'+inv[i].qty:''); tip.style.display='block';
  const hr=document.getElementById('hud').getBoundingClientRect(); tip.style.left=(e.clientX-hr.left+12)+'px'; tip.style.top=(e.clientY-hr.top-18)+'px'; });
cv.addEventListener('pointerleave',()=>tip.style.display='none');
// redesenha quando o inventário muda e de tempos em tempos
const _rh=renderHotbar; renderHotbar=function(){ const r=_rh.apply(this,arguments); drawBag(); return r; };
setInterval(()=>{ if(document.body.classList.contains('playing')) drawBag(); },700);
drawBag();
})();

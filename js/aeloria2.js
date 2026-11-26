'use strict';
// =====================================================================
// OUTREMER — Aelória II: o mapa novo, por cima do antigo (que continua jogável).
// Fase 1 do plano do Ludimus: costa recortada (fiordes, baías, golfos), ilhas, Lago Espelho
// e Lago do Navio Congelado. Estradas contornam os lagos e os golfos; travessias curtas de
// mar viram ponte de pedra (a Ponte do Fiorde).
// Personagens novos nascem no mapa novo; os antigos continuam no clássico e podem migrar
// pela tela de Personagens (o save do mapa clássico fica guardado como cópia).
// =====================================================================
window.WORLD_ID = 1;
let AEL2=null;
function ael2Mask(){ if(AEL2) return AEL2; const m=new Uint8Array(1280*1280); let p=0;
  for(const r of (window.AEL2_MASK||'').split('.')){ if(!r) continue; const c=+r[0], n=parseInt(r.slice(1),36); m.fill(c,p,p+n); p+=n; }
  return AEL2=m; }
const MK=(x,y)=>{ x|=0; y|=0; if(x<0||y<0||x>=1280||y>=1280) return 0; return ael2Mask()[y*1280+x]; };

// ---------- dados do mundo: o clássico e o novo (estradas desviadas) ----------
let SW1=null, SW2=null;
function getSW1(){ return SW1||(SW1=scaledWorld(window.WORLD)); }
function detourPaths(WD){
  const blocked=(x,y,lakeOnly)=>{ const m=MK(x,y); return m===2||m===3||(!lakeOnly&&m===1); };
  for(const p of WD.paths){ const S=[]; // amostras a cada ladrilho
    for(let s=0;s<p.pts.length-1;s++){ const [x1,y1]=p.pts[s],[x2,y2]=p.pts[s+1], L=Math.max(1,Math.hypot(x2-x1,y2-y1));
      for(let t=0;t<L;t+=1) S.push([x1+(x2-x1)*t/L, y1+(y2-y1)*t/L]); }
    S.push(p.pts[p.pts.length-1]);
    const out=[]; let i=0, changed=false;
    while(i<S.length){ const [x,y]=S[i];
      if(!blocked(x,y,false)){ out.push(S[i]); i++; continue; }
      let j=i; while(j<S.length&&blocked(S[j][0],S[j][1],false)) j++;
      const lake=S.slice(i,j).some(([a,b])=>MK(a,b)!==1);
      if(!lake && j-i<=45 || i===0 || j>=S.length){ for(;i<j;i++) out.push(S[i]); continue; } // ponte curta sobre o mar
      const route=bfs(out[out.length-1], S[j]); if(route){ for(let k=0;k<route.length;k+=3) out.push(route[k]); changed=true; } else for(let k=i;k<j;k++) out.push(S[k]);
      i=j; }
    if(changed){ const pts=[]; for(let k=0;k<out.length;k+=2) pts.push([Math.round(out[k][0]),Math.round(out[k][1])]); pts.push(S[S.length-1]); p.pts=pts; } }
  function bfs(a,b){ const ax=a[0]|0, ay=a[1]|0, bx=b[0]|0, by=b[1]|0, M=70, x0=Math.min(ax,bx)-M, y0=Math.min(ay,by)-M, w=Math.abs(ax-bx)+2*M+1, h=Math.abs(ay-by)+2*M+1;
    const prev=new Int32Array(w*h).fill(-1), q=[(ay-y0)*w+(ax-x0)]; prev[q[0]]=q[0];
    const wet=(x,y)=>{ const m=MK(x,y); return m>=1&&m<=3; };
    const ok=(x,y)=>{ if(wet(x,y)) return false; if(Math.abs(x-ax)+Math.abs(y-ay)<7||Math.abs(x-bx)+Math.abs(y-by)<7) return true;
      for(let dy=-3;dy<=3;dy++) for(let dx=-3;dx<=3;dx++) if(wet(x+dx,y+dy)) return false; return true; };
    for(let h0=0;h0<q.length;h0++){ const c=q[h0], cx=c%w, cy=(c/w)|0; if(cx+x0===bx&&cy+y0===by){ const r=[]; let k=c; while(k!==prev[k]){ r.push([k%w+x0,((k/w)|0)+y0]); k=prev[k]; } return r.reverse(); }
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx=cx+dx, ny=cy+dy; if(nx<0||ny<0||nx>=w||ny>=h) continue; const n=ny*w+nx; if(prev[n]>=0) continue;
        if(!(nx+x0===bx&&ny+y0===by) && !ok(nx+x0,ny+y0)) continue; prev[n]=c; q.push(n); } }
    return null; }
}
function getSW2(){ if(SW2) return SW2; const D=JSON.parse(JSON.stringify(getSW1())); detourPaths(D); D.H=1590; return SW2=D; } // abaixo de 1280: faixa subterrânea das masmorras

// ---------- terreno: aplica a máscara depois dos biomas (antes das praias e estradas) ----------
const _pb=paintBiomes;
paintBiomes=function(WD){ _pb(WD); if(window.WORLD_ID!==2) return; const M=ael2Mask();
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){ const i=idx(x,y), m=M[y*1280+x]; if(!m) continue;
    map[i]= m===1?TL.SEA : m===2?TL.WATER : m===3?TL.ICE : m===4?TL.GRASS : m===5?TL.SNOW : TL.SAND; fden[i]= m===4?Math.round(th(x,y,77)*40):0; } };

// ---------- construção: escolhe o mundo, limpa o que ficou n'água, renova os caches ----------
let builtWorld=0;
const _bw2=buildWorld;
buildWorld=function(){
  SW = window.WORLD_ID===2 ? getSW2() : getSW1();
  // no mapa novo, os dois andares da Garganta do Dragão descem para a faixa subterrânea (o Mar Rubro e a Ilha Rubra ficam no lugar antigo)
  if(typeof DG!=='undefined'){ if(!DG._L1){ DG._L1={...DG.L1}; DG._L2={...DG.L2}; } if(window.WORLD_ID===2){ DG.L1={x:90,y:1505,w:170,h:72}; DG.L2={x:320,y:1505,w:170,h:72}; } else { DG.L1={...DG._L1}; DG.L2={...DG._L2}; } }
  const r=_bw2.apply(this,arguments);
  if(window.WORLD_ID===2){ const wet=new Set([TL.SEA,TL.WATER]);
    // pontes: estrada sobre o mar novo vira pedra, com 3 ladrilhos de largura
    const br=[]; for(let y=1;y<H-1;y++) for(let x=1;x<W-1;x++){ const i=idx(x,y); if(MK(x,y)===1&&(map[i]===TL.DIRT||map[i]===TL.ASPH)) br.push(i); }
    for(const i of br){ map[i]=TL.ASPH; for(const j of [i-1,i+1,i-W,i+W]) if(map[j]===TL.SEA){ map[j]=TL.ASPH; reserved[j]=1; } }
    for(const i of br) for(const j of [i,i-1,i+1,i-W,i+W]) refreshWalk(j%W,(j/W)|0);
    for(const o of objs.slice()){ if(o.type==='moongate'||o.type==='stairs_down'||o.type==='stairs_up') continue; if(wet.has(map[idx(o.x,o.y)])) removeObj(o); } }
  if(builtWorld && builtWorld!==window.WORLD_ID){ try{ window.isoFlush&&isoFlush(); }catch(e){} try{ window.fpFlush&&fpFlush(); }catch(e){} }
  builtWorld=window.WORLD_ID; return r; };

// personagem novo → mapa novo
const _sg2=startGame; startGame=function(){ window.WORLD_ID=2; return _sg2.apply(this,arguments); };
// continuar → o mapa do save
const _cg2=continueGame; continueGame=function(){ const s=readSlot(curSlot); window.WORLD_ID=(s&&s.world>=100)?2:1; return _cg2.apply(this,arguments); };

// migração: chega na nova Aelória num lugar seco (ou em Aurélia, se o lugar virou mar)
const _as2=applySave;
applySave=function(s){ _as2(s); if(!s.migrate) return;
  const tx=player.x/T|0, ty=player.y/T|0, okT=(x,y)=>inB(x,y)&&walk[idx(x,y)]&&map[idx(x,y)]!==TL.SEA&&map[idx(x,y)]!==TL.WATER;
  if(!okT(tx,ty)){ let best=null; for(let r=1;r<=60&&!best;r++) for(let dy=-r;dy<=r&&!best;dy++) for(let dx=-r;dx<=r;dx++){ if(Math.max(Math.abs(dx),Math.abs(dy))!==r) continue; if(okT(tx+dx,ty+dy)){ best=[tx+dx,ty+dy]; break; } }
    const [sx,sy]=best||findSpawn(); player.x=sx*T+8; player.y=sy*T+12; }
  for(const a of (typeof animals!=='undefined'?animals:[])) if(a.tamed){ a.x=player.x+(Math.random()-.5)*30; a.y=player.y+(Math.random()-.5)*30; }
  setTimeout(()=>{ toast('Você chegou à nova Aelória: a costa mudou, surgiram ilhas, fiordes e lagos.'); saveGame(true); },1500); };
const _ser2=serialize; serialize=function(){ const s=_ser2(); delete s.migrate; return s; };

function migrateSlot(n){ const s=readSlot(n); if(!s||s.world>=100) return;
  try{ localStorage.setItem(SLOT_KEY(n)+'_classico', JSON.stringify(s)); }catch(e){}
  const keep=window.WORLD_ID; window.WORLD_ID=2; s.world=WORLD_VERSION(); window.WORLD_ID=keep; s.migrate=1;
  for(const k of ['doorsOpen','searched','removed','built','placed','npcs','camps','markers','veh']) delete s[k]; s.drivingIdx=-1;
  localStorage.setItem(SLOT_KEY(n), JSON.stringify(s)); }
const _rs2=renderSlots;
renderSlots=function(){ _rs2();
  document.querySelectorAll('#front-saves [data-play]').forEach(b=>{ const n=+b.dataset.play, s=readSlot(n); if(!s) return;
    const sm=b.parentElement.querySelector('small'); if(sm) sm.textContent+= s.world>=100 ? ' · mapa novo' : ' · mapa clássico';
    if(s.world>=100) return; const m=document.createElement('button'); m.className='seg'; m.textContent='Mapa novo'; m.title='Levar este personagem para a nova Aelória';
    m.onclick=()=>{ if(!m.dataset.armed){ m.dataset.armed=1; m.textContent='Migrar mesmo?'; m.style.background='#1a4a7a'; return; } migrateSlot(n); renderSlots(); toast(`${s.name} vai para o mapa novo (uma cópia no mapa clássico ficou guardada).`); };
    b.after(m); }); };

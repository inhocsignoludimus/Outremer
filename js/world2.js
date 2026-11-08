'use strict';
// =====================================================================
// OUTREMER — o mundo de Aelória (layout do 3D): biomas em pixel (neve, rocha, pântano,
// dunas, ruínas, costa), rios, estradas com pontes, vegetação de cada bioma, portais da lua,
// monstros por célula, padre em cada capela, lordes e guardas em cada povoado.
// Carrega antes de intro.js (as funções são chamadas por buildWorld).
// =====================================================================
Object.assign(TL, { SNOW:19, ROCK:20, SWAMP:21, DUNE:22, RUBBLE:23, ICE:24 });
const BIOME_NAME = { p:'Planícies', f:'Floresta', m:'Montanhas', n:'Terras do Norte', s:'Pântano', c:'Costa', o:'Outremer', r:'Ruínas' };
function vn(x,y,s,seed){ const fx=x/s, fy=y/s, ix=Math.floor(fx), iy=Math.floor(fy), tx=fx-ix, ty=fy-iy;
  const a=th(ix,iy,seed), b=th(ix+1,iy,seed), c=th(ix,iy+1,seed), d=th(ix+1,iy+1,seed), sx=tx*tx*(3-2*tx), sy=ty*ty*(3-2*ty);
  return a+(b-a)*sx+(c-a)*sy+(a-b-c+d)*sx*sy; }
let CELLS=null, CSZ=40;
function cellAt(tx,ty){ if(!CELLS) return null; const cx=Math.max(0,Math.min(31,Math.floor(tx/CSZ))), cy=Math.max(0,Math.min(31,Math.floor(ty/CSZ))); return CELLS[cy][cx]; }
function biomeAt(x,y){ const j=CSZ*1.15, bx=x+(vn(x,y,22,91)-.5)*j+(vn(x,y,7,93)-.5)*6, by=y+(vn(x,y,22,92)-.5)*j+(vn(x,y,7,94)-.5)*6; return cellAt(bx,by); }
function paintBiomes(WD){
  CELLS=WD.cells; CSZ=WD.cs||40;
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){ const i=idx(x,y), c=biomeAt(x,y); let t=TL.GRASS, fd=0;
    if(c.w){ map[i]=TL.SEA; continue; }
    const n1=vn(x,y,18,11), n2=vn(x,y,6,12);
    switch(c.b){
      case 'p': t=TL.GRASS; if(n1>.72){ t=TL.FOREST; fd=.05+(n1-.72)*.6; } break;
      case 'f': t=TL.FOREST; fd=.06+n1*.12; if(n1<.28){ t=TL.GRASS; fd=0; } break;
      case 'm': t= n1>.6 ? TL.ROCK : n2>.55 ? TL.DIRT : TL.GRASS; if(t===TL.GRASS && n2<.2){ t=TL.FOREST; fd=.06; } break;
      case 'n': t=TL.SNOW; if(n1>.64 && n2>.4) t=TL.ROCK; else if(n1<.22) t=TL.ICE; break;
      case 's': t= n1>.66 ? TL.WATER : TL.SWAMP; if(t===TL.SWAMP && n2>.7){ t=TL.FOREST; fd=.05; } break;
      case 'c': t=TL.GRASS; break;
      case 'o': t=TL.DUNE; if(n1>.74) t=TL.ROCK; else if(n2>.72) t=TL.DIRT; break;
      case 'r': t= n2>.55 ? TL.RUBBLE : n1>.7 ? TL.ROCK : TL.DIRT; break; }
    map[i]=t; if(fd) fden[i]=Math.round(fd*255); }
}
function paintWater(WD){
  const line=(pts,w,fn)=>{ for(let s=0;s<pts.length-1;s++){ const [x1,y1]=pts[s],[x2,y2]=pts[s+1], Lh=Math.hypot(x2-x1,y2-y1);
      for(let t=0;t<=Lh;t+=1){ const cx=x1+(x2-x1)*t/Lh, cy=y1+(y2-y1)*t/Lh, r=w/2+Math.sin((cx+cy)*.05)*1.2;
        for(let y=Math.floor(cy-r);y<=cy+r;y++) for(let x=Math.floor(cx-r);x<=cx+r;x++) if(inB(x,y) && Math.hypot(x-cx,y-cy)<=r) fn(idx(x,y),x,y); } } };
  // rios (o fiorde é mar; o uede é leito seco)
  for(const rv of WD.rivers) line(rv.pts, rv.w, i=>{ map[i] = rv.kind==='fjord' ? TL.SEA : rv.kind==='wadi' ? TL.DIRT : (map[i]===TL.SNOW||map[i]===TL.ICE) ? TL.ICE : TL.WATER; fden[i]=0; });
  // praias: terra a até 3 tiles do mar vira areia
  const dist=new Uint8Array(N); let q=[];
  for(let y=1;y<H-1;y++) for(let x=1;x<W-1;x++){ const i=idx(x,y); if(map[i]!==TL.SEA) continue; for(const j of [i-1,i+1,i-W,i+W]) if(map[j]!==TL.SEA && !dist[j]){ dist[j]=1; q.push(j); } }
  for(let d=1; d<=4 && q.length; d++){ const nq=[]; for(const i of q){ const x=i%W, y=(i/W)|0; if(d>2+(th(x,y,21)>.5?1:0)) continue; if(map[i]!==TL.SNOW&&map[i]!==TL.ICE) map[i]=TL.SAND; fden[i]=0;
      for(const j of [i-1,i+1,i-W,i+W]) if(j>=0&&j<N&&map[j]!==TL.SEA&&!dist[j]){ dist[j]=d+1; nq.push(j); } } q=nq; }
  // estradas de terra (pontes de pedra sobre a água; cortam a rocha)
  for(const p of WD.paths) line(p.pts, p.w, i=>{ map[i] = (map[i]===TL.WATER||map[i]===TL.SEA||map[i]===TL.ICE) ? TL.ASPH : TL.DIRT; fden[i]=0; reserved[i]=1; });
  // vegetação de cada bioma (fora dos povoados)
  const inReg=(x,y)=>WD.regions.some(r=>x>=r.x-2&&x<r.x+r.w+2&&y>=r.y-2&&y<r.y+r.h+2);
  for(let y=2;y<H-2;y+=1) for(let x=2;x<W-2;x+=1){ const i=idx(x,y), t=map[i]; if(reserved[i]) continue; const r=th(x,y,301);
    let k=null;
    if(t===TL.SNOW && r<.03+vn(x,y,18,11)*.06) k='pine';
    else if(t===TL.DUNE && r<.004) k=th(x,y,302)<.5?'palm':'cactus';
    else if(t===TL.SWAMP && r<.035) k='deadtree';
    else if((t===TL.GRASS||t===TL.DIRT) && cellAt(x,y).b==='m' && r<.012) k='rock';
    else if(t===TL.RUBBLE && r<.02) k='rock';
    else if(t===TL.SAND && cellAt(x,y).b==='o' && r<.01) k='palm';
    if(k && !inReg(x,y)) WD.props.push({t:k,x,y}); }
  // portais da lua
  for(const p of WD.portals) WD.props.push({ t:'moongate', x:p.x, y:p.y, portal:p.id });
}
// ---------------- desenho dos novos chãos ----------------
const _drawTile = drawTile;
drawTile = function(g,x,y,px,py){
  const t=map[idx(x,y)]; if(t<19) return _drawTile(g,x,y,px,py);
  const sp=(base,cols,n)=>{ g.fillStyle=base; g.fillRect(px,py,T,T); speck(g,px,py,cols,n,x,y); };
  switch(t){
    case TL.SNOW: sp('#c8ced6',['#d8dee6','#b8c0ca','#e8eef4','#a8b0bc'],18,x,y); if(th(x,y,41)>.95){ g.fillStyle='#8a9aa8'; g.fillRect(px+Math.floor(th(x,y,42)*12),py+Math.floor(th(x,y,43)*12),3,1); } break;
    case TL.ICE: sp('#9ab8cc',['#aac8dc','#8aa8bc','#c8e0f0'],10,x,y); if(th(x,y,44)>.8){ g.fillStyle='#d8eef8'; g.fillRect(px+Math.floor(th(x,y,45)*10),py+Math.floor(th(x,y,46)*14),5,1); } break;
    case TL.ROCK: { sp('#4a4642',['#56524c','#3e3a36','#625c56','#36322e'],22,x,y); const up=tileAt(x,y+1)!==TL.ROCK;
      if(up){ g.fillStyle='#2a2622'; g.fillRect(px,py+12,T,4); g.fillStyle='#6a645c'; g.fillRect(px,py+11,T,1); }
      if(tileAt(x,y-1)!==TL.ROCK){ g.fillStyle='#7a746c'; g.fillRect(px,py,T,2); } break; }
    case TL.SWAMP: sp('#33392a',['#3e4430','#2a2e22','#46482e','#2e3a2e'],22,x,y); if(th(x,y,47)>.8){ g.fillStyle='#3a4a42'; g.fillRect(px+Math.floor(th(x,y,48)*8),py+Math.floor(th(x,y,49)*10),6,3); } if(th(x,y,50)>.92){ g.fillStyle='#5a6a3a'; g.fillRect(px+Math.floor(th(x,y,51)*13),py+4,1,4); } break;
    case TL.DUNE: sp('#b89a64',['#c8aa72','#a88a56','#d0b47e','#9a7e4c'],20,x,y); if(th(x,y,52)>.7){ g.fillStyle='#a08452'; g.fillRect(px+Math.floor(th(x,y,53)*6),py+Math.floor(th(x,y,54)*14),8,1); } break;
    case TL.RUBBLE: sp('#5a554e',['#66605a','#4a4640','#726c64','#3e3a36'],16,x,y);
      for(let k=0;k<3;k++) if(th(x,y,60+k)>.5){ g.fillStyle='#7a746a'; g.fillRect(px+Math.floor(th(x,y,63+k)*12),py+Math.floor(th(x,y,66+k)*12),3,2); g.fillStyle='#3a3632'; g.fillRect(px+Math.floor(th(x,y,63+k)*12),py+Math.floor(th(x,y,66+k)*12)+2,3,1); } break;
  }
};
const _solid = solidTile;
solidTile = function(tx,ty){ if(inB(tx,ty) && map[idx(tx,ty)]===TL.ROCK) return true; return _solid(tx,ty); };
// árvores e pedras dos biomas, e o portal da lua
const _dObjW = drawObj;
drawObj = function(g,o,sx,sy,now){
  const P=(a,b,w,h,c)=>{ g.fillStyle=c; g.fillRect(sx+a,sy+b,w,h); };
  switch(o.type){
    case 'pine': P(7,8,2,8,'#3a2a1a'); for(let k=0;k<4;k++){ const w=12-k*3, y=6-k*5; P(8-w/2,y,w,5,k%2?'#1e3a2a':'#24442e'); P(8-w/2,y,w,1,'#e8eef4'); } P(7,-14,2,2,'#e8eef4'); return;
    case 'palm': P(7,-2,2,18,'#7a5a34'); for(let k=0;k<5;k++) P(7,0+k*3,2,1,'#5a3e22'); for(const [a,b] of [[-6,-4],[6,-4],[-4,-7],[4,-7],[0,-8]]){ P(8+Math.min(0,a),-4+Math.min(0,b)/2,Math.abs(a)||2,2,'#3a6a2a'); } P(6,-3,4,3,'#6a3a1a'); return;
    case 'cactus': P(6,2,4,14,'#4a6a3a'); P(2,6,3,2,'#4a6a3a'); P(2,3,2,4,'#4a6a3a'); P(11,8,3,2,'#4a6a3a'); P(12,5,2,4,'#4a6a3a'); P(7,2,1,14,'#5a7a4a'); return;
    case 'deadtree': P(7,2,2,14,'#3a3228'); P(3,4,4,1,'#3a3228'); P(2,2,1,3,'#3a3228'); P(9,6,5,1,'#3a3228'); P(13,3,1,4,'#3a3228'); P(6,-1,1,4,'#3a3228'); return;
    case 'rock': { const v=o.v||0; P(2,8-v,12,8+v,'#5e5a54'); P(3,7-v,10,2,'#7a746c'); P(2,15,12,1,'#2e2a26'); P(5,10,3,2,'#46423e'); return; }
    case 'moongate': { const t=now/400, a=.55+Math.sin(t)*.2; P(4,-20,24,36,'rgba(0,0,0,0)');
      g.globalAlpha=a; g.fillStyle='#3a6ad0'; g.beginPath(); g.ellipse(sx+16,sy-2,10,17,0,0,7); g.fill(); g.fillStyle='#8ab8ff'; g.beginPath(); g.ellipse(sx+16,sy-2,6,13,0,0,7); g.fill();
      g.globalAlpha=1; g.fillStyle='#e0f0ff'; for(let k=0;k<5;k++){ const q=t*2+k*1.3; g.fillRect(Math.round(sx+16+Math.cos(q)*7),Math.round(sy-2+Math.sin(q)*13),1,1); } return; }
  }
  return _dObjW(g,o,sx,sy,now);
};
OBJ_NAMES.moongate='Portal da Lua'; ACT_TYPES.add('moongate');
// portal: três destinos por pedra, conforme a fase da lua (muda a cada dia de jogo)
const PORTAL3 = {}; for(const p of D3.portals.portals) PORTAL3[p.id]=p;
const _useDev = useDevice;
useDevice = function(o){
  if(o.type!=='moongate') return _useDev(o);
  const P3=PORTAL3[o.portal], here=SW.portals.find(p=>p.id===o.portal); if(!P3){ toast('O portal está apagado.'); return; }
  const phase = ['Lua Nova','Crescente','Cheia','Minguante'][day%4], dests=(P3.phases||[]).map(id=>SW.portals.find(p=>p.city===id)).filter(Boolean);
  const nameOf = p => (regions.find(r=>r.sid===p.city)||{name:p.city==='aurelia'?'Aurélia':p.city}).name;
  openActions(`${P3.name} — ${phase}`, [[`A luz azul mostra ${dests.length} caminhos esta noite.`,null], ...dests.map(d=>[`Atravessar para ${nameOf(d)}`, ()=>{
    fxBurst(player.x,player.y-10,'#8ab8ff',24); player.x=(d.x+1)*T; player.y=(d.y+2)*T+8; fxBurst(player.x,player.y-10,'#8ab8ff',24); search=null; toast(`Você atravessa o portal até ${nameOf(d)}.`); }]), ['Ficar',null]]);
};
// nome do lugar no relógio quando não há povoado
function wildName(){ if(!player) return ''; const tx=Math.floor(player.x/T), ty=Math.floor(player.y/T), c=cellAt(tx,ty); if(!c) return 'Ermo';
  let best=null, bd=1e9; for(const r of regions){ const d=Math.hypot(r.x+r.w/2-tx,r.y+r.h/2-ty); if(d<bd){ bd=d; best=r; } }
  const lair=(SW.lairs||[]).find(l=>Math.hypot(l.x-tx,l.y-ty)<20);
  return lair ? lair.name : `${BIOME_NAME[c.b]||'Ermo'}${best&&bd<90?' · perto de '+best.name:''}${c.lv?' · nível '+c.lv:''}`; }
// monstros por célula (lista do 3D) e mais monstros onde é mais perigoso
monsterFor = function(){
  const tx=Math.floor(player.x/T), ty=Math.floor(player.y/T), c=cellAt(tx,ty); if(!c) return 'goblin';
  const lv=Math.max(2,c.lv||2), pool=[];
  for(const id of c.m||[]) if(MONS[id]) pool.push([id, MONS[id].weight||3]);
  if(!pool.length) for(const [k,M] of Object.entries(MONS)) if((M.weight||0) && M.lvl<=lv+2 && M.lvl>=lv-7) pool.push([k,M.weight]);
  if((c.b==='m'||c.b==='n') && lv>=10){ for(const d of ['dragon_whelp','dragon_young','dragon_red','dragon_elder','dragon_alpha']) if(MONS[d].lvl<=lv+6) pool.push([d,.25]); }
  if(!pool.length) return 'goblin'; let t=pool.reduce((a,b)=>a+b[1],0)*Math.random(); for(const [k,w] of pool){ t-=w; if(t<=0) return k; } return pool[0][0];
};
let monT2=0;
updateSpawns = function(dt){
  monT2-=dt; if(monT2>0) return; monT2=2;
  for(const r of [...raiders]) if(Math.hypot(r.x-player.x,r.y-player.y)>70*T) raiders.splice(raiders.indexOf(r),1);
  const i=idx(Math.floor(player.x/T),Math.floor(player.y/T)); if(regionId[i]!==255) return;
  const c=cellAt(Math.floor(player.x/T),Math.floor(player.y/T)); const max=[2,4,6,8,10][Math.min(4,c?c.d||0:1)];
  const near=raiders.filter(r=>Math.hypot(r.x-player.x,r.y-player.y)<45*T).length; if(near<max) spawnRaider(18,34);
};
// povoados: lordes com o nome do lugar, padre em cada capela, guardas e moradores em cada um
playerInCity = function(){ if(!player) return false; const r=regionAt(player.x,player.y); return !!r && (r.kind==='city'||r.kind==='town') && r.safe!==false && r.name!=='Fazendas do Sul'; };
const _ppW = placePeople;
placePeople = function(){
  _ppW();
  const rr=mulberry32(4242), reg=(x,y)=>{ const r=regionId[idx(Math.floor(x/T),Math.floor(y/T))]; return r===255?null:regions[r]; };
  for(const n of npcs) if(n.role==='lord'){ const r=reg(n.x,n.y); if(r && r.name!=='Aurélia'){ n.name=`Castelão de ${r.name}`; n.look.crown=false; } }
  // padres
  for(const c of buildings){ if(!c||c.t!=='church') continue; if(npcs.some(n=>n.role==='priest'&&n.home===c.id)) continue;
    const free=[]; for(let y=c.y+2;y<c.y+c.h-2;y++) for(let x=c.x+2;x<c.x+c.w-2;x++) if(!solidTile(x,y)&&!objGrid[idx(x,y)]&&!doors.has(idx(x,y))) free.push([x,y]);
    free.sort((a,b)=>a[1]-b[1]); const sp=free[0]; if(!sp) continue;
    npcs.push({ id:9000+c.id, role:'priest', name:rpick(['Padre Anselmo','Frei Bento','Padre Tomás','Frei Lourenço','Padre Inácio','Frei Domingos']), x:sp[0]*T+8, y:sp[1]*T+12, hx:sp[0]*T+8, hy:sp[1]*T+12,
      look:{sex:'m',skin:rpick(['#d8a87a','#c8956a','#e0b48e']),hair:'#8a8680',style:'short',beard:1,jacket:rpick(['#1a1a1a','#5a4a36']),jacketD:'#101010',pants:'#1a1a1a',boot:'#101010',race:'humano'},
      face:'down', phase:0, moving:false, hp:999, max:999, weapon:null, state:'idle', t:0, cd:0, wind:0, swingT:0, hurtT:0, alive:true, path:null, pathT:0, dead:false, post:true, home:c.id }); }
  // guardas e moradores em cada povoado (Aurélia já tem os seus)
  const guardLook=()=>{ const l=randomLookR('m',rr); l.jacket='#6a6e74'; l.jacketD='#4a4e54'; l.pants='#3a3e44'; return l; };
  let nid=60000;
  for(const r of regions){ if(r.name==='Aurélia'||r.name==='Fazendas do Sul') continue;
    const cells=[]; for(let y=r.y+3;y<r.y+r.h-3;y+=2) for(let x=r.x+3;x<r.x+r.w-3;x+=2){ const i=idx(x,y); if(map[i]===TL.ASPH&&!objGrid[i]) cells.push([x,y]); }
    if(!cells.length) continue; const big=r.kind==='city';
    for(let k=0;k<(big?5:2);k++){ const [x,y]=cells[Math.floor(rr()*cells.length)]; npcs.push({ id:nid++, role:'guard', name:rpick(FIRST), x:x*T+8, y:y*T+12, hx:x*T+8, hy:y*T+12, look:guardLook(), face:'down', phase:0, moving:false, hp:120, max:120, weapon:'spear', state:'idle', t:0, cd:0, wind:0, swingT:0, hurtT:0, alive:true, path:null, pathT:0, dead:false, patrol:true, title:'guarda' }); }
    for(let k=0;k<(big?10:4);k++){ const [x,y]=cells[Math.floor(rr()*cells.length)]; const l=randomLookR(rr()<.5?'m':'f',rr); npcs.push({ id:nid++, role:'citizen', name:rpick(FIRST), x:x*T+8, y:y*T+12, hx:x*T+8, hy:y*T+12, look:l, face:'down', phase:0, moving:false, hp:60, max:60, weapon:null, state:'idle', t:0, cd:0, wind:0, swingT:0, hurtT:0, alive:true, path:null, pathT:0, dead:false, title:'morador' }); } }
};
// o fantasma vai para a capela mais perto
chapel = function(){ if(!player) return buildings.find(b=>b&&b.t==="church"); let best=null, bd=1e9; for(const b of buildings){ if(!b||b.t!=='church') continue; const d=Math.hypot((b.x+b.w/2)*T-player.x,(b.y+b.h/2)*T-player.y); if(d<bd){ bd=d; best=b; } } return best; };
// moradores andam pelas ruas do próprio povoado (não atravessam o mapa)
const _updNW = updateNPCs;
updateNPCs = function(dt){ for(const n of npcs) if((n.role==='citizen'||n.patrol) && n.wp && Math.hypot(n.wp.x-n.hx,n.wp.y-n.hy)>40*T) n.wp={x:n.hx+(Math.random()-.5)*20*T,y:n.hy+(Math.random()-.5)*20*T}; _updNW(dt); };
// portais e covis marcados no mapa
const _rMap = renderMap;
renderMap = function(now){ _rMap(now); if(!SW||!player) return;
  const cw=mapCv.width, chh=mapCv.height, g=mctx, ptx=player.x/T, pty=player.y/T; let s, ox, oy;
  if(mapZoom===0){ s=Math.min((cw-40*dpr)/W,(chh-110*dpr)/H); ox=(cw-W*s)/2; oy=(chh-H*s)/2+20*dpr; } else { s=(mapZoom===1?3:6)*dpr; ox=cw/2-ptx*s; oy=chh/2-pty*s; }
  g.font=`${Math.round(10*dpr)}px 'Pixelify Sans', monospace`; g.textAlign='center';
  for(const p of SW.portals||[]){ const x=ox+(p.x+1)*s, y=oy+p.y*s; g.fillStyle='#8ab8ff'; g.beginPath(); g.ellipse(x,y,4*dpr,6*dpr,0,0,7); g.fill(); g.fillStyle='#e0f0ff'; g.fillRect(x-1,y-1,2,2); }
  for(const l of SW.lairs||[]){ const x=ox+l.x*s, y=oy+l.y*s; g.fillStyle='#c83a2a'; g.fillRect(x-4*dpr,y-4*dpr,8*dpr,8*dpr); g.fillStyle='#1a0a08'; g.fillRect(x-2*dpr,y-2*dpr,1.5*dpr,1.5*dpr); g.fillRect(x+.5*dpr,y-2*dpr,1.5*dpr,1.5*dpr);
    if(mapZoom>0){ g.fillStyle='#e8a090'; g.fillText(l.name,x,y+12*dpr); } }
};
// ---------------- estilo do Oriente (Aelia Sancta, Acre, deserto): arenito, terraços, cúpulas, bazar ----------------
const _mkRoof = makeRoof;
makeRoof = function(b){
  if(!b.levant && !b.dome) return _mkRoof(b);
  const w=b.w*T+4, h=(b.h-1)*T+22, c=document.createElement('canvas'); c.width=w; c.height=h; const g=c.getContext('2d'), r=b.roof||'#d8c8a0';
  g.fillStyle=r; g.fillRect(0,0,w,h);
  for(let i=0;i<w*h/30;i++){ g.fillStyle=th(b.id,i,8)>.5?shade(r,1.08):shade(r,.9); g.fillRect(Math.floor(th(b.id,i,7)*w),Math.floor(th(b.id,i,9)*h),1,1); }
  g.fillStyle=shade(r,1.2); g.fillRect(0,0,w,3); g.fillRect(0,0,3,h); g.fillStyle=shade(r,.7); g.fillRect(w-3,0,3,h); g.fillRect(0,h-4,w,4);   // parapeito
  for(let x=4;x<w-4;x+=10){ g.fillStyle=shade(r,.8); g.fillRect(x,h-9,2,2); }
  if(b.dome){ const cx=w/2, cy=h/2, R=Math.min(w,h)*.32; g.fillStyle=shade(r,.75); g.beginPath(); g.ellipse(cx,cy+3,R+2,R*.9+2,0,0,7); g.fill();
    g.fillStyle=b.dome; g.beginPath(); g.ellipse(cx,cy,R,R*.9,0,0,7); g.fill(); g.fillStyle=shade(b.dome,1.25); g.beginPath(); g.ellipse(cx-R*.35,cy-R*.35,R*.35,R*.3,0,0,7); g.fill();
    g.fillStyle=shade(b.dome,.7); g.fillRect(cx-1,cy-R-6,2,7); if(b.t==='church'){ g.fillStyle='#d8b040'; g.fillRect(cx-1,cy-R-10,2,6); g.fillRect(cx-3,cy-R-8,6,2); } else { g.fillStyle='#d8b040'; g.beginPath(); g.arc(cx,cy-R-7,2,0,7); g.fill(); } }
  else if(th(b.id,1,3)>.6){ g.fillStyle=shade(r,.8); g.fillRect(w*.2,h*.25,w*.25,h*.3); g.fillStyle='#4a6a2a'; g.fillRect(w*.22,h*.28,3,3); }  // pátio com vaso
  return c; };
const _dtL = drawTile;
drawTile = function(g,x,y,px,py){ const i=idx(x,y);
  if(map[i]===TL.ASPH && regionId[i]!==255 && regions[regionId[i]] && regions[regionId[i]].style==='levant' && !(tileAt(x,y-1)===TL.WATER||tileAt(x,y+1)===TL.WATER)){
    g.fillStyle='#b89a6c'; g.fillRect(px,py,T,T); const o=(y%2)*4;
    for(let r=0;r<2;r++) for(let k=-1;k<2;k++){ const sx=px+k*8+((y*2+r)%2)*4; g.fillStyle=shade('#c8aa7a',.9+th(x*3+k,y*2+r,5)*.2); g.fillRect(Math.max(px,sx+1),py+r*8+1,Math.min(7,px+T-sx-1),6); }
    return; }
  if((map[i]===TL.GRASS||map[i]===TL.PARK) && regionId[i]!==255 && regions[regionId[i]] && regions[regionId[i]].style==='levant'){ g.fillStyle='#b8996a'; g.fillRect(px,py,T,T); speck(g,px,py,['#c4a676','#a88a5c','#cdb184'],16,x,y); if(th(x,y,81)>.94){ g.fillStyle='#7a8a4a'; g.fillRect(px+Math.floor(th(x,y,82)*13),py+Math.floor(th(x,y,83)*13),2,1); } return; }
  return _dtL(g,x,y,px,py); };
const _dObjL = drawObj;
drawObj = function(g,o,sx,sy,now){ const P=(a,b,w,h,c)=>{ g.fillStyle=c; g.fillRect(sx+a,sy+b,w,h); };
  if(o.type==='awning'){ const cols=[['#a02a1a','#e8d8b0'],['#2a5a8a','#e8d8b0'],['#3a6a2a','#e8c860'],['#7a3a6a','#e8d8b0']][Math.floor(th(o.x,o.y,5)*4)];
    P(1,4,2,12,'#5a3a1e'); P(13,4,2,12,'#5a3a1e'); for(let k=0;k<8;k++) P(k*2,-2,2,7,k%2?cols[1]:cols[0]); P(0,5,16,1,shade(cols[0],.7));
    P(3,10,10,5,'#8a6a3a'); P(4,9,3,2,['#c8a040','#a03a2a','#4a8a3a'][o.x%3]); P(8,9,3,2,['#e8c060','#6a3a8a','#c86a2a'][o.y%3]); return; }
  if(o.type==='olive'){ P(7,6,2,10,'#5a4a3a'); P(5,10,2,2,'#5a4a3a'); P(2,-2,12,9,'#6a7a4a'); P(1,1,14,5,'#5e6e42'); P(4,-3,7,2,'#7a8a5a'); for(let k=0;k<4;k++) P(3+k*3,1+(k%2)*3,1,1,'#2a3a1a'); return; }
  return _dObjL(g,o,sx,sy,now); };

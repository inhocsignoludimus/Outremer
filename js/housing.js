'use strict';
// =====================================================================
// OUTREMER — casas do jogador com as zonas do 3D (cidade proibida, fronteira, aberto, perigoso,
// chefe), um terreno por personagem (Marco do Terreno), escrituras que erguem casas prontas,
// e as invasões (hordas do 3D por bioma e perigo) às bases construídas longe das cidades.
// =====================================================================
const HOUSING = D3.world_layout.housing, INV = D3.invasions;
const ZONE_NAME = { city:'cidade (proibido construir)', frontier:'fronteira (terreno pequeno, sem invasões)', open:'terra aberta (terreno médio, sofre invasões)', dangerous:'terra perigosa (terreno grande, invasões fortes)', boss:'arena de chefe (proibido)' };
const ZONE_SIZE = { frontier:HOUSING.frontier_footprint[0], open:HOUSING.open_footprint[0], dangerous:HOUSING.dangerous_footprint[0] };
const COMBAT_SK = ['espadas','macas','machados','esgrima','arcos','briga','magia','taticas'];
function zoneAt(tx,ty){ const c=cellAt(tx,ty); if(!c) return 'open'; if(c.w) return 'water'; const r=regionId[idx(tx,ty)]; if(r!==255) return 'city'; return c.z||'open'; }
function zoneOpen(z){ const best=Math.max(...COMBAT_SK.map(skill)); if(z==='frontier') return true; if(z==='open') return best>=35; if(z==='dangerous') return best>=50; return false; }
function inLot(x,y){ const L=player&&player.lot; return !!L && x>=L.x && x<L.x+L.s && y>=L.y && y<L.y+L.s; }
// o marco do terreno e as escrituras
BUILD.push({ cat:'Casa', id:'claim', name:'Marco do Terreno', cost:{stone:6,logs:4}, desc:'Reivindica seu terreno (um por personagem)' });
SCRAP_YIELD.claim={stone:3,logs:2};
(function(){ const c=document.createElement('canvas'); c.width=16; c.height=16; const g=c.getContext('2d'); g.fillStyle='#7a7670'; g.fillRect(5,6,6,9); g.fillStyle='#9a968e'; g.fillRect(5,6,6,1); g.fillStyle='#6a4628'; g.fillRect(7,0,1,7); g.fillStyle='#a01a14'; g.fillRect(8,1,5,3); ICONS.b_claim=c.toDataURL(); })();
const _dObjH = drawObj;
drawObj = function(g,o,sx,sy,now){ if(o.type==='claim'){ const P=(a,b,w,h,c)=>{g.fillStyle=c;g.fillRect(sx+a,sy+b,w,h);};
    P(4,6,8,10,'#6e6a64'); P(4,6,8,2,'#8e8a82'); P(5,10,6,1,'#4a4642'); P(7,-12,2,18,'#5a3a1e'); const w=Math.sin(now/300)*1.5; P(9,-11,6,5+w*.3,'#8a1a14'); P(11,-10,2,2,'#d8b040'); return; }
  return _dObjH(g,o,sx,sy,now); };
OBJ_NAMES.claim='Marco do Terreno'; ACT_TYPES.add('claim');
const _ugH = updateGhost;
updateGhost = function(){ _ugH(); if(!ghost || !ghost.ok || !player) return; const p=ghost.p, x=ghost.tx, y=ghost.ty;
  if(p.id==='scrap') return;
  const z=zoneAt(x,y), camp=['campfire','tent','bedroll'].includes(p.id);
  if(z==='city'){ ghost.ok=false; ghost.why='Proibido construir dentro de povoados'; return; }
  if(z==='boss'||z==='water'){ ghost.ok=false; ghost.why= z==='boss'?'Arena de chefe: proibido construir':'Aqui não'; return; }
  if(p.id==='claim'){ if(player.lot){ ghost.ok=false; ghost.why='Você já tem um terreno (desmonte o marco para mudar)'; return; }
    if(!zoneOpen(z)){ ghost.ok=false; ghost.why= z==='open'?'Terra aberta: precisa de 35 em alguma skill de combate':'Terra perigosa: precisa de 50 em alguma skill de combate'; return; }
    const s=ZONE_SIZE[z]||12; for(const r of regions){ if(x+s/2>r.x-HOUSING.min_gap_tiles.frontier && x-s/2<r.x+r.w+HOUSING.min_gap_tiles.frontier && y+s/2>r.y-HOUSING.min_gap_tiles.frontier && y-s/2<r.y+r.h+HOUSING.min_gap_tiles.frontier){ ghost.ok=false; ghost.why='Perto demais de um povoado'; return; } }
    return; }
  if(!camp && !inLot(x,y)){ ghost.ok=false; ghost.why= player.lot ? 'Fora do seu terreno' : 'Ponha primeiro um Marco do Terreno (Casa)'; } };
const _poH = placeObject;
placeObject = function(type,x,y,st){ const o=_poH(type,x,y,st);
  if(type==="claim" && player && !st.t){ const z=zoneAt(x,y), s=ZONE_SIZE[z]||12; player.lot={x:x-Math.floor(s/2), y:y-Math.floor(s/2), s, z, cx:x, cy:y, at:day};
    markers=markers.filter(m=>!m.home); markers.push({x:x*T+8,y:y*T+8,home:true,label:'Casa'}); invT=invNext();
    toast(`Terreno reivindicado: ${s}×${s} em ${ZONE_NAME[z]||z}.`); Journal.add('system','',`Seu terreno fica em ${wildName()}.`); }
  return o; };
const _remH = removeObj;
removeObj = function(o){ if(o.type==='claim' && player && player.lot && o.x===player.lot.cx && o.y===player.lot.cy){ player.lot=null; toast('Terreno liberado.'); } return _remH(o); };
const _udH = useDevice;
useDevice = function(o){ if(o.type!=='claim') return _udH(o); const L=player.lot;
  openActions('Marco do Terreno', [[L?`Seu terreno: ${L.s}×${L.s} — ${ZONE_NAME[L.z]||L.z}.`:'Marco sem dono.',null],
    [L&&(L.z==='open'||L.z==='dangerous')?'Terras abertas atraem hordas quando a base tem muralhas e portões. O baú da casa nunca é saqueado.':'Na fronteira não há invasões.',null],['Fechar',null]]); };
// escrituras: casas prontas erguidas no seu terreno
const DEEDS = {
  deed_forest_hut:   { w:5, h:5, wall:'wall', floor:'floor', items:['bedroll','campfire'] },
  deed_plains_cabin: { w:8, h:6, wall:'wall', floor:'floor', items:['bed','storage','table'] },
  deed_smithy:       { w:9, h:7, wall:'wall_stone', floor:'floor_stone', items:['hearth','anvil','storage'] },
  deed_market_stall: { w:5, h:3, wall:null, floor:'floor', items:['table','storage','banner'] },
};
for(const [id,d] of Object.entries(DEEDS)) if(ITEMS[id]) ITEMS[id].use = ()=>{
  const L=player.lot; if(!L){ return {msg:'Ponha um Marco do Terreno antes de usar a escritura.'}; }
  const ox=L.x+Math.floor((L.s-d.w)/2), oy=L.y+1;
  for(let y=oy;y<oy+d.h;y++) for(let x=ox;x<ox+d.w;x++){ const i=idx(x,y); if(!inB(x,y)||objGrid[i]||doors.has(i)||solidTile(x,y)||regionId[i]!==255) return {msg:'O terreno precisa estar livre para erguer a casa.'}; }
  for(let y=oy;y<oy+d.h;y++) for(let x=ox;x<ox+d.w;x++){ const edge=d.wall&&(x===ox||x===ox+d.w-1||y===oy||y===oy+d.h-1), door=edge&&y===oy+d.h-1&&x===ox+Math.floor(d.w/2);
    if(door) placeTile(d.wall==='wall_stone'?'door_iron':'door',x,y,{}); else if(edge) placeTile((x===ox+1||x===ox+d.w-2)&&y===oy?(d.wall==='wall_stone'?'window_iron':'window'):d.wall,x,y,{}); else placeTile(d.floor,x,y,{}); }
  d.items.forEach((t,k)=>{ const x=ox+1+k*2, y=oy+1; if(!objGrid[idx(x,y)]) placeObject(t,x,y,{}); });
  fxBurst((ox+d.w/2)*T,(oy+d.h/2)*T,'#e8c070',30,60); return {msg:`${ITEMS[id].name.replace('Escritura: ','')} erguida no seu terreno!`, consume:true}; };
VSTOCK.carpenter.push('deed_forest_hut','deed_plains_cabin','deed_market_stall'); VSTOCK.ferreiro.push('deed_smithy');
// ---------------- invasões ----------------
let invT=0, horde=null;
const invNext = () => 60*(2+Math.random()*2); // segundos reais entre hordas quando a base está pronta (~1 dia de jogo)
function basePieces(){ const L=player.lot; if(!L) return []; return built.filter(b=>inLot(b.x,b.y) && /wall|gate|door|fence/.test(b.t)); }
function hordeFor(){ const L=player.lot, c=cellAt(L.cx,L.cy), bio={p:'plains',f:'forest',m:'mountains',n:'north',s:'swamp',o:'outremer',r:'ruins',c:'coast'}[c.b]||'plains';
  const d=Math.max(2,Math.min(4, L.z==='dangerous'?4:(c.d||2))); return INV.hordes.find(h=>h.biome===bio&&h.danger===d) || INV.hordes.find(h=>h.biome===bio) || INV.hordes[0]; }
function startHorde(){
  const L=player.lot, H=hordeFor(), place=wildName();
  horde={ def:H, phase:'warn', t:Math.min(45,H.warning_s/4), mobs:[], broken:0, total:basePieces().length };
  const msg=(H.announce||'Uma horda se aproxima de {place}!').replace('{place}','sua casa'); toast('⚔ '+msg); Journal.add('system','',`${msg} (${Math.round(horde.t)}s)`);
  const s=Sim.online().find(x=>x.guild&&Sim.pguild()===x.guild); if(s) Sim.say(s,'raid_call',{boss:'a horda'},'guild');
}
function spawnHorde(){
  const L=player.lot, H=horde.def, n=rint(H.size[0],H.size[1]), pool=[]; for(const [id,w] of H.composition) if(MONS[id]) for(let k=0;k<w;k++) pool.push(id);
  const ang=Math.random()*Math.PI*2;
  for(let k=0;k<n;k++){ const a=ang+(Math.random()-.5)*.8, dist=L.s/2+14+Math.random()*6, x=Math.floor(L.cx+Math.cos(a)*dist), y=Math.floor(L.cy+Math.sin(a)*dist); const sp=openSpot(x*T,y*T,4); if(!sp) continue;
    const r={x:sp[0],y:sp[1],face:'down',phase:0,moving:false,state:'raid',tx:L.cx*T+8,ty:L.cy*T+8,wp:null,idle:0,path:null,pathT:0,seenT:0,lastX:0,lastY:0,wind:0,cd:0,hurtT:0,alertT:0,swingT:0,doorT:0,aimAng:0,mon:rpick(pool),camp:-1,invader:true};
    setupMon(r); raiders.push(r); horde.mobs.push(r); }
  horde.phase='fight'; toast(`A horda chegou: ${horde.mobs.length} inimigos!`); shake=Math.max(shake,4);
}
const PIECE_HP = t => /iron/.test(t) ? 260 : /stone/.test(t) ? 150 : 70;
function breakPiece(b){ const i=idx(b.x,b.y); if(b.door){ doors.delete(i); const Ld=chunkDoors[cidx(b.x,b.y)]; Ld.splice(Ld.indexOf(b.door),1); }
  const d=doors.get(i); if(d){ doors.delete(i); const Ld=chunkDoors[cidx(b.x,b.y)]; if(Ld.includes(d)) Ld.splice(Ld.indexOf(d),1); }
  map[i]=b.prev; mat[i]=b.prevMat; built.splice(built.indexOf(b),1); refreshWalk(b.x,b.y); dirtyChunks(b.x,b.y); fxBurst(b.x*T+8,b.y*T+6,'#8a6a3a',14,50); }
const _urH = updateRaider;
updateRaider = function(r,dt){ _urH(r,dt); if(!r.invader || !raiders.includes(r) || !horde) return;
  const dP=Math.hypot(player.x-r.x,player.y-r.y); if(r.state==='chase' && dP<5*T) return;
  if(r.state!=='raid' && r.state!=='chase'){ r.state='raid'; }
  r.hitT=(r.hitT||0)-dt; if(r.hitT>0) return;
  const tx=Math.floor(r.x/T), ty=Math.floor((r.y-3)/T); let tgt=null, bd=9;
  for(const b of built){ if(Math.abs(b.x-tx)>1||Math.abs(b.y-ty)>1||!/wall|gate|door|fence/.test(b.t)) continue; const pr=/gate/.test(b.t)?1:/door/.test(b.t)?2:/wall/.test(b.t)?3:4; if(pr<bd){ bd=pr; tgt=b; } }
  if(!tgt) return; r.hitT=1.1; r.swingT=.2; r.face=faceFromAng(Math.atan2(tgt.y*T-r.y,tgt.x*T-r.x));
  tgt.hp=(tgt.hp??PIECE_HP(tgt.t)) - (OW[r.weapon]?.dmg||10)*.6; fxs.push({x:tgt.x*T+8,y:tgt.y*T+4,vx:0,vy:-10,t:.3,col:'#c8a870'});
  const maxFrac=(INV.loss.wall_fraction_max[String(horde.def.danger)]||.3);
  if(tgt.hp<=0){ if(horde.broken < Math.ceil(horde.total*maxFrac)){ horde.broken++; breakPiece(tgt); toast(`Os invasores derrubaram ${tgt.t.includes('gate')?'o portão':tgt.t.includes('door')?'a porta':'uma parede'}!`); } else tgt.hp=10; }
};
const _updH2 = update;
update = function(dt){ _updH2(dt); if(!running||!player||!player.lot) return; const L=player.lot;
  if(!horde){ if(L.z!=='open'&&L.z!=='dangerous') return; if(basePieces().length<INV.rules.min_pieces) return; invT-=dt; if(invT<=0) startHorde(); return; }
  if(horde.phase==='warn'){ horde.t-=dt; if(horde.t<=0) spawnHorde(); return; }
  horde.mobs=horde.mobs.filter(m=>raiders.includes(m));
  if(!horde.mobs.length){ const R=horde.def.rewards||{}, g=rint((R.gold||[20,40])[0],(R.gold||[20,40])[1]); addItem('cash',g); const got=[`${g} de ouro`];
    for(const [id,[a,b]] of Object.entries(R.items||{})) if(ITEMS[id]){ const n=rint(a,b); addItem(id,n); got.push(`${n} ${ITEMS[id].name}`); }
    for(const [id,ch,[a,b]] of R.chance||[]) if(ITEMS[id]&&Math.random()<ch){ const n=rint(a,b); addItem(id,n); got.push(`${n} ${ITEMS[id].name}`); }
    toast(`A horda foi derrotada! Espólio: ${got.join(', ')}.`); Journal.add('system','',`Defesa da casa: ${horde.broken} peça(s) perdida(s).`); horde=null; invT=invNext(); } };
// salvar o terreno
const _serH = serialize; serialize = function(){ const s=_serH(); s.lot=player.lot||null; return s; };
const _appH = applySave; applySave = function(s){ _appH(s); player.lot=s.lot||null; invT=invNext(); horde=null; };
// contorno do terreno no modo construir
const _dfxH = drawFX;
drawFX = function(g,cx,cy){ _dfxH(g,cx,cy); if(!player||!player.lot||!buildMode) return; const L=player.lot; g.strokeStyle='rgba(120,220,120,.8)'; g.setLineDash([4,3]); g.lineWidth=1;
  g.strokeRect(L.x*T-cx+.5,L.y*T-cy+.5,L.s*T,L.s*T); g.setLineDash([]); };
// texto do relógio mostra a zona ao construir
const _wnH = wildName; wildName = function(){ const n=_wnH(); if(!buildMode||!player) return n; const z=zoneAt(Math.floor(player.x/T),Math.floor(player.y/T)); return `${n} · ${({frontier:'fronteira',open:'aberto',dangerous:'perigoso',boss:'chefe'})[z]||z}`; };

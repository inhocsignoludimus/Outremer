'use strict';
// =====================================================================
// OUTREMER — os 36 monstros do Outremer 3D + dragões (do filhote ao alfa), em pixel e sombrios.
// Projéteis (flechas, magias, cuspe), sopros, investidas, terremoto, doença e invocação.
// Carrega depois de gear_draw.js.
// =====================================================================
const M3 = D3.monsters.monsters;
const REAGENTS = D3['magic/reagents'].reagents;
for(const r of REAGENTS){ ITEMS[r.id]={ name:r.name, stack:99, value:r.value, desc:r.desc, reagent:true }; PRICE[r.id]=r.value; BAG_FIRST.add(r.id); }
(function(){ const col={incense:'#c8a870',saltpeter:'#e8e8e0',myrrh:'#8a3a1a',quicklime:'#d8d8c8'};
  for(const r of REAGENTS){ const c=document.createElement('canvas'); c.width=16; c.height=16; const g=c.getContext('2d'), k=col[r.id]||'#aaa';
    g.fillStyle='#6a4a2a'; g.fillRect(4,6,8,8); g.fillStyle='#8a6a3a'; g.fillRect(4,6,8,1); g.fillStyle=k; for(let i=0;i<9;i++) g.fillRect(5+(i*7)%6,3+(i*5)%5,2,2); ICONS[r.id]=c.toDataURL(); } })();
VSTOCK.mago.push(...REAGENTS.map(r=>r.id), ...REAGENTS.map(r=>r.id)); VSTOCK.alchemist.push('incense','myrrh');

// aparência de cada família (cores sombrias, nada de desenho animado)
const FAM = {
  goblin:        { skin:'#4a6a2a', ears:true, scale:.82, jacket:'#4a3a24', pants:'#2a2018', show:'club' },
  goblin_elite:  { skin:'#3a5a22', ears:true, scale:.9,  jacket:'#3a3026', pants:'#2a2018', head:'nasal_helm', body:'leather_armor', show:'shortsword' },
  hobgoblin:     { skin:'#8a5a2a', ears:true, scale:1.15, jacket:'#4a3420', pants:'#2a1e14', body:'chainmail', show:'battleaxe' },
  hobgoblin_archer:{ skin:'#8a5a2a', ears:true, scale:1.1, jacket:'#3a4a24', pants:'#2a1e14', body:'studded_armor', show:'longbow' },
  skeleton_weak: { skel:true, scale:1, show:'shortsword' },
  skeleton:      { skel:true, scale:1.05, head:'great_helm', body:'chainmail', show:'longsword' },
  skeleton_archer:{ skel:true, scale:1, head:'chain_coif', show:'bow' },
  skeleton_mage: { skel:true, scale:1, head:'wool_hood', body:'mage_robe', show:'staff' },
  skeleton_knight_boss:{ skel:true, scale:1.4, head:'horned_helm', body:'plate', show:'broadsword', glow:'#60c8ff' },
  skeleton_mage_boss:{ skel:true, scale:1.3, head:'wizard_hat', body:'mage_robe', show:'fire_staff', glow:'#ff7030' },
  skeleton_mage_high_boss:{ skel:true, scale:1.45, head:'crown', body:'mage_robe', show:'holy_staff', glow:'#c070ff' },
  zombie:        { skin:'#6a7a5a', scale:1, jacket:'#3a3a2e', pants:'#2a2a22', rot:true },
  zombie_dark:   { skin:'#3a2e3e', scale:1.15, jacket:'#1e1a22', pants:'#141018', rot:true, glow:'#a040e0' },
  necromancer:   { skin:'#c8c0b8', scale:1.05, jacket:'#1a1418', pants:'#141014', head:'wool_hood', body:'mage_robe', show:'wand', glow:'#7aff7a' },
  minotaur:      { skin:'#5a3a24', scale:1.55, jacket:'#3a2414', pants:'#2a1a10', horns:true, show:'double_axe' },
};
const MONCOL = { zombie_rotting:{skin:'#7a6a3a'}, zombie_ghost:{skin:'#c8d0d8',ghost:true}, frozen_zombie:{skin:'#a8c8d8',jacket:'#4a5a6a'},
  skeleton_mage_fire:{robe:'#6a1a10',show:'fire_staff'}, skeleton_mage_ice:{robe:'#1a3a6a',show:'ice_staff'}, skeleton_mage:{robe:'#2a2a3a'},
  necromancer_apprentice:{robe:'#3a1a4a',scale:.95}, goblin_spearman:{show:'spear'}, goblin_shaman:{show:'staff',head:'wool_hood'}, goblin_runner:{show:'dagger',scale:.78} };
const BEAST = { antlion_small:{c:'#b8945a',s:.7}, fire_ant:{c:'#8a2a14',s:.85}, ice_ant:{c:'#7aa8c8',s:.95}, antlion:{c:'#9a7a4a',s:1.25}, antlion_armored:{c:'#5a4a3a',s:1.5,plates:true},
  boulder:{rock:true,c:'#6a6660',s:1.5}, wyvern:{wy:true,c:'#3a4a2a',s:1.4,e:'#c8e040'}, wyvern_fire:{wy:true,c:'#5a1a10',s:1.5,e:'#ff9a20'}, wyvern_air:{wy:true,c:'#7a8a9a',s:1.4,e:'#e0f0ff'},
  wyvern_water:{wy:true,c:'#1a4a5a',s:1.45,e:'#60e0e0'}, wyvern_air_boss:{wy:true,c:'#b8b0a0',s:1.9,e:'#ffe080'},
  dragon_whelp:{dr:true,c:'#4a1410',s:1.2,e:'#ff6020'}, dragon_young:{dr:true,c:'#5a1612',s:1.7,e:'#ff6020'}, dragon_red:{dr:true,c:'#6a1810',s:2.3,e:'#ff7020'},
  dragon_elder:{dr:true,c:'#3a1010',s:2.8,e:'#ffb040'}, dragon_alpha:{dr:true,c:'#1e0a0a',s:3.3,e:'#ff3010'} };
const DRAGONS = [
  { id:'dragon_whelp', name:'Filhote de Dragão', art:'dragon_whelp', level:12, hp:[90,120], dmg:[8,13], speed:1.1, range:1, special:['breath_fire'], spells:[], pack:[1,2], spawn_weight:2, loot:{gold:[40,90],table:'boss_wyvern_fire'} },
  { id:'dragon_young', name:'Dragão Jovem', art:'dragon_young', level:18, hp:[220,280], dmg:[13,20], speed:1.05, range:1, special:['breath_fire','charge'], spells:[], pack:[1,1], spawn_weight:1, loot:{gold:[120,240],table:'boss_wyvern_fire'} },
  { id:'dragon_red', name:'Dragão Vermelho', art:'dragon_red', level:26, hp:[480,600], dmg:[20,30], speed:1, range:1, special:['breath_fire','quake'], spells:[], pack:[1,1], spawn_weight:.6, loot:{gold:[300,600],table:'boss_serpe_de_fogo'} },
  { id:'dragon_elder', name:'Dragão Ancião', art:'dragon_elder', level:34, hp:[900,1100], dmg:[28,40], speed:.95, range:1, special:['breath_fire','quake','charge'], spells:['kiln_burst'], pack:[1,1], spawn_weight:.3, loot:{gold:[600,1200],table:'boss_serpe_de_fogo'} },
  { id:'dragon_alpha', name:'Dragão Alfa', art:'dragon_alpha', level:45, hp:[1800,2200], dmg:[40,55], speed:1, range:1, special:['breath_fire','quake','charge','summon_whelps'], spells:['falling_stars'], pack:[1,1], spawn_weight:.15, loot:{gold:[1500,3000],table:'boss_serpe_de_fogo'} },
];
const LT3 = D3.loot.tables;
function lootFrom(tab, boss){
  const t=LT3[tab]; if(!t) return null; const out=[];
  for(const [k,w] of t){ const [kind,id]=String(k).split(':');
    if(kind==='base' && ITEMS[id]) out.push([id,w]);
    else if(kind==='reagent') for(const r of REAGENTS) out.push([r.id,w/REAGENTS.length]);
    else if(kind==='unique'){ const u=UNIQ.find(u=>u.id===id); if(u&&ITEMS[u.base]) out.push([u.base,w]); } }
  return out.length ? LT(boss?4:2, out, boss?1:.65) : null;
}
for(const m of [...M3, ...DRAGONS]){
  const fam = FAM[m.art] || {}, col = MONCOL[m.id] || {}, beast = BEAST[m.art];
  const avg=(m.dmg[0]+m.dmg[1])/2, nat='m_'+m.id, ranged = m.range>=4;
  OW[nat] = { name:m.name, dmg:Math.round(avg*2.2), range: ranged ? m.range*T*1.2 : 18*(beast?beast.s:(col.scale||fam.scale||1)), arc:1, cd:ranged?1.6:.9, st:0, knock:3+Math.round(avg/4), len:0,
    ranged, proj: ranged ? (m.spells.length ? 'spell' : (m.special.includes('spit')?'spit':m.special.includes('spit_frost')?'frost':'arrow')) : null };
  const look = beast ? null : { sex:'m', skin:col.skin||fam.skin||'#d8d0b8', hair:'#1a1612', style:'bald', jacket:col.robe||col.jacket||fam.jacket||'#c8c0a8', pants:fam.pants||'#2a2018', boot:'#1a1410' };
  if(look){ look.jacketD=darkHex(look.jacket); if(fam.skel){ look.skin='#d8d0b8'; look.jacket=col.robe||'#c8c0a8'; look.jacketD='#8a8270'; look.pants='#b8b098'; look.boot='#8a8270'; } }
  MONS[m.id] = { name:m.name, lvl:m.level, hp:m.hp.map(v=>Math.round(v*1.15)), speed:36*(m.speed||1), weapon:nat, show:col.show||fam.show||null, look,
    skel:!!fam.skel, ears:fam.ears, horns:fam.horns, rot:fam.rot, ghost:col.ghost, glow:fam.glow, scale:col.scale||fam.scale||(beast?beast.s:1),
    head:col.head||fam.head||null, body:fam.body||null, beast:beast?m.art:null, special:m.special, spells:m.spells, pack:m.pack||[1,1], weight:m.spawn_weight||1,
    gold:m.loot.gold||[0,0], loot:[], boss:/boss/.test(m.id)||m.level>=18 };
  const lt = lootFrom(m.loot.table, MONS[m.id].boss); if(lt) LOOT['mon_'+m.id]=lt; else LOOT['mon_'+m.id]=LT(1,[['bone',1]],.3);
}
Object.assign(WEAPONS, OW);
if(!ITEMS.bone) ITEMS.bone={name:'Osso',stack:50};
// quem aparece: mais longe da capital = mais forte (os biomas entram com o mapa do mundo)
function monsterFor(dist){
  const lv = Math.max(2, Math.min(48, 2 + dist/4.5)), pool=[];
  for(const [k,M] of Object.entries(MONS)){ if(!M.weight && !['wolf','bandit','spider','orc'].includes(k)) continue; const w=M.weight||6;
    if(M.lvl<=lv && M.lvl>=lv-9) pool.push([k,w]); }
  if(!pool.length) return 'goblin'; let t=pool.reduce((a,b)=>a+b[1],0)*Math.random(); for(const [k,w] of pool){ t-=w; if(t<=0) return k; } return pool[0][0];
}
const _spawnR = spawnRaider;
spawnRaider = function(minD,maxD){
  const n0=raiders.length; if(!_spawnR(minD,maxD)) return false;
  const r=raiders[raiders.length-1]; setupMon(r);
  const M=MONS[r.mon]; const n=M.pack ? rint(M.pack[0],M.pack[1])-1 : 0;
  for(let k=0;k<n;k++){ const c={...r, x:r.x+(Math.random()-.5)*30, y:r.y+(Math.random()-.5)*30, look:r.look?{...r.look}:null, equip:{...r.equip}, path:null, wp:null};
    if(walk[idx(Math.floor(c.x/T),Math.floor(c.y/T))]) raiders.push(c); }
  return true;
};
function setupMon(r){ const M=MONS[r.mon]; if(!M) return; const hp=M.hp[0]+Math.random()*(M.hp[1]-M.hp[0]); r.hp=r.max=hp; r.weapon=M.weapon; r.speed=M.speed*(0.9+Math.random()*.2);
  r.look=M.look?{...M.look}:null; r.equip={head:M.head, body:M.body}; r.spT=2+Math.random()*4; r.mcd=0; }
// ---------------- projéteis e efeitos (usados por monstros e magias) ----------------
let projs=[], fxs=[], fields=[];
const ELCOL = { fire:'#ff7a20', cold:'#80d0ff', energy:'#c8a0ff', poison:'#7ad040', physical:'#e0d8c0', arrow:'#c8a870', spit:'#c8e040', frost:'#a8e8ff', holy:'#ffe890' };
function shoot(x,y,ang,o){ projs.push({x,y,vx:Math.cos(ang)*(o.speed||170),vy:Math.sin(ang)*(o.speed||170),life:o.life||1.6,...o}); }
function fxBurst(x,y,col,n,sp){ for(let i=0;i<(n||10);i++){ const a=Math.random()*7, v=(sp||40)*(.4+Math.random()); fxs.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-10,t:.5+Math.random()*.4,col}); } }
function fxRing(x,y,r,col){ fxs.push({ring:true,x,y,r,t:.45,max:.45,col}); }
let spellHit=false;
function spellDamage(r,dmg,ang,knock){ if(!raiders.includes(r)) return; _damageRaider(r,dmg,ang,knock||3); }
function updateProjs(dt){
  for(const p of [...projs]){ p.x+=p.vx*dt; p.y+=p.vy*dt; p.life-=dt;
    if(Math.random()<.6) fxs.push({x:p.x,y:p.y,vx:0,vy:-6,t:.25,col:p.col});
    const tx=Math.floor(p.x/T), ty=Math.floor((p.y+4)/T); let hit=false;
    if(!inB(tx,ty) || (!walk[idx(tx,ty)] && map[idx(tx,ty)]!==TL.WATER)) hit=true;
    if(p.owner==='mon' && !hit && Math.hypot(player.x-p.x,player.y-10-p.y)<9){ hit=true; if(!player.ghost){ hurtPlayer(p.dmg,p.src||{x:p.x,y:p.y,mon:1},null,false);
        if(p.el==='poison'||p.el==='spit') player.poison=Math.max(player.poison||0,6); if(p.el==='cold'||p.el==='frost') player.slowT=3; } }
    if(p.owner==='player' && !hit) for(const r of raiders){ const M=MONS[r.mon]||{}; if(Math.hypot(r.x-p.x,r.y-10*(M.scale||1)-p.y)<8*(M.scale||1)+2 && !(p.hitSet&&p.hitSet.has(r))){
        spellDamage(r,p.dmg,Math.atan2(p.vy,p.vx),p.knock); if(p.stun) r.stunT=p.stun; if(p.el==='cold') r.slowT=3; if(p.el==='poison') r.poisonT=6;
        if(p.pierce){ (p.hitSet=p.hitSet||new Set()).add(r); } else { hit=true; break; } } }
    if(hit||p.life<=0){ projs.splice(projs.indexOf(p),1); fxBurst(p.x,p.y,p.col,p.big?18:7,p.big?60:30);
      if(p.aoe){ fxRing(p.x,p.y,p.aoe,p.col); for(const r of [...raiders]) if(Math.hypot(r.x-p.x,r.y-p.y)<p.aoe && p.owner==='player') spellDamage(r,p.dmg*.7,Math.atan2(r.y-p.y,r.x-p.x),5);
        if(p.owner==='mon' && Math.hypot(player.x-p.x,player.y-p.y)<p.aoe && !player.ghost) hurtPlayer(p.dmg*.7,{x:p.x,y:p.y,mon:1},null,false); } } }
  for(const f of [...fxs]){ f.t-=dt; if(!f.ring){ f.x+=f.vx*dt; f.y+=f.vy*dt; f.vy+=30*dt; } if(f.t<=0) fxs.splice(fxs.indexOf(f),1); }
  for(const fl of [...fields]){ fl.t-=dt; fl.tick=(fl.tick||0)-dt; if(Math.random()<.5) fxs.push({x:fl.x+(Math.random()-.5)*fl.r*2,y:fl.y+(Math.random()-.5)*fl.r,vx:0,vy:-14,t:.5,col:fl.col});
    if(fl.tick<=0){ fl.tick=.5; for(const r of [...raiders]) if(Math.hypot(r.x-fl.x,(r.y-fl.y)*1.5)<fl.r){ spellDamage(r,fl.dmg,0,0); if(fl.slow) r.slowT=1; if(fl.stun) r.stunT=.6; }
      if(fl.mon && Math.hypot(player.x-fl.x,(player.y-fl.y)*1.5)<fl.r && !player.ghost) hurtPlayer(fl.dmg,{x:fl.x,y:fl.y,mon:1},null,false); }
    if(fl.t<=0) fields.splice(fields.indexOf(fl),1); }
}
function drawFX(g,cx,cy){
  for(const fl of fields){ g.globalAlpha=.18; g.fillStyle=fl.col; g.beginPath(); g.ellipse(fl.x-cx,fl.y-cy,fl.r,fl.r*.6,0,0,7); g.fill(); g.globalAlpha=1; }
  for(const f of fxs){ g.globalAlpha=Math.max(0,Math.min(1,f.t*2.5)); if(f.ring){ g.strokeStyle=f.col; g.lineWidth=2; g.beginPath(); g.ellipse(f.x-cx,f.y-cy,f.r*(1-f.t/f.max)+4,(f.r*(1-f.t/f.max)+4)*.6,0,0,7); g.stroke(); }
    else { g.fillStyle=f.col; g.fillRect(Math.round(f.x-cx),Math.round(f.y-cy),1,1); } }
  g.globalAlpha=1;
  for(const p of projs){ const x=Math.round(p.x-cx), y=Math.round(p.y-cy);
    if(p.el==='arrow'){ const a=Math.atan2(p.vy,p.vx); g.fillStyle='#8a6a3a'; for(let i=0;i<6;i++) g.fillRect(Math.round(x-Math.cos(a)*i),Math.round(y-Math.sin(a)*i),1,1); g.fillStyle='#c8ccd4'; g.fillRect(x,y,1,1); continue; }
    g.globalAlpha=.35; g.fillStyle=p.col; g.fillRect(x-2,y-2,5,5); g.globalAlpha=1; g.fillStyle=p.col; g.fillRect(x-1,y-1,3,3); g.fillStyle='#fff'; g.fillRect(x,y,1,1); }
}
// ---------------- ataques especiais dos monstros ----------------
const _pwa = personWeaponAttack;
personWeaponAttack = function(a,tgt,dt){
  const M=a.isRaider && MONS[a.mon];
  if(tgt===player && player.ghost) return false;
  if(a.stunT>0) return true;
  if(!M || !OW[a.weapon] || !OW[a.weapon].proj) return _pwa(a,tgt,dt);
  const Wp=OW[a.weapon], d=Math.hypot(tgt.x-a.x,tgt.y-a.y);
  if(d<Wp.range && a.cd<=0 && los(a.x,a.y-10,tgt.x,tgt.y-10)){
    a.cd=Wp.cd+Math.random()*.8; const ang=Math.atan2(tgt.y-a.y,tgt.x-a.x); a.aimAng=ang; a.face=faceFromAng(ang); a.swingT=.2;
    let el=Wp.proj==='arrow'?'arrow':Wp.proj, dmg=Wp.dmg*.5, aoe=0;
    if(Wp.proj==='spell'){ const sp=SPELLS3[rpick(M.spells)]; if(sp){
        if(sp.effect.type==='heal'){ if(a.hp<a.max*.6){ a.hp=Math.min(a.max,a.hp+20+M.lvl*2); fxBurst(a.x,a.y-12,'#ffe890',12); } return true; }
        if(sp.effect.type==='debuff'){ fxBurst(player.x,player.y-12,'#a060c0',10); if(sp.effect.stat==='mana') player.mana=Math.max(0,(player.mana||0)-15); else player.weakT=6; toast(`${M.name} lança ${sp.name}!`); return true; }
        el=sp.effect.element||'energy'; dmg=avgOf(sp.effect.base)*(1+M.lvl/25); aoe=sp.effect.aoe?sp.effect.aoe*T:0; } }
    shoot(a.x,a.y-10*(M.scale||1),ang,{owner:'mon',dmg,el,col:ELCOL[el]||'#fff',speed:el==='arrow'?220:140,aoe,src:a}); return true; }
  return d<Wp.range*.6;
};
const avgOf = b => b ? (b[0]+b[1])/2 : 8;
const _updR = updateRaider;
updateRaider = function(r,dt){
  const M=MONS[r.mon];
  if(r.stunT>0){ r.stunT-=dt; r.moving=false; if(Math.random()<.3) fxs.push({x:r.x+(Math.random()-.5)*8,y:r.y-22,vx:0,vy:-4,t:.3,col:'#ffe080'}); return; }
  if(r.poisonT>0){ r.poisonT-=dt; r.hp-=dt*3; if(r.hp<=0){ killRaider(r,0); return; } }
  const sp0=r.speed; if(r.slowT>0){ r.slowT-=dt; r.speed*=.5; }
  if(r.dashT>0){ r.dashT-=dt; r.speed=sp0*3; }
  _updR(r,dt); r.speed=sp0;
  if(!raiders.includes(r) || !M || !M.special || !M.special.length || player.ghost) return;
  r.spT-=dt; const d=Math.hypot(player.x-r.x,player.y-r.y);
  if(r.spT<=0 && r.state==='chase' && d<8*T){ const s=rpick(M.special); r.spT=5+Math.random()*4;
    const ang=Math.atan2(player.y-r.y,player.x-r.x);
    if(s==='charge'||s==='dash'){ r.dashT=.6; fxBurst(r.x,r.y,'#c8b890',8); }
    else if(s.startsWith('breath')){ const el={breath_fire:'fire',breath_poison:'poison',breath_cold:'cold'}[s]; r.breath={t:1,ang,el}; toast(`${M.name} solta o sopro!`); }
    else if(s==='quake' && d<5*T){ shake=Math.max(shake,6); fxRing(r.x,r.y,60*(M.scale||1),'#a89878'); if(d<60*(M.scale||1)) hurtPlayer(OW[r.weapon].dmg*.6,r,null,true); }
    else if(s==='summon_undead' || s==='summon_whelps'){ const kind=s==='summon_whelps'?'dragon_whelp':'skeleton'; let n=raiders.filter(x=>x.summoned).length;
      for(let k=0;k<2 && n<4;k++,n++){ const c={...r,x:r.x+(Math.random()-.5)*40,y:r.y+(Math.random()-.5)*40,mon:kind,summoned:true,path:null,wp:null,breath:null}; setupMon(c); raiders.push(c); fxBurst(c.x,c.y-8,'#7aff7a',14); }
      toast(`${M.name} chama reforços!`); } }
  if(r.breath){ const b=r.breath; b.t-=dt; r.moving=false; const sc=M.scale||1;
    for(let i=0;i<3;i++){ const a=b.ang+(Math.random()-.5)*.6, v=60+Math.random()*80; fxs.push({x:r.x+Math.cos(b.ang)*8*sc,y:r.y-10*sc,vx:Math.cos(a)*v,vy:Math.sin(a)*v,t:.5,col:ELCOL[b.el]}); }
    b.tick=(b.tick||0)-dt; if(b.tick<=0){ b.tick=.25; const dd=Math.hypot(player.x-r.x,player.y-r.y), da=Math.abs(((Math.atan2(player.y-r.y,player.x-r.x)-b.ang+9.42)%6.283)-3.14);
      if(dd<70*sc && da<.45){ hurtPlayer(OW[r.weapon].dmg*.22,r,null,false); if(b.el==='poison') player.poison=5; if(b.el==='cold') player.slowT=2; } }
    if(b.t<=0) r.breath=null; }
};
// doença dos zumbis podres ao acertar
const _hP = hurtPlayer;
hurtPlayer = function(dmg,src,part,blunt){ if(player.ghost) return; if(player.weakT>0) dmg*=1.15; const r=_hP(dmg,src,part,blunt);
  if(src && src.mon && MONS[src.mon] && MONS[src.mon].special && MONS[src.mon].special.includes('disease')) player.poison=Math.max(player.poison||0,8); return r; };
const _upd4 = update;
update = function(dt){ _upd4(dt); if(!running||!player) return; updateProjs(dt);
  if(player.poison>0){ player.poison-=dt; player.health-=dt*1.5; if(Math.random()<dt*2) fxs.push({x:player.x+(Math.random()-.5)*6,y:player.y-14,vx:0,vy:-8,t:.4,col:'#7ad040'}); if(player.health<=0) player.cause='poison'; }
  if(player.weakT>0) player.weakT-=dt;
  if(player.slowT>0){ player.slowT-=dt; if(!player._sp) player._sp=player.speed; player.speed=player._sp*.6; } else if(player._sp){ player.speed=player._sp; player._sp=0; } };

// ---------------- desenho ----------------
function drawBeast(g,r,x,y,M){
  const B=BEAST[M.beast], s=B.s, fl=r.hurtT>0, c=fl?'#fff':B.c, d=fl?'#ddd':darkHex(B.c,.6), hi=fl?'#fff':darkHex(B.c,1.3), side=r.face==='left'?-1:r.face==='right'?1:0;
  const st=r.moving?Math.sin(r.phase*1.4):0, now=performance.now();
  g.save(); g.translate(x,y); g.scale(s,s); const P=(a,b,w,h,col)=>{ g.fillStyle=col; g.fillRect(a,b,w,h); };
  if(B.rock){ P(-7,-16,14,15,c); P(-8,-12,16,8,c); P(-6,-17,10,2,hi); P(-7,-2,14,1,d); P(-9,-10,3,6,d); P(6,-10,3,6,d); P(-3,-12,2,1,'#ff8a20'); P(2,-12,2,1,'#ff8a20'); P(-4,-7,8,1,d); P(-2+st,-1,4,1,d); }
  else if(B.wy||B.dr){ const fl2=Math.sin(now/(B.dr?220:160))*5, m=side||1, e=fl?'#fff':B.e;
    P(-12*m-(m<0?0:0),-8,1,1,c);
    for(let i=0;i<10;i++) P(-m*(8+i),-6+Math.round(Math.sin(i*.6+now/300)*1.5),2,2,i>7?d:c);        // cauda
    for(let i=0;i<12;i++){ const wy=-12-i*.4-fl2*(i/12); P(-6+i,Math.round(wy),1,Math.max(1,Math.round(8-i*.5+fl2*.3)),d); } // asa
    P(-7,-12,13,7,c); P(-7,-12,13,1,hi); P(-6,-5,11,1,d);                                              // corpo
    P(m*5,-17,3,6,c); P(m*7,-20,5,4,c); P(m*10,-19,3,2,c); P(m>0?11:7,-18,1,1,e); if(B.dr){ P(m*7,-22,1,2,'#c8b890'); P(m*9,-23,1,3,'#c8b890'); for(let i=0;i<5;i++) P(-4+i*2,-13,1,1,'#2a0a08'); }
    P(-5,-5,2,4+Math.round(st),d); P(2,-5,2,4-Math.round(st),d); P(-6,-1,3,1,d); P(1,-1,3,1,d);
    for(let i=0;i<12;i++){ const wy=-14-i*.6-fl2*(i/10); P(-2+i*.9*-m*0+i-4,Math.round(wy),1,Math.max(1,Math.round(9-i*.6+fl2*.4)),c); } }   // asa da frente
  else { // formigas-leão e afins: corpo em três partes, mandíbulas, seis patas
    const L=r.moving?Math.round(st*1.5):0, m=side||1;
    for(let k=0;k<3;k++){ P(-6+k*4,-5+((k%2)?L:-L),1,5,d); P(-7+k*4,-1+((k%2)?L:-L),2,1,d); }
    P(-9*m-(m<0?-6:0),-9,7,6,c); P(-2,-10,5,6,c); P(m>0?3:-8,-11,6,6,c); P(-2,-10,5,1,hi);
    if(B.plates){ P(-8,-9,4,1,hi); P(-1,-10,3,1,hi); }
    P(m>0?8:-10,-11,2,1,'#e8d8b0'); P(m>0?9:-11,-9,2,1,'#e8d8b0'); P(m>0?6:-7,-10,1,1,'#ff3a20'); }
  g.restore();
  if(M.beast.startsWith('fire')||M.beast==='wyvern_fire'||B.dr) if(Math.random()<.3) fxs.push({x:x+(Math.random()-.5)*10*s,y:y-10*s,vx:0,vy:-10,t:.4,col:'#ff8a30'});
}
const _drawR = drawRaider;
drawRaider = function(g,r,x,y){
  const M=MONS[r.mon];
  if(!M || (!M.beast && !M.look) || ['wolf','spider'].includes(r.mon)) return _drawR(g,r,x,y);
  if(M.ghost) g.globalAlpha=.55;
  if(M.beast && BEAST[M.beast]) drawBeast(g,r,x,y,M);
  else { let a; if(r.wind>0) a=r.aimAng-1.3; else if(r.swingT>0) a=r.aimAng-1.3+2.6*(1-r.swingT/.2); else a=FACE_ANG[r.face]+0.9;
    const sc=M.scale||1; g.save(); g.translate(x,y); g.scale(sc,sc); g.translate(-x,-y);
    drawHuman(g,x,y,{face:r.face,phase:r.phase,moving:r.moving,look:r.look,flash:r.hurtT>0,weapon:M.show,wAng:a,head:r.equip.head,body:r.equip.body});
    const P=(px,py,w,h,c)=>{ g.fillStyle=c; g.fillRect(x+px,y+py,w,h); };
    if(r.hurtT<=0){
      if(M.skel && r.face==='down' && !['great','bascinet'].includes(WEAR[r.equip.head]?.kind)){ P(-2,-18,1,1,M.glow||'#1a1a1a'); P(1,-18,1,1,M.glow||'#1a1a1a'); P(-1,-15,2,1,'#5a5248'); }
      if(M.skel && !r.equip.body){ P(-3,-12,6,1,'#8a8270'); P(-3,-10,6,1,'#8a8270'); }
      if(M.ears && r.face!=='up'){ P(-5,-19,2,1,r.look.skin); P(-6,-20,1,1,r.look.skin); P(3,-19,2,1,r.look.skin); P(5,-20,1,1,r.look.skin); if(r.face==='down'){ P(-2,-17,1,1,'#e8c020'); P(1,-17,1,1,'#e8c020'); } }
      if(M.rot && r.face==='down'){ P(-2,-17,1,1,'#c8d040'); P(1,-17,1,1,'#c8d040'); P(-3,-11,2,2,'#4a1a14'); P(2,-9,1,2,'#4a1a14'); }
      if(M.horns){ P(-4,-21,8,3,'#3a2416'); P(-6,-24,2,3,'#d8d0b8'); P(-7,-26,1,2,'#d8d0b8'); P(4,-24,2,3,'#d8d0b8'); P(6,-26,1,2,'#d8d0b8'); if(r.face==='down'){ P(-2,-18,1,1,'#ff3a20'); P(1,-18,1,1,'#ff3a20'); P(-2,-15,4,2,'#2a1a10'); } }
      if(M.glow && Math.random()<.25) fxs.push({x:x+(Math.random()-.5)*10*sc,y:y-16*sc,vx:0,vy:-8,t:.4,col:M.glow}); }
    g.restore(); }
  g.globalAlpha=1;
  const sc=M.scale||1, top=-30*sc-4;
  if(r.hp<r.max){ g.fillStyle='#000'; g.fillRect(x-8,y+top,16,3); g.fillStyle=M.boss?'#d8a020':'#b8433a'; g.fillRect(x-7,y+top+1,Math.max(0,Math.round(14*r.hp/r.max)),1); }
  if(M.boss && Math.hypot(player.x-r.x,player.y-r.y)<9*T && g===bctx) HILABELS.push({wx:r.x, wy:r.y+top-2, boss:M.name});
};
// restos de bichos e mortos-vivos
const _dObj5 = drawObj;
drawObj = function(g,o,sx,sy,now){
  if(o.type==='remains'){ const M=MONS[o.mon]||{}; if(M.beast && BEAST[M.beast]){ const B=BEAST[M.beast], P=(a,b,w,h,c)=>{g.fillStyle=c;g.fillRect(sx+a,sy+b,w,h);};
      P(1,7,14,6,'rgba(50,10,8,.5)'); P(3,8,10,4,darkHex(B.c,.7)); P(4,8,4,2,B.c); if(!o.searched){ P(10,5,4,4,'#7a5434'); P(11,7,2,1,'#c8a040'); } return; } }
  return _dObj5(g,o,sx,sy,now);
};

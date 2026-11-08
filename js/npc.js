'use strict';
// =====================================================================
// AFTER LIGHT — people. Survivors (loners, traders, and the ones who'll
// join your community), raider camps in the city and in the woods, raids
// that come by day, and fights between all of them.
// =====================================================================
let npcs=[], camps=[], raidT=120, roamT=0;
const FIRST=['Anselmo','Bertrand','Caio','Dario','Elias','Fulco','Gaspar','Henrique','Isaac','Jaime','Lucas','Martim','Nuno','Odo','Pedro','Rui','Simão','Tancredo','Adela','Beatriz','Clara','Dulce','Filipa','Guiomar','Helena','Inês','Joana','Leonor','Mafalda','Sancha','Teresa','Urraca'];
const LINES={
  loner:['Keep walking, friend. I don\'t want trouble.','Four days and the radio\'s still dead. Nobody\'s coming.','I\'ve got what I need. You should find your own.','Stay off the main roads at night. Trust me.'],
  trader:['Cash still talks — for now. Let\'s deal.','Got water, food, ammo. Prices are fair. Mostly.','Gold, watches, jewellery — I\'ll take them all.'],
  recruit:['I can\'t do this alone much longer.','If you\'ve got food and a roof, I\'ve got two hands.','I was a nurse before the lights went out. I still know a thing or two.'],
  member:['Ready when you are.','Quiet out there. Too quiet.','We hold this place together, or not at all.'],
};
const PRICE={ beans:15, chips:6, soda:8, water:12, dirty_water:3, bottle:2, bandage:20, pills:15, firstaid:60, splint:18, matches:5, lantern:40, ammo:4, shells:6, rifle_ammo:8,
  knife:20, bat:25, crowbar:30, pipe:20, hatchet:35, fire_axe:60, spear:25, spiked_bat:40, pistol:150, shotgun:220, rifle:300, rod:25, gascan:45, gascan_e:15,
  meat_cooked:20, fish_cooked:15, meat_raw:8, fish_raw:6, berries:3, hide:10, logs:4, planks:5, nails:1, scrap:3, cloth:3,
  helmet_bike:20, hardhat:25, fire_helmet:45, mil_helmet:90, vest_light:120, vest_heavy:220 };
function priceOf(id){ return ITEMS[id].value ? ITEMS[id].value : PRICE[id]||5; }

// ---------------- world placement (deterministic) ----------------
function placePeople(){
  npcs=[]; camps=[];
  const rr=mulberry32(9090), pick=a=>a[Math.floor(rr()*a.length)];
  let nid=0;
  const mk=(role,x,y,o={})=>{ const sex=rr()<.5?'m':'f'; const look=randomLookR(sex,rr);
    const n={id:nid++, role, name:pick(FIRST), x:x*T+8, y:y*T+12, hx:x*T+8, hy:y*T+12, look, face:'down', phase:0, moving:false, hp:60, max:60,
      weapon: role==='trader' ? 'shotgun' : pick(['knife','bat','pipe','crowbar','pistol']), state:'idle', t:rr()*3, cd:0, wind:0, swingT:0, hurtT:0, alive:true,
      recruitable: role==='loner' && rr()<.55, path:null, pathT:0, dead:false, ...o };
    npcs.push(n); return n; };
  const freeWalk=(x,y)=>inB(x,y)&&!solidTile(x,y)&&!objGrid[idx(x,y)]&&!doors.has(idx(x,y))&&map[idx(x,y)]!==TL.PIER;
  // Outremer: moradores andando pelas ruas, guardas de ronda, vendedores atrás do balcão e o lorde no trono
  const streets=[]; for(let y=1;y<H-1;y+=2) for(let x=1;x<W-1;x+=2){ const i=idx(x,y); if((map[i]===TL.ASPH)&&regionId[i]!==255&&!objGrid[i]) streets.push([x,y]); }
  const guardLook=()=>{ const l=randomLookR('m',rr); l.jacket='#6a6e74'; l.jacketD='#4a4e54'; l.pants='#3a3e44'; l.tabard='#7a1a14'; return l; };
  // vendedor de cada loja, perto do balcão
  for(const b of buildings){ if(!b) continue;
    const vend = {forge:'ferreiro', tavern:'estalajadeiro', bank:'banqueiro', mage:'mago', shop:b.kind}[b.t]; if(!vend) continue;
    const cells=[]; for(let y=b.y+1;y<b.y+b.h-1;y++) for(let x=b.x+1;x<b.x+b.w-1;x++) if(freeWalk(x,y)) cells.push([x,y]);
    cells.sort((p,q)=>{ const near=c=>Math.min(...objs.filter(o=>o.b===b.id&&o.type==='counter').map(o=>Math.hypot(o.x-c[0],o.y-c[1])).concat([9])); return near(p)-near(q); });
    const c=cells.find(c=>!doorAdj(c[0],c[1])) || cells[0]; if(!c) continue;
    mk('trader',c[0],c[1],{home:b.id, vendor:vend, shop:b.name, weapon:null}); }
  // lorde e guarda real no castelo
  for(const b of buildings){ if(!b||b.t!=='castle') continue;
    const th_=objs.find(o=>o.b===b.id&&o.type==='throne');
    if(th_){ const l=randomLookR('m',rr); l.jacket='#7a1a14'; l.jacketD='#5a1010'; l.crown=true; l.beard=true; l.hair='#d8d0c0';
      mk('lord',th_.x,th_.y+1,{name:'Lorde Aurélio',look:l,weapon:null}); }
    for(const dx of [-2,2]) if(th_) mk('guard',th_.x+dx,th_.y+2,{look:guardLook(),weapon:'spear',post:true});
  }
  // guardas: dois em cada portão (ruas que cruzam a muralha) e oito de ronda
  const gates=[]; for(const w of SW.walls||[]) {} 
  for(let k=0;k<10 && streets.length;k++){ const [x,y]=streets[Math.floor(rr()*streets.length)]; mk('guard',x,y,{look:guardLook(),weapon:'spear',patrol:true}); }
  // moradores
  for(let k=0;k<40 && streets.length;k++){ const [x,y]=streets[Math.floor(rr()*streets.length)]; const n=mk('citizen',x,y,{weapon:null}); n.look.jacket=pick(['#5a4a36','#4a5a3a','#5a3a3a','#6a5a40','#3e4a5a','#7a6a4a','#5a2a2a']); n.look.jacketD=darkHex(n.look.jacket); }
  npcs.streets=streets;
}
function randomLookR(sex,rr){ const keep=Math.random; Math.random=rr; const l=randomLook(sex); Math.random=keep; return l; }
function traderStock(rr){ const pool=['beans','water','water','chips','bandage','pills','ammo','shells','matches','firstaid','splint','rod','gascan','hatchet','pistol','meat_cooked','soda','vest_light','mil_helmet','rifle_ammo','bottle'];
  const st=[]; for(let k=0;k<9;k++){ const id=pool[Math.floor(rr()*pool.length)]; const q=['ammo','shells','rifle_ammo'].includes(id)?10+Math.floor(rr()*15):1+Math.floor(rr()*3); const s=st.find(x=>x.id===id); if(s) s.qty+=q; else st.push({id,qty:q}); } return st; }

// ---------------- camps & raids ----------------
function baseCenter(){
  const pts=[]; for(const o of objs) if(o.placed) pts.push([o.x*T+8,o.y*T+8]); for(const b of built) if(b.t!=='_fence') pts.push([b.x*T+8,b.y*T+8]);
  for(const n of npcs) if(n.role==='member'&&!n.dead&&n.state==='guard') pts.push([n.hx,n.hy]);
  if(pts.length<3) return null; let x=0,y=0; for(const [a,b] of pts){ x+=a; y+=b; } return {x:x/pts.length, y:y/pts.length};
}
function raiderAt(x,y,o={}){
  const weapon=o.weapon||['pipe','knife','bat','crowbar','pistol','bat'][Math.floor(Math.random()*6)], hp=45+Math.random()*25;
  const r={x,y,hp,max:hp,face:'down',phase:0,moving:false,state:o.state||'wander',wp:null,idle:Math.random()*2,
    path:null,pathT:0,seenT:0,lastX:0,lastY:0,wind:0,cd:0,hurtT:0,alertT:0,swingT:0,doorT:0,aimAng:0,weapon,ammo:weapon==='pistol'?8:0,
    speed:34+Math.random()*10,look:raiderLook(),camp:o.camp??-1,hx:x,hy:y,tx:o.tx,ty:o.ty,foe:null,
    equip:{head:Math.random()<.22?rpick(['helmet_bike','hardhat','mil_helmet','fire_helmet']):null, body:Math.random()<.16?rpick(['vest_light','vest_light','vest_heavy']):null}};
  raiders.push(r); return r;
}
function openSpot(px,py,rad){ for(let a=0;a<40;a++){ const x=Math.floor(px/T)+Math.floor((Math.random()-.5)*rad*2), y=Math.floor(py/T)+Math.floor((Math.random()-.5)*rad*2); if(inB(x,y)&&walk[idx(x,y)]&&!objGrid[idx(x,y)]) return [x*T+8,y*T+12]; } return null; }
function updateCamps(dt){ return;
  for(const c of camps){
    if(c.left===0) continue;
    const d=Math.hypot(c.x-player.x,c.y-player.y);
    if(!c.spawned && d<55*T){ c.spawned=true; const n=c.left<0?c.size:c.left; c.left=n;
      for(let k=0;k<n;k++){ const sp=openSpot(c.x,c.y,c.kind==='building'?Math.min(8,buildings[c.b].w/2-1):5); if(sp){ const r=raiderAt(sp[0],sp[1],{state:'guard',camp:c.id}); if(c.kind==='building'){ r.hx=sp[0]; r.hy=sp[1]; } } } }
    else if(c.spawned && d>95*T){ c.spawned=false; c.left=raiders.filter(r=>r.camp===c.id).length; raiders=raiders.filter(r=>r.camp!==c.id); }
  }
  // raids: by day and by night, from the nearest camp still standing
  raidT-=dt; roamT+=dt;
  if(raidT<=0){ raidT=160+Math.random()*200;
    const live=camps.filter(c=>c.left!==0).sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y));
    const c=live[0]; if(c && Math.hypot(c.x-player.x,c.y-player.y)<260*T){
      const base=baseCenter(), tgt = base && Math.hypot(base.x-player.x,base.y-player.y)<70*T ? base : {x:player.x,y:player.y};
      const ang=Math.atan2(c.y-tgt.y,c.x-tgt.x), n=3+Math.floor(Math.random()*3)+Math.floor(day/4);
      let made=0; for(let k=0;k<n*3 && made<n;k++){ const dd=32+Math.random()*10, x=Math.floor((tgt.x+Math.cos(ang+(Math.random()-.5)*.6)*dd*T)/T), y=Math.floor((tgt.y+Math.sin(ang+(Math.random()-.5)*.6)*dd*T)/T);
        if(inB(x,y)&&walk[idx(x,y)]&&bld[idx(x,y)]<0){ raiderAt(x*T+8,y*T+12,{state:'raid',tx:tgt.x,ty:tgt.y,camp:-2}); made++; } }
      if(made) toast(base&&tgt===base ? `Raiders from the ${c.name} are heading for your base!` : `A raiding party from the ${c.name} is moving through the area.`);
    }
  }
  // daytime: small roaming gangs and survivors on the move — they will run into each other
  if(roamT>75){ roamT=0;
    if(raiders.filter(r=>r.state!=='guard').length<6 && Math.random()<.55){ const k=2+Math.floor(Math.random()*2); for(let i=0;i<k;i++) spawnRaider(30,48); }
    if(npcs.filter(n=>n.role==='wanderer'&&!n.dead).length<3 && Math.random()<.5) spawnWanderer();
  }
}
function spawnWanderer(){ return;
  const sp=(()=>{ for(let a=0;a<60;a++){ const ang=Math.random()*6.28, d=26+Math.random()*16, x=Math.round(player.x/T+Math.cos(ang)*d), y=Math.round(player.y/T+Math.sin(ang)*d); if(inB(x,y)&&walk[idx(x,y)]&&bld[idx(x,y)]<0) return [x,y]; } return null; })();
  if(!sp) return; const sex=Math.random()<.5?'m':'f';
  npcs.push({id:1e6+Math.floor(Math.random()*1e6), role:'wanderer', name:rpick(FIRST), x:sp[0]*T+8, y:sp[1]*T+12, hx:sp[0]*T+8, hy:sp[1]*T+12, look:randomLook(sex), face:'down', phase:0, moving:false,
    hp:55, max:55, weapon:rpick(['knife','bat','pipe','pistol']), state:'travel', t:0, cd:0, wind:0, swingT:0, hurtT:0, alive:true, recruitable:Math.random()<.5, temp:true,
    tx:player.x+(Math.random()-.5)*60*T, ty:player.y+(Math.random()-.5)*60*T});
}

// ---------------- shared combat between people ----------------
const isHostile=(a,b)=> a===player ? (b.isRaider || b.state==='hostile') : b===player ? (a.isRaider || a.state==='hostile') : (!!a.isRaider !== !!b.isRaider);
function sightOK(a,b,range){ const d=Math.hypot(a.x-b.x,a.y-b.y); return d<range && los(a.x,a.y-10,b.x,b.y-10); }
function hitPerson(tgt,dmg,src,ang,knock){
  if(tgt===player){ if(player.onTower) return; hurtPlayer(dmg,src,null,src.weapon!=='knife'); return; }
  if(tgt.isRaider) { damageRaider(tgt,dmg,ang,knock,src); return; }
  damageNPC(tgt,dmg,ang,src);
}
function damageNPC(n,dmg,ang,src){
  if(n.dead) return; n.hp-=dmg*(1-armorOf(n.equip)); n.hurtT=.12; blood(n.x,n.y-9,ang||0,6);
  if(src===player && n.state!=='hostile'){ n.state='hostile'; if(n.role==='member'){ n.role='loner'; toast(`${n.name} turns on you!`); } else toast(`${n.name} fights back!`); }
  if(n.hp<=0){ n.dead=true; n.alive=false; blood(n.x,n.y-6,ang||0,12);
    const tx=Math.floor(n.x/T), ty=Math.floor((n.y-3)/T);
    if(inB(tx,ty)&&!objGrid[idx(tx,ty)]) addObj({type:'body',x:tx,y:ty,solid:false,container:'body',drop:n.weapon,gear:[],pal:n.look,dir:1,sortY:ty*T+1});
    if(n.role==='member') toast(`${n.name} is dead.`); else if(n.role==='trader') toast(`The trader ${n.name} is dead.`);
  }
}
function personWeaponAttack(a,tgt,dt){
  const Wp=WEAPONS[a.weapon]||WEAPONS.knife, d=Math.hypot(tgt.x-a.x,tgt.y-a.y);
  if(Wp.ranged && (a.ammo===undefined || a.ammo>0 || !a.isRaider)){
    if(d<Wp.range*.7 && a.cd<=0 && los(a.x,a.y-10,tgt.x,tgt.y-10)){
      a.cd=Wp.cd*2.4+Math.random()*.8; a.aimAng=Math.atan2(tgt.y-a.y,tgt.x-a.x); a.face=faceFromAng(a.aimAng); if(a.ammo!==undefined && a.isRaider) a.ammo--;
      const miss=Math.random()<.45; const ex=tgt.x+(miss?(Math.random()-.5)*30:0), ey=tgt.y-9+(miss?(Math.random()-.5)*30:0);
      tracers.push({x1:a.x,y1:a.y-10,x2:ex,y2:ey,t:.07}); alertRaiders(a.x,a.y,18*T); animalAlert(a.x,a.y,20*T);
      if(!miss) hitPerson(tgt,Wp.dmg*.45*(Wp.pellets?2:1),a,a.aimAng,4);
      return true; }
    return d<Wp.range*.5;
  }
  if(a.wind>0){ a.wind-=dt; a.moving=false; a.aimAng=Math.atan2(tgt.y-a.y,tgt.x-a.x); a.face=faceFromAng(a.aimAng);
    if(a.wind<=0){ a.swingT=.2; a.cd=.9+Math.random()*.6; if(d<(Wp.ranged?14:Wp.range)+5) hitPerson(tgt,Wp.dmg*.5*(0.8+Math.random()*.4),a,a.aimAng,4); } return true; }
  if(d<18 && a.cd<=0){ a.wind=.42; return true; }
  return d<14;
}
function nearestFoe(a,range){
  let best=null, bd=range;
  const consider=c=>{ if(!c||c===a||c.dead) return; if(!isHostile(a,c)) return; const d=Math.hypot(c.x-a.x,c.y-a.y); if(d<bd && los(a.x,a.y-10,c.x,c.y-10)){ bd=d; best=c; } };
  if(!driving) consider(player);
  for(const r of raiders) consider(r);
  for(const n of npcs) if(n.active) consider(n);
  return best;
}
// raiders: guard camps, raid, wander, and fight whoever they see (you or the survivors)
function updateRaider(r,dt){
  r.isRaider=true;
  if(r.hurtT>0) r.hurtT-=dt; if(r.alertT>0) r.alertT-=dt; if(r.swingT>0) r.swingT-=dt;
  r.cd=Math.max(0,r.cd-dt);
  const dP=Math.hypot(player.x-r.x,player.y-r.y);
  if(dP>110*T && r.state!=='guard'){ raiders.splice(raiders.indexOf(r),1); return; }
  if(dP>60*T && (r.state==='wander'||r.state==='guard')){ r.moving=false; return; }
  const dk=darkness(time); const sight=(9*(1-dk)+3.5*dk)*T;
  let foe=r.foe;
  if(!foe || foe.dead || (foe===player && driving) || Math.hypot(foe.x-r.x,foe.y-r.y)>sight*1.6) foe=null;
  if(!foe || Math.random()<dt){ const f=nearestFoe(r, dk>0.3 && playerLit() ? Math.max(sight,13*T) : sight); if(f) foe=f; }
  if(!foe && dP<5*T && (keys.shift||runHeld) && player.moving && !driving) foe=player;
  if(foe){ if(r.state!=='chase'){ r.prev=r.state; r.state='chase'; r.alertT=.8; } r.foe=foe; r.lastX=foe.x; r.lastY=foe.y; r.seenT=0; }
  if(r.state==='chase'){
    if(!foe){ r.seenT+=dt; if(r.seenT>5){ r.state='search'; r.seenT=0; } else moveRaiderTo(r,r.lastX,r.lastY,dt,1); }
    else { const busy=personWeaponAttack(r,foe,dt); if(!busy) moveRaiderTo(r,foe.x,foe.y,dt,1); else { r.moving=false; r.face=faceFromAng(Math.atan2(foe.y-r.y,foe.x-r.x)); } }
  } else if(r.state==='search'){
    r.seenT+=dt; moveRaiderTo(r,r.lastX,r.lastY,dt,.85);
    if(Math.hypot(r.lastX-r.x,r.lastY-r.y)<12 || r.seenT>15){ r.state = r.camp>=0 ? 'guard' : r.tx!==undefined ? 'raid' : 'wander'; r.idle=2+Math.random()*2; r.wp=null; }
  } else if(r.state==='raid'){
    if(Math.hypot(r.tx-r.x,r.ty-r.y)<3*T){ r.state='wander'; }
    else { if(Math.hypot(r.tx-r.x,r.ty-r.y)>60*T){ const a=Math.atan2(r.ty-r.y,r.tx-r.x); slide(r,Math.cos(a)*r.speed*dt,Math.sin(a)*r.speed*dt); r.moving=true; r.phase+=dt*9; r.face=faceFromAng(a); }
      else { const a=Math.atan2(r.ty-r.y,r.tx-r.x), step=Math.min(40*T, Math.hypot(r.tx-r.x,r.ty-r.y)); moveRaiderTo(r, r.x+Math.cos(a)*Math.min(step,55*T), r.y+Math.sin(a)*Math.min(step,55*T), dt, .9); } }
  } else {
    if(r.idle>0){ r.idle-=dt; r.moving=false; return; }
    const R=r.state==='guard'?5:6, cx=r.state==='guard'?r.hx:r.x, cy=r.state==='guard'?r.hy:r.y;
    if(!r.wp){ for(let a=0;a<20;a++){ const tx=Math.floor(cx/T)+Math.floor(Math.random()*(R*2+1))-R, ty=Math.floor(cy/T)+Math.floor(Math.random()*(R*2+1))-R;
        if(inB(tx,ty)&&walk[idx(tx,ty)]){ r.wp={x:tx*T+8,y:ty*T+12}; break; } } if(!r.wp){ r.idle=1; return; } r.path=null; }
    moveRaiderTo(r,r.wp.x,r.wp.y,dt,.55);
    if(Math.hypot(r.wp.x-r.x,r.wp.y-r.y)<6){ r.wp=null; r.idle=1+Math.random()*3; }
  }
  for(const o of raiders) if(o!==r){ const sx=r.x-o.x, sy=r.y-o.y, sd=Math.hypot(sx,sy); if(sd>0 && sd<10) slide(r,sx/sd*.6,sy/sd*.6); }
}
// survivors
function updateNPCs(dt){
  for(const n of npcs){
    if(n.dead){ continue; }
    const dP=Math.hypot(player.x-n.x,player.y-n.y);
    n.active = dP<70*T || n.role==='member';
    if(!n.active){ if(n.temp && dP>120*T) n.gone=true; continue; }
    if(n.hurtT>0) n.hurtT-=dt; if(n.swingT>0) n.swingT-=dt; n.cd=Math.max(0,n.cd-dt);
    if(n.state==='tower'){ const tw=objs.includes(n.tower)?n.tower:null; if(!tw){ n.state='guard'; continue; }
      n.x=tw.x*T+16; n.y=tw.y*T+20; const f=nearestFoe(n,12*T); if(f && n.cd<=0){ n.cd=1.6+Math.random(); const miss=Math.random()<.35; tracers.push({x1:n.x,y1:n.y-36,x2:f.x+(miss?12:0),y2:f.y-9,t:.07}); if(!miss) hitPerson(f,22,n,Math.atan2(f.y-n.y,f.x-n.x),4); }
      continue; }
    let foe = n.role==='trader' && n.state!=='hostile' ? nearestFoe(n,6*T) : nearestFoe(n, (n.role==='member'?11:8)*T);
    if(n.state==='hostile' && !foe && dP<10*T && !driving) foe=player;
    if(foe){ n.foe=foe; const busy=personWeaponAttack(n,foe,dt); if(!busy && n.role!=='trader') npcMove(n,foe.x,foe.y,dt,1); else { n.moving=false; } continue; }
    if(n.hp<n.max*.35 && n.state!=='hostile'){ n.hp=Math.min(n.max,n.hp+dt*.5); }
    if(n.role==='member' && n.state==='follow'){ if(dP>3*T) npcMove(n,player.x,player.y,dt, dP>8*T?1.3:1); else n.moving=false; if(dP>45*T){ const sp=openSpot(player.x,player.y,3); if(sp){ n.x=sp[0]; n.y=sp[1]; } } continue; }
    if((n.role==='citizen'||n.patrol) && npcs.streets){ if(!n.wp){ const st=npcs.streets[Math.floor(Math.random()*npcs.streets.length)]; if(Math.hypot(st[0]*T-n.x,st[1]*T-n.y)<(n.patrol?40:18)*T) n.wp={x:st[0]*T+8,y:st[1]*T+12}; }
      if(n.wp){ npcMove(n,n.wp.x,n.wp.y,dt,n.patrol?.6:.45); if(Math.hypot(n.wp.x-n.x,n.wp.y-n.y)<6){ n.wp=null; n.moving=false; } } continue; }
    if(n.role==='lord'||n.post){ n.moving=false; n.face='down'; continue; }
    if(n.role==='wanderer' && n.state==='travel'){ npcMove(n,n.tx,n.ty,dt,.7); if(Math.hypot(n.tx-n.x,n.ty-n.y)<2*T) n.state='idle'; continue; }
    // idle near home
    n.t-=dt; if(n.t<=0){ n.t=2+Math.random()*4; if(n.role==='trader'){ n.wp=null; } else { const R=n.role==='member'?4:3; n.wp={x:n.hx+(Math.random()-.5)*R*2*T, y:n.hy+(Math.random()-.5)*R*2*T}; } }
    if(n.wp){ npcMove(n,n.wp.x,n.wp.y,dt,.45); if(Math.hypot(n.wp.x-n.x,n.wp.y-n.y)<5) n.wp=null; } else { n.moving=false; if(n.role==='trader' && dP<5*T) n.face=faceFromAng(Math.atan2(player.y-n.y,player.x-n.x)); }
  }
  npcs=npcs.filter(n=>!n.gone);
}
function npcMove(n,gx,gy,dt,mul){
  const ntx=Math.floor(n.x/T), nty=Math.floor((n.y-3)/T); n.pathT-=dt;
  if(Math.hypot(gx-n.x,gy-n.y)>60*T){ const a=Math.atan2(gy-n.y,gx-n.x); slide(n,Math.cos(a)*40*mul*dt,Math.sin(a)*40*mul*dt); n.moving=true; n.phase+=dt*9; n.face=faceFromAng(a); return; }
  if(n.pathT<=0 || !n.path){ n.path=bfs(ntx,nty,Math.floor(gx/T),Math.floor((gy-3)/T)); n.pathT=.5+Math.random()*.3; }
  let tx=gx, ty=gy; if(n.path && n.path.length){ if(n.path[0].x===ntx&&n.path[0].y===nty) n.path.shift(); if(n.path.length){ tx=n.path[0].x*T+8; ty=n.path[0].y*T+12; } }
  const di=idx(Math.floor(tx/T),Math.floor((ty-3)/T)), door=doors.get(di); if(door && !door.open && Math.hypot(tx-n.x,ty-n.y)<24){ door.open=true; }
  let vx=tx-n.x, vy=ty-n.y; const L=Math.hypot(vx,vy); if(L<0.6){ n.moving=false; return; }
  vx/=L; vy/=L; const sp=Math.min(L,40*mul*dt); slide(n,vx*sp,vy*sp); n.moving=true; n.phase+=dt*9*mul; n.face=faceFromAng(Math.atan2(vy,vx));
}
function drawNPC(g,n,sx,sy){
  let a; if(n.wind>0) a=n.aimAng-1.3; else if(n.swingT>0) a=n.aimAng-1.3+2.6*(1-n.swingT/.2); else if(n.foe&&WEAPONS[n.weapon]&&WEAPONS[n.weapon].ranged) a=n.aimAng||0; else a=FACE_ANG[n.face]+0.9;
  const yy = n.state==='tower' ? sy-26 : sy;
  drawHuman(g,sx,yy,{face:n.face,phase:n.phase,moving:n.moving,look:n.look,flash:n.hurtT>0,weapon:n.weapon,wAng:a,head:n.role==='guard'?'nasal':n.look.crown?'crown':null,body:n.role==='guard'?'mail':null});
  const col = n.state==='hostile' ? '#e05a3a' : n.role==='guard' ? '#6ab0ff' : n.role==='lord' ? '#ffd84a' : n.role==='trader' ? '#e8c050' : '#a8c8e8';
  g.fillStyle=col; g.fillRect(sx-1,yy-27,3,2);
  if(n.hp<n.max){ g.fillStyle='#000'; g.fillRect(sx-6,yy-31,12,3); g.fillStyle='#6ad06a'; g.fillRect(sx-5,yy-30,Math.max(0,Math.round(10*n.hp/n.max)),1); }
}
function npcNear(){ let best=null, bd=22; for(const n of npcs){ if(n.dead||!n.active) continue; const d=Math.hypot(n.x-player.x,n.y-player.y); if(d<bd){ bd=d; best=n; } } return best; }
function talkTo(n){
  const say=a=>a[Math.floor(Math.random()*a.length)];
  const role = n.role==='wanderer' ? (n.recruitable?'recruit':'loner') : n.role==='loner' ? (n.recruitable?'recruit':'loner') : n.role;
  const acts=[[`"${say(LINES[role]||LINES.loner)}"`,null]];
  if(n.state==='hostile'){ openActions(n.name, [['They want you dead.',null]]); return; }
  if(n.role==='trader'){ n.met=true; acts.push(['Trade', ()=>openTrade(n)]); }
  if((n.role==='loner'||n.role==='wanderer') && n.recruitable){
    const food=['beans','meat_cooked','fish_cooked','chips'].find(hasItem), water=hasItem('water');
    const law=player.professions.includes('lawyer');
    acts.push([law ? 'Invite them to join your community (persuade)' : `Invite them to join you (give food + water${food&&water?'':' — you don\'t have both'})`, ()=>{
      if(!law){ if(!(food&&water)){ toast(`${n.name}: "Words are cheap. Food and water aren't."`); return; } takeItem(food,1); takeItem('water',1); }
      n.role='member'; n.state='follow'; n.temp=false; n.max=80; n.hp=Math.max(n.hp,60); toast(`${n.name} joins your community. Tell them where to stand guard.`); }]);
  }
  if(n.role==='member'){
    acts.push(['Follow me', ()=>{ n.state='follow'; toast(`${n.name} follows you.`); }]);
    acts.push(['Guard this spot', ()=>{ n.state='guard'; n.hx=player.x; n.hy=player.y; toast(`${n.name} will guard here.`); }]);
    const tw=objs.find(o=>o.type==='tower'&&Math.hypot(o.x*T+16-player.x,o.y*T+16-player.y)<4*T&&!npcs.some(m=>m.tower===o&&m.state==='tower'));
    if(tw) acts.push(['Man the watchtower', ()=>{ n.state='tower'; n.tower=tw; toast(`${n.name} climbs the tower.`); }]);
    acts.push([`Give them your ${WEAPONS[player.weapon].name.toLowerCase()}`, ()=>{ if(player.weapon==='fists'){ toast('You have nothing to give.'); return; } const w=player.weapon; takeItem(w,1); if(!hasItem(w)) player.weapon='fists'; if(n.weapon && n.weapon!=='fists') addItem(n.weapon,1); n.weapon=w; toast(`${n.name} takes the ${ITEMS[w].name.toLowerCase()}.`); }]);
    acts.push(['Part ways', ()=>{ n.role='loner'; n.recruitable=true; n.state='idle'; n.hx=n.x; n.hy=n.y; toast(`${n.name} goes their own way.`); }]);
  }
  openActions(`${n.name} — ${n.role==='member'?'community':n.role==='trader'?'trader':'survivor'}`, acts);
}
// ---------------- trading ----------------
let tradeWith=null;
function openTrade(n){ tradeWith=n; closePanels('trade'); document.getElementById('trade-panel').style.display='flex'; renderTrade(); }
function closeTrade(){ tradeWith=null; document.getElementById('trade-panel').style.display='none'; }
function renderTrade(){
  const n=tradeWith; if(!n) return; const m=(player.mods.tradePrice||1);
  document.getElementById('trade-title').textContent=`TRADING WITH ${n.name.toUpperCase()}`;
  document.getElementById('trade-cash').textContent=`Your cash: $${countItem('cash')}`;
  const L=document.getElementById('trade-buy'), R=document.getElementById('trade-sell'); L.innerHTML=''; R.innerHTML='';
  for(const s of n.stock){ if(!s.qty) continue; const pr=Math.ceil(priceOf(s.id)*m);
    const row=document.createElement('div'); row.className='trow'; row.innerHTML=`<img src="${ICONS[s.id]}" alt=""><span>${ITEMS[s.id].name} <small>×${s.qty}</small></span><b>$${pr}</b>`;
    const b=document.createElement('button'); b.textContent='Buy'; b.disabled=countItem('cash')<pr;
    b.onclick=()=>{ if(countItem('cash')<pr) return; if(addItem(s.id,1)){ toast('Bags full.'); return; } takeItem('cash',pr); s.qty--; renderTrade(); }; row.appendChild(b); L.appendChild(row); }
  const seen=new Set();
  for(const s of inv){ if(!s||s.id==='cash'||seen.has(s.id)) continue; seen.add(s.id); const pr=Math.max(1,Math.floor(priceOf(s.id)*(ITEMS[s.id].value?.8:.45)/m));
    const row=document.createElement('div'); row.className='trow'; row.innerHTML=`<img src="${ICONS[s.id]}" alt=""><span>${ITEMS[s.id].name} <small>×${countItem(s.id)}</small></span><b>$${pr}</b>`;
    const b=document.createElement('button'); b.textContent='Sell';
    b.onclick=()=>{ takeItem(s.id,1); if(player.weapon===s.id&&!hasItem(s.id)) player.weapon='fists'; addItem('cash',pr); const st=n.stock.find(x=>x.id===s.id); if(st) st.qty++; else n.stock.push({id:s.id,qty:1}); renderTrade(); }; row.appendChild(b); R.appendChild(row); }
}
// ---------------- defenses: fences, code-lock gates, watchtowers ----------------
function drawTower(g,o,sx,sy,now){
  const P=(a,b,w,h,c)=>{ g.fillStyle=c; g.fillRect(sx+a,sy+b,w,h); };
  P(2,-30,3,60,'#5a4028'); P(27,-30,3,60,'#5a4028'); P(2,-30,1,60,'#6e5232'); P(27,-30,1,60,'#4a3420');
  for(let k=0;k<4;k++){ P(4,-20+k*12,24,2,'#4a3420'); }
  for(let k=0;k<5;k++){ P(9+k,0+k*5,1,1,'#3a2a1a'); }
  P(-1,-44,34,16,'#6e5232'); P(-1,-44,34,2,'#8a6a44'); for(let x=0;x<34;x+=4) P(-1+x,-44,1,16,'#5a4028');
  P(-1,-30,34,2,'#4a3420'); P(1,-48,30,4,'#5a4028'); P(1,-48,30,1,'#7a5a3a');
}
function drawGate(g,d,sx,sy){
  const horiz = tileAt(d.x-1,d.y)===TL.FENCE || tileAt(d.x+1,d.y)===TL.FENCE || isWallish(d.x-1,d.y) || isWallish(d.x+1,d.y);
  g.fillStyle='#3a3e42';
  if(horiz){ if(!d.open){ g.fillRect(sx,sy-2,T,2); g.fillRect(sx,sy+9,T,2); for(let k=1;k<T;k+=3) g.fillRect(sx+k,sy-2,1,13); g.fillStyle='#5a6068'; g.fillRect(sx,sy-2,T,1); }
    else { g.fillRect(sx,sy-2,2,13); g.fillRect(sx+T-2,sy-2,2,13); }
    if(d.code){ g.fillStyle='#2a2a2a'; g.fillRect(sx+7,sy+2,3,4); g.fillStyle=d.open?'#5ad05a':'#d05a3a'; g.fillRect(sx+8,sy+3,1,1); } }
  else { if(!d.open){ g.fillRect(sx+6,sy-6,2,T+4); g.fillRect(sx+9,sy-6,2,T+4); for(let k=-5;k<T-2;k+=3) g.fillRect(sx+6,sy+k,5,1); } else { g.fillRect(sx+6,sy-6,5,2); g.fillRect(sx+6,sy+T-4,5,2); }
    if(d.code){ g.fillStyle=d.open?'#5ad05a':'#d05a3a'; g.fillRect(sx+11,sy+4,1,1); } }
}
function askCode(title, cb){
  let code='';
  const keypad=()=>{ const acts=[[`Code: ${code.padEnd(4,'·')}`,null]];
    const row=document.createElement('div');
    openActions(title, acts);
    const L=document.getElementById('act-list'); const grid=document.createElement('div'); grid.className='keypad';
    for(const k of ['1','2','3','4','5','6','7','8','9','⌫','0','OK']){ const b=document.createElement('button'); b.textContent=k;
      b.addEventListener('pointerdown',e=>{ e.stopPropagation(); e.preventDefault(); if(k==='⌫') code=code.slice(0,-1); else if(k==='OK'){ if(code.length===4){ closeActions(); cb(code); return; } } else if(code.length<4) code+=k; keypad(); });
      grid.appendChild(b); }
    L.appendChild(grid); };
  keypad();
}

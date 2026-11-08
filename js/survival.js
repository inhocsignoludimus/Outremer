'use strict';
// =====================================================================
// AFTER LIGHT — survival layer: thirst, sickness, body parts (limb damage,
// bleeding, splints), wildlife & hunting, campfires, water and fishing.
// =====================================================================
const PARTS=['head','torso','larm','rarm','lleg','rleg'];
const PART_NAMES={head:'Head',torso:'Torso',larm:'Left arm',rarm:'Right arm',lleg:'Left leg',rleg:'Right leg'};
function freshBody(){ const L={}, B={}, S={}; for(const p of PARTS){ L[p]=100; B[p]=0; S[p]=0; } return {limbs:L, bleed:B, splint:S}; }
function rollPart(pref){
  if(pref==='legs') return Math.random()<.5?'lleg':'rleg';
  const r=Math.random()*100;
  return r<12?'head':r<52?'torso':r<64?'larm':r<76?'rarm':r<88?'lleg':'rleg';
}
function partArmor(part){
  const e=player.equip;
  if(part==='head') return e.head ? Math.min(.6, WEAR[e.head].armor*2.4) : 0;
  if(part==='torso') return e.body ? Math.min(.7, WEAR[e.body].armor*1.8) : 0;
  if((part==='larm'||part==='rarm') && e.body==='vest_heavy') return .1;
  return 0;
}
function crippled(p){ return player.limbs[p]<=0; }
function legFactor(){ const n=(crippled('lleg')?1:0)+(crippled('rleg')?1:0), pk=player.painkill>0;
  let f = n===2 ? .45 : n===1 ? .7 : 1; if(pk) f=Math.min(1,f+.15);
  const avg=(player.limbs.lleg+player.limbs.rleg)/200; return f*(0.85+0.15*avg); }
function armFactor(){ const n=(crippled('larm')?1:0)+(crippled('rarm')?1:0), pk=player.painkill>0; let f = n===2 ? .5 : n===1 ? .72 : 1; if(pk) f=Math.min(1,f+.12); return f; }
// every hit lands somewhere
function hurtPlayer(dmg,src,part,blunt){
  if(!player) return;
  part = part || rollPart();
  const ar=partArmor(part); dmg*=1-ar;
  player.health-=dmg; player.hurtT=.35; shake=Math.max(shake,4); search=null;
  const before=player.limbs[part];
  player.limbs[part]=Math.max(0,player.limbs[part]-dmg*2.4);
  if(before>0 && player.limbs[part]<=0){ player.splint[part]=0;
    toast(part==='head'?'Concussion! Your vision swims.':part==='torso'?'Broken ribs — every breath hurts.':`Your ${PART_NAMES[part].toLowerCase()} is broken! It needs a splint.`); }
  if(!blunt && Math.random()<(ar>0.3?.12:.38) && !player.bleed[part]){ player.bleed[part]=1; toast(`You're bleeding — ${PART_NAMES[part].toLowerCase()}.`); }
  else if(blunt && Math.random()<.1 && !player.bleed[part]) player.bleed[part]=1;
  if(src){ const a=Math.atan2(player.y-src.y,player.x-src.x); blood(player.x,player.y-10,a,7); slide(player,Math.cos(a)*5,Math.sin(a)*5); }
  if(player.health<=0 && player.cause!=='thirst') player.cause = src&&src.animal ? 'animal' : 'raiders';
  if(bodyOpen()) renderBody();
}
function tickBody(dt,running_){
  const p=player;
  // thirst & hunger
  const sickMul = p.sick>0 ? 1.5 : 1;
  p.thirst=Math.max(0,p.thirst-dt*0.24*(running_?1.6:1)*sickMul);
  if(p.thirst<=0){ p.health-=dt*0.7; if(p.health<=0) p.cause='thirst'; }
  if(p.sick>0){ p.sick-=dt; p.health-=dt*0.06; if(Math.random()<dt/25) toast(['Your stomach cramps.','You feel feverish.','Nausea rolls over you.'][Math.floor(Math.random()*3)]); if(p.sick<=0) toast('The sickness has passed.'); if(p.health<=0) p.cause='sick'; }
  if(p.painkill>0) p.painkill-=dt;
  // bleeding
  let bl=0; for(const k of PARTS) if(p.bleed[k]) bl++;
  if(bl){ p.health-=dt*0.3*bl; p.dripT=(p.dripT||0)+dt; if(p.dripT>.6){ p.dripT=0; addDecal(p.x+(Math.random()-.5)*6,p.y-1,'#4a0f0b',1); } if(p.health<=0) p.cause='bled'; }
  // slow natural healing when fed and watered
  if(p.hunger>40 && p.thirst>40 && !bl){ for(const k of PARTS) if(p.limbs[k]>0 && p.limbs[k]<100) p.limbs[k]=Math.min(100,p.limbs[k]+dt*0.08*(p.splint[k]?1.6:1)); }
}
// ---------------- medical items ----------------
function applyMedical(id, part){
  const p=player;
  if(id==='bandage'){
    let tgt = part && p.bleed[part] ? part : PARTS.filter(k=>p.bleed[k]).sort((a,b)=>p.limbs[a]-p.limbs[b])[0];
    if(tgt){ p.bleed[tgt]=0; p.limbs[tgt]=Math.min(100,p.limbs[tgt]+10); p.health=Math.min(p.maxHealth,p.health+6*mod('healPower'));
      const saved=Math.random()>mod('medCost'); return {msg:`Bandaged the ${PART_NAMES[tgt].toLowerCase()} — bleeding stopped.${saved?' (supplies saved)':''}`,consume:!saved}; }
    tgt = part || PARTS.filter(k=>p.limbs[k]>0).sort((a,b)=>p.limbs[a]-p.limbs[b])[0];
    if(p.health>=p.maxHealth && p.limbs[tgt]>=100) return {msg:'You are not hurt.',consume:false};
    p.limbs[tgt]=Math.min(100,Math.max(p.limbs[tgt], 0)+18); p.health=Math.min(p.maxHealth,p.health+12*mod('healPower'));
    return {msg:`You wrap the ${PART_NAMES[tgt].toLowerCase()}.`,consume:true};
  }
  if(id==='splint'){
    const tgt = part && crippled(part) && part!=='head' && part!=='torso' ? part : ['lleg','rleg','larm','rarm'].find(k=>crippled(k));
    if(!tgt) return {msg: part ? `Your ${PART_NAMES[part].toLowerCase()} isn't broken.` : 'No broken limbs to splint.', consume:false};
    p.limbs[tgt]=35; p.splint[tgt]=1; return {msg:`Splinted the ${PART_NAMES[tgt].toLowerCase()}. Give it time.`,consume:true};
  }
  if(id==='firstaid'){
    const any=PARTS.some(k=>p.bleed[k]||p.limbs[k]<100)||p.health<p.maxHealth; if(!any) return {msg:'You are not hurt.',consume:false};
    for(const k of PARTS){ p.bleed[k]=0; if(p.limbs[k]<=0 && (k==='head'||k==='torso')) p.limbs[k]=30; else if(p.limbs[k]>0) p.limbs[k]=Math.min(100,p.limbs[k]+35); }
    p.health=Math.min(p.maxHealth,p.health+40*mod('healPower')); const saved=Math.random()>mod('medCost');
    return {msg:`You patch yourself up properly.${saved?' (supplies saved)':''}`,consume:!saved};
  }
  if(id==='pills'){ p.painkill=90; p.health=Math.min(p.maxHealth,p.health+4); return {msg:'The pain dulls. Injuries bother you less for a while.',consume:true}; }
  return {msg:'',consume:false};
}
// ---------------- water ----------------
function waterNear(maxD=1.6){
  const px=player.x, py=player.y-4; let best=null, bd=1e9;
  for(let dy=-2;dy<=2;dy++) for(let dx=-2;dx<=2;dx++){ const tx=Math.floor(px/T)+dx, ty=Math.floor(py/T)+dy; if(!inB(tx,ty)) continue; const t=map[idx(tx,ty)];
    if(t!==TL.WATER&&t!==TL.SEA) continue; const d=Math.hypot(tx*T+8-px,ty*T+8-py)/T; if(d<=maxD && d<bd){ bd=d; best={tx,ty,sea:t===TL.SEA,pool:bld[idx(tx,ty)]<0&&regionId[idx(tx,ty)]!==255&&t===TL.WATER}; } }
  return best;
}
function drink(amount, clean, msg){
  player.thirst=Math.min(100,player.thirst+amount);
  if(!clean && Math.random()<.35){ player.sick=Math.max(player.sick,70+Math.random()*60); toast(msg+' It tasted off...'); }
  else toast(msg);
}
// ---------------- wildlife ----------------
let animals=[], animalT=0;
const ANIMALS={
  deer:  { name:'Deer',   hp:45, speed:62, flee:true,  sight:7, meat:4, hide:2, w:16 },
  rabbit:{ name:'Rabbit', hp:10, speed:70, flee:true,  sight:5, meat:1, hide:1, w:7 },
  boar:  { name:'Boar',   hp:75, speed:54, aggro:true, sight:6, meat:5, hide:2, w:15, dmg:13 },
};
function spawnAnimal(){
  const ptx=Math.floor(player.x/T), pty=Math.floor(player.y/T);
  for(let a=0;a<60;a++){
    const ang=Math.random()*6.283, d=18+Math.random()*24, tx=Math.round(ptx+Math.cos(ang)*d), ty=Math.round(pty+Math.sin(ang)*d);
    if(!inB(tx,ty)) continue; const i=idx(tx,ty), t=map[i];
    if(!walk[i] || bld[i]>=0 || (t!==TL.FOREST && t!==TL.GRASS && t!==TL.FIELD)) continue;
    if(regionId[i]!==255 && Math.random()<.85) continue;
    const r=Math.random(); const kind = t===TL.FOREST ? (r<.45?'deer':r<.78?'rabbit':'boar') : (r<.7?'rabbit':'deer');
    const A=ANIMALS[kind];
    animals.push({kind,x:tx*T+8,y:ty*T+12,hp:A.hp,face:Math.random()<.5?-1:1,phase:0,moving:false,state:'wander',t:Math.random()*3,vx:0,vy:0,hurtT:0,cd:0});
    return true;
  }
  return false;
}
function animalAlert(x,y,radius){ for(const a of animals){ const d=Math.hypot(a.x-x,a.y-y); if(d<radius){ const A=ANIMALS[a.kind]; if(A.flee){ a.state='flee'; a.t=4+Math.random()*2; } else if(A.aggro && d<radius*.6){ a.state='charge'; a.t=8; } } } }
function updateAnimals(dt){
  animalT+=dt;
  const near=animals.filter(a=>Math.hypot(a.x-player.x,a.y-player.y)<60*T).length;
  if(animalT>4){ animalT=0; if(near<9 && Math.random()<.8) spawnAnimal(); }
  for(const a of [...animals]){
    const A=ANIMALS[a.kind], dx=player.x-a.x, dy=player.y-a.y, d=Math.hypot(dx,dy);
    if(d>75*T){ animals.splice(animals.indexOf(a),1); continue; }
    if(a.hurtT>0) a.hurtT-=dt; a.cd=Math.max(0,a.cd-dt);
    const sees = d<A.sight*T*(darkness(time)>.4?.6:1) && !driving;
    const loud = (keys.shift||runHeld) && player.moving && d<A.sight*T*1.4;
    if(A.flee && (sees||loud) && a.state!=='flee' && !player.crouch){ a.state='flee'; a.t=4+Math.random()*2; }
    if(A.aggro && sees && d<5*T && a.state!=='charge'){ a.state='charge'; a.t=7; }
    let mx=0,my=0,sp=A.speed*.35;
    if(a.state==='flee'){ a.t-=dt; mx=-dx/d; my=-dy/d; mx+= (Math.random()-.5)*.6; sp=A.speed*1.25; if(a.t<=0) a.state='wander'; }
    else if(a.state==='charge'){ a.t-=dt; mx=dx/d; my=dy/d; sp=A.speed*1.35;
      if(d<15 && a.cd<=0){ a.cd=1.3; hurtPlayer(A.dmg*(0.8+Math.random()*.4),{x:a.x,y:a.y,animal:true},rollPart('legs')); }
      if(a.t<=0 || d>12*T){ a.state='wander'; a.t=2; } }
    else { a.t-=dt; if(a.t<=0){ a.t=1.5+Math.random()*3; const r=Math.random(); if(r<.45){ a.vx=0; a.vy=0; } else { const an=Math.random()*6.283; a.vx=Math.cos(an); a.vy=Math.sin(an); } } mx=a.vx; my=a.vy; }
    const L=Math.hypot(mx,my);
    if(L>0.05){ mx/=L; my/=L; const ox=a.x, oy=a.y;
      const nx=a.x+mx*sp*dt; if(boxFree(nx,a.y) && !isWaterAt(nx,a.y-3)) a.x=nx; const ny=a.y+my*sp*dt; if(boxFree(a.x,ny) && !isWaterAt(a.x,ny-3)) a.y=ny;
      a.moving = Math.hypot(a.x-ox,a.y-oy)>0.01; if(Math.abs(mx)>.2) a.face=mx>0?1:-1; a.phase+=dt*(sp/6);
      if(!a.moving && a.state==='wander') a.t=0; }
    else a.moving=false;
  }
}
function damageAnimal(a,dmg,ang){
  if(!animals.includes(a)) return;
  a.hp-=dmg; a.hurtT=.12; blood(a.x,a.y-5,ang,5);
  const A=ANIMALS[a.kind]; if(A.aggro){ a.state='charge'; a.t=8; } else { a.state='flee'; a.t=5; }
  if(a.hp<=0){
    animals.splice(animals.indexOf(a),1);
    let tx=Math.floor(a.x/T), ty=Math.floor((a.y-3)/T);
    if(inB(tx,ty) && !objGrid[idx(tx,ty)] && !doors.has(idx(tx,ty))) addObj({type:'carcass',kind:a.kind,x:tx,y:ty,solid:false,container:'carcass',dir:a.face,sortY:ty*T+2});
    for(let i=0;i<6;i++) addDecal(a.x+(Math.random()-.5)*10, a.y-2+(Math.random()-.5)*6, Math.random()<.5?'#4a0f0b':'#3a0c09', 1);
    toast(`${A.name} down. Butcher it with a blade.`);
  }
}
function drawAnimal(g,a,sx,sy){
  const f=a.face, step=a.moving?Math.round(Math.sin(a.phase)):0, hit=a.hurtT>0;
  const P=(x,y,w,h,c)=>{ g.fillStyle=hit?'#fff':c; g.fillRect(sx+(f>0?x:-x-w),sy+y,w,h); };
  if(a.kind==='deer'){
    P(-7,-1-Math.max(0,step),2,5,'#5a3a22'); P(-5,-1-Math.max(0,-step),2,5,'#6a4628'); P(3,-1-Math.max(0,-step),2,5,'#5a3a22'); P(5,-1-Math.max(0,step),2,5,'#6a4628');
    P(-8,-9,15,8,'#8a5a34'); P(-8,-9,15,2,'#9a6a40'); P(-7,-3,13,2,'#c8a87a'); P(-9,-9,2,3,'#e8dcc8');
    P(5,-14,3,7,'#8a5a34'); P(6,-16,5,4,'#8a5a34'); P(10,-15,1,1,'#1a1410'); P(9,-14,2,1,'#3a2a1a'); P(6,-19,1,3,'#c8b48a'); P(8,-20,1,4,'#c8b48a'); P(7,-21,1,1,'#c8b48a');
  } else if(a.kind==='rabbit'){
    const hop=a.moving?Math.abs(step)*2:0;
    P(-3,-5-hop,6,4,'#8a7a62'); P(-3,-5-hop,6,1,'#9a8a72'); P(2,-7-hop,3,3,'#8a7a62'); P(3,-10-hop,1,3,'#7a6a52'); P(4,-6-hop,1,1,'#1a1410'); P(-4,-5-hop,2,2,'#e8e0d0'); P(-2,-1-hop,4,1,'#6a5a42');
  } else {
    P(-6,-1-Math.max(0,step),2,4,'#2a2420'); P(-3,-1-Math.max(0,-step),2,4,'#2a2420'); P(2,-1-Math.max(0,-step),2,4,'#2a2420'); P(4,-1-Math.max(0,step),2,4,'#2a2420');
    P(-7,-9,14,8,'#4a3a30'); P(-7,-9,14,1,'#5a4a3e'); for(let k=-5;k<5;k+=2) P(k,-10,1,2,'#3a2a20');
    P(6,-8,4,5,'#4a3a30'); P(10,-6,2,3,'#6a5048'); P(8,-7,1,1,'#1a1410'); P(9,-4,2,1,'#e8dcc8');
  }
}
function drawCarcass(g,o,sx,sy){
  const P=(x,y,w,h,c)=>{ g.fillStyle=c; g.fillRect(sx+(o.dir>0?x:16-x-w),sy+y,w,h); };
  if(o.searched){ P(3,9,10,4,'#5a1a14'); P(4,10,8,2,'#d8ccb8'); return; }
  if(o.kind==='deer'){ P(1,8,14,6,'#8a5a34'); P(1,12,14,2,'#c8a87a'); P(13,6,3,4,'#8a5a34'); P(3,13,2,3,'#5a3a22'); P(9,13,2,3,'#5a3a22'); P(4,9,6,2,'#6a1a14'); }
  else if(o.kind==='rabbit'){ P(5,10,6,3,'#8a7a62'); P(10,9,2,3,'#7a6a52'); P(6,12,3,1,'#6a1a14'); }
  else { P(1,8,14,6,'#4a3a30'); P(13,8,3,4,'#4a3a30'); P(4,13,2,3,'#2a2420'); P(10,13,2,3,'#2a2420'); P(5,9,6,2,'#6a1a14'); }
}
function hasBlade(){ return ['knife','fire_axe','hatchet','spear'].some(hasItem); }
function hasAxe(){ return hasItem('fire_axe')||hasItem('hatchet'); }
function butcher(o){
  const A=ANIMALS[o.kind]; o.searched=true;
  const meat=A.meat+Math.floor(Math.random()*2), hide=A.hide;
  const l1=addItem('meat_raw',meat), l2=addItem('hide',hide);
  toast(`Butchered the ${A.name.toLowerCase()}: ${meat-l1} raw meat, ${hide-l2} hide.${l1||l2?' (bags full)':''}`);
}
// ---------------- fishing ----------------
function startFishing(){
  const w=waterNear(2.2);
  const inBoat = driving && VEH_KINDS[driving.kind].water;
  if(!w && !inBoat){ return {msg:'You need to be at the water\'s edge (or in a boat) to fish.',consume:false}; }
  if(driving && Math.abs(driving.sp)>5) return {msg:'Stop the boat first.',consume:false};
  search={fish:true, t:0, dur:4+Math.random()*6, sea: inBoat || (w&&w.sea), boat:inBoat};
  return {msg:'You cast the line...', consume:false};
}
function finishFishing(sr){
  const p = .5 + (sr.boat?.15:0) + (darkness(time)>.2&&darkness(time)<.8?.1:0);
  if(Math.random()<p){ const big=Math.random()<(sr.sea?.35:.2); const n=big?2:1; addItem('fish_raw',n); toast(big?'A big one! 2 raw fish.':'Caught a fish.'); }
  else toast(['Nothing bites.','It got away!','Just weeds.'][Math.floor(Math.random()*3)]);
}
// ---------------- campfire & camp objects ----------------
function campfireActions(o){
  const acts=[];
  if(!o.lit){ acts.push([`Light fire${hasItem('matches')?'':' (needs matches)'}`, ()=>{ if(!hasItem('matches')){ toast('You need matches.'); return; } if((o.fuel||0)<=0){ if(!hasItem('logs')){ toast('Add a log first.'); return; } takeItem('logs',1); o.fuel=(o.fuel||0)+150; } takeItem('matches',1); o.lit=true; o.light=true; o.seed=7; toast('The fire catches.'); }]); }
  else acts.push(['Put out the fire', ()=>{ o.lit=false; o.light=false; toast('Fire out.'); }]);
  acts.push([`Add a log (${countItem('logs')}) · fuel ${Math.round((o.fuel||0)/20)}h`, ()=>{ if(!hasItem('logs')){ toast('No logs. Chop a tree (Scrap in build mode) or search fallen logs.'); return; } takeItem('logs',1); o.fuel=(o.fuel||0)+150; toast('More wood on the fire.'); }]);
  const cookable=['meat_raw','fish_raw'].reduce((a,k)=>a+countItem(k),0), dirty=countItem('dirty_water');
  acts.push([`Cook food (${cookable})`, ()=>{ if(!o.lit){ toast('Light the fire first.'); return; } if(!cookable){ toast('Nothing raw to cook.'); return; }
    search={timed:()=>{ const m=countItem('meat_raw'), f=countItem('fish_raw'); takeItem('meat_raw',m); takeItem('fish_raw',f); if(m) addItem('meat_cooked',m); if(f) addItem('fish_cooked',f); toast(`Cooked ${m+f} portion(s). Smells incredible.`); }, t:0, dur:2+cookable*.6}; }]);
  acts.push([`Boil water (${dirty})`, ()=>{ if(!o.lit){ toast('Light the fire first.'); return; } if(!dirty){ toast('No dirty water. Fill an empty bottle at a river or lake.'); return; }
    search={timed:()=>{ const n=countItem('dirty_water'); takeItem('dirty_water',n); addItem('water',n); toast(`Boiled ${n} bottle(s). Safe to drink.`); }, t:0, dur:3+dirty*.5}; }]);
  return acts;
}
function tickCamp(dt){
  for(const o of campObjs){ if(o.type==='campfire' && o.lit){ o.fuel=(o.fuel||0)-dt; if(o.fuel<=0){ o.lit=false; o.light=false; o.fuel=0; } }
    if(o.type==='collector'){ const rate = 1/360; o.water=Math.min(3,(o.water||0)+dt*rate); } }
}
let campObjs=[];
// ---------------- body panel (inside the inventory) ----------------
function bodyOpen(){ return typeof invOpen!=='undefined' && invOpen; }
function partColor(p){ const v=player.limbs[p]; if(v<=0) return '#2a1010'; if(v<35) return '#b8362a'; if(v<70) return '#c8902e'; return '#5a9a4a'; }
function drawBodyFigure(cv,scale=1,sel){
  const g=cv.getContext('2d'); g.clearRect(0,0,cv.width,cv.height); g.imageSmoothingEnabled=false;
  const S=scale, P=(x,y,w,h,c)=>{ g.fillStyle=c; g.fillRect(x*S,y*S,w*S,h*S); };
  const shapes={ head:[[12,1,8,8]], torso:[[10,10,12,15]], larm:[[5,10,4,14],[4,24,4,3]], rarm:[[23,10,4,14],[24,24,4,3]], lleg:[[10,26,5,16],[9,42,6,2]], rleg:[[17,26,5,16],[17,42,6,2]] };
  for(const [p,rs] of Object.entries(shapes)){ for(const [x,y,w,h] of rs){ P(x-1,y-1,w+2,h+2,'#0a0807'); } }
  for(const [p,rs] of Object.entries(shapes)){ for(const [x,y,w,h] of rs) P(x,y,w,h,partColor(p));
    if(player.bleed[p]){ const [x,y,w,h]=rs[0]; P(x+Math.floor(w/2)-1,y+Math.floor(h/2)-1,2,3,'#ff3a2a'); P(x+Math.floor(w/2)-1,y+Math.floor(h/2)+3,1,2,'#ff3a2a'); }
    if(player.splint[p] && player.limbs[p]<100){ const [x,y,w,h]=rs[0]; P(x-1,y+3,w+2,1,'#d8c8a0'); P(x-1,y+h-4,w+2,1,'#d8c8a0'); }
    if(sel===p){ const [x,y,w,h]=rs[0]; g.strokeStyle='#ffe08a'; g.lineWidth=Math.max(1,S/2); g.strokeRect((x-1.5)*S,(y-1.5)*S,(w+3)*S,(h+3)*S); } }
  if(player.equip.head){ P(11,0,10,3,WEAR[player.equip.head].col); }
  if(player.equip.body){ g.globalAlpha=.55; P(10,11,12,12,WEAR[player.equip.body].col); g.globalAlpha=1; }
}
const BODY_HIT={ head:[11,0,10,10], torso:[9,9,14,17], larm:[3,9,7,19], rarm:[22,9,7,19], lleg:[9,25,7,20], rleg:[16,25,7,20] };
let bodySel=null;
function renderBody(){
  const cv=document.getElementById('body-cv'); if(!cv) return;
  drawBodyFigure(cv,4,bodySel);
  const p=player, st=[];
  const vit=(n,v,c)=>`<div class="vit"><span>${n}</span><div class="bar"><div style="width:${Math.max(0,Math.min(100,v))}%;background:${c}"></div></div><b>${Math.round(v)}</b></div>`;
  let html=vit('Health',p.health/p.maxHealth*100,'#b8433a')+vit('Thirst',p.thirst,'#4a8ac8')+vit('Hunger',p.hunger,'#c79a3e')+vit('Stamina',p.stamina/p.maxStamina*100,'#5b9a64');
  for(const k of PARTS){ if(p.bleed[k]) st.push(`<i class="bad">Bleeding · ${PART_NAMES[k]}</i>`); if(p.limbs[k]<=0) st.push(`<i class="bad">${k==='head'?'Concussion':k==='torso'?'Broken ribs':'Broken '+PART_NAMES[k].toLowerCase()}</i>`); else if(p.splint[k]&&p.limbs[k]<100) st.push(`<i>Splinted · ${PART_NAMES[k]}</i>`); }
  if(p.sick>0) st.push('<i class="bad">Food poisoning</i>');
  if(p.painkill>0) st.push('<i>Painkillers</i>');
  if(p.thirst<20) st.push('<i class="bad">Dehydrated</i>'); if(p.hunger<20) st.push('<i class="bad">Starving</i>');
  if(!st.length) st.push('<i class="ok">No injuries</i>');
  html+=`<div class="conds">${st.join('')}</div>`;
  if(bodySel){ const v=p.limbs[bodySel]; html+=`<div class="partinfo"><b>${PART_NAMES[bodySel]}</b> — ${v<=0?'broken':Math.round(v)+'%'}${p.bleed[bodySel]?' · bleeding':''}${partArmor(bodySel)?` · armour ${Math.round(partArmor(bodySel)*100)}%`:''}<br><small>Select a bandage, splint or first aid kit, then “Use on ${PART_NAMES[bodySel].toLowerCase()}”.</small></div>`; }
  document.getElementById('body-vitals').innerHTML=html;
}
function bodyClick(e){
  const cv=e.currentTarget, r=cv.getBoundingClientRect(), x=(e.clientX-r.left)/r.width*32, y=(e.clientY-r.top)/r.height*46;
  bodySel=null; for(const [p,[bx,by,bw,bh]] of Object.entries(BODY_HIT)) if(x>=bx&&x<bx+bw&&y>=by&&y<by+bh){ bodySel=p; break; }
  renderBody(); renderInvPanel();
}

'use strict';
// =====================================================================
// OUTREMER — animais por bioma, Domar Animais (skill), bichos que te seguem e lutam,
// montarias (cavalo, camelo, rena), tosquia de ovelhas e o cavalo do estábulo.
// =====================================================================
Object.assign(ANIMALS, {
  deer:{...ANIMALS.deer, name:'Cervo'}, rabbit:{...ANIMALS.rabbit, name:'Coelho'}, boar:{...ANIMALS.boar, name:'Javali'},
  horse:   { name:'Cavalo',  hp:90,  speed:70, flee:true,  sight:6, meat:5, hide:3, w:18, tame:30, mount:true },
  camel:   { name:'Camelo',  hp:110, speed:58, flee:true,  sight:6, meat:6, hide:3, w:18, tame:40, mount:true },
  reindeer:{ name:'Rena',    hp:80,  speed:66, flee:true,  sight:7, meat:4, hide:3, w:16, tame:35, mount:true },
  sheep:   { name:'Ovelha',  hp:30,  speed:40, flee:true,  sight:4, meat:3, hide:1, w:12, tame:0, wool:true },
  cow:     { name:'Vaca',    hp:70,  speed:36, flee:true,  sight:4, meat:7, hide:3, w:17, tame:10 },
  wolfp:   { name:'Lobo Cinzento', hp:60, speed:64, aggro:true, sight:7, meat:2, hide:2, w:14, dmg:10, tame:45, fight:true },
  bear:    { name:'Urso Pardo', hp:160, speed:50, aggro:true, sight:6, meat:8, hide:4, w:20, dmg:20, tame:60, fight:true },
});
ANIMALS.boar.tame=25; ANIMALS.deer.tame=20; ANIMALS.rabbit.tame=5;
const BIO_ANIMALS = { p:[['rabbit',3],['deer',2],['horse',2],['sheep',2],['cow',1]], f:[['deer',3],['rabbit',2],['boar',2],['wolfp',1],['bear',.6]], m:[['boar',1],['wolfp',1],['bear',.7],['deer',1]],
  n:[['reindeer',3],['wolfp',2],['rabbit',1]], s:[['boar',2],['rabbit',1]], c:[['rabbit',2],['sheep',1],['horse',1]], o:[['camel',3],['rabbit',1]], r:[['rabbit',1],['wolfp',1]] };
const NATURAL = new Set([TL.GRASS,TL.FOREST,TL.FIELD,TL.SNOW,TL.DUNE,TL.SWAMP,TL.DIRT,TL.SAND,TL.RUBBLE]);
spawnAnimal = function(){
  const ptx=Math.floor(player.x/T), pty=Math.floor(player.y/T);
  for(let a=0;a<60;a++){ const ang=Math.random()*6.283, d=18+Math.random()*24, tx=Math.round(ptx+Math.cos(ang)*d), ty=Math.round(pty+Math.sin(ang)*d);
    if(!inB(tx,ty)) continue; const i=idx(tx,ty); if(!walk[i]||bld[i]>=0||!NATURAL.has(map[i])||regionId[i]!==255) continue;
    const c=cellAt(tx,ty), pool=BIO_ANIMALS[c?c.b:'p']||BIO_ANIMALS.p; let t=pool.reduce((s,p)=>s+p[1],0)*Math.random(), kind=pool[0][0]; for(const [k,w] of pool){ t-=w; if(t<=0){ kind=k; break; } }
    const A=ANIMALS[kind]; animals.push({kind,x:tx*T+8,y:ty*T+12,hp:A.hp,face:Math.random()<.5?-1:1,phase:0,moving:false,state:'wander',t:Math.random()*3,vx:0,vy:0,hurtT:0,cd:0}); return true; }
  return false; };
// desenho dos novos bichos (de perfil, como os do After Light)
const _drawA = drawAnimal;
drawAnimal = function(g,a,sx,sy){
  if(a.tamed && a.kind && !a.mounted){ g.fillStyle='rgba(120,220,120,.5)'; g.fillRect(sx-4,sy+1,8,1); }
  const f=a.face||1, st=a.moving?Math.round(Math.sin(a.phase)):0, hit=a.hurtT>0, P=(x,y,w,h,c)=>{ g.fillStyle=hit?'#fff':c; g.fillRect(sx+(f>0?x:-x-w),sy+y,w,h); };
  const legs=(c,c2,h=6)=>{ P(-7,-h+1-Math.max(0,st),2,h,c); P(-5,-h+1-Math.max(0,-st),2,h,c2); P(4,-h+1-Math.max(0,-st),2,h,c); P(6,-h+1-Math.max(0,st),2,h,c2); };
  switch(a.kind){
    case 'horse': { const c=a.col||'#6a4428', d=darkHex(c,.7); legs(d,c,7); P(-8,-12,16,7,c); P(-8,-12,16,2,darkHex(c,1.15)); P(6,-18,4,8,c); P(8,-20,6,4,c); P(12,-18,2,2,d); P(11,-19,1,1,'#1a1410');
      P(5,-19,2,8,'#2a1a10'); P(-10,-11,2,7,'#2a1a10'); if(a.saddle!==false){ P(-3,-14,7,3,'#5a2a14'); P(-2,-15,5,1,'#8a6a3a'); } return; }
    case 'camel': { const c='#b8945a', d='#8a6a3a'; legs(d,c,8); P(-8,-14,16,7,c); P(-5,-18,5,4,c); P(1,-17,4,3,c); P(7,-20,3,10,c); P(8,-22,6,3,c); P(12,-21,1,1,'#1a1410'); P(-3,-13,8,2,'#7a3a2a'); return; }
    case 'reindeer': { const c='#7a6048', d='#5a4434'; legs(d,c,6); P(-8,-11,15,7,c); P(-8,-6,15,2,'#d8ccb8'); P(5,-16,3,7,c); P(6,-18,5,4,c); P(10,-17,1,1,'#1a1410');
      P(5,-23,1,5,'#c8b48a'); P(4,-25,3,1,'#c8b48a'); P(8,-24,1,6,'#c8b48a'); P(9,-26,3,1,'#c8b48a'); return; }
    case 'sheep': { const c=a.shorn?'#c8b8a0':'#e8e0d0'; legs('#2a2420','#3a3430',4); P(-6,-10,12,7,c); P(-6,-10,12,1,'#fff8e8'); P(5,-10,4,4,'#3a3430'); P(7,-9,1,1,'#e8e0d0'); return; }
    case 'cow': { legs('#3a3028','#4a4038',5); P(-8,-11,16,7,'#e8e0d0'); P(-4,-11,5,4,'#2a2420'); P(3,-8,4,3,'#2a2420'); P(7,-11,5,5,'#e8e0d0'); P(11,-8,2,2,'#d8a8a0'); P(8,-13,1,2,'#c8c0b0'); P(9,-10,1,1,'#1a1410'); return; }
    case 'wolfp': { const c='#6a6662', d='#4a4642'; legs(d,c,4); P(-7,-9,13,5,c); P(5,-11,5,5,c); P(9,-9,3,2,d); P(7,-13,1,2,d); P(9,-10,1,1,'#e8c050'); P(-10,-9,4,2,c); return; }
    case 'bear': { const c='#4a3424', d='#3a2618'; legs(d,c,5); P(-9,-13,17,9,c); P(-9,-13,17,2,'#5a4430'); P(7,-12,6,6,c); P(11,-9,3,2,d); P(8,-14,2,2,c); P(10,-11,1,1,'#1a1410'); return; }
  }
  return _drawA(g,a,sx,sy);
};
// ---------------- domar ----------------
let taming=null;
const MAX_PETS=2;
function animalNear(){ let best=null, bd=26; for(const a of animals){ const d=Math.hypot(a.x-player.x,a.y-player.y); if(d<bd){ bd=d; best=a; } } return best; }
const _intM = interact;
interact = function(){
  if(running && !search && !taming){ const a=animalNear();
    if(a && a.tamed){ const A=ANIMALS[a.kind], acts=[[`${a.name||A.name} — seu ${A.name.toLowerCase()} (${Math.round(a.hp)}/${A.hp})`,null]];
      if(A.mount) acts.push(['Montar', ()=>mountUp(a)]);
      acts.push([a.stay?'Seguir-me':'Ficar aqui', ()=>{ a.stay=!a.stay; toast(a.stay?`${A.name} fica aqui.`:`${A.name} te segue.`); }]);
      if(hasItem('bandage') && a.hp<A.hp) acts.push(['Tratar com bandagem (Veterinária)', ()=>{ takeItem('bandage',1); a.hp=Math.min(A.hp,a.hp+15+skill('veterinaria')/2); gainSkill('veterinaria',1); toast('Você trata o animal.'); }]);
      if(A.wool && !a.shorn && hasItem('scissors')) acts.push(['Tosquiar', ()=>shear(a)]);
      acts.push(['Libertar', ()=>{ a.tamed=false; a.state='flee'; a.t=3; toast(`${A.name} volta para o mato.`); }]); acts.push(['Fechar',null]);
      openActions(A.name, acts); return; }
    if(a){ const A=ANIMALS[a.kind];
      if(A.wool && !a.shorn && hasItem('scissors')){ shear(a); return; }
      if(A.tame!==undefined){ if(animals.filter(x=>x.tamed).length + (player.mount?1:0) >= MAX_PETS){ toast('Você já controla animais demais (máximo 2).'); return; }
        taming={a,t:0,dur:3}; toast(`Você tenta domar ${A.name.toLowerCase()}…`); return; } } }
  return _intM();
};
function shear(a){ a.shorn=true; addItem('wool_bolt',1+(skill('pastoreio')>40?1:0)); gainSkill('pastoreio',1); toast('Você tosquia a ovelha: lã!'); setTimeout(()=>{ a.shorn=false; }, 240000); }
function finishTame(a){
  const A=ANIMALS[a.kind], sk=skill('domar'), ch = sk<A.tame-10 ? 0 : Math.min(.95, .25+(sk-A.tame)/40);
  gainSkill('domar', 1+A.tame/40);
  if(Math.random()<ch){ a.tamed=true; a.state='follow'; a.name=A.name; a.hp=Math.max(a.hp,A.hp*.6); fxBurst(a.x,a.y-10,'#7ae07a',16); toast(`${A.name} agora é seu!${A.mount?' (E para montar)':''}`); }
  else { toast(ch===0?`Domar ${A.name.toLowerCase()} pede uns ${A.tame} em Domar Animais.`:`${A.name} não aceita você.`); if(A.aggro){ a.state='charge'; a.t=6; } else { a.state='flee'; a.t=4; } }
}
// ---------------- montaria ----------------
function mountUp(a){ if(player.mount) return; player.mount={kind:a.kind,hp:a.hp,col:a.col}; animals.splice(animals.indexOf(a),1); player.baseSpeed=player.baseSpeed||player.speed; player.speed=player.baseSpeed*1.75;
  toast(`Você monta no ${ANIMALS[a.kind].name.toLowerCase()}. (X para desmontar)`); }
function dismount(){ if(!player.mount) return; const m=player.mount, A=ANIMALS[m.kind];
  animals.push({kind:m.kind,x:player.x+12,y:player.y,hp:m.hp,face:1,phase:0,moving:false,state:'follow',t:0,vx:0,vy:0,hurtT:0,cd:0,tamed:true,name:A.name,col:m.col});
  player.mount=null; if(player.baseSpeed) player.speed=player.baseSpeed; toast('Você desmonta.'); }
addEventListener('keydown',e=>{ if(e.key.toLowerCase()==='x' && running && document.activeElement.tagName!=='INPUT'){ if(player.mount) dismount(); else { const a=animals.find(a=>a.tamed&&ANIMALS[a.kind].mount&&Math.hypot(a.x-player.x,a.y-player.y)<40); if(a) mountUp(a); } } });
(function(){ const hb=document.querySelector('.hudbtns'); if(hb){ const b=document.createElement('button'); b.textContent='MONTAR'; b.onclick=()=>{ if(!running) return; if(player.mount) dismount(); else { const a=animals.find(a=>a.tamed&&ANIMALS[a.kind].mount&&Math.hypot(a.x-player.x,a.y-player.y)<60); if(a) mountUp(a); else toast('Nenhuma montaria sua por perto.'); } }; hb.appendChild(b); } })();
const _dhM = drawHuman;
drawHuman = function(g,x,y,h){ if(player && player.mount && h.look===player.look && !invOpen){ const m=player.mount, f=h.face==='left'?-1:h.face==='right'?1:(player.mface||1); if(h.face==='left'||h.face==='right') player.mface=f;
    drawAnimal(g,{kind:m.kind,face:f,moving:player.moving,phase:player.phase*1.3,hurtT:0,col:m.col,mounted:true},x,y); _dhM(g,x,y-8,{...h,face:h.face==='up'||h.face==='down'?(f>0?'right':'left'):h.face}); return; }
  _dhM(g,x,y,h); };
// ---------------- bichos que te seguem e lutam ----------------
const _uaM = updateAnimals;
updateAnimals = function(dt){
  const tamed=animals.filter(a=>a.tamed); for(const a of tamed) animals.splice(animals.indexOf(a),1);
  _uaM(dt);
  for(const a of tamed){ animals.push(a); const A=ANIMALS[a.kind]; a.cd=Math.max(0,a.cd-dt); if(a.hurtT>0) a.hurtT-=dt;
    let tgt=null; if(A.fight){ let bd=7*T; for(const r of raiders){ const d=Math.hypot(r.x-a.x,r.y-a.y); if(d<bd){ bd=d; tgt=r; } } }
    let gx=player.x-14*(a===tamed[0]?1:-1), gy=player.y+4; if(a.stay){ gx=a.x; gy=a.y; } if(tgt){ gx=tgt.x; gy=tgt.y; }
    const dx=gx-a.x, dy=gy-a.y, d=Math.hypot(dx,dy);
    if(d>60*T && !a.stay){ a.x=player.x+10; a.y=player.y; }
    if(d>(tgt?12:10)){ const sp=A.speed*(d>5*T?1.3:.8)*dt, nx=a.x+dx/d*sp, ny=a.y+dy/d*sp; if(boxFree(nx,a.y)) a.x=nx; if(boxFree(a.x,ny)) a.y=ny; a.moving=true; a.phase+=dt*(A.speed/6); if(Math.abs(dx)>2) a.face=dx>0?1:-1; }
    else { a.moving=false; if(tgt && a.cd<=0){ a.cd=1.1; spellDamage(tgt,(A.dmg||6)*(1+skill('domar')/150),Math.atan2(dy,dx),4); } }
    if(tgt && Math.hypot(tgt.x-a.x,tgt.y-a.y)<16 && Math.random()<dt*.8){ a.hp-=(OW[tgt.weapon]?.dmg||8)*.35; a.hurtT=.12; if(a.hp<=0){ animals.splice(animals.indexOf(a),1); toast(`Seu ${A.name.toLowerCase()} morreu.`); } } }
  if(taming){ const a=taming.a; if(!animals.includes(a)||Math.hypot(a.x-player.x,a.y-player.y)>4*T||player.moving){ taming=null; toast('Você perde a concentração.'); }
    else { a.state='wander'; a.vx=0; a.vy=0; taming.t+=dt; if(Math.random()<dt*3) fxs.push({x:a.x,y:a.y-14,vx:0,vy:-8,t:.4,col:'#7ae07a'}); if(taming.t>=taming.dur){ taming=null; finishTame(a); } } }
};
// estábulo: cavalo pronto para quem não doma
ITEMS.stable_horse={ name:'Bilhete do Estábulo (Cavalo)', stack:5, value:600, desc:'Troque no portão: um cavalo selado e manso.', use:()=>{
  if(animals.filter(x=>x.tamed).length+(player.mount?1:0)>=MAX_PETS) return {msg:'Você já tem animais demais.'};
  animals.push({kind:'horse',x:player.x+14,y:player.y,hp:90,face:1,phase:0,moving:false,state:'follow',t:0,vx:0,vy:0,hurtT:0,cd:0,tamed:true,name:'Cavalo',col:rpick(['#6a4428','#3a2a1a','#8a6a4a','#d8d0c0','#2a2420'])});
  return {msg:'Um cavalário traz seu cavalo selado. (E nele para montar, X para montar/desmontar)', consume:true}; } };
PRICE.stable_horse=600; ICONS.stable_horse=ICONS.deed_smithy||ICONS.bread; VSTOCK.estalajadeiro.push('stable_horse');
// salvar bichos e montaria
const _serM = serialize; serialize = function(){ const s=_serM(); s.pets=animals.filter(a=>a.tamed).map(a=>({kind:a.kind,hp:a.hp,name:a.name,col:a.col,stay:a.stay,x:a.x,y:a.y})); s.mount=player.mount||null; s.baseSpeed=player.baseSpeed||null; return s; };
const _appM = applySave; applySave = function(s){ _appM(s); for(const p of s.pets||[]) animals.push({...p,face:1,phase:0,moving:false,state:'follow',t:0,vx:0,vy:0,hurtT:0,cd:0,tamed:true});
  player.mount=s.mount||null; if(s.baseSpeed) player.baseSpeed=s.baseSpeed; if(player.mount && player.baseSpeed) player.speed=player.baseSpeed*1.75; };
// carcaças novas
const _dc = drawCarcass; drawCarcass = function(g,o,sx,sy){ if(['deer','rabbit','boar'].includes(o.kind)) return _dc(g,o,sx,sy); const P=(x,y,w,h,c)=>{ g.fillStyle=c; g.fillRect(sx+x,sy+y,w,h); };
  const c={horse:'#6a4428',camel:'#b8945a',reindeer:'#7a6048',sheep:'#e8e0d0',cow:'#e8e0d0',wolfp:'#6a6662',bear:'#4a3424'}[o.kind]||'#6a4a3a'; if(o.searched){ P(3,9,10,4,'#5a1a14'); P(4,10,8,2,'#d8ccb8'); return; } P(1,8,14,6,c); P(4,9,6,2,'#6a1a14'); };
const _dmgA = damageAnimal; damageAnimal = function(a,dmg,ang){ if(a.tamed) return; return _dmgA(a,dmg,ang); };

'use strict';
// =====================================================================
// OUTREMER — chefes de evento nos 19 covis do 3D (com capangas, anúncio no chat e
// jogadores simulados disputando), e a Dungeon da Montanha: pontes sobre o abismo,
// a boca da caverna, dois níveis descendo e o Grande Dragão Vermelho no fundo.
// =====================================================================
Object.assign(TL, { CHASM:25, BRIDGE:26 });
// ---------------- chefes ----------------
const BOSS_BASE = { crusader_ghost:['skeleton_knight_boss',{ghost:true,glow:'#c8d8ff'}], wolf:['wolf',{}], spider_giant:['spider',{}], treant:['boulder',{tint:'#3a5a2a'}], dire_bear:['minotaur',{animalArt:'bear'}],
  bog_lurker:['zombie_dark',{}], rock_elemental:['boulder',{}], frost_giant:['minotaur',{skin:'#a8c8d8',glow:'#a8e8ff'}], wight:['skeleton_knight_boss',{glow:'#a8e8ff'}], sea_raider:['bandit',{}],
  crab_giant:['antlion_armored',{tint:'#8a2a1a'}], necromancer_apprentice:['necromancer',{}] };
const LAIR_BOSS = {};
for(const b of D3.world_layout.bosses){
  const [base,extra] = MONS[b.monster_in_data] ? [b.monster_in_data,{}] : (BOSS_BASE[b.monster_in_data]||['orc',{}]);
  const B=MONS[base]; if(!B) continue; const id='boss_'+b.id;
  MONS[id] = { ...B, name:b.name, lvl:b.level, hp:B.hp.map(v=>Math.round(v*5+b.level*20)), scale:(B.scale||1)*1.6, boss:true, weight:0, pack:[1,1], gold:[b.level*15,b.level*40], ...extra,
    look:B.look?{...B.look, ...(extra.skin?{skin:extra.skin}:{})}:null };
  if(extra.tint && B.beast){ BEAST[id+'_art']={...BEAST[B.beast], c:extra.tint, s:BEAST[B.beast].s*1.6}; MONS[id].beast=id+'_art'; }
  OW['m_'+id]={...OW[B.weapon], dmg:Math.round((OW[B.weapon]?.dmg||12)*1.8)}; MONS[id].weapon='m_'+id;
  const lt=lootFrom('boss_'+b.id, true) || lootFrom('boss_'+b.monster_in_data, true); LOOT['mon_'+id] = lt || LT(4,[['heal_potion',3],['gem',1]],1);
  LAIR_BOSS[b.id]=id;
}
const EVENTS3 = D3.events.events;
const lairState = {}; // id -> {cd, alive:[...], boss}
function lairOf(id){ return (SW.lairs||[]).find(l=>l.id===id); }
function spawnAt(kind,x,y,o={}){ const sp=openSpot(x,y,5); if(!sp) return null; const r={x:sp[0],y:sp[1],face:'down',phase:0,moving:false,state:'wander',wp:null,idle:1,path:null,pathT:0,seenT:0,lastX:0,lastY:0,wind:0,cd:0,hurtT:0,alertT:0,swingT:0,doorT:0,aimAng:0,mon:kind,camp:-1,...o};
  setupMon(r); r.hx=r.x; r.hy=r.y; raiders.push(r); return r; }
function startLairBoss(L){
  const kind=LAIR_BOSS[L.id]; if(!kind) return; const ev=EVENTS3.find(e=>e.boss===L.id), st=lairState[L.id]={cd:0,mobs:[]};
  const boss=spawnAt(kind,L.x*T+8,L.y*T+12,{lairBoss:L.id}); if(!boss) return; st.boss=boss; st.mobs.push(boss);
  for(const [m,n] of (ev&&ev.adds)||[[L.mons&&L.mons[0]||'skeleton',4]]) if(MONS[m]) for(let k=0;k<Math.min(n,5);k++){ const a=spawnAt(m,L.x*T+8+(Math.random()-.5)*80,L.y*T+12+(Math.random()-.5)*60); if(a) st.mobs.push(a); }
  const msg=((ev&&ev.announce)||'{boss} has awakened in its lair!').replace('{boss}',L.name); toast('☠ '+msg); Journal.add('system','',msg);
  const s=Sim.speaker('boss_spawn'); if(s) Sim.say(s,'boss_spawn',{boss:L.name},'global');
  for(let k=0;k<2;k++){ const o=rpick(Sim.online().filter(x=>!x.near)); if(o) setTimeout(()=>{ if(Sim.spawn(o) && o.n){ o.n.x=L.x*T+(Math.random()-.5)*120; o.n.y=L.y*T+90; o.n.hx=o.n.x; o.n.hy=o.n.y; } }, 2000+k*3000); }
}
const _kR = killRaider;
killRaider = function(r,ang){ _kR(r,ang);
  if(r.lairBoss){ const L=lairOf(r.lairBoss), st=lairState[r.lairBoss]; if(st){ st.cd=600; st.boss=null; } toast(`☠ ${L?L.name:'The boss'} has fallen! Search the remains.`); Journal.add('system','',`${player.name} defeated ${L?L.name:'the boss'}.`);
    const s=Sim.speaker('reply_friend'); if(s) setTimeout(()=>Sim.say(s,rpick(['brag','reply_friend','loot_rare']),{target:player.name},'global'),2500); }
  if(r.dungeonBoss){ player.dragonSlain=day; toast('THE GREAT RED DRAGON HAS FALLEN! All of Aeloria will sing your name.'); Journal.add('global','Herald of Aurelia',`${player.name} has slain the Great Red Dragon!`,'#ffd84a'); shake=10;
    for(let k=0;k<6;k++) setTimeout(()=>fxBurst(r.x+(Math.random()-.5)*80,r.y-20,'#ffb040',30,80),k*250); }
};
// ---------------- a dungeon da montanha ----------------
const DG = { surf:{x:560,y:270,w:44,h:34}, L1:{x:90,y:1203,w:170,h:72}, L2:{x:320,y:1203,w:170,h:72} };
const STAIRS = [];
function inRect(r,x,y){ return x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h; }
function dungeonLevel(px,py){ const tx=Math.floor(px/T), ty=Math.floor(py/T); return inRect(DG.L1,tx,ty)?1:inRect(DG.L2,tx,ty)?2:0; }
function carveCave(R, seed, chasms){
  const rnd=mulberry32(seed), w=R.w, h=R.h; let g=new Uint8Array(w*h);
  for(let y=0;y<h;y++) for(let x=0;x<w;x++) g[y*w+x] = (x<3||y<3||x>=w-3||y>=h-3) ? 1 : rnd()<.46 ? 1 : 0;
  for(let it=0;it<5;it++){ const n=new Uint8Array(w*h); for(let y=0;y<h;y++) for(let x=0;x<w;x++){ let c=0; for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){ const xx=x+dx, yy=y+dy; c+= (xx<0||yy<0||xx>=w||yy>=h) ? 1 : g[yy*w+xx]; } n[y*w+x] = (x<3||y<3||x>=w-3||y>=h-3) ? 1 : c>=5 ? 1 : 0; } g=n; }
  // túnel sinuoso garantindo o caminho do começo (oeste) ao fim (leste)
  let x=6, y=Math.floor(h/2); const path=[];
  while(x<w-8){ for(let dy=-2;dy<=2;dy++) for(let dx=-2;dx<=2;dx++){ const yy=y+dy, xx=x+dx; if(yy>3&&yy<h-4&&xx>3&&xx<w-4) g[yy*w+xx]=0; } path.push([x,y]); x+=1; y+=Math.round((rnd()-.5)*2.2); y=Math.max(8,Math.min(h-9,y)); }
  for(let yy=0;yy<h;yy++) for(let xx=0;xx<w;xx++){ const i=idx(R.x+xx,R.y+yy); map[i]= g[yy*w+xx] ? TL.ROCK : (rnd()<.6?TL.RUBBLE:TL.DIRT); fden[i]=0; reserved[i]=1; }
  // abismos atravessados por pontes no caminho
  for(const cx of chasms){ for(let yy=4;yy<h-4;yy++) for(let xx=cx-2;xx<=cx+2;xx++){ const i=idx(R.x+xx,R.y+yy); if(map[i]!==TL.ROCK) map[i]=TL.CHASM; }
    const py=path.find(p=>p[0]===cx)[1]; for(let xx=cx-3;xx<=cx+3;xx++) for(let yy=py-1;yy<=py;yy++) map[idx(R.x+xx,R.y+yy)]=TL.BRIDGE; }
  return { start:[R.x+path[0][0], R.y+path[0][1]], end:[R.x+path[path.length-1][0], R.y+path[path.length-1][1]], path };
}
function paintDungeon(WD){
  for(let k=WD.props.length-1;k>=0;k--){ const p=WD.props[k]; if(inRect({x:DG.surf.x-2,y:DG.surf.y-8,w:DG.surf.w+4,h:DG.surf.h+40},p.x,p.y)||inRect(DG.L1,p.x,p.y)||inRect(DG.L2,p.x,p.y)) WD.props.splice(k,1); }
  // superfície: abismo na montanha com três pontes estreitas até a boca da caverna
  const S=DG.surf;
  for(let y=S.y;y<S.y+S.h;y++) for(let x=S.x;x<S.x+S.w;x++){ const i=idx(x,y); map[i]=TL.CHASM; fden[i]=0; reserved[i]=1; }
  const pts=[[S.x+22,S.y+S.h],[S.x+22,S.y+S.h-8],[S.x+8,S.y+S.h-8],[S.x+8,S.y+S.h-18],[S.x+34,S.y+S.h-18],[S.x+34,S.y+8],[S.x+22,S.y+8],[S.x+22,S.y+3]];
  const ledges=[[S.x+19,S.y+S.h-10,7,4],[S.x+5,S.y+S.h-20,7,5],[S.x+31,S.y+S.h-20,7,5],[S.x+31,S.y+6,7,5],[S.x+18,S.y,9,6]];
  for(const [x,y,w,h] of ledges) for(let yy=y;yy<y+h;yy++) for(let xx=x;xx<x+w;xx++) map[idx(xx,yy)]=TL.RUBBLE;
  for(let k=0;k<pts.length-1;k++){ const [x1,y1]=pts[k],[x2,y2]=pts[k+1]; for(let x=Math.min(x1,x2);x<=Math.max(x1,x2);x++) for(let y=Math.min(y1,y2);y<=Math.max(y1,y2);y++) if(map[idx(x,y)]===TL.CHASM) map[idx(x,y)]=TL.BRIDGE; }
  for(let y=S.y-6;y<S.y;y++) for(let x=S.x+10;x<S.x+34;x++) if(Math.abs(x-(S.x+22))>2) map[idx(x,y)]=TL.ROCK;
  for(let x=S.x+20;x<=S.x+24;x++) map[idx(x,S.y-6)]=TL.ROCK;
  for(let y=S.y-5;y<S.y+1;y++) for(let x=S.x+20;x<=S.x+24;x++) map[idx(x,y)]=TL.RUBBLE;
  for(let y=S.y+S.h;y<S.y+S.h+30;y++) for(let x=S.x+20;x<=S.x+24;x++){ const i=idx(x,y); if(map[i]===TL.ROCK||map[i]===TL.CHASM) map[i]=TL.DIRT; reserved[i]=1; }
  WD.props.push({t:'stairs_down',x:S.x+22,y:S.y-4}); WD.props.push({t:'brazier',x:S.x+20,y:S.y-2}); WD.props.push({t:'brazier',x:S.x+24,y:S.y-2});
  WD.lairs.push({ id:'garganta', name:'The Dragon\'s Gorge', x:S.x+22, y:S.y+S.h/2|0 });
  // nível 1: cavernas com abismos e pontes; nível 2: o salão do dragão
  const a=carveCave(DG.L1, 9101, [50,100,140]), b=carveCave(DG.L2, 9202, [70]);
  const hall={x:DG.L2.x+DG.L2.w-36, y:DG.L2.y+DG.L2.h/2|0}; for(let y=-16;y<=16;y++) for(let x=-24;x<=24;x++) if((x/24)**2+(y/16)**2<1){ const i=idx(hall.x+x,hall.y+y); map[i]=TL.DIRT; }
  for(let k=0;k<14;k++){ const an=k/14*6.283; WD.props.push({t:'hoard',x:Math.round(hall.x+8+Math.cos(an)*6),y:Math.round(hall.y+Math.sin(an)*4)}); }
  for(const [lv,c] of [[1,a],[2,b]]) for(let k=6;k<c.path.length;k+=18){ const [px,py]=c.path[k], R=lv===1?DG.L1:DG.L2; WD.props.push({t:'brazier',x:R.x+px,y:R.y+py-3}); }
  WD.props.push({t:'stairs_up',x:a.start[0],y:a.start[1]-1}); WD.props.push({t:'stairs_down',x:a.end[0],y:a.end[1]-1});
  WD.props.push({t:'stairs_up',x:b.start[0],y:b.start[1]-1});
  STAIRS.length=0;
  STAIRS.push({at:[S.x+22,S.y-4], to:[a.start[0]+2,a.start[1]+1], msg:'You enter the cave. The air grows hot and smells of sulphur.'});
  STAIRS.push({at:[a.start[0],a.start[1]-1], to:[S.x+22,S.y-2], msg:'You return to the mountain light.'});
  STAIRS.push({at:[a.end[0],a.end[1]-1], to:[b.start[0]+2,b.start[1]+1], msg:'You go deeper… the ground trembles faintly, like breathing.'});
  STAIRS.push({at:[b.start[0],b.start[1]-1], to:[a.end[0]-2,a.end[1]+1], msg:'You climb back to the first level.'});
  DG.hall=hall;
}
const _pwE = paintWater; paintWater = function(WD){ _pwE(WD); paintDungeon(WD); };
// chão novo: abismo e ponte
const _dtE = drawTile;
drawTile = function(g,x,y,px,py){ const t=map[idx(x,y)];
  if(t===TL.CHASM){ g.fillStyle='#060404'; g.fillRect(px,py,T,T); if(tileAt(x,y-1)!==TL.CHASM){ g.fillStyle='#3a3230'; g.fillRect(px,py,T,4); g.fillStyle='#1a1412'; g.fillRect(px,py+4,T,3); } if(th(x,y,71)>.97){ g.fillStyle='#4a1a0a'; g.fillRect(px+Math.floor(th(x,y,72)*14),py+8,2,1); } return; }
  if(t===TL.BRIDGE){ g.fillStyle='#060404'; g.fillRect(px,py,T,T); g.fillStyle='#6a4a2a'; for(let r=0;r<4;r++) g.fillRect(px+1,py+r*4,T-2,3); g.fillStyle='#4a3018'; g.fillRect(px+1,py,1,T); g.fillRect(px+T-2,py,1,T);
    g.fillStyle='#8a7a5a'; if(tileAt(x-1,y)===TL.CHASM) g.fillRect(px,py,1,T); if(tileAt(x+1,y)===TL.CHASM) g.fillRect(px+T-1,py,1,T); return; }
  return _dtE(g,x,y,px,py); };
const _stE = solidTile; solidTile = function(tx,ty){ if(inB(tx,ty) && map[idx(tx,ty)]===TL.CHASM) return true; return _stE(tx,ty); };
const _dObjE = drawObj;
drawObj = function(g,o,sx,sy,now){ const P=(a,b,w,h,c)=>{ g.fillStyle=c; g.fillRect(sx+a,sy+b,w,h); };
  if(o.type==='stairs_down'||o.type==='stairs_up'){ P(0,0,16,16,'#141010'); for(let k=0;k<4;k++){ const y=o.type==='stairs_down'?k*4:12-k*4; P(1+k,y,14-k*2,3,['#5a5048','#4a4038','#3a3028','#2a2018'][k]); } P(0,0,16,1,'#6a6058'); return; }
  if(o.type==='hoard'){ P(1,8,14,7,'#a87a20'); P(2,7,12,2,'#d8b040'); for(let k=0;k<5;k++) P(2+((k*5+o.x)%11),8+((k*3+o.y)%5),2,1,'#fff0a0'); if(Math.floor(now/600+o.x)%7===0) P(6,6,1,1,'#ffffff'); return; }
  return _dObjE(g,o,sx,sy,now); };
OBJ_NAMES.stairs_down='Stairs (down)'; OBJ_NAMES.stairs_up='Stairs (up)'; OBJ_NAMES.hoard='Dragon\'s Hoard';
ACT_TYPES.add('stairs_down'); ACT_TYPES.add('stairs_up'); ACT_TYPES.add('hoard');
const _udE = useDevice;
useDevice = function(o){
  if(o.type==='stairs_down'||o.type==='stairs_up'){ const s=STAIRS.find(s=>s.at[0]===o.x&&s.at[1]===o.y); if(!s){ toast('The passage is blocked.'); return; }
    player.x=s.to[0]*T+8; player.y=s.to[1]*T+12; search=null; toast(s.msg); for(const a of animals) if(a.tamed&&!a.stay){ a.x=player.x+10; a.y=player.y; } return; }
  if(o.type==='hoard'){ if(raiders.some(r=>r.dungeonBoss)){ toast('The dragon still guards the hoard!'); return; } if(o.looted){ toast('Nothing is left here.'); return; }
    o.looted=true; const g=200+Math.floor(Math.random()*400); addItem('cash',g); lootLevel=60; lootLuck=40; if(Math.random()<.5) addItem(rpick(['longsword','plate_torso','crusader_shield','greathelm','gold_ring','ruby_ring','fire_staff']),1); lootLevel=0; lootLuck=0;
    toast(`You fill your purse: ${g} gold.`); return; }
  return _udE(o); };
// escuridão lá embaixo (só tochas, braseiros e a sua luz)
const _dkE = darkness; darkness = function(h){ if(player && dungeonLevel(player.x,player.y)) return .7; return _dkE(h); };
// monstros da dungeon e o Grande Dragão Vermelho
MONS.great_red_dragon = { ...MONS.dragon_alpha, name:'Great Red Dragon', lvl:60, hp:[5200,5600], scale:4.2, boss:true, weight:0, gold:[3000,5000] };
BEAST.great_red = { ...BEAST.dragon_alpha, c:'#6a1208', s:4.2, e:'#ffcc40' }; MONS.great_red_dragon.beast='great_red';
OW.m_great_red_dragon = { ...OW.m_dragon_alpha, dmg:150, range:60 }; MONS.great_red_dragon.weapon='m_great_red_dragon';
LOOT.mon_great_red_dragon = lootFrom('boss_serpe_de_fogo', true) || LOOT.mon_dragon_alpha; LOOT.mon_great_red_dragon.rolls=8;
const DG_MONS = { 1:['skeleton','skeleton_archer','skeleton_knight','zombie','zombie_dark','goblin_elite','hobgoblin','skeleton_mage_fire'], 2:['skeleton_knight','skeleton_mage_fire','wyvern_fire','dragon_whelp','dragon_young','minotaur','skeleton_knight_boss'] };
const _mfE = monsterFor; monsterFor = function(d){ const lv=player?dungeonLevel(player.x,player.y):0; if(lv) return rpick(DG_MONS[lv].filter(k=>MONS[k])); return _mfE(d); };
let dgT=0;
const _usE = updateSpawns;
updateSpawns = function(dt){ const lv=dungeonLevel(player.x,player.y); if(!lv) return _usE(dt);
  dgT-=dt; if(dgT>0) return; dgT=2.5; const near=raiders.filter(r=>Math.hypot(r.x-player.x,r.y-player.y)<30*T).length; if(near<(lv===1?7:9)) spawnRaider(10,22);
  if(lv===2 && DG.hall && !raiders.some(r=>r.dungeonBoss) && !(player.dragonSlain && day-player.dragonSlain<3) && Math.hypot(player.x-DG.hall.x*T,player.y-DG.hall.y*T)<34*T){
    const r=spawnAt('great_red_dragon',DG.hall.x*T,DG.hall.y*T,{dungeonBoss:true,state:'chase',foe:player}); if(r){ toast('The ground shakes. From the depths of the hall, the GREAT RED DRAGON opens its eyes.'); shake=12; } } };
// chefes dos covis: acordam quando você chega perto
const _updE = update;
update = function(dt){ _updE(dt); if(!running||!player||!SW||!SW.lairs) return;
  for(const L of SW.lairs){ const st=lairState[L.id]||(lairState[L.id]={cd:0,mobs:[]}); if(st.cd>0){ st.cd-=dt; continue; }
    if(st.boss && !raiders.includes(st.boss)) st.boss=null;
    const d=Math.hypot(L.x*T-player.x,L.y*T-player.y); if(!st.boss && d<26*T && d>10*T) startLairBoss(L); }
};
const _wnE = wildName; wildName = function(){ const lv=player?dungeonLevel(player.x,player.y):0; if(lv) return lv===1?'Dragon\'s Lair · Level 1':'Dragon\'s Lair · Treasure Hall'; return _wnE(); };
const _serE = serialize; serialize = function(){ const s=_serE(); s.dragonSlain=player.dragonSlain||0; return s; };
const _appE = applySave; applySave = function(s){ _appE(s); player.dragonSlain=s.dragonSlain||0; };

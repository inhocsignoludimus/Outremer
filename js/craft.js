'use strict';
// =====================================================================
// OUTREMER — coleta (lenhador, mineração), fabricação por ofício (ferraria, carpintaria,
// flecharia, alfaiataria, alquimia, culinária, engenhocas) com bancada/forja perto,
// e construção medieval (madeira, pedra, ferro) no lugar do After Light (sem gerador, painel, bateria).
// =====================================================================
// ---------------- materiais e onde comprar ----------------
for(const id of ['hide']) if(ITEMS[id]) ITEMS[id].name='Couro Cru';
ITEMS.planks = ITEMS.planks || { name:'Tábuas', stack:99 }; ITEMS.planks.name='Tábuas';
VSTOCK.alfaiate.push('cloth_bolt','linen_bolt','wool_bolt','cut_leather','sewing_kit','scissors'); VSTOCK.tailor.push('cloth_bolt','linen_bolt','cut_leather','sewing_kit');
VSTOCK.ferreiro.push('iron_ingot','iron_ingot','smith_hammer','tongs','pickaxe','hatchet','nails'); VSTOCK.carpenter.push('saw','logs','oak_logs','nails','hatchet');
VSTOCK.bowyer.push('feather','arrow_shaft','fletching_kit'); VSTOCK.alchemist.push('empty_bottle','empty_bottle','mortar_pestle'); VSTOCK.provisioner.push('empty_bottle','candle','tinker_tools','fishing_pole');
VSTOCK.butcher.push('dried_meat','roasted_meat','leather_hide');
// ---------------- ferramentas ----------------
const AXES = ['hatchet','hand_axe','axe','battleaxe','war_axe','broadaxe','double_axe','bardiche'];
hasAxe = ()=> AXES.some(hasItem);
const hasPick = ()=> hasItem('pickaxe');
// ---------------- coleta ----------------
const GATH = D3.gathering.nodes; const ROCKN=GATH.find(n=>n.id==='rock');
function chanceBy(tbl,sk){ let c=0; for(const [lv,p] of tbl) if(sk>=lv) c=p; return c; }
function facingTile(){ const [fx,fy]=FACE[player.face]; return [Math.floor((player.x+fx*12)/T), Math.floor((player.y-3+fy*12)/T)]; }
function gatherTarget(){
  const [tx,ty]=facingTile(); for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){ const x=tx+dx,y=ty+dy; if(!inB(x,y)) continue; const i=idx(x,y), o=objGrid[i];
    if(o && ['tree','pine','palm','deadtree'].includes(o.type)) return {kind:'tree',o,x:o.x,y:o.y};
    if(o && o.type==='rock') return {kind:'rock',o,x:o.x,y:o.y};
    if(map[i]===TL.ROCK && dx===0 && dy===0) return {kind:'rock',x,y}; }
  return null;
}
let gathering=null;
const _interactC = interact;
interact = function(){
  if(running && !search && !gathering && !npcNear()){ const g=gatherTarget();
    if(g && g.kind==='tree'){ if(!hasAxe()){ toast('Precisa de um machado para cortar a árvore.'); return; } gathering={...g,t:0,dur:1.6-skill('lenhador')/150}; toast('Cortando…'); return; }
    if(g && g.kind==='rock'){ if(!hasPick()){ toast('Precisa de uma picareta para minerar.'); return; } gathering={...g,t:0,dur:1.9-skill('mineracao')/150}; toast('Minerando…'); return; } }
  return _interactC();
};
function finishGather(g){
  if(g.kind==='tree'){ const n=1+Math.floor(Math.random()*3)+(skill('lenhador')>60?1:0); const id=g.o.type==='pine'&&Math.random()<.3?'cedar_logs':cellAt(g.x,g.y)?.b==='f'&&Math.random()<.2?'oak_logs':'logs';
    addItem(id,n); toast(`+${n} ${ITEMS[id].name}`); gainSkill('lenhador',1); g.o.hits=(g.o.hits||0)+1;
    if(g.o.hits>=3+Math.floor(Math.random()*3)){ removeObj(g.o); refreshWalk(g.x,g.y); dirtyChunks(g.x,g.y); toast('A árvore cai.'); } }
  else { const sk=skill('mineracao'), got=[]; addItem('stone',1+Math.floor(Math.random()*2)); got.push('pedra');
    for(const y of ROCKN.yields){ if(y.always) continue; if(Math.random()<chanceBy(y.chance_by_skill||[[0,.3]],sk)){ addItem(y.item,1); got.push(ITEMS[y.item].name.toLowerCase()); } }
    const c=cellAt(g.x,g.y); if(c && c.lv>=12 && Math.random()<.06+sk/1000){ const r=rpick(['gold_ore','blackiron_ore']); addItem(r,1); got.push(ITEMS[r].name.toLowerCase()); }
    toast('Você minera: '+got.join(', ')); gainSkill('mineracao',1);
    if(g.o){ g.o.hits=(g.o.hits||0)+1; if(g.o.hits>=4){ removeObj(g.o); refreshWalk(g.x,g.y); dirtyChunks(g.x,g.y); } } }
}
const _updC = update;
update = function(dt){ _updC(dt); if(!gathering||!running) return;
  if(player.moving){ gathering=null; toast('Você para.'); return; }
  gathering.t+=dt; player.swing=player.swing||{t:.2,ang:FACE_ANG[player.face]};
  if(Math.random()<dt*6) fxs.push({x:gathering.x*T+8+(Math.random()-.5)*8,y:gathering.y*T+6,vx:(Math.random()-.5)*30,vy:-20,t:.3,col:gathering.kind==='tree'?'#8a6a3a':'#9a9690'});
  if(gathering.t>=gathering.dur){ const g=gathering; gathering=null; finishGather(g); if(!player.moving && (g.kind==='rock'||objs.includes(g.o))) gathering={...g,t:0}; } };

// ---------------- receitas (por ofício, com estação perto) ----------------
const STATION_NAME = { forge:'forja', anvil:'bigorna', bench:'bancada', loom:'tear', cauldron:'mesa de alquimia', fire:'fogo' };
const STATION_OBJ = { forge:['hearth'], anvil:['anvil'], bench:['workbench'], loom:['loom'], cauldron:['cauldron'], fire:['campfire','hearth'] };
function nearStation(st){ if(!st) return true; const tx=Math.floor(player.x/T), ty=Math.floor(player.y/T);
  for(let y=ty-3;y<=ty+3;y++) for(let x=tx-3;x<=tx+3;x++){ if(!inB(x,y)) continue; const o=objGrid[idx(x,y)]; if(o && STATION_OBJ[st].includes(o.type) && (st!=='fire'||o.type!=='campfire'||o.lit)) return true; } return false; }
const R_ = (out,n,cost,skill,min,station,o={}) => ({out:[out,n],cost,skill,min,station,...o});
const RECIPES = [
  // ferraria: fundir na forja, forjar na bigorna
  R_('iron_ingot',1,{iron_ore:2},'ferraria',0,'forge'), R_('copper_ingot',1,{copper_ore:2},'ferraria',20,'forge'), R_('silver_ingot',1,{silver_ore:2},'ferraria',50,'forge'),
  R_('gold_ingot',1,{gold_ore:2},'ferraria',65,'forge'), R_('blackiron_ingot',1,{blackiron_ore:3},'ferraria',85,'forge'), R_('bronze_ingot',2,{copper_ingot:1,iron_ingot:1},'ferraria',35,'forge'),
  R_('nails',10,{iron_ingot:1},'ferraria',0,'anvil'),
  R_('dagger',1,{iron_ingot:2},'ferraria',5,'anvil'), R_('shortsword',1,{iron_ingot:4},'ferraria',15,'anvil'), R_('longsword',1,{iron_ingot:6},'ferraria',35,'anvil'),
  R_('scimitar',1,{iron_ingot:6},'ferraria',40,'anvil'), R_('broadsword',1,{iron_ingot:9},'ferraria',60,'anvil'), R_('mace',1,{iron_ingot:5,logs:1},'ferraria',25,'anvil'),
  R_('warhammer',1,{iron_ingot:8,logs:1},'ferraria',55,'anvil'), R_('hand_axe',1,{iron_ingot:3,logs:1},'ferraria',10,'anvil'), R_('battleaxe',1,{iron_ingot:8,logs:2},'ferraria',50,'anvil'),
  R_('halberd',1,{iron_ingot:9,logs:3},'ferraria',70,'anvil'), R_('spear',1,{iron_ingot:2,logs:2},'ferraria',10,'anvil'),
  R_('pickaxe',1,{iron_ingot:3,logs:1},'ferraria',0,'anvil'), R_('hatchet',1,{iron_ingot:2,logs:1},'ferraria',0,'anvil'), R_('smith_hammer',1,{iron_ingot:3,logs:1},'ferraria',0,'anvil'),
  R_('nasal_helm',1,{iron_ingot:5},'ferraria',30,'anvil'), R_('chain_coif',1,{iron_ingot:6},'ferraria',35,'anvil'), R_('greathelm',1,{iron_ingot:10},'ferraria',65,'anvil'),
  R_('chain_gloves',1,{iron_ingot:5},'ferraria',40,'anvil'), R_('chain_boots',1,{iron_ingot:6},'ferraria',40,'anvil'), R_('chain_greaves',1,{iron_ingot:8},'ferraria',45,'anvil'),
  R_('hauberk',1,{iron_ingot:14},'ferraria',50,'anvil'), R_('plate_torso',1,{iron_ingot:22},'ferraria',80,'anvil'), R_('plate_legs',1,{iron_ingot:16},'ferraria',75,'anvil'),
  R_('plate_arms',1,{iron_ingot:12},'ferraria',75,'anvil'), R_('plate_gloves',1,{iron_ingot:8},'ferraria',70,'anvil'), R_('plate_boots',1,{iron_ingot:10},'ferraria',70,'anvil'),
  R_('buckler',1,{iron_ingot:6},'ferraria',25,'anvil'), R_('heater_shield',1,{iron_ingot:10,logs:2},'ferraria',50,'anvil'), R_('kite_shield',1,{iron_ingot:12,logs:2},'ferraria',60,'anvil'),
  R_('crusader_shield',1,{iron_ingot:14,logs:2,silver_ingot:1},'ferraria',75,'anvil'), R_('silver_ring',1,{silver_ingot:1},'ferraria',45,'anvil'), R_('gold_ring',1,{gold_ingot:1},'ferraria',65,'anvil'),
  R_('pilgrim_cross',1,{silver_ingot:2},'ferraria',50,'anvil'),
  // carpintaria e flecharia
  R_('planks',2,{logs:1},'carpintaria',0,null), R_('club',1,{logs:2},'carpintaria',0,null), R_('staff',1,{logs:3},'carpintaria',10,'bench'), R_('quarterstaff',1,{oak_logs:3},'carpintaria',30,'bench'),
  R_('wooden_shield',1,{logs:5},'carpintaria',15,'bench'), R_('round_shield',1,{logs:6,iron_ingot:1},'carpintaria',30,'bench'), R_('tower_shield',1,{oak_logs:8,iron_ingot:3},'carpintaria',70,'bench'),
  R_('fishing_pole',1,{logs:2,cloth_bolt:1},'carpintaria',5,null), R_('lute',1,{cedar_logs:4},'carpintaria',45,'bench'),
  R_('arrow_shaft',10,{logs:1},'flecharia',0,null), R_('arrows',10,{arrow_shaft:10,feather:10},'flecharia',0,null), R_('bolts',8,{arrow_shaft:8,iron_ingot:1},'flecharia',20,'bench'),
  R_('bow',1,{logs:4},'flecharia',10,'bench'), R_('shortbow',1,{logs:3},'flecharia',5,'bench'), R_('longbow',1,{oak_logs:5},'flecharia',45,'bench'), R_('composite_bow',1,{cedar_logs:5,leather_hide:1},'flecharia',65,'bench'),
  R_('crossbow',1,{logs:5,iron_ingot:2},'flecharia',40,'bench'), R_('heavy_crossbow',1,{oak_logs:6,iron_ingot:4},'flecharia',75,'bench'),
  // alfaiataria
  R_('bandage',5,{cloth_bolt:1},'alfaiataria',0,null), R_('cut_leather',2,{leather_hide:1},'alfaiataria',0,null), R_('cut_leather',1,{hide:1},'alfaiataria',0,null),
  R_('linen_shirt',1,{linen_bolt:2},'alfaiataria',5,'loom'), R_('wool_tunic',1,{wool_bolt:2},'alfaiataria',10,'loom'), R_('cloth_pants',1,{cloth_bolt:2},'alfaiataria',5,'loom'),
  R_('wool_cloak',1,{wool_bolt:3},'alfaiataria',20,'loom'), R_('travel_cloak',1,{cloth_bolt:4},'alfaiataria',30,'loom'), R_('templar_mantle',1,{linen_bolt:4,cloth_bolt:1},'alfaiataria',55,'loom'),
  R_('monk_robe',1,{wool_bolt:4},'alfaiataria',25,'loom'), R_('silk_robe',1,{silk_bolt:4},'alfaiataria',60,'loom'), R_('wizard_hat',1,{cloth_bolt:2},'alfaiataria',35,'loom'), R_('gambeson',1,{cloth_bolt:5},'alfaiataria',20,'loom'),
  R_('leather_cap',1,{cut_leather:2},'alfaiataria',10,null), R_('leather_gloves',1,{cut_leather:2},'alfaiataria',15,null), R_('leather_boots',1,{cut_leather:3},'alfaiataria',15,null),
  R_('leather_leggings',1,{cut_leather:4},'alfaiataria',25,null), R_('leather_armor',1,{cut_leather:6},'alfaiataria',30,null), R_('studded_leather',1,{cut_leather:7,nails:10},'alfaiataria',50,null),
  R_('studded_gloves',1,{cut_leather:3,nails:5},'alfaiataria',45,null), R_('fur_cloak',1,{fur_bundle:3},'alfaiataria',40,'loom'), R_('fur_boots',1,{fur_bundle:2},'alfaiataria',35,null),
  // alquimia
  R_('heal_potion',1,{empty_bottle:1,incense:1},'alquimia',0,'cauldron'), R_('greater_heal_potion',1,{empty_bottle:1,incense:2,myrrh:1},'alquimia',55,'cauldron'),
  R_('mana_potion',1,{empty_bottle:1,saltpeter:1},'alquimia',20,'cauldron'), R_('refresh_potion',1,{empty_bottle:1,myrrh:1},'alquimia',10,'cauldron'),
  R_('cure_potion',1,{empty_bottle:1,quicklime:1},'alquimia',25,'cauldron'), R_('strength_potion',1,{empty_bottle:1,saltpeter:1,quicklime:1},'alquimia',45,'cauldron'),
  R_('agility_potion',1,{empty_bottle:1,myrrh:1,saltpeter:1},'alquimia',45,'cauldron'), R_('night_sight_potion',1,{empty_bottle:1,incense:1,quicklime:1},'alquimia',30,'cauldron'),
  // culinária e engenhocas
  R_('roasted_meat',1,{dried_meat:1},'culinaria',0,'fire'), R_('roast',1,{meat:1},'culinaria',0,'fire'), R_('cooked_fish',1,{fish:1},'culinaria',0,'fire'), R_('bread',2,{flour:1},'culinaria',10,'fire'),
  R_('lockpick',3,{iron_ingot:1},'engenhocas',10,null), R_('sewing_kit',1,{iron_ingot:1},'engenhocas',0,null), R_('scissors',1,{iron_ingot:1},'engenhocas',5,null),
  R_('tongs',1,{iron_ingot:1},'engenhocas',5,null), R_('saw',1,{iron_ingot:2,logs:1},'engenhocas',10,null), R_('candle',3,{wax:1},'engenhocas',0,null),
].filter(r=>ITEMS[r.out[0]] && Object.keys(r.cost).every(k=>ITEMS[k]));
const CRAFT_SK = ['ferraria','carpintaria','flecharia','alfaiataria','alquimia','culinaria','engenhocas'];
let craftSk='ferraria';
function craftChance(r){ const s=skill(r.skill); if(s<r.min) return 0; return Math.min(.99, .5 + (s-r.min)/60); }
function doCraft(r, times){
  for(let k=0;k<times;k++){
    if(!canAfford(r.cost) || !nearStation(r.station)) break;
    payCost(r.cost); gainSkill(r.skill, .8+r.min/60);
    if(Math.random()>craftChance(r)){ toast(`Você estraga o material. (${ITEMS[r.out[0]].name})`); continue; }
    const exc = isGear(r.out[0]) && Math.random() < Math.max(0,(skill(r.skill)-r.min-20)/200);
    if(exc){ const s=makeInst(r.out[0],'refinado',Math.round(skill(r.skill)/3)); s.pre='Excepcional'; s.aff=[[catOf(r.out[0])==='weapon'?'dmg_pct':'armor_pct', 8+Math.round(skill(r.skill)/10)]]; addInst(s); toast(`Obra excepcional: ${instName(s)}!`); }
    else { addItem(r.out[0], r.out[1]); toast(`Você faz ${ITEMS[r.out[0]].name}${r.out[1]>1?' ×'+r.out[1]:''}.`); }
  }
  renderCraft();
}
renderCraft = function(){
  document.querySelector('#craft-panel .ghead b').textContent='FABRICAR';
  const tabs=document.getElementById('craft-tabs'); tabs.innerHTML='';
  for(const s of CRAFT_SK){ const b=document.createElement('button'); b.className='tab'+(s===craftSk?' on':''); b.textContent=`${SKILL_NAMES[s]} ${Math.floor(skill(s))}`; b.onclick=()=>{ craftSk=s; renderCraft(); }; tabs.appendChild(b); }
  const box=document.getElementById('craft-list'); box.innerHTML='';
  for(const r of RECIPES.filter(r=>r.skill===craftSk).sort((a,b)=>a.min-b.min)){
    const it=ITEMS[r.out[0]], ok=canAfford(r.cost), st=nearStation(r.station), sk=skill(r.skill)>=r.min, row=document.createElement('div'); row.className='craft-row'+(ok&&st&&sk?'':' poor');
    const ings=Object.entries(r.cost).map(([k,v])=>`<span class="ing${countItem(k)>=v?'':' miss'}"><img src="${ICONS[k]}" alt="">${ITEMS[k].name} ${countItem(k)}/${v}</span>`).join('');
    row.innerHTML=`<img src="${ICONS[r.out[0]]}" alt=""><div><b>${it.name}${r.out[1]>1?' ×'+r.out[1]:''}</b><div class="desc">${SKILL_NAMES[r.skill]} ${r.min}${sk?'':' (falta skill)'} · ${r.station?`perto de ${STATION_NAME[r.station]}${st?' ✔':' ✘'}`:'em qualquer lugar'} · chance ${Math.round(craftChance(r)*100)}%</div><div class="ings">${ings}</div></div>`;
    const b=document.createElement('button'); b.textContent='Fazer'; b.disabled=!(ok&&st&&sk); b.onclick=()=>doCraft(r,1); row.appendChild(b);
    const b5=document.createElement('button'); b5.textContent='×5'; b5.disabled=b.disabled; b5.onclick=()=>doCraft(r,5); row.appendChild(b5);
    box.appendChild(row); }
  const note=document.createElement('p'); note.className='craft-note';
  note.textContent='Forjas, bigornas, bancadas, teares e mesas de alquimia ficam nas lojas das cidades — ou construa as suas (B). Corte árvores com machado e minere rochas com picareta (E).';
  box.appendChild(note);
};
document.getElementById('craft-close').textContent='Fechar (C)';

// ---------------- construção medieval ----------------
BUILD.length=0;
BUILD.push(
  { cat:'Estrutura', id:'wall', name:'Parede de Madeira', cost:{logs:4}, tile:true },
  { cat:'Estrutura', id:'wall_stone', name:'Parede de Pedra', cost:{stone:4}, tile:true, desc:'Mais resistente a invasões' },
  { cat:'Estrutura', id:'window', name:'Janela de Madeira', cost:{logs:2}, tile:true },
  { cat:'Estrutura', id:'window_iron', name:'Janela Gradeada', cost:{iron_ingot:2,stone:2}, tile:true },
  { cat:'Estrutura', id:'door', name:'Porta de Madeira', cost:{logs:3}, tile:true, desc:'Pode ter tranca' },
  { cat:'Estrutura', id:'door_iron', name:'Porta de Ferro', cost:{iron_ingot:4}, tile:true },
  { cat:'Estrutura', id:'floor', name:'Piso de Madeira', cost:{logs:2}, tile:true },
  { cat:'Estrutura', id:'floor_stone', name:'Piso de Pedra', cost:{stone:2}, tile:true },
  { cat:'Estrutura', id:'pier', name:'Cais de Madeira', cost:{logs:3}, tile:true, desc:'Sobre a água, a partir da margem' },
  { cat:'Defesa', id:'fence', name:'Cerca de Madeira', cost:{logs:2}, tile:true },
  { cat:'Defesa', id:'fence_stone', name:'Mureta de Pedra', cost:{stone:2}, tile:true },
  { cat:'Defesa', id:'gate', name:'Portão de Madeira', cost:{logs:4}, tile:true, desc:'Com tranca' },
  { cat:'Defesa', id:'tower', name:'Torre de Vigia', cost:{logs:12,stone:4}, w:2, h:2, desc:'Suba para atirar em segurança' },
  { cat:'Ofícios', id:'hearth', name:'Forja', cost:{stone:12,iron_ingot:2}, desc:'Funde minério em lingote' },
  { cat:'Ofícios', id:'anvil', name:'Bigorna', cost:{iron_ingot:8}, desc:'Ferraria: armas e armaduras' },
  { cat:'Ofícios', id:'workbench', name:'Bancada', cost:{logs:6,nails:10}, desc:'Carpintaria e flecharia' },
  { cat:'Ofícios', id:'loom', name:'Tear', cost:{logs:8,nails:6}, desc:'Alfaiataria' },
  { cat:'Ofícios', id:'cauldron', name:'Mesa de Alquimia', cost:{iron_ingot:3,stone:4}, desc:'Poções' },
  { cat:'Casa', id:'storage', name:'Baú', cost:{logs:4,nails:4} },
  { cat:'Casa', id:'bed', name:'Cama', cost:{logs:5,cloth_bolt:2}, h:2 },
  { cat:'Casa', id:'candle', name:'Candelabro', cost:{iron_ingot:1,candle:3}, desc:'Luz sem fogo' },
  { cat:'Casa', id:'banner', name:'Estandarte', cost:{logs:2,cloth_bolt:2} },
  { cat:'Casa', id:'chair', name:'Cadeira', cost:{logs:2} }, { cat:'Casa', id:'table', name:'Mesa', cost:{logs:4} }, { cat:'Casa', id:'bookcase', name:'Estante', cost:{logs:6} },
  { cat:'Acampamento', id:'campfire', name:'Fogueira', cost:{logs:2}, desc:'Luz e cozinha' },
  { cat:'Acampamento', id:'tent', name:'Tenda', cost:{cloth_bolt:4,logs:2}, w:2, desc:'Dormir em qualquer lugar' },
  { cat:'Acampamento', id:'bedroll', name:'Saco de Dormir', cost:{cloth_bolt:2}, h:2 },
  { cat:'Desmontar', id:'scrap', name:'Desmontar', cost:{}, desc:'Desmonta o que você construiu e móveis' },
);
BUILD_CATS.length=0; BUILD_CATS.push('Estrutura','Defesa','Ofícios','Casa','Acampamento','Desmontar');
Object.assign(SCRAP_YIELD, { wall_stone:{stone:2}, window_iron:{iron_ingot:1}, door_iron:{iron_ingot:2}, floor_stone:{stone:1}, fence_stone:{stone:1}, hearth:{stone:6}, anvil:{iron_ingot:4},
  workbench:{logs:3}, loom:{logs:4}, cauldron:{iron_ingot:1,stone:2}, candle:{iron_ingot:1}, banner:{logs:1}, chair:{logs:1}, table:{logs:2}, bookcase:{logs:3},
  wall:{logs:2}, window:{logs:1}, door:{logs:2}, floor:{logs:1}, fence:{logs:1}, gate:{logs:2}, tower:{logs:6,stone:2}, storage:{logs:2}, bed:{logs:2}, tent:{cloth_bolt:2,logs:1}, bedroll:{cloth_bolt:1},
  tree:{logs:2}, pine:{logs:2}, palm:{logs:1}, deadtree:{logs:1}, campfire:{logs:1} });
const _placeTile = placeTile;
placeTile = function(kind,x,y,st){
  const base={wall_stone:'wall',window_iron:'window',door_iron:'door',floor_stone:'floor',fence_stone:'fence'}[kind];
  if(!base){ const r=_placeTile(kind,x,y,st); if(kind==='wall'||kind==='window'||kind==='door') { mat[idx(x,y)]=11; dirtyChunks(x,y); } return r; }
  const r=_placeTile(base,x,y,st); r.t=kind; const i=idx(x,y);
  if(base==='wall'||base==='window'||base==='door') mat[i]=9; if(base==='floor') map[i]=TL.CONC; if(base==='fence'){ map[i]=TL.WALL; mat[i]=10; refreshWalk(x,y); } if(kind==='door_iron') r.door.iron=true;
  dirtyChunks(x,y); return r;
};
const _placeObj = placeObject;
placeObject = function(type,x,y,st){ const o=_placeObj(type,x,y,st); if(type==='hearth'){ o.kind='forge'; o.light=true; o.seed=5; } return o; };
// textos do modo construção
const _rbb = renderBuildBar; renderBuildBar = function(hb){ _rbb(hb); };
if(ITEMS.cloth_bolt) ITEMS.cloth=ITEMS.cloth||ITEMS.cloth_bolt;
buildCat='Estrutura';
(function(){ const col={wall:'#7a5a3a',wall_stone:'#8a8680',window:'#7a5a3a',window_iron:'#5a5e66',door:'#6a4a2a',door_iron:'#4a4e56',floor:'#8a6a44',floor_stone:'#6a6660',pier:'#5e4630',fence:'#7a5a3a',fence_stone:'#7a7670',gate:'#6a4a2a'};
  for(const p of BUILD){ const k='b_'+p.id; const c=document.createElement('canvas'); c.width=16; c.height=16; const g=c.getContext('2d');
    if(p.tile){ g.fillStyle=col[p.id]||'#7a5a3a'; if(/fence/.test(p.id)){ g.fillRect(1,6,14,3); g.fillRect(2,3,2,11); g.fillRect(12,3,2,11); } else if(/floor|pier/.test(p.id)){ g.fillRect(1,1,14,14); g.fillStyle='rgba(0,0,0,.25)'; for(let y=4;y<15;y+=4) g.fillRect(1,y,14,1); }
      else { g.fillRect(2,1,12,14); g.fillStyle='rgba(0,0,0,.3)'; for(let y=4;y<15;y+=4) g.fillRect(2,y,12,1); if(/window/.test(p.id)){ g.fillStyle='#8ab0c8'; g.fillRect(5,4,6,6); } if(/door|gate/.test(p.id)){ g.fillStyle='#2a1a10'; g.fillRect(5,4,6,11); g.fillStyle='#d8b040'; g.fillRect(9,9,1,1); } } }
    else if(p.id==='scrap'){ g.fillStyle='#c8ccd4'; g.fillRect(3,3,2,10); g.fillRect(3,3,8,2); g.fillStyle='#6a4628'; g.fillRect(9,7,2,7); }
    else { try{ g.save(); g.translate(0,2); g.scale(.85,.85); drawObj(g,{type:p.id,x:0,y:0,w:1,h:1,kind:p.id==='hearth'?'forge':undefined,lit:true,seed:1,v:0},0,0,0); g.restore(); }catch(e){ g.fillStyle='#8a6a44'; g.fillRect(3,3,10,10); } }
    ICONS[k]=c.toDataURL(); } })();

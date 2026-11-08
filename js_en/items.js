'use strict';
// =====================================================================
// OUTREMER — todos os itens do Outremer 3D (D3, gerado de data/) no jogo em pixel:
// 252 itens-base, 10 espaços de equipamento, 5 raridades, afixos, conjuntos, únicos e cores (hues).
// Carrega depois de arms.js.
// =====================================================================
const BASE3D = D3['items/base'].items;
const SKMAP = { swordsmanship:'espadas', mace_fighting:'macas', axe_fighting:'machados', fencing:'esgrima', archery:'arcos', tactics:'taticas', wrestling:'briga',
  parrying:'aparar', magery:'magia', evaluating_intelligence:'avaliar', meditation:'meditacao', resisting_spells:'resistir', blacksmithing:'ferraria', carpentry:'carpintaria',
  tailoring:'alfaiataria', alchemy:'alquimia', tinkering:'engenhocas', cooking:'culinaria', mining:'mineracao', lumberjacking:'lenhador', fishing:'pesca', stealth:'furtividade',
  hiding:'ocultacao', snooping:'bisbilhotar', lockpicking:'arrombar', animal_taming:'domar', veterinary:'veterinaria', healing:'cura', anatomy:'anatomia', camping:'acampamento',
  tracking:'rastreamento', herding:'pastoreio', musicianship:'musica', provocation:'provocacao', peacemaking:'pacificacao', inscription:'inscricao', detecting_hidden:'detectar',
  poisoning:'envenenar', bowcraft_fletching:'flecharia' };
const MATCOL = { iron:'#8a8e96', leather:'#6a4428', cloth:'#8a7a5a', linen:'#d8ccb0', wool:'#6a5a4a', silk:'#7a2a5a', fur:'#8a6a4a', bronze:'#a8783a', blackiron:'#3a3a44',
  gold:'#d8b040', silver:'#c8ccd4', wood:'#7a5430', copper:'#b86a3a', gem:'#3a8ad8', stone:'#7a7670', glass:'#a8c8d8', food:'#c8963a', paper:'#e0d4b0', wax:'#e8e0c0' };

// ---------------- armas: cada id do 3D usa a forma da família em pixel ----------------
Object.assign(WSHAPE, {
  pickaxe:[[-3,0,12,1,WOOD],[8,-4,1,9,IRON],[9,-3,1,7,'#9aa0a8'],[7,-5,1,1,IRON],[7,4,1,1,IRON]],
  smith_hammer:[[-2,0,9,1,WOOD],[6,-2,3,5,IRON],[6,-2,3,1,'#9aa0a8']],
  shovel:[[-3,0,12,1,WOOD],[9,-1,4,3,IRON],[13,0,1,1,IRON]],
  fishing_pole:[[-3,0,16,1,'#8a6a3a'],[12,0,4,1,'#c8a870'],[5,-1,1,1,IRON]],
  saw:[[-2,0,3,2,WOOD],[1,0,8,2,'#b8bcc0'],[1,2,8,1,'#7a7e88']],
  crook:[[-3,0,14,1,WOOD],[11,-1,1,1,WOOD],[11,-2,1,1,WOOD],[12,-3,2,1,WOOD],[14,-2,1,2,WOOD]],
  lute:[[-1,0,6,1,'#5a3a1e'],[5,-2,5,5,'#a8783a'],[7,0,1,1,'#2a1a10'],[-2,-1,1,3,'#5a3a1e']],
  kris:[[-2,0,2,1,LEATH],[0,-1,1,3,GOLD],[1,0,1,1,A_S],[2,1,1,1,A_S],[3,0,1,1,A_S],[4,-1,1,1,A_S],[5,0,1,1,A_H]],
  scepter:[[-2,0,9,1,GOLD],[7,-1,3,3,GOLD],[8,0,1,1,'#c83a2a'],[10,0,1,1,GOLD]],
  war_fork:[[-3,0,13,1,WOOD],[10,-2,1,5,IRON],[11,-2,3,1,A_S],[11,2,3,1,A_S]],
  glaive:[[-3,0,14,1,WOOD],[11,0,1,1,IRON],[12,-1,4,2,A_S],[16,-1,1,1,A_H]],
  tool:[[-1,0,6,1,WOOD],[5,-1,2,3,IRON]],
});
const WFAM = { sword:'longsword', arming_sword:'longsword', sabre:'scimitar', cutlass:'scimitar', cleaver:'falchion', skinning_knife:'dagger', throwing_knife:'dagger',
  flanged_mace:'mace', maul:'warhammer', axe:'hand_axe', hatchet:'hand_axe', war_axe:'battleaxe', broadaxe:'battleaxe', bardiche:'battleaxe', morning_star:'morningstar',
  lance:'pike', javelin:'spear', shortbow:'bow', composite_bow:'longbow', hand_crossbow:'crossbow', arbalest:'heavy_crossbow', quarterstaff:'staff',
  sewing_kit:'tool', mortar_pestle:'tool', tinker_tools:'tool', lockpick:'tool', tongs:'tool', scribe_pen:'tool', fletching_kit:'tool', scissors:'tool' };
const RANGE = { dagger:18, kris:18, tool:16, longsword:25, shortsword:22, scimitar:23, falchion:23, mace:23, warhammer:24, club:22, hand_axe:22, battleaxe:25, double_axe:26,
  spear:33, pike:38, halberd:34, glaive:35, war_fork:33, staff:26, wand:18, scepter:22, morningstar:23, flail:24, scythe:30, pickaxe:22, smith_hammer:20, shovel:22,
  fishing_pole:20, saw:18, crook:26, lute:16 };
const FAMSHAPES = new Set(Object.keys(WSHAPE));
for(const it of BASE3D){
  if(it.slot!=='hand1') continue;
  const fam = WSHAPE[it.id] ? it.id : (WFAM[it.id] || 'tool');
  if(!WSHAPE[it.id]) WSHAPE[it.id] = WSHAPE[fam];
  if(!OW[it.id]){
    const avg = it.dmg ? (it.dmg[0]+it.dmg[1])/2 : 4, ranged = typeof WSHAPE[fam]==='string';
    OW[it.id] = ranged
      ? { name:it.name, dmg:Math.round(avg*2.1), range:fam.includes('long')||fam.includes('heavy')?300:240, cd:(it.speed||3)*.32, spread:.05, noise:4, ranged:true,
          ammo:fam.includes('crossbow')?'bolts':'arrows', len:8, col:WOOD, skill:SKMAP[it.skill]||'arcos' }
      : { name:it.name, dmg:Math.round(avg*2), range:RANGE[fam]||22, arc:1.3, cd:Math.max(.3,(it.speed||2.5)*.21), st:Math.round(avg*.7)+3, knock:Math.round(avg*.4)+2,
          len:10, col:MATCOL[it.material]||'#8a8e96', skill:SKMAP[it.skill]||'briga' };
  }
  ITEMS[it.id] = Object.assign(ITEMS[it.id]||{}, { name:ITEMS[it.id]?.name||it.name, stack:1, weapon:true, desc:it.desc, tool:it.type==='tool' });
}
Object.assign(WEAPONS, OW);
ITEMS.arrow = ITEMS.arrows; ITEMS.crossbow_bolt = ITEMS.bolts;

// ---------------- equipamento: 10 espaços como no paperdoll do UO ----------------
const SLOT3D = { head:'head', torso:'body', legs:'legs', feet:'feet', hands:'hands', arms:'arms', hand2:'shield', cloak:'cloak', neck:'neck', ring:'ring' };
const GEAR_SLOTS = ['head','neck','cloak','body','arms','hands','ring','legs','feet','shield'];
const SLOT_NAME = { head:'Head', neck:'Neck', cloak:'Cloak', body:'Torso', arms:'Arms', hands:'Hands', ring:'Ring', legs:'Legs', feet:'Feet', shield:'Shield' };
const KIND3D = { leather_hood:'hood', chain_coif:'coif', nasal_helm:'nasal', kettle_helm:'kettle', greathelm:'great', face_helm:'great', keffiyeh:'hood', turban:'turban',
  leather_cap:'cap', padded_coif:'hood', bascinet:'bascinet', spangenhelm:'nasal', scale_coif:'coif', bronze_helm:'nasal', straw_hat:'kettle', wizard_hat:'wizard',
  linen_coif:'hood', bandana:'bandana', fur_hat:'cap', iron_circlet:'circlet',
  gambeson:'quilt', leather_armor:'leather', studded_leather:'studded', hauberk:'chain', lorigao:'chain', loriga:'scale', plate_torso:'plate', lamellar:'scale',
  egyptian_gambeson:'quilt', turkish_cuirass:'plate', crusader_surcoat:'tabard', cazagante:'studded', cloth_shirt:'shirt', pilgrim_habit:'robe', peasant_tunic:'shirt',
  bedouin_robe:'robe', scale_hauberk:'scale', brigandine:'brig', templar_cuirass:'tabard', sergeant_cuirass:'plate', blackiron_hauberk:'chain', bedouin_vest:'leather',
  bronze_cuirass:'plate', hide_tunic:'leather', linen_shirt:'shirt', wool_tunic:'shirt', smith_apron:'apron', monk_robe:'robe', silk_robe:'robe', tabard:'tabard', villager_dress:'robe',
  wooden_shield:'round', buckler:'buckler', kite_shield:'kite', heater_shield:'heater', round_shield:'round', crusader_shield:'cross', tower_shield:'tower', oval_shield:'kite', pavise:'tower',
  templar_mantle:'crosscape', chain_mantle:'mantle', leather_gorget:'gorget', plate_gorget:'gorget', scarf:'scarf', pilgrim_cross:'cross', relicary:'cross' };
const WEARCOL = { crusader_surcoat:'#7a7e86', templar_cuirass:'#a0a6ae', tabard:'#6a6a72', crimson_cloak:'#8a1a14', templar_mantle:'#e8e0d0', crusader_shield:'#e8e0d0',
  wizard_hat:'#3a2a6a', silk_robe:'#5a1a4a', monk_robe:'#5a4a36', pilgrim_habit:'#6a5a44', bedouin_robe:'#d8c8a0', straw_hat:'#d8b860', keffiyeh:'#e8e0d0', turban:'#e8e0d0' };
for(const it of BASE3D){
  const slot = SLOT3D[it.slot]; if(!slot) continue;
  if(!WEAR[it.id]) WEAR[it.id] = { slot, armor:(it.armor||0)/57, col:WEARCOL[it.id]||MATCOL[it.material]||'#8a7a5a', kind:KIND3D[it.id], name:it.name, mat:it.material };
  else { WEAR[it.id].slot=slot; WEAR[it.id].mat=it.material; }
  if(it.id==='templar_cuirass'||it.id==='crusader_surcoat') WEAR[it.id].tab = it.id==='templar_cuirass' ? '#e8e0d0' : '#e8e0d0';
  ITEMS[it.id] = Object.assign(ITEMS[it.id]||{}, { name:ITEMS[it.id]?.name||it.name, stack:1, wear:slot, desc:it.desc });
}
// as peças que já existiam em pixel também ganham material
for(const [id,w] of Object.entries(WEAR)) if(!w.mat) w.mat = /chain|plate|helm|bascinet|scale|brig|kettle|nasal|mail|great|horned|coif|tabard/.test(id) ? 'iron' : /robe|hood|hat|gambeson|quilt/.test(id)||w.kind==='robe' ? 'cloth' : 'leather';
// os outros (comida, poções, minérios, móveis, escrituras...)
const USE3D = {
  heal_potion:{hp:25,msg:'You feel your wounds close.'}, greater_heal_potion:{hp:50,msg:'A wave of warmth closes your wounds.'}, mana_potion:{mana:30,msg:'Your mind clears.'},
  refresh_potion:{st:50,msg:'The weariness fades.'}, greater_refresh_potion:{st:100,msg:'You feel renewed.'}, cure_potion:{cure:1,msg:'The poison leaves your blood.'}, greater_cure_potion:{cure:1,msg:'The poison leaves your blood.'},
  strength_potion:{buff:'str',msg:'Your arms grow stronger.'}, agility_potion:{buff:'dex',msg:'You feel more agile.'}, night_sight_potion:{buff:'night',msg:'The darkness lifts.'},
  bread:{hp:4}, dried_meat:{hp:6}, dates:{hp:3}, figs:{hp:3}, cheese:{hp:5}, roasted_meat:{hp:9}, cooked_fish:{hp:8}, flatbread:{hp:4}, ale:{st:20}, wine:{st:20}, water_flask:{st:15},
};
for(const it of BASE3D){
  if(SLOT3D[it.slot] || it.slot==='hand1') continue;
  const u=USE3D[it.id], stack = ['furniture','deed'].includes(it.type) ? 5 : 99;
  if(!ITEMS[it.id]) ITEMS[it.id] = { name:it.name, stack, value:it.value, desc:it.desc };
  if(u && !ITEMS[it.id].use) ITEMS[it.id].use = ()=>{
    if(u.hp) player.health=Math.min(player.maxHealth, player.health+u.hp);
    if(u.st) player.stamina=Math.min(player.maxStamina, player.stamina+u.st);
    if(u.mana) player.mana=Math.min(player.maxMana||100,(player.mana||0)+u.mana);
    if(u.cure) player.poison=0;
    if(u.buff){ player.buffs=player.buffs||{}; player.buffs[u.buff]=180; recalcGear(); }
    return { msg:u.msg||`You use ${it.name}.`, consume:true }; };
  ITEMS[it.id].mat=it.material; ITEMS[it.id].kind3d=it.type;
}
for(const it of BASE3D) if(PRICE[it.id]===undefined) PRICE[it.id]=it.value||5;

// ---------------- raridade, afixos, conjuntos, únicos, cores ----------------
const RARITY = { comum:{name:'Common',col:'#e0d8c8'}, refinado:{name:'Refined',col:'#6aa0ff'}, raro:{name:'Rare',col:'#f0d040'}, conjunto:{name:'Set',col:'#40d060'}, lendario:{name:'Legendary',col:'#ff9a30'} };
const AFF = D3['items/affixes'], SETS = D3['items/sets'].sets, UNIQ = D3['items/uniques'].uniques, RDROP = D3['items/rarity'].drop, RNAMES = D3['items/rarity'].rare_names;
const HUES = {}; for(const h of D3.hues.hues) HUES[h.id]=h;
const HUE_GROUPS = {}; for(const h of D3.hues.hues) (HUE_GROUPS[h.group]=HUE_GROUPS[h.group]||[]).push(h.id);
const STAT_NAME = { armor_flat:'Armour', armor_pct:'% armour', def_chance:'% defence', dex:'Dexterity', dmg_flat:'Damage', dmg_pct:'% damage', durability:'Durability',
  hit_chance:'% to hit', hp:'Life', int:'Intelligence', luck:'Luck', mana:'Mana', regen_hp:'Life regeneration', regen_mana:'Mana regeneration', regen_stam:'Stamina regeneration',
  res_cold:'% cold resist.', res_energy:'% energy resist.', res_fire:'% fire resist.', res_poison:'% poison resist.', stam:'Stamina', str:'Strength', swing_speed:'% swing speed' };
function statName(s){ return s.startsWith('skill:') ? (SKILL_NAMES[SKMAP[s.slice(6)]]||s.slice(6)) : (STAT_NAME[s]||s); }
function catOf(id){ if(ITEMS[id]?.weapon) return 'weapon'; const w=WEAR[id]; if(!w) return null;
  if(w.slot==='shield') return 'shield'; if(w.slot==='ring'||w.slot==='neck') return 'jewelry'; return ['cloth','linen','wool','silk','fur'].includes(w.mat) ? 'clothing' : 'armor'; }
const isGear = id => !!catOf(id);
const rint = (a,b)=>a+Math.floor(Math.random()*(b-a+1));
function rollRarity(lvl, luck){
  const row = RDROP.find(r=>lvl>=r.level[0]&&lvl<=r.level[1]) || RDROP[0];
  const w = {...row}; delete w.level; const L=1+(luck||0)/100; w.refinado*=L; w.raro*=L; w.conjunto*=L; w.lendario*=L;
  let tot=0; for(const k in w) tot+=w[k]; let x=Math.random()*tot; for(const k in w){ x-=w[k]; if(x<=0) return k; } return 'comum';
}
function pickAffix(list, cat, lvl){ const ok=list.filter(a=>a.applies.includes(cat) && (a.tier||1) <= 1+Math.floor(lvl/12)); return ok.length ? rpick(ok) : null; }
function makeInst(id, rar, lvl){
  rar = rar || 'comum'; lvl = lvl || 1;
  const cat=catOf(id); if(!cat) return { id, qty:1 };
  if(rar==='lendario'){ const opts=UNIQ.filter(u=>ITEMS[u.base] && (u.level||1)<=lvl+12); if(opts.length){ const u=rpick(opts); return { id:u.base, qty:1, rar, uq:u.id, hue:u.hue, aff:u.affixes.map(a=>[...a]) }; } rar='raro'; }
  if(rar==='conjunto'){ const s=rpick(SETS), p=rpick(s.pieces.filter(p=>ITEMS[p.base])); if(p) return { id:p.base, qty:1, rar, set:s.id, hue:p.hue, aff:p.affixes.map(a=>[...a]) }; rar='raro'; }
  const inst = { id, qty:1, rar, aff:[] };
  const roll = a => [a.stat, rint(a.range[0], a.range[1])];
  if(rar==='refinado'){ const n=Math.random()<.5?1:2; const p=pickAffix(AFF.prefix,cat,lvl), s=pickAffix(AFF.suffix,cat,lvl);
    if(n===2 || Math.random()<.5){ if(p){ inst.aff.push(roll(p)); inst.pre=p.name; } } if(n===2 || !inst.pre){ if(s){ inst.aff.push(roll(s)); inst.suf=s.name; } } }
  if(rar==='raro'){ const n=rint(3,4), used=new Set(); for(let i=0;i<n*3 && inst.aff.length<n;i++){ const a=pickAffix(Math.random()<.5?AFF.prefix:AFF.suffix,cat,lvl+10); if(a && !used.has(a.stat)){ used.add(a.stat); inst.aff.push(roll(a)); } }
    inst.nm = `${rpick(RNAMES.first)} ${rpick(RNAMES.second||RNAMES.first)}`; }
  const dyeable = ['clothing'].includes(cat) || ['leather','cloth','linen','wool','silk','fur'].includes(WEAR[id]?.mat);
  if(dyeable && (rar!=='comum' || Math.random()<.5)) inst.hue = rpick(HUE_GROUPS[rar==='comum'?'comum':rpick(['comum','raro','material'])] || HUE_GROUPS.comum);
  return inst;
}
function instName(s){
  if(!s) return ''; const base=ITEMS[s.id]?.name||s.id;
  if(s.uq){ const u=UNIQ.find(u=>u.id===s.uq); return u?u.name:base; }
  if(s.set){ const st=SETS.find(x=>x.id===s.set); return `${base} — ${st?st.name:''}`; }
  if(s.nm) return `${s.nm}, ${base}`;
  return [base, s.pre, s.suf].filter(Boolean).join(' ');
}
const rarCol = s => RARITY[s&&s.rar||'comum'].col;
function hueHex(s){ return s && s.hue && HUES[s.hue] ? HUES[s.hue].hex : null; }
// chave de desenho com a cor aplicada (o desenho lê WEAR[id].col)
function drawKey(s){ if(!s) return null; const hx=hueHex(s); if(!hx||!WEAR[s.id]) return s.id; const k=s.id+'@'+s.hue;
  if(!WEAR[k]) WEAR[k]={...WEAR[s.id], col:hx}; return k; }

// ---------------- o que o jogador está vestindo ----------------
function gearOf(p){ p=p||player; if(!p.gi) p.gi={}; return p.gi; }
function recalcGear(){
  if(!player) return; const gi=gearOf(), b={}; const add=(s,v)=>b[s]=(b[s]||0)+v;
  const all = Object.values(gi).filter(Boolean); const w=player.wInst && inv.includes(player.wInst) && player.wInst.id===player.weapon ? player.wInst : null; if(w) all.push(w);
  for(const s of all) for(const [k,v] of s.aff||[]) add(k,v);
  const sets={}; for(const s of all) if(s.set) sets[s.set]=(sets[s.set]||0)+1;
  for(const [id,n] of Object.entries(sets)){ const st=SETS.find(x=>x.id===id); if(st) for(const [need,list] of Object.entries(st.bonus||{})) if(n>=+need) for(const [k,v] of list) add(k,v); }
  if(player.buffs){ if(player.buffs.str) add('str',10); if(player.buffs.dex) add('dex',10); }
  player.gb=b; player.sets=sets;
  const baseHp = player.look.race==='anao' ? 115 : 100;
  player.maxHealth = baseHp + (b.hp||0) + (b.str||0); player.health=Math.min(player.health, player.maxHealth);
  player.maxStamina = 100 + (b.stam||0) + (b.dex||0)*.5;
  player.maxMana = 50 + (b.int||0)*2 + (b.mana||0) + (player.look.race==='elfo'?15:0) + skill('magia')*.5;
}
const gb = k => (player && player.gb && player.gb[k]) || 0;
function totalArmor(){
  const e=player.equip; let a=0; for(const sl of GEAR_SLOTS){ const id=e[sl]; if(id && WEAR[id]) a+=WEAR[id].armor; }
  a = a*(1+gb('armor_pct')/100) + gb('armor_flat')/100; return Math.min(.75, a);
}
armorOf = e => (e===player?.equip) ? totalArmor() : Math.min(.65,(e&&e.head&&WEAR[e.head]?WEAR[e.head].armor:0)+(e&&e.body&&WEAR[e.body]?WEAR[e.body].armor:0));
partArmor = part => totalArmor();
const _dmgR = damageRaider;
damageRaider = function(r,dmg,ang,knock,src){
  if(!src || src===player){ dmg = dmg*(1+(gb('dmg_pct')+gb('str')*.5)/100) + gb('dmg_flat');
    const sk=(WEAPONS[player.weapon]||{}).skill; for(const [k,v] of Object.entries(player.gb||{})) if(k.startsWith('skill:') && SKMAP[k.slice(6)]===sk) dmg*=1+v/150;
    const w=player.wInst; if(w && w.uq){ const u=UNIQ.find(u=>u.id===w.uq); if(u && u.effect==='life_leech') player.health=Math.min(player.maxHealth, player.health+dmg*.06); } }
  _dmgR(r,dmg,ang,knock,src);
};
const _hurtP = hurtPlayer;
hurtPlayer = function(dmg,src,part,blunt){ if(Math.random()*100 < gb('def_chance')){ toast('You dodge.'); return; } return _hurtP(dmg,src,part,blunt); };
const _upd2 = update;
update = function(dt){ _upd2(dt);
  if(player && running){ const r=gb('regen_hp'); if(r) player.health=Math.min(player.maxHealth, player.health+r*dt*.15);
    if(player.maxMana){ player.mana=Math.min(player.maxMana,(player.mana??player.maxMana)+(0.6+gb('regen_mana')*.3+skill('meditacao')/60)*dt); }
    const mb=document.getElementById('bar-mana'); if(mb) mb.style.width=Math.round(100*(player.mana||0)/(player.maxMana||1))+'%';
    if(player.buffs) for(const k in player.buffs){ player.buffs[k]-=dt; if(player.buffs[k]<=0){ delete player.buffs[k]; recalcGear(); } } }
};

// ---------------- vestir, tirar, guardar: as peças são objetos com raridade ----------------
wearSlot = function(i){
  const s=inv[i], slot=ITEMS[s.id].wear, gi=gearOf(), old=gi[slot] || (player.equip[slot] ? {id:player.equip[slot],qty:1} : null);
  gi[slot]=s; player.equip[slot]=s.id; inv[i]=old;
  recalcGear(); toast(`Wearing ${instName(s)}. Armour: ${Math.round(totalArmor()*100)}%.`);
  renderHotbar(); if(invOpen) renderInvPanel();
};
unwear = function(slot){
  const gi=gearOf(), s=gi[slot] || (player.equip[slot] ? {id:player.equip[slot],qty:1} : null); if(!s) return;
  const k=inv.findIndex((x,j)=>!x && j>=HOTBAR); const j = k>=0 ? k : inv.findIndex(x=>!x);
  if(j<0){ toast('No room in your backpack.'); return; }
  inv[j]=s; gi[slot]=null; player.equip[slot]=null; recalcGear(); toast(`Took off ${instName(s)}.`); renderHotbar(); if(invOpen) renderInvPanel();
};
const _useSlot = useSlot;
useSlot = function(i){ const s=inv[i]; if(s && ITEMS[s.id]?.weapon){ const was=player.weapon; _useSlot(i); player.wInst = player.weapon===s.id ? s : null; recalcGear(); return; } _useSlot(i); };
moveAll = function(fk,fi,tk,quiet){
  const from=slotArr(fk), to=slotArr(tk), s=from[fi]; if(!s) return; const st=ITEMS[s.id].stack;
  if(st>1) for(let i=0;i<to.length && s.qty>0;i++){ const d=to[i]; if(d&&d.id===s.id&&d.qty<st&&!d.rar){ const m=Math.min(s.qty,st-d.qty); d.qty+=m; s.qty-=m; } }
  if(s.qty>0){ const i=to.findIndex(x=>!x); if(i>=0){ to[i]=s; from[fi]=null; } else if(!quiet) toast('No room.'); } else from[fi]=null;
  if(fk==='inv' && player.weapon===s.id && !hasItem(s.id)) player.weapon='fists';
  invSel=null; if(!quiet) renderInvPanel(); renderHotbar();
};
// item novo: peças ganham raridade conforme a fonte (lootLevel > 0 = saque)
let lootLevel=0, lootLuck=0;
const _addItem = addItem;
addItem = function(id,qty){
  if(!ITEMS[id]){ console.warn('unknown item',id); return 0; }
  if(ITEMS[id].stack>1 || !isGear(id)) return _addItem(id,qty);
  qty=qty||1;
  while(qty>0){ let i = inv.findIndex((x,j)=>!x&&j>=HOTBAR); if(i<0) i=inv.findIndex(x=>!x); if(i<0) break;
    inv[i] = makeInst(id, lootLevel>0 ? rollRarity(lootLevel, lootLuck+gb('luck')) : 'comum', Math.max(1,lootLevel)); qty--;
    if(lootLevel>0 && inv[i].rar!=='comum') toast(`Found: ${instName(inv[i])} (${RARITY[inv[i].rar].name})`); }
  renderHotbar(); if(invOpen) renderInvPanel(); return qty;
};
function addInst(s){ let i=inv.findIndex((x,j)=>!x&&j>=HOTBAR); if(i<0) i=inv.findIndex(x=>!x); if(i<0) return false; inv[i]=s; renderHotbar(); if(invOpen) renderInvPanel(); return true; }
// saque de baús e de monstros mortos vira "nível" pela distância da capital
const _fsItems = finishSearch;
finishSearch = function(...a){ const c=cityCenter ? cityCenter() : null; lootLevel = c ? Math.max(1, Math.round(Math.hypot(player.x-c.x,player.y-c.y)/T/6)) : 3;
  try{ return _fsItems(...a); } finally { lootLevel=0; } };

// ---------------- salvar as peças com raridade ----------------
const _ser3 = serialize;
serialize = function(){ const s=_ser3(); s.gi=gearOf(); s.equip=player.equip; s.wIdx=player.wInst?inv.indexOf(player.wInst):-1; return s; };
const _app3 = applySave;
applySave = function(s){ _app3(s); player.gi=s.gi||{}; if(s.equip) player.equip=Object.assign({},s.equip);
  for(const sl of GEAR_SLOTS) if(player.gi[sl] && !player.equip[sl]) player.equip[sl]=player.gi[sl].id;
  player.wInst = s.wIdx>=0 ? inv[s.wIdx] : null; recalcGear(); };
const _enter3 = enterGame;
enterGame = function(msg){ if(player){ gearOf(); for(const sl of GEAR_SLOTS) if(player.equip[sl]===undefined) player.equip[sl]=null; recalcGear(); } _enter3(msg); };

for(const it of BASE3D) if(['resource','furniture','deed','misc','tool'].includes(it.type) || SLOT3D[it.slot]) BAG_FIRST.add(it.id);

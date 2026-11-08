'use strict';
// =====================================================================
// AFTER LIGHT — Prototype v0.4
// Fixed hand-laid world (js/world.js), chunked renderer, building types
// =====================================================================

// ---------------- Options (kept in this browser) ----------------
const OPTS = (()=>{ const d={shake:true,blood:true,dayLen:'normal'}; try{ return Object.assign(d, JSON.parse(localStorage.getItem('afterlight_opts')||'{}')); }catch(e){ return d; } })();
function saveOpts(){ try{ localStorage.setItem('afterlight_opts',JSON.stringify(OPTS)); }catch(e){} }

// ---------------- Professions ----------------
const PROFESSIONS = {
  engineer:  { name:'Engineer',  desc:'Cheaper builds; scraps faster and gets more back. Starts with materials', bonuses:{ buildSpeed:1.4, materialCost:0.7 } },
  medic:     { name:'Medic',     desc:'Heals better and uses fewer medical items',                bonuses:{ healPower:1.5, medCost:0.6 } },
  police:    { name:'Police',    desc:'Starts armed. Better firearm accuracy and fire rate',      bonuses:{ accuracy:1.3, recoilControl:1.4 } },
  athlete:   { name:'Athlete',   desc:'Runs faster, higher stamina and strength',                 bonuses:{ speed:1.25, maxStamina:1.4, strength:1.3 } },
  lawyer:    { name:'Lawyer',    desc:'Better dialogue options and trading prices',   soon:true,  bonuses:{ persuasion:1.4, tradePrice:0.8 } },
  scavenger: { name:'Scavenger', desc:'Finds more and better loot, searches faster',               bonuses:{ lootChance:1.35, lootQuality:1.25, searchSpeed:1.4 } },
};

// ---------------- Items ----------------
const MATERIAL = () => ({ msg:'Crafting material — building comes in a later version.', consume:false });
const eat = (h, msg, stam=0) => () => { if(player.hunger>97 && !stam) return {msg:'Not hungry.',consume:false};
  player.hunger=Math.min(100,player.hunger+h); if(stam) player.stamina=Math.min(player.maxStamina,player.stamina+stam); return {msg,consume:true}; };
const heal = (hp, msg, med=true) => () => { if(player.health>=player.maxHealth) return {msg:'You are not hurt.',consume:false};
  player.health=Math.min(player.maxHealth,player.health+hp*mod('healPower'));
  const saved = med && Math.random() > mod('medCost'); return {msg: saved ? msg+' (supplies saved)' : msg, consume:!saved}; };
const valuable = v => function(){ return {msg:`${this.name}: worth about $${v} to a trader — trading comes later.`,consume:false}; };
const ITEMS = {
  beans:   { name:'Canned Beans',  stack:5,  use:eat(30,'Cold beans. Still food.') },
  chips:   { name:'Potato Chips',  stack:5,  use:eat(12,'Stale, salty, perfect.') },
  soda:    { name:'Soda',          stack:5,  use(){ player.thirst=Math.min(100,player.thirst+20); player.stamina=Math.min(player.maxStamina,player.stamina+40); return {msg:'Warm sugar rush.',consume:true}; } },
  water:   { name:'Clean Water',   stack:5,  desc:'Safe to drink. Leaves an empty bottle.', use(){ if(player.thirst>97) return {msg:'Not thirsty.',consume:false}; drink(45,true,'Clean, cool water.'); player.stamina=Math.min(player.maxStamina,player.stamina+25); addItem('bottle',1); return {msg:'',consume:true}; } },
  dirty_water:{ name:'Dirty Water',stack:5, desc:'River or lake water. Boil it at a campfire — or risk getting sick.', use(){ if(player.thirst>97) return {msg:'Not thirsty.',consume:false}; drink(40,false,'You gulp the murky water.'); addItem('bottle',1); return {msg:'',consume:true}; } },
  bottle:  { name:'Empty Bottle',  stack:10, desc:'Fill it at a river, lake or pool (use it at the water\'s edge).', use(){ const w=waterNear(2); if(!w) return {msg:'Stand at a river, lake or pool to fill it.',consume:false}; if(w.sea) return {msg:'Salt water — undrinkable.',consume:false}; addItem('dirty_water',1); return {msg:'Filled. Boil it before drinking.',consume:true}; } },
  bandage: { name:'Bandage',       stack:5,  desc:'Stops bleeding on one body part, or heals a little.', use(){ return applyMedical('bandage', invOpen?bodySel:null); } },
  splint:  { name:'Splint',        stack:3,  desc:'Sets a broken arm or leg.', use(){ return applyMedical('splint', invOpen?bodySel:null); } },
  pills:   { name:'Painkillers',   stack:8,  desc:'Dulls the effect of injuries for a while.', use(){ return applyMedical('pills'); } },
  firstaid:{ name:'First Aid Kit', stack:2,  desc:'Stops all bleeding and heals every body part.', use(){ return applyMedical('firstaid'); } },
  meat_raw:{ name:'Raw Meat',      stack:8,  desc:'Cook it at a campfire. Eating it raw is a gamble.', use(){ player.hunger=Math.min(100,player.hunger+15); if(Math.random()<.5) player.sick=Math.max(player.sick,90); return {msg:'You choke down raw meat.',consume:true}; } },
  meat_cooked:{ name:'Cooked Meat', stack:8, use:eat(40,'Hot, greasy, wonderful.') },
  fish_raw:{ name:'Raw Fish',      stack:8,  desc:'Cook it at a campfire.', use(){ player.hunger=Math.min(100,player.hunger+10); if(Math.random()<.4) player.sick=Math.max(player.sick,80); return {msg:'Raw fish. Bold.',consume:true}; } },
  fish_cooked:{ name:'Cooked Fish', stack:8, use:eat(28,'Flaky and smoky.') },
  berries: { name:'Wild Berries',  stack:10, use(){ player.hunger=Math.min(100,player.hunger+6); player.thirst=Math.min(100,player.thirst+4); return {msg:'Tart and sweet.',consume:true}; } },
  hide:    { name:'Animal Hide',   stack:10, use:MATERIAL },
  logs:    { name:'Logs',          stack:10, desc:'Firewood and building timber. Chop trees with an axe.', use:MATERIAL },
  rod:     { name:'Fishing Rod',   stack:1,  desc:'Use it at the water\'s edge, on a pier or from a boat.', use(){ return startFishing(); } },
  gascan:  { name:'Gas Can (full)',stack:2,  desc:'Refuel a vehicle from its menu (E next to it).', use(){ return {msg:'Stand next to a vehicle and press E to refuel it.',consume:false}; } },
  gascan_e:{ name:'Gas Can (empty)',stack:2, desc:'Search a wrecked car while carrying it to siphon fuel.', use(){ return {msg:'Search a wrecked car to siphon what\'s left in its tank.',consume:false}; } },
  hatchet: { name:'Hatchet',       stack:1, weapon:true, desc:'Chops trees for logs. Decent weapon.' },
  matches: { name:'Matches',       stack:10, use(){ player.matchT=10; return {msg:'You strike a match. It won\'t last.',consume:true}; } },
  lantern: { name:'Oil Lantern',   stack:1,  use(){ player.lanternOn=!player.lanternOn; renderHotbar();
              return {msg: player.lanternOn ? 'Lantern lit. Anyone out there can see it too.' : 'Lantern off.', consume:false}; } },
  scrap:   { name:'Scrap Metal',   stack:20, use:MATERIAL },
  nails:   { name:'Nails',         stack:30, use:MATERIAL },
  planks:  { name:'Planks',        stack:20, use:MATERIAL },
  cloth:   { name:'Cloth',         stack:20, use:MATERIAL },
  spiked_bat:{ name:'Spiked Bat',  stack:1, weapon:true },
  spear:   { name:'Spear',         stack:1, weapon:true },
  fire_axe:{ name:'Fire Axe',      stack:1, weapon:true },
  helmet_bike:{ name:'Bike Helmet', stack:1, wear:'head' },
  hardhat: { name:'Hard Hat',      stack:1, wear:'head' },
  fire_helmet:{ name:'Firefighter Helmet', stack:1, wear:'head' },
  mil_helmet:{ name:'Military Helmet', stack:1, wear:'head' },
  vest_light:{ name:'Ballistic Vest', stack:1, wear:'body' },
  vest_heavy:{ name:'Plate Carrier',  stack:1, wear:'body' },
  ammo:    { name:'9mm Rounds',    stack:30, use(){ return {msg:'Ammo for a pistol.',consume:false}; } },
  shells:  { name:'Shotgun Shells',stack:20, use(){ return {msg:'Ammo for a shotgun.',consume:false}; } },
  rifle_ammo:{ name:'.308 Rounds', stack:20, use(){ return {msg:'Ammo for a hunting rifle.',consume:false}; } },
  knife:   { name:'Kitchen Knife', stack:1, weapon:true },
  bat:     { name:'Baseball Bat',  stack:1, weapon:true },
  crowbar: { name:'Crowbar',       stack:1, weapon:true },
  pipe:    { name:'Lead Pipe',     stack:1, weapon:true },
  pistol:  { name:'Pistol',        stack:1, weapon:true },
  shotgun: { name:'Shotgun',       stack:1, weapon:true },
  rifle:   { name:'Hunting Rifle', stack:1, weapon:true },
  ring:    { name:'Gold Ring',     stack:5, value:250 },
  necklace:{ name:'Necklace',      stack:5, value:400 },
  watch:   { name:'Luxury Watch',  stack:3, value:600 },
  gold:    { name:'Gold Bar',      stack:3, value:1500 },
  cash:    { name:'Cash ($)',      stack:9999, value:1, desc:'Still accepted by traders — for now.' },
};
for(const it of Object.values(ITEMS)) if(it.value) it.use = valuable(it.value);
const WEAPONS = {
  hatchet: { name:'Hatchet',       dmg:19, range:22, arc:1.2, cd:.55, st:9,  knock:6, len:8,  col:'#8a8e92' },
  fists:   { name:'Fists',         dmg:6,  range:15, arc:1.1, cd:.40, st:4,  knock:3, len:0 },
  knife:   { name:'Kitchen Knife', dmg:14, range:19, arc:1.0, cd:.38, st:6,  knock:3, len:5,  col:'#c8ccd0' },
  bat:     { name:'Baseball Bat',  dmg:22, range:25, arc:1.7, cd:.70, st:12, knock:9, len:10, col:'#9a7448' },
  crowbar: { name:'Crowbar',       dmg:20, range:23, arc:1.4, cd:.60, st:10, knock:7, len:9,  col:'#8a3b30' },
  pipe:    { name:'Lead Pipe',     dmg:18, range:23, arc:1.4, cd:.60, st:10, knock:7, len:9,  col:'#71777c' },
  spiked_bat:{ name:'Spiked Bat',  dmg:30, range:25, arc:1.7, cd:.72, st:12, knock:9, len:10, col:'#8a6a44' },
  fire_axe:{ name:'Fire Axe',      dmg:30, range:24, arc:1.3, cd:.80, st:14, knock:8, len:10, col:'#7a4a2a' },
  spear:   { name:'Spear',         dmg:20, range:32, arc:.6,  cd:.55, st:8,  knock:5, len:13, col:'#7a5a38' },
  pistol:  { name:'Pistol',        dmg:34, range:280, cd:.38, spread:.13, noise:20, ranged:true, ammo:'ammo', len:4, col:'#2b2d2f' },
  shotgun: { name:'Shotgun',       dmg:13, pellets:6, range:150, cd:.95, spread:.30, noise:28, ranged:true, ammo:'shells', len:7, col:'#3a2e24' },
  rifle:   { name:'Hunting Rifle', dmg:75, range:420, cd:1.3, spread:.03, noise:36, ranged:true, ammo:'rifle_ammo', len:9, col:'#4a3a2a' },
};
// loot tables — rolls × chance, weighted picks
const LOOT = {
  cabinet:     { rolls:2, table:[['beans',4],['chips',2],['bandage',2],['matches',3],['nails',2],['pills',2],['lantern',1],['knife',1],['ammo',1],['cloth',2],['water',2],['bottle',2],['rod',1]] },
  raider:      { rolls:3, chance:.75, table:[['ammo',4],['shells',2],['pistol',1],['shotgun',1],['beans',3],['water',3],['cash',3],['bandage',2],['gascan',2],['vest_light',1],['ring',1],['watch',1]] },
  kitchen:     { rolls:2, table:[['beans',3],['knife',2],['matches',2],['bottle',2],['water',2],['chips',1]] },
  mail:        { rolls:1, chance:.35, table:[['cash',3],['matches',1]] },
  berries:     { rolls:2, chance:.9, table:[['berries',1]] },
  deadwood:    { rolls:2, chance:.95, table:[['logs',1]] },
  clothes:     { rolls:1, table:[['cloth',5],['bandage',1]] },
  fire:        { rolls:2, chance:.7, table:[['fire_axe',3],['fire_helmet',3],['firstaid',1],['bandage',2]] },
  firetruck:   { rolls:2, chance:.7, table:[['fire_axe',2],['fire_helmet',2],['firstaid',2],['water',1]] },
  bar:         { rolls:2, table:[['soda',4],['water',2],['cash',2],['chips',2]] },
  hardware:    { rolls:2, table:[['planks',3],['nails',4],['scrap',3],['crowbar',1],['pipe',1],['hardhat',2],['fire_axe',1],['hatchet',2],['gascan_e',2],['rod',1],['bottle',1]] },
  books:       { rolls:1, table:[['matches',2],['cloth',1],['cash',1]] },
  cabinet_rich:{ rolls:2, chance:.7, table:[['beans',2],['soda',2],['firstaid',1],['pills',2],['watch',1],['ring',2],['cash',3],['ammo',2],['pistol',1]] },
  dresser_rich:{ rolls:2, chance:.75, table:[['ring',3],['necklace',3],['watch',2],['cash',3],['gold',1]] },
  safe:        { rolls:3, chance:.8, table:[['cash',4],['gold',3],['ring',2],['necklace',2],['watch',2],['pistol',1],['ammo',2]] },
  gunsafe:     { rolls:3, chance:.8, table:[['rifle',2],['shotgun',2],['shells',3],['rifle_ammo',3],['pistol',1],['ammo',2],['vest_heavy',1],['vest_light',1]] },
  fridge:      { rolls:2, table:[['beans',2],['water',4],['soda',2],['meat_raw',1]] },
  fridge_drinks:{rolls:2, table:[['soda',4],['water',4]] },
  shelf_food:  { rolls:2, table:[['beans',4],['chips',3],['soda',2],['water',3]] },
  shelf_conv:  { rolls:2, table:[['chips',3],['soda',3],['water',3],['matches',2],['beans',2]] },
  med:         { rolls:2, table:[['bandage',4],['pills',4],['firstaid',2]] },
  bath:        { rolls:1, table:[['pills',3],['bandage',2]] },
  junk:        { rolls:1, table:[['scrap',3],['nails',1],['lantern',1]] },
  sports:      { rolls:2, table:[['bat',3],['ammo',1],['shells',1],['water',1],['helmet_bike',2],['rod',2],['hatchet',1]] },
  jewelry:     { rolls:2, chance:.7, table:[['ring',3],['necklace',3],['watch',3],['gold',1]] },
  police:      { rolls:2, table:[['pistol',2],['ammo',4],['shells',2],['shotgun',1],['bandage',1],['vest_light',2],['mil_helmet',1],['vest_heavy',1]] },
  guns:        { rolls:2, table:[['pistol',2],['shotgun',2],['rifle',1],['ammo',3],['shells',3],['rifle_ammo',2],['vest_light',1],['mil_helmet',1]] },
  desk:        { rolls:1, table:[['pills',1],['matches',2],['nails',1],['cash',1],['ammo',1]] },
  register:    { rolls:1, chance:.7, table:[['cash',1]] },
  church:      { rolls:1, table:[['matches',3],['water',2],['beans',1]] },
  booth:       { rolls:2, table:[['ammo',2],['pistol',1],['water',2],['cash',1],['vest_light',2]] },
  warehouse:   { rolls:2, table:[['planks',3],['nails',3],['scrap',3],['crowbar',1],['hardhat',1],['gascan_e',1],['gascan',1],['hatchet',1]] },
  car:         { rolls:2, table:[['scrap',4],['water',2],['bandage',1],['lantern',1],['pills',1],['matches',1],['crowbar',1],['ammo',2],['pistol',1],['gascan_e',1],['rod',1]] },
  trash:       { rolls:1, table:[['scrap',3],['beans',1],['nails',2],['pipe',1],['chips',1],['bottle',3]] },
  crate:       { rolls:2, table:[['planks',4],['nails',3],['scrap',2],['beans',1],['bat',1],['crowbar',1]] },
  body:        { rolls:3, table:[['beans',3],['ammo',3],['bandage',2],['pills',1],['water',2],['matches',1],['shells',1]] },
};
const OBJ_NAMES = { firetruck:'Fire Truck', fountain:'Fountain', shipping:'Shipping Container', boat:'Boat', cabinet:'Cabinet', fridge:'Fridge', car:'Wrecked Car', trash:'Trash Can', crate:'Crate', body:'Body', shelf:'Shelf',
  counter:'Register', desk:'Desk', safe:'Safe', gunsafe:'Gun Safe', dresser:'Dresser', locker:'Locker', rack:'Rack', display:'Display Case',
  dumpster:'Dumpster', storage:'Storage Box', generator:'Generator', battery:'Battery', solar:'Solar Panel', lamp:'Lamp', bed:'Bed', hbed:'Bed',
  tree:'Tree', sofa:'Sofa', tv:'TV', table:'Table', toilet:'Toilet', pew:'Pew', altar:'Altar', bench:'Bench', pump:'Gas Pump', barrel:'Fire Barrel',
  chair:'Chair', armchair:'Armchair', ctable:'Coffee Table', bookcase:'Bookcase', nightstand:'Nightstand', wardrobe:'Wardrobe', stove:'Stove', sink:'Sink', bathtub:'Bathtub',
  washer:'Washing Machine', plant:'Plant', flamp:'Floor Lamp', filing:'Filing Cabinet', cooler:'Water Cooler', pallet:'Pallet', drum:'Drum', bin:'Bin', mailbox:'Mailbox',
  hedge:'Hedge', rug:'Rug', brush:'Brush', berry:'Berry Bush', log:'Fallen Log', carcass:'Carcass', campfire:'Campfire', tent:'Tent', bedroll:'Bedroll', collector:'Rain Collector' };

// ---------------- Building & crafting recipes ----------------
const BUILD = [
  { cat:'Structure', id:'wall',      name:'Wood Wall',    cost:{planks:3,nails:3},          tile:true },
  { cat:'Structure', id:'window',    name:'Window Wall',  cost:{planks:2,nails:3,scrap:1},  tile:true },
  { cat:'Structure', id:'door',      name:'Door',         cost:{planks:4,nails:4,scrap:1},  tile:true, desc:'Can be code-locked' },
  { cat:'Structure', id:'floor',     name:'Wood Floor',   cost:{planks:1},                  tile:true },
  { id:'pier',      name:'Pier Planks',  cost:{planks:3,nails:2},          tile:true, cat:'Structure', desc:'Build over water from the shore — dock boats, fish' },
  { id:'fence',     name:'Fence',        cost:{planks:2,nails:2},          tile:true, cat:'Defense', desc:'Close off a perimeter' },
  { id:'gate',      name:'Code-lock Gate',cost:{planks:3,nails:3,scrap:3},  tile:true, cat:'Defense', desc:'Locked with a 4-digit code; raiders must smash it' },
  { id:'tower',     name:'Watchtower',   cost:{planks:10,nails:8,logs:4}, w:2, h:2, cat:'Defense', desc:'Climb it to shoot in safety, or post a guard' },
  { id:'campfire',  name:'Campfire',     cost:{logs:2},                    cat:'Camp', desc:'Light, cooking, boiling water' },
  { id:'tent',      name:'Tent',         cost:{cloth:6,logs:2},  w:2,      cat:'Camp', desc:'Sleep anywhere' },
  { id:'bedroll',   name:'Bedroll',      cost:{cloth:3},         h:2,      cat:'Camp', desc:'Sleep anywhere' },
  { id:'collector', name:'Rain Collector',cost:{planks:2,scrap:2},         cat:'Camp', desc:'Slowly collects clean water' },
  { cat:'Furniture', id:'storage',   name:'Storage Box',  cost:{planks:3,nails:2} },
  { cat:'Furniture', id:'bed',       name:'Bed',          cost:{planks:3,nails:2,cloth:2},  h:2 },
  { cat:'Furniture', id:'lamp',      name:'Lamp',         cost:{scrap:2,nails:1},           desc:'Lights up when powered' },
  { cat:'Power', id:'generator', name:'Generator',    cost:{scrap:12,nails:4},          desc:'Powers everything nearby. Loud.' },
  { cat:'Power', id:'solar',     name:'Solar Panel',  cost:{scrap:6,nails:2},           desc:'Charges batteries by day (outdoors)' },
  { cat:'Power', id:'battery',   name:'Battery',      cost:{scrap:8},                   desc:'Stores solar power for the night' },
  { cat:'Scrap', id:'scrap',     name:'Scrap',        cost:{},                          desc:'Dismantle furniture, cars, trees and your builds' },
];
const CRAFT = [
  { out:['bandage',1],    cost:{cloth:2} },
  { out:['firstaid',1],   cost:{bandage:2,pills:2} },
  { out:['spiked_bat',1], cost:{bat:1,nails:6} },
  { out:['spear',1],      cost:{planks:2,knife:1} },
  { out:['lantern',1],    cost:{scrap:3,cloth:1} },
  { out:['splint',1],     cost:{planks:1,cloth:2} },
  { out:['rod',1],        cost:{planks:1,cloth:1,nails:1} },
  { out:['hatchet',1],    cost:{planks:1,scrap:3} },
  { out:['bandage',2],    cost:{hide:1} },
];
// what dismantling gives back
const SCRAP_YIELD = {
  cabinet:{planks:2,nails:1}, dresser:{planks:2,nails:1}, table:{planks:2,nails:1}, crate:{planks:2,nails:1}, pew:{planks:3,nails:1},
  bench:{planks:2,nails:1}, counter:{planks:2,nails:1}, storage:{planks:2,nails:1}, desk:{planks:2,nails:2,scrap:1}, altar:{planks:2,cloth:1},
  sofa:{planks:1,cloth:3}, bed:{planks:2,cloth:2}, hbed:{scrap:2,cloth:2}, rack:{scrap:1,cloth:2}, shelf:{scrap:2,nails:1}, display:{scrap:1},
  locker:{scrap:3}, safe:{scrap:4}, gunsafe:{scrap:4}, fridge:{scrap:3}, tv:{scrap:2}, toilet:{scrap:1}, trash:{scrap:1}, dumpster:{scrap:4},
  car:{scrap:6,nails:2}, firetruck:{scrap:12,nails:2}, shipping:{scrap:8}, boat:{planks:4,scrap:3}, pump:{scrap:3}, tree:{logs:2,planks:1}, generator:{scrap:6,nails:2}, battery:{scrap:4}, solar:{scrap:3,nails:1}, lamp:{scrap:1},
  wall:{planks:2,nails:1}, window:{planks:1,nails:1}, gate:{planks:2,nails:2,scrap:2}, tower:{planks:6,nails:4,logs:2}, stall:{planks:2}, door:{planks:2,nails:2}, floor:{planks:1}, fence:{planks:1}, pier:{planks:2},
  chair:{planks:1}, armchair:{cloth:2,planks:1}, ctable:{planks:2}, bookcase:{planks:3}, nightstand:{planks:1,nails:1}, wardrobe:{planks:3,nails:1}, stove:{scrap:4}, sink:{scrap:2},
  bathtub:{scrap:3}, washer:{scrap:4}, plant:{}, flamp:{scrap:1}, filing:{scrap:3}, cooler:{scrap:1}, pallet:{planks:3}, drum:{scrap:3}, bin:{scrap:1}, mailbox:{scrap:1},
  hedge:{logs:1}, berry:{}, log:{logs:2}, campfire:{logs:1}, tent:{cloth:4,logs:1}, bedroll:{cloth:2}, collector:{planks:1,scrap:1}, brush:{},
};
const POWER_TYPES = new Set(['generator','battery','solar','lamp']);
const POWERED_USERS = new Set(['tv','fridge','desk','counter','lamp']);
const ACT_TYPES = new Set(['generator','battery','solar','storage','bed','hbed','campfire','collector','toilet','tent','bedroll','tower']);
const BUILDING_NAMES = { house_s:'House', house_m:'House', mansion:'Mansion', apartment:'Apartments', supermarket:'Supermarket', mall:'Shopping Mall',
  hospital:'Hospital', police:'Police Station', gunstore:'Gun Store', conv:'Convenience Store', kiosk:'Gas Station', church:'Church',
  clinic:'Clinic', warehouse:'Warehouse', booth:'Guard Booth', office:'Office Building', shop:'Shop', firestation:'Fire Station' };
const SHOP_NAMES = { diner:'Diner', bar:'Bar', hardware:'Hardware Store', pharmacy:'Pharmacy', clothes:'Clothing Store', bank:'Bank', books:'Bookstore' };
function buildingName(b){ if(b.barn) return 'Barn'; if(b.name) return titleCase(b.name); if(b.t==='shop') return SHOP_NAMES[b.kind]||'Shop'; return BUILDING_NAMES[b.t]||'Building'; }

// ---------------- RNG / helpers ----------------
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}}
function th(x,y,k){ let h=(x*374761393 + y*668265263 + k*2246822519)|0; h=Math.imul(h^(h>>>13),1274126177); h^=h>>>16; return (h>>>0)/4294967296; }
function shade(hex,f){ const n=parseInt(hex.slice(1),16); const c=v=>Math.max(0,Math.min(255,Math.round(v*f)));
  return `rgb(${c(n>>16)},${c((n>>8)&255)},${c(n&255)})`; }
function escapeHtml(s){ return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

// ---------------- Tiles / materials ----------------
const T=16, CH=32;
const TL = { GRASS:0, DIRT:1, ASPH:2, WALK:3, WOOD:4, KTILE:5, WALL:6, WATER:7, CONC:8, LINO:9, CARPET:10, FOREST:11, WINDOW:12, FENCE:13, PARK:14, SEA:15, SAND:16, PIER:17, FIELD:18 };
const MATS = [
  { face:'#6e4a3c', line:'#523428', cap:'#2c2420', pat:'brick' },   // 0 red brick
  { face:'#6d5c4c', line:'#54473b', cap:'#2c2622', pat:'brick' },   // 1 brown brick
  { face:'#8a8578', line:'#6b675e', cap:'#2e2c29', pat:'siding' },  // 2 white siding
  { face:'#56656a', line:'#434f52', cap:'#262b2c', pat:'siding' },  // 3 blue siding
  { face:'#8a7c66', line:'#776a56', cap:'#2f2a24', pat:'plain' },   // 4 stucco
  { face:'#686a6a', line:'#555757', cap:'#2a2b2c', pat:'block' },   // 5 concrete
  { face:'#6a645a', line:'#4f4a43', cap:'#2a2826', pat:'stone' },   // 6 stone
  { face:'#8c8a84', line:'#74726c', cap:'#33322f', pat:'block' },   // 7 light concrete
  { face:'#6e5236', line:'#4c3622', cap:'#2e2418', pat:'planks' },  // 8 player-built wood
  { face:'#6c6862', line:'#4c4844', cap:'#2c2a28', pat:'ashlar' },  // 9 pedra de castelo
  { face:'#5c5852', line:'#403c38', cap:'#262422', pat:'ashlar' },  // 10 torre
  { face:'#a89a80', line:'#3a2a1c', cap:'#2e2418', pat:'timber' },  // 11 enxaimel (reboco e vigas)
  { face:'#7a5a3a', line:'#563c24', cap:'#2e2418', pat:'planks' },  // 12 tábuas
  { face:'#c8a878', line:'#9a7c54', cap:'#5a4430', pat:'ashlar' },  // 13 arenito (Outremer)
];
const CARPETS = ['#5a3434','#3a4658','#5b5440','#3f4d3f','#4e3a52'];

let W,H,N, fden, map, mat, bld, mark, reserved, regionId, objGrid, walk, doors, objs, buildings, regions;
let NCX,NCY, chunkObjs, chunkDoors, chunkBlds, chunkDecals;
const idx=(x,y)=>y*W+x, inB=(x,y)=>x>=0&&y>=0&&x<W&&y<H;
const cidx=(x,y)=>Math.floor(y/CH)*NCX+Math.floor(x/CH);

let nextObjId=0, worldObjCount=0, objById=[], removedIds=new Set(), built=[];
const LIGHTS=new Set(['hearth','candle','orb','cauldron','brazier']);
function addObj(o){
  o.id=nextObjId++; if(LIGHTS.has(o.type)){ o.light=true; o.seed=o.seed||o.x*3+o.y; }
  o.w=o.w||1; o.h=o.h||1; if(o.sortY===undefined) o.sortY=(o.y+o.h)*T-2; objs.push(o);
  for(let dy=0;dy<o.h;dy++) for(let dx=0;dx<o.w;dx++) objGrid[idx(o.x+dx,o.y+dy)]=o;
  chunkObjs[cidx(o.x,o.y)].push(o);
  return o;
}
function removeObj(o){
  for(let dy=0;dy<o.h;dy++) for(let dx=0;dx<o.w;dx++){ const i=idx(o.x+dx,o.y+dy); if(objGrid[i]===o) objGrid[i]=null; refreshWalk(o.x+dx,o.y+dy); }
  const L=chunkObjs[cidx(o.x,o.y)], k=L.indexOf(o); if(k>=0) L.splice(k,1);
  const j=objs.indexOf(o); if(j>=0) objs.splice(j,1);
  if(o.id<worldObjCount) removedIds.add(o.id);
  if(POWER_TYPES.has(o.type)) recomputePower();
}
function refreshWalk(x,y){ if(!walk||!inB(x,y)) return; const i=idx(x,y), t=map[i];
  walk[i] = (t!==TL.WALL && t!==TL.WINDOW && t!==TL.FENCE && t!==TL.WATER && t!==TL.SEA && !(objGrid[i]&&objGrid[i].solid)) ? 1 : 0; }
function dirtyChunks(x,y){ for(const yy of [y-1,y,y+1]) if(inB(x,yy)) chunkCache.delete(cidx(x,yy)); }
function areaFree(x,y,w,h){
  for(let yy=y;yy<y+h;yy++) for(let xx=x;xx<x+w;xx++){ if(!inB(xx,yy)) return false; const i=idx(xx,yy);
    if(objGrid[i] || reserved[i] || doors.has(i)) return false; const t=map[i];
    if(t===TL.WALL||t===TL.WINDOW||t===TL.FENCE||t===TL.WATER||t===TL.SEA) return false; }
  return true;
}

// ---------------- World construction ----------------
// The world is authored on a coarse design grid; the game runs it at WS x that size so
// houses, rooms, streets and rivers have room around the (unchanged) characters.
const WS=1;
const WORLD_VERSION = ()=> (window.WORLD.version||1)*10 + WS;
function scaledWorld(D){
  const s=WS, R=r=>({...r, x:r.x*s, y:r.y*s, w:r.w*s, h:r.h*s});
  const thin=r=>{ const o=R(r); if(r.w===1) o.w=1; if(r.h===1) o.h=1; return o; };
  const P=pts=>pts.map(([x,y])=>[x*s,y*s]);
  return { version:D.version, W:D.W*s, H:D.H*s, spawn:D.spawn,
    coast: D.coast ? P(D.coast) : null,
    regions: D.regions.map(r=>{ const o=R(r); if(r.poly) o.poly=P(r.poly); return o; }),
    roads: D.roads.map(R), walks: D.walks.map(R),
    lots: D.lots.filter(l=>l.k!=='path').map(R),
    lakes: D.lakes.map(l=>({...l, x:l.x*s, y:l.y*s, rx:l.rx*s, ry:l.ry*s})),
    river: { w:D.river.w*1.3, pts:P(D.river.pts) },
    forests: D.forests.map(f=>({...f, x:f.x*s, y:f.y*s, rx:f.rx*s, ry:f.ry*s})),
    buildings: D.buildings.map(b=>({...b, lx:b.x, ly:b.y, lw:b.w, lh:b.h, ldoors:b.doors, x:b.x*s, y:b.y*s, w:b.w*s, h:b.h*s, doors:[] })),
    fences: D.fences.map(thin), walls: D.walls.map(thin), pools: D.pools.map(R),
    props: D.props.map(p=>({...p, x:p.x*s, y:p.y*s})),
    cars: D.cars.map(c=>({...c, x:c.x*s, y:c.y*s})),
    boats: (D.boats||[]).map(b=>({...b, x:b.x*s, y:b.y*s})),
    cells:D.cells, cs:D.cs, rivers:D.rivers||[], paths:D.paths||[], portals:D.portals||[], lairs:D.lairs||[] };
}
let SW=null;
function buildWorld(){
  if(!SW) SW=scaledWorld(window.WORLD);
  const WD=SW; W=WD.W; H=WD.H; N=W*H;
  map=new Uint8Array(N); mat=new Uint8Array(N); bld=new Int16Array(N).fill(-1); mark=new Uint8Array(N);
  reserved=new Uint8Array(N); regionId=new Uint8Array(N).fill(255); objGrid=new Array(N).fill(null);
  doors=new Map(); objs=[]; buildings=[]; regions=WD.regions; nextObjId=0; removedIds=new Set(); built=[]; walk=null;
  NCX=Math.ceil(W/CH); NCY=Math.ceil(H/CH);
  chunkObjs=Array.from({length:NCX*NCY},()=>[]); chunkDoors=Array.from({length:NCX*NCY},()=>[]);
  chunkBlds=Array.from({length:NCX*NCY},()=>[]); chunkDecals=Array.from({length:NCX*NCY},()=>[]);
  chunkCache.clear();
  const rect=(r,fn)=>{ for(let y=Math.max(0,r.y);y<Math.min(H,r.y+r.h);y++) for(let x=Math.max(0,r.x);x<Math.min(W,r.x+r.w);x++) fn(idx(x,y),x,y); };
  const ell=(e,fn)=>{ for(let y=Math.max(0,e.y-e.ry-1);y<=Math.min(H-1,e.y+e.ry+1);y++) for(let x=Math.max(0,e.x-e.rx-1);x<=Math.min(W-1,e.x+e.rx+1);x++){
      const d=((x-e.x)/e.rx)**2+((y-e.y)/e.ry)**2; if(d < 1 - th(x,y,5)*0.12) fn(idx(x,y),x,y); } };
  // sea outside the coastline (scanline fill of the authored polygon)
  fden=new Uint8Array(N);
  if(WD.cells && typeof paintBiomes==='function') paintBiomes(WD);
  if(WD.coast){ const P=WD.coast; map.fill(TL.SEA);
    for(let y=0;y<H;y++){ const xs=[]; const yc=y+0.5;
      for(let a=0,b=P.length-1;a<P.length;b=a++){ const [x1,y1]=P[a],[x2,y2]=P[b]; if((y1>yc)!==(y2>yc)) xs.push(x1+(yc-y1)*(x2-x1)/(y2-y1)); }
      xs.sort((a,b)=>a-b);
      for(let k=0;k+1<xs.length;k+=2) for(let x=Math.max(0,Math.ceil(xs[k]-0.5)); x<=Math.min(W-1,Math.floor(xs[k+1]-0.5)); x++) map[idx(x,y)]=TL.GRASS; } }
  // nature
  for(const f of WD.forests) ell(f, i=>{ if(map[i]===TL.SEA) return; map[i]=TL.FOREST; fden[i]=Math.max(fden[i],Math.round((f.d||0.15)*255)); });
  for(const l of WD.lakes) ell(l, i=>{ map[i]=TL.WATER; });
  const rv=WD.river, rr=rv.w/2;
  for(let s=0;s<rv.pts.length-1;s++){ const [x1,y1]=rv.pts[s], [x2,y2]=rv.pts[s+1], L=Math.hypot(x2-x1,y2-y1);
    for(let t=0;t<=L;t+=1){ const cx=x1+(x2-x1)*t/L, cy=y1+(y2-y1)*t/L, r=rr+Math.sin((cx+cy)*0.05)*1.5;
      for(let y=Math.floor(cy-r);y<=cy+r;y++) for(let x=Math.floor(cx-r);x<=cx+r;x++) if(inB(x,y) && Math.hypot(x-cx,y-cy)<=r) map[idx(x,y)]=TL.WATER; } }
  if(WD.cells && typeof paintWater==='function') paintWater(WD);
  // beaches: land within 2 tiles of the sea
  if(WD.coast){ const dist=new Uint8Array(N); let q=[];
    for(let y=1;y<H-1;y++) for(let x=1;x<W-1;x++){ const i=idx(x,y); if(map[i]!==TL.SEA) continue;
      for(const j of [i-1,i+1,i-W,i+W]) if((map[j]===TL.GRASS||map[j]===TL.FOREST) && !dist[j]){ dist[j]=1; q.push(j); } }
    for(let d=1; d<=4 && q.length; d++){ const nq=[];
      for(const i of q){ const x=i%W, y=(i/W)|0; if(d>2+(th(x,y,21)>.5?1:0)+(th(x>>3,y>>3,22)>.6?1:0)) continue; map[i]=TL.SAND; fden[i]=0;
        for(const j of [i-1,i+1,i-W,i+W]) if(j>=0&&j<N&&(map[j]===TL.GRASS||map[j]===TL.FOREST)&&!dist[j]){ dist[j]=d+1; nq.push(j); } }
      q=nq; } }
  // settlements: clear ground
  const polyFill=(P,fn)=>{ let y0=1e9,y1=-1e9; for(const [,y] of P){ y0=Math.min(y0,y); y1=Math.max(y1,y); }
    for(let y=Math.max(0,Math.floor(y0));y<=Math.min(H-1,Math.ceil(y1));y++){ const xs=[], yc=y+0.5;
      for(let a=0,b=P.length-1;a<P.length;b=a++){ const [xa,ya]=P[a],[xb,yb]=P[b]; if((ya>yc)!==(yb>yc)) xs.push(xa+(yc-ya)*(xb-xa)/(yb-ya)); }
      xs.sort((a,b)=>a-b); for(let k=0;k+1<xs.length;k+=2) for(let x=Math.max(0,Math.ceil(xs[k]-0.5)); x<=Math.min(W-1,Math.floor(xs[k+1]-0.5)); x++) fn(idx(x,y),x,y); } };
  regions.forEach((r,ri)=>{
    if(r.poly) polyFill(r.poly, i=>{ regionId[i]=ri; if(map[i]===TL.FOREST) map[i]=TL.GRASS; });
    else rect(r, i=>{ map[i]=TL.GRASS; regionId[i]=ri; }); });
  // lots
  for(const l of WD.lots){
    if(l.k==='path') rect(l, i=>{ map[i]=TL.DIRT; reserved[i]=1; });
    else if(l.k==='pier') rect(l, i=>{ map[i]=TL.PIER; });
    else if(l.k==='field') rect(l, i=>{ map[i]=TL.FIELD; });
    else if(l.k==='park'||l.k==='court') rect(l, i=>{ map[i]=TL.PARK; });
    else rect(l, (i,x,y)=>{ map[i]=TL.CONC; if(l.k==='parking' && (x-l.x)%3===0 && y>=l.y+l.h-2) mark[i]|=4; });
  }
  // roads
  for(const r of WD.roads) rect(r, i=>{ map[i]=TL.ASPH; });
  for(const r of WD.walks) rect(r, i=>{ if(map[i]!==TL.ASPH) map[i]=TL.WALK; });
  // centre lines (skip intersections)
  const isA=(x,y)=>inB(x,y)&&map[idx(x,y)]===TL.ASPH;
  for(const r of WD.roads){ if(r.k==='road'||r.k==='street') continue;
    if(r.w>r.h && r.h>=4){ const yy=r.y+Math.floor(r.h/2)-1; for(let x=r.x;x<r.x+r.w;x++) if(inB(x,yy) && !isA(x,r.y-1) && !isA(x,r.y+r.h)) mark[idx(x,yy)]|=1; }
    else if(r.h>r.w && r.w>=4){ const xx=r.x+Math.floor(r.w/2)-1; for(let y=r.y;y<r.y+r.h;y++) if(inB(xx,y) && !isA(r.x-1,y) && !isA(r.x+r.w,y)) mark[idx(xx,y)]|=2; } }
  for(const p of WD.pools) rect(p,(i,x,y)=>{ map[i] = (x===p.x||y===p.y||x===p.x+p.w-1||y===p.y+p.h-1) ? TL.CONC : TL.WATER; });
  for(const f of WD.fences) rect(f, i=>{ if(map[i]===TL.GRASS||map[i]===TL.PARK) map[i]=TL.FENCE; });
  for(const w of WD.walls) rect(w, i=>{ map[i]=TL.WALL; mat[i]=w.mat??7; });
  // buildings
  for(const b0 of WD.buildings){ const b={...b0}; buildings[b.id]=b; buildInterior(b); }
  for(const b of buildings) if(b) carveDoorPaths(b);
  // props & cars
  for(const p of WD.props){
    const w=p.w||1;
    if(!areaFree(p.x,p.y,w,1)) continue;
    if(p.t==='tree') addObj({type:'tree',x:p.x,y:p.y,solid:true,v:Math.floor(th(p.x,p.y,3)*3)});
    else if(p.t==='barrel') addObj({type:'barrel',x:p.x,y:p.y,solid:true,light:true,seed:th(p.x,p.y,4)*100});
    else if(p.t==='bench') addObj({type:'bench',x:p.x,y:p.y,w:2,solid:true});
    else if(p.t==='dumpster') addObj({type:'dumpster',x:p.x,y:p.y,w:2,solid:true,container:'trash'});
    else if(p.t==='trash') addObj({type:'trash',x:p.x,y:p.y,solid:true,container:'trash'});
    else if(p.t==='crate') addObj({type:'crate',x:p.x,y:p.y,solid:true,container:'crate'});
    else if(p.t==='pump') addObj({type:'pump',x:p.x,y:p.y,solid:true});
    else if(['anvil','logs','keg','hay','statue','banner','pine','palm','rock','deadtree','cactus','brazier','hoard','stairs_down','stairs_up','awning','olive'].includes(p.t)) addObj({type:p.t,x:p.x,y:p.y,solid:true,v:Math.floor(th(p.x,p.y,3)*3)});
    else if(p.t==='moongate'){ if(areaFree(p.x,p.y,2,1)) addObj({type:'moongate',x:p.x,y:p.y,w:2,solid:true,portal:p.portal}); }
    else if(p.t==='fountain'){ if(areaFree(p.x,p.y,2,2)) addObj({type:'fountain',x:p.x,y:p.y,w:2,h:2,solid:true}); }
    else if(p.t==='container') addObj({type:'shipping',x:p.x,y:p.y,w:2,solid:true,container:'warehouse',c:p.c});
  }
  for(const c of WD.cars){ const w=c.v?2:3, h=c.v?3:2; if(areaFree(c.x,c.y,w,h)) addObj({type:'car',x:c.x,y:c.y,w,h,vert:!!c.v,c:c.c,flip:th(c.x,c.y,9)<.5,solid:true,container:'car',kind:th(c.x,c.y,11)<.62?'sedan':th(c.x,c.y,11)<.85?'pickup':'van'}); }
  // vegetation (forest tiles dense, open grass sparse)
  const nearB=(x,y)=>{ for(let yy=y-2;yy<=y+2;yy++) for(let xx=x-2;xx<=x+2;xx++) if(inB(xx,yy)&&(bld[idx(xx,yy)]>=0||map[idx(xx,yy)]===TL.WALL)) return true; return false; };
  for(let y=1;y<H-1;y++) for(let x=1;x<W-1;x++){
    const i=idx(x,y), t=map[i];
    if(regionId[i]!==255) continue;
    const p = t===TL.FOREST ? Math.min(.55, fden[i]/255*2.4+0.06) : t===TL.GRASS ? 0.006 : 0;
    if(!p || th(x,y,77)>=p) continue;
    let ok=true;
    for(let yy=y-1;yy<=y+1&&ok;yy++) for(let xx=x-1;xx<=x+1;xx++){ const j=idx(xx,yy), tt=map[j];
      if((tt!==TL.GRASS&&tt!==TL.FOREST) || objGrid[j] || reserved[j]){ ok=false; break; } }
    if(ok && !nearB(x,y)) addObj({type:'tree',x,y,solid:true,v:Math.floor(th(x,y,3)*3)});
  }
  dressForest();
  // solar sites: battery inside, panels in the yard
  for(const b of WD.buildings) if(b.solar) placeSolarSite(buildings[b.id]);
  placeVehicles(WD);
  placePeople();
  { const byB=new Map(); for(const o of objs) if(o.b!==undefined&&o.b>=0){ if(!byB.has(o.b)) byB.set(o.b,[]); byB.get(o.b).push(o); }
    for(const b of buildings) if(b) ensureAccess(b, byB.get(b.id)||[]); }
  walk=new Uint8Array(N);
  for(let i=0;i<N;i++){ const t=map[i]; walk[i] = (t!==TL.WALL && t!==TL.WINDOW && t!==TL.FENCE && t!==TL.WATER && t!==TL.SEA && !(objGrid[i]&&objGrid[i].solid)) ? 1 : 0; }
  worldObjCount=nextObjId; objById=objs.slice();
  buildMinimap();
  recomputePower();
}
function carveDoorPaths(b){
  const good=t=>t===TL.ASPH||t===TL.WALK||t===TL.CONC||t===TL.DIRT||t===TL.PIER||t===TL.PARK;
  for(const [dx,dy] of b.doors){
    const ox = dx===b.x?-1:dx===b.x+b.w-1?1:0, oy = dy===b.y?-1:dy===b.y+b.h-1?1:0; if(!ox&&!oy) continue;
    let ok=-1;
    for(let k=1;k<=70;k++){ const x=dx+ox*k, y=dy+oy*k; if(!inB(x,y)) break; const i=idx(x,y), t=map[i];
      if(bld[i]>=0||t===TL.WALL||t===TL.WATER||t===TL.SEA||t===TL.WINDOW) break;
      if(good(t)&&k>1){ ok=k; break; } if(good(t)&&k===1){ ok=1; break; } }
    const len = ok>0 ? ok : 3;
    for(let k=1;k<len;k++){ const x=dx+ox*k, y=dy+oy*k; const i=idx(x,y); map[i]=TL.DIRT; reserved[i]=1;
      const o=objGrid[i]; if(o&&!o.b) removeObjRaw(o); }
    for(let k=1;k<=2;k++){ const x=dx+ox*k, y=dy+oy*k; if(inB(x,y)) reserved[idx(x,y)]=1; }
  }
}
function placeSolarSite(b){
  // battery: first free interior tile next to a wall
  let bat=null;
  for(let y=b.y+1;y<b.y+b.h-1 && !bat;y++) for(let x=b.x+1;x<b.x+b.w-1;x++){
    const nearWall = isWallish(x-1,y)||isWallish(x+1,y)||isWallish(x,y-1)||isWallish(x,y+1);
    if(nearWall && areaFree(x,y,1,1) && !doorAdj(x,y)){ bat=addObj({type:'battery',x,y,solid:true,charge:60,b:b.id}); break; }
  }
  // two panels on open ground beside the house
  let n=0;
  for(let r=1;r<=3 && n<2;r++) for(let x=b.x-r;x<=b.x+b.w-1+r && n<2;x++) for(const y of [b.y-r,b.y+b.h-1+r]){
    if(n>=2) break; if(!inB(x,y)) continue; const t=map[idx(x,y)];
    if((t===TL.GRASS||t===TL.PARK) && areaFree(x,y,1,1) && !reserved[idx(x,y)]) { addObj({type:'solar',x,y,solid:true}); n++; }
  }
}
function doorAdj(x,y){ return doors.has(idx(x-1,y))||doors.has(idx(x+1,y))||doors.has(idx(x,y-1))||doors.has(idx(x,y+1)); }

// ---------------- Building interiors (one template per building type) ----------------
function buildInterior(b){
  // Templates are written for the design-size footprint (b.lw x b.lh). They fill a small logical
  // grid; rasterInterior() then stretches rooms to the real footprint, keeping walls one tile thin
  // and furniture at its real size (pushed against walls, rows of shelves/counters extended).
  const BW=b.lw, BH=b.lh, bx0=b.lx, by0=b.ly;
  const d0=b.ldoors[0];
  b.front = d0[1]===by0 ? 'N' : d0[1]===by0+BH-1 ? 'S' : d0[0]===bx0 ? 'W' : 'E';
  const NS = b.front==='N'||b.front==='S';
  const LW = NS ? BW : BH, LD = NS ? BH : BW;
  const L = b.front==='S' ? (u,v)=>[u, BH-1-v] : b.front==='N' ? (u,v)=>[u, v]
          : b.front==='W' ? (u,v)=>[v, u] : (u,v)=>[BW-1-v, u];
  const toLocal = (x,y) => b.front==='S' ? [x-bx0, by0+BH-1-y] : b.front==='N' ? [x-bx0, y-by0] : b.front==='W' ? [y-by0, x-bx0] : [y-by0, bx0+BW-1-x];
  const rb = mulberry32(b.id*7919+13), RI=(a,c)=>a+Math.floor(rb()*(c-a+1)), chance=p=>rb()<p;
  const LN=BW*BH, map=new Uint8Array(LN), mat=new Uint8Array(LN), reserved=new Uint8Array(LN), objGrid=new Array(LN).fill(null), doorsL=new Set(), lobjs=[];
  const I = (u,v)=>{ const [x,y]=L(u,v); return y*BW+x; };
  const inside = (u,v)=> u>0 && v>0 && u<LW-1 && v<LD-1;
  const resv = (u,v)=>{ if(inside(u,v)) reserved[I(u,v)]=1; };
  const setF = (u0,v0,u1,v1,t)=>{ for(let v=v0;v<=v1;v++) for(let u=u0;u<=u1;u++){ if(!inside(u,v)) continue; const i=I(u,v); if(map[i]!==TL.WALL) map[i]=t; } };
  const wallAt = (u,v)=>{ if(!inside(u,v)) return; const i=I(u,v); if(reserved[i]) return; map[i]=TL.WALL; mat[i]=b.mat; };
  const vw = (u,v0,v1,gaps=[])=>{ for(const g of gaps){ resv(u-1,g); resv(u,g); resv(u+1,g); } for(let v=v0;v<=v1;v++) if(!gaps.includes(v)) wallAt(u,v); };
  const hw = (v,u0,u1,gaps=[])=>{ for(const g of gaps){ resv(g,v-1); resv(g,v); resv(g,v+1); } for(let u=u0;u<=u1;u++) if(!gaps.includes(u)) wallAt(u,v); };
  const put = (type,u,v,o={})=>{
    const lw=o.w||1, lh=o.h||1; let x0=1e9,y0=1e9,x1=-1,y1=-1; const cells=[];
    for(let dv=0;dv<lh;dv++) for(let du=0;du<lw;du++){
      if(!inside(u+du,v+dv)) return null;
      const i=I(u+du,v+dv);
      if(map[i]===TL.WALL || map[i]===TL.WINDOW || map[i]===TL.FENCE || reserved[i] || objGrid[i] || doorsL.has(i)) return null;
      const [x,y]=L(u+du,v+dv); cells.push(i);
      x0=Math.min(x0,x); y0=Math.min(y0,y); x1=Math.max(x1,x); y1=Math.max(y1,y);
    }
    const ww=x1-x0+1, hh=y1-y0+1;
    if((type==='bed'||type==='hbed') && hh!==2) return null;
    if((type==='sofa'||type==='desk'||type==='pew'||type==='altar'||type==='bench') && ww!==2) return null;
    const ob={type, x:x0, y:y0, w:ww, h:hh, container:o.c||null, kind:o.kind}; for(const i of cells) objGrid[i]=ob; lobjs.push(ob); return ob;
  };
  // shell
  const floor0 = { castle:TL.CONC, forge:TL.CONC, bank:TL.CONC, tavern:TL.WOOD, mage:TL.WOOD, house_s:TL.WOOD, house_m:TL.WOOD, mansion:TL.WOOD, apartment:TL.LINO, church:TL.WOOD, warehouse:TL.CONC, booth:TL.CONC, police:TL.LINO, office:TL.LINO, shop:TL.LINO, firestation:TL.CONC }[b.t] ?? TL.LINO;
  for(let y=0;y<BH;y++) for(let x=0;x<BW;x++){ const i=y*BW+x;
    if(x===0||y===0||x===BW-1||y===BH-1){ map[i]=TL.WALL; mat[i]=b.mat; } else map[i]=floor0; }
  const dl=[];
  for(const [dx,dy] of b.ldoors){
    const i=(dy-by0)*BW+(dx-bx0); map[i]=floor0; doorsL.add(i);
    const [u,v]=toLocal(dx,dy); dl.push([u,v]);
    const iu = u===0?1:u===LW-1?-1:0, iv = v===0?1:v===LD-1?-1:0;
    resv(u+iu,v+iv); resv(u+2*iu,v+2*iv);
  }
  const du = dl[0][0];
  const nearDoor = (u,v)=> dl.some(([a,c])=>Math.abs(a-u)+Math.abs(c-v)<=1);
  const windows = (every,{front=true,back=true,sides=true}={})=>{
    const off=RI(0,every-1);
    const tryW=(u,v)=>{ if(nearDoor(u,v)) return; const i=I(u,v); if(map[i]===TL.WALL) map[i]=TL.WINDOW; };
    for(let u=1;u<LW-1;u++){ if((u+off)%every) continue; if(front) tryW(u,0); if(back) tryW(u,LD-1); }
    if(sides) for(let v=1;v<LD-1;v++){ if((v+off)%every) continue; tryW(0,v); tryW(LW-1,v); }
  };
  // chunk registration for roofs
  for(let cy=Math.floor(b.y/CH); cy<=Math.floor((b.y+b.h-1)/CH); cy++) for(let cx=Math.floor(b.x/CH); cx<=Math.floor((b.x+b.w-1)/CH); cx++) chunkBlds[cy*NCX+cx].push(b);
  b.alpha=1; assignName(b);

  const row = (types,v,u0,u1)=>{ let k=0; for(let u=u0;u<=u1 && k<types.length;u++){ const t=types[k]; if(!t){k++;continue;} if(put(t[0],u,v,t[1]||{})) { k++; u+=((t[1]&&t[1].w)||1)-1; } } };

  switch(b.t){
    case 'house_s': case 'house_m': {
      windows(3);
      let sx = Math.floor(LW*0.55); if(sx===du) sx = du+1<LW-2 ? du+1 : du-1;
      vw(sx,1,LD-2,[RI(2,LD-3)]);
      const liv = du<sx ? [1,sx-1] : [sx+1,LW-2], prv = du<sx ? [sx+1,LW-2] : [1,sx-1];
      put('hearth', liv[0], LD-2, {kind:'home'}) || put('hearth', liv[1], LD-2, {kind:'home'});
      put('chest', liv[1], LD-2, {c:'cabinet'}) || put('chest', liv[0], LD-2, {c:'cabinet'});
      put('table', liv[0]+1, Math.max(2,LD-4)); put('keg', liv[0], 1);
      setF(prv[0],1,prv[1],LD-2,TL.CARPET);
      put('bed',prv[0],LD-3,{h:2}) || put('bed',prv[1],LD-3,{h:2});
      put('chest',prv[1],1,{c:'dresser'}) || put('chest',prv[0],1,{c:'dresser'});
      break; }
    case 'castle': {
      windows(3,{front:true});
      setF(du-1,1,du+1,LD-3,TL.CARPET);
      const L1=du-8, R1=du+8;
      vw(L1,1,LD-2,[RI(3,LD-4)]); vw(R1,1,LD-2,[RI(3,LD-4)]);
      for(let v=3; v<=LD-5; v+=3){ put('pillar',du-4,v); put('pillar',du+4,v); }
      put('throne',du,LD-3,{c:'throne'}); put('banner',du-3,LD-2); put('banner',du+3,LD-2); put('brazier',du-2,LD-4); put('brazier',du+2,LD-4);
      for(let v=1; v<=LD-3; v+=3) put('bed',1,v,{h:2}); for(let v=1; v<=LD-3; v+=3) put('bed',L1-1,v,{h:2});
      put('table',3,Math.floor(LD/2)); put('chest',2,LD-2,{c:'cabinet'});
      for(let u=R1+1; u<=LW-2; u+=2) put('wrack',u,LD-2,{c:'armory'});
      put('chest',LW-2,1,{c:'safe'}); put('chest',R1+1,1,{c:'safe'}); put('table',R1+3,4);
      break; }
    case 'forge': {
      windows(3,{front:false});
      put('hearth',1,LD-3,{w:2,h:2,kind:'forge'}); put('anvil',4,Math.max(2,LD-4)); put('tub',4,LD-2);
      for(let u=LW-2; u>=LW-6 && u>5; u--) put('wrack',u,LD-2,{c:'armory'});
      put('counter',du+2<LW-1?du+2:du-2,2,{c:'register'}); put('chest',LW-2,1,{c:'cabinet'}); put('logs',1,1);
      break; }
    case 'tavern': {
      windows(2);
      for(let u=1;u<=5;u++) put('counter',u,LD-4,{c:u===2?'register':null});
      for(let u=1;u<=5;u++) put('keg',u,LD-2);
      put('hearth',LW-2,LD-2,{kind:'home'});
      for(let u=3;u<=LW-3;u+=4) for(let v=2; v<=LD-6; v+=3){ if(Math.abs(u-du)<=1&&v<3) continue; if(put('table',u,v)){ put('chair',u-1,v); put('chair',u+1,v); } }
      for(let u=7;u<=LW-4;u+=3) put('table',u,LD-2);
      break; }
    case 'bank': {
      windows(3);
      for(let u=1;u<=LW-2;u++) if(Math.abs(u-du)>1) put('counter',u,3,{c:u%3?null:'register'});
      for(let u=1;u<=LW-2;u+=2) put('chest',u,LD-2,{c:'safe'});
      put('safe',LW-2,5,{c:'safe'});
      break; }
    case 'mage': {
      windows(2);
      setF(1,1,LW-2,LD-2,TL.CARPET);
      for(let u=1;u<=LW-2;u++) put('shelf',u,LD-2,{c:'books',kind:'books'});
      put('orb',Math.floor(LW/2),Math.floor(LD/2)); put('cauldron',1,2); put('candle',LW-2,2);
      break; }
    case 'mansion': {
      windows(3);
      let sx=Math.floor(LW/2); if(sx===du) sx++;
      const mid=Math.floor(LD/2);
      vw(sx,1,LD-2,[RI(2,mid-1),RI(mid+1,LD-3)]);
      hw(mid,1,sx-1,[RI(2,sx-2)]); hw(mid,sx+1,LW-2,[RI(sx+2,LW-3)]);
      const A = du<sx ? [1,sx-1] : [sx+1,LW-2], Bs = du<sx ? [sx+1,LW-2] : [1,sx-1];
      setF(A[0],mid+1,A[1],LD-2,TL.KTILE); setF(Bs[0],mid+1,Bs[1],LD-2,TL.CARPET);
      // living
      put('sofa',A[0],1,{w:2}); put('tv',A[1],1); put('table',A[0]+2,mid-2);
      // kitchen
      put('fridge',A[0],LD-2,{c:'fridge'}); put('cabinet',A[0]+1,LD-2,{c:'cabinet_rich'}); put('cabinet',A[0]+2,LD-2,{c:'cabinet_rich'}); put('table',A[1]-1,mid+2);
      // office
      put('desk',Bs[0],1,{w:2,c:'desk'}) || put('desk',Bs[1]-1,1,{w:2,c:'desk'}); put('gunsafe',Bs[1],mid-1,{c:'gunsafe'}) || put('gunsafe',Bs[0],mid-1,{c:'gunsafe'});
      // master bedroom
      put('bed',Bs[0],LD-3,{h:2}); put('dresser',Bs[0]+1,LD-2,{c:'dresser_rich'}); put('safe',Bs[1],LD-2,{c:'safe'}); put('dresser',Bs[1],mid+1,{c:'dresser_rich'});
      break; }
    case 'apartment': {
      windows(2);
      const units=[[3,6],[8,11],[13,LD-2]];
      vw(5,3,LD-2,units.map(u=>u[0]+1)); vw(7,3,LD-2,units.map(u=>u[0]+1));
      hw(7,1,4); hw(7,8,LW-2); hw(12,1,4); hw(12,8,LW-2);
      units.forEach(([v0,v1],k)=>{
        for(const [u0,u1] of [[1,4],[8,LW-2]]){
          setF(u0,v0,u1,v1, (k+u0)%2 ? TL.WOOD : TL.CARPET);
          put('bed',u0,v1-1,{h:2}); put('fridge',u1,v0,{c:'fridge'}); put('cabinet',u1,v1,{c:'cabinet'});
        }
      });
      put('trash',1,1,{c:'trash'});
      break; }
    case 'supermarket': {
      windows(2,{back:false,sides:false});
      const big = LD>=12, sv = big ? LD-5 : LD;
      if(big){ hw(sv,1,LW-2,[2]); setF(1,sv+1,LW-2,LD-2,TL.CONC); for(let u=1;u<=LW-2;u+=2) if(chance(.7)) put('crate',u,LD-2,{c:'crate'}); }
      const far=u=>dl.every(([a])=>Math.abs(a-u)>2);
      for(let u=2;u<=LW-3;u+=3){ if(!far(u)) continue; for(let v=4; v<=(big?sv-2:LD-3); v++) put('shelf',u,v,{c:'shelf_food',kind:'food'}); }
      for(let u=1;u<=LW-2;u++){ if(!far(u)) continue; put('counter',u,2,{c: u%4===1 ? 'register' : null}); }
      break; }
    case 'mall': {
      windows(3,{sides:false});
      vw(11,1,LD-2,[3,4,8,9,13,14]); vw(16,1,LD-2,[3,4,8,9,13,14]);
      hw(6,1,10); hw(11,1,10); hw(6,17,LW-2); hw(11,17,LW-2);
      const shops=[['clothes',1,10,1,5],['jewelry',1,10,7,10],['food',1,10,12,LD-2],['pharmacy',17,LW-2,1,5],['sports',17,LW-2,7,10],['electronics',17,LW-2,12,LD-2]];
      for(const [k,u0,u1,v0,v1] of shops){
        const fl={clothes:TL.CARPET,jewelry:TL.CARPET,food:TL.KTILE,pharmacy:TL.LINO,sports:TL.WOOD,electronics:TL.CARPET}[k]; setF(u0,v0,u1,v1,fl);
        const back = u0===1 ? u0 : u1, front = u0===1 ? u1-1 : u0+1;
        if(k==='clothes'){ for(let v=v0;v<=v1;v+=2) for(let u=Math.min(back,front);u<=Math.max(back,front);u+=3) put('rack',u,v,{c:'clothes'}); put('counter',front,v0,{c:'register'}); }
        if(k==='jewelry'){ for(let u=u0;u<=u1;u+=2){ put('display',u,v0,{c:'jewelry'}); put('display',u,v1,{c:'jewelry'}); } put('counter',back,v0+2,{c:'register'}); }
        if(k==='food'){ for(let u=u0+1;u<=u1-1;u+=3) put('table',u,v0+2); put('counter',back,v0,{c:'register'}); put('fridge',back,v1,{c:'fridge_drinks'}); put('fridge',back,v1-1,{c:'fridge'}); }
        if(k==='pharmacy'){ for(let v=v0;v<=v1;v+=2) for(let u=u0+1;u<=u1-1;u+=2) put('shelf',u,v,{c:'med',kind:'med'}); }
        if(k==='sports'){ for(let u=u0;u<=u1;u++) put('rack',u,v0,{c:'sports',kind:'sports'}); for(let u=u0+1;u<=u1-1;u+=2) put('shelf',u,v1,{c:'sports',kind:'sports'}); }
        if(k==='electronics'){ for(let u=u0+1;u<=u1-1;u+=2){ put('shelf',u,v0,{c:'junk',kind:'junk'}); put('shelf',u,v1,{c:'junk',kind:'junk'}); } }
      }
      put('bench',12,7,{w:2}); put('bench',14,12,{w:2}); put('trash',12,4,{c:'trash'});
      break; }
    case 'hospital': {
      windows(3);
      hw(4,1,LW-2,[12,13]);
      const wards=[[1,5],[7,11],[13,18],[20,LW-2]];
      hw(7,1,LW-2,wards.map(w=>Math.floor((w[0]+w[1])/2)));
      vw(6,8,LD-2); vw(12,8,LD-2); vw(19,8,LD-2);
      for(const [u0,u1] of wards){ for(let u=u0;u<=u1;u+=2) put('hbed',u,LD-3,{h:2}); put('cabinet',u1,8,{c:'med'}); }
      vw(6,1,3,[2]); for(let u=1;u<=5;u++) put('shelf',u,3,{c:'med',kind:'med'});
      put('desk',16,2,{w:2,c:'desk'}); put('bench',8,1,{w:2}); put('bench',19,1,{w:2});
      setF(1,5,LW-2,6,TL.LINO);
      break; }
    case 'clinic': {
      windows(3);
      hw(4,1,LW-2,[3,9]); vw(6,5,LD-2);
      for(const [u0,u1] of [[1,5],[7,LW-2]]){ put('hbed',u0,LD-3,{h:2}); put('cabinet',u1,LD-2,{c:'med'}); put('shelf',u1,5,{c:'med',kind:'med'}); }
      put('desk',du+1,2,{w:2,c:'desk'}); put('bench',1,1,{w:2});
      break; }
    case 'police': {
      windows(3);
      for(let u=1;u<=LW-2;u++) if(Math.abs(u-du)>1) put('counter',u,3);
      hw(4,1,LW-2,[du]);
      if(LW>=18){
        const g1=RI(6,LD-3), g2=RI(6,LD-3);
        vw(7,5,LD-2,[g1]); vw(14,5,LD-2,[g2]);
        for(let u=1;u<=6;u++) put('locker',u,LD-2,{c:'police'});
        put('locker',1,6,{c:'police'}); put('desk',9,6,{w:2,c:'desk'}); put('desk',9,9,{w:2,c:'desk'}); put('desk',11,6,{w:2,c:'desk'});
        for(let u=15;u<=LW-2;u++) if(u!==17){ const i=I(u,8); if(!reserved[i]) map[i]=TL.FENCE; }
        put('bed',16,LD-3,{h:2}); put('bed',19,LD-3,{h:2});
      } else {
        vw(5,5,LD-2,[RI(6,LD-3)]);
        for(let u=1;u<=4;u++) put('locker',u,LD-2,{c:'police'});
        put('desk',7,6,{w:2,c:'desk'}); put('cabinet',LW-2,LD-2,{c:'desk'});
      }
      break; }
    case 'gunstore': {
      windows(2,{back:false,sides:false});
      for(let u=1;u<=LW-3;u++) put('counter',u,4,{c: u===2 ? 'register' : null});
      resv(LW-2,4);
      for(let u=1;u<=LW-2;u++) put('rack',u,LD-2,{c:'guns',kind:'guns'});
      for(let v=5;v<=LD-3;v++){ put('rack',1,v,{c:'guns',kind:'guns'}); }
      put('display',3,2,{c:'guns'}); put('display',LW-3,2,{c:'guns'});
      break; }
    case 'conv': case 'kiosk': {
      windows(2,{back:false,sides:false});
      put('counter', du+2<LW-1?du+2:du-2, 2, {c:'register'}); put('counter', du+3<LW-1?du+3:du-3, 2);
      for(let u=1;u<=LW-2;u+=3){ if(Math.abs(u-du)<=1) continue; for(let v=4;v<=LD-3;v++) put('shelf',u,v,{c:'shelf_conv',kind:'food'}); }
      for(let u=1;u<=LW-2;u+=2) put('fridge',u,LD-2,{c:'fridge_drinks'});
      break; }
    case 'church': {
      windows(2,{front:false});
      for(let v=3; v<=LD-6; v+=2){ for(const u of [1,3,du+2,du+4]) if(Math.abs(u-du)>1 && Math.abs(u+1-du)>1) put('pew',u,v,{w:2}); }
      put('altar',du,LD-3,{w:2}) || put('altar',du-1,LD-3,{w:2});
      put('cabinet',1,LD-2,{c:'church'}); put('cabinet',LW-2,LD-2,{c:'church'});
      break; }
    case 'warehouse': {
      windows(6,{front:false});
      for(let v=3; v<=LD-3; v+=3) for(let u=2; u<=LW-3; u++){
        if(dl.some(([a])=>Math.abs(a-u)<=1)) continue;
        if(chance(.75)) put(chance(.5)?'crate':'shelf',u,v,{c:chance(.5)?'warehouse':'crate',kind:'box'});
      }
      break; }
    case 'shop': {
      windows(2,{back:false});
      const k=b.kind, far=u=>Math.abs(u-du)>1;
      setF(1,1,LW-2,LD-2,{healer:TL.LINO,jeweler:TL.CARPET,tailor:TL.CARPET,butcher:TL.CONC,carpenter:TL.WOOD}[k]||TL.WOOD);
      for(let u=1;u<=LW-2;u++) if(far(u)) put('counter',u,2,{c:u===du+2||u===du-2?'register':null});
      const back = { alchemist:['shelf',{kind:'potions'}], tailor:['rack',{c:'clothes'}], bowyer:['wrack',{kind:'bows'}], butcher:['hooks',{}], carpenter:['workbench',{}],
        healer:['bed',{h:2}], jeweler:['display',{c:'jewels'}], provisioner:['shelf',{kind:'food'}] }[k] || ['shelf',{}];
      for(let u=1;u<=LW-2;u+=(back[0]==='bed'?2:1)) put(back[0],u,back[0]==='bed'?LD-3:LD-2,back[1]);
      if(k==='alchemist') put('cauldron',1,4); if(k==='tailor') put('loom',LW-2,4); if(k==='carpenter') put('logs',1,4);
      if(k==='butcher') put('table',2,4); if(k==='provisioner'){ put('keg',1,4); put('hay',LW-2,4); } if(k==='bowyer') put('workbench',1,4);
      if(k==='healer') put('shelf',LW-2,4,{kind:'med'});
      break; }
    case 'office': {
      windows(2);
      const mid=Math.floor(LD/2); hw(mid,1,LW-2,[du,RI(2,LW-3)]);
      const sx=Math.floor(LW/2); vw(sx,mid+1,LD-2,[RI(mid+1,LD-2)]);
      setF(1,mid+1,LW-2,LD-2,TL.CARPET);
      for(let u=1;u<=LW-3;u+=3) put('desk',u,LD-2,{w:2,c:'desk'});
      put('cabinet',1,mid+1,{c:'desk'}); put('cabinet',LW-2,mid+1,{c:'desk'});
      put('counter',du+2<LW-1?du+2:du-2,2); put('bench',1,1,{w:2}); put('desk',LW-3,1,{w:2,c:'desk'});
      break; }
    case 'firestation': {
      windows(3,{front:false});
      const gEnd = Math.floor(LW*0.55);
      vw(gEnd,1,LD-2,[RI(3,LD-3)]);
      setF(1,1,gEnd-1,LD-2,TL.CONC); setF(gEnd+1,1,LW-2,LD-2,TL.LINO);
      // fire trucks parked in the bays, nose towards the doors
      const bays = dl.filter(([u,v])=>v===0 && u<gEnd).map(([u])=>u).filter((u,k,arr)=>!arr.includes(u-1));
      for(const u of bays) put('firetruck',u,3,{w:2,h:5,c:'firetruck'});
      for(let u=gEnd+1;u<=LW-2;u++) put('locker',u,LD-2,{c:'fire'});
      put('bed',gEnd+1,1,{h:2}); put('bed',gEnd+3,1,{h:2}); put('table',LW-3,4); put('fridge',LW-2,1,{c:'fridge'});
      for(let v=2;v<=LD-3;v+=3) put('rack',1,v,{c:'fire',kind:'sports'});
      break; }
    case 'booth': {
      windows(1);
      put('cabinet',1,LD-2,{c:'booth'}) || put('cabinet',LW-2,LD-2,{c:'booth'});
      break; }
  }
  rasterInterior(b,{map,mat,reserved,lobjs,doorsL,BW,BH,floor0});
  decorate(b);
  ensureAccess(b);
}

// logical cells -> physical tile ranges along one axis (border cells stay one tile wide)
function axisRanges(nl,np){
  const st=new Int32Array(nl), sz=new Int32Array(nl);
  st[0]=0; sz[0]=1; st[nl-1]=np-1; sz[nl-1]=1;
  const inner=nl-2, tot=np-2; if(inner<=0) return [st,sz];
  const base=Math.floor(tot/inner), rem=tot-base*inner;
  for(let k=1;k<=inner;k++) sz[k]=base;
  for(let r=0;r<rem;r++) sz[1+Math.min(inner-1,Math.floor((r+0.5)*inner/rem))]++;
  let p=1; for(let k=1;k<=inner;k++){ st[k]=p; p+=sz[k]; }
  return [st,sz];
}
const FILL_TYPES=new Set(['shelf','counter','rack','display','locker','cabinet','fridge']);
function rasterInterior(b,G){
  const {BW,BH}=G, Lm=G.map, [xs,xw]=axisRanges(BW,b.w), [ys,yw]=axisRanges(BH,b.h);
  const wallish=t=>t===TL.WALL||t===TL.WINDOW||t===TL.FENCE;
  const at=(x,y)=> x>=0&&y>=0&&x<BW&&y<BH ? Lm[y*BW+x] : 255;
  const isW=(x,y)=>{ const t=at(x,y); return t!==255 && wallish(t) && !G.doorsL.has(y*BW+x); };
  const isDoor=(x,y)=> x>=0&&y>=0&&x<BW&&y<BH && G.doorsL.has(y*BW+x);
  // floors
  for(let ly=0;ly<BH;ly++) for(let lx=0;lx<BW;lx++){
    const li=ly*BW+lx; let t=Lm[li];
    if(wallish(t)){ t=G.floor0; for(const [ax,ay] of [[lx+1,ly],[lx,ly+1],[lx-1,ly],[lx,ly-1]]){ const n=at(ax,ay); if(n!==255&&!wallish(n)){ t=n; break; } } }
    for(let y=b.y+ys[ly]; y<b.y+ys[ly]+yw[ly]; y++) for(let x=b.x+xs[lx]; x<b.x+xs[lx]+xw[lx]; x++){ const i=idx(x,y); bld[i]=b.id; map[i]=t; if(G.reserved[li]) reserved[i]=1; }
  }
  // walls, one tile thin, along the start row/column of each logical cell
  for(let ly=0;ly<BH;ly++) for(let lx=0;lx<BW;lx++){
    const li=ly*BW+lx, t=Lm[li]; if(!wallish(t) || G.doorsL.has(li)) continue;
    const Lf=isW(lx-1,ly)||isDoor(lx-1,ly), Rt=isW(lx+1,ly)||isDoor(lx+1,ly), Up=isW(lx,ly-1)||isDoor(lx,ly-1), Dn=isW(lx,ly+1)||isDoor(lx,ly+1);
    const X0=b.x+xs[lx], Y0=b.y+ys[ly], ex=X0+xw[lx]-1, ey=Y0+yw[ly]-1, cells=[];
    if(Up||Dn) for(let y=Y0;y<=(Dn?ey:Y0);y++) cells.push([X0,y]);
    if(Lf||Rt) for(let x=X0;x<=(Rt?ex:X0);x++) cells.push([x,Y0]);
    if(!cells.length) cells.push([X0,Y0]);
    for(const [x,y] of cells){ const i=idx(x,y); map[i]=t; mat[i]=G.mat[li]||b.mat; }
  }
  // doors: a lone door stays one tile; runs of doors (garages, shop fronts) keep their full width
  b.doors=[];
  for(const li of G.doorsL){
    const lx=li%BW, ly=(li/BW)|0, horiz = ly===0||ly===BH-1;
    const X0=b.x+xs[lx], Y0=b.y+ys[ly], cells=[];
    const runPrev = horiz ? isDoor(lx-1,ly) : isDoor(lx,ly-1), runNext = horiz ? isDoor(lx+1,ly) : isDoor(lx,ly+1);
    if(horiz){ if(runPrev||runNext) for(let x=X0;x<X0+xw[lx];x++) cells.push([x,Y0]); else cells.push([X0+Math.floor((xw[lx]-1)/2),Y0]); }
    else { if(runPrev||runNext) for(let y=Y0;y<Y0+yw[ly];y++) cells.push([X0,y]); else cells.push([X0,Y0+Math.floor((yw[ly]-1)/2)]); }
    for(const [x,y] of cells){ const i=idx(x,y); map[i]=G.floor0; const d={x,y,open:false,b:b.id}; doors.set(i,d); chunkDoors[cidx(x,y)].push(d); b.doors.push([x,y]);
      // keep the tiles just inside free
      const ix = x===b.x?1:x===b.x+b.w-1?-1:0, iy = y===b.y?1:y===b.y+b.h-1?-1:0; for(let k=1;k<=2;k++) reserved[idx(x+ix*k,y+iy*k)]=1; }
  }
  b.doors.sort((p,q)=>p[1]-q[1]||p[0]-q[0]);
  // furniture
  const cellObj=new Map(); for(const o of G.lobjs) for(let dy=0;dy<o.h;dy++) for(let dx=0;dx<o.w;dx++) cellObj.set((o.y+dy)*BW+o.x+dx,o);
  const same=(x,y,t)=>{ const o=cellObj.get(y*BW+x); return !!(o&&o.type===t); };
  const free=(x,y,w,h)=>{ for(let yy=y;yy<y+h;yy++) for(let xx=x;xx<x+w;xx++){ if(xx<=b.x||yy<=b.y||xx>=b.x+b.w-1||yy>=b.y+b.h-1) return false; const i=idx(xx,yy);
      if(objGrid[i]||doors.has(i)||map[i]===TL.WALL||map[i]===TL.WINDOW||map[i]===TL.FENCE) return false; } return true; };
  for(const o of G.lobjs){
    const Xs=b.x+xs[o.x], Xe=b.x+xs[o.x+o.w-1]+xw[o.x+o.w-1]-1, Ys=b.y+ys[o.y], Ye=b.y+ys[o.y+o.h-1]+yw[o.y+o.h-1]-1;
    let wl=false,wr=false,wu=false,wd=false;
    for(let k=0;k<o.h;k++){ if(isW(o.x-1,o.y+k)) wl=true; if(isW(o.x+o.w,o.y+k)) wr=true; }
    for(let k=0;k<o.w;k++){ if(isW(o.x+k,o.y-1)) wu=true; if(isW(o.x+k,o.y+o.h)) wd=true; }
    const pw=o.w, ph=o.h;
    let px = wl ? Xs : wr ? Xe-pw+1 : Xs+Math.floor((Xe-Xs+1-pw)/2);
    let py = wu ? Ys : wd ? Ye-ph+1 : Ys+Math.floor((Ye-Ys+1-ph)/2);
    const spots=[[px,py]];
    if(FILL_TYPES.has(o.type) && o.w===1 && o.h===1){
      const hz = same(o.x-1,o.y,o.type)||same(o.x+1,o.y,o.type), vt = same(o.x,o.y-1,o.type)||same(o.x,o.y+1,o.type);
      if(hz){ spots.length=0; for(let x=Xs;x<=Xe;x++) spots.push([x,py]); }
      else if(vt){ spots.length=0; for(let y=Ys;y<=Ye;y++) spots.push([px,y]); }
    }
    let first=true;
    for(const [x,y] of spots){ if(!free(x,y,pw,ph)) continue;
      addObj({type:o.type, x, y, w:pw, h:ph, solid:true, container: first ? o.container : (o.type==='counter'?null:o.container), kind:o.kind, b:b.id}); first=false; }
  }
}

// Every container / bed / device inside a building must be reachable from a door.
// If furniture blocks the way, the cheapest blocking pieces are removed (plain furniture first).
function ensureAccess(b,list){
  const inside=(x,y)=>x>b.x&&y>b.y&&x<b.x+b.w-1&&y<b.y+b.h-1;
  const open=(x,y)=>{ if(!inB(x,y)) return false; const i=idx(x,y), t=map[i]; if(doors.has(i)) return true;
    if(t===TL.WALL||t===TL.WINDOW||t===TL.FENCE||t===TL.WATER||t===TL.SEA) return false; const o=objGrid[i]; return !(o&&o.solid); };
  const passable=(x,y)=>{ if(!inB(x,y)) return false; const i=idx(x,y), t=map[i]; if(doors.has(i)) return true;
    return !(t===TL.WALL||t===TL.WINDOW||t===TL.FENCE||t===TL.WATER||t===TL.SEA); };
  const seeds=b.doors.map(([x,y])=>[x,y]);
  const reach=()=>{ const seen=new Set(), q=[]; for(const [x,y] of seeds){ seen.add(idx(x,y)); q.push([x,y]); }
    while(q.length){ const [x,y]=q.pop(); for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx=x+dx, ny=y+dy, i=idx(nx,ny);
      if(seen.has(i) || !(inside(nx,ny)||doors.has(i)) || !open(nx,ny)) continue; seen.add(i); q.push([nx,ny]); } }
    return seen; };
  const targets=()=>(list ? list.filter(o=>objGrid[idx(o.x,o.y)]===o) : objs).filter(o=>o.b===b.id && (o.container || ACT_TYPES.has(o.type)));
  for(let guard=0; guard<90; guard++){
    const R_=reach(); let blocked=null;
    for(const o of targets()){
      let ok=false;
      for(let dy=0;dy<o.h&&!ok;dy++) for(let dx=0;dx<o.w&&!ok;dx++) for(const [ex,ey] of [[1,0],[-1,0],[0,1],[0,-1]]) if(R_.has(idx(o.x+dx+ex,o.y+dy+ey))){ ok=true; break; }
      if(!ok){ blocked=o; break; }
    }
    if(!blocked) return;
    // 0-1 BFS: free tiles cost 0, tiles with furniture cost 1 (containers 3), find cheapest way to a tile next to the target
    const goal=new Set(); for(let dy=0;dy<blocked.h;dy++) for(let dx=0;dx<blocked.w;dx++) for(const [ex,ey] of [[1,0],[-1,0],[0,1],[0,-1]]){ const gx=blocked.x+dx+ex, gy=blocked.y+dy+ey; if(inside(gx,gy) && objGrid[idx(gx,gy)]!==blocked && passable(gx,gy)) goal.add(idx(gx,gy)); }
    const dist=new Map(), prev=new Map(), dq=[]; for(const i of R_){ dist.set(i,0); dq.push(i); }
    let hit=null;
    while(dq.length){ let bi=0; for(let k=1;k<dq.length;k++) if(dist.get(dq[k])<dist.get(dq[bi])) bi=k; const c=dq.splice(bi,1)[0];
      if(goal.has(c)){ hit=c; break; }
      const cx=c%W, cy=(c/W)|0;
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx=cx+dx, ny=cy+dy, n=idx(nx,ny); if(!inside(nx,ny)||!passable(nx,ny)) continue;
        const o=objGrid[n]; if(o===blocked) continue; const w8 = o&&o.solid ? (o.container||ACT_TYPES.has(o.type) ? 3 : 1) : 0;
        const nd=dist.get(c)+w8; if(!dist.has(n)||nd<dist.get(n)){ dist.set(n,nd); prev.set(n,c); dq.push(n); } } }
    if(hit===null){ removeObjRaw(blocked); continue; } // walled in: drop it
    for(let c=hit; prev.has(c); c=prev.get(c)){ const o=objGrid[c]; if(o&&o.solid) removeObjRaw(o); }
  }
}
function removeObjRaw(o){ // used while building the world (before walk/power exist)
  for(let dy=0;dy<o.h;dy++) for(let dx=0;dx<o.w;dx++){ const i=idx(o.x+dx,o.y+dy); if(objGrid[i]===o) objGrid[i]=null; }
  const L=chunkObjs[cidx(o.x,o.y)], k=L.indexOf(o); if(k>=0) L.splice(k,1);
  const j=objs.lastIndexOf(o); if(j>=0) objs.splice(j,1);
}

// ---------------- Chunk renderer ----------------
const chunkCache=new Map(); const CHUNK_MAX=30;
function getChunk(ci){
  let c=chunkCache.get(ci);
  if(c){ chunkCache.delete(ci); chunkCache.set(ci,c); return c; }
  c=document.createElement('canvas'); c.width=CH*T; c.height=CH*T;
  const g=c.getContext('2d'), cx0=(ci%NCX)*CH, cy0=Math.floor(ci/NCX)*CH;
  for(let y=cy0;y<Math.min(H,cy0+CH);y++) for(let x=cx0;x<Math.min(W,cx0+CH);x++) drawTile(g,x,y,(x-cx0)*T,(y-cy0)*T);
  // drop shadows of buildings that touch this chunk
  g.fillStyle='rgba(0,0,0,.28)';
  for(const b of chunkBlds[ci]){ g.fillRect((b.x-cx0)*T+4,(b.y+b.h-cy0)*T,b.w*T,5); g.fillRect((b.x+b.w-cx0)*T,(b.y-cy0)*T+8,4,b.h*T-3); }
  for(const b of buildingsBelow(ci,cx0,cy0)) { g.fillRect((b.x-cx0)*T+4,(b.y+b.h-cy0)*T,b.w*T,5); }
  for(const d of chunkDecals[ci]){ g.fillStyle=d.c; g.fillRect(d.x-cx0*T,d.y-cy0*T,d.w,1); }
  chunkCache.set(ci,c);
  while(chunkCache.size>CHUNK_MAX) chunkCache.delete(chunkCache.keys().next().value);
  return c;
}
function buildingsBelow(ci,cx0,cy0){ // buildings in the chunk above whose shadow spills into this one
  if(ci<NCX) return []; return chunkBlds[ci-NCX].filter(b=>b.y+b.h===cy0 && !chunkBlds[ci].includes(b));
}
function addDecal(x,y,c,w=1){
  const ci=cidx(Math.floor(x/T),Math.floor(y/T)); if(ci<0||ci>=chunkDecals.length) return;
  const L=chunkDecals[ci]; L.push({x:Math.round(x),y:Math.round(y),c,w}); if(L.length>500) L.shift();
  const cv=chunkCache.get(ci); if(cv){ const g=cv.getContext('2d'); g.fillStyle=c; g.fillRect(Math.round(x)-(ci%NCX)*CH*T, Math.round(y)-Math.floor(ci/NCX)*CH*T, w, 1); }
}
function speck(g,px,py,cols,n,x,y,k=0){
  for(let i=0;i<n;i++){ const a=th(x,y,k+i*3+1), b=th(x,y,k+i*3+2), c=th(x,y,k+i*3+3);
    g.fillStyle=cols[Math.floor(c*cols.length)]; g.fillRect(px+Math.floor(a*T), py+Math.floor(b*T), 1, c>.85?2:1); }
}
function tileAt(x,y){ return inB(x,y) ? map[idx(x,y)] : TL.GRASS; }
function isWallish(x,y){ if(!inB(x,y)) return false; const t=map[idx(x,y)]; return t===TL.WALL||t===TL.WINDOW||doors.has(idx(x,y)); }
function drawGrass(g,px,py,x,y,base='#38432a',cols=['#435032','#2e3822','#4d5b35','#55633a']){
  g.fillStyle=base; g.fillRect(px,py,T,T); speck(g,px,py,cols,24,x,y);
  if(th(x,y,99)>.62){ g.fillStyle='#6b6a3c'; const bx=px+Math.floor(th(x,y,98)*12); g.fillRect(bx,py+6,1,3); g.fillRect(bx+2,py+5,1,4); g.fillRect(bx+4,py+7,1,2); }
}
function drawTile(g,x,y,px,py){
  const i=idx(x,y), t=map[i];
  switch(t){
    case TL.GRASS: drawGrass(g,px,py,x,y); break;
    case TL.PARK: drawGrass(g,px,py,x,y,'#3c4b2b',['#47582f','#34422a','#52643a','#5c6e3e']);
      if(th(x,y,61)>.93){ g.fillStyle=th(x,y,62)>.5?'#b8a24a':'#a05a5a'; g.fillRect(px+Math.floor(th(x,y,63)*13),py+Math.floor(th(x,y,64)*13),2,2); } break;
    case TL.FOREST: g.fillStyle='#29331f'; g.fillRect(px,py,T,T); speck(g,px,py,['#34401f','#222b19','#46402a','#3a4426','#4f4428'],26,x,y); break;
    case TL.DIRT: g.fillStyle='#53442f'; g.fillRect(px,py,T,T); speck(g,px,py,['#4a3c29','#615038','#3d3223','#6b5a40'],20,x,y); break;
    case TL.ASPH: { // calçamento de pedra (paralelepípedos irregulares)
      g.fillStyle='#38332d'; g.fillRect(px,py,T,T);
      for(let r=0;r<4;r++){ const off=((y*4+r)%2)*2; for(let k=-1;k<4;k++){ const sx0=px+k*4+off+Math.floor(th(x*4+k,y*4+r,7)*2), sw=3+Math.floor(th(x*4+k,y*4+r,8)*2);
          const a=Math.max(px,sx0), b=Math.min(px+T,sx0+sw); if(b<=a) continue; g.fillStyle=shade('#5e574e',0.82+th(x*4+k,y*4+r,9)*0.32); g.fillRect(a,py+r*4,b-a,3);
          g.fillStyle='rgba(255,240,220,.07)'; g.fillRect(a,py+r*4,b-a,1); } }
      if(th(x,y,10)>.9){ g.fillStyle='#4a5a34'; g.fillRect(px+Math.floor(th(x,y,11)*14),py+Math.floor(th(x,y,12)*14),1,1); }
      const m=mark[i];
      if(m&1 && x%3!==0 && th(x,y,9)>.15){ g.fillStyle='#7a6b3a'; g.fillRect(px+2,py+15,12,1); }
      if(m&2 && y%3!==0 && th(x,y,10)>.15){ g.fillStyle='#7a6b3a'; g.fillRect(px+15,py+2,1,12); }
      if(tileAt(x,y-1)===TL.WATER||tileAt(x,y+1)===TL.WATER||tileAt(x-1,y)===TL.WATER||tileAt(x+1,y)===TL.WATER){ // bridge rails
        g.fillStyle='#5a5a56'; if(tileAt(x,y-1)===TL.WATER) g.fillRect(px,py,T,2); if(tileAt(x,y+1)===TL.WATER) g.fillRect(px,py+14,T,2);
        if(tileAt(x-1,y)===TL.WATER) g.fillRect(px,py,2,T); if(tileAt(x+1,y)===TL.WATER) g.fillRect(px+14,py,2,T); }
      break; }
    case TL.WALK: g.fillStyle='#57524a'; g.fillRect(px,py,T,T); g.fillStyle='#3e3a34'; g.fillRect(px,py,T,1); g.fillRect(px,py,1,T); g.fillRect(px+8,py+8,8,1); g.fillRect(px+8,py,1,8);
      speck(g,px,py,['#625c53','#4c4740'],10,x,y); if(th(x,y,11)>.8){ g.fillStyle='#4a5634'; g.fillRect(px+Math.floor(th(x,y,12)*14),py+1,1,2); } break;
    case TL.CONC: g.fillStyle='#5a5650'; g.fillRect(px,py,T,T); g.fillStyle='#46423d'; g.fillRect(px,py,T,1); g.fillRect(px,py,1,T); if((x+y)%2) g.fillRect(px,py+8,T,1); else g.fillRect(px+8,py,1,T);
      speck(g,px,py,['#625e57','#504c46','#45413b'],12,x,y);
      if(th(x,y,13)>.9){ g.fillStyle='rgba(20,18,16,.35)'; g.fillRect(px+3,py+5,7,4); }
      if(mark[i]&4){ g.fillStyle='#8a8a7c'; g.fillRect(px,py,1,T); } break;
    case TL.WOOD: g.fillStyle='#563f2c'; g.fillRect(px,py,T,T); g.fillStyle='#45321f';
      for(let r=0;r<4;r++){ g.fillRect(px,py+r*4+3,T,1); g.fillRect(px+((r*5+x*7+y*3)%16),py+r*4,1,3); }
      speck(g,px,py,['#61472f','#4b3826'],6,x,y); break;
    case TL.KTILE: for(let j=0;j<2;j++) for(let k=0;k<2;k++){ g.fillStyle=(j+k)%2?'#5d5c55':'#6c6b63'; g.fillRect(px+k*8,py+j*8,8,8); }
      g.fillStyle='#4a4943'; g.fillRect(px,py,T,1); g.fillRect(px,py,1,T); break;
    case TL.LINO: g.fillStyle='#86847b'; g.fillRect(px,py,T,T); g.fillStyle='#7c7a72'; g.fillRect(px+8,py,8,8); g.fillRect(px,py+8,8,8);
      g.fillStyle='#6c6a63'; g.fillRect(px,py,T,1); g.fillRect(px,py,1,T); speck(g,px,py,['#77756d','#8e8c83'],5,x,y); break;
    case TL.CARPET: { const c=CARPETS[(bld[i]>=0?bld[i]:0)%CARPETS.length]; g.fillStyle=c; g.fillRect(px,py,T,T);
      speck(g,px,py,[shade(c,1.12),shade(c,.88)],18,x,y); break; }
    case TL.SEA: {
      g.fillStyle='#1b2e42'; g.fillRect(px,py,T,T); speck(g,px,py,['#203650','#172838','#24405a'],12,x,y);
      if(th(x,y,15)>.8){ g.fillStyle='#34587a'; g.fillRect(px+Math.floor(th(x,y,16)*9),py+Math.floor(th(x,y,17)*14),6,1); }
      const shore = tileAt(x,y-1)!==TL.SEA||tileAt(x,y+1)!==TL.SEA||tileAt(x-1,y)!==TL.SEA||tileAt(x+1,y)!==TL.SEA;
      if(shore){ g.fillStyle='#6d8a98'; if(tileAt(x,y-1)!==TL.SEA) g.fillRect(px,py,T,2); if(tileAt(x,y+1)!==TL.SEA) g.fillRect(px,py+14,T,2);
        if(tileAt(x-1,y)!==TL.SEA) g.fillRect(px,py,2,T); if(tileAt(x+1,y)!==TL.SEA) g.fillRect(px+14,py,2,T); }
      break; }
    case TL.FIELD: g.fillStyle='#4e3f2a'; g.fillRect(px,py,T,T);
      for(let r=0;r<4;r++){ g.fillStyle='#3e3220'; g.fillRect(px,py+r*4+3,T,1); for(let k=0;k<8;k++){ if(th(x,y,30+r*8+k)<.25) continue; g.fillStyle=th(x,y,60+r*8+k)>.7?'#7a7a3a':'#4a6a2a'; g.fillRect(px+k*2,py+r*4,1+(th(x,y,90+k)>.5?1:0),2); } }
      break;
    case TL.SAND: g.fillStyle='#8a7a56'; g.fillRect(px,py,T,T); speck(g,px,py,['#968660','#7c6d4c','#a0906a','#6e6248'],22,x,y);
      if(th(x,y,23)>.93){ g.fillStyle='#d8d0c0'; g.fillRect(px+Math.floor(th(x,y,24)*13),py+Math.floor(th(x,y,25)*13),2,1); } break;
    case TL.PIER: g.fillStyle='#1b2e42'; g.fillRect(px,py,T,T); g.fillStyle='#5e4630';
      for(let r=0;r<4;r++) g.fillRect(px,py+r*4,T,3); g.fillStyle='#46321f'; g.fillRect(px+((x*5+y*3)%14),py,1,T);
      g.fillStyle='#3a2a1a'; if(x%4===0&&y%4===0) g.fillRect(px+1,py+1,3,3); break;
    case TL.WATER: {
      g.fillStyle='#22364a'; g.fillRect(px,py,T,T); speck(g,px,py,['#2a4058','#1c2e40','#2f4a62'],14,x,y);
      if(th(x,y,15)>.85){ g.fillStyle='#3b5a72'; g.fillRect(px+Math.floor(th(x,y,16)*10),py+Math.floor(th(x,y,17)*14),4,1); }
      g.fillStyle='#5a7484';
      if(tileAt(x,y-1)!==TL.WATER) g.fillRect(px,py,T,1);
      if(tileAt(x-1,y)!==TL.WATER) g.fillRect(px,py,1,T);
      break; }
    case TL.WALL: case TL.WINDOW: {
      let done=false;
      for(const [nx,ny] of [[x,y+1],[x,y-1],[x+1,y],[x-1,y]]){ if(!inB(nx,ny)) continue; const nt=map[idx(nx,ny)]; if(nt===TL.WALL||nt===TL.WINDOW||nt===TL.FENCE) continue; drawTile(g,nx,ny,px,py); done=true; break; }
      if(!done){ g.fillStyle='#1c1816'; g.fillRect(px,py,T,T); }
      break; }
    case TL.FENCE: {
      const under = regionId[i]!==255 && bld[i]<0 ? '#38432a' : '#38432a';
      if(bld[i]>=0){ g.fillStyle='#565753'; g.fillRect(px,py,T,T); g.fillStyle='#3a3c3e'; for(let k=1;k<T;k+=3) g.fillRect(px+k,py,1,T); g.fillRect(px,py+2,T,1); g.fillRect(px,py+12,T,1); break; }
      drawGrass(g,px,py,x,y,under);
      const horiz = tileAt(x-1,y)===TL.FENCE || tileAt(x+1,y)===TL.FENCE;
      g.fillStyle='#6a5236';
      if(horiz){ g.fillRect(px,py+7,T,2); g.fillRect(px,py+11,T,1); for(let k=1;k<T;k+=4){ g.fillStyle='#7d6342'; g.fillRect(px+k,py+4,2,9); g.fillStyle='#4a3824'; g.fillRect(px+k,py+13,2,1); } }
      else { g.fillRect(px+7,py,2,T); g.fillStyle='#7d6342'; for(let k=1;k<T;k+=4) g.fillRect(px+6,py+k,4,2); }
      break; }
  }
}
// ---------------- Tall walls (3/4 view) ----------------
// A wall tile is drawn as a sprite HW px taller than its footprint: a thin cap on top and, where
// nothing stands south of it, a full-height face. Walls are depth-sorted with people and objects.
const HW=24, WALL_CACHE=new Map();
function wallFlags(x,y){ return (isWallish(x,y-1)?1:0)|(isWallish(x+1,y)?2:0)|(isWallish(x,y+1)?4:0)|(isWallish(x-1,y)?8:0); }
function wallFacePattern(g,M,x0,x1,par,y0,h){
  const P=(a,b,w,hh,c)=>{ g.fillStyle=c; g.fillRect(a,b,w,hh); };
  P(x0,y0,x1-x0,h,M.face);
  g.fillStyle=M.line;
  if(M.pat==='brick'){ for(let r=0;r*4<h;r++){ const yy=y0+r*4; P(x0,yy,x1-x0,1,M.line); const off=(r+par)%2?0:4; for(let k=off;k<16;k+=8) if(k>=x0&&k<x1) P(k,yy,1,4,M.line); } }
  else if(M.pat==='siding'){ for(let r=0;r*3<h;r++){ P(x0,y0+r*3+2,x1-x0,1,M.line); P(x0,y0+r*3,x1-x0,1,shade(M.face,1.08)); } }
  else if(M.pat==='block'){ for(let r=0;r*6<h;r++){ P(x0,y0+r*6,x1-x0,1,M.line); const k=(r+par)%2?4:12; if(k>=x0&&k<x1) P(k,y0+r*6,1,6,M.line); } }
  else if(M.pat==='planks'){ for(let k=0;k<4;k++){ if(k*4+3<x1&&k*4+3>=x0) P(k*4+3,y0,1,h,M.line); if(k*4>=x0&&k*4<x1) P(k*4,y0,1,h,shade(M.face,1.1)); }
    P(Math.max(x0,1),y0+3,1,1,'#b8b8b0'); P(Math.min(x1-2,13),y0+3,1,1,'#b8b8b0'); P(Math.max(x0,1),y0+h-5,1,1,'#b8b8b0'); P(Math.min(x1-2,13),y0+h-5,1,1,'#b8b8b0'); }
  else if(M.pat==='ashlar'){ for(let r=0;r*5<h;r++){ const yy=y0+r*5; P(x0,yy,x1-x0,1,M.line); const off=(r+par)%2?0:5;
      for(let k=off;k<16;k+=10) if(k>=x0&&k<x1) P(k,yy,1,5,M.line);
      for(let k=0;k<3;k++){ g.fillStyle=shade(M.face,0.88+th(par,r*3+k,41)*0.24); g.fillRect(x0+Math.floor(th(par,r*3+k,51)*(x1-x0-3)),yy+1+Math.floor(th(par,r,61)*2),3,2); } } }
  else if(M.pat==='timber'){ for(let k=0;k<10;k++){ g.fillStyle=shade(M.face,0.92+th(par,k,42)*0.14); g.fillRect(x0+Math.floor(th(par,k,52)*(x1-x0-2)),y0+Math.floor(th(par,k,62)*(h-2)),2,1); }
      P(x0,y0+Math.floor(h/2),x1-x0,2,M.line); if(x0<=1) P(x0,y0,2,h,M.line); if(x1>=15) P(x1-2,y0,2,h,M.line);
      if(par&1){ for(let i=0;i<Math.floor(h/2)-1;i++){ const xx=x0+Math.floor(i*(x1-x0)/(h/2)); P(xx,y0+i,2,1,M.line); } } }
  else if(M.pat==='stone'){ for(let k=0;k<12;k++){ g.fillStyle=shade(M.face,0.8+th(par,k,40)*0.4); g.fillRect(x0+Math.floor(th(par,k,50)*(x1-x0-3)),y0+Math.floor(th(par,k,60)*(h-3)),3+Math.floor(th(par,k,70)*3),2+Math.floor(th(par,k,80)*2)); } }
  else { for(let k=0;k<14;k++){ g.fillStyle=k%2?M.line:shade(M.face,1.06); g.fillRect(x0+Math.floor(th(par,k,3)*(x1-x0)),y0+Math.floor(th(par,k,4)*h),1,1); } }
  P(x0,y0,x1-x0,2,'rgba(0,0,0,.35)'); P(x0,y0+h-3,x1-x0,3,shade(M.face,.62)); P(x0,y0+h-3,x1-x0,1,shade(M.face,.8));
  P(x0,y0+2,x1-x0,1,'rgba(255,230,200,.06)');
}
function wallSprite(m,f,win,par){
  const key=m*1000+f*10+(win?1:0)*5+(par&1);
  let c=WALL_CACHE.get(key); if(c) return c;
  c=document.createElement('canvas'); c.width=T; c.height=T+HW; const g=c.getContext('2d');
  const M=MATS[m]||MATS[1], P=(a,b,w,h,col)=>{ g.fillStyle=col; g.fillRect(a,b,w,h); };
  const N=f&1, E=f&2, S=f&4, Wf=f&8, x0=Wf?0:3, x1=E?16:13;
  const capC=M.cap, capL=shade(M.cap,1.35), capD=shade(M.cap,.7);
  // cap
  P(x0,8,x1-x0,8,capC); if(N) P(3,0,10,8,capC);
  if(!N) P(Math.max(x0,3)-(Wf?3:0),8,(x1-x0),1,capL);
  P(3,N?0:8,1,N?16:8,capL); P(12,N?0:8,1,N?16:8,capD);
  if(!Wf) P(3,8,1,8,capL); if(!E) P(12,8,1,8,capD);
  if(Wf) P(0,8,3,1,capL); if(E) P(13,8,3,1,capL);
  if(win && S){ P(6,1,4,14,'#2a3a48'); P(7,2,1,6,'#6d8798'); }
  if(!S){
    wallFacePattern(g,M,x0,x1,par,16,HW);
    if(win){ const wx=Math.max(x0+2,3), ww=Math.min(x1-2,13)-wx; P(wx-1,19,ww+2,13,'#231f1c'); P(wx,20,ww,11,'#38495a');
      P(wx+1,21,2,1,'#6d8798'); P(wx+1,22,1,2,'#6d8798'); P(wx+ww-3,27,2,1,'#5a7484'); P(wx+Math.floor(ww/2),20,1,11,'#231f1c'); P(wx,25,ww,1,'#231f1c');
      P(wx-2,32,ww+4,2,'#9a948a'); P(wx-2,33,ww+4,1,'#6a645a'); }
  }
  WALL_CACHE.set(key,c); return c;
}
function doorSprite(m,f,open){
  const key='d'+m+'|'+f+'|'+(open?1:0); let c=WALL_CACHE.get(key); if(c) return c;
  c=document.createElement('canvas'); c.width=T; c.height=T+HW; const g=c.getContext('2d');
  const M=MATS[m]||MATS[8], P=(a,b,w,h,col)=>{ g.fillStyle=col; g.fillRect(a,b,w,h); };
  const side = (f&1||f&4) && !(f&2||f&8);
  if(side){ // door in a north-south wall, seen from above
    if(!open){ P(4,0,8,16,'#664629'); P(4,0,1,16,'#7d5a36'); P(11,0,1,16,'#4e3420'); P(7,0,1,16,'#523822'); P(9,9,2,1,'#c4a35e'); }
    else { P(3,0,10,2,M.cap); P(3,14,10,2,M.cap); P(4,2,2,12,'#5a3e24'); }
  } else {
    P(0,8,16,8,M.cap); P(0,8,16,1,shade(M.cap,1.35));                 // lintel cap
    P(0,16,2,HW,shade(M.face,.85)); P(14,16,2,HW,shade(M.face,.85));  // frame posts
    P(0,16,16,3,shade(M.face,.75));
    if(!open){ P(2,19,12,HW-3,'#664629'); P(2,19,12,1,'#7d5a36'); P(3,21,4,7,'#5a3c22'); P(9,21,4,7,'#5a3c22'); P(3,30,4,8,'#5a3c22'); P(9,30,4,8,'#5a3c22'); P(11,30,1,2,'#d4b36e'); P(2,HW+15,12,1,'#3a2614'); }
    else { P(2,19,2,HW-3,'#4e3420'); P(2,19,1,HW-3,'#6a4a2c'); }
  }
  WALL_CACHE.set(key,c); return c;
}
function drawWallTile(g,x,y,px,py,win){
  const M=MATS[mat[idx(x,y)]]||MATS[1];
  const face = !isWallish(x,y+1);
  g.fillStyle=M.cap; g.fillRect(px,py,T,T);
  if(face){
    g.fillStyle=shade(M.face,0.7); g.fillRect(px,py,T,1);
    g.fillStyle=M.face; g.fillRect(px,py+5,T,11);
    g.fillStyle=M.line;
    if(M.pat==='brick'){ for(let r=0;r<3;r++){ const yy=py+5+r*4; g.fillRect(px,yy,T,1); const off=(r+x)%2?0:4; g.fillRect(px+off,yy,1,4); g.fillRect(px+off+8,yy,1,4); } }
    else if(M.pat==='siding'){ for(let r=0;r<4;r++){ g.fillStyle=M.line; g.fillRect(px,py+7+r*3,T,1); g.fillStyle=shade(M.face,1.08); g.fillRect(px,py+5+r*3,T,1); } }
    else if(M.pat==='block'){ g.fillRect(px,py+9,T,1); g.fillRect(px,py+13,T,1); g.fillRect(px+((y+x)%2?4:12),py+5,1,4); g.fillRect(px+((y+x)%2?12:4),py+10,1,3); }
    else if(M.pat==='planks'){ for(let k=0;k<4;k++){ g.fillStyle=M.line; g.fillRect(px+k*4+3,py+5,1,11); g.fillStyle=shade(M.face,1.1); g.fillRect(px+k*4,py+5,1,11); }
      g.fillStyle='#b8b8b0'; g.fillRect(px+1,py+7,1,1); g.fillRect(px+13,py+7,1,1); g.fillRect(px+1,py+13,1,1); g.fillRect(px+13,py+13,1,1); }
    else if(M.pat==='stone'){ for(let k=0;k<7;k++){ g.fillStyle=shade(M.face,0.8+th(x,y,40+k)*0.4); g.fillRect(px+Math.floor(th(x,y,50+k)*12),py+5+Math.floor(th(x,y,60+k)*8),3+Math.floor(th(x,y,70+k)*3),2+Math.floor(th(x,y,80+k)*2)); } }
    else { speck(g,px,py+5,[M.line,shade(M.face,1.06)],8,x,y,3); }
    g.fillStyle='rgba(0,0,0,.35)'; g.fillRect(px,py+15,T,1);
    g.fillStyle='rgba(255,230,200,.06)'; g.fillRect(px,py+5,T,1);
    if(win){ g.fillStyle='#231f1c'; g.fillRect(px+3,py+6,10,8); g.fillStyle='#38495a'; g.fillRect(px+4,py+7,8,6);
      g.fillStyle='#6d8798'; g.fillRect(px+5,py+8,1,1); g.fillRect(px+6,py+7,1,1); g.fillRect(px+9,py+10,2,1);
      g.fillStyle='#231f1c'; g.fillRect(px+7,py+7,1,6); g.fillStyle='#9a948a'; g.fillRect(px+2,py+14,12,1); }
    else if(!bld || bld[idx(x,y)]<0 ? false : th(x,y,30)>.85){ g.fillStyle='#3f4a2c'; g.fillRect(px+Math.floor(th(x,y,31)*12),py+13,3,2); }
  } else {
    g.fillStyle=shade(M.face,0.55); g.fillRect(px+3,py,10,T);
    g.fillStyle=M.cap; g.fillRect(px+4,py,8,T);
    if(win){ g.fillStyle='#4f6878'; g.fillRect(px+5,py+2,6,12); g.fillStyle='#7d97a6'; g.fillRect(px+6,py+3,1,4); }
  }
}

// ---------------- Pixel font for roof signs ----------------
const FONT = { A:['010','101','111','101','101'], C:['011','100','100','100','011'], E:['111','100','110','100','111'], G:['011','100','101','101','011'],
  H:['101','101','111','101','101'], I:['111','010','010','010','111'], K:['101','101','110','101','101'], L:['100','100','100','100','111'],
  M:['101','111','111','101','101'], N:['110','101','101','101','101'], O:['010','101','101','101','010'], P:['110','101','110','100','100'],
  R:['110','101','110','101','101'], S:['011','100','010','001','110'], T:['111','010','010','010','010'], U:['101','101','101','101','111'],
  B:['110','101','110','101','110'], D:['110','101','101','101','110'], F:['111','100','110','100','100'], J:['001','001','001','101','010'],
  Q:['010','101','101','110','011'], V:['101','101','101','101','010'], W:['101','101','111','111','101'], X:['101','101','010','101','101'],
  Y:['101','101','010','010','010'], Z:['111','001','010','100','111'],
  0:['010','101','101','101','010'], 1:['010','110','010','010','111'], 3:['110','001','010','001','110'], 5:['111','100','110','001','110'],
  6:['011','100','110','101','010'], 8:['010','101','010','101','010'], 9:['010','101','011','001','110'],
  "'":['010','010','000','000','000'], '.':['000','000','000','000','010'], '&':['010','101','010','101','011'], '-':['000','000','111','000','000'], ':':['000','010','000','010','000'], '!':['010','010','010','000','010'],
  2:['110','001','010','100','111'], 4:['101','101','111','001','001'], 7:['111','001','010','010','010'], '/':['001','001','010','100','100'], ' ':['000','000','000','000','000'] };
function drawText(g,txt,cx,cy,s,col){
  const wpx=txt.length*4*s-s; let x=Math.round(cx-wpx/2); const y=Math.round(cy-2.5*s);
  g.fillStyle=col; for(const ch of txt){ const gl=FONT[ch]||FONT[' ']; for(let r=0;r<5;r++) for(let c=0;c<3;c++) if(gl[r][c]==='1') g.fillRect(x+c*s,y+r*s,s,s); x+=4*s; }
}

// ---------------- Business names & storefront signs ----------------
const NAMES = {
  diner:['ROSIE\'S DINER','BLUE MOON CAFE','SUNNY SIDE DINER','MEL\'S DINER','CORNER CAFE','JOE\'S GRILL','THE COFFEE CUP','DAILY BREAD'],
  bar:['THE RUSTY ANCHOR','LAST CALL','IRON HORSE PUB','THE LANTERN','O\'MALLEY\'S','BLACK DOG BAR','DUSK TAVERN','THE OLD OAK'],
  hardware:['MILLER HARDWARE','FIX-IT DEPOT','TRUE TOOLS','NAILS & BOLTS','HAMMER TIME'],
  pharmacy:['MAIN ST. PHARMACY','CAREWELL DRUGS','RITE PHARMACY','GOOD HEALTH RX','CITY DRUGS'],
  clothes:['THREADS','BELLA MODA','DENIM & CO.','URBAN WEAR','STYLE HOUSE','LITTLE STEPS'],
  bank:['FIRST NATIONAL BANK','{C} SAVINGS','ISLAND TRUST','UNION BANK'],
  books:['PAPER MOON BOOKS','CHAPTER ONE','OLD PAGES','THE BOOK NOOK'],
  conv:['QUICKSTOP 24/7','KWIK MART','CORNER STORE','STOP & GO','NITE OWL 24H'],
  kiosk:['SUN OIL','GAS & GO','ISLAND FUEL','{C} GAS'],
  supermarket:['FRESHMART','VALUE FOODS','{C} MARKET','GREEN BASKET','PRICE KING'],
  gunstore:['LIBERTY ARMS','IRONSIDE GUNS','PATRIOT GUNS','BULLSEYE ARMS'],
  mall:['{C} MALL','PLAZA CENTER','ISLAND MALL'],
  hospital:['{C} GENERAL HOSPITAL','{C} HOSPITAL'], clinic:['{C} CLINIC','FAMILY CLINIC'],
  police:['{C} POLICE','POLICE'], firestation:['{C} FIRE DEPT.','FIRE DEPT.'],
  church:['ST. MARY\'S','ST. JOSEPH\'S','HOLY CROSS','ST. PETER\'S'],
  office:['{C} OFFICES','MERIDIAN BLDG.','ATLAS CORP.','SUMMIT TOWER'],
  warehouse:['{C} STORAGE','ISLAND FREIGHT','DEPOT 7'], docks:['PORT OF HALDEN','DOCK WAREHOUSE'], factory:['{C} STEEL WORKS','IRON WORKS'],
};
const SIGN_COL = { diner:['#8a2a22','#f4e4c4'], bar:['#20301f','#e8c070'], hardware:['#c08a20','#1a1a1a'], pharmacy:['#e8e8e0','#2a7a3a'],
  clothes:['#5a2a5a','#f6e0f0'], bank:['#16243e','#e8d8a0'], books:['#3a2a1a','#ead8b0'], conv:['#c83a2a','#ffffff'], kiosk:['#d8a020','#1a1a1a'],
  supermarket:['#2a6a3a','#ffffff'], gunstore:['#262626','#d8b040'], mall:['#34365a','#ffffff'], hospital:['#ececec','#c0302a'], clinic:['#ececec','#2a6a9a'],
  police:['#16243e','#ffffff'], firestation:['#a02a20','#ffffff'], church:['#efe8d8','#4a3a2a'], office:['#3a3e44','#dcdcdc'], warehouse:['#4a4e52','#e6e6e6'],
  docks:['#2a4a62','#ffffff'], factory:['#5a3a2a','#f0e0c8'],
  forge:['#2a2420','#e8a040'], tavern:['#3a2414','#e8c070'], castle:['#5a1414','#e8c860'], mage:['#241a3a','#c0a8f0'], alchemist:['#1e3a24','#a8e0a0'],
  tailor:['#3a1e34','#f0d0e8'], bowyer:['#2a3a1e','#e0d8a0'], butcher:['#4a1a14','#f0e0d0'], carpenter:['#4a3418','#f0dcb0'], healer:['#e8e0d0','#8a2a22'],
  jeweler:['#1a2a44','#f0d070'], provisioner:['#3a2e1a','#f0e0b0'] };
function textW(t,s=1){ return t.length*4*s-s; }
function businessKind(b){ if(b.barn) return null; if(b.name) return b.kind||b.t; if(b.t==='shop') return b.kind; if(b.t==='warehouse') return b.sign==='PORT'?'docks':b.sign==='FACTORY'?'factory':'warehouse'; return NAMES[b.t]?b.t:null; }
function assignName(b){
  if(b.name){ b.signKind=b.kind||b.t; return; }
  const k=businessKind(b); if(!k) return;
  const ri=regionId[idx(b.x+(b.w>>1),b.y+(b.h>>1))], city=(ri!==255&&regions[ri]?regions[ri].name:'ISLAND').toUpperCase();
  const list=NAMES[k].map(n=>n.replace('{C}',city)), max=b.w*T-8, start=b.id%list.length;
  let name=null; for(let k2=0;k2<list.length;k2++){ const n=list[(start+k2)%list.length]; if(textW(n)<=max){ name=n; break; } }
  if(!name){ name=list[start]; while(textW(name)>max && name.includes(' ')) name=name.slice(0,name.lastIndexOf(' ')); if(textW(name)>max) name=name.slice(0,Math.max(3,Math.floor(max/4))); }
  b.name=name; b.signKind=k;
}
function titleCase(s){ return s.toLowerCase().replace(/(^|[\s.&-])([a-z])/g,(m,a,c)=>a+c.toUpperCase()).replace(/'S\b/g,"'s"); }
function makeSign(b){
  const [bg,fg]=SIGN_COL[b.signKind]||['#2a2a2a','#eeeeee'], tw=textW(b.name), w=tw+8, h=11, c=document.createElement('canvas'); c.width=w; c.height=h;
  const g=c.getContext('2d'); g.fillStyle=darkHex(bg,.55); g.fillRect(0,0,w,h); g.fillStyle=bg; g.fillRect(1,1,w-2,h-2);
  g.fillStyle='rgba(255,255,255,.12)'; g.fillRect(1,1,w-2,1); drawText(g,b.name,w/2,h/2+0.5,1,fg);
  if(b.signKind==='conv'||b.signKind==='kiosk'||b.signKind==='bar'){ g.fillStyle='rgba(255,255,255,.25)'; g.fillRect(1,h-2,w-2,1); }
  return c;
}

// ---------------- Roofs ----------------
const FLAT = new Set(['castle','firestation','apartment','supermarket','mall','hospital','police','gunstore','conv','kiosk','clinic','booth','shop','office']);
function makeRoof(b){
  const w=b.w*T+4, h=(b.h-1)*T+22, c=document.createElement('canvas'); c.width=w; c.height=h;
  const g=c.getContext('2d');
  if(b.metal){
    for(let x=0;x<w;x+=4){ g.fillStyle=shade(b.roof,1.1); g.fillRect(x,0,2,h); g.fillStyle=shade(b.roof,.85); g.fillRect(x+2,0,2,h); }
    for(let i=0;i<6;i++){ g.fillStyle='rgba(110,60,30,.35)'; g.fillRect(Math.floor(th(b.id,i,1)*(w-20)),Math.floor(th(b.id,i,2)*(h-12)),10+Math.floor(th(b.id,i,3)*14),5); }
  } else if(FLAT.has(b.t)){
    g.fillStyle=b.roof; g.fillRect(0,0,w,h);
    for(let i=0;i<w*h/22;i++){ const a=th(b.id,i,7), d=th(b.id,i,8); g.fillStyle=d>.5?shade(b.roof,1.12):shade(b.roof,.86); g.fillRect(Math.floor(a*w),Math.floor(th(b.id,i,9)*h),1,1); }
    g.fillStyle=shade(b.roof,1.3); g.fillRect(0,0,w,2); g.fillRect(0,0,2,h); g.fillStyle=shade(b.roof,.6); g.fillRect(w-2,0,2,h); g.fillRect(0,h-3,w,3);
    if(b.t==='castle'){ for(let x=0;x<w;x+=8){ g.fillStyle='#6a665e'; g.fillRect(x,0,5,5); g.fillRect(x,h-6,5,5); g.fillStyle='#4a4640'; g.fillRect(x,4,5,1); }
      for(let y=0;y<h;y+=8){ g.fillStyle='#6a665e'; g.fillRect(0,y,5,5); g.fillRect(w-5,y,5,5); }
      for(const [tx,ty] of [[0,0],[w-14,0],[0,h-14],[w-14,h-14]]){ g.fillStyle='#5a564f'; g.fillRect(tx,ty,14,14); g.fillStyle='#3e3a35'; g.fillRect(tx+3,ty+3,8,8); }
      g.fillStyle='#4a2a1a'; g.fillRect(w/2-1,h/2-14,2,16); g.fillStyle='#8a1a14'; g.fillRect(w/2+1,h/2-14,10,7); g.fillStyle='#d8b040'; g.fillRect(w/2+4,h/2-12,3,3); }
    const ac = b.t==='booth'||b.t==='castle' ? 0 : Math.max(1,Math.floor(b.w*b.h/90));
    for(let i=0;i<ac;i++){ const ax=6+Math.floor(th(b.id,i,11)*(w-24)), ay=6+Math.floor(th(b.id,i,12)*(h-24)); g.fillStyle='#55585a'; g.fillRect(ax,ay,12,10); g.fillStyle='#6d7073'; g.fillRect(ax,ay,12,3); g.fillStyle='#333'; g.fillRect(ax+3,ay+5,6,3); g.fillStyle='rgba(0,0,0,.3)'; g.fillRect(ax+12,ay+2,2,10); }
  } else {
    const mid=Math.floor(h/2);
    for(let y=0;y<h;y+=4){ const f = y<mid ? 1.12 : 0.86;
      for(let x=((y/4)%2)*-4; x<w; x+=8){ g.fillStyle=shade(b.roof, f*(0.9+th(x,y,b.id)*0.2)); g.fillRect(x,y,7,3); }
      g.fillStyle=shade(b.roof, f*0.6); g.fillRect(0,y+3,w,1); }
    g.fillStyle=shade(b.roof,.45); g.fillRect(0,mid-1,w,2); g.fillStyle=shade(b.roof,1.35); g.fillRect(0,mid-2,w,1);
    const holes=0;
    for(let i=0;i<holes;i++){ g.fillStyle='#120e0b'; const hx=4+Math.floor(th(b.id,i,6)*(w-14)), hy=4+Math.floor(th(b.id,i,7)*(h-12)); g.fillRect(hx,hy,6,3); g.fillRect(hx+1,hy+3,3,2); }
    g.fillStyle=shade(b.roof,.4); g.fillRect(0,0,w,1); g.fillRect(0,0,1,h); g.fillRect(w-1,0,1,h); g.fillRect(0,h-2,w,2);
    if(b.t!=='church' && th(b.id,2,3)>.35 || b.t==='forge' || b.t==='tavern'){ const cxh=Math.floor(w*(0.2+th(b.id,3,4)*0.6)); g.fillStyle='#4a4440'; g.fillRect(cxh,4,8,12); g.fillStyle='#5e5852'; g.fillRect(cxh,4,8,2); g.fillStyle='#1e1a18'; g.fillRect(cxh+1,5,6,2); }
  }
  { const cx=Math.floor(w/2), cy=Math.floor(h/2);
    if(b.t==='church'){ g.fillStyle='#d8cfbf'; g.fillRect(cx-2,cy-12,4,24); g.fillRect(cx-8,cy-6,16,4); }
    if(b.t==='hospital'||b.t==='clinic'){ g.fillStyle='#e8e2d8'; g.fillRect(cx-11,cy-11,22,22); g.fillStyle='#c33'; g.fillRect(cx-3,cy-8,6,16); g.fillRect(cx-8,cy-3,16,6); }
    if(b.t==='hospital'){ g.strokeStyle='#d8d0b0'; g.lineWidth=2; g.beginPath(); g.arc(cx+60,cy,18,0,7); g.stroke(); drawText(g,'H',cx+60,cy,3,'#d8d0b0'); }
  }
  return c;
}

// ---------------- Tree sprites ----------------
let treeSprites;
function makeTrees(){
  const pal=[ ['#2b3a20','#384a27','#46592f','#56693a'], ['#3a3a1f','#4d4c27','#605e30','#77733c'], ['#26331f','#314227','#3d5230','#4b6238'] ];
  treeSprites = pal.map((cols,v)=>{
    const c=document.createElement('canvas'); c.width=36; c.height=44; const g=c.getContext('2d');
    g.fillStyle='#3e2c20'; g.fillRect(16,26,4,16); g.fillStyle='#2d2018'; g.fillRect(19,28,1,14); g.fillRect(14,40,8,2);
    for(let y=0;y<34;y+=2) for(let x=0;x<36;x+=2){
      const d=Math.hypot(x+1-18,(y+1-16)*1.1); const edge=14-th(x,y,v+40)*4;
      if(d<edge){ const light = 1-((x-18)+(y-16))/40 - d/40 + th(x,y,v+50)*.35; g.fillStyle=cols[Math.max(0,Math.min(3,Math.floor(light*2.6)))]; g.fillRect(x,y,2,2); }
    }
    return c;
  });
}

// ---------------- Item icons ----------------
const ICONS={};
function makeIcons(){
  const mk=(f)=>{ const c=document.createElement('canvas'); c.width=16;c.height=16; const g=c.getContext('2d'); const p=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(x,y,w,h)}; f(p); return c.toDataURL(); };
  ICONS.beans=mk(p=>{p(4,3,8,11,'#8a8f94');p(4,6,8,5,'#a0402e');p(5,7,6,1,'#d9b25a');p(4,3,8,1,'#c3c8cc');p(4,13,8,1,'#5d6166');});
  ICONS.chips=mk(p=>{p(3,2,10,12,'#d8a630');p(3,2,10,2,'#b0802a');p(5,6,6,4,'#a02a22');p(6,7,4,2,'#f0d070');p(3,12,10,2,'#b0802a');});
  ICONS.soda=mk(p=>{p(5,3,6,11,'#b02a2a');p(5,3,6,1,'#c8c8c8');p(5,7,6,3,'#e8e0d0');p(5,13,6,1,'#7a1a1a');});
  ICONS.water=mk(p=>{p(6,1,4,2,'#2f6fb0');p(5,3,6,1,'#9fc9e8');p(4,4,8,10,'#5ea3d6');p(5,6,6,3,'#e8f2f8');p(4,13,8,1,'#3d7fb5');});
  ICONS.bandage=mk(p=>{p(2,5,12,7,'#e5dccb');p(2,5,12,1,'#fff6e6');p(6,5,4,7,'#cbbfa9');p(2,11,12,1,'#a99c86');});
  ICONS.pills=mk(p=>{p(5,2,6,3,'#d86a2e');p(5,5,6,9,'#efe9df');p(6,8,4,3,'#7aa0c4');p(5,13,6,1,'#b8b0a2');});
  ICONS.firstaid=mk(p=>{p(2,4,12,9,'#c8322a');p(2,4,12,1,'#e05a4a');p(7,6,2,5,'#fff');p(5,8,6,1,'#fff');p(6,2,4,2,'#7a1a14');});
  ICONS.matches=mk(p=>{p(3,5,10,7,'#9a2f22');p(3,5,10,2,'#c94a35');p(5,8,6,2,'#e8d39a');p(11,2,1,5,'#d8c08a');p(11,1,1,2,'#c33');});
  ICONS.lantern=mk(p=>{p(6,1,4,1,'#8a6a2c');p(5,2,6,2,'#b08a3a');p(4,4,8,8,'#7a5a24');p(5,5,6,6,'#f2c25a');p(6,6,4,4,'#fff0b0');p(4,12,8,2,'#b08a3a');});
  ICONS.scrap=mk(p=>{p(3,6,7,5,'#7d8287');p(7,4,6,4,'#5f6469');p(5,10,8,3,'#8e6a4a');p(3,6,7,1,'#a9aeb2');});
  ICONS.nails=mk(p=>{for(let i=0;i<3;i++){p(4+i*3,3+i,3,1,'#b9bec2');p(5+i*3,4+i,1,9,'#8d9297');}});
  ICONS.cloth=mk(p=>{p(2,4,12,9,'#8a7a9a');p(2,4,12,1,'#a89ab8');p(4,6,8,1,'#6a5a7a');p(4,9,8,1,'#6a5a7a');p(11,10,3,4,'#7a6a8a');});
  ICONS.spiked_bat=mk(p=>{for(let i=0;i<11;i++)p(2+i,13-i,i>6?3:2,i>6?3:2,'#8a6a44');p(1,13,3,2,'#3b2a1c');p(10,2,1,1,'#ccc');p(13,4,1,1,'#ccc');p(12,1,1,1,'#ccc');p(14,6,1,1,'#ccc');});
  ICONS.spear=mk(p=>{for(let i=0;i<12;i++)p(2+i,14-i,1,1,'#7a5a38');p(12,1,3,3,'#c8ccd0');p(13,0,2,1,'#c8ccd0');p(10,4,2,2,'#5a4a3a');});
  ICONS.fire_axe=mk(p=>{for(let i=0;i<11;i++)p(3+i,13-i,1,1,'#7a4a2a');p(10,1,4,3,'#b8bcc0');p(12,3,2,3,'#c8302a');p(9,3,2,2,'#b8bcc0');});
  const helm=(c,extra)=>mk(p=>{p(3,5,10,6,c);p(4,4,8,1,c);p(3,10,10,1,darkHex(c,.7));p(5,5,3,1,darkHex(c,1.25>1?1:1));if(extra)extra(p);});
  ICONS.helmet_bike=helm('#3a6a9a',p=>{p(6,5,1,3,'#2a4a6a');p(9,5,1,3,'#2a4a6a');});
  ICONS.hardhat=helm('#d8b030',p=>{p(1,10,14,2,'#b08a20');p(7,4,2,6,'#c09a28');});
  ICONS.fire_helmet=helm('#b02a20',p=>{p(1,10,14,2,'#7a1a14');p(6,6,4,3,'#e0c060');});
  ICONS.mil_helmet=helm('#4a5a3a',p=>{p(2,10,12,2,'#3a4a2a');p(5,6,1,1,'#3a4a2a');p(10,7,1,1,'#3a4a2a');});
  ICONS.vest_light=mk(p=>{p(3,3,10,11,'#36404c');p(5,1,2,3,'#36404c');p(9,1,2,3,'#36404c');p(7,3,2,4,'#14181c');p(3,3,1,11,'#26303a');p(12,3,1,11,'#26303a');p(6,9,4,1,'#c8c8c0');});
  ICONS.vest_heavy=mk(p=>{p(2,3,12,11,'#3a3e2e');p(4,1,3,3,'#3a3e2e');p(9,1,3,3,'#3a3e2e');p(7,3,2,3,'#14181c');p(3,9,3,3,'#2a2e20');p(7,9,2,3,'#2a2e20');p(10,9,3,3,'#2a2e20');});
  ICONS.b_wall=mk(p=>{p(1,2,14,12,'#6e5236');for(let k=0;k<4;k++)p(1+k*4,2,1,12,'#4c3622');p(1,2,14,2,'#2e2418');});
  ICONS.b_window=mk(p=>{p(1,2,14,12,'#6e5236');p(1,2,14,2,'#2e2418');p(4,5,8,6,'#38495a');p(7,5,1,6,'#231f1c');p(5,6,1,1,'#7d97a6');});
  ICONS.b_door=mk(p=>{p(1,2,14,12,'#2e2418');p(3,3,10,11,'#664629');p(6,3,1,11,'#523822');p(10,8,1,2,'#c4a35e');});
  ICONS.b_floor=mk(p=>{p(1,1,14,14,'#563f2c');for(let r=0;r<4;r++)p(1,1+r*4+3,14,1,'#45321f');p(6,2,1,3,'#45321f');p(10,6,1,3,'#45321f');});
  ICONS.b_storage=mk(p=>{p(2,4,12,10,'#7a5a34');p(2,4,12,3,'#8f6b40');p(7,7,3,3,'#a8a8a0');});
  ICONS.b_bed=mk(p=>{p(4,1,8,14,'#4a3423');p(5,4,6,10,'#6f6a5e');p(5,2,6,2,'#aaa391');});
  ICONS.b_lamp=mk(p=>{p(4,2,8,5,'#f0d890');p(7,7,2,6,'#3a3a3a');p(5,13,6,2,'#2a2a2a');});
  ICONS.b_generator=mk(p=>{p(2,4,12,10,'#c8a030');p(4,6,6,6,'#3a3a3a');p(11,1,2,4,'#2a2a2a');p(12,8,1,2,'#5aff5a');});
  ICONS.b_solar=mk(p=>{p(1,3,14,8,'#1e3a5a');for(let k=0;k<4;k++)p(1+k*4,3,1,8,'#4a6a8a');p(1,7,14,1,'#4a6a8a');p(3,11,2,3,'#3a3a3a');p(11,11,2,3,'#3a3a3a');});
  ICONS.b_battery=mk(p=>{p(3,3,10,11,'#3a4048');p(4,1,2,2,'#c8302a');p(10,1,2,2,'#2a2a2a');p(5,7,6,5,'#5ad05a');});
  ICONS.b_scrap=mk(p=>{for(let i=0;i<9;i++)p(3+i,12-i,2,2,'#7a5a38');p(9,2,5,3,'#8a8e92');p(12,1,2,6,'#8a8e92');});
  ICONS.planks=mk(p=>{p(2,4,12,3,'#8a6238');p(2,8,12,3,'#7a5530');p(2,12,12,2,'#6b4a2a');p(2,4,12,1,'#a37848');});
  ICONS.ammo=mk(p=>{for(let i=0;i<3;i++){p(3+i*4,4,3,3,'#c9a24a');p(3+i*4,7,3,6,'#b07a2e');p(3+i*4,12,3,1,'#7a5420');}});
  ICONS.shells=mk(p=>{for(let i=0;i<3;i++){p(3+i*4,3,3,8,'#b8322a');p(3+i*4,11,3,3,'#c9a24a');}});
  ICONS.rifle_ammo=mk(p=>{for(let i=0;i<3;i++){p(3+i*4,2,3,3,'#b07a2e');p(4+i*4,1,1,1,'#b07a2e');p(3+i*4,5,3,9,'#c9a24a');}});
  ICONS.knife=mk(p=>{for(let i=0;i<8;i++)p(3+i,12-i,2,1,'#c8ccd0');for(let i=0;i<3;i++)p(1+i,13-i+1,2,2,'#3b2a1c');});
  ICONS.bat=mk(p=>{for(let i=0;i<11;i++)p(2+i,13-i,i>6?3:2,i>6?3:2,'#9a7448');p(1,13,3,2,'#3b2a1c');});
  ICONS.crowbar=mk(p=>{for(let i=0;i<10;i++)p(3+i,13-i,2,1,'#8a3b30');p(12,2,2,3,'#8a3b30');});
  ICONS.pipe=mk(p=>{for(let i=0;i<11;i++)p(2+i,13-i,2,2,'#71777c');p(2,12,3,3,'#4f5458');p(11,2,3,3,'#4f5458');});
  ICONS.pistol=mk(p=>{p(3,5,10,3,'#3a3d40');p(3,5,10,1,'#55595d');p(4,8,3,5,'#2b2d2f');p(7,8,2,2,'#2b2d2f');});
  ICONS.shotgun=mk(p=>{p(1,6,14,2,'#3a3d40');p(1,8,8,2,'#5a3e28');p(1,9,4,3,'#5a3e28');p(9,8,2,1,'#2b2d2f');});
  ICONS.rifle=mk(p=>{p(0,6,15,1,'#3a3d40');p(1,7,9,2,'#6a4a2a');p(1,8,4,4,'#6a4a2a');p(7,4,4,2,'#222');p(9,9,1,2,'#2b2d2f');});
  ICONS.ring=mk(p=>{p(5,5,6,1,'#e8c050');p(4,6,1,5,'#e8c050');p(11,6,1,5,'#e8c050');p(5,11,6,1,'#c8a040');p(6,3,4,2,'#8ad8f0');});
  ICONS.necklace=mk(p=>{for(let i=0;i<6;i++){p(3+i,3+i,1,1,'#e8c050');p(12-i,3+i,1,1,'#e8c050');}p(7,9,2,3,'#c83a5a');});
  ICONS.watch=mk(p=>{p(6,1,4,3,'#3a3a3a');p(6,12,4,3,'#3a3a3a');p(4,4,8,8,'#d0b060');p(5,5,6,6,'#f0ece0');p(8,6,1,3,'#222');p(8,8,2,1,'#222');});
  ICONS.gold=mk(p=>{p(2,7,12,6,'#c8a030');p(4,5,8,2,'#f0d060');p(2,7,12,1,'#f8e080');p(2,12,12,1,'#8a6a20');});
  ICONS.dirty_water=mk(p=>{p(6,1,4,2,'#5a5a3a');p(5,3,6,1,'#8a8a6a');p(4,4,8,10,'#6a6a4a');p(5,7,6,2,'#8a8a5a');p(4,13,8,1,'#4a4a2a');});
  ICONS.bottle=mk(p=>{p(6,1,4,2,'#2f6fb0');p(5,3,6,1,'#9fc9e8');p(4,4,8,10,'#c8dce8');p(5,5,1,8,'#e8f2f8');p(4,13,8,1,'#8aa8b8');});
  ICONS.splint=mk(p=>{p(3,2,3,12,'#9a7448');p(10,2,3,12,'#9a7448');p(2,4,12,2,'#e5dccb');p(2,10,12,2,'#e5dccb');});
  ICONS.meat_raw=mk(p=>{p(3,4,10,8,'#b83a3a');p(4,5,8,2,'#d85a5a');p(10,9,3,3,'#e8dcc8');p(3,11,10,1,'#7a1a1a');});
  ICONS.meat_cooked=mk(p=>{p(3,4,10,8,'#7a4a24');p(4,5,8,2,'#9a6a34');p(10,9,3,3,'#e8dcc8');p(5,7,4,1,'#5a3418');});
  ICONS.fish_raw=mk(p=>{p(3,6,8,5,'#8aa0b0');p(4,6,6,1,'#b8c8d0');p(11,5,3,7,'#6a8090');p(4,8,1,1,'#111');});
  ICONS.fish_cooked=mk(p=>{p(3,6,8,5,'#a0703a');p(4,6,6,1,'#c8904a');p(11,5,3,7,'#7a5028');p(4,8,1,1,'#111');});
  ICONS.berries=mk(p=>{for(const [a,b] of [[4,5],[8,4],[6,8],[10,8],[5,11],[9,11]]){p(a,b,3,3,'#7a1a3a');p(a,b,1,1,'#c84a6a');}p(7,2,2,3,'#3a5a2e');});
  ICONS.hide=mk(p=>{p(2,3,12,10,'#8a6a44');p(1,5,2,6,'#8a6a44');p(13,5,2,6,'#8a6a44');p(4,5,8,6,'#9a7a54');p(3,13,3,2,'#7a5a34');p(10,13,3,2,'#7a5a34');});
  ICONS.logs=mk(p=>{p(1,4,14,4,'#6a4a2a');p(1,9,14,4,'#5a3e22');p(13,4,2,4,'#c8a070');p(13,9,2,4,'#c8a070');p(1,4,14,1,'#8a6a44');});
  ICONS.rod=mk(p=>{for(let i=0;i<12;i++)p(2+i,13-i,1,1,'#7a5a38');p(3,11,3,3,'#3a3a3a');p(14,1,1,10,'#c8c8c8');p(13,11,3,2,'#c83a2a');});
  ICONS.gascan=mk(p=>{p(3,4,10,10,'#b8302a');p(3,4,10,1,'#d8504a');p(9,1,3,3,'#3a3a3a');p(5,7,6,4,'#8a2018');});
  ICONS.gascan_e=mk(p=>{p(3,4,10,10,'#6a4a44');p(3,4,10,1,'#8a6a64');p(9,1,3,3,'#3a3a3a');p(5,7,6,4,'#4a3430');});
  ICONS.hatchet=mk(p=>{for(let i=0;i<10;i++)p(3+i,13-i,1,1,'#7a5a38');p(10,2,4,5,'#a8acb0');p(9,3,2,2,'#a8acb0');p(13,2,1,5,'#d8dcdf');});
  ICONS.b_pier=mk(p=>{p(0,0,16,16,'#1b2e42');for(let r=0;r<4;r++)p(2,r*4,12,3,'#7a5a3a');p(2,0,1,16,'#46321f');p(13,0,1,16,'#46321f');});
  ICONS.b_campfire=mk(p=>{p(2,11,12,3,'#4a4440');p(4,9,8,2,'#6a4a2a');p(6,3,4,6,'#ffa340');p(7,1,2,4,'#ffe08a');p(5,6,2,3,'#e0552a');});
  ICONS.b_tent=mk(p=>{for(let k=0;k<7;k++){p(8-k,3+k,1,1,'#2a361f');p(7+k,3+k,1,1,'#4e6040');}p(2,10,12,4,'#3a4a2e');p(6,9,4,5,'#1a1a14');});
  ICONS.b_bedroll=mk(p=>{p(3,2,10,12,'#5a2a2a');p(4,3,8,3,'#c8b898');p(3,8,10,1,'#3a1a1a');});
  ICONS.b_collector=mk(p=>{p(2,3,12,11,'#3a4a5a');p(3,8,10,5,'#4a7a9a');p(1,2,14,2,'#8a8a80');});
  ICONS.b_fence=mk(p=>{for(let k=1;k<16;k+=4){p(k,3,2,11,'#7d6342');p(k,13,2,1,'#4a3824');}p(0,6,16,2,'#6a5236');p(0,10,16,1,'#6a5236');});
  ICONS.b_gate=mk(p=>{p(1,3,14,2,'#3a3e42');p(1,11,14,2,'#3a3e42');for(let k=2;k<15;k+=3)p(k,3,1,10,'#5a6068');p(7,6,3,4,'#2a2a2a');p(8,7,1,1,'#d05a3a');});
  ICONS.b_tower=mk(p=>{p(2,1,12,5,'#6e5232');p(2,1,12,1,'#8a6a44');p(3,6,2,9,'#5a4028');p(11,6,2,9,'#5a4028');p(5,9,6,1,'#4a3420');p(5,12,6,1,'#4a3420');});
  ICONS.cash=mk(p=>{p(2,5,12,7,'#5a8a4a');p(3,6,10,5,'#7aaa6a');p(7,7,2,3,'#3a6a2a');p(2,11,12,1,'#3a5a2a');});
}

// ---------------- Minimap ----------------
let minimap;
function buildMinimap(){
  minimap=document.createElement('canvas'); minimap.width=W; minimap.height=H;
  const g=minimap.getContext('2d'), img=g.createImageData(W,H), d=img.data;
  const COL={19:[200,206,214],20:[70,66,62],21:[52,58,40],22:[168,140,92],23:[96,90,82],24:[150,180,200],18:[96,90,50],15:[27,46,66],16:[138,122,86],17:[94,70,48],0:[58,69,41],1:[90,74,51],2:[48,50,53],3:[85,87,90],7:[42,66,86],8:[93,94,90],11:[34,46,28],13:[90,74,53],14:[67,85,50],6:[140,138,132]};
  const hex=h=>{const n=parseInt(h.slice(1),16);return[n>>16,(n>>8)&255,n&255];};
  const roofC=buildings.map(b=>b?hex(b.roof):[100,100,100]);
  for(let i=0;i<N;i++){ let c;
    if(bld[i]>=0) c=roofC[bld[i]].map(v=>Math.min(255,v*1.25));
    else c=COL[map[i]]||[58,69,41];
    d[i*4]=c[0]; d[i*4+1]=c[1]; d[i*4+2]=c[2]; d[i*4+3]=255; }
  for(const o of objs) if(o.type==='tree'){ const i=idx(o.x,o.y); d[i*4]=28; d[i*4+1]=40; d[i*4+2]=22; }
  g.putImageData(img,0,0);
}

// ---------------- Game state ----------------
let selectedProfessions=[], player=null, running=false, chosenLook=null, chosenSex='m';
const SLOTS=30, HOTBAR=10; // 0-9 hotbar, 10-29 backpack
let inv = new Array(SLOTS).fill(null);
const BAG_FIRST = new Set(['scrap','nails','planks','cloth','ammo','shells','rifle_ammo','ring','necklace','watch','gold','cash']);
let time=17, day=1, cam={x:0,y:0}, search=null, target=null, lastTime=0;
let raiders=[], particles=[], tracers=[], shake=0, lastWave=0, wanderSpawnT=0, viewX=0, viewY=0, aimHintShown=false;
let mapOpen=false, mapZoom=0, markers=[], mapView=null;
const keys={};
function mod(k){ return player && player.mods[k]!==undefined ? player.mods[k] : 1; }

// ---------------- Character creation ----------------
function initCreation(){
  const box=document.getElementById('professions'); box.innerHTML='';
  for(const [id,p] of Object.entries(PROFESSIONS)){
    const d=document.createElement('div'); d.className='prof'; d.dataset.id=id;
    d.innerHTML=`<strong>${p.name}${p.soon?'<em>soon</em>':''}</strong><span>${p.desc}</span>`;
    d.onclick=()=>toggleProfession(id,d); box.appendChild(d);
  }
}
function rollLook(){ chosenLook=randomLook(chosenSex); drawPreview(); }
function drawPreview(){
  const c=document.getElementById('preview'); if(!c) return; const g=c.getContext('2d'); g.clearRect(0,0,c.width,c.height);
  ['down','right','up','left'].forEach((f,k)=>{ g.fillStyle='rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(12+k*24,33,5,2,0,0,7); g.fill();
    drawHuman(g,12+k*24,33,{face:f,phase:0,moving:false,look:chosenLook,weapon:'fists',wAng:0}); });
  const L=chosenLook, skinNames=['very fair','fair','light brown','brown','dark brown','dark','very dark'], hairNames={'#17110e':'black','#2e1e14':'dark brown','#4a2e1a':'brown','#6a4424':'chestnut','#a8803a':'dark blonde','#d8b860':'blonde','#e8d090':'platinum blonde','#8a3a1e':'red','#8a8680':'grey'};
  const styleN={short:'short hair',buzz:'buzz cut',bald:'bald',long:'long hair',ponytail:'long hair, ponytail',braid:'long braided hair'}[L.style];
  document.getElementById('look-desc').textContent = `${skinNames[SKINS.indexOf(L.skin)]||''} skin · ${L.style==='bald'?'bald':(hairNames[L.hair]||'')+' '+styleN}${L.beard?' · beard':''}`;
}
function setSex(sx){ chosenSex=sx; document.getElementById('sex-m').classList.toggle('on',sx==='m'); document.getElementById('sex-f').classList.toggle('on',sx==='f'); rollLook(); }
function toggleProfession(id,el){
  const i=selectedProfessions.indexOf(id);
  if(i>=0){ selectedProfessions.splice(i,1); el.classList.remove('selected'); }
  else { if(selectedProfessions.length>=2) return; selectedProfessions.push(id); el.classList.add('selected'); }
  document.getElementById('selected-count').textContent=`${selectedProfessions.length} / 2 selected`;
  document.getElementById('btn-start').disabled = selectedProfessions.length===0;
}
function findSpawn(){
  const r=regions.find(r=>r.name===SW.spawn)||regions[0];
  const cx=Math.floor(r.x+r.w/2), cy=Math.floor(r.y+r.h/2); let best=null, bd=1e9;
  for(let y=r.y;y<r.y+r.h;y++) for(let x=r.x;x<r.x+r.w;x++){ const i=idx(x,y); if(map[i]!==TL.WALK||objGrid[i]) continue; const d=Math.hypot(x-cx,y-cy); if(d<bd){bd=d;best=[x,y];} }
  return best;
}
let worldBuilt=false;
function makePlayer(name,mods,x,y){
  markers=[];
  player={ name, professions:[...selectedProfessions], mods,
    x, y, face:'down', phase:0, moving:false,
    health:85, maxHealth:100, maxStamina:100*(mods.maxStamina||1), stamina:0, hunger:70, thirst:75, sick:0, painkill:0, inVeh:null, ...freshBody(),
    speed:46*(mods.speed||1), exhausted:false, lanternOn:false, matchT:0,
    weapon:'knife', atkCd:0, swing:null, aimAng:Math.PI/2, hurtT:0, flashT:0, cause:'starved', kills:0, inB:-1,
    look: chosenLook || randomLook(), equip:{head:null,body:null} };
  player.stamina=player.maxStamina;
  inv=new Array(SLOTS).fill(null); search=null; buildMode=false; document.body.classList.remove('building');
  raiders=[]; particles=[]; tracers=[]; shake=0; wanderSpawnT=0; animals=[]; driving=null; campObjs=objs?objs.filter(o=>o.type==='campfire'||o.type==='collector'):[];
}
function startGame(){
  buildWorld();
  if(!chosenLook) chosenLook=randomLook(chosenSex);
  const name=document.getElementById('char-name').value.trim()||'Survivor';
  const mods={};
  for(const id of selectedProfessions) for(const [k,v] of Object.entries(PROFESSIONS[id].bonuses)) mods[k]=(mods[k]||1)*v;
  const [sx,sy]=findSpawn();
  makePlayer(name,mods,sx*T+8,sy*T+12);
  time=17; day=4; lastWave=0;
  addItem('knife',1); addItem('beans',1); addItem('water',2); addItem('matches',3); addItem('bandage',1);
  addItem('planks',4); addItem('nails',6);
  if(selectedProfessions.includes('engineer')){ addItem('planks',8); addItem('nails',10); addItem('scrap',8); }
  if(selectedProfessions.includes('medic')) addItem('bandage',2);
  if(selectedProfessions.includes('police')){ addItem('pistol',1); addItem('ammo',10); player.weapon='pistol'; }
  enterGame(`Day 4 after the flare. ${window.WORLD.spawn}, ${name}. The shelves are still full — for now. M map · I bag · B build · C craft · Esc menu.`);
}
function enterGame(msg){
  for(let i=0;i<3;i++) spawnRaider(22,45);
  document.body.classList.add('playing');
  cam.x=player.x; cam.y=player.y;
  document.getElementById('who').innerHTML = `${escapeHtml(player.name)}<small>${player.professions.map(p=>PROFESSIONS[p].name).join(' · ')}</small>`;
  if(window.hideIntroScreens) hideIntroScreens(); else document.getElementById('screen-create').style.display='none';
  document.getElementById('dead').style.display='none';
  document.getElementById('hud').style.display='block';
  renderHotbar(); const wasRunning=running; running=true; lastTime=performance.now();
  toast(msg); setSaveStatus('Not saved yet this session.');
  if(!wasRunning) requestAnimationFrame(loop);
}

// ---------------- Inventory ----------------
function addItem(id,qty){
  const st=ITEMS[id].stack;
  for(const s of inv) if(s && s.id===id && s.qty<st){ const m=Math.min(qty,st-s.qty); s.qty+=m; qty-=m; if(!qty) break; }
  const order = BAG_FIRST.has(id) ? [...Array(SLOTS-HOTBAR).keys()].map(k=>k+HOTBAR).concat([...Array(HOTBAR).keys()])
                                  : [...Array(SLOTS).keys()];
  for(const i of order){ if(qty<=0) break; if(!inv[i]){ const m=Math.min(qty,st); inv[i]={id,qty:m}; qty-=m; } }
  renderHotbar(); if(invOpen) renderInvPanel(); return qty;
}
function hasItem(id){ return inv.some(s=>s&&s.id===id); }
function countItem(id){ return inv.reduce((a,s)=>a+(s&&s.id===id?s.qty:0),0); }
function takeItem(id,n=1){ for(let i=0;i<inv.length&&n>0;i++){ const s=inv[i]; if(s&&s.id===id){ const m=Math.min(n,s.qty); s.qty-=m; n-=m; if(!s.qty) inv[i]=null; } } renderHotbar(); }
function useSlot(i){
  if(!running) return; const s=inv[i]; if(!s) return;
  if(ITEMS[s.id].wear){ wearSlot(i); return; }
  if(ITEMS[s.id].weapon){
    player.weapon = player.weapon===s.id ? 'fists' : s.id;
    toast(player.weapon==='fists' ? 'Arma guardada. Só os punhos.' : `Empunhando: ${ITEMS[s.id].name}`);
    renderHotbar(); return;
  }
  const r=ITEMS[s.id].use();
  if(r.msg) toast(r.msg);
  if(r.consume){ s.qty--; if(s.qty<=0) inv[i]=null; }
  if(!hasItem('lantern')) player.lanternOn=false;
  renderHotbar(); if(invOpen) renderInvPanel();
}
function wearSlot(i){
  const s=inv[i], slot=ITEMS[s.id].wear, old=player.equip[slot];
  player.equip[slot]=s.id; inv[i]= old ? {id:old,qty:1} : null;
  toast(`Wearing ${ITEMS[s.id].name}. Armour now ${Math.round(armorOf(player.equip)*100)}%.`);
  renderHotbar(); if(invOpen) renderInvPanel();
}
function unwear(slot){
  const id=player.equip[slot]; if(!id) return;
  if(addItem(id,1)){ toast('No room in your bags.'); return; }
  player.equip[slot]=null; toast(`Took off ${ITEMS[id].name}.`); renderHotbar(); if(invOpen) renderInvPanel();
}
function dropSlot(i){ if(!running||!inv[i]) return; const s=inv[i]; inv[i]=null; if(player.weapon===s.id && !hasItem(s.id)) player.weapon='fists'; toast(`Dropped ${ITEMS[s.id].name}${s.qty>1?' ×'+s.qty:''}.`); renderHotbar(); if(invOpen) renderInvPanel(); }
function renderHotbar(){
  const hb=document.getElementById('hotbar'); hb.innerHTML='';
  if(buildMode){ renderBuildBar(hb); return; }
  inv.slice(0,HOTBAR).forEach((s,i)=>{
    const d=document.createElement('div'); d.className='slot'; d.title = s ? ITEMS[s.id].name + (ITEMS[s.id].value?` ($${ITEMS[s.id].value})`:'') + ' — right-click to drop' : '';
    if(s && s.id==='lantern' && player && player.lanternOn) d.classList.add('lit');
    if(s && player && s.id===player.weapon) d.classList.add('eq');
    d.innerHTML = `<span class="k">${(i+1)%10}</span>` + (s ? `<img src="${ICONS[s.id]}" alt=""><span class="q">${s.qty>1?s.qty:''}</span>` : '');
    d.addEventListener('pointerdown', e=>{ e.stopPropagation(); if(e.button===2) dropSlot(i); else useSlot(i); });
    d.addEventListener('contextmenu', e=>e.preventDefault());
    hb.appendChild(d);
  });
}

// ---------------- Toasts ----------------
function toast(text){
  const box=document.getElementById('toasts'); const d=document.createElement('div'); d.className='toast'; d.textContent=text;
  box.appendChild(d); while(box.children.length>3) box.firstChild.remove();
  setTimeout(()=>{ d.style.opacity=0; setTimeout(()=>d.remove(),500); }, 3400);
}

// ---------------- Collision & interaction ----------------
function solidTile(tx,ty){
  if(!inB(tx,ty)) return true;
  const i=idx(tx,ty), t=map[i];
  if(t===TL.WALL||t===TL.WINDOW||t===TL.FENCE||t===TL.WATER||t===TL.SEA) return true;
  const d=doors.get(i); if(d && !d.open) return true;
  const o=objGrid[i]; if(o && o.solid) return true;
  return false;
}
function boxFree(x,y,ignoreVeh){
  const x0=Math.floor((x-4)/T), x1=Math.floor((x+3)/T), y0=Math.floor((y-5)/T), y1=Math.floor((y-1)/T);
  for(let ty=y0;ty<=y1;ty++) for(let tx=x0;tx<=x1;tx++) if(solidTile(tx,ty)) return false;
  if(!ignoreVeh) for(const v of vehicles){ if(v===driving) continue; const K=VEH_KINDS[v.kind]; if(Math.abs(v.x-x)>40||Math.abs(v.y-y)>40) continue;
    const [fx,fy]=vdir(v.ang), dx=x-v.x, dy=y-3-v.y; if(Math.abs(dx*fx+dy*fy)<K.h/2+1 && Math.abs(-dx*fy+dy*fx)<K.w/2+2) return false; }
  return true;
}
const FACE={down:[0,1],up:[0,-1],left:[-1,0],right:[1,0]};
function findTarget(){
  const [fx,fy]=FACE[player.face]; const ix=player.x+fx*11, iy=player.y-3+fy*11;
  let best=null, bd=1e9;
  const cx=Math.floor(ix/T), cy=Math.floor(iy/T);
  for(let ty=cy-1;ty<=cy+1;ty++) for(let tx=cx-1;tx<=cx+1;tx++){
    if(!inB(tx,ty)) continue; const i=idx(tx,ty);
    const o=objGrid[i];
    const cand = doors.get(i) ? {kind:'door', ref:doors.get(i)} : (o && (o.container || ACT_TYPES.has(o.type)) ? {kind: o.container ? 'obj' : 'act', ref:o} : null);
    if(!cand) continue;
    const d=Math.hypot(tx*T+8-ix, ty*T+8-iy);
    if(d<14 && d<bd){ bd=d; best=cand; }
  }
  return best;
}
function interact(){
  if(!running) return;
  if(driving){ exitVehicle(); return; }
  if(player.onTower){ const o=player.onTower; player.onTower=null; player.x=o.x*T+8; player.y=(o.y+2)*T+12; if(!boxFree(player.x,player.y)) player.y+=T; toast('You climb down.'); return; }
  if(search){ search=null; return; }
  { const n=npcNear(); if(n && !findTarget()){ talkTo(n); return; } }
  const t=findTarget();
  if(!t){
    const v=vehNear(); if(v){ openActions(VEH_KINDS[v.kind].name, vehicleActions(v)); return; }
    const w=waterNear(1.4); if(w){ if(w.sea){ toast('Salt water. Drinking it would only make it worse.'); return; } if(player.thirst>97){ toast('Not thirsty.'); return; } drink(25,w.pool,'You drink from the '+(w.pool?'pool':'water')+' with cupped hands.'); return; }
    return;
  }
  if(t.kind==='door'){
    const d=t.ref;
    if(d.open){ const x0=d.x*T, y0=d.y*T;
      if(player.x+4>x0 && player.x-4<x0+T && player.y>y0 && player.y-5<y0+T){ toast('Step out of the doorway first.'); return; } }
    d.open=!d.open;
  } else if(t.kind==='act'){ useDevice(t.ref);
  } else {
    const o=t.ref;
    if(o.searched){ toast(`${OBJ_NAMES[o.type]||'Container'}: already searched.`); return; }
    if(o.type==='carcass'){ if(!hasBlade()){ toast('You need a knife or an axe to butcher it.'); return; } search={obj:o, t:0, dur:3, butcher:true}; return; }
    search={obj:o, t:0, dur:1.8/mod('searchSpeed')};
  }
}
function finishSearch(o){
  if(search && search.scrap) return; // handled elsewhere
  if(o.type==='car' && !o.siphoned && hasItem('gascan_e')){ o.siphoned=true; if(Math.random()<.6){ takeItem('gascan_e',1); addItem('gascan',1); toast('You siphon fuel into the gas can.'); } else toast('The tank is bone dry.'); }
  o.searched=true;
  const L=LOOT[o.container]||LOOT.cabinet, found=[];
  const roll=()=>{ const tot=L.table.reduce((a,b)=>a+b[1],0); let r=Math.random()*tot; for(const [id,w] of L.table){ if((r-=w)<0) return id; } return L.table[0][0]; };
  for(let i=0;i<L.rolls;i++) if(Math.random()<(L.chance||.55)*mod('lootChance')) found.push(roll());
  if(mod('lootQuality')>1 && Math.random()<0.25) found.push(roll());
  if(o.drop && Math.random()<0.45) found.push(o.drop);
  if(o.gear) for(const gid of o.gear) if(Math.random()<.7) found.push(gid);
  const nm = OBJ_NAMES[o.type]||'Container';
  if(!found.length){ toast(`${nm}: nothing useful.`); return; }
  const got={};
  for(const id of found){ let q=1;
    if(['scrap','nails','planks'].includes(id)) q=1+Math.floor(Math.random()*3*mod('lootQuality'));
    if(['ammo','shells','rifle_ammo'].includes(id)) q=2+Math.floor(Math.random()*5*mod('lootQuality'));
    if(id==='cash') q=10+Math.floor(Math.random()*90*mod('lootQuality'));
    got[id]=(got[id]||0)+q; }
  const parts=[]; let lost=false;
  for(const [id,q] of Object.entries(got)){ const left=addItem(id,q); if(left<q) parts.push(`${ITEMS[id].name}${q-left>1?' ×'+(q-left):''}`); if(left) lost=true; }
  toast(parts.length ? `Found: ${parts.join(', ')}` : 'Inventory full.');
  if(lost && parts.length) toast('Some items left behind — inventory full (right-click a slot to drop).');
}

// ---------------- Combat helpers ----------------
function angDiff(a,b){ let d=a-b; while(d>Math.PI) d-=2*Math.PI; while(d<-Math.PI) d+=2*Math.PI; return d; }
function faceFromAng(a){ const c=Math.cos(a), s=Math.sin(a); return Math.abs(c)>Math.abs(s) ? (c>0?'right':'left') : (s>0?'down':'up'); }
const FACE_ANG={down:Math.PI/2, up:-Math.PI/2, left:Math.PI, right:0};
function blocksSight(tx,ty){ if(!inB(tx,ty)) return true; const i=idx(tx,ty); if(map[i]===TL.WALL) return true; const d=doors.get(i); return !!(d&&!d.open); }
function blocksBullet(tx,ty){ if(blocksSight(tx,ty)) return true; const i=idx(tx,ty); if(map[i]===TL.WINDOW) return true; const o=objGrid[i]; return !!(o&&o.solid&&o.type!=='tree'&&o.type!=='body'); }
function los(x1,y1,x2,y2){
  const L=Math.hypot(x2-x1,y2-y1), n=Math.ceil(L/4);
  for(let i=1;i<n;i++){ const x=x1+(x2-x1)*i/n, y=y1+(y2-y1)*i/n; if(blocksSight(Math.floor(x/T),Math.floor(y/T))) return false; }
  return true;
}
function blood(x,y,ang,n){
  if(!OPTS.blood) return;
  for(let i=0;i<n;i++){ const a=ang+(Math.random()-.5)*1.4, s=20+Math.random()*50;
    particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-10,z:6+Math.random()*4,vz:10+Math.random()*20,life:.6,col:Math.random()<.5?'#7a1712':'#5a100c'}); }
}
function slide(e,dx,dy){ const nx=e.x+dx; if(boxFree(nx,e.y)) e.x=nx; const ny=e.y+dy; if(boxFree(e.x,ny)) e.y=ny; }
function visibleChunks(margin=1){
  const out=[]; const c0x=Math.max(0,Math.floor(viewX/T/CH)-margin), c1x=Math.min(NCX-1,Math.floor((viewX+buf.width)/T/CH)+margin);
  const c0y=Math.max(0,Math.floor(viewY/T/CH)-margin), c1y=Math.min(NCY-1,Math.floor((viewY+buf.height)/T/CH)+margin);
  for(let y=c0y;y<=c1y;y++) for(let x=c0x;x<=c1x;x++) out.push(y*NCX+x);
  return out;
}
function playerLit(){
  if(player.lanternOn && hasItem('lantern')) return true;
  if(player.matchT>0 || player.flashT>0) return true;
  if(player.inB>=0 && poweredB.has(player.inB)) return true;
  const ci=cidx(Math.floor(player.x/T),Math.floor(player.y/T));
  for(const o of chunkObjs[ci]||[]) if(o.light && Math.hypot(o.x*T+8-player.x,o.y*T+8-player.y)<70) return true;
  return false;
}

// ---------------- Player attacks ----------------
function mouseWorld(){ return { x: viewX + mouse.x*dpr/zoom, y: viewY + mouse.y*dpr/zoom }; }
function autoAimAngle(){
  const W_=WEAPONS[player.weapon], reach = W_.ranged ? 11*T : 3*T; let best=null, bd=1e9;
  for(const r of raiders.concat(animals, npcs.filter(n=>n.state==='hostile'&&!n.dead))){ const d=Math.hypot(r.x-player.x,r.y-player.y); if(d<reach && d<bd && los(player.x,player.y-10,r.x,r.y-10)){ bd=d; best=r; } }
  return best ? Math.atan2((best.y-8)-(player.y-10), best.x-player.x) : FACE_ANG[player.face];
}
function shootRay(a,range,dmg){
  const ox=player.x+Math.cos(a)*6, oy=player.y-10+Math.sin(a)*4; let ex=ox, ey=oy, hit=null;
  for(let s=0;s<range;s+=2){
    ex=ox+Math.cos(a)*s; ey=oy+Math.sin(a)*s;
    if(blocksBullet(Math.floor(ex/T),Math.floor(ey/T))) break;
    for(const r of raiders) if(Math.hypot(r.x-ex,(r.y-9)-ey)<6){ hit=r; break; }
    if(!hit) for(const an of animals) if(Math.hypot(an.x-ex,(an.y-5)-ey)<ANIMALS[an.kind].w/2+2){ hit=an; break; }
    if(!hit) for(const n of npcs) if(n.active&&!n.dead&&Math.hypot(n.x-ex,(n.y-9)-ey)<6){ hit=n; break; }
    if(hit) break;
  }
  tracers.push({x1:ox,y1:oy,x2:ex,y2:ey,t:.07});
  if(hit){ if(hit.kind && ANIMALS[hit.kind]) damageAnimal(hit, dmg*(0.85+Math.random()*.3), a); else if(hit.role) damageNPC(hit, dmg*(0.85+Math.random()*.3), a, player); else damageRaider(hit, dmg*(0.85+Math.random()*.3), a, 5); }
}
function playerAttack(ang){
  if(!running || player.atkCd>0) return;
  const Wp=WEAPONS[player.weapon];
  player.aimAng=ang; player.face=faceFromAng(ang); search=null;
  if(Wp.ranged){
    if(!countItem(Wp.ammo)){ player.atkCd=.5; toast(`*click* — no ${ITEMS[Wp.ammo].name}.`); return; }
    takeItem(Wp.ammo,1);
    player.atkCd=Wp.cd/mod('recoilControl'); player.flashT=.06; shake=Math.max(shake, Wp.pellets?4:2.5);
    const n=Wp.pellets||1;
    for(let k=0;k<n;k++) shootRay(ang+(Math.random()-.5)*2*Wp.spread/mod('accuracy')/armFactor(), Wp.range, Wp.dmg);
    alertRaiders(player.x,player.y,Wp.noise*T); animalAlert(player.x,player.y,Wp.noise*T*1.5);
    return;
  }
  const tired = player.stamina < Wp.st;
  player.stamina=Math.max(0,player.stamina-Wp.st);
  player.atkCd = Wp.cd*(tired?1.4:1);
  player.swing={t:0,dur:.2,ang,arc:Wp.arc};
  const dmg=Wp.dmg*mod('strength')*(tired?0.6:1)*armFactor();
  let hitAny=false;
  for(const r of [...raiders]){
    const dx=r.x-player.x, dy=(r.y-8)-(player.y-10), d=Math.hypot(dx,dy);
    if(d<Wp.range+6 && Math.abs(angDiff(Math.atan2(dy,dx),ang))<Wp.arc/2+0.25){ damageRaider(r,dmg*(0.85+Math.random()*.3),ang,Wp.knock); hitAny=true; }
  }
  for(const n of npcs){ if(n.dead||!n.active) continue; const dx=n.x-player.x, dy=(n.y-8)-(player.y-10), d=Math.hypot(dx,dy);
    if(d<Wp.range+6 && Math.abs(angDiff(Math.atan2(dy,dx),ang))<Wp.arc/2+0.2){ damageNPC(n,dmg*(0.85+Math.random()*.3),ang,player); hitAny=true; } }
  for(const an of [...animals]){ const dx=an.x-player.x, dy=(an.y-5)-(player.y-10), d=Math.hypot(dx,dy);
    if(d<Wp.range+6+ANIMALS[an.kind].w/3 && Math.abs(angDiff(Math.atan2(dy,dx),ang))<Wp.arc/2+0.3){ damageAnimal(an,dmg*(0.85+Math.random()*.3),ang); hitAny=true; } }
  if(hitAny) shake=Math.max(shake,1.5);
  alertRaiders(player.x,player.y,3*T);
}
function damageRaider(r,dmg,ang,knock,src){
  if(!raiders.includes(r)) return;
  const by=src||player;
  r.hp-=dmg*(1-armorOf(r.equip)); r.hurtT=.12; blood(r.x,r.y-9,ang,6);
  if(r.state!=='chase'){ r.state='chase'; r.alertT=.8; }
  r.foe=(by===player&&driving)?null:by; r.lastX=by.x; r.lastY=by.y; r.seenT=0; r.byPlayer=by===player;
  if(knock>=7){ r.wind=0; r.cd=Math.max(r.cd,.6); }
  slide(r,Math.cos(ang)*knock,Math.sin(ang)*knock);
  if(r.hp<=0) killRaider(r,ang);
}
function killRaider(r,ang){
  raiders.splice(raiders.indexOf(r),1); if(r.byPlayer) player.kills++;
  if(r.camp>=0){ const c=camps[r.camp]; if(c && c.spawned && !raiders.some(o=>o.camp===c.id)){ c.left=0; toast(`The ${c.name} is wiped out.`); } }
  blood(r.x,r.y-6,ang,14);
  let tx=Math.floor(r.x/T), ty=Math.floor((r.y-3)/T);
  const free=(x,y)=>inB(x,y)&&walk[idx(x,y)]&&!objGrid[idx(x,y)]&&!doors.has(idx(x,y));
  if(!free(tx,ty)){ outer: for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++) if(free(tx+dx,ty+dy)){ tx+=dx; ty+=dy; break outer; } }
  if(free(tx,ty)) addObj({type:'body',x:tx,y:ty,solid:false,container:'body',drop:r.weapon,gear:[r.equip.head,r.equip.body].filter(Boolean),pal:r.look,dir:Math.cos(ang)>=0?1:-1,sortY:ty*T+1});
  for(let i=0;i<10;i++) addDecal(r.x+(Math.random()-.5)*14, r.y-2+(Math.random()-.5)*8, Math.random()<.5?'#4a0f0b':'#3a0c09', 1+(Math.random()*2|0));
}

// ---------------- Raiders ----------------
const RAIDER_PALS_OLD=[
  {skin:'#b88a66',hair:'#1f1b18',jacket:'#3b3a32',jacketD:'#2c2b25',pants:'#2a2a2a',boot:'#151210',mask:'#7a2620'},
  {skin:'#8d6447',hair:'#2b2622',jacket:'#4a3b2c',jacketD:'#382c20',pants:'#32302c',boot:'#151210',mask:'#2d2d2d'},
  {skin:'#c49a78',hair:'#3a3530',jacket:'#38433a',jacketD:'#2a332c',pants:'#2b2f35',boot:'#151210',mask:'#7a2620'},
];
function spawnRaider(minD,maxD){
  const ptx=Math.floor(player.x/T), pty=Math.floor(player.y/T);
  for(let a=0;a<200;a++){
    const ang=Math.random()*Math.PI*2, dist=minD+Math.random()*(maxD-minD);
    const tx=Math.round(ptx+Math.cos(ang)*dist), ty=Math.round(pty+Math.sin(ang)*dist);
    if(!inB(tx,ty)) continue; const i=idx(tx,ty);
    if(!walk[i] || bld[i]>=0 || objGrid[i] || map[i]===TL.WATER || map[i]===TL.PIER) continue;
    const weapon=['pipe','knife','bat','crowbar'][Math.floor(Math.random()*4)], hp=40+Math.random()*25;
    raiders.push({x:tx*T+8,y:ty*T+12,hp,max:hp,face:'down',phase:0,moving:false,state:'wander',wp:null,idle:Math.random()*2,
      path:null,pathT:0,seenT:0,lastX:0,lastY:0,wind:0,cd:0,hurtT:0,alertT:0,swingT:0,doorT:0,aimAng:0,weapon,
      speed:34+Math.random()*10,look:raiderLook(),
      equip:{head:Math.random()<.18?rpick(['helmet_bike','hardhat','mil_helmet','fire_helmet']):null, body:Math.random()<.12?rpick(['vest_light','vest_light','vest_heavy']):null}});
    return true;
  }
  return false;
}
function alertRaiders(x,y,radius){
  for(const r of raiders) if(Math.hypot(r.x-x,r.y-y)<radius && r.state!=='chase'){ r.state='search'; r.lastX=x; r.lastY=y; r.seenT=0; r.path=null; }
}
function raiderSees(r,d){
  const dk=darkness(time);
  let range = (9*(1-dk) + 3.5*dk)*T;
  if(dk>0.3 && playerLit()) range=Math.max(range,13*T);
  if(d>range) return false;
  return los(r.x,r.y-10,player.x,player.y-10);
}
const BFS_R=64, BFS_S=BFS_R*2+1; let bfsPrev, bfsSeen, bfsQ, bfsStamp=0;
function bfs(sx,sy,gx,gy){ // breadth-first search inside a window around the start
  if(!bfsPrev){ bfsPrev=new Int32Array(BFS_S*BFS_S); bfsSeen=new Uint32Array(BFS_S*BFS_S); bfsQ=new Int32Array(BFS_S*BFS_S); }
  if(!inB(sx,sy)||!inB(gx,gy)) return null;
  if(Math.abs(sx-gx)>BFS_R-1||Math.abs(sy-gy)>BFS_R-1) return null;
  const ox=sx-BFS_R, oy=sy-BFS_R, L=(x,y)=>(y-oy)*BFS_S+(x-ox);
  const s=L(sx,sy), goal=L(gx,gy); if(s===goal) return [];
  bfsStamp++; bfsSeen[s]=bfsStamp; bfsPrev[s]=s; let h=0,t=0; bfsQ[t++]=s; let found=false;
  while(h<t && t<14000){
    const c=bfsQ[h++]; if(c===goal){found=true;break;}
    const cx=c%BFS_S+ox, cy=((c/BFS_S)|0)+oy;
    for(let k=0;k<4;k++){
      const nx=cx+(k===0?1:k===1?-1:0), ny=cy+(k===2?1:k===3?-1:0);
      if(!inB(nx,ny)||nx<ox||ny<oy||nx>=ox+BFS_S||ny>=oy+BFS_S) continue; const n=L(nx,ny);
      if(bfsSeen[n]===bfsStamp || (!walk[idx(nx,ny)] && n!==goal)) continue;
      bfsSeen[n]=bfsStamp; bfsPrev[n]=c; bfsQ[t++]=n;
    }
  }
  if(!found && bfsSeen[goal]!==bfsStamp) return null;
  const path=[]; for(let c=goal;c!==s;c=bfsPrev[c]) path.push({x:c%BFS_S+ox,y:((c/BFS_S)|0)+oy});
  return path.reverse();
}
function moveRaiderTo(r,gx,gy,dt,spMul){
  const rtx=Math.floor(r.x/T), rty=Math.floor((r.y-3)/T);
  r.pathT-=dt;
  if(r.pathT<=0 || !r.path){ r.path=bfs(rtx,rty,Math.floor(gx/T),Math.floor((gy-3)/T)); r.pathT=.4+Math.random()*.2; }
  let tx=gx, ty=gy;
  if(r.path && r.path.length){ if(r.path[0].x===rtx && r.path[0].y===rty) r.path.shift(); if(r.path.length){ tx=r.path[0].x*T+8; ty=r.path[0].y*T+12; } }
  const di=idx(Math.floor(tx/T),Math.floor((ty-3)/T)), door=doors.get(di);
  if(door && !door.open && Math.hypot(tx-r.x,ty-r.y)<24){
    r.moving=false; r.face=faceFromAng(Math.atan2(ty-r.y,tx-r.x)); r.doorT+=dt;
    if(r.doorT>(door.code?10:1.4)){ door.open=true; r.doorT=0; if(door.code){ door.code=null; if(Math.hypot(r.x-player.x,r.y-player.y)<25*T) toast('Raiders smashed through a locked '+(door.gate?'gate':'door')+'!'); } else if(Math.hypot(r.x-player.x,r.y-player.y)<12*T) toast('A raider forces a door open!'); }
    return;
  }
  let vx=tx-r.x, vy=ty-r.y; const L=Math.hypot(vx,vy); if(L<0.6){ r.moving=false; return; }
  vx/=L; vy/=L; const sp=Math.min(L, r.speed*spMul*dt);
  slide(r,vx*sp,vy*sp);
  r.moving=true; r.phase+=dt*9*spMul; r.face=faceFromAng(Math.atan2(vy,vx));
}
function updateSpawns(dt){ return;
  if(time>=21 && lastWave!==day){
    lastWave=day; let n=Math.min(2+day, 10-raiders.length);
    for(let i=0;i<n;i++) spawnRaider(20,40);
    if(n>0) toast('Voices in the dark. Raiders are out tonight.');
  }
  wanderSpawnT+=dt; if(wanderSpawnT>60){ wanderSpawnT=0; if(raiders.length<4) spawnRaider(25,45); }
}

// =====================================================================
// POWER — very simple: devices within 10 tiles of each other (or in the
// same building) form a network. A running generator powers the whole
// network; otherwise batteries do, as long as they hold charge. Solar
// panels (outdoors) charge batteries by day. Every building that holds
// a device of a powered network is powered: lights, TV, fridge, PCs.
// =====================================================================
let networks=[], poweredB=new Set(), poweredLamps=new Set(), genNoiseT=0;
function recomputePower(){
  const dev=objs.filter(o=>POWER_TYPES.has(o.type));
  const parent=dev.map((_,i)=>i), find=i=>parent[i]===i?i:(parent[i]=find(parent[i]));
  for(let a=0;a<dev.length;a++){ const A=dev[a], ba=bld[idx(A.x,A.y)];
    for(let b=a+1;b<dev.length;b++){ const B=dev[b], bb=bld[idx(B.x,B.y)];
      if((ba>=0 && ba===bb) || Math.max(Math.abs(A.x-B.x),Math.abs(A.y-B.y))<=10) parent[find(a)]=find(b); } }
  const groups=new Map();
  dev.forEach((o,i)=>{ const r=find(i); if(!groups.has(r)) groups.set(r,{gens:[],bats:[],solars:[],lamps:[],blds:new Set()}); const n=groups.get(r);
    if(o.type==='generator') n.gens.push(o); else if(o.type==='battery') n.bats.push(o); else if(o.type==='solar') n.solars.push(o); else n.lamps.push(o);
    const bi=bld[idx(o.x,o.y)]; if(bi>=0 && o.type!=='solar') n.blds.add(bi); });
  networks=[...groups.values()].filter(n=>n.gens.length||n.bats.length);
  updatePowerFlags();
}
function updatePowerFlags(){
  poweredB=new Set(); poweredLamps=new Set();
  for(const n of networks){ n.on = n.gens.some(g=>g.on) || n.bats.some(b=>b.charge>0.5);
    if(n.on){ n.blds.forEach(b=>poweredB.add(b)); n.lamps.forEach(l=>poweredLamps.add(l)); } }
}
function isPowered(o){ if(o.type==='lamp') return poweredLamps.has(o); const b=bld[idx(o.x,o.y)]; return b>=0 && poweredB.has(b); }
function tickPower(dt){
  const dh=dt*0.05, night=darkness(time)>0.25;
  for(const n of networks){
    const genOn=n.gens.some(g=>g.on);
    if(n.bats.length){
      let gain=0;
      if(darkness(time)<0.2) gain += n.solars.filter(s=>bld[idx(s.x,s.y)]<0).length*9*dh;
      if(genOn) gain += 6*dh;
      let loss = (!genOn && night) ? (n.blds.size*4 + n.lamps.length*0.8)*dh : 0;
      const delta=gain-loss;
      if(delta>0){ let left=delta; for(const b of [...n.bats].sort((a,c)=>a.charge-c.charge)){ const m=Math.min(left,100-b.charge); b.charge+=m; left-=m; if(left<=0) break; } }
      else if(delta<0){ let left=-delta; for(const b of [...n.bats].sort((a,c)=>c.charge-a.charge)){ const m=Math.min(left,b.charge); b.charge-=m; left-=m; if(left<=0) break; } }
    }
  }
  updatePowerFlags();
  // a running generator is loud
  genNoiseT+=dt;
  if(genNoiseT>8){ genNoiseT=0; for(const n of networks) for(const g of n.gens) if(g.on) alertRaiders(g.x*T+8,g.y*T+8,13*T); }
}
function useDevice(o){
  if(o.type==='generator'){ o.on=!o.on; recomputePower(); toast(o.on ? 'Generator running. Lights on — and it\'s loud.' : 'Generator off.'); }
  else if(o.type==='battery'){ const n=networks.find(n=>n.bats.includes(o));
    toast(`Battery ${Math.round(o.charge)}% · ${n?n.solars.length:0} solar panel(s) · powering ${n&&n.on?n.blds.size+' building(s)':'nothing right now'}`); }
  else if(o.type==='solar'){ const n=networks.find(n=>n.solars.includes(o));
    toast(bld[idx(o.x,o.y)]>=0 ? 'A solar panel indoors does nothing — it needs open sky.' : !n||!n.bats.length ? 'No battery within 10 tiles to charge.' : darkness(time)<0.2 ? 'Charging the battery.' : 'Waiting for the sun.'); }
  else if(o.type==='storage'){ openInventory(o); }
  else if(o.type==='bed'||o.type==='hbed'||o.type==='tent'||o.type==='bedroll'){ sleep(); }
  else if(o.type==='campfire'){ openActions('Campfire', campfireActions(o)); }
  else if(o.type==='tower'){ if(npcs.some(n=>n.tower===o&&n.state==='tower')){ toast('Someone is already up there.'); return; } player.onTower=o; player.x=o.x*T+16; player.y=o.y*T+22; search=null; toast('On the watchtower. Raiders can\'t reach you up here — E to climb down.'); }
  else if(o.type==='toilet'){ if(o.tank===undefined) o.tank=2; if(o.tank<=0){ toast('The tank is empty.'); return; } o.tank--; drink(30,true,'You drink the water from the toilet tank. It\'s clean — just don\'t think about it.'); }
  else if(o.type==='collector'){ const n=Math.floor(o.water||0); if(n<1){ toast(`Collecting... ${Math.round((o.water||0)*100/1)}% of a bottle so far.`); return; }
    openActions('Rain Collector', [[`Drink (${n} bottle${n>1?'s':''} worth)`,()=>{ o.water-=1; drink(45,true,'Rainwater. Clean.'); }],[`Fill empty bottles (${countItem('bottle')})`,()=>{ let k=0; while(o.water>=1 && hasItem('bottle')){ takeItem('bottle',1); addItem('water',1); o.water-=1; k++; } toast(k?`Filled ${k} bottle(s).`:'No empty bottles.'); }]]); }
}
function sleep(){
  if(!(time>=20 || time<6)) { toast('You can only sleep at night (after 20:00).'); return; }
  if(raiders.some(r=>r.state==='chase' || Math.hypot(r.x-player.x,r.y-player.y)<12*T)) { toast('Not with raiders this close.'); return; }
  const hours = time>=20 ? 24-time+7 : 7-time;
  if(time>=20) day++;
  time=7; player.hunger=Math.max(0,player.hunger-hours*2); player.thirst=Math.max(0,player.thirst-hours*2.5); player.health=Math.min(player.maxHealth,player.health+20); player.stamina=player.maxStamina;
  for(let k=0;k<Math.ceil(hours);k++) tickPower(20); // let batteries/solar catch up roughly
  lastWave=day; raiders=raiders.filter(r=>Math.hypot(r.x-player.x,r.y-player.y)<30*T);
  const f=document.getElementById('fade'); f.style.opacity=1; setTimeout(()=>f.style.opacity=0,700);
  toast(`You sleep until morning. Day ${day}.`); saveGame(true);
}

// =====================================================================
// BUILD MODE (Fallout-4 style: pick a piece, green ghost = valid, place)
// =====================================================================
let buildMode=false, buildSel=0, ghost=null;
function buildCost(p){ const c={}; for(const [k,v] of Object.entries(p.cost)) c[k]= Math.max(1,Math.ceil(v*(player.mods.materialCost||1))); return c; }
function canAfford(cost){ return Object.entries(cost).every(([k,v])=>countItem(k)>=v); }
function payCost(cost){ for(const [k,v] of Object.entries(cost)) takeItem(k,v); }
function costText(cost){ return Object.entries(cost).map(([k,v])=>`${v} ${ITEMS[k].name} (${countItem(k)})`).join(', ') || 'free'; }
function toggleBuild(force){
  buildMode = force!==undefined ? force : !buildMode; search=null;
  document.body.classList.toggle('building', buildMode);
  if(buildMode) toast('CONSTRUIR — escolha a peça embaixo. Clique / USAR para colocar. B para sair.');
  renderHotbar();
}
const BUILD_CATS=['Structure','Defense','Furniture','Camp','Power','Scrap'];
let buildCat='Structure';
function buildList(){ return BUILD.filter(p=>p.cat===buildCat); }
function renderBuildBar(hb){
  if(!BUILD[buildSel] || BUILD[buildSel].cat!==buildCat){ const f=buildList()[0]; buildSel=BUILD.indexOf(f); }
  buildList().forEach((p,k)=>{ const i=BUILD.indexOf(p);
    const d=document.createElement('div'); d.className='slot build'+(i===buildSel?' eq':'')+(p.id!=='scrap'&&!canAfford(buildCost(p))?' poor':'');
    d.title=`${p.name} — ${p.id==='scrap'?p.desc:costText(buildCost(p))}`;
    d.innerHTML=`<span class="k">${(k+1)%10}</span><img src="${ICONS['b_'+p.id]||ICONS.b_storage}" alt="">`;
    d.addEventListener('pointerdown',e=>{ e.stopPropagation(); buildSel=i; renderHotbar(); });
    hb.appendChild(d);
  });
  const x=document.createElement('div'); x.className='slot exit'; x.textContent='✕'; x.title='Sair (B)';
  x.addEventListener('pointerdown',e=>{ e.stopPropagation(); toggleBuild(false); }); hb.appendChild(x);
  const p=BUILD[buildSel], bi=document.getElementById('build-info');
  bi.innerHTML=`<div class="tabs">${BUILD_CATS.filter(c=>BUILD.some(q=>q.cat===c)).map(c=>`<button class="tab${c===buildCat?' on':''}" data-c="${c}">${c}</button>`).join('')}</div><div class="bdesc"><b>${p.name}</b>: ${p.id==='scrap'?p.desc:costText(buildCost(p))}${p.desc&&p.id!=='scrap'?' · '+p.desc:''} <small>(Q troca a categoria)</small></div>`;
  bi.querySelectorAll('.tab').forEach(t=>t.addEventListener('pointerdown',e=>{ e.stopPropagation(); buildCat=t.dataset.c; renderHotbar(); }));
}
function ghostTile(){
  let tx,ty;
  if(!isTouch && mouse.seen){ const m=mouseWorld(); tx=Math.floor(m.x/T); ty=Math.floor(m.y/T); }
  else { const [fx,fy]=FACE[player.face]; tx=Math.floor(player.x/T)+fx; ty=Math.floor((player.y-3)/T)+fy; if(fy<0) ty=Math.floor((player.y-6)/T)-1; }
  return [tx,ty];
}
function playerOnTile(x,y){ return player.x+4>x*T && player.x-4<x*T+T && player.y>y*T && player.y-5<y*T+T; }
function updateGhost(){
  if(!buildMode){ ghost=null; return; }
  const p=BUILD[buildSel]; const [tx,ty]=ghostTile();
  const far = Math.hypot(tx*T+8-player.x, ty*T+8-player.y) > 6*T;
  if(p.id==='scrap'){
    let tgt=null; if(inB(tx,ty)){ const i=idx(tx,ty), o=objGrid[i];
      const b=built.find(b=>b.x===tx&&b.y===ty);
      if(b && b.t!=='_fence') tgt={kind:'built',ref:b,name:BUILD.find(q=>q.id===b.t).name,yield:SCRAP_YIELD[b.t]};
      else if(o && SCRAP_YIELD[o.type] && o.type!=='body' && o.type!=='carcass') tgt={kind:'obj',ref:o,name:OBJ_NAMES[o.type]||o.type,yield:SCRAP_YIELD[o.type]};
      else if(map[i]===TL.FENCE && bld[i]<0) tgt={kind:'fence',x:tx,y:ty,name:'Fence',yield:SCRAP_YIELD.fence}; }
    let why = !tgt ? 'Nada para desmontar aqui' : far ? 'Longe demais' : (tgt.kind==='obj' && tgt.ref.container && !tgt.ref.searched) ? 'Revista primeiro' : '';
    ghost={p,tx,ty,ok:!why,why,tgt,w:tgt&&tgt.ref&&tgt.ref.w||1,h:tgt&&tgt.ref&&tgt.ref.h||1, gx: tgt&&tgt.ref&&tgt.ref.x!==undefined&&tgt.kind==='obj'?tgt.ref.x:tx, gy: tgt&&tgt.kind==='obj'?tgt.ref.y:ty};
    return;
  }
  const w=p.w||1, h=p.h||1; let why='';
  for(let dy=0;dy<h && !why;dy++) for(let dx=0;dx<w && !why;dx++){ const x=tx+dx, y=ty+dy;
    if(!inB(x,y)){ why='Fora do mapa'; break; } const i=idx(x,y), t=map[i];
    if(p.id==='pier'){ const wat=t===TL.WATER||t===TL.SEA; const nb=[[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>{ const tt=tileAt(x+a,y+b); return tt!==TL.WATER&&tt!==TL.SEA; });
      if(!wat) why='O cais vai sobre a água'; else if(!nb) why='Comece da margem ou de outro cais'; else if(vehicles.some(v=>Math.hypot(v.x-x*T-8,v.y-y*T-8)<30)) why='Um barco atrapalha'; continue; }
    if(t===TL.WALL||t===TL.WINDOW||t===TL.WATER||t===TL.FENCE||t===TL.SEA) why='Bloqueado';
    else if(objGrid[i]||doors.has(i)) why='Algo está no caminho';
    else if(playerOnTile(x,y) || raiders.some(r=>Math.floor(r.x/T)===x&&Math.floor((r.y-3)/T)===y)) why='Tem alguém aí';
    else if(p.id==='floor' && (bld[i]>=0 || t===TL.WOOD)) why='Já tem piso';
  }
  if(!why && far) why='Longe demais';
  if(!why && !canAfford(buildCost(p))) why='Falta material';
  ghost={p,tx,ty,gx:tx,gy:ty,w,h,ok:!why,why};
}
function placeBuild(){
  if(!ghost) return;
  if(!ghost.ok){ toast(ghost.why); return; }
  const p=ghost.p, x=ghost.tx, y=ghost.ty, i=idx(x,y);
  if(p.id==='scrap'){ const tree=ghost.tgt.ref&&ghost.tgt.ref.type==='tree'; if(tree && !hasAxe()) toast('No axe — you snap off what branches you can.');
    search={scrap:true, tgt:ghost.tgt, t:0, dur:(tree?(hasAxe()?2.2:5):1.3)/(player.mods.buildSpeed||1)}; return; }
  payCost(buildCost(p));
  if(p.tile){ const rec=placeTile(p.id,x,y,{}); if(rec.door) askCode(p.id==='gate'?'Set the gate code':'Lock this door? Set a code (or close)', c=>{ rec.door.code=c; toast(`Code set: ${c}. Raiders will have to smash it.`); }); }
  else placeObject(p.id,x,y,{});
  renderHotbar();
}
function placeTile(kind,x,y,st){
  const i=idx(x,y);
  const rec={t:kind,x,y,prev:st.prev!==undefined?st.prev:map[i],prevMat:st.prevMat!==undefined?st.prevMat:mat[i]};
  if(kind==='wall'){ map[i]=TL.WALL; mat[i]=8; }
  else if(kind==='window'){ map[i]=TL.WINDOW; mat[i]=8; }
  else if(kind==='floor'){ map[i]=TL.WOOD; }
  else if(kind==='pier'){ map[i]=TL.PIER; }
  else if(kind==='fence'){ map[i]=TL.FENCE; }
  else if(kind==='gate'){ if(map[i]===TL.GRASS||map[i]===TL.FOREST||map[i]===TL.PARK) map[i]=TL.DIRT;
    const d={x,y,open:!!st.open,b:-1,built:true,gate:true,code:st.code||null}; doors.set(i,d); chunkDoors[cidx(x,y)].push(d); rec.door=d; }
  else if(kind==='door'){ mat[i]=8; if(map[i]===TL.GRASS||map[i]===TL.FOREST||map[i]===TL.PARK) map[i]=TL.WOOD;
    const d={x,y,open:!!st.open,b:-1,built:true,code:st.code||null}; doors.set(i,d); chunkDoors[cidx(x,y)].push(d); rec.door=d; }
  built.push(rec); refreshWalk(x,y); dirtyChunks(x,y);
  return rec;
}
function placeObject(type,x,y,st){
  const o={type,x,y,solid:type!=='bedroll',placed:true,b:bld[idx(x,y)]};
  const bp=BUILD.find(q=>q.id===type); if(bp){ if(bp.w) o.w=bp.w; if(bp.h) o.h=bp.h; }
  if(type==='campfire'){ o.fuel=st.fuel||0; o.lit=!!st.lit; o.light=o.lit; o.seed=7; }
  if(type==='collector') o.water=st.water||0;
  if(type==='storage') o.store=st.store||new Array(12).fill(null);
  if(type==='generator') o.on=!!st.on;
  if(type==='battery') o.charge=st.charge||0;
  addObj(o); for(let dy=0;dy<o.h;dy++) for(let dx=0;dx<o.w;dx++) refreshWalk(x+dx,y+dy);
  if(POWER_TYPES.has(type)) recomputePower();
  if(type==='campfire'||type==='collector') campObjs.push(o);
  return o;
}
function finishScrap(s){
  const tg=s.tgt; let y={...tg.yield};
  if(tg.ref && tg.ref.type==='tree' && !hasAxe()) y={logs:1};
  const mul = player.mods.buildSpeed ? 1.5 : 1;
  for(const k in y) y[k]=Math.max(1,Math.round(y[k]*mul*(0.75+Math.random()*0.5)));
  if(tg.kind==='built'){ const b=tg.ref, i=idx(b.x,b.y);
    if(b.door){ doors.delete(i); const L=chunkDoors[cidx(b.x,b.y)]; L.splice(L.indexOf(b.door),1); }
    map[i]=b.prev; mat[i]=b.prevMat; built.splice(built.indexOf(b),1); refreshWalk(b.x,b.y); dirtyChunks(b.x,b.y); }
  else if(tg.kind==='fence'){ const i=idx(tg.x,tg.y); map[i]=TL.GRASS; refreshWalk(tg.x,tg.y); dirtyChunks(tg.x,tg.y); built.push({t:'_fence',x:tg.x,y:tg.y,prev:TL.FENCE,prevMat:0}); }
  else { if(tg.ref.store && tg.ref.store.some(Boolean)){ toast('Empty the storage box first.'); return; } removeObj(tg.ref); const ci=campObjs.indexOf(tg.ref); if(ci>=0) campObjs.splice(ci,1); }
  const got=[]; for(const [k,v] of Object.entries(y)){ addItem(k,v); got.push(`${ITEMS[k].name} ×${v}`); }
  toast(`Scrapped ${tg.name}: ${got.join(', ')}`); renderHotbar();
}

// =====================================================================
// INVENTORY PANEL (hotbar 10 + backpack 20, plus an open storage box)
// =====================================================================
let invOpen=false, invSel=null, openStore=null;
function openInventory(store){ openStore=store||null; invSel=null; invOpen=true; closePanels('inv'); document.getElementById('inv-panel').style.display='flex'; renderInvPanel(); }
function closeInventory(){ invOpen=false; openStore=null; invSel=null; bodySel=null; document.getElementById('inv-panel').style.display='none'; renderHotbar(); }
function slotArr(k){ return k==='store' ? openStore.store : inv; }
function slotHtml(s,label){ return `<span class="k">${label}</span>` + (s ? `<img src="${ICONS[s.id]}" alt=""><span class="q">${s.qty>1?s.qty:''}</span>` : ''); }
function renderInvPanel(){
  const mk=(arr,k,from,to,el,labelFn)=>{ el.innerHTML='';
    for(let i=from;i<to;i++){ const s=arr[i]; const d=document.createElement('div');
      d.className='slot'+(invSel&&invSel.k===k&&invSel.i===i?' sel':'')+(s&&k==='inv'&&s.id===player.weapon?' eq':'');
      d.title = s ? ITEMS[s.id].name : '';
      d.innerHTML=slotHtml(s,labelFn(i)); d.addEventListener('pointerdown',e=>{ e.stopPropagation(); clickSlot(k,i); }); el.appendChild(d); } };
  const wr=document.getElementById('inv-wear'); wr.innerHTML='';
  for(const slot of ['head','body']){ const id=player.equip[slot]; const d=document.createElement('div'); d.className='slot wear';
    d.innerHTML=`<span class="k">${slot==='head'?'HEAD':'BODY'}</span>`+(id?`<img src="${ICONS[id]}" alt="">`:'');
    d.title = id ? `${ITEMS[id].name} — tap to take off` : (slot==='head'?'Helmet':'Vest');
    d.addEventListener('pointerdown',e=>{ e.stopPropagation(); unwear(slot); }); wr.appendChild(d); }
  const ar=document.createElement('div'); ar.className='armor-txt';
  ar.textContent=`Head armour ${Math.round(partArmor('head')*100)}% · torso ${Math.round(partArmor('torso')*100)}% · tap worn gear to remove`; wr.appendChild(ar);
  mk(inv,'inv',0,HOTBAR,document.getElementById('inv-hot'),i=>(i+1)%10);
  mk(inv,'inv',HOTBAR,SLOTS,document.getElementById('inv-bag'),()=> '');
  const st=document.getElementById('inv-store-wrap'), sa=document.getElementById('inv-store-acts'); sa.innerHTML='';
  if(openStore){ st.style.display='block';
    const nm = openStore.kind && VEH_KINDS[openStore.kind] ? VEH_KINDS[openStore.kind].name.toUpperCase() : (OBJ_NAMES[openStore.type]||'STORAGE').toUpperCase();
    document.getElementById('inv-store-title').textContent=nm;
    mk(openStore.store,'store',0,openStore.store.length,document.getElementById('inv-store'),()=> '');
    const b=document.createElement('button'); b.textContent='Store all materials'; b.onclick=()=>{ for(let i=0;i<SLOTS;i++) if(inv[i]&&BAG_FIRST.has(inv[i].id)) moveAll('inv',i,'store',true); renderInvPanel(); }; sa.appendChild(b);
    const b2=document.createElement('button'); b2.textContent='Take all'; b2.onclick=()=>{ for(let i=0;i<openStore.store.length;i++) if(openStore.store[i]) moveAll('store',i,'inv',true); renderInvPanel(); }; sa.appendChild(b2);
  } else st.style.display='none';
  const info=document.getElementById('inv-info'), acts=document.getElementById('inv-acts'), ic=document.getElementById('inv-icon'); acts.innerHTML=''; ic.innerHTML='';
  const sel = invSel && slotArr(invSel.k)[invSel.i];
  if(sel){ const it=ITEMS[sel.id], Wp=WEAPONS[sel.id];
    ic.innerHTML=`<img src="${ICONS[sel.id]}" alt="">`;
    let extra='';
    if(Wp) extra = Wp.ranged ? ` · damage ${Wp.dmg}${Wp.pellets?'×'+Wp.pellets:''} · range ${Math.round(Wp.range/T)} tiles · uses ${ITEMS[Wp.ammo].name}` : ` · damage ${Wp.dmg} · reach ${Math.round(Wp.range)}px`;
    if(it.wear) extra=` · protects the ${WEAR[sel.id].slot==='head'?'head':'torso'}`;
    if(it.value) extra=` · worth ~$${it.value} each`;
    info.innerHTML = `<b>${it.name}${sel.qty>1?' ×'+sel.qty:''}</b><small>${extra}</small><div class="desc">${it.desc||''}</div>`;
    const btn=(t,f)=>{ const b=document.createElement('button'); b.textContent=t; b.onclick=f; acts.appendChild(b); };
    if(invSel.k==='inv'){
      const med=['bandage','splint','firstaid'].includes(sel.id);
      if(med && bodySel) btn(`Use on ${PART_NAMES[bodySel].toLowerCase()}`, ()=>{ useSlot(invSel.i); invSel=null; renderInvPanel(); renderBody(); });
      btn(it.wear ? 'Wear' : it.weapon ? (player.weapon===sel.id?'Unequip':'Equip') : 'Use', ()=>{ useSlot(invSel.i); invSel=null; renderInvPanel(); renderBody(); });
      btn('Drop', ()=>{ dropSlot(invSel.i); invSel=null; renderInvPanel(); });
      if(openStore) btn('Store →', ()=>{ moveAll('inv',invSel.i,'store'); });
    } else btn('← Take', ()=>{ moveAll('store',invSel.i,'inv'); });
  } else info.innerHTML = `<div class="desc">${openStore ? 'Tap an item, then tap where it should go. Storage is saved with your game.' : 'Tap an item to see what it does. Tap another slot to move it. Select a body part on the left to treat it.'}</div>`;
  renderBody();
}
function moveAll(fk,fi,tk,quiet){
  const from=slotArr(fk), to=slotArr(tk), s=from[fi]; if(!s) return;
  const st=ITEMS[s.id].stack;
  for(let i=0;i<to.length && s.qty>0;i++){ const d=to[i]; if(d&&d.id===s.id&&d.qty<st){ const m=Math.min(s.qty,st-d.qty); d.qty+=m; s.qty-=m; } }
  for(let i=0;i<to.length && s.qty>0;i++){ if(!to[i]){ to[i]={id:s.id,qty:s.qty}; s.qty=0; } }
  if(s.qty<=0) from[fi]=null; else if(!quiet) toast('No room.');
  if(fk==='inv' && player.weapon===s.id && !hasItem(s.id)) player.weapon='fists';
  invSel=null; if(!quiet) renderInvPanel(); renderHotbar();
}
function clickSlot(k,i){
  const arr=slotArr(k);
  if(!invSel){ if(arr[i]) invSel={k,i}; renderInvPanel(); return; }
  if(invSel.k===k && invSel.i===i){ invSel=null; renderInvPanel(); return; }
  const A=slotArr(invSel.k), a=A[invSel.i], b=arr[i];
  if(b && a && b.id===a.id){ const st=ITEMS[a.id].stack, m=Math.min(a.qty,st-b.qty); b.qty+=m; a.qty-=m; if(!a.qty) A[invSel.i]=null; }
  else { A[invSel.i]=b; arr[i]=a; }
  if(!hasItem(player.weapon) && player.weapon!=='fists') player.weapon='fists';
  invSel=null; renderInvPanel(); renderHotbar();
}

// =====================================================================
// CRAFTING
// =====================================================================
let craftOpen=false;
function openCraft(){ craftOpen=true; closePanels('craft'); document.getElementById('craft-panel').style.display='flex'; renderCraft(); }
function closeCraft(){ craftOpen=false; document.getElementById('craft-panel').style.display='none'; }
let craftTab='All';
const CRAFT_CAT = r => ['bandage','firstaid','splint'].includes(r.out[0]) ? 'Medical' : (WEAPONS[r.out[0]] ? 'Weapons & tools' : r.out[0]==='rod'||r.out[0]==='lantern' ? 'Survival' : 'Survival');
function renderCraft(){
  const tabs=document.getElementById('craft-tabs'); tabs.innerHTML='';
  for(const t of ['All','Survival','Medical','Weapons & tools']){ const b=document.createElement('button'); b.className='tab'+(t===craftTab?' on':''); b.textContent=t; b.onclick=()=>{ craftTab=t; renderCraft(); }; tabs.appendChild(b); }
  const box=document.getElementById('craft-list'); box.innerHTML='';
  for(const r of CRAFT){
    if(craftTab!=='All' && CRAFT_CAT(r)!==craftTab) continue;
    const ok=canAfford(r.cost), it=ITEMS[r.out[0]];
    const row=document.createElement('div'); row.className='craft-row'+(ok?'':' poor');
    const ings=Object.entries(r.cost).map(([k,v])=>`<span class="ing${countItem(k)>=v?'':' miss'}"><img src="${ICONS[k]}" alt="">${ITEMS[k].name} ${countItem(k)}/${v}</span>`).join('');
    row.innerHTML=`<img src="${ICONS[r.out[0]]}" alt=""><div><b>${it.name}${r.out[1]>1?' ×'+r.out[1]:''}</b><div class="desc">${it.desc||''}</div><div class="ings">${ings}</div></div>`;
    const b=document.createElement('button'); b.textContent='Craft'; b.disabled=!ok;
    b.onclick=()=>{ if(!canAfford(r.cost)) return; payCost(r.cost); const left=addItem(r.out[0],r.out[1]); toast(left?'Crafted — but your bags are full.':`Crafted ${it.name}.`); renderCraft(); };
    row.appendChild(b); box.appendChild(row);
  }
  const note=document.createElement('p'); note.className='craft-note';
  note.textContent='Walls, fences, gates, piers, camp gear and power are built in BUILD mode (B). Chop trees with an axe for logs. Cook and boil water at a campfire.';
  box.appendChild(note);
}

// =====================================================================
// SAVE / LOAD — anywhere, any time. Kept in this browser and, when
// available, in your private cloud slot so it follows you between devices.
// =====================================================================
const SAVE_KEY='afterlight_save_v1';
let cloud={db:null,uid:null,downloads:null}, cloudSave=null;
function encIds(ids){ ids.sort((a,b)=>a-b); let p=0; return ids.map(v=>{ const d=v-p; p=v; return d.toString(36); }).join(','); }
function decIds(s){ if(!s) return []; let p=0; return s.split(',').map(t=>{ p+=parseInt(t,36); return p; }); }
function serialize(){
  return { v:1, world:WORLD_VERSION(), savedAt:Date.now(), name:player.name, professions:player.professions,
    look:player.look, equip:player.equip,
    p:{x:player.x,y:player.y,health:player.health,hunger:player.hunger,stamina:player.stamina,weapon:player.weapon,lanternOn:player.lanternOn,kills:player.kills,face:player.face,
       thirst:player.thirst,sick:player.sick,limbs:player.limbs,bleed:player.bleed,splint:player.splint},
    veh:vehicles.map(v=>[Math.round(v.x),Math.round(v.y),Math.round(v.ang*100)/100,Math.round(v.fuel),Math.round(v.hp),v.store,v.hitch?vehicles.indexOf(v.hitch):-1]), drivingIdx: driving?vehicles.indexOf(driving):-1,
    inv, time, day, lastWave,
    doorsOpen:[...doors.entries()].filter(([i,d])=>d.open&&!d.built).map(([i])=>i),
    searched:encIds(objs.filter(o=>o.id<worldObjCount&&o.searched).map(o=>o.id)),
    removed:encIds([...removedIds]),
    built:built.map(b=>[b.t,b.x,b.y,b.prev,b.prevMat,b.door&&b.door.open?1:0,b.door&&b.door.code||null]),
    npcs:npcs.filter(n=>!n.temp||n.role==='member').map(n=>({id:n.id,dead:n.dead,role:n.role,state:n.state,hx:Math.round(n.hx),hy:Math.round(n.hy),x:Math.round(n.x),y:Math.round(n.y),hp:Math.round(n.hp),weapon:n.weapon,stock:n.stock,rec:n.recruitable,
      ...(n.temp||n.id>=1e6 ? {look:n.look,name:n.name,max:n.max} : {}), tower: n.tower ? [n.tower.x,n.tower.y] : null})),
    camps:camps.map(c=>c.spawned?raiders.filter(r=>r.camp===c.id).length:c.left), markers,
    placed:objs.filter(o=>o.placed).map(o=>({t:o.type,x:o.x,y:o.y,store:o.store,on:o.on,charge:o.charge,searched:o.searched,lit:o.lit,fuel:o.fuel,water:o.water,code:o.code})),
    dev:objs.filter(o=>o.id<worldObjCount&&(o.type==='battery'||o.type==='generator')).map(o=>[o.id,Math.round((o.charge||0)*10)/10,o.on?1:0]),
    bodies:objs.filter(o=>o.type==='body').map(o=>[o.x,o.y,o.searched?1:0,o.drop,o.pal,o.dir,o.gear||[]]),
  };
}
async function saveGame(quiet){
  if(!running) return;
  const data=serialize(), json=JSON.stringify(data);
  let local=false; try{ localStorage.setItem(SAVE_KEY,json); local=true; }catch(e){}
  const when=`Day ${day}, ${String(Math.floor(time)).padStart(2,'0')}:${String(Math.floor((time%1)*6)*10).padStart(2,'0')}`;
  setSaveStatus(`Saving… (${when})`);
  let ok=false;
  if(cloud.db && cloud.uid){
    try{ await cloud.db.doc(`data/users/${cloud.uid}/save`).set({json,savedAt:data.savedAt,day,name:player.name}); ok=true; cloudSave={json,savedAt:data.savedAt}; }
    catch(e){ if(e&&e.code==='unavailable'){ try{ await new Promise(r=>setTimeout(r,800+Math.random()*800)); await cloud.db.doc(`data/users/${cloud.uid}/save`).set({json,savedAt:data.savedAt,day,name:player.name}); ok=true; }catch(_){} } }
  }
  const where = ok ? 'saved to your account' : local ? 'saved in this browser' : 'could not be saved here — use Export';
  setSaveStatus(`${when} — ${where}`);
  if(!quiet || !(ok||local)) toast(`Game ${where} (${when}).`);
}
function setSaveStatus(t){ const el=document.getElementById('save-status'); if(el) el.textContent=t; }
function readLocal(){ try{ const s=localStorage.getItem(SAVE_KEY); return s?JSON.parse(s):null; }catch(e){ return null; } }
function newestSave(){
  const a=readLocal(); let b=null; try{ b=cloudSave?JSON.parse(cloudSave.json):null; }catch(e){}
  if(a&&b) return a.savedAt>=b.savedAt?a:b; return a||b;
}
function applySave(s){
  if((s.world||1)!==WORLD_VERSION()) throw new Error('world');
  buildWorld();
  const mods={}; for(const id of s.professions) for(const [k,v] of Object.entries(PROFESSIONS[id].bonuses)) mods[k]=(mods[k]||1)*v;
  selectedProfessions=[...s.professions];
  chosenLook = s.look || null;
  makePlayer(s.name, mods, s.p.x, s.p.y);
  if(s.equip) player.equip={head:s.equip.head||null, body:s.equip.body||null};
  Object.assign(player, {health:s.p.health,hunger:s.p.hunger,stamina:s.p.stamina,weapon:s.p.weapon,lanternOn:s.p.lanternOn,kills:s.p.kills||0,face:s.p.face||'down',
    thirst:s.p.thirst??75, sick:s.p.sick||0});
  if(s.p.limbs){ player.limbs=s.p.limbs; player.bleed=s.p.bleed; player.splint=s.p.splint; }
  (s.veh||[]).forEach((r,i)=>{ const v=vehicles[i]; if(!v) return; [v.x,v.y,v.ang,v.fuel,v.hp]=r; if(r[5]) v.store=r[5]; });
  (s.veh||[]).forEach((r,i)=>{ if(r[6]>=0 && vehicles[i] && vehicles[r[6]]){ vehicles[i].hitch=vehicles[r[6]]; vehicles[r[6]].towedBy=vehicles[i]; } });
  if(s.drivingIdx>=0 && vehicles[s.drivingIdx]){ driving=vehicles[s.drivingIdx]; player.inVeh=driving; }
  inv=s.inv.slice(0,SLOTS); while(inv.length<SLOTS) inv.push(null);
  time=s.time; day=s.day; lastWave=s.lastWave||0;
  for(const i of s.doorsOpen||[]){ const d=doors.get(i); if(d) d.open=true; }
  for(const id of decIds(s.searched)){ const o=objById[id]; if(o) o.searched=true; }
  for(const id of decIds(s.removed)){ const o=objById[id]; if(o && objs.includes(o)) removeObj(o); }
  for(const [t,x,y,prev,prevMat,open,code] of s.built||[]){
    if(t==='_fence'){ const i=idx(x,y); map[i]=TL.GRASS; refreshWalk(x,y); built.push({t,x,y,prev,prevMat}); continue; }
    placeTile(t,x,y,{prev,prevMat,open,code}); }
  for(const r of s.npcs||[]){ let n=npcs.find(q=>q.id===r.id); if(!n){ if(!r.look) continue; n={id:r.id,name:r.name,look:r.look,max:r.max||80,face:'down',phase:0,moving:false,cd:0,wind:0,swingT:0,hurtT:0,alive:true,t:0}; npcs.push(n); }
    Object.assign(n,{dead:r.dead,role:r.role,state:r.state==='hostile'?'idle':r.state,hx:r.hx,hy:r.hy,x:r.x,y:r.y,hp:r.hp,weapon:r.weapon,recruitable:r.rec}); if(r.stock) n.stock=r.stock; n.temp=false; n.alive=!r.dead;
    if(r.tower){ n.towerAt=r.tower; } }
  (s.camps||[]).forEach((left,i)=>{ if(camps[i]) camps[i].left=left; });
  markers = s.markers || [];
  for(const p of s.placed||[]){ const o=placeObject(p.t,p.x,p.y,p); if(p.searched) o.searched=true; }
  for(const n of npcs) if(n.towerAt){ n.tower=objs.find(o=>o.type==='tower'&&o.x===n.towerAt[0]&&o.y===n.towerAt[1]); if(!n.tower) n.state='guard'; delete n.towerAt; }
  for(const [id,charge,on] of s.dev||[]){ const o=objById[id]; if(o){ o.charge=charge; o.on=!!on; } }
  for(const [x,y,sr,drop,pal,dir,gear] of s.bodies||[]) addObj({type:'body',x,y,solid:false,container:'body',drop,gear,pal:(pal&&typeof pal==='object')?pal:raiderLook(),dir,sortY:y*T+1,searched:!!sr});
  chunkCache.clear(); recomputePower();
}
function continueGame(){
  const s=newestSave(); if(!s){ toast('No saved game found.'); return; }
  try{ applySave(s); } catch(e){ alertBox(e.message==='world' ? 'That save is from the old map — please start a new game.' : 'That save could not be loaded.'); return; }
  enterGame(`Welcome back, ${player.name}. Day ${day}.`);
}
function exportSave(){
  if(!running) return; const json=JSON.stringify(serialize());
  const fname=`after-light-day${day}.json`;
  if(cloud.downloads){ cloud.downloads.save({filename:fname,data:json}).then(()=>toast('Save file exported.')).catch(e=>{ if(e&&e.code!=='declined') showExportText(json); }); }
  else showExportText(json);
}
function showExportText(json){
  const ta=document.getElementById('export-text'); ta.value=json; document.getElementById('export-box').style.display='block'; ta.select();
}
function importSaveText(txt){
  let s; try{ s=JSON.parse(txt); if(!s||s.v!==1||!s.p) throw 0; }catch(e){ alertBox('That doesn\'t look like an After Light save.'); return; }
  try{ applySave(s); } catch(e){ alertBox(e.message==='world' ? 'That save is from the old map — please start a new game.' : 'That save could not be loaded.'); return; }
  closePanels(); enterGame(`Save imported. Day ${day}.`);
}
function alertBox(t){ toast(t); setSaveStatus(t); }
async function initCloud(){
  try{
    if(!window.claude || typeof window.claude.use!=='function') return;
    const [db,user,dl]=await Promise.all([window.claude.use('db'),window.claude.use('user'),window.claude.use('downloads')]);
    cloud.downloads=dl||null;
    if(!db||!user) return;
    const uid=await user.id(); if(!uid) return;
    cloud.db=db; cloud.uid=uid;
    const snap=await Promise.race([db.doc(`data/users/${uid}/save`).get(), new Promise(r=>setTimeout(()=>r(null),10000))]);
    if(snap && snap.exists){ const d=snap.data(); cloudSave={json:d.json,savedAt:d.savedAt}; }
    refreshContinue();
  }catch(e){}
}
function refreshContinue(){
  let s=newestSave(); const b=document.getElementById('btn-continue');
  if(s && (s.world||1)!==WORLD_VERSION()) s=null;
  if(s){ b.style.display='block'; b.textContent=`Continue — ${s.name}, Day ${s.day}`; } else b.style.display='none';
  const t=document.getElementById('t-saves'); if(t) t.textContent = s ? `Saved Game — ${s.name}, Day ${s.day}` : 'Saved Game';
}

// =====================================================================
// MENU / PANELS
// =====================================================================
let actOpen=false;
function openActions(title, acts){
  actOpen=true; closePanels('act');
  document.getElementById('act-title').textContent=title;
  const L=document.getElementById('act-list'); L.innerHTML='';
  for(const [label,fn] of acts){
    if(!fn){ const d=document.createElement('div'); d.className='info'; d.textContent=label; L.appendChild(d); continue; }
    const b=document.createElement('button'); b.textContent=label;
    b.addEventListener('pointerdown',e=>{ e.stopPropagation(); e.preventDefault(); closeActions(); fn(); renderHotbar(); });
    L.appendChild(b);
  }
  document.getElementById('act-panel').style.display='flex';
}
function closeActions(){ actOpen=false; document.getElementById('act-panel').style.display='none'; }
let menuOpen=false;
function openMenu(){ menuOpen=true; closePanels('menu'); document.getElementById('menu-panel').style.display='flex'; document.getElementById('export-box').style.display='none'; }
function closeMenu(){ menuOpen=false; document.getElementById('menu-panel').style.display='none'; }
function closePanels(except){ if(except!=='trade'&&tradeWith) closeTrade(); if(except!=='act'&&actOpen) closeActions(); if(except!=='inv'&&invOpen) closeInventory(); if(except!=='craft'&&craftOpen) closeCraft(); if(except!=='menu'&&menuOpen) closeMenu(); if(mapOpen) toggleMap(false); }
function paused(){ return invOpen||craftOpen||menuOpen||actOpen||!!tradeWith; }

// ---------------- Update ----------------
function update(dt){
  if(driving){ updateDriving(dt); return; }
  let ix=0, iy=0;
  if(keys.w||keys.arrowup) iy-=1; if(keys.s||keys.arrowdown) iy+=1;
  if(keys.a||keys.arrowleft) ix-=1; if(keys.d||keys.arrowright) ix+=1;
  if(joy.active){ ix+=joy.x; iy+=joy.y; }
  let len=Math.hypot(ix,iy); if(len>1){ ix/=len; iy/=len; len=1; }
  if(player.onTower){ ix=0; iy=0; len=0; }
  player.moving = len>0.15;
  const wantRun = (keys.shift || runHeld) && player.moving && !aiming;
  if(player.stamina<1) player.exhausted=true; if(player.exhausted && player.stamina>25) player.exhausted=false;
  const running_ = wantRun && !player.exhausted && !(crippled('lleg')&&crippled('rleg'));
  player.maxStamina = 100*mod('maxStamina')*(crippled('torso')?.6:1);
  player.atkCd=Math.max(0,player.atkCd-dt);
  if(player.swing){ player.swing.t+=dt; if(player.swing.t>=player.swing.dur) player.swing=null; }
  if(aiming && !buildMode){ const m=mouseWorld(); player.aimAng=Math.atan2(m.y-(player.y-10), m.x-player.x); player.face=faceFromAng(player.aimAng);
    if(leftHeld && player.atkCd<=0) playerAttack(player.aimAng); }
  if(attackHeld && player.atkCd<=0 && !buildMode) playerAttack(autoAimAngle());
  else if(leftHeld && !aiming && player.atkCd<=0 && !buildMode && !paused()) playerAttack(clickAngle());
  if(player.moving){
    if(search) search=null;
    if(!aiming && !player.swing){ if(Math.abs(ix)>Math.abs(iy)) player.face = ix>0?'right':'left'; else player.face = iy>0?'down':'up'; }
    const sp = player.speed*(running_?1.7:1)*(aiming?0.55:1)*legFactor()*dt;
    const nx=player.x+ix*sp; if(boxFree(nx,player.y)) player.x=nx;
    const ny=player.y+iy*sp; if(boxFree(player.x,ny)) player.y=ny;
    player.phase += dt*(running_?14:9);
  }
  if(running_) player.stamina=Math.max(0,player.stamina-20*dt); else player.stamina=Math.min(player.maxStamina,player.stamina+11*dt*(player.thirst<15?.5:1)*(crippled('head')?.6:1));
  tickBody(dt,running_);
  player.hunger=Math.max(0,player.hunger-dt*0.16*(running_?1.6:1));
  if(player.hunger<=0){ player.health-=dt*0.5; if(player.health<=0) player.cause='starved'; }
  else if(player.hunger>65 && player.health<player.maxHealth) player.health=Math.min(player.maxHealth,player.health+dt*0.12);
  if(player.matchT>0) player.matchT=Math.max(0,player.matchT-dt);
  if(player.hurtT>0) player.hurtT-=dt; if(player.flashT>0) player.flashT-=dt;
  sharedTick(dt);
  if(player.health<=0){ die(); return; }
  if(search){ search.t+=dt; if(search.t>=search.dur){ const sr=search; search=null; if(sr.scrap) finishScrap(sr); else if(sr.fish) finishFishing(sr); else if(sr.timed) sr.timed(); else if(sr.butcher) butcher(sr.obj); else finishSearch(sr.obj); } }
  updateGhost();
  target = (search || buildMode) ? null : findTarget();
  if(!target && !search && !buildMode){ const n=npcNear(); if(n) target={kind:'npc',ref:n}; }
  if(!target && !search && !buildMode){ const v=vehNear(); if(v) target={kind:'veh',ref:v}; else { const w=waterNear(1.4); if(w) target={kind:'water',sea:w.sea}; } }
  // roofs: fade the one you are in
  const pi=idx(Math.floor(player.x/T),Math.floor((player.y-3)/T)), inside=bld[pi];
  player.inB = inside;
  for(const ci of visibleChunks(1)) for(const b of chunkBlds[ci]){ const tgt = b.id===inside ? 0 : 1; b.alpha += (tgt-b.alpha)*Math.min(1,dt*9); }
  cam.x += (player.x-cam.x)*Math.min(1,dt*7); cam.y += (player.y-8-cam.y)*Math.min(1,dt*7);
}
// world things that keep running whether you walk or drive
function sharedTick(dt){
  updateSpawns(dt);
  for(const r of [...raiders]) updateRaider(r,dt);
  updateAnimals(dt); tickCamp(dt); tickPower(dt); updateCamps(dt); updateNPCs(dt);
  for(const v of vehicles) if(v!==driving && !v.towedBy && Math.abs(v.sp)>0.5) updateVehicle(v,dt,null);
  for(const p of particles){ p.x+=p.vx*dt; p.y+=p.vy*dt; p.vz-=120*dt; p.z+=p.vz*dt; p.life-=dt; if(p.z<=0){ addDecal(p.x,p.y,p.col); p.life=0; } }
  particles=particles.filter(p=>p.life>0);
  for(const t of tracers) t.t-=dt; tracers=tracers.filter(t=>t.t>0);
  shake=Math.max(0,shake-dt*14);
  time+=dt*0.05*(OPTS.dayLen==='long'?0.5:1); if(time>=24){ time-=24; day++; toast(`Dia ${day}.`); }
}
function updateDriving(dt){
  let ix=0, iy=0;
  if(keys.w||keys.arrowup) iy+=1; if(keys.s||keys.arrowdown) iy-=1;
  if(keys.a||keys.arrowleft) ix-=1; if(keys.d||keys.arrowright) ix+=1;
  if(joy.active){ ix+=joy.x; iy-=joy.y; }
  player.moving=false; player.hurtT=Math.max(0,player.hurtT-dt);
  updateVehicle(driving,dt,{x:Math.max(-1,Math.min(1,ix)),y:Math.max(-1,Math.min(1,iy))});
  player.x=driving.x; player.y=driving.y+6; player.inB=-1;
  player.stamina=Math.min(player.maxStamina,player.stamina+11*dt);
  tickBody(dt,false); sharedTick(dt);
  if(search){ search.t+=dt; if(search.t>=search.dur){ const sr=search; search=null; if(sr.fish) finishFishing(sr); } }
  target=null; ghost=null;
  if(player.health<=0){ die(); return; }
  const [fx,fy]=vdir(driving.ang), look=Math.min(60,Math.abs(driving.sp)*.4)*Math.sign(driving.sp);
  cam.x += (driving.x+fx*look-cam.x)*Math.min(1,dt*5); cam.y += (driving.y+fy*look-cam.y)*Math.min(1,dt*5);
  for(const ci of visibleChunks(1)) for(const b of chunkBlds[ci]) b.alpha += (1-b.alpha)*Math.min(1,dt*9);
}
function die(){
  running=false;
  document.body.classList.remove('playing'); aiming=false; leftHeld=false; attackHeld=false;
  const k = player.kills ? ` Raiders taken down: ${player.kills}.` : '';
  const why={raiders:`was killed by raiders`, animal:`was killed by a wild animal`, thirst:`died of thirst`, bled:`bled out`, sick:`died of a fever from bad food or water`, starved:`starved`}[player.cause]||'died';
  document.getElementById('dead-text').textContent = `${player.name} ${why} on day ${day}.${k}`;
  driving=null;
  document.getElementById('dead').style.display='flex';
}

// ---------------- Rendering ----------------
const canvas=document.getElementById('game'), ctx=canvas.getContext('2d');
const buf=document.createElement('canvas'), bctx=buf.getContext('2d');
const lcv=document.createElement('canvas'), lctx=lcv.getContext('2d');
let zoom=3, dpr=1;
function resize(){
  dpr=Math.min(window.devicePixelRatio||1, 3);
  canvas.width=Math.floor(innerWidth*dpr); canvas.height=Math.floor(innerHeight*dpr);
  canvas.style.width=innerWidth+'px'; canvas.style.height=innerHeight+'px';
  zoom=Math.max(2, Math.floor(Math.min(canvas.width,canvas.height)/(innerHeight<520?300:230)));
  buf.width=Math.ceil(canvas.width/zoom); buf.height=Math.ceil(canvas.height/zoom);
  lcv.width=buf.width; lcv.height=buf.height;
}
addEventListener('resize',resize); resize();
function darkness(h){
  if(h>=7 && h<17.5) return 0;
  if(h>=17.5 && h<20.5) return (h-17.5)/3*0.9;
  if(h>=20.5 || h<4.5) return 0.9;
  return 0.9*(1-(h-4.5)/2.5);
}
function flick(now,s){ return 1+0.06*Math.sin(now*0.011+s)+0.04*Math.sin(now*0.029+s*2.3); }

// ---------------- Characters: looks, gear and drawing ----------------
const SKINS=['#f2cfb0','#e0b48e','#c8956a','#a8754c','#86583a','#5e3c26','#432a1a'];
const HAIRS=['#17110e','#2e1e14','#4a2e1a','#6a4424','#a8803a','#d8b860','#e8d090','#8a3a1e','#8a8680'];
const TOPS_M=['#5a4a36','#3e4a5a','#4a5a3a','#5a3a3a','#3a3a3a','#6a5a40','#2e3e4e','#5a5a52'];
const TOPS_F=['#7a3a4a','#3a6a6a','#5a3a6a','#8a5a3a','#3a4a6a','#6a6a3a','#8a3a3a','#4a6a4a'];
const PANTS=['#2f3744','#3a3a3a','#4a3e30','#2a3a4a','#4a4a52','#3a2e2a','#2e3a2e'];
const darkHex=(h,f=.75)=>{ const n=parseInt(h.slice(1),16), c=v=>Math.round(v*f).toString(16).padStart(2,'0'); return '#'+c(n>>16)+c((n>>8)&255)+c(n&255); };
const rpick=a=>a[Math.floor(Math.random()*a.length)];
function randomLook(sex){
  sex = sex || (Math.random()<.5?'m':'f');
  const skin=rpick(SKINS); let hair=rpick(HAIRS);
  let style, beard=false;
  if(sex==='m'){ style=rpick(['short','short','short','buzz','buzz','bald','long']); beard=Math.random()<.35; }
  else style=rpick(['long','long','ponytail','braid']);      // women always have long hair
  if(style==='bald') beard = beard || Math.random()<.3;
  const top=rpick(sex==='m'?TOPS_M:TOPS_F);
  return { sex, skin, hair, style, beard, jacket:top, jacketD:darkHex(top), pants:rpick(PANTS), boot:'#1c1714' };
}
function raiderLook(){ const l=randomLook(); const top=rpick(['#3b3a32','#4a3b2c','#38433a','#2e2e2e','#4a2e2e']); l.jacket=top; l.jacketD=darkHex(top); l.mask=rpick(['#7a2620','#2d2d2d','#3a4a2a']); return l; }
const FLASH_LOOK={sex:'m',skin:'#fff',hair:'#f4f4f4',style:'short',jacket:'#fff',jacketD:'#e8e8e8',pants:'#fff',boot:'#ddd'};
// wearable gear: armour = share of incoming damage it stops
const WEAR = {
  helmet_bike: { slot:'head', armor:.08, col:'#3a6a9a', name:'Bike Helmet' },
  hardhat:     { slot:'head', armor:.10, col:'#d8b030', name:'Hard Hat' },
  fire_helmet: { slot:'head', armor:.15, col:'#b02a20', name:'Firefighter Helmet' },
  mil_helmet:  { slot:'head', armor:.22, col:'#4a5a3a', name:'Military Helmet' },
  vest_light:  { slot:'body', armor:.22, col:'#36404c', name:'Ballistic Vest' },
  vest_heavy:  { slot:'body', armor:.38, col:'#3a3e2e', name:'Plate Carrier' },
  nasal:       { slot:'head', armor:.2, col:'#8a8e96', name:'Elmo Nasal' },
  crown:       { slot:'head', armor:0, col:'#d8b040', name:'Coroa' },
  mail:        { slot:'body', armor:.3, col:'#7a1a14', name:'Cota e Tabardo' },
};
function armorOf(e){ return Math.min(.65,(e&&e.head?WEAR[e.head].armor:0)+(e&&e.body?WEAR[e.body].armor:0)); }

function drawWeapon(g,x,y,id,ang){
  const Wp=WEAPONS[id]; if(!Wp || !Wp.len) return;
  const c=Math.cos(ang), s=Math.sin(ang);
  const hx=x+Math.round(c*4), hy=y-9+Math.round(s*3);
  for(let i=0;i<=Wp.len;i++){
    const px=Math.round(hx+c*i), py=Math.round(hy+s*i);
    g.fillStyle = (i<2 && !Wp.ranged && id!=='knife') ? '#3b2a1c' : (Wp.ranged && i<Wp.len-3 && id!=='pistol') ? '#5a3e28' : Wp.col;
    const thick = ((id==='bat'||id==='spiked_bat') && i>Wp.len-4) || Wp.ranged;
    g.fillRect(px,py,thick?2:1,thick?2:1);
  }
  if(id==='fire_axe'){ const ex=Math.round(hx+c*Wp.len), ey=Math.round(hy+s*Wp.len); g.fillStyle='#b8bcc0'; g.fillRect(ex-1+Math.round(-s*2),ey-1+Math.round(c*2),3,3); g.fillStyle='#c8302a'; g.fillRect(ex-1,ey-1,2,2); }
}
function drawHelmet(g,x,y,id,f){
  if(!id) return; const W_=WEAR[id], c=W_.col, d=darkHex(c,.7), P=(a,b,w,h,col)=>{g.fillStyle=col;g.fillRect(x+a,y+b,w,h);};
  P(-4,-23,8,3,c); P(-3,-24,6,1,c); P(-3,-23,6,1,darkHex(c,1.2>1?1:1));
  if(id==='hardhat'){ P(-5,-20,10,1,d); P(-1,-24,2,4,darkHex(c,.85)); }
  if(id==='fire_helmet'){ P(-5,-20,10,1,d); if(f==='down'){ P(-2,-23,4,3,'#e0c060'); } else if(f==='up') P(-5,-20,10,2,d); }
  if(id==='mil_helmet'){ P(-4,-20,8,1,d); P(-2,-23,1,1,d); P(1,-22,1,1,d); }
  if(id==='nasal'){ P(-4,-20,8,1,d); P(-1,-20,2,4,d); }
  if(id==='crown'){ P(-4,-24,1,2,c); P(-1,-25,2,2,c); P(3,-24,1,2,c); P(0,-23,1,1,'#c83a2a'); }
  if(id==='helmet_bike'){ P(-2,-24,1,2,'#2a4a6a'); P(1,-24,1,2,'#2a4a6a'); }
}
function drawVest(g,x,y,id,f,side){
  if(!id) return; const c=WEAR[id].col, d=darkHex(c,.75), P=(a,b,w,h,col)=>{g.fillStyle=col;g.fillRect(x+a,y+b,w,h);};
  if(side){ P(-3,-14,7,7,c); P(-3,-14,7,1,d); if(id==='vest_heavy'){ P(-3,-11,7,2,d); P(f==='left'?-4:3,-13,1,5,d); } return; }
  if(id==='vest_heavy'){ P(-5,-14,10,7,c); P(-6,-14,1,3,c); P(5,-14,1,3,c); P(-4,-10,2,2,d); P(-1,-10,2,2,d); P(2,-10,2,2,d); P(-5,-14,10,1,d); }
  else { P(-4,-14,8,7,c); P(-4,-14,1,7,d); P(3,-14,1,7,d); if(f==='down') P(-1,-12,2,1,'#c8c8c0'); }
}
// h: {face, phase, moving, look, flash, weapon, wAng, lantern, head, body}
function drawHuman(g,x,y,h){
  const L = h.flash ? FLASH_LOOK : h.look, f=h.face, st = h.moving ? Math.round(Math.sin(h.phase)*1.6) : 0;
  const {skin,hair,jacket,jacketD,pants,boot,mask}=L, fem=L.sex==='f', style=L.style||'short';
  const longH = style==='long'||style==='braid', P=(a,b,w,hh,c)=>{g.fillStyle=c;g.fillRect(x+a,y+b,w,hh);};
  if(f==='up') drawWeapon(g,x,y,h.weapon,h.wAng);
  if(f==='left'||f==='right'){
    const m = f==='left'?-1:1;
    P(-2,-6+Math.max(0,st),3,6-Math.max(0,st),pants); P(0,-6+Math.max(0,-st),3,6-Math.max(0,-st),darkHex(pants,.8));
    P(-2+st,-1,4,1,boot); P(-st,-1,4,1,boot);
    if(fem){ P(-3,-14,6,8,jacket); P(-3,-7,6,1,jacketD); P(m<0?2:-3,-9,1,2,jacket); } else { P(-3,-14,7,8,jacket); P(-3,-7,7,1,jacketD); }
    drawVest(g,x,y,h.body,f,true);
    P(-1+st*m*0.5,-13,2,6,jacketD); P(-1+st*m*0.5,-7,2,1,skin);
    P(-3,-20,6,6,skin);
    const back = m<0 ? 1 : -3;
    if(style==='buzz') P(-3,-21,6,1,hair);
    else if(style!=='bald'){ P(-3,-21,6,2,hair); P(back,-20,2,3,hair);
      if(longH) P(m<0?1:-4,-19,3,7,hair);
      if(style==='ponytail') P(m<0?3:-5,-19,2,6,hair); }
    P(m<0?-3:2,-18,1,1,'#1a1412');
    if(L.beard) P(m<0?-3:-1,-16,4,2,hair);
    if(mask) P(m<0?-3:0,-16,3,2,mask);
    drawHelmet(g,x,y,h.head,f);
    if(h.lantern){ P(m*4-1,-10,3,4,'#7a5a24'); P(m*4,-9,1,2,'#ffe08a'); }
  } else {
    P(-4,-6+(st>0?st:0),3,6-(st>0?st:0),pants); P(1,-6+(st<0?-st:0),3,6-(st<0?-st:0),pants);
    P(-4,-1,3,1,boot); P(1,-1,3,1,boot);
    const ax = fem ? 4 : 5;
    if(fem){ P(-4,-14,8,8,jacket); P(-3,-10,6,1,jacketD); P(-4,-7,8,1,jacketD); } else { P(-5,-14,10,8,jacket); P(-5,-7,10,1,jacketD); }
    drawVest(g,x,y,h.body,f,false);
    P(-ax-2,-13+(st>0?1:0),2,6,jacketD); P(ax,-13+(st<0?1:0),2,6,jacketD);
    P(-ax-2,-7+(st>0?1:0),2,1,skin); P(ax,-7+(st<0?1:0),2,1,skin);
    P(-3,-20,6,6,skin);
    if(f==='down'){
      if(style==='buzz') P(-3,-21,6,1,hair);
      else if(style==='bald') P(-1,-21,2,1,darkHex(skin,1.12>1?1:1));
      else { P(-3,-21,6,2,hair); P(-3,-20,1,1,hair); P(2,-20,1,1,hair); if(longH||style==='ponytail'){ P(-4,-20,1,longH?8:4,hair); P(3,-20,1,longH?8:4,hair); } }
      P(-2,-17,1,1,'#1a1412'); P(1,-17,1,1,'#1a1412');
      if(fem) P(-1,-15,2,1,'#9a4a4a'); else P(-1,-15,2,1,darkHex(skin,.8));
      if(L.beard){ P(-3,-16,6,2,hair); P(-2,-15,4,1,hair); }
      if(mask) P(-3,-16,6,2,mask);
    } else {
      if(style==='bald') P(-3,-21,6,5,darkHex(skin,.9));
      else if(style==='buzz') P(-3,-21,6,5,darkHex(hair,1));
      else { P(-3,-21,6,5,hair); if(longH) P(-3,-16,6,4,hair); if(style==='ponytail') P(-1,-16,2,5,hair); }
      P(-1,-14,2,1,jacketD);
    }
    drawHelmet(g,x,y,h.head,f);
    if(h.lantern){ P(5,-8,3,4,'#7a5a24'); P(6,-7,1,2,'#ffe08a'); }
  }
  if(f!=='up') drawWeapon(g,x,y,h.weapon,h.wAng);
}
function drawPlayer(g,x,y){
  const p=player; let a;
  if(p.swing){ const s=p.swing; a = s.ang - s.arc/2 + s.arc*Math.min(1,s.t/s.dur); }
  else if(aiming || attackHeld || p.atkCd>0) a=p.aimAng;
  else a=FACE_ANG[p.face] + (WEAPONS[p.weapon].ranged ? 0.5 : 0.9);
  drawHuman(g,x,y,{face:p.face,phase:p.phase,moving:p.moving,look:p.look,flash:p.hurtT>.25,
    lantern:p.lanternOn&&hasItem('lantern'),weapon:p.weapon,wAng:a,head:p.equip.head,body:p.equip.body});
}
function drawRaider(g,r,x,y){
  let a;
  if(r.wind>0) a=r.aimAng-1.3;
  else if(r.swingT>0) a=r.aimAng-1.3+2.6*(1-r.swingT/.2);
  else a=FACE_ANG[r.face]+0.9;
  drawHuman(g,x,y,{face:r.face,phase:r.phase,moving:r.moving,look:r.look,flash:r.hurtT>0,weapon:r.weapon,wAng:a,head:r.equip.head,body:r.equip.body});
  if(r.hp<r.max){ g.fillStyle='#000'; g.fillRect(x-6,y-28,12,3); g.fillStyle='#b8433a'; g.fillRect(x-5,y-27,Math.max(0,Math.round(10*r.hp/r.max)),1); }
  if(r.alertT>0 || r.wind>0){ g.fillStyle = r.wind>0 ? '#ff5a3a' : '#ffd25a'; g.fillRect(x,y-35,1,4); g.fillRect(x,y-30,1,1); }
}
function drawShadow(g,x,y,rx,ry,a=.3){ g.fillStyle=`rgba(0,0,0,${a})`; g.beginPath(); g.ellipse(x,y,rx,ry,0,0,Math.PI*2); g.fill(); }

function drawObj(g,o,sx,sy,now){
  const P=(a,b,w,h,c)=>{g.fillStyle=c;g.fillRect(sx+a,sy+b,w,h);};
  switch(o.type){
    case 'tree': {
      let a=1;
      if(player.y<o.sortY && Math.abs(player.x-(o.x*T+8))<17 && player.y>o.y*T-30) a=0.45;
      g.globalAlpha=a; g.drawImage(treeSprites[o.v], sx+8-18, sy+14-44); g.globalAlpha=1; break; }
    case 'body': {
      const pl=o.pal, Q=(a,b,w,h,c)=>P(o.dir>0?a:16-a-w,b,w,h,c);
      Q(2,10,13,4,'rgba(70,10,8,.55)');
      Q(1,7,4,4,pl.skin); if(pl.style!=='bald') Q(1,7,2,4,pl.hair); if(pl.style==='long'||pl.style==='braid'||pl.style==='ponytail') Q(0,6,2,7,pl.hair); if(pl.mask) Q(3,9,2,2,pl.mask);
      Q(5,6,6,6,pl.jacket); Q(6,11,4,1,pl.jacketD); Q(11,7,4,4,pl.pants); Q(15,7,1,4,pl.boot);
      break; }
    case 'firetruck': {
      P(0,-4,32,82,'#a8221a'); P(0,-4,32,3,'#c83a2a'); P(2,58,28,18,'#8a1a14'); P(4,62,24,8,'#1c242c'); P(5,63,6,2,'#3a4a58');
      for(let k=0;k<6;k++) P(6,2+k*9,20,1,'#b8bcc0'); P(6,2,1,50,'#b8bcc0'); P(25,2,1,50,'#b8bcc0');
      P(3,76,6,4,'#e8d070'); P(23,76,6,4,'#e8d070'); P(12,57,8,2,(Math.floor(now/400)%2&&isPowered(o))?'#ff4a3a':'#5a1a14');
      P(-1,10,2,8,'#151515'); P(31,10,2,8,'#151515'); P(-1,50,2,8,'#151515'); P(31,50,2,8,'#151515');
      if(o.searched) P(26,64,4,10,'#1a1410');
      break; }
    case 'fountain': P(0,6,32,24,'#6a665e'); P(0,6,32,2,'#86827a'); P(3,9,26,18,'#22364a'); P(5,11,8,1,'#4a6a82'); P(13,-6,6,20,'#7a766e'); P(11,-8,10,3,'#86827a'); { const f=Math.floor(now/150)%3; P(15,-12-f,2,4,'#8ab0d0'); } break;
    case 'fountainOld':
      P(0,0,32,30,'#6a6a64'); P(0,0,32,2,'#8a8a84'); P(3,3,26,24,'#2e4e66'); P(5,5,22,4,'#3e6a88'); P(13,8,6,14,'#7a7a74'); P(14,5,4,4,'#9a9a94');
      if(Math.floor(now/300)%2) P(10,12,2,1,'#8ab0c8'); else P(20,16,2,1,'#8ab0c8');
      break;
    case 'shipping': {
      const c=o.c||'#8a3a2a';
      P(0,-6,32,20,c); P(0,-6,32,2,shade(c,1.25)); for(let k=2;k<32;k+=3) P(k,-3,1,16,shade(c,.75)); P(0,13,32,1,shade(c,.55));
      P(28,-2,2,12,shade(c,.6)); if(o.searched) P(29,-2,3,12,'#111');
      break; }
    case 'boat': {
      const c=o.c; P(2,0,12,44,c); P(3,-2,10,3,c); P(5,-4,6,2,c); P(2,0,1,44,shade(c,.7)); P(13,0,1,44,shade(c,.7));
      P(4,6,8,14,'#5a4630'); P(5,8,6,8,'#2a3a4a'); P(4,26,8,14,'#6a5238'); P(2,44,12,2,'#2a2a2a');
      if(o.searched) P(6,28,4,6,'#1a1410');
      break; }
    case 'storage':
      P(1,0,14,14,'#7a5a34'); P(1,0,14,3,'#8f6b40'); P(1,6,14,1,'#5a4224'); P(6,4,4,3,'#a8a8a0'); P(7,5,2,1,'#3a3a3a'); P(1,13,14,1,'#4e381f');
      break;
    case 'lamp': { const on=isPowered(o);
      P(7,2,2,11,'#3a3a3a'); P(5,12,6,2,'#2a2a2a'); P(3,-4,10,6,on?'#f0d890':'#8a7a5a'); P(4,-5,8,1,on?'#fff2c0':'#a08e6a'); if(on) P(6,2,4,1,'#ffe8a0');
      break; }
    case 'generator': {
      const j = o.on ? Math.round(Math.sin(now*0.08)) : 0;
      P(1,1+j,14,12,'#c8a030'); P(1,1+j,14,2,'#e0b840'); P(3,4+j,7,6,'#3a3a3a'); P(4,5+j,5,1,'#5a5a5a'); P(4,7+j,5,1,'#5a5a5a');
      P(11,-3+j,2,5,'#2a2a2a'); P(12,4+j,2,2,o.on?'#5aff5a':'#5a2a2a'); P(1,13,14,1,'#7a6020');
      if(o.on && Math.floor(now/120)%3===0){ g.fillStyle='rgba(120,120,120,.5)'; g.fillRect(sx+11,sy-7,3,3); }
      break; }
    case 'solar':
      P(0,6,16,6,'#2a2e33'); P(1,0,14,8,'#1e3a5a'); for(let k=0;k<4;k++) P(1+k*4,0,1,8,'#4a6a8a'); P(1,3,14,1,'#4a6a8a'); P(2,1,3,1,'#8ab0d0');
      P(3,12,2,2,'#3a3a3a'); P(11,12,2,2,'#3a3a3a');
      break;
    case 'battery': {
      P(2,1,12,13,'#3a4048'); P(2,1,12,2,'#5a6068'); P(4,-1,2,2,'#c8302a'); P(10,-1,2,2,'#2a2a2a');
      const c=Math.round(8*(o.charge||0)/100); P(4,5,8,6,'#1a1e22'); P(4,11-Math.min(6,Math.round(6*(o.charge||0)/100)),8,Math.min(6,Math.round(6*(o.charge||0)/100)),(o.charge||0)>25?'#5ad05a':'#d0a03a');
      break; }
    case 'cabinet':
      P(1,-3,14,4,'#43301f'); P(1,1,14,13,'#5f432b'); P(1,1,14,1,'#76553a');
      P(2,5,12,1,'#3a281a'); P(2,9,12,1,'#3a281a'); P(7,3,2,1,'#b0904f'); P(7,7,2,1,'#b0904f'); P(7,11,2,1,'#b0904f');
      if(o.searched){ P(2,10,12,4,'#2a1d13'); P(2,13,12,2,'#6b4c30'); }
      break;
    case 'dresser':
      P(1,-2,14,3,'#4a2f22'); P(1,1,14,13,'#6a4030'); P(2,4,5,4,'#5a3424'); P(9,4,5,4,'#5a3424'); P(2,9,12,4,'#5a3424');
      P(4,6,1,1,'#c8a050'); P(11,6,1,1,'#c8a050'); P(7,11,2,1,'#c8a050'); P(10,-4,4,2,'#8a6a4a');
      if(o.searched){ P(2,9,12,4,'#2a1a12'); }
      break;
    case 'fridge':
      P(2,-8,12,3,'#8f8e86'); P(2,-5,12,19,'#b4b2a7'); P(2,1,12,1,'#7f7e77'); P(11,-3,1,3,'#5d5c57'); P(11,3,1,6,'#5d5c57');
      P(3,9,2,2,'#8a5a3a'); if(o.searched) P(2,2,3,12,'#1f1d1b'); if(isPowered(o)) P(4,-3,1,1,'#5aff5a');
      break;
    case 'crate':
      P(1,-2,14,3,'#8a663c'); P(1,1,14,13,'#735331'); P(1,1,14,1,'#8f6b40'); P(1,13,14,1,'#4e381f');
      for(let i=0;i<11;i++){ P(2+i,2+i,1,1,'#55401f'); P(13-i,2+i,1,1,'#55401f'); }
      if(o.searched) P(1,-2,14,3,'#2b2014');
      break;
    case 'trash':
      P(4,1,8,12,'#4c5256'); P(6,2,1,11,'#3b4043'); P(9,2,1,11,'#3b4043'); P(4,12,8,1,'#2c3033');
      if(o.searched){ P(10,11,6,2,'#5f666a'); P(4,0,8,2,'#1d1f20'); } else { P(3,-1,10,3,'#636a6e'); P(7,-2,2,1,'#636a6e'); }
      break;
    case 'dumpster':
      P(1,-2,30,4,'#2f4a36'); P(1,2,30,12,'#3a5a42'); P(1,2,30,1,'#4a6e52'); P(3,13,3,2,'#151515'); P(26,13,3,2,'#151515');
      P(6,5,8,1,'#2a3e30'); P(18,5,8,1,'#2a3e30'); if(o.searched) P(2,-2,13,3,'#1a2a1e');
      break;
    case 'bed':
      P(1,-2,14,31,'#4a3423'); P(2,4,12,23,'#6f6a5e'); P(2,4,12,1,'#8a8476'); P(3,0,10,4,'#aaa391'); P(2,16,12,2,'#5c5850'); P(5,9,4,2,'#5a5248');
      break;
    case 'hbed':
      P(1,-1,14,30,'#8a9096'); P(2,3,12,24,'#d8d6ce'); P(3,0,10,4,'#f0eee6'); P(2,14,12,1,'#b8b6ae'); P(1,28,2,2,'#333'); P(13,28,2,2,'#333');
      break;
    case 'sofa':
      P(1,-2,30,6,'#5a4232'); P(1,4,30,9,'#6b503c'); P(1,4,4,9,'#5a4232'); P(27,4,4,9,'#5a4232'); P(6,6,9,6,'#7a5c46'); P(16,6,10,6,'#7a5c46');
      break;
    case 'tv':
      P(2,6,12,8,'#3a2a1e'); P(3,-2,10,8,'#111');
      if(isPowered(o)){ const f=Math.floor(now/180)%4; P(4,-1,8,6,['#5a8ab0','#6a9ac0','#4a7aa0','#7aaad0'][f]); P(5,0,3,2,'#c8e0f0'); }
      else { P(4,-1,8,6,'#1d2228'); P(5,0,2,1,'#3a4450'); }
      break;
    case 'table':
      P(1,1,14,9,'#5c4230'); P(1,1,14,1,'#6f523b'); P(2,10,2,4,'#3b291b'); P(12,10,2,4,'#3b291b'); P(6,3,2,2,'#c9c2b4'); P(9,4,3,2,'#5a6a74');
      break;
    case 'desk':
      P(1,0,30,10,'#5a3e2a'); P(1,0,30,1,'#6e4e36'); P(2,10,3,4,'#3b291b'); P(27,10,3,4,'#3b291b'); P(20,2,7,5,'#d8d2c4'); P(5,2,6,4,'#2a2e33'); P(6,-2,5,4,'#222'); P(7,-1,3,2,isPowered(o)?'#7ac0e8':'#2a3038');
      if(o.searched) P(12,7,8,4,'#2a1d13');
      break;
    case 'counter':
      P(0,-2,16,4,'#7a6a58'); P(0,2,16,12,'#5d5040'); P(0,2,16,1,'#6e604e');
      if(o.container){ P(4,-6,8,5,'#3a3d40'); P(5,-5,6,2,isPowered(o)?'#6ad06a':'#1e2a1e'); if(o.searched) P(5,-2,6,1,'#c8a050'); }
      break;
    case 'shelf': {
      P(1,-6,14,3,'#5a5e62'); P(1,-3,14,17,'#44484c'); P(1,3,14,1,'#5a5e62'); P(1,9,14,1,'#5a5e62');
      const kc = {food:['#b04a3a','#d8a630','#4a7ab0','#5aa060','#e0d0a0'], med:['#e8e6e0','#c33','#7aa0c4'], junk:['#555','#777','#3a3a3a'],
        sports:['#9a7448','#c8c8c8','#b03a3a'], guns:['#2b2d2f','#4a3a2a'], box:['#8a663c','#735331'], books:['#7a3a3a','#3a5a7a','#5a7a3a','#7a6a3a','#5a3a6a']}[o.kind] || ['#8a663c','#735331'];
      const n = o.searched ? 2 : 7;
      for(let k=0;k<n;k++){ g.fillStyle=kc[Math.floor(th(o.x,o.y,k)*kc.length)]; g.fillRect(sx+2+Math.floor(th(o.x,o.y,k+9)*11), sy+(k%3===0?-2:k%3===1?4:10)-1, 2, 3); }
      break; }
    case 'rack':
      if(o.kind==='guns'){ P(1,-4,14,18,'#3a2e24'); P(1,-4,14,1,'#4a3a2e'); for(let k=0;k<4;k++){ P(3+k*3,-2,1,13,o.searched&&k>0?'#3a2e24':'#1e1f20'); P(3+k*3,8,2,3,o.searched&&k>0?'#3a2e24':'#5a3e28'); } }
      else if(o.kind==='sports'){ P(1,-2,14,16,'#3e4246'); for(let k=0;k<3;k++) P(3+k*4,0,2,12,o.searched?'#3e4246':'#9a7448'); }
      else { P(1,-4,14,1,'#8a8e92'); P(1,-4,1,18,'#8a8e92'); P(14,-4,1,18,'#8a8e92'); const cs=['#7a3a3a','#3a5a7a','#5a7a3a','#7a6a3a','#4a3a5a'];
        for(let k=0;k<5;k++) P(2+k*2+ (k>2?1:0),-3,2,11,cs[(o.x+k)%cs.length]); }
      break;
    case 'display':
      P(1,0,14,13,'#5a5e62'); P(2,1,12,7,'#8fb0c0'); P(2,1,12,1,'#c8dce6');
      if(!o.searched){ P(4,5,2,2,'#e8c050'); P(8,4,2,2,'#e8c050'); P(11,5,1,2,'#8ad8f0'); }
      P(1,8,14,5,'#44484c');
      break;
    case 'locker':
      P(2,-7,12,21,'#4a5866'); P(2,-7,12,1,'#5a6a7a'); P(7,-7,1,21,'#34404c'); for(let k=0;k<3;k++){ P(3,-5+k*2,3,1,'#34404c'); P(9,-5+k*2,3,1,'#34404c'); }
      P(5,3,1,2,'#b0b4b8'); P(9,3,1,2,'#b0b4b8'); if(o.searched) P(8,-6,5,19,'#1a1e22');
      break;
    case 'safe':
      P(2,0,12,14,'#3a3c3e'); P(2,0,12,1,'#5a5c5e'); P(6,4,4,4,'#6a6c6e'); P(7,5,2,2,'#2a2a2a'); P(11,6,1,3,'#8a8c8e');
      if(o.searched) P(3,1,10,12,'#151617');
      break;
    case 'gunsafe':
      P(2,-8,12,22,'#2f3a2f'); P(2,-8,12,1,'#45524a'); P(6,0,4,4,'#6a6c6e'); P(11,-2,1,6,'#8a8c8e'); if(o.searched) P(3,-7,10,20,'#121612');
      break;
    case 'toilet':
      P(4,0,8,5,'#d8d6ce'); P(5,5,6,7,'#e8e6de'); P(6,6,4,4,'#b8c8d0');
      break;
    case 'pew':
      P(0,2,32,8,'#5a3f28'); P(0,0,32,3,'#4a3220'); P(2,10,2,4,'#3a2818'); P(28,10,2,4,'#3a2818');
      break;
    case 'altar':
      P(1,0,30,13,'#d8d2c4'); P(1,0,30,2,'#f0ece0'); P(14,-8,4,9,'#c8a050'); P(12,-6,8,2,'#c8a050'); P(4,3,24,1,'#a8302a');
      break;
    case 'bench':
      P(1,4,30,4,'#6a4a30'); P(1,0,30,3,'#5a3e28'); P(3,8,2,5,'#2a2a2a'); P(27,8,2,5,'#2a2a2a');
      break;
    case 'pump':
      P(3,-8,10,22,'#8a2a22'); P(3,-8,10,2,'#a83a30'); P(5,-5,6,4,'#1a1e22'); P(6,-4,2,1,'#5a8a5a'); P(13,-2,2,10,'#222'); P(4,10,8,4,'#5a1a14');
      break;
    case 'barrel': {
      P(3,2,10,12,'#6a3b24'); P(3,1,10,2,'#2a1a12'); P(3,5,10,1,'#4a281a'); P(3,10,10,1,'#4a281a'); P(4,3,1,10,'#7d4a2e');
      const cols=['#ffe08a','#ffa340','#e0552a','#b8361f'];
      for(let i=0;i<9;i++){ const fx=4+((i*3+Math.floor(now/70))%8), fh=Math.floor(th(i,Math.floor(now/90),3)*7);
        P(fx,1-fh,2,fh+1,cols[Math.min(3,Math.floor(fh/2))]); }
      break; }
    case 'anvil': P(4,11,8,4,'#5a3e28'); P(4,11,8,1,'#6e4e34'); P(6,8,4,4,'#2a2c30'); P(2,4,12,4,'#3c3e44'); P(2,4,12,1,'#6a6e76'); P(13,5,3,2,'#3c3e44'); P(0,5,2,2,'#2a2c30'); P(5,2,6,1,'#4a3020'); P(10,1,3,3,'#55575c'); break;
    case 'hearth': { const fg=o.kind==='forge';
      if(fg){ P(0,-10,32,42,'#4c4842'); P(0,-10,32,2,'#68645c'); for(let r=0;r<6;r++) P(0,-6+r*7,32,1,'#38352f'); P(4,-22,24,14,'#3c3833'); P(8,-30,16,10,'#46423c');
        P(5,2,22,14,'#1a1210'); for(let i=0;i<14;i++){ const fl=Math.floor(th(i,Math.floor(now/110),5)*6); P(6+((i*3)%20),14-fl,2,fl+1,['#ffe08a','#ffa340','#e0552a','#b8361f'][Math.min(3,fl>>1)]); }
        P(6,14,20,2,'#ff7a2a'); P(28,16,4,10,'#5a3e28'); }
      else { P(0,-8,16,22,'#55504a'); P(0,-8,16,2,'#6e6860'); P(3,2,10,10,'#1a1210'); for(let i=0;i<5;i++){ const fl=Math.floor(th(i,Math.floor(now/120),6)*5); P(4+i*2,11-fl,2,fl+1,['#ffe08a','#ffa340','#e0552a','#b8361f'][Math.min(3,fl>>1)]); } P(1,12,14,2,'#3a3530'); }
      break; }
    case 'tub': P(2,3,12,10,'#5e4028'); P(2,3,12,1,'#7a5434'); P(3,4,10,6,'#22364a'); P(4,5,4,1,'#4a6a82'); P(2,7,12,1,'#3a3c40'); P(2,11,12,1,'#3a3c40'); break;
    case 'wrack': P(1,-8,14,2,'#4a3420'); P(1,-8,1,22,'#4a3420'); P(14,-8,1,22,'#4a3420'); P(1,10,14,2,'#4a3420');
      if(o.kind==='bows'){ for(let k=0;k<3;k++){ P(3+k*4,-6,1,16,'#7a5430'); P(4+k*4,-5,1,14,'#d8d0b0'); } }
      else for(let k=0;k<4;k++){ const sw=(o.x+k)%3; P(3+k*3,-6,1,13,sw===1?'#8a6a44':'#b8bcc4'); P(2+k*3,4,3,1,'#5a4a3a'); if(sw===2) P(3+k*3,-6,3,3,'#9aa0a8'); if(o.searched&&k) P(3+k*3,-6,1,13,'#4a3420'); }
      break;
    case 'keg': P(2,1,12,13,'#6e4a2c'); P(2,1,12,2,'#3e2a1a'); P(2,4,12,1,'#3a3c40'); P(2,10,12,1,'#3a3c40'); P(3,2,1,11,'#86603a'); P(7,7,2,2,'#2a1a10'); break;
    case 'hay': P(1,2,14,12,'#b8963c'); P(1,2,14,2,'#d8b85a'); for(let k=0;k<6;k++) P(2+k*2,4,1,9,'#9a7a2c'); P(1,7,14,1,'#6a4a2a'); break;
    case 'logs': for(let r=0;r<2;r++) for(let k=0;k<3-r;k++){ P(1+k*5+r*2,8-r*5,5,5,'#6a4a2c'); P(2+k*5+r*2,9-r*5,3,3,'#b08a5a'); P(3+k*5+r*2,10-r*5,1,1,'#7a5434'); } break;
    case 'statue': P(2,6,12,8,'#6a665e'); P(2,6,12,1,'#86827a'); P(5,-14,6,20,'#8a867e'); P(4,-18,8,6,'#8a867e'); P(6,-20,4,3,'#9a968e'); P(3,-10,2,8,'#7a766e'); P(11,-10,2,8,'#7a766e'); P(12,-16,1,14,'#5a564e'); break;
    case 'banner': P(7,-22,2,36,'#4a3420'); P(9,-20,6,16,'#7a1a14'); P(9,-20,6,1,'#9a2a1e'); P(11,-16,2,4,'#d8b040'); P(9,-5,2,2,'#7a1a14'); P(13,-5,2,2,'#7a1a14'); P(6,-23,4,2,'#c8a040'); break;
    case 'pillar': P(2,8,12,6,'#5a564e'); P(4,-22,8,30,'#7a766e'); P(4,-22,2,30,'#8e8a82'); P(10,-22,2,30,'#5e5a52'); P(2,-24,12,3,'#6a665e'); break;
    case 'throne': P(1,6,14,8,'#5a564e'); P(3,-14,10,22,'#b8902c'); P(4,-12,8,14,'#7a1a14'); P(2,0,12,6,'#b8902c'); P(3,1,10,4,'#9a1e18'); P(5,-17,2,3,'#d8b040'); P(9,-17,2,3,'#d8b040'); P(7,-18,2,4,'#e8c860'); break;
    case 'brazier': P(5,8,6,6,'#2a2c30'); P(3,3,10,5,'#3c3e44'); for(let i=0;i<4;i++){ const fl=Math.floor(th(i,Math.floor(now/100),7)*6); P(4+i*2,3-fl,2,fl+1,['#ffe08a','#ffa340','#e0552a'][Math.min(2,fl>>1)]); } break;
    case 'chest': P(1,3,14,11,'#6a4428'); P(1,3,14,4,'#7e5634'); P(1,7,14,1,'#3a2414'); P(1,3,1,11,'#3a3c40'); P(14,3,1,11,'#3a3c40'); P(7,7,2,3,'#c8a040'); if(o.searched) P(2,4,12,3,'#2a1a10'); break;
    case 'cauldron': P(2,4,12,10,'#22242a'); P(1,3,14,2,'#3a3c44'); P(3,4,10,2,'#3a8a3a'); { const bb=Math.floor(now/250)%3; P(4+bb*3,3,2,1,'#7ad07a'); } P(3,14,2,1,'#1a1a1a'); P(11,14,2,1,'#1a1a1a'); break;
    case 'orb': P(1,1,14,9,'#4a3020'); P(1,1,14,1,'#5e3e2a'); P(2,10,2,4,'#3a2414'); P(12,10,2,4,'#3a2414'); P(5,-4,6,6,'#3a6ad0'); P(6,-3,2,2,'#a8c8ff'); P(6,1,4,1,'#c8a040'); break;
    case 'candle': P(7,6,2,8,'#c8a040'); P(5,13,6,1,'#c8a040'); P(7,2,2,4,'#e8e0c8'); P(7,0,2,2,'#ffd060'); break;
    case 'workbench': P(0,1,16,8,'#7a5634'); P(0,1,16,1,'#946c44'); P(1,9,2,5,'#4a3420'); P(13,9,2,5,'#4a3420'); P(3,3,6,1,'#9aa0a8'); P(10,2,2,4,'#5a3e28'); P(11,2,3,1,'#55575c'); break;
    case 'hooks': P(1,-8,14,2,'#3a3c40'); for(let k=0;k<3;k++){ P(3+k*4,-6,1,3,'#55575c'); P(2+k*4,-3,3,9,'#9a3a30'); P(2+k*4,-3,3,1,'#c86a5a'); } P(1,10,14,4,'#5a3e28'); break;
    case 'loom': P(1,-8,2,22,'#6a4a2c'); P(13,-8,2,22,'#6a4a2c'); P(1,-8,14,2,'#6a4a2c'); for(let k=0;k<6;k++) P(3+k*2,-6,1,14,['#8a2a2a','#2a4a7a','#d8c8a0'][k%3]); P(1,8,14,2,'#6a4a2c'); break;
    case 'carcass': drawCarcass(g,o,sx,sy); break;
    case 'tower': drawTower(g,o,sx,sy,now); break;
    case 'stall': P(0,-2,16,14,'#6a4a2c'); P(0,-2,16,2,'#8a6a44'); P(-1,-12,18,4,'#b8302a'); P(-1,-12,18,1,'#d8504a'); for(let k=0;k<18;k+=4) P(-1+k,-8,2,2,'#e8dcc8'); P(1,-8,1,7,'#4a3420'); P(14,-8,1,7,'#4a3420'); P(3,0,3,3,'#c8a030'); P(8,1,4,2,'#5a8ab0'); break;
    case 'car': {
      const spr=vehSprite(o.kind||'sedan', o.c, true, o.x*7+o.y);
      g.save(); g.translate(sx+o.w*8, sy+o.h*8);
      if(!o.vert) g.rotate(o.flip?Math.PI/2:-Math.PI/2); else if(o.flip) g.rotate(Math.PI);
      g.drawImage(spr,-spr.width/2,-spr.height/2); g.restore();
      if(o.searched){ g.fillStyle='rgba(0,0,0,.35)'; g.fillRect(sx+o.w*8-2,sy+o.h*8-2,4,4); }
      break; }
    default: drawDecor(g,o,sx,sy,now);
  }
}
// doors hidden under the roof (north / side walls) get a visible porch marker, and businesses a storefront sign
function drawFacade(g,b,cx,cy){
  if(b.alpha<0.35) return; g.globalAlpha=Math.min(1,b.alpha*1.2);
  let doorXs=[];
  for(const [dx,dy] of b.doors){ const d=doors.get(idx(dx,dy)); if(!d) continue; const sx=dx*T-cx, sy=dy*T-cy-HW;
    if(dy===b.y){ // north wall: porch canopy + door on the roof edge
      doorXs.push(sx);
      g.fillStyle='rgba(0,0,0,.35)'; g.fillRect(sx-1,sy-5,T+2,9);
      g.fillStyle=MATS[b.mat].cap; g.fillRect(sx-1,sy-6,T+2,3);
      g.fillStyle = d.open ? '#141010' : '#6a4a2c'; g.fillRect(sx+3,sy-3,10,7);
      if(!d.open){ g.fillStyle='#4e3420'; g.fillRect(sx+7,sy-3,1,7); g.fillStyle='#c4a35e'; g.fillRect(sx+10,sy,1,1); }
      g.fillStyle='#5a4a3a'; g.fillRect(sx+4,sy-8,8,2); // mat
    } else if(dy!==b.y+b.h-1){ // side wall
      const left = dx===b.x, mx = left ? sx-3 : sx+T-3;
      g.fillStyle=MATS[b.mat].cap; g.fillRect(mx,sy+1,6,T-2);
      g.fillStyle = d.open ? '#141010' : '#6a4a2c'; g.fillRect(mx+1,sy+3,4,T-6);
    }
  }
  if(b.name){
    if(!b.signCv) b.signCv=makeSign(b);
    const sw=b.signCv.width, bx=b.x*T-cx, front=b.front;
    let x=Math.round(bx+(b.w*T-sw)/2), y;
    if(front==='N'){ y=b.y*T-cy-4-HW; for(const dx of doorXs) if(x<dx+T+2 && x+sw>dx-2){ x = dx+T/2 < bx+b.w*T/2 ? dx+T+3 : dx-sw-3; } x=Math.max(bx+1,Math.min(bx+b.w*T-sw-1,x)); y+=6; }
    else y=(b.y+b.h-1)*T-cy-12;
    g.fillStyle='rgba(0,0,0,.35)'; g.fillRect(x+1,y+1,sw,b.signCv.height);
    g.drawImage(b.signCv,x,y);
  }
  g.globalAlpha=1;
}
function drawDoor(g,d,sx,sy){
  if(d.gate){ drawGate(g,d,sx,sy); return; }
  const b=d.b>=0?buildings[d.b]:null; g.drawImage(doorSprite(b?b.mat:8, wallFlags(d.x,d.y), d.open), sx, sy-HW);
}
function drawDoorOld(g,d,sx,sy){
  const b=d.b>=0?buildings[d.b]:null, fr=MATS[b?b.mat:8].cap;
  const side = b ? (d.x===b.x || d.x===b.x+b.w-1) : !(isWallish(d.x-1,d.y)||isWallish(d.x+1,d.y)) && (isWallish(d.x,d.y-1)||isWallish(d.x,d.y+1));
  if(side){ // door in a side wall, seen from above
    if(d.open){ g.fillStyle='#6a4a2c'; g.fillRect(sx+3,sy,10,2); }
    else { g.fillStyle='#664629'; g.fillRect(sx+3,sy,10,T); g.fillStyle='#523822'; g.fillRect(sx+7,sy,1,T); }
    return;
  }
  if(d.open){ g.fillStyle='#1a1410'; g.fillRect(sx,sy+5,2,11); g.fillStyle='#6a4a2c'; g.fillRect(sx+1,sy+5,2,11); g.fillStyle=fr; g.fillRect(sx+T-2,sy+5,2,11); }
  else { g.fillStyle=fr; g.fillRect(sx,sy+5,T,11); g.fillStyle='#664629'; g.fillRect(sx+2,sy+5,12,11); g.fillStyle='#523822';
    g.fillRect(sx+5,sy+5,1,11); g.fillRect(sx+9,sy+5,1,11); g.fillStyle='#c4a35e'; g.fillRect(sx+11,sy+10,1,2); }
}

function render(now){
  const bw=buf.width, bh=buf.height, g=bctx;
  let cx=Math.round(cam.x-bw/2), cy=Math.round(cam.y-bh/2);
  if(shake>0 && OPTS.shake){ cx+=Math.round((Math.random()-.5)*shake*2); cy+=Math.round((Math.random()-.5)*shake*2); }
  cx=Math.max(0,Math.min(W*T-bw,cx)); cy=Math.max(0,Math.min(H*T-bh,cy));
  viewX=cx; viewY=cy;
  g.imageSmoothingEnabled=false;
  g.fillStyle='#000'; g.fillRect(0,0,bw,bh);
  // ground chunks
  const c0x=Math.floor(cx/(CH*T)), c1x=Math.floor((cx+bw)/(CH*T)), c0y=Math.floor(cy/(CH*T)), c1y=Math.floor((cy+bh)/(CH*T));
  for(let yy=c0y;yy<=c1y;yy++) for(let xx=c0x;xx<=c1x;xx++){ if(xx>=NCX||yy>=NCY) continue; g.drawImage(getChunk(yy*NCX+xx), xx*CH*T-cx, yy*CH*T-cy); }
  // drawables
  const list=[]; const M=48;
  const vis=visibleChunks(1), seenB=new Set();
  for(const ci of vis){
    for(const o of chunkObjs[ci]){ const sx=o.x*T-cx, sy=o.y*T-cy; if(sx>-M&&sx<bw+M&&sy>-M&&sy<bh+M) list.push({y:o.sortY,k:0,o,sx,sy}); }
    for(const d of chunkDoors[ci]){ const sx=d.x*T-cx, sy=d.y*T-cy; if(sx>-T&&sx<bw+T&&sy>-T&&sy<bh+HW+T) list.push({y:d.y*T+(d.gate?12:d.open?10:16),k:1,d,sx,sy}); }
    for(const b of chunkBlds[ci]){ if(seenB.has(b)) continue; seenB.add(b);
      const sx=b.x*T-2-cx, sy=b.y*T-6-HW-cy;
      if(b.alpha>0.01 && sx<bw && sy<bh && sx+b.w*T+4>0 && sy+b.h*T+HW+6>0){ if(!b.roofCv) b.roofCv=makeRoof(b); const ry=(b.y+b.h-1)*T+16.5; list.push({y:ry,k:2,b,sx,sy}); list.push({y:ry+0.2,k:5,b}); } }
  }
  { const tx0=Math.floor(cx/T)-1, tx1=Math.floor((cx+bw)/T)+1, ty0=Math.floor(cy/T)-1, ty1=Math.floor((cy+bh+HW)/T)+1;
    for(let ty=Math.max(0,ty0);ty<=Math.min(H-1,ty1);ty++) for(let tx=Math.max(0,tx0);tx<=Math.min(W-1,tx1);tx++){
      const t=map[ty*W+tx]; if(t===TL.WALL||t===TL.WINDOW) list.push({y:ty*T+16,k:7,tx,ty}); } }
  if(!driving) list.push({y:player.onTower?player.y+20:player.y,k:3});
  for(const v of vehicles){ const sx=v.x-cx, sy=v.y-cy; if(sx>-60&&sx<bw+60&&sy>-60&&sy<bh+60) list.push({y:v.y+8,k:6,v,sx,sy}); }
  for(const n of npcs){ if(n.dead||!n.active) continue; const sx=Math.round(n.x-cx), sy=Math.round(n.y-cy); if(sx>-M&&sx<bw+M&&sy>-M-30&&sy<bh+M) list.push({y:n.state==='tower'?n.y+20:n.y,k:9,n,sx,sy}); }
  for(const a of animals){ const sx=Math.round(a.x-cx), sy=Math.round(a.y-cy); if(sx>-M&&sx<bw+M&&sy>-M&&sy<bh+M) list.push({y:a.y,k:8,a,sx,sy}); }
  for(const r of raiders){ const sx=Math.round(r.x-cx), sy=Math.round(r.y-cy); if(sx>-M&&sx<bw+M&&sy>-M&&sy<bh+M) list.push({y:r.y,k:4,r,sx,sy}); }
  for(const it of list){ if(it.k===0){ const o=it.o;
      if(o.type==='tree') drawShadow(g,it.sx+10,it.sy+13,13,4,.28);
      else if(o.type==='car'||o.type==='dumpster'||o.type==='shipping') drawShadow(g,it.sx+o.w*8+1,it.sy+o.h*T-1,o.w*8+1,3,.3);
      else if(o.type==='pump'||o.type==='barrel'||o.type==='trash'||o.type==='crate') drawShadow(g,it.sx+8,it.sy+14,6,2,.3); }
    else if(it.k===4) drawShadow(g,it.sx,it.sy,5,2,.35); }
  if(!driving) drawShadow(g,player.x-cx,player.y-cy,5,2,.35);
  if(aiming){
    const Wp=WEAPONS[player.weapon], ox=player.x-cx, oy=player.y-10-cy, a=player.aimAng;
    g.fillStyle='rgba(255,226,170,.55)';
    if(Wp.ranged){ const m=mouseWorld(), Lr=Math.min(Wp.range, Math.hypot(m.x-player.x,m.y-player.y+10)), sp=Wp.spread/mod('accuracy');
      for(let s=8;s<Lr;s+=3) g.fillRect(Math.round(ox+Math.cos(a)*s),Math.round(oy+Math.sin(a)*s),1,1);
      g.fillStyle='rgba(255,226,170,.22)';
      for(const e of [-sp,sp]) for(let s=10;s<Lr;s+=5) g.fillRect(Math.round(ox+Math.cos(a+e)*s),Math.round(oy+Math.sin(a+e)*s),1,1);
    } else { const Rr=Wp.range+4; for(let t=-Wp.arc/2;t<=Wp.arc/2;t+=0.09) g.fillRect(Math.round(ox+Math.cos(a+t)*Rr),Math.round(oy+4+Math.sin(a+t)*Rr*.8),1,1); }
  }
  list.sort((a,b)=>a.y-b.y);
  for(const it of list){
    if(it.k===0) drawObj(g,it.o,it.sx,it.sy,now);
    else if(it.k===1) drawDoor(g,it.d,it.sx,it.sy);
    else if(it.k===2){ g.globalAlpha=it.b.alpha; g.drawImage(it.b.roofCv,it.sx,it.sy); g.globalAlpha=1; }
    else if(it.k===4) drawRaider(g,it.r,it.sx,it.sy);
    else if(it.k===5) drawFacade(g,it.b,cx,cy);
    else if(it.k===6) drawVehicle(g,it.v,it.sx,it.sy);
    else if(it.k===9){ drawShadow(g,it.sx,it.sy,5,2,.35); drawNPC(g,it.n,it.sx,it.sy); }
    else if(it.k===8){ drawShadow(g,it.sx,it.sy,ANIMALS[it.a.kind].w/2,2,.3); drawAnimal(g,it.a,it.sx,it.sy); }
    else if(it.k===7){ const x=it.tx, y=it.ty, i=y*W+x, spr=wallSprite(mat[i], wallFlags(x,y), map[i]===TL.WINDOW, x+y);
      const px=x*T+8, behind = !driving && it.y>player.y && y*T-HW<player.y && Math.abs(px-player.x)<26;
      if(behind) g.globalAlpha=.32; g.drawImage(spr, x*T-cx, y*T-HW-cy); if(behind) g.globalAlpha=1; }
    else drawPlayer(g,Math.round(player.x-cx),Math.round(player.y-cy-(player.onTower?26:0)));
  }
  for(const p of particles){ g.fillStyle=p.col; g.fillRect(Math.round(p.x-cx),Math.round(p.y-p.z-cy),1,1); }
  for(const t of tracers){ g.strokeStyle=`rgba(255,230,150,${t.t/.07})`; g.lineWidth=1; g.beginPath(); g.moveTo(t.x1-cx,t.y1-cy); g.lineTo(t.x2-cx,t.y2-cy); g.stroke(); }
  if(typeof drawFX==="function") drawFX(g,cx,cy);
  if(player.flashT>0){ const a=player.aimAng; g.fillStyle='#ffe9a0'; g.fillRect(Math.round(player.x-cx+Math.cos(a)*9)-1,Math.round(player.y-10-cy+Math.sin(a)*6)-1,3,3); }
  if(ghost){
    const gx=ghost.gx*T-cx, gy=ghost.gy*T-cy, p=ghost.p;
    if(p.id!=='scrap'){
      g.globalAlpha=.55;
      if(p.tile){ const col=p.id==='floor'?'#6a4e32':'#7a5a3a'; g.fillStyle=col; g.fillRect(gx,gy,T,T);
        if(p.id==='wall'||p.id==='window'||p.id==='door'){ g.fillStyle='#2e2418'; g.fillRect(gx,gy,T,5); }
        if(p.id==='window'){ g.fillStyle='#38495a'; g.fillRect(gx+4,gy+7,8,6); }
        if(p.id==='door'){ g.fillStyle='#664629'; g.fillRect(gx+2,gy+5,12,11); } }
      else drawObj(g,{type:p.id,x:ghost.tx,y:ghost.ty,w:1,h:p.h||1,store:[],charge:50},gx,gy,now);
      g.globalAlpha=1;
    }
    g.strokeStyle=ghost.ok?'rgba(110,230,110,.95)':'rgba(240,80,60,.95)'; g.lineWidth=1;
    g.strokeRect(gx+.5,gy+.5,ghost.w*T-1,ghost.h*T-1);
  }

  g.fillStyle='rgba(18,22,30,.14)'; g.fillRect(0,0,bw,bh);
  const dusk = Math.max(0, 1-Math.abs(time-18.3)/1.6);
  if(dusk>0){ g.fillStyle=`rgba(230,110,40,${0.13*dusk})`; g.fillRect(0,0,bw,bh); }
  const dk=darkness(time);
  if(dk>0.01){
    const lights=[];
    for(const ci of vis) for(const o of chunkObjs[ci]) if(o.light) lights.push({x:o.x*T+8-cx, y:o.y*T-2-cy, r:78*flick(now,o.seed), a:1, warm:.32});
    const px=player.x-cx, py=player.y-10-cy;
    if(player.lanternOn && hasItem('lantern')) lights.push({x:px,y:py,r:92*flick(now,3),a:1,warm:.22});
    if(player.flashT>0) lights.push({x:px,y:py,r:85,a:1,warm:.5});
    if(player.matchT>0) lights.push({x:px,y:py,r:46*flick(now*1.8,7)*Math.min(1,player.matchT/2),a:1,warm:.25});
    lights.push({x:px,y:py,r:30,a:.55,warm:0});
    for(const b of seenB) if(poweredB.has(b.id)){
      for(let yy=b.y+2; yy<b.y+b.h-1; yy+=6) for(let xx=b.x+2; xx<b.x+b.w-1; xx+=6) lights.push({x:xx*T+8-cx,y:yy*T+8-cy,r:72,a:.95,warm:.18}); }
    for(const ci of vis) for(const o of chunkObjs[ci]) if(o.type==='lamp' && poweredLamps.has(o)) lights.push({x:o.x*T+8-cx,y:o.y*T-cy,r:80,a:1,warm:.3});
    lctx.globalCompositeOperation='source-over'; lctx.clearRect(0,0,bw,bh);
    lctx.fillStyle=`rgba(4,6,16,${dk})`; lctx.fillRect(0,0,bw,bh);
    lctx.globalCompositeOperation='destination-out';
    for(const Lg of lights){ if(Lg.x<-Lg.r||Lg.x>bw+Lg.r||Lg.y<-Lg.r||Lg.y>bh+Lg.r) continue;
      const gr=lctx.createRadialGradient(Lg.x,Lg.y,0,Lg.x,Lg.y,Lg.r); gr.addColorStop(0,`rgba(0,0,0,${Lg.a})`); gr.addColorStop(.55,`rgba(0,0,0,${Lg.a*.7})`); gr.addColorStop(1,'rgba(0,0,0,0)');
      lctx.fillStyle=gr; lctx.fillRect(Lg.x-Lg.r,Lg.y-Lg.r,Lg.r*2,Lg.r*2); }
    g.drawImage(lcv,0,0);
    g.globalCompositeOperation='lighter';
    for(const Lg of lights){ if(!Lg.warm) continue; const gr=g.createRadialGradient(Lg.x,Lg.y,0,Lg.x,Lg.y,Lg.r*.8);
      gr.addColorStop(0,`rgba(255,150,60,${Lg.warm*dk})`); gr.addColorStop(1,'rgba(255,120,40,0)'); g.fillStyle=gr; g.fillRect(Lg.x-Lg.r,Lg.y-Lg.r,Lg.r*2,Lg.r*2); }
    g.globalCompositeOperation='source-over';
  }
  ctx.imageSmoothingEnabled=false;
  ctx.drawImage(buf,0,0,bw*zoom,bh*zoom);
  const S=(wx,wy)=>[ (wx-cx)*zoom, (wy-cy)*zoom ];
  const fz=innerHeight<520?10:14; ctx.font=`${Math.round(fz*dpr)}px 'Pixelify Sans', monospace`; ctx.textAlign='center'; ctx.textBaseline='bottom';
  if(target){
    let label, wx, wy;
    if(target.kind==='door'){ label=(target.ref.open?'Close':'Open')+' door'; wx=target.ref.x*T+8; wy=target.ref.y*T-2; }
    else if(target.kind==='act'){ const o=target.ref; wx=o.x*T+o.w*8; wy=o.y*T-6;
      label = o.type==='generator' ? (o.on?'Turn generator off':'Turn generator on') : o.type==='battery' ? `Battery (${Math.round(o.charge)}%)` :
              o.type==='solar' ? 'Check solar panel' : o.type==='storage' ? 'Open storage box' : o.type==='campfire' ? (o.lit?'Campfire — cook, boil water':'Campfire') :
              o.type==='toilet' ? 'Drink from toilet tank' : o.type==='collector' ? `Rain collector (${Math.floor(o.water||0)} water)` : o.type==='tower' ? 'Climb the watchtower' : o.type==='tent' ? 'Sleep in tent' : 'Sleep'; }
    else if(target.kind==='npc'){ const n=target.ref; label=n.role==='trader'?`Talk / trade — ${n.name}`:`Talk — ${n.name}`; wx=n.x; wy=n.y-30; }
    else if(target.kind==='veh'){ const v=target.ref, K=VEH_KINDS[v.kind]; label=`${K.name} — ${K.trailer?'open':'drive / trunk / fuel'}`; wx=v.x; wy=v.y-Math.max(K.w,K.h)/2-4; }
    else if(target.kind==='water'){ label=target.sea?'Salt water':'Drink'; wx=player.x; wy=player.y-26; }
    else { const o=target.ref, nm=OBJ_NAMES[o.type]||'Container'; label=o.searched?`${nm} (empty)`:o.type==='carcass'?`Butcher ${ANIMALS[o.kind].name}`:`Search ${nm}`; wx=o.x*T+o.w*8; wy=o.y*T-(['fridge','locker','gunsafe','pump'].includes(o.type)?10:4); }
    const key = document.body.classList.contains('touch') ? 'USE' : 'E';
    const [sx,sy]=S(wx,wy); const txt=`[${key}] ${label}`; const w=ctx.measureText(txt).width+12*dpr;
    ctx.fillStyle='rgba(10,8,7,.85)'; ctx.fillRect(sx-w/2,sy-(fz+6)*dpr,w,(fz+5)*dpr);
    ctx.fillStyle='#eadfce'; ctx.fillText(txt,sx,sy-3*dpr);
  }
  if(ghost && (ghost.why || ghost.p.id==='scrap')){
    const [sx,sy]=S(ghost.gx*T+ghost.w*8, ghost.gy*T-3);
    const txt = ghost.p.id==='scrap' && ghost.ok ? `Scrap ${ghost.tgt.name} → ${Object.entries(ghost.tgt.yield).map(([k,v])=>v+' '+ITEMS[k].name).join(', ')}` : ghost.why;
    const w=ctx.measureText(txt).width+12*dpr; ctx.fillStyle='rgba(10,8,7,.85)'; ctx.fillRect(sx-w/2,sy-(fz+6)*dpr,w,(fz+5)*dpr);
    ctx.fillStyle=ghost.ok?'#bfe8b0':'#f0a090'; ctx.fillText(txt,sx,sy-3*dpr);
  }
  { const hm=markers.find(m=>m.home); if(hm){ const [hx,hy]=S(hm.x,hm.y), Wc=canvas.width, Hc=canvas.height, pad=40*dpr;
      if(hx<0||hy<0||hx>Wc||hy>Hc){ const [px,py]=S(player.x,player.y-10), a=Math.atan2(hy-py,hx-px);
        let ex=Wc/2+Math.cos(a)*Wc, ey=Hc/2+Math.sin(a)*Hc; const t=Math.min((Wc/2-pad)/Math.abs(Math.cos(a)||1e-6),(Hc/2-pad)/Math.abs(Math.sin(a)||1e-6)); ex=Wc/2+Math.cos(a)*t; ey=Hc/2+Math.sin(a)*t;
        ctx.save(); ctx.translate(ex,ey); ctx.rotate(a); ctx.fillStyle='rgba(232,192,80,.85)'; ctx.beginPath(); ctx.moveTo(12*dpr,0); ctx.lineTo(-6*dpr,-8*dpr); ctx.lineTo(-6*dpr,8*dpr); ctx.fill(); ctx.restore();
        ctx.fillStyle='#e8c050'; ctx.font=`${Math.round(12*dpr)}px 'Pixelify Sans', monospace`; ctx.fillText(`Home ${Math.round(Math.hypot(hm.x-player.x,hm.y-player.y)/T)}m`, ex-Math.cos(a)*26*dpr, ey-Math.sin(a)*22*dpr+6*dpr); } } }
  if(search){
    const [sx,sy]=S(player.x,player.y-26); const w=40*dpr, h=6*dpr;
    ctx.fillStyle='#000'; ctx.fillRect(sx-w/2-dpr,sy-h-dpr,w+2*dpr,h+2*dpr);
    ctx.fillStyle=search.fish?'#5a9ad0':'#d69a4c'; ctx.fillRect(sx-w/2,sy-h,w*(search.t/search.dur),h);
  }
}

// ---------------- World map overlay ----------------
const mapCv=document.getElementById('worldmap'), mctx=mapCv.getContext('2d');
function setHome(){
  const old=markers.find(m=>m.home);
  if(old && Math.hypot(old.x-player.x,old.y-player.y)<4*T){ markers.splice(markers.indexOf(old),1); toast('Home marker removed.'); return; }
  if(old) markers.splice(markers.indexOf(old),1);
  const b=player.inB>=0?buildings[player.inB]:null;
  markers.push({x:b?(b.x+b.w/2)*T:player.x, y:b?(b.y+b.h/2)*T:player.y, home:true, label:'Home'});
  toast(b ? `This ${buildingName(b).toLowerCase()} is home now. It's marked on your map.` : 'Home marked on your map.');
}
function mapClick(e){
  if(!mapView) return; const r=mapCv.getBoundingClientRect(); const mx=(e.clientX-r.left)*dpr, my=(e.clientY-r.top)*dpr;
  const wx=(mx-mapView.ox)/mapView.s*T, wy=(my-mapView.oy)/mapView.s*T;
  if(wx<0||wy<0||wx>W*T||wy>H*T) return;
  const near=markers.find(m=>Math.hypot((m.x-wx)/T*mapView.s,(m.y-wy)/T*mapView.s)<12*dpr);
  if(near){ markers.splice(markers.indexOf(near),1); return; }
  if(markers.length>=40){ toast('Too many markers.'); return; }
  markers.push({x:wx,y:wy,home:false,label:'#'+(markers.filter(m=>!m.home).length+1)});
}
function toggleMap(force){
  mapOpen = force!==undefined ? force : !mapOpen;
  mapCv.style.display = mapOpen ? 'block' : 'none';
  document.getElementById('map-ui').style.display = mapOpen ? 'flex' : 'none';
}
function renderMap(now){
  const cw=Math.floor(innerWidth*dpr), chh=Math.floor(innerHeight*dpr);
  if(mapCv.width!==cw||mapCv.height!==chh){ mapCv.width=cw; mapCv.height=chh; }
  const g=mctx; g.imageSmoothingEnabled=false;
  g.fillStyle='#0b0a09'; g.fillRect(0,0,cw,chh);
  const ptx=player.x/T, pty=player.y/T;
  let s, ox, oy;
  if(mapZoom===0){ s=Math.min((cw-40*dpr)/W,(chh-110*dpr)/H); ox=(cw-W*s)/2; oy=(chh-H*s)/2+20*dpr; }
  else { s=(mapZoom===1?3:6)*dpr; ox=cw/2-ptx*s; oy=chh/2-pty*s; }
  g.drawImage(minimap,ox,oy,W*s,H*s);
  g.strokeStyle='#3a322a'; g.lineWidth=2*dpr; g.strokeRect(ox,oy,W*s,H*s);
  g.textAlign='center'; g.textBaseline='middle';
  for(const r of regions){
    const x=ox+(r.x+r.w/2)*s, y=oy+(r.y+r.h/2)*s;
    const fs = r.kind==='city' ? 15 : r.kind==='town' ? 12 : 10;
    g.font=`${r.kind==='city'?'600 ':''}${Math.round(fs*dpr)}px 'Pixelify Sans', monospace`;
    const col = r.kind==='city' ? '#f0e6d6' : r.kind==='town' ? '#cfc4b4' : '#e8c070';
    const tw=g.measureText(r.name).width+8*dpr;
    g.fillStyle='rgba(10,8,7,.7)'; g.fillRect(x-tw/2,y-fs*dpr*0.75,tw,fs*dpr*1.5);
    g.fillStyle=col; g.fillText(r.name,x,y);
  }
  mapView={s,ox,oy};
  // your markers
  for(const m of markers){ const x=ox+m.x/T*s, y=oy+m.y/T*s, k=dpr;
    g.fillStyle='rgba(0,0,0,.6)'; g.fillRect(x-8*k,y-9*k,16*k,16*k);
    if(m.home){ g.fillStyle='#e8c050'; g.beginPath(); g.moveTo(x,y-8*k); g.lineTo(x+7*k,y-2*k); g.lineTo(x-7*k,y-2*k); g.fill(); g.fillRect(x-5*k,y-2*k,10*k,8*k); g.fillStyle='#3a2a1a'; g.fillRect(x-1.5*k,y+1*k,3*k,5*k); }
    else { g.fillStyle='#5ab0e8'; g.beginPath(); g.arc(x,y-3*k,5*k,0,7); g.fill(); g.beginPath(); g.moveTo(x-4*k,y-1*k); g.lineTo(x+4*k,y-1*k); g.lineTo(x,y+6*k); g.fill(); g.fillStyle='#0b0a09'; g.beginPath(); g.arc(x,y-3*k,2*k,0,7); g.fill(); }
    g.font=`${Math.round(11*dpr)}px 'Pixelify Sans', monospace`; g.fillStyle='#f0e6d6'; g.fillText(m.label,x,y+14*dpr); }
  // player
  const px=ox+ptx*s, py=oy+pty*s, blink = Math.floor(now/400)%2;
  g.fillStyle = blink ? '#ff4a3a' : '#ffd25a'; g.beginPath(); g.arc(px,py,5*dpr,0,Math.PI*2); g.fill();
  g.strokeStyle='#000'; g.lineWidth=2*dpr; g.stroke();
}

// ---------------- HUD ----------------
let hudT=0;
function regionAt(x,y){ const tx=Math.floor(x/T), ty=Math.floor(y/T); if(!inB(tx,ty)) return null; const r=regionId[idx(tx,ty)]; return r===255?null:regions[r]; }
function updateHud(dt){
  hudT+=dt; if(hudT<0.1) return; hudT=0;
  document.getElementById('bar-health').style.width=(player.health/player.maxHealth*100)+'%';
  document.getElementById('bar-stamina').style.width=(player.stamina/player.maxStamina*100)+'%';
  document.getElementById('bar-hunger').style.width=player.hunger+'%';
  document.getElementById('bar-thirst').style.width=player.thirst+'%';
  drawBodyFigure(document.getElementById('mini-body'),2);
  const cs=[]; for(const k of PARTS){ if(player.bleed[k]) cs.push('Bleeding'); if(player.limbs[k]<=0) cs.push(k==='head'?'Concussion':k==='torso'?'Broken ribs':'Broken '+PART_NAMES[k].toLowerCase()); }
  if(player.sick>0) cs.push('Sick'); if(player.thirst<20) cs.push('Thirsty'); if(player.hunger<20) cs.push('Hungry');
  if(driving){ const K=VEH_KINDS[driving.kind]; cs.unshift(`<span style="color:#d6b47a">${K.name} · ${Math.round(Math.abs(driving.sp)/T*3.6)} km/h · fuel ${Math.round(driving.fuel)}% · ${Math.round(driving.hp)}%</span>`); }
  document.getElementById('conds').innerHTML=[...new Set(cs)].join(' · ');
  const hh=Math.floor(time), mm=Math.floor((time-hh)*60/10)*10;
  document.getElementById('clock-day').textContent=`Dia ${day}`;
  document.getElementById('clock-time').textContent=`${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
  let per='Noite'; if(time>=5&&time<11) per='Manhã'; else if(time>=11&&time<17) per='Tarde'; else if(time>=17&&time<21) per='Entardecer';
  document.getElementById('clock-period').textContent=per;
  const reg=regionAt(player.x,player.y), b = player.inB>=0 ? buildings[player.inB] : null;
  document.getElementById('clock-place').textContent = (reg ? reg.name : (typeof wildName==='function'?wildName():'Ermo')) + (b ? ' · '+buildingName(b) : '');
  document.getElementById('btn-run').classList.toggle('on', runHeld && !player.exhausted);
  document.getElementById('btn-atk').classList.toggle('on', attackHeld);
  const Wp=WEAPONS[player.weapon];
  const arm=Math.round(armorOf(player.equip)*100);
  document.getElementById('weap').innerHTML = `<b>${Wp.name}</b>` + (Wp.ranged ? ` · ${countItem(Wp.ammo)} rds` : '') + (arm?`<br><small>Armour ${arm}%</small>`:'');
  document.getElementById('hurt').style.opacity = Math.max(0, player.hurtT/.35) + (player.health<25 ? 0.25 : 0) + (crippled('head') ? 0.2 : 0);
}

// ---------------- Loop ----------------
function loop(now){
  if(!running) return;
  const dt=Math.max(0,Math.min(0.05,(now-lastTime)/1000)); lastTime=Math.max(lastTime,now);
  if(mapOpen) renderMap(now);
  else { if(!paused()){ update(dt); if(!running) return; } render(now); }
  updateHud(dt);
  requestAnimationFrame(loop);
}
function skipTime(){ if(!running) return; time+=3; player.hunger=Math.max(0,player.hunger-6); if(time>=24){time-=24;day++;} toast('3 hours pass...'); }

// ---------------- Input ----------------
const mouse={x:0,y:0}; let aiming=false, leftHeld=false, attackHeld=false, runHeld=false;
addEventListener('keydown',e=>{
  if(document.activeElement && document.activeElement.tagName==='INPUT') return;
  const k=e.key.toLowerCase(); keys[k]=true;
  if(['arrowup','arrowdown','arrowleft','arrowright',' ','tab'].includes(k)) e.preventDefault();
  if(!running) return;
  if(k==='escape'){ if(tradeWith) closeTrade(); else if(actOpen) closeActions(); else if(mapOpen) toggleMap(false); else if(invOpen) closeInventory(); else if(craftOpen) closeCraft(); else if(menuOpen) closeMenu(); else if(buildMode) toggleBuild(false); else openMenu(); return; }
  if(k==='m'){ toggleMap(); return; }
  if(k==='f11'){ e.preventDefault(); toggleFullscreen(); return; }
  if(k==='h' && !mapOpen && !paused()){ setHome(); return; }
  if(k==='i'||k==='tab'){ if(invOpen) closeInventory(); else openInventory(); return; }
  if(k==='c'){ if(craftOpen) closeCraft(); else openCraft(); return; }
  if(mapOpen||paused()) return;
  if(driving){ if(k==='e') interact(); if(k>='0'&&k<='9'){ useSlot(k==='0'?9:+k-1); } if(k==='f5'){ e.preventDefault(); saveGame(); } return; }
  if(k==='b'){ toggleBuild(); return; }
  if(k==='e'||k===' '){ if(buildMode) placeBuild(); else interact(); }
  if(k==='n') skipTime();
  if(k==='f5'){ e.preventDefault(); saveGame(); }
  if(k==='q' && buildMode){ const cs=BUILD_CATS.filter(c=>BUILD.some(q=>q.cat===c)); buildCat=cs[(cs.indexOf(buildCat)+1)%cs.length]; renderHotbar(); return; }
  if(k>='0'&&k<='9'){ const n=k==='0'?9:+k-1; if(buildMode){ const L=buildList(); if(n<L.length){ buildSel=BUILD.indexOf(L[n]); renderHotbar(); } } else useSlot(n); }
});
addEventListener('keyup',e=>{ keys[e.key.toLowerCase()]=false; });
addEventListener('blur',()=>{ for(const k in keys) keys[k]=false; aiming=false; leftHeld=false; });
canvas.addEventListener('mousemove',e=>{ mouse.x=e.clientX; mouse.y=e.clientY; mouse.seen=true; });
canvas.addEventListener('mousedown',e=>{
  mouse.x=e.clientX; mouse.y=e.clientY;
  if(!running) return;
  if(paused()) return;
  if(buildMode){ if(e.button===0) placeBuild(); else if(e.button===2) toggleBuild(false); return; }
  if(driving) return;
  if(e.button===2) aiming=true;
  else if(e.button===0){
    leftHeld=true;
    playerAttack(clickAngle());
  }
});
addEventListener('mouseup',e=>{ if(e.button===2) aiming=false; if(e.button===0) leftHeld=false; });
canvas.addEventListener('contextmenu',e=>e.preventDefault());
// estilo D2/TCoM: clique ataca na direção do cursor; se houver monstro perto do cursor, mira nele
function clickAngle(){ const m=mouseWorld(); let best=null, bd=18; for(const r of raiders){ const d=Math.hypot(r.x-m.x,(r.y-9)-m.y); if(d<bd){ bd=d; best=r; } }
  const tx=best?best.x:m.x, ty=best?best.y-9:m.y; return Math.atan2(ty-(player.y-10), tx-player.x); }
addEventListener('keydown',e=>{ if(e.code==='Space' && running && document.activeElement.tagName!=='INPUT'){ e.preventDefault(); if(!attackHeld){ attackHeld=true; playerAttack(autoAimAngle()); } } });
addEventListener('keyup',e=>{ if(e.code==='Space') attackHeld=false; });

const joy={active:false,id:null,ox:0,oy:0,x:0,y:0};
const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
if(isTouch){ document.body.classList.add('touch');
  document.getElementById('controls-help').innerHTML='Drag on the left side to move · ATTACK auto-aims · USE opens / searches · RUN — hold<br>Tap an item to use or equip it · MAP shows the world · +3h skips time (testing)'; }
const joyEl=document.getElementById('joy'), knob=document.getElementById('knob');
canvas.addEventListener('touchstart',e=>{
  for(const t of e.changedTouches){
    if(!joy.active && t.clientX < innerWidth*0.6){ joy.active=true; joy.id=t.identifier; joy.ox=t.clientX; joy.oy=t.clientY; joy.x=joy.y=0;
      joyEl.style.display='block'; joyEl.style.left=t.clientX+'px'; joyEl.style.top=t.clientY+'px'; knob.style.transform='translate(0,0)';
      document.getElementById('joy-hint').style.display='none'; }
  } e.preventDefault();
},{passive:false});
canvas.addEventListener('touchmove',e=>{
  for(const t of e.changedTouches) if(t.identifier===joy.id){
    let dx=t.clientX-joy.ox, dy=t.clientY-joy.oy; const Lj=Math.hypot(dx,dy), max=48;
    if(Lj>max){ dx*=max/Lj; dy*=max/Lj; }
    joy.x=dx/max; joy.y=dy/max; knob.style.transform=`translate(${dx}px,${dy}px)`;
  } e.preventDefault();
},{passive:false});
const endJoy=e=>{ for(const t of e.changedTouches) if(t.identifier===joy.id){ joy.active=false; joy.id=null; joy.x=joy.y=0; joyEl.style.display='none'; } };
canvas.addEventListener('touchend',endJoy); canvas.addEventListener('touchcancel',endJoy);
document.getElementById('btn-use').addEventListener('pointerdown',e=>{ e.preventDefault(); if(paused()) return; if(buildMode) placeBuild(); else interact(); });
document.getElementById('act-panel').addEventListener('pointerdown',e=>{ if(e.target.id==='act-panel') closeActions(); });
const runBtn=document.getElementById('btn-run');
runBtn.addEventListener('pointerdown',e=>{ e.preventDefault(); runHeld=true; });
['pointerup','pointercancel','pointerleave'].forEach(ev=>runBtn.addEventListener(ev,()=>{ runHeld=false; }));
const atkBtn=document.getElementById('btn-atk');
atkBtn.addEventListener('pointerdown',e=>{ e.preventDefault(); attackHeld=true; playerAttack(autoAimAngle()); });
['pointerup','pointercancel','pointerleave'].forEach(ev=>atkBtn.addEventListener(ev,()=>{ attackHeld=false; }));
const tap=(id,f)=>document.getElementById(id).addEventListener('pointerdown',e=>{ e.stopPropagation(); e.preventDefault(); f(); });
tap('btn-skip',()=>{ skipTime(); });
// fullscreen (+ landscape lock on Android)
function isFull(){ return !!(document.fullscreenElement||document.webkitFullscreenElement); }
function toggleFullscreen(){
  const el=document.documentElement;
  if(isFull()){ (document.exitFullscreen||document.webkitExitFullscreen).call(document); return; }
  const req=el.requestFullscreen||el.webkitRequestFullscreen;
  if(!req){ (running?toast:alert)('Fullscreen isn\'t supported by this browser. On iPhone: Share → Add to Home Screen, then open it from the icon.'); return; }
  try{ const pr=req.call(el,{navigationUI:'hide'}); if(pr&&pr.then) pr.then(()=>{ try{ screen.orientation.lock('landscape').catch(()=>{}); }catch(e){} }).catch(()=>{ (running?toast:alert)('Fullscreen was blocked here. Open the game in its own browser tab and try again.'); }); }
  catch(e){ (running?toast:alert)('Fullscreen was blocked here. Open the game in its own browser tab and try again.'); }
}
const fsSync=()=>{ const t=isFull()?'✕⛶':'⛶'; document.getElementById('btn-fs').textContent=t; document.getElementById('t-fs').textContent=isFull()?'Exit fullscreen':'⛶ Fullscreen'; setTimeout(resize,150); };
document.addEventListener('fullscreenchange',fsSync); document.addEventListener('webkitfullscreenchange',fsSync);
tap('btn-fs',toggleFullscreen);
document.getElementById('t-fs').addEventListener('click',toggleFullscreen);
tap('btn-bag',()=>{ if(!running) return; invOpen?closeInventory():openInventory(); });
tap('btn-build',()=>{ if(!running||paused()) return; toggleBuild(); });
tap('btn-craft',()=>{ if(!running) return; craftOpen?closeCraft():openCraft(); });
tap('btn-menu',()=>{ if(!running) return; menuOpen?closeMenu():openMenu(); });
tap('trade-close',closeTrade); tap('m-home',()=>{ closeMenu(); setHome(); }); tap('inv-close',closeInventory); tap('craft-close',closeCraft); tap('act-close',closeActions); tap('inv-to-craft',()=>{ closeInventory(); openCraft(); });
document.getElementById('body-cv').addEventListener('pointerdown',e=>{ e.stopPropagation(); bodyClick(e); });
tap('m-resume',closeMenu); tap('m-save',()=>saveGame()); tap('m-export',exportSave);
tap('m-load',()=>{ const sv=newestSave(); if(!sv){ setSaveStatus('No saved game yet.'); return; } closeMenu(); try{ applySave(sv); enterGame(`Loaded. Day ${day}.`); }catch(e){ setSaveStatus('Could not load that save.'); } });
tap('m-import',()=>document.getElementById('import-file').click());
tap('m-skip',()=>{ closeMenu(); skipTime(); });
tap('m-quit',()=>{ closeMenu(); running=false; document.body.classList.remove('playing'); document.getElementById('hud').style.display='none'; showScreen('screen-title'); });
tap('export-copy',()=>{ const ta=document.getElementById('export-text'); ta.select(); try{ navigator.clipboard.writeText(ta.value).then(()=>setSaveStatus('Save copied — paste it somewhere safe.'),()=>setSaveStatus('Select the text and copy it manually.')); }catch(e){ setSaveStatus('Select the text and copy it manually.'); } });
document.getElementById('import-file').addEventListener('change',e=>{ const f=e.target.files[0]; if(!f) return; f.text().then(importSaveText); e.target.value=''; });
document.getElementById('btn-continue').onclick=continueGame;
document.getElementById('btn-import-title').onclick=()=>document.getElementById('import-file').click();
document.getElementById('btn-map').addEventListener('pointerdown',e=>{ e.stopPropagation(); toggleMap(); });
mapCv.addEventListener('pointerdown',e=>{ e.stopPropagation(); mapClick(e); });
document.getElementById('map-home').addEventListener('pointerdown',e=>{ e.stopPropagation(); setHome(); });
document.getElementById('map-close').addEventListener('pointerdown',e=>{ e.stopPropagation(); toggleMap(false); });
document.getElementById('map-zoom').addEventListener('pointerdown',e=>{ e.stopPropagation(); mapZoom=(mapZoom+1)%3; document.getElementById('map-zoom').textContent=['Zoom: mundo','Zoom: região','Zoom: perto'][mapZoom]; });
document.getElementById('btn-start').onclick=startGame;
document.getElementById('btn-again').onclick=()=>{
  document.getElementById('dead').style.display='none'; document.getElementById('hud').style.display='none';
  showScreen('screen-title');
};

document.getElementById('sex-m').onclick=()=>setSex('m');
document.getElementById('sex-f').onclick=()=>setSex('f');
document.getElementById('btn-rand').onclick=()=>rollLook();
// boot
makeTrees(); makeIcons(); initCreation(); refreshContinue(); initCloud(); setSex(Math.random()<.5?'m':'f');
ctx.fillStyle='#0c0a09'; ctx.fillRect(0,0,canvas.width,canvas.height);

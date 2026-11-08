'use strict';
// =====================================================================
// OUTREMER — lealdade às cidades: quadro de contratos em cada capital (as 20 encomendas do 3D,
// caçadas e chefes), envio para outra cidade com taxa, reputação por cidade com títulos,
// desconto nas lojas, presentes do senhor e juramento de lealdade a uma cidade.
// =====================================================================
const C3 = D3.contracts;
const REP_TITLES = [[100,'Knight'],[50,'Citizen'],[25,'Friend'],[10,'Acquaintance'],[0,'Stranger']];
const repTitle = (v,city) => { const t=REP_TITLES.find(r=>v>=r[0])[1]; return t==='Knight'?`Knight of ${city}`:t==='Friend'?`Friend of ${city}`:t; };
function cityName(sid){ const r=regions.find(r=>r.sid===sid); return r?r.name:sid==='aurelia'?'Aurelia':sid; }
function sidOf(region){ return region ? (region.sid || (region.name==='Aurelia'?'aurelia':region.name)) : null; }
function rep(sid){ return (player.rep||{})[sid]||0; }
function addRep(sid,v){ player.rep=player.rep||{}; const before=rep(sid), mul=player.oath===sid?1.5:1; player.rep[sid]=Math.round((before+v*mul)*10)/10;
  const b=REP_TITLES.find(r=>before>=r[0]), a=REP_TITLES.find(r=>player.rep[sid]>=r[0]); if(a!==b){ toast(`${cityName(sid)}: you are now ${repTitle(player.rep[sid],cityName(sid))}!`); Journal.add('system','',`Reputation in ${cityName(sid)}: ${repTitle(player.rep[sid],cityName(sid))}.`); } }
// caçadas e chefes gerados para cada capital (além das encomendas do 3D)
function huntsFor(sid){ const r=regions.find(r=>r.sid===sid)||regions.find(r=>r.name==='Aurelia'); if(!r) return [];
  const cx=Math.floor((r.x+r.w/2)/CSZ), cy=Math.floor((r.y+r.h/2)/CSZ), mons=new Set();
  for(let y=cy-2;y<=cy+2;y++) for(let x=cx-2;x<=cx+2;x++){ const c=CELLS[y]&&CELLS[y][x]; if(c) for(const m of c.m||[]) if(MONS[m]) mons.add(m); }
  const list=[...mons].slice(0,3).map((m,i)=>({ id:`${sid}_cacar_${m}`, city:sid, hunt:m, n:6+i*3, gold:[30+MONS[m].lvl*8,50+MONS[m].lvl*12], reputation:2+Math.ceil(MONS[m].lvl/5) }));
  const lair=(SW.lairs||[]).filter(l=>LAIR_BOSS[l.id]).sort((a,b)=>Math.hypot(a.x-r.x,a.y-r.y)-Math.hypot(b.x-r.x,b.y-r.y))[0];
  if(lair) list.push({ id:`${sid}_chefe_${lair.id}`, city:sid, boss:lair.id, gold:[200+lair.lv*20,400+lair.lv*30], reputation:10 });
  return list; }
function ordersFor(sid){ return C3.orders.filter(o=>o.city===sid).concat(huntsFor(sid)); }
function orderText(o){ if(o.hunt) return `Hunt ${o.n} ${MONS[o.hunt].name}`; if(o.boss){ const L=lairOf(o.boss); return `Defeat ${L?L.name:o.boss}`; } return 'Deliver '+Object.entries(o.ask).map(([k,v])=>`${v} ${ITEMS[k]?ITEMS[k].name:k}`).join(', '); }
// contagem de caçadas
const _kRL = killRaider;
killRaider = function(r,ang){ _kRL(r,ang); if(!player.quests) return;
  for(const q of Object.values(player.quests)){ if(q.hunt && (r.mon===q.hunt) && q.have<q.n){ q.have++; if(q.have===q.n) toast(`Contract fulfilled: return to the board of ${cityName(q.city)}.`); }
    if(q.boss && r.lairBoss===q.boss){ q.have=1; toast(`Boss slain! Return to the board of ${cityName(q.city)}.`); } } };
// o quadro
function openBoard(sid){
  player.quests=player.quests||{}; const city=cityName(sid), acts=[[`Reputation: ${rep(sid)} — ${repTitle(rep(sid),city)}${player.oath===sid?' · sworn':''}`,null]];
  for(const o of ordersFor(sid)){ const q=player.quests[o.id], g=`${o.gold[0]}–${o.gold[1]} gold, +${o.reputation} rep.`;
    if(o.ask){ const ok=Object.entries(o.ask).every(([k,v])=>countItem(k)>=v);
      acts.push([`${ok?'✔ ':''}${orderText(o)} → ${g}`, ok?()=>{ for(const [k,v] of Object.entries(o.ask)) takeItem(k,v); const gold=rint(o.gold[0],o.gold[1]); addItem('cash',gold); addRep(sid,o.reputation); toast(`Order delivered: +${gold} gold.`); openBoard(sid); }:null]); }
    else if(!q) acts.push([`Accept: ${orderText(o)} → ${g}`, ()=>{ player.quests[o.id]={...o,have:0}; toast(`Contract accepted: ${orderText(o)}.`); openBoard(sid); }]);
    else if(q.have>=(q.n||1)) acts.push([`✔ Deliver: ${orderText(o)} → ${g}`, ()=>{ const gold=rint(o.gold[0],o.gold[1]); addItem('cash',gold); addRep(sid,o.reputation); delete player.quests[o.id]; toast(`Contract paid: +${gold} gold.`); openBoard(sid); }]);
    else acts.push([`In progress: ${orderText(o)} (${q.have}/${q.n||1})`,null]); }
  acts.push(['Send an order to another town…', ()=>openShipping(sid)]);
  if(player.oath!==sid) acts.push([player.oath?`Swear loyalty to ${city} (leaves ${cityName(player.oath)})`:`Swear loyalty to ${city} (+50% reputation here)`, ()=>{ player.oath=sid; toast(`You swear loyalty to ${city}.`); Journal.add('system','',`${player.name} swore loyalty to ${city}.`); }]);
  acts.push(['Close',null]); openActions(`Contract Board — ${city}`, acts);
}
function openShipping(from){
  const acts=[['Deliver from afar: the fee is in gold, no risk on the road.',null]];
  for(const r of regions.filter(r=>r.kind==='city')){ const sid=sidOf(r); if(sid===from) continue;
    for(const o of C3.orders.filter(o=>o.city===sid)){ const ok=Object.entries(o.ask).every(([k,v])=>countItem(k)>=v), fee=rint(C3.delivery.other_city_fee[0],C3.delivery.other_city_fee[1]);
      if(ok) acts.push([`${r.name}: ${orderText(o)} (fee ${fee})`, ()=>{ if(countItem('cash')<fee){ toast('Not enough gold for the fee.'); return; } takeItem('cash',fee); for(const [k,v] of Object.entries(o.ask)) takeItem(k,v);
        const gold=rint(o.gold[0],o.gold[1]); addItem('cash',gold); addRep(sid,o.reputation); toast(`Sent to ${r.name}: +${gold} gold.`); }]); } }
  if(acts.length===1) acts.push(['You have nothing another town is asking for.',null]);
  acts.push(['Back',()=>openBoard(from)]); openActions('Order shipping', acts);
}
// quadros perto da fonte de cada capital
const _ppL = placePeople;
placePeople = function(){ _ppL();
  for(const r of regions){ const sid=sidOf(r); if(r.kind!=='city' && !C3.orders.some(o=>o.city===sid)) continue;
    const f=objs.find(o=>o.type==='fountain'&&o.x>=r.x&&o.x<r.x+r.w&&o.y>=r.y&&o.y<r.y+r.h); const cx=f?f.x:Math.floor(r.x+r.w/2), cy=f?f.y:Math.floor(r.y+r.h/2);
    let done=false; for(let rad=3;rad<9&&!done;rad++) for(let a=0;a<16&&!done;a++){ const x=Math.round(cx+Math.cos(a/16*6.283)*rad), y=Math.round(cy+Math.sin(a/16*6.283)*rad);
      const i=idx(x,y); if(inB(x,y)&&!objGrid[i]&&!doors.has(i)&&map[i]===TL.ASPH&&bld[i]<0){ addObj({type:'board',x,y,solid:true,sid}); done=true; } } } };
const _dObjLy = drawObj;
drawObj = function(g,o,sx,sy,now){ if(o.type==='board'){ const P=(a,b,w,h,c)=>{g.fillStyle=c;g.fillRect(sx+a,sy+b,w,h);};
    P(2,4,2,12,'#4a3018'); P(12,4,2,12,'#4a3018'); P(0,-6,16,12,'#6a4a2a'); P(1,-5,14,10,'#8a6a40'); P(2,-4,5,4,'#e8dcc0'); P(8,-3,5,3,'#e0d4b0'); P(3,1,6,3,'#e8dcc0'); P(10,1,3,3,'#d8c8a0'); P(4,-3,1,1,'#a01a14'); P(0,-7,16,1,'#3a2614'); return; }
  return _dObjLy(g,o,sx,sy,now); };
OBJ_NAMES.board='Contract Board'; ACT_TYPES.add('board');
const _udL = useDevice; useDevice = function(o){ if(o.type==='board'){ if(!running||!player) return; refreshWalk(o.x,o.y); openBoard(o.sid); return; } return _udL(o); };
// desconto nas lojas da cidade em que você é conhecido
const _otL = openTrade;
openTrade = function(n){ const r=regionAt(n.x,n.y), sid=sidOf(r), v=sid?rep(sid):0, d= v>=100?.15 : v>=50?.10 : v>=25?.05 : 0;
  player.mods._baseTrade = player.mods._baseTrade ?? (player.mods.tradePrice||1); player.mods.tradePrice = player.mods._baseTrade*(1-d);
  if(d) toast(`Discount of ${Math.round(d*100)}% at ${r.name} thanks to your reputation.`); return _otL(n); };
// guardas e o senhor da cidade reconhecem você
const _talkL = talkTo;
talkTo = function(n){ const r=regionAt(n.x,n.y), sid=sidOf(r);
  if((n.role==='lord') && sid){ const v=rep(sid), city=r.name; player.gifts=player.gifts||{};
    const acts=[[`"${v>=100?`Rise, ${repTitle(v,city)}. Aeloria needs more like you.`:v>=50?`Your name runs through the streets of ${city}. Keep it up.`:v>=10?'I have heard of you. Help the contract board and you\'ll have my gratitude.':'I don\'t know you yet, traveller. The contract board in the square shows what the town needs.'}"`,null]];
    if(v>=50 && !player.gifts[sid+'50']) acts.push(['Receive the town\'s mantle', ()=>{ const s=makeInst(sid==='aelia_sancta'||sid==='templo_selo'?'templar_mantle':'crimson_cloak','raro',30); s.nm=`Mantle of ${city}`; s.aff=[['hp',20],['def_chance',4]]; addInst(s); player.gifts[sid+'50']=1; toast(`You receive the Mantle of ${city}.`); }]);
    if(v>=100 && !player.gifts[sid+'100']) acts.push(['Be knighted', ()=>{ const s=makeInst('crusader_shield','lendario',50); s.uq=null; s.nm=`Shield of the Knight of ${city}`; s.aff=[['armor_pct',20],['hp',40],['def_chance',8]]; s.rar='lendario'; addInst(s); player.gifts[sid+'100']=1; player.knight=city; toast(`${n.name} touches your shoulder with the sword: Knight of ${city}!`); Journal.add('global','Herald',`${player.name} was knighted Knight of ${city}!`,'#ffd84a'); }]);
    acts.push(['Take your leave',null]); openActions(n.name, acts); return; }
  if(n.role==='guard' && sid && rep(sid)>=25 && Math.random()<.6){ openActions(`${n.name}, guard`, [[`"${rep(sid)>=100?`At your service, ${repTitle(rep(sid),r.name)}!`:`Good to see you again, ${r.name}.`}"`,null],['Continue',null]]); return; }
  return _talkL(n); };
// título de cavaleiro aparece na HUD
const _rwL = refreshWho; refreshWho = function(){ _rwL(); if(player && player.knight){ const el=document.getElementById('who'); if(el) el.querySelector('small').textContent += ` · Knight of ${player.knight}`; } };
const _serL = serialize; serialize = function(){ const s=_serL(); s.rep=player.rep||{}; s.quests=player.quests||{}; s.oath=player.oath||null; s.gifts=player.gifts||{}; s.knight=player.knight||null; return s; };
const _appL = applySave; applySave = function(s){ _appL(s); Object.assign(player,{rep:s.rep||{},quests:s.quests||{},oath:s.oath||null,gifts:s.gifts||{},knight:s.knight||null}); };

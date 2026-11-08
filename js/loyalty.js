'use strict';
// =====================================================================
// OUTREMER — lealdade às cidades: quadro de contratos em cada capital (as 20 encomendas do 3D,
// caçadas e chefes), envio para outra cidade com taxa, reputação por cidade com títulos,
// desconto nas lojas, presentes do senhor e juramento de lealdade a uma cidade.
// =====================================================================
const C3 = D3.contracts;
const REP_TITLES = [[100,'Cavaleiro'],[50,'Cidadão'],[25,'Amigo'],[10,'Conhecido'],[0,'Forasteiro']];
const repTitle = (v,city) => { const t=REP_TITLES.find(r=>v>=r[0])[1]; return t==='Cavaleiro'?`Cavaleiro de ${city}`:t==='Amigo'?`Amigo de ${city}`:t; };
function cityName(sid){ const r=regions.find(r=>r.sid===sid); return r?r.name:sid==='aurelia'?'Aurélia':sid; }
function sidOf(region){ return region ? (region.sid || (region.name==='Aurélia'?'aurelia':region.name)) : null; }
function rep(sid){ return (player.rep||{})[sid]||0; }
function addRep(sid,v){ player.rep=player.rep||{}; const before=rep(sid), mul=player.oath===sid?1.5:1; player.rep[sid]=Math.round((before+v*mul)*10)/10;
  const b=REP_TITLES.find(r=>before>=r[0]), a=REP_TITLES.find(r=>player.rep[sid]>=r[0]); if(a!==b){ toast(`${cityName(sid)}: agora você é ${repTitle(player.rep[sid],cityName(sid))}!`); Journal.add('system','',`Reputação em ${cityName(sid)}: ${repTitle(player.rep[sid],cityName(sid))}.`); } }
// caçadas e chefes gerados para cada capital (além das encomendas do 3D)
function huntsFor(sid){ const r=regions.find(r=>r.sid===sid)||regions.find(r=>r.name==='Aurélia'); if(!r) return [];
  const cx=Math.floor((r.x+r.w/2)/CSZ), cy=Math.floor((r.y+r.h/2)/CSZ), mons=new Set();
  for(let y=cy-2;y<=cy+2;y++) for(let x=cx-2;x<=cx+2;x++){ const c=CELLS[y]&&CELLS[y][x]; if(c) for(const m of c.m||[]) if(MONS[m]) mons.add(m); }
  const list=[...mons].slice(0,3).map((m,i)=>({ id:`${sid}_cacar_${m}`, city:sid, hunt:m, n:6+i*3, gold:[30+MONS[m].lvl*8,50+MONS[m].lvl*12], reputation:2+Math.ceil(MONS[m].lvl/5) }));
  const lair=(SW.lairs||[]).filter(l=>LAIR_BOSS[l.id]).sort((a,b)=>Math.hypot(a.x-r.x,a.y-r.y)-Math.hypot(b.x-r.x,b.y-r.y))[0];
  if(lair) list.push({ id:`${sid}_chefe_${lair.id}`, city:sid, boss:lair.id, gold:[200+lair.lv*20,400+lair.lv*30], reputation:10 });
  return list; }
function ordersFor(sid){ return C3.orders.filter(o=>o.city===sid).concat(huntsFor(sid)); }
function orderText(o){ if(o.hunt) return `Cace ${o.n} ${MONS[o.hunt].name}`; if(o.boss){ const L=lairOf(o.boss); return `Derrote ${L?L.name:o.boss}`; } return 'Entregue '+Object.entries(o.ask).map(([k,v])=>`${v} ${ITEMS[k]?ITEMS[k].name:k}`).join(', '); }
// contagem de caçadas
const _kRL = killRaider;
killRaider = function(r,ang){ _kRL(r,ang); if(!player.quests) return;
  for(const q of Object.values(player.quests)){ if(q.hunt && (r.mon===q.hunt) && q.have<q.n){ q.have++; if(q.have===q.n) toast(`Contrato cumprido: volte ao quadro de ${cityName(q.city)}.`); }
    if(q.boss && r.lairBoss===q.boss){ q.have=1; toast(`Chefe abatido! Volte ao quadro de ${cityName(q.city)}.`); } } };
// o quadro
function openBoard(sid){
  player.quests=player.quests||{}; const city=cityName(sid), acts=[[`Reputação: ${rep(sid)} — ${repTitle(rep(sid),city)}${player.oath===sid?' · jurado':''}`,null]];
  for(const o of ordersFor(sid)){ const q=player.quests[o.id], g=`${o.gold[0]}–${o.gold[1]} ouro, +${o.reputation} rep.`;
    if(o.ask){ const ok=Object.entries(o.ask).every(([k,v])=>countItem(k)>=v);
      acts.push([`${ok?'✔ ':''}${orderText(o)} → ${g}`, ok?()=>{ for(const [k,v] of Object.entries(o.ask)) takeItem(k,v); const gold=rint(o.gold[0],o.gold[1]); addItem('cash',gold); addRep(sid,o.reputation); toast(`Encomenda entregue: +${gold} de ouro.`); openBoard(sid); }:null]); }
    else if(!q) acts.push([`Aceitar: ${orderText(o)} → ${g}`, ()=>{ player.quests[o.id]={...o,have:0}; toast(`Contrato aceito: ${orderText(o)}.`); openBoard(sid); }]);
    else if(q.have>=(q.n||1)) acts.push([`✔ Entregar: ${orderText(o)} → ${g}`, ()=>{ const gold=rint(o.gold[0],o.gold[1]); addItem('cash',gold); addRep(sid,o.reputation); delete player.quests[o.id]; toast(`Contrato pago: +${gold} de ouro.`); openBoard(sid); }]);
    else acts.push([`Em andamento: ${orderText(o)} (${q.have}/${q.n||1})`,null]); }
  acts.push(['Enviar uma encomenda para outra cidade…', ()=>openShipping(sid)]);
  if(player.oath!==sid) acts.push([player.oath?`Jurar lealdade a ${city} (deixa ${cityName(player.oath)})`:`Jurar lealdade a ${city} (+50% de reputação aqui)`, ()=>{ player.oath=sid; toast(`Você jura lealdade a ${city}.`); Journal.add('system','',`${player.name} jurou lealdade a ${city}.`); }]);
  acts.push(['Fechar',null]); openActions(`Quadro de Contratos — ${city}`, acts);
}
function openShipping(from){
  const acts=[['Entregue de longe: a taxa é em ouro, sem risco no caminho.',null]];
  for(const r of regions.filter(r=>r.kind==='city')){ const sid=sidOf(r); if(sid===from) continue;
    for(const o of C3.orders.filter(o=>o.city===sid)){ const ok=Object.entries(o.ask).every(([k,v])=>countItem(k)>=v), fee=rint(C3.delivery.other_city_fee[0],C3.delivery.other_city_fee[1]);
      if(ok) acts.push([`${r.name}: ${orderText(o)} (taxa ${fee})`, ()=>{ if(countItem('cash')<fee){ toast('Ouro insuficiente para a taxa.'); return; } takeItem('cash',fee); for(const [k,v] of Object.entries(o.ask)) takeItem(k,v);
        const gold=rint(o.gold[0],o.gold[1]); addItem('cash',gold); addRep(sid,o.reputation); toast(`Enviado para ${r.name}: +${gold} de ouro.`); }]); } }
  if(acts.length===1) acts.push(['Você não tem nada que outra cidade esteja pedindo.',null]);
  acts.push(['Voltar',()=>openBoard(from)]); openActions('Envio de encomendas', acts);
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
OBJ_NAMES.board='Quadro de Contratos'; ACT_TYPES.add('board');
const _udL = useDevice; useDevice = function(o){ if(o.type==='board'){ if(!running||!player) return; refreshWalk(o.x,o.y); openBoard(o.sid); return; } return _udL(o); };
// desconto nas lojas da cidade em que você é conhecido
const _otL = openTrade;
openTrade = function(n){ const r=regionAt(n.x,n.y), sid=sidOf(r), v=sid?rep(sid):0, d= v>=100?.15 : v>=50?.10 : v>=25?.05 : 0;
  player.mods._baseTrade = player.mods._baseTrade ?? (player.mods.tradePrice||1); player.mods.tradePrice = player.mods._baseTrade*(1-d);
  if(d) toast(`Desconto de ${Math.round(d*100)}% em ${r.name} pela sua reputação.`); return _otL(n); };
// guardas e o senhor da cidade reconhecem você
const _talkL = talkTo;
talkTo = function(n){ const r=regionAt(n.x,n.y), sid=sidOf(r);
  if((n.role==='lord') && sid){ const v=rep(sid), city=r.name; player.gifts=player.gifts||{};
    const acts=[[`"${v>=100?`Ergue-te, ${repTitle(v,city)}. Aelória precisa de mais como tu.`:v>=50?`Teu nome corre pelas ruas de ${city}. Continua assim.`:v>=10?'Já ouvi falar de ti. Ajuda o quadro de contratos e terás minha gratidão.':'Ainda não te conheço, viajante. O quadro de contratos na praça mostra o que a cidade precisa.'}"`,null]];
    if(v>=50 && !player.gifts[sid+'50']) acts.push(['Receber o manto da cidade', ()=>{ const s=makeInst(sid==='aelia_sancta'||sid==='templo_selo'?'templar_mantle':'crimson_cloak','raro',30); s.nm=`Manto de ${city}`; s.aff=[['hp',20],['def_chance',4]]; addInst(s); player.gifts[sid+'50']=1; toast(`Você recebe o Manto de ${city}.`); }]);
    if(v>=100 && !player.gifts[sid+'100']) acts.push(['Ser sagrado cavaleiro', ()=>{ const s=makeInst('crusader_shield','lendario',50); s.uq=null; s.nm=`Escudo do Cavaleiro de ${city}`; s.aff=[['armor_pct',20],['hp',40],['def_chance',8]]; s.rar='lendario'; addInst(s); player.gifts[sid+'100']=1; player.knight=city; toast(`${n.name} toca seu ombro com a espada: Cavaleiro de ${city}!`); Journal.add('global','Arauto',`${player.name} foi sagrado Cavaleiro de ${city}!`,'#ffd84a'); }]);
    acts.push(['Retirar-se',null]); openActions(n.name, acts); return; }
  if(n.role==='guard' && sid && rep(sid)>=25 && Math.random()<.6){ openActions(`${n.name}, guarda`, [[`"${rep(sid)>=100?`Às ordens, ${repTitle(rep(sid),r.name)}!`:`Bom te ver de novo por ${r.name}.`}"`,null],['Seguir',null]]); return; }
  return _talkL(n); };
// título de cavaleiro aparece na HUD
const _rwL = refreshWho; refreshWho = function(){ _rwL(); if(player && player.knight){ const el=document.getElementById('who'); if(el) el.querySelector('small').textContent += ` · Cavaleiro de ${player.knight}`; } };
const _serL = serialize; serialize = function(){ const s=_serL(); s.rep=player.rep||{}; s.quests=player.quests||{}; s.oath=player.oath||null; s.gifts=player.gifts||{}; s.knight=player.knight||null; return s; };
const _appL = applySave; applySave = function(s){ _appL(s); Object.assign(player,{rep:s.rep||{},quests:s.quests||{},oath:s.oath||null,gifts:s.gifts||{},knight:s.knight||null}); };

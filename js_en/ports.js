'use strict';
// =====================================================================
// OUTREMER — Aelória II, fase 4: portos, barcos e ilhas
// Barqueiros nos portos levam a outros portos por moedas (como os portais).
// Porto Velame, Vila do Fiorde, Vau dos Peregrinos (vau raso no rio), Porto Ascalão;
// ilhas: Rubra (antro pirata com arena), Lazareto (médico louco), Eremita (monge que treina),
// Ilhas Geladas (serpe branca) e Ilha do Coral (navio naufragado e tesouro enterrado).
// =====================================================================
(function(){
const K=window.LMK; if(!K) return;
const {cellC,dry,spot,lm,clearNature,paint,DRESSX,ON}=K;
isoDefine('barco',(o,K2)=>{ const G=K2.G(), x=o.x, y=o.y, red=o.v==='pirata';
  const p=[K2.P(x+.05,y+.5,4),K2.P(x+.5,y+.12,0),K2.P(x+1.7,y+.12,0),K2.P(x+1.95,y+.5,6),K2.P(x+1.7,y+.88,0),K2.P(x+.5,y+.88,0)];
  K2.poly(p,'#6a4a2a','#2a1a10'); K2.poly(p.map(([a,b])=>[a,b-10]),'#8a6438','#3a2414');
  K2.box(x+.95,y+.45,.1,.1,10,90,'#4a3018'); const s0=K2.P(x+1,y+.5,96), s1=K2.P(x+1,y+.5,30);
  G.fillStyle=red?'#a8221c':'#e4dcc4'; G.beginPath(); G.moveTo(s0[0]-26,s0[1]+4); G.quadraticCurveTo(s0[0]+4,(s0[1]+s1[1])/2,s0[0]-26,s1[1]); G.lineTo(s0[0]+20,s1[1]-6); G.quadraticCurveTo(s0[0]+34,(s0[1]+s1[1])/2,s0[0]+20,s0[1]); G.fill();
  if(!red){ G.fillStyle='#a8221c'; const c=K2.P(x+1,y+.5,64); G.fillRect(c[0]-1,c[1]-12,3,22); G.fillRect(c[0]-8,c[1]-4,17,3); } });
K.SZ.barco={top:120,pad:40};
ACT_TYPES.add('barco'); OBJ_NAMES.barco='Boatman\'s boat';
if(MONS.necromancer){ MONS.medico_louco={...MONS.necromancer,name:'Mad Physician',lvl:20,boss:true,hp:[900,1100],gold:[300,500],weight:0,look:{...(MONS.necromancer.look||{}),jacket:'#d8d4c8',jacketD:'#8a8678'}}; LOOT.mon_medico_louco=LOOT.mon_necromancer; }
if(MONS.wyvern_air_boss&&typeof BEAST!=='undefined'&&BEAST.wyvern_air_boss){ BEAST.serpe_branca={...BEAST.wyvern_air_boss,c:'#e8eef4',e:'#8ad8ff'}; MONS.serpe_branca={...MONS.wyvern_air_boss,name:'White Wyvern',beast:'serpe_branca',lvl:45,boss:true,hp:[3800,4200],gold:[1500,2500],weight:0}; LOOT.mon_serpe_branca=LOOT.mon_wyvern_air_boss; }
if(MONS.boss_caranguejo_colossal){ MONS.caranguejo_coral={...MONS.boss_caranguejo_colossal,name:'Coral Crab',lvl:18,hp:[700,900],weight:0}; LOOT.mon_caranguejo_coral=LOOT.mon_boss_caranguejo_colossal; }
const PORTS={}; window.PORTS=PORTS;
const ROUTES=[['velame','eremita',10],['velame','rubra',25],['rubra','lazareto',20],['lazareto','coral',20],['coral','ascalao',25],['ascalao','geladas',40],['fiorde','geladas',35],['velame','ascalao',60],['fiorde','velame',60]];
const NAMES={velame:'Sailport',fiorde:'Fjord Village',ascalao:'Ascalon Harbor',eremita:'Hermit\'s Isle',rubra:'Red Harbor (Red Isle)',lazareto:'Lazaretto',geladas:'Frozen Isles',coral:'Coral Isle'};
// cais: ladrilho de terra junto ao mar, perto do alvo; o barco fica na água ao lado
function dock(id,tx,ty,R,pred){ let best=null,bd=1e9;
  for(let y=ty-R;y<=ty+R;y++) for(let x=tx-R;x<=tx+R;x++){ if(!dry(x,y)||objGrid[idx(x,y)]&&!K.NATURE.has(objGrid[idx(x,y)].type)) continue; if(pred&&!pred(x,y)) continue;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ let ok=true; for(let k=1;k<=3&&ok;k++) for(let w=0;w<=0;w++){ const xx=x+dx*k+(dy?w:0), yy=y+dy*k+(dx?w:0); if(!inB(xx,yy)||map[idx(xx,yy)]!==TL.SEA) ok=false; }
      if(!ok) continue; const d=Math.hypot(x-tx,y-ty); if(d<bd){ bd=d; best=[x,y,dx,dy]; } } }
  if(!best) return null; const [x,y,dx,dy]=best; clearNature(x-2,y-2,x+2,y+2);
  for(let k=1;k<=3;k++) for(let w=0;w<=1;w++){ const xx=x+dx*k+(dy?w:0), yy=y+dy*k+(dx?w:0); paint(xx,yy,TL.PIER); }
  const bx=x+dx*3+(dx<0?-2:dx>0?1:0)+(dy?2:0), by=y+dy*3+(dy<0?-1:dy>0?1:0); const b=addObj({type:'barco',x:bx,y:by,w:2,h:1,solid:true,lm:true,port:id,v:id==='rubra'?'pirata':''}); K.lm&&window.LM_LIST.push(b);
  PORTS[id]={id,name:NAMES[id],at:[x,y],boat:b}; return PORTS[id]; }
const props=(x,y,list)=>{ list.forEach(([t,dx,dy,ex])=>{ const xx=x+dx, yy=y+dy; if(dry(xx,yy)&&!objGrid[idx(xx,yy)]) addObj({type:t,x:xx,y:yy,solid:true,...(ex||{})}); }); };
const islandC=(cell,R)=>{ const [tx,ty]=cellC(cell); let sx=0,sy=0,n=0; for(let y=ty-R;y<=ty+R;y++) for(let x=tx-R;x<=tx+R;x++) if(dry(x,y)){ sx+=x; sy+=y; n++; } return n?[Math.round(sx/n),Math.round(sy/n)]:[tx,ty]; };
const SPEC={};
DRESSX.push(function(){ for(const k in PORTS) delete PORTS[k]; for(const k in SPEC) delete SPEC[k];
  // portos do continente
  { const [tx,ty]=cellC('E21'); const p=dock('velame',tx+8,ty,30); if(p) props(p.at[0],p.at[1],[['crate',-2,-1,{container:'crate'}],['keg',-2,1],['crate',2,-2,{container:'crate'}],['banner',0,-3],['brazier',-3,0],['hay',3,2]]); }
  { const [tx,ty]=cellC('P5'); const p=dock('fiorde',tx-10,ty-14,34); if(p) props(p.at[0],p.at[1],[['keg',-2,-1],['logs',2,-1],['brazier',-2,2],['crate',3,1,{container:'crate'}]]); }
  { const [tx,ty]=cellC('AC18'); const p=dock('ascalao',tx+10,ty,34); if(p) props(p.at[0],p.at[1],[['awning',-3,-2],['crate',-1,-2,{container:'crate'}],['keg',2,-2],['banner',0,-3],['brazier',-3,1]]); }
  // Vau dos Peregrinos: trecho raso do rio, atravessável a pé
  { const [tx,ty]=cellC('O26'); let bx=null,bd=1e9; for(let y=ty-30;y<=ty+30;y++) for(let x=tx-30;x<=tx+30;x++) if(inB(x,y)&&map[idx(x,y)]===TL.WATER&&regionId[idx(x,y)]===255){ const d=Math.hypot(x-tx,y-ty); if(d<bd){ bd=d; bx=[x,y]; } }
    if(bx){ const [x,y]=bx; for(let yy=y-6;yy<=y+6;yy++) for(let xx=x-6;xx<=x+6;xx++) if(inB(xx,yy)&&map[idx(xx,yy)]===TL.WATER&&Math.abs(yy-y)<=1) paint(xx,yy,TL.RUBBLE);
      const s=spot(x,y+4,2,3,10,1); if(s) lm('oratorio',s[0],s[1],2,3,{v:'pedra',vau:1}); props(x,y-3,[['tent',3,0],['campfire',5,1],['bench',2,2],['banner',-3,-1]]); SPEC.vau=[x,y]; } }
  // ilhas
  { const p=dock('eremita',...islandC('B23',22),20); if(p){ const [x,y]=islandC('B23',22); const s=spot(x,y,2,3,6,1); if(s){ const o=lm('oratorio',s[0],s[1],2,3,{v:'musgo',eremita:1}); } props(x,y+3,[['hay',2,0],['hay',3,0],['plant',2,1],['plant',3,1],['plant',4,1]]); } }
  { const p=dock('rubra',...islandC('L31',30),24); if(p){ const [x,y]=islandC('L31',30); for(let k=0;k<14;k++){ const a=k/14*6.283; props(x,y,[['pillar',Math.round(Math.cos(a)*6),Math.round(Math.sin(a)*4)]]); } props(x,y,[['awning',-8,-5],['awning',-6,-6],['crate',-9,-3,{container:'crate'}],['keg',-7,-3],['brazier',0,-5],['brazier',0,5],['banner',8,-4]]); SPEC.rubra=[x,y]; } }
  { const p=dock('lazareto',...islandC('U31',30),16); if(p){ const [x,y]=islandC('U31',30); for(const [v,dx,dy,w,h] of [['cupula',-2,-2,3,3],['torre',3,-1,2,2]]){ const s=spot(x+dx,y+dy,w,h,4,0); if(s){ const o=addObj({type:'ruina',v,x:s[0],y:s[1],w,h,solid:true,lm:true}); window.LM_LIST.push(o); } } SPEC.lazareto=[x,y+3]; props(x,y,[['chest',0,4,{container:'d_velia'}]]); } }
  { const p=dock('geladas',...islandC('AE3',30),20); if(p){ const [x,y]=islandC('AE3',30); for(const [v,dx,dy,w,h] of [['arco',-2,0,3,1],['torre',2,-2,2,2]]){ const s=spot(x+dx,y+dy,w,h,4,0); if(s){ const o=addObj({type:'ruina',v,x:s[0],y:s[1],w,h,solid:true,lm:true}); window.LM_LIST.push(o); } } SPEC.geladas=[x,y]; } }
  { const p=dock('coral',...islandC('AE31',30),16); if(p){ const [x,y]=islandC('AE31',30); const s=spot(x+2,y-1,1,1,5,0); if(s) lm('mastro',s[0],s[1],1,1,{naufragio:1}); props(x,y,[['crate',3,1,{container:'crate'}],['keg',4,2],['crate',-2,2,{container:'crate'}]]); SPEC.coral=[x-2,y]; SPEC.tesouro=[x-3,y+1]; } }
});
// barqueiro
function sail(to,cost){ if(countItem('cash')<cost){ toast(`The trip costs ${cost} coins.`); return; } takeItem('cash',cost); const P=PORTS[to]; player.x=P.at[0]*T+8; player.y=P.at[1]*T+12; search=null;
  for(const a of animals) if(a.tamed&&!a.stay){ a.x=player.x+10; a.y=player.y; } toast(`The boatman rows and the sails fill. You arrive at ${P.name}.`); }
const _udP=useDevice;
useDevice=function(o){
  if(o&&o.type==='barco'){ const id=o.port, acts=[[`Boatman of ${NAMES[id]}: "Where to, pilgrim?"`,null]];
    for(const [a,b,c] of ROUTES){ const to=a===id?b:b===id?a:null; if(to&&PORTS[to]) acts.push([`${NAMES[to]} (${c} coins)`,()=>sail(to,c)]); }
    acts.push(['Close',null]); openActions(NAMES[id],acts); return; }
  if(o&&o.type==='oratorio'&&o.vau){ openActions('Pilgrims\' Hostel',[[ 'Chapel and hostel by the ford. Pilgrims rest before going on to Acre.',null],['Rest at the hostel',()=>{ player.health=player.maxHealth; player.stamina=100; player.hunger=Math.max(player.hunger||0,80); player.thirst=Math.max(player.thirst||0,80); try{ saveGame(true); }catch(e){} toast('You rest, eat and pray. Full health and game saved.'); }],['Close',null]]); return; }
  if(o&&o.type==='oratorio'&&o.eremita){ openActions('Hermit\'s Hermitage',[[ 'An old monk tends the garden and teaches those with patience.',null],['Train with the monk (50 coins)',()=>{ if(countItem('cash')<50){ toast('The monk asks 50 coins for the hermitage.'); return; } takeItem('cash',50); const ks=Object.keys(player.skills||{}); const k=ks.sort((a,b)=>(player.skills[a]||0)-(player.skills[b]||0))[0]; if(k){ for(let i=0;i<5;i++) try{ gainSkill(k,3); }catch(e){} toast(`The monk trains your weakest skill (${k}).`); } }],['Close',null]]); return; }
  if(o&&o.type==='mastro'&&o.naufragio){ openActions('Shipwreck',[[ 'The hull of a merchant galley, broken on the rocks. Someone marked an X in the sand a few steps away.',null],['Dig at the X',()=>{ if(!hasItem('shovel')){ toast('You need a shovel.'); return; } if(player.coral===day){ toast('There is nothing left here today.'); return; } player.coral=day; const g=200+Math.floor(Math.random()*300); addItem('cash',g); if(ITEMS.gem) addItem('gem',2); toast(`Buried treasure! ${g} coins and gems.`); }],['Close',null]]); return; }
  return _udP(o); };
// chefes das ilhas
let pT=0;
const _updP=update;
update=function(dt){ _updP(dt); if(!running||!player||!ON()) return; pT-=dt; if(pT>0) return; pT=2; const px=player.x/T, py=player.y/T;
  for(const [k,kind,msg] of [['lazareto','medico_louco','The Mad Physician leaves the hospital dragging a rusty scalpel.'],['geladas','serpe_branca','A white shadow covers the sun: the White Wyvern descends from the sky!'],['coral','caranguejo_coral','The sand moves: a huge crab crawls out from under the hull!']]){
    const S=SPEC[k]; if(!S||!MONS[kind]) continue; const st=SPEC['_'+k]||(SPEC['_'+k]={cd:0}); st.cd-=2; if(st.r&&!raiders.includes(st.r)){ st.r=null; st.cd=900; }
    if(!st.r&&st.cd<=0&&Math.hypot(px-S[0],py-S[1])<18){ st.r=spawnAt(kind,S[0]*T,S[1]*T,{state:'chase',foe:player}); if(st.r) toast(msg); } }
  const R=SPEC.rubra; if(R&&Math.hypot(px-R[0],py-R[1])<14){ const n=raiders.filter(r=>r.mon==='bandit'&&r.rubra).length; if(n<3&&MONS.bandit) spawnAt('bandit',(R[0]+(Math.random()-.5)*8)*T,(R[1]+(Math.random()-.5)*6)*T,{rubra:1,state:'chase',foe:player}); } };
const _serP=serialize; serialize=function(){ const s=_serP(); if(player) s.coral=player.coral||0; return s; };
const _asP=applySave; applySave=function(s){ _asP(s); player.coral=s.coral||0; };
})();

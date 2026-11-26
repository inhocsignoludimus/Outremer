'use strict';
// =====================================================================
// OUTREMER — Aelória II, fase 3: as masmorras
// Poço dos Hereges (modelo), Catacumbas da Geada, Fenda de Prata (atalho Aurélia–Pedralta),
// Ossário dos Templários, Necrópole das Areias (armadilhas de areia) e Vélia Submersa.
// Os andares ficam numa faixa subterrânea abaixo do mapa (y ≥ 1330), fora da vista.
// Cada masmorra: entrada desenhada no mundo, 1–2 andares, monstros próprios, baús,
// um chefe no salão final com espólio garantido.
// =====================================================================
(function(){
const K=window.LMK; if(!K) return;
const {cellC,dry,fits,spot,lm,clearNature,paint,AREAS,ANIMX,DRESSX,ON,night,SLOT}=K;
const TW=48, TH=24;

// ---------- monstros novos (clones dos que já existem, com outro nome e cor) ----------
const clone=(k,base,o)=>{ if(!MONS[base]) return; MONS[k]={...MONS[base],weight:0,...o}; if(o.look) MONS[k].look={...(MONS[base].look||{}),...o.look}; if(!LOOT['mon_'+k]) LOOT['mon_'+k]=LOOT['mon_'+base]||LOOT.mon_skeleton; };
if(typeof BEAST!=='undefined'){ if(BEAST.wolf) BEAST.rato={...BEAST.wolf,c:'#5a4a3e',s:.75}; if(BEAST.fire_ant) BEAST.escaravelho={...BEAST.fire_ant,c:'#24382e',e:'#7ad0a0'}; }
clone('rato_gigante','wolf',{name:'Rato Gigante',lvl:2,hp:[16,24],beast:BEAST&&BEAST.rato?'rato':'wolf',gold:[0,0]});
clone('cultista','necromancer_apprentice',{name:'Cultista Herege',lvl:4,look:{jacket:'#3a1a1a',jacketD:'#220e0e',pants:'#1a1212'}});
clone('mestre_herege','necromancer',{name:'Mestre dos Hereges',lvl:9,boss:true,hp:[420,480],gold:[150,260],scale:1.3,look:{jacket:'#5a0e0e',jacketD:'#300808'}});
clone('draugr','frozen_zombie',{name:'Draugr',lvl:12,hp:[140,180]});
clone('rei_draugr','boss_jarl_morto',{name:'Rei-Draugr',lvl:24,boss:true,hp:[1500,1700],gold:[500,800],scale:1.5});
clone('golem_prata','boulder',{name:'Golem de Pedra',lvl:10,hp:[200,260]});
clone('templario_morto','skeleton_knight',{name:'Templário Morto-Vivo',lvl:14,hp:[170,220],look:{jacket:'#cfc6b2',jacketD:'#8a8270'}});
clone('grao_mestre','skeleton_knight_boss',{name:'Grão-Mestre Amaldiçoado',lvl:28,boss:true,hp:[2000,2300],gold:[700,1100],scale:1.5,look:{jacket:'#d8d0bc',jacketD:'#8a2018'}});
clone('mumia','zombie_rotting',{name:'Múmia',lvl:13,hp:[150,200],look:{skin:'#cfc2a0',hair:'#cfc2a0',jacket:'#d8ccaa',jacketD:'#a89a78',pants:'#c8bc98',boot:'#a89a78'}});
clone('escaravelho','fire_ant',{name:'Escaravelho',lvl:11,hp:[60,80],beast:BEAST&&BEAST.escaravelho?'escaravelho':'fire_ant'});
clone('califa','necromancer',{name:'Califa Sem Nome',lvl:30,boss:true,hp:[2200,2500],gold:[900,1400],scale:1.5,look:{jacket:'#c8a040',jacketD:'#6a4a10',skin:'#cfc2a0'}});
clone('afogado','zombie_dark',{name:'Afogado',lvl:16,hp:[170,220],look:{skin:'#6a8a7a',jacket:'#2a3a34',jacketD:'#1a2420'}});
clone('bispo_afogado','boss_senhor_do_pantano',{name:'Bispo Afogado',lvl:34,boss:true,hp:[2600,3000],gold:[1200,1800],scale:1.6});
if(LOOT.mon_rato_gigante===LOOT.mon_wolf) LOOT.mon_rato_gigante=LT(1,[['hide',3],['bone',2]],.5);

// ---------- desenhos novos (isométrico) ----------
const SAND='#b89a6a', SANDL='#d8bc88';
isoDefine('poco',(o,K2)=>{ const G=K2.G(), cx=o.x+1, cy=o.y+1;
  K2.cyl(cx,cy,.9,0,22,'#7a746a','#3a342e'); const c=K2.P(cx,cy,22); G.fillStyle='#0a0806'; G.beginPath(); G.ellipse(c[0],c[1],28,14,0,0,7); G.fill();
  for(let k=0;k<14;k++){ const a=k/14*6.283, p=K2.P(cx+Math.cos(a)*.9,cy+Math.sin(a)*.9,22); G.fillStyle='#5a544a'; G.fillRect(p[0]-1,p[1]-1,3,2); }
  K2.box(cx-.95,cy-.06,.12,.12,0,62,'#5a3a20'); K2.box(cx+.83,cy-.06,.12,.12,0,62,'#5a3a20'); K2.box(cx-.95,cy-.06,1.9,.12,62,6,'#6a4a28');
  const r0=K2.P(cx,cy,62), r1=K2.P(cx,cy,30); G.strokeStyle='#c8b080'; G.lineWidth=1; G.beginPath(); G.moveTo(r0[0],r0[1]); G.lineTo(r1[0],r1[1]); G.stroke();
  K2.box(cx-.12,cy-.12,.24,.24,22,10,'#6a4a28'); });
isoDefine('arco_gelo',(o,K2)=>{ const G=K2.G();
  for(let k=0;k<o.w;k++) K2.blob(o.x+k+.5,o.y+.6,1.0,110+th(k,o.x,1)*40,[[110,114,122],[214,220,230]],k+o.x,{rough:.35,snow:true});
  const m=K2.P(o.x+o.w/2,o.y+1.9,0), gr=G.createLinearGradient(0,m[1]-80,0,m[1]); gr.addColorStop(0,'rgba(200,236,255,.95)'); gr.addColorStop(1,'rgba(120,190,230,.9)');
  G.fillStyle=gr; G.beginPath(); G.moveTo(m[0]-34,m[1]); G.lineTo(m[0]-34,m[1]-46); G.ellipse(m[0],m[1]-46,34,34,0,Math.PI,0); G.lineTo(m[0]+34,m[1]); G.fill();
  G.fillStyle='#0c1420'; G.beginPath(); G.moveTo(m[0]-22,m[1]); G.lineTo(m[0]-22,m[1]-40); G.ellipse(m[0],m[1]-40,22,22,0,Math.PI,0); G.lineTo(m[0]+22,m[1]); G.fill();
  for(let k=0;k<12;k++){ G.fillStyle='rgba(230,248,255,.9)'; G.fillRect(m[0]-30+k*5,m[1]-76+Math.abs(k-6)*3,2,6+(k%3)*4); }
  for(const s of [-1,1]){ const sx=o.x+o.w/2+s*1.55, sy=o.y+1.4; K2.box(sx-.3,sy-.3,.6,.6,0,14,'#8a8e96'); K2.box(sx-.22,sy-.22,.44,.44,14,62,'#a8b0ba',{top:'#d8e4ee'}); K2.box(sx-.16,sy-.16,.32,.32,76,22,'#b8c0ca',{top:'#e8f0f8'});
    const c=K2.P(sx,sy+.16,98); G.fillStyle='#c8a840'; G.fillRect(c[0]-6,c[1]-6,12,4); G.fillRect(c[0]-6,c[1]-10,3,5); G.fillRect(c[0]-1,c[1]-11,3,6); G.fillRect(c[0]+4,c[1]-10,3,5); } });
isoDefine('boca_mina',(o,K2)=>{ const G=K2.G(); for(let k=0;k<o.w;k++) K2.blob(o.x+k+.5,o.y+.6,1.0,90+th(k,o.y,2)*30,[[92,88,82],[170,164,152]],k*3+o.y,{rough:.38});
  const m=K2.P(o.x+o.w/2,o.y+1.9,0); G.fillStyle='#0c0806'; G.fillRect(m[0]-16,m[1]-38,32,38); G.fillStyle='#6a4a28'; G.fillRect(m[0]-20,m[1]-42,40,6); G.fillRect(m[0]-20,m[1]-42,6,42); G.fillRect(m[0]+14,m[1]-42,6,42);
  G.fillStyle='#d8dce4'; for(let k=0;k<6;k++) G.fillRect(m[0]-40+th(k,o.x,4)*80|0,m[1]-60-th(k,o.y,5)*40|0,3,2);
  G.strokeStyle='#5a5a5e'; G.lineWidth=2; G.beginPath(); G.moveTo(m[0]-8,m[1]); G.lineTo(m[0]-30,m[1]+16); G.moveTo(m[0]+8,m[1]); G.lineTo(m[0]-12,m[1]+22); G.stroke(); });
isoDefine('portao_ossos',(o,K2)=>{ const G=K2.G(); for(let k=0;k<o.w;k++) K2.blob(o.x+k+.5,o.y+.6,1.1,70+th(k,o.x,6)*30,[[110,60,40],[176,104,70]],k*5+o.x,{rough:.4});
  K2.box(o.x+.8,o.y+1.2,o.w-1.6,.5,0,70,'#6a645a',{top:'#7a746a'}); const m=K2.P(o.x+o.w/2,o.y+1.7,0);
  G.fillStyle='#0a0806'; G.beginPath(); G.moveTo(m[0]-16,m[1]); G.lineTo(m[0]-16,m[1]-30); G.ellipse(m[0],m[1]-30,16,16,0,Math.PI,0); G.lineTo(m[0]+16,m[1]); G.fill();
  for(let k=0;k<44;k++){ const p=K2.P(o.x+.85+th(k,1,1)*(o.w-1.7),o.y+1.7,6+th(k,2,2)*60); if(Math.abs(p[0]-m[0])<18&&p[1]>m[1]-46) continue; G.fillStyle='#e2d8c0'; G.beginPath(); G.ellipse(p[0],p[1],3,2.6,0,0,7); G.fill(); G.fillStyle='#2a2018'; G.fillRect(p[0]-2,p[1]-1,1,1); G.fillRect(p[0]+1,p[1]-1,1,1); }
  for(const s of [-1,1]){ const p=K2.P(o.x+o.w/2+s*1.6,o.y+1.9,0); G.fillStyle='#4a3420'; G.fillRect(p[0]-1,p[1]-96,3,96); G.fillRect(p[0]-12,p[1]-92,25,3);
    G.fillStyle='#e4dccb'; G.beginPath(); G.moveTo(p[0]-11,p[1]-89); G.lineTo(p[0]+12,p[1]-89); G.lineTo(p[0]+10,p[1]-50); G.lineTo(p[0]+4,p[1]-56); G.lineTo(p[0]-2,p[1]-46); G.lineTo(p[0]-7,p[1]-58); G.lineTo(p[0]-11,p[1]-52); G.fill();
    G.fillStyle='#a8221c'; G.fillRect(p[0]-1,p[1]-84,3,24); G.fillRect(p[0]-8,p[1]-76,17,3); } });
isoDefine('fachada',(o,K2)=>{ const G=K2.G(); for(let k=0;k<o.w;k++) K2.blob(o.x+k+.5,o.y+.5,1.15,210+th(k,o.x,8)*40,[[150,112,70],[226,190,140]],k*7+o.y,{rough:.3,strata:true});
  K2.box(o.x+1,o.y+1.3,o.w-2,.35,0,170,SAND,{top:SANDL}); const f=(u,z)=>K2.P(u,o.y+1.65,z);
  for(let k=0;k<5;k++){ const u=o.x+1.3+k*(o.w-2.6)/4, a=f(u,0), b=f(u,150); G.fillStyle='#c8aa76'; G.fillRect(a[0]-4,b[1],8,a[1]-b[1]); G.fillStyle='#8a6a40'; G.fillRect(a[0]+3,b[1],2,a[1]-b[1]); }
  const t0=f(o.x+1,150), t1=f(o.x+o.w-1,150); G.fillStyle='#a8895a'; G.beginPath(); G.moveTo(t0[0],t0[1]); G.lineTo(t1[0],t1[1]); G.lineTo(t1[0],t1[1]-14); G.lineTo(t0[0],t0[1]-14); G.fill();
  const d=f(o.x+o.w/2,0); G.fillStyle='#120c06'; G.fillRect(d[0]-12,d[1]-60,24,60); G.fillStyle='#8a6a40'; G.fillRect(d[0]-16,d[1]-66,32,6);
  for(let k=0;k<6;k++){ const p=f(o.x+o.w/2-.4+k*.16,0); G.fillStyle='#b8986a'; G.fillRect(p[0]-14,p[1]+k*2,28,2); }
  for(const s of [-1,1]){ const u=o.x+o.w/2+s*(o.w/2-.4); K2.box(u-.45,o.y+1.6,.9,.8,0,30,SAND,{top:SANDL}); K2.box(u-.35,o.y+1.65,.7,.5,30,50,'#c8aa76',{top:'#dcc090'}); K2.box(u-.25,o.y+1.75,.5,.4,80,26,'#c8aa76',{top:'#e0c494'});
    const h=K2.P(u,o.y+2.15,96); G.fillStyle='#8a6a40'; G.fillRect(h[0]-4,h[1],8,10); } });
isoDefine('ruina',(o,K2)=>{ const G=K2.G(), cx=o.x+o.w/2, cy=o.y+o.h/2, st='#7a7e6e', gl='#5a6a4a';
  if(o.v==='cupula'){ K2.cyl(cx,cy,1.2,0,60,st,gl); const t=K2.P(cx,cy,60); G.fillStyle='#6a7a5a'; G.beginPath(); G.ellipse(t[0],t[1],40,40,0,Math.PI,0); G.fill(); G.fillStyle='#4a5a3a'; G.beginPath(); G.ellipse(t[0]+8,t[1]-4,30,30,0,Math.PI*1.2,Math.PI*1.9); G.fill(); G.fillStyle='#1a1a14'; G.fillRect(t[0]-22,t[1]-14,8,10); }
  else if(o.v==='torre'){ K2.box(cx-.6,cy-.6,1.2,1.2,0,150,st,{top:'#8a8e7e'}); for(let k=0;k<3;k++){ const w=K2.P(cx,cy+.6,40+k*38); G.fillStyle='#14120e'; G.fillRect(w[0]-3,w[1]-12,6,12); } const t=K2.P(cx,cy,150); G.fillStyle='#5a6a4a'; G.beginPath(); G.moveTo(t[0]-26,t[1]); G.lineTo(t[0],t[1]-40); G.lineTo(t[0]+26,t[1]); G.fill(); }
  else if(o.v==='arco'){ K2.box(o.x+.1,cy-.3,.6,.6,0,80,st); K2.box(o.x+o.w-.7,cy-.3,.6,.6,0,80,st); K2.box(o.x+.1,cy-.3,o.w-.2,.6,80,18,st,{top:'#8a8e7e'}); }
  else { // catedral meio afundada
    K2.box(o.x+.2,o.y+.2,o.w-.4,o.h-.4,0,90,st,{top:'#6a6e60'}); K2.cyl(cx,cy-.3,1.3,90,30,st); const t=K2.P(cx,cy-.3,120); G.fillStyle='#5e6e50'; G.beginPath(); G.ellipse(t[0],t[1],44,44,0,Math.PI,0); G.fill();
    const c=K2.P(cx,cy-.3,164); G.fillStyle='#c8b070'; G.fillRect(c[0]-1,c[1]-18,3,18); G.fillRect(c[0]-6,c[1]-13,13,3);
    const d=K2.P(cx,o.y+o.h-.2,0); G.fillStyle='#120c06'; G.beginPath(); G.moveTo(d[0]-14,d[1]); G.lineTo(d[0]-14,d[1]-30); G.ellipse(d[0],d[1]-30,14,14,0,Math.PI,0); G.lineTo(d[0]+14,d[1]); G.fill(); }
  for(let k=0;k<40;k++){ const p=K2.P(o.x+th(k,o.x,1)*o.w,o.y+o.h,th(k,o.y,2)*70); G.fillStyle=th(k,3,3)<.5?'#4a5a2a':'#3a4a22'; G.fillRect(p[0]|0,p[1]|0,2,2+(th(k,4,4)*5|0)); }
  const w0=K2.P(o.x-.2,o.y+o.h+.1,0); G.fillStyle='rgba(60,80,50,.5)'; G.fillRect(w0[0],w0[1]-3,(o.w+o.h)*TW/2,3); });
isoDefine('sarcofago',(o,K2)=>{ K2.box(o.x+.1,o.y+.25,.8,.5,0,14,'#7a766e',{top:'#8a867e'}); K2.box(o.x+.06,o.y+.2,.88,.6,14,5,'#8a867e',{top:'#9a968e'}); const G=K2.G(), p=K2.P(o.x+.5,o.y+.5,19); G.fillStyle='#5a564e'; G.fillRect(p[0]-1,p[1]-5,2,10); G.fillRect(p[0]-5,p[1]-2,10,2); });
isoDefine('ossos',(o,K2)=>{ const G=K2.G(); for(let k=0;k<12;k++){ const p=K2.P(o.x+.15+th(k,o.x,1)*.7,o.y+.15+th(k,o.y,2)*.7,th(k,3,3)*6); G.fillStyle=k%3?'#e0d6be':'#c8bea6'; G.fillRect(p[0]|0,p[1]|0,4+(th(k,5,5)*4|0),2); } const c=K2.P(o.x+.5,o.y+.5,8); G.fillStyle='#e8dfc8'; G.beginPath(); G.ellipse(c[0],c[1],4,3.5,0,0,7); G.fill(); G.fillStyle='#2a2018'; G.fillRect(c[0]-2,c[1]-1,1,1); G.fillRect(c[0]+1,c[1]-1,1,1); });
isoDefine('estatua_rei',(o,K2)=>{ const x=o.x+.5, y=o.y+.5; K2.box(x-.35,y-.35,.7,.7,0,12,'#7a7e86'); K2.box(x-.25,y-.2,.5,.4,12,46,'#a8b0ba',{top:'#c8d0da'}); K2.box(x-.16,y-.16,.32,.32,58,16,'#b8c0ca',{top:'#e0e8f0'}); const G=K2.G(), c=K2.P(x,y,76); G.fillStyle='#c8a840'; G.fillRect(c[0]-5,c[1]-4,10,3); G.fillRect(c[0]-5,c[1]-7,2,4); G.fillRect(c[0]+3,c[1]-7,2,4); });
isoDefine('veio_prata',(o,K2)=>{ K2.blob(o.x+.5,o.y+.55,.48,26,[[80,78,76],[150,148,146]],o.x*3+o.y,{rough:.4}); const G=K2.G(); for(let k=0;k<7;k++){ const p=K2.P(o.x+.3+th(k,o.x,1)*.4,o.y+.6,6+th(k,o.y,2)*18); G.fillStyle=k%2?'#e8ecf4':'#b8c4d4'; G.fillRect(p[0]|0,p[1]|0,2,2); } });
ACT_TYPES.add('poco'); ACT_TYPES.add('arco_gelo'); ACT_TYPES.add('boca_mina'); ACT_TYPES.add('portao_ossos'); ACT_TYPES.add('fachada'); ACT_TYPES.add('ruina'); ACT_TYPES.add('veio_prata');
Object.assign(OBJ_NAMES,{poco:'Poço dos Hereges',arco_gelo:'Catacumbas da Geada',boca_mina:'Fenda de Prata',portao_ossos:'Ossário dos Templários',fachada:'Necrópole das Areias',ruina:'Ruína de Vélia',sarcofago:'Sarcófago',ossos:'Ossos',estatua_rei:'Estátua de rei',veio_prata:'Veio de prata'});
Object.assign(K.SZ,{poco:{top:90,pad:30},arco_gelo:{top:200,pad:60},boca_mina:{top:150,pad:50},portao_ossos:{top:150,pad:60},fachada:{top:300,pad:60},ruina:{top:200,pad:60}});

// ---------- geradores de andar ----------
// cripta: salas retangulares ligadas por corredores; fora delas, o vazio
function crypt(R,seed,T0){ const rnd=mulberry32(seed), rooms=[];
  for(let y=R.y;y<R.y+R.h;y++) for(let x=R.x;x<R.x+R.w;x++){ const i=idx(x,y); map[i]=TL.CHASM; fden[i]=0; reserved[i]=1; }
  for(let t=0;t<300&&rooms.length<9;t++){ const w=9+(rnd()*9|0), h=7+(rnd()*6|0), x=R.x+3+(rnd()*(R.w-w-6)|0), y=R.y+3+(rnd()*(R.h-h-6)|0);
    if(rooms.some(r=>x<r.x+r.w+3&&x+w+3>r.x&&y<r.y+r.h+3&&y+h+3>r.y)) continue; rooms.push({x,y,w,h}); }
  rooms.sort((a,b)=>a.x-b.x);
  const fl=(x,y)=>{ const i=idx(x,y); map[i]=T0.floor[(th(x,y,seed)*T0.floor.length)|0]; };
  for(const r of rooms) for(let y=r.y;y<r.y+r.h;y++) for(let x=r.x;x<r.x+r.w;x++) fl(x,y);
  for(let k=1;k<rooms.length;k++){ const a=rooms[k-1], b=rooms[k], ax=a.x+a.w/2|0, ay=a.y+a.h/2|0, bx=b.x+b.w/2|0, by=b.y+b.h/2|0;
    for(let x=Math.min(ax,bx);x<=Math.max(ax,bx);x++) for(let d=-1;d<=1;d++) fl(x,ay+d); for(let y=Math.min(ay,by);y<=Math.max(ay,by);y++) for(let d=-1;d<=1;d++) fl(bx+d,y); }
  for(let y=R.y;y<R.y+R.h;y++) for(let x=R.x;x<R.x+R.w;x++){ const i=idx(x,y); if(map[i]!==TL.CHASM) continue; let near=false; for(let dy=-1;dy<=1&&!near;dy++) for(let dx=-1;dx<=1;dx++){ const t=map[idx(x+dx,y+dy)]; if(t!==TL.CHASM&&t!==TL.WALL&&t!==TL.ROCK){ near=true; break; } }
    if(near){ if(T0.wall==='rock') map[i]=TL.ROCK; else { map[i]=TL.WALL; mat[i]=T0.mat; } } }
  const c=r=>[r.x+r.w/2|0,r.y+r.h/2|0]; return {start:c(rooms[0]),end:c(rooms[rooms.length-1]),rooms}; }
function cave(R,seed,T0){ const c=carveCave(R,seed,[]); for(let y=R.y;y<R.y+R.h;y++) for(let x=R.x;x<R.x+R.w;x++){ const i=idx(x,y); if(map[i]!==TL.ROCK) map[i]=T0.floor[(th(x,y,seed)*T0.floor.length)|0]; }
  const rooms=[]; for(let k=0;k<c.path.length;k+=16){ const [px,py]=c.path[k]; rooms.push({x:R.x+px-3,y:R.y+py-3,w:7,h:7}); } return {start:c.start,end:c.end,rooms,path:c.path.map(([x,y])=>[R.x+x,R.y+y])}; }
const freeAt=(x,y)=>inB(x,y)&&walk!==null&&!objGrid[idx(x,y)]&&map[idx(x,y)]!==TL.CHASM&&map[idx(x,y)]!==TL.WALL&&map[idx(x,y)]!==TL.ROCK&&map[idx(x,y)]!==TL.WATER;
const okT=(x,y)=>inB(x,y)&&!objGrid[idx(x,y)]&&![TL.CHASM,TL.WALL,TL.ROCK,TL.WATER,TL.SEA].includes(map[idx(x,y)]);
const put=(o)=>okT(o.x,o.y)?addObj({solid:true,...o}):null;

// ---------- montagem ----------
const DUN=[]; window.DUNGEONS=DUN; let slotK=2, lvK=10;
function buildDungeon(D,entry){ D.R=[]; let prev=null;
  D.levels.forEach((L,i)=>{ const R={...SLOT(slotK++),lv:lvK++,name:L.name,cap:L.cap||5,dun:D.id}; DG.more.push(R); DG_MONS[R.lv]=L.mons.filter(k=>MONS[k]); D.R.push(R);
    const g=(L.gen==='cave'?cave:crypt)(R,D.seed+i*101,L.theme); R.g=g;
    g.rooms.forEach((r,k)=>{ if(k%2===0) put({type:'brazier',x:r.x+1,y:r.y+1}); if(L.deco) L.deco(r,k,g); });
    const last=i===D.levels.length-1, [ex,ey]=g.end;
    if(!last){ put({type:'chest',x:ex+2,y:ey+1,container:D.loot}); }
    else { R.boss={kind:D.boss,x:ex,y:ey}; put({type:'chest',x:ex+3,y:ey-2,container:D.loot+'_final'}); }
    const [sx,sy]=g.start; const up=addObj({type:'stairs_up',x:sx,y:sy-1,solid:true});
    STAIRS.push({at:[sx,sy-1],to:prev?prev.down:entry.back,msg:prev?`Você sobe para ${prev.name}.`:D.exitMsg});
    R.arrive=[sx+1,sy+1];
    if(prev) STAIRS.push({at:prev.downAt,to:R.arrive,msg:`Você desce: ${R.name}.`});
    if(!last){ const st=addObj({type:'stairs_down',x:ex,y:ey-1,solid:true}); R.downAt=[ex,ey-1]; R.down=[ex-1,ey+1]; }
    prev=R; });
  D.enter=D.R[0].arrive; }
function entrance(type,cell,w,h,extra,R0){ const [tx,ty]=cellC(cell); const p=spot(tx,ty,w,h,R0||28,1,extra&&extra.score); if(!p) return null; const o=lm(type,p[0],p[1],w,h,extra);
  const front=[p[0]+(w/2|0),p[1]+h]; for(let y=front[1];y<front[1]+3;y++) for(let x=front[0]-1;x<=front[0]+1;x++) if(dry(x,y)) clearNature(x,y,x,y); o.back=front; return o; }
const THEME={
  cripta:{floor:[TL.CONC,TL.WALK,TL.CONC],wall:'wall',mat:6},
  gelo:{floor:[TL.ICE,TL.SNOW,TL.ICE],wall:'rock'},
  mina:{floor:[TL.DIRT,TL.RUBBLE,TL.DIRT],wall:'rock'},
  ossario:{floor:[TL.RUBBLE,TL.CONC,TL.DIRT],wall:'wall',mat:9},
  tumba:{floor:[TL.SAND,TL.KTILE,TL.SAND],wall:'wall',mat:4},
  afogada:{floor:[TL.SWAMP,TL.CONC,TL.RUBBLE],wall:'wall',mat:10} };
const BOOK='"Os hereges deste poço juravam que a Ordem do Templo não morreu nos ermos: que seus cavaleiros ainda montam guarda sob a terra vermelha, esperando um grão-mestre que nunca descansou. Diz-se que só a coragem abre aquele portão." — anotação na margem: "Ossário. Leste. Não vá só."';
DRESSX.push(function(){ DUN.length=0; slotK=2; lvK=10;
  // 1. Poço dos Hereges (modelo)
  { const o=entrance('poco','I25',2,2); if(o){ const D={id:'poco',name:'Poço dos Hereges',seed:4401,boss:'mestre_herege',loot:'d_poco',exitMsg:'Você sobe pela corda e sai do poço, de volta ao campo.',
      levels:[{name:'Poço dos Hereges · Celas',gen:'crypt',theme:THEME.cripta,mons:['rato_gigante','rato_gigante','cultista','skeleton','zombie'],cap:5,deco:(r,k)=>{ if(k%3===1) for(let j=0;j<3;j++) put({type:'ossos',x:r.x+2+j*2,y:r.y+r.h-2}); }},
             {name:'Poço dos Hereges · Biblioteca Proibida',gen:'crypt',theme:THEME.cripta,mons:['cultista','cultista','rato_gigante','skeleton_mage'],cap:5,deco:(r,k,g)=>{ if(k===1){ for(let j=0;j<r.w-2;j+=2) put({type:'bookcase',x:r.x+1+j,y:r.y}); put({type:'diario',x:r.x+r.w/2|0,y:r.y+r.h/2|0,title:'Livro proibido',text:BOOK,onRead:()=>{ if(!player.livroHereges){ player.livroHereges=1; toast('Missão: o livro fala de um Ossário nos ermos do leste.'); try{ Journal.add('system','','Missão: encontrar o Ossário dos Templários, nos ermos do leste.'); }catch(e){} } }}); } if(k%2===0) put({type:'candle',x:r.x+r.w-2,y:r.y+1}); }}]};
      buildDungeon(D,o); o.dun=D; DUN.push(D); } }
  // 2. Catacumbas da Geada
  { const o=entrance('arco_gelo','C5',4,2,{score:(x,y)=>{ let s=1e9; for(let dy=-8;dy<=8;dy+=2) for(let dx=-8;dx<=8;dx+=2) if(inB(x+dx,y+dy)&&map[idx(x+dx,y+dy)]===TL.SEA) s=Math.min(s,Math.hypot(dx,dy)); return (s>6?20:0)+Math.hypot(x-cellC('C5')[0],y-cellC('C5')[1])*.3; }},34);
    if(o){ const D={id:'geada',name:'Catacumbas da Geada',seed:5502,boss:'rei_draugr',loot:'d_geada',exitMsg:'Você sobe pelo arco de gelo. O mar ruge lá embaixo.',
      levels:[{name:'Catacumbas da Geada · Galerias',gen:'cave',theme:THEME.gelo,mons:['draugr','frozen_zombie','skeleton_mage_ice','skeleton_knight'],cap:6,deco:(r,k)=>{ if(k%2) put({type:'estatua_rei',x:r.x+1,y:r.y+r.h-2}); }},
             {name:'Catacumbas da Geada · Salão dos Reis',gen:'crypt',theme:{floor:[TL.ICE,TL.ICE,TL.CONC],wall:'wall',mat:7},mons:['draugr','skeleton_mage_ice','frozen_zombie'],cap:6,aurora:true,deco:(r,k)=>{ put({type:'estatua_rei',x:r.x+1,y:r.y+1}); put({type:'estatua_rei',x:r.x+r.w-2,y:r.y+1}); if(k%2) put({type:'sarcofago',x:r.x+r.w/2|0,y:r.y+r.h-2}); }}]};
      buildDungeon(D,o); o.dun=D; DUN.push(D); } }
  // 3. Fenda de Prata: entra do lado de Aurélia, sai do lado de Pedralta
  { const a=entrance('boca_mina','N14',3,2), b=a&&(()=>{ const [tx,ty]=[655,470]; const p=spot(tx,ty,3,2,30,1); if(!p) return null; const o=lm('boca_mina',p[0],p[1],3,2,{v:'leste'}); o.back=[p[0]+1,p[1]+2]; return o; })();
    if(a&&b){ const D={id:'fenda',name:'Fenda de Prata',seed:6603,boss:'golem_prata',loot:'d_fenda',exitMsg:'Você sai da mina, do lado de Aurélia.',
      levels:[{name:'Fenda de Prata',gen:'cave',theme:THEME.mina,mons:['golem_prata','boulder','goblin_elite','spider'],cap:5,deco:(r,k,g)=>{ for(let j=0;j<3;j++){ const x=r.x+th(k,j,1)*r.w|0, y=r.y+th(k,j,2)*r.h|0; if(okT(x,y)&&[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>map[idx(x+dx,y+dy)]===TL.ROCK)) put({type:'veio_prata',x,y}); } }}]};
      buildDungeon(D,a); a.dun=D; b.dun=D; b.east=1; DUN.push(D);
      const R=D.R[0], [ex,ey]=R.g.end; const st=addObj({type:'stairs_up',x:ex+3,y:ey-1,solid:true}); R.eastAt=[ex+3,ey-1]; STAIRS.push({at:[ex+3,ey-1],to:b.back,msg:'Você sai do outro lado da montanha, perto de Pedralta. O atalho está aberto.',fenda:1});
      b.enter=[ex+1,ey+1]; R.rails=new Set(); for(const [x,y] of R.g.path||[]) R.rails.add(idx(x,y)); } }
  // 4. Ossário dos Templários
  { const o=entrance('portao_ossos','Y17',4,2); if(o){ const D={id:'ossario',name:'Ossário dos Templários',seed:7704,boss:'grao_mestre',loot:'d_ossario',exitMsg:'Você deixa o ossário. O vento vermelho dos ermos levanta poeira.',
      levels:[{name:'Ossário · Galeria dos Crânios',gen:'crypt',theme:THEME.ossario,mons:['templario_morto','skeleton','skeleton_archer','zombie_dark'],cap:6,deco:(r,k)=>{ for(let j=0;j<4;j++) put({type:'ossos',x:r.x+1+j*3,y:r.y}); if(k%2) put({type:'banner',x:r.x+r.w-2,y:r.y+1}); }},
             {name:'Ossário · Capela do Grão-Mestre',gen:'crypt',theme:THEME.ossario,mons:['templario_morto','templario_morto','skeleton_mage'],cap:6,deco:(r,k)=>{ put({type:'sarcofago',x:r.x+2,y:r.y+r.h/2|0}); put({type:'sarcofago',x:r.x+r.w-3,y:r.y+r.h/2|0}); if(k%2===0) put({type:'altar',x:r.x+r.w/2|0,y:r.y+1}); }}]};
      buildDungeon(D,o); o.dun=D; DUN.push(D); } }
  // 5. Necrópole das Areias
  { const o=entrance('fachada','Z19',6,2); if(o){ const D={id:'necropole',name:'Necrópole das Areias',seed:8805,boss:'califa',loot:'d_necropole',exitMsg:'Você sobe a escadaria coberta de areia e sai sob o sol do deserto.',
      levels:[{name:'Necrópole · Câmaras das Múmias',gen:'crypt',theme:THEME.tumba,mons:['mumia','escaravelho','escaravelho','skeleton'],cap:6,traps:true,deco:(r,k)=>{ if(k%2) for(let j=0;j<2;j++) put({type:'sarcofago',x:r.x+2+j*3,y:r.y+1}); }},
             {name:'Necrópole · Tumba do Califa',gen:'crypt',theme:THEME.tumba,mons:['mumia','mumia','escaravelho','skeleton_mage_fire'],cap:6,traps:true,deco:(r,k)=>{ put({type:'pillar',x:r.x+1,y:r.y+1}); put({type:'pillar',x:r.x+r.w-2,y:r.y+1}); }}]};
      buildDungeon(D,o); o.dun=D; DUN.push(D);
      for(const [i,R] of D.R.entries()){ if(!D.levels[i].traps) continue; R.traps=new Set(); for(let y=R.y;y<R.y+R.h;y++) for(let x=R.x;x<R.x+R.w;x++) if(map[idx(x,y)]===TL.SAND&&th(x,y,909)<.06&&!objGrid[idx(x,y)]) R.traps.add(idx(x,y)); } } }
  // 6. Vélia Submersa: cidade afundada no pântano, catedral como entrada
  { const [tx,ty]=cellC('T21'); AREAS.velia={x:tx,y:ty,r:15};
    for(let y=ty-15;y<=ty+15;y++) for(let x=tx-16;x<=tx+16;x++){ if(!inB(x,y)) continue; const i=idx(x,y), d=Math.hypot((x-tx)/16,(y-ty)/15); if(d>1||regionId[i]!==255||bld[i]>=0||reserved[i]) continue; const o=objGrid[i]; if(o&&K.NATURE.has(o.type)) removeObj(o);
      if(d<.92&&th(x,y,601)>.18) map[i]=TL.WATER; else map[i]=TL.SWAMP; }
    for(let k=0;k<4;k++){ const a=k/4*6.283+.4; for(let r=0;r<16;r++){ const x=Math.round(tx+Math.cos(a)*r), y=Math.round(ty+Math.sin(a)*r); for(const [dx,dy] of [[0,0],[1,0],[0,1]]) if(inB(x+dx,y+dy)&&regionId[idx(x+dx,y+dy)]===255) map[idx(x+dx,y+dy)]=TL.RUBBLE; } }
    const isle=(x,y,w,h)=>{ for(let yy=y-1;yy<y+h+1;yy++) for(let xx=x-1;xx<x+w+1;xx++) if(inB(xx,yy)) map[idx(xx,yy)]=TL.RUBBLE; };
    const ruins=[['cupula',tx-9,ty-7,3,3],['torre',tx+7,ty-8,2,2],['arco',tx-10,ty+5,3,1],['torre',tx+9,ty+6,2,2],['cupula',tx+2,ty+9,3,3]];
    for(const [v,x,y,w,h] of ruins){ isle(x,y,w,h); const o=addObj({type:'ruina',v,x,y,w,h,solid:true,lm:true}); K.lm&&window.LM_LIST.push(o); }
    isle(tx-2,ty-3,5,4); for(let y=ty+1;y<ty+5;y++) for(let x=tx-1;x<=tx+1;x++) map[idx(x,y)]=TL.RUBBLE;
    const c=addObj({type:'ruina',v:'catedral',x:tx-2,y:ty-3,w:5,h:4,solid:true,lm:true}); window.LM_LIST.push(c); c.back=[tx,ty+2];
    const D={id:'velia',name:'Vélia Submersa',seed:9906,boss:'bispo_afogado',loot:'d_velia',exitMsg:'Você sai pela catedral afundada. Vaga-lumes dançam sobre a água verde.',
      levels:[{name:'Vélia Submersa · Nave Alagada',gen:'crypt',theme:THEME.afogada,mons:['afogado','zombie','wyvern_water','skeleton'],cap:6,deco:(r,k)=>{ for(let j=0;j<r.w-4;j+=3) put({type:'pew',x:r.x+2+j,y:r.y+r.h/2|0}); }},
             {name:'Vélia Submersa · Cripta do Bispo',gen:'crypt',theme:THEME.afogada,mons:['afogado','afogado','skeleton_mage','wyvern_water'],cap:6,deco:(r,k)=>{ put({type:'pillar',x:r.x+1,y:r.y+1}); put({type:'pillar',x:r.x+r.w-2,y:r.y+r.h-2}); if(k%2) put({type:'sarcofago',x:r.x+r.w/2|0,y:r.y+1}); }}]};
    buildDungeon(D,c); c.dun=D; DUN.push(D);
    for(const R of D.R) for(let y=R.y;y<R.y+R.h;y++) for(let x=R.x;x<R.x+R.w;x++){ const i=idx(x,y); if(map[i]===TL.SWAMP&&th(x,y,611)<.25&&!objGrid[i]) map[i]=TL.WATER; } }
  // espólio
  const T=(n,t,c)=>LT(n,t.filter(e=>ITEMS[e[0]]),c);
  LOOT.d_poco=T(3,[['heal_potion',4],['bandage',4],['silver_ring',2],['gem',1],['dagger',1]],.95); LOOT.d_poco_final=T(5,[['gold_ring',2],['gem',3],['heal_potion',3],['silver_ring',2]],1);
  LOOT.d_geada=T(4,[['gem',3],['silver_ingot',3],['heal_potion',3],['silver_ring',2]],.95); LOOT.d_geada_final=T(6,[['gold_ring',2],['ruby_ring',2],['gem',4],['silver_necklace',2]],1);
  LOOT.d_fenda=T(4,[['silver_ore',6],['silver_ingot',3],['iron_ore',4],['gem',1]],.95); LOOT.d_fenda_final=T(5,[['silver_ingot',5],['gem',3],['silver_ring',2]],1);
  LOOT.d_ossario=T(4,[['gem',2],['heal_potion',3],['silver_ring',2],['gold_ring',1]],.95); LOOT.d_ossario_final=T(6,[['gold_ring',2],['ruby_ring',2],['gem',4]],1);
  LOOT.d_necropole=T(4,[['gem',3],['gold_ring',1],['heal_potion',3]],.95); LOOT.d_necropole_final=T(6,[['gold_ring',3],['ruby_ring',2],['gem',5],['gold_necklace',1]],1);
  LOOT.d_velia=T(4,[['gem',3],['silver_ingot',2],['heal_potion',3],['silver_necklace',1]],.95); LOOT.d_velia_final=T(7,[['gold_ring',3],['ruby_ring',2],['gem',5],['silver_necklace',2]],1);
});

// ---------- entradas e escadas ----------
const _udD=useDevice;
useDevice=function(o){
  if(o&&o.dun&&['poco','arco_gelo','boca_mina','portao_ossos','fachada','ruina'].includes(o.type)){ const D=o.dun;
    if(o.east&&!player.fendaOk){ toast('A passagem desabou deste lado. Talvez dê para abrir por dentro, vindo de Aurélia.'); return; }
    const to=o.east?o.enter:D.enter; const txt={poco:'Um poço de pedra, fundo e frio. Uma corda velha desce para o escuro.',arco_gelo:'Um arco de gelo azul no penhasco, guardado por reis de pedra congelados.',boca_mina:'A boca de uma mina antiga. Lá dentro, a pedra brilha em veios de prata.',portao_ossos:'Um portão meio enterrado na terra vermelha, com paredes de crânios e estandartes rasgados.',fachada:'Uma fachada imensa esculpida na rocha, com califas de pedra sentados à porta.',ruina:'A catedral afundada de Vélia. A porta, meio sob a água, ainda está aberta.'}[o.type];
    openActions(D.name,[[txt,null],[o.type==='poco'?'Descer pela corda':'Entrar',()=>{ player.x=to[0]*T+8; player.y=to[1]*T+12; search=null; toast(`${D.levels[0].name}.`); }],['Fechar',null]]); return; }
  if(o&&o.type==='ruina'&&!o.dun){ toast('Pedra antiga e musgo. A água verde guarda o resto de Vélia.'); return; }
  if(o&&o.type==='veio_prata'){ if(!hasItem('pickaxe')){ toast('Você precisa de uma picareta.'); return; } const n=1+(Math.random()*2|0); addItem('silver_ore',n); try{ gainSkill('mineracao',2); }catch(e){} removeObj(o); toast(`Você tira ${n} minério de prata do veio.`); return; }
  if(o&&o.type==='stairs_up'){ const s=STAIRS.find(s=>s.at[0]===o.x&&s.at[1]===o.y); if(s&&s.fenda) player.fendaOk=1; }
  return _udD(o); };

// ---------- chefes, armadilhas, aurora ----------
let bT=0;
const _updD=update;
update=function(dt){ _updD(dt); if(!running||!player||!ON()) return;
  const lv=dungeonLevel(player.x,player.y); if(!lv) return; const R=DG.more.find(r=>r.lv===lv); if(!R) return;
  if(R.traps){ const i=idx(player.x/T|0,player.y/T|0); player.trapCd=(player.trapCd||0)-dt; if(R.traps.has(i)&&player.trapCd<=0){ player.trapCd=1.5; try{ hurtPlayer(10+Math.random()*8,'trap'); }catch(e){ player.health-=12; } player.slowT=Math.max(player.slowT||0,2); toast('Areia movediça! Você afunda até os joelhos.'); } }
  bT-=dt; if(bT>0) return; bT=1.5;
  if(R.boss){ R.cd=(R.cd||0)-1.5; const B=R.boss; if(R.bossOn&&!raiders.includes(R.bossOn)) R.bossOn=null;
    if(!R.bossOn&&R.cd<=0&&Math.hypot(player.x-B.x*T,player.y-B.y*T)<22*T){ const r=spawnAt(B.kind,B.x*T,B.y*T,{state:'chase',foe:player,dgBoss:R.dun}); if(r){ R.bossOn=r; toast(`${MONS[B.kind].name} desperta!`); shake=8; } } } };
const UNIQ={ poco:['dagger','silver_ring'], geada:['greathelm','frost_staff'], fenda:['pickaxe','silver_ingot'], ossario:['crusader_shield','longsword','greathelm'], necropole:['scimitar','gold_ring'], velia:['plate_torso','ruby_ring'] };
const _krD=killRaider;
killRaider=function(r,...a){ const res=_krD(r,...a); try{ if(r&&r.dgBoss){ const R=DG.more.find(q=>q.bossOn===r); if(R){ R.bossOn=null; R.cd=900; }
    lootLevel=r.dgBoss==='poco'?30:65; lootLuck=r.dgBoss==='poco'?30:60; for(const id of (UNIQ[r.dgBoss]||[]).filter(k=>ITEMS[k])) addItem(id,1); lootLevel=0; lootLuck=0;
    player.dungeons=player.dungeons||{}; player.dungeons[r.dgBoss]=day; toast(`${MONS[r.mon].name} caiu! O tesouro do salão é seu.`); } }catch(e){} return res; };
// aurora no salão final das catacumbas; vaga-lumes em Vélia
DRESSX.push(()=>{ AREAS.aurora={x:0,y:0,r:0,screen:()=>{ const lv=dungeonLevel(player.x,player.y); const R=DG.more.find(r=>r.lv===lv); return !!(R&&R.dun==='geada'&&R===((DUN.find(d=>d.id==='geada')||{}).R||[])[1]); }}; });
window.LM_AREA_IT.push({area:'aurora',x:0,y:0,w:1,h:1,top:1},{area:'velia',x:0,y:0,w:1,h:1,top:1});
ANIMX.aurora=(g,o,now)=>{ const W0=g.canvas.width, t=now/2400; for(let k=0;k<3;k++){ const gr=g.createLinearGradient(0,0,0,170); gr.addColorStop(0,`rgba(${k?120:80},${220-k*30},${160+k*40},.0)`); gr.addColorStop(.5,`rgba(${k?140:90},255,${170+k*30},${.10+.05*Math.sin(t+k)})`); gr.addColorStop(1,'rgba(80,200,160,0)');
  g.fillStyle=gr; g.beginPath(); g.moveTo(0,40+k*30); for(let x=0;x<=W0;x+=40) g.lineTo(x,40+k*30+Math.sin(x/120+t*2+k)*26); g.lineTo(W0,200); g.lineTo(0,200); g.fill(); } };
ANIMX.velia=(g,o,now,P)=>{ const A=AREAS.velia; if(!A) return; if(!night()) return; for(let k=0;k<40;k++){ const a=now/2200+k*1.7, [x,y]=P(A.x+Math.cos(a*1.1+k)*A.r*.8*th(k,1,1),A.y+Math.sin(a*.9+k)*A.r*.8*th(k,2,2),10+((k*13+now/60)%40)); g.fillStyle=`rgba(220,255,150,${.5+.5*Math.sin(now/220+k)})`; g.fillRect(x|0,y|0,2,2); } };
// trilhos da mina e areia das armadilhas no chão
const _sfD=window.sceneryFloor;
window.sceneryFloor=function(g,toS,U0,V0,CK,FR){ _sfD(g,toS,U0,V0,CK,FR); if(!ON()||!DG.more.length) return;
  for(const R of DG.more){ if(U0+CK<R.x||U0>R.x+R.w||V0+CK<R.y||V0>R.y+R.h) continue;
    for(let y=V0;y<V0+CK;y++) for(let x=U0;x<U0+CK;x++){ if(!inB(x,y)) continue; const i=idx(x,y), [sx,sy]=toS(x+.5,y+.5);
      if(R.rails&&R.rails.has(i)){ g.fillStyle='#4a4a4e'; g.fillRect((sx-10)/FR,(sy-2)/FR,20/FR,1); g.fillRect((sx-10)/FR,(sy+3)/FR,20/FR,1); g.fillStyle='#5a3a20'; g.fillRect((sx-2)/FR,(sy-4)/FR,4/FR,9/FR); }
      if(R.traps&&R.traps.has(i)){ g.fillStyle='rgba(120,90,50,.35)'; g.beginPath(); g.ellipse(sx/FR,sy/FR,14/FR,7/FR,0,0,7); g.fill(); }
      if(R.dun==='ossario'&&th(x,y,77)<.12&&map[i]!==TL.WALL){ g.fillStyle='#d8ceb4'; g.fillRect((sx-3)/FR,sy/FR,Math.max(1,6/FR),1); } } } };
// save
const _serD=serialize; serialize=function(){ const s=_serD(); if(player){ s.fendaOk=player.fendaOk||0; s.livroHereges=player.livroHereges||0; s.dungeons=player.dungeons||null; } return s; };
const _asD=applySave; applySave=function(s){ _asD(s); player.fendaOk=s.fendaOk||0; player.livroHereges=s.livroHereges||0; player.dungeons=s.dungeons||null; };
})();

// =====================================================================
// OUTREMER (pixel) — o mundo inteiro de Aelória, a partir do layout do Outremer 3D
// (data/world_layout.json: grade 32×32 de células com bioma, nível, água, estradas, rios,
// cidades, castelos, mosteiros, covis de chefe e portais da lua).
// Rodar:  node tools/design_aeloria.js > js/world.js
// Aurélia continua sendo a cidade feita à mão (tools/design_outremer.js), encaixada na célula 14,18.
// =====================================================================
'use strict';
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const D3 = eval('(' + fs.readFileSync(path.join(__dirname, '../js/data3d.js'), 'utf8').replace(/^\/\/.*\n/, '').replace('const D3 = ', '').replace(/;\s*$/, '') + ')');
const L = D3.world_layout;
const CS = 40, NC = 32, W = CS * NC, H = CS * NC;
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}}
const rnd = mulberry32(777001), R = (a,b) => a + Math.floor(rnd()*(b-a+1)), pick = a => a[Math.floor(rnd()*a.length)];
const cc = c => [c[0]*CS + CS/2, c[1]*CS + CS/2];          // centro da célula em tiles
const BIO = { plains:'p', forest:'f', mountains:'m', north:'n', swamp:'s', coast:'c', outremer:'o', ruins:'r' };
const world = { version:2, W, H, spawn:'Aurélia', coast:null, cs:CS, regions:[], roads:[], walks:[], lots:[], lakes:[], river:{w:0,pts:[]}, rivers:[], paths:[], forests:[],
  buildings:[], fences:[], walls:[], pools:[], props:[], cars:[], cells:[], portals:[], lairs:[] };
// --- células: bioma, água, nível, monstros
for(let y=0;y<NC;y++){ const row=[]; for(let x=0;x<NC;x++){ const c=L.rows[y][x]; row.push({ b:BIO[c.biome]||'p', w:c.water?1:0, lv:c.level||0, d:c.danger||0, m:c.monsters||[], z:c.zone, bd:c.build }); } world.cells.push(row); }

// --- Aurélia (feita à mão), deslocada para a célula 14,18
const AU = JSON.parse(execSync('node ' + path.join(__dirname, 'design_outremer.js')).toString().replace(/^[\s\S]*?window\.WORLD=/, '').replace(/;\s*$/, ''));
const [ax, ay] = cc([14, 18]), DX = Math.round(ax - 130), DY = Math.round(ay - 100);
const sh = r => ({ ...r, x:r.x+DX, y:r.y+DY });
let BID = 0;
for(const b of AU.buildings){ world.buildings.push({ ...sh(b), id:BID++, doors:b.doors.map(([x,y])=>[x+DX,y+DY]) }); }
world.roads.push(...AU.roads.filter(r=>r.k!=='road').map(sh));
world.walks.push(...AU.walks.map(sh)); world.lots.push(...AU.lots.map(sh)); world.walls.push(...AU.walls.map(sh));
world.props.push(...AU.props.map(sh)); world.fences.push(...AU.fences.map(sh));
world.regions.push(...AU.regions.map(sh));
const AUR = world.regions.find(r=>r.name==='Aurélia');
// estradas de Aurélia até a borda da muralha (portões S, L, O) — o resto vem das estradas do mundo
const gates = { aurelia: [[AUR.x+AUR.w/2, AUR.y+AUR.h], [AUR.x, AUR.y+AUR.h/2], [AUR.x+AUR.w, AUR.y+AUR.h/2]] };

function B(t,x,y,w,h,doors,o={}){ const b={id:BID++,t,x,y,w,h,doors,...o}; world.buildings.push(b); return b; }
const prop = (t,x,y,o={}) => world.props.push({t,x,y,...o});
const road = (x,y,w,h,k='street') => world.roads.push({x,y,w,h,k});
const wall = (x,y,w,h,mat=9) => world.walls.push({x,y,w,h,mat});
const taken = (x,y,w,h,pad=2) => world.buildings.some(b => x < b.x+b.w+pad && x+w+pad > b.x && y < b.y+b.h+pad && y+h+pad > b.y)
  || world.roads.some(r => x < r.x+r.w+1 && x+w+1 > r.x && y < r.y+r.h+1 && y+h+1 > r.y)
  || world.walls.some(r => x < r.x+r.w+2 && x+w+2 > r.x && y < r.y+r.h+2 && y+h+2 > r.y);
const overlapsRegion = (x,y,w,h) => world.regions.some(r => x < r.x+r.w+6 && x+w+6 > r.x && y < r.y+r.h+6 && y+h+6 > r.y);
const ROOF = ['#5a3a2a','#4a3a30','#6a4a2e','#3e3a36','#58442e'];
const BIOROOF = { n:['#4a4a52','#3a3a42','#5a5048'], o:['#c8b088','#b89a70','#d8c8a0'], m:['#4a4440','#3e3a36'], s:['#3a4a32','#4a4a36'], c:['#5a3a2a','#6a4a3a'], r:['#4a4440'], f:['#4a5a32','#5a3a2a'], p:ROOF };
const VEND = { ferreiro:['forge','FERRARIA'], estalajadeiro:['tavern','TAVERNA'], banqueiro:['bank','BANCO'], mago:['mage','MAGOS'], alfaiate:['shop','ALFAIATE','tailor'],
  alquimista:['shop','ALQUIMIA','alchemist'], acougueiro:['shop','ACOUGUE','butcher'], carpinteiro:['shop','CARPINTARIA','carpenter'], arqueiro:['shop','ARQUEIRO','bowyer'] };
const strip = s => s.normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase();

// --- cada povoado do 3D vira uma cidade em pixel do tamanho do seu papel
function settlement(s){
  if(s.id==='aurelia') return;
  const [cx0, cy0] = cc(s.cell), bio = BIO[s.biome]||'p', roofs = BIOROOF[bio]||ROOF;
  const cap = !!s.capital, castle = /castelo|fort|posto/.test(s.id), abbey = /mosteiro|templo/.test(s.id), camp = /acampamento|faro|porto_lodo/.test(s.id);
  const S = cap ? 64 : castle ? 40 : abbey ? 36 : camp ? 24 : 34;
  let x0 = Math.round(cx0 - S/2), y0 = Math.round(cy0 - S/2);
  // se encostar em outro povoado, empurra para longe
  for(let k=0; k<30 && overlapsRegion(x0,y0,S,S); k++){ const r=world.regions.find(r=>x0<r.x+r.w+6&&x0+S+6>r.x&&y0<r.y+r.h+6&&y0+S+6>r.y); const a=Math.atan2(cy0-(r.y+r.h/2),cx0-(r.x+r.w/2)); x0+=Math.round(Math.cos(a)*6); y0+=Math.round(Math.sin(a)*6); }
  x0=Math.max(4,Math.min(W-S-4,x0)); y0=Math.max(4,Math.min(H-S-4,y0));
  const CX = x0 + Math.floor(S/2), CY = y0 + Math.floor(S/2);
  world.regions.push({ name:s.name, kind: cap?'city':'town', x:x0, y:y0, w:S, h:S, sid:s.id, biome:bio, safe:true });
  gates[s.id] = [];
  // muralha (capitais e castelos); paliçada nas vilas
  if(cap || castle){ const mat = bio==='o'?12:9;
    for(let x=x0; x<x0+S; x++){ if(Math.abs(x-CX)>2){ wall(x,y0,1,2,mat); wall(x,y0+S-2,1,2,mat); } }
    for(let y=y0; y<y0+S; y++){ if(Math.abs(y-CY)>2){ wall(x0,y,2,1,mat); wall(x0+S-2,y,2,1,mat); } }
    for(const [a,b] of [[x0-1,y0-1],[x0+S-3,y0-1],[x0-1,y0+S-3],[x0+S-3,y0+S-3],[CX-6,y0+S-3],[CX+3,y0+S-3],[CX-6,y0-1],[CX+3,y0-1]]) wall(a,b,4,4,10);
  }
  gates[s.id].push([CX, y0+S], [CX, y0], [x0, CY], [x0+S, CY]);
  // ruas: cruz com praça
  road(CX-2, y0+2, 5, S-4); road(x0+2, CY-2, S-4, 5);
  if(cap){ road(x0+4, y0+4, S-8, 3); road(x0+4, y0+S-7, S-8, 3); road(x0+4, y0+4, 3, S-8); road(x0+S-7, y0+4, 3, S-8); }
  road(CX-7, CY-7, 15, 15); prop('fountain', CX-1, CY-1);
  if(s.services && s.services.includes('moon_portal')) world.portals.push({ id:'portal_'+s.id, city:s.id, x:CX+4, y:CY+4 });
  // prédios: castelo, igreja/capela, lojas dos vendedores, casas
  const slots = []; // lugares de frente para as ruas principais
  const tryB = (t,w,h,o) => { for(let k=0;k<400;k++){ const x=R(x0+4,x0+S-4-w), y=R(y0+4,y0+S-4-h); if(taken(x,y,w,h)) continue;
      const below = world.roads.some(r=>r.k==='street'&&y+h+1>=r.y&&y+h+1<r.y+r.h&&x+w/2>=r.x&&x+w/2<r.x+r.w), above = world.roads.some(r=>r.k==='street'&&y-2>=r.y&&y-2<r.y+r.h&&x+w/2>=r.x&&x+w/2<r.x+r.w);
      if(!below && !above && k<300) continue;
      const dx=x+Math.floor(w/2), dy=below?y+h-1:y; const b=B(t,x,y,w,h,[[dx,dy]],{ mat:o.mat||pick(bio==='o'?[12,12,9]:[11,11,12,9]), roof:o.roof||pick(roofs), ...o });
      world.walks.push({x:dx,y:below?y+h:y-1,w:1,h:1}); return b; } return null; };
  if(castle){ B('castle', CX-10, y0+5, 21, 12, [[CX, y0+16],[CX-1,y0+16]], { mat:9, roof:'#3c3a3a', name:strip(s.name), flat:true }); }
  if(abbey || cap || s.services?.includes('healer')) tryB('church', 11, 15, { mat:9, roof:'#3a3532', name: abbey ? strip(s.name) : 'CAPELA' });
  for(const v of s.vendors||[]){ const d=VEND[v]; if(!d) continue; const [t,name,kind]=d; const big=t==='tavern'||t==='forge'; const b=tryB(t, big?12:10, big?9:8, { name, kind });
    if(b && t==='forge'){ prop('anvil', b.x-2, b.y+2); prop('logs', b.x-2, b.y+4); } }
  if(s.services?.includes('healer') && !(s.vendors||[]).includes('alquimista')) tryB('shop',10,8,{ name:'CURANDEIRO', kind:'healer' });
  const nh = cap ? 18 : castle ? 5 : abbey ? 5 : camp ? 4 : 9;
  for(let k=0;k<nh;k++){ const w=R(7,10), h=R(6,8); tryB(w>=9&&h>=7?'house_m':'house_s', w, h, {}); }
  for(let k=0;k<(cap?30:10);k++){ const x=R(x0+4,x0+S-5), y=R(y0+4,y0+S-5); if(!taken(x,y,1,1)) prop(pick(bio==='o'?['palm','keg','crate','hay']:bio==='n'?['pine','crate','logs']:['tree','tree','crate','keg','hay']), x, y); }
  // portos: cais
  if(/porto|san_marco|acre|faro/.test(s.id)) world.lots.push({ k:'pier', x:CX-2, y:y0+S, w:5, h:10 });
  // fazendas em volta das cidades das planícies
  if(bio==='p' && !castle) for(let k=0;k<3;k++){ const fx=x0+R(-30,S+10), fy=y0+S+R(4,16); if(!overlapsRegion(fx,fy,18,9)) world.lots.push({ k:'field', x:fx, y:fy, w:18, h:9 }); }
}
// Aurélia primeiro na lista de povoados para o empurrão funcionar
for(const s of L.settlements) settlement(s);
world.portals.push({ id:'portal_aurelia', city:'aurelia', x:Math.round(AUR.x+AUR.w/2+14), y:Math.round(AUR.y+AUR.h/2+10) });

for(const P of D3.portals.portals){ if(world.portals.some(p=>p.city===P.city)) continue; const r=world.regions.find(r=>r.sid===P.city); if(r) world.portals.push({ id:P.id, city:P.city, x:Math.round(r.x+r.w/2+4), y:Math.round(r.y+r.h/2+4) }); }
// --- covis dos chefes (o evento de chefe usa estes lugares)
for(const b of L.bosses||[]){ const [x,y]=cc(b.cell); world.lairs.push({ id:b.id, name:b.name, x:Math.round(x), y:Math.round(y), lv:b.level, mons:b.monsters, boss:b.monster_in_data||null });
  for(let k=0;k<6;k++){ const a=k/6*Math.PI*2; world.walls.push({ x:Math.round(x+Math.cos(a)*7), y:Math.round(y+Math.sin(a)*5), w:R(1,3), h:1, mat:10 }); } prop('statue', Math.round(x), Math.round(y-2)); }

// --- rios e estradas do 3D, com curvas
const jit = (p,a) => [p[0]+(rnd()-.5)*a, p[1]+(rnd()-.5)*a];
for(const r of L.rivers||[]){ const pts=r.cells.map(c=>jit(cc(c),CS*.5)).map(p=>p.map(Math.round));
  world.rivers.push({ w: r.kind==='fjord'?14:r.kind==='wadi'?4:6, kind:r.kind, name:r.name, pts }); }
const toGate = (sid, p) => { const g=gates[sid]; if(!g||!g.length) return p; let best=g[0], bd=1e9; for(const q of g){ const d=Math.hypot(q[0]-p[0],q[1]-p[1]); if(d<bd){ bd=d; best=q; } } return best; };
for(const r of L.roads||[]){ const pts=r.cells.map((c,i)=>i===0||i===r.cells.length-1 ? cc(c) : jit(cc(c),CS*.3));
  // pontas encostam no portão do povoado mais perto
  const near = p => { let best=null, bd=1e9; for(const s of L.settlements){ const q=cc(s.cell), d=Math.hypot(q[0]-p[0],q[1]-p[1]); if(d<bd){ bd=d; best=s; } } return best; };
  const a=near(pts[0]), b=near(pts[pts.length-1]); if(a) pts[0]=toGate(a.id,pts[0]); if(b) pts[pts.length-1]=toGate(b.id,pts[pts.length-1]);
  world.paths.push({ name:r.name, w: /estrada|via|rota/.test(r.id)?4:3, pts:pts.map(p=>p.map(Math.round)) }); }
process.stdout.write('// Outremer (pixel) — Aelória inteira, gerada por tools/design_aeloria.js a partir do layout do 3D\nwindow.WORLD=' + JSON.stringify(world) + ';\n');

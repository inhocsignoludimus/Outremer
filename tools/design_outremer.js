// =====================================================================
// OUTREMER (pixel) — mapa autoral. Rodar:  node tools/design_outremer.js > js/world.js
// Primeira etapa: Aurélia, a capital murada (muralha com torres e portões, castelo ao norte,
// rio com ponte a oeste, lojas de cada ofício, casas, fazendas e mata em volta).
// Mesmo formato de mundo do After Light (regions, roads, walks, lots, buildings, props...).
// =====================================================================
'use strict';
const W = 260, H = 240;
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}}
const rnd = mulberry32(20261107);
const R = (a,b) => a + Math.floor(rnd()*(b-a+1));
const pick = a => a[Math.floor(rnd()*a.length)];
const world = { version:1, W, H, spawn:'Aurélia', coast:null, regions:[], roads:[], walks:[], lots:[], lakes:[], river:null, forests:[],
  buildings:[], fences:[], walls:[], pools:[], props:[], cars:[] };
let BID = 0;
function B(t,x,y,w,h,doors,o={}){ const b={id:BID++,t,x,y,w,h,doors,...o}; world.buildings.push(b); return b; }
function prop(t,x,y,o={}){ world.props.push({t,x,y,...o}); }
const road = (x,y,w,h,k='street') => world.roads.push({x,y,w,h,k});
const walk = (x,y,w,h) => world.walks.push({x,y,w,h});
const wall = (x,y,w,h,mat=9) => world.walls.push({x,y,w,h,mat});

// --- natureza: rio a oeste (ponte na estrada do portão oeste), lagoa, matas
world.river = { w:7, pts:[[38,0],[34,40],[40,80],[33,120],[38,160],[30,200],[36,240]] };
world.lakes = [ {x:215,y:200,rx:16,ry:10}, {x:230,y:40,rx:10,ry:7} ];
world.forests = [ {x:12,y:30,rx:22,ry:40,d:.35}, {x:240,y:110,rx:26,ry:60,d:.3}, {x:120,y:222,rx:60,ry:14,d:.25}, {x:110,y:8,rx:70,ry:10,d:.28}, {x:12,y:190,rx:20,ry:36,d:.3} ];

// --- a cidade: x 60..199, y 30..169
const X0 = 60, Y0 = 30, CW = 140, CHt = 140, CX = X0 + CW/2, CY = Y0 + CHt/2;
world.regions.push({ name:'Aurélia', kind:'city', x:X0-6, y:Y0-6, w:CW+12, h:CHt+12 });
// muralha de 2 tiles com torres 4x4; portões ao sul, leste e oeste
const GATES = { S:[CX-2, CX+2], E:[CY-2, CY+2], W:[CY-2, CY+2] };
for(let x=X0; x<X0+CW; x++){ if(!(x>=GATES.S[0]-1 && x<=GATES.S[1])) wall(x, Y0+CHt-2, 1, 2); wall(x, Y0, 1, 2); }
for(let y=Y0; y<Y0+CHt; y++){ if(!(y>=GATES.W[0]-1 && y<=GATES.W[1])) wall(X0, y, 2, 1); if(!(y>=GATES.E[0]-1 && y<=GATES.E[1])) wall(X0+CW-2, y, 2, 1); }
const tower = (x,y) => wall(x, y, 4, 4, 10);
for(let k=0; k<=CW-4; k+=17) { tower(X0+k, Y0-1); tower(X0+k, Y0+CHt-3); }
for(let k=17; k<=CHt-4; k+=17) { tower(X0-1, Y0+k); tower(X0+CW-3, Y0+k); }
tower(X0+CW-3, Y0-1); tower(X0+CW-3, Y0+CHt-3);
tower(GATES.S[0]-5, Y0+CHt-3); tower(GATES.S[1]+1, Y0+CHt-3);
tower(X0-1, GATES.W[0]-5); tower(X0-1, GATES.W[1]+1); tower(X0+CW-3, GATES.E[0]-5); tower(X0+CW-3, GATES.E[1]+1);

// --- ruas de pedra: avenida norte-sul (do portão sul ao castelo), leste-oeste, anel por dentro da muralha e transversais
road(CX-2, Y0+40, 5, CHt-40);            // avenida
road(X0, CY-2, CW, 5);                   // leste-oeste (atravessa os portões)
road(X0+3, Y0+3, CW-6, 3); road(X0+3, Y0+CHt-6, CW-6, 3); road(X0+3, Y0+3, 3, CHt-6); road(X0+CW-6, Y0+3, 3, CHt-6);
for(const dx of [-44, 44]) road(CX+dx-1, Y0+3, 3, CHt-6);
for(const dy of [-36, 36]) road(X0+3, CY+dy-1, CW-6, 3);
// estrada de fora: oeste (ponte), leste, sul
road(0, CY-2, X0, 5, 'road'); road(X0+CW, CY-2, W-X0-CW, 5, 'road'); road(CX-2, Y0+CHt, 5, H-Y0-CHt, 'road');
// praça com chafariz e estátuas
const PX = CX-12, PY = CY-12;
road(PX, PY, 25, 25);
prop('fountain', CX-1, CY-1); for(const [a,b] of [[PX+2,PY+2],[PX+22,PY+2],[PX+2,PY+22],[PX+22,PY+22]]) prop('statue', a, b);

// --- castelo ao norte: pátio com muralha própria, torre de menagem com sala do trono
const KX = CX-22, KY = Y0+7, KW = 45, KH = 30;
for(let x=KX; x<KX+KW; x++){ wall(x, KY, 1, 1); if(Math.abs(x-CX) > 2) wall(x, KY+KH-1, 1, 1); }
for(let y=KY; y<KY+KH; y++){ wall(KX, y, 1, 1); wall(KX+KW-1, y, 1, 1); }
for(const [a,b] of [[KX-1,KY-1],[KX+KW-3,KY-1],[KX-1,KY+KH-3],[KX+KW-3,KY+KH-3]]) wall(a, b, 4, 4, 10);
world.lots.push({ k:'court', x:KX+1, y:KY+1, w:KW-2, h:KH-2 });
road(CX-2, KY+18, 5, KH-17);
B('castle', CX-15, KY+3, 31, 16, [[CX, KY+18],[CX-1, KY+18]], { mat:9, roof:'#3c3a3a', name:'CASTELO DE AURELIA', flat:true });
for(const x of [KX+4, KX+KW-6]) for(let y=KY+21; y<KY+KH-3; y+=3) prop('tree', x, y);
prop('banner', CX-4, KY+20); prop('banner', CX+4, KY+20);

// --- lojas: cada ofício com prédio próprio, porta para a rua
const SH = [
  ['forge',   CX+6,  CY+14, 12, 9, 'FERRARIA'],
  ['tavern',  CX-26, CY+14, 16, 11,'TAVERNA'],
  ['bank',    CX+6,  CY-26, 12, 10,'BANCO'],
  ['mage',    CX-17, CY-25, 8, 9,  'MAGOS'],
  ['shop',    CX+22, CY+14, 10, 8, 'ALQUIMIA', 'alchemist'],
  ['shop',    CX+22, CY-25, 10, 8, 'ALFAIATE', 'tailor'],
  ['shop',    CX-38, CY+14, 10, 8, 'ARQUEIRO', 'bowyer'],
  ['shop',    CX-38, CY-25, 10, 8, 'ACOUGUE',  'butcher'],
  ['shop',    CX+34, CY+14, 10, 8, 'CARPINTARIA','carpenter'],
  ['shop',    CX+34, CY-25, 10, 8, 'CURANDEIRO','healer'],
  ['shop',    CX-50, CY+14, 10, 8, 'JOALHEIRO', 'jeweler'],
  ['shop',    CX-50, CY-25, 10, 8, 'MERCEARIA', 'provisioner'],
];
for(const [t,x,y,w,h,name,kind] of SH){
  const front = y > CY ? 'N' : 'S';
  const dy = front === 'N' ? y : y+h-1, dx = x+Math.floor(w/2);
  B(t, x, y, w, h, [[dx,dy]], { mat: t==='forge'||t==='bank'?9:11, roof: pick(['#5a3a2a','#4a3a30','#3e3a36','#5e4632']), name, kind });
  if(t==='forge'){ prop('anvil', x-2, y+2); prop('logs', x-2, y+5); }
  if(t==='tavern'){ prop('keg', x+w+1, y+1); prop('keg', x+w+1, y+3); }
}
// igreja a leste da praça
B('church', CX+50, CY-14, 13, 20, [[CX+56, CY+5]], { mat:9, roof:'#3a3532', name:'CAPELA DO SELO' });
// casas nos quarteirões que sobram
const taken = (x,y,w,h) => world.buildings.some(b => x < b.x+b.w+2 && x+w+2 > b.x && y < b.y+b.h+2 && y+h+2 > b.y)
  || world.roads.some(r => x < r.x+r.w+1 && x+w+1 > r.x && y < r.y+r.h+1 && y+h+1 > r.y)
  || world.walls.some(r => x < r.x+r.w+2 && x+w+2 > r.x && y < r.y+r.h+2 && y+h+2 > r.y)
  || (x < KX+KW+1 && x+w > KX-1 && y < KY+KH+1 && y+h > KY-1);
let tries = 0, made = 0;
while(tries++ < 4000 && made < 46){
  const w = R(7,10), h = R(6,8), x = R(X0+7, X0+CW-8-w), y = R(Y0+7, Y0+CHt-8-h);
  if(taken(x,y,w,h)) continue;
  // porta para a rua mais perto (acima ou abaixo)
  const below = world.roads.some(r => r.k==='street' && y+h+1 >= r.y && y+h+1 < r.y+r.h && x+w/2 >= r.x && x+w/2 < r.x+r.w);
  const above = world.roads.some(r => r.k==='street' && y-2 >= r.y && y-2 < r.y+r.h && x+w/2 >= r.x && x+w/2 < r.x+r.w);
  if(!below && !above) continue;
  const dx = x+Math.floor(w/2), dy = below ? y+h-1 : y;
  B(w>=9&&h>=7?'house_m':'house_s', x, y, w, h, [[dx,dy]], { mat: pick([11,11,12,9]), roof: pick(['#5a3a2a','#4a3a30','#6a4a2e','#3e3a36','#58442e']) });
  // caminho da porta até a rua
  if(below) walk(dx, y+h, 1, 1); else walk(dx, y-1, 1, 1);
  made++;
}
// barris, caixotes e árvores pelas ruas
for(let k=0; k<60; k++){ const x = R(X0+6, X0+CW-7), y = R(Y0+6, Y0+CHt-7); if(!taken(x,y,1,1)) prop(pick(['tree','tree','crate','keg','hay']), x, y); }

// --- fora dos muros: fazendas ao sul, moinho de lenhador, acampamento
for(const [x,y] of [[70,184],[100,190],[150,186],[178,192]]){ world.lots.push({ k:'field', x, y, w:20, h:10 }); B('house_s', x+4, y-9, 8, 7, [[x+8, y-3]], { mat:12, roof:'#6a5a3a', barn:false }); }
world.regions.push({ name:'Fazendas do Sul', kind:'town', x:64, y:172, w:140, h:34 });

process.stdout.write('// Outremer (pixel) — mapa gerado por tools/design_outremer.js\nwindow.WORLD=' + JSON.stringify(world) + ';\n');

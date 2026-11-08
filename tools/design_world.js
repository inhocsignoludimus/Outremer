// =====================================================================
// AFTER LIGHT — world layout (authored)
// Run:  node tools/design_world.js > js/world.js
// The output (js/world.js) IS the map: every city, road, building, prop and car
// is listed there with fixed coordinates. Edit this file (or world.js directly)
// to move things around — the game never randomises the layout.
// =====================================================================
'use strict';
const W = 1024, H = 1440;
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}}
const rnd = mulberry32(20261103);
const R = (a,b) => a + Math.floor(rnd()*(b-a+1));
const pick = a => a[Math.floor(rnd()*a.length)];

const world = { version:5, W, H, spawn:'Cedar Falls', coast:null, regions:[], roads:[], walks:[], lots:[], lakes:[], river:null, forests:[],
  buildings:[], fences:[], walls:[], pools:[], props:[], cars:[] };
const warn = [];
let BID = 0;
const HROOFS = ['#5b3a2c','#454a52','#5e4b31','#3e4836','#4d3a3a','#6a4a3a','#3c3f46'];
const MROOFS = ['#7a3a2a','#3a3f4a','#5a4a3a','#2f3a33'];
const CAR_COLS = ['#6b3a2e','#3e4a5a','#5a5a52','#6d5a32','#2f4a3e','#7a7a72','#4a2f3a'];

function B(t,x,y,w,h,doors,o={}){ const b={id:BID++,t,x,y,w,h,doors,...o}; world.buildings.push(b); return b; }
function prop(t,x,y,o={}){ world.props.push({t,x,y,...o}); }
function car(x,y,vert,col){ world.cars.push({x,y,v:vert?1:0,c:col||pick(CAR_COLS)}); }

// ---------------------------------------------------------------------
// Natural features (authored)
// ---------------------------------------------------------------------
// Coastline: authored control points (clockwise), then subdivided with a fixed jitter so the
// shore looks natural. Everything outside is sea.
const COAST = [
  [70,40],[200,22],[330,38],[470,18],[620,34],[760,20],[900,40],[990,80],
  [1010,220],[990,380],[1008,560],[985,720],[1005,900],[990,1060],[975,1200],
  [930,1300],[820,1350],[700,1372],[610,1362],[540,1358],[430,1360],[370,1370],[290,1332],[200,1302],[120,1252],
  [70,1172],[40,1082],[25,1000],[12,920],[20,840],[40,762],[30,690],[35,630],[55,560],[30,480],[55,400],[40,320],[70,260],[45,180],[60,100],
];
function roughen(pts, depth){
  let out=pts;
  for(let d=0; d<depth; d++){
    const nxt=[];
    for(let i=0;i<out.length;i++){ const a=out[i], b=out[(i+1)%out.length]; nxt.push(a);
      const L=Math.hypot(b[0]-a[0],b[1]-a[1]); if(L<6) continue;
      const nx=-(b[1]-a[1])/L, ny=(b[0]-a[0])/L, j=(rnd()-.5)*L*0.22;
      nxt.push([Math.round((a[0]+b[0])/2+nx*j), Math.round((a[1]+b[1])/2+ny*j)]); }
    out=nxt;
  }
  return out;
}
world.coast = roughen(COAST, 3);
// protected spots the jitter must not cut into (Port Halden's waterfront is kept straight)
function onLand(x,y){ // even-odd test against the coast polygon
  let c=false; const P=world.coast;
  for(let i=0,j=P.length-1;i<P.length;j=i++){ const [xi,yi]=P[i],[xj,yj]=P[j];
    if(((yi>y)!==(yj>y)) && (x < (xj-xi)*(y-yi)/(yj-yi)+xi)) c=!c; }
  return c;
}
world.lakes = [ {x:590,y:460,rx:22,ry:14}, {x:900,y:300,rx:25,ry:15}, {x:180,y:470,rx:26,ry:16}, {x:565,y:1085,rx:22,ry:13}, {x:880,y:860,rx:18,ry:12} ];
world.river = { w:9, pts:[[0,742],[60,722],[130,700],[220,704],[300,734],[380,756],[460,744],[540,706],[620,690],[700,714],[780,758],[860,778],[940,752],[1024,735]] };

// ---------------------------------------------------------------------
// Settlements
// ---------------------------------------------------------------------
// =====================================================================
// SETTLEMENTS — organic layout. Each town/city gets an irregular outline,
// street lines with uneven spacing (dense centre, wide suburbs), a main
// avenue, some merged blocks, and zones (commercial core, apartments,
// residential, industry, docks). Cells that would sit on water, the sea,
// a gated community or another settlement are dropped, so every place
// takes the shape of its terrain.
// =====================================================================
const CONDOS = [
  ['Silver Pines Estates', 470,200], ['Lakeview Residences', 790,200], ['Stonegate', 500,330],
  ['Hilltop Manor', 780,450], ['Willow Creek', 470,540], ['Golden Oaks', 280,600],
  ['Sunset Ridge', 820,620], ['Maple Grove', 420,1010], ["Eagle's Nest", 840,1110], ['Bellwood Estates', 760,1200],
];
const CONDO_RECTS = CONDOS.map(([n,x,y])=>({x:x-10,y:y-10,w:70,h:60}));
const claimed=[];
function inPoly(P,x,y){ let c=false; for(let i=0,j=P.length-1;i<P.length;j=i++){ const [xi,yi]=P[i],[xj,yj]=P[j]; if(((yi>y)!==(yj>y)) && (x<(xj-xi)*(y-yi)/(yj-yi)+xi)) c=!c; } return c; }
function inLake(x,y,m=3){ return world.lakes.some(l=>((x-l.x)/(l.rx+m))**2+((y-l.y)/(l.ry+m))**2<1); }
function distRiver(x,y){ let best=1e9; const P=world.river.pts; for(let i=0;i<P.length-1;i++){ const [x1,y1]=P[i],[x2,y2]=P[i+1]; const dx=x2-x1,dy=y2-y1;
  const t=Math.max(0,Math.min(1,((x-x1)*dx+(y-y1)*dy)/(dx*dx+dy*dy))); best=Math.min(best,Math.hypot(x-x1-t*dx,y-y1-t*dy)); } return best; }
const wetAt=(x,y)=>!onLand(x,y)||inLake(x,y)||distRiver(x,y)<world.river.w/2+3;
function areaDry(x,y,w,h){ for(let yy=y;yy<=y+h;yy+=3) for(let xx=x;xx<=x+w;xx+=3) if(wetAt(xx,yy)) return false; return !wetAt(x+w,y)&&!wetAt(x,y+h)&&!wetAt(x+w,y+h); }
function areaUnclaimed(x,y,w,h){ for(const c of CONDO_RECTS.concat(claimed)) if(x<c.x+c.w&&x+w>c.x&&y<c.y+c.h&&y+h>c.y) return false; return true; }
function blob(cx,cy,rx,ry,n=24){ const pts=[], ph=rnd()*6.28, a2=0.12+rnd()*0.18, a3=0.08+rnd()*0.14;
  for(let k=0;k<n;k++){ const t=k/n*Math.PI*2, r=1+a2*Math.sin(2*t+ph)+a3*Math.sin(3*t+ph*1.7)+(rnd()-.5)*0.16; pts.push([Math.round(cx+Math.cos(t)*rx*r), Math.round(cy+Math.sin(t)*ry*r)]); }
  return pts; }
function streetLines(c,half,coreHalf,core,outer){ const L=[c]; let q=c;
  while(q>c-half){ q-=R(...(Math.abs(q-c)<coreHalf?core:outer)); L.unshift(q); }
  q=c; while(q<c+half){ q+=R(...(Math.abs(q-c)<coreHalf?core:outer)); L.push(q); }
  return L; }

const SIZE={mall:[28,20],hospital:[28,16],supermarket:[24,15],supermarket_s:[16,12],police:[22,15],police_s:[12,11],gun_conv:[26,12],church_park:[26,18],
  plaza:[12,10],firestation:[24,15],warehouse:[18,12],factory:[30,18],gas:[26,10],docks:[24,14],clinic_church:[26,16],civic:[26,12],shops:[26,12],apartments:[13,13],offices:[13,11]};
const S = {}; // settlements by name

function settlement(name, kind, cx, cy, rx, ry, o){
  const poly=blob(cx,cy,rx,ry), SW=4, AVW = kind==='city'?6:5;
  const xs=streetLines(cx,rx*1.3,rx*o.core,o.xCore,o.xOuter), ys=streetLines(cy,ry*1.3,ry*o.core,o.yCore,o.yOuter);
  const ai=xs.indexOf(cx), aj=ys.indexOf(cy), wx=i=>i===ai?AVW:SW, wy=j=>j===aj?AVW:SW;
  const NX=xs.length-1, NY=ys.length-1, C=[];
  // every row of blocks gets its own slightly shifted cross streets -> staggered, organic junctions
  const XR=[]; for(let j=0;j<NY;j++) XR.push(xs.map((x,i)=> (i===ai||i===0||i===NX) ? x : x+R(-o.jog,o.jog)));
  for(let j=0;j<NY;j++){ C.push([]); const xs=XR[j]; for(let i=0;i<NX;i++){
    const x=xs[i]+wx(i), y=ys[j]+wy(j), w=xs[i+1]-x, h=ys[j+1]-y, ccx=x+w/2, ccy=y+h/2, d=Math.hypot((ccx-cx)/rx,(ccy-cy)/ry);
    const ox=xs[i], oy=ys[j], ow=xs[i+1]+wx(i+1)-xs[i], oh=ys[j+1]+wy(j+1)-ys[j];
    const inc = w>=12 && h>=10 && (inPoly(poly,ccx,ccy) || d<0.35) && areaDry(ox,oy,ow,oh) && areaUnclaimed(ox,oy,ow,oh) && ox>2 && oy>2 && ox+ow<W-2 && oy+oh<H-2;
    C[j].push({i,j,x,y,w,h,d,inc,gone:false,span:1}); } }
  const dropV=new Set();
  const canMerge=(a,b)=>a.inc&&b.inc&&!a.gone&&!b.gone&&a.span===1&&b.span===1&&a.i+1!==ai&&!a.type&&!b.type;
  const merge=(a,b)=>{ a.w=b.x+b.w-a.x; a.span=2; b.gone=true; dropV.add((a.i+1)+','+a.j); a.d=(a.d+b.d)/2; };
  for(let j=0;j<NY;j++) for(let i=0;i<NX-1;i++){ const a=C[j][i], b=C[j][i+1];
    if(canMerge(a,b)&&a.d>o.core*1.1&&b.d>o.core*1.1&&rnd()<o.merge) merge(a,b); }
  const cells=()=>C.flat().filter(c=>c.inc&&!c.gone);
  const iw=c=>c.w-2, ih=c=>c.h-2;
  const fits=(c,t)=>iw(c)>=SIZE[t][0]&&ih(c)>=SIZE[t][1];
  const onAv=c=>c.i===ai||c.i+c.span===ai||c.j===aj||c.j+1===aj, onMain=c=>c.j===aj||c.j+1===aj;
  const order=(list,mode)=>{ list=list.slice().sort((a,b)=>a.d-b.d);
    if(mode==='outer') list.reverse();
    if(mode==='avenue') list=list.filter(onAv).reverse();
    if(mode==='east') list=list.filter(c=>c.x>cx).reverse();
    if(mode==='south') list=list.sort((a,b)=>(b.y+b.h)-(a.y+a.h));
    return list; };
  // zoning: special buildings first (merging two blocks when one is too small)
  for(const entry of o.plan){
    const optional=entry.endsWith('?'); const [t,mode]=entry.replace('?','').split(':');
    let cand=order(cells().filter(c=>!c.type&&fits(c,t)),mode);
    if(cand.length){ cand[0].type=t; continue; }
    const pairs=[];
    for(let j=0;j<NY;j++) for(let i=0;i<NX-1;i++){ const a=C[j][i], b=C[j][i+1];
      if(canMerge(a,b) && (b.x+b.w-a.x-2)>=SIZE[t][0] && Math.min(ih(a),ih(b))>=SIZE[t][1]) pairs.push(a); }
    const pc=order(pairs,mode);
    if(pc.length){ const a=pc[0]; merge(a,C[a.j][a.i+1]); a.type=t; }
    else if(!optional) warn.push(`${name}: no room for ${t}`);
  }
  for(const c of cells()){ if(c.type) continue;
    if(kind==='town') c.type = onMain(c) && c.d<0.95 ? 'shops_row' : 'residential';
    else c.type = c.d<o.core ? pick(['shops_row','shops_row','offices','apartments']) : c.d<o.core*1.7 ? pick(['apartments','residential','shops_row','residential']) : 'residential';
    if(c.type==='apartments'&&!fits(c,'apartments')) c.type='residential';
    if(c.type==='offices'&&!fits(c,'offices')) c.type='shops_row';
  }
  // streets around the blocks that exist
  const incAt=(i,j)=>i>=0&&j>=0&&i<NX&&j<NY&&C[j][i].inc;
  let av={x0:1e9,x1:-1e9,y0:1e9,y1:-1e9}; const roadsFrom=world.roads.length;
  for(let i=0;i<=NX;i++) for(let j=0;j<NY;j++){ if(dropV.has(i+','+j) || !(incAt(i-1,j)||incAt(i,j))) continue;
    world.roads.push({k:i===ai?'avenue':'street', x:XR[j][i], y:ys[j], w:wx(i), h:ys[j+1]+wy(j+1)-ys[j]});
    if(i===ai){ av.y0=Math.min(av.y0,ys[j]); av.y1=Math.max(av.y1,ys[j+1]+wy(j+1)); } }
  for(let j=0;j<=NY;j++) for(let i=0;i<NX;i++) for(const row of [j-1,j]){ if(row<0||row>=NY||!incAt(i,row)) continue;
    const X=XR[row]; world.roads.push({k:j===aj?'avenue':'street', x:X[i], y:ys[j], w:X[i+1]+wx(i+1)-X[i], h:wy(j)});
    if(j===aj){ av.x0=Math.min(av.x0,X[i]); av.x1=Math.max(av.x1,X[i+1]+wx(i+1)); } }
  const blocks=[]; let bx0=1e9,by0=1e9,bx1=-1e9,by1=-1e9;
  for(const c of cells()){
    world.walks.push({x:c.x,y:c.y,w:c.w,h:1},{x:c.x,y:c.y+c.h-1,w:c.w,h:1},{x:c.x,y:c.y+1,w:1,h:c.h-2},{x:c.x+c.w-1,y:c.y+1,w:1,h:c.h-2});
    blocks.push({ix:c.x+1,iy:c.y+1,iw:c.w-2,ih:c.h-2,x:c.x,y:c.y,w:c.w,h:c.h,d:c.d,type:c.type});
    bx0=Math.min(bx0,c.x-6); by0=Math.min(by0,c.y-6); bx1=Math.max(bx1,c.x+c.w+6); by1=Math.max(by1,c.y+c.h+6); }
  const r={ name, kind, x:Math.min(bx0,av.x0), y:Math.min(by0,av.y0), w:0, h:0, poly:blob(cx,cy,rx*1.25,ry*1.25) };
  r.w=Math.max(bx1,av.x1)-r.x; r.h=Math.max(by1,av.y1)-r.y;
  world.regions.push(r); claimed.push({x:r.x-12,y:r.y-12,w:r.w+24,h:r.h+24});
  const exits={E:{x:av.x1,y:ys[aj],d:'H'}, W:{x:av.x0,y:ys[aj],d:'H'}, N:{x:xs[ai],y:av.y0,d:'V'}, S:{x:xs[ai],y:av.y1,d:'V'}};
  for(const b of blocks) FILL[b.type](b);
  S[name]={r,exits,blocks,roadsFrom,roadsTo:world.roads.length};
  return S[name];
}

// --- block fillers (size-aware; b = {ix,iy,iw,ih} interior inside the sidewalk ring) ---
const SHOP_KINDS=[['diner','DINER'],['bar','BAR'],['hardware','TOOLS'],['pharmacy','PHARMACY'],['clothes','CLOTHES'],['bank','BANK'],['books','BOOKS'],['diner','CAFE']];
function rowOf(b, side, make, flush){ // a row of buildings facing a street on side N or S
  let cx=b.ix+(flush?0:R(0,1));
  for(;;){ const bl=make(); if(!bl) break; let {w,d}=bl; if(cx+w>b.ix+b.iw){ w=b.ix+b.iw-cx; if(w<7) break; }
    const y = side==='N' ? b.iy+(flush?0:1) : b.iy+b.ih-(flush?0:1)-d;
    const dx = cx + R(2,w-3), dy = side==='N' ? y : y+d-1;
    bl.place(cx,y,w,d,[[dx,dy]]);
    if(!flush){ if(side==='N') world.lots.push({k:'path', x:dx, y:b.iy, w:1, h:y-b.iy}); else world.lots.push({k:'path', x:dx, y:y+d, w:1, h:b.iy+b.ih-(y+d)}); }
    cx += w + bl.gap; }
}
function residential(b, opt={}){
  const two = b.ih>=17 && !opt.sides;
  const sides = opt.sides || (two ? ['N','S'] : ['N']);
  const maxD = opt.maxDepth || (two ? Math.min(11,Math.floor((b.ih-2)/2)) : Math.min(10,b.ih-2));
  for(const side of sides) rowOf(b, side, ()=>{ const w=R(8,13); const d=Math.max(6,Math.min(w>=11?R(9,11):R(8,9), maxD));
    return {w,d,gap:R(1,2),place:(x,y,w,d,doors)=>{ B(w>=11&&d>=8?'house_m':'house_s', x, y, w, d, doors, { mat:pick([0,1,2,3,4,2,3]), roof:pick(HROOFS) }); if(rnd()<.15) prop('trash', doors[0][0]+1, side==='N'?b.iy:b.iy+b.ih-1); }}; });
  if(two) world.fences.push({x:b.ix+1, y:b.iy+Math.floor(b.ih/2), w:b.iw-2, h:1});
}
function shopsRow(b){
  const two = b.ih>=14, alley = b.ih>=18, maxD=two?Math.min(12,Math.floor((b.ih-(alley?2:0))/2)):Math.min(12,b.ih);
  for(const side of (two?['N','S']:['N'])) rowOf(b, side, ()=>{ const w=R(7,12), d=Math.max(6,maxD-R(0,2)); const [kind,sign]=pick(SHOP_KINDS);
    return {w,d,gap:0,place:(x,y,w,d,doors)=>B('shop', x, y, w, d, doors, { kind, sign: w*4>=sign.length*4+4 ? sign : null, mat:pick([0,1,4,5,1]), roof:pick(['#4e5052','#5a4a42','#46504a','#55585b']) })}; }, true);
  if(alley){ const ay=b.iy+Math.floor(b.ih/2)-1; world.lots.push({k:'conc', x:b.ix, y:ay, w:b.iw, h:2}); if(rnd()<.7) prop('dumpster', b.ix+R(2,b.iw-4), ay, {w:2}); }
}
function parking(x,y,w,h,fill=0.35,cols){ if(w<4||h<3) return; world.lots.push({k:'parking', x,y,w,h});
  for(let px=x+1; px<x+w-2; px+=3) if(rnd()<fill) car(px, y+h-2, false, cols?pick(cols):undefined); }
function centered(b,w){ return b.ix+Math.max(0,Math.floor((b.iw-w)/2)); }
function gasStation(x,y,face,compact){
  if(compact){ world.lots.push({k:'conc', x, y, w:12, h:14});
    prop('pump', x+2, y+3); prop('pump', x+6, y+3); prop('pump', x+2, y+7); prop('pump', x+6, y+7); prop('barrel', x+10, y+1, {light:1}); return; }
  world.lots.push({k:'conc', x, y, w:26, h:10});
  for(const px of [x+4,x+8,x+12]) { prop('pump', px, y+3); prop('pump', px, y+6); }
  B('kiosk', x+18, y+1, 8, 7, [[x+21,y+7]], { mat:4, roof:'#8a2a22', sign:'GAS' });
  prop('trash', x+17, y+8);
}
const FILL = {
  residential(b){ residential(b); },
  shops_row(b){ shopsRow(b); },
  offices(b){ let x=b.ix+1; while(x+13<=b.ix+b.iw){ const w=Math.min(R(13,16),b.ix+b.iw-x), h=Math.min(R(10,12),b.ih-2);
      if(w<12) break; B('office', x, b.iy+1, w, h, [[x+Math.floor(w/2), b.iy+h]], { mat:pick([5,4,1]), roof:'#505456', sign: w>=26?'OFFICE':null }); x+=w+2; }
    if(b.ih-13>=4) parking(b.ix+1, b.iy+13, b.iw-2, b.ih-13); },
  apartments(b){ const h=Math.min(18,b.ih-2), n=Math.max(1,Math.floor((b.iw+1)/14)), m=pick([5,1,4,0]);
    for(let k=0;k<n;k++){ const x=b.ix+1+k*14; B('apartment', x, b.iy+1, 13, h, [[x+6, b.iy+h]], { mat:m, roof:'#55585b' }); } },
  plaza(b){ world.lots.push({k:'park', x:b.ix, y:b.iy, w:b.iw, h:b.ih});
    const fx=b.ix+(b.iw>>1)-1, fy=b.iy+(b.ih>>1)-1; prop('fountain', fx, fy, {w:2,h:2});
    prop('bench', fx-5, fy, {w:2}); prop('bench', fx+5, fy+1, {w:2}); prop('bench', fx, fy-4, {w:2}); prop('bench', fx, fy+4, {w:2});
    for(let k=0;k<6;k++) prop('tree', b.ix+1+R(0,b.iw-3), b.iy+1+R(0,b.ih-3)); prop('barrel', fx+3, fy+3, {light:1}); },
  mall(b){ const x=centered(b,28); B('mall', x, b.iy+1, 28, 18, [[x+13,b.iy+1],[x+14,b.iy+1],[x+13,b.iy+18],[x+14,b.iy+18]], { mat:4, roof:'#5d5f60', sign:'MALL' }); },
  hospital(b){ B('hospital', b.ix+1, b.iy+1, 26, 14, [[b.ix+13,b.iy+14],[b.ix+14,b.iy+14]], { mat:5, roof:'#6a6c6e', sign:'HOSPITAL' });
    parking(b.ix+1, b.iy+16, Math.min(26,b.iw-2), b.ih-16, 0.4, ['#d8d8d0','#c8c8c0','#7a7a72']); },
  police(b){ B('police', b.ix+2, b.iy+1, 22, 13, [[b.ix+12,b.iy+13]], { mat:5, roof:'#4e555c', sign:'POLICE' }); parking(b.ix+2, b.iy+15, 22, b.ih-15, 0.5, ['#1e2a44','#e8e8e8']); },
  supermarket(b){ B('supermarket', b.ix+2, b.iy+1, 24, 13, [[b.ix+13,b.iy+13],[b.ix+14,b.iy+13]], { mat:pick([1,5,4]), roof:'#57595a', sign:'MARKET' });
    parking(b.ix+2, b.iy+15, 24, b.ih-15, 0.35); prop('dumpster', b.ix+3, b.iy, {w:2}); },
  gun_conv(b){ B('gunstore', b.ix+1, b.iy+1, 12, 10, [[b.ix+6,b.iy+10]], { mat:1, roof:'#4a4038', sign:'GUNS' });
    B('conv', b.ix+15, b.iy+1, 11, 9, [[b.ix+20,b.iy+9]], { mat:4, roof:'#5c5a55', sign:'24/7' }); if(b.ih>=16) residential(b,{sides:['S'],maxDepth:Math.min(8,b.ih-13)}); },
  church_park(b){ const h=Math.min(17,b.ih-2); B('church', b.ix+1, b.iy+1, 12, h, [[b.ix+7,b.iy+h]], { mat:6, roof:'#3a3532', sign:'+' });
    world.lots.push({k:'park', x:b.ix+14, y:b.iy, w:b.iw-14, h:b.ih}); prop('bench', b.ix+17, b.iy+4, {w:2}); prop('bench', b.ix+20, b.iy+b.ih-4, {w:2});
    for(let k=0;k<4;k++) prop('tree', b.ix+15+R(0,Math.max(1,b.iw-17)), b.iy+1+R(0,b.ih-3)); },
  warehouse(b){ const w=Math.min(24,b.iw-4), h=Math.min(14,b.ih-6); const x=b.ix+2, dx=x+(w>>1);
    B('warehouse', x, b.iy+1, w, h, [[dx,b.iy+h],[dx+1,b.iy+h]], { mat:5, roof:'#5a6066', sign: w>=24?'STORAGE':null, metal:true });
    world.lots.push({k:'conc', x:b.ix, y:b.iy+h+2, w:b.iw, h:b.ih-h-2}); prop('dumpster', b.ix+2, b.iy+h+2, {w:2}); prop('crate', b.ix+b.iw-3, b.iy+h+3); },
  factory(b){ const w=Math.min(36,b.iw-2), h=Math.min(18,b.ih-4); const x=b.ix+1, dx=x+(w>>1);
    B('warehouse', x, b.iy+1, w, h, [[dx,b.iy+h],[dx+1,b.iy+h],[x+3,b.iy+h]], { mat:0, roof:'#4e5458', sign:'FACTORY', metal:true });
    world.lots.push({k:'conc', x:b.ix, y:b.iy+h+2, w:b.iw, h:b.ih-h-2}); for(let k=0;k<3;k++) prop('crate', b.ix+2+k*2, b.iy+h+3); prop('barrel', b.ix+b.iw-2, b.iy+h+2, {light:1}); },
  firestation(b){ const x=b.ix+1, y=b.iy+1, w=Math.min(24,b.iw-2), h=14;
    B('firestation', x, y, w, h, [[x+2,y+h-1],[x+3,y+h-1],[x+7,y+h-1],[x+8,y+h-1],[x+w-5,y+h-1]], { mat:0, roof:'#5a3a32', sign:'FIRE' });
    if(b.ih-h-1>=3) world.lots.push({k:'conc', x:b.ix, y:y+h, w:b.iw, h:b.ih-h-1}); },
  gas(b){ gasStation(b.ix+1, b.iy+1, 'S'); if(b.ih>=21) residential(b,{sides:['S'],maxDepth:Math.min(8,b.ih-13)}); },
  docks(b){ const w=Math.min(26,b.iw-2); B('warehouse', b.ix+1, b.iy+1, w, 9, [[b.ix+13,b.iy+9],[b.ix+14,b.iy+9]], { mat:5, roof:'#4a5a66', sign:'PORT', metal:true });
    world.lots.push({k:'conc', x:b.ix, y:b.iy+11, w:b.iw, h:b.ih-11});
    const cols=['#8a3a2a','#2a5a7a','#3a6a3a','#8a6a2a','#5a5a62'];
    for(let yy=b.iy+12; yy<=b.iy+b.ih-3; yy+=3) for(let xx=b.ix+1; xx<b.ix+b.iw-2; xx+=3) if(rnd()<.75) prop('container', xx, yy, {w:2, c:pick(cols)}); b.docks=true; },
  shops(b){ B('supermarket', b.ix+1, b.iy+1, 16, 10, [[b.ix+8,b.iy+10],[b.ix+9,b.iy+10]], { mat:pick([1,4]), roof:'#57595a', sign:'MARKET' });
    B('conv', b.ix+19, b.iy+1, Math.min(9,b.iw-19), 8, [[b.ix+22,b.iy+8]], { mat:4, roof:'#5c5a55', sign:'24/7' });
    if(b.ih>=19) residential(b,{sides:['S'],maxDepth:Math.min(7,b.ih-13)}); },
  civic(b){ B('clinic', b.ix+1, b.iy+1, 13, 10, [[b.ix+7,b.iy+10]], { mat:4, roof:'#6a6c6e', sign:'CLINIC' });
    B('police', b.ix+15, b.iy+1, 12, 10, [[b.ix+21,b.iy+10]], { mat:5, roof:'#4e555c', sign:'POLICE' });
    if(b.ih>=19) residential(b,{sides:['S'],maxDepth:Math.min(7,b.ih-13)}); },
  clinic_church(b){ B('clinic', b.ix+1, b.iy+1, 13, 10, [[b.ix+7,b.iy+10]], { mat:4, roof:'#6a6c6e', sign:'CLINIC' });
    const h=Math.min(15,b.ih-2); B('church', b.ix+16, b.iy+1, 11, h, [[b.ix+21,b.iy+h]], { mat:6, roof:'#3a3532', sign:'+' });
    world.lots.push({k:'park', x:b.ix+1, y:b.iy+12, w:13, h:b.ih-12}); prop('bench', b.ix+4, b.iy+14, {w:2}); prop('tree', b.ix+10, b.iy+13); },
};

// ---------------------------------------------------------------------
// The places (authored centres, sizes and character)
// ---------------------------------------------------------------------
const CITY = { jog:8, core:.5, xCore:[20,24], xOuter:[24,30], yCore:[18,22], yOuter:[24,28], merge:.15 };
const TOWN = { jog:7, core:.6, xCore:[30,34], xOuter:[22,28], yCore:[22,26], yOuter:[22,26], merge:.1 };
const CITY_PLAN = ['plaza:core','mall','hospital','police','firestation','supermarket','gun_conv','church_park','supermarket','apartments','offices','gas:avenue?','gas:avenue?','warehouse:outer'];
settlement('Westbrook',  'city', 200, 175, 150, 100, {...CITY, plan:[...CITY_PLAN,'apartments']});
settlement('Riverside',  'city', 150, 915, 150, 72, {...CITY, plan:CITY_PLAN.map(p=>p==='mall'?'supermarket':p)});
settlement('Ironvale',   'city', 700,1000, 140, 100, {...CITY, plan:[...CITY_PLAN,'factory:outer?','warehouse:east','warehouse:east']});
settlement('Port Halden','city', 500,1262, 150, 72, {...CITY, plan:['docks:south','docks:south','docks:south',...CITY_PLAN.map(p=>p==='mall'||p==='church_park'?p+'?':p),'warehouse:outer']});
const TOWNS = [ ['Millbrook',596,130,'civic'], ['Brookhaven',436,280,'clinic_church'], ['Oakridge',736,380,'civic'], ['Cedar Falls',416,462,'civic'],
  ['Ashford',100,630,'clinic_church'], ['Dunmore',366,812,'clinic_church'], ['Harlow',676,832,'civic'], ['Pinecrest',356,1142,'clinic_church'] ];
for(const [name,x,y,civic] of TOWNS) settlement(name,'town',x,y,R(62,74),R(42,50),{...TOWN, plan:['shops:core',civic+':core','gas:avenue?','firestation?','church_park:outer?'].filter((p,k)=>k<4||civic==='civic')});

// ---------------------------------------------------------------------
// Highways (authored connections between settlement exits)
// ---------------------------------------------------------------------
function exitPt(name, side){ return S[name].exits[side]; }
function hseg(x1,x2,y,k){ const a=Math.min(x1,x2), b=Math.max(x1,x2); world.roads.push({k, x:a, y, w:b-a+4, h:4}); }
function vseg(y1,y2,x,k){ const a=Math.min(y1,y2), b=Math.max(y1,y2); world.roads.push({k, x, y:a, w:4, h:b-a+4}); }
function route(P,Q,k='hwy'){
  if(P.d==='H' && Q.d==='H'){ const mx=Math.round((P.x+Q.x)/2); hseg(P.x,mx,P.y,k); vseg(P.y,Q.y,mx,k); hseg(mx,Q.x,Q.y,k); }
  else if(P.d==='V' && Q.d==='V'){ const my=Math.round((P.y+Q.y)/2); vseg(P.y,my,P.x,k); hseg(P.x,Q.x,my,k); vseg(my,Q.y,Q.x,k); }
  else if(P.d==='H'){ hseg(P.x,Q.x,P.y,k); vseg(P.y,Q.y,Q.x,k); }
  else { vseg(P.y,Q.y,P.x,k); hseg(P.x,Q.x,Q.y,k); }
}
const HIGHWAYS = [
  ['Westbrook','E','Millbrook','W'],
  ['Westbrook','S','Ashford','N'],          // the west coast highway (north–south)
  ['Ashford','S','Riverside','N'],
  ['Riverside','E','Pinecrest','W'],
  ['Pinecrest','S','Port Halden','W'],
  ['Port Halden','N','Ironvale','W'],
  ['Ironvale','S','Port Halden','E'],
  ['Ironvale','N','Harlow','S'],
  ['Harlow','W','Dunmore','E'],
  ['Dunmore','N','Cedar Falls','S'],
  ['Cedar Falls','N','Brookhaven','S'],
  ['Brookhaven','W','Westbrook','E'],
  ['Brookhaven','E','Oakridge','W'],
  ['Millbrook','S','Oakridge','N'],
  ['Oakridge','S','Ironvale','N'],
];
const hwyStart = world.roads.length;
for(const [a,as,b,bs] of HIGHWAYS) route(exitPt(a,as), exitPt(b,bs));

// ---------------------------------------------------------------------
// Gated communities
// ---------------------------------------------------------------------
// temp grid of roads to aim condo access roads at
const roadGrid = new Uint8Array(W*H);
function stampRoads(from){ for(let i=from;i<world.roads.length;i++){ const r=world.roads[i]; for(let y=r.y;y<r.y+r.h;y++) for(let x=r.x;x<r.x+r.w;x++) if(x>=0&&y>=0&&x<W&&y<H) roadGrid[y*W+x]=1; } }
stampRoads(0);
function rectHitsRegion(x,y,w,h,ignore){
  for(const r of world.regions){ if(r===ignore) continue; if(x<r.x+r.w && x+w>r.x && y<r.y+r.h && y+h>r.y) return r.name; }
  return null;
}
for(const [name,x,y] of CONDOS){
  const w=50, h=40; const reg={name, kind:'condo', x, y, w, h}; world.regions.push(reg);
  const cx=x+Math.floor(w/2)-1, cy=y+Math.floor(h/2)-1;
  // choose gate side: shortest clear straight line to an existing road
  let best=null;
  for(const side of ['N','S','E','W']){
    const dx= side==='E'?1:side==='W'?-1:0, dy= side==='S'?1:side==='N'?-1:0;
    let px = side==='E'? x+w : side==='W'? x-1 : cx, py = side==='S'? y+h : side==='N'? y-1 : cy;
    let n=0, wet=false; while(px>=0&&py>=0&&px<W&&py<H && n<260 && !roadGrid[py*W+px]){ if(!onLand(px,py)) { wet=true; break; } px+=dx; py+=dy; n++; }
    if(wet || n>=260 || px<0||py<0||px>=W||py>=H) continue;
    const rx = dx>0 ? x+w : dx<0 ? px+1 : cx, ry = dy>0 ? y+h : dy<0 ? py+1 : cy;
    const rw = dx? n : 3, rh = dy? n : 3;
    if(rectHitsRegion(rx-6,ry-6,rw+12,rh+12,reg)) continue;
    if(!best || n<best.n) best={side,n,rx,ry,rw,rh};
  }
  if(!best){ // fallback: L-shaped access road to the nearest road tile
    let tgt=null, bd=1e9;
    for(let yy=Math.max(0,cy-220); yy<Math.min(H,cy+220); yy+=2) for(let xx=Math.max(0,cx-220); xx<Math.min(W,cx+220); xx+=2)
      if(roadGrid[yy*W+xx]){ const d=Math.abs(xx-cx)+Math.abs(yy-cy); if(d<bd){ bd=d; tgt=[xx,yy]; } }
    if(tgt){ const side = Math.abs(tgt[1]-cy)>Math.abs(tgt[0]-cx) ? (tgt[1]>cy?'S':'N') : (tgt[0]>cx?'E':'W');
      const gx = side==='E'?x+w : side==='W'?x-1 : cx, gy = side==='S'?y+h : side==='N'?y-1 : cy;
      if(side==='N'||side==='S'){ world.roads.push({k:'road',x:cx,y:Math.min(gy,tgt[1]),w:3,h:Math.abs(tgt[1]-gy)+1}); world.roads.push({k:'road',x:Math.min(cx,tgt[0]),y:tgt[1],w:Math.abs(tgt[0]-cx)+3,h:3}); }
      else { world.roads.push({k:'road',x:Math.min(gx,tgt[0]),y:cy,w:Math.abs(tgt[0]-gx)+1,h:3}); world.roads.push({k:'road',x:tgt[0],y:Math.min(cy,tgt[1]),w:3,h:Math.abs(tgt[1]-cy)+3}); }
      best={side,n:0}; }
  }
  if(!best){ warn.push('no access for '+name); continue; }
  reg.gate=best.side;
  if(best.n>0) world.roads.push({k:'road', x:best.rx, y:best.ry, w:best.rw, h:best.rh});
  // perimeter wall with a 3-wide gate
  const gx0 = best.side==='N'||best.side==='S' ? cx : null, gy0 = best.side==='E'||best.side==='W' ? cy : null;
  const seg=(x0,y0,ww,hh)=>{ if(ww>0&&hh>0) world.walls.push({x:x0,y:y0,w:ww,h:hh}); };
  if(best.side==='N'){ seg(x,y,gx0-x,1); seg(gx0+3,y,x+w-gx0-3,1); } else seg(x,y,w,1);
  if(best.side==='S'){ seg(x,y+h-1,gx0-x,1); seg(gx0+3,y+h-1,x+w-gx0-3,1); } else seg(x,y+h-1,w,1);
  if(best.side==='W'){ seg(x,y+1,1,gy0-y-1); seg(x,gy0+3,1,y+h-1-gy0-3); } else seg(x,y+1,1,h-2);
  if(best.side==='E'){ seg(x+w-1,y+1,1,gy0-y-1); seg(x+w-1,gy0+3,1,y+h-1-gy0-3); } else seg(x+w-1,y+1,1,h-2);
  // internal cross roads
  world.roads.push({k:'road', x:cx, y:y+1, w:3, h:h-2});
  world.roads.push({k:'road', x:x+1, y:cy, w:w-2, h:3});
  // four mansions with pools
  const quads = [ [x+2, y+2, 'S'], [cx+4, y+2, 'S'], [x+2, cy+4, 'N'], [cx+4, cy+4, 'N'] ];
  for(const [qx,qy,door] of quads){
    const mw=14, mh=10;
    const my = door==='S' ? cy-1-mh : qy;           // house hugs the internal road
    const mx = qx + (rnd()<.5 ? 0 : 7);
    const ddx = mx + R(4,mw-5), ddy = door==='S' ? my+mh-1 : my;
    B('mansion', mx, my, mw, mh, [[ddx,ddy]], { mat:pick([4,6,2,7]), roof:pick(MROOFS) });
    world.lots.push({k:'path', x:ddx, y: door==='S'? my+mh : cy+3, w:1, h: door==='S'? cy-(my+mh) : my-(cy+3)});
    const poolX = mx===qx ? mx+mw+1 : qx, poolY = door==='S' ? qy+2 : qy+mh-5;
    world.pools.push({x:poolX, y:poolY, w:6, h:4});
    prop('tree', mx===qx ? qx+20 : qx+1, door==='S' ? qy+7 : qy+1);
  }
  // guard booth next to the gate (inside), first spot that doesn't collide with a house or pool
  const boothSpots = {
    S:[[cx+4,y+h-4,4,3,[cx+4,y+h-3]],[cx-5,y+h-4,4,3,[cx-2,y+h-3]]],
    N:[[cx+4,y+1,4,3,[cx+4,y+2]],[cx-5,y+1,4,3,[cx-2,y+2]]],
    E:[[x+w-4,cy+4,3,4,[x+w-4,cy+5]],[x+w-4,cy-5,3,4,[x+w-4,cy-4]],[x+w-8,cy+4,3,3,[x+w-8,cy+5]]],
    W:[[x+1,cy+4,3,4,[x+3,cy+5]],[x+1,cy-5,3,4,[x+3,cy-4]],[x+5,cy+4,3,3,[x+7,cy+5]]],
  }[best.side];
  let booth=false;
  for(const [bx,by,bw,bh,door] of boothSpots){ if(!overlapsStuff(bx-1,by-1,bw+2,bh+2)){ B('booth', bx, by, bw, bh, [door], {mat:7, roof:'#4a4e52'}); booth=true; break; } }
  if(!booth){ // search any free 3x3 spot next to the internal road near the gate
    const onRoad=(bx,by,bw,bh)=> (bx<cx+3 && bx+bw>cx) || (by<cy+3 && by+bh>cy);
    outer: for(let t=0;t<40;t++){ for(const [bx,by] of [[cx+4+t%8,cy+4],[cx-4-t%8,cy+4],[cx+4+t%8,cy-4],[cx-4-t%8,cy-4],[cx+4,cy+4+t%8],[cx-4,cy-4-t%8]]){
      if(bx<=x+1||by<=y+1||bx+3>=x+w-1||by+3>=y+h-1) continue;
      if(onRoad(bx-1,by-1,5,5) || overlapsStuff(bx-1,by-1,5,5)) continue;
      const dside = by>cy ? [bx+1,by] : [bx+1,by+2];
      B('booth', bx, by, 3, 3, [dside], {mat:7, roof:'#4a4e52'}); booth=true; break outer; } }
  }
  if(!booth) warn.push(name+': no booth');
  // gas station + convenience store outside the gate, beside the access road
  {
    const opts = {
      S:[[cx+5,y+h+2, cx-12,y+h+3,'top'],[cx-14,y+h+2, cx+5,y+h+3,'top']],
      N:[[cx+5,y-16, cx-12,y-12,'bot'],[cx-14,y-16, cx+5,y-12,'bot']],
      E:[[x+w+3,cy+5, x+w+3,cy-10,'bot'],[x+w+3,cy-17, x+w+3,cy+5,'top']],
      W:[[x-16,cy+5, x-14,cy-10,'bot'],[x-16,cy-17, x-14,cy+5,'top']],
    }[best.side];
    // extra fallbacks: beside the condo wall on the other sides
    opts.push([x+w+3,y+4, x+w+3,y+20,'top'], [x-16,y+4, x-14,y+22,'top'], [x+4,y+h+3, x+20,y+h+3,'top'], [x+4,y-17, x+20,y-12,'bot']);
    let ok=false;
    for(const [gx,gy,sx,sy,dpos] of opts){
      if(clearOutside(gx,gy,12,14) && clearOutside(sx,sy,10,9)){
        gasStation(gx, gy, best.side, true);
        B('conv', sx, sy, 10, 9, [[sx+5, dpos==='top'? sy : sy+8]], { mat:4, roof:'#5c5a55', sign:'24/7' });
        if(dpos==='top') world.lots.push({k:'path', x:sx+5, y:sy-2, w:1, h:2}); else world.lots.push({k:'path', x:sx+5, y:sy+9, w:1, h:2});
        ok=true; reg.services=true; break;
      }
    }
    if(!ok) warn.push(name+': no room for gas station');
  }
}
function overlapsStuff(x,y,w,h){
  for(const b of world.buildings) if(x<b.x+b.w && x+w>b.x && y<b.y+b.h && y+h>b.y) return true;
  for(const p of world.pools) if(x<p.x+p.w && x+w>p.x && y<p.y+p.h && y+h>p.y) return true;
  return false;
}
function clearOutside(x,y,w,h){
  if(x<1||y<1||x+w>W-1||y+h>H-1) return false;
  if(!onLand(x,y)||!onLand(x+w,y)||!onLand(x,y+h)||!onLand(x+w,y+h)) return false;
  if(rectHitsRegion(x-1,y-1,w+2,h+2,null)) return false;
  for(let yy=y;yy<y+h;yy++) for(let xx=x;xx<x+w;xx++) if(roadGrid[yy*W+xx]) return false;
  for(const l of world.lakes) if(((x+w/2-l.x)/(l.rx+w/2))**2+((y+h/2-l.y)/(l.ry+h/2))**2<1) return false;
  return !overlapsStuff(x,y,w,h);
}

// ---------------------------------------------------------------------
// Countryside: farms and lone houses along the highways
// ---------------------------------------------------------------------
stampRoads(0);
function stampRect(x,y,w,h){ for(let yy=y;yy<y+h;yy++) for(let xx=x;xx<x+w;xx++) if(xx>=0&&yy>=0&&xx<W&&yy<H) roadGrid[yy*W+xx]=1; }
let nFarms=0, nLone=0;
for(let i=hwyStart;i<world.roads.length;i++){
  const rd=world.roads[i]; if(rd.k!=='hwy' || rd.w<=rd.h || rd.w<50) continue;   // horizontal stretches only
  for(let sx=rd.x+14; sx<rd.x+rd.w-34; sx+=R(45,95)){
    const up = rnd()<.5;
    if(rnd()<.35 && nFarms<10){ // farm: farmhouse + barn facing the road, field behind
      const fy = up ? rd.y-31 : rd.y+rd.h+3;
      if(!clearOutside(sx-2,fy,32,28)) continue;
      const hy = up ? rd.y-12 : rd.y+rd.h+3, hd = up ? hy+8 : hy;
      const field = up ? {x:sx-2,y:fy,w:30,h:17} : {x:sx-2,y:hy+11,w:30,h:17};
      B('house_m', sx, hy, 11, 9, [[sx+5, up?hy+8:hy]], { mat:pick([2,3,0]), roof:pick(HROOFS) });
      B('warehouse', sx+14, hy, 12, 9, [[sx+19,up?hy+8:hy],[sx+20,up?hy+8:hy]], { mat:0, roof:'#7a2a22', metal:true, barn:true });
      world.lots.push({k:'field', ...field});
      world.lots.push({k:'path', x:sx+5, y: up?hy+9:rd.y+rd.h, w:1, h: up? rd.y-(hy+9) : hy-(rd.y+rd.h)});
      world.lots.push({k:'path', x:sx+19, y: up?hy+9:rd.y+rd.h, w:2, h: up? rd.y-(hy+9) : hy-(rd.y+rd.h)});
      stampRect(sx-2,fy,32,28); nFarms++; sx+=30;
    } else if(nLone<40){
      const w=R(8,11), d=8, hy = up ? rd.y-3-d : rd.y+rd.h+3;
      if(!clearOutside(sx-1,hy-1,w+2,d+2)) continue;
      const dx=sx+R(2,w-3);
      B(w>=11?'house_m':'house_s', sx, hy, w, d, [[dx, up?hy+d-1:hy]], { mat:pick([0,1,2,3,4]), roof:pick(HROOFS) });
      world.lots.push({k:'path', x:dx, y: up?hy+d:rd.y+rd.h, w:1, h:3});
      if(rnd()<.4) car(dx+2, up?hy+d:rd.y+rd.h, false);
      stampRect(sx-1,hy-1,w+2,d+2); nLone++;
    }
  }
}
process.stderr.write(`farms ${nFarms}, lone houses ${nLone}\n`);

// ---------------------------------------------------------------------
// Forests (fixed list, avoiding settlements and roads)
// ---------------------------------------------------------------------
stampRoads(0);
for(let a=0; a<1500 && world.forests.length<80; a++){
  const fx=R(10,W-10), fy=R(10,H-10), rx=R(14,44), ry=R(10,32);
  if(!onLand(fx-rx,fy)||!onLand(fx+rx,fy)||!onLand(fx,fy-ry)||!onLand(fx,fy+ry)) continue;
  if(rectHitsRegion(fx-rx-6, fy-ry-6, 2*rx+12, 2*ry+12, null)) continue;
  let road=false; for(let yy=fy-ry; yy<=fy+ry && !road; yy+=2) for(let xx=fx-rx; xx<=fx+rx; xx+=2){ if(xx>=0&&yy>=0&&xx<W&&yy<H && roadGrid[yy*W+xx] && ((xx-fx)/rx)**2+((yy-fy)/ry)**2<1){ road=true; break; } }
  if(road && rnd()<0.6) continue; // a few forests may straddle a highway
  world.forests.push({x:fx,y:fy,rx,ry,d:pick([0.05,0.09,0.13,0.18,0.24])});
}

// ---------------------------------------------------------------------
// Street props: barrels, trash cans, wrecked cars
// ---------------------------------------------------------------------
for(const name in S){
  const st=S[name], r=st.r;
  const nB = r.kind==='city' ? 7 : 2;
  for(let i=0;i<nB;i++){ const b=pick(st.blocks); prop('barrel', b.x, b.y, {light:1}); }
  const streets=world.roads.slice(st.roadsFrom, st.roadsTo).filter(rd=>Math.max(rd.w,rd.h)>=16);
  const nC = r.kind==='city' ? 26 : 6;
  for(let i=0;i<nC && streets.length;i++){ const rd=pick(streets); const horiz=rd.w>rd.h;
    if(horiz) car(rd.x+R(6,rd.w-8), rd.y+(rnd()<.5?0:rd.h-2), false); else car(rd.x+(rnd()<.5?0:rd.w-2), rd.y+R(6,rd.h-8), true); }
}
for(let i=hwyStart;i<world.roads.length;i++){
  const rd=world.roads[i]; if(rd.k!=='hwy') continue;
  const horiz = rd.w>rd.h, L = horiz? rd.w : rd.h;
  for(let s=10; s<L-10; s+=R(28,60)){ if(rnd()<.6){ if(horiz) car(rd.x+s, rd.y+(rnd()<.5?0:2), false); else car(rd.x+(rnd()<.5?0:2), rd.y+s, true); } }
}

// ---------------------------------------------------------------------
// Port Halden waterfront: wooden piers into the sea and a few wrecked boats
// ---------------------------------------------------------------------
world.boats=[];
for(const bl of S['Port Halden'].blocks.filter(b=>b.docks)){
  const y0=bl.y+bl.h+4;                                      // just below the waterfront street
  for(const px of [bl.x+6, bl.x+bl.w-9]){
    let cy=y0; while(cy<H-1 && onLand(px+1,cy)) cy++;          // where the shore is under this pier
    if(cy-y0>40) continue;
    const len=(cy-y0)+18;
    world.lots.push({k:'pier', x:px, y:y0, w:3, h:len});
    world.lots.push({k:'pier', x:px-6, y:y0+len-6, w:15, h:3});
    world.boats.push({x:px+4, y:cy+4, v:1}, {x:px-5, y:cy+6, v:1});
    prop('crate', px, y0+len-2); prop('barrel', px+2, cy+1, {light:1});
  }
}

// ---------------------------------------------------------------------
// Solar sites: houses that kept working panels + battery after the storm
// (one mansion per gated community, two houses per city, one per town)
// ---------------------------------------------------------------------
const inReg=(b,r)=>b.x>=r.x && b.y>=r.y && b.x+b.w<=r.x+r.w && b.y+b.h<=r.y+r.h;
for(const r of world.regions){
  const pool = world.buildings.filter(b=>inReg(b,r) && (r.kind==='condo' ? b.t==='mansion' : b.t==='house_m'));
  const n = r.kind==='city' ? 2 : 1;
  for(let k=0;k<n && pool.length;k++){ const b=pool.splice(Math.floor(rnd()*pool.length),1)[0]; b.solar=1; }
}

// ---------------------------------------------------------------------
// sanity: highways crossing settlements they don't belong to
// ---------------------------------------------------------------------
for(let i=hwyStart;i<world.roads.length;i++){ const r=world.roads[i]; if(r.k!=='hwy') continue;
  for(const g of world.regions){ if(g.kind!=='condo') continue; if(r.x<g.x+g.w && r.x+r.w>g.x && r.y<g.y+g.h && r.y+r.h>g.y) warn.push('highway crosses '+g.name); } }
for(const b of world.buildings){ if(b.x<0||b.y<0||b.x+b.w>W||b.y+b.h>H) warn.push('building out of bounds '+b.t+' '+b.id);
  if(!onLand(b.x,b.y)||!onLand(b.x+b.w,b.y+b.h)||!onLand(b.x+b.w,b.y)||!onLand(b.x,b.y+b.h)) warn.push('building in the sea '+b.t+' '+b.id); }
for(const g of world.regions){ for(const [x,y] of [[g.x-3,g.y-3],[g.x+g.w+3,g.y-3],[g.x-3,g.y+g.h+3],[g.x+g.w+3,g.y+g.h+3]]) if(!onLand(x,y)) { warn.push('region near sea: '+g.name+' @'+x+','+y); break; } }
for(let i=hwyStart;i<world.roads.length;i++){ const r=world.roads[i]; for(const [x,y] of [[r.x,r.y],[r.x+r.w,r.y+r.h],[r.x+(r.w>>1),r.y+(r.h>>1)]]) if(!onLand(x,y)){ warn.push('road in the sea @'+x+','+y); break; } }
for(let i=hwyStart;i<world.roads.length;i++){ const r=world.roads[i]; if(r.k!=='hwy') continue;
  for(const g of world.regions){ if(g.kind==='condo') continue; if(r.x<g.x+g.w && r.x+r.w>g.x && r.y<g.y+g.h && r.y+r.h>g.y){ const own = true; } } }

process.stderr.write(`regions ${world.regions.length}, buildings ${world.buildings.length}, props ${world.props.length}, cars ${world.cars.length}, roads ${world.roads.length}, forests ${world.forests.length}\n`);
const counts={}; for(const b of world.buildings) counts[b.t]=(counts[b.t]||0)+1; process.stderr.write(JSON.stringify(counts)+'\n');
if(warn.length) process.stderr.write('WARN:\n'+warn.join('\n')+'\n');
process.stdout.write('// After Light — world map (generated once by tools/design_world.js, fixed for every game)\nwindow.WORLD=' + JSON.stringify(world) + ';\n');

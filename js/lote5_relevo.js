// =====================================================================
// Lote 5 (Ludimus v2): RELEVO EM DEGRAUS + MONUMENTOS COLOSSAIS + ATMOSFERA
// - Altura por ladrilho (determinística): platôs h = 1..3 (24 px por nível) nas serras e rochedos,
//   água e rios abaixo do chão (-18 px), abismos bem fundos (-48 px), praia em rampa suave.
//   Cidades, vilas, estradas, prédios, portas, pontes e píeres ficam sempre no nível 0.
// - Paredões pintados (face SO iluminada, SE na sombra, borda de musgo/neve/areia), escadas de pedra,
//   barrancos e cais na beira d'água, estacas de madeira sob pontes e píeres.
// - Colosso do Peregrino 8x6 com arco/túnel passável e sombra longa; Cachoeira do Véu em 3 quedas
//   descendo um paredão de verdade; landmarks pintados (assets/lote5/landmarks).
// - Câmera abre (zoom-out suave) perto dos dois monumentos; névoa na base das quedas e dos abismos.
// Tudo é só desenho + altura visual: colisão, caminhos e missões continuam os do jogo (diferença
// máxima de 1 nível entre vizinhos, então sempre dá para subir e descer andando).
// =====================================================================
(function(){
'use strict';
if(typeof ISOC==='undefined'||typeof TL==='undefined') return;
const TW=48, TH=24, EP=24, WATER_PX=-18, CHASM_PX=-48, SAND1=-9, SAND2=-4;
const B='assets/lote5/landmarks/';
const R5=window.RELEVO={on:false, ready:false, errors:[], img:{}, meta:null, stats:{}};
const hsh=ISOC.hsh, vn=ISOC.vnoise;
let PX=null, PC=null, LV=null;   // px de altura (Int8), flags de peça (1 = peça, 2 = redesenhar topo), nível inteiro >=0
const inb=(x,y)=>x>=0&&y>=0&&x<W&&y<H;
const pxAt=(x,y)=>PX&&inb(x,y)?PX[y*W+x]:0;
R5.px=pxAt;
R5.elev=(x,y)=>pxAt(x,y)/EP;
R5.level=(x,y)=>LV&&inb(x,y)?LV[y*W+x]:0;
R5.piece=(x,y)=>!!(PC&&inb(x,y)&&PC[y*W+x]);
const ON2=()=>window.WORLD_ID===2;
// ---------------- cor (mesma graduação do iso.js) ----------------
function grade(r,g,b){ const l=r*.3+g*.59+b*.11; r=l+(r-l)*.82; g=l+(g-l)*.82; b=l+(b-l)*.82; return [(r-128)*1.06+133,(g-128)*1.06+129,(b-128)*1.06+122]; }
function gradeCopy(im){ const c=document.createElement('canvas'); c.width=im.width; c.height=im.height; const g=c.getContext('2d'); g.drawImage(im,0,0);
  const d0=g.getImageData(0,0,c.width,c.height), d=d0.data; for(let k=0;k<d.length;k+=4){ if(!d[k+3]) continue; const q=grade(d[k],d[k+1],d[k+2]); d[k]=q[0]; d[k+1]=q[1]; d[k+2]=q[2]; } g.putImageData(d0,0,0); return c; }

// =====================================================================
// 1) MAPA DE ALTURA
// =====================================================================
const T_=k=>TL[k]===undefined?-99:TL[k];
const NOLIFT=new Set(['SEA','WATER','ICE','CHASM','BRIDGE','PIER','WALL','WINDOW','ASPH','WALK','CONC','WOOD','CARPET','KTILE','LINO','FIELD','PARK','FENCE','SAND','SWAMP'].map(T_));
const WETT=new Set([T_('SEA'),T_('WATER')]);
const NATURE=new Set(['tree','pine','olive','palm','brush','berry','rock','log','deadtree','cactus','plant']);
function cheb(src,cap){ // distância de Chebyshev até a fonte (src=1), em dois passes
  const N=W*H, d=new Uint8Array(N); for(let i=0;i<N;i++) d[i]=src[i]?0:cap;
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){ const i=y*W+x; let v=d[i]; if(!v) continue;
    if(x>0&&d[i-1]+1<v) v=d[i-1]+1; if(y>0){ if(d[i-W]+1<v) v=d[i-W]+1; if(x>0&&d[i-W-1]+1<v) v=d[i-W-1]+1; if(x<W-1&&d[i-W+1]+1<v) v=d[i-W+1]+1; } d[i]=v; }
  for(let y=H-1;y>=0;y--) for(let x=W-1;x>=0;x--){ const i=y*W+x; let v=d[i]; if(!v) continue;
    if(x<W-1&&d[i+1]+1<v) v=d[i+1]+1; if(y<H-1){ if(d[i+W]+1<v) v=d[i+W]+1; if(x<W-1&&d[i+W+1]+1<v) v=d[i+W+1]+1; if(x>0&&d[i+W-1]+1<v) v=d[i+W-1]+1; } d[i]=v; }
  return d; }
function lipschitz(h,x0,y0,x1,y1){ // vizinhos (8) diferem no máximo 1 nível
  x0=Math.max(0,x0|0); y0=Math.max(0,y0|0); x1=Math.min(W-1,x1|0); y1=Math.min(H-1,y1|0);
  for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++){ const i=y*W+x; let v=h[i]; if(!v) continue;
    if(x>x0&&h[i-1]+1<v) v=h[i-1]+1; if(y>y0){ if(h[i-W]+1<v) v=h[i-W]+1; if(x>x0&&h[i-W-1]+1<v) v=h[i-W-1]+1; if(x<x1&&h[i-W+1]+1<v) v=h[i-W+1]+1; } h[i]=v; }
  for(let y=y1;y>=y0;y--) for(let x=x1;x>=x0;x--){ const i=y*W+x; let v=h[i]; if(!v) continue;
    if(x<x1&&h[i+1]+1<v) v=h[i+1]+1; if(y<y1){ if(h[i+W]+1<v) v=h[i+W]+1; if(x<x1&&h[i+W+1]+1<v) v=h[i+W+1]+1; if(x>x0&&h[i+W-1]+1<v) v=h[i+W-1]+1; } h[i]=v; } }
function excluded(i,x,y){ const t=map[i];
  if(NOLIFT.has(t)) return true;
  if(regionId[i]!==255) return true;
  if(typeof bld!=='undefined'&&bld[i]>=0) return true;
  if(doors.has(i)) return true;
  if(typeof reserved!=='undefined'&&reserved[i]) return true;
  if(y>=1280) return true;
  if(typeof DG!=='undefined'&&DG&&typeof inDGT==='function'&&inDGT(x,y)) return true;
  const o=objGrid[i]; if(o&&!NATURE.has(o.type)) return true;
  return false; }
// tira degraus de 1 ladrilho (fendas e cristas finas): no platô de neve viravam triângulos escuros soltos
function despeckle(h,ex){ const N8=[-W-1,-W,-W+1,-1,1,W-1,W,W+1];
  for(let it=0;it<4;it++){ let n=0;
    for(let y=1;y<H-1;y++) for(let x=1;x<W-1;x++){ const i=y*W+x; if(ex[i]) continue; const v=h[i], l=h[i-1], r=h[i+1], u=h[i-W], d=h[i+W]; let t=-1;
      if((l>v&&r>v)||(u>v&&d>v)) t=v+1; else if(v>0&&((l<v&&r<v)||(u<v&&d<v))) t=v-1; else continue;
      let ok=true; for(const o of N8){ if(Math.abs(h[i+o]-t)>1){ ok=false; break; } } if(ok){ h[i]=t; n++; } }
    if(!n) break; } }
let SPECIAL=[];   // zonas forçadas (Colosso / Cachoeira)
function computeElev(){ const t0=performance.now(), N=W*H, ROCK=T_('ROCK'), SNOW=T_('SNOW');
  const ex=new Uint8Array(N), rk=new Uint8Array(N);
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){ const i=y*W+x; if(excluded(i,x,y)) ex[i]=1; if(map[i]===ROCK) rk[i]=1; }
  for(const o of (window.LM_LIST||[])){ for(let y=o.y-3;y<o.y+(o.h||1)+3;y++) for(let x=o.x-3;x<o.x+(o.w||1)+3;x++) if(inb(x,y)) ex[y*W+x]=1; }
  const dR=cheb(rk,16), dE=cheb(ex,8), h=new Uint8Array(N);
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){ const i=y*W+x; if(ex[i]) continue; let raw=0;
    if(rk[i]) raw=3; else { const d=dR[i]+(vn(x/7.3,y/7.3,51)-.5)*3.4; raw=d<=2.3?3:d<=5.2?2:d<=8.6?1:0; }
    if(map[i]===SNOW){ const f=vn(x/23,y/23,57)*.7+vn(x/7,y/7,58)*.3; if(f>.6) raw=Math.max(raw,1); if(f>.71) raw=Math.max(raw,2); }
    h[i]=Math.min(raw,Math.max(0,dE[i]-2)); }
  lipschitz(h,0,0,W-1,H-1);
  despeckle(h,ex);
  for(const z of SPECIAL) z.apply(h);
  lipschitz(h,0,0,W-1,H-1);
  for(const z of SPECIAL) if(z.pin) z.pin(h);
  // px: platôs, água abaixo, abismo bem fundo, praia em rampa
  const px=new Int8Array(N), CH=T_('CHASM'), SAND=T_('SAND');
  for(let i=0;i<N;i++) px[i]=h[i]*EP;
  const wet=new Uint8Array(N); for(let i=0;i<N;i++){ const t=map[i]; if(WETT.has(t)) wet[i]=1; }
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){ const i=y*W+x; if(h[i]) continue; const t=map[i];
    if(y>=1280) continue;
    if(WETT.has(t)) px[i]=WATER_PX; else if(t===CH) px[i]=CHASM_PX; }
  const dW=cheb(wet,4);
  for(let y=0;y<Math.min(H,1280);y++) for(let x=0;x<W;x++){ const i=y*W+x; if(h[i]||map[i]!==SAND) continue; if(dW[i]===1) px[i]=SAND1; else if(dW[i]===2) px[i]=SAND2; }
  for(const z of SPECIAL) if(z.px) z.px(px);
  // peças: tudo que não está no 0, quem tem vizinho da frente mais baixo, e quem precisa cobrir um vizinho de trás mais baixo
  const pc=new Uint8Array(N), BACK=[]; for(let dy=0;dy<=4;dy++) for(let dx=0;dx<=4;dx++){ if(!dx&&!dy) continue; if(Math.abs(dx-dy)>1) continue; BACK.push([dx,dy,dx===dy?(dx+dy-2)*12:(dx+dy-1)*12]); }
  let np=0;
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){ const i=y*W+x, p=px[i]; let f=p?1:0;
    if(y+1<H&&px[i+W]<p) f=1; if(x+1<W&&px[i+1]<p) f=1;
    for(const [dx,dy,thr] of BACK){ const xx=x-dx, yy=y-dy; if(xx<0||yy<0) continue; if(p-px[yy*W+xx]>thr){ f|=3; break; } }
    pc[i]=f; if(f) np++; }
  PX=px; PC=pc; LV=h; R5.on=true;
  let e1=0,e2=0,e3=0; for(let i=0;i<N;i++){ if(h[i]===1) e1++; else if(h[i]===2) e2++; else if(h[i]===3) e3++; }
  R5.stats={ms:Math.round(performance.now()-t0),h1:e1,h2:e2,h3:e3,pieces:np};
  try{ if(window.isoFlush) isoFlush(); }catch(e){} }
R5.recompute=computeElev;
// ao construir (casas, muros...) o terreno em volta volta a ficar plano
function flattenAt(x,y){ if(!PX) return; const i0=y*W+x; if(!inb(x,y)) return; const t=map[i0], o=objGrid[i0];
  const built=(NOLIFT.has(t)&&!WETT.has(t)&&t!==T_('CHASM'))||(o&&!NATURE.has(o.type))||(typeof bld!=='undefined'&&bld[i0]>=0);
  if(!built||(!LV[i0]&&PX[i0]>=0)) return;
  for(let yy=y-2;yy<=y+2;yy++) for(let xx=x-2;xx<=x+2;xx++) if(inb(xx,yy)){ const i=yy*W+xx; LV[i]=0; if(PX[i]>0) PX[i]=0; }
  lipschitz(LV,x-8,y-8,x+8,y+8);
  for(let yy=y-9;yy<=y+9;yy++) for(let xx=x-9;xx<=x+9;xx++) if(inb(xx,yy)){ const i=yy*W+xx; if(PX[i]>=0) PX[i]=LV[i]*EP; PC[i]=PX[i]?1:0; }
  try{ if(window.isoFlush) isoFlush(); }catch(e){} }
if(typeof dirtyChunks==='function'){ const _dc=dirtyChunks; dirtyChunks=function(x,y){ try{ flattenAt(x,y); }catch(e){} return _dc(x,y); }; }

// =====================================================================
// 2) MONUMENTOS: Colosso 8x6 com túnel e Cachoeira em 3 quedas (só Aelória II)
// =====================================================================
const COL={o:null}, CAC={o:null};
function moveObj(o,nx,ny,nw,nh,holes){ // reposiciona um objeto do mundo sem trocar o id (saves continuam valendo)
  for(let dy=0;dy<o.h;dy++) for(let dx=0;dx<o.w;dx++){ const i=idx(o.x+dx,o.y+dy); if(objGrid[i]===o) objGrid[i]=null; }
  try{ const L=chunkObjs[cidx(o.x,o.y)], k=L.indexOf(o); if(k>=0) L.splice(k,1); }catch(e){}
  o.x=nx; o.y=ny; o.w=nw; o.h=nh; o.sortY=(o.y+o.h)*T-2;
  for(let dy=0;dy<nh;dy++) for(let dx=0;dx<nw;dx++){ if(holes&&holes(dx,dy)) continue; objGrid[idx(nx+dx,ny+dy)]=o; }
  try{ chunkObjs[cidx(nx,ny)].push(o); }catch(e){} }
function clearNat(x0,y0,x1,y1){ for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++){ if(!inb(x,y)) continue; const o=objGrid[idx(x,y)]; if(o&&NATURE.has(o.type)) removeObj(o); } }
function dryT(x,y){ if(!inb(x,y)) return false; const i=idx(x,y), t=map[i]; return !WETT.has(t)&&t!==TL.WALL&&t!==TL.WINDOW&&t!==T_('ICE')&&t!==T_('CHASM')&&(typeof bld==='undefined'||bld[i]<0)&&regionId[i]===255&&!doors.has(i); }
function freeBox(x,y,w,h,self){ for(let dy=0;dy<h;dy++) for(let dx=0;dx<w;dx++){ const xx=x+dx, yy=y+dy; if(!dryT(xx,yy)) return false; const o=objGrid[idx(xx,yy)]; if(o&&o!==self&&!NATURE.has(o.type)) return false; } return true; }
function setupColosso(){ const LM=window.LM_LIST||[]; const o=LM.find(q=>q.type==='colosso'); if(!o) return; COL.o=null;
  const cx=o.x+o.w/2, cy=o.y+o.h/2; let best=null, bs=1e9;
  for(let y=Math.round(cy-3)-6;y<=Math.round(cy-3)+6;y++) for(let x=Math.round(cx-4)-6;x<=Math.round(cx-4)+6;x++){ if(!freeBox(x,y,8,6,o)) continue; let wet=0; for(let yy=y-2;yy<y+8;yy++) for(let xx=x-2;xx<x+10;xx++) if(!dryT(xx,yy)) wet++; const s=Math.hypot(x+4-cx,y+3-cy)+wet*.6; if(s<bs){ bs=s; best=[x,y]; } }
  if(!best) return; const [nx,ny]=best;
  clearNat(nx-3,ny-3,nx+10,ny+8);
  moveObj(o,nx,ny,8,6,(dx,dy)=>dx===3||dx===4);
  o.v5=1;
  // terraço de pedra (h=1) com 2 ladrilhos em volta, no chão de lajes
  const ter=[]; for(let y=ny-2;y<ny+8;y++) for(let x=nx-2;x<nx+10;x++){ if(!dryT(x,y)) continue; const q=objGrid[idx(x,y)]; if(q&&q!==o) continue; const i=idx(x,y); map[i]=TL.WALK; if(typeof fden!=='undefined') fden[i]=0; ter.push(i); }
  for(let y=ny-8;y<ny+14;y++) for(let x=nx-8;x<nx+16;x++){ if(!inb(x,y)) continue; const i=idx(x,y), d=Math.max(nx-2-x,x-(nx+9),ny-2-y,y-(ny+7)); if(d>6) continue; if(map[i]===T_('FOREST')) map[i]=TL.GRASS; if(typeof fden!=='undefined'&&d<=4) fden[i]=0; }
  clearNat(nx-7,ny-7,nx+14,ny+12);
  // corredor da sombra longa (para leste-nordeste): sem árvores, para a sombra aparecer na grama
  for(let y=ny-4;y<=ny+9;y++) for(let x=nx+6;x<=nx+27;x++){ if(!inb(x,y)) continue; const i=idx(x,y); if(map[i]===T_('FOREST')) map[i]=TL.GRASS; if(typeof fden!=='undefined') fden[i]=0; }
  clearNat(nx+6,ny-4,nx+27,ny+9);
  // atrás do Colosso (a estátua sobe ~600 px): sem árvores que cruzem a silhueta
  // (faixa da tela acima da estátua: u-v entre -7 e 11, até 44 ladrilhos para trás)
  for(let y=ny-40;y<ny+2;y++) for(let x=nx-40;x<=nx+14;x++){ if(!inb(x,y)) continue; const u=x-nx, v=y-ny; if(u-v<-7||u-v>11||u+v>0||u+v<-44) continue;
    if(u>=-2&&v>=-2) continue; const i=idx(x,y); if(map[i]===T_('FOREST')) map[i]=TL.GRASS; if(typeof fden!=='undefined') fden[i]=0; const q=objGrid[i]; if(q&&NATURE.has(q.type)&&['tree','pine','palm','deadtree','bigtree'].includes(q.type)) removeObj(q); }
  COL.o=o; COL.ter=new Set(ter);
  SPECIAL.push({apply(h){ for(let y=ny-8;y<ny+14;y++) for(let x=nx-8;x<nx+16;x++) if(inb(x,y)) h[y*W+x]=0; for(const i of COL.ter) h[i]=1; }}); }
function setupCachoeira(){ const LM=window.LM_LIST||[]; const o=LM.find(q=>q.type==='cachoeira'); if(!o) return; CAC.o=null;
  const ox=o.x, oy=o.y, mx=ox-10, my=oy+3, MW=5, MH=4;
  // queda nova: maciço 5x4 a oeste do poço; o rio desce em degraus para o leste até o poço
  if(!freeBox(mx,my,MW,MH,o)) { /* tenta mesmo assim: limpa natureza */ }
  clearNat(mx-6,my-6,mx+10,my+9);
  const DIRT=T_('DIRT'), RUB=T_('RUBBLE');
  for(let y=oy-3;y<oy+2;y++) for(let x=ox-1;x<ox+7;x++) if(inb(x,y)&&(map[idx(x,y)]===TL.ROCK||map[idx(x,y)]===RUB)){ map[idx(x,y)]=DIRT; }
  moveObj(o,mx,my,MW,MH,null); o.v5=1;
  for(let y=my;y<my+MH;y++) for(let x=mx;x<mx+MW;x++){ const i=idx(x,y); map[i]=RUB; if(typeof fden!=='undefined') fden[i]=0; }
  const sy=my+2, stream=[]; for(let k=0;k<4;k++){ const x=mx+MW+k, i=idx(x,sy); map[i]=TL.WATER; if(typeof fden!=='undefined') fden[i]=0; const q=objGrid[i]; if(q&&NATURE.has(q.type)) removeObj(q); stream.push([x,sy]); }
  for(let k=1;k<=3;k++){ const i=idx(mx+MW+3+k,sy); if(inb(mx+MW+3+k,sy)&&dryT(mx+MW+3+k,sy)&&!objGrid[i]){ map[i]=TL.WATER; stream.push([mx+MW+3+k,sy]); } else break; }
  // ledge de pedra dos dois lados do rio
  for(let y=sy-1;y<=sy+1;y+=2) for(let k=0;k<3;k++){ const x=mx+MW+k, i=idx(x,y); if(dryT(x,y)&&!objGrid[i]) map[i]=RUB; }
  CAC.o=o; CAC.stream=stream; CAC.sy=sy; CAC.sx=mx+MW;
  SPECIAL.push({apply(h){ for(let y=my-14;y<=my+16;y++) for(let x=mx-14;x<=mx+12;x++){ if(!inb(x,y)) continue; const i=y*W+x;
      let v=x<=mx+MW-1+1?3:x===mx+MW+1?2:x===mx+MW+2?1:0;
      if(x<=mx+MW){ const dyy=Math.abs(y-sy); if(dyy>5) v-=Math.ceil((dyy-5)/2); const dxx=mx-4-x; if(dxx>0) v-=Math.ceil(dxx/2); }
      else { const dyy=Math.abs(y-sy); if(dyy>5) v-=Math.ceil((dyy-5)/2); }
      v=Math.max(0,Math.min(3,v)); const t=map[i]; if(t===TL.SEA||(t===TL.WATER&&!(y===sy&&x>=mx+MW&&x<=mx+MW+2))||regionId[i]!==255) v=0; h[i]=v; } },
    pin(h){ h[idx(mx+MW,sy)]=3; h[idx(mx+MW+1,sy)]=2; h[idx(mx+MW+2,sy)]=1; h[idx(mx+MW+3,sy)]=0; for(let y=my;y<my+MH;y++) for(let x=mx;x<mx+MW;x++) h[idx(x,y)]=3; } }); }
if(window.LMK&&LMK.DRESSX) LMK.DRESSX.push(function(){ SPECIAL=[]; try{ setupColosso(); }catch(e){ console.warn('lote5 colosso',e); } try{ setupCachoeira(); }catch(e){ console.warn('lote5 cachoeira',e); } });
if(typeof buildWorld==='function'){ const _bw5=buildWorld; buildWorld=function(){ if(!ON2()) SPECIAL=[]; const r=_bw5.apply(this,arguments); try{ if(!ON2()){ COL.o=null; CAC.o=null; } computeElev(); }catch(e){ console.warn('lote5 relevo',e); R5.on=false; } try{ if(!ON2()){ HARB.length=0; HBLK.clear(); } else if(typeof walk!=='undefined') for(const i of HBLK) walk[i]=0; }catch(e){} return r; }; }

// =====================================================================
// 3) PINTURA DO RELEVO (topo do platô + paredões + estacas)
// =====================================================================
let MASK=null, TMP=null, TG=null;
function diamondMask(){ const c=document.createElement('canvas'); c.width=TW; c.height=TH; const g=c.getContext('2d'), im=g.createImageData(TW,TH), d=im.data;
  for(let py=0;py<TH;py++) for(let px=0;px<TW;px++){ const a=(px-TW/2)/(TW/2), b=py/(TH/2), U=(a+b)/2, V=(b-a)/2; if(U>=0&&U<1&&V>=0&&V<1){ const k=(py*TW+px)*4; d[k+3]=255; } }
  g.putImageData(im,0,0); return c; }
const FACE=new Map();
const MATC={ rock:[120,106,88], snow:[128,132,142], sand:[176,146,100], earth:[118,92,64], quay:[124,114,98], wood:[96,66,40], chasm:[96,86,78] };
function matOf(x,y,lowT){ const i=y*W+x, t=map[i], r=regions&&regionId[i]!==255?regions[regionId[i]]:null;
  if(t===T_('BRIDGE')||t===T_('PIER')) return ['wood','none'];
  if(t===T_('SAND')||t===T_('DUNE')) return ['sand','none'];
  if(t===T_('SNOW')||t===T_('ICE')) return ['snow','snow'];
  if(t===TL.WALK&&COL.ter&&COL.ter.has(i)) return ['stairs','none'];
  const wetBelow=WETT.has(lowT);
  if(t===TL.WALK||t===T_('ASPH')||t===T_('CONC')||(r&&(r.kind==='city'||r.kind==='town'))) return [wetBelow?'quay':'quay','none'];
  if(lowT===T_('CHASM')) return ['chasm',t===TL.GRASS||t===T_('FOREST')?'grass':'none'];
  if(t===TL.GRASS||t===T_('FOREST')||t===T_('PARK')||t===T_('FIELD')||t===T_('SWAMP')) return [wetBelow?'earth':'rock','grass'];
  if(t===T_('DIRT')||t===T_('RUBBLE')) return ['rock','dirt'];
  return ['rock','none']; }
function faceImg(side,dp,mat,lip,vr,wet){ const key=side+dp+mat+lip+vr+(wet?'w':''); let c=FACE.get(key); if(c) return c;
  const w=TW/2, h=TH/2+dp+1; c=document.createElement('canvas'); c.width=w; c.height=h; const g=c.getContext('2d'), im=g.createImageData(w,h), d=im.data;
  const base=MATC[mat==='stairs'||mat==='rough'?'quay':mat]||MATC.rock, sh=side==='sw'?1.0:mat==='snow'?.84:.7, seed=vr*13+(side==='sw'?0:7);
  for(let py=0;py<h;py++) for(let px=0;px<w;px++){
    const top=side==='sw'?px/2:TH/2-px/2, z=py-top; if(z<0||z>=dp) continue;
    const s=px+vr*24; let c3=base.slice(), f=1;
    const n=hsh(s*3+py,py*5+s,seed), n2=vn(s/5,z/4,seed+3);
    if(mat==='wood'){ // estacas: dois postes, viga do deck no alto e travessa
      const post=(px>=2&&px<=5)||(px>=15&&px<=18); const beam=z<4;
      if(beam){ c3=[110,76,44]; f=z<1?1.25:.95; }
      else if(post){ c3=[84,58,36]; f=(px===2||px===15)?1.2:(px===5||px===18)?.7:1; f*=.9+.2*n; if(z>dp-6&&wet) c3=[52,60,52]; }
      else if(dp>14&&Math.abs((z-6)-(px%13)*0.0)<1&&z>6&&z<9){ c3=[90,62,38]; }
      else continue;
    } else if(mat==='stairs'||mat==='rough'){ const st=mat==='stairs'?8:12, k=Math.floor(z/st), zz=z-k*st;
      f=zz<2?1.3:zz<3?1.1:.78-.04*k; f*=.9+.18*n; if(mat==='rough'){ c3=MATC.rock.slice(); f*=.92+.2*n2; } if(zz>=st-1) f*=.7;
    } else if(mat==='snow'){ // paredão nevado: neve compacta com veios de rocha e pingentes; base com neve acumulada
      const rk=vn(s/4,z/5,seed+31), drip=hsh(px,vr,seed+33)*10+3; c3=[204,212,224]; f=.9+.1*n2+.05*n;
      if(z>drip&&rk>.58&&z<dp-4){ c3=[126,126,134]; f=.85+.25*n2; if(rk>.75) f*=.82; }
      if(z<4) { c3=[236,240,246]; f=1; } if(z>=dp-4) { c3=[222,228,238]; f=.96+.06*n; }
    } else if(mat==='sand'){ f=.9+.14*n2+.06*n; if(z<2) f*=1.12;
    } else if(mat==='quay'){ const row=Math.floor(z/8), zf=z-row*8, bl=(s+(row%2)*9)%18; f=.86+.2*hsh(Math.floor((s+(row%2)*9)/18),row,seed)+.08*n; if(zf<1||bl<1) { c3=[56,50,42]; f=1; } else if(zf<2) f*=1.15;
    } else { // rocha: estratos, rachaduras, luz
      const band=Math.floor((z+n2*6)/6), bz=(z+n2*6)%6; f=.7+.34*hsh(band,vr,seed)+.2*n+.16*(vn(s/3,z/2,seed+4)-.5);
      if(bz<1) f*=.62; else if(bz<2) f*=1.12;
      const fis=(s+z*.45+hsh(band,0,seed)*4)%7; if(hsh(Math.floor((s+z*.45)/7),band>>1,seed+9)>.62&&fis<1) f*=.5;
      if(z<2) f*=1.25; if(z<1) f*=1.1;
      if(mat==='chasm'){ f*=Math.max(.34,1-z/dp*.72); }
      if(mat==='earth'){ c3=z<6?[96,74,50]:MATC.rock.slice(); f*=z<6?1:.95; if(z>=3&&z<6&&n>.7) c3=[70,52,34]; } }
    f*=1-.22*Math.min(1,z/48)*(mat==='wood'||mat==='snow'?0:1);
    let r=c3[0]*f*sh, gg=c3[1]*f*sh, b=c3[2]*f*sh; if(side==='sw'){ r+=6; gg+=3; } else { b+=6; }
    // borda (musgo / neve / terra)
    if(z<3&&lip!=='none'&&mat!=='wood'){ const tuft=hsh(px,vr,seed+21)*3.2; if(z<tuft||z<1){ const L=lip==='grass'?[86,110,44]:lip==='snow'?[226,232,238]:[120,96,64]; const ff=.86+.22*n; r=L[0]*ff*sh; gg=L[1]*ff*sh; b=L[2]*ff*sh; } }
    if(wet&&z>=dp-3){ r*=.62; gg*=.7; b*=.76; if(z>=dp-1&&n>.55){ r=200; gg=214; b=222; } }
    // névoa na base dos paredões altos
    if(dp>=40&&mat!=='chasm'){ const m=Math.max(0,(z-(dp-18))/18)*.35; r+=(210-r)*m; gg+=(218-gg)*m; b+=(226-b)*m; }
    const q=grade(r,gg,b), k=(py*w+px)*4; d[k]=q[0]; d[k+1]=q[1]; d[k+2]=q[2]; d[k+3]=255; }
  g.putImageData(im,0,0); FACE.set(key,c); if(FACE.size>900) FACE.delete(FACE.keys().next().value); return c; }
// fundo do abismo: pedra escura com blocos caídos, fendas e um véu frio de névoa (no lugar do preto liso)
const ABY=new Map();
function abyssTile(v,wb){ const key=v*4+wb; let c=ABY.get(key); if(c) return c; c=document.createElement('canvas'); c.width=TW; c.height=TH; const g=c.getContext('2d'), im=g.createImageData(TW,TH), d=im.data;
  const seed=900+v*17, blobs=[]; for(let k=0;k<5;k++) blobs.push([hsh(k,v,seed)*1.0,hsh(k,v,seed+1)*1.0,.09+hsh(k,v,seed+2)*.15]);
  for(let py=0;py<TH;py++) for(let px=0;px<TW;px++){ const a=(px+.5-TW/2)/(TW/2), b=(py+.5)/(TH/2), U=(a+b)/2, V=(b-a)/2; if(!(U>=0&&U<1&&V>=0&&V<1)) continue;
    const n=vn(U*5+v*3.1,V*5,seed+3), n2=vn(U*13,V*13+v,seed+4); let r=20+n*20+n2*10, gg=20+n*18+n2*9, bb=27+n*20+n2*10;
    for(const [bu,bv,br] of blobs){ const du=U-bu, dv=V-bv, q=Math.hypot(du,dv*1.1); if(q<br){ const lit=-(du+dv)/br; r=74+lit*30+n2*14; gg=70+lit*28+n2*12; bb=74+lit*26+n2*12; if(q>br*.8){ r*=.45; gg*=.45; bb*=.5; } } }
    const cr=Math.abs(vn(U*4+v,V*4,seed+5)-.5); if(cr<.025){ r*=.45; gg*=.45; bb*=.5; }
    let sh=1; if(wb&1) sh*=.45+.55*Math.min(1,U*2.2); if(wb&2) sh*=.45+.55*Math.min(1,V*2.2);
    const m=.12; r=r*sh*(1-m)+92*m; gg=gg*sh*(1-m)+104*m; bb=bb*sh*(1-m)+126*m;
    const k=(py*TW+px)*4; d[k]=r; d[k+1]=gg; d[k+2]=bb; d[k+3]=255; }
  g.putImageData(im,0,0); ABY.set(key,c); return c; }
R5.drawPiece=function(g,it,toL){ const x=it.x, y=it.y, i=y*W+x, p=PX[i], f=PC[i]; if(!f) return null;
  const [tx,ty0]=toL(x,y), tx0=Math.round(tx), ty=Math.round(ty0)-p;
  const ps=y+1<H?PX[i+W]:p, pe=x+1<W?PX[i+1]:p; let maxd=0;
  if(ps<p){ const dp=p-ps, [mt,lp]=matOf(x,y,map[i+W]); g.drawImage(faceImg('sw',dp,mt==='rock'&&lp==='dirt'&&dp===EP&&LV[i]?'rough':mt,lp,(hsh(x,y,3)*4)|0,WETT.has(map[i+W])||map[i+W]===T_('SAND')&&ps<0),tx0-TW/2,ty+TH/2); maxd=dp; }
  if(pe<p){ const dp=p-pe, [mt,lp]=matOf(x,y,map[i+1]); g.drawImage(faceImg('se',dp,mt==='rock'&&lp==='dirt'&&dp===EP&&LV[i]?'rough':mt,lp,(hsh(x,y,5)*4)|0,WETT.has(map[i+1])),tx0,ty+TH/2); maxd=Math.max(maxd,dp); }
  if(p<0&&map[i]===T_('CHASM')){ const wb=(x>0&&PX[i-1]>p?1:0)|(y>0&&PX[i-W]>p?2:0); g.drawImage(abyssTile((hsh(x,y,77)*8)|0,wb),tx0-TW/2,ty); }
  else if(p!==0||(f&2)){ const F=window.isoFloorTile&&isoFloorTile(x,y);
    if(F){ if(!MASK){ MASK=diamondMask(); TMP=document.createElement('canvas'); TMP.width=TW; TMP.height=TH; TG=TMP.getContext('2d'); }
      TG.imageSmoothingEnabled=false; TG.globalCompositeOperation='source-over'; TG.clearRect(0,0,TW,TH); TG.drawImage(F.cv,F.x,F.y,TW/F.FR,TH/F.FR,0,0,TW,TH);
      if(p>0){ TG.globalCompositeOperation='source-atop'; TG.fillStyle=`rgba(255,236,200,${.03*p/EP})`; TG.fillRect(0,0,TW,TH); }
      else if(p<0&&WETT.has(map[i])){ TG.globalCompositeOperation='source-atop'; TG.fillStyle='rgba(10,24,40,.14)'; TG.fillRect(0,0,TW,TH); }
      if(COL.ter&&COL.ter.has(i)&&R5.ready&&R5.img.colosso_v2_sombra){ const o=COL.o, m=R5.meta.colosso_v2, ddx=x-o.x, ddy=y-o.y; // sombra longa do Colosso também sobre o terraço
        TG.globalCompositeOperation='source-atop'; TG.globalAlpha=.6; TG.drawImage(R5.img.colosso_v2_sombra,Math.round(TW/2-(ddx-ddy)*TW/2-m.ax+m.shadow[0]),Math.round(-(ddx+ddy)*TH/2-m.ay+m.shadow[1])); TG.globalAlpha=1; }
      TG.globalCompositeOperation='destination-in'; TG.drawImage(MASK,0,0); TG.globalCompositeOperation='source-over';
      g.drawImage(TMP,tx0-TW/2,ty); } }
  return {x:tx0-TW/2,y:Math.min(ty,Math.round(ty0)),w:TW,h:TH+Math.abs(p)+maxd+TH/2}; };

// =====================================================================
// 4) FIGURAS: altura suave ao subir/descer
// =====================================================================
const EST=new WeakMap(); let frameN=0, lastNow=0;
R5.entPx=function(e){ if(!PX||!e) return 0; const tx=Math.floor(e.x/T), ty=Math.floor((e.y-2)/T); let tg=pxAt(tx,ty);
  let s=EST.get(e); if(!s){ s={v:tg,f:frameN}; EST.set(e,s); return tg; }
  if(s.f!==frameN){ const dt=Math.min(.1,s.t?(lastNow-s.t)/1000:.016); s.t=lastNow; s.f=frameN; s.v+=(tg-s.v)*Math.min(1,dt*11); if(Math.abs(tg-s.v)<.4) s.v=tg; }
  return Math.round(s.v); };
// =====================================================================
// 5) CÂMERA: abre perto dos monumentos
// =====================================================================
let zoom=1, zT=0;
function nearMon(){ if(!player) return 1e9; const px=player.x/T, py=player.y/T; let d=1e9;
  if(COL.o) d=Math.min(d,Math.hypot(px-(COL.o.x+4),py-(COL.o.y+3)));
  if(CAC.o) d=Math.min(d,Math.hypot(px-(CAC.o.x+6),py-(CAC.o.y+2)));
  return d; }
R5.zoomK=function(){ const now=performance.now(), dt=Math.min(.1,zT?(now-zT)/1000:.016); zT=now; if(!ON2()) { zoom=1; return 1; }
  const d=nearMon(), k=Math.max(0,Math.min(1,(34-d)/(34-13))), tgt=1-.24*(k*k*(3-2*k));
  zoom+=(tgt-zoom)*Math.min(1,dt*1.6); if(Math.abs(tgt-zoom)<.003) zoom=tgt; return Math.round(zoom*100)/100; };
R5.zoomNow=()=>zoom;

// =====================================================================
// 6) LANDMARKS PINTADOS
// =====================================================================
const PAINT=['oratorio_pedra','oratorio_neve','oratorio_musgo','espada_rocha','arvore_mae','mastro','poco','arco_gelo','boca_mina','portao_ossos','fachada','ruina_cupula','ruina_torre','ruina_arco','ruina_catedral','colosso_v2','colosso_v2_tunel','colosso_v2_sombra','cachoeira_v2'];
const loadImg=src=>new Promise((res,rej)=>{ const im=new Image(); im.onload=()=>res(im); im.onerror=()=>{ R5.errors.push(src); rej(src); }; im.src=src; });
fetch(B+'meta.json').then(r=>r.json()).then(m=>{ R5.meta=m; return Promise.all(PAINT.map(k=>loadImg(B+k+'.png').then(im=>{ R5.img[k]=k==='colosso_v2_sombra'?im:gradeCopy(im); }).catch(()=>{}))); })
  .then(()=>{ R5.ready=true; try{ if(window.isoFlush) isoFlush(); }catch(e){} }).catch(e=>{ R5.errors.push(String(e)); });
function paintKey(o){ if(!o) return null; if(o.type==='oratorio') return 'oratorio_'+(o.v||'pedra'); if(o.type==='ruina') return 'ruina_'+(o.v||'cupula');
  if(['espada_rocha','arvore_mae','mastro','poco','arco_gelo','boca_mina','portao_ossos','fachada'].includes(o.type)) return o.type; return null; }
function painted(o){ if(!R5.ready||!R5.meta) return null; if(o&&o.type==='barco') return shipPaint(o); if(o.type==='colosso'&&o.v5) return {cv:R5.img.colosso_v2,ax:R5.meta.colosso_v2.ax,ay:R5.meta.colosso_v2.ay};
  if(o.type==='cachoeira'&&o.v5) return {cv:R5.img.cachoeira_v2,ax:R5.meta.cachoeira_v2.ax,ay:R5.meta.cachoeira_v2.ay};
  const k=paintKey(o), m=k&&R5.meta[k]; if(!m||!R5.img[k]||m.w!==o.w||m.h!==o.h) return null; return {cv:R5.img[k],ax:m.ax,ay:m.ay}; }
R5.painted=painted;
const _lit=window.lmIsoItems, _lid=window.lmIsoDraw;
if(_lit) window.lmIsoItems=function(W2S,bw,bh){ if(!R5.ready) return _lit(W2S,bw,bh); const out=_lit(W2S,bw,bh).filter(it=>!(it.o===COL.o&&COL.o)&&!(it.o===CAC.o&&CAC.o));
  const pdep=(player.x+player.y)/T;
  if(COL.o){ const o=COL.o, [X,Y]=W2S(o.x*T,o.y*T); if(X>-700&&X<bw+700&&Y>-200&&Y<bh+760){ const ptx=player.x/T, pty=player.y/T, front=pty>=o.y+o.h||ptx>=o.x+o.w;
      out.push({k:'lm',o:{_r5:'colS',ref:o},d:-1e8+1}); out.push({k:'lm',o:{_r5:'colA',ref:o},d:-1e8+2}); out.push({k:'lm',o:{_r5:'colB',ref:o,front},d:front?pdep-.002:pdep+.002}); } }
  if(CAC.o){ const o=CAC.o, [X,Y]=W2S(o.x*T,o.y*T); if(X>-500&&X<bw+600&&Y>-200&&Y<bh+560){
      out.push({k:'lm',o:{_r5:'cacM',ref:o},d:o.x+o.w+o.y+o.h-.6}); const s=CAC.stream[CAC.stream.length-1]; out.push({k:'lm',o:{_r5:'cacW',ref:o},d:s[0]+s[1]+.6}); } }
  try{ harbItems(W2S,bw,bh,out); }catch(e){}
  return out; };
if(_lid) window.lmIsoDraw=function(g,o,now,W2S,first){
  if(o&&o._r5){ if(first) try{ drawSpecial(g,o,now,W2S); }catch(e){} return null; }
  const pi=painted(o), sh=pxAt(o.x,o.y);
  if(pi&&first){ const [X,Y]=W2S(o.x*T,o.y*T); return {cv:pi.cv,x:Math.round(X-pi.ax),y:Math.round(Y-pi.ay-sh),w:pi.cv.width,h:pi.cv.height}; }
  const r=_lid(g,o,now,W2S,first); if(r&&sh) r.y-=sh; return r; };
function fire(g,x,y,s,now){ const t=now/90; g.fillStyle='rgba(255,150,60,.22)'; g.beginPath(); g.ellipse(x,y-6*s,26*s,20*s,0,0,7); g.fill();
  for(let k=0;k<7;k++){ const j=Math.sin(t+k*1.7)*3*s, hh=(14+Math.sin(t*1.3+k)*5)*s; g.fillStyle=['#b8361f','#e0552a','#ffa340','#ffe08a'][k%4]; g.beginPath(); g.moveTo(x-9*s+k*3*s,y); g.lineTo(x-7*s+k*3*s+j,y-hh); g.lineTo(x-4*s+k*3*s,y); g.fill(); } }
const night=()=>{ const h=typeof time!=='undefined'?time:12; return h<5.5||h>19.5; };
function drawSpecial(g,q,now,W2S){ const o=q.ref, M=R5.meta, [X,Y]=W2S(o.x*T,o.y*T);
  if(q._r5==='hp'){ harbDraw(g,q.ref,now,W2S); return; }
  if(q._r5==='colS'){ const m=M.colosso_v2, sh=pxAt(o.x+3,o.y+5), s=R5.img.colosso_v2_sombra; if(!s) return;
    const h=typeof time==='undefined'?12:time, day=Math.max(0,Math.min(1,(Math.min(h-5.5,19.5-h))/1.5)), cloud=typeof WX!=='undefined'&&WX.rain?1-.6*Math.min(1,WX.rain):1;
    if(day>0){ g.save(); g.globalAlpha=.7*day*cloud; g.drawImage(s,Math.round(X-m.ax+m.shadow[0]),Math.round(Y-m.ay-sh+m.shadow[1])); g.restore(); } return; }
  if(q._r5==='colA'){ const m=M.colosso_v2, sh=pxAt(o.x+3,o.y+5); g.drawImage(R5.img.colosso_v2_tunel,Math.round(X-m.ax),Math.round(Y-m.ay-sh)); return; }
  if(q._r5==='colB'){ const m=M.colosso_v2, sh=pxAt(o.x+3,o.y+5), x0=Math.round(X-m.ax), y0=Math.round(Y-m.ay-sh);
    g.drawImage(R5.img.colosso_v2,x0,y0);
    const bx=x0+m.bowl[0], by=y0+m.bowl[1]; fire(g,bx,by,1.1,now);
    if(night()){ const gr=g.createRadialGradient(bx,by-10,4,bx,by-10,170); gr.addColorStop(0,'rgba(255,190,100,.35)'); gr.addColorStop(1,'rgba(255,160,60,0)'); g.fillStyle=gr; g.fillRect(bx-170,by-180,340,340); }
    // herói por trás/dentro do arco: silhueta por cima
    if(!q.front&&typeof drawPlayer==='function'){ const [PX0,PY0]=W2S(player.x,player.y), PY=PY0-R5.entPx(player); const a=R5.img.colosso_v2;
      if(PX0>x0&&PX0<x0+a.width&&PY>y0&&PY-50<y0+a.height){ const inside=player.x/T>=o.x+3&&player.x/T<o.x+5&&player.y/T>=o.y+o.h-1.2; if(!inside||true){ g.save(); g.globalAlpha=.5; g.translate(Math.round(PX0),Math.round(PY)); g.scale(2,2); try{ drawPlayer(g,0,0); }catch(e){} g.restore(); } } }
    return; }
  if(q._r5==='cacM'){ const m=M.cachoeira_v2, sh=pxAt(o.x,o.y); g.drawImage(R5.img.cachoeira_v2,Math.round(X-m.ax),Math.round(Y-m.ay-sh));
    // água correndo na queda do maciço
    const sx=Math.round(X-m.ax)+m.stream[0], top=Math.round(Y-m.ay-sh)+40, bot=Math.round(Y-m.ay-sh)+m.stream[1]+20;
    g.fillStyle='rgba(240,250,255,.55)'; for(let k=0;k<22;k++){ const ph=((now/7+k*53)%(bot-top)); const xx=sx-3+((k*7)%7); g.fillRect(xx, top+ph, 1, 6); }
    return; }
  if(q._r5==='cacW'){ // água descendo os 3 degraus do paredão, espuma e névoa no poço
    const st=CAC.stream; for(let k=0;k<st.length;k++){ const [x,y]=st[k], p=pxAt(x,y), pe=pxAt(x+1,y), [tx,ty0]=W2S(x*T,y*T), ty=ty0-p;
      g.save(); g.beginPath(); g.moveTo(tx,ty); g.lineTo(tx+TW/2,ty+TH/2); g.lineTo(tx,ty+TH); g.lineTo(tx-TW/2,ty+TH/2); g.closePath(); g.fillStyle='rgba(58,108,140,.78)'; g.fill(); g.restore();
      // brilho correndo no topo
      g.fillStyle='rgba(230,245,255,.5)'; for(let n=0;n<5;n++){ const ph=((now/26+n*9.6+k*17)%48)/48; const U=x+ph, V=y+.25+.5*hsh(n,k,7); const [a,b]=W2S(U*T,V*T); g.fillRect(Math.round(a),Math.round(b-p),3,1); }
      if(pe<p){ const dp=p-pe, ex=tx+TW/2, ey=ty+TH/2; // face SE (borda entre x+1): de (tx,ty+24)->(tx+24,ty+12)
        for(let s=3;s<21;s++){ const fx=tx+s, fy=Math.round(ty+TH-s/2), e=Math.min(s-3,20-s);
          g.fillStyle=`rgba(120,170,205,${e<2?.45:.72})`; g.fillRect(fx,fy,1,dp);
          for(let n=0;n<2;n++){ const fl=(now/4.2+s*29+n*31)%(dp+10)-6; g.fillStyle=(s+n)%3?'rgba(236,246,252,.85)':'rgba(255,255,255,.95)'; g.fillRect(fx,Math.round(fy+Math.max(0,fl)),1,Math.min(5,dp)); } }
        // espuma no pé do degrau
        for(let n=0;n<10;n++){ const a=now/300+n*1.3+k; g.fillStyle=`rgba(255,255,255,${.5+.3*Math.sin(a*2)})`; g.beginPath(); g.ellipse(tx+3+n*2+Math.sin(a)*1.5,ty+TH-n+dp+1,3+Math.sin(a*1.7),1.6,0,0,7); g.fill(); } } }
    const L=st[st.length-1], [bx,by0]=W2S((L[0]+1.5)*T,(L[1]+.5)*T), by=by0-pxAt(L[0]+1,L[1]);
    for(let k=0;k<9;k++){ const a=now/420+k; g.fillStyle=`rgba(240,250,255,${.28+.2*Math.sin(a*2)})`; g.beginPath(); g.ellipse(bx-20+k*5,by+Math.sin(a)*2,6+Math.sin(a*1.7)*2,3,0,0,7); g.fill(); }
    if(!night()&&(typeof WX==='undefined'||WX.rain<.2)){ g.lineWidth=2; ['rgba(255,60,60,.22)','rgba(255,170,40,.22)','rgba(255,240,80,.22)','rgba(80,220,90,.22)','rgba(70,140,255,.22)','rgba(150,80,220,.22)'].forEach((c,k)=>{ g.strokeStyle=c; g.beginPath(); g.ellipse(bx,by-10,80-k*2.5,60-k*2.5,0,Math.PI*1.08,Math.PI*1.92); g.stroke(); }); g.lineWidth=1; }
    return; } }
// chão: sombra longa do Colosso + névoa nos abismos
R5.ground=function(g,W2S,now,bw,bh){ frameN++; lastNow=now;
  if(R5.ready&&COL.o){ const o=COL.o, m=R5.meta.colosso_v2, [X,Y]=W2S(o.x*T,o.y*T), sh=pxAt(o.x+3,o.y+5), s=R5.img.colosso_v2_sombra;
    const day=typeof time==='undefined'?1:Math.max(0,Math.min(1,(Math.min(time-5.5,19.5-time))/2)); } };
// ar: névoa na queda e nos abismos (por cima das figuras, bem suave)
R5.air=function(g,W2S,now,bw,bh){
  if(CAC.o&&CAC.stream){ const L=CAC.stream[Math.min(3,CAC.stream.length-1)], [bx,by]=W2S((L[0]+1)*T,(L[1]+.5)*T);
    if(bx>-200&&bx<bw+200&&by>-200&&by<bh+200){ for(let k=0;k<6;k++){ const a=now/2100+k*1.1; g.fillStyle=`rgba(226,236,246,${.07+.04*Math.sin(a*1.6)})`; g.beginPath(); g.ellipse(bx-40+Math.sin(a)*26+k*14,by-6-k*9,52-k*5,15,0,0,7); g.fill(); }
      const M=R5.meta&&R5.meta.cachoeira_v2, o=CAC.o; if(M){ const [X,Y]=W2S(o.x*T,o.y*T), sx=X-M.ax+M.stream[0], sy=Y-M.ay-pxAt(o.x,o.y)+M.stream[1]; for(let k=0;k<4;k++){ const a=now/1700+k; g.fillStyle=`rgba(236,244,250,${.08+.04*Math.sin(a*2)})`; g.beginPath(); g.ellipse(sx+Math.sin(a)*12,sy-k*12,34-k*4,11,0,0,7); g.fill(); } } } }
  // abismos: névoa fria subindo das bordas
  if(PX){ const inv=(Xs,Ys)=>{ const a=(Xs-(W2S(0,0)[0]))/(TW/2), b=(Ys-(W2S(0,0)[1]))/(TH/2); return [(a+b)/2,(b-a)/2]; };
    const c=inv(bw/2,bh/2), R=Math.ceil(Math.max(bw,bh)/TH)+4, cx=c[0]|0, cy=c[1]|0; let n=0;
    for(let y=cy-R;y<cy+R&&n<90;y+=2) for(let x=cx-R;x<cx+R&&n<90;x+=2){ if(!inb(x,y)||PX[y*W+x]!==CHASM_PX) continue; if(pxAt(x-1,y)===CHASM_PX&&pxAt(x,y-1)===CHASM_PX&&pxAt(x+1,y)===CHASM_PX&&pxAt(x,y+1)===CHASM_PX&&hsh(x,y,3)>.25) continue;
      const [X,Y]=W2S((x+.5)*T,(y+.5)*T); if(X<-60||X>bw+60||Y<-60||Y>bh+80) continue; n++; const a=now/2600+hsh(x,y,9)*6; const ph=((now/70+hsh(x,y,4)*60)%60)/60; g.fillStyle=`rgba(196,208,228,${(.09+.04*Math.sin(a))*Math.sin(ph*Math.PI)})`; g.beginPath(); g.ellipse(X+Math.sin(a)*10,Y+44-ph*46,34,10,0,0,7); g.fill(); } } };
// câmera clássica e primeira pessoa: mesmos desenhos pintados
if(typeof drawObj==='function'){ const _dO5=drawObj; drawObj=function(g,o,sx,sy,now){ const pi=o&&o.lm?painted(o):null;
  if(pi){ const s=.5, gx=pi.ax+(o.w-o.h)/2*TW/2, gy=pi.ay+(o.w+o.h)/2*TH/2; g.drawImage(pi.cv,Math.round(sx+o.w*8-gx*s),Math.round(sy+o.h*16-gy*s),Math.round(pi.cv.width*s),Math.round(pi.cv.height*s)); return; }
  return _dO5(g,o,sx,sy,now); }; }

// =====================================================================
// 7) PORTOS: cais largo sobre estacas, cais de pedra na praia, navio grande ao lado, carga, guindaste
// (decoração sem objetos novos: os ids dos objetos e os saves continuam os mesmos)
// =====================================================================
const PB='assets/lote5/porto/', PIMG=['navio_v2','navio_pirata_v2','porto_guindaste','porto_galpao','porto_lampiao','porto_carga'];
const HARB=[], HBLK=new Set(); R5.HARB=HARB; R5.HBLK=HBLK;
Promise.all(PIMG.map(k=>loadImg(PB+k+'.png').then(im=>{ R5.img[k]=gradeCopy(im); }).catch(()=>{}))).then(()=>{ R5.portReady=true; try{ if(window.isoFlush) isoFlush(); }catch(e){} });
if(window.LMK&&LMK.SZ) LMK.SZ.barco={top:320,pad:150};
const WET2=t=>t===TL.SEA||t===TL.WATER;
function landFree(x,y){ if(!inb(x,y)) return false; const i=idx(x,y), t=map[i]; if(WET2(t)||t===TL.PIER||t===TL.WALL||t===TL.WINDOW||t===T_('CHASM')||t===T_('ICE')||t===T_('BRIDGE')) return false;
  if(typeof bld!=='undefined'&&bld[i]>=0) return false; if(doors.has(i)||HBLK.has(i)) return false; const o=objGrid[i]; return !o||NATURE.has(o.type); }
function portUp(p){ const [x,y]=p.at, b=p.boat; let dir=null;
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) if(inb(x+dx,y+dy)&&map[idx(x+dx,y+dy)]===TL.PIER){ dir=[dx,dy]; break; }
  if(!dir||!b) return; const [dx,dy]=dir, U=dx!==0, lx=U?0:1, ly=U?1:0;
  const at=(k,w)=>[x+dx*k+lx*w,y+dy*k+ly*w];
  const wet=(k,w)=>{ const [a,c]=at(k,w); if(!inb(a,c)) return false; const i=idx(a,c), t=map[i]; if(!WET2(t)&&t!==TL.PIER) return false; const o=objGrid[i]; return !o||o===b; };
  // tira do cais/água os enfeites do porto (braseiro, barril, caixote...) e põe em terra, sem trocar o id
  const MOV=new Set(['brazier','keg','barrel','crate','hay','banner','logs','awning','plant','bench','tent','campfire']);
  const spots=[]; for(let k=-1;k>=-5;k--) for(const w of [1,0,2,-1,3,-2,4,-3,5]){ const [a,c]=at(k,w); if(landFree(a,c)&&!objGrid[idx(a,c)]) spots.push([a,c]); }
  for(let k=0;k<=8;k++) for(let w=-4;w<=6;w++){ const [a,c]=at(k,w); if(!inb(a,c)) continue; const o=objGrid[idx(a,c)]; if(!o||o===b||!MOV.has(o.type)||(o.w||1)>1||(o.h||1)>1) continue;
    const t=map[idx(a,c)]; if(k>0||t===TL.PIER||WET2(t)){ let sp=null; while(spots.length&&!sp){ const q=spots.shift(); if(!objGrid[idx(q[0],q[1])]) sp=q; } if(sp) moveObj(o,sp[0],sp[1],1,1,null); } }
  const wsd=(k,w)=>{ if(wet(k,w)) return true; const [a,c]=at(k,w); if(!inb(a,c)) return false; const i=idx(a,c); return (map[i]===T_('SAND')||map[i]===T_('DUNE'))&&!objGrid[i]&&!doors.has(i)&&(typeof bld==='undefined'||bld[i]<0); };
  let L=0; for(let k=1;k<=7;k++){ if(wet(k,0)&&wet(k,1)) L=k; else break; } if(L<3) return;
  // navio: atrás do cais (lado -) com 1 ladrilho de água entre eles; senão na frente
  let side=-1, k0=-1; const fits=(s,kk)=>{ for(let k=kk;k<kk+4;k++) for(const w of (s<0?[-1,-2,-3]:[3,4,5])) if(!wet(k,w)) return false; return true; };
  for(const s of [-1,1]){ for(const kk of [L-3,L-4,L-2,2,1]) if(kk+3<=L+1&&fits(s,kk)){ side=s; k0=kk; break; } if(k0>0) break; }
  for(let k=1;k<=L;k++) for(let w=0;w<=2;w++){ if(w===2&&!wsd(k,w)) continue; const [a,c]=at(k,w); map[idx(a,c)]=TL.PIER; }
  for(let w=0;w<=2;w++){ const [a,c]=at(0,w); if(inb(a,c)&&(map[idx(a,c)]===T_('SAND')||WET2(map[idx(a,c)]))&&!objGrid[idx(a,c)]) map[idx(a,c)]=TL.WALK; }
  // cabeça em L no fim do cais (lado oposto ao navio)
  const hw=side<0?[3]:[-1]; for(let k=Math.max(1,L-1);k<=L;k++) for(const w of hw){ if(wet(k,w)){ const [a,c]=at(k,w); map[idx(a,c)]=TL.PIER; } }
  let gang=null;
  if(k0>0){ const ws=side<0?[-2,-3]:[4,5], wg=side<0?-1:3, xs=[], ys=[];
    for(let k=k0;k<k0+4;k++) for(const w of ws){ const [a,c]=at(k,w); xs.push(a); ys.push(c); }
    const nx=Math.min(...xs), ny=Math.min(...ys); moveObj(b,nx,ny,U?4:2,U?2:4,null); b.v5s=U?'U':'V'; b.v5side=side;
    gang=[]; for(const k of [k0+1,k0+2]){ const [a,c]=at(k,wg); map[idx(a,c)]=TL.PIER; gang.push(idx(a,c)); } }
  // cais de pedra na praia: lajes junto à raiz do cais
  for(let k=-3;k<=0;k++) for(let w=-3;w<=5;w++){ const [a,c]=at(k,w); if(!landFree(a,c)) continue; const i=idx(a,c), t=map[i];
    if(t===TL.GRASS||t===T_('SAND')||t===T_('DIRT')||t===T_('FOREST')||t===T_('SNOW')||t===T_('DUNE')||t===T_('RUBBLE')){ const q=objGrid[i]; if(q) removeObj(q); map[i]=TL.WALK; if(typeof fden!=='undefined') fden[i]=0; } }
  clearNat(Math.min(x-6,x+dx*8-6),Math.min(y-6,y+dy*8-6),Math.max(x+6,x+dx*8+6),Math.max(y+6,y+dy*8+6));
  const put=(_,img,kk,ww,nk,nw,onPier,solid)=>{ const cs=[]; for(let a=0;a<nk;a++) for(let c=0;c<nw;c++) cs.push(at(kk+a,ww+c));
    for(const [a,c] of cs){ if(!inb(a,c)) return false; const i=idx(a,c); if(onPier?(map[i]!==TL.PIER||objGrid[i]||HBLK.has(i)||(gang&&gang.includes(i))):!landFree(a,c)) return false; }
    const X=Math.min(...cs.map(q=>q[0])), Y=Math.min(...cs.map(q=>q[1])); HARB.push({k:img,x:X,y:Y,w:U?nk:nw,h:U?nw:nk,port:p.id}); if(solid) for(const [a,c] of cs) HBLK.add(idx(a,c)); return true; };
  const pw=side<0?2:0;                       // fileira do cais longe do navio
  const fw=side<0?1:0, nw=side<0?2:0;          // fileiras do cais: longe do navio / mais longe
  const M_=w=>side<0?w:2-w;                      // espelha o lado quando o navio fica na frente
  for(const [kk,ww] of [[-2,-4],[-1,-4],[-2,-5],[-3,-4],[-1,-3],[-3,-5]]) if(put(0,'porto_guindaste',kk,M_(ww)-(side<0?0:1),2,2,false,true)) break;
  put(0,'porto_carga',1,nw,1,1,true,true); put(0,'porto_carga',Math.max(2,L-2),nw,1,1,true,true);
  put(0,'porto_lampiao',L,nw,1,1,true,true);
  for(const [kk,ww] of [[-3,3],[-2,4],[-4,3],[-3,4],[-2,3],[-4,4]]) if(put(0,'porto_galpao',kk,M_(ww)-(side<0?0:1),2,2,false,true)) break;
  for(const [kk,ww] of [[-1,3],[-1,-1],[-2,-1]]) if(put(0,'porto_carga',kk,M_(ww),1,1,false,true)) break;
  for(const [kk,ww] of [[0,-1],[0,3],[-1,-2]]) if(put(0,'porto_lampiao',kk,M_(ww),1,1,false,true)) break;
  // cabeços de amarração (só desenho) na borda do cais do lado do navio
  const bw=side<0?0:2; for(let k=1;k<=L;k+=2){ const [a,c]=at(k,bw); HARB.push({k:'cabeco',x:a,y:c,w:1,h:1,port:p.id,side:side,U}); }
}
function setupPortos(){ HARB.length=0; HBLK.clear(); const P=window.PORTS; if(!P) return; for(const id in P){ try{ portUp(P[id]); }catch(e){ console.warn('lote5 porto',id,e); } } }
if(window.LMK&&LMK.DRESSX) LMK.DRESSX.push(function(){ try{ setupPortos(); }catch(e){ console.warn('lote5 portos',e); } });
if(typeof solidTile==='function'){ const _st5=solidTile; solidTile=function(tx,ty){ if(HBLK.size&&inb(tx,ty)&&HBLK.has(idx(tx,ty))) return true; return _st5(tx,ty); }; }
function shipPaint(o){ if(!R5.portReady||!o.v5s) return null; const cv0=R5.img[o.v==='pirata'?'navio_pirata_v2':'navio_v2']; if(!cv0) return null;
  let cv=cv0; if(o.v5s==='V'){ const k='flip_'+(o.v||'n'); cv=R5.img[k]; if(!cv){ cv=document.createElement('canvas'); cv.width=cv0.width; cv.height=cv0.height; const g=cv.getContext('2d'); g.translate(cv.width,0); g.scale(-1,1); g.drawImage(cv0,0,0); R5.img[k]=cv; } }
  const cxo=(o.w-o.h)/2*TW/2, cyo=(o.w+o.h)/2*TH/2; return {cv,ax:Math.round(cv.width/2-cxo),ay:Math.round(cv.height*.83-cyo)}; }
function cabeco(g,X,Y){ g.fillStyle='rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(X,Y+1,5,2.4,0,0,7); g.fill();
  g.fillStyle='#3a2716'; g.fillRect(X-3,Y-9,6,10); g.fillStyle='#5e432a'; g.fillRect(X-3,Y-9,3,10); g.fillStyle='#24180e'; g.fillRect(X-4,Y-11,8,3);
  g.strokeStyle='#b89a62'; g.lineWidth=1.4; g.beginPath(); g.ellipse(X,Y-5,4.4,1.8,0,0,7); g.stroke(); g.beginPath(); g.ellipse(X+5,Y+1,3.4,1.5,0,0,7); g.stroke(); g.lineWidth=1; }
function harbItems(W2S,bw,bh,out){ for(const h of HARB){ const [X,Y]=W2S(h.x*T,h.y*T); if(X<-260||X>bw+260||Y<-260||Y>bh+200) continue; out.push({k:'lm',o:{_r5:'hp',ref:h},d:h.x+h.w+h.y+h.h-.6}); } }
function harbDraw(g,h,now,W2S){ const [cx,cy0]=W2S((h.x+h.w/2)*T,(h.y+h.h/2)*T), cy=cy0-pxAt(h.x,h.y);
  if(h.k==='cabeco'){ cabeco(g,Math.round(cx),Math.round(cy)); return; }
  const im=R5.img[h.k]; if(!im) return; const base=(h.w+h.h)*TH/4+2, x0=Math.round(cx-im.width/2), y0=Math.round(cy+base-im.height);
  let fade=false; try{ const pd=(player.x+player.y)/T, [PX0,PY0]=W2S(player.x,player.y), PY=PY0-R5.entPx(player); fade=h.x+h.w+h.y+h.h-.6>pd&&PX0>x0+6&&PX0<x0+im.width-6&&PY>y0+10&&PY-30<y0+im.height-8; }catch(e){}
  if(fade) g.globalAlpha=.45; g.drawImage(im,x0,y0); g.globalAlpha=1;
  if(h.k==='porto_lampiao'&&(night()||(typeof time!=='undefined'&&time>17.5))){ const lx=Math.round(cx-im.width/2)+im.width*.72, ly=Math.round(cy+base-im.height)+im.height*.32; const gr=g.createRadialGradient(lx,ly,2,lx,ly,60); gr.addColorStop(0,'rgba(255,200,110,.45)'); gr.addColorStop(1,'rgba(255,170,80,0)'); g.fillStyle=gr; g.fillRect(lx-60,ly-60,120,120); } }
// ajuda para testes
R5.find=function(h,cx,cy,R){ R=R||400; let best=null,bd=1e9; for(let y=Math.max(0,cy-R);y<Math.min(H,cy+R);y++) for(let x=Math.max(0,cx-R);x<Math.min(W,cx+R);x++){ if(LV[y*W+x]!==h||!walk[y*W+x]) continue; const d=Math.hypot(x-cx,y-cy); if(d<bd){ bd=d; best=[x,y]; } } return best; };
R5.COL=COL; R5.CAC=CAC;
})();

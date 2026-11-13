// =====================================================================
// CÂMERA ISOMÉTRICA (2.5D, estilo UO/Diablo): o mundo é desenhado em losango, com paredes finas,
// árvores, rochas e móveis com volume; os personagens continuam sendo os sprites 2D do jogo.
// Opção "Câmera" nas Opções e no menu Esc (Isométrica / Clássica). Usa js/iso_core.js.
// =====================================================================
(function(){
const C=ISOC, TW=C.TW, TH=C.TH, WH=C.WH, CK=16; // ladrilhos por pedaço de chão
let camMode; try{ camMode=localStorage.getItem('outremer_cam')||'iso'; }catch(e){ camMode='iso'; }
window.isoOn=()=>camMode==='iso' && typeof player!=='undefined' && !!player && !driving;
window.setCam=function(m){ camMode=m; try{ localStorage.setItem('outremer_cam',m); }catch(e){} if(m!=='iso'){ try{ resize(); }catch(e){} } syncCamUI(); };
// ---------- cor final (menos saturação, contraste leve, tom quente) ----------
function grade(r,g,b){ const l=r*.3+g*.59+b*.11; r=l+(r-l)*.82; g=l+(g-l)*.82; b=l+(b-l)*.82;
  return [(r-128)*1.06+133, (g-128)*1.06+129, (b-128)*1.06+122]; }
function gradeCanvas(cv){ const g=cv.getContext('2d'), im=g.getImageData(0,0,cv.width,cv.height), d=im.data;
  for(let k=0;k<d.length;k+=4){ if(!d[k+3]) continue; const c=grade(d[k],d[k+1],d[k+2]); d[k]=c[0]; d[k+1]=c[1]; d[k+2]=c[2]; } g.putImageData(im,0,0); }
const biomeAt=(x,y)=>{ const r=(typeof regions!=='undefined'&&regionId)?regions[regionId[y*W+x]]:null;
  if(typeof DG!=='undefined'&&DG&&(inRect(DG.L1,x,y)||inRect(DG.L2,x,y))) return 'dg'; if(r&&(r.kind==='city'||r.kind==='town')) return 'city'; return (r&&r.biome)||'p'; };
// ---------- pedaços de chão (16x16 ladrilhos), com sombras fixas já pintadas ----------
const floorCache=new Map(), FLOOR_MAX=48; let genBudget=0;
function chunkKey(cu,cv){ return cu*4096+cv; }
function genFloor(cu,cv){
  const w=CK*TW, h=CK*TH, cv0=document.createElement('canvas'); cv0.width=w; cv0.height=h+2; const g=cv0.getContext('2d');
  const im=g.createImageData(w,h+2), d=im.data, U0=cu*CK, V0=cv*CK, ox=w/2, oy=0;
  for(let Y=0;Y<h+2;Y++) for(let X=0;X<w;X++){ const a=(X-ox)/(TW/2), b=(Y-oy)/(TH/2), U=(a+b)/2+U0, V=(b-a)/2+V0;
    if(U<U0-.02||V<V0-.02||U>=U0+CK+.02||V>=V0+CK+.02) continue; const x=Math.floor(U), y=Math.floor(V); if(x<0||y<0||x>=W||y>=H) continue;
    let i=y*W+x, t=map[i];
    if(!C.INTERIOR.has(t)&&!C.isWall(t)&&t!==TL.WALK){ const ju=U+(C.vnoise(U*2.3,V*2.3,41)-.5)*.7, jv=V+(C.vnoise(U*2.3,V*2.3,43)-.5)*.7, xx=Math.floor(ju), yy=Math.floor(jv);
      if(xx>=0&&yy>=0&&xx<W&&yy<H){ const t2=map[yy*W+xx]; if(!C.INTERIOR.has(t2)&&!C.isWall(t2)&&t2!==TL.WALK&&t2!==TL.BRIDGE&&t2!==TL.PIER){ t=t2; i=yy*W+xx; } } }
    if(t===TL.WALL||t===TL.WINDOW) t=C.underFloor(x,y);
    const c=grade(...C.floorCol(t,U,V,i,biomeAt(x,y))), k=(Y*w+X)*4; d[k]=c[0]; d[k+1]=c[1]; d[k+2]=c[2]; d[k+3]=255; }
  g.putImageData(im,0,0);
  // sombras fixas (paredes, árvores, rochas, objetos) de dentro e da borda do pedaço
  const S=document.createElement('canvas'); S.width=w; S.height=h+2; const s2=S.getContext('2d'); s2.fillStyle='#000';
  const toS=(U,V)=>[ox+(U-U0-(V-V0))*TW/2, oy+(U-U0+(V-V0))*TH/2];
  const sh=(sx,sy,rx,ry)=>{ s2.beginPath(); s2.ellipse(sx,sy,rx,ry,0,0,7); s2.fill(); };
  const quad=(Ua,Va,Ub,Vb)=>{ const a=toS(Ua,Va), b=toS(Ub,Vb), dx=WH*.62, dy=WH*.2; s2.beginPath(); s2.moveTo(a[0],a[1]); s2.lineTo(b[0],b[1]); s2.lineTo(b[0]+dx,b[1]+dy); s2.lineTo(a[0]+dx,a[1]+dy); s2.closePath(); s2.fill(); };
  const seen=new Set();
  for(let y=V0-3;y<V0+CK+1;y++) for(let x=U0-3;x<U0+CK+1;x++){ if(x<1||y<1||x>=W-1||y>=H-1) continue; const i=y*W+x, t=map[i];
    if(t===TL.ROCK){ const [a,b]=toS(x+.5,y+.5); sh(a+26,b+8,40,16); }
    else if(C.isPanel(t)){ const X=x+.5, Y=y+.5; if(C.isPanel(map[i+1])) quad(X,Y,X+.5,Y); if(C.isPanel(map[i-1])) quad(X-.5,Y,X,Y); if(C.isPanel(map[i+W])) quad(X,Y,X,Y+.5); if(C.isPanel(map[i-W])) quad(X,Y-.5,X,Y); }
    const o=objGrid[i]; if(o&&!seen.has(o)){ seen.add(o); const [a,b]=toS(o.x+(o.w||1)/2,o.y+(o.h||1)/2);
      if(o.type==='tree'||o.type==='olive') sh(a+34,b+8,40,15); else if(o.type==='pine') sh(a+30,b+8,30,11); else if(o.type!=='rug') sh(a+8,b+3,14*(o.w||1),6*(o.h||1)); } }
  g.save(); g.globalAlpha=.38; g.filter='blur(3px)'; g.drawImage(S,0,0); g.restore();
  return cv0;
}
function getFloor(cu,cv,force){ const k=chunkKey(cu,cv); let c=floorCache.get(k);
  if(c){ floorCache.delete(k); floorCache.set(k,c); return c; }
  if(!force && genBudget<=0) return null; genBudget--; c=genFloor(cu,cv); floorCache.set(k,c);
  while(floorCache.size>FLOOR_MAX) floorCache.delete(floorCache.keys().next().value); return c; }
// ---------- imagens fixas em cache: paredes, rochas, árvores, móveis ----------
const sCache=new Map(), S_MAX=5000;
function cacheGet(k,make){ let v=sCache.get(k); if(v) return v; v=make(); sCache.set(k,v); if(sCache.size>S_MAX) sCache.delete(sCache.keys().next().value); return v; }
function localToS(ax,ay,U0,V0){ return (U,V)=>[ax+(U-U0-(V-V0))*TW/2, ay+(U-U0+(V-V0))*TH/2]; }
function wallImg(x,y){ return cacheGet('w'+(y*W+x),()=>{ const i=y*W+x, t0=map[i], cw=TW+8, ch=WH+TH+10, ax=cw/2, ay=WH+6+TH/2;
  const cv=document.createElement('canvas'); cv.width=cw; cv.height=ch; const g=cv.getContext('2d'), im=g.createImageData(cw,ch), toS=localToS(ax,ay,x+.5,y+.5);
  const M=MATS[mat[i]]||MATS[6], back1=map[i-1], back2=map[i-W], nl=map[i+W], nr=map[i+1];
  const low=(C.INTERIOR.has(back1)||C.INTERIOR.has(back2))&&!C.INTERIOR.has(nl)&&!C.INTERIOR.has(nr), Hh=low?8:WH, win=t0===TL.WINDOW&&!low;
  const cU1=C.isPanel(map[i+1]), cU0=C.isPanel(map[i-1]), cV1=C.isPanel(map[i+W]), cV0=C.isPanel(map[i-W]), X=x+.5, Y=y+.5;
  if(cV0) C.drawPanel(im,cw,ch,toS,X,Y-.5,false,.5,Hh,M,win,low); if(cU0) C.drawPanel(im,cw,ch,toS,X-.5,Y,true,.5,Hh,M,win,low);
  if(cU1) C.drawPanel(im,cw,ch,toS,X,Y,true,.5,Hh,M,win,low); if(cV1) C.drawPanel(im,cw,ch,toS,X,Y,false,.5,Hh,M,win,low);
  if(!(cU0||cU1||cV0||cV1)) C.drawPanel(im,cw,ch,toS,X-.1,Y,true,.2,Hh,M,false,low);
  g.putImageData(im,0,0); gradeCanvas(cv); return {cv,ax,ay,low}; }); }
function doorImg(x,y,open){ return cacheGet('d'+(y*W+x)+(open?'o':'c'),()=>{ const i=y*W+x, cw=TW+8, ch=WH+TH+10, ax=cw/2, ay=WH+6+TH/2;
  const cv=document.createElement('canvas'); cv.width=cw; cv.height=ch; if(open) return {cv,ax,ay};
  const g=cv.getContext('2d'), im=g.createImageData(cw,ch), toS=localToS(ax,ay,x+.5,y+.5), M={face:'#6a4628',line:'#3a2414',cap:'#4a3018',pat:'planks'};
  const alongU=C.isPanel(map[i-1])||C.isPanel(map[i+1]);
  if(alongU) C.drawPanel(im,cw,ch,toS,x,y+.5,true,1,WH*.8,M,false,false); else C.drawPanel(im,cw,ch,toS,x+.5,y,false,1,WH*.8,M,false,false);
  g.putImageData(im,0,0); gradeCanvas(cv); return {cv,ax,ay}; }); }
function rockImg(x,y){ return cacheGet('r'+(y*W+x),()=>{ const cw=TW*2+20, ch=150, ax=cw/2, ay=ch-TH-6;
  const cv=document.createElement('canvas'); cv.width=cw; cv.height=ch; const g=cv.getContext('2d');
  isoRock(g,localToS(ax,ay,x+.5,y+.5),x,y,biomeAt(x,y),true); gradeCanvas(cv); return {cv,ax,ay}; }); }
function treeImg(o){ const bio=o.type==='pine'?'n':biomeAt(o.x,o.y), seed=(o.x*7+o.y*13)%40;
  return cacheGet('t'+o.type+bio+seed,()=>{ const cw=150, ch=190, cv=document.createElement('canvas'); cv.width=cw; cv.height=ch; const g=cv.getContext('2d');
    C.drawTree(g,75,184,seed*97+3,bio); gradeCanvas(cv); return {cv,ax:75,ay:184}; }); }
function propImg(o){ return cacheGet('o'+o.x+','+o.y+o.type,()=>{ const w=o.w||1, h=o.h||1, cw=(w+h)*TW/2+60, ch=(w+h)*TH/2+130, ax=h*TW/2+30, ay=110;
  const cv=document.createElement('canvas'); cv.width=cw; cv.height=ch; const g=cv.getContext('2d');
  const r=isoProp(g,localToS(ax,ay,o.x,o.y),o,biomeAt(o.x,o.y)); if(r!==true) return null; gradeCanvas(cv); return {cv,ax,ay}; }); }
const ANIM_TYPES=new Set(['campfire','brazier','candle','hearth','moongate','fountain','orb','cauldron','corpse','carcass']);
// ---------- render ----------
let isoZ=1, isoOX=0, isoOY=0;
function isoSize(){ const Wc=canvas.width, Hc=canvas.height; isoZ=Math.max(1,Math.round(Hc/780)); const bw=Math.ceil(Wc/isoZ), bh=Math.ceil(Hc/isoZ);
  if(buf.width!==bw||buf.height!==bh){ buf.width=bw; buf.height=bh; if(typeof lcv!=='undefined'){ lcv.width=bw; lcv.height=bh; } } return [bw,bh]; }
const W2S=(wx,wy)=>[isoOX+(wx-wy)/T*TW/2, isoOY+(wx+wy)/T*TH/2];
window.isoWorldToScreen=W2S;
const SCL=2; // escala dos sprites 2D dos personagens
// pose pela direção NA TELA (os sprites têm 4 poses: frente, costas, esquerda, direita)
const faceMem=new WeakMap();
function pickFace(sx,sy,prev){ const ax=Math.abs(sx), ay=Math.abs(sy)*2; if(ax>ay*1.12) return sx>0?'right':'left'; if(ay>ax*1.12) return sy>0?'down':'up'; return prev||(sy>0?'down':'up'); }
const wv=(dx,dy)=>[dx-dy,(dx+dy)*.5];
function screenFace(e,k){ let st=faceMem.get(e); if(!st){ st={x:e.x,y:e.y,f:null,t:0}; faceMem.set(e,st); }
  const dx=e.x-st.x, dy=e.y-st.y; st.x=e.x; st.y=e.y;
  if(k==='a'){ if(Math.abs(dx-dy)>.15) st.f=(dx-dy)>0?1:-1; return st.f||e.face; }
  if(Math.hypot(dx,dy)>.25){ const [sx,sy]=wv(dx,dy); st.f=pickFace(sx,sy,st.f); st.t=0; return st.f; }
  // parado: atacando/mirando olha para o alvo; senão mantém a última pose da tela
  if(k==='p' && (player.swing||player.atkCd>0)){ const [sx,sy]=wv(Math.cos(player.aimAng),Math.sin(player.aimAng)); st.f=pickFace(sx,sy,st.f); return st.f; }
  if(k==='r' && Math.hypot(player.x-e.x,player.y-e.y)<3*T){ const [sx,sy]=wv(player.x-e.x,player.y-e.y); st.f=pickFace(sx,sy,st.f); return st.f; }
  if(!st.f){ const v={down:[0,1],up:[0,-1],left:[-1,0],right:[1,0]}[e.face]; if(v){ const [sx,sy]=wv(v[0],v[1]); st.f=pickFace(sx,sy,null); } }
  return st.f||e.face; }
function isoRenderFrame(now){
  const [bw,bh]=isoSize(), g=bctx; genBudget=floorCache.size<6?12:2;
  const px=player.x, py=player.y-6;
  isoOX=Math.round(bw/2-(px-py)/T*TW/2); isoOY=Math.round(bh/2-(px+py)/T*TH/2+20);
  if(shake>0&&OPTS.shake){ isoOX+=Math.round((Math.random()-.5)*shake*2); isoOY+=Math.round((Math.random()-.5)*shake*2); }
  viewX=player.x-bw/3; viewY=player.y-bh/3;
  g.imageSmoothingEnabled=false; g.setTransform(1,0,0,1,0,0); g.fillStyle='#050404'; g.fillRect(0,0,bw,bh);
  // faixa de U,V visível
  const inv=(X,Y)=>{ const a=(X-isoOX)/(TW/2), b=(Y-isoOY)/(TH/2); return [(a+b)/2,(b-a)/2]; };
  const cs=[inv(0,0),inv(bw,0),inv(0,bh+160),inv(bw,bh+160)];
  const U0=Math.max(0,Math.floor(Math.min(...cs.map(c=>c[0])))-2), U1=Math.min(W-1,Math.ceil(Math.max(...cs.map(c=>c[0])))+2);
  const V0=Math.max(0,Math.floor(Math.min(...cs.map(c=>c[1])))-2), V1=Math.min(H-1,Math.ceil(Math.max(...cs.map(c=>c[1])))+2);
  // chão: primeiro os pedaços perto do jogador
  const ch=[]; for(let cv=Math.floor(V0/CK);cv<=Math.floor(V1/CK);cv++) for(let cu=Math.floor(U0/CK);cu<=Math.floor(U1/CK);cu++) ch.push([cu,cv]);
  const pu=player.x/T/CK, pv=player.y/T/CK; ch.sort((a,b)=>Math.hypot(a[0]+.5-pu,a[1]+.5-pv)-Math.hypot(b[0]+.5-pu,b[1]+.5-pv));
  for(const [cu,cv] of ch){ const sx=isoOX+(cu*CK-cv*CK)*TW/2-CK*TW/2, sy=isoOY+(cu*CK+cv*CK)*TH/2;
    if(sx>bw||sx+CK*TW<0||sy>bh||sy+CK*TH<0) continue; const f=getFloor(cu,cv); if(f) g.drawImage(f,sx,sy); }
  // o que fica em pé
  const list=[], seen=new Set(), dep=(u,v)=>u+v;
  const visible=(U,V,up)=>{ const X=isoOX+(U-V)*TW/2, Y=isoOY+(U+V)*TH/2; return X>-120&&X<bw+120&&Y>-30&&Y<bh+(up||200); };
  for(let y=V0;y<=V1;y++) for(let x=U0;x<=U1;x++){ const i=y*W+x, t=map[i];
    if(t===TL.WALL||t===TL.WINDOW||t===TL.ROCK){ if(visible(x+.5,y+.5)) list.push({k:'w',x,y,d:dep(x+1,y+1)-.05,rock:t===TL.ROCK}); }
    else if(t===TL.FENCE){ if(visible(x+.5,y+.5)) list.push({k:'f',x,y,d:dep(x+1,y+1)-.1}); }
    const dr=doors.get(i); if(dr&&visible(x+.5,y+.5)) list.push({k:'door',x,y,dr,d:dep(x+1,y+1)-.05});
    const o=objGrid[i]; if(o&&!seen.has(o)){ seen.add(o); if(visible(o.x+(o.w||1)/2,o.y+(o.h||1)/2)) list.push({k:'o',o,d:o.type==='rug'?-1e9:dep(o.x+(o.w||1),o.y+(o.h||1))-.6}); } }
  const near=e=>visible(e.x/T,e.y/T,120);
  for(const n of npcs) if(!n.dead&&n.active&&near(n)) list.push({k:'n',e:n,d:dep(n.x/T,n.y/T)});
  for(const r of raiders) if(near(r)) list.push({k:'r',e:r,d:dep(r.x/T,r.y/T)});
  for(const a of animals) if(near(a)) list.push({k:'a',e:a,d:dep(a.x/T,a.y/T)});
  list.push({k:'p',d:dep(player.x/T,player.y/T)});
  list.sort((a,b)=>a.d-b.d);
  const [PX,PY]=W2S(player.x,player.y), pdep=dep(player.x/T,player.y/T);
  let hid=false; const occl=(it,X,Y,cw,chh)=>{ const r=it.d>pdep && PX>X-18&&PX<X+cw+18&&PY-10>Y&&PY-50<Y+chh; if(r) hid=true; return r; };
  for(const it of list){
    if(it.k==='w'){ const im=it.rock?rockImg(it.x,it.y):wallImg(it.x,it.y), [X,Y]=W2S((it.x+.5)*T,(it.y+.5)*T), sx=X-im.ax, sy=Y-im.ay;
      const fade=!im.low&&occl(it,sx,sy,im.cv.width,im.cv.height-TH); if(fade) g.globalAlpha=.38; g.drawImage(im.cv,sx,sy); g.globalAlpha=1; }
    else if(it.k==='door'){ const im=doorImg(it.x,it.y,it.dr.open), [X,Y]=W2S((it.x+.5)*T,(it.y+.5)*T); if(!it.dr.open){ const fade=occl(it,X-im.ax,Y-im.ay,im.cv.width,im.cv.height); if(fade) g.globalAlpha=.4; g.drawImage(im.cv,X-im.ax,Y-im.ay); g.globalAlpha=1; } }
    else if(it.k==='f'){ const [X,Y]=W2S((it.x+.5)*T,(it.y+.5)*T); g.fillStyle='#4a3420'; for(const dx of [-14,0,14]) g.fillRect(X+dx-2,Y-26,4,26); g.fillStyle='#5e4228'; g.fillRect(X-18,Y-22,36,4); g.fillRect(X-18,Y-12,36,4); }
    else if(it.k==='o'){ const o=it.o, w=o.w||1, h=o.h||1;
      if(o.type==='tree'||o.type==='pine'||o.type==='olive'){ const im=treeImg(o), [X,Y]=W2S((o.x+.5)*T,(o.y+.5)*T), sx=X-im.ax, sy=Y-im.ay; const fade=occl(it,sx+28,sy,im.cv.width-56,im.cv.height-10); if(fade) g.globalAlpha=.3; g.drawImage(im.cv,sx,sy); g.globalAlpha=1; continue; }
      const im=ANIM_TYPES.has(o.type)?null:propImg(o);
      if(im){ const [X,Y]=W2S(o.x*T,o.y*T); g.drawImage(im.cv,X-im.ax,Y-im.ay); continue; }
      const [X,Y]=W2S((o.x+w/2)*T,(o.y+h)*T); g.save(); g.translate(Math.round(X-w*8*SCL),Math.round(Y-h*16*SCL)); g.scale(SCL,SCL); try{ drawObj(g,o,0,0,now); }catch(e){} g.restore(); }
    else { const e=it.e||player, [X,Y]=W2S(e.x,e.y);
      g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(X+3,Y+1,12,5,0,0,7); g.fill();
      const of=e.face; e.face=screenFace(e,it.k);
      g.save(); g.translate(Math.round(X),Math.round(Y)); g.scale(SCL,SCL);
      try{ if(it.k==='n') drawNPC(g,e,0,0); else if(it.k==='r') drawRaider(g,e,0,0); else if(it.k==='a') drawAnimal(g,e,0,0); else drawPlayer(g,0,-(player.onTower?26:0)); }catch(err){}
      g.restore(); e.face=of; }
  }
  // herói atrás de árvore/parede: silhueta translúcida por cima (como no Diablo)
  if(hid){ const [X,Y]=W2S(player.x,player.y); g.save(); g.globalAlpha=.55; g.translate(Math.round(X),Math.round(Y)); g.scale(SCL,SCL); const of=player.face, st=faceMem.get(player); if(st&&st.f) player.face=st.f; try{ drawPlayer(g,0,0); }catch(e){} player.face=of; g.restore(); }
  // efeitos no chão/ar com a mesma projeção (partículas, rastros, magias, fantasma da construção)
  g.save(); g.setTransform(TW/(2*T),TH/(2*T),-TW/(2*T),TH/(2*T),isoOX,isoOY);
  for(const p of particles){ g.fillStyle=p.col; g.fillRect(Math.round(p.x),Math.round(p.y-p.z*1.6),1.5,1.5); }
  for(const t of tracers){ g.strokeStyle=`rgba(255,230,150,${t.t/.07})`; g.lineWidth=1; g.beginPath(); g.moveTo(t.x1,t.y1); g.lineTo(t.x2,t.y2); g.stroke(); }
  if(typeof drawFX==='function') try{ drawFX(g,0,0); }catch(e){}
  if(ghost){ const gx=ghost.gx*T, gy=ghost.gy*T; g.strokeStyle=ghost.ok?'rgba(110,230,110,.95)':'rgba(240,80,60,.95)'; g.lineWidth=1; g.strokeRect(gx+.5,gy+.5,ghost.w*T-1,ghost.h*T-1); g.fillStyle=ghost.ok?'rgba(110,230,110,.25)':'rgba(240,80,60,.25)'; g.fillRect(gx,gy,ghost.w*T,ghost.h*T); }
  g.restore();
  // luz do dia / noite
  g.fillStyle='rgba(18,22,30,.10)'; g.fillRect(0,0,bw,bh);
  const dusk=Math.max(0,1-Math.abs(time-18.3)/1.6); if(dusk>0){ g.fillStyle=`rgba(230,110,40,${0.12*dusk})`; g.fillRect(0,0,bw,bh); }
  const dk=darkness(time);
  if(dk>0.01){ const lights=[];
    for(const it of list) if(it.k==='o'&&it.o.light){ const [X,Y]=W2S(it.o.x*T+8,it.o.y*T+8); lights.push([X,Y-20,150*flick(now,it.o.seed||1),.32]); }
    const [lx,ly]=W2S(player.x,player.y); lights.push([lx,ly-24,70,0]); if(player.lanternOn&&hasItem('lantern')) lights.push([lx,ly-24,190*flick(now,3),.22]);
    lctx.globalCompositeOperation='source-over'; lctx.clearRect(0,0,bw,bh); lctx.fillStyle=`rgba(4,6,16,${dk})`; lctx.fillRect(0,0,bw,bh); lctx.globalCompositeOperation='destination-out';
    for(const [x,y,r] of lights){ if(x<-r||x>bw+r||y<-r||y>bh+r) continue; const gr=lctx.createRadialGradient(x,y,0,x,y,r); gr.addColorStop(0,'rgba(0,0,0,1)'); gr.addColorStop(.55,'rgba(0,0,0,.7)'); gr.addColorStop(1,'rgba(0,0,0,0)'); lctx.fillStyle=gr; lctx.fillRect(x-r,y-r,2*r,2*r); }
    g.drawImage(lcv,0,0); g.globalCompositeOperation='lighter';
    for(const [x,y,r,wm] of lights){ if(!wm) continue; const gr=g.createRadialGradient(x,y,0,x,y,r*.8); gr.addColorStop(0,`rgba(255,150,60,${wm*dk})`); gr.addColorStop(1,'rgba(255,120,40,0)'); g.fillStyle=gr; g.fillRect(x-r,y-r,2*r,2*r); }
    g.globalCompositeOperation='source-over'; }
  // vinheta
  const vg=g.createRadialGradient(bw/2,bh/2,Math.min(bw,bh)*.45,bw/2,bh/2,Math.max(bw,bh)*.75); vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,.35)'); g.fillStyle=vg; g.fillRect(0,0,bw,bh);
  // tela
  ctx.imageSmoothingEnabled=false; ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,canvas.width,canvas.height); ctx.drawImage(buf,0,0,bw*isoZ,bh*isoZ);
  // rótulos (nomes, falas, barras): ficam presos ao personagem e sobem na vertical da tela
  const ents=list.filter(it=>it.k==='n'||it.k==='r'||it.k==='a'||it.k==='p').map(it=>it.e||player);
  const S=(wx,wy)=>{ let best=null; for(const e of ents){ const dy=e.y-wy; if(Math.abs(e.x-wx)<3&&dy>=-2&&dy<120){ if(!best||Math.abs(e.x-wx)<Math.abs(best.x-wx)) best=e; } }
    if(best){ const [X,Y]=W2S(best.x,best.y); return [(X+(wx-best.x)*SCL)*isoZ,(Y-(best.y-wy)*SCL)*isoZ]; }
    const [X,Y]=W2S(wx,wy); return [X*isoZ,Y*isoZ]; };
  if(typeof drawHiResLabels==='function') drawHiResLabels(ctx,S);
  if(search){ const [sx,sy]=S(player.x,player.y-26); const w=40*dpr, h=6*dpr; ctx.fillStyle='#000'; ctx.fillRect(sx-w/2-dpr,sy-h-dpr,w+2*dpr,h+2*dpr); ctx.fillStyle=search.fish?'#5a9ad0':'#d69a4c'; ctx.fillRect(sx-w/2,sy-h,w*(search.t/search.dur),h); }
}
// ---------- liga no jogo ----------
const _renderIso=render;
render=function(now){ if(isoOn()) return isoRenderFrame(now); return _renderIso(now); };
const _mwIso=mouseWorld;
mouseWorld=function(){ if(!isoOn()) return _mwIso(); const X=mouse.x*dpr/isoZ, Y=mouse.y*dpr/isoZ, a=(X-isoOX)/(TW/2), b=(Y-isoOY)/(TH/2); return {x:(a+b)/2*T, y:(b-a)/2*T}; };
// clique nos personagens pela figura na tela (não pelo chão atrás deles)
function screenHit(e,h){ const [X,Y]=W2S(e.x,e.y), mx=mouse.x*dpr/isoZ, my=mouse.y*dpr/isoZ; return mx>X-14&&mx<X+14&&my>Y-(h||44)&&my<Y+6 ? Math.hypot(mx-X,my-(Y-20)) : -1; }
if(typeof monsterAt==='function'){ const _ma=monsterAt; monsterAt=function(wx,wy){ if(!isoOn()) return _ma(wx,wy); let best=null,bd=1e9; for(const r of raiders){ const sc=((MONS[r.mon]||{}).scale||1), d=screenHit(r,44*sc); if(d>=0&&d<bd){ bd=d; best=r; } } return best; }; }
if(typeof npcAt==='function'){ const _na=npcAt; npcAt=function(wx,wy){ if(!isoOn()) return _na(wx,wy); for(const n of npcs){ if(n.dead||!n.active) continue; if(screenHit(n)>=0) return n; } for(const a of animals){ if(screenHit(a,30)>=0) return {animal:a}; } return null; }; }
// mudanças no mapa (construção, casas): refaz o chão e as peças daquele lugar
if(typeof dirtyChunks==='function'){ const _dc=dirtyChunks; dirtyChunks=function(x,y){ _dc(x,y);
  floorCache.delete(chunkKey(Math.floor(x/CK),Math.floor(y/CK))); for(let yy=y-2;yy<=y+2;yy++) for(let xx=x-2;xx<=x+2;xx++){ sCache.delete('w'+(yy*W+xx)); sCache.delete('r'+(yy*W+xx)); } }; }
// ---------- opção de câmera ----------
function syncCamUI(){ const s=document.getElementById('o-cam'); if(s) s.value=camMode; const b=document.getElementById('m-cam'); if(b) b.textContent=(camMode==='iso'?'Camera: Isometric':'Camera: Classic')+' (switch)'; }
const box=document.querySelector('#front-options .create-box');
if(box){ const d=document.createElement('label'); d.className='opt'; d.innerHTML='Camera <select id="o-cam"><option value="iso">Isometric (2.5D)</option><option value="classic">Classic (top-down)</option></select>';
  const ref=box.querySelectorAll('label')[1]||null; box.insertBefore(d,ref); document.getElementById('o-cam').onchange=e=>setCam(e.target.value); }
const mui=document.getElementById('m-ui'); if(mui){ const b=document.createElement('button'); b.className='mbtn'; b.id='m-cam'; mui.after(b); b.onclick=()=>setCam(camMode==='iso'?'classic':'iso'); }
syncCamUI();
})();

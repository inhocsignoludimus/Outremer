// Protótipo de render isométrico (estilo "Ultima VII") — só para gerar imagens de referência.
// Injetado na página do jogo depois do mundo pronto: isoRender(cx, cy, opts) -> canvas 1280x720
(function(){
const TW=48, TH=24, WH=46;
const hsh=(a,b,c)=>{ let h=(a*374761393+b*668265263+(c|0)*2147483647)|0; h=Math.imul(h^(h>>>13),1274126177); return ((h^(h>>>16))>>>0)/4294967295; };
function vnoise(x,y,s){ const xi=Math.floor(x), yi=Math.floor(y), fx=x-xi, fy=y-yi, u=fx*fx*(3-2*fx), v=fy*fy*(3-2*fy);
  const a=hsh(xi,yi,s), b=hsh(xi+1,yi,s), c=hsh(xi,yi+1,s), d=hsh(xi+1,yi+1,s); return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v; }
const hex=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
const mul=(c,k)=>[c[0]*k,c[1]*k,c[2]*k];
const INTERIOR=new Set([TL.WOOD,TL.CARPET,TL.KTILE,TL.LINO,TL.CONC]);
const isWall=t=>t===TL.WALL||t===TL.WINDOW||t===TL.ROCK;
const ROCKM={face:'#5e5650',line:'#3a3430',cap:'#4a4440',pat:'rock'};
// ---------- cor do chão, pixel a pixel ----------
function floorCol(t,U,V,i,biome){
  const n=hsh(Math.floor(U*64),Math.floor(V*64),7), lo=vnoise(U*.7,V*.7,3), mid=vnoise(U*3,V*3,5);
  const fu=U-Math.floor(U), fv=V-Math.floor(V);
  switch(t){
    case TL.GRASS: case TL.PARK: case TL.FOREST: case TL.FENCE: {
      let c=biome==='o'?mix([150,130,80],[120,110,60],lo):biome==='n'?mix([92,110,84],[120,130,110],lo):mix([62,96,38],[92,118,44],lo);
      if(t===TL.FOREST) c=mul(c,.82);
      c=mul(c,.82+n*.32+mid*.12); const tuft=hsh(Math.floor(U*10),Math.floor(V*10),31); if(tuft>.8){ const fy=(V*10)%1, fx=(U*10)%1; if(Math.abs(fx-.5)<.08&&fy>.3) c=mul(c,1.25); }
      if(n>.988) c=[220,200,110]; if(n<.008) c=[170,80,70]; return c; }
    case TL.FIELD: { const r=(U*4)%1; let c=r<.5?mix([110,84,50],[96,70,42],n):mix([150,140,60],[120,128,52],n); return mul(c,.9+mid*.2); }
    case TL.DIRT: case TL.ASPH: case TL.RUBBLE: { if(biome==='dg'){ let c=mix([70,62,56],[52,46,42],lo); c=mul(c,.8+n*.3); const S=2,ju=(U*S)%1,jv=(V*S)%1; if(Math.min(ju,jv)<.05&&mid>.45) c=[34,30,28]; if(hsh(Math.floor(U*12),Math.floor(V*12),19)>.95) c=[120,110,96]; return c; } if(t===TL.ASPH&&biome==='city') return floorCol(TL.WALK,U,V,i,biome); let c=mix([118,92,62],[96,74,50],lo); c=mul(c,.85+n*.28);
      if(hsh(Math.floor(U*14),Math.floor(V*14),9)>.93) c=mix(c,[150,140,128],.6); if(t===TL.RUBBLE&&mid>.6) c=[110,104,98]; return c; }
    case TL.WALK: { // calçamento de pedra
      const S=3, cu=Math.floor(U*S), cv=Math.floor(V*S), ju=(U*S)%1, jv=(V*S)%1, off=(cv%2)*.5, ju2=(U*S+off)%1;
      const cell=hsh(Math.floor(U*S+off),cv,11); const edge=Math.min(ju2,1-ju2,jv,1-jv);
      let c=mix([128,120,110],[100,96,92],cell); c=mul(c,.88+n*.22); if(edge<.07) c=[58,54,50]; else if(edge<.13) c=mul(c,.82); return c; }
    case TL.WOOD: case TL.PIER: case TL.BRIDGE: { const p=V*5, pi=Math.floor(p), pf=p-pi, seg=Math.floor(U*1.3+hsh(pi,0,4)*2);
      let c=mix([120,82,48],[96,62,34],hsh(pi,seg,13)); c=mul(c,.86+vnoise(U*30,V*3,2)*.25);
      if(pf<.1) c=[46,30,18]; if(((U*1.3+hsh(pi,0,4)*2)%1)<.03) c=mul(c,.6); return c; }
    case TL.CARPET: { const b=Math.min(fu,1-fu,fv,1-fv); let c=b<.12?[160,128,52]:mix([118,28,30],[92,20,24],n); if(b>.2&&((Math.floor(U*4)+Math.floor(V*4))%2)) c=mul(c,.9); return c; }
    case TL.KTILE: case TL.LINO: case TL.CONC: { const S=2, ju=(U*S)%1, jv=(V*S)%1, cell=hsh(Math.floor(U*S),Math.floor(V*S),17);
      let c=mix([150,140,122],[128,118,102],cell); c=mul(c,.9+n*.15); if(Math.min(ju,jv)<.04) c=[80,72,62]; return c; }
    case TL.WATER: case TL.SEA: { const deep=t===TL.SEA?.75:1; let c=mix([28,58,110],[40,84,140],lo); c=mul(c,deep*(.9+n*.12));
      const w=Math.sin(U*6+V*2+mid*6); if(w>.93) c=mix(c,[170,200,230],.6); return c; }
    case TL.SAND: case TL.DUNE: { let c=mix([206,180,128],[184,156,104],lo); c=mul(c,.92+n*.14); if(Math.sin((U+V)*7+lo*5)>.9) c=mul(c,.88); return c; }
    case TL.SNOW: { let c=mix([226,232,240],[200,210,222],lo); return mul(c,.95+n*.07); }
    case TL.ICE: { let c=mix([170,210,230],[140,186,214],lo); if(hsh(Math.floor(U*9),Math.floor(V*9),3)>.95) c=[230,245,255]; return c; }
    case TL.SWAMP: { let c=mix([62,74,44],[48,58,40],lo); c=mul(c,.85+n*.25); if(mid>.68) c=mix([40,52,42],[30,40,36],n); return c; }
    case TL.ROCK: { let c=mix([96,92,88],[74,70,68],mid); c=mul(c,.8+n*.3); return c; }
    case TL.CHASM: { const e=Math.min(fu,1-fu,fv,1-fv); return mul([18,10,8],.5+e); }
    default: { if(isWall(t)) return [70,66,60]; let c=[90,90,80]; return mul(c,.85+n*.3); }
  }
}
// ---------- paredes ----------
function wallPix(M,s,h,face,win,Hh){ // s:0..1 ao longo, h: altura em px
  const base=hex(M.face), line=hex(M.line); const n=hsh(Math.floor(s*64),Math.floor(h),21);
  let c=mul(base,.88+n*.2), row=Math.floor(h/7), m=false;
  if(M.pat==='planks'){ if(((s*64)|0)%9===0) m=true; c=mul(c,.9+vnoise(s*4,h*.4,3)*.2); }
  else if(M.pat==='rock'){ const v=vnoise(s*5,h*.12,7)+vnoise(s*14,h*.4,8)*.5; c=mul(base,.55+v*.5); if(Math.abs(vnoise(s*6,h*.18,9)-.5)<.03) c=line; }
  else if(M.pat==='timber'){ const sx=(s*64)|0; if(sx%21<3||h<4||(h|0)%22<3) { c=hex('#4a3420'); } }
  else { const bw=M.pat==='ashlar'?22:14, off=(row%2)*bw/2; if((h|0)%7===0||(((s*64+off)|0)%bw)===0) m=true;
    c=mul(c,.9+hsh(Math.floor((s*64+off)/bw),row,5)*.2); }
  if(m) c=line;
  if(win && s>.32&&s<.68 && h>Hh*.38 && h<Hh*.78){ const fr=s<.36||s>.64||h<Hh*.42||h>Hh*.74||Math.abs(s-.5)<.02; c=fr?[60,42,26]:mix([40,60,90],[90,120,160],(h-Hh*.38)/(Hh*.4)); }
  return mul(c,face);
}
function drawWall(img,W8,H8,sx,sy,M,Hh,win,showL,showR,low){
  const d=img.data, put=(x,y,c)=>{ if(x<0||y<0||x>=W8||y>=H8) return; const k=(y*W8+x)*4; d[k]=c[0]; d[k+1]=c[1]; d[k+2]=c[2]; d[k+3]=255; };
  const half=TW/2, q=TH/2;
  for(let c=0;c<half;c++){ // face esquerda (lado +V) e direita (lado +U)
    const by=sy+q+Math.floor(c*q/half);
    if(showL) for(let h=0;h<Hh;h++) put(sx-half+c, by-h, wallPix(M,c/half,h,.62,win,Hh));
    const by2=sy+TH-Math.floor(c*q/half);
    if(showR) for(let h=0;h<Hh;h++) put(sx+c, by2-h, wallPix(M,c/half,h,.9,win,Hh));
  }
  // topo
  const cap=low?mul(hex(M.face),.7):mul(hex(M.cap),1.6);
  for(let y=0;y<TH;y++){ const w=Math.floor((y<q?y:TH-1-y)*half/q); for(let x=-w;x<w;x++) put(sx+x, sy+y-Hh, M.pat==='rock'?mul(hex('#3c3632'),.75+vnoise((sx+x)*.15,(sy+y)*.3,4)*.5+hsh(x,y,sx)*.12):(x===-w||x===w-1)?mul(cap,.7):mul(cap,.9+hsh(x,y,sx)*.15)); }
}
// ---------- árvores detalhadas ----------
function drawTree(g,X,Y,seed,biome){
  const conifer=biome==='n'||biome==='m'||hsh(seed,1,1)<.35, autumn=hsh(seed,2,2);
  g.fillStyle='rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(X+6,Y,30,11,0,0,7); g.fill();
  const img=g.getImageData(X-60,Y-150,120,156), d=img.data, put=(x,y,c)=>{ if(x<0||y<0||x>=120||y>=156) return; const k=(y*120+x)*4; d[k]=c[0]; d[k+1]=c[1]; d[k+2]=c[2]; d[k+3]=255; };
  const ox=60, oy=150;
  for(let y=-34;y<=0;y++) for(let x=-5;x<=5;x++) put(ox+x,oy+y, mul([86,60,38],.7+(x+5)/14+hsh(x,y,seed)*.15));
  if(conifer){ const Hh=110+hsh(seed,3,3)*30;
    for(let y=0;y<Hh;y++){ const t=y/Hh, w=(1-t)*34*(.85+.15*Math.sin(y*.5)); for(let x=-w;x<=w;x++){ const n=hsh(x|0,y,seed);
      if(n<.12&&Math.abs(x)>w-3) continue; let c=mix([30,70,40],[52,104,58],(x+w)/(2*w+1)); c=mul(c,.75+n*.45-(y%9<2?.15:0)); put(ox+(x|0),oy-26-y,c); } } }
  else { const pal=autumn<.35?[[150,60,20],[220,120,40]]:autumn<.55?[[160,110,30],[230,180,70]]:[[50,92,34],[110,150,60]];
    const blobs=[]; for(let k=0;k<9;k++) blobs.push([(hsh(seed,k,4)-.5)*56,-60-hsh(seed,k,5)*60,18+hsh(seed,k,6)*14]);
    for(let y=-130;y<-24;y++) for(let x=-50;x<50;x++){ let inside=0, sh=0;
      for(const b of blobs){ const dd=((x-b[0])**2+(y-b[1])**2)/(b[2]*b[2]); if(dd<1){ inside=1; sh=Math.max(sh,1-dd+((b[0]-x)+(b[1]-y))/(b[2]*3)); } }
      if(!inside) continue; const n=hsh(x>>1,y>>1,seed); if(n<.05) continue;
      let c=mix(pal[0],pal[1],Math.min(1,Math.max(0,sh*.8+n*.35))); c=mul(c,.6+sh*.5); put(ox+x,oy+y,c); } }
  g.putImageData(img,X-60,Y-150);
}
const isPanel=t=>t===TL.WALL||t===TL.WINDOW;
function underFloor(x,y){ const c=[map[(y)*W+x-1],map[(y)*W+x+1],map[(y-1)*W+x],map[(y+1)*W+x]];
  for(const t of c) if(INTERIOR.has(t)) return t; for(const t of c) if(!isWall(t)&&t!==TL.WATER&&t!==TL.SEA) return t; return TL.DIRT; }
// parede fina (estilo UO): painel ao longo do eixo U ou V, saindo do centro do ladrilho
function drawPanel(im,Wc,Hc,toS,U0,V0,alongU,len,Hh,M,win,low){
  const d=im.data, put=(x,y,c)=>{ x|=0; y|=0; if(x<0||y<0||x>=Wc||y>=Hc) return; const k=(y*Wc+x)*4; d[k]=c[0]; d[k+1]=c[1]; d[k+2]=c[2]; d[k+3]=255; };
  const TK=.14, cols=Math.max(1,Math.round(len*TW/2));
  const face=alongU?.66:.92;
  for(const layer of [0,1]){ // 0: face de trás (espessura), 1: face da frente
    const off=layer?TK/2:-TK/2;
    for(let c=0;c<=cols;c++){ const t=c/cols, U=U0+(alongU?t*len:0)+(alongU?0:off), V=V0+(alongU?0:t*len)+(alongU?off:0);
      const [sx,sy]=toS(U,V);
      for(let h=0;h<Hh;h++){ let col=wallPix(M,(t*len+(alongU?U0:V0))%1,h,layer?face:face*.6,win&&layer,Hh); put(sx,sy-h,col); } } }
  // tampo
  const cap=low?mul(hex(M.face),.75):mul(hex(M.face),.55);
  for(let c=0;c<=cols;c++){ const t=c/cols; for(let k=-2;k<=2;k++){ const f=k/2*TK/2;
    const U=U0+(alongU?t*len:f), V=V0+(alongU?f:t*len); const [sx,sy]=toS(U,V); put(sx,sy-Hh,mul(cap,.9+hsh(c,k,3)*.2)); } }
}
window.isoRender=function(cxT,cyT,opts={}){
  const Wc=1280, Hc=720, cv=document.createElement('canvas'); cv.width=Wc; cv.height=Hc; const g=cv.getContext('2d'); g.imageSmoothingEnabled=false;
  const ox=Wc/2-(cxT-cyT)*TW/2, oy=Hc/2-(cxT+cyT)*TH/2+(opts.dy||60);
  const toS=(U,V)=>[ox+(U-V)*TW/2, oy+(U+V)*TH/2];
  const biomeAt=(x,y)=>{ const r=regions&&regionId?regions[regionId[y*W+x]]:null; if(typeof DG!=='undefined'&&(inRect(DG.L1,x,y)||inRect(DG.L2,x,y))) return 'dg'; if(r&&(r.kind==='city'||r.kind==='town')&&!opts.biome) return 'city'; return opts.biome||(r&&r.biome)||'p'; };
  // chão
  const img=g.createImageData(Wc,Hc), d=img.data;
  for(let Y=0;Y<Hc;Y++) for(let X=0;X<Wc;X++){ const a=(X-ox)/(TW/2), b=(Y-oy)/(TH/2), U=(a+b)/2, V=(b-a)/2, x=Math.floor(U), y=Math.floor(V);
    let c=[0,0,0]; if(x>=0&&y>=0&&x<W&&y<H){ const i=y*W+x; let t=map[i]; if(t===TL.WALL||t===TL.WINDOW) t=underFloor(x,y); c=floorCol(t,U,V,i,biomeAt(x,y)); }
    const k=(Y*Wc+X)*4; d[k]=c[0]; d[k+1]=c[1]; d[k+2]=c[2]; d[k+3]=255; }
  // lista de coisas em pé
  const span=26, list=[];
  for(let y=Math.max(0,cyT-span);y<Math.min(H,cyT+span);y++) for(let x=Math.max(0,cxT-span);x<Math.min(W,cxT+span);x++){
    const i=y*W+x, t=map[i];
    if(isWall(t)) list.push({k:'w',x,y,dep:x+y+1});
    if(t===TL.FENCE) list.push({k:'f',x,y,dep:x+y+1});
  }
  const seen=new Set();
  for(let y=Math.max(0,cyT-span);y<Math.min(H,cyT+span);y++) for(let x=Math.max(0,cxT-span);x<Math.min(W,cxT+span);x++){ const o=objGrid[y*W+x]; if(o&&!seen.has(o)){ seen.add(o); list.push({k:'o',o,dep:o.x+(o.w||1)+o.y+(o.h||1)-1}); } }
  const near=(e)=>Math.abs(e.x/T-cxT)<span&&Math.abs(e.y/T-cyT)<span;
  for(const n of npcs) if(!n.dead&&near(n)) list.push({k:'n',e:n,dep:n.x/T+n.y/T});
  for(const r of raiders) if(near(r)) list.push({k:'r',e:r,dep:r.x/T+r.y/T});
  for(const a of animals) if(near(a)) list.push({k:'a',e:a,dep:a.x/T+a.y/T});
  if(player&&near(player)) list.push({k:'p',e:player,dep:player.x/T+player.y/T});
  // paredes primeiro na imagem de pixels (ordem de profundidade), depois o resto por cima com canvas
  list.sort((a,b)=>a.dep-b.dep);
  g.putImageData(img,0,0);
  const SC=2.0;
  const sprite=(fn)=>{ g.save(); g.imageSmoothingEnabled=false; fn(); g.restore(); };
  let pend=null; const flush=()=>{ if(pend){ g.putImageData(pend,0,0); pend=null; } };
  for(const it of list){
    if(it.k==='w'){ const i=it.y*W+it.x, t0=map[i];
      const back1=map[i-1], back2=map[i-W], nl=map[i+W], nr=map[i+1];
      if(t0===TL.ROCK){ const M=ROCKM; const [sx,sy]=toS(it.x,it.y); if(sx<-80||sx>Wc+80||sy<-120||sy>Hc+80) continue;
        const im=g.getImageData(0,0,Wc,Hc); drawWall(im,Wc,Hc,Math.round(sx),Math.round(sy),M,WH,false,!isWall(nl),!isWall(nr),false); g.putImageData(im,0,0); continue; }
      const M=MATS[mat[i]]||MATS[6];
      const [cx0,cy0]=toS(it.x+.5,it.y+.5); if(cx0<-80||cx0>Wc+80||cy0<-120||cy0>Hc+120) continue;
      const low = opts.cut!==false && (INTERIOR.has(back1)||INTERIOR.has(back2)) && !INTERIOR.has(nl)&&!INTERIOR.has(nr);
      const Hh=low?8:WH, win=t0===TL.WINDOW&&!low;
      const cU1=isPanel(map[i+1]), cU0=isPanel(map[i-1]), cV1=isPanel(map[i+W]), cV0=isPanel(map[i-W]);
      const im=g.getImageData(0,0,Wc,Hc), X=it.x+.5, Y=it.y+.5;
      // ordem: metade de trás primeiro (-U,-V), depois a da frente (+U,+V)
      if(cV0) drawPanel(im,Wc,Hc,toS,X,Y-.5,false,.5,Hh,M,win,low);
      if(cU0) drawPanel(im,Wc,Hc,toS,X-.5,Y,true,.5,Hh,M,win,low);
      if(cU1) drawPanel(im,Wc,Hc,toS,X,Y,true,.5,Hh,M,win,low);
      if(cV1) drawPanel(im,Wc,Hc,toS,X,Y,false,.5,Hh,M,win,low);
      if(!(cU0||cU1||cV0||cV1)){ drawPanel(im,Wc,Hc,toS,X-.1,Y,true,.2,Hh,M,false,low); }
      g.putImageData(im,0,0); }
    else if(it.k==='f'){ const [sx,sy]=toS(it.x+.5,it.y+.5); g.fillStyle='#5a3a20'; for(const dx of [-14,0,14]) g.fillRect(sx+dx-2,sy-26+Math.abs(dx)*0,4,26); g.fillRect(sx-18,sy-22,36,4); g.fillRect(sx-18,sy-12,36,4); }
    else if(it.k==='o'){ const o=it.o, w=o.w||1, h=o.h||1;
      if(o.type==='tree'){ const [sx,sy]=toS(o.x+.5,o.y+.5); drawTree(g,Math.round(sx),Math.round(sy),o.x*7+o.y*13,biomeAt(o.x,o.y)); continue; }
      const [sx,sy]=toS(o.x+w/2,o.y+h); sprite(()=>{ g.translate(Math.round(sx-w*8*SC),Math.round(sy-h*16*SC)); g.scale(SC,SC); try{ drawObj(g,o,0,0,performance.now()); }catch(e){} }); }
    else { const e=it.e, [sx,sy]=toS(e.x/T,e.y/T);
      g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(sx,sy,16,6,0,0,7); g.fill();
      sprite(()=>{ g.translate(Math.round(sx),Math.round(sy)); g.scale(SC,SC); try{
        if(it.k==='n') drawNPC(g,e,0,0); else if(it.k==='r') drawRaider(g,e,0,0); else if(it.k==='a') drawAnimal(g,e,0,0); else drawPlayer(g,0,0); }catch(err){} }); }
  }
  // luz
  if(opts.dark){ const L=document.createElement('canvas'); L.width=Wc; L.height=Hc; const l=L.getContext('2d');
    l.fillStyle=`rgba(4,2,6,${opts.dark})`; l.fillRect(0,0,Wc,Hc); l.globalCompositeOperation='destination-out';
    for(const [U,V,r] of (opts.lights||[])){ const [x,y]=toS(U,V); const gr=l.createRadialGradient(x,y-20,0,x,y-20,r); gr.addColorStop(0,'rgba(0,0,0,1)'); gr.addColorStop(1,'rgba(0,0,0,0)'); l.fillStyle=gr; l.fillRect(x-r,y-20-r,2*r,2*r); }
    g.drawImage(L,0,0);
    g.globalCompositeOperation='lighter';
    for(const [U,V,r] of (opts.lights||[])){ const [x,y]=toS(U,V); const gr=g.createRadialGradient(x,y-20,0,x,y-20,r*.6); gr.addColorStop(0,'rgba(255,140,50,.22)'); gr.addColorStop(1,'rgba(255,140,50,0)'); g.fillStyle=gr; g.fillRect(x-r,y-20-r,2*r,2*r); }
    g.globalCompositeOperation='source-over'; }
  return cv;
};
})();

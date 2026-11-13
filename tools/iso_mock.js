// Protótipo de render isométrico (estilo "Ultima VII") — só para gerar imagens de referência.
// Injetado na página do jogo depois do mundo pronto: isoRender(cx, cy, opts) -> canvas 1280x720
(function(){
const TW=48, TH=24, WH=62;
const hsh=(a,b,c)=>{ let h=(a*374761393+b*668265263+(c|0)*2147483647)|0; h=Math.imul(h^(h>>>13),1274126177); return ((h^(h>>>16))>>>0)/4294967295; };
function vnoise(x,y,s){ const xi=Math.floor(x), yi=Math.floor(y), fx=x-xi, fy=y-yi, u=fx*fx*(3-2*fx), v=fy*fy*(3-2*fy);
  const a=hsh(xi,yi,s), b=hsh(xi+1,yi,s), c=hsh(xi,yi+1,s), d=hsh(xi+1,yi+1,s); return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v; }
const fbm=(x,y,s)=>(vnoise(x,y,s)*.5+vnoise(x*2.03,y*2.03,s+1)*.25+vnoise(x*4.1,y*4.1,s+2)*.15+vnoise(x*8.3,y*8.3,s+3)*.1);
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
      const f=fbm(U*.9,V*.9,3), f2=fbm(U*4,V*4,8), bl=vnoise(U*46+V*9,V*46-U*9,12), bl2=hsh(Math.floor(U*96),Math.floor(V*96),2);
      let a=biome==='o'?[128,114,74]:biome==='n'?[96,104,88]:biome==='s'?[70,76,48]:[70,82,44], b=biome==='o'?[164,146,98]:biome==='n'?[136,142,124]:biome==='s'?[96,98,62]:[104,112,62];
      let c=mix(a,b,f); c=mix(c,[96,84,58],Math.max(0,f2-.62)*1.6); // manchas de terra
      if(t===TL.FOREST) c=mul(mix(c,[60,58,40],.25),.78);
      c=mul(c,.78+bl*.32+bl2*.1); if(bl2>.992) c=[196,188,140]; if(bl2<.004) c=[120,72,60];
      return c; }
    case TL.FIELD: { const r=(U*4)%1; let c=r<.5?mix([110,84,50],[96,70,42],n):mix([150,140,60],[120,128,52],n); return mul(c,.9+mid*.2); }
    case TL.DIRT: case TL.ASPH: case TL.RUBBLE: { if(biome==='dg'){ let c=mix([70,62,56],[52,46,42],lo); c=mul(c,.8+n*.3); const S=2,ju=(U*S)%1,jv=(V*S)%1; if(Math.min(ju,jv)<.05&&mid>.45) c=[34,30,28]; if(hsh(Math.floor(U*12),Math.floor(V*12),19)>.95) c=[120,110,96]; return c; } if(t===TL.ASPH&&biome==='city') return floorCol(TL.WALK,U,V,i,biome); let c=mix([112,94,70],[88,74,56],fbm(U*1.2,V*1.2,4)); c=mul(c,.8+n*.22+vnoise(U*20,V*20,6)*.16);
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
    case TL.WATER: case TL.SEA: { const deep=t===TL.SEA?.75:1; let c=mix([22,44,62],[38,70,88],fbm(U*.6,V*.6,2)); c=mul(c,deep*(.92+n*.08));
      const w=Math.sin(U*5+V*1.4+fbm(U*2,V*2,9)*7); if(w>.96) c=mix(c,[150,176,186],.45); else if(w>.9) c=mix(c,[90,120,132],.3); return c; }
    case TL.SAND: case TL.DUNE: { let c=mix([196,172,126],[168,142,100],fbm(U*.8,V*.8,5)); c=mul(c,.9+n*.12); if(Math.sin((U+V)*7+lo*5)>.9) c=mul(c,.88); return c; }
    case TL.SNOW: { let c=mix([228,232,236],[188,196,206],fbm(U*.8,V*.8,7)); return mul(c,.94+n*.06); }
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
  c=mul(c,(.78+Math.min(1,h/18)*.22)*(.88+vnoise(s*9,h*.06,77)*.22));
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
  const conifer=biome==='n'||biome==='m'||hsh(seed,1,1)<.3, au=hsh(seed,2,2), snow=biome==='n';
  const BW=150, BH=190, ox=75, oy=184;
  const img=g.getImageData(X-ox,Y-oy,BW,BH), d=img.data, put=(x,y,c)=>{ x|=0; y|=0; if(x<0||y<0||x>=BW||y>=BH) return; const k=(y*BW+x)*4; d[k]=c[0]; d[k+1]=c[1]; d[k+2]=c[2]; d[k+3]=255; };
  const L=[-.6,-.55,.58];
  // tronco com casca
  const th=conifer?30:44, tw=conifer?4:6;
  for(let y=-th;y<=0;y++){ const w=tw+(y>-6?(6+y)*.5:0); for(let x=-w;x<=w;x++){ const sh=.45+.55*(1-(x+w)/(2*w+.01)); const bark=vnoise(x*.6,y*.15,seed)*.35;
    put(ox+x,oy+y,mul([92,72,52],sh*(.75+bark))); } }
  if(conifer){ const Hh=118+hsh(seed,3,3)*40, R=34+hsh(seed,4,4)*10;
    for(let y=0;y<Hh;y++){ const t=y/Hh, tier=(y*0.11+hsh(seed,5,5)*3)%1, w=(1-t)*R*(.72+.28*tier);
      for(let x=-w;x<=w;x++){ const xf=x/(w+.01), n=hsh(x|0,y,seed), nn=vnoise(x*.35,y*.35,seed);
        if(Math.abs(xf)>.82&&n<.45) continue; if(nn<.18&&Math.abs(xf)>.5) continue;
        const lit=Math.max(0,-xf*L[0]*0.9+(1-tier)*.5)*.6+.3;
        let c=mix([22,36,26],[66,88,58],Math.min(1,lit*(.7+nn*.6))); if(tier<.18) c=mul(c,.62);
        if(snow&&tier>.78&&n>.3) c=mix(c,[226,232,238],.85);
        put(ox+x,oy-24-y,c); } } }
  else { const pal=au<.3?[[86,44,20],[196,118,52]]:au<.48?[[96,74,28],[204,168,78]]:[[30,46,22],[112,132,60]];
    const cx=(hsh(seed,7,7)-.5)*8, cy=-th-38-hsh(seed,8,8)*14, RX=40+hsh(seed,9,9)*14, RY=36+hsh(seed,10,10)*12, cl=[];
    for(let k=0;k<46;k++){ const a=hsh(seed,k,11)*6.283, r=Math.sqrt(hsh(seed,k,12)); cl.push([cx+Math.cos(a)*r*RX*.85, cy+Math.sin(a)*r*RY*.8, 7+hsh(seed,k,13)*8]); }
    cl.sort((p,q)=>p[1]-q[1]);
    const zb=new Float32Array(BW*BH).fill(-1e9);
    for(const [bx,by,br] of cl){ for(let y=-br;y<=br;y++) for(let x=-br;x<=br;x++){ const dd=(x*x+y*y)/(br*br); if(dd>1) continue;
      const px=Math.round(bx+x), py=Math.round(by+y), z=by+Math.sqrt(1-dd)*br; const k=(oy+py)*BW+(ox+px); if(k<0||k>=zb.length||z<zb[k]) continue;
      const nz=Math.sqrt(1-dd), nx=x/br, ny=y/br; const leaf=hsh(px>>1,py>>1,seed), lf=vnoise(px*.45,py*.45,seed+3);
      if(dd>.6&&lf<.35) continue; zb[k]=z;
      // luz: normal do cacho + posição na copa (borda de baixo e de trás mais escura)
      let lit=Math.max(0,nx*L[0]+ny*L[1]+nz*L[2]); const occ=Math.min(1,Math.max(0,.55+(-(by-cy)/RY)*.35-(Math.hypot(bx-cx,by-cy)/RX<.4?.2:0)));
      lit=lit*.7+occ*.45; let c=mix(pal[0],pal[1],Math.min(1,Math.max(0,lit*(.75+lf*.5))));
      c=mul(c,.82+leaf*.3); if(leaf>.97) c=mix(c,[200,190,120],.4);
      put(ox+px,oy+py,c); } } }
  g.putImageData(img,X-ox,Y-oy);
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
window.isoCharFor=function(k,e){ if(!window.ISOCHAR) return null; const C=ISOCHAR, h=((e.id||0)*7+Math.floor(e.x/7)*3+Math.floor(e.y/11))>>>0;
  if(k==='p') return C.knight;
  if(k==='r'){ const kd=String(e.mon||e.kind||e.type||''); return /skel/.test(kd)?C.skeleton:null; }
  if(k==='n'){ const r=e.role||'', v=e.vendor||'', nm=String(e.name||'');
    if(r==='guard') return C.guard; if(r==='lord') return C.lord; if(v==='mago'||/mage|mago/i.test(nm)) return C.mage; if(r==='priest') return C.mage;
    if(e.sim||e.isSim||e.player) return [C.knight,C.guard,C.mage,C.peasant0,C.woman1][h%5];
    const f=(e.look&&(e.look.sex==='f'||e.look.female))||e.sex==='f'||/a$/.test(nm.split(' ')[0]); return f?C['woman'+(h%3)]:C['peasant'+(h%3)]; }
  return null; };
window.isoRender=function(cxT,cyT,opts={}){
  const Wc=1280, Hc=720, cv=document.createElement('canvas'); cv.width=Wc; cv.height=Hc; const g=cv.getContext('2d'); g.imageSmoothingEnabled=false;
  const ox=Wc/2-(cxT-cyT)*TW/2, oy=Hc/2-(cxT+cyT)*TH/2+(opts.dy||60);
  const toS=(U,V)=>[ox+(U-V)*TW/2, oy+(U+V)*TH/2];
  const biomeAt=(x,y)=>{ const r=regions&&regionId?regions[regionId[y*W+x]]:null; if(typeof DG!=='undefined'&&(inRect(DG.L1,x,y)||inRect(DG.L2,x,y))) return 'dg'; if(r&&(r.kind==='city'||r.kind==='town')&&!opts.biome) return 'city'; return opts.biome||(r&&r.biome)||'p'; };
  // chão
  const img=g.createImageData(Wc,Hc), d=img.data;
  for(let Y=0;Y<Hc;Y++) for(let X=0;X<Wc;X++){ const a=(X-ox)/(TW/2), b=(Y-oy)/(TH/2), U=(a+b)/2, V=(b-a)/2, x=Math.floor(U), y=Math.floor(V);
    let c=[0,0,0]; if(x>=0&&y>=0&&x<W&&y<H){ let i=y*W+x; let t=map[i];
      if(!INTERIOR.has(t)&&!isWall(t)&&t!==TL.WALK){ const ju=U+(vnoise(U*2.3,V*2.3,41)-.5)*.7, jv=V+(vnoise(U*2.3,V*2.3,43)-.5)*.7, xx=Math.floor(ju), yy=Math.floor(jv);
        if(xx>=0&&yy>=0&&xx<W&&yy<H){ const t2=map[yy*W+xx]; if(!INTERIOR.has(t2)&&!isWall(t2)&&t2!==TL.WALK&&t2!==TL.BRIDGE&&t2!==TL.PIER){ t=t2; i=yy*W+xx; } } } if(t===TL.WALL||t===TL.WINDOW) t=underFloor(x,y); c=floorCol(t,U,V,i,biomeAt(x,y)); }
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
  // sombras projetadas (sol alto à esquerda): desenhadas no chão antes de tudo, suavizadas
  { const SH=document.createElement('canvas'); SH.width=Wc; SH.height=Hc; const s2=SH.getContext('2d'); s2.fillStyle='#000';
    const sh=(sx,sy,rx,ry)=>{ s2.beginPath(); s2.ellipse(sx,sy,rx,ry,0,0,7); s2.fill(); };
    const quad=(U0,V0,U1,V1,Hh)=>{ const a=toS(U0,V0), b=toS(U1,V1), dx=Hh*.62, dy=Hh*.2; s2.beginPath(); s2.moveTo(a[0],a[1]); s2.lineTo(b[0],b[1]); s2.lineTo(b[0]+dx,b[1]+dy); s2.lineTo(a[0]+dx,a[1]+dy); s2.closePath(); s2.fill(); };
    for(const it of list){
      if(it.k==='w'){ const i=it.y*W+it.x; if(map[i]===TL.ROCK){ const [x,y]=toS(it.x+.5,it.y+.5); sh(x+26,y+8,40,16); continue; }
        const X=it.x+.5, Y=it.y+.5; if(isPanel(map[i+1])) quad(X,Y,X+.5,Y,WH); if(isPanel(map[i-1])) quad(X-.5,Y,X,Y,WH); if(isPanel(map[i+W])) quad(X,Y,X,Y+.5,WH); if(isPanel(map[i-W])) quad(X,Y-.5,X,Y,WH); }
      else if(it.k==='o'){ const o=it.o, [x,y]=toS(o.x+(o.w||1)/2,o.y+(o.h||1)/2);
        if(o.type==='tree'||o.type==='olive') sh(x+34,y+8,40,15); else if(o.type==='pine') sh(x+30,y+8,30,11); else if(o.type==='rug') continue; else sh(x+8,y+3,14*(o.w||1),6*(o.h||1)); }
    }
    g.save(); g.globalAlpha=.38; g.filter='blur(3px)'; g.drawImage(SH,0,0); g.restore(); }
  const SC=2.0;
  const sprite=(fn)=>{ g.save(); g.imageSmoothingEnabled=false; fn(); g.restore(); };
  let pend=null; const flush=()=>{ if(pend){ g.putImageData(pend,0,0); pend=null; } };
  for(const it of list){
    if(it.k==='w'){ const i=it.y*W+it.x, t0=map[i];
      const back1=map[i-1], back2=map[i-W], nl=map[i+W], nr=map[i+1];
      if(t0===TL.ROCK){ const [sx,sy]=toS(it.x,it.y); if(sx<-80||sx>Wc+80||sy<-140||sy>Hc+80) continue; isoRock(g,toS,it.x,it.y,biomeAt(it.x,it.y),true); continue; }
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
      const [tx,ty]=toS(o.x+.5,o.y+.5); if(tx<-120||tx>Wc+120||ty<-60||ty>Hc+200) continue;
      if(o.type==='tree'||o.type==='pine'||o.type==='olive'){ drawTree(g,Math.round(tx),Math.round(ty),o.x*7+o.y*13,o.type==='pine'?'n':biomeAt(o.x,o.y)); continue; }
      const r=isoProp(g,toS,o,biomeAt(o.x,o.y)); if(r===true) continue; const lift=r==='sprite10'?10:0;
      const [sx,sy]=toS(o.x+w/2,o.y+h); sprite(()=>{ g.translate(Math.round(sx-w*8*SC),Math.round(sy-h*16*SC-lift)); g.scale(SC,SC); try{ drawObj(g,o,0,0,performance.now()); }catch(e){} }); }
    else { const e=it.e, [sx,sy]=toS(e.x/T,e.y/T);
      g.fillStyle='rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(sx+5,sy+1,13,5,0,0,7); g.fill();
      const ch=window.isoCharFor&&isoCharFor(it.k,e);
      if(ch){ const A=ISOCHAR_ANCHOR; g.drawImage(ch,Math.round(sx-A[0]),Math.round(sy-A[1])); continue; }
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
  // tratamento de cor: menos saturação, contraste suave, tom quente e vinheta
  if(opts.grade!==false){ const im=g.getImageData(0,0,Wc,Hc), q=im.data;
    for(let y=0;y<Hc;y++) for(let x=0;x<Wc;x++){ const k=(y*Wc+x)*4; let r=q[k],gg=q[k+1],b=q[k+2]; const l=r*.3+gg*.59+b*.11;
      r=l+(r-l)*.8; gg=l+(gg-l)*.8; b=l+(b-l)*.8;
      r=(r-128)*1.06+128+5; gg=(gg-128)*1.06+128+1; b=(b-128)*1.06+128-6;
      const vx=(x/Wc-.5), vy=(y/Hc-.5), v=1-Math.min(.32,(vx*vx+vy*vy)*.9);
      q[k]=r*v; q[k+1]=gg*v; q[k+2]=b*v; }
    g.putImageData(im,0,0); }
  return cv;
};
})();

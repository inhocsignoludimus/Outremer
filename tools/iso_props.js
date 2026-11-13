// Objetos 3D isométricos (móveis, natureza, rochas) para o protótipo iso — carregado depois de iso_mock.js
(function(){
const TW=48, TH=24;
const hsh=(a,b,c)=>{ let h=(a*374761393+b*668265263+(c|0)*2147483647)|0; h=Math.imul(h^(h>>>13),1274126177); return ((h^(h>>>16))>>>0)/4294967295; };
function vn(x,y,s){ const xi=Math.floor(x), yi=Math.floor(y), fx=x-xi, fy=y-yi, u=fx*fx*(3-2*fx), v=fy*fy*(3-2*fy);
  const a=hsh(xi,yi,s), b=hsh(xi+1,yi,s), c=hsh(xi,yi+1,s), d=hsh(xi+1,yi+1,s); return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v; }
const hex=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
const css=(c,k=1)=>`rgb(${Math.max(0,Math.min(255,c[0]*k))|0},${Math.max(0,Math.min(255,c[1]*k))|0},${Math.max(0,Math.min(255,c[2]*k))|0})`;
const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
let G, P; // contexto e projeção (U,V,z px) -> tela
function poly(pts,fill,stroke){ G.beginPath(); pts.forEach((p,i)=>i?G.lineTo(p[0],p[1]):G.moveTo(p[0],p[1])); G.closePath(); G.fillStyle=fill; G.fill(); if(stroke){ G.strokeStyle=stroke; G.lineWidth=1; G.stroke(); } }
// caixa: base U..U+du, V..V+dv, de z até z+h
function box(U,V,du,dv,z,h,col,o={}){ const c=typeof col==='string'?hex(col):col, z1=z+h;
  const A=P(U+du,V,z), B=P(U+du,V+dv,z), C=P(U,V+dv,z), A1=P(U+du,V,z1), B1=P(U+du,V+dv,z1), C1=P(U,V+dv,z1), D1=P(U,V,z1);
  const ol=o.ol===false?null:css(c,.35);
  poly([C,B,B1,C1],css(c,o.left||.62),ol);   // face +V (esquerda)
  poly([B,A,A1,B1],css(c,o.right||.84),ol);  // face +U (direita)
  poly([D1,A1,B1,C1],css(o.top?hex(o.top):c,1.0),ol); // topo
  if(o.planks){ G.strokeStyle=css(c,.5); G.lineWidth=1; for(let k=1;k<o.planks;k++){ const t=k/o.planks;
      let p=P(U,V+dv,z+h*t), q=P(U+du,V+dv,z+h*t); G.beginPath(); G.moveTo(p[0],p[1]); G.lineTo(q[0],q[1]); G.stroke();
      p=P(U+du,V+dv,z+h*t); q=P(U+du,V,z+h*t); G.beginPath(); G.moveTo(p[0],p[1]); G.lineTo(q[0],q[1]); G.stroke(); } }
  return {A,B,C,A1,B1,C1,D1}; }
// cilindro vertical
function cyl(U,V,r,z,h,col,top){ const c=typeof col==='string'?hex(col):col, [x,y]=P(U,V,z), rx=r*TW*.707, ry=r*TH*.707;
  const gr=G.createLinearGradient(x-rx,0,x+rx,0); gr.addColorStop(0,css(c,.55)); gr.addColorStop(.65,css(c,1)); gr.addColorStop(1,css(c,.75));
  G.fillStyle=gr; G.beginPath(); G.ellipse(x,y,rx,ry,0,0,Math.PI); G.lineTo(x-rx,y-h); G.ellipse(x,y-h,rx,ry,0,Math.PI,0,true); G.closePath(); G.fill();
  G.strokeStyle=css(c,.35); G.stroke();
  G.fillStyle=css(top?hex(top):c,1.08); G.beginPath(); G.ellipse(x,y-h,rx,ry,0,0,7); G.fill(); G.stroke(); return [x,y,rx,ry]; }
function flame(x,y,s=1){ const gr=G.createRadialGradient(x,y,0,x,y,22*s); gr.addColorStop(0,'rgba(255,190,90,.45)'); gr.addColorStop(1,'rgba(255,150,50,0)'); G.fillStyle=gr; G.fillRect(x-22*s,y-22*s,44*s,44*s);
  G.fillStyle='#ff9a2a'; G.beginPath(); G.ellipse(x,y,2.5*s,5*s,0,0,7); G.fill(); G.fillStyle='#ffe9a0'; G.beginPath(); G.ellipse(x,y+1,1.2*s,2.5*s,0,0,7); G.fill(); }
// ---------- massa orgânica (rocha, arbusto, sebe, feno): elipsoide com ruído, pixel a pixel ----------
function blob(U,V,r,h,pal,seed,o={}){ const [cx,cy]=P(U,V,o.z||0), rx=Math.ceil(r*TW*.72), ry=r*TH*.72;
  const x0=cx-rx-2, y0=Math.floor(cy-h-ry-4), w=rx*2+4, hh=Math.ceil(h+ry*2+8);
  const img=G.getImageData(x0,y0,w,hh), d=img.data, zb=new Float32Array(w*hh).fill(-1e9);
  const L=[-.55,-.45,.7], fr=o.freq||3, rough=o.rough==null?.45:o.rough;
  for(let px=0;px<w;px++){ const a=(px+x0-cx)/rx; if(Math.abs(a)>=1) continue; const s=Math.sqrt(1-a*a);
    const steps=Math.ceil(ry*2+h*1.2);
    for(let k=0;k<=steps;k++){ const b=-s+2*s*k/steps; let c=Math.sqrt(Math.max(0,1-a*a-b*b));
      const nz=vn(a*fr+seed,b*fr,seed)*.7+vn(a*fr*2.7,b*fr*2.7+seed,seed+1)*.3; c*= (1-rough)+rough*1.5*nz; if(o.flat) c=Math.min(c,o.flat);
      const sy=Math.round(cy+b*ry-c*h)-y0, sx=px; if(sy<0||sy>=hh) continue;
      // normal aproximada
      const e=.04, c2=Math.sqrt(Math.max(0,1-(a+e)**2-b*b))*((1-rough)+rough*1.5*(vn((a+e)*fr+seed,b*fr,seed)*.7+vn((a+e)*fr*2.7,b*fr*2.7+seed,seed+1)*.3));
      const c3=Math.sqrt(Math.max(0,1-a*a-(b+e)**2))*((1-rough)+rough*1.5*(vn(a*fr+seed,(b+e)*fr,seed)*.7+vn(a*fr*2.7,(b+e)*fr*2.7+seed,seed+1)*.3));
      let nx=-(c2-c)/e*h/rx*3, ny=-(c3-c)/e*h/rx*3, nzz=1; const nl=Math.hypot(nx,ny,nzz); nx/=nl; ny/=nl; nzz/=nl;
      let lit=Math.max(0,nx*L[0]+ny*L[1]+nzz*L[2]); lit=.35+lit*.85;
      const depth=b; const zi=sy*w+sx; if(depth<zb[zi]) continue; zb[zi]=depth;
      const tt=Math.min(1,Math.max(0,(lit-.35)/.85)); let col=tt<.5?mix(pal[0].map(v=>v*.55),pal[0],tt*2):mix(pal[0],pal[1],(tt-.5)*2);
      const n=hsh(px,sy+y0,seed); col=col.map(v=>v*(.9+n*.2));
      if(o.snow&&nzz>.75&&c>.35) col=mix(col,[236,240,248],.85);
      if(o.dots&&n>.965) col=o.dots;
      if(o.strata&&((c*h+seed)%7)<1) col=col.map(v=>v*.75);
      // preenche até o próximo pixel abaixo para não deixar buracos
      for(let yy=sy;yy<Math.min(hh,sy+2);yy++){ const kk=(yy*w+sx)*4; d[kk]=col[0]; d[kk+1]=col[1]; d[kk+2]=col[2]; d[kk+3]=255; }
    } }
  G.putImageData(img,x0,y0); }
const ROCKPAL={ p:[[110,100,88],[176,166,150]], m:[[112,102,90],[182,172,158]], n:[[100,104,112],[190,196,206]], o:[[168,124,80],[236,200,150]], s:[[80,84,70],[140,140,120]], dg:[[52,46,42],[118,106,96]], c:[[118,110,98],[188,180,166]], f:[[96,96,84],[160,158,140]], r:[[104,90,82],[170,154,140]], city:[[110,104,96],[170,164,154]] };
window.isoRock=function(g,toS,x,y,biome,big){ G=g; P=(U,V,z)=>{ const [a,b]=toS(U,V); return [a,b-(z||0)]; };
  const pal=ROCKPAL[biome]||ROCKPAL.p, s=x*31+y*17;
  const H0=big?(34+vn(x*.25,y*.25,5)*50+hsh(x,y,1)*12):(10+hsh(x,y,1)*10);
  if(big){ blob(x+.5+(hsh(x,y,2)-.5)*.3,y+.5+(hsh(x,y,3)-.5)*.3,1.0,H0,pal,s,{rough:.32,freq:1.6,snow:biome==='n'||(biome==='m'&&H0>70),strata:biome==='o'}); }
  else blob(x+.5,y+.6,.42,H0,pal,s,{rough:.45});
};
// ---------- móveis e natureza ----------
const WOOD='#7a5230', DWOOD='#5a3a20', STONE='#8a847a';
const DEF={
  table(o){ const {x,y}=o; for(const [a,b] of [[.14,.14],[.78,.14],[.14,.78],[.78,.78]]) box(x+a,y+b,.08,.08,0,13,DWOOD,{ol:false}); box(x+.08,y+.08,.84,.84,13,3,WOOD,{top:'#8a6038'}); },
  workbench(o){ DEF.table(o); const [a,b]=P(o.x+.4,o.y+.4,16); G.fillStyle='#9aa0a8'; G.fillRect(a-6,b-2,10,2); G.fillStyle='#6a4a2a'; G.fillRect(a+4,b-4,3,4); },
  chair(o){ const {x,y}=o; for(const [a,b] of [[.25,.25],[.65,.25],[.25,.65],[.65,.65]]) box(x+a,y+b,.07,.07,0,9,DWOOD,{ol:false}); box(x+.22,y+.22,.56,.56,9,2,WOOD); box(x+.22,y+.22,.56,.07,11,14,WOOD); },
  throne(o){ const {x,y}=o; box(x+.1,y+.15,.8,.75,0,10,'#b8902a',{top:'#d8b040'}); box(x+.2,y+.25,.6,.6,10,3,'#8a1818'); box(x+.1,y+.12,.8,.13,10,30,'#b8902a'); box(x+.2,y+.17,.6,.06,14,22,'#8a1818'); box(x+.1,y+.25,.1,.6,10,9,'#b8902a'); box(x+.8,y+.25,.1,.6,10,9,'#b8902a'); },
  bed(o){ const {x,y}=o; box(x+.08,y+.05,.84,1.9,0,8,WOOD); box(x+.12,y+.1,.76,1.8,8,4,'#e8e2d4'); box(x+.12,y+.75,.76,1.15,12,1,'#7a2a2a',{top:'#8a3030'}); box(x+.2,y+.15,.6,.35,12,3,'#f4f0e8'); box(x+.08,y+.02,.84,.1,0,24,DWOOD); },
  nightstand(o){ box(o.x+.2,o.y+.2,.6,.6,0,14,WOOD,{planks:2}); },
  chest(o){ const {x,y}=o, r=box(x+.15,y+.25,.7,.5,0,12,'#6a4220',{planks:2,top:'#7a4e28'}); const [a,b]=P(x+.85,y+.5,6); G.fillStyle='#d8b040'; G.fillRect(a-1,b-2,3,4); },
  safe(o){ box(o.x+.15,o.y+.15,.7,.7,0,16,'#4a4e56'); },
  crate(o){ const r=box(o.x+.12,o.y+.12,.76,.76,0,18,'#9a7444',{planks:3}); },
  counter(o){ box(o.x,o.y+.1,1,.8,0,14,WOOD,{planks:2,top:'#8e6a40'}); },
  display(o){ box(o.x+.05,o.y+.1,.9,.8,0,10,WOOD); box(o.x+.1,o.y+.15,.8,.7,10,8,'#9ab8c8',{top:'#bcd8e6'}); },
  keg(o){ const [x,y]=cyl(o.x+.5,o.y+.5,.32,0,20,'#7a5030','#8a6038'); G.strokeStyle='#2a2a2a'; for(const z of [4,16]){ G.beginPath(); G.ellipse(x,y-z,.32*TW*.707,.32*TH*.707,0,0,Math.PI); G.stroke(); } },
  tub(o){ const [x,y]=cyl(o.x+.5,o.y+.5,.38,0,10,'#7a5030'); G.fillStyle='#4a7a9a'; G.beginPath(); G.ellipse(x,y-10,.3*TW*.707,.3*TH*.707,0,0,7); G.fill(); },
  cauldron(o){ const [x,y]=cyl(o.x+.5,o.y+.5,.34,2,14,'#2a2a2e'); G.fillStyle='#4a9a3a'; G.beginPath(); G.ellipse(x,y-16,.27*TW*.707,.27*TH*.707,0,0,7); G.fill(); flame(x,y+2,.8); },
  shelf(o){ const {x,y}=o, k=o.kind||'books'; const r=box(x+.1,y+.05,.8,.3,0,40,DWOOD);
    // prateleiras com itens na face +V (frente)
    for(let s=0;s<4;s++){ const z=4+s*9; for(let i=0;i<7;i++){ const u=x+.14+i*.105, cc=k==='books'?['#8a2020','#20406a','#2a6a2a','#7a6020','#5a2a6a'][(i+s*3)%5]:k==='potions'||k==='med'?['#c03030','#3050c0','#30a050','#c0a030'][(i+s)%4]:['#c8a060','#a06030','#e0d0a0'][(i+s)%3];
        const p=P(u,y+.35,z), hh=k==='books'?7:4; G.fillStyle=cc; G.fillRect(p[0]-1,p[1]-hh,3,hh); }
      const p=P(x+.1,y+.35,z), q=P(x+.9,y+.35,z); G.strokeStyle='#3a2414'; G.beginPath(); G.moveTo(p[0],p[1]); G.lineTo(q[0],q[1]); G.stroke(); } },
  bookcase(o){ DEF.shelf({...o,kind:'books'}); }, cabinet(o){ box(o.x+.1,o.y+.1,.8,.4,0,30,WOOD,{planks:3}); }, wardrobe(o){ box(o.x+.1,o.y+.1,.8,.45,0,40,DWOOD,{planks:2}); },
  hearth(o){ const {x,y}=o; if(o.kind==='forge'){ box(x+.1,y+.1,1.8,1.8,0,16,'#5a5450',{top:'#3a3430'}); const [a,b]=P(x+1,y+1,16); const gr=G.createRadialGradient(a,b,0,a,b,30); gr.addColorStop(0,'rgba(255,150,40,.9)'); gr.addColorStop(1,'rgba(255,80,20,0)'); G.fillStyle=gr; G.beginPath(); G.ellipse(a,b,26,12,0,0,7); G.fill(); box(x+.3,y+.2,.6,.5,16,40,'#4a4440'); return; }
    box(x+.05,y+.05,.9,.55,0,34,STONE,{top:'#6a645c'}); const p=P(x+.5,y+.6,4); G.fillStyle='#1a1210'; G.fillRect(p[0]-8,p[1]-14,16,13); flame(p[0],p[1]-5); },
  anvil(o){ const {x,y}=o; box(x+.35,y+.3,.3,.4,0,8,'#5a3a20'); box(x+.2,y+.35,.6,.3,8,6,'#3a3c42',{top:'#5a5e66'}); },
  rack(o){ const {x,y}=o; box(x+.1,y+.2,.06,.06,0,26,DWOOD); box(x+.84,y+.2,.06,.06,0,26,DWOOD); box(x+.1,y+.2,.8,.06,20,3,DWOOD); for(let i=0;i<4;i++){ const p=P(x+.22+i*.18,y+.27,2); G.fillStyle='#c8ccd4'; G.fillRect(p[0],p[1]-22,2,22); G.fillStyle='#7a5a2a'; G.fillRect(p[0]-2,p[1]-18,6,2); } },
  wrack(o){ DEF.rack(o); }, hooks(o){ DEF.rack(o); },
  candle(o){ const [x,y]=cyl(o.x+.5,o.y+.5,.05,0,26,'#3a3a3a'); cyl(o.x+.5,o.y+.5,.14,26,2,'#b8902a'); flame(x,y-32,.8); },
  brazier(o){ const [x,y]=cyl(o.x+.5,o.y+.5,.06,0,16,'#3a3a3a'); cyl(o.x+.5,o.y+.5,.3,16,6,'#4a4440'); flame(x,y-26,1.4); },
  pillar(o){ cyl(o.x+.5,o.y+.5,.36,0,6,'#7a766e'); cyl(o.x+.5,o.y+.5,.28,6,64,'#9a968e'); cyl(o.x+.5,o.y+.5,.36,70,5,'#7a766e'); },
  banner(o){ const [x,y]=P(o.x+.5,o.y+.5,0); G.fillStyle='#4a3a2a'; G.fillRect(x-1,y-56,3,56); G.fillStyle='#8a1a1a'; G.beginPath(); G.moveTo(x+2,y-54); G.lineTo(x+18,y-50); G.lineTo(x+18,y-22); G.lineTo(x+10,y-28); G.lineTo(x+2,y-24); G.fill(); G.fillStyle='#d8b040'; G.fillRect(x+8,y-46,3,12); G.fillRect(x+5,y-42,9,3); },
  bench(o){ const {x,y}=o; box(x+.1,y+.3,1.8,.4,0,8,WOOD,{top:'#8a6038'}); }, pew(o){ const {x,y}=o; box(x+.1,y+.35,1.8,.35,0,8,WOOD); box(x+.1,y+.25,1.8,.1,0,20,DWOOD); },
  loom(o){ const {x,y}=o; box(x+.15,y+.2,.08,.6,0,28,DWOOD); box(x+.77,y+.2,.08,.6,0,28,DWOOD); box(x+.15,y+.45,.7,.1,24,4,DWOOD); const p=P(x+.2,y+.5,8); G.fillStyle='#b05a3a'; G.fillRect(p[0],p[1]-14,18,12); },
  altar(o){ box(o.x+.1,o.y+.15,1.8,.7,0,16,'#d8d0c0',{top:'#ece6da'}); box(o.x+.5,o.y+.15,1,.7,16,1,'#8a1818'); const p=P(o.x+1,o.y+.45,17); G.fillStyle='#d8b040'; G.fillRect(p[0]-1,p[1]-16,3,16); G.fillRect(p[0]-5,p[1]-12,11,3); },
  board(o){ const {x,y}=o; box(x+.15,y+.4,.06,.06,0,24,DWOOD); box(x+.79,y+.4,.06,.06,0,24,DWOOD); box(x+.12,y+.38,.76,.08,12,16,'#9a7444'); for(let i=0;i<3;i++){ const p=P(x+.25+i*.2,y+.46,15); G.fillStyle='#ece2c8'; G.fillRect(p[0],p[1]-10,7,9); } },
  orb(o){ const [x,y]=cyl(o.x+.5,o.y+.5,.18,0,14,'#6a6a72'); const gr=G.createRadialGradient(x-2,y-22,1,x,y-20,8); gr.addColorStop(0,'#c8e8ff'); gr.addColorStop(1,'#3a5aa8'); G.fillStyle=gr; G.beginPath(); G.arc(x,y-20,7,0,7); G.fill(); },
  plant(o){ cyl(o.x+.5,o.y+.5,.2,0,8,'#9a5a3a'); blob(o.x+.5,o.y+.5,.32,14,[[40,90,40],[90,150,70]],o.x*3+o.y,{z:8,rough:.6,freq:5}); },
  fountain(o){ const {x,y}=o; const [a,b]=P(x+1,y+1,0); G.fillStyle='#8a847a'; G.beginPath(); G.ellipse(a,b,46,23,0,0,Math.PI); G.lineTo(a-46,b-10); G.ellipse(a,b-10,46,23,0,Math.PI,0,true); G.fill(); G.fillStyle='#a8a296'; G.beginPath(); G.ellipse(a,b-10,46,23,0,0,7); G.fill(); G.fillStyle='#3a6a9a'; G.beginPath(); G.ellipse(a,b-10,39,19,0,0,7); G.fill();
    cyl(x+1,y+1,.14,0,30,'#a8a296'); G.strokeStyle='rgba(200,230,255,.8)'; for(let k=0;k<6;k++){ G.beginPath(); G.moveTo(a,b-30); G.quadraticCurveTo(a+Math.cos(k)*18,b-44,a+Math.cos(k)*28,b-12+Math.sin(k)*8); G.stroke(); } },
  rug(o){ const {x,y}=o, w=o.w||2, h=o.h||6; poly([P(x+.1,y+.1),P(x+w-.1,y+.1),P(x+w-.1,y+h-.1),P(x+.1,y+h-.1)],'#7a1a1e','#c8a040'); poly([P(x+.3,y+.3),P(x+w-.3,y+.3),P(x+w-.3,y+h-.3),P(x+.3,y+h-.3)],'#8a2228','#c8a040'); },
  hay(o){ blob(o.x+.5,o.y+.55,.5,16,[[170,140,60],[230,200,110]],o.x+o.y,{rough:.3,freq:6}); },
  logs(o){ for(let k=0;k<3;k++){ const [a,b]=P(o.x+.3+k*.2,o.y+.6,k===2?10:0); G.fillStyle='#6a4a2a'; G.fillRect(a-10,b-9,22,9); G.fillStyle='#c8a070'; G.beginPath(); G.ellipse(a+12,b-4.5,3,4.5,0,0,7); G.fill(); } },
  // natureza
  brush(o,bi){ blob(o.x+.5,o.y+.55,.38,14,bi==='o'?[[110,100,50],[170,150,80]]:bi==='n'?[[60,80,70],[120,140,130]]:[[40,80,32],[96,140,60]],o.x*5+o.y*3,{rough:.6,freq:5}); },
  berry(o,bi){ blob(o.x+.5,o.y+.55,.4,15,[[40,84,36],[90,140,60]],o.x*5+o.y*3,{rough:.6,freq:5,dots:[190,30,40]}); },
  hedge(o){ blob(o.x+.5,o.y+.5,.62,20,[[34,72,30],[80,126,52]],o.x*5+o.y*3,{rough:.35,freq:6,flat:.85}); },
  rock(o,bi){ isRockSmall(o,bi); },
  log(o){ const [a,b]=P(o.x+.2,o.y+.6,0), [c,d]=P(o.x+1.8,o.y+.6,0); G.strokeStyle='#5a3e24'; G.lineWidth=9; G.beginPath(); G.moveTo(a,b-5); G.lineTo(c,d-5); G.stroke(); G.lineWidth=1; G.fillStyle='#c8a070'; G.beginPath(); G.ellipse(c,d-5,3,5,0,0,7); G.fill(); },
  deadtree(o){ const [x,y]=P(o.x+.5,o.y+.5,0); G.strokeStyle='#4a3a2e'; const br=(x0,y0,a,l,w)=>{ if(l<6) return; const x1=x0+Math.cos(a)*l, y1=y0+Math.sin(a)*l; G.lineWidth=w; G.beginPath(); G.moveTo(x0,y0); G.lineTo(x1,y1); G.stroke(); br(x1,y1,a-.5,l*.66,w*.65); br(x1,y1,a+.45,l*.62,w*.65); }; br(x,y,-Math.PI/2,34,5); G.lineWidth=1; },
  cactus(o){ cyl(o.x+.5,o.y+.5,.14,0,40,'#4a7a3a'); cyl(o.x+.35,o.y+.5,.08,16,14,'#4a7a3a'); cyl(o.x+.68,o.y+.5,.08,22,12,'#4a7a3a'); },
  palm(o){ const [x,y]=P(o.x+.5,o.y+.5,0); G.strokeStyle='#8a6a40'; G.lineWidth=6; G.beginPath(); G.moveTo(x,y); G.quadraticCurveTo(x+10,y-40,x+4,y-80); G.stroke(); G.lineWidth=1;
    for(let k=0;k<8;k++){ const a=k/8*Math.PI*2; G.strokeStyle=k%2?'#3a7a2a':'#5a9a3a'; G.lineWidth=5; G.beginPath(); G.moveTo(x+4,y-80); G.quadraticCurveTo(x+4+Math.cos(a)*22,y-92+Math.sin(a)*6,x+4+Math.cos(a)*36,y-70+Math.sin(a)*12); G.stroke(); } G.lineWidth=1; },

};
let curToS=null; function isRockSmall(o,bi){ isoRock(G,curToS,o.x,o.y,bi,false); }
window.isoProp=function(g,toS,o,biome){ G=g; curToS=toS; P=(U,V,z)=>{ const [a,b]=toS(U,V); return [a,b-(z||0)]; };
  const f=DEF[o.type]||(o.type==='shelf'?DEF.shelf:null); if(!f) return false; const r=f(o,biome); return r||true; };
})();

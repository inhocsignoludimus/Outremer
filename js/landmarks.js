'use strict';
// =====================================================================
// OUTREMER — Aelória II, fase 2: os lugares de tirar o fôlego
// Colosso do Peregrino, Cachoeira do Véu, os quatro Oratórios (Pobreza, Obediência, Castidade,
// Coragem) com os Selos dos Quatro Votos, Árvore-Mãe com as raízes, Campo das Mil Espadas,
// Mar de Vidro e o Lago do Navio Congelado com o porão.
// Os monumentos grandes são desenhados uma vez (isométrico) e reaproveitados na câmera
// clássica e na primeira pessoa; animações (fogo, água, névoa, brilho) por cima, a cada quadro.
// =====================================================================
(function(){
if(typeof isoDefine!=='function') return;
const TW=48, TH=24, LM=[]; window.LM_LIST=LM;
const AREAS={}; window.LM_AREAS=AREAS;
const SLOT=k=>({x:8+(k%10)*126,y:1330+Math.floor(k/10)*80,w:118,h:70}); window.LM_SLOT=SLOT;
const ANIMX={}, DRESSX=[];
const ON=()=>window.WORLD_ID===2;
const cellC=s=>{ const m=s.match(/^([A-Z]+)(\d+)$/), c=m[1].length===1?m[1].charCodeAt(0)-65:26+m[1].charCodeAt(1)-65; return [c*40+20,(+m[2]-1)*40+20]; };
const NATURE=new Set(['tree','pine','olive','palm','brush','berry','rock','log','deadtree','cactus','plant']);
const wet=t=>t===TL.SEA||t===TL.WATER;
function clearNature(x0,y0,x1,y1){ for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++){ if(!inB(x,y)) continue; const o=objGrid[idx(x,y)]; if(o&&NATURE.has(o.type)) removeObj(o); } }
function dry(x,y){ if(!inB(x,y)) return false; const i=idx(x,y), t=map[i]; return !wet(t)&&t!==TL.WALL&&t!==TL.WINDOW&&t!==TL.ICE&&t!==TL.CHASM&&bld[i]<0&&regionId[i]===255&&!doors.has(i); }
function fits(x,y,w,h,m){ for(let dy=-m;dy<h+m;dy++) for(let dx=-m;dx<w+m;dx++) if(!dry(x+dx,y+dy)) return false; for(let dy=0;dy<h;dy++) for(let dx=0;dx<w;dx++){ const o=objGrid[idx(x+dx,y+dy)]; if(o&&!NATURE.has(o.type)) return false; } return true; }
function spot(cx,cy,w,h,R,m,score){ let best=null, bs=1e9; for(let y=cy-R;y<=cy+R;y++) for(let x=cx-R;x<=cx+R;x++){ if(!fits(x,y,w,h,m)) continue; const s=score?score(x,y):Math.hypot(x+w/2-cx,y+h/2-cy); if(s<bs){ bs=s; best=[x,y]; } } return best; }
function seaDist(x,y,R){ let d=1e9; for(let dy=-R;dy<=R;dy+=1) for(let dx=-R;dx<=R;dx+=1){ if(!inB(x+dx,y+dy)) continue; if(map[idx(x+dx,y+dy)]===TL.SEA){ const k=Math.hypot(dx,dy); if(k<d) d=k; } } return d; }
function lm(type,x,y,w,h,extra){ clearNature(x-1,y-1,x+w,y+h); const o=addObj({type,x,y,w,h,solid:true,lm:true,...(extra||{})}); LM.push(o); return o; }
const paint=(x,y,t)=>{ if(inB(x,y)){ const i=idx(x,y); map[i]=t; fden[i]=0; } };

// ---------- paletas ----------
const STONE='#9a958a', STONEL='#b2ad9f', CHAIN='#8a8c90', LINEN='#d6cfbf', RED='#a8221c';
const ROCKG=[[92,88,82],[170,164,152]], ROCKD=[[80,74,66],[150,140,126]], LEAF=[[30,66,26],[98,150,56]], LEAF2=[[24,54,22],[80,128,44]], BARK=[[66,46,28],[120,88,56]];
const SNOWR=[[110,114,122],[214,220,230]], SANDR=[[150,112,70],[226,190,140]];

// ---------- tamanhos de cada desenho (canvas e âncora do canto (o.x,o.y)) ----------
const SZ={ colosso:{top:560,pad:80}, cachoeira:{top:260,pad:50}, oratorio:{top:150,pad:40}, espada_rocha:{top:130,pad:60}, arvore_mae:{top:440,pad:150}, mastro:{top:120,pad:40}, jangada:{top:40,pad:20} };
function sizeOf(o){ const z=SZ[o.type]||{top:150,pad:40}, w=o.w||1, h=o.h||1; const cw=(w+h)*TW/2+z.pad*2, ch=z.top+(w+h)*TH/2+20; return {cw,ch,ax:h*TW/2+z.pad,ay:z.top}; }
const IMG=new Map();
function lmImage(o){ const k=o.type+'|'+(o.v||'')+'|'+o.w+'x'+o.h; if(IMG.has(k)) return IMG.get(k);
  const S=sizeOf(o), cv=document.createElement('canvas'); cv.width=S.cw; cv.height=S.ch; const g=cv.getContext('2d');
  const toS=(U,V)=>[S.ax+((U-o.x)-(V-o.y))*TW/2, S.ay+((U-o.x)+(V-o.y))*TH/2];
  try{ isoProp(g,toS,o,'p'); }catch(e){ console.warn('lm',o.type,e); }
  const r={cv,ax:S.ax,ay:S.ay,cw:S.cw,ch:S.ch}; IMG.set(k,r); return r; }
window.lmImage=lmImage;

// ---------- desenhos (isométrico) ----------
function crossOnFace(K,U,V,du,z,h,s){ const G=K.G(), m=U+du/2; G.strokeStyle=RED; G.lineCap='butt';
  let a=K.P(m,V,z+h*.18), b=K.P(m,V,z+h*.86); G.lineWidth=s; G.beginPath(); G.moveTo(a[0],a[1]); G.lineTo(b[0],b[1]); G.stroke();
  a=K.P(U+du*.2,V,z+h*.62); b=K.P(U+du*.8,V,z+h*.62); G.beginPath(); G.moveTo(a[0],a[1]); G.lineTo(b[0],b[1]); G.stroke(); }
function crossOnFaceU(K,U,V,dv,z,h,s){ const G=K.G(), m=V+dv/2; G.strokeStyle=RED;
  let a=K.P(U,m,z+h*.18), b=K.P(U,m,z+h*.86); G.lineWidth=s; G.beginPath(); G.moveTo(a[0],a[1]); G.lineTo(b[0],b[1]); G.stroke();
  a=K.P(U,V+dv*.2,z+h*.62); b=K.P(U,V+dv*.8,z+h*.62); G.beginPath(); G.moveTo(a[0],a[1]); G.lineTo(b[0],b[1]); G.stroke(); }
function grime(K,o,n,seed){ const G=K.G(); for(let k=0;k<n;k++){ const [x,y]=K.P(o.x+th(k,seed,1)*o.w,o.y+th(k,seed,2)*o.h,th(k,seed,3)*360); G.fillStyle=th(k,seed,4)<.5?'rgba(60,70,40,.35)':'rgba(40,36,30,.3)'; G.fillRect(x|0,y|0,1+(th(k,seed,5)*3|0),2+(th(k,seed,6)*6|0)); } }

isoDefine('colosso',(o,K)=>{ const cx=o.x+o.w/2, cy=o.y+o.h/2, B=K.box;
  K.blob(cx,cy,2.2,56,ROCKG,o.x*7+o.y,{rough:.34,freq:1.4});
  B(cx-1.5,cy-1.5,3.0,3.0,50,12,'#8a8478',{top:'#a39d8f'});
  B(cx-1.3,cy-1.15,2.6,.26,62,200,'#6a645a');                                       // manto atrás
  B(cx-1.05,cy-.45,.9,.9,62,104,CHAIN); B(cx+.15,cy-.45,.9,.9,62,104,CHAIN);         // pernas
  B(cx-1.12,cy-.5,1.02,1.0,62,18,'#6a665e'); B(cx+.08,cy-.5,1.02,1.0,62,18,'#6a665e'); // botas
  B(cx-1.25,cy-.6,2.5,1.2,140,56,LINEN); crossOnFace(K,cx-1.25,cy+.6,2.5,140,56,7);  // saia da túnica
  B(cx-1.2,cy-.58,2.4,1.16,196,96,LINEN); crossOnFace(K,cx-1.2,cy+.58,2.4,196,96,10); crossOnFaceU(K,cx+1.2,cy-.58,1.16,196,96,6);
  B(cx-1.22,cy-.6,2.44,1.2,194,8,'#5a4430');                                          // cinto
  B(cx-1.55,cy-.55,.6,1.1,262,34,'#a29e94',{top:'#b6b2a8'}); B(cx+.95,cy-.55,.6,1.1,262,34,'#a29e94',{top:'#b6b2a8'}); // ombreiras
  // braço direito erguido com a espada
  B(cx+1.05,cy-.32,.55,.64,218,52,CHAIN); B(cx+1.08,cy-.28,.5,.56,292,64,CHAIN); B(cx+1.05,cy-.3,.56,.6,354,26,'#7a766e');
  B(cx+.8,cy-.12,1.1,.24,380,10,'#6c6a66'); B(cx+1.24,cy-.08,.2,.2,390,150,'#b8bcc2',{top:'#e2e6ea'}); B(cx+1.22,cy-.1,.24,.24,356,10,'#8a7a5a');
  // braço esquerdo à frente segurando o braseiro
  B(cx-1.6,cy-.32,.55,.64,218,58,CHAIN); B(cx-1.58,cy+.2,.5,1.2,252,30,CHAIN); B(cx-1.6,cy+1.3,.56,.46,246,36,'#7a766e');
  K.cyl(cx-1.32,cy+1.55,.62,282,16,'#6a5a48','#3a2a1c');
  // elmo fechado
  B(cx-.5,cy-.42,1.0,.84,292,74,'#a8a49a',{top:'#bab6ac'}); B(cx-.53,cy-.45,1.06,.9,330,6,'#8a867c');
  { const G=K.G(); G.fillStyle='#1a1612'; const a=K.P(cx-.4,cy+.42,334), b=K.P(cx+.4,cy+.42,334); G.fillRect(Math.min(a[0],b[0]),Math.min(a[1],b[1])-1,Math.abs(b[0]-a[0])+1,4);
    const c=K.P(cx,cy+.42,316); G.fillRect(c[0]-1,c[1]-14,3,14); }
  crossOnFace(K,cx-.5,cy+.42,1.0,294,30,3);
  grime(K,o,120,o.x+o.y);
});
isoDefine('cachoeira',(o,K)=>{ const G=K.G();
  for(let k=0;k<o.w;k++) K.blob(o.x+k+.5,o.y+.7+th(k,o.y,3)*.3,1.05,150+th(k,o.x,1)*60,ROCKG,o.x*3+k,{rough:.38,freq:1.5,strata:true});
  for(let k=0;k<o.w;k+=2) K.blob(o.x+k+1,o.y+1.5,.9,60+th(k,o.x,2)*30,ROCKD,o.x+k*5,{rough:.4});
  // véu de água e boca da gruta
  const f0=o.x+o.w/2-.6, f1=o.x+o.w/2+.6, fz=196, a=K.P(f0,o.y+1.6,fz), b=K.P(f1,o.y+1.6,fz), c=K.P(f1,o.y+2.05,0), d=K.P(f0,o.y+2.05,0);
  const gr=G.createLinearGradient(0,a[1],0,c[1]); gr.addColorStop(0,'rgba(210,236,246,.95)'); gr.addColorStop(1,'rgba(170,214,232,.9)'); G.fillStyle=gr; G.beginPath(); G.moveTo(a[0],a[1]); G.lineTo(b[0],b[1]); G.lineTo(c[0],c[1]); G.lineTo(d[0],d[1]); G.closePath(); G.fill();
  const m=K.P(o.x+o.w/2+1.7,o.y+1.95,0); G.fillStyle='#120c08'; G.beginPath(); G.ellipse(m[0],m[1]-16,13,17,0,Math.PI,0); G.lineTo(m[0]+13,m[1]); G.lineTo(m[0]-13,m[1]); G.fill();
  G.fillStyle='#6a5a40'; G.fillRect(m[0]-15,m[1]-1,30,3);
});
const CHAP={ pedra:{w:'#8e887c',r:'#4a4a52',t:'#5a5a62'}, neve:{w:'#8a8c92',r:'#e8ecf2',t:'#f4f6fa'}, musgo:{w:'#7a7a66',r:'#3e5a2a',t:'#4e6a32'} };
isoDefine('oratorio',(o,K)=>{ const C=CHAP[o.v]||CHAP.pedra, G=K.G(), x=o.x+.15, y=o.y+.15, w=o.w-.3, h=o.h-.3, wh=46;
  K.box(x-.1,y-.1,w+.2,h+.2,0,5,'#6a665e');
  K.box(x,y,w,h,5,wh,C.w,{planks:0});
  // telhado de duas águas ao longo de V
  const rz=5+wh, rh=30, A=K.P(x-.12,y-.12,rz), B=K.P(x+w+.12,y-.12,rz), Cc=K.P(x+w+.12,y+h+.12,rz), D=K.P(x-.12,y+h+.12,rz), R0=K.P(x+w/2,y-.12,rz+rh), R1=K.P(x+w/2,y+h+.12,rz+rh);
  K.poly([D,R1,R0,A],K.css(K.hex(C.r),.7),'#1a1612'); K.poly([R1,Cc,B,R0],K.css(K.hex(C.t),1),'#1a1612');
  // empena da frente (face +V) com porta em arco e janelinha acesa
  K.poly([K.P(x,y+h,rz),K.P(x+w,y+h,rz),K.P(x+w/2,y+h,rz+rh-3)],K.css(K.hex(C.w),.66),'#2a241e');
  const dm=K.P(x+w/2,y+h,5); G.fillStyle='#24180e'; G.beginPath(); G.moveTo(dm[0]-7,dm[1]+3); G.lineTo(dm[0]-7,dm[1]-16); G.ellipse(dm[0],dm[1]-16,7,7,0,Math.PI,0); G.lineTo(dm[0]+7,dm[1]+3); G.fill();
  const wi=K.P(x+w,y+h*.5,26); G.fillStyle='#f0c060'; G.fillRect(wi[0]-2,wi[1]-6,4,8);
  // cruz no topo
  const t=K.P(x+w/2,y+h+.05,rz+rh); G.fillStyle='#d8c890'; G.fillRect(t[0]-1,t[1]-16,3,16); G.fillRect(t[0]-5,t[1]-12,11,3);
  if(o.v==='neve'){ const s=K.P(x+w/2,y+.4,rz+rh); G.fillStyle='#5a4a3a'; G.fillRect(s[0]-6,s[1]-18,2,18); G.fillRect(s[0]+5,s[1]-18,2,18); G.fillRect(s[0]-6,s[1]-20,13,3); G.fillStyle='#b8902a'; G.beginPath(); G.ellipse(s[0]+.5,s[1]-11,4,5,0,0,7); G.fill(); }
  if(o.v==='musgo') for(let k=0;k<70;k++){ const p=K.P(x+th(k,o.x,1)*w,y+h,5+th(k,o.y,2)*(wh+20)); G.fillStyle=th(k,7,3)<.5?'#4a6a2a':'#5e7e34'; G.fillRect(p[0]|0,p[1]|0,2+(th(k,3,4)*4|0),2); }
});
isoDefine('espada_rocha',(o,K)=>{ const G=K.G(), cx=o.x+o.w/2, cy=o.y+o.h/2;
  for(let k=0;k<26;k++){ const p=K.P(o.x-1+th(k,o.x,1)*(o.w+2),o.y-1+th(k,o.y,2)*(o.h+2),0); G.fillStyle=th(k,5,3)<.6?'#e6dcc4':'#cfc4a8'; const L=3+(th(k,6,4)*6|0); G.fillRect(p[0]|0,p[1]|0,L,2); if(th(k,9,5)<.25){ G.fillStyle='#e8dfc8'; G.beginPath(); G.ellipse(p[0]+2,p[1]-2,4,3,0,0,7); G.fill(); G.fillStyle='#2a2018'; G.fillRect(p[0],p[1]-3,2,2); G.fillRect(p[0]+3,p[1]-3,2,2); } }
  K.blob(cx,cy,1.05,40,SANDR,o.x+o.y,{rough:.3});
  K.box(cx-.07,cy-.07,.14,.14,36,62,'#b8bcc4',{top:'#e8ecf0'}); K.box(cx-.38,cy-.06,.76,.12,96,8,'#8a7a4a'); K.box(cx-.07,cy-.07,.14,.14,104,22,'#5a3a20'); K.box(cx-.1,cy-.1,.2,.2,126,7,'#c8a840');
});
isoDefine('arvore_mae',(o,K)=>{ const G=K.G(), cx=o.x+o.w/2, cy=o.y+o.h/2;
  for(let k=0;k<9;k++){ const a=k/9*6.283; K.blob(cx+Math.cos(a)*1.9,cy+Math.sin(a)*1.9,.85,30+th(k,o.x,1)*20,BARK,k*11+o.x,{rough:.35}); }
  K.cyl(cx,cy,1.55,0,190,'#5c4128','#4a3420');
  for(let k=0;k<14;k++){ const a=-.2+k*.16, p0=K.P(cx+Math.cos(a+.8)*1.1,cy+Math.sin(a+.8)*1.1,10+k*12); G.fillStyle='rgba(30,20,10,.45)'; G.fillRect(p0[0]|0,p0[1]|0,2,10+th(k,1,1)*20); }
  const m=K.P(cx+.25,cy+1.45,0); const gg=G.createRadialGradient(m[0],m[1]-22,2,m[0],m[1]-22,26); gg.addColorStop(0,'#c8ff9a'); gg.addColorStop(.5,'#4ac040'); gg.addColorStop(1,'#0c2a0c');
  G.fillStyle=gg; G.beginPath(); G.ellipse(m[0],m[1]-22,15,24,0,Math.PI,0); G.lineTo(m[0]+15,m[1]); G.lineTo(m[0]-15,m[1]); G.fill();
  for(let k=0;k<7;k++){ const a=k/7*6.283; K.blob(cx+Math.cos(a)*1.4,cy+Math.sin(a)*1.4,1.1,60,LEAF2,k*7+3,{z:150+th(k,2,2)*30,rough:.45,freq:1.8}); }
  for(let k=0;k<12;k++){ const a=k/12*6.283+.3, r=2.4+th(k,o.y,3)*.8; K.blob(cx+Math.cos(a)*r,cy+Math.sin(a)*r,1.35,80,k%2?LEAF:LEAF2,k*13+o.x,{z:190+th(k,4,4)*60,rough:.45,freq:1.7}); }
  for(let k=0;k<6;k++){ const a=k/6*6.283; K.blob(cx+Math.cos(a)*1.2,cy+Math.sin(a)*1.2,1.5,70,LEAF,k*5+9,{z:290+th(k,6,6)*40,rough:.45,freq:1.7}); }
  K.blob(cx,cy,1.7,70,LEAF,77,{z:350,rough:.45,freq:1.7});
});
isoDefine('mastro',(o,K)=>{ const G=K.G(), c=K.P(o.x+.5,o.y+.5,0);
  G.fillStyle='#22303c'; G.beginPath(); G.ellipse(c[0],c[1],22,11,0,0,7); G.fill(); G.strokeStyle='#e8f2fa'; G.lineWidth=2; G.stroke();
  for(let k=0;k<8;k++){ const a=k/8*6.283; G.fillStyle='#dceaf4'; G.fillRect(c[0]+Math.cos(a)*24|0,c[1]+Math.sin(a)*12|0,5,3); }
  K.box(o.x+.42,o.y+.42,.16,.16,0,96,'#4a3420'); K.box(o.x+.1,o.y+.44,.8,.1,70,5,'#3a2818');
  G.fillStyle='rgba(200,190,160,.85)'; const s0=K.P(o.x+.15,o.y+.5,68), s1=K.P(o.x+.85,o.y+.5,68), s2=K.P(o.x+.7,o.y+.5,30); G.beginPath(); G.moveTo(s0[0],s0[1]); G.lineTo(s1[0],s1[1]); G.lineTo(s2[0],s2[1]); G.lineTo(s0[0]+6,s0[1]+22); G.closePath(); G.fill();
  G.fillStyle='#f4f8fc'; G.fillRect(s0[0]-2,s0[1]-30,20,3);
});
isoDefine('jangada',(o,K)=>{ for(let k=0;k<5;k++) K.box(o.x+.08+k*.17,o.y+.1,.15,.8,0,5,k%2?'#7a5632':'#8a6438'); K.box(o.x+.05,o.y+.2,.9,.1,5,2,'#5a3a20'); K.box(o.x+.05,o.y+.7,.9,.1,5,2,'#5a3a20'); K.box(o.x+.45,o.y+.45,.06,.06,7,26,'#5a3a20'); });
isoDefine('diario',(o,K)=>{ K.box(o.x+.3,o.y+.3,.4,.4,0,14,'#5a3a20'); K.box(o.x+.22,o.y+.25,.56,.5,14,3,'#e0d4b0',{top:'#ece2c6'}); const G=K.G(), p=K.P(o.x+.5,o.y+.5,17); G.fillStyle='#3a2a1a'; G.fillRect(p[0]-1,p[1]-3,2,6); });

// ---------- animações por cima (isométrico) ----------
function fire(g,x,y,s,now){ const t=now/90; g.fillStyle='rgba(255,150,60,.22)'; g.beginPath(); g.ellipse(x,y-6*s,26*s,20*s,0,0,7); g.fill();
  for(let k=0;k<6;k++){ const j=Math.sin(t+k*1.7)*3*s, h=(14+Math.sin(t*1.3+k)*5)*s; g.fillStyle=['#b8361f','#e0552a','#ffa340','#ffe08a'][k%4]; g.beginPath(); g.moveTo(x-8*s+k*3*s,y); g.lineTo(x-6*s+k*3*s+j,y-h); g.lineTo(x-3*s+k*3*s,y); g.fill(); } }
const night=()=>{ const h=typeof time!=='undefined'?time:12; return h<5.5||h>19.5; };
function anim(g,o,now,toS){ const cx=o.x+o.w/2, cy=o.y+o.h/2, P=(U,V,z)=>{ const [a,b]=toS(U,V); return [a,b-(z||0)]; };
  if(o.type==='colosso'){ const [x,y]=P(cx-1.32,cy+1.55,298); fire(g,x,y,1.3,now); if(night()){ const gr=g.createRadialGradient(x,y-10,4,x,y-10,140); gr.addColorStop(0,'rgba(255,190,100,.35)'); gr.addColorStop(1,'rgba(255,160,60,0)'); g.fillStyle=gr; g.fillRect(x-140,y-150,280,280); } }
  else if(o.type==='cachoeira'){ const f0=cx-.6, f1=cx+.6, top=P(f0,o.y+1.6,196)[1], bot=P(f0,o.y+2.05,0)[1];
    g.fillStyle='rgba(255,255,255,.75)'; for(let k=0;k<26;k++){ const u=f0+(k+.5)/26*(f1-f0), ph=((now/9+k*37)%(bot-top)); const [x,y0]=P(u,o.y+1.6+(ph/(bot-top))*.45,196-ph*196/(bot-top)); g.fillRect(x|0,y0|0,1,7); }
    const [bx,by]=P(cx,o.y+2.3,0); for(let k=0;k<9;k++){ const a=now/400+k; g.fillStyle=`rgba(240,250,255,${.35+.25*Math.sin(a*2)})`; g.beginPath(); g.ellipse(bx-30+k*7.5,by+Math.sin(a)*2,7+Math.sin(a*1.7)*2,4,0,0,7); g.fill(); }
    g.fillStyle='rgba(230,240,248,.18)'; for(let k=0;k<4;k++){ g.beginPath(); g.ellipse(bx+Math.sin(now/1500+k)*20,by-14-k*10,46-k*6,16,0,0,7); g.fill(); }
    if(!night()&&(typeof WX==='undefined'||WX.rain<.2)){ g.lineWidth=2; ['rgba(255,60,60,.28)','rgba(255,170,40,.28)','rgba(255,240,80,.28)','rgba(80,220,90,.28)','rgba(70,140,255,.28)','rgba(150,80,220,.28)'].forEach((c,k)=>{ g.strokeStyle=c; g.beginPath(); g.ellipse(bx+20,by-6,70-k*2.5,58-k*2.5,0,Math.PI*1.08,Math.PI*1.92); g.stroke(); }); } }
  else if(o.type==='arvore_mae'){ const [x,y]=P(cx+.25,cy+1.45,0), p=.5+.5*Math.sin(now/700); const gr=g.createRadialGradient(x,y-22,2,x,y-22,46); gr.addColorStop(0,`rgba(150,255,120,${.25+.25*p})`); gr.addColorStop(1,'rgba(60,200,60,0)'); g.fillStyle=gr; g.fillRect(x-46,y-70,92,92);
    if(night()) for(let k=0;k<14;k++){ const a=now/1800+k*2.1, [fx,fy]=P(cx+Math.cos(a)*(2.5+k%3),cy+Math.sin(a*1.3)*(2.5+k%4),30+((k*37+now/40)%90)); g.fillStyle=`rgba(210,255,140,${.5+.5*Math.sin(now/200+k)})`; g.fillRect(fx|0,fy|0,2,2); } }
  else if(o.type==='oratorio'&&night()){ const [x,y]=P(o.x+o.w-.15,o.y+o.h*.5,24); const gr=g.createRadialGradient(x,y,1,x,y,30); gr.addColorStop(0,'rgba(255,200,110,.45)'); gr.addColorStop(1,'rgba(255,180,90,0)'); g.fillStyle=gr; g.fillRect(x-30,y-30,60,60); }
  else if(o.area==='campo'&&night()){ const A=AREAS.campo; g.fillStyle='rgba(200,210,220,.07)'; for(let k=0;k<10;k++){ const [x,y]=P(A.x+Math.cos(k*1.3+now/9000)*A.r*.6,A.y+Math.sin(k*2.1+now/11000)*A.r*.6); g.beginPath(); g.ellipse(x,y,150,50,0,0,7); g.fill(); } }
  else if(ANIMX[o.type||o.area]) ANIMX[o.type||o.area](g,o,now,P,toS);
  else if(o.area==='vidro'){ const A=AREAS.vidro, h=typeof time!=='undefined'?time:12, dusk=h>16.5&&h<19.8?1:.25; for(let k=0;k<70*dusk;k++){ const a=th(k,Math.floor(now/260),9)*6.283, r=Math.sqrt(th(k,Math.floor(now/260),8))*A.r, [x,y]=P(A.x+Math.cos(a)*r,A.y+Math.sin(a)*r);
      g.fillStyle=dusk>.5?`rgba(255,${190+th(k,3,3)*60|0},150,.9)`:'rgba(220,250,255,.85)'; g.fillRect(x|0,y|0,2,2); g.fillRect((x|0)-2,(y|0),1,1); g.fillRect((x|0)+3,(y|0),1,1); }
    if(dusk>.5){ const [x,y]=P(A.x,A.y); const gr=g.createRadialGradient(x,y,10,x,y,A.r*30); gr.addColorStop(0,'rgba(255,170,90,.16)'); gr.addColorStop(1,'rgba(255,140,60,0)'); g.fillStyle=gr; g.fillRect(x-A.r*30,y-A.r*16,A.r*60,A.r*32); } }
}
// itens para o passe isométrico
const AREA_IT=[{area:'campo',x:0,y:0,w:1,h:1},{area:'vidro',x:0,y:0,w:1,h:1}]; window.LM_AREA_IT=AREA_IT;
window.lmIsoItems=function(W2S,bw,bh){ if(!ON()||!LM.length) return []; const out=[];
  for(const o of LM){ const S=sizeOf(o), [X,Y]=W2S(o.x*T,o.y*T); if(X-S.ax>bw+20||X-S.ax+S.cw<-20||Y-S.ay>bh+40||Y-S.ay+S.ch<-20) continue; out.push({k:'lm',o,d:o.x+o.w+o.y+o.h-.6}); }
  const px=player.x/T, py=player.y/T;
  for(const a of AREA_IT){ const A=AREAS[a.area]; if(A&&(A.screen?A.screen():Math.hypot(A.x-px,A.y-py)<A.r+30)) out.push({k:'lm',o:a,d:(a.top||a.area==='campo')?1e9:-1e8}); }
  return out; };
window.lmIsoDraw=function(g,o,now,W2S,first){ const toS=(U,V)=>W2S(U*T,V*T);
  if(first){ if(o.area) return null; const im=lmImage(o), [X,Y]=toS(o.x,o.y); return {cv:im.cv,x:Math.round(X-im.ax),y:Math.round(Y-im.ay),w:im.cw,h:im.ch}; }
  anim(g,o,now,toS); };

// ---------- primeira pessoa: o mesmo desenho como placa de pé ----------
const FPS=new Map();
window.lmFP=function(scene,cam,now){ if(!ON()||typeof THREE==='undefined') { for(const [o,s] of FPS){ scene.remove(s); } FPS.clear(); return; }
  const px=player.x/T, py=player.y/T;
  for(const o of LM){ const d=Math.hypot(o.x-px,o.y-py), s=FPS.get(o);
    if(d<150&&!s){ const im=lmImage(o), tex=new THREE.CanvasTexture(im.cv); tex.magFilter=THREE.NearestFilter; tex.minFilter=THREE.NearestFilter;
      const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,alphaTest:.5,fog:true})), k=1/30, gx=im.ax+(o.w-o.h)/2*TW/2, gy=im.ay+(o.w+o.h)/2*TH/2;
      sp.center.set(gx/im.cw,1-gy/im.ch); sp.scale.set(im.cw*k,im.ch*k,1); sp.position.set(o.x+o.w/2,0,o.y+o.h/2); scene.add(sp); FPS.set(o,sp); }
    else if(d>170&&s){ scene.remove(s); FPS.delete(o); } } };

// ---------- câmera clássica: o desenho reduzido ----------
const _dObjL=drawObj;
drawObj=function(g,o,sx,sy,now){ if(o&&o.lm){ const im=lmImage(o), s=.5, gx=im.ax+(o.w-o.h)/2*TW/2, gy=im.ay+(o.w+o.h)/2*TH/2;
    g.drawImage(im.cv,Math.round(sx+o.w*8-gx*s),Math.round(sy+o.h*16-gy*s),Math.round(im.cw*s),Math.round(im.ch*s)); return; }
  return _dObjL(g,o,sx,sy,now); };

// ---------- miudezas no chão (espadas fincadas, vidro, navio sob o gelo) ----------
const _sf=window.sceneryFloor;
window.sceneryFloor=function(g,toS,U0,V0,CK,FR){ if(_sf) _sf(g,toS,U0,V0,CK,FR); if(!ON()) return;
  const P=(a,b,w,h,c)=>{ g.fillStyle=c; g.fillRect(Math.round(a/FR),Math.round(b/FR),Math.max(1,Math.round(w/FR)),Math.max(1,Math.round(h/FR))); };
  const near=A=>A&&U0+CK>A.x-A.r-2&&U0<A.x+A.r+2&&V0+CK>A.y-A.r-2&&V0<A.y+A.r+2;
  const C=AREAS.campo, V=AREAS.vidro, N=AREAS.navio;
  if(near(C)) for(let y=V0;y<V0+CK;y++) for(let x=U0;x<U0+CK;x++){ const d=Math.hypot(x-C.x,(y-C.y)*1.2); if(d>C.r||!dry(x,y)) continue; const dens=d<C.r*.7?2:1;
    for(let n=0;n<dens;n++){ if(th(x,y,700+n)>.7) continue; const [sx,sy]=toS(x+.2+th(x,y,710+n)*.6,y+.2+th(x,y,720+n)*.6), tl=Math.round((th(x,y,730+n)-.5)*8), L=20+th(x,y,740+n)*12, rust=th(x,y,750+n)<.4;
      P(sx-3,sy,7,2,'rgba(20,16,10,.35)');
      for(let k=0;k<L;k++){ const xx=sx+Math.round(tl*k/L); P(xx,sy-k,2,1,k<2?'#4a3a2a':rust?'#8a5a3a':'#a8aeb6'); P(xx+1,sy-k,1,1,rust?'#6a4428':'#d8dce2'); }
      const gy=sy-L, gx=sx+tl; P(gx-5,gy,12,2,'#5a4a30'); P(gx,gy-8,2,8,'#3a2416'); P(gx-1,gy-10,4,3,'#b8963a'); } }
  if(near(V)) for(let y=V0;y<V0+CK;y++) for(let x=U0;x<U0+CK;x++){ const d=Math.hypot(x-V.x,y-V.y); if(d>V.r) continue; const [sx,sy]=toS(x+.5,y+.5), k=1-d/V.r;
    g.fillStyle=`rgba(150,220,235,${.18+k*.3})`; g.beginPath(); g.moveTo((sx)/FR,(sy-TH/2)/FR); g.lineTo((sx+TW/2)/FR,sy/FR); g.lineTo(sx/FR,(sy+TH/2)/FR); g.lineTo((sx-TW/2)/FR,sy/FR); g.fill();
    for(let n=0;n<4;n++){ const [ax,ay]=toS(x+th(x,y,760+n),y+th(x,y,770+n)); P(ax,ay,2+th(x,y,780+n)*5,1,th(x,y,790+n)<.5?'#e8fbff':'#9fd8e8'); P(ax+1,ay-1,1,1,'#ffffff'); } }
  if(near(N)) for(let y=V0;y<V0+CK;y++) for(let x=U0;x<U0+CK;x++){ if(map[idx(x,y)]!==TL.ICE) continue; const dx=(x-N.x)/N.r, dy=(y-N.y)/(N.r*.32); const e=dx*dx+dy*dy; if(e>1) continue;
    const [sx,sy]=toS(x+.5,y+.5); g.fillStyle=e>.8?'rgba(40,56,70,.55)':'rgba(70,84,96,.38)'; g.beginPath(); g.moveTo(sx/FR,(sy-TH/2)/FR); g.lineTo((sx+TW/2)/FR,sy/FR); g.lineTo(sx/FR,(sy+TH/2)/FR); g.lineTo((sx-TW/2)/FR,sy/FR); g.fill();
    if((x-N.x)%3===0) P(sx-10,sy,20,1,'rgba(40,30,24,.4)'); if(Math.abs(x-N.x+6)<1||Math.abs(x-N.x-5)<1) P(sx-2,sy-2,4,4,'rgba(30,24,20,.6)'); }
};

// ---------- monstros novos ----------
if(MONS.skeleton_knight){ MONS.cavaleiro_fantasma={...MONS.skeleton_knight, name:'Cavaleiro Fantasma', lvl:8, hp:[120,160], gold:[10,40], weight:0,
  look:{...(MONS.skeleton_knight.look||{}), skin:'#b8c8d8', hair:'#b8c8d8', jacket:'#8a9aac', jacketD:'#6a7a8c', pants:'#7a8a9c', boot:'#5a6a7c'}}; LOOT.mon_cavaleiro_fantasma=LOOT.mon_skeleton_knight||LOOT.mon_skeleton; }
if(MONS.boulder&&typeof BEAST!=='undefined'&&BEAST.boulder){ BEAST.glass={...BEAST.boulder, c:'#9fd6e6', e:'#ffffff'}; MONS.elemental_vidro={...MONS.boulder, name:'Elemental de Vidro', beast:'glass', lvl:9, hp:[150,200], weight:0, gold:[0,0], loot:[['vidro_raio',4],['gem',1]]}; LOOT.mon_elemental_vidro=LT(2,[['vidro_raio',5],['gem',1]],.9); }
ITEMS.vidro_raio={ name:'Vidro de Raio', stack:20, value:45 };
{ const c=document.createElement('canvas'); c.width=c.height=16; const g=c.getContext('2d'); g.fillStyle='#9fd6e6'; g.beginPath(); g.moveTo(8,1); g.lineTo(14,9); g.lineTo(8,15); g.lineTo(3,8); g.fill(); g.fillStyle='#e8fbff'; g.fillRect(7,4,2,6); g.fillStyle='#5a9ab0'; g.fillRect(9,9,3,3); try{ ICONS.vidro_raio=c.toDataURL(); }catch(e){} }
const ROOTS_LOOT=LT(4,[['heal_potion',4],['gem',3],['gold_ring',1],['silver_ring',2],['ruby_ring',1]].filter(e=>ITEMS[e[0]]),.95);
LOOT.veu_gruta=LT(5,[['gold_ring',2],['ruby_ring',1],['gem',4],['heal_potion',3],['silver_ingot',3]].filter(e=>ITEMS[e[0]]),.95);
LOOT.raizes=ROOTS_LOOT; LOOT.porao=LT(5,[['gem',3],['silver_ingot',3],['gold_ring',1],['heal_potion',2],['silver_necklace',1]].filter(e=>ITEMS[e[0]]),.95);
DG_MONS[3]=['spider','spider','zombie_rotting','wolf','goblin_shaman']; DG_MONS[4]=['frozen_zombie','skeleton_mage_ice','skeleton','frozen_zombie'];

// ---------- interiores (no mar do noroeste, longe da vista) ----------
function rewalk(x0,y0,w,h){ for(let y=y0;y<y0+h;y++) for(let x=x0;x<x0+w;x++) if(inB(x,y)){ const i=idx(x,y), t=map[i]; walk[i]=(t!==TL.WALL&&t!==TL.WINDOW&&t!==TL.FENCE&&t!==TL.WATER&&t!==TL.SEA&&t!==TL.CHASM&&!(objGrid[i]&&objGrid[i].solid))?1:0; } }
function buildRoots(R,back){ const c=carveCave(R,7311,[]); for(let y=R.y;y<R.y+R.h;y++) for(let x=R.x;x<R.x+R.w;x++){ const i=idx(x,y); if(map[i]!==TL.ROCK) map[i]=th(x,y,5)<.7?TL.DIRT:TL.FOREST; }
  for(let k=8;k<c.path.length;k+=14){ const [px,py]=c.path[k]; addObj({type:'brazier',x:R.x+px,y:R.y+py-3,solid:true}); }
  const [ex,ey]=c.end; addObj({type:'chest',x:ex,y:ey,solid:true,container:'raizes'});
  addObj({type:'stairs_up',x:c.start[0],y:c.start[1]-1,solid:true}); STAIRS.push({at:[c.start[0],c.start[1]-1],to:back,msg:'Você sobe pelas raízes e volta à luz verde do bosque.'}); return [c.start[0]+2,c.start[1]+1]; }
function buildHull(R,back){ const cx=R.x+R.w/2, cy=R.y+R.h/2, rx=R.w/2-2, ry=R.h/2-2;
  for(let y=R.y;y<R.y+R.h;y++) for(let x=R.x;x<R.x+R.w;x++){ const e=((x-cx)/rx)**2+((y-cy)/ry)**2, i=idx(x,y); fden[i]=0; reserved[i]=1;
    if(e<.8){ map[i]=TL.WOOD; } else if(e<1.12){ map[i]=TL.WALL; mat[i]=12; } else map[i]=TL.ROCK; }
  for(const [dx,dy,t] of [[-12,-2,'crate'],[-11,2,'keg'],[-6,-3,'keg'],[8,3,'crate'],[9,-2,'crate'],[2,3,'keg']]){ const x=Math.round(cx+dx), y=Math.round(cy+dy); addObj(t==='crate'?{type:'crate',x,y,solid:true,container:'crate'}:{type:t,x,y,solid:true}); }
  addObj({type:'chest',x:Math.round(cx+rx-5),y:Math.round(cy),solid:true,container:'porao'}); addObj({type:'diario',x:Math.round(cx+3),y:Math.round(cy-2),solid:true});
  for(const dx of [-8,0,8]) addObj({type:'brazier',x:Math.round(cx+dx),y:Math.round(cy+ry-3),solid:true});
  const sx=Math.round(cx-rx+4), sy=Math.round(cy); addObj({type:'stairs_up',x:sx,y:sy-1,solid:true}); STAIRS.push({at:[sx,sy-1],to:back,msg:'Você sobe pelo buraco no gelo. O vento corta o rosto.'}); return [sx+2,sy+1]; }

// ---------- montagem do mapa novo ----------
const ENTR={};
function dress(){ if(H>1280) for(let y=1290;y<H;y++) for(let x=0;x<W;x++){ if(inRect(DG.L1,x,y)||inRect(DG.L2,x,y)) continue; const i=idx(x,y); map[i]=TL.CHASM; fden[i]=0; reserved[i]=1; const o=objGrid[i]; if(o) removeObj(o); }
  LM.length=0; for(const k in AREAS) delete AREAS[k]; DG.more.length=0; for(const k in ENTR) delete ENTR[k];
  // Colosso do Peregrino: na borda da Baía do Colosso
  { const [tx,ty]=cellC('E19'); const p=spot(tx,ty,4,4,26,1,(x,y)=>{ const s=seaDist(x+2,y+2,12); return Math.abs(s-6)*4+Math.hypot(x-tx,y-ty)*.4; }); if(p) lm('colosso',p[0],p[1],4,4); }
  // Cachoeira do Véu: na cabeceira do grande rio
  { const [tx,ty]=cellC('O12'); let hd=null, bd=1e9; for(const rv of SW.rivers||[]) if(rv.kind!=='fjord'&&rv.kind!=='wadi') for(const q of [rv.pts[0],rv.pts[rv.pts.length-1]]){ const d=Math.hypot(q[0]-tx,q[1]-ty); if(d<bd){ bd=d; hd=q; } }
    if(hd&&bd<140){ const [hx,hy]=hd.map(Math.round);
      for(let y=hy-5;y<=hy+4;y++) for(let x=hx-5;x<=hx+5;x++){ if(((x-hx)/5)**2+((y-hy)/4)**2<1){ paint(x,y,TL.WATER); const o=objGrid[idx(x,y)]; if(o&&NATURE.has(o.type)) removeObj(o); } }
      const ox=hx-3, oy=hy-7; clearNature(ox-2,oy-3,ox+8,oy+3); for(let y=oy-3;y<oy;y++) for(let x=ox-1;x<ox+7;x++) paint(x,y,TL.ROCK);
      for(let y=oy;y<oy+2;y++) for(let x=ox;x<ox+6;x++) paint(x,y,TL.RUBBLE);
      lm('cachoeira',ox,oy,6,2);
      const cx=ox+5, cy=oy+2; for(let y=cy;y<cy+3;y++) for(let x=cx-1;x<cx+3;x++) paint(x,y,TL.RUBBLE);
      addObj({type:'chest',x:cx,y:cy,solid:true,container:'veu_gruta'}); } }
  // Oratório da Pobreza: na ilhota do Lago Espelho, com jangada
  { const [tx,ty]=cellC('G23'); let sx=0,sy=0,n=0; for(let y=ty-60;y<ty+60;y++) for(let x=tx-70;x<tx+70;x++) if(inB(x,y)&&map[idx(x,y)]===TL.WATER&&AREL(x,y)){ sx+=x; sy+=y; n++; }
    if(n){ const lx=Math.round(sx/n), ly=Math.round(sy/n); for(let y=ly-4;y<=ly+4;y++) for(let x=lx-5;x<=lx+5;x++) if(((x-lx)/5.2)**2+((y-ly)/4.2)**2<1){ paint(x,y,TL.GRASS); const o=objGrid[idx(x,y)]; if(o) removeObj(o); }
      lm('oratorio',lx-1,ly-2,2,3,{v:'pedra',voto:'pobreza'});
      let sh=null; for(let r=6;r<60&&!sh;r++) for(let a=0;a<24&&!sh;a++){ const x=Math.round(lx+Math.cos(a/24*6.283)*r), y=Math.round(ly+Math.sin(a/24*6.283)*r); if(dry(x,y)&&!objGrid[idx(x,y)]&&[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>map[idx(x+dx,y+dy)]===TL.WATER)) sh=[x,y]; }
      if(sh){ const a=addObj({type:'jangada',x:sh[0],y:sh[1],solid:true,lm:true}); LM.push(a); const b=addObj({type:'jangada',x:lx+2,y:ly+2,solid:true,lm:true}); LM.push(b);
        a.to=[lx+1,ly+2]; const land=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]].map(([dx,dy])=>[sh[0]+dx,sh[1]+dy]).find(([x,y])=>dry(x,y)&&!objGrid[idx(x,y)]); b.to=land||sh; } } }
  // Oratório da Obediência: no penhasco sobre o Fiorde do Jarl
  { const [tx,ty]=cellC('G5'); const p=spot(tx,ty,2,3,30,1,(x,y)=>{ const s=seaDist(x+1,y+1,10); return (s<3?50:Math.abs(s-4)*5)+Math.hypot(x-tx,y-ty)*.3; }); if(p) lm('oratorio',p[0],p[1],2,3,{v:'neve',voto:'obediencia'}); }
  // Oratório da Castidade: clareira na floresta, com fonte e o cervo branco
  { const [tx,ty]=cellC('J9'); const p=spot(tx,ty,2,3,20,2); if(p){ const [x,y]=p; clearNature(x-7,y-6,x+8,y+9); for(let yy=y-6;yy<=y+9;yy++) for(let xx=x-7;xx<=x+8;xx++) if(dry(xx,yy)&&((xx-x-1)/8)**2+((yy-y-1.5)/8)**2<1) paint(xx,yy,TL.GRASS);
      lm('oratorio',x,y,2,3,{v:'musgo',voto:'castidade'}); if(fits(x+3,y+4,2,2,0)) addObj({type:'fountain',x:x+3,y:y+4,w:2,h:2,solid:true}); ENTR.cervo=[x+4,y+1]; } }
  // Oratório da Coragem: espada na rocha no alto da duna
  { const [tx,ty]=cellC('AD28'); const p=spot(tx,ty,2,2,24,1); if(p) lm('espada_rocha',p[0],p[1],2,2,{voto:'coragem'}); }
  // Árvore-Mãe, com as raízes por dentro
  { const [tx,ty]=cellC('F12'); const p=spot(tx,ty,5,5,24,2); if(p){ const [x,y]=p; clearNature(x-9,y-9,x+13,y+13); for(let yy=y-8;yy<=y+12;yy++) for(let xx=x-8;xx<=x+12;xx++) if(dry(xx,yy)&&Math.hypot(xx-x-2.5,yy-y-2.5)<10) paint(xx,yy,th(xx,yy,3)<.8?TL.GRASS:TL.DIRT);
      const o=lm('arvore_mae',x,y,5,5); const R={...SLOT(0),w:64,h:34,lv:3,name:'Raízes da Árvore-Mãe',cap:5}; DG.more.push(R); o.enter=buildRoots(R,[x+2,y+6]); ENTR.druida=[x+6,y+5]; } }
  // Campo das Mil Espadas
  { const [tx,ty]=cellC('L26'); AREAS.campo={x:tx,y:ty,r:16}; for(let k=0;k<7;k++){ const a=k/7*6.283, x=Math.round(tx+Math.cos(a)*9), y=Math.round(ty+Math.sin(a)*8); if(dry(x,y)&&!objGrid[idx(x,y)]) addObj({type:k%3?'banner':'deadtree',x,y,solid:true,v:k%3}); } }
  // Mar de Vidro
  { const [tx,ty]=cellC('Z27'); AREAS.vidro={x:tx,y:ty,r:13}; for(let y=ty-13;y<=ty+13;y++) for(let x=tx-13;x<=tx+13;x++){ if(!inB(x,y)||Math.hypot(x-tx,y-ty)>13) continue; const o=objGrid[idx(x,y)]; if(o&&NATURE.has(o.type)) removeObj(o); if(map[idx(x,y)]===TL.ROCK||map[idx(x,y)]===TL.DIRT) paint(x,y,TL.DUNE); } }
  // Lago do Navio Congelado
  { let sx=0,sy=0,n=0; for(let y=100;y<260;y++) for(let x=330;x<560;x++){ if(AEL3(x,y)){ sx+=x; sy+=y; n++; } }
    if(n){ const cx=Math.round(sx/n), cy=Math.round(sy/n); AREAS.navio={x:cx,y:cy,r:14}; const hx=cx+2, hy=cy; const o=lm('mastro',hx,hy,1,1);
      const R={...SLOT(1),w:52,h:26,lv:4,name:'Porão do Navio Congelado',cap:4}; DG.more.push(R); o.enter=buildHull(R,[hx,hy+2]); } }
}
// máscara: lago espelho e lago congelado
const AREL=(x,y)=>{ try{ return window.AEL2_MASK&&ael2At(x,y)===2; }catch(e){ return false; } };
const AEL3=(x,y)=>{ try{ return window.AEL2_MASK&&ael2At(x,y)===3; }catch(e){ return false; } };
let MASKC=null; function ael2At(x,y){ if(!MASKC){ MASKC=new Uint8Array(1280*1280); let p=0; for(const r of AEL2_MASK.split('.')){ if(!r) continue; MASKC.fill(+r[0],p,p+parseInt(r.slice(1),36)); p+=parseInt(r.slice(1),36); } } return MASKC[y*1280+x]; }

const _bwL=buildWorld;
buildWorld=function(){ const r=_bwL.apply(this,arguments); LM.length=0; DG.more.length=0; for(const k in AREAS) delete AREAS[k];
  if(ON()){ try{ dress(); }catch(e){ console.warn('landmarks',e); } for(const f of DRESSX){ try{ f(); }catch(e){ console.warn('dress+',e); } }
    walk=new Uint8Array(N); for(let i=0;i<N;i++){ const t=map[i]; walk[i]=(t!==TL.WALL&&t!==TL.WINDOW&&t!==TL.FENCE&&t!==TL.WATER&&t!==TL.SEA&&t!==TL.CHASM&&!(objGrid[i]&&objGrid[i].solid))?1:0; }
    try{ buildMinimap(); if(H>1280){ const g=minimap.getContext('2d'); g.fillStyle='rgb(27,46,66)'; g.fillRect(0,1280,W,H-1280); } }catch(e){} }
  removedIds=new Set(); worldObjCount=nextObjId; objById=[]; for(const o of objs) objById[o.id]=o;
  return r; };

// ---------- druida e cervo branco (aparecem quando o mundo começa) ----------
function people(){ if(!ON()) return;
  if(ENTR.druida&&!npcs.some(n=>n.id===48001)){ const [x,y]=ENTR.druida, sp=openSpot(x*T+8,y*T+12,4)||[x*T+8,y*T+12];
    npcs.push({id:48001,role:'priest',name:'Druida Ébano',x:sp[0],y:sp[1],hx:sp[0],hy:sp[1],look:{sex:'m',skin:'#b8865a',hair:'#d8d4c8',style:'long',beard:1,jacket:'#3a5a2a',jacketD:'#24381a',pants:'#2a3a1a',boot:'#2a1e14',race:'humano'},
      face:'down',phase:0,moving:false,hp:999,max:999,weapon:null,state:'idle',t:0,cd:0,wind:0,swingT:0,hurtT:0,alive:true,path:null,pathT:0,dead:false,post:true}); }
  if(ENTR.cervo&&ANIMALS.deer&&!animals.some(a=>a.sacred)){ const [x,y]=ENTR.cervo; animals.push({kind:'deer',name:'Cervo Branco',col:'#f2efe6',sacred:true,x:x*T+8,y:y*T+12,hp:ANIMALS.deer.hp*4,face:1,phase:0,moving:false,state:'wander',t:2,vx:0,vy:0,hurtT:0,cd:0}); } }
const _eg=enterGame; enterGame=function(){ const r=_eg.apply(this,arguments); try{ people(); }catch(e){} return r; };

// ---------- interações ----------
const VOTOS=[['pobreza','Pobreza'],['obediencia','Obediência'],['castidade','Castidade'],['coragem','Coragem']];
Object.assign(OBJ_NAMES,{colosso:'Colosso do Peregrino',cachoeira:'Cachoeira do Véu',oratorio:'Oratório',espada_rocha:'Espada na Rocha',arvore_mae:'Árvore-Mãe',mastro:'Mastro preso no gelo',jangada:'Jangada',diario:'Diário de bordo'});
for(const t of ['colosso','cachoeira','oratorio','espada_rocha','arvore_mae','mastro','jangada','diario']) ACT_TYPES.add(t);
const today=k=>{ player.lmd=player.lmd||{}; if(player.lmd[k]===day) return false; player.lmd[k]=day; return true; };
const bless=(stats,dur)=>{ player.sb=player.sb||{}; for(const [k,v] of Object.entries(stats)) player.sb[k]=[v,dur]; try{ recalcGear(); }catch(e){} };
function votosTxt(){ const v=player.votos||{}; const t=VOTOS.filter(([k])=>v[k]).map(([,n])=>n); return `Selos dos Quatro Votos: ${t.length}/4${t.length?' ('+t.join(', ')+')':''}`; }
function grantVoto(k,nome){ player.votos=player.votos||{}; if(player.votos[k]){ toast(`Você já tem o Selo da ${nome}.`); return; }
  player.votos[k]=day; toast(`Você recebe o Selo da ${nome}. ${votosTxt()}.`); try{ Journal.add('system','',`Selo da ${nome} recebido.`); }catch(e){}
  if(VOTOS.every(([q])=>player.votos[q])&&!player.votosOk){ player.votosOk=1; perm(); toast('Os Quatro Votos estão completos! Você agora é Peregrino dos Quatro Votos: +5 em força, destreza e inteligência para sempre.'); try{ sfx&&sfx('level'); }catch(e){} } }
function perm(){ try{ recalcGear(); }catch(e){} }
const _rgL=recalcGear; recalcGear=function(){ _rgL(); if(player&&player.votosOk&&player.gb) for(const k of ['str','dex','int']) player.gb[k]=(player.gb[k]||0)+5; };
window.LMK={cellC,dry,fits,spot,lm,clearNature,paint,SZ,AREAS,ANIMX,DRESSX,ON,night,NATURE,wet,rewalk,STONE,ROCKG,ROCKD,SANDR,SNOWR,crossOnFace,crossOnFaceU,grime,fire,bless,today,SLOT};
const _udL=useDevice;
useDevice=function(o){ if(!o||!ACT_TYPES.has(o.type)) return _udL(o);
  if(o.type==='jangada'){ if(!o.to){ toast('A jangada está presa na margem.'); return; } player.x=o.to[0]*T+8; player.y=o.to[1]*T+12; toast('Você empurra a jangada com a vara pela água parada do lago.'); return; }
  if(o.type==='colosso'){ openActions('Colosso do Peregrino',[[ 'Um cavaleiro de pedra, espada erguida, braseiro aceso na mão: a luz que guia os barcos para a baía.',null],
      ['Ajoelhar-se aos pés do Colosso',()=>{ if(!today('colosso')){ toast('Você já recebeu a bênção do Peregrino hoje.'); return; } bless({str:10,dex:10,armor_flat:10},900); if(!player.peregrino){ player.peregrino=1; toast('Bênção do Peregrino (+10 força, +10 destreza, +10 armadura por um tempo). Título: Peregrino da Baía.'); } else toast('Bênção do Peregrino: +10 força, +10 destreza e +10 armadura por um tempo.'); }],['Fechar',null]]); return; }
  if(o.type==='cachoeira'){ openActions('Cachoeira do Véu',[[ 'A água cai do paredão como um véu de linho. Na névoa, a luz faz arco-íris.',null],
      ['Descansar na névoa',()=>{ if(!today('veu')){ toast('Você já descansou aqui hoje.'); return; } player.health=player.maxHealth; player.stamina=100; bless({res_fire:15,res_cold:15,res_poison:15},900); toast('A névoa fresca lava o cansaço. Vida e fôlego cheios; resistências maiores por um tempo.'); }],['Fechar',null]]); return; }
  if(o.type==='oratorio'||o.type==='espada_rocha'){ const k=o.voto, nome=(VOTOS.find(v=>v[0]===k)||[,'?'])[1];
    const txt={pobreza:'Capela de pedra numa ilhota. Nada aqui é de valor, e tudo parece bastar.',obediencia:'O sino toca sozinho com o vento do fiorde, como quem chama para a oração.',castidade:'Musgo, uma fonte limpa e um silêncio branco como o cervo que pasta por perto.',coragem:'Uma espada cravada na rocha, cercada pelos ossos de quem não a soltou.'}[k];
    const acts=[[txt,null],[votosTxt(),null]];
    if(k==='coragem') acts.push(['Tentar tirar a espada',()=>{ grantVoto(k,nome); toast('A espada não se move… mas a sua coragem foi vista.'); bless({dmg_pct:15},900); }]);
    else acts.push(['Rezar no oratório',()=>{ grantVoto(k,nome); bless(k==='pobreza'?{int:10}:k==='obediencia'?{armor_flat:12}:{dex:10},900); }]);
    acts.push(['Fechar',null]); openActions(OBJ_NAMES[o.type]==='Oratório'?`Oratório da ${nome}`:OBJ_NAMES[o.type],acts); return; }
  if(o.type==='arvore_mae'){ openActions('Árvore-Mãe',[[ 'Um carvalho do tamanho de um castelo. Entre as raízes, uma luz verde respira.',null],['Entrar nas raízes',()=>{ if(!o.enter) return; player.x=o.enter[0]*T+8; player.y=o.enter[1]*T+12; search=null; toast('Você desce entre as raízes. O ar cheira a terra molhada e a luz verde pulsa nas paredes.'); }],['Fechar',null]]); return; }
  if(o.type==='mastro'){ openActions('Navio preso no gelo',[[ 'Um mastro quebrado sai do gelo. Lá embaixo, a sombra de um casco inteiro.',null],['Quebrar o gelo e descer ao porão',()=>{ if(!o.enter) return; player.x=o.enter[0]*T+8; player.y=o.enter[1]*T+12; search=null; toast('Você quebra o gelo e desce pela escotilha. Tudo range de frio.'); }],['Fechar',null]]); return; }
  if(o.type==='diario'&&o.text){ openActions(o.title||'Livro',[[o.text,null],['Fechar',null]]); if(o.onRead) try{ o.onRead(); }catch(e){} return; }
  if(o.type==='diario'){ openActions('Diário de bordo',[[ '"Dia 41. O mar virou lago e o lago virou pedra. O capitão diz que é castigo por termos zombado do Peregrino da baía. Ninguém mais ri. Se alguém ler isto: a carga está no fundo do porão. Que Deus tenha piedade."',null],['Fechar',null]]); return; }
  return _udL(o); };

// ---------- eventos: fantasmas no campo à noite, elementais no vidro ----------
let evT=0;
const _updL=update;
update=function(dt){ _updL(dt); if(!running||!player||!ON()) return; evT-=dt; if(evT>0) return; evT=2;
  const px=player.x/T, py=player.y/T, C=AREAS.campo, V=AREAS.vidro;
  if(C&&MONS.cavaleiro_fantasma&&night()&&Math.hypot(px-C.x,py-C.y)<C.r+6){ const n=raiders.filter(r=>r.mon==='cavaleiro_fantasma').length; if(n<5){ const a=Math.random()*6.283; const r=spawnAt('cavaleiro_fantasma',(C.x+Math.cos(a)*C.r*.6)*T,(C.y+Math.sin(a)*C.r*.6)*T,{state:'chase',foe:player}); if(r&&n===0) toast('A névoa se levanta entre as espadas… cavaleiros pálidos se erguem do campo.'); } }
  if(V&&MONS.elemental_vidro&&Math.hypot(px-V.x,py-V.y)<V.r+4){ const n=raiders.filter(r=>r.mon==='elemental_vidro').length; if(n<3){ const a=Math.random()*6.283; spawnAt('elemental_vidro',(V.x+Math.cos(a)*V.r*.5)*T,(V.y+Math.sin(a)*V.r*.5)*T); } } };
// espada lendária: rara nos cavaleiros fantasmas
const _krL=killRaider;
killRaider=function(r,...a){ const res=_krL(r,...a); try{ if(r&&r.mon==='cavaleiro_fantasma'&&Math.random()<.04){ lootLevel=70; lootLuck=60; addItem(rpick(['longsword','broadsword','bastard_sword'].filter(k=>ITEMS[k]))||'longsword',1); lootLevel=0; lootLuck=0; toast('Entre os ossos do cavaleiro, uma espada antiga brilha: lendária!'); } }catch(e){} return res; };

// ---------- save ----------
const _serL2=serialize; serialize=function(){ const s=_serL2(); if(player){ s.votos=player.votos||null; s.votosOk=player.votosOk||0; s.peregrino=player.peregrino||0; s.lmd=player.lmd||null; } return s; };
const _asL2=applySave; applySave=function(s){ _asL2(s); player.votos=s.votos||null; player.votosOk=s.votosOk||0; player.peregrino=s.peregrino||0; player.lmd=s.lmd||null; perm(); };
})();

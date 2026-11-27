// ===================================================================================================
// LOTE 6 — "DAWN": animação procedural e efeitos de combate/magia no estilo 9th Dawn (câmera isométrica)
//  · respiração, pulinho/gingado ao andar, sombra que encolhe no pulo, poeira nos pés, galope montado
//  · corpo a corpo: preparo → investida → arco de corte com faíscas, knockback com mola, números de dano,
//    rótulos de crítico/bloqueio/esquiva e morte com cambalhota + fade
//  · arco: inclinação ao atirar, flecha com rastro e estouro no impacto
//  · magias: círculo rúnico sob o conjurador + efeito próprio para cada uma das 64 magias (tabela MAP)
// Só desenha — não muda dano, alcance, tempo de recarga, salvamento nem IA. Desliga com DAWN.on=false.
// O iso.js chama DAWN.begin/ground/pose/air dentro de isoRenderFrame (respeita elevação e ordem do lote5).
// ===================================================================================================
(function(){
'use strict';
const EN = window.LANG==='en';
const L = EN ? {crit:'CRITICAL!', block:'BLOCK!', dodge:'DODGE!', frozen:'FROZEN', miss:'FIZZLE'} : {crit:'CRÍTICO!', block:'BLOQUEIO!', dodge:'ESQUIVA!', frozen:'CONGELADO', miss:'FALHOU'};
const MOB = (window.matchMedia&&matchMedia('(pointer:coarse)').matches)||Math.min(innerWidth,innerHeight)<500;
const TWd=48, THd=24, TT=16, SCLd=2, TAU=Math.PI*2;
const D = window.DAWN = { on:true, parts:[], fx:[], nums:[], dead:[], st:new WeakMap(), track:new Map(),
  PCAP: MOB?220:560, FXCAP: MOB?40:90, NCAP: MOB?14:28, stats:{casts:{}, fx:{}, impacts:0, nums:0, deaths:0, arrows:0, slashes:0, puffs:0}, errs:0 };
const clamp=(v,a,b)=>v<a?a:v>b?b:v, lerp=(a,b,t)=>a+(b-a)*t, seg=(t,a,b)=>clamp((t-a)/(b-a),0,1);
const eOut=t=>1-Math.pow(1-t,3), eIO=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
const hh=n=>{ const s=Math.sin(n*127.1+311.7)*43758.5453; return s-Math.floor(s); };
const now=()=>performance.now()/1000;
const isoActive=()=>D.on && typeof isoOn==='function' && isoOn() && typeof running!=='undefined' && running;
// direção de tela (unitária) de um ângulo do mundo
function sdir(a){ const c=Math.cos(a), s=Math.sin(a), x=(c-s)*TWd/2, y=(c+s)*THd/2, l=Math.hypot(x,y)||1; return [x/l,y/l]; }
let W2S_=null, EPX_=null, BW=0, BH=0, lastT=0, DT=0;
const ep=(x,y)=>{ try{ return EPX_?EPX_({x,y}):0; }catch(e){ return 0; } };
function P(x,y,z,e){ const s=W2S_(x,y); return [s[0], s[1]-(e!=null?e:ep(x,y))-(z||0)]; }

// ---------- brilhos em cache (sem gradiente novo por partícula) ----------
const GC=new Map();
function glowImg(col){ let c=GC.get(col); if(c) return c; c=document.createElement('canvas'); c.width=c.height=64; const q=c.getContext('2d'), gr=q.createRadialGradient(32,32,0,32,32,32);
  gr.addColorStop(0,col); gr.addColorStop(.35,col+'aa'); gr.addColorStop(1,col+'00'); q.fillStyle=gr; q.fillRect(0,0,64,64); GC.set(col,c); return c; }
function glow(g,X,Y,r,col,a){ if(!(a>0)||r<=0) return; g.globalAlpha=Math.min(1,a); g.drawImage(glowImg(col),X-r,Y-r,r*2,r*2); g.globalAlpha=1; }
function addMode(g,on){ g.globalCompositeOperation=on?'lighter':'source-over'; }

// ---------- partículas ----------
function part(o){ if(D.parts.length>=D.PCAP) D.parts.splice(0,D.parts.length-D.PCAP+1); o.t=0; o.e=o.e!=null?o.e:ep(o.x,o.y); D.parts.push(o); return o; }
function burst(x,y,z,n,o){ n=Math.round(n*(MOB?.6:1)); for(let i=0;i<n;i++){ const a=(o.a0!=null?o.a0+(Math.random()-.5)*(o.spread||TAU):Math.random()*TAU), sp=(o.sp||40)*(.35+.65*Math.random());
    part({x,y,z:z||0,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp*.9,vz:(o.up||30)*(.3+Math.random()),g:o.g!=null?o.g:120,life:(o.life||.5)*(.6+.4*Math.random()),col:o.cols[i%o.cols.length],s:o.s||1.5,add:o.add!==false,k:o.k||'sq'}); } }
function puff(x,y,size,col){ D.stats.puffs++; for(let i=0;i<(MOB?2:3);i++){ const a=Math.random()*TAU; part({x:x+Math.cos(a)*2,y:y+Math.sin(a)*1.5,z:1,vx:Math.cos(a)*(6+size*2),vy:Math.sin(a)*(4+size),vz:4+Math.random()*6,g:0,life:.45+Math.random()*.25,col:col||'#bba47e',s:size*(.7+Math.random()*.5),add:false,k:'puff'}); } }
function embers(x,y,n,cols,w){ for(let i=0;i<n;i++) part({x:x+(Math.random()-.5)*(w||16),y:y+(Math.random()-.5)*(w||16)*.5,z:2+Math.random()*6,vx:(Math.random()-.5)*8,vy:(Math.random()-.5)*4,vz:18+Math.random()*30,g:-6,life:.7+Math.random()*.7,col:cols[i%cols.length],s:1.2+Math.random(),add:true,k:'sq'}); }
function updParts(dt){ const P_=D.parts; for(let i=P_.length-1;i>=0;i--){ const p=P_[i]; p.t+=dt; if(p.t>=p.life){ P_.splice(i,1); continue; }
    p.x+=p.vx*dt; p.y+=p.vy*dt; p.vz-=p.g*dt; p.z+=p.vz*dt; if(p.z<0){ p.z=0; p.vz*=-.3; p.vx*=.6; p.vy*=.6; } if(p.k==='puff'){ p.vx*=.92; p.vy*=.92; p.vz*=.9; } } }
function drawParts(g,ground){ for(const p of D.parts){ if((p.k==='puff')!==ground) continue; const [X,Y]=P(p.x,p.y,p.z,p.e), f=1-p.t/p.life;
    if(X<-20||X>BW+20||Y<-40||Y>BH+40) continue;
    if(p.k==='puff'){ g.globalAlpha=.42*f; g.fillStyle=p.col; const r=p.s*(1+p.t*2.2); g.beginPath(); g.ellipse(X,Y,r,r*.6,0,0,TAU); g.fill(); continue; }
    addMode(g,p.add); g.globalAlpha=f; g.fillStyle=p.col; const s=p.s*(.45+.55*f);
    if(p.k==='shard'){ g.beginPath(); g.moveTo(X,Y-s*2); g.lineTo(X+s,Y); g.lineTo(X,Y+s*2); g.lineTo(X-s,Y); g.fill(); }
    else if(p.k==='plus'){ g.fillRect(X-.5,Y-s*1.6,1.2,s*3.2); g.fillRect(X-s*1.6,Y-.5,s*3.2,1.2); }
    else g.fillRect(X-s/2,Y-s/2,s,s); }
  g.globalAlpha=1; addMode(g,false); }

// ---------- efeitos com duração (desenhados em espaço de tela) ----------
function fx(lay,dur,f,kind){ if(D.fx.length>=D.FXCAP) D.fx.shift(); const o={lay,t0:now(),dur,f}; D.fx.push(o); if(kind) D.stats.fx[kind]=(D.stats.fx[kind]||0)+1; return o; }
function ringG(g,X,Y,r,col,a,lw){ if(!(a>0)||r<=0) return; addMode(g,true); g.globalAlpha=Math.min(1,a); g.strokeStyle=col; g.lineWidth=lw||1.5; g.beginPath(); g.ellipse(X,Y,r,r*.5,0,0,TAU); g.stroke(); g.globalAlpha=1; addMode(g,false); }
function bolt(g,X0,Y0,X1,Y1,seed,col,w,amp){ const n=9, pts=[[X0,Y0]], nx=-(Y1-Y0), ny=X1-X0, l=Math.hypot(nx,ny)||1;
  for(let i=1;i<n;i++){ const u=i/n, o=(hh(seed+i*7.3)-.5)*(amp||22)*Math.sin(u*Math.PI); pts.push([lerp(X0,X1,u)+nx/l*o, lerp(Y0,Y1,u)+ny/l*o]); } pts.push([X1,Y1]);
  addMode(g,true); g.lineJoin='round'; g.lineCap='round';
  for(const [lw,c,a] of [[w*4,col,.2],[w*1.8,col,.6],[Math.max(.8,w*.6),'#ffffff',1]]){ g.strokeStyle=c; g.globalAlpha=a; g.lineWidth=lw; g.beginPath(); pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1])); g.stroke(); }
  for(let b=0;b<2;b++){ const i=2+Math.floor(hh(seed+b*13)*(n-4)), p=pts[i]; let x=p[0], y=p[1]; g.strokeStyle=col; g.globalAlpha=.6; g.lineWidth=Math.max(.7,w*.5); g.beginPath(); g.moveTo(x,y);
    for(let k=0;k<3;k++){ x+=(hh(seed+b*5+k)-.5)*16; y+=4+hh(seed+b*9+k)*6; g.lineTo(x,y); } g.stroke(); }
  g.globalAlpha=1; addMode(g,false); }
function runes(g,X,Y,R,col,a,t){ if(!(a>0)) return; g.save(); g.translate(X,Y); g.scale(1,.5); addMode(g,true); g.globalAlpha=a; glow(g,0,0,R*1.5,col,.45*a); g.globalAlpha=a;
  g.strokeStyle=col; g.lineWidth=1.6; g.beginPath(); g.arc(0,0,R,0,TAU); g.stroke(); g.lineWidth=.8; g.beginPath(); g.arc(0,0,R*.76,0,TAU); g.stroke();
  g.rotate(t*1.7); g.fillStyle=col; for(let i=0;i<8;i++){ g.save(); g.rotate(i*TAU/8); g.translate(R*.88,0); g.rotate(Math.PI/2); g.beginPath(); if(i%2){ g.moveTo(-2,-3); g.lineTo(2,-3); g.lineTo(0,3); } else { g.rect(-.7,-3.5,1.4,7); g.rect(-3,-1,6,1.4); } g.fill(); g.restore(); }
  g.rotate(-t*3.4); g.lineWidth=1; g.beginPath(); for(let i=0;i<=6;i++){ const an=i*TAU/6*2; i?g.lineTo(Math.cos(an)*R*.72,Math.sin(an)*R*.72):g.moveTo(Math.cos(an)*R*.72,Math.sin(an)*R*.72); } g.stroke();
  g.restore(); g.globalAlpha=1; addMode(g,false); }
function pillar(g,X,Y,w,h,col,a){ if(!(a>0)) return; addMode(g,true); const gr=g.createLinearGradient(X-w,0,X+w,0); gr.addColorStop(0,col+'00'); gr.addColorStop(.5,col); gr.addColorStop(1,col+'00');
  g.globalAlpha=.75*a; g.fillStyle=gr; g.fillRect(X-w,Y-h,w*2,h); g.globalAlpha=.85*a; g.fillStyle='#fffbe8'; g.fillRect(X-w*.12,Y-h,w*.24,h); g.globalAlpha=1; addMode(g,false); }
function shakeK(k){ try{ if(typeof OPTS==='undefined'||OPTS.shake!==false) shake=Math.max(shake||0,k); }catch(e){} }

// ---------- números flutuantes ----------
function num(x,y,txt,col,big,z){ if(D.nums.length>=D.NCAP) D.nums.shift(); D.nums.push({x,y,z:z||30,txt:String(txt),col,big,t0:now(),j:(Math.random()-.5)*8}); D.stats.nums++; }
function drawNums(g){ const t=now(); g.textAlign='center'; g.textBaseline='middle'; g.lineJoin='round';
  for(let i=D.nums.length-1;i>=0;i--){ const n=D.nums[i], a=t-n.t0; if(a>1.15){ D.nums.splice(i,1); continue; }
    const pop=a<.09?lerp(.5,1.35,a/.09):lerp(1.35,1,seg(a,.09,.22)), [X,Y]=P(n.x,n.y,n.z+22*eOut(seg(a,0,1))); g.save(); g.translate(Math.round(X+n.j+Math.sin(a*3)*2),Math.round(Y)); g.scale(pop,pop);
    g.globalAlpha=1-seg(a,.75,1.15); g.font=`bold ${n.big?13:10}px Georgia, serif`; g.lineWidth=3; g.strokeStyle='#1a0d05'; g.strokeText(n.txt,0,0); g.fillStyle=n.col; g.fillText(n.txt,0,0); g.restore(); } }

// ---------- pose procedural por personagem ----------
const FACE_SIGN={left:-1,right:1,down:0,up:0};
D.pose=function(e,k){ let s=D.st.get(e); const t=now();
  if(!s){ s={ph:0,lx:e.x,ly:e.y,seed:Math.random()*9,hitT:-9,hitA:0,atkT:-9,atkA:0,shotT:-9,amp:0,lt:t,sw:0,wd:0}; D.st.set(e,s); }
  const dt=clamp(t-s.lt,0,.1); s.lt=t; const dist=Math.hypot(e.x-s.lx,e.y-s.ly); s.lx=e.x; s.ly=e.y; s.face=e.face;
  const mounted=k==='p'&&!!player.mount, beast=k==='a', moving=dist>.04&&dist<24;
  if(moving){ const pr=s.ph; s.ph+=dist*(mounted?.5:beast?.42:.36); s.amp=Math.min(1,s.amp+dt*9);
    if(Math.floor(s.ph/Math.PI)!==Math.floor(pr/Math.PI)){ if(mounted){ puff(e.x-Math.cos(s.ph)*2,e.y+1,3.2,'#b89d70'); if(Math.random()<.6) puff(e.x,e.y+1,2.4,'#c9b28a'); } else if(!(e.mon&&MONS[e.mon]&&MONS[e.mon].ghost)) puff(e.x,e.y+1,beast?1.6:1.9); } }
  else s.amp=Math.max(0,s.amp-dt*6);
  const A=s.amp, sn=Math.sin(s.ph); let hop=0, rot=0, sx=1, sy=1, dx=0, dy=0;
  if(mounted){ hop=Math.abs(sn)*3.2*A; rot=Math.sin(s.ph+.6)*.05*A*(FACE_SIGN[e.face]||0||.5); }
  else { hop=Math.abs(sn)*(beast?2:3.4)*A; rot=sn*(beast?.05:.122)*A; const land=1-Math.abs(sn); sy=1-.05*land*land*A; sx=1+.04*land*land*A; }
  const frozen=s.frozenT>t;
  if(!frozen){ const b=Math.sin(t*2.6+s.seed)*(1-A); sy*=1+.02*b; sx*=1-.012*b; }
  // ataque do jogador: preparo → investida → volta
  const aa=t-s.atkT; if(aa>=0&&aa<.32){ const u=aa/.32, d_=sdir(s.atkA); let off;
    if(u<.28){ off=-2*eOut(u/.28); sx*=1+.06*(u/.28); sy*=1-.05*(u/.28); } else if(u<.55){ const v=(u-.28)/.27; off=lerp(-2,6,eOut(v)); sx*=1.1-.04*v; sy*=.93+.03*v; } else off=6*(1-eIO((u-.55)/.45));
    dx+=d_[0]*off; dy+=d_[1]*off; }
  // inimigos: preparo (wind) e golpe (swingT)
  if(k!=='p'){ if(e.wind>0){ const d_=sdir(e.aimAng||0); dx-=d_[0]*1.8; dy-=d_[1]*1.8; sx*=1.05; sy*=.96; if(s.wd<=0) s.wdT=t; }
    if(e.swingT>0){ const u=1-clamp(e.swingT/.2,0,1), d_=sdir(e.aimAng||0), off=Math.sin(u*Math.PI)*5; dx+=d_[0]*off; dy+=d_[1]*off; sx*=1.06; sy*=.95;
      if(s.sw<=0){ slashFx(e,e.aimAng||0,'#ff9a8a',14,true); } }
    s.sw=e.swingT||0; s.wd=e.wind||0; }
  // tiro com arco: recua e inclina para trás
  const sa=t-s.shotT; if(sa>=0&&sa<.3){ const d_=sdir(s.shotA||0); rot+=-(d_[0]>=0?1:-1)*.12*Math.sin(Math.PI*sa/.3); dx-=d_[0]*1.5*Math.sin(Math.PI*sa/.3); }
  // golpe recebido: empurrão com mola + squash
  const ha=t-s.hitT; if(ha>=0&&ha<.55){ const d_=sdir(s.hitA), kb=5*eOut(seg(ha,0,.1))*(1-eIO(seg(ha,.12,.55))); dx+=d_[0]*kb; dy+=d_[1]*kb; const q=.2*Math.exp(-ha*9)*Math.cos(ha*30); sx*=1-q; sy*=1+q; }
  if(frozen){ s.tint=1; }
  const r={dx,dy,hop,rot,sx,sy,sh:clamp(1-hop/12,.55,1)}; s.last=r; return r; };
D.scr=(x,y,z)=>{ if(!W2S_||!BW) return null; const q=P(x,y,z||0), c=document.getElementById('game'), k=c?c.clientWidth/BW:1; return [Math.round(q[0]*k),Math.round(q[1]*k)]; }; // posição na tela (testes)
D.lastPose=e=>{ const s=D.st.get(e); return s&&s.last||null; };

// ---------- golpes ----------
function weapCol(id){ const k=String(id||''); if(/axe|machad|cleaver|hatchet|mace|hammer|club|maul|flail/.test(k)) return '#ffc080'; if(/spear|lanc|halberd|pike/.test(k)) return '#e8f0ff'; return '#d8ecff'; }
function slashFx(e,ang,col,R,enemy){ D.stats.slashes++; const x=e.x, y=e.y, e0=ep(x,y), d=sdir(ang), base=Math.atan2(d[1],d[0]);
  fx('a',.26,(g,a)=>{ const [X,Y]=P(x,y,16,e0), u=eOut(clamp(a/.13,0,1)), fade=1-seg(a,.1,.26), a0=base-1.25, a1=base+1.25, en=a0+(a1-a0)*u, st=a0+(a1-a0)*Math.max(0,u-.8);
    addMode(g,true); const N=12; for(let i=0;i<N;i++){ const u0=i/N, u1=(i+1)/N, b0=st+(en-st)*u0, b1=st+(en-st)*u1; g.beginPath(); g.ellipse(X,Y,R,R*.62,0,b0,b1); g.ellipse(X,Y,R-1.5-5*u1,(R-1.5-5*u1)*.62,0,b1,b0,true); g.closePath();
      g.globalAlpha=fade*(.15+.85*u1); g.fillStyle=i>N-3?'#ffffff':col; g.fill(); }
    g.globalAlpha=1; addMode(g,false); }, enemy?'slash_inimigo':'slash'); }
function hitFx(e,ang,dmg,crit,k){ const s=D.st.get(e); if(s){ s.hitT=now(); s.hitA=ang||0; } const x=e.x, y=e.y, big=crit||dmg>=25;
  burst(x,y,14,big?16:10,{sp:big?70:50,up:40,g:160,life:.4,cols:['#fff6c8','#ffd060','#ff9030'],s:1.6});
  const e0=ep(x,y); fx('a',.16,(g,a)=>{ const [X,Y]=P(x,y,14,e0); addMode(g,true); glow(g,X,Y,big?22:15,'#fff2c8',1-a/.16); addMode(g,false); },'hit');
  if(big) shakeK(crit?5:2.5); }

// ---------- projéteis (todos: do jogador, de monstros, flechas) ----------
const KIND_BY_EL={fire:'fire',cold:'ice',frost:'ice',energy:'energy',poison:'poison',physical:'force',arrow:'arrow',spit:'spit',holy:'holy'};
const PCOL={fire:'#ff8a2a',ice:'#9fe8ff',energy:'#b8a0ff',poison:'#8ad040',force:'#f0ead8',arrow:'#c8a870',spit:'#c8e040',holy:'#ffe890'};
function projView(p,tr){ const vx=p.vx||0, vy=p.vy||0, sx=(vx-vy)*TWd/2/TT, sy=(vx+vy)*THd/2/TT; return Math.atan2(sy,sx); }
function trackProjs(){ if(typeof projs==='undefined') return; const live=new Set(projs);
  for(const p of projs){ if(!D.track.has(p)){ const kind=(p.dawn&&p.dawn.kind)||KIND_BY_EL[p.el]||'energy'; D.track.set(p,{kind,tag:p.dawn||null,lx:p.x,ly:p.y,t0:now(),src:p.owner==='player'?player:null}); if(kind==='arrow') D.stats.arrows++; } const tr=D.track.get(p); tr.lx=p.x; tr.ly=p.y; tr.p=p; }
  for(const [p,tr] of D.track){ if(live.has(p)) continue; D.track.delete(p); impact(tr); } }
function impact(tr){ D.stats.impacts++; const x=tr.lx, y=tr.ly+10, k=tr.kind, tg=tr.tag||{}, c=tg.circle||(tr.p&&tr.p.big?5:2), I=.7+c*.13, col=PCOL[k]||'#fff', e0=ep(x,y);
  const ringFx=(colr,R,dur)=>fx('g',dur,(g,a)=>{ const [X,Y]=P(x,y,0,e0); ringG(g,X,Y,4+R*eOut(a/dur),colr,1-a/dur,2); });
  const flash=(colr,R,dur)=>fx('a',dur,(g,a)=>{ const [X,Y]=P(x,y,12,e0); addMode(g,true); glow(g,X,Y,R,colr,1-a/dur); addMode(g,false); });
  if(k==='fire'){ burst(x,y,12,12*I,{sp:60*I,up:50,g:140,life:.55,cols:['#fff0a0','#ffb040','#ff5a10'],s:1.8}); flash('#ff9a3a',24*I,.3); ringFx('#ffa040',22*I,.4); embers(x,y,6*I,['#ff8a2a','#ffd060'],14*I); for(let i=0;i<2+c/2;i++) puff(x+(Math.random()-.5)*8,y,2.5+c*.3,'#4a3c30'); if(c>=5) shakeK(3+c*.4); }
  else if(k==='ice'){ burst(x,y,12,12*I,{sp:55*I,up:40,g:180,life:.55,cols:['#ffffff','#bff4ff','#6fd8ff'],s:2,k:'shard'}); flash('#9fe8ff',18*I,.28); ringFx('#bff4ff',16*I,.35); if(c>=3) freezeNear(x,y,c); }
  else if(k==='energy'){ burst(x,y,12,12*I,{sp:70*I,up:40,g:120,life:.45,cols:['#ffffff','#d8c8ff','#9fd8ff'],s:1.5}); flash('#c8b8ff',20*I,.25); ringFx('#b8a0ff',18*I,.3);
    if(tg.id==='storm_nail'||tg.id==='glass_bolt'||(c>=4&&!tg.id)){ const seed=Math.random()*99; fx('a',.3,(g,a)=>{ const [X,Y]=P(x,y,14,e0), fl=Math.floor(a*40); bolt(g,X+(hh(fl+seed)-.5)*4,Y-130,X,Y,seed+fl,tg.id==='glass_bolt'?'#d8f4ff':'#9fd8ff',1.6+c*.12,26); addMode(g,true); glow(g,X,Y,28,'#bfe6ff',1-a/.3); addMode(g,false); },'raio_ceu'); shakeK(3+c*.5); }
    if(tg.id==='nail_chain'){ let prev=[x,y]; const used=new Set(); for(let j=0;j<3;j++){ let best=null, bd=1e9; for(const r of raiders){ if(used.has(r)) continue; const d=Math.hypot(r.x-prev[0],r.y-prev[1]); if(d<6*TT&&d<bd&&d>2){ bd=d; best=r; } } if(!best) break; used.add(best);
      const a0=prev.slice(), b0=[best.x,best.y], dl=j*.08, seed=Math.random()*99; fx('a',.3+dl,(g,a)=>{ if(a<dl) return; const [X0,Y0]=P(a0[0],a0[1],14), [X1,Y1]=P(b0[0],b0[1],14); bolt(g,X0,Y0,X1,Y1,seed+Math.floor(a*40),'#b8a0ff',1.4,14); },'corrente'); prev=b0; } } }
  else if(k==='poison'||k==='spit'){ burst(x,y,10,10*I,{sp:45,up:35,g:160,life:.5,cols:['#b8f070','#6ab030','#3a7020'],s:1.8,add:false}); for(let i=0;i<3;i++) puff(x+(Math.random()-.5)*10,y,3+c*.3,'#6a9a30'); ringFx('#8ad040',14*I,.4); }
  else if(k==='force'){ ringFx('#fffaf0',20*I,.3); ringFx('#e0d8c0',30*I,.45); flash('#fff6e0',14*I,.2); burst(x,y,8,8,{sp:50,up:20,g:200,life:.35,cols:['#ffffff','#e8e0c8'],s:1.4,add:false}); }
  else if(k==='arrow'){ burst(x,y,12,8,{sp:45,up:35,g:220,life:.35,cols:['#fff4d0','#c8a870','#8a6034'],s:1.4,add:false}); flash('#fff0d0',10,.14); ringFx('#fff0c0',10,.2); }
  else { burst(x,y,12,10,{sp:50,up:40,g:140,life:.45,cols:['#ffffff',col],s:1.5}); flash(col,14,.25); } }
function drawProjs(g){ const t=now(); addMode(g,true);
  for(const [p,tr] of D.track){ const x=p.x, y=p.y+10, [X,Y]=P(x,y,16), ang=projView(p), k=tr.kind, tg=tr.tag||{}, c=tg.circle||(p.big?5:2), I=.7+c*.13;
    if(X<-30||X>BW+30||Y<-60||Y>BH+60) continue;
    if(k==='arrow'){ addMode(g,false); const ca=Math.cos(ang), sa=Math.sin(ang); addMode(g,true); const gr=g.createLinearGradient(X-ca*26,Y-sa*26,X,Y); gr.addColorStop(0,'rgba(255,240,200,0)'); gr.addColorStop(1,'rgba(255,240,200,.7)'); g.strokeStyle=gr; g.lineWidth=2; g.beginPath(); g.moveTo(X-ca*26,Y-sa*26); g.lineTo(X,Y); g.stroke(); addMode(g,false);
      g.save(); g.translate(X,Y); g.rotate(ang); g.strokeStyle='#7a5430'; g.lineWidth=1.3; g.beginPath(); g.moveTo(-8,0); g.lineTo(5,0); g.stroke(); g.fillStyle='#e6e6e6'; g.beginPath(); g.moveTo(4,-2); g.lineTo(8,0); g.lineTo(4,2); g.fill(); g.fillStyle='#c84a3a'; g.fillRect(-9,-2,3,1.2); g.fillRect(-9,1,3,1.2); g.restore(); addMode(g,true); continue; }
    if(k==='fire'){ if(Math.random()<(MOB?.5:.9)) part({x:x+(Math.random()-.5)*3,y:y+(Math.random()-.5)*3,z:16+(Math.random()-.5)*3,vx:-(p.vx||0)*.05,vy:-(p.vy||0)*.05,vz:8,g:-10,life:.35,col:Math.random()<.5?'#ffb040':'#ff6a1a',s:1.8*I,add:true});
      glow(g,X,Y,10*I,'#ff7a20',.9); glow(g,X,Y,5*I,'#fff0b0',1); }
    else if(k==='ice'){ if(Math.random()<.7) part({x,y,z:16,vx:0,vy:0,vz:2,g:0,life:.35,col:'#dff8ff',s:1.4,add:true,k:'plus'}); glow(g,X,Y,9*I,'#80d8ff',.8);
      g.save(); g.translate(X,Y); g.rotate(ang); g.fillStyle='#bff4ff'; const L_=6+c; g.beginPath(); g.moveTo(L_,0); g.lineTo(-1,-2.6); g.lineTo(-L_*.7,0); g.lineTo(-1,2.6); g.closePath(); g.fill(); g.fillStyle='#fff'; g.fillRect(-1,-.6,L_*.7,1.2); g.restore(); }
    else if(k==='energy'){ const fl=Math.floor(t*30); glow(g,X,Y,9*I,'#a890ff',.85); glow(g,X,Y,4,'#ffffff',1); for(let j=0;j<2;j++){ g.strokeStyle='#e0d8ff'; g.globalAlpha=.8; g.lineWidth=1; g.beginPath(); g.moveTo(X,Y); g.lineTo(X+(hh(fl+j)-.5)*14,Y+(hh(fl*3+j)-.5)*14); g.stroke(); g.globalAlpha=1; }
      if(tr.src===player&&tg.id&&(tg.id==='storm_nail'||tg.id==='nail_chain'||tg.id==='glass_bolt')){ const [HX,HY]=P(player.x,player.y,26); addMode(g,false); bolt(g,HX,HY,X,Y,fl,tg.id==='glass_bolt'?'#d8f4ff':'#b8e4ff',1,12); addMode(g,true); } }
    else if(k==='poison'||k==='spit'){ addMode(g,false); g.fillStyle='#6ab030'; g.beginPath(); g.arc(X,Y,2.6*I,0,TAU); g.fill(); g.fillStyle='#c8f080'; g.fillRect(X-1,Y-1.5,1.4,1.4); addMode(g,true); glow(g,X,Y,8*I,'#7ad040',.5); if(Math.random()<.4) part({x,y,z:15,vx:0,vy:0,vz:-10,g:60,life:.4,col:'#7ad040',s:1.3,add:false}); }
    else if(k==='force'){ const pulse=.5+.5*Math.sin(t*30); ringG(g,X,Y+2,5+pulse*2,'#fffaf0',.9,1.4); glow(g,X,Y,8,'#fff6e0',.6); }
    else { glow(g,X,Y,8,PCOL[k]||'#ffffff',.8); } }
  addMode(g,false); }

// ---------- tabela de magias: id → efeito (todas as 64) ----------
// tipos: projétil (fire/ice/energy/poison/force), heal, heal_aoe, cleanse, buff, shield, debuff, drain, bind, banish, curse_aoe,
//        field_*, summon, blink, recall, mark, gate, create, reveal, meteor, pillar, quake
const MAP={
 minor_mend:['heal','#ffe27a'], spark_dart:['fire','#ffb040'], night_eye:['buff','#b8d8ff','olhos'], soft_hide:['buff','#c8a070','couro'], loose_grip:['debuff','#a060c0'], dull_wit:['debuff','#8060d0'], slack_limb:['debuff','#b060a0'], pilgrim_loaf:['create','#f0d090'],
 firm_step:['buff','#9ae07a','vento'], clear_mind:['buff','#8ab8ff','mente'], salt_wash:['cleanse','#d8f0ff'], open_palm:['force','#f0ead8'], sinew_gift:['buff','#ff8a6a','forca'], ward_skin:['shield','#d8dce8'], linen_wrap:['create','#f4f0e0'], ember_touch:['fire','#ff8a2a'],
 three_gifts:['buff','#ffd060','tres'], naphtha_ball:['fire','#ff7a20'], resin_sting:['poison','#8ad040'], side_step:['blink','#c8a0ff'], lime_curtain:['field_wall','#f0f0e8'], frost_pinch:['ice','#9fe8ff'], pilgrim_ward:['shield','#ffe0a0'], dust_blind:['debuff','#c8b890','poeira'],
 choir_cleanse:['heal_aoe','#fff0b0'], host_aegis:['shield','#ffd060'], four_weights:['debuff','#8a8aa0','pesos'], saltfire_line:['field_fire','#ff7a20'], deep_mend:['heal','#ffe27a'], storm_nail:['energy','#9fd8ff'], breath_siphon:['drain','#80b0ff'], shrine_step:['recall','#ffe890'],
 blade_djinn:['summon','#c8a0ff'], tear_curtain:['dispel','#e8e0ff'], mirror_oath:['shield','#c8f0ff','espelho'], cold_mind:['ice','#80d0ff'], lime_bind:['bind','#f0f0e8'], resin_mire:['field_poison','#7ad040'], call_jackal:['summon','#c8a070'], anoint_edge:['buff','#ffa040','fio'],
 unweave:['banish','#c080ff'], glass_bolt:['energy','#d8f4ff'], kiln_burst:['fire','#ff5a1a'], myrrh_veil:['veil','#a080c0'], nail_place:['mark','#e8c070'], crowd_malison:['curse_aoe','#9040c0'], white_cage:['field_cage','#ffffff'], strip_veil:['reveal','#fff0c0'],
 nail_chain:['energy','#b8a0ff'], salt_bars:['field_energy','#c8a0ff'], naphtha_pillar:['pillar','#ff6a1a'], two_sands_door:['gate','#e0c080'], drink_lamp:['drain','#a0c8ff'], scatter_called:['banish','#c080ff'], falling_stars:['meteor','#ff8a2a'], clay_shape:['buff','#a08060','barro'],
 split_ground:['quake','#a08060'], labyrinth_rush:['summon','#c86a3a'], raise_fallen:['heal','#fff0a0'], call_kiln:['summon','#ff7a20'], call_quarry:['summon','#a8a090'], call_simoom:['summon','#e8d8a0'], call_cistern:['summon','#60c0e0'], eighth_seal:['buff','#fff0a0','selo']
};
D.MAP=MAP;
// criaturas chamadas: sprite pintado do lote2 (em vez do retângulo colorido)
const ALLY_SPR={'Djinn das Lâminas':'cavaleiro_fantasma','Chacal':'lobo','Touro do Labirinto':'minotauro','Elemental do Forno':'formiga_fogo','Elemental de Pedra':'elemental_pedra','Elemental do Simum':'serpe_ar','Elemental da Cisterna':'serpe_agua','Espírito':'fantasma_cruzado',
  'Blade Djinn':'cavaleiro_fantasma','Jackal':'lobo','Bull of the Labyrinth':'minotauro','Kiln Elemental':'formiga_fogo','Stone Elemental':'elemental_pedra','Simoom Elemental':'serpe_ar','Cistern Elemental':'serpe_agua','Spirit':'fantasma_cruzado'};
function sprOf(k){ const L2=window.LOTE2; if(!L2||!L2.ready||!L2.img[k]||!L2.meta||!L2.meta.sprites[k]) return null; return [L2.img[k],L2.meta.sprites[k]]; }
function blitK(g,k,X,Y,face,fr,o){ const S=sprOf(k); if(!S) return false; const [im,M]=S, row={down:0,up:1,left:2,right:2}[face]??2, flip=face==='right';
  g.save(); g.translate(X,Y); if(o&&o.rot) g.rotate(o.rot); g.scale(.5*SCLd*(flip?-1:1)*((o&&o.sx)||1),.5*SCLd*((o&&o.sy)||1)); if(o&&o.alpha!=null) g.globalAlpha=o.alpha;
  g.drawImage(im,(fr||0)*M.cw,row*M.ch,M.cw,M.ch,-M.ax,-M.ay,M.cw,M.ch); g.restore(); g.globalAlpha=1; return true; }

// ---------- conjuração ----------
function caster(){ return {x:player.x,y:player.y}; }
function runeFx(x,y,col,c,dur){ const e0=ep(x,y), R=11+c*1.6; fx('g',dur,(g,a)=>{ const [X,Y]=P(x,y,0,e0), u=seg(a,0,.12)*(1-seg(a,dur-.18,dur)); runes(g,X,Y,R,col,u,now()); },'runa');
  fx('a',dur*.8,(g,a)=>{ const [X,Y]=P(player.x,player.y,30), u=seg(a,0,.1)*(1-seg(a,dur*.8-.15,dur*.8)); addMode(g,true); glow(g,X+4,Y-2-4*u,10,col,u); g.globalAlpha=u; g.fillStyle='#fff'; g.fillRect(X+3,Y-3-4*u,2,2); g.globalAlpha=1; addMode(g,false); });
  embers(x,y,4+c,[col,'#ffffff'],22); }
function auraFx(x,y,col,c,style){ const e0=ep(x,y), dur=1+c*.06;
  fx('g',dur,(g,a)=>{ const [X,Y]=P(player.x,player.y,0), u=a/dur; ringG(g,X,Y,6+18*eOut(u),col,1-u,2); ringG(g,X,Y,4+12*eOut(seg(u,.15,1)),'#ffffff',(1-u)*.6,1); },'aura');
  fx('a',dur,(g,a)=>{ const [X,Y]=P(player.x,player.y,0), u=a/dur; addMode(g,true); const h=40+c*3; for(let i=0;i<10;i++){ const an=i/10*TAU+a*5, r=9+3*Math.sin(a*6+i), px=X+Math.cos(an)*r, py=Y-((a*55+i*7)%h)+Math.sin(an)*r*.45;
      g.globalAlpha=(1-u)*.9; g.fillStyle=i%3?col:'#ffffff'; if(style==='tres') g.fillStyle=['#ff7a6a','#7ae07a','#7ab0ff'][i%3]; g.fillRect(px-1,py-1,2,2); } g.globalAlpha=1; addMode(g,false);
    if(style==='fio'&&typeof player!=='undefined'){ addMode(g,true); glow(g,X+8,Y-20,9,'#ffa040',(1-u)); addMode(g,false); } });
  if(style==='selo'){ fx('g',1.6,(g,a)=>{ const [X,Y]=P(player.x,player.y,0); runes(g,X,Y,30,col,(1-seg(a,1.1,1.6))*seg(a,0,.2),now()*1.3); },'selo'); shakeK(3); }
  if(style==='barro'){ burst(player.x,player.y,4,16,{sp:40,up:50,g:200,life:.6,cols:['#a08060','#7a6048','#c8b090'],s:2,add:false}); }
  if(style==='olhos'){ burst(player.x,player.y,26,8,{sp:12,up:6,g:0,life:.8,cols:['#d8ecff','#ffffff'],s:1.4,k:'plus'}); } }
function shieldFx(col,c,style){ const dur=1.3+c*.05;
  fx('a',dur,(g,a)=>{ const [X,Y]=P(player.x,player.y,20), R=20+c, al=seg(a,0,.15)*(1-seg(a,dur-.35,dur)); g.save(); addMode(g,true); g.globalAlpha=al;
    const gr=g.createRadialGradient(X,Y,R*.4,X,Y,R); gr.addColorStop(0,col+'00'); gr.addColorStop(.85,col+'44'); gr.addColorStop(1,col+'cc'); g.fillStyle=gr; g.beginPath(); g.arc(X,Y,R,0,TAU); g.fill();
    g.beginPath(); g.arc(X,Y,R,0,TAU); g.clip(); g.strokeStyle=col; g.globalAlpha=al*.45; g.lineWidth=.8; const hs=6;
    for(let yy=-R;yy<R;yy+=hs*1.5) for(let xx=-R;xx<R;xx+=hs*1.732){ const ox=(Math.round((yy+R)/(hs*1.5))%2)*hs*.866; g.beginPath(); for(let i=0;i<=6;i++){ const an=Math.PI/6+i*TAU/6; const px=X+xx+ox+Math.cos(an)*hs*.55, py=Y+yy+Math.sin(an)*hs*.55; i?g.lineTo(px,py):g.moveTo(px,py);} g.stroke(); }
    if(style==='espelho'){ g.globalAlpha=al*.8; g.fillStyle='#ffffff'; const sw=((a*1.6)%1)*R*2-R; g.fillRect(X+sw-2,Y-R,3,R*2); }
    g.restore(); addMode(g,false); },'escudo'); }
function healFx(x,y,col,c,big){ const e0=ep(x,y), dur=.9+c*.05, w=7+c*.8;
  fx('a',dur,(g,a)=>{ const [X,Y]=P(player.x,player.y,0), al=Math.sin(Math.PI*clamp(a/dur,0,1)); pillar(g,X,Y+2,w*(.6+.4*eOut(seg(a,0,.2))),110+c*8,col,al); addMode(g,true); glow(g,X,Y-16,26+c*2,col,al*.6); addMode(g,false); },'pilar_cura');
  fx('g',dur,(g,a)=>{ const [X,Y]=P(player.x,player.y,0), al=Math.sin(Math.PI*clamp(a/dur,0,1)); ringG(g,X,Y,10+4*Math.sin(a*8)+c,col,al,1.8); });
  for(let i=0;i<8+c*2;i++) part({x:player.x+(Math.random()-.5)*14,y:player.y+(Math.random()-.5)*6,z:Math.random()*10,vx:0,vy:0,vz:30+Math.random()*30,g:0,life:.8+Math.random()*.5,col:i%2?'#fff3b0':col,s:1.3,add:true,k:'plus'});
  if(big){ fx('a',1.4,(g,a)=>{ const [X,Y]=P(player.x,player.y,44); ringG(g,X,Y,8,'#fff6c0',(1-a/1.4),1.5); },'aureola'); shakeK(2); } }
function debuffFx(t,col,c,style){ if(!t) return; const tt=t, dur=1+c*.06;
  fx('a',dur,(g,a)=>{ const [X,Y]=P(tt.x,tt.y,0), u=a/dur; addMode(g,style!=='poeira'&&style!=='pesos'); 
    if(style==='poeira'){ for(let i=0;i<10;i++){ const an=i/10*TAU+a*2, r=6+a*10; g.globalAlpha=(1-u)*.5; g.fillStyle='#c8b890'; g.beginPath(); g.arc(X+Math.cos(an)*r,Y-16+Math.sin(an)*r*.5,3+a*3,0,TAU); g.fill(); } }
    else if(style==='pesos'){ for(let i=0;i<4;i++){ const dl=i*.12, v=seg(a,dl,dl+.3), px=X+(i-1.5)*6, py=lerp(Y-60,Y-8,eOut(v)); g.globalAlpha=(1-seg(u,.7,1)); g.fillStyle='#5a5a68'; g.fillRect(px-2.5,py-3,5,5); g.fillStyle='#8a8aa0'; g.fillRect(px-1.5,py-5,3,2); } }
    else { for(let i=0;i<7;i++){ const an=i/7*TAU+a*4, r=8-a*2, px=X+Math.cos(an)*r, py=Y-12-((a*20+i*5)%26)+Math.sin(an)*r*.4; g.globalAlpha=(1-u)*.85; g.fillStyle=i%2?col:'#e0b0ff'; g.beginPath(); g.arc(px,py,1.6,0,TAU); g.fill(); }
      glow(g,X,Y-14,14,col,(1-u)*.6); g.globalAlpha=(1-u); g.fillStyle=col; g.font='bold 9px Georgia, serif'; g.textAlign='center'; g.fillText('☠',X,Y-40-a*6); }
    g.globalAlpha=1; addMode(g,false); },'maldicao'); }
function drainFx(t,col){ if(!t) return; const tt=t; fx('a',.9,(g,a)=>{ const [X0,Y0]=P(tt.x,tt.y,18), [X1,Y1]=P(player.x,player.y,22); addMode(g,true); for(let i=0;i<10;i++){ const u=((a*1.6+i/10)%1), x=lerp(X0,X1,u)+Math.sin(u*9+i)*4, y=lerp(Y0,Y1,u)-Math.sin(u*Math.PI)*12;
    g.globalAlpha=Math.sin(u*Math.PI)*(1-seg(a,.6,.9)); g.fillStyle=i%2?col:'#ffffff'; g.fillRect(x-1,y-1,2.4,2.4); } g.globalAlpha=1; addMode(g,false); },'dreno'); }
function bindFx(t,col){ if(!t) return; const tt=t; fx('a',1.6,(g,a)=>{ const [X,Y]=P(tt.x,tt.y,0), al=1-seg(a,1.2,1.6); g.strokeStyle=col; g.globalAlpha=al; g.lineWidth=1.6; for(let i=0;i<3;i++){ const yy=Y-6-i*9, w=9*eOut(seg(a,i*.1,i*.1+.25)); g.beginPath(); g.ellipse(X,yy,w,w*.4,0,0,TAU); g.stroke(); } g.globalAlpha=1; },'amarra');
  const s=D.st.get(tt); if(s) s.frozenT=now()+1.6; }
function banishFx(t,col,R){ const x=t?t.x:player.x, y=t?t.y:player.y, e0=ep(x,y); fx('g',1.1,(g,a)=>{ const [X,Y]=P(x,y,0,e0); runes(g,X,Y,R||12,col,1-seg(a,.7,1.1),-now()*2); },'banir');
  fx('a',1.1,(g,a)=>{ const [X,Y]=P(x,y,18,e0); addMode(g,true); for(let i=0;i<14;i++){ const an=i/14*TAU-a*8, r=(1-a/1.1)*(R||12)*1.2; g.globalAlpha=(1-a/1.1); g.fillStyle=i%2?col:'#ffffff'; g.fillRect(X+Math.cos(an)*r,Y+Math.sin(an)*r*.5,1.8,1.8); } glow(g,X,Y,16,col,1-a/1.1); g.globalAlpha=1; addMode(g,false); }); }
function portalFx(x,y,col,dur,big){ const e0=ep(x,y), R=big?16:11; fx('g',dur,(g,a)=>{ const [X,Y]=P(x,y,0,e0), u=seg(a,0,.2)*(1-seg(a,dur-.3,dur)); g.save(); g.translate(X,Y); g.scale(1,.5); addMode(g,true);
    for(let i=0;i<3;i++){ g.globalAlpha=u*(.8-i*.2); g.strokeStyle=i?col:'#ffffff'; g.lineWidth=2-i*.4; g.beginPath(); g.arc(0,0,R*(1-i*.25),a*6+i,a*6+i+TAU*.8); g.stroke(); } g.globalAlpha=u*.5; g.drawImage(glowImg(col),-R*1.3,-R*1.3,R*2.6,R*2.6); g.restore(); addMode(g,false); },'portal');
  fx('a',dur,(g,a)=>{ const [X,Y]=P(x,y,0,e0), u=seg(a,0,.2)*(1-seg(a,dur-.3,dur)); pillar(g,X,Y,R*.6,50+R*2,col,u*.55); }); }
function fieldFx(f,kind,col){ if(!f) return; f.dawn=kind; }
function drawFields(g){ if(typeof fields==='undefined') return; const t=now();
  for(const f of fields){ const kind=f.dawn||(f.col==='#ff7a20'?'field_fire':f.col==='#7ad040'?'field_poison':f.stun?'field_cage':f.slow?'field_wall':'field_energy'), [X,Y]=P(f.x,f.y,0), R=f.r*TWd/(2*TT)*1.0, life=clamp((f.t||1)/1.5,0,1);
    if(X<-R*2||X>BW+R*2||Y<-R||Y>BH+R) continue;
    g.save(); g.translate(X,Y); g.scale(1,.5); g.globalAlpha=.85*life; g.beginPath(); g.arc(0,0,R,0,TAU); g.clip();
    if(kind==='field_fire'){ addMode(g,true); g.drawImage(glowImg('#ff5a10'),-R,-R,R*2,R*2); for(let i=0;i<14;i++){ const ang=hh(i)*TAU, rr=hh(i*3)*R*.9, fl=Math.sin(t*9+i*2)*.5+.5; g.globalAlpha=life*(.5+.5*fl); g.drawImage(glowImg(i%2?'#ffb040':'#ff6a1a'),Math.cos(ang)*rr-6,Math.sin(ang)*rr-6-fl*4,12,12); } }
    else if(kind==='field_poison'){ g.fillStyle='rgba(70,110,30,.35)'; g.fillRect(-R,-R,R*2,R*2); for(let i=0;i<12;i++){ const ang=hh(i)*TAU, rr=hh(i*3)*R*.85, ph=(t*.9+hh(i*7))%1; g.globalAlpha=life*(1-ph); g.strokeStyle='#b8f070'; g.lineWidth=1.4; g.beginPath(); g.arc(Math.cos(ang)*rr,Math.sin(ang)*rr,1+ph*4,0,TAU); g.stroke(); } }
    else if(kind==='field_energy'){ addMode(g,true); g.drawImage(glowImg('#9070ff'),-R,-R,R*2,R*2); const fl=Math.floor(t*20); g.strokeStyle='#e0d8ff'; g.lineWidth=1.4; for(let i=0;i<4;i++){ g.globalAlpha=life*.9; g.beginPath(); let x=(hh(fl+i)-.5)*R*1.6, y=(hh(fl*2+i)-.5)*R*1.6; g.moveTo(x,y); for(let k=0;k<4;k++){ x+=(hh(fl+i*5+k)-.5)*R*.7; y+=(hh(fl*3+i+k)-.5)*R*.7; g.lineTo(x,y); } g.stroke(); } }
    else if(kind==='field_cage'||kind==='field_wall'){ g.fillStyle=kind==='field_cage'?'rgba(255,255,255,.18)':'rgba(240,240,228,.28)'; g.fillRect(-R,-R,R*2,R*2); }
    else { addMode(g,true); g.drawImage(glowImg(col||'#e8e0ff'),-R,-R,R*2,R*2); }
    g.restore(); g.globalAlpha=1; addMode(g,false);
    // bordas em pé (barras/pilares) desenhadas fora do clip
    if(kind==='field_cage'||kind==='field_wall'||kind==='field_energy'){ const n=kind==='field_wall'?10:12; for(let i=0;i<n;i++){ const an=i/n*TAU+(kind==='field_energy'?t*.6:0), px=X+Math.cos(an)*R, py=Y+Math.sin(an)*R*.5, h=kind==='field_wall'?14:18;
        if(kind==='field_wall'){ g.globalAlpha=.9*life; g.fillStyle='#e8e6da'; g.fillRect(px-2,py-h,4,h); g.fillStyle='#c8c4b4'; g.fillRect(px+1,py-h,1,h); }
        else { addMode(g,true); g.globalAlpha=life*(.6+.4*Math.sin(t*8+i)); g.fillStyle=kind==='field_cage'?'#ffffff':'#c8b0ff'; g.fillRect(px-.7,py-h,1.4,h); addMode(g,false); } } g.globalAlpha=1; }
    if(kind==='field_fire'&&Math.random()<.35) embers(f.x,f.y,1,['#ff8a2a','#ffd060'],f.r*1.6); } }
function meteorFx(tx,ty,col,n,gap,big){ for(let i=0;i<n;i++){ const ox=(hh(i*3.3+tx)-.5)*44, oy=(hh(i*7.1+ty)-.5)*26, x=tx+ox, y=ty+oy, dl=i*gap, e0=ep(x,y);
    fx('a',dl+.25,(g,a)=>{ if(a<dl) return; const u=seg(a,dl,dl+.25), [X,Y]=P(x,y,0,e0), sx=X+70*(1-u), sy=Y-150*(1-u); addMode(g,true); for(let k=0;k<6;k++){ const v=u-k*.05; if(v<0) continue; glow(g,X+70*(1-v),Y-150*(1-v),(big?9:7)-k,'#ff8030',1-k/6); } glow(g,sx,sy,6,'#fff0c0',1); addMode(g,false); },'meteoro');
    setTimeout(()=>{ try{ impact({lx:x,ly:y-10,kind:'fire',tag:{circle:big?7:6}}); }catch(e){} }, (dl+.25)*1000); }
  const e0=ep(tx,ty); fx('g',n*gap+.8,(g,a)=>{ const [X,Y]=P(tx,ty,0,e0), al=seg(a,0,.2)*(1-seg(a,n*gap+.4,n*gap+.8)); runes(g,X,Y,34,col,al*.9,now()); ringG(g,X,Y,36*eOut(seg(a,0,.3)),'#ff5a1a',al,2); },'aoe_anel'); }
function pillarFx(tx,ty){ for(let i=0;i<3;i++){ const x=tx+(Math.random()-.5)*40, y=ty+(Math.random()-.5)*24, e0=ep(x,y), dl=i*.18;
    fx('a',dl+.7,(g,a)=>{ if(a<dl) return; const u=(a-dl)/.7, [X,Y]=P(x,y,0,e0); pillar(g,X,Y,8,90*eOut(seg(u,0,.25)),'#ff6a1a',Math.sin(Math.PI*u)); addMode(g,true); glow(g,X,Y-8,22,'#ff8a30',Math.sin(Math.PI*u)); addMode(g,false); },'pilar_fogo');
    setTimeout(()=>{ try{ embers(x,y,10,['#ff6a1a','#ffb040','#ffe080'],12); burst(x,y,6,12,{sp:40,up:90,g:120,life:.7,cols:['#fff0a0','#ff9a30','#ff4a10'],s:1.8}); }catch(e){} }, dl*1000); } shakeK(5); }
function quakeFx(tx,ty){ const e0=ep(tx,ty); fx('g',1.5,(g,a)=>{ const [X,Y]=P(tx,ty,0,e0), al=1-seg(a,1,1.5); g.strokeStyle='#2a1c10'; g.globalAlpha=al; g.lineWidth=1.6;
    for(let i=0;i<6;i++){ const an=i/6*TAU+.3; let x=X, y=Y; g.beginPath(); g.moveTo(x,y); for(let k=1;k<=4;k++){ const r=k*10*eOut(seg(a,0,.4)); x=X+Math.cos(an+(hh(i*9+k)-.5)*.5)*r; y=Y+Math.sin(an+(hh(i*5+k)-.5)*.5)*r*.5; g.lineTo(x,y); } g.stroke(); } g.globalAlpha=1;
    ringG(g,X,Y,10+50*eOut(seg(a,0,.6)),'#d8c090',(1-seg(a,0,.6))*.8,2.5); },'fenda');
  for(let i=0;i<8;i++){ const x=tx+(Math.random()-.5)*50, y=ty+(Math.random()-.5)*28; puff(x,y,4,'#9a8466'); }
  burst(tx,ty,2,22,{sp:60,up:90,g:260,life:.8,cols:['#8a7458','#6a5a44','#b8a080'],s:2.4,add:false}); shakeK(8); }

function healNum(h,big){ if(h>.5) num(player.x,player.y,'+'+Math.round(h),'#7dff8a',big,34); }
function freezeNear(x,y,c){ let best=null, bd=22; for(const r of raiders){ const d=Math.hypot(r.x-x,r.y-y); if(d<bd){ bd=d; best=r; } } if(!best) return; let s=D.st.get(best); if(!s) return; s.frozenT=now()+1+c*.1; const tt=best, e0=ep(tt.x,tt.y), dur=1+c*.1;
  fx('a',dur,(g,a)=>{ const [X,Y]=P(tt.x,tt.y,0,e0), u=eOut(seg(a,0,.15)), al=1-seg(a,dur-.3,dur); g.globalAlpha=al; for(let i=0;i<7;i++){ const px=X+(i-3)*4.2, h=(6+hh(i*3)*10)*u; g.fillStyle=i%2?'rgba(200,245,255,.9)':'rgba(120,210,255,.85)'; g.beginPath(); g.moveTo(px-2.6,Y+2); g.lineTo(px+(hh(i)-.5)*3,Y+2-h); g.lineTo(px+2.6,Y+2); g.fill(); }
    addMode(g,true); glow(g,X,Y-14,20,'#9fe8ff',al*.55); addMode(g,false); g.globalAlpha=1; },'congelar'); num(tt.x,tt.y,L.frozen,'#9fe8ff',false,46); }
D.cast=function(id,s,o){ const c=s.circle||1, m=MAP[id]||['buff','#ffffff'], [kind,col,style]=m, tg=o.tgt;
  D.stats.casts[id]=(D.stats.casts[id]||0)+1; const px=o.px, py=o.py;
  if(o.fizz){ const e0=ep(px,py); fx('g',.5,(g,a)=>{ const [X,Y]=P(px,py,0,e0); runes(g,X,Y,10,'#8a8a8a',(1-a/.5),now()*4); },'falha'); num(px,py,L.miss,'#b0b0b0',false,34); return; }
  runeFx(px,py,col,c,.55+c*.05);
  // marca os projéteis novos com o tipo da magia (o desenho/impacto sai da tabela)
  for(const p of o.newProjs||[]) p.dawn={kind:['fire','ice','energy','poison','force'].includes(kind)?kind:(KIND_BY_EL[p.el]||'energy'),id,circle:c};
  const tx=tg?tg.x:player.x+Math.cos(player.aimAng||0)*60, ty=tg?tg.y:player.y+Math.sin(player.aimAng||0)*60;
  switch(kind){
    case 'heal': healFx(px,py,col,c,id==='raise_fallen'); healNum(o.heal,c>=4); break;
    case 'heal_aoe': healFx(px,py,col,c,false); { const e0=ep(px,py); fx('g',1.1,(g,a)=>{ const [X,Y]=P(px,py,0,e0); ringG(g,X,Y,8+40*eOut(a/1.1),col,1-a/1.1,2.5); runes(g,X,Y,30,col,1-a/1.1,now()); },'cura_area'); } healNum(o.heal,true); break;
    case 'cleanse': healFx(px,py,col,c,false); for(let i=0;i<10;i++) part({x:px+(Math.random()-.5)*12,y:py,z:Math.random()*20,vx:0,vy:0,vz:20+Math.random()*20,g:0,life:.9,col:'#e8f8ff',s:1.6,add:true,k:'plus'}); healNum(o.heal,false); break;
    case 'buff': auraFx(px,py,col,c,style); break;
    case 'shield': auraFx(px,py,col,c,style); shieldFx(col,c,style); break;
    case 'veil': for(let i=0;i<8;i++) puff(px+(Math.random()-.5)*12,py+(Math.random()-.5)*6,4,'#8a70a8'); auraFx(px,py,col,c,'veu'); break;
    case 'debuff': debuffFx(tg,col,c,style); break;
    case 'curse_aoe': debuffFx(tg,col,c,style); if(tg) banishFx(tg,col,28); break;
    case 'drain': drainFx(tg,col); debuffFx(tg,col,c); break;
    case 'bind': bindFx(tg,col); break;
    case 'banish': banishFx(tg,col,id==='scatter_called'?40:14); break;
    case 'dispel': { const e0=ep(tx,ty); fx('g',.9,(g,a)=>{ const [X,Y]=P(tx,ty,0,e0); ringG(g,X,Y,6+46*eOut(a/.9),col,1-a/.9,2.5); ringG(g,X,Y,4+30*eOut(a/.9),'#ffffff',(1-a/.9)*.6,1.2); },'dissipar'); burst(tx,ty,10,16,{sp:60,up:30,g:60,life:.6,cols:['#ffffff',col],s:1.4}); break; }
    case 'field_wall': case 'field_fire': case 'field_poison': case 'field_cage': case 'field_energy': for(const f of o.newFields||[]) fieldFx(f,kind,col); { const f=(o.newFields||[])[0]; if(f){ burst(f.x,f.y,4,14,{sp:50,up:40,g:120,life:.5,cols:[col,'#ffffff'],s:1.6}); } } break;
    case 'summon': for(const a of o.newAllies||[]){ portalFx(a.x,a.y,col,1.4,c>=8); setTimeout(()=>{ try{ burst(a.x,a.y,10,18,{sp:60,up:60,g:120,life:.6,cols:[col,'#ffffff'],s:1.8}); }catch(e){} },350); a.dawnT=now()+.35; } shakeK(c>=8?4:2); break;
    case 'blink': case 'recall': case 'gate': portalFx(px,py,col,kind==='gate'?2:1,kind==='gate'); portalFx(player.x,player.y,col,kind==='gate'?2:1,kind==='gate'); burst(player.x,player.y,10,14,{sp:50,up:40,g:60,life:.5,cols:[col,'#ffffff'],s:1.5}); break;
    case 'mark': { const e0=ep(px,py); fx('g',2,(g,a)=>{ const [X,Y]=P(px,py,0,e0); runes(g,X,Y,14,col,1-seg(a,1.4,2),now()*.5); },'marca'); break; }
    case 'create': fx('a',.8,(g,a)=>{ const [X,Y]=P(player.x,player.y,24); addMode(g,true); glow(g,X+5,Y,12,col,1-a/.8); addMode(g,false); },'criar'); burst(player.x,player.y,24,10,{sp:20,up:20,g:0,life:.7,cols:[col,'#ffffff'],s:1.3,k:'plus'}); break;
    case 'reveal': { const e0=ep(px,py); fx('g',1.2,(g,a)=>{ const [X,Y]=P(px,py,0,e0); ringG(g,X,Y,10+120*eOut(a/1.2),col,1-a/1.2,2); },'revelar'); break; }
    case 'meteor': meteorFx(tx,ty,col,6,.18,true); shakeK(4); break;
    case 'pillar': pillarFx(tx,ty); break;
    case 'quake': quakeFx(tx,ty); break;
    default: break; } // projéteis: desenhados em drawProjs/impact
};
D.CAST_DEBUG=null;

// ---------- desenho por quadro (chamado pelo iso.js) ----------
D.begin=function(nowMs,W2S,EPX,bw,bh){ W2S_=W2S; EPX_=EPX; BW=bw; BH=bh; const t=now(); DT=clamp(t-(lastT||t),0,.05); lastT=t; updParts(DT); try{ trackProjs(); }catch(e){} };
D.ground=function(g){ if(!W2S_) return; const t=now();
  try{ drawFields(g); }catch(e){ D.errs++; }
  drawParts(g,true);
  for(let i=D.fx.length-1;i>=0;i--){ const f=D.fx[i], a=t-f.t0; if(a>f.dur){ D.fx.splice(i,1); continue; } if(f.lay!=='g') continue; try{ f.f(g,a); }catch(e){ D.errs++; D.fx.splice(i,1); } }
  g.globalAlpha=1; addMode(g,false); };
D.air=function(g){ if(!W2S_) return; const t=now();
  // aliados chamados: sprite pintado
  try{ if(typeof allies!=='undefined') for(const a of allies){ const k=ALLY_SPR[a.name]||'fantasma_cruzado'; const [X,Y]=P(a.x,a.y,0), b=Math.sin(a.ph||0)*1.2, pop=a.dawnT?clamp(1-(a.dawnT-t)/.35,0,1):1; if(pop<=0) continue;
      g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(X+2,Y+1,10*pop,4*pop,0,0,TAU); g.fill();
      const fc=(a.dawnFace||'left'); if(Math.abs(a.x-(a._lx??a.x))>.05) a.dawnFace=(a.x-(a._lx??a.x))>0?'right':'left'; a._lx=a.x;
      const ok=blitK(g,k,Math.round(X),Math.round(Y-Math.abs(b)),fc,Math.floor((a.ph||0)/2)%3,{sx:pop*(1-.012*Math.sin(t*2.6)),sy:pop*(1+.02*Math.sin(t*2.6)),alpha:k==='cavaleiro_fantasma'||k==='fantasma_cruzado'?.75:1});
      if(!ok){ g.fillStyle=a.col; g.fillRect(X-3,Y-16,6,12); }
      if(a.hp<a.max){ g.fillStyle='#000'; g.fillRect(X-8,Y-40,16,3); g.fillStyle='#6ad04a'; g.fillRect(X-7,Y-39,Math.max(0,Math.round(14*a.hp/a.max)),1); } } }catch(e){ D.errs++; }
  // mortos: cambalhota e fade
  for(let i=D.dead.length-1;i>=0;i--){ const d=D.dead[i], a=t-d.t0; if(a>1.1){ D.dead.splice(i,1); continue; } const u=seg(a,0,.45), dir=d.sd[0]>=0?1:-1;
    const [X,Y0]=P(d.e.x,d.e.y,0,d.ep), X1=X+d.sd[0]*10*eOut(u), Y=Y0+d.sd[1]*10*eOut(u)-10*Math.sin(Math.PI*u); g.save(); g.globalAlpha=1-seg(a,.55,1.1);
    g.fillStyle='rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(X1+2,Y0+d.sd[1]*10*eOut(u)+1,11,4,0,0,TAU); g.fill();
    g.translate(Math.round(X1),Math.round(Y)); g.rotate(dir*Math.PI/2*eOut(u)); g.scale(SCLd,SCLd); const of=d.e.face; d.e.face=d.face||d.e.face;
    try{ if(d.k==='r') drawRaider(g,d.e,0,0); else if(d.k==='n') drawNPC(g,d.e,0,0); else if(d.k==='a') drawAnimal(g,d.e,0,0); }catch(e){ D.errs++; }
    d.e.face=of; g.restore(); g.globalAlpha=1; if(!d.puffed&&a>.45){ d.puffed=1; puff(d.e.x+d.sd[0]*4,d.e.y,3.5); puff(d.e.x,d.e.y+1,3); } }
  try{ drawProjs(g); }catch(e){ D.errs++; }
  drawParts(g,false);
  for(let i=D.fx.length-1;i>=0;i--){ const f=D.fx[i], a=t-f.t0; if(a>f.dur){ D.fx.splice(i,1); continue; } if(f.lay!=='a') continue; try{ f.f(g,a); }catch(e){ D.errs++; D.fx.splice(i,1); } }
  g.globalAlpha=1; addMode(g,false);
  drawNums(g); };

// ---------- ganchos no jogo (só visuais; sempre chamam o original) ----------
let critAt=-9, parryAt=-9, dodgeAt=-9;
if(typeof toast==='function'){ const _t=toast; toast=function(m){ try{ const s=String(m); if(/cr[ií]tic/i.test(s)) critAt=now(); else if(/apara|parr/i.test(s)) parryAt=now(); else if(/esquiva|dodge/i.test(s)) dodgeAt=now(); }catch(e){} return _t.apply(this,arguments); }; }
const recent=t0=>now()-t0<.05;
if(typeof damageRaider==='function'){ const _d=damageRaider; damageRaider=function(r,dmg,ang,knock,src){ const h0=r&&r.hp, c0=critAt; const res=_d.apply(this,arguments);
  try{ if(isoActive()&&r&&h0!=null){ const lost=h0-Math.max(0,r.hp); if(lost>0.5){ const crit=critAt!==c0&&recent(critAt); hitFx(r,ang||0,lost,crit,'r'); num(r.x,r.y,(crit?L.crit+' ':'')+'-'+Math.round(lost),crit?'#ff5a3a':(src&&src!==player?'#ffd27a':'#ffffff'),crit,34); } } }catch(e){ D.errs++; } return res; }; }
if(typeof damageNPC==='function'){ const _d=damageNPC; damageNPC=function(n,dmg,ang,src){ const h0=n&&n.hp; const res=_d.apply(this,arguments);
  try{ if(isoActive()&&n&&h0!=null){ const lost=h0-Math.max(0,n.hp); if(lost>.5){ hitFx(n,ang||0,lost,false,'n'); num(n.x,n.y,'-'+Math.round(lost),'#ffffff',false,34); } if(n.dead&&!(h0<=0)) dying(n,'n',ang); } }catch(e){ D.errs++; } return res; }; }
if(typeof damageAnimal==='function'){ const _d=damageAnimal; damageAnimal=function(a,dmg,ang){ const h0=a&&a.hp, was=typeof animals!=='undefined'&&animals.includes(a); const res=_d.apply(this,arguments);
  try{ if(isoActive()&&a&&h0!=null){ const lost=h0-Math.max(0,a.hp); if(lost>.5){ hitFx(a,ang||0,lost,false,'a'); num(a.x,a.y,'-'+Math.round(lost),'#ffffff',false,24); } if(was&&!animals.includes(a)) dying(a,'a',ang); } }catch(e){ D.errs++; } return res; }; }
if(typeof hurtPlayer==='function'){ const _h=hurtPlayer; hurtPlayer=function(dmg,src){ const h0=player&&player.health, p0=parryAt, d0=dodgeAt; const res=_h.apply(this,arguments);
  try{ if(isoActive()&&player){ const lost=h0-player.health; if(lost>.5){ const ang=src?Math.atan2(player.y-src.y,player.x-src.x):0; hitFx(player,ang,lost,false,'p'); num(player.x,player.y,'-'+Math.round(lost),'#ff6a5a',false,36); }
      else if(parryAt!==p0&&recent(parryAt)){ num(player.x,player.y,L.block,'#bfe2ff',false,38); burst(player.x,player.y,14,12,{sp:60,up:30,g:150,life:.4,cols:['#e8f4ff','#9cd0ff','#ffffff'],s:1.5}); const e0=ep(player.x,player.y); fx('a',.25,(g,a)=>{ const [X,Y]=P(player.x,player.y,14,e0); ringG(g,X,Y,4+30*a/.25,'#bfe2ff',1-a/.25,1.8); },'bloqueio'); }
      else if(dodgeAt!==d0&&recent(dodgeAt)) num(player.x,player.y,L.dodge,'#e8e0a0',false,38); } }catch(e){ D.errs++; } return res; }; }
function dying(e,k,ang){ D.stats.deaths++; const clone=Object.assign(Object.create(Object.getPrototypeOf(e)),e,{hp:e.max||e.hp||1,hurtT:0,wind:0,swingT:0,alertT:0,dead:false,moving:false}); const s=D.st.get(e);
  D.dead.push({e:clone,k,t0:now(),sd:sdir(ang||0),face:s&&s.face,ep:ep(e.x,e.y)}); if(D.dead.length>12) D.dead.shift(); }
if(typeof killRaider==='function'){ const _k=killRaider; killRaider=function(r,ang){ const res=_k.apply(this,arguments); try{ if(isoActive()&&r) dying(r,'r',ang); }catch(e){ D.errs++; } return res; }; }
if(typeof playerAttack==='function'){ const _pa=playerAttack; playerAttack=function(ang){ const sw0=player&&player.swing, cd0=player&&player.atkCd, tr0=typeof tracers!=='undefined'?tracers.length:0; const res=_pa.apply(this,arguments);
  try{ if(isoActive()&&player&&player.atkCd!==cd0){ const s=D.st.get(player), Wp=(typeof WEAPONS!=='undefined'&&WEAPONS[player.weapon])||{};
      if(Wp.ranged){ if(s){ s.shotT=now(); s.shotA=ang; } const bow=/arrow|bolt/.test(Wp.ammo||'')||Wp.skill==='arcos';
        if(bow&&typeof tracers!=='undefined') for(const tr of tracers.slice(tr0)){ arrowFx(tr.x1,tr.y1,tr.x2,tr.y2); tr.t=0; } }
      else if(player.swing&&player.swing!==sw0){ if(s){ s.atkT=now(); s.atkA=ang; } slashFx(player,ang,weapCol(player.weapon),17+Math.min(9,(Wp.range||14)/3.5),false); } } }catch(e){ D.errs++; } return res; }; }
function arrowFx(x1,y1,x2,y2){ D.stats.arrows++; const dist=Math.hypot(x2-x1,y2-y1), dur=clamp(dist/420,.08,.35), e1=ep(x1,y1+10), e2=ep(x2,y2+10);
  fx('a',dur,(g,a)=>{ const u=a/dur, x=lerp(x1,x2,u), y=lerp(y1,y2,u)+10, [X,Y]=P(x,y,16+Math.sin(u*Math.PI)*6,lerp(e1,e2,u)), [Xa,Ya]=P(x1,y1+10,16,e1), [Xb,Yb]=P(x2,y2+10,16,e2), ang=Math.atan2(Yb-Ya,Xb-Xa), ca=Math.cos(ang), sa=Math.sin(ang);
    addMode(g,true); const gr=g.createLinearGradient(X-ca*28,Y-sa*28,X,Y); gr.addColorStop(0,'rgba(255,240,200,0)'); gr.addColorStop(1,'rgba(255,240,200,.75)'); g.strokeStyle=gr; g.lineWidth=2; g.beginPath(); g.moveTo(X-ca*28,Y-sa*28); g.lineTo(X,Y); g.stroke(); addMode(g,false);
    g.save(); g.translate(X,Y); g.rotate(ang); g.strokeStyle='#7a5430'; g.lineWidth=1.3; g.beginPath(); g.moveTo(-8,0); g.lineTo(5,0); g.stroke(); g.fillStyle='#e6e6e6'; g.beginPath(); g.moveTo(4,-2); g.lineTo(8,0); g.lineTo(4,2); g.fill(); g.fillStyle='#c84a3a'; g.fillRect(-9,-2,3,1.2); g.fillRect(-9,1,3,1.2); g.restore(); },'flecha');
  setTimeout(()=>{ try{ impact({lx:x2,ly:y2,kind:'arrow',tag:{circle:2}}); }catch(e){} }, dur*1000); }
if(typeof castSpell==='function'){ const _cs=castSpell; castSpell=function(id){ const s=typeof SPELLS3!=='undefined'&&SPELLS3[id]; if(!s||!isoActive()||!player) return _cs.apply(this,arguments);
  const m0=player.mana, h0=player.health, nP=projs.length, nF=fields.length, nA=(typeof allies!=='undefined'?allies.length:0), nX=fxs.length, px=player.x, py=player.y; let tgt=null; try{ tgt=spellTarget(12*T); }catch(e){}
  const res=_cs.apply(this,arguments);
  try{ if(player.mana<m0){ const fizz=fxs.slice(nX).some(p=>p.col==='#888'); D.cast(id,s,{tgt,px,py,fizz,heal:player.health-h0,newProjs:projs.slice(nP),newFields:fields.slice(nF),newAllies:typeof allies!=='undefined'?allies.slice(nA):[]}); } }catch(e){ D.errs++; if(D.errs<4) console.warn('[dawn]',e); }
  return res; }; }
if(typeof useAbility==='function'){ const _ua=useAbility; useAbility=function(id){ const st0=player&&player.stamina; const res=_ua.apply(this,arguments);
  try{ if(isoActive()&&player&&player.stamina<st0){ const ang=player.aimAng||0, s=D.st.get(player); if(s){ s.atkT=now(); s.atkA=ang; }
      if(id==='whirlwind_strike'){ for(let k=0;k<4;k++) setTimeout(()=>slashFx(player,ang+k*Math.PI/2,'#e8f0ff',22,false),k*60); const e0=ep(player.x,player.y); fx('g',.4,(g,a)=>{ const [X,Y]=P(player.x,player.y,0,e0); ringG(g,X,Y,8+30*a/.4,'#e0e0e0',1-a/.4,2); },'giro'); }
      else if(id==='charge'){ for(let k=0;k<5;k++) puff(player.x-Math.cos(ang)*k*6,player.y-Math.sin(ang)*k*6,3); slashFx(player,ang,'#ffe0a0',18,false); shakeK(3); }
      else if(id==='heavy_blow'||id==='stun_blow'){ slashFx(player,ang,'#ffb070',20,false); if(id==='stun_blow'){ const t=spellTarget(10*T); if(t) for(let i=0;i<5;i++) part({x:t.x,y:t.y,z:34,vx:Math.cos(i/5*TAU)*14,vy:Math.sin(i/5*TAU)*8,vz:0,g:0,life:1.2,col:'#ffe080',s:1.8,add:true,k:'plus'}); } }
      else if(id==='long_thrust'){ const e0=ep(player.x,player.y), x0=player.x, y0=player.y; fx('a',.25,(g,a)=>{ const [X0,Y0]=P(x0,y0,16,e0), [X1,Y1]=P(x0+Math.cos(ang)*55,y0+Math.sin(ang)*55,16,e0); addMode(g,true); g.globalAlpha=1-a/.25; g.strokeStyle='#e8f0ff'; g.lineWidth=3; g.beginPath(); g.moveTo(X0,Y0); g.lineTo(lerp(X0,X1,eOut(a/.12>1?1:a/.12)),lerp(Y0,Y1,eOut(a/.12>1?1:a/.12))); g.stroke(); g.globalAlpha=1; addMode(g,false); },'estocada'); } } }catch(e){ D.errs++; } return res; }; }
// monstro atordoado (paralisia/golpe atordoante) parava de contar o hurtT e ficava branco o tempo todo
if(typeof update==='function'){ const _u=update; update=function(dt){ const r=_u.apply(this,arguments); try{ if(typeof raiders!=='undefined') for(const q of raiders) if(q.stunT>0&&q.hurtT>0) q.hurtT-=dt; }catch(e){} return r; }; }
// aliados: no modo isométrico o retângulo antigo some (o sprite pintado é desenhado em DAWN.air)
if(typeof drawFX==='function'){ const _fx=drawFX; drawFX=function(g,cx,cy){ if(!isoActive()||typeof allies==='undefined'||!allies.length) return _fx.apply(this,arguments); const sv=allies; allies=[]; try{ return _fx.apply(this,arguments); } finally { allies=sv; } }; }
})();

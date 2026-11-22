// =====================================================================
// PRIMEIRA PESSOA com MÃOS FOTOGRAFADAS (como o Daggerfall fazia): fotos de mãos de verdade
// ("Fantasy FPS Hands", Ragnar Random, CC0) viram pixel art na hora — a luz da foto é trocada pelos
// tons da pele/luva e da manga do herói, com pontilhado — e as armas (pixel art "Swords and Staffs" de
// SnoopethDuckDuck, CC0, ou desenhadas pelo jogo) ficam presas na pegada. Animação simples por quadros.
// =====================================================================
(function(){
if(typeof fpOn!=='function'||!window.FPHANDS_PH||!window.__FPH) return;
const F=window.__FPH, PH=window.FPHANDS_PH, WP=window.FPHANDS_WP||{}, FW=306, FH=204;
// ---------- carregar imagens ----------
const IMG={}, SPR={}; let ready=0, need=0;
for(const k in PH){ need++; const im=new Image(); im.onload=()=>{ ready++; }; im.src=PH[k].src; IMG[k]=im; }
for(const k in WP){ need++; const im=new Image(); im.onload=()=>{ ready++; }; im.src=WP[k].src; SPR[k]=im; }
// foto -> canvas com R = luz, G = classe (255 pele, 200 madeira, 150 manga)
const CODED={};
const EXT=260;   // o braço continua para baixo (para a mão poder subir sem a manga acabar no meio da tela)
function coded(k){ if(CODED[k]) return CODED[k]; const im=IMG[k], w=im.width, h=im.height, c=document.createElement('canvas'); c.width=w+EXT; c.height=h+EXT; const x=c.getContext('2d'); x.drawImage(im,0,0);
  const d=x.getImageData(0,0,c.width,c.height), p=d.data, W=c.width;
  for(let i=0;i<p.length;i+=4){ const L=p[i], A=p[i+3]; p[i]=L; p[i+1]=A; p[i+2]=0; p[i+3]=A?255:0; }
  // inclinação da manga: centro dos pixels nas últimas linhas
  const cx=y=>{ let s=0,n=0; for(let X=0;X<w;X++) if(p[(y*W+X)*4+3]) { s+=X; n++; } return n?s/n:null; };
  const a=cx(h-1), b=cx(Math.max(0,h-25)); const slope=(a!=null&&b!=null)?Math.max(0,Math.min(1.4,(a-b)/24)):.6;
  for(let y=h;y<h+EXT;y++){ const sh=Math.round((y-h+1)*slope); for(let X=0;X<W;X++){ const sx=X-sh; if(sx<0||sx>=w) continue; const q=((h-1)*W+sx)*4, o=(y*W+X)*4; if(!p[q+3]) continue; p[o]=p[q]; p[o+1]=p[q+1]; p[o+2]=0; p[o+3]=255; } }
  x.putImageData(d,0,0); return CODED[k]=c; }
// ---------- tons ----------
const hx=c=>{ c=(c||'#888').replace('#',''); if(c.length===3) c=c.split('').map(q=>q+q).join(''); return [parseInt(c.slice(0,2),16),parseInt(c.slice(2,4),16),parseInt(c.slice(4,6),16)]; };
const toRGB=s=>s[0]==='#'?hx(s):s.match(/\d+/g).map(Number).slice(0,3);
function tones(R){ return [R.d,R.s,R.m,R.l,R.h].map(toRGB); }
const BAYER=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5].map(v=>(v/16-.47)*.9);
// ---------- quadro ----------
// layer de arma: desenhada em 3x e reduzida pegando o pixel do meio; layer de mão: foto reduzida e trocada por tons
let wc=null, hc=null, oc=null;
function canv(c,w,h){ if(!c) c=document.createElement('canvas'); if(c.width!==w||c.height!==h){ c.width=w; c.height=h; } return c; }
function place(x,frameKey,T,mirror,vw,vh){ // T = {rot, dx, dy, sc} em coordenadas do quadro da foto
  const kf=vh/FH*BASE*(T.sc||1); x.translate(mirror?-(T.dx||0)*kf:vw+(T.dx||0)*kf, vh+(T.dy||0)*kf);
  if(mirror) x.scale(-1,1); x.translate(0,0); x.scale(kf,kf); x.translate(-FW,-FH);
  if(T.rot){ x.translate(300,232); x.rotate(T.rot); x.translate(-300,-232); } }
function drawHand(x,key,T,mirror,vw,vh){ const f=PH[key]; x.save(); place(x,key,T,mirror,vw,vh); x.imageSmoothingEnabled=true; x.imageSmoothingQuality='high'; x.drawImage(coded(key),f.x,f.y); x.restore(); }
function toneHands(c,C,key){ const fr=PH[key]||PH['001'], rs=fr.skin||[60,230], rl=fr.sleeve||[5,70], rw=fr.wood||[50,230]; const x=c.getContext('2d'), d=x.getImageData(0,0,c.width,c.height), p=d.data, W=c.width;
  const SK=tones(C.G||C.S), SL=tones(C.sleeve), WD=tones(F.WOODR);
  for(let i=0,n=0;i<p.length;i+=4,n++){ if(p[i+3]<128){ p[i+3]=0; continue; } const L=p[i], cl=p[i+1], b=BAYER[((n/W|0)&3)*4+(n%W&3)];
    let R, t; if(cl<175){ R=SL; t=(L-rl[0])/(rl[1]-rl[0]); } else if(cl<228){ R=WD; t=(L-rw[0])/(rw[1]-rw[0]); } else { R=SK; t=(L-rs[0])/(rs[1]-rs[0]); }
    const k=Math.max(0,Math.min(R.length-1,Math.floor(t*R.length+b))); const q=R[R===SL?Math.min(3,k):k]; p[i]=q[0]; p[i+1]=q[1]; p[i+2]=q[2]; p[i+3]=255; }
  x.putImageData(d,0,0); }
function outline(c){ const x=c.getContext('2d'), W=c.width, H=c.height, d=x.getImageData(0,0,W,H), p=d.data, a=new Uint8Array(W*H);
  for(let i=0;i<W*H;i++) a[i]=p[i*4+3]>100?1:0; for(let i=0;i<W*H;i++) if(!a[i]) p[i*4+3]=0; else p[i*4+3]=255;
  for(let y=1;y<H-1;y++) for(let X=1;X<W-1;X++){ const i=y*W+X; if(a[i]) continue; if(a[i-1]||a[i+1]||a[i-W]||a[i+W]){ p[i*4]=20; p[i*4+1]=13; p[i*4+2]=9; p[i*4+3]=255; } }
  x.putImageData(d,0,0); }
// coloca o centro do punho (foto 001) num ponto da tela
const KN={x:130,y:98};
function fistAt(x2,sx,sy,mirror,vw,vh,sc){ const kf=vh/FH*BASE*(sc||1); const T={sc:sc||1};
  if(mirror){ T.dx=-(sx-(FW-KN.x)*kf)/kf; } else { T.dx=(sx-vw)/kf-(KN.x-FW); } T.dy=(sy-vh)/kf+(FH-KN.y); drawHand(x2,'001',T,mirror,vw,vh); }
// arma presa na pegada do punho (quadro 001): ponto e ângulo do cabo nas coordenadas da foto
const GRIP={x:112,y:92,ang:-2.1};
const SS=3, BASE=.66, SPRS=4.2;
function weaponLayer(id,k,T,vw,vh,mirror){ const W2=vw*SS, H2=vh*SS, big=canv(null,W2,H2), x=big.getContext('2d'); x.imageSmoothingEnabled=false;
  x.save(); x.scale(SS,SS); place(x,'001',T,mirror,vw,vh); x.translate(GRIP.x,GRIP.y); x.rotate(GRIP.ang+Math.PI/2);
  const kf=vh/FH*BASE*(T.sc||1), inv=1/kf;            // de volta para pixels da tela baixa
  const spr=spriteFor(id,k);
  if(spr){ const im=SPR[spr], w=WP[spr].w, h=WP[spr].h, gy=gripY(spr); x.scale(inv*SPRS*vh/270,inv*SPRS*vh/270); x.drawImage(im,-w/2,-gy); }
  else { x.scale(inv*vh/270*1.1,inv*vh/270*1.1); F.setG(x); F.weaponArt(id,k); }
  x.restore(); return sample(big,vw,vh); }
function sample(big,vw,vh){ const out=canv(null,vw,vh), o=out.getContext('2d'), src=big.getContext('2d').getImageData(0,0,vw*SS,vh*SS).data, d=o.createImageData(vw,vh);
  for(let y=0;y<vh;y++) for(let X=0;X<vw;X++){ const q=(y*vw+X)*4, s=((y*SS+1)*vw*SS+X*SS+1)*4; d.data[q]=src[s]; d.data[q+1]=src[s+1]; d.data[q+2]=src[s+2]; d.data[q+3]=src[s+3]>120?255:0; } o.putImageData(d,0,0); return out; }
const GY={}; function gripY(k){ if(GY[k]!=null) return GY[k]; const im=SPR[k], c=document.createElement('canvas'); c.width=im.width; c.height=im.height; const x=c.getContext('2d'); x.drawImage(im,0,0); const d=x.getImageData(0,0,c.width,c.height).data;
  let best=0, br=Math.floor(c.height*.6); for(let y=Math.floor(c.height*.45);y<c.height;y++){ let n=0; for(let X=0;X<c.width;X++) if(d[(y*c.width+X)*4+3]>0) n++; if(n>best){ best=n; br=y; } }
  return GY[k]=Math.round((br+c.height)/2); }
function spriteFor(id,k){ if(k==='sword') return /long|broad|claymore|bastard/.test(id)?'long':(/holy|gold|blessed/.test(id)?'gold':'sword'); if(k==='dagger') return 'short'; if(id==='rapier') return 'rapier'; if(/scythe/.test(id)) return 'scythe'; if(k==='wand') return 'wand'; if(/scepter/.test(id)) return 'scepter'; return null; }
// ---------- animações (transformações dos quadros) ----------
const A={
  idle:[{}],
  slashA:[{},{dx:16,dy:-34,rot:.08},{dx:6,dy:-26,rot:.02},{dx:-60,dy:8,rot:-.28},{dx:-110,dy:30,rot:-.45},{dx:-30,dy:8,rot:-.1}],
  slashB:[{},{dx:-100,dy:14,rot:-.4},{dx:-70,dy:6,rot:-.28},{dx:6,dy:-8,rot:.08},{dx:40,dy:-14,rot:.2},{dx:12,rot:.05}],
  chop:[{},{dy:-56,rot:.1},{dy:-50,rot:.06},{dy:14,rot:-.18},{dy:40,rot:-.3},{dy:10,rot:-.06}],
  thrust:[{},{dy:8,sc:1.04},{dx:-40,dy:-26,sc:.88},{dx:-56,dy:-36,sc:.8},{dx:-24,dy:-14,sc:.92},{}],
};
let atk=null, lastCd=0, alt=0, lastW='', swapT=0, cast=null, lastCast=0, frames={}, sig='';
function animFor(k){ if(k==='axe'||k==='mace'||k==='pick') return 'chop'; if(k==='dagger'||k==='pole'||k==='wand'||k==='staff') return 'thrust'; return alt?'slashB':'slashA'; }
function frame(kind,args,vw,vh,C,id){ const W=canv(null,vw,vh), x=W.getContext('2d'); x.clearRect(0,0,vw,vh);
  const hands=canv(null,vw,vh), hx2=hands.getContext('2d'); hx2.clearRect(0,0,vw,vh);
  if(kind==='punch'){ const [r,l]=args; drawHand(hx2,['001','002','003'][r],{},false,vw,vh); if(!C.shield) drawHand(hx2,['001','002','003'][l],{},true,vw,vh); }
  else if(kind==='cast'){ const k=['004','005','006'][args]; drawHand(hx2,k,{},false,vw,vh); drawHand(hx2,k,{},true,vw,vh); }
  else if(kind==='staff'){ drawHand(hx2,['020','021','022'][args.f],{},false,vw,vh); }
  else if(kind==='weapon'){ x.drawImage(weaponLayer(id,args.k,args.T,vw,vh,false),0,0); drawHand(hx2,'001',args.T,false,vw,vh); }
  else if(kind==='bow'){ // arco desenhado + mão esquerda (espelhada) no arco e direita puxando a corda
    const pull=args.pull, big=canv(null,vw*SS,vh*SS), b=big.getContext('2d'); b.save(); b.scale(SS*vh/270,SS*vh/270); b.translate(270*vw/vh/2-40,128); F.setG(b);
    const t=F.bowArt(pull,id), nk=[14+pull*120,pull*50]; F.LN([t.top[0],t.top[1], nk[0],nk[1], t.bot[0],t.bot[1]],'#ece4cc',1.2);
    if(args.arrow){ F.LN([nk[0],nk[1], -14,-2],F.WOODR.l,2.4); F.P([-14,-6, -30,-2, -14,2],F.STEEL.l); }
    b.restore(); x.drawImage(sample(big,vw,vh),0,0);
    const u=vh/270, gx=vw/2-40*u, gy=128*u; fistAt(hx2,gx-4*u,gy+4*u,true,vw,vh,.62); fistAt(hx2,gx+(nk[0]+14)*u,gy+(nk[1]+6)*u,false,vw,vh,.62); }
  if(kind==='weapon'&&C.shield) shieldWith(x,hx2,vw,vh,C,args.T);
  else if(kind==='punch'&&C.shield) shieldWith(x,hx2,vw,vh,C,{});
  toneHands(hands,C,args&&args.key||(kind==='cast'?['004','005','006'][args]:kind==='staff'?['020','021','022'][args.f]:'001'));
  x.drawImage(hands,0,0); outline(W); return W; }
function shieldWith(x,hx2,vw,vh,C,T){ const big=canv(null,vw*SS,vh*SS), b=big.getContext('2d'); const s=vh/270, z=s*SS*1.7; b.save(); b.translate(SS*(vw/2-150*s+(T.rot?-6:0)),SS*(vh-34*s)); b.rotate(.1); b.scale(z,z); F.setG(b); F.shieldBack(C.shield,C); F.shieldStraps(C,null); b.restore();
  x.drawImage(sample(big,vw,vh),0,0); fistAt(hx2,vw/2-150*s+(T.rot?-6:0)-2*1.7*s,vh-34*s-8*1.7*s,true,vw,vh,.62); }
// ---------- desenho na tela ----------
const _old=window.fpHandsDraw;
window.fpHandsDraw=function(ctx,lw,lh,now,light){ if(ready<need) return _old?_old(ctx,lw,lh,now,light):false; if(!player||player.ghost) return false;
  const vw=lw, vh=lh;
  const tool=gathering?(gathering.kind==='tree'?'hatchet':'pickaxe'):null, id=tool||player.weapon, k=F.kind(id), C=F.colors();
  const S=[id,vw,vh,C.S.m,C.G&&C.G.m,C.sleeve.m,C.shield&&C.shield.kind,C.shield&&C.shield.col].join('|'); if(S!==sig){ sig=S; frames={}; }
  if(id!==lastW){ lastW=id; swapT=now; atk=null; }
  const cd=player.atkCd||0; if(cd>lastCd+.05){ alt^=1; const Wp=WEAPONS[player.weapon]||{}; atk={t0:now,dur:Math.max(300,Math.min(560,(Wp.cd||.5)*900)),a:animFor(k)}; } lastCd=cd; if(atk&&now-atk.t0>atk.dur) atk=null;
  const cc=player.castCd||0; if(cc>lastCast+.05) cast={t0:now,dur:640,col:F.spellCol(F.lastSpell()||(WEAPONS[player.weapon]||{}).spell)}; lastCast=cc; if(cast&&now-cast.t0>cast.dur) cast=null;
  let key, make, glow=null, P=atk?(now-atk.t0)/atk.dur:-1;
  if(cast){ const p=(now-cast.t0)/cast.dur, st=p<.18?0:p<.34?1:p<.78?2:p<.9?1:0; key='c'+st; make=()=>frame('cast',st,vw,vh,C,id); if(st===2) glow=cast.col; }
  else if(k==='fists'){ let r=0,l=0; if(P>=0){ const st=P<.2?1:P<.55?2:P<.8?1:0; if(alt||C.shield) r=st; else l=st; } key='p'+r+l; make=()=>frame('punch',[r,l],vw,vh,C,id); }
  else if(k==='staff'){ const f=P<0?0:P<.2?1:P<.6?2:P<.85?1:0; key='s'+f; make=()=>frame('staff',{f},vw,vh,C,id); }
  else if(k==='bow'||k==='xbow'){ let pull=1, arrow=true; if(P>=0){ pull=P<.15?0:Math.round(Math.min(1,(P-.15)/.85)*3)/3; arrow=pull>.3; } key='b'+pull+arrow; make=()=>frame('bow',{pull,arrow},vw,vh,C,id); }
  else { const G=gathering?{a:'chop',t0:now-(now%640),dur:640}:atk; let name='idle', fi=0; if(G){ name=G.a; const L=A[name], p=Math.min(.999,(now-G.t0)/G.dur); fi=Math.min(L.length-1,1+Math.floor(p*(L.length-1))); }
    const T=A[name][fi]; key='w'+name+fi; make=()=>frame('weapon',{k,T},vw,vh,C,id); }
  let fr=frames[key]; if(!fr) fr=frames[key]=make();
  // brilho da magia atrás das mãos
  if(glow){ const cx=canvas.width/2, cy=canvas.height*.42, r=canvas.height*(.07+.012*Math.sin(now/45)); ctx.save(); ctx.globalCompositeOperation='lighter';
    const gr=ctx.createRadialGradient(cx,cy,0,cx,cy,r*2.2); gr.addColorStop(0,`rgba(${glow[1]},1)`); gr.addColorStop(.35,`rgba(${glow[0]},.85)`); gr.addColorStop(1,`rgba(${glow[0]},0)`); ctx.fillStyle=gr; ctx.fillRect(cx-r*2.4,cy-r*2.4,r*4.8,r*4.8);
    const px=Math.max(2,canvas.height/135|0); ctx.fillStyle=`rgba(${glow[1]},1)`; for(let i=0;i<10;i++){ const a=now/220+i*.63, d=r*(1.3+.5*Math.sin(now/90+i)); ctx.fillRect((cx+Math.cos(a)*d)|0,(cy+Math.sin(a)*d*.7)|0,px,px); } ctx.restore(); }
  const walk=player.moving?Math.sin(player.phase||now/130):0, swap=Math.min(1,(now-swapT)/260);
  const bx=Math.round(walk*4), by=Math.round(Math.abs(walk)*4+Math.sin(now/900)*1.5+(1-swap)*100);
  const Lb=Math.max(.3,Math.min(1.05,light.b)); ctx.save(); ctx.imageSmoothingEnabled=false; if(Lb<.98) ctx.filter=`brightness(${Lb.toFixed(2)})${light.warm>.3?' sepia(.25)':''}`;
  const sx=canvas.width/vw, sy=canvas.height/vh; ctx.drawImage(fr,0,0,vw,vh,bx*sx,by*sy,canvas.width,canvas.height); ctx.restore(); return true; };
window.fpHands2Dbg=()=>({atk,cast,frames:Object.keys(frames).length,ready,need});
})();

// =====================================================================
// PRIMEIRA PESSOA — braço, mãos e armas na tela (desenhados em pixel art, animados)
// Desenhado numa tela pequena do mesmo tamanho do 3D e ampliado sem suavizar, com as bordas
// "endurecidas" para ficar com cara de sprite. Cada tipo de arma tem pose, golpe e desenho próprios.
// =====================================================================
(function(){
if(typeof fpOn!=='function') return;
const lc=document.createElement('canvas'), g=lc.getContext('2d');
const STEEL=['#5e646e','#9aa0aa','#c9cdd4','#eef1f5'], IRON=['#3e4046','#62666e','#8a8e96','#b4b8c0'];
const WOOD=['#3a2414','#5a3a20','#7a5232','#9a6e44'], LEATH=['#24160e','#3a2618','#523822'], BRASS=['#6a4e1a','#a07c30','#d4b25a','#f0dc94'];
const spellCol=id=>{ id=id||''; if(/fire|ember|naphtha|flame|burn|fogo/.test(id)) return ['#ff7a20','#ffd27a']; if(/frost|cold|ice|gelo|tear/.test(id)) return ['#5ab4ff','#d8f0ff'];
  if(/storm|nail|spark/.test(id)) return ['#a8c8ff','#ffffff']; if(/resin|mire|lime|dust|blind|bind/.test(id)) return ['#9ab040','#e8f0a0']; return ['#f0c040','#fff6c8']; };
// ---------- tipo de arma ----------
function kind(id){ const W=WEAPONS[id]||{};
  if(id==='fists'||!WEAPONS[id]) return 'fists'; if(id==='bow'||id==='longbow') return 'bow'; if(/crossbow/.test(id)) return 'xbow';
  if(W.spell||id==='staff') return id==='wand'?'wand':'staff'; if(id==='spear'||id==='pike') return 'spear'; if(id==='halberd'||id==='scythe') return 'pole';
  if(id==='dagger') return 'dagger'; if(id==='rapier') return 'rapier';
  if(W.skill==='machados') return 'axe'; if(W.skill==='macas') return 'mace'; return 'sword'; }
// ---------- estado da animação ----------
let atk=null, cast=null, lastCd=0, lastCast=0, lastSpell=null, alt=0, lastW=null, swapT=0;
if(typeof castSpell==='function'){ const _cs=castSpell; castSpell=function(id){ lastSpell=id; return _cs.apply(this,arguments); }; }
function watch(now){
  if(player.weapon!==lastW){ lastW=player.weapon; swapT=now; atk=null; }
  const cd=player.atkCd||0; if(cd>lastCd+.05){ const Wp=WEAPONS[player.weapon]||{}; alt^=1; atk={t0:now,dur:Math.max(260,Math.min(560,(Wp.cd||.5)*900)),alt,ranged:!!Wp.ranged}; } lastCd=cd;
  const cc=player.castCd||0; if(cc>lastCast+.05) cast={t0:now,dur:520,col:spellCol(lastSpell||(WEAPONS[player.weapon]||{}).spell)}; lastCast=cc;
  if(atk&&now-atk.t0>atk.dur) atk=null; if(cast&&now-cast.t0>cast.dur) cast=null; }
const ease=t=>1-Math.pow(1-t,3), lerp=(a,b,t)=>a+(b-a)*t;
// ---------- primitivas ----------
function poly(pts,fill){ g.beginPath(); g.moveTo(pts[0],pts[1]); for(let k=2;k<pts.length;k+=2) g.lineTo(pts[k],pts[k+1]); g.closePath(); g.fillStyle=fill; g.fill(); }
function rect(x,y,w,h,c){ g.fillStyle=c; g.fillRect(x,y,w,h); }
function ell(x,y,rx,ry,c){ g.beginPath(); g.ellipse(x,y,Math.max(.5,rx),Math.max(.5,ry),0,0,Math.PI*2); g.fillStyle=c; g.fill(); }
// lâmina reta: do cabo (y=0) até a ponta (y=-L)
function blade(L,w,P,curve){ const c=curve||0;
  poly([-w/2,0, -w/2+c*.3,-L*.7, c*.2,-L, w/2+c*.3,-L*.72, w/2,0],P[1]);          // corpo
  poly([0,0, c*.25,-L*.72, c*.2,-L, w/2+c*.3,-L*.72, w/2,0],P[2]);                 // face clara
  poly([w/2-1.2,0, w/2+c*.3-1.2,-L*.72, c*.2,-L+1, w/2+c*.3,-L*.72, w/2,0],P[3]);   // fio
  rect(-.6,-L*.62,1.2,L*.6,P[0]); }                                                // sulco
function grip(len,w){ rect(-w/2,0,w,len,LEATH[1]); for(let y=1;y<len;y+=3) rect(-w/2,y,w,1,LEATH[0]); rect(-w/2,0,1,len,LEATH[2]); }
function haft(len,w,top){ rect(-w/2,-top,w,len+top,WOOD[1]); rect(-w/2,-top,1.2,len+top,WOOD[3]); rect(w/2-1.2,-top,1.2,len+top,WOOD[0]);
  for(let y=-top+6;y<len;y+=11) rect(-w/2,y,w,1,WOOD[0]); }
// ---------- desenho de cada arma (cabo na origem, ponta para cima) ----------
function drawWeapon(id,k,t){
  const W=WEAPONS[id]||{}, L=(W.len||10)*7.5;
  if(k==='sword'||k==='dagger'||k==='rapier'){
    const len=k==='dagger'?40:k==='rapier'?L*1.15:L, w=k==='rapier'?4:k==='dagger'?8:(id==='falchion'?13:id==='longsword'||id==='broadsword'?11:10);
    const curve=id==='scimitar'?14:id==='falchion'?7:0;
    grip(18,6); ell(0,19,4.5,3.5,BRASS[1]); ell(-1,18,2,1.5,BRASS[3]);
    blade(len,w,STEEL,curve);
    if(k==='rapier'){ g.strokeStyle=BRASS[2]; g.lineWidth=1.6; g.beginPath(); g.arc(4,4,8,-1.2,1.9); g.stroke(); g.beginPath(); g.arc(-3,2,6,1.4,4.2); g.stroke(); }
    const gw=k==='dagger'?16:k==='rapier'?14:26; rect(-gw/2,-3,gw,5,BRASS[1]); rect(-gw/2,-3,gw,1.5,BRASS[3]); rect(-gw/2,1,gw,1,BRASS[0]); ell(-gw/2,-.5,2.5,3,BRASS[2]); ell(gw/2,-.5,2.5,3,BRASS[2]);
    return; }
  if(k==='axe'){ const hl=L*.95; haft(26,6,hl); const db=id==='double_axe', big=id==='battleaxe'||db;
    const hw=big?28:20, hh=big?34:24, y0=-hl+4;
    const head=(s)=>{ poly([0,y0, s*hw*.55,y0-hh*.18, s*hw,y0-hh*.55, s*hw*1.05,y0+hh*.05, s*hw,y0+hh*.55, s*hw*.55,y0+hh*.28, 0,y0+hh*.2],IRON[1]);
      poly([s*hw*.7,y0-hh*.42, s*hw,y0-hh*.55, s*hw*1.05,y0+hh*.05, s*hw,y0+hh*.55, s*hw*.7,y0+hh*.4],STEEL[2]); poly([s*hw*.95,y0-hh*.5, s*hw,y0-hh*.55, s*hw*1.05,y0+hh*.05, s*hw,y0+hh*.55, s*hw*.95,y0+hh*.45],STEEL[3]); };
    head(-1); if(db) head(1); else poly([0,y0-4, 12,y0-1, 0,y0+6],IRON[0]);
    rect(-4.5,y0-6,9,14,IRON[2]); rect(-4.5,y0-6,9,2,IRON[3]); return; }
  if(k==='mace'){ const hl=L*.85; if(id==='club'){ poly([-3,26, -7,-hl, 0,-hl-6, 7,-hl, 3,26],WOOD[1]); poly([1,26, 3,-hl, 0,-hl-6, 7,-hl, 3,26],WOOD[2]); for(let k2=0;k2<5;k2++) ell(-3+((k2*5)%9),-hl*.4-k2*9,1.6,1.2,WOOD[0]); return; }
    haft(26,5.5,hl); grip(14,6.5);
    if(id==='flail'){ const sw=Math.sin(t/140)*6; g.strokeStyle=IRON[2]; g.lineWidth=1.5; for(let k2=0;k2<6;k2++){ g.beginPath(); g.arc(sw*k2/6,-hl-4-k2*4,1.8,0,7); g.stroke(); }
      const bx=sw, by=-hl-30; for(let a=0;a<6.28;a+=.785) poly([bx+Math.cos(a)*7,by+Math.sin(a)*7, bx+Math.cos(a+.2)*13,by+Math.sin(a+.2)*13, bx+Math.cos(a+.4)*7,by+Math.sin(a+.4)*7],IRON[1]);
      ell(bx,by,9,9,IRON[1]); ell(bx-2.5,by-2.5,4,4,IRON[3]); return; }
    if(id==='morningstar'){ const by=-hl-8; for(let a=0;a<6.28;a+=.63) poly([Math.cos(a)*8,by+Math.sin(a)*8, Math.cos(a+.15)*15,by+Math.sin(a+.15)*15, Math.cos(a+.3)*8,by+Math.sin(a+.3)*8],STEEL[2]); ell(0,by,10,10,IRON[1]); ell(-3,by-3,4.5,4.5,IRON[3]); return; }
    if(id==='warhammer'){ const y0=-hl; rect(-16,y0-8,24,15,IRON[1]); rect(-16,y0-8,24,3,IRON[3]); rect(-16,y0+5,24,2,IRON[0]); poly([8,y0-6, 22,y0, 8,y0+6],STEEL[2]); poly([-3,y0-8, 0,y0-20, 3,y0-8],STEEL[2]); return; }
    if(/staff/.test(id)||id==='staff') return;
    const y0=-hl-4; for(let k2=-3;k2<=3;k2++){ const x=k2*3.2; poly([x-1.6,y0+10, x,y0-12, x+1.6,y0+10],k2<0?IRON[1]:k2===0?IRON[3]:IRON[2]); }
    rect(-6,y0+8,12,4,IRON[2]); ell(0,y0-12,3,2.5,IRON[3]); return; }
  if(k==='staff'||k==='wand'){ const hl=k==='wand'?30:L*.72; if(k==='wand'){ poly([-2.5,22, -1.6,-hl, 1.6,-hl, 2.5,22],'#3a2a4a'); rect(-1,-hl,1,hl+20,'#6a5a7a'); }
    else { haft(60,6,hl); ell(0,-hl+20,4.6,2.6,WOOD[0]); ell(0,-hl*.45,4.4,2.4,WOOD[0]); }
    const sp=W.spell, gc=sp==='fogo'?['#ff6a1a','#ffd27a']:sp==='gelo'?['#4aa8ff','#e0f6ff']:sp==='luz'?['#f0c040','#fff6d0']:sp==='arcano'?['#b080ff','#efe0ff']:null;
    const pul=1+Math.sin(t/180)*.12;
    if(sp==='luz'){ rect(-2.5,-hl-28,5,30,BRASS[2]); rect(-11,-hl-20,22,5,BRASS[2]); rect(-2.5,-hl-28,1.5,30,BRASS[3]); rect(-11,-hl-20,22,1.5,BRASS[3]); ell(0,-hl-17.5,4*pul,4*pul,gc[1]); return; }
    if(k==='staff'&&!gc){ poly([-6,-hl+2, -8,-hl-10, -2,-hl-16, 4,-hl-14, 7,-hl-4, 5,-hl+3],WOOD[1]); ell(-1,-hl-8,3,2,WOOD[0]); return; }
    if(k==='staff'){ poly([-5,-hl+2, -7,-hl-8, 0,-hl-4, 7,-hl-8, 5,-hl+2],WOOD[0]); }
    const cy=k==='wand'?-hl-3:-hl-12, r=(k==='wand'?3.5:7)*pul; ell(0,cy,r*1.6,r*1.6,gc[0]+'55'); poly([0,cy-r*1.4, r,cy, 0,cy+r*1.2, -r,cy],gc[0]); poly([0,cy-r*1.4, r*.5,cy-r*.2, 0,cy+r*.4, -r*.4,cy],gc[1]); return; }
  if(k==='spear'||k==='pole'){ const hl=L*.78; haft(70,6,hl);
    if(k==='spear'||id==='halberd'){ const y0=-hl; poly([-5,y0, 0,y0-30, 5,y0],STEEL[1]); poly([0,y0, 0,y0-30, 5,y0],STEEL[2]); poly([3.5,y0, 0,y0-30, 5,y0],STEEL[3]); rect(-3.5,y0,7,7,IRON[2]); }
    if(id==='halberd'){ const y0=-hl+14; poly([-3,y0-4, -24,y0-12, -27,y0+6, -24,y0+20, -3,y0+10],IRON[1]); poly([-18,y0-10, -24,y0-12, -27,y0+6, -24,y0+20, -18,y0+16],STEEL[2]); poly([3,y0, 14,y0+4, 3,y0+8],IRON[2]); }
    if(id==='scythe'){ const y0=-hl; g.beginPath(); g.moveTo(2,y0); g.quadraticCurveTo(-30,y0-16,-58,y0+14); g.quadraticCurveTo(-30,y0-4,2,y0+8); g.closePath(); g.fillStyle=STEEL[1]; g.fill();
      g.beginPath(); g.moveTo(2,y0); g.quadraticCurveTo(-30,y0-16,-58,y0+14); g.quadraticCurveTo(-30,y0-10,2,y0+3); g.closePath(); g.fillStyle=STEEL[3]; g.fill(); }
    return; }
}
// ---------- mão (punho fechado em volta do cabo), visto de trás pela direita ----------
function fist(s,side,open,col){ const sk=col.skin, sd=col.skinD, sl=col.sleeve, sld=col.sleeveD, mt=col.metal;
  g.save(); g.scale(side,1);
  if(open){ // palma aberta (magia): dedos esticados para cima
    poly([-10,10, -12,-6, -6,-12, 8,-12, 13,-4, 11,12],mt?mt[1]:sk);
    for(let k=0;k<4;k++){ const x=-10+k*5.2, top=-27+Math.abs(k-1.4)*3.4, c=mt?mt[2]:sk; rect(x,top+2,5.4,22-Math.abs(k-1.4)*2,c); ell(x+2.7,top+2.5,2.7,2.5,c); if(k<3) rect(x+5,top+6,1,12,mt?mt[0]:sd); rect(x+1,top+9,3,1,mt?mt[0]:sd); }
    poly([11,0, 20,-8, 22,-4, 14,6],mt?mt[2]:sk); g.restore(); return; }
  // costas da mão + dedos dobrados por cima do cabo
  poly([-12,-4, -9,-12, 6,-13, 13,-6, 13,10, -11,12],mt?mt[1]:sk);
  for(let k=0;k<4;k++){ const y=-10+k*5.2; ell(-11,y+2,4.2,2.8,mt?mt[2]:sk); rect(-15,y+3.6,6,1,mt?mt[0]:sd); }
  poly([6,-13, 13,-6, 13,10, 8,11, 8,-8],mt?mt[0]:sd);                         // sombra lateral
  poly([-9,-12, -4,-19, 2,-17, 0,-10],mt?mt[2]:sk); rect(-6,-18,3,2,mt?mt[3]:col.skinL); // polegar
  if(mt){ for(let k=0;k<3;k++) rect(-10,-10+k*7,20,1,mt[0]); }
  g.restore(); }
function forearm(hx,hy,ex,ey,w0,w1,col){ // do cotovelo (fora da tela) até o pulso
  const dx=hx-ex, dy=hy-ey, L=Math.hypot(dx,dy)||1, nx=-dy/L, ny=dx/L;
  poly([ex+nx*w0,ey+ny*w0, hx+nx*w1,hy+ny*w1, hx-nx*w1,hy-ny*w1, ex-nx*w0,ey-ny*w0],col.sleeve);
  poly([ex+nx*w0*.2,ey+ny*w0*.2, hx+nx*w1*.2,hy+ny*w1*.2, hx-nx*w1,hy-ny*w1, ex-nx*w0,ey-ny*w0],col.sleeveD);
  for(let k=1;k<4;k++){ const f=k/4.4, cx=ex+dx*f, cy=ey+dy*f, w=lerp(w0,w1,f)*.8; g.strokeStyle=col.sleeveD; g.lineWidth=1.3; g.beginPath(); g.moveTo(cx+nx*w,cy+ny*w); g.lineTo(cx+nx*w*.2+dx*.03,cy+ny*w*.2+dy*.03); g.stroke(); }
  const cx=hx-dx/L*7, cy=hy-dy/L*7; poly([cx+nx*w1*1.12,cy+ny*w1*1.12, hx+nx*w1*1.05,hy+ny*w1*1.05, hx-nx*w1*1.05,hy-ny*w1*1.05, cx-nx*w1*1.12,cy-ny*w1*1.12],col.cuff); }
// ---------- cores do herói ----------
function colors(){ const L=player.look||{}, sk=L.skin||'#e0b48e'; const body=player.equip&&player.equip.body, Wr=body&&WEAR[body];
  const sleeve=(Wr&&Wr.col)||L.jacket||'#6a4a30', metal=Wr&&Wr.armor>=.3?STEEL:null;
  return {skin:sk, skinD:darkHex(sk,.72), skinL:'#ffffff30', sleeve, sleeveD:darkHex(sleeve,.68), cuff:metal?IRON[2]:darkHex(sleeve,.5), metal}; }
// ---------- pose e desenho do quadro ----------
function draw(now,lw,lh){
  const s=lh/(innerHeight<520?170:135), k=kind(player.weapon), col=colors(); watch(now);
  const walk=player.moving?Math.sin(player.phase||0):0, bobX=walk*3*s, bobY=Math.abs(walk)*3*s+Math.sin(now/900)*1.2*s;
  const swap=Math.min(1,(now-swapT)/280), drop=(1-ease(swap))*90*s;
  let hx=lw/2+62*s+bobX, hy=lh-26*s+bobY+drop, a=-.32, sc=1, lhand=null;
  const p=atk?(now-atk.t0)/atk.dur:-1;
  if(k==='sword'||k==='axe'||k==='mace'||k==='dagger'||k==='rapier'){
    const chop=k==='axe'||k==='mace';
    if(k==='dagger'||k==='rapier'){ a=-.5; hx-=8*s; if(p>=0){ const f=p<.3?ease(p/.3):p<.5?1:1-ease((p-.5)/.5); hx=lerp(hx,lw/2+22*s,f); hy=lerp(hy,lh*.62,f); sc=lerp(1,.72,f); a=lerp(-.5,-.15,f); } }
    else if(p>=0){ let px,py,pa;
      if(chop||atk.alt){ // golpe de cima para baixo (machado, maça) ou diagonal da direita para a esquerda
        const up=chop?[lw/2+40*s,lh*.42,.25]:[lw/2+95*s,lh*.48,.55], dn=chop?[lw/2-5*s,lh*.92,-1.0]:[lw/2-60*s,lh*.88,-1.75];
        if(p<.28){ const f=ease(p/.28); px=lerp(hx,up[0],f); py=lerp(hy,up[1],f); pa=lerp(a,up[2],f); }
        else if(p<.55){ const f=ease((p-.28)/.27); px=lerp(up[0],dn[0],f); py=lerp(up[1],dn[1],f); pa=lerp(up[2],dn[2],f); }
        else { const f=ease((p-.55)/.45); px=lerp(dn[0],hx,f); py=lerp(dn[1],hy,f); pa=lerp(dn[2],a,f); } }
      else { // corte de volta, da esquerda para a direita
        const st=[lw/2-30*s,lh*.55,-1.4], en=[lw/2+110*s,lh*.9,.9];
        if(p<.25){ const f=ease(p/.25); px=lerp(hx,st[0],f); py=lerp(hy,st[1],f); pa=lerp(a,st[2],f); }
        else if(p<.55){ const f=ease((p-.25)/.3); px=lerp(st[0],en[0],f); py=lerp(st[1],en[1],f); pa=lerp(st[2],en[2],f); }
        else { const f=ease((p-.55)/.45); px=lerp(en[0],hx,f); py=lerp(en[1],hy,f); pa=lerp(en[2],a,f); } }
      hx=px; hy=py; a=pa; }
  } else if(k==='spear'||k==='pole'){ a=k==='spear'?-.95:-.7; hx=lw/2+78*s+bobX; hy=lh-22*s+bobY+drop;
    if(p>=0){ const f=p<.3?ease(p/.3):p<.45?1:1-ease((p-.45)/.55);
      if(k==='spear'){ hx=lerp(hx,lw/2+38*s,f); hy=lerp(hy,lh-58*s,f); sc=lerp(1,.78,f); a=lerp(a,-.8,f); }
      else { a=lerp(a,-1.55,f); hx=lerp(hx,lw/2+90*s,f); hy=lerp(hy,lh-60*s,f); } }
    const d=38*sc; lhand=[hx+Math.sin(a)*d*s, hy-Math.cos(a)*d*s]; }
  else if(k==='staff'||k==='wand'){ a=-.12; hx=lw/2+84*s+bobX; if(k==='wand'){ a=-.4; } if(p>=0){ const f=p<.35?ease(p/.35):1-ease((p-.35)/.65); hx=lerp(hx,lw/2+40*s,f); hy=lerp(hy,lh-55*s,f); a=lerp(a,-.6,f); } }
  // ---- desenha ----
  g.setTransform(1,0,0,1,0,0); g.clearRect(0,0,lw,lh);
  const castP=cast?(now-cast.t0)/cast.dur:-1;
  if(k==='bow'){ bow(lw,lh,s,p,bobX,bobY+drop,col,now); }
  else if(k==='xbow'){ xbow(lw,lh,s,p,bobX,bobY+drop,col); }
  else if(k==='fists'){ for(const side of [1,-1]){ let fx=lw/2+side*56*s+bobX*side, fy=lh-22*s+bobY+drop; const mine=atk&&(atk.alt?1:-1)===side;
      if(mine){ const f=p<.35?ease(p/.35):1-ease((p-.35)/.65); fx=lerp(fx,lw/2+side*8*s,f); fy=lerp(fy,lh*.55,f); }
      const sz=mine?lerp(1,.75,p<.35?ease(p/.35):1-ease((p-.35)/.65)):1;
      forearm(fx,fy+10*s*sz,fx+side*80*s,lh+60*s,22*s,12*s*sz,col); g.save(); g.translate(fx,fy); g.scale(s*1.3*sz,s*1.3*sz); g.rotate(side*-.12); fistFront(side,col); g.restore(); } }
  else {
    if(lhand&&castP<0){ forearm(lhand[0],lhand[1]+8*s,lhand[0]-30*s,lh+70*s,20*s,11*s,col); }
    g.save(); g.translate(hx,hy); g.rotate(a); g.scale(s*sc,s*sc); drawWeapon(player.weapon,k,now); g.restore();
    if(lhand&&castP<0){ g.save(); g.translate(lhand[0],lhand[1]); g.rotate(a); g.scale(s,s); fist(1,-1,false,col); g.restore(); }
    forearm(hx+6*s*sc,hy+12*s*sc,hx+95*s,lh+70*s,24*s,12*s*sc,col);
    g.save(); g.translate(hx,hy); g.rotate(a*.6); g.scale(s*sc,s*sc); fist(1,1,false,col); g.restore();
  }
  // mão da magia (esquerda): sobe aberta com a luz da cor do feitiço
  if(castP>=0&&k!=='fists'){ const f=castP<.3?ease(castP/.3):castP<.6?1:1-ease((castP-.6)/.4), mx=lerp(lw/2-110*s,lw/2-50*s,f), my=lerp(lh+40*s,lh*.62,f);
    forearm(mx,my+16*s,mx-60*s,lh+70*s,22*s,12*s,col); g.save(); g.translate(mx,my); g.scale(s*1.2,s*1.2); g.rotate(.15); fist(1,-1,true,col); g.restore();
    const r=(10+Math.sin(now/40)*2)*s*f; g.fillStyle=cast.col[0]; g.beginPath(); g.arc(mx-2*s,my-30*s,r,0,7); g.fill(); g.fillStyle=cast.col[1]; g.beginPath(); g.arc(mx-2*s,my-30*s,r*.55,0,7); g.fill();
    for(let q=0;q<6;q++){ const an=now/200+q*1.05, rr=r*1.8; rect(mx-2*s+Math.cos(an)*rr,my-30*s+Math.sin(an)*rr,2*s,2*s,cast.col[1]); } }
  return k; }
function bow(lw,lh,s,p,bx,by,col,now){ // arco em pé na mão esquerda; a direita puxa a corda para perto do rosto
  const gx=lw/2-34*s+bx, gy=lh*.6+by, H=170*s; let pull=1; if(p>=0) pull=p<.12?0:ease((p-.12)/.88);
  const nx=lerp(gx+10*s,lw/2+70*s,pull)+bx*.3, ny=lerp(gy,lh-18*s,pull);           // ponto da corda/mão direita
  const top=[gx+10*s,gy-H/2], bot=[gx+16*s,gy+H/2], bend=lerp(8,26,pull)*s;
  g.lineWidth=8*s; g.strokeStyle=WOOD[0]; g.beginPath(); g.moveTo(top[0],top[1]); g.quadraticCurveTo(gx-bend,gy,bot[0],bot[1]); g.stroke();
  g.lineWidth=5*s; g.strokeStyle=WOOD[2]; g.beginPath(); g.moveTo(top[0],top[1]+2*s); g.quadraticCurveTo(gx-bend+1*s,gy,bot[0],bot[1]-2*s); g.stroke();
  g.lineWidth=1.6*s; g.strokeStyle=WOOD[3]; g.beginPath(); g.moveTo(top[0]+1*s,top[1]+6*s); g.quadraticCurveTo(gx-bend+2.5*s,gy,bot[0]+1*s,bot[1]-6*s); g.stroke();
  g.lineWidth=1.3*s; g.strokeStyle='#e8e0c8'; g.beginPath(); g.moveTo(top[0],top[1]); g.lineTo(nx,ny); g.lineTo(bot[0],bot[1]); g.stroke();
  if(pull>.25||p<0){ const tx=gx-2*s, ty=gy-2*s; g.lineWidth=3*s; g.strokeStyle=WOOD[2]; g.beginPath(); g.moveTo(nx,ny); g.lineTo(tx,ty); g.stroke();
    const an=Math.atan2(ty-ny,tx-nx); g.save(); g.translate(tx,ty); g.rotate(an); poly([0,-4*s, 12*s,0, 0,4*s],STEEL[2]); poly([0,0, 12*s,0, 0,4*s],STEEL[1]); g.restore();
    g.save(); g.translate(nx,ny); g.rotate(an); poly([2*s,0, 16*s,-7*s, 20*s,-7*s, 8*s,0],'#e8e4dc'); poly([2*s,0, 16*s,7*s, 20*s,7*s, 8*s,0],'#c8c0b0'); g.restore(); }
  rect(gx-8*s,gy-10*s,12*s,20*s,LEATH[1]);
  forearm(gx-6*s,gy+8*s,gx-90*s,lh+60*s,20*s,11*s,col); g.save(); g.translate(gx-4*s,gy); g.scale(s*1.15,s*1.15); g.rotate(-.1); fist(1,-1,false,col); g.restore();
  forearm(nx+6*s,ny+8*s,nx+80*s,lh+70*s,22*s,12*s,col); g.save(); g.translate(nx+4*s,ny); g.scale(s*1.2,s*1.2); g.rotate(-.9); fist(1,1,false,col); g.restore(); }
// punho fechado de frente (luta sem armas): costas da mão, nós dos dedos para cima
function fistFront(side,col){ const sk=col.metal?col.metal[1]:col.skin, sd=col.metal?col.metal[0]:col.skinD, hi=col.metal?col.metal[3]:'#ffffff'; g.save(); g.scale(side,1);
  poly([-14,-6, -12,-14, 12,-14, 15,-6, 14,12, -12,13],sk);
  for(let k=0;k<4;k++){ const x=-10+k*6.6; ell(x,-14,3.6,3,sk); rect(x-1,-16.5,2,1,hi+'90'); rect(x+3,-12,1,9,sd); }
  poly([8,-14, 15,-6, 14,12, 9,13],sd); poly([-14,-2, -6,-6, 4,-4, 4,1, -12,4],sd); poly([-13,-3, -6,-7, 3,-5, 3,-1, -12,2],sk); g.restore(); }
function xbow(lw,lh,s,p,bx,by,col){ const cx=lw/2+30*s+bx, cy=lh-40*s+by; let rec=0, loaded=true; if(p>=0){ rec=p<.15?ease(p/.15):Math.max(0,1-(p-.15)*3); loaded=p>.8; }
  const y=cy+rec*14*s; poly([cx-8*s,lh+10*s, cx-5*s,y-40*s, cx+5*s,y-40*s, cx+10*s,lh+10*s],WOOD[1]); poly([cx,lh+10*s, cx,y-40*s, cx+5*s,y-40*s, cx+10*s,lh+10*s],WOOD[2]);
  g.lineWidth=6*s; g.strokeStyle=IRON[1]; g.beginPath(); g.moveTo(cx-55*s,y-28*s); g.quadraticCurveTo(cx,y-50*s,cx+55*s,y-28*s); g.stroke();
  g.lineWidth=1.2*s; g.strokeStyle='#d8d0b8'; g.beginPath(); g.moveTo(cx-55*s,y-28*s); g.lineTo(cx,loaded?y-6*s:y-40*s); g.lineTo(cx+55*s,y-28*s); g.stroke();
  if(loaded){ rect(cx-1.5*s,y-46*s,3*s,40*s,WOOD[3]); poly([cx-4*s,y-46*s, cx,y-54*s, cx+4*s,y-46*s],STEEL[2]); }
  forearm(cx-14*s,y+20*s,cx-90*s,lh+60*s,20*s,11*s,col); g.save(); g.translate(cx-14*s,y+12*s); g.scale(s,s); fist(1,-1,false,col); g.restore();
  forearm(cx+14*s,y+34*s,cx+90*s,lh+60*s,22*s,12*s,col); g.save(); g.translate(cx+14*s,y+30*s); g.scale(s,s); fist(1,1,false,col); g.restore(); }
// ---------- bordas duras + luz do ambiente ----------
function finish(lw,lh,light){ const im=g.getImageData(0,0,lw,lh), d=im.data, b=light.b, wr=light.warm;
  for(let q=0;q<d.length;q+=4){ const A=d[q+3]; if(!A) continue; if(A<110){ d[q+3]=0; continue; } d[q+3]=255; const f=255/A;
    d[q]=Math.min(255,d[q]*f*b*(1+wr*.25)); d[q+1]=Math.min(255,d[q+1]*f*b*(1+wr*.08)); d[q+2]=Math.min(255,d[q+2]*f*b*(1-wr*.15)); }
  const o=new Uint8ClampedArray(d), ol=[Math.round(18*b),Math.round(12*b),Math.round(10*b)];
  for(let y=1;y<lh-1;y++) for(let x=1;x<lw-1;x++){ const q=(y*lw+x)*4; if(d[q+3]) continue;
    if(d[q+7]||d[q-1]||d[q+lw*4+3]||d[q-lw*4+3]){ o[q]=ol[0]; o[q+1]=ol[1]; o[q+2]=ol[2]; o[q+3]=255; } }
  im.data.set(o); g.putImageData(im,0,0); }
window.fpViewDbg=()=>({atk,cast,lastCd,k:kind(player.weapon)});
window.fpViewDraw=function(ctx,lw,lh,now,light){ if(!player||player.ghost) return; if(lc.width!==lw||lc.height!==lh){ lc.width=lw; lc.height=lh; }
  draw(now,lw,lh); finish(lw,lh,light||{b:1,warm:0});
  ctx.save(); ctx.imageSmoothingEnabled=false; ctx.drawImage(lc,0,0,canvas.width,canvas.height); ctx.restore(); };
})();

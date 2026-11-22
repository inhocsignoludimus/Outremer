// =====================================================================
// PRIMEIRA PESSOA — mãos e armas DESENHADAS (pixel art estilo Daggerfall)
// Cada quadro é pintado em camadas de cor chapada (luz, meio-tom, sombra, brilho), com contorno escuro,
// numa tela 3x maior e reduzido pegando o pixel do meio (sem borrar). Os quadros do golpe são poucos e
// fixos, trocados em sequência como nos jogos antigos; ficam guardados depois de desenhados.
// =====================================================================
(function(){
if(typeof fpOn!=='function') return;
const SS=3, Z=2.0;           // Z = tamanho do desenho                                  // supersampling da pintura
// ---------- cores ----------
const hx=c=>{ c=c.replace('#',''); if(c.length===3) c=c.split('').map(q=>q+q).join(''); return [parseInt(c.slice(0,2),16),parseInt(c.slice(2,4),16),parseInt(c.slice(4,6),16)]; };
const rgb=(a,f,add)=>`rgb(${Math.max(0,Math.min(255,a[0]*f+(add||0)))|0},${Math.max(0,Math.min(255,a[1]*f+(add||0)))|0},${Math.max(0,Math.min(255,a[2]*f+(add||0)))|0})`;
function ramp(c){ const a=hx(c); return {d:rgb(a,.48),s:rgb(a,.7),m:rgb(a,.9),l:rgb(a,1.05,8),h:rgb(a,1.15,34)}; }
const STEEL={d:'#3c424c',s:'#68707c',m:'#9aa2ae',l:'#c4cad4',h:'#f2f4f8'}, BRASS={d:'#5a3e14',s:'#8a6424',m:'#b48a3a',l:'#d8b25e',h:'#fbe9a8'};
const LEATH={d:'#1e120a',s:'#3a2414',m:'#5a3820',l:'#7a5230',h:'#a87c4c'}, WOODR={d:'#2e1a0c',s:'#4e2e16',m:'#6e4424',l:'#8e5c34',h:'#b4804c'}, IRONR={d:'#2a2c30',s:'#44474e',m:'#62666e',l:'#8a8e96',h:'#c0c4ca'};
// ---------- primitivas de pintura ----------
let g=null;
const P=(pts,c)=>{ g.beginPath(); g.moveTo(pts[0],pts[1]); for(let i=2;i<pts.length;i+=2) g.lineTo(pts[i],pts[i+1]); g.closePath(); g.fillStyle=c; g.fill(); };
const E=(x,y,rx,ry,c,a)=>{ g.beginPath(); g.ellipse(x,y,Math.max(.3,rx),Math.max(.3,ry),a||0,0,7); g.fillStyle=c; g.fill(); };
const R=(x,y,w,h,c)=>{ g.fillStyle=c; g.fillRect(x,y,w,h); };
const LN=(pts,c,w)=>{ g.beginPath(); g.moveTo(pts[0],pts[1]); for(let i=2;i<pts.length;i+=2) g.lineTo(pts[i],pts[i+1]); g.strokeStyle=c; g.lineWidth=w||.6; g.lineCap='round'; g.lineJoin='round'; g.stroke(); };
const RR=(x,y,w,h,r,c)=>{ g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); g.fillStyle=c; g.fill(); };
const clip=(fn,draw)=>{ g.save(); fn(); g.clip(); draw(); g.restore(); };
// ---------- MÃO DIREITA fechada num cabo vertical, vista de trás (costas da mão para a direita) ----------
// origem = centro do cabo dentro do punho; unidades = pixels finais
function fist(S,glove,metal){ const K=glove||S, nail=glove?null:'#e9b7a8';
  // massa da mão (costas/lateral da palma) do lado direito, descendo até o pulso
  const M0=[-2,-11, 7,-13, 14,-10, 18,-3, 19,6, 18,14, 15,21, 6,21, 1,15, -2,6];
  P(M0,K.m);
  clip(()=>{ g.beginPath(); g.moveTo(M0[0],M0[1]); for(let i=2;i<M0.length;i+=2) g.lineTo(M0[i],M0[i+1]); g.closePath(); },()=>{
    P([-1,-11, 7,-13, 14,-10, 16,-4, 8,-4, 2,0, -1,4],K.l);                 // luz no alto
    P([19,6, 18,14, 15,21, 9,21, 13,12, 16,4],K.s);                          // sombra embaixo/direita
    E(9,0,4,6.5,K.l,.5); E(8,-2,1.2,2.4,K.h,.5);                            // volume do músculo do polegar
    LN([10,12, 15,19],K.s,.55); LN([4,9, 9,16],K.s,.45);                     // vincos do pulso
    if(metal){ for(let k=0;k<4;k++) LN([0,-8+k*7, 19,-6+k*7],IRONR.d,.9); R(2,-9,15,2,IRONR.h); } });
  // quatro dedos dobrados empilhados à esquerda (falange do meio + junta), pontas enfiadas na palma com a unha aparecendo
  const D=[[-12,-8.8,15,6],[-13,-2.8,16,6.2],[-12.4,3.4,15.4,6],[-10.6,9.4,13.4,5.2]];
  for(let k=3;k>=0;k--){ const [x,y,w,h]=D[k];
    RR(x,y,w,h,h*.48,K.m);                                                   // dedo
    RR(x+1,y+.4,w-2.4,h*.42,h*.2,K.l);                                       // luz em cima
    R(x+1.5,y+h-1.3,w-3,1.3,K.s);                                            // sombra embaixo
    E(x+1.3,y+h*.48,1.9,h*.44,K.l); E(x+.9,y+h*.32,.7,.9,K.h);               // junta do meio (ponta dobrada)
    LN([x+3.6,y+1, x+3.2,y+h-1],K.s,.5); LN([x+5,y+1.4, x+4.8,y+h-1.4],K.s,.35);   // rugas da junta
    if(nail){ RR(x+1.6,y+h-2.4,3.6,2.6,1.1,K.s); RR(x+2,y+h-2.2,2.8,1.9,.9,nail); R(x+2.4,y+h-2,1,.8,'#fff3ec'); }  // ponta e unha por baixo
    LN([x+2,y+h, x+w-1,y+h+.2],K.d,.8);                                       // vão entre os dedos
    if(metal){ RR(x+3,y+.6,w-5,h-1.6,1,IRONR.m); R(x+3.4,y+.8,w-6,1,IRONR.h); } }
  // vinco escuro entre os dedos e a palma
  LN([2,-8, 2.6,13],K.d,.7);
  // polegar por cima, cruzando o indicador da direita para a esquerda, unha na ponta
  const T=[15,-6, 11,-12, 4,-15.5, -6,-16.5, -12.5,-15.5, -14,-12.5, -11,-10.5, 0,-10.5, 7,-8.5];
  P(T,K.m); P([15,-6, 11,-12, 4,-15.5, -6,-16.5, -12.5,-15.5, -12,-14.4, -3,-14.6, 5,-13, 11,-9.6],K.l);
  E(-11,-13.6,3.4,2.8,K.m); if(nail){ RR(-14,-16.4,5,3.6,1.6,nail); R(-13.4,-16,1.8,1,'#fff3ec'); LN([-9,-16.4, -9,-12.8],K.s,.5); }
  LN([2,-13.8, 3,-11],K.s,.5); LN([-1,-14.6, -.5,-11.4],K.s,.4);            // dobra do polegar
  LN([-11,-10.4, 6,-8.6],K.d,.6);                                             // sombra do polegar sobre o indicador
}
// punho fechado visto de trás e de cima (para socar): nós dos dedos em cima, polegar do lado de dentro
function fistTop(S,glove,metal){ const K=glove||S;
  E(-13.5,1,4.6,8,K.s); E(-13.8,-.5,3.4,6.4,K.m); E(-14.4,-2.5,1.6,3,K.l);                       // base do polegar (lado de dentro)
  P([-13,-6, 13,-6, 11.5,12, -10.5,12],K.m);
  clip(()=>{ g.beginPath(); g.moveTo(-13,-6); g.lineTo(13,-6); g.lineTo(11.5,12); g.lineTo(-10.5,12); g.closePath(); },()=>{
    P([-13,-6, 4,-6, -2,4, -12,8],K.l); P([13,-6, 11.5,12, 2,12, 8,2],K.s);
    for(const x of [-9.7,-3.2,3.2,9.7]) LN([x,-4, x*.35,11],x<0?K.h:K.m,.6);                      // tendões
    if(metal) for(let k=0;k<3;k++) LN([-12,-2+k*5, 12,-2+k*5],IRONR.d,.9); });
  RR(-13.6,-17,27.2,11.5,4,K.m); RR(-12.8,-16.6,25.6,4,2,K.l);                                   // dedos dobrados vistos de cima
  for(const x of [-6.6,0,6.6]) LN([x,-16.4, x,-6.4],K.d,.7);
  R(-13,-8,26,1.6,K.s);
  for(const x of [-9.8,-3.3,3.3,9.8]){ E(x,-6,3.8,3,K.m); E(x-.6,-6.8,2.3,1.7,K.l); E(x-1,-7.3,.8,.6,K.h); }   // nós dos dedos
  if(metal) for(const x of [-9.8,-3.3,3.3,9.8]){ RR(x-3,-15,6,6,1,IRONR.m); R(x-2.4,-14.6,4.6,1.2,IRONR.h); } }
// mão ABERTA vista pelas costas (magia), dedos para cima e afastados; origem = meio do pulso
function handOpen(S,glove,metal,spread){ const K=glove||S, sp=spread||1;
  // dedos (desenhados antes da mão para a base ficar coberta)
  const F=[[-8,-21,-.16,20,4.6],[-2.6,-23,-.05,22,4.8],[2.8,-22.5,.06,20.5,4.6],[8,-20,.18,16,4.1]];
  for(const [x,y,a,len,w] of F){ g.save(); g.translate(x,y); g.rotate(a*sp);
    RR(-w/2,-len,w,len+2,w/2,K.m); RR(-w/2+.6,-len+.6,w*.45,len,w*.3,K.l); R(w/2-1.2,-len+2,1.2,len-2,K.s);
    LN([-w/2+.8,-len*.62, w/2-.8,-len*.6],K.s,.5); LN([-w/2+.8,-len*.3, w/2-.8,-len*.28],K.s,.5);       // dobras
    E(0,-len*.62,w*.32,.9,K.l); E(0,-len*.3,w*.34,1,K.l);
    if(!glove){ RR(-w/2+.8,-len+.8,w-1.6,4.2,1.4,'#e8b4a4'); R(-w/2+1.2,-len+1.2,1,1.6,'#fff2ea'); }
    if(metal){ RR(-w/2+.4,-len*.55,w-.8,len*.5,1,IRONR.m); R(-w/2+.8,-len*.55,w-1.6,1,IRONR.h); }
    g.restore(); }
  // polegar para fora
  g.save(); g.translate(-9,-8); g.rotate(-.85*sp); RR(-2.8,-16,5.6,17,2.8,K.m); RR(-2.2,-15.4,2.4,15,1.2,K.l); if(!glove){ RR(-2,-15.6,4,3.6,1.2,'#e8b4a4'); } g.restore();
  // costas da mão
  const B=[-9,0, 9,0, 12,-14, 11,-22, -11,-21, -12,-12];
  P(B,K.m); clip(()=>{ g.beginPath(); g.moveTo(B[0],B[1]); for(let i=2;i<B.length;i+=2) g.lineTo(B[i],B[i+1]); g.closePath(); },()=>{
    P([-12,-12, -11,-21, 4,-22, -2,-10, -9,0],K.l); P([12,-14, 11,-22, 6,-22, 5,-6, 9,0],K.s);
    for(const x of [-7.5,-2.6,2.6,7.6]) LN([x,-19, x*.3,-2],x<0?K.h:K.m,.55);
    if(metal) for(let k=0;k<3;k++) LN([-12,-6-k*5, 12,-7-k*5],IRONR.d,.9); });
  for(const x of [-8,-2.7,2.8,8]){ E(x,-21,2.4,1.8,K.l); E(x-.5,-21.6,.8,.6,K.h); } }
// braçadeira/antebraço: do pulso até fora da tela (cotovelo)
function forearm(wx,wy,ex,ey,w0,w1,C,brace){ const dx=ex-wx, dy=ey-wy, L=Math.hypot(dx,dy), nx=-dy/L, ny=dx/L;
  const q=[wx+nx*w0,wy+ny*w0, ex+nx*w1,ey+ny*w1, ex-nx*w1,ey-ny*w1, wx-nx*w0,wy-ny*w0];
  P(q,C.m); clip(()=>{ g.beginPath(); g.moveTo(q[0],q[1]); for(let i=2;i<8;i+=2) g.lineTo(q[i],q[i+1]); g.closePath(); },()=>{
    P([wx+nx*w0,wy+ny*w0, ex+nx*w1,ey+ny*w1, ex+nx*w1*.3,ey+ny*w1*.3, wx+nx*w0*.35,wy+ny*w0*.35],C.l);
    P([wx-nx*w0*.4,wy-ny*w0*.4, ex-nx*w1*.4,ey-ny*w1*.4, ex-nx*w1,ey-ny*w1, wx-nx*w0,wy-ny*w0],C.s);
    if(brace){ // tiras trançadas em X, costura e rebites
      const ux=dx/L, uy=dy/L; for(let t=6;t<L;t+=9){ const cx=wx+ux*t, cy=wy+uy*t, w=w0+(w1-w0)*t/L;
        LN([cx+nx*w,cy+ny*w, cx+ux*7-nx*w,cy+uy*7-ny*w],C.d,1.6); LN([cx-nx*w,cy-ny*w, cx+ux*7+nx*w,cy+uy*7+ny*w],C.d,1.6);
        LN([cx+nx*w,cy+ny*w, cx+ux*7-nx*w,cy+uy*7-ny*w],C.h,.6); LN([cx-nx*w,cy-ny*w, cx+ux*7+nx*w,cy+uy*7+ny*w],C.l,.6);
        E(cx+nx*w*.75+ux*3.5,cy+ny*w*.75+uy*3.5,.9,.9,STEEL.l); }
      for(const s of [.86,-.86]) for(let t=2;t<L;t+=3){ const w=w0+(w1-w0)*t/L; R(wx+dx*t/L+nx*w*s-.3,wy+dy*t/L+ny*w*s-.3,.7,.7,C.h); } }
  });
  // punho da braçadeira (borda no pulso)
  P([wx+nx*(w0+1),wy+ny*(w0+1), wx+nx*(w0+1)+dx/L*3,wy+ny*(w0+1)+dy/L*3, wx-nx*(w0+1)+dx/L*3,wy-ny*(w0+1)+dy/L*3, wx-nx*(w0+1),wy-ny*(w0+1)],C.d);
  LN([wx+nx*(w0+.6),wy+ny*(w0+.6), wx-nx*(w0+.6),wy-ny*(w0+.6)],C.l,.6); }
// ---------- armas (cabo na origem, ponta para cima = y negativo) ----------
function gripWrap(y0,y1,w){ R(-w/2,y0,w,y1-y0,LEATH.m); for(let y=y0;y<y1;y+=2.2){ LN([-w/2,y, w/2,y+1.2],LEATH.d,.7); LN([-w/2,y+.6, w/2,y+1.6],LEATH.l,.4); } R(-w/2,y0,1,y1-y0,LEATH.h); }
function swordArt(id,len){ const curve=id==='scimitar'||id==='sabre'||id==='cutlass'?14:id==='falchion'?6:0, w=id==='falchion'?12:id==='longsword'||id==='broadsword'||id==='claymore'?9:8;
  gripWrap(-13,17,6); E(0,20,4.6,3.6,BRASS.m); E(-1,19,2.4,1.6,BRASS.l); E(-1.4,18.6,.8,.6,BRASS.h);                            // pomo
  const y0=-17, tip=y0-len, cw=curve;
  const Lp=[-w/2,y0, -w/2+cw*.3,y0-len*.55, -w*.35+cw,tip+w*1.6, cw*1.1,tip, w*.42+cw,tip+w*1.4, w/2+cw*.35,y0-len*.5, w/2,y0];
  P(Lp,STEEL.s);
  P([-w/2,y0, -w/2+cw*.3,y0-len*.55, -w*.35+cw,tip+w*1.6, cw*1.1,tip, cw*.5,y0-len*.5, 0,y0],STEEL.l);            // face esquerda clara
  P([-w/2+.8,y0, -w/2+cw*.3+.8,y0-len*.55, -w*.35+cw+.6,tip+w*1.6, cw*1.1,tip, -w*.35+cw-.2,tip+w*1.6, -w/2+cw*.3-.1,y0-len*.55, -w/2-.1,y0],STEEL.h);  // fio de luz
  P([w/2-1,y0, w/2+cw*.35-1,y0-len*.5, w*.42+cw-.6,tip+w*1.4, cw*1.1,tip, w*.42+cw,tip+w*1.4, w/2+cw*.35,y0-len*.5, w/2,y0],STEEL.d);
  LN([cw*.05,y0-2, cw*.45,y0-len*.62],STEEL.d,1.6); LN([cw*.05-.7,y0-2, cw*.45-.7,y0-len*.62],STEEL.m,.5);       // sulco
  for(let k=0;k<3;k++){ const t=.2+k*.24; LN([-w*.3+cw*t,y0-len*t, -w*.05+cw*t,y0-len*t-6],'rgba(255,255,255,.55)',.7); }   // reflexos
  // guarda ornamentada
  const gw=32; P([-gw/2,-15, gw/2,-15, gw/2-2,-18.5, -gw/2+2,-18.5],BRASS.m); R(-gw/2+1,-18.4,gw-2,1.2,BRASS.h); R(-gw/2,-15.8,gw,1,BRASS.d);
  for(const s of [-1,1]){ E(s*gw/2,-17,3,3.2,BRASS.m); E(s*gw/2-.8,-17.8,1.4,1.4,BRASS.l); E(s*gw/2-1,-18.2,.5,.5,BRASS.h); }
  E(0,-17,3.2,3.8,BRASS.s); E(0,-17,2,2.4,'#7a1a14'); E(-.6,-17.8,.7,.8,'#e86a5a'); }                           // pedra rubi no centro
function daggerArt(){ gripWrap(-10,13,5); E(0,15,3.4,2.8,BRASS.m); const y0=-13,L=34; P([-4,y0, -3,y0-L*.6, 0,y0-L, 3,y0-L*.6, 4,y0],STEEL.s); P([-4,y0, -3,y0-L*.6, 0,y0-L, 0,y0],STEEL.l); LN([-3.6,y0, -2.6,y0-L*.6, 0,y0-L],STEEL.h,.6);
  P([-10,-11, 10,-11, 8,-14, -8,-14],BRASS.m); R(-9,-13.8,18,1,BRASS.h); }
function haftArt(top,bot,w,R0){ const C=R0||WOODR; R(-w/2,top,w,bot-top,C.m); R(-w/2,top,1.2,bot-top,C.h); R(w/2-1.4,top,1.4,bot-top,C.s); for(let y=top+4;y<bot;y+=9) LN([-w/2,y, w/2,y+2],C.d,.5); }
function axeArt(id){ const big=/battle|double|great|broad|war_axe|bardiche/.test(id), L=big?120:96; haftArt(-L,22,6.5); gripWrap(-12,14,7.4);
  const hw=big?34:24, hh=big?40:28, y=-L+10, sides=id==='double_axe'?[-1,1]:[-1];
  for(const s of sides){ const pts=[0,y-hh*.2, s*hw*.5,y-hh*.3, s*hw,y-hh*.6, s*hw*1.06,y, s*hw,y+hh*.6, s*hw*.5,y+hh*.32, 0,y+hh*.22];
    P(pts,IRONR.m); P([0,y-hh*.2, s*hw*.5,y-hh*.3, s*hw,y-hh*.6, s*hw*.9,y-hh*.1, s*hw*.4,y-hh*.05, 0,y],IRONR.l);
    P([s*hw*.78,y-hh*.52, s*hw,y-hh*.6, s*hw*1.06,y, s*hw,y+hh*.6, s*hw*.78,y+hh*.5, s*hw*.88,y],STEEL.l); LN([s*hw,y-hh*.6, s*hw*1.06,y, s*hw,y+hh*.6],STEEL.h,.9);
    LN([s*hw*.3,y+hh*.2, s*hw*.75,y+hh*.38],IRONR.d,.8); }
  if(sides.length===1) P([3,y-4, 14,y, 3,y+4],IRONR.s);
  RR(-5,y-8,10,17,2,IRONR.s); R(-4.4,y-7.4,2,15,IRONR.l); for(let k=0;k<2;k++) E(0,y-4+k*8,1,1,STEEL.h); }
function maceArt(id){ const L=78;
  if(/club|bat/.test(id)){ P([-3,20, -7,-L, 0,-L-8, 7,-L, 3,20],WOODR.m); P([-3,20, -7,-L, 0,-L-8, -1,-L+4, 0,20],WOODR.l); for(let k=0;k<6;k++) E(-3+((k*5)%8),-L*.35-k*10,1.6,1.2,WOODR.d); gripWrap(-12,14,7); return; }
  haftArt(-L,20,5.6,IRONR); gripWrap(-12,16,6.8);
  if(/flail/.test(id)){ for(let k=0;k<6;k++){ E(Math.sin(k*.5)*3,-L-3-k*4.4,1.8,2.4,'rgba(0,0,0,0)'); g.strokeStyle=IRONR.l; g.lineWidth=1.1; g.beginPath(); g.ellipse(Math.sin(k*.5)*3,-L-3-k*4.4,1.6,2.3,0,0,7); g.stroke(); }
    const bx=6,by=-L-36; for(let a=0;a<6.28;a+=.7) P([bx+Math.cos(a)*8,by+Math.sin(a)*8, bx+Math.cos(a+.18)*15,by+Math.sin(a+.18)*15, bx+Math.cos(a+.36)*8,by+Math.sin(a+.36)*8],STEEL.m); E(bx,by,10,10,IRONR.m); E(bx-3,by-3,4.6,4.6,IRONR.l); E(bx-4,by-4,1.6,1.6,IRONR.h); return; }
  if(/morning/.test(id)){ const by=-L-9; for(let a=0;a<6.28;a+=.6) P([Math.cos(a)*9,by+Math.sin(a)*9, Math.cos(a+.15)*17,by+Math.sin(a+.15)*17, Math.cos(a+.3)*9,by+Math.sin(a+.3)*9],STEEL.l); E(0,by,11,11,IRONR.m); E(-3,by-3,5,5,IRONR.l); E(-4,by-4,1.8,1.8,IRONR.h); return; }
  if(/hammer|maul|tongs|tinker/.test(id)){ const y=-L; RR(-17,y-9,30,17,2,IRONR.m); R(-16,y-8,28,3,IRONR.l); R(-16,y+5,28,2.4,IRONR.d); if(!/smith/.test(id)) P([13,y-6, 26,y, 13,y+6],STEEL.m); return; }
  const y=-L-8; // maça de flanges: corpo de ferro com 5 aletas visíveis
  E(0,y,8,13,IRONR.s); for(const [x,w,c] of [[-13,5,IRONR.l],[13,5,IRONR.s],[-7,4,IRONR.h],[7,4,IRONR.m],[0,4.4,STEEL.l]]){ P([x*.35-w*.4,y+14, x-w*.5,y+4, x-w*.4,y-10, x*.4,y-17, x*.4+w*.3,y-17, x+w*.5,y-10, x+w*.5,y+4, x*.35+w*.4,y+14],c); }
  LN([-13,y-9, -13,y+4],STEEL.h,.7); RR(-8,y+13,16,5,1.5,IRONR.m); R(-7,y+13.4,14,1.2,IRONR.h); E(0,y-18,3.4,2.6,STEEL.l); E(-1,y-18.8,1.2,.8,STEEL.h); }
function poleArt(id){ const L=92; haftArt(-L,70,6.5); gripWrap(-12,14,7.4); const y=-L;
  if(!/scythe/.test(id)){ P([-6,y, 0,y-40, 6,y],STEEL.m); P([-6,y, 0,y-40, 0,y],STEEL.l); LN([-5,y-1, 0,y-40],STEEL.h,.7); RR(-4.5,y-1,9,9,2,IRONR.m); }
  if(/halberd|bardiche|glaive/.test(id)){ const yy=y+18; P([-3,yy-6, -30,yy-16, -36,yy+4, -30,yy+26, -3,yy+12],IRONR.m); P([-22,yy-13, -30,yy-16, -36,yy+4, -30,yy+26, -22,yy+20, -28,yy+4],STEEL.l); LN([-30,yy-16, -36,yy+4, -30,yy+26],STEEL.h,.9); P([3,yy, 16,yy+5, 3,yy+10],IRONR.s); }
  if(/scythe/.test(id)){ g.beginPath(); g.moveTo(2,y); g.quadraticCurveTo(-36,y-20,-70,y+18); g.quadraticCurveTo(-36,y-6,2,y+9); g.closePath(); g.fillStyle=STEEL.m; g.fill();
    g.beginPath(); g.moveTo(2,y); g.quadraticCurveTo(-36,y-20,-70,y+18); g.quadraticCurveTo(-36,y-13,2,y+3); g.closePath(); g.fillStyle=STEEL.h; g.fill(); } }
function staffArt(id,spell){ const wand=id==='wand', L=wand?40:84; if(wand){ P([-2.6,24, -1.6,-L, 1.6,-L, 2.6,24],'#3a2a4a'); R(-1.2,-L,1,L+22,'#6a5a7a'); } else { haftArt(-L,70,6.8); E(0,-L*.7,4.6,2.4,WOODR.d); E(0,-L*.3,4.4,2.2,WOODR.d); gripWrap(-12,14,7.6); }
  const gc={fogo:['#ff6a1a','#ffd27a'],gelo:['#4aa8ff','#e0f6ff'],luz:['#e8b030','#fff4c8'],arcano:['#a070f0','#efe0ff']}[spell];
  if(spell==='luz'){ const y=-L-4; R(-3,y-34,6,36,BRASS.m); R(-13,y-26,26,6,BRASS.m); R(-3,y-34,2,36,BRASS.h); R(-13,y-26,26,2,BRASS.h); R(1.5,y-34,1.5,36,BRASS.s); E(0,y-23,4.2,4.2,gc[1]); E(-1,y-24,1.6,1.6,'#ffffff'); return; }
  if(!gc){ P([-7,-L+3, -9,-L-12, -2,-L-18, 5,-L-16, 8,-L-5, 6,-L+4],WOODR.m); P([-7,-L+3, -9,-L-12, -2,-L-18, -3,-L-8],WOODR.l); return; }
  if(!wand){ P([-6,-L+2, -9,-L-12, -2,-L-6, 0,-L-16, 2,-L-6, 9,-L-12, 6,-L+2],WOODR.s); }
  const cy=wand?-L-4:-L-16, r=wand?4:8; P([0,cy-r*1.6, r,cy, 0,cy+r*1.2, -r,cy],gc[0]); P([0,cy-r*1.6, r*.5,cy-r*.2, 0,cy+r*.5, -r*.45,cy],gc[1]); E(-r*.2,cy-r*.6,r*.25,r*.35,'#ffffff'); }
function pickArt(){ haftArt(-92,22,6.2); gripWrap(-12,14,7); const y=-88; g.beginPath(); g.moveTo(-40,y+10); g.quadraticCurveTo(0,y-14,40,y+10); g.quadraticCurveTo(0,y-4,-40,y+10); g.fillStyle=IRONR.m; g.fill();
  g.beginPath(); g.moveTo(-40,y+10); g.quadraticCurveTo(0,y-14,40,y+10); g.quadraticCurveTo(0,y-9,-40,y+10); g.fillStyle=IRONR.h; g.fill(); RR(-5,y-8,10,14,2,IRONR.s); }
// escudo (mão esquerda, visto de frente e um pouco de lado)
function shieldArt(W){ const k=W.kind||'round', C=ramp(W.col||'#7a5a3a'), metal=/iron|steel/.test(W.mat||''), rim=metal?IRONR:BRASS;
  let pts; if(k==='buckler'||k==='round'){ const r=k==='buckler'?30:44; E(0,0,r*.8,r,rim.s); E(0,0,r*.8-3,r-3,C.m); clip(()=>{ g.beginPath(); g.ellipse(0,0,r*.8-3,r-3,0,0,7); },()=>{ P([-60,-60, 60,-60, -10,0, -60,30],C.l); P([20,-10, 60,10, 60,60, -10,60],C.s); });
    E(0,0,9,11,STEEL.s); E(-2,-3,5,6,STEEL.l); E(-3,-5,2,2,STEEL.h); for(let a=0;a<6.28;a+=.5) E(Math.cos(a)*(r*.8-6),Math.sin(a)*(r-6),1,1,rim.h); return; }
  pts=k==='kite'?[-30,-46, 30,-46, 30,6, 0,64, -30,6]:k==='tower'?[-30,-56, 30,-56, 30,56, -30,56]:[-34,-40, 34,-40, 34,0, 18,30, 0,44, -18,30, -34,0];
  const big=pts.map((v,i)=>v*1.08); P(big,rim.s); P(pts,C.m);
  clip(()=>{ g.beginPath(); g.moveTo(pts[0],pts[1]); for(let i=2;i<pts.length;i+=2) g.lineTo(pts[i],pts[i+1]); g.closePath(); },()=>{
    P([-70,-70, 70,-70, -5,-10, -70,40],C.l); P([10,-20, 70,0, 70,80, -20,80],C.s);
    if(!metal) for(let x=-30;x<34;x+=10) LN([x,-60, x,70],C.d,.6);
    if(k==='cross'||/crusader/i.test(W.name||'')){ const cc=hx(W.col||'#eee')[0]>150?'#b0201a':'#f0e8d8'; R(-5,-38,10,78,cc); R(-26,-16,52,10,cc); R(-5,-38,3,78,'rgba(255,255,255,.25)'); } });
  LN(pts.concat(pts.slice(0,2)),rim.l,1.2); for(let i=0;i<pts.length;i+=2) E(pts[i]*.92,pts[i+1]*.92,1.2,1.2,rim.h); }
// escudo visto POR TRÁS: tábuas internas (ou chapa), borda, rebites, alça de couro onde a mão segura e a
// braçadeira por onde passa o antebraço
function shieldBack(W,C){ const k=W.kind||'round', metal=/iron|steel/.test(W.mat||''), IN=metal?IRONR:WOODR, RIM=metal?IRONR:{d:'#2a2c30',s:'#4a4e56',m:'#6e727a',l:'#9a9ea6',h:'#d0d4da'};
  let pts, round=k==='buckler'||k==='round', rr=k==='buckler'?32:46;
  if(!round) pts=k==='kite'?[-34,-52, 34,-52, 34,6, 0,72, -34,6]:k==='tower'?[-36,-64, 36,-64, 36,64, -36,64]:[-38,-44, 38,-44, 38,0, 20,34, 0,50, -20,34, -38,0];
  const shape=(sc)=>{ g.beginPath(); if(round) g.ellipse(0,0,rr*.86*sc,rr*sc,0,0,7); else { g.moveTo(pts[0]*sc,pts[1]*sc); for(let i=2;i<pts.length;i+=2) g.lineTo(pts[i]*sc,pts[i+1]*sc); g.closePath(); } };
  shape(1.06); g.fillStyle=RIM.s; g.fill(); shape(1.02); g.fillStyle=RIM.l; g.fill();
  shape(.97); g.fillStyle=IN.m; g.fill();
  g.save(); shape(.97); g.clip();
    P([-90,-90, -10,-90, -30,90, -90,90],IN.s); P([20,-90, 90,-90, 90,90, 40,90],IN.l);     // curvatura: lado esquerdo na sombra, direito na luz
    P([-90,-90, -40,-90, -60,90, -90,90],IN.d);
    if(!metal){ for(let x=-40;x<44;x+=10){ LN([x,-80, x+2,80],IN.d,.9); LN([x+1.2,-80, x+3.2,80],IN.l,.4); } for(let k2=0;k2<14;k2++){ const x=-36+((k2*37)%72), y=-40+((k2*53)%80); LN([x,y, x+1,y+6],IN.s,.5); } }
    else { for(let y=-50;y<60;y+=16) LN([-60,y, 60,y+2],IN.s,.6); }
    // reforço de ferro atravessado atrás
    R(-60,-30,120,5,RIM.s); R(-60,-30,120,1.4,RIM.h); for(let x=-30;x<=30;x+=20) E(x,-27.5,1.3,1.3,RIM.h);
  g.restore();
  // rebites na borda
  if(round){ for(let a=0;a<6.28;a+=.42) E(Math.cos(a)*rr*.8,Math.sin(a)*rr*.94,1.1,1.1,RIM.h); }
  else for(let i=0;i<pts.length;i+=2){ const j=(i+2)%pts.length; for(let t=.2;t<1;t+=.3) E((pts[i]+(pts[j]-pts[i])*t)*.93,(pts[i+1]+(pts[j+1]-pts[i+1])*t)*.93,1.1,1.1,RIM.h); }
}
// alças e braço por trás do escudo (desenhados por cima das tábuas)
function shieldStraps(C,drawArm){ const strap=(x0,y0,x1,y1,w)=>{ const dx=x1-x0, dy=y1-y0, L=Math.hypot(dx,dy), nx=-dy/L*w/2, ny=dx/L*w/2;
    P([x0+nx,y0+ny, x1+nx,y1+ny, x1-nx,y1-ny, x0-nx,y0-ny],LEATH.m); LN([x0+nx*.6,y0+ny*.6, x1+nx*.6,y1+ny*.6],LEATH.h,.6); LN([x0-nx*.7,y0-ny*.7, x1-nx*.7,y1-ny*.7],LEATH.d,.8);
    for(let t=.06;t<1;t+=.08) R(x0+dx*t+nx*.75-.3,y0+dy*t+ny*.75-.3,.6,.6,'#c8a878');
    for(const [x,y] of [[x0,y0],[x1,y1]]){ RR(x-3.4,y-3.4,6.8,6.8,1.2,BRASS.m); R(x-2.4,y-2.4,4.8,1.2,BRASS.h); E(x,y,1,1,BRASS.d); } };
  strap(-26,-6,22,-12,7);                 // alça de mão (em cima)
  if(drawArm) drawArm();                  // antebraço passando por baixo da braçadeira
  strap(-30,22,26,18,9);                  // braçadeira (embaixo)
}
// arco (na mão esquerda) e besta
function bowArt(pull,id){ const H=id==='longbow'||id==='composite_bow'?190:160, b=12+pull*18;
  g.lineCap='round'; g.strokeStyle=WOODR.d; g.lineWidth=8; g.beginPath(); g.moveTo(10,-H/2); g.quadraticCurveTo(-b,0,10,H/2); g.stroke();
  g.strokeStyle=WOODR.m; g.lineWidth=5.4; g.stroke(); g.strokeStyle=WOODR.h; g.lineWidth=1.6; g.beginPath(); g.moveTo(9,-H/2+4); g.quadraticCurveTo(-b+1.5,0,9,H/2-4); g.stroke();
  RR(-6,-12,11,24,3,LEATH.m); R(-5,-11,2,22,LEATH.h); return {top:[10,-H/2],bot:[10,H/2]}; }
function xbowArt(loaded,rec){ const y0=rec*8;
  P([-9,70+y0, -6,-46+y0, 6,-46+y0, 9,70+y0],WOODR.m); P([-9,70+y0, -6,-46+y0, -1,-46+y0, -2,70+y0],WOODR.l); R(4,-44+y0,2,112,WOODR.s);
  RR(-5,-50+y0,10,8,2,IRONR.m);
  g.lineCap='round'; g.strokeStyle=IRONR.d; g.lineWidth=7; g.beginPath(); g.moveTo(-64,-24+y0); g.quadraticCurveTo(0,-56+y0,64,-24+y0); g.stroke(); g.strokeStyle=IRONR.l; g.lineWidth=3; g.stroke();
  g.strokeStyle=IRONR.h; g.lineWidth=1; g.beginPath(); g.moveTo(-60,-27+y0); g.quadraticCurveTo(0,-57+y0,60,-27+y0); g.stroke();
  const ny=loaded?-6+y0:-40+y0; LN([-64,-24+y0, 0,ny, 64,-24+y0],'#ece4cc',1);
  if(loaded){ R(-1.6,-64+y0,3.2,58,WOODR.h); P([-4.4,-64+y0, 0,-74+y0, 4.4,-64+y0],STEEL.l); P([-4,-10+y0, 0,-14+y0, 4,-10+y0],'#e0d8c8'); }
  RR(-3,20+y0,6,10,2,IRONR.s); }
// ---------- montagem de um quadro ----------
function colors(){ const L=player.look||{}, gi=player.gi||{}, Wk=sl=>{ const k=gi[sl]&&typeof drawKey==='function'?drawKey(gi[sl]):null; return k&&WEAR[k]; };
  const hands=Wk('hands'), arms=Wk('arms'), body=player.equip&&player.equip.body&&WEAR[player.equip.body], shield=Wk('shield');
  const iron=w=>!!w&&/iron|steel|chain|plate/.test((w.mat||'')+(w.name||'').toLowerCase());
  return {S:ramp(L.skin||'#e0b48e'), G:hands?ramp(hands.col):null, gm:iron(hands), B:arms&&iron(arms)?IRONR:(arms?ramp(arms.col):LEATH), brace:!(arms&&iron(arms)), sleeve:ramp((body&&body.col)||L.jacket||'#5a4632'), shield}; }
function kind(id){ const W=WEAPONS[id]||{}; if(!WEAPONS[id]||id==='fists') return 'fists';
  if(/bow$/.test(id)&&!/crossbow/.test(id)||id==='shortbow'||id==='composite_bow') return 'bow'; if(/crossbow|arbalest/.test(id)) return 'xbow';
  if(W.spell||/staff|scepter|crook/.test(id)) return id==='wand'?'wand':'staff'; if(id==='wand') return 'wand';
  if(/spear|pike|javelin|lance|war_fork|halberd|scythe|bardiche|glaive/.test(id)) return 'pole';
  if(/dagger|knife|kris|scissors/.test(id)) return 'dagger'; if(id==='pickaxe') return 'pick';
  if(W.skill==='machados'||/axe|hatchet|cleaver/.test(id)) return 'axe'; if(W.skill==='macas'||/hammer|maul|mace|club|bat|pipe|crowbar|morning|flail|tongs/.test(id)) return 'mace'; return 'sword'; }
function weaponArt(id,k){ const W=WEAPONS[id]||{}, L=Math.min(150,(W.len||10)*6.4+30);
  if(k==='sword') swordArt(id,L); else if(k==='dagger') daggerArt(); else if(k==='axe') axeArt(id); else if(k==='mace') maceArt(id); else if(k==='pole') poleArt(id); else if(k==='staff'||k==='wand') staffArt(id,W.spell); else if(k==='pick') pickArt(); }
// pose: [x,y,ângulo,escala] da mão (centro do cabo) em pixels da tela baixa (referência 270 de altura)
const POSES={
  idle:[[118,-58,-.36,1]],
  slashA:[[118,-58,-.36,1],[160,-112,-.95,1],[110,-122,-.2,1.04],[10,-70,.95,.98],[-80,-35,1.55,.95],[80,-50,.1,1]],
  slashB:[[118,-58,-.36,1],[-40,-92,1.45,1],[20,-84,1.1,1.02],[140,-62,-.6,1.02],[190,-42,-1.5,.95],[130,-56,-.4,1]],
  chop:[[118,-58,-.36,1],[100,-145,.45,1.02],[80,-136,.1,1.04],[40,-62,-.95,1],[20,-22,-1.6,.95],[110,-55,-.4,1]],
  pidle:[[110,-50,-.62,1]],
  pthrust:[[110,-50,-.62,1],[130,-40,-.72,1.04],[50,-80,-.5,.84],[20,-92,-.45,.76],[80,-66,-.55,.9],[110,-50,-.62,1]],
  thrust:[[125,-56,-.55,1],[150,-46,-.75,1.06],[60,-92,-.15,.82],[30,-100,-.05,.74],[90,-78,-.3,.88],[125,-56,-.55,1]],
};
let frames={}, sig='', cvs=null;
function paintFrame(k,id,pose,pi,C,lw,lh,extra){
  const s=lh/270, W2=lw*SS, H2=lh*SS; if(!cvs){ cvs=document.createElement('canvas'); } if(cvs.width!==W2||cvs.height!==H2){ cvs.width=W2; cvs.height=H2; }
  g=cvs.getContext('2d'); g.setTransform(1,0,0,1,0,0); g.clearRect(0,0,W2,H2); g.imageSmoothingEnabled=false;
  const base=(x,y)=>[lw/2*SS+x*s*SS, H2+y*s*SS];
  // escudo na mão esquerda
  if(C.shield&&k!=='bow'&&k!=='xbow'&&k!=='pole'&&k!=='staff'){ const sp=extra.shieldPose||[-150,-40,.12,1]; const [X,Y]=base(sp[0],sp[1]); g.save(); g.translate(X,Y); g.rotate(sp[2]); const z=s*SS*sp[3]*1.55; g.scale(z,z);
    shieldBack(C.shield,C); shieldStraps(C,()=>forearm(-2,6,-70,120,10,15,C.B,C.brace));
    g.save(); g.translate(-2,-9); g.rotate(-1.62); g.scale(-1.05,1.05); fist(C.S,C.G,C.gm); g.restore(); g.restore(); }
  if(k==='cast'){ const st=extra.stage; // 0 baixo, 1 subindo, 2 à frente
    const P0=[[-120,10,.15,1.25],[-80,-55,.08,1.12],[-36,-92,.02,.92]][st], sp=[.6,.85,1.15][st];
    for(const side of [-1,1]){ const [X,Y]=base(P0[0]*-side*-1*(side),P0[1]); g.save(); g.translate(base(side*Math.abs(P0[0]),P0[1])[0],Y); const z=s*SS*Z*.9*P0[3]; g.scale(z,z); g.rotate(side*-P0[2]);
      forearm(0,-1,side*30,95,9.5,14,C.B,C.brace); g.scale(side,1); handOpen(C.S,C.G,C.gm,sp); g.restore(); }
    return finish(lw,lh); }
  if(k==='xbow'){ const [X,Y]=base(30,-128); g.save(); g.translate(X,Y); g.scale(s*SS*1.5,s*SS*1.5); xbowArt(extra.arrow!==false,extra.rec||0);
      const y0=(extra.rec||0)*8; forearm(-14,30+y0,-110,150,9,14,C.B,C.brace); g.save(); g.translate(-8,22+y0); g.rotate(-.2); g.scale(-1,1); fist(C.S,C.G,C.gm); g.restore();
      forearm(18,66+y0,110,180,9,14,C.B,C.brace); g.save(); g.translate(8,58+y0); g.rotate(.15); fist(C.S,C.G,C.gm); g.restore(); g.restore(); return finish(lw,lh); }
  if(k==='bow'){ const pull=extra.pull||0, [X,Y]=base(-60,-120); g.save(); g.translate(X,Y); g.scale(s*SS*1.25,s*SS*1.25); const t=bowArt(pull,id);
      const nk=[lerp(14,150,pull),lerp(0,58,pull)]; LN([t.top[0],t.top[1], nk[0],nk[1], t.bot[0],t.bot[1]],'#ece4cc',1);
      if(extra.arrow!==false){ LN([nk[0],nk[1], -14,-2],WOODR.l,2.2); P([-14,-6, -28,-2, -14,2],STEEL.l); P([nk[0]-12,nk[1]-1, nk[0]+2,nk[1]-7, nk[0]+3,nk[1]-1],'#e8e4dc'); P([nk[0]-12,nk[1]+1, nk[0]+2,nk[1]+7, nk[0]+3,nk[1]+1],'#c8c0b0'); }
      // mão esquerda no arco
      g.save(); g.translate(-2,0); g.scale(-1.15,1.15); fist(C.S,C.G,C.gm); g.restore(); forearm(-8,8,-120,170,9,15,C.B,C.brace);
      // mão direita puxando a corda
      g.save(); g.translate(nk[0]+6,nk[1]); g.rotate(-1.2); g.scale(1.2,1.2); fist(C.S,C.G,C.gm); g.restore(); forearm(nk[0]+16,nk[1]+8,nk[0]+120,nk[1]+190,9,15,C.B,C.brace); g.restore(); return finish(lw,lh); }
  if(k==='fists'){ const pr=extra.punch||[0,0];
    for(const side of (C.shield?[1]:[-1,1])){ const f=pr[side>0?1:0], x=side*lerp(92,20,f), y=lerp(-62,-112,f), sc=lerp(1,.78,f), [X,Y]=base(x,y);
      g.save(); g.translate(X,Y); g.scale(s*SS*sc*Z*.95,s*SS*sc*Z*.95); g.rotate(side*-.18); forearm(0,11,side*22,90,11,15,C.B,C.brace); g.scale(side,1); fistTop(C.S,C.G,C.gm); g.restore(); }
    return finish(lw,lh); }
  const [px,py,ang,sc]=pose, [X,Y]=base(px,py);
  g.save(); g.translate(X,Y); g.scale(s*SS*sc*Z,s*SS*sc*Z);
  // antebraço vai do pulso até o canto de baixo à direita (sempre fora da tela)
  const wr=[11*Math.cos(ang)-(17)*Math.sin(ang), 11*Math.sin(ang)+17*Math.cos(ang)];
  const el=[((lw/2+60)/s-px)/(sc*Z), (40/s-py)/(sc*Z)];
  g.save(); g.rotate(ang); weaponArt(id,k); g.restore();
  forearm(wr[0],wr[1],el[0],el[1],9,13,C.B,C.brace);
  g.save(); g.rotate(ang); fist(C.S,C.G,C.gm); g.restore();
  if(k==='pole'||k==='staff'){ // segunda mão mais abaixo na haste
    const d2=-36, w2=[-d2*Math.sin(ang)-12*Math.cos(ang), d2*Math.cos(ang)+4]; forearm(w2[0],w2[1],w2[0]-120,w2[1]+150,9,13,C.B,C.brace); g.save(); g.rotate(ang); g.translate(0,d2); g.scale(-1,1); fist(C.S,C.G,C.gm); g.restore(); }
  g.restore(); return finish(lw,lh); }
const lerp=(a,b,t)=>a+(b-a)*t;
// redução 3x pegando o pixel do meio + contorno escuro de 1px
function finish(lw,lh){ const out=document.createElement('canvas'); out.width=lw; out.height=lh; const o=out.getContext('2d'); o.imageSmoothingEnabled=false; o.drawImage(cvs,0,0,lw*SS,lh*SS,0,0,lw,lh);
  const id=o.getImageData(0,0,lw,lh), d=id.data, src=g.getImageData(0,0,lw*SS,lh*SS).data;
  for(let y=0;y<lh;y++) for(let x=0;x<lw;x++){ const q=(y*lw+x)*4, sq=((y*SS+1)*lw*SS+(x*SS+1))*4; d[q]=src[sq]; d[q+1]=src[sq+1]; d[q+2]=src[sq+2]; d[q+3]=src[sq+3]>120?255:0; }
  const a=new Uint8Array(lw*lh); for(let i=0;i<lw*lh;i++) a[i]=d[i*4+3];
  for(let y=1;y<lh-1;y++) for(let x=1;x<lw-1;x++){ const i=y*lw+x; if(a[i]) continue; if(a[i-1]||a[i+1]||a[i-lw]||a[i+lw]){ const q=i*4; d[q]=22; d[q+1]=14; d[q+2]=10; d[q+3]=255; } }
  o.putImageData(id,0,0); return out; }
// ---------- animação e desenho na tela ----------
let atk=null, lastCd=0, alt=0, lastW='', swapT=0, cast=null, lastCast=0, lastSpell=null;
if(typeof castSpell==='function'){ const _cs=castSpell; castSpell=function(id){ lastSpell=id; return _cs.apply(this,arguments); }; }
const spellCol=id=>{ id=id||''; if(/fire|ember|naphtha|flame|burn|fogo/.test(id)) return ['255,120,40','255,220,140']; if(/frost|cold|ice|gelo|tear/.test(id)) return ['80,170,255','220,240,255'];
  if(/storm|nail|spark/.test(id)) return ['170,200,255','255,255,255']; if(/resin|mire|lime|dust|blind|bind/.test(id)) return ['150,180,60','230,240,160']; return ['240,190,70','255,246,200']; };
function anim(k,gat){ if(gat) return 'chop'; if(k==='axe'||k==='mace'||k==='pick') return 'chop'; if(k==='pole'||k==='staff') return 'pthrust'; if(k==='dagger'||k==='wand') return 'thrust'; return alt?'slashB':'slashA'; }
window.__FPH={lastSpell:()=>lastSpell,weaponArt,shieldBack,shieldStraps,bowArt,xbowArt,kind,colors,ramp,setG:c=>{g=c;},LN,P,E,R,RR,STEEL,BRASS,WOODR,LEATH,IRONR,spellCol};
window.fpHandsDbg=()=>({atk,cast,frames:Object.keys(frames).length});
window.fpHandsDraw=function(ctx,lw,lh,now,light){ if(!player||player.ghost) return false;
  const tool=gathering?(gathering.kind==='tree'?'hatchet':'pickaxe'):null, id=tool||player.weapon, k=kind(id), C=colors();
  const S=[id,lw,lh,C.S.m,C.G&&C.G.m,C.B.m,C.shield&&C.shield.kind,C.shield&&C.shield.col].join('|'); if(S!==sig){ sig=S; frames={}; }
  if(id!==lastW){ lastW=id; swapT=now; atk=null; }
  const cd=player.atkCd||0; if(cd>lastCd+.05){ alt^=1; const Wp=WEAPONS[player.weapon]||{}; atk={t0:now,dur:Math.max(300,Math.min(560,(Wp.cd||.5)*900)),a:anim(k)}; } lastCd=cd;
  if(atk&&now-atk.t0>atk.dur) atk=null;
  const cc=player.castCd||0; if(cc>lastCast+.05) cast={t0:now,dur:640,col:spellCol(lastSpell||(WEAPONS[player.weapon]||{}).spell)}; lastCast=cc; if(cast&&now-cast.t0>cast.dur) cast=null;
  let key, make, glow=null;
  if(cast){ const p=(now-cast.t0)/cast.dur, st=p<.18?0:p<.34?1:p<.78?2:p<.9?1:0; key='cast'+st; make=()=>paintFrame('cast',id,null,0,C,lw,lh,{stage:st}); if(st===2) glow=cast.col; }
  else   if(k==='fists'){ let pr=[0,0]; if(atk){ const p=(now-atk.t0)/atk.dur, f=p<.35?p/.35:1-(p-.35)/.65, st=Math.round(f*3)/3; pr=(alt||C.shield)?[0,st]:[st,0]; }
    key='fists'+pr.join(','); make=()=>paintFrame(k,id,null,0,C,lw,lh,{punch:pr}); }
  else if(k==='xbow'){ let rec=0, ld=true; if(atk){ const p=(now-atk.t0)/atk.dur; rec=p<.15?1:p<.3?.5:0; ld=p>.75; }
    key='xbow'+rec+ld; make=()=>paintFrame('xbow',id,null,0,C,lw,lh,{rec,arrow:ld}); }
  else if(k==='bow'){ let pull=1, arrow=true; if(atk){ const p=(now-atk.t0)/atk.dur; pull=p<.15?0:Math.round(Math.min(1,(p-.15)/.85)*4)/4; arrow=pull>.2; }
    key='bow'+pull+arrow; make=()=>paintFrame('bow',id,null,0,C,lw,lh,{pull,arrow}); }
  else { const A=gathering?{a:'chop',t0:now-(now%640),dur:640}:atk; let fi=0, pose=(k==='pole'||k==='staff')?POSES.pidle[0]:POSES.idle[0], name='idle';
    if(A){ name=A.a; const F=POSES[name], p=Math.min(.999,(now-A.t0)/A.dur); fi=1+Math.floor(p*(F.length-1)); fi=Math.min(F.length-1,fi); pose=F[fi]; }
    key=k+name+fi; make=()=>paintFrame(k,id,pose,fi,C,lw,lh,{shieldPose:A?[-170,-20,.25,1]:[-150,-40,.12,1]}); }
  let fr=frames[key]; if(!fr) fr=frames[key]=make();
  // pinta antes os quadros do golpe desta arma (um por quadro de jogo), para o primeiro golpe não engasgar
  if(!atk&&!gathering&&k!=='fists'&&k!=='bow'&&k!=='xbow'){ for(const nm of (k==='pole'||k==='staff')?['pthrust']:k==='dagger'||k==='wand'?['thrust']:k==='axe'||k==='mace'||k==='pick'?['chop']:['slashA','slashB']){ const F=POSES[nm]; let done=false;
      for(let i=1;i<F.length;i++){ const kk=k+nm+i; if(!frames[kk]){ frames[kk]=paintFrame(k,id,F[i],i,C,lw,lh,{shieldPose:[-170,-20,.25,1]}); done=true; break; } } if(done) break; } }
  // balanço ao andar e respirar (em pixels inteiros)
  const walk=player.moving?Math.sin(player.phase||now/130):0, s=lh/270, swap=Math.min(1,(now-swapT)/260);
  const bx=Math.round(walk*4*s), by=Math.round((Math.abs(walk)*4+Math.sin(now/900)*1.5)*s+(1-swap)*90*s);
  const L=Math.max(.3,Math.min(1.05,light.b));
  if(glow){ const cx=canvas.width/2, cy=canvas.height*(1-150/270), r=canvas.height*(.07+.012*Math.sin(now/45)); ctx.save(); ctx.globalCompositeOperation='lighter';
    const gr=ctx.createRadialGradient(cx,cy,0,cx,cy,r*2.2); gr.addColorStop(0,`rgba(${glow[1]},1)`); gr.addColorStop(.35,`rgba(${glow[0]},.85)`); gr.addColorStop(1,`rgba(${glow[0]},0)`); ctx.fillStyle=gr; ctx.fillRect(cx-r*2.4,cy-r*2.4,r*4.8,r*4.8);
    const px=Math.max(2,canvas.height/135|0); ctx.fillStyle=`rgba(${glow[1]},1)`; for(let i=0;i<10;i++){ const a=now/220+i*.63, d=r*(1.3+.5*Math.sin(now/90+i)); ctx.fillRect((cx+Math.cos(a)*d)|0,(cy+Math.sin(a)*d*.7)|0,px,px); } ctx.restore(); }
  ctx.save(); ctx.imageSmoothingEnabled=false; if(L<.98){ ctx.filter=`brightness(${L.toFixed(2)})${light.warm>.3?' sepia(.25)':''}`; }
  ctx.drawImage(fr,0,0,lw,lh,bx*canvas.width/lw,by*canvas.height/lh,canvas.width,canvas.height); ctx.restore();
  return true; };
})();

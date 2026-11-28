// =====================================================================
// OUTREMER · Lote 2 (personagens): herói, NPCs, jogadores online e monstros comuns em PNG,
// no mesmo estilo pintado do Lote 1. Só na câmera isométrica; o resto continua procedural.
// 4 poses (frente, costas, perfil esquerdo; direita = espelho), 3 quadros (parado, passo A, passo B).
// Armas em PNG separado, giradas pelo mesmo ângulo (wAng) que o jogo já calcula: ataque intacto.
// Carrega por último (depois de todos os drawHuman/drawNPC/drawRaider/drawAnimal).
// v3: mapa completo de monstros, chefes e animais (assets/lote2/monstros + meta_monstros.json).
// v2: camadas de personalização (corpo tingido + cabelo/barba/elmo/capa/escudo/ferramentas) e montarias.
// =====================================================================
(function(){
const B='assets/lote2/';
const L2=window.LOTE2={img:{},flash:{},weap:{},portrait:{},meta:null,ready:false,errors:[],cur:null,on:true};
const loadImg=src=>new Promise((res,rej)=>{ const im=new Image(); im.onload=()=>res(im); im.onerror=()=>{ L2.errors.push(src); rej(src); }; im.src=src; });
const ROW={down:0,up:1,left:2,right:2};
const isoNow=()=>L2.ready && L2.on && typeof isoOn==='function' && isoOn();
// silhueta branca para o "piscar" de dano
function whiteOf(im){ const c=document.createElement('canvas'); c.width=im.width; c.height=im.height; const g=c.getContext('2d');
  g.drawImage(im,0,0); g.globalCompositeOperation='source-in'; g.fillStyle='#fff'; g.fillRect(0,0,c.width,c.height); return c; }
function frameOf(moving,phase){ if(!moving) return 0; const s=Math.sin(phase||0); return s>0.3?1:s<-0.3?2:0; }
// desenha um quadro com os pés em (x,y) no sistema local do jogo (1 unidade = SCL px do buffer)
function blit(g,k,x,y,face,fr,o){
  const m=L2.meta.sprites[k], im=(o&&o.flash)?(L2.flash[k]||(L2.flash[k]=whiteOf(L2.img[k]))):L2.img[k]; if(!im) return false;
  const row=ROW[face]!=null?ROW[face]:0, col=fr||0, sx=(o&&o.sx)||1, sy=(o&&o.sy)||1, flip=face==='right';
  g.save(); g.translate(x,y); g.scale(.5*sx*(flip?-1:1),.5*sy);
  g.drawImage(im,col*m.cw,row*m.ch,m.cw,m.ch,-m.ax+((o&&o.dx)||0)*(flip?-1:1),-m.ay+((o&&o.dy)||0),m.cw,m.ch);
  g.restore(); return true; }
// ---------------- armas ----------------
const WMAP={espada:['sword','arming_sword','longsword','broadsword','shortsword','sabre','scimitar','cutlass','falchion','cleaver','rapier','kris'],
  adaga:['dagger','knife','throwing_knife','skinning_knife'], machado:['axe','hand_axe','battleaxe','war_axe','broadaxe','hatchet','fire_axe','double_axe'],
  alabarda:['halberd','bardiche','glaive','scythe','war_fork'], lanca:['spear','pike','lance','javelin'],
  maca:['mace','flanged_mace','morning_star','morningstar','flail','scepter'], martelo:['warhammer','maul','smith_hammer'],
  porrete:['club','bone','bat','spiked_bat','crook','pipe','crowbar'], cajado:['staff','quarterstaff','fire_staff','ice_staff','holy_staff','wand'],
  arco:['bow','longbow','shortbow','composite_bow','crossbow','arbalest','hand_crossbow','heavy_crossbow'],
  picareta:['pickaxe','pick'], pa:['shovel','spade'], vara:['fishing_pole','fishing_rod'], alaude:['lute'], serrote:['saw'], tocha:['torch']};
const WK={}; for(const [k,ids] of Object.entries(WMAP)) for(const id of ids) WK[id]=k;
const WSCALE={shortsword:.85,hatchet:.85,hand_axe:.9,double_axe:1.25,broadsword:1.1,longsword:1.05,wand:.5,cleaver:.75,scepter:.85,bone:.85,shortbow:.9,longbow:1.08,maul:1.15};
function weaponKey(id){ if(!id||id==='fists') return null; if(WK[id]) return WK[id];
  if(/^m_/.test(id)) return null; return undefined; }   // undefined = arma sem PNG (ferramenta): usa o traço antigo
const UPRIGHT=new Set(['lanca','alabarda','cajado','picareta','pa','vara','tocha']);
function restAng(k,ang,face){ const fa=FACE_ANG[face]; if(fa==null) return ang;
  const d1=Math.abs(ang-(fa+0.9)), d2=Math.abs(ang-(fa+0.5)); if(d1>1e-4&&d2>1e-4) return ang;   // atacando/mirando: ângulo do jogo
  const out=face==='down'?-1:face==='up'?1:face==='left'?-1:1;
  if(k==='arco') return out*0.15;                       // arco em pé na mão
  if(UPRIGHT.has(k)) return -Math.PI/2+out*0.18;        // haste em pé, levemente para fora
  return Math.PI/2+out*0.35; }                          // lâmina para baixo, rente à perna
function drawWeap(g,x,y,id,ang,face,bx){
  const k=weaponKey(id); if(k===null) return; if(k!==undefined) ang=restAng(k,ang,face);
  const hx=face==='down'?-9:face==='up'?9:face==='left'?-5:5, hy=-23;
  if(k===undefined){ try{ drawWeapon(g,x+hx/2,y+(hy+18)/2,id,ang); }catch(e){} return; }
  const W=L2.weap[k]; if(!W) return; const s=WSCALE[id]||1, bow=k==='arco';
  if(k==='alaude'){ // alaúde: no peito, não gira
    if(face==='up') return; const lx=face==='down'?-1:face==='left'?-3:3, la=face==='down'?-0.75:face==='left'?-0.6:0.6;
    g.save(); g.translate(x,y); g.scale(.5,.5); g.translate(lx+(bx||0),-26); g.rotate(la); g.drawImage(W.im,-W.px,-W.py); g.restore(); return; }
  g.save(); g.translate(x,y); g.scale(.5,.5); g.translate(hx+(bx||0)+Math.round(Math.cos(ang)*3),hy+Math.round(Math.sin(ang)*2));
  g.rotate(bow?ang:ang+Math.PI/2); if(s!==1) g.scale(s,s); g.drawImage(W.im,-W.px,-W.py); g.restore(); }
// =====================================================================
// CAMADAS (personalização completa): corpo-base pintado (pele/roupa/calça tingidas pelo look),
// cabelo, barba, elmo/capuz/chapéu, capa (atrás na frente/perfil, por cima nas costas),
// escudo SÓ quando equipado, armas e ferramentas, e montarias com o cavaleiro sentado.
// Cada combinação vira uma folha 3x3 em cache (canvas), feita uma vez só.
// =====================================================================
const CM={meta:null,body:{},esc:{},escD:{},mnt:{},cache:new Map(),mcache:new Map(),ready:false};
L2.camadas=CM;
const hexRGB=h=>{ if(!h||h[0]!=='#') return [128,128,128]; if(h.length===4) h='#'+h[1]+h[1]+h[2]+h[2]+h[3]+h[3]; const n=parseInt(h.slice(1,7),16); return [n>>16,(n>>8)&255,n&255]; };
const mul=(c,k)=>[Math.min(255,c[0]*k|0),Math.min(255,c[1]*k|0),Math.min(255,c[2]*k|0)];
const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t|0,a[1]+(b[1]-a[1])*t|0,a[2]+(b[2]-a[2])*t|0];
const lift=(c,k)=>[c[0]+(255-c[0])*k|0,c[1]+(255-c[1])*k|0,c[2]+(255-c[2])*k|0];
function imgData(im){ const c=document.createElement('canvas'); c.width=im.width; c.height=im.height; const g=c.getContext('2d',{willReadFrequently:true}); g.drawImage(im,0,0); try{ return g.getImageData(0,0,c.width,c.height); }catch(e){ throw e; } }
// ---- qual corpo-base, e as cores ----
const WK2=k=>{ try{ return k&&WEAR[k]||null; }catch(e){ return null; } };
function gearOf(h){
  const gi=h.gi||(player&&h.look===player.look&&player.gi)||null, K=sl=>{ try{ return gi&&gi[sl]?drawKey(gi[sl]):null; }catch(e){ return null; } };
  const bk=K('body')||h.body||null, hk=K('head')||h.head||null;
  return {gi,bk,hk,body:WK2(bk),head:WK2(hk),cloak:WK2(K('cloak')),shield:WK2(K('shield')),legs:WK2(K('legs')),feet:WK2(K('feet'))}; }
function bodySheet(G,fem){ const W_=G.body, k=W_&&W_.kind, id=G.bk;
  if(!k) return fem?'f_pano':'m_pano';
  switch(k){ case 'shirt': case 'quilt': return fem?'f_pano':'m_pano';
    case 'leather': case 'studded': case 'apron': return fem?'f_couro':'m_couro';
    case 'chain': return fem?'f_malha':'m_malha';
    case 'scale': case 'brig': return fem?'f_malha':'m_lamelar';
    case 'plate': return fem?'f_placas':'m_placas';
    case 'tabard': return fem?'f_malha':'m_sobreveste';
    case 'robe': if(id==='villager_dress') return fem?'f_manto':'m_pano'; if(['monk_robe','pilgrim_habit'].includes(id)) return fem?'f_manto':'m_batina'; return fem?'f_manto':'m_manto'; }
  return fem?'f_pano':'m_pano'; }
function dressOf(h){
  const L=h.look||{}, G=gearOf(h), fem=L.sex==='f', sheet=bodySheet(G,fem), W_=G.body;
  const tintBody=W_&&['shirt','quilt','tabard','robe'].includes(W_.kind);
  const tunic=tintBody?W_.col:(L.jacket||'#7a5a3a');
  const pants=(G.legs&&G.legs.col)||L.pants||'#4a3a2a';
  const hair=L.hair||'#3a2a1a', style=L.style||(fem?'long':'short');
  return {sheet,fem,skin:L.skin||'#d8a878',tunic,pants,hair,style:fem&&style==='buzz'?'short':style,beard:fem?0:(L.beard|0),
    head:G.head,hk:G.hk,cloak:G.cloak,shield:G.shield,race:L.race,crossT:G.bk==='templar_tabard'||G.bk==='crusader_surcoat'};
}
const dressKey=d=>[d.sheet,d.skin,d.tunic,d.pants,d.hair,d.style,d.beard,d.hk||'',d.head&&d.head.col||'',d.cloak?d.cloak.kind+d.cloak.col:'',d.crossT?1:0].join('|');
// ---- pintura em pixels ----
function painter(W,H){ const a=new Uint8ClampedArray(W*H*4);
  const P={a,W,H,set(x,y,c){ x|=0;y|=0; if(x<0||y<0||x>=W||y>=H) return; const i=(y*W+x)*4; a[i]=c[0];a[i+1]=c[1];a[i+2]=c[2];a[i+3]=255; },
    get(x,y){ if(x<0||y<0||x>=W||y>=H) return 0; return a[(y*W+x)*4+3]; },
    row(y,x0,x1,f){ for(let x=Math.round(x0);x<=Math.round(x1);x++) P.set(x,y,typeof f==='function'?f(x,y):f); } };
  return P; }
// contorno escuro onde a camada encosta no vazio (e não está sobre o corpo)
function outline(P,bodyA,ink){ const W=P.W,H=P.H,src=P.a.slice(), out=[];
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){ const i=(y*W+x)*4; if(src[i+3]) continue; if(bodyA&&bodyA[i+3]) continue;
    let n=0; if(x>0&&src[i-1]) n=i-4; else if(x<W-1&&src[i+7]) n=i+4; else if(y>0&&src[i-W*4+3]) n=i-W*4; else if(y<H-1&&src[i+W*4+3]) n=i+W*4;
    if(n) out.push(i,n); }
  for(let k=0;k<out.length;k+=2){ const i=out[k],n=out[k+1]; P.a[i]=src[n]*.35|0; P.a[i+1]=src[n+1]*.35|0; P.a[i+2]=src[n+2]*.35|0; P.a[i+3]=255; } }
// cores de material: metal brilha mais, pano é mais chapado
function pal(col,metal){ const c=hexRGB(col); return metal?{hi:lift(c,.45),b:c,sh:mul(c,.7),dk:mul(c,.45)}:{hi:lift(c,.18),b:c,sh:mul(c,.78),dk:mul(c,.55)}; }
const isMetal=W_=>W_&&['iron','blackiron','bronze','silver','gold','steel'].includes(W_.mat);
// ---- cabelo e barba ----
function drawHair(P,d,F,face,ox,oy){
  const st=d.style; if(st==='bald') return; const [x0,y0,x1,y1]=F.cab.map((v,i)=>v+(i%2?oy:ox)), sh=F.ombro[1]+oy;
  let c=hexRGB(d.hair); if(st==='buzz') c=mix(c,hexRGB(d.skin),.4);
  const hi=lift(c,.22), dk=mul(c,.62), md=mix(c,dk,.45), tex=(x,y)=>(y===y0?hi:(y===y0+1&&x<x0+(x1-x0)*.45)?hi:((x-x0)%3===1&&y>y0+1)?md:c);
  const mid=(x0+x1)/2|0;
  if(face==='down'){
    P.row(y0,x0+1,x1-1,tex); P.row(y0+1,x0,x1,tex); P.row(y0+2,x0,x1,(x,y)=>x===x0||x===x1?dk:tex(x,y));
    if(st!=='buzz'){ P.set(x0,y0+3,dk); P.set(x1,y0+3,dk); P.set(x0,y0+4,dk); P.set(x1,y0+4,dk); }
    if(st==='long'){ for(let y=y0+2;y<=sh+3;y++){ P.set(x0-1,y,y>sh?dk:c); P.set(x1+1,y,y>sh?dk:c); if(y>y1-1){ P.set(x0,y,dk); P.set(x1,y,dk);} } }
    if(st==='braid'){ for(let y=y1;y<=y1+8;y++) P.set(x1+1,y,y%2?dk:c); P.set(x1+1,y1+9,dk); }
  } else if(face==='up'){
    const bot=st==='buzz'?y0+4:y0+6;
    for(let y=y0;y<=bot;y++){ const e=y===y0?1:0; P.row(y,x0+e,x1-e,(x,yy)=>x===x0||x===x1||yy===bot?dk:tex(x,yy)); }
    if(st==='long'){ for(let y=y0+3;y<=sh+4;y++) P.row(y,x0-1+(y>sh+2?1:0),x1+1-(y>sh+2?1:0),(x,yy)=>(x===x0-1||x===x1+1||yy>=sh+3)?dk:(x%3===0?mix(c,dk,.5):c)); }
    if(st==='ponytail'){ for(let y=bot;y<=bot+7;y++) P.row(y,mid,mid+1,y%3?c:dk); }
    if(st==='braid'){ for(let y=bot;y<=bot+10;y++) P.set(mid,y,y%2?c:dk); P.set(mid+1,bot+1,dk); }
  } else { // perfil: rosto para a esquerda (x0), nuca à direita (x1)
    P.row(y0,x0+2,x1-1,tex); P.row(y0+1,x0+1,x1,tex); P.row(y0+2,x0+1,x1,(x,y)=>x<=x0+2?dk:tex(x,y));
    const back=st==='buzz'?y0+4:y0+6; for(let y=y0+3;y<=back;y++) P.row(y,x0+4,x1,(x,yy)=>x===x1||yy===back?dk:tex(x,yy));
    if(st==='long'){ for(let y=y0+3;y<=sh+4;y++) P.row(y,x1-2,x1+1,(x,yy)=>x===x1+1||yy>=sh+3?dk:c); }
    if(st==='ponytail'){ for(let y=y0+3;y<=y0+10;y++) P.row(y,x1+1,x1+(y<y0+8?2:1),y%3?c:dk); }
    if(st==='braid'){ for(let y=y0+5;y<=y0+15;y++) P.set(x1,y,y%2?c:dk); }
  }
}
function drawBeard(P,d,F,face,ox,oy){
  const b=d.beard; if(!b||face==='up') return; const [x0,y0,x1,y1]=F.cab.map((v,i)=>v+(i%2?oy:ox));
  const c=hexRGB(d.hair), dk=mul(c,.62), st=mix(c,hexRGB(d.skin),.45);
  if(face==='down'){
    if(b===1){ P.row(y1-1,x0+1,x1-1,st); P.row(y1,x0+2,x1-2,st); return; }
    P.set(x0,y1-3,dk); P.set(x1,y1-3,dk); P.set(x0,y1-2,c); P.set(x1,y1-2,c); P.row(y1-1,x0,x1,c); P.set((x0+x1)/2|0,y1-1,dk); P.row(y1,x0+1,x1-1,c);
    if(b>=3){ P.row(y1+1,x0+1,x1-1,c); P.row(y1+2,x0+2,x1-2,dk); P.row(y1+3,x0+3,x1-3,dk); }
  } else {
    if(b===1){ P.row(y1-1,x0,x0+3,st); P.row(y1,x0+1,x0+3,st); return; }
    P.set(x0+4,y1-3,dk); P.row(y1-2,x0+3,x0+4,c); P.row(y1-1,x0,x0+4,c); P.row(y1,x0,x0+3,c);
    if(b>=3){ P.row(y1+1,x0,x0+3,c); P.row(y1+2,x0,x0+2,dk); P.row(y1+3,x0,x0+1,dk); }
  }
}
// ---- elmos, capuzes e chapéus ----
const HIDE_HAIR=new Set(['great','coif','hood','bascinet']);
function drawHead(P,d,F,face,ox,oy){
  const W_=d.head; if(!W_) return; const kind=W_.kind, metal=isMetal(W_)||['nasal','great','bascinet','coif','kettle','horned'].includes(kind)&&W_.mat!=='cloth'&&W_.mat!=='leather'&&W_.mat!=='straw';
  let col=W_.col||'#8a8a90'; const p=pal(col,metal);
  const [x0,y0,x1,y1]=F.cab.map((v,i)=>v+(i%2?oy:ox)), hw=x1-x0+1, mid=(x0+x1)/2, sh=F.ombro[1]+oy;
  const shade=(x,y,xa,xb)=>{ const t=(x-xa)/Math.max(1,xb-xa); return face==='up'?(t<.3?p.sh:p.b):(t<.28?p.hi:t>.75?p.sh:p.b); };
  const dome=(top,ws)=>{ ws.forEach((w,i)=>{ const xa=Math.round(mid-w/2+.5), xb=xa+w-1; P.row(top+i,xa,xb,(x,y)=>i===ws.length-1?p.sh:shade(x,y,xa,xb)); }); };
  const mail=(x,y)=>((x+y)%2?p.b:p.sh);
  const front=face==='down', side=face==='left';
  switch(kind){
    case 'nasal': case 'horned': case 'bascinet':
      dome(y0-2,[2,hw-2,hw,hw+1,hw+2,hw+2]); P.row(y0+3,Math.round(mid-(hw+2)/2+.5),Math.round(mid-(hw+2)/2+.5)+hw+1,p.dk);
      if(kind==='nasal'||kind==='horned'){ if(front){ for(let y=y0+4;y<=y0+6;y++) P.set(Math.round(mid),y,p.sh); } else if(side){ for(let y=y0+4;y<=y0+6;y++) P.set(x0,y,p.sh); } }
      if(kind==='horned'){ const bone=[226,214,180], bd=[160,146,110]; const hs=side?[[x0-1,-1],[x1+1,1]]:[[x0-1,-1],[x1+1,1]];
        for(const [hx,s] of hs){ P.set(hx,y0+1,bone); P.set(hx+s,y0,bone); P.set(hx+s*2,y0-1,bone); P.set(hx+s*2,y0-2,bd); P.set(hx+s,y0-3,bd); } }
      if(kind==='bascinet'){ const ml=[150,152,158], md=[96,98,104]; const m2=(x,y)=>((x+y)%2?ml:md);
        if(front){ for(let y=y0+4;y<=y1+1;y++){ P.row(y,x0-1,x0,m2); P.row(y,x1,x1+1,m2); } P.row(y1+1,x0-1,x1+1,m2); P.row(y1+2,x0,x1,m2); }
        else if(side){ for(let y=y0+4;y<=y1+2;y++) P.row(y,x0+3,x1+1,m2); P.row(y1+1,x0+1,x1+1,m2); }
        else { for(let y=y0+4;y<=y1+2;y++) P.row(y,x0-1,x1+1,m2); } }
      break;
    case 'kettle':
      dome(y0-1,[hw-2,hw,hw+1,hw+2]); { const bw=hw+6, xa=Math.round(mid-bw/2+.5); P.row(y0+3,xa,xa+bw-1,(x,y)=>shade(x,y,xa,xa+bw-1)); P.row(y0+4,xa+1,xa+bw-2,p.dk); }
      break;
    case 'great':
      for(let y=y0-1;y<=y1+1;y++){ const e=y===y0-1?1:0, xa=x0-1+e, xb=x1+1-e; P.row(y,xa,xb,(x,yy)=>yy===y1+1?p.dk:shade(x,yy,xa,xb)); }
      if(front){ P.row(y0+3,x0,x1,[20,18,16]); P.set(Math.round(mid),y0+3,p.b); for(let y=y0+5;y<=y1;y++) P.set(Math.round(mid),y,p.sh); P.set(Math.round(mid)-2,y0+6,p.dk); P.set(Math.round(mid)+2,y0+6,p.dk); }
      else if(side){ P.row(y0+3,x0-1,x0+3,[20,18,16]); P.set(x0,y0+6,p.dk); P.set(x0+2,y0+6,p.dk); }
      break;
    case 'coif': case 'hood': {
      const cloth=kind==='hood', f=cloth?((x,y)=>shade(x,y,x0-1,x1+1)):mail;
      for(let y=y0-1;y<=y1+1;y++){ const e=y===y0-1?2:y===y0?1:0; P.row(y,x0-1+e,x1+1-e,f); }
      for(let y=y1+1;y<=Math.min(sh+2,y1+4);y++){ const g2=y-y1; P.row(y,x0-1-g2,x1+1+g2,(x,yy)=>yy===Math.min(sh+2,y1+4)?(cloth?p.dk:p.sh):f(x,yy)); }
      if(cloth&&face==='up'){ P.row(y0-2,Math.round(mid)-1,Math.round(mid),p.b); }
      if(cloth&&side){ P.row(y0,x1+1,x1+2,p.sh); P.row(y0+1,x1+1,x1+3,p.sh); P.set(x1+3,y0+2,p.dk); }
      // abertura do rosto: limpa e deixa o corpo (pele) aparecer
      const clr=(x,y)=>{ const i=(y*P.W+x)*4; P.a[i+3]=0; };
      if(front){ for(let y=y0+2;y<=y1-1;y++) for(let x=x0+1;x<=x1-1;x++) clr(x,y); P.row(y0+1,x0+1,x1-1,cloth?p.dk:p.sh); }
      else if(side){ for(let y=y0+2;y<=y1-1;y++) for(let x=x0-1;x<=x0+2;x++) clr(x,y); }
      break; }
    case 'wizard': {
      const bw=hw+6, xa=Math.round(mid-bw/2+.5); P.row(y0+2,xa,xa+bw-1,(x,y)=>shade(x,y,xa,xa+bw-1)); P.row(y0+3,xa+1,xa+bw-2,p.dk);
      P.row(y0+1,x0,x1,mul(hexRGB(col),.55)); for(let i=0;i<10;i++){ const w=Math.max(1,Math.round((hw-1)*(1-i/10))), lean=Math.round(i*i/30), cx=mid+lean; P.row(y0-i,Math.round(cx-w/2+.5),Math.round(cx-w/2+.5)+w-1,(x,y)=>shade(x,y,cx-w/2,cx+w/2)); }
      break; }
    case 'crown': case 'circlet': {
      const gold=kind==='crown'||W_.mat==='gold'?pal('#d8b040',true):pal(col,true); const xa=x0, xb=x1;
      P.row(y0+2,xa,xb,(x,y)=>((x-xa)<2?gold.hi:gold.b)); if(kind==='crown'){ P.row(y0+1,xa,xb,gold.b); P.set(xa,y0,gold.hi); P.set(Math.round(mid),y0,gold.hi); P.set(Math.round(mid),y0-1,gold.hi); P.set(xb,y0,gold.b); }
      if(front) P.set(Math.round(mid),y0+2,[200,30,40]);
      break; }
    case 'turban': {
      const ws=[hw-3,hw,hw+2,hw+3,hw+3,hw+2]; ws.forEach((w,i)=>{ const xa=Math.round(mid-w/2+.5), xb=xa+w-1; P.row(y0-3+i,xa,xb,(x,y)=>((x+y*2)%4===0?p.sh:(i===ws.length-1?p.sh:shade(x,y,xa,xb)))); });
      if(front) P.set(Math.round(mid),y0,[60,120,200]);
      break; }
    case 'cap': { const ws=[hw-2,hw,hw+2,hw+2,hw+3]; ws.forEach((w,i)=>{ const xa=Math.round(mid-w/2+.5), xb=xa+w-1; P.row(y0-2+i,xa,xb,(x,y)=>((x*5+y*3)%4===0?p.dk:(i>=3?p.sh:shade(x,y,xa,xb)))); }); break; }
    case 'bandana': { P.row(y0+1,x0,x1,(x,y)=>shade(x,y,x0,x1)); P.row(y0+2,x0,x1,p.sh);
      if(face==='up'){ P.set(Math.round(mid),y0+3,p.b); P.set(Math.round(mid)-1,y0+4,p.sh); P.set(Math.round(mid)+1,y0+5,p.sh); }
      else if(side){ P.set(x1+1,y0+2,p.b); P.set(x1+2,y0+3,p.sh); P.set(x1+2,y0+4,p.dk); }
      break; }
    default: dome(y0-1,[hw-2,hw,hw+1,hw+1]);
  }
}
// ---- capas ----
function drawCloakL(P,d,F,face,ox,oy,fr,layer){
  const W_=d.cloak; if(!W_) return; const kind=W_.kind, short=kind==='mantle';
  const p=short?pal(W_.col||'#8a8c90',true):pal(W_.col||'#6a2a20',false);
  const [sx0,sy,sx1]=F.ombro, [lx0,lx1]=F.larg; const top=sy+oy-1, hem=short?sy+oy+9:oy-5+(fr?1:0), mid=(sx0+sx1)/2+ox;
  const f=(x,y,xa,xb)=>{ if(short) return (x+y)%2?p.b:p.sh; if(x<=xa||x>=xb) return p.sh; if(y>=hem) return p.dk;
    const t=(x-xa)/Math.max(1,xb-xa); let c=t<.22?mix(p.b,p.hi,.45):t>.72?p.sh:p.b; if(((x-Math.round(xa))%4)===2&&y>top+2) c=mix(c,p.sh,.55); if(y===hem-1) c=mix(c,p.sh,.5); return c; };
  const lerp=(a,b,t)=>a+(b-a)*t;
  if(face==='down'){
    if(layer==='back'){ for(let y=top;y<=hem;y++){ const t=(y-top)/Math.max(1,hem-top), e_=y===hem?1:0, xa=Math.round(lerp(sx0-1,lx0-1,t)+ox)+e_, xb=Math.round(lerp(sx1+1,lx1+1,t)+ox)-e_; P.row(y,xa,xb,(x,yy)=>f(x,yy,xa,xb)); } }
    else { P.row(top,sx0+ox-1,sx0+ox+2,p.b); P.row(top+1,sx0+ox-1,sx0+ox+1,p.sh); P.row(top,sx1+ox-2,sx1+ox+1,p.b); P.row(top+1,sx1+ox-1,sx1+ox+1,p.sh); P.set(Math.round(mid),top+1,[216,176,64]); }
  } else if(face==='up'){
    if(layer!=='front') return;
    for(let y=top;y<=hem;y++){ const t=(y-top)/Math.max(1,hem-top), e_=y===hem?1:0, xa=Math.round(lerp(sx0-1,lx0-1,t)+ox)+e_, xb=Math.round(lerp(sx1+1,lx1+1,t)+ox)-e_; P.row(y,xa,xb,(x,yy)=>f(x,yy,xa,xb)); }
    P.row(top-1,Math.round(mid)-3,Math.round(mid)+3,p.sh);
    if(kind==='crosscape'){ const cx=Math.round(mid), cy=top+7, red=[180,30,30]; for(let y=cy-3;y<=cy+4;y++) P.row(y,cx-0,cx+1,red); P.row(cy-1,cx-3,cx+4,red); P.row(cy,cx-3,cx+4,red); }
  } else {
    if(layer==='back'){ for(let y=top;y<=hem;y++){ const t=(y-top)/Math.max(1,hem-top), xa=Math.round(mid-1), xb=Math.round(lerp(sx1+1,lx1+4,t)+ox+(fr&&t>.6?1:0)); P.row(y,xa,xb,(x,yy)=>f(x,yy,xa,xb)); } }
    else { P.row(top,Math.round(mid)-1,sx1+ox+1,p.b); P.row(top+1,Math.round(mid),sx1+ox+1,p.sh); }
  }
}
// ---- compõe a folha 3x3 de uma combinação (cache) ----
function tintBody(id,d){
  const B_=CM.body[id], sd=B_.shade.data, md=B_.mask.data, n=sd.length, out=new Uint8ClampedArray(n);
  const cs=[hexRGB(d.skin),hexRGB(d.tunic),hexRGB(d.pants)];
  for(let i=0;i<n;i+=4){ const a=sd[i+3]; if(!a){ continue; } let ch=-1; if(md[i]>128) ch=0; else if(md[i+1]>128) ch=1; else if(md[i+2]>128) ch=2;
    if(ch<0){ out[i]=sd[i]; out[i+1]=sd[i+1]; out[i+2]=sd[i+2]; out[i+3]=255; continue; }
    const s=sd[i]/128, c=cs[ch]; for(let k=0;k<3;k++) out[i+k]=s<=1?c[k]*s:c[k]+(255-c[k])*(s-1)*.55; out[i+3]=255; }
  return out; }
function compose(d){
  const k=dressKey(d); let e=CM.cache.get(k); if(e){ CM.cache.delete(k); CM.cache.set(k,e); return e; }
  const M=CM.meta, B_=CM.body[d.sheet], cw=M.corpo.cw, ch=M.corpo.ch, ax=M.corpo.ax, ay=M.corpo.ay, W=cw*3, H=ch*3;
  const body=tintBody(d.sheet,d), back=painter(W,H), front=painter(W,H), FR=M.corpos[d.sheet].quadros, faces=['down','up','left'];
  for(let r=0;r<3;r++) for(let c=0;c<3;c++){ const F=FR[r*3+c], ox=c*cw+ax, oy=r*ch+ay, face=faces[r];
    drawCloakL(back,d,F,face,ox,oy,c,'back');
    if(face==='up') drawCloakL(front,d,F,face,ox,oy,c,'front');
    const hk=d.head&&d.head.kind; if(!HIDE_HAIR.has(hk)) drawHair(front,d,F,face,ox,oy);
    if(hk!=='great') drawBeard(front,d,F,face,ox,oy);
    if(face!=='up') drawCloakL(front,d,F,face,ox,oy,c,'front');
    drawHead(front,d,F,face,ox,oy); }
  const bodyImg={data:body}; outline(back,body,null); outline(front,body,null);
  // junta: capa de trás -> corpo -> frente
  const fin=new Uint8ClampedArray(W*H*4);
  for(const L_ of [back.a,body,front.a]) for(let i=0;i<fin.length;i+=4) if(L_[i+3]){ fin[i]=L_[i]; fin[i+1]=L_[i+1]; fin[i+2]=L_[i+2]; fin[i+3]=255; }
  const cv=document.createElement('canvas'); cv.width=W; cv.height=H; cv.getContext('2d').putImageData(new ImageData(fin,W,H),0,0);
  e={cv,k,d,F:FR}; CM.cache.set(k,e); if(CM.cache.size>180) CM.cache.delete(CM.cache.keys().next().value); return e; }
function blitC(g,e,x,y,face,fr,o){
  const M=CM.meta.corpo, im=(o&&o.flash)?(e.white||(e.white=whiteOf(e.cv))):e.cv, row=ROW[face]!=null?ROW[face]:0, flip=face==='right', sx=(o&&o.sx)||1, sy=(o&&o.sy)||1;
  g.save(); g.translate(x,y); g.scale(.5*sx*(flip?-1:1),.5*sy);
  if(o&&o.clipY!=null){ g.beginPath(); g.rect(-M.ax,-M.ay,M.cw,M.ay+o.clipY); g.clip(); }
  g.drawImage(im,(fr||0)*M.cw,row*M.ch,M.cw,M.ch,-M.ax+((o&&o.dx)||0)*(flip?-1:1),-M.ay+((o&&o.dy)||0),M.cw,M.ch); g.restore(); }
// ---- escudo (só se equipado) ----
const ESC_K={buckler:'broquel',round:'redondo',heater:'heater',kite:'pipa',cross:'cruzado',tower:'torre'};
function shieldKey(W_,id){ if(!W_) return null; let k=ESC_K[W_.kind]||'redondo'; if(id==='round_shield'&&k==='redondo') k='redondo'; return k; }
function drawShieldL(g,x,y,d,face,F,stage,o){
  const k=shieldKey(d.shield); if(!k) return; const im=CM.esc[k]; if(!im) return;
  // estágio: 'behind' (antes do corpo) ou 'front'
  const want=(face==='up'||face==='right')?'behind':'front'; if(stage!==want) return;
  const s=k==='broquel'?1:1, sh=F.ombro; let cx, cy=-24, sxk=1, img=im;
  if(face==='down'){ cx=sh[2]+1; cy=-25; }
  else if(face==='up'){ cx=sh[0]-1; cy=-25; img=CM.escD[k]; }
  else { cx=-4; cy=-25; sxk=.62; }
  const bx=(o&&o.dx)||0, by=(o&&o.dy)||0;
  g.save(); g.translate(x,y); g.scale(.5*(face==='right'?-1:1),.5); g.translate(cx+bx,cy+by); g.scale(sxk,1);
  g.drawImage(img,-Math.round(img.width/2),-Math.round(img.height/2)); g.restore(); }
// ---- tocha (lanterna acesa) na mão livre ----
function drawTorch(g,x,y,face,o){ const W=L2.weap.tocha; if(!W) return; const hx=face==='down'?9:face==='up'?-9:face==='left'?-3:3, by=(o&&o.dy)||0;
  g.save(); g.translate(x,y); g.scale(.5,.5); g.translate(hx,-23+by); g.rotate(face==='left'?-.25:face==='right'?.25:0); g.drawImage(W.im,-W.px,-W.py); g.restore();
  if(Math.random()<.3&&typeof fxs!=='undefined'&&g===bctx){} }
// ---- montarias ----
const MNT_K={horse:'cavalo',warhorse:'cavalo_guerra',camel:'camelo',reindeer:'rena'};
function mountSheet(kind,a){ if(kind==='horse'&&a&&(a.barded||a.war)) return 'cavalo_guerra'; return MNT_K[kind]||null; }
function mountTint(k,col,saddle){
  const key=k+'|'+(col||'')+'|'+(saddle?1:0); let e=CM.mcache.get(key); if(e) return e; const S=CM.mnt[k]; if(!S) return null;
  const sd=S.shade.data, md=S.mask.data, out=new Uint8ClampedArray(sd.length), c=hexRGB(col||'#d0d0d0'), tint=CM.meta.montarias[k].pelagem_tingivel;
  for(let i=0;i<sd.length;i+=4){ if(!sd[i+3]) continue; out[i+3]=255;
    let coat=tint&&md[i]>128, sad=tint&&!saddle&&md[i+1]>128; let v=[sd[i],sd[i+1],sd[i+2]], s=sd[i]/128;
    if(sad){ s=.92; coat=true; }
    if(coat&&col){ for(let q=0;q<3;q++) v[q]=s<=1?c[q]*s:c[q]+(255-c[q])*(s-1)*.55; } else if(coat){ for(let q=0;q<3;q++) v[q]=Math.min(255,208*s); }
    out[i]=v[0]; out[i+1]=v[1]; out[i+2]=v[2]; }
  const cv=document.createElement('canvas'); cv.width=S.shade.width; cv.height=S.shade.height; cv.getContext('2d').putImageData(new ImageData(out,cv.width,cv.height),0,0);
  e={cv,k}; CM.mcache.set(key,e); return e; }
function blitM(g,e,x,y,face,fr,o){ const m=CM.meta.montarias[e.k], im=(o&&o.flash)?(e.white||(e.white=whiteOf(e.cv))):e.cv, row=ROW[face]!=null?ROW[face]:2, flip=face==='right';
  g.save(); g.translate(x,y); g.scale(.5*(flip?-1:1),.5);
  if(o&&o.region){ let [rx0,ry0,rx1,ry1]=o.region; ry0=Math.max(ry0,-m.ay); g.drawImage(im,fr*m.cw+m.ax+rx0,row*m.ch+m.ay+ry0,rx1-rx0,ry1-ry0,rx0,ry0,rx1-rx0,ry1-ry0); }
  else g.drawImage(im,fr*m.cw,row*m.ch,m.cw,m.ch,-m.ax,-m.ay,m.cw,m.ch); g.restore(); }
const LEGC={m_placas:'#a9abb2',f_placas:'#a9abb2',m_sobreveste:'#86888e'};
function riderLegs(g,x,y,face,sx,sy,d){
  const robe=/manto|batina/.test(d.sheet), pc=LEGC[d.sheet]||(robe?d.tunic:d.pants), p=pal(pc,false), boot=[74,46,26], bd=[40,24,14], flip=face==='right';
  const R=(a,b,w,h,c)=>{ g.fillStyle='rgb('+c.join(',')+')'; g.fillRect(a,b,w,h); };
  g.save(); g.translate(x,y); g.scale(.5*(flip?-1:1),.5); g.translate(sx,sy);
  if(face==='left'||face==='right'){ // perna de perto, coxa para a frente e canela para baixo
    R(-8,-2,10,6,p.dk); R(-7,-1,8,4,p.b); R(-7,-1,8,1,p.hi); R(-7,2,3,9,p.dk); R(-6,2,2,8,p.b); R(-9,9,6,4,bd); R(-8,9,4,3,boot);
    if(robe){ R(-5,-1,7,7,p.sh); R(-4,-1,5,6,p.b); } }
  else { const hw=face==='down'?8:9; for(const s of [-1,1]){ const xo=s<0?-hw-2:hw-1; R(s<0?-hw:3,-2,hw-2,4,p.dk); R(s<0?-hw+1:3,-1,hw-3,2,p.b); R(xo,0,3,9,p.dk); R(xo+1,0,1,8,p.b); R(xo-(s<0?1:0),8,4,4,bd); R(xo+(s<0?0:0),8,3,3,boot); } }
  g.restore(); }
function drawMounted(g,x,y,h,c){
  const m=player.mount, mk=mountSheet(m.kind,m); if(!mk||!CM.mnt[mk]) return false;
  const face=h.face||'left', mf=frameOf(player.moving,(player.phase||0)*1.3), e=mountTint(mk,m.col||(m.kind==='horse'?'#6a4428':null),true), MM=CM.meta.montarias[mk];
  const MF=MM.quadros[(ROW[face]??2)*3+mf], flip=face==='right', d=dressOf(h), ce=compose(d), F=ce.F[(ROW[face]??0)*3];
  const bob=mf?-1:0, lift_=face==='down'?-6:face==='up'?-2:0, sxp=MF.sela[0], syp=MF.sela[1]+bob+lift_, ry=syp-F.quadril, rx=sxp*(flip?-1:1);
  const R_=(typeof RACES!=='undefined'&&RACES[d.race])||null;
  g.fillStyle='rgba(0,0,0,.22)'; g.beginPath(); g.ellipse(x,y,face==='left'||face==='right'?17:8,face==='left'||face==='right'?3.5:4.5,0,0,6.283); g.fill();
  const wx=x+rx*.5, wy=y+ry*.5, behindW=face==='up'||face==='left', fl=h.flash;
  blitM(g,e,x,y,face,mf,{flash:fl&&false});
  if(behindW) drawWeap(g,wx,wy,h.weapon,h.wAng,face);
  drawShieldL(g,wx,wy,d,face,F,'behind');
  if(face==='left'||face==='right') riderLegs(g,x,y,face,sxp,syp,d);
  blitC(g,ce,wx,wy,face,0,{flash:fl,clipY:F.quadril+2,sx:R_?R_.sx:1,sy:R_?R_.sy:1});
  if(face==='up') riderLegs(g,x,y,face,sxp,syp,d);
  if(face==='down'){ const hy=MF.h?(-MF.h):-MM.ay; blitM(g,e,x,y,face,mf,{region:[-6,hy,6,MF.sela[1]+bob+2]}); riderLegs(g,x,y,face,sxp,syp,d); } // a cabeça do cavalo fica na frente do cavaleiro
  drawShieldL(g,wx,wy,d,face,F,'front');
  if(!behindW) drawWeap(g,wx,wy,h.weapon,h.wAng,face);
  return true; }
CM.api={dressOf,compose,blitC,drawShieldL,drawWeap:(...a)=>drawWeap(...a),drawMounted,mountTint,blitM,riderLegs,drawTorch,mountSheet,frameOf};
// ---------------- quem é quem ----------------
const WEARK=k=>k&&typeof WEAR!=='undefined'&&WEAR[k]?WEAR[k]:null;
function bodyOf(gi,equip){ let k=null; try{ if(gi&&gi.body) k=drawKey(gi.body); }catch(e){} return k||(equip&&equip.body)||null; }
function advFor(o){ // o: {gi, equip, body, weapon, sex}
  const bk=o.body||bodyOf(o.gi,o.equip), W_=WEARK(bk), kind=W_&&W_.kind, wk=WK[o.weapon], fem=o.sex==='f';
  if(kind && ['chain','plate','scale','tabard','brig'].includes(kind)) return 'cavaleiro';
  if(wk==='arco') return 'patrulheiro';
  if(kind==='robe'){ if(bk==='villager_dress') return fem?'aldea':'aldeao'; if(['monk_robe','pilgrim_habit'].includes(bk)) return fem?'viajante_f':'clerigo'; return fem&&wk!=='cajado'?'viajante_f':'mago'; }
  if(wk==='cajado' && !fem) return 'mago';
  return fem?'viajante_f':'viajante'; }
function npcKind(n){
  if(n.sim) return advFor({gi:n.look&&n.look.gi,weapon:n.weapon,sex:n.look&&n.look.sex});
  const f=n.look&&n.look.sex==='f';
  switch(n.role){ case 'guard': return 'guarda'; case 'lord': return 'nobre'; case 'trader': return f?'aldea':'mercador'; case 'priest': return 'clerigo';
    case 'citizen': return f?'aldea':'aldeao'; }
  if(WK[n.weapon]==='arco') return 'patrulheiro';
  if(n.role==='member'||n.role==='wanderer'||n.role==='loner'){ return f?(n.weapon&&n.weapon!=='fists'?'viajante_f':'aldea'):(n.weapon&&n.weapon!=='fists'?'viajante':'aldeao'); }
  return f?'aldea':'aldeao'; }
// monstros: [sprite, escala em que o PNG já foi feito]. Primeiro o mapa completo do lote2-monstros (meta_monstros.json),
// depois as regras antigas como reserva para ids novos que ainda não estejam no mapa.
const spr=s=>s?String(s).replace(/^lote2:/,''):null;
function monKind(id,M){ if(!M) return null;
  const mp=L2.mapM&&L2.mapM[id], k=mp&&spr(mp.sprite); if(k&&L2.img[k]&&L2.meta.sprites[k]) return [k,mp.escala_base||1];
  if(id==='wolf') return ['lobo',1]; if(id==='spider') return ['aranha',1]; if(id==='bandit') return ['bandido',1];
  if(id==='orc') return ['orc',1.3]; if(id==='goblin') return ['goblin',.8];
  if(M.beast) return null;
  if(M.skel) return ['esqueleto',1]; if(M.rot) return ['zumbi',1];
  if(M.ears) return (M.scale||1)<1.05 ? ['goblin',.82] : ['orc',1.25];
  return null; }
const ANIM_K={bear:'urso',boar:'javali',wolfp:'lobo'};   // substituído pelo mapa_animais ao carregar
function animKind(a){ const mA=L2.mapA||{}, e=(a.sacred&&mA[a.kind+':sacred'])||mA[a.kind], k=e?spr(e.sprite):ANIM_K[a.kind];
  return k&&L2.img[k]&&L2.meta.sprites[k]?[k,e&&e.escala_base||1]:null; }
L2.compose=compose; L2.dressOf=dressOf; L2.monKind=monKind; L2.animKind=animKind;   // para testes (L2.drawn=new Set() registra as folhas desenhadas)
// ---------------- ganchos ----------------
const _drawHuman=drawHuman;
drawHuman=function(g,x,y,h){
  const c=L2.cur; if(!c || !isoNow() || (typeof invOpen!=='undefined'&&invOpen&&c.p)) return _drawHuman(g,x,y,h);
  L2.cur=null; if(c.dy) y+=c.dy;
  const f=h.face||'down', fr=frameOf(h.moving,h.phase), behind=f==='up'||f==='left';
  let done=false;
  if(c.lay && CM.ready){ try{
    if(c.mounted) done=drawMounted(g,x,y,h,c);
    if(!done){ if(c.gi&&!h.gi) h={...h,gi:c.gi}; const d=dressOf(h), e=compose(d), F=e.F[(ROW[f]??0)*3+fr], R_=(typeof RACES!=='undefined'&&RACES[d.race])||null;
      const torch=h.lantern&&!d.shield;
      if(behind) drawWeap(g,x,y,h.weapon,h.wAng,f);
      drawShieldL(g,x,y,d,f,F,'behind'); if(torch&&(f==='up'||f==='right')) drawTorch(g,x,y,f);
      blitC(g,e,x,y,f,fr,{flash:h.flash,sx:R_?R_.sx:1,sy:R_?R_.sy:1});
      drawShieldL(g,x,y,d,f,F,'front'); if(torch&&(f==='down'||f==='left')) drawTorch(g,x,y,f);
      if(!behind) drawWeap(g,x,y,h.weapon,h.wAng,f); done=true; }
  }catch(err){ if(!L2._errOnce){ L2._errOnce=1; console.error('[lote2 camadas]',err); } done=false; } }
  if(!done){
    if(c.mounted){ return _drawHuman(g,x,y-(c.dy||0),h); }
    const k=c.k||advFor({gi:h.gi,body:h.body,weapon:h.weapon,sex:h.look&&h.look.sex});
    const R_=(typeof RACES!=='undefined'&&h.look&&RACES[h.look.race])||null, sx=R_?R_.sx:1, sy=R_?R_.sy:1;
    if(behind) drawWeap(g,x,y,h.weapon,h.wAng,f);
    blit(g,k,x,y,f,fr,{flash:h.flash,sx,sy});
    if(!behind) drawWeap(g,x,y,h.weapon,h.wAng,f); }
  // fala do jogador (o hud.js fazia isso dentro do drawHuman)
  if(c.p && player.say && performance.now()<player.say.until && g===bctx) HILABELS.push({wx:player.x, wy:player.y-(c.mounted?44:30), say:player.say.text, mine:true});
};
const _drawPlayer=drawPlayer;
drawPlayer=function(g,x,y){
  // espírito do jogador (morto): fantasma pintado, translúcido, flutuando de leve
  if(isoNow() && player.ghost && L2.img.fantasma_jogador && !(typeof invOpen!=='undefined'&&invOpen)){
    const t=performance.now()/1000, bob=Math.round(Math.sin(t*2.2)*1.5)-1, ga=g.globalAlpha;
    g.globalAlpha=ga*(.78+.08*Math.sin(t*3.1));
    try{ blit(g,'fantasma_jogador',x,y+bob,player.face||'down',frameOf(player.moving,player.phase)); } finally { g.globalAlpha=ga; }
    if(player.say && performance.now()<player.say.until && g===bctx) HILABELS.push({wx:player.x, wy:player.y-30, say:player.say.text, mine:true});
    return; }
  if(isoNow() && !player.ghost && !(typeof invOpen!=='undefined'&&invOpen)){
    const mounted=!!(player.mount && CM.ready && mountSheet(player.mount.kind,player.mount));
    if(player.mount && !mounted) return _drawPlayer(g,x,y);
    L2.cur={p:true,lay:true,mounted,k:advFor({gi:player.gi,equip:player.equip,weapon:player.weapon,sex:player.look&&player.look.sex})};
    if(player.invisT>0) g.globalAlpha=.3;
    try{ _drawPlayer(g,x,y); } finally { L2.cur=null; if(player.invisT>0) g.globalAlpha=1; }
    return; }
  return _drawPlayer(g,x,y); };
const _drawNPC=drawNPC;
drawNPC=function(g,n,sx,sy){
  if(isoNow()){ const arch=!n.sim&&['guard','lord','trader','priest'].includes(n.role); L2.cur={k:npcKind(n),n,dy:5,lay:!arch,gi:n.look&&n.look.gi}; try{ return _drawNPC(g,n,sx,sy-5); } finally { L2.cur=null; } }
  return _drawNPC(g,n,sx,sy); };
const _drawRaider=drawRaider;
drawRaider=function(g,r,x,y){
  const M=(typeof MONS!=='undefined')&&MONS[r.mon], mk=isoNow()&&monKind(r.mon,M);
  if(!mk){ if(!isoNow()) return _drawRaider(g,r,x,y); L2.cur={lay:true}; try{ return _drawRaider(g,r,x,y); } finally { L2.cur=null; } }
  const [k,base]=mk, cat=L2.meta.sprites[k].categoria; if(L2.drawn) L2.drawn.add('r:'+r.mon+'>'+k); let s=(M.scale||1)/base; if(r.mon==='orc'||r.mon==='goblin'||Math.abs(s-1)<.1) s=1;
  let a; if(r.wind>0) a=r.aimAng-1.3; else if(r.swingT>0) a=r.aimAng-1.3+2.6*(1-r.swingT/.2); else a=FACE_ANG[r.face]+0.9;
  const f=r.face||'down', fr=frameOf(r.moving,r.phase), fl=r.hurtT>0;
  // investida curta quando ataca sem arma (zumbi, lobo, aranha)
  let dx=0, dy=0; const atk=r.swingT>0||r.wind>0, wid=M.show||r.weapon, unarmed=cat==='fera'||weaponKey(wid)===null;
  if(atk && unarmed){ const v={down:[0,1],up:[0,-1],left:[-1,0],right:[1,0]}[f]||[0,0], p=r.swingT>0?3:-1; dx=v[0]*p; dy=v[1]*p*.6; }
  if(M.ghost) g.globalAlpha=.55;
  g.save(); g.translate(x,y); if(s!==1) g.scale(s,s);
  const SM=L2.meta.sprites[k], behind=f==='up'||f==='left', hgt=SM.altura||52, ws=hgt>62?hgt/54:1;   // humanoide grande: arma na mão dele
  const wsx=ws===1?1:Math.min(ws*1.3,Math.max(ws,(SM.largura||26)/27)), hx0={down:-9,up:9,left:-5,right:5}[f]||0;
  const wpn=()=>{ if(ws===1) return drawWeap(g,0,0,wid,a,f); g.save(); g.translate(hx0/2*wsx,-11.5*ws); g.scale(ws,ws); g.translate(-hx0/2,11.5); drawWeap(g,0,0,wid,a,f); g.restore(); };
  if(cat!=='fera' && behind) wpn();
  blit(g,k,0,0,f,fr,{flash:fl,dx:dx*2,dy:dy*2});
  if(cat!=='fera' && !behind) wpn();
  g.restore(); g.globalAlpha=1;
  if(M.glow && !fl && Math.random()<.25 && typeof fxs!=='undefined') fxs.push({x:x+(Math.random()-.5)*10*s,y:y-16*s,vx:0,vy:-8,t:.4,col:M.glow});
  const hh=L2.meta.sprites[k].altura||26, top=-Math.round((hh/2)*s)-5;
  if(r.hp<r.max){ g.fillStyle='#000'; g.fillRect(x-8,y+top,16,3); g.fillStyle=M.boss?'#d8a020':'#b8433a'; g.fillRect(x-7,y+top+1,Math.max(0,Math.round(14*r.hp/r.max)),1); }
  if(M.boss && typeof bctx!=='undefined' && g===bctx && Math.hypot(player.x-r.x,player.y-r.y)<9*T) HILABELS.push({wx:r.x, wy:r.y+top-2, boss:M.name});
  if(r.alertT>0 || r.wind>0){ g.fillStyle = r.wind>0 ? '#ff5a3a' : '#ffd25a'; g.fillRect(x,y+top-7,1,4); g.fillRect(x,y+top-2,1,1); }
};
const _drawAnimal=drawAnimal;
drawAnimal=function(g,a,sx,sy){
  if(!isoNow() || a.mounted) return _drawAnimal(g,a,sx,sy);
  const f=a.face>0?'right':'left', fr=frameOf(a.moving,a.phase), mk=CM.ready&&mountSheet(a.kind,a);
  // selvagem: folha do lote2-monstros (sem sela nem manta). Domado (ou cavalo de pelagem própria): folha de montaria tingida.
  const ak=animKind(a), wildOk=ak&&!a.tamed&&!(a.kind==='horse'&&a.col&&a.col!=='#6a4428')&&!a.barded&&!a.war;
  if(wildOk || (!mk && ak)){ const s=ak[1]!==1?1/ak[1]:1; if(L2.drawn) L2.drawn.add('a:'+a.kind+(a.sacred?':sacred':'')+'>'+ak[0]);
    if(a.tamed){ g.fillStyle='rgba(120,220,120,.5)'; g.fillRect(sx-6,sy+1,12,1); }
    if(s!==1){ g.save(); g.translate(sx,sy); g.scale(s,s); blit(g,ak[0],0,0,f,fr,{flash:a.hurtT>0}); g.restore(); } else blit(g,ak[0],sx,sy,f,fr,{flash:a.hurtT>0}); return; }
  if(mk && CM.mnt[mk]){ if(L2.drawn) L2.drawn.add('a:'+a.kind+'>montaria:'+mk); const e=mountTint(mk,a.col||(a.kind==='horse'?'#6a4428':null),!!a.tamed&&a.saddle!==false);
    if(a.tamed){ g.fillStyle='rgba(120,220,120,.5)'; g.fillRect(sx-6,sy+1,12,1); }
    blitM(g,e,sx,sy,f,fr,{flash:a.hurtT>0}); return; }
  return _drawAnimal(g,a,sx,sy); };
// ---------------- retrato do HUD (52x60, pintado) ----------------
let pKey='';
function portrait(){ if(!L2.ready||!running||!player) return; const c=document.getElementById('hud-portrait'); if(!c) return;
  if(player.ghost){ const gp=L2.portrait.__fantasma;
    if(!gp){ if(c.width!==26){ c.width=26; c.height=30; pKey=''; try{ portraitKey=''; }catch(e){} } return; }
    // redesenha a cada meio segundo: o retrato antigo (ui.js) pode ter rabiscado por cima ao virar espírito
    if(c.width!==52){ c.width=52; c.height=60; } pKey='ghost'; const g=c.getContext('2d'); g.imageSmoothingEnabled=false;
    g.clearRect(0,0,52,60); g.fillStyle='#16181e'; g.fillRect(0,0,52,60); g.drawImage(gp,0,0); return; }
  let e=null; if(CM.ready){ try{ e=compose(dressOf({look:player.look,gi:player.gi,head:player.equip&&player.equip.head,body:player.equip&&player.equip.body})); }catch(err){ e=null; } }
  const k=e?'L|'+e.k:advFor({gi:player.gi,equip:player.equip,weapon:player.weapon,sex:player.look&&player.look.sex}), im=!e&&L2.portrait[k];
  if(!e&&!im){ if(c.width!==26){ c.width=26; c.height=30; pKey=''; try{ portraitKey=''; }catch(err){} } return; }
  if(c.width!==52){ c.width=52; c.height=60; pKey=''; } if(pKey===k) return; pKey=k; c.width=52; c.height=60;
  const g=c.getContext('2d'); g.imageSmoothingEnabled=false; g.clearRect(0,0,52,60);
  if(e){ const M=CM.meta.corpo, F=e.F[0], top=M.ay+F.cab[1]-5; g.fillStyle='#1c1a16'; g.fillRect(0,0,52,60);
    g.drawImage(e.cv,M.ax-13,top,26,30,0,0,52,60); }
  else g.drawImage(im,0,0); }
const _upd=update; let pt=0;
update=function(dt){ _upd(dt); pt-=dt; if(pt<=0){ pt=.5; try{ portrait(); }catch(e){} } };
// ---------------- carga ----------------
L2.load=async function(){
  try{
    const meta=await (await fetch(B+'meta.json')).json(); L2.meta=meta;
    await Promise.all(Object.keys(meta.sprites).map(async k=>{ L2.img[k]=await loadImg(B+'sprites/'+k+'.png'); }));
    await Promise.all(meta.armas.map(async w=>{ L2.weap[w.k]={im:await loadImg(B+'armas/'+w.k+'.png'),px:w.px,py:w.py}; }));
    await Promise.all(meta.retratos.map(async k=>{ L2.portrait[k]=await loadImg(B+'retratos/retrato_'+k+'.png'); }));
    // espírito do jogador (folha 3x3 no formato humano + retrato do HUD); se faltar, fica o fantasma antigo
    try{ const [gs,gp]=await Promise.all([loadImg(B+'sprites/fantasma_jogador.png'),loadImg(B+'retratos/retrato_fantasma.png')]);
      meta.sprites.fantasma_jogador={categoria:'espirito',cw:72,ch:84,ax:36,ay:80,linhas:['down','up','left'],colunas:['idle','passoA','passoB'],altura:53,largura:24};
      L2.img.fantasma_jogador=gs; L2.portrait.__fantasma=gp; }catch(err){ console.warn('[lote2] fantasma do jogador indisponível',err); }
    try{ const mm=await (await fetch(B+'meta_monstros.json')).json(); L2.metaM=mm; L2.mapM=mm.mapa_monstros||{}; L2.mapA=mm.mapa_animais||{};
      await Promise.all(Object.entries(mm.sprites).map(async ([k,v])=>{ if(L2.meta.sprites[k]) return; L2.meta.sprites[k]=v; L2.img[k]=await loadImg(B+(v.arquivo||'monstros/'+k+'.png')); }));
      console.log('[lote2] monstros:',Object.keys(mm.sprites).length,'folhas,',Object.keys(L2.mapM).length,'ids de monstros,',Object.keys(L2.mapA).length,'animais');
    }catch(err){ L2.mapM=null; L2.mapA=null; console.warn('[lote2] monstros indisponíveis, usando o desenho antigo',err); }
    try{ const cm=await (await fetch(B+'camadas/meta_camadas.json')).json(); CM.meta=cm;
      await Promise.all(Object.keys(cm.corpos).map(async k=>{ const [a,b]=await Promise.all([loadImg(B+'camadas/corpos/'+k+'.png'),loadImg(B+'camadas/corpos/'+k+'_mask.png')]); CM.body[k]={shade:imgData(a),mask:imgData(b)}; }));
      await Promise.all(Object.keys(cm.escudos).map(async k=>{ const im=await loadImg(B+'camadas/escudos/'+k+'.png'); CM.esc[k]=im;
        const c=document.createElement('canvas'); c.width=im.width; c.height=im.height; const g=c.getContext('2d'); g.filter='brightness(.55) sepia(.5)'; g.drawImage(im,0,0); CM.escD[k]=c; }));
      await Promise.all(Object.keys(cm.montarias).map(async k=>{ const [a,b]=await Promise.all([loadImg(B+'camadas/montarias/'+k+'.png'),loadImg(B+'camadas/montarias/'+k+'_mask.png')]); CM.mnt[k]={shade:imgData(a),mask:imgData(b)}; }));
      CM.ready=true; console.log('[lote2] camadas:',Object.keys(CM.body).length,'corpos,',Object.keys(CM.esc).length,'escudos,',Object.keys(CM.mnt).length,'montarias');
    }catch(err){ console.warn('[lote2] camadas indisponíveis, usando arquétipos',err); }
    L2.ready=true; console.log('[lote2] pronto:',Object.keys(L2.img).length,'personagens,',meta.armas.length,'armas,',meta.retratos.length,'retratos');
  }catch(e){ console.error('[lote2] falhou',e,L2.errors); }
};
if(document.readyState==='complete') L2.load(); else window.addEventListener('load',()=>L2.load());
})();

// Lote 3 (cidade): pisos secundários, paredes/janelas/portas pintadas e objetos de cidade, porto e masmorra.
// Módulo de encaixe: só troca a pintura. Paredes finas, corte das paredes da frente (interiores), portas
// abrindo/fechando, ordem de profundidade e colisão continuam sendo os do jogo (iso.js / iso_core.js).
(function(){
if(typeof ISOC==='undefined') return;
const B='assets/lote3/';
const TEX=['plantacao','gelo','assoalho','pier','ponte','tapete','lajota','masmorra','caverna'];
const WALLS=['castelo','torre','enxaimel','tabuas','arenito','reboco','pedra','tijolo','caiado'];
const JAN=['janela_pedra','janela_madeira','seteira','porta_arco','porta_tabuas','porta_arenito'];
const L=window.LOTE3={tex:{},wall:{},jan:{},img:{},gimg:{},meta:{},ready:false,errors:[]};
const loadImg=src=>new Promise((res,rej)=>{ const im=new Image(); im.onload=()=>res(im); im.onerror=()=>{ L.errors.push(src); rej(src); }; im.src=src; });
const pix=im=>{ const c=document.createElement('canvas'); c.width=im.width; c.height=im.height; const g=c.getContext('2d',{willReadFrequently:true}); g.drawImage(im,0,0); return {w:im.width,h:im.height,d:g.getImageData(0,0,im.width,im.height).data}; };
const hsh=ISOC.hsh;
// mesmo tratamento de cor do iso.js (para o que é desenhado direto, sem passar pelo gradeCanvas)
function grade(r,g,b){ const l=r*.3+g*.59+b*.11; r=l+(r-l)*.82; g=l+(g-l)*.82; b=l+(b-l)*.82; return [(r-128)*1.06+133,(g-128)*1.06+129,(b-128)*1.06+122]; }
function gradeCopy(cv){ const c=document.createElement('canvas'); c.width=cv.width; c.height=cv.height; const g=c.getContext('2d'); g.drawImage(cv,0,0); const im=g.getImageData(0,0,c.width,c.height), d=im.data;
  for(let k=0;k<d.length;k+=4){ if(!d[k+3]) continue; const q=grade(d[k],d[k+1],d[k+2]); d[k]=q[0]; d[k+1]=q[1]; d[k+2]=q[2]; } g.putImageData(im,0,0); return c; }
function flipCv(cv){ const c=document.createElement('canvas'); c.width=cv.width; c.height=cv.height; const g=c.getContext('2d'); g.translate(c.width,0); g.scale(-1,1); g.drawImage(cv,0,0); return c; }
function toCv(im){ const c=document.createElement('canvas'); c.width=im.width; c.height=im.height; c.getContext('2d').drawImage(im,0,0); return c; }
// toldo da feira nas 4 cores do jogo (world2.js): troca o vermelho do pano mantendo a luz
function tintAwning(cv,to){ const c=toCv(cv), g=c.getContext('2d'), im=g.getImageData(0,0,c.width,c.height), d=im.data;
  for(let k=0;k<d.length;k+=4){ const r=d[k],gg=d[k+1],b=d[k+2]; if(d[k+3]&&r>80&&r>gg*1.5&&r>b*1.4){ const l=(r*.5+gg*.3+b*.2)/110; d[k]=Math.min(255,to[0]*l); d[k+1]=Math.min(255,to[1]*l); d[k+2]=Math.min(255,to[2]*l); } }
  g.putImageData(im,0,0); return c; }

// ---------------- pisos ----------------
const D=(k,m)=>[k,m||1];
L.floorKey=function(t,biome){
  if(biome==='dg'){ switch(t){
    case TL.DIRT: case TL.ASPH: case TL.RUBBLE: return D('caverna');
    case TL.WALK: case TL.CONC: case TL.KTILE: case TL.LINO: return D('masmorra');
    case TL.ICE: return D('gelo',.78); case TL.WOOD: return D('assoalho',.8); case TL.PIER: return D('pier',.8); case TL.BRIDGE: return D('ponte',.8); case TL.CARPET: return D('tapete',.8); case TL.FIELD: return D('plantacao',.8);
    case TL.SNOW: return D('@neve',.8); case TL.SAND: case TL.DUNE: return D('@areia',.75); case TL.SWAMP: return D('@pantano',.85);
    case TL.GRASS: case TL.PARK: case TL.FOREST: return D('@floresta',.72); case TL.WATER: return D('@agua_rasa',.8); case TL.SEA: return D('@agua_funda',.8);
  } return null; }
  switch(t){
    case TL.FIELD: return D('plantacao'); case TL.ICE: return D('gelo');
    case TL.WOOD: return D('assoalho'); case TL.PIER: return D('pier'); case TL.BRIDGE: return D('ponte');
    case TL.CARPET: return D('tapete'); case TL.KTILE: case TL.LINO: case TL.CONC: return D('lajota');
  } return null; };
function sampleTex(k,U,V){ const d=L.tex[k]; const u=((U/4)%1+1)%1, v=((V/4)%1+1)%1; const o=(((v*256)|0)*256+((u*256)|0))*4; return [d[o],d[o+1],d[o+2]]; }
const prevFloor=ISOC.floorCol;
ISOC.floorCol=function(t,U,V,i,biome){
  if(L.ready){ const r=L.floorKey(t,biome); if(r){ let c=null;
      if(r[0][0]==='@'){ if(window.LOTE1&&LOTE1.ready) c=LOTE1.sample(r[0].slice(1),U,V); }
      else if(r[0]==='ponte'&&i!=null){ // tábuas sempre atravessadas ao sentido da ponte; frestas sem virar "buraco" sobre o abismo
        const alongU=map[i-1]===TL.BRIDGE||map[i+1]===TL.BRIDGE; c=alongU?sampleTex('ponte',V*1.5,U*1.5):sampleTex('ponte',U*1.5,V*1.5);
        const l=c[0]*.3+c[1]*.59+c[2]*.11; if(l<40){ const k=(40-l)/40; c=[c[0]+52*k,c[1]+36*k,c[2]+22*k]; } }
      else c=sampleTex(r[0],U,V);
      if(c){ if(r[1]!==1) c=[c[0]*r[1],c[1]*r[1],c[2]*r[1]]; return c; } } }
  return prevFloor(t,U,V,i,biome); };

// ---------------- paredes, janelas e portas ----------------
const MATW={0:'tijolo',1:'tijolo',2:'caiado',3:'caiado',4:'reboco',5:'pedra',6:'pedra',7:'caiado',8:'tabuas',9:'castelo',10:'torre',11:'enxaimel',12:'tabuas',13:'arenito'};
const MATJ={8:'janela_madeira',11:'janela_madeira',12:'janela_madeira',10:'seteira'};   // o resto: janela de pedra em arco
const MATP={8:'porta_tabuas',11:'porta_tabuas',12:'porta_tabuas',13:'porta_arenito'};  // o resto: porta em arco
const BATTLE=new Set([9,10]);   // muralha e torre ganham ameias no alto
const WT=128, WHT=160;          // textura: 128 px = 2 ladrilhos; 160 px = altura inteira
const isPanel=t=>t===TL.WALL||t===TL.WINDOW;
function texCol(T,x,y){ x=Math.max(0,Math.min(T.w-1,x|0)); y=Math.max(0,Math.min(T.h-1,y|0)); const o=(y*T.w+x)*4; return T.d[o+3]?[T.d[o],T.d[o+1],T.d[o+2]]:null; }
function capOf(T,top){ if(T.cap) return T.cap[top?0:1]; const avg=y0=>{ let r=0,g=0,b=0,n=0; for(let y=y0;y<y0+6;y++) for(let x=0;x<T.w;x++){ const o=(y*T.w+x)*4; r+=T.d[o]; g+=T.d[o+1]; b+=T.d[o+2]; n++; } return [r/n,g/n,b/n]; };
  T.cap=[avg(4).map(v=>v*.62),avg(T.h-10).map(v=>v*.72)]; return T.cap[top?0:1]; }
// ameias só na muralha solta (sem piso de interior encostado), nunca nas paredes de cômodos
function openWall(x,y){ for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){ const xx=x+dx, yy=y+dy; if(xx<0||yy<0||xx>=W||yy>=H) continue; if(ISOC.INTERIOR.has(map[yy*W+xx])) return false; } return true; }
const prevPanel=ISOC.drawPanel;
ISOC.drawPanel=function(im,Wc,Hc,toS,U0,V0,alongU,len,Hh,M,win,low){
  if(!L.ready) return prevPanel.apply(this,arguments);
  let mi=MATS.indexOf(M), door=false;
  if(mi<0){ if(M&&M.pat==='planks'&&M.face==='#6a4628') door=true; else return prevPanel.apply(this,arguments); }
  let T, J=null;
  if(door){ // estilo da porta pelo material das paredes vizinhas
    const x=Math.floor(U0), y=Math.floor(V0), i=y*W+x, nb=alongU?[i-1,i+1]:[i-W,i+W]; let m2=-1; for(const q of nb) if(isPanel(map[q])){ m2=mat[q]; break; }
    T=L.jan[MATP[m2]||'porta_arco']; }
  else { T=L.wall[MATW[mi]]; if(!T) return prevPanel.apply(this,arguments); if(win) J=L.jan[MATJ[mi]||'janela_pedra']; }
  const d=im.data, put=(x,y,c)=>{ x|=0; y|=0; if(x<0||y<0||x>=Wc||y>=Hc) return; const k=(y*Wc+x)*4; d[k]=c[0]; d[k+1]=c[1]; d[k+2]=c[2]; d[k+3]=255; };
  const TK=.14, cols=Math.max(1,Math.round(len*ISOC.TW/2)), face=alongU?.66:.92, WH=ISOC.WH, bat=!door&&!low&&BATTLE.has(mi)&&openWall(Math.floor(U0+1e-6),Math.floor(V0+1e-6));
  const tops=new Array(cols+1);
  for(const layer of [0,1]){ const off=layer?TK/2:-TK/2, f=layer?face:face*.6;
    for(let c=0;c<=cols;c++){ const t=c/cols, U=U0+(alongU?t*len:0)+(alongU?0:off), V=V0+(alongU?0:t*len)+(alongU?off:0);
      const [sx,sy]=toS(U,V), along=(alongU?U0:V0)+t*len, s=((along%1)+1)%1;
      const extra=bat&&((Math.floor(along*4+.001)%2+2)%2===0)?6:0, HH=Hh+extra; tops[c]=HH;
      for(let h=0;h<HH;h++){ let col;
        if(door){ col=texCol(T,t*(T.w-1),(1-h/Hh)*(T.h-1)); if(!col) continue; }
        else { const hv=Math.min(h,WH-1); col=texCol(T,((along*64)%WT+WT)%WT,WHT-1-hv*WHT/WH);
          if(extra&&h>=Hh) col=texCol(T,((along*64)%WT+WT)%WT,WHT-1-(Hh-extra+(h-Hh))*WHT/WH)||col;
          if(J&&layer&&s>.27&&s<.73&&h>Hh*.30&&h<Hh*.84){ const wc=texCol(J,(s-.27)/.46*(J.w-1),(1-(h-Hh*.30)/(Hh*.54))*(J.h-1)); if(wc) col=wc; } }
        const ao=.80+Math.min(1,h/16)*.20, n=.95+hsh(c,h,(along*7)|0)*.08; put(sx,sy-h,[col[0]*f*ao*n,col[1]*f*ao*n,col[2]*f*ao*n]); } } }
  // tampo (pedra do alto ou, na parede cortada, a fiada de baixo)
  if(door) return; const cap=capOf(T,!low);
  for(let c=0;c<=cols;c++){ const t=c/cols; for(let k=-2;k<=2;k++){ const fo=k/2*TK/2, U=U0+(alongU?t*len:fo), V=V0+(alongU?fo:t*len); const [sx,sy]=toS(U,V); const q=.9+hsh(c,k,3)*.2; put(sx,sy-(tops[c]||Hh),[cap[0]*q,cap[1]*q,cap[2]*q]); } }
};

// ---------------- objetos (sprites isométricos) ----------------
const STAT={table:'mesa',workbench:'bancada',chair:'cadeira',throne:'trono',bed:'cama',nightstand:'criado_mudo',chest:'bau',safe:'cofre',crate:'caixote',storage:'caixote',
  counter:'balcao',display:'vitrine',keg:'barril',barrel:'barril',tub:'tina',bookcase:'estante_livros',cabinet:'armario',wardrobe:'guarda_roupa',anvil:'bigorna',
  rack:'suporte_armas',hooks:'ganchos',pillar:'pilar',banner:'estandarte',bench:'banco',pew:'banco_igreja',loom:'tear',altar:'altar',board:'quadro_avisos',
  plant:'vaso_planta',hay:'feno',logs:'lenha',tent:'tenda',sarcofago:'sarcofago',ossos:'ossos',estatua_rei:'estatua_rei',veio_prata:'veio_prata',
  statue:'estatua',awning:'barraca_feira',stairs_down:'escada_desce',jangada:'jangada',barco:'navio'};
const SHELF={books:'estante_livros',potions:'estante_pocoes',med:'estante_pocoes',food:'estante_comida'};
const ANIM={fountain:'chafariz',brazier:'braseiro',candle:'candelabro',campfire:'fogueira',cauldron:'caldeirao',orb:'orbe'};
const AWN=[null,[52,98,150],[66,118,52],[132,66,118]];
function keyFor(o){ if(o.type==='shelf') return SHELF[o.kind||'books']||'estante_livros'; if(o.type==='wrack') return o.kind==='bows'?'suporte_arcos':'suporte_armas';
  if(o.type==='barco') return o.v==='pirata'?'navio_pirata':'navio'; return STAT[o.type]||null; }
const wallAt=(x,y)=>x>=0&&y>=0&&x<W&&y<H&&isPanel(map[y*W+x]);
const sameAt=(x,y,t)=>{ if(x<0||y<0||x>=W||y>=H) return false; const q=objGrid[y*W+x]; return !!q&&q.type===t; };
// espelhar troca os eixos U e V na tela: assim um sprite serve para as duas direções
function flipFor(o,m){ const w=o.w||1, h=o.h||1;
  if(m.axis){ const want=w>h?'U':h>w?'V':(sameAt(o.x,o.y-1,o.type)||sameAt(o.x,o.y+1,o.type))?'V':'U'; return want!==m.axis; }
  if(m.face){ let want;
    if(o.type==='counter'&&(sameAt(o.x,o.y-1,o.type)||sameAt(o.x,o.y+1,o.type))) want='R';
    else if(o.type==='counter'&&(sameAt(o.x-1,o.y,o.type)||sameAt(o.x+1,o.y,o.type))) want='L';
    else if(wallAt(o.x,o.y-1)||wallAt(o.x,o.y+1)) want='L'; else if(wallAt(o.x-1,o.y)||wallAt(o.x+1,o.y)) want='R'; else want=hsh(o.x,o.y,7)<.5?'L':'R';
    return want!==m.face; }
  return hsh(o.x,o.y,11)<.5&&!/estatua|escada|navio|chafariz/.test(m.k); }
function spriteCv(k,flip,graded,o){ let key=k+(flip?'|f':'')+(graded?'|g':''); let v=L.gimg[key]; if(v) return v;
  let cv=L.img[k]; if(k==='barraca_feira'&&o){ const vi=Math.floor((window.th?th(o.x,o.y,5):0)*4)%4; if(AWN[vi]){ key+='|'+vi; v=L.gimg[key]; if(v) return v; cv=tintAwning(cv,AWN[vi]); } }
  if(flip) cv=flipCv(cv); if(graded) cv=gradeCopy(cv); L.gimg[key]=cv; return cv; }
function drawSprite(g,toS,o,k,graded){ const m=L.meta[k]; if(!m||!L.img[k]) return false; const w=o.w||1, h=o.h||1, cv=spriteCv(k,flipFor(o,m),graded,o);
  const [cx,cy]=toS(o.x+w/2,o.y+h/2); g.drawImage(cv,Math.round(cx-cv.width/2),Math.round(cy+m.base-cv.height)); return true; }
L.keyFor=keyFor; L.drawSprite=drawSprite;
let prevProp=null, prevHas=null;
function hookProps(){ prevProp=window.isoProp; prevHas=window.isoHasProp;
  window.isoHasProp=t=>(L.ready&&!!(STAT[t]||t==='shelf'||t==='wrack'))||prevHas(t);
  window.isoProp=function(g,toS,o,biome){ if(L.ready&&o){ const k=keyFor(o); if(k&&drawSprite(g,toS,o,k,!!o.lm)) return true; } return prevProp(g,toS,o,biome); }; }
// ---------------- objetos animados (fogo, água, brilho) ----------------
function flame(g,x,y,s,now,seed){ const f=Math.floor(now/90);
  const gr=g.createRadialGradient(x,y,0,x,y,16*s); gr.addColorStop(0,'rgba(255,180,80,.38)'); gr.addColorStop(1,'rgba(255,140,50,0)'); g.fillStyle=gr; g.fillRect(x-16*s,y-16*s,32*s,32*s);
  const n=Math.max(3,Math.round(5*s)); for(let i=0;i<n;i++){ const r=hsh(i,f,seed), hh=(4+r*7)*s, xx=Math.round(x+(i-(n-1)/2)*1.6*s);
    g.fillStyle=['#c8401c','#f0702a','#ffb04a','#ffe7a0'][i%4]; g.fillRect(xx,Math.round(y-hh),Math.max(1,Math.round(1.6*s)),Math.round(hh)); }
  g.fillStyle='#fff3c8'; g.fillRect(Math.round(x),Math.round(y-2*s),1,Math.max(1,Math.round(2*s))); }
function animOverlay(g,o,k,m,X0,Y0,now){ const seed=(o.x*7+o.y*3)|0;
  if(m.fire) for(const [fx,fy,s] of m.fire) flame(g,X0+fx,Y0+fy,s,now,seed+fx);
  if(k==='caldeirao'){ const f=Math.floor(now/160); for(let i=0;i<4;i++){ const r=hsh(i,f,seed); g.fillStyle=r>.5?'#b8f06a':'#7ad040'; g.fillRect(X0+10+Math.round(hsh(i,f,2)*14),Y0+5+Math.round(r*3),2,2); } }
  if(k==='orbe'){ const a=.25+.15*Math.sin(now/300+seed), cx=X0+m.w/2, cy=Y0+10; const gr=g.createRadialGradient(cx,cy,0,cx,cy,22); gr.addColorStop(0,`rgba(140,200,255,${a})`); gr.addColorStop(1,'rgba(120,180,255,0)'); g.fillStyle=gr; g.fillRect(cx-22,cy-22,44,44); }
  if(k==='chafariz'){ const f=now/1000, cx=X0+m.w/2; g.fillStyle='rgba(220,240,255,.85)';
    for(let i=0;i<14;i++){ const ph=(f*1.2+i/14)%1, a=i*2.39, r=4+ph*20, x=cx+Math.cos(a)*r, y=Y0+14+ph*ph*30-Math.sin(ph*3.14)*10; g.fillRect(Math.round(x),Math.round(y),1,1); }
    for(let i=0;i<10;i++){ const r=hsh(i,Math.floor(now/220),seed); if(r>.6){ g.fillStyle='rgba(235,248,255,.8)'; g.fillRect(Math.round(cx-34+hsh(i,1,seed)*68),Math.round(Y0+52+hsh(i,2,seed)*26),2,1); } } }
}
function hookAnim(){ const _d=drawObj;
  drawObj=function(g,o,sx,sy,now){ const k=L.ready&&o&&!o.lm&&ANIM[o.type];
    if(k&&sx===0&&sy===0&&isoOn()&&L.img[k]){ try{ const m=L.meta[k], tr=g.getTransform(), a=tr.a||2, w=o.w||1, h=o.h||1;
        const cx=tr.e+w*8*a+h*12, cy=tr.f+h*16*a-h*6, cv=spriteCv(k,false,true,o), X0=Math.round(cx-cv.width/2), Y0=Math.round(cy+m.base-cv.height);
        g.save(); g.setTransform(1,0,0,1,0,0); g.imageSmoothingEnabled=false; g.drawImage(cv,X0,Y0); animOverlay(g,o,k,m,X0,Y0,now||performance.now()); g.restore(); return; }catch(e){} }
    return _d(g,o,sx,sy,now); }; }
// ---------------- carga ----------------
L.load=async function(){
  try{
    const meta=await (await fetch(B+'meta.json')).json(); for(const m of meta) L.meta[m.k]=m;
    await Promise.all([
      ...TEX.map(async k=>{ L.tex[k]=pix(await loadImg(B+'texturas/'+k+'.png')).d; }),
      ...WALLS.map(async k=>{ L.wall[k]=pix(await loadImg(B+'paredes/'+k+'.png')); }),
      ...JAN.map(async k=>{ L.jan[k]=pix(await loadImg(B+'janelas/'+k+'.png')); }),
      ...meta.map(async m=>{ L.img[m.k]=toCv(await loadImg(B+'sprites/'+m.k+'.png')); }) ]);
    hookProps(); hookAnim(); L.ready=true;
    console.log('[lote3] pronto:',TEX.length,'pisos,',WALLS.length,'paredes,',JAN.length,'janelas/portas,',meta.length,'objetos');
    if(window.isoFlush) isoFlush();
  }catch(e){ console.error('[lote3] falhou',e,L.errors); }
};
if(document.readyState==='complete') L.load(); else window.addEventListener('load',()=>L.load());
})();

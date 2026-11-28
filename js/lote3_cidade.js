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
const pix=im=>{ const c=document.createElement('canvas'); c.width=im.width; c.height=im.height; const g=c.getContext('2d',{willReadFrequently:true}); g.drawImage(im,0,0); try{ return {w:im.width,h:im.height,d:g.getImageData(0,0,im.width,im.height).data}; }catch(e){ throw e; } };
const hsh=ISOC.hsh;
// mesmo tratamento de cor do iso.js (para o que é desenhado direto, sem passar pelo gradeCanvas)
function grade(r,g,b){ const l=r*.3+g*.59+b*.11; r=l+(r-l)*.82; g=l+(g-l)*.82; b=l+(b-l)*.82; return [(r-128)*1.06+133,(g-128)*1.06+129,(b-128)*1.06+122]; }
function gradeCopy(cv){ const c=document.createElement('canvas'); c.width=cv.width; c.height=cv.height; const g=c.getContext('2d'); g.drawImage(cv,0,0); try{ const im=g.getImageData(0,0,c.width,c.height), d=im.data;
  for(let k=0;k<d.length;k+=4){ if(!d[k+3]) continue; const q=grade(d[k],d[k+1],d[k+2]); d[k]=q[0]; d[k+1]=q[1]; d[k+2]=q[2]; } g.putImageData(im,0,0); }catch(e){} return c; }
function flipCv(cv){ const c=document.createElement('canvas'); c.width=cv.width; c.height=cv.height; const g=c.getContext('2d'); g.translate(c.width,0); g.scale(-1,1); g.drawImage(cv,0,0); return c; }
function toCv(im){ const c=document.createElement('canvas'); c.width=im.width; c.height=im.height; c.getContext('2d').drawImage(im,0,0); return c; }
// toldo da feira nas 4 cores do jogo (world2.js): troca o vermelho do pano mantendo a luz
function tintAwning(cv,to){ const c=toCv(cv), g=c.getContext('2d'); try{ const im=g.getImageData(0,0,c.width,c.height), d=im.data;
  for(let k=0;k<d.length;k+=4){ const r=d[k],gg=d[k+1],b=d[k+2]; if(d[k+3]&&r>80&&r>gg*1.5&&r>b*1.4){ const l=(r*.5+gg*.3+b*.2)/110; d[k]=Math.min(255,to[0]*l); d[k+1]=Math.min(255,to[1]*l); d[k+2]=Math.min(255,to[2]*l); } }
  g.putImageData(im,0,0); }catch(e){} return c; }

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
const inB=(x,y)=>x>=0&&y>=0&&x<W&&y<H;
const wallAt=(x,y)=>inB(x,y)&&(isPanel(map[y*W+x])||doors.has(y*W+x));
const sameAt=(x,y,t)=>{ if(!inB(x,y)) return false; const q=objGrid[y*W+x]; return !!q&&q.type===t; };
// ---- direção dos móveis ----
// S = virado para +y (frente do desenho, para baixo-esquerda na tela), E = +x (frente espelhada),
// N = -y (desenho de costas), W = -x (costas espelhadas). Espelhar troca os eixos U e V na tela.
const ISO_BOX={counter:'balcao',workbench:'bancada',bookcase:'estante_livros',cabinet:'armario',wardrobe:'guarda_roupa',display:'vitrine',nightstand:'criado_mudo'};
const ISO_PLANE={rack:'suporte_armas',hooks:'ganchos'};
const BACK={banco_igreja:'banco_igreja_costas',altar:'altar_costas',cama:'cama_pes',bau:'bau_costas',cadeira:'cadeira_costas'};
const WALLED=new Set(['shelf','bookcase','cabinet','wardrobe','display','nightstand','workbench','rack','wrack','hooks','banner','chest','safe','loom','board','anvil','tub','keg','barrel','crate','storage','awning','hay','logs','plant','statue']);
const DIRS={S:[0,1],N:[0,-1],E:[1,0],W:[-1,0]};
const EXPL={S:'S',N:'N',E:'E',W:'W',down:'S',up:'N',right:'E',left:'W',s:'S',n:'N',e:'E',w:'W'};
function bldOf(o){ if(o.b==null||typeof buildings==='undefined') return null; const b=buildings[o.b]; return b&&b.id===o.b?b:buildings.find(q=>q&&q.id===o.b)||null; }
function ctr(o){ return [o.x+(o.w||1)/2,o.y+(o.h||1)/2]; }
// parede encostada em cada lado do objeto (toda a aresta conta)
function wallSides(o){ const w=o.w||1, h=o.h||1, r={N:0,S:0,W:0,E:0};
  for(let k=0;k<w;k++){ if(wallAt(o.x+k,o.y-1)) r.N++; if(wallAt(o.x+k,o.y+h)) r.S++; }
  for(let k=0;k<h;k++){ if(wallAt(o.x-1,o.y+k)) r.W++; if(wallAt(o.x+w,o.y+k)) r.E++; } return r; }
const AWAY={N:'S',S:'N',W:'E',E:'W'};
// de costas para a parede; no canto, prefere a parede que acompanha a fileira de móveis iguais
function awayFromWall(o,axisPref){ const ws=wallSides(o); let order=['N','W','S','E'];
  if(axisPref==='U') order=['N','S','W','E']; else if(axisPref==='V') order=['W','E','N','S'];
  for(const s of order) if(ws[s]) return AWAY[s];
  const w=o.w||1, h=o.h||1;   // parede a 1-2 ladrilhos (móvel afastado um passo da parede)
  for(let d=2;d<=3;d++) for(const s of order){ let hit=false;
    if(s==='N'||s==='S'){ const yy=s==='N'?o.y-d:o.y+h-1+d; for(let k=0;k<w&&!hit;k++) hit=wallAt(o.x+k,yy); }
    else { const xx=s==='W'?o.x-d:o.x+w-1+d; for(let k=0;k<h&&!hit;k++) hit=wallAt(xx,o.y+k); }
    if(hit) return AWAY[s]; }
  return null; }
function rowAxis(o){ const t=o.type; if(sameAt(o.x-1,o.y,t)||sameAt(o.x+(o.w||1),o.y,t)) return 'U'; if(sameAt(o.x,o.y-1,t)||sameAt(o.x,o.y+(o.h||1),t)) return 'V'; return null; }
function toward(o,tx,ty,axis){ const [cx,cy]=ctr(o), dx=tx-cx, dy=ty-cy;
  if(axis==='U'||(!axis&&Math.abs(dy)>=Math.abs(dx))) return dy<0?'N':'S'; return dx<0?'W':'E'; }
function doorOf(o){ const b=bldOf(o); if(!b||!b.doors||!b.doors.length) return null; const [cx,cy]=ctr(o); let best=null,bd=1e9; for(const d of b.doors){ const q=Math.hypot(d[0]+.5-cx,d[1]+.5-cy); if(q<bd){ bd=q; best=d; } } return best; }
function nearestOf(o,types,R){ const [cx,cy]=ctr(o), b=o.b; let best=null,bd=1e9;
  for(let y=Math.floor(cy-R);y<=cy+R;y++) for(let x=Math.floor(cx-R);x<=cx+R;x++){ if(!inB(x,y)) continue; const q=objGrid[y*W+x]; if(!q||q===o||!types.includes(q.type)) continue; if(b!=null&&q.b!==b) continue;
    const [qx,qy]=ctr(q), d=Math.hypot(qx-cx,qy-cy); if(d<bd){ bd=d; best=q; } } return best; }
function axisOf(o){ const w=o.w||1, h=o.h||1; return w>h?'U':h>w?'V':null; }
function facingOf(o){
  if(o._l3f!==undefined) return o._l3f; let f=null;
  const ex=o.dir!=null?o.dir:o.facing!=null?o.facing:o.orient; if(ex!=null) f=EXPL[ex]||null;
  if(!f&&typeof o.rot==='number') f=['S','W','N','E'][((o.rot%4)+4)%4];
  if(!f){ const t=o.type, ax=axisOf(o);
    if(t==='pew'){ const a=nearestOf(o,['altar'],24); if(a){ const [ax2,ay2]=ctr(a); f=toward(o,ax2,ay2,ax||'U'); } else { const d=doorOf(o); f=d?AWAY[toward(o,d[0]+.5,d[1]+.5,ax||'U')]:(ax==='V'?'E':'S'); } }
    else if(t==='altar'){ const p=nearestOf(o,['pew'],24); if(p){ const [px,py]=ctr(p); f=toward(o,px,py,ax||'U'); } else { const w=awayFromWall(o,ax); if(w) f=w; else { const d=doorOf(o); f=d?toward(o,d[0]+.5,d[1]+.5,ax||'U'):'S'; } } }
    else if(t==='throne'){ const d=doorOf(o); f=d?toward(o,d[0]+.5,d[1]+.5):(awayFromWall(o)||'S'); }
    else if(t==='chair'){ const tb=nearestOf(o,['table','desk','workbench','counter'],1.6); if(tb){ const [tx,ty]=ctr(tb); f=toward(o,tx,ty); }
      else if(o.v===0) f='E'; else if(o.v===1) f='W'; else if(o.v===2) f='N'; else f=awayFromWall(o)||'S'; }
    else if(t==='bed'||t==='hbed'){ // cabeceira na parede da ponta mais perto (a cama nunca troca de eixo)
      const w=o.w||1, h=o.h||1, along=ax==='U'; let f0=null;
      for(let d=1;d<=4&&!f0;d++){ let a=false,b=false;
        if(!along){ for(let k=0;k<w;k++){ a=a||wallAt(o.x+k,o.y-d); b=b||wallAt(o.x+k,o.y+h-1+d); } if(a) f0='S'; else if(b) f0='N'; }
        else { for(let k=0;k<h;k++){ a=a||wallAt(o.x-d,o.y+k); b=b||wallAt(o.x+w-1+d,o.y+k); } if(a) f0='E'; else if(b) f0='W'; } }
      f=f0||(along?'E':'S'); }
    else if(t==='bench'||t==='barco'||t==='sofa') f=ax==='V'?'E':'S';
    else if(t==='counter'){ const ra=rowAxis(o)||ax, d=doorOf(o); if(d) f=toward(o,d[0]+.5,d[1]+.5,ra||null); else f=awayFromWall(o,ra)||'S'; }
    else if(WALLED.has(t)){ f=awayFromWall(o,rowAxis(o)); if(!f){ const d=doorOf(o); f=d?toward(o,d[0]+.5,d[1]+.5):null; } }
  }
  o._l3f=f; return f; }
// parede atrás do móvel é uma parede da frente que o jogo desenha cortada (interior atrás, rua na frente)?
function cutBehind(o,f){ const w=o.w||1, h=o.h||1, IN=ISOC.INTERIOR; if(!IN) return false;
  if(f==='N'){ for(let k=0;k<w;k++){ const x=o.x+k, y=o.y+h; if(wallAt(x,y)&&inB(x,y+1)&&!IN.has(map[(y+1)*W+x])) return true; } }
  else if(f==='W'){ for(let k=0;k<h;k++){ const x=o.x+w, y=o.y+k; if(wallAt(x,y)&&inB(x+1,y)&&!IN.has(map[y*W+x+1])) return true; } }
  return false; }
// escolhe o desenho (frente/costas) e o espelho para a direção pedida
function pickVar(k,o,m){ let f=facingOf(o);
  // objetos compridos (banco, genuflexório, altar, cama, navio) nunca trocam de eixo: só frente/costas no eixo do ladrilho
  if(f&&m.axis){ const w=o.w||1, h=o.h||1, fa=w>h?'U':h>w?'V':m.axis, ok=fa===m.axis?['S','N']:['E','W']; if(!ok.includes(f)) f=ok[0]; }
  if(f){ const native=m.face==='R'?'E':'S'; const back=f==='N'||f==='W';
    let kk=k; if(back&&L.img[BACK[k]]) kk=BACK[k];
    else if(back&&L.img[k+'_cc']&&cutBehind(o,f)) kk=k+'_cc';   // encostado na parede da frente (cortada): corta junto
    else if(back&&L.img[k+'_c']) kk=k+'_c';
    const mirror=(f==='E'||f==='W')!==(native==='E'); return [kk,mirror]; }
  // sem direção definida (objetos soltos sem parede, estátuas, navios...): regra antiga
  const w=o.w||1, h=o.h||1;
  if(m.axis){ const want=w>h?'U':h>w?'V':(sameAt(o.x,o.y-1,o.type)||sameAt(o.x,o.y+1,o.type))?'V':'U'; return [k,want!==m.axis]; }
  if(m.face) return [k,(hsh(o.x,o.y,7)<.5?'L':'R')!==m.face];
  return [k,hsh(o.x,o.y,11)<.5&&!/estatua|escada|navio|chafariz|orbe|pilar/.test(m.k)]; }
// móveis de caixa e de parede usam a versão isométrica de 1 ladrilho (frente/costas)
function isoKey(o,k){ if(ISO_BOX[o.type]&&L.img[ISO_BOX[o.type]+'_iso']) return ISO_BOX[o.type]+'_iso';
  if(o.type==='shelf'&&L.img[k+'_iso']) return k+'_iso';
  if((o.type==='wrack'||ISO_PLANE[o.type])&&L.img[k+'_iso']){ return k+'_iso'; }
  if(o.type==='banner'&&o.b!=null&&L.img['estandarte_iso']){ const ws=wallSides(o); if(ws.N||ws.S||ws.W||ws.E) return 'estandarte_iso'; }
  return null; }
function spriteCv(k,flip,graded,o){ let key=k+(flip?'|f':'')+(graded?'|g':''); let v=L.gimg[key]; if(v) return v;
  let cv=L.img[k]; if(k==='barraca_feira'&&o){ const vi=Math.floor((window.th?th(o.x,o.y,5):0)*4)%4; if(AWN[vi]){ key+='|'+vi; v=L.gimg[key]; if(v) return v; cv=tintAwning(cv,AWN[vi]); } }
  if(flip) cv=flipCv(cv); if(graded) cv=gradeCopy(cv); L.gimg[key]=cv; return cv; }
function drawSprite(g,toS,o,k,graded){ if(!L.meta[k]||!L.img[k]) return false; k=isoKey(o,k)||k; const m0=L.meta[k];
  const [kk,flip]=pickVar(k,o,m0), m=L.meta[kk]||m0, w=o.w||1, h=o.h||1, cv=spriteCv(kk,flip,graded,o);
  const [cx,cy]=toS(o.x+w/2,o.y+h/2); g.drawImage(cv,Math.round(cx-cv.width/2),Math.round(cy+m.base-cv.height)); return true; }
L.facingOf=facingOf; L.pickVar=pickVar; L.isoKey=isoKey;
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
// os objetos animados (vela, braseiro, caldeirão, chafariz...) são desenhados depois da camada assada dos móveis;
// sem isto um candelabro atrás de uma cama aparece "em cima" do colchão. Redesenha por cima só os móveis que
// estão NA FRENTE dele (mais fundo na ordem isométrica) e encostam no desenho, devolvendo a ordem certa.
function reOcclude(g,o,cx,cy,X0,Y0,ww,hh){ const ow=o.w||1, oh=o.h||1, ox=o.x+ow/2, oy=o.y+oh/2;
  const toS=(U,V)=>[cx+((U-ox)-(V-oy))*ISOC.TW/2, cy+((U-ox)+(V-oy))*ISOC.TH/2], seen=new Set();
  for(let y=o.y-1;y<=o.y+oh+3;y++) for(let x=o.x-1;x<=o.x+ow+3;x++){ if(!inB(x,y)) continue; const q=objGrid[y*W+x]; if(!q||q===o||seen.has(q)||q.lm) continue; seen.add(q);
    const qw=q.w||1, qh=q.h||1;   // na frente = inteiro mais em +x ou +y, e nunca inteiro atrás (-x/-y)
    if(ANIM[q.type]||!(q.x>=o.x+ow||q.y>=o.y+oh)||q.x+qw<=o.x||q.y+qh<=o.y) continue; const k=keyFor(q); if(!k||!L.img[k]) continue;
    const m=L.meta[isoKey(q,k)||k]; if(!m) continue; const [qx,qy]=toS(q.x+(q.w||1)/2,q.y+(q.h||1)/2);
    if(qx+m.w/2<X0||qx-m.w/2>X0+ww||qy+m.base<Y0||qy+m.base-m.h>Y0+hh) continue;
    try{ drawSprite(g,toS,q,k,true); }catch(e){} } }
function hookAnim(){ const _d=drawObj;
  drawObj=function(g,o,sx,sy,now){ const k=L.ready&&o&&!o.lm&&ANIM[o.type];
    if(k&&sx===0&&sy===0&&isoOn()&&L.img[k]){ try{ const m=L.meta[k], tr=g.getTransform(), a=tr.a||2, w=o.w||1, h=o.h||1;
        const cx=tr.e+w*8*a+h*12, cy=tr.f+h*16*a-h*6, cv=spriteCv(k,false,true,o), X0=Math.round(cx-cv.width/2), Y0=Math.round(cy+m.base-cv.height);
        g.save(); g.setTransform(1,0,0,1,0,0); g.imageSmoothingEnabled=false; g.drawImage(cv,X0,Y0); animOverlay(g,o,k,m,X0,Y0,now||performance.now()); reOcclude(g,o,cx,cy,X0,Y0,cv.width,cv.height); g.restore(); return; }catch(e){} }
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

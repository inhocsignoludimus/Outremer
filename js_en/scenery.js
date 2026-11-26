'use strict';
// =====================================================================
// OUTREMER — paisagem mais viva
// Depois de montar o mundo: bosques e clareiras com arbustos, pedras, troncos caídos e
// frutas por bioma; nas cidades, barris, caixas, vasos e feno junto às casas, braseiros
// ao longo das ruas e uma praça com chafariz, bancos e canteiros.
// No chão da isométrica (pintado uma vez por pedaço): tufos de capim, flores, seixos,
// cogumelos, juncos e folhas secas — sem custo nenhum por quadro.
// =====================================================================
(function(){
const NAT=new Set([TL.GRASS,TL.FOREST,TL.FIELD,TL.SNOW,TL.DUNE,TL.SWAMP,TL.SAND,TL.RUBBLE]);
const STONE=new Set([TL.WALK,TL.CONC,TL.ASPH]);
// ruído suave para agrupar árvores em bosques (em vez de espalhar uma aqui, outra ali)
const vn=(x,y,k)=>{ const X=Math.floor(x), Y=Math.floor(y), fx=x-X, fy=y-Y, s=t=>t*t*(3-2*t), a=th(X,Y,k), b=th(X+1,Y,k), c=th(X,Y+1,k), d=th(X+1,Y+1,k), u=s(fx), v=s(fy);
  return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v; };
const grove=(x,y)=>vn(x/11,y/11,77)*.65+vn(x/4,y/4,78)*.35;
// por bioma: [tipo, chance por ladrilho]; 'G' = árvore de bosque (só onde o ruído forma mancha)
const BIO={
  p:[['brush',.022],['berry',.004],['rock',.004],['log',.002],['G',.16,'tree']],
  f:[['brush',.014],['rock',.004],['log',.003],['berry',.003],['G',.10,'tree']],
  c:[['brush',.018],['rock',.006],['palm',.002],['G',.12,'tree']],
  n:[['rock',.012],['brush',.005],['deadtree',.003],['G',.12,'pine']],
  m:[['rock',.006],['brush',.012],['berry',.002],['G',.10,'pine']],
  r:[['rock',.008],['brush',.010],['deadtree',.002],['G',.08,'pine']],
  o:[['cactus',.007],['rock',.010],['deadtree',.003],['brush',.004]],
  s:[['brush',.020],['deadtree',.008],['log',.004],['G',.08,'tree']],
};
const SANDL=[['palm',.008],['rock',.004],['brush',.006]];
const freeT=(x,y)=>{ if(!inB(x,y)) return false; const i=idx(x,y); return walk[i]&&!objGrid[i]&&!doors.has(i)&&!(reserved&&reserved[i])&&bld[i]<0; };
const nearWater=(x,y,r)=>{ for(let dy=-r;dy<=r;dy++) for(let dx=-r;dx<=r;dx++){ if(!inB(x+dx,y+dy)) continue; const t=map[idx(x+dx,y+dy)]; if(t===TL.WATER||t===TL.SEA) return true; } return false; };
const clearAround=(x,y,r)=>{ for(let dy=-r;dy<=r;dy++) for(let dx=-r;dx<=r;dx++){ if(!inB(x+dx,y+dy)) return false; const i=idx(x+dx,y+dy), t=map[i]; if(doors.has(i)||t===TL.BRIDGE||t===TL.PIER||t===TL.DIRT||bld[i]>=0) return false; } return true; };
function put(type,x,y){ const v=Math.floor(th(x,y,903)*3);
  if(type==='brush') return addObj({type,x,y,solid:false,v,sortY:y*T+4});
  if(type==='berry') return addObj({type,x,y,solid:true,container:'berries',v:0});
  if(type==='log'){ if(!freeT(x+1,y)) return; return addObj({type,x,y,w:2,solid:true,container:'deadwood'}); }
  if(type==='palm'&&!nearWater(x,y,4)) return;
  return addObj({type,x,y,solid:true,v}); }
function dressWild(){
  for(let y=3;y<H-3;y++) for(let x=3;x<W-3;x++){ const i=idx(x,y); if(regionId[i]!==255||!NAT.has(map[i])||!freeT(x,y)) continue;
    const c=cellAt(x,y), L=map[i]===TL.SAND?SANDL:(BIO[c&&c.b]||BIO.p), r=th(x,y,901); let acc=0;
    for(const e of L){ if(e[0]==='G'){ if(grove(x,y)>.62 && th(x,y,902)<e[1] && clearAround(x,y,1)) put(e[2],x,y); continue; }
      acc+=e[1]; if(r<acc){ if(e[0]==='brush'||clearAround(x,y,1)) put(e[0],x,y); break; } } }
}
// ---------- cidades ----------
function dressTowns(){
  for(const R of regions){ if(R.kind!=='city'&&R.kind!=='town') continue;
    const lamps=[], inR=(x,y)=>x>=R.x&&y>=R.y&&x<R.x+R.w&&y<R.y+R.h;
    const doorNear=(x,y)=>{ for(let dy=-2;dy<=2;dy++) for(let dx=-2;dx<=2;dx++) if(inB(x+dx,y+dy)&&doors.has(idx(x+dx,y+dy))) return true; return false; };
    for(let y=R.y+1;y<R.y+R.h-1;y++) for(let x=R.x+1;x<R.x+R.w-1;x++){ const i=idx(x,y); if(!freeT(x,y)) continue; const t=map[i];
      // encostado numa casa (por fora): barris, caixas, vasos, feno, lenha
      let wall=false; for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const j=idx(x+dx,y+dy); if(bld[j]>=0&&(map[j]===TL.WALL||map[j]===TL.WINDOW)) wall=true; }
      if(wall){ if(!doorNear(x,y)&&th(x,y,911)<.11){ const k=th(x,y,912), tp=t===TL.GRASS?(k<.3?'plant':k<.5?'hay':k<.75?'keg':'logs'):(k<.35?'keg':k<.65?'crate':k<.85?'plant':'logs');
          addObj(tp==='crate'?{type:'crate',x,y,solid:true,container:'crate'}:{type:tp,x,y,solid:true,v:Math.floor(th(x,y,913)*3)}); } continue; }
      // braseiros na beira das ruas de pedra
      if(!STONE.has(t)){ let road=0; for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) if(STONE.has(map[idx(x+dx,y+dy)])) road++;
        if(road===1&&!doorNear(x,y)&&th(x,y,914)<.06&&!lamps.some(([a,b])=>Math.abs(a-x)+Math.abs(b-y)<9)){ addObj({type:'brazier',x,y,solid:true}); lamps.push([x,y]); } } }
    // praça: o maior largo de pedra perto do centro ganha chafariz, bancos e canteiros
    const cx=R.x+R.w/2, cy=R.y+R.h/2; let best=null, bd=1e9;
    for(let y=R.y+4;y<R.y+R.h-5;y++) for(let x=R.x+4;x<R.x+R.w-5;x++){ const d=Math.hypot(x-cx,y-cy); if(d>=bd) continue;
      let ok=true; for(let dy=-3;dy<=4&&ok;dy++) for(let dx=-3;dx<=4;dx++){ const xx=x+dx, yy=y+dy; if(!freeT(xx,yy)||!STONE.has(map[idx(xx,yy)])){ ok=false; break; } }
      if(ok){ best=[x,y]; bd=d; } }
    if(best){ const [x,y]=best; addObj({type:'fountain',x,y,w:2,h:2,solid:true});
      if(freeT(x-3,y)&&freeT(x-2,y)) addObj({type:'bench',x:x-3,y,w:2,solid:true});
      if(freeT(x+3,y+1)&&freeT(x+4,y+1)) addObj({type:'bench',x:x+3,y:y+1,w:2,solid:true});
      for(const [a,b] of [[-3,-3],[4,-3],[-3,4],[4,4]]) if(freeT(x+a,y+b)) addObj({type:'plant',x:x+a,y:y+b,solid:true,v:Math.floor(th(x+a,y+b,915)*3)});
      for(const [a,b] of [[-1,-1],[2,-1]]) if(freeT(x+a,y+b)) addObj({type:'brazier',x:x+a,y:y+b,solid:true}); }
  }
}
const _bw=buildWorld;
buildWorld=function(){ const r=_bw.apply(this,arguments); try{ dressTowns(); dressWild(); }catch(e){ console.warn('scenery',e); } return r; };

// ---------- miudezas pintadas no chão da isométrica ----------
const FLOW=['#e8e0c8','#e8c040','#c83a3a','#9a6ad0','#5a8ae0','#f0a0b0'];
window.sceneryFloor=function(g,toS,U0,V0,CK,FR){
  const P=(a,b,w,h,c)=>{ g.fillStyle=c; g.fillRect(Math.round(a/FR),Math.round(b/FR),Math.max(1,Math.round(w/FR)),Math.max(1,Math.round(h/FR))); };
  for(let y=V0;y<V0+CK;y++) for(let x=U0;x<U0+CK;x++){ if(!inB(x,y)) continue; const i=idx(x,y), t=map[i]; if(bld[i]>=0&&!(t===TL.GRASS||t===TL.DIRT)) continue;
    const town=regionId[i]!==255, c=cellAt(x,y), b=c&&c.b;
    for(let n=0;n<3;n++){ const r=th(x,y,930+n), [sx,sy]=toS(x+.18+th(x,y,940+n)*.64, y+.18+th(x,y,950+n)*.64);
      if(t===TL.GRASS||t===TL.FIELD||t===TL.FOREST){
        if(r<(town?.12:.05)){ const k=FLOW[Math.floor(th(x,y,960+n)*FLOW.length)]; for(let m=0;m<4;m++){ const ox=(th(x,y,970+m+n*7)-.5)*9, oy=(th(x,y,980+m+n*7)-.5)*4; P(sx+ox,sy+oy-1,1,2,'#2e4a20'); P(sx+ox-1,sy+oy-2,2,2,k); } }
        else if(r<.38){ const d=t===TL.FOREST?'#24361a':'#34501f', l=t===TL.FOREST?'#3e5a26':'#5c7a30'; P(sx,sy-3,1,4,d); P(sx+2,sy-4,1,5,l); P(sx+4,sy-2,1,3,d); }
        else if(t===TL.FOREST&&r<.43){ if(th(x,y,990+n)<.5){ P(sx,sy-2,1,2,'#d8d0b8'); P(sx-1,sy-3,3,1,th(x,y,991)<.5?'#a83020':'#a88050'); } else { P(sx,sy,3,1,'#6a4a20'); P(sx+1,sy-1,2,1,'#8a6028'); } }
        else if(r<.45){ P(sx,sy,2,1,'#7a7468'); P(sx,sy-1,1,1,'#9a9488'); } }
      else if(t===TL.SWAMP){ if(r<.22){ P(sx,sy-6,1,7,'#4a5a2a'); P(sx+2,sy-5,1,6,'#5a6a32'); P(sx+1,sy-7,1,2,'#6a4a28'); } else if(r<.27) P(sx,sy,3,1,'#2a3a1e'); }
      else if(t===TL.SNOW){ if(r<.06){ P(sx,sy,3,1,'#8a8e94'); P(sx+1,sy-1,2,1,'#a8acb2'); } else if(r<.10){ P(sx,sy-3,1,3,'#6a6050'); P(sx+2,sy-2,1,2,'#7a7060'); } }
      else if(t===TL.SAND||t===TL.DUNE){ if(r<.05){ P(sx,sy,2,1,'#9a8058'); P(sx+1,sy-1,1,1,'#b89a68'); } else if(r<.075){ P(sx,sy-2,1,2,'#8a7040'); P(sx-1,sy-3,3,1,'#9a7a44'); } else if(b==='o'&&r<.078){ P(sx,sy,4,1,'#e8e0c8'); P(sx+1,sy-1,2,1,'#d8d0b8'); } }
      else if(t===TL.DIRT||t===TL.RUBBLE){ if(r<.07){ P(sx,sy,2,1,'#6a5a48'); P(sx+3,sy+1,1,1,'#7a6a58'); } } } }
};
})();

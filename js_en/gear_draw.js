'use strict';
// =====================================================================
// OUTREMER — desenho em pixel de todas as peças no boneco (pernas, pés, braços, mãos,
// capa, escudo, pescoço) e os ícones de todos os itens portados do 3D.
// Carrega depois de items.js e chars.js.
// =====================================================================
// novos tipos de cabeça e de torso
const _dHelm = drawHelmet;
drawHelmet = function(g,x,y,id,f){
  const W_=id&&WEAR[id]; if(!W_) return; const k=W_.kind, c=W_.col, d=darkHex(c,.7), P=(a,b,w,h,col)=>{g.fillStyle=col;g.fillRect(x+a,y+b,w,h);};
  if(k==='turban'){ P(-4,-24,8,4,c); P(-3,-25,6,1,c); P(-4,-22,8,1,d); if(f==='down') P(-1,-24,2,2,'#c83a2a'); return; }
  if(k==='cap'){ P(-4,-23,8,3,c); P(-3,-24,6,1,c); P(-4,-21,8,1,d); return; }
  if(k==='bandana'){ P(-3,-22,6,2,c); P(-3,-21,6,1,d); if(f!=='down') P(f==='left'?2:-4,-21,2,3,c); return; }
  return _dHelm(g,x,y,id,f);
};
const _dVest = drawVest;
drawVest = function(g,x,y,id,f,side){
  const W_=id&&WEAR[id]; if(!W_) return; const k=W_.kind, c=W_.col, d=darkHex(c,.72), P=(a,b,w,h,col)=>{g.fillStyle=col;g.fillRect(x+a,y+b,w,h);};
  const x0=side?-3:-5, w=side?7:10;
  if(k==='shirt'){ P(x0,-14,w,8,c); P(x0,-7,w,1,d); if(!side&&f==='down') P(-1,-14,2,2,d); return; }
  if(k==='apron'){ if(f==='up') return; P(side?-1:-3,-13,side?4:6,11,c); P(side?-1:-3,-13,side?4:6,1,d); return; }
  return _dVest(g,x,y,id,f,side);
};
const IRONISH = m => ['iron','blackiron','bronze','silver','gold'].includes(m);
function drawCloak(g,x,y,W_,f,front){
  const c=W_.col, d=darkHex(c,.7), P=(a,b,w,h,col)=>{g.fillStyle=col;g.fillRect(x+a,y+b,w,h);};
  const short = W_.kind==='mantle';
  if(f==='up'){ if(!front) return; P(-6,-15,12,short?6:14,c); P(-6,-15,12,1,darkHex(c,1.2)); if(!short){ P(-3,-12,1,10,d); P(2,-12,1,10,d); P(-6,-2,12,1,d); }
    if(W_.kind==='crosscape'){ P(-1,-13,2,7,'#a01a14'); P(-3,-11,6,2,'#a01a14'); } return; }
  if(front){ P(-4,-15,8,1,c); if(f==='down') P(-1,-15,2,2,GOLD); return; }
  if(f==='down'){ P(-6,-14,12,short?6:13,d); P(-6,-14,1,short?6:13,c); P(5,-14,1,short?6:13,c); }
  else { const m=f==='left'?1:-1; P(m>0?0:-6,-14,6,short?6:13,d); P(m>0?5:-6,-14,1,short?6:13,c); }
}
function drawShield(g,x,y,W_,f,side){
  const k=W_.kind||'round', c=W_.col, d=darkHex(c,.68), hi=darkHex(c,1.25), rim=IRONISH(W_.mat)?darkHex(c,.6):'#8a8e96';
  const P=(a,b,w,h,col)=>{g.fillStyle=col;g.fillRect(x+a,y+b,w,h);};
  let cx = f==='left'||f==='right' ? (f==='right'?2:-3) : side*7, cy=-12;
  if(f==='up'){ P(cx-2,cy-3,5,8,d); P(cx-2,cy-3,5,1,rim); return; }
  const rows = { buckler:[3,5,5,5,3], round:[3,5,7,7,7,5,3], heater:[6,6,6,6,6,4,2], kite:[5,6,6,6,6,5,4,3,2,1], tower:[7,7,7,7,7,7,7,7,7,7], cross:[6,6,6,6,6,4,2] }[k] || [5,5,5,5,5];
  const top = cy - Math.floor(rows.length/2);
  rows.forEach((w,i)=>{ const x0=cx-Math.floor(w/2); P(x0,top+i,w,1, i===0||i===rows.length-1 ? rim : c); P(x0,top+i,1,1,rim); P(x0+w-1,top+i,1,1,rim); });
  P(cx-Math.floor(rows[1]/2)+1,top+1,1,Math.max(1,rows.length-3),hi);
  if(k==='cross'){ P(cx,top+1,1,rows.length-2,'#a01a14'); P(cx-2,top+2,5,1,'#a01a14'); }
  else if(k==='heater'||k==='kite'||k==='tower'){ P(cx,top+2,1,rows.length-4,d); P(cx-1,top+3,3,1,d); }
  else P(cx,cy,1,1,GOLD);
}
// o boneco com tudo que veste; gi = peças com raridade/cor (do jogador ou de um NPC equipado)
const _dh2 = drawHuman;
drawHuman = function(g,x,y,h){
  const gi = h.gi || (player && h.look===player.look && player.gi) || null;
  if(!gi || h.flash){ return _dh2(g,x,y,h); }
  const K = sl => gi[sl] ? drawKey(gi[sl]) : null, Wk = sl => { const k=K(sl); return k && WEAR[k]; };
  const L = Object.assign({}, h.look), legs=Wk('legs'), feet=Wk('feet'), arms=Wk('arms'), body=Wk('body');
  if(legs) L.pants = legs.col; if(feet) L.boot = feet.col;
  if(arms) L.jacketD = arms.col; else if(body && IRONISH(body.mat)) L.jacketD = darkHex(body.col,.85);
  const R = RACES[L.race]||RACES.humano, gg = (R.sx===1&&R.sy===1) ? g : pixelScale(g,x,y,R.sx,R.sy);
  const f=h.face, c=Math.cos(h.wAng||0), wside = c>0.15?1 : c<-0.15?-1 : (Math.sin(h.wAng||0)<0?1:-1), sside=-wside, cloak=Wk('cloak'), shield=Wk('shield');
  if(cloak) drawCloak(gg,x,y,cloak,f,false);
  if(shield && f==='up') drawShield(gg,x,y,shield,f,sside);
  _dh2(g,x,y,{...h, look:L, head:K('head')||h.head, body:K('body')||h.body});
  const gg2 = (R.sx===1&&R.sy===1) ? g : pixelScale(g,x,y,R.sx,R.sy), P=(a,b,w,hh,col)=>{ gg2.fillStyle=col; gg2.fillRect(x+a,y+b,w,hh); };
  if(legs && IRONISH(legs.mat) && f!=='up'){ const hi=darkHex(legs.col,1.3); if(f==='down'){ P(-4,-4,3,1,hi); P(1,-4,3,1,hi); } else P(-2,-4,4,1,hi); }
  if(feet){ const d=darkHex(feet.col,.75); if(f==='down'||f==='up'){ P(-4,-2,3,2,feet.col); P(1,-2,3,2,feet.col); P(-4,-1,3,1,d); P(1,-1,3,1,d); } else { P(-2,-2,4,2,feet.col); P(-2,-1,4,1,d); } }
  const hands=Wk('hands'); if(hands){ const ax=L.sex==='f'?4:5; if(f==='down'||f==='up'){ P(-ax-2,-8,2,2,hands.col); P(ax,-8,2,2,hands.col); } else P(-1,-8,2,2,hands.col); }
  if(arms && IRONISH(arms.mat) && f!=='up'){ const hi=darkHex(arms.col,1.35), ax=L.sex==='f'?4:5; if(f==='down'){ P(-ax-2,-13,2,1,hi); P(ax,-13,2,1,hi); } }
  const neck=Wk('neck'); if(neck && f==='down'){ if(neck.kind==='gorget') P(-3,-14,6,2,neck.col); else if(neck.kind==='scarf') P(-3,-14,6,2,neck.col); else if(neck.kind==='cross'){ P(0,-13,1,3,neck.col); P(-1,-12,3,1,neck.col); } else P(0,-12,1,1,neck.col); }
  if(cloak) drawCloak(gg2,x,y,cloak,f,true);
  if(shield && f!=='up') drawShield(gg2,x,y,shield,f,sside);
};

// ---------------- ícones de tudo ----------------
(function(){
  const mkI=(f)=>{ const c=document.createElement('canvas'); c.width=16; c.height=16; const g=c.getContext('2d'); const p=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(x,y,w,h)}; f(p,g); return c.toDataURL(); };
  const iconWear = (id)=>{ const W_=WEAR[id], c=W_.col, d=darkHex(c,.7), hi=darkHex(c,1.25);
    switch(W_.slot){
      case 'head': return mkI((p,g)=>{ drawHelmet(g,8,30,id,'down'); });
      case 'body': return mkI((p,g)=>{ drawVest(g,8,20,id,'down',false); p(1,6,2,6,darkHex(c,.85)); p(13,6,2,6,darkHex(c,.85)); });
      case 'legs': return mkI(p=>{ p(4,2,8,3,c); p(4,5,3,9,c); p(9,5,3,9,c); p(4,2,8,1,hi); p(7,5,2,1,d); if(IRONISH(W_.mat)){ p(4,8,3,1,hi); p(9,8,3,1,hi); } });
      case 'feet': return mkI(p=>{ p(5,3,4,9,c); p(5,10,8,3,c); p(5,13,8,1,d); p(5,3,4,1,hi); });
      case 'hands': return mkI(p=>{ p(4,6,7,7,c); p(4,3,2,4,c); p(6,2,2,5,c); p(8,2,2,5,c); p(10,4,2,4,c); p(2,8,2,3,c); p(4,12,7,2,d); });
      case 'arms': return mkI(p=>{ p(2,3,4,10,c); p(10,3,4,10,c); p(2,3,4,1,hi); p(10,3,4,1,hi); p(2,12,4,1,d); p(10,12,4,1,d); });
      case 'cloak': return mkI(p=>{ p(5,2,6,2,c); p(4,4,8,4,c); p(3,8,10,6,c); p(5,5,1,9,d); p(10,5,1,9,d); p(7,2,2,2,GOLD); if(W_.kind==='crosscape'){ p(7,6,2,6,'#a01a14'); p(5,8,6,2,'#a01a14'); } });
      case 'shield': return mkI((p,g)=>{ g.save(); g.translate(8,9); g.scale(1.6,1.6); g.translate(-8,-9); drawShield(g,8,21,W_,'down',0); g.restore(); });
      case 'neck': return mkI(p=>{ for(let i=0;i<6;i++){ p(4+i,3+i,1,1,c); p(11-i,3+i,1,1,c); } if(W_.kind==='cross'){ p(7,9,2,6,c); p(5,11,6,2,c); } else if(W_.kind==='gorget'||W_.kind==='scarf'){ p(3,6,10,4,c); p(3,6,10,1,hi); } else { p(6,9,4,4,'#3a8ad8'); p(7,10,2,2,'#a8d8ff'); } });
      case 'ring': return mkI(p=>{ p(5,6,6,1,c); p(5,11,6,1,c); p(4,7,1,4,c); p(11,7,1,4,c); const gem={ruby_ring:'#d02a2a',sapphire_ring:'#2a5ad0',amber_ring:'#e09a20',signet_ring:'#d8b040'}[id]; if(gem) p(7,4,2,2,gem); });
    } };
  for(const id of Object.keys(WEAR)) if(ITEMS[id] && (!ICONS[id] || !['head','body'].includes(WEAR[id].slot) || !ICONS[id])) { if(!ICONS[id] || ['legs','feet','hands','arms','cloak','shield','neck','ring'].includes(WEAR[id].slot)) ICONS[id]=iconWear(id); }
  const POT = { heal:'#d02a2a', mana:'#2a5ad0', refresh:'#e0c020', cure:'#e08a20', poison:'#3ab02a', strength:'#e8e8e8', agility:'#60c0e0', night:'#7a3ab0' };
  const ORE = { iron:'#a85a3a', copper:'#c87a3a', silver:'#d8dce4', gold:'#e8c040', blackiron:'#3a3a48' };
  for(const it of BASE3D){ const id=it.id; if(ICONS[id] || !ITEMS[id]) continue; const m=MATCOL[it.material]||'#8a7a5a';
    let ic;
    if(/potion/.test(id)){ const k=Object.keys(POT).find(k=>id.includes(k))||'heal'; const big=id.startsWith('greater'); ic=mkI(p=>{ p(7,2,2,3,'#c8c0b0'); p(6,1,4,1,'#8a6a3a'); p(5,5,6,big?9:8,'#a8c8d8'); p(6,big?7:8,4,big?6:5,POT[k]); p(6,6,1,2,'#fff'); }); }
    else if(/_ore$/.test(id)){ const k=id.replace('_ore',''); ic=mkI(p=>{ p(3,5,10,8,'#5a5652'); p(4,4,8,1,'#7a7670'); p(5,7,2,2,ORE[k]||'#a85a3a'); p(9,9,2,2,ORE[k]||'#a85a3a'); p(8,6,1,1,ORE[k]||'#a85a3a'); }); }
    else if(/_ingot$/.test(id)){ const col={iron:'#9aa0a8',copper:'#c87a3a',bronze:'#b8883a',silver:'#dce0e8',gold:'#e8c040',blackiron:'#44444e'}[id.replace('_ingot','')]||'#9aa0a8';
      ic=mkI(p=>{ p(2,8,12,4,col); p(3,6,10,2,darkHex(col,1.2)); p(2,11,12,1,darkHex(col,.7)); }); }
    else if(/logs$/.test(id)){ const col=id.startsWith('cedar')?'#8a4a2a':id.startsWith('oak')?'#6a4a2a':'#7a5634'; ic=mkI(p=>{ for(let i=0;i<3;i++){ p(2,4+i*4,12,3,col); p(2,4+i*4,2,3,'#c8a070'); } }); }
    else if(/boards$/.test(id)){ ic=mkI(p=>{ for(let i=0;i<3;i++){ p(2,4+i*3,12,2,'#b8884a'); p(2,5+i*3,12,1,'#8a6234'); } }); }
    else if(/bolt$/.test(id)){ const col={linen_bolt:'#e0d4b8',silk_bolt:'#a03a7a',wool_bolt:'#8a7a6a'}[id]||'#c8b890'; ic=mkI(p=>{ p(3,4,10,8,col); p(3,4,2,8,darkHex(col,.7)); p(11,4,2,8,darkHex(col,.8)); }); }
    else if(/hide|leather|fur_bundle/.test(id)){ const col=id.includes('wyrm')?'#3a5a3a':id.includes('fur')?'#8a6a4a':'#8a5a34'; ic=mkI(p=>{ p(3,3,10,10,col); p(2,5,1,6,col); p(13,5,1,6,col); p(5,5,6,6,darkHex(col,1.15)); }); }
    else if(it.type==='consumable' && it.material==='food'){ const col={bread:'#c8963a',flatbread:'#d8b060',cheese:'#e8c840',dates:'#6a3a1a',figs:'#5a3a5a',roasted_meat:'#8a3a1a',dried_meat:'#7a3a24',cooked_fish:'#b8885a',ale:'#c88a2a',wine:'#6a1a2a',water_flask:'#5a8aba'}[id]||m;
      ic=/ale|wine|water/.test(id) ? mkI(p=>{ p(5,4,6,10,'#7a5a3a'); p(6,5,4,3,col); p(4,6,1,5,'#7a5a3a'); }) : mkI(p=>{ p(3,6,10,6,col); p(4,5,8,1,darkHex(col,1.2)); p(3,11,10,1,darkHex(col,.7)); }); }
    else if(id==='gold_coin'){ ic=mkI(p=>{ p(4,8,6,4,'#e8c040'); p(7,5,6,4,'#d8b040'); p(5,9,2,1,'#fff0a0'); }); }
    else if(it.type==='deed'){ ic=mkI(p=>{ p(3,3,10,10,'#e0d4b0'); p(3,3,10,1,'#a89870'); p(3,12,10,1,'#a89870'); p(5,6,6,1,'#6a5a40'); p(5,8,5,1,'#6a5a40'); p(10,10,2,2,'#c83a2a'); }); }
    else if(it.type==='furniture'){ ic=mkI(p=>{ p(3,4,10,9,'#8a6234'); p(3,4,10,2,'#a8784a'); p(3,12,10,1,'#5a3a1e'); p(4,6,1,6,'#6a4628'); p(11,6,1,6,'#6a4628'); }); }
    else if(/arrow|feather|shaft/.test(id)){ ic=mkI(p=>{ for(let i=0;i<10;i++) p(3+i,12-i,1,1,'#8a6a3a'); p(12,2,2,2,'#c8ccd4'); p(2,12,2,2,'#e8e0d0'); }); }
    else if(id==='nails'){ ic=mkI(p=>{ for(let i=0;i<4;i++){ p(3+i*3,4,2,1,'#9aa0a8'); p(3+i*3+1-1,5,1,8,'#7a7e88'); } }); }
    else if(id==='stone'){ ic=mkI(p=>{ p(3,6,10,7,'#7a7670'); p(4,5,8,1,'#9a9690'); p(3,12,10,1,'#5a5652'); }); }
    else if(id==='candle'){ ic=mkI(p=>{ p(6,6,4,8,'#e8e0c0'); p(7,3,2,3,'#ffb040'); }); }
    else ic=mkI(p=>{ p(4,4,8,8,m); p(4,4,8,1,darkHex(m,1.2)); p(4,11,8,1,darkHex(m,.7)); });
    ICONS[id]=ic; }
  for(const id of Object.keys(WSHAPE)) if(ITEMS[id] && !ICONS[id]){ const cv=document.createElement('canvas'); cv.width=20; cv.height=20; const g=cv.getContext('2d'); g.translate(10,10); g.scale(.8,.8); g.translate(-10,-10); drawWeaponAt(g,5,15,id,-Math.PI/4); ICONS[id]=cv.toDataURL(); }
  for(const id of Object.keys(ITEMS)) if(!ICONS[id]) ICONS[id]=mkI(p=>{ p(4,4,8,8,'#7a6a5a'); p(4,4,8,1,'#9a8a7a'); });
})();

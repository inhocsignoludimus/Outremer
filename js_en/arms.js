'use strict';
// =====================================================================
// OUTREMER — armas em pixel no estilo das referências: cada tipo tem forma própria
// (lâmina, guarda, cabo, cabeça), desenhada no eixo da arma e girada pixel a pixel.
// Mais armas: cimitarra, falcione, rapieira, alabarda, mangual, maça-estrela, foice,
// machado duplo, bestas e cajados mágicos.
// =====================================================================
const A_S='#c8ccd4', A_H='#eef0f4', A_D='#7a7e88', WOOD='#6a4628', WOODD='#4a3018', GOLD='#d8b040', LEATH='#3a2414', IRON='#5a5e66';
// cada parte: [a (ao longo da arma, mão em 0), b (de lado, centro 0), comprimento, largura, cor]
function bladeParts(L, w, guard, extra){ const p=[[-3,0,1,1,GOLD],[-2,0,2,1,LEATH],[0,-2,1,5,guard||GOLD],[1,0,L,1,A_S],[1,w>1?1:0,L-1,1,w>1?A_D:A_S],[L+1,0,1,1,A_H]];
  if(w>1) p.push([1,-1,L-1,1,A_H]); return extra?p.concat(extra):p; }
const WSHAPE = {
  dagger:    bladeParts(4,1,'#8a7a5a'),
  shortsword:bladeParts(7,1),
  longsword: bladeParts(10,1),
  broadsword:[[-4,0,1,1,GOLD],[-3,0,3,1,LEATH],[0,-3,1,7,GOLD],[1,-1,12,1,A_H],[1,0,12,1,A_S],[1,1,12,1,A_D],[13,0,1,1,A_H]],
  scimitar:  [[-2,0,2,1,LEATH],[0,-2,1,4,GOLD],[1,0,4,1,A_S],[5,1,3,1,A_S],[8,2,2,1,A_S],[10,3,1,1,A_H],[2,-1,3,1,A_H],[5,0,3,1,A_D]],
  falchion:  [[-2,0,2,1,LEATH],[0,-2,1,5,'#8a6a3a'],[1,0,8,1,A_S],[4,-1,5,1,A_S],[6,-2,3,1,A_H],[9,-1,1,2,A_S],[1,1,8,1,A_D]],
  rapier:    [[-3,0,1,1,GOLD],[-2,0,2,1,LEATH],[0,-2,1,5,GOLD],[-1,-2,1,1,GOLD],[-1,2,1,1,GOLD],[1,0,12,1,A_H]],
  club:      [[-1,0,6,1,WOOD],[5,0,4,2,WOOD],[6,-1,3,1,WOODD],[8,1,1,1,WOODD]],
  mace:      [[-2,0,9,1,WOOD],[-2,0,1,1,IRON],[7,-1,3,3,IRON],[8,-2,1,5,'#8a8e96'],[10,0,1,1,'#8a8e96']],
  morningstar:[[-2,0,9,1,WOOD],[7,-1,3,3,IRON],[6,0,1,1,A_H],[10,0,1,1,A_H],[8,-2,1,1,A_H],[8,2,1,1,A_H],[7,-2,1,1,A_D],[9,2,1,1,A_D]],
  flail:     [[-2,0,6,1,WOOD],[4,0,1,1,IRON],[5,1,1,1,A_D],[6,1,1,1,IRON],[7,2,1,1,A_D],[8,1,3,3,IRON],[9,0,1,1,A_H],[11,2,1,1,A_H],[9,4,1,1,A_H]],
  warhammer: [[-2,0,12,1,WOOD],[9,-3,3,7,IRON],[9,-3,3,1,'#8a8e96'],[12,0,1,1,A_D]],
  hand_axe:  [[-2,0,10,1,WOOD],[6,-1,3,1,IRON],[5,-3,5,2,'#9aa0a8'],[5,-4,5,1,A_H]],
  battleaxe: [[-2,0,13,1,WOOD],[8,-1,3,3,IRON],[6,-4,7,3,'#9aa0a8'],[6,-5,7,1,A_H],[7,2,5,2,'#9aa0a8'],[7,4,5,1,A_H]],
  double_axe:[[-3,0,14,1,WOODD],[8,-5,7,4,'#a0a6ae'],[8,2,7,4,'#a0a6ae'],[8,-6,7,1,A_H],[8,6,7,1,A_H],[14,0,1,1,A_D]],
  spear:     [[-3,0,14,1,WOOD],[11,0,1,1,IRON],[12,-1,2,3,A_S],[14,0,2,1,A_H]],
  pike:      [[-4,0,18,1,WOODD],[14,-1,1,3,IRON],[15,0,3,1,A_H]],
  halberd:   [[-4,0,17,1,WOOD],[13,-4,4,3,'#a0a6ae'],[13,-4,1,3,A_H],[14,1,2,2,IRON],[16,2,1,1,IRON],[13,0,1,1,IRON],[17,0,3,1,A_H]],
  scythe:    [[-3,0,15,1,WOOD],[11,0,1,1,IRON],[12,-1,1,1,A_S],[11,-2,1,1,A_S],[10,-3,1,1,A_S],[9,-4,1,1,A_S],[8,-5,1,1,A_H],[12,-2,1,1,A_D],[11,-3,1,1,A_D]],
  staff:     [[-3,0,15,1,WOOD],[11,0,1,1,WOODD],[12,-1,2,3,WOOD],[13,0,1,1,WOODD]],
  fire_staff:[[-3,0,14,1,'#4a2a1a'],[10,-2,1,5,GOLD],[11,-2,1,1,GOLD],[11,2,1,1,GOLD],[12,-1,2,3,'#e8401a'],[12,0,1,1,'#ffd070']],
  ice_staff: [[-3,0,14,1,'#5a5a6a'],[10,-1,1,3,'#c8d8f0'],[11,-1,3,3,'#5ab8f0'],[14,0,1,1,'#e8f8ff'],[12,0,1,1,'#e8f8ff']],
  holy_staff:[[-3,0,14,1,'#e8e0c8'],[10,0,1,1,GOLD],[11,-2,1,5,GOLD],[11,0,4,1,GOLD],[12,0,1,1,'#fff4c0']],
  wand:      [[-1,0,6,1,'#3a2a4a'],[5,-1,2,3,'#a040e0'],[6,0,1,1,'#f0c0ff']],
  bow:       'bow6', longbow:'bow8', crossbow:'xbow', heavy_crossbow:'xbowH',
};
const GLOW = { fire_staff:'#ff7030', ice_staff:'#60c8ff', holy_staff:'#ffe080', wand:'#c070ff' };
function drawWeaponAt(g, hx, hy, id, ang){
  const sh = WSHAPE[id]; if(!sh) return false;
  const c=Math.cos(ang), s=Math.sin(ang);
  const dot=(a,b,col)=>{ g.fillStyle=col; g.fillRect(Math.round(hx+c*a-s*b), Math.round(hy+s*a+c*b), 1, 1); };
  const part=(a0,b0,L,w,col)=>{ for(let a=a0;a<a0+L-.01;a+=.5) for(let b=b0;b<b0+w-.01;b+=.5) dot(a,b,col); };
  if(typeof sh==='string'){
    if(sh.startsWith('bow')){ const R=sh==='bow8'?8:6;
      for(let b=-R;b<=R;b+=.5){ const a=3-(b*b)/(R*2.2); dot(a,b,(Math.abs(b)>R-2)?WOODD:WOOD); }
      for(let b=-R+1;b<=R-1;b+=.5) dot(3-(R*R)/(R*2.2)+.5,b,'#d8d0b8'); part(-1,0,2,1,LEATH); }
    else { const big=sh==='xbowH'; part(-3,0,big?12:10,1,WOOD); part(-3,-1,3,1,WOODD); const ax=big?7:6, R=big?6:5;
      for(let b=-R;b<=R;b+=.5) dot(ax-Math.abs(b)*.3,b,big?IRON:WOODD); for(let b=-R+1;b<=R-1;b+=.5) dot(ax-R*.3+.5,b,'#d8d0b8'); part(ax-1,0,4,1,'#b8b0a0'); }
    return true; }
  for(const [a,b,L,w,col] of sh) part(a,b,L,w,col);
  if(GLOW[id]){ const t=(performance.now()/200)|0, end=sh[sh.length-1]; g.globalAlpha=.35+.2*Math.sin(t); dot(end[0]+1,end[1],GLOW[id]); dot(end[0],end[1]-1,GLOW[id]); dot(end[0],end[1]+1,GLOW[id]); g.globalAlpha=1; }
  return true;
}
const _drawWeapon = drawWeapon;
drawWeapon = function(g,x,y,id,ang){
  if(!WSHAPE[id]) return _drawWeapon(g,x,y,id,ang);
  const c=Math.cos(ang), side = c>0.15 ? 1 : c<-0.15 ? -1 : (Math.sin(ang)<0 ? 1 : -1);
  drawWeaponAt(g, x+side*6, y-8+Math.round(Math.sin(ang)*2), id, ang);
};

// ---------------- armas novas ----------------
Object.assign(OW, {
  scimitar:  { name:'Scimitar',        dmg:20, range:23, arc:1.6, cd:.46, st:7,  knock:5, len:10, col:A_S, skill:'espadas' },
  falchion:  { name:'Falchion',         dmg:24, range:23, arc:1.5, cd:.55, st:8,  knock:6, len:9,  col:A_S, skill:'espadas' },
  rapier:    { name:'Rapier',         dmg:17, range:27, arc:.7,  cd:.34, st:5,  knock:3, len:12, col:A_H, skill:'esgrima' },
  pike:      { name:'Pike',            dmg:26, range:38, arc:.5,  cd:.7,  st:9,  knock:7, len:17, col:WOOD, skill:'esgrima' },
  halberd:   { name:'Halberd',         dmg:33, range:34, arc:1.0, cd:.8,  st:11, knock:9, len:17, col:WOOD, skill:'machados' },
  double_axe:{ name:'Double Axe',    dmg:34, range:26, arc:1.7, cd:.85, st:12, knock:10,len:14, col:WOOD, skill:'machados' },
  flail:     { name:'Flail',          dmg:25, range:24, arc:1.5, cd:.6,  st:9,  knock:8, len:11, col:IRON, skill:'macas' },
  morningstar:{name:'Morning Star',     dmg:26, range:23, arc:1.3, cd:.6,  st:9,  knock:8, len:10, col:IRON, skill:'macas' },
  scythe:    { name:'War Scythe',  dmg:30, range:30, arc:1.8, cd:.8,  st:11, knock:7, len:15, col:WOOD, skill:'machados' },
  fire_staff:{ name:'Staff of Fire',   dmg:14, range:26, arc:1.3, cd:.5,  st:6,  knock:7, len:14, col:'#4a2a1a', skill:'macas', spell:'fogo' },
  ice_staff: { name:'Staff of Ice',   dmg:14, range:26, arc:1.3, cd:.5,  st:6,  knock:7, len:14, col:'#5a5a6a', skill:'macas', spell:'gelo' },
  holy_staff:{ name:'Staff of the Seal',   dmg:15, range:26, arc:1.3, cd:.5,  st:6,  knock:7, len:14, col:'#e8e0c8', skill:'macas', spell:'luz' },
  wand:      { name:'Wand',          dmg:8,  range:18, arc:1.0, cd:.4,  st:4,  knock:2, len:6,  col:'#3a2a4a', skill:'briga', spell:'arcano' },
  crossbow:  { name:'Crossbow',            dmg:34, range:260, cd:1.4, spread:.03, noise:4, ranged:true, ammo:'bolts', len:9, col:WOOD, skill:'arcos' },
  heavy_crossbow:{ name:'Arbalest', dmg:48, range:300, cd:1.9, spread:.02, noise:5, ranged:true, ammo:'bolts', len:11, col:WOOD, skill:'arcos' },
});
Object.assign(WEAPONS, OW);
const NEWW = ['scimitar','falchion','rapier','pike','halberd','double_axe','flail','morningstar','scythe','fire_staff','ice_staff','holy_staff','wand','crossbow','heavy_crossbow'];
for(const id of NEWW) ITEMS[id] = { name:OW[id].name, stack:1, weapon:true };
ITEMS.bolts = { name:'Bolts', stack:99 };
Object.assign(PRICE, { scimitar:150, falchion:190, rapier:170, pike:150, halberd:320, double_axe:360, flail:230, morningstar:210, scythe:260,
  fire_staff:300, ice_staff:300, holy_staff:340, wand:120, crossbow:260, heavy_crossbow:420, bolts:2 });
// ícones: a própria arma, inclinada como na mochila do UO
(function(){
  for(const id of Object.keys(WSHAPE)){ if(!ITEMS[id]) continue;
    const cv=document.createElement('canvas'); cv.width=20; cv.height=20; const g=cv.getContext('2d');
    const long = ['pike','halberd','scythe','spear','staff','fire_staff','ice_staff','holy_staff','double_axe','broadsword','heavy_crossbow'].includes(id);
    if(long){ g.translate(10,10); g.scale(.8,.8); g.translate(-10,-10); }
    const ang = (typeof WSHAPE[id]==='string' && WSHAPE[id].startsWith('bow')) ? -Math.PI/4 : -Math.PI/4;
    drawWeaponAt(g, 5, 15, id, ang); ICONS[id]=cv.toDataURL(); }
  const cv=document.createElement('canvas'); cv.width=16; cv.height=16; const g=cv.getContext('2d');
  for(let i=0;i<3;i++){ g.fillStyle=WOOD; g.fillRect(3+i*3,5,1,8); g.fillStyle=IRON; g.fillRect(3+i*3,3,1,2); g.fillStyle='#d8d0b8'; g.fillRect(2+i*3,12,3,1); }
  ICONS.bolts=cv.toDataURL();
})();
VSTOCK.ferreiro.push('scimitar','falchion','rapier','flail','morningstar','double_axe','halberd','pike');
VSTOCK.arqueiro.push('crossbow','bolts','bolts'); VSTOCK.bowyer.push('crossbow','heavy_crossbow','bolts','bolts');
VSTOCK.mago.push('wand','fire_staff','ice_staff'); VSTOCK.carpenter.push('scythe');
LOOT.armory.table.push(['halberd',1],['pike',1],['crossbow',1],['bolts',3],['flail',1]);
MONS.orc.loot.push(['double_axe',1],['morningstar',1],['scythe',1]); MONS.skeleton.loot.push(['scimitar',1],['falchion',1],['holy_staff',.3]);
MONS.bandit.loot.push(['rapier',1],['crossbow',1],['bolts',2]);
for(const k of ['bandit','orc','skeleton']) LOOT['mon_'+k]=LT(2, MONS[k].loot, .6);

// =====================================================================
// PRIMEIRA PESSOA — sprites do Lote 1 (camadas): arma/escudo + manga do corpo (tingida) + braçal + mão (pele
// tingida + anel) ou luva. Folhas em assets/fp/<família ou item>/<camada>.png, quadros de 256×256 numa linha.
// Pivôs: uma mão e cajado = canto inferior direito; escudo = inferior esquerdo; duas mãos = centro de baixo.
// =====================================================================
(function(){
if(typeof fpOn!=='function') return;
const BASE='assets/fp/', Q=256;
const FAM={uma_mao:7,escudo:4,cajado:3,lanca:4,arco:3,besta:4};
const ITEM={espada_longa:['uma_mao',['arma']],maca:['uma_mao',['arma']],machado_de_batalha:['uma_mao',['arma']],adaga:['uma_mao',['arma']],
  escudo_heater:['escudo',['escudo']],escudo_cruzado:['escudo',['escudo']],cajado_do_selo:['cajado',['arma','brilho']],lanca:['lanca',['arma']],arco_longo:['arco',['arma']],besta:['besta',['arma']]};
// ---------- carregamento preguiçoso ----------
const IM={};
function img(path){ let o=IM[path]; if(!o){ o=IM[path]={im:new Image(),ok:false,bad:false}; o.im.onload=()=>{ o.ok=true; }; o.im.onerror=()=>{ o.bad=true; }; o.im.src=BASE+path+'.png'; } return o; }
// ---------- equipamento -> camadas ----------
const ARMS={plate_arms:'placas',leather_sleeves:'couro',chain_sleeves:'malha',studded_sleeves:'cravejadas',lamellar_sleeves:'lamelares',bedouin_sleeves:'beduinas'};
const GLOVES={leather_gloves:'couro',chain_gloves:'malha',plate_gloves:'manoplas',studded_gloves:'cravejadas',iron_gauntlets:'manoplas_ferro',linen_gloves:'linho'};
const RINGS={copper_ring:'cobre',silver_ring:'prata',gold_ring:'ouro',bronze_ring:'bronze',signet_ring:'sinete',amber_ring:'ambar',sapphire_ring:'safira',ruby_ring:'rubi'};
const BODYARM={plate:'placas',chain:'malha',scale:'lamelares',studded:'cravejadas',brig:'cravejadas',leather:'couro'};
function gear(){ const e=player.equip||{}, W=id=>id&&WEAR[id], col=sl=>{ const s=player.gi&&player.gi[sl], k=s&&typeof drawKey==='function'?drawKey(s):e[sl]; return (k&&WEAR[k]&&WEAR[k].col)||null; };
  const body=W(e.body); let arm=ARMS[e.arms]||null;
  if(!arm&&body){ arm=BODYARM[body.kind]||((body.kind==='tabard'&&body.mat==='iron')?'malha':null); }
  const L=player.look||{};
  return {arm, glove:GLOVES[e.hands]||null, ring:RINGS[e.ring]||null, skin:L.skin||'#e0b48e', sleeve:col('body')||L.jacket||'#6a5a4a',
    shield:e.shield?(e.shield==='crusader_shield'?'escudo_cruzado':'escudo_heater'):null}; }
function itemFor(id){ const W=WEAPONS[id]||{};
  if(!WEAPONS[id]||id==='fists') return null;
  if(/crossbow|arbalest/.test(id)) return 'besta'; if(/bow$/.test(id)||id==='shortbow'||id==='composite_bow') return 'arco_longo';
  if(W.spell||/staff|scepter|crook|wand/.test(id)) return 'cajado_do_selo';
  if(/spear|pike|lance|javelin|halberd|glaive|bardiche|war_fork|scythe/.test(id)) return 'lanca';
  if(/dagger|knife|kris|cleaver/.test(id)) return 'adaga';
  if(W.skill==='machados'||/axe|hatchet|pickaxe/.test(id)) return 'machado_de_batalha';
  if(W.skill==='macas'||/mace|club|hammer|maul|flail|morning|tongs|shovel/.test(id)) return 'maca';
  return 'espada_longa'; }
// ---------- composição de um quadro ----------
const tmp=document.createElement('canvas'); tmp.width=tmp.height=Q; const tg=tmp.getContext('2d');
function blit(g,o,f){ if(!o||!o.ok) return; g.drawImage(o.im,f*Q,0,Q,Q,0,0,Q,Q); }
function tinted(g,o,f,col){ if(!o||!o.ok) return; tg.globalCompositeOperation='source-over'; tg.clearRect(0,0,Q,Q); tg.drawImage(o.im,f*Q,0,Q,Q,0,0,Q,Q);
  tg.globalCompositeOperation='multiply'; tg.fillStyle=col; tg.fillRect(0,0,Q,Q); tg.globalCompositeOperation='destination-in'; tg.drawImage(o.im,f*Q,0,Q,Q,0,0,Q,Q); tg.globalCompositeOperation='source-over'; g.drawImage(tmp,0,0); }
const cache=new Map();
function compose(item,fam,f,G,noWeapon){ const key=[item,fam,f,G.arm,G.glove,G.ring,G.skin,G.sleeve,noWeapon?1:0].join('|'); let c=cache.get(key); if(c&&c.done) return c.cv;
  const layers=[]; const it=item&&ITEM[item];
  if(it&&!noWeapon) for(const l of it[1]) if(l!=='brilho') layers.push(['b',img(item+'/'+l)]);
  layers.push(['t',img('maos/'+fam+'/manga_corpo'),G.sleeve]);
  if(G.arm) layers.push(['b',img('maos/'+fam+'/braco_'+G.arm)]);
  if(G.glove) layers.push(['b',img('maos/'+fam+'/luva_'+G.glove)]); else { layers.push(['t',img('maos/'+fam+'/mao_pele'),G.skin]); if(G.ring) layers.push(['b',img('maos/'+fam+'/anel_'+G.ring)]); }
  const ready=layers.every(L=>L[1].ok||L[1].bad);
  if(!c){ c={cv:document.createElement('canvas'),done:false}; c.cv.width=c.cv.height=Q; cache.set(key,c); if(cache.size>220) cache.delete(cache.keys().next().value); }
  const g=c.cv.getContext('2d'); g.clearRect(0,0,Q,Q); g.imageSmoothingEnabled=false;
  for(const L of layers){ if(L[0]==='t') tinted(g,L[1],f,L[2]); else blit(g,L[1],f); }
  c.done=ready; return c.cv; }
// ---------- animação ----------
const ANIM={uma_mao:{q:[0,1,2,3,4,5,0],ms:[0,110,60,60,140,110,0]}, lanca:{q:[0,1,2,0],ms:[0,150,80,160]}, cajado:{q:[0,1,2,2,1,0],ms:[0,120,120,300,120,120]},
  arco:{q:[0,1,1,2,0],ms:[0,120,120,140,260]}, besta:{q:[1,2,3,0],ms:[0,90,600,200]}, escudo:{q:[0,1,2,2,3,0],ms:[0,70,70,300,90,90]}};
const SPEED={adaga:.65,maca:1.2,machado_de_batalha:1.25};
function play(name,now,scale){ const A=ANIM[name], ms=A.ms.map(v=>v*(scale||1)); let t=0; const T=[]; for(const m of ms){ t+=m; T.push(t); } return {A,T,t0:now,dur:t}; }
function frameOf(P,now){ if(!P) return null; const e=now-P.t0; if(e>=P.dur) return null; let i=0; while(i<P.T.length-1&&e>=P.T[i+1]) i++; return P.A.q[i]; }
let atk=null, sh=null, cast=null, lastCd=0, lastCast=0, lastHp=null, lastW=null, swapT=0;
// ---------- desenho ----------
window.fpHandsDraw=function(ctx,lw,lh,now,light){ if(!player||player.ghost) return false;
  const tool=gathering?(gathering.kind==='tree'?'hatchet':'pickaxe'):null, id=tool||player.weapon, item=itemFor(id), fam=item?ITEM[item][0]:'uma_mao', G=gear();
  if(id!==lastW){ lastW=id; swapT=now; atk=null; }
  const cd=player.atkCd||0; if(cd>lastCd+.05) atk=play(fam,now,SPEED[item]||1); lastCd=cd;
  const cc=player.castCd||0; if(cc>lastCast+.05){ cast={t0:now,dur:640}; if(fam==='cajado') atk=play('cajado',now,1); } lastCast=cc; if(cast&&now-cast.t0>cast.dur) cast=null;
  if(lastHp!=null&&player.hp<lastHp-.5&&G.shield&&!sh) sh=play('escudo',now,1); lastHp=player.hp;
  if(gathering&&!atk) atk=play(fam,now-(now%700),.9);
  const cw=canvas.width, ch=canvas.height, k=Math.max(1,Math.round(ch*.74/Q*2)/2), S=Q*k;
  const walk=player.moving?Math.sin(player.phase||now/130):0, swap=Math.min(1,(now-swapT)/260);
  const bx=Math.round(walk*6*k/2), by=Math.round((Math.abs(walk)*6+Math.sin(now/900)*2)*k/2+(1-swap)*S*.5);
  const Lb=Math.max(.3,Math.min(1.05,light.b));
  ctx.save(); ctx.imageSmoothingEnabled=false; if(Lb<.98) ctx.filter=`brightness(${Lb.toFixed(2)})${light.warm>.3?' sepia(.25)':''}`;
  // escudo (mão esquerda) — só com armas de uma mão ou de mãos vazias
  if(G.shield&&(fam==='uma_mao')){ const f=frameOf(sh,now); const cv=compose(G.shield,'escudo',f==null?0:f,G,false); ctx.drawImage(cv,0,0,Q,Q,-bx,ch-S+by,S,S); }
  const f=frameOf(atk,now), fi=f==null?0:f, cv=compose(item,fam,fi,G,!item);
  if(fam==='uma_mao'||fam==='cajado') ctx.drawImage(cv,0,0,Q,Q,cw-S+bx,ch-S+by,S,S);
  else ctx.drawImage(cv,0,0,Q,Q,Math.round(cw/2-S/2)+bx,ch-S+by,S,S);
  // brilho do cajado (soma de luz)
  if(item==='cajado_do_selo'){ const o=img('cajado_do_selo/brilho'); if(o.ok){ ctx.globalCompositeOperation='lighter'; ctx.filter='none'; ctx.globalAlpha=.75+.25*Math.sin(now/220); ctx.drawImage(o.im,fi*Q,0,Q,Q,cw-S+bx,ch-S+by,S,S); } }
  ctx.restore();
  // luz da magia para quem não usa cajado
  if(cast&&fam!=='cajado'){ const p=(now-cast.t0)/cast.dur, a=Math.sin(Math.min(1,p)*Math.PI), cx=cw/2, cy=ch*.45, r=ch*.08*a; if(r>1){ ctx.save(); ctx.globalCompositeOperation='lighter'; const gr=ctx.createRadialGradient(cx,cy,0,cx,cy,r*2); gr.addColorStop(0,'rgba(255,240,190,1)'); gr.addColorStop(.4,'rgba(240,180,70,.8)'); gr.addColorStop(1,'rgba(240,180,70,0)'); ctx.fillStyle=gr; ctx.fillRect(cx-r*2,cy-r*2,r*4,r*4); ctx.restore(); } }
  return true; };
window.fpSpritesDbg=()=>({atk,sh,cache:cache.size});
})();

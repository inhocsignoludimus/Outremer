// =====================================================================
// PRIMEIRA PESSOA — sprites do Lote 1 (camadas): arma/escudo + manga do corpo (tingida) + braçal + mão (pele
// tingida + anel) ou luva. Folhas em assets/fp/<família ou item>/<camada>.png, quadros de 256×256 numa linha.
// Pivôs: uma mão e cajado = canto inferior direito; escudo = inferior esquerdo; duas mãos = centro de baixo.
// =====================================================================
(function(){
if(typeof fpOn!=='function') return;
const BASE='assets/fp/', Q=256;
const MF=window.FP_MANIFEST||{fams:{},items:{}};
// ---------- carregamento preguiçoso ----------
const IM={};
function img(path){ let o=IM[path]; if(!o){ o=IM[path]={im:new Image(),ok:false,bad:false}; o.im.onload=()=>{ o.ok=true; }; o.im.onerror=()=>{ o.bad=true; }; o.im.src=BASE+path+'.png'; } return o; }
// ---------- equipamento -> camadas ----------
const ARMS={plate_arms:'placas',leather_sleeves:'couro',chain_sleeves:'malha',studded_sleeves:'cravejadas',lamellar_sleeves:'lamelares',bedouin_sleeves:'beduinas'};
const GLOVES={leather_gloves:'couro',chain_gloves:'malha',plate_gloves:'manoplas',studded_gloves:'cravejadas',iron_gauntlets:'manoplas_ferro',linen_gloves:'linho'};
const RINGS={copper_ring:'cobre',silver_ring:'prata',gold_ring:'ouro',bronze_ring:'bronze',signet_ring:'sinete',amber_ring:'ambar',sapphire_ring:'safira',ruby_ring:'rubi'};
const SHIELD={wooden_shield:'escudo_de_madeira',buckler:'broquel',kite_shield:'escudo_de_pipa',heater_shield:'escudo_heater',round_shield:'escudo_redondo',crusader_shield:'escudo_cruzado',tower_shield:'escudo_torre',oval_shield:'escudo_oval',pavise:'paves'};
const BODYARM={plate:'placas',chain:'malha',scale:'lamelares',studded:'cravejadas',brig:'cravejadas',leather:'couro'};
function gear(){ const e=player.equip||{}, W=id=>id&&WEAR[id], col=sl=>{ const s=player.gi&&player.gi[sl], k=s&&typeof drawKey==='function'?drawKey(s):e[sl]; return (k&&WEAR[k]&&WEAR[k].col)||null; };
  const body=W(e.body); let arm=ARMS[e.arms]||null;
  if(!arm&&body){ arm=BODYARM[body.kind]||((body.kind==='tabard'&&body.mat==='iron')?'malha':null); }
  const L=player.look||{};
  return {arm, glove:GLOVES[e.hands]||null, ring:RINGS[e.ring]||null, skin:L.skin||'#e0b48e', sleeve:col('body')||L.jacket||'#6a5a4a',
    shield:SHIELD[e.shield]||(e.shield?'escudo_heater':null)}; }
const WMAP={longsword:'espada_longa',sword:'espada_longa',arming_sword:'espada_longa',broadsword:'montante',shortsword:'espada_curta',scimitar:'cimitarra',sabre:'cimitarra',cutlass:'cimitarra',
  falchion:'falcione',cleaver:'falcione',rapier:'rapieira',dagger:'adaga',kris:'adaga',knife:'adaga',skinning_knife:'adaga',mace:'maca',flanged_mace:'maca',morningstar:'maca_estrela',morning_star:'maca_estrela',
  warhammer:'martelo_de_guerra',maul:'martelo_de_guerra',smith_hammer:'martelo_de_guerra',tongs:'martelo_de_guerra',club:'porrete',flail:'mangual',hand_axe:'machadinha',axe:'machadinha',hatchet:'machadinha_de_lenha',pickaxe:'machadinha_de_lenha',
  battleaxe:'machado_de_batalha',broadaxe:'machado_de_batalha',war_axe:'machado_de_batalha',double_axe:'machado_duplo',spear:'lanca',javelin:'lanca',war_fork:'lanca',lance:'lanca',halberd:'alabarda',bardiche:'alabarda',glaive:'alabarda',
  scythe:'foice_de_guerra',pike:'pique',staff:'cajado',quarterstaff:'cajado',crook:'cajado',holy_staff:'cajado_do_selo',scepter:'cajado_do_selo',fire_staff:'cajado_do_fogo',ice_staff:'cajado_do_gelo',wand:'varinha',
  longbow:'arco_longo',composite_bow:'arco_longo',bow:'arco_curto',shortbow:'arco_curto',crossbow:'besta',hand_crossbow:'besta',heavy_crossbow:'besta_pesada',arbalest:'besta_pesada'};
function itemFor(id){ if(!WEAPONS[id]||id==='fists') return null; if(WMAP[id]) return WMAP[id]; const W=WEAPONS[id];
  if(W.skill==='machados') return 'machado_de_batalha'; if(W.skill==='macas') return 'maca'; if(W.skill==='arcos') return 'arco_curto'; if(W.skill==='esgrima') return 'adaga'; return 'espada_longa'; }
// ---------- composição de um quadro ----------
const tmp=document.createElement('canvas'); tmp.width=tmp.height=Q; const tg=tmp.getContext('2d');
function blit(g,o,f){ if(!o||!o.ok) return; g.drawImage(o.im,f*Q,0,Q,Q,0,0,Q,Q); }
function tinted(g,o,f,col){ if(!o||!o.ok) return; tg.globalCompositeOperation='source-over'; tg.clearRect(0,0,Q,Q); tg.drawImage(o.im,f*Q,0,Q,Q,0,0,Q,Q);
  tg.globalCompositeOperation='multiply'; tg.fillStyle=col; tg.fillRect(0,0,Q,Q); tg.globalCompositeOperation='destination-in'; tg.drawImage(o.im,f*Q,0,Q,Q,0,0,Q,Q); tg.globalCompositeOperation='source-over'; g.drawImage(tmp,0,0); }
const cache=new Map();
function compose(item,fam,f,G,noWeapon,vdir,lays){ const key=[item,vdir,fam,f,G.arm,G.glove,G.ring,G.skin,G.sleeve,noWeapon?1:0].join('|'); let c=cache.get(key); if(c&&c.done) return c.cv;
  const layers=[];
  if(item&&!noWeapon) for(const l of lays) if(l!=='brilho') layers.push(['b',img(item+'/'+(vdir?vdir+'/':'')+l)]);
  layers.push(['t',img('maos/'+fam+'/manga_corpo'),G.sleeve]);
  if(G.arm) layers.push(['b',img('maos/'+fam+'/braco_'+G.arm)]);
  if(G.glove) layers.push(['b',img('maos/'+fam+'/luva_'+G.glove)]); else { layers.push(['t',img('maos/'+fam+'/mao_pele'),G.skin]); if(G.ring) layers.push(['b',img('maos/'+fam+'/anel_'+G.ring)]); }
  const ready=layers.every(L=>L[1].ok||L[1].bad);
  if(!c){ c={cv:document.createElement('canvas'),done:false}; c.cv.width=c.cv.height=Q; cache.set(key,c); if(cache.size>220) cache.delete(cache.keys().next().value); }
  const g=c.cv.getContext('2d'); g.clearRect(0,0,Q,Q); g.imageSmoothingEnabled=false;
  for(const L of layers){ if(L[0]==='t') tinted(g,L[1],f,L[2]); else blit(g,L[1],f); }
  c.done=ready; return c.cv; }
// ---------- animação ----------
function mk(q,ms,sp){ ms=(ms||q.map(()=>0)).map(v=>v*(sp||1)); const T=[]; let t=0; for(const m of ms){ t+=m; T.push(t); } return {q,T,dur:t+60}; }
function attackAnim(it,alt){ const A=it.anim, f=it.fam;
  if(A.ataque) return mk(A.ataque[0],A.ataque[1]); if(A.estocada) return mk(A.estocada[0],A.estocada[1]);
  if(f==='arco'){ const p=A.puxar_e_mirar, r=A.soltar; return mk(p[0].concat(r[0].slice(1)),p[1].concat(r[1].slice(1)),.75); }
  if(f==='besta'){ const d=A.disparar, r=A.recarregar; return mk(d[0].concat(r[0].slice(1)),d[1].concat(r[1].slice(1))); }
  if(A.conjurar) return mk(A.conjurar[0],A.conjurar[1]); return mk([0],[0]); }
function frameOf(P,now){ if(!P) return null; const e=now-P.t0; if(e>=P.dur) return null; let i=0; while(i<P.T.length-1&&e>=P.T[i+1]) i++; return P.q[i]; }
let atk=null, sh=null, cast=null, lastCd=0, lastCast=0, lastHp=null, lastW=null, swapT=0, alt=0;
const NONE={fam:'uma_mao',n:7,lay:[],anim:{ataque:[[0,1,2,3,4,5,0],[0,90,50,50,110,90,0]]}};
// ---------- desenho ----------
window.fpHandsDraw=function(ctx,lw,lh,now,light){ if(!player||player.ghost) return false;
  const tool=gathering?(gathering.kind==='tree'?'hatchet':'pickaxe'):null, id=tool||player.weapon, item=itemFor(id), base=item&&MF.items[item]||NONE, G=gear();
  if(id!==lastW){ lastW=id; swapT=now; atk=null; }
  const cd=player.atkCd||0;
  if(cd>lastCd+.05){ alt^=1; const useVar=base.var&&base.var.estocada&&alt; const it=useVar?base.var.estocada:base; atk=Object.assign(attackAnim(it,alt),{t0:now,it,vdir:useVar?'estocada':''}); } lastCd=cd;
  const cc=player.castCd||0; if(cc>lastCast+.05){ cast={t0:now,dur:640}; if(base.fam==='cajado') atk=Object.assign(attackAnim(base),{t0:now,it:base,vdir:''}); } lastCast=cc; if(cast&&now-cast.t0>cast.dur) cast=null;
  const SH=G.shield&&MF.items[G.shield];
  if(lastHp!=null&&player.hp<lastHp-.5&&SH&&!sh){ const e=SH.anim.erguer, bx=SH.anim.baixar; sh=Object.assign(mk(e[0].concat([2],bx[0].slice(1)),e[1].concat([260],bx[1].slice(1))),{t0:now}); } lastHp=player.hp;
  if(gathering&&!atk) atk=Object.assign(attackAnim(base),{t0:now,it:base,vdir:''});
  const cur=atk&&now-atk.t0<atk.dur?atk:null, it=cur?cur.it:base, vdir=cur?cur.vdir:'', fam=it.fam, fi=cur?frameOf(cur,now)||0:0;
  const cw=canvas.width, ch=canvas.height, k=Math.max(1,Math.round(ch*.74/Q*2)/2), S=Q*k;
  const walk=player.moving?Math.sin(player.phase||now/130):0, swap=Math.min(1,(now-swapT)/260);
  const bx=Math.round(walk*6*k/2), by=Math.round((Math.abs(walk)*6+Math.sin(now/900)*2)*k/2+(1-swap)*S*.5);
  const Lb=Math.max(.3,Math.min(1.05,light.b)), filt=Lb<.98?`brightness(${Lb.toFixed(2)})${light.warm>.3?' sepia(.25)':''}`:'none';
  ctx.save(); ctx.imageSmoothingEnabled=false; ctx.filter=filt;
  if(SH&&(fam==='uma_mao'||fam==='estocada')){ const f=frameOf(sh,now); ctx.drawImage(compose(G.shield,'escudo',f==null?0:f,G,false,'',SH.lay),0,0,Q,Q,-bx,ch-S+by,S,S); }
  const piv=(MF.fams[fam]||{}).pivo||'inferior_direito', X=piv==='inferior_centro'?Math.round(cw/2-S/2)+bx:cw-S+bx, Y=ch-S+by;
  ctx.drawImage(compose(item,fam,fi,G,!item,vdir,it.lay),0,0,Q,Q,X,Y,S,S);
  if(item&&it.lay.includes('brilho')){ const o=img(item+'/brilho'); if(o.ok){ ctx.globalCompositeOperation='lighter'; ctx.filter='none'; ctx.globalAlpha=.7+.3*Math.sin(now/220); ctx.drawImage(o.im,fi*Q,0,Q,Q,X,Y,S,S); } }
  ctx.restore();
  if(cast&&fam!=='cajado'){ const p=(now-cast.t0)/cast.dur, a=Math.sin(Math.min(1,p)*Math.PI), cx=cw/2, cy=ch*.45, r=ch*.08*a; if(r>1){ ctx.save(); ctx.globalCompositeOperation='lighter'; const gr=ctx.createRadialGradient(cx,cy,0,cx,cy,r*2); gr.addColorStop(0,'rgba(255,240,190,1)'); gr.addColorStop(.4,'rgba(240,180,70,.8)'); gr.addColorStop(1,'rgba(240,180,70,0)'); ctx.fillStyle=gr; ctx.fillRect(cx-r*2,cy-r*2,r*4,r*4); ctx.restore(); } }
  return true; };
window.fpSpritesDbg=()=>({atk,sh,cache:cache.size});
})();

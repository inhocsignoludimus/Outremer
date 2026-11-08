'use strict';
// =====================================================================
// OUTREMER — as 64 magias do 3D (8 círculos, reagentes), as 7 habilidades de arma,
// o livro de magias (L) e a morte: o espírito vaga até o padre da Capela do Selo.
// Carrega depois de monsters.js.
// =====================================================================
const SPELLS3 = {}; for(const s of D3['magic/spells'].spells) SPELLS3[s.id]=s;
const ABIL3 = {}; for(const a of D3.abilities.abilities) ABIL3[a.id]=a;
const CIRCLE_SKILL = c => (c-1)*12;              // círculo 1: qualquer um · círculo 8: Magia 84
const WFAMSK = { sword:'espadas', bow:'arcos', mace:'macas', spear:'esgrima', axe:'machados' };
// cada magia e habilidade vira um "item" que vai na barra de atalhos (1–0)
const SCROLLCOL = ['#c8b890','#8ab8e8','#7ad08a','#e8c060','#e88a4a','#c87ae8','#e85a5a','#f0f0f0'];
for(const s of Object.values(SPELLS3)){
  ITEMS['sp_'+s.id] = { name:s.name, stack:1, spell:s.id, desc:s.desc, use:()=>{ castSpell(s.id); return {consume:false}; } };
  const c=document.createElement('canvas'); c.width=16; c.height=16; const g=c.getContext('2d'), col=ELCOL[s.effect.element] || SCROLLCOL[s.circle-1];
  g.fillStyle='#e0d4b0'; g.fillRect(3,2,10,12); g.fillStyle='#a89870'; g.fillRect(3,2,10,1); g.fillRect(3,13,10,1);
  g.fillStyle=col; g.fillRect(6,5,4,4); g.fillStyle='#fff'; g.fillRect(7,6,1,1); g.fillStyle='#5a4a30'; for(let i=0;i<s.circle;i++) g.fillRect(4+i,11,1,1);
  ICONS['sp_'+s.id]=c.toDataURL();
}
for(const a of Object.values(ABIL3)){
  ITEMS['ab_'+a.id] = { name:a.name, stack:1, ability:a.id, desc:a.desc, use:()=>{ useAbility(a.id); return {consume:false}; } };
  const c=document.createElement('canvas'); c.width=16; c.height=16; const g=c.getContext('2d');
  g.fillStyle='#3a1a14'; g.fillRect(1,1,14,14); g.fillStyle='#a8483a'; g.fillRect(1,1,14,1); g.fillRect(1,14,14,1);
  const ic={sword:'longsword',bow:'bow',mace:'mace',spear:'spear',axe:'battleaxe'}[a.weapon]; drawWeaponAt(g,4,12,ic,-Math.PI/4); ICONS['ab_'+a.id]=c.toDataURL();
}
const isSkillItem = id => id && (id.startsWith('sp_')||id.startsWith('ab_'));
const _drop5 = dropSlot; dropSlot = function(i){ if(inv[i] && isSkillItem(inv[i].id)){ inv[i]=null; renderHotbar(); if(invOpen) renderInvPanel(); return; } _drop5(i); };

// alvo: o monstro mais perto na direção em que você olha (bom para o celular); senão, para a frente
function spellTarget(range){
  let best=null, bd=1e9; const fa=player.aimAng ?? FACE_ANG[player.face];
  for(const r of raiders){ const d=Math.hypot(r.x-player.x,r.y-player.y); if(d>range) continue; const a=Math.atan2(r.y-player.y,r.x-player.x);
    const da=Math.abs(((a-fa+9.42)%6.283)-3.14); const sc=d+da*60; if(sc<bd && los(player.x,player.y-10,r.x,r.y-10)){ bd=sc; best=r; } }
  return best;
}
function hasReag(s){ return Object.entries(s.reagents||{}).every(([k,n])=>countItem(k)>=n); }
function castSpell(id){
  const s=SPELLS3[id]; if(!s || !running) return;
  if(player.ghost){ toast('Um espírito não conjura.'); return; }
  if((player.castCd||0)>0) return;
  const need=CIRCLE_SKILL(s.circle);
  if(skill('magia')<need){ toast(`${s.name} pede Magia ${need}.`); return; }
  if((player.mana||0)<s.mana){ toast('Mana insuficiente.'); return; }
  if(!hasReag(s)){ toast(`Faltam reagentes: ${Object.entries(s.reagents).map(([k,n])=>n+' '+ITEMS[k].name).join(', ')}.`); return; }
  player.castCd=.6+s.circle*.12;
  const chance=Math.min(.98, .5 + (skill('magia')-need)/50 + gb('int')/200);
  for(const [k,n] of Object.entries(s.reagents||{})) takeItem(k,n);
  player.mana-=s.mana; gainSkill('magia', .6+s.circle*.2);
  if(Math.random()>chance){ toast('A magia falha.'); fxBurst(player.x,player.y-12,'#888',8); return; }
  const E=s.effect, pw = 1 + skill('magia')/100 + gb('int')/150 + (skill('avaliar')/250), base=avgOf(E.base)*pw;
  const col=ELCOL[E.element]||SCROLLCOL[s.circle-1], tgt=spellTarget(12*T), ang = tgt ? Math.atan2(tgt.y-player.y,tgt.x-player.x) : (player.aimAng ?? FACE_ANG[player.face]);
  if(tgt){ player.aimAng=ang; player.face=faceFromAng(ang); }
  if(Math.random()<.4) gainSkill('avaliar',.3);
  switch(E.type){
    case 'heal': player.health=Math.min(player.maxHealth, player.health+base*1.4); if(id==='choir_cleanse'||id==='salt_wash') player.poison=0; fxBurst(player.x,player.y-12,'#ffe890',16); toast(`${s.name}: +${Math.round(base*1.4)} de vida.`); break;
    case 'damage': {
      const aoe=(E.aoe||0)*T; if(id==='falling_stars'||id==='split_ground'||id==='naphtha_pillar'){ const x=tgt?tgt.x:player.x+Math.cos(ang)*60, y=tgt?tgt.y:player.y+Math.sin(ang)*60;
        for(let k=0;k<(id==='falling_stars'?6:3);k++) setTimeout(()=>{ const px=x+(Math.random()-.5)*50, py=y+(Math.random()-.5)*30; fxRing(px,py,30,col); fxBurst(px,py-6,col,14,50);
          for(const r of [...raiders]) if(Math.hypot(r.x-px,r.y-py)<30) spellDamage(r,base*.8,0,4); }, k*180); shake=Math.max(shake,4); break; }
      shoot(player.x,player.y-10,ang,{owner:'player',dmg:base,el:E.element,col,speed:200,aoe:aoe||(s.circle>=5?24:0),big:s.circle>=5,knock:4}); break; }
    case 'buff': applyBuff(s, E, base); break;
    case 'debuff': { const t=tgt; if(!t){ toast('Nenhum alvo.'); return; }
      fxBurst(t.x,t.y-12,'#a060c0',12);
      if(E.stat==='paralyze') t.stunT=3+skill('magia')/30; else if(E.stat==='banish'){ if(t.summoned){ spellDamage(t,9999,0,0); } else toast('Só funciona em criaturas chamadas.'); }
      else if(E.stat==='dex') t.slowT=8; else if(E.stat==='mana') player.mana=Math.min(player.maxMana,player.mana+8); else { t.weakT=10; t.stunT=.4; }
      if(id==='crowd_malison') for(const r of raiders) if(Math.hypot(r.x-t.x,r.y-t.y)<50){ r.slowT=6; r.weakT=6; }
      toast(`${s.name} em ${MONS[t.mon]?.name||'alvo'}.`); break; }
    case 'create_item': addItem(id==='linen_wrap'?'bandage':'bread', id==='linen_wrap'?3:2); toast(id==='linen_wrap'?'Bandagens de linho surgem nas suas mãos.':'Pão de peregrino.'); break;
    case 'teleport': { const dist=(id==='two_sands_door'?10:id==='shrine_step'?7:5)*T; let bx=player.x, by=player.y;
      for(let k=1;k<=20;k++){ const x=player.x+Math.cos(ang)*dist*k/20, y=player.y+Math.sin(ang)*dist*k/20; if(!walk[idx(Math.floor(x/T),Math.floor(y/T))]) break; bx=x; by=y; }
      fxBurst(player.x,player.y-10,'#c8a0ff',14); player.x=bx; player.y=by; fxBurst(bx,by-10,'#c8a0ff',14); break; }
    case 'field': { const x=tgt?tgt.x:player.x+Math.cos(ang)*50, y=tgt?tgt.y:player.y+Math.sin(ang)*50, el=E.element||'energy';
      fields.push({x,y,r:26+s.circle*2,t:8+s.circle,col:ELCOL[el]||'#c8a0ff',dmg:base*.25,slow:el==='physical'||id==='white_cage',stun:id==='white_cage'||id==='salt_bars'}); break; }
    case 'summon': summonAlly(s, base); break;
    case 'reveal': toast('Nada se esconde de você por um tempo.'); player.buffs=player.buffs||{}; break;
  }
}
// bênçãos: viram bônus temporários que entram no cálculo do equipamento
function applyBuff(s,E,base){
  player.sb=player.sb||{}; const dur=60+skill('magia')*1.5;
  const add=(k,v)=>player.sb[k]=[v,dur];
  if(s.id==='three_gifts'||s.id==='eighth_seal'){ const v=s.id==='eighth_seal'?20:8; add('str',v); add('dex',v); add('int',v); if(s.id==='eighth_seal'){ add('armor_flat',15); add('dmg_pct',15); } }
  else if(s.id==='pilgrim_ward'){ add('res_fire',15); add('res_cold',15); add('res_poison',15); }
  else if(E.stat==='night_sight') add('night',1);
  else if(E.stat==='invisible'){ player.invisT=20+skill('magia')/4; toast('Você some da vista dos inimigos.'); }
  else if(E.stat==='spell_reflect') add('def_chance',15);
  else if(E.stat==='polymorph'){ add('str',15); add('armor_flat',10); }
  else add(E.stat, Math.round(avgOf(E.base)*(1+skill('magia')/150)));
  recalcGear(); fxRing(player.x,player.y,20,'#ffe890'); toast(`${s.name} por ${Math.round(dur)}s.`);
}
const _recalc = recalcGear;
recalcGear = function(){ _recalc(); if(!player||!player.sb) return; for(const [k,[v]] of Object.entries(player.sb)) player.gb[k]=(player.gb[k]||0)+v;
  const b=player.gb, baseHp=player.look.race==='anao'?115:100; player.maxHealth=baseHp+(b.hp||0)+(b.str||0); player.maxStamina=100+(b.stam||0)+(b.dex||0)*.5;
  player.maxMana=50+(b.int||0)*2+(b.mana||0)+(player.look.race==='elfo'?15:0)+skill('magia')*.5; };
// criaturas chamadas lutam ao seu lado
let allies=[];
function summonAlly(s, base){
  const kind={blade_djinn:['Djinn das Lâminas','#c8a0ff'],call_jackal:['Chacal','#a8784a'],labyrinth_rush:['Touro do Labirinto','#6a3a24'],call_kiln:['Elemental do Forno','#ff7a20'],
    call_quarry:['Elemental de Pedra','#8a8680'],call_simoom:['Elemental do Simum','#e0d0a0'],call_cistern:['Elemental da Cisterna','#60c0e0']}[s.id]||['Espírito','#ffffff'];
  allies.push({x:player.x+20,y:player.y,hp:40+base*3,max:40+base*3,dmg:base*.6,t:60+skill('magia'),name:kind[0],col:kind[1],cd:0,ph:0});
  fxBurst(player.x+20,player.y-10,kind[1],20); toast(`${kind[0]} atende ao chamado.`);
}
function updateAllies(dt){
  for(const a of [...allies]){ a.t-=dt; a.cd-=dt; a.ph+=dt*8; if(a.t<=0||a.hp<=0){ fxBurst(a.x,a.y-8,a.col,14); allies.splice(allies.indexOf(a),1); continue; }
    let tgt=null, bd=9*T; for(const r of raiders){ const d=Math.hypot(r.x-a.x,r.y-a.y); if(d<bd){ bd=d; tgt=r; } }
    const gx=tgt?tgt.x:player.x+18, gy=tgt?tgt.y:player.y, d=Math.hypot(gx-a.x,gy-a.y);
    if(d>(tgt?12:20)){ const an=Math.atan2(gy-a.y,gx-a.x); a.x+=Math.cos(an)*60*dt; a.y+=Math.sin(an)*60*dt; }
    else if(tgt && a.cd<=0){ a.cd=.8; spellDamage(tgt,a.dmg,Math.atan2(tgt.y-a.y,tgt.x-a.x),3); fxBurst(tgt.x,tgt.y-10,a.col,6); }
    for(const r of raiders) if(Math.hypot(r.x-a.x,r.y-a.y)<14 && r.cd<=0 && Math.random()<dt*1.2){ a.hp-=OW[r.weapon]?.dmg*.4||4; } }
}
// ---------------- habilidades de arma ----------------
function useAbility(id){
  const a=ABIL3[id]; if(!a||!running||player.ghost) return;
  const Wp=WEAPONS[player.weapon]||{}, sk=WFAMSK[a.weapon];
  if(Wp.skill!==sk){ toast(`${a.name} precisa de uma arma de ${SKILL_NAMES[sk]}.`); return; }
  if(skill(sk)<(a.min_level||40)){ toast(`${a.name} pede ${SKILL_NAMES[sk]} ${a.min_level}.`); return; }
  player.abCd=player.abCd||{}; if((player.abCd[id]||0)>0){ toast(`${a.name}: espere ${Math.ceil(player.abCd[id])}s.`); return; }
  if(player.stamina<a.stamina){ toast('Fôlego insuficiente.'); return; }
  player.stamina-=a.stamina; player.abCd[id]=a.cooldown_s;
  const pw=avgOf(a.effect.base)*(1+skill(sk)/100+skill('taticas')/200)*(1+gb('dmg_pct')/100), tgt=spellTarget(10*T), ang=tgt?Math.atan2(tgt.y-player.y,tgt.x-player.x):(player.aimAng??FACE_ANG[player.face]);
  player.aimAng=ang; player.face=faceFromAng(ang); gainSkill(sk,1);
  if(id==='whirlwind_strike'){ fxRing(player.x,player.y-4,36,'#e0e0e0'); for(const r of [...raiders]) if(Math.hypot(r.x-player.x,r.y-player.y)<36) spellDamage(r,pw,Math.atan2(r.y-player.y,r.x-player.x),8); player.swing={t:.3,ang}; }
  else if(id==='charge'){ for(let k=0;k<12;k++){ const x=player.x+Math.cos(ang)*5, y=player.y+Math.sin(ang)*5; if(!walk[idx(Math.floor(x/T),Math.floor(y/T))]) break; player.x=x; player.y=y; fxs.push({x,y:y-4,vx:0,vy:-5,t:.3,col:'#c8b890'}); }
    for(const r of [...raiders]) if(Math.hypot(r.x-player.x,r.y-player.y)<22){ spellDamage(r,pw,ang,12); r.stunT=1; } }
  else if(id==='multishot'){ if(!countItem(Wp.ammo)){ toast('Sem flechas.'); return; } for(let k=-2;k<=2;k++){ if(!countItem(Wp.ammo)) break; takeItem(Wp.ammo,1); shoot(player.x,player.y-10,ang+k*.14,{owner:'player',dmg:pw*.7,el:'arrow',col:'#c8a870',speed:260}); } }
  else if(id==='piercing_arrow'){ if(!countItem(Wp.ammo)){ toast('Sem flechas.'); return; } takeItem(Wp.ammo,1); shoot(player.x,player.y-10,ang,{owner:'player',dmg:pw*1.3,el:'arrow',col:'#fff',speed:320,pierce:true,life:1.4}); }
  else if(id==='stun_blow'){ if(tgt && Math.hypot(tgt.x-player.x,tgt.y-player.y)<30){ spellDamage(tgt,pw,ang,6); tgt.stunT=2.5; fxBurst(tgt.x,tgt.y-18,'#ffe080',10); } else toast('Chegue mais perto.'); }
  else if(id==='long_thrust'){ for(const r of [...raiders]){ const dx=r.x-player.x, dy=r.y-player.y, along=dx*Math.cos(ang)+dy*Math.sin(ang), off=Math.abs(-dx*Math.sin(ang)+dy*Math.cos(ang)); if(along>0&&along<55&&off<10) spellDamage(r,pw,ang,6); }
    for(let k=0;k<55;k+=4) fxs.push({x:player.x+Math.cos(ang)*k,y:player.y-10+Math.sin(ang)*k,vx:0,vy:0,t:.25,col:'#e0e0e0'}); }
  else if(id==='heavy_blow'){ if(tgt && Math.hypot(tgt.x-player.x,tgt.y-player.y)<30){ spellDamage(tgt,pw*1.6,ang,14); shake=Math.max(shake,5); fxBurst(tgt.x,tgt.y-10,'#c83a2a',14); } else toast('Chegue mais perto.'); }
  toast(a.name+'!');
}
// ---------------- livro de magias e habilidades (L) ----------------
(function(){
  const p=document.createElement('div'); p.id='book-panel'; p.className='gpanel'; p.style.display='none';
  p.innerHTML=`<div class="gbox wide"><div class="ghead"><b>LIVRO DE MAGIAS</b><span class="tabs"><button class="tab on" id="bk-sp">Magias</button><button class="tab" id="bk-ab">Habilidades</button></span><button id="bk-close">Fechar (L)</button></div>
    <div class="bk-note" id="bk-note"></div><div id="bk-list" class="bk-list"></div></div>`;
  document.body.appendChild(p);
  const st=document.createElement('style'); st.textContent=`.bk-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:6px;max-height:62vh;overflow-y:auto}
  .bk-c{grid-column:1/-1;color:#e8c070;font-size:13px;margin-top:6px;border-bottom:1px solid #3a3026}
  .bk-s{display:flex;gap:6px;align-items:center;background:#0d0b09;border:1px solid #2d261f;padding:5px;cursor:pointer}.bk-s img{width:28px;height:28px;image-rendering:pixelated}
  .bk-s b{color:#eadfce;font-size:13px;display:block}.bk-s small{color:#9a8e7e;font-size:11px;display:block;line-height:1.2}.bk-s.no{opacity:.45}.bk-s:hover{border-color:#8a6a40}
  .bk-note{font-size:12px;color:#9a8e7e;margin:4px 0 8px}`; document.head.appendChild(st);
  let tab='sp';
  window.renderBook=function(){
    const L=document.getElementById('bk-list'); L.innerHTML='';
    document.getElementById('bk-sp').classList.toggle('on',tab==='sp'); document.getElementById('bk-ab').classList.toggle('on',tab==='ab');
    document.getElementById('bk-note').textContent = tab==='sp' ? `Magia ${skill('magia').toFixed(1)} · Mana ${Math.round(player.mana||0)}/${Math.round(player.maxMana||0)} · toque numa magia para pôr na barra de atalhos (1–0).` : 'Habilidades da arma que você empunha. Pedem a skill da arma e fôlego. Toque para pôr na barra.';
    const put=(iid)=>{ let i=inv.findIndex((s,k)=>k<HOTBAR&&s&&s.id===iid); if(i>=0){ toast('Já está na barra.'); return; } i=inv.findIndex((s,k)=>k<HOTBAR&&!s);
      if(i<0){ toast('Barra cheia: libere um espaço (1–0).'); return; } inv[i]={id:iid,qty:1}; renderHotbar(); toast(`${ITEMS[iid].name} na tecla ${(i+1)%10}.`); };
    if(tab==='sp'){ let c=0; for(const s of Object.values(SPELLS3).sort((a,b)=>a.circle-b.circle)){ if(s.circle!==c){ c=s.circle; const h=document.createElement('div'); h.className='bk-c'; h.textContent=`${c}º Círculo — pede Magia ${CIRCLE_SKILL(c)}`; L.appendChild(h); }
        const ok=skill('magia')>=CIRCLE_SKILL(s.circle), d=document.createElement('div'); d.className='bk-s'+(ok?'':' no');
        d.innerHTML=`<img src="${ICONS['sp_'+s.id]}"><div><b>${s.name} <small style="display:inline">· ${s.mana} mana</small></b><small>${s.desc}</small><small>${Object.entries(s.reagents||{}).map(([k,n])=>`${n} ${ITEMS[k].name} (${countItem(k)})`).join(' · ')||'sem reagentes'}</small></div>`;
        d.onclick=()=>put('sp_'+s.id); L.appendChild(d); } }
    else for(const a of Object.values(ABIL3)){ const sk=WFAMSK[a.weapon], ok=skill(sk)>=(a.min_level||40), d=document.createElement('div'); d.className='bk-s'+(ok?'':' no');
      d.innerHTML=`<img src="${ICONS['ab_'+a.id]}"><div><b>${a.name}</b><small>${a.desc}</small><small>${SKILL_NAMES[sk]} ${a.min_level} · ${a.stamina} fôlego · recarga ${a.cooldown_s}s</small></div>`; d.onclick=()=>put('ab_'+a.id); L.appendChild(d); }
  };
  window.toggleBook=function(){ const open=p.style.display==='none'; if(open){ closePanels&&closePanels('book'); p.style.display='flex'; renderBook(); } else p.style.display='none'; };
  document.getElementById('bk-close').onclick=()=>p.style.display='none';
  document.getElementById('bk-sp').onclick=()=>{ tab='sp'; renderBook(); }; document.getElementById('bk-ab').onclick=()=>{ tab='ab'; renderBook(); };
  addEventListener('keydown',e=>{ if(e.key.toLowerCase()==='l' && running && document.activeElement.tagName!=='INPUT') toggleBook(); });
  const hb=document.querySelector('.hudbtns'); if(hb){ const b=document.createElement('button'); b.textContent='MAGIAS'; b.onclick=()=>toggleBook(); hb.insertBefore(b,hb.firstChild); }
})();

// ---------------- morte: o espírito procura o padre ----------------
die = function(){
  if(player.ghost) return;
  player.ghost=true; player.health=1; player.poison=0; player.slowT=0; player.sb={}; recalcGear();
  const dl=document.getElementById('dead'); if(dl) dl.style.display='none';
  for(const r of raiders){ if(r.foe===player){ r.foe=null; r.state='wander'; } }
  fxBurst(player.x,player.y-10,'#c8d8ff',30,40);
  toast('Você morreu. Seu espírito vaga por Aelória… Procure o padre na Capela do Selo para voltar à vida.');
};
const _nf = nearestFoe; nearestFoe = function(a,range){ const f=_nf(a,range); return (f===player && (player.ghost || player.invisT>0)) ? null : f; };
const _pa = playerAttack; playerAttack = function(ang){ if(player.ghost){ return; } _pa(ang); };
const _dh5 = drawHuman;
drawHuman = function(g,x,y,h){ if(player && player.ghost && h.look===player.look && !invOpen){ g.globalAlpha=.45; _dh5(g,x,y,{...h,look:{...h.look,skin:'#c8d8f0',hair:'#e8f0ff',jacket:'#a8b8d8',jacketD:'#8898b8',pants:'#a8b8d8',boot:'#8898b8'},weapon:'fists',gi:{},head:null,body:null}); g.globalAlpha=1; return; }
  if(player && player.invisT>0 && h.look===player.look){ g.globalAlpha=.3; _dh5(g,x,y,h); g.globalAlpha=1; return; } _dh5(g,x,y,h); };
function chapel(){ return buildings.find(b=>b&&b.t==='church'); }
const _pp = placePeople;
placePeople = function(){ _pp(); const c=chapel(); if(!c) return;
  const free=[]; for(let y=c.y+2;y<c.y+c.h-2;y++) for(let x=c.x+2;x<c.x+c.w-2;x++) if(!solidTile(x,y)&&!objGrid[idx(x,y)]&&!doors.has(idx(x,y))) free.push([x,y]);
  free.sort((a,b)=>a[1]-b[1]); const sp=free[0]; if(!sp) return;
  const look={sex:'m',skin:'#d8a87a',hair:'#8a8680',style:'short',beard:1,jacket:'#1a1a1a',jacketD:'#101010',pants:'#1a1a1a',boot:'#101010',race:'humano'};
  const n={id:npcs.length+9000, role:'priest', name:'Padre Anselmo', x:sp[0]*T+8, y:sp[1]*T+12, hx:sp[0]*T+8, hy:sp[1]*T+12, look, face:'down', phase:0, moving:false, hp:999, max:999,
    weapon:null, state:'idle', t:0, cd:0, wind:0, swingT:0, hurtT:0, alive:true, path:null, pathT:0, dead:false, post:true, home:c.id};
  npcs.push(n);
};
const _talk = talkTo;
talkTo = function(n){
  if(n.role!=='priest') return _talk(n);
  if(player.ghost){ openActions('Padre Anselmo', [['"Pobre alma. Em nome do Pai, do Filho e do Espírito Santo: levanta-te."',null],['Voltar à vida', ()=>{
      player.ghost=false; player.health=Math.round(player.maxHealth*.5); player.stamina=player.maxStamina; fxBurst(player.x,player.y-12,'#ffe890',30,50); fxRing(player.x,player.y,30,'#ffe890');
      toast('Você volta à vida. Deus seja louvado.'); }]]); return; }
  openActions('Padre Anselmo, Capela do Selo', [['"A paz de Cristo, filho. O Selo resiste enquanto houver fé nesta terra."',null],
    ['Pedir a bênção (cura)', ()=>{ player.health=player.maxHealth; player.poison=0; fxBurst(player.x,player.y-12,'#ffe890',20); toast('O padre te abençoa. Suas feridas se fecham.'); }],
    ['"Se cair em combate, seu espírito volta para cá. Eu te trago de volta."',null],['Amém',null]]);
};
// enquanto fantasma: aponta o caminho da capela
const _upd6 = update;
update = function(dt){ _upd6(dt); if(!running||!player) return;
  updateAllies(dt); if(player.castCd>0) player.castCd-=dt; if(player.invisT>0) player.invisT-=dt;
  if(player.abCd) for(const k in player.abCd) if(player.abCd[k]>0) player.abCd[k]-=dt;
  if(player.sb){ let ch=false; for(const k of Object.keys(player.sb)){ player.sb[k][1]-=dt; if(player.sb[k][1]<=0){ delete player.sb[k]; ch=true; } } if(ch) recalcGear(); }
  let gh=document.getElementById('ghost-hint'); if(!gh){ gh=document.createElement('div'); gh.id='ghost-hint'; gh.style.cssText='position:fixed;top:64px;left:50%;transform:translateX(-50%);color:#c8d8ff;font-size:14px;text-shadow:1px 1px 0 #000;pointer-events:none;z-index:60'; document.body.appendChild(gh); }
  const c=chapel(); if(player.ghost && c){ const dx=(c.x+c.w/2)*T-player.x, dy=(c.y+c.h/2)*T-player.y, d=Math.round(Math.hypot(dx,dy)/T);
    const dir=['leste','sudeste','sul','sudoeste','oeste','noroeste','norte','nordeste'][Math.round(((Math.atan2(dy,dx)+6.283)%6.283)/(Math.PI/4))%8];
    gh.textContent=`✝ Espírito — Capela do Selo: ${d} passos a ${dir}`; gh.style.display='block'; } else gh.style.display='none';
};
const _dfx = drawFX;
drawFX = function(g,cx,cy){ _dfx(g,cx,cy);
  for(const a of allies){ const x=Math.round(a.x-cx), y=Math.round(a.y-cy), b=Math.round(Math.sin(a.ph)*1.5); g.globalAlpha=.8; g.fillStyle=a.col;
    g.fillRect(x-3,y-16+b,6,12); g.fillRect(x-2,y-20+b,4,4); g.fillRect(x-5,y-14+b,2,6); g.fillRect(x+3,y-14+b,2,6); g.fillStyle='#fff'; g.fillRect(x-1,y-18+b,1,1); g.fillRect(x+1,y-18+b,1,1); g.globalAlpha=1; } };
const _ser6 = serialize; serialize = function(){ const s=_ser6(); s.ghost=!!player.ghost; s.mana=player.mana; return s; };
const _app6 = applySave; applySave = function(s){ _app6(s); player.ghost=!!s.ghost; player.mana=s.mana??player.maxMana; };
// todo personagem já conhece as magias do 1º círculo no livro; um mago já começa com duas na barra
const _sg6 = startGame; startGame = function(){ _sg6(); if(!player) return; player.mana=player.maxMana;
  if(skill('magia')>=30){ for(const id of ['spark_dart','minor_mend']){ const i=inv.findIndex((s,k)=>k<HOTBAR&&!s); if(i>=0) inv[i]={id:'sp_'+id,qty:1}; } addItem('incense',10); addItem('saltpeter',10); renderHotbar(); } };

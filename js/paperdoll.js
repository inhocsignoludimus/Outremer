'use strict';
// =====================================================================
// OUTREMER — paperdoll em pixel e mochila estilo UO (os itens soltos dentro da bolsa).
// Substitui a tela de inventário do After Light (sem membros, sem fome).
// =====================================================================
(function buildPanel(){
  const box = document.querySelector('#inv-panel .gbox');
  box.innerHTML = `
  <div class="ghead"><b id="pd-name">PERSONAGEM</b><span class="tabs"><button class="tab on">Mochila</button><button class="tab" id="inv-to-craft">Fabricar (C)</button></span><button id="inv-close">Fechar (I)</button></div>
  <div class="pd-cols">
    <div class="pd-doll">
      <div class="pd-title" id="pd-title"></div>
      <div class="pd-frame"><div class="pd-slots" id="pd-left"></div><canvas id="pd-cv" width="44" height="52"></canvas><div class="pd-slots" id="pd-right"></div></div>
      <div class="pd-stats" id="pd-stats"></div>
      <div id="inv-wear" style="display:none"></div><canvas id="body-cv" width="1" height="1" style="display:none"></canvas><div id="body-vitals" style="display:none"></div>
    </div>
    <div class="pd-main">
      <div class="glabel">MOCHILA</div><div class="pd-bag" id="inv-bag"></div>
      <div class="glabel">ATALHOS <small>teclas 1–0</small></div><div class="grid" id="inv-hot"></div>
      <div id="inv-detail"><div id="inv-icon"></div><div><div id="inv-info"></div><div id="inv-acts"></div></div></div>
    </div>
    <div class="icol store-col" id="inv-store-wrap"><div class="glabel" id="inv-store-title">BAÚ</div><div class="grid g6" id="inv-store"></div><div id="inv-store-acts"></div></div>
  </div>`;
  const st=document.createElement('style'); st.textContent=`
  .pd-cols{display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap}
  .pd-doll{width:330px;background:#1a1510;border:2px solid #4a3a26;box-shadow:inset 0 0 0 2px #0e0b08;padding:8px}
  .pd-title{color:#e8c070;text-align:center;font-size:13px;margin-bottom:4px;min-height:16px}
  .pd-frame{display:flex;justify-content:space-between;align-items:center;background:radial-gradient(#3a2e20,#14100c);border:1px solid #3a3026;padding:6px}
  #pd-cv{width:176px;height:208px;image-rendering:pixelated}
  .pd-slots{display:flex;flex-direction:column;gap:4px}
  .pd-slot{width:42px;height:42px;background:#0d0b09;border:2px solid #2d261f;position:relative;cursor:pointer;display:flex;align-items:center;justify-content:center}
  .pd-slot img{width:80%;height:80%;image-rendering:pixelated}
  .pd-slot .k{position:absolute;top:0;left:2px;font-size:8px;color:#6d6256}
  .pd-slot.fit{border-color:#7ac070;border-style:dashed}
  .pd-stats{font-size:12px;color:#cdbfae;margin-top:6px;line-height:1.5;columns:2}
  .pd-stats b{color:#eadfce}
  .pd-main{flex:1;min-width:300px}
  .pd-bag{position:relative;height:250px;background:radial-gradient(ellipse at 50% 40%,#7a5634,#4a3018 70%,#2a1a0c);border:3px solid #2a1a0c;border-radius:40px 40px 18px 18px;box-shadow:inset 0 6px 0 #8a6640,inset 0 -8px 12px #1a0e06}
  .pd-bag:before{content:'';position:absolute;left:30%;right:30%;top:-12px;height:14px;border:3px solid #2a1a0c;border-bottom:none;border-radius:20px 20px 0 0}
  .pd-bag .bi{position:absolute;width:44px;height:44px;display:flex;align-items:center;justify-content:center;cursor:pointer}
  .pd-bag .bi img{width:100%;height:100%;image-rendering:pixelated;filter:drop-shadow(1px 2px 0 rgba(0,0,0,.6))}
  .pd-bag .bi .q{position:absolute;bottom:-2px;right:0;font-size:12px;color:#fff;text-shadow:1px 1px 0 #000}
  .pd-bag .bi.sel{outline:2px solid #e8c070}
  .pd-bag .bi.free{outline:1px dashed rgba(232,192,112,.35)}
  .pd-bag .bi.eq:after{content:'E';position:absolute;top:-4px;left:0;font-size:10px;color:#e8c070}
  .rar-refinado{color:#6aa0ff}.rar-raro{color:#f0d040}.rar-conjunto{color:#40d060}.rar-lendario{color:#ff9a30}
  #inv-info .aff{color:#8ab8ff;font-size:13px}#inv-info .setb{color:#40d060;font-size:12px}#inv-info .lore{color:#b8a888;font-style:italic;font-size:12px}
  @media (max-width:760px){ .pd-doll{width:100%} #pd-cv{width:132px;height:156px} .pd-bag{height:210px} .pd-bag .bi{width:36px;height:36px} }`;
  document.head.appendChild(st);
  document.getElementById('inv-close').onclick = ()=>closeInventory();
  document.getElementById('inv-to-craft').onclick = ()=>{ closeInventory(); if(typeof openCraft==='function') openCraft(); };
})();
renderBody = function(){};
// posições soltas dentro da bolsa (fixas por espaço, como os itens jogados numa bolsa do UO)
const BAG_POS = (()=>{ const r=mulberry32(77), a=[]; for(let i=0;i<SLOTS-HOTBAR;i++){ const col=i%5, row=Math.floor(i/5); a.push([6+col*18.5+r()*6, 8+row*22+r()*6]); } return a; })();
const LEFT_SLOTS=['head','neck','cloak','body','arms'], RIGHT_SLOTS=['hands','ring','legs','feet','shield'];
function gearSlotDiv(sl){
  const s=gearOf()[sl] || (player.equip[sl]?{id:player.equip[sl],qty:1}:null), d=document.createElement('div'); d.className='pd-slot';
  const sel = invSel && slotArr(invSel.k)[invSel.i];
  if(sel && ITEMS[sel.id] && ITEMS[sel.id].wear===sl) d.classList.add('fit');
  if(s){ d.style.borderColor=rarCol(s); d.innerHTML=`<img src="${ICONS[s.id]}" alt="">`; d.title=instName(s); }
  else d.innerHTML=`<span class="k">${SLOT_NAME[sl]}</span>`;
  d.onpointerdown=e=>{ e.stopPropagation();
    if(sel && invSel.k==='inv' && ITEMS[sel.id].wear===sl){ wearSlot(invSel.i); invSel=null; renderInvPanel(); return; }
    if(s){ invSel=null; pdShow={gear:sl}; renderInvPanel(); } };
  return d;
}
let pdShow=null;
function itemDetail(s, where){
  const it=ITEMS[s.id], Wp=WEAPONS[s.id], W_=WEAR[s.id], rar=s.rar||'comum';
  let h=`<b class="rar-${rar}">${escapeHtml(instName(s))}${s.qty>1?' ×'+s.qty:''}</b><small> ${rar!=='comum'?RARITY[rar].name:''}</small>`;
  if(Wp && Wp.dmg) h+=`<div><small>${Wp.ranged?`Dano ${Wp.dmg} · alcance ${Math.round(Wp.range/T)} · usa ${ITEMS[Wp.ammo]?.name||''}`:`Dano ${Wp.dmg} · alcance ${Wp.range}`} · ${SKILL_NAMES[Wp.skill]||''}</small></div>`;
  if(W_ && W_.armor) h+=`<div><small>${SLOT_NAME[W_.slot]} · armadura ${Math.round(W_.armor*100)}%</small></div>`;
  for(const [k,v] of s.aff||[]) h+=`<div class="aff">+${v} ${statName(k)}</div>`;
  if(s.set){ const st=SETS.find(x=>x.id===s.set), have=(player.sets||{})[s.set]||0;
    if(st){ h+=`<div class="setb">Conjunto ${st.name} (${have}/${st.pieces.length} vestidas)</div>`; for(const [n,list] of Object.entries(st.bonus||{})) h+=`<div class="setb" style="opacity:${have>=+n?1:.5}">${n} peças: ${list.map(([k,v])=>'+'+v+' '+statName(k)).join(', ')}</div>`; } }
  if(s.uq){ const u=UNIQ.find(u=>u.id===s.uq); if(u&&u.lore) h+=`<div class="lore">${u.lore}</div>`; }
  if(it.desc && !s.uq) h+=`<div class="desc">${it.desc}</div>`;
  if(PRICE[s.id]) h+=`<div><small>Vale ~${Math.round(PRICE[s.id]*({comum:1,refinado:2,raro:4,conjunto:6,lendario:10}[rar]))} de ouro</small></div>`;
  return h;
}
renderInvPanel = function(){
  if(!player) return;
  document.getElementById('pd-name').textContent = player.name.toUpperCase();
  document.getElementById('pd-title').textContent = `${RACES[player.look.race||'humano'].name} · ${charTitle(player.skills)}`;
  const Lc=document.getElementById('pd-left'), Rc=document.getElementById('pd-right'); Lc.innerHTML=''; Rc.innerHTML='';
  for(const sl of LEFT_SLOTS) Lc.appendChild(gearSlotDiv(sl));
  for(const sl of RIGHT_SLOTS) Rc.appendChild(gearSlotDiv(sl));
  // o boneco
  const cv=document.getElementById('pd-cv'), g=cv.getContext('2d'); g.imageSmoothingEnabled=false; g.clearRect(0,0,cv.width,cv.height);
  g.fillStyle='rgba(0,0,0,.4)'; g.beginPath(); g.ellipse(22,47,8,2,0,0,7); g.fill();
  drawHuman(g,22,47,{face:'down',phase:0,moving:false,look:player.look,weapon:player.weapon,wAng:-1.2,head:player.equip.head,body:player.equip.body});
  const Wp=WEAPONS[player.weapon]||OW.fists;
  document.getElementById('pd-stats').innerHTML =
    `Vida <b>${Math.round(player.health)}/${player.maxHealth}</b><br>Mana <b>${Math.round(player.mana??0)}/${Math.round(player.maxMana||0)}</b><br>Fôlego <b>${Math.round(player.stamina)}/${Math.round(player.maxStamina)}</b><br>`+
    `Armadura <b>${Math.round(totalArmor()*100)}%</b><br>Arma <b>${Wp.name||'Punhos'}</b><br>Dano <b>${Math.round((Wp.dmg||5)*(1+gb('dmg_pct')/100)+gb('dmg_flat'))}</b><br>`+
    `Força <b>${gb('str')}</b> · Destreza <b>${gb('dex')}</b><br>Ouro <b>${countItem('cash')}</b>`;
  // mochila
  const bag=document.getElementById('inv-bag'); bag.innerHTML='';
  const selItem = invSel && slotArr(invSel.k)[invSel.i];
  for(let i=HOTBAR;i<SLOTS;i++){ const s=inv[i], [px,py]=BAG_POS[i-HOTBAR], d=document.createElement('div'); d.className='bi';
    d.style.left=px+'%'; d.style.top=py+'%';
    if(s){ d.innerHTML=`<img src="${ICONS[s.id]}" alt=""><span class="q">${s.qty>1?s.qty:''}</span>`; d.title=instName(s);
      if(s.rar && s.rar!=='comum') d.querySelector('img').style.filter=`drop-shadow(0 0 2px ${rarCol(s)}) drop-shadow(1px 2px 0 rgba(0,0,0,.6))`;
      if(s===player.wInst || (s.id===player.weapon && !player.wInst)) d.classList.add('eq'); }
    else if(selItem) d.classList.add('free');
    if(invSel && invSel.k==='inv' && invSel.i===i) d.classList.add('sel');
    d.onpointerdown=e=>{ e.stopPropagation(); pdShow=null; clickSlot('inv',i); };
    bag.appendChild(d); }
  const hot=document.getElementById('inv-hot'); hot.innerHTML='';
  for(let i=0;i<HOTBAR;i++){ const s=inv[i], d=document.createElement('div'); d.className='slot'+(invSel&&invSel.k==='inv'&&invSel.i===i?' sel':'')+(s&&s.id===player.weapon?' eq':'');
    d.innerHTML=slotHtml(s,(i+1)%10); if(s&&s.rar&&s.rar!=='comum') d.style.borderColor=rarCol(s); d.onpointerdown=e=>{ e.stopPropagation(); pdShow=null; clickSlot('inv',i); }; hot.appendChild(d); }
  // baú aberto
  const stw=document.getElementById('inv-store-wrap'), sa=document.getElementById('inv-store-acts'); sa.innerHTML='';
  if(openStore){ stw.style.display='block'; document.getElementById('inv-store-title').textContent=(OBJ_NAMES[openStore.type]||'BAÚ').toUpperCase();
    const el=document.getElementById('inv-store'); el.innerHTML='';
    openStore.store.forEach((s,i)=>{ const d=document.createElement('div'); d.className='slot'+(invSel&&invSel.k==='store'&&invSel.i===i?' sel':''); d.innerHTML=slotHtml(s,''); if(s&&s.rar&&s.rar!=='comum') d.style.borderColor=rarCol(s);
      d.onpointerdown=e=>{ e.stopPropagation(); pdShow=null; clickSlot('store',i); }; el.appendChild(d); });
    const b=document.createElement('button'); b.textContent='Pegar tudo'; b.onclick=()=>{ for(let i=0;i<openStore.store.length;i++) if(openStore.store[i]) moveAll('store',i,'inv',true); renderInvPanel(); }; sa.appendChild(b);
  } else stw.style.display='none';
  // detalhe
  const info=document.getElementById('inv-info'), acts=document.getElementById('inv-acts'), ic=document.getElementById('inv-icon'); acts.innerHTML=''; ic.innerHTML='';
  const btn=(t,f)=>{ const b=document.createElement('button'); b.textContent=t; b.onclick=f; acts.appendChild(b); };
  if(pdShow && pdShow.gear){ const sl=pdShow.gear, s=gearOf()[sl]||(player.equip[sl]?{id:player.equip[sl],qty:1}:null);
    if(s){ ic.innerHTML=`<img src="${ICONS[s.id]}" alt="">`; info.innerHTML=itemDetail(s); btn('Tirar', ()=>{ pdShow=null; unwear(sl); }); return; } }
  const sel = invSel && slotArr(invSel.k)[invSel.i];
  if(sel){ const it=ITEMS[sel.id]; ic.innerHTML=`<img src="${ICONS[sel.id]}" alt="">`; info.innerHTML=itemDetail(sel);
    if(invSel.k==='inv'){
      btn(it.wear ? 'Vestir' : it.weapon ? (player.weapon===sel.id?'Guardar arma':'Empunhar') : it.use ? 'Usar' : '—', ()=>{ if(it.wear||it.weapon||it.use){ useSlot(invSel.i); invSel=null; renderInvPanel(); } });
      btn('Largar', ()=>{ dropSlot(invSel.i); invSel=null; renderInvPanel(); });
      if(openStore) btn('Guardar no baú →', ()=>moveAll('inv',invSel.i,'store'));
    } else btn('← Pegar', ()=>moveAll('store',invSel.i,'inv'));
  } else info.innerHTML=`<div class="desc">Toque num item para ver; toque em outro lugar da bolsa para mover. Para vestir, toque na peça e depois no espaço do boneco (ou em “Vestir”).</div>`;
};
// mover: troca peças inteiras (não perde raridade); só empilha o que empilha
clickSlot = function(k,i){
  const arr=slotArr(k);
  if(!invSel){ if(arr[i]) invSel={k,i}; renderInvPanel(); return; }
  if(invSel.k===k && invSel.i===i){ invSel=null; renderInvPanel(); return; }
  const A=slotArr(invSel.k), a=A[invSel.i], b=arr[i], st=a?ITEMS[a.id].stack:1;
  if(b && a && b.id===a.id && st>1){ const m=Math.min(a.qty,st-b.qty); b.qty+=m; a.qty-=m; if(!a.qty) A[invSel.i]=null; }
  else { A[invSel.i]=b; arr[i]=a; }
  if(!hasItem(player.weapon) && player.weapon!=='fists'){ player.weapon='fists'; player.wInst=null; recalcGear(); }
  invSel=null; renderInvPanel(); renderHotbar();
};
// I abre a mochila (e o atalho do HUD "BAG")

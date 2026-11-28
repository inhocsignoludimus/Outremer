'use strict';
// =====================================================================
// OUTREMER — LOTE 4: HUD, janelas, molduras, barra de atalhos, mochila, paperdoll e ícones
// pintados (arte original). Módulo "encaixável": só troca a aparência — não mexe em cliques,
// arrastar-e-soltar, atalhos de teclado nem dicas. Carrega depois de lote3_cidade.js.
// =====================================================================
(function(){
const A='assets/lote4/';
const L4=window.LOTE4={ready:false,errors:[],count:0,sheets:{}};
// ---------- ícones pintados: folhas 4x4 de 48px ----------
const SHEETS=['a_armas1','b_armas2','c_ferramentas','d_elmos','e_armaduras','f_membros','g_escudos_joias','h_comida','i_pocoes','j_materiais','k_diversos','l_magias1','m_magias2'];
const K={a:'a_armas1',b:'b_armas2',c:'c_ferramentas',d:'d_elmos',e:'e_armaduras',f:'f_membros',g:'g_escudos_joias',h:'h_comida',i:'i_pocoes',j:'j_materiais',k:'k_diversos',l:'l_magias1',m:'m_magias2'};
// id do item -> "folha+índice" (índice 0..15, lido da esquerda p/ direita, de cima p/ baixo)
const MAP={
 // armas (folha A)
 dagger:'a0',kris:'a0',shortsword:'a1',arming_sword:'a1',sword:'a2',longsword:'a2',broadsword:'a3',scimitar:'a4',sabre:'a4',falchion:'a5',cutlass:'a5',cleaver:'a5',rapier:'a6',
 mace:'a7',flanged_mace:'a8',morningstar:'a9',morning_star:'a8',flail:'a9',warhammer:'a10',maul:'a11',hand_axe:'a12',axe:'a12',battleaxe:'a13',double_axe:'a13',war_axe:'a14',broadaxe:'a14',spear:'a15',
 // armas (folha B)
 halberd:'b0',glaive:'b1',pike:'b1',bardiche:'b2',lance:'b3',javelin:'b4',bow:'b5',shortbow:'b5',longbow:'b6',composite_bow:'b7',crossbow:'b8',heavy_crossbow:'b9',arbalest:'b9',hand_crossbow:'b10',
 arrows:'b11',arrow:'b11',arrow_shaft:'b11',bolts:'b12',crossbow_bolt:'b12',staff:'b13',quarterstaff:'b13',crook:'b13',fire_staff:'b14',ice_staff:'b15',
 // armas e ferramentas (folha C)
 holy_staff:'c0',wand:'c1',scepter:'c2',club:'c3',throwing_knife:'c4',scythe:'c5',war_fork:'c6',pickaxe:'c7',smith_hammer:'c8',hatchet:'c9',shovel:'c10',saw:'c11',tongs:'c12',
 fishing_pole:'c13',rod:'c13',skinning_knife:'c14',knife:'c14',lockpick:'c15',tinker_tools:'c12',
 // cabeça (folha D)
 leather_cap:'d0',leather_hood:'d0',wool_hood:'d1',padded_coif:'d1',linen_coif:'d1',chain_coif:'d2',scale_coif:'d2',nasal_helm:'d3',kettle_hat:'d4',kettle_helm:'d4',great_helm:'d5',greathelm:'d5',
 face_helm:'d6',bascinet:'d6',horned_helm:'d7',spangenhelm:'d8',wizard_hat:'d9',circlet:'d10',iron_circlet:'d10',turban:'d11',keffiyeh:'d12',bandana:'d12',straw_hat:'d13',fur_hat:'d14',bronze_helm:'d15',
 // corpo (folha E)
 gambeson:'e0',egyptian_gambeson:'e0',leather_armor:'e1',hide_tunic:'e1',studded_armor:'e2',studded_leather:'e2',chainmail:'e3',hauberk:'e3',lorigao:'e3',blackiron_hauberk:'e3',
 scale_armor:'e4',scale_hauberk:'e4',loriga:'e4',bronze_cuirass:'e4',lamellar:'e5',turkish_cuirass:'e5',brigandine:'e6',cazagante:'e6',plate:'e7',plate_torso:'e7',templar_cuirass:'e7',sergeant_cuirass:'e7',
 templar_tabard:'e8',crusader_surcoat:'e8',tabard:'e8',mage_robe:'e9',monk_robe:'e10',pilgrim_habit:'e10',cloth_shirt:'e11',linen_shirt:'e11',bedouin_robe:'e12',bedouin_vest:'e12',
 smith_apron:'e13',silk_robe:'e14',peasant_tunic:'e15',wool_tunic:'e15',villager_dress:'e15',
 // membros, capas e cinto (folha F)
 leather_gloves:'f0',linen_gloves:'f0',studded_gloves:'f0',plate_gloves:'f1',iron_gauntlets:'f1',chain_gloves:'f2',leather_boots:'f3',plate_boots:'f4',chain_boots:'f4',fur_boots:'f5',cloth_sandals:'f6',
 leather_leggings:'f7',studded_leggings:'f7',cloth_pants:'f7',linen_pants:'f7',wool_pants:'f7',bedouin_skirt:'f7',chain_greaves:'f8',mail_chausses:'f8',plate_legs:'f9',plate_arms:'f10',lamellar_sleeves:'f10',
 leather_sleeves:'f11',studded_sleeves:'f11',chain_sleeves:'f11',bedouin_sleeves:'f11',wool_cloak:'f12',travel_cloak:'f12',desert_cloak:'f12',crimson_cloak:'f13',templar_mantle:'f13',
 fur_cloak:'f14',chain_mantle:'f14',leather_belt:'f15',knight_belt:'f15',sash:'f15',
 // escudos e joias (folha G)
 wooden_shield:'g0',round_shield:'g0',buckler:'g1',kite_shield:'g2',heater_shield:'g3',crusader_shield:'g4',tower_shield:'g5',pavise:'g6',oval_shield:'g7',
 ring:'g8',gold_ring:'g8',bronze_ring:'g8',copper_ring:'g8',amber_ring:'g10',silver_ring:'g9',ruby_ring:'g10',sapphire_ring:'g10',signet_ring:'g11',
 necklace:'g12',gold_necklace:'g12',torque:'g12',silver_necklace:'g12',coral_necklace:'g14',bead_necklace:'g14',pilgrim_cross:'g13',pearl_necklace:'g14',relicary:'g15',
 // comida e cura (folha H)
 bread:'h0',flatbread:'h1',apple:'h2',cheese:'h3',dates:'h4',figs:'h4',roast:'h5',roasted_meat:'h5',meat_cooked:'h5',meat_raw:'h6',cooked_fish:'h7',fish_cooked:'h7',fish_raw:'h8',fish:'h8',
 dried_meat:'h9',berries:'h10',ale:'h11',wine:'h12',water_flask:'h13',water:'h13',bandage:'h14',greater_bandage:'h14',seaweed:'h15',
 // poções e alquimia (folha I)
 heal_potion:'i0',greater_heal_potion:'i1',mana_potion:'i2',poison_potion:'i3',refresh_potion:'i4',greater_refresh_potion:'i4',cure_potion:'i5',greater_cure_potion:'i5',strength_potion:'i6',
 agility_potion:'i7',night_sight_potion:'i7',empty_bottle:'i8',bottle:'i8',incense:'i9',myrrh:'i10',saltpeter:'i11',quicklime:'i12',candle:'i13',mortar_pestle:'i14',msg_bottle:'i15',vidro_raio:'i5',
 // materiais (folha J)
 logs:'j0',oak_logs:'j0',cedar_logs:'j0',boards:'j1',planks:'j1',oak_boards:'j1',cedar_boards:'j1',iron_ore:'j2',blackiron_ore:'j2',copper_ore:'j3',silver_ore:'j4',gold_ore:'j5',
 iron_ingot:'j6',copper_ingot:'j7',bronze_ingot:'j7',silver_ingot:'j8',gold_ingot:'j9',blackiron_ingot:'j10',gem:'j11',stone:'j12',
 hide:'j13',leather_hide:'j13',cut_leather:'j13',thick_leather:'j13',wyrm_hide:'j13',fur_bundle:'j13',cloth:'j14',cloth_bolt:'j14',linen_bolt:'j14',silk_bolt:'j14',wool_bolt:'j14',feather:'j15',scribe_pen:'j15',
 // diversos (folha K)
 cash:'k0',gold_coin:'k1',gold:'k2',
 deed_plains_cabin:'k5',deed_smithy:'k5',deed_forest_hut:'k5',deed_market_stall:'k5',stable_horse:'k5',lantern:'k8',bone:'k9',wooden_chest:'k10',barrel:'k11',crate:'k12',anvil:'k13',lute:'k14',
 sewing_kit:'k15',fletching_kit:'k15',scissors:'k15',bookshelf:'k4',small_forge:'k13',scarf:'d12',old_boot:'f3',
 // habilidades de arma (folha M)
 ab_whirlwind_strike:'m0',ab_charge:'m1',ab_multishot:'m2',ab_piercing_arrow:'m3',ab_stun_blow:'m4',ab_long_thrust:'m5',ab_heavy_blow:'m6',
};
// magias -> ícones de runa (folhas L e M)
const SP={minor_mend:'l0',spark_dart:'l3',night_eye:'l6',soft_hide:'l4',loose_grip:'l14',dull_wit:'l8',slack_limb:'l8',pilgrim_loaf:'l7',firm_step:'m1',clear_mind:'l9',salt_wash:'m11',
 open_palm:'m4',sinew_gift:'m6',ward_skin:'l4',linen_wrap:'l0',ember_touch:'l1',three_gifts:'l9',naphtha_ball:'l1',resin_sting:'l5',side_step:'m5',lime_curtain:'m14',frost_pinch:'l2',
 pilgrim_ward:'l4',dust_blind:'l13',choir_cleanse:'l9',host_aegis:'l4',four_weights:'l8',saltfire_line:'l1',deep_mend:'l0',storm_nail:'l3',breath_siphon:'m7',shrine_step:'l10',
 blade_djinn:'m9',tear_curtain:'l10',mirror_oath:'m8',cold_mind:'l2',lime_bind:'l14',resin_mire:'l5',call_jackal:'l11',anoint_edge:'m0',unweave:'l8',glass_bolt:'m13',kiln_burst:'m12',
 myrrh_veil:'m14',nail_place:'l14',crowd_malison:'l8',white_cage:'l14',strip_veil:'l6',nail_chain:'l14',salt_bars:'l14',naphtha_pillar:'m12',two_sands_door:'m15',drink_lamp:'m7',
 scatter_called:'l13',falling_stars:'l15',clay_shape:'l12',split_ground:'l12',labyrinth_rush:'m1',raise_fallen:'m10',call_kiln:'m12',call_quarry:'l12',call_simoom:'l13',call_cistern:'m11',eighth_seal:'l9'};
for(const [k,v] of Object.entries(SP)) MAP['sp_'+k]=v;
L4.MAP=MAP;
const URLS={};   // "a0" -> dataURL
function cutSheets(done){
  let left=SHEETS.length;
  SHEETS.forEach(n=>{ const im=new Image(); im.onload=()=>{ try{
      const key=Object.keys(K).find(k=>K[k]===n);
      for(let i=0;i<16;i++){ const c=document.createElement('canvas'); c.width=48; c.height=48; c.getContext('2d').drawImage(im,(i%4)*48,(i>>2)*48,48,48,0,0,48,48); URLS[key+i]=c.toDataURL(); }
      L4.sheets[n]=true; }catch(e){ L4.errors.push(n+': '+e.message); } if(--left===0) done(); };
    im.onerror=()=>{ L4.errors.push('falhou '+n); if(--left===0) done(); }; im.src=A+'icons_'+n+'.png'; });
}
function applyIcons(){
  if(typeof ICONS==='undefined') return;
  let n=0;
  for(const [id,ref] of Object.entries(MAP)){
    if(typeof ITEMS!=='undefined' && !ITEMS[id]) continue;
    const url=URLS[ref]; if(!url) continue;
    try{ Object.defineProperty(ICONS,id,{configurable:true,enumerable:true,get:()=>url,set:()=>{}}); n++; }catch(e){ L4.errors.push('icon '+id); }
    try{ if(typeof ICON_IMG!=='undefined') delete ICON_IMG[id]; }catch(e){}
  }
  L4.count=n;
  // redesenha o que já está na tela
  try{ if(typeof renderHotbar==='function') renderHotbar(); }catch(e){}
  try{ if(typeof invOpen!=='undefined' && invOpen && typeof renderInvPanel==='function') renderInvPanel(); }catch(e){}
  try{ const bp=document.getElementById('book-panel'); if(bp && bp.style.display!=='none' && window.renderBook) renderBook(); }catch(e){}
  try{ if(typeof craftOpen!=='undefined' && craftOpen && typeof renderCraft==='function') renderCraft(); }catch(e){}
}
// ---------- mochila da HUD (canto de baixo à direita): arte nova em 2x, mesma área de itens ----------
function upgradeBag(){
  const gump=document.getElementById('bag-gump'); if(!gump) return setTimeout(upgradeBag,400);
  const cv=gump.querySelector('canvas'); if(!cv||cv.dataset.l4) return; cv.dataset.l4=1;
  const BW=108, BH=88, SC=3, bag=new Image(); bag.src=A+'ui/mochila_3x.png';
  cv.width=BW*SC; cv.height=BH*SC;
  const g=cv.getContext('2d'); g.setTransform(SC,0,0,SC,0,0); g.imageSmoothingEnabled=true; g.imageSmoothingQuality='high';
  const orig=g.drawImage, origText=g.fillText;
  g.drawImage=function(img){ // a arte antiga (canvas 108x88 desenhado em 0,0) vira a mochila de couro pintada
    if(img && img.tagName==='CANVAS' && img.width===BW && img.height===BH && arguments.length===3){ if(bag.complete&&bag.naturalWidth) return orig.call(this,bag,0,0,BW,BH); }
    return orig.apply(this,arguments); };
  // números de quantidade: fonte da HUD, com contorno, legíveis em cima do couro
  g.fillText=function(t,x,y){ if(/monospace/.test(this.font)){ const f=this.font; const big=/7px/.test(f);
      if(this.fillStyle==='#000000'){ return; }
      this.save(); this.font=(big?'600 7px':'600 7px')+" 'Pixelify Sans',sans-serif"; const fs=this.fillStyle;
      this.fillStyle='rgba(8,5,2,.95)'; for(const [dx,dy] of [[-.5,0],[.5,0],[0,-.5],[0,.5],[.5,.5]]) origText.call(this,t,x+dx,y+dy);
      this.fillStyle=fs; origText.call(this,t,x,y); this.restore(); return; }
    return origText.apply(this,arguments); };
  bag.onload=()=>{ try{ renderHotbar(); }catch(e){} };
}
// ---------- paperdoll: herói do Lote 2 (camadas personalizadas) em tamanho grande ----------
function upgradeDoll(){
  if(typeof renderInvPanel!=='function' || typeof drawPlayer!=='function') return;
  const _r=renderInvPanel;
  renderInvPanel=function(){ const out=_r.apply(this,arguments); try{ drawHero(); }catch(e){ L4.errors.push('doll: '+e.message); } return out; };
}
function drawHero(){
  const pc=document.getElementById('pd-cv'); if(!pc||typeof player==='undefined'||!player) return;
  let hc=document.getElementById('pd-hero');
  if(!hc){ hc=document.createElement('canvas'); hc.id='pd-hero'; hc.width=176; hc.height=208; pc.parentElement.insertBefore(hc,pc); }
  const off=document.createElement('canvas'); off.width=176; off.height=208; const g=off.getContext('2d'); g.imageSmoothingEnabled=false;
  const sv={face:player.face,aim:player.aimAng,atk:player.atkT,hurt:player.hurtT};
  // o Lote 2 desliga o herói em camadas enquanto a mochila está aberta; liga só durante este desenho
  const io=(typeof invOpen!=='undefined')?invOpen:undefined;
  try{ if(io!==undefined) invOpen=false; player.face='down'; player.aimAng=Math.PI/2; player.atkT=0; player.hurtT=0; g.save(); g.scale(6,6); drawPlayer(g,14.7,33.5); g.restore(); }
  finally{ if(io!==undefined) invOpen=io; player.face=sv.face; player.aimAng=sv.aim; player.atkT=sv.atk; player.hurtT=sv.hurt; }
  // só troca o boneco antigo se o herói novo saiu desenhado de verdade
  let n=0; try{ const d=g.getImageData(0,0,176,208).data; for(let i=3;i<d.length;i+=16) if(d[i]) n++; }catch(e){ n=200; }
  if(n<120){ hc.style.display='none'; pc.style.display=''; return; }
  const h=hc.getContext('2d'); h.imageSmoothingEnabled=false; h.clearRect(0,0,176,208); h.drawImage(off,0,0);
  hc.style.display=''; pc.style.display='none';
}
// ---------- estilos ----------
const css=document.createElement('style'); css.id='lote4-css'; css.textContent=`
:root{--l4-brass:#c9a35a;--l4-brass-d:#7a5a28;--l4-ink:#2a1a0c;--l4-gold:#f0c878}
/* painéis da HUD: couro escuro costurado + moldura de ferro e latão com cantos fundidos */
#hud #stats.panel,#hud #hotbar.panel,#journal,#hud #skills-panel.panel{background:linear-gradient(rgba(26,17,9,.30),rgba(12,8,4,.55)),url(${A}ui/couro.png) 0 0/128px repeat!important;
  border:10px solid transparent!important;border-image:url(${A}ui/moldura.png) 22 round!important;border-radius:0!important;box-shadow:0 3px 8px rgba(0,0,0,.55)!important;background-clip:padding-box!important}
#hud #clock.panel{background:url(${A}ui/pergaminho.png) 0 0/170px repeat!important;border:10px solid transparent!important;border-image:url(${A}ui/moldura.png) 22 round!important;border-radius:0!important;
  box-shadow:0 3px 8px rgba(0,0,0,.55),inset 0 0 18px rgba(120,80,30,.35)!important;background-clip:padding-box!important;color:#2a1a0c!important}
#hud #stats{width:256px!important;padding:2px 6px 4px 4px!important}
#journal{padding:2px 4px 4px!important}
#hud #skills-panel{padding:4px 8px 6px!important;width:214px!important;color:#ecdcbc;text-shadow:1px 1px 0 #000}
#hud #skills-panel>div:first-child{font-family:'Cinzel',serif;font-weight:700;color:var(--l4-gold)!important;border-bottom:1px solid rgba(201,163,90,.45);padding-bottom:3px}
#hud #skills-panel b{color:#fff1d0}
#hud #clock{padding:2px 6px 4px!important}
#clock #clock-day,#clock #clock-time{font-family:'Cinzel',serif;font-weight:700;color:#3a220e}
#clock small{color:#5a3e1e!important} #clock #clock-place{color:#7a2a10!important}
/* alça de arrastar / minimizar */
#bag-gump .hw-bar .hw-grip{border:none!important}
.hw-bar .hw-grip{border-top:2px dotted rgba(201,163,90,.65)!important;border-bottom:2px dotted rgba(201,163,90,.65)!important}
#clock .hw-bar .hw-grip{border-color:rgba(90,58,24,.6)!important}
#clock.hw-min .hw-bar::before{color:#2a1a0c!important;font-family:'Cinzel',serif;font-weight:700;text-shadow:0 1px 0 rgba(255,240,200,.55)!important}
.hw-bar button{background:linear-gradient(#4a3420,#24170c)!important;border:1px solid var(--l4-brass)!important;color:var(--l4-gold)!important;border-radius:2px!important}
.hw-min{background-clip:padding-box!important}
/* nome, retrato e barras esculpidas */
#who{font-family:'Cinzel',serif!important;color:var(--l4-gold)!important;text-shadow:1px 1px 0 #000,0 0 6px rgba(240,180,80,.25)}
#who small{color:#d2bf98!important;white-space:normal!important;line-height:1.2;margin-top:1px}
#hud-portrait{width:54px!important;height:62px!important;border:5px solid transparent!important;border-image:url(${A}ui/slot.png) 12 stretch!important;border-radius:0!important;
  background:radial-gradient(ellipse at 50% 35%,#5a4428,#1a120a 75%)!important;background-clip:padding-box!important;box-sizing:content-box}
#hud .stat{color:#e6d4ae!important;font-size:10px!important;letter-spacing:1.5px;text-shadow:1px 1px 0 #000;margin-top:2px!important}
#hud #stats .bar{height:16px!important;border:4px solid transparent!important;border-left-width:11px!important;border-right-width:11px!important;border-image:url(${A}ui/barra.png) 12 31 fill stretch!important;
  background:#0c0806!important;background-clip:padding-box!important;border-radius:0!important;margin-left:-6px;margin-right:-6px;overflow:hidden}
#hud #stats .bar>div{box-shadow:inset 0 1px 0 rgba(255,255,255,.35),inset 0 -2px 0 rgba(0,0,0,.35)}
#weap{color:#e2cfa6!important;border-top:1px solid rgba(201,163,90,.35)!important;text-shadow:1px 1px 0 #000}
#weap b{color:#fff1d0!important}
#conds{text-shadow:1px 1px 0 #000}
/* botões da HUD e das janelas: plaquinhas de madeira com cantos de latão */
#clock .hudbtns{max-width:262px!important;gap:3px!important}
#clock .hudbtns button,.gpanel .ghead button,.gpanel .tabs .tab,#inv-acts button,.craft-row button,#inv-store-acts button,#map-ui button,#act-list button{
  border:4px solid transparent!important;border-image:url(${A}ui/plaquinha.png) 10 fill stretch!important;background:none!important;color:#f6e6c4!important;text-shadow:1px 1px 0 #000;border-radius:0!important}
#clock .hudbtns button{font-size:10px!important;padding:1px 3px!important;line-height:1.25;margin-top:0!important}
.gpanel .ghead button,.gpanel .tabs .tab{padding:1px 6px!important}
.gpanel .tabs .tab.on,#clock .hudbtns button:hover,.gpanel .ghead button:hover,.craft-row button:not(:disabled):hover,#inv-acts button:hover{filter:brightness(1.35) saturate(1.15);color:#ffe7a8!important}
body.building #clock .hudbtns #btn-build{filter:brightness(1.5) sepia(.4);color:#fff!important}
/* barra de atalhos: encaixes de ferro rebitado */
#hud #hotbar{padding:3px 4px!important;gap:3px!important}
#hotbar .slot,#inv-hot .slot,#inv-store .slot,.grid .slot{background:url(${A}ui/slot.png) 0 0/100% 100% no-repeat!important;border-color:transparent!important}
#hotbar .slot.lit,.grid .slot.lit{border-color:#f0b850!important;box-shadow:0 0 10px #f0b85099,inset 0 0 6px #f0b85066!important}
#hotbar .slot.eq,.grid .slot.eq{border-color:#cfdbe2!important;box-shadow:inset 0 0 0 1px #cfdbe255!important}
#hotbar .slot.sel,.grid .slot.sel{border-color:#f0b850!important;box-shadow:0 0 8px #f0b85088!important}
.slot img{width:80%!important;height:80%!important;image-rendering:auto!important;filter:drop-shadow(1px 1px 0 rgba(0,0,0,.7))}
.slot .k{color:#c9a35a!important;text-shadow:1px 1px 0 #000;left:4px!important;top:2px!important;font-size:9px!important}
.slot .q{color:#fff4dc!important;text-shadow:1px 1px 0 #000,-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000!important;right:4px!important;bottom:1px!important}
/* diário/chat */
#jr-log{background:rgba(10,7,4,.55)!important;border:1px solid rgba(201,163,90,.45)!important;box-shadow:inset 0 0 8px rgba(0,0,0,.6)}
#jr-tabs button{background:linear-gradient(#3e2c1a,#22170c)!important;border-color:#7a5a28!important;color:#d8c6a0!important}
#jr-tabs button.on{background:linear-gradient(#6a4a26,#3a2814)!important;color:#ffe7a8!important}
#jr-in input{background:#0e0a06!important;border-color:#7a5a28!important;color:#f4e6c8!important}
#jr-in select{background:#2a1c10!important;border-color:#7a5a28!important;color:var(--l4-gold)!important}
/* aba "Esconder janelas" */
#hud-toggle{background:linear-gradient(90deg,#2e2012,#4a3420 50%,#2e2012)!important;border:2px solid var(--l4-brass)!important;color:var(--l4-gold)!important;font-family:'Cinzel',serif!important;
  font-weight:700!important;letter-spacing:1px;text-shadow:1px 1px 0 #000;box-shadow:0 0 0 1px #000,0 2px 6px rgba(0,0,0,.6)!important;border-radius:3px!important}
.toast{background:linear-gradient(rgba(30,20,10,.92),rgba(16,10,5,.92))!important;border:1px solid var(--l4-brass-d)!important;box-shadow:inset 0 0 0 1px rgba(0,0,0,.6);color:#f4e6c8;text-shadow:1px 1px 0 #000}
#bag-tip{background:url(${A}ui/pergaminho.png) 0 0/120px!important;color:#2a1a0c!important;border:1px solid #7a5a28!important;font-family:'Cinzel',serif;font-weight:700;padding:2px 6px!important}
#bag-gump .hw-bar{height:30px!important}
/* janelas (Personagem, Magias, Fabricar, Lojas, Diálogo, Baú...) */
.gpanel:not(#menu-panel) > .gbox,#menu-panel .gbox{background:linear-gradient(rgba(24,16,8,.25),rgba(10,6,3,.5)),url(${A}ui/couro.png) 0 0/128px repeat!important;
  border:12px solid transparent!important;border-image:url(${A}ui/moldura.png) 22 round!important;background-clip:padding-box!important;box-shadow:0 8px 24px rgba(0,0,0,.7)!important}
.gpanel .ghead{background:linear-gradient(#5a3e22,#2e1e10)!important;border-bottom:2px solid var(--l4-brass-d)!important;box-shadow:inset 0 1px 0 rgba(255,220,150,.25),0 1px 0 #000}
.gpanel .ghead b{color:var(--l4-gold)!important;text-shadow:1px 1px 0 #000,0 0 8px rgba(240,180,80,.3);letter-spacing:1.5px}
.glabel{color:#d8b878!important;font-family:'Cinzel',serif;font-weight:700;text-shadow:1px 1px 0 #000;letter-spacing:1.5px}
.glabel small{color:#a89070!important;font-family:var(--ui)}
#inv-detail{border-top:1px solid rgba(201,163,90,.35)!important}
#inv-info{color:#ecdcbc!important} #inv-icon img{image-rendering:auto!important}
/* Personagem / paperdoll */
#inv-panel .gbox{width:min(800px,98vw)!important}
#inv-panel .gbox:has(#inv-store-wrap[style*="block"]){width:min(1000px,98vw)!important}
.pd-doll{background:linear-gradient(rgba(14,9,4,.55),rgba(14,9,4,.75)),url(${A}ui/couro.png) 0 0/128px!important;border:2px solid var(--l4-brass-d)!important;box-shadow:inset 0 0 0 1px #000,inset 0 0 14px rgba(0,0,0,.7)!important}
.pd-title{font-family:'Cinzel',serif;font-weight:700;color:var(--l4-gold)!important;text-shadow:1px 1px 0 #000}
.pd-frame{background:linear-gradient(rgba(0,0,0,.05),rgba(0,0,0,.25)),url(${A}ui/paperdoll_fundo.jpg) center 40%/cover no-repeat!important;border:8px solid transparent!important;
  border-image:url(${A}ui/moldura.png) 22 round!important;padding:4px!important}
#pd-cv,#pd-hero{filter:drop-shadow(0 6px 4px rgba(0,0,0,.65))}
#pd-hero{width:176px;height:208px;image-rendering:pixelated}
@media (max-width:760px){ #pd-hero{width:132px;height:156px} }
.pd-slot{background:url(${A}ui/slot.png) 0 0/100% 100% no-repeat!important;border-color:transparent}
.pd-slot.fit{border-color:#7ac070!important}
.pd-slot img{width:84%!important;height:84%!important;image-rendering:auto!important;filter:drop-shadow(1px 1px 0 rgba(0,0,0,.7))}
.pd-slot .k{color:#cdb88e!important;font-size:8px!important;top:auto!important;bottom:3px;left:0!important;right:0;text-align:center;text-shadow:1px 1px 0 #000;letter-spacing:.3px}
.pd-stats{color:#e4d2ae!important}.pd-stats b{color:#fff1d0!important}
.pd-bag{background:none!important;border:none!important;box-shadow:none!important;border-radius:0!important;margin:62px 26px 24px;isolation:isolate}
.pd-bag:before{content:''!important;position:absolute!important;left:-9%!important;right:-9%!important;top:-27%!important;bottom:-9%!important;height:auto!important;border:none!important;border-radius:0!important;
  background:url(${A}ui/mochila_3x.png) center/100% 100% no-repeat!important;z-index:-1;pointer-events:none;filter:drop-shadow(0 4px 6px rgba(0,0,0,.6))}
.pd-bag .bi img{image-rendering:auto!important;filter:drop-shadow(1px 2px 0 rgba(0,0,0,.65))}
.pd-bag .bi .q{text-shadow:1px 1px 0 #000,-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000!important}
/* livro de magias: páginas de pergaminho */
#book-panel .bk-list{background:url(${A}ui/pergaminho.png) 0 0/220px repeat;padding:8px;border:2px solid #6a4a22;box-shadow:inset 0 0 22px rgba(110,70,20,.45)}
#book-panel .bk-c{color:#6a240c!important;font-family:'Cinzel',serif;font-weight:700;border-bottom:1px solid rgba(106,60,20,.55)!important}
#book-panel .bk-s{background:rgba(255,248,226,.35)!important;border:1px solid rgba(106,70,30,.55)!important}
#book-panel .bk-s:hover{border-color:#6a240c!important;background:rgba(255,248,226,.6)!important}
#book-panel .bk-s b{color:#2a1608!important}#book-panel .bk-s b small{color:#5a3a18!important}
#book-panel .bk-s small{color:#4a3418!important}
#book-panel .bk-s img{width:34px!important;height:34px!important;image-rendering:auto!important;box-shadow:0 1px 2px rgba(0,0,0,.5)}
#book-panel .bk-note{color:#e2cfa6!important}
/* fabricar e lojas */
.craft-row{border-bottom:1px solid rgba(201,163,90,.22)!important}
.craft-row img,.trow img{image-rendering:auto!important;filter:drop-shadow(1px 1px 0 rgba(0,0,0,.7))}
.craft-row img{width:34px!important;height:34px!important}
.ing img{image-rendering:auto!important}
@media (max-width:760px),(max-height:520px){
  #hud #stats.panel,#hud #hotbar.panel,#journal,#hud #clock.panel{border-width:7px!important}
  #hud #stats{width:178px!important} #hud #stats .bar{height:12px!important;border-width:3px 8px!important}
  .gpanel:not(#menu-panel) > .gbox{border-width:8px!important}
}`;
document.head.appendChild(css);
// ---------- liga tudo ----------
try{ upgradeBag(); }catch(e){ L4.errors.push('bag: '+e.message); }
try{ upgradeDoll(); }catch(e){ L4.errors.push('doll: '+e.message); }
cutSheets(()=>{ try{ applyIcons(); }catch(e){ L4.errors.push('apply: '+e.message); } L4.ready=true; console.log('[lote4] HUD medieval pronta: '+L4.count+' ícones pintados'+(L4.errors.length?' · erros: '+L4.errors.join(', '):'')); });
// ícones criados depois (ex.: magia nova aprendida) também usam a arte nova
setTimeout(()=>{ try{ applyIcons(); }catch(e){} },4000);
})();

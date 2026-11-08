'use strict';
// =====================================================================
// OUTREMER — interface "Estilo UO" (escolha no menu de Opções ou no Esc):
// tela do jogo emoldurada, diário de pergaminho à esquerda, minimapa e botões à direita,
// paperdoll com HELP/OPÇÕES/SKILLS/GUILDA/GUERRA/STATUS, barra de status e magias embaixo,
// mochila e baú como bolsas. Modo Guerra/Paz como no UO.
// =====================================================================
const UIK='outremer_ui';
let uiMode=(()=>{ try{ return localStorage.getItem(UIK)||'classic'; }catch(e){ return 'classic'; } })();
const UO_L=232, UO_R=262, UO_B=150;
let uoRect={x:0,y:0,w:innerWidth,h:innerHeight}, warMode=true;
(function(){
  const css=document.createElement('style'); css.textContent=`
  body.uo{background:#0a0806}
  body.uo #stats, body.uo #clock{display:none!important}
  body.uo canvas#game{border:3px solid #6a5434;box-shadow:0 0 0 2px #1a120a,inset 0 0 0 1px #000}
  body.uo #toasts{top:8px;left:${UO_L}px!important;right:${UO_R}px;transform:none!important;width:auto!important}
  body.uo #journal{left:0!important;top:0!important;bottom:0!important;width:${UO_L-6}px!important;display:flex!important;flex-direction:column;background:linear-gradient(90deg,#d8c8a0,#e8dcc0 30%,#d0bc94);border:3px solid #6a5030;border-radius:4px;padding:26px 6px 6px}
  body.uo #journal:before{content:'DIÁRIO';position:absolute;top:4px;left:8px;font-family:'Cinzel',serif;color:#5a3a1a;font-size:14px;font-weight:700}
  body.uo #jr-log{flex:1;height:auto!important;background:transparent!important;border:none!important;color:#2a1e12}
  body.uo #jr-log div{text-shadow:none!important}
  body.uo .jr-local{color:#2a1e12}.uo .jr-global{color:#7a3a10}.uo .jr-guild{color:#1a6a1a}.uo .jr-whisper{color:#6a1a7a}.uo .jr-system{color:#3a4a6a}
  body.uo #jr-tabs{order:3;flex-wrap:wrap}body.uo #jr-tabs button{background:#3a2a1a;color:#e8dcc0;border-color:#6a5030;border-radius:0 0 3px 3px;border-top:none}
  body.uo #jr-in input{background:#f0e6d0;color:#2a1e12;border-color:#8a6a40}
  body.uo #jr-min{display:none}
  body.uo #hotbar{left:${UO_L+228}px!important;right:${UO_R+138}px;bottom:8px!important;transform:none!important;flex-wrap:wrap;width:auto;max-width:300px;background:#2a2016!important}
  body.uo #hotbar .slot{width:40px!important;height:40px!important}
  body.uo #build-info{bottom:${UO_B+4}px!important}
  #uo-panel{display:none} body.uo #uo-panel{display:block;position:fixed;inset:0;pointer-events:none;z-index:52}
  #uo-panel .uo-box{position:absolute;pointer-events:auto;background:linear-gradient(#2a2016,#1a140e);border:3px solid #6a5434;box-shadow:0 0 0 1px #000;border-radius:3px;color:#e8dcc0;font-size:12px}
  #uo-mini{right:4px;top:4px;width:${UO_R-12}px;height:150px;padding:0;overflow:hidden}
  #uo-mini canvas{width:100%;height:100%;image-rendering:pixelated;display:block}
  #uo-mini .loc{position:absolute;left:4px;top:3px;font-size:11px;color:#fff;text-shadow:1px 1px 0 #000}
  #uo-macros{right:4px;top:162px;width:${UO_R-12}px;padding:5px;display:grid;grid-template-columns:repeat(3,1fr);gap:3px}
  #uo-macros button{background:linear-gradient(#4a5a8a,#2a3a6a);border:1px solid #8a9ac8;color:#fff;font-size:10px;padding:4px 2px;cursor:pointer;border-radius:2px}
  #uo-doll{right:4px;bottom:4px;width:${UO_R-12}px;height:calc(100vh - 290px);min-height:240px;display:flex;background:radial-gradient(#3a3a5a,#141420)!important}
  #uo-doll canvas{width:150px;height:191px;align-self:center;image-rendering:pixelated;cursor:pointer}
  #uo-doll .btns{display:flex;flex-direction:column;gap:3px;padding:6px 4px;width:78px}
  #uo-doll .btns button{background:linear-gradient(#5a6aa8,#2a3a78);border:1px solid #aab8e8;color:#fff;font-size:10px;padding:3px 2px;cursor:pointer;border-radius:8px;font-family:'Cinzel',serif}
  #uo-doll .btns button.war{background:linear-gradient(#a83a2a,#6a1a10);border-color:#e8a090}
  #uo-doll .ttl{position:absolute;bottom:4px;left:6px;right:84px;font-size:10px;color:#e8c070;text-align:center;font-family:'Cinzel',serif;text-shadow:1px 1px 0 #000}
  #uo-status{left:${UO_L}px;bottom:4px;width:220px;height:${UO_B-12}px;padding:6px;background:linear-gradient(#e8dcc0,#c8b890)!important;color:#2a1e12!important;border-color:#6a5030!important}
  #uo-status b{font-family:'Cinzel',serif;font-size:13px;display:block;text-align:center;color:#3a1a0a}
  #uo-status .row{display:flex;align-items:center;gap:4px;margin:2px 0;font-size:10px}#uo-status .bar{flex:1;height:7px;background:#3a2a1a;border:1px solid #6a5030}#uo-status .bar i{display:block;height:100%}
  #uo-status .st{display:grid;grid-template-columns:1fr 1fr;gap:0 8px;font-size:10px;margin-top:3px}
  #uo-bags{right:${UO_R}px;bottom:4px;width:130px;height:${UO_B-12}px;display:flex;align-items:flex-end;justify-content:space-around;background:none!important;border:none!important;box-shadow:none!important}
  #uo-bags div{cursor:pointer;text-align:center;font-size:10px;color:#e8dcc0;text-shadow:1px 1px 0 #000}
  #uo-bags canvas{width:56px;height:56px;image-rendering:pixelated;display:block}
  #uo-war{position:absolute;left:50%;transform:translateX(-50%);top:4px;font-family:'Cinzel',serif;font-size:12px;color:#ff8070;text-shadow:1px 1px 0 #000;display:none}
  body.uo.playing #uo-war{display:block}
  body.uo2 #uo-panel{display:block;position:fixed;inset:0;pointer-events:none;z-index:52}
  body.uo2 #stats, body.uo2 #clock{display:none!important}
  body.uo #toasts, body.uo2 #toasts{display:none!important}
  @media (max-width:700px){ #toasts{top:4px!important} }
  body.uo2 #uo-mini{width:150px!important;height:150px!important;border-radius:50%!important;border:5px solid #b8a070!important;box-shadow:0 0 0 2px #3a2a14,0 0 0 6px #6a5434,0 4px 10px #000!important;right:14px!important;top:14px!important}
  body.uo2 #uo-mini .loc{top:auto;bottom:-22px;left:0;right:0;text-align:center;font-size:12px}
  body.uo2 #uo-mini:after{content:attr(data-xy);position:absolute;left:0;right:0;bottom:6px;text-align:center;color:#fff;font-size:11px;text-shadow:1px 1px 0 #000}
  body.uo2 #uo-doll{top:190px!important;right:14px!important;bottom:auto!important;width:250px!important;height:280px!important;min-height:0!important;border:4px solid #8a8a90!important;border-radius:14px!important;background:linear-gradient(#5a5a62,#2a2a32)!important}
  body.uo2 #uo-doll canvas{width:130px;height:166px;background:radial-gradient(#3a3a4a,#101018);border:3px solid #1a1a22;margin:8px 0 34px 8px}
  body.uo2 #uo-doll .ttl{background:#c8bca0;color:#2a1e12;border:2px solid #6a5a40;bottom:6px;left:8px;right:8px;text-shadow:none;padding:2px}
  body.uo2 #uo-status{left:50%!important;transform:translateX(-50%);bottom:64px!important;width:190px!important;height:auto!important;padding:3px 8px!important;border-radius:10px!important;background:linear-gradient(#4a4a5a,#2a2a3a)!important;color:#e8e8f0!important;border-color:#8a8aa0!important}
  body.uo2 #uo-status b{color:#e8e8f0;font-size:11px;text-align:left}
  body.uo2 #uo-status .st{display:none}
  body.uo2 #uo-macros{display:none;top:auto!important;bottom:110px!important;right:auto!important;left:14px!important;width:220px!important;z-index:5}
  body.uo2.cmds #uo-macros{display:grid}
  body.uo2 #uo-bags{display:none}
  #uo-pack,#uo-wbtn,#uo-cmd{display:none}
  body.uo2 #uo-pack{display:block;left:150px;bottom:14px;width:190px;height:150px;cursor:pointer;background:none!important;border:none!important;box-shadow:none!important}
  body.uo2 #uo-pack canvas{width:190px;height:150px;image-rendering:pixelated}
  body.uo2 #uo-wbtn,body.uo2 #uo-cmd{display:block;left:14px;width:120px;text-align:center;font-family:'Cinzel',serif;font-size:15px;padding:6px;cursor:pointer;border-radius:8px!important}
  body.uo2 #uo-wbtn{bottom:14px;background:linear-gradient(#c84a3a,#7a1a10)!important;border:3px solid #e8c070!important;color:#fff!important}
  body.uo2 #uo-wbtn.peace{background:linear-gradient(#4a6aa8,#1a2a6a)!important}
  body.uo2 #uo-cmd{bottom:62px;background:linear-gradient(#c8bca0,#8a7a5a)!important;border:3px solid #4a3a20!important;color:#2a1e12!important;font-size:13px}
  body.uo2 #journal{width:300px!important;top:10px!important;bottom:auto!important;left:10px!important}
  body.uo2 #jr-log{height:90px!important;background:rgba(0,0,0,.35)!important;border:none!important}
  @media (max-width:760px){ body.uo2 #uo-doll{transform:scale(.7);transform-origin:top right} body.uo2 #uo-mini{width:100px!important;height:100px!important} body.uo2 #uo-pack{left:140px;transform:scale(.75);transform-origin:bottom left} body.uo2 #uo-doll{top:130px!important} }`;
  document.head.appendChild(css);
  const p=document.createElement('div'); p.id='uo-panel';
  p.innerHTML=`<div class="uo-box" id="uo-mini"><canvas width="125" height="75"></canvas><span class="loc"></span></div>
  <div class="uo-box" id="uo-macros"></div>
  <div class="uo-box" id="uo-doll"><canvas width="44" height="56" title="Abrir paperdoll e mochila (I)"></canvas><div class="btns"></div><div class="ttl"></div></div>
  <div class="uo-box" id="uo-status"></div>
  <div class="uo-box" id="uo-bags"></div>
  <div class="uo-box" id="uo-pack" title="Mochila (I)"><canvas width="95" height="75"></canvas></div>
  <div class="uo-box" id="uo-cmd">Comandos</div><div class="uo-box" id="uo-wbtn">GUERRA</div>`;
  document.getElementById('hud').appendChild(p);
  const mac=document.getElementById('uo-macros');
  for(const [t,f] of [['Magias',()=>toggleBook()],['Skills',()=>dispatchEvent(new KeyboardEvent('keydown',{key:'k'}))],['Mapa',()=>toggleMap(true)],
    ['Construir',()=>toggleBuild()],['Fabricar',()=>openCraft()],['Online',()=>toggleOnline()],['Montar',()=>dispatchEvent(new KeyboardEvent('keydown',{key:'x'}))],['Esperar',()=>skipTime()],['Salvar',()=>saveGame()]]){
    const b=document.createElement('button'); b.textContent=t; b.onclick=()=>{ if(running) f(); }; mac.appendChild(b); }
  const bt=document.querySelector('#uo-doll .btns');
  for(const [t,f,cls] of [['AJUDA',()=>toast('WASD anda · clique ataca (Guerra) · Espaço ataca o mais perto · E usa/fala · I mochila · L magias · K skills · M mapa · B construir · C fabricar · X montar · O online · Enter fala')],
    ['OPÇÕES',()=>openMenu()],['SALVAR',()=>saveGame()],['CONTRATOS',()=>showRep()],['SKILLS',()=>dispatchEvent(new KeyboardEvent('keydown',{key:'k'}))],['GUILDA',()=>toggleOnline()],
    ['GUERRA',()=>toggleWar(),'war'],['STATUS',()=>openInventory()]]){ const b=document.createElement('button'); b.textContent=t; if(cls) b.className=cls; b.onclick=()=>{ if(running) f(); }; bt.appendChild(b); }
  document.querySelector('#uo-doll canvas').onclick=()=>{ if(running) openInventory(); };
  const bags=document.getElementById('uo-bags');
  const bag=(label,col,fn)=>{ const d=document.createElement('div'); const c=document.createElement('canvas'); c.width=16; c.height=16; const g=c.getContext('2d');
    g.fillStyle=col; g.fillRect(2,5,12,10); g.fillStyle=shade(col,1.25); g.fillRect(2,5,12,2); g.fillStyle=shade(col,.6); g.fillRect(2,14,12,1); g.fillStyle='#3a2414'; g.fillRect(6,2,4,4); g.fillStyle='#d8b040'; g.fillRect(7,9,2,2);
    d.appendChild(c); d.appendChild(document.createTextNode(label)); d.onclick=()=>{ if(running) fn(); }; bags.appendChild(d); };
  bag('Mochila','#7a5434',()=>openInventory()); bag('Livro','#5a1a1a',()=>toggleBook());
  document.getElementById('uo-pack').onclick=()=>{ if(running) openInventory(); };
  document.getElementById('uo-cmd').onclick=()=>document.body.classList.toggle('cmds');
  document.getElementById('uo-wbtn').onclick=()=>{ if(running) toggleWar(); };
  const w=document.createElement('div'); w.id='uo-war'; w.textContent='⚔ MODO GUERRA'; document.getElementById('hud').appendChild(w);
})();
function showRep(){ const L=Object.entries(player.rep||{}).filter(([k,v])=>v).map(([k,v])=>[`${cityName(k)}: ${v} — ${repTitle(v,cityName(k))}${player.oath===k?' (jurado)':''}`,null]);
  const Q=Object.values(player.quests||{}).map(q=>[`Contrato: ${orderText(q)} (${q.have}/${q.n||1}) — ${cityName(q.city)}`,null]);
  openActions('Reputação e contratos', [...(L.length?L:[['Nenhuma cidade te conhece ainda. Procure o Quadro de Contratos nas praças.',null]]), ...Q, ['Fechar',null]]); }
function toggleWar(){ warMode=!warMode; const b=document.querySelector('#uo-doll .btns .war'); if(b){ b.textContent=warMode?'GUERRA':'PAZ'; b.classList.toggle('war',warMode); }
  document.getElementById('uo-war').textContent = warMode?'⚔ MODO GUERRA':''; const wb=document.getElementById('uo-wbtn'); wb.textContent=warMode?'GUERRA':'PAZ'; wb.classList.toggle('peace',!warMode); toast(warMode?'Modo Guerra: o clique ataca.':'Modo Paz: o clique não ataca.'); }
addEventListener('keydown',e=>{ if(e.key==='Tab' && running && document.activeElement.tagName!=='INPUT'){ e.preventDefault(); toggleWar(); } });
// no modo Paz o clique não ataca (como no UO)
const _paW = playerAttack; playerAttack = function(a){ if(!warMode && uiMode!=='classic' && leftHeld && !attackHeld) return; _paW(a); };
// tela do jogo dentro da moldura
const _resizeU = resize;
resize = function(){
  if(uiMode!=='uo' || innerWidth<900){ uoRect={x:0,y:0,w:innerWidth,h:innerHeight}; canvas.style.left='0px'; canvas.style.top='0px'; return _resizeU(); }
  const x=UO_L, y=0, w=innerWidth-UO_L-UO_R, h=innerHeight-UO_B; uoRect={x,y,w,h};
  dpr=Math.min(window.devicePixelRatio||1,3); canvas.width=Math.floor(w*dpr); canvas.height=Math.floor(h*dpr);
  canvas.style.width=w+'px'; canvas.style.height=h+'px'; canvas.style.left=x+'px'; canvas.style.top=y+'px';
  zoom=Math.max(2, Math.floor(Math.min(canvas.width,canvas.height)/230)); buf.width=Math.ceil(canvas.width/zoom); buf.height=Math.ceil(canvas.height/zoom); lcv.width=buf.width; lcv.height=buf.height; };
removeEventListener('resize',_resizeU); addEventListener('resize',()=>resize());
mouseWorld = function(){ return { x: viewX + (mouse.x-uoRect.x)*dpr/zoom, y: viewY + (mouse.y-uoRect.y)*dpr/zoom }; };
const UI_NAMES={classic:'Clássica',uo:'Estilo UO (ClassicUO)',uo2:'Estilo UO (Moderno)'};
function applyUI(){ document.body.classList.toggle('uo', uiMode==='uo' && innerWidth>=900); document.body.classList.toggle('uo2', uiMode==='uo2' || (uiMode==='uo' && innerWidth<900)); resize(); const b=document.getElementById('m-ui'); if(b) b.textContent = 'Interface: '+UI_NAMES[uiMode]+' (trocar)'; const s=document.getElementById('o-ui'); if(s) s.value=uiMode; }
function setUI(m){ uiMode=m; try{ localStorage.setItem(UIK,m); }catch(e){} applyUI(); }
document.getElementById('m-ui').addEventListener('pointerdown',e=>{ e.stopPropagation(); setUI({classic:'uo',uo:'uo2',uo2:'classic'}[uiMode]); });
(function(){ const box=document.querySelector('#front-options .create-box'); if(!box) return; const d=document.createElement('label'); d.className='opt';
  d.innerHTML='Interface <select id="o-ui"><option value="classic">Clássica</option><option value="uo">Estilo UO (ClassicUO)</option><option value="uo2">Estilo UO (Moderno)</option></select>'; box.insertBefore(d, box.querySelector('label'));
  document.getElementById('o-ui').onchange=e=>setUI(e.target.value); })();
addEventListener('resize',applyUI); applyUI();
// atualização dos painéis
let uoT=0, uoDollKey=''; const ICON_IMG={};
const _updUO = update;
update = function(dt){ _updUO(dt); if(uiMode==='classic'||!running||!player) return; uoT-=dt; if(uoT>0) return; uoT=.25;
  // minimapa
  const mc=document.querySelector('#uo-mini canvas'), g=mc.getContext('2d'); g.imageSmoothingEnabled=false; const tx=Math.floor(player.x/T), ty=Math.floor(player.y/T);
  g.fillStyle='#0a0806'; g.fillRect(0,0,125,75); if(minimap) g.drawImage(minimap, tx-62, ty-37, 125, 75, 0, 0, 125, 75);
  g.fillStyle='#ff4a3a'; g.fillRect(61,36,3,3); for(const r of raiders){ const x=Math.floor(r.x/T)-tx+62, y=Math.floor(r.y/T)-ty+37; if(x>0&&y>0&&x<125&&y<75){ g.fillStyle='#ff8a30'; g.fillRect(x,y,1,1); } }
  for(const n of npcs){ if(!n.sim) continue; const x=Math.floor(n.x/T)-tx+62, y=Math.floor(n.y/T)-ty+37; if(x>0&&y>0&&x<125&&y<75){ g.fillStyle='#6ab0ff'; g.fillRect(x,y,1,1); } }
  document.getElementById('uo-mini').dataset.xy=`${tx}, ${ty}`; document.querySelector('#uo-mini .loc').textContent = `${tx}, ${ty} · ${(regionAt(player.x,player.y)||{name:wildName()}).name} · Dia ${day} ${String(Math.floor(time)).padStart(2,'0')}h`;
  // status
  const bar=(v,m,c)=>`<div class="bar"><i style="width:${Math.max(0,Math.min(100,100*v/m))}%;background:${c}"></i></div>`, Wp=WEAPONS[player.weapon]||{};
  document.getElementById('uo-status').innerHTML=`<b>${escapeHtml(player.name)}</b>
    <div class="row">V ${bar(player.health,player.maxHealth,'#c83a2a')} ${Math.round(player.health)}/${player.maxHealth}</div>
    <div class="row">M ${bar(player.mana||0,player.maxMana||1,'#3a6ad0')} ${Math.round(player.mana||0)}/${Math.round(player.maxMana||0)}</div>
    <div class="row">F ${bar(player.stamina,player.maxStamina,'#c8a030')} ${Math.round(player.stamina)}/${Math.round(player.maxStamina)}</div>
    <div class="st"><span>Força ${gb('str')}</span><span>Armadura ${Math.round(totalArmor()*100)}%</span><span>Destreza ${gb('dex')}</span><span>Dano ${Math.round((Wp.dmg||5)*(1+gb('dmg_pct')/100)+gb('dmg_flat'))}</span><span>Intelig. ${gb('int')}</span><span>Ouro ${countItem('cash')}</span></div>`;
  // mochila aberta (estilo moderno): os itens soltos dentro da bolsa
  if(uiMode==='uo2'){ const pc=document.querySelector('#uo-pack canvas'), pg2=pc.getContext('2d'); pg2.imageSmoothingEnabled=false; pg2.clearRect(0,0,95,75);
    pg2.fillStyle='#4a3018'; pg2.fillRect(6,10,83,60); pg2.fillStyle='#7a5434'; pg2.fillRect(8,12,79,56); pg2.fillStyle='#3a2410'; pg2.fillRect(14,18,67,44); pg2.fillStyle='#5a3a1e'; pg2.fillRect(0,26,8,30); pg2.fillRect(87,26,8,30); pg2.fillStyle='#8a6440'; pg2.fillRect(30,4,35,8);
    let k=0; for(let i=HOTBAR;i<SLOTS&&k<12;i++){ const s=inv[i]; if(!s) continue; const im=ICON_IMG[s.id]||(ICON_IMG[s.id]=Object.assign(new Image(),{src:ICONS[s.id]})); if(im.complete) pg2.drawImage(im,16+(k%5)*12+(k>4?3:0),20+Math.floor(k/5)*13,12,12); k++; } }
  // paperdoll
  const key=JSON.stringify([player.equip,player.weapon,player.look,player.ghost,player.mount&&player.mount.kind,Object.values(player.gi||{}).map(s=>s&&s.hue)]);
  if(key!==uoDollKey){ uoDollKey=key; const dc=document.querySelector('#uo-doll canvas'), dg=dc.getContext('2d'); dg.imageSmoothingEnabled=false; dg.clearRect(0,0,44,56);
    const inv0=invOpen; invOpen=true; drawHuman(dg,22,52,{face:'down',phase:0,moving:false,look:player.look,weapon:player.weapon,wAng:-1.2,head:player.equip.head,body:player.equip.body}); invOpen=inv0;
    document.querySelector('#uo-doll .ttl').textContent = `${player.knight?'Cavaleiro de '+player.knight+' · ':''}${charTitle(player.skills)}`; }
};
// janelas abrem dentro da área do jogo
const _enterUO = enterGame; enterGame = function(msg){ _enterUO(msg); applyUI(); };

// andar com o mouse, como no UO: segure o botão direito (ou o esquerdo no modo Paz) e o boneco vai na direção do cursor; longe do boneco ele corre
let rmb=false;
canvas.addEventListener('mousedown',e=>{ if(e.button===2) rmb=true; });
addEventListener('mouseup',e=>{ if(e.button===2){ rmb=false; runHeld=false; } if(e.button===0 && !warMode) runHeld=false; });
addEventListener('blur',()=>{ rmb=false; });
function mouseMoveVec(){
  if(!running||!player||isTouch) return null; aiming=false;
  const peaceDrag = !warMode && leftHeld && uiMode!=='classic';
  if(!rmb && !peaceDrag) return null;
  const sx=uoRect.x+(player.x-viewX)*zoom/dpr, sy=uoRect.y+(player.y-10-viewY)*zoom/dpr, dx=mouse.x-sx, dy=mouse.y-sy, d=Math.hypot(dx,dy);
  if(d<10) return null; runHeld = d>170; return [dx/d, dy/d];
}
addEventListener('mousemove',e=>{ mouse.x=e.clientX; mouse.y=e.clientY; });

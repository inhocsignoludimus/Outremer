'use strict';
// =====================================================================
// OUTREMER — HUD nova (no lugar da do After Light): retrato e barras em moldura de pedra,
// relógio de pergaminho, botões do jogo, diário de conversa (local / global / guilda /
// sussurro / sistema) com campo para escrever, e a lista de quem está online.
// =====================================================================
(function(){
  const css=document.createElement('style'); css.textContent=`
  #hud .panel{background:linear-gradient(#2a221a,#1a140e);border:2px solid #5a4630;box-shadow:inset 0 0 0 1px #0c0906,0 2px 0 #000;border-radius:3px}
  #stats{width:236px;padding:6px 8px 6px 6px!important}
  #stats .stats-row{display:flex;gap:8px;align-items:center}
  #mini-body{width:52px!important;height:60px!important;background:radial-gradient(#4a3a26,#1a120a);border:2px solid #8a6a3a;border-radius:3px;image-rendering:pixelated;order:-1}
  #stats .stats-bars{flex:1}
  #who{font-family:'Cinzel',serif;color:#e8c070!important;font-size:14px!important}
  #who small{font-family:inherit;color:#b8a888!important;font-size:11px!important}
  #hud .stat{font-size:10px!important;color:#c8b898!important;margin-top:3px!important;position:relative}
  #hud .bar{height:9px!important;background:#120c08!important;border:1px solid #4a3a26!important;border-radius:2px;overflow:hidden}
  #bar-health{background:linear-gradient(#e0503a,#8a1a10)!important}
  #bar-mana{background:linear-gradient(#5a8ae8,#1a3a8a)!important}
  #bar-stamina{background:linear-gradient(#e8c050,#8a6a14)!important}
  #weap{font-size:11px;color:#b8a888;margin-top:4px}
  #clock{background:linear-gradient(#e8dcc0,#c8b890)!important;border-color:#6a5030!important;color:#2a1e12!important}
  #clock small{color:#5a4a30!important} #clock-place{color:#7a3a14!important;font-weight:600}
  #clock .hudbtns{max-width:250px!important}
  #clock .hudbtns button{background:#3a2a1a!important;border:1px solid #8a6a3a!important;color:#f0e0c0!important;font-family:'Cinzel',serif;font-size:10px!important;padding:3px 6px!important}
  #hotbar{background:linear-gradient(#3a3028,#1e1812)!important;border:2px solid #6a5434!important;border-radius:4px}
  #hotbar .slot{background:#100c08!important;border-color:#4a3a26!important}
  #journal{position:absolute;left:10px;bottom:74px;width:min(380px,40vw);pointer-events:auto;font-size:12px;display:flex;flex-direction:column}
  #jr-tabs{display:flex;gap:2px}#jr-tabs button{background:#2a2016;border:1px solid #5a4630;border-bottom:none;color:#b8a888;font-size:10px;padding:2px 6px;cursor:pointer;border-radius:3px 3px 0 0}
  #jr-tabs button.on{background:#3e3020;color:#f0e0c0}
  #jr-log{height:130px;overflow-y:auto;background:rgba(16,12,8,.72);border:1px solid #5a4630;padding:4px 6px;line-height:1.35}
  #jr-log div{word-wrap:break-word;text-shadow:1px 1px 0 #000}
  #jr-log .ch{opacity:.7;font-size:10px;margin-right:3px}
  .jr-local{color:#f0e6d0}.jr-global{color:#e8c070}.jr-guild{color:#7ae07a}.jr-whisper{color:#d090ff}.jr-system{color:#a8b8c8;font-style:italic}
  #jr-in{display:flex}#jr-in input{flex:1;background:#120c08;border:1px solid #5a4630;color:#f0e6d0;font-size:12px;padding:4px 6px}
  #jr-in select{background:#2a2016;border:1px solid #5a4630;color:#e8c070;font-size:11px}
  #jr-min{position:absolute;right:2px;top:0;background:none;border:none;color:#b8a888;cursor:pointer;font-size:12px}
  #journal.min #jr-log{height:44px} #journal.min #jr-in{display:none}
  body:not(.playing) #journal{display:none}
  #online-panel .on-row{display:flex;gap:8px;align-items:center;padding:3px 6px;border-bottom:1px solid #2a231c;font-size:13px;color:#e0d4c0}
  #online-panel .on-row small{color:#9a8e7e}#online-panel .on-row button{margin-left:auto;background:#221b15;border:1px solid #4a3d30;color:#d9cfc1;font-size:11px;padding:2px 6px;cursor:pointer}
  #online-list{max-height:52vh;overflow-y:auto}
  @media (max-width:760px){ #journal{width:46vw;bottom:auto;top:96px;left:4px} #jr-log{height:70px;font-size:10px} #stats{width:170px} #mini-body{width:36px!important;height:42px!important} }`;
  document.head.appendChild(css);
  const hud=document.getElementById('hud');
  const j=document.createElement('div'); j.id='journal';
  j.innerHTML=`<div id="jr-tabs"><button data-f="all" class="on">Tudo</button><button data-f="local">Local</button><button data-f="global">Global</button><button data-f="guild">Guilda</button><button data-f="whisper">Sussurros</button><button data-f="system">Sistema</button></div>
    <button id="jr-min">▾</button><div id="jr-log"></div>
    <div id="jr-in"><select id="jr-ch"><option value="local">Local</option><option value="global">Global</option><option value="guild">Guilda</option></select><input id="jr-text" maxlength="140" placeholder="Enter para falar · /w nome msg"></div>`;
  hud.appendChild(j);
  const p=document.createElement('div'); p.id='online-panel'; p.className='gpanel'; p.style.display='none';
  p.innerHTML=`<div class="gbox"><div class="ghead"><b>ONLINE</b><span id="on-count"></span><button id="on-close">Fechar (O)</button></div><div id="on-guild" style="margin:6px 0;font-size:13px;color:#cdbfae"></div><div id="online-list"></div></div>`;
  document.body.appendChild(p);
  // botões
  const hb=document.querySelector('.hudbtns');
  const mk=(t,f,id)=>{ const b=document.createElement('button'); b.textContent=t; if(id) b.id=id; b.onclick=f; hb.appendChild(b); return b; };
  document.getElementById('btn-bag').textContent='PERSONAGEM';
  if(!document.getElementById('btn-skills-x')) mk('ONLINE',()=>toggleOnline(),'btn-online');
  document.getElementById('btn-skip').textContent='ESPERAR';
  document.getElementById('btn-fs').textContent='⛶';
})();
const Journal = {
  lines:[], filter:'all',
  add(ch,who,text,col){ this.lines.push({ch,who,text,col,t:Date.now()}); if(this.lines.length>200) this.lines.shift(); this.render(); },
  render(){ const L=document.getElementById('jr-log'); if(!L) return; const f=this.filter, nm={local:'',global:'[G]',guild:'[Guilda]',whisper:'[Sussurro]',system:''};
    L.innerHTML=this.lines.filter(l=>f==='all'||l.ch===f).slice(-60).map(l=>`<div class="jr-${l.ch}"><span class="ch">${nm[l.ch]||''}</span>${l.who?`<b style="color:${l.col||'inherit'}">${escapeHtml(l.who)}:</b> `:''}${escapeHtml(l.text)}</div>`).join('');
    L.scrollTop=L.scrollHeight; },
  focus(pre){ const i=document.getElementById('jr-text'); document.getElementById('journal').classList.remove('min'); if(pre!=null) i.value=pre; i.focus(); },
  send(){ const i=document.getElementById('jr-text'), t=i.value.trim(); i.value=''; i.blur(); if(!t||!player) return;
    const ch=document.getElementById('jr-ch').value;
    const m=t.match(/^\/(w|s|sussurrar)\s+(\S+)\s+(.+)$/i); if(m){ this.add('whisper',`você → ${m[2]}`,m[3],'#d090ff'); Sim.hear(m[3],'whisper',m[2]); return; }
    if(/^\/aceitar/i.test(t)){ Sim.accept(); return; } if(/^\/sair/i.test(t)){ Sim.leave(); return; }
    const pg=Sim.pguild(); this.add(ch, player.name+(pg&&ch!=='guild'?` [${pg.tag}]`:''), t, '#e8c070');
    if(ch==='local') player.say={text:t,until:performance.now()+3000+t.length*55};
    Sim.hear(t,ch); },
};
document.querySelectorAll('#jr-tabs button').forEach(b=>b.onclick=()=>{ document.querySelectorAll('#jr-tabs button').forEach(x=>x.classList.remove('on')); b.classList.add('on'); Journal.filter=b.dataset.f; Journal.render(); });
document.getElementById('jr-min').onclick=()=>document.getElementById('journal').classList.toggle('min');
document.getElementById('jr-text').addEventListener('keydown',e=>{ e.stopPropagation(); if(e.key==='Enter') Journal.send(); if(e.key==='Escape') e.target.blur(); });
document.getElementById('jr-text').addEventListener('keyup',e=>e.stopPropagation());
addEventListener('keydown',e=>{ if(!running||document.activeElement.tagName==='INPUT') return; if(e.key==='Enter'){ e.preventDefault(); Journal.focus(); } if(e.key.toLowerCase()==='o') toggleOnline(); });
// avisos do jogo também ficam no diário
const _toastJ = toast; toast = function(t){ _toastJ(t); if(typeof Journal!=='undefined') Journal.add('system','',t); };
function toggleOnline(){ const p=document.getElementById('online-panel'); if(p.style.display==='none'){ p.style.display='flex'; renderOnline(); } else p.style.display='none'; }
document.getElementById('on-close').onclick=()=>toggleOnline();
function renderOnline(){
  Sim.init(); const on=Sim.online().sort((a,b)=>(b.near-a.near)||a.name.localeCompare(b.name)), pg=Sim.pguild();
  document.getElementById('on-count').textContent=`  ${on.length+1} jogadores online`;
  document.getElementById('on-guild').innerHTML = pg ? `Sua guilda: <b style="color:#7ae07a">${pg.name} [${pg.tag}]</b> — <i>${pg.motto||''}</i> · ${pg.members.filter(m=>m.online).length} online <button id="on-leave">Sair da guilda</button>`
    : 'Você não está em guilda. Converse com membros ou espere um convite.';
  const lv=document.getElementById('on-leave'); if(lv) lv.onclick=()=>{ Sim.leave(); renderOnline(); };
  const wars=Sim.wars.map(w=>`${w.a.tag} × ${w.b.tag}`).join(' · '); if(wars) document.getElementById('on-guild').innerHTML+=`<div style="color:#ffa040;font-size:12px">Guerras: ${wars}</div>`;
  document.getElementById('online-list').innerHTML = on.map(s=>`<div class="on-row"><span style="color:${Sim.color(s)}">${escapeHtml(s.name)}</span><small>${s.guild?'['+s.guild.tag+'] ':''}${s.near?'perto de você':s.where||''}</small><button data-n="${escapeHtml(s.name)}">Sussurrar</button></div>`).join('');
  document.querySelectorAll('#online-list button').forEach(b=>b.onclick=()=>{ toggleOnline(); Journal.focus(`/w ${b.dataset.n} `); });
}
// retrato: o rosto do seu personagem no canto
const _updH = update;
update = function(dt){ _updH(dt); if(!running||!player) return;
  const w=document.getElementById('weap'); if(w){ const Wp=WEAPONS[player.weapon]; w.textContent=`${Wp?Wp.name:'Punhos'} · Armadura ${Math.round(totalArmor()*100)}%${player.guild?' · ['+player.guild+']':''}`; }
};
// o que você fala aparece em cima da sua cabeça
const _dhH = drawHuman;
drawHuman = function(g,x,y,h){ _dhH(g,x,y,h);
  if(player && h.look===player.look && player.say && performance.now()<player.say.until && !invOpen){ const t=player.say.text.length>46?player.say.text.slice(0,44)+'…':player.say.text;
    g.font='6px "Pixelify Sans",monospace'; g.textAlign='center'; const w=Math.min(150,g.measureText(t).width+6); g.fillStyle='rgba(20,16,12,.85)'; g.fillRect(x-w/2,y-42,w,10); g.fillStyle='#ffe8a0'; g.fillText(t,x,y-34); g.textAlign='left'; } };
const _enterH = enterGame; enterGame = function(msg){ _enterH(msg); Journal.lines=[]; Journal.add('system','',msg); Journal.add('system','','Enter para falar · /w nome para sussurrar · O: quem está online · L: magias · K: skills.'); };

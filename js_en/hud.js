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
  j.innerHTML=`<div id="jr-tabs"><button data-f="all" class="on">All</button><button data-f="local">Local</button><button data-f="global">Global</button><button data-f="guild">Guild</button><button data-f="whisper">Whispers</button><button data-f="system">System</button></div>
    <button id="jr-min">▾</button><div id="jr-log"></div>
    <div id="jr-in"><select id="jr-ch"><option value="local">Local</option><option value="global">Global</option><option value="guild">Guild</option></select><input id="jr-text" maxlength="140" placeholder="Enter to talk · /w name msg"></div>`;
  hud.appendChild(j);
  const p=document.createElement('div'); p.id='online-panel'; p.className='gpanel'; p.style.display='none';
  p.innerHTML=`<div class="gbox"><div class="ghead"><b>ONLINE</b><span id="on-count"></span><button id="on-close">Close (O)</button></div><div id="on-guild" style="margin:6px 0;font-size:13px;color:#cdbfae"></div><div id="online-list"></div></div>`;
  document.body.appendChild(p);
  // botões
  const hb=document.querySelector('.hudbtns');
  const mk=(t,f,id)=>{ const b=document.createElement('button'); b.textContent=t; if(id) b.id=id; b.onclick=f; hb.appendChild(b); return b; };
  document.getElementById('btn-bag').textContent='CHARACTER';
  if(!document.getElementById('btn-skills-x')) mk('ONLINE',()=>toggleOnline(),'btn-online');
  document.getElementById('btn-skip').textContent='WAIT';
  document.getElementById('btn-fs').textContent='⛶';
})();
const Journal = {
  lines:[], filter:'all',
  add(ch,who,text,col){ this.lines.push({ch,who,text,col,t:Date.now()}); if(this.lines.length>200) this.lines.shift(); this.render(); },
  render(){ const L=document.getElementById('jr-log'); if(!L) return; const f=this.filter, nm={local:'',global:'[G]',guild:'[Guild]',whisper:'[Whisper]',system:''};
    L.innerHTML=this.lines.filter(l=>f==='all'||l.ch===f).slice(-60).map(l=>`<div class="jr-${l.ch}"><span class="ch">${nm[l.ch]||''}</span>${l.who?`<b style="color:${l.col||'inherit'}">${escapeHtml(l.who)}:</b> `:''}${escapeHtml(l.text)}</div>`).join('');
    L.scrollTop=L.scrollHeight; },
  focus(pre){ const i=document.getElementById('jr-text'); document.getElementById('journal').classList.remove('min'); if(pre!=null) i.value=pre; i.focus(); },
  send(){ const i=document.getElementById('jr-text'), t=i.value.trim(); i.value=''; i.blur(); if(!t||!player) return;
    const ch=document.getElementById('jr-ch').value;
    const m=t.match(/^\/(w|s|sussurrar)\s+(\S+)\s+(.+)$/i); if(m){ this.add('whisper',`you → ${m[2]}`,m[3],'#d090ff'); Sim.hear(m[3],'whisper',m[2]); return; }
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
  document.getElementById('on-count').textContent=`  ${on.length+1} players online`;
  document.getElementById('on-guild').innerHTML = pg ? `Your guild: <b style="color:#7ae07a">${pg.name} [${pg.tag}]</b> — <i>${pg.motto||''}</i> · ${pg.members.filter(m=>m.online).length} online <button id="on-leave">Leave guild</button>`
    : 'You are not in a guild. Talk to members or wait for an invitation.';
  const lv=document.getElementById('on-leave'); if(lv) lv.onclick=()=>{ Sim.leave(); renderOnline(); };
  const wars=Sim.wars.map(w=>`${w.a.tag} × ${w.b.tag}`).join(' · '); if(wars) document.getElementById('on-guild').innerHTML+=`<div style="color:#ffa040;font-size:12px">Wars: ${wars}</div>`;
  document.getElementById('online-list').innerHTML = on.map(s=>`<div class="on-row"><span style="color:${Sim.color(s)}">${escapeHtml(s.name)}</span><small>${s.guild?'['+s.guild.tag+'] ':''}${s.near?'near you':s.where||''}</small><button data-n="${escapeHtml(s.name)}">Whisper</button></div>`).join('');
  document.querySelectorAll('#online-list button').forEach(b=>b.onclick=()=>{ toggleOnline(); Journal.focus(`/w ${b.dataset.n} `); });
}
// retrato: o rosto do seu personagem no canto
const _updH = update;
update = function(dt){ _updH(dt); if(!running||!player) return;
  const w=document.getElementById('weap'); if(w){ const Wp=WEAPONS[player.weapon]; w.textContent=`${Wp?Wp.name:'Fists'} · Armour ${Math.round(totalArmor()*100)}%${player.guild?' · ['+player.guild+']':''}`; }
};
// o que você fala aparece em cima da sua cabeça
const _dhH = drawHuman;
drawHuman = function(g,x,y,h){ _dhH(g,x,y,h);
  if(player && h.look===player.look && player.say && performance.now()<player.say.until && !invOpen && g===bctx) HILABELS.push({wx:player.x, wy:player.y-30, say:player.say.text, mine:true}); };
const _enterH = enterGame; enterGame = function(msg){ _enterH(msg); Journal.lines=[]; Journal.add('system','',msg); Journal.add('system','','Enter to talk · /w name to whisper · O: who\'s online · L: spells · K: skills.'); };

// textos em alta resolução (nomes, falas, chefes): desenhados depois da ampliação, nítidos
let HILABELS=[];
function wrapText(c,t,maxW){ const words=t.split(' '), lines=[]; let l=''; for(const w of words){ const tt=l?l+' '+w:w; if(c.measureText(tt).width>maxW && l){ lines.push(l); l=w; } else l=tt; } if(l) lines.push(l); return lines.slice(0,3); }
function drawHiResLabels(c,S){
  const big=innerHeight>=520, fs=Math.round((big?13:11)*dpr), bs=Math.round((big?13:11)*dpr);
  c.save(); c.textAlign='center'; c.textBaseline='bottom';
  for(const L of HILABELS){ const [x,y]=S(L.wx,L.wy); let yy=y;
    if(L.name){ c.font=`600 ${fs}px 'Pixelify Sans', sans-serif`; c.lineWidth=Math.max(2,3*dpr/1.5); c.strokeStyle='rgba(0,0,0,.85)'; c.strokeText(L.name,x,yy); c.fillStyle=L.col||'#fff'; c.fillText(L.name,x,yy); yy-=fs+4*dpr; }
    if(L.say){ c.font=`${bs}px 'Pixelify Sans', sans-serif`; const lines=wrapText(c,L.say,220*dpr), lh=bs+3*dpr, w=Math.max(...lines.map(t=>c.measureText(t).width))+14*dpr, h=lines.length*lh+8*dpr;
      c.fillStyle='rgba(18,14,10,.88)'; c.strokeStyle=L.mine?'#e8c070':'#6a5434'; c.lineWidth=Math.max(1,dpr); c.beginPath(); c.roundRect? c.roundRect(x-w/2,yy-h,w,h,5*dpr) : c.rect(x-w/2,yy-h,w,h); c.fill(); c.stroke();
      c.fillStyle=L.mine?'#ffe8a0':'#f0e6d0'; lines.forEach((t,i)=>c.fillText(t,x,yy-h+8*dpr/2+lh*(i+1))); }
    if(L.boss){ c.font=`600 ${fs}px 'Pixelify Sans', sans-serif`; c.lineWidth=3; c.strokeStyle='rgba(0,0,0,.85)'; c.strokeText(L.boss,x,yy); c.fillStyle='#e8c070'; c.fillText(L.boss,x,yy); }
    if(L.bar){ const bw=Math.min(320*dpr,c.canvas.width*.4), bx=c.canvas.width/2-bw/2, by=8*dpr, bh=18*dpr; c.fillStyle='rgba(0,0,0,.7)'; c.fillRect(bx-2,by-2,bw+4,bh+4);
      c.fillStyle=L.bar.boss?'#8a5a10':'#7a1a10'; c.fillRect(bx,by,bw*Math.max(0,L.bar.f),bh); c.font=`600 ${Math.round(13*dpr)}px 'Pixelify Sans', sans-serif`; c.textBaseline='middle'; c.fillStyle='#fff'; c.fillText(L.bar.name,c.canvas.width/2,by+bh/2+1); c.textBaseline='bottom'; } }
  c.restore(); HILABELS=[];
}

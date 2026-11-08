'use strict';
// =====================================================================
// OUTREMER — personagem: raças, aparência, 3 skills iniciais (como no UO),
// título que nasce das skills, 8 personagens salvos e noite mais clara.
// Carrega depois de outremer.js.
// =====================================================================

// ---------------- Noite: escura, mas jogável (tochas e casas continuam brilhando) ----------------
const _darkness = darkness;
darkness = h => _darkness(h) * 0.62;

// ---------------- Skills (as 39 do UO, simplificadas) ----------------
Object.assign(SKILL_NAMES, {
  arcos:'Arquearia', briga:'Luta Corporal', aparar:'Aparar Golpes', avaliar:'Avaliar Inteligência', resistir:'Resistir a Magias',
  alfaiataria:'Alfaiataria', alquimia:'Alquimia', engenhocas:'Engenhocas', pesca:'Pesca', ocultacao:'Ocultação', bisbilhotar:'Bisbilhotar',
  arrombar:'Arrombar Fechaduras', domar:'Domar Animais', veterinaria:'Veterinária', acampamento:'Acampamento', pastoreio:'Pastoreio',
  musica:'Musicalidade', provocacao:'Provocação', pacificacao:'Pacificação', inscricao:'Inscrição', detectar:'Detectar Ocultos',
  envenenar:'Envenenamento', flecharia:'Arcos e Flechas', comercio:'Comércio',
});
const SKILL_GROUPS = [
  ['Combate', ['espadas','macas','machados','esgrima','arcos','briga','taticas','aparar','anatomia']],
  ['Magia', ['magia','avaliar','meditacao','resistir','inscricao','alquimia']],
  ['Ofícios', ['ferraria','carpintaria','alfaiataria','flecharia','engenhocas','culinaria','comercio']],
  ['Coleta', ['mineracao','lenhador','pesca']],
  ['Sombras', ['furtividade','ocultacao','bisbilhotar','arrombar','envenenar','detectar']],
  ['Natureza', ['domar','veterinaria','pastoreio','rastreamento','acampamento','cura']],
  ['Bardo', ['musica','provocacao','pacificacao']],
];
const SKILL_TITLE = { espadas:'Espadachim', macas:'Guerreiro', machados:'Bárbaro', esgrima:'Lanceiro', arcos:'Arqueiro', briga:'Lutador', taticas:'Guerreiro',
  aparar:'Escudeiro', anatomia:'Físico', cura:'Curandeiro', magia:'Mago', avaliar:'Erudito', meditacao:'Asceta', resistir:'Inquebrantável', inscricao:'Escriba',
  alquimia:'Alquimista', ferraria:'Ferreiro', carpintaria:'Construtor', alfaiataria:'Alfaiate', flecharia:'Flecheiro', engenhocas:'Artífice', culinaria:'Cozinheiro',
  comercio:'Mercador', mineracao:'Mineiro', lenhador:'Lenhador', pesca:'Pescador', furtividade:'Ladino', ocultacao:'Sombra', bisbilhotar:'Bisbilhoteiro',
  arrombar:'Arrombador', envenenar:'Envenenador', detectar:'Vigia', domar:'Domador', veterinaria:'Veterinário', pastoreio:'Pastor', rastreamento:'Rastreador',
  acampamento:'Andarilho', musica:'Bardo', provocacao:'Bardo', pacificacao:'Bardo' };
const RANKS = [[100,'Grão-Mestre'],[90,'Mestre'],[80,'Adepto'],[70,'Perito'],[60,'Artífice'],[50,'Aprendiz'],[40,'Novato'],[30,'Neófito'],[0,'Iniciante']];
// o próprio jogo diz o que o personagem virou: "Mestre Espadachim e Mago", "Perito Mercador e Construtor"...
function charTitle(sk){
  const top = Object.entries(sk||{}).sort((a,b)=>b[1]-a[1]);
  if(!top.length) return 'Andarilho';
  const rank = RANKS.find(r=>top[0][1]>=r[0])[1], t1 = SKILL_TITLE[top[0][0]]||'Andarilho';
  const sec = top.slice(1).find(([k,v])=>v>=Math.max(30, top[0][1]*0.6) && SKILL_TITLE[k]!==t1);
  return `${rank} ${t1}${sec ? ' e '+SKILL_TITLE[sec[0]] : ''}`;
}
function refreshWho(){ const el=document.getElementById('who'); if(el && player) el.innerHTML=`${escapeHtml(player.name)}<small>${RACES[player.look.race||'humano'].name} · ${charTitle(player.skills)}</small>`; }

// ---------------- Raças ----------------
const RACES = {
  humano:   { name:'Humano',    sx:1,   sy:1,    desc:'Aprende tudo um pouco mais rápido (+15% no ganho de skill).',
              skins:['#f2cfb0','#e0b48e','#c8956a','#a8754c','#86583a','#5e3c26','#432a1a'], hairs:['#17110e','#2e1e14','#4a2e1a','#6a4424','#a8803a','#d8b860','#8a3a1e','#8a8680'] },
  elfo:     { name:'Elfo',      sx:.9,  sy:1.08, desc:'Esguio e alto. +5 em Magia e Arquearia, mais mana.',
              skins:['#f6e4d0','#ecd4bc','#d8c0a4','#c8b49a','#b8a8c8','#9a8aa8'], hairs:['#f0ece0','#d8d8e0','#e8d090','#d8b860','#a85a2a','#2e2e3a','#4a3a5a','#5a6a4a'] },
  anao:     { name:'Anão',      sx:1.2, sy:.8,   desc:'Baixo e largo. +15% de vida, +5 em Ferraria e Mineração.',
              skins:['#f0c8a8','#d8a888','#c08a68','#9a6a4a','#7a5038'], hairs:['#17110e','#4a2e1a','#8a3a1e','#c86a2a','#a8803a','#8a8680','#d8d8d0'] },
  pequenino:{ name:'Pequenino', sx:.92, sy:.76,  desc:'Pequeno e ligeiro. +10% de velocidade, +5 em Furtividade e Ocultação.',
              skins:['#f2cfb0','#e8bc98','#d0a07a','#b08058','#8a6040'], hairs:['#2e1e14','#4a2e1a','#6a4424','#a8803a','#d8b860','#8a3a1e'] },
};
const RACE_BONUS = { elfo:{magia:5,arcos:5}, anao:{ferraria:5,mineracao:5}, pequenino:{furtividade:5,ocultacao:5} };
const HAIR_STYLES = [['short','Curto'],['buzz','Raspado'],['bald','Careca'],['long','Longo'],['ponytail','Rabo de cavalo'],['braid','Trança']];
const BEARDS = [[0,'Sem barba'],[1,'Curta'],[2,'Cheia'],[3,'Longa']];
const TUNICS = ['#8a7a5a','#6a4a2c','#4a5a3a','#3e4a5a','#5a3a3a','#6a5a7a','#7a6a4a','#4a4a4a','#8a5a3a','#2e3e4e'];

// desenha qualquer boneco no tamanho da sua raça sem borrar o pixel: remapeia cada retângulo
const _pxCache = new WeakMap();
function pixelScale(g, ox, oy, sx, sy){
  let st = _pxCache.get(g);
  if(!st){ st = {ox:0,oy:0,sx:1,sy:1};
    const fr = (x,y,w,h)=>{ const rx=x-st.ox, ry=y-st.oy, x0=Math.round(rx*st.sx), y0=Math.round(ry*st.sy);
      const ww=Math.max(1,Math.round((rx+w)*st.sx)-x0), hh=Math.max(1,Math.round((ry+h)*st.sy)-y0); g.fillRect(st.ox+x0, st.oy+y0, ww, hh); };
    st.proxy = new Proxy(g, { get:(t,p)=> p==='fillRect' ? fr : (typeof t[p]==='function' ? t[p].bind(t) : t[p]), set:(t,p,v)=>{ t[p]=v; return true; } });
    _pxCache.set(g, st); }
  st.ox=ox; st.oy=oy; st.sx=sx; st.sy=sy; return st.proxy;
}
const COVERED = new Set(['great','bascinet','hood','coif']);
const _drawHuman = drawHuman;
drawHuman = function(g,x,y,h){
  const L = h.look||{}, R = RACES[L.race] || RACES.humano;
  const gg = (R.sx===1 && R.sy===1) ? g : pixelScale(g, x, y, R.sx, R.sy);
  _drawHuman(gg, x, y, h);
  if(h.flash) return;
  const P=(a,b,w,hh,c)=>{ gg.fillStyle=c; gg.fillRect(x+a,y+b,w,hh); }, f=h.face, kind=h.head && WEAR[h.head] ? WEAR[h.head].kind : null;
  if(L.race==='elfo' && !COVERED.has(kind)){
    if(f==='down'||f==='up'){ P(-4,-18,1,2,L.skin); P(-5,-19,1,1,L.skin); P(3,-18,1,2,L.skin); P(4,-19,1,1,L.skin); }
    else { const m=f==='left'?1:-1; P(m>0?2:-3,-18,1,2,L.skin); P(m>0?3:-4,-20,1,2,L.skin); }
  }
  const b = typeof L.beard==='number' ? L.beard : (L.beard?1:0);
  if(b>=2 && f!=='up' && kind!=='great'){
    if(f==='down'){ P(-3,-17,1,2,L.hair); P(2,-17,1,2,L.hair); P(-3,-16,6,3,L.hair); if(b>=3){ P(-2,-13,4,3,L.hair); P(-1,-10,2,2,L.hair); } P(-1,-15,2,1,darkHex(L.hair,.6)); }
    else { const m=f==='left'?-1:1; P(m<0?-3:-1,-16,4,3,L.hair); if(b>=3) P(m<0?-3:0,-13,3,3,L.hair); }
  }
};

// ---------------- Criação de personagem ----------------
let cRace='humano', cSkills=[], cHairIdx=0, cBeard=0;
const TEMPLATES = [
  ['Guerreiro',['espadas','taticas','aparar']], ['Mago',['magia','meditacao','avaliar']], ['Arqueiro',['arcos','taticas','rastreamento']],
  ['Paladino',['macas','cura','aparar']], ['Ferreiro',['ferraria','mineracao','comercio']], ['Construtor',['carpintaria','lenhador','comercio']],
  ['Ladino',['furtividade','esgrima','arrombar']], ['Domador',['domar','veterinaria','pastoreio']], ['Pescador',['pesca','culinaria','comercio']], ['Bardo',['musica','pacificacao','provocacao']],
];
const START_PTS = [50,30,20];
function buildCreateUI(){
  const box = document.querySelector('#screen-create .create-box');
  box.innerHTML = `
    <h1>OUTREMER</h1><div class="subtitle">Crie seu personagem — em Aelória você pode ser o que quiser</div>
    <div class="cc-grid">
      <div>
        <label>Nome</label><input type="text" id="char-name" maxlength="20" value="Aldric">
        <label>Raça</label><div class="look-row" id="cc-race"></div><div class="cc-note" id="cc-race-desc"></div>
        <label>Sexo</label><div class="look-row"><button class="seg" id="sex-m">Homem</button><button class="seg" id="sex-f">Mulher</button><button class="seg rand" id="btn-rand">🎲 Sortear</button></div>
        <label>Pele</label><div class="cc-sw" id="cc-skin"></div>
        <label>Cabelo</label><div class="cc-step"><button class="seg" id="hair-prev">◀</button><span id="hair-name"></span><button class="seg" id="hair-next">▶</button></div>
        <div class="cc-sw" id="cc-hair"></div>
        <div id="beard-box"><label>Barba</label><div class="cc-step"><button class="seg" id="beard-prev">◀</button><span id="beard-name"></span><button class="seg" id="beard-next">▶</button></div></div>
        <label>Túnica</label><div class="cc-sw" id="cc-tunic"></div>
      </div>
      <div>
        <div class="look-box cc-prev"><canvas id="preview" width="104" height="44"></canvas></div>
        <label>Habilidades iniciais <small>(3 — ficam com 50, 30 e 20)</small></label>
        <div class="cc-picks" id="cc-picks"></div>
        <div class="cc-note">Modelos prontos:</div><div class="cc-tpl" id="cc-tpl"></div>
        <div class="cc-skills" id="cc-skills"></div>
      </div>
    </div>
    <button class="start" id="btn-start" disabled>Entrar em Aurélia</button>
    <button class="linkbtn" id="create-back">◂ Voltar</button>`;
  const css = document.createElement('style'); css.textContent = `
    #screen-create{overflow-y:auto;align-items:flex-start!important}
    #screen-create .create-box{width:860px;margin:16px auto}
    .cc-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}
    @media (max-width:760px){ .cc-grid{grid-template-columns:1fr} }
    .cc-note{font-size:12px;color:#9a8e7e;margin:4px 0 8px}
    .cc-sw{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px}
    .cc-sw b{width:22px;height:22px;border:2px solid #2a231c;cursor:pointer;display:block}
    .cc-sw b.on{border-color:#e8c070;outline:1px solid #000}
    .cc-step{display:flex;align-items:center;gap:8px;margin-bottom:6px}.cc-step .seg{flex:0 0 40px}.cc-step span{flex:1;text-align:center;color:#eadfce}
    .cc-prev{justify-content:center}#preview{width:312px!important;height:132px!important;image-rendering:pixelated}
    .cc-picks{display:flex;gap:6px;margin-bottom:6px}.cc-picks div{flex:1;background:#0b0908;border:2px solid #3a3026;padding:6px;font-size:13px;color:#eadfce;min-height:38px;text-align:center}
    .cc-picks div b{display:block;color:#e8c070;font-size:16px}
    .cc-tpl{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px}.cc-tpl button{background:#1e1812;border:1px solid #4a3d30;color:#cdbfae;font-size:12px;padding:3px 7px;cursor:pointer}
    .cc-skills{max-height:250px;overflow-y:auto;border:1px solid #2a231c;padding:6px}
    .cc-skills h4{font-size:12px;color:#8a7a62;margin:6px 0 3px;font-weight:600}
    .cc-skills span{display:inline-block;background:#0b0908;border:1px solid #3a3026;color:#cdbfae;font-size:12px;padding:3px 6px;margin:2px;cursor:pointer}
    .cc-skills span.on{background:#3a2a16;border-color:#e8c070;color:#fff}`;
  document.head.appendChild(css);
  const rb=document.getElementById('cc-race');
  for(const [id,r] of Object.entries(RACES)){ const b=document.createElement('button'); b.className='seg'; b.textContent=r.name; b.dataset.id=id; b.onclick=()=>setRace(id); rb.appendChild(b); }
  const tp=document.getElementById('cc-tpl');
  for(const [n,ks] of TEMPLATES){ const b=document.createElement('button'); b.textContent=n; b.onclick=()=>{ cSkills=[...ks]; renderSkills(); }; tp.appendChild(b); }
  const sb=document.getElementById('cc-skills');
  for(const [gname,ks] of SKILL_GROUPS){ const h=document.createElement('h4'); h.textContent=gname; sb.appendChild(h);
    for(const k of ks){ const s=document.createElement('span'); s.textContent=SKILL_NAMES[k]; s.dataset.k=k; s.onclick=()=>toggleSkill(k); sb.appendChild(s); } }
  document.getElementById('sex-m').onclick=()=>{ chosenSex='m'; chosenLook.sex='m'; refreshCreate(); };
  document.getElementById('sex-f').onclick=()=>{ chosenSex='f'; chosenLook.sex='f'; cBeard=0; refreshCreate(); };
  document.getElementById('btn-rand').onclick=randomizeLook;
  document.getElementById('hair-prev').onclick=()=>{ cHairIdx=(cHairIdx+HAIR_STYLES.length-1)%HAIR_STYLES.length; refreshCreate(); };
  document.getElementById('hair-next').onclick=()=>{ cHairIdx=(cHairIdx+1)%HAIR_STYLES.length; refreshCreate(); };
  document.getElementById('beard-prev').onclick=()=>{ cBeard=(cBeard+3)%4; refreshCreate(); };
  document.getElementById('beard-next').onclick=()=>{ cBeard=(cBeard+1)%4; refreshCreate(); };
  document.getElementById('btn-start').onclick=()=>startGame();
  document.getElementById('create-back').onclick=()=>showScreen('screen-title');
  randomizeLook();
}
function swatches(id, cols, cur, set){
  const el=document.getElementById(id); el.innerHTML='';
  for(const c of cols){ const b=document.createElement('b'); b.style.background=c; if(c===cur) b.className='on'; b.onclick=()=>{ set(c); refreshCreate(); }; el.appendChild(b); }
}
function setRace(id){ cRace=id; const R=RACES[id];
  if(!R.skins.includes(chosenLook.skin)) chosenLook.skin=rpick(R.skins);
  if(!R.hairs.includes(chosenLook.hair)) chosenLook.hair=rpick(R.hairs);
  if(id==='anao' && chosenSex==='m') cBeard=3;
  refreshCreate(); }
function randomizeLook(){
  const R=RACES[cRace]; chosenLook = chosenLook || {};
  Object.assign(chosenLook, { sex:chosenSex, skin:rpick(R.skins), hair:rpick(R.hairs), pants:'#4a3e30', boot:'#2a1e14' });
  const t=rpick(TUNICS); chosenLook.jacket=t;
  cHairIdx = chosenSex==='f' ? rpick([3,4,5]) : rpick([0,0,1,2,3]);
  cBeard = chosenSex==='m' ? (cRace==='anao' ? 3 : rpick([0,0,1,2,3])) : 0;
  refreshCreate();
}
function toggleSkill(k){ const i=cSkills.indexOf(k); if(i>=0) cSkills.splice(i,1); else { if(cSkills.length>=3) cSkills.shift(); cSkills.push(k); } renderSkills(); }
function renderSkills(){
  document.getElementById('cc-picks').innerHTML = [0,1,2].map(i=>`<div>${cSkills[i]?`<b>${START_PTS[i]}</b>${SKILL_NAMES[cSkills[i]]}`:'<b>—</b>escolha'}</div>`).join('');
  document.querySelectorAll('#cc-skills span').forEach(s=>s.classList.toggle('on', cSkills.includes(s.dataset.k)));
  document.getElementById('btn-start').disabled = cSkills.length<3;
  drawPreview();
}
function refreshCreate(){
  const R=RACES[cRace], L=chosenLook;
  L.race=cRace; L.style=HAIR_STYLES[cHairIdx][0]; L.beard=cBeard; L.jacketD=darkHex(L.jacket);
  document.querySelectorAll('#cc-race .seg').forEach(b=>b.classList.toggle('on',b.dataset.id===cRace));
  document.getElementById('cc-race-desc').textContent=R.desc;
  document.getElementById('sex-m').classList.toggle('on',chosenSex==='m'); document.getElementById('sex-f').classList.toggle('on',chosenSex==='f');
  document.getElementById('hair-name').textContent=HAIR_STYLES[cHairIdx][1];
  document.getElementById('beard-box').style.display = chosenSex==='m' ? '' : 'none';
  document.getElementById('beard-name').textContent=BEARDS[cBeard][1];
  swatches('cc-skin', R.skins, L.skin, c=>L.skin=c);
  swatches('cc-hair', R.hairs, L.hair, c=>L.hair=c);
  swatches('cc-tunic', TUNICS, L.jacket, c=>L.jacket=c);
  renderSkills();
}
drawPreview = function(){
  const c=document.getElementById('preview'); if(!c||!chosenLook) return; const g=c.getContext('2d'); g.clearRect(0,0,c.width,c.height);
  ['down','right','up','left'].forEach((f,k)=>{ g.fillStyle='rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(14+k*25,38,5,2,0,0,7); g.fill();
    drawHuman(g,14+k*25,38,{face:f,phase:0,moving:false,look:chosenLook,weapon:'fists',wAng:0}); });
};
initCreation = function(){};

// ---------------- Começo do jogo: as 3 skills definem o kit inicial ----------------
const KIT = { espadas:[['shortsword',1]], macas:[['club',1]], machados:[['hand_axe',1]], esgrima:[['dagger',1]], arcos:[['bow',1],['arrows',40]],
  cura:[['bandage',10]], magia:[['staff',1],['heal_potion',1]], alquimia:[['heal_potion',2]], lenhador:[['hand_axe',1]], carpintaria:[['logs',10]],
  mineracao:[['iron_ore',4]], furtividade:[['dagger',1]], comercio:[['cash',40]], culinaria:[['bread',4]], acampamento:[['bread',3]] };
startGame = function(){
  if(cSkills.length<3) return;
  buildWorld();
  const L=chosenLook; L.pants='#4a3e30'; L.boot='#2a1e14';
  const name=document.getElementById('char-name').value.trim()||'Andarilho';
  const mods={}; if(cRace==='pequenino') mods.speed=1.1;
  selectedProfessions.length=0;
  const [sx,sy]=findSpawn();
  makePlayer(name,mods,sx*T+8,sy*T+12);
  player.skills={}; cSkills.forEach((k,i)=>player.skills[k]=START_PTS[i]);
  for(const [k,v] of Object.entries(RACE_BONUS[cRace]||{})) player.skills[k]=(player.skills[k]||0)+v;
  applyRace();
  player.weapon='fists'; player.health=player.maxHealth; player.hunger=100; player.thirst=100;
  time=10; day=1; lastWave=0;
  addItem('bread',4); addItem('bandage',3); addItem('cash',30);
  const given=new Set(); for(const k of cSkills) for(const [id,n] of KIT[k]||[]) if(ITEMS[id] && !given.has(id)){ addItem(id,n); given.add(id); }
  curSlot = firstEmptySlot(); if(curSlot<0) curSlot=0;
  enterGame(`Bem-vindo a Aurélia, ${name}. Armas melhores, armaduras e ouro estão lá fora, além dos muros. E: falar/usar · I: mochila · M: mapa · K: skills.`);
  saveGame(true);
};
function applyRace(){ const r=player.look.race;
  if(r==='anao'){ player.maxHealth=Math.round(100*1.15); }
  player.health=Math.min(player.health||player.maxHealth, player.maxHealth); }
const _gainSkill = gainSkill;
gainSkill = function(k,diff){ const before=Math.floor(skill(k)); _gainSkill(k, (diff||1)*(player.look.race==='humano'?1.15:1)); if(Math.floor(skill(k))!==before) refreshWho(); };
const _enterGame2 = enterGame;
enterGame = function(msg){ _enterGame2(msg); refreshWho(); };

// ---------------- 8 personagens salvos ----------------
const MAX_SLOTS=8, SLOT_KEY=n=>'outremer_slot_'+n;
let curSlot=0;
function readSlot(n){ try{ const s=localStorage.getItem(SLOT_KEY(n)); return s?JSON.parse(s):null; }catch(e){ return null; } }
function firstEmptySlot(){ for(let i=0;i<MAX_SLOTS;i++) if(!readSlot(i)) return i; return -1; }
readLocal = ()=>readSlot(curSlot);
const _serialize = serialize;
serialize = function(){ const s=_serialize(); s.skills=player.skills; s.title=charTitle(player.skills); s.race=player.look.race; return s; };
const _applySave = applySave;
applySave = function(s){ _applySave(s); player.skills=s.skills||{}; applyRace(); };
saveGame = async function(quiet){
  if(!running) return;
  try{ localStorage.setItem(SLOT_KEY(curSlot), JSON.stringify(serialize())); if(!quiet) toast(`Jogo salvo (${player.name}, dia ${day}).`); setSaveStatus(`Salvo — dia ${day}`); }
  catch(e){ toast('Não deu para salvar neste navegador.'); }
};
function renderSlots(){
  const box=document.querySelector('#front-saves .create-box');
  let html='<h2>Personagens</h2><div class="cc-slots">';
  for(let i=0;i<MAX_SLOTS;i++){ const s=readSlot(i);
    html += s ? `<div class="slot"><canvas data-i="${i}" width="20" height="28"></canvas><div><b>${escapeHtml(s.name)}</b><small>${RACES[s.race||'humano'].name} · ${s.title||''} · dia ${s.day}</small></div>
      <button class="seg" data-play="${i}">Jogar</button><button class="seg" data-del="${i}">✕</button></div>`
      : `<div class="slot empty"><div><b>Vago</b><small>espaço ${i+1}</small></div><button class="seg" data-new="${i}">Criar</button></div>`; }
  html += '</div><button class="linkbtn" id="saves-close">Fechar</button>';
  box.innerHTML=html;
  if(!document.getElementById('slot-css')){ const st=document.createElement('style'); st.id='slot-css'; st.textContent=`
    #front-saves .cc-slots{display:flex!important;flex-direction:column;gap:6px;margin:10px 0;width:100%}#front-saves .slot{display:flex!important;flex-direction:row!important;align-items:center;gap:10px;background:#0b0908;border:2px solid #3a3026;padding:6px 10px;width:100%;box-sizing:border-box}#front-saves .slot>div{display:block!important;flex:1}
    .slot>div{flex:1}.slot b{display:block;color:#eadfce}.slot small{color:#9a8e7e;font-size:12px}.slot .seg{flex:0 0 auto;padding:5px 12px}.slot.empty{opacity:.7}
    .slot canvas{width:40px;height:56px;image-rendering:pixelated}`; document.head.appendChild(st); }
  box.querySelectorAll('canvas[data-i]').forEach(c=>{ const s=readSlot(+c.dataset.i); const g=c.getContext('2d'); g.imageSmoothingEnabled=false;
    drawHuman(g,10,26,{face:'down',phase:0,moving:false,look:s.look||randomLook(),weapon:s.p&&s.p.weapon||'fists',wAng:-.6,head:s.equip&&s.equip.head,body:s.equip&&s.equip.body}); });
  box.querySelectorAll('[data-play]').forEach(b=>b.onclick=()=>{ curSlot=+b.dataset.play; closeFront(); continueGame(); });
  box.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{ const s=readSlot(+b.dataset.del); if(confirm(`Apagar ${s.name} para sempre?`)){ localStorage.removeItem(SLOT_KEY(+b.dataset.del)); renderSlots(); } });
  box.querySelectorAll('[data-new]').forEach(b=>b.onclick=()=>{ curSlot=+b.dataset.new; closeFront(); startStory(); });
  document.getElementById('saves-close').onclick=closeFront;
}
continueGame = function(){
  const s=readSlot(curSlot); if(!s){ toast('Nenhum jogo salvo.'); return; }
  try{ applySave(s); } catch(e){ alertBox(e.message==='world' ? 'Este save é de um mapa antigo — crie um personagem novo.' : 'Não foi possível carregar este save.'); return; }
  enterGame(`Bem-vindo de volta, ${player.name}. Dia ${day}.`);
};
document.getElementById('t-saves').onclick=()=>{ renderSlots(); openFront('front-saves'); };
document.getElementById('t-saves').textContent='Personagens';
document.getElementById('t-new').onclick=()=>{ const i=firstEmptySlot(); if(i<0){ renderSlots(); openFront('front-saves'); toast('Os 8 espaços estão cheios — apague um personagem.'); return; } curSlot=i; startStory(); };
refreshContinue = function(){};
buildCreateUI();

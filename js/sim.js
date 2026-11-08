'use strict';
// =====================================================================
// OUTREMER — jogadores simulados (portado do systems/sim.js do 3D): entram e saem do
// "servidor", andam pela cidade, caçam no mato, conversam no local/global/guilda/sussurro,
// respondem ao que você escreve, recrutam para guildas, declaram guerras e chamam raids.
// Nomes, guildas e frases: dados do 3D (D3). Carrega depois de magic.js; o diário fica em hud.js.
// =====================================================================
const rndS = a => a[Math.floor(Math.random()*a.length)];
const chanceS = p => Math.random() < p;
const betweenS = (a,b) => a + Math.random()*(b-a);
const PERS_DO_ESTILO = { gamer:['pvper','pvper','farmador','troll'], fantasia:['farmador','novato','comerciante','pvper'], rp_historico:['roleplayer','roleplayer','roleplayer','comerciante'],
  br_zoeira:['troll','troll','novato','pvper'], simples:['novato','farmador','comerciante','novato'], numero:['farmador','pvper','troll','novato'] };
const GUILDA_COMBINA = { rp:['roleplayer','comerciante'], pvp:['pvper','troll','farmador'], trade:['comerciante','farmador'], farm:['farmador','novato'] };
const COR_NOME = { inocente:'#6ab0ff', aliado:'#5ee07a', inimigo:'#ffa040' };

const Chat = {
  byKey:{}, pers:{}, recent:[],
  init(){
    for(const p of D3['chat/personalities'].personalities) this.pers[p.id]=p;
    for(const l of D3['chat/lines'].lines) for(const p of l.p) (this.byKey[p+'|'+l.ctx] ||= []).push(l);
    this.places=[]; for(const b of D3['lore/biomes'].biomes||[]) for(const c of b.cities||[]) this.places.push(typeof c.name==='string'?c.name:c.name.pt);
    if(!this.places.length) this.places=['Aurélia'];
    this.items=BASE3D.filter(i=>['weapon','armor','shield','jewelry','clothing'].includes(i.type)).map(i=>i.name.toLowerCase());
    this.bosses=(D3['names/bosses'].bosses||[]).map(b=>typeof b.name==='string'?b.name:b.name.pt);
    this.skillNames=Object.values(SKILL_NAMES);
  },
  has(p,ctx){ return !!this.byKey[p+'|'+ctx]; },
  pick(p,ctx,vars){ const pool=this.byKey[p+'|'+ctx]; if(!pool) return null; let l,t=0;
    do{ l=rndS(pool); } while(this.recent.includes(l.id) && t++<6); this.recent.push(l.id); if(this.recent.length>40) this.recent.shift();
    let s=typeof l.text==='string'?l.text:l.text.pt; s=s.replace(/\{(\w+)\}/g,(m,k)=>this.fill(k,vars)); return { text:this.noise(s,this.pers[p]), ch:l.ch }; },
  fill(k,v){ if(v && v[k]!=null) return v[k];
    switch(k){ case 'place': return rndS(this.places); case 'item': return rndS(this.items); case 'skill': return rndS(this.skillNames); case 'boss': return rndS(this.bosses)||'o Dragão Vermelho';
      case 'price': return String((1+Math.floor(Math.random()*40))*50); case 'n': return String(2+Math.floor(Math.random()*8)); default: return '?'; } },
  noise(t,p){ if(!p) return t;
    if(Math.random()<p.typo){ const w=t.split(' '), i=Math.floor(Math.random()*w.length), s=w[i]; if(s.length>3){ const k=1+Math.floor(Math.random()*(s.length-2)), r=Math.random();
      w[i]= r<.4 ? s.slice(0,k)+s[k+1]+s[k]+s.slice(k+2) : r<.75 ? s.slice(0,k)+s.slice(k+1) : s.slice(0,k)+s[k]+s.slice(k); } t=w.join(' '); }
    if(Math.random()<p.caps) t=t.toUpperCase(); if(Math.random()<p.emoji) t+=' '+rndS([':)',':P','xD','^^',':D','kkk',';)',':(']); return t; },
};

// visual de cada jogador: peças reais do jogo (as mesmas que você encontra)
const SIM_KITS = [
  ()=>({ body:rndS(['peasant_tunic','wool_tunic','linen_shirt']), legs:'cloth_pants', feet:'cloth_sandals', weapon:rndS(['dagger','club','hatchet','staff']) }),
  ()=>({ body:rndS(['loriga','lorigao','gambeson','leather_armor','studded_leather','hauberk']), legs:'chain_greaves', feet:rndS(['chain_boots','leather_boots']), hands:rndS(['chain_gloves','leather_gloves']), head:rndS(['nasal_helm','chain_coif','kettle_helm']), shield:chanceS(.6)?rndS(['round_shield','heater_shield','kite_shield']):null, weapon:rndS(['longsword','mace','spear','battleaxe','sword']) }),
  ()=>({ body:rndS(['templar_cuirass','crusader_surcoat','sergeant_cuirass','plate_torso']), legs:rndS(['chain_greaves','plate_legs']), feet:'chain_boots', hands:'chain_gloves', head:rndS(['greathelm','bascinet','nasal_helm']), cloak:chanceS(.5)?'templar_mantle':null, shield:'crusader_shield', weapon:rndS(['longsword','arming_sword','flanged_mace']) }),
  ()=>({ body:rndS(['bedouin_robe','bedouin_vest']), legs:'bedouin_skirt', feet:'cloth_sandals', arms:'bedouin_sleeves', head:rndS(['turban','keffiyeh']), weapon:rndS(['scimitar','dagger','spear','sabre']), shield:chanceS(.4)?'round_shield':null }),
  ()=>({ body:rndS(['silk_robe','monk_robe']), head:'wizard_hat', feet:'cloth_sandals', weapon:rndS(['staff','wand','fire_staff','ice_staff']) }),
  ()=>({ body:rndS(['leather_armor','studded_leather','hide_tunic']), legs:'leather_leggings', feet:'leather_boots', head:rndS(['leather_hood','leather_cap']), cloak:chanceS(.5)?'travel_cloak':null, weapon:rndS(['bow','longbow','composite_bow','crossbow']) }),
  ()=>({ body:'pilgrim_habit', feet:'cloth_sandals', neck:'pilgrim_cross', weapon:rndS(['staff','quarterstaff']) }),
];
function simLook(s){
  const race=rndS(['humano','humano','humano','elfo','anao','pequenino']), R=RACES[race], sex=s.sex;
  const L={ sex, skin:rndS(R.skins), hair:rndS(R.hairs), style:sex==='f'?rndS(['long','ponytail','braid']):rndS(['short','short','buzz','bald','long']), beard:sex==='m'?(race==='anao'?3:rndS([0,0,1,2])):0,
    jacket:rndS(TUNICS), pants:'#4a3e30', boot:'#2a1e14', race };
  L.jacketD=darkHex(L.jacket);
  const kit=rndS(SIM_KITS)(), gi={};
  for(const [sl,id] of Object.entries(kit)) if(sl!=='weapon' && id && ITEMS[id] && WEAR[id]) gi[sl]=makeInst(id, chanceS(.15)?rndS(['refinado','raro']):'comum', 10);
  if(s.guild && gi.cloak){ gi.cloak.hue=null; }
  L.gi=gi; return { look:L, weapon:ITEMS[kit.weapon]?kit.weapon:'dagger' };
}

const Sim = {
  sims:[], guilds:[], wars:[], raids:[], invites:{}, t:0, nextGlobal:8, nextLogin:25, nextGuild:90, NEAR_MAX:8,
  init(){
    if(this.sims.length) return; Chat.init();
    this.guilds=D3['names/guilds'].guilds.map(g=>({...g, members:[]}));
    for(const p of D3['names/players'].players){
      const pers=rndS(PERS_DO_ESTILO[p.style]||['novato']);
      const s={ name:p.name, sex:p.sex==='f'?'f':'m', style:p.style, pers, guild:null, online:false, near:false, n:null, rel:'neutro' };
      if(chanceS(.6)){ const pref=this.guilds.filter(g=>(GUILDA_COMBINA[g.style]||[]).includes(pers)); s.guild=rndS(pref.length&&chanceS(.8)?pref:this.guilds); s.guild.members.push(s); }
      this.sims.push(s); }
    const caos=this.guilds.filter(g=>g.align==='caos'), ordem=this.guilds.filter(g=>g.align==='ordem');
    for(let k=0;k<2;k++){ const a=rndS(caos), b=rndS(ordem); if(a&&b&&!this.atWar(a,b)) this.wars.push({a,b}); }
    this.sims.slice().sort(()=>Math.random()-.5).slice(0,40).forEach(s=>{ s.online=true; s.where=rndS(Chat.places); });
  },
  online(){ return this.sims.filter(s=>s.online); },
  near(){ return this.sims.filter(s=>s.near && s.n); },
  atWar(a,b){ return this.wars.some(w=>(w.a===a&&w.b===b)||(w.a===b&&w.b===a)); },
  byName(n){ n=n.toLowerCase(); return this.sims.find(s=>s.name.toLowerCase()===n) || this.sims.find(s=>s.name.toLowerCase().startsWith(n)); },
  pguild(){ return player && player.guild ? this.guilds.find(g=>g.tag===player.guild) : null; },
  // põe um jogador no mundo perto de você (na cidade anda pelas ruas; no mato, caça)
  spawn(s){
    const inCity=playerInCity(); let spot=null;
    if(inCity && npcs.streets && npcs.streets.length){ for(let a=0;a<30;a++){ const st=rndS(npcs.streets); if(Math.hypot(st[0]*T-player.x,st[1]*T-player.y)<26*T){ spot=[st[0]*T+8,st[1]*T+12]; break; } } }
    else { const sp=openSpot(player.x+(Math.random()-.5)*20*T, player.y+(Math.random()-.5)*20*T, 6); if(sp) spot=sp; }
    if(!spot) return false;
    const {look,weapon}=simLook(s);
    const n={ id:50000+this.sims.indexOf(s), role:inCity?'citizen':'sim', sim:s, name:s.name, x:spot[0], y:spot[1], hx:spot[0], hy:spot[1], look, face:'down', phase:0, moving:false,
      hp:80+Math.random()*80, max:160, weapon, state:'idle', t:Math.random()*3, cd:0, wind:0, swingT:0, hurtT:0, alive:true, path:null, pathT:0, dead:false, equip:{} };
    n.max=n.hp; npcs.push(n); s.n=n; s.near=true; s.online=true; return true;
  },
  despawn(s){ if(s.n){ s.n.gone=true; s.n=null; } s.near=false; },
  color(s){ const pg=this.pguild(); if(pg && s.guild===pg) return COR_NOME.aliado; if(pg && s.guild && this.atWar(pg,s.guild)) return COR_NOME.inimigo; return COR_NOME.inocente; },
  vars(s,extra){ const o=this.online().filter(x=>x!==s); return { player:player?player.name:'', name:s.name, target:(rndS(o)||s).name, guild:s.guild?s.guild.name:'Sem Guilda', tag:s.guild?s.guild.tag:'', ...extra }; },
  say(s,ctx,extra,forceCh){
    if(!s.online) return false; const r=Chat.pick(s.pers,ctx,this.vars(s,extra)); if(!r) return false;
    let ch=forceCh||r.ch; const pg=this.pguild();
    if(ch==='local' && !s.near) ch='global';
    if(ch==='guild' && !(pg && pg===s.guild)) ch=s.near?'local':'global';
    if(ch==='party') ch=s.near?'local':'global';
    if(ch==='whisper' && !(extra && extra.target===player.name)) ch=s.near?'local':'global';
    const who = s.guild && ch!=='guild' ? `${s.name} [${s.guild.tag}]` : s.name;
    Journal.add(ch, who, r.text, this.color(s));
    if(ch==='local' && s.n) s.n.say={ text:r.text, until:performance.now()+2800+r.text.length*55 };
    return true;
  },
  speaker(ctx,f=()=>true){ const c=this.online().filter(s=>Chat.has(s.pers,ctx)&&f(s)); return c.length?rndS(c):null; },
  hear(text,ch,whisperTo){
    const low=text.toLowerCase();
    const greet=/\b(oi+|ol[aá]|eae|e a[ií]|salve|bom dia|boa (tarde|noite)|hail|hi|hello|hey)\b/.test(low), ask=/\?|\b(como|onde|algu[eé]m|quem|qual|ajuda|help)\b/.test(low);
    const rude=/\b(noob|lixo|merda|idiota|burro|otario|otário|lammer|lamer|fdp)\b/.test(low), trade=/\b(wts|wtb|vendo|compro|troco|pre[cç]o)\b/.test(low);
    const lfg=/\b(lfg|grupo|party|pt|raid|bora|vamos)\b/.test(low), thanks=/\b(vlw|valeu|obrigad[oa]|brigad[oa]|thx|ty)\b/.test(low);
    const relCtx=s=>s.rel==='amigo'?'reply_friend':s.rel==='inimigo'?'reply_enemy':'reply_neutral', later=(fn,a=900,b=3200)=>setTimeout(fn,betweenS(a,b));
    if(whisperTo){ const s=this.byName(whisperTo); if(!s||!s.online){ Journal.add('system','',`${whisperTo} não está online.`); return; }
      if(greet||thanks) s.rel=s.rel==='inimigo'?'neutro':'amigo'; if(rude) s.rel='inimigo';
      const ctx=rude?'reply_enemy':ask&&Chat.has(s.pers,'help_give')?'help_give':greet&&chanceS(.5)?'greet':relCtx(s);
      later(()=>this.say(s,ctx,{target:player.name},'whisper'),1500,5000); return; }
    if(ch==='guild'){ const g=this.pguild(); if(!g) { Journal.add('system','','Você não está em uma guilda.'); return; } const m=g.members.filter(s=>s.online);
      if(m.length&&chanceS(.8)){ const s=rndS(m); later(()=>this.say(s,greet?'greet':lfg?'raid_call':ask?'help_give':'reply_friend',{target:player.name},'guild')); } return; }
    const ears=this.near().filter(s=>Math.hypot(s.n.x-player.x,s.n.y-player.y)<(ch==='global'?1e9:10*T));
    const pool=ch==='global'?this.online():ears, named=pool.filter(s=>low.includes(s.name.toLowerCase()));
    const n=named.length?1:ch==='global'?(chanceS(.6)?1:0)+(chanceS(.25)?1:0):Math.min(pool.length,(chanceS(.75)?1:0)+(chanceS(.3)?1:0)), used=new Set();
    for(let k=0;k<n;k++){ const c=(named.length?named:pool).filter(s=>!used.has(s)); let s,ctx;
      if(rude){ s=rndS(c); if(s) s.rel='inimigo'; ctx='reply_enemy'; } else if(trade){ s=c.find(x=>x.pers==='comerciante')||rndS(c); ctx='trade_haggle'; }
      else if(ask){ s=c.find(x=>Chat.has(x.pers,'help_give'))||rndS(c); ctx='help_give'; } else if(lfg){ s=rndS(c); ctx='lfg'; }
      else if(greet){ s=rndS(c); ctx=chanceS(.5)?'greet':'reply_friend'; } else if(thanks){ s=rndS(c); ctx='reply_friend'; } else { s=rndS(c); ctx=s?relCtx(s):null; }
      if(!s) break; used.add(s); if(!Chat.has(s.pers,ctx)) ctx=relCtx(s);
      if(s.n) s.n.face=faceFromAng(Math.atan2(player.y-s.n.y,player.x-s.n.x));
      later(()=>this.say(s,ctx,{target:player.name},ch==='global'?'global':null),900+k*1600,3000+k*2200); }
  },
  accept(){ const iv=this.invites.last; if(!iv){ Journal.add('system','','Nenhum convite de guilda pendente.'); return; }
    player.guild=iv.guild.tag; Journal.add('system','',`Você entrou na guilda ${iv.guild.name} [${iv.guild.tag}].`); toast(`Bem-vindo à ${iv.guild.name}!`); this.invites.last=null;
    iv.guild.members.filter(s=>s.online).slice(0,3).forEach((s,i)=>setTimeout(()=>this.say(s,'greet',{target:player.name},'guild'),1500+i*1800)); },
  leave(){ const g=this.pguild(); if(!g){ Journal.add('system','','Você não está em uma guilda.'); return; } player.guild=null; Journal.add('system','',`Você saiu da guilda ${g.name}.`); },
  update(dt){
    this.t+=dt;
    // quantos andam perto de você: cidade cheia, mato com alguns caçando
    const inCity=playerInCity(), want=inCity?this.NEAR_MAX:(Math.floor(this.t/60)%3===0?3:1);
    for(const s of this.near()){ const d=Math.hypot(s.n.x-player.x,s.n.y-player.y); if(d>75*T || s.n.dead || (inCity!==(s.n.role==='citizen'))) this.despawn(s); }
    if(this.near().length<want && chanceS(dt*.5)){ const s=rndS(this.online().filter(x=>!x.near)); if(s) this.spawn(s); }
    for(const s of this.near()){ const n=s.n;
      if(n.role==='sim'){ if(Math.hypot(n.hx-player.x,n.hy-player.y)>30*T || chanceS(dt*.05)){ n.hx=player.x+(Math.random()-.5)*24*T; n.hy=player.y+(Math.random()-.5)*24*T; } }
      if(chanceS(dt*.012)){ const ctx=rndS(s.pers==='comerciante'?['trade_sell','trade_buy','idle']:n.role==='sim'?['hunt','hunt','idle','loot_drop','brag']:['idle','idle','lfg','brag','help_ask','complain_server']); this.say(s,ctx,null,'local'); }
      if(chanceS(dt*.004) && Math.hypot(n.x-player.x,n.y-player.y)<6*T){ n.face=faceFromAng(Math.atan2(player.y-n.y,player.x-n.x)); this.say(s,chanceS(.5)?'greet':'help_ask',{target:player.name},'local'); } }
    if(this.t>this.nextGlobal){ this.nextGlobal=this.t+betweenS(14,32); this.globalEvent(); }
    if(this.t>this.nextLogin){ this.nextLogin=this.t+betweenS(12,35); this.churn(); }
    if(this.t>this.nextGuild){ this.nextGuild=this.t+betweenS(120,260); this.guildEvent(); }
    for(const r of this.raids.slice()) if(this.t>r.end){ this.raids.splice(this.raids.indexOf(r),1); const s=rndS(r.guild.members.filter(m=>m.online)); if(!s) continue;
      const win=chanceS(.55), pg=this.pguild(); this.say(s,win?'raid_win':'raid_wipe',{boss:r.boss},pg===r.guild?'guild':'global');
      if(win&&chanceS(.6)) setTimeout(()=>{ const o=rndS(r.guild.members.filter(m=>m.online)); o&&this.say(o,'loot_rare',null,pg===r.guild?'guild':'global'); },4000); }
  },
  globalEvent(){
    const ctx=rndS(['trade_sell','trade_sell','trade_buy','lfg','lfg','complain_server','loot_rare','death_self','brag','guild_recruit','help_ask','boss_spawn','trade']);
    const s=this.speaker(ctx,x=>!x.near||ctx==='guild_recruit'); if(!s) return;
    if(ctx==='guild_recruit'){ if(!s.guild||player.guild) return; this.say(s,ctx,null,'global');
      if(chanceS(.35)) setTimeout(()=>{ if(player.guild||!running) return; this.invites.last={guild:s.guild,from:s};
        Journal.add('whisper',s.name,`${player.name}, quer entrar na ${s.guild.name}?`, this.color(s));
        openActions(`${s.name} convida você para a guilda ${s.guild.name} [${s.guild.tag}]`, [[`"${s.guild.motto||''}"`,null],['Aceitar',()=>this.accept()],['Recusar',()=>{ this.invites.last=null; }]]); },3500);
      return; }
    this.say(s,ctx,null,'global');
    if(chanceS(.15)) setTimeout(()=>{ const o=this.speaker('reply_neutral',x=>x!==s); o&&this.say(o,rndS(['reply_neutral','reply_friend','reply_enemy']),{target:s.name},'global'); },betweenS(2500,6000));
    const pg=this.pguild(); if(pg && chanceS(.25)){ const m=this.speaker(rndS(['idle','lfg','brag','help_ask','reply_friend']),x=>x.guild===pg); m&&setTimeout(()=>this.say(m,rndS(['idle','lfg','brag','help_ask','reply_friend']),null,'guild'),betweenS(3000,8000)); }
  },
  churn(){ const on=this.online(), off=this.sims.filter(s=>!s.online);
    if(on.length>30&&chanceS(.6)){ const s=rndS(on.filter(x=>!x.near)); if(s){ s.online=false; if(chanceS(.2)) Journal.add('system','',`${s.name} saiu.`); } }
    if(off.length&&on.length<55&&chanceS(.7)){ const s=rndS(off); s.online=true; s.where=rndS(Chat.places); if(chanceS(.3)) setTimeout(()=>this.say(s,'greet',null,'global'),1500); } },
  guildEvent(){ const r=Math.random(), pg=this.pguild();
    if(r<.35){ const a=rndS(this.guilds.filter(g=>g.align!=='ordem')), b=a&&rndS(this.guilds.filter(g=>g!==a&&g.align!==a.align)); if(!a||!b||this.atWar(a,b)) return;
      const s=rndS(a.members.filter(m=>m.online)); if(!s) return; this.wars.push({a,b}); if(this.wars.length>4) this.wars.shift();
      this.say(s,'guild_war_declare',{target:b.name,guild:a.name},'global'); Journal.add('system','',`A guilda ${a.name} [${a.tag}] declarou guerra à ${b.name} [${b.tag}].`);
      setTimeout(()=>{ const o=rndS(b.members.filter(m=>m.online)); o&&this.say(o,'guild_war_taunt',{target:a.name},'global'); },betweenS(3000,9000)); }
    else if(r<.65){ const w=rndS(this.wars); if(!w) return; const g=chanceS(.5)?w.a:w.b, o=g===w.a?w.b:w.a; const s=rndS(g.members.filter(m=>m.online)); s&&this.say(s,'guild_war_taunt',{target:o.name},'global'); }
    else { const g=rndS(this.guilds.filter(x=>x.members.some(m=>m.online))); const s=g&&rndS(g.members.filter(m=>m.online)); if(!s) return;
      const boss=Chat.fill('boss'); this.say(s,'raid_call',{boss},pg===g?'guild':'global'); this.raids.push({guild:g,boss,end:this.t+betweenS(90,240)}); } },
};
function playerInCity(){ if(!player) return false; const i=idx(Math.floor(player.x/T),Math.floor(player.y/T)); return regionId[i]!==255 && regions[regionId[i]] && regions[regionId[i]].kind==='city'; }

// ---------------- ligações com o jogo ----------------
const _updS = update;
update = function(dt){ _updS(dt); if(running && player){ Sim.init(); Sim.update(dt); } };
// nome colorido e balão de fala em cima de cada jogador
const _drawNPCs = drawNPC;
drawNPC = function(g,n,sx,sy){
  if(!n.sim) return _drawNPCs(g,n,sx,sy);
  let a; if(n.wind>0) a=n.aimAng-1.3; else if(n.swingT>0) a=n.aimAng-1.3+2.6*(1-n.swingT/.2); else a=FACE_ANG[n.face]+0.9;
  drawHuman(g,sx,sy,{face:n.face,phase:n.phase,moving:n.moving,look:n.look,flash:n.hurtT>0,weapon:n.weapon,wAng:a,gi:n.look.gi});
  const s=n.sim, label=s.name+(s.guild?` [${s.guild.tag}]`:''); g.font='6px "Pixelify Sans",monospace'; g.textAlign='center';
  g.fillStyle='#000'; g.fillText(label,sx+1,sy-29); g.fillStyle=Sim.color(s); g.fillText(label,sx,sy-30);
  if(n.hp<n.max){ g.fillStyle='#000'; g.fillRect(sx-6,sy-28,12,2); g.fillStyle='#6ad06a'; g.fillRect(sx-5,sy-28,Math.max(0,Math.round(10*n.hp/n.max)),1); }
  if(n.say && performance.now()<n.say.until){ const t=n.say.text.length>46?n.say.text.slice(0,44)+'…':n.say.text, w=Math.min(150,g.measureText(t).width+6);
    g.fillStyle='rgba(20,16,12,.85)'; g.fillRect(sx-w/2,sy-46,w,10); g.fillStyle='#f0e6d0'; g.fillText(t,sx,sy-38); }
  g.textAlign='left';
};
// conversar com um jogador
const _talkS = talkTo;
talkTo = function(n){
  if(!n.sim) return _talkS(n);
  const s=n.sim; n.face=faceFromAng(Math.atan2(player.y-n.y,player.x-n.x));
  const r=Chat.pick(s.pers,s.rel==='amigo'?'reply_friend':'greet',Sim.vars(s,{target:player.name}));
  const acts=[[`${s.name}${s.guild?' ['+s.guild.tag+'] — '+s.guild.name:''}`,null]];
  if(r) acts.push([`"${r.text}"`,null]);
  acts.push(['Cumprimentar', ()=>{ s.rel=s.rel==='inimigo'?'neutro':'amigo'; Journal.add('local',player.name,`Salve, ${s.name}!`,'#e8c070'); Sim.hear(`salve ${s.name}`,'local'); }]);
  acts.push(['Caçar juntos (grupo)', ()=>{ if(s.pers==='troll'&&chanceS(.5)){ Sim.say(s,'reply_enemy',{target:player.name},'local'); return; }
    n.role='member'; n.state='follow'; n.partyT=300; Journal.add('system','',`${s.name} entrou no seu grupo.`); Sim.say(s,'lfg',{target:player.name},'local'); }]);
  acts.push(['Sussurrar…', ()=>Journal.focus(`/w ${s.name} `)]);
  if(s.pers==='comerciante'){ if(!n.stock){ n.stock=[]; for(let k=0;k<5;k++){ const it=rndS(BASE3D.filter(i=>['weapon','armor','shield','jewelry'].includes(i.type))); n.stock.push({id:it.id,qty:1}); } n.title='mercador'; }
    acts.push(['Ver o que está vendendo', ()=>openTrade(n)]); }
  if(s.guild && !player.guild) acts.push([`Pedir para entrar na ${s.guild.name}`, ()=>{ if(chanceS(.6)){ Sim.invites.last={guild:s.guild,from:s}; Sim.accept(); } else Sim.say(s,'reply_neutral',{target:player.name},'local'); }]);
  acts.push(['Até mais',null]); openActions(s.name, acts);
};
// grupo dura um tempo; jogadores que morrem caçando voltam a "logar" mais tarde
const _updN = updateNPCs;
updateNPCs = function(dt){ _updN(dt);
  for(const n of npcs){ if(!n.sim) continue;
    if(n.role==='member'){ n.partyT-=dt; if(n.partyT<=0){ n.role=playerInCity()?'citizen':'sim'; n.state='idle'; Journal.add('system','',`${n.sim.name} saiu do seu grupo.`); Sim.say(n.sim,'bye',null,'local'); } }
    if(n.dead && !n.gone){ const s=n.sim; Sim.say(s,'death_self',null,'global'); n.gone=true; s.near=false; s.n=null; } } };
const _dmgNPC = damageNPC;
damageNPC = function(n,dmg,ang,src){ if(n.sim && src===player) return; return _dmgNPC(n,dmg,ang,src); };
// salvar a guilda do jogador
const _serS = serialize; serialize = function(){ const s=_serS(); s.guild=player.guild||null; s.npcs=(s.npcs||[]).filter(x=>x.id<50000); return s; };
const _appS = applySave; applySave = function(s){ _appS(s); player.guild=s.guild||null; };

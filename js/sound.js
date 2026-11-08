'use strict';
// =====================================================================
// OUTREMER — som feito na hora (Web Audio, sem arquivos): música medieval por lugar
// (cidade, campo, deserto, norte, masmorra, combate), ambiente (vento, pássaros, grilos),
// e efeitos de golpe, magia, morte, moedas, sinos, berrante e o rugido do dragão.
// =====================================================================
const SND = { ctx:null, master:null, music:null, sfx:null, amb:null, vol:{music:.5, sfx:.7}, mood:null, nextNote:0, step:0 };
try{ Object.assign(SND.vol, JSON.parse(localStorage.getItem('outremer_vol')||'{}')); }catch(e){}
function sndInit(){ if(SND.ctx) return; const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return;
  const c=SND.ctx=new AC(); SND.master=c.createGain(); SND.master.connect(c.destination);
  SND.music=c.createGain(); SND.music.gain.value=SND.vol.music*.35; SND.music.connect(SND.master);
  SND.sfx=c.createGain(); SND.sfx.gain.value=SND.vol.sfx*.6; SND.sfx.connect(SND.master);
  SND.amb=c.createGain(); SND.amb.gain.value=SND.vol.music*.25; SND.amb.connect(SND.master);
  const rev=c.createConvolver(), len=c.sampleRate*1.6, buf=c.createBuffer(2,len,c.sampleRate); for(let ch=0;ch<2;ch++){ const d=buf.getChannelData(ch); for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.5); }
  rev.buffer=buf; SND.rev=c.createGain(); SND.rev.gain.value=.25; rev.connect(SND.master); SND.rev.connect(rev);
  SND.noise=c.createBuffer(1,c.sampleRate*2,c.sampleRate); const nd=SND.noise.getChannelData(0); for(let i=0;i<nd.length;i++) nd[i]=Math.random()*2-1; }
addEventListener('pointerdown',()=>{ sndInit(); if(SND.ctx&&SND.ctx.state==='suspended') SND.ctx.resume(); },{capture:true});
addEventListener('keydown',()=>{ sndInit(); if(SND.ctx&&SND.ctx.state==='suspended') SND.ctx.resume(); },{capture:true});
function tone(f,dur,o={}){ const c=SND.ctx; if(!c) return; const t=(o.at||c.currentTime), os=c.createOscillator(), g=c.createGain();
  os.type=o.type||'triangle'; os.frequency.setValueAtTime(f,t); if(o.to) os.frequency.exponentialRampToValueAtTime(o.to,t+dur);
  const v=o.vol??.3; g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(v,t+(o.att||.01)); g.gain.exponentialRampToValueAtTime(.0005,t+dur);
  os.connect(g); g.connect(o.bus||SND.sfx); if(o.rev) g.connect(SND.rev); os.start(t); os.stop(t+dur+.05); }
function noise(dur,o={}){ const c=SND.ctx; if(!c) return; const t=o.at||c.currentTime, s=c.createBufferSource(), f=c.createBiquadFilter(), g=c.createGain();
  s.buffer=SND.noise; f.type=o.ft||'bandpass'; f.frequency.setValueAtTime(o.f||1200,t); if(o.fto) f.frequency.exponentialRampToValueAtTime(o.fto,t+dur); f.Q.value=o.q||1;
  const v=o.vol??.3; g.gain.setValueAtTime(v,t); g.gain.exponentialRampToValueAtTime(.0005,t+dur); s.connect(f); f.connect(g); g.connect(o.bus||SND.sfx); if(o.rev) g.connect(SND.rev); s.start(t); s.stop(t+dur+.05); }
const SFX = {
  swing:()=>noise(.15,{f:900,fto:2400,q:.8,vol:.18}),
  hit:()=>{ noise(.12,{f:400,q:1.5,vol:.35}); tone(110,.12,{type:'square',vol:.12,to:60}); },
  clang:()=>{ tone(880,.35,{type:'square',vol:.08,rev:true}); tone(1320,.25,{vol:.06}); noise(.08,{f:3000,vol:.15}); },
  hurt:()=>{ tone(180,.18,{type:'sawtooth',vol:.15,to:120}); noise(.1,{f:600,vol:.2}); },
  death:()=>{ tone(140,.5,{type:'sawtooth',vol:.15,to:50}); noise(.4,{f:300,fto:100,vol:.2}); },
  coin:()=>{ tone(1568,.12,{type:'square',vol:.06}); tone(2093,.18,{type:'square',vol:.05,at:SND.ctx.currentTime+.06}); },
  chime:()=>{ [523,659,784,1047].forEach((f,i)=>tone(f,.6,{vol:.08,at:SND.ctx.currentTime+i*.08,rev:true})); },
  spell:(el)=>{ const f={fire:300,cold:900,energy:600,poison:400}[el]||700; tone(f,.4,{type:'sine',vol:.12,to:f*2.2,rev:true}); noise(.35,{f:f*3,fto:f*6,q:4,vol:.08,rev:true}); },
  heal:()=>{ [392,494,587,784].forEach((f,i)=>tone(f,.9,{type:'sine',vol:.07,at:SND.ctx.currentTime+i*.1,rev:true})); },
  bell:()=>{ [196,392,588].forEach(f=>tone(f,2.6,{type:'sine',vol:.12,rev:true})); },
  horn:()=>{ const t=SND.ctx.currentTime; tone(146,1.2,{type:'sawtooth',vol:.12,att:.2,at:t,rev:true}); tone(220,1.4,{type:'sawtooth',vol:.1,att:.25,at:t+.9,rev:true}); },
  roar:()=>{ noise(2.2,{f:300,fto:80,q:2,vol:.6,ft:'lowpass',rev:true}); tone(70,2,{type:'sawtooth',vol:.3,to:40,att:.3}); },
  chop:()=>{ noise(.08,{f:700,q:2,vol:.3}); tone(220,.08,{type:'square',vol:.06}); },
  pick:()=>{ tone(1200,.1,{type:'square',vol:.08}); noise(.06,{f:4000,vol:.12}); },
  portal:()=>{ tone(200,1.2,{type:'sine',vol:.15,to:1200,rev:true}); noise(1,{f:2000,fto:400,q:3,vol:.1,rev:true}); },
  click:()=>tone(900,.04,{type:'square',vol:.04}),
};
const sfx=(k,a)=>{ try{ if(SND.ctx && SFX[k]) SFX[k](a); }catch(e){} };
// ---------------- música por lugar (modos medievais, alaúde e bordão) ----------------
const MODES = { town:{scale:[0,2,3,5,7,9,10], root:57, tempo:.32, inst:'triangle', drone:true}, wild:{scale:[0,2,3,5,7,8,10], root:52, tempo:.5, inst:'triangle', drone:true, sparse:.45},
  desert:{scale:[0,1,4,5,7,8,10], root:55, tempo:.34, inst:'sawtooth', drone:true}, north:{scale:[0,2,3,5,7,8,10], root:50, tempo:.6, inst:'sine', drone:true, sparse:.5},
  dungeon:{scale:[0,1,3,5,6,8,10], root:40, tempo:.8, inst:'sine', drone:true, sparse:.6}, combat:{scale:[0,2,3,5,7,8,10], root:45, tempo:.18, inst:'sawtooth', drone:true, drum:true} };
function moodNow(){ if(!player) return null; if(dungeonLevel(player.x,player.y)) return 'dungeon';
  if(raiders.some(r=>r.state==='chase'&&Math.hypot(r.x-player.x,r.y-player.y)<10*T)) return 'combat';
  const r=regionAt(player.x,player.y); if(r && r.style==='levant') return 'desert'; if(r) return 'town';
  const c=cellAt(Math.floor(player.x/T),Math.floor(player.y/T)); if(c && c.b==='o') return 'desert'; if(c && c.b==='n') return 'north'; return 'wild'; }
let melody=[]; function newPhrase(M){ melody=[]; let d=0; for(let i=0;i<16;i++){ d=Math.max(0,Math.min(M.scale.length*2-1,d+Math.round((Math.random()-.5)*3))); melody.push(Math.random()<(M.sparse||.15)?null:d); } }
function musicTick(){
  const c=SND.ctx; if(!c || !running || SND.vol.music<=0) return; const m=moodNow(); if(!m) return;
  if(m!==SND.mood){ SND.mood=m; newPhrase(MODES[m]); SND.step=0; SND.nextNote=c.currentTime+.1; }
  const M=MODES[m];
  while(SND.nextNote < c.currentTime+.25){ const t=SND.nextNote, s=SND.step%16;
    if(s===0 && SND.step>0 && Math.random()<.5) newPhrase(M);
    const d=melody[s]; if(d!=null){ const oct=Math.floor(d/M.scale.length), note=M.root+12+M.scale[d%M.scale.length]+12*oct, f=440*Math.pow(2,(note-69)/12);
      tone(f,M.tempo*1.8,{type:M.inst,vol:M.inst==='sawtooth'?.04:.09,at:t,bus:SND.music,rev:true}); if(M.inst!=='sine') tone(f*2,M.tempo*.6,{type:'sine',vol:.02,at:t,bus:SND.music}); }
    if(M.drone && s%8===0){ const f=440*Math.pow(2,(M.root-69)/12); tone(f,M.tempo*8.5,{type:'sine',vol:.05,att:.6,at:t,bus:SND.music}); tone(f*1.5,M.tempo*8.5,{type:'sine',vol:.025,att:.6,at:t,bus:SND.music}); }
    if(M.drum && s%4===0){ noise(.15,{f:120,ft:'lowpass',vol:.25,at:t,bus:SND.music}); }
    SND.step++; SND.nextNote+=M.tempo; }
}
let ambT=0;
function ambientTick(dt){ if(!SND.ctx||!running||!player) return; ambT-=dt; if(ambT>0) return; ambT=1.5+Math.random()*3;
  const night=darkness(time)>.3, m=SND.mood;
  if(m==='dungeon'){ if(Math.random()<.5) tone(1800+Math.random()*600,.08,{type:'sine',vol:.03,bus:SND.amb,rev:true}); return; }  // gotas
  if(m==='north'||m==='desert'){ noise(3,{f:500,fto:300,q:.5,vol:.06,bus:SND.amb,ft:'lowpass'}); return; }                     // vento
  if(night){ for(let i=0;i<3;i++) tone(4200,.05,{type:'square',vol:.01,at:SND.ctx.currentTime+i*.09,bus:SND.amb}); }           // grilos
  else if(m==='wild'||m==='town'){ const f=2000+Math.random()*1500; tone(f,.12,{type:'sine',vol:.03,to:f*1.3,bus:SND.amb}); tone(f*1.1,.1,{type:'sine',vol:.025,to:f*.9,at:SND.ctx.currentTime+.15,bus:SND.amb}); }
}
// ---------------- ligações com o jogo ----------------
const _updSnd = update; update = function(dt){ _updSnd(dt); musicTick(); ambientTick(dt); };
const _paS = playerAttack; playerAttack = function(a){ const cd=player.atkCd; _paS(a); if(player.atkCd>cd) sfx('swing'); };
const _dmgS = damageRaider; damageRaider = function(r,d,a,k,s){ sfx(r.equip&&r.equip.body&&WEAR[r.equip.body]&&/iron/.test(WEAR[r.equip.body].mat||'')?'clang':'hit'); return _dmgS(r,d,a,k,s); };
const _hpS = hurtPlayer; hurtPlayer = function(d,s,p,b){ const h=player.health; const r=_hpS(d,s,p,b); if(player.health<h) sfx('hurt'); return r; };
const _krS = killRaider; killRaider = function(r,a){ const M=MONS[r.mon]||{}; if(M.beast&&BEAST[M.beast]&&BEAST[M.beast].dr) sfx('roar'); else sfx('death'); return _krS(r,a); };
const _csS = castSpell; castSpell = function(id){ const m=player.mana; _csS(id); if(player.mana<m){ const E=SPELLS3[id].effect; if(E.type==='heal') sfx('heal'); else sfx('spell',E.element); } };
const _gsS = gainSkill; gainSkill = function(k,d){ const b=Math.floor(skill(k)); _gsS(k,d); if(Math.floor(skill(k))>b) sfx('chime'); };
const _dieS = die; die = function(){ const g=player.ghost; _dieS(); if(!g && player.ghost) sfx('bell'); };
const _toS = toast; toast = function(t){ _toS(t); if(/ouro|moedas/i.test(t)) sfx('coin'); if(/Berrante|horda se aproxima/i.test(t)) sfx('horn'); if(/GRANDE DRAGÃO|solta o sopro/i.test(t)) sfx('roar'); if(/despertou|reuniu/i.test(t)) sfx('horn'); if(/volta à vida|Deus seja louvado/i.test(t)) sfx('heal'); if(/atravessa o portal/i.test(t)) sfx('portal'); if(/Você faz|Obra excepcional/i.test(t)) sfx('clang'); };
const _fgS = finishGather; finishGather = function(g){ sfx(g.kind==='tree'?'chop':'pick'); return _fgS(g); };
// volumes: no menu de opções
(function(){ const box=document.querySelector('#front-options .create-box'); if(!box) return; const d=document.createElement('div');
  d.innerHTML=`<label class="opt">Música <input type="range" id="o-music" min="0" max="1" step="0.05" value="${SND.vol.music}"></label><label class="opt">Efeitos <input type="range" id="o-sfx" min="0" max="1" step="0.05" value="${SND.vol.sfx}"></label>`;
  box.insertBefore(d, box.querySelector('button')); const save=()=>{ try{ localStorage.setItem('outremer_vol',JSON.stringify(SND.vol)); }catch(e){} };
  document.getElementById('o-music').oninput=e=>{ SND.vol.music=+e.target.value; if(SND.music){ SND.music.gain.value=SND.vol.music*.35; SND.amb.gain.value=SND.vol.music*.25; } save(); };
  document.getElementById('o-sfx').oninput=e=>{ SND.vol.sfx=+e.target.value; if(SND.sfx) SND.sfx.gain.value=SND.vol.sfx*.6; save(); }; })();
// tecla N liga/desliga a música
addEventListener('keydown',e=>{ if(e.key.toLowerCase()==='n' && running && document.activeElement.tagName!=='INPUT'){ SND.vol.music = SND.vol.music>0 ? 0 : .5; if(SND.music){ SND.music.gain.value=SND.vol.music*.35; SND.amb.gain.value=SND.vol.music*.25; } toast(SND.vol.music>0?'Música ligada (N).':'Música desligada (N).'); } });

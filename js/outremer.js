'use strict';
// =====================================================================
// OUTREMER — sistemas do jogo por cima da engine do After Light.
// Carrega depois de game.js e npc.js: troca profissões por ofícios (skills que sobem com o uso),
// itens modernos por medievais, saqueadores por monstros, e os vendedores por lojas de cada ofício.
// =====================================================================

// ---------------- Skills (sobem com o uso, como no UO) ----------------
const SKILL_NAMES = { espadas:'Espadas', macas:'Maças', machados:'Machados', esgrima:'Esgrima', arcos:'Arcos', briga:'Briga', taticas:'Táticas', aparar:'Aparar',
  anatomia:'Anatomia', cura:'Cura', magia:'Magia', meditacao:'Meditação', ferraria:'Ferraria', mineracao:'Mineração', lenhador:'Lenhador', carpintaria:'Carpintaria',
  furtividade:'Furtividade', rastreamento:'Rastreamento', culinaria:'Culinária', comercio:'Comércio' };
function skill(k){ return (player && player.skills && player.skills[k]) || 0; }
function gainSkill(k, diff){
  if(!player.skills) player.skills={};
  const v=skill(k); if(v>=100) return;
  const total=Object.values(player.skills).reduce((a,b)=>a+b,0); if(total>=700) return;
  const ch=Math.max(0.05, 0.6 - v/180) * (diff||1);
  if(Math.random()<ch){ const nv=Math.min(100, Math.round((v + (v<30?0.5:v<60?0.3:0.1))*10)/10); player.skills[k]=nv;
    if(Math.floor(nv)>Math.floor(v)) toast(`Sua habilidade em ${SKILL_NAMES[k]||k} subiu para ${Math.floor(nv)}.`); }
}

// ---------------- Ofícios (no lugar das profissões modernas) ----------------
for(const k of Object.keys(PROFESSIONS)) delete PROFESSIONS[k];
Object.assign(PROFESSIONS, {
  guerreiro: { name:'Guerreiro',  desc:'Espadas 50 · Táticas 45 · Aparar 30 · Anatomia 25', skills:{espadas:50,taticas:45,aparar:30,anatomia:25}, bonuses:{ strength:1.15 } },
  arqueiro:  { name:'Arqueiro',   desc:'Arcos 50 · Táticas 40 · Rastreamento 35 · Lenhador 25', skills:{arcos:50,taticas:40,rastreamento:35,lenhador:25}, bonuses:{ accuracy:1.25 } },
  lanceiro:  { name:'Lanceiro',   desc:'Esgrima 50 · Táticas 40 · Aparar 35 · Anatomia 25', skills:{esgrima:50,taticas:40,aparar:35,anatomia:25}, bonuses:{ speed:1.08 } },
  barbaro:   { name:'Bárbaro',    desc:'Machados 50 · Táticas 45 · Briga 30 · Lenhador 30', skills:{machados:50,taticas:45,briga:30,lenhador:30}, bonuses:{ strength:1.25, maxStamina:1.15 } },
  templario: { name:'Templário',  desc:'Maças 50 · Aparar 40 · Cura 35 · Táticas 30', skills:{macas:50,aparar:40,cura:35,taticas:30}, bonuses:{ healPower:1.3 } },
  curandeiro:{ name:'Curandeiro', desc:'Cura 50 · Anatomia 40 · Meditação 30 · Briga 20', skills:{cura:50,anatomia:40,meditacao:30,briga:20}, bonuses:{ healPower:1.6, medCost:0.6 } },
  mago:      { name:'Mago',       desc:'Magia 50 · Meditação 40 · Briga 20 (magias na próxima etapa)', skills:{magia:50,meditacao:40,briga:20}, bonuses:{} },
  ferreiro:  { name:'Ferreiro',   desc:'Ferraria 55 · Mineração 50 · Maças 25 · Comércio 20', skills:{ferraria:55,mineracao:50,macas:25,comercio:20}, bonuses:{ tradePrice:0.9 } },
  ladino:    { name:'Ladino',     desc:'Furtividade 50 · Esgrima 40 · Rastreamento 30 · Comércio 25', skills:{furtividade:50,esgrima:40,rastreamento:30,comercio:25}, bonuses:{ speed:1.12, lootChance:1.25 } },
});
// só um ofício: ele define as skills iniciais; o resto sobe jogando
toggleProfession = function(id,el){
  selectedProfessions.length=0; document.querySelectorAll('#professions .prof').forEach(d=>d.classList.remove('selected'));
  selectedProfessions.push(id); el.classList.add('selected');
  document.getElementById('selected-count').textContent='Ofício: '+PROFESSIONS[id].name;
  document.getElementById('btn-start').disabled=false;
};

// ---------------- Itens medievais ----------------
const OW = { // armas: dmg base, alcance (px), arco do golpe, recarga, fôlego, empurrão, tamanho, cor, skill
  fists:    { name:'Punhos',          dmg:5,  range:15, arc:1.1, cd:.40, st:4,  knock:3, len:0, skill:'briga' },
  dagger:   { name:'Adaga',           dmg:11, range:18, arc:1.0, cd:.32, st:5,  knock:3, len:5,  col:'#c8ccd0', skill:'esgrima' },
  shortsword:{name:'Espada Curta',    dmg:16, range:22, arc:1.3, cd:.45, st:7,  knock:5, len:8,  col:'#c8ccd4', skill:'espadas' },
  longsword:{ name:'Espada Longa',    dmg:22, range:25, arc:1.5, cd:.58, st:9,  knock:6, len:10, col:'#d8dce4', skill:'espadas' },
  broadsword:{name:'Montante',        dmg:30, range:27, arc:1.7, cd:.78, st:13, knock:9, len:12, col:'#e0e4ec', skill:'espadas' },
  club:     { name:'Porrete',         dmg:14, range:22, arc:1.5, cd:.55, st:8,  knock:8, len:8,  col:'#7a5634', skill:'macas' },
  mace:     { name:'Maça',            dmg:21, range:23, arc:1.4, cd:.62, st:10, knock:9, len:9,  col:'#8a8e96', skill:'macas' },
  warhammer:{ name:'Martelo de Guerra',dmg:31,range:24, arc:1.3, cd:.85, st:14, knock:12,len:10, col:'#9aa0a8', skill:'macas' },
  hand_axe: { name:'Machadinha',      dmg:17, range:22, arc:1.2, cd:.5,  st:8,  knock:6, len:8,  col:'#8a8e92', skill:'machados' },
  battleaxe:{ name:'Machado de Batalha',dmg:29,range:25,arc:1.4, cd:.8,  st:13, knock:9, len:11, col:'#a0a4aa', skill:'machados' },
  spear:    { name:'Lança',           dmg:20, range:33, arc:.6,  cd:.55, st:8,  knock:5, len:13, col:'#7a5a38', skill:'esgrima' },
  staff:    { name:'Cajado',          dmg:12, range:26, arc:1.3, cd:.5,  st:6,  knock:7, len:12, col:'#6a4a2c', skill:'macas' },
  bow:      { name:'Arco Curto',      dmg:24, range:230, cd:.9, spread:.06, noise:4, ranged:true, ammo:'arrows', len:7, col:'#7a5430', skill:'arcos' },
  longbow:  { name:'Arco Longo',      dmg:36, range:300, cd:1.15,spread:.04, noise:4, ranged:true, ammo:'arrows', len:9, col:'#6a4424', skill:'arcos' },
  // armas naturais dos monstros (não aparecem na mão)
  claw:     { name:'Garras', dmg:10, range:16, arc:1, cd:.6, st:0, knock:3, len:0 },
  bite:     { name:'Mordida', dmg:12, range:16, arc:1, cd:.7, st:0, knock:4, len:0 },
  bone:     { name:'Osso', dmg:14, range:20, arc:1.2, cd:.6, st:0, knock:5, len:7, col:'#d8d0b8' },
};
Object.assign(WEAPONS, OW);
const OITEMS = {
  dagger:{name:'Adaga',stack:1,weapon:true}, shortsword:{name:'Espada Curta',stack:1,weapon:true}, longsword:{name:'Espada Longa',stack:1,weapon:true},
  broadsword:{name:'Montante',stack:1,weapon:true}, club:{name:'Porrete',stack:1,weapon:true}, mace:{name:'Maça',stack:1,weapon:true},
  warhammer:{name:'Martelo de Guerra',stack:1,weapon:true}, hand_axe:{name:'Machadinha',stack:1,weapon:true,desc:'Corta árvores e inimigos.'},
  battleaxe:{name:'Machado de Batalha',stack:1,weapon:true}, spear:{name:'Lança',stack:1,weapon:true}, staff:{name:'Cajado',stack:1,weapon:true},
  bow:{name:'Arco Curto',stack:1,weapon:true}, longbow:{name:'Arco Longo',stack:1,weapon:true},
  arrows:{ name:'Flechas', stack:99, use(){ return {msg:'Munição para arcos.',consume:false}; } },
  leather_cap:{name:'Capuz de Couro',stack:1,wear:'head'}, nasal_helm:{name:'Elmo Nasal',stack:1,wear:'head'}, great_helm:{name:'Elmo Fechado',stack:1,wear:'head'},
  gambeson:{name:'Gibão Acolchoado',stack:1,wear:'body'}, leather_armor:{name:'Armadura de Couro',stack:1,wear:'body'},
  chainmail:{name:'Cota de Malha',stack:1,wear:'body'}, plate:{name:'Armadura de Placas',stack:1,wear:'body'},
  bread:{ name:'Pão', stack:10, use(){ player.stamina=Math.min(player.maxStamina,player.stamina+35); player.health=Math.min(player.maxHealth,player.health+4); return {msg:'Pão de centeio, ainda morno.',consume:true}; } },
  apple:{ name:'Maçã', stack:10, use(){ player.stamina=Math.min(player.maxStamina,player.stamina+15); return {msg:'Crocante.',consume:true}; } },
  roast:{ name:'Carne Assada', stack:8, use(){ player.health=Math.min(player.maxHealth,player.health+10); player.stamina=player.maxStamina; return {msg:'Gordurosa e quente.',consume:true}; } },
  ale:{ name:'Cerveja', stack:5, use(){ player.stamina=player.maxStamina; return {msg:'A espuma vai embora rápido.',consume:true}; } },
  heal_potion:{ name:'Poção de Cura', stack:10, use(){ if(player.health>=player.maxHealth) return {msg:'Você não está ferido.',consume:false}; player.health=Math.min(player.maxHealth,player.health+40*mod('healPower')); return {msg:'O calor da poção fecha as feridas.',consume:true}; } },
  bandage:{ name:'Bandagem', stack:20, use(){ if(player.health>=player.maxHealth) return {msg:'Você não está ferido.',consume:false}; const h=(10+skill('cura')/4)*mod('healPower'); player.health=Math.min(player.maxHealth,player.health+h); gainSkill('cura',1); gainSkill('anatomia',.5); return {msg:`Você enfaixa a ferida (+${Math.round(h)} de vida).`,consume:true}; } },
  cash:{ name:'Moedas de Ouro', stack:99999, value:1, desc:'A moeda de Aelória.' },
  silver_ring:{ name:'Anel de Prata', stack:5, value:60 }, gold_ring:{ name:'Anel de Ouro', stack:5, value:180 }, gem:{ name:'Rubi', stack:10, value:120 },
  bone:{ name:'Osso', stack:20, value:2 }, hide:{ name:'Couro Cru', stack:20, value:6 }, goblin_ear:{ name:'Orelha de Goblin', stack:30, value:5 },
  logs:{ name:'Toras', stack:50, value:3, desc:'Madeira para construir.' }, iron_ore:{ name:'Minério de Ferro', stack:50, value:8 },
};
for(const [k,v] of Object.entries(OITEMS)){ ITEMS[k]=Object.assign(ITEMS[k]||{}, v); if(v.value && !v.use) ITEMS[k].use=valuable(v.value); }
ITEMS.cash.use=function(){ return {msg:`Você tem ${countItem('cash')} moedas de ouro.`,consume:false}; };
Object.assign(WEAR, {
  leather_cap:{ slot:'head', armor:.06, col:'#6a4a2c', name:'Capuz de Couro' }, nasal_helm:{ slot:'head', armor:.14, col:'#8a8e96', name:'Elmo Nasal' },
  great_helm:{ slot:'head', armor:.22, col:'#9aa0a8', name:'Elmo Fechado' },
  gambeson:{ slot:'body', armor:.12, col:'#8a7a5a', name:'Gibão Acolchoado' }, leather_armor:{ slot:'body', armor:.18, col:'#6a4428', name:'Armadura de Couro' },
  chainmail:{ slot:'body', armor:.28, col:'#7a7e86', name:'Cota de Malha' }, plate:{ slot:'body', armor:.4, col:'#b0b4bc', name:'Armadura de Placas' },
});
const PRICES = { dagger:25, shortsword:60, longsword:120, broadsword:240, club:15, mace:90, warhammer:220, hand_axe:40, battleaxe:200, spear:70, staff:35, bow:80, longbow:180,
  arrows:1, leather_cap:20, nasal_helm:70, great_helm:160, gambeson:45, leather_armor:90, chainmail:260, plate:600, bread:4, apple:2, roast:10, ale:5,
  heal_potion:40, bandage:6, bone:2, hide:6, goblin_ear:5, logs:3, iron_ore:8, silver_ring:60, gold_ring:180, gem:120 };
Object.assign(PRICE, PRICES);
// baús, armários e estantes das casas e lojas
const LT = (rolls, table, chance) => ({ rolls, table, chance });
Object.assign(LOOT, {
  cabinet: LT(2, [['bread',4],['apple',3],['cash',3],['bandage',2],['logs',1],['dagger',1],['ale',2]]),
  dresser: LT(2, [['cash',4],['silver_ring',1],['leather_cap',1],['gambeson',1],['bandage',2]]),
  safe: LT(3, [['cash',8],['gold_ring',2],['silver_ring',3],['gem',2]], .8),
  armory: LT(2, [['shortsword',3],['longsword',2],['mace',2],['spear',2],['nasal_helm',2],['chainmail',1],['arrows',3]], .5),
  register: LT(1, [['cash',6]]), books: LT(1, [['cash',1],['bandage',1]], .3), clothes: LT(1, [['gambeson',2],['leather_cap',2]], .4),
  jewels: LT(2, [['silver_ring',3],['gold_ring',1],['gem',1]], .5), throne: LT(1, [['gold_ring',1]], .1), desk: LT(1, [['cash',3],['bandage',1]]),
  trash: LT(1, [['bone',1]], .3), body: LT(2, [['cash',4],['bread',2],['bandage',2]]),
});

// ícones novos (16x16, mesmo estilo dos do After Light)
(function(){
  const mk=(f)=>{ const c=document.createElement('canvas'); c.width=16;c.height=16; const g=c.getContext('2d'); const p=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(x,y,w,h)}; f(p); return c.toDataURL(); };
  const blade=(L,col,guard='#c8a040')=>p=>{ for(let i=0;i<L;i++) p(3+i,12-i,2,2,col); p(2,11,4,1,guard); p(4,13,1,2,'#5a3a1e'); p(2,14,2,2,'#5a3a1e'); };
  ICONS.dagger=mk(blade(6,'#c8ccd0')); ICONS.shortsword=mk(blade(8,'#c8ccd4')); ICONS.longsword=mk(blade(10,'#d8dce4')); ICONS.broadsword=mk(blade(11,'#e0e4ec','#d8b040'));
  ICONS.club=mk(p=>{ for(let i=0;i<9;i++) p(3+i,12-i,2+(i>5?1:0),2+(i>5?1:0),'#7a5634'); });
  ICONS.mace=mk(p=>{ for(let i=0;i<8;i++) p(3+i,12-i,1,1,'#5a3a1e'); p(9,2,5,5,'#8a8e96'); p(8,4,7,1,'#6a6e76'); p(11,1,1,7,'#6a6e76'); });
  ICONS.warhammer=mk(p=>{ for(let i=0;i<9;i++) p(3+i,12-i,1,1,'#5a3a1e'); p(8,1,7,4,'#9aa0a8'); p(8,1,7,1,'#c8ccd4'); });
  ICONS.hand_axe=mk(p=>{ for(let i=0;i<9;i++) p(3+i,12-i,1,1,'#6a4a2c'); p(9,2,4,6,'#8a8e92'); p(12,1,2,8,'#b8bcc0'); });
  ICONS.battleaxe=mk(p=>{ for(let i=0;i<11;i++) p(2+i,13-i,1,1,'#5a3a1e'); p(7,1,4,8,'#a0a4aa'); p(11,0,3,10,'#c8ccd0'); p(4,2,3,5,'#a0a4aa'); });
  ICONS.spear=mk(p=>{ for(let i=0;i<11;i++) p(2+i,13-i,1,1,'#7a5a38'); p(12,1,3,3,'#c8ccd0'); p(13,0,2,2,'#e0e4ec'); });
  ICONS.staff=mk(p=>{ for(let i=0;i<12;i++) p(2+i,14-i,1,1,'#6a4a2c'); p(12,1,3,3,'#5a8ae0'); p(13,1,1,1,'#c8e0ff'); });
  ICONS.bow=mk(p=>{ for(let i=0;i<12;i++){ const x=4+Math.round(Math.sin(i/11*Math.PI)*5); p(x,2+i,1,1,'#7a5430'); } p(4,2,1,12,'#d8d0b0'); });
  ICONS.longbow=mk(p=>{ for(let i=0;i<14;i++){ const x=4+Math.round(Math.sin(i/13*Math.PI)*6); p(x,1+i,1,1,'#6a4424'); } p(4,1,1,14,'#d8d0b0'); });
  ICONS.arrows=mk(p=>{ for(const o of [0,3,6]){ for(let i=0;i<9;i++) p(2+i+o/2,12-i+o/3,1,1,'#7a5a38'); p(10+o/2,2+o/3,2,2,'#9aa0a8'); p(2+o/2,12+o/3,2,2,'#e8e0c8'); } });
  ICONS.leather_cap=mk(p=>{ p(4,5,8,7,'#6a4a2c'); p(4,5,8,2,'#86603a'); p(3,11,10,2,'#5a3e24'); });
  ICONS.nasal_helm=mk(p=>{ p(4,3,8,9,'#8a8e96'); p(4,3,8,2,'#c8ccd4'); p(7,8,2,6,'#6a6e76'); p(3,11,10,1,'#6a6e76'); });
  ICONS.great_helm=mk(p=>{ p(3,2,10,12,'#9aa0a8'); p(3,2,10,2,'#c8ccd4'); p(4,7,8,1,'#2a2a2e'); p(7,9,2,4,'#6a6e76'); });
  ICONS.gambeson=mk(p=>{ p(3,3,10,11,'#8a7a5a'); p(1,3,3,6,'#8a7a5a'); p(12,3,3,6,'#8a7a5a'); for(let y=5;y<14;y+=3) p(3,y,10,1,'#6a5a3a'); p(6,2,4,2,'#5a4a2a'); });
  ICONS.leather_armor=mk(p=>{ p(3,3,10,11,'#6a4428'); p(1,3,3,5,'#7a5434'); p(12,3,3,5,'#7a5434'); p(3,8,10,1,'#4a2e18'); p(7,4,2,8,'#86603a'); });
  ICONS.chainmail=mk(p=>{ p(3,3,10,11,'#7a7e86'); p(1,3,3,6,'#7a7e86'); p(12,3,3,6,'#7a7e86'); for(let y=3;y<14;y+=2) for(let x=3+(y%4?0:1);x<13;x+=2) p(x,y,1,1,'#a8acb4'); });
  ICONS.plate=mk(p=>{ p(3,3,10,11,'#b0b4bc'); p(3,3,10,2,'#e0e4ec'); p(1,3,3,5,'#9aa0a8'); p(12,3,3,5,'#9aa0a8'); p(7,5,2,8,'#8a8e96'); p(3,10,10,1,'#8a8e96'); });
  ICONS.bread=mk(p=>{ p(2,6,12,7,'#b8823a'); p(3,5,10,2,'#d8a050'); for(let x=4;x<13;x+=3) p(x,6,1,4,'#8a5a24'); });
  ICONS.apple=mk(p=>{ p(4,5,8,8,'#b82a22'); p(5,5,3,2,'#e05a4a'); p(8,2,1,3,'#4a3420'); p(9,3,3,2,'#4a8a3a'); });
  ICONS.roast=mk(p=>{ p(3,5,9,7,'#8a4a24'); p(4,5,7,2,'#a8642e'); p(11,8,4,2,'#e8e0c8'); p(14,7,1,4,'#e8e0c8'); });
  ICONS.ale=mk(p=>{ p(4,4,7,10,'#7a5430'); p(4,3,7,2,'#f0e8d0'); p(11,6,3,5,'#7a5430'); p(5,6,5,7,'#c8902a'); });
  ICONS.heal_potion=mk(p=>{ p(6,2,4,3,'#c8c0b0'); p(4,5,8,9,'#a01a1a'); p(5,6,3,3,'#e05a4a'); p(4,13,8,1,'#5a0a0a'); });
  ICONS.cash=mk(p=>{ for(const [x,y] of [[3,9],[7,10],[10,8],[5,6],[9,5]]){ p(x,y,4,3,'#c8922a'); p(x,y,4,1,'#f0d070'); } });
  ICONS.silver_ring=mk(p=>{ p(5,5,6,6,'#c8ccd4'); p(6,6,4,4,'#00000000'); p(7,7,2,2,'#1a1a1a'); p(5,5,6,1,'#f0f0f0'); });
  ICONS.gold_ring=mk(p=>{ p(5,6,6,6,'#d8a83a'); p(7,8,2,2,'#1a1a1a'); p(6,3,4,3,'#c83a2a'); });
  ICONS.gem=mk(p=>{ p(5,4,6,8,'#b81a2a'); p(6,4,2,3,'#f07a8a'); p(4,7,8,2,'#a01a24'); });
  ICONS.bone=mk(p=>{ for(let i=0;i<9;i++) p(4+i,11-i,2,2,'#e0d8c0'); p(2,11,3,3,'#e0d8c0'); p(12,2,3,3,'#e0d8c0'); });
  ICONS.hide=mk(p=>{ p(2,4,12,8,'#8a5a34'); p(1,5,2,2,'#8a5a34'); p(13,9,2,2,'#8a5a34'); p(4,6,8,1,'#6a4428'); });
  ICONS.goblin_ear=mk(p=>{ p(5,4,6,9,'#5a8a3a'); p(3,3,4,3,'#5a8a3a'); p(7,7,2,4,'#3a6a2a'); });
  ICONS.logs=mk(p=>{ for(const [x,y] of [[2,8],[7,8],[4,3]]){ p(x,y,6,5,'#6a4a2c'); p(x+1,y+1,4,3,'#b08a5a'); } });
  ICONS.iron_ore=mk(p=>{ p(3,5,10,8,'#5a5652'); p(5,6,3,2,'#a85a3a'); p(9,9,2,2,'#a85a3a'); p(4,5,8,1,'#7a7670'); });
  ICONS.bandage=ICONS.bandage||mk(p=>{ p(3,4,10,8,'#e8e0d0'); p(6,4,4,8,'#c83a2a'); });
})();

// ---------------- Começo do jogo: só roupa simples, punhos e um pouco de comida ----------------
startGame = function(){
  buildWorld();
  if(!chosenLook) chosenLook=randomLook(chosenSex);
  chosenLook.jacket = chosenLook.sex==='f' ? '#7a6a4a' : '#8a7a5a'; chosenLook.jacketD=darkHex(chosenLook.jacket); chosenLook.pants='#4a3e30';
  const name=document.getElementById('char-name').value.trim()||'Andarilho';
  const kit=PROFESSIONS[selectedProfessions[0]]||PROFESSIONS.guerreiro, mods={...kit.bonuses};
  const [sx,sy]=findSpawn();
  makePlayer(name,mods,sx*T+8,sy*T+12);
  player.skills={...kit.skills}; player.weapon='fists'; player.health=player.maxHealth; player.hunger=100; player.thirst=100;
  time=10; day=1; lastWave=0;
  addItem('bread',4); addItem('bandage',3); addItem('cash',30);
  if(kit===PROFESSIONS.mago) addItem('heal_potion',1);
  enterGame(`Bem-vindo a Aurélia, ${name}. Você chega só com a roupa do corpo: armas, armaduras e ouro estão lá fora, além dos muros. E: falar/usar · I: mochila · M: mapa · K: skills.`);
};
const _enterGame=enterGame;
enterGame=function(msg){ _enterGame(msg);
  document.getElementById('who').innerHTML=`${escapeHtml(player.name)}<small>${player.professions.map(p=>(PROFESSIONS[p]||{name:p}).name).join(' · ')}</small>`;
  for(const id of ['bar-hunger','bar-thirst']){ const el=document.getElementById(id); if(el && el.parentElement){ el.parentElement.style.display='none'; const lab=el.parentElement.previousElementSibling; if(lab&&lab.classList.contains('stat')) lab.style.display='none'; } }
};
// sem fome e sede no Outremer
const _update=update;
update=function(dt){ if(player){ player.hunger=100; player.thirst=100; } _update(dt); };

// ---------------- Monstros (no lugar dos saqueadores) ----------------
const MONS = {
  goblin:   { name:'Goblin', lvl:1, hp:[22,32], speed:38, weapon:'club', look:{sex:'m',skin:'#5a8a3a',hair:'#2a3a1a',style:'bald',jacket:'#5a4428',jacketD:'#3a2a18',pants:'#3a2a18',boot:'#2a1a10'}, small:true, gold:[3,12], loot:[['goblin_ear',6],['dagger',1],['club',1],['bread',2],['leather_cap',1],['arrows',2]] },
  wolf:     { name:'Lobo', lvl:1, hp:[18,26], speed:56, weapon:'bite', beast:'wolf', gold:[0,0], loot:[['hide',6],['bone',2]] },
  bandit:   { name:'Bandido', lvl:2, hp:[34,46], speed:40, weapon:'shortsword', look:{sex:'m',skin:'#c8956a',hair:'#2e1e14',style:'short',jacket:'#3a2e24',jacketD:'#2a2018',pants:'#2a2a2a',boot:'#151210',mask:'#3a2a1a'}, gold:[8,30], loot:[['shortsword',2],['dagger',2],['leather_armor',1],['gambeson',1],['bread',2],['bandage',2],['heal_potion',1],['silver_ring',1]] },
  skeleton: { name:'Esqueleto', lvl:3, hp:[40,55], speed:34, weapon:'bone', look:{sex:'m',skin:'#d8d0b8',hair:'#d8d0b8',style:'bald',jacket:'#c8c0a8',jacketD:'#8a8270',pants:'#b8b098',boot:'#8a8270'}, skel:true, gold:[10,40], loot:[['bone',6],['longsword',1],['nasal_helm',1],['mace',1],['gem',1]] },
  spider:   { name:'Aranha Gigante', lvl:3, hp:[36,50], speed:48, weapon:'bite', beast:'spider', gold:[0,0], loot:[['gem',1],['bone',2]] },
  orc:      { name:'Orc', lvl:4, hp:[70,95], speed:36, weapon:'battleaxe', look:{sex:'m',skin:'#4a6a2a',hair:'#1a1a12',style:'bald',jacket:'#4a3a28',jacketD:'#2a2014',pants:'#3a2a1a',boot:'#1a1410',beard:true}, big:true, gold:[20,60], loot:[['battleaxe',1],['hand_axe',2],['chainmail',1],['roast',2],['heal_potion',1],['gold_ring',1]] },
};
for(const [k,m] of Object.entries(MONS)){
  const tb=m.loot.slice(); LOOT['mon_'+k]=LT(2, tb, .6);
}
function monsterFor(dist){ // mais longe da cidade, mais perigoso
  const pool = dist<40 ? ['goblin','goblin','wolf'] : dist<70 ? ['goblin','wolf','bandit','bandit','skeleton'] : ['bandit','skeleton','spider','orc','orc'];
  return pool[Math.floor(Math.random()*pool.length)];
}
function cityCenter(){ const r=regions.find(r=>r.kind==='city')||regions[0]; return {x:(r.x+r.w/2)*T, y:(r.y+r.h/2)*T, r}; }
spawnRaider = function(minD,maxD){
  const ptx=Math.floor(player.x/T), pty=Math.floor(player.y/T), C=cityCenter();
  for(let a=0;a<200;a++){
    const ang=Math.random()*Math.PI*2, dist=minD+Math.random()*(maxD-minD);
    const tx=Math.round(ptx+Math.cos(ang)*dist), ty=Math.round(pty+Math.sin(ang)*dist);
    if(!inB(tx,ty)) continue; const i=idx(tx,ty);
    if(!walk[i] || bld[i]>=0 || objGrid[i] || map[i]===TL.WATER || regionId[i]!==255) continue;
    const dc=Math.hypot(tx*T-C.x,ty*T-C.y)/T - C.r.w/2;
    const kind=monsterFor(dc), M=MONS[kind], hp=M.hp[0]+Math.random()*(M.hp[1]-M.hp[0]);
    raiders.push({x:tx*T+8,y:ty*T+12,hp,max:hp,face:'down',phase:0,moving:false,state:'wander',wp:null,idle:Math.random()*2,
      path:null,pathT:0,seenT:0,lastX:0,lastY:0,wind:0,cd:0,hurtT:0,alertT:0,swingT:0,doorT:0,aimAng:0,weapon:M.weapon,
      speed:M.speed*(0.9+Math.random()*0.2),look:M.look?{...M.look}:null,mon:kind,camp:-1,
      equip:{head:kind==='skeleton'&&Math.random()<.3?'nasal_helm':null, body:kind==='bandit'&&Math.random()<.4?'leather_armor':kind==='orc'&&Math.random()<.3?'chainmail':null}});
    return true;
  }
  return false;
};
let monT=0;
updateSpawns = function(dt){
  monT-=dt; if(monT>0) return; monT=2;
  const i=idx(Math.floor(player.x/T),Math.floor(player.y/T)), inCity = regionId[i]!==255 && regions[regionId[i]] && regions[regionId[i]].kind==='city';
  for(const r of [...raiders]) if(Math.hypot(r.x-player.x,r.y-player.y)>70*T) raiders.splice(raiders.indexOf(r),1);
  if(inCity) return;
  const near=raiders.filter(r=>Math.hypot(r.x-player.x,r.y-player.y)<45*T).length;
  if(near<7) spawnRaider(18,34);
};
// dano do jogador escala com a skill da arma (e Táticas/Anatomia), e treina ao acertar
const _damageRaider=damageRaider;
damageRaider=function(r,dmg,ang,knock,src){
  if(!src || src===player){ const Wp=WEAPONS[player.weapon]||OW.fists, sk=Wp.skill||'briga', M=MONS[r.mon]||{lvl:1};
    dmg *= (0.55 + skill(sk)/110) * (1 + skill('taticas')/250); if(Math.random()<skill('anatomia')/500){ dmg*=1.8; toast('Golpe crítico!'); }
    gainSkill(sk, 0.6+M.lvl*0.15); if(Math.random()<.4) gainSkill('taticas', .5); if(Math.random()<.2) gainSkill('anatomia', .4); }
  _damageRaider(r,dmg,ang,knock,src);
};
// aparar: chance de bloquear parte do golpe quando o jogador tem escudo/arma e skill
const _hurtPlayer=hurtPlayer;
hurtPlayer=function(dmg,src,part,blunt){
  if(Math.random() < skill('aparar')/250){ toast('Você apara o golpe.'); gainSkill('aparar',.8); return; }
  if(src && src.mon) gainSkill('aparar',.3);
  return _hurtPlayer(dmg,src,part,blunt);
};
killRaider=function(r,ang){
  raiders.splice(raiders.indexOf(r),1); player.kills++;
  blood(r.x,r.y-6,ang,MONS[r.mon]&&MONS[r.mon].skel?0:12);
  let tx=Math.floor(r.x/T), ty=Math.floor((r.y-3)/T);
  const free=(x,y)=>inB(x,y)&&walk[idx(x,y)]&&!objGrid[idx(x,y)]&&!doors.has(idx(x,y));
  if(!free(tx,ty)){ outer: for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++) if(free(tx+dx,ty+dy)){ tx+=dx; ty+=dy; break outer; } }
  const M=MONS[r.mon]||MONS.goblin;
  if(free(tx,ty)) addObj({type:'remains',x:tx,y:ty,solid:false,container:'mon_'+r.mon,mon:r.mon,sortY:ty*T+1,
    gold:Math.round(M.gold[0]+Math.random()*(M.gold[1]-M.gold[0]))});
  toast(`${M.name} derrotado.`);
};
// restos: ouro já vem junto ao revistar
const _finishSearch=finishSearch;
finishSearch=function(o){ if(o.type==='remains' && o.gold && !o.searched){ addItem('cash',o.gold); toast(`+${o.gold} moedas de ouro`); } _finishSearch(o); };
OBJ_NAMES.remains='Restos'; OBJ_NAMES.chest='Baú'; OBJ_NAMES.wrack='Suporte de armas'; OBJ_NAMES.shelf='Estante'; OBJ_NAMES.counter='Balcão'; OBJ_NAMES.throne='Trono';
// desenho dos monstros
drawRaider=function(g,r,x,y){
  const M=MONS[r.mon]; let a;
  if(r.wind>0) a=r.aimAng-1.3; else if(r.swingT>0) a=r.aimAng-1.3+2.6*(1-r.swingT/.2); else a=FACE_ANG[r.face]+0.9;
  const P=(px,py,w,h,c)=>{ g.fillStyle=c; g.fillRect(x+px,y+py,w,h); };
  if(M && M.beast==='wolf'){
    const st=r.moving?Math.round(Math.sin(r.phase)*1.5):0, side=r.face==='left'?-1:1, fl=r.hurtT>0;
    const c=fl?'#ffffff':'#5a5652', d=fl?'#eee':'#3e3a36';
    if(r.face==='left'||r.face==='right'){ P(-8,-9,16,6,c); P(-8,-4,16,1,d); P(side>0?6:-11,-12,5,5,c); P(side>0?10:-12,-10,2,2,d); P(side>0?8:-9,-13,1,2,d);
      P(side>0?-11:8,-10,4,2,c); P(-6,-3+st,2,3,d); P(-2,-3-st,2,3,d); P(2,-3+st,2,3,d); P(5,-3-st,2,3,d); P(side>0?9:-10,-11,1,1,'#e8c050'); }
    else { P(-4,-12,8,10,c); P(-3,-15,6,5,c); P(-4,-16,2,2,d); P(2,-16,2,2,d); P(-2,-13,1,1,'#e8c050'); P(1,-13,1,1,'#e8c050'); P(-3,-2+st,2,2,d); P(1,-2-st,2,2,d); }
  } else if(M && M.beast==='spider'){
    const st=r.moving?Math.round(Math.sin(r.phase*1.5)*2):0, c=r.hurtT>0?'#fff':'#2a2220', d='#4a3a34';
    for(let k=0;k<4;k++){ P(-11+k*2,-6+((k%2)?st:-st),4,1,d); P(8-k*2,-6+((k%2)?-st:st),4,1,d); P(-12+k*2,-6+((k%2)?st:-st),1,4,d); P(11-k*2,-6+((k%2)?-st:st),1,4,d); }
    P(-5,-10,10,8,c); P(-3,-14,6,5,c); P(-2,-13,1,1,'#d83a2a'); P(1,-13,1,1,'#d83a2a'); P(-1,-12,2,1,'#d83a2a'); P(-3,-8,6,2,'#6a2a2a');
  } else {
    if(M && (M.big||M.small)){ g.save(); g.translate(x,y); g.scale(M.big?1.3:0.8, M.big?1.3:0.8); g.translate(-x,-y); }
    drawHuman(g,x,y,{face:r.face,phase:r.phase,moving:r.moving,look:r.look||randomLook(),flash:r.hurtT>0,weapon:r.weapon,wAng:a,head:r.equip.head,body:r.equip.body});
    if(M && M.skel){ P(-2,-18,1,1,'#1a1a1a'); P(1,-18,1,1,'#1a1a1a'); P(-3,-12,6,1,'#8a8270'); P(-3,-10,6,1,'#8a8270'); }
    if(M && (M.big||M.small)) g.restore();
  }
  const top = M && M.big ? -40 : -28;
  if(r.hp<r.max){ g.fillStyle='#000'; g.fillRect(x-7,y+top,14,3); g.fillStyle='#b8433a'; g.fillRect(x-6,y+top+1,Math.max(0,Math.round(12*r.hp/r.max)),1); }
  if(r.hurtT>0 || Math.hypot(player.x-r.x,player.y-r.y)<5*T){ g.font='5px monospace'; }
};
// restos no chão
const _drawObj=drawObj;
drawObj=function(g,o,sx,sy,now){
  if(o.type==='remains'){ const P=(a,b,w,h,c)=>{g.fillStyle=c;g.fillRect(sx+a,sy+b,w,h);}; const M=MONS[o.mon]||{};
    if(M.skel){ P(3,8,10,2,'#d8d0b8'); P(2,6,3,3,'#e0d8c0'); P(10,10,4,1,'#d8d0b8'); P(6,11,1,3,'#d8d0b8'); }
    else { P(2,8,12,5,'rgba(70,10,8,.55)'); P(4,7,8,4,M.beast==='wolf'?'#5a5652':M.beast==='spider'?'#2a2220':(M.look&&M.look.jacket)||'#5a4428'); P(4,6,3,3,M.look?M.look.skin:'#3e3a36'); }
    if(!o.searched){ P(10,5,4,4,'#7a5434'); P(10,5,4,1,'#9a7448'); P(11,7,2,1,'#c8a040'); }
    return; }
  return _drawObj(g,o,sx,sy,now);
};
// moradores e guardas não viram inimigos com um golpe perdido
const _damageNPC=damageNPC;
damageNPC=function(n,dmg,ang,src){ if(src===player && ['guard','lord','trader','citizen'].includes(n.role)) return; return _damageNPC(n,dmg,ang,src); };

// ---------------- Vendedores ----------------
const VSTOCK = {
  ferreiro:['dagger','shortsword','longsword','broadsword','mace','warhammer','hand_axe','battleaxe','spear','nasal_helm','great_helm','chainmail','plate'],
  arqueiro:['bow','longbow','arrows','arrows','arrows','leather_cap','leather_armor'], alfaiate:['gambeson','leather_cap','leather_armor','bandage'],
  alchemist:['heal_potion','heal_potion','bandage'], healer:['bandage','bandage','heal_potion'], tailor:['gambeson','leather_cap','leather_armor'],
  bowyer:['bow','longbow','arrows','arrows','arrows'], butcher:['roast','hide'], carpenter:['staff','club','logs'], jeweler:['silver_ring','gold_ring','gem'],
  provisioner:['bread','apple','ale','bandage','arrows'], estalajadeiro:['bread','roast','ale','apple'], mago:['staff','heal_potion'], banqueiro:[],
};
const VNAME = { ferreiro:'ferreiro', arqueiro:'arqueiro', alfaiate:'alfaiate', alchemist:'alquimista', healer:'curandeiro', tailor:'alfaiate', bowyer:'arqueiro',
  butcher:'açougueiro', carpenter:'carpinteiro', jeweler:'joalheiro', provisioner:'merceeiro', estalajadeiro:'estalajadeiro', mago:'mago', banqueiro:'banqueiro' };
const VLINES = {
  ferreiro:['Boa lâmina, bom preço.','Ferro bom não se apressa.'], estalajadeiro:['Pão, carne e cerveja. A cama é por conta da casa... quase.','Sente-se, viajante.'],
  banqueiro:['O ouro aqui não some.','O cofre abre no seu nome.'], mago:['As runas pedem paciência.','Cajados, poções. As magias vêm com o estudo.'],
};
function setupVendors(){
  for(const n of npcs){ if(n.role!=='trader') continue;
    const ids=VSTOCK[n.vendor]||['bread']; n.stock=[]; for(const id of ids){ const s=n.stock.find(x=>x.id===id); if(s) s.qty+=id==='arrows'?40:2; else n.stock.push({id,qty:id==='arrows'?40:1+Math.floor(Math.random()*3)}); }
    n.title=VNAME[n.vendor]||'vendedor'; }
  for(const n of npcs) if(n.role==='guard') n.title='guarda'; else if(n.role==='lord') n.title='senhor de Aurélia'; else if(n.role==='citizen') n.title='morador';
}
const _placePeople=placePeople;
placePeople=function(){ _placePeople(); setupVendors(); };
talkTo=function(n){
  const say=a=>a[Math.floor(Math.random()*a.length)];
  if(n.role==='trader'){ const l=VLINES[n.vendor]||['O que vai ser?','Dê uma olhada, viajante.'];
    openActions(`${n.name}, ${n.title}`, [[`"${say(l)}"`,null], ...(n.stock&&n.stock.length?[['Comprar e vender', ()=>openTrade(n)]]:[]), ['Até mais',null]]); return; }
  if(n.role==='guard'){ openActions(`${n.name}, guarda`, [[`"${say(['Mantenha a lâmina na bainha dentro dos muros.','Goblins rondam a estrada do sul.','Do portão para fora, a lei é a sua espada.','Aurélia está em paz. Por enquanto.'])}"`,null]]); return; }
  if(n.role==='lord'){ openActions('Lorde Aurélio', [['"Seja bem-vindo à minha corte, viajante. Aurélia precisa de braços fortes."',null],['"Volte quando tiver feito seu nome além dos muros: tenho trabalhos para quem é leal à cidade."',null]]); return; }
  openActions(`${n.name}, morador`, [[`"${say(['Dizem que há um dragão nas cavernas do norte.','O ferreiro tem as melhores lâminas da cidade.','Cuidado com os lobos depois do pôr do sol.','Bom dia, viajante.','A taverna fica perto da praça.'])}"`,null]]);
};
renderTrade=function(){
  const n=tradeWith; if(!n) return; const m=(player.mods.tradePrice||1)*(1-skill('comercio')/500);
  document.getElementById('trade-title').textContent=`${n.name.toUpperCase()}, ${(n.title||'vendedor').toUpperCase()}`;
  document.getElementById('trade-cash').textContent=`Seu ouro: ${countItem('cash')}`;
  const L=document.getElementById('trade-buy'), R=document.getElementById('trade-sell'); L.innerHTML=''; R.innerHTML='';
  for(const s of n.stock){ if(!s.qty) continue; const pr=Math.max(1,Math.ceil(priceOf(s.id)*m));
    const row=document.createElement('div'); row.className='trow'; row.innerHTML=`<img src="${ICONS[s.id]}" alt=""><span>${ITEMS[s.id].name} <small>×${s.qty}</small></span><b>${pr}</b>`;
    const b=document.createElement('button'); b.textContent='Comprar'; b.disabled=countItem('cash')<pr;
    b.onclick=()=>{ if(countItem('cash')<pr) return; if(addItem(s.id,1)){ toast('Mochila cheia.'); return; } takeItem('cash',pr); s.qty--; gainSkill('comercio',.4); renderTrade(); }; row.appendChild(b); L.appendChild(row); }
  const seen=new Set();
  for(const s of inv){ if(!s||s.id==='cash'||seen.has(s.id)) continue; seen.add(s.id); const pr=Math.max(1,Math.floor(priceOf(s.id)*(ITEMS[s.id].value?.8:.4)/m));
    const row=document.createElement('div'); row.className='trow'; row.innerHTML=`<img src="${ICONS[s.id]}" alt=""><span>${ITEMS[s.id].name} <small>×${countItem(s.id)}</small></span><b>${pr}</b>`;
    const b=document.createElement('button'); b.textContent='Vender';
    b.onclick=()=>{ takeItem(s.id,1); if(player.weapon===s.id&&!hasItem(s.id)) player.weapon='fists'; addItem('cash',pr); gainSkill('comercio',.3); const st=n.stock.find(x=>x.id===s.id); if(st) st.qty++; else n.stock.push({id:s.id,qty:1}); renderTrade(); }; row.appendChild(b); R.appendChild(row); }
};

// ---------------- Painel de skills (tecla K) ----------------
(function(){
  const el=document.createElement('div'); el.id='skills-panel'; el.className='panel';
  el.style.cssText='position:absolute;top:120px;left:10px;width:190px;padding:8px 10px;display:none;pointer-events:auto;font-size:12px;z-index:60';
  document.getElementById('hud').appendChild(el);
  window.renderSkills=()=>{ const s=player.skills||{}; const tot=Object.values(s).reduce((a,b)=>a+b,0);
    el.innerHTML=`<div style="color:#d69a4c;margin-bottom:4px">SKILLS <small style="color:#8c8172">${tot.toFixed(0)} / 700</small></div>`+
      Object.entries(s).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div style="display:flex;justify-content:space-between"><span>${SKILL_NAMES[k]||k}</span><b>${v.toFixed(1)}</b></div>`).join(''); };
  addEventListener('keydown',e=>{ if(e.key.toLowerCase()==='k' && running && document.activeElement.tagName!=='INPUT'){ el.style.display=el.style.display==='none'?'block':'none'; renderSkills(); } });
  setInterval(()=>{ if(el.style.display!=='none' && player) renderSkills(); },1000);
  // botão no celular, junto dos outros do relógio
  const b=document.createElement('button'); b.id='btn-skills'; b.textContent='SKILLS'; const ref=document.getElementById('btn-map');
  if(ref){ b.className=ref.className; b.style.cssText=ref.style.cssText; ref.parentElement.insertBefore(b, ref); b.onclick=()=>{ el.style.display=el.style.display==='none'?'block':'none'; renderSkills(); }; }
})();

// refaz a tela de criação com os ofícios
initCreation();
{ const sc=document.getElementById('selected-count'); if(sc) sc.textContent='Escolha um ofício'; const st=document.getElementById('btn-start'); if(st){ st.textContent='Entrar em Aurélia'; st.disabled=true; } }
document.getElementById('btn-start').onclick=()=>startGame();

// =====================================================================
// Elmos e armaduras medievais desenhados em pixel (sem Blender: dá para ter muitos)
// WEAR[id].kind escolhe o desenho; col é a cor principal
// =====================================================================
Object.assign(WEAR, {
  leather_cap:{ slot:'head', armor:.06, col:'#6a4a2c', kind:'hood', name:'Capuz de Couro' },
  wool_hood:{ slot:'head', armor:.03, col:'#4a4a5a', kind:'hood', name:'Capuz de Lã' },
  chain_coif:{ slot:'head', armor:.11, col:'#8a8e96', kind:'coif', name:'Capelo de Malha' },
  nasal_helm:{ slot:'head', armor:.14, col:'#8a8e96', kind:'nasal', name:'Elmo Nasal' },
  kettle_hat:{ slot:'head', armor:.15, col:'#7a7e86', kind:'kettle', name:'Chapéu de Ferro' },
  bascinet:{ slot:'head', armor:.19, col:'#9aa0a8', kind:'bascinet', name:'Bacinete' },
  great_helm:{ slot:'head', armor:.22, col:'#a0a6ae', kind:'great', name:'Elmo Fechado' },
  horned_helm:{ slot:'head', armor:.17, col:'#6a6e76', kind:'horned', name:'Elmo de Chifres' },
  wizard_hat:{ slot:'head', armor:.02, col:'#3a2a6a', kind:'wizard', name:'Chapéu de Mago', mana:10 },
  circlet:{ slot:'head', armor:.03, col:'#d8b040', kind:'circlet', name:'Diadema' },
  gambeson:{ slot:'body', armor:.12, col:'#8a7a5a', kind:'quilt', name:'Gibão Acolchoado' },
  leather_armor:{ slot:'body', armor:.18, col:'#6a4428', kind:'leather', name:'Armadura de Couro' },
  studded_armor:{ slot:'body', armor:.22, col:'#5a3a22', kind:'studded', name:'Couro Tachonado' },
  chainmail:{ slot:'body', armor:.28, col:'#7a7e86', kind:'chain', name:'Cota de Malha' },
  templar_tabard:{ slot:'body', armor:.3, col:'#7a7e86', kind:'tabard', name:'Cota com Tabardo do Selo' },
  scale_armor:{ slot:'body', armor:.32, col:'#a8783a', kind:'scale', name:'Armadura de Escamas' },
  brigandine:{ slot:'body', armor:.34, col:'#5a1a1a', kind:'brig', name:'Brigantina' },
  plate:{ slot:'body', armor:.42, col:'#b0b4bc', kind:'plate', name:'Armadura de Placas' },
  mage_robe:{ slot:'body', armor:.05, col:'#2a2a6a', kind:'robe', name:'Manto de Mago' },
  monk_robe:{ slot:'body', armor:.06, col:'#5a4a36', kind:'robe', name:'Hábito de Monge' },
  mail:{ slot:'body', armor:.3, col:'#7a7e86', kind:'tabard', tab:'#7a1a14', name:'Cota e Tabardo' },
  nasal:{ slot:'head', armor:.2, col:'#8a8e96', kind:'nasal', name:'Elmo Nasal' },
  crown:{ slot:'head', armor:0, col:'#d8b040', kind:'crown', name:'Coroa' },
});
drawHelmet=function(g,x,y,id,f){
  if(!id||!WEAR[id]) return; const W_=WEAR[id], c=W_.col, d=darkHex(c,.68), hi=darkHex(c,1.25), k=W_.kind||'nasal';
  const P=(a,b,w,h,col)=>{g.fillStyle=col;g.fillRect(x+a,y+b,w,h);}; const side=f==='left'||f==='right', m=f==='left'?-1:1;
  const dome=()=>{ P(-4,-23,8,3,c); P(-3,-24,6,1,c); P(-3,-23,4,1,hi); };
  if(k==='hood'||k==='coif'){
    if(f==='up'){ P(-4,-23,8,9,c); P(-4,-15,8,1,d); }
    else if(side){ P(-4,-23,8,3,c); P(m<0?1:-4,-20,3,6,c); P(-3,-15,6,1,d); }
    else { P(-4,-23,8,3,c); P(-4,-20,1,6,c); P(3,-20,1,6,c); P(-4,-15,8,1,c); }
    if(k==='coif') for(let yy=-23;yy<-14;yy+=2) for(let xx=-4+(yy&1);xx<4;xx+=2) P(xx,yy,1,1,d);
    return; }
  if(k==='crown'||k==='circlet'){ P(-3,-22,6,1,c); if(k==='crown'){ P(-3,-24,1,2,c); P(0,-25,1,3,c); P(2,-24,1,2,c); } if(f==='down') P(0,-22,1,1,'#c83a2a'); return; }
  if(k==='wizard'){ P(-6,-21,12,1,d); P(-4,-23,8,2,c); P(-3,-25,6,2,c); P(-2,-27,4,2,c); P(-1,-29,3,2,c); P(1,-31,2,2,c); P(2,-32,2,1,c); P(-4,-22,8,1,'#d8b040'); if(f==='down') P(-1,-26,1,1,'#f0e070'); return; }
  dome();
  if(k==='nasal'){ P(-4,-20,8,1,d); if(f==='down') P(-1,-20,2,4,d); else if(side) P(m<0?-4:3,-20,1,4,d); }
  if(k==='kettle'){ P(-6,-20,12,1,d); P(-5,-21,10,1,c); }
  if(k==='bascinet'){ P(-1,-25,2,1,c); P(0,-26,1,1,c); if(f==='down'){ P(-3,-20,6,4,c); P(-3,-19,6,1,'#1a1a1a'); P(-1,-17,2,1,d); } else if(side){ P(m<0?-4:0,-20,4,4,c); P(m<0?-4:1,-19,3,1,'#1a1a1a'); P(m<0?-5:4,-19,1,2,c); } else P(-4,-20,8,5,c); P(-4,-15,8,1,'#7a7e86'); }
  if(k==='great'){ P(-4,-23,8,9,c); P(-4,-23,8,1,hi); if(f==='down'){ P(-3,-19,6,1,'#141414'); P(-1,-17,2,3,d); P(-3,-16,1,1,d); P(2,-16,1,1,d); } else if(side){ P(m<0?-4:0,-19,4,1,'#141414'); } P(-4,-15,8,1,d); }
  if(k==='horned'){ P(-4,-20,8,1,d); P(-7,-24,2,2,'#e0d8c0'); P(-8,-27,2,3,'#e0d8c0'); P(5,-24,2,2,'#e0d8c0'); P(6,-27,2,3,'#e0d8c0'); if(f==='down') P(-1,-20,2,3,d); }
};
drawVest=function(g,x,y,id,f,side){
  if(!id||!WEAR[id]) return; const W_=WEAR[id], c=W_.col, d=darkHex(c,.7), hi=darkHex(c,1.3), k=W_.kind||'leather';
  const P=(a,b,w,h,col)=>{g.fillStyle=col;g.fillRect(x+a,y+b,w,h);};
  const x0=side?-3:-5, w=side?7:10;
  if(k==='robe'){ P(x0,-14,w,13,c); P(x0,-2,w,1,d); P(side?-1:-1,-14,2,12,d); if(!side&&f==='down'){ P(-2,-14,4,2,hi); P(-3,-9,6,1,'#c8a040'); } return; }
  P(x0,-14,w,8,c); P(x0,-14,w,1,hi); P(x0,-7,w,1,d);
  if(!side){ P(-6,-14,1,3,c); P(5,-14,1,3,c); }
  if(k==='quilt') for(let yy=-12;yy<-7;yy+=2) P(x0,yy,w,1,d);
  if(k==='leather'){ P(x0,-9,w,1,'#3a2414'); if(!side&&f==='down') P(-1,-9,2,1,'#c8a040'); }
  if(k==='studded'){ for(let yy=-13;yy<-7;yy+=2) for(let xx=x0+1+((yy/2)&1);xx<x0+w;xx+=2) P(xx,yy,1,1,'#c8c0a8'); P(x0,-9,w,1,'#2a1a10'); }
  if(k==='chain'||k==='tabard'){ for(let yy=-13;yy<-6;yy+=2) for(let xx=x0+((yy/2)&1);xx<x0+w;xx+=2) P(xx,yy,1,1,hi);
    if(k==='tabard'){ const tc=W_.tab||'#e8e0d0'; if(side) P(-2,-14,4,9,tc); else { P(-3,-14,6,9,tc); if(f!=='up'||true){ const cr=W_.tab?'#d8b040':'#a01a14'; P(-1,-13,2,6,cr); P(-3,-11,6,2,cr); } } } }
  if(k==='scale') for(let yy=-13;yy<-7;yy+=2) for(let xx=x0+((yy/2)&1);xx<x0+w;xx+=2){ P(xx,yy,2,1,hi); P(xx,yy+1,1,1,d); }
  if(k==='brig'){ for(let yy=-13;yy<-7;yy+=3) for(let xx=x0+1;xx<x0+w;xx+=3) P(xx,yy,1,1,'#c8a040'); }
  if(k==='plate'){ P(x0+1,-13,2,5,hi); if(!side){ P(-7,-15,3,3,c); P(4,-15,3,3,c); P(-7,-15,3,1,hi); P(4,-15,3,1,hi); P(-1,-13,2,6,d); } P(x0,-10,w,1,d); }
};
// itens, ícones, preços e onde aparecem
Object.assign(ITEMS, {
  wool_hood:{name:'Capuz de Lã',stack:1,wear:'head'}, chain_coif:{name:'Capelo de Malha',stack:1,wear:'head'}, kettle_hat:{name:'Chapéu de Ferro',stack:1,wear:'head'},
  bascinet:{name:'Bacinete',stack:1,wear:'head'}, horned_helm:{name:'Elmo de Chifres',stack:1,wear:'head'}, wizard_hat:{name:'Chapéu de Mago',stack:1,wear:'head'},
  circlet:{name:'Diadema',stack:1,wear:'head'}, studded_armor:{name:'Couro Tachonado',stack:1,wear:'body'}, templar_tabard:{name:'Cota com Tabardo do Selo',stack:1,wear:'body'},
  scale_armor:{name:'Armadura de Escamas',stack:1,wear:'body'}, brigandine:{name:'Brigantina',stack:1,wear:'body'}, mage_robe:{name:'Manto de Mago',stack:1,wear:'body'},
  monk_robe:{name:'Hábito de Monge',stack:1,wear:'body'},
});
Object.assign(PRICE, { wool_hood:12, chain_coif:60, kettle_hat:80, bascinet:170, horned_helm:120, wizard_hat:90, circlet:200, studded_armor:140, templar_tabard:340,
  scale_armor:380, brigandine:420, mage_robe:110, monk_robe:30 });
// ícones gerados do próprio desenho do boneco: o mesmo pixel que aparece no corpo
(function(){
  for(const id of Object.keys(WEAR)){ if(!ITEMS[id]) continue;
    const c=document.createElement('canvas'); c.width=16; c.height=16; const g=c.getContext('2d');
    if(WEAR[id].slot==='head'){ g.save(); g.translate(8,30); g.scale(1,1); drawHelmet(g,0,-4,id,'down'); g.restore(); }
    else { g.save(); g.translate(8,20); drawVest(g,0,0,id,'down',false); g.restore(); }
    ICONS[id]=c.toDataURL(); }
})();
VSTOCK.ferreiro.push('chain_coif','kettle_hat','bascinet','scale_armor','brigandine'); VSTOCK.tailor.push('wool_hood','studded_armor','monk_robe'); VSTOCK.alfaiate.push('wool_hood','studded_armor');
VSTOCK.mago.push('wizard_hat','mage_robe'); VSTOCK.jeweler.push('circlet');
LOOT.armory.table.push(['chain_coif',2],['kettle_hat',1],['bascinet',1],['studded_armor',1],['templar_tabard',1]);
MONS.bandit.loot.push(['wool_hood',2],['studded_armor',1],['kettle_hat',1]); MONS.orc.loot.push(['horned_helm',2],['scale_armor',1]); MONS.skeleton.loot.push(['chain_coif',1],['bascinet',1],['brigandine',1]);
for(const k of ['bandit','orc','skeleton']) LOOT['mon_'+k]=LT(2, MONS[k].loot, .6);

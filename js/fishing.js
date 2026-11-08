'use strict';
// =====================================================================
// OUTREMER — pesca com skill (rio, lago, mar e buraco no gelo do norte), peixes por lugar,
// achados raros (ouro, garrafas, botas velhas) e, em mar fundo, o perigo da serpe d'água.
// =====================================================================
ITEMS.fish = { name:'Peixe', stack:20, desc:'Asse no fogo.', use:()=>({ msg:'Peixe cru… melhor assar.', consume:false }) }; ICONS.fish=ICONS.fish_raw;
ITEMS.fish_raw = ITEMS.fish;
const FISHES = { rio:[['Truta','#8aa0b0'],['Carpa','#a08a5a'],['Lúcio','#6a8a5a']], mar:[['Robalo','#9ab0c0'],['Sardinha','#b8c8d8'],['Atum','#4a5a7a']], gelo:[['Salmão do Norte','#c87a6a'],['Bacalhau','#a8b0b8']], pantano:[['Bagre','#6a6a4a'],['Enguia','#4a4a3a']] };
const JUNK = [['Bota Velha',null],['Algas',null],['Garrafa com Mensagem','msg'],['Moedas Encharcadas','gold']];
for(const [n] of JUNK) {} 
ITEMS.old_boot={name:'Bota Velha',stack:5,value:1}; ITEMS.seaweed={name:'Algas',stack:20,value:1}; ITEMS.msg_bottle={name:'Garrafa com Mensagem',stack:5,value:20,use:()=>{ const m=['"Socorro! Naufragamos perto do Farol Bizantino."','"O tesouro do Corsário Vermelho está onde o sol morre no mar."','"Quem ler isto: o Selo não pode cair."','"Diga à Maria que eu volto."']; return {msg:'A carta diz: '+rpick(m), consume:true}; }};
(function(){ const mk=f=>{ const c=document.createElement('canvas'); c.width=16; c.height=16; const g=c.getContext('2d'); f((x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(x,y,w,h);}); return c.toDataURL(); };
  ICONS.old_boot=mk(p=>{ p(5,3,4,9,'#4a3424'); p(5,10,8,3,'#4a3424'); p(6,4,1,2,'#2a1a10'); }); ICONS.seaweed=mk(p=>{ for(let i=0;i<4;i++) p(4+i*2,3+i,1,10-i,'#3a6a3a'); });
  ICONS.msg_bottle=mk(p=>{ p(5,4,6,9,'#6a9a7a'); p(7,2,2,2,'#8a6a3a'); p(6,6,4,4,'#e8dcc0'); }); })();
const _wn = waterNear;
waterNear = function(r){ const w=_wn(r); if(w) return w; const tx=Math.floor(player.x/T), ty=Math.floor(player.y/T);
  for(let y=ty-2;y<=ty+2;y++) for(let x=tx-2;x<=tx+2;x++) if(inB(x,y)&&map[idx(x,y)]===TL.ICE) return {ice:true}; return null; };
if(ITEMS.fishing_pole) ITEMS.fishing_pole.use = ()=>{ const r=startFishing(); if(search && search.fish){ search.dur=Math.max(2.5, search.dur-skill('pesca')/25); const w=waterNear(2.2); search.ice=w&&w.ice; } return r.msg.startsWith('You need')?{msg:'Chegue na beira da água (ou no gelo do norte) para pescar.',consume:false}:{msg:'Você lança a linha…',consume:false}; };
if(ITEMS.fishing_pole) ITEMS.fishing_pole.weapon=false;
if(ITEMS.rod) ITEMS.rod.use = ITEMS.fishing_pole ? ITEMS.fishing_pole.use : ITEMS.rod.use;
finishFishing = function(sr){
  const sk=skill('pesca'), c=cellAt(Math.floor(player.x/T),Math.floor(player.y/T)), kind = sr.ice ? 'gelo' : sr.sea ? 'mar' : c&&c.b==='s' ? 'pantano' : 'rio';
  gainSkill('pesca',1);
  const p = .35 + sk/180 + (darkness(time)>.2&&darkness(time)<.8?.08:0);
  if(Math.random()<.08+sk/1000){ const [n,t]=rpick(JUNK);
    if(t==='gold'){ const g=5+Math.floor(Math.random()*20+sk/2); addItem('cash',g); toast(`Você puxa ${n.toLowerCase()}: ${g} de ouro!`); }
    else if(t==='msg'){ addItem('msg_bottle',1); toast('Uma garrafa com uma mensagem dentro!'); }
    else { addItem(n==='Bota Velha'?'old_boot':'seaweed',1); toast(`Você pesca… ${n.toLowerCase()}.`); }
    return; }
  if(sr.sea && sk>50 && Math.random()<.04){ const sp=openSpot(player.x,player.y,4); if(sp){ const r={x:sp[0],y:sp[1],face:'down',phase:0,moving:false,state:'chase',wp:null,idle:0,path:null,pathT:0,seenT:0,lastX:player.x,lastY:player.y,wind:0,cd:0,hurtT:0,alertT:0,swingT:0,doorT:0,aimAng:0,mon:'wyvern_water',camp:-1,foe:player};
      setupMon(r); raiders.push(r); toast('A água ferve… uma serpe d\'água sai do mar!'); shake=5; return; } }
  if(Math.random()<p){ const [nm]=rpick(FISHES[kind]), big=Math.random()<(.15+sk/300), n=big?2:1; addItem('fish',n); toast(big?`Que ${nm.toLowerCase()} grande! +2 peixes.`:`Você pesca um(a) ${nm.toLowerCase()}.`); }
  else toast(rpick(['Nada morde.','Escapou!','Só mato.','A isca sumiu.']));
};
VSTOCK.provisioner.push('fishing_pole'); VSTOCK.estalajadeiro.push('cooked_fish');

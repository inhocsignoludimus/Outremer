'use strict';
// =====================================================================
// AFTER LIGHT — front end: studio splash, title menu, story, options, credits
// =====================================================================
const SCREENS=['screen-splash','screen-title','screen-story','screen-create'];
function showScreen(id){
  for(const s of SCREENS) document.getElementById(s).style.display = s===id ? 'flex' : 'none';
  if(id==='screen-title'){ startTitleArt(); refreshContinue(); } else stopTitleArt();
  if(id!=='screen-story') stopStory();
  closeFront();
}
function hideIntroScreens(){ for(const s of SCREENS) document.getElementById(s).style.display='none'; stopTitleArt(); stopStory(); closeFront(); }
window.showScreen=showScreen; window.hideIntroScreens=hideIntroScreens;

// ---------------- Studio splash: logo on black, then the light goes out ----------------
let splashDone=false;
function runSplash(){
  const sp=document.getElementById('screen-splash');
  showScreen('screen-splash');
  requestAnimationFrame(()=>sp.classList.add('in'));
  setTimeout(()=>sp.classList.add('show-presents'),2200);
  setTimeout(()=>sp.classList.add('out'),5200);
  setTimeout(endSplash,6900);
}
function endSplash(){ if(splashDone) return; splashDone=true; showScreen('screen-title'); }
document.getElementById('screen-splash').addEventListener('pointerdown',endSplash);

// ---------------- Pixel art helpers ----------------
function mkArt(cv){ const g=cv.getContext('2d'); g.imageSmoothingEnabled=false; return g; }
function skyline(seed,w,h,base){ // silhueta de cidade murada: muralha com ameias, torres e o castelo no meio
  const r=mulberry32(seed), bs=[]; const wallH=Math.floor(base*0.38);
  bs.push({x:-4,w:w+8,h:wallH,merl:true,win:[]});
  for(let x=6;x<w;x+=34+Math.floor(r()*20)) bs.push({x,w:12,h:wallH+12+Math.floor(r()*10),merl:true,win:[]});
  const kx=Math.floor(w/2)-28; bs.push({x:kx,w:56,h:Math.floor(base*0.85),merl:true,win:[]}); bs.push({x:kx-6,w:14,h:Math.floor(base),merl:true,win:[]}); bs.push({x:kx+48,w:14,h:Math.floor(base*1.05),merl:true,win:[]});
  bs.push({x:kx+26,w:4,h:Math.floor(base*1.25),flag:true,win:[]});
  for(const b of bs) if(!b.flag) for(let wy=h-b.h+6; wy<h-6; wy+=7) for(let wx=b.x+3; wx<b.x+b.w-3; wx+=6) if(r()<.18) b.win.push({x:wx,y:wy,on:r()<.85,c:r()<.8?'#e8a850':'#f0d080'});
  return bs;
}
function drawAurora(g,w,t,a){
  for(let k=0;k<3;k++){ const col=k===1?'rgba(170,80,200,':'rgba(70,230,150,';
    for(let x=0;x<w;x+=2){ const y=18+k*10+Math.sin(x*0.03+t*0.0007+k)*8+Math.sin(x*0.011+t*0.0004)*6;
      const hgt=14+Math.sin(x*0.05+t*0.001+k*2)*6; const gr=g.createLinearGradient(0,y,0,y+hgt); gr.addColorStop(0,col+'0)'); gr.addColorStop(.5,col+(a*0.35)+')'); gr.addColorStop(1,col+'0)');
      g.fillStyle=gr; g.fillRect(x,y,2,hgt); } }
}
function drawStars(g,w,h,seed){ const r=mulberry32(seed); for(let i=0;i<70;i++){ g.fillStyle=r()<.2?'#cfd8e8':'#7a8498'; g.fillRect(Math.floor(r()*w),Math.floor(r()*h),1,1); } }
function drawCity(g,bs,w,h,lit){
  for(const b of bs){ g.fillStyle='#0d0f14';
    if(b.flag){ g.fillRect(b.x+1,h-b.h,1,b.h); g.fillStyle='#5a1410'; g.fillRect(b.x+2,h-b.h,8,5); continue; }
    g.fillRect(b.x,h-b.h,b.w,b.h); if(b.merl) for(let x=b.x;x<b.x+b.w;x+=4) g.fillRect(x,h-b.h-3,2,3); g.fillStyle='#161a22'; g.fillRect(b.x,h-b.h,1,b.h);
    for(const wi of b.win) if(wi.on && lit){ g.fillStyle=wi.c; g.fillRect(wi.x,wi.y,1,2); } }
}

// ---------------- Title screen art: a city whose lights keep going out ----------------
// letras góticas em pixel (7x11), desenhadas à mão aqui
const GOTH={
 O:["0111110","1100011","1100011","1100011","1100011","1100011","1100011","1100011","1100011","0110110","0011100"],
 U:["1100011","1100011","1100011","1100011","1100011","1100011","1100011","1100011","1100111","0111111","0011011"],
 T:["1111111","1011101","0011100","0011100","0011100","0011100","0011100","0011100","0011100","0011110","0001100"],
 R:["1111100","0110110","0110011","0110011","0110110","0111100","0110110","0110011","0110011","0110011","1110001"],
 E:["1111111","0110001","0110000","0110100","0111100","0110100","0110000","0110000","0110001","1111111","0000000"],
 M:["1100011","1110111","1111111","1101011","1101011","1100011","1100011","1100011","1100011","1100011","1100011"],
 A:["0011100","0110110","1100011","1100011","1111111","1100011","1100011","1100011","1100011","1100011","1100011"],
 L:["1111000","0110000","0110000","0110000","0110000","0110000","0110000","0110000","0110001","1111111","0000000"],
};
function gothText(g,txt,cx,y,s,fill,shadow,edge){
  const w=txt.length*8*s-s; let x=Math.round(cx-w/2);
  for(const ch of txt){ const gl=GOTH[ch]; if(gl){ for(let r=0;r<11;r++) for(let c=0;c<7;c++) if(gl[r][c]==='1'){
        g.fillStyle=shadow; g.fillRect(x+c*s+s,y+r*s+s,s,s); } } x+=8*s; }
  x=Math.round(cx-w/2);
  for(const ch of txt){ const gl=GOTH[ch]; if(gl){ for(let r=0;r<11;r++) for(let c=0;c<7;c++) if(gl[r][c]==='1'){
        g.fillStyle = r<3 ? edge : fill; g.fillRect(x+c*s,y+r*s,s,s); }
      // losangos nas pontas (serifas góticas)
      g.fillStyle=edge; g.fillRect(x+3*s,y-s,s,s); } x+=8*s; }
}
// ---------------- Tela de título: caverna, dragão sobre o tesouro, guerreiro de espada em punho ----------------
let titleRaf=0, titleT0=0;
function startTitleArt(){
  const cv=document.getElementById('title-art'); if(titleRaf) return;
  cv.width=320; cv.height=180; const g=mkArt(cv); titleT0=performance.now();
  const R=mulberry32(77), rocks=[]; for(let i=0;i<46;i++) rocks.push([R()*320,R()*180,2+R()*5,R()]);
  const embers=[]; for(let i=0;i<40;i++) embers.push({x:R()*320,y:180*R(),v:6+R()*14,p:R()*6});
  const coins=[]; for(let i=0;i<120;i++){ const a=R()*Math.PI, r=R(); coins.push([215+Math.cos(a)*70*r, 168-Math.sin(a)*18*r, R()]); }
  const poly=(pts,c)=>{ g.fillStyle=c; g.beginPath(); g.moveTo(pts[0][0],pts[0][1]); for(const p of pts.slice(1)) g.lineTo(p[0],p[1]); g.closePath(); g.fill(); };
  const P=(x,y,w,h,c)=>{ g.fillStyle=c; g.fillRect(Math.round(x),Math.round(y),w,h); };
  const frame=(now)=>{
    const t=(now-titleT0)/1000, br=Math.sin(t*1.3)*0.5+0.5, fl=0.85+Math.random()*0.15;
    // fundo da caverna
    const bg=g.createRadialGradient(205,120,10,200,110,230); bg.addColorStop(0,'#3a1c12'); bg.addColorStop(.45,'#1a0e0c'); bg.addColorStop(1,'#060405'); g.fillStyle=bg; g.fillRect(0,0,320,180);
    for(const [x,y,r,k] of rocks){ g.fillStyle=k>.5?'rgba(80,50,40,.25)':'rgba(10,6,6,.4)'; g.fillRect(x|0,y|0,r|0,(r*.6)|0); }
    // paredes e teto (estalactites)
    poly([[0,0],[320,0],[320,22],[300,30],[288,18],[270,34],[250,20],[232,40],[214,22],[196,30],[180,16],[160,36],[146,18],[128,28],[112,14],[96,40],[80,20],[62,30],[44,12],[26,34],[12,20],[0,28]],'#0c0707');
    for(const [x,len] of [[30,22],[70,30],[118,18],[160,40],[205,26],[262,34],[300,20]]) poly([[x-4,10],[x+4,10],[x,10+len]],'#140b0a');
    poly([[0,40],[24,52],[30,90],[18,130],[30,180],[0,180]],'#0a0606'); poly([[320,30],[296,50],[302,90],[288,140],[300,180],[320,180]],'#0a0606');
    // tesouro: monte de ouro com brilho
    poly([[140,180],[160,160],[200,148],[245,150],[285,165],[300,180]],'#5a3a0e');
    for(const [x,y,k] of coins){ const tw=Math.sin(t*3+k*20)>.92; P(x,y,2,1,tw?'#fff6c0':k>.6?'#e8b83a':k>.3?'#c8922a':'#9a6a1a'); }
    P(176,150,6,8,'#7a5a2a'); P(177,148,4,2,'#c8a040'); P(250,154,10,7,'#5a3418'); P(250,154,10,2,'#c8a040');
    // dragão (de lado, olhando para a esquerda)
    const by=Math.sin(t*1.3)*1.5;
    // asa de trás
    poly([[230,92+by],[250,30+by],[268,22+by],[262,44+by],[286,30+by],[278,58+by],[300,52+by],[282,86+by],[256,100+by]],'#3a0e0c');
    // cauda
    poly([[268,128+by],[300,140],[312,160],[296,170],[300,152],[280,146]],'#5a1410');
    // corpo
    poly([[196,96+by],[226,82+by],[262,90+by],[284,116+by],[276,140+by],[240,148],[210,140],[196,120+by]],'#6a1812');
    poly([[204,118+by],[232,112+by],[262,122+by],[268,138+by],[236,146],[210,138]],'#8a3a1e'); // barriga
    for(let i=0;i<7;i++) P(208+i*8,128+by,6,1,'#5a1a10');
    // pernas e garras
    poly([[208,130],[200,150],[192,158],[210,158],[218,140]],'#5a1410'); poly([[252,134],[250,156],[242,162],[262,162],[264,138]],'#5a1410');
    for(const x of [192,197,202,242,248,254]) P(x,157,2,3,'#d8c8a8');
    // pescoço e cabeça
    poly([[200,100+by],[182,74+by],[168,66+by],[160,76+by],[176,90+by],[192,110+by]],'#6a1812');
    for(let i=0;i<5;i++) P(176+i*4,72+i*6+by,3,2,'#3a0c0a');
    poly([[166,62+by],[146,62+by],[128,70+by],[134,76+by],[150,74+by],[170,78+by]],'#6a1812');   // focinho
    poly([[134,76+by],[150,80+by+br*4],[168,82+by],[170,78+by],[150,76+by]],'#4a0e0a');      // mandíbula aberta
    poly([[160,60+by],[172,48+by],[168,62+by]],'#d8c8a8'); poly([[152,61+by],[158,50+by],[160,62+by]],'#c8b898');  // chifres
    P(152,65+by,3,2,(Math.floor(t*0.7)%6===0&&t%1<.15)?'#6a1812':'#ffd84a');                        // olho (pisca)
    for(const x of [138,142,146]) P(x,75+by,1,2,'#f0e8d0');
    // asa da frente
    poly([[214,96+by],[226,40+by],[236,28+by],[238,52+by],[252,40+by],[252,70+by],[266,66+by],[250,98+by]],'#4a1210');
    for(const [x1,y1,x2,y2] of [[214,96,236,28],[226,96,252,40],[240,98,266,66]]){ g.strokeStyle='#2a0806'; g.lineWidth=1; g.beginPath(); g.moveTo(x1,y1+by); g.lineTo(x2,y2+by); g.stroke(); }
    // brasa na boca e fumaça
    const fx=128, fy=73+by;
    const fg=g.createRadialGradient(fx,fy,0,fx,fy,26*fl); fg.addColorStop(0,`rgba(255,200,90,${0.6*br+0.2})`); fg.addColorStop(1,'rgba(255,90,30,0)'); g.fillStyle=fg; g.fillRect(fx-30,fy-30,60,60);
    for(let i=0;i<6;i++){ const k=(t*20+i*9)%40; P(fx-6-k*0.6,fy-2-Math.sin(i+t)*3,2,1,`rgba(255,${150+i*15},60,${1-k/40})`); }
    // guerreiro (de costas, à esquerda, espada erguida para o dragão)
    const wx=74, wy=150;
    g.fillStyle='rgba(0,0,0,.45)'; g.beginPath(); g.ellipse(wx,wy+2,14,3,0,0,7); g.fill();
    poly([[wx-9,wy-30],[wx+7,wy-30],[wx+11,wy+1],[wx-13,wy+1]],'#7a1410');            // capa vermelha
    poly([[wx-9,wy-30],[wx-2,wy-30],[wx-6,wy],[wx-13,wy+1]],'#5a0e0c');
    P(wx-6,wy-4,4,6,'#2a2420'); P(wx+1,wy-4,4,6,'#2a2420');                              // botas
    P(wx-7,wy-32,14,10,'#8a8e96'); P(wx-7,wy-32,14,2,'#b8bcc4');                         // ombreiras de cota
    P(wx-4,wy-42,9,10,'#9aa0a8'); P(wx-4,wy-42,9,2,'#c8ccd4'); P(wx+1,wy-41,1,8,'#6a6e76'); // elmo
    P(wx-14,wy-28,9,14,'#5a3a1e'); P(wx-13,wy-27,7,12,'#7a1a14'); P(wx-11,wy-23,3,4,'#d8b040');   // escudo no braço
    // braço e espada erguida em diagonal para o dragão
    P(wx+5,wy-32,4,8,'#8a8e96'); P(wx+8,wy-38,4,6,'#8a8e96');
    g.save(); g.translate(wx+11,wy-40); g.rotate(0.7+Math.sin(t*2)*0.03);
    P(-1,-2,3,5,'#5a3a1e'); P(-4,-3,9,2,'#c8a040'); P(0,-28,2,25,'#d8dce4'); P(1,-28,1,25,'#9aa0a8'); P(0,-30,1,2,'#ffffff');
    if(Math.sin(t*2.2)>.8){ P(-1,-26,4,1,'#ffffff'); P(1,-28,1,4,'#ffffff'); }
    g.restore();
    // brasas subindo e névoa
    for(const e of embers){ e.y-=e.v/60; e.x+=Math.sin(t+e.p)*0.2; if(e.y<0){ e.y=180; e.x=120+Math.random()*200; } P(e.x,e.y,1,1,`rgba(255,${120+((e.p*30)|0)},40,.8)`); }
    const mist=g.createLinearGradient(0,150,0,180); mist.addColorStop(0,'rgba(20,10,10,0)'); mist.addColorStop(1,'rgba(20,10,10,.7)'); g.fillStyle=mist; g.fillRect(0,150,320,30);
    // título gótico
    gothText(g,'OUTREMER',160,10,2,'#d8a840','#1a0806','#f6e2a0');
    titleRaf=requestAnimationFrame(frame);
  };
  titleRaf=requestAnimationFrame(frame);
}
function stopTitleArt(){ if(titleRaf) cancelAnimationFrame(titleRaf); titleRaf=0; }

// ---------------- Story ----------------
const STORY=[
  { art:'seal',   text:'No princípio, Aelória era guardada pelo Selo de Luz.\nPor mil anos, reis e magos mantiveram acesas as suas runas — e as trevas dormiram sob a terra.' },
  { art:'dragon', text:'Mas toda luz se apaga. O Selo rachou, e nas cavernas do norte o Dragão Vermelho abriu os olhos.\nCom ele vieram os goblins, os orcs e os mortos que não descansam.' },
  { art:'city',   text:'Os homens ergueram muralhas. Aurélia, a capital, ainda resiste — mas as estradas já não são seguras.\nLorde Aurélio convoca todos os que tiverem coragem.' },
  { art:'paths',  text:'No mundo de Aelória, você pode ser o que quiser.\nGuerreiro, mago, ferreiro, ladino, mercador... a espada, o martelo ou o livro.\n\nA história é sua.' },
];
let storyIdx=0, storyRaf=0, storyT0=0, typed=0, storyCity=null;
function startStory(){ storyIdx=0; showScreen('screen-story'); openSlide(); }
function openSlide(){
  typed=0; storyT0=performance.now();
  document.getElementById('story-step').textContent=`${storyIdx+1} / ${STORY.length}`;
  document.getElementById('story-next').textContent = storyIdx===STORY.length-1 ? 'Criar personagem ▸' : 'Seguir ▸';
  if(!storyRaf) storyRaf=requestAnimationFrame(storyFrame);
}
function stopStory(){ if(storyRaf) cancelAnimationFrame(storyRaf); storyRaf=0; }
function storyFrame(now){
  const s=STORY[storyIdx], t=now-storyT0, cv=document.getElementById('story-art'), g=mkArt(cv);
  drawSlide(g,s.art,t,now);
  typed=Math.min(s.text.length, Math.floor(t/30));
  document.getElementById('story-text').textContent = s.text.slice(0,typed);
  storyRaf=requestAnimationFrame(storyFrame);
}
function drawSlide(g,kind,t,now){
  const W=320,H=150, P=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x|0,y|0,w,h);};
  const sky=(a,b)=>{ for(let y=0;y<H;y++){ const k=y/H; const ca=parseInt(a.slice(1),16), cb=parseInt(b.slice(1),16);
      const m=(s)=>Math.round(((ca>>s)&255)*(1-k)+((cb>>s)&255)*k); g.fillStyle=`rgb(${m(16)},${m(8)},${m(0)})`; g.fillRect(0,y,W,1);} };
  const hills=(base,amp,seed,col)=>{ g.fillStyle=col; for(let x=0;x<W;x++){ const h=base+Math.sin(x*.031+seed)*amp+Math.sin(x*.093+seed*2)*amp*.4; g.fillRect(x,h|0,1,H); } };
  const peaks=(base,col,seed)=>{ g.fillStyle=col; for(let x=0;x<W;x++){ const p=((x*.7+seed*37)%60)/60; const h=base-Math.abs(p-.5)*-2*0-(1-Math.abs(p*2-1))*34-Math.sin(x*.2+seed)*2; g.fillRect(x,h|0,1,H); } };
  if(kind==='seal'){
    sky('#05060f','#1a1630'); drawStars(g,W,90,7);
    const cx=160, cy=58, r=30, rot=now/3000, glow=.6+Math.sin(now/500)*.2;
    g.globalAlpha=.18*glow; g.fillStyle='#f0d070'; g.beginPath(); g.arc(cx,cy,r+16,0,7); g.fill(); g.globalAlpha=1;
    for(let a=0;a<64;a++){ const q=a/64*Math.PI*2; P(cx+Math.cos(q)*r, cy+Math.sin(q)*r,1,1,'#f0d070'); P(cx+Math.cos(q)*(r-6), cy+Math.sin(q)*(r-6),1,1,'#b08a30'); }
    for(let i=0;i<8;i++){ const q=rot+i/8*Math.PI*2, x=cx+Math.cos(q)*(r-3), y=cy+Math.sin(q)*(r-3); P(x-1,y-1,3,3,(i+Math.floor(now/400))%3?'#f0d070':'#fff4c0'); }
    P(cx-1,cy-14,3,28,'#f0d070'); P(cx-10,cy-5,21,3,'#f0d070'); P(cx-1,cy-14,1,28,'#fff4c0');
    hills(112,6,1,'#141226'); hills(124,5,4,'#0c0b18');
    for(let i=0;i<3;i++){ const x=60+i*100; P(x,104,2,20,'#2a2236'); P(x-2,102,6,3,'#2a2236'); P(x,100,2,2,'#f0d070'); }
  }
  if(kind==='dragon'){
    sky('#140406','#3a0c08'); peaks(118,'#1a0606',3);
    const gl=.5+Math.sin(now/300)*.15; g.globalAlpha=gl*.35; g.fillStyle='#ff5a20'; g.beginPath(); g.arc(160,128,70,0,7); g.fill(); g.globalAlpha=1;
    P(130,98,60,40,'#060202'); P(138,92,44,8,'#060202'); P(146,88,28,6,'#060202'); // boca da caverna
    // dragão em silhueta voando (asas batendo)
    const fx=150+Math.sin(now/1600)*50, fy=44+Math.sin(now/800)*5, fl=Math.sin(now/160);
    const poly=(pts,c)=>{ g.fillStyle=c; g.beginPath(); g.moveTo(pts[0][0],pts[0][1]); for(const q of pts) g.lineTo(q[0],q[1]); g.closePath(); g.fill(); };
    const dk='#0a0202', wy=fl*16;
    poly([[fx-8,fy],[fx-20,fy-10-wy],[fx-34,fy-18-wy*1.3],[fx-22,fy-4-wy*.3],[fx-30,fy-2-wy*.6],[fx-14,fy+3]],dk); // asa de trás
    poly([[fx-24,fy+2],[fx-38,fy+6],[fx-50,fy+2+Math.sin(now/300)*3],[fx-42,fy+8],[fx-24,fy+6]],dk);        // cauda
    poly([[fx-24,fy+1],[fx+8,fy-3],[fx+16,fy-6],[fx+24,fy-8],[fx+30,fy-6],[fx+24,fy-3],[fx+12,fy+4],[fx-20,fy+6]],dk); // corpo e pescoço
    poly([[fx+24,fy-8],[fx+21,fy-13],[fx+27,fy-9]],dk); // chifre
    poly([[fx-4,fy],[fx-2,fy-14-wy],[fx-14,fy-30-wy*1.4],[fx+6,fy-20-wy],[fx+2,fy-6-wy*.2],[fx+8,fy-1]],'#140404'); // asa da frente
    P(fx+25,fy-7,1,1,'#ff3a10');
    if(Math.floor(now/1600)%2){ for(let i=0;i<14;i++){ const x=fx+31+i*3, y=fy-2+Math.sin(i+now/60)*(i*.3); P(x,y,3,2,i<4?'#fff0a0':i<9?'#ff9a20':'#c8301a'); } }
    for(let i=0;i<18;i++){ const x=(i*53+now/12)%W, y=H-((i*29+now/9)%110); P(x,y,1,1,i%3?'#ff8a30':'#ffd070'); }
    // goblins e orcs saindo
    for(let i=0;i<6;i++){ const x=70+i*36+Math.sin(now/400+i)*2, y=134; P(x,y-8,4,8,'#140806'); P(x-1,y-11,6,3,'#140806'); P(x,y-10,1,1,'#ff4020'); P(x+3,y-10,1,1,'#ff4020'); }
    P(0,138,W,12,'#0a0303');
  }
  if(kind==='city'){
    sky('#1a1830','#4a3040'); drawStars(g,W,50,19);
    g.fillStyle='#e8e0c8'; g.beginPath(); g.arc(256,28,7,0,7); g.fill(); g.fillStyle='#1d1a33'; g.beginPath(); g.arc(259,26,6,0,7); g.fill(); // lua crescente
    hills(110,4,2,'#1a1424');
    const S='#4a4650', D='#2e2a34', L='#5e5a66';
    P(20,92,280,40,S); for(let x=20;x<300;x+=8) P(x,88,5,4,S);   // muralha com ameias
    for(let y=96;y<132;y+=6) for(let x=20+(y%12?0:4);x<300;x+=8) P(x,y,1,1,D);
    for(const tx of [20,96,190,284]){ P(tx-6,72,18,60,L); for(let x=tx-6;x<tx+12;x+=6) P(x,68,4,4,L); P(tx+1,86,3,6,'#141018');
      P(tx+2,58,1,12,'#6a5a3a'); const wv=Math.sin(now/300+tx)*1.5; P(tx+3,58+wv*.2,7,5,'#8a1a14'); P(tx+4,59,2,2,'#d8b040'); }
    // castelo ao fundo
    P(126,50,68,42,'#3a3640'); for(let x=126;x<194;x+=7) P(x,46,4,4,'#3a3640'); P(150,30,20,22,'#3a3640'); P(156,22,8,9,'#3a3640');
    for(const wx of [134,146,170,182]) P(wx,62,3,5,Math.sin(now/200+wx)>-.6?'#f0b040':'#a07020');
    P(144,104,32,28,'#1a1418'); P(146,106,28,26,'#2a1e14'); for(let x=148;x<172;x+=4) P(x,106,1,26,'#1a120c'); // portão
    for(const tx of [136,180]){ const fl=Math.random()*2; P(tx,100,2,4,'#5a3a1a'); P(tx-1,97-fl,4,3,'#ffb040'); P(tx,96-fl,2,2,'#fff0a0'); }
    // guardas nas ameias
    for(const gx of [60,230]){ const x=gx+Math.sin(now/1200+gx)*14; P(x,80,3,8,'#2a2a34'); P(x,77,3,3,'#8a8e96'); P(x+3,72,1,16,'#7a5a3a'); }
    P(0,132,W,18,'#1a1418');
    for(let i=0;i<5;i++){ const x=30+i*60+Math.sin(now/800+i)*3; P(x,140,3,6,'#0e0a0c'); P(x,143-4,1,1,'#ff3a20'); }
  }
  if(kind==='paths'){
    sky('#2a1e3a','#c8784a'); P(140,96,40,20,'#f0b060'); g.globalAlpha=.3; P(120,92,80,24,'#f0c080'); g.globalAlpha=1;
    hills(100,5,5,'#3a2a3a'); hills(112,4,9,'#2a1e28');
    P(0,118,W,32,'#2a2a1a'); for(let x=0;x<W;x+=3) P(x,118,1,(x*7)%3+1,'#3a3a22');
    const sk='#d8a87a', crew=[
      { look:{sex:'m',skin:sk,hair:'#3a2414',style:'short',jacket:'#5a5a62',jacketD:'#3a3a42',pants:'#3a3a42',boot:'#1a1a1a'}, head:'great_helm', body:'plate', weapon:'longsword' },
      { look:{sex:'f',skin:'#e0b090',hair:'#c8a050',style:'long',jacket:'#2a2a6a',jacketD:'#1a1a4a',pants:'#1a1a4a',boot:'#1a1210'}, head:'wizard_hat', body:'mage_robe', weapon:'staff' },
      { look:{sex:'m',skin:'#a8784a',hair:'#1a1210',style:'short',jacket:'#4a3a2a',jacketD:'#2a2018',pants:'#2a2018',boot:'#151210',beard:true}, head:'horned_helm', body:'scale_armor', weapon:'battleaxe' },
      { look:{sex:'m',skin:sk,hair:'#5a3a24',style:'buzz',jacket:'#6a6a72',jacketD:'#4a4a52',pants:'#3a3a42',boot:'#1a1a1a'}, head:'bascinet', body:'templar_tabard', weapon:'mace' },
      { look:{sex:'f',skin:sk,hair:'#2a1a12',style:'ponytail',jacket:'#2a3a22',jacketD:'#1a2616',pants:'#2a2a1a',boot:'#1a1210'}, head:'wool_hood', body:'studded_armor', weapon:'bow' },
      { look:{sex:'m',skin:'#c8956a',hair:'#6a6a6a',style:'short',jacket:'#6a4a2c',jacketD:'#4a321e',pants:'#3a2a1a',boot:'#1a1210',beard:true}, head:'kettle_hat', body:'leather_armor', weapon:'warhammer' },
    ];
    g.save(); g.translate(0,0); g.scale(2,2);
    crew.forEach((c,i)=>{ const x=22+i*25, y=70, bob=Math.round(Math.sin(now/400+i)*.6);
      g.globalAlpha=.35; g.fillStyle='#000'; g.fillRect(x-5,y-1,10,2); g.globalAlpha=1;
      drawHuman(g,x,y+bob,{face:'down',phase:0,moving:false,look:c.look,weapon:c.weapon,wAng:-.6,head:c.head,body:c.body}); });
    g.restore();
  }
  // vinheta
  g.globalAlpha=.35; g.fillStyle='#000'; g.fillRect(0,0,W,3); g.fillRect(0,H-3,W,3); g.globalAlpha=1;
}
document.getElementById('story-next').onclick=()=>{
  const s=STORY[storyIdx];
  if(typed<s.text.length){ storyT0=performance.now()-s.text.length*28-1; return; }
  if(storyIdx<STORY.length-1){ storyIdx++; openSlide(); } else showScreen('screen-create');
};
document.getElementById('story-skip').onclick=()=>showScreen('screen-create');

// ---------------- Title menu, saved games, options, credits ----------------
function openFront(id){ closeFront(); document.getElementById(id).style.display='flex'; }
function closeFront(){ for(const id of ['front-saves','front-options','front-credits']) document.getElementById(id).style.display='none'; }
document.getElementById('t-new').onclick=startStory;
document.getElementById('t-saves').onclick=()=>{ refreshContinue(); const s=newestSave();
  document.getElementById('saves-info').textContent = s ? `${s.name} — Day ${s.day}, ${String(Math.floor(s.time)).padStart(2,'0')}h · saved ${new Date(s.savedAt).toLocaleString()}` : 'No saved game yet. Saves are made from the in-game menu (Esc) or by sleeping in a bed.';
  openFront('front-saves'); };
document.getElementById('t-options').onclick=()=>{ syncOpts(); openFront('front-options'); };
document.getElementById('t-credits').onclick=()=>openFront('front-credits');
for(const id of ['saves-close','options-close','credits-close']) document.getElementById(id).onclick=closeFront;
document.getElementById('create-back').onclick=()=>showScreen('screen-title');
function syncOpts(){
  document.getElementById('o-shake').checked=OPTS.shake; document.getElementById('o-blood').checked=OPTS.blood;
  document.getElementById('o-day').value=OPTS.dayLen;
}
document.getElementById('o-shake').onchange=e=>{ OPTS.shake=e.target.checked; saveOpts(); };
document.getElementById('o-blood').onchange=e=>{ OPTS.blood=e.target.checked; saveOpts(); };
document.getElementById('o-day').onchange=e=>{ OPTS.dayLen=e.target.value; saveOpts(); };

runSplash();

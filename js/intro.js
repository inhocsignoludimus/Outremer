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
let titleRaf=0, titleCity=null, titleT0=0;
function startTitleArt(){
  const cv=document.getElementById('title-art'); if(titleRaf) return;
  cv.width=320; cv.height=180; const g=mkArt(cv); titleCity=skyline(7,320,180,95); titleT0=performance.now();
  const fires=[[40,176],[150,177],[262,175]];
  const frame=(now)=>{
    const t=now-titleT0;
    const sky=g.createLinearGradient(0,0,0,180); sky.addColorStop(0,'#05060c'); sky.addColorStop(1,'#141826'); g.fillStyle=sky; g.fillRect(0,0,320,180);
    drawStars(g,320,110,3); g.fillStyle='#d8d0b8'; g.fillRect(250,26,10,10); g.fillStyle='#05060c'; g.fillRect(253,24,10,10);
    for(const b of titleCity) for(const wi of b.win) if(wi.on && Math.random()<0.0009+t/40000000) wi.on=false;
    drawCity(g,titleCity,320,180,true);
    for(const [fx,fy] of fires){ const fl=0.6+Math.random()*0.4; const gr=g.createRadialGradient(fx,fy,0,fx,fy,22*fl); gr.addColorStop(0,'rgba(255,150,60,.55)'); gr.addColorStop(1,'rgba(255,120,40,0)');
      g.fillStyle=gr; g.fillRect(fx-24,fy-24,48,48); g.fillStyle='#ffd27a'; g.fillRect(fx,fy-2,1,2); }
    titleRaf=requestAnimationFrame(frame);
  };
  titleRaf=requestAnimationFrame(frame);
}
function stopTitleArt(){ if(titleRaf) cancelAnimationFrame(titleRaf); titleRaf=0; }

// ---------------- Story ----------------
const STORY=[
  { art:'sun',   text:'On the night of March 14th, the Sun woke up.\nThe largest solar storm ever recorded reached the Earth in under a day.' },
  { art:'grid',  text:'The sky burned green and violet. Then, one by one, the lights went out — every grid, satellite and transformer on the planet died with them.' },
  { art:'dark',  text:'No power. No phones. No news. Every modern car died where it stood — only the old machines with no chips in them still run. The stores are still full. They won\'t be for long.' },
  { art:'dawn',  text:'Four days later. Gangs have taken over buildings in the cities and set up camps in the woods. Survivors hide behind locked doors, deciding who to trust.\n\nThere are no monsters here. Only people remain — and you are one of them.' },
];
let storyIdx=0, storyRaf=0, storyT0=0, typed=0, storyCity=null;
function startStory(){ storyIdx=0; showScreen('screen-story'); openSlide(); }
function openSlide(){
  typed=0; storyT0=performance.now(); storyCity=skyline(11+storyIdx,320,150,80);
  document.getElementById('story-step').textContent=`${storyIdx+1} / ${STORY.length}`;
  document.getElementById('story-next').textContent = storyIdx===STORY.length-1 ? 'Create your survivor ▸' : 'Next ▸';
  if(!storyRaf) storyRaf=requestAnimationFrame(storyFrame);
}
function stopStory(){ if(storyRaf) cancelAnimationFrame(storyRaf); storyRaf=0; }
function storyFrame(now){
  const s=STORY[storyIdx], t=now-storyT0, cv=document.getElementById('story-art'), g=mkArt(cv);
  drawSlide(g,s.art,t,now);
  typed=Math.min(s.text.length, Math.floor(t/28));
  document.getElementById('story-text').textContent = s.text.slice(0,typed);
  storyRaf=requestAnimationFrame(storyFrame);
}
function drawSlide(g,kind,t,now){
  const W_=320,H_=150;
  if(kind==='sun'){
    g.fillStyle='#03040a'; g.fillRect(0,0,W_,H_); drawStars(g,W_,H_,5);
    const pulse=1+Math.sin(now*0.004)*0.04;
    const gr=g.createRadialGradient(40,75,6,40,75,70*pulse); gr.addColorStop(0,'#fff6c0'); gr.addColorStop(.25,'#ffb040'); gr.addColorStop(.5,'rgba(255,90,20,.6)'); gr.addColorStop(1,'rgba(255,60,0,0)');
    g.fillStyle=gr; g.fillRect(0,0,160,150); g.fillStyle='#ffd060'; g.beginPath(); g.arc(40,75,26,0,7); g.fill();
    const reach=Math.min(1,t/2500);
    for(let k=0;k<5;k++){ g.strokeStyle=`rgba(255,${150+k*15},60,${0.7-k*0.12})`; g.lineWidth=3-k*0.4; g.beginPath();
      g.moveTo(62,70+k*3); g.bezierCurveTo(120,20+k*6,180,40+k*8,62+(W_-110)*reach,72+k*2); g.stroke(); }
    g.fillStyle='#2a5a9a'; g.beginPath(); g.arc(270,74,12,0,7); g.fill(); g.fillStyle='#3a7a3a'; g.fillRect(264,70,6,4); g.fillRect(272,76,5,3);
    if(reach>=1){ g.strokeStyle=`rgba(120,255,170,${0.4+Math.sin(now*0.01)*0.2})`; g.lineWidth=2; g.beginPath(); g.arc(270,74,15,0,7); g.stroke(); }
  }
  if(kind==='grid'){
    const sky=g.createLinearGradient(0,0,0,H_); sky.addColorStop(0,'#050812'); sky.addColorStop(1,'#151a28'); g.fillStyle=sky; g.fillRect(0,0,W_,H_);
    drawStars(g,W_,90,8); drawAurora(g,W_,now,1);
    const off=Math.max(0,(t-1500)/3500);
    for(const b of storyCity) for(const wi of b.win){ if(wi.on && (wi.x/W_)<off*1.1+ (Math.random()*0.05)) wi.on=false; }
    drawCity(g,storyCity,W_,H_,true);
    for(let i=0;i<8;i++){ const px=i*44+10; g.fillStyle='#08090c'; g.fillRect(px,H_-30,1,30); g.fillRect(px-4,H_-28,9,1);
      if(px/W_>off && Math.random()<.1){ g.fillStyle='#bfe8ff'; g.fillRect(px-1,H_-31,3,2); } }
  }
  if(kind==='dark'){
    g.fillStyle='#07080c'; g.fillRect(0,0,W_,H_); drawStars(g,W_,70,9);
    for(const b of storyCity) for(const wi of b.win) wi.on=false;
    drawCity(g,storyCity,W_,H_-10,false); g.fillStyle='#0a0b0e'; g.fillRect(0,H_-12,W_,12);
    for(const [fx,fy] of [[60,H_-12],[190,H_-12],[280,H_-12]]){ const fl=0.6+Math.random()*0.4; const gr=g.createRadialGradient(fx,fy,0,fx,fy,26*fl);
      gr.addColorStop(0,'rgba(255,150,60,.6)'); gr.addColorStop(1,'rgba(255,120,40,0)'); g.fillStyle=gr; g.fillRect(fx-28,fy-28,56,40);
      g.fillStyle='#5a2a14'; g.fillRect(fx-2,fy-4,5,4); g.fillStyle='#ffc060'; g.fillRect(fx-1+Math.floor(Math.random()*2),fy-6,2,2);
      for(let k=0;k<3;k++){ g.fillStyle='#000'; const sx=fx-12+k*10; g.fillRect(sx,fy-9,3,9); g.fillRect(sx,fy-11,3,2); } }
    for(let k=0;k<6;k++){ const sy=(H_-30)-((t*0.02+k*20)%60); g.fillStyle=`rgba(90,90,90,${0.25-k*0.03})`; g.fillRect(186+Math.sin(sy*0.2)*3,sy,4,3); }
  }
  if(kind==='dawn'){
    const p=Math.min(1,t/5000);
    const sky=g.createLinearGradient(0,0,0,H_); sky.addColorStop(0,`rgb(${20+p*40},${22+p*30},${40+p*30})`); sky.addColorStop(.7,`rgb(${90+p*120},${50+p*60},${40})`); sky.addColorStop(1,'#2a1a14');
    g.fillStyle=sky; g.fillRect(0,0,W_,H_);
    g.fillStyle=`rgba(255,200,120,${0.4+p*0.5})`; g.beginPath(); g.arc(250,H_-40+ (1-p)*20,14,0,7); g.fill();
    for(const b of storyCity) for(const wi of b.win) wi.on=false;
    g.save(); g.globalAlpha=.85; drawCity(g,storyCity.filter(b=>b.x>140),W_,H_-28,false); g.restore();
    g.fillStyle='#120c0a'; g.beginPath(); g.moveTo(0,H_); g.lineTo(0,H_-26); g.quadraticCurveTo(110,H_-44,200,H_-24); g.lineTo(W_,H_-20); g.lineTo(W_,H_); g.fill();
    const fx=96, fy=H_-38; g.fillStyle='#050404'; g.fillRect(fx,fy-13,4,9); g.fillRect(fx,fy-4,1,4); g.fillRect(fx+3,fy-4,1,4); g.fillRect(fx+1,fy-17,3,4); g.fillRect(fx-2,fy-12,3,6); g.fillRect(fx+4,fy-10,1,8);
  }
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

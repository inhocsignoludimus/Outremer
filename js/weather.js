// =====================================================================
// CLIMA: céu limpo, nublado, chuva, tempestade (raios), neblina e neve no norte.
// O tempo muda sozinho ao longo do dia (transições suaves) e afeta a luz do jogo inteiro.
// Desenho: chuva/neve/neblina/relâmpago por cima da tela em todas as câmeras; sombras de nuvem no chão
// (isométrica e clássica); na primeira pessoa o céu ganha cúpula, sol, lua, estrelas e nuvens (fp.js).
// =====================================================================
(function(){
const KINDS={ clear:{cover:.05,rain:0,fog:0,dim:0},   cloudy:{cover:.7,rain:0,fog:.05,dim:.12},
  rain:{cover:.9,rain:.55,fog:.15,dim:.22},          storm:{cover:1,rain:1,fog:.25,dim:.34},
  fog:{cover:.5,rain:0,fog:.85,dim:.12} };
const NEXT={ clear:[['clear',5],['cloudy',4],['fog',1]], cloudy:[['clear',3],['cloudy',2],['rain',4],['fog',1]],
  rain:[['cloudy',4],['rain',2],['storm',2],['clear',1]], storm:[['rain',5],['cloudy',2]], fog:[['clear',4],['cloudy',3]] };
const MSG={ clear:'O céu abre.', cloudy:'Nuvens cobrem o céu.', rain:'Começa a chover.', storm:'Uma tempestade se aproxima. Trovões ao longe.', fog:'Uma neblina espessa desce.' };
const MSG_SNOW={ rain:'Começa a nevar.', storm:'Uma nevasca se aproxima.' };
const WX=window.WX={kind:'clear',next:'clear',t:1,cover:.05,rain:0,fog:0,dim:0,wind:.3,flash:0,snow:false,timer:3,indoor:false};
let lastT=null, lastBolt=0;
function pick(k){ const L=NEXT[k]; let s=L.reduce((a,b)=>a+b[1],0), r=Math.random()*s; for(const [n,w] of L){ if((r-=w)<0) return n; } return L[0][0]; }
function biomeHere(){ try{ const x=player.x/T|0, y=player.y/T|0, r=regions[regionId[y*W+x]]; return (r&&r.biome)||'p'; }catch(e){ return 'p'; } }
function inside(){ try{ const x=player.x/T|0, y=player.y/T|0; if(typeof DG!=='undefined'&&DG&&(inRect(DG.L1,x,y)||inRect(DG.L2,x,y))) return 'dg'; return (typeof bld!=='undefined'&&bld&&bld[idx(x,y)]>=0)?'house':''; }catch(e){ return ''; } }
function step(dtH,now){
  if(!KINDS[WX.kind]) WX.kind='clear'; if(!KINDS[WX.next]) WX.next=WX.kind; if(!(WX.timer>=0)) WX.timer=2; if(!(WX.t>=0)) WX.t=1;
  WX.timer-=dtH; if(WX.timer<=0){ WX.next=pick(WX.kind); WX.timer=1.5+Math.random()*3.5; WX.t=0;
    const snow=biomeHere()==='n'; if(WX.next!==WX.kind&&typeof toast==='function'&&running) toast((snow&&MSG_SNOW[WX.next])||MSG[WX.next]); }
  WX.t=Math.min(1,WX.t+dtH/.6); if(WX.t>=1) WX.kind=WX.next;
  const A=KINDS[WX.kind], B=KINDS[WX.next], f=WX.t*WX.t*(3-2*WX.t);
  for(const k of ['cover','rain','fog','dim']) WX[k]=A[k]+(B[k]-A[k])*f;
  const b=biomeHere(); WX.snow=b==='n'; if(b==='o') WX.rain*=.4;    // deserto quase não chove
  WX.wind=.25+WX.rain*.9+Math.sin(now/9000)*.15;
  WX.indoor=inside();
  // raios na tempestade
  if(WX.rain>.8&&WX.cover>.9&&!WX.snow&&now-lastBolt>3500&&Math.random()<.004){ lastBolt=now; WX.flash=1; WX.bolt={x:Math.random(),seed:Math.random()*1e4,t0:now};
    if(typeof sfx==='function') try{ setTimeout(()=>sfx('thunder'),400+Math.random()*1400); }catch(e){} }
  WX.flash=Math.max(0,WX.flash-.045);
}
// a escuridão do jogo inteiro leva em conta as nuvens (e os relâmpagos clareiam)
if(typeof darkness==='function'){ const _dk=darkness; darkness=function(h){ const d=_dk(h); if(WX.indoor==='dg') return d; return Math.max(0,Math.min(.94,d+WX.dim*(1-d*.6)-WX.flash*.5)); }; }
// atualização a cada quadro
if(typeof update==='function'){ const _up=update; update=function(dt){ _up(dt); if(typeof running!=='undefined'&&!running) return; const now=performance.now(); step(dt*0.05*((typeof OPTS!=='undefined'&&OPTS.dayLen==='long')?.5:1),now); }; }
// ---------- desenho por cima da tela ----------
const drops=[]; for(let i=0;i<420;i++) drops.push({x:Math.random(),y:Math.random(),z:.4+Math.random()*.6,s:Math.random()});
const cloudCv=document.createElement('canvas'); cloudCv.width=cloudCv.height=128;
{ const g=cloudCv.getContext('2d'), im=g.createImageData(128,128); const h=(x,y)=>{ const s=Math.sin(x*127.1+y*311.7)*43758.5453; return s-Math.floor(s); };
  const vn=(x,y,p)=>{ const X=Math.floor(x),Y=Math.floor(y),fx=x-X,fy=y-Y,w=v=>v*v*(3-2*v), a=h((X%p+p)%p,(Y%p+p)%p),b=h(((X+1)%p+p)%p,(Y%p+p)%p),c=h((X%p+p)%p,((Y+1)%p+p)%p),d=h(((X+1)%p+p)%p,((Y+1)%p+p)%p); return a+(b-a)*w(fx)+(c-a)*w(fy)+(a-b-c+d)*w(fx)*w(fy); };
  for(let y=0;y<128;y++) for(let x=0;x<128;x++){ let v=0,amp=.55,fr=4; for(let o=0;o<4;o++){ v+=vn(x/128*fr,y/128*fr,fr)*amp; amp*=.5; fr*=2; } const q=(y*128+x)*4; im.data[q]=im.data[q+1]=im.data[q+2]=255; im.data[q+3]=Math.max(0,Math.min(255,(v-.36)*520)); }
  g.putImageData(im,0,0); }
window.WX_CLOUDS=cloudCv;
function overlay(ctx,now,fp){ const cw=canvas.width, ch=canvas.height; if(!cw) return; const ind=WX.indoor;
  // sombras de nuvem passando pelo chão (vista de cima)
  if(!fp&&WX.cover>.2&&!ind){ const s=Math.round(ch*1.1), ox=((now/1000*WX.wind*18+(cam?cam.x:0)*.6)%s+s)%s, oy=((now/1000*6+(cam?cam.y:0)*.6)%s+s)%s;
    ctx.save(); ctx.globalAlpha=Math.min(.45,(WX.cover-.2)*.6); ctx.globalCompositeOperation='multiply'; ctx.imageSmoothingEnabled=true; ctx.filter='brightness(0.35)';
    for(let y=-oy;y<ch;y+=s) for(let x=-ox;x<cw;x+=s) ctx.drawImage(cloudCv,x,y,s,s); ctx.restore(); }
  // neblina
  if(WX.fog>.02&&ind!=='dg'){ ctx.save(); const a=WX.fog*(ind?.25:.55), dk=typeof darkness==='function'?darkness(time):0, c=Math.round(200-dk*150);
    const gr=ctx.createLinearGradient(0,0,0,ch); gr.addColorStop(0,`rgba(${c},${c+4},${c+10},${a})`); gr.addColorStop(.6,`rgba(${c},${c+4},${c+10},${a*.7})`); gr.addColorStop(1,`rgba(${c},${c+4},${c+10},${a*.45})`);
    ctx.fillStyle=gr; ctx.fillRect(0,0,cw,ch); ctx.restore(); }
  // chuva ou neve
  const R=WX.rain*(ind==='dg'?0:ind?.15:1);
  if(R>.02){ ctx.save(); const n=Math.floor(drops.length*Math.min(1,R)), px=Math.max(1,Math.round(ch/270)), yaw=fp&&typeof fpYaw==='function'?fpYaw():0;
    const sl=(WX.wind*.35+(fp?Math.sin(yaw*2)*.15:0));
    if(WX.snow){ ctx.fillStyle='rgba(240,244,255,.9)'; for(let i=0;i<n;i++){ const d=drops[i], sp=.05+d.z*.07, y=(d.y+now/1000*sp)%1, x=((d.x+Math.sin(now/1300+d.s*6)*.01+now/1000*sl*.03)%1+1)%1, z=Math.ceil(px*d.z*1.6);
        ctx.fillRect(Math.round(x*cw),Math.round(y*ch),z,z); } }
    else { ctx.strokeStyle=`rgba(190,205,225,${.35+R*.3})`; ctx.lineWidth=px; ctx.beginPath(); for(let i=0;i<n;i++){ const d=drops[i], sp=1.1+d.z*1.2, y=(d.y+now/1000*sp)%1, x=((d.x+now/1000*sl*.2)%1+1)%1, L=ch*(.025+d.z*.03);
        const X=x*cw, Y=y*ch; ctx.moveTo(X,Y); ctx.lineTo(X-sl*L,Y+L); } ctx.stroke();
      // respingos no chão
      if(!ind){ ctx.fillStyle='rgba(200,215,235,.55)'; for(let i=0;i<n/6;i++){ const d=drops[i], k=Math.floor(now/120+d.s*10); const sx=((d.x*7.3+k*.137)%1)*cw, sy=ch*(fp?.62:.0)+((d.y*3.1+k*.291)%1)*ch*(fp?.38:1); if(((k+i)%3)===0) ctx.fillRect(sx|0,sy|0,px*2,px); } } }
    // escurece um pouco
    ctx.fillStyle=`rgba(20,26,40,${R*.18})`; ctx.fillRect(0,0,cw,ch); ctx.restore(); }
  // relâmpago
  if(WX.flash>0&&ind!=='dg'){ ctx.save(); ctx.fillStyle=`rgba(225,232,255,${WX.flash*(ind?.25:.55)})`; ctx.fillRect(0,0,cw,ch);
    if(fp&&WX.bolt&&now-WX.bolt.t0<220&&!ind){ let x=WX.bolt.x*cw, y=0; ctx.strokeStyle='rgba(255,255,255,.95)'; ctx.lineWidth=Math.max(2,ch/200); ctx.beginPath(); ctx.moveTo(x,y); let s=WX.bolt.seed;
      while(y<ch*.42){ s=(s*9301+49297)%233280; x+=(s/233280-.5)*ch*.08; y+=ch*.035; ctx.lineTo(x,y); } ctx.stroke(); }
    ctx.restore(); }
}
if(typeof render==='function'){ const _r=render; render=function(now){ const r=_r(now); try{ overlay(ctx,now,typeof fpOn==='function'&&fpOn()); }catch(e){} return r; }; }
// som: trovão e chuva contínua (ruído filtrado)
if(typeof SFX!=='undefined'){ SFX.thunder=()=>{ noise(2.8,{f:180,fto:50,q:.7,vol:.55,ft:'lowpass',rev:true}); noise(.25,{f:900,fto:300,q:.6,vol:.25}); }; }
let rainNode=null;
setInterval(()=>{ try{ if(typeof SND==='undefined'||!SND.ctx) return; const c=SND.ctx; const want=(running?WX.rain*(WX.snow?0:1)*(WX.indoor==='dg'?0:WX.indoor?.5:1):0);
  if(!rainNode&&want>.02){ const src=c.createBufferSource(); src.buffer=SND.noise; src.loop=true; const f=c.createBiquadFilter(); f.type='highpass'; f.frequency.value=900; const g=c.createGain(); g.gain.value=0; src.connect(f); f.connect(g); g.connect(SND.amb); src.start(); rainNode={src,g}; }
  if(rainNode){ rainNode.g.gain.setTargetAtTime(want*.35,c.currentTime,.8); } }catch(e){} },500);
// salvar/carregar
if(typeof saveGame==='function'){ const _s=saveGame; saveGame=function(){ try{ localStorage.setItem('outremer_wx',JSON.stringify({kind:WX.kind,next:WX.next,t:WX.t,timer:WX.timer})); }catch(e){} return _s.apply(this,arguments); }; }
try{ const s=JSON.parse(localStorage.getItem('outremer_wx')||'null'); if(s&&KINDS[s.kind]) Object.assign(WX,s); }catch(e){}
})();

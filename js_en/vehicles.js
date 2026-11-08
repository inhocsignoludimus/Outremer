'use strict';
// =====================================================================
// AFTER LIGHT — vehicles: sprites (top-down, nose up), wrecks, and the
// few old machines the flare didn't fry: carbureted pickups, classic
// cars, motorcycles, camper trailers and outboard boats.
// =====================================================================
const VEH_CACHE = new Map();
const VEH_KINDS = {
  sedan:  { name:'Old Sedan',      w:26, h:52, max:150, acc:95,  turn:2.3, fuelUse:.010, seats:true, trunk:10, land:true },
  pickup: { name:'Old Pickup',     w:28, h:62, max:140, acc:90,  turn:2.1, fuelUse:.012, trunk:16, land:true, tow:true },
  van:    { name:'Van',            w:28, h:58, max:125, acc:80,  turn:1.9, fuelUse:.013, trunk:20, land:true },
  moto:   { name:'Motorcycle',     w:10, h:24, max:175, acc:130, turn:3.0, fuelUse:.006, trunk:3,  land:true, small:true },
  camper: { name:'Camper Trailer', w:30, h:58, trunk:24, trailer:true, land:true },
  boat:   { name:'Motor Boat',     w:24, h:54, max:115, acc:60,  turn:1.6, fuelUse:.011, trunk:8,  water:true },
};
function vshade(hex,f){ const n=parseInt(hex.slice(1),16); const c=v=>Math.max(0,Math.min(255,Math.round(v*f)));
  return '#'+[c(n>>16),c((n>>8)&255),c(n&255)].map(v=>v.toString(16).padStart(2,'0')).join(''); }
function vehSprite(kind, col, wreck, seed=1){
  const key=kind+col+(wreck?'w'+(seed%7):'');
  if(VEH_CACHE.has(key)) return VEH_CACHE.get(key);
  const K=VEH_KINDS[kind]||VEH_KINDS.sedan, c=document.createElement('canvas'); c.width=K.w; c.height=K.h;
  const g=c.getContext('2d'), R=(x,y,w,h,cc)=>{ g.fillStyle=cc; g.fillRect(x,y,w,h); };
  let s=seed*9301+49297; const rnd=()=>((s=(s*9301+49297)%233280)/233280);
  const body=wreck?vshade(col,.8):col, lt=vshade(body,1.18), dk=vshade(body,.68), glass=wreck?'#0e1318':'#1c2a36', gl='#4a6478', OUT='#100d0c';
  const W=K.w, H=K.h;
  if(kind==='sedan'||kind==='pickup'||kind==='van'){
    // wheels
    for(const y of [8, H-17]){ R(0,y,2,9,'#121212'); R(W-2,y,2,9,'#121212'); }
    R(2,1,W-4,H-2,OUT); R(1,3,W-2,H-6,OUT);
    R(3,2,W-6,H-4,body); R(2,4,W-4,H-8,body);
    R(2,4,1,H-8,lt); R(W-3,4,1,H-8,dk);                // light from the left
    if(kind==='sedan'){
      R(4,14,W-8,7,glass); R(5,15,6,1,gl);              // windscreen
      R(4,21,W-8,16,lt); R(4,21,W-8,1,vshade(body,1.3)); // roof
      R(3,15,1,22,glass); R(W-4,15,1,22,glass);          // side windows
      R(4,37,W-8,5,glass); R(Math.floor(W/2)-1,4,2,9,dk); // rear window + hood crease
    } else if(kind==='pickup'){
      R(4,15,W-8,6,glass); R(5,16,6,1,gl);
      R(4,21,W-8,10,lt); R(3,16,1,14,glass); R(W-4,16,1,14,glass); R(4,31,W-8,2,glass);
      R(3,34,W-6,H-37,vshade(body,.9)); R(5,35,W-10,H-40,'#2a2420');  // load bed
      for(let y=37;y<H-6;y+=4) R(5,y,W-10,1,'#3a322a');
      R(3,H-5,W-6,2,dk); R(Math.floor(W/2)-1,4,2,10,dk);
    } else {
      R(4,8,W-8,6,glass); R(5,9,6,1,gl);
      R(4,14,W-8,H-18,lt); for(let y=18;y<H-8;y+=6) R(6,y,W-12,1,dk);
      R(3,9,1,12,glass); R(W-4,9,1,12,glass);
    }
    R(1,16,2,2,body); R(W-3,16,2,2,body);               // mirrors
    R(4,2,4,2,wreck?'#5a5a50':'#e8e0b0'); R(W-8,2,4,2,wreck?'#5a5a50':'#e8e0b0');
    R(4,H-3,4,1,'#8a1c18'); R(W-8,H-3,4,1,'#8a1c18');
  } else if(kind==='moto'){
    R(3,0,4,7,'#141414'); R(4,1,2,5,'#2a2a2a');         // front wheel
    R(0,7,10,1,'#3a3a3a'); R(0,7,1,2,'#222'); R(9,7,1,2,'#222'); // handlebar
    R(4,6,2,3,'#555');
    R(2,9,6,6,body); R(2,9,6,1,lt); R(7,10,1,5,dk);      // tank
    R(3,15,4,5,'#2a2220'); R(3,15,4,1,'#3e3430');        // seat
    R(3,18,4,6,'#141414'); R(4,19,2,4,'#2a2a2a');        // rear wheel
    R(7,17,2,4,'#7a7a70');                               // exhaust
  } else if(kind==='camper'){
    R(13,0,4,7,'#3a3a3a'); R(14,0,2,2,'#555');           // tow hitch
    for(const y of [H-22]) { R(0,y,2,10,'#121212'); R(W-2,y,2,10,'#121212'); }
    R(2,6,W-4,H-7,OUT); R(3,7,W-6,H-9,'#d8d0bc'); R(3,7,1,H-9,'#ece6d6'); R(W-4,7,1,H-9,'#a8a090');
    R(3,20,W-6,3,body); R(3,24,W-6,1,dk);                 // stripe
    R(8,12,6,4,'#8a8a80'); R(17,34,6,4,'#8a8a80');       // roof vents
    R(3,30,1,8,'#1c2a36'); R(W-4,30,1,8,'#1c2a36');
    R(9,H-4,12,2,'#8a1c18');
  } else if(kind==='boat'){
    for(let y=0;y<14;y++){ const hw=Math.round(2+y*(W/2-2)/14); R(W/2-hw,y,hw*2,1,y<2?OUT:'#d8d4c8'); R(W/2-hw,y,1,1,OUT); R(W/2+hw-1,y,1,1,OUT); }
    R(0,14,W,H-18,OUT); R(1,14,W-2,H-19,'#d8d4c8'); R(1,14,1,H-19,'#f0ece4'); R(W-2,14,1,H-19,'#a8a49a');
    R(3,10,W-6,H-16,'#8a6a44'); for(let y=12;y<H-8;y+=3) R(3,y,W-6,1,'#6e5232');
    R(1,22,W-2,2,body);                                    // stripe
    R(5,18,W-10,3,'#3a2e24'); R(5,32,W-10,3,'#3a2e24');   // benches
    R(W/2-3,H-6,6,6,'#2a2c2e'); R(W/2-2,H-6,4,2,'#4a4c4e'); // outboard motor
    R(5,6,W-10,4,'#1c2a36');                               // windscreen
  }
  if(wreck){
    for(let k=0;k<26;k++){ const x=2+Math.floor(rnd()*(W-4)), y=3+Math.floor(rnd()*(H-6)); const p=g.getImageData(x,y,1,1).data; if(p[3]<200) continue;
      R(x,y,1+(rnd()>.7?1:0),1, rnd()>.5?'#5a3018':'#3e2210'); }
    for(let k=0;k<5;k++){ const x=4+Math.floor(rnd()*(W-8)), y=14+Math.floor(rnd()*14); R(x,y,1,1,'#6a8494'); }
    g.globalCompositeOperation='source-atop'; g.fillStyle='rgba(30,24,16,.18)'; g.fillRect(0,0,W,H); g.globalCompositeOperation='source-over';
  }
  VEH_CACHE.set(key,c); return c;
}

// ------------------------------------------------------------------
// Drivable vehicles
// ------------------------------------------------------------------
let vehicles=[], driving=null, vehMenu=null;
const VCOLS=['#7a2a22','#2e4a6a','#3a5a3a','#b8a888','#5a5a5a','#8a6a2a','#2a2a2a','#6a3a5a','#d8d0c0'];
function vehAt(kind,x,y,ang,opt={}){
  const K=VEH_KINDS[kind];
  const v={kind, x, y, ang, sp:0, steer:0, col:opt.col||VCOLS[Math.floor(th(Math.floor(x),Math.floor(y),3)*VCOLS.length)],
    fuel: K.trailer?0:(opt.fuel!==undefined?opt.fuel:Math.round(15+th(Math.floor(x),Math.floor(y),5)*55)), hp:100,
    store:new Array(K.trunk||6).fill(null), hitch:null, towedBy:null, id:vehicles.length, noiseT:0};
  vehicles.push(v); return v;
}
const vdir=a=>[Math.sin(a),-Math.cos(a)];       // ang 0 = nose up (north)
function vehCorners(v,x=v.x,y=v.y,a=v.ang,pad=0){
  const K=VEH_KINDS[v.kind], hw=K.w/2-1+pad, hh=K.h/2-1+pad, [fx,fy]=vdir(a), rx=-fy, ry=fx, pts=[];
  for(const [u,w] of [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1],[-1,-.5],[1,-.5],[-1,.5],[1,.5]]) pts.push([x+fx*hh*-w+rx*hw*u, y+fy*hh*-w+ry*hw*u]);
  return pts;
}
function vehBlockedAt(v,x,y,a){
  const K=VEH_KINDS[v.kind];
  for(const [px,py] of vehCorners(v,x,y,a)){
    const tx=Math.floor(px/T), ty=Math.floor(py/T); if(!inB(tx,ty)) return true;
    const i=idx(tx,ty), t=map[i];
    if(K.water){ if(t!==TL.WATER && t!==TL.SEA) return true; const o=objGrid[i]; if(o&&o.solid) return true; continue; }
    if(t===TL.WALL||t===TL.WINDOW||t===TL.FENCE||t===TL.WATER||t===TL.SEA) return true;
    const d=doors.get(i); if(d&&!d.open) return true;
    const o=objGrid[i]; if(o&&o.solid&&o.type!=='body') return true;
  }
  for(const o of vehicles){ if(o===v||o===v.hitch||o===v.towedBy) continue; if(Math.hypot(o.x-x,o.y-y) < (VEH_KINDS[o.kind].h+K.h)/2-6){
      // rough check: any of our corners inside the other's box
      const [fx,fy]=vdir(o.ang), rx=-fy, ry=fx, OK=VEH_KINDS[o.kind];
      for(const [px,py] of vehCorners(v,x,y,a)){ const dx=px-o.x, dy=py-o.y, along=dx*fx+dy*fy, side=dx*rx+dy*ry; if(Math.abs(along)<OK.h/2 && Math.abs(side)<OK.w/2) return true; } } }
  return false;
}
function vehNear(maxD=26){
  let best=null, bd=1e9;
  for(const v of vehicles){ const K=VEH_KINDS[v.kind], d=Math.hypot(v.x-player.x,v.y-(player.y-6)) - Math.min(K.w,K.h)/2; if(d<maxD && d<bd){ bd=d; best=v; } }
  return best;
}
function hitchPoint(v){ const K=VEH_KINDS[v.kind], [fx,fy]=vdir(v.ang); return [v.x-fx*(K.h/2+2), v.y-fy*(K.h/2+2)]; }
function enterVehicle(v){
  const K=VEH_KINDS[v.kind];
  if(K.trailer){ toast('A trailer needs to be towed by a pickup.'); return; }
  if(v.hp<=0){ toast('The engine is wrecked.'); return; }
  driving=v; player.inVeh=v; search=null; aiming=false; leftHeld=false;
  toast(`${K.name}: W/S throttle · A/D steer · E to get out · fuel ${Math.round(v.fuel)}%`);
}
function exitVehicle(){
  const v=driving; if(!v) return;
  if(Math.abs(v.sp)>25){ toast('Slow down first.'); return; }
  const K=VEH_KINDS[v.kind], [fx,fy]=vdir(v.ang), rx=-fy, ry=fx;
  const tries=[]; for(const side of [-1,1]) for(const al of [0,-.3,.3,-.5,.5]) tries.push([v.x+rx*side*(K.w/2+7)+fx*K.h*al, v.y+ry*side*(K.w/2+7)+fy*K.h*al+6]);
  tries.push([v.x+fx*(K.h/2+8), v.y+fy*(K.h/2+8)+6],[v.x-fx*(K.h/2+8), v.y-fy*(K.h/2+8)+6]);
  for(const [x,y] of tries){ if(boxFree(x,y) && !isWaterAt(x,y-3)){ player.x=x; player.y=y; driving=null; player.inVeh=null; v.sp=0; return; } }
  toast(K.water ? 'No shore or pier to step onto here.' : 'No room to get out.');
}
function isWaterAt(x,y){ const tx=Math.floor(x/T), ty=Math.floor(y/T); if(!inB(tx,ty)) return true; const t=map[idx(tx,ty)]; return t===TL.WATER||t===TL.SEA; }
function updateVehicle(v,dt,input){
  const K=VEH_KINDS[v.kind];
  let thr=input?input.y:0, st=input?input.x:0;
  if(v.fuel<=0 || v.hp<=0) thr=Math.min(0,thr)*0;
  const brake = thr && Math.sign(thr)!==Math.sign(v.sp) && Math.abs(v.sp)>4;
  if(thr>0) v.sp += (brake?K.acc*2.2:K.acc)*dt;
  else if(thr<0) v.sp -= (brake?K.acc*2.2:K.acc*.7)*dt;
  else v.sp -= Math.sign(v.sp)*Math.min(Math.abs(v.sp), (K.water?28:48)*dt);
  const maxR = K.max*0.35; v.sp=Math.max(-maxR,Math.min(K.max*(v.hitch?0.75:1),v.sp));
  // off-road is slower and bumpier
  const tt=map[idx(Math.floor(v.x/T),Math.floor(v.y/T))];
  if(K.land && (tt===TL.FOREST||tt===TL.SAND||tt===TL.FIELD) && Math.abs(v.sp)>K.max*.45) v.sp*=1-1.6*dt;
  v.steer += (st-v.steer)*Math.min(1,dt*8);
  const turn = v.steer*K.turn*Math.min(1,Math.abs(v.sp)/45)*Math.sign(v.sp||1)*dt;
  const na=v.ang+turn, [fx,fy]=vdir(na), nx=v.x+fx*v.sp*dt, ny=v.y+fy*v.sp*dt;
  if(!vehBlockedAt(v,nx,ny,na) && !(v.hitch && !trailerFollow(v,true,nx,ny,na))){ v.x=nx; v.y=ny; v.ang=na; if(v.hitch) trailerFollow(v,false); }
  else if(!vehBlockedAt(v,v.x,v.y,na)){ v.ang=na; v.sp*=.5; }
  else { if(Math.abs(v.sp)>60){ const dmg=Math.abs(v.sp)*.12; v.hp=Math.max(0,v.hp-dmg); shake=Math.max(shake,5); if(driving===v){ hurtPlayer(dmg*.25,{x:v.x+fx*40,y:v.y+fy*40},'torso',true); toast(v.hp<=0?'The engine dies with a bang.':'Crash!'); } }
    v.sp=-v.sp*.25; }
  const dist=Math.abs(v.sp*dt); v.fuel=Math.max(0,v.fuel-dist*K.fuelUse*(v.hitch?1.5:1));
  if(v.fuel<=0 && dist>0 && driving===v && !v.outWarned){ v.outWarned=true; toast('Out of fuel. Find a gas can — siphon one from a wreck.'); }
  if(v.fuel>0) v.outWarned=false;
  // run people and animals over
  if(Math.abs(v.sp)>45){
    for(const r of [...raiders]) if(Math.hypot(r.x-v.x,r.y-6-v.y)<K.h/2){ damageRaider(r,Math.abs(v.sp)*.45,v.ang-Math.PI/2,14); }
    if(typeof animals!=='undefined') for(const a of [...animals]) if(Math.hypot(a.x-v.x,a.y-v.y)<K.h/2) damageAnimal(a,Math.abs(v.sp)*.45,v.ang-Math.PI/2);
  }
  // engines are loud
  v.noiseT+=dt; if(v.noiseT>2.5 && driving===v){ v.noiseT=0; alertRaiders(v.x,v.y,(K.small?12:16)*T); }
}
function trailerFollow(v,test,nx=v.x,ny=v.y,na=v.ang){
  const tr=v.hitch, TK=VEH_KINDS[tr.kind], VK=VEH_KINDS[v.kind];
  const [fx,fy]=vdir(na), hx=nx-fx*(VK.h/2+2), hy=ny-fy*(VK.h/2+2);
  let dx=hx-tr.x, dy=hy-tr.y; const L=Math.hypot(dx,dy)||1; dx/=L; dy/=L;
  const ta=Math.atan2(dx,-dy), cx=hx-dx*(TK.h/2), cy=hy-dy*(TK.h/2);
  if(Math.abs(angDiff(ta,na))>1.4) return false; // jack-knife
  if(test) return !vehBlockedAt(tr,cx,cy,ta);
  tr.x=cx; tr.y=cy; tr.ang=ta; return true;
}
function drawVehicle(g,v,sx,sy){
  const K=VEH_KINDS[v.kind], spr=vehSprite(v.kind,v.col,false);
  g.save(); g.translate(Math.round(sx),Math.round(sy));
  g.fillStyle='rgba(0,0,0,.28)'; g.rotate(v.ang); g.fillRect(-K.w/2+2,-K.h/2+3,K.w,K.h);
  if(K.water){ const t=performance.now()/300; g.fillStyle='rgba(200,220,230,.25)'; if(Math.abs(v.sp)>10){ g.fillRect(-K.w/2-1,K.h/2-2,K.w+2,3+Math.abs(v.sp)/20); g.fillRect(-K.w/2-2+Math.sin(t)*1,-K.h/2+6,1,K.h-8); g.fillRect(K.w/2+1,-K.h/2+6,1,K.h-8);} }
  g.drawImage(spr,-K.w/2,-K.h/2);
  if(driving===v && !K.small){ g.fillStyle=player.look.hair||'#222'; g.fillRect(-4, K.trailer?0:(v.kind==='boat'?K.h/2-12:-K.h/2+19), 4, 4); }
  if(driving===v && K.small){ g.fillStyle=player.look.jacket||'#444'; g.fillRect(-3,4,6,7); g.fillStyle=player.look.hair||'#222'; g.fillRect(-2,5,4,4); }
  g.restore();
  if(v.hp<40 && v.hp>0 && Math.floor(performance.now()/150)%3===0){ g.fillStyle='rgba(90,90,90,.45)'; g.fillRect(Math.round(sx+vdir(v.ang)[0]*K.h/3), Math.round(sy+vdir(v.ang)[1]*K.h/3)-4, 3,3); }
}
// action menu for a vehicle you are standing next to
function vehicleActions(v){
  const K=VEH_KINDS[v.kind], acts=[];
  if(!K.trailer) acts.push(['Drive', ()=>enterVehicle(v)]);
  acts.push([`Open ${K.water?'storage':K.trailer?'camper':'trunk'}`, ()=>openInventory(v)]);
  if(!K.trailer && hasItem('gascan')) acts.push([`Refuel (${Math.round(v.fuel)}%)`, ()=>{ if(v.fuel>=99){ toast('Tank is full.'); return; } takeItem('gascan',1); addItem('gascan_e',1); v.fuel=Math.min(100,v.fuel+40); toast(`Refuelled — ${Math.round(v.fuel)}%.`); }]);
  if(!K.trailer && hasItem('scrap') && v.hp<100) acts.push([`Repair (${Math.round(v.hp)}%)`, ()=>{ takeItem('scrap',2); v.hp=Math.min(100,v.hp+25); toast(`Patched up — ${Math.round(v.hp)}%.`); }]);
  if(K.trailer){
    if(v.towedBy) acts.push(['Unhitch', ()=>{ v.towedBy.hitch=null; v.towedBy=null; toast('Trailer unhitched.'); }]);
    else { const pk=vehicles.find(o=>VEH_KINDS[o.kind].tow && !o.hitch && (()=>{ const [hx,hy]=hitchPoint(o), [fx,fy]=vdir(v.ang); return Math.hypot(hx-(v.x+fx*K.h/2), hy-(v.y+fy*K.h/2))<20; })());
      acts.push(['Hitch to pickup', ()=>{ if(!pk){ toast('Back a pickup up to the tow hitch first.'); return; } pk.hitch=v; v.towedBy=pk; trailerFollow(pk,false); toast('Trailer hitched. Drive carefully.'); }]); }
    acts.push(['Sleep inside', ()=>sleep()]);
  }
  acts.push([`Fuel ${K.trailer?'—':Math.round(v.fuel)+'%'} · condition ${Math.round(v.hp)}%`, null]);
  return acts;
}
// ------------------------------------------------------------------
// placing working vehicles in the world (deterministic)
// ------------------------------------------------------------------
function placeVehicles(WD){
  vehicles=[]; driving=null;
  const rr=mulberry32(4242);
  // some of the parked cars are old enough to still run
  for(const c of WD.cars){ if(rr()>.13) continue;
    const kind = rr()<.45 ? 'pickup' : rr()<.5 ? 'moto' : rr()<.7 ? 'sedan' : 'van';
    const wr=objGrid[idx(c.x,c.y)]; if(wr&&wr.type==='car') removeObjRaw(wr);
    const K=VEH_KINDS[kind], x=c.x*T+(c.v?16:24), y=c.y*T+(c.v?24:16), ang = c.v ? (rr()<.5?0:Math.PI) : (rr()<.5?Math.PI/2:-Math.PI/2);
    const v=vehAt(kind,x,y,ang); if(vehBlockedAt(v,x,y,ang)) vehicles.pop(); else c.taken=true; }
  // camper trailers near farm houses and on the edges of towns
  let campers=0;
  for(const b of buildings){ if(!b || campers>=14) continue; if(!(b.barn || (b.t==='house_s' && rr()<.05))) continue;
    for(let k=0;k<20;k++){ const x=(b.x-6+Math.floor(rr()*(b.w+12)))*T, y=(b.y+b.h+3+Math.floor(rr()*4))*T; const v=vehAt('camper',x,y,rr()*6.28);
      if(vehBlockedAt(v,x,y,v.ang)) vehicles.pop(); else { campers++; break; } } }
  // boats: harbour boats, plus one at the river bank near every settlement
  for(const bt of WD.boats||[]){ let ok=false; for(const dy of [24,8,40,-8,56]) for(const dx of [8,-8,24,-24,40]){ if(ok) break; const x=bt.x*T+dx, y=bt.y*T+dy; const v=vehAt('boat',x,y,Math.PI*(rr()<.5?0:1)); if(vehBlockedAt(v,x,y,v.ang)) vehicles.pop(); else ok=true; } }
  // boats moored along the harbour piers
  let moored=0;
  for(let y=1;y<H-1 && moored<8;y++) for(let x=1;x<W-1 && moored<8;x++){ if(map[idx(x,y)]!==TL.PIER) continue;
    if(map[idx(x+1,y)]!==TL.SEA || (y%7)) continue; const px=(x+2)*T+4, py=y*T+8; const v=vehAt('boat',px,py,0); if(vehBlockedAt(v,px,py,0)) vehicles.pop(); else moored++; }
  for(const r of regions){ const cx=Math.floor(r.x+r.w/2), cy=Math.floor(r.y+r.h/2); let best=null, bd=1e9;
    for(let y=cy-120;y<=cy+120;y+=3) for(let x=cx-120;x<=cx+120;x+=3){ if(!inB(x,y)||map[idx(x,y)]!==TL.WATER) continue; const d=Math.hypot(x-cx,y-cy); if(d<bd){ bd=d; best=[x,y]; } }
    if(!best) continue;
    for(let k=0;k<30;k++){ const x=(best[0]+Math.floor(rr()*9)-4)*T+8, y=(best[1]+Math.floor(rr()*9)-4)*T+8, v=vehAt('boat',x,y,rr()*6.28);
      if(vehBlockedAt(v,x,y,v.ang)) vehicles.pop(); else break; } }
}

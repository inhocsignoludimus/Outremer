// =====================================================================
// CÂMERA EM PRIMEIRA PESSOA (estilo Daggerfall / King's Field)
// Mundo 3D simples em baixa resolução (pixels grandes), personagens e objetos como os sprites 2D
// do jogo sempre virados para a câmera. Usa three.js (js/three.min.js) e as texturas de iso_core.
// Controles: WASD anda em relação à visão · mouse arrastado (ou travado com clique) olha ·
// clique ataca · botão direito lança a magia · E usa/fala · setas ←→ giram · no celular:
// lado esquerdo anda, lado direito arrasta para olhar.
// =====================================================================
(function(){
if(typeof THREE==='undefined'||typeof ISOC==='undefined') return;
const C=ISOC, CK=16, WH=2.6, EYE=1.42;
const MOBILE=(window.matchMedia&&matchMedia('(pointer:coarse)').matches)||Math.min(innerWidth,innerHeight)<500;
const RAD=MOBILE?2:3;                  // pedaços (16x16) carregados em volta do jogador
const FOGFAR=MOBILE?26:38;
window.fpOn=()=>typeof camModeGet==='function'&&camModeGet()==='fp'&&typeof player!=='undefined'&&!!player&&!driving;
let yaw=0, pitch=0; window.fpYaw=()=>yaw; window.fpSetYaw=a=>{ yaw=a; pitch=-.12; };
// ---------- three.js ----------
const fpcv=document.createElement('canvas'); fpcv.id='fpcv'; fpcv.style.cssText='position:fixed;left:0;top:0;width:100vw;height:100vh;image-rendering:pixelated;display:none;z-index:0';
canvas.parentNode.insertBefore(fpcv,canvas); canvas.style.position=canvas.style.position||'fixed';
let R3=null, scene, cam, sun, amb, ground=null;
function init3(){ if(R3) return true;
  try{ R3=new THREE.WebGLRenderer({canvas:fpcv,antialias:false,powerPreference:'high-performance'}); }catch(e){ R3=null; toast('Este aparelho não tem 3D (WebGL). Usando a câmera isométrica.'); setCam('iso'); return false; }
  R3.setPixelRatio(1); scene=new THREE.Scene(); window.__fpScene=scene; scene.fog=new THREE.Fog(0x8aa6c0,8,FOGFAR);
  cam=new THREE.PerspectiveCamera(64,16/9,.05,120); amb=new THREE.AmbientLight(0xffffff,.55); scene.add(amb);
  sun=new THREE.DirectionalLight(0xfff0d8,.8); sun.position.set(-3,6,-2); scene.add(sun);
  makeSky(); return true; }
// ---------- céu: cúpula em degradê, sol, lua, estrelas e nuvens (pixel art) ----------
let sky=null;
function pixTex(sz,fn){ const c=document.createElement('canvas'); c.width=c.height=sz; fn(c.getContext('2d'),sz); const t=new THREE.CanvasTexture(c); t.magFilter=t.minFilter=THREE.NearestFilter; t.generateMipmaps=false; return t; }
function makeSky(){ const G=new THREE.Group(); G.renderOrder=-10;
  const geo=new THREE.SphereGeometry(100,16,12); const cols=new Float32Array(geo.attributes.position.count*3); geo.setAttribute('color',new THREE.BufferAttribute(cols,3));
  const dome=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide,fog:false,depthWrite:false})); G.add(dome);
  const sunT=pixTex(32,(g,n)=>{ for(let y=0;y<n;y++) for(let x=0;x<n;x++){ const d=Math.hypot(x-15.5,y-15.5); if(d<7){ g.fillStyle=d<5?'#fffbe8':'#ffe9a8'; g.fillRect(x,y,1,1); } else if(d<15){ g.fillStyle=`rgba(255,230,160,${(1-(d-7)/8)*.35})`; g.fillRect(x,y,1,1); } } });
  const sunS=new THREE.Sprite(new THREE.SpriteMaterial({map:sunT,fog:false,depthWrite:false,transparent:true})); sunS.scale.set(16,16,1); G.add(sunS);
  const moonT=pixTex(32,(g,n)=>{ g.clearRect(0,0,n,n); for(let y=0;y<n;y++) for(let x=0;x<n;x++){ const d=Math.hypot(x-15.5,y-15.5); if(d<8){ const cr=((x*7+y*13)%11)<2; g.fillStyle=cr?'#b8bcc8':'#e8ecf4'; g.fillRect(x,y,1,1); } else if(d<14){ g.fillStyle=`rgba(200,215,255,${(1-(d-8)/6)*.22})`; g.fillRect(x,y,1,1); } } });
  const moonS=new THREE.Sprite(new THREE.SpriteMaterial({map:moonT,fog:false,depthWrite:false,transparent:true})); moonS.scale.set(11,11,1); G.add(moonS);
  const sp=[]; for(let i=0;i<500;i++){ const u=Math.random()*Math.PI*2, v=Math.random()*.95+.04, r=95; sp.push(Math.cos(u)*Math.cos(v*Math.PI/2)*r, Math.sin(v*Math.PI/2)*r, Math.sin(u)*Math.cos(v*Math.PI/2)*r); }
  const sg=new THREE.BufferGeometry(); sg.setAttribute('position',new THREE.Float32BufferAttribute(sp,3));
  const stars=new THREE.Points(sg,new THREE.PointsMaterial({color:0xffffff,size:1.6,sizeAttenuation:false,fog:false,transparent:true,depthWrite:false})); G.add(stars);
  const ct=new THREE.CanvasTexture(window.WX_CLOUDS||document.createElement('canvas')); ct.wrapS=ct.wrapT=THREE.RepeatWrapping; ct.magFilter=THREE.NearestFilter; ct.minFilter=THREE.NearestFilter; ct.repeat.set(3,3);
  const cl=new THREE.Mesh(new THREE.PlaneGeometry(360,360),new THREE.MeshBasicMaterial({map:ct,transparent:true,fog:false,depthWrite:false,side:THREE.DoubleSide})); cl.rotation.x=Math.PI/2; cl.position.y=14; G.add(cl);
  const cl2=cl.clone(); cl2.material=cl.material.clone(); cl2.material.map=ct.clone(); cl2.material.map.needsUpdate=true; cl2.material.map.repeat.set(5,5); cl2.position.y=11; G.add(cl2);
  for(const o of G.children) o.renderOrder=-10;
  scene.add(G); sky={G,dome,geo,sunS,moonS,stars,cl,cl2}; }
function updSky(now,top,hor,dk,inDG){ if(!sky) return; sky.G.visible=!inDG; if(inDG) return; sky.G.position.copy(cam.position);
  const p=sky.geo.attributes.position, c=sky.geo.attributes.color; for(let i=0;i<p.count;i++){ const t=Math.max(0,Math.min(1,p.getY(i)/100)), k=Math.pow(t,.6); c.setXYZ(i,hor.r+(top.r-hor.r)*k,hor.g+(top.g-hor.g)*k,hor.b+(top.b-hor.b)*k); } c.needsUpdate=true;
  const W_=window.WX||{cover:0}, a=(time-6)/12*Math.PI;                 // nasce no leste às 6h, se põe no oeste às 18h
  const sd=new THREE.Vector3(Math.cos(a),Math.sin(a),.35).normalize(); sky.sunS.position.copy(sd).multiplyScalar(90); sky.sunS.material.opacity=Math.max(0,Math.min(1,sd.y*4+.3))*(1-W_.cover*.85); sky.sunS.visible=sd.y>-.1;
  const md=sd.clone().negate(); md.z=-.3; md.normalize(); sky.moonS.position.copy(md).multiplyScalar(90); sky.moonS.visible=md.y>-.1; sky.moonS.material.opacity=Math.min(1,dk*1.4)*(1-W_.cover*.8);
  sky.stars.material.opacity=Math.max(0,dk-.3)*1.5*(1-W_.cover); sky.stars.visible=sky.stars.material.opacity>.02; sky.stars.rotation.y=now/400000;
  // nuvens: quantidade pela cobertura, cor pela luz do dia, andam com o vento
  const lit=new THREE.Color().copy(hor).lerp(new THREE.Color(1,1,1),.55*(1-dk)), dark=new THREE.Color(.35,.37,.42).multiplyScalar(1-dk*.7);
  const cc=lit.clone().lerp(dark,Math.max(0,W_.cover-.4)*1.4);
  sky.cl.material.color.copy(cc); sky.cl.material.opacity=Math.min(1,.25+W_.cover*1.1); sky.cl2.material.color.copy(cc.clone().multiplyScalar(.85)); sky.cl2.material.opacity=Math.max(0,W_.cover-.45)*1.6;
  const w=(W_.wind||.3); sky.cl.material.map.offset.set(now/1000*.004*w*3,now/1000*.0015); sky.cl2.material.map.offset.set(now/1000*.007*w*3,now/1000*.002);
  sun.position.copy(sd).multiplyScalar(10); }
function canvasTex(cv,rep){ const t=new THREE.CanvasTexture(cv); t.magFilter=THREE.NearestFilter; t.minFilter=THREE.NearestFilter; t.generateMipmaps=false; if(rep){ t.wrapS=t.wrapT=THREE.RepeatWrapping; } return t; }
const biomeAt=(x,y)=>{ const r=regions[regionId[y*W+x]]; if(typeof DG!=='undefined'&&DG&&(inRect(DG.L1,x,y)||inRect(DG.L2,x,y))) return 'dg'; if(r&&(r.kind==='city'||r.kind==='town')) return 'city'; return (r&&r.biome)||'p'; };
// ---------- texturas e materiais compartilhados ----------
const MATC={}, tint=[];  // materiais "básicos" que recebem a cor da luz do dia
function wallMat(mi,win){ const k='w'+mi+(win?'w':''); if(MATC[k]) return MATC[k]; const M=MATS[mi]||MATS[6], S=32, cv=document.createElement('canvas'); cv.width=S; cv.height=S*2;
  const g=cv.getContext('2d'), im=g.createImageData(S,S*2);
  for(let y=0;y<S*2;y++) for(let x=0;x<S;x++){ const c=C.wallPix(M,x/S,(S*2-y)*.9,1,win,S*2*.9), q=(y*S+x)*4; im.data[q]=c[0]; im.data[q+1]=c[1]; im.data[q+2]=c[2]; im.data[q+3]=255; }
  g.putImageData(im,0,0); return MATC[k]=new THREE.MeshLambertMaterial({map:canvasTex(cv)}); }
function roofMat(){ if(MATC.roof) return MATC.roof; const cv=document.createElement('canvas'); cv.width=32; cv.height=32; const g=cv.getContext('2d');
  for(let y=0;y<32;y++) for(let x=0;x<32;x++){ const row=y>>2, off=(row%2)*4, edge=(y%4===0)||((x+off)%8===0), n=C.hsh(x,y,3); const c=edge?[60,32,24]:[132-row*2+n*20,62+n*10,44];
    g.fillStyle=`rgb(${c[0]|0},${c[1]|0},${c[2]|0})`; g.fillRect(x,y,1,1); }
  return MATC.roof=new THREE.MeshLambertMaterial({map:canvasTex(cv,true),side:THREE.DoubleSide}); }
function rockMat(bio){ const k='r'+bio; if(MATC[k]) return MATC[k]; const cv=document.createElement('canvas'); cv.width=32; cv.height=32; const g=cv.getContext('2d');
  for(let y=0;y<32;y++) for(let x=0;x<32;x++){ const v=C.vnoise(x*.2,y*.2,5)*.6+C.vnoise(x*.6,y*.6,6)*.4; let c=bio==='n'?[150,154,162]:bio==='dg'?[70,62,56]:bio==='o'?[176,138,96]:[118,108,96]; c=c.map(q=>q*(.6+v*.6));
    if(bio==='n'&&C.vnoise(x*.3,y*.15,9)>.62) c=[226,232,238]; g.fillStyle=`rgb(${c[0]|0},${c[1]|0},${c[2]|0})`; g.fillRect(x,y,1,1); }
  return MATC[k]=new THREE.MeshLambertMaterial({map:canvasTex(cv,true),flatShading:true}); }
// atlas de árvores (variantes desenhadas por iso_core)
const TREEV=[['tree','p',3],['tree','p',100],['tree','p',200],['tree','p',300],['tree','p',410],['pine','n',5],['pine','m',77],['olive','o',9]];
let treeMat=null;
function getTreeMat(){ if(treeMat) return treeMat; const cv=document.createElement('canvas'); cv.width=150*TREEV.length; cv.height=190; const g=cv.getContext('2d');
  TREEV.forEach(([t,b,s],k)=>{ const c=document.createElement('canvas'); c.width=150; c.height=190; C.drawTree(c.getContext('2d'),75,184,s,t==='pine'?b:b); g.drawImage(c,k*150,0); });
  treeMat=new THREE.MeshBasicMaterial({map:canvasTex(cv),alphaTest:.5,side:THREE.DoubleSide}); tint.push(treeMat); return treeMat; }
function treeVariant(o){ const b=biomeAt(o.x,o.y), h=(o.x*7+o.y*13)>>>0;
  if(o.type==='pine') return b==='n'?5:6; if(o.type==='olive'||b==='o') return 7; if(b==='n'||b==='m') return h%3?5:6; return h%5; }
// sprites de objetos (furniture etc.) com textura em cache por tipo
const objTex={};
function objMat(o){ const w=o.w||1, h=o.h||1, k=o.type+'|'+(o.kind||'')+'|'+w+'x'+h; if(objTex[k]) return objTex[k];
  const cv=document.createElement('canvas'), sc=3, cw=w*16+8, chh=h*16+30; cv.width=cw*sc; cv.height=chh*sc; const g=cv.getContext('2d'); g.imageSmoothingEnabled=false; g.scale(sc,sc); g.translate(4,22);
  try{ drawObj(g,o,0,0,0); }catch(e){}
  const m=new THREE.SpriteMaterial({map:canvasTex(cv),alphaTest:.5}); tint.push(m); return objTex[k]={m,asp:cw/chh,hgt:chh/16*.9}; }
// ---------- objetos em 3D de verdade (js/props3d.js: modelos do pacote PolygonSight) ----------
const PROPKEY={counter:'counterA',display:'counterA',chest:'chest',keg:'keg',barrel:'keg',table:'table',workbench:'longtable',bed:'bed',hbed:'bed',chair:'chair',candle:'chandelier',lamp:'farol',
  crate:'crate',storage:'crate',cauldron:'cauldron',anvil:'anvil',logs:'logs',campfire:'fire',tent:'tent',bedroll:'sleep',rack:'wstore',wrack:'wstore',tub:'water',bench:'longtable',pew:'longtable'};
const U3=1/45, propGeo={}; let propMat=null;
function b64(s,T){ const b=atob(s), a=new Uint8Array(b.length); for(let i=0;i<b.length;i++) a[i]=b.charCodeAt(i); return new T(a.buffer); }
function getPropGeo(k){ if(propGeo[k]!==undefined) return propGeo[k]; const D=window.PROPS3D&&PROPS3D[k]; if(!D) return propGeo[k]=null;
  const P=b64(D.p,Int16Array), N=b64(D.n,Int8Array), Uq=b64(D.u,Uint16Array), pos=new Float32Array(P.length), nor=new Float32Array(N.length), uv=new Float32Array(Uq.length);
  for(let i=0;i<P.length;i++) pos[i]=P[i]*D.q; for(let i=0;i<N.length;i++) nor[i]=N[i]/127; for(let i=0;i<Uq.length;i++) uv[i]=Uq[i]/65535*2-.5;
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3)); g.setAttribute('normal',new THREE.BufferAttribute(nor,3)); g.setAttribute('uv',new THREE.BufferAttribute(uv,2));
  g.userData.sz=D.sz; return propGeo[k]=g; }
function getPropMat(){ if(propMat) return propMat; const t=new THREE.Texture(); t.magFilter=THREE.NearestFilter; t.minFilter=THREE.LinearMipmapLinearFilter; t.wrapS=t.wrapT=THREE.RepeatWrapping;
  return propMat=new THREE.MeshLambertMaterial({map:t}); }
const sameAt=(x,y,t)=>{ if(x<0||y<0||x>=W||y>=H) return false; const q=objGrid[y*W+x]; return !!q&&q.type===t; };
const wallAt=(x,y)=>x>=0&&y>=0&&x<W&&y<H&&(isWallT(map[y*W+x])||doors.has(y*W+x));
function propSpec(o){ const k=PROPKEY[o.type]; if(!k) return null; const g=getPropGeo(k); if(!g) return null;
  const sz=g.userData.sz, w=o.w||1, h=o.h||1; let rot=0;
  // orientação: cama no comprimento; balcão alinhado com os vizinhos; móveis encostados viram as costas para a parede
  if(k==='bed'||k==='sleep'){ if(w>h) rot=Math.PI/2; }
  else if(k==='counterA'||k==='longtable'||k==='wstore'){ if(sameAt(o.x,o.y-1,o.type)||sameAt(o.x,o.y+1,o.type)) rot=Math.PI/2; else if(wallAt(o.x,o.y+1)) rot=Math.PI; else if(wallAt(o.x-1,o.y)&&!wallAt(o.x,o.y-1)) rot=Math.PI/2; else if(wallAt(o.x+1,o.y)&&!wallAt(o.x,o.y-1)) rot=-Math.PI/2; }
  else { if(wallAt(o.x,o.y-1)) rot=0; else if(wallAt(o.x,o.y+1)) rot=Math.PI; else if(wallAt(o.x-1,o.y)) rot=Math.PI/2; else if(wallAt(o.x+1,o.y)) rot=-Math.PI/2; else rot=(C.hsh(o.x,o.y,7)*4|0)*Math.PI/2; }
  const turned=Math.abs(Math.sin(rot))>.5, fx=turned?h:w, fz=turned?w:h, big=k==='chest'||k==='keg'?.85:1.1;
  let sx, sy, sz2;
  if(o.type==='bench'||o.type==='pew'){ sx=fx*.9/sz[0]; sz2=Math.min(fz,.42)/sz[2]; sy=.46/sz[1]; }      // banco: mesa comprida baixa e estreita
  else if(k==='counterA'){ sx=fx/sz[0]; sz2=Math.min(fz*.7,.75)/sz[2]; sy=U3*1.05; }                       // balcões encaixam lado a lado
  else { const s=Math.min(U3*big, fx*.92/sz[0], fz*.92/sz[2]); sx=sy=sz2=s; }
  return {k,g,rot,sx,sy,sz:sz2,w,h}; }
const _v=new THREE.Vector3(), _nm=new THREE.Matrix3();
function addProp(A,m){ m.updateMatrix(); _nm.getNormalMatrix(m.matrix); const g=m.geometry, P=g.attributes.position, N=g.attributes.normal, Uv=g.attributes.uv;
  for(let i=0;i<P.count;i++){ _v.fromBufferAttribute(P,i).applyMatrix4(m.matrix); A.p.push(_v.x,_v.y,_v.z); _v.fromBufferAttribute(N,i).applyMatrix3(_nm).normalize(); A.n.push(_v.x,_v.y,_v.z); A.u.push(Uv.getX(i),Uv.getY(i)); } }
function propMesh(o){ const P=propSpec(o); if(!P) return null; const m=new THREE.Mesh(P.g,getPropMat()); m.scale.set(P.sx,P.sy,P.sz); m.rotation.y=P.rot; m.position.set(o.x+P.w/2,0,o.y+P.h/2); return m; }
// ---------- os mesmos modelos viram sprites na câmera isométrica (renderizados uma vez, como o UO fazia) ----------
const ISOK=33.94, ISOY=(62/2.6)/29.39;   // px por quadrado na diagonal; achata a altura para bater com as paredes do jogo
let isoR=null, isoScene=null, isoCam=null, isoTexOk=false;
function isoInit(){ if(isoR) return true; try{ isoR=new THREE.WebGLRenderer({antialias:false,alpha:true,preserveDrawingBuffer:true}); }catch(e){ return false; }
  isoR.setPixelRatio(1); isoR.setClearColor(0,0); isoScene=new THREE.Scene(); isoScene.add(new THREE.AmbientLight(0xffffff,.62)); const d=new THREE.DirectionalLight(0xfff4e0,.75); d.position.set(.9,1.3,.2); isoScene.add(d);
  isoCam=new THREE.OrthographicCamera(-1,1,1,-1,-50,50); isoCam.position.set(1,.8165,1); isoCam.lookAt(0,0,0); isoCam.updateMatrixWorld(); return true; }
{ const im=new Image(); im.onload=()=>{ const m=getPropMat(); m.map.image=im; m.map.needsUpdate=true; isoTexOk=true; }; im.src=window.PROPS3D_TEX||''; }
const isoSprites={};
function isoSprite(P){ const key=P.k+'|'+P.rot.toFixed(2)+'|'+P.sx.toFixed(4)+'|'+P.sz.toFixed(4)+'|'+P.w+'x'+P.h; if(isoSprites[key]) return isoSprites[key];
  if(!isoTexOk||!isoInit()) return null;
  const n=P.w+P.h, cw=Math.ceil(n*24+48), ch=Math.ceil(n*12+110), ax=cw/2, ay=ch-n*6-14;
  isoR.setSize(cw,ch,false); const m=new THREE.Mesh(P.g,getPropMat()); m.scale.set(P.sx,P.sy*ISOY,P.sz); m.rotation.y=P.rot; isoScene.add(m);
  isoCam.left=-ax/ISOK; isoCam.right=(cw-ax)/ISOK; isoCam.top=ay/ISOK; isoCam.bottom=-(ch-ay)/ISOK; isoCam.updateProjectionMatrix(); isoR.render(isoScene,isoCam); isoScene.remove(m);
  const cv=document.createElement('canvas'); cv.width=cw; cv.height=ch; const g=cv.getContext('2d'); g.drawImage(isoR.domElement,0,0);
  // bordas duras (sem meio-transparente) e contorno escuro de 1px, para casar com a arte do jogo
  const id=g.getImageData(0,0,cw,ch), d=id.data, o2=new Uint8ClampedArray(d);
  for(let q=3;q<d.length;q+=4) o2[q]=d[q]>100?255:0;
  for(let y=1;y<ch-1;y++) for(let x=1;x<cw-1;x++){ const q=(y*cw+x)*4; if(o2[q+3]) continue; if(o2[q+7]||o2[q-1]||o2[q+cw*4+3]||o2[q-cw*4+3]){ d[q]=28; d[q+1]=20; d[q+2]=16; d[q+3]=200; } else d[q+3]=o2[q+3]; }
  for(let q=3;q<d.length;q+=4) if(o2[q]) d[q]=255;
  g.putImageData(id,0,0); return isoSprites[key]={cv,ax,ay}; }
const SPRITE3D=new Set(['bench','pew','counter','display','chest','keg','barrel','table','workbench','bed','hbed','chair','crate','storage','anvil','logs','tent','bedroll','rack','wrack','tub','lamp']);
if(typeof window.isoProp==='function'){ const _ip=window.isoProp, _ih=window.isoHasProp;
  window.isoHasProp=t=>(SPRITE3D.has(t)&&isoTexOk)||_ih(t);
  window.isoProp=function(g,toS,o,biome){ if(SPRITE3D.has(o.type)){ const P=propSpec(o), S=P&&isoSprite(P); if(S){ const [x,y]=toS(o.x+P.w/2,o.y+P.h/2); g.drawImage(S.cv,Math.round(x-S.ax),Math.round(y-S.ay)); return true; } }
    return _ip(g,toS,o,biome); }; }
// ---------- lareira/forja em 3D: corpo de pedra encostado na parede, chaminé, boca escura com fogo animado ----------
const fireCv=document.createElement('canvas'); fireCv.width=32; fireCv.height=32; const fireG=fireCv.getContext('2d'); let fireTex=null, fireMat=null;
function fireFrame(now){ if(!fireTex) return; const g=fireG, f=Math.floor(now/110); g.clearRect(0,0,32,32);
  for(let i=0;i<12;i++){ const r=Math.sin(i*127.1+f*311.7)*43758.5453, h=(r-Math.floor(r))*14+14, x=2+i*2.5; g.fillStyle=['#b8361f','#e0552a','#ffa340','#ffe08a'][i%4]; g.beginPath(); g.moveTo(x-4,32); g.lineTo(x,32-h); g.lineTo(x+4,32); g.fill(); }
  g.fillStyle='#4a2e18'; g.fillRect(3,29,26,3); fireTex.needsUpdate=true; }
function hearthSideW(o){ const w=o.w||1, h=o.h||1; let n=0,s=0,e=0,wv=0; for(let k=0;k<w;k++){ if(wallAt(o.x+k,o.y-1)) n++; if(wallAt(o.x+k,o.y+h)) s++; } for(let k=0;k<h;k++){ if(wallAt(o.x-1,o.y+k)) wv++; if(wallAt(o.x+w,o.y+k)) e++; }
  const m=Math.max(n,s,e,wv); return m===0||m===n?'n':m===wv?'w':m===s?'s':'e'; }
function addHearth(grp,o){ const forge=o.kind==='forge', w=o.w||1, h=o.h||1, side=hearthSideW(o), stone=wallMat(forge?10:6,false);
  if(!fireTex){ fireTex=canvasTex(fireCv); fireMat=new THREE.SpriteMaterial({map:fireTex,alphaTest:.4,fog:true}); }
  const hb=forge?1.05:1.15, dep=forge?.9*Math.min(w,h):.62, along=side==='n'||side==='s', L=(along?w:h)-.08;
  const dirs={n:[0,1],s:[0,-1],w:[1,0],e:[-1,0]}, [fx,fz]=dirs[side];          // frente aponta para dentro do cômodo
  const wallX=side==='w'?o.x:side==='e'?o.x+w:o.x+w/2, wallZ=side==='n'?o.y:side==='s'?o.y+h:o.y+h/2;
  const cx=side==='w'?o.x+dep/2:side==='e'?o.x+w-dep/2:o.x+w/2, cz=side==='n'?o.y+dep/2:side==='s'?o.y+h-dep/2:o.y+h/2;
  const bx=along?L:dep, bz=along?dep:L;
  const body=new THREE.Mesh(new THREE.BoxGeometry(bx,hb,bz),stone); body.position.set(cx,hb/2,cz); grp.add(body);
  const man=new THREE.Mesh(new THREE.BoxGeometry(bx+.1,.12,bz+.1),stone); man.position.set(cx,hb+.06,cz); grp.add(man);
  const chw=L*.55, chd=dep*.5, chx=side==='w'?o.x+chd/2:side==='e'?o.x+w-chd/2:cx, chz=side==='n'?o.y+chd/2:side==='s'?o.y+h-chd/2:cz;
  const ch=new THREE.Mesh(new THREE.BoxGeometry(along?chw:chd,WH-hb,along?chd:chw),stone); ch.position.set(chx,hb+(WH-hb)/2,chz); grp.add(ch);
  // boca da lareira na face da frente
  const ow=L*(forge?.62:.56), oh=hb*.62, fxp=cx+fx*(dep/2+.012), fzp=cz+fz*(dep/2+.012);
  const hole=new THREE.Mesh(new THREE.PlaneGeometry(ow,oh),MATC.hole||(MATC.hole=(()=>{ const c=document.createElement('canvas'); c.width=8; c.height=32; const g=c.getContext('2d'), gr=g.createLinearGradient(0,0,0,32); gr.addColorStop(0,'#0c0806'); gr.addColorStop(.55,'#2a120a'); gr.addColorStop(1,'#a04010'); g.fillStyle=gr; g.fillRect(0,0,8,32); return new THREE.MeshBasicMaterial({map:canvasTex(c),fog:true}); })()));
  hole.position.set(fxp,oh/2,fzp); hole.rotation.y=Math.atan2(fx,fz); grp.add(hole);
  const fs=new THREE.Sprite(fireMat); fs.center.set(.5,0); fs.scale.set(ow*.9,oh*.92,1); fs.position.set(fxp+fx*.03,.04,fzp+fz*.03); grp.add(fs);
  if(forge){ const coal=new THREE.Mesh(new THREE.PlaneGeometry(bx-.24,bz-.24),MATC.coal||(MATC.coal=new THREE.MeshBasicMaterial({color:0xb04018}))); coal.rotation.x=-Math.PI/2; coal.position.set(cx,hb+.125,cz); grp.add(coal); } }
// ---------- geometria juntada (poucas chamadas de desenho por pedaço) ----------
function Acc(){ return {p:[],n:[],u:[]}; }
function quad(A,a,b,c,d,nx,ny,nz,u0,v0,u1,v1){ // a,b,c,d em sentido anti-horário visto de fora
  A.p.push(...a,...b,...c, ...a,...c,...d); for(let k=0;k<6;k++) A.n.push(nx,ny,nz);
  A.u.push(u0,v0,u1,v0,u1,v1, u0,v0,u1,v1,u0,v1); }
function toMesh(A,mat){ if(!A.p.length) return null; const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(A.p,3)); g.setAttribute('normal',new THREE.Float32BufferAttribute(A.n,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(A.u,2)); return new THREE.Mesh(g,mat); }
const isWallT=t=>t===TL.WALL||t===TL.WINDOW;
// ---------- pedaços ----------
const chunks=new Map(); let queue=[], frameT0=0; const BUDGET=MOBILE?7:10, over=()=>performance.now()-frameT0>BUDGET;
const key=(cu,cv)=>cu*4096+cv;
function buildChunk(cu,cv){
  const grp=new THREE.Group(), X0=cu*CK, Y0=cv*CK, TS=MOBILE?8:16;
  // chão
  { const cvs=document.createElement('canvas'); cvs.width=CK*TS; cvs.height=CK*TS; const g=cvs.getContext('2d'), im=g.createImageData(CK*TS,CK*TS), d=im.data;
    for(let py=0;py<CK*TS;py++) for(let px=0;px<CK*TS;px++){ const U=X0+(px+.5)/TS, V=Y0+(py+.5)/TS, x=Math.floor(U), y=Math.floor(V); if(x<0||y<0||x>=W||y>=H) continue; const i=y*W+x; let t=map[i];
      if(isWallT(t)) t=C.underFloor(x,y); if(t===TL.ROCK) t=TL.DIRT;
      const c=C.floorCol(t,U,V,i,biomeAt(x,y)), q=(py*CK*TS+px)*4; d[q]=c[0]; d[q+1]=c[1]; d[q+2]=c[2]; d[q+3]=255; }
    g.putImageData(im,0,0);
    const geo=new THREE.PlaneGeometry(CK,CK); geo.rotateX(-Math.PI/2); const m=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({map:canvasTex(cvs)})); m.position.set(X0+CK/2,0,Y0+CK/2); grp.add(m); }
  // paredes (só as faces que aparecem), rochas, cercas
  const propAcc=Acc(), wallAcc={}, rockAcc=Acc(), fenceAcc=Acc(), treeAcc=Acc(); let rockBio=null;
  for(let y=Y0;y<Y0+CK;y++) for(let x=X0;x<X0+CK;x++){ if(x<1||y<1||x>=W-1||y>=H-1) continue; const i=y*W+x, t=map[i];
    if(isWallT(t)){ const k=mat[i]+'_'+(t===TL.WINDOW?1:0), A=wallAcc[k]||(wallAcc[k]=Acc()), x1=x+1, y1=y+1, h=WH;
      if(!isWallT(map[i+W])) quad(A,[x,0,y1],[x1,0,y1],[x1,h,y1],[x,h,y1],0,0,1,0,0,1,1);
      if(!isWallT(map[i-W])) quad(A,[x1,0,y],[x,0,y],[x,h,y],[x1,h,y],0,0,-1,0,0,1,1);
      if(!isWallT(map[i+1])) quad(A,[x1,0,y1],[x1,0,y],[x1,h,y],[x1,h,y1],1,0,0,0,0,1,1);
      if(!isWallT(map[i-1])) quad(A,[x,0,y],[x,0,y1],[x,h,y1],[x,h,y],-1,0,0,0,0,1,1);
      quad(A,[x,h,y1],[x1,h,y1],[x1,h,y],[x,h,y],0,1,0,0,0,1,.3); }
    else if(t===TL.ROCK){ rockBio=rockBio||biomeAt(x,y); const hh=1.4+C.hsh(x,y,1)*2.4+(map[i-1]===TL.ROCK&&map[i+1]===TL.ROCK&&map[i-W]===TL.ROCK&&map[i+W]===TL.ROCK?1.6:0);
      const geo=new THREE.DodecahedronGeometry(.9,0).toNonIndexed(), p=geo.attributes.position, nn=geo.attributes.normal, uv=geo.attributes.uv;
      for(let k=0;k<p.count;k++){ const j=.78+C.hsh(k,x*7+y,3)*.44; const vx=p.getX(k)*j, vy=p.getY(k)*j, vz=p.getZ(k)*j;
        rockAcc.p.push(x+.5+vx, Math.max(0,(vy+.5)*hh*.62), y+.5+vz); rockAcc.n.push(nn.getX(k),nn.getY(k),nn.getZ(k)); rockAcc.u.push(uv.getX(k)*2+x*.3,uv.getY(k)*2+y*.3); } }
    else if(t===TL.FENCE){ const A=fenceAcc; quad(A,[x,0,y+.5],[x+1,0,y+.5],[x+1,.8,y+.5],[x,.8,y+.5],0,0,1,0,0,1,1); quad(A,[x+1,0,y+.5],[x,0,y+.5],[x,.8,y+.5],[x+1,.8,y+.5],0,0,-1,0,0,1,1); }
    // árvores: duas placas cruzadas, todas num só desenho por pedaço
    const o=objGrid[i];
    if(o&&o.x===x&&o.y===y&&(o.type==='tree'||o.type==='pine'||o.type==='olive')){ const v=treeVariant(o), u0=v/TREEV.length, u1=(v+1)/TREEV.length, hh=4.4+C.hsh(x,y,2)*1.6, ww=hh*150/190, cx=x+.5, cz=y+.5, b=-.12;
      quad(treeAcc,[cx-ww/2,b,cz],[cx+ww/2,b,cz],[cx+ww/2,b+hh,cz],[cx-ww/2,b+hh,cz],0,0,1,u0,0,u1,1);
      quad(treeAcc,[cx,b,cz-ww/2],[cx,b,cz+ww/2],[cx,b+hh,cz+ww/2],[cx,b+hh,cz-ww/2],1,0,0,u0,0,u1,1); }
    else if(o&&o.x===x&&o.y===y&&o.type!=='rug'){ if(o.type==='hearth'){ addHearth(grp,o); (grp.userData.lights=grp.userData.lights||[]).push([o.x+(o.w||1)/2,o.y+(o.h||1)/2]); } else { const pm=propMesh(o); if(pm) addProp(propAcc,pm); else { const om=objMat(o), s=new THREE.Sprite(om.m); s.center.set(.5,0); s.scale.set(om.hgt*om.asp,om.hgt,1); s.position.set(o.x+(o.w||1)/2,0,o.y+(o.h||1)/2); grp.add(s); } }
      if(o.light) grp.userData.lights=(grp.userData.lights||[]).concat([[o.x+.5,o.y+.5]]); }
    if(doors.has(i)){ const alongX=isWallT(map[i-1])||isWallT(map[i+1]); const m=new THREE.Mesh(new THREE.BoxGeometry(alongX?1:.12,WH*.85,alongX?.12:1),MATC.door||(MATC.door=new THREE.MeshLambertMaterial({color:0x6a4628})));
      m.position.set(x+.5,WH*.425,y+.5); m.userData.door=i; grp.add(m); (grp.userData.doors=grp.userData.doors||[]).push(m); }
  }
  for(const k in wallAcc){ const [mi,w]=k.split('_'); const m=toMesh(wallAcc[k],wallMat(+mi,w==='1')); if(m) grp.add(m); }
  const rm=toMesh(rockAcc,rockMat(rockBio||'p')); if(rm) grp.add(rm);
  const fm=toMesh(fenceAcc,MATC.fence||(MATC.fence=new THREE.MeshLambertMaterial({color:0x5a3e24}))); if(fm) grp.add(fm);
  const tm=toMesh(treeAcc,getTreeMat()); if(tm) grp.add(tm);
  const pmm=toMesh(propAcc,getPropMat()); if(pmm) grp.add(pmm);
  // telhados de duas águas das construções que começam neste pedaço
  for(const b of buildings){ if(!b||b.x<X0||b.x>=X0+CK||b.y<Y0||b.y>=Y0+CK) continue;
    const alongX=b.w>=b.h, L=alongX?b.w:b.h, S=alongX?b.h:b.w, rh=Math.min(2.4,S*.45), sh=new THREE.Shape(); sh.moveTo(-S/2-.3,0); sh.lineTo(S/2+.3,0); sh.lineTo(0,rh); sh.lineTo(-S/2-.3,0);
    const geo=new THREE.ExtrudeGeometry(sh,{depth:L+.6,bevelEnabled:false}), uv=geo.attributes.uv; for(let k=0;k<uv.count;k++) uv.setXY(k,uv.getX(k)*.6,uv.getY(k)*.6);
    const m=new THREE.Mesh(geo,roofMat()); if(alongX){ m.rotation.y=Math.PI/2; m.position.set(b.x-.3,WH,b.y+b.h/2); } else m.position.set(b.x+b.w/2,WH,b.y-.3); grp.add(m); }
  return grp; }
function dropChunk(k){ const c=chunks.get(k); if(!c) return; scene.remove(c); c.traverse(o=>{ if(o.geometry&&!o.geometry.userData.sz) o.geometry.dispose(); if(o.material===propMat) return; if(o.isMesh&&o.material&&o.material.map&&!Object.values(MATC).includes(o.material)&&o.material!==treeMat){ o.material.map.dispose(); o.material.dispose(); } }); chunks.delete(k); }
function streamChunks(){ const pu=Math.floor(player.x/T/CK), pv=Math.floor(player.y/T/CK), want=[];
  for(let dv=-RAD;dv<=RAD;dv++) for(let du=-RAD;du<=RAD;du++){ const cu=pu+du, cv=pv+dv; if(cu<0||cv<0||cu*CK>=W||cv*CK>=H) continue; want.push([cu,cv,Math.hypot(du,dv)]); }
  want.sort((a,b)=>a[2]-b[2]);
  let built=0; for(const [cu,cv] of want){ const k=key(cu,cv); if(chunks.has(k)) continue; if(built&&over()) break; const g=buildChunk(cu,cv); scene.add(g); chunks.set(k,g); built++; if(over()) break; }
  for(const k of [...chunks.keys()]){ const cu=Math.floor(k/4096), cv=k%4096; if(Math.abs(cu-pu)>RAD+1||Math.abs(cv-pv)>RAD+1) dropChunk(k); } }
// ---------- personagens (placas com o sprite 2D do jogo, redesenhadas a cada quadro) ----------
const pool=[]; let poolUsed=0;
function entSprite(){ let e=pool[poolUsed]; if(!e){ const cv=document.createElement('canvas'); cv.width=120; cv.height=150; const t=canvasTex(cv), m=new THREE.SpriteMaterial({map:t,alphaTest:.5}); tint.push(m);
    const s=new THREE.Sprite(m); s.center.set(.5,0); scene.add(s); e=pool[poolUsed]={cv,g:cv.getContext('2d'),t,s}; } poolUsed++; e.s.visible=true; return e; }
const faceOf=(e,k)=>{ // pose de acordo com o ângulo entre para onde o personagem olha e a câmera
  let ang; if(k==='a'){ return null; }
  const v={down:[0,1],up:[0,-1],left:[-1,0],right:[1,0]}[e.face]; if(!v) return e.face; ang=Math.atan2(v[1],v[0]);
  const toCam=Math.atan2(cam.position.z-e.y/T, cam.position.x-e.x/T); let d=ang-toCam; d=Math.atan2(Math.sin(d),Math.cos(d));
  if(Math.abs(d)<Math.PI/4) return 'down'; if(Math.abs(d)>3*Math.PI/4) return 'up'; return d>0?'left':'right'; };
function drawEnts(now){ poolUsed=0; const R=FOGFAR, list=[];
  for(const n of npcs) if(!n.dead&&n.active) list.push(['n',n]);
  for(const r of raiders) list.push(['r',r]); for(const a of animals) list.push(['a',a]);
  for(const [k,e] of list){ const dx=e.x/T-cam.position.x, dz=e.y/T-cam.position.z; if(dx*dx+dz*dz>R*R) continue;
    const sc=(k==='r'&&MONS[e.mon]&&MONS[e.mon].scale)||1, big=sc>1.6, S=entSprite();
    const cw=big?160:40, chh=big?150:50; if(S.cv.width!==cw*3){ S.cv.width=cw*3; S.cv.height=chh*3; S.t.dispose(); S.t=canvasTex(S.cv); S.s.material.map=S.t; }
    const g=S.g; g.setTransform(1,0,0,1,0,0); g.clearRect(0,0,S.cv.width,S.cv.height); g.imageSmoothingEnabled=false; g.setTransform(3,0,0,3,cw*1.5,(chh-4)*3);
    const of=e.face, f=faceOf(e,k); if(f) e.face=f;
    if(dx*dx+dz*dz<144&&k!=='a') try{ if(k==='n') drawNPC(bctx,e,-3000,-3000); else drawRaider(bctx,e,-3000,-3000); }catch(err){}
    try{ if(k==='n') drawNPC(g,e,0,0); else if(k==='r') drawRaider(g,e,0,0); else drawAnimal(g,e,0,0); }catch(err){} e.face=of;
    S.t.needsUpdate=true; const hgt=big?7:chh/16*1.05; S.s.scale.set(hgt*cw/chh,hgt,1); S.s.position.set(e.x/T,-.25*hgt/chh*4,e.y/T); }
  for(let k=poolUsed;k<pool.length;k++) pool[k].s.visible=false; }
// ---------- luz do dia, céu e tochas ----------
const lights=[]; for(let k=0;k<(MOBILE?3:6);k++){ const l=new THREE.PointLight(0xff9a40,0,10,1.6); lights.push(l); }
const col=(a,b,t)=>new THREE.Color(a).lerp(new THREE.Color(b),t);
function lighting(now){
  const dk=darkness(time), dusk=Math.max(0,1-Math.abs(time-18.3)/1.6), dawn=Math.max(0,1-Math.abs(time-6.2)/1.2);
  const inDG=typeof DG!=='undefined'&&DG&&(inRect(DG.L1,player.x/T|0,player.y/T|0)||inRect(DG.L2,player.x/T|0,player.y/T|0));
  const Wx=window.WX||{cover:0,fog:0,rain:0,flash:0};
  // topo e horizonte do céu pela hora; nuvens deixam cinza; relâmpago clareia
  let top=col(0x3a6aa8,0x03050c,Math.min(1,dk*1.1)), hor=col(0xa8c4dc,0x0c1220,Math.min(1,dk*1.1));
  if(dusk>0){ hor.lerp(new THREE.Color(0xf08a4a),dusk*.75); top.lerp(new THREE.Color(0x5a4a7a),dusk*.5); }
  if(dawn>0){ hor.lerp(new THREE.Color(0xf0b080),dawn*.6); top.lerp(new THREE.Color(0x6a7aa8),dawn*.4); }
  const grey=new THREE.Color(.55,.58,.62).multiplyScalar(1-dk*.85); top.lerp(grey,Wx.cover*.8); hor.lerp(grey.clone().multiplyScalar(1.1),Wx.cover*.7);
  if(Wx.fog>.05){ const fg=new THREE.Color(.72,.74,.78).multiplyScalar(1-dk*.8); hor.lerp(fg,Wx.fog*.8); top.lerp(fg,Wx.fog*.5); }
  if(Wx.flash>0){ top.lerp(new THREE.Color(.85,.88,1),Wx.flash*.7); hor.lerp(new THREE.Color(.85,.88,1),Wx.flash*.7); }
  let sky=hor.clone(); if(inDG) sky=new THREE.Color(0x080404);
  scene.background=inDG?sky:null; if(!inDG) scene.background=hor; updSky(now,top,hor,dk,inDG);
  scene.fog.color.copy(sky); scene.fog.near=inDG?3:(8-Wx.fog*6); scene.fog.far=inDG?20:FOGFAR*(1-dk*.4)*(1-Wx.fog*.65)*(1-Wx.rain*.25);
  const day=inDG?.15:Math.max(.12,1-dk*.95); amb.intensity=.08+day*.6; sun.intensity=inDG?0:day*.75; sun.color=col(0xfff0d8,0xffa060,dusk);
  const tc=new THREE.Color().setScalar(Math.min(1,.22+day*.8)); if(dusk>0) tc.lerp(new THREE.Color(1,.8,.6),dusk*.3); for(const m of tint) m.color.copy(tc); fpLight.b=Math.min(1.05,tc.r+((inDG||dk>.3)?.1:0)); fpLight.warm=(inDG||dk>.3)?1:dusk*.5;
  // tochas e lanternas por perto + a luz do herói
  const L=[]; for(const c of chunks.values()) for(const [x,y] of (c.userData.lights||[])) L.push([x,y]);
  const px=player.x/T, py=player.y/T; L.sort((a,b)=>Math.hypot(a[0]-px,a[1]-py)-Math.hypot(b[0]-px,b[1]-py));
  lights.forEach((l,k)=>{ if(!l.parent) scene.add(l); if(k===0){ l.position.set(px,1.6,py); l.intensity=(inDG||dk>.3)?(player.lanternOn?2.2:1.2):0; l.distance=player.lanternOn?12:7; return; }
    const s=L[k-1]; if(!s||dk<.2&&!inDG){ l.intensity=0; return; } l.position.set(s[0],1.8,s[1]); l.intensity=1.8*flick(now,k); l.distance=9; });
}
// ---------- quadro ----------
let lowW=0, lowH=0; const fpLight={b:1,warm:0};
function size(){ const cssW=innerWidth, cssH=innerHeight, target=MOBILE?220:300; const z=cssH/target; const w=Math.round(cssW/z), h=Math.round(cssH/z);
  if(w!==lowW||h!==lowH){ lowW=w; lowH=h; R3.setSize(w,h,false); cam.aspect=w/h; cam.updateProjectionMatrix(); } }
let target=null;
function pickTarget(){ // monstro mais perto do centro da mira
  target=null; let best=.22; const fx=Math.cos(yaw), fy=Math.sin(yaw), px=player.x, py=player.y;
  for(const r of raiders){ const dx=r.x-px, dy=r.y-py, d=Math.hypot(dx,dy); if(d>14*T||d<1) continue; const a=Math.acos(Math.max(-1,Math.min(1,(dx*fx+dy*fy)/d))); if(a<best){ best=a; target=r; } } }
function fpFrame(now){
  if(!init3()) return; frameT0=performance.now();
  if(fpcv.style.display!=='block'){ fpcv.style.display='block'; canvas.style.background='transparent'; try{ resize(); }catch(e){} }
  size(); streamChunks();
  for(const c of chunks.values()) for(const d of (c.userData.doors||[])){ const dr=doors.get(d.userData.door); d.visible=!!(dr&&!dr.open); }
  // câmera no herói
  const bob=(player.moving||player.walkT)?Math.sin((player.walkT||now/160))*.02:0;
  cam.position.set(player.x/T, EYE+bob+(player.onTower?2.2:0)+(player.mount?.5:0), player.y/T);
  cam.rotation.order='YXZ'; cam.rotation.y=-yaw-Math.PI/2; cam.rotation.x=pitch;
  player.aimAng=yaw; if(typeof faceFromAng==='function') player.face=faceFromAng(yaw);
  pickTarget(); lighting(now); drawEnts(now); fireFrame(now);
  R3.render(scene,cam);
  let vm3=false;
  // camada 2D por cima: mira, rótulos e efeitos de tela
  ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,canvas.width,canvas.height);
  const cw=canvas.width, ch=canvas.height, k=dpr;
  if(window.fpHandsDraw) try{ vm3=fpHandsDraw(ctx,lowW,lowH,now,fpLight); }catch(e){ console.error(e); }
  if(!vm3&&window.fpViewDraw) try{ fpViewDraw(ctx,lowW,lowH,now,fpLight); }catch(e){ console.error(e); }
  ctx.fillStyle=target?'rgba(255,120,90,.95)':'rgba(255,240,200,.8)'; ctx.fillRect(cw/2-1*k,ch/2-7*k,2*k,14*k); ctx.fillRect(cw/2-7*k,ch/2-1*k,14*k,2*k);
  const v=new THREE.Vector3();
  const proj=(x,h,z)=>{ v.set(x,h,z).project(cam); if(v.z>1) return null; return [(v.x*.5+.5)*cw,(-v.y*.5+.5)*ch]; };
  const ents=[...npcs.filter(n=>!n.dead&&n.active),...raiders,...animals];
  const S=(wx,wy)=>{ let best=null; for(const e of ents){ const dy=e.y-wy; if(Math.abs(e.x-wx)<3&&dy>=-2&&dy<120&&(!best||Math.abs(e.x-wx)<Math.abs(best.x-wx))) best=e; }
    if(!best||Math.abs(wx-player.x)+Math.abs(wy-player.y)<2) return [-9999,-9999];
    const p=proj(best.x/T,(best.y-wy)/16*1.05,best.y/T); return p||[-9999,-9999]; };
  if(typeof drawHiResLabels==='function') drawHiResLabels(ctx,S);
  if(target){ const p=proj(target.x/T,2,target.y/T); if(p){ const M=MONS[target.mon]||{}, f=Math.max(0,target.hp/(target.maxHp||M.hp||1)); ctx.fillStyle='rgba(0,0,0,.6)'; ctx.fillRect(p[0]-30*k,p[1],60*k,6*k); ctx.fillStyle='#c0302a'; ctx.fillRect(p[0]-29*k,p[1]+k,58*k*f,4*k); } }
}
// ---------- liga no jogo ----------
const _render=render;
render=function(now){ if(fpOn()) return fpFrame(now); if(fpcv.style.display==='block'){ fpcv.style.display='none'; canvas.style.background=''; try{ resize(); }catch(e){} } return _render(now); };
const _mw=mouseWorld;
mouseWorld=function(){ if(!fpOn()) return _mw(); if(target) return {x:target.x,y:target.y-8}; return {x:player.x+Math.cos(yaw)*5*T,y:player.y+Math.sin(yaw)*5*T}; };
if(typeof monsterAt==='function'){ const _ma=monsterAt; monsterAt=function(x,y){ return fpOn()?target:_ma(x,y); }; }
// mouse: arrastar (ou travar o ponteiro com um clique) para olhar; clique curto ataca
let drag=null;
canvas.addEventListener('mousedown',e=>{ if(!fpOn()) return; drag={x:e.clientX,y:e.clientY,moved:false,b:e.button}; },true);
addEventListener('mousemove',e=>{ if(!fpOn()) return; const locked=document.pointerLockElement===canvas;
  if(locked){ yaw+=e.movementX*.0032; pitch=Math.max(-.45,Math.min(.35,pitch-e.movementY*.0028)); return; }
  if(drag){ const dx=e.clientX-drag.x, dy=e.clientY-drag.y; if(Math.abs(dx)+Math.abs(dy)>3) drag.moved=true; if(drag.moved){ yaw+=dx*.006; pitch=Math.max(-.45,Math.min(.35,pitch-dy*.005)); drag.x=e.clientX; drag.y=e.clientY; } } });
addEventListener('mouseup',()=>{ drag=null; });
if(typeof d2Click==='function'){ const _dc=d2Click; d2Click=function(e){ if(!fpOn()) return _dc(e); if(e&&e.button===0){ setTimeout(()=>{ if(!drag||!drag.moved){ playerAttack(yaw); } },0); } }; }
addEventListener('dblclick',()=>{ if(fpOn()&&!MOBILE&&canvas.requestPointerLock) try{ canvas.requestPointerLock(); }catch(e){} });
// teclado: setas giram
const turn={l:0,r:0}; addEventListener('keydown',e=>{ if(!fpOn()) return; if(e.key==='ArrowLeft') turn.l=1; if(e.key==='ArrowRight') turn.r=1; });
addEventListener('keyup',e=>{ if(e.key==='ArrowLeft') turn.l=0; if(e.key==='ArrowRight') turn.r=0; });
const _upd=update; update=function(dt){ _upd(dt); if(fpOn()) yaw+=(turn.r-turn.l)*dt*2.2; };
// toque: lado direito da tela arrasta para olhar
let look=null;
canvas.addEventListener('touchstart',e=>{ if(!fpOn()) return; for(const t of e.changedTouches) if(t.clientX>=innerWidth*.6&&!look) look={id:t.identifier,x:t.clientX,y:t.clientY}; },{passive:true});
canvas.addEventListener('touchmove',e=>{ if(!fpOn()||!look) return; for(const t of e.changedTouches) if(t.identifier===look.id){ yaw+=(t.clientX-look.x)*.008; pitch=Math.max(-.45,Math.min(.35,pitch-(t.clientY-look.y)*.006)); look.x=t.clientX; look.y=t.clientY; } },{passive:true});
canvas.addEventListener('touchend',e=>{ if(look) for(const t of e.changedTouches) if(t.identifier===look.id) look=null; },{passive:true});
// mudanças no mapa: refaz o pedaço
if(typeof dirtyChunks==='function'){ const _dc2=dirtyChunks; dirtyChunks=function(x,y){ _dc2(x,y); if(scene) dropChunk(key(Math.floor(x/CK),Math.floor(y/CK))); }; }
// ao entrar na câmera, olha para onde o herói estava virado
let lastMode=null; setInterval(()=>{ const m=typeof camModeGet==='function'?camModeGet():null; if(m==='fp'&&lastMode!=='fp'&&typeof player!=='undefined'&&player) yaw=(player.aimAng!=null?player.aimAng:Math.PI/2); lastMode=m; },300);
})();

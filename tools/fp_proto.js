// Protótipo de câmera em primeira pessoa (estilo Daggerfall / King's Field) — gera imagens de referência.
// Precisa de THREE (three.min.js r149) e de js/iso_core.js (texturas). fpRender(opts) -> dataURL 1280x720
(function(){
const C=ISOC, LOW=[480,270];
const texCache={};
function canvasTex(cv,rep){ const t=new THREE.CanvasTexture(cv); t.magFilter=THREE.NearestFilter; t.minFilter=THREE.NearestFilter; t.generateMipmaps=false;
  if(rep){ t.wrapS=t.wrapT=THREE.RepeatWrapping; } return t; }
function shade(c,k){ return [c[0]*k,c[1]*k,c[2]*k]; }
// textura de parede (tijolo/pedra/madeira) a partir do material do jogo
function wallTex(mi,win){ const k='w'+mi+(win?'w':''); if(texCache[k]) return texCache[k]; const M=MATS[mi]||MATS[6], S=32, cv=document.createElement('canvas'); cv.width=S; cv.height=S*2;
  const g=cv.getContext('2d'), im=g.createImageData(S,S*2);
  for(let y=0;y<S*2;y++) for(let x=0;x<S;x++){ const c=C.wallPix(M,x/S,(S*2-y)*0.9,1,win,S*2*0.9), q=(y*S+x)*4; im.data[q]=c[0]; im.data[q+1]=c[1]; im.data[q+2]=c[2]; im.data[q+3]=255; }
  g.putImageData(im,0,0); return texCache[k]=canvasTex(cv); }
function roofTex(){ if(texCache.roof) return texCache.roof; const cv=document.createElement('canvas'); cv.width=32; cv.height=32; const g=cv.getContext('2d');
  for(let y=0;y<32;y++) for(let x=0;x<32;x++){ const row=y>>2, off=(row%2)*4, edge=(y%4===0)||((x+off)%8===0); const n=C.hsh(x,y,3);
    const c=edge?[60,32,24]:[132-row*2+n*20,62+n*10,44]; g.fillStyle=`rgb(${c[0]|0},${c[1]|0},${c[2]|0})`; g.fillRect(x,y,1,1); }
  return texCache.roof=canvasTex(cv,true); }
function rockTex(bio){ const k='r'+bio; if(texCache[k]) return texCache[k]; const cv=document.createElement('canvas'); cv.width=32; cv.height=32; const g=cv.getContext('2d');
  for(let y=0;y<32;y++) for(let x=0;x<32;x++){ const v=C.vnoise(x*.2,y*.2,5)*.6+C.vnoise(x*.6,y*.6,6)*.4; let c=bio==='n'?[150,154,162]:bio==='dg'?[70,62,56]:[118,108,96]; c=shade(c,.6+v*.6);
    if(bio==='n'&&C.vnoise(x*.3,y*.15,9)>.62) c=[226,232,238]; g.fillStyle=`rgb(${c[0]|0},${c[1]|0},${c[2]|0})`; g.fillRect(x,y,1,1); }
  return texCache[k]=canvasTex(cv,true); }
const biomeAt=(x,y)=>{ const r=regions[regionId[y*W+x]]; if(typeof DG!=='undefined'&&DG&&(inRect(DG.L1,x,y)||inRect(DG.L2,x,y))) return 'dg'; if(r&&(r.kind==='city'||r.kind==='town')) return 'city'; return (r&&r.biome)||'p'; };
// sprite 2D do jogo -> canvas (para placas sempre viradas para a câmera, como no Daggerfall)
function spriteCanvas(fn,w,h,ax,ay,sc){ const cv=document.createElement('canvas'); cv.width=w*sc; cv.height=h*sc; const g=cv.getContext('2d'); g.imageSmoothingEnabled=false; g.scale(sc,sc); g.translate(ax,ay); try{ fn(g); }catch(e){} return cv; }
function billboard(scene,cv,x,z,hgt,y0){ const t=canvasTex(cv), m=new THREE.SpriteMaterial({map:t,transparent:true,alphaTest:.5,fog:true}); const s=new THREE.Sprite(m);
  const asp=cv.width/cv.height; s.scale.set(hgt*asp,hgt,1); s.center.set(.5,0); s.position.set(x,y0||0,z); scene.add(s); return s; }

window.fpRender=function(o){
  const cx=Math.round(o.x??(o.camX+o.lookX)/2), cy=Math.round(o.y??(o.camY+o.lookY)/2), R=o.r||34;
  const renderer=new THREE.WebGLRenderer({antialias:false,preserveDrawingBuffer:true}); renderer.setSize(LOW[0],LOW[1]); renderer.setPixelRatio(1);
  const scene=new THREE.Scene(); const sky=new THREE.Color(o.sky||'#8aa6c0'); scene.background=sky; scene.fog=new THREE.Fog(o.fogCol||o.sky||'#8aa6c0',o.fogNear||6,o.fogFar||30);
  const cam=new THREE.PerspectiveCamera(o.fov||62,LOW[0]/LOW[1],.05,200);
  scene.add(new THREE.AmbientLight(0xffffff,o.amb!=null?o.amb:.55)); const sun=new THREE.DirectionalLight(o.sunCol||0xfff0d8,o.sun!=null?o.sun:.85); sun.position.set(-3,6,-2); scene.add(sun);
  const x0=Math.max(0,cx-R), x1=Math.min(W-1,cx+R), y0=Math.max(0,cy-R), y1=Math.min(H-1,cy+R), TS=16;
  // chão: uma textura contínua da região, pixel a pixel, com as cores do jogo
  { const w=(x1-x0+1), h=(y1-y0+1), cv=document.createElement('canvas'); cv.width=w*TS; cv.height=h*TS; const g=cv.getContext('2d'), im=g.createImageData(w*TS,h*TS);
    for(let py=0;py<h*TS;py++) for(let px=0;px<w*TS;px++){ const U=x0+px/TS, V=y0+py/TS, x=Math.floor(U), y=Math.floor(V), i=y*W+x; let t=map[i];
      if(t===TL.WALL||t===TL.WINDOW) t=C.underFloor(x,y); if(t===TL.ROCK) t=TL.DIRT;
      const c=C.floorCol(t,U,V,i,biomeAt(x,y)), q=(py*w*TS+px)*4; im.data[q]=c[0]; im.data[q+1]=c[1]; im.data[q+2]=c[2]; im.data[q+3]=255; }
    g.putImageData(im,0,0);
    const geo=new THREE.PlaneGeometry(w,h); geo.rotateX(-Math.PI/2); const m=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({map:canvasTex(cv)}));
    m.position.set(x0+w/2,0,y0+h/2); scene.add(m);
    if(o.ceiling){ const c2=new THREE.Mesh(geo.clone(),new THREE.MeshLambertMaterial({color:o.ceiling,side:THREE.DoubleSide})); c2.position.set(x0+w/2,2.7,y0+h/2); scene.add(c2); }
    // água: um pouco abaixo e escura nas bordas já vem da textura
  }
  const WH=2.6, boxGeo=new THREE.BoxGeometry(1,WH,1);
  const mats={}, getMat=(mi,win)=>{ const k=mi+'_'+win; return mats[k]||(mats[k]=new THREE.MeshLambertMaterial({map:wallTex(mi,win)})); };
  for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++){ const i=y*W+x, t=map[i];
    if(t===TL.WALL||t===TL.WINDOW){ const m=new THREE.Mesh(boxGeo,getMat(mat[i],t===TL.WINDOW)); m.position.set(x+.5,WH/2,y+.5); scene.add(m); }
    else if(t===TL.ROCK){ const h=1.6+C.hsh(x,y,1)*2.6, geo=new THREE.DodecahedronGeometry(.85,1); const p=geo.attributes.position;
      for(let k=0;k<p.count;k++){ const j=.75+C.hsh(k,x*7+y,3)*.5; p.setXYZ(k,p.getX(k)*j,p.getY(k)*j,p.getZ(k)*j); } geo.computeVertexNormals();
      const m=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({map:rockTex(biomeAt(x,y)),flatShading:true})); m.scale.set(1,h/1.6,1); m.position.set(x+.5,h*.35,y+.5); scene.add(m); }
    else if(t===TL.FENCE){ const m=new THREE.Mesh(new THREE.BoxGeometry(1,.8,.1),new THREE.MeshLambertMaterial({color:0x5a3e24})); m.position.set(x+.5,.4,y+.5); scene.add(m); }
  }
  // telhados de duas águas sobre as construções (menos a que estamos dentro)
  if(!o.noRoofs) for(const b of buildings){ if(!b||b.x+b.w<x0||b.x>x1||b.y+b.h<y0||b.y>y1) continue; if(o.inside&&cx>=b.x&&cx<b.x+b.w&&cy>=b.y&&cy<b.y+b.h) continue;
    const alongX=b.w>=b.h, L=alongX?b.w:b.h, S=alongX?b.h:b.w, rh=Math.min(2.4,S*.45);
    const sh=new THREE.Shape(); sh.moveTo(-S/2-.3,0); sh.lineTo(S/2+.3,0); sh.lineTo(0,rh); sh.lineTo(-S/2-.3,0);
    const geo=new THREE.ExtrudeGeometry(sh,{depth:L+.6,bevelEnabled:false}); const uv=geo.attributes.uv; for(let k=0;k<uv.count;k++) uv.setXY(k,uv.getX(k)*.6,uv.getY(k)*.6);
    const m=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({map:roofTex()}));
    if(alongX){ m.rotation.y=Math.PI/2; m.position.set(b.x-.3,WH,b.y+b.h/2); } else m.position.set(b.x+b.w/2,WH,b.y-.3);
    scene.add(m); }
  // árvores e objetos como placas
  const seen=new Set(), treeC={};
  for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++){ const ob=objGrid[y*W+x]; if(!ob||seen.has(ob)) continue; seen.add(ob);
    const w=ob.w||1, h=ob.h||1, px=ob.x+w/2, pz=ob.y+h/2;
    if(ob.type==='tree'||ob.type==='pine'||ob.type==='olive'){ const bio=ob.type==='pine'?'n':biomeAt(ob.x,ob.y), sd=(ob.x*7+ob.y*13)%12, key=ob.type+bio+sd;
      const cv=treeC[key]||(treeC[key]=(()=>{ const c=document.createElement('canvas'); c.width=150; c.height=190; C.drawTree(c.getContext('2d'),75,184,sd*97+3,bio); return c; })());
      billboard(scene,cv,px,pz,4.6+C.hsh(ob.x,ob.y,2)*1.4,-.15); continue; }
    if(ob.type==='rug') continue;
    const cv=spriteCanvas(g=>drawObj(g,ob,0,0,performance.now()),w*16+8,h*16+30,4,22,3); billboard(scene,cv,px,pz,(h*16+30)/16*.9,0); }
  // personagens: os sprites 2D de frente para a câmera
  const vis=[...npcs.filter(n=>!n.dead&&n.active).map(n=>['n',n]),...raiders.map(r=>['r',r]),...animals.map(a=>['a',a])];
  for(const [k,e] of vis){ const tx=e.x/T, ty=e.y/T; if(Math.abs(tx-cx)>R||Math.abs(ty-cy)>R) continue; if(o.hideNear&&Math.hypot(tx-o.camX,ty-o.camY)<1.2) continue;
    const sc=(k==='r'&&MONS[e.mon]&&MONS[e.mon].scale)||1, big=sc>1.6;
    const cv=spriteCanvas(g=>{ if(k==='n') drawNPC(g,e,0,0); else if(k==='r') drawRaider(g,e,0,0); else drawAnimal(g,e,0,0); },big?160:40,big?150:44,big?80:20,big?140:40,3);
    billboard(scene,cv,tx,ty,big?7:44/16*1.05,0); }
  // luzes de tocha
  for(const [lx,ly,c,int,dist] of (o.lights||[])){ const l=new THREE.PointLight(c||0xff9a40,int||1.6,dist||9,1.6); l.position.set(lx,1.8,ly); scene.add(l); }
  cam.position.set(o.camX,o.eye||1.45,o.camY); cam.lookAt(o.lookX,o.lookH||1.3,o.lookY);
  renderer.render(scene,cam);
  // amplia sem suavizar (pixels grandes do PS1) e desenha a mão com a arma + um HUD mínimo
  const out=document.createElement('canvas'); out.width=1280; out.height=720; const g=out.getContext('2d'); g.imageSmoothingEnabled=false; g.drawImage(renderer.domElement,0,0,1280,720);
  const p=8/3; // tamanho do "pixel" na tela
  const px=(x,y,w,h,c)=>{ g.fillStyle=c; g.fillRect(Math.round(x*p),Math.round(y*p),Math.ceil(w*p),Math.ceil(h*p)); };
  if(o.weapon!=='none'){ // braço com manopla e espada, canto inferior direito
    const bx=330, by=180;
    for(let k=0;k<70;k++){ const t=k/70; px(bx+40-t*28,by-6-t*120,6,4,`rgb(${200+t*30},${204+t*30},${214+t*30})`); } // lâmina
    px(bx+13,by-126,2,8,'#f0f4fa'); px(bx+6,by-8,40,7,'#c8a040'); px(bx+6,by-8,40,2,'#e8c870'); // guarda
    px(bx+18,by-2,12,14,'#5a3a20'); // cabo
    for(let k=0;k<40;k++){ const t=k/40; px(bx+10+t*30,by+10+t*60,34,6,`rgb(${110-t*30},${112-t*30},${118-t*30})`); } // braço em malha
    px(bx+10,by+4,34,18,'#8a8e96'); px(bx+12,by+6,30,4,'#aab0ba'); // manopla
  }
  if(o.spell){ const gx=70, gy=200; const gr=g.createRadialGradient(gx*p,(gy-40)*p,0,gx*p,(gy-40)*p,90); gr.addColorStop(0,'rgba(255,200,90,.9)'); gr.addColorStop(1,'rgba(255,120,30,0)'); g.fillStyle=gr; g.fillRect(0,(gy-120)*p,200*p/1.4,140*p);
    px(gx-20,gy-30,40,40,'rgba(150,120,90,1)'); }
  // mira, bússola e barras
  g.fillStyle='rgba(255,240,200,.85)'; g.fillRect(638,352,4,16); g.fillRect(632,358,16,4);
  g.fillStyle='rgba(18,14,10,.8)'; g.fillRect(540,14,200,30); g.strokeStyle='#8a6a3a'; g.strokeRect(540,14,200,30); g.fillStyle='#e8c070'; g.font='bold 18px monospace'; g.textAlign='center';
  const ang=Math.atan2(o.lookY-o.camY,o.lookX-o.camX), dirs=['L','SE','S','SO','O','NO','N','NE']; g.fillText(dirs[((Math.round(ang/(Math.PI/4))%8)+8)%8]+'  ·  '+(o.place||''),640,36);
  const bar=(y,c,f)=>{ g.fillStyle='rgba(0,0,0,.6)'; g.fillRect(20,y,220,14); g.fillStyle=c; g.fillRect(22,y+2,216*f,10); };
  bar(660,'#c0302a',.86); bar(678,'#3a62c0',.6); bar(696,'#c8a030',.95);
  // vinheta leve
  const vg=g.createRadialGradient(640,360,280,640,360,760); vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,.45)'); g.fillStyle=vg; g.fillRect(0,0,1280,720);
  renderer.dispose(); return out.toDataURL('image/png');
};
})();

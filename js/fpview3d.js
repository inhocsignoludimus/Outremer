// =====================================================================
// PRIMEIRA PESSOA — mãos, armas, escudos e ferramentas em 3D (estilo pixel pintado)
// Modelos montados com formas simples (dedos com 3 falanges, palma, antebraço com braçadeira),
// sombreamento em degraus (toon) e contorno escuro, desenhados na mesma resolução baixa do mundo.
// As animações são poses-chave interpoladas (golpe diagonal, revés, golpe de cima, estocada, soco,
// puxar o arco, recarregar a besta, cortar/minerar). Se o 3D falhar, fica o desenho 2D (fpview.js).
// =====================================================================
(function(){
if(typeof THREE==='undefined'||typeof fpOn!=='function') return;
const V3=(x,y,z)=>new THREE.Vector3(x,y,z);
// ---------- materiais ----------
const GRAD=(()=>{ const d=new Uint8Array([46,46,46,255, 120,120,120,255, 196,196,196,255, 255,255,255,255]); const t=new THREE.DataTexture(d,4,1,THREE.RGBAFormat); t.minFilter=t.magFilter=THREE.NearestFilter; t.needsUpdate=true; return t; })();
const MATS={};
function toon(col,map,em){ const k=col+'|'+(map?map.uuid:'')+'|'+(em||''); if(MATS[k]) return MATS[k]; const m=new THREE.MeshToonMaterial({color:col,gradientMap:GRAD,map:map||null}); if(em){ m.emissive=new THREE.Color(em); } return MATS[k]=m; }
const OUT=new THREE.MeshBasicMaterial({color:0x140c08,side:THREE.BackSide});
function ctex(w,h,fn){ const c=document.createElement('canvas'); c.width=w; c.height=h; fn(c.getContext('2d'),w,h); const t=new THREE.CanvasTexture(c); t.magFilter=t.minFilter=THREE.NearestFilter; t.generateMipmaps=false; t.wrapS=t.wrapT=THREE.RepeatWrapping; return t; }
// braçadeira de couro com tiras trançadas e costura
const BRACER=ctex(32,64,(g,w,h)=>{ g.fillStyle='#4a3020'; g.fillRect(0,0,w,h); for(let y=0;y<h;y+=8){ g.fillStyle='#2e1c12'; g.fillRect(0,y,w,1); }
  g.strokeStyle='#8a6a48'; g.lineWidth=1.4; for(let y=-8;y<h+8;y+=12){ g.beginPath(); g.moveTo(0,y); g.lineTo(w,y+10); g.stroke(); g.beginPath(); g.moveTo(w,y); g.lineTo(0,y+10); g.stroke(); }
  g.fillStyle='#c8a878'; for(let y=2;y<h;y+=4){ g.fillRect(3,y,1,2); g.fillRect(w-4,y,1,2); } });
BRACER.repeat.set(2,5);
const WRAP=ctex(8,32,(g,w,h)=>{ g.fillStyle='#3a2416'; g.fillRect(0,0,w,h); g.fillStyle='#5a3a24'; for(let y=0;y<h;y+=4){ g.fillRect(0,y,w,2); } g.fillStyle='#22140c'; for(let y=3;y<h;y+=4) g.fillRect(0,y,w,1); });
const WOODT=ctex(8,64,(g,w,h)=>{ for(let y=0;y<h;y++){ const v=110+Math.sin(y*.7)*14+((y*37)%11); g.fillStyle=`rgb(${v},${v*.66|0},${v*.42|0})`; g.fillRect(0,y,w,1); } g.fillStyle='rgba(40,20,10,.5)'; g.fillRect(2,0,1,h); g.fillRect(6,0,1,h); });
// ---------- utilidades de geometria ----------
function outline(mesh,t){ const g=mesh.geometry.clone(), p=g.attributes.position, n=g.attributes.normal; if(!n) return mesh;
  for(let i=0;i<p.count;i++) p.setXYZ(i,p.getX(i)+n.getX(i)*t,p.getY(i)+n.getY(i)*t,p.getZ(i)+n.getZ(i)*t); const o=new THREE.Mesh(g,OUT); o.renderOrder=-1; mesh.add(o); return mesh; }
function M(geo,mat,ol){ const m=new THREE.Mesh(geo,mat); if(ol!==0) outline(m,(ol||.0021)*1.7); return m; }
const cyl=(r1,r2,h,seg)=>new THREE.CylinderGeometry(r1,r2,h,seg||8);
function capsX(r,len){ const g=new THREE.CapsuleGeometry(r,Math.max(.0001,len-2*r),3,8); g.rotateZ(Math.PI/2); g.translate(-len/2,0,0); return g; }
function extrude(pts,depth,bev){ const s=new THREE.Shape(); s.moveTo(pts[0],pts[1]); for(let i=2;i<pts.length;i+=2) s.lineTo(pts[i],pts[i+1]); s.closePath();
  const g=new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:!!bev,bevelThickness:bev||0,bevelSize:bev?bev*1.6:0,bevelSegments:1,curveSegments:6}); g.translate(0,0,-depth/2); g.computeVertexNormals(); return g; }
function place(m,x,y,z,rx,ry,rz){ m.position.set(x,y,z); m.rotation.set(rx||0,ry||0,rz||0); return m; }
// ---------- a mão (cabo vertical no eixo Y passando pela origem; costas da mão para +x; pulso para +z) ----------
function makeHand(skinCol,gloveCol,metal){
  const H=new THREE.Group(), col=gloveCol||skinCol, mat=toon(col), matD=toon(new THREE.Color(col).multiplyScalar(.82).getHex());
  const back=M(new THREE.SphereGeometry(1,10,8),mat); back.scale.set(.016,.041,.042); back.position.set(.026,-.001,.01); H.add(back);
  const heel=M(new THREE.SphereGeometry(1,8,6),matD); heel.scale.set(.016,.024,.02); heel.position.set(.012,-.016,.03); H.add(heel);
  const fingers=[];
  const F=[[.026,.0086,[.034,.022,.017]],[.009,.0090,[.036,.023,.018]],[-.008,.0085,[.034,.022,.017]],[-.024,.0074,[.028,.019,.015]]];
  for(const [y,r,L] of F){ const j0=new THREE.Group(); j0.position.set(.026,y,-.028); H.add(j0); const js=[j0]; let cur=j0;
    for(let k=0;k<3;k++){ if(k){ const j=new THREE.Group(); j.position.x=-L[k-1]; cur.add(j); cur=j; js.push(j); } cur.add(M(capsX(r*(1-k*.08),L[k]+r*.6),k===0?mat:matD,.0019));
      if(metal&&k===0){ const pl=M(new THREE.BoxGeometry(L[k]*.8,r*1.6,r*.7),toon(0x9aa0aa)); pl.position.set(-L[k]/2,0,-r*.8); cur.add(pl); } }
    fingers.push(js); }
  // polegar cruzando o lado de perto do cabo
  const t0=new THREE.Group(); t0.position.set(.022,.02,.026); t0.rotation.z=-.15; H.add(t0); const t1=new THREE.Group(); t1.position.x=-.026; t0.add(t1);
  t0.add(M(capsX(.0098,.03),mat,.0019)); t1.add(M(capsX(.0092,.022),matD,.0019));
  if(metal){ const kn=M(new THREE.BoxGeometry(.012,.072,.03),toon(0xa8aeb8)); kn.position.set(.034,0,-.012); H.add(kn); }
  H.userData={fingers,thumb:[t0,t1]}; setCurl(H,1); return H; }
function setCurl(H,c){ const F=H.userData.fingers; for(const js of F){ js[0].rotation.y=.05*c; js[1].rotation.y=1.15*c; js[2].rotation.y=.75*c; }
  const [t0,t1]=H.userData.thumb; t0.rotation.y=-.1+(-.2*(1-c)); t1.rotation.y=-.9*c; }
// antebraço: cilindro do pulso até um "cotovelo" fixo fora da tela
function makeArm(col,bracer){ const g=cyl(.023,.033,1,10); g.translate(0,-.5,0); const m=M(g,toon(bracer?0xffffff:col,bracer?BRACER:null),.0024); if(bracer) m.material.color=new THREE.Color(col).lerp(new THREE.Color(0xffffff),.35);
  const cuff=M(cyl(.026,.026,.03,10),toon(new THREE.Color(col).multiplyScalar(.6).getHex())); cuff.position.y=-.015; m.add(cuff); return m; }
const _a=V3(0,0,0), _b=V3(0,0,0), _up=V3(0,1,0);
function aimArm(arm,wrist,elbow){ _a.copy(wrist).sub(elbow); const L=_a.length(); arm.position.copy(wrist); arm.scale.set(1,L,1); arm.quaternion.setFromUnitVectors(_up,_a.normalize()); }
// ---------- armas (cabo no eixo Y, origem no centro da mão, ponta para +Y) ----------
const STEEL=0xa2aab6, DSTEEL=0x5c626c, IRON=0x6e727a, BRASS=0xa8843a, WOOD=0x8a5c36, LEATH=0x4a2e1c;
function grip(len,r,y0){ const m=M(cyl(r,r,len,8),toon(0xffffff,WRAP)); m.position.y=y0+len/2; return m; }
function blade(len,w,curve,tip){ const t=tip||w*1.3, c=curve||0;
  const g=extrude([-w/2,0, -w/2+c*.4,len*.55, -w/2*0.8+c,len-t, c*1.2,len, w/2*.8+c,len-t, w/2+c*.4,len*.55, w/2,0],.0035,.0018); const m=M(g,toon(STEEL));
  const fu=M(new THREE.BoxGeometry(w*.18,len*.62,.0075),toon(DSTEEL),0); fu.position.set(c*.25,len*.34,0); m.add(fu); return m; }
function sword(id,W){ const G=new THREE.Group(), L=Math.min(.78,(W.len||10)*.045+.16), wide=id==='falchion'?.055:id==='longsword'||id==='broadsword'||id==='claymore'?.046:.04;
  const curve=id==='scimitar'?.06:id==='falchion'?.025:0; G.add(grip(.11,.0125,-.065));
  const pom=M(new THREE.SphereGeometry(.018,8,6),toon(BRASS)); pom.position.y=-.072; G.add(pom);
  const gd=M(new THREE.BoxGeometry(.13,.016,.022),toon(BRASS)); gd.position.y=.052; G.add(gd); for(const s of [-1,1]){ const e=M(new THREE.SphereGeometry(.013,6,5),toon(BRASS)); e.position.set(s*.066,.054,0); G.add(e); }
  const b=blade(L,wide,curve); b.position.y=.06; G.add(b); return G; }
function dagger(){ const G=new THREE.Group(); G.add(grip(.075,.011,-.04)); const gd=M(new THREE.BoxGeometry(.07,.012,.018),toon(BRASS)); gd.position.y=.04; G.add(gd); const b=blade(.2,.034,0,.06); b.position.y=.046; G.add(b); return G; }
function rapier(W){ const G=new THREE.Group(); G.add(grip(.09,.011,-.05)); const pm=M(new THREE.SphereGeometry(.015,8,6),toon(BRASS)); pm.position.y=-.058; G.add(pm);
  for(const [r,ry] of [[.05,0],[.042,1.2],[.042,-1.2]]){ const t=M(new THREE.TorusGeometry(r,.0045,5,14,Math.PI*1.1),toon(BRASS),.0016); t.position.y=.03; t.rotation.set(0,ry,Math.PI*1.05); G.add(t); }
  const b=blade(.8,.016,0,.04); b.position.y=.045; G.add(b); return G; }
function haft(len,r,y0,mat){ const m=M(cyl(r,r*1.1,len,8),mat||toon(0xffffff,WOODT)); m.position.y=y0+len/2; return m; }
function axe(id,W){ const G=new THREE.Group(), big=id==='battleaxe'||id==='double_axe'||id==='greataxe', L=big?.62:.5; G.add(haft(L+.12,.013,-.1)); G.add(grip(.1,.0145,-.06));
  const hw=big?.15:.11, hh=big?.18:.13, sides=id==='double_axe'?[-1,1]:[-1];
  for(const s of sides){ const g=extrude([0,-hh*.25, s*hw*.55,-hh*.32, s*hw,-hh*.55, s*hw*1.05,0, s*hw,hh*.55, s*hw*.55,hh*.3, 0,hh*.22],.012,.003); const m=M(g,toon(IRON)); m.position.y=L-.02; G.add(m);
    const ed=M(extrude([s*hw*.82,-hh*.48, s*hw*1.05,0, s*hw*.82,hh*.48, s*hw,0],.0135,0),toon(0xe8ecf2),0); ed.position.y=L-.02; G.add(ed); }
  if(sides.length===1){ const sp=M(new THREE.ConeGeometry(.012,.05,5),toon(DSTEEL)); sp.rotation.z=-Math.PI/2; sp.position.set(.03,L-.02,0); G.add(sp); }
  const col=M(new THREE.BoxGeometry(.032,.06,.03),toon(DSTEEL)); col.position.y=L-.02; G.add(col); return G; }
function mace(id,W){ const G=new THREE.Group(), L=.34;
  if(id==='club'){ const m=M(cyl(.03,.016,.5,7),toon(0xffffff,WOODT)); m.position.y=.2; G.add(m); for(let k=0;k<5;k++){ const n=M(new THREE.SphereGeometry(.009,5,4),toon(0x5a3a22),0); const a=k*2.3; n.position.set(Math.cos(a)*.026,.18+k*.06,Math.sin(a)*.026); G.add(n); } return G; }
  G.add(haft(L+.1,.012,-.08)); G.add(grip(.1,.014,-.06));
  if(id==='flail'){ const ch=new THREE.Group(); ch.position.y=L+.02; G.add(ch); for(let k=0;k<5;k++){ const r=M(new THREE.TorusGeometry(.009,.003,4,8),toon(IRON),0); r.position.y=k*.016; r.rotation.y=k%2?Math.PI/2:0; ch.add(r); }
    const ball=M(new THREE.SphereGeometry(.04,10,8),toon(IRON)); ball.position.y=.1; ch.add(ball); for(let k=0;k<10;k++){ const c=M(new THREE.ConeGeometry(.008,.03,4),toon(STEEL),0); const d=V3(Math.sin(k*2.4)*Math.cos(k*1.3),Math.cos(k*2.4),Math.sin(k*2.4)*Math.sin(k*1.3)).normalize(); c.position.copy(d).multiplyScalar(.045).add(V3(0,.1,0)); c.quaternion.setFromUnitVectors(_up,d); ch.add(c); }
    G.userData.flail=ch; return G; }
  if(id==='morningstar'){ const ball=M(new THREE.SphereGeometry(.042,10,8),toon(IRON)); ball.position.y=L+.03; G.add(ball); for(let k=0;k<12;k++){ const c=M(new THREE.ConeGeometry(.008,.034,4),toon(STEEL),0); const d=V3(Math.sin(k*2.4)*Math.cos(k*1.3),Math.cos(k*2.4),Math.sin(k*2.4)*Math.sin(k*1.3)).normalize(); c.position.copy(d).multiplyScalar(.048).add(V3(0,L+.03,0)); c.quaternion.setFromUnitVectors(_up,d); G.add(c); } return G; }
  if(id==='warhammer'||id==='smith_hammer'){ const sm=id==='smith_hammer'; const hd=M(new THREE.BoxGeometry(sm?.1:.12,sm?.045:.055,sm?.045:.055),toon(IRON)); hd.position.y=L; G.add(hd); if(!sm){ const sp=M(new THREE.ConeGeometry(.018,.07,5),toon(STEEL)); sp.rotation.z=Math.PI/2; sp.position.set(-.09,L,0); G.add(sp); } return G; }
  for(let k=0;k<6;k++){ const f=M(extrude([0,0, .044,.022, .046,.08, 0,.105],.009,.002),toon(k%2?IRON:STEEL),.0016); f.position.y=L-.04; f.rotation.y=k*Math.PI/3; G.add(f); }
  const tp=M(new THREE.SphereGeometry(.016,8,6),toon(STEEL)); tp.position.y=L+.06; G.add(tp); return G; }
function polearm(id,W){ const G=new THREE.Group(); G.add(haft(1.25,.013,-.55)); G.add(grip(.09,.0145,-.05));
  const top=.7; const hd=M(extrude([-.02,0, 0,.17, .02,0, 0,-.02],.006,.0025),toon(STEEL)); hd.position.y=top; G.add(hd);
  if(id==='halberd'){ const ax=M(extrude([0,-.04, -.12,-.07, -.15,.0, -.12,.08, 0,.04],.01,.003),toon(IRON)); ax.position.y=top-.06; G.add(ax); const bk=M(new THREE.ConeGeometry(.012,.06,4),toon(DSTEEL)); bk.rotation.z=-Math.PI/2; bk.position.set(.04,top-.06,0); G.add(bk); }
  if(id==='scythe'){ G.remove(hd); const pts=[]; for(let k=0;k<=10;k++){ const t=k/10; pts.push(-t*.36,Math.sin(t*Math.PI)*.07+t*.02); } for(let k=10;k>=0;k--){ const t=k/10; pts.push(-t*.36,Math.sin(t*Math.PI)*.07+t*.02-.05*(1-t)-.006); }
    const bl=M(extrude(pts,.004,.0015),toon(STEEL)); bl.position.y=top+.04; G.add(bl); }
  return G; }
function staff(id,W){ const G=new THREE.Group(), wand=id==='wand'; const sp=W.spell;
  if(wand){ const m=M(cyl(.006,.01,.3,6),toon(0x3a2a4a)); m.position.y=.1; G.add(m); }
  else { G.add(haft(1.2,.014,-.55)); for(const y of [.25,-.2]){ const k=M(cyl(.017,.017,.02,8),toon(0x4a2e18)); k.position.y=y; G.add(k); } }
  const topY=wand?.26:.66, gc={fogo:0xff6a1a,gelo:0x4aa8ff,arcano:0xb080ff,luz:0xf0c040}[sp];
  if(sp==='luz'){ const v=M(new THREE.BoxGeometry(.018,.16,.018),toon(BRASS,null,0x3a2a00)); v.position.y=topY+.08; G.add(v); const h=M(new THREE.BoxGeometry(.11,.018,.018),toon(BRASS,null,0x3a2a00)); h.position.y=topY+.11; G.add(h);
    const gem=M(new THREE.OctahedronGeometry(.016),toon(0xfff2c0,null,0xb08020),0); gem.position.y=topY+.11; G.add(gem); G.userData.glow=gem; return G; }
  if(gc){ for(let k=0;k<3;k++){ const p=M(new THREE.ConeGeometry(.008,.07,4),toon(0x4a2e18),.0015); p.position.set(Math.cos(k*2.1)*.016,topY+.02,Math.sin(k*2.1)*.016); p.rotation.set(Math.sin(k*2.1)*.4,0,-Math.cos(k*2.1)*.4); G.add(p); }
    const gem=M(new THREE.OctahedronGeometry(wand?.016:.028),toon(gc,null,gc),0); gem.scale.y=1.5; gem.position.y=topY+(wand?.02:.05); G.add(gem); G.userData.glow=gem; return G; }
  const kn=M(new THREE.SphereGeometry(.03,7,6),toon(0x6a4428)); kn.scale.y=1.3; kn.position.y=topY; G.add(kn); return G; }
function pickaxe(){ const G=new THREE.Group(); G.add(haft(.55,.012,-.1)); G.add(grip(.1,.014,-.06)); const pts=[]; for(let k=0;k<=8;k++){ const t=k/8*2-1; pts.push(t*.17,-Math.abs(t)*.035-.0+(1-Math.abs(t))*.012); } for(let k=8;k>=0;k--){ const t=k/8*2-1; pts.push(t*.15,-Math.abs(t)*.03+.022); }
  const h=M(extrude(pts,.016,.003),toon(IRON)); h.position.y=.43; G.add(h); return G; }
function bowModel(long){ const G=new THREE.Group(), H=long?.62:.5; const pts=[]; for(let k=0;k<=12;k++){ const t=k/12*2-1; pts.push(V3(-Math.cos(t*Math.PI/2)*.1+.08,t*H/2,0)); }
  const curve=new THREE.CatmullRomCurve3(pts); const limb=M(new THREE.TubeGeometry(curve,20,.013,6),toon(0xffffff,WOODT)); G.add(limb);
  const gr=M(cyl(.013,.013,.08,8),toon(0xffffff,WRAP)); G.add(gr); G.userData.tips=[V3(.07*0.2+.0,H/2,0),V3(.0,-H/2,0)]; G.userData.H=H;
  const str=new THREE.Group(); G.add(str); for(let k=0;k<2;k++){ const s=new THREE.Mesh(cyl(.0018,.0018,1,4),new THREE.MeshBasicMaterial({color:0xe8e0c8})); str.add(s); } G.userData.str=str;
  const arrow=new THREE.Group(); const sh=M(cyl(.004,.004,.6,5),toon(0xb08a5a),.0014); sh.position.y=.3; arrow.add(sh); const hd=M(new THREE.ConeGeometry(.01,.04,4),toon(STEEL),.0014); hd.position.y=.62; arrow.add(hd);
  for(let k=0;k<3;k++){ const f=new THREE.Mesh(new THREE.PlaneGeometry(.014,.05),toon(0xe8e4dc)); f.material.side=THREE.DoubleSide; f.position.set(Math.cos(k*2.1)*.007,.035,Math.sin(k*2.1)*.007); f.rotation.y=k*2.1; arrow.add(f); }
  G.userData.arrow=arrow; G.add(arrow); return G; }
function xbowModel(){ const G=new THREE.Group(); const st=M(new THREE.BoxGeometry(.04,.5,.045),toon(0xffffff,WOODT)); st.position.y=.12; G.add(st);
  const pts=[]; for(let k=0;k<=10;k++){ const t=k/10*2-1; pts.push(V3(t*.2,.34-Math.abs(t)*Math.abs(t)*.06,-.0)); } const prod=M(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),16,.009,6),toon(IRON)); G.add(prod);
  const str=new THREE.Group(); G.add(str); for(let k=0;k<2;k++){ str.add(new THREE.Mesh(cyl(.0018,.0018,1,4),new THREE.MeshBasicMaterial({color:0xe0d8c0}))); } G.userData.str=str;
  const bolt=new THREE.Group(); const sh=M(cyl(.0045,.0045,.28,5),toon(0xa07a4a),.0014); sh.position.y=.14; bolt.add(sh); const hd=M(new THREE.ConeGeometry(.009,.03,4),toon(STEEL),.0014); hd.position.y=.295; bolt.add(hd); bolt.position.set(0,.06,-.03); G.add(bolt); G.userData.bolt=bolt; return G; }
function shieldModel(Wr){ const G=new THREE.Group(), k=Wr.kind||'round', c=new THREE.Color(Wr.col||'#7a5a3a'), metal=/iron|steel|ferro|aço/.test(Wr.mat||'');
  let g, sz=.2;
  if(k==='buckler'||k==='round'){ const r=k==='buckler'?.13:.19; g=cyl(r,r,.018,16); g.rotateX(Math.PI/2); sz=r; }
  else { const P=k==='kite'?[-.15,.2, .15,.2, .15,.02, 0,-.3, -.15,.02]:k==='tower'?[-.15,.26, .15,.26, .15,-.26, -.15,-.26]:[-.16,.19, .16,.19, .16,-.02, .09,-.15, 0,-.22, -.09,-.15, -.16,-.02]; g=extrude(P,.014,.004); }
  // face levemente abaulada (dá degradê de luz) + borda escura mais larga atrás + textura de tábuas/metal
  const bend=gg=>{ const p=gg.attributes.position; for(let i=0;i<p.count;i++){ const x=p.getX(i), y=p.getY(i); p.setZ(i,p.getZ(i)-(x*x+y*y*.3)*1.6); } gg.computeVertexNormals(); return gg; };
  const tx=ctex(32,32,(q,w,h)=>{ const base=c.clone(); for(let y=0;y<h;y++) for(let x=0;x<w;x++){ const n=((x*7+y*13)%9)/9, plank=metal?0:((x>>3)%2)*.06; const f=.88+n*.12-plank; q.fillStyle='#'+base.clone().multiplyScalar(f).getHexString(); q.fillRect(x,y,1,1); }
    if(!metal){ q.fillStyle='rgba(0,0,0,.25)'; for(let x=8;x<w;x+=8) q.fillRect(x,0,1,h); } });
  if(g.attributes.uv){ const p=g.attributes.position, uv=g.attributes.uv; for(let i=0;i<p.count;i++) uv.setXY(i,p.getX(i)*2.5+.5,p.getY(i)*2.5+.5); }
  const face=M(bend(g),toon(0xffffff,tx)); G.add(face);
  const rimG=bend(g.clone()); rimG.scale(1.07,1.07,1); rimG.translate(0,0,-.006); const rimM=M(rimG,toon(metal||k!=='cross'?0x4a4e56:0x8a6a2a),0); G.add(rimM);
  const boss=M(new THREE.SphereGeometry(.035,10,6,0,Math.PI*2,0,Math.PI/2),toon(0xb8bec8)); boss.rotation.x=Math.PI/2; boss.position.z=.008; boss.scale.set(1,.6,1); if(k!=='tower'&&k!=='kite') G.add(boss);
  if(k==='cross'||/crusader|cruz/.test(Wr.name||'')){ const cc=new THREE.Color(c).getHSL({}).l>.5?0xb0201a:0xf0e8d8; const v=M(new THREE.BoxGeometry(.04,.3,.004),toon(cc),0), h=M(new THREE.BoxGeometry(.24,.04,.004),toon(cc),0); v.position.set(0,-.01,.012); h.position.set(0,.06,.012); for(const q of [v,h]){ q.geometry.translate(0,0,0); } G.add(v,h); boss.visible=false; }
  return G; }
function kind(id){ const W=WEAPONS[id]||{}; if(!WEAPONS[id]||id==='fists') return 'fists';
  if(/bow$/.test(id)&&!/crossbow/.test(id)||id==='shortbow'||id==='composite_bow') return 'bow'; if(/crossbow|arbalest|pistol|shotgun|rifle/.test(id)) return 'xbow';
  if(W.spell||/staff|scepter|crook/.test(id)) return id==='wand'?'wand':'staff'; if(id==='wand') return 'wand';
  if(/spear|pike|javelin|lance|war_fork/.test(id)) return 'spear'; if(/halberd|scythe|bardiche|glaive/.test(id)) return 'pole';
  if(/dagger|knife|kris|scissors|lockpick|scribe_pen/.test(id)) return 'dagger'; if(id==='rapier') return 'rapier'; if(id==='pickaxe') return 'pick';
  if(id==='fishing_pole') return 'rod'; if(id==='shovel') return 'shovel'; if(id==='saw') return 'saw';
  if(W.skill==='machados'||/axe|hatchet|cleaver/.test(id)) return 'axe'; if(W.skill==='macas'||/hammer|maul|mace|club|bat|pipe|crowbar|morning|flail|tongs|tinker|mortar|lute/.test(id)) return 'mace'; return 'sword'; }
function rod(){ const G=new THREE.Group(); G.add(haft(1.1,.008,-.12)); G.add(grip(.12,.012,-.08)); const reel=M(cyl(.02,.02,.016,10),toon(IRON)); reel.rotation.z=Math.PI/2; reel.position.set(.02,.06,0); G.add(reel);
  const line=new THREE.Mesh(cyl(.0012,.0012,.5,3),new THREE.MeshBasicMaterial({color:0xd8d8d0})); line.position.set(0,.98,0); line.position.y=1.0-.25; line.rotation.z=.05; G.add(line); return G; }
function shovel(){ const G=new THREE.Group(); G.add(haft(.8,.012,-.1)); G.add(grip(.1,.014,-.06)); const b=M(extrude([-.06,0, .06,0, .065,.12, 0,.17, -.065,.12],.006,.002),toon(IRON)); b.position.y=.7; G.add(b); return G; }
function saw(){ const G=new THREE.Group(); const h=M(new THREE.BoxGeometry(.03,.1,.03),toon(0xffffff,WOODT)); G.add(h); const pts=[-.02,.05, .02,.05, .03,.42]; for(let k=0;k<12;k++){ pts.push(-.01-(k%2)*.012, .42-k*.031); } const b=M(extrude([.018,.05, .03,.44, -.035,.44, -.03,.05],.003,.001),toon(STEEL)); G.add(b); return G; }
function weaponModel(id,k){ const W=WEAPONS[id]||{};
  switch(k){ case 'sword': return sword(id,W); case 'dagger': return dagger(); case 'rapier': return rapier(W); case 'axe': return axe(id,W); case 'mace': return mace(id,W);
    case 'spear': case 'pole': return polearm(id,W); case 'staff': case 'wand': return staff(id,W); case 'pick': return pickaxe(); case 'bow': return bowModel(id==='longbow'||id==='composite_bow'); case 'xbow': return xbowModel(); case 'rod': return rod(); case 'shovel': return shovel(); case 'saw': return saw(); }
  return new THREE.Group(); }
// ---------- cena da arma ----------
let prevSG=null, vScene, vCam, key, rim, amb, RH, LH, RA, LA, WG=null, SG=null, built='', ok=false;
function init(){ if(vScene) return; vScene=new THREE.Scene(); vCam=new THREE.PerspectiveCamera(52,16/9,.01,5);
  amb=new THREE.AmbientLight(0xffffff,.45); key=new THREE.DirectionalLight(0xfff0dc,.9); key.position.set(-.5,1,.7); rim=new THREE.DirectionalLight(0xa0c0ff,.35); rim.position.set(1,.3,-1); vScene.add(amb,key,rim); }
function colors(){ const L=player.look||{}, gi=player.gi||{}, Wk=sl=>{ const k=gi[sl]&&typeof drawKey==='function'?drawKey(gi[sl]):null; return k&&WEAR[k]; };
  const hands=Wk('hands'), arms=Wk('arms'), body=player.equip&&player.equip.body&&WEAR[player.equip.body], shield=Wk('shield');
  const iron=w=>w&&/iron|steel|ferro|aço|chain|plate|malha|placa/.test((w.mat||'')+(w.name||''));
  return {skin:L.skin||'#e0b48e', glove:hands?hands.col:null, gmetal:iron(hands), sleeve:(arms&&arms.col)||(body&&body.col)||L.jacket||'#5a4632', bracer:!arms||!iron(arms), shield}; }
function rebuild(){ const k=kind(player.weapon), c=colors(), sig=[player.weapon,c.skin,c.glove,c.sleeve,c.shield&&c.shield.kind,c.shield&&c.shield.col,!!gathering&&gathering.kind].join('|'); if(sig===built) return; built=sig;
  for(const o of [RH,LH,RA,LA]) if(o) vScene.remove(o); RH=makeHand(c.skin,c.glove,c.gmetal); LH=makeHand(c.skin,c.glove,c.gmetal); LH.scale.x=-1; RA=makeArm(c.sleeve,c.bracer); LA=makeArm(c.sleeve,c.bracer); vScene.add(RH,LH,RA,LA);
  const tool=gathering?(gathering.kind==='tree'?'hatchet':'pickaxe'):null, tk=tool?kind(tool):k;
  WG=weaponModel(tool||player.weapon,tk); WG.userData.k=tk; RH.add(WG); if(tk==='fists') WG.visible=false;
  SG=c.shield&&tk!=='bow'&&tk!=='xbow'&&tk!=='spear'&&tk!=='pole'&&tk!=='staff'?shieldModel(c.shield):null; if(SG){ vScene.add(SG); SG.scale.setScalar(.62); } if(prevSG&&prevSG!==SG) vScene.remove(prevSG); prevSG=SG; }
// ---------- poses e animações ----------
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2, out=t=>1-Math.pow(1-t,3), L=(a,b,t)=>a+(b-a)*t;
const lp=(A,B,t)=>A.map((v,i)=>L(v,B[i],t));
function keys(K,p){ for(let i=1;i<K.length;i++) if(p<=K[i][0]){ const [t0,A]=K[i-1], [t1,B]=K[i]; return lp(A,B,(i===K.length-1?out:ease)((p-t0)/(t1-t0))); } return K[K.length-1][1]; }
const IDLE={ rod:[.2,-.14,-.42,-.55,-.2,.3], shovel:[.2,-.15,-.42,-.3,-.2,.3], saw:[.2,-.15,-.42,-.9,-.3,.4], sword:[.2,-0.14,-.42,-.42,-.3,.32], dagger:[.19,-0.13,-.38,-.8,-.4,.4], rapier:[.18,-0.14,-.4,-.75,-.3,.35], axe:[.2,-0.17,-.44,-.62,-.25,.42], mace:[.2,-0.17,-.44,-.62,-.25,.42], pick:[.2,-0.17,-.44,-.62,-.25,.42],
  spear:[.17,-0.13,-.34,-1.32,0,.12], pole:[.2,-0.11,-.36,-.6,-.2,.5], staff:[.2,-0.16,-.46,-.5,-.3,.2], wand:[.2,-0.13,-.4,-.6,-.2,.25], fists:[.16,-0.13,-.38,-1.35,0,.25], bow:[-.06,-0.01,-.48,0,.2,-.18], xbow:[.08,-0.13,-.36,-1.52,0,0] };
function attackPose(k,p,alt){ const I=IDLE[k];
  if(k==='sword'||k==='rapier'&&false){ return alt?keys([[0,I],[.2,[-.1,-.08,-.44,-1.25,.1,1.45]],[.46,[.34,-.17,-.42,-1.25,0,-1.35]],[1,I]],p):keys([[0,I],[.22,[.33,-.04,-.38,-.05,-.3,-.6]],[.46,[-.2,-.24,-.46,-1.3,.25,1.4]],[1,I]],p); }
  if(k==='axe'||k==='mace'||k==='pick'||k==='shovel'||k==='rod'){ return keys([[0,I],[.3,[.15,.05,-.38,.3,-.1,.08]],[.52,[.03,-.22,-.5,-1.4,0,.12]],[1,I]],p); }
  if(k==='dagger'||k==='rapier'||k==='saw'){ return keys([[0,I],[.18,[.22,-.22,-.3,-1.35,-.2,.2]],[.4,[.04,-.13,-.66,-1.5,0,.05]],[1,I]],p); }
  if(k==='spear'){ return keys([[0,I],[.2,[.2,-.22,-.24,-1.4,0,.12]],[.42,[.06,-.15,-.78,-1.5,0,.04]],[1,I]],p); }
  if(k==='pole'){ return keys([[0,I],[.24,[.34,-.06,-.36,-.9,-.2,-.9]],[.5,[-.24,-.24,-.48,-1.2,.2,1.3]],[1,I]],p); }
  if(k==='staff'||k==='wand'){ return keys([[0,I],[.25,[.16,-.12,-.36,-.4,-.2,.2]],[.45,[.06,-.1,-.62,-1.2,0,.05]],[1,I]],p); }
  return I; }
let atk=null, lastCd=0, alt=0, lastW='', swapT=0, swayX=0, swayY=0, lastYaw=null, lastPitch=0, hurtT=0, lastHp=null, cast=null, lastCast=0, punchSide=1;
function update(now,dt){ const cd=player.atkCd||0; if(cd>lastCd+.05){ const Wp=WEAPONS[player.weapon]||{}; alt^=1; punchSide=-punchSide; atk={t0:now,dur:Math.max(300,Math.min(620,(Wp.cd||.5)*950))}; } lastCd=cd;
  const cc=player.castCd||0; if(cc>lastCast+.05) cast={t0:now,dur:600}; lastCast=cc;
  if(atk&&now-atk.t0>atk.dur) atk=null; if(cast&&now-cast.t0>cast.dur) cast=null;
  if(lastHp!=null&&player.hp<lastHp-.5) hurtT=now; lastHp=player.hp;
  const y=typeof fpYaw==='function'?fpYaw():0; if(lastYaw!=null){ let d=y-lastYaw; d=Math.atan2(Math.sin(d),Math.cos(d)); swayX=L(swayX,Math.max(-.06,Math.min(.06,-d*1.6)),.18); } lastYaw=y; swayX*=.9; }
const _w=V3(0,0,0), _e=V3(0,0,0);
function setPose(H,P){ H.position.set(P[0],P[1],P[2]); H.rotation.set(P[3],P[4],P[5],'YXZ'); }
function frame(now){ const id=player.weapon; if(id!==lastW){ lastW=id; swapT=now; atk=null; } rebuild(); const k=WG.userData.k; update(now);
  const walk=player.moving?Math.sin(player.phase||now/130):0, breath=Math.sin(now/900)*.004, bx=walk*.012+swayX, by=-Math.abs(walk)*.012+breath, drop=(1-out(Math.min(1,(now-swapT)/320)))*.25;
  let P=IDLE[k].slice(), PL=null, curlR=1, curlL=1, p=atk?(now-atk.t0)/atk.dur:-1;
  // ferramentas: golpes repetidos enquanto corta/minera
  if(gathering){ const per=700, q=(now%per)/per; P=attackPose(k,q,0); }
  else if(p>=0&&k!=='fists'&&k!=='bow'&&k!=='xbow') P=attackPose(k,p,atk&&!!(alt));
  // mão esquerda: escudo, segurar a haste, punho ou arco
  if(k==='fists'){ const R0=[.15,-.12,-.36,-.25,.1,1.45], L0=[-.15,-.12,-.36,-.25,-.1,-1.45];
    const pr=(side)=>{ if(p<0||(punchSide!==side)) return 0; return p<.32?out(p/.32):1-ease((p-.32)/.68); };
    const fr=pr(1), fl=pr(-1); P=lp(R0,[.05,-.06,-.62,-.05,0,1.57],fr); PL=lp(L0,[-.05,-.06,-.62,-.05,0,-1.57],fl); }
  else if(k==='bow'){ let pull=1; if(p>=0) pull=p<.14?0:out((p-.14)/.86); P=[.0,-.1,-.48,0,.2,-.18]; PL=null;
    // o arco fica na mão esquerda (desenhado nela); a direita puxa a corda
    PL=[-.07,-.09,-.5,0,.25,-.16]; const nock=[L(-.04,.12,pull),L(-.09,-.06,pull),L(-.48,-.3,pull)]; P=[nock[0]+.012,nock[1],nock[2],-.2,-1.2,1.3]; curlR=.55; WG.userData.pull=pull; }
  else if(k==='xbow'){ let rec=0; if(p>=0) rec=p<.12?out(p/.12):Math.max(0,1-(p-.12)*2.2); P=[.07,-.12+rec*.02,-.34+rec*.06,-1.45+rec*.25,0,0]; PL=[-.02,-.14+rec*.02,-.5+rec*.06,-1.45,0,.3]; WG.userData.loaded=p<0||p>.75; }
  else if(k==='spear'||k==='pole'||k==='staff'){ PL='weapon'; }
  else if(SG){ PL=[-.3,-.17,-.52,0,.15,.18]; if(p>=0) PL=lp(PL,[-.32,-.3,-.4,0,.3,.25],Math.sin(Math.min(1,p)*Math.PI)); if(now-hurtT<450){ const h=Math.sin((now-hurtT)/450*Math.PI); PL=lp(PL,[-.14,-.12,-.38,0,-.1,.05],h); } curlL=.85; }
  // magia: mão esquerda aberta sobe com luz
  let castP=cast?(now-cast.t0)/cast.dur:-1;
  if(castP>=0&&(PL===null||SG)&&k!=='bow'&&k!=='xbow'&&k!=='fists'){ const f=castP<.3?out(castP/.3):castP<.62?1:1-ease((castP-.62)/.38); PL=lp([-.3,-.42,-.42,0,-.2,.4],[-.12,-.1,-.44,-1.3,.3,.1],f); curlL=L(1,.08,f); if(SG) SG.visible=f<.2; }
  else if(SG) SG.visible=true;
  for(const Q of [P]) { Q[0]+=bx; Q[1]+=by-drop; }
  setPose(RH,P); setCurl(RH,curlR);
  if(PL==='weapon'){ // segunda mão mais abaixo na haste
    RH.updateMatrixWorld(true); const yOff=k==='staff'?-.28:-.32; WG.localToWorld(_w.set(0,yOff,0)); LH.position.copy(_w); LH.quaternion.copy(RH.quaternion); LH.visible=true; setCurl(LH,1); }
  else if(PL){ PL[0]+=bx; PL[1]+=by-drop; setPose(LH,PL); setCurl(LH,curlL); LH.visible=true; }
  else LH.visible=false;
  if(SG&&SG.visible&&!(cast&&castP>=0)){ LH.visible=false; LA.visible=false; }
  if(SG){ SG.position.copy(LH.position).add(_w.set(-.02,.03,-.03)); SG.rotation.set(-.08,.62+(LH.position.x+.29)*1.5,.1); }
  // arco: corpo na mão esquerda; corda e flecha até a mão direita
  if(k==='bow'){ if(WG.parent!==LH){ LH.add(WG); } WG.position.set(0,0,0); WG.rotation.set(0,0,0); const S=WG.userData.str; LH.updateMatrixWorld(true); RH.updateMatrixWorld(true);
    const H2=WG.userData.H/2, tipT=WG.localToWorld(V3(.08,H2,0)), tipB=WG.localToWorld(V3(.08,-H2,0)), nk=RH.localToWorld(V3(-.012,0,-.01)); WG.worldToLocal(nk); WG.worldToLocal(tipT); WG.worldToLocal(tipB);
    const seg=(m,a,b)=>{ const d=b.clone().sub(a), l=d.length(); m.position.copy(a).add(b).multiplyScalar(.5); m.scale.set(1,l,1); m.quaternion.setFromUnitVectors(_up,d.normalize()); };
    seg(S.children[0],tipT,nk); seg(S.children[1],tipB,nk); const ar=WG.userData.arrow; const show=(WG.userData.pull||0)>.25||p<0; ar.visible=show;
    if(show){ const tgt=V3(-.03,0,-.02), d=tgt.clone().sub(nk); ar.position.copy(nk); ar.quaternion.setFromUnitVectors(_up,d.normalize()); } }
  else if(WG.parent!==RH){ RH.add(WG); }
  if(k==='xbow'){ const S=WG.userData.str, ld=WG.userData.loaded, a=V3(-.2,.29,0), b=V3(.2,.29,0), n=V3(0,ld?.05:.32,0); const seg=(m,u,v)=>{ const d=v.clone().sub(u), l=d.length(); m.position.copy(u).add(v).multiplyScalar(.5); m.scale.set(1,l,1); m.quaternion.setFromUnitVectors(_up,d.normalize()); };
    seg(S.children[0],a,n); seg(S.children[1],b,n); WG.userData.bolt.visible=ld; }
  if(WG.userData.flail){ WG.userData.flail.rotation.z=Math.sin(now/170)*.35+(p>=0?Math.sin(p*Math.PI)*1.6:0); }
  if(WG.userData.glow){ const s=1+Math.sin(now/160)*.12; WG.userData.glow.scale.setScalar(s); }
  // antebraços até cotovelos fora da tela
  RH.updateMatrixWorld(true); RH.localToWorld(_w.set(.014,-.004,.05)); if(k==='bow') _e.set(.42,-.3,-.22); else _e.set(.3+P[0]*.5,-.5,-.16); aimArm(RA,_w,_e);
  if(LH.visible){ LH.updateMatrixWorld(true); LH.localToWorld(_w.set(.014,-.004,.05)); _e.set(-.3+LH.position.x*.5,-.5,-.16); aimArm(LA,_w,_e); LA.visible=true; } else LA.visible=false;
  return castP; }
// luz da magia na mão esquerda
let orb=null; function orbFor(castP,now){ if(!orb){ orb=new THREE.Mesh(new THREE.SphereGeometry(.03,10,8),new THREE.MeshBasicMaterial({color:0xffe08a,transparent:true,opacity:.95})); const halo=new THREE.Mesh(new THREE.SphereGeometry(.05,10,8),new THREE.MeshBasicMaterial({color:0xffb040,transparent:true,opacity:.35})); orb.add(halo); vScene.add(orb); }
  orb.visible=castP>=0; if(!orb.visible) return; LH.updateMatrixWorld(true); LH.localToWorld(orb.position.set(-.01,.07,-.02)); const f=castP<.3?castP/.3:castP<.62?1:1-(castP-.62)/.38; orb.scale.setScalar(.4+f*.8+Math.sin(now/50)*.05); }
// ---------- ligação com o renderizador da câmera em 1ª pessoa ----------
window.fpView3DDbg=()=>({atk,cast});
window.fpView3D=function(R,now,light,aspect){ try{ init(); vCam.aspect=aspect; vCam.updateProjectionMatrix();
    const b=Math.max(.3,Math.min(1.1,light.b)); amb.intensity=.2+b*.16; key.intensity=.28+b*.5; key.color.setRGB(1,1-.18*light.warm,1-.4*light.warm); rim.intensity=.08+b*.18;
    const castP=frame(now); orbFor(castP,now);
    const ac=R.autoClear; R.autoClear=false; R.clearDepth(); R.render(vScene,vCam); R.autoClear=ac; ok=true; return true; }
  catch(e){ console.error(e); window.fpView3D=null; return false; } };
})();

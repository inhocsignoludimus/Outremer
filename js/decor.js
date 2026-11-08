'use strict';
// =====================================================================
// AFTER LIGHT — furnishing pass. After a building is stretched to world
// scale, every room gets the furniture you'd expect: kitchens, bedrooms,
// bathrooms, living rooms, offices. Plus yard and forest dressing.
// =====================================================================
const DECOR_SOLID = new Set(['chair','armchair','ctable','bookcase','nightstand','wardrobe','stove','sink','bathtub','plant','flamp','filing','cooler','pallet','drum','mailbox','bin','hedge','bush_b','washer']);
function decorate(b){
  const rnd = mulberry32(b.id*31337+7), pick=a=>a[Math.floor(rnd()*a.length)];
  const inR=(x,y)=>x>b.x&&y>b.y&&x<b.x+b.w-1&&y<b.y+b.h-1;
  const wallT=t=>t===TL.WALL||t===TL.WINDOW||t===TL.FENCE;
  const seen=new Uint8Array(b.w*b.h), L=(x,y)=>(y-b.y)*b.w+(x-b.x);
  const rooms=[];
  for(let y=b.y+1;y<b.y+b.h-1;y++) for(let x=b.x+1;x<b.x+b.w-1;x++){
    const t=map[idx(x,y)]; if(wallT(t)||seen[L(x,y)]) continue;
    const cells=[], q=[[x,y]]; seen[L(x,y)]=1;
    while(q.length){ const [cx,cy]=q.pop(); cells.push([cx,cy]);
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx=cx+dx, ny=cy+dy; if(!inR(nx,ny)||seen[L(nx,ny)]) continue; const nt=map[idx(nx,ny)];
        if(nt!==t) continue; seen[L(nx,ny)]=1; q.push([nx,ny]); } }
    rooms.push({t, cells});
  }
  const free=(x,y,w,h)=>{ for(let yy=y;yy<y+h;yy++) for(let xx=x;xx<x+w;xx++){ if(!inR(xx,yy)) return false; const i=idx(xx,yy);
      if(objGrid[i]||reserved[i]||doors.has(i)||wallT(map[i])) return false;
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) if(doors.has(idx(xx+dx,yy+dy))) return false; } return true; };
  const nearWall=(x,y)=>wallT(map[idx(x-1,y)])||wallT(map[idx(x+1,y)])||wallT(map[idx(x,y-1)])||wallT(map[idx(x,y+1)]);
  const wallN=(x,y)=>wallT(map[idx(x,y-1)]) && map[idx(x,y-1)]!==TL.WINDOW;
  const wallDist=(x,y)=>{ for(let r=1;r<6;r++) for(const [dx,dy] of [[r,0],[-r,0],[0,r],[0,-r]]) if(wallT(map[idx(x+dx,y+dy)])) return r; return 6; };
  const has=(cells,type)=>cells.some(([x,y])=>{ const o=objGrid[idx(x,y)]; return o&&o.type===type; });
  const put=(room,type,w,h,where,opt={})=>{
    if(type!=='rug'){ let occ=0; for(const [x,y] of room.cells){ const o=objGrid[idx(x,y)]; if(o&&o.solid) occ++; } if(occ+w*h > room.cells.length*0.34) return null; }
    const cand=room.cells.filter(([x,y])=> where==='wall' ? nearWall(x,y) && (!opt.north||wallN(x,y)) : where==='center' ? wallDist(x,y)>=2 : true);
    for(let k=0;k<40 && cand.length;k++){ const [x,y]=cand[Math.floor(rnd()*cand.length)];
      if(!free(x,y,w,h)) continue;
      if(where==='wall' && w*h>1 && !(nearWall(x,y)||nearWall(x+w-1,y+h-1))) continue;
      return addObj({type, x, y, w, h, solid: type!=='rug', b:b.id, container:opt.c||null, kind:opt.kind, v:Math.floor(rnd()*4), sortY: type==='rug' ? y*T-40 : undefined});
    }
    return null;
  };
  const home = ['house_s','house_m','mansion','apartment'].includes(b.t), rich=b.t==='mansion';
  for(const room of rooms){
    const n=room.cells.length; if(n<8) continue;
    const scale=Math.max(1,Math.round(n/30));
    if(home){
      if(room.t===TL.KTILE){
        put(room,'keg',1,1,'wall',{north:true});
        
        for(let k=0;k<scale+1;k++) put(room,'cabinet',1,1,'wall',{north:true,c:rich?'cabinet_rich':'cabinet'});
        const tb=put(room,'table',1,1,'center'); if(tb){ for(const [dx,dy] of [[-1,0],[1,0]]) if(free(tb.x+dx,tb.y+dy,1,1)) addObj({type:'chair',x:tb.x+dx,y:tb.y+dy,solid:true,b:b.id,v:dx>0?1:0}); }
        put(room,'hay',1,1,'wall');
      } else if(room.t===TL.CARPET){
        if(!has(room.cells,'bed')) put(room,'bed',1,2,'wall',{north:true});
        const bed=room.cells.map(([x,y])=>objGrid[idx(x,y)]).find(o=>o&&o.type==='bed');
        if(bed){ for(const dx of [-1,1]) if(free(bed.x+dx,bed.y,1,1)){ addObj({type:'nightstand',x:bed.x+dx,y:bed.y,solid:true,b:b.id,container:rich?'dresser_rich':'desk'}); break; } }
        put(room,'wardrobe',1,1,'wall',{north:true,c:'clothes'});
        put(room,'rug',3,2,'center');
        if(rnd()<.6) put(room,'candle',1,1,'wall');
        if(rnd()<.5) put(room,'plant',1,1,'wall');
        if(rich && rnd()<.7) put(room,'bookcase',1,1,'wall',{north:true,c:'books'});
      } else if(room.t===TL.LINO && n<60){
        if(!has(room.cells,'toilet')) put(room,'toilet',1,1,'wall');
        put(room,'bathtub',1,2,'wall'); put(room,'sink',1,1,'wall',{north:true});
        if(!has(room.cells,'cabinet')) put(room,'cabinet',1,1,'wall',{c:'bath'});
        if(rnd()<.5) put(room,'washer',1,1,'wall');
      } else {
        if(!has(room.cells,'bench')) put(room,'bench',2,1,'wall');
        for(let k=0;k<scale;k++) put(room,'chair',1,1,'wall');
         put(room,'rug',4,3,'center');
        for(let k=0;k<scale;k++) put(room,'bookcase',1,1,'wall',{north:true,c:'books'});
        for(let k=0;k<scale+1;k++) put(room,'plant',1,1,'wall');
        put(room,'candle',1,1,'wall');
      }
    } else if(b.t==='office'||b.t==='police'||b.t==='clinic'||b.t==='hospital'){
      for(let k=0;k<scale;k++){ put(room,'filing',1,1,'wall',{north:true,c:'desk'}); put(room,'plant',1,1,'wall'); }
      for(const o of objs.filter(o=>o.b===b.id&&o.type==='desk')) if(free(o.x,o.y+1,1,1)) addObj({type:'chair',x:o.x,y:o.y+1,solid:true,b:b.id,v:2});
      if(rnd()<.6) put(room,'cooler',1,1,'wall',{c:'fridge_drinks'});
      for(let k=0;k<scale-1;k++) put(room,'chair',1,1,'wall');
    } else if(b.t==='warehouse'||b.t==='firestation'){
      for(let k=0;k<scale*2;k++) put(room,rnd()<.5?'pallet':'drum',1,1,'wall',{c:rnd()<.4?'warehouse':null});
    } else if(b.t==='church'){
      put(room,'plant',1,1,'wall'); put(room,'plant',1,1,'wall'); put(room,'rug',2,6,'center');
    } else {
      if(rnd()<.6) put(room,'candle',1,1,'wall');
    }
  }
  // yard: hedges and a mailbox for homes
  if(home && b.t!=='apartment'){
    let hedges=0;
    for(let k=0;k<40 && hedges<4;k++){
      const side=Math.floor(rnd()*4); let x,y;
      if(side===0){ x=b.x+1+Math.floor(rnd()*(b.w-2)); y=b.y-1; } else if(side===1){ x=b.x+1+Math.floor(rnd()*(b.w-2)); y=b.y+b.h; }
      else if(side===2){ x=b.x-1; y=b.y+1+Math.floor(rnd()*(b.h-2)); } else { x=b.x+b.w; y=b.y+1+Math.floor(rnd()*(b.h-2)); }
      if(!inB(x,y)) continue; const i=idx(x,y), t=map[i];
      if((t===TL.GRASS||t===TL.PARK) && !objGrid[i] && !reserved[i]){ addObj({type:'hedge',x,y,solid:true,v:Math.floor(rnd()*3)}); hedges++; }
    }
    for(const [dx,dy] of (b.mailbox?b.doors:[])){ // (sem caixa de correio na Idade Média)
      const ox = dx===b.x?-1:dx===b.x+b.w-1?1:0, oy = dy===b.y?-1:dy===b.y+b.h-1?1:0; if(!ox&&!oy) continue;
      for(let k=2;k<40;k++){ const x=dx+ox*k, y=dy+oy*k; if(!inB(x,y)) break; const t=map[idx(x,y)]; if(t!==TL.DIRT){
          const mx=x-ox+(oy?1:0), my=y-oy+(ox?1:0); if(inB(mx,my) && (map[idx(mx,my)]===TL.GRASS) && !objGrid[idx(mx,my)]) addObj({type:'mailbox',x:mx,y:my,solid:true,container:'mail'}); break; } }
      break;
    }
  }
}
// forest floor: undergrowth, berry bushes, fallen logs
function dressForest(){
  for(let y=2;y<H-2;y+=1) for(let x=2;x<W-2;x+=1){
    const i=idx(x,y); if(map[i]!==TL.FOREST || objGrid[i] || reserved[i]) continue;
    const r=th(x,y,131);
    if(r<0.045) addObj({type:'brush',x,y,solid:false,v:Math.floor(th(x,y,132)*3),sortY:y*T+4});
    else if(r<0.052) addObj({type:'berry',x,y,solid:true,container:'berries',v:0});
    else if(r<0.0545 && !objGrid[i+1] && map[i+1]===TL.FOREST) addObj({type:'log',x,y,w:2,solid:true,container:'deadwood'});
  }
}
function drawDecor(g,o,sx,sy,now){
  const P=(a,b,w,h,c)=>{g.fillStyle=c;g.fillRect(sx+a,sy+b,w,h);};
  const fab=['#5a4a6a','#6a4a3a','#3e5a4e','#7a6a4a'][o.v||0];
  switch(o.type){
    case 'chair': P(4,-3,8,5,'#4a3424'); P(4,-3,8,1,'#5e432e'); P(3,2,10,6,'#6a4a30'); P(3,2,10,1,'#7e5a3c'); P(4,8,1,5,'#3a281a'); P(11,8,1,5,'#3a281a'); break;
    case 'armchair': P(1,-3,14,6,shade(fab,.8)); P(1,3,14,10,fab); P(1,3,3,10,shade(fab,.8)); P(12,3,3,10,shade(fab,.8)); P(4,5,8,6,shade(fab,1.15)); break;
    case 'ctable': P(2,3,28,8,'#5c4230'); P(2,3,28,1,'#76563c'); P(3,11,2,3,'#3b291b'); P(27,11,2,3,'#3b291b'); P(8,5,6,3,'#c8c0b0'); P(18,5,3,2,'#7a3a2a'); break;
    case 'bookcase': { P(1,-10,14,24,'#4a3020'); P(1,-10,14,1,'#5e3e2a'); for(let r=0;r<3;r++){ P(2,-8+r*7,12,6,'#2a1c12');
        const n=o.searched?2:6; for(let k=0;k<n;k++) P(2+k*2,-8+r*7+Math.floor(th(o.x+k,o.y+r,5)*2),2,6-Math.floor(th(o.x+k,o.y+r,5)*2),['#7a3a3a','#3a5a7a','#5a7a3a','#7a6a3a','#5a3a6a'][Math.floor(th(o.x,o.y+r,k)*5)]); } break; }
    case 'nightstand': P(2,3,12,11,'#5a3a26'); P(2,3,12,1,'#6e4a32'); P(3,7,10,1,'#3a2618'); P(7,9,2,1,'#c8a050'); P(5,-3,6,3,'#e0d0a0'); P(7,0,2,3,'#3a3a3a'); if(o.searched) P(3,8,10,5,'#2a1a10'); break;
    case 'wardrobe': P(1,-12,14,26,'#5a3a26'); P(1,-12,14,2,'#6e4a32'); P(7,-10,1,23,'#3a2618'); P(5,0,1,2,'#c8a050'); P(9,0,1,2,'#c8a050'); if(o.searched) P(8,-10,6,23,'#1e130b'); break;
    case 'stove': P(1,-3,14,17,'#c8c6bc'); P(1,-3,14,1,'#e0ded4'); for(const [a,b] of [[3,-1],[9,-1],[3,3],[9,3]]){ P(a,b,4,3,'#2a2a2a'); P(a+1,b+1,2,1,'#4a4a4a'); } P(2,8,12,5,'#3a3a3a'); P(3,9,10,1,'#5a5a5a'); break;
    case 'sink': P(0,-2,16,16,'#8a8478'); P(0,-2,16,1,'#a8a294'); P(3,0,10,6,'#b8c4c8'); P(4,1,8,4,'#7a8a90'); P(7,-2,2,2,'#c8c8c8'); P(1,7,14,6,'#6a6458'); break;
    case 'bathtub': P(1,0,14,30,'#e0ddd4'); P(1,0,14,1,'#f4f2ea'); P(3,3,10,24,'#a8c0c8'); P(4,4,3,6,'#c8dce0'); P(7,1,2,2,'#9a9a9a'); break;
    case 'washer': P(1,-3,14,17,'#d8d6ce'); P(1,-3,14,1,'#f0eee6'); P(4,2,8,8,'#3a3e42'); P(5,3,6,6,'#5a6a74'); P(3,-1,4,1,'#5a5a5a'); break;
    case 'plant': { P(4,8,8,6,'#7a4a2a'); P(4,8,8,1,'#9a6a40'); const lc=o.v===3?['#6a5a2a','#5a4a24']:['#3e5a2e','#2e4622'];
      for(const [a,b,w,h] of [[6,-4,4,12],[2,0,5,5],[9,-1,5,5],[4,-7,3,5],[9,-6,3,5]]) P(a,b,w,h,lc[(a+b)&1]); P(7,-6,1,3,'#5a7a3a'); break; }
    case 'flamp': P(7,-4,2,17,'#3a3a3a'); P(5,12,6,2,'#2a2a2a'); P(3,-10,10,6,'#d8c8a0'); P(4,-11,8,1,'#e8dcc0'); break;
    case 'filing': P(2,-6,12,20,'#6a7078'); P(2,-6,12,1,'#8a9098'); for(let k=0;k<3;k++){ P(3,-4+k*6,10,5,'#5a6068'); P(7,-2+k*6,2,1,'#c8c8c8'); } if(o.searched) P(3,2,10,5,'#1a1e22'); break;
    case 'cooler': P(4,4,8,10,'#d8d6ce'); P(5,-6,6,10,'#6aa0c8'); P(5,-6,6,1,'#9ac8e8'); P(6,6,4,2,'#3a6a9a'); break;
    case 'pallet': P(1,4,14,10,'#8a6a40'); for(let k=0;k<4;k++) P(1,5+k*3,14,1,'#5a4226'); P(3,-2,10,7,'#7a6a5a'); P(3,-2,10,1,'#9a8a7a'); break;
    case 'drum': P(3,-1,10,15,'#3a5a7a'); P(3,-1,10,2,'#2a3a4a'); P(3,4,10,1,'#2a4058'); P(3,9,10,1,'#2a4058'); P(4,0,1,13,'#5a7a9a'); break;
    case 'bin': P(4,2,8,12,'#3a4a3a'); P(3,0,10,3,'#4a5a4a'); P(5,4,1,9,'#2a3a2a'); P(10,4,1,9,'#2a3a2a'); break;
    case 'mailbox': P(7,4,2,10,'#4a3424'); P(3,-1,10,6,'#3a4048'); P(3,-1,10,1,'#5a6068'); P(12,-3,1,4,o.searched?'#4a4a4a':'#b8302a'); break;
    case 'hedge': { const c=['#2e4a26','#34522a','#283f22'][o.v||0]; P(0,-2,16,15,c); P(1,-3,14,2,shade(c,1.2)); P(2,-1,4,3,shade(c,1.3)); P(9,2,4,3,shade(c,1.25)); P(0,11,16,2,shade(c,.7)); break; }
    case 'rug': { const c=CARPETS[(o.x+o.y)%CARPETS.length], w=o.w*T, h=o.h*T; P(2,2,w-4,h-4,shade(c,.85)); P(4,4,w-8,h-8,c); P(7,7,w-14,h-14,shade(c,1.15));
      for(let k=4;k<w-4;k+=2){ P(k,1,1,1,'#c8bca8'); P(k,h-2,1,1,'#c8bca8'); } break; }
    case 'brush': { const c=['#3a4a26','#45532c','#334322'][o.v||0]; for(const [a,b,w,h] of [[2,6,4,6],[6,3,4,9],[10,7,4,5],[4,9,8,4]]) P(a,b,w,h,c); P(7,3,2,2,shade(c,1.3)); P(3,7,1,1,shade(c,1.3)); break; }
    case 'berry': { P(1,0,14,13,'#2e4a26'); P(2,-2,12,3,'#3a5a2e'); P(0,11,16,2,'#22361c'); if(!o.searched) for(const [a,b] of [[3,2],[8,1],[11,5],[5,7],[9,9],[2,9]]) P(a,b,2,2,'#7a1a3a'); break; }
    case 'log': P(0,5,32,9,'#5a4028'); P(0,5,32,2,'#6e5232'); P(0,12,32,2,'#3e2c1a'); P(29,5,3,9,'#8a6a44'); P(30,7,1,4,'#6a4a2a'); P(8,6,1,1,'#3a5a2a'); P(17,6,2,1,'#3a5a2a'); break;
    case 'campfire': { P(2,9,12,5,'#4a4440'); P(3,8,10,1,'#5a544e'); P(4,10,8,3,'#2a1c14');
      if(o.lit){ const cols=['#ffe08a','#ffa340','#e0552a','#b8361f']; for(let i=0;i<7;i++){ const fx=4+((i*3+Math.floor(now/70))%8), fh=Math.floor(th(i,Math.floor(now/90),3)*8);
          P(fx,9-fh,2,fh+1,cols[Math.min(3,Math.floor(fh/2))]); } } else { P(5,9,6,2,'#6a4a2a'); P(6,8,1,3,'#3a2a1a'); }
      break; }
    case 'tent': { P(0,-6,32,26,'#3a4a2e'); P(1,-6,30,1,'#4e6040'); for(let k=0;k<16;k++){ P(16-k,-6+k,1,1,'#2a361f'); P(15+k,-6+k,1,1,'#4e6040'); }
      P(12,8,8,12,'#1a1a14'); P(15,8,2,12,'#2a2a20'); P(0,19,32,1,'#22301a'); break; }
    case 'bedroll': P(1,1,14,28,'#5a2a2a'); P(1,1,14,1,'#7a3a3a'); P(2,2,12,6,'#c8b898'); P(1,14,14,1,'#3a1a1a'); break;
    case 'collector': { P(2,2,12,12,'#3a4a5a'); P(2,2,12,2,'#5a6a7a'); P(3,4,10,8,'#22303a'); const f=Math.min(1,(o.water||0)/3); P(3,12-Math.round(8*f),10,Math.round(8*f),'#4a7a9a'); P(0,0,16,2,'#8a8a80'); break; }
    case 'dryrack': P(1,-6,2,20,'#5a4028'); P(13,-6,2,20,'#5a4028'); P(1,-6,14,2,'#6e5232'); if(o.meat) for(let k=0;k<3;k++) P(3+k*4,-4,3,6,'#8a2a22'); break;
  }
}

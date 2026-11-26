// Lote 1 (terreno e natureza): carrega texturas de chão e PNGs de natureza; o iso usa quando prontos.
(function(){
const B='assets/lote1/';
const TEX=['grama','floresta','neve','areia','pantano','pedra','estrada','rua_pedra','agua_rasa','agua_funda'];
const L=window.LOTE1={tex:{},img:{},meta:{},ready:false,errors:[]};
const loadImg=src=>new Promise((res,rej)=>{ const im=new Image(); im.onload=()=>res(im); im.onerror=()=>{ L.errors.push(src); rej(src); }; im.src=src; });
L.floorKey=function(t,biome){ if(biome==='dg') return null;
  switch(t){
    case TL.GRASS: case TL.PARK: case TL.FENCE: return biome==='n'?'neve':biome==='s'?'pantano':biome==='o'?null:'grama';
    case TL.FOREST: return biome==='n'?'neve':biome==='s'?'pantano':'floresta';
    case TL.SAND: case TL.DUNE: return 'areia';
    case TL.SNOW: return 'neve';
    case TL.SWAMP: return 'pantano';
    case TL.RUBBLE: case TL.ROCK: return 'pedra';
    case TL.DIRT: return 'estrada';
    case TL.WALK: return 'rua_pedra';
    case TL.ASPH: return biome==='city'?'rua_pedra':'estrada';
    case TL.WATER: return 'agua_rasa';
    case TL.SEA: return 'agua_funda';
  } return null; };
L.sample=function(k,U,V){ const d=L.tex[k]; const u=((U/4)%1+1)%1, v=((V/4)%1+1)%1; const o=(((v*256)|0)*256+((u*256)|0))*4; return [d[o],d[o+1],d[o+2]]; };
const hsh=(a,b,c)=>{ let h=(a*374761393+b*668265263+(c|0)*2147483647)|0; h=Math.imul(h^(h>>>13),1274126177); return ((h^(h>>>16))>>>0)/4294967295; };
// escolhe o PNG para um objeto de natureza
L.bio=function(x,y,b0){ if(b0==='city'||b0==='dg') return b0; try{ const c=window.cellAt&&cellAt(x,y); if(c&&c.b) return c.b; }catch(e){} return b0; };
L.natKey=function(o,biome){ biome=L.bio(o.x,o.y,biome); const s=(o.x*7+o.y*13)%40, seed=s*97+3, pick=(arr)=>arr[Math.floor(hsh(o.x,o.y,903)*arr.length)%arr.length];
  switch(o.type){
    case 'tree': { const con=biome==='n'||biome==='m'||hsh(seed,1,1)<.3, au=hsh(seed,2,2);
      if(con) return biome==='n'?'pinheiro_neve':'pinheiro';
      if(biome==='o') return 'oliveira';
      return au<.3?'arvore_outono':au<.48?'arvore_dourada':(hsh(seed,3,3)<.5?'arvore_verde_1':'arvore_verde_2'); }
    case 'pine': return biome==='n'?'pinheiro_neve':'pinheiro';
    case 'olive': return 'oliveira';
    case 'deadtree': return biome==='s'?'arvore_pantano':'arvore_seca';
    case 'palm': return 'palmeira';
    case 'cactus': return 'cacto';
    case 'brush': return biome==='o'?'arbusto_deserto':biome==='n'?'arbusto_neve':['arbusto_1','arbusto_2','arbusto_3'][o.v||0];
    case 'berry': return o.searched?'arbusto_1':'arbusto_frutas';
    case 'rock': return {n:'pedra_neve',o:'pedra_deserto',s:'pedra_pantano',c:'pedra_costa',r:'pedra_entulho',dg:'pedra_entulho'}[biome]||'pedra_planicie';
    case 'log': return 'tronco_caido';
  } return null; };
L.rockKey=function(biome,x,y){ biome=L.bio(x,y,biome); return {n:'rochedo_neve',o:'rochedo_deserto',s:'rochedo_pantano'}[biome]||'rochedo_planicie'; };
L.load=async function(){
  try{
    const meta=await (await fetch(B+'meta.json')).json();
    for(const m of meta) L.meta[m.k]=m;
    const cv=document.createElement('canvas'); cv.width=cv.height=256; const g=cv.getContext('2d',{willReadFrequently:true});
    await Promise.all(TEX.map(async k=>{ const im=await loadImg(B+'texturas/'+k+'.png'); L.tex[k]=im; }));
    for(const k of TEX){ g.clearRect(0,0,256,256); g.drawImage(L.tex[k],0,0); L.tex[k]=g.getImageData(0,0,256,256).data; }
    const nat=meta.filter(m=>m.category!=='chao');
    await Promise.all(nat.map(async m=>{ L.img[m.k]=await loadImg(B+'natureza/'+m.k+'.png'); }));
    L.ready=true; console.log('[lote1] pronto:',TEX.length,'texturas,',nat.length,'objetos');
    if(window.isoFlush) isoFlush();
  }catch(e){ console.error('[lote1] falhou',e,L.errors); }
};
if(document.readyState==='complete') L.load(); else window.addEventListener('load',()=>L.load());
})();

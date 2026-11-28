// Origem file:// (WebView Android / Chrome sem --allow-file-access-from-files):
// o origin é "null", então fetch(meta.json) cai no CORS e getImageData em
// imagens file:// estoura SecurityError. Este módulo (1) responde fetch de
// JSON inlined em window.__JSON_ASSETS e (2) troca o src das imagens cujo
// PNG está em window.__FILE_ASSETS por um data: URI (mesmo-origin, sem taint).
(function(){
  if(window.__WV_ORIGIN__) return; window.__WV_ORIGIN__=1;
  function rel(u){
    u=String(u||'');
    u=u.split('#')[0].split('?')[0];
    try{
      const abs=new URL(u, document.baseURI||location.href);
      const p=decodeURIComponent(abs.pathname||'');
      const m=p.match(/\/(assets\/.*)$/);
      if(m) return m[1];
    }catch(e){}
    return u.replace(/^\.\//,'').replace(/^\/+/, '');
  }
  function dataSrc(v){
    const S=window.__FILE_ASSETS; if(!S) return null;
    const p=rel(v); if(!p) return null;
    return S[p]||S['./'+p]||null;
  }
  const proto=HTMLImageElement.prototype;
  const desc=Object.getOwnPropertyDescriptor(proto,'src');
  if(desc&&desc.set){
    Object.defineProperty(proto,'src',{
      configurable:true, enumerable:true,
      get(){ return desc.get.call(this); },
      set(v){ desc.set.call(this, dataSrc(v)||v); }
    });
  }
  const setAttr=proto.setAttribute;
  if(setAttr){
    proto.setAttribute=function(name,val){
      if(String(name).toLowerCase()==='src'){ const d=dataSrc(val); if(d) val=d; }
      return setAttr.call(this,name,val);
    };
  }
  const ofetch=window.fetch.bind(window);
  window.fetch=function(input,init){
    try{
      const url=typeof input==='string'?input:(input&&input.url)||'';
      const p=rel(url);
      const J=window.__JSON_ASSETS;
      if(J&&p&&Object.prototype.hasOwnProperty.call(J,p)){
        return Promise.resolve(new Response(JSON.stringify(J[p]),{status:200,headers:{'Content-Type':'application/json'}}));
      }
      const d=dataSrc(url);
      if(d) return ofetch(d,init);
    }catch(e){}
    return ofetch(input,init);
  };
})();

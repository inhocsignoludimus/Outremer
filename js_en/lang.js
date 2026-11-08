// Idioma / Language: escolhe entre js/ (português) e js_en/ (inglês, gerado por tools/build_en.sh)
(function(){
  const cur = window.LANG || 'pt';
  async function setLang(l){
    if(l === cur) return;
    try{ if(typeof running!=='undefined' && running && typeof saveGame==='function') await saveGame(true); }catch(e){}
    try{ localStorage.setItem('outremer_lang', l); }catch(e){}
    location.reload();
  }
  window.setLang = setLang;
  // Opções (tela inicial)
  const box = document.querySelector('#front-options .create-box');
  if(box){
    const d = document.createElement('label'); d.className = 'opt';
    d.innerHTML = (cur==='en'?'Language':'Idioma') + ' <select id="o-lang"><option value="en">English</option><option value="pt">Português</option></select>';
    box.insertBefore(d, box.querySelector('label'));
    const s = document.getElementById('o-lang'); s.value = cur; s.onchange = e => setLang(e.target.value);
  }
  // Menu do jogo (Esc): salva e troca
  const b = document.getElementById('m-lang');
  if(b){ b.textContent = cur==='en' ? 'Language: English (switch to Português)' : 'Idioma: Português (mudar para English)';
    b.onclick = () => setLang(cur==='en' ? 'pt' : 'en'); }
})();

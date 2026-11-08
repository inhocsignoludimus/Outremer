// Idioma / Language: escolhe entre js/ (português) e js_en/ (inglês, gerado por tools/build_en.js)
(function(){
  const cur = window.LANG || 'pt';
  function setLang(l){ try{ localStorage.setItem('outremer_lang', l); }catch(e){} location.reload(); }
  window.setLang = setLang;
  const box = document.querySelector('#front-options .create-box'); if(!box) return;
  const d = document.createElement('label'); d.className = 'opt';
  d.innerHTML = 'Idioma / Language <select id="o-lang"><option value="en">English</option><option value="pt">Português</option></select>';
  box.insertBefore(d, box.querySelector('label'));
  const s = document.getElementById('o-lang'); s.value = cur; s.onchange = e => setLang(e.target.value);
})();

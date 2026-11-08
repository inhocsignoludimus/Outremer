// Gera a versão em inglês: js/*.js -> js_en/*.js trocando os literais de texto pelo dicionário tools/i18n/en.json.
// data3d.js em inglês vem de: python3 tools/port_data3d.py <dados> en > js_en/data3d.js
// uso: node tools/build_en.js
const fs = require('fs'), path = require('path');
const req = m => { try { return require(m); } catch (e) { return require('/home/claude/i18n/node_modules/' + m); } };
const acorn = req('acorn'), walk = req('acorn-walk');
const root = path.join(__dirname, '..');
const D = JSON.parse(fs.readFileSync(path.join(__dirname, 'i18n/en.json'), 'utf8'));
const H = JSON.parse(fs.readFileSync(path.join(__dirname, 'i18n/html_en.json'), 'utf8'));
// trocas dentro de CSS/strings grandes que não são traduzidas inteiras
const SUB = [["content:'DIÁRIO'", "content:'JOURNAL'"]];
const src = path.join(root, 'js'), out = path.join(root, 'js_en');
fs.mkdirSync(out, { recursive: true });
let n = 0, miss = new Set();
for (const f of fs.readdirSync(src)) {
  if (!f.endsWith('.js') || f === 'data3d.js') continue;
  const code = fs.readFileSync(path.join(src, f), 'utf8');
  const ast = acorn.parse(code, { ecmaVersion: 'latest' });
  const reps = [];
  walk.full(ast, nd => {
    if (nd.type === 'Literal' && typeof nd.value === 'string' && D[nd.value] != null) {
      const q = code[nd.start];
      let s = JSON.stringify(D[nd.value]);
      if (q === "'") s = "'" + s.slice(1, -1).replace(/\\"/g, '"').replace(/'/g, "\\'") + "'";
      reps.push([nd.start, nd.end, s]);
    }
    if (nd.type === 'TemplateElement' && D[nd.value.cooked] != null) {
      const t = D[nd.value.cooked].replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
      reps.push([nd.start, nd.end, t]);
    }
  });
  reps.sort((a, b) => b[0] - a[0]);
  let o = code;
  for (const [a, b, s] of reps) o = o.slice(0, a) + s + o.slice(b);
  for (const [a, b] of SUB) o = o.split(a).join(b);
  if (f === 'outremer.js') o = o.replace(/const VNAME = \{[\s\S]*?\};/, "const VNAME = { ferreiro:'blacksmith', arqueiro:'bowyer', alfaiate:'tailor', alchemist:'alchemist', healer:'healer', tailor:'tailor', bowyer:'bowyer', butcher:'butcher', carpenter:'carpenter', jeweler:'jeweller', provisioner:'grocer', estalajadeiro:'innkeeper', mago:'mage', banqueiro:'banker' };");
  fs.writeFileSync(path.join(out, f), o); n += reps.length;
}
// nomes de guildas e jogadores simulados (dados 3D sem versão inglesa)
{ const F = JSON.parse(fs.readFileSync(path.join(__dirname, 'i18n/d3_en_fix.json'), 'utf8'));
  const p3 = path.join(out, 'data3d.js');
  if (fs.existsSync(p3)) { let t = fs.readFileSync(p3, 'utf8'); for (const k in F) t = t.split(JSON.stringify(k)).join(JSON.stringify(F[k])); fs.writeFileSync(p3, t); } }
// textos fixos do index.html: aplicados no DOM antes dos scripts do jogo
const html = `// Gerado por tools/build_en.js\ndocument.documentElement.lang='en';\n(function(){const H=${JSON.stringify(H)};\nconst w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let t;while(t=w.nextNode()){const k=t.nodeValue.trim();if(H[k])t.nodeValue=t.nodeValue.replace(k,H[k]);}\nfor(const e of document.querySelectorAll('[placeholder],[title],[aria-label]'))for(const a of ['placeholder','title','aria-label']){const v=e.getAttribute(a);if(v&&H[v])e.setAttribute(a,H[v]);}})();\n`;
fs.writeFileSync(path.join(out, '_html.js'), html);
console.log('js_en: ' + n + ' trocas');

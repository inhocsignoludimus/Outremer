# Porta TODOS os dados do Outremer 3D (repo offline-mmo/data) para js/data3d.js
# uso: python3 tools/port_data3d.py /caminho/para/mmo/data > js/data3d.js
import json, sys, os, glob
root = sys.argv[1]
def strip(o):
    if isinstance(o, dict):
        if set(o.keys()) >= {'pt','en'} and len(o) <= 3: return o['pt']
        return {k: strip(v) for k, v in o.items()}
    if isinstance(o, list): return [strip(x) for x in o]
    return o
out = {}
for f in sorted(glob.glob(os.path.join(root, '**', '*.json'), recursive=True)):
    key = os.path.relpath(f, root)[:-5].replace(os.sep, '/')
    try: out[key] = strip(json.load(open(f)))
    except Exception as e: print('// falhou', key, e, file=sys.stderr)
print('// Gerado por tools/port_data3d.py a partir dos dados do Outremer 3D. Não editar à mão.')
print('const D3 = ' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';')

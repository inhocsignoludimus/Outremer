# Converte os modelos exportados (props_out.json, gerado pelo visualizador three.js a partir dos FBX do pacote)
# (uso: props3d_build.py props_out.json js/props3d.js assets/props3d.jpg) em js/props3d.js compacto: posições Int16, normais Int8, UV Uint16 (faixa -0.5..1.5).
import json,base64,struct,sys
D=json.load(open(sys.argv[1])); out={}; tot=0
for k,v in D.items():
  if k=='counter': continue
  P,N,UV=v['P'],v['N'],v['UV']; sc=32767/(max(abs(x) for x in P) or 1)
  pq=struct.pack('<%dh'%len(P),*[round(x*sc) for x in P]); nq=struct.pack('<%db'%len(N),*[max(-127,min(127,round(x*127))) for x in N])
  uq=struct.pack('<%dH'%len(UV),*[max(0,min(65535,round((x+.5)/2*65535))) for x in UV])
  out[k]=dict(sz=[round(q,2) for q in v['size']],q=1/sc,p=base64.b64encode(pq).decode(),n=base64.b64encode(nq).decode(),u=base64.b64encode(uq).decode()); tot+=len(P)//3
js='// Modelos 3D de objetos (pacote PolygonSight, licença comprada no itch.io) — gerado por tools/props3d_build.py\nwindow.PROPS3D='+json.dumps(out,separators=(',',':'))+';\n'
js+="window.PROPS3D_TEX='data:image/jpeg;base64,"+base64.b64encode(open(sys.argv[3],'rb').read()).decode()+"';\n"
open(sys.argv[2],'w').write(js); print('verts',tot,'bytes',len(js))

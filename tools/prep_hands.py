# Prepara as mãos fotografadas (Fantasy FPS Hands, CC0, Ragnar Random) para o jogo:
# tira o cajado das fotos de pegada, acha o eixo/pegada, guarda luminância + classe (pele/manga) em PNG cinza+alfa.
import sys, json, base64, io, numpy as np
from PIL import Image
from scipy import ndimage as nd
RAW=sys.argv[1]; OUT=sys.argv[2]; SC=0.5
def load(n): return np.array(Image.open(f'{RAW}/{n}.png').convert('RGBA')).astype(float)
def hsv(im):
  r,g,b=im[...,0]/255,im[...,1]/255,im[...,2]/255; mx=np.maximum(np.maximum(r,g),b); mn=np.minimum(np.minimum(r,g),b); d=mx-mn+1e-6
  h=np.where(mx==r,((g-b)/d)%6,np.where(mx==g,(b-r)/d+2,(r-g)/d+4))*60; s=(mx-mn)/(mx+1e-6); return h,s,mx
frames={}
for n in ['001','002','003','004','005','006','020','021','022']:
  im=load(n); a=im[...,3]>40; h,s,v=hsv(im); info={}
  if n>='020':
    wood=a&(s>0.30)&(h>14)&(h<55)&(v>0.25)
    wood=nd.binary_opening(wood,iterations=2); lab,k=nd.label(wood); sz=nd.sum(wood,lab,range(1,k+1)); staff=lab==(1+int(np.argmax(sz)))
    ys,xs=np.nonzero(staff); P=np.stack([xs,ys],1).astype(float); c=P.mean(0); u,sv,vt=np.linalg.svd(P-c,full_matrices=False); ax=vt[0]
    if ax[1]>0: ax=-ax                    # aponta para cima (ponta do cajado)
    proj=(P-c)@ax; tip=P[proj>np.percentile(proj,99)].mean(0)
    info=dict(tx=tip[0]*SC, ty=tip[1]*SC, ang=float(np.arctan2(ax[1],ax[0])))
  # limpa sujeirinhas soltas
  lab,k=nd.label(a); sz=nd.sum(a,lab,range(1,k+1)); a=np.isin(lab,1+np.nonzero(sz>=400)[0])
  lum=(0.3*im[...,0]+0.59*im[...,1]+0.11*im[...,2])
  dark=a&(v<0.34)&((s<0.3)|((h>150)&(h<300)))
  lab,k=nd.label(dark); sleeve=np.zeros_like(dark); Hh,Ww=dark.shape
  for i in range(1,k+1):
    m=lab==i; ys,xs=np.nonzero(m)
    if m.sum()>1500 and (ys.max()>=Hh-3 or xs.max()>=Ww-3): sleeve|=m
  sleeve=nd.binary_closing(sleeve,iterations=2)&a
  woodm=staff if n>='020' else np.zeros_like(a)
  A=np.where(a,np.where(sleeve,150,np.where(woodm,200,255)),0).astype(np.uint8)
  L=np.clip(lum,0,255).astype(np.uint8)
  img=Image.fromarray(np.stack([L,A],-1),'LA'); W,Hh=img.size; img=img.resize((int(W*SC),int(Hh*SC)),Image.LANCZOS)
  arr=np.array(img); arr[...,1]=np.where(arr[...,1]<60,0,np.where(arr[...,1]<175,150,np.where(arr[...,1]<228,200,255))); img=Image.fromarray(arr,'LA')
  arr=np.array(img); Lc=arr[...,0]; Ac=arr[...,1]
  def pr(m):
    v=Lc[m]; return [float(np.percentile(v,3)),float(np.percentile(v,97))] if v.size>50 else [40,220]
  info['skin']=pr(Ac==255); info['sleeve']=pr(Ac==150); info['wood']=pr(Ac==200)
  bb=img.getbbox(); crop=img.crop(bb); buf=io.BytesIO(); crop.save(buf,'PNG',optimize=True)
  info.update(x=bb[0],y=bb[1],w=crop.width,h=crop.height,src='data:image/png;base64,'+base64.b64encode(buf.getvalue()).decode())
  frames[n]=info; print(n,bb,len(buf.getvalue()),{k:v for k,v in info.items() if k in('tx','ty','ang')})
js='// Mãos fotografadas em 1ª pessoa — "Fantasy FPS Hands" de Ragnar Random (OpenGameArt, CC0). Gerado por tools/prep_hands.py\n// Canal L = luz da foto, A = 255 pele / 200 madeira do cajado / 150 manga. Quadro inteiro: %dx%d.\nwindow.FPHANDS_PH=%s;\n'%(int(612*SC),int(408*SC),json.dumps(frames,separators=(',',':')))
open(OUT,'w').write(js); print('bytes',len(js))

from chars import *
SH=[hx(c) for c in ('1c2228','2b3a44','3f5563','5a7480')]
JE=[hx(c) for c in ('18202c','24324a','34476a')]
SH2=[hx(c) for c in ('2a1414','5a2622','7e3a30','a0574a')]
JE2=[hx(c) for c in ('1e1a17','2e2924','453d34')]
m=sheet('m',look('parda','preto',SH,JE)); f=sheet('f',look('clara','loiro',SH2,JE2))
out=Canvas(140,90,(40,40,44,255)); out.paste(m,2,2); out.paste(f,72,2)
out.img.resize((140*6,90*6),Image.NEAREST).save('/tmp/chars.png')

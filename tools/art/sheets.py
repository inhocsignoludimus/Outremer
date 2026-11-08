from scene import *   # reaproveita cores
from PIL import Image
P='/home/claude/after-light/assets/proto/'
# folha de personagens: 4 visuais x (4 direções x 4 quadros)
looks=[('m',player,False),('f',woman,False),('m',raider,True),('f',look('negra','preto',OLIVE,JE2),False),('m',look('clara','ruivo',OLIVE,KHAKI),False),('f',look('parda','castanho',GREY,JE),False)]
sh=Canvas(64*len(looks)+4*(len(looks)-1),84)
for k,(sx,c,b) in enumerate(looks):
    for r,d in enumerate(['down','up','right','left']):
        for f,fr in enumerate(FRAMES): sh.paste(sprite(sx,d,fr,c,b),k*68+f*16,r*21)
sh.img.save(P+'chars_sheet.png')
# tiles
tl=[t_grass(1),t_grass(2,True),t_dirt(3),t_asphalt(4),t_asphalt(5,'dash'),t_sidewalk(6),t_curb(7),t_wood(8),t_tile(9),t_carpet(10),t_wallcap()]
ts=Canvas(16*len(tl),16)
for i,t in enumerate(tl): ts.paste(t,i*16,0)
ts.img.save(P+'tiles_sheet.png')
# objetos
objs=[o_bed(),o_wardrobe(),o_sofa(),o_table(),o_fridge(),o_counter(32),o_counter(16,True),o_tv(),o_plant(),o_toilet(),o_crate(),o_lantern(),o_rug(),o_bins(),o_mailbox(),o_bush(5),o_car(1),o_streetlamp(),o_tree(3),o_tree(21,False)]
W=sum(o.w+2 for o in objs); H=max(o.h for o in objs)
os_=Canvas(W,H); x=0
for o in objs: os_.paste(o,x,H-o.h); x+=o.w+2
os_.img.save(P+'objects_sheet.png')
# folha de apresentação ampliada
bg=(34,32,36,255); S=4
pres=Image.new('RGBA',(max(sh.w,ts.w*2,os_.w)*S+40, (84+16+H)*S+120),bg)
pres.paste(sh.img.resize((sh.w*S,sh.h*S),Image.NEAREST),(20,20),sh.img.resize((sh.w*S,sh.h*S),Image.NEAREST))
t2=ts.img.resize((ts.w*S,16*S),Image.NEAREST); pres.paste(t2,(20,84*S+50))
o2=os_.img.resize((os_.w*S,H*S),Image.NEAREST); pres.paste(o2,(20,(84+16)*S+80),o2)
pres=pres.resize((pres.width//2,pres.height//2),Image.NEAREST)
pres.save(P+'folha_sprites.png'); print(pres.size)
# GIF andando
frames=[]
for fi in range(8):
    fr=Canvas(16*4*1+8,21*2+4,(40,44,40,255))
    for r,d in enumerate(['down','right','up','left']):
        fr.paste(sprite('m',d,FRAMES[fi%4],player),r*18,1)
        fr.paste(sprite('f',d,FRAMES[fi%4],woman),r*18,23)
    frames.append(fr.img.resize((fr.w*8,fr.h*8),Image.NEAREST).convert('P',palette=Image.ADAPTIVE))
frames[0].save(P+'andando.gif',save_all=True,append_images=frames[1:],duration=160,loop=0)

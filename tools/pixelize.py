# Converte os quadros renderizados em pixel art (paleta comum, faixas de luz, borda escura) e monta a folha de sprites.
# uso: python3 tools/pixelize.py <pasta_raw> <tipo> <saida.png> [escala]
import sys, os, glob
from PIL import Image, ImageEnhance, ImageFilter
RAW, KIND, OUT = sys.argv[1], sys.argv[2], sys.argv[3]; K = float(sys.argv[4]) if len(sys.argv) > 4 else .35
ANIMS = [('idle', 1), ('walk', 8), ('attack', 6)]
W, H = round(200*K), round(300*K)
frames = {}
for d in range(8):
    for an, n in ANIMS:
        for f in range(n):
            im = Image.open(os.path.join(RAW, f'{KIND}_{d}_{an}_{f}.png')).convert('RGBA')
            im = im.resize((W, H), Image.BOX)
            frames[(d, an, f)] = im
import colorsys
LV = [.12, .22, .34, .48, .63, .8, .95]
def band(c):
    r, g, b = [v/255 for v in c]; h, sat, v = colorsys.rgb_to_hsv(r, g, b)
    v = min(1, v*1.12); v = min(LV, key=lambda L: abs(L-v)); sat = min(1, sat*1.25)
    r, g, b = colorsys.hsv_to_rgb(h, sat, v); return (int(r*255), int(g*255), int(b*255))
sheet = Image.new('RGBA', (W*15, H*8), (0, 0, 0, 0)); cache = {}
for (d, an, f), im in frames.items():
    px = im.load(); q = Image.new('RGBA', (W, H), (0, 0, 0, 0)); qp = q.load()
    mask = [[px[x, y][3] > 110 for x in range(W)] for y in range(H)]
    for y in range(H):
        for x in range(W):
            if not mask[y][x]: continue
            c = px[x, y][:3]; key = (c[0]//4, c[1]//4, c[2]//4)
            if key not in cache: cache[key] = band(c)
            c = cache[key]
            edge = any(not (0 <= x+dx < W and 0 <= y+dy < H and mask[y+dy][x+dx]) for dx, dy in ((1, 0), (0, 1), (-1, 0), (0, -1)))
            if edge: k2 = .5 if (x+1 >= W or not mask[y][x+1]) or (y+1 >= H or not mask[y+1][x]) else .72; c = (int(c[0]*k2), int(c[1]*k2), int(c[2]*k2))
            qp[x, y] = (*c, 255)
    col = {'idle': 0, 'walk': 1, 'attack': 9}[an]+f
    sheet.paste(q, (col*W, d*H), q)
sheet.save(OUT); print(OUT, sheet.size, 'cell', W, H, 'anchor', round(100*K, 1), round(253*K, 1))

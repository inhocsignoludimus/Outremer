"""Tiles 16x16 e objetos — prova de estilo After Light."""
from pal import *
T = 16

def t_grass(seed, overgrown=False):
    cv = Canvas(T, T); r = random.Random(seed)
    noise(cv, 0, 0, T, T, GRASS[2], [(GRASS[1], .22), (GRASS[3], .14), (GRASS[0], .03)], seed)
    for _ in range(5 if overgrown else 3):
        x, y = r.randrange(T), r.randrange(2, T)
        cv.set(x, y, GRASS[4]); cv.set(x, y - 1, GRASS[5] if r.random() < .5 else GRASS[4]); cv.set(x, y + 1, GRASS[1])
    if overgrown:
        for _ in range(3):
            x, y = r.randrange(T), r.randrange(T); cv.set(x, y, DIRT[3])
    if r.random() < .25:
        x, y = r.randrange(2, 14), r.randrange(2, 14)
        cv.set(x, y, hx('b9a65a')); cv.set(x + 1, y, GRASS[1])  # florzinha seca
    return cv

def t_dirt(seed):
    cv = Canvas(T, T); r = random.Random(seed)
    noise(cv, 0, 0, T, T, DIRT[2], [(DIRT[1], .25), (DIRT[3], .12), (DIRT[0], .03)], seed)
    for _ in range(3):
        x, y = r.randrange(T), r.randrange(T); cv.set(x, y, CONC[3]); cv.set(x, y + 1, DIRT[0])
    return cv

def t_asphalt(seed, line=None, crack=True):
    cv = Canvas(T, T); r = random.Random(seed)
    noise(cv, 0, 0, T, T, ASPH[2], [(ASPH[1], .28), (ASPH[3], .12), (ASPH[4], .02)], seed)
    if line == 'dash':
        cv.rect(2, 7, 9, 2, hx('9b8a4a'));
        for i in range(2, 11):
            if r.random() < .25: cv.set(i, 7 + r.randrange(2), hx('6e6340'))
    if crack and r.random() < .6:
        x, y = r.randrange(T), r.randrange(T)
        for _ in range(r.randrange(5, 12)):
            cv.set(x, y, ASPH[0]); x += r.choice((-1, 0, 1)); y += r.choice((0, 1))
    return cv

def t_sidewalk(seed):
    cv = Canvas(T, T); r = random.Random(seed)
    noise(cv, 0, 0, T, T, CONC[3], [(CONC[2], .2), (CONC[4], .06)], seed)
    cv.hline(0, 0, T, CONC[1]); cv.vline(0, 0, T, CONC[1]); cv.hline(1, 1, T - 1, CONC[4]); cv.vline(1, 1, T - 1, CONC[4])
    if r.random() < .5:  # mato na junta
        x = r.randrange(3, 13); cv.set(x, 0, GRASS[3]); cv.set(x + 1, 0, GRASS[4]); cv.set(x, 1, GRASS[2])
    if r.random() < .3:
        x, y = r.randrange(3, 12), r.randrange(3, 12)
        for _ in range(6): cv.set(x, y, CONC[1]); x += 1; y += r.choice((0, 1, -1))
    return cv

def t_curb(seed):
    cv = t_asphalt(seed, crack=False)
    cv.rect(0, 0, T, 3, CONC[3]); cv.hline(0, 0, T, CONC[4]); cv.rect(0, 3, T, 2, CONC[1]); cv.hline(0, 5, T, ASPH[0])
    return cv

def t_wood(seed):
    cv = Canvas(T, T); r = random.Random(seed)
    for row in range(4):
        y = row * 4; base = WOOD[3] if (row + seed) % 2 else WOOD[2]
        noise(cv, 0, y, T, 3, base, [(WOOD[2] if base == WOOD[3] else WOOD[1], .12), (WOOD[4], .04)], seed * 7 + row)
        cv.hline(0, y + 3, T, WOOD[0])
        sx = (row * 6 + seed * 3) % T; cv.vline(sx, y, 3, WOOD[1])
    return cv

def t_tile(seed):
    cv = Canvas(T, T); r = random.Random(seed)
    for j in range(2):
        for i in range(2):
            c = TILEF[3] if (i + j) % 2 == 0 else TILEF[2]
            cv.rect(i * 8, j * 8, 8, 8, c); cv.hline(i * 8, j * 8, 8, TILEF[1]); cv.vline(i * 8, j * 8, 8, TILEF[1])
            cv.set(i * 8 + 2, j * 8 + 2, TILEF[4])
    if r.random() < .4: x, y = r.randrange(T), r.randrange(T); cv.set(x, y, TILEF[0]); cv.set(x + 1, y + 1, TILEF[0])
    return cv

def t_carpet(seed):
    cv = Canvas(T, T)
    noise(cv, 0, 0, T, T, FABRIC_G[2], [(FABRIC_G[1], .3), (FABRIC_G[3], .08)], seed)
    return cv

def t_wallcap():
    cv = Canvas(T, T); cv.rect(0, 0, T, T, hx('2a2326')); cv.hline(0, 0, T, hx('3d3436'))
    return cv

def wall_face(cv, x, y, w, ramp=PAPER, h=10, base=WOOD):
    """face interna da parede norte (papel de parede + rodapé)"""
    cv.rect(x, y, w, h, ramp[2])
    for i in range(x, x + w, 4): cv.vline(i, y, h - 2, ramp[1])
    for i in range(x + 2, x + w, 4): cv.vline(i, y + 1, h - 3, ramp[3])
    cv.hline(x, y, w, ramp[0]); cv.rect(x, y + h - 2, w, 2, base[2]); cv.hline(x, y + h - 2, w, base[3])

# ---------- objetos ----------
def o_bed(color=FABRIC_R):  # 18x30
    cv = Canvas(20, 32)
    box3(cv, 1, 1, 18, 26, 4, WOOD)
    cv.rect(2, 3, 16, 6, WHITE); cv.hline(2, 3, 16, hx('ece7d8')); cv.hline(2, 8, 16, hx('a8a292'))  # travesseiro
    cv.rect(2, 10, 16, 17, color[2]); cv.hline(2, 10, 16, color[3]); cv.rect(2, 22, 16, 5, color[1])
    for i in range(3, 17, 4): cv.vline(i, 11, 11, color[1])
    cv.rect(13, 15, 4, 3, color[3])  # amarrotado
    return cv

def o_sofa():
    cv = Canvas(34, 16)
    box3(cv, 1, 1, 32, 5, 8, FABRIC_G)
    cv.rect(1, 6, 4, 8, FABRIC_G[1]); cv.rect(29, 6, 4, 8, FABRIC_G[1])
    cv.rect(5, 7, 11, 5, FABRIC_G[2]); cv.rect(17, 7, 11, 5, FABRIC_G[2]); cv.hline(5, 7, 23, FABRIC_G[3])
    cv.set(9, 9, hx('9a8a6a')); cv.set(10, 9, hx('9a8a6a'))  # rasgo com espuma
    return cv

def o_table():
    cv = Canvas(26, 22)
    for (x, y) in ((1, 0), (19, 0)):  # cadeiras atrás
        box3(cv, x + 1, y + 1, 5, 3, 3, WOOD)
    box3(cv, 1, 6, 24, 9, 4, WOOD)
    cv.ellipse(8, 10, 2, 1.4, WHITE); cv.set(16, 9, METAL[3]); cv.set(17, 10, METAL[3])
    return cv

def o_fridge():
    cv = Canvas(16, 26)
    box3(cv, 1, 1, 14, 4, 20, [hx('5d5b55'), hx('8a877d'), hx('aaa699'), hx('c6c1b2')])
    cv.hline(2, 13, 12, hx('6d6a62')); cv.vline(12, 7, 4, METAL[2]); cv.vline(12, 15, 5, METAL[2])
    cv.set(4, 18, RUST[2]); cv.set(5, 19, RUST[1])
    return cv

def o_counter(w=32, stove=False):
    cv = Canvas(w + 2, 18)
    box3(cv, 1, 1, w, 6, 9, [hx('2a2422'), hx('4a3f39'), hx('6a5c52'), hx('8b7c6f')])
    for x in range(2, w, 8): cv.vline(x + 7, 8, 8, hx('2a2422')); cv.set(x + 3, 10, METAL[3])
    if stove:
        cv.rect(w - 13, 2, 12, 5, METAL[1])
        for (a, b) in ((w - 10, 3), (w - 5, 3)): cv.ellipse(a, b + 1, 2, 1.3, METAL[3]); cv.set(a, b + 1, METAL[0])
    else:
        cv.rect(6, 2, 8, 4, METAL[3]); cv.rect(7, 3, 6, 2, METAL[1])  # pia
    return cv

def o_wardrobe():
    cv = Canvas(22, 26)
    box3(cv, 1, 1, 20, 3, 21, WOOD)
    cv.vline(11, 5, 20, WOOD[0]); cv.set(9, 14, LIGHT[1]); cv.set(13, 14, LIGHT[1])
    return cv

def o_tv():
    cv = Canvas(22, 16)
    box3(cv, 1, 6, 20, 3, 6, WOOD)
    cv.rect(4, 0, 14, 8, METAL[0]); cv.rect(5, 1, 12, 6, GLASS[1]); cv.set(6, 2, GLASS[3])
    for i in range(7): cv.set(8 + i, 2 + (i * 3) % 5, GLASS[0])  # tela rachada
    cv.outline()
    return cv

def o_plant(dead=True):
    cv = Canvas(12, 16)
    box3(cv, 3, 9, 6, 2, 4, RUST)
    cols = [DIRT[3], DIRT[2], hx('7a6a3a')] if dead else [LEAF[4], LEAF[3], LEAF[5]]
    for (x, y) in ((6, 2), (4, 4), (8, 4), (5, 6), (7, 6), (3, 7), (9, 7)):
        cv.set(x, y, cols[0]); cv.set(x, y + 1, cols[1]); cv.set(x + 1, y, cols[2])
    cv.vline(6, 4, 5, cols[1])
    cv.outline()
    return cv

def o_rug():
    cv = Canvas(30, 20)
    cv.rect(0, 0, 30, 20, FABRIC_R[1]); cv.rect(2, 2, 26, 16, FABRIC_R[2]); cv.rect(5, 5, 20, 10, FABRIC_R[1])
    cv.rect(7, 7, 16, 6, FABRIC_R[3])
    for i in range(0, 30, 2): cv.set(i, 0, WHITE); cv.set(i, 19, WHITE)
    return cv

def o_toilet():
    cv = Canvas(12, 16)
    box3(cv, 2, 1, 8, 2, 3, [TILEF[1], TILEF[2], TILEF[3], TILEF[4]])
    cv.ellipse(6, 10, 4, 3.5, TILEF[4]); cv.ellipse(6, 10, 2.5, 2, TILEF[1]); cv.ellipse(6, 10.5, 1.6, 1.2, GLASS[2])
    cv.outline()
    return cv

def o_crate():
    cv = Canvas(14, 14)
    box3(cv, 1, 1, 12, 4, 8, WOOD)
    cv.hline(1, 9, 12, WOOD[1]); cv.set(3, 7, WOOD[4])
    return cv

def o_lantern(on=True):
    cv = Canvas(8, 10)
    cv.rect(2, 3, 4, 5, LIGHT[1] if on else METAL[2]); cv.set(3, 4, LIGHT[2])
    cv.hline(2, 2, 4, METAL[2]); cv.hline(2, 8, 4, METAL[2]); cv.hline(3, 1, 2, METAL[3])
    cv.outline()
    return cv

def o_tree(seed, big=True):
    r = random.Random(seed); W_, H_ = (44, 52) if big else (32, 40)
    cv = Canvas(W_, H_)
    cx = W_ / 2; trunk_y = H_ - 14
    cv.rect(int(cx) - 2, trunk_y, 5, 12, WOOD[1]); cv.vline(int(cx) - 2, trunk_y, 12, WOOD[2]); cv.vline(int(cx) + 2, trunk_y, 12, WOOD[0])
    blobs = []
    R = W_ / 2 - 3
    for k in range(9):
        a = k / 9 * 6.283 + r.random() * .5
        import math
        blobs.append((cx + math.cos(a) * R * .55, (H_ - 18) / 2 + 2 + math.sin(a) * R * .45, R * (.42 + r.random() * .12)))
    blobs.append((cx, (H_ - 18) / 2 + 2, R * .55))
    for (bx, by, br) in blobs: cv.ellipse(bx, by, br, br * .85, LEAF[2])
    for (bx, by, br) in blobs:  # luz de cima-esquerda
        cv.ellipse(bx - br * .25, by - br * .3, br * .6, br * .5, LEAF[3])
    for (bx, by, br) in blobs:
        cv.ellipse(bx - br * .4, by - br * .45, br * .28, br * .22, LEAF[4])
    # sombras internas e dither
    for j in range(H_):
        for i in range(W_):
            c = cv.get(i, j)
            if c[3] and c in (LEAF[2], LEAF[3]) and r.random() < .08: cv.set(i, j, LEAF[1])
            if c == LEAF[4] and r.random() < .15: cv.set(i, j, LEAF[5])
    for j in range(H_):  # metade de baixo mais escura
        for i in range(W_):
            if cv.get(i, j) == LEAF[2] and j > (H_ - 18) * .62 and r.random() < .6: cv.set(i, j, LEAF[1])
    # folhas secas (outono pós-apocalíptico)
    for _ in range(12):
        i, j = r.randrange(W_), r.randrange(H_ - 14)
        if cv.get(i, j)[3] and cv.get(i, j) != WOOD[1]: cv.set(i, j, hx('7a6a32'))
    cv.outline()
    return cv

def o_bush(seed):
    r = random.Random(seed); cv = Canvas(20, 16)
    for k in range(4): cv.ellipse(5 + k * 3.3, 9 - (k % 2), 4.5, 4, LEAF[2])
    for k in range(4): cv.ellipse(4.5 + k * 3.3, 7.5 - (k % 2), 2.5, 2, LEAF[3])
    for j in range(16):
        for i in range(20):
            if cv.get(i, j) == LEAF[2] and j > 10: cv.set(i, j, LEAF[1])
            if cv.get(i, j) == LEAF[3] and r.random() < .15: cv.set(i, j, LEAF[4])
    cv.outline()
    return cv

def o_car(seed, ramp=CARBLUE):  # carro abandonado, horizontal 44x22
    r = random.Random(seed); cv = Canvas(46, 26)
    # rodas
    for x in (7, 33):
        cv.rect(x, 2, 6, 3, METAL[0]); cv.rect(x, 19, 6, 3, METAL[0])
    cv.rect(2, 4, 42, 16, ramp[2])
    cv.hline(2, 4, 42, ramp[3]); cv.rect(2, 16, 42, 4, ramp[1])  # lateral de baixo na sombra
    cv.rect(1, 6, 1, 12, ramp[2]); cv.rect(44, 6, 1, 12, ramp[1])
    # capô / teto / porta-malas
    cv.rect(13, 6, 4, 11, GLASS[1]); cv.vline(13, 6, 11, GLASS[2]); cv.set(14, 8, GLASS[3])  # para-brisa
    cv.rect(17, 6, 13, 11, ramp[3]); cv.hline(17, 6, 13, ramp[4])  # teto
    cv.rect(30, 6, 3, 11, GLASS[0])  # vidro traseiro quebrado
    for i in range(5): cv.set(30 + r.randrange(3), 7 + r.randrange(9), GLASS[2])
    cv.hline(4, 11, 8, ramp[1])
    for _ in range(14):  # ferrugem
        x, y = r.randrange(3, 43), r.randrange(5, 19); cv.set(x, y, RUST[r.randrange(1, 4)])
    cv.set(2, 7, LIGHT[0]); cv.set(2, 15, LIGHT[0]); cv.set(44, 7, BLOOD[1]); cv.set(44, 15, BLOOD[1])
    cv.outline()
    return cv

def o_bins():
    cv = Canvas(22, 18)
    box3(cv, 1, 2, 9, 4, 10, [hx('1c2a1e'), hx('2a3e2c'), hx('3c5640'), hx('527058')])
    box3(cv, 12, 3, 9, 4, 9, METAL)
    cv.set(14, 15, DIRT[3]); cv.set(15, 16, WHITE); cv.set(18, 16, DIRT[2])
    return cv

def o_mailbox():
    cv = Canvas(8, 16)
    cv.rect(3, 6, 2, 9, WOOD[1]); cv.vline(3, 6, 9, WOOD[2])
    box3(cv, 1, 2, 6, 2, 4, METAL); cv.set(6, 1, BLOOD[1])
    cv.outline()
    return cv

def o_streetlamp():
    cv = Canvas(18, 46)
    cv.rect(4, 6, 2, 38, METAL[2]); cv.vline(4, 6, 38, METAL[3])
    cv.rect(4, 4, 10, 2, METAL[2]); cv.rect(11, 5, 5, 3, METAL[1]); cv.hline(12, 8, 3, GLASS[1])
    cv.rect(2, 42, 6, 2, METAL[1])
    cv.outline()
    return cv

def o_fence(n):  # cerca de madeira horizontal, n tiles
    cv = Canvas(n * T, 14)
    for x in range(0, n * T, 4):
        h = 11 - (x // 4 % 3 == 0 and 1 or 0)
        cv.rect(x, 13 - h, 3, h, WOOD[3]); cv.vline(x, 13 - h, h, WOOD[4]); cv.vline(x + 2, 13 - h, h, WOOD[2])
    cv.hline(0, 4, n * T, WOOD[1]); cv.hline(0, 9, n * T, WOOD[1])
    cv.outline()
    return cv

def o_debris(seed):
    r = random.Random(seed); cv = Canvas(16, 10)
    for _ in range(7):
        x, y = r.randrange(1, 14), r.randrange(2, 9)
        cv.rect(x, y, r.randrange(1, 3), 1, r.choice([CONC[3], WOOD[3], METAL[3], GLASS[3], hx('cfc8b4')]))
    return cv

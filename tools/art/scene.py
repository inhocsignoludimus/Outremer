"""Monta a cena de prova de estilo (dia e noite) + folhas de sprites."""
import math
from pal import *
from tiles import *
from chars import *

TW, TH = 26, 16
cv = Canvas(TW * T, TH * T)
G = [[None] * TW for _ in range(TH)]

def put(tx, ty, tile): cv.paste(tile, tx * T, ty * T)

# ---------- chão ----------
for ty in range(TH):
    for tx in range(TW):
        s = tx * 31 + ty * 17
        if ty == 11: put(tx, ty, t_sidewalk(s))
        elif ty == 12: put(tx, ty, t_curb(s))
        elif ty == 13: put(tx, ty, t_asphalt(s, 'dash' if tx % 2 == 0 else None))
        elif ty >= 14: put(tx, ty, t_asphalt(s + 3))
        else: put(tx, ty, t_grass(s, overgrown=(tx + ty) % 3 == 0))
# trilhas de terra até as portas
for ty in (10,):
    put(6, ty, t_dirt(91)); put(21, ty, t_dirt(92))
for ty in range(0, 2):
    for tx in range(11, 14): put(tx, ty, t_dirt(tx * 5 + ty))

# ---------- casa A (com telhado) ----------
AX, AY, AW, AH = 2, 2, 9, 8   # última linha = fachada
def roof(x0, y0, w, h):
    X, Y, W_, H_ = x0 * T - 3, y0 * T - 4, w * T + 6, (h - 1) * T + 4
    ridge = Y + int(H_ * .42)
    r = random.Random(7)
    for y in range(Y, Y + H_):
        north = y < ridge
        base, seam = (ROOF[3], ROOF[2]) if north else (ROOF[2], ROOF[1])
        row = (y - Y) // 5
        for x in range(X, X + W_):
            c = base
            m = (y - Y) % 5
            if m == 4: c = ROOF[0] if not north else ROOF[1]
            elif m == 0: c = ROOF[4] if north else ROOF[3]
            elif (x - X + (row % 2) * 5) % 10 == 0: c = seam
            elif r.random() < .05: c = ROOF[4] if north else ROOF[3]
            cv.set(x, y, c)
    for x in range(X, X + W_):  # cumeeira
        cv.set(x, ridge - 1, ROOF[4]); cv.set(x, ridge, ROOF[3]); cv.set(x, ridge + 1, ROOF[0])
    cv.rect(X, Y + H_ - 3, W_, 3, ROOF[0]); cv.hline(X, Y + H_ - 3, W_, ROOF[1])  # beiral
    # telhas faltando + musgo + folhas
    for _ in range(9):
        x, y = r.randrange(X + 4, X + W_ - 8), r.randrange(Y + 3, Y + H_ - 8)
        cv.rect(x, y, 5, 3, WOOD[1]); cv.hline(x, y, 5, ROOF[0])
    for _ in range(40):
        x, y = r.randrange(X, X + W_), r.randrange(Y, Y + H_ - 3)
        cv.set(x, y, r.choice([GRASS[2], GRASS[3], hx('6e5f2c')]))
    # chaminé
    box3(cv, X + W_ - 30, Y + 4, 10, 4, 9, [hx('2e1814'), hx('4a2a20'), hx('6a3c2c'), hx('84503a')])
    cv.rect(X + W_ - 28, Y + 5, 6, 2, OUT)
    # contorno
    cv.hline(X, Y - 1, W_, OUT); cv.vline(X - 1, Y, H_, OUT); cv.vline(X + W_, Y, H_, OUT)

def facade(x0, y, w, door_tx, windows, boarded=()):
    X, Y = x0 * T, y * T
    cv.rect(X, Y, w * T, T, SIDING[2])
    for yy in range(Y, Y + T, 3): cv.hline(X, yy, w * T, SIDING[1]); cv.hline(X, yy + 1, w * T, SIDING[3])
    cv.rect(X, Y, w * T, 2, ROOF[0])  # sombra do beiral
    cv.rect(X, Y + T - 2, w * T, 2, CONC[1])
    for wx in windows:
        x = wx * T + 2
        cv.rect(x, Y + 4, 12, 8, WHITE); cv.rect(x + 1, Y + 5, 10, 6, GLASS[1])
        cv.vline(x + 6, Y + 5, 6, WHITE); cv.set(x + 2, Y + 6, GLASS[3]); cv.set(x + 3, Y + 6, GLASS[2])
        if wx in boarded:
            for k, yy in enumerate((Y + 5, Y + 8)):
                cv.rect(x - 1, yy, 14, 2, WOOD[3]); cv.hline(x - 1, yy + 1, 14, WOOD[1])
                cv.set(x + 1, yy, METAL[3]); cv.set(x + 11, yy, METAL[3])
    dx = door_tx * T + 3
    cv.rect(dx - 1, Y + 2, 12, 14, WHITE)
    cv.rect(dx, Y + 3, 10, 13, WOOD[2]); cv.rect(dx + 1, Y + 4, 8, 4, WOOD[3]); cv.rect(dx + 1, Y + 9, 8, 6, WOOD[3])
    cv.set(dx + 8, Y + 9, LIGHT[1])
    cv.rect(dx - 2, Y + 16, 14, 3, CONC[3]); cv.hline(dx - 2, Y + 18, 14, CONC[1])  # degrau
    cv.hline(X, Y + T, w * T, shadow(70))

roof(AX, AY, AW, AH)
facade(AX, AY + AH - 1, AW, 6 - AX + AX, [3, 4, 8], boarded=(8,))

# ---------- casa B (sem telhado: interior) ----------
BX, BY, BW, BH = 14, 2, 10, 8
walls = set()
for i in range(BW): walls.add((i, 0)); walls.add((i, BH - 1))
for j in range(BH): walls.add((0, j)); walls.add((BW - 1, j))
for j in range(BH): walls.add((4, j))           # parede do quarto
walls.discard((4, 4))                           # vão de porta interna
walls.discard((7, BH - 1))                      # porta da frente
windows_cap = {(2, 0), (6, 0), (BW - 1, 4), (2, BH - 1), (0, 3)}

for j in range(1, BH - 1):
    for i in range(1, BW - 1):
        if i < 4: put(BX + i, BY + j, t_wood(i * 3 + j))
        elif j <= 3: put(BX + i, BY + j, t_tile(i + j * 2))
        else: put(BX + i, BY + j, t_wood(i + j * 5 + 1))
put(BX + 7, BY + BH - 1, t_wood(77)); put(BX + 4, BY + 4, t_wood(78))

for (i, j) in walls:
    x, y = (BX + i) * T, (BY + j) * T
    below_floor = (i, j + 1) not in walls and 0 < i < BW - 1 and j + 1 < BH - 1
    cap_h = 6 if below_floor else T
    cv.rect(x, y, T, cap_h, hx('2a2326'))
    cv.hline(x, y, T, hx('463b3c'))
    if (i, j - 1) not in walls: cv.hline(x, y, T, hx('5a4c4b'))
    if below_floor:
        wall_face(cv, x, y + 6, T, PAPER if i < 4 else [hx(c) for c in ('2f3a36', '3f4d47', '52625a', '68796f', '7f9085')])
    if (i, j) in windows_cap:
        if j in (0, BH - 1):
            cv.rect(x + 3, y + 2, 10, 2, GLASS[2]); cv.hline(x + 3, y + 2, 10, GLASS[3])
        else:
            cv.rect(x + 7, y + 3, 2, 10, GLASS[2]); cv.vline(x + 7, y + 3, 10, GLASS[3])
# porta aberta da frente
dx, dy = (BX + 7) * T, (BY + BH - 1) * T
cv.rect(dx, dy, 3, 14, WOOD[3]); cv.vline(dx, dy, 14, WOOD[4]); cv.set(dx + 1, dy + 8, LIGHT[1])
cv.rect(dx - 2, dy + 16, 20, 3, CONC[3]); cv.hline(dx - 2, dy + 18, 20, CONC[1])
# sombra das paredes (luz de cima-esquerda)
for (i, j) in walls:
    if (i + 1, j) not in walls and 0 < i + 1 < BW - 1 and 0 < j < BH - 1:
        cv.rect((BX + i + 1) * T, (BY + j) * T, 2, T, shadow(60))

# móveis
def obj(o, px, py, sh=True):
    if sh: cv.ellipse(px + o.w / 2 + 1, py + o.h - 2, o.w / 2, 3, shadow(70))
    cv.paste(o, px, py)
bx, by = BX * T, BY * T
obj(o_wardrobe(), bx + 18, by + 9)
obj(o_bed(), bx + 40, by + 14)
obj(o_rug(), bx + 18, by + 60, sh=False)
obj(o_crate(), bx + 20, by + 88)
obj(o_fridge(), bx + 82, by + 6)
obj(o_counter(32), bx + 98, by + 10)
obj(o_counter(16, stove=True), bx + 130, by + 10)
obj(o_table(), bx + 104, by + 40)
obj(o_sofa(), bx + 88, by + 92)
obj(o_tv(), bx + 92, by + 70)
obj(o_plant(), bx + 132, by + 66)
obj(o_lantern(), bx + 80, by + 54, sh=False)
# sangue seco / bagunça
for k in range(9): cv.set(bx + 62 + k % 4, by + 80 + k // 4, BLOOD[0])
cv.paste(o_debris(4), bx + 110, by + 76)

# ---------- quintal / rua ----------
obj(o_tree(3), 0 * T - 6, 8 * T - 22)
obj(o_tree(11), 11 * T + 2, 5 * T - 18)
obj(o_tree(21, big=False), 23 * T + 6, 0 * T - 14)
obj(o_bush(5), 1 * T, 1 * T)
obj(o_bush(6), 12 * T + 4, 9 * T + 2)
cv.paste(o_fence(4), 0, 10 * T + 2); cv.paste(o_fence(5), 8 * T, 10 * T + 2)
cv.paste(o_fence(3), 14 * T, 10 * T + 2); cv.paste(o_fence(3), 23 * T, 10 * T + 2)
obj(o_mailbox(), 4 * T + 4, 10 * T - 2)
obj(o_bins(), 19 * T, 10 * T - 4)
obj(o_streetlamp(), 12 * T + 4, 8 * T + 4)
obj(o_car(1), 6 * T, 13 * T - 2)
obj(o_car(2, [hx(c) for c in ('2a1a14', '4a2a1e', '6b3f2a', '8a5636', 'a87048')]), 19 * T + 4, 14 * T)
for k, (x, y) in enumerate(((3, 14), (15, 13), (11, 15))): cv.paste(o_debris(k + 10), x * T, y * T)
obj(o_crate(), 17 * T, 12 * T + 8)

# ---------- personagens ----------
SH = [hx(c) for c in ('1c2228', '2b3a44', '3f5563', '5a7480')]
JE = [hx(c) for c in ('18202c', '24324a', '34476a')]
SH2 = [hx(c) for c in ('2a1414', '5a2622', '7e3a30', 'a0574a')]
JE2 = [hx(c) for c in ('1e1a17', '2e2924', '453d34')]
OLIVE = [hx(c) for c in ('1e2216', '33391f', '4a522c', '626b3c')]
KHAKI = [hx(c) for c in ('2a2418', '4a3f28', '6b5c3a')]
GREY = [hx(c) for c in ('1e1e20', '35353a', '4e4e55', '6a6a72')]
player = look('parda', 'preto', SH, JE)
woman = look('clara', 'loiro', SH2, JE2)
raider = look('negra', 'preto', GREY, KHAKI)
other = look('parda', 'castanho', OLIVE, JE)

def char(sex, d, f, cols, px, py, bald=False):
    cv.ellipse(px + 8, py + 19, 5, 2, shadow(90))
    cv.paste(sprite(sex, d, f, cols, bald), px, py)

char('m', 'down', 'a', player, bx + 104, by + 58)
char('f', 'right', 'a', woman, 8 * T, 11 * T - 8)
char('m', 'left', 'b', raider, 15 * T + 4, 12 * T + 2, bald=True)
char('f', 'up', 'idle', look('negra', 'preto', OLIVE, JE2), 4 * T + 2, 10 * T + 4)

day = cv.img.copy()
day.save('/home/claude/after-light/assets/proto/scene_day_1x.png')

# ---------- noite ----------
lights = [  # (x, y, raio, força)
    (bx + 84, by + 58, 60, 1.0),       # lampião
    (bx + 112, by + 66, 26, .7),        # jogador
    ((AX + 4) * T + 8, (AY + AH - 1) * T + 9, 16, .55),  # janela iluminada casa A
    (8 * T + 8, 11 * T + 2, 34, .85),   # lanterna da mulher
]
night = day.copy(); p = night.load()
for y in range(night.height):
    for x in range(night.width):
        L = 0; warm = 0
        for (lx, ly, r_, s) in lights:
            d = math.hypot(x - lx, y - ly) / r_
            if d < 1: v = s * (1 - d * d); L += v; warm += v
        L = min(1, L)
        # quantiza para 4 níveis (luz em degraus = pixel art)
        L = round(L * 4) / 4
        dark = .80 * (1 - L)
        r0, g0, b0, _ = p[x, y]
        r1 = r0 * (1 - dark) + 8 * dark; g1 = g0 * (1 - dark) + 10 * dark; b1 = b0 * (1 - dark) + 26 * dark
        w = min(1, warm) * .22
        p[x, y] = (int(min(255, r1 + 60 * w)), int(min(255, g1 + 32 * w)), int(b1), 255)
night.save('/home/claude/after-light/assets/proto/scene_night_1x.png')

S = 3
day.resize((day.width * S, day.height * S), Image.NEAREST).save('/home/claude/after-light/assets/proto/prova_dia.png')
night.resize((night.width * S, night.height * S), Image.NEAREST).save('/home/claude/after-light/assets/proto/prova_noite.png')
print('ok', day.size)

"""After Light — paleta fixa e utilitários de pixel art (prova de estilo)."""
import random
from PIL import Image

def hx(s):
    s = s.lstrip('#'); return (int(s[0:2], 16), int(s[2:4], 16), int(s[4:6], 16), 255)

OUT = hx('120e10')
# rampas: índice 0 = mais escuro
GRASS = [hx(c) for c in ('1a2416', '243220', '2f4128', '3d5230', '4f633a', '66763f')]
DIRT = [hx(c) for c in ('2b1d16', '3d2a1d', '523a26', '6b4d31', '86643f')]
ASPH = [hx(c) for c in ('17171b', '202026', '2a2a31', '35353d', '45454e')]
CONC = [hx(c) for c in ('3e3d3e', '555352', '6b6864', '827e78', '9c978d')]
WOOD = [hx(c) for c in ('2e1c12', '45291a', '5c3922', '774b2d', '91603a')]
ROOF = [hx(c) for c in ('241314', '381b1a', '4f2621', '67332a', '7e4434')]
SIDING = [hx(c) for c in ('2f353b', '434b52', '58616a', '717b82', '8c959a')]
PAPER = [hx(c) for c in ('3a3326', '524733', '6a5d42', '857555', '9f8f6c')]
GLASS = [hx(c) for c in ('141e27', '22323f', '36505f', '5f8290', '9cbac0')]
TILEF = [hx(c) for c in ('4a4a45', '6d6b62', '8d8a7f', 'a9a597', 'c4bfae')]
METAL = [hx(c) for c in ('1e2124', '2e3337', '454b50', '62696d', '858b8c')]
FABRIC_G = [hx(c) for c in ('1f2a24', '2d3c33', '3e5144', '546a59')]
FABRIC_R = [hx(c) for c in ('2a1414', '43201d', '5c2c26', '763d33')]
RUST = [hx(c) for c in ('2e1a10', '4a2716', '6b391c', '8c4f25')]
CARBLUE = [hx(c) for c in ('172029', '23313e', '33475a', '4a6378', '6a8396')]
LEAF = [hx(c) for c in ('101a12', '17261a', '213622', '2e472b', '3e5a33', '557040')]
LIGHT = [hx('c97c2c'), hx('f2c86a'), hx('ffeec0')]
BLOOD = [hx('3d0e0e'), hx('5e1717')]
WHITE = hx('d8d2c2')

def shadow(a=90):
    return (8, 6, 8, a)

class Canvas:
    def __init__(self, w, h, bg=(0, 0, 0, 0)):
        self.img = Image.new('RGBA', (w, h), bg)
        self.px = self.img.load(); self.w = w; self.h = h

    def set(self, x, y, c):
        if c is None: return
        if 0 <= x < self.w and 0 <= y < self.h:
            if len(c) == 4 and c[3] < 255:
                o = self.px[x, y]; a = c[3] / 255
                if o[3] == 0:
                    self.px[x, y] = c
                else:
                    self.px[x, y] = (int(o[0] * (1 - a) + c[0] * a), int(o[1] * (1 - a) + c[1] * a),
                                     int(o[2] * (1 - a) + c[2] * a), 255)
            else:
                self.px[x, y] = c

    def get(self, x, y):
        if 0 <= x < self.w and 0 <= y < self.h: return self.px[x, y]
        return (0, 0, 0, 0)

    def rect(self, x, y, w, h, c):
        for j in range(y, y + h):
            for i in range(x, x + w): self.set(i, j, c)

    def hline(self, x, y, w, c): self.rect(x, y, w, 1, c)
    def vline(self, x, y, h, c): self.rect(x, y, 1, h, c)

    def ellipse(self, cx, cy, rx, ry, c):
        for j in range(int(cy - ry) - 1, int(cy + ry) + 2):
            for i in range(int(cx - rx) - 1, int(cx + rx) + 2):
                if ((i + .5 - cx) / rx) ** 2 + ((j + .5 - cy) / ry) ** 2 <= 1: self.set(i, j, c)

    def paste(self, other, x, y):
        for j in range(other.h):
            for i in range(other.w):
                c = other.px[i, j]
                if c[3]: self.set(x + i, y + j, c)

    def outline(self, c=OUT):
        """contorno externo de 1px em volta de tudo que não é transparente"""
        add = []
        for j in range(self.h):
            for i in range(self.w):
                if self.px[i, j][3] == 0:
                    for di, dj in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        if self.get(i + di, j + dj)[3] == 255 and self.get(i + di, j + dj) != c:
                            add.append((i, j)); break
        for i, j in add: self.px[i, j] = c

def box3(cv, x, y, w, top, front, ramp, outline=True):
    """móvel em 3/4: tampo (top px) + frente (front px). luz vindo de cima-esquerda."""
    n = len(ramp)
    cv.rect(x, y, w, top, ramp[n - 2])
    cv.hline(x, y, w, ramp[n - 1])
    cv.vline(x, y, top, ramp[n - 1])
    cv.rect(x, y + top, w, front, ramp[n - 4] if n >= 4 else ramp[0])
    cv.hline(x, y + top, w, ramp[n - 3])
    cv.vline(x + w - 1, y, top + front, ramp[max(0, n - 4)])
    if outline:
        cv.hline(x - 1, y - 1, w + 2, OUT); cv.hline(x - 1, y + top + front, w + 2, OUT)
        cv.vline(x - 1, y, top + front, OUT); cv.vline(x + w, y, top + front, OUT)

def noise(cv, x, y, w, h, base, spots, seed):
    r = random.Random(seed)
    cv.rect(x, y, w, h, base)
    for j in range(y, y + h):
        for i in range(x, x + w):
            v = r.random(); acc = 0
            for c, p in spots:
                acc += p
                if v < acc: cv.set(i, j, c); break

"""Personagens 16x21 em camadas de cor (códigos), 3 direções (esquerda = espelho), 4 quadros de andar."""
from pal import *

# códigos: o contorno | h/H/k cabelo médio/claro/escuro | s/S pele / sombra | e olho
# t/u/T camisa / luz / sombra | B cinto | p/P calça / sombra | b sapato
HEAD_M = {
 'down': ["................",
          "......oooo......",
          ".....ohHHho.....",
          "....ohHhhhko....",
          "....ohhhhhko....",
          "....ohsssSho....",
          "....osesseSo....",
          "....osssssSo....",
          ".....oSsSSo....."],
 'up':   ["................",
          "......oooo......",
          ".....ohHHho.....",
          "....ohHhhhko....",
          "....ohhhhhko....",
          "....ohhhhhko....",
          "....okhhhkko....",
          "....oSkkkkSo....",
          ".....oSSSSo....."],
 'side': ["................",
          "......oooo......",
          ".....ohHHHo.....",
          "....ohHhhhho....",
          "....okhhhhho....",
          "....okkhssso....",
          "....okhssseso...",
          "....okSssssso...",
          ".....oSSsSSo...."],
}
BODY_M = {
 'down': ["...ouutttttTo...",
          "..otuttttttTTo..",
          "..otttttttttTo..",
          "..osTttttttTSo..",
          "..oSoBBBBBBoSo.."],
 'up':   ["...oTttttttTo...",
          "..otTtttttTTTo..",
          "..ottttttttTTo..",
          "..osTttttttTSo..",
          "..oSoBBBBBBoSo.."],
 'side': [".....otuttto....",
          ".....otttTto....",
          ".....otTtTto....",
          ".....oTTsTTo....",
          ".....oBBBBBo...."],
}
# feminino: cabelo longo sempre
HEAD_F = {
 'down': ["................",
          "......oooo......",
          ".....ohHHho.....",
          "....ohHhhhho....",
          "...ohhhhhhhko...",
          "...ohsssssSho...",
          "...ohsesseSho...",
          "...ohsssssSko...",
          "...ohhSsSSkho..."],
 'up':   ["................",
          "......oooo......",
          ".....ohHHho.....",
          "....ohHhhhho....",
          "...ohhHhhhhko...",
          "...ohhhhhhhko...",
          "...ohhhhhhkko...",
          "...ohhhhhhkko...",
          "...ohhhhhhkko..."],
 'side': ["................",
          "......oooo......",
          ".....ohHHHo.....",
          "....ohHhhhho....",
          "...ohkhhhhho....",
          "...ohkkhssso....",
          "...ohkhssseso...",
          "...ohkSssssso...",
          "...ohkkoSsSSo..."],
}
BODY_F = {
 'down': ["..ohhutttTkhho..",
          "..ohhtttttTkho..",
          "..oshtttttTTso..",
          "..osoTtttTToSo..",
          "....oBBBBBBo...."],
 'up':   ["..otkhhhhhkkTo..",
          "..otkkhhhkkTTo..",
          "..osttkkkkTTso..",
          "..osoTtttTToSo..",
          "....oBBBBBBo...."],
 'side': ["...ohkotutto....",
          "...ohkotttTo....",
          "....okotTsTo....",
          ".....oTTTTo.....",
          ".....oBBBBo....."],
}
LEGS = {
 'down': {
  'idle': ["....oppppPPo....",
           "....opppoPPo....",
           "....oppo.oPo....",
           "....oppo.oPo....",
           "....obbo.obo....",
           "....oooo.ooo....",
           "................"],
  'a':    ["....oppppPPo....",
           "....opppoPPo....",
           "....oppo.oPo....",
           "....oppo.obo....",
           "....oppo.ooo....",
           "....obbo........",
           "....oooo........"],
  'b':    ["....oppppPPo....",
           "....opppoPPo....",
           "....oppo.oPo....",
           "....obbo.oPo....",
           "....oooo.oPo....",
           ".........obo....",
           ".........ooo...."]},
 'side': {
  'idle': ["......oppPo.....",
           "......oppPo.....",
           "......oppPo.....",
           "......oppPo.....",
           "......obbbbo....",
           "......oooooo....",
           "................"],
  'a':    [".....oppppo.....",
           ".....oPPoppo....",
           "....oPPo.oppo...",
           "....oPo...oppo..",
           "...obbo...obbbo.",
           "...ooo....ooooo.",
           "................"],
  'b':    [".....oppppo.....",
           ".....oppoPPo....",
           "....oppo.oPPo...",
           "....opo...oPPo..",
           "...obbo...obbbo.",
           "...ooo....ooooo.",
           "................"]},
}
LEGS['up'] = LEGS['down']
FRAMES = ['idle', 'a', 'idle', 'b']

SKINS = {
 'clara':  [hx('e6b893'), hx('c48c66'), hx('8e5a3c')],
 'parda':  [hx('b97d55'), hx('8e5838'), hx('5e3622')],
 'negra':  [hx('7d4c32'), hx('5a3320'), hx('3a2014')],
}
HAIRS = {
 'preto':  [hx('3a302c'), hx('221c1b'), hx('120e10')],
 'castanho': [hx('7a5232'), hx('553620'), hx('2e1c12')],
 'loiro':  [hx('dcc07a'), hx('b38f4c'), hx('6e5428')],
 'ruivo':  [hx('b8653a'), hx('8a4424'), hx('4e2414')],
}

def look(skin, hair, shirt, pants, shoes=None):
    s = SKINS[skin]; h = HAIRS[hair]
    return {'o': OUT, 's': s[0], 'S': s[1], 'e': hx('1a1416'),
            'H': h[0], 'h': h[1], 'k': h[2],
            'u': shirt[3], 't': shirt[2], 'T': shirt[1],
            'B': hx('2a1f1a'), 'p': pants[2], 'P': pants[1],
            'b': (shoes or [hx('1e1a1a'), hx('2e2626')])[1]}

def sprite(sex, d, frame, cols, bald=False):
    head = (HEAD_F if sex == 'f' else HEAD_M)['side' if d in ('left', 'right') else d]
    body = (BODY_F if sex == 'f' else BODY_M)['side' if d in ('left', 'right') else d]
    legs = LEGS['side' if d in ('left', 'right') else d][frame]
    rows = head + body + legs
    cv = Canvas(16, 21)
    for j, r in enumerate(rows):
        r = (r + '................')[:16]
        for i, ch in enumerate(r):
            if ch == '.': continue
            c = cols.get(ch)
            if bald and ch in 'hHk': c = cols['s'] if ch != 'k' else cols['S']
            cv.set(i, j, c)
    if d == 'left':
        cv.img = cv.img.transpose(Image.FLIP_LEFT_RIGHT); cv.px = cv.img.load()
    return cv

def sheet(sex, cols):
    """4 linhas (baixo, cima, direita, esquerda) x 4 quadros"""
    out = Canvas(16 * 4, 21 * 4)
    for r, d in enumerate(['down', 'up', 'right', 'left']):
        for f, fr in enumerate(FRAMES):
            out.paste(sprite(sex, d, fr, cols), f * 16, r * 21)
    return out

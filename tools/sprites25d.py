# Folhas de sprites 2.5D (estilo Diablo/UO): bonecos montados no Blender só como "modelo de desenho",
# renderizados em 8 direções x (parado, andar, atacar) e depois convertidos em pixel art (paleta reduzida,
# sombreamento em faixas e contorno escuro), como os sprites pré-renderizados e retocados dos anos 90.
# uso: python3 tools/sprites25d.py <saida> [tipo ...]
import bpy, math, sys, os
from mathutils import Vector, Euler, Quaternion
args = [a for a in sys.argv[1:]]
OUT = args[0] if args else '/tmp/sheets'; KINDS = args[1:] or ['knight']
RAW = os.path.join(OUT, 'raw'); os.makedirs(RAW, exist_ok=True)
RX, RY = 200, 300

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'; sc.cycles.samples = 12; sc.cycles.device = 'CPU'; sc.cycles.use_denoising = False
    sc.render.film_transparent = True; sc.render.resolution_x = RX; sc.render.resolution_y = RY
    sc.view_settings.view_transform = 'Standard'
    cam = bpy.data.cameras.new('cam'); cam.type = 'ORTHO'; cam.ortho_scale = 2.4
    co = bpy.data.objects.new('cam', cam); sc.collection.objects.link(co); sc.camera = co
    el, az, d = math.radians(30), math.radians(45), 10
    co.location = (d*math.cos(el)*math.sin(az), -d*math.cos(el)*math.cos(az), d*math.sin(el)+.95)
    co.rotation_euler = Euler((math.radians(60), 0, az), 'XYZ')
    sun = bpy.data.lights.new('sun', 'SUN'); sun.energy = 3.6; sun.angle = math.radians(5)
    so = bpy.data.objects.new('sun', sun); sc.collection.objects.link(so); so.rotation_euler = Euler((math.radians(42), 0, math.radians(-60)), 'XYZ')
    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
    w.node_tree.nodes['Background'].inputs[0].default_value = (.5, .52, .56, 1); w.node_tree.nodes['Background'].inputs[1].default_value = .55

MATS = {}
def mat(name, rgb, rough=.8, metal=0., noise=0., emit=None):
    if name in MATS: return MATS[name]
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; b = nt.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*rgb, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if emit: b.inputs['Emission Color'].default_value = (*emit, 1); b.inputs['Emission Strength'].default_value = 3
    if noise:
        tex = nt.nodes.new('ShaderNodeTexNoise'); tex.inputs['Scale'].default_value = 200; bump = nt.nodes.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = noise
        nt.links.new(tex.outputs['Fac'], bump.inputs['Height']); nt.links.new(bump.outputs['Normal'], b.inputs['Normal'])
    MATS[name] = m; return m

ROOT = None
def link(o):
    o.parent = ROOT; return o
def meta(name, material, parts, res=.035):
    mb = bpy.data.metaballs.new(name); mb.resolution = res; mb.render_resolution = res; mb.threshold = .35
    ob = bpy.data.objects.new(name, mb); bpy.context.scene.collection.objects.link(ob); link(ob)
    for p in parts:
        if p[0] == 'seg':
            _, a, b, ra, rb = p; a, b = Vector(a), Vector(b); n = max(2, int((b-a).length/.035)+1)
            for i in range(n):
                t = i/(n-1); e = mb.elements.new(); e.co = a.lerp(b, t); e.radius = (ra+(rb-ra)*t)*1.45
        else:
            _, c, r = p; e = mb.elements.new(); e.type = 'ELLIPSOID'; e.co = c; m_ = max(r); e.radius = m_*1.45; e.size_x, e.size_y, e.size_z = r[0]/m_, r[1]/m_, r[2]/m_
    ob.data.materials.append(material); return ob
def prim(kind, material, loc, scale=(1, 1, 1), rot=None, **kw):
    getattr(bpy.ops.mesh, 'primitive_%s_add' % kind)(location=loc, **kw); o = bpy.context.object; o.scale = scale
    if rot is not None: o.rotation_mode = 'QUATERNION'; o.rotation_quaternion = rot
    o.data.materials.append(material)
    if kind in ('cylinder', 'uv_sphere', 'cone'): bpy.ops.object.shade_smooth()
    return link(o)
def along(a, b):  # quaternion que alinha Z com o vetor a->b
    return (Vector(b)-Vector(a)).normalized().to_track_quat('Z', 'Y')

# ---------- esqueleto com pose ----------
def limb(start, a1, a2, l1, l2, side=0.):
    s = Vector(start); d1 = Vector((side, -math.sin(a1), -math.cos(a1))).normalized(); m = s+d1*l1
    d2 = Vector((side*.5, -math.sin(a2), -math.cos(a2))).normalized(); e = m+d2*l2; return s, m, e, d2
def skeleton(pose):
    bob = pose.get('bob', 0); lean = pose.get('lean', 0)
    J = {}
    for side, sx in (('R', .095), ('L', -.095)):
        a = math.radians(pose['leg'+side]); k = math.radians(pose.get('knee'+side, 0))
        J['hip'+side], J['knee'+side], J['ankle'+side], _ = limb((sx, 0, .93+bob), a, a-k, .43, .41)
    for side, sx, out in (('R', .2, .12), ('L', -.2, -.1)):
        a = math.radians(pose['arm'+side]); e = math.radians(pose.get('elb'+side, 15))
        J['sh'+side], J['elb'+side], J['hand'+side], J['fdir'+side] = limb((sx, -lean*.1, 1.44+bob), a, a+e, .29, .27, out)
    J['bob'] = bob; return J

def build_body(J, skin, top, legs, boots, female=False, sleeves=True):
    sk = mat('skin', skin, .6); L = []
    for s in 'RL': L += [('seg', J['hip'+s], J['knee'+s], .085, .07), ('seg', J['knee'+s], J['ankle'+s], .07, .055)]
    meta('Legs', legs, L)
    B = []
    for s in 'RL':
        an = J['ankle'+s]; B += [('seg', an+Vector((0, 0, .17)), an, .066, .06), ('seg', an, an+Vector((0, -.11, -.02)), .06, .05)]
    meta('Boot', boots, B)
    b = J['bob']; T = [('ell', (0, 0, 1.24+b), (.19 if not female else .16, .12, .26)), ('ell', (0, 0, .98+b), (.17 if not female else .19, .11, .13)), ('seg', (0, 0, 1.4+b), (0, 0, 1.52+b), .07, .06)]
    if female: T += [('ell', (.07, -.08, 1.3+b), (.06, .05, .05)), ('ell', (-.07, -.08, 1.3+b), (.06, .05, .05))]
    A = []
    for s in 'RL': A += [('seg', J['sh'+s], J['elb'+s], .07, .06), ('seg', J['elb'+s], J['hand'+s], .06, .05)]
    meta('Top', top, T+(A if sleeves else []))
    if not sleeves: meta('Arms', sk, A)
    meta('Hands', sk, [('ell', J['handR'], (.045, .045, .055)), ('ell', J['handL'], (.045, .045, .055))])
    meta('Head', sk, [('ell', (0, -.01, 1.66+b), (.095, .105, .12)), ('ell', (0, -.085, 1.63+b), (.035, .04, .045)), ('seg', (0, 0, 1.5+b), (0, 0, 1.58+b), .06, .06)])
def hair(J, color, long=False, beard=False):
    b = J['bob']; h = mat('hair', color, .9); P = [('ell', (0, .015, 1.71+b), (.105, .105, .09))]
    if long: P += [('ell', (0, .06, 1.52+b), (.12, .07, .2))]
    meta('Hair', h, P)
    if beard: meta('Beard', h, [('ell', (0, -.08, 1.58+b), (.08, .06, .07))])
def sword(J):
    h, d = J['handR'], J['fdirR']; steel = mat('steel', (.75, .76, .8), .25, 1.); gold = mat('gold', (.8, .6, .2), .3, 1.)
    q = along((0, 0, 0), d)
    prim('cube', gold, h+d*.03, (.2, .04, .03), rot=q, size=1)
    prim('cube', steel, h+d*.42, (.07, .02, .7), rot=q, size=1)
def shield(J, cross=True):
    e, h = J['elbL'], J['handL']; c = e.lerp(h, .5)+Vector((-.08, -.05, 0))
    wht = mat('shw', (.86, .84, .78), .6); red = mat('shr', (.6, .06, .05), .6)
    prim('uv_sphere', wht, c, (.07, .2, .28), rot=Euler((0, 0, math.radians(-20))).to_quaternion(), radius=1, segments=20, ring_count=12)
    if cross:
        q = Euler((0, 0, math.radians(-20))).to_quaternion()
        prim('cube', red, c+Vector((-.04, -.02, .02)), (.01, .03, .2), rot=q, size=1); prim('cube', red, c+Vector((-.04, -.02, .08)), (.01, .13, .03), rot=q, size=1)
def belt(z, material, rx=.215, ry=.16):
    o = prim('cylinder', material, (0, 0, z), (rx, ry, 1), radius=1, depth=.045, vertices=24)

def knight(J):
    mail = mat('mail', (.42, .43, .46), .5, .9, noise=1.); tab = mat('tab', (.86, .84, .78), .85, noise=.1); red = mat('red', (.6, .06, .05), .8)
    build_body(J, (.8, .58, .44), mail, mail, mat('boots', (.18, .14, .1), .7)); b = J['bob']
    meta('Tabard', tab, [('ell', (0, -.005, 1.2+b), (.205, .135, .27)), ('ell', (0, 0, .78+b), (.2, .135, .22))])
    prim('cube', red, (0, -.195, 1.06+b), (.07, .01, .44), size=1); prim('cube', red, (0, -.195, 1.2+b), (.26, .01, .07), size=1)
    belt(.97+b, mat('belt', (.25, .15, .08), .6))
    helm = mat('helm', (.6, .62, .66), .3, 1.); prim('cylinder', helm, (0, 0, 1.69+b), radius=.115, depth=.26, vertices=16); prim('uv_sphere', helm, (0, 0, 1.81+b), (1, 1, .5), radius=.115, segments=16, ring_count=8)
    prim('cube', mat('slit', (.02, .02, .02), .9), (0, -.115, 1.7+b), (.085, .005, .01), size=1)
    sword(J); shield(J)
def peasant(J, i=0):
    tun = [(.42, .3, .16), (.3, .36, .22), (.5, .44, .3)][i % 3]
    build_body(J, [(.8, .58, .44), (.62, .42, .3), (.42, .28, .2)][i % 3], mat('tunic', tun, .9, noise=.2), mat('trou', (.28, .22, .16), .9), mat('boots', (.22, .15, .1), .8))
    meta('Skirt', mat('tunic', tun), [('ell', (0, 0, .82+J['bob']), (.2, .14, .16))]); belt(.97+J['bob'], mat('belt', (.2, .12, .06), .6))
    hair(J, [(.25, .15, .07), (.08, .06, .05), (.55, .4, .2)][i % 3], beard=(i % 2 == 0))
def skel(J):
    bone = mat('bone', (.82, .78, .66), .7, noise=.4); dark = mat('dk', (.05, .04, .03), .9); b = J['bob']; S = []
    for s in 'RL': S += [('seg', J['hip'+s], J['knee'+s], .035, .03), ('seg', J['knee'+s], J['ankle'+s], .03, .025), ('seg', J['sh'+s], J['elb'+s], .03, .028), ('seg', J['elb'+s], J['hand'+s], .028, .025)]
    S += [('ell', (0, 0, .96+b), (.14, .08, .06)), ('seg', (0, .02, .98+b), (0, .03, 1.5+b), .03, .03), ('seg', (-.2, 0, 1.45+b), (.2, 0, 1.45+b), .035, .035)]
    for k in range(5): S.append(('ell', (0, 0, 1.38-k*.07+b), (.15-k*.01, .1, .02)))
    meta('Bones', bone, S, res=.025)
    meta('Skull', bone, [('ell', (0, -.01, 1.66+b), (.09, .1, .1)), ('ell', (0, -.06, 1.59+b), (.06, .06, .05))])
    prim('uv_sphere', dark, (.035, -.09, 1.66+b), radius=.022, segments=8, ring_count=6); prim('uv_sphere', dark, (-.035, -.09, 1.66+b), radius=.022, segments=8, ring_count=6)
    sword(J)
KIND = {'knight': knight, 'peasant': peasant, 'skeleton': skel}

# ---------- animações ----------
def pose_idle(f): return dict(legR=0, legL=0, armR=8, armL=-5, elbR=20, elbL=25, bob=0)
def pose_walk(f, n=8):
    p = f/n*math.tau; s = math.sin(p)
    return dict(legR=20*s, legL=-20*s, kneeR=max(0, -s)*28+6, kneeL=max(0, s)*28+6, armR=-22*s+5, armL=22*s-5, elbR=20, elbL=25, bob=-abs(math.cos(p))*.025+.012)
ATK = [(-20, 30), (40, 60), (150, 40), (170, 10), (90, 0), (30, 15)]
def pose_attack(f):
    a, e = ATK[f]; return dict(legR=-10, legL=14, kneeR=10, kneeL=5, armR=a, elbR=e, armL=25, elbL=40, bob=-.01, lean=1)
ANIMS = [('idle', 1, lambda f: pose_idle(f)), ('walk', 8, pose_walk), ('attack', 6, pose_attack)]

def render_all(kind):
    global ROOT
    for d in range(8):
        for an, nf, pf in ANIMS:
            for f in range(nf):
                reset(); MATS.clear()
                ROOT = bpy.data.objects.new('root', None); bpy.context.scene.collection.objects.link(ROOT)
                J = skeleton(pf(f)); KIND[kind](J)
                ROOT.rotation_euler = (0, 0, math.radians(d*45))
                bpy.context.scene.render.filepath = os.path.join(RAW, f'{kind}_{d}_{an}_{f}.png'); bpy.ops.render.render(write_still=True)

for k in KINDS: render_all(k)

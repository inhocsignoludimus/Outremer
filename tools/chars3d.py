# Personagens 3D (metaballs) renderizados como sprites isométricos, estilo Ultima Online.
# uso: python3 tools/chars3d.py <pasta_saida>
import bpy, math, sys, os
from mathutils import Vector, Euler
OUT = sys.argv[-1] if len(sys.argv) > 1 else '/tmp/chars'
os.makedirs(OUT, exist_ok=True)

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'; sc.cycles.samples = 24; sc.cycles.device = 'CPU'
    sc.render.film_transparent = True
    sc.render.resolution_x = 200; sc.render.resolution_y = 300; sc.render.resolution_percentage = 100
    sc.view_settings.view_transform = 'Standard'
    # câmera isométrica 2:1 (elevação 30°, azimute 45°)
    cam = bpy.data.cameras.new('cam'); cam.type = 'ORTHO'; cam.ortho_scale = 2.4
    co = bpy.data.objects.new('cam', cam); sc.collection.objects.link(co); sc.camera = co
    el, az, d = math.radians(30), math.radians(45), 10
    co.location = (d*math.cos(el)*math.sin(az), -d*math.cos(el)*math.cos(az), d*math.sin(el)+.95)
    co.rotation_euler = Euler((math.radians(60), 0, az), 'XYZ')
    # sol vindo do alto à esquerda da tela + luz ambiente
    sun = bpy.data.lights.new('sun', 'SUN'); sun.energy = 3.2; sun.angle = math.radians(8)
    so = bpy.data.objects.new('sun', sun); sc.collection.objects.link(so)
    so.rotation_euler = Euler((math.radians(40), 0, math.radians(-60)), 'XYZ')
    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
    w.node_tree.nodes['Background'].inputs[0].default_value = (.55, .58, .62, 1); w.node_tree.nodes['Background'].inputs[1].default_value = .7

def mat(name, rgb, rough=.8, metal=0., noise=0.):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree
    b = nt.nodes['Principled BSDF']; b.inputs['Base Color'].default_value = (*rgb, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if noise:
        tex = nt.nodes.new('ShaderNodeTexNoise'); tex.inputs['Scale'].default_value = 220; bump = nt.nodes.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = noise
        nt.links.new(tex.outputs['Fac'], bump.inputs['Height']); nt.links.new(bump.outputs['Normal'], b.inputs['Normal'])
    return m

def meta(name, material, parts, res=.03):
    mb = bpy.data.metaballs.new(name); mb.resolution = res; mb.render_resolution = res; mb.threshold = .35
    ob = bpy.data.objects.new(name, mb); bpy.context.scene.collection.objects.link(ob)
    for p in parts:
        kind = p[0]
        if kind == 'seg':  # segmento de bolas: (a, b, raio_a, raio_b)
            _, a, b, ra, rb = p; n = max(2, int((Vector(b)-Vector(a)).length/.035)+1)
            for i in range(n):
                t = i/(n-1); e = mb.elements.new(); e.co = Vector(a).lerp(Vector(b), t); e.radius = (ra+(rb-ra)*t)*1.45
        elif kind == 'ell':  # elipsoide: (centro, (rx,ry,rz))
            _, c, r = p; e = mb.elements.new(); e.type = 'ELLIPSOID'; e.co = c; m_ = max(r); e.radius = m_*1.45; e.size_x, e.size_y, e.size_z = r[0]/m_, r[1]/m_, r[2]/m_
    ob.data.materials.append(material); return ob

def belt(material, z=.96, rx=.2, ry=.15):
    bpy.ops.mesh.primitive_cylinder_add(radius=1, depth=.045, location=(0, 0, z), vertices=24); o = bpy.context.object; o.scale = (rx, ry, 1); o.data.materials.append(material); bpy.ops.object.shade_smooth(); return o
def cube(name, material, loc, size, rot=(0,0,0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot); o = bpy.context.object; o.scale = size; o.name = name; o.data.materials.append(material); return o
def cylinder(name, material, loc, r, h, rot=(0,0,0), verts=16):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, location=loc, rotation=rot, vertices=verts); o = bpy.context.object; o.name = name; o.data.materials.append(material); bpy.ops.object.shade_smooth(); return o
def sphere(name, material, loc, r, scale=(1,1,1)):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=20, ring_count=12); o = bpy.context.object; o.scale = scale; o.name = name; o.data.materials.append(material); bpy.ops.object.shade_smooth(); return o

# ---------------- corpo ----------------
SKIN = [(.80, .58, .44), (.62, .42, .30), (.42, .28, .20)]
def body(skin, top, legs, boots, female=False, sleeve=True, armsdown=False):
    sk = mat('skin', skin, .6)
    # pernas
    L = [('seg', (.09, 0, .92), (.1, .02, .5), .085, .07), ('seg', (.1, .02, .5), (.1, 0, .1), .07, .055),
         ('seg', (-.09, 0, .92), (-.11, -.03, .5), .085, .07), ('seg', (-.11, -.03, .5), (-.11, -.02, .1), .07, .055)]
    meta('Legs', legs, L)
    meta('Boot', boots, [('seg', (.1, 0, .24), (.1, 0, .05), .065, .06), ('seg', (.1, 0, .04), (.1, -.1, .04), .06, .05),
                         ('seg', (-.11, -.02, .24), (-.11, -.02, .05), .065, .06), ('seg', (-.11, -.02, .04), (-.11, -.12, .04), .06, .05)])
    # tronco e braços
    sh = .2 if not female else .17
    T = [('ell', (0, 0, 1.24), (.19 if not female else .16, .12, .26)), ('ell', (0, 0, .98), (.17 if not female else .19, .11, .13)), ('seg', (0, 0, 1.4), (0, 0, 1.52), .07, .06)]
    if female: T += [('ell', (.07, -.08, 1.3), (.06, .05, .05)), ('ell', (-.07, -.08, 1.3), (.06, .05, .05))]
    ax = .06 if armsdown else .0
    A = [('seg', (sh, 0, 1.44), (sh+.06-ax, -.02, 1.16), .07, .06), ('seg', (sh+.06-ax, -.02, 1.16), (sh+.02-ax, -.12, .95), .06, .05),
         ('seg', (-sh, 0, 1.44), (-sh-.06+ax, .0, 1.16), .07, .06), ('seg', (-sh-.06+ax, 0, 1.16), (-sh-.05+ax, -.06, .93), .06, .05)]
    meta('Top', top, T + (A if sleeve else []))
    if not sleeve: meta('Arms', sk, A)
    meta('Hands', sk, [('ell', (sh+.02-ax, -.14, .9), (.045, .045, .055)), ('ell', (-sh-.05+ax, -.08, .89), (.045, .045, .055))])
    # cabeça
    head = meta('Head', sk, [('ell', (0, -.01, 1.66), (.095, .105, .12)), ('ell', (0, -.08, 1.62), (.05, .05, .05)), ('seg', (0, 0, 1.5), (0, 0, 1.58), .06, .06)])
    return sk

def hair(color, style='short', beard=False):
    h = mat('hair', color, .9)
    P = [('ell', (0, .015, 1.71), (.105, .105, .09))]
    if style == 'long': P += [('ell', (0, .06, 1.52), (.12, .07, .2))]
    meta('Hair', h, P)
    if beard: meta('Beard', h, [('ell', (0, -.08, 1.58), (.08, .06, .07))])

def robe(color, trim=None, hood=False):
    m = mat('robe', color, .85, noise=.15)
    meta('Robe', m, [('ell', (0, 0, 1.22), (.21, .14, .3)), ('ell', (0, 0, .7), (.24, .18, .42)), ('ell', (0, 0, .25), (.27, .21, .22)),
                     ('seg', (.21, 0, 1.44), (.29, -.04, 1.12), .08, .08), ('seg', (.29, -.04, 1.12), (.25, -.13, .96), .08, .09),
                     ('seg', (-.21, 0, 1.44), (-.28, 0, 1.12), .08, .08), ('seg', (-.28, 0, 1.12), (-.26, -.06, .95), .08, .09)])
    if trim: belt(mat('trim', trim, .4, .6), .98, .27, .2)
    if hood: meta('Hood', m, [('ell', (0, .03, 1.7), (.13, .13, .13)), ('ell', (0, .06, 1.55), (.17, .12, .07))])

def sword(x=.24, y=-.17, z=.88):
    steel = mat('steel', (.75, .76, .8), .25, 1.); gold = mat('gold', (.8, .6, .2), .3, 1.); grip = mat('grip', (.25, .15, .08), .7)
    cylinder('grip', grip, (x, y, z), .018, .14)
    cube('guard', gold, (x, y, z-.08), (.16, .03, .025))
    cube('blade', steel, (x, y, z-.42), (.045, .012, .62))
def shield(cross=True):
    wht = mat('shw', (.86, .84, .78), .6); red = mat('shr', (.6, .06, .05), .6)
    s = sphere('shield', wht, (-.31, -.06, 1.06), .22, (.08, .85, 1.25)); s.rotation_euler = (0, 0, math.radians(-20))
    if cross:
        cube('cr1', red, (-.335, -.08, 1.08), (.02, .06, .36), (0, 0, math.radians(-20))); cube('cr2', red, (-.335, -.08, 1.14), (.02, .26, .06), (0, 0, math.radians(-20)))
def staff():
    wood = mat('staff', (.35, .22, .12), .8); cylinder('staff', wood, (.27, -.14, .95), .022, 1.9)
    gem = mat('gem', (.2, .45, 1.), .1); gem.node_tree.nodes['Principled BSDF'].inputs['Emission Color'].default_value = (.2, .5, 1, 1); gem.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = 3
    sphere('gem', gem, (.27, -.14, 1.92), .05)

def render(name):
    bpy.context.scene.render.filepath = os.path.join(OUT, name + '.png'); bpy.ops.render.render(write_still=True)

# ---------------- tipos ----------------
def knight():
    reset(); mail = mat('mail', (.42, .43, .46), .5, .9, noise=1.); tab = mat('tab', (.86, .84, .78), .85, noise=.1); red = mat('red', (.6, .06, .05), .8)
    body(SKIN[0], mail, mail, mat('boots', (.18, .14, .1), .7))
    meta('Tabard', tab, [('ell', (0, -.005, 1.2), (.205, .135, .27)), ('ell', (0, 0, .78), (.2, .135, .22))])
    cube('crossV', red, (0, -.2, 1.08), (.06, .01, .4)); cube('crossH', red, (0, -.2, 1.2), (.22, .01, .06))
    belt(mat('belt', (.25, .15, .08), .6), .97, .215, .16)
    helm = mat('helm', (.6, .62, .66), .3, 1.); cylinder('helm', helm, (0, 0, 1.69), .115, .26); sphere('helmtop', helm, (0, 0, 1.81), .115, (1, 1, .5))
    cube('visor', mat('slit', (.02, .02, .02), .9), (0, -.115, 1.7), (.17, .01, .02))
    sword(); shield(); render('knight')
def guard():
    reset(); mail = mat('mail', (.42, .43, .46), .5, .9, noise=1.); tab = mat('tab', (.45, .08, .07), .85, noise=.1)
    body(SKIN[1], mail, mat('hose', (.2, .18, .16), .8), mat('boots', (.15, .11, .08), .7))
    meta('Tabard', tab, [('ell', (0, -.005, 1.2), (.205, .135, .27)), ('ell', (0, 0, .78), (.2, .135, .22))])
    helm = mat('helm', (.6, .62, .66), .3, 1.); sphere('helm', helm, (0, .0, 1.72), .115, (1, 1, .9)); cube('nasal', helm, (0, -.115, 1.66), (.02, .02, .1))
    hair((.2, .12, .06), beard=True)
    sp = mat('spear', (.35, .22, .12), .8); cylinder('spear', sp, (.24, -.15, 1.05), .018, 2.1); cube('tip', mat('st', (.75, .76, .8), .25, 1.), (.24, -.15, 2.12), (.04, .01, .14))
    render('guard')
def peasant(i=0):
    reset(); tun = [(.42, .3, .16), (.3, .36, .22), (.5, .44, .3)][i % 3]
    body(SKIN[i % 3], mat('tunic', tun, .9, noise=.2), mat('trou', (.28, .22, .16), .9), mat('boots', (.22, .15, .1), .8), armsdown=True)
    meta('Skirt', mat('tunic2', tun, .9, noise=.2), [('ell', (0, 0, .82), (.2, .14, .16))])
    belt(mat('belt', (.2, .12, .06), .6), .97, .215, .16)
    hair([(.25, .15, .07), (.08, .06, .05), (.55, .4, .2)][i % 3], beard=(i % 2 == 0)); render('peasant%d' % i)
def woman(i=0):
    reset(); dress = [(.25, .3, .5), (.5, .15, .15), (.3, .4, .25)][i % 3]
    sk = SKIN[(i+1) % 3]; body(sk, mat('dress', dress, .85, noise=.15), mat('legs', sk, .6), mat('shoe', (.2, .14, .1), .8), female=True, armsdown=True)
    meta('Dress', mat('dress2', dress, .85, noise=.15), [('ell', (0, 0, .62), (.22, .18, .42)), ('ell', (0, 0, .2), (.26, .21, .2))])

    hair([(.45, .25, .1), (.1, .07, .05), (.75, .6, .3)][i % 3], style='long'); render('woman%d' % i)
def mage():
    reset(); body(SKIN[0], mat('in', (.2, .15, .35), .9), mat('in2', (.2, .15, .35), .9), mat('boots', (.15, .1, .08), .8))
    robe((.22, .14, .42), trim=(.75, .6, .2), hood=False)
    hat = mat('hat', (.22, .14, .42), .85); bpy.ops.mesh.primitive_cone_add(radius1=.17, depth=.42, location=(0, .02, 1.95), vertices=24); c = bpy.context.object; c.data.materials.append(hat); c.rotation_euler = (math.radians(-12), 0, 0)
    cylinder('brim', hat, (0, 0, 1.76), .24, .025, verts=24)
    hair((.85, .85, .85), style='long', beard=True); staff(); render('mage')
def lord():
    reset(); body(SKIN[0], mat('doub', (.5, .08, .08), .7), mat('hose', (.15, .1, .1), .8), mat('boots', (.15, .1, .08), .8))
    robe((.55, .08, .1), trim=(.85, .65, .2))
    meta('Ermine', mat('erm', (.92, .9, .86), .9), [('ell', (0, 0, 1.46), (.25, .17, .07))])
    gold = mat('gold', (.85, .65, .2), .25, 1.); cylinder('crown', gold, (0, 0, 1.79), .1, .07, verts=12)
    for k in range(6): a = k/6*math.tau; cube('pt%d' % k, gold, (math.cos(a)*.1, math.sin(a)*.1, 1.85), (.03, .03, .06))
    hair((.5, .45, .4), beard=True); render('lord')
def skeleton():
    reset(); bone = mat('bone', (.82, .78, .66), .7, noise=.4); dark = mat('dk', (.05, .04, .03), .9)
    S = [('seg', (.09, 0, .92), (.1, .02, .5), .035, .03), ('seg', (.1, .02, .5), (.1, 0, .06), .03, .025),
         ('seg', (-.09, 0, .92), (-.11, -.03, .5), .035, .03), ('seg', (-.11, -.03, .5), (-.11, -.02, .06), .03, .025),
         ('ell', (0, 0, .96), (.14, .08, .06)), ('seg', (0, .02, .98), (0, .03, 1.5), .03, .03),
         ('seg', (.19, 0, 1.44), (.24, -.02, 1.16), .03, .028), ('seg', (.24, -.02, 1.16), (.22, -.14, .95), .028, .025),
         ('seg', (-.19, 0, 1.44), (-.25, 0, 1.16), .03, .028), ('seg', (-.25, 0, 1.16), (-.24, -.08, .94), .028, .025),
         ('seg', (-.2, 0, 1.45), (.2, 0, 1.45), .035, .035)]
    for k in range(5):
        z = 1.38-k*.07; S.append(('ell', (0, 0, z), (.15-k*.01, .1, .02)))
    meta('Bones', bone, S, res=.02)
    meta('Skull', bone, [('ell', (0, -.01, 1.66), (.09, .1, .1)), ('ell', (0, -.06, 1.59), (.06, .06, .05))])
    sphere('eyeL', dark, (.035, -.09, 1.66), .022); sphere('eyeR', dark, (-.035, -.09, 1.66), .022)
    sword(.22, -.16, .87); render('skeleton')

if __name__ == '__main__':
    sel=os.environ.get("ONLY"); [f() for n,f in [("knight",knight),("guard",guard),("mage",mage),("lord",lord),("skeleton",skeleton)] if not sel or sel==n]
    if sel: sys.exit(0)
    for i in range(3): peasant(i); woman(i)

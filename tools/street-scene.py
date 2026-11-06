# Builds the French Quarter street SVG: a night view down Bourbon Street.
import math
VX, VY = 800, 585          # vanishing point
NEAR_L, NEAR_R = 470, 1130 # inner edges of the near townhouses
GROUND = 760
o = []
def P(*pts): return 'M' + 'L'.join(f'{x:.1f} {y:.1f}' for x, y in pts) + 'z'
def toward(x, y, t):        # point a fraction t of the way to the vanishing point
    return (x + (VX - x) * t, y + (VY - y) * t)

o.append('<svg class="street" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice">')
o.append('''<defs>
<linearGradient id="gSkyNight" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d0420"/><stop offset=".55" stop-color="#2a0b45"/><stop offset=".8" stop-color="#5a1d52"/><stop offset="1" stop-color="#2a0e22"/></linearGradient>
<linearGradient id="gStreet" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1020" stop-opacity=".2"/><stop offset="1" stop-color="#120610"/></linearGradient>
<linearGradient id="gRose" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2a1220"/><stop offset="1" stop-color="#6e3248"/></linearGradient>
<linearGradient id="gSage" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#10221e"/><stop offset="1" stop-color="#2f5a4e"/></linearGradient>
<linearGradient id="gFade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#0a0410" stop-opacity=".55"/></linearGradient>
<linearGradient id="gFadeR" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#0a0410" stop-opacity=".55"/></linearGradient>
<radialGradient id="gDoor" cx="50%" cy="70%" r="75%"><stop offset="0" stop-color="#ffd890"/><stop offset=".55" stop-color="#e08a3a"/><stop offset="1" stop-color="#5a2410"/></radialGradient>
<radialGradient id="gNeonP" r=".5"><stop offset="0" stop-color="#c77dff" stop-opacity=".55"/><stop offset="1" stop-color="#c77dff" stop-opacity="0"/></radialGradient>
<radialGradient id="gNeonG" r=".5"><stop offset="0" stop-color="#3dff9a" stop-opacity=".45"/><stop offset="1" stop-color="#3dff9a" stop-opacity="0"/></radialGradient>
<radialGradient id="gVignette" cx="50%" cy="55%" r="75%"><stop offset=".45" stop-color="#05010a" stop-opacity="0"/><stop offset="1" stop-color="#05010a" stop-opacity=".55"/></radialGradient>
<pattern id="pLace" width="24" height="44" patternUnits="userSpaceOnUse"><rect x="0" width="2.4" height="44" fill="#0b0408"/><path d="M12 8c-6 0-8 7-4 10-5 3-3 10 4 10 7 0 9-7 4-10 4-3 2-10-4-10z" fill="none" stroke="#0b0408" stroke-width="1.8"/><circle cx="12" cy="18" r="2.2" fill="#0b0408"/><path d="M2 36q10-8 20 0M2 40h20" fill="none" stroke="#0b0408" stroke-width="1.6"/></pattern>
<pattern id="pShutter" width="10" height="6" patternUnits="userSpaceOnUse"><rect width="10" height="6" fill="#1d3f33"/><rect y="4" width="10" height="1.4" fill="#0f241d"/></pattern>
<pattern id="pShutterB" width="10" height="6" patternUnits="userSpaceOnUse"><rect width="10" height="6" fill="#203a5a"/><rect y="4" width="10" height="1.4" fill="#0f1e33"/></pattern>
</defs>''')
o.append('<rect width="1600" height="900" fill="url(#gSkyNight)"/>')
o.append('<g class="stars" fill="#fff3d0"><circle cx="620" cy="60" r="1.6"/><circle cx="700" cy="120" r="1.1"/><circle cx="820" cy="40" r="1.4"/><circle cx="940" cy="100" r="1.2"/><circle cx="1010" cy="50" r="1.6"/><circle cx="760" cy="200" r="1"/><circle cx="880" cy="170" r="1.3"/><circle cx="560" cy="150" r="1"/><circle cx="1060" cy="160" r="1.1"/></g>')

# ---- receding buildings down both sides of the street ----
colors = ['#5a2c44', '#3c5248', '#6a4a2c', '#36405e', '#5c2e3a', '#465a3a']
def side(sign):
    x0 = NEAR_L if sign < 0 else NEAR_R
    # facade breaks along the wall, as fractions toward the vanishing point
    ts = [0, .2, .36, .49, .59, .67, .735, .79]
    roof = [170, 250, 200, 280, 230, 300, 260, 320]
    for i in range(len(ts) - 1):
        a, b = ts[i], ts[i + 1]
        top_a = toward(x0, roof[i], a); top_b = toward(x0, roof[i], b)
        bot_a = toward(x0, GROUND, a); bot_b = toward(x0, GROUND, b)
        c = colors[(i + (0 if sign < 0 else 3)) % len(colors)]
        o.append(f'<path d="{P(top_a, top_b, bot_b, bot_a)}" fill="{c}"/>')
        o.append(f'<path d="{P(top_a, top_b, bot_b, bot_a)}" fill="#0a0410" opacity="{0.25 + a * 0.55:.2f}"/>')
        # cornice
        ca, cb = toward(x0, roof[i] - 10, a), toward(x0, roof[i] - 10, b)
        o.append(f'<path d="{P(ca, cb, top_b, top_a)}" fill="#120810"/>')
        # glowing doors and windows: two floors, two openings each
        for floor_y, h in ((GROUND - 150, 120), (roof[i] + 60 + (GROUND - roof[i]) * 0.18, 95)):
            if floor_y + h > GROUND - 160 and floor_y < GROUND - 160: continue
            for k in (0.28, 0.66):
                t1 = a + (b - a) * k; t2 = a + (b - a) * (k + 0.16)
                p1, p2 = toward(x0, floor_y, t1), toward(x0, floor_y, t2)
                p3, p4 = toward(x0, floor_y + h, t2), toward(x0, floor_y + h, t1)
                o.append(f'<path d="{P(p1, p2, p3, p4)}" fill="#ffb45a" opacity="{0.75 - a * 0.5:.2f}"/>')
    # two iron galleries that run the length of the block
    for gy, depth in ((430, 26), (GROUND - 175, 26)):
        a, b = 0.0, ts[-1]
        rail_top_a, rail_top_b = toward(x0, gy - 40, a), toward(x0, gy - 40, b)
        floor_a, floor_b = toward(x0, gy, a), toward(x0, gy, b)
        o.append(f'<path d="{P(rail_top_a, rail_top_b, floor_b, floor_a)}" fill="#0b0408" opacity=".35"/>')
        o.append(f'<path d="M{rail_top_a[0]:.1f} {rail_top_a[1]:.1f}L{rail_top_b[0]:.1f} {rail_top_b[1]:.1f}" stroke="#0b0408" stroke-width="3"/>')
        o.append(f'<path d="M{floor_a[0]:.1f} {floor_a[1]:.1f}L{floor_b[0]:.1f} {floor_b[1]:.1f}" stroke="#0b0408" stroke-width="6"/>')
        # balusters, closer together as they recede
        n = 46
        for j in range(n):
            t = b * (1 - (1 - j / n) ** 1.6)
            p, q = toward(x0, gy - 40, t), toward(x0, gy, t)
            o.append(f'<path d="M{p[0]:.1f} {p[1]:.1f}L{q[0]:.1f} {q[1]:.1f}" stroke="#0b0408" stroke-width="{max(0.6, 2.4 * (1 - t)):.1f}"/>')
        # gallery posts down to the sidewalk
        for j in range(0, 8):
            t = b * (1 - (1 - j / 8) ** 1.6)
            p, q = toward(x0, gy, t), toward(x0, GROUND, t)
            o.append(f'<path d="M{p[0]:.1f} {p[1]:.1f}L{q[0]:.1f} {q[1]:.1f}" stroke="#0b0408" stroke-width="{max(1, 5 * (1 - t)):.1f}"/>')
        # beads hanging off the rail
        for j, col in enumerate(('#8a2be2', '#f0c24a', '#1fae4a')):
            pa, pb = toward(x0, gy - 34 + j * 4, 0.02), toward(x0, gy - 34 + j * 4, b)
            mx, my = (pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2 + 22
            o.append(f'<path d="M{pa[0]:.1f} {pa[1]:.1f}Q{mx:.1f} {my:.1f} {pb[0]:.1f} {pb[1]:.1f}" fill="none" stroke="{col}" stroke-width="4" stroke-linecap="round" stroke-dasharray="0 10" stroke-dashoffset="{-j*3}" opacity=".8"/>')
side(-1); side(1)

# ---- far end of the street: a low row of galleried buildings and a glow ----
o.append(f'<path d="{P(toward(NEAR_L, 320, .79), toward(NEAR_R, 320, .79), toward(NEAR_R, GROUND, .79), toward(NEAR_L, GROUND, .79))}" fill="#1c0a26"/>')
o.append('<ellipse cx="800" cy="600" rx="160" ry="60" fill="#ff9a3c" opacity=".18"/>')

# ---- classy neon: a blade sign that reads JAZZ, and a green CAFE on the right ----
jx, jy = toward(NEAR_L, 470, .2)
o.append(f'<circle cx="{jx+30:.0f}" cy="{jy+70:.0f}" r="90" fill="url(#gNeonP)"/>')
o.append(f'<rect x="{jx+10:.0f}" y="{jy:.0f}" width="40" height="140" rx="6" fill="#140820" stroke="#c77dff" stroke-width="3"/>')
for k, ch in enumerate('JAZZ'):
    o.append(f'<text x="{jx+30:.0f}" y="{jy+30+k*32:.0f}" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="28" fill="#f3dcff" stroke="#c77dff" stroke-width="1">{ch}</text>')
cx, cy = toward(NEAR_R, 470, .2)
o.append(f'<circle cx="{cx-30:.0f}" cy="{cy+50:.0f}" r="80" fill="url(#gNeonG)"/>')
o.append(f'<rect x="{cx-50:.0f}" y="{cy:.0f}" width="40" height="110" rx="6" fill="#08160f" stroke="#3dff9a" stroke-width="3"/>')
for k, ch in enumerate('CAFÉ'):
    o.append(f'<text x="{cx-30:.0f}" y="{cy+27+k*26:.0f}" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="22" fill="#d8ffe8" stroke="#3dff9a" stroke-width=".8">{ch}</text>')

# ---- the two near Creole townhouses, seen straight on ----
def townhouse(x, w, grad, shutter, flip):
    o.append(f'<rect x="{x}" y="0" width="{w}" height="{GROUND}" fill="url(#{grad})"/>')
    o.append(f'<rect x="{x}" y="0" width="{w}" height="{GROUND}" fill="url(#{"gFade" if not flip else "gFadeR"})"/>')
    # tall French doors with open louvered shutters, two floors
    for fy, fh in ((150, 165), (455, 185)):
        for dx in (70, 270):
            X = x + dx if not flip else x + w - dx - 90
            o.append(f'<rect x="{X-26}" y="{fy}" width="24" height="{fh}" fill="url(#{shutter})"/>')
            o.append(f'<rect x="{X+92}" y="{fy}" width="24" height="{fh}" fill="url(#{shutter})"/>')
            o.append(f'<path d="M{X} {fy+fh}V{fy+40}a45 40 0 0 1 90 0V{fy+fh}z" fill="url(#gDoor)"/>')
            o.append(f'<path d="M{X+45} {fy+5}V{fy+fh}M{X} {fy+90}h90M{X} {fy+45}h90" stroke="#2a0e18" stroke-width="4"/>')
            o.append(f'<rect x="{X-6}" y="{fy-14}" width="102" height="10" fill="#e9d8c4" opacity=".25"/>')
    # cast-iron galleries with lace railings
    for gy in (330, 640):
        o.append(f'<rect x="{x}" y="{gy-56}" width="{w}" height="8" fill="#0b0408"/>')
        o.append(f'<rect x="{x}" y="{gy}" width="{w}" height="10" fill="#0b0408"/>')
        o.append(f'<rect x="{x}" y="{gy+10}" width="{w}" height="44" fill="url(#pLace)"/>')
        o.append(f'<rect x="{x}" y="{gy+52}" width="{w}" height="6" fill="#0b0408"/>')
        # lace frieze under the gallery roof
        o.append(f'<path d="M{x} {gy-48}' + ''.join(f'q12 16 24 0' for _ in range(int(w / 24) + 1)) + '" fill="none" stroke="#0b0408" stroke-width="3"/>')
        # hanging ferns
        for fx in range(x + 40, x + w, 150):
            o.append(f'<path d="M{fx} {gy-48}v18" stroke="#0b0408" stroke-width="2"/>')
            o.append(f'<ellipse cx="{fx}" cy="{gy-20}" rx="22" ry="12" fill="#1e4a26"/>')
            o.append(f'<path d="M{fx-22} {gy-20}q-6 18-2 26M{fx-8} {gy-12}q-2 18 2 24M{fx+8} {gy-12}q4 16 0 24M{fx+22} {gy-20}q8 16 2 26" stroke="#2a6a34" stroke-width="5" fill="none" stroke-linecap="round"/>')
        # beads draped over the railing
        for j, col in enumerate(('#8a2be2', '#f0c24a', '#1fae4a')):
            o.append(f'<path d="M{x} {gy+14+j*3}' + ''.join(f'q45 {26+j*4} 90 0' for _ in range(int(w / 90) + 1)) + f'" fill="none" stroke="{col}" stroke-width="5" stroke-linecap="round" stroke-dasharray="0 11" stroke-dashoffset="{-j*4}"/>')
    # gallery posts down to the street
    for px in range(x + 8, x + w, 156):
        o.append(f'<rect x="{px}" y="0" width="7" height="{GROUND}" fill="#0b0408"/>')
    edge = x + w if not flip else x
    o.append(f'<path d="M{edge} 0v{GROUND}" stroke="#0b0408" stroke-width="8"/>')
townhouse(0, NEAR_L, 'gRose', 'pShutter', False)
townhouse(NEAR_R, 1600 - NEAR_R, 'gSage', 'pShutterB', True)

# ---- blue and white street-name tile on the corner ----
o.append('<g transform="translate(300 708)"><rect width="150" height="34" rx="3" fill="#f4f1e8" stroke="#1f3f8f" stroke-width="3"/><text x="75" y="24" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="18" letter-spacing="2" fill="#1f3f8f">BOURBON</text></g>')

# ---- beads strung across the street ----
o.append('''<g fill="none" stroke-linecap="round" stroke-width="11">
<path d="M470 120Q800 300 1130 120" stroke="#8a2be2" stroke-dasharray="0 33"/>
<path d="M470 120Q800 300 1130 120" stroke="#f0c24a" stroke-dasharray="0 33" stroke-dashoffset="-11"/>
<path d="M470 120Q800 300 1130 120" stroke="#1fae4a" stroke-dasharray="0 33" stroke-dashoffset="-22"/>
<path d="M470 40Q800 200 1130 40" stroke="#1fae4a" stroke-dasharray="0 30" stroke-width="9"/>
<path d="M470 40Q800 200 1130 40" stroke="#8a2be2" stroke-dasharray="0 30" stroke-dashoffset="-10" stroke-width="9"/>
<path d="M470 40Q800 200 1130 40" stroke="#f0c24a" stroke-dasharray="0 30" stroke-dashoffset="-20" stroke-width="9"/>
</g>''')
# ---- gas lamps ----
o.append('''<g class="lamps">
<circle cx="500" cy="420" r="120" fill="url(#gLamp)"/><circle cx="1100" cy="420" r="120" fill="url(#gLamp)"/>
<path d="M470 380h30v10h-30z" fill="#0b0408"/><path d="M486 392h28l-4 46h-20z" fill="#ffc46a" stroke="#0b0408" stroke-width="4"/>
<path d="M1130 380h-30v10h30z" fill="#0b0408"/><path d="M1086 392h28l-4 46h-20z" fill="#ffc46a" stroke="#0b0408" stroke-width="4"/>
</g>''')
# ---- cobblestones with gutters running to the vanishing point ----
o.append(f'<path d="M0 900V{GROUND}h1600v{900-GROUND}z" fill="url(#pCobble)"/>')
o.append(f'<path d="M0 900V{GROUND}h1600v{900-GROUND}z" fill="url(#gStreet)"/>')
o.append(f'<path d="M{NEAR_L} {GROUND}L{VX} {VY}L{NEAR_R} {GROUND}" fill="#1a0a18" opacity=".6"/>')
o.append('<ellipse cx="800" cy="800" rx="420" ry="50" fill="#f0c24a" opacity=".08"/>')
# ---- keep it dimmer than the cabinet ----
o.append('<rect width="1600" height="900" fill="url(#gVignette)"/>')
o.append('</svg>')
print('\n'.join(o))

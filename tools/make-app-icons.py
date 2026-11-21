"""Make the Android launcher icons and the App Store icon from David's master art.

    python3 tools/make-app-icons.py [path/to/icon-master-1024.png]

Writes Android mipmaps (legacy, round and adaptive foreground) into
app/android/app/src/main/res and the 1024px App Store icon (no transparency,
no rounded corners; Apple rounds it) into app/store-assets/.
"""
import os
import sys
from PIL import Image, ImageDraw

SRC = sys.argv[1] if len(sys.argv) > 1 else '/mnt/project-files/art/app-icon/icon-master-1024.png'
ROOT = os.path.join(os.path.dirname(__file__), '..', 'app')
RES = os.path.join(ROOT, 'android', 'app', 'src', 'main', 'res')
BG = (26, 9, 51)

master = Image.open(SRC).convert('RGB')
os.makedirs(os.path.join(ROOT, 'store-assets'), exist_ok=True)
master.resize((1024, 1024), Image.LANCZOS).save(os.path.join(ROOT, 'store-assets', 'ios-icon-1024.png'))
master.resize((512, 512), Image.LANCZOS).save(os.path.join(ROOT, 'store-assets', 'play-icon-512.png'))

legacy = {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}
for dpi, px in legacy.items():
    d = os.path.join(RES, f'mipmap-{dpi}')
    if not os.path.isdir(d):
        continue
    sq = master.resize((px, px), Image.LANCZOS)
    sq.save(os.path.join(d, 'ic_launcher.png'))
    big = master.resize((px * 4, px * 4), Image.LANCZOS)
    mask = Image.new('L', (px * 4, px * 4), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, px * 4 - 1, px * 4 - 1), fill=255)
    round_icon = Image.new('RGBA', (px * 4, px * 4), (0, 0, 0, 0))
    round_icon.paste(big, (0, 0), mask)
    round_icon.resize((px, px), Image.LANCZOS).save(os.path.join(d, 'ic_launcher_round.png'))
    # Adaptive foreground: 108dp canvas, art sits inside the 72dp safe circle.
    fg_px = round(px * 108 / 48)
    inner = round(fg_px * 0.64)
    fg = Image.new('RGBA', (fg_px, fg_px), (0, 0, 0, 0))
    art = master.resize((inner, inner), Image.LANCZOS).convert('RGBA')
    fg.paste(art, ((fg_px - inner) // 2, (fg_px - inner) // 2))
    fg.save(os.path.join(d, 'ic_launcher_foreground.png'))

# Dark purple adaptive background.
vals = os.path.join(RES, 'values', 'ic_launcher_background.xml')
if os.path.exists(vals):
    open(vals, 'w').write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#1A0933</color>\n</resources>\n')
print('icons written')

# Splash screens: the icon centred on the same purple, at each size Capacitor generated.
import glob
for f in glob.glob(os.path.join(RES, 'drawable*', 'splash.png')):
    w, h = Image.open(f).size
    s = int(min(w, h) * 0.42)
    im = Image.new('RGB', (w, h), BG)
    im.paste(master.resize((s, s), Image.LANCZOS), ((w - s) // 2, (h - s) // 2))
    im.save(f)

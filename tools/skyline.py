"""New Orleans skyline silhouette for the marquee: Crescent City Connection,
CBD towers, the Superdome and St. Louis Cathedral. Prints an <svg>."""
import random
random.seed(7)
W, H, G = 1000, 200, 200  # ground at y=200
parts, windows = [], []

def rect(x, w, h, top=None):
    parts.append(f"M{x} {G}V{G-h}{top or ''}H{x+w}V{G}Z")
    for wy in range(G - h + 8, G - 6, 7):
        for wx in range(x + 3, x + w - 3, 5):
            if random.random() < .16:
                windows.append(f"M{wx} {wy}h2v3h-2z")

# Crescent City Connection: two cantilever truss towers and the deck
deck = 168
parts.append(f"M0 {deck}H225V{deck+5}H0Z")
for cx in (64, 160):
    parts.append(f"M{cx-6} {G}V{deck-62}h12V{G}Z")
truss = []
for a, b in ((0, 95), (95, 165), (165, 235), (235, 330)):
    mid = (a + b) / 2
    top = deck - (62 if a in (0, 165) and False else 0)
truss.append(f"M12 {deck}Q64 {deck-78} 112 {deck}M112 {deck}Q160 {deck-78} 212 {deck}")
for x in range(18, 206, 12):
    truss.append(f"M{x} {deck}L{x+7} {deck-30}")
bridge = ''.join(truss)

# CBD towers (heights loosely after One Shell Square, Hancock Whitney Center,
# Place St. Charles with its peaked crown, the Four Seasons tower)
rect(230, 30, 92)
rect(262, 26, 118, f"H{275}L{288} {G-130}")
rect(292, 38, 158)            # tallest flat-top slab
rect(334, 30, 140)
parts.append(f"M334 {G-140}L349 {G-160}L364 {G-140}Z")  # peaked crown
rect(368, 24, 104)
rect(396, 34, 126)
parts.append(f"M412 {G-126}V{G-146}h2V{G-126}Z")  # mast
rect(434, 22, 80)

# Superdome: low drum with a shallow dome
parts.append(f"M640 {G}V{G-38}Q708 {G-74} 776 {G-38}V{G}Z")
for x in range(648, 770, 8):
    windows.append(f"M{x} {G-30}h4v2h-4z")

# Low French Quarter rooftops and trees
x = 456
while x < 1000:
    w = random.randint(18, 34); h = random.randint(18, 34)
    if 612 <= x < 780: x = 780; continue
    if 830 <= x <= 910: x = 914; continue
    if x + w > 640 and x < 640: w = 640 - x
    parts.append(f"M{x} {G}V{G-h}H{x+w}V{G}Z"); x += w + random.randint(0, 3)
# St. Louis Cathedral: three spires
parts.append(f"M850 {G}V{G-46}H910V{G}Z")
for cx, h in ((856, 92), (880, 118), (904, 92)):
    parts.append(f"M{cx-7} {G-46}V{G-h+28}L{cx} {G-h}L{cx+7} {G-h+28}V{G-46}Z")
parts.append(f"M879 {G-118}V{G-130}h2V{G-118}Z M875 {G-125}h10v2h-10z")

d = ''.join(parts)
print(f"""<svg class="skyline" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
<defs><linearGradient id="gSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a0f4a"/><stop offset="1" stop-color="#0b0418"/></linearGradient></defs>
<path d="{bridge}" fill="none" stroke="rgba(240,194,74,.45)" stroke-width="1.6"/>
<path d="{d}" fill="url(#gSky)" stroke="rgba(240,194,74,.55)" stroke-width="1.2" stroke-linejoin="round"/>
<path d="{''.join(windows)}" fill="#ffd77a" opacity=".75"/>
</svg>""")

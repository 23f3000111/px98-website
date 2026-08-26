#!/usr/bin/env python3
"""Rebuild every web image in assets/img from the client's masters in client_image/.

The client ships 4725x4725 pack renders at 1-2.4 MB each and photography up to 8K,
which is 57 MB of PNG the browser should never see. This turns them into the sizes
the site actually uses. Run it from the px98 directory after new client assets land:

    python tools/build-images.py

Requires Pillow.
"""
import os
import sys

import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None

PACK_SRC = 'client_image/PX98 Client Images/'
# The 26 Aug drop came as four bottles on a white studio ground rather than as cut-outs,
# so they are keyed here and matched to the scale of the rest of the set.
WHITE_SRC = 'client_latest_amendament/'
# source file -> product id. These arrive as RGB on white, one bottle per frame.
WHITE_PACKS = {
    'PX98 atf 8hp pro.png':                            'shift-force-atf-8hp-pro',
    'WhatsApp Image 2026-08-26 at 1.14.55 PM.jpeg':    'shift-force-9hp-pro',
    'WhatsApp Image 2026-08-26 at 1.14.55 PM (1).jpeg':'engine-cleaning-flush',
    'WhatsApp Image 2026-08-26 at 1.14.55 PM (2).jpeg':'engine-performance-treatment',
}

# Where a 1L bottle sits inside the 750x1000 frame the rest of the set is cut to,
# measured off the ATF LV render through PACK_BOX, so a keyed bottle stands exactly as
# tall as one that arrived already cut out.
WHITE_H, WHITE_TOP = 805, 80

# The three packs the client picked for the home hero, left to right.
HERO_PACKS = ('shift-force-atf-8hp-pro', 'turbo-power-sae-5w-30', 'shift-force-dctf')

SEL_SRC  = 'Selected/'
PACK_OUT = 'assets/img/packs/px98/'
IMG_OUT  = 'assets/img/'

# Every render is centred on the same square canvas, so a shared crop box trims the
# dead margin without changing the relative size of a 1L bottle against a 4L jug.
#
# One box would not do, though. The client renders the 7.5L diesel jug slightly SMALLER
# than the 4L passenger car jug, which reads backwards on the shelf: the client asked
# for the 7.5L to stand taller and wider than the 4L, as it does in the hand. So the
# diesel frames crop tighter, which lifts that jug to about 1.14x the height of the 4L
# in the delivered frame. Both boxes are 3:4, so every pack still lands in one 750x1000
# frame and the grid stays on one baseline.
PACK_BOX    = (637, 100, 4081, 4692)     # everything else
PACK_BOX_HD = (924, 439, 3808, 4285)     # the 7.5L heavy duty diesel jugs
HD_PREFIX = 'Diesel Oil_/'
PACK_H = 1000

# source file -> product id in assets/js/products.js
PACKS = {
    'Passenger Car Engine Oil/PX98 Eco Power Fully Synthetic 0W20 4L.png': 'eco-power-sae-0w-20-sp-rc-gf-6a',
    'Passenger Car Engine Oil/PX98 Eco Power Fully Synthetic 0W30 4L.png': 'eco-power-sae-0w-30-sp-rc-gf-6a',
    'Passenger Car Engine Oil/PX98 Eco Power Fully Synthetic 5W30 4L.png': 'eco-power-sae-5w-30-sp-rc-gf-6a',
    'Passenger Car Engine Oil/PX98 Turbo Power Fully Synthetic 5W40 4L.png': 'turbo-power-sae-5w-40-sp',
    'Passenger Car Engine Oil/PX98 Turbo Power Fully Synthetic 5W50 4L.png': 'turbo-power-sae-5w-50-sp',
    # no SAE 5W-30 Turbo Power in the catalogue yet; kept for feature panels
    'Passenger Car Engine Oil/PX98 Turbo Power Fully Synthetic 5W30 4L.png': 'turbo-power-sae-5w-30',
    'Passenger Car Engine Oil/PX98 ADVAN Power Semi Synthetic 5W30 4L.png': 'advan-power-sae-5w-30-sp-rc-gf-6a',
    'Passenger Car Engine Oil/PX98 ADVAN Power Semi Synthetic 10W40 4L.png': 'advan-power-sae-10w-40-sp',
    'Passenger Car Engine Oil/PX98 ADVAN Blend Multi Grade 10W30 4L.png': 'advan-blend-sae-10w-30-sn-cf',
    'Passenger Car Engine Oil/PX98 ADVAN Blend Multi Grade 15W40 4L.png': 'advan-blend-sae-15w-40-sn-cf',
    'Passenger Car Engine Oil/PX98 ADVAN Blend Multi Grade 20W50 4L.png': 'advan-blend-sae-20w-50-sl-cf',
    'Diesel Oil_/PX98 Diesel UHPD 4x4 Turbo Power Fully Synthetic 5W30.png': '4x4-turbo-power-sae-5w-30-ck-4-sn',
    'Diesel Oil_/PX98 Diesel UHPD 4x4 Turbo Power Fully Synthetic 10W40.png': '4x4-turbo-power-sae-10w-40-ck-4-sn',
    'Diesel Oil_/PX98 Diesel SHPD 4x4 Diesel Power Semi Synthetic 10W30.png': '4x4-diesel-power-sae-10w-30-cj-4-sn',
    'Diesel Oil_/PX98 Diesel SHPD 4x4 Diesel Power Semi Synthetic 10W40.png': '4x4-diesel-power-sae-10w-40-cj-4-sn',
    'Gear Oil/PX98 Shift Force API GL-4 Manual Fully Synthetic 75W90 1L.png': 'shift-force-manual-sae-75w-90-gl-4',
    'Gear Oil/PX98 Shift Force API GL-4 Manual 80W90 1L.png': 'shift-force-manual-sae-80w-90-gl-4',
    'Gear Oil/PX98 Shift Force API GL-5 AXLE GEAR Limited Slip 80W90 1L.png': 'shift-force-limited-slip-axle-gear-sae-80w-90-gl-5',
    'Gear Oil/PX98 Shift Force API GL-5 DIFFERENTIAL GEAR Limited Slip 85W90 4L.png': 'shift-force-limited-slip-differential-gear-sae-85w-90-gl-5',
    'Gear Oil/PX98 Shift Force API GL-5 HYPOID GEAR 90 4L.png': 'shift-force-hypoid-gear-sae-90-gl-5',
    'Gear Oil/PX98 Shift Force API GL-4 EP MANUAL 140 4L.png': 'shift-force-ep-manual-sae-140-gl-4',
    'Gear Oil/PX98 Shift Force ATF AMMIX D3-SP Syn Tech 1L.png': 'shift-force-ammix-d3-sp',
    'ATF/PX98 Shift Force ATF LV Fully Synthetic.png': 'shift-force-atf-lv',
    'ATF/PX98 Shift Force ATF MV Syn Tech.png': 'shift-force-atf-mv',
    'ATF/PX98 Shift Force ATF DW-1 Fully Synthetic.png': 'shift-force-atf-dw-1',
    'ATF/PX98 Shift Force ATF WS Fully Synthetic.png': 'shift-force-atf-ws',
    'ATF/PX98 Shift Force DCTF Fully Synthetic.png': 'shift-force-dctf',
    'ATF/PX98 Shift Force CVTF Fully Synthetic.png': 'shift-force-cvtf',
    # the client's third coolant render is labelled pink; it is the RED product
    'Coolants/PX98 Ready-to-use Cool Xtra Tropical Formula 30_70 Prediluted -15°C pink.png': 'cool-xtra-30-70-red',
    'Coolants/PX98 Ready-to-use Cool Xtra Tropical Formula 30_70 Prediluted -15°C blue.png': 'cool-xtra-30-70-blue',
    'Coolants/PX98 Ready-to-use Cool Xtra Tropical Formula 30_70 Prediluted -15°C green.png': 'cool-xtra-30-70-green',
    'Brake Fluid/PX98 Brake & Clutch Fluid Super DOT 4.png': 'super-dot-4-brake-fluid',
    'Brake Fluid/PX98 Brake & Clutch Fluid Modern DOT 5.1.png': 'modern-dot-5-1-brake-fluid',
}

TUNNEL   = 'supercar_recreated_no_bonnet_logo_8k_300dpi.png'
WARE     = 'yellow_supercar_right_facing_98_no_bonnet_logo (1).png'
COASTAL  = 'coastal_mountain_supercar_no_bonnet_logo_8k_300dpi.png'
RACECAR  = 'mountain_highway_racecar_98.png'
HANDS    = 'business_handshake_clear_under_2mb.jpg'
SUPRA    = 'supra_daytime_no_bonnet_logo.png'
SIAN     = 'black_bonnet_yellow_linework_roadster.png'
DEFENDER = 'yellow_defender_no_land_rover_logo.png'
SEDAN    = 'yellow_sedan_wide_highway_no_logo.png'

# Framing. A section is a window onto its photograph, not a frame around it: the copy
# sits on the left and the cards, the spec plate or the pack lineup sit across the
# foot, so a car parked in the bottom third of its own frame is a car nobody sees.
#
# Each shot names the crop it wants in source fractions - cx and cy are the centre of
# the window, h is its height as a fraction of the source. The width follows from the
# output aspect, and the window is clamped inside the picture. Two consequences worth
# knowing: h below 1.0 zooms in, and a cy above 0.5 walks the window down the source,
# which is what lifts a car up the delivered frame and clear of whatever sits on it.
#
# Output aspects are measured off the real sections at 1440x900:
#   page headers   2.48   -> delivered at 2.40
#   full screen    1.59   -> delivered at 1.60
#   tall sections  1.48   -> delivered at 1.50
#   inline panels        -> whatever the img class asks for
#
# Every photograph is used once. About's full-screen statement is the exception, a
# second and much tighter crop of the tunnel car that carries the home hero; it is
# the one repeat in the set, and it goes the moment there is another frame to spend.
SHOTS = [
    # name                          master    w     h     cx    cy     crop h
    ('hero-supercar-98.jpg',        TUNNEL,   2400, 1500, 0.42, 0.52, 0.95),
    ('why-supercar-98.jpg',         WARE,     2000, 1333, 0.50, 0.62, 0.86),
    ('tech-supra-city.jpg',         SUPRA,    2000, 1333, 0.42, 0.70, 0.84),
    ('performance-racecar-98.jpg',  RACECAR,  2000, 1125, 0.50, 0.50, 1.00),
    ('distribution-handshake.jpg',  HANDS,    2000, 1125, 0.50, 0.50, 1.00),
    ('products-sedan-highway.jpg',  SEDAN,    2000,  833, 0.47, 0.55, 0.68),
    ('technology-roadster.jpg',     SIAN,     2000,  833, 0.49, 0.57, 0.58),
    ('about-defender.jpg',          DEFENDER, 2000,  833, 0.50, 0.50, 0.74),
    ('about-tunnel-speed.jpg',      TUNNEL,   2000, 1250, 0.40, 0.54, 0.80),
    ('distributors-coastal-98.jpg', COASTAL,  2000,  833, 0.42, 0.66, 0.60),
]


def window(im, w, h, cx, cy, hf):
    """The crop the shot asked for, clamped inside the picture."""
    sw, sh = im.size
    ch = min(sh * hf, sh)
    cw = ch * (w / h)
    if cw > sw:                       # the aspect wants more width than there is
        cw, ch = sw, sw * (h / w)
    x0 = min(max(cx * sw - cw / 2, 0), sw - cw)
    y0 = min(max(cy * sh - ch / 2, 0), sh - ch)
    return im.crop((round(x0), round(y0), round(x0 + cw), round(y0 + ch)))


def cover(im, w, h):
    """Centre-crop to the target aspect, then resample."""
    sw, sh = im.size
    target, source = w / h, sw / sh
    if source > target:
        nw = round(sh * target)
        im = im.crop(((sw - nw) // 2, 0, (sw - nw) // 2 + nw, sh))
    elif source < target:
        nh = round(sw / target)
        im = im.crop((0, (sh - nh) // 2, sw, (sh - nh) // 2 + nh))
    return im.resize((w, h), Image.LANCZOS)


def to_height(im, h):
    return im.resize((round(im.width * h / im.height), h), Image.LANCZOS)


def key_white(path):
    """Lift a bottle off the white studio ground it was photographed on.

    The alpha cannot come from brightness alone: the plastic carries specular
    highlights as bright as the ground, and the label carries white type. So the
    silhouette is found first - a row span and a column span between the outermost
    non-white pixels intersect to the bottle, holes and all - and brightness is only
    trusted within a few pixels of that edge, where it supplies the antialiasing.
    """
    arr = np.asarray(Image.open(path).convert('RGB')).astype(np.int16)
    minc = arr.min(axis=2)
    solid = minc < 245

    def spans(m):
        idx = np.arange(m.shape[1])
        any_ = m.any(axis=1)
        first = np.where(any_, np.argmax(m, axis=1), 0)
        last = np.where(any_, m.shape[1] - 1 - np.argmax(m[:, ::-1], axis=1), -1)
        return (idx[None, :] >= first[:, None]) & (idx[None, :] <= last[:, None]) & any_[:, None]

    core = spans(solid) & spans(solid.T).T
    for _ in range(3):              # erode, so the rim keeps its own antialiasing
        core &= (np.roll(core, 1, 0) & np.roll(core, -1, 0) &
                 np.roll(core, 1, 1) & np.roll(core, -1, 1))

    alpha = np.where(core, 255, np.clip((250 - minc) * 6, 0, 255)).astype(np.float32)
    a = (alpha / 255.0)[..., None]
    # the frame is the bottle composited over white, so undo that to kill the halo
    rgb = np.where(a > 0.004, (arr - (1 - a) * 255) / np.maximum(a, 0.004), 0)
    return Image.fromarray(np.dstack([np.clip(rgb, 0, 255), alpha]).astype(np.uint8), 'RGBA')


def build_keyed_packs():
    os.makedirs(PACK_OUT, exist_ok=True)
    w = pack_w()
    for src, pid in sorted(WHITE_PACKS.items(), key=lambda kv: kv[1]):
        im = key_white(WHITE_SRC + src)
        im = im.crop(im.getchannel('A').getbbox())
        im = to_height(im, WHITE_H)
        canvas = Image.new('RGBA', (w, PACK_H), (0, 0, 0, 0))
        canvas.alpha_composite(im, ((w - im.width) // 2, WHITE_TOP))
        canvas.save(PACK_OUT + pid + '.webp', 'WEBP', quality=86, method=4)
        print('  packs/px98/%s.webp' % pid)


def pack_w():
    return round((PACK_BOX[2] - PACK_BOX[0]) * PACK_H / (PACK_BOX[3] - PACK_BOX[1]))


def build_packs():
    os.makedirs(PACK_OUT, exist_ok=True)
    w = pack_w()
    for src, pid in sorted(PACKS.items(), key=lambda kv: kv[1]):
        box = PACK_BOX_HD if src.startswith(HD_PREFIX) else PACK_BOX
        im = Image.open(PACK_SRC + src).convert('RGBA').crop(box)
        im.resize((w, PACK_H), Image.LANCZOS).save(
            PACK_OUT + pid + '.webp', 'WEBP', quality=86, method=4)
        print('  packs/px98/%s.webp' % pid)


def build_lineup():
    """The hero lineup, the three packs the client picked for it.

    Composed from the delivered renders rather than the masters, so the three keep the
    relative height the catalogue gives them and stand on one ground line without any
    of it being measured twice.
    """
    left, mid, right = (Image.open(PACK_OUT + n + '.webp').convert('RGBA') for n in HERO_PACKS)
    w, h = mid.size
    gap = 150                                  # the 1L frames carry wide empty margins
    c = Image.new('RGBA', (w * 3 - gap * 2, h), (0, 0, 0, 0))
    c.alpha_composite(left, (0, 0))
    c.alpha_composite(right, ((w - gap) * 2, 0))
    c.alpha_composite(mid, (w - gap, 0))       # the jug stands in front of both
    c = c.crop(c.getchannel('A').getbbox())
    c.thumbnail((1400, 1400), Image.LANCZOS)
    c.save('assets/img/packs/bottles-group.webp', 'WEBP', quality=88, method=4)
    print('  packs/bottles-group.webp %dx%d' % c.size)


def build_shots():
    for name, src, w, h, cx, cy, hf in SHOTS:
        im = window(Image.open(SEL_SRC + src).convert('RGB'), w, h, cx, cy, hf)
        im.resize((w, h), Image.LANCZOS).save(
            IMG_OUT + name, 'JPEG', quality=82, optimize=True, progressive=True)
        print('  %s %dx%d' % (name, w, h))


if __name__ == '__main__':
    missing = [s for s in PACKS if not os.path.exists(PACK_SRC + s)]
    missing += [s for s in WHITE_PACKS if not os.path.exists(WHITE_SRC + s)]
    missing += [s[1] for s in SHOTS if not os.path.exists(SEL_SRC + s[1])]
    if missing:
        print('missing client masters:\n  ' + '\n  '.join(sorted(set(missing))))
        sys.exit(1)
    print('pack renders'); build_packs(); build_keyed_packs()
    print('hero lineup'); build_lineup()
    print('photography'); build_shots()

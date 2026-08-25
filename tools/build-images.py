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

from PIL import Image

Image.MAX_IMAGE_PIXELS = None

PACK_SRC = 'client_image/PX98 Client Images/'
SEL_SRC  = 'client_image/Sample Images/Selected/'
PACK_OUT = 'assets/img/packs/px98/'
IMG_OUT  = 'assets/img/'

# Every render is centred on the same square canvas, so one shared crop box trims the
# dead margin without changing the relative size of a 1L bottle against a 4L jug. It is
# the union of the alpha bounding boxes across all thirty-three files.
PACK_BOX = (879, 390, 3838, 4334)
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
    'Coolants/PX98 Ready-to-use Cool Xtra Tropical Formula 30_70 Prediluted -15°C pink.png': '50-50-coolant-red',
    'Coolants/PX98 Ready-to-use Cool Xtra Tropical Formula 30_70 Prediluted -15°C blue.png': '50-50-coolant-blue',
    'Coolants/PX98 Ready-to-use Cool Xtra Tropical Formula 30_70 Prediluted -15°C green.png': '50-50-coolant-green',
    'Brake Fluid/PX98 Brake & Clutch Fluid Super DOT 4.png': 'super-dot-4-brake-fluid',
    'Brake Fluid/PX98 Brake & Clutch Fluid Modern DOT 5.1.png': 'modern-dot-5-1-brake-fluid',
}

TUNNEL  = 'supercar_recreated_no_bonnet_logo_8k_300dpi.png'
WARE    = 'yellow_supercar_right_facing_98_no_bonnet_logo (1).png'
COASTAL = 'coastal_mountain_supercar_no_bonnet_logo_8k_300dpi.png'
RACECAR = 'mountain_highway_racecar_98.png'
HANDS   = 'business_handshake_clear_under_2mb.jpg'
SUPRA   = 'supra_daytime_no_bonnet_logo.png'

# The three supra frames all carried the Petronas Twin Towers, which the client asked
# us to drop. They share the one badge-free daytime frame; each section aims its own
# crop with --shot-pos, so they stay separate files.
SHOTS = [
    ('hero-supercar-98.jpg',        TUNNEL,  2400, 1350),
    ('distribution-supercar.jpg',   TUNNEL,  2000, 1125),
    ('about-supercar-98.jpg',       WARE,    2000, 1125),
    ('why-supercar-98.jpg',         WARE,    2000, 1125),
    ('products-supercar.jpg',       COASTAL, 2000, 1125),
    ('distributors-coastal-98.jpg', COASTAL, 2000, 1125),
    ('performance-racecar-98.jpg',  RACECAR, 2000, 1125),
    ('distribution-handshake.jpg',  HANDS,   2000, 1125),
    ('technology-supra.jpg',        SUPRA,   2000, 1125),
    ('tech-supra-city.jpg',         SUPRA,   2000, 1125),
    ('about-supra-speed.jpg',       SUPRA,   2000, 1125),
]


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


def build_packs():
    os.makedirs(PACK_OUT, exist_ok=True)
    w = round((PACK_BOX[2] - PACK_BOX[0]) * PACK_H / (PACK_BOX[3] - PACK_BOX[1]))
    for src, pid in sorted(PACKS.items(), key=lambda kv: kv[1]):
        im = Image.open(PACK_SRC + src).convert('RGBA').crop(PACK_BOX)
        im.resize((w, PACK_H), Image.LANCZOS).save(
            PACK_OUT + pid + '.webp', 'WEBP', quality=86, method=4)
        print('  packs/px98/%s.webp' % pid)


def build_lineup():
    """The hero lineup: a 4L jug in front, flanked by two 1L bottles."""
    def load(p):
        im = Image.open(PACK_SRC + p).convert('RGBA').crop(PACK_BOX)
        return im.crop(im.getchannel('A').getbbox())

    four  = to_height(load('Passenger Car Engine Oil/PX98 Eco Power Fully Synthetic 0W20 4L.png'), 1150)
    left  = to_height(load('ATF/PX98 Shift Force ATF DW-1 Fully Synthetic.png'), 830)
    right = to_height(load('ATF/PX98 Shift Force ATF LV Fully Synthetic.png'), 830)

    gap = -28                       # a hair of overlap, not enough to bury a label
    w = left.width + four.width + right.width + gap * 2
    c = Image.new('RGBA', (w, 1150), (0, 0, 0, 0))
    c.alpha_composite(left, (0, 1150 - left.height))
    c.alpha_composite(right, (w - right.width, 1150 - right.height))
    c.alpha_composite(four, (left.width + gap, 0))
    c = c.crop(c.getchannel('A').getbbox())
    c.thumbnail((1400, 1400), Image.LANCZOS)
    c.save('assets/img/packs/bottles-group.webp', 'WEBP', quality=88, method=4)
    print('  packs/bottles-group.webp %dx%d' % c.size)


def build_shots():
    for name, src, w, h in SHOTS:
        im = cover(Image.open(SEL_SRC + src).convert('RGB'), w, h)
        im.save(IMG_OUT + name, 'JPEG', quality=82, optimize=True, progressive=True)
        print('  %s %dx%d' % (name, w, h))


if __name__ == '__main__':
    missing = [s for s in PACKS if not os.path.exists(PACK_SRC + s)]
    missing += [s for _, s, _, _ in SHOTS if not os.path.exists(SEL_SRC + s)]
    if missing:
        print('missing client masters:\n  ' + '\n  '.join(sorted(set(missing))))
        sys.exit(1)
    print('pack renders'); build_packs()
    print('hero lineup'); build_lineup()
    print('photography'); build_shots()

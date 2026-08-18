# PX98 - website mockup

Presentation mockup for **PX98**, a premium automotive lubricant brand developed by
PRINCE GLOBAL PTE. LTD., Singapore.

Static site. No build step, no dependencies. Open `index.html` in a browser, or serve
the folder with any static server.

```
python -m http.server 8000     # then visit http://127.0.0.1:8000
```

## Pages

| File | Purpose |
| --- | --- |
| `index.html` | Home: hero, viscosity rail, why PX98, technology, product range, distribution |
| `products.html` | Catalogue, filterable by category, searchable by grade or approval |
| `product.html` | Product detail, driven by `?id=` against the catalogue data |
| `technology.html` | How a PX98 fluid is built, and what it delivers |
| `about.html` | Company, quality assurance, sustainability |
| `distributors.html` | Distributor proposition and enquiry form |
| `contact.html` | Contact details and enquiry form |

## Structure

```
assets/
  css/px98.css        design system + every component
  js/px98.js          nav, reveals, counters, viscosity rail, catalogue, detail
  js/products.js      the 36-product catalogue, generated from the client's product copy deck
  js/chat.js          PX98 assistant: guided product finder + catalogue search
  img/labels/         approved label artwork, one file per product id
  img/packs/          3D pack renders, used in the hero
  img/brand/          wordmarks, plus the favicon set
  img/                photography and brand marks
favicon.ico           16/32/48, the yellow "98" tile
site.webmanifest      names the 192 and 512 install icons
```

## Product artwork

`assets/img/labels/<product-id>.webp` is the approved label artwork for that product,
cut out of the client's print-resolution production sheets in `Prince Label/PX98_Label/`.
**Twenty-nine of the thirty-six products have artwork.** The seven without it fall back to
a labelled CSS plate: 4X4 DIESEL POWER 15W-40, SHIFT FORCE 9HP PRO, the three coolants,
and the two engine treatments.

The set of ids that have artwork lives in `LABELLED` in `assets/js/px98.js`. The filename
is always the product id, so adding a label means dropping the file in and adding one id.

Do not trust the numbers in the client's original filenames. They are page numbers inside
a combined artwork document, not product identifiers: `TURBO POWER-03` is the ECO POWER
5W-30 label and `ADVAN POWER 2-15` is ADVAN BLEND 10W-30. Every pairing was read off the
artwork itself.

## Notes for the next person

- **Product data** lives in `assets/js/products.js` and was generated from the client's
  `PX98 website - products.docx`. Regenerate rather than hand-editing if the deck changes.
  The label mapping is deliberately kept out of this file so it stays regenerable.
- **Automotive photography.** The client supplied five car shots on 17 Aug 2026
  (`Sample Images/`). They are downsampled to 2000px JPEGs in `assets/img/` and wired up:

  | Where | File | Source |
  | --- | --- | --- |
  | home `#tech` | `tech-supra-city.jpg` | `kl_2026_supra_city_drive.png` |
  | home `#performance` | `performance-racecar-98.jpg` | `mountain_highway_racecar_98.png` |
  | home `#distributor` | `distribution-supercar.jpg` | `supercar_recreated_highres.png` |
  | `about.html` header | `about-supercar-98.jpg` | `yellow_supercar_right_facing_98.png` |
  | `technology.html` header | `technology-supra.jpg` | `kl_supra_dramatic_speed_scene.png` |
  | `products.html` header | `products-supercar.jpg` | `coastal_mountain_supercar_scene.png` |

  Section grounds still take a photograph the same way: `sect--photo` plus a `.shot--*`
  rule holding the `url()`, then `--shot-pos` and `--shot-fade` on the section itself.
  The two home-page panels are framed `<img>` in a `.split` rather than a bleed ground,
  because the client's markup showed the car as a panel beside the copy.

  **One open question.** Amendments 4 and 5 both read "the new image ... of the yellow
  Lambo", but they are two different sections. Amendment 5 is unambiguous - the client
  pasted the yellow car with the 98 on the door onto the About header - so that file went
  there. Amendment 4 has the black-and-yellow Aventador instead, to avoid running the same
  photograph twice. To make both the same, point `.shot--distribution` and the
  `#distributor` `<img>` at `about-supercar-98.jpg`.

  The `contact.html` header still runs on the drawn `ground--streak`; no photograph was
  specified for it. Note the two Supra frames are not interchangeable: the night one with
  the light trails carries the `technology.html` header, the daytime city one carries the
  home `#tech` section.

- **`#tech` on the home page has to land inside one screen**, on the client's note. Three
  things get it there and all of them matter: `.fit-screen` trades padding away and
  rebalances the split towards the copy (the headline was ragging to four lines in the
  narrow column), `.shot-img--cap` stops the photograph from being what decides the
  section's height, and `.spec-groups--row` runs the nine highlights as three columns
  across the foot instead of three stacked rows inside the copy. Measured at 549px in a
  640px viewport, and 593px in a 950px one. If you add copy to this section, re-measure.
- **The earlier supplied photographs** are `lab-viscometer.jpg`, `engine-pour.jpg`,
  `diesel-pickup.jpg`, `sustainability-engine.jpg` and `scene-workshop.jpg`.
  `engine-pour.jpg` was darkened to 82% brightness on request and is currently unplaced -
  it held the home `#tech` panel until the Supra replaced it. `scene-workshop.jpg` is
  the older yellow Lamborghini frame, still carrying the `distributors.html` header;
  `about-supercar-98.jpg` is the newer render of the same scene, with the 98 door decal.

- **Type over photography.** `.phead.sect--photo` gives the headline and standfirst a soft
  ink halo, because the fade alone cannot hold every crop - the bright part of the subject
  moves with the picture. `#top-nav::before` adds a short scrim off the top edge so the
  links clear the sky while the bar is still transparent. `.lede--pop` sets the products
  standfirst in yellow, which the client asked for by name.

- **The technology two-up is down to one pack.** The client asked for a single bottle
  until the second product shot exists. `.two-up` is still in the stylesheet for when the
  10W-40 comes back.
- **The PX98 nav lockup is exported from `Prince Label/PX98/PX98-02.png`** at 325x260,
  and set 40% larger than it was (62px, 52px once the bar sticks) on a bar grown from
  80/66px to 100/84px to keep the clearance. `#hero` and `.phead` top padding moved with
  it. The favicon set is exported from `PX98-04.png` - the solid black lockup on the brand
  yellow, which is the only pairing that still reads "PX98" at 16px. Regenerate any of it
  from the source `.ai` if the mark changes.

- **The Prince mark is 314x128.** Fine at footer scale, but it caps how large it can go.
  A vector version is presumably inside `Prince Label/PX98_Label/PX98_Label_FA.ai`.
- **Remaining placeholders** are visibly labelled: the three news articles, and the map
  and contact details on `contact.html`.
- **Forms** are inert. Nothing is submitted anywhere.
- **The assistant** runs entirely in the page against the catalogue. `reply()` in
  `assets/js/chat.js` is the single seam to swap for a live model endpoint.
- **No scroll listeners.** The nav condense, the back-to-top button and the mockup badge
  use IntersectionObserver depth markers (`depthGate` in `px98.js`); the read-progress bar
  is a CSS scroll timeline. Keep it that way if you add scroll-driven behaviour.
- Built and reviewed at desktop widths. Responsive rules exist but are untuned.

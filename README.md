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
- **Automotive photography is the one outstanding asset.** Four sections asked for a car
  and have none. They run on a drawn brand ground instead, each marked with a `TODO` in
  the markup naming the crop needed: the home hero, home `#performance`, and the page
  headers on `technology.html`, `products.html` and `contact.html`. To restore a
  photograph, swap `sect--ground ground--streak` (or `ground--lattice`) back to
  `sect--photo`, add a `.shot--*` rule in the stylesheet, and set `--shot-pos`.
- **The four supplied photographs** are `lab-viscometer.jpg`, `engine-pour.jpg`,
  `diesel-pickup.jpg` and `sustainability-engine.jpg`. `engine-pour.jpg` was darkened to
  82% brightness on request.
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

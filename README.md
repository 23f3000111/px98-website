# PX98 — website mockup

Presentation mockup for **PX98**, a premium automotive lubricant brand developed by
PRINCE GLOBAL PTE. LTD., Singapore.

Static site. No build step, no dependencies — open `index.html` in a browser, or serve
the folder with any static server.

```
python -m http.server 8000     # then visit http://127.0.0.1:8000
```

## Pages

| File | Purpose |
| --- | --- |
| `index.html` | Home — hero, viscosity rail, why PX98, technology, product range, distribution |
| `products.html` | Catalogue — all 36 products, filterable by category, searchable by grade or approval |
| `product.html` | Product detail, driven by `?id=` against the catalogue data |
| `technology.html` | How a PX98 fluid is built, and what it delivers |
| `about.html` | Company, quality assurance, sustainability |
| `distributors.html` | Distributor proposition and enquiry form |
| `contact.html` | Contact details and enquiry form |

## Structure

```
assets/
  css/px98.css        design system + every component
  js/px98.js          nav, reveals, counters, hero parallax, viscosity rail, catalogue, detail
  js/products.js      the 36-product catalogue, generated from the client's product copy deck
  js/chat.js          PX98 assistant — guided product finder + catalogue search
  img/packs/          pack shots cut from the approved PX98 label artwork
  img/                scene photography and brand marks
```

## Notes for the next person

- **Product data** lives in `assets/js/products.js` and was generated from the client's
  `PX98 website - products.docx`. Regenerate rather than hand-editing if the deck changes.
- **Pack shots** were extracted from `Prince_PX98 FA-01.pdf`. Five label designs exist;
  products without their own artwork fall back to the closest approved pack in the same
  category, or to a CSS pack plate.
- **Placeholders** are deliberate and visibly labelled: lifestyle photography, news
  articles, the map, and all contact details.
- **Scene photography** (`scene-*.jpg/webp`) is sample imagery supplied for layout only.
  At least one carries a stock watermark and none are print resolution — these must be
  replaced with licensed assets before launch.
- **Forms** are inert. Nothing is submitted anywhere.
- **The assistant** runs entirely in the page against the catalogue. `reply()` in
  `assets/js/chat.js` is the single seam to swap for a live model endpoint.
- Built and reviewed at desktop widths. Responsive rules exist but are untuned.

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
| `product-<id>.html` | Product detail, one static page per catalogue entry, generated |
| `product.html` | The old `?id=` route, now a redirect to the product's own page |
| `technology.html` | How a PX98 fluid is built, and what it delivers |
| `about.html` | Company, quality assurance, sustainability |
| `distributors.html` | Distributor proposition and enquiry form |
| `contact.html` | Contact details and enquiry form |
| `faq.html` | Grades, approvals and supply, answered as running text |

## Where it is served

**Vercel**, from this repo's `main` branch, at **px98lubricants.com**.

`vercel.json` is the whole deployment: no build step, no framework, every file served
statically from the repo root. Two things in it are deliberate.

`cleanUrls` is off. Every link in the site is written with its `.html` extension, so
turning clean URLs on would put a 301 in front of every internal navigation for no gain.

Everything is sent `max-age=0, must-revalidate`. That is not what you want at launch,
but it is exactly what you want while the client is reviewing: a redeploy is visible on
the next refresh instead of hiding behind a browser cache. Revalidation costs a 304, and
Vercel serves it from the edge. Tighten it when the copy and the photography are signed
off - images to a year, CSS and JS to an hour, HTML left as it is.

GitHub Pages still builds the same branch at `23f3000111.github.io/px98-website/` and is
useful as a second opinion when something looks wrong on the live domain. It no longer
claims the custom domain: the `CNAME` file that used to do that is gone, because two
hosts cannot both answer for px98lubricants.com. Its certificate request for the domain
never left the `new` state after several hours, which is what moved the site to Vercel.

Every path in the site is relative, so it runs the same from a sub-path, from the root of
a domain, or straight off the filesystem with no server at all.

## Still to come from the client

Everything below is wired and waiting on real values. `SITE` at the top of
`assets/js/px98.js` is the only place any of it is written down. **A field left empty
is not rendered at all** - no placeholder, no fake address, no link that goes nowhere -
so the site is safe to leave live while these are outstanding.

| Field | What it turns on |
|---|---|
| `email` | The email row on the contact page, and the mail fallback both forms use |
| `phone` | The phone row on the contact page |
| `address` | The address row on the contact page |
| `formEndpoint` | Real submission for both enquiry forms |
| `social[].url` | The FB / IG / YT / IN links in the footer |

`formEndpoint` takes any service that accepts a plain multipart form POST - Formspree,
Basin, Web3Forms. Both forms already carry proper `name` attributes and a `data-subject`,
so nothing else has to change. Until it is set, a form with `email` filled in hands the
enquiry to the visitor's mail client, and with neither it says enquiries are not open
rather than pretending to have sent something.

Two other things need a decision rather than a value. The three articles under Latest
News are cards without pages behind them, so they are not links; say the word and they
become real pages. And the contact page has no map, because there is no address to put
on one.

## Structure

```
assets/
  css/px98.css        design system + every component
  js/px98.js          nav, reveals, counters, viscosity rail, catalogue, detail
  js/products.js      the 37-product catalogue, generated from the client's product copy deck
  js/chat.js          PX98 assistant: guided product finder + catalogue search
  img/labels/         flat label artwork; superseded by the pack renders, kept for reference
  img/packs/px98/     the client's pack renders, one file per product id
  img/packs/          the hero lineup, composited from three of those renders
  img/news/           article thumbnails, packs on the house ink until photography lands
  img/brand/          wordmarks, plus the favicon set
  img/                photography and brand marks
robots.txt            open to every crawler, names the answer engines explicitly
sitemap.xml           generated: 7 pages + 37 products, with lastmod
llms.txt              generated: the site and the catalogue, stated for answer engines
favicon.ico           16/32/48, the yellow "98" tile
site.webmanifest      names the 192 and 512 install icons
```

## Product artwork

`assets/img/packs/px98/<product-id>.webp` is the client's own render of that product's
bottle, from `client_image/PX98 Client Images/` (25 Aug 2026) and `client_latest_amendament/`
(26 Aug 2026). **Thirty-six of the thirty-seven products have a render.** The one without,
4X4 DIESEL POWER 15W-40, falls back to a labelled CSS plate.

The 26 Aug four - ATF 8HP PRO, ATF 9HP PRO, ENGINE CLEANING FLUSH and ENGINE PERFORMANCE
TREATMENT - arrived as bottles on a white studio ground rather than as cut-outs, so
`key_white()` in the build script lifts them off it and stands them at the same height as
the rest of the set. It finds the silhouette from row and column spans rather than from
brightness, because the plastic carries highlights as bright as the ground and the label
carries white type.

Two crop boxes, not one: the client renders the 7.5L diesel jug slightly smaller than the
4L passenger car jug, which reads backwards on a shelf. The diesel frames crop tighter so
that jug stands about 1.14x the height of the 4L, which is what the client asked for.

The set of ids that have a render lives in `PACKED` in `assets/js/px98.js`. The filename is
always the product id, so adding a pack means dropping the file in and adding one id.
`window.PX98_packSrc(id)` is the one resolver; the catalogue, the detail page and the
assistant's result rows all go through it.

These replaced the flat label artwork in `assets/img/labels/`, which is left in the repo
but is no longer referenced by anything. If you go back to it, note that the numbers in
the client's original label filenames are page numbers inside a combined artwork document,
not product identifiers: `TURBO POWER-03` is the ECO POWER 5W-30 label and
`ADVAN POWER 2-15` is ADVAN BLEND 10W-30.

Everything under `assets/img/` that comes from `client_image/` is regenerated by
`tools/build-images.py` - the pack renders, the hero lineup and the photography below. The
masters are 4725px squares and 8K frames; the script carries the crop boxes and the
id-to-file mapping. Run it from this directory when new client assets land.

## Search, and the answer engines

The site is served static and had no build step, which was fine for everything except
being found. Three things were wrong, and `tools/build-seo.js` is the fix for all three.

**The catalogue was not indexable.** Every product lived at `product.html?id=<id>`, drawn
by JavaScript, and every one of them carried `<link rel="canonical">` pointing at the bare
`/product.html`. A canonical is a declaration that *this page is a duplicate of that one*,
so all 37 products were telling Google to index a single URL instead of 37. Nothing in the
range could rank, whatever else was done.

**Nothing survived without JavaScript.** The nav, the footer and the catalogue grid were
all `innerHTML` written at runtime. Googlebot does render JavaScript, on a second pass and
at its own pace - but the crawlers behind the answer engines do not run it at all. GPTBot,
ClaudeBot and PerplexityBot were being served an empty `<div>` and an internal link graph
with no links in it.

**The titles did not contain the words people search.** The home page was
"PX98 - Precision in Every Revolution". Of the three queries the client named -
`px98`, `px98 lubricants`, `px98 engine oil` - it matched one.

### What the generator owns

```
node tools/build-seo.js
```

Run it after editing `assets/js/products.js`, which stays the single source of truth for
the catalogue. It writes:

| Output | What it is |
| --- | --- |
| `product-<id>.html` × 37 | A real page per product: own title, own description, own canonical, the spec sheet as static HTML, `Product` and `BreadcrumbList` JSON-LD |
| `sitemap.xml` | All 44 URLs with `lastmod`. Every entry is verified self-canonical |
| `llms.txt` | The site and the full catalogue as markdown, for crawlers that read it |
| nav + footer | The static twin of `buildNav`/`buildFoot`, written into all 44 pages between `<!--{nav}-->` markers |
| the product grid | All 37 cards as static HTML inside `products.html`, plus the `ItemList` JSON-LD in its head |

The runtime is unchanged in shape: `buildNav`, `buildFoot` and `detail` in `px98.js` now
stand down when they find their markup already in the page, so the browser keeps the DOM it
parsed instead of throwing it away and rebuilding it identically.

A page with no markers is left alone and reported, so a missing marker is loud rather than
silent. `product.html` is the only one, deliberately.

### Structured data

`Organization`, `Brand` and `WebSite` on the home page, `Product` on each of the 37,
`ItemList` on the range, `FAQPage` on the FAQ, `BreadcrumbList` on all 43 inner pages.
Two deliberate omissions:

- **No `offers`, no price, no `aggregateRating`.** The site sells through distributors and
  has never published a figure. Inventing one to win a rich result is what earns a manual
  action.
- **No `sameAs`, no address, no phone.** Same rule as `SITE` in `px98.js`: a field the
  client has not supplied is not rendered. Fill the social URLs in and `sameAs` is worth
  adding here by hand - it is the strongest single signal for a brand knowledge panel.

The FAQ answers are on the page as running text, not markup over an empty page. Google
requires FAQ structured data to match visible copy, and an answer engine has nothing to
quote from a page that carries only JSON. `tools/` is in `.vercelignore`, so none of this
deploys; only its output does.

### The old product URLs

`vercel.json` turns `/product.html?id=x` into a 308 to `/product-x.html`, which is what
passes the link equity of an already-crawled URL on to the page that replaced it. The
`has` rule has to stay first in the array - the catch-all beneath it would otherwise sweep
every product into the listing page. `product.html` keeps a JavaScript fallback for
GitHub Pages, a plain static server and the filesystem, where no redirect rule exists.

### Not code: the part that is still outstanding

The site was never submitted. Search Console showed **0 sitemaps** and a property still
processing its first day of data, which is the whole reason nothing appeared for `px98`.
None of the above indexes anything on its own:

1. Search Console → Sitemaps → submit `sitemap.xml`.
2. URL Inspection on `https://www.px98lubricants.com/` → Request indexing. Same for
   `products.html`. The rest follows from the sitemap.
3. Bing Webmaster Tools will import the Search Console property wholesale. Worth doing:
   it is what ChatGPT's search grounding reads.
4. Get the domain cited somewhere Google already crawls - the Prince Global site, the
   company's LinkedIn, a distributor's page, a local business listing. A new domain with
   no inbound links is discovered slowly however clean its markup is.

Indexing a new site takes days to weeks. The brand queries should land first, because
nothing else competes for `px98 lubricants`.

## Notes for the next person

- **Product data** lives in `assets/js/products.js` and was generated from the client's
  `PX98 website - products.docx`. Regenerate rather than hand-editing if the deck changes.
  The label mapping is deliberately kept out of this file so it stays regenerable.
- **Automotive photography.** Every frame now comes from
  `client_image/Sample Images/Selected/`, the badge-free masters the client supplied on
  25 Aug 2026. They are cover-cropped to 2000px JPEGs in `assets/img/` (the hero at
  2400px) and wired up:

  | Where | File | Source in `Selected/` |
  | --- | --- | --- |
  | home hero | `hero-supercar-98.jpg` | `supercar_recreated_no_bonnet_logo_8k_300dpi.png` |
  | home `#tech` | `tech-supra-city.jpg` | `supra_daytime_no_bonnet_logo.png` |
  | home `#performance` | `performance-racecar-98.jpg` | `mountain_highway_racecar_98.png` |
  | home `#why` | `why-supercar-98.jpg` | `yellow_supercar_right_facing_98_no_bonnet_logo (1).png` |
  | home `#distributor` | `distribution-supercar.jpg` | `supercar_recreated_no_bonnet_logo_8k_300dpi.png` |
  | home handshake panel | `distribution-handshake.jpg` | `business_handshake_clear_under_2mb.jpg` |
  | `about.html` header | `about-supercar-98.jpg` | `yellow_supercar_right_facing_98_no_bonnet_logo (1).png` |
  | `about.html` `#innovation` | `about-supra-speed.jpg` | `supra_daytime_no_bonnet_logo.png` |
  | `technology.html` header | `technology-supra.jpg` | `supra_daytime_no_bonnet_logo.png` |
  | `products.html` header | `products-supercar.jpg` | `coastal_mountain_supercar_no_bonnet_logo_8k_300dpi.png` |
  | `distributors.html` header | `distributors-coastal-98.jpg` | `coastal_mountain_supercar_no_bonnet_logo_8k_300dpi.png` |

  Two things changed here at the client's request. The three Supra frames all carried the
  **Petronas Twin Towers** and are now the one badge-free daytime frame; they stay separate
  files because each section aims its own crop with `--shot-pos`. And the earlier Lamborghini
  frames carried the manufacturer's badge on the bonnet, so they were re-cut from the
  `no_bonnet_logo` masters.

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
  specified for it.

- **`#tech` on the home page has to land inside one screen**, on the client's note. Three
  things get it there and all of them matter: `.fit-screen` trades padding away and
  rebalances the split towards the copy (the headline was ragging to four lines in the
  narrow column), `.shot-img--cap` stops the photograph from being what decides the
  section's height, and `.spec-groups--row` runs the ten highlights as three columns
  across the foot instead of three stacked rows inside the copy. Measured at 549px in a
  640px viewport, and 593px in a 950px one. If you add copy to this section, re-measure.
- **The earlier supplied photographs** are `lab-viscometer.jpg`, `engine-pour.jpg`,
  `diesel-pickup.jpg`, `sustainability-engine.jpg` and `scene-workshop.jpg`. They have no
  replacement in the client's `Selected/` folder, so `tools/build-images.py` leaves them
  alone. `engine-pour.jpg` was darkened to 82% brightness on request and is currently
  unplaced - it held the home `#tech` panel until the Supra replaced it. `scene-workshop.jpg`
  is an older yellow Lamborghini frame and is also unplaced now that
  `distributors-coastal-98.jpg` carries that header.

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

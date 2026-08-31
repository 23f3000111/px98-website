#!/usr/bin/env node
/* ============================================================
   PX98 - static SEO generator

   The site itself still has no build step: every file this writes is committed
   and served as plain HTML. This is a one-off tool, like tools/build-images.py,
   run by hand when the catalogue or the shared chrome changes.

     node tools/build-seo.js

   It owns four things, and nothing else in the repo duplicates them:

     1. product-<id>.html          one real page per catalogue entry
     2. sitemap.xml                every indexable URL, with lastmod
     3. the static nav and footer  written into every page between markers
     4. the static product grid    written into products.html between markers

   Why any of this exists: the catalogue used to live only at product.html?id=,
   drawn by JavaScript, with every product canonicalised to the one URL. Google
   therefore had a single product page to index instead of 37, and the crawlers
   the answer engines run - GPTBot, ClaudeBot, PerplexityBot - execute no
   JavaScript at all, so they saw an empty <div>. The same was true of the nav
   and the footer, which between them are the whole internal link graph.

   Everything below is generated from assets/js/products.js. That file stays the
   single source of truth for the catalogue; re-run this after editing it.
   ============================================================ */

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT   = path.resolve(__dirname, '..');
const ORIGIN = 'https://www.px98lubricants.com';
const OG     = ORIGIN + '/assets/img/brand/og-share.jpg';
/* No longer stamped into the sitemap: lastmod was the only date signal the site
   published, and Google was printing it as "1 day ago" against the result. */
const YEAR   = new Date().getFullYear();

/* ---------------------------------------------------------
   Catalogue
   --------------------------------------------------------- */
global.window = {};
require(path.join(ROOT, 'assets/js/products.js'));
const PRODUCTS = global.window.PX98_PRODUCTS;

/* Kept in step with PACKED in assets/js/px98.js: the products the client has
   supplied a finished pack render for. One without a render falls through to the
   CSS plate on screen, and to the shared share card in its metadata. */
const PACKED = new Set([
  'eco-power-sae-0w-20-sp-rc-gf-6a', 'eco-power-sae-0w-30-sp-rc-gf-6a',
  'eco-power-sae-5w-30-sp-rc-gf-6a', 'turbo-power-sae-5w-40-sp', 'turbo-power-sae-5w-50-sp',
  'advan-power-sae-5w-30-sp-rc-gf-6a', 'advan-power-sae-10w-40-sp',
  'advan-blend-sae-10w-30-sn-cf', 'advan-blend-sae-15w-40-sn-cf', 'advan-blend-sae-20w-50-sl-cf',
  '4x4-turbo-power-sae-5w-30-ck-4-sn', '4x4-turbo-power-sae-10w-40-ck-4-sn',
  '4x4-diesel-power-sae-10w-30-cj-4-sn', '4x4-diesel-power-sae-10w-40-cj-4-sn',
  'shift-force-manual-sae-75w-90-gl-4', 'shift-force-manual-sae-80w-90-gl-4',
  'shift-force-limited-slip-axle-gear-sae-80w-90-gl-5',
  'shift-force-limited-slip-differential-gear-sae-85w-90-gl-5',
  'shift-force-hypoid-gear-sae-90-gl-5', 'shift-force-ep-manual-sae-140-gl-4',
  'shift-force-atf-lv', 'shift-force-atf-mv', 'shift-force-atf-dw-1', 'shift-force-atf-ws',
  'shift-force-ammix-d3-sp', 'shift-force-dctf', 'shift-force-cvtf',
  'shift-force-9hp-pro', 'shift-force-atf-8hp-pro',
  'cool-xtra-30-70-red', 'cool-xtra-30-70-blue', 'cool-xtra-30-70-green',
  'super-dot-4-brake-fluid', 'modern-dot-5-1-brake-fluid',
  'engine-cleaning-flush', 'engine-performance-treatment'
]);

const NAV = [
  { href: 'index.html',        label: 'Home',         key: 'home' },
  { href: 'products.html',     label: 'Products',     key: 'products' },
  { href: 'technology.html',   label: 'Technology',   key: 'technology' },
  { href: 'about.html',        label: 'About',        key: 'about' },
  { href: 'distributors.html', label: 'Distributors', key: 'distributors' },
  { href: 'contact.html',      label: 'Contact',      key: 'contact' }
];

const CATS = [
  { key: 'pcmo',    label: 'Passenger Car Engine Oil' },
  { key: 'diesel',  label: 'Diesel Oil' },
  { key: 'atf',     label: 'ATF' },
  { key: 'gear',    label: 'Gear Oil' },
  { key: 'coolant', label: 'Coolants' },
  { key: 'service', label: 'Brake Fluid' }
];

const CHEV = '<svg class="chev" viewBox="0 0 16 9" aria-hidden="true"><path d="M0 4.5h13M9.5 1l3.5 3.5L9.5 8" stroke="currentColor" stroke-width="1.4" fill="none"/></svg>';

/* ---------------------------------------------------------
   Helpers
   --------------------------------------------------------- */
const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/* JSON-LD sits inside <script>, not inside markup, so the escaping it needs is
   the opposite of esc(): leave the text itself alone, and only neutralise the
   three characters that can break out of a script element - a literal < that
   could start </script, and the U+2028/U+2029 line separators a JSON string is
   allowed to carry through raw. split/join, not a regex literal, so the source
   of this file never has to contain those characters itself. */
const LSEP = String.fromCharCode(0x2028);
const PSEP = String.fromCharCode(0x2029);
const ld = obj => JSON.stringify(obj, null, 2)
  .split('<').join('\\u003c')
  .split(LSEP).join('\\u2028')
  .split(PSEP).join('\\u2029');

const productUrl = id => 'product-' + id + '.html';
const packSrc    = id => PACKED.has(id) ? 'assets/img/packs/px98/' + id + '.webp' : null;
const abs        = rel => ORIGIN + '/' + rel.replace(/^\.?\//, '');

/* Replaces the block between <!--{name}--> and <!--{/name}-->, markers kept. A
   page without the markers is left untouched and reported, so a missing marker
   is visible rather than silent. */
function fill(html, name, body) {
  const re = new RegExp('(<!--\\{' + name + '\\}-->)[\\s\\S]*?(<!--\\{/' + name + '\\}-->)');
  if (!re.test(html)) return { html, hit: false };
  return { html: html.replace(re, '$1\n' + body + '\n$2'), hit: true };
}

/* ---------------------------------------------------------
   Shared chrome - the static twin of buildNav/buildFoot in px98.js
   --------------------------------------------------------- */
function navHtml(page) {
  return '' +
  '<div id="scan"></div>\n' +
  '<header id="top-nav"><div class="nav-in">' +
    '<a class="mark" href="index.html" aria-label="PX98 home">' +
      '<img src="assets/img/brand/px98-logo.png" alt="PX98 Lubricants" width="325" height="260">' +
    '</a>' +
    '<nav class="nav-links" aria-label="Primary">' +
      NAV.map(n => '<a href="' + n.href + '"' + (n.key === page ? ' aria-current="page"' : '') + '>' + n.label + '</a>').join('') +
    '</nav>' +
    '<a class="btn btn--y nav-cta" href="distributors.html"><span>Become a distributor</span>' + CHEV + '</a>' +
    '<button class="burger" id="burger" aria-label="Open menu" aria-expanded="false"><i></i><i></i><i></i></button>' +
  '</div></header>\n' +
  '<div id="drawer">' +
    NAV.map((n, i) => '<a href="' + n.href + '">' + n.label + '<span>' + String(i + 1).padStart(2, '0') + '</span></a>').join('') +
  '</div>';
}

function footHtml() {
  return '' +
  '<footer><div class="wrap">' +
    '<div class="foot-grid">' +
      '<div class="foot-about">' +
        '<span class="foot-mark"><img src="assets/img/brand/prince-logo.png" alt="Prince Lubricants" width="314" height="128"></span>' +
        '<p>PX98 represents a new generation of premium automotive lubricants developed by PRINCE GLOBAL PTE. LTD.</p>' +
      '</div>' +
      '<div class="foot-col"><h4>Products</h4><ul>' +
        CATS.map(c => '<li><a href="products.html?cat=' + c.key + '">' + c.label + '</a></li>').join('') +
      '</ul></div>' +
      '<div class="foot-col"><h4>Company</h4><ul>' +
        '<li><a href="about.html">Who we are</a></li>' +
        '<li><a href="technology.html">Technology</a></li>' +
        '<li><a href="faq.html">Common questions</a></li>' +
        '<li><a href="about.html#quality">Quality assurance</a></li>' +
        '<li><a href="about.html#sustainability">Sustainability</a></li>' +
      '</ul></div>' +
      '<div class="foot-col"><h4>Connect</h4><ul>' +
        '<li><a href="distributors.html">Become a distributor</a></li>' +
        '<li><a href="contact.html">Contact us</a></li>' +
        '<li><a href="contact.html#find">Find a stockist</a></li>' +
      '</ul></div>' +
    '</div>' +
    '<div class="foot-base">' +
      '<p>&copy; <span id="foot-year">' + YEAR + '</span> Prince Global Pte. Ltd. · Performance excellence since 1998</p>' +
      '<div class="foot-social"></div>' +
    '</div>' +
    /* The studio credit. On its own line under the copyright rather than tucked in
       beside it: the client asked for this one to be unmissable. */
    '<div class="foot-credit"><p>Designed and developed by <a href="https://www.imsuyaglobal.com/" target="_blank" rel="noopener">Imsuya Global</a></p></div>' +
  '</div></footer>\n' +
  '<button id="totop" aria-label="Back to top"><svg viewBox="0 0 16 9" aria-hidden="true"><path d="M0 4.5h13M9.5 1l3.5 3.5L9.5 8" stroke="currentColor" stroke-width="1.6" fill="none"/></svg></button>';
}

/* The static twin of packShot() and pcard() in px98.js. */
function packShot(p) {
  const src = packSrc(p.id);
  if (src) return '<img class="pack-art" src="' + src + '" alt="' + esc(p.name) + ' pack" loading="lazy">';
  return '<div class="plate-pack" role="img" aria-label="' + esc(p.name) + ' pack, artwork pending">' +
           '<div class="plate-pack-mark"><span class="px">PX</span><span class="n98">98</span></div>' +
           '<div class="plate-pack-band">' + esc(p.family || p.type) + '</div>' +
         '</div>';
}

function pcard(p) {
  const name = p.grade || p.variant || p.name.replace('PX98 ', '');
  return '<a class="pcard" href="' + productUrl(p.id) + '">' +
    '<div class="pcard-top"><span class="pcard-cat">' + esc(p.type) + '</span>' +
      (p.euro ? '<span class="pcard-euro">Euro spec</span>' : '') + '</div>' +
    '<div class="pcard-shot">' + packShot(p) + '</div>' +
    (p.family ? '<div class="pcard-fam">' + esc(p.family) + '</div>' : '') +
    '<div class="pcard-name' + (name.length > 14 ? ' long' : '') + '">' + esc(name) + '</div>' +
    '<dl class="pcard-meta">' +
      '<div><dt>Base type</dt><dd>' + esc(p.base || 'To be confirmed') + '</dd></div>' +
      (p.industry ? '<div><dt>Performance level</dt><dd>' + esc(p.industry) + '</dd></div>' : '') +
    '</dl>' +
  '</a>';
}

/* ---------------------------------------------------------
   Product page
   --------------------------------------------------------- */

/* The title carries the searched words. "px98 engine oil" and "px98 lubricants"
   are what people type, and the product name on its own answers neither, so the
   suffix names the category and the brand in the words a searcher uses. Kept
   under the ~60 characters Google renders wherever the product name allows it. */
function pageTitle(p) {
  const tail = /Engine Oil|Motor Oil/i.test(p.type) ? 'PX98 Engine Oil' : 'PX98 Lubricants';
  /* Google renders about 60 characters and truncates the rest, so the suffix is
     only worth carrying while the whole title still fits. A name long enough to
     crowd it out - the coolants, the limited slip gear oils - already opens with
     PX98 and already names its own category, so it stands on its own. */
  const full = p.name + ' | ' + tail;
  return full.length <= 65 ? full : p.name;
}

/* Meta descriptions are cut to fit the ~160 characters Google renders, on a word
   boundary, out of the facts a searcher is actually matching on: what the fluid
   is, what it is made of, and what it is approved against. */
function metaDesc(p) {
  const bits = [p.name + '.', p.base + ' ' + p.type.toLowerCase() + '.'];
  if (p.industry) bits.push(p.industry + '.');
  if (p.apps) bits.push('For ' + p.apps.charAt(0).toLowerCase() + p.apps.slice(1) + '.');
  let out = bits.join(' ');
  if (out.length > 158) out = out.slice(0, 158).replace(/\s+\S*$/, '') + '…';
  return out;
}

function productJsonLd(p) {
  const url = abs(productUrl(p.id));
  const img = packSrc(p.id);

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      '@id': url + '#product',
      name: p.name,
      sku: p.id,
      mpn: p.id,
      description: p.desc,
      url,
      image: img ? abs(img) : OG,
      category: p.catLabel,
      brand: { '@type': 'Brand', name: 'PX98' },
      manufacturer: { '@type': 'Organization', '@id': ORIGIN + '/#org' },
      /* The spec sheet, modelled as it reads on the page. No offers, no price and
         no rating: the site sells through distributors and has never quoted a
         figure, and inventing one to win a rich result is exactly the kind of
         markup that earns a manual action. */
      additionalProperty: p.specs.map(s => ({ '@type': 'PropertyValue', name: s.k, value: s.v })),
      isSimilarTo: PRODUCTS
        .filter(x => x.cat === p.cat && x.id !== p.id).slice(0, 4)
        .map(x => ({ '@type': 'Product', name: x.name, url: abs(productUrl(x.id)) }))
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'PX98',     item: ORIGIN + '/' },
        { '@type': 'ListItem', position: 2, name: 'Products', item: abs('products.html') },
        { '@type': 'ListItem', position: 3, name: p.catLabel, item: abs('products.html?cat=' + p.cat) },
        { '@type': 'ListItem', position: 4, name: p.name,     item: url }
      ]
    }
  ];
}

function productPage(p) {
  const url   = abs(productUrl(p.id));
  const title = pageTitle(p);
  const desc  = metaDesc(p);
  const img   = packSrc(p.id);
  const share = img ? abs(img) : OG;
  const grade = p.grade ? p.grade.replace('SAE ', '') : '';
  const sibs  = PRODUCTS.filter(x => x.cat === p.cat && x.id !== p.id).slice(0, 4);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
<meta property="og:type" content="product">
<meta property="og:site_name" content="PX98 Lubricants">
<meta property="og:locale" content="en_SG">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${share}">
<meta property="og:image:alt" content="${esc(p.name)} pack">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${share}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@0,62..125,400..900;1,62..125,400..900&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
<link rel="icon" href="favicon.ico" sizes="16x16 32x32 48x48">
<link rel="icon" href="assets/img/brand/favicon-96.png" type="image/png" sizes="96x96">
<link rel="icon" href="assets/img/brand/favicon-48.png" type="image/png" sizes="48x48">
<link rel="icon" href="assets/img/brand/favicon-32.png" type="image/png" sizes="32x32">
<link rel="icon" href="assets/img/brand/favicon-16.png" type="image/png" sizes="16x16">
<link rel="apple-touch-icon" href="assets/img/brand/apple-touch-icon.png">
<link rel="manifest" href="site.webmanifest">
<meta name="theme-color" content="#08090a">
<link rel="stylesheet" href="assets/css/px98.css">
<script type="application/ld+json">
${ld(productJsonLd(p))}
</script>
</head>
<body data-page="products">
<div id="site-nav">
<!--{nav}-->
<!--{/nav}-->
</div>

<main>

<section class="phead" style="padding-bottom:0;border-bottom:0">
  <div class="wrap">
    <nav class="crumb" aria-label="Breadcrumb">
      <a href="index.html">PX98</a> / <a href="products.html">Products</a> / <span id="pd-crumb">${esc(p.catLabel)}</span>
    </nav>
  </div>
</section>

<section class="sect" style="padding-top:36px">
  <div class="wrap">
    <div class="pd" id="pdetail">
      <div class="pd-shot" data-rv="l">
        <div class="pd-stage">${packShot(p)}</div>
      </div>
      <div class="pd-body" data-rv>
        <a class="pd-back" href="products.html?cat=${p.cat}">
          <svg viewBox="0 0 16 9" aria-hidden="true"><path d="M0 4.5h13M9.5 1l3.5 3.5L9.5 8" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>
          All ${esc(p.catLabel)}</a>
        <div class="eyebrow">${esc(p.type)}</div>
        ${grade ? '<div class="pd-grade">' + esc(grade) + '</div>' : ''}
        <h1>${esc(p.name).replace('PX98 ', 'PX98&nbsp;')}</h1>
        <p class="pd-desc">${esc(p.desc)}</p>
        <dl class="spec-list">
${p.specs.map(s => '          <div class="spec-row"><dt>' + esc(s.k) + '</dt><dd>' + esc(s.v) + '</dd></div>').join('\n')}
        </dl>
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:32px">
          <a class="btn btn--y" href="contact.html"><span>Request a quotation</span>${CHEV}</a>
          <a class="btn btn--ghost" href="distributors.html"><span>Distributor enquiry</span></a>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="sect sect--ink1">
  <div class="wrap">
    <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:24px;flex-wrap:wrap;margin-bottom:32px">
      <h2 class="d3" data-rv>Also in this family</h2>
      <a class="mono" href="products.html" style="color:var(--y)" data-rv>View the full range</a>
    </div>
    <div class="pgrid" id="pd-related">
${sibs.map(x => '      ' + pcard(x)).join('\n')}
    </div>
  </div>
</section>

</main>

<div id="site-foot">
<!--{foot}-->
<!--{/foot}-->
</div>
<script src="assets/js/products.js"></script>
<script src="assets/js/px98.js"></script>
<script src="assets/js/chat.js"></script>
</body>
</html>
`;
}

/* ---------------------------------------------------------
   Sitemap
   --------------------------------------------------------- */
function sitemap() {
  const pages = [
    { loc: ORIGIN + '/',             pri: '1.0', freq: 'weekly'  },
    { loc: abs('products.html'),     pri: '0.9', freq: 'weekly'  },
    { loc: abs('technology.html'),   pri: '0.8', freq: 'monthly' },
    { loc: abs('about.html'),        pri: '0.7', freq: 'monthly' },
    { loc: abs('faq.html'),          pri: '0.7', freq: 'monthly' },
    { loc: abs('distributors.html'), pri: '0.7', freq: 'monthly' },
    { loc: abs('contact.html'),      pri: '0.6', freq: 'monthly' }
  ].concat(PRODUCTS.map(p => ({ loc: abs(productUrl(p.id)), pri: '0.8', freq: 'monthly' })));

  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    pages.map(u =>
      '  <url>\n' +
      '    <loc>' + u.loc + '</loc>\n' +
      '    <changefreq>' + u.freq + '</changefreq>\n' +
      '    <priority>' + u.pri + '</priority>\n' +
      '  </url>'
    ).join('\n') + '\n</urlset>\n';
}

/* ---------------------------------------------------------
   llms.txt

   The convention answer engines are converging on: one markdown file at the root
   that states plainly what the site is and what is on it, so a crawler arriving
   without rendering anything still leaves with the shape of the catalogue. It
   invents no fact - every line is generated from the same catalogue the pages are.
   --------------------------------------------------------- */
function llms() {
  const byCat = CATS.map(c => ({
    label: c.label,
    items: PRODUCTS.filter(p => p.cat === c.key)
  })).filter(g => g.items.length);

  const head = [
    '# PX98 Lubricants',
    '',
    '> PX98 is a premium automotive lubricant brand developed by PRINCE GLOBAL PTE. LTD.,',
    '> a Singapore manufacturer. The range covers passenger car engine oils, commercial',
    '> diesel engine oils, automatic transmission fluids, gear oils, coolants and vehicle',
    '> service fluids, formulated against API, ILSAC, ACEA and OEM performance levels.',
    '',
    'Brand: PX98. Manufacturer: PRINCE GLOBAL PTE. LTD., Singapore. Established 1998.',
    'Sold through appointed distributors rather than direct. No prices are published.',
    '',
    '## Pages',
    '',
    '- [Home](' + ORIGIN + '/): the brand, the range and the viscosity coverage',
    '- [Products](' + abs('products.html') + '): all ' + PRODUCTS.length + ' products, filterable by category, grade and approval',
    '- [Technology](' + abs('technology.html') + '): base stocks, additive systems and the performance that follows',
    '- [About](' + abs('about.html') + '): PRINCE GLOBAL PTE. LTD., quality assurance and sustainability',
    '- [FAQ](' + abs('faq.html') + '): viscosity grades, API and ILSAC categories, Low SAPS, LSPI, ATF against CVT and DCT, DOT 4 against DOT 5.1',
    '- [Distributors](' + abs('distributors.html') + '): exclusive territory appointments and the enquiry form',
    '- [Contact](' + abs('contact.html') + '): product, technical and distribution enquiries',
    '',
    '## Product catalogue',
    ''
  ];

  const body = byCat.reduce((acc, g) => acc.concat(
    ['### ' + g.label, ''],
    g.items.map(p =>
      '- [' + p.name + '](' + abs(productUrl(p.id)) + '): ' + p.base +
      (p.industry ? '. ' + p.industry : '') +
      (p.apps ? '. For ' + p.apps : '') + '.'
    ),
    ['']
  ), []);

  return head.concat(body).join('\n') + '\n';
}

/* The catalogue as an ItemList, written into the head of products.html. A category
   or grade filter only changes the query string, so the listing page is one URL:
   the ItemList is how a crawler learns how many products stand behind it, and
   where each one lives. */
function itemListLd() {
  return '<script type="application/ld+json">\n' + ld({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': abs('products.html') + '#catalogue',
    name: 'PX98 product range',
    numberOfItems: PRODUCTS.length,
    itemListOrder: 'https://schema.org/ItemListUnordered',
    itemListElement: PRODUCTS.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: abs(productUrl(p.id)),
      name: p.name
    }))
  }) + '\n<\/script>';
}

/* ---------------------------------------------------------
   Run
   --------------------------------------------------------- */
const touched = new Set();
const skipped = [];

/* 1. one page per product */
for (const p of PRODUCTS) fs.writeFileSync(path.join(ROOT, productUrl(p.id)), productPage(p));

/* 2. sitemap */
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap());

/* 2b. llms.txt, the same catalogue stated for the answer engines */
fs.writeFileSync(path.join(ROOT, 'llms.txt'), llms());

/* 3 + 4. shared chrome, and the crawlable grid, into every page that asks for it */
const pageOf = f =>
  f === 'index.html'   ? 'home' :
  /^product-/.test(f)  ? 'products' :
  f.replace('.html', '');

const staticGrid = PRODUCTS.map(p => '      ' + pcard(p)).join('\n');

for (const f of fs.readdirSync(ROOT).filter(n => n.endsWith('.html')).sort()) {
  let html = fs.readFileSync(path.join(ROOT, f), 'utf8');
  let hits = 0;

  let r = fill(html, 'nav',   navHtml(pageOf(f))); html = r.html; if (r.hit) hits++;
  r     = fill(html, 'foot',  footHtml());         html = r.html; if (r.hit) hits++;
  r     = fill(html, 'pgrid', staticGrid);         html = r.html; if (r.hit) hits++;
  r     = fill(html, 'itemlist', itemListLd());    html = r.html; if (r.hit) hits++;

  if (!hits) { skipped.push(f); continue; }
  fs.writeFileSync(path.join(ROOT, f), html);
  touched.add(f);
}

console.log('PX98 SEO build');
console.log('  products   ' + PRODUCTS.length + ' pages');
console.log('  llms.txt   ' + PRODUCTS.length + ' products listed');
console.log('  sitemap    ' + (PRODUCTS.length + 7) + ' urls');
console.log('  chrome     written into ' + touched.size + ' pages');
if (skipped.length) console.log('  no markers ' + skipped.join(', '));

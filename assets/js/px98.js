/* ============================================================
   PX98 — site behaviour
   No build step, no libraries, runs straight off the filesystem.
   ============================================================ */
(function () {
  'use strict';

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  var CHEV = '<svg class="chev" viewBox="0 0 16 9" aria-hidden="true"><path d="M0 4.5h13M9.5 1l3.5 3.5L9.5 8" stroke="currentColor" stroke-width="1.4" fill="none"/></svg>';

  var NAV = [
    { href: 'index.html',        label: 'Home',        key: 'home' },
    { href: 'products.html',     label: 'Products',    key: 'products' },
    { href: 'technology.html',   label: 'Technology',  key: 'technology' },
    { href: 'about.html',        label: 'About',       key: 'about' },
    { href: 'distributors.html', label: 'Distributors',key: 'distributors' },
    { href: 'contact.html',      label: 'Contact',     key: 'contact' }
  ];

  var CATS = [
    { key: 'pcmo',    label: 'Passenger Car' },
    { key: 'diesel',  label: 'Commercial Diesel' },
    { key: 'atf',     label: 'Automatic Transmission' },
    { key: 'gear',    label: 'Gear Oils' },
    { key: 'coolant', label: 'Coolants' },
    { key: 'service', label: 'Service Fluids' }
  ];

  /* ---------------------------------------------------------
     Shared chrome
     --------------------------------------------------------- */
  /* variant 'type' keeps the endorsement legible at nav scale; 'logo' uses the
     supplied Prince mark where there is room for it to read. */
  function mark(variant) {
    var by = variant === 'logo'
      ? '<span class="mark-by mark-by--logo"><span>Another brand by</span>' +
          '<img src="assets/img/brand/prince-logo.png" alt="Prince Lubricants"></span>'
      : '<span class="mark-by"><span>Another</span><span>brand by</span><b>Prince</b></span>';
    return '<a class="mark" href="index.html" aria-label="PX98 home">' +
             '<span class="mark-lock"><span class="px">PX</span><span class="n98">98</span></span>' +
             by +
           '</a>';
  }

  function buildNav(page) {
    var host = $('#site-nav');
    if (!host) return;
    host.innerHTML =
      '<div id="scan"></div>' +
      '<header id="top-nav"><div class="nav-in">' +
        mark('type') +
        '<nav class="nav-links" aria-label="Primary">' +
          NAV.map(function (n) {
            return '<a href="' + n.href + '"' + (n.key === page ? ' aria-current="page"' : '') + '>' + n.label + '</a>';
          }).join('') +
        '</nav>' +
        '<a class="btn btn--y nav-cta" href="distributors.html"><span>Become a distributor</span>' + CHEV + '</a>' +
        '<button class="burger" id="burger" aria-label="Open menu" aria-expanded="false"><i></i><i></i><i></i></button>' +
      '</div></header>' +
      '<div id="drawer">' +
        NAV.map(function (n, i) {
          return '<a href="' + n.href + '">' + n.label + '<span>' + String(i + 1).padStart(2, '0') + '</span></a>';
        }).join('') +
      '</div>';
  }

  function buildFoot() {
    var host = $('#site-foot');
    if (!host) return;
    host.innerHTML =
      '<footer><div class="wrap">' +
        '<div class="foot-grid">' +
          '<div class="foot-about">' + mark('logo') +
            '<p>PX98 is a premium automotive lubricant brand proudly developed by PRINCE GLOBAL PTE. LTD., Singapore.</p>' +
          '</div>' +
          '<div class="foot-col"><h4>Products</h4><ul>' +
            '<li><a href="products.html?cat=pcmo">Passenger Car Engine Oils</a></li>' +
            '<li><a href="products.html?cat=diesel">Heavy Duty Diesel Oils</a></li>' +
            '<li><a href="products.html?cat=atf">Transmission Fluids</a></li>' +
            '<li><a href="products.html?cat=gear">Gear Oils</a></li>' +
            '<li><a href="products.html?cat=coolant">Coolants &amp; Maintenance Fluids</a></li>' +
          '</ul></div>' +
          '<div class="foot-col"><h4>Company</h4><ul>' +
            '<li><a href="about.html">Who we are</a></li>' +
            '<li><a href="technology.html">Technology</a></li>' +
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
          '<p>&copy; ' + new Date().getFullYear() + ' Prince Global Pte. Ltd. — Performance excellence since 1998</p>' +
          '<div class="foot-social">' +
            '<a href="#" aria-label="Facebook">FB</a>' +
            '<a href="#" aria-label="Instagram">IG</a>' +
            '<a href="#" aria-label="YouTube">YT</a>' +
            '<a href="#" aria-label="LinkedIn">IN</a>' +
          '</div>' +
        '</div>' +
      '</div></footer>' +
      '<button id="totop" aria-label="Back to top"><svg viewBox="0 0 16 9" aria-hidden="true"><path d="M0 4.5h13M9.5 1l3.5 3.5L9.5 8" stroke="currentColor" stroke-width="1.6" fill="none"/></svg></button>' +
      '<aside id="mock-note"><button aria-label="Dismiss">&times;</button>' +
        '<b>Presentation mockup</b> Pack shots are the approved PX98 label artwork. Photography is placeholder.' +
      '</aside>';
  }

  /* ---------------------------------------------------------
     Behaviour
     --------------------------------------------------------- */
  function chrome() {
    var nav = $('#top-nav'), scan = $('#scan'), totop = $('#totop');
    var burger = $('#burger'), drawer = $('#drawer'), note = $('#mock-note');
    var heroField = REDUCED ? null : $('#heroField');

    function onScroll() {
      var y = window.scrollY;
      if (nav) nav.classList.toggle('stuck', y > 24);
      if (totop) totop.classList.toggle('on', y > 640);
      if (note) note.classList.toggle('on', y > 220);
      if (heroField && y < window.innerHeight * 1.3) {
        // the field is 128% of the hero, so 130px of lag never exposes an edge
        heroField.style.transform = 'translate3d(0,' + Math.min(y * 0.22, 130) + 'px,0)';
      }
      if (scan) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        scan.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (burger && drawer) {
      burger.addEventListener('click', function () {
        var open = drawer.classList.toggle('on');
        burger.classList.toggle('on', open);
        burger.setAttribute('aria-expanded', String(open));
        document.body.style.overflow = open ? 'hidden' : '';
      });
      $$('a', drawer).forEach(function (a) {
        a.addEventListener('click', function () { document.body.style.overflow = ''; });
      });
    }

    if (totop) totop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' });
    });

    if (note) $('button', note).addEventListener('click', function () { note.remove(); });
  }

  function reveals() {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    $$('[data-rv]').forEach(function (el, i) {
      var d = el.getAttribute('data-delay');
      el.style.transitionDelay = (d ? d : (i % 6) * 0) + 'ms';
      io.observe(el);
    });
    $$('.mask').forEach(function (el) { io.observe(el); });
  }

  function counters() {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        var el = e.target, target = parseFloat(el.dataset.count), t0 = null, dur = 1500;
        if (REDUCED) { el.textContent = target; return; }
        requestAnimationFrame(function step(t) {
          if (t0 === null) t0 = t;
          var p = Math.min((t - t0) / dur, 1);
          el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target);
          if (p < 1) requestAnimationFrame(step);
        });
      });
    }, { threshold: 0.6 });
    $$('[data-count]').forEach(function (el) { io.observe(el); });
  }

  function magnets() {
    if (REDUCED || window.matchMedia('(hover: none)').matches) return;
    $$('.btn').forEach(function (b) {
      b.addEventListener('mousemove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.transform = 'translate(' + (e.clientX - r.left - r.width / 2) * 0.09 + 'px,' +
                            ((e.clientY - r.top - r.height / 2) * 0.14 - 2) + 'px)';
      });
      b.addEventListener('mouseleave', function () { b.style.transform = ''; });
    });
  }

  function wipe() {
    if (REDUCED) return;
    var w = document.createElement('div');
    w.id = 'wipe';
    document.body.appendChild(w);
    requestAnimationFrame(function () { w.classList.add('done'); });

    document.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a') : null;
      if (!a) return;
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#' || a.target === '_blank' ||
          /^(https?:|mailto:|tel:)/.test(href)) return;
      e.preventDefault();
      w.classList.remove('done');
      w.classList.add('out');
      setTimeout(function () { window.location.href = href; }, 420);
    });
  }

  /* ---------------------------------------------------------
     Hero grade rail
     --------------------------------------------------------- */
  function rail() {
    var host = $('#grade-rail');
    if (!host) return;
    var grades = ['0W-20', '0W-30', '5W-30', '5W-40', '5W-50', '10W-30', '10W-40', '15W-40', '20W-50'];
    var notes  = ['Hybrid / GDI', 'Euro + JDM', 'Universal', 'Turbo', 'High output',
                  'Fleet diesel', 'High mileage', 'Mixed fleet', 'Severe heat'];

    function steps() {
      return grades.map(function (g, i) {
        return '<button class="rail-step" type="button" data-grade="' + g + '">' + g +
               '<em>' + notes[i] + '</em></button>';
      }).join('');
    }
    // two identical passes so the loop can wrap without a visible seam
    host.innerHTML = steps() + steps();

    host.addEventListener('click', function (e) {
      var b = e.target.closest('.rail-step');
      if (b) window.location.href = 'products.html?grade=' + encodeURIComponent(b.dataset.grade);
    });

    var frame = $('#railMarquee');
    if (!frame || REDUCED) return;

    var span = host.scrollWidth / 2;   // width of one pass
    var x = 0, hold = false, nudge = 0;
    var SPEED = 0.42;                  // px per frame, ~25px/s
    var STEP = 356;                    // two grades per arrow press

    function wrap() {
      if (x <= -span) x += span;
      if (x > 0) x -= span;
    }

    (function loop() {
      if (nudge) {
        var d = nudge * 0.14;
        if (Math.abs(d) < 0.6) { d = nudge; }
        x += d; nudge -= d;
      } else if (!hold) {
        x -= SPEED;
      }
      wrap();
      host.style.transform = 'translate3d(' + x + 'px,0,0)';
      requestAnimationFrame(loop);
    })();

    frame.addEventListener('mouseenter', function () { hold = true; });
    frame.addEventListener('mouseleave', function () { hold = false; });
    frame.addEventListener('focusin',  function () { hold = true; });
    frame.addEventListener('focusout', function () { hold = false; });

    $('.rail-nav--prev', frame).addEventListener('click', function () { nudge += STEP; });
    $('.rail-nav--next', frame).addEventListener('click', function () { nudge -= STEP; });

    window.addEventListener('resize', function () { span = host.scrollWidth / 2; }, { passive: true });
  }

  /* ---------------------------------------------------------
     Catalogue
     --------------------------------------------------------- */
  function packShot(p, cls) {
    if (p.shot) {
      return '<img src="assets/img/packs/' + p.shot + '" alt="' + esc(p.name) + '" loading="lazy">';
    }
    var band = esc(p.family || p.type);
    return '<div class="plate-pack" role="img" aria-label="' + esc(p.name) + ' pack — artwork pending">' +
             '<div class="plate-pack-mark"><span class="px">PX</span><span class="n98">98</span></div>' +
             '<div class="plate-pack-band">' + band + '</div>' +
           '</div>';
  }

  function pcard(p) {
    var grade = p.grade ? p.grade.replace('SAE ', '') : '';
    return '<a class="pcard" href="product.html?id=' + encodeURIComponent(p.id) + '">' +
      '<div class="pcard-top"><span class="pcard-cat">' + esc(p.type) + '</span>' +
        (p.euro ? '<span class="pcard-euro">Euro spec</span>' : '') + '</div>' +
      '<div class="pcard-shot">' + packShot(p) + '</div>' +
      '<div class="pcard-grade' + (grade ? '' : ' na') + '">' + esc(grade || p.variant || 'Fluid') + '</div>' +
      '<div class="pcard-name">' + esc(p.name.replace('PX98 ', '')) + '</div>' +
      '<div class="pcard-spec"><b>' + esc(p.base || '—') + '</b><br>' +
        esc((p.industry || '—').split(',').slice(0, 3).join(' · ')) + '</div>' +
    '</a>';
  }

  function catalogue() {
    var grid = $('#pgrid');
    if (!grid || !window.PX98_PRODUCTS) return;
    var all = window.PX98_PRODUCTS;
    var params = new URLSearchParams(window.location.search);
    var state = {
      cat: params.get('cat') || 'all',
      grade: params.get('grade') || '',
      q: params.get('q') || ''
    };

    var bar = $('#filters');
    if (bar) {
      bar.innerHTML =
        '<button class="filter" data-cat="all">All<b>' + all.length + '</b></button>' +
        CATS.map(function (c) {
          var n = all.filter(function (p) { return p.cat === c.key; }).length;
          return '<button class="filter" data-cat="' + c.key + '">' + c.label + '<b>' + n + '</b></button>';
        }).join('');
      $$('.filter', bar).forEach(function (b) {
        b.addEventListener('click', function () {
          state.cat = b.dataset.cat; state.grade = ''; draw();
        });
      });
    }

    var search = $('#psearch');
    if (search) {
      search.value = state.q;
      search.addEventListener('input', function () { state.q = search.value; draw(); });
    }

    function draw() {
      var q = state.q.trim().toLowerCase();
      var list = all.filter(function (p) {
        if (state.cat !== 'all' && p.cat !== state.cat) return false;
        if (state.grade && p.grade.replace('SAE ', '') !== state.grade) return false;
        if (q) {
          var hay = (p.name + ' ' + p.industry + ' ' + p.oem + ' ' + p.apps + ' ' + p.base).toLowerCase();
          if (hay.indexOf(q) === -1) return false;
        }
        return true;
      });

      $$('.filter').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.dataset.cat === state.cat && !state.grade));
      });

      var count = $('#pcount');
      if (count) {
        count.textContent = list.length + (list.length === 1 ? ' product' : ' products') +
          (state.grade ? ' · SAE ' + state.grade : '');
      }

      grid.innerHTML = list.length
        ? list.map(function (p, i) {
            return pcard(p).replace('class="pcard"', 'class="pcard" style="animation-delay:' + Math.min(i * 32, 420) + 'ms"');
          }).join('')
        : '<p class="mono" style="grid-column:1/-1;padding:48px 0">No products match that filter. ' +
          '<a href="products.html" style="color:var(--y)">Clear filters</a></p>';
    }
    draw();
  }

  /* ---------------------------------------------------------
     Product detail
     --------------------------------------------------------- */
  function detail() {
    var host = $('#pdetail');
    if (!host || !window.PX98_PRODUCTS) return;
    var id = new URLSearchParams(window.location.search).get('id');
    var all = window.PX98_PRODUCTS;
    var p = all.filter(function (x) { return x.id === id; })[0] || all[0];

    document.title = p.name + ' — PX98';
    var crumb = $('#pd-crumb');
    if (crumb) crumb.textContent = p.catLabel;

    var grade = p.grade ? p.grade.replace('SAE ', '') : '';
    host.innerHTML =
      '<div class="pd-shot" data-rv="l">' +
        '<div class="pd-stage">' + packShot(p) + '</div>' +
        '<div class="mono" style="margin-top:14px;font-size:9.5px">' +
          (p.exactArt ? 'Approved label artwork' : 'Representative pack — artwork in production') +
        '</div>' +
      '</div>' +
      '<div class="pd-body" data-rv>' +
        '<a class="pd-back" href="products.html?cat=' + p.cat + '">' +
          '<svg viewBox="0 0 16 9" aria-hidden="true"><path d="M0 4.5h13M9.5 1l3.5 3.5L9.5 8" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>' +
          'All ' + esc(p.catLabel) + '</a>' +
        '<div class="eyebrow">' + esc(p.type) + '</div>' +
        (grade ? '<div class="pd-grade">' + esc(grade) + '</div>' : '') +
        '<h1>' + esc(p.name).replace('PX98 ', 'PX98&nbsp;') + '</h1>' +
        '<p class="pd-desc">' + esc(p.desc) + '</p>' +
        '<dl class="spec-list">' +
          p.specs.map(function (s) {
            return '<div class="spec-row"><dt>' + esc(s.k) + '</dt><dd>' + esc(s.v) + '</dd></div>';
          }).join('') +
        '</dl>' +
        '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:32px">' +
          '<a class="btn btn--y" href="contact.html"><span>Request a quotation</span>' + CHEV + '</a>' +
          '<a class="btn btn--ghost" href="distributors.html"><span>Distributor enquiry</span></a>' +
        '</div>' +
      '</div>';

    var rel = $('#pd-related');
    if (rel) {
      var siblings = all.filter(function (x) { return x.cat === p.cat && x.id !== p.id; }).slice(0, 4);
      rel.innerHTML = siblings.map(pcard).join('');
    }
  }

  /* ---------------------------------------------------------
     Forms — mockup only, nothing is sent anywhere
     --------------------------------------------------------- */
  function forms() {
    $$('form[data-mock]').forEach(function (f) {
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        var btn = $('button[type=submit]', f);
        if (!btn) return;
        var was = btn.innerHTML;
        btn.innerHTML = '<span>Received — this is a mockup</span>';
        setTimeout(function () { btn.innerHTML = was; }, 2600);
      });
    });
  }

  /* --------------------------------------------------------- */
  function init() {
    buildNav(document.body.dataset.page || '');
    buildFoot();
    chrome();
    rail();
    catalogue();
    detail();
    reveals();
    counters();
    magnets();
    forms();
    wipe();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

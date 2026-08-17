/* ============================================================
   PX98 Assistant
   A two-way product finder that answers against the real catalogue:
   viscosity grades, OEM approvals, industry specs, applications.
   Runs entirely in the page, no backend and no keys. Swap `reply()`
   for a server call when a live model is wired up.
   ============================================================ */
(function () {
  'use strict';

  var KEY = 'px98-chat-v1';
  var P = function () { return window.PX98_PRODUCTS || []; };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  /* ---------- knowledge ---------- */

  var MAKES = ['bmw', 'mercedes', 'mercedes-benz', 'benz', 'porsche', 'volkswagen', 'vw', 'audi',
    'volvo', 'toyota', 'lexus', 'scion', 'honda', 'acura', 'ford', 'chrysler', 'jeep', 'mopar',
    'dodge', 'fiat', 'opel', 'gm', 'chevrolet', 'hyundai', 'kia', 'nissan', 'mazda', 'subaru',
    'mitsubishi', 'suzuki', 'daihatsu', 'perodua', 'proton', 'jaguar', 'land rover', 'range rover',
    'renault', 'peugeot', 'citroen', 'psa', 'ferrari', 'geely', 'byd', 'chery', 'gwm', 'changan',
    'lynk', 'cummins', 'caterpillar', 'detroit', 'deutz', 'mack', 'man', 'mtu', 'scania', 'iveco',
    'zf', 'allison', 'aisin', 'voith'];

  /* how a make written by a driver maps to the strings used in the OEM column */
  var MAKE_ALIAS = {
    'mercedes': 'MB ', 'mercedes-benz': 'MB ', 'benz': 'MB ',
    'vw': 'VW ', 'volkswagen': 'VW ', 'audi': 'VW ',
    'chevrolet': 'GM ', 'range rover': 'Jaguar Land Rover', 'land rover': 'Jaguar Land Rover',
    'jaguar': 'Jaguar Land Rover', 'lexus': 'Toyota', 'scion': 'Toyota', 'acura': 'Honda',
    'dodge': 'Chrysler', 'mopar': 'Mopar', 'proton': 'Perodua', 'citroen': 'PSA', 'peugeot': 'PSA'
  };

  var CATNAME = {
    pcmo: 'passenger car engine oils', diesel: 'commercial diesel engine oils',
    atf: 'automatic transmission fluids', gear: 'gear oils',
    coolant: 'coolants', service: 'service fluids'
  };

  /* ---------- search ---------- */

  function grades(text) {
    var out = [], m, re = /\b(\d{1,2})\s?w[\s-]?(\d{2})\b/gi;
    while ((m = re.exec(text))) out.push(m[1] + 'W-' + m[2]);
    return out;
  }

  function byGrade(g) {
    return P().filter(function (p) { return p.grade.replace('SAE ', '') === g; });
  }

  function byText(needle) {
    var n = needle.toLowerCase();
    return P().filter(function (p) {
      return (p.name + ' ' + p.industry + ' ' + p.oem + ' ' + p.apps + ' ' +
              p.base + ' ' + p.type).toLowerCase().indexOf(n) !== -1;
    });
  }

  function byCat(c) { return P().filter(function (p) { return p.cat === c; }); }

  /* ---------- guided finder ---------- */

  var FINDER = [
    { q: 'What are we filling?',
      opts: [['Car or SUV', 'car'], ['Truck or fleet', 'truck'],
             ['Transmission', 'trans'], ['Coolant or brake fluid', 'service']],
      key: 'use' },
    { q: 'What kind of engine?',
      opts: [['Petrol', 'petrol'], ['Hybrid', 'hybrid'], ['Turbo / GDI', 'turbo'], ['Diesel', 'diesel']],
      key: 'engine', when: function (a) { return a.use === 'car'; } },
    { q: 'How much has it done?',
      opts: [['Under 100,000 km', 'new'], ['Over 100,000 km', 'high'], ['Not sure', 'any']],
      key: 'age', when: function (a) { return a.use === 'car'; } },
    { q: 'Which transmission?',
      opts: [['Automatic (ATF)', 'atf'], ['CVT', 'cvt'], ['Dual clutch / DSG', 'dct'],
             ['Manual or differential', 'manual']],
      key: 'trans', when: function (a) { return a.use === 'trans'; } }
  ];

  function finderResult(a) {
    if (a.use === 'truck') {
      return { text: 'For commercial diesel, these are the fleet oils. Low-SAPS chemistry protects DPF, DOC and SCR systems.',
               hits: byCat('diesel') };
    }
    if (a.use === 'service') {
      return { text: 'Coolants and service fluids in the range:', hits: byCat('coolant').concat(byCat('service')) };
    }
    if (a.use === 'trans') {
      var map = { atf: 'ATF', cvt: 'CVTF', dct: 'DCTF', manual: 'MANUAL' };
      var hits = a.trans === 'manual' ? byCat('gear') : byText(map[a.trans] || 'ATF');
      return { text: 'Here is what fits that transmission:', hits: hits };
    }
    // car
    var pool = byCat('pcmo');
    if (a.engine === 'hybrid') pool = pool.filter(function (p) { return /Hybrid/i.test(p.apps); });
    if (a.engine === 'turbo')  pool = pool.filter(function (p) { return /Turbocharged|GDI/i.test(p.apps); });
    if (a.engine === 'diesel') return { text: 'For a diesel car, start with the low-SAPS range:', hits: byCat('diesel') };
    if (a.age === 'high')      pool = pool.filter(function (p) { return /High.?Mileage/i.test(p.apps) || /10W-40|15W-40|20W-50/.test(p.grade); });
    if (a.age === 'new')       pool = pool.filter(function (p) { return /0W-|5W-30/.test(p.grade); });
    if (!pool.length) pool = byCat('pcmo');
    return { text: 'Based on that, these are the closest matches. Always check the grade and approval in your owner\'s manual before filling.',
             hits: pool };
  }

  /* ---------- intent ---------- */

  function reply(raw) {
    var t = raw.toLowerCase().trim();
    var g = grades(t);

    if (/^(hi|hello|hey|yo|hola|good (morning|afternoon|evening))\b/.test(t)) {
      return { text: 'Hello. I can look up any PX98 product by viscosity grade, approval or vehicle make. What are you after?',
               chips: ['Find my oil', '0W-20', 'Fluid for a BMW', 'Become a distributor'] };
    }
    if (/^find my oil$|^start over$|help me choose|^not sure$/.test(t)) {
      return { start: 'finder' };
    }
    if (g.length) {
      var hits = byGrade(g[0]);
      return hits.length
        ? { text: 'SAE ' + g[0] + ': ' + hits.length + (hits.length === 1 ? ' product' : ' products') + ' in the range:', hits: hits }
        : { text: 'Nothing in the range is blended to SAE ' + g[0] + ' yet. The engine oil ladder runs 0W-20 through 20W-50.',
            chips: ['0W-20', '5W-30', '10W-40', 'Find my oil'] };
    }

    var make = MAKES.filter(function (m) { return t.indexOf(m) !== -1; })
                    .sort(function (a, b) { return b.length - a.length; })[0];
    if (make) {
      var needle = MAKE_ALIAS[make] || make;
      var mh = byText(needle);
      return mh.length
        ? { text: 'Approved or suitable for ' + make.toUpperCase() + ':', hits: mh }
        : { text: 'I do not have a listed approval for ' + make.toUpperCase() + '. Tell me the grade or the specification from the manual and I will match it.',
            chips: ['Find my oil', 'Talk to a person'] };
    }

    var SPECS = ['api sp', 'api sn', 'ilsac', 'gf-6a', 'acea', 'dexos', 'dexron', 'mercon',
                 'gl-4', 'gl-5', 'ck-4', 'cj-4', 'ci-4', 'jaso', 'dot 4', 'dot 5.1',
                 'lifeguard', 'low saps', 'cvt', 'dct', 'dsg', 'pdk', 'ws', 'dw-1'];
    var spec = SPECS.filter(function (s) { return t.indexOf(s) !== -1; })[0];
    if (spec) {
      var sh = byText(spec === 'dot 4' ? 'DOT 4' : spec === 'dsg' || spec === 'pdk' ? 'DCT' : spec);
      if (sh.length) return { text: 'Matching ' + spec.toUpperCase() + ':', hits: sh };
    }

    if (/hybrid/.test(t))            return { text: 'For hybrids, the low-viscosity Eco Power grades:', hits: byText('Hybrid') };
    if (/turbo|gdi|direct inject/.test(t)) return { text: 'For turbocharged and direct-injection engines:', hits: byText('Turbocharged') };
    if (/high mileage|old car|older/.test(t)) return { text: 'For high-mileage engines:', hits: byText('High-Mileage').concat(byText('High Mileage')) };
    if (/truck|fleet|lorry|bus|heavy/.test(t)) return { text: 'Commercial diesel oils:', hits: byCat('diesel') };
    if (/diesel/.test(t))            return { text: 'The commercial diesel range:', hits: byCat('diesel') };
    if (/coolant|radiator|antifreeze/.test(t)) return { text: 'Radiator protection fluids:', hits: byCat('coolant') };
    if (/brake|clutch fluid/.test(t)) return { text: 'Brake and clutch fluids:', hits: byText('BRAKE') };
    if (/flush|additive|treatment/.test(t)) return { text: 'Service treatments:', hits: byCat('service') };
    if (/gear|differential|axle|manual/.test(t)) return { text: 'Gear and axle oils:', hits: byCat('gear') };
    if (/transmission|atf|gearbox/.test(t)) return { text: 'Automatic transmission fluids:', hits: byCat('atf') };
    if (/engine oil|motor oil|petrol|gasoline|car/.test(t)) return { text: 'Passenger car engine oils:', hits: byCat('pcmo') };

    if (/distribut|dealer|partner|wholesale|stockist|business|territory|agent/.test(t)) {
      return { text: 'We appoint distributors on an exclusive territory basis, with marketing support, sales training and a reliable supply chain out of Singapore. The <a href="distributors.html">distributor page</a> has the enquiry form.',
               chips: ['Open distributor form', 'What is the product range?'] };
    }
    if (/open distributor form/.test(t)) { window.location.href = 'distributors.html'; return { text: 'Opening the distributor form.' }; }
    if (/contact|email|phone|call|reach|address|talk to a person|human/.test(t)) {
      return { text: 'The export team in Singapore handles product, technical and distribution enquiries. The <a href="contact.html">contact page</a> has the form. Contact details are placeholder in this mockup.',
               chips: ['Open contact form', 'Find my oil'] };
    }
    if (/open contact form/.test(t)) { window.location.href = 'contact.html'; return { text: 'Opening the contact form.' }; }
    if (/who|about|prince|singapore|company|1998/.test(t)) {
      return { text: 'PX98 is a premium automotive lubricant brand developed by <b>PRINCE GLOBAL PTE. LTD.</b>, Singapore. Performance excellence since 1998, across six fluid families.',
               chips: ['What is the product range?', 'Technology'] };
    }
    if (/technolog|additive|base oil|molecular|saps|synthetic/.test(t)) {
      return { text: 'Every PX98 oil starts with selected premium base stocks and an advanced additive system: quicker cold-start lubrication, stronger film under load, shear stability and oxidation resistance. The <a href="technology.html">technology page</a> goes through it stage by stage.',
               chips: ['Low SAPS explained', 'Find my oil'] };
    }
    if (/low saps/.test(t)) {
      return { text: 'Low-SAPS means reduced sulphated ash, phosphorus and sulphur. It keeps DPF, DOC and SCR after-treatment systems from fouling on Euro IV to Euro VI diesels.',
               hits: byText('Low SAPS') };
    }
    if (/range|catalogue|catalog|products|how many/.test(t)) {
      return { text: 'Six families: passenger car engine oils, commercial diesel, automatic transmission fluids, gear oils, coolants and service fluids.',
               chips: ['Passenger car', 'Diesel', 'Transmission', 'Coolants'] };
    }
    if (/thank|thanks|cheers|ok|great/.test(t)) {
      return { text: 'Any time. Ask me again whenever you need a grade or an approval matched.', chips: ['Find my oil'] };
    }

    var loose = byText(t);
    if (t.length > 2 && loose.length) return { text: 'Closest matches for "' + esc(raw) + '":', hits: loose };

    /* an open-ended "which oil do I need?" with nothing to go on — walk them through it */
    if (/recommend|which oil|what oil|suggest|advice|help/.test(t)) return { start: 'finder' };

    return { text: 'I did not catch that. I can search by viscosity grade (0W-20), by approval (dexos1, MB 229.5, DEXRON-VI), or by vehicle make.',
             chips: ['Find my oil', 'Passenger car', 'Diesel', 'Become a distributor'] };
  }

  /* ---------- ui ---------- */

  var log, panel, launcher, input, state = { flow: null, step: 0, answers: {} }, history = [];

  function save() {
    try { sessionStorage.setItem(KEY, JSON.stringify({ h: history, s: state, open: panel.classList.contains('on') })); } catch (e) {}
  }

  function scroll() { log.scrollTop = log.scrollHeight; }

  function hitHTML(p) {
    var grade = p.grade ? p.grade.replace('SAE ', '') : (p.variant || 'Fluid');
    var label = p.name.replace('PX98 ', '').replace(p.grade, '').replace(/\s{2,}/g, ' ').trim();
    /* approved label artwork where it exists, same resolver the catalogue uses */
    var src = window.PX98_labelSrc ? window.PX98_labelSrc(p.id) : null;
    var art = src
      ? '<img src="' + src + '" alt="">'
      : '<span class="chat-hit-fallback"></span>';
    return '<a class="chat-hit" href="product.html?id=' + encodeURIComponent(p.id) + '">' +
      '<span class="chat-hit-img">' + art + '</span>' +
      '<span class="chat-hit-txt">' +
        '<span class="chat-hit-g">' + esc(grade) + '</span>' +
        '<span class="chat-hit-n">' + esc(label) + '</span>' +
        '<span class="chat-hit-s">' + esc(p.industry || p.base || p.type) + '</span>' +
      '</span></a>';
  }

  function render(entry) {
    var el = document.createElement('div');
    if (entry.who === 'me') {
      el.className = 'msg msg--me';
      el.textContent = entry.text;
    } else if (entry.who === 'hits') {
      el.className = 'chat-hits';
      el.innerHTML = entry.hits.map(hitHTML).join('');
    } else if (entry.who === 'chips') {
      el.className = 'chat-chips';
      el.innerHTML = entry.chips.map(function (c) {
        return '<button class="chat-chip" type="button">' + esc(c) + '</button>';
      }).join('');
      el.addEventListener('click', function (e) {
        var b = e.target.closest('.chat-chip');
        if (b) send(b.textContent);
      });
    } else {
      el.className = 'msg msg--bot';
      el.innerHTML = entry.text;
    }
    log.appendChild(el);
    scroll();
  }

  function push(entry, quiet) {
    history.push(entry);
    if (history.length > 60) history = history.slice(-60);
    render(entry);
    if (!quiet) save();
  }

  function say(res) {
    if (res.text) push({ who: 'bot', text: res.text });
    if (res.hits && res.hits.length) {
      push({ who: 'hits', hits: res.hits.slice(0, 4).map(slim) });
      if (res.hits.length > 4) {
        push({ who: 'bot', text: 'That is 4 of ' + res.hits.length + '. <a href="products.html">See the full range</a>.' });
      }
    }
    if (res.chips) push({ who: 'chips', chips: res.chips });
  }

  /* what gets persisted to sessionStorage for a result row. The pack image is
     resolved from the id now, so the old shot filename is no longer carried. */
  function slim(p) {
    return { id: p.id, name: p.name, grade: p.grade, variant: p.variant,
             industry: p.industry, base: p.base, type: p.type };
  }

  function thinking(fn) {
    var t = document.createElement('div');
    t.className = 'chat-typing';
    t.innerHTML = '<i></i><i></i><i></i>';
    log.appendChild(t); scroll();
    setTimeout(function () { t.remove(); fn(); }, 420 + Math.random() * 320);
  }

  function nextFinderStep() {
    var step = FINDER[state.step];
    while (step && step.when && !step.when(state.answers)) { state.step++; step = FINDER[state.step]; }
    if (!step) {
      state.flow = null;
      var r = finderResult(state.answers);
      state.answers = {}; state.step = 0;
      say(r);
      push({ who: 'chips', chips: ['Start over', 'Talk to a person'] });
      return;
    }
    say({ text: step.q, chips: step.opts.map(function (o) { return o[0]; }) });
  }

  function send(text) {
    text = String(text).trim();
    if (!text) return;
    push({ who: 'me', text: text });
    input.value = '';

    if (/^start over$/i.test(text)) {
      state = { flow: 'finder', step: 0, answers: {} };
      thinking(nextFinderStep);
      return;
    }

    if (state.flow === 'finder') {
      var step = FINDER[state.step];
      var pick = step && step.opts.filter(function (o) {
        return o[0].toLowerCase() === text.toLowerCase();
      })[0];
      if (pick) {
        state.answers[step.key] = pick[1];
        state.step++;
        thinking(nextFinderStep);
        return;
      }
      state.flow = null; state.step = 0; state.answers = {};   // free text bails out of the flow
    }

    thinking(function () {
      var res = reply(text);
      if (res.start === 'finder') {
        state = { flow: 'finder', step: 0, answers: {} };
        nextFinderStep();
      } else {
        say(res);
      }
      save();
    });
  }

  function open(on) {
    panel.classList.toggle('on', on);
    launcher.classList.toggle('hide', on);
    if (on) setTimeout(function () { input.focus(); scroll(); }, 340);
    save();
  }

  function build() {
    if (!document.body || document.getElementById('chat-panel')) return;

    launcher = document.createElement('button');
    launcher.id = 'chat-launch';
    launcher.type = 'button';
    launcher.innerHTML = '<span class="dot"></span><span>Ask PX98</span>';
    document.body.appendChild(launcher);

    panel = document.createElement('div');
    panel.id = 'chat-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'PX98 product assistant');
    panel.innerHTML =
      '<div class="chat-head">' +
        '<span class="chat-head-mark"><span class="px">PX</span><span class="n98">98</span></span>' +
        '<span class="chat-head-t"><b>Product assistant</b><span>Online</span></span>' +
        '<button class="chat-x" type="button" aria-label="Close assistant">&times;</button>' +
      '</div>' +
      '<div class="chat-log" id="chat-log" aria-live="polite"></div>' +
      '<form class="chat-form" autocomplete="off">' +
        '<label for="chat-input" style="position:absolute;left:-9999px">Message</label>' +
        '<input id="chat-input" type="text" placeholder="Grade, approval or vehicle…">' +
        '<button class="chat-send" type="submit" aria-label="Send">' +
          '<svg viewBox="0 0 16 9" aria-hidden="true"><path d="M0 4.5h13M9.5 1l3.5 3.5L9.5 8" stroke="currentColor" stroke-width="1.6" fill="none"/></svg>' +
        '</button>' +
      '</form>' +
      '<div class="chat-foot">Mockup assistant. Searches the catalogue on this device.</div>';
    document.body.appendChild(panel);

    log = panel.querySelector('#chat-log');
    input = panel.querySelector('#chat-input');

    launcher.addEventListener('click', function () { open(true); });
    panel.querySelector('.chat-x').addEventListener('click', function () { open(false); });
    panel.querySelector('.chat-form').addEventListener('submit', function (e) {
      e.preventDefault(); send(input.value);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('on')) open(false);
    });

    var saved = null;
    try { saved = JSON.parse(sessionStorage.getItem(KEY)); } catch (e) {}
    if (saved && saved.h && saved.h.length) {
      history = saved.h;
      state = saved.s || state;
      history.forEach(render);
      if (saved.open) open(true);
    } else {
      push({ who: 'bot', text: 'Hi, I am the PX98 product assistant. Tell me the viscosity grade, the approval from your manual, or the vehicle, and I will find the right fluid.' }, true);
      push({ who: 'chips', chips: ['Find my oil', '0W-20', 'Fluid for a BMW', 'Become a distributor'] });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();

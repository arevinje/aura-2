/* ═══════════════════════════════════════════════════════════════════════════
   AURA 2 · motorn bakom dashboarden
   Du behöver inte ändra något här – alla inställningar görs i "mitt_hem".
   ═══════════════════════════════════════════════════════════════════════════ */
const VER = "2.0.2";
if (!window.Aura || window.Aura.v !== VER) {
  const gammal = window.Aura;
  if (gammal && gammal.timer) clearInterval(gammal.timer);
  const A = window.Aura = {
    v: VER, kort: new Set(), opt: {}, kal: {}, todo: {}, todoSub: {}, vader: {}, vaderSub: {},
    sida: 'hem', rum: 'oversikt', spelare: '', mflik: 'bib', sok: null, bib: {}, kalla: {}, album: {}, spar: {}, ko: {},
    kaffeVal: null, las: null, drag: null, skalK: null, skalC: '', S: {}
  };
  const minne = (n, v) => { try { if (v === undefined) return localStorage.getItem('aura.' + n); localStorage.setItem('aura.' + n, v); } catch (e) {} return null; };
  A.sida = minne('sida') || 'hem'; A.rum = minne('rum') || 'oversikt'; A.spelare = minne('spelare') || ''; A.dammVal = +minne('damm') || 0; A.temaVal = minne('tema') || '';
  A.bussP = (() => { try { const x = JSON.parse(minne('buss') || 'null'); return x && x.t > Date.now() - 10 * 6e4 ? x : null; } catch (e) { return null; } })();
  try { A.kalla = JSON.parse(minne('kalla') || '{}') || {}; } catch (e) { A.kalla = {}; }

  if (!document.getElementById('aura-font')) {
    const l = document.createElement('link');
    l.id = 'aura-font'; l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@300..800&display=swap';
    document.head.appendChild(l);
  }

  // ───────────── Hjälpfunktioner ─────────────
  const S = (id) => id && A.hass && A.hass.states[id];
  const esc = A.esc = (t) => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const tal = (id) => { const s = S(id); const v = s ? parseFloat(s.state) : NaN; return isNaN(v) ? null : v; };
  const ik = (i, px = 20) => `<ha-icon icon="${esc(i)}" style="--mdc-icon-size:${px}px;width:${px}px;height:${px}px;display:inline-flex;flex:none"></ha-icon>`;
  const namn = (id) => { const s = S(id); return s ? (s.attributes.friendly_name || id) : id; };
  const lista = (x) => Array.isArray(x) ? x.filter(Boolean) : x ? [x] : [];
  const kr = (v, d = 2) => v == null || isNaN(v) ? '–' : Number(v).toLocaleString('sv-SE', { minimumFractionDigits: d, maximumFractionDigits: d });
  const grad = (v) => v == null ? '–' : (Math.round(v * 10) / 10).toLocaleString('sv-SE');
  const klamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const hh = (d) => String(d.getHours()).padStart(2, '0');
  const hm = (d) => d.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
  const sedan = (ms) => { const m = Math.round((Date.now() - ms) / 6e4); return m < 1 ? 'nyss' : m < 60 ? `${m} min sedan` : m < 1440 ? `${Math.round(m / 60)} tim sedan` : `${Math.round(m / 1440)} d sedan`; };
  const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const forsta = (t) => t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
  const ej = (s) => !s || ['unavailable', 'unknown'].includes(s.state);
  const tom = (t, i = 'mdi:information-outline') => `<div class="tom">${ik(i, 22)}<span>${t}</span></div>`;
  const kh = (ikon, titel, hoger = '') => `<div class="kh"><div class="kh-t"><span class="kh-ik">${ik(ikon, 17)}</span>${titel}</div>${hoger}</div>`;
  const PALETT = ['#E0A23B', '#E07A9B', '#5B8DEF', '#9B7BEA', '#3FB27F', '#E8834A', '#2CB5C9'];
  const CIRK = 2 * Math.PI * 46;
  A.fcss = (f) => /^\s*\d+\s*,\s*\d+\s*,\s*\d+\s*$/.test(String(f || '')) ? `rgb(${f})` : (f || '#E0A23B');
  A.vibb = (ms = 8) => { try { navigator.userActivation && navigator.userActivation.hasBeenActive && navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };
  // Öppnar en pop-up via #hash (t.ex. bubble-card med hash: '#dammsugare'), på samma sätt som HA:s egen navigering
  A.popup = (h) => {
    if (!h) return;
    const hash = h.startsWith('#') ? h : '#' + h;
    history.pushState(null, '', location.pathname + location.search + hash);
    window.dispatchEvent(new CustomEvent('location-changed', { detail: { replace: false } }));
  };
  A.tj = (dom, tj, data) => A.hass.callService(dom, tj, data).catch(e => A.meddela((e && e.message) || 'Något gick fel'));
  A.meddela = (text) => {
    const el = [...A.kort].find(k => k.isConnected);
    if (el) el.dispatchEvent(new CustomEvent('hass-notification', { detail: { message: text }, bubbles: true, composed: true }));
  };
  A.info = (el, id) => el.dispatchEvent(new CustomEvent('hass-more-info', { bubbles: true, composed: true, detail: { entityId: id } }));
  const omradeFor = (id) => {
    const reg = A.hass.entities || {}, dev = A.hass.devices || {}, e = reg[id];
    return e ? (e.area_id || (e.device_id && dev[e.device_id] && dev[e.device_id].area_id) || '') : '';
  };
  A.farg = (s) => {
    const a = (s && s.attributes) || {};
    let rgb = Array.isArray(a.rgb_color) ? a.rgb_color : null;
    if (!rgb && a.color_temp_kelvin) {
      const k = a.color_temp_kelvin / 100;
      rgb = [k <= 66 ? 255 : 329.7 * Math.pow(k - 60, -0.1332), k <= 66 ? 99.47 * Math.log(k) - 161.12 : 288.12 * Math.pow(k - 60, -0.0755),
        k >= 66 ? 255 : (k <= 19 ? 0 : 138.52 * Math.log(k - 10) - 305.04)];
    }
    if (!rgb) rgb = [255, 190, 110];
    return rgb.map(v => klamp(Math.round(v), 0, 255)).join(',');
  };
  A.ljus = (id) => {
    const s = S(id);
    if (!s) return { finns: false };
    const dom = id.split('.')[0], a = s.attributes;
    const dim = dom === 'light' && ((a.supported_color_modes || []).some(m => m !== 'onoff') || a.brightness != null);
    let on = s.state === 'on';
    let pct = on ? (a.brightness != null ? Math.max(1, Math.round(a.brightness / 2.55)) : 100) : 0;
    const o = A.opt[id];
    if (o) {
      if (Date.now() > o.till || (o.on === on && (o.pct == null || !on || Math.abs(o.pct - pct) <= 3))) delete A.opt[id];
      else { on = o.on; pct = !on ? 0 : o.pct != null ? o.pct : (pct || 100); }
    }
    return { finns: true, on, pct, dim, av: ej(s), c: A.farg(s), dom };
  };

  // ───────────── Inställningar ─────────────
  A.autoRum = () => {
    const h = A.hass, reg = h.entities || {}, omr = h.areas || {}, per = {};
    Object.keys(h.states).filter(id => id.startsWith('light.')).forEach(id => {
      const e = reg[id];
      if ((e && (e.hidden || e.entity_category)) || Array.isArray(h.states[id].attributes.entity_id)) return;
      const a = omradeFor(id) || '_';
      (per[a] = per[a] || []).push({ e: id });
    });
    return Object.keys(per).sort((x, y) => x === '_' ? 1 : y === '_' ? -1 : x.localeCompare(y)).map(a => {
      const sok = (dc) => a === '_' ? '' : Object.keys(h.states).find(id => id.startsWith('sensor.') && h.states[id].attributes.device_class === dc && omradeFor(id) === a) || '';
      return { namn: omr[a] ? omr[a].name : 'Övrigt', ikon: (omr[a] && omr[a].icon) || 'mdi:home-outline', temp: sok('temperature'), fukt: sok('humidity'), bild: (omr[a] && omr[a].picture) || '', lampor: per[a] };
    });
  };
  A.temaKlass = (t) => t === 'noir' ? 'mork noir' : t;
  // ── Servern (System Monitor): hittas automatiskt via integrationen, eller anges i _server ──
  A.serverHitta = (h, v) => {
    if (v._server === false || v._server === 'av') return null;
    const egna = v._server && typeof v._server === 'object' ? v._server : {}, reg = h.entities || {}, st = h.states;
    const N = { cpu: [/^processor_use/, /processor_use|processoranvandning|cpu_anvandning/], ram: [/^memory_use_percent/, /memory_use_percent|monitor_minnesanvandning/],
      disk: [/^disk_use_percent/, /disk_use_percent|diskanvandning/], temp: [/^processor_temperature/, /processor_temperature|processortemperatur/],
      boot: [/^last_boot/, /last_boot|senaste_uppstart|senaste_omstart|upptid/], swap: [/^swap_use_percent/, /swap_use_percent|virtuell_minnesanvandning/] };
    const sm = Object.keys(st).filter(id => id.startsWith('sensor.') && reg[id] && reg[id].platform === 'systemmonitor');
    const ut = {};
    for (const [n, [tk, re]] of Object.entries(N))
      ut[n] = egna[n] || sm.find(id => tk.test(reg[id].translation_key || '')) || sm.find(id => re.test(id)) || Object.keys(st).find(id => id.startsWith('sensor.system_monitor') && re.test(id)) || '';
    return Object.values(ut).some(Boolean) ? ut : null;
  };
  // '04:30', '4.30' eller 4 → minuter efter midnatt (YAML kan göra 04:30 till talet 270)
  const klockMin = (v, std) => { if (v == null || v === '') return std; if (typeof v === 'number') return v > 24 ? v : v * 60; const m = String(v).match(/(\d{1,2})(?:[:.](\d{2}))?/); return m ? +m[1] * 60 + +(m[2] || 0) : std; };
  // "vardagsrum.jpg" → /local/aura/bilder/vardagsrum.jpg. Hela sökvägar (/local/…, https://…) lämnas orörda
  A.bildUrl = (x) => !x ? '' : /^(\/|https?:|data:)/.test(String(x)) ? String(x) : '/local/aura/bilder/' + String(x).replace(/^\.?\//, '');
  const arBild = (x) => /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(String(x || '')) || /^(\/|https?:)/.test(String(x || ''));
  A.konf = (v) => {
    A._v = v;
    const h = A.hass;
    const lampa = (l) => typeof l === 'string' ? { e: l } : { e: l.entity || l.e, namn: l.namn, ikon: l.ikon, typ: l.typ };
    // Spabad: _spa: { prefix: fridkulla } eller _spa: fridkulla. Utan inställning hittas det via Watercare-väljaren (Gecko). _spa: false stänger av
    const spa = (() => { if (v._spa === false) return null;
      const e = v._spa && typeof v._spa === 'object' ? v._spa : v._spa ? { prefix: v._spa } : {}, wc = Object.keys(h.states).find(id => /^select\..*watercare/.test(id));
      const prefix = String(e.prefix || (wc ? wc.split('.')[1].replace(/_?watercare.*$/, '') : '')).replace(/^[a-z_]+\./, '').replace(/_$/, '');
      if (!prefix && !e.termostat) return null;
      return { namn: e.namn || 'Spabad', prefix, termostat: e.termostat || '', lampa: e.lampa || '', pump: e.pump || '', lage: e.lage || '', badar: e.badar || '', farg: e.farg || '#6E5642',
        forvarm: parseFloat(e.forvarm) || 2, efter: parseFloat(e.efter) || 3, takt: parseFloat(e.takt) || 2,
        badTid: e.bad_tid || 'input_datetime.spa_bad', badTemp: e.bad_temp || 'input_number.spa_bad_temp', badVecka: e.bad_varje_vecka || 'input_boolean.spa_bad_varje_vecka',
        minTemp: parseFloat(e.min_temp) || 35, minHjalp: e.min_hjalpare || 'input_number.spa_min_temp',
        lagen: lista(e.lagen).length ? lista(e.lagen).map(x => String(x).toLowerCase().replace('å', 'a')) : ['borta', 'standard'] }; })();
    let rum = lista(v._rum).map(r => ({ namn: r.namn || 'Rum', ikon: r.ikon || 'mdi:home-outline', temp: r.temp || '', fukt: r.fukt || '', bild: A.bildUrl(r.bild), lampor: lista(r.lampor).map(lampa).filter(l => l.e) }));
    if (!rum.length) rum = A.autoRum();
    const scenLista = lista(v._scener).length ? lista(v._scener) : Object.keys(h.states).filter(id => id.startsWith('scene.')).slice(0, 8);
    const scener = scenLista.map(s => typeof s === 'string' ? { e: s } : { e: s.entity || s.e, namn: s.namn, ikon: s.ikon, farg: s.farg })
      .map((s, i) => Object.assign(s, { farg: A.fcss(s.farg || PALETT[i % PALETT.length]) }));
    const effekter = lista(v._ljuseffekter).map((x, i) => ({ effekt: x.effekt, namn: x.namn || x.effekt, ikon: x.ikon || 'mdi:auto-fix', farg: A.fcss(x.farg || PALETT[(i + 2) % PALETT.length]) }));
    // Vem får se kamerorna: _kamera_anvandare för alla kameror, eller anvandare: per kamera. Tom lista = alla användare
    const anv = h.user || {}, anvNamn = String(anv.name || '').toLowerCase().trim();
    const far = (l) => { l = lista(l).map(x => String(x).toLowerCase().trim()).filter(Boolean); return !l.length || l.some(x => x === anvNamn || x === anvNamn.split(' ')[0] || x === anv.id || (x === 'admin' && anv.is_admin)); };
    const kamAlla = far(v._kamera_anvandare);
    let kameror = lista(v._kameror).map(k => typeof k === 'string' ? { e: k } : { e: k.entity, anv: k.anvandare }).filter(x => x.e).filter(x => x.anv ? far(x.anv) : kamAlla).map(x => x.e);
    if (!lista(v._kameror).length && kamAlla) {
      const reg = h.entities || {}, alla = Object.keys(h.states).filter(id => id.startsWith('camera.') && !/map|karta|birdseye/i.test(id));
      const frigate = alla.filter(id => reg[id] && reg[id].platform === 'frigate');
      kameror = frigate.length ? frigate : alla;
    }
    const t0 = String(v._tema || 'ljus').toLowerCase();
    // Temat kan bytas per enhet under Hushåll – valet sparas i den här enheten
    const tema = ['ljus', 'mork', 'noir'].includes(A.temaVal) ? A.temaVal : t0.startsWith('n') ? 'noir' : t0.startsWith('m') ? 'mork' : 'ljus';
    return {
      tema, namn: v._hem_namn || 'Hemma', plats: v._plats || '', accent: v._accent || '', bild: A.bildUrl(v._bakgrundsbild),
      rum, scener, effekter, effektVal: v._ljuseffekt || '', effektScript: v._ljuseffekt_script || '',
      slack: v._slack_allt || '', slackMin: +v._slack_minuter || 5,
      gn: v._godnatt === false ? null : { script: v._godnatt_script || 'script.aura_godnatt', timer: v._godnatt_timer || 'timer.aura_godnatt', min: parseFloat(v._godnatt_minuter) || parseFloat(v._kvall_minuter) || 5 },
      spelare: lista(v._mediaspelare),
      el: v._elpris || '', elPrefix: v._el_prefix || '',
      portar: (() => {
        const ut = [], lagg = (t, l) => lista(l).forEach(x => { const o = typeof x === 'string' ? { entity: x } : x || {}; if (o.entity) ut.push({ e: o.entity, typ: o.typ || t, namn: o.namn || '', farg: o.farg || '', randig: !!o.randig, lagen: o.lagen !== false }); });
        lagg('markis', v._markiser); lagg('gardin', v._gardiner); lagg('rullgardin', v._rullgardiner); lagg('garage', v._garage);
        if (!ut.length && v._portar_auto !== false) Object.keys(h.states).filter(id => id.startsWith('cover.')).forEach(id => {
          const a = h.states[id].attributes, dc = a.device_class || '', t = ((a.friendly_name || '') + ' ' + id).toLowerCase();
          // device_class först, annars namnet ("rullgardin" kollas före "gardin")
          const typ = dc === 'awning' ? 'markis' : dc === 'curtain' ? 'gardin' : dc === 'garage' || dc === 'gate' ? 'garage' : ['blind', 'shade', 'shutter'].includes(dc) ? 'rullgardin'
            : /markis|awning/.test(t) ? 'markis' : /rullgardin|roller|blind|persienn|jalusi|shade|shutter/.test(t) ? 'rullgardin' : /gardin|curtain|drape/.test(t) ? 'gardin' : /garage|grind|gate/.test(t) ? 'garage' : '';
          if (typ) ut.push({ e: id, typ, namn: '', farg: '', randig: false, lagen: true }); });
        return ut; })(),
      varme: (() => { const ut = []; lista(v._varme).forEach(x => { const o = typeof x === 'string' ? { entity: x } : x || {}; if (o.entity) ut.push({ e: o.entity, namn: o.namn || '', typ: o.typ || '' }); });
        if (!ut.length && v._varme_auto !== false) Object.keys(h.states).filter(id => id.startsWith('climate.') && !(spa && spa.prefix && id.startsWith('climate.' + spa.prefix)) && !/spa|hottub|hot_tub|bubbelpool|jacuzzi|pool|bil|car|e_tron|etron|tesla|volvo|audi|polestar|kia|hyundai|vw_|skoda|bmw/.test(id)).forEach(id => ut.push({ e: id, namn: '', typ: '' }));
        return ut; })(), varmeSank: parseFloat(v._varme_sank) || 2, varmeBorta: parseFloat(v._varme_borta_min) || 60,
      portVind: parseFloat(v._markis_vind) || 9, portSolTemp: parseFloat(v._solskydd_temp) || 24, portSolLage: v._solskydd_lage != null ? +v._solskydd_lage : 30,
      spa, elbil: (() => { const e = v._elbil && typeof v._elbil === 'object' ? v._elbil : v._elbil ? { prefix: v._elbil } : null; if (!e) return null;
        return { namn: e.namn || 'Elbilen', prefix: String(e.prefix || '').replace(/^[a-z_]+\./, '').replace(/_$/, ''), batteri: e.batteri || '', rackvidd: e.rackvidd || '', laddstatus: e.laddstatus || '', effekt: e.effekt || '',
          kabel: e.kabel || '', tid: e.tid_kvar || '', mal: e.mal || '', klimat: e.klimat || '', laddbox: e.laddbox || '', las: e.las || '', kap: parseFloat(e.kapacitet) || 86, laddkw: parseFloat(e.laddeffekt) || 11,
          farg: e.farg || '#59606A', bild: e.bild || 'etron' }; })(),
      sol: { effekt: v._sol_effekt || '', idag: v._sol_idag || '', salt: v._sol_salt || '', hus: v._husets_effekt || '', prognos: v._sol_prognos || '', max: parseFloat(v._sol_max_kw) || 0,
        battNiva: v._batteri_niva || '', battEffekt: v._batteri_effekt || '', battKap: parseFloat(v._batteri_kapacitet) || 0, battOmv: !!v._batteri_effekt_omvand },
      elEffekt: v._el_effekt || '', elIdagKwh: v._el_forbrukning_idag || '', elIdagKr: v._el_kostnad_idag || '',
      apparater: (lista(v._el_apparater).length ? lista(v._el_apparater) : [
        { namn: 'Diskmaskin', ikon: 'mdi:dishwasher', kwh: 1.1, timmar: 2 }, { namn: 'Tvättmaskin', ikon: 'mdi:washing-machine', kwh: 1, timmar: 2 },
        { namn: 'Torktumlare', ikon: 'mdi:tumble-dryer', kwh: 2.5, timmar: 2 }]).map(a => ({ namn: a.namn, ikon: a.ikon, kwh: parseFloat(a.kwh) || 1, timmar: parseFloat(a.timmar) || 1 })),
      oppenMin: parseFloat(v._forslag_oppen_minuter) || 10, larmSkarm: v._larm_skarm !== false,
      partyScript: v._party_script || '', partyLampor: lista(v._party_lampor),
      server: A.serverHitta(h, v),
      buss: v._buss || '', bussNamn: v._buss_namn || '', bussLinje: v._buss_linje != null ? String(v._buss_linje) : '',
      bussForv: parseFloat(v._buss_forvarning) || 10, bussFonster: parseFloat(v._buss_fonster) || 30, tts: v._tts || '', ttsHog: v._tts_hogtalare || '',
      morgonFran: klockMin(v._morgon_fran, 270), morgonTill: klockMin(v._morgon_till, 600), morgonLampor: lista(v._morgon_lampor), morgonKaffe: v._morgon_kaffe !== false,
      forslagAv: lista(v._forslag_av).map(x => String(x).toLowerCase()), kaffeTimmar: parseFloat(v._kaffe_timmar) || 2, battVarn: parseFloat(v._batteri_varning) || 15,
      kvallKl: parseFloat(v._kvall_kl) || 22, kvallMin: parseFloat(v._kvall_minuter) || 5, kvallDagar: String(v._kvall_dagar || 'vardag').toLowerCase(),
      elOmrade: v._elomrade || '', billig: +v._el_billig || 1, dyr: +v._el_dyr || 2,
      larm: v._larm || '', bortaFraga: v._larm_borta_slack !== false, bortaScript: v._larm_borta_script || 'script.aura_borta_slack', dorrar: lista(v._dorrar), fonster: lista(v._fonster), las: lista(v._las),
      rorelse: lista(v._rorelse), larmgivare: lista(v._larmgivare), vattenventil: v._vattenventil || '', givareSkarm: v._givare_skarm !== false, kameror, frigate: v._frigate === false ? '' : String(v._frigate || 'frigate'), handelser: v._handelser !== false,
      radar: v._radar === true, norrsken: v._norrsken !== false,
      smhi: v._smhi_prefix || '', varning: v._smhi_varning || '', varningAktiv: v._smhi_varning_aktiv || '', mane: v._mane || '',
      vader: v._vader || '', pollen: v._pollen_prefix || '', pollenPlats: v._pollen_plats || v._plats || '',
      inne: v._temp_inne || '', fuktInne: v._fukt_inne || '', attGora: v._att_gora || '', kalendrar: lista(v._kalendrar),
      // En eller flera robotdammsugare: entitet, eller { entity, namn, batteri }
      dammar: lista(v._dammsugare).map((x, i) => {
        const d = typeof x === 'string' ? { e: x } : { e: x.entity || x.e, namn: x.namn, batteri: x.batteri, popup: x.popup };
        if (i === 0) { d.namn = d.namn || v._dammsugare_namn || ''; d.batteri = d.batteri || v._dammsugare_batteri || ''; }
        return d;
      }).filter(d => d.e),
      kaffe: v._kaffe || '', kaffeModell: v._kaffe_modell || '',
      partySkarm: v._party_skarm || "", partyUrl: v._party_url || "",
      vaxter: lista(v._vaxter).map(x => typeof x === 'string' ? { sensor: x } : x).filter(x => x.sensor),
      rader: lista(v._musik_rader).length ? lista(v._musik_rader) : [
        { titel: 'Senast spelat', typ: 'playlist', sortering: 'last_played_desc' }, { titel: 'Favoritlistor', typ: 'playlist', favorit: true },
        { titel: 'Album', typ: 'album', sortering: 'last_played_desc' }, { titel: 'Artister', typ: 'artist', favorit: true }, { titel: 'Radio', typ: 'radio' }]
    };
  };
  A.allaLampor = (k) => [...new Set(k.rum.flatMap(r => r.lampor.map(l => l.e)))].filter(id => S(id));
  A.lampInfo = (k, id) => { for (const r of k.rum) for (const l of r.lampor) if (l.e === id) return l; return { e: id }; };
  A.harMA = () => Object.values(A.hass.entities || {}).some(e => e.platform === 'music_assistant');
  // Är just den här spelaren en Music Assistant-spelare? (Apple TV, Chromecast m.fl. styrs i stället med fjärrkontrollen)
  A.arMA = (id) => { const r = (A.hass.entities || {})[id]; return r && r.platform ? r.platform === 'music_assistant' : A.harMA(); };
  A.arTV = (id) => { const r = (A.hass.entities || {})[id], s = S(id); return !!((r && ['apple_tv', 'androidtv', 'androidtv_remote', 'webostv', 'samsungtv', 'cast'].includes(r.platform) && !A.arMA(id)) || (s && s.attributes.device_class === 'tv')); };
  // Fjärrkontrollen (remote.*) som hör till samma enhet som mediaspelaren
  A.fjarr = (id) => {
    const r = A.hass.entities || {}, d = r[id] && r[id].device_id, namn = 'remote.' + id.split('.')[1];
    return (d && Object.keys(r).find(x => x.startsWith('remote.') && r[x].device_id === d && S(x))) || (S(namn) ? namn : '');
  };

  A.SIDOR = [
    ['hem', 'Hem', 'mdi:home-variant-outline', 'Översikt'],
    ['ljus', 'Ljus', 'mdi:lightbulb-group-outline', 'Belysning'],
    ['portar', 'Gardiner', 'mdi:curtains', 'Gardiner & portar'],
    ['varme', 'Värme', 'mdi:thermostat', 'Värme & klimat'],
    ['media', 'Media', 'mdi:music-note-outline', 'Musik & media'],
    ['energi', 'Energi', 'mdi:lightning-bolt-outline', 'Energi'],
    ['sakerhet', 'Säkerhet', 'mdi:shield-home-outline', 'Säkerhet'],
    ['vader', 'Väder', 'mdi:weather-partly-cloudy', 'Väder'],
    ['hushall', 'Hushåll', 'mdi:silverware-fork-knife', 'Hushållet']
  ];
  A.sidor = (k) => A.SIDOR.filter(([id]) => (id !== 'portar' || k.portar.length) && (id !== 'varme' || k.varme.length) &&
    (id !== 'energi' || k.el || A.harSolBatt(k) || k.elbil) && (id !== 'sakerhet' || k.larm || k.kameror.length || k.dorrar.length) && (id !== 'vader' || k.vader))
    // Bara garage → sidan heter Garage
    .map(x => x[0] === 'portar' && k.portar.every(p => p.typ === 'garage') ? ['portar', 'Garage', 'mdi:garage-variant', 'Garage'] : x);

  // ═════════════ Produktbilder (ritade, tänds och rör sig) ═════════════
  const DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
    <linearGradient id="a-metall" x1="0" x2="1"><stop offset="0" stop-color="#8E8A84"/><stop offset=".45" stop-color="#E9E6E1"/><stop offset=".7" stop-color="#B9B4AC"/><stop offset="1" stop-color="#7C7872"/></linearGradient>
    <linearGradient id="a-guld" x1="0" x2="1"><stop offset="0" stop-color="#8C6A35"/><stop offset=".5" stop-color="#E4C48A"/><stop offset="1" stop-color="#8C6A35"/></linearGradient>
    <radialGradient id="a-glas" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".55" stop-color="#E9EEF3" stop-opacity=".55"/><stop offset="1" stop-color="#C5CCD4" stop-opacity=".7"/></radialGradient>
    <radialGradient id="a-opal" cx=".36" cy=".3" r=".78"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".6" stop-color="#F2F1EE"/><stop offset="1" stop-color="#D3D0C9"/></radialGradient>
    <radialGradient id="a-amber" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#FBE7BC" stop-opacity=".95"/><stop offset=".6" stop-color="#E2B66C" stop-opacity=".75"/><stop offset="1" stop-color="#B07D3A" stop-opacity=".85"/></radialGradient>
    <linearGradient id="a-skarm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F7F4EE"/><stop offset="1" stop-color="#D9D3C9"/></linearGradient>
    <linearGradient id="a-mork" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3A3D44"/><stop offset="1" stop-color="#121317"/></linearGradient>
    <radialGradient id="a-robot" cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="#4A4E57"/><stop offset=".6" stop-color="#22252B"/><stop offset="1" stop-color="#0E0F12"/></radialGradient>
    <radialGradient id="a-sol" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#FFE9A3"/><stop offset=".6" stop-color="#FFC53D"/><stop offset="1" stop-color="#F59E0B"/></radialGradient>
    <linearGradient id="a-mane" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE7A0"/><stop offset=".6" stop-color="#F7C948"/><stop offset="1" stop-color="#D99A1E"/></linearGradient>
    <linearGradient id="a-moln" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#D5DCE6"/></linearGradient>
    <linearGradient id="a-moln2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C9D1DC"/><stop offset="1" stop-color="#8E99A8"/></linearGradient>
    <linearGradient id="a-blad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5FBF72"/><stop offset="1" stop-color="#2E7D4A"/></linearGradient>
    <linearGradient id="a-kruka" x1="0" x2="1"><stop offset="0" stop-color="#C9B8A3"/><stop offset=".5" stop-color="#EFE5D8"/><stop offset="1" stop-color="#BBA894"/></linearGradient>
    <linearGradient id="a-gran" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3F8F5A"/><stop offset=".55" stop-color="#23663D"/><stop offset="1" stop-color="#164A2B"/></linearGradient>
    <filter id="a-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9"/></filter>
    <filter id="a-skugga" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="#000" flood-opacity=".22"/></filter>
  </defs></svg>`;
  A.lamptyp = (l, s) => {
    if (l.typ) return l.typ;
    const t = ((l.ikon || '') + ' ' + (l.namn || '') + ' ' + (s ? s.entity_id + ' ' + (s.attributes.friendly_name || '') : '')).toLowerCase();
    if (/julgran|gran\b|christmas|xmas|pine-tree/.test(t)) return 'gran';
    if (/led|strip|list/.test(t)) return 'led';
    if (/(^|\s)switch\./.test(t) || /socket|uttag|power-plug/.test(t)) return /mån|moon|manen/.test(t) ? 'mane' : /fönster|fonster|window/.test(t) ? 'stake' : 'uttag';
    if (/mån|moon|manen/.test(t)) return 'mane';
    if (/floor|golv/.test(t)) return 'golv';
    if (/pendel|pendant|ph-|ph5/.test(t)) return 'pendel';
    if (/plafond|flush|ceiling-light-multiple/.test(t)) return 'plafond';
    if (/vägg|vagg|wall|sconce/.test(t)) return 'vagg';
    if (/spot/.test(t)) return 'spot';
    if (/desk|skrivbord|arbets|läslampa|laslampa/.test(t)) return 'skrivbord';
    if (/globe|klot|glob|opal/.test(t)) return 'klot';
    if (/chandelier|krona|spider/.test(t)) return 'krona';
    if (/ceiling|taklampa|kök|kok|köks|dine/.test(t)) return 'tak';
    if (/lamps|fönster|fonster|window|slinga|string/.test(t)) return 'stake';
    if (/lamp-outline|table|säng|sang|sofa|soff/.test(t)) return 'bord';
    return 'glod';
  };
  A.produkt = (typ, on, c = '255,190,110', extra = {}) => {
    const glod = (cx, cy, r, op = .6) => on ? `<circle class="r-glod" cx="${cx}" cy="${cy}" r="${r}" fill="rgb(${c})" opacity="${op}" filter="url(#a-blur)"/>` : '';
    const ljusF = on ? `rgb(${c})` : '#E8E4DD';
    let g = '';
    // Egen bild: typ: /local/lampor/min_lampa.png (helst PNG med genomskinlig bakgrund)
    if (arBild(typ)) { typ = A.bildUrl(typ); return `<svg class="produkt" viewBox="0 0 120 120" aria-hidden="true">${glod(60, 56, 46, .55)}
      <image href="${esc(typ)}" x="4" y="4" width="112" height="112" preserveAspectRatio="xMidYMid meet" style="${on ? '' : 'filter:saturate(.55) brightness(.94)'}"/></svg>`; }
    if (typ === 'klot') g = `<line x1="60" y1="0" x2="60" y2="24" stroke="#BDB7AE" stroke-width="1.4"/><rect x="58.4" y="22" width="3.2" height="17" rx="1.2" fill="url(#a-metall)"/>
      ${on ? `<circle class="r-glod" cx="60" cy="76" r="48" fill="rgb(${c})" opacity=".42" filter="url(#a-blur)"/>` : ''}
      <circle cx="60" cy="76" r="34" fill="url(#a-opal)" filter="url(#a-skugga)"/>
      ${on ? `<circle cx="60" cy="76" r="34" fill="rgb(${c})" opacity=".3"/><circle cx="60" cy="80" r="19" fill="#FFF9EC" opacity=".6" filter="url(#a-blur)"/>` : '<ellipse cx="49" cy="62" rx="9" ry="6" fill="#fff" opacity=".7"/>'}
      <path d="M46 47c3-6 8-8.5 14-8.5s11 2.5 14 8.5c-4-2.4-9-3.4-14-3.4s-10 1-14 3.4z" fill="url(#a-metall)"/>`;
    else if (typ === 'krona') {
      const lampa = (x0, y0, x, y, r) => `<line x1="${x0}" y1="${y0}" x2="${x}" y2="${y}" stroke="url(#a-guld)" stroke-width="3" stroke-linecap="round"/>
        ${on ? `<circle class="r-glod" cx="${x + (x > 60 ? r * .6 : -r * .6)}" cy="${y - 1}" r="${r * 1.9}" fill="rgb(${c})" opacity=".5" filter="url(#a-blur)"/>` : ''}
        <rect x="${x - 3}" y="${y - 3}" width="6" height="6" rx="1.5" fill="url(#a-guld)"/>
        <circle cx="${x + (x > 60 ? r * .8 : -r * .8)}" cy="${y - 1}" r="${r}" fill="${on ? `rgb(${c})` : 'url(#a-amber)'}" opacity="${on ? .92 : 1}"/>
        <path d="M${x + (x > 60 ? r * .8 : -r * .8) - 3} ${y} q1.5 -4 3 0 t3 0" fill="none" stroke="${on ? '#FFF6D8' : '#8A6430'}" stroke-width="1.1"/>`;
      g = `<path d="M60 0c9 5-9 11 0 18" fill="none" stroke="#55514B" stroke-width="1.4"/><rect x="56.5" y="17" width="7" height="6" rx="2" fill="url(#a-guld)"/>
        <rect x="58.3" y="22" width="3.4" height="86" rx="1.4" fill="url(#a-guld)"/><circle cx="60" cy="109" r="2.6" fill="url(#a-guld)"/>
        ${lampa(60, 62, 80, 56, 7.5)}${lampa(60, 66, 40, 60, 7.5)}
        ${lampa(60, 40, 88, 30, 10.5)}${lampa(60, 46, 32, 36, 10.5)}${lampa(60, 80, 90, 72, 10.5)}${lampa(60, 84, 30, 76, 10.5)}`;
    }
    else if (typ === 'glod') g = `${glod(60, 48, 36, .7)}
      <path d="M60 12c-19 0-33 14-33 32 0 12 6 19 12 25 4 4 6 9 6 14v3h30v-3c0-5 2-10 6-14 6-6 12-13 12-25 0-18-14-32-33-32z" fill="url(#a-glas)" stroke="rgba(0,0,0,.08)"/>
      ${on ? `<path d="M60 12c-19 0-33 14-33 32 0 12 6 19 12 25 4 4 6 9 6 14v3h30v-3c0-5 2-10 6-14 6-6 12-13 12-25 0-18-14-32-33-32z" fill="rgb(${c})" opacity=".35"/>` : ''}
      <path d="M51 70l4-16 5 9 5-9 4 16" fill="none" stroke="${on ? '#FFF3C8' : '#A7A097'}" stroke-width="2" stroke-linejoin="round" ${on ? 'filter="url(#a-blur)" opacity=".9"' : ''}/>
      <path d="M51 70l4-16 5 9 5-9 4 16" fill="none" stroke="${on ? '#FFF8E1' : '#A7A097'}" stroke-width="1.6" stroke-linejoin="round"/>
      <rect x="44" y="86" width="32" height="6" rx="2" fill="url(#a-metall)"/><rect x="45" y="93" width="30" height="5" rx="2" fill="url(#a-metall)"/>
      <rect x="46" y="99" width="28" height="5" rx="2" fill="url(#a-metall)"/><path d="M52 105h16l-4 7h-8z" fill="#3C3A37"/>`;
    else if (typ === 'golv') g = `${glod(60, 44, 34, .55)}
      <path d="M38 18h44l12 34H26z" fill="${on ? '#FBF3E3' : 'url(#a-skarm)'}" filter="url(#a-skugga)"/>
      ${on ? `<path d="M30 52h60l14 40H16z" fill="rgb(${c})" opacity=".18"/>` : ''}
      <rect x="58" y="52" width="4" height="56" fill="url(#a-guld)"/><ellipse cx="60" cy="110" rx="20" ry="4" fill="url(#a-guld)"/>`;
    else if (typ === 'tak') g = `<line x1="60" y1="0" x2="60" y2="34" stroke="#55514B" stroke-width="2"/>
      ${on ? `<path d="M34 58h52l20 54H14z" fill="rgb(${c})" opacity=".2"/>` : ''}${glod(60, 66, 26, .75)}
      <path d="M30 60c0-17 13-28 30-28s30 11 30 28z" fill="url(#a-guld)" filter="url(#a-skugga)"/>
      <ellipse cx="60" cy="60" rx="30" ry="5" fill="${on ? `rgb(${c})` : '#CFC7BA'}"/>`;
    else if (typ === 'bord') g = `${glod(60, 42, 30, .55)}
      <path d="M36 22h48l9 30H27z" fill="${on ? '#FFF6E6' : 'url(#a-skarm)'}" filter="url(#a-skugga)"/>
      ${on ? `<ellipse cx="60" cy="52" rx="33" ry="4" fill="rgb(${c})" opacity=".7"/>` : ''}
      <path d="M50 54h20c3 10 9 18 9 30 0 13-8 22-19 22s-19-9-19-22c0-12 6-20 9-30z" fill="url(#a-mork)"/>`;
    else if (typ === 'stake') g = `${on ? `<ellipse cx="60" cy="40" rx="50" ry="26" fill="rgb(${c})" opacity=".45" filter="url(#a-blur)"/>` : ''}
      <path d="M12 96 Q60 6 108 96" fill="none" stroke="url(#a-guld)" stroke-width="7"/><rect x="8" y="94" width="104" height="10" rx="3" fill="url(#a-guld)"/>
      ${[[24, 66], [37, 44], [49, 33], [60, 30], [71, 33], [83, 44], [96, 66]].map(([x, y]) => `<rect x="${x - 2.5}" y="${y - 12}" width="5" height="12" rx="1.5" fill="#F4EFE6"/>
        <ellipse cx="${x}" cy="${y - 16}" rx="3.2" ry="5" fill="${ljusF}" ${on ? 'class="r-flamma"' : ''}/>`).join('')}`;
    else if (typ === 'led') { const P = 'M12 88C38 30 66 118 108 42';
      g = `${on ? `<path d="${P}" fill="none" stroke="rgb(${c})" stroke-width="26" stroke-linecap="round" opacity=".45" filter="url(#a-blur)"/>` : ''}
      <rect x="2" y="82" width="16" height="12" rx="3" fill="url(#a-mork)"/><circle cx="14" cy="88" r="1.6" fill="${on ? '#4ADE80' : '#555'}"/>
      <path d="${P}" fill="none" stroke="#F4F1EB" stroke-width="11" stroke-linecap="round" filter="url(#a-skugga)"/>
      <path d="${P}" fill="none" stroke="${on ? `rgb(${c})` : '#DAD4CA'}" stroke-width="5" stroke-linecap="round" stroke-dasharray="3.5 5.5"/>
      ${on ? `<path d="${P}" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-dasharray="1.5 7.5" opacity=".85"/>` : ''}`; }
    else if (typ === 'pendel') g = `<line x1="60" y1="0" x2="60" y2="26" stroke="#55514B" stroke-width="1.6"/>
      ${on ? `<path d="M30 84h60l26 34H4z" fill="rgb(${c})" opacity=".2"/>` : ''}${glod(60, 74, 30, .7)}
      <path d="M48 34c4-6 20-6 24 0l8 10H40z" fill="#FBF9F5" filter="url(#a-skugga)"/>
      <path d="M30 58c10-14 50-14 60 0l12 12H18z" fill="#FBF9F5" filter="url(#a-skugga)"/>
      <path d="M44 76c6-6 26-6 32 0l5 7H39z" fill="#F1ECE4"/>
      ${on ? `<path d="M22 70h76l-4 3H26z" fill="rgb(${c})" opacity=".9"/><path d="M42 44h36l-3 2H45z" fill="rgb(${c})" opacity=".8"/><ellipse cx="60" cy="84" rx="18" ry="2.6" fill="rgb(${c})"/>`
        : '<path d="M22 70h76l-4 3H26z" fill="#D9D2C6"/>'}`;
    else if (typ === 'plafond') g = `<rect x="14" y="10" width="92" height="3" rx="1.5" fill="#D6CFC4"/>
      ${on ? `<path d="M24 40h72l20 72H4z" fill="rgb(${c})" opacity=".16"/>` : ''}${glod(60, 30, 36, .65)}
      <path d="M20 16h80c0 16-18 28-40 28S20 32 20 16z" fill="url(#a-opal)" filter="url(#a-skugga)"/>
      ${on ? `<path d="M20 16h80c0 16-18 28-40 28S20 32 20 16z" fill="rgb(${c})" opacity=".32"/><ellipse cx="60" cy="28" rx="22" ry="7" fill="#FFF9EC" opacity=".7" filter="url(#a-blur)"/>`
        : '<ellipse cx="44" cy="24" rx="12" ry="4" fill="#fff" opacity=".7"/>'}
      <rect x="20" y="13" width="80" height="5" rx="2" fill="url(#a-metall)"/>`;
    else if (typ === 'vagg') g = `<rect x="12" y="44" width="12" height="44" rx="5" fill="url(#a-metall)" filter="url(#a-skugga)"/>
      <path d="M24 70c20 0 34-6 38-20" fill="none" stroke="url(#a-guld)" stroke-width="4" stroke-linecap="round"/>
      ${on ? `<path d="M48 22h36l14-22H34z" fill="rgb(${c})" opacity=".2"/><path d="M50 52h32l10 22H40z" fill="rgb(${c})" opacity=".14"/>` : ''}${glod(66, 36, 30, .6)}
      <path d="M46 52h40l-6-30H52z" fill="${on ? '#FFF6E6' : 'url(#a-skarm)'}" filter="url(#a-skugga)"/>
      <ellipse cx="66" cy="22" rx="14" ry="2.6" fill="${on ? `rgb(${c})` : '#CFC7BA'}"/>`;
    else if (typ === 'spot') g = `<rect x="12" y="10" width="96" height="8" rx="4" fill="url(#a-mork)" filter="url(#a-skugga)"/>
      ${[[28, 18], [60, 0], [92, -18]].map(([x, v]) => `<g transform="rotate(${v} ${x} 22)">${on ? `<path d="M${x - 8} 52L${x - 24} 116H${x + 24}L${x + 8} 52z" fill="rgb(${c})" opacity=".16"/>` : ''}
        <rect x="${x - 1.6}" y="18" width="3.2" height="10" fill="#45423E"/><rect x="${x - 10}" y="28" width="20" height="26" rx="7" fill="url(#a-mork)"/>
        ${on ? `<circle class="r-glod" cx="${x}" cy="56" r="14" fill="rgb(${c})" opacity=".6" filter="url(#a-blur)"/>` : ''}<ellipse cx="${x}" cy="54" rx="8" ry="2.8" fill="${on ? `rgb(${c})` : '#2B2B2F'}"/></g>`).join('')}`;
    else if (typ === 'skrivbord') g = `<ellipse cx="32" cy="108" rx="22" ry="5" fill="url(#a-mork)"/>
      ${on ? `<path d="M72 60L56 114H118L100 60z" fill="rgb(${c})" opacity=".18"/>` : ''}
      <path d="M32 106L46 62L80 36" fill="none" stroke="url(#a-metall)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="46" cy="62" r="4.5" fill="url(#a-mork)"/><circle cx="80" cy="36" r="4" fill="url(#a-mork)"/>
      ${glod(86, 60, 24, .65)}<path d="M76 30l16 4 12 24H70z" fill="url(#a-mork)" filter="url(#a-skugga)"/>
      <ellipse cx="87" cy="58" rx="17" ry="3.2" fill="${on ? `rgb(${c})` : '#2B2B2F'}"/>`;
    else if (typ === 'gran') { const ljus = [[56, 30], [66, 38], [50, 50], [63, 54], [74, 62], [44, 66], [57, 72], [70, 80], [84, 88], [36, 90], [50, 92], [66, 95]];
      g = `${on ? `<ellipse cx="60" cy="64" rx="48" ry="46" fill="rgb(${c})" opacity=".3" filter="url(#a-blur)"/>` : ''}
      <rect x="49" y="98" width="22" height="16" rx="3" fill="url(#a-kruka)"/>
      <path d="M60 12L80 44H72L90 70H81L102 98H18L39 70H30L48 44H40z" fill="url(#a-gran)" filter="url(#a-skugga)"/>
      <path d="M46 42Q60 50 74 40M38 66Q60 78 84 62M28 92Q60 104 94 86" fill="none" stroke="url(#a-guld)" stroke-width="1.6" opacity=".85"/>
      ${ljus.map(([x, y], i) => `${on ? `<circle class="r-gnista" style="animation-delay:${(i % 5) * .45}s" cx="${x}" cy="${y}" r="5.5" fill="rgb(${c})" opacity=".7" filter="url(#a-blur)"/>` : ''}
        <circle ${on ? `class="r-gnista" style="animation-delay:${(i % 5) * .45}s"` : ''} cx="${x}" cy="${y}" r="2.6" fill="${on ? (i % 3 === 1 ? '#FFF6D8' : `rgb(${c})`) : '#6E7F69'}"/>`).join('')}
      ${on ? '<circle class="r-glod" cx="60" cy="10" r="14" fill="#FFD66B" opacity=".7" filter="url(#a-blur)"/>' : ''}
      <path d="M60 1l2.9 6 6.6.9-4.8 4.6 1.2 6.5L60 15.9 54.1 19l1.2-6.5-4.8-4.6 6.6-.9z" fill="url(#a-guld)"/>`; }
    else if (typ === 'mane') g = `${glod(60, 56, 44, .5)}
      <circle cx="60" cy="56" r="40" fill="${on ? '#FFF4D6' : '#E4DED3'}" filter="url(#a-skugga)"/>
      <circle cx="46" cy="44" r="8" fill="rgba(0,0,0,.06)"/><circle cx="72" cy="66" r="11" fill="rgba(0,0,0,.05)"/><circle cx="70" cy="38" r="5" fill="rgba(0,0,0,.05)"/>
      ${on ? `<circle cx="60" cy="56" r="40" fill="rgb(${c})" opacity=".25"/>` : ''}<rect x="40" y="100" width="40" height="8" rx="4" fill="url(#a-mork)"/>`;
    else if (typ === 'uttag') g = `<rect x="22" y="22" width="76" height="76" rx="20" fill="#F7F5F1" filter="url(#a-skugga)"/>
      <circle cx="60" cy="60" r="24" fill="#EAE6DF"/><circle cx="51" cy="60" r="4" fill="#5A5650"/><circle cx="69" cy="60" r="4" fill="#5A5650"/>
      <circle cx="82" cy="34" r="4" fill="${on ? '#4ADE80' : '#C9C3BA'}" ${on ? 'class="r-led"' : ''}/>`;
    else if (typ === 'robot') g = `<ellipse cx="60" cy="104" rx="42" ry="6" fill="rgba(0,0,0,.18)" filter="url(#a-blur)"/>
      <g class="${on ? 'r-snurr' : ''}"><circle cx="60" cy="60" r="44" fill="url(#a-robot)"/>
      <circle cx="60" cy="60" r="36" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="1.5"/>
      <circle cx="60" cy="38" r="11" fill="#2E3138" stroke="rgba(255,255,255,.12)"/><circle cx="60" cy="38" r="5" fill="#15161A"/>
      <rect x="44" y="70" width="32" height="5" rx="2.5" fill="rgba(255,255,255,.1)"/></g>
      <circle cx="60" cy="86" r="3" fill="${on ? 'var(--acc)' : '#6B7280'}" ${on ? 'class="r-led"' : ''}/>`;
    else if (typ === 'hogtalare') g = `${on ? `<circle class="r-pulsring" cx="60" cy="62" r="40" fill="none" stroke="var(--acc)" stroke-width="2"/><circle class="r-pulsring r2" cx="60" cy="62" r="40" fill="none" stroke="var(--acc)" stroke-width="2"/>` : ''}
      <ellipse cx="60" cy="108" rx="26" ry="5" fill="rgba(0,0,0,.2)" filter="url(#a-blur)"/>
      <rect x="36" y="18" width="48" height="88" rx="22" fill="url(#a-mork)"/>
      <g fill="rgba(255,255,255,.13)">${Array.from({ length: 9 }, (_, r) => Array.from({ length: 5 }, (_, q) => `<circle cx="${46 + q * 7}" cy="${36 + r * 7}" r="1.4"/>`).join('')).join('')}</g>
      <ellipse cx="60" cy="22" rx="18" ry="4" fill="rgba(255,255,255,.12)"/><circle cx="60" cy="98" r="2" fill="${on ? 'var(--acc)' : '#555'}"/>`;
    else if (typ === 'kaffe') g = `<ellipse cx="60" cy="110" rx="40" ry="5" fill="rgba(0,0,0,.2)" filter="url(#a-blur)"/>
      <rect x="22" y="10" width="76" height="98" rx="12" fill="url(#a-mork)"/><rect x="30" y="18" width="60" height="22" rx="6" fill="#0B0C0F"/>
      <rect x="36" y="25" width="22" height="3" rx="1.5" fill="${on ? 'var(--acc)' : '#3A3D44'}"/><circle cx="78" cy="29" r="4" fill="url(#a-metall)"/>
      <rect x="48" y="44" width="24" height="10" rx="3" fill="url(#a-metall)"/>
      <path d="M48 76h24v14a8 8 0 0 1-8 8h-8a8 8 0 0 1-8-8z" fill="#F4F1EC"/><path d="M72 80h4a5 5 0 0 1 0 10h-4" fill="none" stroke="#F4F1EC" stroke-width="3"/>
      <rect x="30" y="100" width="60" height="4" rx="2" fill="url(#a-metall)"/>
      ${extra.brygger ? `<g class="r-anga" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".8"><path d="M54 72c-3-4 3-6 0-10"/><path d="M60 72c-3-4 3-6 0-10"/><path d="M66 72c-3-4 3-6 0-10"/></g>
        <line class="r-strale" x1="60" y1="54" x2="60" y2="76" stroke="#6B4423" stroke-width="2"/>` : ''}`;
    else if (typ === 'vaxt') g = `<ellipse cx="60" cy="110" rx="30" ry="5" fill="rgba(0,0,0,.18)" filter="url(#a-blur)"/>
      <g class="r-blad"><path d="M60 72C40 70 22 52 26 30c18 2 32 18 34 42z" fill="url(#a-blad)"/><path d="M60 72c20-2 38-20 34-42-18 2-32 18-34 42z" fill="url(#a-blad)"/>
      <path d="M60 74C56 50 60 24 72 10c8 20 2 46-12 64z" fill="url(#a-blad)" opacity=".9"/></g>
      <path d="M38 72h44l-6 36H44z" fill="url(#a-kruka)"/><rect x="36" y="68" width="48" height="8" rx="3" fill="#E4D9CB"/>`;
    return `<svg class="produkt" viewBox="0 0 120 120" aria-hidden="true">${g}</svg>`;
  };

  // ═════════════ Animerade vädersymboler ═════════════
  const VTXT = {
    'clear-night': ['Klart', 'mane'], 'cloudy': ['Mulet', 'moln'], 'fog': ['Dimma', 'dimma'], 'hail': ['Hagel', 'regn'],
    'lightning': ['Åska', 'aska'], 'lightning-rainy': ['Åska och regn', 'aska'], 'partlycloudy': ['Växlande molnighet', 'halv'],
    'pouring': ['Skyfall', 'regn'], 'rainy': ['Regn', 'regn'], 'snowy': ['Snö', 'sno'], 'snowy-rainy': ['Snöblandat regn', 'sno'],
    'sunny': ['Soligt', 'sol'], 'windy': ['Blåsigt', 'moln'], 'windy-variant': ['Blåsigt', 'moln'], 'exceptional': ['Ovanligt väder', 'moln']
  };
  A.vtext = (c) => (VTXT[c] || [c || ''])[0];
  A.vikon = (c, s = 48, natt = false) => {
    let typ = (VTXT[c] || [0, 'moln'])[1];
    if (natt && typ === 'sol') typ = 'mane';
    const moln = (y = 0, f = 'url(#a-moln)', kl = 'w-moln') => `<path class="${kl}" transform="translate(0 ${y})" d="M19 48h27a11 11 0 0 0 1-22 15 15 0 0 0-28.5 3.5A9.5 9.5 0 0 0 19 48z" fill="${f}" filter="url(#a-skugga)"/>`;
    const sol = (cx = 32, cy = 32, r = 12) => `<g transform="translate(${cx - 32} ${cy - 32})"><circle cx="32" cy="32" r="${r + 9}" fill="#FFC53D" opacity=".35" filter="url(#a-blur)"/>
      <g class="w-strale" stroke="#FFC53D" stroke-width="2.6" stroke-linecap="round">${[0, 45, 90, 135, 180, 225, 270, 315].map(v => `<line x1="32" y1="${32 - r - 5}" x2="32" y2="${32 - r - 9}" transform="rotate(${v} 32 32)"/>`).join('')}</g>
      <circle class="w-solk" cx="32" cy="32" r="${r}" fill="url(#a-sol)"/></g>`;
    const mane = (x = 0, y = 0, sk = 1) => `<g transform="translate(${x} ${y}) scale(${sk})"><circle cx="34" cy="30" r="20" fill="#F7C948" opacity=".3" filter="url(#a-blur)"/>
      <path d="M40 10a21 21 0 1 0 14 34A18 18 0 0 1 40 10z" fill="url(#a-mane)"/><circle class="w-stj" cx="14" cy="14" r="1.6" fill="#FFE7A0"/><circle class="w-stj" style="animation-delay:1.2s" cx="54" cy="12" r="1.2" fill="#FFE7A0"/></g>`;
    const dr = () => [0, 1, 2].map(i => `<line class="w-dr" style="animation-delay:${i * .35}s" x1="${24 + i * 9}" y1="50" x2="${22 + i * 9}" y2="56" stroke="#5BA8F0" stroke-width="3" stroke-linecap="round"/>`).join('');
    let g;
    if (typ === 'sol') g = sol(32, 32, 13);
    else if (typ === 'mane') g = mane();
    else if (typ === 'halv') g = (natt ? mane(16, -6, .8) : sol(42, 22, 10)) + moln(4);
    else if (typ === 'regn') g = moln(-6) + dr();
    else if (typ === 'sno') g = moln(-6) + [0, 1, 2].map(i => `<circle class="w-fl" style="animation-delay:${i * .8}s" cx="${24 + i * 9}" cy="51" r="2.4" fill="#BFD8F5"/>`).join('');
    else if (typ === 'aska') g = moln(-6, 'url(#a-moln2)') + `<path class="w-blixt" d="M33 42l-7 11h6l-3 9 10-13h-6l3-7z" fill="#FFC53D"/>`;
    else if (typ === 'dimma') g = `<g stroke="#B7C1CE" stroke-width="3.5" stroke-linecap="round"><path class="w-dim" d="M12 24h40"/><path class="w-dim" style="animation-delay:-1s" d="M8 34h44"/><path class="w-dim" style="animation-delay:-2s" d="M14 44h36"/></g>`;
    else g = moln(-8, 'url(#a-moln2)', 'w-moln2') + moln(2);
    return `<svg class="wi" width="${s}" height="${s}" viewBox="0 0 64 64" aria-hidden="true">${g}</svg>`;
  };

  // ═════════════ Stil ═════════════
  A.css = (k) => {
    const sidor = A.sidor(k).map(s => s[0]);
    const visa = sidor.map(s => `.aura[data-sida="${s}"] .sida[data-p="${s}"]`).join(',');
    const aktiv = sidor.map(s => `.aura[data-sida="${s}"] .navk[data-v="${s}"]`).join(',');
    const acc = k.accent ? `--acc:${k.accent};` : '';
    const sidIn = sidor.map(s => `.aura[data-sida="${s}"] .sida[data-p="${s}"]`).join(',');
    return `
    ${sidIn} { animation:sidain .38s var(--ease, cubic-bezier(.22,1,.36,1)) both; }
    @keyframes sidain { from { opacity:0; transform:translateY(10px) scale(.995); } }
    @media (prefers-reduced-motion:reduce) { ${sidIn} { animation:none; } }
    :host { display:block; }
    .aura { pointer-events:auto; white-space:normal; --r:26px; --ease:cubic-bezier(.22,1,.36,1); --fjader:cubic-bezier(.34,1.56,.64,1); --gap:16px;
      font-family:'Manrope',ui-sans-serif,system-ui,-apple-system,sans-serif; color:var(--text); position:relative; text-align:left;
      -webkit-font-smoothing:antialiased; letter-spacing:-.01em; font-feature-settings:'tnum'; background:var(--bg); }
    .aura.ljus { --bg:#ECE6DD; --yta:#FBF9F5; --yta2:#F2EDE5; --yta3:#E7E0D5; --text:#1E1A15; --dim:rgba(30,26,21,.56); --svag:rgba(30,26,21,.34);
      --kant:rgba(60,45,25,.07); --acc:#B07D3A; --acc2:#D9B072; --acc-ink:#fff; --tog:#DDD5C9; --ok:#3E9A62; --varn:#C68A1A; --fel:#D0503F; --info:#3B7DD8;
      --skugga:0 1px 2px rgba(60,40,10,.05), 0 20px 44px -26px rgba(80,55,20,.35); --rad:rgba(60,45,25,.08); }
    .aura.mork { --bg:#080A15; --yta:#111427; --yta2:#181C34; --yta3:#222744; --text:#EEF0FF; --dim:rgba(238,240,255,.58); --svag:rgba(238,240,255,.34);
      --kant:rgba(255,255,255,.06); --acc:#7568FF; --acc2:#A69EFF; --acc-ink:#fff; --tog:rgba(255,255,255,.14); --ok:#4ADE80; --varn:#FBBF24; --fel:#FB7185; --info:#60A5FA;
      --skugga:inset 0 1px 0 rgba(255,255,255,.04), 0 24px 50px -28px rgba(0,0,0,.9); --rad:rgba(255,255,255,.06); }
    .aura.noir { --bg:#0A0908; --yta:#141210; --yta2:#1C1916; --yta3:#28241F; --text:#F5EFE6; --dim:rgba(245,239,230,.58); --svag:rgba(245,239,230,.34);
      --kant:rgba(255,236,210,.07); --acc:#D4AF7A; --acc2:#F0D9AE; --acc-ink:#1B150D; --tog:rgba(255,236,210,.14); --ok:#7CC9A0; --varn:#E8B85C; --fel:#E3806F; --info:#8DB4DE;
      --skugga:inset 0 1px 0 rgba(255,236,210,.05), 0 24px 50px -28px rgba(0,0,0,.95); --rad:rgba(255,236,210,.06); }
    .aura.aura.aura.aura { ${acc} }
    .aura *, .aura *::before, .aura *::after { box-sizing:border-box; }
    :where(.aura button) { font:inherit; color:inherit; background:none; border:0; padding:0; margin:0; cursor:pointer; -webkit-tap-highlight-color:transparent; text-align:inherit; }
    :where(.aura h1, .aura h2, .aura h3, .aura p) { margin:0; font-weight:inherit; }
    .bg { position:fixed; inset:0; z-index:0; pointer-events:none; overflow:hidden; background:var(--bg); }
    .mork .bg::before { content:''; position:absolute; width:70vmax; height:70vmax; left:-20vmax; top:-30vmax; border-radius:50%; filter:blur(90px);
      background:radial-gradient(circle, color-mix(in srgb, var(--acc) 45%, transparent), transparent 60%); opacity:.5; animation:drift 30s ease-in-out infinite alternate; }
    .mork .bg::after { content:''; position:absolute; width:60vmax; height:60vmax; right:-20vmax; bottom:-30vmax; border-radius:50%; filter:blur(90px);
      background:radial-gradient(circle, #1E6BFF, transparent 60%); opacity:.25; animation:drift 38s ease-in-out infinite alternate-reverse; }
    .ljus .bg::before { content:''; position:absolute; inset:-20%; background:radial-gradient(60% 50% at 15% 0%, #F7F2EA, transparent 60%), radial-gradient(50% 50% at 100% 100%, #E2D6C4, transparent 60%); }
    @keyframes drift { to { transform:translate(14vw, 10vh) scale(1.1); } }
    .noir .bg::before { opacity:.28; } .noir .bg::after { background:radial-gradient(circle, #6B4523, transparent 60%); opacity:.32; }
    .tom { display:flex; align-items:center; gap:10px; color:var(--svag); font-size:13.5px; padding:6px 0; font-weight:600; }
    .fel { color:var(--fel); font-size:13px; }
    .dim { color:var(--dim); font-size:13px; font-weight:600; }

    /* ── Ramverk: allt på en skärm på surfplattan ── */
    .nav { position:relative; z-index:20; display:flex; flex-direction:column; align-items:center; gap:4px; }
    .nav-logo { width:44px; height:44px; border-radius:15px; display:grid; place-items:center; background:var(--acc); color:var(--acc-ink);
      box-shadow:0 10px 24px -8px color-mix(in srgb, var(--acc) 70%, transparent); }
    .navk { position:relative; width:58px; height:58px; border-radius:18px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px;
      color:var(--svag); transition:all .35s var(--ease); }
    .navk span { font-size:9.5px; font-weight:800; letter-spacing:.02em; }
    .navk:hover { color:var(--text); }
    .navk:active { transform:scale(.9); }
    ${aktiv} { background:var(--yta); color:var(--acc); box-shadow:var(--skugga); }
    .gnk { display:none; }
    .topp-h .gnchip { display:none; } .gnchip.pa { background:linear-gradient(135deg, #3A4490, #232A5C); color:#E3E7FF; border-color:transparent; } .gnchip .chip-ik { background:none; color:#E3E7FF; } .gnchip b { font-variant-numeric:tabular-nums; }
    .main { position:relative; z-index:1; min-width:0; }
    .sida { display:none; }
    ${visa} { display:block; animation:in .5s var(--ease) both; }
    @keyframes in { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
    .lay > *, .kol > * { animation:upp .7s var(--ease) both; }
    .lay > :nth-child(2), .kol > :nth-child(2) { animation-delay:.06s; } .lay > :nth-child(3), .kol > :nth-child(3) { animation-delay:.12s; }
    .lay > :nth-child(4) { animation-delay:.18s; } .lay > :nth-child(5) { animation-delay:.24s; } .lay > :nth-child(6) { animation-delay:.3s; }
    .lay > .kol { animation:none; }
    @keyframes upp { from { opacity:0; transform:translateY(14px) scale(.985); } to { opacity:1; transform:none; } }

    @media (min-width:1000px) and (min-height:580px) {
      .aura { height:var(--h, 100dvh); overflow:hidden; display:grid; grid-template-columns:88px minmax(0, 1fr); }
      .nav { height:100%; padding:20px 0; justify-content:center; }
      .nav-logo { position:absolute; top:20px; }
      .gnk { position:absolute; bottom:18px; left:50%; transform:translateX(-50%); display:flex; flex-direction:column; align-items:center; gap:5px; width:70px; }
      .gnk-o { position:relative; width:46px; height:46px; border-radius:50%; display:grid; place-items:center; color:#E3E7FF; background:linear-gradient(135deg, #3A4490, #232A5C);
        box-shadow:0 8px 20px -6px rgba(58,68,144,.55); transition:transform .3s var(--ease), box-shadow .3s; }
      .gnk-o:active { transform:scale(.9); }
      .gnk-o > svg { position:absolute; inset:-5px; width:56px; height:56px; transform:rotate(-90deg); } .gnk-o circle { fill:none; stroke-width:5; }
      .gnk-b { stroke:color-mix(in srgb, #6B78D0 22%, transparent); } .gnk-c { stroke:#6B78D0; stroke-linecap:round; transition:stroke-dashoffset 1s linear; }
      .gnk-t { font-size:9.5px; font-weight:800; letter-spacing:.02em; color:var(--svag); white-space:nowrap; } .gnk-t b { font-size:11px; color:#6B78D0; font-variant-numeric:tabular-nums; }
      .nav:has(.gnk) { padding-bottom:96px; }
      .main { height:100%; display:flex; flex-direction:column; padding:16px 20px 18px 4px; gap:14px; min-height:0; }
      .sidor { flex:1; min-height:0; position:relative; }
      .sida { position:absolute; inset:0; }
      .lay { height:100%; }
      .lay > .kort, .kol > .kort { min-height:0; }
      .kol > .mmkort { flex:none; } .mmkort .kh { margin-bottom:10px; } .mmkort .mm-bild { width:60px; height:60px; } .kol > .klimat { flex:0 1 auto; min-height:0; display:flex; flex-direction:column; } .kol > .klimat .kl-graf { flex:0 1 74px; min-height:30px; }
      .kol > .forslag { display:flex; flex-direction:column; flex:1 0 auto; } .kol > .forslag .forslag-k { margin-top:auto; } .kol > .forslag .forslag-t { font-size:18.5px; }
      .klimat .matare { min-height:96px; }
      .rull-y, .aura .kort.rull-y { overflow-y:auto; overscroll-behavior:contain; scrollbar-width:none; }
      .rull-y::-webkit-scrollbar { display:none; }
    }
    @media (min-width:1000px) and (min-height:580px) and (max-height:840px) {
      .aura .nav:has(.gnk) { padding-bottom:78px; gap:2px; } .aura .nav:has(.gnk) .navk { height:52px; } .aura .gnk { bottom:12px; }
      .aura .klimat .matare { min-height:60px; } .aura .klimat .kh, .aura .forslag .kh { margin-bottom:8px; } .aura .klimat-rad { margin-top:6px; } .aura .klimat-rad > div { padding:6px; }
      .aura .forslag, .aura .mmkort { padding:14px 16px; } .aura .forslag-s { margin:2px 0 10px; display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:3; overflow:hidden; } .aura .mmkort .mm { gap:6px; } .aura .mmkort .mm-bild { width:52px; height:52px; }
    }
    @media (min-width:1000px) and (min-height:580px) and (max-height:720px) {
      .aura .kol > .klimat .kl-graf, .aura .kol > .klimat .klimat-rad { display:none; }
    }
    @media not all and (min-width:1000px) and (min-height:580px) {
      .aura { min-height:100dvh; }
      .nav { position:fixed; left:12px; right:12px; bottom:calc(12px + env(safe-area-inset-bottom, 0px)); height:66px; flex-direction:row; justify-content:space-around;
        padding:0 6px; border-radius:24px; background:color-mix(in srgb, var(--yta) 86%, transparent); border:1px solid var(--kant);
        backdrop-filter:blur(24px) saturate(160%); -webkit-backdrop-filter:blur(24px) saturate(160%); box-shadow:0 20px 50px -20px rgba(0,0,0,.4); }
      .nav-logo { display:none; }
      .navk { width:44px; height:48px; border-radius:15px; } .navk span { display:none; }
      .topp-h .gnchip { display:inline-flex; } .gnchip:not(.pa) { width:40px; padding:0; justify-content:center; background:linear-gradient(135deg, #3A4490, #232A5C); color:#E3E7FF; border-color:transparent; } .gnchip:not(.pa) .chip-ik { color:#E3E7FF; margin:0; }
      .main { padding:14px 12px calc(100px + env(safe-area-inset-bottom, 0px)); display:flex; flex-direction:column; gap:12px; }
      .aura { --gap:12px; }
    }

    /* ── Kort ── */
    .kort { position:relative; background:var(--yta); border-radius:var(--r); padding:18px; box-shadow:var(--skugga); border:1px solid var(--kant); overflow:hidden; }
    .kh { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:14px; }
    .kh-t { display:flex; align-items:center; gap:10px; font-size:11.5px; font-weight:800; letter-spacing:.09em; text-transform:uppercase; color:var(--dim); white-space:nowrap; min-width:0; overflow:hidden; text-overflow:ellipsis; }
    .kh-ik { width:30px; height:30px; flex:none; border-radius:10px; background:var(--yta2); display:grid; place-items:center; color:var(--text); }
    .pill { display:inline-flex; align-items:center; gap:6px; padding:5px 11px; border-radius:999px; font-size:12px; font-weight:800; background:var(--yta2); color:var(--dim); white-space:nowrap; }
    .pill.ok { background:color-mix(in srgb, var(--ok) 14%, transparent); color:var(--ok); } .pill.varn { background:color-mix(in srgb, var(--varn) 16%, transparent); color:var(--varn); }
    .pill.fel { background:color-mix(in srgb, var(--fel) 14%, transparent); color:var(--fel); } .pill.acc { background:color-mix(in srgb, var(--acc) 15%, transparent); color:var(--acc); }
    .knapp { display:inline-flex; align-items:center; justify-content:center; gap:8px; padding:10px 16px; border-radius:999px; font-weight:800; font-size:13.5px;
      background:var(--yta2); transition:transform .3s var(--fjader), background .3s; white-space:nowrap; }
    .knapp:active { transform:scale(.95); } .knapp.prim { background:var(--acc); color:var(--acc-ink); }
    .vxl { position:relative; flex:none; width:44px; height:26px; border-radius:999px; background:var(--tog); transition:background .35s var(--ease); }
    .vxl::after { content:''; position:absolute; top:3px; left:3px; width:20px; height:20px; border-radius:50%; background:#fff; box-shadow:0 2px 5px rgba(0,0,0,.2);
      transition:transform .5s var(--fjader); }
    .vxl.pa { background:var(--acc); } .vxl.pa::after { transform:translateX(18px); }
    .rund { width:44px; height:44px; flex:none; border-radius:50%; display:grid; place-items:center; background:var(--text); color:var(--yta); transition:transform .3s var(--fjader); }
    .rund.svag { background:var(--yta2); color:var(--text); } .rund.acc { background:var(--acc); color:var(--acc-ink); box-shadow:0 12px 26px -10px color-mix(in srgb, var(--acc) 80%, transparent); }
    .rund:active { transform:scale(.88); }
    .eq { display:inline-flex; gap:2px; align-items:flex-end; height:11px; }
    .eq i { width:2.5px; height:3px; border-radius:1px; background:var(--acc); animation:eq 1s ease-in-out infinite; }
    .eq i:nth-child(2) { animation-delay:.2s; } .eq i:nth-child(3) { animation-delay:.4s; }
    @keyframes eq { 0%,100% { height:3px; } 50% { height:11px; } }
    @keyframes snurr { to { transform:rotate(360deg); } }
    @keyframes puls { 0%,100% { transform:scale(1); } 50% { transform:scale(1.05); } }
    @keyframes blink { 50% { opacity:.25; } }
    .aura input[type=range] { -webkit-appearance:none; appearance:none; flex:1; min-width:0; height:6px; border-radius:99px; outline:none; margin:0; cursor:pointer;
      background:linear-gradient(90deg, var(--acc) var(--v, 0%), var(--yta3) var(--v, 0%)); touch-action:pan-x; }
    .aura input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:20px; height:20px; border-radius:50%; background:#fff; box-shadow:0 2px 8px rgba(0,0,0,.3); }
    .aura input[type=range]::-moz-range-thumb { width:20px; height:20px; border:0; border-radius:50%; background:#fff; }

    /* ── Toppen ── */
    .topp { display:flex; align-items:center; gap:16px; min-height:56px; flex:none; }
    .topp-v { min-width:0; flex:1; }
    .topp-ey { font-size:13px; color:var(--dim); font-weight:700; }
    .topp h1 { font-size:26px; font-weight:800; letter-spacing:-.035em; line-height:1.15; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .flikar { display:flex; gap:4px; padding:4px; border-radius:999px; background:var(--yta); box-shadow:var(--skugga); border:1px solid var(--kant); overflow-x:auto; scrollbar-width:none; flex:0 1 auto; min-width:0; }
    .flikar::-webkit-scrollbar { display:none; }
    .flik { padding:9px 16px; border-radius:999px; font-size:13px; font-weight:800; color:var(--dim); white-space:nowrap; transition:all .35s var(--ease); }
    .flik.pa { background:var(--acc); color:var(--acc-ink); box-shadow:0 6px 16px -6px color-mix(in srgb, var(--acc) 70%, transparent); }
    .topp-h { display:flex; align-items:center; gap:10px; flex:none; }
    .chip { display:inline-flex; align-items:center; gap:8px; padding:6px 14px 6px 6px; border-radius:999px; background:var(--yta); box-shadow:var(--skugga); border:1px solid var(--kant);
      font-size:13px; font-weight:800; white-space:nowrap; }
    .chip-ik { width:30px; height:30px; border-radius:50%; display:grid; place-items:center; background:var(--yta2); }
    .chip.ok .chip-ik { background:color-mix(in srgb, var(--ok) 16%, transparent); color:var(--ok); } .chip.varn .chip-ik { background:color-mix(in srgb, var(--varn) 18%, transparent); color:var(--varn); }
    .chip.fel { background:var(--fel); color:#fff; } .chip.fel .chip-ik { background:rgba(255,255,255,.2); }
    .klocka { font-size:28px; font-weight:300; letter-spacing:-.04em; font-variant-numeric:tabular-nums; padding:0 4px; }
    .kolon { animation:blink 2s steps(1) infinite; }
    @media not all and (min-width:1000px) and (min-height:580px) {
      .topp { flex-wrap:wrap; gap:10px; min-height:0; } .topp h1 { font-size:22px; } .klocka { display:none; }
      .aura:has(.gnchip) .topp-namn { display:none; }
      .flikar { order:3; width:100%; } .topp-h .chip .txt { display:none; } .topp-h .chip { padding:5px; }
    }

    /* ── Hem ── */
    .hem { display:grid; grid-template-columns:minmax(240px, 290px) minmax(0, 1fr) minmax(240px, 290px); gap:var(--gap); }
    .kol { display:flex; flex-direction:column; gap:var(--gap); min-height:0; min-width:0; }
    .f1 { flex:1 1 0; } .fa { flex:none; } .f13 { flex:1.3 1 0; } .f15 { flex:1.5 1 0; }
    @media not all and (min-width:1000px) and (min-height:580px) {
      .hem { display:flex; flex-direction:column; } .hem .kol { display:contents; } .hem .kort { flex:none; } .hem .hero { min-height:240px; } .enheter-kort .enheter { margin-top:4px; } .klimat .matare { min-height:170px; }
      .o1 { order:1; } .o2 { order:2; } .o3 { order:3; } .o4 { order:4; } .o5 { order:5; } .o6 { order:6; } .o7 { order:7; } .o8 { order:8; }
    }
    .hero { padding:0; min-height:200px; color:#fff; background:#2A2621; border:0; }
    .hero-bild { position:absolute; inset:0; background:center/cover; animation:kenburns 40s ease-in-out infinite alternate; }
    @keyframes kenburns { from { transform:scale(1.02); } to { transform:scale(1.12) translate(-2%, -1%); } }
    .hero-utan { position:absolute; inset:0; background:radial-gradient(80% 90% at 85% 0%, color-mix(in srgb, var(--acc) 70%, #2A2621), #1B1815 75%); }
    .mork .hero-utan { background:radial-gradient(80% 90% at 85% 0%, color-mix(in srgb, var(--acc) 60%, #10132A), #0B0D1C 75%); }
    .noir .hero-utan { background:radial-gradient(80% 90% at 85% 0%, color-mix(in srgb, var(--acc) 45%, #17130F), #0C0A08 75%); }
    .hero-utan ha-icon { position:absolute; right:-20px; bottom:-40px; opacity:.1; }
    .hero::after { content:''; position:absolute; inset:0; background:linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,.62)); pointer-events:none; }
    .hero-in { position:absolute; inset:0; z-index:1; padding:22px; display:flex; flex-direction:column; justify-content:flex-end; gap:12px; }
    .hero-namn { font-size:32px; font-weight:800; letter-spacing:-.04em; line-height:1; text-shadow:0 2px 20px rgba(0,0,0,.3); }
    .hero-chips { display:flex; gap:8px; flex-wrap:wrap; }
    .hc { display:inline-flex; align-items:center; gap:6px; padding:7px 12px; border-radius:999px; font-size:12.5px; font-weight:800;
      background:rgba(255,255,255,.16); backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px); border:1px solid rgba(255,255,255,.2); }
    .hero-topp { position:absolute; top:16px; right:16px; z-index:2; }
    .hero-fel { display:inline-flex; align-items:center; gap:6px; margin-right:auto; padding:6px 12px; border-radius:999px; background:rgba(0,0,0,.4); backdrop-filter:blur(8px); color:#fff; font-size:12px; font-weight:800; }
    .hero-topp .vxl { background:rgba(255,255,255,.28); } .hero-topp .vxl.pa { background:var(--acc); }
    .enheter { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:12px; }
    @media (min-width:1000px) and (min-height:580px) { .enheter-kort { display:flex; flex-direction:column; } .enheter { flex:1; min-height:0; grid-auto-rows:calc((100% - 12px) / 2); overflow-y:auto; scrollbar-width:none; } }
    @media not all and (min-width:1000px) and (min-height:580px) { .enheter { grid-template-columns:repeat(2, minmax(0, 1fr)); grid-auto-rows:168px; } }
    .enh { position:relative; isolation:isolate; border-radius:22px; background:var(--yta2); padding:14px; display:flex; flex-direction:column; justify-content:space-between;
      overflow:hidden; min-height:0; cursor:pointer; touch-action:pan-y; user-select:none; -webkit-user-select:none; transition:background .5s var(--ease), transform .35s var(--fjader), box-shadow .5s; }
    .enh:active { transform:scale(.97); }
    .enh.pa { background:linear-gradient(160deg, color-mix(in srgb, rgb(var(--c, 255,190,110)) 18%, var(--yta)), var(--yta2) 75%);
      box-shadow:inset 0 0 0 1.5px color-mix(in srgb, rgb(var(--c, 255,190,110)) 30%, transparent); }
    .enh-topp { display:flex; justify-content:space-between; align-items:flex-start; position:relative; z-index:2; }
    .enh-ik { width:36px; height:36px; border-radius:50%; display:grid; place-items:center; background:var(--yta); color:var(--dim); box-shadow:0 2px 6px rgba(0,0,0,.06); }
    .enh.pa .enh-ik { color:var(--acc); }
    button.enh-ik { position:relative; cursor:pointer; transition:transform .3s var(--fjader); } button.enh-ik:active { transform:scale(.85); }
    .enh.dim button.enh-ik::after { content:""; position:absolute; width:10px; height:10px; border-radius:50%; right:-1px; bottom:-1px; background:conic-gradient(#f55,#fd5,#5f8,#5af,#a6f,#f55); box-shadow:0 0 0 2px var(--yta); }
    .enh-txt { position:relative; z-index:2; max-width:100%; transition:opacity .2s; text-shadow:0 0 10px var(--yta2), 0 0 4px var(--yta2), 0 0 2px var(--yta2); }
    .enh-namn { font-weight:800; font-size:14.5px; letter-spacing:-.02em; line-height:1.2; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; hyphens:auto; }
    .enh-sub { font-size:12px; color:var(--dim); margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-weight:600; }
    svg.produkt { overflow:visible; }
    .enh .produkt.bil { right:-2%; top:30%; height:42%; max-width:78%; overflow:visible; } .enheter.fyra .enh .produkt.bil { top:34%; height:34%; max-width:84%; }
    @media (min-width:1000px) and (min-height:580px) { .enheter.fyra { grid-template-columns:repeat(4, minmax(0, 1fr)); gap:10px; } .enheter.fyra .enh { padding:12px; } .enheter.fyra .enh-namn { font-size:13.5px; } }
    .enh .produkt { position:absolute; right:6%; top:24%; bottom:auto; width:auto; height:46%; max-width:46%; z-index:1; pointer-events:none; transition:transform .6s var(--ease); }
    .enh:hover .produkt { transform:translateY(-3px) scale(1.03); }
    .enh-bar { position:absolute; left:14px; bottom:10px; width:34%; height:4px; border-radius:2px; background:var(--yta3); overflow:hidden; z-index:2; }
    .enh-bar i { display:block; height:100%; width:var(--fyll, 0%); background:var(--acc); border-radius:2px; transition:width .5s var(--ease); }
    .enh.dim .enh-txt { margin-bottom:10px; }
    .enh.drar .enh-bar i { transition:none; }
    .enh-stor { position:absolute; left:14px; top:50%; transform:translateY(-50%); font-size:42px; font-weight:300; letter-spacing:-.05em; opacity:0; transition:opacity .25s; z-index:3; pointer-events:none; }
    .enh.drar .enh-stor { opacity:1; } .enh.drar .enh-txt { opacity:0; }
    .enh.av { opacity:.45; }
    /* Rummets foto som tonad bakgrund – släckt rum blir dämpat, tänt rum varmt */
    .enh-foto { position:absolute; inset:0; z-index:0; background:center/cover; opacity:.5; filter:saturate(.45) brightness(.92); transition:opacity .6s var(--ease), filter .6s var(--ease), transform 8s var(--ease); }
    .enh.foto.pa .enh-foto { opacity:.78; filter:saturate(1.05) brightness(1); }
    .enh.foto:hover .enh-foto { transform:scale(1.04); }
    .enh.foto::before { content:''; position:absolute; inset:0; z-index:1; pointer-events:none; background:linear-gradient(180deg, color-mix(in srgb, var(--yta2) 55%, transparent) 0%, transparent 35%, color-mix(in srgb, var(--yta2) 30%, transparent) 55%, var(--yta2) 92%); }
    .enh.foto.pa::before { background:linear-gradient(180deg, color-mix(in srgb, var(--yta2) 40%, transparent) 0%, transparent 35%, color-mix(in srgb, rgb(var(--c, 255,190,110)) 12%, color-mix(in srgb, var(--yta2) 40%, transparent)) 58%, var(--yta2) 94%); }
    .enh.foto .produkt { z-index:2; filter:drop-shadow(0 8px 14px rgba(0,0,0,.25)); } .enh.foto .enh-topp, .enh.foto .enh-txt { z-index:3; }
    .r-glod { animation:glod 4s ease-in-out infinite; transform-box:fill-box; transform-origin:center; }
    @keyframes glod { 50% { opacity:.4; transform:scale(1.08); } }
    .r-flamma { animation:flamma 1.8s ease-in-out infinite; transform-box:fill-box; transform-origin:bottom; }
    .r-flamma:nth-of-type(2n) { animation-delay:.4s; }
    @keyframes flamma { 50% { transform:scaleY(.82) scaleX(1.1); opacity:.85; } }
    .r-led { animation:blink 2s ease-in-out infinite; }
    .r-gnista { animation:gnista 2.2s ease-in-out infinite; } @keyframes gnista { 50% { opacity:.35; } }
    .r-snurr { transform-origin:60px 60px; animation:snurr 8s linear infinite; }
    .r-pulsring { transform-origin:60px 62px; animation:pulsring 2.4s ease-out infinite; opacity:0; } .r-pulsring.r2 { animation-delay:1.2s; }
    @keyframes pulsring { from { transform:scale(.7); opacity:.6; } to { transform:scale(1.3); opacity:0; } }
    .r-anga path { animation:anga 2.2s ease-out infinite; } .r-anga path:nth-child(2) { animation-delay:.7s; } .r-anga path:nth-child(3) { animation-delay:1.4s; }
    @keyframes anga { 0% { opacity:0; transform:translateY(4px); } 40% { opacity:.9; } 100% { opacity:0; transform:translateY(-8px); } }
    .r-strale { stroke-dasharray:4 3; animation:strale .6s linear infinite; } @keyframes strale { to { stroke-dashoffset:-7; } }
    .r-blad { transform-origin:60px 72px; animation:blad 6s ease-in-out infinite; } @keyframes blad { 50% { transform:rotate(2deg); } }
    /* Klimat */
    .klimat { display:flex; flex-direction:column; position:relative; isolation:isolate; }
    .kl-bg { position:absolute; inset:0; z-index:-1; pointer-events:none; background:radial-gradient(110% 70% at 0% 0%, color-mix(in srgb, var(--kf) 16%, transparent), transparent 70%); transition:background 1s; }
    .kl-topp { display:flex; align-items:center; gap:12px; margin-top:2px; min-width:0; }
    .kl-temp { flex:none; font-size:48px; font-weight:200; letter-spacing:-.06em; line-height:.9; color:var(--text); } .kl-temp sup { font-size:.5em; font-weight:300; color:var(--kf); vertical-align:top; position:relative; top:.15em; margin-left:1px; }
    .kl-info { display:grid; gap:3px; min-width:0; flex:1; } .kl-trend, .kl-fukt { overflow:hidden; text-overflow:ellipsis; } .kl-info b { font-size:13.5px; font-weight:800; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .kl-trend, .kl-fukt { display:inline-flex; align-items:center; gap:3px; font-size:11.5px; font-weight:700; color:var(--dim); white-space:nowrap; } .kl-trend.upp { color:#E07A3A; } .kl-trend.ner { color:#4F94D8; }
    .kl-graf { position:relative; flex:1; min-height:48px; margin:12px 0 0; } .kl-graf svg { position:absolute; inset:0; width:100%; height:100%; overflow:visible; }
    .kl-pkt { position:absolute; width:9px; height:9px; margin:-4.5px 0 0 -4.5px; border-radius:50%; background:var(--kf); box-shadow:0 0 0 3px var(--yta), 0 0 0 6px color-mix(in srgb, var(--kf) 30%, transparent); animation:klpuls 2.4s ease-in-out infinite; }
    @keyframes klpuls { 50% { box-shadow:0 0 0 3px var(--yta), 0 0 0 9px color-mix(in srgb, var(--kf) 0%, transparent); } }
    .kl-band { position:absolute; left:2px; transform:translateY(-110%); font-size:9.5px; font-weight:800; color:var(--ok); opacity:.75; }
    .kl-mm { display:flex; justify-content:space-between; margin-top:4px; font-size:11px; font-weight:800; color:var(--text); white-space:nowrap; } .kl-mm span { display:inline-flex; align-items:center; gap:1px; }
    .kl-mm span:nth-child(2) { color:var(--dim); font-weight:700; } .kl-mm small { font-size:10px; color:var(--dim); font-weight:700; margin-left:2px; }
    .kl-rum { display:flex; gap:6px; margin-top:10px; overflow-x:auto; scrollbar-width:none; } .kl-rum::-webkit-scrollbar { display:none; }
    .kl-rum button { flex:none; display:flex; align-items:center; gap:6px; padding:7px 10px; border-radius:12px; background:var(--yta2); font-size:12px; font-weight:700; color:var(--dim); white-space:nowrap; }
    .kl-rum button b { color:var(--text); font-weight:800; } .kl-rum button i { width:7px; height:7px; border-radius:50%; }
    .matare { position:relative; flex:1; min-height:120px; display:grid; place-items:center; }
    .matare svg { position:absolute; inset:0; width:100%; height:100%; }
    .matare-txt { text-align:center; position:relative; margin-top:16px; }
    .matare-txt b { display:block; font-size:42px; font-weight:300; letter-spacing:-.05em; line-height:1; }
    .matare-txt span { font-size:12.5px; color:var(--dim); font-weight:700; }
    .klimat-rad { display:flex; justify-content:space-between; gap:8px; margin-top:10px; } .klimat-rad > div[data-a] { cursor:pointer; }
    .klimat-rad.manga { overflow-x:auto; scrollbar-width:none; justify-content:flex-start; } .klimat-rad.manga > div { flex:0 0 auto; min-width:76px; }
    .kl-kurva { margin-top:6px; } .kl-kurva svg { display:block; width:100%; height:34px; overflow:visible; }
    .kl-kurva-t { display:flex; justify-content:space-between; gap:6px; margin-top:3px; font-size:10.5px; font-weight:800; color:var(--dim); white-space:nowrap; } .kl-kurva-t span { display:inline-flex; align-items:center; }
    .kl-kurva-t span:first-child { font-weight:700; opacity:.8; }
    .klimat-rad > div { flex:1; padding:9px; border-radius:16px; background:var(--yta2); text-align:center; min-width:0; }
    .klimat-rad b { display:block; font-size:15px; font-weight:800; } .klimat-rad small { font-size:11px; color:var(--dim); font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:block; }
    /* Förslag */
    .forslag { color:#fff; background:linear-gradient(135deg, var(--acc2), var(--acc) 70%); border:0; }
    .mork .forslag { background:linear-gradient(135deg, var(--acc2), var(--acc) 55%, #3B2FD1); }
    .noir .forslag { background:linear-gradient(135deg, #2B2219, #8A6A40 58%, #D4AF7A); }
    /* Glansen startar och slutar helt utanför kortet och vilar däremellan – så att omstarten aldrig syns */
    .forslag { overflow:hidden; }
    .forslag::before { content:''; position:absolute; top:-30%; bottom:-30%; left:0; width:90%; pointer-events:none;
      background:linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,.09) 25%, rgba(255,255,255,.25) 50%, rgba(255,255,255,.09) 75%, rgba(255,255,255,0) 100%);
      transform:translateX(-145%) skewX(-20deg); animation:skimmer 8s cubic-bezier(.45,0,.25,1) infinite; will-change:transform; }
    @keyframes skimmer { 0% { transform:translateX(-145%) skewX(-20deg); } 55%, 100% { transform:translateX(150%) skewX(-20deg); } }
    @media (prefers-reduced-motion:reduce) { .forslag::before { animation:none; opacity:0; } }
    .forslag .kh-t { color:rgba(255,255,255,.88); } .forslag .kh-ik { background:rgba(255,255,255,.22); color:#fff; }
    .forslag-t { font-size:17px; font-weight:800; letter-spacing:-.02em; position:relative; }
    .forslag-s { font-size:13px; opacity:.9; margin:4px 0 14px; line-height:1.45; position:relative; font-weight:600; white-space:normal; overflow-wrap:anywhere; }
    .forslag-t { white-space:normal; overflow-wrap:anywhere; }
    .forslag .knapp { position:relative; flex:1; background:#fff; color:#1E1A15; }
    .forslag-k { display:flex; gap:8px; position:relative; }
    .forslag .forslag-ign { flex:none; background:rgba(255,255,255,.2); color:#fff; padding-inline:14px; }
    .forslag-n { position:relative; font-size:11.5px; font-weight:800; padding:4px 10px; border-radius:999px; background:rgba(255,255,255,.22); color:#fff; }
    /* Media mini */
    .mm { display:flex; flex-direction:column; gap:12px; flex:1; min-height:0; }
    .mmkort { position:relative; isolation:isolate; } .mm-bg { position:absolute; inset:-30px; z-index:-1; background:center/cover; filter:blur(34px) saturate(1.6); opacity:.22; transform:scale(1.1); transition:opacity .8s var(--ease); pointer-events:none; }
    .mm-bg.pa { opacity:.34; }
    .mm-hero { display:none; position:absolute; left:0; right:0; top:0; height:calc(100% - 170px); z-index:-1; background:center/cover; pointer-events:none;
      -webkit-mask-image:linear-gradient(180deg, #000 0%, #000 62%, transparent 100%); mask-image:linear-gradient(180deg, #000 0%, #000 62%, transparent 100%); }
    .mm-hero::after { content:''; position:absolute; inset:0; background:linear-gradient(180deg, rgba(0,0,0,.35) 0%, transparent 30%); }
    .mm-hero.pa { animation:mmzoom 30s ease-in-out infinite alternate; } @keyframes mmzoom { to { transform:scale(1.08); } } .mork .mm-bg { opacity:.3; } .mork .mm-bg.pa { opacity:.45; }
    .mmkort { display:flex; flex-direction:column; } .mmkort .mm { display:flex; flex-direction:column; gap:10px; }
    .mm-topp { display:flex; gap:12px; align-items:center; min-width:0; }
    .mm-bild { width:72px; height:72px; flex:none; border-radius:16px; background:var(--yta3) center/cover; display:grid; place-items:center; color:var(--svag); box-shadow:0 10px 20px -10px rgba(0,0,0,.5); }
    .mm-titel { font-weight:800; font-size:14.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .mm-sub { font-size:12.5px; color:var(--dim); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-weight:600; }
    .prog { height:4px; border-radius:2px; background:var(--yta3); overflow:hidden; }
    .prog i { display:block; height:100%; width:0; background:var(--acc); border-radius:2px; transition:width 1s linear; }
    .prog-t { display:flex; justify-content:space-between; font-size:11px; color:var(--svag); margin-top:5px; font-weight:700; }
    .mm-knappar { display:flex; justify-content:center; align-items:center; gap:14px; margin-top:auto; flex:none; }
    .ikk { width:42px; height:42px; border-radius:50%; display:grid; place-items:center; color:var(--text); transition:transform .3s var(--fjader), color .3s; }
    .ikk:active { transform:scale(.86); } .ikk.svag { color:var(--svag); } .ikk.pa { color:var(--acc); }
    /* Väder */
    .vk-topp { display:flex; align-items:center; justify-content:space-between; }
    .vk-temp { font-size:44px; font-weight:300; letter-spacing:-.05em; line-height:1; }
    .vk-txt { font-size:13px; color:var(--dim); font-weight:700; margin-top:4px; }
    .vdagar { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:8px; margin-top:12px; }
    .vd { padding:9px 10px 7px; border-radius:16px; background:var(--yta2); display:flex; flex-direction:column; gap:2px; }
    .vd small { font-size:10.5px; font-weight:800; color:var(--dim); text-transform:uppercase; letter-spacing:.06em; }
    .vd-r { display:flex; align-items:center; justify-content:space-between; } .vd b { font-size:15px; font-weight:800; }
    /* Hemma */
    .avatarer { display:flex; align-items:center; padding-left:2px; }
    .hus { display:grid; grid-template-columns:repeat(var(--n), minmax(0, 1fr)); gap:6px; }
    .hp { display:flex; flex-direction:column; align-items:center; gap:1px; padding:8px 2px 7px; border-radius:16px; background:var(--yta2); min-width:0; text-align:center; }
    .hp .av { width:38px; height:38px; margin:0 0 4px !important; position:relative; } .hp b { font-size:12.5px; font-weight:800; max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .hp small { font-size:10.5px; font-weight:700; color:var(--dim); white-space:nowrap; max-width:100%; overflow:hidden; text-overflow:ellipsis; } .hp .hp-var { font-size:11px; font-weight:800; color:var(--text); }
    .hp.hemma .hp-var { color:var(--ok); } .hp .hp-tid { display:inline-flex; align-items:center; gap:2px; } .hp.hemma { background:color-mix(in srgb, var(--ok) 9%, var(--yta2)); }
    .av { width:40px; height:40px; border-radius:50%; display:grid; place-items:center; font-size:14px; font-weight:800; background:var(--yta3) center/cover; color:var(--dim);
      box-shadow:0 0 0 3px var(--yta); margin-right:-8px; position:relative; }
    .av.hemma::after { content:''; position:absolute; right:0; bottom:0; width:11px; height:11px; border-radius:50%; background:var(--ok); box-shadow:0 0 0 2.5px var(--yta); }
    /* Energi mini */
    .elm-stor { font-size:34px; font-weight:300; letter-spacing:-.05em; line-height:1; }
    .elm-stor small { font-size:12px; font-weight:800; letter-spacing:0; color:var(--svag); margin-left:4px; }
    .minibars { display:flex; align-items:flex-end; gap:4px; height:56px; margin-top:12px; }
    .minibars i { flex:1; border-radius:4px 4px 2px 2px; background:var(--sf); opacity:.85; height:var(--h); transform-origin:bottom; animation:vaxa .9s var(--ease) both; animation-delay:calc(var(--j) * 25ms); }
    .minibars i.nu { opacity:1; box-shadow:0 0 0 2px var(--yta), 0 0 0 3.5px var(--text); }
    @keyframes vaxa { from { transform:scaleY(0); } }
    .elm-fot { font-size:12px; color:var(--dim); margin-top:8px; font-weight:700; }

    /* ── Ljus ── */
    .ljuslay { display:grid; grid-template-columns:300px minmax(0, 1fr); gap:var(--gap); }
    @media not all and (min-width:1000px) and (min-height:580px) { .ljuslay { display:flex; flex-direction:column; } }
    .scenlista { display:flex; flex-direction:column; gap:8px; }
    .party-k { margin-top:8px; }
    @media (min-width:1000px) and (min-height:580px) {
      [data-s="scener"] .scenlista { gap:6px; } [data-s="scener"] .scen { padding:6px 10px; font-size:13.5px; } [data-s="scener"] .scen-ik { width:34px; height:34px; border-radius:11px; }
      [data-s="scener"] .kh { margin-bottom:10px; } [data-s="scener"] .kh[style*="margin-top:20px"] { margin-top:14px !important; } [data-s="scener"] .party-k { margin-top:6px; } [data-s="scener"] .party-takt button { padding:6px 0; }
    } .scen.party { width:100%; } .scen.party.pa { animation:partyglod 2.4s linear infinite; }
    @keyframes partyglod { 0% { --sc:#E8487A; } 33% { --sc:#7B6CFF; } 66% { --sc:#3ED1C6; } 100% { --sc:#E8487A; } }
    .party-fg { display:flex; gap:3px; margin-left:auto; } .party-fg i { width:10px; height:22px; border-radius:4px; }
    .party-takt { display:grid; grid-template-columns:repeat(3, 1fr); gap:6px; margin-top:6px; }
    .party-takt button { padding:7px 0; border-radius:12px; background:var(--yta2); font-size:12px; font-weight:800; color:var(--dim); text-align:center; }
    .party-takt button.pa { background:color-mix(in srgb, #E8487A 16%, var(--yta)); color:#E8487A; box-shadow:inset 0 0 0 1.5px color-mix(in srgb, #E8487A 45%, transparent); }
    .scen { position:relative; isolation:isolate; overflow:hidden; display:flex; align-items:center; gap:12px; padding:10px; border-radius:18px; background:var(--yta2);
      font-weight:800; font-size:14px; width:100%; transition:transform .3s var(--fjader); }
    .scen:active { transform:scale(.97); }
    .scen-ik { width:40px; height:40px; flex:none; border-radius:13px; display:grid; place-items:center; color:var(--sc); background:color-mix(in srgb, var(--sc) 16%, transparent); }
    .scen small { display:block; font-size:12px; font-weight:600; color:var(--dim); }
    .scen.pa { background:color-mix(in srgb, var(--sc) 14%, var(--yta)); box-shadow:inset 0 0 0 1.5px color-mix(in srgb, var(--sc) 50%, transparent); }
    .scen.pa .scen-ik { background:var(--sc); color:#fff; box-shadow:0 8px 20px -6px var(--sc); }
    .scen.pa::after { content:''; position:absolute; inset:0; z-index:-1; background:linear-gradient(110deg, transparent 30%, color-mix(in srgb, var(--sc) 25%, transparent) 50%, transparent 70%);
      background-size:250% 100%; animation:scenglans 3.5s linear infinite; }
    @keyframes scenglans { from { background-position:150% 0; } to { background-position:-100% 0; } }
    .rumsek { margin-bottom:22px; }
    .rr { display:flex; justify-content:space-between; align-items:center; gap:14px; margin:0 2px 12px; }
    .rr h2 { font-size:19px; font-weight:800; letter-spacing:-.03em; }
    .tiles { display:grid; grid-template-columns:repeat(auto-fill, minmax(190px, 1fr)); grid-auto-rows:168px; gap:12px; }
    @media not all and (min-width:1000px) and (min-height:580px) { .tiles { grid-template-columns:repeat(2, minmax(0, 1fr)); gap:10px; } }
    /* Surfplatta: alla rum delar på höjden så att allt får plats utan att skrolla */
    @media (min-width:1000px) and (min-height:580px) {
      .ljuslay > [data-s="ljusrum"] { display:flex; flex-direction:column; }
      .ljuslay .rumsek { flex:var(--rader, 1) 1 0; min-height:calc(var(--rader, 1) * 112px + 30px); display:flex; flex-direction:column; margin-bottom:12px; }
      .ljuslay .rumsek:last-child { margin-bottom:0; }
      .ljuslay .rr { margin:0 2px 8px; } .ljuslay .rr > div { display:flex; align-items:baseline; gap:10px; min-width:0; } .ljuslay .rr h2 { font-size:17px; white-space:nowrap; }
      .ljuslay .rr .dim { font-size:12.5px; white-space:nowrap; } .ljuslay .rr .vxl { transform:scale(.85); transform-origin:right center; }
      .ljuslay .tiles { flex:1; min-height:0; grid-template-columns:repeat(4, minmax(0, 1fr)); grid-template-rows:repeat(var(--rader, 1), minmax(0, 1fr)); grid-auto-rows:minmax(0, 1fr); gap:10px; }
      .ljuslay .tiles .enh { padding:12px; } .ljuslay .tiles .enh .produkt { top:max(22%, 38px); height:min(46%, calc(100% - 74px)); }
    }

    /* ── Media ── */
    .medialay { display:grid; grid-template-columns:minmax(340px, 44%) minmax(0, 1fr); gap:var(--gap); }
    @media not all and (min-width:1000px) and (min-height:580px) { .medialay { display:flex; flex-direction:column; } .bib { height:70vh; } }
    .mpkort { display:flex; flex-direction:column; }
    .mp { display:flex; flex-direction:column; flex:1; min-height:0; }
    .mp-bg { position:absolute; inset:-80px; background:center/cover; filter:blur(60px) saturate(1.6); opacity:.3; z-index:0; pointer-events:none; }
    .mp > *:not(.mp-bg) { position:relative; z-index:1; }
    .mp-skiva { position:relative; width:min(82%, 380px); aspect-ratio:1; margin:4px auto 0; flex:none; }
    @media (min-width:1000px) and (min-height:580px) { .mp-skiva { width:min(78%, 440px, calc(var(--h, 100vh) - 470px)); } }
    .mp-vinyl { position:absolute; inset:5%; border-radius:50%; transition:transform 1.1s var(--ease); }
    .mp-vinyl-in { position:absolute; inset:0; border-radius:50%; box-shadow:0 20px 40px rgba(0,0,0,.4);
      background:radial-gradient(circle, var(--acc) 0 15%, #0b0b0d 15.5% 17%, transparent 17.5%), repeating-radial-gradient(circle, #121214 0 2px, #1c1c20 2px 3.5px);
      animation:snurr 3.6s linear infinite; animation-play-state:paused; }
    .spelar .mp-vinyl { transform:translateX(26%); } .spelar .mp-vinyl-in { animation-play-state:running; }
    .mp-omslag { position:absolute; inset:0; border-radius:28px; background:var(--yta3) center/cover; display:grid; place-items:center; color:var(--svag); box-shadow:0 30px 50px -24px rgba(0,0,0,.6); }
    .mp-info { text-align:center; margin-top:18px; min-width:0; }
    .mp-titel { font-size:26px; font-weight:800; letter-spacing:-.035em; line-height:1.15; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
    .mp-artist { font-size:14px; color:var(--dim); margin-top:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-weight:700; }
    .mp-prog { margin:12px 0 4px; } .mp-bar { cursor:pointer; padding:8px 0; } .mp-bar .prog { height:5px; }
    .mp-knappar { display:flex; justify-content:center; align-items:center; gap:10px; }
    .spela { width:62px; height:62px; border-radius:50%; display:grid; place-items:center; background:var(--acc); color:var(--acc-ink);
      box-shadow:0 16px 34px -12px color-mix(in srgb, var(--acc) 80%, transparent); transition:transform .35s var(--fjader); }
    .spela:active { transform:scale(.9); }
    .mp-vol { display:flex; align-items:center; gap:10px; margin-top:10px; color:var(--dim); font-size:12px; font-weight:800; }
    .hogrow { display:flex; gap:8px; overflow-x:auto; scrollbar-width:none; margin-top:auto; padding-top:12px; flex:none; }
    .hogrow::-webkit-scrollbar { display:none; }
    .hog { flex:none; display:flex; align-items:center; gap:8px; padding:6px 12px 6px 6px; border-radius:999px; background:var(--yta2); font-size:12.5px; font-weight:800; }
    .hog .hog-ik { width:28px; height:28px; border-radius:50%; display:grid; place-items:center; background:var(--yta); }
    .hog.vald { background:var(--acc); color:var(--acc-ink); } .hog.vald .hog-ik { background:rgba(255,255,255,.22); }
    .hog.grupp { box-shadow:inset 0 0 0 1.5px var(--acc); }
    .bib { display:flex; flex-direction:column; min-height:0; }
    .sokfalt { display:flex; align-items:center; gap:10px; height:48px; padding:0 16px; border-radius:16px; background:var(--yta2); color:var(--svag); flex:none; }
    .sokfalt input { flex:1; min-width:0; background:none; border:0; outline:none; color:var(--text); font:700 14.5px 'Manrope',sans-serif; }
    .sokfalt input::placeholder { color:var(--svag); }
    .mflikar { display:flex; gap:6px; margin:12px 0; flex:none; overflow-x:auto; scrollbar-width:none; }
    .mflik { padding:8px 14px; border-radius:999px; font-size:13px; font-weight:800; color:var(--dim); background:var(--yta2); white-space:nowrap; max-width:260px; overflow:hidden; text-overflow:ellipsis; }
    .mflik.pa { background:var(--text); color:var(--yta); }
    .mlista { flex:1; min-height:0; overflow-y:auto; overscroll-behavior:contain; -webkit-overflow-scrolling:touch; scrollbar-width:none; }
    .bib:has(.tvp) .sokfalt { display:none; }
    .tvp { display:flex; flex-direction:column; gap:16px; padding:2px; }
    .tvp-topp { display:flex; align-items:center; justify-content:space-between; gap:12px; }
    .tvp-topp b { display:block; font-size:18px; font-weight:800; letter-spacing:-.02em; } .tvp-topp small { font-size:12.5px; color:var(--dim); font-weight:700; }
    .tvp-pa { width:44px; height:44px; border-radius:50%; display:grid; place-items:center; background:var(--yta2); color:var(--dim); transition:all .3s var(--fjader); }
    .tvp-pa.pa { background:var(--acc); color:var(--acc-ink); }
    .dpad { position:relative; width:min(230px, 72%); aspect-ratio:1; margin:4px auto 0; border-radius:50%; background:var(--yta2); box-shadow:inset 0 0 0 1px var(--kant); flex:none; }
    .dpad button { position:absolute; width:32%; height:32%; display:grid; place-items:center; color:var(--dim); border-radius:50%; transition:transform .25s var(--fjader), color .2s; }
    .dpad button:active { transform:scale(.86); color:var(--acc); }
    .dpad .u { top:3%; left:34%; } .dpad .d { bottom:3%; left:34%; } .dpad .l { left:3%; top:34%; } .dpad .r { right:3%; top:34%; }
    .dpad .ok { left:34%; top:34%; background:var(--yta); color:var(--text); box-shadow:var(--skugga); }
    .tvp-rad { display:flex; justify-content:center; gap:10px; flex-wrap:wrap; }
    .tvp-rad .rund { background:var(--yta2); color:var(--text); } .tvp-rad .rund:active { transform:scale(.86); }
    .appar { display:grid; grid-template-columns:repeat(auto-fill, minmax(120px, 1fr)); gap:8px; }
    .app { padding:12px 14px; border-radius:16px; background:var(--yta2); font-weight:800; font-size:13px; text-align:left; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; transition:transform .25s var(--fjader); }
    .app:active { transform:scale(.95); } .app.pa { background:var(--acc); color:var(--acc-ink); }
    .mrad { margin-bottom:18px; }
    .mrad h3 { margin:0 2px 10px; font-size:15px; font-weight:800; letter-spacing:-.02em; }
    .karusell { display:grid; grid-auto-flow:column; grid-auto-columns:144px; gap:12px; overflow-x:auto; scrollbar-width:none; padding-bottom:4px; overscroll-behavior-x:contain; touch-action:pan-x pan-y; }
    .karusell::-webkit-scrollbar { display:none; }
    .ruta { display:block; width:144px; text-align:left; min-width:0; }
    .ruta-bild { position:relative; width:144px; height:144px; aspect-ratio:1; border-radius:18px; background:var(--yta3) center/cover; display:grid; place-items:center; color:var(--svag);
      box-shadow:0 14px 26px -16px rgba(0,0,0,.5); transition:transform .3s var(--fjader); }
    .ruta-bild.rund { border-radius:50%; }
    .ruta-bild.rund .ruta-spela { right:4px; bottom:4px; }
    .ruta:hover .ruta-spela, .ruta:active .ruta-spela { transform:scale(1); opacity:1; }
    .ruta:active .ruta-bild { transform:scale(.95); }
    .ruta-spela { position:absolute; right:8px; bottom:8px; width:32px; height:32px; transform:scale(.85); opacity:.92; transition:transform .25s var(--fjader); border-radius:50%; display:grid; place-items:center; background:var(--acc); color:var(--acc-ink); box-shadow:0 6px 14px rgba(0,0,0,.3); }
    .ruta.laddar .ruta-spela { animation:puls .8s ease-in-out infinite; }
    .ruta b { display:block; font-size:13px; font-weight:800; margin-top:8px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .ruta small { display:block; font-size:11.5px; color:var(--dim); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-weight:700; }
    .lat { display:grid; grid-template-columns:28px 44px minmax(0, 1fr) auto; gap:12px; align-items:center; padding:7px 8px; border-radius:14px; width:100%; transition:background .2s; }
    .lat:hover { background:var(--yta2); } .lat.nu { background:color-mix(in srgb, var(--acc) 12%, transparent); }
    .lat-nr { font-size:12px; color:var(--svag); text-align:center; font-weight:800; display:flex; justify-content:center; }
    .lat-bild { width:44px; height:44px; flex:none; border-radius:11px; background:var(--yta3) center/cover; display:grid; place-items:center; color:var(--svag); }
    .lat b { display:block; font-size:14px; font-weight:800; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; } .lat.nu b { color:var(--acc); }
    .lat small { display:block; font-size:12px; color:var(--dim); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-weight:600; }
    .lat-k { display:flex; gap:4px; } .lat-k button { width:36px; height:36px; border-radius:50%; display:grid; place-items:center; color:var(--dim); }
    .lat-k button:hover { background:var(--yta3); color:var(--text); }
    .album-topp { display:flex; align-items:center; gap:14px; padding:12px; border-radius:20px; background:var(--yta2); margin-bottom:10px; }
    .mflik { display:inline-flex; align-items:center; gap:6px; }
    .party-ram { position:relative; height:100%; min-height:420px; border-radius:20px; overflow:hidden; background:#000; }
    .party-ram iframe { position:absolute; inset:0; width:100%; height:100%; border:0; }
    .party-hel { position:absolute; left:14px; bottom:14px; }
    .party { display:flex; align-items:center; gap:28px; flex-wrap:wrap; padding:10px; }
    .party-qr { flex:none; width:220px; aspect-ratio:1; padding:16px; border-radius:24px; background:#fff; box-shadow:var(--skugga); }
    .party-steg { display:grid; gap:10px; margin:14px 0 18px; font-size:14px; font-weight:700; color:var(--dim); }
    .party-steg div { display:flex; align-items:center; gap:10px; }
    .party-steg b { width:26px; height:26px; border-radius:50%; display:grid; place-items:center; background:var(--yta2); color:var(--text); font-size:12px; }
    .nasta { display:flex; align-items:center; gap:12px; padding:10px; border-radius:16px; background:var(--yta2); margin-bottom:14px; }

    /* ── Energi ── */
    .ellay { display:grid; grid-template-columns:320px minmax(0, 1fr) minmax(0, 1fr); grid-template-rows:minmax(0, 1fr) auto auto; gap:var(--gap); }
    .ellay > [data-s="elnu"] { grid-column:1; grid-row:1 / 4; } .ellay > [data-s="elgraf"] { grid-column:2 / 4; grid-row:1; } .ellay > [data-s="elapp"] { grid-column:2 / 4; grid-row:2; }
    .ellay.medsol > [data-s="elapp"] { grid-column:2; } .ellay > [data-s="solkort"] { grid-column:3; grid-row:2; } .ellay > [data-s="elstat"] { grid-column:2 / 4; grid-row:3; }
    /* Med elbil: kompakt bilkort under "Just nu" */
    .ellay > .el-vanster { grid-column:1; grid-row:1 / 4; display:flex; flex-direction:column; gap:var(--gap); min-height:0; } .el-vanster > [data-s="elnu"] { flex:1; min-height:0; } .el-vanster > .elbilkort { flex:none; }
    .elbilkort { display:flex; flex-direction:column; } .elbilkort .kh { margin-bottom:4px; }
    .eb-topp { display:grid; grid-template-columns:minmax(0, 1.6fr) minmax(0, 1fr); gap:6px; align-items:center; } .eb-bil { position:relative; height:74px; margin-left:-8px; cursor:pointer; }
    .eb-topp .eb-rad { flex-direction:column; align-items:flex-end; gap:2px; } .eb-topp .eb-rack { margin:0; }
    .el-vanster .eb-mer { display:none; } .eb-mer { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:12px; } .eb-mer > div { padding:9px 11px; border-radius:14px; background:var(--yta2); font-size:11px; font-weight:800; color:var(--dim); }
    .eb-mer b { display:block; font-size:16px; color:var(--text); letter-spacing:-.02em; margin-top:1px; } .eb-bil svg { width:100%; height:100%; overflow:visible; }
    .eb-rad { display:flex; align-items:baseline; gap:10px; } .eb-soc { font-size:30px; font-weight:300; letter-spacing:-.05em; line-height:1; } .eb-soc small { font-size:15px; color:var(--dim); font-weight:700; letter-spacing:0; }
    .eb-rack { margin-left:auto; text-align:right; font-size:12px; font-weight:800; color:var(--dim); } .eb-rack b { display:block; font-size:17px; color:var(--text); letter-spacing:-.02em; }
    .eb-bar { position:relative; height:10px; border-radius:5px; background:var(--yta3); margin:8px 0 4px; } .eb-bar i { position:absolute; inset:0 auto 0 0; border-radius:5px; background:var(--ebf); transition:width 1s var(--ease); }
    .eb-bar.laddar i { background:linear-gradient(90deg, var(--ebf), color-mix(in srgb, var(--ebf) 50%, #fff), var(--ebf)); background-size:200% 100%; animation:ebladda 2s linear infinite; } @keyframes ebladda { to { background-position:-200% 0; } }
    .eb-bar em { position:absolute; top:-4px; bottom:-4px; width:2px; border-radius:1px; background:var(--text); opacity:.55; } .eb-bar em::after { content:attr(data-t); position:absolute; top:16px; left:50%; transform:translateX(-50%); font-size:10px; font-style:normal; font-weight:800; color:var(--dim); white-space:nowrap; }
    .eb-info { display:grid; gap:3px; margin-top:13px; } .eb-info > div { display:flex; align-items:center; gap:7px; font-size:12px; font-weight:700; color:var(--dim); } .eb-info b { color:var(--text); font-weight:800; margin-left:auto; white-space:nowrap; }
    .eb-knappar { display:flex; gap:6px; margin-top:auto; padding-top:6px; } .eb-knappar button { flex:1; display:flex; align-items:center; justify-content:center; gap:5px; padding:7px 6px; border-radius:14px; background:var(--yta2); font-size:12px; font-weight:800; }
    .eb-knappar button.pa { background:color-mix(in srgb, var(--acc) 16%, var(--yta)); color:var(--acc); }
    .solkort .kv.kv { grid-template-columns:repeat(auto-fit, minmax(110px, 1fr)); gap:8px; } .solkort .kv > div { padding:8px 12px; } .solkort .kv b { font-size:18px; } .solkort .kh, .elapp .kh { margin-bottom:10px; }
    .appar-g { display:grid; grid-template-columns:repeat(auto-fit, minmax(170px, 1fr)); gap:10px; }
    .ap { padding:11px 14px; border-radius:18px; background:var(--yta2); display:grid; gap:4px; min-width:0; }
    .ap-t { display:flex; align-items:center; gap:8px; } .ap-t b { font-size:13.5px; font-weight:800; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .ap-ik { width:30px; height:30px; flex:none; border-radius:10px; display:grid; place-items:center; color:var(--acc); background:color-mix(in srgb, var(--acc) 14%, transparent); }
    .ap-v { font-size:22px; font-weight:400; letter-spacing:-.04em; margin-top:2px; } .ap-v .vt { font-style:normal; font-size:12px; color:var(--dim); font-weight:800; margin-left:4px; letter-spacing:0; }
    .ap-s { font-size:11.5px; font-weight:800; color:var(--dim); } .ap-s.ok { color:var(--ok); }
    .bt { margin-top:16px; padding:10px 12px 6px; border-radius:18px; background:color-mix(in srgb, var(--ok) 9%, var(--yta2)); }
    .bt-t { display:flex; align-items:center; gap:6px; font-size:11px; font-weight:800; color:var(--ok); text-transform:uppercase; letter-spacing:.06em; margin-bottom:2px; }
    .bt-r { display:grid; grid-template-columns:34px minmax(0, 1fr) auto; gap:8px; align-items:center; padding:6px 0; border-top:1px solid var(--rad); font-size:12.5px; font-weight:700; }
    .bt-r:first-of-type { border-top:0; } .bt-n { font-size:11px; font-weight:800; padding:3px 0; border-radius:8px; background:var(--yta); text-align:center; }
    .bt-r > span:nth-child(2) { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; } .bt-r b { font-size:15px; font-weight:700; white-space:nowrap; } .bt-r .vt { font-style:normal; font-size:11px; color:var(--dim); margin-left:3px; font-weight:800; }
    .bt + .tips { margin-top:10px; }
    .elrad { display:grid; grid-template-columns:minmax(0, 1fr) minmax(0, 1.15fr); gap:var(--gap); min-height:0; }
    .elrad > .kort { min-height:0; } .elrad .kv { grid-template-columns:repeat(auto-fit, minmax(110px, 1fr)); gap:8px; } .elrad .kv > div { padding:8px 12px; } .elrad .kv b { font-size:18px; }
    .sol-topp { display:flex; align-items:center; gap:14px; }
    .sol-sol { width:62px; height:62px; flex:none; border-radius:20px; display:grid; place-items:center; background:var(--yta2); transition:background .6s; }
    .sol-sol.pa { background:radial-gradient(circle, rgba(255,196,80,.35), var(--yta2) 75%); }
    .sol-v b { display:block; font-size:36px; font-weight:300; letter-spacing:-.05em; line-height:1; } .sol-v b small { font-size:14px; color:var(--dim); font-weight:700; letter-spacing:0; }
    .sol-v span { font-size:12.5px; color:var(--dim); font-weight:700; }
    .sol-bar { height:5px; border-radius:3px; background:var(--yta3); overflow:hidden; margin:7px 0 5px; }
    .sol-v { flex:1; min-width:0; }
    .batt-blk { display:flex; align-items:center; gap:10px; flex:none; padding:8px 12px 8px 10px; border-radius:18px; background:var(--yta2); }
    .sol-topp > .batt-blk:only-child { flex:1; padding:14px; } .sol-topp > .batt-blk:only-child b { font-size:34px; font-weight:300; }
    .batt-blk b { display:block; font-size:20px; font-weight:400; letter-spacing:-.04em; line-height:1.1; } .batt-blk span { display:block; font-size:12px; color:var(--dim); font-weight:800; }
    .batt-blk small { display:block; font-size:11.5px; color:var(--svag); font-weight:700; }
    .batt-ik { position:relative; width:24px; height:40px; border-radius:7px; border:2.5px solid var(--dim); padding:2px; display:flex; align-items:flex-end; flex:none; margin-top:4px; }
    .batt-ik::before { content:''; position:absolute; top:-7px; left:50%; width:10px; height:4px; margin-left:-5px; border-radius:2px 2px 0 0; background:var(--dim); }
    .batt-ik i { display:block; width:100%; height:var(--soc); border-radius:3px; background:var(--bf); transition:height .8s var(--ease); }
    .batt-blk.laddar .batt-ik i { animation:glod 1.8s ease-in-out infinite; } .solkort .sol-topp { margin-bottom:12px; } .elrad .kh { margin-bottom:10px; }
    .sol-bar i { display:block; height:100%; width:var(--fyll); border-radius:3px; background:linear-gradient(90deg, #F7C04A, #F08A24); transition:width .8s var(--ease); }
    @media not all and (min-width:1000px) and (min-height:580px) { .elrad { grid-template-columns:1fr; } }
    @media (min-width:1000px) and (min-height:580px) { .elrad { height:clamp(200px, calc(var(--h, 100vh) * .36), 300px); } }
    @media not all and (min-width:1000px) and (min-height:580px) { .ellay { display:flex; flex-direction:column; } }
    .jatte { font-size:76px; font-weight:200; letter-spacing:-.07em; line-height:.9; margin:10px 0 4px; font-variant-numeric:tabular-nums; }
    .jatte.ok { color:var(--ok); } .jatte.fel { color:var(--fel); } .jatte.varn { color:var(--varn); }
    .tips { display:grid; gap:10px; margin-top:16px; }
    .tip { display:grid; grid-template-columns:auto minmax(0, 1fr) auto; gap:12px; align-items:center; padding:12px; border-radius:18px; background:var(--yta2); }
    .tip-ik { width:40px; height:40px; border-radius:13px; display:grid; place-items:center; }
    .tip b { display:block; font-size:14px; font-weight:800; } .tip small { display:block; font-size:12px; color:var(--dim); font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .tip .v { font-size:17px; font-weight:700; letter-spacing:-.03em; white-space:nowrap; text-align:right; }
    .tip .v .vt { font-style:normal; display:inline; font-size:12px; font-weight:800; color:var(--dim); margin-left:3px; letter-spacing:0; }
    .appr .v { text-align:right; font-size:17px; } .appr .v small { display:block; font-size:11.5px; color:var(--ok); font-weight:800; letter-spacing:0; }
    .kv b small { font-size:12px; color:var(--dim); font-weight:700; letter-spacing:0; }
    .kv.elkv { grid-template-columns:repeat(auto-fit, minmax(92px, 1fr)); gap:8px; } .kv.elkv > div { padding:10px 14px; } .kv.elkv b { font-size:20px; }
    .elgraf { display:flex; flex-direction:column; }
    .staplar-rull { flex:1; overflow-x:auto; scrollbar-width:none; display:flex; flex-direction:column; justify-content:flex-end; }
    .staplar-rull::-webkit-scrollbar { display:none; }
    .staplar { position:relative; display:grid; grid-template-columns:repeat(var(--n), minmax(12px, 1fr)); grid-template-rows:minmax(0, 1fr); gap:4px;
      height:220px; min-width:calc(var(--n) * 14px); margin-top:30px; flex:none; }
    @media (min-width:1000px) and (min-height:580px) { .staplar { height:auto; flex:1 1 0; min-height:90px; } .staplar-rull { min-height:0; } }
    .stapel { position:relative; height:100%; }
    .stapel i { position:absolute; left:0; right:0; bottom:0; display:block; height:var(--h); border-radius:6px 6px 3px 3px; background:var(--sf); opacity:.85; transform-origin:bottom; animation:vaxa .9s var(--ease) both; animation-delay:calc(var(--j) * 12ms); }
    .stapel.forbi i { opacity:.3; }
    .stapel.nu i { opacity:1; box-shadow:0 0 0 2px var(--yta), 0 0 0 3.5px var(--text); }
    .stapel.basta::before { content:""; position:absolute; left:-2px; right:-2px; bottom:-4px; height:calc(var(--h) + 10px); border-radius:8px; background:color-mix(in srgb, var(--acc) 22%, transparent); }
    .nu-lapp { position:absolute; bottom:calc(var(--h) + 12px); left:50%; transform:translateX(-50%); white-space:nowrap; padding:4px 9px; border-radius:999px; background:var(--text); color:var(--yta); font-size:11.5px; font-weight:800; }
    .axel { display:grid; grid-template-columns:repeat(var(--n), minmax(12px, 1fr)); gap:4px; min-width:calc(var(--n) * 14px); margin-top:8px; font-size:10.5px; color:var(--svag); font-weight:800; }
    .axel span { text-align:center; } .axel .dagdel { color:var(--acc); }
    .forklaring { display:flex; gap:16px; flex-wrap:wrap; margin-top:12px; font-size:12px; color:var(--dim); font-weight:700; }
    .forklaring i { display:inline-block; width:9px; height:9px; border-radius:3px; margin-right:6px; vertical-align:-1px; }
    .kv { display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:12px; }
    .kv > div { padding:14px 16px; border-radius:18px; background:var(--yta2); }
    .kv span { font-size:12px; color:var(--dim); display:block; font-weight:800; } .kv b { font-size:24px; font-weight:400; letter-spacing:-.04em; }

    /* ── Säkerhet ── */
    .saklay { display:grid; grid-template-columns:330px minmax(0, 1fr); grid-template-rows:auto minmax(0, 1fr); gap:var(--gap); }
    .saklay > :nth-child(1) { grid-row:1 / 3; }
    .saklay.ny { grid-template-columns:300px minmax(0, 1fr); grid-template-rows:minmax(0, 1fr); } .saklay.ny > * { grid-row:auto !important; grid-column:auto !important; }
    .saklay.ny.medkam.medhand { grid-template-columns:290px minmax(0, 1fr) 310px; }
    .saklay.ny .larm { height:auto; min-height:100%; } .saklay.ny .larm-ring { width:136px; height:136px; margin:auto 0 8px; } .saklay.ny .larm-mitt { width:104px; height:104px; }
    .saklay.ny .larm-mitt ha-icon { display:block; margin:auto; } .saklay.ny .larm-titel { font-size:21px; } .saklay.ny .larm .seg { margin-top:0; } .saklay.ny .rl { margin-top:auto; padding-top:18px; }
    .rl { width:100%; margin:12px 0 12px; text-align:left; display:grid; gap:6px; }
    .rl-h { display:flex; justify-content:space-between; align-items:center; margin:0 2px 2px; font-size:11px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; color:var(--dim); }
    .rl-rad { display:flex; align-items:center; gap:9px; width:100%; padding:9px 10px; border-radius:14px; background:var(--yta2); color:var(--dim); text-align:left; }
    .rl-rad b { flex:1; font-size:13px; font-weight:800; color:var(--text); } .rl-rad em { font-style:normal; font-size:12px; font-weight:800; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:52%; }
    .rl-rad em.ok { color:var(--ok); } .rl-rad em.varn { color:var(--varn); } .rl-rad em.fel { color:var(--fel); } .rl-rad em.inf { color:var(--info); } .rl-rad.oppen { background:var(--yta3); }
    .rl-lista { display:grid; gap:2px; margin:-1px 0 4px; padding:4px; border-radius:14px; background:var(--yta2); }
    .rl-lista button { display:flex; align-items:center; gap:8px; padding:6px 8px; border-radius:10px; text-align:left; } .rl-lista button:active { background:var(--yta3); }
    .rl-lista span { flex:1; font-size:12.5px; font-weight:700; } .rl-lista small { font-size:11px; font-weight:700; color:var(--dim); white-space:nowrap; }
    .rl-lista i { width:7px; height:7px; border-radius:50%; flex:none; } .rl-lista i.ok { background:var(--ok); } .rl-lista i.varn { background:var(--varn); } .rl-lista i.fel { background:var(--fel); } .rl-lista i.inf { background:var(--info); }
    .kam-huvud { flex:1; min-height:0; display:flex; } .kam.stor { height:100%; min-height:200px; border-radius:20px; }
    .kam-sen { font-size:12px; font-weight:700; opacity:.85; margin-top:2px; }
    .kam-tumm { display:grid; grid-template-columns:repeat(var(--n), minmax(0, 1fr)); gap:8px; margin-top:10px; flex:none; }
    .kam.tumm { height:76px; border-radius:14px; opacity:.72; transition:opacity .3s, box-shadow .3s; } .kam.tumm.pa { opacity:1; box-shadow:0 0 0 2px var(--yta), 0 0 0 4px var(--acc); }
    .kam.tumm em { position:absolute; left:8px; bottom:6px; font-style:normal; font-size:11.5px; font-weight:800; color:#fff; text-shadow:0 1px 4px rgba(0,0,0,.7); }
    .kam.tumm::after { content:''; position:absolute; inset:0; background:linear-gradient(180deg, transparent 45%, rgba(0,0,0,.55)); pointer-events:none; }
    .tumm-p { position:absolute; top:7px; right:7px; width:9px; height:9px; border-radius:50%; background:var(--varn); box-shadow:0 0 0 2px rgba(0,0,0,.35); z-index:1; }
    .hand-akt { display:grid; grid-template-columns:repeat(24, 1fr); align-items:end; gap:2px; height:34px; margin:0 0 3px; }
    .hand-akt i { border-radius:2px; background:var(--yta3); } .hand-akt i.har { background:color-mix(in srgb, var(--acc) 55%, var(--yta3)); } .hand-akt i.nu { background:var(--acc); }
    .hand-akt-t { display:flex; justify-content:space-between; font-size:10.5px; font-weight:800; color:var(--dim); margin-bottom:10px; }
    .hand-bilder { display:flex; flex:none; } .hand-bilder img { width:40px !important; height:30px !important; border-radius:8px !important; object-fit:cover; box-shadow:0 0 0 2px var(--yta); } .hand-bilder img + img { margin-left:-26px; }
    .handkort .hand-rad { padding:7px 4px; } .handkort .hand-rad b { font-size:13px; } .handkort .hand-rad small { font-size:11.5px; }
    .vmlay { display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); grid-template-rows:auto; grid-auto-rows:minmax(0, 1fr); gap:var(--gap); overflow-y:auto; scrollbar-width:none; } .vmlay > .portlagen { grid-column:1 / -1; }
    @media not all and (min-width:1000px) and (min-height:580px) { .vmlay { display:flex; flex-direction:column; } }
    .vmkort { display:flex; flex-direction:column; gap:10px; min-height:0; } .vmkort .kh { margin-bottom:0; }
    .vm-topp { flex:1; min-height:0; display:flex; flex-direction:column; gap:8px; } .vm-bild { display:block; flex:1; min-height:90px; max-height:240px; border-radius:18px; background:var(--yta2); padding:12px; } .vm-bild svg { width:100%; height:100%; overflow:visible; }
    .vm-nu { display:flex; align-items:baseline; gap:8px; padding:0 4px; } .vm-nu b { font-size:40px; font-weight:200; letter-spacing:-.05em; line-height:1; } .vm-nu small { font-size:12.5px; font-weight:700; color:var(--dim); }
    .vm-mal { display:grid; grid-template-columns:auto 1fr auto; align-items:center; gap:8px; padding:6px; border-radius:18px; background:var(--yta2); text-align:center; }
    .vm-mal button { width:44px; height:44px; border-radius:14px; background:var(--yta); display:grid; place-items:center; } .vm-mal button:active { transform:scale(.92); }
    .vm-mal small { display:block; font-size:10.5px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; color:var(--dim); } .vm-mal b { font-size:24px; font-weight:800; letter-spacing:-.03em; }
    .vm-chips { display:flex; flex-wrap:wrap; gap:5px; } .vm-chips button { display:flex; align-items:center; gap:4px; padding:7px 10px; border-radius:999px; background:var(--yta2); font-size:12px; font-weight:800; color:var(--dim); }
    .vm-chips button.pa { background:var(--text); color:var(--yta); } .vm-chips.pre button { padding:5px 10px; font-size:11.5px; }
    .r-flode { animation:flode 1.6s ease-in-out infinite; transform-box:fill-box; } @keyframes flode { 0% { opacity:.15; transform:translateY(-3px); } 50% { opacity:.95; } 100% { opacity:.15; transform:translateY(4px); } }
    .diag-knapp { display:inline-flex; align-items:center; gap:4px; padding:4px 10px; border-radius:999px; background:var(--yta2); font-size:11.5px; font-weight:800; color:var(--dim); white-space:nowrap; } .diag-knapp.varn { background:color-mix(in srgb, var(--varn) 14%, var(--yta2)); color:var(--varn); }
    .portlay { display:grid; grid-template-columns:repeat(auto-fit, minmax(250px, 1fr)); grid-template-rows:auto; grid-auto-rows:minmax(0, 1fr); gap:var(--gap); } .portlay > .portlagen { grid-column:1 / -1; }
    .portlagen { display:grid; grid-template-columns:auto minmax(0, 1fr); gap:14px; align-items:stretch; padding:12px; }
    .pl-lagen { display:flex; gap:8px; } .pl-lage { display:grid; grid-template-columns:auto 1fr; column-gap:8px; align-items:center; padding:9px 14px 9px 10px; border-radius:16px; background:var(--yta2); text-align:left; min-width:128px; }
    .pl-lage span { grid-row:1 / 3; width:34px; height:34px; border-radius:11px; display:grid; place-items:center; background:var(--yta); color:var(--acc); } .pl-lage b { font-size:13.5px; font-weight:800; } .pl-lage small { font-size:11px; font-weight:700; color:var(--dim); white-space:nowrap; }
    .pl-lage:active { transform:scale(.96); }
    .pl-forslag { display:grid; grid-auto-flow:column; grid-auto-columns:minmax(0, 1fr); gap:8px; min-width:0; }
    .pl-f, .pl-lugnt { display:flex; align-items:center; gap:10px; padding:8px 8px 8px 10px; border-radius:16px; background:color-mix(in srgb, var(--plf, var(--ok)) 12%, var(--yta2)); min-width:0; }
    .pl-f > div, .pl-lugnt > div { flex:1; min-width:0; } .pl-f b, .pl-lugnt b { display:block; font-size:13.5px; font-weight:800; } .pl-f small, .pl-lugnt small { display:block; font-size:11.5px; font-weight:700; color:var(--dim); line-height:1.3; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
    .pl-fik { width:34px; height:34px; flex:none; border-radius:11px; display:grid; place-items:center; color:var(--plf); background:color-mix(in srgb, var(--plf) 16%, transparent); }
    .pl-ja { flex:none; padding:9px 14px; border-radius:12px; background:var(--plf); color:#fff; font-size:12.5px; font-weight:800; white-space:nowrap; } .pl-nej { flex:none; width:30px; height:30px; border-radius:50%; display:grid; place-items:center; color:var(--dim); }
    .pl-lugnt { color:var(--ok); } .pl-lugnt b { color:var(--text); }
    @media not all and (min-width:1000px) and (min-height:580px) { .portlagen { grid-template-columns:1fr; } .pl-lagen { overflow-x:auto; scrollbar-width:none; } .pl-forslag { grid-auto-flow:row; } }
    @media not all and (min-width:1000px) and (min-height:580px) { .portlay { display:flex; flex-direction:column; } }
    .portkort { display:flex; flex-direction:column; min-height:0; } .portkort .kh { margin-bottom:10px; }
    .portgrid { display:grid; grid-template-columns:repeat(auto-fill, minmax(150px, 1fr)); gap:10px; flex:1; min-height:0; overflow-y:auto; scrollbar-width:none; align-content:start; }
    .portgrid.en { grid-template-columns:1fr; } .portgrid.en .port-bild { height:min(240px, 36vh); }
    .port { position:relative; display:flex; flex-direction:column; gap:7px; padding:10px; border-radius:20px; background:var(--yta2); transition:background .4s; }
    .port.pa { background:linear-gradient(160deg, color-mix(in srgb, var(--pf) 22%, var(--yta)), var(--yta2) 80%); } .port.av { opacity:.55; }
    .port-bild { display:block; height:118px; width:100%; border-radius:14px; } .port-bild svg { display:block; width:100%; height:100%; overflow:visible; }
    .port-bild svg * { transition:all .9s var(--ease); }
    .port-txt { padding:0 4px; } .port-txt b { display:block; font-size:14px; font-weight:800; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; } .port-txt small { display:block; font-size:12px; font-weight:700; color:var(--dim); }
    .port-knappar { display:grid; grid-template-columns:1fr auto 1fr; gap:5px; } .port-knappar button { display:flex; align-items:center; justify-content:center; gap:2px; padding:8px 6px; border-radius:12px; background:var(--yta); font-size:12px; font-weight:800; white-space:nowrap; }
    .port-knappar button:active { transform:scale(.95); } .port-knappar button.bekr { background:var(--varn); color:#fff; }
    .port-alla { display:grid; grid-template-columns:auto 1fr 1fr; align-items:center; gap:6px; margin-top:10px; padding-top:10px; border-top:1px solid var(--rad); }
    .port-alla span { font-size:11px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; color:var(--dim); padding:0 4px; }
    .port-alla button { display:flex; align-items:center; justify-content:center; gap:3px; padding:9px 6px; border-radius:12px; background:var(--yta2); font-size:12px; font-weight:800; white-space:nowrap; }
    .saklay.medkam.medhand { grid-template-columns:330px minmax(0, 1fr) 330px; } .saklay.medkam.medhand > :nth-child(4) { grid-column:3; grid-row:1 / 3; }
    .handkort { display:flex; flex-direction:column; min-height:0; } .hand-lista { flex:1; min-height:0; overflow-y:auto; scrollbar-width:none; margin:0 -6px; padding:0 6px; } .hand-lista::-webkit-scrollbar { display:none; }
    @media not all and (min-width:1000px) and (min-height:580px) { .hand-lista { max-height:460px; } }
    .hand-filter { display:flex; gap:4px; margin:-2px 0 8px; overflow-x:auto; scrollbar-width:none; } .hand-filter button { padding:5px 11px; border-radius:999px; background:var(--yta2); font-size:12px; font-weight:800; color:var(--dim); white-space:nowrap; }
    .hand-filter button.pa { background:var(--text); color:var(--yta); }
    .hand-dag { font-size:11px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; color:var(--dim); margin:10px 0 4px; } .hand-dag:first-child { margin-top:0; }
    .hand-rad { display:flex; align-items:center; gap:10px; width:100%; padding:6px 4px; border-radius:14px; text-align:left; position:relative; }
    .hand-rad::before { content:''; position:absolute; left:51px; top:-6px; bottom:-6px; width:2px; background:var(--yta3); z-index:0; } .hand-rad:last-child::before { bottom:50%; }
    .hand-rad .tid { width:34px; flex:none; font-size:12px; font-weight:800; color:var(--dim); font-variant-numeric:tabular-nums; }
    .hand-rad .hik { position:relative; z-index:1; width:30px; height:30px; flex:none; border-radius:50%; display:grid; place-items:center; color:var(--hf); background:color-mix(in srgb, var(--hf) 16%, var(--yta)); box-shadow:0 0 0 3px var(--yta); }
    .hand-rad .htx { flex:1; min-width:0; } .hand-rad b { display:block; font-size:13px; font-weight:800; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; } .hand-rad small { display:block; font-size:11.5px; font-weight:700; color:var(--dim); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .hand-rad img { width:62px; height:40px; flex:none; border-radius:10px; object-fit:cover; background:var(--yta3); }
    button.hand-rad:active { background:var(--yta2); }
    @media not all and (min-width:1000px) and (min-height:580px) { .saklay { display:flex; flex-direction:column; } }
    .larm { display:flex; flex-direction:column; align-items:center; text-align:center; gap:4px; height:100%; }
    .larm .kh { align-self:stretch; }
    .larm-ring { position:relative; width:176px; height:176px; display:grid; place-items:center; margin:auto 0 10px; }
    .larm-ring > i { position:absolute; inset:0; border-radius:50%; border:1.5px solid var(--lf); opacity:0; }
    .larmat .larm-ring > i { animation:ring 3s ease-out infinite; } .larmat .larm-ring > i:nth-child(2) { animation-delay:1.5s; }
    .larmar .larm-ring > i { animation:ring 1s ease-out infinite; }
    @keyframes ring { from { transform:scale(.8); opacity:.9; } to { transform:scale(1.4); opacity:0; } }
    .larm-mitt { position:relative; width:134px; height:134px; border-radius:50%; display:grid; place-items:center; color:var(--lf);
      background:radial-gradient(circle at 50% 30%, color-mix(in srgb, var(--lf) 26%, var(--yta)), color-mix(in srgb, var(--lf) 8%, var(--yta)) 70%);
      box-shadow:0 20px 50px -14px color-mix(in srgb, var(--lf) 60%, transparent), inset 0 1px 0 rgba(255,255,255,.3); }
    .larm-mitt svg { position:absolute; inset:-6px; width:calc(100% + 12px); height:calc(100% + 12px); transform:rotate(-90deg); }
    .larm-mitt circle { fill:none; stroke-width:4; } .larm-mitt .ned-bak { stroke:var(--yta3); }
    .larm-mitt .ned-c { stroke:var(--lf); stroke-linecap:round; stroke-dasharray:${CIRK.toFixed(1)}; transition:stroke-dashoffset 1s linear; }
    .larm-mitt b { font-size:46px; font-weight:300; color:var(--text); }
    .larm-varn { display:inline-flex; align-items:center; gap:5px; margin-top:2px; padding:3px 10px; border-radius:999px; background:color-mix(in srgb, var(--varn) 15%, transparent); color:var(--varn); font-size:12.5px; font-weight:800; cursor:pointer; }
    .larm-titel { font-size:24px; font-weight:800; letter-spacing:-.035em; } .larmar .larm-titel { color:var(--fel); }
    .seg { position:relative; display:grid; grid-template-columns:repeat(var(--ln), minmax(0, 1fr)); width:100%; margin-top:auto; padding:5px; border-radius:20px; background:var(--yta2); }
    .seg-i { position:absolute; top:5px; bottom:5px; left:5px; width:calc((100% - 10px) / var(--ln)); transform:translateX(calc(var(--li) * 100%)); border-radius:15px;
      background:var(--yta); box-shadow:0 4px 12px rgba(0,0,0,.1); transition:transform .55s var(--fjader); }
    .seg button { position:relative; z-index:1; display:flex; flex-direction:column; align-items:center; gap:3px; padding:10px 2px; font-size:12px; font-weight:800; color:var(--dim); }
    .seg button.pa { color:var(--lf); }
    .skydd { display:grid; grid-template-columns:repeat(auto-fill, minmax(180px, 1fr)); gap:10px; }
    .sk { display:flex; align-items:center; gap:12px; padding:12px; border-radius:18px; background:var(--yta2); min-width:0; width:100%; transition:all .4s var(--ease); }
    .sk-ik { width:40px; height:40px; flex:none; border-radius:13px; display:grid; place-items:center; background:var(--yta); color:var(--dim); }
    .sk b { display:block; font-size:13.5px; font-weight:800; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .sk small { font-size:12px; color:var(--dim); font-weight:700; white-space:nowrap; }
    .sk.pa { background:color-mix(in srgb, var(--sf) 14%, var(--yta)); box-shadow:inset 0 0 0 1.5px color-mix(in srgb, var(--sf) 40%, transparent); }
    .sk.pa .sk-ik { background:var(--sf); color:#fff; } .sk.pa small { color:var(--sf); }
    .kamkort { display:flex; flex-direction:column; }
    .kamgrid { display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); grid-auto-rows:minmax(150px, 1fr); gap:12px; }
    @media (min-width:1000px) and (min-height:580px) { .kamgrid { flex:1; min-height:0; overflow-y:auto; scrollbar-width:none; } }
    @media not all and (min-width:1000px) and (min-height:580px) { .kamgrid { grid-auto-rows:auto; } .kam { aspect-ratio:16 / 9; } }
    .kam { position:relative; display:block; width:100%; border-radius:20px; overflow:hidden; background:#16171C; min-height:0; }
    .kam img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
    .kam-over { position:absolute; inset:0; display:flex; flex-direction:column; justify-content:space-between; align-items:flex-start; padding:12px; color:#fff; background:linear-gradient(to top, rgba(0,0,0,.6), transparent 45%); }
    .kam.stor .kam-over { padding:16px; } .kam.stor .kam-over > .live { align-self:flex-end; } .kam.stor .kam-namn { font-size:17px; }
    .kam-over.x {
      background:linear-gradient(to top, rgba(0,0,0,.6), transparent 45%); }
    .live { display:inline-flex; align-items:center; gap:6px; padding:5px 10px; border-radius:999px; background:rgba(0,0,0,.45);
      backdrop-filter:blur(8px); font-size:10.5px; font-weight:800; letter-spacing:.1em; }
    .live::before { content:''; width:6px; height:6px; border-radius:50%; background:#FF4D4D; animation:blink 1.6s steps(1) infinite; }
    .live.person { background:var(--varn); color:#111; } .live.person::before { display:none; }
    .kam-namn { font-size:15px; font-weight:800; }
    .kam-av { position:absolute; inset:0; display:grid; place-content:center; justify-items:center; gap:8px; color:rgba(255,255,255,.5); font-size:13px; }

    /* ── Väder ── */
    .vlay { display:grid; grid-template-columns:minmax(0, 1.2fr) minmax(0, 1fr) 300px; grid-template-rows:auto minmax(0, 1fr) auto; gap:var(--gap); }
    .vlay > :nth-child(1) { grid-column:1 / 3; } .vlay > :nth-child(2) { grid-column:3; grid-row:1 / 4; } .vlay > :nth-child(3) { grid-column:1; grid-row:2; } .vlay > :nth-child(4) { grid-column:2; grid-row:2; } .vlay > :nth-child(5) { grid-column:1 / 3; grid-row:3; }
    .vnu-kort { padding:0; } .vh { position:relative; isolation:isolate; padding:18px; height:100%; overflow:hidden; border-radius:inherit; }
    .vh-bg { position:absolute; inset:0; z-index:-2; transition:background 1.2s var(--ease); }
    .vh-ljus { color:#1E1A15; --dim:rgba(30,26,21,.62); --yta2:rgba(255,255,255,.42); --text:#1E1A15; }
    .vh-mork { color:#F4F6FF; --dim:rgba(244,246,255,.68); --yta2:rgba(255,255,255,.09); --text:#F4F6FF; }
    .vh .vchip { backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); box-shadow:inset 0 0 0 1px rgba(255,255,255,.18); }
    .vh .kh-ik { background:rgba(255,255,255,.22); } .vh .wi { filter:drop-shadow(0 10px 18px rgba(0,0,0,.18)); }
    .vh-stj { position:absolute; inset:0 0 30% 0; z-index:-1; pointer-events:none; } .vh-stj i { position:absolute; width:2px; height:2px; border-radius:50%; background:#fff; animation:blink 3.6s ease-in-out infinite; }
    @keyframes blink { 50% { opacity:.15; } }
    .vsidokort { display:flex; flex-direction:column; } .radar-slot { display:block; } .vsidokort > .sido-slot { flex:1; display:flex; flex-direction:column; justify-content:space-between; }
    .vsidokort > .sido-slot > .sido-del { margin-top:0; } .vsidokort .solbage { max-width:250px; }
    .radar { position:relative; height:220px; border-radius:18px; overflow:hidden; background:var(--yta2); }
    .radar-lager { position:absolute; left:0; top:0; width:768px; height:768px; transform-origin:0 0; }
    .radar-lager img { position:absolute; width:256px; height:256px; max-width:none; user-select:none; pointer-events:none; }
    .radar-bas, .radar-ram { position:absolute; inset:0; } .radar-ram { transition:opacity .35s; opacity:.85; } .mork .radar-ram { opacity:.9; } .radar-namn { position:absolute; inset:0; } .ljus .radar-bas img { filter:contrast(1.08); }
    .radar-hem { position:absolute; left:50%; top:50%; width:12px; height:12px; margin:-6px 0 0 -6px; border-radius:50%; background:var(--acc); z-index:2;
      box-shadow:0 0 0 3px var(--yta), 0 0 0 9px color-mix(in srgb, var(--acc) 30%, transparent); animation:radarpuls 2.4s ease-in-out infinite; }
    @keyframes radarpuls { 50% { box-shadow:0 0 0 3px var(--yta), 0 0 0 14px color-mix(in srgb, var(--acc) 0%, transparent); } }
    .radar-tl { position:absolute; left:10px; right:10px; bottom:8px; display:flex; gap:3px; z-index:2; } .radar-tl i { flex:1; height:4px; border-radius:2px; background:rgba(128,128,128,.35); } .radar-tl i.pa { background:var(--acc); }
    .radar-attr { position:absolute; right:8px; top:6px; z-index:2; font-size:8.5px; font-weight:700; color:var(--dim); background:color-mix(in srgb, var(--yta) 70%, transparent); padding:1px 5px; border-radius:6px; }
    .radar-fel { position:absolute; left:10px; right:10px; bottom:22px; z-index:3; text-align:center; font-size:12px; font-weight:800; color:var(--dim); }
    .radar-tid { font-weight:800; font-size:12px; }
    .natt-rader { display:grid; gap:6px; margin-top:10px; } .natt-rader > div { display:flex; align-items:center; gap:8px; padding:8px 10px; border-radius:14px; background:var(--yta2); font-size:12px; font-weight:700; color:var(--dim); }
    .natt-rader span { flex:1; color:var(--text); } .natt-rader b { font-size:12px; font-weight:800; }
    .tk .pb { width:14px; height:16px; display:flex; align-items:flex-end; } .tk .pb i { display:block; width:100%; border-radius:3px 3px 1px 1px; background:color-mix(in srgb, var(--info) 75%, transparent); }
    .tk .vw { display:flex; align-items:center; gap:2px; font-size:11px; color:var(--dim); font-weight:800; } .tk .vw svg { width:9px; height:9px; }
    .vk-lead { margin:0 0 12px !important; font-size:15px; font-weight:700; line-height:1.45; letter-spacing:-.01em; }
    .vk-lista { display:grid; gap:9px; } [data-s="vkoll"] { display:flex; flex-direction:column; } [data-s="vkoll"] .vk-lista { align-content:start; gap:9px; }
    .varn-okp { display:inline-flex; align-items:center; gap:5px; }
    [data-s="vkoll"] .vk-lead { margin-bottom:9px !important; } [data-s="vkoll"] .vk-p > span { width:29px; height:29px; border-radius:10px; }
    .vk-siffror { margin-top:auto; padding-top:8px; display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:8px; }
    .vk-siffror-t { grid-column:1 / -1; font-size:11px; font-weight:800; color:var(--dim); text-transform:uppercase; letter-spacing:.07em; margin-bottom:-2px; }
    .vk-siffror > div:not(.vk-siffror-t) { padding:7px 10px; border-radius:14px; background:var(--yta2); display:grid; gap:1px; min-width:0; }
    .vk-siffror small { display:flex; justify-content:space-between; gap:4px; font-size:11px; font-weight:800; color:var(--dim); white-space:nowrap; } .vk-siffror b { font-size:18px; font-weight:800; letter-spacing:-.02em; white-space:nowrap; }
    .vk-siffror small span { font-weight:700; overflow:hidden; text-overflow:ellipsis; } .vk-p { display:flex; gap:10px; align-items:center; font-size:13px; font-weight:700; line-height:1.35; }
    .vk-p > span { width:32px; height:32px; flex:none; border-radius:11px; display:grid; place-items:center; }
    .varn-k { display:flex; gap:10px; padding:12px; margin-bottom:12px; border-radius:16px; background:color-mix(in srgb, var(--vf) 14%, transparent); box-shadow:inset 3px 0 0 var(--vf); color:var(--vf); cursor:pointer; }
    .varn-k > div { color:var(--text); min-width:0; } .varn-k b { display:block; font-size:13.5px; font-weight:800; } .varn-k small { display:block; font-size:11.5px; color:var(--dim); font-weight:700; }
    .varn-k p { margin:4px 0 0 !important; font-size:12.5px; line-height:1.4; color:var(--dim); font-weight:600; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
    .varn-mer { display:inline-flex; align-items:center; gap:2px; margin-top:5px; font-size:11.5px; font-weight:800; color:var(--vf); }
    .kh .pill.fel { cursor:pointer; }
    /* Ute idag */
    [data-s="vute"] { display:flex; flex-direction:column; gap:7px; } [data-s="vute"] > .kh { margin-bottom:0; } [data-s="vute"] > .ut-akt { flex:1; align-content:space-evenly; }
    .ut-tl { display:grid; grid-template-columns:repeat(var(--n), minmax(0, 1fr)); gap:2px; } .ut-tl i { height:8px; border-radius:3px; background:var(--yta3); }
    .ut-tl i.bra { background:color-mix(in srgb, var(--ok) 72%, transparent); } .ut-tl i.ok { background:color-mix(in srgb, var(--varn) 62%, transparent); } .ut-tl i.dalig { background:color-mix(in srgb, var(--fel) 40%, transparent); }
    .ut-tl i.b { height:12px; margin-top:-2px; background:var(--ok); box-shadow:0 3px 10px -3px var(--ok); }
    .ut-tlh { margin-top:-7px; font-size:10.5px; font-weight:800; color:var(--dim); } .ut-tlh span { white-space:nowrap; }
    .ut-akt { display:grid; gap:5px; } .ut-a { display:flex; align-items:center; gap:10px; min-width:0; }
    .ut-a > span { width:30px; height:30px; flex:none; border-radius:11px; display:grid; place-items:center; } .ut-a > div { min-width:0; flex:1; }
    .ut-a b { display:block; font-size:13px; font-weight:800; } .ut-a small { display:block; font-size:11.5px; color:var(--dim); font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .ut-a em { font-style:normal; font-size:13px; font-weight:800; white-space:nowrap; }
    .ut-klad { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
    .ut-k { padding:7px 10px 8px; border-radius:16px; background:var(--yta2); display:grid; grid-template-columns:auto 1fr; column-gap:7px; align-items:center; align-content:start; }
    .ut-k small { grid-column:1 / -1; font-size:10.5px; font-weight:800; color:var(--dim); text-transform:uppercase; letter-spacing:.05em; margin-bottom:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .ut-k > span { color:var(--acc); display:grid; } 
    .ut-k p { margin:0 !important; font-size:12px; font-weight:700; line-height:1.3; } .ut-k p b { font-size:14px; margin-right:2px; }
    .ut-vadra { display:flex; align-items:center; gap:10px; padding:7px 10px; border-radius:16px; background:color-mix(in srgb, var(--vf) 12%, transparent); }
    .ut-vadra > span { color:var(--vf); display:grid; } .ut-vadra > div { flex:1; min-width:0; } .ut-vadra b { display:block; font-size:13px; font-weight:800; } .ut-vadra small { display:block; font-size:11.5px; font-weight:700; color:var(--dim); line-height:1.3; }
    .ut-vadra em { font-style:normal; font-size:13px; font-weight:800; white-space:nowrap; color:var(--vf); } .ut-vadra em i { font-style:normal; margin:0 3px; color:var(--dim); }
    /* Prognos */
    .vp-hog { display:flex; align-items:center; gap:14px; }
    .vp-flik { display:flex; gap:2px; padding:3px; border-radius:999px; background:var(--yta2); } .vp-flik button { padding:5px 12px; border-radius:999px; font-size:12px; font-weight:800; color:var(--dim); white-space:nowrap; }
    .vp-flik button.pa { background:var(--yta); color:var(--text); box-shadow:0 1px 6px rgba(0,0,0,.1); }
    .pg-leg { display:flex; align-items:center; gap:5px; font-size:11.5px; font-weight:800; color:var(--dim); } .pg-leg i { width:12px; height:3px; border-radius:2px; margin-left:6px; }
    .pg-leg i.t { background:var(--acc); } .pg-leg i.r { height:9px; width:7px; background:var(--info); opacity:.75; } .pg-leg i.v { background:repeating-linear-gradient(90deg, var(--dim) 0 3px, transparent 3px 6px); }
    .vp-info { margin-left:12px; font-size:12.5px; font-weight:700; color:var(--dim); letter-spacing:0; text-transform:none; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; min-width:0; } .vp-info b { color:var(--text); }
    [data-s="vprog"] .kh-t { min-width:0; flex:1; } [data-s="vprog"] .kh { gap:12px; margin-bottom:4px; }
    .pg-rull, .pd-rull { overflow-x:auto; scrollbar-width:none; overscroll-behavior-x:contain; } .pg-rull::-webkit-scrollbar { display:none; }
    .pg { position:relative; }
    .pg-rad { display:grid; grid-template-columns:repeat(var(--n), minmax(0, 1fr)); } .pg-rad > span { display:flex; justify-content:center; align-items:center; gap:2px; white-space:nowrap; }
    .pg-ik { height:26px; } .pg-graf { position:relative; height:80px; margin:0 0 2px; } .pg-graf svg { position:absolute; inset:0; width:100%; height:100%; overflow:visible; }
    .pg-p { position:absolute; width:7px; height:7px; margin:-3.5px 0 0 -3.5px; border-radius:50%; background:var(--yta); box-shadow:inset 0 0 0 2px var(--acc); }
    .pg-p.pa { width:11px; height:11px; margin:-5.5px 0 0 -5.5px; background:var(--acc); box-shadow:0 0 0 3px var(--yta); }
    .pg-t { position:absolute; transform:translate(-50%, calc(-100% - 6px)); font-size:12.5px; font-weight:800; pointer-events:none; } .pg-t.pa { color:var(--acc); font-size:14px; }
    .pg-mm { position:absolute; transform:translate(-50%, -3px); font-size:10.5px; font-weight:800; color:var(--info); white-space:nowrap; pointer-events:none; } .pg-v { height:15px; font-size:11px; font-weight:800; color:var(--dim); } .pg-v svg { width:9px; height:9px; }
    .pg-h { height:16px; margin-top:2px; font-size:11.5px; font-weight:800; color:var(--dim); } .pg-h b { color:var(--text); text-transform:capitalize; }
    .pg-dyg { position:absolute; top:0; bottom:0; border-left:1px dashed var(--rad); }
    .pg-knapp { position:absolute; inset:0; display:grid; grid-template-columns:repeat(var(--n), minmax(0, 1fr)); } .pg-knapp button { border-radius:8px; }
    .pg-knapp button.pa { background:color-mix(in srgb, var(--acc) 10%, transparent); }
    .pd { display:grid; grid-template-columns:repeat(var(--n), minmax(0, 1fr)); gap:4px; }
    .pd-d { display:grid; grid-template-columns:auto auto; justify-content:center; justify-items:center; align-items:center; column-gap:6px; row-gap:1px; padding:4px 0 5px; border-radius:16px; }
    .pd-d > .pd-n, .pd-d > .pd-dt, .pd-d > svg, .pd-d > .pd-r, .pd-d > .pd-v { grid-column:1 / -1; } .pd-d > .pd-bar { grid-row:span 2; grid-column:2; } .pd-d > .pd-h { grid-column:1; } .pd-d > .pd-l { grid-column:1; }
    .pd-d.idag { background:var(--yta2); } .pd-n { font-size:13px; font-weight:800; text-transform:capitalize; display:flex; align-items:center; gap:2px; } .pd-n.helg { color:var(--acc); } .pd-n span { color:var(--acc); display:grid; }
    .pd-dt { font-size:10.5px; font-weight:700; color:var(--dim); margin-bottom:1px; } .pd-h { font-size:15px; font-weight:800; margin-top:1px; } .pd-l { font-size:12.5px; font-weight:700; color:var(--dim); }
    .pd-bar { position:relative; width:6px; height:38px; border-radius:3px; background:var(--yta3); } .pd-bar i { position:absolute; left:0; right:0; border-radius:3px; }
    .pd-r { font-size:11px; font-weight:800; color:var(--info); min-height:14px; } .pd-v { display:flex; align-items:center; gap:2px; font-size:11px; font-weight:800; color:var(--dim); min-height:14px; } .pd-v svg { width:9px; height:9px; }
    @media not all and (min-width:1000px) and (min-height:580px) { .pg { min-width:720px; } .pd { min-width:600px; } .pg-leg, .vp-info { display:none; } .pg-rull { margin:0 -16px; padding:0 16px; } }
    .varn-ok { align-self:flex-start; display:inline-flex; align-items:center; gap:6px; margin-bottom:10px; padding:5px 10px; border-radius:999px; background:color-mix(in srgb, var(--ok) 14%, transparent); color:var(--ok); font-size:11.5px; font-weight:800; }
    .dlista { display:grid; gap:2px; } .dl { display:grid; grid-template-columns:44px 30px 54px 28px minmax(40px, 1fr) 30px; gap:8px; align-items:center; padding:2px 2px; border-top:1px solid var(--rad); }
    .dl:first-child { border-top:0; } .dl-d { font-size:13.5px; font-weight:800; text-transform:capitalize; } .dl-r { font-size:11px; color:var(--info); font-weight:800; text-align:right; white-space:nowrap; }
    .dl-l { font-size:13.5px; color:var(--dim); font-weight:700; text-align:right; } .dl-h { font-size:13.5px; font-weight:800; }
    .dl-bar { position:relative; height:6px; border-radius:3px; background:var(--yta3); } .dl-bar i { position:absolute; top:0; bottom:0; border-radius:3px; }
    .sido-del { margin-top:14px; padding-top:12px; border-top:1px solid var(--rad); }
    .vsidokort .kh { margin-bottom:8px; } .vsidokort .solbage { max-width:236px; } .vsidokort .soltider { margin-top:2px; } .vsidokort .soltider b { font-size:15px; }
    .vsidokort .sol-info { margin-top:8px; gap:4px; } .vsidokort .natt-rader { margin-top:8px; gap:5px; } .vsidokort .natt-rader > div { padding:6px 10px; }
    .vk-pollen { margin-top:12px; padding:8px 12px 4px; border-radius:16px; background:var(--yta2); }
    .vk-pollen-t { display:flex; align-items:center; gap:6px; font-size:11.5px; font-weight:800; color:var(--dim); text-transform:uppercase; letter-spacing:.06em; margin-bottom:2px; }
    .sol-info { display:grid; gap:6px; margin-top:12px; } .sol-info span { display:flex; align-items:center; gap:6px; font-size:12px; color:var(--dim); font-weight:700; }
    .mane-rad { display:flex; align-items:center; gap:14px; } .mane-rad b { display:block; font-size:16px; font-weight:800; } .mane-rad small { font-size:12px; color:var(--dim); font-weight:700; } .mane { overflow:visible; flex:none; }
    .mane-nasta { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:12px; }
    .mane-nasta > div { padding:8px 10px; border-radius:14px; background:var(--yta2); font-size:11.5px; color:var(--dim); font-weight:800; display:grid; grid-template-columns:auto 1fr; column-gap:6px; align-items:center; }
    .mane-nasta b { grid-column:1 / -1; font-size:15px; color:var(--text); } .mane-nasta small { grid-column:1 / -1; font-size:11px; font-weight:700; }
    .vind-rad { display:flex; align-items:center; gap:14px; } .kompass { width:82px; height:82px; flex:none; } .kompass g { transition:transform 1s var(--ease); }
    .vind-rad b { display:block; font-size:30px; font-weight:300; letter-spacing:-.04em; line-height:1.05; } .vind-rad b small { font-size:13px; color:var(--dim); font-weight:700; letter-spacing:0; }
    .vind-rad span { display:block; font-size:12.5px; font-weight:800; } .vind-rad > div > small { display:block; font-size:11.5px; color:var(--dim); font-weight:700; margin-top:2px; }
    @media not all and (min-width:1000px) and (min-height:580px) { .vlay { display:flex; flex-direction:column; } }
    .vnu { display:grid; grid-template-columns:auto minmax(0, 1fr) minmax(0, 1.5fr); gap:20px; align-items:center; }
    .vnu-plats { display:flex; justify-content:flex-start; text-align:left; align-items:center; gap:5px; margin-bottom:8px; font-size:11.5px; font-weight:800; letter-spacing:.09em; text-transform:uppercase; color:var(--dim); white-space:nowrap; }
    .vnu-temp { font-size:66px; font-weight:200; letter-spacing:-.07em; line-height:.85; }
    .vnu-txt { font-size:18px; font-weight:800; letter-spacing:-.02em; margin-top:6px; }
    .vchips { display:grid; grid-template-columns:repeat(3, minmax(126px, auto)); justify-content:end; gap:8px; }
    .vchips.c1, .vchips.c2, .vchips.c4 { grid-template-columns:repeat(2, minmax(140px, auto)); } .vchips.c1 { grid-template-columns:minmax(140px, auto); }
    @media not all and (min-width:1000px) and (min-height:580px) { .vchips, .vchips.c4, .vchips.c2 { grid-template-columns:repeat(2, minmax(0, 1fr)); justify-content:stretch; } }
    .vchip { padding:9px 12px; border-radius:14px; background:var(--yta2); font-size:12px; color:var(--dim); font-weight:800; display:flex; align-items:center; gap:7px; white-space:nowrap; }
    .vchip b { margin-left:auto; padding-left:8px; font-size:13px; }
    .vchip b { color:var(--text); }
    .vchip.vadra { cursor:pointer; color:var(--vf); font:inherit; font-size:12px; font-weight:800; text-align:left; } .vh .vchip.vadra { box-shadow:inset 0 0 0 1.5px color-mix(in srgb, var(--vf) 60%, transparent); }
    @media not all and (min-width:1000px) and (min-height:580px) { .vnu { grid-template-columns:auto minmax(0, 1fr); } .vchips { grid-column:1 / -1; } .vnu-temp { font-size:72px; } }
    .tim-rull { overflow-x:auto; scrollbar-width:none; margin:0 -18px; padding:0 18px; overscroll-behavior-x:contain; }
    .tim-rull::-webkit-scrollbar { display:none; }
    .tim { position:relative; display:grid; grid-auto-flow:column; grid-auto-columns:62px; }
    .tim svg.kurva { position:absolute; left:0; top:64px; height:50px; pointer-events:none; overflow:visible; }
    .tk { display:flex; flex-direction:column; align-items:center; gap:3px; padding:8px 0; border-radius:18px; height:176px; }
    .tk.nu { background:var(--yta2); }
    .tk .h { font-size:12px; color:var(--dim); font-weight:800; } .tk .t { font-size:15px; font-weight:800; margin-top:auto; margin-bottom:2px; }
    .tk .r { font-size:11px; color:var(--info); min-height:14px; font-weight:800; }
    .dagar7 { display:grid; grid-template-columns:repeat(7, minmax(0, 1fr)); gap:8px; }
    .d7 { display:flex; flex-direction:column; align-items:center; gap:6px; padding:12px 4px; border-radius:18px; background:var(--yta2); text-align:center; }
    .d7 small { font-size:11px; font-weight:800; color:var(--dim); text-transform:uppercase; letter-spacing:.06em; }
    .d7 b { font-size:16px; font-weight:800; } .d7 span { font-size:12px; color:var(--dim); font-weight:700; } .d7 .r { color:var(--info); font-size:11px; min-height:13px; }
    @media not all and (min-width:1000px) and (min-height:580px) { .dagar7 { grid-template-columns:repeat(4, minmax(0, 1fr)); } }
    .solbage { width:100%; max-width:300px; display:block; margin:0 auto; overflow:visible; }
    .soltider { display:flex; justify-content:space-between; font-size:12px; color:var(--dim); margin-top:4px; font-weight:700; }
    .soltider b { display:block; color:var(--text); font-size:16px; font-weight:800; }
    .pol { display:grid; grid-template-columns:minmax(0, 1fr) auto 84px; gap:10px; align-items:center; padding:8px 0; border-top:1px solid var(--rad); }
    .pol:first-of-type { border-top:0; }
    .pol .m { display:flex; gap:3px; } .pol .m i { width:10px; height:8px; border-radius:2px; background:var(--yta3); }
    .pol .n { font-size:12px; font-weight:800; text-align:right; }
    .wi { overflow:visible; flex:none; }
    .w-strale { transform-origin:32px 32px; animation:snurr 24s linear infinite; }
    .w-solk { transform-origin:32px 32px; animation:puls 5s ease-in-out infinite; }
    .w-moln { animation:svava 7s ease-in-out infinite alternate; } .w-moln2 { animation:svava 9s ease-in-out infinite alternate-reverse; }
    @keyframes svava { from { transform:translateX(-2px); } to { transform:translateX(3px); } }
    .w-dr { animation:droppe 1.1s linear infinite; opacity:0; }
    @keyframes droppe { 0% { transform:translateY(-5px); opacity:0; } 30% { opacity:1; } 100% { transform:translateY(12px); opacity:0; } }
    .w-fl { animation:flinga 2.6s linear infinite; opacity:0; }
    @keyframes flinga { 0% { transform:translate(0, -4px); opacity:0; } 30% { opacity:1; } 100% { transform:translate(3px, 12px); opacity:0; } }
    .w-blixt { animation:blixt 3.2s steps(1) infinite; }
    @keyframes blixt { 0%, 88% { opacity:.2; } 89%, 92% { opacity:1; } 93%, 95% { opacity:.3; } 96%, 98% { opacity:1; } }
    .w-dim { animation:svava 4s ease-in-out infinite alternate; } .w-stj { animation:blink 3s ease-in-out infinite; }

    /* ── Hushåll ── */
    /* Spabad */
    .hhlay > .hk-spa { grid-row:span 2; }
    .hhlay.medspa .dryck { font-size:10.5px; } .hhlay.medspa .bp-ok { font-size:0; gap:0; padding-inline:10px; } .hhlay.medspa .dryck span { max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .hk-spa { position:relative; isolation:isolate; overflow:hidden; display:flex; flex-direction:column; }
    .sp-glod { position:absolute; inset:0; z-index:-1; pointer-events:none; background:radial-gradient(90% 50% at 50% 30%, color-mix(in srgb, var(--g) 22%, transparent), transparent 70%); transition:background 1s; }
    .pill.spa { background:color-mix(in srgb, #36B9E0 16%, transparent); color:#36B9E0; }
    .sp-bild { flex:1; min-height:130px; display:grid; place-items:center; margin:4px -6px 0; cursor:pointer; } .sp-bild svg { width:100%; height:100%; max-height:200px; overflow:visible; }
    .sp-temp { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-top:4px; }
    .sp-tnu { font-size:46px; font-weight:300; letter-spacing:-.05em; line-height:.9; } .sp-tnu sup { font-size:.45em; color:var(--tf); vertical-align:top; position:relative; top:.2em; }
    .sp-sub span { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .sp-sub { display:flex; align-items:center; gap:4px; margin-top:7px; font-size:12px; font-weight:700; color:var(--dim); }
    .sp-steg { display:flex; align-items:center; gap:4px; background:var(--yta2); border-radius:14px; padding:4px; flex:none; }
    .sp-steg button { width:32px; height:32px; border-radius:10px; display:grid; place-items:center; background:color-mix(in srgb, var(--text) 6%, transparent); }
    .sp-steg button.golv { opacity:.35; }
    .sp-kh { display:flex; align-items:center; gap:6px; min-width:0; } .sp-inst { width:30px; height:30px; flex:none; border-radius:10px; display:grid; place-items:center; color:var(--dim); background:var(--yta2); }
    .sp-inst:active { transform:scale(.9); }
    .sp-steg b { min-width:46px; text-align:center; font-size:14px; font-weight:800; } .sp-steg small { display:block; font-size:9.5px; color:var(--dim); font-weight:700; letter-spacing:.06em; text-transform:uppercase; }
    .sp-varm { height:5px; border-radius:9px; background:var(--yta2); margin-top:12px; overflow:hidden; } .sp-varm i { display:block; height:100%; border-radius:9px; background:linear-gradient(90deg, #F0A54A, #E8694A); transition:width 1s; }
    .sp-knappar { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:6px; margin-top:12px; }
    .sp-knappar button { display:flex; flex-direction:column; align-items:center; gap:3px; padding:9px 4px; border-radius:14px; background:var(--yta2); color:var(--dim); font-size:12px; font-weight:800; transition:transform .2s, background .3s; }
    .sp-knappar button:active { transform:scale(.95); } .sp-knappar button.pa { background:color-mix(in srgb, #36B9E0 16%, transparent); color:#36B9E0; }
    .sp-knappar button.pa[style] { background:color-mix(in srgb, var(--lf) 18%, transparent); color:var(--lf); } .sp-knappar button:disabled { opacity:.4; }
    .sp-farger { display:flex; justify-content:center; gap:9px; margin-top:9px; } .sp-farger button { width:22px; height:22px; border-radius:50%; box-shadow:inset 0 0 0 2px rgba(255,255,255,.15); }
    .sp-lagen { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:5px; margin-top:8px; }
    .sp-lagen button { min-width:0; display:flex; align-items:center; justify-content:center; gap:6px; padding:9px 4px; border-radius:12px; font-size:12.5px; font-weight:800; color:var(--svag); box-shadow:inset 0 0 0 1px var(--rad); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .sp-lagen button.pa { color:var(--text); background:var(--yta2); box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--text) 14%, transparent); }
    .sp-lagen button.pa > ha-icon { color:#36B9E0; } .sp-lagen button.pa[data-v*='way'] > ha-icon, .sp-lagen button.pa[data-v*='orta'] > ha-icon { color:var(--dim); }
    .sp-planknapp { display:flex; align-items:center; justify-content:center; gap:6px; margin-top:8px; padding:9px; border-radius:12px; font-size:12.5px; font-weight:800; color:var(--acc); box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--acc) 35%, transparent); }
    .sp-plan { margin-top:10px; padding:10px 12px; border-radius:16px; background:linear-gradient(90deg, color-mix(in srgb, #F0A54A 12%, transparent), color-mix(in srgb, #36B9E0 12%, transparent)); }
    .sp-plan-t { display:flex; align-items:center; gap:6px; font-size:12.5px; font-weight:800; } .sp-plan-t > ha-icon { color:var(--acc); } .sp-plan-t span { flex:1; min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .sp-plan-t button { width:28px; height:28px; display:grid; place-items:center; border-radius:9px; color:var(--dim); background:color-mix(in srgb, var(--text) 7%, transparent); }
    .sp-tl { position:relative; height:4px; border-radius:9px; background:color-mix(in srgb, var(--text) 9%, transparent); margin:12px 2px 5px; }
    .sp-tl i { position:absolute; top:0; bottom:0; border-radius:9px; } .sp-tl i.v { background:color-mix(in srgb, #5FD39A 55%, transparent); } .sp-tl i.h { background:linear-gradient(90deg, #F0A54A, #36B9E0); }
    .sp-tl em { position:absolute; top:-4px; width:12px; height:12px; margin-left:-6px; border-radius:50%; background:var(--text); box-shadow:0 0 0 3px var(--yta); }
    .sp-tl-l { display:flex; justify-content:space-between; font-size:10.5px; font-weight:800; color:var(--dim); }
    .sp-anga path { animation:spanga 5s ease-in-out infinite; transform-box:fill-box; transform-origin:50% 100%; opacity:0; } .sp-anga path:nth-child(2) { animation-delay:1.6s; } .sp-anga path:nth-child(3) { animation-delay:3.2s; }
    @keyframes spanga { 0% { opacity:0; transform:translateY(8px) scaleY(.7); } 30% { opacity:.55; } 100% { opacity:0; transform:translateY(-22px) scaleY(1.15); } }
    .sp-bubbla { animation:spbubbla 2.2s ease-in infinite; transform-box:fill-box; transform-origin:center; }
    @keyframes spbubbla { 0% { opacity:0; transform:translateY(3px) scale(.4); } 30% { opacity:.9; } 100% { opacity:0; transform:translateY(-6px) scale(1.1); } }
    .sp-krus { animation:spkrus 3.4s ease-out infinite; transform-box:fill-box; transform-origin:center; } @keyframes spkrus { 0% { opacity:.6; transform:scale(.6); } 100% { opacity:0; transform:scale(1.5); } }
    .sp-glitter { animation:spglitter 4s ease-in-out infinite alternate; } @keyframes spglitter { to { opacity:.25; transform:translateX(6px); } }
    .sp-led { animation:spled 2s ease-in-out infinite; } @keyframes spled { 50% { opacity:.45; } }
    .enh .produkt.spa { right:-3%; top:26%; height:46%; max-width:74%; overflow:visible; } .enheter.fyra .enh .produkt.spa { top:30%; height:38%; max-width:80%; }
    .hhlay { display:grid; grid-template-columns:repeat(var(--hhk, 3), minmax(0, 1fr)); grid-template-rows:minmax(0, 1.2fr) minmax(0, 1fr); gap:var(--gap); }
    .temaval { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:8px; flex:none; }
    .tv { padding:8px 6px; border-radius:16px; background:var(--yta2); text-align:center; box-shadow:inset 0 0 0 1.5px transparent; transition:box-shadow .3s, transform .3s var(--fjader); min-width:0; }
    .tv:active { transform:scale(.95); } .tv.pa { box-shadow:inset 0 0 0 1.5px var(--acc); }
    .tv-p { display:block; height:30px; border-radius:10px; margin-bottom:6px; background:linear-gradient(135deg, var(--a) 56%, var(--b) 56%); box-shadow:inset 0 0 0 1px rgba(128,128,128,.25); }
    .tv b { display:block; font-size:12.5px; font-weight:800; } .tv small { display:block; font-size:10.5px; color:var(--dim); font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .srv-ringar { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:6px; }
    .srv-r { display:grid; justify-items:center; gap:4px; cursor:pointer; } .srv-r > span { font-size:11.5px; color:var(--dim); font-weight:800; }
    .srv-ring { position:relative; width:min(74px, 100%); aspect-ratio:1; } .srv-ring svg { width:100%; height:100%; transform:rotate(-90deg); } .srv-ring circle { fill:none; stroke-width:4.5; transition:stroke-dashoffset .8s var(--ease); }
    .srv-ring b { position:absolute; inset:0; display:grid; place-items:center; font-size:19px; font-weight:400; letter-spacing:-.04em; } .srv-ring b small { font-size:11px; color:var(--dim); margin-left:1px; }
    .srv-ring b { grid-auto-flow:column; align-content:center; justify-content:center; align-items:baseline; }
    .srv-rader { margin-top:12px; } .srv-rad { display:flex; align-items:center; gap:8px; padding:8px 2px; border-top:1px solid var(--rad); font-size:12.5px; font-weight:700; color:var(--dim); }
    .srv-rad span { flex:1; } .srv-rad b { color:var(--text); font-weight:800; }
    .busskort { display:flex; flex-direction:column; } .buss-in { flex:1; min-height:0; overflow:hidden; }
    .buss-topp { display:flex; align-items:center; gap:12px; }
    .buss-linje { min-width:46px; height:46px; padding:0 10px; border-radius:15px; display:grid; place-items:center; background:var(--acc); color:var(--acc-ink); font-size:21px; font-weight:800; letter-spacing:-.03em; box-shadow:0 10px 20px -12px var(--acc); }
    .buss-topp b { display:block; font-size:15.5px; font-weight:800; } .buss-topp small { font-size:12px; color:var(--dim); font-weight:700; }
    .buss-tid { display:flex; align-items:baseline; gap:10px; margin:8px 0 0; } .buss-tid b { font-size:38px; font-weight:300; letter-spacing:-.05em; line-height:1; } .buss-tid span { font-size:12.5px; font-weight:800; }
    .buss-sen { font-size:12.5px; color:var(--dim); font-weight:700; }
    .buss-in { display:flex; flex-direction:column; } .buss-tid span { color:var(--dim); }
    .buss-kv { display:grid; grid-template-columns:repeat(auto-fit, minmax(70px, 1fr)); gap:6px; margin-top:auto; padding-top:8px; }
    .buss-kv > div { padding:6px 10px; border-radius:14px; background:var(--yta2); } .buss-kv span { display:block; font-size:11px; color:var(--dim); font-weight:800; white-space:nowrap; }
    .buss-kv b { font-size:16px; font-weight:700; letter-spacing:-.02em; white-space:nowrap; }
    .buss-form { display:flex; gap:6px; align-items:center; margin-top:10px; flex:none; }
    .buss-form label { flex:1; min-width:0; display:flex; align-items:center; gap:6px; padding:0 10px; height:42px; border-radius:14px; background:var(--yta2); color:var(--dim); }
    .buss-form input { flex:1; min-width:0; border:0; background:none; font:inherit; font-weight:800; font-size:16px; color:var(--text); outline:none; color-scheme:light dark; }
    .buss-form .knapp { padding:10px 12px; } .buss-test { background:var(--yta2); }
    .buss-st { margin-top:10px; flex:none; }
    .bp { display:grid; gap:6px; } .busskort .kh { margin-bottom:8px; }
    .bp-nasta { display:flex; align-items:center; gap:8px; width:100%; padding:9px 12px; border-radius:14px; background:color-mix(in srgb, var(--acc) 14%, transparent); color:var(--acc); text-align:left; }
    .bp-nasta span { flex:1; min-width:0; font-size:12.5px; font-weight:800; color:var(--text); } .bp-nasta small { display:block; font-size:11px; font-weight:800; color:var(--dim); }
    .bp-rad { display:flex; align-items:center; gap:6px; } .bp-l { font-size:11.5px; font-weight:800; color:var(--dim); margin-bottom:-2px; }
    .bp-test { font-size:11.5px; font-weight:800; color:var(--acc); text-decoration:underline; text-underline-offset:2px; }
    .bp-st { width:32px; height:32px; flex:none; border-radius:50%; display:grid; place-items:center; background:var(--yta2); } .bp-st:active { transform:scale(.88); }
    .bp-tid { font-size:17px; font-weight:800; letter-spacing:-.02em; min-width:48px; text-align:center; }
    .bp-rad .knapp { padding:8px 11px; } .bp-ok { margin-left:auto; }
    .buss-tips { display:flex; gap:6px; font-size:11.5px; color:var(--dim); font-weight:700; line-height:1.35; }
    .buss-p-aktiv { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:16px; background:color-mix(in srgb, var(--acc) 15%, transparent); color:var(--acc); }
    .buss-p-aktiv > div { flex:1; min-width:0; color:var(--text); } .buss-p-aktiv b { display:block; font-size:13px; font-weight:800; } .buss-p-aktiv small { font-size:11.5px; color:var(--dim); font-weight:700; }
    .buss-p-aktiv button { font-size:12px; font-weight:800; color:var(--acc); white-space:nowrap; }
    @media not all and (min-width:1000px) and (min-height:580px) {
      .hhlay { display:flex; flex-direction:column; }
      .hk-vaxt { order:1; } .hk-buss { order:2; } .hk-damm { order:3; } .hk-kaffe { order:4; } .hk-todo { order:5; } .hk-kal { order:6; } .hk-server { order:7; } .hk-inst { order:8; }
      .hhlay .hh-bild { min-height:0; height:140px; flex:none; } .hhlay .sp-bild { flex:none; height:170px; } .hhlay .hh-bild .produkt { height:120px; }
    }
    .hh { display:flex; flex-direction:column; height:100%; }
    .dam-val { display:flex; gap:6px; margin:-4px 0 10px; overflow-x:auto; scrollbar-width:none; flex:none; }
    .dam-val button { flex:none; display:flex; align-items:center; gap:6px; padding:6px 12px; border-radius:999px; background:var(--yta2); font-size:12.5px; font-weight:800; color:var(--dim); transition:all .3s var(--ease); }
    .dam-val button.pa { background:var(--text); color:var(--yta); }
    .dam-val i { width:7px; height:7px; border-radius:50%; background:var(--acc); animation:glod 1.6s ease-in-out infinite; }
    .hh-bild { position:relative; flex:1; min-height:110px; display:grid; place-items:center; margin:0 0 12px; border-radius:20px; background:var(--yta2); overflow:hidden; }
    .hh-bild .produkt { width:auto; height:86%; max-width:72%; max-height:180px; }
    .drycker { display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:6px; }
    .dryck { display:flex; flex-direction:column; align-items:center; gap:5px; padding:10px 2px; border-radius:14px; background:var(--yta2); font-size:11.5px; font-weight:800; color:var(--dim);
      transition:all .35s var(--fjader); }
    .dryck:active { transform:scale(.93); } .dryck.bekrafta { background:var(--acc); color:var(--acc-ink); animation:puls 1s ease-in-out infinite; } .dryck:disabled { opacity:.35; }
    .batt { height:6px; border-radius:3px; background:var(--yta3); overflow:hidden; flex:1; } .batt i { display:block; height:100%; border-radius:3px; }
    .knapprad { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
    .vx { display:grid; grid-template-columns:auto minmax(0, 1fr) auto; gap:12px; align-items:center; padding:7px 0; border-top:1px solid var(--rad); cursor:pointer; }
    .vx:first-child { border-top:0; }
    .vx svg.ring { width:40px; height:40px; transform:rotate(-90deg); } .vx circle { fill:none; stroke-width:8; }
    .vx b { font-size:14px; font-weight:800; display:block; } .vx small { font-size:12px; color:var(--dim); font-weight:700; } .vx .p { font-size:18px; font-weight:500; }
    .hand { display:grid; grid-template-columns:46px 3px minmax(0, 1fr); gap:12px; align-items:center; padding:7px 0; }
    .hand .t { font-size:12.5px; color:var(--dim); font-weight:800; } .hand .s { width:3px; height:30px; border-radius:2px; }
    .hand b { display:block; font-size:14px; font-weight:800; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; } .hand small { font-size:12px; color:var(--dim); font-weight:700; }
    .dag-r { font-size:10.5px; letter-spacing:.12em; text-transform:uppercase; color:var(--svag); margin:8px 0 2px; font-weight:800; }
    .ti { display:flex; align-items:center; gap:12px; padding:8px 0; width:100%; font-size:14px; font-weight:700; }
    .box { flex:none; width:22px; height:22px; border-radius:8px; border:1.5px solid var(--svag); display:grid; place-items:center; transition:all .3s var(--fjader); }
    .ti.klar .box { background:var(--acc); border-color:var(--acc); color:var(--acc-ink); } .ti.klar span { text-decoration:line-through; color:var(--svag); }
    .todo-ny { display:flex; align-items:center; gap:10px; margin-top:8px; padding:0 14px; height:44px; border-radius:14px; background:var(--yta2); color:var(--svag); flex:none; }
    .todo-ny input { flex:1; min-width:0; background:none; border:0; outline:none; color:var(--text); font:700 14px 'Manrope',sans-serif; }
    .rensa { font-size:12.5px; color:var(--svag); padding:6px 0; font-weight:800; }
    .bat { display:grid; grid-template-columns:minmax(0, 1fr) 80px 44px; gap:12px; align-items:center; padding:7px 0; font-size:13.5px; font-weight:700; cursor:pointer; }
    .bat span { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; } .bat b { text-align:right; }
    .lankar { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:8px; flex:none; }
    .lank { display:flex; align-items:center; gap:10px; padding:9px; border-radius:16px; background:var(--yta2); font-size:12.5px; font-weight:800; transition:transform .3s var(--fjader); }
    .lank:active { transform:scale(.95); }
    .lank-ik { width:32px; height:32px; flex:none; border-radius:11px; display:grid; place-items:center; background:var(--yta); color:var(--lc); }
    .flex-kol { display:flex; flex-direction:column; min-height:0; } .flex-kol > .rull-y { flex:1; min-height:0; }

    @media (prefers-reduced-motion: reduce) { .aura *, .aura *::before, .aura *::after { animation:none !important; transition:none !important; } }`;
  };

  // ═════════════ Data ═════════════
  A.prognos = (id, typ) => {
    if (!id || !S(id)) return [];
    const nyck = id + '|' + typ;
    if (!A.vaderSub[nyck]) {
      A.vaderSub[nyck] = true;
      A.hass.connection.subscribeMessage(m => { A.vader[nyck] = m.forecast || []; A.patchaSnart(); },
        { type: 'weather/subscribe_forecast', forecast_type: typ, entity_id: id }).catch(() => { A.vader[nyck] = []; });
    }
    return A.vader[nyck] || [];
  };
  A.hamtaKal = async (ids) => {
    const k = ids.join(','), c = A.kal[k];
    if (!ids.length || (c && (c.laddar || Date.now() - c.t < 5 * 60e3))) return;
    A.kal[k] = Object.assign({}, c, { laddar: true, t: Date.now() });
    try {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const slut = new Date(start); slut.setDate(slut.getDate() + 2);
      const r = await A.hass.callService('calendar', 'get_events', { start_date_time: start.toISOString(), end_date_time: slut.toISOString() }, { entity_id: ids }, false, true);
      const svar = (r && r.response) || {}, lst = [];
      ids.forEach((id, i) => ((svar[id] && svar[id].events) || []).forEach(e =>
        lst.push({ farg: PALETT[i % PALETT.length], titel: e.summary, plats: e.location, start: e.start, slut: e.end, heldag: !String(e.start).includes('T') })));
      lst.sort((a, b) => new Date(a.start) - new Date(b.start));
      A.kal[k] = { lista: lst, t: Date.now() };
    } catch (e) { A.kal[k] = { lista: [], fel: true, t: Date.now() }; }
    A.patchaSnart();
  };
  A.hamtaTodo = (id) => {
    if (!id || A.todoSub[id]) return;
    A.todoSub[id] = true;
    A.hass.connection.subscribeMessage(m => { A.todo[id] = m.items || []; A.patchaSnart(); }, { type: 'todo/item/subscribe', entity_id: id })
      .catch(async () => {
        try { const r = await A.hass.callWS({ type: 'todo/item/list', entity_id: id }); A.todo[id] = r.items || []; } catch (e) { A.todo[id] = []; }
        A.todoSub[id] = false; A.patchaSnart();
      });
  };
  A.todoUppd = async (id) => {
    if (A.todoSub[id] === true) return;
    try { const r = await A.hass.callWS({ type: 'todo/item/list', entity_id: id }); A.todo[id] = r.items || []; } catch (e) {}
    A.patchaSnart();
  };
  A.todoNy = async (falt) => {
    const t = (falt.value || '').trim(), id = A.k && A.k.attGora;
    if (!t || !id) return;
    falt.value = '';
    await A.tj('todo', 'add_item', { entity_id: id, item: t });
    A.todoUppd(id);
  };
  A.elData = (k) => {
    const s = S(k.el);
    if (!s) return null;
    // Timpriserna kan ligga i olika attribut beroende på integration (Tibber, Tibber Prices, Nordpool …)
    const NYCKLAR = ['data', 'today', 'tomorrow', 'prices', 'raw_today', 'raw_tomorrow', 'prices_today', 'prices_tomorrow', 'today_prices', 'tomorrow_prices', 'price_info', 'priceInfo', 'intervals', 'forecast'];
    const plocka = (a) => {
      let ut = [];
      const ta = (v) => { if (Array.isArray(v)) ut = ut.concat(v); else if (v && typeof v === 'object') ['today', 'tomorrow', 'data', 'prices'].forEach(n => Array.isArray(v[n]) && (ut = ut.concat(v[n]))); };
      NYCKLAR.forEach(n => ta(a[n]));
      return ut;
    };
    let raw = plocka(s.attributes);
    if (!raw.length && k.elPrefix) {
      // Leta upp en annan sensor från samma hem som har timpriserna
      const id = Object.keys(A.hass.states).find(x => x.startsWith(`sensor.${k.elPrefix}`) && plocka(A.hass.states[x].attributes).length);
      if (id) raw = plocka(A.hass.states[id].attributes);
    }
    const tid = (x) => x.start_time ?? x.startsAt ?? x.starts_at ?? x.start ?? x.startTime ?? x.time ?? x.datetime ?? x.from;
    const varde = (x) => x.price_per_kwh ?? x.total ?? x.price ?? x.value ?? x.price_total ?? x.energy;
    const sett = new Set();
    const pts = raw.map(x => ({ t: new Date(tid(x)), p: parseFloat(varde(x)) }))
      .filter(x => !isNaN(x.t) && !isNaN(x.p) && !sett.has(+x.t) && sett.add(+x.t)).sort((a, b) => a.t - b.t);
    // Öre/kWh → kr/kWh
    if (pts.length && Math.max(...pts.map(x => x.p)) > 20) pts.forEach(x => { x.p = x.p / 100; });
    const nu = new Date(), d0 = new Date(nu); d0.setHours(0, 0, 0, 0);
    const timmar = [];
    for (let h = 0; h < 48; h++) {
      const fr = new Date(d0.getTime() + h * 36e5), till = new Date(fr.getTime() + 36e5);
      const v = pts.filter(x => x.t >= fr && x.t < till).map(x => x.p);
      if (v.length) timmar.push({ t: fr, p: v.reduce((a, b) => a + b, 0) / v.length, h: fr.getHours(), dag: h < 24 ? 0 : 1, i: h });
    }
    const aktuell = [...pts].reverse().find(x => x.t <= nu), nuIdx = nu.getHours();
    let pris = aktuell ? aktuell.p : (timmar.find(x => x.i === nuIdx) || {}).p;
    if (pris == null) { const v = parseFloat(s.state); pris = isNaN(v) ? null : v; }
    const forra = (timmar.find(x => x.i === nuIdx - 1) || {}).p;
    const niva = pris == null ? '' : pris < k.billig ? 'ok' : pris <= k.dyr ? 'varn' : 'fel';
    const idag = timmar.filter(x => x.dag === 0).map(x => x.p);
    const fram = timmar.filter(x => x.i >= nuIdx);
    let basta = null;
    for (let i = 0; i + 2 < fram.length; i++) {
      if (fram[i + 2].i - fram[i].i !== 2) continue;
      const snitt = (fram[i].p + fram[i + 1].p + fram[i + 2].p) / 3;
      if (!basta || snitt < basta.p) basta = { p: snitt, fr: fram[i], i: fram[i].i };
    }
    const dyrast = fram.reduce((a, x) => !a || x.p > a.p ? x : a, null);
    const tidTxt = (x, n = 1) => `${x.dag ? 'imorgon ' : ''}${String(x.h).padStart(2, '0')}–${String((x.h + n) % 24).padStart(2, '0')}`;
    const ut = {
      nu: pris, forra, niva, nivaTxt: { ok: 'Billigt', varn: 'Normalpris', fel: 'Dyrt' }[niva] || '–', timmar, nuIdx, fram,
      min: idag.length ? Math.min(...idag) : null, max: idag.length ? Math.max(...idag) : null, snitt: idag.length ? idag.reduce((a, b) => a + b, 0) / idag.length : null,
      imorgon: timmar.some(x => x.dag === 1), basta: basta && Object.assign(basta, { txt: tidTxt(basta.fr, 3) }), dyrast: dyrast && Object.assign({}, dyrast, { txt: tidTxt(dyrast) }),
      manad: tal(`sensor.${k.elPrefix}_manadskostnad`) ?? tal(`sensor.${k.elPrefix}_manatlig_kostnad`)
    };
    // Dagens/morgondagens toppar och dalar
    const idagT = timmar.filter(x => x.dag === 0), morgT = timmar.filter(x => x.dag === 1);
    const ext = (l, f) => l.length ? l.reduce((a, x) => f(x.p, a.p) ? x : a) : null;
    ut.minT = ext(idagT, (a, b) => a < b); ut.maxT = ext(idagT, (a, b) => a > b);
    if (morgT.length) { ut.imorgonSnitt = morgT.reduce((a, x) => a + x.p, 0) / morgT.length; ut.imorgonMin = ext(morgT, (a, b) => a < b); ut.imorgonMax = ext(morgT, (a, b) => a > b); }
    if (pris != null && ut.snitt) ut.motSnitt = (pris - ut.snitt) / ut.snitt * 100;
    // Förbrukning (Tibber Pulse, P1-mätare …) – egna sensorer eller Tibbers standardnamn via _el_prefix
    const p = k.elPrefix, forst = (...ids) => ids.find(id => id && S(id) && tal(id) != null);
    const eE = forst(k.elEffekt, p && `sensor.${p}_power`, p && `sensor.${p}_effekt`, p && `sensor.${p}_aktuell_effekt`);
    const eK = forst(k.elIdagKwh, p && `sensor.${p}_accumulated_consumption`, p && `sensor.${p}_ackumulerad_forbrukning`);
    const eC = forst(k.elIdagKr, p && `sensor.${p}_accumulated_cost`, p && `sensor.${p}_ackumulerad_kostnad`);
    ut.effekt = eE ? kw(eE) : null; ut.idagKwh = eK ? kw(eK) : null; ut.idagKr = eC ? tal(eC) : null;
    if (ut.effekt != null && pris != null) ut.krTim = ut.effekt * pris;
    if (ut.manad != null) { const n = new Date(), dagar = new Date(n.getFullYear(), n.getMonth() + 1, 0).getDate(), gatt = n.getDate() - 1 + (n.getHours() + n.getMinutes() / 60) / 24;
      if (gatt >= 1) ut.manadPrognos = ut.manad / gatt * dagar; }
    // Vad kostar det att köra en maskin nu, jämfört med bästa starttid?
    const bastN = (n) => { let b = null; for (let i = 0; i + n - 1 < fram.length; i++) { const w = fram.slice(i, i + n); if (w[n - 1].i - w[0].i !== n - 1) continue;
      const p = w.reduce((s, x) => s + x.p, 0) / n; if (!b || p < b.p) b = { p, fr: w[0], n }; } return b; };
    ut.fonster = [1, 3, 6].map(bastN).filter(Boolean).map(b => Object.assign(b, { txt: tidTxt(b.fr, b.n) }));
    ut.apparater = (k.apparater || []).map(a => {
      const n = Math.max(1, Math.round(a.timmar)), snitt = (i) => { const w = fram.slice(i, i + n); return w.length === n && w[n - 1].i - w[0].i === n - 1 ? w.reduce((s, x) => s + x.p, 0) / n : null; };
      const nuP = snitt(0); let best = null;
      for (let i = 0; i < fram.length; i++) { const v = snitt(i); if (v != null && (!best || v < best.p)) best = { p: v, x: fram[i] }; }
      return nuP == null ? null : Object.assign({}, a, { nu: nuP * a.kwh, bast: best ? best.p * a.kwh : nuP * a.kwh, kl: best && best.x, spar: best ? (nuP - best.p) * a.kwh : 0 });
    }).filter(Boolean);
    return ut;
  };
  const elFarg = (p, k) => p < k.billig ? 'var(--ok)' : p <= k.dyr ? 'var(--varn)' : 'var(--fel)';
  A.spelarLista = (k) => {
    if (k.spelare.length) return k.spelare.filter(id => S(id));
    const reg = A.hass.entities || {}, ma = Object.keys(reg).filter(id => id.startsWith('media_player.') && reg[id].platform === 'music_assistant' && S(id));
    return ma.length ? ma : Object.keys(A.hass.states).filter(id => id.startsWith('media_player.') && !ej(S(id)));
  };
  A.valdSpelare = (k) => {
    const l = A.spelarLista(k);
    if (l.includes(A.spelare)) return A.spelare;
    return l.find(id => S(id).state === 'playing') || l[0] || '';
  };

  // ───────────── Music Assistant: sök, bibliotek, kö och byte av låt ─────────────
  A.maEntry = async () => {
    if (A.maId) return A.maId;
    const e = await A.hass.callWS({ type: 'config_entries/get', domain: 'music_assistant' });
    A.maId = e && e[0] && e[0].entry_id;
    return A.maId;
  };
  A.maSvar = async (tj, data) => {
    const r = await A.hass.callService('music_assistant', tj, Object.assign({ config_entry_id: await A.maEntry() }, data), undefined, false, true);
    return (r && r.response) || {};
  };
  A.radNyckel = (r) => `${r.typ}|${r.sortering || ''}|${r.favorit ? 1 : 0}`;
  A.hamtaRad = async (r) => {
    const n = A.radNyckel(r), c = A.bib[n];
    if (c && (c.laddar || Date.now() - c.t < 15 * 60e3)) return;
    A.bib[n] = Object.assign({}, c, { laddar: true, t: Date.now() });
    const fraga = async (extra) => (await A.maSvar('get_library', Object.assign({ media_type: r.typ, limit: r.antal || 20 }, extra))).items || [];
    try {
      const extra = {};
      if (r.favorit) extra.favorite = true;
      if (r.sortering) extra.order_by = r.sortering;
      let items;
      try { items = await fraga(extra); } catch (e) { delete extra.order_by; items = await fraga(extra); }
      if (!items.length && r.favorit) items = await fraga({}).catch(() => []);
      A.bib[n] = { items, t: Date.now() };
    } catch (e) { A.bib[n] = { items: [], fel: true, t: Date.now() }; }
    A.patchaSnart();
  };
  A.sokNu = async (text) => {
    text = (text || '').trim();
    if (!text) { A.sok = null; if (A.mflik === 'sok') A.mflik = 'bib'; return A.patchaAlla(); }
    A.sok = { text, laddar: true }; A.mflik = 'sok'; A.patchaAlla();
    try {
      const r = await A.maSvar('search', { name: text, limit: 12 });
      if (A.sok && A.sok.text === text) A.sok = { text, r };
    } catch (e) { if (A.sok && A.sok.text === text) A.sok = { text, fel: (e && e.message) || 'fel' }; }
    A.patchaAlla();
  };
  A.sokSnart = (falt) => { clearTimeout(A._sokT); A._sokT = setTimeout(() => A.sokNu(falt.value), 450); };
  // Bilder från Music Assistant: välj en som går att nå utifrån (Spotify, Tidal …), inte en lokal sökväg
  A.bildAv = (it) => {
    if (!it) return '';
    if (typeof it.image === 'string') return it.image;
    const im = [].concat(it.image && it.image.path ? [it.image] : [], (it.metadata && it.metadata.images) || []);
    const b = im.find(x => x && x.remotely_accessible && /^https?:/.test(x.path)) || im.find(x => x && /^(https?:|\/)/.test(x.path || ''));
    return b ? b.path : '';
  };
  // Omslag för en mediaspelare. Lokala adresser (t.ex. Music Assistant på 192.168.x.x) går inte att nå hemifrån,
  // så då hämtas bilden via Home Assistants egen bildproxy i stället – den fungerar överallt där HA fungerar.
  const PRIVAT = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|\[?fe80|.*\.local$|[^.]+$)/i;
  A.mpBild = (id) => {
    const s = S(id), a = s && s.attributes, p = a && a.entity_picture;
    if (!p) return '';
    if (p.startsWith('/')) return p;
    try { const u = new URL(p); if (u.origin === location.origin || (u.protocol === 'https:' && !PRIVAT.test(u.hostname))) return p; } catch (e) {}
    return a.access_token ? `/api/media_player_proxy/${id}?token=${a.access_token}&cache=${encodeURIComponent(p.slice(-48))}` : p;
  };
  A.spelaUri = async (el, enqueue = 'replace') => {
    const k = A.k, id = A.valdSpelare(k), d = el.dataset;
    if (!id) return A.meddela('Välj en högtalare först');
    el.classList.add('laddar');
    const data = { entity_id: id, media_id: d.uri, enqueue };
    if (d.typ) data.media_type = d.typ;
    try {
      await A.hass.callService('music_assistant', 'play_media', data, undefined, false);
      A.meddela(enqueue === 'add' ? `${d.namn} lades i kön` : `Spelar ${d.namn}`);
      if (enqueue === 'replace' && (d.typ === 'playlist' || d.typ === 'album')) {
        A.kalla[id] = { uri: d.uri, typ: d.typ, namn: d.namn, bild: d.bild || '', under: d.under || '' };
        minne('kalla', JSON.stringify(A.kalla));
      }
    } catch (e) {
      try { await A.hass.callService('media_player', 'play_media', { entity_id: id, media_content_id: d.uri, media_content_type: d.typ || 'music', enqueue }, undefined, false); }
      catch (e2) { A.meddela('Kunde inte spela: ' + ((e2 && e2.message) || 'okänt fel')); }
    }
    el.classList.remove('laddar');
    A.patchaSnart();
  };
  A.hamtaSpar = async (kl) => {
    const c = A.spar[kl.uri];
    if (c && (c.laddar || Date.now() - c.t < 10 * 60e3)) return;
    A.spar[kl.uri] = { laddar: true, t: Date.now(), items: c && c.items };
    try {
      const r = await A.hass.callWS({ type: 'media_player/browse_media', entity_id: A.valdSpelare(A.k), media_content_id: kl.uri, media_content_type: kl.typ });
      A.spar[kl.uri] = { items: ((r && r.children) || []).filter(x => x.media_content_id).map(x => ({ uri: x.media_content_id, namn: String(x.title || '').replace(/^\d+\.\s+/, ''), bild: x.thumbnail || '' })), t: Date.now() };
    } catch (e) { A.spar[kl.uri] = { fel: true, items: [], t: Date.now() }; }
    A.patchaSnart();
  };
  A.spelaLat = async (i, kl) => {
    const id = A.valdSpelare(A.k), d = kl && A.spar[kl.uri];
    if (!d || !d.items || !d.items[i]) return;
    const lat = d.items[i];
    A.vantar = { id, uri: lat.uri, namn: lat.namn, t: Date.now() };
    A.patchaSnart();
    const anrop = (dom, tj, data) => Promise.race([A.hass.callService(dom, tj, data, undefined, false), new Promise((_, nej) => setTimeout(() => nej(new Error('inget svar')), 15000))]);
    const satt = [
      async () => { await anrop('music_assistant', 'play_media', { entity_id: id, media_id: lat.uri, media_type: 'track', enqueue: 'next' }); await new Promise(r => setTimeout(r, 150)); await anrop('media_player', 'media_next_track', { entity_id: id }); },
      () => anrop('music_assistant', 'play_media', { entity_id: id, media_id: lat.uri, media_type: 'track', enqueue: 'replace' }),
      () => anrop('media_player', 'play_media', { entity_id: id, media_content_id: lat.uri, media_content_type: 'music', enqueue: 'play' })
    ];
    for (const f of satt) { try { await f(); return; } catch (e) {} }
    A.vantar = null; A.meddela('Kunde inte byta låt'); A.patchaSnart();
  };
  A.hamtaKo = async (id) => {
    const s = S(id);
    if (!s || !A.arMA(id)) return;
    const nyckel = id + '|' + (s.attributes.media_content_id || s.attributes.media_title || '') + '|' + s.state;
    if (A.ko[id] && (A.ko[id].nyckel === nyckel || A.ko[id].laddar)) return;
    A.ko[id] = { laddar: true, nyckel };
    try {
      const r = await A.hass.callService('music_assistant', 'get_queue', {}, { entity_id: id }, false, true);
      const q = (r && r.response && (r.response[id] || Object.values(r.response)[0])) || {};
      A.ko[id] = { nasta: q.next_item || null, nyckel };
      // Albumet som spelas: från kön, annars sök på albumnamnet
      const mi = (q.current_item && q.current_item.media_item) || {}, al = mi.album;
      if (al && al.uri) A.album[id] = { uri: al.uri, typ: 'album', namn: al.name || s.attributes.media_album_name, bild: A.bildAv(al) || A.bildAv(mi) || A.mpBild(id), under: (mi.artists || []).map(x => x.name).join(', ') };
      else if (s.attributes.media_album_name && (!A.album[id] || A.album[id].namn !== s.attributes.media_album_name)) {
        try {
          const sv = await A.maSvar('search', { name: `${s.attributes.media_artist || ''} ${s.attributes.media_album_name}`.trim(), media_type: ['album'], limit: 3 });
          const a = (sv.albums || [])[0];
          if (a) A.album[id] = { uri: a.uri, typ: 'album', namn: a.name, bild: A.bildAv(a) || A.mpBild(id), under: (a.artists || []).map(x => x.name).join(', ') };
        } catch (e) {}
      }
    } catch (e) { A.ko[id] = { nasta: null, nyckel }; }
    A.patchaSnart();
  };

  // ═════════════ Smart förslag ═════════════
  // Ignorerade förslag sparas med en nyckel som ändras när läget ändras (t.ex. när dörren öppnas igen)
  A.ign = new Set((() => { try { return JSON.parse(minne('ign') || '[]'); } catch (e) { return []; } })());
  A.forslagLista = (k) => {
    const h = new Date().getHours(), dag = new Date().toDateString(), alla = A.allaLampor(k), tanda = alla.filter(id => A.ljus(id).on);
    const pers = Object.keys(A.hass.states).filter(id => id.startsWith('person.')), hemma = pers.filter(id => S(id).state === 'home').length;
    const L = S(k.larm), tid = (id) => Date.parse(S(id).state) || 0, sent = h >= 22 || h < 6 || !!(L && L.state.startsWith('armed'));
    const scener = k.scener.filter(s => S(s.e)), senast = scener.reduce((m, s) => Math.max(m, tid(s.e)), 0);
    const oppna = k.dorrar.concat(k.fonster).filter(id => S(id) && S(id).state === 'on');
    const torra = k.vaxter.filter(v => { const x = tal(v.sensor); return x != null && x < (+v.min || 30); });
    const el = k.el && A.elData(k), dam = k.dammar.map(x => S(x.e)).find(d => d && d.state === 'docked');
    const ut = [], add = (nyckel, f) => ut.push(Object.assign({ nyckel }, f));
    if (L && L.state === 'triggered') add('', { t: 'Larmet går!', s: 'Kontrollera kamerorna och larmet direkt.', knapp: 'Visa larmet', a: 'data-a="sida" data-v="sakerhet"' });
    const smhi = A.varningar(k);
    if (smhi && smhi.aktiv) { const x = smhi.lista[0] || {};
      add(`smhi:${x.titel || ''}:${x.start || dag}`, { t: `SMHI varnar${x.titel ? ': ' + x.titel : ''}`, s: x.text ? x.text.slice(0, 110) + (x.text.length > 110 ? ' …' : '') : 'Det finns en vädervarning för ditt område.', knapp: 'Visa vädret', a: 'data-a="sida" data-v="vader"' }); }
    const c = { h, dag, pers, hemma, L, scener, senast, el };
    A.merForslag(k, c, add, 1);
    // Morgon: tänd i vardagsrum, kök och hall när det är mörkt – sedan kaffemaskinen
    const mo = A.morgon(k);
    if (mo && mo.steg === 1) add(`morgon:${dag}`, { t: 'God morgon! Det är mörkt ute', s: `Tänd i ${mo.rum} innan du går ner?`, knapp: 'Ja, tänd', a: 'data-a="morgon"' });
    else if (mo && mo.steg === 2) add(`morgonkaffe:${dag}`, { t: 'Ljuset är tänt ☀️', s: 'Ska jag sätta på kaffemaskinen också?', knapp: 'Ja, sätt på kaffet', a: 'data-a="morgonkaffe"' });
    A.merForslag(k, c, add, 2);
    // Kvällsläge: efter t.ex. 22 en vardag – släck allt och stäng av tv:n efter en nedräkning
    const tvPa = A.kvallTv(k), kvallDag = new Date(Date.now() - (h < 4 ? 864e5 : 0)).getDay();
    const kvallNu = (h >= k.kvallKl || h < 4) && (k.kvallDagar === 'alla' || (kvallDag >= 1 && kvallDag <= 5));
    const vad = [tanda.length ? `${tanda.length} ${tanda.length === 1 ? 'lampa' : 'lampor'}` : '', tvPa.length ? tvPa.map(id => namn(id)).join(' och ') : ''].filter(Boolean).join(' och ');
    const gnL = k.gn ? A.gnLage(k) : A.kvall;
    if (gnL && gnL.slut) add('', { t: 'Godnatt-läge på', sHtml: `Släcker allt${tvPa.length && (!k.gn || A.gnVal.tv) ? ' och stänger av tv:n' : ''} om <b data-ned="${gnL.slut}"></b>.`, knapp: 'Avbryt', a: 'data-a="kvallav"' });
    else if (gnL) add('', { t: 'God natt!', s: 'Ljuset är dimmat och släcks strax.', knapp: 'Avbryt', a: 'data-a="kvallav"' });
    else if (kvallNu && vad) add(`kvall:${new Date(Date.now() - (h < 4 ? 864e5 : 0)).toDateString()}`, { t: 'Dags att runda av kvällen?', s: `${vad} är fortfarande på. Släck allt${tvPa.length ? ' och stäng av tv:n' : ''} om ${k.kvallMin} min?`, knapp: `Släck om ${k.kvallMin} min`, a: 'data-a="kvall"' });
    if (pers.length && !hemma && tanda.length) add(`borta:${pers.map(id => S(id).last_changed).sort().pop()}`, { t: 'Ingen är hemma', s: `Men ${tanda.length} ${tanda.length === 1 ? 'lampa är tänd' : 'lampor är tända'}. Vill du släcka?`, knapp: 'Släck allt', a: 'data-a="allaav"' });
    oppna.forEach(id => {
      const st = S(id), min = Math.max(0, Math.floor((Date.now() - Date.parse(st.last_changed)) / 6e4)), n = namn(id).replace(/\s*(öppning|kontakt|sensor|contact|opening)$/i, '');
      if (!sent && min < k.oppenMin) return;
      add(`oppen:${id}:${st.last_changed}`, { t: `${n} står öppen`, s: sent && min < k.oppenMin ? 'Det är sent – stäng innan du går och lägger dig.'
        : `Den har varit öppen i ${min < 60 ? min + ' min' : Math.floor(min / 60) + ' h ' + (min % 60) + ' min'}.${sent ? ' Det är sent – dags att stänga.' : ''}`, knapp: 'Visa', a: `data-a="info" data-e="${id}"` });
    });
    torra.forEach(v => add(`vaxt:${v.sensor}:${dag}`, { t: `${v.namn || namn(v.sensor)} behöver vatten`, s: `Jorden är nere på ${Math.round(tal(v.sensor))} % fukt.`, knapp: 'Visa växterna', a: 'data-a="sida" data-v="hushall"' }));
    if (h >= 18 && h < 23 && tanda.length && scener[0] && Date.now() - senast > 3 * 36e5) add(`varva:${dag}`, { t: 'Dags att varva ner', s: `Dämpa ljuset med scenen ${scener[0].namn || namn(scener[0].e)}.`, knapp: 'Aktivera', a: `data-a="scen" data-e="${scener[0].e}"` });
    if (h >= 23 && tanda.length) { const gn = scener.find(s => /natt/i.test((s.namn || '') + s.e));
      add(`natt:${dag}`, { t: 'God natt?', s: `${tanda.length} lampor är fortfarande tända.`, knapp: gn ? 'God natt' : 'Släck allt', a: gn ? `data-a="scen" data-e="${gn.e}"` : 'data-a="allaav"' }); }
    if (dam && pers.length && !hemma) add(`stada:${dag}`, { t: 'Passa på att städa', s: 'Ingen är hemma – perfekt läge för dammsugaren.', knapp: 'Starta', a: `data-a="tj" data-d="vacuum.start" data-e="${dam.entity_id}"` });
    if (el && el.basta && el.niva === 'varn') add(`el:${dag}:${el.basta.i}`, { t: `Billig el kl ${el.basta.txt}`, s: `Snittpris ${kr(el.basta.p)} kr/kWh – kör disk och tvätt då.`, knapp: 'Visa elpriset', a: 'data-a="sida" data-v="energi"' });
    A.merForslag(k, c, add, 3);
    // Ignorerade förslag och förslagstyper som stängts av med _forslag_av
    return ut.filter(f => !f.nyckel || (!A.ign.has(f.nyckel) && !k.forslagAv.includes(f.nyckel.split(':')[0])));
  };
  // ═════════════ Fler smarta förslag (del 1 = viktigast, 3 = minst brådskande) ═════════════
  A.merForslag = (k, c, add, del) => {
    const { h, dag, pers, hemma, L, scener, senast, el } = c, nu = Date.now(), idag = new Date();
    const sol = S('sun.sun'), solEl = sol ? sol.attributes.elevation : null, mork = sol ? sol.state === 'below_horizon' || (solEl != null && solEl < 4) : (h < 7 || h >= 18);
    const tim = k.vader && S(k.vader) ? A.prognos(k.vader, 'hourly') : [];
    const lista = (l) => l.length > 1 ? l.slice(0, -1).join(', ') + ' och ' + l[l.length - 1] : l[0] || '';
    const kortNamn = (id) => namn(id).replace(/\s*(öppning|kontakt|sensor|contact|opening)$/i, '');
    const forNamn = (id) => String(S(id).attributes.friendly_name || '').split(' ')[0];
    const senastHem = pers.filter(id => S(id).state === 'home').map(id => ({ id, t: Date.parse(S(id).last_changed) || 0 })).sort((a, b) => b.t - a.t)[0];
    const nyssHem = !!senastHem && nu - senastHem.t < 15 * 6e4;
    if (del === 1) {
      // Alla har gått – larmet är av
      if (L && L.state === 'disarmed' && pers.length && !hemma) {
        const gick = Math.max(...pers.map(id => Date.parse(S(id).last_changed) || 0)), a = L.attributes;
        if (nu - gick > 3 * 6e4) add(`larma:${gick}`, { t: 'Alla har gått hemifrån', s: 'Larmet är avslaget. Vill du larma huset i borta-läge?', knapp: 'Larma borta',
          a: `data-a="larm" data-v="alarm_arm_away" data-k="${a.code_arm_required && a.code_format ? 1 : 0}"` });
      }
      // Regn på väg och fönster står öppna
      const oppnaF = k.fonster.filter(id => S(id) && S(id).state === 'on');
      if (oppnaF.length && tim.length) {
        const vat = (f) => (f.precipitation || 0) >= 0.2 || /rain|pour|snow|hail|lightning/.test(f.condition || '');
        const r = tim.slice(0, 3).find(f => Date.parse(f.datetime) < nu + 2 * 36e5 && vat(f));
        if (r) { const redan = Date.parse(r.datetime) <= nu, fl = oppnaF.length > 1;
          add(`regnfonster:${dag}:${new Date(r.datetime).getHours()}`, { t: redan ? 'Det regnar – fönster står öppet' : 'Regn på väg',
            s: `${redan ? 'Det regnar' : `Regn väntas runt kl ${hh(new Date(r.datetime))}`} och ${lista(oppnaF.map(kortNamn))} står ${fl ? 'öppna' : 'öppet'}. Stäng innan det blir blött.`,
            knapp: 'Visa', a: `data-a="info" data-e="${oppnaF[0]}"` }); }
      }
      // Garage och markis (brådskande)
      A.portForslag(k).filter(f => f.prio === 1).forEach(f => add(f.nyckel, f));
      // Olåst dörr sent på kvällen eller när ingen är hemma
      const sent = h >= 22 || h < 6;
      if (sent || (pers.length && !hemma)) k.las.filter(id => S(id) && S(id).state === 'unlocked').forEach(id => add(`las:${id}:${S(id).last_changed}`, {
        t: `${namn(id)} är olåst`, s: sent ? 'Det är sent – lås innan du går och lägger dig.' : 'Ingen är hemma. Vill du låsa?', knapp: 'Lås', a: `data-a="tj" data-d="lock.lock" data-e="${id}"` }));
    } else if (del === 2) {
      A.varmeForslag(k).forEach(f => add(f.nyckel, f));
      // Solskydd, kväll och morgon för gardiner och rullgardiner
      A.portForslag(k).filter(f => f.prio === 2).forEach(f => add(f.nyckel, f));
      // Något i kalendern börjar snart
      const kids = (k.kalendrar.length ? k.kalendrar : Object.keys(A.hass.states).filter(id => id.startsWith('calendar.'))).filter(id => S(id));
      if (kids.length) { A.hamtaKal(kids); const kc = A.kal[kids.join(',')];
        const e = kc && kc.lista && kc.lista.find(e => !e.heldag && Date.parse(e.start) - nu > -5 * 6e4 && Date.parse(e.start) - nu < 60 * 6e4);
        if (e) { const min = Math.round((Date.parse(e.start) - nu) / 6e4);
          add(`kal:${e.titel}:${e.start}`, { t: min > 0 ? `Om ${min} min: ${e.titel}` : `Nu: ${e.titel}`, s: `Börjar kl ${hm(new Date(e.start))}${e.plats ? ' · ' + e.plats : ''}.`, knapp: 'Visa kalendern', a: 'data-a="sida" data-v="hushall"' }); }
      }
      // Bussen på vardagsmorgonen
      if (k.buss && idag.getDay() >= 1 && idag.getDay() <= 5 && h >= 6 && h < 9 && !A.bussP) {
        const d = A.bussData(k), m = d && d.avg.find(x => +x.t - nu > (d.gang + 2) * 6e4 && +x.t - nu < 45 * 6e4);
        if (m) { const om = Math.round((+m.t - nu) / 6e4);
          add(`buss:${dag}`, { t: `${d.linje ? 'Linje ' + d.linje : 'Bussen'} går ${hm(m.t)}`, s: `Mot ${d.riktning} – ${d.gang ? `gå om ${om - d.gang} min` : `om ${om} min`}. Vill du att högtalaren säger till när det är dags?`,
            knapp: 'Påminn mig', a: `data-a="bussforslag" data-v="${+m.t}"` }); }
      }
      // Välkommen hem när det är mörkt
      if (nyssHem && mork) {
        const rum = k.rum.filter(r => /hall|entr|kök|kok/i.test(r.namn)), hl = rum.flatMap(r => r.lampor.map(l => l.e)).filter(id => S(id) && !A.ljus(id).on);
        if (hl.length) add(`hem:${senastHem.id}:${senastHem.t}`, { t: `Välkommen hem${forNamn(senastHem.id) ? ', ' + forNamn(senastHem.id) : ''}!`,
          s: `Det är mörkt ute. Tända i ${lista(rum.flatMap(r => r.namn.toLowerCase().split(/ *(?:&|,| och ) */)).filter(Boolean))}?`, knapp: 'Ja, tänd', a: `data-a="tandlista" data-v="${hl.join(',')}"` });
      }
      // Solen går snart ner – mysbelysning
      if (sol && sol.state === 'above_horizon' && (!pers.length || hemma)) {
        const ner = Date.parse(sol.attributes.next_setting) - nu, mys = scener.find(x => /mys/i.test((x.namn || '') + x.e)) || scener[0];
        if (mys && ner > 0 && ner < 20 * 6e4 && nu - senast > 3 * 36e5) { const mn = mys.namn || namn(mys.e);
          add(`sol:${dag}`, { t: `Solen går ner om ${Math.max(1, Math.round(ner / 6e4))} min`, s: `Tända ${/mys/i.test(mn) ? 'mysbelysningen' : 'scenen ' + mn} innan det blir mörkt?`, knapp: `Tänd ${mn}`, a: `data-a="scen" data-e="${mys.e}"` }); }
      }
    } else {
      // Musik eller tv på när ingen är hemma
      if (pers.length && !hemma) A.spelarLista(k).filter(id => S(id) && S(id).state === 'playing').forEach(id => add(`mediaborta:${id}:${S(id).last_changed}`, {
        t: 'Ingen är hemma', s: `Men ${namn(id)} ${A.arTV(id) ? 'är på' : 'spelar fortfarande'}. ${A.arTV(id) ? 'Stänga av' : 'Pausa'}?`, knapp: A.arTV(id) ? 'Stäng av' : 'Pausa',
        a: `data-a="tj" data-d="${A.arTV(id) ? 'media_player.turn_off' : 'media_player.media_pause'}" data-e="${id}"` }));
      // Kaffemaskinen har stått på länge
      const ks = k.kaffe && S(`switch.${k.kaffe}_av_pa`), kd = k.kaffe && S(`sensor.${k.kaffe}_driftstatus`), kt = ks ? nu - Date.parse(ks.last_changed) : 0;
      if (ks && ks.state === 'on' && kt > k.kaffeTimmar * 36e5 && !(kd && /run|delayedstart/i.test(kd.state)))
        add(`kaffe:${ks.last_changed}`, { t: 'Kaffemaskinen står på', s: `Den har varit på i ${Math.floor(kt / 36e5)} h. Stänga av?`, knapp: 'Stäng av', a: `data-a="tj" data-d="switch.turn_off" data-e="${ks.entity_id}"` });
      // Frost eller snö i natt
      if (h >= 17 && h < 23 && tim.length) {
        const natt = tim.filter(f => { const t = Date.parse(f.datetime); return t > nu && t < nu + 16 * 36e5; });
        const min = natt.reduce((m, f) => !m || f.temperature < m.temperature ? f : m, null), sno = natt.some(f => /snow/.test(f.condition || ''));
        if (min && min.temperature <= 0) add(`frost:${dag}`, { t: sno ? 'Snö och minusgrader i natt' : 'Frost i natt',
          s: `Ner mot ${Math.round(min.temperature)}° kl ${hh(new Date(min.datetime))}. Ställ väckarklockan lite tidigare för att skrapa bilen${sno ? ' och skotta' : ''}.`, knapp: 'Visa vädret', a: 'data-a="sida" data-v="vader"' });
      }
      // Dyr el just nu
      if (el && el.niva === 'fel' && h >= 6 && h < 22 && el.basta && el.basta.i !== el.nuIdx)
        add(`dyrel:${dag}`, { t: 'Elen är dyr just nu', s: `${kr(el.nu)} kr/kWh. Vänta med disk och tvätt – billigast kl ${el.basta.txt} (${kr(el.basta.p)} kr).`, knapp: 'Visa elpriset', a: 'data-a="sida" data-v="energi"' });
      // Norrsken ikväll
      if (h >= 18 || h < 1) { const ns = A.norrsken(k);
        if (ns && ns.f === 'var(--ok)') {
          const n = tim.filter(f => { const t = Date.parse(f.datetime), x = new Date(t).getHours(); return t > nu - 36e5 && t < nu + 8 * 36e5 && (x >= 21 || x <= 2); });
          const molnigt = n.length ? n.filter(f => /cloudy$|rain|pour|snow|fog/.test(f.condition || '') && f.condition !== 'partlycloudy').length / n.length : 0;
          if (molnigt < .5) add(`norrsken:${dag}`, { t: 'Chans för norrsken ikväll! 🌌', s: `Kp ${kr(ns.kp, 0)} och ${molnigt < .2 ? 'klart' : 'delvis klart'} väder. Titta norrut efter kl 21, gärna bort från gatlyktorna.`, knapp: 'Visa vädret', a: 'data-a="sida" data-v="vader"' });
        } }
      // Att komma ihåg – på morgonen och när någon kommer hem
      if (k.attGora && S(k.attGora) && ((h >= 6 && h < 10) || nyssHem)) { A.hamtaTodo(k.attGora);
        const l = (A.todo[k.attGora] || []).filter(x => x.status !== 'completed');
        if (l.length) add(`todo:${dag}:${h < 10 ? 'morgon' : 'hem'}`, { t: `${l.length} ${l.length === 1 ? 'sak' : 'saker'} att komma ihåg`, s: l.slice(0, 3).map(x => x.summary).join(' · ') + (l.length > 3 ? ' …' : ''), knapp: 'Visa listan', a: 'data-a="sida" data-v="hushall"' });
      }
      // Låga batterier (telefonerna räknas inte)
      if (h >= 8 && h < 21) { const reg = A.hass.entities || {}, st = A.hass.states;
        const lag = Object.keys(st).filter(id => id.startsWith('sensor.') && st[id].attributes.device_class === 'battery' && !(reg[id] && reg[id].platform === 'mobile_app') && parseFloat(st[id].state) < k.battVarn)
          .sort((a, b) => parseFloat(st[a].state) - parseFloat(st[b].state));
        if (lag.length) { const vecka = Math.floor((idag - new Date(idag.getFullYear(), 0, 1)) / 6048e5), n0 = namn(lag[0]).replace(/\s*(batteri(nivå)?|battery( level)?)$/i, '');
          add(`batt:${lag[0]}:${vecka}`, { t: `Byt batteri: ${n0}`, s: `Nere på ${Math.round(parseFloat(st[lag[0]].state))} %${lag.length > 1 ? ` – och ${lag.length - 1} till under ${k.battVarn} %` : ''}.`, knapp: 'Visa batterierna', a: 'data-a="sida" data-v="hushall"' }); }
      }
      // Elbilen behöver laddas
      if (k.elbil && h >= 17 && h < 23) { const d = A.elbilData(k);
        if (d && d.soc != null && !d.kabel && d.soc < 50) add(`elbil:${dag}`, { t: `${k.elbil.namn} har ${Math.round(d.soc)} %`, s: `Sätt i laddkabeln ikväll.${d.billig ? ` Billigast att ladda kl ${String(d.billig.fr.h).padStart(2, '0')}–${String((d.billig.fr.h + d.billig.n) % 24).padStart(2, '0')}.` : ''}`, knapp: 'Visa bilen', a: 'data-a="sida" data-v="energi"' }); }
      // Servern mår dåligt
      if (k.server) { const sv = k.server, v = (id) => id ? tal(id) : null, disk = v(sv.disk), temp = v(sv.temp), ram = v(sv.ram);
        const pr = disk >= 90 ? ['disk', `Disken på servern är ${Math.round(disk)} % full`, 'Rensa gamla säkerhetskopior eller spara historiken kortare tid.']
          : temp >= 80 ? ['temp', `Servern är varm: ${Math.round(temp)} °C`, 'Se till att den har luft omkring sig.'] : ram >= 95 ? ['minne', `Servern har nästan slut på minne (${Math.round(ram)} %)`, 'En omstart av Home Assistant kan hjälpa.'] : null;
        if (pr) add(`server:${dag}:${pr[0]}`, { t: pr[1], s: pr[2], knapp: 'Visa servern', a: 'data-a="sida" data-v="hushall"' }); }
    }
  };
  // ═════════════ Bussen ═════════════
  // Läser avgångar ur sensorn (t.ex. Västtrafik): tillståndet "13:50" eller en tidsstämpel, och ev. fler avgångar i attributen
  A.bussData = (k) => {
    const s = S(k.buss);
    if (!s) return null;
    const a = s.attributes, nu = Date.now();
    const tolka = (x) => {
      if (x == null || x === '' || x === 'unknown' || x === 'unavailable') return null;
      if (typeof x === 'number') return new Date(x < 1e12 ? x * 1000 : x);
      const m = String(x).match(/^(\d{1,2})[:.](\d{2})/);
      if (m && !/\d{4}-\d{2}/.test(x)) { const d = new Date(); d.setHours(+m[1], +m[2], 0, 0); if (d - nu < -3 * 36e5) d.setDate(d.getDate() + 1); return d; }
      const t = Date.parse(x); return isNaN(t) ? null : new Date(t);
    };
    const avg = [], lagg = (t, x = {}) => t && avg.push({ t, linje: String(x.line ?? x.sname ?? x.linje ?? a.line ?? k.bussLinje ?? ''), laege: x.track ?? x.platform ?? a.track ?? '' });
    lagg(tolka(s.state));
    ['next_departure', 'next', 'nasta_avgang', 'next_departure_time'].forEach(n => lagg(tolka(a[n])));
    Object.values(a).forEach(v => Array.isArray(v) && v.forEach(x => x && typeof x === 'object' && lagg(tolka(x.rtTime ?? x.estimated_time ?? x.estimatedTime ?? x.departure_time ?? x.departure ?? x.time ?? x.planned_time), x)));
    const sett = new Set(), lista = avg.filter(x => +x.t > nu - 6e4 && !sett.has(Math.round(x.t / 6e4)) && sett.add(Math.round(x.t / 6e4))).sort((x, y) => x.t - y.t);
    // Västtrafiks "delay" är gångtiden till hållplatsen (inställd i integrationen), inte en försening
    return { avg: lista, linje: (lista[0] && lista[0].linje) || k.bussLinje, riktning: k.bussNamn || a.direction || namn(k.buss), laege: lista[0] && lista[0].laege, gang: parseFloat(a.delay) || 0 };
  };
  // Avgången som passar en påminnelse: den sista som går inom fönstret före önskad tid
  A.bussMatch = (k, d, T) => d.avg.filter(x => +x.t <= T + 5 * 6e4 && +x.t >= T - k.bussFonster * 6e4).pop() || null;
  A.bussSag = (k, d, m) => {
    const txt = `Dags att gå till bussen! ${d.linje ? 'Linje ' + d.linje + ' ' : 'Bussen '}mot ${d.riktning} går ${hm(m.t).replace(':', '.')}, om ${Math.max(0, Math.round((m.t - Date.now()) / 6e4))} minuter.`;
    const ent = k.tts || Object.keys(A.hass.states).find(id => id.startsWith('tts.')), spk = k.ttsHog || A.spelarLista(k).find(id => !A.arTV(id));
    if (ent && spk) A.tj('tts', 'speak', { entity_id: ent, media_player_entity_id: spk, message: txt, cache: false });
    A.meddela(txt); A.vibb(40);
  };
  A.bussKoll = () => {
    const k = A.k, p = A.bussP;
    if (!k || !p) return;
    const nu = Date.now();
    if (nu > p.t + 10 * 6e4) { A.bussP = null; minne('buss', ''); return A.patchaAlla(); }
    const d = A.bussData(k), m = d && A.bussMatch(k, d, p.t);
    if (m && nu >= +m.t - k.bussForv * 6e4) { A.bussP = null; minne('buss', ''); A.bussSag(k, d, m); A.patchaAlla(); }
  };
  // Tv-apparater (Apple TV m.fl.) bland mediaspelarna som är påslagna
  A.kvallTv = (k) => A.spelarLista(k).filter(id => A.arTV(id) && S(id) && !['off', 'standby', 'unavailable', 'unknown'].includes(S(id).state));
  // ═════════════ God natt: släck allt efter en nedräkning ═════════════
  // Finns script.aura_godnatt och timer.aura_godnatt räknar Home Assistant ner (fungerar även om skärmen somnar),
  // annars räknar den här skärmen ner och måste vara igång tills det släcks.
  A.kvall = (() => { try { const x = JSON.parse(minne('kvall') || 'null'); return x && x.slut > Date.now() - 6e4 ? x : null; } catch (e) { return null; } })();
  A.gnVal = (() => { const std = { tv: true, dimma: true, larm: false }; try { return Object.assign(std, JSON.parse(minne('gnval') || '{}')); } catch (e) { return std; } })();
  A.gnHa = (k) => !!(k.gn && S(k.gn.script) && S(k.gn.timer));
  A.gnTv = (k) => A.spelarLista(k).filter(id => A.arTV(id));
  // Larmet kan bara slås på natt härifrån om det är av och inte kräver kod
  A.gnLarm = (k) => { const L = S(k.larm); if (!L || L.state !== 'disarmed') return ''; const a = L.attributes;
    return (a.code_arm_required && a.code_format) || (a.supported_features && !(a.supported_features & 4)) ? '' : k.larm; };
  const tidSek = (x) => String(x || '').split(':').reduce((a, b) => a * 60 + (+b || 0), 0);
  A.gnLage = (k) => {
    if (!k.gn) return null;
    if (A.gnHa(k)) {
      const t = S(k.gn.timer), sc = S(k.gn.script);
      if (t.state === 'active' && t.attributes.finishes_at) { const slut = Date.parse(t.attributes.finishes_at); return { slut, tot: Math.max(tidSek(t.attributes.duration), (slut - Date.now()) / 1000) }; }
      const start = Date.parse(sc.attributes.last_triggered || 0) || 0;
      return sc.state === 'on' && Date.now() - start > 4000 ? { slacker: true } : null;
    }
    if (A.gnDim) return { slacker: true };
    return A.kvall ? { slut: A.kvall.slut, tot: (A.kvall.slut - (A.kvall.start || A.kvall.slut - k.gn.min * 6e4)) / 1000 } : null;
  };
  A.gnStarta = (k, min, val) => {
    const v = A.gnVal = Object.assign({}, A.gnVal, val || {}); minne('gnval', JSON.stringify(v));
    if (A.gnHa(k)) A.tj('script', 'turn_on', { entity_id: k.gn.script, variables: { minuter: min, lampor: A.allaLampor(k), tv: v.tv ? A.gnTv(k) : [],
      dimma: !!v.dimma && min > 0, larm: v.larm ? A.gnLarm(k) : '' } }), A.kvall = null, minne('kvall', '');
    else if (min > 0) { A.kvall = { start: Date.now(), slut: Date.now() + min * 6e4 }; minne('kvall', JSON.stringify(A.kvall)); }
    else A.kvallKor(true);
    A.vibb(12); A.patchaAlla();
  };
  A.gnMer = (k) => {
    if (A.gnHa(k)) A.tj('timer', 'change', { entity_id: k.gn.timer, duration: '00:05:00' });
    else if (A.kvall) { A.kvall.slut += 3e5; minne('kvall', JSON.stringify(A.kvall)); }
    A.vibb(8); A.patchaAlla();
  };
  A.gnNu = (k) => {
    if (A.gnHa(k)) A.tj('timer', 'finish', { entity_id: k.gn.timer }); else A.kvallKor(true);
    A.vibb(12); A.patchaAlla();
  };
  A.gnAvbryt = (k) => {
    if (A.gnHa(k)) { A.tj('script', 'turn_off', { entity_id: k.gn.script }); A.tj('timer', 'cancel', { entity_id: k.gn.timer }); }
    clearTimeout(A.gnDim); A.gnDim = null; A.kvall = null; minne('kvall', '');
    A.vibb(8); A.patchaAlla();
  };
  // Lokal nedräkning: dimma ljuset en halv minut som varning, sedan släcks allt
  A.kvallKor = (direkt) => {
    const k = A.k; A.kvall = null; minne('kvall', '');
    if (!k) return;
    const v = k.gn ? A.gnVal : { tv: true }, lampor = A.allaLampor(k).filter(id => A.ljus(id).on), tv = v.tv ? A.kvallTv(k) : [], larm = v.larm ? A.gnLarm(k) : '';
    const slack = () => {
      A.gnDim = null;
      if (lampor.length) A.tj('homeassistant', 'turn_off', { entity_id: lampor });
      if (tv.length) A.tj('media_player', 'turn_off', { entity_id: tv });
      if (larm) A.tj('alarm_control_panel', 'alarm_arm_night', { entity_id: larm });
      A.meddela('God natt! Allt är släckt.'); A.patchaAlla();
    };
    const dim = !direkt && v.dimma ? lampor.filter(id => id.startsWith('light.')) : [];
    if (!dim.length) return slack();
    A.tj('light', 'turn_on', { entity_id: dim, brightness_pct: 15, transition: 3 });
    A.gnDim = setTimeout(slack, 30000); A.patchaAlla();
  };
  // Fönstret där man väljer tid och vad som ska hända – och följer nedräkningen
  A.godnatt = (k) => {
    document.getElementById('aura-godnatt')?.remove();
    const mork = k.tema !== 'ljus', noir = k.tema === 'noir';
    const T = noir ? { bg: '#141210', y2: '#1E1B17', tx: '#F5EFE6', dim: 'rgba(245,239,230,.6)' } : mork ? { bg: '#111427', y2: '#1A1E36', tx: '#EEF0FF', dim: 'rgba(238,240,255,.6)' }
      : { bg: '#FBF9F5', y2: '#F2EDE5', tx: '#1E1A15', dim: 'rgba(30,26,21,.58)' };
    const N = '#6B78D0', v = Object.assign({}, A.gnVal, { min: k.gn.min });
    const m = document.createElement('div');
    m.id = 'aura-godnatt';
    const css = `<style>
      #aura-godnatt { position:fixed; inset:0; z-index:10000; display:grid; place-items:center; background:rgba(8,9,20,.5); backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px); font-family:Manrope,system-ui,sans-serif; color:${T.tx}; }
      #aura-godnatt * { box-sizing:border-box; } #aura-godnatt button { font:inherit; color:inherit; border:0; cursor:pointer; -webkit-tap-highlight-color:transparent; }
      .gnp { width:min(410px, 94vw); max-height:90vh; overflow-y:auto; padding:22px; border-radius:32px; background:${T.bg}; box-shadow:0 40px 100px rgba(0,0,0,.4); animation:gnupp .45s cubic-bezier(.22,1,.36,1) both; scrollbar-width:none; }
      @keyframes gnupp { from { transform:translateY(40px) scale(.97); opacity:0; } }
      @media (max-width:600px) { #aura-godnatt { place-items:end center; } .gnp { width:100vw; border-radius:32px 32px 0 0; padding-bottom:calc(22px + env(safe-area-inset-bottom, 0px)); } }
      .gnp-h { display:flex; align-items:center; gap:12px; margin-bottom:14px; } .gnp-h h2 { margin:0; font-size:21px; font-weight:800; letter-spacing:-.03em; } .gnp-h p { margin:2px 0 0; font-size:13px; color:${T.dim}; font-weight:600; }
      .gnp-m { width:48px; height:48px; flex:none; border-radius:16px; display:grid; place-items:center; background:linear-gradient(135deg, #3A4490, #232A5C); color:#E3E7FF; }
      .gnp small.l { display:block; margin:14px 0 8px; font-size:11.5px; font-weight:800; letter-spacing:.09em; text-transform:uppercase; color:${T.dim}; }
      .gnp-tid { display:grid; grid-template-columns:repeat(5, 1fr); gap:6px; } .gnp-tid button { padding:11px 2px; border-radius:14px; background:${T.y2}; font-weight:800; font-size:14px; } .gnp-tid button.pa { background:${N}; color:#fff; }
      .gnp-rad { width:100%; display:flex; align-items:center; gap:12px; padding:10px 12px; border-radius:16px; background:${T.y2}; margin-top:6px; text-align:left; }
      .gnp-rad > ha-icon { color:${N}; flex:none; } .gnp-rad:not(.pa) > ha-icon { color:${T.dim}; } .gnp-rad span { flex:1; font-weight:800; font-size:14px; } .gnp-rad span i { display:block; font-style:normal; font-size:12px; font-weight:600; color:${T.dim}; }
      .gnp-vx { width:42px; height:24px; flex:none; border-radius:99px; background:color-mix(in srgb, ${T.tx} 16%, transparent); position:relative; } .gnp-vx::after { content:''; position:absolute; top:3px; left:3px; width:18px; height:18px; border-radius:50%; background:#fff; transition:.25s; }
      .gnp-rad.pa .gnp-vx { background:${N}; } .gnp-rad.pa .gnp-vx::after { left:21px; }
      .gnp-ok { width:100%; margin-top:16px; padding:15px; border-radius:18px; font-weight:800; font-size:15px; background:linear-gradient(135deg, #8E9BE8, ${N}) !important; color:#fff !important; }
      .gnp-k { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:8px; } .gnp-k button { padding:13px; border-radius:16px; background:${T.y2}; font-weight:800; font-size:14px; } .gnp-k .av { color:#E0705F !important; }
      .gnp-av { width:100%; margin-top:6px; padding:10px; font-weight:800; font-size:13.5px; background:none; color:${T.dim} !important; }
      .gnp-stor { text-align:center; padding:6px 0 8px; } .gnp-stor b { display:block; font-size:56px; font-weight:800; letter-spacing:-.04em; font-variant-numeric:tabular-nums; line-height:1.1; } .gnp-stor p { margin:4px 0 0; font-size:13.5px; color:${T.dim}; font-weight:600; }
      .gnp-not { margin:12px 0 0; font-size:12px; line-height:1.4; color:${T.dim}; font-weight:600; text-align:center; }
    </style>`;
    const kl = (t) => hm(new Date(t));
    const rita = () => {
      const L = A.gnLage(k);
      if (!L && v.igang) return stang();
      if (L) {
        v.igang = true;
        const vad = [A.allaLampor(k).some(id => A.ljus(id).on) && 'Lamporna', A.gnVal.tv && A.kvallTv(k).length && 'tv:n'].filter(Boolean).join(' och ') || 'Allt';
        m.innerHTML = css + `<div class="gnp"><div class="gnp-h"><span class="gnp-m">${ik(L.slacker ? 'mdi:lightbulb-off-outline' : 'mdi:timer-sand', 24)}</span>
          <div><h2>${L.slacker ? 'Släcker nu' : 'God natt-läge på'}</h2><p>${L.slacker ? 'Ljuset är dimmat – släcks strax' : `Släcks kl ${kl(L.slut)}`}</p></div></div>
          ${L.slut ? `<div class="gnp-stor"><b data-gn-ned="${L.slut}">${mmss(Math.max(0, (L.slut - Date.now()) / 1000))}</b><p>${vad} släcks${A.gnVal.larm && A.gnLarm(k) ? ' och larmet slås på natt' : ''}</p></div>
          <div class="gnp-k"><button data-g="mer">+5 min</button><button data-g="nu">Släck nu</button></div>` : ''}
          <div class="gnp-k"><button class="av" data-g="avbryt">Avbryt</button><button data-g="stang">Stäng</button></div></div>`;
        return;
      }
      const tanda = A.allaLampor(k).filter(id => A.ljus(id).on).length, tvPa = A.kvallTv(k), tv = A.gnTv(k), larm = A.gnLarm(k);
      const val = [['tv', 'mdi:television', 'Stäng av tv:n', tvPa.length ? `${tvPa.map(id => namn(id)).join(' och ')} är på` : 'Om den är på', tv.length],
        ['dimma', 'mdi:brightness-6', 'Dimma först', 'Ljuset sänks en halv minut innan', true], ['larm', 'mdi:shield-moon', 'Larma natt', 'Skalskyddet slås på', !!larm]].filter(x => x[4]);
      m.innerHTML = css + `<div class="gnp"><div class="gnp-h"><span class="gnp-m">${ik('mdi:weather-night', 24)}</span><div><h2>God natt</h2>
          <p>${tanda ? `${tanda} ${tanda === 1 ? 'lampa är tänd' : 'lampor är tända'}` : 'Allt är redan släckt'}</p></div></div>
        <small class="l">Släck om</small><div class="gnp-tid">${[0, 2, 5, 10, 15].map(x => `<button class="${x === v.min ? 'pa' : ''}" data-g="min" data-v="${x}">${x ? x + ' min' : 'Nu'}</button>`).join('')}</div>
        <small class="l">Det här händer</small>
        <div class="gnp-rad pa" style="cursor:default">${ik('mdi:lightbulb-group-outline', 20)}<span>Släck alla lampor<i>Och uttagen i rummen</i></span></div>
        ${val.map(([id, ikon, t, u]) => `<button class="gnp-rad ${v[id] ? 'pa' : ''}" data-g="val" data-v="${id}">${ik(ikon, 20)}<span>${t}<i>${esc(u)}</i></span><em class="gnp-vx"></em></button>`).join('')}
        <button class="gnp-ok" data-g="ok">${v.min ? `Släck om ${v.min} min · kl ${kl(Date.now() + v.min * 6e4)}` : 'Släck nu'}</button><button class="gnp-av" data-g="stang">Avbryt</button>
        ${A.gnHa(k) ? '' : '<p class="gnp-not">Den här skärmen räknar ner – låt den vara på tills det släcks.</p>'}</div>`;
    };
    const stang = () => { clearInterval(m._t); m.style.transition = 'opacity .2s'; m.style.opacity = '0'; setTimeout(() => m.remove(), 200); };
    m.addEventListener('click', (e) => {
      if (e.target === m) return stang();
      const b = e.target.closest('[data-g]'); if (!b) return;
      const a = b.dataset.g; A.vibb(6);
      if (a === 'stang') return stang();
      if (a === 'min') v.min = +b.dataset.v;
      if (a === 'val') v[b.dataset.v] = !v[b.dataset.v];
      if (a === 'ok') { A.gnStarta(k, v.min, { tv: v.tv, dimma: v.dimma, larm: v.larm }); if (!v.min) return stang(); rita(); return setTimeout(rita, 700); }
      if (a === 'mer') A.gnMer(k);
      if (a === 'nu') { A.gnNu(k); return stang(); }
      if (a === 'avbryt') { A.gnAvbryt(k); A.meddela('Avbrutet – inget släcks'); return stang(); }
      rita();
    });
    rita(); document.body.appendChild(m);
    let senast = '';
    m._t = setInterval(() => {
      if (!m.isConnected) return clearInterval(m._t);
      const L = A.gnLage(k), nyckel = L ? `${L.slut || 's'}` : v.igang ? 'slut' : '';
      if (nyckel !== senast && v.igang) rita(); senast = nyckel;
      m.querySelectorAll('[data-gn-ned]').forEach(n => { n.textContent = mmss(Math.max(0, (+n.dataset.gnNed - Date.now()) / 1000)); });
    }, 500);
  };
  A.morgonTand = minne('morgon') || ''; A.morgonKaffeKlar = minne('morgonkaffe') || '';
  A.morgonLampor = (k) => {
    const egna = k.morgonLampor.filter(id => S(id));
    return egna.length ? egna : k.rum.filter(r => /vardag|kök|kok|hall|entré|entre/i.test(r.namn)).flatMap(r => r.lampor.map(l => l.e)).filter(id => S(id));
  };
  A.morgon = (k) => {
    const nu = new Date(), m = nu.getHours() * 60 + nu.getMinutes(), dag = nu.toDateString();
    if (m < k.morgonFran || m >= k.morgonTill) return null;
    const pers = Object.keys(A.hass.states).filter(id => id.startsWith('person.')), L = S(k.larm);
    if ((pers.length && !pers.some(id => S(id).state === 'home')) || (L && L.state === 'armed_away')) return null;
    // Steg 2: lamporna tändes härifrån – erbjud kaffet om maskinen är avstängd
    const strom = k.kaffe && S(`switch.${k.kaffe}_av_pa`);
    if (A.morgonTand === dag) return k.morgonKaffe && strom && strom.state === 'off' && A.morgonKaffeKlar !== dag ? { steg: 2 } : null;
    // Steg 1: mörkt ute och minst en av morgonlamporna är släckt
    const sol = S('sun.sun'), el = sol ? sol.attributes.elevation : null, w = S(k.vader);
    const mork = sol ? sol.state === 'below_horizon' || (el != null && (el < 4 || (el < 10 && w && /cloudy|rain|pour|snow|fog/.test(w.state) && w.state !== 'partlycloudy'))) : m < 8 * 60;
    const lampor = A.morgonLampor(k);
    if (!mork || !lampor.length || lampor.every(id => A.ljus(id).on)) return null;
    const rum = k.rum.filter(r => r.lampor.some(l => lampor.includes(l.e))).flatMap(r => r.namn.toLowerCase().split(/ *(?:&|,| och ) */)).filter(Boolean);
    return { steg: 1, lampor, rum: rum.length > 1 ? rum.slice(0, -1).join(', ') + ' och ' + rum[rum.length - 1] : rum[0] || 'huset' };
  };
  A.forslag = (k) => A.forslagLista(k)[0] || { t: 'Allt ser bra ut', s: 'Inget behöver din uppmärksamhet just nu. Njut!', knapp: '', a: '' };

  // ═════════════ Innehållet i rutorna ═════════════
  const R = A.S;
  const rumNu = (k) => A.rum === 'oversikt' ? null : k.rum[+A.rum] || null;

  R.gnknapp = (_, k) => {
    const L = A.gnLage(k), h = new Date().getHours();
    return `<button class="gnk-o ${L ? 'pa' : h >= 21 || h < 4 ? 'kvall' : ''}" data-a="godnatt" aria-label="God natt">${L && L.slut ? `<svg viewBox="0 0 100 100"><circle class="gnk-b" cx="50" cy="50" r="46"/>
      <circle class="gnk-c" cx="50" cy="50" r="46" style="stroke-dasharray:${CIRK.toFixed(1)}" data-ned-c="${L.slut}" data-tot="${L.tot}"/></svg>` : ''}${ik(L && L.slacker ? 'mdi:lightbulb-off-outline' : 'mdi:weather-night', 22)}</button>
      <span class="gnk-t">${L ? L.slut ? `<b data-ned="${L.slut}"></b>` : 'Släcker' : 'God natt'}</span>`;
  };
  R.topp = (_, k) => {
    const d = new Date(), h = d.getHours();
    const hals = h < 5 ? 'God natt' : h < 10 ? 'God morgon' : h < 13 ? 'God förmiddag' : h < 18 ? 'God eftermiddag' : 'God kväll';
    const anv = A.hass.user && A.hass.user.name ? String(A.hass.user.name).split(' ')[0] : '';
    const sida = A.SIDOR.find(s => s[0] === A.sida) || A.SIDOR[0];
    const L = S(k.larm);
    let larm = '';
    if (L) {
      const s = L.state, pa = s.startsWith('armed'), t = s === 'triggered';
      larm = `<button class="chip ${t ? 'fel' : pa ? 'ok' : 'varn'}" data-a="sida" data-v="sakerhet"><span class="chip-ik">${ik(t ? 'mdi:alarm-light' : pa ? 'mdi:lock' : 'mdi:lock-open-variant-outline', 16)}</span><span class="txt">${t ? 'LARMET GÅR' : pa ? 'Hemmet är säkrat' : 'Larmet är av'}</span></button>`;
    }
    const w = S(k.vader), natt = S('sun.sun') && S('sun.sun').state === 'below_horizon';
    const vad = w && A.sida !== 'vader' ? `<button class="chip" data-a="sida" data-v="vader"><span class="chip-ik">${A.vikon(w.state, 24, natt)}</span>${w.attributes.temperature != null ? Math.round(w.attributes.temperature) + '°' : ''}</button>` : '';
    const flikar = A.sida === 'hem' ? `<div class="flikar"><button class="flik ${A.rum === 'oversikt' ? 'pa' : ''}" data-a="rum" data-v="oversikt">Översikt</button>
      ${k.rum.map((r, i) => `<button class="flik ${String(A.rum) === String(i) ? 'pa' : ''}" data-a="rum" data-v="${i}">${esc(r.namn)}</button>`).join('')}</div>` : '';
    return `<div class="topp-v"><div class="topp-ey">${A.sida === 'hem' ? forsta(d.toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })) : hals}</div>
      <h1>${A.sida === 'hem' ? `${hals}${anv ? `<span class="topp-namn">, ${esc(anv)}</span>` : ''}` : sida[3]}</h1></div>${flikar}
      <div class="topp-h">${k.gn ? (() => { const L = A.gnLage(k); return `<button class="chip gnchip ${L ? 'pa' : ''}" data-a="godnatt" aria-label="God natt"><span class="chip-ik">${ik(L ? 'mdi:timer-sand' : 'mdi:weather-night', 18)}</span>${L && L.slut ? `<b data-ned="${L.slut}"></b>` : ''}</button>`; })() : ''}${larm}${vad}<span class="klocka" data-tick="klocka"></span></div>`;
  };

  // Provar bilder i bakgrunden – saknas en bild visas mönstret i stället för en svart ruta
  A._bildFel = {}; A._bildOk = {};
  A.provaBild = (u) => { if (!u || A._bildFel[u] || A._bildOk[u] === 1 || A._bildOk[u] === 0) return; A._bildOk[u] = 0;
    const im = new Image(); im.onload = () => { A._bildOk[u] = 1; }; im.onerror = () => { A._bildFel[u] = true; A.patchaSnart(); }; im.src = u; };
  R.hero = (_, k) => {
    const r = rumNu(k), onskad = (r && r.bild) || k.bild, chips = [];
    k.rum.forEach(x => A.provaBild(x.bild)); A.provaBild(k.bild);
    const fel = onskad && A._bildFel[onskad], bild = fel ? '' : onskad;
    let tgl = '';
    if (r) {
      const L = r.lampor.map(l => A.ljus(l.e)).filter(x => x.finns), on = L.filter(x => x.on).length, t = tal(r.temp), f = tal(r.fukt);
      if (t != null) chips.push(`${ik('mdi:thermometer', 15)}${grad(t)}°C`);
      if (f != null) chips.push(`${ik('mdi:water-outline', 15)}${Math.round(f)} %`);
      chips.push(`${ik('mdi:lightbulb-outline', 15)}${on} av ${L.length} tända`);
      if (L.length) tgl = `<button class="vxl ${on ? 'pa' : ''}" data-a="rumtgl" data-i="${A.rum}" aria-label="Tänd eller släck rummet"></button>`;
    } else {
      const t = tal(k.inne), alla = A.allaLampor(k), on = alla.filter(id => A.ljus(id).on).length, el = k.el && A.elData(k);
      if (t != null) chips.push(`${ik('mdi:home-thermometer-outline', 15)}${grad(t)}°C inne`);
      chips.push(`${ik('mdi:lightbulb-outline', 15)}${on} lampor tända`);
      if (el && el.nu != null) chips.push(`${ik('mdi:lightning-bolt', 15)}${kr(el.nu)} kr/kWh`);
      const sol = A.solData(k);
      if (sol && sol.kw > 0.05) chips.push(`${ik('mdi:solar-power-variant', 15)}${kr(sol.kw, 1)} kW sol`);
      if (sol && sol.batt && sol.batt.soc != null) chips.push(`${ik(sol.batt.laddar ? 'mdi:battery-charging-outline' : 'mdi:home-battery-outline', 15)}${Math.round(sol.batt.soc)} %`);
    }
    return `<div class="hero-utan">${ik(r ? r.ikon : 'mdi:home-variant', 240)}</div>${bild ? `<div class="hero-bild" style="background-image:url('${esc(bild)}')"></div>` : ''}
      ${tgl || fel ? `<div class="hero-topp">${fel ? `<button class="hero-fel" data-a="diagnos">${ik('mdi:image-broken-variant', 15)}Bilden hittas inte</button>` : ''}${tgl}</div>` : ''}
      <div class="hero-in"><div class="hero-namn">${esc(r ? r.namn : k.namn)}</div><div class="hero-chips">${chips.map(c => `<span class="hc">${c}</span>`).join('')}</div></div>`;
  };

  const enhet = (o) => `<div class="enh ${o.pa ? 'pa' : ''} ${o.dim ? 'dim' : ''} ${o.av ? 'av' : ''} ${o.foto ? 'foto' : ''}" ${o.attr || ''} style="--c:${o.c || '255,190,110'};--fyll:${o.fyll || 0}%">
      ${o.foto ? `<div class="enh-foto" style="background-image:url('${esc(o.foto)}')"></div>` : ''}
      <div class="enh-topp">${o.ikA ? `<button class="enh-ik" ${o.ikA}>${ik(o.ikon, 18)}</button>` : `<span class="enh-ik">${ik(o.ikon, 18)}</span>`}${o.tgl || ''}</div>
      ${o.produkt}
      <div class="enh-txt"><div class="enh-namn">${esc(o.namn)}</div><div class="enh-sub">${o.sub}</div></div>
      ${o.dim ? `<div class="enh-bar"><i></i></div><div class="enh-stor">${o.fyll || 0}%</div>` : ''}</div>`;
  const lampEnhet = (id, k) => {
    const L = A.ljus(id), info = A.lampInfo(k, id), s = S(id);
    if (!L.finns) return enhet({ namn: info.namn || id, sub: 'Hittas inte', ikon: 'mdi:help', produkt: A.produkt('glod', false), av: true });
    return enhet({ namn: info.namn || namn(id), sub: L.av ? 'Ej ansluten' : L.on ? (L.dim ? `Tänd · ${L.pct} %` : 'På') : 'Av', ikon: info.ikon || s.attributes.icon || 'mdi:lightbulb-outline',
      produkt: A.produkt(A.lamptyp(info, s), L.on, L.c), pa: L.on, dim: L.dim, av: L.av, c: L.c, fyll: L.on && L.dim ? L.pct : 0,
      attr: `data-dim="${id}" data-pct="${L.pct}"`, ikA: (L.dim && !L.av) ? `data-a="ljuspanel" data-e="${id}" aria-label="Färg och ljusstyrka"` : "", tgl: `<span class="vxl ${L.on ? 'pa' : ''}"></span>` });
  };
  R.enheter = (_, k) => {
    const r = rumNu(k);
    let rutor = [];
    if (r) rutor = r.lampor.map(l => lampEnhet(l.e, k));
    else {
      k.rum.forEach((rm, i) => {
        const L = rm.lampor.map(l => A.ljus(l.e)).filter(x => x.finns), on = L.filter(x => x.on);
        if (!L.length) return;
        const forstaL = rm.lampor.find(l => A.ljus(l.e).on) || rm.lampor[0];
        rutor.push(enhet({ namn: rm.namn, sub: on.length ? `${on.length} av ${L.length} tända` : 'Allt släckt', ikon: rm.ikon, pa: on.length > 0, c: on.length ? on[0].c : '',
          produkt: A.produkt(A.lamptyp(forstaL, S(forstaL.e)), on.length > 0, on.length ? on[0].c : undefined),
          attr: `data-a="rum" data-v="${i}"`, tgl: `<button class="vxl ${on.length ? 'pa' : ''}" data-a="rumtgl" data-i="${i}" aria-label="Tänd eller släck"></button>` }));
      });
      // Elbilen
      if (k.elbil) { const d = A.elbilData(k);
        if (d && d.soc != null) { const lb = d.id.laddbox, lbPa = lb && S(lb).state === 'on';
          rutor.push(enhet({ namn: k.elbil.namn, sub: `${d.laddar ? 'Laddar' : d.full && d.kabel ? 'Fulladdad' : d.kabel ? 'Ansluten' : `${d.rack != null ? Math.round(d.rack) + ' km' : 'Ej ansluten'}`} · ${Math.round(d.soc)} %`,
            ikon: d.laddar ? 'mdi:car-electric' : 'mdi:car-electric-outline', pa: d.laddar, c: '61,220,132', produkt: A.bilSvg(k.elbil, d).replace('<svg ', '<svg class="produkt bil" '),
            attr: 'data-a="sida" data-v="energi"', tgl: lb ? `<button class="vxl ${lbPa ? 'pa' : ''}" data-a="tj" data-d="${lb.split('.')[0]}.toggle" data-e="${lb}" aria-label="Laddning"></button>` : '' })); } }
      // Spabadet
      if (k.spa) { const d = A.spaData(k);
        if (d) { const T = A.spaText(d);
          rutor.push(enhet({ namn: k.spa.namn, sub: T.hem, ikon: 'mdi:hot-tub', pa: d.badar || (d.varmer && !T.lock), c: d.varmer && !d.badar ? '240,165,74' : '54,185,224', produkt: A.spaSvg(k.spa, d).replace('<svg ', '<svg class="produkt spa" '),
            attr: 'data-a="sida" data-v="hushall"', tgl: d.pumpar.length || d.lampor.length ? `<button class="vxl ${d.badar ? 'pa' : ''}" data-a="spabad" aria-label="Bada"></button>` : '' })); } }
      k.dammar.forEach((x, i) => { const d = S(x.e); if (!d) return;
        const st = d.state, pa = st === 'cleaning' || st === 'returning', b = d.attributes.battery_level ?? tal(x.batteri);
        const txt = { cleaning: 'Städar', returning: 'På väg hem', docked: 'Laddar', idle: 'Väntar', paused: 'Pausad', error: 'Fel' }[st] || st;
        rutor.push(enhet({ namn: x.namn || d.attributes.friendly_name || 'Dammsugare', sub: txt + (b != null ? ` · ${Math.round(b)} %` : ''),
          ikon: 'mdi:robot-vacuum', pa, produkt: A.produkt('robot', st === 'cleaning'), c: '120,200,190', attr: x.popup ? `data-a="popup" data-v="${esc(x.popup)}"` : `data-a="dammval" data-v="${i}" data-sida="hushall"`,
          tgl: `<button class="vxl ${pa ? 'pa' : ''}" data-a="tj" data-d="vacuum.${pa ? 'return_to_base' : 'start'}" data-e="${d.entity_id}" aria-label="Starta eller skicka hem"></button>` })); });
      const sp = S(A.valdSpelare(k));
      if (sp) { const pa = sp.state === 'playing';
        rutor.push(enhet({ namn: sp.attributes.friendly_name || 'Högtalare', sub: pa ? esc(sp.attributes.media_title || 'Spelar') : sp.state === 'paused' ? 'Pausad' : 'Tyst',
          ikon: 'mdi:speaker', pa, produkt: A.produkt('hogtalare', pa), c: '150,140,255', attr: 'data-a="sida" data-v="media"',
          tgl: `<button class="vxl ${pa ? 'pa' : ''}" data-a="media" data-d="media_play_pause" aria-label="Spela eller pausa"></button>` })); }
      if (k.kaffe) { const dr = S(`sensor.${k.kaffe}_driftstatus`), st = S(`switch.${k.kaffe}_av_pa`);
        if (dr || st) { const l = dr ? String(dr.state).split('.').pop().toLowerCase() : '', pa = st ? st.state === 'on' : true, br = l === 'run';
          rutor.push(enhet({ namn: 'Kaffe', sub: br ? 'Brygger …' : pa ? 'Redo' : 'Avstängd', ikon: 'mdi:coffee-outline', pa, produkt: A.produkt('kaffe', pa, '', { brygger: br }), c: '210,160,125',
            attr: 'data-a="sida" data-v="hushall"', tgl: st ? `<button class="vxl ${pa ? 'pa' : ''}" data-a="tj" data-d="switch.toggle" data-e="${st.entity_id}" aria-label="Ström"></button>` : '' })); } }
    }
    const aktiva = rutor.filter(x => x.startsWith('<div class="enh pa')).length;
    return kh(r ? r.ikon : 'mdi:view-grid-outline', r ? 'Lampor' : 'Mina enheter', `<span class="pill acc">${aktiva} aktiva</span>`)
      + `<div class="enheter ${rutor.length > 6 && rutor.length <= 8 ? 'fyra' : ''}">${rutor.join('') || tom('Inga enheter', 'mdi:lightbulb-off-outline')}</div>`;
  };

  // Historik för en sensor (senaste dygnet) – hämtas högst var tionde minut
  A.hist = {};
  A.hamtaHist = (id) => {
    const c = A.hist[id];
    if (!id || (c && (c.laddar || Date.now() - c.t < 10 * 6e4))) return;
    A.hist[id] = Object.assign({}, c, { laddar: true, t: Date.now() });
    A.hass.callWS({ type: 'history/history_during_period', start_time: new Date(Date.now() - 864e5).toISOString(), entity_ids: [id], minimal_response: true, no_attributes: true, significant_changes_only: true })
      .then(r => { const l = (r && r[id]) || []; A.hist[id] = { t: Date.now(), p: l.map(x => ({ t: (x.lu || x.lc || Date.parse(x.last_updated || x.last_changed) / 1000) * 1000, v: parseFloat(x.s ?? x.state) })).filter(x => !isNaN(x.v) && !isNaN(x.t)) }; A.patchaSnart(); })
      .catch(() => { A.hist[id] = { t: Date.now(), p: [] }; });
  };
  const kurva24 = (id, nu) => {
    A.hamtaHist(id);
    const p = ((A.hist[id] || {}).p || []).concat(nu != null ? [{ t: Date.now(), v: nu }] : []);
    if (p.length < 3) return '';
    const t0 = Date.now() - 864e5, v = p.map(x => x.v), mn = Math.min(...v), mx = Math.max(...v), sp = Math.max(mx - mn, .6), W = 200, H = 34;
    const pts = p.filter(x => x.t >= t0).map(x => [((x.t - t0) / 864e5 * W), H - 3 - ((x.v - mn) / sp) * (H - 8)]);
    if (pts.length < 2) return '';
    const d = pts.map((q, i) => `${i ? 'L' : 'M'}${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(' ') + ` L${W} ${pts[pts.length - 1][1].toFixed(1)}`;
    const imx = v.indexOf(mx), imn = v.indexOf(mn), kl = (x) => hm(new Date(p[x].t));
    return `<div class="kl-kurva"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><path d="${d} L${W} ${H} L0 ${H} Z" fill="url(#a-klk)" opacity=".35"/><path d="${d}" fill="none" stroke="var(--acc)" stroke-width="1.8" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>
      <defs><linearGradient id="a-klk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--acc)"/><stop offset="1" stop-color="var(--acc)" stop-opacity="0"/></linearGradient></defs></svg>
      <div class="kl-kurva-t"><span>${ik('mdi:arrow-down-thin', 13)}${grad(mn)}° ${kl(imn)}</span><span>${ik('mdi:arrow-up-thin', 13)}${grad(mx)}° ${kl(imx)}</span></div></div>`;
  };
  // Färg efter temperatur: kallt blått → bekvämt guld → varmt orange
  const tempFarg = (t) => t < 18 ? '#5BA8F0' : t < 20 ? '#7FC4C0' : t <= 23 ? '#D9B25F' : t <= 25 ? '#EE9A4A' : '#E8694A';
  R.klimat = (_, k) => {
    const r = rumNu(k);
    const tId = (r && r.temp) || k.inne, fId = (r && r.fukt) || (k.rum.find(x => x.temp === tId) || {}).fukt;
    const t = tal(tId), f = tal(fId);
    if (t == null) return kh('mdi:thermometer', 'Klimat') + tom('Ingen temperatursensor i det här rummet', 'mdi:thermometer-off');
    const kansla = t < 19 ? 'Svalt' : t <= 23 ? 'Behagligt' : 'Varmt', col = tempFarg(t);
    const andra = k.rum.filter(x => x.temp && x.temp !== tId && tal(x.temp) != null);
    // Senaste dygnet
    A.hamtaHist(tId);
    const p = ((A.hist[tId] || {}).p || []).filter(x => x.t >= Date.now() - 864e5).concat([{ t: Date.now(), v: t }]);
    const timme = p.filter(x => x.t <= Date.now() - 50 * 6e4).pop(), trend = timme ? t - timme.v : null;
    const trendHtml = trend == null || Math.abs(trend) < 0.15 ? `<span class="kl-trend">${ik('mdi:arrow-right-thin', 15)}Stabilt</span>`
      : `<span class="kl-trend ${trend > 0 ? 'upp' : 'ner'}" title="Senaste timmen">${ik(trend > 0 ? 'mdi:arrow-top-right-thin' : 'mdi:arrow-bottom-right-thin', 15)}${trend > 0 ? 'Stiger +' : 'Sjunker −'}${kr(Math.abs(trend), 1)}°</span>`;
    const fuktTxt = f == null ? '' : f < 30 ? 'torr luft' : f > 60 ? 'fuktigt' : 'bra fukt';
    let graf = '';
    if (p.length >= 3) {
      const v = p.map(x => x.v), mn = Math.min(...v, 20), mx = Math.max(...v, 23), lo = Math.floor(mn - .3), hi = Math.ceil(mx + .3), W = 240, H = 64, t0 = Date.now() - 864e5;
      const y = (x) => H - 2 - (x - lo) / (hi - lo) * (H - 6), X = (tt) => (tt - t0) / 864e5 * W;
      const pts = p.map(q => [X(q.t), y(q.v)]), d = pts.map((q, i) => `${i ? 'L' : 'M'}${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(' ');
      const vmin = Math.min(...v), vmax = Math.max(...v), imin = v.indexOf(vmin), imax = v.indexOf(vmax), sist = pts[pts.length - 1];
      const mid = new Date(); mid.setHours(0, 0, 0, 0); const xm = X(+mid);
      graf = `<div class="kl-graf"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
          <defs><linearGradient id="a-klf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${col}" stop-opacity=".45"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></linearGradient></defs>
          <rect x="0" y="${y(23).toFixed(1)}" width="${W}" height="${(y(20) - y(23)).toFixed(1)}" fill="var(--ok)" opacity=".09"/>
          <path d="M0 ${y(23).toFixed(1)}H${W}M0 ${y(20).toFixed(1)}H${W}" stroke="var(--ok)" stroke-opacity=".28" stroke-dasharray="2 4" vector-effect="non-scaling-stroke"/>
          ${xm > 4 && xm < W - 4 ? `<path d="M${xm.toFixed(1)} 0V${H}" stroke="var(--rad)" stroke-dasharray="2 3" vector-effect="non-scaling-stroke"/>` : ''}
          <path d="${d} L${sist[0].toFixed(1)} ${H} L${pts[0][0].toFixed(1)} ${H} Z" fill="url(#a-klf)"/>
          <path d="${d}" fill="none" stroke="${col}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>
        <i class="kl-pkt" style="left:${(sist[0] / W * 100).toFixed(1)}%;top:${(sist[1] / H * 100).toFixed(1)}%;--kf:${col}"></i>
        <span class="kl-band" style="top:${(y(23) / H * 100).toFixed(1)}%">20–23°</span></div>
        <div class="kl-mm"><span>${ik('mdi:arrow-down-thin', 13)}${grad(vmin)}° <small>${hm(new Date(p[imin].t))}</small></span><span>Dygnet</span><span>${ik('mdi:arrow-up-thin', 13)}${grad(vmax)}° <small>${hm(new Date(p[imax].t))}</small></span></div>`;
    }
    return `<div class="kl-bg" style="--kf:${col}"></div>` + kh('mdi:home-thermometer-outline', 'Klimat', `<span class="pill ${t < 19 ? '' : t <= 23 ? 'ok' : 'varn'}">${kansla}</span>`) + `
      <div class="kl-topp"><div class="kl-temp" style="--kf:${col}">${grad(t)}<sup>°</sup></div>
        <div class="kl-info"><b>${esc(r ? r.namn : 'Inne')}</b>${trendHtml}${f != null ? `<span class="kl-fukt" title="${fuktTxt}">${ik('mdi:water-outline', 14)}${Math.round(f)} % fukt</span>` : ''}</div></div>
      ${graf}
      ${andra.length ? `<div class="kl-rum">${andra.map(x => { const tv = tal(x.temp); return `<button data-a="rum" data-v="${k.rum.indexOf(x)}"><i style="background:${tempFarg(tv)}"></i>${esc(x.namn)}<b>${grad(tv)}°</b></button>`; }).join('')}</div>` : ''}`;
  };

  R.forslag = (_, k) => {
    const lst = A.forslagLista(k), f = lst[0] || A.forslag(k);
    return kh('mdi:creation-outline', 'Smart förslag', lst.length > 1 ? `<span class="forslag-n">1 av ${lst.length}</span>` : '') + `<div class="forslag-t">${esc(f.t)}</div><div class="forslag-s">${f.sHtml || esc(f.s)}</div>
      <div class="forslag-k">${f.knapp ? `<button class="knapp" ${f.a}>${esc(f.knapp)}</button>` : ''}${f.nyckel ? `<button class="knapp forslag-ign" data-a="ignorera" data-v="${esc(f.nyckel)}">${ik('mdi:close', 16)}Ignorera</button>` : ''}</div>`;
  };

  R.mediamini = (_, k) => {
    const id = A.valdSpelare(k), s = S(id);
    if (!s) return kh('mdi:music-note-outline', 'Spelas nu') + tom('Ingen mediaspelare', 'mdi:speaker-off');
    const a = s.attributes, spelar = s.state === 'playing', bild = A.mpBild(id);
    return kh('mdi:music-note-outline', 'Spelas nu', spelar ? '<span class="eq"><i></i><i></i><i></i></span>' : '') + `<div class="mm">
      <div class="mm-topp" data-a="sida" data-v="media" style="cursor:pointer"><div class="mm-bild" ${bild ? `style="background-image:url('${esc(bild)}')"` : ''}>${bild ? '' : ik('mdi:music-note', 22)}</div>
        <div style="min-width:0"><div class="mm-titel">${esc(a.media_title || 'Ingenting spelas')}</div><div class="mm-sub">${esc(a.media_artist || namn(id))}</div></div></div>
      <div data-prog data-pos="${a.media_position || 0}" data-uppd="${a.media_position_updated_at || ''}" data-langd="${a.media_duration || 0}" data-spelar="${spelar ? 1 : 0}">
        <div class="prog"><i></i></div><div class="prog-t"><span class="p-nu">0:00</span><span>${a.media_duration ? mmss(a.media_duration) : ''}</span></div></div>
      <div class="mm-knappar"><button class="ikk" data-a="media" data-d="media_previous_track">${ik('mdi:skip-previous', 26)}</button>
        <button class="rund acc" data-a="media" data-d="media_play_pause" style="width:52px;height:52px">${ik(spelar ? 'mdi:pause' : 'mdi:play', 26)}</button>
        <button class="ikk" data-a="media" data-d="media_next_track">${ik('mdi:skip-next', 26)}</button></div></div>`;
  };

  R.vaderkort = (_, k) => {
    const w = S(k.vader);
    if (!w) return '';
    const natt = S('sun.sun') && S('sun.sun').state === 'below_horizon';
    // Sex rutor: kommande dagar – levererar väderkällan färre än sex tas dagens prognos med först
    const d0 = new Date().setHours(0, 0, 0, 0), dag = (f) => new Date(f.datetime).setHours(0, 0, 0, 0);
    const alla = A.prognos(k.vader, 'daily'), fram = alla.filter(f => dag(f) > d0), idag = alla.find(f => dag(f) === d0);
    const dagar = fram.length >= 6 || !idag ? fram.slice(0, 6) : [Object.assign({ idag: true }, idag)].concat(fram).slice(0, 6);
    const pl = (v) => `${Math.round(v) > 0 ? '+' : ''}${Math.round(v)}°`;
    return kh('mdi:map-marker-outline', esc(k.plats || 'Väder')) + `<div class="vk-topp" data-a="sida" data-v="vader" style="cursor:pointer">
      <div><div class="vk-temp">${w.attributes.temperature != null ? pl(w.attributes.temperature) : '–'}</div><div class="vk-txt">${A.vtext(w.state)}</div></div>
      ${A.vikon(w.state, 76, natt)}</div>
      <div class="vdagar">${dagar.map(f => `<div class="vd"><small>${f.idag ? 'Idag' : new Date(f.datetime).toLocaleDateString('sv-SE', { weekday: 'short' }).replace('.', '')}</small>
        <div class="vd-r"><b>${pl(f.temperature)}</b>${A.vikon(f.condition, 24)}</div></div>`).join('')}</div>`;
  };

  R.hemma = () => {
    const pers = Object.keys(A.hass.states).filter(id => id.startsWith('person.'));
    if (!pers.length) return '';
    const hemma = pers.filter(id => S(id).state === 'home').length;
    return kh('mdi:account-group-outline', 'Hushållet', `<span class="pill ${hemma ? 'ok' : ''}">${hemma === pers.length ? 'Alla hemma' : `${hemma} av ${pers.length} hemma`}</span>`)
      + `<div class="avatarer">${pers.slice(0, 6).map(id => { const s = S(id), b = s.attributes.entity_picture;
        return `<button class="av ${s.state === 'home' ? 'hemma' : ''}" data-a="info" data-e="${id}" ${b ? `style="background-image:url('${esc(b)}')"` : ''} title="${esc(s.attributes.friendly_name)}">${b ? '' : esc((s.attributes.friendly_name || '?')[0])}</button>`; }).join('')}</div>`;
  };

  R.elmini = (_, k) => {
    const d = A.elData(k);
    if (!d) return '';
    const fram = d.fram.slice(0, 12), mx = Math.max(...fram.map(x => x.p), .01);
    return kh('mdi:lightning-bolt-outline', 'Elpris', `<span class="pill ${d.niva}">${d.nivaTxt}</span>`) + `<div data-a="sida" data-v="energi" style="cursor:pointer">
      <div class="elm-stor">${kr(d.nu)}<small>kr/kWh</small></div>
      <div class="minibars">${fram.map((x, j) => `<i class="${j === 0 ? 'nu' : ''}" style="--h:${Math.max(8, x.p / mx * 100).toFixed(0)}%;--sf:${elFarg(x.p, k)};--j:${j}"></i>`).join('')}</div>
      ${d.basta ? `<div class="elm-fot">Billigast ${esc(d.basta.txt)} · ${kr(d.basta.p)} kr</div>` : ''}</div>`;
  };

  // Ljus-sidan
  R.scener = (_, k) => {
    const fin = k.scener.filter(s => S(s.e)), tid = (id) => Date.parse(S(id).state) || 0;
    const senaste = fin.reduce((a, s) => !a || tid(s.e) > tid(a.e) ? s : a, null);
    const aktiv = senaste && Date.now() - tid(senaste.e) < 6 * 36e5 ? senaste.e : '';
    const sl = S(k.slack), igang = sl && sl.state === 'on' && sl.attributes.last_triggered;
    const slut = igang ? Date.parse(sl.attributes.last_triggered) + k.slackMin * 6e4 : 0;
    const eff = S(k.effektVal) ? S(k.effektVal).state : '';
    return kh('mdi:palette-outline', 'Scener') + `<div class="scenlista">${fin.map(s => `<button class="scen ${s.e === aktiv ? 'pa' : ''}" data-a="scen" data-e="${s.e}" style="--sc:${s.farg}">
        <span class="scen-ik">${ik(s.ikon || S(s.e).attributes.icon || 'mdi:palette-outline', 20)}</span><div>${esc(s.namn || namn(s.e))}<small>${s.e === aktiv ? 'Aktiv nu' : 'Tryck för att aktivera'}</small></div></button>`).join('')}
      ${sl && !k.gn ? `<button class="scen ${igang ? 'pa' : ''}" data-a="tj" data-d="script.toggle" data-e="${k.slack}" style="--sc:#7C8DB5"><span class="scen-ik">${ik(igang ? 'mdi:timer-sand' : 'mdi:power-sleep', 20)}</span>
        <div>${igang ? `Släcks om <span data-ned="${slut}"></span>` : `Släck allt om ${k.slackMin} min`}<small>${igang ? 'Tryck för att avbryta' : 'Alla lampor och uttag'}</small></div></button>` : ''}</div>
      ${k.effekter.length ? `<div class="kh" style="margin-top:20px"><div class="kh-t"><span class="kh-ik">${ik('mdi:auto-fix', 17)}</span>Ljuseffekter</div></div><div class="scenlista">${k.effekter.map(x =>
        `<button class="scen ${x.effekt === eff ? 'pa' : ''}" data-a="effekt" data-v="${esc(x.effekt)}" style="--sc:${x.farg}"><span class="scen-ik">${ik(x.ikon, 20)}</span><div>${esc(x.namn)}<small>${x.effekt === eff ? 'Igång' : 'Ljuseffekt'}</small></div></button>`).join('')}</div>` : ''}${A.partyHtml(k)}`;
  };
  // ═════════════ Partyläge: färger från skivomslaget, i vald takt ═════════════
  const PARTYTAKT = [['lugn', 'Lugn', 4], ['medel', 'Medel', 2], ['fest', 'Fest', 1]];
  A.partyTakt = minne('partytakt') || 'medel';
  A.partyIgang = (k) => !!(k.partyScript && S(k.partyScript) && S(k.partyScript).state === 'on');
  A.partyLampor = (k) => {
    const egna = k.partyLampor.filter(id => S(id));
    if (egna.length) return egna;
    return A.allaLampor(k).filter(id => id.startsWith('light.') && (S(id).attributes.supported_color_modes || []).some(m => ['hs', 'rgb', 'rgbw', 'rgbww', 'xy'].includes(m)));
  };
  A.partyHtml = (k) => {
    if (!k.partyScript) return '';
    if (!S(k.partyScript)) return `<div class="party-k">${tom(`Skriptet ${esc(k.partyScript)} saknas – lägg in party_script.yaml i Home Assistant`, 'mdi:party-popper')}</div>`;
    const pa = A.partyIgang(k), n = A.partyLampor(k).length, fg = A._partyFarg || [];
    return `<div class="party-k ${pa ? 'pa' : ''}">${k.effekter.length ? '' : `<div class="kh" style="margin-top:20px"><div class="kh-t"><span class="kh-ik">${ik('mdi:auto-fix', 17)}</span>Ljuseffekter</div></div>`}
      <button class="scen party ${pa ? 'pa' : ''}" data-a="party" style="--sc:#E8487A"><span class="scen-ik">${ik('mdi:party-popper', 20)}</span>
        <div>Partyläge<small>${pa ? (fg.length ? 'Igång · färger från skivomslaget' : 'Igång') : `${n} ${n === 1 ? 'färglampa' : 'färglampor'} · följer musiken`}</small></div>
        ${pa && fg.length ? `<span class="party-fg">${fg.slice(0, 5).map(([h, sa]) => `<i style="background:hsl(${h} ${sa}% 55%)"></i>`).join('')}</span>` : ''}</button>
      <div class="party-takt">${PARTYTAKT.map(([id, t]) => `<button class="${A.partyTakt === id ? 'pa' : ''}" data-a="partytakt" data-v="${id}">${t}</button>`).join('')}</div></div>`;
  };
  // Färger ur omslaget: läser bilden via Home Assistants bildproxy och plockar ut de mest färgstarka tonerna
  A.partyPalett = (id) => new Promise(res => {
    const s = S(id), a = s && s.attributes;
    if (!a || !a.entity_picture || !a.access_token) return res([]);
    const img = new Image();
    img.onload = () => { try {
      const c = document.createElement('canvas'); c.width = c.height = 36; const x = c.getContext('2d'); x.drawImage(img, 0, 0, 36, 36);
      const d = x.getImageData(0, 0, 36, 36).data, fack = {};
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), dl = mx - mn;
        if (mx < .2 || dl < .18) continue;
        let h = dl === 0 ? 0 : mx === r ? ((g - b) / dl) % 6 : mx === g ? (b - r) / dl + 2 : (r - g) / dl + 4; h = Math.round((h * 60 + 360) % 360);
        const f = Math.round(h / 24); fack[f] = fack[f] || { n: 0, h: 0, s: 0 }; fack[f].n++; fack[f].h += h; fack[f].s += dl / mx;
      }
      res(Object.values(fack).sort((p, q) => q.n - p.n).slice(0, 5).map(f => [Math.round(f.h / f.n), Math.round(Math.max(65, Math.min(100, f.s / f.n * 100)))]));
    } catch (e) { res([]); } };
    img.onerror = () => res([]);
    img.src = `/api/media_player_proxy/${id}?token=${a.access_token}&cache=${encodeURIComponent(String(a.entity_picture).slice(-40))}`;
  });
  A.partyStarta = async (k, spara) => {
    const spelare = A.valdSpelare(k), farger = await A.partyPalett(spelare), takt = (PARTYTAKT.find(t => t[0] === A.partyTakt) || PARTYTAKT[1])[2];
    A._partyFarg = farger; A._partyBild = (S(spelare) || { attributes: {} }).attributes.entity_picture || '';
    return A.tj('script', 'turn_on', { entity_id: k.partyScript, variables: { lampor: A.partyLampor(k), spelare, takt, farger, spara } });
  };
  A.partyStoppa = (k) => { A.tj('script', 'turn_off', { entity_id: k.partyScript }); setTimeout(() => A.tj('scene', 'turn_on', { entity_id: 'scene.fore_party' }), 400); };
  // Ny låt = nya färger (bara när partyläget är igång)
  A.partyKoll = () => {
    const k = A.k;
    if (!k || !A.partyIgang(k)) return;
    const s = S(A.valdSpelare(k)), bild = s && s.attributes.entity_picture;
    if (bild && bild !== A._partyBild) { A._partyBild = bild; A.partyStarta(k, false).then(() => A.patchaSnart()); }
  };
  R.ljusrum = (_, k) => {
    const alla = A.allaLampor(k), tanda = alla.filter(id => A.ljus(id).on).length;
    return kh('mdi:lightbulb-group-outline', `${tanda} av ${alla.length} tända`, `<div class="knapprad">${tanda ? `<button class="knapp" data-a="allaav">${ik('mdi:lightbulb-off-outline', 17)}Släck alla</button>` : ''}<button class="knapp prim" data-a="allapa">${ik('mdi:lightbulb-on-outline', 17)}Tänd alla</button></div>`)
      + k.rum.map((r, i) => { const L = r.lampor.map(l => A.ljus(l.e)).filter(x => x.finns), on = L.filter(x => x.on).length, t = tal(r.temp);
        return `<div class="rumsek" data-rumsek="${i}" style="--rader:${Math.max(1, Math.ceil(r.lampor.length / 4))}"><div class="rr"><div><h2>${esc(r.namn)}</h2><span class="dim">${[t != null ? grad(t) + '°' : '', `${on} av ${L.length} tända`].filter(Boolean).join(' · ')}</span></div>
          ${L.length ? `<button class="vxl ${on ? 'pa' : ''}" data-a="rumtgl" data-i="${i}" aria-label="Tänd eller släck rummet"></button>` : ''}</div>
          <div class="tiles">${r.lampor.map(l => lampEnhet(l.e, k)).join('')}</div></div>`; }).join('');
  };

  // Media-sidan
  R.media = (_, k) => {
    const id = A.valdSpelare(k), s = S(id);
    if (!s) return tom('Ingen mediaspelare hittades – ändra _mediaspelare i mitt_hem', 'mdi:speaker-off');
    const a = s.attributes, spelar = s.state === 'playing', av = ej(s) || ['off', 'standby'].includes(s.state);
    let titel = a.media_title, under = [a.media_artist, a.media_album_name].filter(Boolean).join(' · ');
    const bild = A.mpBild(id);
    if (A.vantar && A.vantar.id === id && Date.now() - A.vantar.t < 12000 && a.media_title !== A.vantar.namn) { titel = A.vantar.namn; under = 'Byter låt …'; }
    const vol = Math.round((a.volume_level || 0) * 100), langd = a.media_duration || 0, rep = a.repeat || 'off';
    const nastaRep = { off: 'all', all: 'one', one: 'off' }[rep] || 'off';
    const medl = a.group_members || [];
    return `<div class="mp ${spelar ? 'spelar' : ''}">${bild ? `<div class="mp-bg" style="background-image:url('${esc(bild)}')"></div>` : ''}
      ${kh('mdi:music-circle-outline', spelar ? 'Spelas nu' : s.state === 'paused' ? 'Pausad' : av ? 'Avstängd' : 'Redo', spelar ? '<span class="eq"><i></i><i></i><i></i></span>' : '')}
      <div class="mp-skiva"><div class="mp-vinyl"><div class="mp-vinyl-in"></div></div><div class="mp-omslag" ${bild ? `style="background-image:url('${esc(bild)}')"` : ''}>${bild ? '' : ik('mdi:music-note', 52)}</div></div>
      <div class="mp-info"><div class="mp-titel">${esc(titel || 'Ingenting spelas')}</div><div class="mp-artist">${esc(under) || '&nbsp;'}</div></div>
      <div class="mp-prog" data-prog data-pos="${a.media_position || 0}" data-uppd="${a.media_position_updated_at || ''}" data-langd="${langd}" data-spelar="${spelar ? 1 : 0}">
        <div class="mp-bar" data-a="seek" data-l="${langd}"><div class="prog"><i></i></div></div><div class="prog-t"><span class="p-nu">0:00</span><span>${langd ? mmss(langd) : ''}</span></div></div>
      <div class="mp-knappar">
        <button class="ikk ${a.shuffle ? 'pa' : 'svag'}" data-a="media" data-d="shuffle_set" data-x='{"shuffle":${!a.shuffle}}'>${ik('mdi:shuffle-variant', 22)}</button>
        <button class="ikk" data-a="media" data-d="media_previous_track">${ik('mdi:skip-previous', 30)}</button>
        <button class="spela" data-a="media" data-d="media_play_pause">${ik(spelar ? 'mdi:pause' : 'mdi:play', 32)}</button>
        <button class="ikk" data-a="media" data-d="media_next_track">${ik('mdi:skip-next', 30)}</button>
        <button class="ikk ${rep !== 'off' ? 'pa' : 'svag'}" data-a="media" data-d="repeat_set" data-x='{"repeat":"${nastaRep}"}'>${ik(rep === 'one' ? 'mdi:repeat-once' : 'mdi:repeat', 22)}</button></div>
      <div class="mp-vol"><button data-a="media" data-d="volume_mute" data-x='{"is_volume_muted":${!a.is_volume_muted}}'>${ik(a.is_volume_muted || !vol ? 'mdi:volume-off' : vol < 50 ? 'mdi:volume-medium' : 'mdi:volume-high', 20)}</button>
        <input type="range" min="0" max="100" value="${vol}" data-vol="${id}" style="--v:${vol}%" oninput="this.style.setProperty('--v', this.value + '%'); this.nextElementSibling.textContent = this.value"
          onchange="window.Aura.volym(this)" onpointerdown="window.Aura.lasa(this)"><span>${vol}</span></div>
      <div class="hogrow">${A.spelarLista(k).map(x => { const t = S(x), vald = x === id, iGr = !vald && medl.includes(x);
        return `<button class="hog ${vald ? 'vald' : ''} ${iGr ? 'grupp' : ''}" data-a="spelare" data-e="${x}" title="Tryck: välj · Dubbeltryck: spela här också"><span class="hog-ik">${ik(A.arTV(x) ? 'mdi:television-play' : t.state === 'playing' ? 'mdi:speaker-wireless' : 'mdi:speaker', 16)}</span>${esc(t.attributes.friendly_name || x)}</button>`; }).join('')}</div>
    </div>`;
  };
  R.mflikar = () => {
    const k = A.k, id = A.valdSpelare(k), kl = A.kalla[id], al = A.album[id];
    if (id && !A.arMA(id)) return '';
    const f = (v, t, i) => `<button class="mflik ${A.mflik === v ? 'pa' : ''}" data-a="mflik" data-v="${v}">${i ? ik(i, 15) : ''}${t}</button>`;
    return f('bib', 'Bibliotek', 'mdi:bookshelf') + (al ? f('album', esc(al.namn || 'Albumet'), 'mdi:album') : '')
      + (kl && (!al || kl.uri !== al.uri) ? f('lista', esc(kl.namn || 'Spellistan'), 'mdi:playlist-music') : '')
      + (k.partySkarm || k.partyUrl ? f('party', 'Party', 'mdi:party-popper') : '') + (A.sok ? f('sok', `Sök: ${esc(A.sok.text)}`, 'mdi:magnify') : '');
  };
  // Party (Music Assistants partyläge): gästernas QR-kod eller MA:s egen partyskärm
  A.laddaQR = () => {
    if (window.qrcode || A.qrLaddar) return;
    A.qrLaddar = true;
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js';
    s.onload = () => A.patchaAlla();
    document.head.appendChild(s);
  };
  A.qrSvg = (text) => {
    if (!window.qrcode) { A.laddaQR(); return ''; }
    const q = window.qrcode(0, 'M'); q.addData(text, 'Byte'); q.make();
    return q.createSvgTag({ cellSize: 8, margin: 0, scalable: true }).replace('<svg ', '<svg style="width:100%;height:100%;display:block;" ');
  };
  A.partyHel = () => {
    const k = A.k;
    document.getElementById('aura-party')?.remove();
    const m = document.createElement('div');
    m.id = 'aura-party';
    m.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#000;';
    m.innerHTML = k.partySkarm ? `<iframe src="${esc(k.partySkarm)}" allow="fullscreen; autoplay; clipboard-write" style="width:100%;height:100%;border:0;display:block"></iframe>`
      : `<div style="height:100%;display:grid;place-items:center;font-family:Manrope,sans-serif;color:#fff;text-align:center"><div>
          <div style="font:800 clamp(26px,4vw,46px) Manrope,sans-serif;margin-bottom:18px">Skanna och önska en låt 🎶</div>
          <div style="width:min(62vh,80vw);aspect-ratio:1;margin:0 auto;padding:22px;background:#fff;border-radius:28px">${A.qrSvg(k.partyUrl)}</div></div></div>`;
    const x = document.createElement('button');
    x.innerHTML = '✕';
    x.style.cssText = 'position:absolute;top:18px;right:18px;width:52px;height:52px;border-radius:50%;border:0;background:rgba(255,255,255,.18);color:#fff;font-size:22px;cursor:pointer;backdrop-filter:blur(8px)';
    x.onclick = () => m.remove();
    m.appendChild(x);
    document.body.appendChild(m);
  };
  const partyHtml = (k) => {
    if (k.partySkarm) return `<div class="party-ram"><iframe src="${esc(k.partySkarm)}" allow="fullscreen; autoplay; clipboard-write"></iframe>
      <button class="rund acc party-hel" data-a="partyhel" title="Helskärm">${ik('mdi:fullscreen', 22)}</button></div>`;
    const svg = A.qrSvg(k.partyUrl);
    return `<div class="party"><button class="party-qr" data-a="partyhel">${svg || '<div class="dim">Ritar QR-kod …</div>'}</button>
      <div><div class="forslag-t" style="font-size:24px">Partyläge</div><div class="party-steg"><div><b>1</b>Skanna koden med mobilkameran</div>
      <div><b>2</b>Sök bland alla låtar – ingen app behövs</div><div><b>3</b>Lägg till i kön eller ge en låt en boost</div></div>
      <button class="knapp prim" data-a="partyhel">${ik('mdi:fullscreen', 18)}Visa QR stort</button></div></div>`;
  };
  const latLista = (kl, k, id, nasta, flik) => {
    A.hamtaSpar(kl);
    const d = A.spar[kl.uri], a = (S(id) || {}).attributes || {};
    const topp = `<div class="album-topp"><div class="lat-bild" style="width:64px;height:64px;border-radius:16px;${kl.bild ? `background-image:url('${esc(kl.bild)}')` : ''}">${kl.bild ? '' : ik('mdi:album', 26)}</div>
      <div style="min-width:0;flex:1"><div class="dim" style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;font-weight:800">${kl.typ === 'album' ? 'Album' : 'Spellista'}</div>
      <div style="font-weight:800;font-size:18px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(kl.namn || '')}</div><div class="dim">${esc(kl.under || '')}</div></div>
      <button class="rund acc" data-a="spela" data-uri="${esc(kl.uri)}" data-typ="${esc(kl.typ)}" data-namn="${esc(kl.namn || '')}" data-bild="${esc(kl.bild || '')}" data-under="${esc(kl.under || '')}" title="Spela från början">${ik('mdi:play', 22)}</button></div>`;
    if (!d || (d.laddar && !d.items)) return nasta + topp + `<div class="dim">Hämtar låtarna …</div>`;
    if (!d.items.length) return nasta + topp + tom('Hittar inga låtar', 'mdi:playlist-remove');
    const nuI = d.items.findIndex(x => x.uri === a.media_content_id || x.namn === a.media_title);
    return nasta + topp + d.items.map((x, i) => `<button class="lat ${i === nuI ? 'nu' : ''}" data-a="lat" data-k="${flik}" data-i="${i}"><span class="lat-nr">${i === nuI ? '<span class="eq"><i></i><i></i><i></i></span>' : i + 1}</span>
      <div class="lat-bild" ${x.bild || kl.bild ? `style="background-image:url('${esc(x.bild || kl.bild)}')"` : ''}>${x.bild || kl.bild ? '' : ik('mdi:music-note', 18)}</div>
      <div style="min-width:0"><b>${esc(x.namn)}</b><small>${esc(kl.under || kl.namn)}</small></div>${ik(i === nuI ? 'mdi:volume-high' : 'mdi:play', 20)}</button>`).join('');
  };
  const ruta = (it) => {
    const IK = { playlist: 'mdi:playlist-music', album: 'mdi:album', artist: 'mdi:account-music', radio: 'mdi:radio', track: 'mdi:music-note' };
    const bild = A.bildAv(it), art = (it.artists || []).map(x => x.name).filter(Boolean).join(', ');
    return `<button class="ruta" data-a="spela" data-uri="${esc(it.uri)}" data-typ="${esc(it.media_type || '')}" data-namn="${esc(it.name)}" data-bild="${esc(bild)}" data-under="${esc(art)}">
      <div class="ruta-bild ${it.media_type === 'artist' ? 'rund' : ''}" ${bild ? `style="background-image:url('${esc(bild)}')"` : ''}>${bild ? '' : ik(IK[it.media_type] || 'mdi:music', 36)}<span class="ruta-spela">${ik('mdi:play', 18)}</span></div>
      <b>${esc(it.name)}</b><small>${esc(art || { playlist: 'Spellista', album: 'Album', artist: 'Artist', radio: 'Radio' }[it.media_type] || '')}</small></button>`;
  };
  const latRad = (it, i) => {
    const bild = A.bildAv(it) || A.bildAv(it.album), art = (it.artists || []).map(x => x.name).filter(Boolean).join(', ');
    const d = `data-uri="${esc(it.uri)}" data-typ="track" data-namn="${esc(it.name)}"`;
    return `<div class="lat"><span class="lat-nr">${i + 1}</span><div class="lat-bild" ${bild ? `style="background-image:url('${esc(bild)}')"` : ''}>${bild ? '' : ik('mdi:music-note', 18)}</div>
      <div style="min-width:0"><b>${esc(it.name)}</b><small>${esc(art || (it.album && it.album.name) || '')}</small></div>
      <div class="lat-k"><button data-a="spela" ${d} title="Spela nu">${ik('mdi:play', 20)}</button><button data-a="iko" ${d} title="Lägg i kön">${ik('mdi:playlist-plus', 20)}</button></div></div>`;
  };
  const tvHtml = (id) => {
    const s = S(id), a = s.attributes, rem = A.fjarr(id), av = ['off', 'standby'].includes(s.state), appar = a.source_list || [];
    const f = (v, i, kl = '') => `<button class="${kl}" data-a="fjarr" data-e="${rem}" data-v="${v}" aria-label="${v}">${ik(i, 26)}</button>`;
    return `<div class="tvp">
      <div class="tvp-topp"><div><b>${esc(a.friendly_name || id)}</b><small>${av ? 'Avstängd' : esc(a.app_name || a.source || (s.state === 'playing' ? 'Spelar' : 'På'))}</small></div>
        <button class="tvp-pa ${av ? '' : 'pa'}" data-a="tvtj" data-d="${av ? 'turn_on' : 'turn_off'}">${ik('mdi:power', 22)}</button></div>
      ${rem ? `<div class="dpad">${f('up', 'mdi:chevron-up', 'u')}${f('left', 'mdi:chevron-left', 'l')}${f('select', 'mdi:circle-medium', 'ok')}${f('right', 'mdi:chevron-right', 'r')}${f('down', 'mdi:chevron-down', 'd')}</div>
      <div class="tvp-rad">${f('menu', 'mdi:arrow-left', 'rund')}${f('home', 'mdi:television', 'rund')}${f('play_pause', 'mdi:play-pause', 'rund')}${f('volume_down', 'mdi:volume-minus', 'rund')}${f('volume_up', 'mdi:volume-plus', 'rund')}</div>`
        : tom('Ingen fjärrkontroll (remote.*) hittades för spelaren – appar och uppspelning fungerar ändå.', 'mdi:remote-off')}
      ${appar.length ? `<div class="kh-t" style="margin-top:4px">Appar</div><div class="appar">${appar.map(x => `<button class="app ${x === (a.app_name || a.source) ? 'pa' : ''}" data-a="tvapp" data-v="${esc(x)}">${esc(x)}</button>`).join('')}</div>` : ''}
    </div>`;
  };
  R.mlista = (_, k) => {
    const tvId = A.valdSpelare(k);
    if (tvId && !A.arMA(tvId)) return tvHtml(tvId);
    if (A.mflik === 'party' && (k.partySkarm || k.partyUrl)) return partyHtml(k);
    if (!A.harMA()) return tom('Sök, bibliotek och byte av låt kräver Music Assistant. Spelaren till vänster fungerar ändå.', 'mdi:music-off');
    const id = A.valdSpelare(k);
    let nasta = '';
    if (id) { A.hamtaKo(id); const n = A.ko[id] && A.ko[id].nasta;
      if (n) { const mi = n.media_item || {}, b = A.bildAv(n) || A.bildAv(mi) || A.bildAv(mi.album);
        nasta = `<div class="nasta"><div class="lat-bild" ${b ? `style="background-image:url('${esc(b)}')"` : ''}>${b ? '' : ik('mdi:music-note', 18)}</div><div style="min-width:0;flex:1">
          <div class="dim" style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;font-weight:800">Spelas härnäst</div><div style="font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(mi.name || n.name || '')}</div></div>
          <button class="rund svag" data-a="media" data-d="media_next_track" title="Hoppa dit">${ik('mdi:skip-next', 20)}</button></div>`; } }
    if (A.mflik === 'sok' && A.sok) {
      if (A.sok.laddar) return `<div class="dim">Söker efter "${esc(A.sok.text)}" …</div>`;
      if (A.sok.fel) return tom('Kunde inte söka: ' + esc(A.sok.fel), 'mdi:alert-circle-outline');
      const r = A.sok.r || {}, latar = (r.tracks || []).slice(0, 8);
      const grupper = [['Artister', r.artists], ['Album', r.albums], ['Spellistor', r.playlists], ['Radio', r.radio]].filter(([, l]) => l && l.length);
      if (!latar.length && !grupper.length) return tom('Inga träffar', 'mdi:magnify-close');
      return (latar.length ? `<div class="mrad"><h3>Låtar</h3>${latar.map(latRad).join('')}</div>` : '')
        + grupper.map(([t, l]) => `<div class="mrad"><h3>${t}</h3><div class="karusell">${l.map(ruta).join('')}</div></div>`).join('');
    }
    if (A.mflik === 'album' && A.album[id]) return latLista(A.album[id], k, id, nasta, 'album');
    if (A.mflik === 'lista' && A.kalla[id]) return latLista(A.kalla[id], k, id, nasta, 'lista');
    return nasta + (k.rader.map(r => {
      A.hamtaRad(r);
      const d = A.bib[A.radNyckel(r)];
      if (d && !d.laddar && !d.items.length) return '';
      return `<div class="mrad"><h3>${esc(r.titel)}</h3><div class="karusell">${!d || (d.laddar && !d.items) ? '<div class="dim">Hämtar …</div>' : d.items.map(ruta).join('')}</div></div>`;
    }).join('') || tom('Biblioteket är tomt', 'mdi:bookshelf'));
  };

  // Energi-sidan
  R.elnu = (_, k) => {
    const d = A.elData(k);
    if (!d) return tom('Hittar inte elpriset – ändra _elpris i mitt_hem', 'mdi:flash-off');
    let delta = '';
    if (d.nu != null && d.forra) { const p = Math.round((d.nu - d.forra) / d.forra * 100);
      delta = p === 0 ? '<div class="dim">Samma som förra timmen</div>' : `<div style="font-weight:800;font-size:13.5px;color:${p > 0 ? 'var(--fel)' : 'var(--ok)'}">${p > 0 ? '↑' : '↓'} ${Math.abs(p)} % mot förra timmen</div>`; }
    // "imorgon 16–17" → "Imorgon 16–17", annars "Kl 16–17" – kortare så att det får plats på en rad
    const klTxt = (t) => esc(/^imorgon /.test(t) ? 'Imorgon ' + t.slice(8) : 'Kl ' + t);
    const nu = new Date(), tip = (ikon, f, titel, sub, v) => `<div class="tip"><span class="tip-ik" style="color:${f};background:color-mix(in srgb, ${f} 15%, transparent)">${ik(ikon, 21)}</span><div><b>${titel}</b><small>${sub}</small></div><span class="v">${v}</span></div>`;
    return kh('mdi:lightning-bolt', `Just nu · ${hh(nu)}–${String((nu.getHours() + 1) % 24).padStart(2, '0')}`, `<span class="pill ${d.niva}">${d.nivaTxt}</span>`)
      + `<div class="jatte ${d.niva}">${kr(d.nu)}</div><div class="dim" style="margin-bottom:8px">kr/kWh${k.elOmrade ? ' · ' + esc(k.elOmrade) : ''}</div>${delta}
      ${d.motSnitt != null && Math.abs(d.motSnitt) >= 1 ? `<div class="dim" style="font-weight:800;font-size:13px;margin-top:2px">${Math.abs(Math.round(d.motSnitt))} % ${d.motSnitt < 0 ? 'under' : 'över'} dagens snitt (${kr(d.snitt)})</div>` : ''}
      ${d.fonster.length ? `<div class="bt"><div class="bt-t">${ik('mdi:clock-check-outline', 15)}Billigaste tider</div>${d.fonster.map(b => `<div class="bt-r"><span class="bt-n">${b.n} h</span><span>${klTxt(b.txt)}</span><b>${kr(b.p)}<i class="vt">kr/kWh</i></b></div>`).join('')}</div>` : ''}
      <div class="tips">
        ${d.dyrast ? tip("mdi:alert-outline", "var(--fel)", "Undvik", klTxt(d.dyrast.txt), kr(d.dyrast.p) + '<i class="vt">kr/kWh</i>') : ''}
        ${d.krTim != null ? tip('mdi:home-lightning-bolt-outline', 'var(--info)', 'Huset drar nu', `${kr(d.effekt, 1)} kW`, `${kr(d.krTim)}<i class="vt">kr/h</i>`) : ''}
        ${d.manad != null && !k.elbil ? tip('mdi:calendar-month-outline', 'var(--acc)', 'Denna månad', d.manadPrognos ? `Prognos ca ${Math.round(d.manadPrognos).toLocaleString('sv-SE')} kr` : 'Kostnad hittills', Math.round(d.manad).toLocaleString('sv-SE') + '<i class="vt">kr</i>') : ''}</div>
`;
  };
  // "Vad kostar det?" – eget kort under diagrammet
  R.elapp = (_, k) => {
    const d = A.elData(k);
    if (!d || !d.apparater.length) return kh('mdi:calculator-variant-outline', 'Vad kostar det?') + tom('Inga timpriser att räkna med just nu', 'mdi:calculator-variant-outline');
    return kh('mdi:calculator-variant-outline', 'Vad kostar det?', '<span class="dim">Nu jämfört med bästa tid</span>') + `<div class="appar-g">${d.apparater.map(a => { const spar = a.spar >= 0.05 && a.kl;
      return `<div class="ap"><div class="ap-t"><span class="ap-ik">${ik(a.ikon || 'mdi:power-plug-outline', 19)}</span><b>${esc(a.namn)}</b></div><div class="ap-v">${kr(a.nu)}<i class="vt">kr nu</i></div>
        <div class="ap-s ${spar ? 'ok' : ''}">${spar ? `Kl ${String(a.kl.h).padStart(2, '0')}${a.kl.dag ? ' imorgon' : ''}: ${kr(a.bast)} kr · spara ${kr(a.spar)} kr` : 'Bra läge att köra nu'}</div></div>`; }).join('')}</div>`;
  };
  R.elgraf = (_, k) => {
    const d = A.elData(k);
    if (!d || !d.timmar.length) { const s = S(k.el);
      return kh('mdi:chart-bar', 'Timpris') + tom(`Hittar inga timpriser i ${esc(k.el)}.${s ? ' Sensorn har attributen: ' + esc(Object.keys(s.attributes).join(', ')) + '.' : ' Sensorn finns inte.'} Byt _elpris i mitt_hem till sensorn som har timpriserna.`, 'mdi:chart-bar'); }
    const t = d.timmar, mx = Math.max(...t.map(x => x.p), 0.01) * 1.08, b0 = d.basta ? d.basta.i : -9;
    return kh("mdi:chart-bar", d.imorgon ? "Idag och imorgon" : "Timpris idag", d.imorgonSnitt != null && d.snitt ? (() => { const pr = Math.round((d.imorgonSnitt - d.snitt) / d.snitt * 100);
      return `<span class="pill ${pr <= -3 ? 'ok' : pr >= 3 ? 'fel' : ''}">Imorgon ${Math.abs(pr) < 3 ? 'ungefär som idag' : `${Math.abs(pr)} % ${pr < 0 ? 'billigare' : 'dyrare'}`}</span>`; })() : '<span class="dim">kr/kWh</span>') + `<div class="staplar-rull">
      <div class="staplar" style="--n:${t.length}">${t.map((x, j) => { const nu = x.i === d.nuIdx, h = Math.max(4, x.p / mx * 100).toFixed(1);
        return `<div class="stapel ${x.i < d.nuIdx ? 'forbi' : ''} ${nu ? 'nu' : ''} ${x.i >= b0 && x.i < b0 + 3 ? 'basta' : ''}" style="--h:${h}%;--sf:${elFarg(x.p, k)};--j:${j}" title="${String(x.h).padStart(2, '0')}:00 · ${kr(x.p)} kr"><i></i>${nu ? `<span class="nu-lapp">${kr(x.p)}</span>` : ''}</div>`; }).join('')}</div>
      <div class="axel" style="--n:${t.length}">${t.map(x => `<span class="${x.h === 0 && x.dag ? "dagdel" : ""}">${x.h === 0 && x.dag ? "Imorgon" : x.h % 3 === 0 ? String(x.h).padStart(2, "0") : ""}</span>`).join('')}</div></div>
      <div class="forklaring"><span><i style="background:var(--ok)"></i>Under ${kr(k.billig, 1)} kr</span><span><i style="background:var(--varn)"></i>Normalt</span><span><i style="background:var(--fel)"></i>Över ${kr(k.dyr, 1)} kr</span>
        ${d.basta ? `<span><i style="background:color-mix(in srgb, var(--acc) 35%, transparent)"></i>Billigaste 3 timmarna</span>` : ""}</div>`;
  };
  // ═════════════ Solceller ═════════════
  // Läser effekt (W/kW) och energi (Wh/kWh/MWh) oavsett vilken enhet sensorn rapporterar i
  const kw = (id) => { const v = tal(id); if (v == null) return null; const u = (S(id).attributes.unit_of_measurement || '').toLowerCase();
    return u === 'w' || u === 'wh' ? v / 1000 : u === 'mw' || u === 'mwh' ? v * 1000 : v; };
  A.harSolBatt = (k) => !!(k.sol.effekt || k.sol.idag || k.sol.battNiva || k.sol.battEffekt);
  A.solData = (k) => {
    const c = k.sol || {};
    if (!A.harSolBatt(k)) return null;
    const d = { kw: kw(c.effekt), idag: kw(c.idag), salt: kw(c.salt), hus: kw(c.hus), prognos: kw(c.prognos), max: c.max };
    d.harSol = d.kw != null || d.idag != null;
    // Hembatteri: laddnivå (%) och effekt (positiv = laddar, om inte _batteri_effekt_omvand: true)
    const soc = tal(c.battNiva), bk = kw(c.battEffekt);
    if (soc != null || bk != null) {
      const p = bk == null ? null : c.battOmv ? -bk : bk;
      d.batt = { soc, kw: p, laddar: p != null && p > 0.05, ger: p != null && p < -0.05, kap: c.battKap };
      if (c.battKap && soc != null && p) d.batt.tim = p > 0 ? c.battKap * (100 - soc) / 100 / p : c.battKap * soc / 100 / -p;
      if (c.battKap && soc != null) d.batt.lagrat = c.battKap * soc / 100;
    }
    if (!d.harSol && !d.batt) return null;
    if (d.idag != null && d.salt != null && d.idag > 0) d.eget = klamp((d.idag - d.salt) / d.idag * 100, 0, 100);
    if (d.kw != null && d.hus != null) d.over = d.kw - d.hus;
    const el = k.el && A.elData(k);
    if (el && d.idag != null) d.varde = d.idag * (el.snitt != null ? el.snitt : el.nu || 0);
    return d;
  };
  // ═════════════ Diagnos: inställningar som pekar på saker som inte finns ═════════════
  A.diagnos = () => {
    const v = A._v || {}, st = A.hass.states, ut = [], sett = new Set();
    const DOM = /^(light|switch|sensor|binary_sensor|media_player|camera|cover|climate|lock|alarm_control_panel|weather|vacuum|scene|script|input_select|input_boolean|input_number|todo|calendar|person|number|button|select|tts|remote|fan|valve|water_heater|sun|zone|device_tracker|image|event)\.[a-z0-9_]+$/;
    const ga = (x, vag) => {
      if (typeof x === 'string') { if (DOM.test(x) && !st[x] && !sett.has(x)) { sett.add(x); ut.push({ vag, id: x }); } }
      else if (Array.isArray(x)) x.forEach((y, i) => ga(y, `${vag} › ${i + 1}`));
      else if (x && typeof x === 'object') Object.entries(x).forEach(([kk, y]) => ga(y, kk === 'entity' || kk === 'sensor' ? vag : `${vag} › ${kk}`));
    };
    // Prefix (t.ex. _smhi_prefix) är början på namn, inte hela entiteter – de kontrolleras för sig nedan
    Object.entries(v).forEach(([kk, x]) => { if (kk.startsWith('_') && !/_prefix$|^_motor_url$|^_kaffe$/.test(kk)) ga(x, kk); });
    const alla = Object.keys(st), prefix = [];
    [['_smhi_prefix', v._smhi_prefix, ''], ['_pollen_prefix', v._pollen_prefix, ''], ['_el_prefix', v._el_prefix, 'sensor.'], ['_kaffe', v._kaffe, 'switch.']].forEach(([kk, p, dom]) => {
      if (p && !alla.some(id => id.startsWith(dom + p) || (!dom && id.startsWith(p)))) prefix.push({ vag: kk, id: dom + p + '…' }); });
    const t = window.__auraTid, start = t && t.start != null ? `${((t.klar - t.start) / 1000).toFixed(1).replace('.', ',')} s · ${t.kalla}` : '';
    return { start, saknas: ut.concat(prefix), ver: A.v, ha: (A.hass.config && A.hass.config.version) || '', kalla: window.__auraKalla || 'inbäddad i YAML', anv: (A.hass.user && A.hass.user.name) || '' };
  };
  A.diagnosPanel = (k) => {
    const d = A.diagnos();
    document.getElementById('aura-diag')?.remove();
    const mork = k.tema !== 'ljus', noir = k.tema === 'noir';
    const T = noir ? { bg: '#141210', y2: '#1E1B17', tx: '#F5EFE6', dim: 'rgba(245,239,230,.6)' } : mork ? { bg: '#111427', y2: '#1A1E36', tx: '#EEF0FF', dim: 'rgba(238,240,255,.6)' } : { bg: '#FBF9F5', y2: '#F2EDE5', tx: '#1E1A15', dim: 'rgba(30,26,21,.58)' };
    const m = document.createElement('div');
    m.id = 'aura-diag';
    m.style.cssText = `position:fixed;inset:0;z-index:10000;display:grid;place-items:center;background:rgba(10,8,5,.45);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);font-family:Manrope,system-ui,sans-serif;color:${T.tx};padding:12px;`;
    const rad = (t, v) => `<div style="display:flex;justify-content:space-between;gap:12px;padding:10px 12px;border-radius:14px;background:${T.y2};font-size:13px;font-weight:700"><span style="color:${T.dim}">${t}</span><b style="text-align:right">${v}</b></div>`;
    m.innerHTML = `<div style="width:min(520px,96vw);max-height:90vh;overflow:auto;padding:22px;border-radius:30px;background:${T.bg};box-shadow:0 40px 100px rgba(0,0,0,.35);display:grid;gap:8px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px"><button data-v="x" style="width:40px;height:40px;border-radius:50%;border:0;background:${T.y2};color:${T.tx};font-size:18px;cursor:pointer">✕</button>
        <div><div style="font-size:11.5px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:${T.dim}">Aura</div><div style="font-size:22px;font-weight:800;letter-spacing:-.03em">Diagnos</div></div></div>
      ${rad('Motorn', `v${esc(d.ver)}`)}${rad('Laddas från', esc(d.kalla))}${d.start ? rad('Start', esc(d.start)) : ''}${d.ha ? rad('Home Assistant', esc(d.ha)) : ''}${d.anv ? rad('Inloggad', esc(d.anv)) : ''}
      <div style="margin-top:10px;font-size:15px;font-weight:800">${d.saknas.length ? `${d.saknas.length} ${d.saknas.length === 1 ? 'inställning pekar' : 'inställningar pekar'} på något som inte finns` : '✓ Allt i mitt_hem hittas i Home Assistant'}</div>
      ${d.saknas.map(x => `<div style="padding:10px 12px;border-radius:14px;background:color-mix(in srgb, #E8A317 14%, ${T.y2})"><div style="font-size:12px;font-weight:800;color:${T.dim}">${esc(x.vag)}</div><div style="font-size:14px;font-weight:800;word-break:break-all">${esc(x.id)}</div></div>`).join('')}
      <div data-bilder></div>
      ${d.saknas.length ? `<div style="font-size:12.5px;line-height:1.45;color:${T.dim};font-weight:600;margin-top:4px">Kontrollera stavningen under <b>Utvecklarverktyg → Tillstånd</b>. Har du inte saken kan du ta bort raden eller lämna den tom ('').</div>` : ''}</div>`;
    m.addEventListener('click', (e) => { if (e.target === m || e.target.closest('[data-v="x"]')) m.remove(); });
    document.body.appendChild(m);
    // Bilderna: provar att ladda varje egen bild och visar vilka som inte hittas
    const bilder = [['Startsidan (_bakgrundsbild)', k.bild], ...k.rum.map(r => [`Rum: ${r.namn}`, r.bild]),
      ...k.rum.flatMap(r => r.lampor.filter(l => arBild(l.typ)).map(l => [`Lampa: ${l.namn || l.e}`, A.bildUrl(l.typ)])), ...(k.elbil && arBild(k.elbil.bild) ? [['Elbilen', A.bildUrl(k.elbil.bild)]] : [])]
      .filter(([, u]) => u && !/^\/api\/image/.test(u));
    const ruta = m.querySelector('[data-bilder]');
    if (!bilder.length || !ruta) return;
    const svar = bilder.map(() => null), visa = () => {
      const fel = bilder.filter((_, i) => svar[i] === false);
      ruta.innerHTML = `<div style="margin-top:10px;font-size:15px;font-weight:800">Bilder ${svar.includes(null) ? '<span style="opacity:.5">– kontrollerar …</span>' : fel.length ? `– ${fel.length} hittas inte` : '– ✓ alla hittas'}</div>
        ${bilder.map(([t, u], i) => `<div style="display:flex;gap:10px;align-items:center;margin-top:6px;padding:9px 12px;border-radius:14px;background:${svar[i] === false ? `color-mix(in srgb, #E5484D 14%, ${T.y2})` : T.y2}">
          <span style="font-size:15px">${svar[i] == null ? '…' : svar[i] ? '✓' : '✕'}</span><div style="min-width:0"><div style="font-size:12px;font-weight:800;color:${T.dim}">${esc(t)}</div><div style="font-size:13px;font-weight:700;word-break:break-all">${esc(u)}</div></div></div>`).join('')}
        ${fel.length ? `<div style="font-size:12.5px;line-height:1.45;color:${T.dim};font-weight:600;margin-top:6px">Lägg filen i <b>config/www/aura/bilder/</b> med exakt samma namn (stora/små bokstäver och .jpg/.webp räknas). Öppna adressen i webbläsaren för att prova.</div>` : ''}`; };
    visa();
    bilder.forEach(([, u], i) => { const im = new Image(); im.onload = () => { svar[i] = true; visa(); }; im.onerror = () => { svar[i] = false; visa(); }; im.src = u; });
  };
  R.diagpill = () => { const dg = A.diagnos(); return `<button class="diag-knapp ${dg.saknas.length ? 'varn' : ''}" data-a="diagnos" title="Diagnos">${ik(dg.saknas.length ? 'mdi:alert-circle-outline' : 'mdi:stethoscope', 14)}${dg.saknas.length ? `${dg.saknas.length} saknas` : `v${esc(dg.ver)}`}</button>`; };
  R.tema = (_, k) => {
    const T = [['ljus', 'Ljus', 'Kräm & brons', '#F2EDE5', '#B07D3A'], ['mork', 'Mörk', 'Marin & indigo', '#151933', '#7568FF'], ['noir', 'Noir', 'Svart & champagne', '#16130F', '#D4AF7A']];
    return `<div class="temaval">${T.map(([id, n, sub, a, b]) => `<button class="tv ${k.tema === id ? 'pa' : ''}" data-a="tema" data-v="${id}"><span class="tv-p" style="--a:${a};--b:${b}"></span><b>${n}</b><small>${sub}</small></button>`).join('')}</div>`;
  };
  R.server = (_, k) => {
    const c = k.server || {}, v = (id) => id ? tal(id) : null, C = 2 * Math.PI * 16;
    const cpu = v(c.cpu), ram = v(c.ram), disk = v(c.disk), temp = v(c.temp), swap = v(c.swap), boot = c.boot && S(c.boot) ? Date.parse(S(c.boot).state) : NaN;
    const [txt, f] = cpu > 85 || ram > 92 || disk > 92 || temp > 80 ? ['Hög belastning', 'fel'] : cpu > 60 || ram > 80 || disk > 80 || temp > 68 ? ['Ansträngd', 'varn'] : ['Mår bra', 'ok'];
    const ring = (namn, x, varn, fel, id) => x == null ? '' : `<div class="srv-r" data-a="info" data-e="${id}"><div class="srv-ring"><svg class="ring" viewBox="0 0 42 42"><circle cx="21" cy="21" r="16" stroke="var(--yta3)"/>
      <circle cx="21" cy="21" r="16" stroke="${x >= fel ? 'var(--fel)' : x >= varn ? 'var(--varn)' : 'var(--ok)'}" stroke-linecap="round" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - klamp(x, 0, 100) / 100)).toFixed(1)}"/></svg>
      <b>${Math.round(x)}<small>%</small></b></div><span>${namn}</span></div>`;
    const upp = (() => { if (isNaN(boot)) return ''; const d = (Date.now() - boot) / 864e5; return d < 1 ? `${Math.max(1, Math.round(d * 24))} h` : d < 14 ? `${Math.floor(d)} dagar` : `${Math.floor(d / 7)} veckor`; })();
    const ha = S('update.home_assistant_core_update'), upd = Object.keys(A.hass.states).filter(id => id.startsWith('update.') && S(id).state === 'on').length;
    const rad = (ikon, t, val, attr = '') => `<div class="srv-rad" ${attr}>${ik(ikon, 17)}<span>${t}</span><b>${val}</b></div>`;
    return kh('mdi:server-outline', 'Servern', `<span class="pill ${f}">${txt}</span>`) + `<div class="srv-ringar">${ring('Processor', cpu, 60, 85, c.cpu)}${ring('Minne', ram, 80, 92, c.ram)}${ring('Disk', disk, 80, 92, c.disk)}</div>
      <div class="srv-rader">${temp != null ? rad('mdi:thermometer', 'Temperatur', `${kr(temp, 1)} °C`, `data-a="info" data-e="${c.temp}"`) : ''}${upp ? rad('mdi:timer-outline', 'Upptid', upp) : ''}
        ${swap != null ? rad('mdi:memory', 'Virtuellt minne', `${kr(swap, 1)} %`) : ''}
        ${ha ? rad('mdi:home-assistant', 'Home Assistant', esc(ha.attributes.installed_version || '')) : ''}
        ${rad(upd ? 'mdi:package-up' : 'mdi:check-decagram-outline', 'Uppdateringar', upd ? `<span style="color:var(--acc)">${upd} st</span>` : 'Allt aktuellt', 'data-a="lank" data-v="/config/updates" style="cursor:pointer"')}</div>`;
  };
  R.buss = (_, k) => {
    const d = A.bussData(k);
    if (!d) return kh('mdi:bus', 'Bussen') + tom('Hittar inte bussensorn – ändra _buss i mitt_hem', 'mdi:bus-alert');
    const n = d.avg[0], min = n ? Math.max(0, Math.round((n.t - Date.now()) / 6e4)) : null, ga = min == null ? null : min - d.gang;
    const pill = n == null ? '' : d.gang ? `<span class="pill ${ga <= 0 ? 'fel' : ga <= 3 ? 'varn' : 'ok'}">${ga <= 0 ? 'Gå nu!' : `Gå om ${ga} min`}</span>`
      : `<span class="pill ${min <= k.bussForv ? 'varn' : 'ok'}">${min <= 0 ? 'Går nu' : `om ${min} min`}</span>`;
    const ruta = (t, v) => `<div><span>${t}</span><b>${v}</b></div>`;
    return kh('mdi:bus-clock', 'Nästa buss', pill) + `
      <div class="buss-topp"><span class="buss-linje">${d.linje ? esc(d.linje) : ik('mdi:bus', 22)}</span><div><b>Mot ${esc(String(d.riktning).replace(/^mot\s+/i, ''))}</b><small>${d.laege ? 'Läge ' + esc(d.laege) : 'Från hållplatsen'}</small></div></div>
      <div class="buss-tid">${n ? `<b>${hm(n.t)}</b><span>avgår</span>` : '<span class="dim">Inga avgångar just nu</span>'}</div>
      ${d.avg.length > 1 ? `<div class="buss-sen">Sedan ${d.avg.slice(1, 4).map(x => hm(x.t)).join(' · ')}</div>` : ''}
      ${n ? `<div class="buss-kv">${d.gang ? ruta('Gå hemifrån', hm(new Date(n.t - d.gang * 6e4))) : ''}${ruta('Avgår om', `${min} min`)}${d.gang ? ruta('Gångtid', `${Math.round(d.gang)} min`) : d.laege ? ruta('Läge', esc(d.laege)) : ''}</div>` : ''}`;
  };
  R.busspaminn = (_, k) => {
    const p = A.bussP;
    if (!p) {
      const d = A.bussData(k), n = d && d.avg[0];
      // Förvald tid: en kvart efter nästa avgång, avrundat till närmaste kvart
      if (A.bussVal == null) { const b = n ? new Date(+n.t + 15 * 6e4) : new Date(Date.now() + 36e5); A.bussVal = (Math.ceil((b.getHours() * 60 + b.getMinutes()) / 15) * 15) % 1440; }
      const tid = `${String(Math.floor(A.bussVal / 60)).padStart(2, '0')}:${String(A.bussVal % 60).padStart(2, '0')}`;
      return `<div class="bp">${n ? `<button class="bp-nasta" data-a="bussnasta">${ik('mdi:bell-ring-outline', 17)}<span>Påminn om nästa buss <b>${hm(n.t)}</b><small>Säger till ${hm(new Date(n.t - k.bussForv * 6e4))}</small></span></button>` : ''}
        <div class="bp-l">${n ? 'Eller välj när du vill åka' : 'Välj när du vill åka'}</div><div class="bp-rad"><button class="bp-st" data-a="busstid" data-v="-15" aria-label="15 minuter tidigare">${ik('mdi:minus', 18)}</button>
          <b class="bp-tid">${tid}</b><button class="bp-st" data-a="busstid" data-v="15" aria-label="15 minuter senare">${ik('mdi:plus', 18)}</button>
          <button class="knapp prim bp-ok" data-a="busspaminn">${ik('mdi:bell-plus-outline', 16)}Påminn</button></div>
        <div class="buss-tips">${ik('mdi:information-outline', 15)}<span>Säger till ${k.bussForv} min innan sista bussen före ${tid}. <button class="bp-test" data-a="busstest">Testa rösten</button></span></div></div>`;
    }
    const d = A.bussData(k), m = d && A.bussMatch(k, d, p.t);
    return `<div class="buss-p-aktiv">${ik('mdi:bell-ring', 19)}<div><b>Vill åka ${hm(new Date(p.t))}</b><small>${m ? `Bussen ${hm(m.t)} · säger till ${hm(new Date(m.t - k.bussForv * 6e4))}` : `Väntar på en avgång strax före ${hm(new Date(p.t))}`}</small></div><button data-a="bussav">Ta bort</button></div>`;
  };
  // ═════════════ Elbilen ═════════════
  A.elbilData = (k) => {
    const c = k.elbil;
    if (!c) return null;
    const st = A.hass.states, stam = c.prefix;
    const hitta = (egen, re, dom = ['sensor']) => egen && S(egen) ? egen : !stam ? '' : Object.keys(st).find(id => dom.includes(id.split('.')[0]) && id.split('.')[1].startsWith(stam) && re.test(id.split('.')[1].slice(stam.length))) || '';
    const id = { batteri: hitta(c.batteri, /state_of_charge|soc|battery_level|batteri|battery$/), rackvidd: hitta(c.rackvidd, /electric_range|primary_engine_range|range|rackvidd/),
      laddstatus: hitta(c.laddstatus, /charging_state|charging_status|laddstatus|charging$/, ['sensor', 'binary_sensor']), effekt: hitta(c.effekt, /charging_power|laddeffekt|charge_power/),
      kabel: hitta(c.kabel, /plug_state|plug|kabel|cable|connected/, ['binary_sensor', 'sensor']), tid: hitta(c.tid, /remaining_charging_time|charging_complete|time_to_full|laddtid/),
      mal: hitta(c.mal, /target_state_of_charge|target_soc|charge_limit|charging_target/, ['sensor', 'number']), klimat: hitta(c.klimat, /climat|preheat|klimat|heater/, ['switch', 'climate', 'button']),
      laddbox: c.laddbox && S(c.laddbox) ? c.laddbox : '', las: hitta(c.las, /lock|las/, ['lock']), matare: hitta('', /mileage|odometer|matarstallning/) };
    const soc = tal(id.batteri), ladds = id.laddstatus ? String(S(id.laddstatus).state).toLowerCase() : '', effekt = id.effekt ? kw(id.effekt) : null;
    const laddar = (effekt != null && effekt > 0.3) || /^charging$|^laddar|charging_active|chargingactive|^on$/.test(ladds);
    const ks = id.kabel ? String(S(id.kabel).state).toLowerCase() : '', kabel = laddar || /^on$|connected|plugged|ansluten|locked/.test(ks) && !/disconnected|unplugged|not/.test(ks);
    let klar = null; if (id.tid) { const t = S(id.tid).state, d = Date.parse(t), m = parseFloat(t); klar = !isNaN(d) && /\d{4}-/.test(t) ? new Date(d) : !isNaN(m) && m > 0 ? new Date(Date.now() + m * 6e4) : null; }
    const mal = id.mal ? tal(id.mal) || 80 : 80, behov = soc == null ? null : Math.max(0, c.kap * (mal - soc) / 100), tim = behov == null ? null : behov / (effekt > 0.3 ? effekt : c.laddkw);
    if (laddar && !klar && tim) klar = new Date(Date.now() + tim * 36e5);
    // Billigaste timmarna att ladda (sammanhängande) inom elpriset som finns
    let billig = null; const el = k.el && A.elData(k);
    if (el && tim && tim > 0.1) { const n = Math.max(1, Math.ceil(tim)), f = el.fram;
      for (let i = 0; i + n - 1 < f.length; i++) { const w = f.slice(i, i + n); if (w[n - 1].i - w[0].i !== n - 1) continue; const p = w.reduce((a, x) => a + x.p, 0) / n; if (!billig || p < billig.p) billig = { p, fr: w[0], n }; }
      if (billig) billig.kr = billig.p * behov; }
    return { id, soc, rack: tal(id.rackvidd), laddar, kabel, effekt, klar, mal, behov, tim, billig, full: soc != null && soc >= mal - 1, klimatPa: id.klimat && ['on', 'heat', 'heat_cool', 'cool'].includes(S(id.klimat).state), last: id.las ? S(id.las).state : '' };
  };
  // Elbil i sidovy – SUV med sluttande tak, LED-ramp och laddlucka (ingen logga)
  A.bilSvg = (c, d) => {
    if (arBild(c.bild)) return `<img alt="" src="${esc(A.bildUrl(c.bild))}" style="width:100%;height:100%;object-fit:contain">`;
    const f = c.farg, glod = d.laddar ? '#3DDC84' : d.kabel ? '#5AA9FF' : '', n = A._bilN = (A._bilN || 0) + 1, id = (x) => `ab${n}${x}`;
    // Elektrisk SUV i sidovy (fronten åt höger): hög kaross, stora hjul, korta överhäng
    const kaross = 'M20 88c-4 0-6-2-6-6V62c0-5 1-9 4-12l5-5c3-3 8-5 13-6l12-2c8-9 18-14 30-16 26-3 56-3 76-1 11 1 19 5 27 12l12 10c14 1 26 3 36 7 8 3 12 8 13 15l1 10c0 5-2 8-6 8h-11a26 26 0 0 0-52 0H102a26 26 0 0 0-52 0z';
    const hjul = (x) => `<ellipse cx="${x}" cy="108" rx="27" ry="3.6" fill="rgba(0,0,0,.38)" filter="url(#a-blur)"/>
        <circle cx="${x}" cy="88" r="21.5" fill="#0F1013"/><circle cx="${x}" cy="88" r="19.6" fill="none" stroke="#25272C" stroke-width="2.2"/>
        <circle cx="${x}" cy="88" r="15.5" fill="url(#${id('f')})"/>
        ${Array.from({ length: 10 }, (_, i) => `<path d="M${x - 1.2} 88L${x - 2.3} 73.6h4.6L${x + 1.2} 88z" fill="${i % 2 ? '#2A2D33' : '#D3D7DC'}" transform="rotate(${i * 36} ${x} 88)"/>`).join('')}
        <path d="M${x - 10.5} 79a13 13 0 0 1 10.5-5" fill="none" stroke="#F07A1E" stroke-width="3.4" stroke-linecap="round"/>
        <circle cx="${x}" cy="88" r="4.4" fill="#1B1D21"/><circle cx="${x}" cy="88" r="1.8" fill="#9AA1AA"/>`;
    return `<svg viewBox="0 0 264 112" aria-hidden="true"><defs>
        <linearGradient id="${id('k')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="color-mix(in srgb, ${f} 50%, #fff)"/><stop offset=".3" stop-color="${f}"/><stop offset=".72" stop-color="color-mix(in srgb, ${f} 80%, #000)"/><stop offset="1" stop-color="color-mix(in srgb, ${f} 50%, #000)"/></linearGradient>
        <linearGradient id="${id('g')}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".42"/><stop offset=".66" stop-color="#fff" stop-opacity=".08"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
        <linearGradient id="${id('r')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#74808F"/><stop offset=".45" stop-color="#2C323B"/><stop offset="1" stop-color="#14171C"/></linearGradient>
        <radialGradient id="${id('f')}" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#EEF0F3"/><stop offset=".55" stop-color="#959CA5"/><stop offset="1" stop-color="#3A3E45"/></radialGradient></defs>
      <ellipse cx="132" cy="108" rx="124" ry="5.5" fill="rgba(0,0,0,.2)" filter="url(#a-blur)"/>
      ${glod ? `<circle class="r-glod" cx="218" cy="58" r="18" fill="${glod}" opacity=".5" filter="url(#a-blur)"/>` : ''}
      <path d="M58 21c30-4 64-5 96-3" fill="none" stroke="#B8BEC6" stroke-width="2.2" stroke-linecap="round"/>
      <path d="${kaross}" fill="url(#${id('k')})"/>
      <path d="M24 60c50-6 140-9 216-3" fill="none" stroke="url(#${id('g')})" stroke-width="7" stroke-linecap="round"/>
      <path d="M50 41c9-9 20-14 32-15 24-3 50-3 70-1 10 1 17 4 24 10l9 8c-45 2-90 2-135-2z" fill="url(#${id('r')})"/>
      <path d="M50 41c9-9 20-14 32-15 24-3 50-3 70-1 10 1 17 4 24 10l9 8" fill="none" stroke="#CDD2D9" stroke-width="1.4" opacity=".9"/>
      <path d="M78 27l-6 16M124 25v19M163 26l4 18" stroke="${f}" stroke-width="3.6"/><path d="M90 31c10-2 22-3 33-3" stroke="rgba(255,255,255,.28)" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M190 41c5-1 10 0 11 4l-10 2z" fill="#15171B"/>
      <path d="M124 47v35M171 47c-1 12-1 24 1 35M76 46c0 9 0 18 2 26" stroke="rgba(0,0,0,.3)" stroke-width="1.1"/>
      <rect x="140" y="55" width="13" height="2.6" rx="1.3" fill="rgba(255,255,255,.45)"/><rect x="95" y="55" width="13" height="2.6" rx="1.3" fill="rgba(255,255,255,.45)"/>
      <path d="M102 81h76v7h-76z" fill="#15171A" opacity=".9"/>
      <path d="M14 76h36v8H20c-4 0-6-2-6-5zM228 76h22c0 7-2 12-8 12h-14z" fill="#15171A" opacity=".85"/>
      <path d="M102 88a26 26 0 0 0-52 0M228 88a26 26 0 0 0-52 0" fill="none" stroke="#15171A" stroke-width="5"/>
      <path d="M15 53h11" stroke="#FF3B3B" stroke-width="3.6" stroke-linecap="round"/><path d="M15 53h11" stroke="#FF3B3B" stroke-width="8" stroke-linecap="round" opacity=".28" filter="url(#a-blur)"/>
      <path d="M233 53l15 5" stroke="#F4FAFF" stroke-width="3.2" stroke-linecap="round"/><path d="M231 58.5l17 2" stroke="#F4FAFF" stroke-width="1.4" stroke-linecap="round" opacity=".85"/>
      <circle cx="249" cy="58" r="7" fill="#EAF4FF" opacity=".35" filter="url(#a-blur)"/><path d="M246 64l4 1v11l-4 1z" fill="#15171A"/>
      <rect x="211" y="52" width="13" height="8.5" rx="2.2" fill="${glod || 'rgba(0,0,0,.28)'}" ${d.laddar ? 'class="r-led"' : ''}/>
      ${d.kabel ? `<path d="M217 60c3 16-4 30-17 44" fill="none" stroke="#1E1F23" stroke-width="3.6" stroke-linecap="round"/><rect x="213" y="57" width="8" height="6.5" rx="1.6" fill="#2A2C31"/>` : ''}
      ${hjul(76)}${hjul(202)}</svg>`;
  };
  R.elbil = (_, k) => {
    const c = k.elbil, d = A.elbilData(k);
    if (!d || d.soc == null) return kh('mdi:car-electric', esc(c.namn)) + tom('Hittar inte bilens batterinivå – kontrollera _elbil i mitt_hem', 'mdi:car-electric-outline');
    const status = d.laddar ? ['Laddar', 'ok'] : d.full && d.kabel ? ['Fulladdad', 'ok'] : d.kabel ? ['Ansluten', ''] : ['Ej ansluten', d.soc < 30 ? 'varn' : ''];
    const ebf = d.soc < 20 ? 'var(--fel)' : d.soc < 40 ? 'var(--varn)' : 'var(--ok)', rad = (ikon, t, v) => `<div>${ik(ikon, 15)}<span>${t}</span><b>${v}</b></div>`;
    const kl = (x) => `${String(x.h).padStart(2, '0')}–${String((x.h + (d.billig ? d.billig.n : 1)) % 24).padStart(2, '0')}`;
    const info = [d.laddar ? rad('mdi:lightning-bolt', 'Laddar', `${d.effekt != null ? kr(d.effekt, 1) + ' kW' : ''}`) : '',
      d.laddar && d.klar ? rad('mdi:flag-checkered', `Klar till ${Math.round(d.mal)} %`, `kl ${hm(d.klar)}`) : '',
      !d.laddar && !d.full && d.billig ? rad('mdi:piggy-bank-outline', 'Billigast att ladda', `${d.billig.fr.dag ? 'imorgon ' : ''}${kl(d.billig.fr)} · ≈ ${kr(d.billig.kr, 0)} kr`) : '',
      !d.laddar && !d.full && d.behov != null && !d.billig ? rad('mdi:battery-arrow-up-outline', `Till ${Math.round(d.mal)} %`, `${kr(d.behov, 0)} kWh`) : '',
      d.last && d.last !== 'locked' ? rad('mdi:car-key', 'Bilen', `<span style="color:var(--varn)">olåst</span>`) : ''].filter(Boolean).slice(0, 2).join('');
    const ruta = (t, v) => `<div>${t}<b>${v}</b></div>`;
    const mer = [d.behov != null && !d.full ? ruta(`Till ${Math.round(d.mal)} %`, `${kr(d.behov, 0)} kWh`) : '', d.billig && !d.laddar ? ruta('Kostar att ladda', `≈ ${kr(d.billig.kr, 0)} kr`) : '',
      d.id.matare && tal(d.id.matare) != null ? ruta('Mätarställning', `${Math.round(tal(d.id.matare)).toLocaleString('sv-SE')} km`) : '', d.last ? ruta('Lås', d.last === 'locked' ? 'Låst' : `<span style="color:var(--varn)">Olåst</span>`) : ''].filter(Boolean).slice(0, 4).join('');
    const knappar = [d.id.klimat ? `<button class="${d.klimatPa ? 'pa' : ''}" data-a="tj" data-d="${d.id.klimat.startsWith('button.') ? 'button.press' : d.id.klimat.startsWith('climate.') ? (d.klimatPa ? 'climate.turn_off' : 'climate.turn_on') : 'switch.toggle'}" data-e="${d.id.klimat}">${ik('mdi:fan', 15)}${d.klimatPa ? 'Förvärmer' : 'Förvärm'}</button>` : '',
      d.id.laddbox ? `<button class="${S(d.id.laddbox).state === 'on' ? 'pa' : ''}" data-a="tj" data-d="${d.id.laddbox.split('.')[0]}.toggle" data-e="${d.id.laddbox}">${ik('mdi:ev-station', 15)}${S(d.id.laddbox).state === 'on' ? 'Laddboxen på' : 'Starta laddning'}</button>` : ''].join('');
    return kh('mdi:car-electric', esc(c.namn), `<span class="pill ${status[1]}">${status[0]}</span>`) + `<div class="eb-topp"><div class="eb-bil" data-a="info" data-e="${d.id.batteri}">${A.bilSvg(c, d)}</div>
      <div class="eb-rad"><span class="eb-soc">${Math.round(d.soc)}<small> %</small></span>${d.rack != null ? `<span class="eb-rack"><b>${Math.round(d.rack)} km</b></span>` : ''}</div></div>
      <div class="eb-bar ${d.laddar ? 'laddar' : ''}" style="--ebf:${ebf}"><i style="width:${klamp(d.soc, 0, 100)}%"></i>${d.mal < 100 ? `<em style="left:${d.mal}%" data-t="${Math.round(d.mal)} %"></em>` : ''}</div>
      ${info ? `<div class="eb-info">${info}</div>` : ''}${mer ? `<div class="eb-mer">${mer}</div>` : ''}${knappar ? `<div class="eb-knappar">${knappar}</div>` : ''}`;
  };
  // ═════════════ Spabad ═════════════
  const SPALAGEN = [[/away|borta/i, 'borta', 'Borta'], [/super/i, 'super', 'Supersnål'], [/energy|eco|sn[aå]l|spar/i, 'snal', 'Snål'], [/weekend|helg/i, 'helg', 'Helg'], [/.*/, 'standard', 'Standard']];
  const spaLage = (x) => { const t = SPALAGEN.find(([re]) => re.test(String(x || ''))); return { typ: t[1], namn: /^(standard)$/i.test(x) || t[1] !== 'standard' ? t[2] : String(x) }; };
  const g5 = (x) => x == null ? '–' : (Math.round(x * 2) / 2).toLocaleString('sv-SE');
  A.spaMin = (k) => { const c = k.spa; if (!c) return null; const h = tal(c.minHjalp); return h != null ? h : c.minTemp; };
  A.spaData = (k) => {
    const c = k.spa; if (!c) return null;
    const st = A.hass.states, p = c.prefix;
    const alla = (dom, re) => Object.keys(st).filter(id => id.split('.')[0] === dom && (!p || id.split('.')[1].startsWith(p)) && (!re || re.test(id.split('.')[1])));
    const egna = (x) => lista(x).filter(y => S(y));
    const termostat = c.termostat && S(c.termostat) ? c.termostat : alla('climate')[0] || '';
    if (!termostat) return null;
    const lampor = c.lampa ? egna(c.lampa) : alla('light'), pumpar = c.pump ? egna(c.pump) : [...alla('switch', /pump|jet|blower|bubbl|massage/), ...alla('fan', /pump|jet|blower|bubbl|massage/)];
    const lageId = c.lage && S(c.lage) ? c.lage : alla('select', /watercare|lage|mode/)[0] || '';
    const t = S(termostat), at = t.attributes, online = !['unavailable', 'unknown'].includes(t.state);
    const o = A.vmOpt[termostat], mal = o && Date.now() < o.till ? o.t : at.temperature, temp = at.current_temperature;
    const lo = A.spaLageOpt && Date.now() < A.spaLageOpt.till ? A.spaLageOpt.v : '', lageNu = lo || (lageId ? S(lageId).state : ''), L = spaLage(lageNu);
    const varmer = online && (at.hvac_action === 'heating' || (at.hvac_action == null && temp != null && mal != null && temp < mal - .4 && t.state !== 'off'));
    const pumpPa = pumpar.some(x => S(x).state === 'on'), ls = lampor[0] && S(lampor[0]), ljus = !!ls && ls.state === 'on';
    const rgb = ls && ls.attributes.rgb_color, fargbar = !!ls && (ls.attributes.supported_color_modes || []).some(m => /rgb|hs|xy/.test(m));
    const bs = c.badar && S(c.badar), badar = bs ? ['on', 'true', 'detected', 'home', 'occupied'].includes(String(bs.state).toLowerCase()) : pumpPa;
    const sedanE = bs || (pumpar.map(x => S(x)).find(x => x.state === 'on')), sedan = badar && sedanE ? Date.parse(sedanE.last_changed) : null;
    // Planerat bad (input_datetime med datum och tid)
    let plan = null; const bt = S(c.badTid);
    if (bt) { const ts = bt.attributes.timestamp != null ? bt.attributes.timestamp * 1000 : Date.parse(String(bt.state).replace(' ', 'T'));
      if (ts && ts + c.efter * 36e5 > Date.now() && ts > Date.now() - 2 * 864e5) plan = { bad: ts, start: ts - c.forvarm * 36e5, slut: ts + c.efter * 36e5, vecka: S(c.badVecka) ? S(c.badVecka).state === 'on' : false, temp: tal(c.badTemp) ?? mal }; }
    const nu = Date.now(), fas = !plan ? '' : nu < plan.start ? 'vantar' : nu < plan.bad ? 'fore' : 'efter';
    const klar = varmer && temp != null && mal != null ? new Date(nu + Math.max(0, mal - temp) / c.takt * 36e5) : null;
    return { termostat, lampor, pumpar, lageId, alt: lageId ? (S(lageId).attributes.options || []) : [], lageNu, typ: L.typ, lageNamn: L.namn, online, temp, mal, varmer, pumpPa, ljus,
      ljusFarg: rgb ? `rgb(${rgb.join(',')})` : '#6FD0F2', fargbar, badar, sedan, plan, fas, klar, steg: at.target_temp_step || .5, status: (alla('sensor', /spa_status|status$/).map(x => S(x).state).find(x => !/connected/i.test(x)) || '') };
  };
  A.spaText = (d) => {
    const lock = d.typ === 'borta', klar = d.temp != null && d.mal != null && d.temp >= d.mal - .3;
    const pill = !d.online ? ['Ej ansluten', ''] : d.badar ? ['Någon badar', 'spa'] : lock ? ['Borta-läge', ''] : d.varmer ? [d.plan && d.fas !== 'vantar' ? `Värmer till ${hm(new Date(d.plan.bad))}` : 'Värmer', 'varn']
      : d.fas === 'vantar' ? [`Bad kl ${hm(new Date(d.plan.bad))}`, 'spa'] : lock ? ['Borta-läge', ''] : klar ? ['Redo att bada', 'ok'] : [d.lageNamn, ''];
    const min = d.sedan ? Math.max(1, Math.round((Date.now() - d.sedan) / 6e4)) : 0;
    const sub = !d.online ? 'Spabadet svarar inte' : d.badar ? `${d.pumpPa ? 'Bubblor' : 'Bad'}${d.ljus ? ' och ljus' : ''} på${min ? ` · ${min} min` : ''}` : lock ? 'Locket på · sparar energi' : d.varmer ? (d.klar ? `Klar ca ${hm(d.klar)}` : 'Värmer upp')
      : d.fas === 'vantar' ? `${d.typ === 'snal' || d.typ === 'super' ? 'Energisnålt' : `Hålls på ${g5(d.mal)}°`} tills ${hm(new Date(d.plan.start))}` : lock ? 'Locket på · sparar energi'
      : d.fas === 'fore' && klar ? `Klart till badet ${hm(new Date(d.plan.bad))}` : d.typ === 'snal' || d.typ === 'super' ? 'Sparar energi' : `Stabil · hålls på ${g5(d.mal)}°`;
    const hem = !d.online ? 'Ej ansluten' : d.badar ? `Badar · ${g5(d.temp)}°` : lock ? `Borta · ${g5(d.temp)}°` : d.varmer ? `Värmer · ${g5(d.temp)}° → ${g5(d.mal)}°` : d.fas === 'vantar' ? `Bad ${hm(new Date(d.plan.bad))} · ${g5(d.temp)}°`
      : lock ? `Borta · ${g5(d.temp)}°` : `${klar ? 'Redo' : d.lageNamn} · ${g5(d.temp)}°`;
    return { pill, sub, hem, lock, klar };
  };
  // Spabad snett framifrån: träpanel med display, akrylskal, vatten, ånga, bubblor, ljus, lock och badande
  A.spaSvg = (c, d) => {
    const n = A._spaN = (A._spaN || 0) + 1, id = (x) => `sp${n}${x}`, lock = d.typ === 'borta', snal = d.typ === 'snal' || d.typ === 'super';
    const tra = c.farg, ljus = d.ljus && !lock ? d.ljusFarg : '', vatten = ljus || (snal ? '#3E9FC0' : '#3FB6DA'), badar = d.badar && !lock, pump = d.pumpPa && !lock;
    const ikon = snal ? 'M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z'
      : lock ? 'M19 19H5V8h14m-3-7v2H8V1H6v2H5c-1.11 0-2 .89-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-1V1' : '';
    const skal = 'M44 44c2-6 6-8 12-8h152c6 0 10 2 12 8l20 30c2 4 0 8-5 8H29c-5 0-7-4-5-8z', vat = 'M60 47c1-3 3-4 6-4h132c3 0 5 1 6 4l14 22c1 3 0 5-3 5H49c-3 0-4-2-3-5z';
    const person = (x, y, hud, har, sk) => `<g transform="translate(${x} ${y}) scale(${sk})"><path d="M-15 13c0-9 6-13 15-13s15 4 15 13z" fill="${hud}"/><path d="M-3 0v-4h6v4" fill="${hud}"/>
        <circle cx="0" cy="-11" r="8.4" fill="${hud}"/><path d="${har}" fill="#2B2420"/></g>`;
    const t = d.temp == null ? '–' : g5(d.temp);
    return `<svg viewBox="0 0 264 150" aria-hidden="true"><defs>
        <linearGradient id="${id('t')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="color-mix(in srgb, ${tra} 85%, #fff)"/><stop offset=".25" stop-color="${tra}"/><stop offset="1" stop-color="color-mix(in srgb, ${tra} 55%, #000)"/></linearGradient>
        <linearGradient id="${id('s')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D7DCE0"/><stop offset="1" stop-color="#F6F7F8"/></linearGradient>
        <linearGradient id="${id('v')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="color-mix(in srgb, ${vatten} 55%, #062030)"/><stop offset=".6" stop-color="${vatten}"/><stop offset="1" stop-color="color-mix(in srgb, ${vatten} 60%, #fff)"/></linearGradient>
        <linearGradient id="${id('l')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4A4F55"/><stop offset="1" stop-color="#2A2E33"/></linearGradient>
        <filter id="${id('b')}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter><clipPath id="${id('c')}"><path d="${vat}"/></clipPath></defs>
      <ellipse cx="132" cy="140" rx="122" ry="7" fill="rgba(0,0,0,.45)" filter="url(#${id('b')})"/>
      ${ljus ? `<ellipse cx="132" cy="60" rx="120" ry="34" fill="${ljus}" opacity=".35" filter="url(#${id('b')})"/>` : ''}
      <path d="M24 78h216v52c0 5-3 8-8 8H32c-5 0-8-3-8-8z" fill="url(#${id('t')})"/>
      ${Array.from({ length: 17 }, (_, i) => `<path d="M${36 + i * 12} 84v50" stroke="rgba(0,0,0,.22)" stroke-width="1.2"/>`).join('')}
      <path d="M24 132h216v-3H24z" fill="rgba(0,0,0,.35)"/><path d="M24 80h216" stroke="rgba(255,255,255,.18)" stroke-width="1.5"/>
      <rect x="182" y="90" width="44" height="22" rx="6" fill="#121417" stroke="rgba(255,255,255,.12)"/>
      <text x="${ikon ? 198 : 204}" y="105.5" text-anchor="middle" font-family="Manrope, system-ui, sans-serif" font-size="10.5" font-weight="800" fill="${d.varmer ? '#F6A355' : '#7FD6F0'}" ${d.varmer ? 'class="sp-led"' : ''}>${t}°</text>
      ${ikon ? `<path d="${ikon}" transform="translate(211 95) scale(.5)" fill="${snal ? '#5FD39A' : '#9AA3AD'}"/>` : ''}
      ${lock ? `<path d="M40 42c2-7 7-10 14-10h156c7 0 12 3 14 10l22 32c3 5 0 9-6 9H24c-6 0-9-4-6-9z" fill="url(#${id('l')})"/>
        <path d="M132 32l-2 51" stroke="rgba(0,0,0,.45)" stroke-width="2"/><path d="M48 42c50-4 118-4 168 0" stroke="rgba(255,255,255,.14)" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M22 78h220" stroke="rgba(0,0,0,.35)" stroke-width="3"/><path d="M70 79v5M194 79v5" stroke="#1B1E22" stroke-width="5" stroke-linecap="round"/>`
      : `<path d="${skal}" fill="url(#${id('s')})"/><path d="M24 79h216" stroke="rgba(0,0,0,.18)" stroke-width="1.5"/>
        <path d="${vat}" fill="url(#${id('v')})"/>
        <g clip-path="url(#${id('c')})">
          <path d="M70 52c20-3 40 3 60 0s40-3 60 0" stroke="rgba(255,255,255,.35)" stroke-width="1.6" fill="none" class="sp-glitter"/>
          <path d="M60 64c25-3 45 3 70 0s45-3 75 0" stroke="rgba(255,255,255,.22)" stroke-width="1.4" fill="none" class="sp-glitter" style="animation-delay:-2s"/>
          ${ljus ? `<ellipse cx="132" cy="70" rx="70" ry="8" fill="#fff" opacity=".28" filter="url(#${id('b')})"/>` : ''}
          ${pump ? Array.from({ length: 16 }, (_, i) => `<circle class="sp-bubbla" cx="${62 + (i * 37) % 150}" cy="${50 + (i * 13) % 22}" r="${1.2 + (i % 3) * .7}" fill="#fff" opacity=".85" style="animation-delay:${(i * .27).toFixed(2)}s"/>`).join('')
            + [[80, 60], [186, 58], [132, 66]].map(([x, y], i) => `<ellipse class="sp-krus" cx="${x}" cy="${y}" rx="12" ry="3" fill="none" stroke="#fff" stroke-width="1" style="animation-delay:${i * 1.1}s"/>`).join('') : ''}
        </g>
        <path d="M52 40h160" stroke="rgba(255,255,255,.9)" stroke-width="1.5" stroke-linecap="round"/>
        <rect x="84" y="37.5" width="22" height="6" rx="3" fill="#3A3F45"/><rect x="158" y="37.5" width="22" height="6" rx="3" fill="#3A3F45"/>
        ${badar ? person(95, 56, '#E0AE88', 'M-8.6-12c0-7 4-9.6 8.6-9.6s8.6 2.6 8.6 9.6c-2-3-5-4.6-8.6-4.6s-6.6 1.6-8.6 4.6z', 1.25)
          + person(166, 57, '#C68A62', 'M-8.8-10c-1-8 3-11.5 8.8-11.5 6 0 10 3.5 8.8 11.5 3 4 3 10 1 13-1-6-3-10-2-14-2-2-5-3-7.8-3-3 0-6 1-8 3 1 4-1 8-2 14-2-3-2-9 1.2-13z', 1.28)
          + `<g clip-path="url(#${id('c')})"><rect x="0" y="60" width="264" height="30" fill="${vatten}" opacity=".82"/>
            <path d="M40 60.5c10-1.6 20 1.6 30 0s20-1.6 30 0 20 1.6 30 0 20-1.6 30 0 20 1.6 30 0 20-1.6 30 0" stroke="rgba(255,255,255,.6)" stroke-width="1.2" fill="none"/>
            ${pump ? Array.from({ length: 10 }, (_, i) => `<circle class="sp-bubbla" cx="${58 + (i * 41) % 150}" cy="${63 + (i * 7) % 9}" r="${1.3 + (i % 3) * .6}" fill="#fff" opacity=".9" style="animation-delay:${(i * .31).toFixed(2)}s"/>`).join('') : ''}</g>` : ''}
        ${d.temp != null && d.temp >= 34 ? `<g class="sp-anga" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="3" stroke-linecap="round"><path d="M92 36c-6-6 6-10 0-18"/><path d="M134 34c-6-6 6-10 0-18"/><path d="M174 36c-6-6 6-10 0-18"/></g>` : ''}`}
      </svg>`;
  };
  const SPAFARGER = [[176, 124, 255], [54, 185, 224], [79, 209, 139], [255, 111, 168], [240, 165, 74], [255, 255, 255]];
  R.spa = (_, k) => {
    const c = k.spa, d = A.spaData(k);
    if (!d) return kh('mdi:hot-tub', esc(c.namn)) + tom('Hittar inte spabadets termostat – kontrollera _spa i mitt_hem', 'mdi:hot-tub');
    const T = A.spaText(d), snal = d.typ === 'snal' || d.typ === 'super', tf = T.lock ? 'var(--dim)' : d.varmer ? 'var(--varn)' : d.fas === 'vantar' || snal ? '#5FD39A' : '#36B9E0';
    const glod = d.ljus && !T.lock ? d.ljusFarg : T.lock || !d.online ? 'transparent' : d.varmer ? '#F0A54A' : tf;
    const p = d.plan, nu = Date.now();
    let plan = '';
    if (p) { const a = Math.min(nu, p.start - 36e5), b = Math.max(p.bad, nu), pos = (x) => klamp((x - a) / (b - a) * 100, 0, 100), dag = new Date(p.bad).toDateString() === new Date().toDateString() ? 'ikväll' : new Date(p.bad).toLocaleDateString('sv-SE', { weekday: 'long' });
      plan = `<div class="sp-plan"><div class="sp-plan-t">${ik('mdi:calendar-clock', 16)}<span>Bad ${p.vecka ? 'varje ' + new Date(p.bad).toLocaleDateString('sv-SE', { weekday: 'long' }) : dag} ${hm(new Date(p.bad))}</span>
          <button data-a="spaplan" aria-label="Ändra">${ik('mdi:pencil-outline', 16)}</button><button data-a="spaplanav" aria-label="Ta bort">${ik('mdi:close', 16)}</button></div>
        <div class="sp-tl"><i style="left:0;width:${pos(p.start)}%" class="v"></i><i style="left:${pos(p.start)}%;width:${pos(p.bad) - pos(p.start)}%" class="h"></i><em style="left:${pos(nu)}%"></em></div>
        <div class="sp-tl-l"><span>${hm(new Date(a))}</span><span>${nu < p.start ? 'Börjar värma' : 'Värmer sedan'} ${hm(new Date(p.start))}</span><span>${hm(new Date(p.bad))}</span></div></div>`; }
    const knapp = (on, ikon, txt, attr, extra = '') => `<button class="${on ? 'pa' : ''}" ${attr} ${extra}>${ik(ikon, 19)}<span>${txt}</span></button>`;
    const pumpA = d.pumpar.length ? `data-a="tj" data-d="homeassistant.${d.pumpPa ? 'turn_off' : 'turn_on'}" data-e="${d.pumpar.join(',')}"` : 'disabled';
    const ljusA = d.lampor.length ? `data-a="tj" data-d="light.toggle" data-e="${d.lampor[0]}"` : 'disabled';
    const golv = A.spaMin(k), vidGolv = d.mal != null && d.mal <= golv + .01;
    return `<div class="sp-glod" style="--g:${glod}"></div>` + kh('mdi:hot-tub', esc(c.namn), `<span class="sp-kh"><span class="pill ${T.pill[1]}">${T.pill[0]}</span><button class="sp-inst" data-a="spainst" aria-label="Inställningar">${ik('mdi:cog-outline', 17)}</button></span>`) + `
      <div class="sp-bild" data-a="info" data-e="${d.termostat}">${A.spaSvg(c, d)}</div>
      <div class="sp-temp"><div class="sp-tnu" style="--tf:${tf}">${g5(d.temp)}<sup>°</sup></div>
        <div class="sp-steg"><button class="${vidGolv ? 'golv' : ''}" data-a="vmsteg" data-v="-1" data-e="${d.termostat}" aria-label="Sänk">${ik('mdi:minus', 16)}</button><b>${g5(d.mal)}°<small>mål</small></b><button data-a="vmsteg" data-v="1" data-e="${d.termostat}" aria-label="Höj">${ik('mdi:plus', 16)}</button></div></div>
      <div class="sp-sub">${ik(T.lock ? 'mdi:shield-home-outline' : d.varmer ? 'mdi:fire' : d.fas === 'vantar' || snal ? 'mdi:leaf' : 'mdi:check-circle-outline', 14)}<span>${T.sub}</span></div>
      ${d.varmer && !T.lock && d.mal != null && d.temp != null ? `<div class="sp-varm"><i style="width:${klamp(100 - (d.mal - d.temp) / 6 * 100, 4, 100)}%"></i></div>` : ''}
      <div class="sp-knappar">${knapp(d.badar, d.badar ? 'mdi:stop-circle-outline' : 'mdi:pool', d.badar ? 'Avsluta bad' : 'Bada nu', 'data-a="spabad"')}${knapp(d.pumpPa, 'mdi:chart-bubble', 'Bubblor', pumpA)}${knapp(d.ljus, 'mdi:lightbulb-on-outline', 'Ljus', ljusA, `style="--lf:${d.ljusFarg}"`)}</div>
      ${d.ljus && d.fargbar ? `<div class="sp-farger">${SPAFARGER.map(f => `<button data-a="tj" data-d="light.turn_on" data-e="${d.lampor[0]}" data-x='{"rgb_color":[${f}]}' style="background:rgb(${f})" aria-label="Färg"></button>`).join('')}</div>` : ''}
      ${(() => { const visa = c.lagen.map(t => d.alt.find(x => spaLage(x).typ === t)).filter(Boolean);
        return visa.length ? `<div class="sp-lagen" style="grid-template-columns:repeat(${Math.min(visa.length, 3)}, minmax(0, 1fr))">${visa.map(x => `<button class="${x === d.lageNu ? 'pa' : ''}" data-a="spalage" data-v="${esc(x)}">${ik(spaLage(x).typ === 'borta' ? 'mdi:shield-home-outline' : 'mdi:hot-tub', 16)}${esc(spaLage(x).namn)}</button>`).join('')}</div>` : ''; })()}
      ${plan || `<button class="sp-planknapp" data-a="spaplan">${ik('mdi:calendar-clock', 16)}Planera bad</button>`}`;
  };
  // Inställningar för spabadet: lägsta temperatur
  A.spaInst = (k) => {
    const c = k.spa, d = A.spaData(k);
    if (!d) return;
    if (!S(c.minHjalp)) return A.meddela(`Skapa hjälparen ${c.minHjalp} (nummer, 20–40, steg 0,5) för att kunna ändra lägsta temperatur – just nu ${g5(c.minTemp)}°. Se instruktionsboken, avsnittet Spabad.`);
    document.getElementById('aura-spainst')?.remove();
    const mork = k.tema !== 'ljus', noir = k.tema === 'noir';
    const T = noir ? { bg: '#141210', y2: '#1E1B17', tx: '#F5EFE6', dim: 'rgba(245,239,230,.6)', acc: k.accent || '#D4AF7A' } : mork ? { bg: '#111427', y2: '#1A1E36', tx: '#EEF0FF', dim: 'rgba(238,240,255,.6)', acc: k.accent || '#7568FF' }
      : { bg: '#FBF9F5', y2: '#F2EDE5', tx: '#1E1A15', dim: 'rgba(30,26,21,.58)', acc: k.accent || '#B07D3A' };
    const a = S(c.minHjalp).attributes, lo = +a.min || 20, hi = +a.max || 40, steg = +a.step || 0.5;
    const v = { min: A.spaMin(k) };
    const m = document.createElement('div');
    m.id = 'aura-spainst';
    const rita = () => {
      m.innerHTML = `<style>
        #aura-spainst { position:fixed; inset:0; z-index:10000; display:grid; place-items:center; background:rgba(10,8,5,.45); backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px); font-family:Manrope,system-ui,sans-serif; color:${T.tx}; }
        #aura-spainst * { box-sizing:border-box; } #aura-spainst button { font:inherit; color:inherit; border:0; cursor:pointer; -webkit-tap-highlight-color:transparent; }
        .spi { width:min(380px, 94vw); padding:22px; border-radius:32px; background:${T.bg}; box-shadow:0 40px 100px rgba(0,0,0,.35); animation:spiupp .45s cubic-bezier(.22,1,.36,1) both; }
        @keyframes spiupp { from { transform:translateY(40px) scale(.97); opacity:0; } }
        @media (max-width:600px) { #aura-spainst { place-items:end center; } .spi { width:100vw; border-radius:32px 32px 0 0; padding-bottom:calc(22px + env(safe-area-inset-bottom, 0px)); } }
        .spi small { display:block; font-size:11.5px; font-weight:800; letter-spacing:.09em; text-transform:uppercase; color:${T.dim}; } .spi h2 { margin:4px 0 6px; font-size:21px; font-weight:800; letter-spacing:-.03em; }
        .spi p { margin:0 0 16px; font-size:13.5px; line-height:1.45; color:${T.dim}; font-weight:600; }
        .spi-st { display:flex; align-items:center; justify-content:center; gap:22px; padding:8px 0 4px; }
        .spi-st button { width:48px; height:48px; border-radius:16px; background:${T.y2}; display:grid; place-items:center; } .spi-st button:disabled { opacity:.3; cursor:default; }
        .spi-st b { font-size:46px; font-weight:800; letter-spacing:-.04em; min-width:120px; text-align:center; font-variant-numeric:tabular-nums; }
        .spi-ok { width:100%; margin-top:16px; padding:15px; border-radius:18px; font-weight:800; font-size:15px; background:${T.acc} !important; color:#fff !important; }
        .spi-av { width:100%; margin-top:6px; padding:10px; font-weight:800; font-size:13.5px; background:none; color:${T.dim} !important; }
      </style>
      <div class="spi"><small>${esc(c.namn)} · Inställningar</small><h2>Lägsta temperatur</h2>
        <p>Vattnet ställs aldrig lägre än så här – varken med − på kortet, när du planerar bad eller om någon sänker det i appen.</p>
        <div class="spi-st"><button data-s="ned" ${v.min - steg < lo - .01 ? 'disabled' : ''} aria-label="Sänk">${ik('mdi:minus', 20)}</button><b>${g5(v.min)}°</b><button data-s="upp" ${v.min + steg > hi + .01 ? 'disabled' : ''} aria-label="Höj">${ik('mdi:plus', 20)}</button></div>
        <button class="spi-ok" data-s="ok">Spara</button><button class="spi-av" data-s="stang">Avbryt</button></div>`;
    };
    rita();
    const stang = () => { m.style.transition = 'opacity .2s'; m.style.opacity = '0'; setTimeout(() => m.remove(), 200); };
    m.addEventListener('click', (e) => {
      if (e.target === m) return stang();
      const b = e.target.closest('[data-s]'); if (!b) return;
      const a2 = b.dataset.s; A.vibb(6);
      if (a2 === 'stang') return stang();
      if (a2 === 'ned') v.min = klamp(Math.round((v.min - steg) / steg) * steg, lo, hi);
      if (a2 === 'upp') v.min = klamp(Math.round((v.min + steg) / steg) * steg, lo, hi);
      if (a2 === 'ok') {
        A.tj('input_number', 'set_value', { entity_id: c.minHjalp, value: v.min });
        // Står målet under den nya gränsen höjs det direkt
        if (d.mal != null && d.mal < v.min) { A.vmOpt[d.termostat] = { t: v.min, till: Date.now() + 6000 }; A.tj('climate', 'set_temperature', { entity_id: d.termostat, temperature: v.min }); }
        A.meddela(`Lägsta temperatur ${g5(v.min)}°`); A.patchaAlla(); return stang();
      }
      rita();
    });
    document.body.appendChild(m);
  };
  // Planera bad: dag, tid, temperatur och om det ska upprepas varje vecka
  A.spaPlan = (k) => {
    const c = k.spa, d = A.spaData(k);
    if (!d) return;
    if (!S(c.badTid)) return A.meddela(`Skapa hjälparen ${c.badTid} (datum och tid) först – se instruktionsboken, avsnittet Spabad`);
    document.getElementById('aura-spaplan')?.remove();
    const mork = k.tema !== 'ljus', noir = k.tema === 'noir';
    const T = noir ? { bg: '#141210', y2: '#1E1B17', tx: '#F5EFE6', dim: 'rgba(245,239,230,.6)', acc: k.accent || '#D4AF7A' } : mork ? { bg: '#111427', y2: '#1A1E36', tx: '#EEF0FF', dim: 'rgba(238,240,255,.6)', acc: k.accent || '#7568FF' }
      : { bg: '#FBF9F5', y2: '#F2EDE5', tx: '#1E1A15', dim: 'rgba(30,26,21,.58)', acc: k.accent || '#B07D3A' };
    const fore = d.plan ? new Date(d.plan.bad) : null, nuMin = new Date().getHours() * 60 + new Date().getMinutes();
    const v = { dag: fore ? (fore.toDateString() === new Date().toDateString() ? 0 : 1) : nuMin > 19 * 60 + 30 ? 1 : 0, min: fore ? fore.getHours() * 60 + fore.getMinutes() : 20 * 60,
      temp: Math.max(d.plan ? d.plan.temp : d.mal || 38, A.spaMin(k)), vecka: d.plan ? d.plan.vecka : false };
    const hmm = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    const m = document.createElement('div');
    m.id = 'aura-spaplan';
    const rita = () => {
      if (v.dag === 0 && v.min <= nuMin) v.dag = 1;
      const dt = new Date(); dt.setDate(dt.getDate() + v.dag); dt.setHours(Math.floor(v.min / 60), v.min % 60, 0, 0);
      const vd = dt.toLocaleDateString('sv-SE', { weekday: 'long' });
      m.innerHTML = `<style>
        #aura-spaplan { position:fixed; inset:0; z-index:10000; display:grid; place-items:center; background:rgba(10,8,5,.45); backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px); font-family:Manrope,system-ui,sans-serif; color:${T.tx}; }
        #aura-spaplan * { box-sizing:border-box; } #aura-spaplan button { font:inherit; color:inherit; border:0; cursor:pointer; -webkit-tap-highlight-color:transparent; }
        .spp { width:min(400px, 94vw); max-height:88vh; overflow-y:auto; padding:22px; border-radius:32px; background:${T.bg}; box-shadow:0 40px 100px rgba(0,0,0,.35); animation:sppupp .45s cubic-bezier(.22,1,.36,1) both; scrollbar-width:none; }
        @keyframes sppupp { from { transform:translateY(40px) scale(.97); opacity:0; } }
        @media (max-width:600px) { #aura-spaplan { place-items:end center; } .spp { width:100vw; border-radius:32px 32px 0 0; padding-bottom:calc(22px + env(safe-area-inset-bottom, 0px)); } }
        .spp h2 { margin:0 0 6px; font-size:21px; font-weight:800; letter-spacing:-.03em; } .spp p { margin:0 0 16px; font-size:13.5px; line-height:1.45; color:${T.dim}; font-weight:600; }
        .spp-rad { display:grid; grid-auto-flow:column; grid-auto-columns:1fr; gap:6px; margin-bottom:8px; }
        .spp-rad button { padding:11px 4px; border-radius:14px; background:${T.y2}; font-weight:800; font-size:14px; } .spp-rad button.pa { background:${T.acc}; color:#fff; } .spp-rad button:disabled { opacity:.35; cursor:default; }
        .spp-st { display:flex; align-items:center; justify-content:space-between; padding:10px 0; border-top:1px solid color-mix(in srgb, ${T.tx} 9%, transparent); font-size:13.5px; font-weight:700; color:${T.dim}; }
        .spp-st b { color:${T.tx}; font-weight:800; } .spp-st .sg { display:flex; align-items:center; gap:10px; } .spp-st .sg button { width:32px; height:32px; border-radius:11px; background:${T.y2}; display:grid; place-items:center; }
        .spp-vxl { width:44px; height:26px; border-radius:99px; background:${T.y2}; position:relative; } .spp-vxl::after { content:''; position:absolute; top:3px; left:3px; width:20px; height:20px; border-radius:50%; background:${T.dim}; transition:.25s; }
        .spp-vxl.pa { background:${T.acc}; } .spp-vxl.pa::after { left:21px; background:#fff; }
        .spp-ok { width:100%; margin-top:16px; padding:15px; border-radius:18px; font-weight:800; font-size:15px; background:${T.acc} !important; color:#fff !important; }
        .spp-av { width:100%; margin-top:6px; padding:10px; font-weight:800; font-size:13.5px; background:none; color:${T.dim} !important; }
      </style>
      <div class="spp"><h2>När ska ni bada?</h2><p>${esc(c.namn)} hålls på ${g5(A.spaMin(k))}° och börjar värma ${kr(c.forvarm, c.forvarm % 1 ? 1 : 0)} timmar innan, så att det är ${g5(v.temp)}° när ni kliver i.</p>
        <div class="spp-rad">${['Idag', 'Imorgon'].map((x, i) => `<button class="${v.dag === i ? 'pa' : ''}" data-s="dag" data-v="${i}">${x}</button>`).join('')}</div>
        <div class="spp-rad">${[18, 19, 20, 21].map(h => `<button class="${v.min === h * 60 ? 'pa' : ''}" data-s="min" data-v="${h * 60}" ${v.dag === 0 && h * 60 <= nuMin ? 'disabled' : ''}>${h}:00</button>`).join('')}</div>
        <div class="spp-st"><span>Tid</span><span class="sg"><button data-s="flytta" data-v="-30">${ik('mdi:minus', 16)}</button><b>${hmm(v.min)}</b><button data-s="flytta" data-v="30">${ik('mdi:plus', 16)}</button></span></div>
        ${S(c.badTemp) ? `<div class="spp-st"><span>Temperatur</span><span class="sg"><button data-s="temp" data-v="-0.5">${ik('mdi:minus', 16)}</button><b>${g5(v.temp)}°</b><button data-s="temp" data-v="0.5">${ik('mdi:plus', 16)}</button></span></div>` : ''}
        <div class="spp-st"><span>Börjar värma</span><b>${hm(new Date(+dt - c.forvarm * 36e5))}</b></div>
        <div class="spp-st"><span>Tillbaka till ${g5(A.spaMin(k))}°</span><b>${hm(new Date(+dt + c.efter * 36e5))}</b></div>
        ${S(c.badVecka) ? `<div class="spp-st"><span>Varje ${vd}</span><button class="spp-vxl ${v.vecka ? 'pa' : ''}" data-s="vecka" aria-label="Upprepa varje vecka"></button></div>` : ''}
        <button class="spp-ok" data-s="ok">Planera bad ${v.dag ? vd : 'idag'} ${hmm(v.min)}</button><button class="spp-av" data-s="stang">Avbryt</button></div>`;
      return dt;
    };
    let dt = rita();
    const stang = () => { m.style.transition = 'opacity .2s'; m.style.opacity = '0'; setTimeout(() => m.remove(), 200); };
    m.addEventListener('click', (e) => {
      if (e.target === m) return stang();
      const b = e.target.closest('[data-s]'); if (!b) return;
      const a = b.dataset.s, x = +b.dataset.v; A.vibb(6);
      if (a === 'stang') return stang();
      if (a === 'dag') v.dag = x; if (a === 'min') v.min = x; if (a === 'vecka') v.vecka = !v.vecka;
      if (a === 'flytta') { v.min = (v.min + x + 1440) % 1440; }
      if (a === 'temp') v.temp = klamp(v.temp + x, A.spaMin(k), 40);
      if (a === 'ok') {
        const p2 = (z) => String(z).padStart(2, '0');
        A.tj('input_datetime', 'set_datetime', { entity_id: c.badTid, datetime: `${dt.getFullYear()}-${p2(dt.getMonth() + 1)}-${p2(dt.getDate())} ${p2(dt.getHours())}:${p2(dt.getMinutes())}:00` });
        if (S(c.badTemp)) A.tj('input_number', 'set_value', { entity_id: c.badTemp, value: v.temp });
        if (S(c.badVecka)) A.tj('input_boolean', v.vecka ? 'turn_on' : 'turn_off', { entity_id: c.badVecka });
        A.meddela(`Bad planerat ${hm(dt)} – ${c.namn.toLowerCase()} börjar värma ${hm(new Date(+dt - c.forvarm * 36e5))}`);
        return stang();
      }
      dt = rita();
    });
    document.body.appendChild(m);
  };
  A.spaPlanAv = (k) => {
    const c = k.spa, d = A.spaData(k);
    if (!d) return;
    A.tj('input_datetime', 'set_datetime', { entity_id: c.badTid, datetime: '2000-01-01 00:00:00' });
    if (S(c.badVecka)) A.tj('input_boolean', 'turn_off', { entity_id: c.badVecka });
    // Värmer redan inför badet → tillbaka till lägsta temperaturen
    if (d.plan && d.fas !== 'vantar') { const t = A.spaMin(k); A.vmOpt[d.termostat] = { t, till: Date.now() + 6000 }; A.tj('climate', 'set_temperature', { entity_id: d.termostat, temperature: t }); }
    A.meddela('Planerat bad borttaget');
  };
  R.solkort = (_, k) => {
    const d = A.solData(k);
    if (!d) return kh('mdi:solar-power-variant', 'Solceller') + tom('Hittar inte sensorerna – kontrollera _sol_effekt, _sol_idag och _batteri_niva i mitt_hem', 'mdi:solar-power-variant-outline');
    const pa = d.kw != null && d.kw > 0.05, max = d.max || Math.max(d.kw || 0, 1), fyll = klamp((d.kw || 0) / max * 100, 0, 100);
    const ruta = (t, v) => `<div><span>${t}</span><b>${v}</b></div>`, B = d.batt;
    const tidTxt = (t) => t == null || !isFinite(t) || t > 99 ? '' : t < 1 ? `${Math.max(1, Math.round(t * 60))} min` : `${Math.floor(t)} h ${String(Math.round((t % 1) * 60)).padStart(2, '0')} min`;
    const battHtml = !B ? '' : `<div class="batt-blk ${B.laddar ? 'laddar' : ''}"><div class="batt-ik" style="--soc:${klamp(B.soc ?? 0, 0, 100)}%;--bf:${B.soc == null ? 'var(--svag)' : B.soc < 20 ? 'var(--fel)' : B.soc < 50 ? 'var(--varn)' : 'var(--ok)'}"><i></i></div>
      <div><b>${B.soc != null ? Math.round(B.soc) + ' %' : '–'}</b><span>${B.laddar ? `Laddar ${kr(B.kw, 1)} kW` : B.ger ? `Ger ${kr(-B.kw, 1)} kW` : 'Vilar'}</span>${tidTxt(B.tim) ? `<small>${B.laddar ? 'Fullt om' : 'Räcker ca'} ${tidTxt(B.tim)}</small>` : ''}</div></div>`;
    if (!d.harSol) return kh('mdi:home-battery-outline', 'Batteri', `<span class="pill ${B.laddar ? 'ok' : B.ger ? 'varn' : ''}">${B.laddar ? 'Laddar' : B.ger ? 'Urladdning' : 'Vilar'}</span>`)
      + `<div class="sol-topp">${battHtml}</div><div class="kv sol-kv">${B.lagrat != null ? ruta('Lagrat nu', `${kr(B.lagrat, 1)} kWh`) : ''}${B.kap ? ruta('Kapacitet', `${kr(B.kap, 1)} kWh`) : ''}</div>`;
    return kh('mdi:solar-power-variant', B ? 'Sol & batteri' : 'Solceller', `<span class="pill ${pa ? 'ok' : ''}">${pa ? 'Producerar' : 'Vilar'}</span>`) + `
      <div class="sol-topp"><div class="sol-sol ${pa ? 'pa' : ''}">${A.vikon(pa ? 'sunny' : 'cloudy', 54)}</div>
        <div class="sol-v"><b>${d.kw != null ? kr(d.kw, d.kw < 10 ? 2 : 1) : '–'}<small> kW</small></b>
          <div class="sol-bar" style="--fyll:${fyll}%"><i></i></div><span>${d.over != null ? (d.over >= 0 ? `${kr(d.over, 1)} kW över till nätet` : `Huset tar ${kr(-d.over, 1)} kW från nätet`) : d.max ? `av ${kr(d.max, 1)} kW möjliga` : 'just nu'}</span></div>${battHtml}</div>
      <div class="kv sol-kv">${d.idag != null ? ruta('Producerat idag', `${kr(d.idag, 1)} kWh`) : ''}${d.prognos != null ? ruta('Prognos idag', `${kr(d.prognos, 1)} kWh`) : ''}
        ${d.salt != null ? ruta('Sålt idag', `${kr(d.salt, 1)} kWh`) : ''}${d.eget != null ? ruta('Eget bruk', `${Math.round(d.eget)} %`) : ''}
        ${d.varde != null ? ruta('Värde idag', `<span style="color:var(--acc)">≈ ${kr(d.varde, 0)} kr</span>`) : ''}</div>`;
  };
  R.elstat = (_, k) => {
    const d = A.elData(k);
    if (!d) return '';
    const t = (txt, v, f) => `<div><span>${txt}</span><b${f ? ` style="color:${f}"` : ''}>${v}</b></div>`, kl = (x) => x ? `<small> kl ${String(x.h).padStart(2, '0')}</small>` : '';
    const heltal = (v) => Math.round(v).toLocaleString('sv-SE');
    return `<div class="kv elkv">${t('Snitt idag', kr(d.snitt))}${t('Högst idag', kr(d.max) + kl(d.maxT))}${t('Lägst idag', kr(d.min) + kl(d.minT))}
      ${d.imorgonSnitt != null ? t('Snitt imorgon', kr(d.imorgonSnitt), d.imorgonSnitt < d.snitt ? 'var(--ok)' : d.imorgonSnitt > d.snitt * 1.1 ? 'var(--fel)' : '') : ''}
      ${d.idagKwh != null ? t('Förbrukat idag', `${kr(d.idagKwh, 1)}<small> kWh</small>`) : ''}${d.idagKr != null ? t('Kostnad idag', `${kr(d.idagKr, 0)}<small> kr</small>`) : ''}
      ${d.manad != null ? t('Månadskostnad', heltal(d.manad) + '<small> kr</small>', 'var(--acc)') : ''}${d.manadPrognos ? t('Prognos månad', '≈ ' + heltal(d.manadPrognos) + '<small> kr</small>') : ''}</div>`;
  };

  // Säkerhet-sidan
  const LARM = {
    disarmed: ['Larmet är av', 'var(--ok)', 'mdi:shield-check-outline'], armed_home: ['Larmat hemma', 'var(--varn)', 'mdi:shield-home'],
    armed_away: ['Larmat borta', 'var(--acc)', 'mdi:shield-lock'], armed_night: ['Larmat natt', 'var(--info)', 'mdi:shield-moon'],
    armed_vacation: ['Larmat semester', 'var(--acc)', 'mdi:shield-airplane'], armed_custom_bypass: ['Larmat', 'var(--varn)', 'mdi:shield-half-full'],
    arming: ['Larmar på …', 'var(--varn)', 'mdi:shield-sync'], pending: ['Ange koden!', 'var(--fel)', 'mdi:shield-alert'],
    disarming: ['Larmar av …', 'var(--ok)', 'mdi:shield-sync'], triggered: ['LARMET GÅR', 'var(--fel)', 'mdi:alarm-light']
  };
  R.larm = (_, k) => {
    const e = S(k.larm);
    if (!e) return kh('mdi:shield-outline', 'Larm') + tom('Hittar inte larmet – ändra _larm i mitt_hem', 'mdi:shield-off-outline');
    const s = e.state, a = e.attributes, [titel, farg, ikon] = LARM[s] || ['Larmet svarar inte', 'var(--svag)', 'mdi:shield-off-outline'];
    const tot = (s === 'arming' || s === 'pending') ? (+a.delay || 0) : 0, slut = tot ? Date.parse(e.last_changed) + tot * 1000 : 0;
    const f = a.supported_features || 0;
    const lagen = [['armed_home', 'Hemma', 'mdi:home-lock', 'alarm_arm_home', 1], ['armed_night', 'Natt', 'mdi:weather-night', 'alarm_arm_night', 4],
      ['armed_away', 'Borta', 'mdi:lock', 'alarm_arm_away', 2], ['armed_vacation', 'Semester', 'mdi:airplane', 'alarm_arm_vacation', 32]].filter(x => !f || (f & x[4]));
    lagen.unshift(['disarmed', 'Av', 'mdi:lock-open-variant-outline', 'alarm_disarm', 0]);
    const li = lagen.findIndex(x => x[0] === s);
    return `<div class="larm ${s.startsWith('armed') ? 'larmat' : ''} ${s === 'triggered' ? 'larmar' : ''}" style="--lf:${farg};--ln:${lagen.length};--li:${Math.max(0, li)}">
      ${kh('mdi:shield-home-outline', 'Larm')}
      <div class="larm-ring"><i></i><i></i><button class="larm-mitt" data-a="info" data-e="${e.entity_id}">
        ${tot ? `<svg viewBox="0 0 100 100"><circle class="ned-bak" cx="50" cy="50" r="46"/><circle class="ned-c" cx="50" cy="50" r="46" data-ned-c="${slut}" data-tot="${tot}"/></svg><b data-ned-s="${slut}"></b>` : ik(ikon, 46)}</button></div>
      <div class="larm-titel">${titel}</div>${(() => { const kl = s === 'disarmed' ? A.larmKoll(k) : [];
        if (!kl.length) return `<div class="dim">${s === 'disarmed' ? 'Avlarmat' : 'Ändrat'}${a.changed_by ? ' av ' + esc(a.changed_by) : ''} ${sedan(Date.parse(e.last_changed))}</div>`;
        const n = (t) => kl.filter(x => x.typ === t).length, txt = kl.length === 1 ? `${kl[0].namn} ${kl[0].txt}` : [n('oppen') && `${n('oppen')} ${n('oppen') === 1 ? 'öppen' : 'öppna'}`, n('olast') && `${n('olast')} olåst`, n('ej') && `${n('ej')} svarar inte`].filter(Boolean).join(' · ');
        return `<button class="larm-varn" data-a="larmkoll">${ik('mdi:alert-outline', 15)}${esc(txt)}</button>`; })()}
      ${A.larmLista(k, s)}
      <div class="seg">${li >= 0 ? '<span class="seg-i"></span>' : ''}${lagen.map(([lage, txt, i, tj]) =>
        `<button class="${s === lage ? 'pa' : ''}" data-a="larm" data-v="${tj}" data-k="${lage === 'disarmed' ? (a.code_format ? 1 : 0) : (a.code_arm_required && a.code_format ? 1 : 0)}">${ik(i, 20)}${txt}</button>`).join('')}</div></div>`;
  };
  // ═════════════ Händelser: senaste dygnet från HA:s logbok + Frigate ═════════════
  A.hand = { t: 0, rader: [], frigate: [], laddar: false, filter: minne('handfilter') || 'alla' };
  const FRIGATE_ETIKETT = { person: 'Person', car: 'Bil', dog: 'Hund', cat: 'Katt', bicycle: 'Cykel', motorcycle: 'Motorcykel', bird: 'Fågel', package: 'Paket', truck: 'Lastbil', bus: 'Buss', horse: 'Häst', face: 'Ansikte', license_plate: 'Registreringsskylt' };
  A.frigateUrl = (k, id, fil) => `/api/frigate/${k.frigate && k.frigate !== 'frigate' ? k.frigate + '/' : ''}notifications/${id}/${fil}`;
  A.handIds = (k) => [k.larm, ...k.dorrar, ...k.fonster, ...k.las, ...k.rorelse, ...k.larmgivare].filter(id => id && S(id));
  A.hamtaHand = async (k) => {
    const ids = A.handIds(k), senast = Math.max(0, ...ids.map(id => Date.parse(S(id).last_changed) || 0));
    if (A.hand.laddar || (Date.now() - A.hand.t < 60e3 && senast < A.hand.t)) return;
    A.hand.laddar = true;
    const fran = new Date(Date.now() - 864e5);
    try {
      if (ids.length) { const r = await A.hass.callWS({ type: 'logbook/get_events', start_time: fran.toISOString(), end_time: new Date().toISOString(), entity_ids: ids });
        A.hand.rader = Array.isArray(r) ? r : []; }
    } catch (e) { A.hand.rader = []; }
    // Frigate: kameror som användaren får se
    const kam = k.kameror.map(id => { const s = S(id); return s && (s.attributes.camera_name || id.replace('camera.', '')); }).filter(Boolean);
    if (k.frigate && kam.length && !A.hand.ingenFrigate) {
      try { const r = await A.hass.callWS({ type: 'frigate/events/get', instance_id: k.frigate, cameras: kam, after: Math.floor(fran / 1000), limit: 40 });
        const l = typeof r === 'string' ? JSON.parse(r) : r; A.hand.frigate = Array.isArray(l) ? l : []; }
      catch (e) { A.hand.frigate = []; if (/unknown|not found|invalid/i.test(String((e && (e.code || e.message)) || ''))) A.hand.ingenFrigate = true; }
    } else A.hand.frigate = [];
    A.hand.t = Date.now(); A.hand.laddar = false; A.patchaSnart();
  };
  A.handLista = (k) => {
    const anvNamn = {}; Object.keys(A.hass.states).filter(id => id.startsWith('person.')).forEach(id => { const u = S(id).attributes.user_id; if (u) anvNamn[u] = String(S(id).attributes.friendly_name || '').split(' ')[0]; });
    const typ = (id) => id === k.larm ? 'larm' : k.dorrar.includes(id) ? 'dorr' : k.fonster.includes(id) ? 'fonster' : k.las.includes(id) ? 'las' : k.rorelse.includes(id) ? 'rorelse' : k.larmgivare.includes(id) ? 'givare' : '';
    const kort = (id) => namn(id).replace(/\s*(öppning|oppning|kontakt|sensor|contact|opening|occupancy|rörelse|motion)$/i, '');
    const LARM = { armed_away: ['Larmet på – borta', 'mdi:shield-lock', 'var(--acc)'], armed_home: ['Larmet på – hemma', 'mdi:shield-home', 'var(--acc)'], armed_night: ['Larmet på – natt', 'mdi:shield-moon', 'var(--info)'],
      armed_vacation: ['Larmet på – semester', 'mdi:shield-airplane', 'var(--acc)'], disarmed: ['Larmet av', 'mdi:shield-off-outline', 'var(--ok)'], pending: ['Inpassering – ange kod', 'mdi:shield-alert', '#F08A24'],
      triggered: ['LARMET GICK', 'mdi:alarm-light', 'var(--fel)'], arming: ['Larmet slås på', 'mdi:shield-sync', 'var(--varn)'] };
    const ut = [], sistaRor = {};
    [...A.hand.rader].sort((a, b) => a.when - b.when).forEach(x => {
      const id = x.entity_id, t = typ(id), st = x.state, when = x.when * 1000, vem = anvNamn[x.context_user_id] || '';
      if (!t || !st || ['unavailable', 'unknown'].includes(st)) return;
      let r = null;
      if (t === 'larm' && LARM[st]) r = { titel: LARM[st][0], ikon: LARM[st][1], f: LARM[st][2], sub: vem ? `av ${vem}` : '', grupp: 'larm' };
      else if (t === 'dorr' || t === 'fonster') r = { titel: `${kort(id)} ${st === 'on' ? (t === 'dorr' ? 'öppnades' : 'öppnades') : 'stängdes'}`, ikon: st === 'on' ? (t === 'dorr' ? 'mdi:door-open' : 'mdi:window-open-variant') : (t === 'dorr' ? 'mdi:door-closed' : 'mdi:window-closed-variant'), f: st === 'on' ? 'var(--varn)' : 'var(--dim)', grupp: 'dorr' };
      else if (t === 'las') r = { titel: `${kort(id)} ${{ locked: 'låstes', unlocked: 'låstes upp', jammed: 'har fastnat', open: 'öppnades' }[st] || st}`, ikon: st === 'locked' ? 'mdi:lock' : 'mdi:lock-open-variant', f: st === 'locked' ? 'var(--ok)' : 'var(--varn)', sub: vem ? `av ${vem}` : '', grupp: 'dorr' };
      else if (t === 'rorelse' && st === 'on') { if (when - (sistaRor[id] || 0) < 10 * 6e4) { sistaRor[id] = when; return; } sistaRor[id] = when; r = { titel: `Rörelse – ${kort(id)}`, ikon: 'mdi:motion-sensor', f: 'var(--info)', grupp: 'dorr' }; }
      else if (t === 'givare' && st === 'on') r = { titel: `Larm: ${kort(id)}`, ikon: 'mdi:smoke-detector-alert', f: 'var(--fel)', grupp: 'larm' };
      if (r) ut.push(Object.assign(r, { when, id }));
    });
    const kamNamn = {}; k.kameror.forEach(id => { const s = S(id); if (s) kamNamn[s.attributes.camera_name || id.replace('camera.', '')] = namn(id); });
    A.hand.frigate.forEach(e => { const lab = FRIGATE_ETIKETT[e.label] || e.label || 'Rörelse', sc = (e.data && e.data.top_score) || e.top_score || e.score;
      ut.push({ when: e.start_time * 1000, titel: `${lab}${e.sub_label ? ' ' + (Array.isArray(e.sub_label) ? e.sub_label[0] : e.sub_label) : ''} · ${kamNamn[e.camera] || e.camera}`, ikon: e.label === 'car' ? 'mdi:car' : e.label === 'person' ? 'mdi:account' : 'mdi:cctv', f: 'var(--acc)',
        sub: [sc ? `${Math.round(sc * 100)} %` : '', (e.zones || []).join(', ')].filter(Boolean).join(' · '), grupp: 'kamera', frigate: e }); });
    return ut.sort((a, b) => b.when - a.when);
  };
  R.handelser = (_, k) => {
    A.hamtaHand(k);
    const alla = A.handLista(k), f = A.hand.filter, harKam = A.hand.frigate.length || alla.some(x => x.grupp === 'kamera');
    const FL = [['alla', 'Alla'], ['larm', 'Larm'], ['dorr', 'Dörrar'], ...(harKam ? [['kamera', 'Kameror']] : [])];
    const l0 = alla.filter(x => f === 'alla' || x.grupp === f), idag = new Date().toDateString();
    // Slå ihop: samma Frigate-sak vid samma kamera inom 15 min, och en dörr som öppnas och stängs inom 10 min
    const l = [];
    l0.forEach(x => { const sista = l[l.length - 1];
      if (sista && x.frigate && sista.frigate && sista.titel === x.titel && sista.fran - x.when < 15 * 6e4) { sista.fran = x.when; sista.alla.push(x.frigate); return; }
      if (sista && sista.id === x.id && sista.oppnad == null && /stängdes$/.test(sista.titel) && /öppnades$/.test(x.titel) && sista.when - x.when < 10 * 6e4) { sista.oppnad = x.when; sista.titel = sista.titel.replace(/ stängdes$/, ''); sista.sub = `Öppnades och stängdes · ${Math.max(1, Math.round((sista.when - x.when) / 6e4))} min`; return; }
      l.push(Object.assign({}, x, { fran: x.when, alla: x.frigate ? [x.frigate] : [] })); });
    let dag = '';
    const rader = l.slice(0, 60).map(x => { const d = new Date(x.when), ds = d.toDateString(), rub = ds !== dag ? `<div class="hand-dag">${ds === idag ? 'Idag' : 'Igår'}</div>` : ''; dag = ds;
      const n = x.alla.length, [vad, var_] = x.frigate ? x.titel.split(' · ') : [x.titel, ''];
      const titel = x.frigate ? `${vad}${n > 1 ? ` ×${n}` : ''}` : x.titel, sub = x.frigate ? [var_, n > 1 ? `${hm(new Date(x.fran))}–${hm(d)}` : x.sub].filter(Boolean).join(' · ') : x.sub;
      const inne = `<span class="tid">${hm(d)}</span><span class="hik" style="--hf:${x.f}">${ik(x.ikon, 16)}</span><span class="htx"><b>${esc(titel)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</span>`;
      return rub + (x.frigate ? `<button class="hand-rad" data-a="frigate" data-v="${esc(x.frigate.id)}">${inne}<span class="hand-bilder">${x.alla.slice(0, 3).filter(e => e.has_snapshot !== false).reverse().map(e => `<img alt="" loading="lazy" src="${A.frigateUrl(k, e.id, 'thumbnail.jpg')}">`).join('')}</span></button>`
        : `<button class="hand-rad" data-a="info" data-e="${x.id}">${inne}</button>`); }).join('');
    // Aktivitet per timme senaste dygnet
    const nuH = new Date(); nuH.setMinutes(0, 0, 0); const t0 = +nuH - 23 * 36e5, per = Array(24).fill(0);
    alla.forEach(x => { const i = Math.floor((x.when - t0) / 36e5); if (i >= 0 && i < 24) per[i]++; });
    const mx = Math.max(1, ...per), stapel = `<div class="hand-akt">${per.map((v, i) => `<i style="height:${Math.max(6, v / mx * 100).toFixed(0)}%" class="${v ? 'har' : ''} ${i === 23 ? 'nu' : ''}" title="${hh(new Date(t0 + i * 36e5))}: ${v}"></i>`).join('')}</div>
      <div class="hand-akt-t"><span>${hh(new Date(t0))}</span><span>${hh(new Date(t0 + 12 * 36e5))}</span><span>Nu</span></div>`;
    return kh('mdi:history', 'Händelser', '<span class="pill">24 h</span>') + stapel + `<div class="hand-filter">${FL.map(([v, t]) => `<button class="${f === v ? 'pa' : ''}" data-a="handfilter" data-v="${v}">${t}</button>`).join('')}</div>
      <div class="hand-lista">${rader || (A.hand.t ? tom(f === 'alla' ? 'Inget har hänt det senaste dygnet' : 'Inga händelser här', 'mdi:history') : '<div class="dim">Hämtar …</div>')}</div>`;
  };
  // Frigate-händelse i stort format: bild och videoklipp
  A.frigatePanel = (k, id) => {
    const e = A.hand.frigate.find(x => x.id === id);
    if (!e) return;
    document.getElementById('aura-frigate')?.remove();
    const mork = k.tema !== 'ljus', noir = k.tema === 'noir', bg = noir ? '#141210' : mork ? '#111427' : '#FBF9F5', tx = noir ? '#F5EFE6' : mork ? '#EEF0FF' : '#1E1A15', y2 = noir ? '#1E1B17' : mork ? '#1A1E36' : '#F2EDE5';
    const kn = k.kameror.find(c => S(c) && (S(c).attributes.camera_name || c.replace('camera.', '')) === e.camera), lab = FRIGATE_ETIKETT[e.label] || e.label, sc = (e.data && e.data.top_score) || e.top_score;
    const m = document.createElement('div');
    m.id = 'aura-frigate';
    m.style.cssText = `position:fixed;inset:0;z-index:10000;display:grid;place-items:center;background:rgba(10,8,5,.55);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);font-family:Manrope,system-ui,sans-serif;color:${tx};padding:12px;`;
    m.innerHTML = `<div style="width:min(760px,96vw);max-height:94vh;overflow:auto;border-radius:28px;background:${bg};box-shadow:0 40px 100px rgba(0,0,0,.4);padding:16px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px"><button data-v="x" style="width:40px;height:40px;border-radius:50%;border:0;background:${y2};color:${tx};font-size:18px;cursor:pointer">✕</button>
        <div><div style="font-size:11.5px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;opacity:.55">${esc(kn ? namn(kn) : e.camera)} · ${esc(new Date(e.start_time * 1000).toLocaleString('sv-SE', { weekday: 'short', hour: '2-digit', minute: '2-digit' }))}</div>
        <div style="font-size:21px;font-weight:800;letter-spacing:-.03em">${esc(lab)}${sc ? ` <span style="font-size:14px;opacity:.55">${Math.round(sc * 100)} %</span>` : ''}</div></div></div>
      ${e.has_clip ? `<video src="${A.frigateUrl(k, e.id, 'clip.mp4')}" poster="${A.frigateUrl(k, e.id, 'snapshot.jpg')}" controls autoplay muted playsinline style="width:100%;border-radius:18px;background:#000;display:block"></video>`
        : `<img alt="" src="${A.frigateUrl(k, e.id, 'snapshot.jpg')}" style="width:100%;border-radius:18px;display:block;background:#000">`}
      ${kn ? `<button data-v="live" style="width:100%;margin-top:12px;padding:14px;border-radius:16px;border:0;background:${y2};color:${tx};font:800 14px Manrope,sans-serif;cursor:pointer">Visa kameran live</button>` : ''}</div>`;
    m.addEventListener('click', (ev) => { if (ev.target === m) return m.remove(); const b = ev.target.closest('[data-v]'); if (!b) return; m.remove();
      if (b.dataset.v === 'live' && kn) A.info([...A.kort].find(x => x.isConnected) || document.body, kn); });
    document.body.appendChild(m);
  };
  // ═════════════ Markiser, gardiner, rullgardiner och garage ═════════════
  const PORTTYPER = ['markis', 'gardin', 'rullgardin', 'garage'];
  const PT = {
    markis: { o: 'Utfälld', c: 'Inrullad', opening: 'Fälls ut …', closing: 'Rullas in …', upp: 'Fäll ut', ner: 'Rulla in', ik: 'mdi:awning-outline', grupp: 'Markiser', en: 'markis', farg: '#3E5C76' },
    gardin: { o: 'Öppen', c: 'Fördragen', opening: 'Öppnas …', closing: 'Dras för …', upp: 'Öppna', ner: 'Dra för', ik: 'mdi:curtains', grupp: 'Gardiner', en: 'gardin', farg: '#D8CDBB' },
    rullgardin: { o: 'Uppe', c: 'Nere', opening: 'Går upp …', closing: 'Går ner …', upp: 'Upp', ner: 'Ner', ik: 'mdi:roller-shade', grupp: 'Rullgardiner', en: 'rullgardin', farg: '#CFC6B8' },
    garage: { o: 'Öppen', c: 'Stängd', opening: 'Öppnas …', closing: 'Stängs …', upp: 'Öppna', ner: 'Stäng', ik: 'mdi:garage-variant', grupp: 'Garage', en: 'port', farg: '#E6E4DF' } };
  const PORTFARGER = ['#3E5C76', '#2F4858', '#1F2A36', '#7A1F2B', '#C8553D', '#D9A441', '#5B7553', '#8A8F98', '#D8CDBB', '#F4F1EA', '#2B2B2E', '#6B4A33'];
  A.portInfo = (k, x) => {
    const s = S(x.e);
    if (!s) return null;
    const a = s.attributes, st = s.state, pos = a.current_position;
    const p = pos != null ? klamp(+pos, 0, 100) : st === 'open' ? 100 : st === 'closed' ? 0 : st === 'opening' ? 60 : st === 'closing' ? 40 : 0;
    const T = PT[x.typ] || PT.rullgardin, rorlig = st === 'opening' || st === 'closing';
    const txt = rorlig ? T[st] : ['unavailable', 'unknown'].includes(st) ? 'Svarar inte' : p <= 0 ? T.c : p >= 100 ? T.o : x.typ === 'rullgardin' ? `${p} % uppe` : `${T.o} ${p} %`;
    return { s, p, txt, rorlig, oppen: p > 0 || st === 'open', farg: minne('portfarg.' + x.e) || x.farg || T.farg, randig: (minne('portrand.' + x.e) ?? (x.randig ? '1' : '')) === '1',
      namn: x.namn || namn(x.e), pos: pos != null && (a.supported_features & 4), T, av: ['unavailable', 'unknown'].includes(st) };
  };
  // Ritad bild som följer läget (p = 0 stängd/inrullad … 100 öppen/utfälld)
  A.portSvg = (typ, p, f, o = {}) => {
    const n = A._portN = (A._portN || 0) + 1, id = (x) => `ap${n}${x}`, q = klamp(p, 0, 100) / 100;
    const himmel = `<linearGradient id="${id('h')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9CC7EC"/><stop offset="1" stop-color="#E8F3FB"/></linearGradient>`;
    const fonster = (x, y, w, hh_) => `<rect x="${x}" y="${y}" width="${w}" height="${hh_}" rx="3" fill="url(#${id('h')})"/><path d="M${x + w / 2} ${y}v${hh_}M${x} ${y + hh_ / 2}h${w}" stroke="#F4F2EE" stroke-width="2.4"/>
      <rect x="${x}" y="${y}" width="${w}" height="${hh_}" rx="3" fill="none" stroke="#F4F2EE" stroke-width="3"/>`;
    if (typ === 'markis') {
      const L = 4 + 62 * q, by = 20 + L, strip = 10;
      const tyg = Array.from({ length: strip }, (_, i) => { const t0 = 12 + i * 96 / strip, t1 = t0 + 96 / strip, b0 = 4 + i * 112 / strip, b1 = b0 + 112 / strip;
        return `<path d="M${t0} 20L${t1} 20L${b1} ${by}L${b0} ${by}z" fill="${o.randig && i % 2 ? '#F6F2EA' : f}"/>`; }).join('');
      const kant = Array.from({ length: 11 }, (_, i) => `<path d="M${4 + i * 112 / 11} ${by + 2}h${112 / 11}v5a${112 / 22} ${112 / 22} 0 0 1-${112 / 11} 0z" fill="${o.randig && i % 2 ? '#F6F2EA' : f}"/>`).join('');
      return `<svg viewBox="0 0 120 100" aria-hidden="true"><defs>${himmel}<linearGradient id="${id('s')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".28"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient></defs>
        ${fonster(36, 46, 48, 46)}<ellipse cx="60" cy="97" rx="${10 + 50 * q}" ry="3" fill="rgba(0,0,0,${(.1 + .12 * q).toFixed(2)})" filter="url(#a-blur)"/>
        ${q > .04 ? `<path d="M18 22L8 ${by}M102 22L112 ${by}" stroke="#55585E" stroke-width="2"/>` : ''}
        ${tyg}<path d="M12 20H108L116 ${by}H4z" fill="url(#${id('s')})"/>${kant}
        <rect x="3" y="${by - 1}" width="114" height="4" rx="2" fill="url(#a-metall)"/><rect x="9" y="12" width="102" height="9" rx="4" fill="url(#a-metall)" filter="url(#a-skugga)"/></svg>`;
    }
    if (typ === 'gardin') {
      const w = 9 + 43 * (1 - q), veck = (x0, b) => { const k = Math.max(2, Math.round(b / 7)); return Array.from({ length: k }, (_, i) => `<rect x="${(x0 + i * b / k).toFixed(1)}" y="12" width="${(b / k).toFixed(1)}" height="84" fill="url(#${id('v')})"/>`).join(''); };
      const ringar = (x0, b) => { const r = Math.max(2, Math.round(b / 9)); return Array.from({ length: r }, (_, i) => `<circle cx="${(x0 + 2 + i * (b - 4) / (r - 1)).toFixed(1)}" cy="10" r="2.2" fill="none" stroke="#8C877F" stroke-width="1.2"/>`).join(''); };
      return `<svg viewBox="0 0 120 100" aria-hidden="true"><defs>${himmel}<linearGradient id="${id('v')}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".2"/><stop offset=".5" stop-color="#fff" stop-opacity=".18"/><stop offset="1" stop-color="#000" stop-opacity=".2"/></linearGradient></defs>
        ${fonster(16, 14, 88, 78)}<rect x="4" y="8" width="112" height="3" rx="1.5" fill="url(#a-metall)"/><circle cx="4" cy="9.5" r="3" fill="url(#a-metall)"/><circle cx="116" cy="9.5" r="3" fill="url(#a-metall)"/>
        <g filter="url(#a-skugga)"><path d="M6 12h${w}v84c-${w / 2} 2-${w} 0-${w} 0z" fill="${f}"/><path d="M${114 - w} 12h${w}v84c-${w / 2} 2-${w} 0-${w} 0z" fill="${f}"/></g>
        ${veck(6, w)}${veck(114 - w, w)}${ringar(6, w)}${ringar(114 - w, w)}</svg>`;
    }
    if (typ === 'garage') {
      const H = 70 * (1 - q), lam = 70 / 5;
      return `<svg viewBox="0 0 120 100" aria-hidden="true"><defs><linearGradient id="${id('d')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="color-mix(in srgb, ${f} 92%, #fff)"/><stop offset="1" stop-color="color-mix(in srgb, ${f} 82%, #000)"/></linearGradient></defs>
        <path d="M2 30L60 4l58 26v66H2z" fill="rgba(128,128,128,.14)"/><rect x="12" y="24" width="96" height="72" rx="2" fill="#17191D"/>
        ${q > .05 ? `<rect x="22" y="${96 - 26}" width="76" height="22" rx="9" fill="#2C3038"/><circle cx="36" cy="94" r="6" fill="#0E0F12"/><circle cx="84" cy="94" r="6" fill="#0E0F12"/><rect x="30" y="${96 - 34}" width="58" height="12" rx="6" fill="#262A31"/>
          <rect x="12" y="24" width="96" height="3" fill="#FFE6A8" opacity="${(.4 * q).toFixed(2)}"/>` : ''}
        <rect x="8" y="20" width="104" height="5" rx="1" fill="url(#a-metall)"/>
        ${H > .5 ? `<g filter="url(#a-skugga)"><rect x="13" y="25" width="94" height="${H.toFixed(1)}" fill="url(#${id('d')})"/>
          ${Array.from({ length: 5 }, (_, i) => 25 + (i + 1) * lam - (70 - H)).filter(y => y > 25.5 && y < 25 + H - .5).map(y => `<path d="M13 ${y.toFixed(1)}h94" stroke="rgba(0,0,0,.18)" stroke-width="1.2"/><path d="M13 ${(y + 1.2).toFixed(1)}h94" stroke="rgba(255,255,255,.35)" stroke-width=".8"/>`).join('')}
          ${q < .05 ? '<rect x="52" y="86" width="16" height="3" rx="1.5" fill="rgba(0,0,0,.35)"/>' : ''}</g>` : ''}
        ${o.rorlig ? `<rect class="r-led" x="102" y="14" width="6" height="4" rx="2" fill="#F5A623"/>` : ''}</svg>`;
    }
    // Rullgardin
    const H = 2 + 80 * (1 - q);
    return `<svg viewBox="0 0 120 100" aria-hidden="true"><defs>${himmel}<linearGradient id="${id('r')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".12"/><stop offset=".15" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".08"/></linearGradient></defs>
      ${fonster(16, 12, 88, 82)}<g filter="url(#a-skugga)"><rect x="17" y="12" width="86" height="${H.toFixed(1)}" fill="${f}"/></g><rect x="17" y="12" width="86" height="${H.toFixed(1)}" fill="url(#${id('r')})"/>
      <rect x="15" y="${(10 + H).toFixed(1)}" width="90" height="4" rx="2" fill="url(#a-metall)"/><path d="M60 ${(14 + H).toFixed(1)}v6" stroke="#8C877F" stroke-width="1.2"/><circle cx="60" cy="${(22 + H).toFixed(1)}" r="2.2" fill="none" stroke="#8C877F" stroke-width="1.4"/>
      <rect x="11" y="6" width="98" height="8" rx="4" fill="url(#a-metall)" filter="url(#a-skugga)"/></svg>`;
  };
  // ═════════════ Smarta förslag för markis, gardiner, rullgardiner och garage ═════════════
  A.portForslag = (k) => {
    if (!k.portar.length) return [];
    const nu = Date.now(), d = new Date(), h = d.getHours(), dag = d.toDateString(), ut = [];
    const lst = k.portar.map(x => ({ x, d: A.portInfo(k, x) })).filter(y => y.d && !y.d.av);
    const pers = Object.keys(A.hass.states).filter(id => id.startsWith('person.')), hemma = !pers.length || pers.some(id => S(id).state === 'home');
    const sol = S('sun.sun'), solUpp = sol ? sol.state === 'above_horizon' : h >= 7 && h < 19, el = sol && sol.attributes.elevation;
    const w = S(k.vader), tim = k.vader && w ? A.prognos(k.vader, 'hourly') : [], enh = w && w.attributes.wind_speed_unit, vi = A.vind(k);
    const lista = (l) => l.length > 1 ? l.slice(0, -1).join(', ') + ' och ' + l[l.length - 1] : l[0] || '';
    // Garage
    lst.filter(y => y.x.typ === 'garage' && y.d.oppen && !y.d.rorlig).forEach(({ x, d: g }) => {
      const min = Math.floor((nu - Date.parse(g.s.last_changed)) / 6e4), sent = h >= 22 || h < 6, borta = pers.length && !pers.some(id => S(id).state === 'home');
      if (min >= k.oppenMin || sent || borta) ut.push({ prio: 1, nyckel: `garage:${x.e}:${g.s.last_changed}`, ikon: 'mdi:garage-open-variant', f: 'var(--varn)', t: `${g.namn} står öppen`,
        s: borta ? 'Ingen är hemma. Stänga porten?' : sent ? 'Det är sent – stäng porten innan natten.' : `Den har varit öppen i ${min < 60 ? min + ' min' : Math.floor(min / 60) + ' h'}.`,
        knapp: 'Stäng', a: `data-a="tj" data-d="cover.close_cover" data-e="${x.e}"` });
    });
    // Markisen: blåst eller regn nu eller inom de närmaste timmarna
    const ute = lst.filter(y => y.x.typ === 'markis' && y.d.oppen && !y.d.rorlig);
    if (ute.length) {
      const vMs = (f) => Math.max(tillMs(f.wind_speed, enh) || 0, (tillMs(f.wind_gust_speed, enh) || 0) / 1.45);
      const blastNu = vi && (vi.ms >= k.portVind || (vi.byar || 0) >= k.portVind * 1.45);
      const kommande = tim.slice(0, 4).find(f => Date.parse(f.datetime) > nu - 36e5 && vMs(f) >= k.portVind);
      const regn = tim.slice(0, 3).find(f => Date.parse(f.datetime) < nu + 2.5 * 36e5 && ((f.precipitation || 0) >= 0.3 || /rain|pour|hail|lightning/.test(f.condition || '')));
      const namn_ = lista(ute.map(y => y.d.namn));
      if (blastNu || kommande || regn) {
        const t = blastNu ? `Det blåser ${Math.round(Math.max(vi.ms, (vi.byar || 0)))} m/s` : kommande ? `Det börjar blåsa kl ${hh(new Date(kommande.datetime))}` : `Regn väntas kl ${hh(new Date(regn.datetime))}`;
        ut.push({ prio: 1, nyckel: `markis:${dag}:${blastNu ? 'nu' : kommande ? 'vind' + hh(new Date(kommande.datetime)) : 'regn'}`, ikon: blastNu || kommande ? 'mdi:weather-windy' : 'mdi:weather-pouring', f: 'var(--varn)', t,
          s: `${namn_} är utfälld${ute.length > 1 ? 'a' : ''}${kommande && !blastNu ? `, upp till ${Math.round(vMs(kommande))} m/s` : ''}. Rulla in så att den inte tar skada.`, knapp: 'Rulla in', a: 'data-a="portlage" data-v="in"' });
      }
    }
    const inne = lst.filter(y => (y.x.typ === 'gardin' || y.x.typ === 'rullgardin') && y.x.lagen);
    // Solskydd: soligt mitt på dagen och varmt inne eller ute
    if (inne.length && solUpp && h >= 10 && h < 18 && (el == null || el > 12) && w && /sunny|partlycloudy/.test(w.state)) {
      const tIn = tal(k.inne), tUt = w.attributes.temperature, varmt = (tIn != null && tIn >= k.portSolTemp) || (tUt != null && tUt >= 20);
      const uppe = inne.filter(y => y.d.p > Math.max(k.portSolLage, 40));
      if (varmt && uppe.length) ut.push({ prio: 2, nyckel: `solskydd:${dag}`, ikon: 'mdi:weather-sunny', f: 'var(--acc)', t: 'Solen ligger på',
        s: `${tIn != null ? `${kr(tIn, 1)}° inne` : `${Math.round(tUt)}° ute`}. Dra ner ${inne.some(y => y.x.typ === 'rullgardin') ? 'rullgardinerna' : 'gardinerna'} för att hålla svalt?`, knapp: 'Solskydd', a: 'data-a="portlage" data-v="sol"' });
    }
    // Kväll: mörkt ute och något står öppet
    if (inne.length && !solUpp && (h >= 16 || h < 2)) {
      const oppna = inne.filter(y => y.d.p > 0);
      if (oppna.length) ut.push({ prio: 2, nyckel: `portkvall:${new Date(nu - (h < 2 ? 864e5 : 0)).toDateString()}`, ikon: 'mdi:weather-night', f: 'var(--info)', t: 'Det har blivit mörkt',
        s: `${oppna.length === 1 ? oppna[0].d.namn + ' är' : oppna.length + ' gardiner och rullgardiner är'} fortfarande ${oppna.length === 1 ? 'öppen' : 'öppna'}. Dra för för natten?`, knapp: 'God natt', a: 'data-a="portlage" data-v="natt"' });
    }
    // Morgon: ljust ute, någon är hemma och allt är fördraget
    if (inne.length && solUpp && h >= 6 && h < 11 && hemma) {
      const stangda = inne.filter(y => y.d.p < 10);
      if (stangda.length && stangda.length >= inne.length / 2) ut.push({ prio: 2, nyckel: `portmorgon:${dag}`, ikon: 'mdi:weather-sunset-up', f: 'var(--acc)', t: 'God morgon!',
        s: `Solen är uppe. Dra upp ${stangda.length === 1 ? stangda[0].d.namn.toLowerCase() : 'gardinerna och rullgardinerna'}?`, knapp: 'God morgon', a: 'data-a="portlage" data-v="morgon"' });
    }
    return ut;
  };
  // Lägen: flera på en gång
  A.portLage = (k, lage) => {
    const av = (typ) => k.portar.filter(x => x.typ === typ && x.lagen && S(x.e) && !['unavailable', 'unknown'].includes(S(x.e).state));
    const pos = (x) => S(x.e).attributes.supported_features & 4, tj = (tjanst, l, data = {}) => l.length && A.tj('cover', tjanst, Object.assign({ entity_id: l.map(x => x.e) }, data));
    const inne = [...av('gardin'), ...av('rullgardin')];
    if (lage === 'natt') { tj('close_cover', inne); tj('close_cover', av('markis')); A.meddela('God natt – drar för gardinerna och rullgardinerna 🌙'); }
    else if (lage === 'morgon') { tj('open_cover', inne); A.meddela('God morgon – drar upp gardinerna och rullgardinerna ☀️'); }
    else if (lage === 'sol') { const rull = av('rullgardin'), vi = A.vind(k);
      tj('set_cover_position', rull.filter(pos), { position: k.portSolLage }); tj('close_cover', rull.filter(x => !pos(x)));
      tj('set_cover_position', av('gardin').filter(pos), { position: 30 });
      if (!vi || vi.ms < k.portVind - 2) tj('open_cover', av('markis'));
      A.meddela(`Solskydd – rullgardinerna ner till ${k.portSolLage} %${av('markis').length && (!vi || vi.ms < k.portVind - 2) ? ' och markisen ut' : ''}`); }
    else if (lage === 'in') { tj('close_cover', av('markis')); A.meddela('Rullar in markisen'); }
    A.vibb(14); A.patchaSnart();
  };
  // Kortet överst på sidan: lägen och förslag
  R.portlagen = (_, k) => {
    const f = A.portForslag(k).filter(x => !A.ign.has(x.nyckel)), har = (t) => k.portar.some(x => x.typ === t);
    const w = S(k.vader), vi = A.vind(k);
    const L = [har('gardin') || har('rullgardin') ? ['morgon', 'God morgon', 'mdi:weather-sunset-up', 'Allt upp'] : null, har('rullgardin') || har('gardin') ? ['sol', 'Solskydd', 'mdi:weather-sunny', `Ner till ${k.portSolLage} %`] : null,
      har('gardin') || har('rullgardin') ? ['natt', 'God natt', 'mdi:weather-night', 'Allt för'] : null, har('markis') ? ['in', 'Rulla in', 'mdi:awning-outline', 'Markisen'] : null].filter(Boolean);
    const vader = w ? `${A.vtext(w.state)} · ${Math.round(w.attributes.temperature)}°${vi ? ` · vind ${Math.round(vi.ms)} m/s` : ''}` : '';
    return `<div class="pl-lagen">${L.map(([v, t, i, sub]) => `<button class="pl-lage" data-a="portlage" data-v="${v}"><span>${ik(i, 20)}</span><b>${t}</b><small>${sub}</small></button>`).join('')}</div>
      <div class="pl-forslag">${f.length ? f.slice(0, 2).map(x => `<div class="pl-f" style="--plf:${x.f}"><span class="pl-fik">${ik(x.ikon, 18)}</span><div><b>${esc(x.t)}</b><small>${esc(x.s)}</small></div>
          <button class="pl-ja" ${x.a}>${esc(x.knapp)}</button><button class="pl-nej" data-a="ignorera" data-v="${esc(x.nyckel)}" aria-label="Ignorera">${ik('mdi:close', 15)}</button></div>`).join('')
        : `<div class="pl-lugnt">${ik('mdi:check-circle-outline', 18)}<div><b>Inga förslag just nu</b><small>${esc(vader || 'Allt ser bra ut')}</small></div></div>`}</div>`;
  };
  R.portgrupp = (typ, k) => {
    const T = PT[typ], l = k.portar.filter(x => x.typ === typ).map(x => ({ x, d: A.portInfo(k, x) })).filter(y => y.d);
    if (!l.length) return kh(T.ik, T.grupp) + tom('Hittar inga – kontrollera listan i mitt_hem', T.ik);
    const oppna = l.filter(y => y.d.oppen).length, bekr = A.portBekr && Date.now() - A.portBekr.t < 4000 ? A.portBekr.e : '';
    const pill = typ === 'garage' ? (oppna ? `<span class="pill varn">${oppna} öppen</span>` : '<span class="pill ok">Stängt</span>') : `<span class="pill ${oppna ? 'acc' : ''}">${oppna ? `${oppna} ${typ === 'markis' ? 'utfällda' : typ === 'rullgardin' ? 'uppe' : 'öppna'}` : T.c}</span>`;
    const alla = l.length > 1 && typ !== 'garage' ? `<div class="port-alla"><span>Alla</span><button data-a="portalla" data-v="${typ}" data-d="open_cover">${ik('mdi:chevron-double-up', 16)}${T.upp}</button><button data-a="portalla" data-v="${typ}" data-d="close_cover">${ik('mdi:chevron-double-down', 16)}${T.ner}</button></div>` : '';
    return kh(T.ik, T.grupp, pill) + `<div class="portgrid ${l.length === 1 ? 'en' : ''}">${l.map(({ x, d }) => `<div class="port ${d.oppen ? 'pa' : ''} ${d.av ? 'av' : ''}" style="--pf:${d.farg}">
        <button class="port-bild" data-a="portpanel" data-e="${x.e}" aria-label="Läge och färg">${A.portSvg(typ, d.p, d.farg, { randig: d.randig, rorlig: d.rorlig })}</button>
        <div class="port-txt"><b>${esc(d.namn)}</b><small>${d.txt}</small></div>
        <div class="port-knappar"><button data-a="port" data-d="open_cover" data-e="${x.e}" ${typ === 'garage' ? 'data-bekr="1"' : ''} class="${bekr === x.e ? 'bekr' : ''}">${bekr === x.e ? 'Tryck igen' : `${ik('mdi:chevron-up', 16)}${T.upp}`}</button>
          <button data-a="port" data-d="stop_cover" data-e="${x.e}" aria-label="Stopp">${ik('mdi:stop', 15)}</button>
          <button data-a="port" data-d="close_cover" data-e="${x.e}">${ik('mdi:chevron-down', 16)}${T.ner}</button></div></div>`).join('')}</div>${alla}`;
  };
  // Panel: dra till rätt läge och välj färg
  A.portPanel = (k, eid) => {
    const x = k.portar.find(y => y.e === eid), d0 = x && A.portInfo(k, x);
    if (!d0) return;
    document.getElementById('aura-port')?.remove();
    const mork = k.tema !== 'ljus', noir = k.tema === 'noir';
    const T = noir ? { bg: '#141210', y2: '#1E1B17', tx: '#F5EFE6', dim: 'rgba(245,239,230,.58)', acc: k.accent || '#D4AF7A' } : mork ? { bg: '#111427', y2: '#1A1E36', tx: '#EEF0FF', dim: 'rgba(238,240,255,.58)', acc: k.accent || '#7568FF' }
      : { bg: '#FBF9F5', y2: '#F2EDE5', tx: '#1E1A15', dim: 'rgba(30,26,21,.56)', acc: k.accent || '#B07D3A' };
    let p = d0.p, farg = d0.farg, randig = d0.randig;
    const m = document.createElement('div');
    m.id = 'aura-port';
    const rita = () => { m.querySelector('.pp-bild').innerHTML = A.portSvg(x.typ, p, farg, { randig }); m.querySelector('[data-pct]').textContent = `${Math.round(p)} %`; };
    m.innerHTML = DEFS + `<style>
      #aura-port { position:fixed; inset:0; z-index:10000; display:grid; place-items:center; background:rgba(10,8,5,.42); backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px); font-family:Manrope,system-ui,sans-serif; color:${T.tx}; animation:ppin .3s ease both; }
      @keyframes ppin { from { opacity:0; } } @keyframes ppupp { from { transform:translateY(40px) scale(.97); opacity:0; } }
      #aura-port * { box-sizing:border-box; } #aura-port button { font:inherit; color:inherit; border:0; background:none; cursor:pointer; -webkit-tap-highlight-color:transparent; }
      .pp { width:min(420px, 94vw); max-height:92vh; overflow-y:auto; padding:22px; border-radius:32px; background:${T.bg}; box-shadow:0 40px 100px rgba(0,0,0,.35); animation:ppupp .45s cubic-bezier(.22,1,.36,1) both; scrollbar-width:none; }
      @media (max-width:600px) { #aura-port { place-items:end center; } .pp { width:100vw; border-radius:32px 32px 0 0; padding-bottom:calc(22px + env(safe-area-inset-bottom, 0px)); } }
      .pp-topp { display:flex; align-items:center; gap:12px; } .pp-topp small { display:block; font-size:11.5px; font-weight:800; letter-spacing:.09em; text-transform:uppercase; color:${T.dim}; } .pp-topp b { display:block; font-size:22px; font-weight:800; letter-spacing:-.03em; }
      .pp-x { width:40px; height:40px; border-radius:50%; background:${T.y2} !important; font-size:18px; flex:none; }
      .pp-bild { height:clamp(120px, 21vh, 200px); margin:14px 0 6px; padding:14px 10px 10px; border-radius:24px; background:${T.y2}; } .pp-bild svg { display:block; height:100%; width:100%; overflow:visible; }
      .pp-rad { display:flex; justify-content:space-between; align-items:baseline; margin:14px 2px 8px; font-size:13px; font-weight:800; color:${T.dim}; } .pp-rad span { color:${T.tx}; font-size:15px; }
      .pp-r { -webkit-appearance:none; appearance:none; width:100%; height:44px; border-radius:16px; margin:0; cursor:pointer; touch-action:pan-x; background:linear-gradient(90deg, ${T.y2}, ${T.acc}); outline:none; }
      .pp-r::-webkit-slider-thumb { -webkit-appearance:none; width:16px; height:44px; border-radius:8px; background:#fff; box-shadow:0 2px 10px rgba(0,0,0,.35); } .pp-r::-moz-range-thumb { width:16px; height:44px; border:0; border-radius:8px; background:#fff; }
      .pp-snabb { display:grid; grid-template-columns:repeat(5, 1fr); gap:6px; margin-top:8px; } .pp-snabb button { padding:9px 0; border-radius:12px; background:${T.y2} !important; font-size:12.5px !important; font-weight:800 !important; }
      .pp-knappar { display:grid; grid-template-columns:1fr auto 1fr; gap:8px; margin-top:12px; } .pp-knappar button { padding:13px; border-radius:16px; background:${T.y2} !important; font-weight:800 !important; font-size:14px; }
      .pp-farger { display:flex; flex-wrap:wrap; gap:9px; } .pp-f { width:34px; height:34px; flex:none; border-radius:50% !important; box-shadow:inset 0 0 0 1px rgba(0,0,0,.1); } .pp-f.vald { box-shadow:0 0 0 3px ${T.bg}, 0 0 0 5.5px ${T.acc}; }
      .pp-rand { display:flex; align-items:center; justify-content:space-between; width:100%; margin-top:10px; padding:12px 14px; border-radius:16px; background:${T.y2} !important; font-weight:800 !important; font-size:14px; }
      .pp-rand i { width:44px; height:26px; border-radius:999px; background:rgba(128,128,128,.35); position:relative; transition:background .3s; } .pp-rand i::after { content:''; position:absolute; top:3px; left:3px; width:20px; height:20px; border-radius:50%; background:#fff; transition:left .3s; }
      .pp-rand.pa i { background:${T.acc}; } .pp-rand.pa i::after { left:21px; }
      /* Surfplatta: bild och färg till vänster, reglage till höger – allt syns utan att scrolla */
      @media (min-width:760px) { .pp { width:min(800px, 94vw); } .pp-delar { display:grid; grid-template-columns:minmax(0, 1fr) minmax(0, 1fr); gap:20px; }
        .pp-bild { height:clamp(170px, 34vh, 280px); margin-bottom:0; } .pp-hoger { margin-top:14px; } .pp-hoger > .pp-rad:first-child { margin-top:2px; } }
      .pp-mer { width:100%; margin-top:12px; padding:13px; border-radius:16px; background:${T.y2} !important; font-weight:800 !important; font-size:14px; }
    </style>
    <div class="pp">
      <div class="pp-topp"><button class="pp-x" data-v="x" aria-label="Stäng">✕</button><div><small>${PT[x.typ].grupp}</small><b>${esc(d0.namn)}</b></div></div>
      <div class="pp-delar"><div class="pp-vanster"><div class="pp-bild"></div>
      <div class="pp-rad">Färg på bilden<span></span></div>
      <div class="pp-farger">${PORTFARGER.map(c => `<button class="pp-f ${c.toLowerCase() === String(farg).toLowerCase() ? 'vald' : ''}" data-farg="${c}" style="background:${c}" aria-label="${c}"></button>`).join('')}</div></div>
      <div class="pp-hoger">${d0.pos ? `<div class="pp-rad">${x.typ === 'markis' ? 'Hur långt ut' : x.typ === 'gardin' ? 'Hur mycket öppen' : x.typ === 'garage' ? 'Hur mycket öppen' : 'Hur långt upp'}<span data-pct>${Math.round(p)} %</span></div>
        <input type="range" class="pp-r" min="0" max="100" step="5" value="${Math.round(p)}">
        <div class="pp-snabb">${[0, 25, 50, 75, 100].map(v => `<button data-p="${v}">${v === 0 ? PT[x.typ].c : v === 100 ? PT[x.typ].o : v + ' %'}</button>`).join('')}</div>` : '<span data-pct hidden></span>'}
      <div class="pp-knappar"><button data-v="open_cover">${PT[x.typ].upp}</button><button data-v="stop_cover">■</button><button data-v="close_cover">${PT[x.typ].ner}</button></div>
      ${x.typ === 'markis' ? `<button class="pp-rand ${randig ? 'pa' : ''}" data-v="rand">Randig väv<i></i></button>` : ''}
      <button class="pp-mer" data-v="mer">Fler inställningar</button></div></div>
    </div>`;
    rita();
    const stang = () => { m.style.transition = 'opacity .2s'; m.style.opacity = '0'; setTimeout(() => m.remove(), 200); };
    const satt = (v) => { p = v; rita(); A.tj('cover', 'set_cover_position', { entity_id: eid, position: Math.round(v) }); A.vibb(8); };
    const r = m.querySelector('.pp-r');
    if (r) { r.addEventListener('input', () => { p = +r.value; rita(); }); r.addEventListener('change', () => satt(+r.value)); }
    m.addEventListener('click', (e) => {
      if (e.target === m) return stang();
      const fb = e.target.closest('[data-farg]');
      if (fb) { farg = fb.dataset.farg; minne('portfarg.' + eid, farg); m.querySelectorAll('.pp-f').forEach(y => y.classList.toggle('vald', y === fb)); rita(); A.vibb(6); return A.patchaAlla(); }
      const pb = e.target.closest('[data-p]');
      if (pb) { if (r) r.value = pb.dataset.p; return satt(+pb.dataset.p); }
      const b = e.target.closest('[data-v]');
      if (!b) return;
      const v = b.dataset.v;
      if (v === 'x') return stang();
      if (v === 'rand') { randig = !randig; minne('portrand.' + eid, randig ? '1' : '0'); b.classList.toggle('pa', randig); rita(); A.vibb(6); return A.patchaAlla(); }
      if (v === 'mer') { stang(); return A.info([...A.kort].find(y => y.isConnected) || document.body, eid); }
      if (/_cover$/.test(v)) { A.tj('cover', v, { entity_id: eid }); A.vibb(10); if (v !== 'stop_cover') { p = v === 'open_cover' ? 100 : 0; if (r) r.value = p; rita(); } }
    });
    document.body.appendChild(m);
  };
  // ═════════════ Värme och klimat (climate-entiteter) ═════════════
  A.vmOpt = {}; A.vmTimer = {};
  A.varmeTyp = (x, s) => {
    if (x.typ) return x.typ;
    const a = s.attributes, t = (x.e + ' ' + (a.friendly_name || '')).toLowerCase(), kyla = (a.hvac_modes || []).includes('cool');
    return /golv|floor/.test(t) ? 'golv' : /element|radiator|trv|ventil|valve/.test(t) ? 'element' : /bergv|frånluft|franluft|nibe|thermia|ivt|ctc|vattenburen|panna|boiler/.test(t) ? 'vp'
      : /luft|split|ac\b|aircon|daikin|mitsubishi|panasonic|toshiba|fujitsu|lg_|samsung|vp|värmepump|varmepump|heat.?pump/.test(t) ? (kyla ? 'luft' : 'vp') : kyla ? 'luft' : 'element';
  };
  const VMLAGE = { off: ['Av', 'mdi:power'], heat: ['Värme', 'mdi:fire'], cool: ['Kyla', 'mdi:snowflake'], heat_cool: ['Auto', 'mdi:sun-snowflake-variant'], auto: ['Auto', 'mdi:thermostat-auto'], dry: ['Torka', 'mdi:water-percent'], fan_only: ['Fläkt', 'mdi:fan'] };
  const VMPRESET = { eco: 'Eco', away: 'Borta', home: 'Hemma', comfort: 'Komfort', sleep: 'Natt', boost: 'Boost', none: 'Normal', activity: 'Aktiv' };
  const VMAKTION = { heating: ['Värmer', '#F08A3E'], cooling: ['Kyler', '#4DA3FF'], idle: ['Vilar', ''], off: ['Av', ''], fan: ['Fläkt', '#7FC4C0'], drying: ['Avfuktar', '#7FC4C0'], preheating: ['Förvärmer', '#F08A3E'], defrosting: ['Avfrostar', '#4DA3FF'] };
  A.varmeSvg = (typ, akt) => {
    const varm = akt === 'heating' || akt === 'preheating', kall = akt === 'cooling', gar = varm || kall || akt === 'fan' || akt === 'drying', f = varm ? '#F08A3E' : kall ? '#4DA3FF' : '#9BA3AD';
    if (typ === 'luft') return `<svg viewBox="0 0 120 100" aria-hidden="true">
      <rect x="8" y="20" width="104" height="36" rx="12" fill="#F6F5F2" filter="url(#a-skugga)"/><rect x="8" y="20" width="104" height="9" rx="4.5" fill="#fff" opacity=".7"/>
      <path d="M16 50h88" stroke="#2A2D33" stroke-width="5" stroke-linecap="round"/><path d="M18 50h84" stroke="#4B5058" stroke-width="2" stroke-linecap="round"/>
      <circle cx="98" cy="36" r="2.2" fill="${gar ? f : '#C9CDD3'}" ${gar ? 'class="r-led"' : ''}/>
      ${gar ? [26, 46, 66, 86].map((x, i) => `<path class="r-flode" style="animation-delay:${i * .25}s" d="M${x} 60c-3 8 3 14 0 22" fill="none" stroke="${f}" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>`).join('') : ''}</svg>`;
    if (typ === 'vp') return `<svg viewBox="0 0 120 100" aria-hidden="true">
      <rect x="12" y="16" width="96" height="70" rx="7" fill="#ECEBE7" filter="url(#a-skugga)"/><rect x="18" y="86" width="10" height="6" fill="#55585E"/><rect x="92" y="86" width="10" height="6" fill="#55585E"/>
      <circle cx="46" cy="51" r="27" fill="#2A2D33"/><g ${gar ? 'class="r-snurr"' : ''} style="transform-origin:46px 51px">${[0, 120, 240].map(v => `<path d="M46 51c4-10 14-14 18-10s-6 12-18 10z" fill="#8E959E" transform="rotate(${v} 46 51)"/>`).join('')}</g>
      <circle cx="46" cy="51" r="4.5" fill="#55585E"/>${Array.from({ length: 6 }, (_, i) => `<circle cx="46" cy="51" r="${7 + i * 3.4}" fill="none" stroke="#3A3E45" stroke-width=".7"/>`).join('')}
      ${Array.from({ length: 7 }, (_, i) => `<path d="M82 ${28 + i * 7}h18" stroke="#C9C6BF" stroke-width="2.4" stroke-linecap="round"/>`).join('')}
      ${gar ? `<circle cx="100" cy="22" r="2.4" fill="${f}" class="r-led"/>` : ''}</svg>`;
    if (typ === 'golv') return `<svg viewBox="0 0 120 100" aria-hidden="true">
      ${varm ? [30, 60, 90].map((x, i) => `<path class="r-flode" style="animation-delay:${i * .35}s" d="M${x} 46c-4-6 4-10 0-16s4-10 0-16" fill="none" stroke="${f}" stroke-width="2.4" stroke-linecap="round" opacity=".75"/>`).join('') : ''}
      <rect x="6" y="52" width="108" height="10" rx="2" fill="#C9A57A"/>${Array.from({ length: 6 }, (_, i) => `<path d="M${6 + i * 18} 52v10" stroke="rgba(0,0,0,.15)"/>`).join('')}
      <rect x="6" y="62" width="108" height="24" rx="2" fill="#B9B4AC"/>
      <path d="M12 74c8-8 12 8 20 0s12 8 20 0 12 8 20 0 12 8 20 0 12 8 16 0" fill="none" stroke="${varm ? '#E5484D' : '#8E959E'}" stroke-width="3.4" stroke-linecap="round"/>
      ${varm ? '<rect x="6" y="52" width="108" height="10" rx="2" fill="#F08A3E" opacity=".25"/>' : ''}</svg>`;
    // Element
    return `<svg viewBox="0 0 120 100" aria-hidden="true">
      ${varm ? `<ellipse cx="58" cy="54" rx="52" ry="36" fill="${f}" opacity=".3" filter="url(#a-blur)"/>${[34, 58, 82].map((x, i) => `<path class="r-flode" style="animation-delay:${i * .3}s" d="M${x} 16c-3-4 3-7 0-11" fill="none" stroke="${f}" stroke-width="2.2" stroke-linecap="round"/>`).join('')}` : ''}
      <rect x="12" y="26" width="92" height="6" rx="3" fill="#E4E2DD"/><rect x="12" y="80" width="92" height="6" rx="3" fill="#E4E2DD"/>
      ${Array.from({ length: 8 }, (_, i) => `<rect x="${14 + i * 11}" y="20" width="9" height="72" rx="4.5" fill="#F7F6F3" filter="url(#a-skugga)"/>`).join('')}
      ${varm ? `<rect x="14" y="20" width="86" height="72" rx="4" fill="${f}" opacity=".12"/>` : ''}
      <rect x="104" y="72" width="8" height="14" rx="3" fill="#D6D3CD"/><circle cx="108" cy="70" r="5" fill="${varm ? f : '#B9B4AC'}"/></svg>`;
  };
  R.varmekort = (eid, k) => {
    const x = k.varme.find(y => y.e === eid), s = x && S(eid);
    if (!s) return kh('mdi:thermostat', esc((x && x.namn) || eid)) + tom('Hittas inte i Home Assistant', 'mdi:thermostat-box');
    const a = s.attributes, typ = A.varmeTyp(x, s), o = A.vmOpt[eid], mal = o && Date.now() < o.till ? o.t : a.temperature;
    const akt = a.hvac_action || (s.state === 'off' ? 'off' : s.state === 'heat' ? 'heating' : s.state === 'cool' ? 'cooling' : 'idle'), [aTxt, aF] = VMAKTION[akt] || [akt, ''];
    const steg = a.target_temp_step || (a.temperature_unit === '°F' ? 1 : 0.5), dec = steg < 1 ? 1 : 0;
    const lagen = (a.hvac_modes || []).filter(m => VMLAGE[m]).slice(0, 5), pre = (a.preset_modes || []).slice(0, 5);
    const IK = { luft: 'mdi:air-conditioner', vp: 'mdi:heat-pump-outline', golv: 'mdi:heating-coil', element: 'mdi:radiator' };
    return kh(IK[typ] || 'mdi:thermostat', esc(x.namn || namn(eid)), `<span class="pill" ${aF ? `style="background:color-mix(in srgb, ${aF} 16%, transparent);color:${aF}"` : ''}>${aTxt}</span>`)
      + `<div class="vm-topp"><button class="vm-bild" data-a="info" data-e="${eid}">${A.varmeSvg(typ, akt)}</button>
        <div class="vm-nu"><b>${a.current_temperature != null ? kr(a.current_temperature, 1) + '°' : '–'}</b><small>${a.current_humidity != null ? `${Math.round(a.current_humidity)} % fukt` : 'just nu'}</small></div></div>
      ${mal != null ? `<div class="vm-mal"><button data-a="vmsteg" data-e="${eid}" data-v="-1" aria-label="Sänk">${ik('mdi:minus', 20)}</button><div><small>Önskad</small><b>${kr(mal, dec)}°</b></div>
        <button data-a="vmsteg" data-e="${eid}" data-v="1" aria-label="Höj">${ik('mdi:plus', 20)}</button></div>`
        : a.target_temp_low != null ? `<div class="vm-mal"><div style="grid-column:1/-1"><small>Mellan</small><b>${kr(a.target_temp_low, dec)}–${kr(a.target_temp_high, dec)}°</b></div></div>` : ''}
      ${lagen.length > 1 ? `<div class="vm-chips">${lagen.map(m => `<button class="${s.state === m ? 'pa' : ''}" data-a="vmlage" data-e="${eid}" data-v="${m}">${ik(VMLAGE[m][1], 15)}${VMLAGE[m][0]}</button>`).join('')}</div>` : ''}
      ${pre.length ? `<div class="vm-chips pre">${pre.map(m => `<button class="${a.preset_mode === m ? 'pa' : ''}" data-a="vmpreset" data-e="${eid}" data-v="${esc(m)}">${esc(VMPRESET[m] || m)}</button>`).join('')}</div>` : ''}`;
  };
  // Sänk/återställ: kommer ihåg vad varje termostat stod på
  A.varmeSankt = () => { try { return JSON.parse(minne('varmesank') || 'null'); } catch (e) { return null; } };
  A.varmeSank = (k, orsak) => {
    const mal = {}; k.varme.forEach(x => { const s = S(x.e); if (s && s.attributes.temperature != null && !['off', 'cool', 'dry', 'fan_only'].includes(s.state)) mal[x.e] = s.attributes.temperature; });
    Object.entries(mal).forEach(([id, t]) => A.tj('climate', 'set_temperature', { entity_id: id, temperature: t - k.varmeSank }));
    minne('varmesank', JSON.stringify({ orsak, t: Date.now(), mal })); A.meddela(`Sänker värmen ${k.varmeSank}° på ${Object.keys(mal).length} ställen`); A.vibb(12); A.patchaSnart();
  };
  A.varmeAter = () => { const v = A.varmeSankt(); if (!v) return; Object.entries(v.mal).forEach(([id, t]) => A.tj('climate', 'set_temperature', { entity_id: id, temperature: t }));
    minne('varmesank', ''); A.meddela('Återställer värmen'); A.vibb(12); A.patchaSnart(); };
  A.varmeForslag = (k) => {
    if (!k.varme.length) return [];
    const ut = [], nu = Date.now(), h = new Date().getHours(), dag = new Date().toDateString(), sankt = A.varmeSankt();
    const pers = Object.keys(A.hass.states).filter(id => id.startsWith('person.')), hemma = pers.filter(id => S(id).state === 'home').length;
    const varmer = k.varme.filter(x => { const s = S(x.e); return s && s.attributes.temperature != null && ['heat', 'heat_cool', 'auto'].includes(s.state); });
    const el = k.el && A.elData(k);
    if (sankt && sankt.orsak === 'borta' && hemma) ut.push({ prio: 1, nyckel: `varmehem:${sankt.t}`, ikon: 'mdi:home-thermometer-outline', f: 'var(--acc)', t: 'Välkommen hem!', s: `Värmen är sänkt ${k.varmeSank}° sedan ${hm(new Date(sankt.t))}. Höja tillbaka?`, knapp: 'Återställ', a: 'data-a="vmater"' });
    if (sankt && sankt.orsak === 'dyr' && el && el.niva !== 'fel') ut.push({ prio: 2, nyckel: `varmebillig:${sankt.t}`, ikon: 'mdi:piggy-bank-outline', f: 'var(--ok)', t: 'Elen är billigare igen', s: `${kr(el.nu)} kr/kWh nu. Höja värmen tillbaka?`, knapp: 'Återställ', a: 'data-a="vmater"' });
    if (!sankt && varmer.length && pers.length && !hemma) { const gick = Math.max(...pers.map(id => Date.parse(S(id).last_changed) || 0));
      if (nu - gick > k.varmeBorta * 6e4) ut.push({ prio: 2, nyckel: `varmeborta:${gick}`, ikon: 'mdi:home-export-outline', f: 'var(--info)', t: `Ingen hemma sedan ${hm(new Date(gick))}`, s: `Sänk värmen ${k.varmeSank}° tills någon kommer hem?`, knapp: `Sänk ${k.varmeSank}°`, a: 'data-a="vmsank" data-v="borta"' }); }
    if (!sankt && el && el.niva === 'fel' && h >= 6 && h < 22 && varmer.some(x => S(x.e).attributes.hvac_action === 'heating' || !S(x.e).attributes.hvac_action)) {
      const billig = el.fram.find(x => x.i > el.nuIdx && x.p < k.dyr);
      ut.push({ prio: 2, nyckel: `varmedyr:${dag}`, ikon: 'mdi:cash-clock', f: 'var(--varn)', t: 'Elen är dyr just nu', s: `${kr(el.nu)} kr/kWh${billig ? ` till ca kl ${String(billig.h).padStart(2, '0')}` : ''}. Sänk värmen ${k.varmeSank}° så länge?`, knapp: `Sänk ${k.varmeSank}°`, a: 'data-a="vmsank" data-v="dyr"' }); }
    return ut;
  };
  R.vmlagen = (_, k) => {
    const f = A.varmeForslag(k).filter(x => !A.ign.has(x.nyckel)), sankt = A.varmeSankt(), w = S(k.vader), el = k.el && A.elData(k);
    const info = [w && w.attributes.temperature != null ? `Ute ${Math.round(w.attributes.temperature)}°` : '', el && el.nu != null ? `El ${kr(el.nu)} kr · ${el.nivaTxt.toLowerCase()}` : ''].filter(Boolean).join(' · ');
    const L = sankt ? [['vmater', '', 'Återställ', 'mdi:restore', `Sänkt sedan ${hm(new Date(sankt.t))}`]] : [['vmsank', 'manuell', `Sänk ${k.varmeSank}°`, 'mdi:thermometer-chevron-down', 'Alla som värmer']];
    return `<div class="pl-lagen">${L.map(([a, v, t, i, sub]) => `<button class="pl-lage" data-a="${a}" data-v="${v}"><span>${ik(i, 20)}</span><b>${t}</b><small>${sub}</small></button>`).join('')}</div>
      <div class="pl-forslag">${f.length ? f.slice(0, 2).map(x => `<div class="pl-f" style="--plf:${x.f}"><span class="pl-fik">${ik(x.ikon, 18)}</span><div><b>${esc(x.t)}</b><small>${esc(x.s)}</small></div>
          <button class="pl-ja" ${x.a}>${esc(x.knapp)}</button><button class="pl-nej" data-a="ignorera" data-v="${esc(x.nyckel)}" aria-label="Ignorera">${ik('mdi:close', 15)}</button></div>`).join('')
        : `<div class="pl-lugnt">${ik('mdi:check-circle-outline', 18)}<div><b>${sankt ? `Värmen är sänkt ${k.varmeSank}°` : 'Inga förslag just nu'}</b><small>${esc(info || 'Allt ser bra ut')}</small></div></div>`}</div>`;
  };
  // Checklistan i larmkortet: en rad per sort, tryck för att se varje givare
  A.sakOppen = '';
  A.larmLista = (k, larmSt) => {
    const ej_ = (s) => !s || ['unavailable', 'unknown'].includes(s.state);
    const garage = k.portar.filter(x => x.typ === 'garage').map(x => x.e);
    const G = [
      ['dorr', 'Dörrar', 'mdi:door-closed', k.dorrar, (s) => s.state === 'on', 'öppen', (n) => `${n}/${n} stängda`],
      ['fonster', 'Fönster', 'mdi:window-closed-variant', k.fonster, (s) => s.state === 'on', 'öppet', (n) => `${n}/${n} stängda`],
      ['las', 'Lås', 'mdi:lock', k.las, (s) => s.state !== 'locked', 'olåst', (n) => `${n}/${n} låsta`],
      ['garage', 'Garage', 'mdi:garage-variant', garage, (s) => s.state !== 'closed', 'öppen', () => 'Stängd'],
      ['rorelse', 'Rörelse', 'mdi:motion-sensor', k.rorelse, (s) => s.state === 'on', 'rörelse', () => 'Lugnt', true],
      ['givare', 'Brand och vatten', 'mdi:smoke-detector-variant', k.larmgivare, (s) => s.state === 'on', 'LARMAR', () => 'Allt ok'],
      ['kam', 'Kameror', 'mdi:cctv', k.kameror, (s) => s.state === 'off', 'av', (n) => `${n}/${n} online`],
    ].map(([id, namn_, ikon, ids, fel, felTxt, okTxt, info]) => { const l = ids.filter(x => S(x)); return { id, namn: namn_, ikon, l, fel, felTxt, okTxt, info }; }).filter(g => g.l.length);
    if (!G.length) return '';
    const larmat = larmSt.startsWith('armed'), att = A.larmKoll(k).length;
    const kort_ = (id) => namn(id).replace(/\s*(öppning|oppning|kontakt|sensor|contact|opening|occupancy|rörelse|motion)$/i, '');
    return `<div class="rl"><div class="rl-h"><span>${larmat ? 'Bevakas' : 'Redo att larma'}</span>${att ? `<span class="pill varn">${att} att se över</span>` : '<span class="pill ok">Allt ok</span>'}</div>
      ${G.map(g => { const ej = g.l.filter(x => ej_(S(x))), pa = g.l.filter(x => !ej_(S(x)) && g.fel(S(x))), oppen = A.sakOppen === g.id;
        const status = ej.length ? `<em class="fel">${ej.length === 1 ? esc(kort_(ej[0])) : ej.length} svarar inte</em>` : pa.length ? `<em class="${g.info ? 'inf' : 'varn'}">${pa.length === 1 ? `${esc(kort_(pa[0]))} ${g.felTxt}` : `${pa.length} ${g.felTxt}`}</em>` : `<em class="ok">${g.okTxt(g.l.length)}</em>`;
        return `<button class="rl-rad ${oppen ? 'oppen' : ''}" data-a="sakgrupp" data-v="${g.id}">${ik(g.ikon, 17)}<b>${g.namn}</b>${status}${ik(oppen ? 'mdi:chevron-up' : 'mdi:chevron-down', 15)}</button>
          ${oppen ? `<div class="rl-lista">${g.l.map(id => { const st = S(id), f_ = ej_(st) ? 'fel' : g.fel(st) ? (g.info ? 'inf' : 'varn') : 'ok';
            return `<button data-a="info" data-e="${id}"><i class="${f_}"></i><span>${esc(kort_(id))}</span><small>${ej_(st) ? 'svarar inte' : g.fel(st) ? g.felTxt : 'ok'} · ${sedan(Date.parse(st.last_changed)).replace(' sedan', '')}</small></button>`; }).join('')}</div>` : ''}`; }).join('')}</div>`;
  };
  R.skydd = (_, k) => {
    const rutor = [];
    let varn = 0;
    const ruta2 = (id, ikon, pa, txt, f, raknas = true) => { if (pa && raknas) varn++; const s = S(id);
      rutor.push(`<button class="sk ${pa ? 'pa' : ''}" data-a="info" data-e="${id}" style="--sf:${f}"><span class="sk-ik">${ik(ikon, 20)}</span>
        <div style="min-width:0"><b>${esc(namn(id).replace(/\s*(öppning|oppning|kontakt|sensor|occupancy|rörelse)$/i, ''))}</b><small>${txt} · ${sedan(Date.parse(s.last_changed)).replace(' sedan', '')}</small></div></button>`); };
    k.dorrar.filter(S).forEach(id => { const on = S(id).state === 'on'; ruta2(id, on ? 'mdi:door-open' : 'mdi:door-closed', on, on ? 'Öppen' : 'Stängd', 'var(--varn)'); });
    k.fonster.filter(S).forEach(id => { const on = S(id).state === 'on'; ruta2(id, on ? 'mdi:window-open-variant' : 'mdi:window-closed-variant', on, on ? 'Öppet' : 'Stängt', 'var(--varn)'); });
    k.las.filter(S).forEach(id => { const s = S(id).state; ruta2(id, s === 'locked' ? 'mdi:lock' : 'mdi:lock-open-variant', s !== 'locked', { locked: 'Låst', unlocked: 'Olåst', jammed: 'Fastnat!', open: 'Öppen' }[s] || s, 'var(--varn)'); });
    k.larmgivare.filter(S).forEach(id => { const on = S(id).state === 'on'; ruta2(id, 'mdi:smoke-detector-variant', on, on ? 'LARMAR' : 'OK', 'var(--fel)'); });
    k.rorelse.filter(S).forEach(id => { const on = S(id).state === 'on'; ruta2(id, on ? 'mdi:motion-sensor' : 'mdi:motion-sensor-off', on, on ? 'Rörelse' : 'Lugnt', 'var(--info)', false); });
    return kh('mdi:door', 'Skalskydd', `<span class="pill ${varn ? 'varn' : 'ok'}">${varn ? `${varn} att se över` : 'Allt stängt'}</span>`)
      + `<div class="skydd">${rutor.join('') || tom('Inga givare – lägg till _dorrar i mitt_hem', 'mdi:door')}</div>`;
  };
  A.kamVald = minne('kamvald') || '';
  R.kameror = (_, k) => {
    const l = k.kameror.filter(S);
    if (!l.length) return kh('mdi:cctv', 'Kameror') + tom('Inga kameror', 'mdi:cctv-off');
    const info = (id) => { const s = S(id), a = s.attributes, on = !ej(s) && s.state !== 'off', tok = a.access_token, kn = a.camera_name || id.replace('camera.', '');
      const pers = S(`binary_sensor.${kn}_person_occupancy`); return { s, on, src: tok ? `/api/camera_proxy/${id}?token=${tok}` : a.entity_picture, kn, person: pers && pers.state === 'on', namn: a.friendly_name || id }; };
    const huvud = l.includes(A.kamVald) ? A.kamVald : (l.find(id => info(id).person) || l.find(id => info(id).on) || l[0]), h = info(huvud);
    const senast = (A.hand.frigate || []).filter(e => e.camera === h.kn).sort((x, y) => y.start_time - x.start_time)[0];
    const LAB = { person: 'Person', car: 'Bil', dog: 'Hund', cat: 'Katt', bicycle: 'Cykel' };
    return kh('mdi:cctv', 'Kameror', `<span class="pill">${l.filter(id => info(id).on).length} av ${l.length} online</span>`) + `
      <div class="kam-huvud"><button class="kam stor" data-a="info" data-e="${huvud}">${h.on && h.src ? `<img alt="" src="${esc(h.src)}" data-still="${esc(h.src)}">` : `<div class="kam-av">${ik('mdi:cctv-off', 34)}Offline</div>`}
        <div class="kam-over">${h.on ? `<span class="live ${h.person ? 'person' : ''}">${h.person ? 'PERSON' : 'LIVE'}</span>` : '<span></span>'}
          <div><div class="kam-namn">${esc(h.namn)}</div>${senast ? `<div class="kam-sen">${LAB[senast.label] || senast.label} ${hm(new Date(senast.start_time * 1000))}</div>` : ''}</div></div></button></div>
      ${l.length > 1 ? `<div class="kam-tumm" style="--n:${Math.min(l.length, 4)}">${l.slice(0, 4).map(id => { const t = info(id);
        return `<button class="kam tumm ${id === huvud ? 'pa' : ''}" data-a="kamval" data-v="${id}">${t.on && t.src ? `<img alt="" src="${esc(t.src)}" data-still="${esc(t.src)}">` : `<div class="kam-av">${ik('mdi:cctv-off', 18)}</div>`}
          ${t.person ? '<span class="tumm-p"></span>' : ''}<em>${esc(t.namn)}</em></button>`; }).join('')}</div>` : ''}`;
  };

  // Väder-sidan
  // ── SMHI-sensorer (t.ex. sensor.smhi_odp_home_wind_speed) via _smhi_prefix ──
  A.smhiS = (k, ...namn) => { if (!k.smhi) return null; for (const n of namn) { const id = k.smhi + n, v = tal(id); if (v != null) return { id, v, u: (S(id).attributes.unit_of_measurement || '').toLowerCase() }; } return null; };
  const tillMs = (v, u) => v == null ? null : /km/.test(u || '') ? v / 3.6 : /mph/.test(u || '') ? v * 0.447 : /kn/.test(u || '') ? v * 0.514 : v;
  const VINDRIKT = ['norr', 'nordost', 'öster', 'sydost', 'söder', 'sydväst', 'väster', 'nordväst'], VINDKORT = ['N', 'NO', 'O', 'SO', 'S', 'SV', 'V', 'NV'];
  const vindNamn = (ms) => ms < 0.3 ? 'Lugnt' : ms < 3.4 ? 'Svag vind' : ms < 8 ? 'Måttlig vind' : ms < 13.9 ? 'Frisk vind' : ms < 24.5 ? 'Hård vind' : ms < 32.7 ? 'Storm' : 'Orkan';
  A.vind = (k) => {
    const w = S(k.vader), a = (w && w.attributes) || {}, sp = A.smhiS(k, 'wind_speed'), ri = A.smhiS(k, 'wind_direction'), by = A.smhiS(k, 'wind_gust', 'wind_gust_speed', 'gust_speed');
    const ms = sp ? tillMs(sp.v, sp.u) : tillMs(a.wind_speed, a.wind_speed_unit), grad = ri ? ri.v : a.wind_bearing, byar = by ? tillMs(by.v, by.u) : tillMs(a.wind_gust_speed, a.wind_speed_unit);
    const i = grad == null ? null : Math.round(((grad % 360) + 360) % 360 / 45) % 8;
    return ms == null ? null : { ms, grad, byar, namn: vindNamn(ms), fran: i == null ? '' : VINDRIKT[i], kort: i == null ? '' : VINDKORT[i] };
  };
  // ── SMHI-varningar: läser listan i sensorns attribut, oavsett exakt format ──
  A.varningar = (k) => {
    const s = S(k.varning), b = S(k.varningAktiv);
    if (!s && !b) return null;
    const a = (s && s.attributes) || {}, l = [];
    Object.values(a).forEach(v => Array.isArray(v) && v.forEach(x => x && typeof x === 'object' && l.push(x)));
    const txt = (x, ...n) => { for (const f of n) { const v = x[f]; if (v != null && v !== '') return typeof v === 'object' ? (v.sv || v.sv_SE || v.en || v.code || v.name || '') : String(v); } return ''; };
    const lista = l.map(x => ({ titel: txt(x, 'event', 'headline', 'title', 'name', 'type', 'warning', 'event_type'), niva: txt(x, 'level', 'severity', 'warning_level', 'awareness_level', 'color', 'code'),
      text: txt(x, 'descr', 'description', 'text', 'message', 'details', 'info'), omr: txt(x, 'area', 'areas', 'region', 'county', 'area_name'),
      start: txt(x, 'start', 'onset', 'from', 'approximate_start', 'valid_from', 'effective'), slut: txt(x, 'end', 'expires', 'to', 'approximate_end', 'valid_to') })).filter(x => x.titel || x.text);
    const aktiv = b ? b.state === 'on' : lista.length > 0 || parseFloat(s && s.state) > 0;
    return { lista: aktiv ? lista : [], aktiv, antal: aktiv ? Math.max(lista.length, parseInt(s && s.state) || 0, 1) : 0, notis: a.notice || a.message || (s && isNaN(parseFloat(s.state)) && !/^(off|unknown|unavailable|0)$/i.test(s.state) ? s.state : '') };
  };
  const varnFarg = (n) => /röd|red|extreme|^3$|hög/i.test(n) ? 'var(--fel)' : /orange|severe|^2$/i.test(n) ? '#F08A24' : /gul|yellow|moderate|^1$/i.test(n) ? 'var(--varn)' : 'var(--info)';
  // ── Månen: fas från sensor.moon_* och belysning/nästa fullmåne uträknat ──
  A.maneData = (k) => {
    const syn = 29.530588853, ny0 = Date.UTC(2000, 0, 6, 18, 14), nu = Date.now();
    const age = (((nu - ny0) / 864e5) % syn + syn) % syn, ill = (1 - Math.cos(2 * Math.PI * age / syn)) / 2;
    const FAS = { new_moon: 'Nymåne', waxing_crescent: 'Tilltagande skära', first_quarter: 'Första kvarter', waxing_gibbous: 'Tilltagande måne', full_moon: 'Fullmåne',
      waning_gibbous: 'Avtagande måne', last_quarter: 'Sista kvarter', waning_crescent: 'Avtagande skära' };
    const egen = ['new_moon', 'waxing_crescent', 'first_quarter', 'waxing_gibbous', 'full_moon', 'waning_gibbous', 'last_quarter', 'waning_crescent'][Math.round(age / syn * 8) % 8];
    const s = S(k.mane);
    return { age, ill, tilltar: age < syn / 2, fas: (s && FAS[s.state]) || FAS[egen], full: new Date(nu + (((syn / 2 - age) % syn) + syn) % syn * 864e5), ny: new Date(nu + (syn - age) * 864e5) };
  };
  const maneSvg = (m, r = 26) => {
    const c = r + 4, p = m.age / 29.530588853, k2 = Math.cos(2 * Math.PI * p), rx = Math.abs(k2) * r, vx = m.tilltar;
    const yttre = vx ? 1 : 0, inre = vx ? (k2 > 0 ? 0 : 1) : (k2 > 0 ? 1 : 0);
    return `<svg class="mane" viewBox="0 0 ${c * 2} ${c * 2}" width="${c * 2}" height="${c * 2}"><circle cx="${c}" cy="${c}" r="${r + 4}" fill="#F4E7C3" opacity="${(.12 + m.ill * .25).toFixed(2)}" filter="url(#a-blur)"/>
      <circle cx="${c}" cy="${c}" r="${r}" fill="var(--yta3)"/>
      <path d="M${c} ${c - r} A${r} ${r} 0 0 ${yttre} ${c} ${c + r} A${rx.toFixed(2)} ${r} 0 0 ${inre} ${c} ${c - r} Z" fill="#F4E7C3"/>
      <circle cx="${c - r * .3}" cy="${c - r * .25}" r="${r * .16}" fill="rgba(0,0,0,.07)"/><circle cx="${c + r * .28}" cy="${c + r * .3}" r="${r * .22}" fill="rgba(0,0,0,.06)"/></svg>`;
  };
  // Dagens längd (timmar) för en given dag – för "dagarna blir X min kortare"
  const dagLangd = (d, lat) => {
    const n = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5), dek = 23.44 * Math.PI / 180 * Math.sin(2 * Math.PI * (284 + n) / 365), la = lat * Math.PI / 180;
    const c = (Math.sin(-0.833 * Math.PI / 180) - Math.sin(la) * Math.sin(dek)) / (Math.cos(la) * Math.cos(dek));
    return c >= 1 ? 0 : c <= -1 ? 24 : 2 * Math.acos(c) * 180 / Math.PI / 15;
  };
  // ── Väderkoll: några rader om vad som är på väg ──
  A.vaderKoll = (k) => {
    const w = S(k.vader);
    if (!w) return null;
    const a = w.attributes, enh = a.wind_speed_unit, tim = A.prognos(k.vader, 'hourly').slice(0, 24), dag = A.prognos(k.vader, 'daily'), nu = new Date(), h = nu.getHours(), ut = [];
    const add = (ikon, f, txt) => ut.push({ ikon, f, txt });
    const vat = (f) => (f.precipitation || 0) >= 0.2 || ['rainy', 'pouring', 'snowy', 'snowy-rainy', 'lightning-rainy', 'lightning', 'hail'].includes(f.condition) || (f.precipitation_probability || 0) >= 60;
    const typ = (f) => /lightning/.test(f.condition) ? 'aska' : f.condition === 'hail' ? 'hagel' : /snowy/.test(f.condition) || (vat(f) && f.temperature <= 0.5) ? 'sno' : 'regn';
    const TYP = { regn: ['Regn', 'mdi:weather-rainy', 'var(--info)'], sno: ['Snö', 'mdi:weather-snowy-heavy', 'var(--info)'], aska: ['Risk för åska', 'mdi:weather-lightning-rainy', 'var(--varn)'], hagel: ['Hagel', 'mdi:weather-hail', 'var(--varn)'] };
    const kl = (f) => `kl ${hh(new Date(f.datetime))}`;
    // Inledning
    const del = h < 5 ? 'I natt' : h < 10 ? 'Förmiddagen' : h < 17 ? 'Resten av dagen' : h < 22 ? 'Ikväll' : 'I natt';
    const n6 = tim.slice(0, 6), vanlig = n6.length ? Object.entries(n6.reduce((m, f) => (m[f.condition] = (m[f.condition] || 0) + 1, m), {})).sort((x, y) => y[1] - x[1])[0][0] : w.state;
    const n15 = tim.slice(0, 15), minT = n15.length ? n15.reduce((m, f) => f.temperature < m.temperature ? f : m) : null, maxT = n15.length ? n15.reduce((m, f) => f.temperature > m.temperature ? f : m) : null;
    let lead = `${del}: ${A.vtext(vanlig).toLowerCase()}${a.temperature != null ? `, ${Math.round(a.temperature)}° just nu` : ''}`;
    if (minT && minT.temperature < a.temperature - 1.5) lead += ` och ner mot ${Math.round(minT.temperature)}° ${new Date(minT.datetime).getHours() < 9 || new Date(minT.datetime).getHours() >= 21 ? 'i natt' : kl(minT)}`;
    else if (maxT && maxT.temperature > a.temperature + 1.5) lead += ` och upp mot ${Math.round(maxT.temperature)}° ${kl(maxT)}`;
    lead += '.';
    // Nederbörd
    if (tim.length) {
      if (vat(tim[0])) {
        const torr = tim.findIndex(f => !vat(f)), t = TYP[typ(tim[0])];
        add(t[1], t[2], torr > 0 ? `${t[0]} just nu – uppehåll runt ${kl(tim[torr])}.` : `${t[0]} hela det närmaste dygnet – klä dig efter vädret.`);
      } else {
        const i = tim.findIndex(vat);
        if (i < 0) add('mdi:umbrella-closed-outline', 'var(--ok)', 'Uppehåll det närmaste dygnet – inget regn i sikte.');
        else {
          let j = i; while (j + 1 < tim.length && vat(tim[j + 1])) j++;
          const mm = tim.slice(i, j + 1).reduce((x, f) => x + (f.precipitation || 0), 0), typer = tim.slice(i, j + 1).map(typ);
          const ty = ['aska', 'hagel', 'sno', 'regn'].find(x => typer.includes(x)), t = TYP[ty];
          add(t[1], t[2], `${t[0]} ${kl(tim[i])}${j > i ? `–${hh(new Date(+new Date(tim[j].datetime) + 36e5))}` : ''}${mm >= 0.5 ? `, omkring ${kr(mm, 1)} mm` : ''}.${ty === 'sno' ? ' Det kan bli halt.' : mm >= 10 ? ' Kraftigt – ta med paraply!' : ty === 'regn' ? ' Ta med paraply.' : ''}`);
        }
      }
    }
    // Frost och halka
    if (minT && minT.temperature <= 0) add('mdi:snowflake-thermometer', 'var(--info)', `Minusgrader ${kl(minT)}, ner mot ${Math.round(minT.temperature)}° – risk för frost${tim.some(f => vat(f) && f.temperature <= 2) ? ' och halka' : ''}.`);
    else if (minT && minT.temperature <= 2 && tim.some(f => vat(f) && f.temperature <= 2)) add('mdi:car-traction-control', 'var(--varn)', 'Nära nollan och fuktigt – risk för halka på vägarna.');
    // Vind
    const vMax = tim.reduce((m, f) => { const v = tillMs(f.wind_speed, enh) || 0; return v > m.v ? { v, f } : m; }, { v: 0 }), byMax = tim.reduce((m, f) => Math.max(m, tillMs(f.wind_gust_speed, enh) || 0), 0);
    if (vMax.v >= 8) add('mdi:weather-windy', vMax.v >= 14 ? 'var(--fel)' : 'var(--varn)', `${vindNamn(vMax.v)}, upp till ${Math.round(vMax.v)} m/s ${kl(vMax.f)}${byMax > vMax.v + 2 ? ` med byar på ${Math.round(byMax)} m/s` : ''}.`);
    // Dimma
    const dimma = tim.slice(0, 12).find(f => f.condition === 'fog');
    if (dimma) add('mdi:weather-fog', 'var(--dim)', `Dimma ${kl(dimma)} – sämre sikt i trafiken.`);
    // UV
    const uv = tim.slice(0, 12).reduce((m, f) => (f.uv_index || 0) > (m.uv_index || 0) ? f : m, { uv_index: a.uv_index || 0 });
    if ((uv.uv_index || 0) >= 3) add('mdi:sunglasses', 'var(--varn)', `UV-index ${Math.round(uv.uv_index)}${uv.datetime ? ' ' + kl(uv) : ''} – tänk på solskyddet.`);
    // Imorgon jämfört med idag
    if (dag.length > 1 && dag[0].temperature != null && dag[1].temperature != null) {
      const d = Math.round(dag[1].temperature - dag[0].temperature);
      if (Math.abs(d) >= 3) add(d > 0 ? 'mdi:thermometer-chevron-up' : 'mdi:thermometer-chevron-down', d > 0 ? 'var(--acc)' : 'var(--info)', `Imorgon blir det ${Math.abs(d)}° ${d > 0 ? 'varmare' : 'kallare'}, max ${Math.round(dag[1].temperature)}°.`);
      else { const d1 = dag[1]; add('mdi:calendar-arrow-right', 'var(--acc)', `Imorgon: ${A.vtext(d1.condition).toLowerCase()}, ${Math.round(d1.templow ?? d1.temperature)}–${Math.round(d1.temperature)}°${(d1.precipitation || 0) >= .5 ? ` och ${kr(d1.precipitation, 1)} mm regn` : (d1.precipitation_probability || 0) >= 50 ? ', risk för regn' : ', uppehåll'}.`); }
    }
    // Helgen (måndag–torsdag)
    const vd = nu.getDay();
    if (vd >= 1 && vd <= 4) {
      const helg = dag.filter(f => { const d = new Date(f.datetime), dn = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - new Date(nu.getFullYear(), nu.getMonth(), nu.getDate())) / 864e5); return dn > 0 && dn < 7 && [0, 6].includes(d.getDay()); });
      if (helg.length === 2) add('mdi:calendar-weekend-outline', 'var(--acc)', `Helgen: lördag ${A.vtext(helg[0].condition).toLowerCase()} och ${Math.round(helg[0].temperature)}°, söndag ${A.vtext(helg[1].condition).toLowerCase()} och ${Math.round(helg[1].temperature)}°.`);
    }
    // Veckans finaste dag
    if (dag.length > 3) {
      const po = (f) => f.temperature - (f.precipitation || 0) * 3 - (f.precipitation_probability || 0) / 15 + (f.condition === 'sunny' ? 4 : f.condition === 'partlycloudy' ? 2 : 0);
      const b = dag.slice(1, 7).reduce((m, f) => !m || po(f) > po(m) ? f : m, null);
      if (b) add('mdi:star-four-points-outline', 'var(--acc)', `Veckans finaste dag ser ut att bli ${new Date(b.datetime).toLocaleDateString('sv-SE', { weekday: 'long' })}: ${A.vtext(b.condition).toLowerCase()} och ${Math.round(b.temperature)}°.`);
    }
    // Närmaste dygnet i siffror
    const siffror = [];
    if (tim.length) {
      const regn = tim.reduce((m, f) => m + (f.precipitation || 0), 0), by = tim.reduce((m, f) => { const v = tillMs(f.wind_gust_speed ?? f.wind_speed, enh) || 0; return v > m.v ? { v, f } : m; }, { v: 0 });
      if (maxT) siffror.push(['Högst', `${Math.round(maxT.temperature)}°`, kl(maxT), 'var(--acc)']);
      if (minT) siffror.push(['Lägst', `${Math.round(minT.temperature)}°`, kl(minT), 'var(--info)']);
      siffror.push(['Regn', regn >= .1 ? `${kr(regn, 1)} mm` : '0 mm', regn >= .1 ? `${tim.filter(f => (f.precipitation || 0) >= .1).length} h` : '24 h', 'var(--info)']);
      if (by.f) siffror.push([tim.some(f => f.wind_gust_speed != null) ? 'Byar' : 'Vind', `${Math.round(by.v)} m/s`, kl(by.f), 'var(--dim)']);
    }
    return { lead, punkter: ut, siffror };
  };

  // Himlens färger efter väder och tid på dygnet (ljusa toner i ljust tema, djupa i mörka)
  A.himmel = (c, natt, mork) => {
    if (natt) return { bg: 'radial-gradient(120% 90% at 85% 0%, #2B3A6B 0%, transparent 55%), linear-gradient(160deg, #1A2342 0%, #0B1024 75%)', ljus: false, stjarnor: !/rain|pour|snow|fog|hail|lightning/.test(c || '') };
    const L = { sunny: ['#FFE7B3', '#F7C47A'], partlycloudy: ['#DCEAF8', '#F2E0BE'], cloudy: ['#E4E8EE', '#C7CFD9'], rainy: ['#CFDAE5', '#9EB2C7'], pouring: ['#C1CDDB', '#8599B0'],
      snowy: ['#F1F5FA', '#D2DEEB'], 'snowy-rainy': ['#E4EBF2', '#BBCADA'], lightning: ['#CBC6E2', '#8E88B5'], 'lightning-rainy': ['#C5C0DE', '#837DAD'], fog: ['#ECEAE5', '#D0CCC4'],
      hail: ['#DDE4EB', '#AFBDCB'], windy: ['#E0EAF2', '#C3D3E2'], 'windy-variant': ['#E0EAF2', '#C3D3E2'], exceptional: ['#E4E8EE', '#C7CFD9'] };
    const D = { sunny: ['#46361E', '#6B4F22'], partlycloudy: ['#1F2D45', '#4A3D27'], cloudy: ['#23272F', '#323843'], rainy: ['#1B2633', '#2B3D51'], pouring: ['#17202B', '#263749'],
      snowy: ['#27313E', '#3B495B'], 'snowy-rainy': ['#232D38', '#344252'], lightning: ['#221E38', '#3D3362'], 'lightning-rainy': ['#1F1B34', '#372F59'], fog: ['#26262B', '#37373E'],
      hail: ['#222A34', '#35424F'], windy: ['#1F2834', '#2F3D4C'], 'windy-variant': ['#1F2834', '#2F3D4C'], exceptional: ['#23272F', '#323843'] };
    const p = (mork ? D : L)[c] || (mork ? D : L).cloudy;
    return { bg: `radial-gradient(90% 120% at 0% 0%, ${mork ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.55)'} 0%, transparent 55%), linear-gradient(135deg, ${p[0]} 0%, ${p[1]} 100%)`, ljus: !mork, stjarnor: false };
  };
  // ── Regnradar (RainViewer) på en karta (Esri) runt hemmet ──
  R.vradar = (_, k) => kh('mdi:radar', 'Regnradar', '<span class="radar-tid dim"></span>') + `<div class="radar"><div class="radar-lager"></div><span class="radar-hem"></span><div class="radar-tl"></div>
    <span class="radar-attr">© Esri · RainViewer</span></div>`;
  A.radarInit = async (el) => {
    el.dataset.klar = '1'; el.dataset.tema = A.k.tema; el._t = Date.now(); clearInterval(el._anim);
    const lagr = el.querySelector('.radar-lager'), tl = el.querySelector('.radar-tl'), slot = el.closest('[data-s]'), tidEl = slot && slot.querySelector('.radar-tid');
    el.querySelectorAll('.radar-fel').forEach(x => x.remove());
    const c = A.hass.config || {}, lat = c.latitude, lon = c.longitude;
    if (lat == null || lon == null) { el._t = Date.now() - 9.5 * 6e4; return el.insertAdjacentHTML('beforeend', '<div class="radar-fel">Hemmets position saknas i Home Assistant</div>'); }
    const z = 7, n = 2 ** z, la = lat * Math.PI / 180, xf = (lon + 180) / 360 * n, yf = (1 - Math.log(Math.tan(la) + 1 / Math.cos(la)) / Math.PI) / 2 * n;
    const x0 = Math.floor(xf) - 1, y0 = Math.floor(yf) - 1, px = (xf - x0) * 256, py = (yf - y0) * 256, sk = 1.6, W = el.clientWidth || 264, H = el.clientHeight || 210;
    lagr.style.transform = `translate(${(W / 2 - px * sk).toFixed(1)}px, ${(H / 2 - py * sk).toFixed(1)}px) scale(${sk})`;
    const rutor = (url) => [0, 1, 2].map(j => [0, 1, 2].map(i => `<img src="${url(x0 + i, y0 + j)}" style="left:${i * 256}px;top:${j * 256}px" alt="" decoding="async">`).join('')).join('');
    let html = `<div class="radar-bas">${rutor((x, y) => `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/${A.k.tema === 'ljus' ? 'World_Light_Gray_Base' : 'World_Dark_Gray_Base'}/MapServer/tile/${z}/${y}/${x}`)}</div>`;
    lagr.innerHTML = html;
    try {
      const r = await (await fetch('https://api.rainviewer.com/public/weather-maps.json')).json(), past = (r.radar && r.radar.past) || [], fr = past.concat((r.radar && r.radar.nowcast) || []).slice(-10);
      if (!fr.length) throw new Error('inga bilder');
      const sista = past.length ? past[past.length - 1].time : 0;
      lagr.insertAdjacentHTML('beforeend', fr.map(f => `<div class="radar-ram" data-t="${f.time}">${rutor((x, y) => `${r.host}${f.path}/256/${z}/${x}/${y}/2/1_1.png`)}</div>`).join('')
        + `<div class="radar-namn">${rutor((x, y) => `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/${A.k.tema === 'ljus' ? 'World_Light_Gray_Reference' : 'World_Dark_Gray_Reference'}/MapServer/tile/${z}/${y}/${x}`)}</div>`);
      const ramar = [...lagr.querySelectorAll('.radar-ram')];
      tl.innerHTML = ramar.map(() => '<i></i>').join('');
      let i = ramar.length - 1, vanta = 0;
      const visa = () => { ramar.forEach((x, j) => { x.style.opacity = j === i ? '' : '0'; }); [...tl.children].forEach((x, j) => x.classList.toggle('pa', j <= i));
        const t = +ramar[i].dataset.t; if (tidEl) tidEl.textContent = t === sista ? 'Just nu' : `${t > sista ? 'Prognos ' : ''}${hm(new Date(t * 1000))}`; };
      visa();
      el._anim = setInterval(() => { if (!el.isConnected) return clearInterval(el._anim); if (vanta) { vanta--; return; } i = (i + 1) % ramar.length; if (i === ramar.length - 1) vanta = 4; visa(); }, 600);
    } catch (e) { el._t = Date.now() - 8 * 6e4; el.insertAdjacentHTML('beforeend', '<div class="radar-fel">Radarn kunde inte laddas just nu – försöker igen strax</div>'); }
  };
  // ── Norrsken: NOAA:s Kp-prognos för natten ──
  A.norrsken = (k) => {
    if (!k.norrsken) return null;
    const c = A._kp;
    if ((!c || Date.now() - c.t > 30 * 6e4) && !A._kpLaddar) {
      A._kpLaddar = true;
      fetch('https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json').then(r => r.json()).then(d => {
        const rader = (Array.isArray(d) ? d : []).map(r => Array.isArray(r) ? { t: Date.parse(String(r[0]).replace(' ', 'T') + 'Z'), kp: parseFloat(r[1]) } : { t: Date.parse(String(r.time_tag).replace(' ', 'T') + (/Z|\+/.test(r.time_tag) ? '' : 'Z')), kp: parseFloat(r.kp ?? r.Kp) }).filter(x => !isNaN(x.t) && !isNaN(x.kp));
        A._kp = { t: Date.now(), rader }; A.patchaSnart();
      }).catch(() => { A._kp = { t: Date.now(), rader: [] }; }).finally(() => { A._kpLaddar = false; });
    }
    if (!A._kp || !A._kp.rader.length) return null;
    const nu = Date.now(), natt = A._kp.rader.filter(x => x.t >= nu - 3 * 36e5 && x.t <= nu + 15 * 36e5 && (new Date(x.t).getHours() >= 18 || new Date(x.t).getHours() <= 5));
    if (!natt.length) return null;
    const kp = Math.max(...natt.map(x => x.kp)), lat = (A.hass.config && A.hass.config.latitude) || 59, behov = lat >= 65 ? 2 : lat >= 62 ? 3 : lat >= 58 ? 4 : lat >= 56 ? 5 : 6;
    return { kp, txt: kp >= behov ? 'Goda chanser – titta norrut!' : kp >= behov - 1 ? 'Kanske lågt mot norr' : 'Liten chans i natt', f: kp >= behov ? 'var(--ok)' : kp >= behov - 1 ? 'var(--varn)' : 'var(--dim)' };
  };
  R.vkoll = (_, k) => {
    const vk = A.vaderKoll(k), V = A.varningar(k);
    if (!vk) return '';
    const vHtml = !V ? '' : V.aktiv ? (V.lista.length ? V.lista : [{ titel: 'SMHI har utfärdat en varning', text: V.notis, niva: '' }]).map((x, i) => `<div class="varn-k" style="--vf:${varnFarg(x.niva)}" data-a="varn" data-i="${i}">
        ${ik('mdi:alert', 20)}<div><b>${esc(x.titel || 'Varning')}${x.niva && !/^\d$/.test(x.niva) ? ` · ${esc(x.niva)}` : ''}</b>${x.omr || x.start ? `<small>${esc([x.omr, x.start && x.start.replace('T', ' ').slice(0, 16)].filter(Boolean).join(' · '))}</small>` : ''}${x.text ? `<p>${esc(x.text)}</p>` : ''}<span class="varn-mer">Läs hela varningen ${ik('mdi:chevron-right', 14)}</span></div></div>`).join('')
      : '';
    // Siffrorna för närmaste dygnet visas när det finns plats: ingen varning och inget pollen
    const pl = A.pollenLista(k), siffror = !(V && V.aktiv) && !pl.length && vk.siffror.length;
    return kh('mdi:text-box-outline', 'Väderkoll', V && V.aktiv ? `<button class="pill fel" data-a="varn" data-i="0">${V.antal} ${V.antal === 1 ? 'varning' : 'varningar'}</button>` : V ? `<span class="pill ok varn-okp">${ik('mdi:shield-check-outline', 14)}Inga varningar</span>` : '') + `${vHtml}
      <p class="vk-lead">${esc(vk.lead)}</p><div class="vk-lista">${vk.punkter.slice(0, siffror ? 3 : 6).map(x => `<div class="vk-p"><span style="color:${x.f};background:color-mix(in srgb, ${x.f} 14%, transparent)">${ik(x.ikon, 18)}</span><div>${esc(x.txt)}</div></div>`).join('')}</div>
      ${siffror ? `<div class="vk-siffror"><div class="vk-siffror-t">Närmaste dygnet</div>${vk.siffror.map(([t, v, u, f]) => `<div><small>${t}<span>${esc(u)}</span></small><b style="color:${f === 'var(--dim)' ? 'var(--text)' : f}">${v}</b></div>`).join('')}</div>` : ''}
      ${(() => { return pl.length ? `<div class="vk-pollen"><div class="vk-pollen-t">${ik('mdi:flower-pollen-outline', 16)}Pollen i luften</div>${pl.map(p => `<div class="pol" data-a="info" data-e="${p.id}"><b style="font-weight:800;font-size:13px">${esc(p.namn)}</b>
        <span class="m">${[1, 2, 3, 4, 5, 6].map(j => `<i style="${j <= p.n ? `background:${polF(p.n)}` : ''}"></i>`).join('')}</span><span class="n" style="color:${polF(p.n)}">${POLNIVA[p.n]}</span></div>`).join('')}</div>` : ''; })()}`;
  };
  R.vnu = (_, k) => {
    const w = S(k.vader);
    if (!w) return tom('Hittar inte vädret – ändra _vader i mitt_hem', 'mdi:weather-cloudy-alert');
    const a = w.attributes, natt = S('sun.sun') && S('sun.sun').state === 'below_horizon', dag = A.prognos(k.vader, 'daily')[0] || {};
    const ms = a.wind_speed == null ? null : (a.wind_speed_unit === 'km/h' ? a.wind_speed / 3.6 : a.wind_speed), kanns = a.apparent_temperature ?? a.feels_like;
    const chip = (i, t, v) => v == null ? '' : `<div class="vchip">${ik(i, 17)}${t} <b>${v}</b></div>`, hi = A.himmel(w.state, natt, k.tema !== 'ljus');
    const stj = hi.stjarnor ? `<div class="vh-stj">${Array.from({ length: 18 }, (_, i) => `<i style="left:${(i * 37 + 11) % 97}%;top:${(i * 53 + 7) % 70}%;animation-delay:${(i % 6) * .7}s;opacity:${.35 + (i % 4) * .15}"></i>`).join('')}</div>` : '';
    return `<div class="vh ${hi.ljus ? 'vh-ljus' : 'vh-mork'}"><div class="vh-bg" style="background:${hi.bg}"></div>${stj}<div class="vnu">${A.vikon(w.state, 84, natt)}
      <div><div class="vnu-plats">${ik('mdi:map-marker-outline', 14)}<span>${esc(k.plats || 'Väder')} · just nu</span></div><div class="vnu-temp">${a.temperature != null ? Math.round(a.temperature) + '°' : '–'}</div><div class="vnu-txt">${A.vtext(w.state)}</div>
        <div class="dim">${kanns != null ? `Känns som ${Math.round(kanns)}°` : ''}${dag.temperature != null ? `${kanns != null ? ' · ' : ''}H ${Math.round(dag.temperature)}° · L ${Math.round(dag.templow ?? dag.temperature)}°` : ''}</div></div>
      ${(() => { const vi = A.vind(k), mb = A.smhiS(k, 'cloud_base'), si = A.smhiS(k, 'visibility'), ne = A.smhiS(k, 'precipitation'), inne = tal(k.inne);
        const vd = A.vadra(k);
        const l = [chip('mdi:home-thermometer-outline', 'Inne', inne != null ? kr(inne, 1) + '°' : null),
          vd ? `<button class="vchip vadra" style="--vf:${vd.f}" data-a="vadra">${ik(vd.ikon, 17)}Vädra <b>${vd.f === 'var(--ok)' ? 'Bra nu' : vd.f === 'var(--varn)' ? 'Vänta' : 'Okej'}</b></button>` : '',
          chip('mdi:weather-windy', 'Vind', vi ? `${Math.round(vi.ms)} m/s ${vi.kort}` : ms == null ? null : `${Math.round(ms)} m/s`), chip('mdi:water-percent', 'Fukt', a.humidity != null ? Math.round(a.humidity) + ' %' : null),
          chip('mdi:weather-pouring', 'Nederbörd', ne && ne.v > 0 ? kr(ne.v, 1) + ' mm' : null), chip('mdi:sun-wireless-outline', 'UV', a.uv_index ? a.uv_index : null),
          chip('mdi:gauge', 'Tryck', a.pressure != null ? Math.round(a.pressure) : null), chip('mdi:weather-cloudy-arrow-right', 'Molnbas', mb ? (mb.u === 'km' ? kr(mb.v, 1) + ' km' : Math.round(mb.v) + ' m') : null),
          chip('mdi:eye-outline', 'Sikt', si ? kr(si.v, 0) + ' km' : null)].filter(Boolean).slice(0, 6);
        return `<div class="vchips c${Math.min(l.length, 6)}">${l.join('')}</div>`; })()}</div></div>`;
  };
  // ═════════════ Ute idag: bästa tiden ute, vad man ska ha på sig och om det lönar sig att vädra ═════════════
  const nattTim = (d) => { const sol = S('sun.sun'); if (!sol) return d.getHours() < 6 || d.getHours() >= 21; const u = new Date(sol.attributes.next_rising), n = new Date(sol.attributes.next_setting), h = d.getHours() + d.getMinutes() / 60;
    return h < u.getHours() + u.getMinutes() / 60 || h >= n.getHours() + n.getMinutes() / 60; };
  const VATT = ['rainy', 'pouring', 'snowy', 'snowy-rainy', 'lightning-rainy', 'lightning', 'hail'];
  const blott = (f) => (f.precipitation || 0) >= 0.1 || VATT.includes(f.condition) || (f.precipitation_probability || 0) >= 50;
  // Upplevd temperatur med vindens avkylning (SMHI:s/Kanadas formel) när vädret inte själv anger den
  const kannsSom = (t, ms) => t <= 10 && ms * 3.6 > 4.8 ? 13.12 + 0.6215 * t - 11.37 * Math.pow(ms * 3.6, .16) + 0.3965 * t * Math.pow(ms * 3.6, .16) : t;
  // Gram vatten per m³ luft vid 100 % fukt – för att jämföra luften inne och ute
  const mattnad = (t) => 6.112 * Math.exp(17.67 * t / (t + 243.5)) * 216.74 / (273.15 + t);
  const dagNr = (d, nu) => Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - new Date(nu.getFullYear(), nu.getMonth(), nu.getDate())) / 864e5);
  A.uteData = (k) => {
    const w = S(k.vader);
    if (!w) return null;
    const enh = w.attributes.wind_speed_unit, alla = A.prognos(k.vader, 'hourly');
    if (!alla.length) return { laddar: true };
    const nu = new Date(), h = nu.getHours(), imorgon = h >= 19;
    const rad = (f) => { const d = new Date(f.datetime), ms = tillMs(f.wind_speed, enh) || 0, t = f.temperature;
      return { f, d, t, ms, vat: blott(f), mm: f.precipitation || 0, natt: nattTim(d), kn: f.apparent_temperature ?? kannsSom(t, ms), rh: f.humidity, uv: f.uv_index || 0,
        sol: /sunny|partlycloudy|clear/.test(f.condition), sno: /snow/.test(f.condition) || (blott(f) && t <= 0.5), aska: /lightning/.test(f.condition) }; };
    const T = alla.map(rad).filter(x => { const dn = dagNr(x.d, nu), hr = x.d.getHours(); return imorgon ? dn === 1 && hr >= 7 && hr <= 21 : dn === 0 && hr >= 6 && hr <= 21 && +x.d >= +nu - 36e5; }).slice(0, 16);
    // Poäng 0–10 per timme och aktivitet
    const P = {
      promenad: (x) => 10 - (x.vat ? 6 + Math.min(x.mm, 3) : 0) - (x.aska ? 4 : 0) - Math.min(4, Math.abs(x.kn - 16) / 4) - Math.max(0, x.ms - 6) * .5 - (x.natt ? 2.5 : 0) + (x.sol ? 1 : 0),
      tvatt: (x) => 10 - (x.vat ? 10 : 0) - (x.rh != null ? Math.max(0, (x.rh - 60) / 5) : 1) + Math.min(x.ms, 6) * .35 + (x.sol ? 1.5 : 0) - (x.t < 5 ? 4 : x.t < 10 ? 1.5 : 0) - (x.natt ? 3 : 0),
      grill: (x) => 10 - (x.vat ? 8 : 0) - Math.max(0, 15 - x.kn) * .7 - Math.max(0, x.ms - 5) * .6 + (x.d.getHours() >= 16 ? 1 : -1) - (x.natt ? 1 : 0),
      cykel: (x) => 10 - (x.vat ? 6 + Math.min(x.mm, 3) : 0) - (x.aska ? 4 : 0) - Math.max(0, x.ms - 4) * .8 - (x.t <= 1 ? 3 : 0) - Math.max(0, 5 - x.kn) * .2 - (x.natt ? 1.5 : 0),
    };
    const niva = (p) => p >= 7 ? 'bra' : p >= 4.5 ? 'ok' : 'dalig';
    const bast = (fn, len) => { let b = null; for (let i = 0; i + len <= T.length; i++) { const l = T.slice(i, i + len), p = Math.min(...l.map(fn)) * .6 + l.reduce((m, x) => m + fn(x), 0) / len * .4;
      if (!b || p > b.p) b = { i, len, p, l }; } return b; };
    const spann = (b) => `${hh(b.l[0].d)}–${hh(new Date(+b.l[b.l.length - 1].d + 36e5))}`;
    const varfor = (b) => { const l = b.l, t = Math.round(l.reduce((m, x) => m + x.t, 0) / l.length), ms = Math.max(...l.map(x => x.ms));
      return [`${t}°`, l.some(x => x.vat) ? 'lite regn' : 'uppehåll', ms >= 8 ? 'blåsigt' : ms < 3 ? 'svag vind' : '', l.filter(x => x.sol).length > l.length / 2 ? 'sol' : ''].filter(Boolean).join(', '); };
    const inte = (b, fn) => { const l = T; if (l.every(x => x.vat)) return 'Regn hela dagen'; if (fn === P.grill && Math.max(...l.map(x => x.kn)) < 12) return 'För kallt för att sitta ute';
      if (fn === P.tvatt) return l.some(x => x.t < 5) && !l.every(x => x.vat) ? 'För kallt och fuktigt – häng inne' : 'Fuktigt eller regn – häng inne'; if (Math.max(...l.map(x => x.ms)) >= 10) return 'Mycket blåsigt'; return 'Inget riktigt bra läge'; };
    const maxT = T.length ? Math.max(...T.map(x => x.t)) : 0;
    const AKT = [['promenad', 'Promenad eller löprunda', 'mdi:walk', 1], ['tvatt', 'Torka tvätten ute', 'mdi:tshirt-crew-outline', 3],
      maxT >= 12 ? ['grill', 'Grilla eller sitta ute', 'mdi:grill-outline', 2] : ['cykel', 'Cykla', 'mdi:bike', 1]];
    const akt = !T.length ? [] : AKT.map(([id, namn, ikon, len]) => { const b = bast(P[id], Math.min(len, T.length)); if (!b) return null; const nv = niva(b.p);
      return { id, namn, ikon, niva: nv, tid: nv === 'dalig' ? (imorgon ? 'Inte imorgon' : 'Inte idag') : spann(b), txt: nv === 'dalig' ? inte(b, P[id]) : varfor(b), b }; }).filter(Boolean);
    const pb = akt.find(x => x.id === 'promenad');
    const tl = T.map((x, i) => ({ c: niva(P.promenad(x)), b: pb && pb.niva !== 'dalig' && i >= pb.b.i && i < pb.b.i + pb.b.len, h: hh(x.d) }));
    // ── Klädtips för två delar av dagen ──
    const del = (namn, dn, fr, till) => { const l = alla.map(rad).filter(x => dagNr(x.d, nu) === dn && x.d.getHours() >= fr && x.d.getHours() < till && +x.d >= +nu - 36e5); return l.length ? { namn, l } : null; };
    const nuDel = () => { const l = alla.slice(0, 3).map(rad); return { namn: 'Nu', l }; };
    const delar = (h < 9 ? [del('Morgon', 0, Math.max(7, h), 10), del('Eftermiddag', 0, 14, 18)] : h < 15 ? [nuDel(), del('Eftermiddag', 0, 15, 18)] : h < 19 ? [nuDel(), del('Kväll', 0, 19, 23)]
      : [del('Imorgon bitti', 1, 7, 10), del('Imorgon em', 1, 14, 18)]).filter(Boolean);
    const klad = delar.map(({ namn, l }) => {
      const x = { kn: Math.min(...l.map(y => y.kn)), vat: l.some(y => y.vat), mm: l.reduce((m, y) => m + y.mm, 0), sno: l.some(y => y.sno && y.vat), ms: Math.max(...l.map(y => y.ms)), uv: Math.max(...l.map(y => y.uv)), sol: l.some(y => y.sol && !y.natt) };
      const t = x.kn, bas = t <= -10 ? ['Täckjacka, mössa, vantar och halsduk', 'mdi:snowflake'] : t <= 0 ? ['Vinterjacka, mössa och vantar', 'mdi:snowflake'] : t <= 6 ? ['Varm jacka och mössa', 'mdi:coat-rack']
        : t <= 11 ? ['Jacka eller tjock tröja', 'mdi:coat-rack'] : t <= 16 ? ['Tunn jacka eller kofta', 'mdi:hanger'] : t <= 21 ? ['T-shirt – ta med en tröja', 'mdi:tshirt-crew-outline'] : ['Shorts och t-shirt', 'mdi:tshirt-crew-outline'];
      const extra = [x.sno ? 'vattentäta skor' : x.vat ? (x.mm >= 2 ? 'regnkläder' : 'paraply') : '', x.ms >= 8 && t > 0 ? 'något vindtätt' : '', x.uv >= 3 && x.sol ? 'solglasögon och solkräm' : ''].filter(Boolean);
      const tid = l.length > 1 ? `${hh(l[0].d)}–${hh(new Date(+l[l.length - 1].d + 36e5))}` : hh(l[0].d);
      return { namn, tid, kn: Math.round(t), txt: bas[0] + (extra.length ? ` + ${extra.join(' och ')}` : ''), ikon: x.vat ? (x.sno ? 'mdi:weather-snowy' : 'mdi:umbrella-outline') : x.uv >= 3 && x.sol ? 'mdi:sunglasses' : bas[1] };
    });
    return { imorgon, akt, tl, klad };
  };
  // ── Vädra: jämför hur mycket vatten luften ute och inne bär ──
  A.vadra = (k) => {
    const w = S(k.vader);
    if (!w) return null;
    const alla = A.prognos(k.vader, 'hourly'), nu = new Date();
    let vadra = null;
    const tIn = tal(k.inne), fId = k.fuktInne || (k.rum.find(x => x.temp === k.inne) || {}).fukt || (k.rum.find(x => x.fukt) || {}).fukt, rhIn = tal(fId);
    const wa = w.attributes, tUt = wa.temperature, rhS = A.smhiS(k, 'humidity'), rhUt = rhS ? rhS.v : wa.humidity;
    if (tIn != null && rhIn != null && tUt != null && rhUt != null) {
      const efter = klamp(mattnad(tUt) * rhUt / mattnad(tIn), 0, 100), d = efter - rhIn;
      const bastTim = alla.slice(0, 16).filter(f => f.humidity != null && f.temperature != null).reduce((m, f) => { const g = mattnad(f.temperature) * f.humidity / 100; return !m || g < m.g ? { g, f } : m; }, null);
      const regn = /pouring|lightning/.test(w.state);
      vadra = d <= -6 && !regn ? { f: 'var(--ok)', ikon: 'mdi:window-open-variant', t: 'Bra läge att vädra', s: `Luften inne blir torrare${tUt < 5 ? ' – korsdrag i 5–10 min räcker' : ''}` }
        : d >= 6 ? { f: 'var(--varn)', ikon: 'mdi:window-closed-variant', t: 'Vänta med att vädra', s: `Uteluften är fuktig – det blir fuktigare inne${bastTim && new Date(bastTim.f.datetime) - nu > 36e5 ? `. Bättre kl ${hh(new Date(bastTim.f.datetime))}` : ''}` }
        : { f: 'var(--info)', ikon: 'mdi:window-open-variant', t: regn ? 'Vädra kort – det regnar' : 'Okej att vädra', s: tUt > tIn + 2 ? 'Varmare ute – vädra hellre när det svalnat' : 'Fukten inne ändras knappt – bra för frisk luft' };
      vadra.fran = Math.round(rhIn); vadra.till = Math.round(efter);
    }
    return vadra;
  };
  R.vute = (_, k) => {
    const u = A.uteData(k);
    if (!u) return '';
    if (u.laddar) return kh('mdi:walk', 'Ute idag') + `<div class="dim">Hämtar prognos …</div>`;
    const NIV = { bra: 'var(--ok)', ok: 'var(--varn)', dalig: 'var(--fel)' }, n = u.tl.length, pr = u.akt.find(x => x.id === 'promenad');
    return kh('mdi:walk', u.imorgon ? 'Ute imorgon' : 'Ute idag', pr && pr.niva !== 'dalig' ? `<span class="pill ok">Bäst ${pr.tid}</span>` : '')
      + (n ? `<div class="ut-tl" style="--n:${n}">${u.tl.map(x => `<i class="${x.c} ${x.b ? 'b' : ''}"></i>`).join('')}</div>
        <div class="ut-tl ut-tlh" style="--n:${n}">${u.tl.map((x, i) => i % 3 ? '' : `<span style="grid-column:${i + 1} / span ${Math.min(3, n - i)}">${x.h}</span>`).join('')}</div>` : '')
      + `<div class="ut-akt">${u.akt.map(a => `<div class="ut-a"><span style="color:${NIV[a.niva]};background:color-mix(in srgb, ${NIV[a.niva]} 14%, transparent)">${ik(a.ikon, 17)}</span>
        <div><b>${a.namn}</b><small>${esc(a.txt)}</small></div><em style="color:${NIV[a.niva]}">${a.tid}</em></div>`).join('')}</div>`
      + (u.klad.length ? `<div class="ut-klad">${u.klad.map(x => `<div class="ut-k"><small>${x.namn} · ${x.tid}</small><span>${ik(x.ikon, 20)}</span><p><b>${x.kn}°</b> ${esc(x.txt)}</p></div>`).join('')}</div>` : '')
;
  };

  // ═════════════ Prognos: 48 timmar som graf (temperatur, regn och vind) eller 10 dagar ═════════════
  A.vprogLage = minne('vprog') || 'tim';
  const vindPil = (grad) => grad == null ? '' : `<svg viewBox="0 0 10 10" style="transform:rotate(${(grad + 180) % 360}deg)"><path d="M5 0.5 L8.5 8.5 L5 6.6 L1.5 8.5 Z" fill="currentColor"/></svg>`;
  const tempF = (t) => t <= 0 ? '#6FA8DC' : t <= 8 ? '#7FC4C0' : t <= 15 ? '#E8C35C' : t <= 22 ? '#F0A04B' : '#E8694A';
  R.vprog = (_, k) => {
    const dagar = A.prognos(k.vader, 'daily').slice(0, 10), lage = A.vprogLage;
    const flik = `<div class="vp-flik">${[['tim', '48 timmar'], ['dag', `${dagar.length > 1 ? dagar.length : 10} dagar`]].map(([v, t]) => `<button class="${lage === v ? 'pa' : ''}" data-a="vprog" data-v="${v}">${t}</button>`).join('')}</div>`;
    return lage === 'dag' ? A.vprogDag(k, flik, dagar) : A.vprogTim(k, flik);
  };
  A.vprogTim = (k, flik) => {
    const l = A.prognos(k.vader, 'hourly').slice(0, 48), enh = ((S(k.vader) || {}).attributes || {}).wind_speed_unit, n = l.length;
    if (!n) return kh('mdi:chart-bell-curve-cumulative', 'Prognos', flik) + `<div class="dim">Hämtar prognos …</div>`;
    const t = l.map(f => f.temperature), mn = Math.min(...t), mx = Math.max(...t), sp = Math.max(mx - mn, 5), lo = mn - (sp - (mx - mn)) / 2;
    const v = l.map(f => tillMs(f.wind_speed, enh)), vmx = Math.max(8, ...v.filter(x => x != null)), mm = l.map(f => f.precipitation || 0), pmx = Math.max(2, ...mm);
    const W = 10, x = (i) => i * W + W / 2, yT = (val) => 24 + (1 - (val - lo) / sp) * 40, yV = (val) => 96 - val / vmx * 44;
    const pts = t.map((val, i) => [x(i), yT(val)]);
    const kurva = (p) => p.map((q, i) => i ? `C${(p[i - 1][0] + W / 2).toFixed(1)} ${p[i - 1][1].toFixed(1)} ${(q[0] - W / 2).toFixed(1)} ${q[1].toFixed(1)} ${q[0].toFixed(1)} ${q[1].toFixed(1)}` : `M${q[0]} ${q[1].toFixed(1)}`).join(' ');
    const tk = kurva(pts), vk = v.every(y => y != null) ? kurva(v.map((y, i) => [x(i), yV(y)])) : '';
    const dyg = l.map((f, i) => i && new Date(f.datetime).getHours() === 0 ? i : -1).filter(i => i > 0);
    const steg = (i) => { const hr = new Date(l[i].datetime).getHours(); return i === 0 || (hr % 3 === 0 && i >= 2); }, pos = (i) => `${((i + .5) / n * 100).toFixed(2)}%`;
    const vald = A.pSel != null && A.pSel < n ? A.pSel : null;
    const dagK = (d) => d.toLocaleDateString('sv-SE', { weekday: 'short' }).replace('.', '');
    const info = vald != null ? (() => { const f = l[vald], d = new Date(f.datetime);
        return `<b>${vald === 0 ? 'Nu' : `${dagNr(d, new Date()) ? dagK(d) + ' ' : ''}kl ${hh(d)}`}</b> · ${A.vtext(f.condition)} · <b>${Math.round(f.temperature)}°</b>${mm[vald] ? ` · ${kr(mm[vald], 1)} mm` : f.precipitation_probability ? ` · ${f.precipitation_probability} % regnrisk` : ''}${v[vald] != null ? ` · ${Math.round(v[vald])} m/s` : ''}`; })()
      : `${Math.round(mn)}° – ${Math.round(mx)}° · ${mm.reduce((a, b) => a + b, 0) >= .1 ? `${kr(mm.reduce((a, b) => a + b, 0), 1)} mm regn` : 'inget regn'} · tryck för detaljer`;
    return kh('mdi:chart-bell-curve-cumulative', `Prognos<span class="vp-info">${info}</span>`, `<div class="vp-hog"><span class="pg-leg"><i class="t"></i>Temp<i class="r"></i>Regn${vk ? '<i class="v"></i>Vind' : ''}</span>${flik}</div>`)
      + `<div class="pg-rull"><div class="pg" style="--n:${n}">
      ${dyg.map(i => `<span class="pg-dyg" style="left:${(i / n * 100).toFixed(2)}%"></span>`).join('')}
      <div class="pg-rad pg-ik">${l.map((f, i) => steg(i) ? `<span style="grid-column:${i + 1}">${A.vikon(f.condition, 26, nattTim(new Date(f.datetime)))}</span>` : '').join('')}</div>
      <div class="pg-graf"><svg viewBox="0 0 ${n * W} 100" preserveAspectRatio="none">
        <defs><linearGradient id="pg-fyll" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--acc)" stop-opacity=".22"/><stop offset="1" stop-color="var(--acc)" stop-opacity="0"/></linearGradient></defs>
        ${mm.map((r, i) => r ? `<rect x="${i * W + 1.6}" y="${(100 - Math.max(3, r / pmx * 40)).toFixed(1)}" width="${W - 3.2}" height="${Math.max(3, r / pmx * 40).toFixed(1)}" rx="1.5" fill="var(--info)" opacity=".7"/>`
          : l[i].precipitation_probability >= 30 ? `<rect x="${i * W + 1.6}" y="${(100 - l[i].precipitation_probability / 100 * 10).toFixed(1)}" width="${W - 3.2}" height="${(l[i].precipitation_probability / 100 * 10).toFixed(1)}" rx="1.5" fill="var(--info)" opacity=".25"/>` : '').join('')}
        <path d="${tk} L${x(n - 1)} 100 L${x(0)} 100 Z" fill="url(#pg-fyll)"/>
        ${vk ? `<path d="${vk}" fill="none" stroke="var(--dim)" stroke-width="1.5" stroke-dasharray="4 4" vector-effect="non-scaling-stroke" opacity=".7"/>` : ''}
        <path d="${tk}" fill="none" stroke="var(--acc)" stroke-width="2.6" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>
        ${t.map((val, i) => steg(i) || i === vald ? `<i class="pg-p ${i === vald ? 'pa' : ''}" style="left:${pos(i)};top:${yT(val).toFixed(1)}%"></i><b class="pg-t ${i === vald ? 'pa' : ''}" style="left:${pos(i)};top:${yT(val).toFixed(1)}%">${Math.round(val)}°</b>` : '').join('')}
        ${mm.map((r, i) => r && (i === 0 || !mm[i - 1]) ? (() => { let j = i; while (j + 1 < n && mm[j + 1]) j++; const sum = mm.slice(i, j + 1).reduce((a, b) => a + b, 0), top = Math.max(...mm.slice(i, j + 1));
          return sum >= .1 ? `<b class="pg-mm" style="left:${(((i + j) / 2 + .5) / n * 100).toFixed(2)}%;bottom:${Math.max(3, top / pmx * 40).toFixed(1)}%">${kr(sum, 1)} mm</b>` : ''; })() : '').join('')}</div>
      <div class="pg-rad pg-v">${l.map((f, i) => steg(i) && v[i] != null ? `<span style="grid-column:${i + 1}">${vindPil(f.wind_bearing)}${Math.round(v[i])}</span>` : '').join('')}</div>
      <div class="pg-rad pg-h">${l.map((f, i) => { const d = new Date(f.datetime); return steg(i) || d.getHours() === 0 ? `<span style="grid-column:${i + 1}">${i === 0 ? '<b>Nu</b>' : d.getHours() === 0 ? `<b>${dagK(d)}</b>` : hh(d)}</span>` : ''; }).join('')}</div>
      <div class="pg-knapp">${l.map((f, i) => `<button class="${i === vald ? 'pa' : ''}" data-a="ptim" data-v="${i}" aria-label="kl ${hh(new Date(f.datetime))}"></button>`).join('')}</div>
      </div></div>`;
  };
  A.vprogDag = (k, flik, l) => {
    if (!l.length) return kh('mdi:calendar-week', 'Prognos', flik) + `<div class="dim">Hämtar prognos …</div>`;
    const enh = ((S(k.vader) || {}).attributes || {}).wind_speed_unit, lo = (f) => f.templow ?? f.temperature;
    const mn = Math.min(...l.map(lo)), mx = Math.max(...l.map(f => f.temperature)), sp = Math.max(mx - mn, 1);
    const po = (f) => f.temperature - (f.precipitation || 0) * 3 - (f.precipitation_probability || 0) / 15 + (f.condition === 'sunny' ? 4 : f.condition === 'partlycloudy' ? 2 : 0);
    const fin = l.length > 3 ? l.slice(1).reduce((m, f) => !m || po(f) > po(m) ? f : m, null) : null, summa = l.reduce((m, f) => m + (f.precipitation || 0), 0);
    return kh('mdi:calendar-week', `Prognos<span class="vp-info">${Math.round(mn)}° – ${Math.round(mx)}° · ${summa >= .1 ? `${kr(summa, 1)} mm regn totalt` : 'inget regn'}</span>`, `<div class="vp-hog">${fin ? `<span class="pg-leg"><span style="color:var(--acc)">${ik('mdi:star-four-points', 13)}</span>Finaste: ${new Date(fin.datetime).toLocaleDateString('sv-SE', { weekday: 'long' })}</span>` : ''}${flik}</div>`)
      + `<div class="pg-rull"><div class="pd" style="--n:${l.length}">${l.map((f, i) => { const d = new Date(f.datetime), ms = tillMs(f.wind_speed, enh), helg = d.getDay() === 0 || d.getDay() === 6;
        return `<div class="pd-d ${i === 0 ? 'idag' : ''}"><b class="pd-n ${helg ? 'helg' : ''}">${i === 0 ? 'Idag' : d.toLocaleDateString('sv-SE', { weekday: 'short' }).replace('.', '')}${f === fin ? `<span>${ik('mdi:star-four-points', 11)}</span>` : ''}</b>
          <span class="pd-dt">${d.getDate() + '/' + (d.getMonth() + 1)}</span>${A.vikon(f.condition, 26)}
          <b class="pd-h">${Math.round(f.temperature)}°</b><span class="pd-bar"><i style="bottom:${((lo(f) - mn) / sp * 100).toFixed(1)}%;top:${((mx - f.temperature) / sp * 100).toFixed(1)}%;background:linear-gradient(0deg, ${tempF(lo(f))}, ${tempF(f.temperature)})"></i></span>
          <span class="pd-l">${Math.round(lo(f))}°</span><span class="pd-r">${f.precipitation >= .1 ? kr(f.precipitation, 1) + ' mm' : f.precipitation_probability ? f.precipitation_probability + ' %' : '–'}</span>
          <span class="pd-v">${ms != null ? `${vindPil(f.wind_bearing)}${Math.round(ms)} m/s` : ''}</span></div>`; }).join('')}</div></div>`;
  };
  R.vsido = (_, k) => {
    const sol = S('sun.sun');
    let solHtml = '';
    // Timmar och minuter utan att det blir "60 min"
    const ht = (ms, lang) => { const m = Math.round(ms / 6e4), h = Math.floor(m / 60); return lang ? `${h ? h + ' h ' : ''}${m % 60} min` : `${h} h ${m % 60} m`; };
    if (sol) {
      const upp = sol.state === 'above_horizon', nr = new Date(sol.attributes.next_rising), ns = new Date(sol.attributes.next_setting), nu = new Date();
      const ug = upp ? new Date(nr - 864e5) : nr, ng = ns, langd = Math.max(1, ng - ug), andel = upp ? klamp((nu - ug) / langd, 0, 1) : 0;
      const r = 110, cx = 150, cy = 120, v = Math.PI * (1 - andel), sx = cx + r * Math.cos(v), sy = cy - r * Math.sin(v), L = Math.PI * r;
      solHtml = `<div class="sido-sol">` + kh('mdi:weather-sunset', 'Solen') + `<svg class="solbage" viewBox="0 0 300 132"><path d="M40 ${cy} A ${r} ${r} 0 0 1 260 ${cy}" fill="none" stroke="var(--yta3)" stroke-width="2" stroke-dasharray="3 6"/>
        <path d="M40 ${cy} A ${r} ${r} 0 0 1 260 ${cy}" fill="none" stroke="var(--acc)" stroke-width="3" stroke-linecap="round" stroke-dasharray="${L.toFixed(1)}" stroke-dashoffset="${(L * (1 - andel)).toFixed(1)}"/>
        ${upp ? `<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="16" fill="#FFC53D" opacity=".3" filter="url(#a-blur)"/><circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="9" fill="url(#a-sol)"/>`
          : (() => { const ned = new Date(ns - 864e5), an = klamp((nu - ned) / Math.max(1, nr - ned), 0, 1), vn = Math.PI * (1 - an), mx = cx + r * Math.cos(vn), my = cy - r * Math.sin(vn);
            return `<path d="M40 ${cy} A ${r} ${r} 0 0 1 260 ${cy}" fill="none" stroke="var(--info)" stroke-width="3" stroke-linecap="round" opacity=".55" stroke-dasharray="${L.toFixed(1)}" stroke-dashoffset="${(L * (1 - an)).toFixed(1)}"/>
              <circle cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" r="14" fill="#F4E7C3" opacity=".25" filter="url(#a-blur)"/><circle cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" r="8" fill="#F4E7C3"/>
              <text x="150" y="112" text-anchor="middle" font-size="11" font-weight="800" fill="var(--dim)">Natt</text>`; })()}</svg>
        <div class="soltider"><div>Upp<b>${hm(ug)}</b></div><div style="text-align:center">Dagsljus<b>${ht(langd)}</b></div><div style="text-align:right">Ner<b>${hm(ng)}</b></div></div>`;
      const lat = A.hass.config && A.hass.config.latitude, idag = new Date(), igar = new Date(Date.now() - 864e5);
      const diff = lat != null ? Math.round((dagLangd(idag, lat) - dagLangd(igar, lat)) * 60) : 0, kvar = upp ? ng - nu : nr - nu;
      solHtml += `<div class="sol-info"><span>${ik(upp ? 'mdi:weather-sunset-down' : 'mdi:weather-sunset-up', 16)}${upp ? 'Solen går ner' : 'Solen går upp'} om ${ht(kvar, true)}</span>
        ${diff ? `<span>${ik(diff > 0 ? 'mdi:arrow-up-thin' : 'mdi:arrow-down-thin', 16)}Dagarna blir ${Math.abs(diff)} min ${diff > 0 ? 'längre' : 'kortare'} per dag</span>` : ''}</div>`;
    }
    // Månen
    const m = A.maneData(k), dg = (d) => Math.max(1, Math.round((d - Date.now()) / 864e5)), dat = (d) => d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' }).replace('.', '');
    const ns_ = A.norrsken(k), nattT = A.prognos(k.vader, 'hourly').slice(0, 18).filter(f => { const h = new Date(f.datetime).getHours(); return h >= 21 || h <= 4; });
    const molnig = nattT.length ? nattT.filter(f => /cloudy$|rain|pour|snow|fog|hail|lightning/.test(f.condition) && f.condition !== 'partlycloudy').length / nattT.length : null;
    const himmelTxt = molnig == null ? '' : molnig < .3 ? ['Klart i natt – fin stjärnhimmel', 'mdi:star-four-points-outline', 'var(--ok)'] : molnig < .7 ? ['Delvis molnigt i natt', 'mdi:weather-night-partly-cloudy', 'var(--varn)'] : ['Molnigt i natt', 'mdi:weather-cloudy', 'var(--dim)'];
    const maneHtml = `<div class="sido-del">${kh('mdi:weather-night', 'Natthimlen')}<div class="mane-rad">${maneSvg(m, 22)}<div><b>${esc(m.fas)}</b><small>${Math.round(m.ill * 100)} % belyst · ${m.ill > .97 ? `nymåne ${dat(m.ny)}` : `fullmåne ${dat(m.full)} (om ${dg(m.full)} d)`}</small></div></div>
      ${himmelTxt || ns_ ? `<div class="natt-rader">${himmelTxt ? `<div>${ik(himmelTxt[1], 16)}<span>${himmelTxt[0]}</span></div>` : ''}${ns_ ? `<div>${ik('mdi:creation', 16)}<span>Norrsken: ${ns_.txt}</span><b style="color:${ns_.f}">Kp ${kr(ns_.kp, 0)}</b></div>` : ''}</div>` : ''}</div>`;
    // Vinden
    const vi = A.vind(k);
    const vindHtml = !vi ? '' : `<div class="sido-del">${kh('mdi:weather-windy', 'Vinden')}<div class="vind-rad">
      <svg class="kompass" viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="var(--yta2)"/>${Array.from({ length: 36 }, (_, i) => `<line x1="50" y1="${i % 9 ? 9 : 7}" x2="50" y2="${i % 9 ? 12 : 14}" stroke="var(--svag)" stroke-width="${i % 9 ? 1 : 1.6}" transform="rotate(${i * 10} 50 50)"/>`).join('')}
        ${[['N', 50, 23], ['Ö', 79, 53.5], ['S', 50, 84], ['V', 21, 53.5]].map(([t, x, y]) => `<text x="${x}" y="${y}" text-anchor="middle" font-size="9" font-weight="800" fill="${t === 'N' ? 'var(--acc)' : 'var(--dim)'}">${t}</text>`).join('')}
        ${vi.grad != null ? `<g transform="rotate(${(vi.grad + 180) % 360} 50 50)"><path d="M50 22 L57 40 L50 36 L43 40 Z" fill="var(--acc)"/><line x1="50" y1="36" x2="50" y2="74" stroke="var(--acc)" stroke-width="3" stroke-linecap="round"/><circle cx="50" cy="74" r="3.5" fill="var(--yta)" stroke="var(--acc)" stroke-width="2"/></g>` : ''}</svg>
      <div><b>${kr(vi.ms, vi.ms < 10 ? 1 : 0)}<small> m/s</small></b><span>${vi.namn}${vi.fran ? ` från ${vi.fran}` : ''}</span>${vi.byar ? `<small>Byar ${Math.round(vi.byar)} m/s</small>` : ''}</div></div></div>`;
    return (solHtml ? solHtml + '</div>' : '') + maneHtml + vindHtml;
  };
  // Pollen (visas i Väderkoll när det finns pollen i luften)
  const POLNIVA = ['Inga', 'Mycket låga', 'Låga', 'Måttliga', 'Måttligt höga', 'Höga', 'Mycket höga'], polF = (n) => n >= 5 ? 'var(--fel)' : n >= 3 ? 'var(--varn)' : 'var(--ok)';
  A.pollenLista = (k) => {
    if (!k.pollen) return [];
    const niva = (s) => { const x = parseFloat(s.state); if (!isNaN(x)) return klamp(Math.round(x), 0, 6); const t = String(s.state).toLowerCase();
      return /mycket h/.test(t) ? 6 : /h(ö|o)g/.test(t) ? 5 : /m(å|a)ttlig/.test(t) ? 3 : /l(å|a)g/.test(t) ? 2 : 0; };
    const ort = String(k.pollenPlats || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return Object.keys(A.hass.states).filter(id => id.startsWith(k.pollen)).map(id => ({ id, n: niva(S(id)), namn: namn(id).replace(new RegExp(`^Pollenprognos\\s*${ort}\\s*`, 'i'), '').replace(/^Pollen\s*/i, '') }))
      .filter(p => p.n > 0).sort((a, b) => b.n - a.n);
  };

  // Hushåll-sidan
  R.kaffe = (_, k) => {
    const p = k.kaffe, drift = S(`sensor.${p}_driftstatus`), strom = S(`switch.${p}_av_pa`);
    if (!drift && !strom) return kh('mdi:coffee-outline', 'Kaffe') + tom('Hittar ingen kaffemaskin – ändra _kaffe i mitt_hem', 'mdi:coffee-off-outline');
    let l = drift ? String(drift.state).split('.').pop().toLowerCase() : 'unavailable';
    if (strom && strom.state === 'off') l = 'off';
    const T = { run: ['Brygger …', 'acc'], delayedstart: ['Startar snart', 'acc'], ready: ['Redo', 'ok'], finished: ['Klar – njut!', 'ok'], pause: ['Pausad', 'varn'], actionrequired: ['Behöver åtgärd', 'varn'], error: ['Fel', 'fel'], off: ['Avstängd', ''], inactive: ['Viloläge', ''] };
    const [txt, f] = T[l] || ['Ej ansluten', ''], brygger = l === 'run' || l === 'delayedstart', val = A.kaffeVal && Date.now() - A.kaffeVal.t < 3500 ? A.kaffeVal.prog : '';
    const DR = [['espresso', 'Espresso', 'mdi:coffee-outline'], ['coffee', 'Kaffe', 'mdi:coffee'], ['cappuccino', 'Cappuccino', 'mdi:cup'], ['latte_macchiato', 'Latte', 'mdi:glass-mug-variant']];
    return `<div class="hh">${kh('mdi:coffee-outline', esc(k.kaffeModell || 'Kaffemaskin'), `<div class="knapprad"><span class="pill ${f}">${txt}</span>${strom ? `<button class="vxl ${strom.state === 'on' ? 'pa' : ''}" data-a="tj" data-d="switch.toggle" data-e="${strom.entity_id}"></button>` : ''}</div>`)}
      <div class="hh-bild">${A.produkt('kaffe', l !== 'off', '', { brygger })}</div>
      <div class="drycker">${DR.map(([prog, n, i]) => `<button class="dryck ${val === prog ? 'bekrafta' : ''}" data-a="kaffe" data-v="${prog}" ${l === 'off' || brygger ? 'disabled' : ''}>${ik(i, 20)}<span>${val === prog ? 'Igen!' : n}</span></button>`).join('')}</div></div>`;
  };
  R.dammsugare = (_, k) => {
    const lst = k.dammar.filter(x => S(x.e)), x = lst[klamp(A.dammVal || 0, 0, Math.max(lst.length - 1, 0))], e = x && S(x.e);
    if (!e) return kh('mdi:robot-vacuum', 'Dammsugare') + tom('Hittar ingen dammsugare – ändra _dammsugare i mitt_hem', 'mdi:robot-vacuum-alert');
    const s = e.state, a = e.attributes;
    let batt = a.battery_level;
    if (batt == null) batt = tal(x.batteri);
    // Flera robotar: välj med flikarna överst
    const val = lst.length > 1 ? `<div class="dam-val">${lst.map((y, i) => { const t = S(y.e), aktiv = ['cleaning', 'returning'].includes(t.state);
      return `<button class="${y === x ? 'pa' : ''}" data-a="dammval" data-v="${k.dammar.indexOf(y)}">${aktiv ? '<i></i>' : ''}${esc(y.namn || t.attributes.friendly_name || y.e)}</button>`; }).join('')}</div>` : '';
    const T = { cleaning: ['Städar', 'acc'], returning: ['På väg hem', 'acc'], docked: [batt === 100 ? 'Fulladdad' : 'Laddar', 'ok'], idle: ['Väntar', ''], paused: ['Pausad', 'varn'], error: ['Behöver hjälp', 'fel'] };
    const [txt, f] = T[s] || ['Ej ansluten', ''], bf = batt == null ? 'var(--svag)' : batt < 20 ? 'var(--fel)' : batt < 50 ? 'var(--varn)' : 'var(--ok)';
    const knapp = (d, ikon, text, prim) => `<button class="knapp ${prim ? 'prim' : ''}" data-a="tj" data-d="vacuum.${d}" data-e="${e.entity_id}">${ik(ikon, 17)}${text}</button>`;
    const knappar = s === 'cleaning' ? knapp('pause', 'mdi:pause', 'Pausa') + knapp('return_to_base', 'mdi:home-import-outline', 'Hem')
      : s === 'returning' ? knapp('pause', 'mdi:pause', 'Stoppa') : knapp('start', 'mdi:play', s === 'paused' ? 'Fortsätt' : 'Städa nu', true) + (s !== 'docked' ? knapp('return_to_base', 'mdi:home-import-outline', 'Hem') : '');
    return `<div class="hh">${kh('mdi:robot-vacuum', esc(x.namn || a.friendly_name || 'Dammsugare'), `<span class="pill ${f}">${txt}</span>`)}${val}
      <div class="hh-bild" ${x.popup ? `data-a="popup" data-v="${esc(x.popup)}"` : `data-a="info" data-e="${e.entity_id}"`}>${A.produkt('robot', s === 'cleaning')}</div>
      <div class="knapprad" style="margin-bottom:12px">${batt != null ? `${ik('mdi:battery-outline', 18)}<div class="batt"><i style="width:${batt}%;background:${bf}"></i></div><b style="font-size:13px;color:${bf}">${Math.round(batt)} %</b>` : ''}</div>
      <div class="knapprad">${knappar}${x.popup ? `<button class="knapp" data-a="popup" data-v="${esc(x.popup)}">${ik('mdi:map-outline', 17)}Karta</button>` : ''}</div></div>`;
  };
  R.vaxter = (_, k) => {
    let torra = 0;
    const rader = k.vaxter.map(v => {
      const x = tal(v.sensor), min = +v.min || 30, max = +v.max || 60;
      if (x == null) return '';
      const f = x < min ? 'var(--varn)' : x > max ? 'var(--info)' : 'var(--ok)', C = 2 * Math.PI * 16;
      if (x < min) torra++;
      return `<div class="vx" data-a="info" data-e="${v.sensor}"><svg class="ring" viewBox="0 0 42 42"><circle cx="21" cy="21" r="16" stroke="var(--yta3)"/>
        <circle cx="21" cy="21" r="16" stroke="${f}" stroke-linecap="round" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - klamp(x, 0, 100) / 100)).toFixed(1)}"/></svg>
        <div><b>${esc(v.namn || namn(v.sensor).replace(/\s*(luftfuktighet|fukt|moisture)$/i, ''))}</b><small>${x < min ? 'Behöver vatten' : x > max ? 'För blöt' : 'Mår bra'}</small></div><span class="p" style="color:${f}">${Math.round(x)}%</span></div>`;
    }).join('');
    return `<div class="hh">${kh('mdi:sprout-outline', 'Växter', `<span class="pill ${torra ? 'varn' : 'ok'}">${torra ? `${torra} törstiga` : 'Alla mår bra'}</span>`)}
      <div class="hh-bild" style="flex:.8">${A.produkt('vaxt', true)}</div><div>${rader || tom('Inga växtsensorer', 'mdi:sprout')}</div></div>`;
  };
  R.kalender = (_, k) => {
    const ids = (k.kalendrar.length ? k.kalendrar : Object.keys(A.hass.states).filter(id => id.startsWith('calendar.'))).filter(id => S(id));
    A.hamtaKal(ids);
    const c = A.kal[ids.join(',')], nu = new Date();
    let inne;
    if (!ids.length) inne = tom('Ingen kalender', 'mdi:calendar-blank-outline');
    else if (!c || (c.laddar && !c.lista)) inne = `<div class="dim">Hämtar …</div>`;
    else { const kvar = c.lista.filter(e => e.heldag || new Date(e.slut) > nu).slice(0, 5); let dag = '';
      inne = kvar.map(e => { const s = new Date(e.heldag ? e.start + 'T00:00' : e.start), ds = s.toDateString(), rub = ds !== dag && ds !== nu.toDateString() ? '<div class="dag-r">Imorgon</div>' : '';
        dag = ds; return `${rub}<div class="hand"><span class="t">${e.heldag ? 'Heldag' : hm(s)}</span><span class="s" style="background:${e.farg}"></span><div style="min-width:0"><b>${esc(e.titel)}</b>${e.plats ? `<small>${esc(e.plats)}</small>` : ''}</div></div>`; }).join('')
        || tom('Inget inbokat', 'mdi:calendar-check-outline'); }
    return kh('mdi:calendar-blank-outline', 'Idag & imorgon') + inne;
  };
  R.todo = (_, k) => {
    const id = k.attGora;
    if (!S(id)) return tom('Hittar inte listan – ändra _att_gora i mitt_hem', 'mdi:format-list-checks');
    A.hamtaTodo(id);
    const p = A.todo[id];
    if (!p) return `<div class="dim">Hämtar …</div>`;
    const aktiva = p.filter(x => x.status !== 'completed'), klara = p.filter(x => x.status === 'completed');
    const rad = (x, klar) => `<button class="ti ${klar ? 'klar' : ''}" data-a="todo" data-u="${esc(x.uid)}" data-k="${klar ? 1 : 0}"><span class="box">${klar ? ik('mdi:check', 15) : ''}</span><span>${esc(x.summary)}</span></button>`;
    return (aktiva.map(x => rad(x, false)).join('') || tom('Inget att komma ihåg', 'mdi:check-all')) + klara.slice(0, 2).map(x => rad(x, true)).join('')
      + (klara.length ? `<button class="rensa" data-a="todorensa">Rensa ${klara.length} klara</button>` : '');
  };
  R.batterier = () => {
    const h = A.hass.states;
    const l = Object.keys(h).filter(id => id.startsWith('sensor.') && h[id].attributes.device_class === 'battery' && !isNaN(parseFloat(h[id].state)))
      .map(id => ({ id, v: parseFloat(h[id].state), n: namn(id).replace(/\s*(batteri(nivå)?|battery( level)?)$/i, '') })).sort((a, b) => a.v - b.v);
    const f = (v) => v < 20 ? 'var(--fel)' : v < 50 ? 'var(--varn)' : 'var(--ok)';
    return l.map(b => `<div class="bat" data-a="info" data-e="${b.id}"><span>${esc(b.n)}</span><div class="batt"><i style="width:${klamp(b.v, 0, 100)}%;background:${f(b.v)}"></i></div>
      <b style="color:${b.v < 20 ? f(b.v) : 'inherit'}">${Math.round(b.v)}%</b></div>`).join('') || tom('Inga batterisensorer', 'mdi:battery-unknown');
  };

  // ═════════════ Skalet ═════════════
  A.skal = (k) => {
    const sidor = A.sidor(k);
    const s = (n, cls = 'kort', arg = '') => `<div class="${cls}" data-s="${n}" data-arg="${esc(arg)}"></div>`;
    const sida = (id, inner) => sidor.some(x => x[0] === id) ? `<section class="sida" data-p="${id}">${inner()}</section>` : '';
    const LANKAR = [['Inställningar', 'mdi:cog-outline', '/config/dashboard', 'var(--text)'], ['Integrationer', 'mdi:puzzle-outline', '/config/integrations/dashboard', 'var(--info)'],
      ['Automationer', 'mdi:robot-outline', '/config/automation/dashboard', 'var(--acc)'], ['Loggar', 'mdi:text-box-search-outline', '/config/logs', 'var(--fel)']];
    const stopp = ['pointerup', 'touchstart', 'touchend', 'mousedown', 'mouseup'].map(t => `on${t}="event.stopPropagation()"`).join(' ');
    return `<style>${A.css(k)}</style>${DEFS}
    <div class="aura ${A.temaKlass(k.tema)}" onpointerdown="window.Aura.ned(event, this); event.stopPropagation()" onclick="window.Aura.klick(event, this)" ${stopp}>
      <div class="bg"></div>
      <nav class="nav"><span class="nav-logo">${ik('mdi:home-variant', 24)}</span>
        ${sidor.map(([id, txt, ikon]) => `<button class="navk" data-a="sida" data-v="${id}" aria-label="${txt}">${ik(ikon, 22)}<span>${txt}</span></button>`).join('')}${k.gn ? s('gnknapp', 'gnk') : ''}</nav>
      <main class="main">
        <header class="topp" data-s="topp"></header>
        <div class="sidor">
          ${sida('hem', () => `<div class="lay hem">
            <div class="kol">${s('klimat', 'kort klimat fa o4')}${s('forslag', 'kort forslag f1 o3')}${s('mediamini', 'kort mmkort fa o6')}</div>
            <div class="kol">${s('hero', 'kort hero f1 o1')}${s('enheter', 'kort enheter-kort f15 o2')}</div>
            <div class="kol">${k.vader ? s('vaderkort', 'kort f13 o5') : ''}${s('hemma', 'kort fa o8')}${k.el ? s("elmini", "kort f1 o7") : ""}</div></div>`)}
          ${sida('ljus', () => `<div class="lay ljuslay">${s('scener', 'kort rull-y')}${s('ljusrum', 'kort rull-y')}</div>`)}
          ${sida('media', () => `<div class="lay medialay">${s('media', 'kort mpkort')}
            <div class="kort bib"><label class="sokfalt">${ik('mdi:magnify', 20)}<input type="search" enterkeyhint="search" placeholder="Sök låtar, artister, album, radio …"
              oninput="window.Aura.sokSnart(this)" onkeydown="if (event.key === 'Enter') { window.Aura.sokNu(this.value); this.blur(); }"></label>
              ${s('mflikar', 'mflikar')}${s('mlista', 'mlista rull-y')}</div></div>`)}
          ${sida('energi', () => `<div class="lay ellay ${A.harSolBatt(k) ? 'medsol' : ''} ${k.elbil ? 'medbil' : ''}">${k.elbil ? `<div class="el-vanster">${s('elnu', 'kort rull-y')}${s('elbil', 'kort elbilkort')}</div>` : s('elnu', 'kort rull-y')}${s('elgraf', 'kort elgraf')}${s('elapp', 'kort elapp')}${A.harSolBatt(k) ? s('solkort', 'kort solkort rull-y') : ''}${s('elstat', 'kort')}</div>`)}
          ${sida('sakerhet', () => `<div class="lay saklay ny ${k.kameror.length ? 'medkam' : ''} ${k.handelser ? 'medhand' : ''}">${s('larm', 'kort larmkort rull-y')}${k.kameror.length ? s('kameror', 'kort kamkort') : ''}${k.handelser ? s('handelser', 'kort handkort') : ''}${!k.larm ? s('skydd') : ''}</div>`)}
          ${sida('vader', () => `<div class="lay vlay">${s('vnu', 'kort vnu-kort')}<div class="kort rull-y vsidokort">${k.radar ? s('vradar', 'radar-slot') : ''}${s('vsido', k.radar ? 'sido-del' : 'sido-slot')}</div>${s('vkoll', 'kort rull-y')}${s('vute', 'kort rull-y')}${s('vprog')}</div>`)}
          ${sida('varme', () => `<div class="lay vmlay">${s('vmlagen', 'kort portlagen')}${k.varme.map(x => s('varmekort', 'kort vmkort', x.e)).join('')}</div>`)}
          ${sida('portar', () => `<div class="lay portlay">${s('portlagen', 'kort portlagen')}${PORTTYPER.filter(t => k.portar.some(p => p.typ === t)).map(t => s('portgrupp', 'kort portkort', t)).join('')}</div>`)}
          ${sida('hushall', () => {
            const hk = [k.spa && s('spa', 'kort hk-spa'), k.kaffe && s('kaffe', 'kort hk-kaffe'), k.dammar.length && s('dammsugare', 'kort hk-damm'),
              k.vaxter.length && s('vaxter', 'kort rull-y hk-vaxt'),
              k.buss && `<div class="kort busskort hk-buss">${s('buss', 'buss-in')}${s('busspaminn', 'buss-st')}</div>`,
              `<div class="kort flex-kol hk-kal">${s('kalender', 'rull-y')}</div>`,
              `<div class="kort flex-kol hk-todo">${kh('mdi:format-list-checks', 'Kom ihåg')}${s('todo', 'rull-y')}${k.attGora ? `<label class="todo-ny">${ik('mdi:plus', 18)}<input type="text" enterkeyhint="done" placeholder="Lägg till …" onkeydown="if (event.key === 'Enter') window.Aura.todoNy(this)"></label>` : ''}</div>`,
              k.server && s('server', 'kort rull-y hk-server'),
              `<div class="kort rull-y hk-inst">${kh('mdi:palette-swatch-outline', 'Utseende', s('diagpill', 'diag-slot'))}${s('tema', 'tema-slot')}<div class="kh" style="margin:14px 0 8px"><div class="kh-t"><span class="kh-ik">${ik('mdi:battery-heart-variant', 17)}</span>Batterier</div></div>${s('batterier')}
                <div class="lankar" style="margin-top:12px">${LANKAR.map(([n, ikon, l, f]) => `<button class="lank" data-a="lank" data-v="${l}" style="--lc:${f}"><span class="lank-ik">${ik(ikon, 18)}</span>${n}</button>`).join('')}</div></div>`].filter(Boolean);
            const kol = Math.ceil((hk.length + (k.spa ? 1 : 0)) / 2);
            return `<div class="lay hhlay ${k.spa ? 'medspa' : ''}" style="--hhk:${kol};${k.spa ? `grid-template-columns:minmax(0, 1.3fr) repeat(${kol - 1}, minmax(0, 1fr))` : ''}">${hk.join('')}</div>`; })}
        </div>
      </main>
    </div>`;
  };

  // ═════════════ Uppdatering ═════════════
  A.rot = (el) => el && el.shadowRoot && el.shadowRoot.querySelector('.aura');
  A.render = (el, v) => {
    A.kort.add(el);
    const k = A.k = A.konf(v), nyckel = JSON.stringify(k);
    if (A.skalK !== nyckel) { A.skalK = nyckel; A.skalC = A.skal(k); }
    clearTimeout(el._auraT);
    el._auraT = setTimeout(() => A.patcha(el), 0);
    return A.skalC;
  };
  A.hojd = (rot) => { const t = Math.max(0, rot.getBoundingClientRect().top + (window.scrollY || 0)); rot.style.setProperty('--h', (window.innerHeight - t) + 'px'); };
  A.patcha = (el) => {
    const rot = A.rot(el);
    if (!rot || !A.k) return;
    const k = A.k, sidor = A.sidor(k).map(x => x[0]);
    if (!sidor.includes(A.sida)) A.sida = 'hem';
    if (A.rum !== 'oversikt' && !k.rum[+A.rum]) A.rum = 'oversikt';
    if (rot.dataset.sida !== A.sida) rot.dataset.sida = A.sida;
    A.hojd(rot);
    const nu = Date.now();
    rot.querySelectorAll(`.topp[data-s], .gnk[data-s], .sida[data-p="${A.sida}"] [data-s]`).forEach(n => {
      if (A.las && A.las.nod === n && nu < A.las.till) return;
      if (A.drag && n.contains(A.drag.t)) return;
      let h;
      try { h = A.S[n.dataset.s](n.dataset.arg, k); } catch (e) { console.error('Aura', n.dataset.s, e); h = `<div class="fel">Fel i ${esc(n.dataset.s)}: ${esc(e.message)}</div>`; }
      if (n._h !== h) { n.innerHTML = h; n._h = h; n.style.display = h ? '' : 'none'; }
    });
    A.tickRot(rot, nu);
  };
  A.patchaAlla = () => A.kort.forEach(el => el.isConnected ? A.patcha(el) : A.kort.delete(el));
  A.patchaSnart = () => { if (A._snart) return; A._snart = requestAnimationFrame(() => { A._snart = 0; A.patchaAlla(); }); };
  window.addEventListener('resize', () => A.kort.forEach(el => { const r = A.rot(el); if (r) A.hojd(r); }));
  A.tickRot = (rot, nu) => {
    rot.querySelectorAll('.radar').forEach(el => { if (!el.dataset.klar || el.dataset.tema !== (A.k && A.k.tema) || nu - (el._t || 0) > 10 * 6e4) { if (el.offsetParent) A.radarInit(el); } });
    const d = new Date(nu), kl = `${hh(d)}<span class="kolon">:</span>${String(d.getMinutes()).padStart(2, '0')}`;
    rot.querySelectorAll('[data-tick="klocka"]').forEach(n => { if (n._k !== kl) { n.innerHTML = kl; n._k = kl; } });
    rot.querySelectorAll('[data-prog]').forEach(n => {
      const x = n.dataset, l = +x.langd || 0;
      let p = +x.pos || 0;
      if (x.spelar === '1' && x.uppd) p += (nu - Date.parse(x.uppd)) / 1000;
      p = klamp(p, 0, l);
      const i = n.querySelector('i'), t = n.querySelector('.p-nu');
      if (i) i.style.width = (l ? p / l * 100 : 0) + '%';
      if (t) t.textContent = mmss(p);
    });
    rot.querySelectorAll('[data-ned]').forEach(n => { n.textContent = mmss(Math.max(0, (+n.dataset.ned - nu) / 1000)); });
    rot.querySelectorAll('[data-ned-s]').forEach(n => { n.textContent = Math.max(0, Math.ceil((+n.dataset.nedS - nu) / 1000)); });
    rot.querySelectorAll('[data-ned-c]').forEach(n => { const kvar = Math.max(0, (+n.dataset.nedC - nu) / 1000); n.style.strokeDashoffset = (CIRK * (1 - kvar / (+n.dataset.tot || 1))).toFixed(1); });
  };
  A.sek = 0;
  A.timer = setInterval(() => {
    const nu = Date.now();
    A.sek++;
    if (A.kaffeVal && nu - A.kaffeVal.t > 3500) { A.kaffeVal = null; A.patchaAlla(); }
    if (A.kvall && nu >= A.kvall.slut) A.kvallKor();
    A.larmVakt(); A.bortaKoll(); A.givareVakt(); if (A.sek % 5 === 0) A.partyKoll(); { const el = document.getElementById('aura-larm'); if (el) el.className = 'st-' + ((S(A.k && A.k.larm) || {}).state || ''); }
    if (A.bussP && A.sek % 10 === 0) A.bussKoll();
    A.kort.forEach(el => { const rot = A.rot(el); if (!rot) return; A.tickRot(rot, nu);
      if (A.sek % 10 === 0) rot.querySelectorAll('img[data-still]').forEach(img => { img.src = img.dataset.still + (img.dataset.still.includes('?') ? '&' : '?') + 't=' + nu; }); });
    if (A.sek % 60 === 0) A.patchaAlla();
  }, 1000);

  // ═════════════ Tryck och gester ═════════════
  A.byt = (sida) => { if (A.sida !== sida) { A.sida = sida; minne('sida', sida); try { window.scrollTo({ top: 0 }); } catch (e) {} } A.vibb(6); A.patchaAlla(); };
  A.lasa = (input) => { A.las = { nod: input.closest('[data-s]'), till: Infinity };
    const slapp = () => { if (A.las) A.las.till = Date.now() + 1500; window.removeEventListener('pointerup', slapp, true); };
    window.addEventListener('pointerup', slapp, true); };
  A.volym = (input) => { A.tj('media_player', 'volume_set', { entity_id: input.dataset.vol, volume_level: +input.value / 100 }); if (A.las) A.las.till = Date.now() + 1500; };
  A.klick = (e, rot) => {
    const b = e.target.closest('[data-a]');
    if (!b || !rot.contains(b) || A.ignoreraKlick) return;
    e.stopPropagation();
    const a = b.dataset.a, k = A.k, id = b.dataset.e;
    const sattOpt = (ids, on) => ids.forEach(x => { A.opt[x] = { on, till: Date.now() + 4000 }; });
    if (a === 'sida') return A.byt(b.dataset.v);
    if (a === 'tema') {
      A.temaVal = b.dataset.v; minne('tema', A.temaVal); A.k.tema = A.temaVal; A.skalK = '';
      A.kort.forEach(el => { const r = A.rot(el); if (r) { r.classList.remove('ljus', 'mork', 'noir'); r.classList.add(...A.temaKlass(A.temaVal).split(' ')); } });
      A.vibb(8); return A.patchaAlla();
    }
    if (a === 'busstid') { A.bussVal = ((A.bussVal || 0) + (+b.dataset.v) + 1440) % 1440; A.vibb(6); return A.patchaAlla(); }
    if (a === 'bussnasta') { const d = A.bussData(k), n = d && d.avg[0]; if (!n) return A.meddela('Ingen avgång just nu');
      A.bussP = { t: +n.t }; minne('buss', JSON.stringify(A.bussP)); A.vibb(10); A.bussKoll(); return A.patchaAlla(); }
    if (a === 'busspaminn') {
      const v = A.bussVal ?? 0, hh_ = Math.floor(v / 60), mm_ = v % 60, T = new Date(); T.setHours(hh_, mm_, 0, 0);
      if (T < Date.now() - 6e4) T.setDate(T.getDate() + 1);
      A.bussP = { t: +T }; minne('buss', JSON.stringify(A.bussP)); A.vibb(10); A.bussKoll(); return A.patchaAlla();
    }
    if (a === 'bussav') { A.bussP = null; minne('buss', ''); return A.patchaAlla(); }
    if (a === 'busstest') { const d = A.bussData(k); if (d && d.avg[0]) return A.bussSag(k, d, d.avg[0]); return A.meddela('Ingen avgång att läsa upp just nu'); }
    if (a === 'party') { A.vibb(12); if (A.partyIgang(k)) A.partyStoppa(k); else A.partyStarta(k, true); return; }
    if (a === 'partytakt') { A.partyTakt = b.dataset.v; minne('partytakt', A.partyTakt); if (A.partyIgang(k)) A.partyStarta(k, false); return A.patchaAlla(); }
    if (a === 'vadra') { const vd = A.vadra(k); return vd && A.meddela(`${vd.t}. ${vd.s}. Luftfuktigheten inne går från ${vd.fran} % till ungefär ${vd.till} %.`); }
    if (a === 'varn') { A.vibb(8); return A.varnPanel(k, +b.dataset.i || 0); }
    if (a === 'vprog') { A.vprogLage = b.dataset.v; A.pSel = null; minne('vprog', A.vprogLage); A.vibb(6); return A.patchaAlla(); }
    if (a === 'ptim') { const i = +b.dataset.v; A.pSel = A.pSel === i ? null : i; A.vibb(4); clearTimeout(A._pSelT); A._pSelT = setTimeout(() => { A.pSel = null; A.patchaAlla(); }, 12000); return A.patchaAlla(); }
    if (a === 'portpanel') { A.vibb(6); return A.portPanel(k, id); }
    if (a === 'port') { const tj = b.dataset.d;
      // Garageporten: tryck två gånger för att öppna
      if (b.dataset.bekr === '1' && tj === 'open_cover' && !(A.portBekr && A.portBekr.e === id && Date.now() - A.portBekr.t < 4000)) { A.portBekr = { e: id, t: Date.now() }; A.vibb(8); setTimeout(() => A.patchaAlla(), 4100); return A.patchaAlla(); }
      A.portBekr = null; A.vibb(10); A.tj('cover', tj, { entity_id: id }); return A.patchaAlla(); }
    if (a === 'diagnos') return A.diagnosPanel(k);
    if (a === 'spainst') return A.spaInst(k);
    if (a === 'spaplan') { A.vibb(8); return A.spaPlan(k); }
    if (a === 'spaplanav') { A.vibb(8); A.spaPlanAv(k); return A.patchaAlla(); }
    if (a === 'spalage') { const d = A.spaData(k); if (!d || !d.lageId) return; A.spaLageOpt = { v: b.dataset.v, till: Date.now() + 6000 }; A.vibb(8); A.tj('select', 'select_option', { entity_id: d.lageId, option: b.dataset.v }); return A.patchaAlla(); }
    if (a === 'spabad') { const d = A.spaData(k); if (!d) return; const ids = [...d.pumpar, ...d.lampor.slice(0, 1)]; A.vibb(12);
      if (!ids.length) return A.meddela('Hittar ingen pump eller lampa till spabadet');
      if (b.classList.contains('vxl')) b.classList.toggle('pa');
      return A.tj('homeassistant', d.badar ? 'turn_off' : 'turn_on', { entity_id: ids }); }
    if (a === 'vmsteg') { const s = S(id); if (!s) return; const at = s.attributes, steg = at.target_temp_step || 0.5, o = A.vmOpt[id], nu = o && Date.now() < o.till ? o.t : at.temperature;
      const golv = k.spa && A.spaData(k) && A.spaData(k).termostat === id ? Math.max(at.min_temp ?? 5, A.spaMin(k)) : at.min_temp ?? 5;
      if (+b.dataset.v < 0 && nu - steg < golv - .01 && golv > (at.min_temp ?? 5)) { A.vibb(20); return A.meddela(`Lägsta temperatur är ${g5(golv)}° – ändra under kugghjulet på kortet`); }
      const ny = klamp(Math.round((nu + steg * +b.dataset.v) / steg) * steg, golv, at.max_temp ?? 35); A.vmOpt[id] = { t: ny, till: Date.now() + 6000 }; A.vibb(6);
      clearTimeout(A.vmTimer[id]); A.vmTimer[id] = setTimeout(() => A.tj('climate', 'set_temperature', { entity_id: id, temperature: ny }), 700); return A.patchaAlla(); }
    if (a === 'vmlage') { A.vibb(8); return A.tj('climate', 'set_hvac_mode', { entity_id: id, hvac_mode: b.dataset.v }); }
    if (a === 'vmpreset') { A.vibb(8); return A.tj('climate', 'set_preset_mode', { entity_id: id, preset_mode: b.dataset.v }); }
    if (a === 'vmsank') return A.varmeSank(k, b.dataset.v || 'manuell');
    if (a === 'vmater') return A.varmeAter();
    if (a === 'portlage') return A.portLage(k, b.dataset.v);
    if (a === 'portalla') { const l = k.portar.filter(x => x.typ === b.dataset.v && S(x.e)).map(x => x.e); A.vibb(12); return l.length && A.tj('cover', b.dataset.d, { entity_id: l }); }
    if (a === 'sakgrupp') { A.sakOppen = A.sakOppen === b.dataset.v ? '' : b.dataset.v; A.vibb(5); return A.patchaAlla(); }
    if (a === 'kamval') { A.kamVald = b.dataset.v; minne('kamvald', A.kamVald); A.vibb(6); return A.patchaAlla(); }
    if (a === 'handfilter') { A.hand.filter = b.dataset.v; minne('handfilter', A.hand.filter); A.vibb(5); return A.patchaAlla(); }
    if (a === 'frigate') return A.frigatePanel(k, b.dataset.v);
    if (a === 'tandlista') { const l = b.dataset.v.split(',').filter(Boolean); l.forEach(x => { A.opt[x] = { on: true, till: Date.now() + 4000 }; }); A.tj('homeassistant', 'turn_on', { entity_id: l }); A.vibb(12); return A.patchaAlla(); }
    if (a === 'bussforslag') { A.bussP = { t: +b.dataset.v }; minne('buss', JSON.stringify(A.bussP)); A.bussKoll(); A.vibb(10); A.meddela('Jag säger till i högtalaren när det är dags att gå 🚌'); return A.patchaAlla(); }
    if (a === 'morgon') { const l = A.morgonLampor(k).filter(id => !A.ljus(id).on); l.forEach(id => { A.opt[id] = { on: true, till: Date.now() + 4000 }; });
      if (l.length) A.tj('homeassistant', 'turn_on', { entity_id: l }); A.morgonTand = new Date().toDateString(); minne('morgon', A.morgonTand); A.vibb(12); return A.patchaAlla(); }
    if (a === 'morgonkaffe') { A.tj('switch', 'turn_on', { entity_id: `switch.${k.kaffe}_av_pa` }); A.morgonKaffeKlar = new Date().toDateString(); minne('morgonkaffe', A.morgonKaffeKlar);
      A.vibb(12); A.meddela('Kaffemaskinen sätts på – välj dryck under Hushåll ☕'); return A.patchaAlla(); }
    if (a === 'kvall') { if (k.gn) return A.gnStarta(k, k.kvallMin); A.kvall = { start: Date.now(), slut: Date.now() + k.kvallMin * 6e4 }; minne('kvall', JSON.stringify(A.kvall)); A.vibb(12); return A.patchaAlla(); }
    if (a === 'kvallav') return A.gnAvbryt(k);
    if (a === 'godnatt') return A.godnatt(k);
    if (a === 'ignorera') { A.ign.add(b.dataset.v); minne('ign', JSON.stringify([...A.ign].slice(-60))); A.vibb(8); return A.patchaAlla(); }
    if (a === 'popup') return A.popup(b.dataset.v);
    if (a === 'dammval') { A.dammVal = +b.dataset.v || 0; minne('damm', A.dammVal); return b.dataset.sida ? A.byt(b.dataset.sida) : A.patchaAlla(); }
    if (a === 'rum') { A.rum = b.dataset.v; minne('rum', A.rum); A.vibb(5); if (A.sida !== 'hem') A.sida = 'hem'; return A.patchaAlla(); }
    if (a === "info") return A.info(b, id);
    if (a === "ljuspanel") return A.ljuspanel(id);
    if (a === 'lank') { history.pushState(null, '', b.dataset.v); window.dispatchEvent(new CustomEvent('location-changed')); return; }
    if (a === 'mflik') { A.mflik = b.dataset.v; return A.patchaAlla(); }
    A.vibb();
    if (a === 'tj') { const [dom, tj] = b.dataset.d.split('.'); if (b.classList.contains('vxl')) b.classList.toggle('pa'); return A.tj(dom, tj, Object.assign({ entity_id: id && id.includes(',') ? id.split(',') : id }, JSON.parse(b.dataset.x || '{}'))); }
    if (a === 'scen') { b.classList.add('pa'); return A.tj('scene', 'turn_on', { entity_id: id }); }
    if (a === 'effekt') { b.classList.add('pa'); return A.tj('script', 'turn_on', { entity_id: k.effektScript, variables: { effekt: b.dataset.v } }); }
    if (a === 'rumtgl') {
      const ids = k.rum[+b.dataset.i].lampor.map(l => l.e).filter(x => S(x)), pa = ids.some(x => A.ljus(x).on);
      b.classList.toggle('pa', !pa); sattOpt(ids, !pa);
      A.tj('homeassistant', pa ? 'turn_off' : 'turn_on', { entity_id: ids });
      return A.patchaSnart();
    }
    if (a === 'allaav' || a === 'allapa') { const ids = A.allaLampor(k), pa = a === 'allapa'; sattOpt(ids, pa); A.tj('homeassistant', pa ? 'turn_on' : 'turn_off', { entity_id: ids }); return A.patchaSnart(); }
    if (a === 'media') { if (b.classList.contains('vxl')) b.classList.toggle('pa'); return A.tj('media_player', b.dataset.d, Object.assign({ entity_id: A.valdSpelare(k) }, JSON.parse(b.dataset.x || '{}'))); }
    if (a === 'seek') { const r = b.getBoundingClientRect(), l = +b.dataset.l;
      if (l) A.tj('media_player', 'media_seek', { entity_id: A.valdSpelare(k), seek_position: Math.round(klamp((e.clientX - r.left) / r.width, 0, 1) * l) }); return; }
    if (a === 'fjarr') { A.vibb(8); return A.tj('remote', 'send_command', { entity_id: b.dataset.e, command: b.dataset.v }); }
    if (a === 'tvapp') return A.tj('media_player', 'select_source', { entity_id: A.valdSpelare(k), source: b.dataset.v });
    if (a === 'tvtj') return A.tj('media_player', b.dataset.d, { entity_id: A.valdSpelare(k) });
    if (a === 'spelare') {
      const vald = A.valdSpelare(k), medl = (S(vald) && S(vald).attributes.group_members) || [];
      if (id !== vald && e.detail >= 2) return A.tj('media_player', medl.includes(id) ? 'unjoin' : 'join', medl.includes(id) ? { entity_id: id } : { entity_id: vald, group_members: [id] });
      A.spelare = id; minne('spelare', id); return A.patchaAlla();
    }
    if (a === 'spela') return A.spelaUri(b, b.dataset.typ === 'track' ? 'play' : 'replace');
    if (a === 'iko') return A.spelaUri(b, 'add');
    if (a === "lat") { const v = A.valdSpelare(k); return A.spelaLat(+b.dataset.i, b.dataset.k === "album" ? A.album[v] : A.kalla[v]); }
    if (a === "partyhel") return A.partyHel();
    if (a === 'kaffe') {
      const prog = b.dataset.v;
      if (A.kaffeVal && A.kaffeVal.prog === prog && Date.now() - A.kaffeVal.t < 3500) {
        A.kaffeVal = null;
        A.tj('select', 'select_option', { entity_id: `select.${k.kaffe}_aktivt_program`, option: `consumer_products_coffee_maker_program_beverage_${prog}` });
        A.vibb(25);
      } else A.kaffeVal = { prog, t: Date.now() };
      return A.patchaAlla();
    }
    if (a === 'todo') { const klar = b.dataset.k === '1'; b.classList.toggle('klar', !klar);
      A.tj('todo', 'update_item', { entity_id: k.attGora, item: b.dataset.u, status: klar ? 'needs_action' : 'completed' }).then(() => A.todoUppd(k.attGora)); return; }
    if (a === 'todorensa') { const klara = (A.todo[k.attGora] || []).filter(x => x.status === 'completed');
      A.hass.callService('todo', 'remove_completed_items', {}, { entity_id: k.attGora })
        .catch(() => Promise.all(klara.map(x => A.hass.callService('todo', 'remove_item', { entity_id: k.attGora, item: x.uid }).catch(() => {})))).then(() => A.todoUppd(k.attGora)); return; }
    if (a === 'larm') { const tj = b.dataset.v, rub = b.textContent.trim(), kod = b.dataset.k === '1';
      const kor = () => kod ? A.kod(k.larm, tj, rub) : A.tj('alarm_control_panel', tj, { entity_id: k.larm });
      // Larma borta: fråga först om allt ska släckas
      const vidare = tj === 'alarm_arm_away' && k.bortaFraga ? () => A.bortaFraga(k, kor) : kor;
      const kl = tj === 'alarm_disarm' ? [] : A.larmKoll(k);
      return kl.length ? A.larmFraga(k, kl, rub, vidare) : vidare(); }
    if (a === 'larmkoll') { const kl = A.larmKoll(k); return kl.length && A.larmFraga(k, kl, '', null); }
  };
  // Lamprutor: tryck = tänd/släck, dra i sidled = dimra, håll inne = mer info
  A.ned = (e, rot) => {
    const knapp = e.target.closest("[data-a]");
    const t = e.target.closest('[data-dim]');
    if (!t || !rot.contains(t) || (knapp && t.contains(knapp)) || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const id = t.dataset.dim, r = t.getBoundingClientRect();
    const d = A.drag = { t, id, x0: e.clientX, y0: e.clientY, w: r.width, start: +t.dataset.pct || 0, pct: +t.dataset.pct || 0, dim: t.classList.contains('dim'), flytt: false, lang: false, avbruten: false };
    try { t.setPointerCapture(e.pointerId); } catch (x) {}
    d.timer = setTimeout(() => { if (!d.flytt && !d.avbruten) { d.lang = true; A.vibb(18); if (t.classList.contains("dim")) A.ljuspanel(id); else A.info(t, id); } }, 550);
    const klar = () => { clearTimeout(d.timer); t.onpointermove = t.onpointerup = t.onpointercancel = null; A.drag = null; t.classList.remove('drar');
      A.ignoreraKlick = true; setTimeout(() => { A.ignoreraKlick = false; }, 60); };
    t.onpointermove = (ev) => {
      const dx = ev.clientX - d.x0, dy = ev.clientY - d.y0;
      if (!d.flytt && Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { d.avbruten = true; clearTimeout(d.timer); }
      if (!d.flytt && !d.avbruten && d.dim && Math.abs(dx) > 8) { d.flytt = true; clearTimeout(d.timer); t.classList.add('drar', 'pa'); }
      if (d.flytt) {
        d.pct = Math.round(klamp(d.start + dx / d.w * 100, 0, 100));
        t.style.setProperty('--fyll', d.pct + '%');
        const st = t.querySelector('.enh-stor'); if (st) st.textContent = d.pct + '%';
        if (d.pct % 10 === 0 && d.pct !== d.sist) { A.vibb(4); d.sist = d.pct; }
      }
    };
    t.onpointerup = () => {
      const v = d;
      klar();
      if (v.flytt) {
        A.opt[id] = { on: v.pct > 0, pct: v.pct, till: Date.now() + 5000 };
        if (v.pct > 0) A.tj('light', 'turn_on', { entity_id: id, brightness_pct: v.pct }); else A.tj('light', 'turn_off', { entity_id: id });
        A.patchaSnart();
      } else if (!v.lang && !v.avbruten) {
        const L = A.ljus(id);
        A.opt[id] = { on: !L.on, till: Date.now() + 4000 };
        t.classList.toggle('pa', !L.on);
        const vx = t.querySelector('.vxl'); if (vx) vx.classList.toggle('pa', !L.on);
        t.style.setProperty('--fyll', !L.on && L.dim ? (L.pct || 100) + '%' : '0%');
        A.vibb(10);
        A.tj('homeassistant', 'toggle', { entity_id: id });
        A.patchaSnart();
      }
    };
    t.onpointercancel = () => { klar(); A.patchaSnart(); };
  };
  // ───────────── Ljuspanel: ljusstyrka, varm/kall ton och färg ─────────────
  const hsvRgb = (h, s = 1, v = 1) => { const f = (n) => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); }; return [f(5), f(3), f(1)].map(x => Math.round(x * 255)); };
  A.ljuspanel = (id) => {
    const s = S(id);
    if (!s) return;
    document.getElementById('aura-ljus')?.remove();
    const k = A.k, mork = k.tema !== 'ljus', noir = k.tema === 'noir', info = A.lampInfo(k, id), a = s.attributes, L = A.ljus(id);
    const lagen = a.supported_color_modes || [];
    const harTemp = lagen.includes('color_temp'), harFarg = lagen.some(m => ['hs', 'rgb', 'rgbw', 'rgbww', 'xy'].includes(m));
    const T = noir ? { bg: '#141210', y2: '#1E1B17', y3: '#2A2621', tx: '#F5EFE6', dim: 'rgba(245,239,230,.58)', acc: k.accent || '#D4AF7A' } : mork ? { bg: '#111427', y2: '#1A1E36', y3: '#232846', tx: '#EEF0FF', dim: 'rgba(238,240,255,.58)', acc: k.accent || '#7568FF' }
      : { bg: '#FBF9F5', y2: '#F2EDE5', y3: '#E7E0D5', tx: '#1E1A15', dim: 'rgba(30,26,21,.56)', acc: k.accent || '#B07D3A' };
    const typ = A.lamptyp(info, s), minK = a.min_color_temp_kelvin || 2000, maxK = a.max_color_temp_kelvin || 6500;
    const FARGER = ['#FF5E57', '#FF9F43', '#FFD166', '#7BE495', '#3ED1C6', '#4D96FF', '#7B6CFF', '#C77DFF', '#F15BB5', '#FFFFFF'];
    const m = document.createElement('div');
    m.id = 'aura-ljus';
    const reglage = (kl, min, max, v, bg) => `<input type="range" class="lp-r ${kl}" min="${min}" max="${max}" value="${v}" style="background:${bg}">`;
    m.innerHTML = DEFS + `<style>
      #aura-ljus { position:fixed; inset:0; z-index:10000; display:grid; place-items:center; background:rgba(10,8,5,.42); backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px);
        font-family:Manrope,system-ui,sans-serif; color:${T.tx}; animation:lpin .3s ease both; }
      @keyframes lpin { from { opacity:0; } } @keyframes lpupp { from { transform:translateY(40px) scale(.97); opacity:0; } }
      #aura-ljus * { box-sizing:border-box; }
      #aura-ljus button { font:inherit; color:inherit; border:0; background:none; cursor:pointer; -webkit-tap-highlight-color:transparent; }
      .lp { width:min(420px, 94vw); max-height:92vh; overflow-y:auto; padding:22px; border-radius:32px; background:${T.bg}; box-shadow:0 40px 100px rgba(0,0,0,.35);
        animation:lpupp .45s cubic-bezier(.22,1,.36,1) both; scrollbar-width:none; }
      @media (max-width:600px) { #aura-ljus { place-items:end center; } .lp { width:100vw; border-radius:32px 32px 0 0; padding-bottom:calc(22px + env(safe-area-inset-bottom, 0px)); } }
      .lp-topp { display:flex; align-items:center; gap:12px; }
      .lp-topp small { display:block; font-size:11.5px; font-weight:800; letter-spacing:.09em; text-transform:uppercase; color:${T.dim}; }
      .lp-topp b { display:block; font-size:22px; font-weight:800; letter-spacing:-.03em; }
      .lp-x { width:40px; height:40px; border-radius:50%; background:${T.y2} !important; font-size:18px; }
      .lp-vxl { position:relative; width:52px; height:30px; border-radius:999px; background:${T.y3} !important; transition:background .3s; margin-left:auto; }
      .lp-vxl::after { content:''; position:absolute; top:3px; left:3px; width:24px; height:24px; border-radius:50%; background:#fff; box-shadow:0 2px 5px rgba(0,0,0,.2); transition:transform .45s cubic-bezier(.34,1.56,.64,1); }
      .lp-vxl.pa { background:${T.acc} !important; } .lp-vxl.pa::after { transform:translateX(22px); }
      .lp-bild { height:190px; display:grid; place-items:center; margin:8px 0 6px; border-radius:24px; background:${T.y2}; transition:background .4s; }
      .lp-bild svg { height:170px; width:auto; overflow:visible; } .lp-bild svg image { transition:filter .4s; }
      .lp-rad { display:flex; justify-content:space-between; align-items:baseline; margin:16px 2px 8px; font-size:13px; font-weight:800; color:${T.dim}; }
      .lp-rad span { color:${T.tx}; font-size:15px; }
      .lp-r { -webkit-appearance:none; appearance:none; width:100%; height:44px; border-radius:16px; outline:none; margin:0; cursor:pointer; touch-action:pan-x; box-shadow:inset 0 0 0 1px rgba(0,0,0,.06); }
      .lp-r::-webkit-slider-thumb { -webkit-appearance:none; width:16px; height:44px; border-radius:8px; background:#fff; box-shadow:0 2px 10px rgba(0,0,0,.35); }
      .lp-r::-moz-range-thumb { width:16px; height:44px; border:0; border-radius:8px; background:#fff; }
      .lp-farger { display:grid; grid-template-columns:repeat(5, minmax(0, 1fr)); gap:10px; }
      .lp-f { aspect-ratio:1; border-radius:50% !important; box-shadow:inset 0 0 0 1px rgba(0,0,0,.08), 0 6px 14px -6px rgba(0,0,0,.35); transition:transform .25s cubic-bezier(.34,1.56,.64,1); }
      .lp-f:active { transform:scale(.85); } .lp-f.vald { box-shadow:0 0 0 3px ${T.bg}, 0 0 0 5.5px ${T.acc}; }
      .lp-mer { width:100%; margin-top:20px; padding:14px; border-radius:16px; background:${T.y2} !important; font-weight:800 !important; font-size:14px; }
    </style>
    <div class="lp">
      <div class="lp-topp"><button class="lp-x" data-v="x" aria-label="Stäng">✕</button><div><small>${esc((k.rum.find(r => r.lampor.some(l => l.e === id)) || {}).namn || 'Lampa')}</small><b>${esc(info.namn || namn(id))}</b></div>
        <button class="lp-vxl ${L.on ? 'pa' : ''}" data-v="tgl" aria-label="Tänd eller släck"></button></div>
      <div class="lp-bild"></div>
      ${L.dim ? `<div class="lp-rad">Ljusstyrka<span data-pct>${L.on ? L.pct : 0} %</span></div>${reglage('ljus', 1, 100, L.on ? L.pct : 60, `linear-gradient(90deg, ${T.y3}, #FFE3A8)`)}` : ''}
      ${harTemp ? `<div class="lp-rad">Varmt – kallt ljus<span data-k>${a.color_temp_kelvin ? a.color_temp_kelvin + ' K' : '–'}</span></div>
        ${reglage('temp', minK, maxK, a.color_temp_kelvin || 3000, 'linear-gradient(90deg, #FF9F43, #FFE7C2 45%, #FFFFFF 60%, #BFD9FF)')}` : ''}
      ${harFarg ? `<div class="lp-rad">Färg</div><div class="lp-farger">${FARGER.map(f => `<button class="lp-f" data-farg="${f}" style="background:${f}" aria-label="${f}"></button>`).join('')}</div>
        <div class="lp-rad">Alla färger</div>${reglage('nyans', 0, 359, a.hs_color ? Math.round(a.hs_color[0]) : 30, 'linear-gradient(90deg, #f00, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00)')}` : ''}
      <button class="lp-mer" data-v="mer">Fler inställningar</button>
    </div>`;
    const bild = m.querySelector('.lp-bild');
    const visa = (on, c) => { bild.innerHTML = A.produkt(typ, on, c); bild.style.background = on ? `radial-gradient(circle at 50% 45%, rgba(${c},.28), ${T.y2} 70%)` : T.y2; };
    let farg = L.c, pa = L.on;
    visa(pa, farg);
    const satt = (data) => { pa = true; m.querySelector('.lp-vxl').classList.add('pa'); A.opt[id] = { on: true, pct: data.brightness_pct, till: Date.now() + 5000 }; A.tj('light', 'turn_on', Object.assign({ entity_id: id }, data)); A.patchaSnart(); };
    const r = (kl) => m.querySelector('.lp-r.' + kl);
    if (r('ljus')) { r('ljus').oninput = (e) => { m.querySelector('[data-pct]').textContent = e.target.value + ' %'; visa(true, farg); }; r('ljus').onchange = (e) => satt({ brightness_pct: +e.target.value }); }
    if (r('temp')) { r('temp').oninput = (e) => { farg = A.farg({ attributes: { color_temp_kelvin: +e.target.value } }); m.querySelector('[data-k]').textContent = e.target.value + ' K'; visa(true, farg); };
      r('temp').onchange = (e) => satt({ color_temp_kelvin: +e.target.value }); }
    if (r('nyans')) { r('nyans').oninput = (e) => { farg = hsvRgb(+e.target.value).join(','); visa(true, farg); }; r('nyans').onchange = (e) => satt({ hs_color: [+e.target.value, 100] }); }
    const stang = () => { m.remove(); document.removeEventListener('keydown', esc_); };
    const esc_ = (e) => { if (e.key === 'Escape') stang(); };
    document.addEventListener('keydown', esc_);
    m.addEventListener('click', (e) => {
      if (e.target === m) return stang();
      const f = e.target.closest('[data-farg]');
      if (f) { m.querySelectorAll('.lp-f').forEach(x => x.classList.toggle('vald', x === f)); const h = f.dataset.farg.slice(1);
        const rgb = [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)); farg = rgb.join(','); visa(true, farg); A.vibb(8);
        return satt(f.dataset.farg === '#FFFFFF' && harTemp ? { color_temp_kelvin: 4000 } : { rgb_color: rgb }); }
      const b = e.target.closest('[data-v]');
      if (!b) return;
      if (b.dataset.v === 'x') return stang();
      if (b.dataset.v === 'mer') { stang(); return A.info([...A.kort].find(x => x.isConnected) || document.body, id); }
      if (b.dataset.v === 'tgl') { pa = !pa; b.classList.toggle('pa', pa); visa(pa, farg); A.opt[id] = { on: pa, till: Date.now() + 4000 }; A.vibb(10);
        A.tj('homeassistant', pa ? 'turn_on' : 'turn_off', { entity_id: id }); A.patchaSnart(); }
    });
    document.body.appendChild(m);
  };

  // ═════════════ SMHI-varning i en popup – hela texten, område och när den gäller ═════════════
  A.varnPanel = (k, nr) => {
    const V = A.varningar(k);
    if (!V || !V.aktiv) return;
    document.getElementById('aura-varn')?.remove();
    const mork = k.tema !== 'ljus', noir = k.tema === 'noir';
    const T = noir ? { bg: '#141210', y2: '#1E1B17', tx: '#F5EFE6', dim: 'rgba(245,239,230,.6)' } : mork ? { bg: '#111427', y2: '#1A1E36', tx: '#EEF0FF', dim: 'rgba(238,240,255,.6)' } : { bg: '#FBF9F5', y2: '#F2EDE5', tx: '#1E1A15', dim: 'rgba(30,26,21,.58)' };
    const FARG = (n) => /röd|red|extreme|^3$|hög/i.test(n) ? '#E5484D' : /orange|severe|^2$/i.test(n) ? '#F08A24' : /gul|yellow|moderate|^1$/i.test(n) ? '#E8B10E' : '#4D96FF';
    const NAMN = (n) => /röd|red|extreme|^3$/i.test(n) ? 'Röd varning' : /orange|severe|^2$/i.test(n) ? 'Orange varning' : /gul|yellow|moderate|^1$/i.test(n) ? 'Gul varning' : n ? n : 'Meddelande';
    const tid = (x) => { const t = Date.parse(x); return isNaN(t) ? x : new Date(t).toLocaleString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).replace('.', ''); };
    const lista = (V.lista.length ? V.lista : [{ titel: 'SMHI har utfärdat en varning', text: V.notis, niva: '' }]).map((x, i) => ({ x, i }));
    lista.sort((a, b) => (a.i === nr ? -1 : b.i === nr ? 1 : a.i - b.i));
    const m = document.createElement('div');
    m.id = 'aura-varn';
    m.innerHTML = `<style>
      #aura-varn { position:fixed; inset:0; z-index:10000; display:grid; place-items:center; background:rgba(10,8,5,.42); backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px);
        font-family:Manrope,system-ui,sans-serif; color:${T.tx}; animation:vpin .3s ease both; }
      @keyframes vpin { from { opacity:0; } } @keyframes vpupp { from { transform:translateY(40px) scale(.97); opacity:0; } }
      #aura-varn * { box-sizing:border-box; } #aura-varn button { font:inherit; color:inherit; border:0; background:none; cursor:pointer; -webkit-tap-highlight-color:transparent; }
      .vpp { width:min(560px, 94vw); max-height:88vh; overflow-y:auto; padding:22px; border-radius:32px; background:${T.bg}; box-shadow:0 40px 100px rgba(0,0,0,.35); animation:vpupp .45s cubic-bezier(.22,1,.36,1) both; scrollbar-width:none; overscroll-behavior:contain; }
      @media (max-width:600px) { #aura-varn { place-items:end center; } .vpp { width:100vw; max-height:86vh; border-radius:32px 32px 0 0; padding-bottom:calc(22px + env(safe-area-inset-bottom, 0px)); } }
      .vpp-topp { display:flex; align-items:center; gap:12px; margin-bottom:14px; }
      .vpp-topp small { display:block; font-size:11.5px; font-weight:800; letter-spacing:.09em; text-transform:uppercase; color:${T.dim}; } .vpp-topp b { display:block; font-size:22px; font-weight:800; letter-spacing:-.03em; }
      .vpp-x { width:40px; height:40px; border-radius:50%; background:${T.y2} !important; font-size:18px; flex:none; }
      .vpp-k { padding:16px 16px 16px 18px; border-radius:22px; background:${T.y2}; box-shadow:inset 4px 0 0 var(--vf); margin-top:10px; }
      .vpp-niva { display:inline-flex; align-items:center; gap:6px; padding:4px 10px; border-radius:999px; background:color-mix(in srgb, var(--vf) 18%, transparent); color:var(--vf); font-size:11.5px; font-weight:800; letter-spacing:.04em; text-transform:uppercase; }
      .vpp-k h3 { margin:10px 0 4px; font-size:19px; font-weight:800; letter-spacing:-.02em; }
      .vpp-rad { display:flex; align-items:flex-start; gap:8px; margin-top:6px; font-size:13px; font-weight:700; color:${T.dim}; } .vpp-rad svg { flex:none; margin-top:1px; }
      .vpp-k p { margin:12px 0 0; font-size:14.5px; line-height:1.55; font-weight:600; white-space:pre-line; }
      .vpp-mer { width:100%; margin-top:16px; padding:14px; border-radius:16px; background:${T.y2} !important; font-weight:800 !important; font-size:14px; }
      .vpp-kalla { margin-top:12px; text-align:center; font-size:11.5px; font-weight:700; color:${T.dim}; }
    </style>
    <div class="vpp">
      <div class="vpp-topp"><button class="vpp-x" data-v="x" aria-label="Stäng">✕</button><div><small>SMHI · ${esc(k.plats || 'Vädervarning')}</small><b>${V.antal} ${V.antal === 1 ? 'varning' : 'varningar'}</b></div></div>
      ${lista.map(({ x }) => `<div class="vpp-k" style="--vf:${FARG(x.niva)}"><span class="vpp-niva">${ik('mdi:alert', 14)}${esc(NAMN(x.niva))}</span><h3>${esc(x.titel || 'Varning')}</h3>
        ${x.omr ? `<div class="vpp-rad">${ik('mdi:map-marker-outline', 16)}<span>${esc(x.omr)}</span></div>` : ''}
        ${x.start || x.slut ? `<div class="vpp-rad">${ik('mdi:clock-outline', 16)}<span>${x.start ? 'Från ' + esc(tid(x.start)) : ''}${x.start && x.slut ? ' till ' : x.slut ? 'Till ' : ''}${x.slut ? esc(tid(x.slut)) : ''}</span></div>` : ''}
        ${x.text ? `<p>${esc(String(x.text).replace(/\*\*|__|#+\s?/g, '').trim())}</p>` : ''}</div>`).join('')}
      ${V.notis && V.lista.length ? `<div class="vpp-k" style="--vf:#4D96FF"><p style="margin:0">${esc(String(V.notis).replace(/\*\*|__|#+\s?/g, '').trim())}</p></div>` : ''}
      ${k.varning || k.varningAktiv ? '<button class="vpp-mer" data-v="mer">Öppna i Home Assistant</button>' : ''}
      <div class="vpp-kalla">Källa: SMHI</div>
    </div>`;
    const stang = () => { m.style.transition = 'opacity .2s'; m.style.opacity = '0'; setTimeout(() => m.remove(), 200); };
    m.addEventListener('click', (e) => {
      if (e.target === m) return stang();
      const b = e.target.closest('[data-v]');
      if (!b) return;
      if (b.dataset.v === 'x') return stang();
      if (b.dataset.v === 'mer') { stang(); return A.info([...A.kort].find(x => x.isConnected) || document.body, k.varning || k.varningAktiv); }
    });
    document.body.appendChild(m);
  };

  // ═════════════ Innan man larmar: står något öppet, är något olåst eller svarar inte? ═════════════
  A.larmKoll = (k) => {
    const ut = [], sett = new Set(), ej = (st) => !st || ['unavailable', 'unknown'].includes(st.state);
    const kort = (id) => namn(id).replace(/\s*(öppning|kontakt|sensor|contact|opening|rörelse|motion)$/i, '');
    const lagg = (id, typ, txt) => { if (!sett.has(id)) { sett.add(id); ut.push({ id, typ, txt, namn: kort(id) }); } };
    k.dorrar.concat(k.fonster).forEach(id => { const st = S(id); if (ej(st)) lagg(id, 'ej', 'svarar inte'); else if (st.state === 'on') lagg(id, 'oppen', 'står öppen'); });
    k.las.forEach(id => { const st = S(id); if (ej(st)) lagg(id, 'ej', 'svarar inte'); else if (st.state === 'unlocked' || st.state === 'open') lagg(id, 'olast', 'är olåst'); });
    k.rorelse.concat(k.larmgivare).forEach(id => { if (ej(S(id))) lagg(id, 'ej', 'svarar inte'); });
    k.portar.filter(x => x.typ === 'garage').forEach(x => { const st = S(x.e); if (ej(st)) lagg(x.e, 'ej', 'svarar inte'); else if (st.state !== 'closed') lagg(x.e, 'oppen', 'står öppen'); });
    return ut;
  };
  A.larmFraga = (k, kl, rubrik, fortsatt) => {
    document.getElementById('aura-larmkoll')?.remove();
    const mork = k.tema !== 'ljus', noir = k.tema === 'noir';
    const T = noir ? { bg: '#141210', y2: '#1E1B17', tx: '#F5EFE6', dim: 'rgba(245,239,230,.6)', acc: k.accent || '#D4AF7A' } : mork ? { bg: '#111427', y2: '#1A1E36', tx: '#EEF0FF', dim: 'rgba(238,240,255,.6)', acc: k.accent || '#7568FF' }
      : { bg: '#FBF9F5', y2: '#F2EDE5', tx: '#1E1A15', dim: 'rgba(30,26,21,.58)', acc: k.accent || '#B07D3A' };
    const F = { oppen: ['#E8A317', 'mdi:door-open'], olast: ['#E8A317', 'mdi:lock-open-variant-outline'], ej: ['#D0503F', 'mdi:access-point-network-off'] };
    const m = document.createElement('div');
    m.id = 'aura-larmkoll';
    m.innerHTML = `<style>
      #aura-larmkoll { position:fixed; inset:0; z-index:10000; display:grid; place-items:center; background:rgba(10,8,5,.45); backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px);
        font-family:Manrope,system-ui,sans-serif; color:${T.tx}; animation:lkin .3s ease both; }
      @keyframes lkin { from { opacity:0; } } @keyframes lkupp { from { transform:translateY(40px) scale(.97); opacity:0; } }
      #aura-larmkoll * { box-sizing:border-box; } #aura-larmkoll button { font:inherit; color:inherit; border:0; cursor:pointer; -webkit-tap-highlight-color:transparent; }
      .lk { width:min(420px, 94vw); max-height:88vh; overflow-y:auto; padding:22px; border-radius:32px; background:${T.bg}; box-shadow:0 40px 100px rgba(0,0,0,.35); animation:lkupp .45s cubic-bezier(.22,1,.36,1) both; scrollbar-width:none; }
      @media (max-width:600px) { #aura-larmkoll { place-items:end center; } .lk { width:100vw; border-radius:32px 32px 0 0; padding-bottom:calc(22px + env(safe-area-inset-bottom, 0px)); } }
      .lk-ik { width:54px; height:54px; border-radius:18px; display:grid; place-items:center; background:color-mix(in srgb, #E8A317 16%, transparent); color:#E8A317; margin-bottom:12px; }
      .lk small { display:block; font-size:11.5px; font-weight:800; letter-spacing:.09em; text-transform:uppercase; color:${T.dim}; } .lk h2 { margin:4px 0 6px; font-size:22px; font-weight:800; letter-spacing:-.03em; }
      .lk p { margin:0 0 14px; font-size:14px; line-height:1.45; color:${T.dim}; font-weight:600; }
      .lk-rad { display:flex; align-items:center; gap:12px; padding:11px 12px; border-radius:16px; background:${T.y2}; margin-top:8px; }
      .lk-rad > span { width:34px; height:34px; flex:none; border-radius:11px; display:grid; place-items:center; background:color-mix(in srgb, var(--f) 16%, transparent); color:var(--f); }
      .lk-rad b { display:block; font-size:14.5px; font-weight:800; } .lk-rad i { display:block; font-style:normal; font-size:12.5px; font-weight:700; color:var(--f); }
      .lk-knappar { display:grid; grid-template-columns:${fortsatt ? '1fr 1.4fr' : '1fr'}; gap:10px; margin-top:18px; }
      .lk-knappar button { padding:15px; border-radius:18px; font-weight:800; font-size:15px; background:${T.y2}; } .lk-knappar .lk-ja { background:${T.acc}; color:#fff; }
    </style>
    <div class="lk"><div class="lk-ik">${ik('mdi:shield-alert-outline', 28)}</div>
      <small>${fortsatt ? `Innan du larmar${rubrik ? ' · ' + esc(rubrik) : ''}` : 'Larmet'}</small>
      <h2>${kl.some(x => x.typ === 'oppen') ? 'Något står öppet' : kl.some(x => x.typ === 'olast') ? 'Något är olåst' : 'Några givare svarar inte'}</h2>
      <p>${fortsatt ? 'Du kan larma ändå, men kontrollera gärna först.' : 'Det här bör du kolla innan du larmar.'}${kl.some(x => x.typ === 'ej') ? ' Givare som inte svarar kan inte upptäcka intrång.' : ''}</p>
      ${kl.map(x => `<div class="lk-rad" style="--f:${F[x.typ][0]}"><span>${ik(x.typ === 'oppen' && /fönster|fonster|window/i.test(x.id + x.namn) ? 'mdi:window-open-variant' : F[x.typ][1], 19)}</span><div><b>${esc(x.namn)}</b><i>${x.txt}</i></div></div>`).join('')}
      <div class="lk-knappar">${fortsatt ? '<button data-v="nej">Avbryt</button><button class="lk-ja" data-v="ja">Larma ändå</button>' : '<button data-v="nej">Stäng</button>'}</div></div>`;
    const stang = () => { m.style.transition = 'opacity .2s'; m.style.opacity = '0'; setTimeout(() => m.remove(), 200); };
    m.addEventListener('click', (e) => {
      if (e.target === m) return stang();
      const b = e.target.closest('[data-v]');
      if (!b) return;
      stang();
      if (b.dataset.v === 'ja' && fortsatt) { A.vibb(12); setTimeout(fortsatt, 220); }
    });
    document.body.appendChild(m);
  };

  // Släck när borta-larmet är på: lamporna lyser under utpasseringstiden och tonas sedan ner.
  // Finns script.aura_borta_slack sköter Home Assistant det, annars den här skärmen.
  A.bortaSlack = (() => { try { return JSON.parse(minne('bortaslack') || 'null'); } catch (e) { return null; } })();
  A.bortaKor = (k) => {
    const lampor = A.allaLampor(k).filter(id => A.ljus(id).on), tv = A.kvallTv(k), ljus = lampor.filter(id => id.startsWith('light.')), ovriga = lampor.filter(id => !id.startsWith('light.'));
    if (ljus.length) A.tj('light', 'turn_off', { entity_id: ljus, transition: 5 });
    if (ovriga.length) A.tj('homeassistant', 'turn_off', { entity_id: ovriga });
    if (tv.length) A.tj('media_player', 'turn_off', { entity_id: tv });
  };
  A.bortaKoll = () => {
    const k = A.k, f = A.bortaSlack;
    if (!k || !f || !A.hass) return;
    const st = (S(k.larm) || {}).state, klar = () => { A.bortaSlack = null; minne('bortaslack', ''); };
    if (st === 'armed_away') { klar(); return A.bortaKor(k); }
    if (st === 'arming' || st === 'pending') { if (!f.igang) { f.igang = true; minne('bortaslack', JSON.stringify(f)); } return; }
    // Larmet slogs av under utpasseringen, eller så avbröts kodrutan
    if (f.igang || Date.now() - f.t > 12e4) klar();
  };
  // Larma borta: är något tänt frågar Aura om allt ska släckas när larmet är på
  A.bortaFraga = (k, kor) => {
    const lampor = A.allaLampor(k).filter(id => A.ljus(id).on), tv = A.kvallTv(k);
    if (!lampor.length && !tv.length) return kor();
    document.getElementById('aura-borta')?.remove();
    const mork = k.tema !== 'ljus', noir = k.tema === 'noir';
    const T = noir ? { bg: '#141210', y2: '#1E1B17', tx: '#F5EFE6', dim: 'rgba(245,239,230,.6)', acc: k.accent || '#D4AF7A' } : mork ? { bg: '#111427', y2: '#1A1E36', tx: '#EEF0FF', dim: 'rgba(238,240,255,.6)', acc: k.accent || '#7568FF' }
      : { bg: '#FBF9F5', y2: '#F2EDE5', tx: '#1E1A15', dim: 'rgba(30,26,21,.58)', acc: k.accent || '#B07D3A' };
    const vad = [lampor.length ? `${lampor.length} ${lampor.length === 1 ? 'lampa är tänd' : 'lampor är tända'}` : '', tv.length ? `${tv.map(id => namn(id)).join(' och ')} är på` : ''].filter(Boolean).join(' och ');
    const rum = k.rum.map(r => [r.namn, r.lampor.filter(l => lampor.includes(l.e)).length]).filter(x => x[1]);
    const m = document.createElement('div');
    m.id = 'aura-borta';
    m.innerHTML = `<style>
      #aura-borta { position:fixed; inset:0; z-index:10000; display:grid; place-items:center; background:rgba(10,8,5,.45); backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px); font-family:Manrope,system-ui,sans-serif; color:${T.tx}; animation:bfin .3s ease both; }
      @keyframes bfin { from { opacity:0; } } @keyframes bfupp { from { transform:translateY(40px) scale(.97); opacity:0; } }
      #aura-borta * { box-sizing:border-box; } #aura-borta button { font:inherit; color:inherit; border:0; cursor:pointer; -webkit-tap-highlight-color:transparent; }
      .bf { width:min(400px, 94vw); max-height:88vh; overflow-y:auto; padding:22px; border-radius:32px; background:${T.bg}; box-shadow:0 40px 100px rgba(0,0,0,.35); animation:bfupp .45s cubic-bezier(.22,1,.36,1) both; scrollbar-width:none; }
      @media (max-width:600px) { #aura-borta { place-items:end center; } .bf { width:100vw; border-radius:32px 32px 0 0; padding-bottom:calc(22px + env(safe-area-inset-bottom, 0px)); } }
      .bf-ik { width:54px; height:54px; border-radius:18px; display:grid; place-items:center; background:color-mix(in srgb, ${T.acc} 16%, transparent); color:${T.acc}; margin-bottom:12px; }
      .bf small { display:block; font-size:11.5px; font-weight:800; letter-spacing:.09em; text-transform:uppercase; color:${T.dim}; } .bf h2 { margin:4px 0 6px; font-size:22px; font-weight:800; letter-spacing:-.03em; }
      .bf p { margin:0 0 12px; font-size:14px; line-height:1.45; color:${T.dim}; font-weight:600; }
      .bf-rum { display:flex; flex-wrap:wrap; gap:6px; } .bf-rum span { display:inline-flex; align-items:center; gap:6px; padding:7px 11px; border-radius:99px; background:${T.y2}; font-size:13px; font-weight:800; }
      .bf-rum span i { font-style:normal; color:${T.dim}; font-weight:700; }
      .bf-k { display:grid; grid-template-columns:1fr 1.4fr; gap:10px; margin-top:18px; } .bf-k button { padding:15px; border-radius:18px; font-weight:800; font-size:15px; background:${T.y2}; } .bf-k .bf-ja { background:${T.acc}; color:#fff; }
      .bf-av { width:100%; margin-top:6px; padding:10px; font-weight:800; font-size:13.5px; background:none !important; color:${T.dim} !important; }
    </style>
    <div class="bf"><div class="bf-ik">${ik('mdi:lightbulb-off-outline', 28)}</div><small>Innan du går · Larma borta</small><h2>Släcka allt?</h2>
      <p>${esc(vad)}. Allt lyser tills larmet är på, sedan tonas lamporna ner och släcks.</p>
      ${rum.length ? `<div class="bf-rum">${rum.map(([n, x]) => `<span>${esc(n)}<i>${x}</i></span>`).join('')}${tv.map(id => `<span>${ik('mdi:television', 15)}${esc(namn(id))}</span>`).join('')}</div>` : ''}
      <div class="bf-k"><button data-v="larma">Bara larma</button><button class="bf-ja" data-v="slack">Släck och larma</button></div>
      <button class="bf-av" data-v="avbryt">Avbryt</button></div>`;
    const stang = () => { m.style.transition = 'opacity .2s'; m.style.opacity = '0'; setTimeout(() => m.remove(), 200); };
    m.addEventListener('click', (e) => {
      if (e.target === m) return stang();
      const b = e.target.closest('[data-v]'); if (!b) return;
      stang(); A.vibb(10);
      if (b.dataset.v === 'avbryt') return;
      const skript = S(k.bortaScript);
      if (b.dataset.v === 'slack') {
        if (skript) A.tj('script', 'turn_on', { entity_id: k.bortaScript, variables: { larm: k.larm, lampor: A.allaLampor(k), tv: A.gnTv(k) } });
        else { A.bortaSlack = { t: Date.now() }; minne('bortaslack', JSON.stringify(A.bortaSlack)); }
      } else {
        if (skript && skript.state === 'on') A.tj('script', 'turn_off', { entity_id: k.bortaScript });
        A.bortaSlack = null; minne('bortaslack', '');
      }
      setTimeout(kor, 220);
    });
    document.body.appendChild(m);
  };

  // ═════════════ Larmvakt: helskärm när larmet slås på, när någon kommer in och när larmet går ═════════════
  A.larmVakt = () => {
    const k = A.k;
    if (!k || !k.larm || !k.larmSkarm || !A.hass) return;
    const s = S(k.larm), st = s ? s.state : '', nyckel = st + (s ? s.last_changed : '');
    let el = document.getElementById('aura-larm');
    if (!['arming', 'pending', 'triggered'].includes(st) || A._larmDolt === nyckel) { if (el) el.remove(); return; }
    if (!el) { el = document.createElement('div'); el.id = 'aura-larm'; document.body.appendChild(el); }
    if (el.dataset.n !== nyckel) { el.dataset.n = nyckel; el.innerHTML = A.larmHtml(k, s); A.vibb(st === 'triggered' ? 400 : 60); }
    const ned = el.querySelector('[data-slut]');
    if (ned) { const r = Math.max(0, Math.ceil((+ned.dataset.slut - Date.now()) / 1000)); ned.textContent = `${Math.floor(r / 60)}:${String(r % 60).padStart(2, '0')}`; }
    if (A.sek % 2 === 0) el.querySelectorAll('img[data-still]').forEach(i => { i.src = i.dataset.still + '&t=' + Date.now(); });
  };
  A.larmHtml = (k, s) => {
    const a = s.attributes, st = s.state, tm = k.tema || 'ljus', mork = tm !== 'ljus', noir = tm === 'noir';
    const bg = noir ? '#141210' : mork ? '#111427' : '#FBF9F5', tx = noir ? '#F5EFE6' : mork ? '#EEF0FF' : '#1E1A15', y2 = noir ? '#1E1B17' : mork ? '#1A1E36' : '#F2EDE5';
    const fordr = parseFloat(a.delay), slut = fordr > 0 ? Date.parse(s.last_changed) + fordr * 1000 : 0;
    const oppna = Object.keys(a.open_sensors || {}).map(id => namn(id)).join(', ');
    const I = {
      arming: ['mdi:shield-sync', '#E8B85C', 'Larmet slås på', 'Lämna huset och stäng dörren efter dig.'],
      pending: ['mdi:shield-alert', '#F08A24', 'Larmet är på!', 'Ange koden för att slå av larmet innan tiden är ute.'],
      triggered: ['mdi:alarm-light', '#E5484D', 'LARMET GÅR', oppna ? `Utlöst av: ${oppna}` : 'Inbrottslarmet har gått.'] }[st];
    const kam = st === 'triggered' ? k.kameror.filter(id => S(id) && !ej(S(id))).slice(0, 4) : [];
    const kamHtml = kam.map(id => { const t = S(id).attributes.access_token; return t ? `<div class="al-kam"><img alt="" src="/api/camera_proxy/${id}?token=${t}" data-still="/api/camera_proxy/${id}?token=${t}"><span>${esc(namn(id))}</span></div>` : ''; }).join('');
    return `<style>
      #aura-larm { position:fixed; inset:0; z-index:9990; display:flex; overflow-y:auto; overscroll-behavior:contain; -webkit-overflow-scrolling:touch; padding:16px; padding-bottom:calc(16px + env(safe-area-inset-bottom, 0px)); font-family:Manrope,system-ui,sans-serif; color:${tx};
        background:radial-gradient(60% 60% at 50% 40%, ${I[1]}55, transparent 70%), rgba(8,6,4,.55); backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px); animation:alin .4s ease both; }
      #aura-larm.st-triggered { animation:alin .4s ease both, alblink 1.2s ease-in-out infinite; }
      @keyframes alin { from { opacity:0; } } @keyframes alblink { 50% { background-color:rgba(120,10,10,.55); } }
      .al { margin:auto; width:min(${kam.length ? 720 : 420}px, 100%); padding:26px; border-radius:34px; background:${bg}; text-align:center; box-shadow:0 40px 100px rgba(0,0,0,.45); }
      .al-ik { width:84px; height:84px; margin:0 auto 12px; border-radius:50%; display:grid; place-items:center; color:#fff; background:${I[1]}; box-shadow:0 0 0 0 ${I[1]}; animation:alpuls 1.6s ease-out infinite; }
      @keyframes alpuls { 0% { box-shadow:0 0 0 0 ${I[1]}AA; } 100% { box-shadow:0 0 0 26px ${I[1]}00; } }
      .al h2 { margin:0; font-size:26px; font-weight:800; letter-spacing:-.02em; } .al p { margin:6px 0 0; font-size:14px; font-weight:600; opacity:.7; }
      .al-ned { font-size:64px; font-weight:200; letter-spacing:-.05em; margin:10px 0 0; font-variant-numeric:tabular-nums; }
      .al-kams { display:grid; grid-template-columns:repeat(${Math.min(kam.length, 2) || 1}, 1fr); gap:10px; margin-top:16px; }
      .al-kam { position:relative; border-radius:18px; overflow:hidden; background:#000; aspect-ratio:16/9; } .al-kam img { width:100%; height:100%; object-fit:cover; display:block; }
      .al-kam span { position:absolute; left:10px; bottom:8px; font-size:12px; font-weight:800; color:#fff; text-shadow:0 1px 4px rgba(0,0,0,.6); }
      .al-kn { display:flex; gap:10px; margin-top:20px; } .al-kn button { flex:1; height:54px; border:0; border-radius:18px; font:800 15px Manrope,sans-serif; cursor:pointer; }
      .al-av { background:${I[1]}; color:#fff; } .al-dolj { background:${y2}; color:${tx}; flex:.5 !important; }
      @media (max-width:600px), (max-height:560px) { .al { padding:18px; border-radius:26px; } .al-ik { width:60px; height:60px; margin-bottom:8px; } .al-ik ha-icon { --mdc-icon-size:30px !important; }
        .al h2 { font-size:21px; } .al p { font-size:13px; } .al-ned { font-size:46px; margin-top:4px; } .al-kams { gap:6px; margin-top:12px; } .al-kam { border-radius:12px; }
        .al-kn { margin-top:14px; } .al-kn button { height:48px; } }
    </style><div class="al"><div class="al-ik">${ik(I[0], 42)}</div><h2>${I[2]}</h2><p>${esc(I[3])}</p>
      ${slut && st !== 'triggered' ? `<div class="al-ned" data-slut="${slut}">–</div>` : ''}${kamHtml ? `<div class="al-kams">${kamHtml}</div>` : ''}
      <div class="al-kn"><button class="al-av" onclick="window.Aura.larmAv()">${st === 'arming' ? 'Avbryt' : 'Slå av larmet'}</button><button class="al-dolj" onclick="window.Aura.larmDolj()">Dölj</button></div></div>`;
  };
  // ═════════════ Vattenläcka, brand och gas: helskärm som inbrottslarmet ═════════════
  A.givareTyp = (id) => { const s = S(id), dc = (s && s.attributes.device_class) || '', t = (id + ' ' + namn(id)).toLowerCase();
    return dc === 'moisture' || /vatten|lacka|läcka|leak|water|fukt/.test(t) ? 'vatten' : dc === 'carbon_monoxide' || /kolmonoxid|co_|carbon/.test(t) ? 'co' : dc === 'gas' || /gas/.test(t) ? 'gas' : 'brand'; };
  const GIVARE = { vatten: ['mdi:water-alert', '#2D8CFF', 'VATTENLÄCKA', 'Vatten har upptäckts'], brand: ['mdi:fire-alert', '#E5484D', 'BRANDLARM', 'Brandvarnaren larmar'],
    gas: ['mdi:gas-cylinder', '#E8A317', 'GASLARM', 'Gas har upptäckts'], co: ['mdi:molecule-co', '#E5484D', 'KOLMONOXID', 'Kolmonoxid har upptäckts'] };
  A.givareVakt = () => {
    const k = A.k;
    if (!k || !A.hass || k.givareSkarm === false) return;
    const pa = k.larmgivare.filter(id => S(id) && S(id).state === 'on'), nyckel = pa.map(id => id + S(id).last_changed).join('|');
    let el = document.getElementById('aura-givare');
    if (!pa.length || A._givareDolt === nyckel) { if (el) el.remove(); return; }
    if (!el) { el = document.createElement('div'); el.id = 'aura-givare'; document.body.appendChild(el); }
    const ventil = k.vattenventil && S(k.vattenventil), ventilSt = ventil ? ventil.state : '', sig = nyckel + ventilSt;
    if (el.dataset.n === sig) return;
    el.dataset.n = sig; A.vibb(400);
    const typer = [...new Set(pa.map(A.givareTyp))], huvud = typer.includes('brand') ? 'brand' : typer.includes('co') ? 'co' : typer.includes('gas') ? 'gas' : 'vatten', G = GIVARE[huvud];
    const tm = k.tema || 'ljus', bg = tm === 'noir' ? '#141210' : tm === 'mork' ? '#111427' : '#FBF9F5', y2 = tm === 'noir' ? '#1E1B17' : tm === 'mork' ? '#1A1E36' : '#F2EDE5', tx = tm === 'ljus' ? '#1E1A15' : '#F2F0EC';
    const stangd = ventil && ['closed', 'off'].includes(ventilSt);
    el.innerHTML = `<style>
      #aura-givare { position:fixed; inset:0; z-index:9995; display:flex; overflow-y:auto; padding:16px; font-family:Manrope,system-ui,sans-serif; color:${tx};
        background:radial-gradient(60% 60% at 50% 40%, ${G[1]}66, transparent 70%), rgba(8,6,4,.6); backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px); animation:gvin .4s ease both, gvblink 1.2s ease-in-out infinite; }
      @keyframes gvin { from { opacity:0; } } @keyframes gvblink { 50% { background-color:${G[1]}55; } }
      .gv { margin:auto; width:min(440px, 100%); padding:26px; border-radius:34px; background:${bg}; text-align:center; box-shadow:0 40px 100px rgba(0,0,0,.45); }
      .gv-ik { width:88px; height:88px; margin:0 auto 12px; border-radius:50%; display:grid; place-items:center; color:#fff; background:${G[1]}; animation:gvpuls 1.4s ease-out infinite; }
      @keyframes gvpuls { 0% { box-shadow:0 0 0 0 ${G[1]}AA; } 100% { box-shadow:0 0 0 28px ${G[1]}00; } }
      .gv h2 { margin:0; font-size:28px; font-weight:800; letter-spacing:-.01em; color:${G[1]}; } .gv p { margin:6px 0 0; font-size:14px; font-weight:600; opacity:.75; }
      .gv-lista { display:grid; gap:6px; margin-top:16px; text-align:left; } .gv-lista div { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:16px; background:${y2}; font-size:14px; font-weight:800; }
      .gv-lista small { margin-left:auto; font-size:12px; opacity:.6; font-weight:700; }
      .gv-kn { display:grid; gap:10px; margin-top:18px; } .gv-kn button, .gv-kn a { display:flex; align-items:center; justify-content:center; gap:8px; height:54px; border:0; border-radius:18px; font:800 15px Manrope,sans-serif; cursor:pointer; text-decoration:none; }
      .gv-ventil { background:${stangd ? '#2FA36B' : G[1]}; color:#fff; } .gv-112 { background:#E5484D; color:#fff; } .gv-dolj { background:${y2}; color:${tx}; }
    </style><div class="gv"><div class="gv-ik">${ik(G[0], 46)}</div><h2>${G[2]}</h2><p>${esc(G[3])}${pa.length > 1 ? ` på ${pa.length} ställen` : ''}</p>
      <div class="gv-lista">${pa.map(id => `<div>${ik(GIVARE[A.givareTyp(id)][0], 20)}${esc(namn(id).replace(/\s*(sensor|givare|larm|detector)$/i, ''))}<small>${hm(new Date(S(id).last_changed))}</small></div>`).join('')}</div>
      <div class="gv-kn">${ventil && typer.includes('vatten') ? `<button class="gv-ventil" onclick="window.Aura.stangVentil()" ${stangd ? 'disabled' : ''}>${ik(stangd ? 'mdi:check-circle' : 'mdi:pipe-valve', 20)}${stangd ? 'Huvudkranen är stängd' : 'Stäng huvudkranen'}</button>` : ''}
        ${huvud !== 'vatten' ? `<a class="gv-112" href="tel:112">${ik('mdi:phone', 20)}Ring 112</a>` : ''}
        <button class="gv-dolj" onclick="window.Aura.givareDolj()">Dölj</button></div></div>`;
  };
  A.stangVentil = () => { const id = A.k.vattenventil; if (!id) return; const d = id.split('.')[0];
    A.tj(d === 'valve' ? 'valve' : d === 'cover' ? 'cover' : 'homeassistant', d === 'valve' ? 'close_valve' : d === 'cover' ? 'close_cover' : 'turn_off', { entity_id: id }); A.vibb(30); };
  A.givareDolj = () => { A._givareDolt = A.k.larmgivare.filter(id => S(id) && S(id).state === 'on').map(id => id + S(id).last_changed).join('|'); document.getElementById('aura-givare')?.remove(); };
  A.larmAv = () => { const k = A.k, s = S(k.larm); if (s && s.attributes.code_format) return A.kod(k.larm, 'alarm_disarm', 'Slå av larmet'); A.tj('alarm_control_panel', 'alarm_disarm', { entity_id: k.larm }); };
  A.larmDolj = () => { const s = S(A.k.larm); A._larmDolt = s ? s.state + s.last_changed : ''; document.getElementById('aura-larm')?.remove(); };

  // Knappsats för larmkoden
  A.kod = (id, tj, rubrik) => {
    document.getElementById('aura-kod')?.remove();
    const m = document.createElement('div'), tm = (A.k && A.k.tema) || 'ljus', mork = tm !== 'ljus', noir = tm === 'noir';
    const bg = noir ? '#141210' : mork ? '#111427' : '#FBF9F5', tx = noir ? '#F5EFE6' : mork ? '#EEF0FF' : '#1E1A15', kn = noir ? '#1E1B17' : mork ? '#1A1E36' : '#F2EDE5';
    const acc = (A.k && A.k.accent) || (noir ? '#D4AF7A' : mork ? '#7568FF' : '#B07D3A');
    m.id = 'aura-kod';
    m.style.cssText = `position:fixed;inset:0;z-index:10000;display:grid;place-items:center;background:rgba(10,8,5,.45);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);font-family:Manrope,system-ui,sans-serif;color:${tx};`;
    const knapp = (txt, v, extra = '') => `<button data-v="${v}" style="height:66px;border-radius:22px;border:0;background:${kn};color:${tx};font:500 26px Manrope,sans-serif;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:transform .2s;${extra}">${txt}</button>`;
    m.innerHTML = `<style>@keyframes aurakod{from{transform:translateY(30px) scale(.96);opacity:0}}#aura-kod button:active{transform:scale(.9)}</style>
      <div data-ruta style="width:min(360px,92vw);padding:26px 22px 22px;border-radius:32px;background:${bg};box-shadow:0 40px 100px rgba(0,0,0,.35);text-align:center;animation:aurakod .45s cubic-bezier(.22,1,.36,1) both">
        <div style="font-size:11.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;opacity:.5">Ange kod</div>
        <div style="font-size:24px;font-weight:800;letter-spacing:-.03em;margin-top:6px">${esc(rubrik)}</div>
        <div data-prickar style="display:flex;justify-content:center;gap:14px;height:16px;margin:20px 0 6px"></div><div data-fel style="height:18px;font-size:13px;color:#D0503F;font-weight:700"></div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:8px">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => knapp(n, n)).join('')}
          ${knapp('✕', 'x', 'background:none;font-size:20px;opacity:.6')}${knapp(0, 0)}${knapp('✓', 'ok', `background:${acc};color:#fff;font-weight:700`)}</div></div>`;
    let kod = '';
    const prickar = () => { m.querySelector('[data-prickar]').innerHTML = Array.from({ length: Math.max(4, kod.length) }, (_, i) =>
      `<span style="width:14px;height:14px;border-radius:50%;transition:all .2s;${i < kod.length ? `background:${acc}` : `border:2px solid ${tx};opacity:.25`}"></span>`).join(''); };
    const stang = () => { m.remove(); document.removeEventListener('keydown', tangent); };
    const skicka = async () => {
      if (!kod) return;
      try { await A.hass.callService('alarm_control_panel', tj, { entity_id: id, code: kod }); stang(); }
      catch (e) { m.querySelector('[data-fel]').textContent = (e && e.message) || 'Fel kod';
        m.querySelector('[data-ruta]').animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-12px)' }, { transform: 'translateX(12px)' }, { transform: 'translateX(0)' }], { duration: 320 });
        kod = ''; prickar(); }
    };
    const tryck = (v) => { if (v === 'x') return stang(); if (v === 'ok') return skicka(); if (kod.length < 12) kod += v; m.querySelector('[data-fel]').textContent = ''; prickar(); };
    const tangent = (e) => { if (/^[0-9]$/.test(e.key)) tryck(e.key); else if (e.key === 'Backspace') { kod = kod.slice(0, -1); prickar(); } else if (e.key === 'Enter') tryck('ok'); else if (e.key === 'Escape') stang(); };
    m.addEventListener('click', (e) => { if (e.target === m) return stang(); const b = e.target.closest('button[data-v]'); if (b) tryck(b.dataset.v); });
    document.addEventListener('keydown', tangent);
    prickar();
    document.body.appendChild(m);
  };
}
window.Aura.hass = hass;
return true;

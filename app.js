/* JohnBF: protein, workout and vitamin tracker. All data stays in this browser (localStorage). */
'use strict';
(function () {
  const ICS = window.JohnBFICS;
  const STORE = 'johnbf:v1';
  const LB_TO_KG = 0.45359237;
  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const DOW_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const DOW1 = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Monday-first
  const WEEKLY_GOAL = 150;
  const WEEKLY_STRETCH = 300;
  const STRENGTH_GOAL = 2;

  const KIND = {
    protein: { name: 'Protein', cls: 'protein' },
    vitamins: { name: 'Vitamins', cls: 'vit' },
    workout: { name: 'Workout', cls: 'move' },
  };

  // ── Sources (each verified against PubMed / publisher / HHS before use) ──────────
  const REFS = {
    iom: {
      text: 'Institute of Medicine. Dietary Reference Intakes for Energy, Carbohydrate, Fiber, Fat, Fatty Acids, Cholesterol, Protein, and Amino Acids. National Academies Press; 2005: chap 10, p 589.',
      doi: '10.17226/10490',
    },
    jager: {
      text: 'Jäger R, Kerksick CM, Campbell BI, et al. International Society of Sports Nutrition position stand: protein and exercise. J Int Soc Sports Nutr. 2017;14:20.',
      doi: '10.1186/s12970-017-0177-8',
    },
    morton: {
      text: 'Morton RW, Murphy KT, McKellar SR, et al. A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains in muscle mass and strength in healthy adults. Br J Sports Med. 2018;52(6):376-384.',
      doi: '10.1136/bjsports-2017-097608',
      note: 'Authors disclose dairy-industry and supplement-company ties.',
    },
    schoenfeld: {
      text: 'Schoenfeld BJ, Aragon AA. How much protein can the body use in a single meal for muscle-building? Implications for daily protein distribution. J Int Soc Sports Nutr. 2018;15:10.',
      doi: '10.1186/s12970-018-0215-1',
      note: 'Narrative review; an author advises a supplement company.',
    },
    bauer: {
      text: 'Bauer J, Biolo G, Cederholm T, et al. Evidence-based recommendations for optimal dietary protein intake in older people: a position paper from the PROT-AGE Study Group. J Am Med Dir Assoc. 2013;14(8):542-559.',
      doi: '10.1016/j.jamda.2013.05.021',
    },
    piercy: {
      text: 'Piercy KL, Troiano RP, Ballard RM, et al. The Physical Activity Guidelines for Americans. JAMA. 2018;320(19):2020-2028.',
      doi: '10.1001/jama.2018.14854',
    },
    hhs: {
      text: 'US Department of Health and Human Services. Physical Activity Guidelines for Americans. 2nd ed. HHS; 2018: pp 58, 60.',
      url: 'https://odphp.health.gov/sites/default/files/2019-09/Physical_Activity_Guidelines_2nd_edition.pdf',
    },
    bull: {
      text: 'Bull FC, Al-Ansari SS, Biddle S, et al. World Health Organization 2020 guidelines on physical activity and sedentary behaviour. Br J Sports Med. 2020;54(24):1451-1462.',
      doi: '10.1136/bjsports-2020-102955',
    },
    dawson: {
      text: 'Dawson-Hughes B, Harris SS, Lichtenstein AH, et al. Dietary fat increases vitamin D-3 absorption. J Acad Nutr Diet. 2015;115(2):225-230.',
      doi: '10.1016/j.jand.2014.09.014',
    },
    mulligan: {
      text: 'Mulligan GB, Licata A. Taking vitamin D with the largest meal improves absorption and results in higher serum levels of 25-hydroxyvitamin D. J Bone Miner Res. 2010;25(4):928-930.',
      doi: '10.1002/jbmr.67',
    },
  };
  const REF_ORDER = ['iom', 'jager', 'morton', 'schoenfeld', 'bauer', 'piercy', 'hhs', 'bull', 'dawson', 'mulligan'];

  const GOALS = {
    rda: { label: 'General health', perKg: 0.8, blurb: 'The adult RDA is 0.8 g/kg/day.', refs: ['iom'] },
    active: {
      label: 'Active / training',
      perKg: 1.6,
      blurb: 'Around 1.6 g/kg/day is where muscle gains leveled off in a meta-analysis, inside the ISSN’s 1.4–2.0 g/kg range for people who exercise.',
      refs: ['morton', 'jager'],
    },
    max: {
      label: 'Max muscle gain',
      perKg: 2.2,
      blurb: 'About 2.2 g/kg/day is the upper intake researchers suggest for people trying to maximize muscle gains.',
      refs: ['morton', 'schoenfeld'],
    },
    older: {
      label: 'Age 65+, active',
      perKg: 1.2,
      blurb: 'PROT-AGE advises at least 1.0–1.2 g/kg/day over 65, and 1.2 g/kg/day or more if you exercise.',
      refs: ['bauer'],
    },
    custom: { label: 'Custom', perKg: null, blurb: '', refs: [] },
  };

  const WORKOUT_TYPES = [
    { id: 'strength', label: 'Strength', effort: 'strength', strength: true },
    { id: 'run', label: 'Run', effort: 'vigorous', strength: false },
    { id: 'walk', label: 'Walk', effort: 'moderate', strength: false },
    { id: 'cycle', label: 'Cycle', effort: 'moderate', strength: false },
    { id: 'swim', label: 'Swim', effort: 'moderate', strength: false },
    { id: 'hiit', label: 'HIIT', effort: 'vigorous', strength: false },
    { id: 'sport', label: 'Sport', effort: 'moderate', strength: false },
    { id: 'yoga', label: 'Yoga', effort: 'light', strength: false },
    { id: 'other', label: 'Other', effort: 'moderate', strength: false },
  ];
  const EFFORTS = [
    { id: 'light', label: 'Light' },
    { id: 'moderate', label: 'Moderate' },
    { id: 'vigorous', label: 'Vigorous' },
    { id: 'strength', label: 'Strength only' },
  ];

  // ── Utilities ────────────────────────────────────────────────────────────────
  const h = (s) =>
    String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const pad = (n) => String(n).padStart(2, '0');
  const uid = () =>
    (window.crypto && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2))
      .replace(/-/g, '')
      .slice(0, 12);
  const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const todayKey = () => keyOf(new Date());
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const weekStart = (d) => addDays(d, -((d.getDay() + 6) % 7));
  const clock = (d) => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const clockOf = (ts) => clock(new Date(ts));
  const hhmmToDate = (t) => {
    const [H, M] = t.split(':').map(Number);
    return new Date(2000, 0, 1, H, M);
  };
  const round1 = (n) => Math.round(n * 10) / 10;
  const fmtG = (n) => String(Math.round(n));
  const cleanNum = (v) => {
    const n = parseFloat(String(v).replace(',', '.'));
    return Number.isFinite(n) && n > 0 ? String(round1(n)) : '';
  };
  const refNum = (k) => REF_ORDER.indexOf(k) + 1;
  const cite = (...keys) => `<sup class="cite">[${keys.map(refNum).join(', ')}]</sup>`;
  const typeLabel = (id) => (WORKOUT_TYPES.find((t) => t.id === id) || { label: 'Workout' }).label;
  const effortLabel = (id) => (EFFORTS.find((e) => e.id === id) || { label: '' }).label;
  const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  // ── State ────────────────────────────────────────────────────────────────────
  function defaultReminders() {
    const all = [0, 1, 2, 3, 4, 5, 6];
    return [
      { id: uid(), kind: 'protein', label: 'Breakfast', time: '07:30', days: all, followUp: 30 },
      { id: uid(), kind: 'vitamins', label: 'With breakfast', time: '08:00', days: all, followUp: 30 },
      { id: uid(), kind: 'protein', label: 'Lunch', time: '12:30', days: all, followUp: 30 },
      { id: uid(), kind: 'protein', label: 'Snack', time: '16:00', days: all, followUp: 30 },
      { id: uid(), kind: 'workout', label: 'Training', time: '17:30', days: [1, 3, 5], followUp: 60 },
      { id: uid(), kind: 'protein', label: 'Dinner', time: '19:30', days: all, followUp: 30 },
    ];
  }

  function defaults() {
    return {
      v: 1,
      profile: { weight: '', unit: 'lb', goal: 'active', custom: '' },
      supplements: [{ id: uid(), name: 'Multivitamin', dose: '1 tablet', withFood: true }],
      foods: [],
      reminders: defaultReminders(),
      days: {},
      ui: { installDismissed: false },
      calHash: null,
      calAt: null,
    };
  }

  function normalize(s) {
    const d = defaults();
    const out = Object.assign(d, s);
    out.profile = Object.assign(defaults().profile, s.profile || {});
    out.ui = Object.assign({ installDismissed: false }, s.ui || {});
    for (const k of ['supplements', 'foods', 'reminders']) if (!Array.isArray(out[k])) out[k] = d[k];
    if (!out.days || typeof out.days !== 'object') out.days = {};
    return out;
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORE);
      if (raw) {
        const s = JSON.parse(raw);
        if (s && s.v === 1) return normalize(s);
      }
    } catch (e) {
      /* fall through to defaults */
    }
    return defaults();
  }

  let state = load();

  function save() {
    try {
      localStorage.setItem(STORE, JSON.stringify(state));
    } catch (e) {
      toast('Could not save on this device');
    }
  }
  function commit() {
    save();
    render();
  }

  const EMPTY_DAY = () => ({ protein: [], workouts: [], supps: {}, suppGoal: 0 });
  const day = (k) => state.days[k] || EMPTY_DAY();
  const dayW = (k) => (state.days[k] = state.days[k] || EMPTY_DAY());

  // ── Protein ──────────────────────────────────────────────────────────────────
  function weightKg() {
    const w = parseFloat(state.profile.weight);
    if (!(w > 0)) return null;
    return state.profile.unit === 'lb' ? w * LB_TO_KG : w;
  }
  function proteinTarget() {
    const p = state.profile;
    if (p.goal === 'custom') {
      const c = parseFloat(p.custom);
      return c > 0 ? Math.round(c) : null;
    }
    const kg = weightKg();
    const goal = GOALS[p.goal] || GOALS.active;
    return kg ? Math.round((kg * goal.perKg) / 5) * 5 : null;
  }
  const proteinOn = (k) => round1(day(k).protein.reduce((s, e) => s + e.g, 0));
  const proteinMet = (k) => {
    const t = proteinTarget();
    return !!t && proteinOn(k) >= t;
  };

  // ── Vitamins ─────────────────────────────────────────────────────────────────
  const suppsTakenToday = () => {
    const d = day(todayKey());
    return state.supplements.filter((s) => d.supps[s.id]).length;
  };
  function vitMet(k) {
    if (k === todayKey()) {
      const n = state.supplements.length;
      return n > 0 && suppsTakenToday() >= n;
    }
    const d = state.days[k];
    return !!d && d.suppGoal > 0 && Object.keys(d.supps).length >= d.suppGoal;
  }

  // ── Workouts ─────────────────────────────────────────────────────────────────
  function weekStats(ws) {
    let mod = 0;
    let vig = 0;
    let sessions = 0;
    const strengthDays = new Set();
    const activeDays = new Set();
    for (let i = 0; i < 7; i++) {
      const k = keyOf(addDays(ws, i));
      for (const w of day(k).workouts) {
        sessions++;
        activeDays.add(k);
        if (w.effort === 'moderate') mod += w.min;
        else if (w.effort === 'vigorous') vig += w.min;
        if (w.strength) strengthDays.add(k);
      }
    }
    return { mod, vig, eq: mod + 2 * vig, strength: strengthDays.size, active: activeDays.size, sessions };
  }

  // ── Streaks ──────────────────────────────────────────────────────────────────
  function dayStreak(met) {
    let d = new Date();
    if (!met(keyOf(d))) d = addDays(d, -1); // today still in progress
    let n = 0;
    while (n < 3650 && met(keyOf(d))) {
      n++;
      d = addDays(d, -1);
    }
    return n;
  }
  const proteinStreak = () => dayStreak(proteinMet);
  const vitStreak = () => dayStreak(vitMet);
  function weekStreak() {
    let ws = weekStart(new Date());
    if (weekStats(ws).eq < WEEKLY_GOAL) ws = addDays(ws, -7);
    let n = 0;
    while (n < 520 && weekStats(ws).eq >= WEEKLY_GOAL) {
      n++;
      ws = addDays(ws, -7);
    }
    return n;
  }

  // ── Reminders / Calendar ─────────────────────────────────────────────────────
  function nextReminder() {
    const now = new Date();
    let best = null;
    for (const r of state.reminders) {
      if (!r.days.length) continue;
      const [H, M] = r.time.split(':').map(Number);
      for (let i = 0; i < 8; i++) {
        const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, H, M);
        if (at > now && r.days.includes(at.getDay())) {
          if (!best || at < best.at) best = { r, at };
          break;
        }
      }
    }
    return best;
  }

  function calPayload() {
    const t = proteinTarget();
    const n = state.reminders.filter((r) => r.kind === 'protein' && r.days.length).length;
    return {
      r: state.reminders.map((r) => ({ i: r.id, k: r.kind, l: r.label, t: r.time, d: r.days, f: r.followUp })),
      pt: t || null,
      pm: t && n ? Math.round(t / n) : null,
      s: state.supplements.map((s) =>
        [s.name, s.dose ? `(${s.dose})` : '', s.withFood ? 'with food' : ''].filter(Boolean).join(' ')
      ),
    };
  }
  function hashStr(s) {
    let x = 2166136261;
    for (let i = 0; i < s.length; i++) {
      x ^= s.charCodeAt(i);
      x = Math.imul(x, 16777619);
    }
    return (x >>> 0).toString(36);
  }
  const calHash = () => hashStr(JSON.stringify(calPayload()));
  const appBase = () => new URL('./', location.href).href;
  const icsHref = (payload) => appBase() + 'johnbf.ics?d=' + ICS.encode(payload);
  // In the Home Screen app, open calendar links in Safari's sheet (it has a Done button).
  const calTarget = isStandalone ? ' target="_blank" rel="noopener"' : '';

  function eventCount() {
    const active = state.reminders.filter((r) => r.days.length);
    return { main: active.length, follow: active.filter((r) => r.followUp > 0).length };
  }

  function downloadIcs(payload) {
    const text = ICS.build(payload, new Date());
    const name = payload.test ? 'johnbf-test.ics' : 'johnbf-reminders.ics';
    downloadBlob(new Blob([text], { type: 'text/calendar' }), name);
  }
  function downloadBlob(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.append(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 5000);
  }
  async function copyText(text, msg) {
    try {
      await navigator.clipboard.writeText(text);
      toast(msg || 'Copied');
    } catch (e) {
      window.prompt('Copy this link:', text);
    }
  }
  function markExported() {
    state.calHash = calHash();
    state.calAt = Date.now();
    save(); // no re-render yet: the link being followed must stay in the DOM
    setTimeout(render, 1200);
  }
  function refreshCalLinks() {
    view.querySelectorAll('[data-cal="all"]').forEach((a) => (a.href = icsHref(calPayload())));
    const status = view.querySelector('#cal-status');
    if (status) status.innerHTML = calStatus();
  }

  // ── Rendering helpers ────────────────────────────────────────────────────────
  function ring(p) {
    const size = 100;
    const sw = 11;
    const r = (size - sw) / 2;
    const c = 2 * Math.PI * r;
    const v = Math.max(0, Math.min(1, p || 0));
    return `<svg class="ring" viewBox="0 0 ${size} ${size}" aria-hidden="true">
      <circle class="ring-track" cx="50" cy="50" r="${r}" stroke-width="${sw}"/>
      ${v > 0 ? `<circle class="ring-fill" cx="50" cy="50" r="${r}" stroke-width="${sw}" stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${(c * (1 - v)).toFixed(2)}" transform="rotate(-90 50 50)"/>` : ''}
    </svg>`;
  }
  function ringCard({ href, cls, pct, big, small, label, aria }) {
    const done = pct >= 1;
    return `<a class="ring-card ${cls}${done ? ' done' : ''}" href="${href}" aria-label="${h(aria)}">
      <div class="ring-wrap">${ring(pct)}<div class="ring-center"><b>${big}</b><small>${small}</small></div></div>
      <span class="ring-label"><i class="dot ${cls}"></i>${label}${done ? ' ✓' : ''}</span>
    </a>`;
  }
  const meter = (cls, p) => {
    const v = Math.max(0, Math.min(1, p || 0));
    return `<div class="meter ${cls}" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(v * 100)}"><span style="width:${(v * 100).toFixed(1)}%"></span></div>`;
  };
  function streakChip(cls, n, unit, name) {
    return `<span class="streak${n > 0 ? ' hot' : ''}"><i class="dot ${cls}"></i><span>${n > 0 ? '🔥 ' : ''}<b>${n}</b>-${unit} ${name}</span></span>`;
  }
  function refList(keys) {
    return `<ol class="refs">${keys
      .map((k) => {
        const r = REFS[k];
        const link = r.doi
          ? `doi:<a href="https://doi.org/${r.doi}" target="_blank" rel="noopener">${r.doi}</a>`
          : `<a href="${r.url}" target="_blank" rel="noopener">PDF</a>`;
        return `<li value="${refNum(k)}">${h(r.text)} ${link}${r.note ? ` <em>${h(r.note)}</em>` : ''}</li>`;
      })
      .join('')}</ol>`;
  }
  function niceScale(max) {
    for (const s of [5, 10, 20, 25, 50, 100, 150, 200, 250, 500, 1000]) {
      const top = Math.ceil(max / s) * s;
      if (top / s <= 4) return { top, step: s };
    }
    const s = Math.pow(10, Math.ceil(Math.log10(max / 4)));
    return { top: Math.ceil(max / s) * s, step: s };
  }
  // Single-series column chart: title names the series, so no legend; goal as a reference line.
  function columnChart({ data, goal, unit, cls, caption }) {
    const max = Math.max(goal || 0, ...data.map((d) => d.value));
    const { top, step } = niceScale(max > 0 ? max * 1.08 : 100);
    const pct = (v) => ((v / top) * 100).toFixed(2);
    const ticks = [];
    for (let v = 0; v <= top; v += step) ticks.push(v);
    const last = data.length - 1;
    return `<figure class="chart ${cls}">
      <div class="plot">
        ${ticks.map((v) => `<div class="gridline" style="bottom:${pct(v)}%"><span>${v}</span></div>`).join('')}
        ${goal ? `<div class="goal-line" style="bottom:${pct(goal)}%"></div>` : ''}
        <div class="cols">
          ${data
            .map(
              (d, i) => `<button type="button" class="col" data-act="tip" aria-label="${h(d.full)}: ${d.value} ${unit}">
                <span class="bar" style="height:${pct(d.value)}%"></span>
                ${i === last && d.value > 0 ? `<span class="cap" style="bottom:${pct(d.value)}%">${d.value}</span>` : ''}
                <span class="tip" style="bottom:${pct(d.value)}%">${h(d.full)}<b>${d.value} ${unit}</b></span>
              </button>`
            )
            .join('')}
        </div>
      </div>
      <div class="xaxis">${data.map((d) => `<span class="${d.current ? 'now' : ''}">${h(d.label)}</span>`).join('')}</div>
      ${goal ? `<div class="chart-key"><i class="key-line" aria-hidden="true"></i>Goal: ${goal} ${h(unit)}</div>` : ''}
      <figcaption class="sr-only">${h(caption)}</figcaption>
      <details class="table-view"><summary>View as table</summary>
        <table><thead><tr><th scope="col">${data[0] && data[0].full.includes('Week') ? 'Week' : 'Day'}</th><th scope="col">${h(unit)}</th></tr></thead>
        <tbody>${data.map((d) => `<tr><td>${h(d.full)}</td><td>${d.value}</td></tr>`).join('')}</tbody></table>
      </details>
    </figure>`;
  }

  function installBanner() {
    if (!isIOS || isStandalone || state.ui.installDismissed) return '';
    return `<section class="card install">
      <div><b>Install JohnBF</b>
        <p class="small">In Safari tap <b>Share</b> <span aria-hidden="true">⬆︎</span>, then <b>Add to Home Screen</b>. It opens full-screen like an app.</p></div>
      <button class="icon-btn" data-act="dismiss-install" aria-label="Dismiss install tip">×</button>
    </section>`;
  }

  // ── Shared widgets ───────────────────────────────────────────────────────────
  function quickProtein() {
    return `<div class="chips">${[10, 20, 30, 40]
      .map((g) => `<button type="button" class="chip protein" data-act="add-protein" data-g="${g}">+${g} g</button>`)
      .join('')}</div>
      ${
        state.foods.length
          ? `<div class="chips foods">${state.foods
              .map((f) => `<button type="button" class="chip ghost" data-act="food" data-id="${f.id}">${h(f.name)} <b>${fmtG(f.g)} g</b></button>`)
              .join('')}</div>`
          : ''
      }
      <form class="inline-form" data-form="protein-custom">
        <input name="g" inputmode="decimal" placeholder="Grams" aria-label="Protein grams" autocomplete="off" class="narrow" required>
        <input name="name" placeholder="Food (optional)" aria-label="Food name" autocomplete="off">
        <button class="btn protein">Add</button>
      </form>`;
  }

  function suppChecklist() {
    if (!state.supplements.length) return `<p class="muted">No supplements yet. <a href="#vitamins">Add some →</a></p>`;
    const d = day(todayKey());
    return `<ul class="checklist">${state.supplements
      .map((s) => {
        const on = !!d.supps[s.id];
        const meta = [s.dose, s.withFood ? 'with food' : ''].filter(Boolean).join(' · ');
        return `<li><button type="button" class="check vit${on ? ' on' : ''}" data-act="supp" data-id="${s.id}" aria-pressed="${on}">
          <span class="box" aria-hidden="true"></span>
          <span class="check-text"><b>${h(s.name)}</b>${meta ? `<small>${h(meta)}</small>` : ''}</span>
          ${on ? `<span class="time">${clockOf(d.supps[s.id])}</span>` : ''}
        </button></li>`;
      })
      .join('')}</ul>`;
  }

  function workoutRows(rows) {
    return `<ul class="log">${rows
      .map(
        ({ label, k, w }) => `<li>
          <span class="time">${label}</span>
          <span class="what">${h(typeLabel(w.type))}<small>${w.effort === 'strength' ? 'Muscle-strengthening' : `${h(effortLabel(w.effort))}${w.strength ? ' · 💪 strength' : ''}`}</small></span>
          <b>${w.min} min</b>
          <button type="button" class="icon-btn small" data-act="del-workout" data-day="${k}" data-id="${w.id}" aria-label="Delete ${h(typeLabel(w.type))} workout">×</button>
        </li>`
      )
      .join('')}</ul>`;
  }

  // ── Views ────────────────────────────────────────────────────────────────────
  function renderToday() {
    const now = new Date();
    const k = todayKey();
    const t = proteinTarget();
    const g = proteinOn(k);
    const ws = weekStats(weekStart(now));
    const n = state.supplements.length;
    const taken = suppsTakenToday();
    const next = nextReminder();
    const todays = day(k).workouts.map((w) => ({ label: clockOf(w.t), k, w }));

    return `
    ${installBanner()}
    <section class="hero">
      <p class="eyebrow">${DOW_FULL[now.getDay()]}</p>
      <h1 class="display">${now.getDate()} ${MON[now.getMonth()]}</h1>
      <div class="streaks">
        ${streakChip('protein', proteinStreak(), 'day', 'protein')}
        ${streakChip('move', weekStreak(), 'wk', 'active')}
        ${streakChip('vit', vitStreak(), 'day', 'vitamins')}
      </div>
    </section>

    <section class="rings">
      ${ringCard({ href: '#protein', cls: 'protein', pct: t ? g / t : 0, big: fmtG(g), small: t ? `of ${t} g` : 'grams', label: 'Protein', aria: t ? `Protein: ${fmtG(g)} of ${t} grams` : `Protein: ${fmtG(g)} grams` })}
      ${ringCard({ href: '#move', cls: 'move', pct: ws.eq / WEEKLY_GOAL, big: ws.eq, small: `of ${WEEKLY_GOAL} min`, label: 'Week', aria: `This week: ${ws.eq} of ${WEEKLY_GOAL} minutes` })}
      ${ringCard({ href: '#vitamins', cls: 'vit', pct: n ? taken / n : 0, big: taken, small: `of ${n}`, label: 'Vitamins', aria: `Vitamins: ${taken} of ${n} taken` })}
    </section>

    ${!t ? `<a class="card callout protein" href="#protein"><b>Set your protein target →</b><span>Enter your weight and goal to get a daily number.</span></a>` : ''}
    ${!state.calHash ? `<a class="card callout move" href="#remind"><b>Turn on reminders →</b><span>Add your schedule to iPhone Calendar so alerts pop up even when JohnBF is closed.</span></a>` : ''}

    ${
      next
        ? `<section class="card next">
            <i class="bar-accent ${KIND[next.r.kind].cls}"></i>
            <div><p class="eyebrow">Next up · ${dayWord(next.at)} ${clock(next.at)}</p>
            <p class="next-title">${KIND[next.r.kind].name}${next.r.label ? ` · ${h(next.r.label)}` : ''}</p></div>
          </section>`
        : ''
    }

    <section class="card">
      <div class="card-head"><h2><i class="dot protein"></i>Protein</h2><span class="muted">${t ? (g >= t ? 'Goal hit 🔥' : `${fmtG(t - g)} g to go`) : ''}</span></div>
      ${quickProtein()}
    </section>

    <section class="card">
      <div class="card-head"><h2><i class="dot vit"></i>Vitamins</h2>${n && taken < n ? '<button type="button" class="link" data-act="all-supps">Mark all</button>' : ''}</div>
      ${suppChecklist()}
    </section>

    <section class="card">
      <div class="card-head"><h2><i class="dot move"></i>Workout</h2><span class="muted">${ws.strength}/${STRENGTH_GOAL} strength days</span></div>
      ${todays.length ? workoutRows(todays) : '<p class="muted">Nothing logged today.</p>'}
      <button type="button" class="cta move" data-act="open-workout">+ Log workout</button>
    </section>`;
  }

  function dayWord(at) {
    const k = keyOf(at);
    if (k === todayKey()) return 'Today';
    if (k === keyOf(addDays(new Date(), 1))) return 'Tomorrow';
    return DOW[at.getDay()];
  }

  function targetCard() {
    const p = state.profile;
    const kg = weightKg();
    const t = proteinTarget();
    const goal = GOALS[p.goal] || GOALS.active;
    const proteinRems = state.reminders.filter((r) => r.kind === 'protein' && r.days.length).length;
    let calc = 'Enter your weight to calculate.';
    if (p.goal === 'custom') calc = t ? `Target: <b>${t} g/day</b>` : 'Enter your daily grams.';
    else if (t) calc = `${h(p.weight)} ${p.unit}${p.unit === 'lb' ? ` = ${kg.toFixed(1)} kg` : ''} × ${goal.perKg} g/kg ≈ <b>${t} g/day</b>`;
    return `<section class="card" id="target">
      <div class="card-head"><h2>Your daily target</h2></div>
      <div class="field"><span class="field-label">Body weight</span>
        <div class="input-group">
          <input data-field="weight" inputmode="decimal" value="${h(p.weight)}" placeholder="${p.unit === 'lb' ? 'e.g. 180' : 'e.g. 82'}" aria-label="Body weight in ${p.unit}" autocomplete="off">
          <div class="seg compact" role="group" aria-label="Unit">${['lb', 'kg']
            .map((u) => `<button type="button" class="${p.unit === u ? 'on' : ''}" data-act="unit" data-unit="${u}" aria-pressed="${p.unit === u}">${u}</button>`)
            .join('')}</div>
        </div>
      </div>
      <div class="field"><span class="field-label">Goal</span>
        <div class="goal-grid">${Object.entries(GOALS)
          .map(
            ([id, gl]) => `<button type="button" class="goal${p.goal === id ? ' on' : ''}" data-act="goal" data-goal="${id}" aria-pressed="${p.goal === id}">
              <b>${gl.label}</b><small>${gl.perKg ? `${gl.perKg} g/kg` : 'your number'}</small></button>`
          )
          .join('')}</div>
      </div>
      ${p.goal === 'custom' ? `<label class="field"><span class="field-label">Daily grams</span><input data-field="custom" inputmode="numeric" value="${h(p.custom)}" placeholder="e.g. 150" autocomplete="off"></label>` : ''}
      <p class="calc">${calc}</p>
      ${t && proteinRems ? `<p class="muted small">Split across your ${proteinRems} protein reminders ≈ <b>${Math.round(t / proteinRems)} g</b> each.${kg ? ` Schoenfeld &amp; Aragon suggest ~0.4 g/kg per meal over 4+ meals (≈${Math.round(kg * 0.4)} g for you).${cite('schoenfeld')}` : ''}</p>` : ''}
      ${goal.perKg ? `<p class="muted small">${h(goal.blurb)}${cite(...goal.refs)}</p>` : ''}
    </section>`;
  }

  function proteinChart() {
    const today = new Date();
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = addDays(today, -i);
      const k = keyOf(d);
      data.push({ label: i === 0 ? 'Today' : DOW[d.getDay()], full: `${DOW[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]}`, value: Math.round(proteinOn(k)), current: i === 0 });
    }
    return columnChart({ data, goal: proteinTarget(), unit: 'g', cls: 'protein', caption: 'Protein grams per day, last 7 days' });
  }

  function renderProtein() {
    const k = todayKey();
    const t = proteinTarget();
    const g = proteinOn(k);
    const entries = day(k).protein;
    const streak = proteinStreak();
    return `
    <section class="hero">
      <p class="eyebrow">Protein today</p>
      <h1 class="display">${fmtG(g)}<span class="unit">${t ? ` / ${t} g` : ' g'}</span></h1>
      ${t ? meter('protein', g / t) : ''}
      <p class="sub">${t ? (g >= t ? `Goal hit 🔥 ${streak}-day streak` : `${fmtG(t - g)} g to go${streak ? ` · ${streak}-day streak` : ''}`) : 'Set your target below to start a streak.'}</p>
    </section>
    ${!t ? targetCard() : ''}
    <section class="card"><div class="card-head"><h2>Add protein</h2></div>${quickProtein()}</section>
    <section class="card">
      <div class="card-head"><h2>Today’s log</h2><span class="muted">${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}</span></div>
      ${
        entries.length
          ? `<ul class="log">${entries
              .slice()
              .reverse()
              .map(
                (e) => `<li><span class="time">${clockOf(e.t)}</span><span class="what">${h(e.name || 'Protein')}</span><b>${fmtG(e.g)} g</b>
                  <button type="button" class="icon-btn small" data-act="del-protein" data-id="${e.id}" aria-label="Delete ${fmtG(e.g)} g entry">×</button></li>`
              )
              .join('')}</ul>`
          : '<p class="muted">Nothing yet. Tap a button above to log.</p>'
      }
    </section>
    <section class="card"><div class="card-head"><h2>Last 7 days</h2><span class="muted">grams of protein</span></div>${proteinChart()}</section>
    <section class="card">
      <div class="card-head"><h2>My foods</h2></div>
      ${
        state.foods.length
          ? `<ul class="log">${state.foods
              .map(
                (f) => `<li><span class="what">${h(f.name)}</span><b>${fmtG(f.g)} g</b>
                  <button type="button" class="icon-btn small" data-act="del-food" data-id="${f.id}" aria-label="Remove ${h(f.name)}">×</button></li>`
              )
              .join('')}</ul>`
          : '<p class="muted small">Save foods you eat often (check the label for grams). They become one-tap buttons.</p>'
      }
      <form class="inline-form" data-form="food-new">
        <input name="name" placeholder="Food name" aria-label="Food name" autocomplete="off" required>
        <input name="g" inputmode="decimal" placeholder="g" aria-label="Protein grams" class="narrow" autocomplete="off" required>
        <button class="btn">Save</button>
      </form>
    </section>
    ${t ? targetCard() : ''}
    <details class="card evidence">
      <summary>Why these numbers?</summary>
      <p>The adult RDA is <b>0.8 g per kg</b> of body weight per day.${cite('iom')}</p>
      <p>For people who exercise, the International Society of Sports Nutrition says <b>1.4–2.0 g/kg/day</b> is enough for most, ideally spread every 3–4 hours in servings of about 0.25 g/kg or 20–40 g.${cite('jager')}</p>
      <p>A meta-analysis of resistance-training trials found muscle gains leveled off around <b>1.6 g/kg/day</b> (95% CI 1.03–2.20). That estimate is uncertain, so the authors suggest up to ~2.2 g/kg/day for anyone trying to maximize gains.${cite('morton')}</p>
      <p>Schoenfeld &amp; Aragon suggest about <b>0.4 g/kg per meal across at least four meals</b> to reach ~1.6 g/kg/day (up to ~0.55 g/kg per meal for 2.2 g/kg/day).${cite('schoenfeld')}</p>
      <p>Over 65, the PROT-AGE group recommends at least 1.0–1.2 g/kg/day, and 1.2 g/kg/day or more if you are active.${cite('bauer')}</p>
      <p class="warn">Kidney disease or another medical condition? Talk to your clinician before raising protein. PROT-AGE notes that people with severe kidney disease who are not on dialysis may need to limit it.${cite('bauer')}</p>
      ${refList(['iom', 'jager', 'morton', 'schoenfeld', 'bauer'])}
    </details>`;
  }

  function weeksChart() {
    const ws0 = weekStart(new Date());
    const data = [];
    for (let i = 7; i >= 0; i--) {
      const ws = addDays(ws0, -7 * i);
      const label = ws.toLocaleDateString([], { month: 'numeric', day: 'numeric' });
      data.push({ label: i === 0 ? 'Now' : label, full: `Week of ${ws.getDate()} ${MON[ws.getMonth()]}`, value: weekStats(ws).eq, current: i === 0 });
    }
    return columnChart({ data, goal: WEEKLY_GOAL, unit: 'min', cls: 'move', caption: 'Moderate-equivalent aerobic minutes per week, last 8 weeks' });
  }

  function renderMove() {
    const ws0 = weekStart(new Date());
    const s = weekStats(ws0);
    const streak = weekStreak();
    const rows = [];
    for (let i = 0; i < 7; i++) {
      const d = addDays(ws0, i);
      const k = keyOf(d);
      for (const w of day(k).workouts) rows.push({ label: DOW[d.getDay()], k, w });
    }
    let sub = `${WEEKLY_GOAL - s.eq} min to go · vigorous minutes count double`;
    if (s.eq >= WEEKLY_STRETCH) sub = `Upper target (${WEEKLY_STRETCH}+) smashed 🔥`;
    else if (s.eq >= WEEKLY_GOAL) sub = `Weekly goal hit 🔥 ${streak}-week streak · stretch: ${WEEKLY_STRETCH}`;
    return `
    <section class="hero">
      <p class="eyebrow">This week · aerobic</p>
      <h1 class="display">${s.eq}<span class="unit"> / ${WEEKLY_GOAL} min</span></h1>
      ${meter('move', s.eq / WEEKLY_GOAL)}
      <p class="sub">${sub}</p>
    </section>
    <section class="card stats">
      <div class="stat"><span class="stat-label">Strength days</span><span class="stat-value">${s.strength}<small> / ${STRENGTH_GOAL}</small></span>${meter('move', s.strength / STRENGTH_GOAL)}</div>
      <div class="stat"><span class="stat-label">Active days</span><span class="stat-value">${s.active}<small> / 7</small></span></div>
      <div class="stat"><span class="stat-label">Vigorous</span><span class="stat-value">${s.vig}<small> min</small></span></div>
    </section>
    <button type="button" class="cta move" data-act="open-workout">+ Log workout</button>
    <section class="card">
      <div class="card-head"><h2>This week</h2><span class="muted">${s.sessions} ${s.sessions === 1 ? 'session' : 'sessions'}</span></div>
      ${rows.length ? workoutRows(rows) : '<p class="muted">No workouts logged this week yet.</p>'}
    </section>
    <section class="card"><div class="card-head"><h2>Last 8 weeks</h2><span class="muted">min per week</span></div>${weeksChart()}</section>
    <details class="card evidence">
      <summary>Why these numbers?</summary>
      <p>US and WHO guidelines: adults should get <b>150–300 min/week of moderate</b> or <b>75–150 min/week of vigorous</b> aerobic activity (or an equivalent mix), plus <b>muscle-strengthening on 2 or more days</b> a week.${cite('piercy', 'bull')}</p>
      <p>Rule of thumb: 2 minutes of moderate counts the same as 1 minute of vigorous, so JohnBF counts vigorous minutes double. Light activity and strength-only sessions don’t add aerobic minutes.${cite('hhs')}</p>
      <p>Talk test: “a person doing moderate-intensity aerobic activity can talk, but not sing, during the activity. A person doing vigorous-intensity activity cannot say more than a few words without pausing for a breath.”${cite('hhs')}</p>
      ${refList(['piercy', 'hhs', 'bull'])}
    </details>`;
  }

  function vitHistory() {
    const today = new Date();
    const cells = [];
    for (let i = 13; i >= 0; i--) {
      const d = addDays(today, -i);
      const k = keyOf(d);
      const met = vitMet(k);
      cells.push(`<span class="hcell${met ? ' on' : ''}${i === 0 ? ' now' : ''}" role="img" aria-label="${DOW[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]}: ${met ? 'all taken' : 'not complete'}"><i>${DOW1[d.getDay()]}</i></span>`);
    }
    return `<div class="habit-grid vit">${cells.join('')}</div><p class="muted small">Filled = every supplement checked off that day.</p>`;
  }

  function renderVitamins() {
    const n = state.supplements.length;
    const taken = suppsTakenToday();
    const streak = vitStreak();
    let sub = 'Add your supplements below.';
    if (n) sub = taken >= n ? `All done 🔥 ${streak}-day streak` : `${n - taken} to go${streak ? ` · ${streak}-day streak` : ''}`;
    return `
    <section class="hero">
      <p class="eyebrow">Vitamins today</p>
      <h1 class="display">${taken}<span class="unit"> / ${n} taken</span></h1>
      ${n ? meter('vit', taken / n) : ''}
      <p class="sub">${sub}</p>
    </section>
    <section class="card">
      <div class="card-head"><h2>Check off</h2>${n && taken < n ? '<button type="button" class="link" data-act="all-supps">Mark all taken</button>' : ''}</div>
      ${suppChecklist()}
    </section>
    <section class="card"><div class="card-head"><h2>Last 14 days</h2></div>${vitHistory()}</section>
    <section class="card">
      <div class="card-head"><h2>My supplements</h2></div>
      ${state.supplements
        .map(
          (s) => `<div class="supp-edit">
            <input data-field="supp-name" data-id="${s.id}" value="${h(s.name)}" aria-label="Supplement name" autocomplete="off">
            <input data-field="supp-dose" data-id="${s.id}" value="${h(s.dose)}" placeholder="Dose" aria-label="Dose for ${h(s.name)}" class="narrow" autocomplete="off">
            <button type="button" class="icon-btn small" data-act="del-supp" data-id="${s.id}" aria-label="Delete ${h(s.name)}">×</button>
            <label class="toggle"><input type="checkbox" data-field="supp-food" data-id="${s.id}"${s.withFood ? ' checked' : ''}><span class="switch" aria-hidden="true"></span><span>Take with food</span></label>
          </div>`
        )
        .join('')}
      <form class="inline-form" data-form="supp-new">
        <input name="name" placeholder="e.g. Vitamin D3" aria-label="New supplement name" autocomplete="off" required>
        <input name="dose" placeholder="Dose" aria-label="Dose" class="narrow" autocomplete="off">
        <button class="btn vit">Add</button>
      </form>
    </section>
    <details class="card evidence">
      <summary>Tips &amp; sources</summary>
      <p><b>Vitamin D likes fat.</b> In a trial of 50 healthy older adults, a single vitamin D3 dose taken with a fat-containing meal produced a 32% higher peak blood level than the same dose with a fat-free meal.${cite('dawson')}</p>
      <p>In a small uncontrolled study (17 patients), moving vitamin D to the largest meal of the day was followed by an average ~50% rise in blood 25(OH)D over 2–3 months.${cite('mulligan')}</p>
      <p>That’s why JohnBF’s default vitamin reminder is with breakfast. Move it to whichever meal has some fat in it.</p>
      <p class="warn">Not medical advice. Ask a pharmacist or doctor about doses and interactions with any medicines you take.</p>
      ${refList(['dawson', 'mulligan'])}
    </details>`;
  }

  function calStatus() {
    if (!state.calHash) return 'Not added to Calendar yet.';
    const when = new Date(state.calAt).toLocaleDateString([], { month: 'short', day: 'numeric' });
    if (state.calHash !== calHash())
      return `<b class="alert">Changed since you added them (${when}).</b> Delete the old JohnBF events, then add again.`;
    return `In Calendar since ${when} ✓`;
  }

  function reminderGroup(kind) {
    const list = state.reminders.filter((r) => r.kind === kind).sort((a, b) => a.time.localeCompare(b.time));
    return `<section class="card">
      <div class="card-head"><h2><i class="dot ${KIND[kind].cls}"></i>${KIND[kind].name}</h2><button type="button" class="link" data-act="add-rem" data-kind="${kind}">+ Add</button></div>
      ${list.length ? '' : '<p class="muted small">No reminders.</p>'}
      ${list
        .map(
          (r) => `<div class="rem">
            <div class="rem-top">
              <input type="time" data-field="rem-time" data-id="${r.id}" value="${r.time}" aria-label="${KIND[kind].name} reminder time">
              <input data-field="rem-label" data-id="${r.id}" value="${h(r.label)}" placeholder="Label" aria-label="Label" autocomplete="off">
              <button type="button" class="icon-btn small" data-act="del-rem" data-id="${r.id}" aria-label="Delete ${h(r.label || KIND[kind].name)} reminder">×</button>
            </div>
            <div class="days" role="group" aria-label="Days">${DAY_ORDER.map((d) => {
              const on = r.days.includes(d);
              return `<button type="button" class="day ${KIND[kind].cls}${on ? ' on' : ''}" data-act="rem-day" data-id="${r.id}" data-day="${d}" aria-pressed="${on}" aria-label="${DOW_FULL[d]}">${DOW1[d]}</button>`;
            }).join('')}</div>
            <label class="follow"><span>Follow-up</span>
              <select data-field="rem-follow" data-id="${r.id}">${[0, 15, 30, 45, 60, 90, 120]
                .map((m) => `<option value="${m}"${r.followUp === m ? ' selected' : ''}>${m ? `${m} min later` : 'Off'}</option>`)
                .join('')}</select>
            </label>
            ${r.days.length ? '' : '<p class="muted small">No days picked, so this one is skipped.</p>'}
          </div>`
        )
        .join('')}
    </section>`;
  }

  function renderRemind() {
    const c = eventCount();
    return `
    <section class="hero">
      <p class="eyebrow">Reminders</p>
      <h1 class="display">Alerts</h1>
      <p class="sub">Delivered by your iPhone Calendar, so they ring even when JohnBF is closed.</p>
    </section>
    <section class="card cal-card">
      <ol class="steps">
        <li><b>Test it.</b> Tap <i>Send test alert</i>, add the event, and wait about 2 minutes for the notification.</li>
        <li><b>Add your schedule.</b> Tap <i>Add reminders to Calendar</i>, then <i>Add All</i>.</li>
        <li><b>Tip:</b> If iPhone asks which calendar, pick one used only for JohnBF (make it first in the Calendar app). Deleting that calendar later removes every JohnBF reminder at once.</li>
      </ol>
      <a class="cta" data-cal="all" data-act="cal-mark" href="${icsHref(calPayload())}"${calTarget}>Add reminders to Calendar</a>
      <a class="btn ghost wide" data-cal="test" href="${icsHref({ test: 1 })}"${calTarget}>Send test alert</a>
      <p class="muted small" id="cal-status">${calStatus()}</p>
      <p class="muted small">${c.main} repeating reminders${c.follow ? ` + ${c.follow} follow-ups` : ''}. Follow-ups ring even if you’ve already logged it, because Calendar can’t see the app.</p>
      <div class="row-links">
        <button type="button" class="link" data-act="cal-download">Download .ics file</button>
        <button type="button" class="link" data-act="cal-copy">Copy link for Safari</button>
      </div>
    </section>
    ${['protein', 'vitamins', 'workout'].map(reminderGroup).join('')}
    <details class="card evidence">
      <summary>Not getting alerts?</summary>
      <ul class="plain">
        <li>Check <b>Settings → Notifications → Calendar</b> and make sure notifications are allowed.</li>
        <li>Focus modes (Sleep, Work, Do Not Disturb) can silence Calendar alerts.</li>
        <li>If <i>Add reminders</i> does nothing in the Home Screen app, tap <i>Copy link for Safari</i>, paste it into Safari, and add from there.</li>
        <li>Changed your schedule? Calendar doesn’t update by itself. Delete the old JohnBF events (or the JohnBF calendar) and add them again.</li>
        <li><b>Why Calendar?</b> iPhone web apps can’t schedule their own notifications while closed, so Calendar does the ringing.</li>
      </ul>
    </details>`;
  }

  // ── Sheets ───────────────────────────────────────────────────────────────────
  const sheet = document.getElementById('sheet');
  function openSheet(html) {
    sheet.innerHTML = html;
    if (typeof sheet.showModal === 'function') sheet.showModal();
    else sheet.setAttribute('open', '');
  }
  function closeSheet() {
    if (typeof sheet.close === 'function') sheet.close();
    else sheet.removeAttribute('open');
  }
  sheet.addEventListener('click', (e) => {
    if (e.target === sheet) closeSheet();
  });

  function workoutSheet() {
    const first = WORKOUT_TYPES[0];
    return `<form class="sheet-body" data-form="workout">
      <div class="sheet-head"><h2 id="sheet-title">Log workout</h2><button type="button" class="icon-btn" data-act="close-sheet" aria-label="Close">×</button></div>
      <fieldset><legend>Type</legend>
        <div class="chips">${WORKOUT_TYPES.map(
          (t) => `<label class="chip-radio"><input type="radio" name="type" value="${t.id}"${t.id === first.id ? ' checked' : ''}><span>${t.label}</span></label>`
        ).join('')}</div>
      </fieldset>
      <fieldset><legend>Minutes</legend>
        <div class="min-row">
          <input name="min" inputmode="numeric" value="45" aria-label="Minutes" autocomplete="off">
          ${[15, 30, 45, 60, 90].map((m) => `<button type="button" class="chip ghost" data-act="wmin" data-min="${m}">${m}</button>`).join('')}
        </div>
      </fieldset>
      <fieldset><legend>Effort</legend>
        <div class="seg">${EFFORTS.map(
          (e) => `<label><input type="radio" name="effort" value="${e.id}"${e.id === first.effort ? ' checked' : ''}><span>${e.label}</span></label>`
        ).join('')}</div>
        <p class="muted small">Moderate: you can talk, but not sing. Vigorous: only a few words before pausing for breath.${cite('hhs')}</p>
      </fieldset>
      <label class="toggle"><input type="checkbox" name="strength"${first.strength ? ' checked' : ''}><span class="switch" aria-hidden="true"></span><span>Muscle-strengthening (counts toward ${STRENGTH_GOAL} days/week)</span></label>
      <label class="field"><span class="field-label">Date</span><input type="date" name="date" value="${todayKey()}" max="${todayKey()}"></label>
      <button class="cta move">Save workout</button>
    </form>`;
  }

  function settingsSheet() {
    return `<div class="sheet-body">
      <div class="sheet-head"><h2 id="sheet-title">Settings</h2><button type="button" class="icon-btn" data-act="close-sheet" aria-label="Close">×</button></div>
      <h3>Backup</h3>
      <p class="muted small">Everything lives only on this phone; there's no account and no server. Export a backup now and then (Save to Files works well).</p>
      <div class="btn-row">
        <button type="button" class="btn" data-act="export">Export backup</button>
        <button type="button" class="btn" data-act="import">Import backup</button>
      </div>
      <h3>Sources</h3>
      <p class="muted small">Every number in JohnBF comes from one of these. Each was checked against PubMed, the publisher or HHS.</p>
      ${refList(REF_ORDER)}
      <h3>About</h3>
      <p class="muted small">JohnBF is a habit tracker, not medical advice. Talk to a clinician about what’s right for you, especially if you have kidney disease or take medicines.</p>
      <button type="button" class="btn danger wide" data-act="reset">Erase all data</button>
    </div>`;
  }

  // ── Feedback ─────────────────────────────────────────────────────────────────
  const toastEl = document.getElementById('toast');
  let toastTimer = null;
  function toast(msg, hot) {
    toastEl.textContent = msg;
    toastEl.className = 'show' + (hot ? ' hot' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toastEl.className = ''), hot ? 3200 : 2200);
  }
  const celebrate = (msg) => toast(msg, true);

  // ── Actions ──────────────────────────────────────────────────────────────────
  function addProtein(g, name) {
    g = round1(Number(g));
    if (!(g > 0 && g <= 500)) return toast('Enter grams between 1 and 500');
    const k = todayKey();
    const t = proteinTarget();
    const before = proteinOn(k);
    dayW(k).protein.push({ id: uid(), g, name: String(name || '').trim().slice(0, 40), t: Date.now() });
    commit();
    const after = before + g;
    if (t && before < t && after >= t) celebrate(`Protein goal hit! 🔥 ${proteinStreak()}-day streak`);
    else toast(`+${fmtG(g)} g protein${t && after < t ? ` · ${fmtG(t - after)} g to go` : ''}`);
  }

  function toggleSupp(id) {
    const k = todayKey();
    const d = dayW(k);
    if (d.supps[id]) delete d.supps[id];
    else d.supps[id] = Date.now();
    d.suppGoal = state.supplements.length;
    const nowTaken = !!d.supps[id];
    commit();
    if (nowTaken && vitMet(k)) celebrate(`All vitamins taken! 🔥 ${vitStreak()}-day streak`);
  }

  const findRem = (id) => state.reminders.find((r) => r.id === id);
  const findSupp = (id) => state.supplements.find((s) => s.id === id);

  const ACTIONS = {
    'add-protein': (el) => addProtein(el.dataset.g),
    food: (el) => {
      const f = state.foods.find((x) => x.id === el.dataset.id);
      if (f) addProtein(f.g, f.name);
    },
    'del-food': (el) => {
      state.foods = state.foods.filter((x) => x.id !== el.dataset.id);
      commit();
    },
    'del-protein': (el) => {
      const d = dayW(todayKey());
      d.protein = d.protein.filter((x) => x.id !== el.dataset.id);
      commit();
    },
    supp: (el) => toggleSupp(el.dataset.id),
    'all-supps': () => {
      const k = todayKey();
      const d = dayW(k);
      for (const s of state.supplements) if (!d.supps[s.id]) d.supps[s.id] = Date.now();
      d.suppGoal = state.supplements.length;
      commit();
      celebrate(`All vitamins taken! 🔥 ${vitStreak()}-day streak`);
    },
    'del-supp': (el) => {
      const s = findSupp(el.dataset.id);
      if (!s || !confirm(`Remove ${s.name}?`)) return;
      state.supplements = state.supplements.filter((x) => x.id !== s.id);
      commit();
    },
    'open-workout': () => openSheet(workoutSheet()),
    'close-sheet': closeSheet,
    wmin: (el) => {
      el.form.elements.min.value = el.dataset.min;
    },
    'del-workout': (el) => {
      const d = state.days[el.dataset.day];
      if (!d) return;
      d.workouts = d.workouts.filter((w) => w.id !== el.dataset.id);
      commit();
    },
    unit: (el) => {
      const p = state.profile;
      const u = el.dataset.unit;
      if (u === p.unit) return;
      const w = parseFloat(p.weight);
      if (w > 0) p.weight = String(round1(u === 'kg' ? w * LB_TO_KG : w / LB_TO_KG));
      p.unit = u;
      commit();
    },
    goal: (el) => {
      state.profile.goal = el.dataset.goal;
      commit();
    },
    'rem-day': (el) => {
      const r = findRem(el.dataset.id);
      if (!r) return;
      const d = Number(el.dataset.day);
      r.days = r.days.includes(d) ? r.days.filter((x) => x !== d) : [...r.days, d].sort();
      commit();
    },
    'del-rem': (el) => {
      const r = findRem(el.dataset.id);
      if (!r || !confirm(`Delete the ${r.label || KIND[r.kind].name} reminder?`)) return;
      state.reminders = state.reminders.filter((x) => x.id !== r.id);
      commit();
    },
    'add-rem': (el) => {
      const kind = el.dataset.kind;
      state.reminders.push({
        id: uid(),
        kind,
        label: '',
        time: kind === 'workout' ? '18:00' : '12:00',
        days: kind === 'workout' ? [1, 3, 5] : [0, 1, 2, 3, 4, 5, 6],
        followUp: 30,
      });
      commit();
    },
    'cal-mark': markExported,
    'cal-download': () => {
      downloadIcs(calPayload());
      markExported();
    },
    'cal-copy': () => copyText(icsHref(calPayload()), 'Link copied. Paste it into Safari.'),
    'dismiss-install': () => {
      state.ui.installDismissed = true;
      commit();
    },
    tip: (el) => {
      const wasOn = el.classList.contains('show');
      view.querySelectorAll('.col.show').forEach((c) => c.classList.remove('show'));
      if (!wasOn) el.classList.add('show');
    },
    'open-settings': () => openSheet(settingsSheet()),
    export: exportBackup,
    import: () => document.getElementById('import-file').click(),
    reset: () => {
      if (!confirm('Erase all JohnBF data on this phone? This cannot be undone.')) return;
      state = defaults();
      commit();
      closeSheet();
      toast('All data erased');
    },
  };

  // Text fields save without re-rendering so the keyboard isn't dismissed mid-edit.
  const FIELDS = {
    weight: (el) => {
      state.profile.weight = cleanNum(el.value);
      commit();
    },
    custom: (el) => {
      state.profile.custom = cleanNum(el.value);
      commit();
    },
    'rem-time': (el) => {
      const r = findRem(el.dataset.id);
      if (r && /^\d\d:\d\d$/.test(el.value)) r.time = el.value;
      save();
      refreshCalLinks();
    },
    'rem-label': (el) => {
      const r = findRem(el.dataset.id);
      if (r) r.label = el.value.trim().slice(0, 40);
      save();
      refreshCalLinks();
    },
    'rem-follow': (el) => {
      const r = findRem(el.dataset.id);
      if (r) r.followUp = Number(el.value) || 0;
      commit();
    },
    'supp-name': (el) => {
      const s = findSupp(el.dataset.id);
      if (s && el.value.trim()) s.name = el.value.trim().slice(0, 40);
      save();
    },
    'supp-dose': (el) => {
      const s = findSupp(el.dataset.id);
      if (s) s.dose = el.value.trim().slice(0, 30);
      save();
    },
    'supp-food': (el) => {
      const s = findSupp(el.dataset.id);
      if (s) s.withFood = el.checked;
      commit();
    },
  };

  const FORMS = {
    'protein-custom': (form, fd) => addProtein(String(fd.get('g')).replace(',', '.'), fd.get('name')),
    'food-new': (form, fd) => {
      const name = String(fd.get('name') || '').trim().slice(0, 40);
      const g = round1(parseFloat(String(fd.get('g')).replace(',', '.')));
      if (!name || !(g > 0 && g <= 500)) return toast('Add a name and grams (1–500)');
      state.foods.push({ id: uid(), name, g });
      commit();
      toast(`Saved ${name}`);
    },
    'supp-new': (form, fd) => {
      const name = String(fd.get('name') || '').trim().slice(0, 40);
      if (!name) return;
      state.supplements.push({ id: uid(), name, dose: String(fd.get('dose') || '').trim().slice(0, 30), withFood: true });
      commit();
      toast(`Added ${name}`);
    },
    workout: (form, fd) => {
      const min = Math.round(Number(fd.get('min')));
      if (!(min > 0 && min <= 600)) return toast('Minutes must be 1–600');
      const date = String(fd.get('date') || todayKey());
      if (!/^\d{4}-\d\d-\d\d$/.test(date) || date > todayKey()) return toast('Pick a date up to today');
      const ws = weekStart(new Date());
      const before = weekStats(ws).eq;
      dayW(date).workouts.push({
        id: uid(),
        type: String(fd.get('type') || 'other'),
        min,
        effort: String(fd.get('effort') || 'moderate'),
        strength: fd.get('strength') === 'on',
        t: Date.now(),
      });
      closeSheet();
      commit();
      const after = weekStats(ws).eq;
      if (before < WEEKLY_GOAL && after >= WEEKLY_GOAL) celebrate(`Weekly ${WEEKLY_GOAL} minutes hit! 🔥`);
      else toast(`Logged ${min} min ${typeLabel(String(fd.get('type'))).toLowerCase()}`);
    },
  };

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (el && ACTIONS[el.dataset.act]) ACTIONS[el.dataset.act](el, e);
  });
  document.addEventListener('change', (e) => {
    const el = e.target;
    const f = el.dataset && el.dataset.field;
    if (f && FIELDS[f]) FIELDS[f](el);
    if (el.name === 'type' && el.form && el.form.dataset.form === 'workout') {
      const t = WORKOUT_TYPES.find((x) => x.id === el.value);
      if (t) {
        const eff = el.form.querySelector(`input[name="effort"][value="${t.effort}"]`);
        if (eff) eff.checked = true;
        el.form.elements.strength.checked = t.strength;
      }
    }
  });
  document.addEventListener('submit', (e) => {
    const form = e.target.closest('[data-form]');
    if (!form || !FORMS[form.dataset.form]) return;
    e.preventDefault();
    FORMS[form.dataset.form](form, new FormData(form));
  });

  // ── Backup ───────────────────────────────────────────────────────────────────
  async function exportBackup() {
    const name = `johnbf-backup-${todayKey()}.json`;
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    try {
      const file = new File([blob], name, { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'JohnBF backup' });
        return;
      }
    } catch (e) {
      if (e && e.name === 'AbortError') return;
    }
    downloadBlob(blob, name);
  }

  document.getElementById('import-file').addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!data || data.v !== 1 || typeof data.days !== 'object') throw new Error('Not a JohnBF backup');
      if (!confirm('Replace all JohnBF data on this phone with this backup?')) return;
      state = normalize(data);
      commit();
      closeSheet();
      toast('Backup restored');
    } catch (err) {
      toast('That file is not a JohnBF backup');
    }
  });

  // ── Router ───────────────────────────────────────────────────────────────────
  const view = document.getElementById('view');
  const ROUTES = { today: renderToday, protein: renderProtein, move: renderMove, vitamins: renderVitamins, remind: renderRemind };
  const currentRoute = () => {
    const r = location.hash.replace('#', '').split('/')[0];
    return ROUTES[r] ? r : 'today';
  };
  function render() {
    const r = currentRoute();
    view.innerHTML = ROUTES[r]();
    document.querySelectorAll('.tabbar a').forEach((a) => {
      const on = a.dataset.tab === r;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }
  window.addEventListener('hashchange', () => {
    render();
    window.scrollTo(0, 0);
  });
  // Re-render when the app comes back to the foreground (new day, new "next up").
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && !sheet.open) render();
  });

  render();

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();

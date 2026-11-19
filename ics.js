/*
 * VITA: iCalendar (.ics) builder.
 * Shared by app.js (page) and sw.js (service worker), so it must not touch the DOM.
 *
 * Design notes
 * - Times are "floating" (no TZ, no Z): 07:30 means 07:30 wherever the phone is,
 *   which is what a daily habit reminder should do across travel and DST.
 * - Each reminder gets an alert exactly at event start (TRIGGER:-PT0M), the most
 *   widely supported alarm form. The optional follow-up is a separate small event
 *   with its own at-start alert, rather than a post-start alarm, because
 *   positive alarm offsets aren't reliably documented for iOS Calendar.
 * - Voice: calm and kind.
 */
(function (root) {
  'use strict';

  const DAY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']; // index = JS getDay()
  const KINDS = {
    protein: { emoji: '🍳', name: 'Protein' },
    workout: { emoji: '🏃‍♀️', name: 'Movement' },
    vitamins: { emoji: '💊', name: 'Vitamins' },
  };
  const OPEN_APP = 'Log it in VITA whenever you’re ready.';

  const encoder = new TextEncoder();
  const pad = (n) => String(n).padStart(2, '0');
  const localStamp = (d) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const utcStamp = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const escText = (s) =>
    String(s == null ? '' : s)
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\r?\n/g, '\\n');

  // RFC 5545 §3.1: lines longer than 75 octets are folded with CRLF + space.
  function fold(line) {
    if (encoder.encode(line).length <= 75) return line;
    const parts = [];
    let cur = '';
    let len = 0;
    for (const ch of line) {
      const n = encoder.encode(ch).length;
      if (len + n > 75) {
        parts.push(cur);
        cur = ' ';
        len = 1;
      }
      cur += ch;
      len += n;
    }
    parts.push(cur);
    return parts.join('\r\n');
  }

  const midnight = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

  // First future moment at hh:mm on one of `days`; DTSTART must match the RRULE.
  function firstOccurrence(days, time, now) {
    const [h, m] = time.split(':').map(Number);
    for (let i = 0; i < 8; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, h, m, 0, 0);
      if (d > now && days.includes(d.getDay())) return d;
    }
    return null;
  }

  function rrule(days) {
    const uniq = [...new Set(days)].sort((a, b) => a - b);
    if (uniq.length === 7) return 'FREQ=DAILY';
    return 'FREQ=WEEKLY;BYDAY=' + uniq.map((d) => DAY[d]).join(',');
  }

  function vevent({ uid, stamp, start, minutes, rule, summary, description }) {
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + minutes);
    const lines = [
      'BEGIN:VEVENT',
      'UID:' + uid,
      'DTSTAMP:' + utcStamp(stamp),
      'DTSTART:' + localStamp(start),
      'DTEND:' + localStamp(end),
    ];
    if (rule) lines.push('RRULE:' + rule);
    lines.push(
      'SUMMARY:' + escText(summary),
      'DESCRIPTION:' + escText(description),
      'TRANSP:TRANSPARENT', // show as free, don't block the calendar
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'DESCRIPTION:' + escText(summary),
      'TRIGGER:-PT0M',
      'END:VALARM',
      'END:VEVENT'
    );
    return lines;
  }

  function header() {
    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//VITA//Habit Reminders 2.0//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:VITA',
    ];
  }

  const finish = (lines) => lines.map(fold).join('\r\n') + '\r\n';

  function copyFor(r, cfg) {
    const k = KINDS[r.k];
    const label = r.l ? ` · ${r.l}` : '';
    const name = cfg.n ? `, ${cfg.n}` : '';
    if (r.k === 'protein') {
      const grams = cfg.pm ? ` (~${cfg.pm} g)` : '';
      const body = cfg.pm
        ? `A little protein would feel good right now${name}: about ${cfg.pm} g${cfg.pt ? `, toward ${cfg.pt} g today` : ''}.`
        : `A little protein would feel good right now${name}.`;
      return { summary: `${k.emoji} Protein${label}${grams}`, body };
    }
    if (r.k === 'vitamins') {
      const list = (cfg.s || []).filter(Boolean).join('; ');
      return {
        summary: `${k.emoji} Vitamins${label}`,
        body: `${list ? `Time for: ${list}.` : 'Time for your vitamins.'} Taking care of you, one small step at a time.`,
      };
    }
    return {
      summary: `${k.emoji} Movement${label}`,
      body: `Whenever you’re ready${name}. Some movement is better than none, so even a short session counts.`,
    };
  }

  /**
   * cfg = {
   *   n:  name shown in reminders (optional),
   *   r:  [{ i:id, k:'protein'|'workout'|'vitamins', l:label, t:'HH:MM', d:[0-6], f:followUpMinutes }],
   *   pm: grams per protein reminder (or null), pt: daily protein target (or null),
   *   s:  ['Vitamin D3 (2000 IU) with food', ...]
   * }
   */
  function buildCalendar(cfg, now) {
    now = now || new Date();
    const lines = header();
    for (const r of cfg.r || []) {
      const kind = KINDS[r.k];
      if (!kind || !Array.isArray(r.d) || !r.d.length || !/^\d\d:\d\d$/.test(r.t || '')) continue;
      const start = firstOccurrence(r.d, r.t, now);
      if (!start) continue;
      const c = copyFor(r, cfg);
      lines.push(
        ...vevent({
          uid: `${r.i}@vita`,
          stamp: now,
          start,
          minutes: 15,
          rule: rrule(r.d),
          summary: c.summary,
          description: `${c.body}\n\n${OPEN_APP}`,
        })
      );
      const f = Number(r.f) || 0;
      if (f > 0) {
        const fu = new Date(start);
        fu.setMinutes(fu.getMinutes() + f);
        const shift = Math.round((midnight(fu) - midnight(start)) / 86400000);
        const days = r.d.map((d) => (((d + shift) % 7) + 7) % 7);
        lines.push(
          ...vevent({
            uid: `${r.i}-followup@vita`,
            stamp: now,
            start: fu,
            minutes: 5,
            rule: rrule(days),
            summary: `🌸 Gentle check-in · ${r.l || kind.name}`,
            description:
              'Already done? Lovely, ignore this one. If not, there’s still time.\n\n(Calendar can’t see what you’ve logged in VITA.)',
          })
        );
      }
    }
    lines.push('END:VCALENDAR');
    return finish(lines);
  }

  // One-off event ~2 minutes from now, to prove alerts reach this phone.
  function buildTest(now) {
    now = now || new Date();
    const start = new Date(now);
    start.setSeconds(0, 0);
    start.setMinutes(start.getMinutes() + 2);
    const lines = header();
    lines.push(
      ...vevent({
        uid: `test-${now.getTime()}@vita`,
        stamp: now,
        start,
        minutes: 5,
        rule: null,
        summary: '✅ VITA test: alerts work',
        description: 'If this popped up as a notification, your VITA reminders will too. You can delete this event.',
      })
    );
    lines.push('END:VCALENDAR');
    return finish(lines);
  }

  // URL-safe base64 of UTF-8 JSON, so the whole schedule travels inside a link.
  function encode(obj) {
    const bytes = encoder.encode(JSON.stringify(obj));
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function decode(str) {
    let s = String(str || '').replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    const bin = atob(s);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return JSON.parse(new TextDecoder().decode(bytes));
  }

  // Build whichever file a payload asks for.
  function build(payload, now) {
    return payload && payload.test ? buildTest(now) : buildCalendar(payload || {}, now);
  }

  root.VitaICS = { build, buildCalendar, buildTest, encode, decode, KINDS, DAY };
})(typeof self !== 'undefined' ? self : this);

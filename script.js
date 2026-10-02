/* =========================================================
   আইডি কার্ড মেকার — ID Card Maker
   Pure HTML/CSS/JS. Data lives in the browser (IndexedDB).
   ========================================================= */
'use strict';

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------- helpers ---------- */
const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
const toBnNum = s => String(s ?? '').replace(/[0-9]/g, d => BN_DIGITS[d]);
const toEnNum = s => String(s ?? '').replace(/[০-৯]/g, d => BN_DIGITS.indexOf(d));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const clone = o => JSON.parse(JSON.stringify(o));
const chunk = (arr, n) => { const out = []; for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n)); return out; };
const MM = 96 / 25.4;                      // CSS px per mm
const UNIT_PX = { px: 1, pt: 96 / 72, mm: MM };
const PAPERS = { A4: [210, 297], Letter: [215.9, 279.4], Legal: [215.9, 355.6] };
const MONTHS = {
  bn: ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
};

const PLACEHOLDER = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120"><rect width="100" height="120" fill="#dfe3ea"/><circle cx="50" cy="46" r="20" fill="#b4bccb"/><path d="M10 120c4-27 21-40 40-40s36 13 40 40z" fill="#b4bccb"/></svg>');
const DEFAULT_LOGO = 'assets/logo.png';

/* ---------- defaults ---------- */
const DEFAULT_SETTINGS = {
  lang: 'bn',
  college: { bn: 'শিরযুগ আজিমুন্নেছা গার্লস স্কুল এন্ড কলেজ', en: 'Shirjug Azimunnesa Girls School & College' },
  address: { bn: 'শেখেরহাট, ঝালকাঠি', en: 'Shekherhat, Jhalokathi' },
  title: { bn: 'পরিচয় পত্র', en: 'ID Card' },
  principal: { bn: 'অধ্যক্ষ', en: 'Principal' },
  validLabel: { bn: 'মেয়াদ', en: 'Valid Till' },
  mobileLabel: { bn: 'মোবাইল', en: 'Mobile' },
  mobile: '01716 855 296',
  validDate: '2027-02-28',
  sigRemoveWhite: true,
  fields: [
    { key: 'name',    bn: 'শিক্ষার্থীর নাম', en: "Student's Name", show: true },
    { key: 'father',  bn: 'পিতার নাম',       en: "Father's Name",  show: true },
    { key: 'mother',  bn: 'মাতার নাম',       en: "Mother's Name",  show: true },
    { key: 'class',   bn: 'শ্রেণী',           en: 'Class',          show: true },
    { key: 'group',   bn: 'বিভাগ',           en: 'Group',          show: true },
    { key: 'roll',    bn: 'রোল নং',          en: 'Roll No.',       show: true },
    { key: 'session', bn: 'শিক্ষাবর্ষ',        en: 'Session',        show: true }
  ],
  defaults: { class: 'দ্বাদশ', group: '', session: '২০২৫-২০২৬' },
  design: {
    primary: '#1565c0', cardBg: '#fffdf7', cc: '#141414', text: '#1a1a1a', fieldBgColor: '#e9e9ee',
    borderColor: '#8b1c1c', borderWidth: 2.5, radius: 2,
    font: 'Hind Siliguri', collegeSize: 6.6, fieldSize: 5.6,
    bgDeco: true, watermark: false, showTitle: true, showBar: true, fieldBg: true
  },
  photo: { shape: 'rect', frame: 'solid', color: '#6b2fa0', width: 2 },
  card: { w: 146, h: 237, unit: 'px' },
  print: { paper: 'A4', perPage: 9, gap: 4, margin: 8, cutMarks: true, vcenter: false, which: 'all' }
};

const STUDENT_FORM = [
  { key: 'name',    label: 'শিক্ষার্থীর নাম', full: true },
  { key: 'father',  label: 'পিতার নাম' },
  { key: 'mother',  label: 'মাতার নাম' },
  { key: 'class',   label: 'শ্রেণী' },
  { key: 'group',   label: 'বিভাগ' },
  { key: 'roll',    label: 'রোল নং', mode: 'numeric' },
  { key: 'session', label: 'শিক্ষাবর্ষ' },
  { key: 'id',      label: 'আইডি নং (ছবির কোণে, ঐচ্ছিক)', full: true }
];

const ALIASES = {
  name:    ['name', 'student', 'studentname', 'student_name', 'student name', 'নাম', 'শিক্ষার্থীর নাম', 'ছাত্রীর নাম', 'ছাত্রের নাম'],
  father:  ['father', 'fathername', 'father_name', "father's name", 'পিতা', 'পিতার নাম', 'বাবার নাম'],
  mother:  ['mother', 'mothername', 'mother_name', "mother's name", 'মাতা', 'মাতার নাম', 'মায়ের নাম'],
  class:   ['class', 'classname', 'class_name', 'শ্রেণী', 'শ্রেণি'],
  group:   ['group', 'department', 'dept', 'section', 'বিভাগ', 'শাখা'],
  roll:    ['roll', 'rollno', 'roll_no', 'roll no', 'roll no.', 'রোল', 'রোল নং', 'রোল নম্বর'],
  session: ['session', 'year', 'academic_year', 'শিক্ষাবর্ষ', 'সেশন'],
  id:      ['id', 'idno', 'id_no', 'studentid', 'student_id', 'আইডি', 'আইডি নং']
};

const DEMO = {
  bn: { name: 'সাদিয়া ইসলাম', father: 'মোঃ রফিকুল ইসলাম', mother: 'মোসাঃ রাশিদা বেগম', group: 'মানবিক', roll: '220', id: '59313' },
  en: { name: 'Sadia Islam', father: 'Md. Rafiqul Islam', mother: 'Mst. Rashida Begum', class: 'XII', group: 'Humanities', roll: '220', session: '2025-2026', id: '59313' }
};

/* ---------- state ---------- */
let S = clone(DEFAULT_SETTINGS);
let A = { logo: null, signature: null, background: null };
let STU = [];
let cur = null;
const ui = { pmode: 'card', zoom: null, search: '', tab: 'students' };

/* ---------- storage (IndexedDB, falls back to localStorage) ---------- */
const Store = {
  db: null,
  async open() {
    try {
      this.db = await new Promise((res, rej) => {
        const r = indexedDB.open('idcard-maker', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('kv');
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      });
    } catch (e) { this.db = null; }
  },
  get(k) {
    if (!this.db) { try { return Promise.resolve(JSON.parse(localStorage.getItem('idc_' + k))); } catch (e) { return Promise.resolve(null); } }
    return new Promise(res => {
      const q = this.db.transaction('kv').objectStore('kv').get(k);
      q.onsuccess = () => res(q.result ?? null);
      q.onerror = () => res(null);
    });
  },
  set(k, v) {
    if (!this.db) {
      try { localStorage.setItem('idc_' + k, JSON.stringify(v)); } catch (e) { toast('ব্রাউজারের জায়গা শেষ, ব্যাকআপ নিয়ে কিছু ছবি মুছুন'); }
      return Promise.resolve();
    }
    return new Promise(res => {
      const tx = this.db.transaction('kv', 'readwrite');
      tx.objectStore('kv').put(v, k);
      tx.oncomplete = () => res();
      tx.onerror = () => { toast('সংরক্ষণ হয়নি: ব্রাউজারের জায়গা কম'); res(); };
    });
  },
  clear() {
    if (!this.db) { ['settings', 'assets', 'students'].forEach(k => localStorage.removeItem('idc_' + k)); return Promise.resolve(); }
    return new Promise(res => { const tx = this.db.transaction('kv', 'readwrite'); tx.objectStore('kv').clear(); tx.oncomplete = () => res(); });
  }
};

const dirty = new Set();
let saveTimer;
function save(...keys) {
  keys.forEach(k => dirty.add(k));
  setStatus(true);
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flush, 450);
}
async function flush() {
  const keys = [...dirty]; dirty.clear();
  for (const k of keys) {
    const v = k === 'settings' ? S : k === 'assets' ? A : { list: STU, cur };
    await Store.set(k, v);
  }
  setStatus(false);
}
function setStatus(saving) {
  const el = $('#saveStatus');
  el.textContent = saving ? 'সংরক্ষণ হচ্ছে…' : 'সংরক্ষিত';
  el.classList.toggle('saving', saving);
}
document.addEventListener('visibilitychange', () => { if (document.hidden && dirty.size) flush(); });
window.addEventListener('beforeunload', () => { if (dirty.size) flush(); });

function mergeDeep(def, obj) {
  if (!obj || typeof obj !== 'object') return clone(def);
  const out = Array.isArray(def) ? [] : {};
  for (const k of Object.keys(def)) {
    const d = def[k], o = obj[k];
    if (d && typeof d === 'object' && !Array.isArray(d)) out[k] = mergeDeep(d, o);
    else out[k] = o === undefined ? clone(d) : o;
  }
  return out;
}
function mergeSettings(saved) {
  const s = mergeDeep(DEFAULT_SETTINGS, saved || {});
  // fields: keep user labels, but always have every known key
  const savedFields = Array.isArray(saved?.fields) ? saved.fields : [];
  s.fields = DEFAULT_SETTINGS.fields.map(df => ({ ...df, ...(savedFields.find(f => f.key === df.key) || {}) }));
  if (savedFields.length) s.fields.sort((a, b) => savedFields.findIndex(f => f.key === a.key) - savedFields.findIndex(f => f.key === b.key));
  return s;
}

/* ---------- images ---------- */
function readImage(file, { max = 600, type = 'image/jpeg', q = 0.88, removeWhite = false } = {}) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onerror = () => rej(fr.error);
    fr.onload = () => {
      const img = new Image();
      img.onerror = () => rej(new Error('ছবিটি পড়া যায়নি'));
      img.onload = () => {
        let w = img.naturalWidth || 400, h = img.naturalHeight || 400;
        const r = Math.min(1, max / Math.max(w, h));
        w = Math.round(w * r); h = Math.round(h * r);
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        const x = c.getContext('2d');
        if (type === 'image/jpeg') { x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); }
        x.drawImage(img, 0, 0, w, h);
        if (removeWhite) {
          const d = x.getImageData(0, 0, w, h), p = d.data;
          for (let i = 0; i < p.length; i += 4) {
            const m = (p[i] + p[i + 1] + p[i + 2]) / 3;
            if (m > 215) p[i + 3] = 0;
            else if (m > 165) p[i + 3] = Math.round(p[i + 3] * (215 - m) / 50);
          }
          x.putImageData(d, 0, 0);
        }
        res(c.toDataURL(type, q));
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}
const PHOTO_OPT = { max: 520, type: 'image/jpeg', q: 0.86 };
function assetOpt(name, file) {
  if (name === 'logo') return { max: 700, type: 'image/png' };
  if (name === 'signature') return { max: 700, type: 'image/png', removeWhite: !!S.sigRemoveWhite };
  return { max: 1500, type: file.type === 'image/png' ? 'image/png' : 'image/jpeg', q: 0.9 };
}

/* ---------- formatting ---------- */
function num(v, L) { return L === 'bn' ? toBnNum(v) : toEnNum(v); }
function fmtDate(iso, L) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return num(iso, L);
  const s = `${MONTHS[L][m - 1]} ${d}, ${y}`;
  return L === 'bn' ? toBnNum(s) : s;
}
function fieldValue(st, key) {
  const v = st && st[key] != null && String(st[key]).trim() !== '' ? st[key] : '';
  return v !== '' ? v : (S.defaults[key] || '');
}
function cardPx() {
  const f = UNIT_PX[S.card.unit] || 1;
  return { w: Math.max(20, +S.card.w || 146) * f, h: Math.max(20, +S.card.h || 237) * f };
}
function demoStudent() { return { ...DEMO[S.lang], photo: '' }; }

/* ---------- card renderer ---------- */
function renderCard(st, scale = 1) {
  const L = S.lang, D = S.design, P = S.photo;
  const { w, h } = cardPx();
  const k = (w / 146) * scale;
  const colon = ':';
  const logo = A.logo || DEFAULT_LOGO;

  const vars = [
    `--k:${k}`, `width:${w * scale}px`, `height:${h * scale}px`,
    `--primary:${D.primary}`, `--text:${D.text}`, `--cc:${D.cc}`,
    `--fbg:${D.fieldBg ? D.fieldBgColor : 'transparent'}`,
    `--bc:${D.borderColor}`, `--bw:${+D.borderWidth || 0}`, `--br:${+D.radius || 0}`,
    `--fw:${P.frame === 'none' ? 0 : (+P.width || 0)}`, `--fc:${P.color}`,
    `--cs:${+D.collegeSize || 6.6}`, `--fs:${+D.fieldSize || 5.6}`,
    `--cfont:'${D.font}','Hind Siliguri',sans-serif`,
    `background-color:${D.cardBg}`,
    A.background ? `background-image:url("${A.background}")` : ''
  ].join(';');

  const rows = S.fields.filter(f => f.show).map(f =>
    `<div class="c-row"><span class="c-lab" data-fit>${esc(f[L])}</span><span class="c-colon">${colon}</span><span class="c-val" data-fit>${esc(num(fieldValue(st, f.key), L)) || '&nbsp;'}</span></div>`
  ).join('');

  const photoSrc = st?.photo || PLACEHOLDER;
  const photo = `<div class="c-photo-wrap shp-${P.shape} fr-${P.frame}">
      <div class="c-photo"><div class="c-photo-in"><img src="${photoSrc}" alt=""></div></div>
      ${st?.id ? `<span class="c-idno">${esc(num(st.id, L))}</span>` : ''}
    </div>`;

  const mobileText = S.mobile ? `${esc(S.mobileLabel[L])}${colon} ${esc(num(S.mobile, L))}` : '&nbsp;';

  return `<div class="idcard lang-${L}" style="${vars}">
    ${D.bgDeco ? '<div class="c-deco c-deco-top"></div><div class="c-deco c-deco-bot"></div>' : ''}
    ${D.watermark ? `<img class="c-water" src="${logo}" alt="" onerror="this.remove()">` : ''}
    <div class="c-head">
      ${D.showTitle ? `<div class="c-title">${esc(S.title[L])}</div>` : ''}
      <div class="c-college" data-fit>${esc(S.college[L])}</div>
      <div class="c-address" data-fit>${esc(S.address[L])}</div>
    </div>
    <div class="c-mid">
      <div class="c-logo"><img src="${logo}" alt="" onerror="this.remove()"></div>
      ${photo}
    </div>
    <div class="c-fields">${rows}</div>
    <div class="c-foot">
      <div class="c-valid" data-fit>${esc(S.validLabel[L])} ${colon} ${esc(fmtDate(S.validDate, L))}</div>
      <div class="c-sign">${A.signature ? `<img src="${A.signature}" alt="">` : '<div class="c-sign-space"></div>'}<span data-fit>${esc(S.principal[L])}</span></div>
    </div>
    ${D.showBar ? `<div class="c-bar">${mobileText}</div>` : ''}
  </div>`;
}

/* shrink text that overflows its box */
function autoFit(root) {
  $$('[data-fit]', root).forEach(el => {
    el.style.fontSize = '';
    if (el.scrollWidth <= el.clientWidth + 0.5) return;
    let fs = parseFloat(getComputedStyle(el).fontSize);
    const min = fs * 0.5;
    let i = 0;
    while (el.scrollWidth > el.clientWidth + 0.5 && fs > min && i++ < 40) {
      fs *= 0.95;
      el.style.fontSize = fs + 'px';
    }
  });
}

/* ---------- print layout ---------- */
function layout() {
  const [pw, ph] = PAPERS[S.print.paper] || PAPERS.A4;
  const { w, h } = cardPx();
  const cw = w / MM, ch = h / MM;
  const g = Math.max(0, +S.print.gap || 0), m = Math.max(0, +S.print.margin || 0);
  const colsMax = Math.max(0, Math.floor((pw - 2 * m + g) / (cw + g) + 1e-6));
  const rowsMax = Math.max(0, Math.floor((ph - 2 * m + g) / (ch + g) + 1e-6));
  const cap = colsMax * rowsMax;
  const want = Math.max(1, Math.round(+S.print.perPage || 1));
  const per = Math.max(1, Math.min(want, cap || 1));
  // pick the most square-looking grid that still fits (e.g. 9 -> 3 x 3)
  let cols = Math.max(1, Math.min(colsMax || 1, per));
  for (let c = Math.ceil(Math.sqrt(per)); c <= colsMax; c++) {
    if (Math.ceil(per / c) <= rowsMax) { cols = c; break; }
  }
  const rows = Math.ceil(per / cols);
  return { pw, ph, cw, ch, g, m, colsMax, rowsMax, cap, want, per, cols, rows };
}
function sheetHTML(cards, Lo) {
  const { w, h } = cardPx();
  return `<div class="sheet ${S.print.cutMarks ? 'cut' : ''} ${S.print.vcenter ? 'vc' : ''}" style="width:${Lo.pw}mm;height:${Lo.ph}mm;padding:${Lo.m}mm">
    <div class="sheet-grid" style="grid-template-columns:repeat(${Lo.cols},${w}px);grid-auto-rows:${h}px;gap:${Lo.g}mm">
      ${cards.map(st => `<div class="slot" style="outline-offset:${Lo.g / 2}mm">${renderCard(st, 1)}</div>`).join('')}
    </div></div>`;
}
function getPrintList() {
  if (S.print.which === 'selected') return STU.filter(s => s.sel);
  if (S.print.which === 'current') return STU.filter(s => s.uid === cur);
  return STU.slice();
}

/* ---------- preview ---------- */
let rafId = 0;
function schedulePreview() {
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(renderPreview);
}
function renderPreview() {
  const cs = $('#cardStage'), ss = $('#sheetStage');
  cs.hidden = ui.pmode !== 'card';
  ss.hidden = ui.pmode !== 'sheet';
  $('#zoomWrap').style.visibility = ui.pmode === 'card' ? 'visible' : 'hidden';
  if (ui.pmode === 'card') {
    const st = getCur();
    cs.innerHTML = renderCard(st || demoStudent(), ui.zoom || 2) +
      (st ? '' : '<p class="demo-note">নমুনা কার্ড। শিক্ষার্থী যোগ করলে তার তথ্য দেখাবে।</p>');
    autoFit(cs);
  } else {
    renderSheetPreview();
  }
  updateNav();
}
function renderSheetPreview() {
  const ss = $('#sheetStage');
  const Lo = layout();
  let list = getPrintList(), demo = false;
  if (!list.length) { list = Array(Lo.per).fill(demoStudent()); demo = true; }
  const pages = chunk(list, Lo.per);
  const shown = pages.slice(0, 3);
  const pwPx = Lo.pw * MM, phPx = Lo.ph * MM;
  const avail = Math.max(220, $('#previewBody').clientWidth - 48);
  const s = Math.min(1, avail / pwPx);
  ss.innerHTML =
    (demo ? '<p class="sheet-note">প্রিন্টের তালিকা খালি, তাই নমুনা দিয়ে লেআউট দেখানো হচ্ছে</p>' : '') +
    shown.map((p, i) => `<p class="sheet-label">পৃষ্ঠা ${toBnNum(i + 1)} / ${toBnNum(pages.length)}</p>
      <div class="sheet-wrap" style="width:${pwPx * s}px;height:${phPx * s}px">
        <div style="width:${pwPx}px;transform:scale(${s});transform-origin:0 0">${sheetHTML(p, Lo)}</div>
      </div>`).join('') +
    (pages.length > 3 ? `<p class="sheet-note">আরও ${toBnNum(pages.length - 3)}টি পৃষ্ঠা প্রিন্টে থাকবে</p>` : '');
  autoFit(ss);
}
function updateNav() {
  const i = STU.findIndex(s => s.uid === cur);
  const st = STU[i];
  $('#navInfo').textContent = st ? `${toBnNum(i + 1)} / ${toBnNum(STU.length)} · ${st.name || 'নাম নেই'}` : 'কোনো শিক্ষার্থী নেই';
}
function fitZoom() {
  const body = $('#previewBody');
  const { w, h } = cardPx();
  const availW = body.clientWidth - 64, availH = body.clientHeight - 90;
  if (availW <= 0 || availH <= 0) return 2;
  return Math.max(0.6, Math.min(3.5, Math.min(availW / w, availH / h)));
}

/* ---------- students ---------- */
const getCur = () => STU.find(s => s.uid === cur) || null;
function newStudent(data = {}) {
  return { uid: uid(), name: '', father: '', mother: '', class: '', group: '', roll: '', session: '', id: '', photo: '', sel: true, ...data };
}
function renderList() {
  $('#stuCount').textContent = toBnNum(STU.length);
  const q = ui.search.trim().toLowerCase(), qn = toEnNum(q);
  const items = STU.filter(s => !q || (s.name || '').toLowerCase().includes(q) || toEnNum(s.roll || '').includes(qn) || toEnNum(s.id || '').includes(qn));
  const list = $('#stuList');
  if (!STU.length) {
    list.innerHTML = '<li class="empty">এখনও কোনো শিক্ষার্থী যোগ করা হয়নি।<br>“নতুন শিক্ষার্থী” বা “JSON থেকে যোগ” চাপুন।</li>';
  } else if (!items.length) {
    list.innerHTML = '<li class="empty">এই নাম বা রোলে কাউকে পাওয়া যায়নি</li>';
  } else {
    list.innerHTML = items.map(s => `<li class="stu ${s.uid === cur ? 'active' : ''}" data-uid="${s.uid}">
      <input type="checkbox" class="sel" ${s.sel ? 'checked' : ''} title="প্রিন্টের জন্য নির্বাচন" aria-label="প্রিন্টের জন্য নির্বাচন">
      <img class="thumb" src="${s.photo || PLACEHOLDER}" alt="">
      <div class="meta"><b>${esc(s.name || 'নাম লেখা হয়নি')}</b><small>রোল ${esc(toBnNum(s.roll) || '—')}${s.photo ? '' : ' <span class="warn">· ছবি নেই</span>'}</small></div>
      <button type="button" class="del" title="মুছুন" aria-label="মুছুন">✕</button>
    </li>`).join('');
  }
  $('#selectAll').checked = STU.length > 0 && STU.every(s => s.sel);
  updatePrintCount();
}
function buildStudentForm() {
  $('#stuFields').innerHTML = STUDENT_FORM.map(f =>
    `<label class="fld ${f.full ? 'full' : ''}"><span>${f.label}</span><input type="text" data-sfield="${f.key}" ${f.mode ? `inputmode="${f.mode}"` : ''} autocomplete="off"></label>`
  ).join('');
}
function renderEditor() {
  const s = getCur();
  $('#stuEditor').classList.toggle('disabled', !s);
  $$('[data-sfield]').forEach(inp => {
    const k = inp.dataset.sfield;
    inp.value = s ? (s[k] ?? '') : '';
    inp.disabled = !s;
    inp.placeholder = S.defaults[k] ? `ফাঁকা রাখলে: ${S.defaults[k]}` : '';
  });
  $('#stuPhotoThumb').src = s?.photo || PLACEHOLDER;
}
function selectStudent(id) {
  cur = id;
  save('students');
  renderList(); renderEditor(); schedulePreview();
}
function step(dir) {
  if (!STU.length) return;
  let i = STU.findIndex(s => s.uid === cur);
  i = (i + dir + STU.length) % STU.length;
  selectStudent(STU[i].uid);
}

function normalizeStudent(o) {
  const s = newStudent();
  const keys = Object.keys(o || {});
  for (const [field, al] of Object.entries(ALIASES)) {
    const found = keys.find(x => al.includes(String(x).toLowerCase().trim()));
    if (found != null && o[found] != null) s[field] = String(o[found]).trim();
  }
  if (typeof o.photo === 'string' && /^(data:image|https?:)/.test(o.photo)) s.photo = o.photo;
  return s;
}

/* ---------- settings binding ---------- */
const getPath = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
function setPath(o, p, v) {
  const ks = p.split('.'); let t = o;
  for (let i = 0; i < ks.length - 1; i++) t = t[ks[i]];
  t[ks[ks.length - 1]] = v;
}
function populate() {
  $$('[data-bind]').forEach(el => {
    const v = getPath(S, el.dataset.bind);
    if (el.type === 'checkbox') el.checked = !!v;
    else if (el.type === 'radio') el.checked = el.value === String(v);
    else el.value = v ?? '';
  });
  updateOutputs();
}
function updateOutputs() {
  $$('output[data-for]').forEach(o => { o.textContent = getPath(S, o.dataset.for); });
  const { w, h } = cardPx();
  $('#sizeInfo').textContent = `প্রিন্টে মাপ হবে ${(w / MM).toFixed(1)} × ${(h / MM).toFixed(1)} মিমি (${(w / MM / 10).toFixed(2)} × ${(h / MM / 10).toFixed(2)} সেমি)। সাধারণ আইডি কার্ড 54 × 86 মিমি, এর কাছাকাছি চাইলে একক “pt” দিন।`;
}
function updateCapacity() {
  const Lo = layout(), el = $('#capInfo');
  const n = getPrintList().length;
  if (!Lo.cap) {
    el.className = 'cap-info bad';
    el.textContent = 'এই মাপের কার্ড কাগজে আঁটছে না। মার্জিন বা কার্ডের মাপ কমান।';
    return;
  }
  const over = Lo.want > Lo.cap;
  el.className = 'cap-info' + (over ? ' bad' : '');
  el.textContent =
    `কার্ড ${Lo.cw.toFixed(1)} × ${Lo.ch.toFixed(1)} মিমি। এই কাগজে সর্বোচ্চ ${toBnNum(Lo.cap)}টি (${toBnNum(Lo.colsMax)} কলাম × ${toBnNum(Lo.rowsMax)} সারি) আঁটে। ` +
    (over ? `আপনি ${toBnNum(Lo.want)}টি চেয়েছেন, তাই প্রতি পেজে ${toBnNum(Lo.per)}টি বসবে।` : `প্রতি পেজে ${toBnNum(Lo.per)}টি বসবে (${toBnNum(Lo.cols)} × ${toBnNum(Lo.rows)})।`) +
    (n ? ` মোট ${toBnNum(n)}টি কার্ড → ${toBnNum(Math.ceil(n / Lo.per))} পৃষ্ঠা।` : '');
}
function updatePrintCount() {
  const n = getPrintList().length;
  $('#printCount').textContent = n ? `${toBnNum(n)}টি কার্ড প্রিন্ট হবে` : 'এই অপশনে প্রিন্ট করার মতো কোনো কার্ড নেই';
  updateCapacity();
}
function buildFieldEditor() {
  $('#fieldEditor').innerHTML = S.fields.map((f, i) => `<div class="fe-row">
    <label class="chk" title="কার্ডে দেখাবে"><input type="checkbox" data-bind="fields.${i}.show" aria-label="${esc(f.bn)} দেখাবে"></label>
    <input type="text" data-bind="fields.${i}.bn" placeholder="বাংলা লেবেল">
    <input type="text" data-bind="fields.${i}.en" placeholder="English label">
  </div>`).join('');
}
function renderAssets() {
  $$('[data-asset-thumb]').forEach(img => {
    const k = img.dataset.assetThumb;
    const src = A[k] || (k === 'logo' ? DEFAULT_LOGO : '');
    img.style.visibility = src ? 'visible' : 'hidden';
    if (src) img.src = src; else img.removeAttribute('src');
  });
}

/* ---------- UI helpers ---------- */
let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}
function setTheme(t) {
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem('idc_theme', t); } catch (e) {}
  $('#themeBtn').textContent = t === 'dark' ? '☀' : '☾';
}
function setTab(tab) {
  ui.tab = tab;
  $$('.tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  $$('.panel').forEach(p => { p.hidden = p.dataset.panel !== tab; });
  setPMode(tab === 'print' ? 'sheet' : 'card');
}
function setPMode(m) {
  ui.pmode = m;
  $$('[data-pmode]').forEach(b => b.classList.toggle('active', b.dataset.pmode === m));
  schedulePreview();
}
function download(name, text) {
  const blob = new Blob([text], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
function waitImages(root) {
  return Promise.all($$('img', root).map(img => img.complete ? Promise.resolve() : new Promise(r => { img.onload = img.onerror = r; })));
}

/* ---------- print ---------- */
async function doPrint() {
  const list = getPrintList();
  if (!list.length) { toast('প্রিন্ট করার মতো কোনো শিক্ষার্থী নেই'); return; }
  const Lo = layout();
  if (!Lo.cap) { toast('কার্ডের মাপ কাগজে আঁটছে না'); return; }
  if (dirty.size) await flush();
  $('#pageStyle').textContent = `@page{size:${Lo.pw}mm ${Lo.ph}mm;margin:0}`;
  const area = $('#printArea');
  area.innerHTML = chunk(list, Lo.per).map(p => sheetHTML(p, Lo)).join('');
  toast('প্রিন্ট প্রস্তুত হচ্ছে…');
  await waitImages(area);
  try { await document.fonts.ready; } catch (e) {}
  autoFit(area);
  setTimeout(() => window.print(), 60);
}
window.addEventListener('afterprint', () => { $('#printArea').innerHTML = ''; });

/* ---------- events ---------- */
function bindEvents() {
  // settings inputs (generic)
  document.addEventListener('input', e => {
    const el = e.target.closest('[data-bind]');
    if (!el) return;
    let v;
    if (el.type === 'checkbox') v = el.checked;
    else if (el.type === 'radio') { if (!el.checked) return; v = el.value; }
    else if (el.type === 'number' || el.type === 'range') { if (el.value === '') return; v = parseFloat(el.value); if (isNaN(v)) return; }
    else v = el.value;
    setPath(S, el.dataset.bind, v);
    save('settings');
    updateOutputs();
    const b = el.dataset.bind;
    if (b.startsWith('card.') && ui.pmode === 'card') ui.zoom = fitZoom(), $('#zoom').value = ui.zoom;
    if (b.startsWith('defaults.')) renderEditor();
    if (b.startsWith('print.') || b.startsWith('card.')) updatePrintCount();
    schedulePreview();
  });

  $('#themeBtn').onclick = () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  $$('.tabs button').forEach(b => b.onclick = () => setTab(b.dataset.tab));
  $$('[data-pmode]').forEach(b => b.onclick = () => setPMode(b.dataset.pmode));
  $$('[data-nav]').forEach(b => b.onclick = () => step(+b.dataset.nav));

  $('#zoom').addEventListener('input', e => {
    ui.zoom = parseFloat(e.target.value);
    try { localStorage.setItem('idc_zoom', ui.zoom); } catch (er) {}
    schedulePreview();
  });

  // mobile preview
  $('#openPreview').onclick = () => {
    $('#previewPanel').classList.add('open');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => { if (!localStorage.getItem('idc_zoom')) { ui.zoom = fitZoom(); $('#zoom').value = ui.zoom; } schedulePreview(); });
  };
  $('#closePreview').onclick = () => { $('#previewPanel').classList.remove('open'); document.body.style.overflow = ''; };
  let rT; window.addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(schedulePreview, 150); });

  // students
  $('#addStudent').onclick = () => {
    const prev = getCur();
    const s = newStudent({ class: prev?.class || '', group: prev?.group || '', session: prev?.session || '' });
    STU.push(s); cur = s.uid;
    save('students'); renderList(); renderEditor(); schedulePreview();
    if (ui.tab !== 'students') setTab('students');
    setTimeout(() => $('[data-sfield="name"]').focus(), 30);
  };
  $('#stuSearch').addEventListener('input', e => { ui.search = e.target.value; renderList(); });
  $('#stuList').addEventListener('click', e => {
    const li = e.target.closest('.stu'); if (!li) return;
    const id = li.dataset.uid;
    if (e.target.closest('.del')) {
      const s = STU.find(x => x.uid === id);
      if (!confirm(`“${s?.name || 'এই শিক্ষার্থী'}” কে তালিকা থেকে মুছবেন?`)) return;
      const idx = STU.findIndex(x => x.uid === id);
      STU.splice(idx, 1);
      if (cur === id) cur = (STU[idx] || STU[idx - 1])?.uid || null;
      save('students'); renderList(); renderEditor(); schedulePreview();
      return;
    }
    if (e.target.classList.contains('sel')) {
      const s = STU.find(x => x.uid === id); s.sel = e.target.checked;
      save('students'); renderList(); if (ui.pmode === 'sheet') schedulePreview();
      return;
    }
    selectStudent(id);
  });
  $('#selectAll').addEventListener('change', e => {
    STU.forEach(s => { s.sel = e.target.checked; });
    save('students'); renderList(); if (ui.pmode === 'sheet') schedulePreview();
  });
  $('#clearAll').onclick = () => {
    if (!STU.length) return;
    if (!confirm(`তালিকার ${toBnNum(STU.length)} জন শিক্ষার্থীর সব তথ্য ও ছবি মুছে যাবে। প্রতিষ্ঠান ও ডিজাইনের সেটিং থাকবে। মুছবেন?`)) return;
    STU = []; cur = null;
    save('students'); renderList(); renderEditor(); schedulePreview();
    toast('সব শিক্ষার্থী মুছে ফেলা হয়েছে');
  };
  $('#stuFields').addEventListener('input', e => {
    const k = e.target.dataset.sfield, s = getCur();
    if (!k || !s) return;
    s[k] = e.target.value;
    save('students'); renderList(); schedulePreview();
  });
  $('#stuPhoto').addEventListener('change', async e => {
    const f = e.target.files[0], s = getCur(); e.target.value = '';
    if (!f || !s) return;
    try { s.photo = await readImage(f, PHOTO_OPT); save('students'); renderList(); renderEditor(); schedulePreview(); }
    catch (er) { toast('ছবিটি খোলা যায়নি, অন্য ফাইল দিন'); }
  });
  $('#stuPhotoRemove').onclick = () => { const s = getCur(); if (!s) return; s.photo = ''; save('students'); renderList(); renderEditor(); schedulePreview(); };

  $('#bulkPhotos').addEventListener('change', async e => {
    const files = [...e.target.files]; e.target.value = '';
    if (!files.length) return;
    if (!STU.length) { toast('আগে শিক্ষার্থী যোগ করুন, তারপর ছবি দিন'); return; }
    let ok = 0; const miss = [];
    toast('ছবি বসানো হচ্ছে…');
    for (const f of files) {
      const base = toEnNum(f.name.replace(/\.[^.]+$/, '')).trim().toLowerCase();
      const norm = v => toEnNum(v || '').trim().toLowerCase();
      const st = STU.find(s => norm(s.roll) && norm(s.roll) === base) || STU.find(s => norm(s.id) && norm(s.id) === base) || STU.find(s => (s.name || '').trim().toLowerCase() === base);
      if (!st) { miss.push(f.name); continue; }
      try { st.photo = await readImage(f, PHOTO_OPT); ok++; } catch (er) { miss.push(f.name); }
    }
    save('students'); renderList(); renderEditor(); schedulePreview();
    toast(`${toBnNum(ok)}টি ছবি বসেছে` + (miss.length ? `, ${toBnNum(miss.length)}টির রোল মেলেনি` : ''));
    if (miss.length) console.info('মেলেনি:', miss);
  });

  // JSON dialog
  const dlg = $('#jsonDlg');
  $('#openJson').onclick = () => { $('#jsonErr').textContent = ''; dlg.showModal(); setTimeout(() => $('#jsonText').focus(), 30); };
  $('#jsonCancel').onclick = () => dlg.close();
  $('#jsonSample').onclick = () => {
    $('#jsonText').value = JSON.stringify([
      { name: 'সাদিয়া ইসলাম', father: 'মোঃ রফিকুল ইসলাম', mother: 'মোসাঃ রাশিদা বেগম', class: 'দ্বাদশ', group: 'মানবিক', roll: '220', session: '২০২৫-২০২৬', id: '59313' },
      { name: 'তাসনিম আক্তার', father: 'মোঃ আব্দুল করিম', mother: 'মোসাঃ নাসিমা খাতুন', class: 'দ্বাদশ', group: 'বিজ্ঞান', roll: '221', session: '২০২৫-২০২৬' }
    ], null, 2);
  };
  $('#jsonImport').onclick = () => {
    const txt = $('#jsonText').value.trim();
    if (!txt) { $('#jsonErr').textContent = 'বক্সে JSON পেস্ট করুন'; return; }
    let data;
    try { data = JSON.parse(txt.replace(/,\s*([\]}])/g, '$1')); }
    catch (er) { $('#jsonErr').textContent = 'JSON ঠিক নেই: ' + er.message + '। কমা, কোটেশন ( " ) আর [ ] বন্ধনী মিলিয়ে দেখুন।'; return; }
    if (!Array.isArray(data)) data = Array.isArray(data?.students) ? data.students : [data];
    const list = data.filter(o => o && typeof o === 'object').map(normalizeStudent);
    if (!list.length) { $('#jsonErr').textContent = 'কোনো শিক্ষার্থীর তথ্য পাওয়া যায়নি'; return; }
    const mode = $('input[name="jmode"]:checked').value;
    if (mode === 'replace') {
      if (STU.length && !confirm(`আগের ${toBnNum(STU.length)} জনের তথ্য ও ছবি মুছে নতুন তালিকা বসবে। চালিয়ে যাবেন?`)) return;
      STU = list;
    } else STU = STU.concat(list);
    cur = list[0].uid;
    save('students'); renderList(); renderEditor(); schedulePreview();
    dlg.close(); $('#jsonText').value = '';
    toast(`${toBnNum(list.length)} জন শিক্ষার্থী যোগ হয়েছে। এবার ছবি দিন।`);
  };

  // assets
  $$('[data-asset]').forEach(inp => inp.addEventListener('change', async e => {
    const f = e.target.files[0], k = inp.dataset.asset; e.target.value = '';
    if (!f) return;
    try { A[k] = await readImage(f, assetOpt(k, f)); save('assets'); renderAssets(); schedulePreview(); toast('আপলোড হয়েছে'); }
    catch (er) { toast('ছবিটি খোলা যায়নি'); }
  }));
  $$('[data-asset-remove]').forEach(b => b.onclick = () => {
    A[b.dataset.assetRemove] = null; save('assets'); renderAssets(); schedulePreview();
  });

  $('#sizeReset').onclick = () => {
    S.card = clone(DEFAULT_SETTINGS.card); save('settings'); populate(); updatePrintCount();
    ui.zoom = fitZoom(); $('#zoom').value = ui.zoom; schedulePreview();
  };

  // backup
  $('#backupExport').onclick = async () => {
    if (dirty.size) await flush();
    const d = new Date().toISOString().slice(0, 10);
    download(`id-card-backup-${d}.json`, JSON.stringify({ app: 'idcard-maker', version: 1, settings: S, assets: A, students: STU, cur }));
    toast('ব্যাকআপ ফাইল ডাউনলোড হয়েছে');
  };
  $('#backupImport').addEventListener('change', async e => {
    const f = e.target.files[0]; e.target.value = '';
    if (!f) return;
    try {
      const d = JSON.parse(await f.text());
      if (!d || d.app !== 'idcard-maker') throw new Error('bad');
      if (!confirm('এখনকার সব তথ্যের জায়গায় ব্যাকআপের তথ্য বসবে। চালিয়ে যাবেন?')) return;
      S = mergeSettings(d.settings); A = { logo: null, signature: null, background: null, ...(d.assets || {}) };
      STU = Array.isArray(d.students) ? d.students : []; cur = d.cur && STU.find(s => s.uid === d.cur) ? d.cur : STU[0]?.uid || null;
      save('settings', 'assets', 'students');
      buildFieldEditor(); populate(); renderAssets(); renderList(); renderEditor(); schedulePreview();
      toast('ব্যাকআপ থেকে সব ফিরে এসেছে');
    } catch (er) { toast('এটি এই অ্যাপের ব্যাকআপ ফাইল নয়'); }
  });
  $('#resetAll').onclick = async () => {
    if (!confirm('সব শিক্ষার্থী, ছবি, লোগো ও সেটিং মুছে শুরুর অবস্থায় যাবে। আগে ব্যাকআপ নিয়েছেন? চালিয়ে যাবেন?')) return;
    clearTimeout(saveTimer); dirty.clear();
    await Store.clear();
    location.reload();
  };

  $('#printBtn').onclick = doPrint;
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') { e.preventDefault(); doPrint(); }
  });
}

/* ---------- init ---------- */
async function init() {
  setTheme(document.documentElement.dataset.theme || 'light');
  await Store.open();
  S = mergeSettings(await Store.get('settings'));
  A = { logo: null, signature: null, background: null, ...((await Store.get('assets')) || {}) };
  const st = await Store.get('students');
  STU = Array.isArray(st?.list) ? st.list : [];
  cur = st?.cur && STU.find(s => s.uid === st.cur) ? st.cur : (STU[0]?.uid || null);

  buildFieldEditor();
  buildStudentForm();
  populate();
  renderAssets();
  renderList();
  renderEditor();
  bindEvents();

  const z = parseFloat(localStorage.getItem('idc_zoom'));
  ui.zoom = z > 0 ? z : fitZoom();
  $('#zoom').value = ui.zoom;
  renderPreview();
  setStatus(false);

  // re-measure once web fonts arrive
  if (document.fonts) document.fonts.ready.then(schedulePreview);
  if (document.fonts) document.fonts.addEventListener?.('loadingdone', schedulePreview);
}
init();

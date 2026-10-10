/**
 * Balon — XP oblacic sa kratkim objasnjenjem, uz malo "i".
 *
 * Za razliku od oznake izvora (izvori.js), koja je samo `title` i ne vodi
 * nikud, balon ima veze: u Pomoc, u Pravno i na sluzbeni izvor. Zato je
 * pravi element, a ne tooltip browsera — u tooltip se ne moze kliknuti.
 *
 * Otvara se trojako, da radi svugdje:
 *   - mis preko "i" ga pokaze, a ode li mis i sa "i" i sa balona, skloni se;
 *   - klik ili dodir ga zakuca, pa ostaje dok se ne zatvori;
 *   - Enter ili razmak na "i", jer je "i" dugme.
 * Zatvara ga ✕, Escape ili klik bilo gdje van njega.
 *
 * Sadrzaj ne stoji ovdje. Modul koji crta "i" registruje funkciju koja
 * od elementa pravi sadrzaj (registrujBalon), pa balon uvijek pokazuje
 * trenutno stanje — npr. racun izabranog kantona.
 *
 * Balon se ne stampa (no-print), a ni "i" uz racun.
 */

const sadrzaji = new Map();
let veze = { pomoc: () => {}, pravno: () => {} };

/**
 * @param {string} ime            ono sto stoji u data-balon
 * @param {Function} napravi       (element) => { naslov, html }
 */
export function registrujBalon(ime, napravi) {
  sadrzaji.set(ime, napravi);
}

/**
 * Kako balon otvara druge prozore. Zove se iz main.js, jer samo on zna
 * za uputstvo i pravno.
 * @param {{pomoc?: Function, pravno?: Function}} v
 */
export function postaviBalonVeze(v) {
  veze = { ...veze, ...v };
}

const esc = s => String(s ?? '').replace(/[&<>"]/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/**
 * HTML za "i" dugme.
 * @param {string} ime     koji balon otvara
 * @param {string} opis    za citac ekrana i za `title`
 * @param {Object} [podaci] dodatni data-* atributi, npr. { primalac: 'porez' }
 */
export function iDugme(ime, opis, podaci = {}) {
  const atributi = Object.entries(podaci)
    .map(([k, v]) => ' data-' + k + '="' + esc(v) + '"').join('');
  return '<button type="button" class="ib-i no-print" data-balon="' + esc(ime) + '"'
    + atributi + ' aria-haspopup="dialog" aria-expanded="false"'
    + ' aria-label="' + esc(opis) + '" title="' + esc(opis) + '">i</button>';
}

/* ---------- jedan balon za cijelu stranicu ---------- */

let balon = null;        // element balona
let sidro = null;        // "i" uz koji trenutno stoji
let zakucan = false;     // otvoren klikom, ne prelazom misa
let tajmer = null;

function napraviElement() {
  const el = document.createElement('div');
  el.className = 'ib-balon no-print';
  el.setAttribute('role', 'dialog');
  el.hidden = true;
  el.innerHTML = '<span class="ib-rep"></span>'
    + '<div class="ib-vrh"><span class="ib-ikona" aria-hidden="true">i</span>'
    + '<b class="ib-naslov"></b>'
    + '<button type="button" class="ib-x" aria-label="Zatvori">✕</button></div>'
    + '<div class="ib-tijelo"></div>';

  el.addEventListener('click', e => {
    if (e.target.closest('.ib-x')) { zatvori(); return; }
    const veza = e.target.closest('[data-balon-veza]');
    if (!veza) return;
    const [vrsta, arg] = veza.dataset.balonVeza.split(':');
    zatvori();
    if (veze[vrsta]) veze[vrsta](arg);
  });
  // Dok je mis na balonu, ne sklanja se ni kad je otvoren prelazom.
  el.addEventListener('pointerenter', () => clearTimeout(tajmer));
  el.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') sklopiUskoro(); });

  document.body.append(el);
  return el;
}

/** Postavi balon uz "i": ispod i desno, a ako nema mjesta, iznad ili lijevo. */
function postavi() {
  const r = sidro.getBoundingClientRect();
  const vw = document.documentElement.clientWidth;
  const vh = document.documentElement.clientHeight;
  const sirina = Math.min(300, vw - 16);
  balon.style.width = sirina + 'px';
  balon.style.left = '0px';
  balon.style.top = '0px';
  const visina = balon.offsetHeight;

  const ispod = r.bottom + 10 + visina <= vh - 8 || r.top - 10 - visina < 8;
  const top = ispod ? r.bottom + 10 : r.top - 10 - visina;
  let left = r.left + r.width / 2 - 24;
  left = Math.max(8, Math.min(left, vw - sirina - 8));

  balon.style.left = Math.round(left) + 'px';
  balon.style.top = Math.round(Math.max(8, top)) + 'px';
  balon.classList.toggle('iznad', !ispod);
  // Rep pokazuje na sam "i", gdje god da je balon gurnut.
  const rep = Math.max(12, Math.min(r.left + r.width / 2 - left, sirina - 12));
  balon.style.setProperty('--rep-x', Math.round(rep) + 'px');
}

function otvori(el, kucaj) {
  const napravi = sadrzaji.get(el.dataset.balon);
  if (!napravi) return;
  clearTimeout(tajmer);
  if (!balon) balon = napraviElement();
  if (sidro && sidro !== el) sidro.setAttribute('aria-expanded', 'false');

  const { naslov, html } = napravi(el);
  balon.querySelector('.ib-naslov').textContent = naslov;
  balon.querySelector('.ib-tijelo').innerHTML = html;
  balon.setAttribute('aria-label', naslov);
  sidro = el;
  zakucan = kucaj;
  el.setAttribute('aria-expanded', 'true');
  balon.hidden = false;
  postavi();
}

function zatvori() {
  clearTimeout(tajmer);
  if (!balon || balon.hidden) return;
  balon.hidden = true;
  if (sidro) sidro.setAttribute('aria-expanded', 'false');
  sidro = null;
  zakucan = false;
}

function sklopiUskoro() {
  if (zakucan) return;
  clearTimeout(tajmer);
  tajmer = setTimeout(zatvori, 250);
}

/* ---------- dogadjaji, jednom za cijelu stranicu ---------- */

/*
 * Uplatnice se precrtavaju pri svakoj izmjeni podataka, pa se "i" stalno
 * mijenja. Zato dogadjaji idu na dokument, ne na svako dugme.
 */
document.addEventListener('click', e => {
  const i = e.target.closest('[data-balon]');
  if (i) {
    e.preventDefault();
    if (sidro === i && zakucan) zatvori();
    else otvori(i, true);
    return;
  }
  if (balon && !balon.hidden && !e.target.closest('.ib-balon')) zatvori();
});

document.addEventListener('pointerover', e => {
  if (e.pointerType !== 'mouse') return;
  const i = e.target.closest('[data-balon]');
  if (!i) return;
  if (zakucan && sidro !== i) return;
  clearTimeout(tajmer);
  tajmer = setTimeout(() => { if (!zakucan) otvori(i, false); }, 300);
});

document.addEventListener('pointerout', e => {
  if (e.pointerType !== 'mouse') return;
  const i = e.target.closest('[data-balon]');
  if (!i || i.contains(e.relatedTarget)) return;
  if (!sidro) { clearTimeout(tajmer); return; }
  if (balon && balon.contains(e.relatedTarget)) return;
  sklopiUskoro();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && balon && !balon.hidden) {
    const bio = sidro;
    zatvori();
    if (bio) bio.focus();
  }
});

// Skrol ili promjena velicine pomjeri "i", a balon je `fixed`: najjednostavnije
// je skloniti ga, umjesto da visi pored praznog mjesta.
window.addEventListener('resize', zatvori);
document.addEventListener('scroll', e => {
  if (balon && !balon.hidden && !balon.contains(e.target)) zatvori();
}, true);

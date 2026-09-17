import { napraviProzor, pitajZaPotvrdu } from './prozor.js';
import { fmt } from './format.js';
import { nazivOpcine } from './storage.js';
import * as profili from './profili.js';

/**
 * ARHIVIRANO 16.09.2026. — ne ucitava se nigdje. Vidi arhiva/PROCITAJ.md
 * za razlog i za korake kojima se vraca u aplikaciju.
 *
 * Historija uplata — spisak obracuna koje je korisnik snimio.
 *
 * Ne snima se automatski: obracun se mijenja sa svakim otkucanim brojem,
 * pa bi automatsko biljezenje napravilo spisak smeca. Snima se izricito,
 * dugmetom "Spasi uplatu" uz polje osnovice.
 *
 * Kao i sve ostalo, stoji samo u ovom browseru.
 */

const KLJUC = 'porez.historija.v1';

/** Gornja granica, da spisak ne raste bez kraja. Najstarije ispada. */
const NAJVISE = 200;

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));

function procitaj() {
  try {
    const raw = localStorage.getItem(KLJUC);
    const o = raw ? JSON.parse(raw) : [];
    return Array.isArray(o) ? o : [];
  } catch {
    return [];
  }
}

function upisi(spisak) {
  try {
    localStorage.setItem(KLJUC, JSON.stringify(spisak));
    return true;
  } catch {
    return false;
  }
}

/** Sve uplate, najnovija prva. */
export function uplate() {
  return procitaj();
}

/**
 * Naziv profila koji odgovara trenutnim podacima, ili prazno.
 * Poredi se po imenu i broju obveznika — to dvoje profil i razlikuje.
 */
function pogodiProfil(p) {
  const nadjen = profili.mjesta().find(m =>
    m && m.podaci
    && String(m.podaci.ime || '') === String(p.ime || '')
    && String(m.podaci.obveznik || '') === String(p.obveznik || ''));
  return nadjen ? nadjen.naziv : '';
}

/**
 * Zabiljezi uplatu.
 * @param {Object} r obracun u feningima
 * @param {Object} p licni podaci u trenutku snimanja
 */
export function spasi(r, p) {
  const stavka = {
    id: 'u' + Date.now() + Math.random().toString(36).slice(2, 6),
    snimljeno: new Date().toISOString(),
    datum: p.datum || '',
    periodOd: p.periodOd || '',
    periodDo: p.periodDo || '',
    profil: pogodiProfil(p),
    ime: p.ime || '',
    opcina: p.opcina || '',
    osnovica: r.osnovica,
    doprinosi: r.doprinosi,
    kanton: r.kanton,
    federacija: r.federacija,
    porez: r.porez,
    ukupno: r.ukupno,
    neto: r.neto,
  };
  const spisak = [stavka, ...procitaj()].slice(0, NAJVISE);
  upisi(spisak);
  return stavka;
}

/** Obrisi jednu uplatu. */
export function obrisi(id) {
  return upisi(procitaj().filter(u => u.id !== id));
}

/** Obrisi cijeli spisak. */
export function obrisiSve() {
  return upisi([]);
}

/* ---------- prikaz ---------- */

/** "2026-09-16" -> "16.09.2026." */
function datumTekst(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  return m ? m[3] + '.' + m[2] + '.' + m[1] + '.' : '—';
}

/** ISO vrijeme snimanja -> "16.09.2026. 14:32" */
function vrijemeTekst(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const dva = n => String(n).padStart(2, '0');
  return dva(d.getDate()) + '.' + dva(d.getMonth() + 1) + '.' + d.getFullYear() + '. '
    + dva(d.getHours()) + ':' + dva(d.getMinutes());
}

/** Period "08/2026", iz pocetka poreznog perioda. */
function periodTekst(iso) {
  const m = /^(\d{4})-(\d{2})-\d{2}$/.exec(iso || '');
  return m ? m[2] + '/' + m[1] : '—';
}

function redHTML(u) {
  const ko = u.profil || u.ime || '—';
  return '<tr class="hi-red" data-hi-id="' + esc(u.id) + '">'
    + '<td class="hi-ikona"><span class="hi-tacka"></span></td>'
    + '<td>' + esc(datumTekst(u.datum)) + '</td>'
    + '<td>' + esc(periodTekst(u.periodOd)) + '</td>'
    + '<td class="hi-ko">' + esc(ko)
      + (u.profil ? '' : '<span class="hi-bez-profila">bez profila</span>') + '</td>'
    + '<td class="hi-broj">' + fmt(u.osnovica) + '</td>'
    + '<td class="hi-broj hi-ukupno">' + fmt(u.ukupno) + '</td>'
    + '<td class="hi-radnja">'
      + '<button type="button" class="hi-brisi" data-hi-brisi="' + esc(u.id) + '"'
      + ' title="Obriši ovu uplatu">✕</button></td>'
    + '</tr>';
}

function detaljiHTML(u) {
  const red = (n, v) => '<div class="hi-detalj"><span>' + esc(n) + '</span><b>' + v + '</b></div>';
  return '<tr class="hi-detalji" data-hi-detalji="' + esc(u.id) + '"><td colspan="7">'
    + '<div class="hi-detalji-okvir">'
      + red('Snimljeno', esc(vrijemeTekst(u.snimljeno)))
      + red('Općina', esc(nazivOpcine(u.opcina) || u.opcina || '—'))
      + red('Kanton', fmt(u.kanton) + ' KM')
      + red('Federacija', fmt(u.federacija) + ' KM')
      + red('Porez', fmt(u.porez) + ' KM')
      + red('Ostalo tebi', fmt(u.neto) + ' KM')
    + '</div></td></tr>';
}

function spisakHTML() {
  const spisak = procitaj();

  if (!spisak.length) {
    return '<div class="hi-prazno">'
      + '<div class="hi-prazno-ikona"></div>'
      + '<div class="hi-prazno-naslov">Nema snimljenih uplata</div>'
      + '<p>Kad izračunaš uplatu, klikni <b>Spasi uplatu</b> ispod polja '
      + 'osnovice pa će se pojaviti ovdje.</p>'
      + '</div>';
  }

  const zbir = spisak.reduce((a, u) => a + u.ukupno, 0);

  return '<table class="hi-tabela">'
    + '<thead><tr>'
      + '<th class="hi-ikona"></th>'
      + '<th>Datum uplate</th><th>Period</th><th>Profil</th>'
      + '<th class="hi-broj">Osnovica</th><th class="hi-broj">Ukupno</th>'
      + '<th class="hi-radnja"></th>'
    + '</tr></thead>'
    + '<tbody>' + spisak.map(u => redHTML(u) + detaljiHTML(u)).join('') + '</tbody>'
    + '</table>'
    + '<div class="hi-podnozje">'
      + '<span>' + spisak.length + ' ' + rijecUplata(spisak.length) + '</span>'
      + '<span>Ukupno uplaćeno: <b>' + fmt(zbir) + ' KM</b></span>'
    + '</div>';
}

/** 1 uplata, 2-4 uplate, 5+ uplata — po pravilu bosanskog. */
function rijecUplata(n) {
  const zadnja = n % 10;
  const zadnjeDvije = n % 100;
  if (zadnjeDvije >= 11 && zadnjeDvije <= 14) return 'uplata';
  if (zadnja === 1) return 'uplata';
  if (zadnja >= 2 && zadnja <= 4) return 'uplate';
  return 'uplata';
}

/**
 * Prozor sa historijom uplata.
 * @param {Function} [onZatvaranju]
 */
export function napraviHistoriju(onZatvaranju) {
  const prozor = napraviProzor({
    naslov: 'Historija uplata',
    nazivNaTraci: 'Historija',
    sirina: 620,
    klasa: 'hi-prozor',
    modalno: false,
    promjenjivo: true,
    najmanjaSirina: 340,
    najmanjaVisina: 240,
    naZatvaranje: () => onZatvaranju && onZatvaranju(),
    sadrzaj: '<div class="hi-alat">'
      + '<button type="button" class="pd-btn" data-hi-akcija="obrisi-sve">Obriši historiju</button>'
      + '<span class="hi-savjet">Klik na red pokazuje raspodjelu</span>'
      + '</div>'
      + '<div class="hi-mount"></div>',
  });

  const tijelo = prozor.tijelo;
  const mount = tijelo.querySelector('.hi-mount');

  const osvjezi = () => {
    mount.innerHTML = spisakHTML();
    const imaIh = !!procitaj().length;
    tijelo.querySelector('[data-hi-akcija="obrisi-sve"]').disabled = !imaIh;
  };

  tijelo.addEventListener('click', async e => {
    const brisi = e.target.closest('[data-hi-brisi]');
    if (brisi) {
      if (!await pitajZaPotvrdu({
        naslov: 'Obriši uplatu',
        poruka: 'Obrisati ovu uplatu iz historije?',
        potvrdi: 'Obriši',
      })) return;
      obrisi(brisi.dataset.hiBrisi);
      osvjezi();
      prozor.uklopi();
      return;
    }

    if (e.target.closest('[data-hi-akcija="obrisi-sve"]')) {
      if (!await pitajZaPotvrdu({
        naslov: 'Obriši historiju',
        poruka: 'Obrisati sve snimljene uplate? Lični podaci i profili ostaju.',
        potvrdi: 'Obriši sve',
      })) return;
      obrisiSve();
      osvjezi();
      prozor.uklopi();
      return;
    }

    // klik na red rasklapa raspodjelu
    const red = e.target.closest('[data-hi-id]');
    if (!red) return;
    const id = red.dataset.hiId;
    const bioOtvoren = red.classList.contains('otvoren');
    tijelo.querySelectorAll('.hi-red').forEach(r => r.classList.remove('otvoren'));
    tijelo.querySelectorAll('.hi-detalji').forEach(d => d.classList.remove('otvoren'));
    if (!bioOtvoren) {
      red.classList.add('otvoren');
      tijelo.querySelector('[data-hi-detalji="' + CSS.escape(id) + '"]')?.classList.add('otvoren');
    }
    prozor.uklopi();
  });

  prozor.osvjezi = osvjezi;

  const izvornoOtvori = prozor.otvori;
  prozor.otvori = () => { osvjezi(); izvornoOtvori(); prozor.uklopi(); return prozor; };

  osvjezi();
  return prozor;
}

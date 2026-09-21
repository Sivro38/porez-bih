import { VERZIJA } from './config.js';
import { napraviProzor } from './prozor.js';
import * as traka from './traka.js';

/**
 * "Sta je novo" — prozor sa izmjenama, i balon koji na njega poziva.
 *
 * Balon nije sam sadrzaj nego poziv: kratak je, i klik otvara prozor.
 * ✕ ga gasi zauvijek, ali prozor time ne nestaje — ostaje pod
 * Pomoc > Sta je novo, pa se izmjene mogu procitati kad god.
 *
 * Kljuc balona nosi broj verzije, pa sljedeca verzija dobija svoj
 * poziv bez diranja koda.
 *
 * Dva slucaja kad se balon ne pojavi:
 *   - vec je zatvoren za ovu verziju
 *   - covjek je prvi put ovdje; njemu nista nije "novo", pa se oznaka
 *     samo tiho upise
 *
 * Ceka da se skloni pocetno upozorenje: ono blokira i stoji iznad
 * balona, pa bi se balon inace nazirao ispod zatamnjenja.
 */

const KLJUC = 'porez.novosti.v' + VERZIJA;
const KLJUC_UPOZORENJA = 'porez.upozorenje.v1';

/** Spisak izmjena za prozor. */
const IZMJENE = [
  '<b>Obrazac AMS-1035 je prekopiran iz službenog PDF-a</b> — mjere, '
  + 'fontovi i raspored su sada isti kao na papiru, do desetinke '
  + 'milimetra. Ranije je bio 27% viši nego što treba.',
  '<b>Ispravljen broj računa na drugoj uplatnici.</b> Stajala je jedna '
  + 'nula previše u sredini.',
  'Primalac druge uplatnice nosi <b>službeni naziv vlasnika računa</b> — '
  + 'Zavod zdravstvenog osiguranja i reosiguranja FBiH.',
  'Sva tri računa, stope i šifre općina <b>provjereni kod Porezne '
  + 'uprave FBiH</b>.',
  'Uz uplatnice i obrazac sada stoje i <b>rokovi</b>: porez naredni '
  + 'dan, obrazac u roku od pet dana.',
  'Nova ikona <b>Službeni resursi</b> — veze na Poreznu upravu, obrazac '
  + 'i uplatne račune.',
  'Nova bilješka <b>Kako platiti</b> na radnoj površini.',
];

/** Ono sto se istice crvenim. Prazno ako za verziju nema takvog. */
const VAZNO =
  'Ako si uplatnice štampao prije 21.09.2026, drugi nalog je nosio '
  + 'pogrešan račun. Provjeri prije nego platiš.';

const esc = s => String(s ?? '').replace(/[&<>"]/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function vecZatvoren() {
  try { return localStorage.getItem(KLJUC) === 'da'; } catch { return true; }
}

function zapamti() {
  try { localStorage.setItem(KLJUC, 'da'); } catch { /* svejedno */ }
}

function prviPut() {
  try { return localStorage.getItem(KLJUC_UPOZORENJA) !== 'da'; } catch { return false; }
}

/* ---------------- prozor ---------------- */

function sadrzajHTML() {
  return '<div class="nv-verzija">Verzija ' + esc(VERZIJA) + '</div>'
    + '<ul class="nv-spisak">'
    + IZMJENE.map(i => '<li>' + i + '</li>').join('')
    + '</ul>'
    + (VAZNO ? '<p class="nv-vazno">' + VAZNO + '</p>' : '');
}

/**
 * @param {Function} [onZatvaranju]
 * @returns {Object} prozor
 */
export function napraviNovosti(onZatvaranju) {
  return napraviProzor({
    naslov: 'Šta je novo',
    nazivNaTraci: 'Šta je novo',
    sirina: 'min(460px, 94vw)',
    klasa: 'nv-prozor',
    promjenjivo: true,
    najmanjaSirina: 290,
    najmanjaVisina: 200,
    animacija: true,
    minimizirati: true,
    naZatvaranje: () => onZatvaranju && onZatvaranju(),
    sadrzaj: sadrzajHTML(),
    dugmad: [{ tekst: 'Zatvori', primarno: true }],
  });
}

/* ---------------- balon ---------------- */

/** Pozove `sta` tek kad na ekranu nema blokirajuceg upozorenja. */
function kadNemaUpozorenja(sta) {
  const blokira = () => document.querySelector('.modal-overlay.blokirajuca');
  if (!blokira()) { setTimeout(sta, 900); return; }

  const posmatrac = new MutationObserver(() => {
    if (blokira()) return;
    posmatrac.disconnect();
    setTimeout(sta, 600);
  });
  posmatrac.observe(document.body, { childList: true, subtree: true });
}

function prikaziBalon(otvori) {
  const balon = document.createElement('div');
  balon.className = 'xp-balon no-print';
  balon.setAttribute('role', 'status');
  // Namjerno ne pise sta je novo — to je u prozoru. Balon samo javlja
  // da ima nesto, pa ne mora biti velik ni citan u prolazu.
  balon.innerHTML =
    '<button type="button" class="balon-x" aria-label="Ne prikazuj više">✕</button>'
    + '<div class="balon-naslov">'
    + '<span class="balon-ikona" aria-hidden="true">i</span>'
    + '<span>Verzija ' + esc(VERZIJA) + '</span>'
    + '</div>'
    + '<button type="button" class="balon-otvori">Šta je novo</button>'
    + '<span class="balon-rep" aria-hidden="true"></span>';

  document.body.append(balon);
  // Dvostruki rAF: prvi pusti element u raspored, drugi pokrene prelaz.
  requestAnimationFrame(() => requestAnimationFrame(() => balon.classList.add('vidljiv')));

  const skloni = () => {
    zapamti();
    balon.classList.remove('vidljiv');
    // Ako je prelaz ugasen (prefers-reduced-motion), transitionend ne
    // stize, pa ga dubli i tajmer.
    setTimeout(() => balon.remove(), 220);
  };

  balon.querySelector('.balon-x').addEventListener('click', skloni);
  balon.querySelector('.balon-otvori').addEventListener('click', () => {
    skloni();
    otvori();
  });
}

/* ---------------- ikona u traci ---------------- */

/**
 * Sitna ikona lijevo od sata. Stoji uvijek, i prije i poslije balona,
 * pa se izmjene mogu otvoriti i kad je poruka odavno sklonjena.
 */
function postaviIkonu(otvori) {
  const dugme = document.createElement('button');
  dugme.type = 'button';
  dugme.className = 'xp-zona-dugme';
  dugme.title = 'Šta je novo u verziji ' + VERZIJA;
  dugme.setAttribute('aria-label', dugme.title);
  dugme.innerHTML = '<span class="xp-zona-ikona" aria-hidden="true">i</span>';
  dugme.addEventListener('click', otvori);
  traka.dodajUZonu(dugme);
}

/**
 * Postavi ikonu u traku i, ako poziv jos nije zatvoren za ovu verziju,
 * pokazi balon.
 * @param {Function} otvori  sta uraditi na klik — obicno prozor.otvori
 */
export function postaviNovosti(otvori) {
  postaviIkonu(otvori);
  if (vecZatvoren()) return;
  if (prviPut()) { zapamti(); return; }
  kadNemaUpozorenja(() => prikaziBalon(otvori));
}

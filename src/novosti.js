import { VERZIJA } from './config.js';
import * as ikone from './ikone.js';
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

/**
 * Izmjene po verzijama, od najnovije nadolje.
 *
 * Prozor pocinje na prvoj — na onome sto je stvarno novo — a strelicom
 * se ide unazad kroz starije. Ranije je ovdje stajao samo tekuci
 * spisak, pa je svaka nova verzija brisala onu prethodnu i nije se
 * imalo gdje provjeriti sta je kad doslo.
 *
 * PRVA STAVKA MORA NOSITI `VERZIJA` IZ config.js. Spisak i broj verzije
 * stoje na dva mjesta, pa pri svakoj novoj verziji ide i novi unos ovdje
 * — inace prozor pise jedan broj, a naslovna traka i balon drugi.
 *
 * `vazno` je ono sto se istice crvenim, svaka stavka svoja kutija, i
 * stoji uz verziju u kojoj je i objavljeno. Upozorenje o pogresnom
 * racunu je zato ostalo uz 1.1: tada je i izaslo, a ko danas otvara
 * 1.2 ga vise ne treba na vrhu.
 */
const VERZIJE = [
  {
    verzija: '1.2',
    izmjene: [
      '<b>Svih deset kantona FBiH.</b> Kanton biraš u glavnom prozoru, pored '
      + 'vrste prihoda, a zadan je Zeničko-dobojski. Uplatnice dobiju račune '
      + 'tvog kantona, a Moji podaci nude samo njegove općine.',
      '<b>Godišnja prijava GPD-1051.</b> Upišeš iznose po mjesecima, a program '
      + 'izračuna lični odbitak, povrat ili doplatu, i popuni obrazac za '
      + 'štampu. Unos se pamti u ovom browseru.',
      'Uz svaki račun na uplatnici stoji <b>„i”</b>. Pokaže račun onako kako '
      + 'piše u Pravilniku, banku i datum provjere, i vodi na objašnjenje.',
      'Nalog je popunjen po Pravilniku: <b>vrsta uplate 0</b> i <b>period sa '
      + 'šest cifara</b>, dd/mm/gg. Od 2025. banka uplatu doprinosa bez '
      + 'perioda ne prihvata.',
      'U Pomoći su nove teme <b>Računi i provjera</b> i <b>Godišnja '
      + 'prijava</b>, sa vezama na službene izvore.',
      '<b>Pravno i privatnost</b> nabraja sve što program pamti u browseru, i '
      + 'vodi na izvorni kod ako ga želiš pokrenuti na svom računaru.',
      'Ikone na radnoj površini stoje u mreži, svaki prozor ima svoju ikonu, '
      + 'a ikona kalkulatora je i ikona kartice u browseru. Na telefonu ikone '
      + 'u donjoj traci više nisu blijede.',
      'U <b>Službenim resursima</b> su nove veze: obrazac GPD-1051, Pravilnik '
      + 'o načinu uplate i zavodi zdravstvenog osiguranja.',
      '<b>Moji podaci su preuređeni.</b> Natpisi stoje lijevo od polja, polja su '
      + 'grupisana po tome gdje idu, a profili su u traci lijevo — sada ih je '
      + '<b>pet</b> umjesto tri. Izmijenjena polja dobiju narandžasti okvir dok '
      + 'se ne snime u profil.',
      '<b>Iznos se može upisati kako ko piše.</b> „1.000,50”, „1,000.50” i '
      + '„1000.5” se čitaju isto. Ranije je program neke od tih oblika čitao '
      + 'pogrešno.',
      'Bilješka na radnoj površini ima <b>tri stranice</b> — kako platiti, '
      + 'rokovi i godišnja prijava — a lista se strelicama.',
      'Ovaj prozor <b>pamti i starije verzije</b>: strelicom unazad se vidi šta '
      + 'je donijela svaka.',
    ],
    vazno: [
      'Računi zavise od kantona. Prije štampanja provjeri da je izabran tvoj.',
    ],
  },
  {
    verzija: '1.1',
    izmjene: [
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
    ],
    vazno: [
      'Ako si uplatnice štampao prije 21.09.2026, drugi nalog je nosio '
      + 'pogrešan račun. Provjeri prije nego platiš.',
    ],
  },
];

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

/**
 * Jedna verzija, sa strelicama za listanje.
 *
 * Strelica unazad vodi u stariju verziju, naprijed u noviju; na krajevima
 * se gasi, da se ne vrti u krug. Krug ima smisla na biljesci sa tri
 * jednako vazne stranice, ali ne na historiji: ona ima pocetak i kraj.
 */
function sadrzajHTML(i) {
  const v = VERZIJE[i];
  const strelica = (smjer, znak, opis) =>
    '<button type="button" class="nv-strelica" data-nv-smjer="' + smjer + '"'
    + (VERZIJE[i + smjer] ? '' : ' disabled')
    + ' title="' + opis + '" aria-label="' + opis + '">' + znak + '</button>';

  return '<div class="nv-vrh">'
      + strelica(1, '◀', 'Starija verzija')
      + '<span class="nv-verzija">Verzija ' + esc(v.verzija)
        + (i === 0 ? '' : ' <span class="nv-staro">(starija)</span>') + '</span>'
      + strelica(-1, '▶', 'Novija verzija')
    + '</div>'
    + '<ul class="nv-spisak">'
    + v.izmjene.map(x => '<li>' + x + '</li>').join('')
    + '</ul>'
    + v.vazno.map(x => '<p class="nv-vazno">' + x + '</p>').join('');
}

/**
 * @param {Function} [onZatvaranju]
 * @returns {Object} prozor
 */
export function napraviNovosti(onZatvaranju) {
  let i = 0;

  const prozor = napraviProzor({
    naslov: 'Šta je novo',
    ikona: ikone.NOVOSTI,
    nazivNaTraci: 'Šta je novo',
    sirina: 'min(460px, 94vw)',
    klasa: 'nv-prozor',
    promjenjivo: true,
    najmanjaSirina: 290,
    najmanjaVisina: 200,
    animacija: true,
    minimizirati: true,
    naZatvaranje: () => onZatvaranju && onZatvaranju(),
    sadrzaj: sadrzajHTML(i),
    dugmad: [{ tekst: 'Zatvori', primarno: true }],
  });

  const precrtaj = () => {
    prozor.tijelo.innerHTML = sadrzajHTML(i);
    prozor.uklopi();
  };

  prozor.tijelo.addEventListener('click', e => {
    const dugme = e.target.closest('[data-nv-smjer]');
    if (!dugme) return;
    const kuda = i + Number(dugme.dataset.nvSmjer);
    if (!VERZIJE[kuda]) return;
    i = kuda;
    precrtaj();
  });

  /*
   * Prozor se UVIJEK otvara na najnovijoj verziji. Ko je zalutao u
   * historiju i zatvorio prozor tamo, sljedeci put opet dobija ono sto
   * je novo — to je i smisao ovog prozora.
   *
   * `prebaci()` u prozor.js zove `api.otvori()`, dakle ovo ispod, pa i
   * kvacica u meniju prolazi kroz isti put.
   */
  const otvoriPonovo = prozor.otvori;
  prozor.otvori = () => {
    if (i !== 0) { i = 0; precrtaj(); }
    return otvoriPonovo.call(prozor);
  };

  return prozor;
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
  // Oznaka zatvorenog balona stare verzije vise nicemu ne sluzi
  try {
    Object.keys(localStorage)
      .filter(k => k.startsWith('porez.novosti.v') && k !== KLJUC)
      .forEach(k => localStorage.removeItem(k));
  } catch { /* svejedno */ }
  postaviIkonu(otvori);
  if (vecZatvoren()) return;
  if (prviPut()) { zapamti(); return; }
  kadNemaUpozorenja(() => prikaziBalon(otvori));
}

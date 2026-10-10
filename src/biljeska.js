/**
 * Biljeska na radnoj povrsini — tri stranice, listaju se strelicama.
 *
 * Postupak je onaj stvarni, kako ga je autor prosao u Zenici. Koraci se
 * slazu s Pravilnikom (clan 57.), osim "u dva primjerka" i mjesta
 * predaje, sto je zenicka praksa — otud "(za Zenicu)" uz naslov.
 *
 * Sklapa se i rasklapa. Radjeno preko <details>, ne preko dugmeta i
 * klase: tako se otvara i tastaturom, citac ekrana zna da je sklopivo,
 * i ne treba nam nista od toga pisati rukom.
 *
 * Stoji na mjestu — ne vuce se. Isti sloj kao precice (z-index 1), pa
 * je svaki otvoren prozor prekrije, kao papiric zalijepljen na monitor.
 *
 * Na uskom ekranu je nema (vidi CSS).
 */

const KLJUC = 'porez.biljeska.v1';
const KLJUC_STRANICE = 'porez.biljeska.stranica.v1';

const VODIC = 'https://pufbih.ba/freelanceri';

/* Cioda je crtana kao pixel art — crispEdges gasi zagladjivanje, pa
   kvadratici ostaju ostri u svakoj velicini i zumu. */
const CIODA =
  '<svg class="bilj-cioda" width="14" height="14" viewBox="0 0 14 14"'
  + ' shape-rendering="crispEdges" aria-hidden="true">'
  + '<rect x="4" y="1" width="6" height="6" fill="#C5321B"/>'
  + '<rect x="5" y="2" width="2" height="2" fill="#F08A6C"/>'
  + '<rect x="6" y="7" width="2" height="6" fill="#8A8A7A"/>'
  + '</svg>';

const tise = t => '<span class="bilj-tise">' + t + '</span>';

/**
 * Stranice. `uz` ide u zagradu uz naslov i nosi ogradu — ono sto vrijedi
 * za Zenicu, a ne nuzno svuda.
 */
const STRANICE = [
  {
    naslov: 'Kako platiti',
    uz: 'za Zenicu',
    sadrzaj:
      '<ol class="bilj-koraci">'
      + '<li>Popuni <b>tri uplatnice</b></li>'
      + '<li>Uplati ih u <b>banci ili na pošti</b></li>'
      + '<li>Popuni <b>AMS-1035</b>, u <b>dva primjerka</b></li>'
      + '<li>Odnesi ih u <b>Poreznu upravu</b> '
        + tise('(prvi sprat, kancelarija 11, pokucati i predati)') + '</li>'
      + '</ol>'
      + '<div class="bilj-dno">Prije uplate provjeri iznose.</div>',
  },
  {
    naslov: 'Rokovi',
    sadrzaj:
      '<ul class="bilj-spisak">'
      + '<li><b>Porez</b> — najkasnije <b>naredni dan</b> od primitka dohotka</li>'
      + '<li><b>AMS-1035</b> — u roku od <b>5 dana</b> od primitka</li>'
      + '<li><b>Godišnja prijava</b> — do <b>31. marta</b> za prethodnu godinu</li>'
      + '</ul>'
      + '<div class="bilj-dno">'
      + '<a class="bilj-veza" href="' + VODIC + '" target="_blank" rel="noopener noreferrer">'
      + 'Vodič Porezne uprave ↗</a>'
      + '</div>',
  },
  {
    naslov: 'Godišnja prijava',
    sadrzaj:
      '<p class="bilj-tekst">Obrazac <b>GPD-1051</b> se predaje <b>do 31. marta</b> '
      + 'za prethodnu godinu. U njega ide zbir svega uplaćenog tokom godine, '
      + 'ne jedna uplata.</p>'
      + '<p class="bilj-tekst">Otvara se ikonom <b>Godišnja prijava</b> na radnoj '
      + 'površini.</p>'
      + '<div class="bilj-dno">Iznose uplata upisuješ sam, po mjesecima — '
      + 'zbir i obrazac program izračuna.</div>',
  },
];

function bioOtvoren() {
  try { return localStorage.getItem(KLJUC) !== 'sklopljeno'; } catch { return true; }
}

function zapamti(otvoren) {
  try {
    localStorage.setItem(KLJUC, otvoren ? 'otvoreno' : 'sklopljeno');
  } catch { /* svejedno, samo nece prezivjeti zatvaranje */ }
}

function zadnjaStranica() {
  try {
    const n = Number(localStorage.getItem(KLJUC_STRANICE));
    return Number.isInteger(n) && n >= 0 && n < STRANICE.length ? n : 0;
  } catch { return 0; }
}

function zapamtiStranicu(i) {
  try { localStorage.setItem(KLJUC_STRANICE, String(i)); } catch { /* svejedno */ }
}

/**
 * Zalijepi biljesku na radnu povrsinu.
 * @returns {HTMLElement} element biljeske
 */
export function napraviBiljesku() {
  let i = zadnjaStranica();

  const bilj = document.createElement('details');
  bilj.className = 'xp-biljeska no-print';
  bilj.open = bioOtvoren();
  bilj.innerHTML =
    '<summary class="bilj-vrh">' + CIODA + '<span class="bilj-naslov"></span></summary>'
    + '<div class="bilj-tijelo"></div>'
    + '<div class="bilj-listanje">'
      + '<button type="button" class="bilj-strelica" data-smjer="-1"'
      + ' aria-label="Prethodna stranica">◀</button>'
      + '<span class="bilj-tacke" aria-hidden="true"></span>'
      + '<button type="button" class="bilj-strelica" data-smjer="1"'
      + ' aria-label="Sljedeća stranica">▶</button>'
    + '</div>';

  const naslovEl = bilj.querySelector('.bilj-naslov');
  const tijeloEl = bilj.querySelector('.bilj-tijelo');
  const tackeEl = bilj.querySelector('.bilj-tacke');

  function crtaj() {
    const s = STRANICE[i];
    naslovEl.innerHTML = s.naslov + (s.uz ? ' ' + tise('(' + s.uz + ')') : '');
    tijeloEl.innerHTML = s.sadrzaj;
    tackeEl.innerHTML = STRANICE
      .map((_, k) => '<span class="bilj-tacka' + (k === i ? ' sada' : '') + '"></span>')
      .join('');
  }

  bilj.querySelectorAll('.bilj-strelica').forEach(dugme => {
    dugme.addEventListener('click', e => {
      // Strelice stoje unutar <details>, ali ne smiju ga sklapati.
      e.preventDefault();
      e.stopPropagation();
      const smjer = Number(dugme.dataset.smjer);
      i = (i + smjer + STRANICE.length) % STRANICE.length;
      zapamtiStranicu(i);
      crtaj();
    });
  });

  bilj.addEventListener('toggle', () => zapamti(bilj.open));

  crtaj();

  // Na pocetak tijela, kao i precice — prozori u prirodnom redoslijedu
  // ostaju iznad.
  document.body.prepend(bilj);
  return bilj;
}

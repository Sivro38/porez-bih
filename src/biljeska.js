/**
 * Biljeska "Kako platiti" — gore desno na radnoj povrsini.
 *
 * Postupak je onaj stvarni, za Zenicu, ne uopsteno uputstvo.
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

/* Cioda je crtana kao pixel art — crispEdges gasi zagladjivanje, pa
   kvadratici ostaju ostri u svakoj velicini i zumu. */
const CIODA =
  '<svg class="bilj-cioda" width="14" height="14" viewBox="0 0 14 14"'
  + ' shape-rendering="crispEdges" aria-hidden="true">'
  + '<rect x="4" y="1" width="6" height="6" fill="#C5321B"/>'
  + '<rect x="5" y="2" width="2" height="2" fill="#F08A6C"/>'
  + '<rect x="6" y="7" width="2" height="6" fill="#8A8A7A"/>'
  + '</svg>';

const KORACI = [
  'Popuni <b>tri uplatnice</b>',
  'Uplati ih u <b>banci ili na pošti</b>',
  'Popuni <b>AMS-1035</b> — u <b>dva primjerka</b>',
  'Odnesi ih u <b>Poreznu upravu</b>',
];

/*
 * Za Zenicu je poznato i tacno mjesto predaje — prvi sprat, druga
 * vrata desno, kancelarija 11 ili 12. Namjerno NIJE upisano: broj
 * kancelarije nije potvrdjen, a poslati covjeka na pogresna vrata je
 * gore nego ne reci nista. Vrati tek kad neko provjeri na licu mjesta.
 */

function bioOtvoren() {
  try { return localStorage.getItem(KLJUC) !== 'sklopljeno'; } catch { return true; }
}

function zapamti(otvoren) {
  try {
    localStorage.setItem(KLJUC, otvoren ? 'otvoreno' : 'sklopljeno');
  } catch { /* svejedno, samo nece prezivjeti zatvaranje */ }
}

/**
 * Zalijepi biljesku na radnu povrsinu.
 * @returns {HTMLElement} element biljeske
 */
export function napraviBiljesku() {
  const bilj = document.createElement('details');
  bilj.className = 'xp-biljeska no-print';
  bilj.open = bioOtvoren();
  bilj.innerHTML =
    '<summary class="bilj-vrh">' + CIODA
    + '<span>Kako platiti <span class="bilj-tise">(za Zenicu)</span></span>'
    + '</summary>'
    + '<ol class="bilj-koraci">'
    + KORACI.map(k => '<li>' + k + '</li>').join('')
    + '</ol>'
    + '<div class="bilj-dno">Prije uplate provjeri iznose.</div>';

  bilj.addEventListener('toggle', () => zapamti(bilj.open));

  // Na pocetak tijela, kao i precice — prozori u prirodnom redoslijedu
  // ostaju iznad.
  document.body.prepend(bilj);
  return bilj;
}

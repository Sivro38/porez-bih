import { napraviProzor } from './prozor.js';
import slikaUrl from './slike/rat2.jpg?url';

/**
 * Upozorenje da alat nije sluzben.
 *
 * Pri prvom otvaranju stranice iskace kao blokirajuci prozor: nema ✕,
 * Escape ga ne zatvara, klik pored ne zatvara, a podloga hvata klikove
 * pa se kalkulacija ne moze koristiti dok se ne potvrdi.
 *
 * Poslije ostaje dostupno pod Pomoc > Upozorenje, i tada je obican
 * dijalog koji se zatvara kako god korisnik hoce. Zato su to dvije
 * odvojene instance: blokirajuca se nakon potvrde skida iz DOM-a.
 *
 * Kljuc nosi verziju: ako se poruka ikad bitno promijeni, dovoljno je
 * podici broj pa ce se ponovo prikazati svima.
 */
const KLJUC = 'porez.upozorenje.v1';

/**
 * Tekst je dio slike, pa mora postojati i kao alt — i zbog citaca
 * ekrana, i da poruka ne nestane ako se slika ne ucita.
 */
const ALT =
  'Upozorenje. Ovo nije službena stranica i nije povezana ni s jednom ' +
  'institucijom — privatni je projekat, napravljen da pomogne pri računanju. ' +
  'Stope, računi i šifre općina provjereni su kod Porezne uprave FBiH, ali se propisi mijenjaju. ' +
  'Prije uplate provjeri iznose kod Porezne uprave FBiH, u banci ili kod ' +
  'knjigovođe. Sve što upišeš ostaje u tvom browseru — ništa se ne šalje nigdje.';

/*
 * Ista poruka u dva oblika. Na telefonu je slika neupotrebljiva - tekst
 * u oblacicu spadne na par piksela i ne moze se procitati - pa se tamo
 * prikazuje tekst, a slika se krije. CSS bira sta ce se vidjeti.
 */
const TEKST =
  '<div class="upoz-tekst">'
  + '<p><b>Ovo nije službena stranica</b> i nije povezana ni s jednom '
  + 'institucijom. Privatni je projekat, napravljen da pomogne pri računanju.</p>'
  + '<p>Stope, računi i šifre općina <b>provjereni su kod Porezne uprave FBiH</b>, ali se propisi mijenjaju. '
  + '<b>Prije uplate provjeri iznose</b> kod Porezne uprave FBiH, u banci ili '
  + 'kod knjigovođe.</p>'
  + '<p class="upoz-dobro">Sve što upišeš ostaje u tvom browseru — ništa se '
  + 'ne šalje nigdje.</p>'
  + '</div>';

const SLIKA =
  '<span class="upoz-slika-okvir">'
  + '<img class="upoz-slika" src="' + slikaUrl + '" alt="' + ALT + '"'
  + ' width="738" height="591">'
  + '</span>'
  + TEKST;

/**
 * Sirina prozora.
 *
 * Prozor treba da zauzme skoro cijeli ekran, ali nikad vise od njega:
 * podloga blokira klikove i stranica se ne skrola, pa sve sto zavrsi
 * ispod ivice — a to je uvijek dugme — vise nije dohvatljivo.
 *
 * Slika je 738x591 (omjer 1.2487) i zauzima cijelo tijelo, pa sirina
 * prozora slijedi iz visine koja mu preostane. Tri granice:
 *   96vw                    — skoro cijela sirina ekrana
 *   (100dvh - 150) * 1.2487 — koliko stane u visinu
 *   2400px                  — da na televizoru ne postane bilbord
 *
 * 150px je okvir oko slike, izmjeren a ne procijenjen: naslovna traka
 * 30, tijelo 12+12, podnozje 1+10+46+10 = 67, ivice prozora 2 i razmak
 * do ivice ekrana 20 — ukupno 143, plus nekoliko piksela zraka. Ako se
 * promijeni visina dugmeta, mijenja se i ovaj broj (veliki.css ga ima
 * svoj, jer tamo dugme raste).
 *
 * Dvije vrijednosti, kao dva reda u CSS-u: browser koji ne zna `dvh`
 * uzme prvu. Bez rezerve bi cijelo pravilo palo, prozor bi ostao bez
 * zadate sirine i slika bi se razvukla.
 * `prozor.css` isti obrazac vec koristi za visinu bocnog prozora.
 */
const SIRINA = [
  'min(2400px, 96vw, calc((100vh - 150px) * 1.2487))',
  'min(2400px, 96vw, calc((100dvh - 150px) * 1.2487))',
];

function vecVidjeno() {
  try {
    return localStorage.getItem(KLJUC) === 'da';
  } catch {
    // storage nedostupan - radije prikazi nego preskoci
    return false;
  }
}

function zapamti() {
  try { localStorage.setItem(KLJUC, 'da'); } catch { /* svejedno */ }
}

/**
 * @returns {Object} prozor za ponovno otvaranje iz menija
 */
export function napraviUpozorenje() {
  // Verzija za meni — obican dijalog sa ✕ i Escapeom.
  /*
   * Ne mijenja velicinu. Velicinu mu racuna SIRINA iz velicine ekrana i
   * omjera slike, i to je jedina velicina u kojoj slika stane cijela i
   * dugme ostane u vidnom polju. Hvatista su nudila da se to pokvari.
   */
  const izMenija = napraviProzor({
    naslov: 'Upozorenje',
    sirina: SIRINA,
    klasa: 'upoz-prozor',
    animacija: true,
    sadrzaj: SLIKA,
    dugmad: [{ tekst: 'Zatvori', primarno: true }],
  });

  if (!vecVidjeno()) {
    // Verzija za prvi susret — mora se potvrditi.
    const obavezno = napraviProzor({
      naslov: 'Upozorenje',
      sirina: SIRINA,
      klasa: 'upoz-prozor',
      animacija: true,
      odbaciv: false,
      dugmad: [{
        tekst: 'Razumijem',
        primarno: true,
        naKlik: () => { zapamti(); obavezno.unisti(); },
      }],
      sadrzaj: SLIKA,
    });
    obavezno.otvori();
  }

  return izMenija;
}

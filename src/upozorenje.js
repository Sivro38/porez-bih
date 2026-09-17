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
  'Stope, računi i šifre općina upisani su ručno i mogu biti zastarjeli. ' +
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
  + '<p>Stope, računi i šifre općina upisani su ručno i mogu biti zastarjeli. '
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
 * Sirina prozora. Slika je 738x591 (omjer 1.2487), pa se sirina veze i
 * za visinu ekrana - inace bi na nizim ekranima izasla iz vidnog polja
 * i morala se skrolati. 170px je otprilike naslovna traka, padding,
 * podnozje sa dugmetom i margine prozora.
 */
const SIRINA = 'min(1476px, 94vw, calc((100dvh - 170px) * 1.2487))';

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
  const izMenija = napraviProzor({
    naslov: 'Upozorenje',
    sirina: SIRINA,
    klasa: 'upoz-prozor',
    promjenjivo: true,
    najmanjaSirina: 320,
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
    promjenjivo: true,
    najmanjaSirina: 320,
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

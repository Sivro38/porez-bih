import { STORAGE_KEY, OPCINE_ZEDO, ZADANA_OPCINA } from './config.js';

/**
 * Licni podaci koje korisnik upisuje jednom, a koriste se na svim
 * uplatnicama i na obrascu AMS-1035. Cuvaju se u localStorage - nikad
 * ne napustaju browser.
 *
 * Poziv na broj i proracunska organizacija vise nisu ovdje - uvijek su
 * nule, pa su prebaceni u FIKSNE_NULE u config.js.
 *
 * Unos bez `key`, a sa `grupa`, nije polje nego naslov sekcije.
 * `siroko: true` znaci da polje uzima cijeli red umjesto pola.
 */
export const POLJA = [
  { key: 'ime',      label: 'Ime i prezime',              tip: 'text' },
  { key: 'adresa',   label: 'Adresa',                     tip: 'text' },
  { key: 'telefon',  label: 'Telefon',                    tip: 'text' },
  { key: 'racun',    label: 'Tvoj račun (pošiljaoca)',    tip: 'cifre', duzina: 16 },
  { key: 'obveznik', label: 'JMBG / broj poreznog obveznika', tip: 'cifre', duzina: 13 },
  { key: 'opcina',   label: 'Općina', tip: 'izbor',
    opcije: OPCINE_ZEDO.map(o => ({ vrijednost: o.sifra, tekst: o.naziv + ' — ' + o.sifra })) },
  { key: 'mjesto',   label: 'Mjesto uplate',              tip: 'text' },
  { key: 'datum',    label: 'Datum uplate',               tip: 'datum' },
  { key: 'periodOd', label: 'Porezni period — od',        tip: 'datum' },
  { key: 'periodDo', label: 'Porezni period — do',        tip: 'datum' },

  /* Isplatilac iz inostranstva — polja 6, 7 i 8 obrasca AMS-1035.
     Uplatnicama ne treba, ali stoji ovdje sa ostalim licnim podacima
     pa ga i profili nose. */
  { grupa: 'Obrazac AMS-1035 — isplatilac iz inostranstva' },
  { key: 'isplatilacNaziv',  label: 'Naziv isplatioca',  tip: 'text' },
  { key: 'isplatilacDrzava', label: 'Država',            tip: 'text' },
  { key: 'isplatilacAdresa', label: 'Adresa isplatioca', tip: 'text', siroko: true },
];

/** Samo prava polja, bez naslova sekcija. */
export const POLJA_UNOSA = POLJA.filter(f => f.key);

/** Zadane vrijednosti za prazan profil. */
const PRAZNO = {
  ...Object.fromEntries(POLJA_UNOSA.map(f => [f.key, ''])),
  opcina: ZADANA_OPCINA,
  autoDatum: false,   // "Datum uplate = danas" prekidac
  potpis: false,      // ispisuje [TVOJ POTPIS] na mjestu potpisa
};

/** Naziv opcine za datu sifru, ili prazno. */
export function nazivOpcine(sifra) {
  const o = OPCINE_ZEDO.find(x => x.sifra === sifra);
  return o ? o.naziv : '';
}

/** Ucitaj podatke; vrati prazan set ako nema nista ili je storage nedostupan. */
export function ucitaj() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...PRAZNO };
    return { ...PRAZNO, ...JSON.parse(raw) };
  } catch {
    // private mode, ugasen storage, pokvaren JSON - radi dalje bez njega
    return { ...PRAZNO };
  }
}

/** Snimi podatke. Vrati true ako je uspjelo. */
export function snimi(podaci) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(podaci));
    return true;
  } catch {
    return false;
  }
}

/** Obrisi snimljene podatke. */
export function obrisi() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

/** "2026-09-09" -> "09092026" (za kucice DD/MM/GGGG na obrascu) */
export function datumCifre(iso) {
  if (!iso) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? m[3] + m[2] + m[1] : '';
}

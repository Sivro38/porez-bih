import {
  STORAGE_KEY, ZADANA_OPCINA, KANTONI,
  kantonOpcine, kantonPoKljucu, opcinaPoSifri,
} from './config.js';

/**
 * Licni podaci koje korisnik upisuje jednom, a koriste se na svim
 * uplatnicama i na obrascu AMS-1035. Cuvaju se u localStorage - nikad
 * ne napustaju browser.
 *
 * Poziv na broj i proracunska organizacija vise nisu ovdje - uvijek su
 * nule, pa su prebaceni u FIKSNE_NULE u config.js.
 *
 * KANTON SE NE PAMTI POSEBNO. Izvodi se iz opcine (kantonOpcine), jer su
 * sifre opcina jedinstvene u cijeloj Federaciji. Tako kanton i opcina ne
 * mogu otici svaki na svoju stranu, podaci iz 1.1 (koji imaju samo
 * opcinu) rade bez ikakvog prenosa, a profili nose kanton sami od sebe.
 *
 * Unos bez `key`, a sa `grupa`, nije polje nego naslov grupe. Naslov
 * prve grupe stoji u podaci.js, jer ona pocinje bez takvog unosa.
 *
 * `usko: true` je za polja kojima duzina unosa nije ni priblizno sirina
 * reda — JMBG, datum, telefon. Rastegnuto polje obecava vise nego sto
 * prima, pa takvo stoji na svojoj mjeri.
 *
 * Natpisi su kratki jer stoje u koloni lijevo od polja; sta je sta kaze
 * naslov grupe iznad ("Naziv" pod isplatiocem je naziv isplatioca).
 *
 * `opcije` moze biti i funkcija trenutnih podataka — opcine zavise od
 * kantona.
 */
export const POLJA = [
  /* Prva grupa: podaci o samom obvezniku. */
  { key: 'ime',      label: 'Ime i prezime', tip: 'text' },
  { key: 'adresa',   label: 'Adresa',        tip: 'text' },
  { key: 'telefon',  label: 'Telefon',       tip: 'text',  usko: true },
  { key: 'obveznik', label: 'JMBG',          tip: 'cifre', duzina: 13, usko: true },

  { grupa: 'Uplata' },
  { key: 'racun',    label: 'Tvoj račun', tip: 'cifre', duzina: 16 },
  { key: 'opcina',   label: 'Općina', tip: 'izbor',
    opcije: p => kantonPodataka(p).opcine.map(o => ({ vrijednost: o.sifra, tekst: o.naziv + ' — ' + o.sifra })) },
  { key: 'mjesto',   label: 'Mjesto uplate', tip: 'text' },
  /* Datum uplate stoji uz uplatu, a ne u zajednickoj grupi "Datumi" sa
     poreznim periodom: to su dvije razlicite stvari i jedna se stalno
     mijenja, druga skoro nikad. */
  { key: 'datum',    label: 'Datum uplate',  tip: 'datum', usko: true },

  { grupa: 'Porezni period' },
  { key: 'periodOd', label: 'Od',  tip: 'datum', usko: true },
  { key: 'periodDo', label: 'Do',  tip: 'datum', usko: true },

  /* Isplatilac iz inostranstva — polja 6, 7 i 8 obrasca AMS-1035.
     Uplatnicama ne treba, ali stoji ovdje sa ostalim licnim podacima
     pa ga i profili nose. */
  { grupa: 'Isplatilac iz inostranstva — za AMS-1035' },
  { key: 'isplatilacNaziv',  label: 'Naziv',   tip: 'text' },
  { key: 'isplatilacDrzava', label: 'Država',  tip: 'text', usko: true },
  { key: 'isplatilacAdresa', label: 'Adresa',  tip: 'text' },
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

/** Kanton kojem pripadaju podaci (po opcini). Nikad null. */
export function kantonPodataka(p) {
  return kantonOpcine(p && p.opcina) || kantonPoKljucu(null);
}

/** Naziv opcine za datu sifru, ili prazno. */
export function nazivOpcine(sifra) {
  const o = opcinaPoSifri(sifra);
  return o ? o.naziv : '';
}

/**
 * Sta se upisuje u "Mjesto uplate" kad se izabere opcina. Najcesce je to
 * naziv opcine, ali gradske opcine Sarajeva daju "Sarajevo", a Grad
 * Mostar "Mostar" — "Centar" nije mjesto.
 */
export function mjestoOpcine(sifra) {
  const o = opcinaPoSifri(sifra);
  return o ? (o.mjesto || o.naziv) : '';
}

/*
 * Sve sto program sam upise u "Mjesto uplate". Ako polje drzi nesto od
 * ovoga, smije ga pregaziti; ako drzi nesto drugo, to je upisao korisnik
 * i ne dira se.
 */
const AUTO_MJESTA = new Set(KANTONI.flatMap(k =>
  k.opcine.flatMap(o => [o.naziv, o.mjesto].filter(Boolean))));

/** Da li je mjesto upisao program (ili je prazno), pa ga smije zamijeniti. */
export function mjestoJeAutomatsko(mjesto) {
  const m = String(mjesto ?? '').trim();
  return !m || AUTO_MJESTA.has(m);
}

/**
 * Promijeni kanton: opcina skace na sjediste novog kantona, a mjesto
 * uplate se mijenja samo ako ga je program sam upisao.
 * @returns {{ p: Object, opcina: Object }} novi podaci i postavljena opcina
 */
export function promijeniKanton(p, kljuc) {
  const k = kantonPoKljucu(kljuc);
  const novi = { ...p };
  if (kantonOpcine(novi.opcina) !== k) {
    novi.opcina = k.zadanaOpcina;
    if (mjestoJeAutomatsko(novi.mjesto)) novi.mjesto = mjestoOpcine(novi.opcina);
  }
  return { p: novi, opcina: opcinaPoSifri(novi.opcina) };
}

/** Ucitaj podatke; vrati prazan set ako nema nista ili je storage nedostupan. */
export function ucitaj() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...PRAZNO };
    const p = { ...PRAZNO, ...JSON.parse(raw) };
    // Nepoznata sifra (rucno petljanje, ili sifra koje vise nema) vraca
    // se na zadanu, da uplatnica nikad ne ostane bez kantona.
    if (!opcinaPoSifri(p.opcina)) p.opcina = ZADANA_OPCINA;
    return p;
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

/**
 * "2026-09-09" -> "090926" — porezni period na nalogu je dd/mm/gg, sest
 * cifara (Pravilnik o nacinu uplate, tacka 10.2, polja 12 i 13).
 */
export function datumSestCifara(iso) {
  const d = datumCifre(iso);
  return d ? d.slice(0, 4) + d.slice(6, 8) : '';
}

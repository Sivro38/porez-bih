import { REDOVI, PRIMAOCI, punNaziv, punaSvrha } from './config.js';
import { stope } from './stope.js';
import { fmt, fmtPct } from './format.js';

/**
 * Priprema podataka za izvoz - cista logika, bez jsPDF-a, SheetJS-a i
 * bez Vite-specificnih importa. Zato se moze testirati u Node-u.
 */

/** Feninzi -> broj u KM, za Excel celije koje moraju biti racunljive. */
export const km = fening => Math.round(fening) / 100;

/**
 * Ime fajla: "obracun-2026-08-1000KM".
 *
 * Nosi period i iznos jer se izvozi gomilaju u istom folderu, a sam
 * datum ne kaze nista o tome sta je unutra. Period ima prednost nad
 * danasnjim datumom — obracun se odnosi na njega, ne na dan kad je
 * spremljen.
 */
export function nazivFajla(r, podaci) {
  const m = /^(\d{4})-(\d{2})-\d{2}$/.exec(podaci.periodOd || '');
  const kada = m ? m[1] + '-' + m[2] : new Date().toISOString().slice(0, 10);
  const iznos = Math.round((r?.osnovica || 0) / 100);
  return 'obracun-' + kada + '-' + iznos + 'KM';
}

/** Redovi obracuna - dijele ih i PDF i Excel. */
export function redoviObracuna(r) {
  const out = [];
  for (const red of REDOVI) {
    if (red.sekcija) { out.push({ sekcija: red.sekcija }); continue; }
    // `stopa` je funkcija trenutnih stopa, ne broj — mnozenje broja sa
    // funkcijom je tiho davalo NaN u svakom izvozu.
    const postotak = red.stopa === null
      ? (r.osnovica > 0 ? fmtPct(r[red.id] / r.osnovica * 100) : '—')
      : fmtPct(red.stopa(stope()) * 100);
    out.push({ naziv: red.naziv, postotak, fening: r[red.id], id: red.id });
  }
  return out;
}

/**
 * List "Obračun" kao niz redova.
 *
 * Bez zaglavlja sa licnim podacima: izvoz je racun, ne licna karta. Ime,
 * JMBG i adresa nemaju sta traziti u tabeli koja se salje dalje. Period
 * i iznos nosi ime fajla.
 */
export function aoaObracun(r) {
  const redovi = [];
  redovi.push(['Stavka', '%', 'Iznos (KM)']);
  redoviObracuna(r).forEach(x => {
    if (x.sekcija) redovi.push([x.sekcija]);
    else redovi.push([x.naziv, x.postotak, km(x.fening)]);
  });
  return redovi;
}

/** List "Uplatnice" kao niz redova. */
export function aoaUplatnice(r) {
  const redovi = [['#', 'Primalac', 'Račun primaoca', 'Vrsta prihoda', 'Svrha', 'Iznos (KM)']];
  PRIMAOCI.forEach((p, i) => {
    redovi.push([i + 1, punNaziv(p), p.acc, p.vrsta, punaSvrha(p), km(r[p.key])]);
  });
  redovi.push([]);
  redovi.push(['', '', '', '', 'Ukupno', km(r.ukupno)]);
  return redovi;
}

/** Redovi tabele uplatnica za PDF. */
export function redoviUplatnicaPDF(r) {
  return PRIMAOCI.map((p, i) => [String(i + 1), punNaziv(p), p.acc, p.vrsta, fmt(r[p.key])]);
}

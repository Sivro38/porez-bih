import { STRANICE, POLJA } from './gpd-raspored.js';
import { fmt } from './format.js';
import { datumCifre } from './storage.js';

/*
 * Sluzbeni PDF obrasca, iz registra Porezne uprave (pufbih.ba/api/obrasci,
 * sifra GPD-1051). Postoje i hrvatska i srpska verzija; ovdje je bosanska.
 */
export const GPD_PDF =
  'https://www.pufbih.ba/v1/public/upload/obrasci/a9d63-94b8a-obrazac_gpd_1051_ver1__bos_web2.pdf';

/**
 * Obrazac GPD-1051 — Godisnja prijava poreza na dohodak, dvije stranice A4.
 *
 * Crta se kao AMS: po koordinatama iz `gpd-raspored.js`, koji generise
 * `alati/izvuci-gpd.py` iz sluzbenog PDF-a, 1pt = 1px. Iz istog PDF-a su
 * izvucena i polja (POLJA): mjesta cifara perioda, kucice za JMB i
 * godinu, i za svaki red obrasca sredina reda i ivice kolona. Ovdje se
 * nista ne pozicionira napamet.
 *
 * Sta se upisuje (vidi godisnji.js za racun):
 *   Dio 1:  JMB, prezime i ime, adresa, telefon, e-mail, porezni period
 *   Dio 2:  red 8 (ako ga ima), 13, 15, 16 ili 17
 *   Dio 3:  redovi 18–21
 *   Dio 4:  redovi 22–31; red 27 ostaje prazan (ne vazi za freelancere)
 *   Red 32: kucica a ili b ako je preplata, i racun za povrat
 *
 * Sta se NE upisuje: kucica 4) (promjena kontakt podataka — program to ne
 * zna) i datum u Dijelu 5, jer je to dan predaje, koji se pise rukom.
 */

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
const stil = o => Object.entries(o)
  .map(([k, v]) => k + ':' + (typeof v === 'number' ? v + 'px' : v)).join(';');

const tekstNa = (sadrzaj, polozaj, klase) =>
  '<span class="gpd-v ' + (klase || '') + '" style="' + stil(polozaj) + '">' + sadrzaj + '</span>';

/* ---------- staticki sloj: crte i natpisi, jednom po stranici ---------- */

const staticki = [];

function statickiHTML(i) {
  if (staticki[i]) return staticki[i];
  const s = STRANICE[i];
  // Plohe prvo, crte preko njih; boja iz podataka, crna kad je nema.
  const crte = s.kutije.concat(s.linije).map(([x, y, w, h, boja]) =>
    '<i class="gpd-c" style="' + stil({ left: x, top: y, width: w, height: h, background: boja || '#000' }) + '"></i>'
  ).join('');
  const natpisi = s.tekst.map(t =>
    '<span class="gpd-n' + (t.b ? ' gpd-deb' : '') + (t.i ? ' gpd-kurz' : '') + '"'
    + ' style="' + stil({ left: t.x, top: t.y, 'font-size': t.v }) + '">' + esc(t.t) + '</span>'
  ).join('');
  staticki[i] = crte + natpisi;
  return staticki[i];
}

/* ---------- dinamicki sloj ---------- */

/** Cifre u niz kucica; visak se zanemaruje. */
function uKucice(niz, cifre) {
  const s = String(cifre ?? '');
  return niz.x.map((x, i) => s[i]
    ? tekstNa(esc(s[i]), { left: x, top: niz.y, width: niz.w, height: niz.h, 'line-height': niz.h + 'px' }, 'gpd-kucica')
    : '').join('');
}

/** Cifre perioda na mjesta crtica "|_|_|_|_|" iz zaglavlja. */
function naCrtice(centri, cifre, y) {
  const s = String(cifre ?? '');
  return centri.map((x, i) => s[i]
    ? tekstNa(esc(s[i]), { left: x - 5, top: y - 1, width: 10 }, 'gpd-cifra')
    : '').join('');
}

/** Iznos u celiji reda, desno poravnat, okomito na sredini reda. */
function iznos(polja, red, kolona, fening, predznak) {
  const r = polja.redovi[red];
  if (!r || fening === null || fening === undefined) return '';
  const [x0, x1] = r[kolona];
  const tekst = (predznak && fening > 0 ? '+' : '') + fmt(fening);
  return tekstNa(esc(tekst), { left: x0, top: r.y - 6, width: x1 - x0 - 5, height: 12, 'line-height': '12px' }, 'gpd-iznos');
}

const naCrti = (vrijednost, polje, sirina) =>
  vrijednost ? tekstNa(esc(vrijednost), { left: polje.x, top: polje.y, width: sirina }, 'gpd-upis') : '';

/** "2026-03-15" -> "1503" (dan i mjesec, za zaglavlje "za period od ... do ...") */
const danMjesec = iso => datumCifre(iso).slice(0, 4);

/** "X" u kucicu za oznaku. */
const oznaka = k => k
  ? tekstNa('X', { left: k.x, top: k.y, width: k.w, height: k.h, 'line-height': k.h + 'px' }, 'gpd-x')
  : '';

function prvaStranica(g, u, p) {
  const P = POLJA[0];
  const R = g.redovi;
  const ako = v => (v > 0 ? v : null);
  return naCrtice(P.period.od, danMjesec(u.periodOd), P.period.y)
    + naCrtice(P.period.do, danMjesec(u.periodDo), P.period.y)
    + uKucice(P.jmb, p.obveznik)
    + uKucice(P.godina, String(u.godina).slice(2))
    + naCrti(p.ime, P.ime, 280)
    + naCrti(p.adresa, P.adresa, 280)
    + naCrti(p.telefon, P.telefon, 150)
    + naCrti(u.email, P.email, 155)
    // Dio 2: dohodak je u koloni d (dobit); gubitak program ne racuna.
    + iznos(P, 8, 'd', ako(R[8]))
    + iznos(P, 13, 'd', R[13])
    + iznos(P, 15, 'c', ako(R[15].c))
    + iznos(P, 15, 'd', R[15].d)
    + iznos(P, 16, 'c', ako(R[16]))
    + iznos(P, 17, 'd', R[17])
    // Dio 3
    + iznos(P, 18, 'c', R[18])
    + iznos(P, 19, 'c', ako(R[19]))
    + iznos(P, 20, 'c', ako(R[20]))
    + iznos(P, 21, 'c', R[21]);
}

function drugaStranica(g, u, p) {
  const P = POLJA[1];
  const R = g.redovi;
  const ako = v => (v > 0 ? v : null);
  let html = naCrti(p.ime, P.ime, 100)
    + uKucice(P.jmb, p.obveznik)
    + uKucice(P.godina, String(u.godina).slice(2))
    + iznos(P, 22, 'c', ako(R[22]))
    + iznos(P, 23, 'c', R[23])
    + iznos(P, 24, 'c', R[24])
    + iznos(P, 25, 'c', R[25])
    + iznos(P, 26, 'c', R[26])
    + iznos(P, 28, 'c', ako(R[28]))
    + iznos(P, 29, 'c', R[29])
    + iznos(P, 30, 'c', ako(R[30]))
    // Red 31 nosi predznak, kao sto obrazac trazi: + doplata, - povrat.
    + iznos(P, 31, 'c', R[31], true);

  // Red 32 vazi samo kad je preplata (red 31 ispod nule).
  if (R[31] < 0) {
    html += oznaka(u.preplata === 'a' ? P.kucicaA : P.kucicaB);
    if (u.preplata !== 'a') html += naCrti(p.racun, P.racun, 205);
  }
  if (p.potpis) html += tekstNa('[TVOJ POTPIS]', { left: P.potpis.x + 120, top: P.potpis.y }, 'gpd-potpis');
  return html;
}

/**
 * Cijeli obrazac: dvije stranice jedna ispod druge.
 * @param {Object} g obracun iz obracunGodisnji
 * @param {Object} u unos (godina, period, e-mail, preplata)
 * @param {Object} p licni podaci iz Moji podaci
 */
export function renderGPD(g, u, p) {
  const stranica = (i, dinamicki) =>
    '<div class="gpd-stranica" style="' + stil({ width: STRANICE[i].sirina, height: STRANICE[i].visina }) + '">'
    + statickiHTML(i) + dinamicki + '</div>';
  return '<div class="gpd-papir">'
    + stranica(0, prvaStranica(g, u, p))
    + stranica(1, drugaStranica(g, u, p))
    + '</div>';
}

/** Prava velicina jedne stranice, za skalu u prozoru. */
export const GPD_STRANICA = { sirina: STRANICE[0].sirina, visina: STRANICE[0].visina };

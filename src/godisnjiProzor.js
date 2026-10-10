import { napraviProzor } from './prozor.js';
import * as ikone from './ikone.js';
import { stampaj } from './ispis.js';
import { ucitaj } from './storage.js';
import { VRSTE_PRIHODA } from './config.js';
import { fmt } from './format.js';
import { obracunGodisnji, prazanUnos, nazivMjeseca, brojMjeseci } from './godisnji.js';
import { renderGPD, GPD_PDF, GPD_STRANICA } from './gpd.js';

/**
 * Prozor "Godisnja prijava — GPD-1051".
 *
 * Cetiri kartice, kao XP-ov prozor sa svojstvima:
 *   Prihodi           iznosi po mjesecima, uplata po uplata
 *   Odbici i ostalo   licni odbitak, troskovi, plata, porez iz inostranstva
 *   Obracun           redovi obrasca, povrat ili doplata, prilozi, rok
 *   Obrazac           popunjen GPD-1051, dvije stranice, i ispis
 *
 * Unos se pamti u localStorage pod `porez.godisnji.v1` (prefiks porez.,
 * pa ga "Obrisi sve podatke" brise kao i ostalo). Licni podaci (ime,
 * JMB, adresa, racun) se ne unose ovdje nego citaju iz "Moji podaci".
 *
 * Racun je u godisnji.js; ovdje je samo sucelje.
 */

const KLJUC = 'porez.godisnji.v1';

const VEZA_PRAVILNIK_PRIMJENA = 'https://pufbih.ba/v1/public/upload/zakoni/16_02_2026teksta%20Pravilnika%20o%20primjeni%20Zakona%20o%20porezu%20na%20dohodak_12_26/16_02_2026_PRECISCENI%20Pravilnik%20o%20primjeni%20Zakona%20o%20porezu%20na%20dohodak%2012-26.pdf';
const VEZA_ZAKON = 'https://www.pufbih.ba/v1/public/upload/zakoni/d9bf6-zakon-o-porezu-na-dohodak-ispravan-tekst.pdf';
const VEZA_KONTAKTI = 'https://www.pufbih.ba/kontakti';
const VEZA_VODIC = 'https://pufbih.ba/freelanceri';

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
const veza = (url, tekst) => '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + tekst + ' ↗</a>';

/* Isti crveni okvir kao u Pomoci (klasa je u uputstvo.css): bez garancije,
   na vrhu i na dnu obracuna. */
const NE_GARANTUJEMO =
  '<p class="up-negarancija"><b>Ništa od ovoga nije garantovano.</b> Ovo nije službena stranica. '
  + 'Niko ne može garantovati da su obračun, redovi obrasca, navodi i citati iz zakona i pravilnika, '
  + 'niti bilo koja druga tvrdnja ovdje tačni, potpuni i važeći. Prije predaje sve potvrdi kod '
  + 'Porezne uprave FBiH ili kod knjigovođe. Odgovornost za prijavu je na tebi — vidi '
  + '<b>Pomoć → Pravno i privatnost</b>.</p>';

function ucitajUnos() {
  const prazno = prazanUnos();
  try {
    const raw = localStorage.getItem(KLJUC);
    if (!raw) return prazno;
    const s = JSON.parse(raw);
    return {
      ...prazno, ...s,
      uplate: Array.isArray(s.uplate) && s.uplate.length ? s.uplate : prazno.uplate,
    };
  } catch {
    return prazno;
  }
}

function snimiUnos(u) {
  try { localStorage.setItem(KLJUC, JSON.stringify(u)); } catch { /* storage nedostupan */ }
}

/** "2026-03-15" -> "15.03.2026." */
const datumTacke = iso => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  return m ? m[3] + '.' + m[2] + '.' + m[1] + '.' : '';
};

/* ---------- kartica Prihodi ---------- */

function prihodiHTML(u, g) {
  const godinaSada = new Date().getFullYear();
  const godine = [godinaSada, godinaSada - 1, godinaSada - 2, godinaSada - 3];
  if (!godine.includes(Number(u.godina))) godine.push(Number(u.godina));

  // Uplate po mjesecima, redom kojim su unesene unutar mjeseca.
  const redovi = [];
  for (let m = 1; m <= 12; m++) {
    const uMjesecu = u.uplate.map((x, i) => ({ x, i })).filter(({ x }) => Number(x.mjesec) === m);
    uMjesecu.forEach(({ x, i }, n) => {
      const r = g.uplate.find(y => y.i === i);
      redovi.push(
        '<tr' + (n === 0 ? ' class="gd-prvi"' : '') + '>'
        + '<td class="gd-mjesec">' + (n === 0 ? nazivMjeseca(m) : '') + '</td>'
        + '<td><input class="gd-polje gd-iznos" inputmode="decimal" data-gd-uplata="' + i + '" data-gd-polje="iznos"'
          + ' value="' + esc(x.iznos) + '" placeholder="0,00" aria-label="Iznos, ' + nazivMjeseca(m) + '"></td>'
        + '<td><select class="gd-polje gd-vrsta" data-gd-uplata="' + i + '" data-gd-polje="vrsta" aria-label="Vrsta prihoda">'
          + VRSTE_PRIHODA.map(v => '<option value="' + v.key + '"' + (v.key === x.vrsta ? ' selected' : '') + '>'
            + esc(v.kratko) + '</option>').join('')
          + '</select></td>'
        + '<td class="gd-broj" data-gd-obracunat="' + i + '">' + (r ? fmt(r.r.porez) : '—') + '</td>'
        + '<td><input class="gd-polje gd-iznos" inputmode="decimal" data-gd-uplata="' + i + '" data-gd-polje="porezRucno"'
          + ' value="' + esc(x.porezRucno) + '" placeholder="' + (r ? fmt(r.r.porez) : '') + '"'
          + ' title="Ostavi prazno ako si uplatio tačno obračunati porez" aria-label="Porez stvarno uplaćen"></td>'
        + '<td class="gd-akcije">'
          + (n === 0
            ? '<button type="button" class="gd-mali" data-gd-akcija="dodaj" data-gd-mjesec="' + m + '" title="Dodaj još jednu uplatu u ovom mjesecu">+</button>'
            : '<button type="button" class="gd-mali" data-gd-akcija="ukloni" data-gd-uplata="' + i + '" title="Ukloni ovu uplatu">✕</button>')
        + '</td></tr>');
    });
  }

  return '<div class="gd-red">'
      + '<label class="gd-lbl">Porezna godina '
        + '<select class="gd-polje" data-gd-unos="godina">'
        + godine.sort((a, b) => b - a).map(x => '<option' + (x === Number(u.godina) ? ' selected' : '') + '>' + x + '</option>').join('')
        + '</select></label>'
      + '<label class="gd-lbl">Period od <input type="date" class="gd-polje" data-gd-unos="periodOd" value="' + esc(u.periodOd) + '"></label>'
      + '<label class="gd-lbl">do <input type="date" class="gd-polje" data-gd-unos="periodDo" value="' + esc(u.periodDo) + '"></label>'
    + '</div>'
    + '<p class="gd-savjet">Upiši iznos svake uplate u KM, isti koji si upisao na AMS-1035 za tu uplatu. '
      + 'Ako je u mjesecu bilo više uplata, dodaj ih sa <b>+</b>: svaka ima svoj AMS i svoje zaokruživanje. '
      + '„Porez uplaćen” ostavi prazno ako si uplatio tačno onoliko koliko je obračunato.</p>'
    + '<table class="gd-tabela">'
      + '<thead><tr><th>Mjesec</th><th>Iznos (KM)</th><th>Vrsta</th><th>Porez obračunat</th><th>Porez uplaćen</th><th></th></tr></thead>'
      + '<tbody>' + redovi.join('') + '</tbody>'
      + '<tfoot><tr><td>Ukupno</td>'
        + '<td class="gd-broj" data-gd-zbir="prihod">' + fmt(g.zbir.prihod) + '</td><td></td>'
        + '<td class="gd-broj" data-gd-zbir="porezObracunat">' + fmt(g.zbir.porezObracunat) + '</td>'
        + '<td class="gd-broj" data-gd-zbir="porezUplacen">' + fmt(g.zbir.porezUplacen) + '</td><td></td>'
      + '</tr></tfoot>'
    + '</table>';
}

/* ---------- kartica Odbici i ostalo ---------- */

function odbiciHTML(u, g, p) {
  const polje = (kljuc, natpis, savjet) =>
    '<label class="gd-stavka"><span class="gd-lbl-blok">' + natpis + '</span>'
    + '<input class="gd-polje gd-iznos" inputmode="decimal" data-gd-unos="' + kljuc + '" value="' + esc(u[kljuc]) + '" placeholder="0,00">'
    + (savjet ? '<span class="gd-sitno">' + savjet + '</span>' : '') + '</label>';
  const racun = p.racun ? esc(p.racun) : '— upiši svoj račun u Moji podaci —';
  return '<fieldset class="gd-grupa"><legend>Lični odbitak (red 18)</legend>'
      + '<label class="gd-stavka"><span class="gd-lbl-blok">Faktor iz porezne kartice</span>'
        + '<input class="gd-polje gd-kratko" inputmode="decimal" data-gd-unos="faktor" value="' + esc(u.faktor) + '">'
        + '<span class="gd-sitno">Bez izdržavanih je 1. Dodaje se 0,5 za bračnog druga, 0,5 za prvo dijete, 0,7 za drugo, '
        + '0,9 za treće i svako sljedeće, 0,3 za drugog izdržavanog člana uže porodice i 0,3 za invalidnost '
        + '(Zakon o porezu na dohodak, član 24.).</span></label>'
      + '<p class="gd-sitno" data-gd-mjeseci>Osnovni lični odbitak je 3.600,00 KM godišnje. Za period '
        + datumTacke(u.periodOd) + ' – ' + datumTacke(u.periodDo) + ' računa se ' + g.mjeseci
        + ' mjeseci, na pune mjesece u tvoju korist: ' + fmt(g.redovi[18]) + ' KM.</p>'
    + '</fieldset>'
    + '<fieldset class="gd-grupa"><legend>Uvećanje ličnog odbitka (redovi 19 i 20)</legend>'
      + polje('red19', 'Troškovi liječenja i lijekova (KM)', 'Samo uz validnu dokumentaciju ovlaštene zdravstvene ustanove, i samo ono što nije platilo osiguranje (član 24. stav 7.).')
      + polje('red20', 'Kamata na stambeni kredit (KM)', 'Kamata plaćena te godine za kredit kojim rješavaš svoje stambeno pitanje, uz dokumentaciju (član 24. stav 8.).')
    + '</fieldset>'
    + '<fieldset class="gd-grupa"><legend>Ako si iste godine imao i platu</legend>'
      + polje('red8', 'Dohodak od nesamostalne djelatnosti (red 8)', 'Iz obrasca GIP-1022 koji ti da poslodavac, kolona 11. Uz prijavu ide kopija GIP-1022.')
      + polje('red28', 'Porez po odbitku (red 28)', 'Porez koji je poslodavac već obustavio, iz istog GIP-1022.')
    + '</fieldset>'
    + '<fieldset class="gd-grupa"><legend>Porez plaćen u inostranstvu (red 30)</legend>'
      + polje('red30', 'Iznos (KM)', 'Samo uz dokaz o plaćenom porezu. Koliko se smije odbiti (član 35.) program ne provjerava.')
    + '</fieldset>'
    + '<fieldset class="gd-grupa"><legend>Ostalo</legend>'
      + '<label class="gd-stavka"><span class="gd-lbl-blok">E-mail (polje 7 obrasca)</span>'
        + '<input class="gd-polje" type="email" data-gd-unos="email" value="' + esc(u.email) + '"></label>'
      + '<div class="gd-stavka"><span class="gd-lbl-blok">Ako je preplata (red 32)</span>'
        + '<label class="xp-radio"><input type="radio" name="gd-preplata" value="b" data-gd-unos="preplata"'
          + (u.preplata !== 'a' ? ' checked' : '') + '> b. povrat na moj račun: ' + racun + '</label>'
        + '<label class="xp-radio"><input type="radio" name="gd-preplata" value="a" data-gd-unos="preplata"'
          + (u.preplata === 'a' ? ' checked' : '') + '> a. kao akontacija za sljedeću godinu</label>'
      + '</div>'
    + '</fieldset>';
}

/* ---------- kartica Obracun ---------- */

const OPISI = [
  [8, 'Dohodak od nesamostalne djelatnosti (plata)'],
  [13, 'Dohodak od drugih samostalnih djelatnosti — zbir osnovica za porez'],
  ['15d', 'Ukupno, kolona d (redovi 8 do 13)'],
  [17, 'Dobit (ukupan dohodak)'],
  [18, 'Lični odbitak'],
  [19, 'Troškovi liječenja i lijekova'],
  [20, 'Kamata na stambeni kredit'],
  [21, 'Ukupni odbici (18 + 19 + 20)'],
  [23, 'Ukupan dohodak za godinu'],
  [24, 'Ukupni odbici'],
  [25, 'Osnovica poreza na dohodak (23 − 22 − 24)'],
  [26, 'Iznos porezne obaveze (25 × 10%)'],
  [27, 'Umanjenje poreza (član 35. st. 3. i 47.) — ne odnosi se na freelancere'],
  [28, 'Porez po odbitku (obustavio poslodavac)'],
  [29, 'Uplaćene akontacije poreza (uz AMS-1035)'],
  [30, 'Porez plaćen u inostranstvu'],
  [31, 'Razlika: + doplata, − povrat (26 − 27 − 28 − 29 − 30)'],
];

function obracunHTML(u, g) {
  const R = g.redovi;
  const vrijednost = k => (k === '15d' ? R[15].d : R[k]);
  const r31 = R[31];
  const rezultat = r31 < 0
    ? '<div class="gd-rezultat gd-povrat">Povrat: <b>' + fmt(-r31) + ' KM</b></div>'
    : r31 > 0
      ? '<div class="gd-rezultat gd-doplata">Doplata: <b>' + fmt(r31) + ' KM</b></div>'
      : '<div class="gd-rezultat">Nema razlike za doplatu ni povrat.</div>';

  const prilozi = ['Primjerak svakog obrasca AMS-1035 iz te godine — ' + g.uplate.length + ' kom. (Pravilnik, član 76.)'];
  if (R[8] > 0) prilozi.push('Kopija obrasca GIP-1022 od poslodavca');
  if (R[19] > 0) prilozi.push('Dokumentacija o troškovima liječenja i lijekova (član 71. Pravilnika)');
  if (R[20] > 0) prilozi.push('Dokumentacija o plaćenoj kamati na stambeni kredit (član 72. Pravilnika)');
  if (R[30] > 0) prilozi.push('Dokaz o dohotku i porezu plaćenom u inostranstvu');

  return NE_GARANTUJEMO
    + rezultat
    + '<table class="gd-tabela gd-redovi">'
      + '<thead><tr><th>Red</th><th>Opis</th><th>Iznos (KM)</th></tr></thead><tbody>'
      + OPISI.map(([k, opis]) => {
          const v = vrijednost(k);
          return '<tr' + (k === 31 ? ' class="gd-istaknut"' : '') + '><td>' + String(k).replace('d', ' d') + '</td><td>'
            + esc(opis) + '</td><td class="gd-broj">' + (k === 31 && v > 0 ? '+' : '') + fmt(v) + '</td></tr>';
        }).join('')
      + '</tbody></table>'
    + '<h4 class="gd-podnaslov">Šta priložiti</h4><ul class="gd-spisak">' + prilozi.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>'
    + '<h4 class="gd-podnaslov">Rok i mjesto</h4>'
    + '<p>Do <b>31. marta ' + (Number(u.godina) + 1) + '.</b>, nadležnoj poreznoj ispostavi prema prebivalištu, ili elektronski '
      + 'uz kvalifikovanu potvrdu (Pravilnik o primjeni Zakona o porezu na dohodak, član 75.). ' + veza(VEZA_KONTAKTI, 'Ispostave') + '</p>'
    + '<h4 class="gd-podnaslov">Napomene</h4>'
    + '<ul class="gd-spisak">'
      + '<li>Red 13 je zbir „osnovica za porez” svih uplata: prihod minus priznati rashodi minus 4% zdravstvenog — isto što je na svakom AMS-1035.</li>'
      + '<li>Porez sa AMS-1035 je upisan u red 29. Službeno uputstvo koje razdvaja redove 28 i 29 nije nađeno; na red 31 to ne utiče, jer se oba oduzimaju.</li>'
      + '<li>Gubitak program ne računa (kolona c i red 22 ostaju prazni).</li>'
    + '</ul>'
    + '<p class="gd-veze">' + veza(GPD_PDF, 'Službeni obrazac GPD-1051') + ' · '
      + veza(VEZA_PRAVILNIK_PRIMJENA, 'Pravilnik o primjeni Zakona o porezu na dohodak') + ' · '
      + veza(VEZA_ZAKON, 'Zakon o porezu na dohodak') + ' · ' + veza(VEZA_VODIC, 'Vodič za freelancere') + '</p>'
    + NE_GARANTUJEMO;
}

/* ---------- kartica Obrazac ---------- */

function obrazacHTML() {
  return '<div class="gd-alat">'
      + '<span class="gd-sitno">Datum i potpis u Dijelu 5 pišu se rukom, na dan predaje.</span>'
      + '<a class="pd-btn gd-desno" href="' + GPD_PDF + '" target="_blank" rel="noopener noreferrer"'
        + ' title="Otvara službeni PDF Porezne uprave u novoj kartici">Službeni obrazac ↗</a>'
      + '<button type="button" class="pd-btn" data-gd-akcija="ispis">Ispis</button>'
    + '</div>'
    + '<div class="gpd-mount"></div>';
}

/* ---------- prozor ---------- */

const TABOVI = [
  ['prihodi', 'Prihodi'],
  ['odbici', 'Odbici i ostalo'],
  ['obracun', 'Obračun'],
  ['obrazac', 'Obrazac'],
];

/**
 * @param {Function} [onZatvaranju] za kvacicu u meniju
 */
export function napraviGodisnjiProzor(onZatvaranju) {
  let u = ucitajUnos();

  const prozor = napraviProzor({
    naslov: 'Godišnja prijava — GPD-1051',
    nazivNaTraci: 'Godišnja prijava',
    ikona: ikone.GODISNJA,
    sirina: [760, 'min(760px, 96vw)'],
    modalno: false,
    klasa: 'gd-prozor',
    klasaPodloge: 'gpd-overlay',
    promjenjivo: true,
    najmanjaSirina: 360,
    najmanjaVisina: 280,
    onPromjenaVelicine: () => skaliraj(),
    naZatvaranje: () => onZatvaranju && onZatvaranju(),
    sadrzaj:
      '<div class="gd-tabovi" role="tablist">'
      + TABOVI.map(([id, naziv], i) =>
          '<button type="button" role="tab" class="gd-tab' + (i === 0 ? ' aktivan' : '') + '"'
          + ' data-gd-tab="' + id + '" aria-selected="' + (i === 0) + '">' + naziv + '</button>').join('')
      + '</div>'
      + TABOVI.map(([id], i) =>
          '<div class="gd-ploca" role="tabpanel" data-gd-ploca="' + id + '"' + (i === 0 ? '' : ' hidden') + '></div>').join(''),
  });

  const tijelo = prozor.tijelo;
  const ploca = id => tijelo.querySelector('[data-gd-ploca="' + id + '"]');

  /** Skala obrasca: po sirini kartice, a dvije stranice se skroluju. */
  function skaliraj() {
    const p = ploca('obrazac');
    if (!p || p.hidden) return;
    const s = Math.min(1.6, Math.max(0.35, (p.clientWidth - 24) / GPD_STRANICA.sirina));
    p.style.setProperty('--gpd-skala', s.toFixed(3));
  }

  /** Precrtaj sve kartice (poslije dodavanja/uklanjanja reda, ili spolja). */
  function precrtaj() {
    const g = obracunGodisnji(u);
    const p = ucitaj();
    ploca('prihodi').innerHTML = prihodiHTML(u, g);
    ploca('odbici').innerHTML = odbiciHTML(u, g, p);
    ploca('obracun').innerHTML = obracunHTML(u, g);
    if (!ploca('obrazac').firstChild) ploca('obrazac').innerHTML = obrazacHTML();
    ploca('obrazac').querySelector('.gpd-mount').innerHTML = renderGPD(g, u, p);
    skaliraj();
  }

  /**
   * Osvjezi samo izracunato, bez diranja polja u kojem se kuca — inace bi
   * kursor iskakao iz polja na svaki znak.
   */
  function osvjeziIzracunato() {
    const g = obracunGodisnji(u);
    const p = ucitaj();
    u.uplate.forEach((x, i) => {
      const r = g.uplate.find(y => y.i === i);
      const celija = tijelo.querySelector('[data-gd-obracunat="' + i + '"]');
      if (celija) celija.textContent = r ? fmt(r.r.porez) : '—';
      const rucno = tijelo.querySelector('[data-gd-uplata="' + i + '"][data-gd-polje="porezRucno"]');
      if (rucno) rucno.placeholder = r ? fmt(r.r.porez) : '';
    });
    ['prihod', 'porezObracunat', 'porezUplacen'].forEach(k => {
      const c = tijelo.querySelector('[data-gd-zbir="' + k + '"]');
      if (c) c.textContent = fmt(g.zbir[k]);
    });
    const mj = tijelo.querySelector('[data-gd-mjeseci]');
    if (mj) mj.innerHTML = 'Osnovni lični odbitak je 3.600,00 KM godišnje. Za period '
      + datumTacke(u.periodOd) + ' – ' + datumTacke(u.periodDo) + ' računa se ' + brojMjeseci(u.periodOd, u.periodDo)
      + ' mjeseci, na pune mjesece u tvoju korist: ' + fmt(g.redovi[18]) + ' KM.';
    ploca('obracun').innerHTML = obracunHTML(u, g);
    ploca('obrazac').querySelector('.gpd-mount').innerHTML = renderGPD(g, u, p);
  }

  const promijeni = () => { snimiUnos(u); osvjeziIzracunato(); };

  tijelo.addEventListener('input', e => {
    const el = e.target;
    if (el.dataset.gdUplata !== undefined && el.dataset.gdPolje) {
      u.uplate[Number(el.dataset.gdUplata)][el.dataset.gdPolje] = el.value;
      promijeni();
    } else if (el.dataset.gdUnos && el.type !== 'radio') {
      u[el.dataset.gdUnos] = el.value;
      promijeni();
    }
  });

  tijelo.addEventListener('change', e => {
    const el = e.target;
    if (el.dataset.gdUnos === 'godina') {
      // Druga godina: period se pomjeri na nju, iznosi ostaju.
      const g = el.value;
      u.godina = Number(g);
      u.periodOd = g + '-01-01';
      u.periodDo = g + '-12-31';
      snimiUnos(u);
      precrtaj();
    } else if (el.dataset.gdUnos === 'preplata' && el.checked) {
      u.preplata = el.value;
      promijeni();
    }
  });

  tijelo.addEventListener('click', e => {
    const tab = e.target.closest('[data-gd-tab]');
    if (tab) {
      const id = tab.dataset.gdTab;
      tijelo.querySelectorAll('.gd-tab').forEach(b => {
        const da = b.dataset.gdTab === id;
        b.classList.toggle('aktivan', da);
        b.setAttribute('aria-selected', String(da));
      });
      tijelo.querySelectorAll('.gd-ploca').forEach(p => { p.hidden = p.dataset.gdPloca !== id; });
      skaliraj();
      return;
    }
    const akcija = e.target.closest('[data-gd-akcija]');
    if (!akcija) return;
    const vrsta = akcija.dataset.gdAkcija;
    if (vrsta === 'dodaj') {
      const m = Number(akcija.dataset.gdMjesec);
      // nova uplata ide iza zadnje u istom mjesecu
      let iza = -1;
      u.uplate.forEach((x, i) => { if (Number(x.mjesec) === m) iza = i; });
      u.uplate.splice(iza + 1, 0, { mjesec: m, iznos: '', vrsta: 'povremena', porezRucno: '' });
      snimiUnos(u);
      precrtaj();
    } else if (vrsta === 'ukloni') {
      u.uplate.splice(Number(akcija.dataset.gdUplata), 1);
      snimiUnos(u);
      precrtaj();
    } else if (vrsta === 'ispis') {
      prozor.stampaj();
    }
  });

  /** Spolja: promjena licnih podataka ili stopa. */
  prozor.osvjezi = () => { u = ucitajUnos(); precrtaj(); };

  /** Odstampaj obrazac (radi i kad je prozor zatvoren, kao AMS). */
  prozor.stampaj = () => {
    precrtaj();
    stampaj({
      klasa: 'print-gpd',
      naslov: 'Obrazac GPD-1051 — godišnja prijava poreza na dohodak',
      desno: 'Porezna godina ' + u.godina,
    });
  };

  const izvornoOtvori = prozor.otvori;
  prozor.otvori = () => { izvornoOtvori(); prozor.uklopi(); skaliraj(); return prozor; };

  precrtaj();
  window.addEventListener('resize', skaliraj);
  return prozor;
}

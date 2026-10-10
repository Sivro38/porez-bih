/*
 * Kalkulacija freelance prihoda — obracun poreza i doprinosa (FBiH).
 * Copyright (C) 2026 Emin Sivro
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { ZADANA_OSNOVICA, VERZIJA, VRSTE_PRIHODA, ZADANA_VRSTA, KANTONI } from './config.js';
import { obracun } from './calc.js';
import { parseInput, fmt } from './format.js';
import { renderTabela, popuniTabelu } from './tabela.js';
import { renderUplatnice, popuniIznose } from './uplatnice.js';
import { napraviPodatke } from './podaci.js';
import { napraviUplatniceProzor } from './uplatniceProzor.js';
import { napraviAMSProzor } from './ams.js';
import { napraviGodisnjiProzor } from './godisnjiProzor.js';
import { napraviPostavke } from './postavke.js';
import { pitajPaObrisi } from './brisanje.js';
import { stampaj, periodTekst } from './ispis.js';
import { napraviUpozorenje } from './upozorenje.js';
import { napraviUputstvo } from './uputstvo.js';
import { napraviPravno } from './pravno.js';
import { ucitaj, snimi, promijeniKanton, kantonPodataka } from './storage.js';
import { postaviBalonVeze } from './balon.js';
import { poveziMenije, napraviStatus, toggleKvacica } from './ui.js';
import { napraviProzor, podigniNaVrh } from './prozor.js';
import { omoguciPovlacenje } from './drag.js';
import { omoguciPromjenuVelicine } from './resize.js';
import * as traka from './traka.js';
import { napraviPrecice } from './precice.js';
import { napraviBiljesku } from './biljeska.js';
import { napraviNovosti, postaviNovosti } from './novosti.js';
import { napraviResurse } from './resursi.js';
import * as ikone from './ikone.js';
import { izvoziPDF, izvoziExcel } from './izvoz.js';

const OSNOVICA_KEY = 'porez.osnovica.v1';
const VRSTA_KEY = 'porez.vrsta.v1';

const $ = id => document.getElementById(id);
const osnovicaEl = $('osnovica');
const vrstaEl = $('vrsta-prihoda');
const kantonEl = $('kanton');
const glavniProzor = document.querySelector('.window');

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));

/** Izabrana vrsta prihoda (kljuc iz VRSTE_PRIHODA). */
let vrsta = ZADANA_VRSTA;

/*
 * Uputstvo se pravi nize, a osvjezava se i prije toga. Funkcija se
 * zamijeni kad uputstvo postoji; `typeof` nad jos neinicijalizovanim
 * `const` bi bacio ReferenceError (ista zamka kao kod amsProzor).
 */
let osvjeziUputstvo = () => {};
let osvjeziGodisnju = () => {};

/* ---------- glavni prozor na donjoj traci ---------- */

/*
 * Glavni prozor nije pravljen kroz napraviProzor() nego je statican u
 * HTML-u, pa traci daje isti skup metoda rucno. Prijavljuje se prvi da
 * mu dugme stoji krajnje lijevo.
 *
 * jeOtvoren() je uvijek tacno: aplikacija bi bez njega bila prazna, pa
 * se ne zatvara nego samo minimizira.
 */
const glavniApi = {
  jeOtvoren: () => true,
  jeMinimiziran: () => glavniProzor.classList.contains('minimiziran'),
  minimiziraj() {
    glavniProzor.classList.add('minimiziran');
    traka.osvjezi();
  },
  vrati() {
    glavniProzor.classList.remove('minimiziran');
    podigniNaVrh(glavniProzor);
    traka.postaviAktivni(glavniApi);
  },
};
traka.prijavi('Kalkulator', glavniApi);
traka.postaviAktivni(glavniApi);

/*
 * Ikona glavnog prozora u naslovnoj traci: kalkulator, isti kao favikona
 * u kartici (KALKULACIJA_16 — crtan za 16px, pa ostaje ostar).
 */
{
  const ico = glavniProzor.querySelector('.titletext .ico');
  ico.classList.add('sa-ikonom');
  ico.innerHTML = ikone.KALKULACIJA_16;
}

/* ---------- pocetno crtanje ---------- */

// Prozor sa uplatnicama se pravi prvi jer u sebi nosi #forms-mount.
// Obrasci se crtaju odmah, i kad je prozor zatvoren, da ispis nikad ne
// zatekne prazan sadrzaj.
const uplatniceProzor = napraviUplatniceProzor(
  () => { $('chk-uplatnice').textContent = ' '; }
);

/** Da li se % kolona vidi. Precrtavanje tabele mora ovo postovati. */
let prikaziPostotak = true;

/*
 * Tabela se precrtava kad se promijene stope — % kolona se izvodi iz
 * njih, pa bi inace pokazivala stare brojeve. Vidljivost kolone se
 * vraca rucno jer je nosi inline stil, koji precrtavanje obrise.
 */
function precrtajTabelu() {
  $('obracun-body').innerHTML = renderTabela(vrsta);
  document.querySelectorAll('.pct-col').forEach(el => {
    el.style.display = prikaziPostotak ? '' : 'none';
  });
}

precrtajTabelu();
renderUplatnice($('forms-mount'), ucitaj());
uplatniceProzor.osvjeziAktivnu();   // natpisi tabova nose naziv primaoca

/* ---------- obracun ---------- */

/** Zadnji izracun — koriste ga izvoz u PDF/Excel i obrazac AMS-1035. */
let zadnjiObracun = null;

/*
 * Obrazac se pravi nize, a preracunaj() ga zove i prije toga. Mora biti
 * `let` sa pocetnom vrijednoscu: `typeof` nad neinicijalizovanim `const`
 * ne vraca "undefined" nego baca ReferenceError.
 */
let amsProzor = null;

function preracunaj() {
  const r = obracun(parseInput(osnovicaEl.value), vrsta);
  zadnjiObracun = r;
  popuniTabelu(r);
  popuniIznose(r);
  if (amsProzor) amsProzor.osvjezi();   // pravi se kasnije od prvog poziva
}

function zapamtiOsnovicu() {
  try { localStorage.setItem(OSNOVICA_KEY, osnovicaEl.value); } catch { /* storage nedostupan */ }
}

/* ---------- vrsta prihoda ---------- */

/*
 * Mijenja samo postotak priznatih rashoda — 20% za povremenu samostalnu
 * djelatnost, 30% za autorsku naknadu. Tabela se mora PONOVO iscrtati,
 * ne samo popuniti: postotak stoji u samom HTML-u kolone "%", pa bi
 * inace ostao stari broj uz nove iznose.
 */
/*
 * Radio dugmad, ne padajuci izbor: izbora su samo dva, pa se oba vide
 * odjednom, a pola sirine ostaje za kanton.
 */
try {
  const spremljena = localStorage.getItem(VRSTA_KEY);
  if (spremljena && VRSTE_PRIHODA.some(v => v.key === spremljena)) vrsta = spremljena;
} catch { /* storage nedostupan */ }

vrstaEl.innerHTML = VRSTE_PRIHODA.map(v =>
  '<label class="xp-radio" title="' + esc(v.label + ' — ' + v.opis) + '">'
  + '<input type="radio" name="vrsta-prihoda" value="' + v.key + '"'
  + (v.key === vrsta ? ' checked' : '') + '>'
  + esc(v.kratko) + '</label>').join('');

function opisVrste() {
  const v = VRSTE_PRIHODA.find(x => x.key === vrsta);
  $('vrsta-opis').textContent = v ? v.label + ': ' + v.opis : '';
}
opisVrste();

vrstaEl.addEventListener('change', e => {
  const izabrano = e.target.closest('input[name="vrsta-prihoda"]');
  if (!izabrano) return;
  vrsta = izabrano.value;
  opisVrste();
  precrtajTabelu();
  preracunaj();
  try { localStorage.setItem(VRSTA_KEY, vrsta); } catch { /* svejedno */ }
  const v = VRSTE_PRIHODA.find(x => x.key === vrsta);
  setStatus('Vrsta prihoda: ' + (v ? v.label : vrsta));
});

/* ---------- kanton ---------- */

/*
 * Kanton se ne pamti posebno: izvodi se iz opcine u Moji podaci (vidi
 * storage.js). Izbor ovdje zato mijenja opcinu — skoci na sjediste novog
 * kantona — a uplatnice, panel i obrazac se precrtaju.
 */
kantonEl.innerHTML = KANTONI.map(k =>
  '<option value="' + k.key + '">' + esc(k.kratko) + '</option>').join('');

/** Postavi izbor kantona prema trenutnim podacima. */
function prikaziKanton() {
  kantonEl.value = kantonPodataka(ucitaj()).key;
}
prikaziKanton();

osnovicaEl.addEventListener('input', () => { preracunaj(); zapamtiOsnovicu(); });

// zadana vrijednost, pa je pregazi zadnji unos ako ga ima
osnovicaEl.value = ZADANA_OSNOVICA;
try {
  const spremljeno = localStorage.getItem(OSNOVICA_KEY);
  if (spremljeno !== null) osnovicaEl.value = spremljeno;
} catch { /* storage nedostupan */ }

// tekst stavke "Vrati na ..." izvodi se iz iste vrijednosti
$('lbl-zadana').textContent = fmt(obracun(parseInput(ZADANA_OSNOVICA)).osnovica);

preracunaj();

/* ---------- obrazac AMS-1035 ---------- */

/*
 * Obrazac se crta iz istog obracuna kao i uplatnice, pa mu se daje
 * funkcija koja vraca trenutno stanje umjesto snimka — tako ne moze
 * zaostati za onim sto pise u tabeli.
 */
amsProzor = napraviAMSProzor(
  () => ({ r: zadnjiObracun, p: ucitaj() }),
  () => { $('chk-ams').textContent = ' '; }
);

/* ---------- godisnja prijava GPD-1051 ---------- */

/*
 * Ne zavisi od osnovice u glavnom prozoru: ima svoj unos po mjesecima.
 * Iz Moji podaci uzima samo ime, JMB, adresu, telefon i racun.
 */
const godisnjiProzor = napraviGodisnjiProzor(() => { $('chk-gpd').textContent = ' '; });
osvjeziGodisnju = () => godisnjiProzor.osvjezi();

/* ---------- licni podaci -> uplatnice ---------- */

/**
 * Sve sto zavisi od licnih podataka: uplatnice, obrazac, izbor kantona i
 * tabela primalaca u uputstvu. Zove se poslije svake izmjene podataka,
 * odakle god da dodje.
 */
function osvjeziPoPodacima() {
  renderUplatnice($('forms-mount'), ucitaj());
  uplatniceProzor.osvjeziAktivnu(); // precrtavanje resetuje izabranu stavku
  preracunaj();                     // iznosi se moraju vratiti u nove obrasce
  amsProzor.osvjezi();              // i obrazac nosi iste licne podatke
  prikaziKanton();                  // ucitan profil moze biti iz drugog kantona
  osvjeziUputstvo();                // tabela primalaca je za izabrani kanton
  osvjeziGodisnju();                // obrazac GPD nosi ime, JMB, adresu i racun
}

const podaciProzor = napraviPodatke(
  osvjeziPoPodacima,
  // prozor se moze zatvoriti i svojim ✕ — kvacica u meniju to mora pratiti
  () => { $('chk-podaci').textContent = ' '; }
);

kantonEl.addEventListener('change', () => {
  const { p, opcina } = promijeniKanton(ucitaj(), kantonEl.value);
  snimi(p);
  podaciProzor.osvjezi();
  osvjeziPoPodacima();
  // Pogresna opcina je tiha greska na uplatnici, pa se kaze glasno.
  setStatus('Kanton: ' + kantonPodataka(p).naziv + '. Općina je postavljena na '
    + opcina.naziv + ' — promijeni je u Moji podaci ako živiš drugdje.');
});

/* ---------- meniji ---------- */

const zatvoriMenije = poveziMenije();
const setStatus = napraviStatus();

/* ---------- glavni prozor se povlaci za titlebar ---------- */

const povlacenje = omoguciPovlacenje(
  glavniProzor,
  glavniProzor.querySelector('.titlebar')
);

// Glavni prozor se mijenja kao i svaki drugi. Nije pravljen kroz
// napraviProzor() jer je statican u HTML-u, pa se veze rucno.
omoguciPromjenuVelicine(glavniProzor, {
  pomjeriZa: povlacenje.pomjeriZa,
  najmanjaSirina: 420,
  najmanjaVisina: 260,
});

// Klik na glavni prozor ga podize iznad nemodalnih panela, kao i obrnuto
glavniProzor.addEventListener('pointerdown', () => {
  podigniNaVrh(glavniProzor);
  traka.postaviAktivni(glavniApi);
}, true);

/* ---------- dugmad u naslovnoj traci glavnog prozora ---------- */

/*
 * Velicina maksimiziranog prozora je u CSS klasi, ne u inline stilu:
 * tako sama prati promjenu velicine ekrana, a i mora ponistiti
 * `max-width: 960px` koji glavni prozor nasljedjuje iz styles.css.
 */
function prebaciMaksimiziranje() {
  povlacenje.resetuj();
  glavniProzor.style.width = '';
  glavniProzor.style.height = '';
  glavniProzor.classList.toggle('maksimiziran');
}

{
  const [dugmeMin, dugmeMaks, dugmeX] = glavniProzor.querySelectorAll('.winbtns span');
  dugmeMin.title = 'Minimiziraj';
  dugmeMaks.title = 'Uvećaj / vrati';
  // Glavni prozor se ne moze zatvoriti — bez njega ne ostaje nista —
  // pa ✕ radi isto sto i minimiziranje, umjesto da ne radi nista.
  dugmeX.title = 'Skloni na traku';

  dugmeMin.addEventListener('click', () => glavniApi.minimiziraj());
  dugmeX.addEventListener('click', () => glavniApi.minimiziraj());
  dugmeMaks.addEventListener('click', prebaciMaksimiziranje);
}

/* ---------- dijalozi ---------- */

const oProgramu = napraviProzor({
  naslov: 'O programu',
  ikonaNaslova: ikone.KALKULACIJA_16,
  sirina: 300,
  centrirano: true,
  sadrzaj:
    '<div class="ico-big sa-ikonom">' + ikone.KALKULACIJA + '</div>' +
    '<div style="font-weight:bold; margin-bottom:4px;">Kalkulator</div>' +
    '<div style="color:#555;">Verzija ' + VERZIJA + ' (build XP)</div>' +
    '<div style="margin-top:8px; color:#555;">Obračun doprinosa i poreza, plus replika obrasca za uplatu javnih prihoda.</div>',
  dugmad: [{ tekst: 'U redu', primarno: true }],
});

const postavkeProzor = napraviPostavke(
  // promjena stope mijenja tabelu, obracun, obrazac i primjer u uputstvu
  () => {
    precrtajTabelu();
    preracunaj();
    uputstvo.osvjezi();
    godisnjiProzor.osvjezi();         // godisnji obracun koristi iste stope
    setStatus('Stope su promijenjene');
  },
  () => { $('chk-postavke').textContent = ' '; }
);

const uputstvo = napraviUputstvo();
const pravno = napraviPravno();
const resursi = napraviResurse();
const novosti = napraviNovosti();
osvjeziUputstvo = () => uputstvo.osvjezi();

/*
 * Balon "i" uz racune na uplatnicama vodi u Pomoc i Pravno. Balon ne zna
 * za prozore, pa mu se ovdje kaze kako ih otvoriti.
 */
postaviBalonVeze({
  pomoc: tema => uputstvo.otvoriTemu(tema),
  pravno: odjeljak => pravno.otvoriOdjeljak(odjeljak),
});

// Pravi se zadnje da bi, pri prvom otvaranju, stajalo iznad svega ostalog.
const upozorenje = napraviUpozorenje();

/* ---------- oznaka verzije ---------- */

/*
 * XP je u donjem desnom uglu radne povrsine drzao izdanje i broj builda.
 * Isto mjesto, ista uloga.
 */
{
  const oznaka = document.createElement('div');
  oznaka.className = 'xp-verzija';
  oznaka.textContent = 'Verzija ' + VERZIJA;
  document.body.append(oznaka);
}

/* ---------- precice na radnoj povrsini ---------- */

// Otvaranje ide kroz ove tri jer uz prozor treba namjestiti i kvacicu
// u meniju. Dijele ih precice na radnoj povrsini i pokretaci na traci.
const otvoriPodatke = () => { podaciProzor.otvori(); $('chk-podaci').textContent = '✓'; };
const otvoriUplatnice = () => { uplatniceProzor.otvori(); $('chk-uplatnice').textContent = '✓'; };
const otvoriAMS = () => { amsProzor.otvori(); $('chk-ams').textContent = '✓'; };
const otvoriGodisnju = () => { godisnjiProzor.otvori(); $('chk-gpd').textContent = '✓'; };
const otvoriUputstvo = () => uputstvo.otvori();
const otvoriPravno = () => pravno.otvori();
const otvoriResurse = () => resursi.otvori();

/*
 * Mreza po redovima, sa praznim redom izmedju grupa: prvo racunanje i
 * licni podaci, pa papiri koji se nose u banku i Poreznu, pa ono sto se
 * cita. Kalkulacija je prva jer je glavni prozor — ne moze se zatvoriti,
 * pa je klik vraca naprijed umjesto da je otvara.
 */
napraviPrecice([
  [
    { naziv: 'Kalkulator',  ikona: ikone.KALKULACIJA, otvori: () => glavniApi.vrati() },
    { naziv: 'Moji podaci', ikona: ikone.MOJI_PODACI, otvori: otvoriPodatke },
  ],
  [],
  [
    { naziv: 'Uplatnice',   ikona: ikone.UPLATNICE,   otvori: otvoriUplatnice },
    { naziv: 'AMS-1035',    ikona: ikone.OBRAZAC,     otvori: otvoriAMS },
    { naziv: 'Godišnja prijava', ikona: ikone.GODISNJA, otvori: otvoriGodisnju },
  ],
  [],
  [
    { naziv: 'Pomoć',       ikona: ikone.POMOC,       otvori: otvoriUputstvo },
    { naziv: 'Pravno',      ikona: ikone.PRAVNO,      otvori: otvoriPravno },
    { naziv: 'Resursi',     ikona: ikone.RESURSI,     otvori: otvoriResurse },
  ],
]);

/* Papiric gore desno; stoji na radnoj povrsini, iza prozora. */
napraviBiljesku();

/*
 * Ista cetiri prozora i na donjoj traci. Na telefonu su precice
 * sakrivene — prozor tamo ide do vrha ekrana — pa je traka jedini nacin
 * da se prozor otvori. Na sirokom ekranu CSS krije zatvorene, pa traka
 * i dalje pokazuje samo otvorene prozore, kao u XP-u.
 */
traka.postaviPokretace([
  { api: glavniApi,       ikona: ikone.KALKULACIJA },
  { api: podaciProzor,    ikona: ikone.MOJI_PODACI, pokreni: otvoriPodatke },
  { api: uplatniceProzor, ikona: ikone.UPLATNICE,   pokreni: otvoriUplatnice },
  { api: amsProzor,       ikona: ikone.OBRAZAC,     pokreni: otvoriAMS },
  { api: godisnjiProzor,  ikona: ikone.GODISNJA,    pokreni: otvoriGodisnju },
  { api: uputstvo,        ikona: ikone.POMOC,       pokreni: otvoriUputstvo },
  { api: pravno,          ikona: ikone.PRAVNO,      pokreni: otvoriPravno },
  { api: resursi,         ikona: ikone.RESURSI,     pokreni: otvoriResurse },
]);

/**
 * Pokreni izvoz uz poruke u statusnoj traci.
 * Biblioteke se ucitavaju tek ovdje, pa prvi izvoz traje malo duze.
 */
async function izvezi(naziv, radnja) {
  // Bez osnovice izvoz daje dokument pun nula — to nikome ne treba, a
  // fajl se tesko razlikuje od pravog kad se nadje u folderu.
  if (!zadnjiObracun || zadnjiObracun.osnovica <= 0) {
    setStatus('Prvo upiši osnovicu.');
    return;
  }
  setStatus(naziv + ': priprema...');
  try {
    await radnja();
    setStatus(naziv + ' je spremljen');
  } catch (greska) {
    console.error(greska);
    setStatus(naziv + ' nije uspio: ' + (greska?.message || 'nepoznata greška'));
  }
}


document.addEventListener('click', e => {
  const opt = e.target.closest('.dropdown .opt');
  if (!opt) return;
  e.stopPropagation();

  // Roditelj podmenija samo otvara podmeni — meni ostaje otvoren
  if (opt.classList.contains('ima-podmeni')) {
    opt.classList.toggle('otvoren');
    return;
  }

  switch (opt.dataset.action) {
    case 'novo':
      osnovicaEl.value = '';
      preracunaj(); zapamtiOsnovicu();
      setStatus('Novi obračun — unesi osnovicu');
      break;

    case 'vrati':
      osnovicaEl.value = ZADANA_OSNOVICA;
      preracunaj(); zapamtiOsnovicu();
      setStatus('Vraćeno na zadanu vrijednost');
      break;

    case 'ocisti':
      osnovicaEl.value = '0';
      preracunaj(); zapamtiOsnovicu();
      setStatus('Unos očišćen');
      break;

    case 'kopiraj': {
      const val = $('r-ukupno').textContent;
      if (navigator.clipboard) navigator.clipboard.writeText(val).catch(() => {});
      setStatus('Kopirano: ' + val + ' KM');
      break;
    }

    case 'ispis':
      // Uplatnice se stampaju i ako su sakrivene — print.css ih forsira.
      stampaj({
        klasa: 'print-uplatnice',
        naslov: 'Nalog za uplatu javnih prihoda — ' + kantonPodataka(ucitaj()).naziv,
        desno: periodTekst(ucitaj()),
      });
      break;

    case 'spremi-pdf':
      izvezi('PDF', () => izvoziPDF(zadnjiObracun, ucitaj()));
      break;

    case 'spremi-excel':
      izvezi('Excel', () => izvoziExcel(zadnjiObracun, ucitaj()));
      break;

    case 'toggle-postotak': {
      prikaziPostotak = toggleKvacica('chk-postotak');
      document.querySelectorAll('.pct-col').forEach(el => {
        el.style.display = prikaziPostotak ? '' : 'none';
      });
      break;
    }

    case 'toggle-uplatnice': {
      uplatniceProzor.prebaci();
      const otvoren = uplatniceProzor.jeOtvoren();
      $('chk-uplatnice').textContent = otvoren ? '✓' : ' ';
      setStatus(otvoren ? 'Uplatnice otvorene' : 'Uplatnice zatvorene');
      break;
    }

    case 'toggle-ams': {
      amsProzor.prebaci();
      const otvoren = amsProzor.jeOtvoren();
      $('chk-ams').textContent = otvoren ? '✓' : ' ';
      setStatus(otvoren ? 'Obrazac AMS-1035 otvoren' : 'Obrazac AMS-1035 zatvoren');
      break;
    }

    case 'ispis-ams':
      // Obrazac se stampa i kad je prozor zatvoren — sadrzaj mu je uvijek
      // iscrtan, isto kao kod uplatnica.
      stampaj({
        klasa: 'print-ams',
        naslov: 'Obrazac AMS-1035 — akontacija poreza na prihod iz inostranstva',
        desno: periodTekst(ucitaj()),
      });
      break;

    case 'ispis-gpd':
      // Obrazac GPD se stampa i kad je prozor zatvoren, kao AMS.
      godisnjiProzor.stampaj();
      break;

    case 'toggle-gpd': {
      godisnjiProzor.prebaci();
      const otvoren = godisnjiProzor.jeOtvoren();
      $('chk-gpd').textContent = otvoren ? '✓' : ' ';
      setStatus(otvoren ? 'Godišnja prijava otvorena' : 'Godišnja prijava zatvorena');
      break;
    }

    case 'toggle-podaci': {
      podaciProzor.prebaci();
      const otvoren = podaciProzor.jeOtvoren();
      $('chk-podaci').textContent = otvoren ? '✓' : ' ';
      setStatus(otvoren ? 'Moji podaci otvoreni' : 'Moji podaci zatvoreni');
      break;
    }

    case 'osvjezi':
      preracunaj();
      setStatus('Osvježeno');
      break;

    case 'postavke': {
      postavkeProzor.prebaci();
      $('chk-postavke').textContent = postavkeProzor.jeOtvoren() ? '✓' : ' ';
      break;
    }

    case 'obrisi-sve':
      pitajPaObrisi();
      break;

    case 'uputstvo':
      uputstvo.otvori();
      break;

    case 'oprogramu':
      oProgramu.otvori();
      break;

    case 'upozorenje':
      upozorenje.otvori();
      break;

    case 'pravno':
      pravno.otvori();
      break;

    case 'resursi':
      resursi.otvori();
      break;

    case 'novosti':
      novosti.otvori();
      break;

    case 'centriraj':
      povlacenje.resetuj();
      setStatus('Prozor vraćen na sredinu');
      break;
  }

  zatvoriMenije();
});

/*
 * Balon sa izmjenama. Sam odlucuje hoce li se pojaviti — ceka da
 * se skloni pocetno upozorenje i pamti da je zatvoren.
 */
postaviNovosti(() => novosti.otvori());

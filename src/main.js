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

import { ZADANA_OSNOVICA, VERZIJA } from './config.js';
import { obracun } from './calc.js';
import { parseInput, fmt } from './format.js';
import { renderTabela, popuniTabelu } from './tabela.js';
import { renderUplatnice, popuniIznose } from './uplatnice.js';
import { napraviPodatke } from './podaci.js';
import { napraviUplatniceProzor } from './uplatniceProzor.js';
import { napraviAMSProzor } from './ams.js';
import { napraviPostavke } from './postavke.js';
import { pitajPaObrisi } from './brisanje.js';
import { stampaj, periodTekst } from './ispis.js';
import { napraviUpozorenje } from './upozorenje.js';
import { napraviUputstvo } from './uputstvo.js';
import { napraviPravno } from './pravno.js';
import { ucitaj } from './storage.js';
import { poveziMenije, napraviStatus, toggleKvacica } from './ui.js';
import { napraviProzor, podigniNaVrh } from './prozor.js';
import { omoguciPovlacenje } from './drag.js';
import { omoguciPromjenuVelicine } from './resize.js';
import * as traka from './traka.js';
import { napraviPrecice } from './precice.js';
import * as ikone from './ikone.js';
import { izvoziPDF, izvoziExcel } from './izvoz.js';

const OSNOVICA_KEY = 'porez.osnovica.v1';

const $ = id => document.getElementById(id);
const osnovicaEl = $('osnovica');
const glavniProzor = document.querySelector('.window');

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
traka.prijavi('kalkulacija_freelance.exe', glavniApi);
traka.postaviAktivni(glavniApi);

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
  $('obracun-body').innerHTML = renderTabela();
  document.querySelectorAll('.pct-col').forEach(el => {
    el.style.display = prikaziPostotak ? '' : 'none';
  });
}

precrtajTabelu();
renderUplatnice($('forms-mount'), ucitaj());

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
  const r = obracun(parseInput(osnovicaEl.value));
  zadnjiObracun = r;
  popuniTabelu(r);
  popuniIznose(r);
  if (amsProzor) amsProzor.osvjezi();   // pravi se kasnije od prvog poziva
}

function zapamtiOsnovicu() {
  try { localStorage.setItem(OSNOVICA_KEY, osnovicaEl.value); } catch { /* storage nedostupan */ }
}

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

/* ---------- licni podaci -> uplatnice ---------- */

const podaciProzor = napraviPodatke(
  () => {
    renderUplatnice($('forms-mount'), ucitaj());
    uplatniceProzor.osvjeziAktivnu(); // precrtavanje resetuje izabranu stavku
    preracunaj();                     // iznosi se moraju vratiti u nove obrasce
    amsProzor.osvjezi();              // i obrazac nosi iste licne podatke
  },
  // prozor se moze zatvoriti i svojim ✕ — kvacica u meniju to mora pratiti
  () => { $('chk-podaci').textContent = ' '; }
);

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
  sirina: 300,
  centrirano: true,
  sadrzaj:
    '<div class="ico-big"></div>' +
    '<div style="font-weight:bold; margin-bottom:4px;">Kalkulacija freelance prihoda</div>' +
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
    setStatus('Stope su promijenjene');
  },
  () => { $('chk-postavke').textContent = ' '; }
);

const uputstvo = napraviUputstvo();
const pravno = napraviPravno();

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
const otvoriUputstvo = () => uputstvo.otvori();
const otvoriPravno = () => pravno.otvori();

napraviPrecice([
  { naziv: 'Moji podaci', ikona: ikone.MOJI_PODACI, otvori: otvoriPodatke },
  { naziv: 'Uplatnice',   ikona: ikone.UPLATNICE,   otvori: otvoriUplatnice },
  { naziv: 'AMS-1035',    ikona: ikone.OBRAZAC,     otvori: otvoriAMS },
  { naziv: 'Pomoć',       ikona: ikone.POMOC,       otvori: otvoriUputstvo },
  { naziv: 'Pravno',      ikona: ikone.PRAVNO,      otvori: otvoriPravno },
]);

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
  { api: uputstvo,        ikona: ikone.POMOC,       pokreni: otvoriUputstvo },
  { api: pravno,          ikona: ikone.PRAVNO,      pokreni: otvoriPravno },
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
        naslov: 'Nalog za uplatu javnih prihoda — Zeničko-dobojski kanton',
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

    case 'centriraj':
      povlacenje.resetuj();
      setStatus('Prozor vraćen na sredinu');
      break;
  }

  zatvoriMenije();
});

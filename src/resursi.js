import { napraviProzor } from './prozor.js';
import * as ikone from './ikone.js';
import { RACUNI_IZVOR } from './config.js';

/**
 * Sluzbeni resursi — veze na stranice Porezne uprave FBiH.
 *
 * Jedini dio programa koji vodi van. Zato stoji odvojeno i zato je
 * napisano da se otvara u novoj kartici: dok se ne klikne, program i
 * dalje nista ne trazi s mreze.
 *
 * Svaka adresa je provjerena da vraca 200, a brojke u programu su
 * uporedjene bas sa ovim izvorima. Ako neka veza pukne, bolje je
 * izbaciti je nego pustiti da vodi u prazno — na ovome se racunaju
 * tudje pare.
 */

const PROVJERENO = '05.10.2026.';

const SKUPINE = [
  {
    naslov: 'Porezna uprava FBiH',
    veze: [
      {
        tekst: 'Freelanceri — vodič',
        url: 'https://pufbih.ba/freelanceri',
        opis: 'Obaveze, rokovi i stope, i rok za godišnju prijavu (31. mart). Odavde su provjerene stope u ovom programu.',
      },
      {
        tekst: 'Uplatni računi',
        url: 'https://pufbih.ba/servisi-za-obveznike/uplatni-racuni',
        opis: 'Računi po kantonima. Stranica kasni za Pravilnikom: 05.10.2026. je za zavod HNK još pokazivala zamijenjen račun.',
      },
      {
        tekst: 'Obrazac AMS-1035 (PDF)',
        url: 'https://www.pufbih.ba/v1/public/upload/obrasci/b839c-obrazac-ams_bos_web.pdf',
        opis: 'Službeni obrazac. Po njemu je crtan onaj u programu.',
      },
      {
        tekst: 'Obrazac GPD-1051 (PDF)',
        url: 'https://www.pufbih.ba/v1/public/upload/obrasci/a9d63-94b8a-obrazac_gpd_1051_ver1__bos_web2.pdf',
        opis: 'Godišnja prijava poreza na dohodak. Po njemu je crtan onaj u programu.',
      },
      {
        tekst: 'Propisi',
        url: 'https://pufbih.ba/propisi-zakoni',
        opis: 'Svi zakoni i pravilnici, sa izmjenama.',
      },
      {
        tekst: 'e-Doprinosi',
        url: 'https://pufbih.ba/pages/e-doprinosi',
        opis: 'Elektronski servis Porezne uprave.',
      },
      {
        tekst: 'Kontakti',
        url: 'https://www.pufbih.ba/kontakti',
        opis: 'Ispostave i brojevi telefona. Prijave se predaju ispostavi prema prebivalištu.',
      },
    ],
  },
  {
    naslov: 'Propisi po kojima program računa',
    veze: [
      {
        tekst: 'Pravilnik o načinu uplate javnih prihoda (PDF)',
        url: RACUNI_IZVOR,
        opis: 'Računi primalaca, šifre općina i kako se popunjava nalog. Mjerodavan za račune u ovom programu.',
      },
      {
        tekst: 'Zakon o porezu na dohodak (PDF)',
        url: 'https://www.pufbih.ba/v1/public/upload/zakoni/d9bf6-zakon-o-porezu-na-dohodak-ispravan-tekst.pdf',
        opis: 'Stopa 10%, priznati rashodi (član 15.) i lični odbitak od 3.600 KM (član 24.).',
      },
      {
        tekst: 'Pravilnik o primjeni Zakona o porezu na dohodak (PDF)',
        url: 'https://pufbih.ba/v1/public/upload/zakoni/16_02_2026teksta%20Pravilnika%20o%20primjeni%20Zakona%20o%20porezu%20na%20dohodak_12_26/16_02_2026_PRECISCENI%20Pravilnik%20o%20primjeni%20Zakona%20o%20porezu%20na%20dohodak%2012-26.pdf',
        opis: 'AMS-1035 u roku od pet dana (član 57.) i godišnja prijava do 31. marta (članovi 74–76).',
      },
      {
        tekst: 'Zakon o doprinosima (PDF)',
        url: 'https://www.pufbih.ba/v1/public/upload/zakoni/2dcc6-zakon-o-doprinosima-precisceni-tekst-25.pdf',
        opis: 'Zdravstveno osiguranje 4% na teret osiguranika (član 10a).',
      },
    ],
  },
  {
    naslov: 'Ostalo',
    veze: [
      {
        tekst: 'Zavodi zdravstvenog osiguranja',
        url: 'https://www.zzofbih.ba/',
        opis: 'Federalni zavod, sa vezama na svih deset kantonalnih.',
      },
      {
        tekst: 'Federalno ministarstvo finansija',
        url: 'https://www.fmf.gov.ba/',
        opis: 'Donosi Pravilnik o načinu uplate i ostale pravilnike.',
      },
    ],
  },
];

const esc = s => String(s ?? '').replace(/[&<>"]/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function sadrzajHTML() {
  return '<p class="re-uvod">Stranice Porezne uprave i ministarstva. '
    + '<b>Otvaraju se u novoj kartici</b> — dok ne klikneš, program i dalje '
    + 'ništa ne traži s mreže.</p>'
    + SKUPINE.map(s =>
      '<div class="re-skupina">'
      + '<h3 class="re-naslov">' + esc(s.naslov) + '</h3>'
      + '<ul class="re-spisak">'
      + s.veze.map(v =>
        '<li>'
        + '<a class="re-veza" href="' + esc(v.url) + '"'
        + ' target="_blank" rel="noopener noreferrer">' + esc(v.tekst) + '</a>'
        + '<div class="re-opis">' + esc(v.opis) + '</div>'
        + '<div class="re-adresa">' + esc(v.url) + '</div>'
        + '</li>').join('')
      + '</ul></div>').join('')
    + '<p class="re-podnozje">Stope, šifre općina i sva tri uplatna računa '
    + 'u ovom programu provjereni su na ovim stranicama ' + PROVJERENO
    + ' Propisi se mijenjaju — prije uplate provjeri i sam.</p>';
}

/**
 * @param {Function} [onZatvaranju]
 * @returns {Object} prozor
 */
export function napraviResurse(onZatvaranju) {
  return napraviProzor({
    naslov: 'Službeni resursi',
    ikona: ikone.RESURSI,
    nazivNaTraci: 'Resursi',
    sirina: 'min(560px, 94vw)',
    klasa: 're-prozor',
    promjenjivo: true,
    najmanjaSirina: 300,
    najmanjaVisina: 240,
    animacija: true,
    minimizirati: true,
    naZatvaranje: () => onZatvaranju && onZatvaranju(),
    sadrzaj: sadrzajHTML(),
    dugmad: [{ tekst: 'Zatvori', primarno: true }],
  });
}

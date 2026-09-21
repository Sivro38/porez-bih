import { napraviProzor } from './prozor.js';

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

const PROVJERENO = '21.09.2026.';

const SKUPINE = [
  {
    naslov: 'Porezna uprava FBiH',
    veze: [
      {
        tekst: 'Freelanceri — vodič',
        url: 'https://pufbih.ba/freelanceri',
        opis: 'Obaveze, rokovi i stope. Odavde su provjerene stope u ovom programu.',
      },
      {
        tekst: 'Uplatni računi',
        url: 'https://pufbih.ba/servisi-za-obveznike/uplatni-racuni',
        opis: 'Svi računi javnih prihoda i šifre općina, po kantonima.',
      },
      {
        tekst: 'Obrazac AMS-1035 (PDF)',
        url: 'https://www.pufbih.ba/v1/public/upload/obrasci/b839c-obrazac-ams_bos_web.pdf',
        opis: 'Službeni obrazac. Po njemu je crtan onaj u programu.',
      },
      {
        tekst: 'e-Doprinosi',
        url: 'https://pufbih.ba/pages/e-doprinosi',
        opis: 'Elektronski servis Porezne uprave.',
      },
      {
        tekst: 'Kontakti',
        url: 'https://www.pufbih.ba/kontakti',
        opis: 'Ispostave i brojevi telefona.',
      },
    ],
  },
  {
    naslov: 'Ostalo',
    veze: [
      {
        tekst: 'Federalno ministarstvo finansija',
        url: 'https://www.fmf.gov.ba/',
        opis: 'Zakoni i pravilnici.',
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

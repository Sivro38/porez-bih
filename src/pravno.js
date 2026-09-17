import { napraviProzor } from './prozor.js';
import { VERZIJA } from './config.js';

/**
 * Pravno i privatnost.
 *
 * Jedan dokument sa odjeljcima, ne tabovi: tekst je kratak i treba ga
 * procitati u cjelini, a ne prebirati po njemu. Uputstvo ima tabove jer
 * se tamo trazi jedna stvar; ovdje se cita sve.
 *
 * Sve tvrdnje su provjerljive u kodu — ako se ikad doda nesto sto salje
 * podatke van browsera, ovaj tekst mora prvi biti izmijenjen.
 */

/** Sve sto program cuva, kao u localStorage. */
const STAVKE = [
  ['porez.podaci.v1', 'Ime, adresa, telefon, broj računa, JMBG, općina, mjesto i datumi'],
  ['porez.profili.v2', 'Tri snimljena profila — isti podaci pod nazivom koji si dao'],
  ['porez.profili.v1', 'Profili iz starije verzije programa, ako ih je bilo. Samo se čitaju, radi prenosa.'],
  ['porez.osnovica.v1', 'Zadnji iznos koji si upisao u polje osnovice'],
  ['porez.stope.v1', 'Stope, ako si ih mijenjao u postavkama'],
  ['porez.upozorenje.v1', 'Samo oznaka da si pročitao početno upozorenje'],
];

const ODJELJCI = [
  {
    naslov: 'Šta je ovo',
    tijelo:
      '<p><b>Ovo nije službena stranica</b> i nije povezana s Poreznom upravom '
      + 'FBiH, bankom ni bilo kojom drugom institucijom. Privatni je projekat, '
      + 'napravljen da pomogne pri računanju.</p>'
      + '<p>Stope, računi i šifre općina upisani su ručno prema javno dostupnim '
      + 'izvorima. Propisi se mijenjaju, a program se ne ažurira sam.</p>',
  },
  {
    naslov: 'Gdje su tvoji podaci',
    tijelo:
      '<p class="pv-istaknuto">Sve što upišeš ostaje u ovom browseru. '
      + 'Nema servera, nema naloga, ništa se nikuda ne šalje.</p>'
      + '<p>Podaci se čuvaju u <code>localStorage</code> — prostoru koji browser '
      + 'daje ovoj stranici. Vezani su za ovaj uređaj i ovaj browser: na drugom '
      + 'računaru ili u anonimnom prozoru neće ih biti.</p>'
      + '<p>Program ne čita ništa osim onoga što si sam upisao.</p>',
    spisak: true,
  },
  {
    naslov: 'Kolačići',
    tijelo:
      '<p><b>Nema ih.</b> Program ne postavlja nijedan kolačić, nema analitike, '
      + 'nema pratilaca, nema reklamnih mreža i ne učitava ništa s tuđih '
      + 'servera.</p>'
      + '<p>Zato i nema onog prozorčića za pristanak — nema na šta pristati.</p>',
  },
  {
    naslov: 'Šta ipak vidi host',
    tijelo:
      '<p>Da bi se stranica otvorila, neko je mora poslužiti. Kao i svaki '
      + 'web server, host bilježi da je zahtjev stigao — IP adresu, vrijeme i '
      + 'vrstu browsera. To se dešava prije nego se program uopšte pokrene i '
      + 'nije pod njegovom kontrolom.</p>'
      + '<p>Ništa od onoga što upišeš <b>u</b> program tim putem ne prolazi.</p>'
      + '<p>Ako ni to ne želiš, preuzmi izvorni kod i pokreni ga lokalno — radi '
      + 'i otvoren direktno s diska, bez ikakve mreže.</p>',
  },
  {
    naslov: 'Brisanje',
    tijelo:
      '<p><b>Alati → Obriši sve podatke</b> briše sve '
      + 'iz spiska iznad, odjednom i nepovratno.</p>'
      + '<p>Isto postižeš i brisanjem podataka stranice kroz postavke browsera.</p>',
  },
  {
    naslov: 'Odricanje od odgovornosti',
    tijelo:
      '<p>Program se daje <b>takav kakav jeste</b>, bez ikakve garancije — ni da '
      + 'je tačan, ni da je potpun, ni da je prikladan za bilo koju svrhu.</p>'
      + '<p>Iznosi koje pokaže su pomoć pri računanju, <b>ne porezni savjet</b>. '
      + 'Prije uplate provjeri ih kod Porezne uprave FBiH, u banci ili kod '
      + 'knjigovođe.</p>'
      + '<p class="pv-istaknuto">Odgovornost za tačnost prijave i uplate je na '
      + 'tebi, bez obzira na to šta ovaj program pokaže.</p>',
  },
  {
    naslov: 'Licenca i izvorni kod',
    tijelo:
      '<p>Program je slobodan softver pod licencom '
      + '<b>GNU General Public License, verzija 3 ili novija</b>.</p>'
      + '<p>Smiješ ga koristiti, proučavati, mijenjati i dijeliti. Ako dijeliš '
      + 'izmijenjenu verziju, mora ostati pod istom licencom i sa dostupnim '
      + 'izvornim kodom.</p>'
      + '<p>Puni tekst licence je u datoteci <code>LICENSE</code> uz izvorni kod.</p>'
      + '<p>Autor: <b>Emin Sivro</b> · '
      + '<a href="https://www.linkedin.com/in/eminsivro/" target="_blank" rel="noopener noreferrer">LinkedIn</a></p>'
      + '<h4>Korištene biblioteke</h4>'
      + '<table class="pv-tabela">'
        + '<tr><th>Biblioteka</th><th>Licenca</th></tr>'
        + '<tr><td>jsPDF</td><td>MIT</td></tr>'
        + '<tr><td>jspdf-autotable</td><td>MIT</td></tr>'
        + '<tr><td>SheetJS (xlsx)</td><td>Apache-2.0</td></tr>'
        + '<tr><td>DejaVu Sans</td><td>Bitstream Vera / Arev</td></tr>'
      + '</table>'
      + '<p class="pv-sitno">Puna obavještenja o autorskim pravima stoje u '
      + 'datoteci <code>THIRD-PARTY-LICENSES.md</code> uz izvorni kod.</p>',
  },
];

function spisakHTML() {
  return '<table class="pv-tabela pv-spisak">'
    + '<tr><th>Stavka</th><th>Šta sadrži</th></tr>'
    + STAVKE.map(([k, opis]) =>
        '<tr><td><code>' + k + '</code></td><td>' + opis + '</td></tr>').join('')
    + '</table>';
}

function sadrzajHTML() {
  return '<div class="pv-dokument">'
    + ODJELJCI.map(o =>
        '<section class="pv-odjeljak">'
        + '<h3>' + o.naslov + '</h3>'
        + o.tijelo
        + (o.spisak ? spisakHTML() : '')
        + '</section>').join('')
    + '<div class="pv-podnozje">Verzija ' + VERZIJA
      + ' · posljednja izmjena teksta: septembar 2026.</div>'
    + '</div>';
}

/**
 * @param {Function} [onZatvaranju]
 */
export function napraviPravno(onZatvaranju) {
  return napraviProzor({
    naslov: 'Pravno i privatnost',
    nazivNaTraci: 'Pravno',
    sirina: 'min(640px, 94vw)',
    klasa: 'pv-prozor',
    promjenjivo: true,
    najmanjaSirina: 320,
    najmanjaVisina: 260,
    animacija: true,
    // Ide na donju traku kao i ostali prozori, pa se moze skloniti dok
    // se cita nesto drugo.
    minimizirati: true,
    naZatvaranje: () => onZatvaranju && onZatvaranju(),
    sadrzaj: sadrzajHTML(),
    dugmad: [{ tekst: 'Zatvori', primarno: true }],
  });
}

import { napraviProzor } from './prozor.js';
import * as ikone from './ikone.js';
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

/**
 * Sve sto program cuva, kao u localStorage. Svaki novi kljuc mora uci i
 * ovdje: ovo je jedini spisak koji korisnik vidi.
 */
const STAVKE = [
  ['porez.podaci.v1', 'Ime, adresa, telefon, broj računa, JMBG, općina (iz nje i kanton), mjesto i datumi'],
  ['porez.profili.v2', 'Snimljeni profili — isti podaci pod nazivom koji si dao'],
  ['porez.profili.v1', 'Profili iz starije verzije programa, ako ih je bilo. Samo se čitaju, radi prenosa.'],
  ['porez.osnovica.v1', 'Zadnji iznos koji si upisao u polje osnovice'],
  ['porez.vrsta.v1', 'Izabrana vrsta prihoda: povremena djelatnost ili autorska naknada'],
  ['porez.godisnji.v1', 'Unos za godišnju prijavu: godina, iznosi po mjesecima, lični odbitak i ostali redovi'],
  ['porez.stope.v1', 'Stope, ako si ih mijenjao u postavkama'],
  ['porez.upozorenje.v1', 'Samo oznaka da si pročitao početno upozorenje'],
  ['porez.biljeska.v1', 'Da li je bilješka na radnoj površini otvorena ili sklopljena'],
  ['porez.biljeska.stranica.v1', 'Koju si stranicu bilješke zadnju gledao'],
  ['porez.novosti.v' + VERZIJA, 'Oznaka da si zatvorio balon „Šta je novo” za ovu verziju. Oznaku stare verzije program sam obriše.'],
];

/** Javni repozitorij — izvorni kod koji se moze preuzeti i pokrenuti lokalno. */
const REPOZITORIJ = 'https://github.com/Sivro38/porez-bih';

const ODJELJCI = [
  {
    id: 'sta-je',
    naslov: 'Šta je ovo',
    tijelo:
      '<p><b>Ovo nije službena stranica</b> i nije povezana s Poreznom upravom '
      + 'FBiH, bankom ni bilo kojom drugom institucijom. Privatni je projekat, '
      + 'napravljen da pomogne pri računanju.</p>'
      + '<p>Stope, računi i šifre općina prepisani su iz javnih propisa — zakona '
      + 'i Pravilnika o načinu uplate, pripadnosti i raspodjele javnih prihoda u '
      + 'FBiH — i provjereni kod izvora. Ipak, propisi se mijenjaju, a program '
      + 'se ne ažurira sam. Zato uz svaki račun na uplatnici stoji plavo '
      + '<b>i</b>, sa uputom kako ga provjeriti.</p>'
      + '<p><b>Ništa iz ovog programa ne treba uzeti zdravo za gotovo.</b> Prije '
      + 'uplate potvrdi iznose i račune kod Porezne uprave, u banci ili kod '
      + 'knjigovođe.</p>',
  },
  {
    id: 'podaci',
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
    id: 'kolacici',
    naslov: 'Kolačići',
    tijelo:
      '<p><b>Nema ih.</b> Program ne postavlja nijedan kolačić, nema analitike, '
      + 'nema pratilaca, nema reklamnih mreža i ne učitava ništa s tuđih '
      + 'servera.</p>'
      + '<p>Zato i nema onog prozorčića za pristanak — nema na šta pristati.</p>',
  },
  {
    id: 'host',
    naslov: 'Šta ipak vidi host',
    tijelo:
      '<p>Da bi se stranica otvorila, neko je mora poslužiti. Kao i svaki '
      + 'web server, host bilježi da je zahtjev stigao — IP adresu, vrijeme i '
      + 'vrstu browsera. To se dešava prije nego se program uopšte pokrene i '
      + 'nije pod njegovom kontrolom.</p>'
      + '<p>Ništa od onoga što upišeš <b>u</b> program tim putem ne prolazi.</p>'
      // Pozitivno, ne kao upozorenje: to je mogucnost, ne problem.
      + '<p class="pv-istaknuto">Hoćeš potpunu privatnost, i od onoga što vidi '
      + 'server? Kod je otvoren: preuzmi ga i pokreni na svom računaru. Radi i '
      + 'otvoren direktno s diska, bez ikakve mreže. '
      + '<a href="' + REPOZITORIJ + '" target="_blank" rel="noopener noreferrer">'
      + 'github.com/Sivro38/porez-bih ↗</a></p>',
  },
  {
    id: 'brisanje',
    naslov: 'Brisanje',
    tijelo:
      '<p><b>Alati → Obriši sve podatke</b> briše sve '
      + 'iz spiska iznad, odjednom i nepovratno.</p>'
      + '<p>Isto postižeš i brisanjem podataka stranice kroz postavke browsera.</p>',
  },
  {
    id: 'odgovornost',
    naslov: 'Odricanje od odgovornosti',
    tijelo:
      '<p>Program se daje <b>takav kakav jeste</b>, bez ikakve garancije — ni da '
      + 'je tačan, ni da je potpun, ni da je prikladan za bilo koju svrhu.</p>'
      + '<p>Iznosi koje pokaže su pomoć pri računanju, <b>ne porezni savjet</b>. '
      + 'Prije uplate provjeri ih kod Porezne uprave FBiH, u banci ili kod '
      + 'knjigovođe. Isto važi za račune primalaca, šifre općina, godišnju '
      + 'prijavu i svaki navod ili citat iz zakona i pravilnika u ovom '
      + 'programu: ne garantujemo da su tačni, potpuni ni važeći.</p>'
      + '<p class="pv-istaknuto pv-pazi">Odgovornost za tačnost prijave i uplate je na '
      + 'tebi, bez obzira na to šta ovaj program pokaže.</p>',
  },
  {
    id: 'licenca',
    naslov: 'Licenca i izvorni kod',
    tijelo:
      '<p>Program je slobodan softver pod licencom '
      + '<b>GNU General Public License, verzija 3 ili novija</b>.</p>'
      + '<p>Smiješ ga koristiti, proučavati, mijenjati i dijeliti. Ako dijeliš '
      + 'izmijenjenu verziju, mora ostati pod istom licencom i sa dostupnim '
      + 'izvornim kodom.</p>'
      + '<p>Puni tekst licence je u datoteci <code>LICENSE</code> uz izvorni kod: '
      + '<a href="' + REPOZITORIJ + '" target="_blank" rel="noopener noreferrer">'
      + 'github.com/Sivro38/porez-bih</a>.</p>'
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
        '<section class="pv-odjeljak" data-pv-odjeljak="' + o.id + '">'
        + '<h3>' + o.naslov + '</h3>'
        + o.tijelo
        + (o.spisak ? spisakHTML() : '')
        + '</section>').join('')
    + '<div class="pv-podnozje">Verzija ' + VERZIJA
      + ' · posljednja izmjena teksta: oktobar 2026.</div>'
    + '</div>';
}

/**
 * @param {Function} [onZatvaranju]
 */
export function napraviPravno(onZatvaranju) {
  const prozor = napraviProzor({
    naslov: 'Pravno i privatnost',
    ikona: ikone.PRAVNO,
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

  /**
   * Otvori i dovedi dati odjeljak u vidno polje, uz kratko oznacavanje —
   * npr. iz balona "i" uz racun, koji vodi na odricanje od odgovornosti.
   */
  prozor.otvoriOdjeljak = id => {
    prozor.otvori();
    const odjeljak = prozor.tijelo.querySelector('[data-pv-odjeljak="' + id + '"]');
    if (!odjeljak) return prozor;
    odjeljak.scrollIntoView({ block: 'start' });
    odjeljak.classList.remove('pv-oznacen');
    void odjeljak.offsetWidth;          // restartuj animaciju
    odjeljak.classList.add('pv-oznacen');
    return prozor;
  };

  return prozor;
}

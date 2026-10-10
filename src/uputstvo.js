import { napraviProzor } from './prozor.js';
import * as ikone from './ikone.js';
import {
  primaoci, KANTONI, FIKSNE_NULE, ZADANA_OSNOVICA, punNaziv,
  RACUNI_PROVJERENO, RACUNI_IZVOR, racunKaoUPravilniku,
} from './config.js';
import { stope } from './stope.js';
import { fmt, fmtPct, parseInput } from './format.js';
import { obracun } from './calc.js';
import { IZVOR_ROKOVI } from './izvori.js';
import { ucitaj, kantonPodataka } from './storage.js';

/* Sluzbeni izvori koji se spominju u uputstvu. Veze se otvaraju u novoj
   kartici, tek na klik — program sam nista ne trazi s mreze. */
const VEZA_IZMJENA_74_25 = 'https://www.pufbih.ba/v1/public/upload/zakoni/9e9a9-pravinik-o-izmjenama-i-dopunama-pravilnika-o-nacinu-uplate-pripadnosti-i-raspodjele-javnih-prihoda-u-federaciji-bih-74-25.pdf';
const VEZA_UPLATNI_RACUNI = 'https://pufbih.ba/servisi-za-obveznike/uplatni-racuni';
const VEZA_ZAVODI = 'https://www.zzofbih.ba/';

const veza = (url, tekst) =>
  '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + tekst + ' ↗</a>';

/** "2026-10-05" -> "05.10.2026." */
const datumTacke = iso => iso.split('-').reverse().join('.') + '.';

/*
 * Crveni okvir na vrhu i na dnu stranica koje navode racune i propise.
 * Garancije nema ni za brojeve ni za navode iz zakona — to se mora reci
 * glasno, i prije i poslije teksta, da ga niko ne promasi.
 */
const NE_GARANTUJEMO =
  '<p class="up-negarancija"><b>Ništa od ovoga nije garantovano.</b> Ovo nije službena stranica. '
  + 'Niko ne može garantovati da su računi, šifre općina, navodi i citati iz zakona i pravilnika, '
  + 'niti bilo koja druga tvrdnja na ovoj stranici tačni, potpuni i važeći na dan tvoje uplate. '
  + 'Prije uplate sve potvrdi kod Porezne uprave FBiH, u banci ili kod knjigovođe. '
  + 'Odgovornost za uplatu je na tebi — vidi <b>Pomoć → Pravno i privatnost</b>.</p>';

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));

/**
 * Uputstvo za koristenje — sadrzaj lijevo, tekst desno, kao XP Help.
 *
 * Brojevi i racuni se ne prepisuju rucno nego izvode iz config.js i
 * calc.js. Tako uputstvo ne moze zastarjeti kad se stope promijene.
 */

/*
 * Sadrzaj se gradi pri svakom otvaranju, ne jednom pri ucitavanju:
 * korisnik stope moze promijeniti u postavkama, pa bi zapecen primjer
 * pokazivao brojeve koji vise ne vaze.
 */

const lanacTabela = (PRIMJER, STOPE) => {
  const red = (naziv, stopa, id, istaknut) =>
    '<tr' + (istaknut ? ' class="up-istaknut"' : '') + '>'
    + '<td>' + naziv + '</td>'
    + '<td class="up-desno">' + stopa + '</td>'
    + '<td class="up-desno">' + fmt(PRIMJER[id]) + '</td></tr>';

  return '<table class="up-tabela">'
    + '<tr><th>Korak</th><th class="up-desno">Stopa</th><th class="up-desno">Primjer (KM)</th></tr>'
    + red('Osnovica — ono što upišeš', '—', 'osnovica')
    + red('Rashodi', fmtPct(STOPE.rashodi * 100), 'rashodi')
    + red('Osnovica za doprinose', 'osnovica − rashodi', 'osnDopr')
    + red('Doprinosi', fmtPct(STOPE.doprinosi * 100), 'doprinosi')
    + red('&nbsp;&nbsp;→ Kanton', fmtPct(STOPE.kanton * 100), 'kanton')
    + red('&nbsp;&nbsp;→ Federacija', fmtPct(STOPE.federacija * 100), 'federacija')
    + red('Osnovica poreza', 'osn. doprinosa − doprinosi', 'osnPoreza')
    + red('Porez na dohodak', fmtPct(STOPE.porez * 100), 'porez')
    + red('<b>Ukupno za uplatu</b>', 'doprinosi + porez', 'ukupno', true)
    + red('<b>Ukupno za zadržat</b>', 'osnovica − ukupno', 'neto', true)
    + '</table>';
};

const teme = () => {
  const STOPE = stope();
  const PRIMJER = obracun(parseInput(ZADANA_OSNOVICA));
  // Tabele primalaca i racuna su za kanton koji je trenutno izabran.
  const KANTON = kantonPodataka(ucitaj());
  const PRIMAOCI = primaoci(KANTON);
  return [
  {
    id: 'pocetak',
    naslov: 'Brzi početak',
    sadrzaj:
      '<p>Aplikacija računa koliko od tvog prihoda ide na doprinose i porez, a koliko ostaje tebi — i popunjava tri uplatnice koje se odnesu u banku.</p>' +
      '<ol>' +
        '<li>Upiši ukupan prihod u polje <b>Osnovica</b>. Tabela se računa dok kucaš.</li>' +
        '<li>Otvori <b>Alati → Moji podaci</b> i upiši svoje podatke. To se radi jednom.</li>' +
        '<li>Otvori <b>Prikaz → Prikaži uplatnice</b> — tri naloga su već popunjena.</li>' +
        '<li><b>Datoteka → Ispis uplatnica</b> i nosiš ih u banku ili na poštu.</li>' +
        '<li>Popuni <b>AMS-1035</b> u dva primjerka i odnesi ih u Poreznu upravu.</li>' +
      '</ol>' +
      '<h4>Rokovi</h4>' +
      '<ul>' +
        '<li>Porez se uplaćuje <b>najkasnije naredni dan</b> od dana kada si primio dohodak.' + IZVOR_ROKOVI + '</li>' +
        '<li>Obrazac AMS-1035 se predaje <b>u roku od 5 dana</b> od primitka dohotka, poreznoj ispostavi prema mjestu prebivališta.' + IZVOR_ROKOVI + '</li>' +
      '</ul>' +
      '<p class="up-savjet">Unos preživi zatvaranje browsera, pa sljedeći put nastavljaš gdje si stao.</p>',
  },
  {
    id: 'obracun',
    naslov: 'Kako se računa',
    sadrzaj:
      '<p>Račun ide u koracima — svaki se oslanja na prethodni, ne na početnu osnovicu. Primjer je za osnovicu od ' + fmt(PRIMJER.osnovica) + ' KM.</p>' +
      lanacTabela(PRIMJER, STOPE) +
      '<p>Kolona <b>%</b> u glavnoj tabeli pokazuje stopu primijenjenu u tom koraku, ne udio u ukupnom prihodu. Možeš je sakriti pod <b>Prikaz → Prikaži % kolonu</b>.</p>' +
      '<h4>Vrsta prihoda</h4>' +
      '<p>Priznati rashodi nisu isti za svaki prihod. Za <b>povremenu samostalnu djelatnost</b> — programiranje, dizajn, prevod, konsalting — priznaje se <b>20%</b> (član 15. stav 7. Zakona o porezu na dohodak FBiH). Za <b>autorsku naknadu</b>, honorar za autorsko djelo, priznaje se <b>30%</b> (stav 8. istog člana).' + IZVOR_ROKOVI + '</p>' +
      '<p>Bira se u glavnom prozoru, ispod polja za osnovicu, desno od kantona. Mijenja samo taj postotak; doprinosi, raspodjela i porez ostaju isti. Izbor se pamti.</p>' +
      '<p class="up-savjet">Zakon za autorske naknade dozvoljava i <b>stvarni iznos</b> troškova umjesto postotka. To traži dokumentovane troškove, pa program tu računicu ne radi — ko ide tim putem, računa sam.</p>' +
      '<h4>Zaokruživanje</h4>' +
      '<p>Sve se računa u feninzima, cijelim brojevima. Svaka stavka se zaokruži odmah, a Kanton nosi ostatak — zato tri uplatnice <b>uvijek</b> zbrajaju tačno na „Ukupno za uplatu”. Da se računalo u decimalama, znale bi promašiti za fening.</p>',
  },
  {
    id: 'podaci',
    naslov: 'Moji podaci i profili',
    sadrzaj:
      '<p><b>Alati → Moji podaci</b> otvara bočni prozor. Ono što tu upišeš prepisuje se na sve tri uplatnice.</p>' +
      '<p>Prozor je nemodalan — ostaje otvoren dok mijenjaš osnovicu, pa odmah vidiš efekat.</p>' +
      '<h4>Korisno</h4>' +
      '<ul>' +
        '<li><b>Općina</b> je padajući izbornik sa općinama kantona izabranog u glavnom prozoru — sada ' + KANTON.opcine.length + ' općina, ' + esc(KANTON.naziv) + '. Kad izabereš, sam popuni i „Mjesto uplate” — ali ne gazi ako si ga ručno upisao. Za gradske općine Sarajeva upiše „Sarajevo”, a za Grad Mostar „Mostar”.</li>' +
        '<li>Uz svako datumsko polje stoje <b>−</b> i <b>+</b> za pomak od jednog dana. Prazno polje kreće od današnjeg.</li>' +
        '<li><b>uvijek današnji datum</b>, ispod datuma uplate, zaključa polje i drži ga na današnjem, i pri svakom sljedećem otvaranju. Tada se gase i koraci −/+.</li>' +
        '<li><b>Ovaj mjesec</b> i <b>Prošli mjesec</b>, u naslovu grupe <b>Porezni period</b>, popune period od prvog do zadnjeg dana.</li>' +
        '<li>Prekidač za <b>potpis</b> ispisuje plavo <b>[TVOJ POTPIS]</b> na mjestu potpisa na sve tri uplatnice i na obrascu — podsjetnik da se tu potpišeš rukom.</li>' +
        '<li><b>Obriši unos</b> prazni sva polja. Snimljeni profili ostaju.</li>' +
      '</ul>' +
      '<h4>Profili</h4>' +
      '<p>U traci lijevo stoji <b>pet mjesta</b>. Ako računaš za više osoba ili više općina, svako može držati svoj set podataka.</p>' +
      '<ul>' +
        '<li><b>Prazno mjesto</b> (isprekidana ivica) — klik ga odmah popuni trenutnim unosom i ponudi da mu daš naziv.</li>' +
        '<li><b>Popunjeno mjesto</b> — klik učitava taj profil preko trenutnog unosa.</li>' +
        '<li>Ispod naziva stoje tri dugmeta: <b>disketa</b> snima trenutni unos u taj profil, <b>olovka</b> ga preimenuje, <b>crveni ✕</b> ga briše.</li>' +
        '<li>Kad se unos razlikuje od snimljenog profila, izmijenjena polja dobiju narandžasti okvir, a disketa na tom profilu se upali.</li>' +
      '</ul>' +
      '<p class="up-savjet">Trenutni unos i snimljeni profil su odvojeni. Možeš mijenjati podatke koliko hoćeš — snimljeni profil se ne dira dok ga izričito ne prepišeš.</p>',
  },
  {
    id: 'uplatnice',
    naslov: 'Uplatnice',
    sadrzaj:
      '<p>Tri naloga, jer novac ide na tri različita računa. Za ' + esc(KANTON.naziv) + ':</p>' +
      '<table class="up-tabela">' +
        '<tr><th>#</th><th>Primalac</th><th>Račun</th><th>Vrsta prihoda</th></tr>' +
        PRIMAOCI.map((p, i) =>
          '<tr><td>' + (i + 1) + '</td><td>' + esc(punNaziv(p)) + '</td>'
          + '<td class="up-mono">' + esc(p.acc) + '</td>'
          + '<td class="up-mono">' + esc(p.vrsta) + '</td></tr>').join('') +
      '</table>' +
      '<p>Prva i treća uplatnica zavise od kantona, druga je ista za cijelu Federaciju. Kanton se bira u glavnom prozoru. Uz svaki račun stoji plavo <b>i</b>: kaže odakle je račun i kako ga provjeriti (vidi <b>Računi i provjera</b>).</p>' +
      '<h4>Vrsta uplate i porezni period</h4>' +
      '<ul>' +
        '<li><b>Vrsta uplate</b> nosi <b>' + FIKSNE_NULE.vrstaUplate + '</b> — redovna uplata. Tako traži Pravilnik o načinu uplate (tačka 10.2, polje 10). Mnoge banke prazno polje prihvate i same podrazumijevaju nulu, ali upisana nula je ono što propis kaže.</li>' +
        '<li><b>Porezni period</b> se piše kao dd/mm/gg, šest kućica (tačka 10.2, polja 12 i 13). Od 01.01.2025. banka <b>odbija nalog za doprinose</b> bez pravilno označenog perioda (tačka 6.1.9), pa uplatnica upozori kad ga nisi upisao.</li>' +
      '</ul>' +
      '<h4>Boje na nalogu</h4>' +
      '<ul>' +
        '<li><b class="up-crno">Crno</b> — ono što se mijenja od osobe do osobe: ime, adresa, telefon, tvoj račun, JMBG, općina, mjesto, datum, period i iznos.</li>' +
        '<li><b class="up-bordo">Tamnocrveno</b> — ono što ne upisuješ ti: svrha, primalac, račun primaoca, vrsta prihoda, vrsta uplate (' + FIKSNE_NULE.vrstaUplate + '), te poziv na broj (' + FIKSNE_NULE.poziv + ') i budžetska organizacija (' + FIKSNE_NULE.organizacija + '), koji su uvijek nule.</li>' +
      '</ul>' +
      '<h4>Dva načina prikaza</h4>' +
      '<ul>' +
        '<li><b>Sve odjednom</b> — sve tri jedna ispod druge, prozor se skroluje</li>' +
        '<li><b>Jedna po jedna</b> — biraš tabovima 1, 2, 3</li>' +
      '</ul>' +
      '<p>Način prikaza je samo za ekran. <b>Ispis uvijek štampa sve tri.</b></p>',
  },
  {
    id: 'racuni',
    naslov: 'Računi i provjera',
    sadrzaj:
      NE_GARANTUJEMO +
      '<p>Račun primaoca je jedini broj na uplatnici koji, kad je pogrešan, šalje novac na krivo mjesto. Zato ovdje piše odakle su računi i kako ih provjeriti.</p>' +
      '<h4>Odakle su</h4>' +
      '<p>Iz <b>Pravilnika o načinu uplate, pripadnosti i raspodjele javnih prihoda u FBiH</b>, prečišćen tekst do SN 48/26 (1. jul 2026). Budžeti kantona su u tabeli 12.1.2, zavodi zdravstvenog osiguranja u 12.1.4, a šifre općina u tački 12.2. Pravilnik donosi Federalno ministarstvo finansija, a objavljuje ga i Porezna uprava FBiH. ' + veza(RACUNI_IZVOR, 'Pravilnik, službeni PDF') + '</p>' +
      '<p>Provjereno <b>' + datumTacke(RACUNI_PROVJERENO) + '</b> Svaki račun prolazi i kontrolni broj (ISO 7064, MOD 97-10), koji hvata pogrešno prepisanu cifru.</p>' +
      '<h4>Zašto Pravilnik, a ne stranica</h4>' +
      '<p>Porezna uprava ima i stranicu „Uplatni računi”, ali ona kasni za propisom. Za zavod zdravstvenog osiguranja Hercegovačko-neretvanskog kantona stranica je 5. oktobra 2026. još pokazivala račun kod Addiko banke. Taj račun je izmjena Pravilnika 74/25, iz septembra 2025, zamijenila računom kod Nove banke. Oba broja prolaze kontrolni broj, pa razliku pokaže tek poređenje sa Pravilnikom. ' + veza(VEZA_IZMJENA_74_25, 'Izmjena 74/25') + ' · ' + veza(VEZA_UPLATNI_RACUNI, 'Stranica „Uplatni računi”') + '</p>' +
      '<h4>Računi se mijenjaju</h4>' +
      '<p>Od izmjene 48/26 izmjene računa izlaze četiri puta godišnje: u januaru, aprilu, julu i oktobru. <b>Program se ne ažurira sam.</b> Ako je datum provjere gore stariji od tri mjeseca, provjeri ponovo.</p>' +
      '<h4>Kako provjeriti</h4>' +
      '<ol>' +
        '<li>Otvori Pravilnik (veza gore).</li>' +
        '<li>Nađi tabelu 12.1.2 za porez i 12.1.4 za doprinose, pa red svog kantona.</li>' +
        '<li>Uporedi broj sa uplatnicom. Pravilnik ga piše sa crticama, npr. <span class="up-mono">' + racunKaoUPravilniku(PRIMAOCI[0].acc) + '</span>.</li>' +
        '<li>Ako se ne slaže, ili nisi siguran, pitaj banku ili ispostavu Porezne uprave <b>prije</b> uplate.</li>' +
      '</ol>' +
      '<h4>Računi za ' + esc(KANTON.naziv) + '</h4>' +
      '<table class="up-tabela">' +
        '<tr><th>Primalac</th><th>Račun, kako ga piše Pravilnik</th><th>Banka</th></tr>' +
        PRIMAOCI.map(p =>
          '<tr><td>' + esc(punNaziv(p)) + '</td>'
          + '<td class="up-mono">' + racunKaoUPravilniku(p.acc) + '</td>'
          + '<td>' + esc(p.banka) + '</td></tr>').join('') +
      '</table>' +
      '<p>Sajt zavoda: ' + veza(KANTON.zavod.web, esc(KANTON.zavod.kratko)) + ' · spisak svih zavoda: ' + veza(VEZA_ZAVODI, 'Zavod zdravstvenog osiguranja i reosiguranja FBiH') + '</p>' +
      NE_GARANTUJEMO,
  },
  {
    id: 'ams',
    naslov: 'Obrazac AMS-1035',
    sadrzaj:
      '<p>Uz uplatnice se Poreznoj upravi predaje i <b>AMS-1035</b> — „Akontacija poreza po odbitku na druge samostalne djelatnosti na prihod iz inostranstva”. Otvara se ikonom na radnoj površini ili preko <b>Prikaz → Prikaži obrazac AMS-1035</b>.</p>' +
      '<p>Popunjava se sam, iz istih podataka kao i uplatnice. Dio 3 uzima brojeve iz obračuna:</p>' +
      '<table class="up-tabela">' +
        '<tr><th>Kolona na obrascu</th><th>Odakle dolazi</th></tr>' +
        '<tr><td>9) Iznos dohotka</td><td>Osnovica za obračun doprinosa</td></tr>' +
        '<tr><td>10) Zdravstveno osiguranje</td><td>Doprinosi</td></tr>' +
        '<tr><td>11) Osnovica za porez</td><td>Osnovica poreza na dohodak</td></tr>' +
        '<tr><td>12) Iznos poreza</td><td>Porez</td></tr>' +
      '</table>' +
      '<p>U kolonu 9 ide <b>već umanjen</b> iznos — osnovica nakon priznatih rashoda, ne ukupan prihod.</p>' +
      '<h4>Šta se ne popunjava</h4>' +
      '<ul>' +
        '<li><b>Kolone 13 i 14</b> su precrtane: porez u inostranstvu nije plaćen, pa nema ni kredita ni razlike.</li>' +
        '<li><b>Broj stranice</b> i red „Ukupno za sve stranice” ostaju prazni. Tiču se prenosa preko više stranica, a program računa jednu uplatu.</li>' +
      '</ul>' +
      '<h4>Isplatilac</h4>' +
      '<p>Polja 6, 7 i 8 — naziv, adresa i država onoga ko ti je platio — upisuju se u <b>Moji podaci</b>, u odjeljku na dnu. Uplatnicama ne trebaju, ali bez njih obrazac nije potpun.</p>' +
      '<p>Predaje se <b>u roku od 5 dana</b> od primitka dohotka, u <b>dva primjerka</b>.' + IZVOR_ROKOVI + '</p>' +
      '<p class="up-savjet">Obrazac se štampa na položeni A4. Ispis pokreni dugmetom u samom prozoru ili preko <b>Datoteka → Ispis obrasca AMS-1035</b>.</p>',
  },
  {
    id: 'godisnja',
    naslov: 'Godišnja prijava GPD-1051',
    sadrzaj:
      NE_GARANTUJEMO +
      '<p>Freelancer do <b>31. marta</b> predaje godišnju prijavu za prethodnu godinu (Pravilnik o primjeni Zakona o porezu na dohodak, član 75.). Akontacija plaćena uz AMS-1035 nije konačan porez: u prijavi se dohodak umanji za lični odbitak, pa ko nema drugog dohotka obično dobije dio poreza nazad.</p>' +
      '<p>Otvara se ikonom <b>Godišnja prijava</b> na radnoj površini ili preko <b>Prikaz → Prikaži godišnju prijavu GPD-1051</b>. Prozor ima četiri kartice:</p>' +
      '<ul>' +
        '<li><b>Prihodi</b> — iznos svake uplate po mjesecima, isti kao na njenom AMS-1035. Više uplata u mjesecu dodaješ sa <b>+</b>.</li>' +
        '<li><b>Odbici i ostalo</b> — faktor ličnog odbitka iz porezne kartice, troškovi liječenja i kamata na stambeni kredit, plata ako je bilo (GIP-1022), porez plaćen u inostranstvu, i šta s preplatom.</li>' +
        '<li><b>Obračun</b> — svaki red obrasca, povrat ili doplata, šta priložiti i rok.</li>' +
        '<li><b>Obrazac</b> — popunjen GPD-1051, obje stranice, crtan po službenom PDF-u. <b>Ispis</b> ga štampa u pravoj veličini, svaku stranicu na svoj A4.</li>' +
      '</ul>' +
      '<h4>Kako se računa</h4>' +
      '<p>Svaka uplata se računa kao u glavnom prozoru. Red 13 je zbir „osnovica za porez” (prihod minus priznati rashodi minus 4% zdravstvenog), red 29 zbir uplaćenog poreza. Da porez sa AMS-1035 ide baš u red 29, zaključeno je iz obrasca, jer službeno uputstvo koje razdvaja redove 28 i 29 nije nađeno; na konačan iznos to ne utiče, jer se oba oduzimaju. Lični odbitak je 3.600 KM godišnje, uvećan po faktoru, a za dio godine srazmjerno, na pune mjesece. Porez je 10% od osnovice, a razlika do uplaćenog je povrat ili doplata.</p>' +
      '<p>Ime, JMB, adresu, telefon i račun za povrat obrazac uzima iz <b>Moji podaci</b>. Datum i potpis u Dijelu 5 pišu se rukom, na dan predaje.</p>' +
      '<p class="up-savjet">Unos se pamti u ovom browseru, kao i ostali podaci, i briše ga <b>Obriši sve podatke</b>.</p>' +
      NE_GARANTUJEMO,
  },
  {
    id: 'stope',
    naslov: 'Postavke stopa',
    sadrzaj:
      '<p><b>Alati → Postavke poreskih stopa</b> otvara prozor u kojem se stope mogu promijeniti ručno.</p>' +
      '<p>Polja stoje zaključana dok ne potvrdiš kvačicom da razumiješ šta radiš. To nije formalnost: pogrešna stopa ne prijavi grešku, samo tiho ispiše pogrešan iznos na uplatnicu.</p>' +
      '<p><b>Kanton se ne unosi</b> nego izvodi — uvijek je ostatak do cjeline nakon Federacije. Tako se to dvoje ne može zbrojiti u nešto što nije 100%.</p>' +
      '<p>Izmijenjena stopa dobija žutu podlogu i podsjetnik koja je bila zadana. <b>Vrati zadane</b> ih vraća na vrijednosti s kojima program dolazi.</p>' +
      '<p>Promjena odmah prolazi kroz cijeli program — tabelu, uplatnice, obrazac i primjer u ovom uputstvu.</p>',
  },
  {
    id: 'ispis',
    naslov: 'Ispis i izvoz',
    sadrzaj:
      '<h4>Ispis</h4>' +
      '<ul>' +
        '<li><b>Datoteka → Ispis uplatnica</b> — na papir idu samo obrasci, bez tabele i bez okvira prozora. Radi i kad je prozor sa uplatnicama zatvoren.</li>' +
        '<li><b>Datoteka → Ispis obrasca AMS-1035</b> — obrazac sam, na položenom A4.</li>' +
        '<li><b>Ctrl+P</b> — štampa cijelu stranicu: obračun i uplatnice.</li>' +
      '</ul>' +
      '<p>Papir dobija svoje zaglavlje i podnožje — naziv dokumenta, porezni period i napomenu da nije službeni dokument.</p>' +
      '<p class="up-savjet">U dijalogu za štampu ostavi margine na <b>Default</b>. Ako ih razvučeš, browser dobije mjesta i upiše svoj naslov i adresu stranice u vrh papira.</p>' +
      '<h4>Izvoz</h4>' +
      '<p><b>Datoteka → Spremi kao</b> nudi dvoje:</p>' +
      '<ul>' +
        '<li><b>PDF</b> — obračun i pregled uplatnica kao dokument</li>' +
        '<li><b>Excel</b> — dva lista, „Obračun” i „Uplatnice”. Iznosi su pravi brojevi, pa možeš računati po njima.</li>' +
      '</ul>' +
      '<p>Ime datoteke nosi period i iznos, npr. <b>obracun-2026-08-1000KM</b>, da se u folderu punom izvoza vidi šta je u kojem.</p>' +
      '<p><b>Lični podaci ne ulaze u izvoz.</b> Izvoz je račun, a ne lična karta — tabela koja ide knjigovođi nema razloga nositi tvoj JMBG.</p>' +
      '<p class="up-savjet">Prvi izvoz traje koju sekundu duže — biblioteke za PDF i Excel se skidaju tek kad zatrebaju, da se stranica inače otvara brzo.</p>',
  },
  {
    id: 'prozori',
    naslov: 'Prozori',
    sadrzaj:
      '<p>Ikone na radnoj površini stoje u mreži, kao u XP-u: klik označi, dvoklik ili <b>Enter</b> otvara, a <b>strelice</b> šetaju po mreži.</p>' +
      '<ul>' +
        '<li><b>Pomjeranje</b> — povuci prozor za naslovnu traku. Dvoklik na traku ga vraća na mjesto.</li>' +
        '<li><b>Veličina</b> — povuci bilo koju ivicu ili ugao. Dvoklik na ivicu vraća zadanu veličinu. Početno upozorenje je izuzetak: njegova veličina je računata tako da slika stane cijela, pa se ne dira.</li>' +
        '<li><b>Prikaz → Vrati prozor na sredinu</b> vraća glavni prozor ako ti odluta.</li>' +
      '</ul>' +
      '<h4>Krupnije, ako slabije vidiš</h4>' +
      '<p><b>Uplatnice</b> i <b>obrazac AMS-1035</b> rastu zajedno sa prozorom — povećaj prozor i sadržaj se poveća s njim. To su replike papira: polje je na njima tu i toliko, pa je jedini način da se vide krupnije da se uvećaju cijeli.</p>' +
      '<p>Rastu samo kad prozor poraste u <b>oba</b> smjera. Ako ga samo raširiš ili samo izdužiš, višak prostora ostaje prazan umjesto da razvlači obrazac.</p>' +
      '<p><b>Moji podaci</b> se ne uvećavaju — tamo širina ide u polja, pa se prozor širi a slova ostaju ista. Ko treba krupnije svuda, najbolje prolazi sa zumom samog browsera (<b>Ctrl</b> i <b>+</b>).</p>' +
      '<h4>Donja traka</h4>' +
      '<p>Svaki otvoren prozor ima dugme na donjoj traci. Klik na dugme aktivnog prozora ga sklanja, klik na sklonjeni ga vraća.</p>' +
      '<p>Na telefonu ta traka stalno drži osam ikona — Kalkulator, Moje podatke, uplatnice, AMS-1035, godišnju prijavu, pomoć, pravno i resurse — i jedini je način da se prozor otvori, jer prečice sa radne površine tamo ne stoje.</p>' +
      '<p><b>Moji podaci</b> i <b>Uplatnice</b> su nemodalni: mogu stajati otvoreni dok radiš u kalkulaciji, i mogu se rasporediti kako ti odgovara.</p>' +
      '<p>Dijalozi poput ovog zatvaraju se sa <b>Esc</b> ili klikom pored.</p>',
  },
  {
    id: 'privatnost',
    naslov: 'Gdje se čuvaju podaci',
    sadrzaj:
      '<p>Sve ostaje u <b>tvom browseru</b>. Nema servera, nema naloga, ništa se nigdje ne šalje. Ni ime, ni JMBG, ni broj računa.</p>' +
      '<p><b>Alati → Obriši sve podatke</b> briše sve odjednom i nepovratno — lične podatke, sve profile, unesenu osnovicu, vrstu prihoda, unos godišnje prijave i izmijenjene stope.</p>' +
      '<p>Potpun popis onoga što se čuva, zajedno s tim gdje i zašto, stoji pod <b>Pomoć → Pravno i privatnost</b>.</p>' +
      '<p>Čuvaju se: zadnja osnovica, vrsta prihoda, lični podaci (s njima i kanton, preko općine), snimljeni profili, unos godišnje prijave i izmijenjene stope. Uz to četiri sitne oznake: da si pročitao početno upozorenje, da li je bilješka otvorena, koju si njenu stranicu zadnju gledao, i da si zatvorio balon „Šta je novo”.</p>' +
      '<h4>Šta to znači u praksi</h4>' +
      '<ul>' +
        '<li>Drugi browser ili drugi računar — prazno, podaci se ne prenose.</li>' +
        '<li>Brisanje podataka pregleda ili privatni prozor — podaci nestaju.</li>' +
        '<li>Ako ti podaci trebaju drugdje, prepiši ih ručno ili izvezi u Excel.</li>' +
      '</ul>',
  },
  {
    id: 'resursi',
    naslov: 'Službeni resursi',
    sadrzaj:
      '<p>Sve brojke u programu dolaze iz propisa i sa stranica <b>Porezne uprave FBiH</b>. Do njih se stiže iz samog programa, ikonom <b>Resursi</b> na radnoj površini ili preko <b>Pomoć → Službeni resursi</b>.</p>' +
      '<p>Tamo stoje: vodič za freelancere, Pravilnik sa računima i šiframa općina, stranica uplatnih računa, službeni PDF obrazaca AMS-1035 i GPD-1051, zakoni, e-Doprinosi i kontakti ispostava.</p>' +
      '<p>To je jedini dio programa koji vodi van. Veze se otvaraju u novoj kartici, pa dok ne klikneš, program i dalje ništa ne traži s mreže.</p>' +
      '<p class="up-savjet">Propisi se mijenjaju. Kad ti nešto izgleda čudno, provjeri na izvoru prije nego platiš.</p>',
  },
  {
    id: 'ogranicenja',
    naslov: 'Ograničenja',
    sadrzaj:
      '<p class="up-oprez">Ovo nije službena stranica i nije povezana ni s jednom institucijom. <b>Prije uplate provjeri iznose</b> kod Porezne uprave FBiH, u banci ili kod knjigovođe.</p>' +
      '<ul>' +
        '<li>Program pokriva svih <b>' + KANTONI.length + ' kantona Federacije BiH</b>. Republika Srpska i Brčko Distrikt imaju svoje propise, račune i obrasce, i nisu pokriveni.</li>' +
        '<li>Stope, računi i šifre općina provjereni su kod izvora ' + datumTacke(RACUNI_PROVJERENO) + ' Propisi se mijenjaju, a program se ne ažurira sam — prije uplate provjeri iznose i račune (vidi <b>Računi i provjera</b>).</li>' +
        '<li>Obračun pokriva dohodak od samostalne djelatnosti — ne obuhvata olakšice, odbitke ni posebne slučajeve.</li>' +
      '</ul>' +
      '<p>Cijelo upozorenje: <b>Pomoć → Upozorenje</b>.</p>',
  },
  ];
};

export function napraviUputstvo() {
  /*
   * Naslov i tekst svake teme stoje jedno uz drugo u DOM-u. Na telefonu
   * to daje listu koja se otvara i zatvara; na sirokom ekranu ih mreza
   * razvrsta u dvije kolone, naslove lijevo a tekst desno.
   */
  const stavke = () => teme().map((t, i) =>
    '<div class="up-stavka">'
    + '<button type="button" class="up-tema' + (i === 0 ? ' aktivna' : '') + '"'
    + ' data-up-tema="' + t.id + '"><span class="up-strelica"></span>'
    + esc(t.naslov) + '</button>'
    + '<article class="up-clanak' + (i === 0 ? ' aktivan' : '') + '" data-up-clanak="' + t.id + '">'
    + '<h3>' + esc(t.naslov) + '</h3>' + t.sadrzaj + '</article>'
    + '</div>').join('');

  const prozor = napraviProzor({
    naslov: 'Uputstvo za korištenje',
    ikona: ikone.POMOC,
    sirina: 'min(880px, 94vw)',
    klasa: 'up-prozor',
    // Ide na donju traku, pa se na telefonu moze otvoriti i odatle.
    // Minimiziranje sklanja i podlogu, tako da uputstvo tada ne blokira
    // rad — a ostaje otvoreno, na dohvat jednog dodira.
    minimizirati: true,
    nazivNaTraci: 'Pomoć',
    promjenjivo: true,
    najmanjaSirina: 420,
    najmanjaVisina: 300,
    animacija: true,
    sadrzaj:
      '<div class="up-raspored">'
      + '<div class="up-nav-naslov">Sadržaj</div>'
      + stavke()
      + '</div>',
    dugmad: [{ tekst: 'Zatvori', primarno: true }],
  });

  const tijelo = prozor.tijelo;

  /* Na uskom ekranu je ovo lista koja se sklapa, pa se aktivna tema
     moze i zatvoriti. Na sirokom uvijek jedna mora biti otvorena, inace
     bi desna kolona ostala prazna. */
  const jeLista = () => window.matchMedia('(max-width: 760px)').matches;

  tijelo.addEventListener('click', e => {
    const dugme = e.target.closest('[data-up-tema]');
    if (!dugme) return;
    const id = dugme.dataset.upTema;
    const vecOtvorena = dugme.classList.contains('aktivna');
    const zatvori = vecOtvorena && jeLista();

    tijelo.querySelectorAll('.up-tema').forEach(b =>
      b.classList.toggle('aktivna', !zatvori && b.dataset.upTema === id));
    tijelo.querySelectorAll('.up-clanak').forEach(a =>
      a.classList.toggle('aktivan', !zatvori && a.dataset.upClanak === id));

    if (!zatvori && jeLista()) {
      // otvorena tema mora biti u vidnom polju
      dugme.scrollIntoView({ block: 'nearest' });
    }
    prozor.uklopi();
  });

  /*
   * Promjena stopa mijenja i primjer u "Kako se racuna", pa se sadrzaj
   * gradi ispocetka. Koja je tema bila otvorena se zadrzava — inace bi
   * se uputstvo pri svakoj izmjeni vratilo na prvu temu.
   */
  const pokaziTemu = id => {
    tijelo.querySelectorAll('.up-tema').forEach(b =>
      b.classList.toggle('aktivna', b.dataset.upTema === id));
    tijelo.querySelectorAll('.up-clanak').forEach(a =>
      a.classList.toggle('aktivan', a.dataset.upClanak === id));
  };

  prozor.osvjezi = () => {
    const aktivna = tijelo.querySelector('.up-tema.aktivna');
    const id = aktivna ? aktivna.dataset.upTema : null;
    tijelo.querySelector('.up-raspored').innerHTML =
      '<div class="up-nav-naslov">Sadržaj</div>' + stavke();
    if (id) pokaziTemu(id);
  };

  /**
   * Otvori uputstvo odmah na datoj temi — npr. iz balona "i" uz racun,
   * koji vodi na "Racuni i provjera". Sadrzaj se prvo osvjezi, da tabela
   * racuna bude za trenutno izabrani kanton.
   */
  prozor.otvoriTemu = id => {
    prozor.osvjezi();
    pokaziTemu(id);
    prozor.otvori();
    prozor.uklopi();
    const clanak = tijelo.querySelector('[data-up-clanak="' + id + '"]');
    if (clanak) clanak.scrollTop = 0;
    const dugme = tijelo.querySelector('[data-up-tema="' + id + '"]');
    if (dugme) dugme.scrollIntoView({ block: 'nearest' });
    return prozor;
  };

  return prozor;
}

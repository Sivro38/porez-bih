import { napraviProzor } from './prozor.js';
import { PRIMAOCI, OPCINE_ZEDO, FIKSNE_NULE, ZADANA_OSNOVICA, punNaziv } from './config.js';
import { stope } from './stope.js';
import { fmt, fmtPct, parseInput } from './format.js';
import { obracun } from './calc.js';

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
        '<li><b>Datoteka → Ispis uplatnica</b> i nosiš ih u banku.</li>' +
      '</ol>' +
      '<p class="up-savjet">Unos preživi zatvaranje browsera, pa sljedeći put nastavljaš gdje si stao.</p>',
  },
  {
    id: 'obracun',
    naslov: 'Kako se računa',
    sadrzaj:
      '<p>Račun ide u koracima — svaki se oslanja na prethodni, ne na početnu osnovicu. Primjer je za osnovicu od ' + fmt(PRIMJER.osnovica) + ' KM.</p>' +
      lanacTabela(PRIMJER, STOPE) +
      '<p>Kolona <b>%</b> u glavnoj tabeli pokazuje stopu primijenjenu u tom koraku, ne udio u ukupnom prihodu. Možeš je sakriti pod <b>Prikaz → Prikaži % kolonu</b>.</p>' +
      '<h4>Zaokruživanje</h4>' +
      '<p>Sve se računa u feningima, cijelim brojevima. Svaka stavka se zaokruži odmah, a Kanton nosi ostatak — zato tri uplatnice <b>uvijek</b> zbrajaju tačno na „Ukupno za uplatu”. Da se računalo u decimalama, znale bi promašiti za fening.</p>',
  },
  {
    id: 'podaci',
    naslov: 'Moji podaci i profili',
    sadrzaj:
      '<p><b>Alati → Moji podaci</b> otvara bočni prozor. Ono što tu upišeš prepisuje se na sve tri uplatnice.</p>' +
      '<p>Prozor je nemodalan — ostaje otvoren dok mijenjaš osnovicu, pa odmah vidiš efekat.</p>' +
      '<h4>Korisno</h4>' +
      '<ul>' +
        '<li><b>Općina</b> je padajući izbornik sa svih ' + OPCINE_ZEDO.length + ' općina ZE-DO kantona. Kad izabereš, sam popuni i „Mjesto uplate” — ali ne gazi ako si ga ručno upisao.</li>' +
        '<li>Uz svako datumsko polje stoje <b>−</b> i <b>+</b> za pomak od jednog dana. Prazno polje kreće od današnjeg.</li>' +
        '<li><b>Datum uplate = današnji datum</b> zaključa polje i drži ga na današnjem, i pri svakom sljedećem otvaranju. Tada se gase i koraci.</li>' +
        '<li><b>Period = ovaj mjesec</b> / <b>prošli mjesec</b> popune porezni period od prvog do zadnjeg dana.</li>' +
        '<li>Prekidač za <b>potpis</b> ispisuje plavo <b>[TVOJ POTPIS]</b> na mjestu potpisa na sve tri uplatnice i na obrascu — podsjetnik da se tu potpišeš rukom.</li>' +
        '<li><b>Obriši unos</b> prazni sva polja. Snimljeni profili ostaju.</li>' +
      '</ul>' +
      '<h4>Profili</h4>' +
      '<p>Na vrhu prozora stoje <b>tri mjesta</b>. Ako računaš za više osoba ili više općina, svako može držati svoj set podataka.</p>' +
      '<ul>' +
        '<li><b>Prazno mjesto</b> — klik pita za naziv i snima trenutni unos u njega.</li>' +
        '<li><b>Popunjeno mjesto</b> — klik učitava taj profil preko trenutnog unosa.</li>' +
        '<li><b>⋯</b> u uglu mjesta nudi ostalo: prepiši trenutnim podacima, preimenuj, obriši.</li>' +
      '</ul>' +
      '<p class="up-savjet">Trenutni unos i snimljeni profil su odvojeni. Možeš mijenjati podatke koliko hoćeš — snimljeni profil se ne dira dok ga izričito ne prepišeš.</p>',
  },
  {
    id: 'uplatnice',
    naslov: 'Uplatnice',
    sadrzaj:
      '<p>Tri naloga, jer novac ide na tri različita računa:</p>' +
      '<table class="up-tabela">' +
        '<tr><th>#</th><th>Primalac</th><th>Račun</th><th>Vrsta prihoda</th></tr>' +
        PRIMAOCI.map((p, i) =>
          '<tr><td>' + (i + 1) + '</td><td>' + esc(punNaziv(p)) + '</td>'
          + '<td class="up-mono">' + esc(p.acc) + '</td>'
          + '<td class="up-mono">' + esc(p.vrsta) + '</td></tr>').join('') +
      '</table>' +
      '<h4>Boje na nalogu</h4>' +
      '<ul>' +
        '<li><b class="up-crno">Crno</b> — ono što se mijenja od osobe do osobe: ime, adresa, telefon, tvoj račun, JMBG, općina, mjesto, datum, period i iznos.</li>' +
        '<li><b class="up-bordo">Tamnocrveno</b> — ono što je uvijek isto: svrha, primalac, račun primaoca, vrsta prihoda, te poziv na broj (' + FIKSNE_NULE.poziv + ') i budžetska organizacija (' + FIKSNE_NULE.organizacija + '), koji su uvijek nule.</li>' +
      '</ul>' +
      '<h4>Dva načina prikaza</h4>' +
      '<ul>' +
        '<li><b>Sve odjednom</b> — sve tri jedna ispod druge, prozor se skroluje</li>' +
        '<li><b>Jedna po jedna</b> — biraš tabovima 1, 2, 3</li>' +
      '</ul>' +
      '<p>Način prikaza je samo za ekran. <b>Ispis uvijek štampa sve tri.</b></p>',
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
      '<p class="up-savjet">Obrazac se štampa na položeni A4. Ispis pokreni dugmetom u samom prozoru ili preko <b>Datoteka → Ispis obrasca AMS-1035</b>.</p>',
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
      '<ul>' +
        '<li><b>Pomjeranje</b> — povuci prozor za naslovnu traku. Dvoklik na traku ga vraća na mjesto.</li>' +
        '<li><b>Veličina</b> — povuci bilo koju ivicu ili ugao. Dvoklik na ivicu vraća zadanu veličinu.</li>' +
        '<li><b>Prikaz → Vrati prozor na sredinu</b> vraća glavni prozor ako ti odluta.</li>' +
      '</ul>' +
      '<h4>Krupnije, ako slabije vidiš</h4>' +
      '<p>Uplatnice, obrazac AMS-1035 i Moji podaci <b>rastu zajedno sa prozorom</b> — povećaj prozor i sadržaj se poveća s njim.</p>' +
      '<p>Raste samo kad prozor poraste u <b>oba</b> smjera. Ako ga samo raširiš ili samo izdužiš, višak prostora ostaje prazan umjesto da razvlači obrazac.</p>' +
      '<h4>Donja traka</h4>' +
      '<p>Svaki otvoren prozor ima dugme na donjoj traci. Klik na dugme aktivnog prozora ga sklanja, klik na sklonjeni ga vraća.</p>' +
      '<p>Na telefonu ta traka stalno drži šest ikona — kalkulaciju, uplatnice, AMS-1035, Moje podatke, pomoć i pravno — i jedini je način da se prozor otvori, jer prečice sa radne površine tamo ne stoje.</p>' +
      '<p><b>Moji podaci</b> i <b>Uplatnice</b> su nemodalni: mogu stajati otvoreni dok radiš u kalkulaciji, i mogu se rasporediti kako ti odgovara.</p>' +
      '<p>Dijalozi poput ovog zatvaraju se sa <b>Esc</b> ili klikom pored.</p>',
  },
  {
    id: 'privatnost',
    naslov: 'Gdje se čuvaju podaci',
    sadrzaj:
      '<p>Sve ostaje u <b>tvom browseru</b>. Nema servera, nema naloga, ništa se nigdje ne šalje. Ni ime, ni JMBG, ni broj računa.</p>' +
      '<p><b>Alati → Obriši sve podatke</b> briše sve odjednom i nepovratno — lične podatke, sva tri profila, unesenu osnovicu i izmijenjene stope.</p>' +
      '<p>Potpun popis onoga što se čuva, zajedno s tim gdje i zašto, stoji pod <b>Pomoć → Pravno i privatnost</b>.</p>' +
      '<p>Čuvaju se: zadnja osnovica, lični podaci i snimljeni profili.</p>' +
      '<h4>Šta to znači u praksi</h4>' +
      '<ul>' +
        '<li>Drugi browser ili drugi računar — prazno, podaci se ne prenose.</li>' +
        '<li>Brisanje podataka pregleda ili privatni prozor — podaci nestaju.</li>' +
        '<li>Ako ti podaci trebaju drugdje, prepiši ih ručno ili izvezi u Excel.</li>' +
      '</ul>',
  },
  {
    id: 'ogranicenja',
    naslov: 'Ograničenja',
    sadrzaj:
      '<p class="up-oprez">Ovo nije službena stranica i nije povezana ni s jednom institucijom. <b>Prije uplate provjeri iznose</b> kod Porezne uprave FBiH, u banci ili kod knjigovođe.</p>' +
      '<ul>' +
        '<li>Računi, vrste prihoda i šifre općina vrijede samo za <b>Zeničko-dobojski kanton</b>.</li>' +
        '<li>Stope i računi upisani su ručno i mogu biti zastarjeli.</li>' +
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
  prozor.osvjezi = () => {
    const aktivna = tijelo.querySelector('.up-tema.aktivna');
    const id = aktivna ? aktivna.dataset.upTema : null;
    tijelo.querySelector('.up-raspored').innerHTML =
      '<div class="up-nav-naslov">Sadržaj</div>' + stavke();
    if (!id) return;
    tijelo.querySelectorAll('.up-tema').forEach(b =>
      b.classList.toggle('aktivna', b.dataset.upTema === id));
    tijelo.querySelectorAll('.up-clanak').forEach(a =>
      a.classList.toggle('aktivan', a.dataset.upClanak === id));
  };

  return prozor;
}

import {
  POLJA, ucitaj, snimi, obrisi, mjestoOpcine, mjestoJeAutomatsko, kantonPodataka,
} from './storage.js';
import { napraviProzor, pitajZaPotvrdu } from './prozor.js';
import * as ikone from './ikone.js';
import * as profili from './profili.js';

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));

/** Sve sto profil pamti — polja plus dva prekidaca. */
const KLJUCEVI = POLJA.filter(f => f.key).map(f => f.key).concat(['autoDatum', 'potpis']);

/** Datum -> "GGGG-MM-DD" (lokalno, bez UTC pomaka). */
export function iso(d) {
  return d.getFullYear() + '-'
    + String(d.getMonth() + 1).padStart(2, '0') + '-'
    + String(d.getDate()).padStart(2, '0');
}

/**
 * Prvi i zadnji dan mjeseca pomaknutog za `pomak` od trenutnog.
 * pomak 0 = ovaj mjesec, -1 = prosli.
 */
function graniceMjeseca(pomak) {
  const d = new Date();
  return {
    od: iso(new Date(d.getFullYear(), d.getMonth() + pomak, 1)),
    do: iso(new Date(d.getFullYear(), d.getMonth() + pomak + 1, 0)),
  };
}

function poljeHTML(f, p) {
  const v = esc(p[f.key]);
  if (f.tip === 'datum') {
    /*
     * Dugmad −/+ pomjeraju datum za jedan dan. Biranje iz kalendara je
     * za skok na drugi mjesec; za "dan ranije" je kalendar tri klika, a
     * ovako je jedan.
     *
     * Dugme unutar <label> je po specifikaciji bezbjedno: klik na
     * interaktivni element u labeli se ne prosljedjuje polju, pa se
     * kalendar ne otvara uz svaki korak.
     */
    const korak = (smjer, znak, opis) =>
      '<button type="button" class="pd-korak" data-pd-korak="' + smjer + '"'
      + ' data-polje="' + f.key + '" tabindex="-1" title="' + opis + '">' + znak + '</button>';
    return '<div class="pd-datum">'
      + korak(-1, '−', 'Dan ranije')
      + '<input type="date" class="pd-input" data-key="' + f.key + '" value="' + v + '">'
      + korak(1, '+', 'Dan kasnije')
      + '</div>';
  }
  if (f.tip === 'cifre') {
    return '<input type="text" class="pd-input pd-cifre" data-key="' + f.key + '"'
      + ' inputmode="numeric" maxlength="' + f.duzina + '"'
      + ' placeholder="' + f.duzina + ' cifara" value="' + v + '">';
  }
  if (f.tip === 'izbor') {
    const opcije = typeof f.opcije === 'function' ? f.opcije(p) : f.opcije;
    return '<select class="pd-input" data-key="' + f.key + '">'
      + opcije.map(o =>
          '<option value="' + esc(o.vrijednost) + '"'
          + (String(p[f.key]) === o.vrijednost ? ' selected' : '') + '>'
          + esc(o.tekst) + '</option>').join('')
      + '</select>';
  }
  return '<input type="text" class="pd-input" data-key="' + f.key + '" value="' + v + '">';
}

/**
 * Mjesta za profile (koliko ih je, kaze BROJ_MJESTA u profili.js).
 *
 * Prazno se klikom popuni trenutnim podacima, puno se klikom ucita.
 * Radnje nad punim profilom stoje tu, kao tri sitne ikone — ranije su
 * bile iza tri tacke pa iza dijaloga sa izborom, sto je za preimenovanje
 * bilo tri klika i jedan prozor previse.
 *
 * Stoje u traci lijevo, jedan ispod drugog. Dok su stajali u redu preko
 * vrha, uzimali su osamdeset piksela visine cijelom panelu i dijelili
 * formu na dvoje; u traci ne uzimaju nista, jer forma uz njih ionako
 * ide nize nego oni.
 */
function mjestaHTML(aktivno) {
  const alat = (akcija, ikona, opis, dodatno) =>
    '<button type="button" class="pd-alat ' + (dodatno || '') + '"'
    + ' data-pd-action="' + akcija + '" title="' + opis + '"'
    + ' aria-label="' + opis + '">' + ikona + '</button>';

  return '<div class="pd-okvir pd-stub">'
    + '<div class="pd-okvir-vrh"><span class="pd-okvir-naslov">Profili</span></div>'
    + '<div class="pd-mjesta">' + profili.mjesta().map((p, i) =>
    '<div class="pd-mjesto ' + (p ? 'puno' : 'prazno')
      + (i === aktivno ? ' aktivno' : '') + '" data-i="' + i + '">'
      + '<button type="button" class="pd-mjesto-glavno" data-pd-action="mjesto" data-i="' + i + '"'
      + ' title="' + (p ? 'Učitaj ' + esc(p.naziv) : 'Snimi trenutne podatke ovdje') + '">'
        + '<span class="pd-mjesto-ikona">' + (p ? ikone.KORISNIK : ikone.PRAZNO_MJESTO) + '</span>'
        + '<span class="pd-mjesto-naziv">' + (p ? esc(p.naziv) : 'Prazno') + '</span>'
      + '</button>'
      + (p
          ? '<div class="pd-alati">'
            + alat('snimi-mjesto', ikone.SNIMI_16, 'Snimi izmjene u ovaj profil', 'pd-alat-snimi')
            + alat('preimenuj-mjesto', ikone.PREIMENUJ_16, 'Preimenuj profil')
            + alat('obrisi-mjesto', ikone.OBRISI_16, 'Obriši profil')
            + '</div>'
          : '')
    + '</div>').join('') + '</div></div>';
}

/*
 * Dugmad koja pripadaju jednom polju stoje UZ to polje, ne u zajednickom
 * redu na dnu. "Danas" je radnja nad datumom uplate; dok je stajalo na
 * dnu panela, trebalo je prvo pogoditi na koje od tri datumska polja se
 * odnosi, pa je kraj njega morao stajati i natpis "Datum:".
 */
const UZ_POLJE = {
  datum: () =>
    '<button type="button" class="pd-btn pd-btn-uz" data-pd-action="danas">Danas</button>',
};

const ISPOD_POLJA = {
  datum: p =>
    '<label class="pd-prekidac pd-prekidac-sitni">'
    + '<input type="checkbox" data-pd-auto' + (p.autoDatum ? ' checked' : '') + '>'
    + 'uvijek današnji datum'
    + '</label>',
};

/*
 * Dugmad koja se ticu cijele grupe stoje u njenom naslovu, desno.
 * "Ovaj mjesec" postavlja i Od i Do, dakle oba polja grupe — pod jednim
 * od njih bi izgledalo kao da pripada samo tom polju. U kutiji
 * "Porezni period" nema sta drugo, pa nema ni zabune na sta se odnosi.
 */
const UZ_GRUPU = {
  'Porezni period':
    '<button type="button" class="pd-btn pd-btn-uz" data-pd-action="ovaj-mjesec">Ovaj mjesec</button>'
    + '<button type="button" class="pd-btn pd-btn-uz" data-pd-action="prosli-mjesec">Prošli mjesec</button>',
};

/** Naslov prve grupe; ostale nose svoj iz POLJA. */
const PRVA_GRUPA = 'Poreski obveznik';

/** Jedan red forme: natpis lijevo, polje desno, dugme uz polje. */
function redHTML(f, p) {
  // Opcine su suzene na kanton iz glavnog prozora; to se mora vidjeti
  // ovdje, inace izgleda kao da pola opcina fali.
  const dodatak = f.key === 'opcina'
    ? ' <span class="pd-kanton" title="Kanton se bira u glavnom prozoru, ispod osnovice">'
      + esc(kantonPodataka(p).kratko) + '</span>'
    : '';
  const uz = UZ_POLJE[f.key];
  const ispod = ISPOD_POLJA[f.key];

  return '<label class="pd-red' + (f.usko ? ' pd-usko' : '')
    + (f.key === 'datum' && p.autoDatum ? ' pd-zakljucano' : '') + '">'
    + '<span class="pd-lbl">' + esc(f.label) + dodatak + '</span>'
    + '<span class="pd-polje">' + poljeHTML(f, p) + (uz ? uz(p) : '') + '</span>'
    + '</label>'
    + (ispod ? '<div class="pd-ispod">' + ispod(p) + '</div>' : '');
}

/**
 * Forma, grupisana u okvire.
 *
 * Ranije je bila mreza od dvije kolone, sa natpisom IZNAD svakog polja.
 * Cetrnaest polja puta jedan red natpisa je samo po sebi nosilo preko
 * dvije stotine piksela visine, a oko je moralo skakati gore-dolje i
 * lijevo-desno da spoji natpis s poljem.
 *
 * Sada natpis stoji lijevo od polja, kako XP i radi u svojim dijalozima.
 * Natpisi su u jednoj koloni pa se forma cita odozgo nadolje, a svaka
 * grupa nosi naslov koji kaze gdje ti podaci idu.
 */
function formaHTML(p) {
  const grupe = [];
  let tekuca = { naslov: PRVA_GRUPA, redovi: [] };
  POLJA.forEach(f => {
    if (f.grupa) {
      if (tekuca.redovi.length) grupe.push(tekuca);
      tekuca = { naslov: f.grupa, redovi: [] };
      return;
    }
    tekuca.redovi.push(redHTML(f, p));
  });
  if (tekuca.redovi.length) grupe.push(tekuca);

  return grupe.map(g =>
    '<div class="pd-okvir">'
    + '<div class="pd-okvir-vrh">'
      + '<span class="pd-okvir-naslov">' + esc(g.naslov) + '</span>'
      + (UZ_GRUPU[g.naslov] ? '<span class="pd-okvir-dugmad">' + UZ_GRUPU[g.naslov] + '</span>' : '')
    + '</div>'
    + '<div class="pd-okvir-tijelo">' + g.redovi.join('') + '</div>'
    + '</div>').join('');
}

function sadrzajHTML(izabraniProfil) {
  const p = ucitaj();

  /*
   * Sve stoji u jednom omotacu, da podnozje (potpis, dugmad, napomena)
   * ima nad cim da se poravna i da se razmaci racunaju na jednom
   * mjestu.
   */
  return '<div class="pd-sadrzaj">' +
    '<div class="pd-dvije">' +
      mjestaHTML(izabraniProfil) +
      '<div class="pd-forma">' + formaHTML(p) + '</div>' +
    '</div>' +

    '<label class="pd-prekidac">' +
      '<input type="checkbox" data-pd-potpis' + (p.potpis ? ' checked' : '') + '>' +
      'Označi mjesto potpisa sa <span class="pd-potpis-primjer">[TVOJ POTPIS]</span>' +
    '</label>' +

    '<div class="pd-actions">' +
      '<button type="button" class="pd-btn pd-desno" data-pd-action="obrisi-sve">Obriši unos</button>' +
    '</div>' +
    '<div class="pd-hint">Sve se čuva samo u ovom browseru — ništa se ne šalje nigdje.</div>' +
    '</div>';
}

/**
 * Bocni, nemodalni prozor "Moji podaci".
 * @param {Function} onPromjena   zove se nakon svake snimljene izmjene
 * @param {Function} [onZatvaranju] zove se kad se prozor zatvori (za kvacicu u meniju)
 */
export function napraviPodatke(onPromjena, onZatvaranju) {
  let izabraniProfil = null;

  const prozor = napraviProzor({
    naslov: 'Moji podaci',
    ikona: ikone.MOJI_PODACI,
    pozicija: 'desno',
    /*
     * Traka s profilima i forma stoje jedno uz drugo, pa panel treba
     * sirinu za oboje — i jos malo preko toga, da polja imaju zraka.
     * Sirina koju covjek povuce ide u polja, ne u velicinu slova: ovaj
     * prozor se NE skalira (vidi `zoom` u podaci.css).
     *
     * Raste sa ekranom, jer veliki.css na velikim ekranima krupnjaje
     * slova — a kolona natpisa i traka s profilima su u pikselima, pa
     * bi pri stalnoj sirini polja ostala bez mjesta. 760 je donja
     * vrijednost, 40vw je gornja, 94vw je zastita na uskom ekranu.
     */
    sirina: 'min(94vw, max(760px, 40vw))',
    klasa: 'pd-panel',
    promjenjivo: true,
    /*
     * Racun za donju granicu: polje za datum treba 110px da se moze
     * citati, plus koraci -/+ (46) i dugme "Danas" (55) daju red od
     * 211; natpis 112 i razmak 8 cine okvir od 331, okvir trazi 355,
     * traka i razmak jos 140, a tijelo prozora 30. Ukupno 525, pa je
     * granica 530.
     *
     * Na telefonu mobilni.css slaze kolone jednu pod drugu, pa tamo
     * ovaj racun ne vazi.
     */
    najmanjaSirina: 530,
    // Nemodalno: ostaje otvoren dok se radi u kalkulaciji
    modalno: false,
    sadrzaj: sadrzajHTML(null),
    naZatvaranje: () => onZatvaranju && onZatvaranju(),
  });

  const tijelo = prozor.tijelo;

  /** Procitaj sve iz forme u objekat. */
  const izForme = () => {
    const p = ucitaj();
    tijelo.querySelectorAll('.pd-input').forEach(el => { p[el.dataset.key] = el.value; });
    const chk = tijelo.querySelector('[data-pd-auto]');
    p.autoDatum = !!(chk && chk.checked);
    if (p.autoDatum) p.datum = iso(new Date());
    const pot = tijelo.querySelector('[data-pd-potpis]');
    p.potpis = !!(pot && pot.checked);
    return p;
  };

  /**
   * Koja se polja razlikuju od onoga sto je snimljeno u profilu.
   * Vraca null kad nijedan profil nije ucitan — tada se nema s cim
   * porediti, pa se nista ne oznacava.
   */
  function razlike() {
    if (izabraniProfil === null) return null;
    const prof = profili.naMjestu(izabraniProfil);
    if (!prof) return null;
    const sad = izForme();
    const skup = new Set();
    KLJUCEVI.forEach(k => {
      if (String(prof.podaci[k] ?? '') !== String(sad[k] ?? '')) skup.add(k);
    });
    return skup;
  }

  /** Oboji izmijenjena polja i upali disketu na profilu. */
  function osvjeziRazlike() {
    const skup = razlike();
    tijelo.querySelectorAll('.pd-input').forEach(el => {
      el.classList.toggle('pd-izmijenjen', !!skup && skup.has(el.dataset.key));
    });
    const ima = !!skup && skup.size > 0;
    tijelo.querySelectorAll('.pd-mjesto').forEach(el => {
      el.classList.toggle('izmijenjen', ima && Number(el.dataset.i) === izabraniProfil);
    });
  }

  const sacuvajIObavijesti = () => {
    snimi(izForme());
    osvjeziRazlike();
    onPromjena();
  };

  /** Ponovo iscrtaj cijeli sadrzaj (nakon ucitavanja profila i sl.). */
  const precrtaj = () => {
    tijelo.innerHTML = sadrzajHTML(izabraniProfil);
    primijeniAutoDatum();
    osvjeziRazlike();
  };

  /** Ako je automatski datum ukljucen, drzi polje na danasnjem i zakljucano. */
  function primijeniAutoDatum() {
    const chk = tijelo.querySelector('[data-pd-auto]');
    const polje = tijelo.querySelector('[data-key="datum"]');
    if (!chk || !polje) return;
    polje.disabled = chk.checked;
    polje.closest('.pd-red').classList.toggle('pd-zakljucano', chk.checked);
    // i koraci se gase — inace bi mijenjali polje koje je zakljucano
    polje.closest('.pd-red').querySelectorAll('.pd-korak')
      .forEach(b => { b.disabled = chk.checked; });
    if (chk.checked) polje.value = iso(new Date());
  }

  /**
   * Pomjeri datumsko polje za `dana` dana.
   * Prazno polje krece od danasnjeg, da prvi klik uvijek nesto upise.
   */
  function pomjeriDatum(kljuc, dana) {
    const el = tijelo.querySelector('[data-key="' + kljuc + '"]');
    if (!el || el.disabled) return;
    // podne, ne ponoc: `new Date('2026-09-14')` se cita kao UTC, pa bi u
    // zonama iza UTC ispao dan ranije; podne prezivi i ljetno racunanje
    const d = el.value ? new Date(el.value + 'T12:00:00') : new Date();
    if (Number.isNaN(d.getTime())) return;
    d.setDate(d.getDate() + dana);
    el.value = iso(d);
    sacuvajIObavijesti();
  }

  /**
   * Preimenovanje na licu mjesta: naziv se zamijeni poljem za unos.
   * Enter potvrdi, Escape odustane, klik izvan potvrdi. Bez dijaloga —
   * preimenovanje je sitna radnja i ne zasluzuje prozor.
   */
  function preimenujNaMjestu(mj) {
    const tile = tijelo.querySelector('.pd-mjesto[data-i="' + mj + '"]');
    const naziv = tile && tile.querySelector('.pd-mjesto-naziv');
    const postojeci = profili.naMjestu(mj);
    if (!naziv || !postojeci) return;

    const unos = document.createElement('input');
    unos.type = 'text';
    unos.className = 'pd-mjesto-unos';
    unos.value = postojeci.naziv;
    unos.maxLength = 24;
    naziv.replaceWith(unos);
    unos.focus();
    unos.select();

    let zavrseno = false;
    const zavrsi = potvrdi => {
      if (zavrseno) return;
      zavrseno = true;
      const novi = unos.value.trim();
      if (potvrdi && novi && novi !== postojeci.naziv) profili.preimenuj(mj, novi);
      precrtaj();
    };

    unos.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); zavrsi(true); }
      if (e.key === 'Escape') { e.preventDefault(); zavrsi(false); }
    });
    unos.addEventListener('blur', () => zavrsi(true));
    // klik u polje ne smije pokrenuti ucitavanje profila
    unos.addEventListener('click', e => e.stopPropagation());
  }

  tijelo.addEventListener('input', e => {
    const el = e.target.closest('.pd-input');
    if (!el) return;
    if (el.classList.contains('pd-cifre')) {
      const ocisceno = el.value.replace(/\D/g, '');
      if (ocisceno !== el.value) el.value = ocisceno;
    }
    // biranje opcine popuni i mjesto uplate - ali ne gazi rucni unos
    if (el.dataset.key === 'opcina') {
      const mjestoEl = tijelo.querySelector('[data-key="mjesto"]');
      if (mjestoJeAutomatsko(mjestoEl.value)) mjestoEl.value = mjestoOpcine(el.value);
    }
    sacuvajIObavijesti();
  });

  tijelo.addEventListener('change', e => {
    if (e.target.closest('[data-pd-auto]')) {
      primijeniAutoDatum();
      sacuvajIObavijesti();
      return;
    }
    // potpis ne dira nijedno polje — samo se snimi i uplatnice se precrtaju
    if (e.target.closest('[data-pd-potpis]')) sacuvajIObavijesti();
  });

  tijelo.addEventListener('click', async e => {
    const korak = e.target.closest('[data-pd-korak]');
    if (korak) { pomjeriDatum(korak.dataset.polje, Number(korak.dataset.pdKorak)); return; }

    const btn = e.target.closest('[data-pd-action]');
    if (!btn) return;
    const mj = Number(btn.closest('.pd-mjesto')?.dataset.i);

    switch (btn.dataset.pdAction) {
      case 'danas':
        tijelo.querySelector('[data-key="datum"]').value = iso(new Date());
        break;

      case 'ovaj-mjesec':
      case 'prosli-mjesec': {
        const { od, do: doo } = graniceMjeseca(btn.dataset.pdAction === 'ovaj-mjesec' ? 0 : -1);
        tijelo.querySelector('[data-key="periodOd"]').value = od;
        tijelo.querySelector('[data-key="periodDo"]').value = doo;
        break;
      }

      case 'obrisi-sve': {
        if (!await pitajZaPotvrdu({
          naslov: 'Obriši unos',
          poruka: 'Obrisati sve trenutno upisane podatke? Snimljeni profili ostaju.',
          potvrdi: 'Obriši',
        })) return;
        obrisi();
        izabraniProfil = null;
        precrtaj();
        onPromjena();
        return;
      }

      /*
       * Klik na mjesto: puno se ucitava, prazno se popunjava odmah i
       * odmah nudi preimenovanje. Ranije se tu otvarao dijalog za naziv;
       * ovako je snimanje jedan klik, a ime se popravi na mjestu.
       */
      case 'mjesto': {
        const postojeci = profili.naMjestu(mj);

        if (postojeci) {
          snimi(postojeci.podaci);
          izabraniProfil = mj;
          precrtaj();
          onPromjena();
          return;
        }

        const ime = tijelo.querySelector('[data-key="ime"]').value.trim();
        profili.snimi(mj, ime || 'Profil ' + (mj + 1), izForme());
        izabraniProfil = mj;
        precrtaj();
        preimenujNaMjestu(mj);
        return;
      }

      case 'snimi-mjesto': {
        const postojeci = profili.naMjestu(mj);
        if (!postojeci) return;
        /*
         * Na aktivnom profilu je ovo snimanje izmjena koje se vide
         * obojene, pa ne treba pitanje. Na tudjem profilu je prepisivanje
         * i tu se pita.
         */
        if (mj !== izabraniProfil && !await pitajZaPotvrdu({
          naslov: 'Prepiši profil',
          poruka: 'Prepisati „' + esc(postojeci.naziv) + '” trenutno upisanim podacima?',
          potvrdi: 'Prepiši',
        })) return;
        profili.snimi(mj, postojeci.naziv, izForme());
        izabraniProfil = mj;
        precrtaj();
        return;
      }

      case 'preimenuj-mjesto':
        preimenujNaMjestu(mj);
        return;

      case 'obrisi-mjesto': {
        const postojeci = profili.naMjestu(mj);
        if (!postojeci) return;
        if (!await pitajZaPotvrdu({
          naslov: 'Obriši profil',
          poruka: 'Obrisati „' + esc(postojeci.naziv) + '”? Trenutni unos ostaje netaknut.',
          potvrdi: 'Obriši',
        })) return;
        profili.obrisi(mj);
        if (izabraniProfil === mj) izabraniProfil = null;
        precrtaj();
        return;
      }
    }
    sacuvajIObavijesti();
  });

  primijeniAutoDatum();
  // ako je automatski datum bio ukljucen iz ranije sesije, upisi danasnji
  if (ucitaj().autoDatum) snimi(izForme());

  /*
   * Spolja se podaci mijenjaju kad se u glavnom prozoru izabere drugi
   * kanton (opcina skace na sjediste). Panel se tada precrta da pokaze
   * nove opcine — inace bi stari izbor ostao na ekranu i pri sljedecoj
   * izmjeni se vratio u storage.
   */
  prozor.osvjezi = () => precrtaj();

  return prozor;
}

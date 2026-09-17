import { napraviProzor } from './prozor.js';
import { fmt } from './format.js';
import { datumCifre, ucitaj } from './storage.js';
import { stampaj, periodTekst } from './ispis.js';
import { pratiSkalu } from './skala.js';

/**
 * Obrazac AMS-1035 — "Akontacija poreza po odbitku na druge samostalne
 * djelatnosti na prihod iz inostranstva".
 *
 * Papir koji se predaje Poreznoj upravi uz uplatnice. Sva polja se
 * prepisuju iz "Moji podaci", ukljucujuci isplatioca (polja 6, 7 i 8)
 * koji tamo ima svoju sekciju.
 *
 * Dio 3 se puni iz istog obracuna kao i uplatnice:
 *
 *   9)  iznos dohotka           osnDopr    (osnovica za obracun)
 *   10) zdravstveno osiguranje  doprinosi
 *   11) osnovica za porez       osnPoreza
 *   12) iznos poreza            porez
 *   13) porezni kredit          precrtano
 *   14) razlika za uplatu       precrtano
 *
 * Kolone 13 i 14 se precrtavaju: porez u inostranstvu nije placen, pa
 * nema ni kredita ni razlike.
 *
 * Sto se NE popunjava: broj stranice i red "Ukupno za sve stranice".
 * Oboje se tice prenosa preko vise stranica, a program racuna jednu
 * uplatu — upisati tu bilo sta znacilo bi tvrditi nesto sto ne zna.
 */

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));

/** Koliko praznih redova stoji ispod popunjenog, kao na papiru. */
const PRAZNIH_REDOVA = 6;

/* Prava velicina obrasca pri skali 1. Sirina je sirina papira u
   originalu (770pt), visina je izmjerena. */
const PAPIR = { sirina: 770, visina: 667 };

/** Red kucica sa po jednom cifrom. */
function kucice(vrijednost, duzina, cls) {
  const str = String(vrijednost ?? '');
  let html = '<span class="ams-kucice ' + (cls || '') + '">';
  for (let i = 0; i < duzina; i++) {
    html += '<span class="ams-kucica">' + esc(str[i] || '') + '</span>';
  }
  return html + '</span>';
}

/** DD / MM / GGGG iz ISO datuma. */
function datumKucice(iso) {
  const d = datumCifre(iso);
  const b = i => '<span class="ams-kucica upisano">' + esc(d[i] || '') + '</span>';
  return '<span class="ams-kucice">'
    + b(0) + b(1) + '<span class="ams-kosa">/</span>'
    + b(2) + b(3) + '<span class="ams-kosa">/</span>'
    + b(4) + b(5) + b(6) + b(7)
    + '</span>';
}

/**
 * Polje 5: "mjesec / 20 __". Godina se pise sa dvije cifre jer je na
 * obrascu "20" vec odstampano. Period se uzima iz pocetka poreznog
 * perioda — to je mjesec na koji se prijava odnosi.
 */
function periodKucice(periodOd) {
  const m = /^(\d{4})-(\d{2})-\d{2}$/.exec(periodOd || '');
  const mjesec = m ? m[2] : '';
  const godina = m ? m[1].slice(2) : '';
  const b = z => '<span class="ams-kucica upisano">' + esc(z) + '</span>';
  return '<span class="ams-kucice">'
    + b(mjesec[0] || '') + b(mjesec[1] || '')
    + '<span class="ams-kosa">/</span><span class="ams-vijek">20</span>'
    + b(godina[0] || '') + b(godina[1] || '')
    + '</span>';
}

/** Polje na crti: natpis, pa upisana vrijednost preko donje linije. */
function naCrti(broj, natpis, vrijednost, klasa) {
  return '<div class="ams-polje ' + (klasa || '') + '">'
    + '<span class="ams-oznaka-polja">' + broj + ') ' + esc(natpis) + '</span>'
    + '<span class="ams-crta"><span class="ams-vr upisano">' + esc(vrijednost) + '</span></span>'
    + '</div>';
}

/** Polje sa kucicama umjesto crte. */
function saKucicama(broj, natpis, sadrzaj, klasa) {
  return '<div class="ams-polje ' + (klasa || '') + '">'
    + '<span class="ams-oznaka-polja">' + broj + ') ' + esc(natpis) + '</span>'
    + sadrzaj
    + '</div>';
}

/** Jedan red Dijela 3. `r` je null za prazan red. */
function redTabele(r) {
  const novac = v => '<span class="upisano">' + fmt(v) + '</span>';
  return '<tr>'
    + '<td>' + (r ? novac(r.osnDopr) : '') + '</td>'
    + '<td>' + (r ? novac(r.doprinosi) : '') + '</td>'
    + '<td>' + (r ? novac(r.osnPoreza) : '') + '</td>'
    + '<td>' + (r ? novac(r.porez) : '') + '</td>'
    + '<td class="ams-precrtano"></td>'
    + '<td class="ams-precrtano"></td>'
    + '</tr>';
}

const UKUPNO_NATPIS = 'Ukupno za sve stranice—prijenos '
  + '(Ukoliko su potrebni dodatni redovi koristiti dodatni primjerak ovog obrasca)';

const IZJAVA = 'Upoznat sam sa sankcijama propisanim Zakonom o Poreznoj upravi i '
  + 'izjavljujem da su podaci navedeni u ovoj prijavi, uključujući sve priloge '
  + 'tačni, potpuni i jasni.';

/**
 * Cijeli obrazac.
 * @param {Object} r obracun u feningima
 * @param {Object} p licni podaci
 */
function renderAMS(r, p) {
  const prazni = Array.from({ length: PRAZNIH_REDOVA }, () => redTabele(null)).join('');

  return '<div class="ams-obrazac">'

    /*
     * Zaglavlje je jedan okvir bez unutrasnjih pregrada — sve u njemu
     * stoji po koordinatama, ne u celijama. Mjere su uzete iz sluzbenog
     * PDF-a obrasca (pufbih.ba): naziv ustanove je centriran, ne poravnat
     * lijevo; "FEDERACIJA BOSNE I HERCEGOVINE" i "POREZNA UPRAVA" su
     * podebljani, a "POREZNA UPRAVA" je i veca (14,04 naspram 9,96).
     */
    + '<div class="ams-zaglavlje">'
      + '<div class="ams-ustanova">'
        + 'Bosna i Hercegovina<br>'
        + '<b>FEDERACIJA BOSNE I<br>HERCEGOVINE</b><br>'
        + 'Federalno ministarstvo<br>financija/finansija'
        + '<span class="ams-uprava">POREZNA UPRAVA</span>'
      + '</div>'
      + '<div class="ams-sredina">'
        + '<div class="ams-sifra">Obrazac AMS - 1035</div>'
        /* Prelom je kao na originalu, ne gdje ga sirina zatekne */
        + '<div class="ams-naslov">Akontacija poreza po odbitku na druge<br>'
          + 'samostalne djelatnosti na prihod iz inostranstva</div>'
      + '</div>'
      /* Dvije kucice jedna ispod druge, ne u redu: gornja nosi natpis,
         donja ostaje prazna. Broj stranice se ne upisuje — program pravi
         jednu, a koja je to po redu zna onaj ko predaje prijavu. */
      + '<div class="ams-stranica">'
        + '<div class="ams-stranica-lbl">Stranica</div>'
        + '<div class="ams-stranica-polje"></div>'
      + '</div>'
    + '</div>'

    /*
     * Dio 1 je mreza 2x2 — ime i JMBG gore, adresa i datum isplate dolje
     * — a period stoji sa strane i uzima oba reda.
     */
    + '<div class="ams-dio">Dio 1—Podaci o primaocu</div>'
    + '<div class="ams-red ams-dio1">'
      + naCrti(1, 'Ime i prezime', p.ime)
      + saKucicama(2, 'JMBG', kucice(p.obveznik, 13, 'upisano'))
      + naCrti(3, 'Adresa', p.adresa)
      + saKucicama(4, 'Datum isplate (Dan/mjesec/godina)', datumKucice(p.datum))
      + saKucicama(5, 'Period mjesec/godina', periodKucice(p.periodOd), 'ams-sa-strane')
    + '</div>'

    + '<div class="ams-dio">Dio 2—Podaci o isplatiocu</div>'
    + '<div class="ams-red">'
      + naCrti(6, 'Naziv', p.isplatilacNaziv, 'ams-rastegni')
      + naCrti(7, 'Adresa', p.isplatilacAdresa, 'ams-rastegni')
      + naCrti(8, 'Država', p.isplatilacDrzava, 'ams-drzava')
    + '</div>'

    + '<div class="ams-dio">Dio 3—Podaci o prihodima, porezu i doprinosima</div>'
    + '<table class="ams-tabela">'
      + '<thead><tr>'
        + '<th>9) Iznos dohotka</th>'
        + '<th>10) Zdravstveno osiguranje na teret osiguranika (kolona 9 x 0,04)</th>'
        + '<th>11) Osnovica za porez (kolona 9 - 10)</th>'
        + '<th>12) Iznos poreza (kolona 11 x 0,1)</th>'
        + '<th>13) Iznos poreznog kredita plaćen u inostranstvu</th>'
        + '<th>14) Razlika poreza za uplatu</th>'
      + '</tr></thead>'
      + '<tbody>' + redTabele(r) + prazni + '</tbody>'
      /* Prijenos preko stranica — ostaje prazan, popunjava ga onaj ko
         spaja vise obrazaca. */
      + '<tfoot>' + redTabele(null) + '</tfoot>'
    + '</table>'
    + '<div class="ams-ukupno-natpis">' + UKUPNO_NATPIS + '</div>'

    + '<div class="ams-dio">Dio 4—Izjava</div>'
    + '<div class="ams-izjava">'
      + '<p>' + IZJAVA + '</p>'
      + '<div class="ams-potpisi">'
        + '<div class="ams-polje ams-rastegni">'
          + '<span class="ams-oznaka-polja">Potpis poreznog obveznika</span>'
          + '<span class="ams-crta">'
            + (p.potpis ? '<span class="ams-potpis">[TVOJ POTPIS]</span>' : '')
          + '</span>'
        + '</div>'
        + '<div class="ams-polje ams-rastegni">'
          + '<span class="ams-oznaka-polja">Datum</span>'
          + '<span class="ams-crta"><span class="ams-vr upisano">'
            + esc(datumTekst(p.datum)) + '</span></span>'
        + '</div>'
      + '</div>'
    + '</div>'

    + '</div>';
}

/** "2026-09-16" -> "16.09.2026." */
function datumTekst(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  return m ? m[3] + '.' + m[2] + '.' + m[1] + '.' : '';
}

/* ---------- prozor ---------- */

/**
 * Prozor sa obrascem AMS-1035.
 *
 * @param {Function} dajObracun vraca {r, p} - trenutni obracun i licne podatke
 * @param {Function} [onZatvaranju]
 */
export function napraviAMSProzor(dajObracun, onZatvaranju) {
  const prozor = napraviProzor({
    naslov: 'AMS-1035 — Akontacija poreza na prihod iz inostranstva',
    nazivNaTraci: 'AMS-1035',
    sirina: 900,
    modalno: false,
    klasa: 'ams-prozor',
    promjenjivo: true,
    najmanjaSirina: 380,
    klasaPodloge: 'ams-overlay',
    onPromjenaVelicine: () => prilagodiSkalu(),
    naZatvaranje: () => onZatvaranju && onZatvaranju(),
    sadrzaj:
      '<div class="ams-alat">'
        + '<span class="ams-lbl">Podaci se upisuju u <b>Alati → Moji podaci</b></span>'
        + '<button type="button" class="pd-btn ams-desno" data-ams-akcija="ispis">Ispis</button>'
      + '</div>'
      + '<div class="ams-mount"></div>',
  });

  const tijelo = prozor.tijelo;
  const mount = tijelo.querySelector('.ams-mount');
  let prilagodiSkalu = () => {};   // postavlja se nize, kad prozor postoji

  /** Precrtaj obrazac sa trenutnim obracunom i podacima. */
  const osvjezi = () => {
    const { r, p } = dajObracun();
    mount.innerHTML = renderAMS(r, p);
  };

  tijelo.addEventListener('click', e => {
    if (!e.target.closest('[data-ams-akcija="ispis"]')) return;
    stampaj({
      klasa: 'print-ams',
      naslov: 'Obrazac AMS-1035 — akontacija poreza na prihod iz inostranstva',
      desno: periodTekst(ucitaj()),
    });
  });

  prozor.osvjezi = osvjezi;

  const izvornoOtvori = prozor.otvori;
  prozor.otvori = () => { osvjezi(); izvornoOtvori(); prozor.uklopi(); prilagodiSkalu(); return prozor; };

  osvjezi();
  prilagodiSkalu = pratiSkalu(prozor, {
    svojstvo: '--ams-skala',
    sirina: PAPIR.sirina,
    visina: PAPIR.visina,
    najmanja: 0.4,
    iznad: '.ams-alat',
  });
  return prozor;
}

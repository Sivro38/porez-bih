import { napraviProzor } from './prozor.js';
import * as ikone from './ikone.js';
import { fmt } from './format.js';
import { datumCifre, ucitaj } from './storage.js';
import { stampaj, periodTekst } from './ispis.js';
import { pratiSkalu } from './skala.js';
import { OKVIR, LINIJE, KUTIJE, TEKST, KUCICE, TABELA } from './ams-raspored.js';
import { IZVOR_ROKOVI } from './izvori.js';

/*
 * Sluzbeni PDF obrasca, iz registra Porezne uprave
 * (pufbih.ba/api/obrasci, sifra AMS-1035). Postoje i hrvatska i srpska
 * verzija; ovdje stoji bosanska, kao i ostatak programa.
 */
const SLUZBENI_PDF =
  'https://www.pufbih.ba/v1/public/upload/obrasci/b839c-obrazac-ams_bos_web.pdf';

/**
 * Obrazac AMS-1035 — "Akontacija poreza po odbitku na druge samostalne
 * djelatnosti na prihod iz inostranstva".
 *
 * Papir koji se predaje Poreznoj upravi uz uplatnice. Sva polja se
 * prepisuju iz "Moji podaci", ukljucujuci isplatioca (polja 6, 7 i 8)
 * koji tamo ima svoju sekciju.
 *
 * KAKO JE CRTAN
 *
 * Ne slaze se CSS tokom nego se crta po koordinatama iz
 * `ams-raspored.js`, koji generise `alati/izvuci-ams.py` iz sluzbenog
 * PDF-a. Jedan pt je jedan px, pa je sve — i sirina i visina i svaka
 * crtica — isto kao na papiru.
 *
 * Prvi put je obrazac slagan tokom, sa paddingom i line-heightom, i
 * ispao je 667px visok naspram stvarnih 521. Sirina je slucajno bila
 * tacna, pa se nije vidjelo da su proporcije promasene.
 *
 * Staticki sloj (crte i odstampani natpisi) dolazi iz podataka i nikad
 * se ne mijenja. Dinamicki sloj su samo nase vrijednosti, na
 * koordinatama izvedenim iz istih tih podataka.
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

/* Prava velicina obrasca pri skali 1 — iz samog PDF-a. */
const PAPIR = { sirina: OKVIR.sirina, visina: OKVIR.visina };

/* Kolone tabele. Zadnja "kolona" iz podataka je desna ivica okvira, ne
   kolona — otud odbacivanje svega uzeg od 10pt. */
const KOLONE = TABELA.kolone.filter(([, w]) => w > 10);

/* Prva pruga je vrh tabele, druga dno zaglavlja; izmedju posljednje
   dvije je red "Ukupno za sve stranice". Ono izmedju su redovi za upis. */
const REDOVI_TABELE = TABELA.pruge.slice(1, -1);

const stil = o => Object.entries(o)
  .map(([k, v]) => k + ':' + (typeof v === 'number' ? v + 'px' : v)).join(';');

/** Apsolutno postavljen tekst. */
function tekstNa(sadrzaj, polozaj, klase) {
  return '<span class="ams-v ' + (klase || '') + '" style="' + stil(polozaj) + '">'
    + sadrzaj + '</span>';
}

/* ---------- staticki sloj ---------- */

let statickiHTML = null;

/**
 * Crte i odstampani natpisi. Isti su pri svakom crtanju, pa se prave
 * jednom i pamte — obrazac ima 155 crtica i 44 natpisa.
 */
function staticki() {
  if (statickiHTML !== null) return statickiHTML;

  /*
   * Plohe prvo, crte preko njih. U PDF-u je redoslijed izmijesan, ali
   * ovako je sigurno da crta nikad ne zavrsi ispod plohe.
   *
   * Peti clan je boja ispune. Kad ga nema, ploha je crna — tako je i u
   * originalu, osim osam svijetlosivih: dvije gore desno i sest u
   * zaglavlju tabele. Bez citanja boje zaglavlje Dijela 3 ispadne kao
   * crna traka preko pola obrasca.
   */
  const crte = KUTIJE.concat(LINIJE).map(([x, y, w, h, boja]) =>
    '<i class="ams-c" style="'
    + stil({ left: x, top: y, width: w, height: h, background: boja || '#000' })
    + '"></i>'
  ).join('');

  const natpisi = TEKST.map(t =>
    '<span class="ams-n' + (t.f === 'arial' ? ' ams-arial' : '')
    + (t.b ? ' ams-deb' : '') + (t.i ? ' ams-kurz' : '') + '"'
    + ' style="' + stil({ left: t.x, top: t.y, 'font-size': t.v }) + '">'
    + esc(t.t) + '</span>'
  ).join('');

  statickiHTML = crte + natpisi;
  return statickiHTML;
}

/* ---------- dinamicki sloj ---------- */

/** Cifre u niz kucica; visak se tiho zanemaruje. */
function uKucice(niz, cifre) {
  if (!niz) return '';
  const s = String(cifre ?? '');
  return niz.x.map((x, i) => s[i]
    ? tekstNa(esc(s[i]),
        { left: x, top: niz.y, width: niz.w, height: niz.h, 'line-height': niz.h + 'px' },
        'ams-kucica')
    : '').join('');
}

/** Vrijednost na crti. */
function naCrti(vrijednost, x, y, sirina) {
  if (!vrijednost) return '';
  return tekstNa(esc(vrijednost), { left: x, top: y, width: sirina }, 'ams-upis');
}

/** Iznos u celiji tabele, poravnat desno. */
function uCeliju(tekst, kolona, gornja, donja) {
  const [x, w] = KOLONE[kolona];
  return tekstNa(tekst, {
    left: x, top: gornja, width: w - 6, height: donja - gornja,
    'line-height': (donja - gornja) + 'px',
  }, 'ams-iznos');
}

/** Dijagonala preko celije — kolone 13 i 14 se ne popunjavaju. */
function precrtano(kolona, gornja, donja) {
  const [x, w] = KOLONE[kolona];
  return '<i class="ams-x" style="'
    + stil({ left: x, top: gornja, width: w, height: donja - gornja }) + '"></i>';
}

/**
 * "2026-09-16" -> "160926". Godina ide sa dvije cifre: obrazac ima
 * tacno sest kucica za datum, ne osam.
 */
function datumSest(iso) {
  const d = datumCifre(iso);          // DDMMGGGG
  return d ? d.slice(0, 4) + d.slice(6, 8) : '';
}

/** "2026-09-16" -> "16.09.2026." */
function datumTekst(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  return m ? m[3] + '.' + m[2] + '.' + m[1] + '.' : '';
}

function dinamicki(r, p) {
  let html = '';

  /* --- Dio 1 --- */
  html += naCrti(p.ime, 58, 131, 250);
  html += naCrti(p.adresa, 40, 161, 268);
  html += uKucice(KUCICE.jmbg, p.obveznik);
  html += uKucice(KUCICE.datum, datumSest(p.datum));

  /* Polje 5: mjesec pa dvije cifre godine — "20" je vec odstampano. */
  const m = /^(\d{4})-(\d{2})-\d{2}$/.exec(p.periodOd || '');
  html += uKucice(KUCICE.period, m ? m[2] + m[1].slice(2) : '');

  /* --- Dio 2 --- */
  html += naCrti(p.isplatilacNaziv, 33, 205, 258);
  html += naCrti(p.isplatilacAdresa, 336, 205, 258);
  html += naCrti(p.isplatilacDrzava, 635, 205, 128);

  /* --- Dio 3: prvi red se puni, ostali ostaju prazni --- */
  const gore = REDOVI_TABELE[0];
  const dolje = REDOVI_TABELE[1];
  html += uCeliju(fmt(r.osnDopr), 0, gore, dolje);
  html += uCeliju(fmt(r.doprinosi), 1, gore, dolje);
  html += uCeliju(fmt(r.osnPoreza), 2, gore, dolje);
  html += uCeliju(fmt(r.porez), 3, gore, dolje);

  /* Kolone 13 i 14 se precrtavaju u svakom redu, i punom i praznom. */
  for (let i = 0; i < REDOVI_TABELE.length - 1; i++) {
    html += precrtano(4, REDOVI_TABELE[i], REDOVI_TABELE[i + 1]);
    html += precrtano(5, REDOVI_TABELE[i], REDOVI_TABELE[i + 1]);
  }

  /* --- Dio 4 --- */
  if (p.potpis) {
    html += tekstNa('[TVOJ POTPIS]', { left: 410, top: 468, width: 180 }, 'ams-potpis');
  }
  html += naCrti(datumTekst(p.datum), 690, 468, 76);

  return html;
}

/**
 * Cijeli obrazac.
 * @param {Object} r obracun u feninzima
 * @param {Object} p licni podaci
 */
function renderAMS(r, p) {
  return '<div class="ams-obrazac" style="'
    + stil({ width: PAPIR.sirina, height: PAPIR.visina }) + '">'
    + staticki() + dinamicki(r, p)
    + '</div>';
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
    ikona: ikone.OBRAZAC,
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
        + '<span class="ams-rok">Predaj u <b>roku od 5 dana</b> od primitka dohotka, u <b>dva primjerka</b>' + IZVOR_ROKOVI + '</span>'
        // Raspored je izvucen iz ovog PDF-a; veza stoji da se moze uporediti.
        + '<a class="pd-btn ams-sluzbeni ams-desno" href="' + SLUZBENI_PDF + '"'
        + ' target="_blank" rel="noopener noreferrer"'
        + ' title="Otvara službeni PDF Porezne uprave u novoj kartici">'
        + 'Službeni obrazac ↗</a>'
        + '<button type="button" class="pd-btn" data-ams-akcija="ispis">Ispis</button>'
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

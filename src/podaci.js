import { POLJA, ucitaj, snimi, obrisi, nazivOpcine } from './storage.js';
import { OPCINE_ZEDO } from './config.js';
import { napraviProzor, pitajZaTekst, pitajZaPotvrdu, pitajZaIzbor } from './prozor.js';
import * as ikone from './ikone.js';
import * as profili from './profili.js';
import { pratiSkalu } from './skala.js';

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));

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
    return '<select class="pd-input" data-key="' + f.key + '">'
      + f.opcije.map(o =>
          '<option value="' + esc(o.vrijednost) + '"'
          + (String(p[f.key]) === o.vrijednost ? ' selected' : '') + '>'
          + esc(o.tekst) + '</option>').join('')
      + '</select>';
  }
  return '<input type="text" class="pd-input" data-key="' + f.key + '" value="' + v + '">';
}

/**
 * Tri mjesta za profile. Prazno se klikom popuni trenutnim podacima,
 * puno se klikom ucita. Dodatne radnje su iza dugmeta sa tri tacke, da
 * uobicajen slucaj ostane jedan klik.
 */
function mjestaHTML(aktivno) {
  return '<div class="pd-mjesta">' + profili.mjesta().map((p, i) =>
    '<div class="pd-mjesto ' + (p ? 'puno' : 'prazno')
      + (i === aktivno ? ' aktivno' : '') + '">'
      + '<button type="button" class="pd-mjesto-glavno" data-pd-action="mjesto" data-i="' + i + '"'
      + ' title="' + (p ? 'Učitaj ' + esc(p.naziv) : 'Snimi trenutne podatke ovdje') + '">'
        + '<span class="pd-mjesto-ikona">' + (p ? ikone.KORISNIK : ikone.PRAZNO_MJESTO) + '</span>'
        + '<span class="pd-mjesto-naziv">' + (p ? esc(p.naziv) : 'Prazno') + '</span>'
      + '</button>'
      + (p ? '<button type="button" class="pd-mjesto-uredi" data-pd-action="uredi-mjesto"'
             + ' data-i="' + i + '" title="Radnje nad profilom">⋯</button>' : '')
    + '</div>').join('') + '</div>';
}

function sadrzajHTML(izabraniProfil) {
  const p = ucitaj();

  /*
   * Sve stoji u omotacu, jer se na njega primjenjuje skala. Da skala ide
   * na samo tijelo prozora, mjerenje njegove sirine bi vracalo vec
   * umanjenu vrijednost i racun bi se vrtio u krug.
   */
  return '<div class="pd-sadrzaj">' +
    mjestaHTML(izabraniProfil) +

    '<div class="pd-grid">' +
      POLJA.map(f =>
        f.grupa
          ? '<div class="pd-grupa">' + esc(f.grupa) + '</div>'
          : '<label class="pd-field'
            + (f.key === 'datum' && p.autoDatum ? ' pd-zakljucano' : '')
            + (f.siroko ? ' pd-siroko' : '') + '">'
            + '<span class="pd-lbl">' + esc(f.label) + '</span>'
            + poljeHTML(f, p)
            + '</label>'
      ).join('') +
    '</div>' +

    '<label class="pd-prekidac">' +
      '<input type="checkbox" data-pd-auto' + (p.autoDatum ? ' checked' : '') + '>' +
      'Datum uplate = današnji datum (automatski)' +
    '</label>' +

    '<label class="pd-prekidac">' +
      '<input type="checkbox" data-pd-potpis' + (p.potpis ? ' checked' : '') + '>' +
      'Označi mjesto potpisa sa <span class="pd-potpis-primjer">[TVOJ POTPIS]</span>' +
    '</label>' +

    /* XP ne pise `=` u natpisu dugmeta; natpis stoji ispred grupe. */
    '<div class="pd-actions">' +
      '<span class="pd-lbl-grupa">Datum:</span>' +
      '<button type="button" class="pd-btn" data-pd-action="danas">Danas</button>' +
      '<span class="pd-lbl-grupa">Period:</span>' +
      '<button type="button" class="pd-btn" data-pd-action="ovaj-mjesec">Ovaj mjesec</button>' +
      '<button type="button" class="pd-btn" data-pd-action="prosli-mjesec">Prošli mjesec</button>' +
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
  let prilagodiSkalu = () => {};   // postavlja se nize, kad prozor postoji

  const prozor = napraviProzor({
    naslov: 'Moji podaci',
    pozicija: 'desno',
    sirina: 420,
    klasa: 'pd-panel',
    promjenjivo: true,
    najmanjaSirina: 320,
    // Nemodalno: ostaje otvoren dok se radi u kalkulaciji
    modalno: false,
    sadrzaj: sadrzajHTML(null),
    onPromjenaVelicine: () => prilagodiSkalu(),
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

  const sacuvajIObavijesti = () => { snimi(izForme()); onPromjena(); };

  /** Ponovo iscrtaj cijeli sadrzaj (nakon ucitavanja profila i sl.). */
  const precrtaj = () => {
    tijelo.innerHTML = sadrzajHTML(izabraniProfil);
    primijeniAutoDatum();
  };

  /** Ako je automatski datum ukljucen, drzi polje na danasnjem i zakljucano. */
  function primijeniAutoDatum() {
    const chk = tijelo.querySelector('[data-pd-auto]');
    const polje = tijelo.querySelector('[data-key="datum"]');
    if (!chk || !polje) return;
    polje.disabled = chk.checked;
    polje.closest('.pd-field').classList.toggle('pd-zakljucano', chk.checked);
    // i koraci se gase — inace bi mijenjali polje koje je zakljucano
    polje.closest('.pd-field').querySelectorAll('.pd-korak')
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
      const nazivi = OPCINE_ZEDO.map(o => o.naziv);
      if (!mjestoEl.value.trim() || nazivi.includes(mjestoEl.value.trim())) {
        mjestoEl.value = nazivOpcine(el.value);
      }
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
        precrtaj();
        onPromjena();
        return;
      }

      /* Klik na mjesto: puno se ucitava, prazno se popunjava. */
      case 'mjesto': {
        const mj = Number(btn.dataset.i);
        const postojeci = profili.naMjestu(mj);

        if (postojeci) {
          snimi(postojeci.podaci);
          izabraniProfil = mj;
          precrtaj();
          onPromjena();
          return;
        }

        const naziv = await pitajZaTekst({
          naslov: 'Novi profil',
          poruka: 'Kako da nazovem ovaj profil?',
          zadano: tijelo.querySelector('[data-key="ime"]').value.trim(),
          potvrdi: 'Snimi',
        });
        if (!naziv) return;
        profili.snimi(mj, naziv, izForme());
        izabraniProfil = mj;
        precrtaj();
        return;
      }

      /* Rjedje radnje su iza tri tacke, da ucitavanje ostane jedan klik. */
      case 'uredi-mjesto': {
        const mj = Number(btn.dataset.i);
        const postojeci = profili.naMjestu(mj);
        if (!postojeci) return;

        const radnja = await pitajZaIzbor({
          naslov: 'Profil: ' + postojeci.naziv,
          poruka: 'Šta želiš uraditi s ovim profilom?',
          izbori: [
            { kljuc: 'prepisi', tekst: 'Prepiši trenutnim podacima', primarno: true },
            { kljuc: 'preimenuj', tekst: 'Preimenuj' },
            { kljuc: 'obrisi', tekst: 'Obriši profil' },
          ],
        });
        if (!radnja) return;

        if (radnja === 'prepisi') {
          if (!await pitajZaPotvrdu({
            naslov: 'Prepiši profil',
            poruka: 'Prepisati „' + esc(postojeci.naziv) + '” trenutno upisanim podacima?',
            potvrdi: 'Prepiši',
          })) return;
          profili.snimi(mj, postojeci.naziv, izForme());
          izabraniProfil = mj;
          precrtaj();
          return;
        }

        if (radnja === 'preimenuj') {
          const naziv = await pitajZaTekst({
            naslov: 'Preimenuj profil',
            poruka: 'Novi naziv:',
            zadano: postojeci.naziv,
            potvrdi: 'Preimenuj',
          });
          if (!naziv) return;
          profili.preimenuj(mj, naziv);
          precrtaj();
          return;
        }

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
   * Panel se moze samo uvecati, nikad umanjiti: donja granica je 1. Na
   * telefonu bi racun inace ispao ispod 1 i stegnuo polja, a tamo je
   * vec podeseno da sve stane bez skrolanja.
   */
  prilagodiSkalu = pratiSkalu(prozor, {
    svojstvo: '--pd-skala',
    sirina: 379,
    visina: 532,
    najmanja: 1,
    najveca: 1.8,
  });

  return prozor;
}

import { napraviProzor, pitajZaPotvrdu } from './prozor.js';
import { PROMJENJIVE, stope, zadaneStope, snimiStope, vratiZadane, suIzmijenjene } from './stope.js';
import { fmtPct } from './format.js';

/**
 * Postavke poreskih stopa.
 *
 * Stope stoje zakljucane dok korisnik ne potvrdi da razumije sta radi.
 * Nije to pravna zastita nego usporavanje: pogresna stopa daje pogresan
 * iznos na uplatnici, a to se vidi tek kad novac ode.
 *
 * Kanton se ne unosi — uvijek je ostatak do cjeline nakon Federacije, pa
 * se izvodi i pokazuje kao izracunat. Tako se to dvoje ne moze zbrojiti
 * u nesto sto nije 100%.
 */

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));

const UPOZORENJE =
  '<p><b>Stope nisu službeni podatak.</b> Upisane su ručno prema propisima '
  + 'Federacije BiH i mogu biti zastarjele — propisi se mijenjaju, a ovaj '
  + 'program se ne ažurira sam.</p>'
  + '<p>Ako ih mijenjaš, mijenjaš ih na svoju odgovornost. Pogrešna stopa '
  + 'ne prijavi grešku: samo tiho ispiše pogrešan iznos na uplatnicu.</p>'
  + '<p><b>Prije uplate provjeri iznose</b> kod Porezne uprave FBiH, u banci '
  + 'ili kod knjigovođe. Odgovornost za tačnost uplate je na tebi, bez obzira '
  + 'na to šta ovaj program pokaže.</p>';

const KVACICA_TEKST =
  'Razumijem — stope mijenjam na svoju odgovornost i sam provjeravam jesu li tačne.';

/** Broj u postotak sa zarezom, bez suvisnih nula. */
function uPostotak(udio) {
  return String(Number((udio * 100).toFixed(4))).replace('.', ',');
}

/** "20,5" ili "20.5" -> 0.205; vraca null ako nije upotrebljivo. */
function izPostotka(tekst) {
  const n = Number(String(tekst).replace(',', '.').trim());
  if (!Number.isFinite(n) || n < 0 || n > 100) return null;
  return n / 100;
}

function stopeHTML() {
  const s = stope();
  const zadane = zadaneStope();

  const red = f => {
    const promijenjena = s[f.key] !== zadane[f.key];
    return '<label class="po-stopa' + (promijenjena ? ' po-promijenjena' : '') + '">'
      + '<span class="po-lbl">' + esc(f.label)
        + '<span class="po-opis">' + esc(f.opis) + '</span></span>'
      + '<span class="po-unos">'
        + '<input type="text" inputmode="decimal" data-stopa="' + f.key + '"'
        + ' value="' + esc(uPostotak(s[f.key])) + '" disabled>'
        + '<span class="po-znak">%</span>'
      + '</span>'
      + '<span class="po-zadano" title="zadana vrijednost">'
        + oznakaZadanog(promijenjena, zadane[f.key]) + '</span>'
      + '</label>';
  };

  return '<div class="po-stope">' + PROMJENJIVE.map(red).join('')
    + '<div class="po-stopa po-izvedena">'
      + '<span class="po-lbl">Kanton<span class="po-opis">udio u doprinosima</span></span>'
      + '<span class="po-unos"><input type="text" value="' + esc(uPostotak(s.kanton))
        + '" disabled><span class="po-znak">%</span></span>'
      + '<span class="po-zadano">ostatak</span>'
    + '</div>'
  + '</div>';
}

/** Uz izmijenjenu stopu stoji podsjetnik koja je bila zadana. */
function oznakaZadanog(promijenjena, zadano) {
  return promijenjena ? 'zadano ' + esc(fmtPct(zadano * 100)) : '';
}

function sadrzajHTML() {
  return '<div class="po-upozorenje">' + UPOZORENJE + '</div>'

    + '<label class="po-kvacica">'
      + '<input type="checkbox" data-po-otkljucaj>'
      + KVACICA_TEKST
    + '</label>'

    + stopeHTML()

    + '<div class="po-akcije">'
      + '<button type="button" class="pd-btn" data-po="primijeni" disabled>Primijeni</button>'
      + '<button type="button" class="pd-btn" data-po="zadano" disabled>Vrati zadane</button>'
      + '<span class="po-poruka" data-po-poruka></span>'
    + '</div>';
}

/**
 * @param {Function} onPromjenaStopa zove se kad se stope primijene
 * @param {Function} [onZatvaranju]
 */
export function napraviPostavke(onPromjenaStopa, onZatvaranju) {
  const prozor = napraviProzor({
    naslov: 'Postavke poreskih stopa',
    nazivNaTraci: 'Postavke',
    sirina: 460,
    klasa: 'po-prozor',
    modalno: false,
    promjenjivo: true,
    najmanjaSirina: 320,
    sadrzaj: sadrzajHTML(),
    naZatvaranje: () => onZatvaranju && onZatvaranju(),
  });

  const tijelo = prozor.tijelo;
  const poruka = tekst => {
    const el = tijelo.querySelector('[data-po-poruka]');
    if (el) el.textContent = tekst || '';
  };

  /** Polja i dugmad prate kvacicu. */
  function primijeniZakljucavanje() {
    const otkljucano = !!tijelo.querySelector('[data-po-otkljucaj]')?.checked;
    tijelo.querySelectorAll('[data-stopa]').forEach(el => { el.disabled = !otkljucano; });
    tijelo.querySelector('[data-po="primijeni"]').disabled = !otkljucano;
    // "Vrati zadane" ima smisla samo ako ima sta vracati
    tijelo.querySelector('[data-po="zadano"]').disabled = !otkljucano || !suIzmijenjene();
    tijelo.classList.toggle('po-otkljucano', otkljucano);
  }

  /** Precrtaj sve osim kvacice, koja mora ostati kako jeste. */
  function precrtaj() {
    const otkljucano = !!tijelo.querySelector('[data-po-otkljucaj]')?.checked;
    tijelo.innerHTML = sadrzajHTML();
    const chk = tijelo.querySelector('[data-po-otkljucaj]');
    if (chk) chk.checked = otkljucano;
    primijeniZakljucavanje();
  }

  tijelo.addEventListener('change', e => {
    if (!e.target.closest('[data-po-otkljucaj]')) return;
    primijeniZakljucavanje();
    poruka('');
  });

  tijelo.addEventListener('click', async e => {
    const btn = e.target.closest('[data-po]');
    if (!btn) return;

    if (btn.dataset.po === 'primijeni') {
      const nove = {};
      let lose = null;
      tijelo.querySelectorAll('[data-stopa]').forEach(el => {
        const v = izPostotka(el.value);
        if (v === null) lose = el;
        else nove[el.dataset.stopa] = v;
      });
      if (lose) {
        lose.focus();
        poruka('Stopa mora biti broj između 0 i 100.');
        return;
      }
      const uspjelo = snimiStope(nove);
      precrtaj();
      onPromjenaStopa();
      poruka(uspjelo ? 'Stope su primijenjene.'
                     : 'Primijenjeno, ali nije snimljeno — browser ne da pisati.');
      return;
    }

    if (btn.dataset.po === 'zadano') {
      if (!await pitajZaPotvrdu({
        naslov: 'Vrati zadane stope',
        poruka: 'Vratiti stope na vrijednosti s kojima program dolazi?',
        potvrdi: 'Vrati',
      })) return;
      vratiZadane();
      precrtaj();
      onPromjenaStopa();
      poruka('Vraćene su zadane stope.');
      return;
    }
  });

  primijeniZakljucavanje();

  const izvornoOtvori = prozor.otvori;
  prozor.otvori = () => { precrtaj(); izvornoOtvori(); prozor.uklopi(); return prozor; };

  return prozor;
}

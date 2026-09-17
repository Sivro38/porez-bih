import { napraviProzor } from './prozor.js';
import { PRIMAOCI } from './config.js';
import { pratiSkalu } from './skala.js';

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));

/* Prava velicina jednog obrasca pri skali 1: sirina je iz styles.css
   (`.real-form { max-width: 900px }`), visina je izmjerena. */
const OBRAZAC = { sirina: 900, visina: 300 };

/**
 * Prozor sa uplatnicama.
 *
 * Nemodalni, kao i "Moji podaci" - moze stajati otvoren dok se radi u
 * kalkulaciji. Dva rezima prikaza:
 *   sve   - sve tri jedna ispod druge, tijelo prozora se skroluje
 *   jedna - jedna po jedna, biranje kroz tabove
 *
 * Pri stampi se uvijek stampaju sve tri, bez obzira na rezim (vidi
 * print.css).
 */
export function napraviUplatniceProzor(onZatvaranju) {
  const tabovi = PRIMAOCI.map((p, i) =>
    '<button type="button" class="upl-tab' + (i === 0 ? ' aktivan' : '') + '"'
    + ' data-upl-tab="' + i + '" title="' + esc(p.caption) + '">' + (i + 1) + '</button>'
  ).join('');

  const prozor = napraviProzor({
    naslov: 'Uplatnice — Nalog za uplatu javnih prihoda',
    nazivNaTraci: 'Uplatnice',
    sirina: 740,   // 900px obrasca * 0.75 + okvir
    modalno: false,
    klasa: 'upl-prozor rezim-sve',
    promjenjivo: true,
    najmanjaSirina: 380,
    klasaPodloge: 'upl-overlay',
    onPromjenaVelicine: () => prilagodiSkalu(),
    naZatvaranje: () => onZatvaranju && onZatvaranju(),
    sadrzaj:
      '<div class="upl-alat">' +
        '<span class="upl-lbl">Prikaz</span>' +
        '<button type="button" class="pd-btn aktivan" data-upl-rezim="sve">Sve odjednom</button>' +
        '<button type="button" class="pd-btn" data-upl-rezim="jedna">Jedna po jedna</button>' +
        '<span class="upl-tabovi">' + tabovi + '</span>' +
        '<span class="upl-hint">Ispis uvijek štampa sve tri</span>' +
      '</div>' +
      '<div id="forms-mount"></div>',
  });

  const tijelo = prozor.tijelo;
  const okvir = prozor.element;

  let prilagodiSkalu = () => {};   // postavlja se nize, kad prozor postoji


  const postaviRezim = rezim => {
    okvir.classList.toggle('rezim-sve', rezim === 'sve');
    okvir.classList.toggle('rezim-jedna', rezim === 'jedna');
    tijelo.querySelectorAll('[data-upl-rezim]').forEach(b =>
      b.classList.toggle('aktivan', b.dataset.uplRezim === rezim));
    tijelo.scrollTop = 0;
    prilagodiSkalu();
    // Sadrzaj se bitno promijenio: bez ovoga bi u rezimu "jedna po jedna"
    // ostao visak praznog prostora, a pri povratku na "sve odjednom"
    // prozor bi mogao narasti iznad vrha ekrana i ostati nedohvatljiv.
    prozor.uklopi();
  };

  const postaviTab = idx => {
    tijelo.querySelectorAll('.upl-stavka').forEach(el =>
      el.classList.toggle('aktivna', Number(el.dataset.idx) === idx));
    tijelo.querySelectorAll('.upl-tab').forEach(b =>
      b.classList.toggle('aktivan', Number(b.dataset.uplTab) === idx));
  };

  tijelo.addEventListener('click', e => {
    const rezim = e.target.closest('[data-upl-rezim]');
    if (rezim) { postaviRezim(rezim.dataset.uplRezim); return; }

    const tab = e.target.closest('[data-upl-tab]');
    if (tab) { postaviRezim('jedna'); postaviTab(Number(tab.dataset.uplTab)); return; }

    // Kopiranje racuna — na telefonu se broj prepisuje u mobilnu banku,
    // a osamnaest cifara je lako pogrijesiti rucno.
    const kopiraj = e.target.closest('[data-kopiraj]');
    if (kopiraj && navigator.clipboard) {
      navigator.clipboard.writeText(kopiraj.dataset.kopiraj).then(() => {
        const stari = kopiraj.textContent;
        kopiraj.textContent = 'Kopirano';
        kopiraj.classList.add('kopirano');
        setTimeout(() => {
          kopiraj.textContent = stari;
          kopiraj.classList.remove('kopirano');
        }, 1400);
      }).catch(() => { /* browser odbio pristup ostavi - dugme ostaje kako jeste */ });
    }
  });

  /** Nakon svakog precrtavanja obrazaca vrati aktivnu stavku. */
  prozor.osvjeziAktivnu = () => {
    const aktivan = tijelo.querySelector('.upl-tab.aktivan');
    postaviTab(aktivan ? Number(aktivan.dataset.uplTab) : 0);
  };

  // Pri svakom otvaranju prozor se uklopi u sadrzaj i vidno polje
  const izvornoOtvori = prozor.otvori;
  prozor.otvori = () => { izvornoOtvori(); prozor.uklopi(); prilagodiSkalu(); return prozor; };

  prilagodiSkalu = pratiSkalu(prozor, {
    svojstvo: '--upl-skala',
    sirina: OBRAZAC.sirina,
    visina: OBRAZAC.visina,
    najmanja: 0.45,
    iznad: '.upl-alat',
  });

  return prozor;
}

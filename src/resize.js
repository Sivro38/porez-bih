/**
 * Promjena velicine prozora — sve ivice i svi uglovi.
 *
 * Kljucni problem: prozori nisu apsolutno pozicionirani nego ih raspored
 * postavlja (centrirani su, a bocni prislonjeni uz desnu ivicu). Kad im
 * se promijeni sirina, raspored ih sam pomjeri, pa bi ivica koju korisnik
 * drzi "pobjegla" ispod pokazivaca.
 *
 * Zato se ne racuna gdje bi ivica trebala biti, nego se mjeri gdje je
 * zaista zavrsila: zapamti se polozaj sidrene ivice, primijeni nova
 * velicina, ponovo izmjeri, i razlika se ponisti pomakom. Tako radi bez
 * obzira na to kako je prozor poravnat.
 */

import { VISINA_TRAKE } from './traka.js';

const SMJEROVI = ['n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se'];

/** Prozor ne moze biti manji od ovoga. */
export const NAJMANJA = { sirina: 300, visina: 180 };

const stegni = (v, min, max) => Math.min(Math.max(v, min), max);

/**
 * @param {HTMLElement} element prozor
 * @param {Object} opcije
 * @param {Function} opcije.pomjeriZa iz omoguciPovlacenje()
 * @param {number} [opcije.najmanjaSirina]
 * @param {number} [opcije.najmanjaVisina]
 * @param {Function} [opcije.onPromjena] zove se poslije svake promjene
 */
export function omoguciPromjenuVelicine(element, opcije) {
  const {
    pomjeriZa,
    najmanjaSirina = NAJMANJA.sirina,
    najmanjaVisina = NAJMANJA.visina,
    onPromjena = null,
  } = opcije;

  // Najveca velicina je uvijek vidno polje — prozor ne smije prerasti ekran
  const najveca = () => ({
    sirina: document.documentElement.clientWidth - 20,
    // donja traka nije slobodan prostor
    visina: document.documentElement.clientHeight - 20 - VISINA_TRAKE,
  });

  SMJEROVI.forEach(smjer => {
    const hvatiste = document.createElement('div');
    hvatiste.className = 'xp-hvatiste xp-hvatiste-' + smjer;
    hvatiste.dataset.smjer = smjer;
    element.append(hvatiste);

    let aktivni = null;
    let poc = null;

    hvatiste.addEventListener('pointerdown', e => {
      if (e.button !== undefined && e.button !== 0) return;
      const r = element.getBoundingClientRect();
      aktivni = e.pointerId;
      // `gore` treba da se zna dokle prozor uopce moze narasti prema gore
      poc = { x: e.clientX, y: e.clientY, sirina: r.width, visina: r.height, gore: r.top };
      element.classList.add('mijenja-velicinu');
      try { hvatiste.setPointerCapture(e.pointerId); } catch { /* stariji browser */ }
      e.preventDefault();
      e.stopPropagation();
    });

    hvatiste.addEventListener('pointermove', e => {
      if (aktivni === null || e.pointerId !== aktivni) return;

      const dx = e.clientX - poc.x;
      const dy = e.clientY - poc.y;
      const gornja = najveca();

      let sirina = poc.sirina;
      let visina = poc.visina;
      if (smjer.includes('e')) sirina = poc.sirina + dx;
      if (smjer.includes('w')) sirina = poc.sirina - dx;
      if (smjer.includes('s')) visina = poc.visina + dy;
      if (smjer.includes('n')) visina = poc.visina - dy;

      sirina = stegni(sirina, najmanjaSirina, gornja.sirina);
      visina = stegni(visina, najmanjaVisina, gornja.visina);

      // Rast prema gore je ogranicen visinom iznad prozora: naslovna traka
      // ne smije iznad vrha ekrana. Bez ovoga bi prozor, kad udari u vrh,
      // nastavio rasti nadolje umjesto da stane.
      if (smjer.includes('n')) visina = Math.min(visina, poc.visina + poc.gore);

      // Ivica koja mora ostati na mjestu je ona nasuprot onoj koja se vuce
      const sidroX = smjer.includes('w') ? 'right' : 'left';
      const sidroY = smjer.includes('n') ? 'bottom' : 'top';

      const prije = element.getBoundingClientRect();
      if (smjer.includes('e') || smjer.includes('w')) element.style.width = sirina + 'px';
      if (smjer.includes('n') || smjer.includes('s')) element.style.height = visina + 'px';
      const poslije = element.getBoundingClientRect();

      pomjeriZa(prije[sidroX] - poslije[sidroX], prije[sidroY] - poslije[sidroY]);
      if (onPromjena) onPromjena();
    });

    const pusti = e => {
      if (aktivni === null || e.pointerId !== aktivni) return;
      aktivni = null;
      element.classList.remove('mijenja-velicinu');
      try { hvatiste.releasePointerCapture(e.pointerId); } catch { /* svejedno */ }
    };
    hvatiste.addEventListener('pointerup', pusti);
    hvatiste.addEventListener('pointercancel', pusti);

    // Dvoklik na hvatiste vraca prozor na velicinu iz rasporeda
    hvatiste.addEventListener('dblclick', e => {
      e.stopPropagation();
      element.style.width = '';
      element.style.height = '';
      // Prozor je u medjuvremenu mogao odlutati; vrati ga u vidno polje
      pomjeriZa(0, 0);
    });
  });

  element.classList.add('promjenjiv');

  // Ako se ekran smanji ispod prozora, stegni ga nazad
  window.addEventListener('resize', () => {
    if (!element.style.width && !element.style.height) return;
    const gornja = najveca();
    const r = element.getBoundingClientRect();
    if (r.width > gornja.sirina) element.style.width = gornja.sirina + 'px';
    if (r.height > gornja.visina) element.style.height = gornja.visina + 'px';
  });
}

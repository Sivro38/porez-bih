/**
 * Povlacenje prozora za "rucku" (titlebar).
 *
 * Pomak ide kroz `transform: translate()` a ne kroz position/top/left -
 * tako se layout uopce ne dira, pa se okolni sadrzaj ne pomjera i
 * originalno centriranje (`margin: 0 auto`) ostaje netaknuto.
 */

import { VISINA_TRAKE } from './traka.js';

/** Koliko piksela prozora mora ostati u vidnom polju. */
const MARGINA = 48;

/**
 * @param {HTMLElement} element prozor koji se pomjera
 * @param {HTMLElement} rucka   element za koji se hvata (titlebar)
 * @param {Object} [opcije]
 * @param {string} [opcije.izuzmi] CSS selektor unutar rucke koji NE pokrece
 *   povlacenje (npr. dugmad za zatvaranje)
 * @returns {{resetuj: Function, razvezi: Function}}
 */
export function omoguciPovlacenje(element, rucka, opcije = {}) {
  const { izuzmi = '.winbtns' } = opcije;

  let x = 0, y = 0;             // trenutni pomak
  let pocetnaX = 0, pocetnaY = 0; // pozicija pokazivaca na pocetku
  let bazaX = 0, bazaY = 0;     // pomak u trenutku hvatanja
  let aktivniPointer = null;

  const primijeni = () => {
    element.style.transform = (x || y) ? 'translate(' + x + 'px, ' + y + 'px)' : '';
  };

  /**
   * Ogranici pomak tako da prozor ne moze potpuno pobjeci sa ekrana.
   * Racuna se iz neponmjerene pozicije (trenutna minus vec primijenjen pomak).
   */
  const ogranici = (novaX, novaY) => {
    const r = element.getBoundingClientRect();
    const lijevo0 = r.left - x;   // gdje bi element bio bez transforma
    const gore0 = r.top - y;
    const vw = document.documentElement.clientWidth;
    // donja traka nije slobodan prostor
    const vh = document.documentElement.clientHeight - VISINA_TRAKE;

    const minX = MARGINA - r.width - lijevo0;
    const maxX = vw - MARGINA - lijevo0;
    const minY = -gore0;                    // titlebar ne smije iznad vrha
    const maxY = vh - MARGINA - gore0;

    return {
      x: Math.min(Math.max(novaX, minX), maxX),
      y: Math.min(Math.max(novaY, minY), maxY),
    };
  };

  const naDolje = e => {
    if (e.button !== undefined && e.button !== 0) return;      // samo lijevi klik
    if (izuzmi && e.target.closest(izuzmi)) return;            // dugmad rade svoje
    aktivniPointer = e.pointerId;
    pocetnaX = e.clientX;
    pocetnaY = e.clientY;
    bazaX = x;
    bazaY = y;
    element.classList.add('vuce-se');
    try { rucka.setPointerCapture(e.pointerId); } catch { /* stariji browser */ }
    e.preventDefault();
  };

  const naPomak = e => {
    if (aktivniPointer === null || e.pointerId !== aktivniPointer) return;
    const c = ogranici(bazaX + (e.clientX - pocetnaX), bazaY + (e.clientY - pocetnaY));
    x = c.x;
    y = c.y;
    primijeni();
  };

  const naGore = e => {
    if (aktivniPointer === null || e.pointerId !== aktivniPointer) return;
    aktivniPointer = null;
    element.classList.remove('vuce-se');
    try { rucka.releasePointerCapture(e.pointerId); } catch { /* svejedno */ }
  };

  /** Vrati prozor na pocetnu poziciju. */
  const resetuj = () => { x = 0; y = 0; primijeni(); };

  rucka.addEventListener('pointerdown', naDolje);
  rucka.addEventListener('pointermove', naPomak);
  rucka.addEventListener('pointerup', naGore);
  rucka.addEventListener('pointercancel', naGore);
  rucka.addEventListener('dblclick', resetuj);
  rucka.classList.add('rucka-za-vucu');

  // Ako se prozor smanji ispod pomaka, vrati ga u vidno polje
  const naPromjenuVelicine = () => {
    if (!x && !y) return;
    const c = ogranici(x, y);
    x = c.x; y = c.y;
    primijeni();
  };
  window.addEventListener('resize', naPromjenuVelicine);

  const razvezi = () => {
    rucka.removeEventListener('pointerdown', naDolje);
    rucka.removeEventListener('pointermove', naPomak);
    rucka.removeEventListener('pointerup', naGore);
    rucka.removeEventListener('pointercancel', naGore);
    rucka.removeEventListener('dblclick', resetuj);
    window.removeEventListener('resize', naPromjenuVelicine);
    rucka.classList.remove('rucka-za-vucu');
  };

  return {
    resetuj,
    razvezi,
    /**
     * Pomjeri prozor za zadani pomak, uz isto ogranicenje kao i vuca.
     * Koristi ga promjena velicine: kad se prozor rasiri, layout ga
     * pomjeri (jer je centriran ili prislonjen uz ivicu), pa se ta
     * razlika mora ponistiti da sidrena ivica ostane na mjestu.
     */
    pomjeriZa(dx, dy) {
      const c = ogranici(x + dx, y + dy);
      x = c.x;
      y = c.y;
      primijeni();
    },
  };
}

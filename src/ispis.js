import { VERZIJA } from './config.js';

/**
 * Stampanje sa vlastitim zaglavljem i podnozjem.
 *
 * Chrome u margine stranice sam upisuje naslov dokumenta, adresu
 * stranice, datum i broj stranice. To se ne da ukloniti iz CSS-a — nije
 * dio dokumenta nego postavka dijaloga za stampu. Ali nestaje kad je
 * `@page { margin: 0 }`: tada u margini nema mjesta da se ista ispise.
 *
 * Razmak do ivice papira zato dajemo sami, kao padding, a u njega
 * smjestamo svoje zaglavlje i podnozje.
 */

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));

/** "2026-09-16" -> "16.09.2026." */
function datumTekst(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  return m ? m[3] + '.' + m[2] + '.' + m[1] + '.' : '';
}

/** Danasnji datum, isti oblik. */
function danas() {
  const d = new Date();
  const dva = n => String(n).padStart(2, '0');
  return dva(d.getDate()) + '.' + dva(d.getMonth() + 1) + '.' + d.getFullYear() + '.';
}

/** "Porezni period 01.08.2026. – 31.08.2026." ili prazno. */
export function periodTekst(p) {
  const od = datumTekst(p && p.periodOd);
  const doo = datumTekst(p && p.periodDo);
  if (!od && !doo) return '';
  return 'Porezni period ' + (od || '…') + ' – ' + (doo || '…');
}

const NAPOMENA =
  'Nije službeni dokument. Prije uplate provjeriti iznose kod Porezne uprave FBiH.';

/**
 * Odstampaj jedan dokument.
 *
 * @param {Object} cfg
 * @param {string} cfg.klasa   klasa na <body> koju print.css koristi da
 *                             sa papira skloni sve osim ovog dokumenta
 * @param {string} cfg.naslov  lijevo u zaglavlju
 * @param {string} [cfg.desno] desno u zaglavlju (npr. porezni period)
 */
export function stampaj({ klasa, naslov, desno }) {
  const zaglavlje = document.createElement('div');
  zaglavlje.className = 'ispis-zaglavlje';
  zaglavlje.innerHTML =
    '<span class="ispis-naslov">' + esc(naslov) + '</span>'
    + '<span class="ispis-desno">' + esc(desno || '') + '</span>';

  const podnozje = document.createElement('div');
  podnozje.className = 'ispis-podnozje';
  podnozje.innerHTML =
    '<span>' + NAPOMENA + '</span>'
    + '<span class="ispis-desno">kalkulacija_freelance.exe ' + esc(VERZIJA)
      + ' · ' + esc(danas()) + '</span>';

  document.body.append(zaglavlje, podnozje);
  document.body.classList.add(klasa, 'ispis-u-toku');

  const ocisti = () => {
    document.body.classList.remove(klasa, 'ispis-u-toku');
    zaglavlje.remove();
    podnozje.remove();
  };
  window.addEventListener('afterprint', ocisti, { once: true });

  window.print();
  // ako afterprint ne dodje (neki browseri ga preskoce)
  setTimeout(ocisti, 1500);
}

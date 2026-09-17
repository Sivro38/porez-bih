import * as ikone from './ikone.js';

/**
 * Precice na radnoj povrsini, gore lijevo.
 *
 * Ponasaju se kao u XP-u: jedan klik oznaci, dvoklik otvara. Zbog toga
 * je i tastatura pokrivena (Enter ili razmak), da se ne oslanja samo na
 * dvoklik koji na webu nije ocit.
 */

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));

/**
 * @param {Array<{naziv: string, ikona: string, otvori: Function}>} stavke
 */
export function napraviPrecice(stavke) {
  const ploca = document.createElement('div');
  ploca.className = 'xp-precice';
  ploca.innerHTML = stavke.map((s, i) =>
    '<button type="button" class="xp-precica" data-precica="' + i + '"'
    + ' title="' + esc(s.naziv) + ' — dvoklik za otvaranje">'
    + '<span class="xp-precica-ikona">' + s.ikona + '</span>'
    + '<span class="xp-precica-naziv">' + esc(s.naziv) + '</span>'
    + '</button>').join('');

  // Ide na pocetak tijela da prozori u prirodnom redoslijedu ostanu iznad
  document.body.prepend(ploca);

  const oznaci = dugme => {
    ploca.querySelectorAll('.xp-precica').forEach(b =>
      b.classList.toggle('oznacena', b === dugme));
  };

  const otvori = i => {
    oznaci(null);
    stavke[i].otvori();
  };

  ploca.addEventListener('click', e => {
    const dugme = e.target.closest('.xp-precica');
    if (dugme) oznaci(dugme);
  });

  ploca.addEventListener('dblclick', e => {
    const dugme = e.target.closest('.xp-precica');
    if (dugme) otvori(Number(dugme.dataset.precica));
  });

  ploca.addEventListener('keydown', e => {
    const dugme = e.target.closest('.xp-precica');
    if (!dugme) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      otvori(Number(dugme.dataset.precica));
    }
  });

  // Klik po praznoj povrsini skida oznaku
  document.addEventListener('click', e => {
    if (!e.target.closest('.xp-precica')) oznaci(null);
  });

  return ploca;
}

export { ikone };

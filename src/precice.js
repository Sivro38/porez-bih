import * as ikone from './ikone.js';

/**
 * Precice na radnoj povrsini, gore lijevo, u mrezi.
 *
 * Ponasaju se kao u XP-u: jedan klik oznaci, dvoklik otvara. Zbog toga
 * je i tastatura pokrivena (Enter ili razmak), da se ne oslanja samo na
 * dvoklik koji na webu nije ocit, a strelice setaju po mrezi.
 *
 * MREZA. Kao na pravom XP desktopu, svaka ikona stoji u celiji iste
 * velicine, a prazan red je prazan red mreze — iste visine kao red sa
 * ikonama — a ne razmak izmedju grupa. Raspored se zadaje po redovima:
 *
 *   napraviPrecice([
 *     [kalkulacija, mojiPodaci],
 *     [],                          // prazan red
 *     [uplatnice, ams, godisnja],
 *   ]);
 */

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));

/**
 * @param {Array<Array<{naziv: string, ikona: string, otvori: Function}>>} redovi
 */
export function napraviPrecice(redovi) {
  const stavke = [];
  const kolona = Math.max(1, ...redovi.map(r => r.length));

  const ploca = document.createElement('div');
  ploca.className = 'xp-precice';
  ploca.style.setProperty('--precice-kolona', String(kolona));
  // Prazan red mora zauzeti svoj red mreze, inace bi se sljedeci primakao.
  ploca.innerHTML = redovi.map((red, r) =>
    !red.length
      ? '<div class="xp-precice-prazno" style="grid-row:' + (r + 1) + '" aria-hidden="true"></div>'
      : red.map((s, k) => {
          const i = stavke.push({ ...s, red: r, kolona: k }) - 1;
          return '<button type="button" class="xp-precica" data-precica="' + i + '"'
            + ' style="grid-row:' + (r + 1) + ';grid-column:' + (k + 1) + '"'
            + ' title="' + esc(s.naziv) + ' — dvoklik za otvaranje">'
            + '<span class="xp-precica-ikona">' + s.ikona + '</span>'
            + '<span class="xp-precica-naziv">' + esc(s.naziv) + '</span>'
            + '</button>';
        }).join('')
  ).join('');

  // Ide na pocetak tijela da prozori u prirodnom redoslijedu ostanu iznad
  document.body.prepend(ploca);

  const dugmad = () => [...ploca.querySelectorAll('.xp-precica')];

  const oznaci = dugme => {
    dugmad().forEach(b => b.classList.toggle('oznacena', b === dugme));
  };

  const otvori = i => {
    oznaci(null);
    stavke[i].otvori();
  };

  /**
   * Strelice: lijevo-desno u istom redu, gore-dolje na najblizu ikonu u
   * susjednom redu koji ima ikona (prazni se preskacu).
   */
  const susjed = (i, smjer) => {
    const s = stavke[i];
    if (smjer === 'ArrowLeft' || smjer === 'ArrowRight') {
      const korak = smjer === 'ArrowLeft' ? -1 : 1;
      return stavke.findIndex(x => x.red === s.red && x.kolona === s.kolona + korak);
    }
    const korak = smjer === 'ArrowUp' ? -1 : 1;
    for (let r = s.red + korak; r >= 0 && r < redovi.length; r += korak) {
      const uRedu = stavke.map((x, j) => [x, j]).filter(([x]) => x.red === r);
      if (!uRedu.length) continue;
      return uRedu.reduce((najbliza, par) =>
        Math.abs(par[0].kolona - s.kolona) < Math.abs(najbliza[0].kolona - s.kolona) ? par : najbliza)[1];
    }
    return -1;
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
    const i = Number(dugme.dataset.precica);
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      otvori(i);
      return;
    }
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      e.preventDefault();
      const j = susjed(i, e.key);
      if (j < 0) return;
      const cilj = ploca.querySelector('[data-precica="' + j + '"]');
      oznaci(cilj);
      cilj.focus();
    }
  });

  // Klik po praznoj povrsini skida oznaku
  document.addEventListener('click', e => {
    if (!e.target.closest('.xp-precica')) oznaci(null);
  });

  return ploca;
}

export { ikone };

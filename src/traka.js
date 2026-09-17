/**
 * Donja traka sa prozorima — kao XP taskbar.
 *
 * Fiksirana je uz dno ekrana i drzi po jedno dugme za svaki otvoren
 * prozor. Klik na dugme vraca minimiziran prozor, a minimizira onaj koji
 * je trenutno aktivan.
 *
 * Prozori se ovdje prijavljuju; traka ne zna nista o njihovom sadrzaju,
 * samo poziva metode koje joj daju.
 */

/** Visina trake. Vuca i promjena velicine je odbijaju od vidnog polja. */
export const VISINA_TRAKE = 30;

/**
 * @type {Array<{naziv: string, ikona: string, api: Object,
 *               pokretac: boolean, pokreni: Function|null}>}
 */
const prijavljeni = [];

let aktivni = null;
let traka = null;
let popis = null;

function napraviTraku() {
  traka = document.createElement('div');
  traka.className = 'xp-traka';
  traka.innerHTML =
    '<div class="xp-traka-pocetak">kalkulacija</div>' +
    '<div class="xp-traka-popis"></div>' +
    '<div class="xp-traka-sat"></div>';
  document.body.append(traka);
  popis = traka.querySelector('.xp-traka-popis');

  popis.addEventListener('click', e => {
    const dugme = e.target.closest('[data-traka-idx]');
    if (!dugme) return;
    const stavka = prijavljeni[Number(dugme.dataset.trakaIdx)];
    const { api } = stavka;
    // Zatvoren pokretac se otvara. Kroz `pokreni` ide zato sto uz
    // otvaranje ide i kvacica u meniju, koju traka ne poznaje.
    if (!api.jeOtvoren()) (stavka.pokreni || api.vrati)();
    // Klik na aktivan i vidljiv prozor ga sklanja; inace ga dovodi naprijed
    else if (api.jeMinimiziran()) api.vrati();
    else if (aktivni === api) api.minimiziraj();
    else api.vrati();
    osvjezi();
  });

  const sat = traka.querySelector('.xp-traka-sat');
  const otkucaj = () => {
    const d = new Date();
    sat.textContent = String(d.getHours()).padStart(2, '0') + ':'
      + String(d.getMinutes()).padStart(2, '0');
  };
  otkucaj();
  setInterval(otkucaj, 15000);
}

/**
 * Prijavi prozor na traku.
 * @param {string} naziv tekst dugmeta
 * @param {Object} api mora imati jeOtvoren, jeMinimiziran, minimiziraj, vrati
 * @param {string} [ikona] emoji ili znak ispred naziva
 */
export function prijavi(naziv, api, ikona = '') {
  if (!traka) napraviTraku();
  prijavljeni.push({ naziv, api, ikona, pokretac: false, pokreni: null });
  osvjezi();
}

/**
 * Oznaci prozore koji na traci stoje uvijek, i kad su zatvoreni.
 *
 * Na telefonu su precice na radnoj povrsini sakrivene — prozor ide do
 * vrha ekrana — pa je traka jedini nacin da se prozor otvori. Zato ta
 * cetiri dugmeta tamo stoje stalno, kao pokretaci. Na sirokom ekranu
 * ih CSS krije dok su zatvoreni, da traka ostane XP-ovska i pokazuje
 * samo otvorene prozore.
 *
 * @param {Array<{api: Object, ikona?: string, pokreni?: Function}>} spisak
 */
export function postaviPokretace(spisak) {
  spisak.forEach(({ api, ikona, pokreni }) => {
    const stavka = prijavljeni.find(p => p.api === api);
    if (!stavka) return;
    stavka.pokretac = true;
    if (ikona) stavka.ikona = ikona;
    if (pokreni) stavka.pokreni = pokreni;
  });
  osvjezi();
}

/** Zapamti koji je prozor sprijeda, da mu dugme izgleda pritisnuto. */
export function postaviAktivni(api) {
  aktivni = api;
  osvjezi();
}

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));

/** Ponovo iscrtaj dugmad prema trenutnom stanju prozora. */
export function osvjezi() {
  if (!popis) return;
  popis.innerHTML = prijavljeni.map((p, i) => {
    const otvoren = p.api.jeOtvoren();
    if (!otvoren && !p.pokretac) return '';
    const pritisnuto = otvoren && !p.api.jeMinimiziran() && aktivni === p.api;
    // `ikona` je SVG iz ikone.js — nas kod, ne korisnicki unos, pa ide
    // neekranirana. Naziv ide kroz esc jer moze doci iz naslova prozora.
    return '<button type="button" class="xp-traka-dugme' + (pritisnuto ? ' pritisnuto' : '')
      + (otvoren && p.api.jeMinimiziran() ? ' minimiziran' : '')
      + (otvoren ? '' : ' zatvoren') + '"'
      + ' data-traka-idx="' + i + '" title="' + esc(p.naziv) + '">'
      + (p.ikona ? '<span class="xp-traka-ikona">' + p.ikona + '</span>' : '')
      + '<span class="xp-traka-tekst">' + esc(p.naziv) + '</span>'
      + '</button>';
  }).join('');
}

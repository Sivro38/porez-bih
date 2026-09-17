/**
 * Skala sadrzaja prati velicinu prozora.
 *
 * Ko hoce krupnije, poveca prozor. Skala je manji od dva odnosa —
 * koliko sadrzaj stane po sirini i koliko po visini — pa visak prostora
 * samo sa jedne strane ostaje prazan umjesto da razvlaci: prozor samo
 * visi ne mijenja nista, prozor samo siri raste dok ga visina ne
 * zaustavi.
 *
 * Dvije zamke, obje naucene na uplatnicama:
 *
 * Raspoloziva visina se NE cita iz sadrzaja. Da se cita, promjena skale
 * bi promijenila visinu sadrzaja, to bi promijenilo skalu, i tako u
 * krug. Cita se iz podloge i iz zadate visine prozora — nista od toga
 * ne zavisi od skale.
 *
 * Zadata visina se uzima uz gornju granicu vidnog polja: `max-height` je
 * stegne, pa bi je racun inace precijenio i mislio da ima mjesta koliko
 * ga nema.
 */

const stegni = (v, min, max) => Math.min(Math.max(v, min), max);

/**
 * @param {Object} prozor        iz napraviProzor()
 * @param {Object} cfg
 * @param {string} cfg.svojstvo  CSS promjenjiva u koju se upisuje skala
 * @param {number} cfg.sirina    prava sirina sadrzaja, pri skali 1
 * @param {number} cfg.visina    prava visina sadrzaja, pri skali 1
 * @param {number} [cfg.najmanja]
 * @param {number} [cfg.najveca]
 * @param {string} [cfg.iznad]   selektor onoga sto stoji iznad sadrzaja
 *                               (alatna traka) i zauzima visinu
 * @returns {Function} prilagodi — pozvati kad se sadrzaj bitno promijeni
 */
export function pratiSkalu(prozor, cfg) {
  const {
    svojstvo, sirina, visina,
    najmanja = 0.45, najveca = 2.5, iznad = null,
  } = cfg;

  const okvir = prozor.element;
  const tijelo = prozor.tijelo;

  function prilagodi() {
    const st = getComputedStyle(tijelo);
    const raspSirina = tijelo.clientWidth
      - parseFloat(st.paddingLeft) - parseFloat(st.paddingRight);

    const podloga = okvir.closest('.modal-overlay');
    const najvisa = (podloga ? podloga.clientHeight : window.innerHeight) - 20;
    const zadana = parseFloat(okvir.style.height) || Infinity;
    const visinaProzora = Math.min(zadana, najvisa);

    const traka = okvir.querySelector('.titlebar');
    const podnozje = okvir.querySelector('.xp-prozor-akcije');
    const alat = iznad ? tijelo.querySelector(iznad) : null;

    const raspVisina = visinaProzora
      - (traka ? traka.getBoundingClientRect().height : 0)
      - (podnozje ? podnozje.getBoundingClientRect().height : 0)
      - (alat ? alat.getBoundingClientRect().height + 10 : 0)
      - parseFloat(st.paddingTop) - parseFloat(st.paddingBottom);

    const s = Math.min(raspSirina / sirina, raspVisina / visina);
    okvir.style.setProperty(svojstvo, stegni(s, najmanja, najveca).toFixed(3));
  }

  // Vidno polje ulazi u racun kad prozor nema zadanu visinu
  window.addEventListener('resize', prilagodi);
  prilagodi();
  return prilagodi;
}

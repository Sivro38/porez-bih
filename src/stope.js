import { STOPE as ZADANE, VRSTE_PRIHODA, ZADANA_VRSTA } from './config.js';

/**
 * Trenutno vazece stope.
 *
 * config.js drzi zadane vrijednosti; ovdje se pamti ono sto je korisnik
 * eventualno promijenio u "Postavke poreske stope". Sve sto racuna ili
 * prikazuje stope cita odavde, ne iz config.js — inace bi se tabela i
 * obracun razisli cim se nesto promijeni.
 *
 * Kanton se ne cuva: uvijek je ostatak do cjeline nakon Federacije, pa
 * se izvodi. Tako se to dvoje ne moze zbrojiti u nesto sto nije 100%.
 */

const KLJUC = 'porez.stope.v1';

/** Stope koje korisnik moze mijenjati. Kanton se izvodi iz Federacije. */
export const PROMJENJIVE = [
  { key: 'rashodi',    label: 'Priznati rashodi',        opis: 'povremena samostalna djelatnost' },
  { key: 'rashodiAutorski', label: 'Priznati rashodi — autorska naknada', opis: 'kad je prihod autorska naknada' },
  { key: 'doprinosi',  label: 'Doprinosi',               opis: 'udio u osnovici za doprinose' },
  { key: 'federacija', label: 'Federacija',              opis: 'udio u doprinosima' },
  { key: 'porez',      label: 'Porez na dohodak',        opis: 'udio u osnovici poreza' },
];

function procitaj() {
  try {
    const raw = localStorage.getItem(KLJUC);
    if (!raw) return { ...ZADANE };
    const spremljeno = JSON.parse(raw);
    const s = { ...ZADANE };
    PROMJENJIVE.forEach(({ key }) => {
      const v = Number(spremljeno[key]);
      // odbaci smece iz storagea umjesto da se racuna sa NaN
      if (Number.isFinite(v) && v >= 0 && v <= 1) s[key] = v;
    });
    s.kanton = 1 - s.federacija;
    return s;
  } catch {
    return { ...ZADANE };
  }
}

let trenutne = procitaj();

/** Stope koje trenutno vaze. */
export function stope() {
  return trenutne;
}

/** Da li se razlikuju od zadanih iz config.js. */
export function suIzmijenjene() {
  return PROMJENJIVE.some(({ key }) => trenutne[key] !== ZADANE[key]);
}

/**
 * Stope za odabranu vrstu prihoda.
 *
 * Razlika izmedju vrsta je samo u priznatim rashodima, pa se ovdje
 * `rashodi` zamijeni onim postotkom koji ta vrsta nosi. Sve ostalo —
 * doprinosi, raspodjela, porez — je isto.
 *
 * Ovo vraca obican objekat stopa, pa i obracun i tabela i postotci u
 * njoj gledaju u istu stvar i ne mogu se raziti.
 *
 * @param {string} [vrsta] kljuc iz VRSTE_PRIHODA
 */
export function stopeZa(vrsta) {
  const s = stope();
  const v = VRSTE_PRIHODA.find(x => x.key === vrsta)
    || VRSTE_PRIHODA.find(x => x.key === ZADANA_VRSTA);
  return { ...s, rashodi: s[v.stopa] };
}

/** Zadane vrijednosti, za prikaz "vrati na zadano". */
export function zadaneStope() {
  return { ...ZADANE };
}

/**
 * Snimi nove stope. Prima samo one iz PROMJENJIVE; kanton se izvodi.
 * @returns {boolean} da li je snimanje uspjelo
 */
export function snimiStope(nove) {
  const s = { ...trenutne };
  PROMJENJIVE.forEach(({ key }) => {
    const v = Number(nove[key]);
    if (Number.isFinite(v) && v >= 0 && v <= 1) s[key] = v;
  });
  s.kanton = 1 - s.federacija;
  trenutne = s;
  let uspjelo = true;
  try {
    localStorage.setItem(KLJUC, JSON.stringify(
      Object.fromEntries(PROMJENJIVE.map(({ key }) => [key, s[key]]))));
  } catch {
    uspjelo = false;   // radi dalje, samo nece prezivjeti zatvaranje
  }
  return uspjelo;
}

/** Vrati stope iz config.js. */
export function vratiZadane() {
  trenutne = { ...ZADANE };
  try { localStorage.removeItem(KLJUC); } catch { /* svejedno */ }
}

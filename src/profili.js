import { PROFILI_KEY, PROFILI_KEY_V2 } from './config.js';

/**
 * Tri mjesta za profile licnih podataka.
 *
 * Ranije je ovo bila lista imena sa padajucim izbornikom i tri dugmeta,
 * sto je za tri profila bilo previse koraka. Sada su tri fiksna mjesta:
 * prazno se klikom popuni, puno se klikom ucita.
 *
 * Mjesta su odvojena od tekuceg unosa: rad na podacima ne mijenja
 * snimljeni profil dok se izricito ne snimi.
 */

export const BROJ_MJESTA = 3;

const prazno = () => new Array(BROJ_MJESTA).fill(null);

function procitaj() {
  try {
    const raw = localStorage.getItem(PROFILI_KEY_V2);
    if (raw) {
      const o = JSON.parse(raw);
      if (Array.isArray(o)) {
        const m = prazno();
        o.slice(0, BROJ_MJESTA).forEach((x, i) => { m[i] = x || null; });
        return m;
      }
    }
    return prenesiStaro();
  } catch {
    return prazno();
  }
}

/** Preuzmi profile iz starog formata (imenovana lista) u prva tri mjesta. */
function prenesiStaro() {
  const m = prazno();
  try {
    const raw = localStorage.getItem(PROFILI_KEY);
    if (!raw) return m;
    const stari = JSON.parse(raw);
    if (!stari || typeof stari !== 'object' || Array.isArray(stari)) return m;
    Object.keys(stari).sort((a, b) => a.localeCompare(b, 'bs'))
      .slice(0, BROJ_MJESTA)
      .forEach((naziv, i) => { m[i] = { naziv, podaci: stari[naziv] }; });
    if (m.some(Boolean)) upisi(m);
  } catch { /* stari format nije citljiv - pocni prazno */ }
  return m;
}

function upisi(m) {
  try {
    localStorage.setItem(PROFILI_KEY_V2, JSON.stringify(m));
    return true;
  } catch {
    return false;
  }
}

/** Sva tri mjesta; prazno mjesto je null. */
export function mjesta() {
  return procitaj();
}

/** Profil na datom mjestu, ili null. */
export function naMjestu(i) {
  return procitaj()[i] || null;
}

/** Snimi podatke na mjesto pod datim nazivom. */
export function snimi(i, naziv, podaci) {
  const ime = String(naziv || '').trim();
  if (!ime || i < 0 || i >= BROJ_MJESTA) return false;
  const m = procitaj();
  m[i] = { naziv: ime, podaci: { ...podaci } };
  return upisi(m);
}

/** Promijeni samo naziv, podatke ostavi. */
export function preimenuj(i, naziv) {
  const ime = String(naziv || '').trim();
  const m = procitaj();
  if (!ime || !m[i]) return false;
  m[i] = { naziv: ime, podaci: m[i].podaci };
  return upisi(m);
}

/** Isprazni mjesto. */
export function obrisi(i) {
  const m = procitaj();
  if (!m[i]) return false;
  m[i] = null;
  return upisi(m);
}

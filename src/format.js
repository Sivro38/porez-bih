/**
 * Formatiranje brojeva u bosanskom formatu: 1.234,56
 *
 * NE koristi toLocaleString('bs-BA'). Ta lokalizacija daje razlicite
 * rezultate po okruzenju - u Chromeu vraca "3,399.44" (americki format),
 * a u Node-u "3.399,44". Za iznose koji idu na uplatnicu to je
 * neprihvatljivo, pa se format ispisuje rucno i deterministicki.
 */

/** 1234567 -> "1.234.567" */
function grupisi(cijeli) {
  return String(cijeli).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Feninge -> "1.234,56".
 * Racuna se cijelobrojno, bez float aritmetike.
 */
export function fmt(fening) {
  const negativan = fening < 0;
  const a = Math.abs(Math.round(fening));
  const cijeli = grupisi(Math.floor(a / 100));
  const decimale = String(a % 100).padStart(2, '0');
  return (negativan ? '-' : '') + cijeli + ',' + decimale;
}

/** Broj -> "1.234,56" sa zadanim brojem decimala. */
export function fmtBroj(n, decimala = 2) {
  const negativan = n < 0;
  const faktor = 10 ** decimala;
  const zaokruzeno = Math.round(Math.abs(n) * faktor);
  const cijeli = grupisi(Math.floor(zaokruzeno / faktor));
  if (decimala === 0) return (negativan ? '-' : '') + cijeli;
  const ostatak = String(zaokruzeno % faktor).padStart(decimala, '0');
  return (negativan ? '-' : '') + cijeli + ',' + ostatak;
}

/** Broj (npr. 10.88) -> "10,88%" */
export function fmtPct(n) {
  return fmtBroj(n, 2) + '%';
}

/**
 * Korisnicki unos -> KM kao broj.
 * Podnosi "3399,44", "3.399,44", "3399.44" i razmake.
 */
export function parseInput(v) {
  if (!v) return 0;
  let s = String(v).replace(/\s/g, '');
  if (s.includes(',') && s.includes('.')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (s.includes(',')) {
    s = s.replace(',', '.');
  }
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

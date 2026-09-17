import { pitajZaPotvrdu } from './prozor.js';

/**
 * Brisanje svega sto program cuva.
 *
 * Stoji u meniju Alati, ne u postavkama stopa: nema veze sa stopama, a
 * sakriveno iza drugog posla se tesko nalazi kad zatreba.
 */

/** Prefiks pod kojim program drzi sve svoje u localStorage. */
const PREFIKS = 'porez.';

/**
 * Obrisi sve sto program cuva.
 *
 * Kljucevi se traze po prefiksu umjesto da se nabrajaju: tako novi kljuc
 * ne moze ostati zaboravljen iza brisanja. Tudji kljucevi se ne diraju.
 */
export function obrisiSve() {
  try {
    const zaBrisanje = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIKS)) zaBrisanje.push(k);
    }
    zaBrisanje.forEach(k => localStorage.removeItem(k));
    return true;
  } catch {
    return false;
  }
}

/** Pitaj pa obrisi. Nakon brisanja stranica se ponovo ucitava. */
export async function pitajPaObrisi() {
  const potvrdjeno = await pitajZaPotvrdu({
    naslov: 'Obriši sve podatke',
    poruka: 'Ovo briše sve što je program zapamtio u ovom browseru: lične '
      + 'podatke, sva tri profila, unesenu osnovicu i izmijenjene stope. '
      + 'Vraća i početno upozorenje.\n\n'
      + 'Ne može se vratiti. Nastaviti?',
    potvrdi: 'Obriši sve',
  });
  if (!potvrdjeno) return false;
  obrisiSve();
  // Pola programa je vec procitalo stare vrijednosti u memoriju;
  // ponovno ucitavanje je jedini nacin da sve krene iz cista.
  location.reload();
  return true;
}

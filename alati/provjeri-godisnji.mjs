#!/usr/bin/env node
/*
 * Provjera obracuna godisnje prijave (src/godisnji.js) na primjerima koji
 * se mogu izracunati i rukom. Trci u GitHub provjeri, uz provjeru racuna.
 *
 * Pokretanje:   node alati/provjeri-godisnji.mjs
 */

import { obracunGodisnji, prazanUnos, brojMjeseci, faktor, LICNI_ODBITAK } from '../src/godisnji.js';
import { obracun } from '../src/calc.js';

let greske = 0;
const ocekuj = (opis, dobijeno, ocekivano) => {
  const ok = JSON.stringify(dobijeno) === JSON.stringify(ocekivano);
  if (!ok) { greske++; console.error('  PADA  ' + opis + ': dobijeno ' + JSON.stringify(dobijeno) + ', ocekivano ' + JSON.stringify(ocekivano)); }
  else console.log('  ok    ' + opis);
};

// 1. Primjer iz plana: 12 mjeseci po 1.302,08 KM daje osnovicu oko 12.000.
//    Racunamo sami, uplata po uplata, pa poredimo.
{
  const u = prazanUnos(new Date(2026, 4, 1));
  u.uplate.forEach(x => { x.iznos = '1000'; });
  const g = obracunGodisnji(u);
  const jedna = obracun(1000, 'povremena');
  ocekuj('red 13 = 12 x osnovica poreza jedne uplate', g.redovi[13], 12 * jedna.osnPoreza);
  ocekuj('red 29 = 12 x porez jedne uplate', g.redovi[29], 12 * jedna.porez);
  ocekuj('red 18 = 3.600 KM za cijelu godinu', g.redovi[18], LICNI_ODBITAK);
  ocekuj('red 25 = 13 - 18', g.redovi[25], 12 * jedna.osnPoreza - LICNI_ODBITAK);
  ocekuj('red 26 = 10% reda 25', g.redovi[26], Math.round((12 * jedna.osnPoreza - LICNI_ODBITAK) * 0.1));
  ocekuj('red 31 = 26 - 29 (povrat je negativan)', g.redovi[31], g.redovi[26] - g.redovi[29]);
  // 12 x 768,00 = 9.216,00; minus 3.600 = 5.616,00; porez 561,60; uplaceno 921,60; povrat 360,00
  ocekuj('povrat za 12 x 1.000 KM je tacno 360,00 KM', g.redovi[31], -36000);
}

// 2. Ako su odbici veci od dohotka, osnovica je nula i vraca se sve uplaceno.
{
  const u = prazanUnos(new Date(2026, 4, 1));
  u.uplate[0].iznos = '1000';
  const g = obracunGodisnji(u);
  ocekuj('osnovica nikad ispod nule', g.redovi[25], 0);
  ocekuj('vraca se cijela uplacena akontacija', g.redovi[31], -obracun(1000, 'povremena').porez);
}

// 3. Dio godine: 15.03.–31.12. su deset punih mjeseci, u korist obveznika.
ocekuj('mjeseci 15.03.–31.12.', brojMjeseci('2025-03-15', '2025-12-31'), 10);
ocekuj('mjeseci cijela godina', brojMjeseci('2025-01-01', '2025-12-31'), 12);
ocekuj('mjeseci pogresan period -> 12', brojMjeseci('2025-12-01', '2025-01-31'), 12);
{
  const u = prazanUnos(new Date(2026, 4, 1));
  u.periodOd = '2026-03-15';
  ocekuj('red 18 za deset mjeseci = 3.000 KM', obracunGodisnji(u).redovi[18], 300000);
}

// 4. Faktor za izdrzavane: 1,5 (bracni drug) daje 5.400 KM.
ocekuj('faktor "1,5"', faktor('1,5'), 1.5);
ocekuj('faktor prazan -> 1', faktor(''), 1);
ocekuj('faktor besmislen -> 1', faktor('99'), 1);
{
  const u = prazanUnos(new Date(2026, 4, 1));
  u.faktor = '1,5';
  ocekuj('red 18 sa faktorom 1,5', obracunGodisnji(u).redovi[18], 540000);
}

// 5. Rucno uplacen porez zamjenjuje obracunati; autorska naknada nosi 30%.
{
  const u = prazanUnos(new Date(2026, 4, 1));
  u.uplate[0] = { mjesec: 1, iznos: '1000', vrsta: 'autorska', porezRucno: '70,00' };
  const g = obracunGodisnji(u);
  ocekuj('autorska: red 13 = osnovica poreza sa 30% rashoda', g.redovi[13], obracun(1000, 'autorska').osnPoreza);
  ocekuj('rucno uplaceno ide u red 29', g.redovi[29], 7000);
}

// 6. Zaposlen uz freelance: red 8 ulazi u dohodak, red 28 se oduzima.
{
  const u = prazanUnos(new Date(2026, 4, 1));
  u.uplate[0].iznos = '1000';
  u.red8 = '20000'; u.red28 = '1500';
  const g = obracunGodisnji(u);
  ocekuj('red 15d = 8 + 13', g.redovi[15].d, 2000000 + obracun(1000, 'povremena').osnPoreza);
  ocekuj('red 31 oduzima i red 28', g.redovi[31], g.redovi[26] - 150000 - g.redovi[29]);
}

// 7. Zadana godina: od januara do marta prosla, poslije tekuca.
ocekuj('februar 2026 -> 2025', prazanUnos(new Date(2026, 1, 10)).godina, 2025);
ocekuj('oktobar 2026 -> 2026', prazanUnos(new Date(2026, 9, 5)).godina, 2026);

if (greske) {
  console.error(greske + ' provjera pada.');
  process.exit(1);
}
console.log('Godisnji obracun: sve provjere prolaze.');

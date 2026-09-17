# Arhiva

Kod koji je bio napravljen pa izvučen iz aplikacije. Ništa odavde se ne
učitava niti uvozi — Vite pakuje samo ono što `src/main.js` dosegne, pa
u `dist/` ne završi ni bajt ovoga.

Stoji ovdje da ne treba pisati iznova ako nekad zatreba.

## izvorna-verzija.html

Prva verzija programa, cijela u jednom fajlu. Iz nje je doslovno izvučen
`src/styles.css` i po njoj se provjerava da je taj fajl ostao netaknut:

```bash
diff <(sed -n '8,175p' arhiva/izvorna-verzija.html) src/styles.css
```

Ne briši je dok ta provjera postoji u `RAZVOJ.md`.

## historija.js + historija.css

**Izvučeno: 16.09.2026.** Historija uplata — spisak snimljenih obračuna
u stilu XP Explorera, sa raspodjelom po kantonu, federaciji i porezu.

Snimalo se izričito, dugmetom „Spasi uplatu” uz polje osnovice; profil
se pogađao poređenjem imena i broja obveznika sa snimljenim profilima.
Podaci su išli u `localStorage` pod ključem `porez.historija.v1`.

### Kako se vraća

1. `git mv arhiva/historija.* src/`
2. `index.html` — vratiti `<link rel="stylesheet" href="./src/historija.css">`,
   stavku menija `<div class="opt" data-action="historija">` u meni Alati
   (sa `<span class="chk" id="chk-historija"> </span>`), i blok
   `<div class="unos-akcije">` sa dugmadima ispod polja osnovice
3. `src/main.js` — vratiti `import * as historija`, pravljenje prozora
   uz ostale dijaloge, `case 'historija'` u meniju, i blok koji veže
   dugmad „Spasi uplatu” i „Historija...”
4. `src/pravno.js` — vratiti `porez.historija.v1` u spisak `STAVKE`
5. `src/brisanje.js` — vratiti spomen historije u tekst potvrde
6. `README.md` — vratiti stavku u spisak funkcija

Sve potrebno stoji u commitima do `b12397a`.

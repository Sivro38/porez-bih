# kalkulacija_freelance.exe

Kalkulator poreza i doprinosa za freelance prihod iz inostranstva —
Federacija BiH, Zeničko-dobojski kanton. Popunjava i tri uplatnice i
obrazac AMS-1035, a izgleda kao Windows XP.

**Uživo: [porez.pages.dev](https://porez.pages.dev)**

> ⚠️ **Ovo nije službena stranica** i nije povezana ni s jednom institucijom.
> Stope, računi i šifre općina upisani su ručno i mogu biti zastarjeli.
> Prije uplate provjeri iznose kod Porezne uprave FBiH, u banci ili kod
> knjigovođe. Odgovornost za tačnost uplate je na tebi.

---

## Šta radi

Upišeš koliko si zaradio. Program izračuna koliko ide na doprinose i
porez, koliko ostaje tebi, i popuni papire koje nosiš u banku.

- **Obračun** — rashodi, doprinosi, raspodjela na Kanton i Federaciju,
  porez na dohodak, ukupno za uplatu i ukupno za zadržati
- **Tri uplatnice** — replika naloga za uplatu javnih prihoda, spremne
  za štampu; na telefonu se pretvaraju u karticu iz koje se brojevi
  prepisuju u mobilnu banku
- **Obrazac AMS-1035** — „Akontacija poreza po odbitku na druge
  samostalne djelatnosti na prihod iz inostranstva”, štampa se na
  položeni A4
- **Moji podaci** — ime, adresa, račun, JMBG, općina i period se upišu
  jednom pa se prepisuju svuda; tri mjesta za profile
- **Postavke stopa** — stope se mogu promijeniti ručno, iza potvrde
- **Pravno i privatnost** — šta se čuva, gdje, i kako se briše
- **Izvoz** — PDF i Excel
- **Uputstvo** — ugrađena dokumentacija, u stilu XP Helpa

Prozori se povlače, mijenjaju veličinu i minimiziraju na donju traku, a
uplatnice, obrazac i Moji podaci **rastu zajedno sa prozorom** — ko
slabije vidi, samo ga poveća.

## Kako se računa

Primjer za osnovicu od 1.000 KM:

| Korak | Stopa | Iznos |
|---|---|---|
| Osnovica (ukupan prihod) | — | 1.000,00 |
| Rashodi | 20% | 200,00 |
| Osnovica za obračun doprinosa | | 800,00 |
| Doprinosi (zdravstveno osiguranje) | 4% | 32,00 |
| → Kanton | 89,8% | 28,74 |
| → Federacija | 10,2% | 3,26 |
| Osnovica poreza na dohodak | | 768,00 |
| Porez na dohodak | 10% | 76,80 |
| **Ukupno za uplatu** | | **108,80** |
| **Ostaje tebi** | | **891,20** |

Priznati rashodi od 20% dolaze iz člana 15. stav 7. Zakona o porezu na
dohodak FBiH (povremene samostalne djelatnosti). Na sam obrazac
AMS-1035 upisuje se već umanjeni iznos, pa kolona 9 nosi 800,00, a ne
1.000,00.

Sve se računa u **feningima, cijelim brojevima**. Svaka stavka se
zaokruži odmah, a Kanton nosi ostatak — zato tri uplatnice uvijek
zbrajaju tačno na „Ukupno za uplatu”. Da se računalo u decimalama,
znale bi promašiti za fening.

## Privatnost

**Nema servera.** Nema naloga, nema analitike, nema kolačića.

Sve što upišeš — ime, JMBG, broj računa, adresa — ostaje u
`localStorage` tvog browsera i nikad ga ne napušta. Stranica je statična:
otvori se, i dalje radi bez mreže.

`Alati → Obriši sve podatke` briše sve što je program zapamtio, a
`Pomoć → Pravno i privatnost` popisuje šta se tačno čuva.

## Pokretanje

Treba Node 18 ili noviji.

```bash
npm install
npm run dev
```

Otvori http://localhost:5173

Za pristup s telefona na istoj mreži:

```bash
npm run dev -- --host
```

Produkcijski build:

```bash
npm run build
```

Rezultat je u `dist/` — obične statične datoteke, rade s bilo kojeg
hosta pa i otvorene direktno kao `file://`.

## Tehnički

Detaljno u **[RAZVOJ.md](RAZVOJ.md)** — kako je složeno, pravila koja se
ne krše, kako dodati novi prozor, i zamke oko ispisa.

Vanilla JavaScript i Vite. Bez frameworka — namjerno: cijeli program je
jedan prozorski sistem nad statičnim HTML-om, a scoped CSS bi razbio
XP izgled koji je ovdje tvrd uslov.

- `src/styles.css` je **doslovan** izvorni stil i ne dira se. Svaki novi
  stil ide u zaseban fajl; paleta je u `src/tokens.css`.
- `src/config.js` je jedini izvor istine za primaoce, račune i šifre
  općina. Zadane stope su tu; ono što trenutno vrijedi čita se iz
  `src/stope.js`.
- Obračun je u `src/calc.js`, formatiranje brojeva u `src/format.js`
  (ručno, jer `toLocaleString('bs-BA')` nije pouzdan između engina).
- Prozori, povlačenje, promjena veličine i donja traka su u
  `src/prozor.js`, `drag.js`, `resize.js` i `traka.js`.
- jsPDF i SheetJS se učitavaju tek kad zatrebaju, da se stranica otvara
  brzo.

Verzije su prikovane zbog Node 18: Vite 5 (Vite 6+ traži noviji Node) i
`wrangler@3` za deploy (wrangler 4 traži Node 22).

## Doprinos

Prijedlozi i ispravke su dobrodošli — najviše trebaju **šifre općina i
računi za ostale kantone**, provjera stopa u službenom izvoru, i greške
u obrascu AMS-1035.

Prije nego išta napišeš, pročitaj **[CONTRIBUTING.md](CONTRIBUTING.md)** —
tu piše šta je najkorisnije, šta neće ući i kako se izmjena šalje.
Tehnički dio je u [RAZVOJ.md](RAZVOJ.md), a kako se ovdje razgovara u
[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

Sigurnosna rupa **ne ide u javni issue** — [SECURITY.md](SECURITY.md).

## Autor

**Emin Sivro** — [LinkedIn](https://www.linkedin.com/in/eminsivro/)

## Licenca

Copyright © 2026 Emin Sivro. [GPL-3.0-or-later](LICENSE).

Slobodno koristi, mijenjaj i dijeli — ali izmijenjene verzije moraju
ostati pod istom licencom i sa dostupnim izvornim kodom.

Program koristi i tuđi rad:

| Biblioteka | Licenca |
|---|---|
| [jsPDF](https://github.com/parallax/jsPDF) | MIT |
| [jspdf-autotable](https://github.com/simonbengtsson/jsPDF-AutoTable) | MIT |
| [SheetJS (xlsx)](https://sheetjs.com/) | Apache-2.0 |
| [DejaVu Sans](https://dejavu-fonts.github.io/) | Bitstream Vera / Arev |

Puna obavještenja o autorskim pravima su u
[THIRD-PARTY-LICENSES.md](THIRD-PARTY-LICENSES.md).

## Šta nije napravljeno

- Stope, računi i šifre općina **nisu službeno potvrđeni** — provjereni
  su na dva nezavisna izvora, ali ne u službenom Pravilniku
- Računi i šifre vrijede samo za **Zeničko-dobojski kanton**
- Obračun ne pokriva olakšice, lične odbitke, autorske honorare (30%
  rashoda umjesto 20%) ni godišnju prijavu
- Nema godišnje prijave ni historije ranijih uplata

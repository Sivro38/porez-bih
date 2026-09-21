# kalkulacija_freelance.exe

Kalkulator i pomoć pri popunjavanju i plaćanju poreza na freelance rad.
Za sada Zeničko-dobojski kanton. Kroz sljedećih par verzija htio bih
pokriti i ostatak Bosne.

**Uživo: [porez.pages.dev](https://porez.pages.dev)**

> ⚠️ Ovo nije službena stranica i nije povezana ni sa jednom institucijom.
>
> Nisam knjigovođa ni pravnik. Porez plaćam sam, i to prvi put. Stope,
> račune i šifre općina sam provjerio kod Porezne uprave, ali propisi se
> mijenjaju i ja mogu pogriješiti. Provjerite iznose prije nego išta
> uplatite: u banci, kod knjigovođe, ili na izvorima koje program nudi
> pod `Pomoć → Službeni resursi`. Odgovornost za uplatu je na vama.

---

## Zašto ovo postoji

Trebao mi je alat da mi izračuna porezne dugove. Imao sam screenshot
koji mi je gospođa u poreznoj pokazala i ništa više od toga, pa sam
napravio sebi kalkulator da ne računam svaki put ispočetka.

Prve uplatnice sam popunio uz pomoć radnice u poreznoj u Zenici. Druge
sam platio preko ovog kalkulatora i tada našao grešku u jednom broju
računa. Jedna nula na pogrešnom mjestu. Verzija 1.1 je popravka poslije
toga.

Na početku mi je palo na pamet da ovo treba i drugima. Čuo sam da već
postoje alati za ovo. Gledao sam ih. Ili su se plaćali, ili nisu radili
ono što je meni trebalo, a to je da automatski popune uplatnice i AMS
obrazac i pokažu šta ide u koje polje.

Meni ovaj program ne treba da išta zaradi. Radi u vašem browseru i tu
ostaje, bez registracije i bez prikupljanja podataka. Kod je otvoren, pa ga
svako može uzeti, provjeriti i proširiti. Takav internet volim.

Inače ne završavam ono što počnem. Ovaj projekat jesam, i usput je bilo
zabavno.

## Zašto izgleda kao Windows XP

Nisam htio da aplikacija izgleda kao i hiljade drugih stranica na
internetu. Moderni i AI stil je svuda. XP estetika je, s druge strane,
zanimljiva i rijetka, a pristaje ovom alatu zbog njegove jednostavnosti.

U najmanju ruku, ovdje se samo upiše broj i vide se iznosi potrebnih
uplata.

## Šta radi

- **Obračun.** Rashodi, doprinosi, raspodjela na Kanton i Federaciju,
  porez na dohodak, ukupno za uplatu i ukupno za zadržati.
- **Tri uplatnice.** Replika naloga za uplatu javnih prihoda, spremne za
  štampu. Na telefonu se pretvaraju u karticu iz koje se brojevi
  prepisuju u mobilnu banku.
- **Obrazac AMS-1035.** „Akontacija poreza po odbitku na druge
  samostalne djelatnosti na prihod iz inostranstva”, na položenom A4.
  Crtan je po koordinatama iz službenog PDF-a Porezne uprave.
- **Moji podaci.** Ime, adresa, račun, JMBG, općina i period se upišu
  jednom pa se prepisuju svuda. Ima tri mjesta za profile.
- **Vrsta prihoda.** Povremena samostalna djelatnost nosi 20% priznatih
  rashoda, autorska naknada 30%.
- **Postavke stopa.** Stope se mogu promijeniti ručno, iza potvrde.
- **Pravno i privatnost.** Šta se čuva, gdje, i kako se briše.
- **Izvoz** u PDF i Excel.
- **Uputstvo**, ugrađeno, u stilu XP Helpa.

Prozori se povlače, mijenjaju veličinu i minimiziraju na donju traku.
Uplatnice, obrazac i Moji podaci rastu zajedno sa prozorom, pa ko
slabije vidi samo poveća prozor.

## Kako se računa

Primjer za osnovicu od 1.000 KM:

| Korak | Stopa | Iznos |
|---|---|---|
| Osnovica (ukupan prihod) | | 1.000,00 |
| Rashodi | 20% | 200,00 |
| Osnovica za obračun doprinosa | | 800,00 |
| Doprinosi (zdravstveno osiguranje) | 4% | 32,00 |
| → Kanton | 89,8% | 28,74 |
| → Federacija | 10,2% | 3,26 |
| Osnovica poreza na dohodak | | 768,00 |
| Porez na dohodak | 10% | 76,80 |
| **Ukupno za uplatu** | | **108,80** |
| **Ostaje vama** | | **891,20** |

Postotak priznatih rashoda propisuje
[Zakon o porezu na dohodak FBiH](https://www.paragraf.ba/propisi/fbih/zakon-o-porezu-na-dohodak.html)
(„Službene novine FBiH” 10/08, 9/10, 44/11, 7/13 i 65/13), član 15:

- **stav 7** daje 20% za dohodak od povremene samostalne djelatnosti
- **stav 8** daje 30% za autorske naknade naučnika, umjetnika,
  stručnjaka i novinara, ili stvarni iznos troškova

Bira se u polju Vrsta prihoda. Na sam obrazac AMS-1035 upisuje se već
umanjeni iznos.

Sve se računa u feninzima, cijelim brojevima. Svaka stavka se zaokruži
odmah, a Kanton nosi ostatak, pa tri uplatnice uvijek zbrajaju tačno na
„Ukupno za uplatu”. Da se računalo u decimalama, znale bi promašiti za
fening.

## Privatnost

Nema servera, korisničkih naloga, analitike ni kolačića. Sve što
upišete, dakle ime, JMBG, broj računa i adresa, ostaje u `localStorage`
vašeg browsera i nikad ga ne napušta. Stranica je statična pa radi i bez
mreže kad se jednom otvori.

`Alati → Obriši sve podatke` briše sve što je program zapamtio.
`Pomoć → Pravno i privatnost` popisuje šta se tačno čuva.

## Pokretanje

Treba Node 18 ili noviji.

```bash
npm install
npm run dev
```

Otvorite http://localhost:5173. Za pristup s telefona na istoj mreži
dodajte `-- --host`, a `npm run build` pravi produkcijsku verziju u
`dist/`. To su obične statične datoteke, rade s bilo kojeg hosta pa i
otvorene direktno kao `file://`.

## Tehnički

Detaljno u [RAZVOJ.md](RAZVOJ.md): kako je složeno, pravila koja se ne
krše, kako dodati novi prozor, i zamke oko ispisa.

Vanilla JavaScript i Vite, bez frameworka, i to namjerno. Cijeli program
je jedan prozorski sistem nad statičnim HTML-om, a scoped CSS bi razbio
XP izgled koji je ovdje tvrd uslov.

- `src/styles.css` je doslovan izvorni stil i ne dira se. Svaki novi
  stil ide u zaseban fajl, a paleta je u `src/tokens.css`.
- `src/config.js` je jedini izvor istine za primaoce, račune i šifre
  općina. Zadane stope su tu, a ono što trenutno vrijedi čita se iz
  `src/stope.js`.
- Obračun je u `src/calc.js`, formatiranje brojeva u `src/format.js`.
  Formatiranje je pisano ručno jer `toLocaleString('bs-BA')` nije
  pouzdan između engina.
- Prozori, povlačenje, promjena veličine i donja traka su u
  `src/prozor.js`, `drag.js`, `resize.js` i `traka.js`.
- Raspored obrasca AMS-1035 generiše `alati/izvuci-ams.py` iz službenog
  PDF-a. Ne crta se rukom.
- jsPDF i SheetJS se učitavaju tek kad zatrebaju, da se stranica otvara
  brzo.

Verzije su prikovane zbog Node 18: Vite 5, jer Vite 6 i noviji traže
noviji Node, i `wrangler@3` za deploy, jer wrangler 4 traži Node 22.

## Doprinos

Prijedlozi i ispravke su dobrodošli. Najviše trebaju šifre općina i
računi za ostale kantone, provjera stopa u službenom izvoru, i greške u
obrascu AMS-1035.

Prije nego išta napišete pročitajte [CONTRIBUTING.md](CONTRIBUTING.md).
Tu piše šta je najkorisnije, šta neće ući i kako se izmjena šalje.
Tehnički dio je u [RAZVOJ.md](RAZVOJ.md), a kako se ovdje razgovara u
[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Sigurnosna rupa ne ide u javni
issue, nego kako piše u [SECURITY.md](SECURITY.md).

## Autor

Emin Sivro, [LinkedIn](https://www.linkedin.com/in/eminsivro/).

Program je pisan uz pomoć AI-a. Ideja, odluke, provjera brojeva i
testiranje na vlastitim uplatama su moji.

## Licenca

Copyright © 2026 Emin Sivro. [GPL-3.0-or-later](LICENSE). Slobodno
koristite, mijenjajte i dijelite. Izmijenjene verzije moraju ostati pod
istom licencom i sa dostupnim izvornim kodom.

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

- Brojke se ne provjeravaju same. Stope, račune i šifre općina sam
  provjerio kod Porezne uprave 21.09.2026, ali propisi se mijenjaju.
  Izvori su u programu, pod `Pomoć → Službeni resursi`.
- Računi i šifre vrijede samo za Zeničko-dobojski kanton.
- Obračun ne pokriva olakšice, lične odbitke ni godišnju prijavu.
- Za autorske naknade zakon dopušta i stvarni iznos troškova umjesto
  30%. To program ne računa, jer traži dokumentovane troškove.
- Nema historije ranijih uplata.

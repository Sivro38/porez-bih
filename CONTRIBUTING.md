# Doprinos

Hvala što si svratio. Ovo je mali program koji održava jedan čovjek, pa
evo odmah šta je korisno, šta nije, i kako se izmjena šalje.

Naziv datoteke je engleski jer ga GitHub tako prepoznaje. Sve ostalo je
na bosanskom, kao i sam program.

## Prvo pravilo

**Ovdje su nečije pare.** Program ispisuje iznose koje čovjek zaista
uplati u banci. Svaka izmjena koja dira obračun, račune, šifre općina
ili sam obrazac mora imati izvor — član zakona, službeni obrazac,
objavu Porezne uprave — a ne „tako mi se čini”.

Napiši taj izvor u opisu izmjene. Bez njega je neću spojiti, pa makar
bila tačna.

## Šta najviše treba

- **Šifre općina i računi za ostale kantone.** Sad radi samo
  Zeničko-dobojski; `src/config.js` je složen tako da podnese više.
- **Provjera stopa u službenom izvoru.** Trenutne su sa dva nezavisna
  mjesta, ali ne iz Pravilnika.
- **Autorski honorar** — nosi 30% priznatih rashoda umjesto 20%, a
  prekidača za to nema. Poznata rupa, zapisana i u README-u.
- **Greške u obrascu AMS-1035**, pogotovo ako Porezna uprava izda novu
  verziju.
- **Pristupačnost** — kretanje tastaturom, čitači ekrana, kontrast.
- **Greške na telefonima** koje nemam pri ruci.

## Šta neće ući

- **Framework** (React, Vue, Svelte…). Odbijen namjerno; razlog je u
  README-u pod „Tehnički”.
- **Izmjena `src/styles.css`.** To je izvorni XP stil, prepisan
  doslovno. Novi stil ide u zaseban fajl koji se učitava poslije njega.
- **Analitika, kolačići, prijava, bilo šta što šalje podatke van
  browsera.** Nema servera i neće ga biti.
- **Preuređivanje izgleda** koje razbija Windows XP. To nije šala nego
  uslov zadatka.
- **Nova zavisnost** bez jakog razloga. Postojeće tri se učitavaju tek
  kad zatrebaju, da se stranica otvara odmah.
- **Refaktor radi refaktora** i preimenovanja kroz cijeli kod.

## Prije nego išta napišeš

Za sve veće od ispravke slovne greške — **otvori issue prvo.** Šteta je
da provedeš veče na nečemu što neću spojiti.

## Kako se izmjena šalje

1. Napravi fork i granu: `git checkout -b sifre-usk`
2. Uradi izmjenu. Držeći se `RAZVOJ.md`, pogotovo pet pravila na vrhu.
3. Provjeri da prolazi:

```bash
npm install
npm run build
diff <(sed -n '8,175p' arhiva/izvorna-verzija.html) src/styles.css
```

4. Otvori u browseru i **pogledaj svojim očima** ono što si dirao —
   i na uskom ekranu (ispod 760px) i na štampi (Ctrl+P, pregled).
5. Otvori pull request i opiši **šta** si promijenio i **zašto**, a za
   brojke i izvor.

Isti build pokreće se i automatski na svakom pull requestu.

## Kako izgleda kod

Drži se onoga oko sebe, ali ukratko:

- **Vanilla JavaScript**, ES moduli, bez build magije osim Vitea.
- **Nazivi i komentari su na bosanskom, bez dijakritike**
  (`napraviProzor`, `// Vidno polje ulazi u racun...`). Tekst koji
  korisnik vidi ide pun, sa č, ć, ž, š i đ.
- **Poruke commita na bosanskom, bez dijakritike**, jedna linija, šta
  je urađeno: `Skala prati prozor i na AMS-u`.
- Boje i mjere iz `src/tokens.css`, ne nove nijanse.
- Novac u feningima, cijelim brojevima. Zašto — `RAZVOJ.md`, pravilo 2.
- Dva razmaka za uvlaku, tačka-zarez na kraju naredbe, navodnici jednostruki.

## Šta možeš očekivati

Odgovoriću kad stignem, ne uvijek isti dan. Svaki pull request gledam
lično i spajam ga sam — i tvoj i svoj kod prolazi kroz isti pregled.

Ako nešto odbijem, napisaću zašto. To nije protiv tebe nego protiv
toga da program postane nešto drugo nego što jeste.

## Licenca

Slanjem izmjene pristaješ da ide pod **GPL-3.0-or-later**, isto kao i
ostatak. Autorstvo ostaje tvoje — GitHub ga bilježi u historiji.

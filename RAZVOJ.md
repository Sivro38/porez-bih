# Razvoj

Kako je program složen i šta treba znati prije nego se doda nešto novo.

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # dist/
```

Treba Node 18+. Vite je prikovan na 5, a `wrangler` na 3 — novije verzije
traže noviji Node nego što mašina na kojoj je ovo pisano ima.

Ovdje piše **kako je složeno**. Ako izmjenu šalješ nazad, proces je u
[CONTRIBUTING.md](CONTRIBUTING.md).

---

## Pravila koja se ne krše

Ovih pet stvari nisu stvar ukusa. Ako ih prekršiš, nešto se tiho pokvari.

### 1. `src/styles.css` se ne dira

To je izvorni stil, izvučen doslovno iz prve verzije programa. Cijeli XP
izgled visi o njemu. Svaki novi stil ide u **zaseban fajl**, koji se
učitava poslije njega i po potrebi ga nadjačava.

Provjera da je netaknut:

```bash
diff <(sed -n '8,175p' arhiva/izvorna-verzija.html) src/styles.css
```

`arhiva/izvorna-verzija.html` je originalna jednofajlna verzija programa
i stoji samo zbog ove provjere.

### 2. Novac se računa u feningima, cijelim brojevima

`src/calc.js` ne koristi decimale nigdje. Svaka stavka se zaokruži
odmah, a izvedene se dobijaju **oduzimanjem od već zaokruženih** — zato
tri uplatnice uvijek zbrajaju tačno na „Ukupno za uplatu”. Kanton nosi
ostatak zaokruživanja.

Da se računalo u decimalama, iznosi na papiru bi znali promašiti za
fening, a to se vidi tek kad novac ode.

### 3. Brojevi se formatiraju ručno

`src/format.js` ne koristi `toLocaleString`. Bosanski lokal nije pouzdan
između engina — isti poziv daje `3.399,44` u jednom a `3,399.44` u
drugom. Formatiranje je zato napisano ručno i deterministično je.

### 4. `src/config.js` je jedini izvor istine

Primaoci, računi, vrste prihoda, šifre općina i **zadane** stope stoje
samo tamo. Tabela obračuna, uplatnice, obrazac i uputstvo se svi izvode
iz njega, pa se ne mogu razići.

Ono što **trenutno vrijedi** (korisnik može promijeniti stope) čita se iz
`src/stope.js`, ne iz config.js. `REDOVI[].stopa` je zato **funkcija**
trenutnih stopa, a ne broj — broj zapečen pri učitavanju bi zastario čim
korisnik nešto promijeni.

### 5. Ništa ne napušta browser

Nema servera, nema analitike, nema kolačića. Svaki novi podatak ide u
`localStorage` pod prefiksom `porez.`, jer brisanje traži ključeve po tom
prefiksu (`src/brisanje.js`) — ključ bez njega ostane zaboravljen iza
„Obriši sve podatke”.

Ako se to ikad promijeni, **prvo** mora biti izmijenjen tekst u
`src/pravno.js`.

---

## Kako je složeno

```
index.html          kostur glavnog prozora, meni, veze na stilove
src/main.js         sve se spaja ovdje: prozori, meniji, prečice, traka

  temelj
    config.js       primaoci, računi, šifre, zadane stope, verzija
    stope.js        stope koje trenutno vrijede (+ izmjene korisnika)
    calc.js         obračun, u feningima
    format.js       brojevi u tekst, ručno
    storage.js      lični podaci u localStorage
    profili.js      tri mjesta za profile
    tabela.js       crtanje tabele obračuna
    ui.js           meniji i statusna traka

  prozorski sistem
    prozor.js       napraviProzor() — jedna komponenta za sve dijaloge
    drag.js         povlačenje za naslovnu traku
    resize.js       promjena veličine, sve ivice i uglovi
    skala.js        sadržaj prati veličinu prozora
    traka.js        donja traka; na telefonu i pokretač prozora
    precice.js      ikone na radnoj površini
    ikone.js        SVG ikone

  prozori
    podaci.js       Moji podaci + profili
    uplatniceProzor.js / uplatnice.js    tri naloga za uplatu
    ams.js          obrazac AMS-1035
    postavke.js     poreske stope
    uputstvo.js     ugrađena pomoć
    pravno.js       pravno i privatnost
    upozorenje.js   početno upozorenje
    brisanje.js     brisanje svih podataka

  izlaz
    ispis.js        štampanje sa vlastitim zaglavljem
    izvoz.js        PDF i Excel
    izvoz-podaci.js priprema podataka za izvoz, bez biblioteka
```

Stilovi prate isti raspored: `tokens.css` je paleta, `styles.css`
original, ostalo po prozorima. `mobilni.css`, `veliki.css` i `print.css`
se učitavaju posljednji jer nadjačavaju sve prethodno.

---

## Kako dodati novi prozor

1. Napravi `src/nesto.js` sa funkcijom koja vraća `napraviProzor({...})`.
2. Stil ide u `src/nesto.css`, boje iz `tokens.css`. Veza u `index.html`
   **prije** `mobilni.css`.
3. U `main.js`: napravi prozor uz ostale dijaloge, dodaj stavku menija u
   `index.html` i `case` u prekidaču.
4. Ako treba ikona na radnoj površini i pokretač na traci, dodaj je u
   `napraviPrecice([...])` i `traka.postaviPokretace([...])`.
5. Ako se sadržaj treba skalirati sa prozorom, `pratiSkalu(prozor, {...})`
   iz `skala.js`.

Nemodalan prozor (`modalno: false`) sam dobija dugme za minimiziranje i
mjesto na donjoj traci.

### Skaliranje ima dvije zamke

Obje su već plaćene na uplatnicama, pa ih `skala.js` izbjegava:

- Raspoloživa visina se **ne čita iz sadržaja**. Da se čita, promjena
  skale bi promijenila visinu, to bi promijenilo skalu, i tako u krug.
- Skala se stavlja na **unutrašnji omotač**, ne na element koji se mjeri.
  Inače mjerenje širine vrati već umanjenu vrijednost.

---

## Ispis

Tri stvari koje nisu očite:

**A4 je uži od praga za mobilni.** Papir sa marginama je oko 718 CSS
piksela, ispod 760px. Zato su **svi** naši upiti `@media screen and
(...)` — bez toga bi na papir otišao mobilni raspored.

**Chrome upisuje svoj naslov i adresu u margine stranice.** Iz CSS-a se
ne da ukloniti, ali nestaje kad je `@page { margin: 0 }` jer tada u
margini nema mjesta. Razmak do ivice dajemo sami, a u njega ide vlastito
zaglavlje iz `ispis.js`.

**Obrazac se ne prelama nego umanjuje.** Uplatnica je crtana za 900px i
u 718px se ne može rasporediti — kućice za račun ispadnu u drugi red.
Umjesto toga se skalira na 0,79.

---

## Provjere prije nego nešto pošalješ dalje

```bash
npm run build                                   # mora proći bez greške
diff <(sed -n '8,175p' arhiva/izvorna-verzija.html) src/styles.css
```

Izgled se provjerava **mjerenjem u browseru**, ne okom na slici. Alat za
snimanje ekrana zna zatajiti; `html2canvas` ne crta SVG pozadine, pa
dijagonale i slično na njegovim snimcima izgledaju kao da ih nema.

---

## Ako ovo hostuješ negdje drugdje

Četiri mjesta nose adresu `porez.pages.dev` i treba ih promijeniti:

| gdje | šta |
|---|---|
| `index.html` | `rel="canonical"` |
| `index.html` | `og:url` |
| `index.html` | `og:image` — mora biti puna adresa, relativna ne radi |
| `public/sitemap.xml` i `public/robots.txt` | adresa stranice |

Kanonska adresa nije ukras: Cloudflare svakom deployu daje svoju javno
dohvatljivu poddomenu sa istim sadržajem, pa ih pretraživač bez toga
indeksira kao duplikate.

Sve ostalo radi sa bilo koje adrese — `vite.config.js` gradi sa
relativnim putanjama, pa program radi i iz podfoldera i otvoren direktno
s diska.

---

## Odakle dolaze brojke

**Stope i računi** — javni izvori, nisu službeno potvrđeni. Stoji i u
README-u i u samom programu.

**Šifre općina** — dvije nezavisne liste koje se poklapaju, ne službeni
Pravilnik.

**Izgled obrasca AMS-1035** — iz službenog PDF-a Porezne uprave. Taj PDF
nije skeniran nego ima pravi tekst, pa se iz njega mogu izvući tačne
koordinate, veličine i fontovi. Papir je širok 770pt i u `ams.css` se
crta 1pt = 1px. **Ne procjenjuj taj raspored sa fotografije** — tako je
prvi put napravljen i bio je pogrešan u poravnanju, podebljanjima i
strukturi zaglavlja.

---

## Šta nije napravljeno

- Autorski honorar nosi 30% priznatih rashoda umjesto 20%; prekidača za
  to nema, pa je za taj slučaj rezultat pogrešan.
- Obračun ne pokriva olakšice, lične odbitke ni godišnju prijavu.
- Računi i šifre vrijede samo za Zeničko-dobojski kanton.
- `arhiva/` drži historiju uplata (napravljena pa izvučena) i izvornu
  jednofajlnu verziju. Ništa odatle se ne učitava — Vite pakuje samo ono
  što `src/main.js` dosegne. Vidi `arhiva/PROCITAJ.md`.

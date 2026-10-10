# Razvoj

Kako je program složen i šta treba znati prije nego se doda nešto novo.

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # dist/
```

Treba Node 18+, i na 18 se gradi provjera na GitHubu. Vite je na 5, a
`wrangler` na 3. Wrangler 4 traži Node 22, a Vite 7 Node 20.19, pa bi
prelazak značio i da se odustane od 18.

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

### 2. Novac se računa u feninzima, cijelim brojevima

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

Vrste prihoda, **zadane** stope i verzija stoje samo tamo. Računi i
šifre općina za svih deset kantona su podaci, pa stoje u
`src/kantoni.json`, ali ih ostatak programa dobija samo preko config.js
(`KANTONI`, `FEDERACIJA`, `primaoci(kanton)`). Tabela obračuna,
uplatnice, obrazac i uputstvo se svi izvode odatle, pa se ne mogu
razići.

`kantoni.json` se ne mijenja bez provjere kod izvora (vidi „Odakle
dolaze brojke”). Oblik i kontrolni broj svakog računa provjerava
`alati/provjeri-config.mjs`, i to na svakom pull requestu.

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
    config.js       vrste prihoda, zadane stope, verzija; izlaže kantone
    kantoni.json    računi i šifre općina, svih deset kantona (podaci)
    stope.js        stope koje trenutno vrijede (+ izmjene korisnika)
    calc.js         obračun, u feninzima
    godisnji.js     godišnji obračun za GPD-1051, bez DOM-a
    format.js       brojevi u tekst, ručno
    storage.js      lični podaci u localStorage; kanton ide iz općine
    profili.js      mjesta za profile (BROJ_MJESTA)
    tabela.js       crtanje tabele obračuna
    ui.js           meniji i statusna traka

  prozorski sistem
    prozor.js       napraviProzor() — jedna komponenta za sve dijaloge
    drag.js         povlačenje za naslovnu traku
    resize.js       promjena veličine, sve ivice i uglovi
    skala.js        sadržaj prati veličinu prozora (samo replike papira)
    traka.js        donja traka; na telefonu i pokretač prozora
    precice.js      ikone na radnoj površini, u mreži
    ikone.js        SVG ikone; jedinstvena() za kopije sa gradijentom
    balon.js        XP balon uz „i”, sa vezama u Pomoć i Pravno
    izvori.js       sitno „i” sa izvorom tvrdnje, bez veze

  prozori
    podaci.js       Moji podaci + profili
    uplatniceProzor.js / uplatnice.js    tri naloga za uplatu
    ams.js          obrazac AMS-1035
    godisnjiProzor.js / gpd.js           godišnja prijava GPD-1051
    postavke.js     poreske stope
    uputstvo.js     ugrađena pomoć
    pravno.js       pravno i privatnost
    resursi.js      veze na službene stranice
    novosti.js      „Šta je novo” po verzijama, i balon nove verzije
                    (nova verzija = novi unos u VERZIJE, prvi u spisku)
    biljeska.js     bilješka „Kako platiti”
    upozorenje.js   početno upozorenje
    brisanje.js     brisanje svih podataka

  generisano, ne dira se rukom
    ams-raspored.js iz službenog PDF-a AMS-1035 (alati/izvuci-ams.py)
    gpd-raspored.js iz službenog PDF-a GPD-1051 (alati/izvuci-gpd.py)

  izlaz
    ispis.js        štampanje sa vlastitim zaglavljem
    izvoz.js        PDF i Excel
    izvoz-podaci.js priprema podataka za izvoz, bez biblioteka

alati/
    provjeri-config.mjs     kontrolni brojevi računa, šifre, primaoci
    provjeri-godisnji.mjs   godišnji obračun na poznatim primjerima
    provjeri-racune.py      kantoni.json naspram Pravilnika (mreža)
    izvuci-ams.py, izvuci-gpd.py, favikone.py   generatori

.github/workflows/
    provjera.yml    build, provjere i styles.css, na svaki pull request
    racuni.yml      provjera računa prema Pravilniku, dvaput sedmično
    objava.yml      objava na Cloudflare, uz odobrenje vlasnika
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
5. Ako je sadržaj **replika papira** (uplatnica, obrazac) i treba da
   raste sa prozorom, `pratiSkalu(prozor, {...})` iz `skala.js`.
   Obična forma tamo **ne ide** — vidi zamku ispod.

Nemodalan prozor (`modalno: false`) sam dobija dugme za minimiziranje i
mjesto na donjoj traci.

### Skaliranje ima tri zamke

Sve tri su već plaćene, pa ih `skala.js` izbjegava:

- **Skala je samo za replike papira.** Uplatnica i obrazac imaju stalnu
  geometriju: polje je na papiru tu i toliko, i jedini način da se vide
  krupnije je da se uvećaju cijeli. Forma je nema — njoj širina treba da
  ode u polja, a slova da ostanu ista. Moji podaci su neko vrijeme
  stajali na `pratiSkalu` i širenje prozora je uvećavalo sve kao da se
  vuče iz ćoška; izvedeni su odatle i prepušteni običnom rasporedu.
  Krupnija slova na velikim ekranima rješava `veliki.css`, upitom o
  veličini ekrana, ne veličinom prozora.
- Raspoloživa visina se **ne čita iz sadržaja**. Da se čita, promjena
  skale bi promijenila visinu, to bi promijenilo skalu, i tako u krug.
- Skala se stavlja na **unutrašnji omotač**, ne na element koji se mjeri.
  Inače mjerenje širine vrati već umanjenu vrijednost.

---

## Slike za pull request

Stoje u `slike-za-pr/`, koji je van Gita. U njemu su **samo aktuelne**
slike — one koje tačno pokazuju kod kakav jeste sada.

Briše se odmah, bez pitanja: slike starijeg izgleda, duplikati, probni
snimci, i sve na čemu se vide pravi lični podaci. Za snimke idu
izmišljeni podaci (profil „Test", JMBG od trinaest jedinica).

Razlog: slika u pull requestu je tvrdnja o tome kako program izgleda, a
recenzent nema kako provjeriti je li zastarjela. Bolje nijedna slika
nego pogrešna.

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

## Dva repozitorija

Ovaj radni repozitorij je **izvor istine**. U njemu se radi i u njega
se spaja sve, pa i ono što neko pošalje kao pull request na javni.

Javni repozitorij je **izdanje** — ono što ljudi preuzimaju. Ne radi se
u njemu; on dobija gotove verzije odavde.

Paket se pravi iz Gita, ne ručno, pa ne može procuriti ništa interno:

```bash
git -c core.autocrlf=false archive HEAD | tar -x -C ../putanja/do/paketa
```

`.gitattributes` označava šta se preskače (`export-ignore`): interne
bilješke i sam `.gitattributes`. Ko doda novi interni fajl, neka ga
doda i tamo.

`core.autocrlf=false` nije ukras: bez njega `git archive` na Windowsu
pretvori sve u CRLF, pa javni repozitorij dobije CRLF u svakom fajlu.

### Kako izmjena stiže u javni repozitorij

Nikad direktno u `main`. Grana pa pull request, i kad si sam:

```bash
cd ../porez-objava/porez
git checkout -b sifre-usk
# izvoz iz radnog repoa, pa commit
git push -u origin sifre-usk
```

Na GitHubu `Compare & pull request`. Provjera se sama pokrene, ti
pregledaš izmjenu i spojiš sa `Squash and merge`. Jedan commit po
izmjeni.

Spajanje u `main` pokrene `objava.yml`, koji izgradi `dist` i pošalje ga
na Cloudflare Pages. Posao stoji dok ga vlasnik ne odobri u okruženju
`produkcija`, a tajne za Cloudflare postoje samo tamo. Zadnji korak
uporedi ime bundlea na sajtu sa onim iz builda, pa zeleno znači da je
nova verzija stvarno uživo. Zašto je to workflow a ne Cloudflareova
Git integracija, piše na vrhu tog fajla.

Grana se zove po onome što mijenja, malim slovima i bez dijakritike:
`sifre-usk`, `noscript`, `ams-koordinate`.

**Force push je izuzetak, ne alat.** Zaobilazi zaštitu grane, i push to
ispiše (`Bypassed rule violations`). Ima smisla samo kad se historija
mora prepisati, na primjer kad se sve sabija u jedan korijenski commit.
Za obične izmjene nikad.

Zato bypass lista treba ostati prazna, a odobrenja na nuli. Dok si sam
na projektu, odobrenje nema ko dati, pa bi pravilo koje ga traži samo
tjeralo na zaobilaženje. Provjera koja gradi projekat i mjeri
`styles.css` je stvarna kontrola; odobrenje samom sebi nije.

---

## Kako se pravi obrazac AMS-1035

Ne crta se rukom. `alati/izvuci-ams.py` skine službeni PDF, izvuče iz
njega svaku crticu, natpis, veličinu i rez fonta, i upiše to u
`src/ams-raspored.js`. `ams.js` onda crta po tim koordinatama, 1pt =
1px.

```bash
pip install pymupdf
python alati/izvuci-ams.py
```

`src/ams-raspored.js` je generisan — ne dira se rukom.

Prvi put je obrazac slagan CSS tokom i ispao je **667px visok umjesto
523**, sa obrnutim podebljanjima i osam kućica za datum umjesto šest.
Širina je slučajno bila tačna, pa se nije vidjelo da je promašeno.

Bosanska, hrvatska i srpska verzija obrasca su geometrijski identične —
isti okvir, istih 155 pravougaonika. Razlikuje se samo tekst.

### GPD-1051 na isti način

Godišnja prijava ima dvije stranice, pa ima i svoj alat:
`alati/izvuci-gpd.py` piše `src/gpd-raspored.js`. Podebljanje i kurziv
čita iz zastavica fonta, a ne iz imena, jer se u tom PDF-u svaki font
zove samo „Arial”. Svako
polje koje program popunjava (kućice za JMB i godinu, redovi 8–31,
kolone c i d) alat traži po mjestu i provjerava, pa padne glasno ako
Porezna izmijeni obrazac.

Stranica je 595 × 842 pt. Na ekranu se crta 1pt = 1px, a na papiru se
uveća 4/3, koliko treba da tačno popuni A4 (`print.css`, dio GPD).

Obračun je odvojen od prozora, u `src/godisnji.js`, bez DOM-a i
`localStorage`, pa ga `alati/provjeri-godisnji.mjs` provjerava u Node-u
na poznatim primjerima.

---

## Provjere prije nego nešto pošalješ dalje

```bash
npm run build                                   # mora proći bez greške
diff <(sed -n '8,175p' arhiva/izvorna-verzija.html) src/styles.css
node alati/provjeri-config.mjs                  # računi, šifre, primaoci
node alati/provjeri-godisnji.mjs                # godišnji obračun
```

Isto to radi `provjera.yml` na svakom pull requestu. Ako si dirao
`kantoni.json`, pokreni i poređenje sa Pravilnikom (treba `pip install
pymupdf` i mrežu):

```bash
python alati/provjeri-racune.py
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

Peto mjesto nosi adresu samog **repozitorija**, ne stranice:
`.github/ISSUE_TEMPLATE/config.yml` upućuje na Discussions ovog projekta.

`objava.yml` nosi i jedno i drugo: ime repozitorija u uslovu `if`,
Cloudflare projekat `porez` i adresu za provjeru uživo. U forku se taj
posao zato ni ne pokreće.

Sve ostalo radi sa bilo koje adrese — `vite.config.js` gradi sa
relativnim putanjama, pa program radi i iz podfoldera i otvoren direktno
s diska.

---

## Odakle dolaze brojke

Stope su provjerene kod Porezne uprave FBiH **21.09.2026**, a računi i
šifre općina **05.10.2026**. Sajt Porezne je Angular i običnim dohvatom
vrati praznu ljusku. Sadržaj stiže kroz API putanje ispod, pa se
provjera da ponoviti i bez browsera.

**Stope** — [pufbih.ba/freelanceri](https://pufbih.ba/freelanceri):
porez 10%, zdravstveno 4%, priznati rashodi 20% — a **30% za autorske
naknade**, koje se biraju u glavnom prozoru, pored kantona.

**Uplatni računi** — iz Pravilnika o načinu uplate, pripadnosti i
raspodjele javnih prihoda u FBiH, prečišćen tekst sa izmjenom 48/26.
Budžeti kantona su u tački 12.1.2, zavodi zdravstvenog osiguranja u
12.1.4. PDF i spisak svih izmjena daje `pufbih.ba/api/regulations`.

Stranica „Uplatni računi” (`pufbih.ba/api/pages`, slug
`uplatni-racuni`) kasni za Pravilnikom: 05.10. je za zavod u
Hercegovačko-neretvanskom kantonu još imala stari račun. Zato je izvor
Pravilnik, a stranica samo druga provjera. Račune piše sa crticama, pa
ih pretraga po šesnaest cifara ne nalazi; skini crtice prije poređenja.

**Šifre općina** — tabela 12.2 istog Pravilnika, i
`pufbih.ba/api/municipality`. Ima ih 79 u deset kantona. Gdje Pravilnik
piše naziv drugačije nego općina sama (na primjer „Dobrezići” umjesto
Dobretići), `kantoni.json` čuva oba, u poljima `naziv` i `pravilnik`.

Izmjene računa izlaze četiri puta godišnje, u januaru, aprilu, julu i
oktobru. Tako od izmjene 48/26 piše u samom Pravilniku, tačke 11.2.1 do
11.2.4.

**Provjera se ponavlja sama.** `racuni.yml` dvaput sedmično pokrene
`alati/provjeri-racune.py`, koji poredi `kantoni.json` sa najnovijim
Pravilnikom: nove izmjene, svaki račun, i šifre kanton po kanton. Kad se
nešto razlikuje, otvori issue. Sam ništa ne mijenja, jer novi račun mora
potvrditi čovjek. Kad se izmjena pročita, njen broj ide u
`zadnjaIzmjena` u `kantoni.json`.

**Registar obrazaca** — `pufbih.ba/api/obrasci`. AMS-1035 i GPD-1051
stoje pod tim šiframa, svaki sa bosanskom, hrvatskom i srpskom verzijom
PDF-a.

**Izgled obrasca AMS-1035** — iz službenog PDF-a Porezne uprave. Taj PDF
nije skeniran nego ima pravi tekst, pa se iz njega mogu izvući tačne
koordinate, veličine i fontovi. Papir je širok 770pt i u `ams.css` se
crta 1pt = 1px. **Ne procjenjuj taj raspored sa fotografije** — tako je
prvi put napravljen i bio je pogrešan u poravnanju, podebljanjima i
strukturi zaglavlja.

---

## Šta nije napravljeno

- Za autorske naknade zakon dopušta i stvarne troškove umjesto 30%.
  To program ne računa, jer traži dokumentovane troškove.
- Mjesečni obračun ne pokriva olakšice. Godišnja prijava računa lični
  odbitak, a troškove liječenja, kamatu na stambeni kredit i slično
  samo prima ručno, bez ikakve provjere.
- Da porez plaćen uz AMS-1035 ide u red 29 obrasca GPD-1051, zaključeno
  je iz obrasca i propisa. Službenu potvrdu nismo našli.
- Samo Federacija BiH. Republika Srpska i Brčko distrikt imaju svoje
  propise, račune i obrasce.
- `arhiva/` drži historiju uplata (napravljena pa izvučena) i izvornu
  jednofajlnu verziju. Ništa odatle se ne učitava — Vite pakuje samo ono
  što `src/main.js` dosegne. Vidi `arhiva/PROCITAJ.md`.

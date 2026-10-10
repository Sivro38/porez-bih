/**
 * Jedini izvor istine za stope i primaoce.
 *
 * I tabela obracuna (ukljucujuci % kolonu) i uplatnice se generisu iz
 * ovoga - stope nisu nigdje drugdje upisane, pa ne mogu razici.
 *
 * Racuni i sifre opcina za svih deset kantona stoje u kantoni.json, kao
 * podaci, a ne kao kod: tako ih citaju i program i alati za provjeru
 * (alati/provjeri-config.mjs, alati/provjeri-racune.py). Stope vaze za
 * cijelu Federaciju. Prije stvarne uplate sve provjeriti kod izvora.
 */

// `with { type: 'json' }` treba Node-u (testovi i alati uvoze config.js);
// Vite ga razumije isto.
import KANTONI_PODACI from './kantoni.json' with { type: 'json' };

/** Verzija programa — pise na radnoj povrsini i u "O programu". */
export const VERZIJA = '1.2';

/**
 * Zadane stope. Korisnik ih moze promijeniti u "Postavke poreske stope";
 * ono sto trenutno vazi cita se iz stope.js, ne odavde.
 */
export const STOPE = {
  rashodi:    0.20,   // priznati rashodi, povremena samostalna djelatnost
  rashodiAutorski: 0.30,  // priznati rashodi, autorska naknada
  doprinosi:  0.04,   // doprinosi, udio u osnovici za doprinose
  federacija: 0.102,  // udio Federacije u doprinosima
  kanton:     0.898,  // udio Kantona u doprinosima (nosi ostatak zaokruzivanja)
  porez:      0.10,   // porez na dohodak, udio u osnovici poreza
};

/**
 * Vrste prihoda. Razlikuju se samo po priznatim rashodima.
 *
 * Zakon o porezu na dohodak FBiH, clan 15:
 *   stav 7 — 20% za dohodak od povremene samostalne djelatnosti
 *   stav 8 — 30% za autorske naknade, ILI stvarni iznos troskova
 *
 * Stvarni iznos program ne racuna: trazi dokumentovane troskove, pa
 * ko ide tim putem racuna sam.
 *
 * `stopa` je naziv polja u STOPE, ne broj: korisnik oba postotka
 * moze mijenjati u postavkama, pa se cita u trenutku obracuna.
 */
export const VRSTE_PRIHODA = [
  {
    key: 'povremena',
    label: 'Povremena samostalna djelatnost',
    // kratko: natpis uz radio dugme u glavnom prozoru, gdje je pola sirine
    kratko: 'Povremena djelatnost',
    opis: 'programiranje, dizajn, prevod, konsalting, novinarstvo…',
    stopa: 'rashodi',
  },
  {
    key: 'autorska',
    label: 'Autorska naknada',
    kratko: 'Autorska naknada',
    opis: 'honorar za autorsko djelo — tekst, muzika, licenca',
    stopa: 'rashodiAutorski',
  },
];

/** Vrsta koja se nudi dok korisnik ne izabere drugu. */
export const ZADANA_VRSTA = 'povremena';

/* ------------------------------------------------------------------ */
/* Kantoni, racuni i opcine                                            */
/* ------------------------------------------------------------------ */

/*
 * IZVOR: Pravilnik o nacinu uplate, pripadnosti i raspodjele javnih
 * prihoda u FBiH, preciscen tekst do SN 48/26 — tabele 12.1.2 (budzeti
 * kantona), 12.1.4 (zavodi zdravstvenog osiguranja) i 12.2 (sifre
 * opcina). Pravilnik je mjerodavan, a ne web stranica Porezne: za zavod
 * HNK stranica je 05.10.2026 jos pokazivala racun koji je izmjena 74/25
 * zamijenila.
 *
 * Nazivi zavoda su onako kako se sami zovu (njihovi sajtovi, za SBK
 * statut), pa nisu jednoobrazni. Nazivi opcina su iz Pravilnika, osim
 * sedam koji su ispravljeni po nezavisnoj listi FMF (Uputa, SN 75/24):
 * u kantoni.json takva opcina nosi i `pravilnik`, naziv kako ga pise
 * tabela sifri, da alat za provjeru zna sta da trazi.
 */

/** Datum zadnje provjere racuna i sifri kod izvora (GGGG-MM-DD). */
export const RACUNI_PROVJERENO = KANTONI_PODACI.provjereno;
/** Veza na preciscen Pravilnik iz kojeg su racuni i sifre. */
export const RACUNI_IZVOR = KANTONI_PODACI.izvor;

/** Primalac 10,2% doprinosa — isti za sve kantone (Pravilnik, 6.1.4). */
export const FEDERACIJA = KANTONI_PODACI.federacija;

/*
 * Opcine se slazu abecedno, kako ih covjek trazi u spisku. U JSON-u
 * stoje redom kao u Pravilniku, da se lakse uporede sa izvorom.
 */
export const KANTONI = KANTONI_PODACI.kantoni.map(k => ({
  ...k,
  opcine: [...k.opcine].sort((a, b) => a.naziv.localeCompare(b.naziv, 'bs')),
}));

/** Kanton koji se nudi dok korisnik ne izabere drugi. */
export const ZADANI_KANTON = 'zdk';

const PO_KLJUCU = new Map(KANTONI.map(k => [k.key, k]));
const PO_SIFRI = new Map(KANTONI.flatMap(k => k.opcine.map(o => [o.sifra, { k, o }])));

/** Kanton po kljucu; nepoznat kljuc vraca zadani, da program uvijek ima racune. */
export const kantonPoKljucu = key => PO_KLJUCU.get(key) || PO_KLJUCU.get(ZADANI_KANTON);

/**
 * Kanton kojem opcina pripada, ili null. Sifre su jedinstvene u cijeloj
 * Federaciji (79 od 79), pa je odgovor uvijek jednoznacan.
 */
export const kantonOpcine = sifra => PO_SIFRI.get(sifra)?.k || null;

/** Zapis opcine ({naziv, sifra, mjesto?}) po sifri, ili null. */
export const opcinaPoSifri = sifra => PO_SIFRI.get(sifra)?.o || null;

/** Zadana opcina: sjediste zadanog kantona (Zenica). */
export const ZADANA_OPCINA = kantonPoKljucu(ZADANI_KANTON).zadanaOpcina;

/* Vrste prihoda — Pravilnik, tacka 3.3.2 rbr. 6 i tacka 6.1.2 rbr. 6.
   Iste su za sve kantone. */
const VRSTA_DOPRINOS = '712116';  // doprinos za zdravstveno, druga samostalna djelatnost
const VRSTA_POREZ = '716116';     // porez na dohodak od drugih samostalnih djelatnosti

const SVRHA_DOPRINOS = ['Doprinos za zdravstveno osiguranje', 'po osnovu druge samostalne djelatnosti'];

/**
 * Primaoci uplata za dati kanton - jedan unos = jedna uplatnica.
 *
 * `primalac` i `svrha` su nizovi redova, ne stringovi: obrazac ima po
 * tri linije za svako od njih upravo zato sto dug tekst ne stane u
 * jednu. Pun tekst je spoj tih redova (vidi punNaziv i punaSvrha), pa
 * se to dvoje ne moze razici.
 *
 * Druga uplatnica ide na racun Zavoda zdravstvenog osiguranja i
 * reosiguranja FBiH; Fond solidarnosti je namjena i stoji u natpisu iznad
 * uplatnice, a na papir ide vlasnik racuna.
 *
 * @param {Object} kanton zapis iz KANTONI
 */
export function primaoci(kanton) {
  return [
    {
      key: 'kanton',
      caption: '1. Doprinos — Kanton (' + kanton.zavod.kratko + ')',
      svrha: SVRHA_DOPRINOS,
      primalac: kanton.zavod.primalac,
      acc: kanton.zavod.acc,
      banka: kanton.zavod.banka,
      vrsta: VRSTA_DOPRINOS,
    },
    {
      key: 'federacija',
      caption: '2. Doprinos — Federacija (' + FEDERACIJA.kratko + ')',
      svrha: SVRHA_DOPRINOS,
      primalac: FEDERACIJA.primalac,
      acc: FEDERACIJA.acc,
      banka: FEDERACIJA.banka,
      vrsta: VRSTA_DOPRINOS,
    },
    {
      key: 'porez',
      caption: '3. Porez na dohodak (' + kanton.budzet.primalac.join(' ') + ')',
      svrha: ['Porez na dohodak', 'od druge samostalne djelatnosti'],
      primalac: kanton.budzet.primalac,
      acc: kanton.budzet.acc,
      banka: kanton.budzet.banka,
      vrsta: VRSTA_POREZ,
    },
  ];
}

/**
 * Racun kako ga pise Pravilnik: 3-3-7-3 ("134-010-0000002-157"), da se
 * lakse uporedi sa izvorom.
 */
export const racunKaoUPravilniku = acc =>
  acc.slice(0, 3) + '-' + acc.slice(3, 6) + '-' + acc.slice(6, 13) + '-' + acc.slice(13);

/* Sazetak za telefon, izvozi i uputstvo trebaju tekst u jednom redu. */

/** Pun naziv primaoca. */
export const punNaziv = p => p.primalac.join(' ');

/** Puna svrha uplate. */
export const punaSvrha = p => p.svrha.join(' ');

/**
 * Redovi tabele obracuna. `stopa` je funkcija trenutnih stopa i vraca
 * stopu primijenjenu na prethodnu osnovicu (kako se lanac i cita), ne
 * udio u ukupnoj osnovici. Funkcija, a ne broj, jer korisnik stope moze
 * promijeniti — vrijednost zapecena pri ucitavanju bi zastarjela.
 * `stopa: null` znaci da se postotak racuna iz samog obracuna.
 */
export const REDOVI = [
  { id:'osnovica',  naziv:'Osnovica (ukupan prihod)',      stopa:() => 1,           klasa:'xp-highlight' },
  { id:'rashodi',   naziv:'Rashodi',                        stopa:s => s.rashodi },
  { id:'osnDopr',   naziv:'Osnovica za obračun doprinosa',  stopa:s => 1 - s.rashodi },
  { id:'doprinosi', naziv:'Doprinosi',                      stopa:s => s.doprinosi },
  { sekcija:'Raspodjela doprinosa' },
  { id:'kanton',     naziv:'Kanton',                        stopa:s => s.kanton },
  { id:'federacija', naziv:'Federacija',                    stopa:s => s.federacija },
  { sekcija:'Porez na dohodak' },
  { id:'osnPoreza', naziv:'Osnovica poreza na dohodak',     stopa:s => 1 - s.doprinosi },
  { id:'porez',     naziv:'Porez',                          stopa:s => s.porez },
  { id:'ukupno',    naziv:'Ukupno za uplatu',               stopa:null, klasa:'xp-total' },
  { id:'neto',      naziv:'Ukupno za zadržat',              stopa:null, klasa:'xp-net' },
];

/**
 * Polja koja su uvijek ista na nalogu. Ispisuju se tamnocrveno.
 * Ako ikad zatreba pravi poziv na broj, vratiti ih u POLJA u storage.js.
 *
 * Vrsta uplate: Pravilnik, tacka 10.2 polje 10, trazi broj, a 0 je
 * redovna uplata. Mnoge banke prazno polje prihvate i same podrazumijevaju
 * nulu, ali upisana nula je ono sto propis kaze.
 */
export const FIKSNE_NULE = {
  vrstaUplate: '0',         // 1 cifra, 0 = redovna
  poziv: '0000000000',      // 10 cifara
  organizacija: '0000000',  // 7 cifara
};

/**
 * Zadana osnovica pri prvom otvaranju i za "Uredi > Vrati na...".
 * Iz nje se izvodi i tekst te stavke u meniju, pa ne mogu razici.
 */
export const ZADANA_OSNOVICA = '1000';

/** Kljuc pod kojim se tekuci licni podaci cuvaju u localStorage. */
export const STORAGE_KEY = 'porez.podaci.v1';

/** Stari kljuc profila (imenovana lista) — cita se samo radi prenosa. */
export const PROFILI_KEY = 'porez.profili.v1';

/** Kljuc pod kojim se cuvaju mjesta za profile. */
export const PROFILI_KEY_V2 = 'porez.profili.v2';

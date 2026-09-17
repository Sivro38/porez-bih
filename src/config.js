/**
 * Jedini izvor istine za stope i primaoce.
 *
 * I tabela obracuna (ukljucujuci % kolonu) i uplatnice se generisu iz
 * ovoga - stope nisu nigdje drugdje upisane, pa ne mogu razici.
 *
 * NAPOMENA: stope i racuni vaze za Zenicko-dobojski kanton. Prije
 * upotrebe za stvarne uplate provjeriti da su i dalje aktuelni.
 */

/** Verzija programa — pise na radnoj povrsini i u "O programu". */
export const VERZIJA = '1.0';

/**
 * Zadane stope. Korisnik ih moze promijeniti u "Postavke poreske stope";
 * ono sto trenutno vazi cita se iz stope.js, ne odavde.
 */
export const STOPE = {
  rashodi:    0.20,   // priznati rashodi, udio u osnovici
  doprinosi:  0.04,   // doprinosi, udio u osnovici za doprinose
  federacija: 0.102,  // udio Federacije u doprinosima
  kanton:     0.898,  // udio Kantona u doprinosima (nosi ostatak zaokruzivanja)
  porez:      0.10,   // porez na dohodak, udio u osnovici poreza
};

/**
 * Primaoci uplata - jedan unos = jedna uplatnica.
 *
 * Nazivi su puni i zvanicni, ne skraceni:
 *   - "Zavod zdravstvenog osiguranja Zenicko-dobojskog kantona" -
 *     registar akta.ba i sajt ustanove (zzozedo.ba).
 *   - "Fond solidarnosti Federacije Bosne i Hercegovine" - zzofbih.ba,
 *     fondom upravlja Zavod zdravstvenog osiguranja i reosiguranja FBiH.
 *   - "Budzet Zenicko-dobojskog kantona" - zdk.ba.
 *
 * Pravopis: u viseclanim nazivima ustanova veliko slovo nosi samo prva
 * rijec i vlastita imena u njoj. Otuda "Zenicko-dobojskog kantona" -
 * veliko Z jer je dio vlastitog imena kantona, malo d iza crtice (oba
 * dijela su izvedena od imena mjesta, ali se pise samo prvo veliko), i
 * malo k u "kantona" jer je opsta imenica u nazivu.
 *
 * `primalac` i `svrha` su nizovi redova, ne stringovi: obrazac ima po
 * tri linije za svako od njih upravo zato sto dug tekst ne stane u
 * jednu. Pun tekst je spoj tih redova (vidi punNaziv i punaSvrha), pa
 * se to dvoje ne moze razici.
 */
export const PRIMAOCI = [
  {
    key: 'kanton',
    caption: '1. Doprinos — Kanton (Zavod zdravstvenog osiguranja ZDK)',
    svrha: ['Doprinos za zdravstveno osiguranje', 'po osnovu druge samostalne djelatnosti'],
    primalac: ['Zavod zdravstvenog osiguranja', 'Zeničko-dobojskog kantona'],
    acc: '1340100000002157',
    vrsta: '712116',
  },
  {
    key: 'federacija',
    caption: '2. Doprinos — Federacija (Fond solidarnosti FBiH)',
    svrha: ['Doprinos za zdravstveno osiguranje', 'po osnovu druge samostalne djelatnosti'],
    primalac: ['Fond solidarnosti Federacije', 'Bosne i Hercegovine'],
    acc: '1020500000640018',
    vrsta: '712116',
  },
  {
    key: 'porez',
    caption: '3. Porez na dohodak (Budžet Zeničko-dobojskog kantona)',
    svrha: ['Porez na dohodak', 'od druge samostalne djelatnosti'],
    primalac: ['Budžet Zeničko-dobojskog kantona'],
    acc: '1340100000001672',
    vrsta: '716116',
  },
];

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
 * Polja koja su uvijek nule na nalogu. Ispisuju se crveno.
 * Ako ikad zatreba pravi poziv na broj, vratiti ih u POLJA u storage.js.
 */
export const FIKSNE_NULE = {
  poziv: '0000000000',      // 10 cifara
  organizacija: '0000000',  // 7 cifara
};

/**
 * Sifre opcina Zenicko-dobojskog kantona (polje 14 na nalogu).
 *
 * IZVOR: bih-pravo.org i poreznikalkulator.ba - dvije nezavisne liste
 * koje se u potpunosti poklapaju. Nisu preuzete iz sluzbenog Pravilnika
 * (PUFBiH PDF nije dao prilog sa sifrarnikom), pa ih prije stvarne
 * uplate provjeriti kod svoje banke ili Porezne uprave.
 */
export const OPCINE_ZEDO = [
  { naziv: 'Zenica',     sifra: '103' },
  { naziv: 'Zavidovići', sifra: '102' },
  { naziv: 'Žepče',      sifra: '105' },
  { naziv: 'Maglaj',     sifra: '060' },
  { naziv: 'Tešanj',     sifra: '090' },
  { naziv: 'Usora',      sifra: '025' },
  { naziv: 'Doboj Jug',  sifra: '132' },
  { naziv: 'Kakanj',     sifra: '043' },
  { naziv: 'Vareš',      sifra: '096' },
  { naziv: 'Visoko',     sifra: '098' },
  { naziv: 'Breza',      sifra: '016' },
  { naziv: 'Olovo',      sifra: '067' },
];

/** Zadana opcina (Zenica). */
export const ZADANA_OPCINA = '103';

/**
 * Zadana osnovica pri prvom otvaranju i za "Uredi > Vrati na...".
 * Iz nje se izvodi i tekst te stavke u meniju, pa ne mogu razici.
 */
export const ZADANA_OSNOVICA = '1000';

/** Kljuc pod kojim se tekuci licni podaci cuvaju u localStorage. */
export const STORAGE_KEY = 'porez.podaci.v1';

/** Stari kljuc profila (imenovana lista) — cita se samo radi prenosa. */
export const PROFILI_KEY = 'porez.profili.v1';

/** Kljuc pod kojim se cuvaju tri mjesta za profile. */
export const PROFILI_KEY_V2 = 'porez.profili.v2';

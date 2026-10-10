#!/usr/bin/env node
/*
 * Provjera podataka o kantonima (src/kantoni.json), bez mreze.
 *
 * Trci i na GitHubu, u istom poslu kao build (.github/workflows/provjera.yml),
 * pa pull request sa racunom koji ne prolazi kontrolni broj, ili sa
 * dvostrukom sifrom opcine, ne moze postati zelen.
 *
 * Ovo NE provjerava da li je racun i dalje vazeci — to radi
 * alati/provjeri-racune.py, koji poredi sa samim Pravilnikom. Ovo hvata
 * ono sto se desi pri kucanju: cifra viska, zamijenjene cifre, prazan
 * naziv, opcina u dva kantona.
 *
 * Pokretanje:   node alati/provjeri-config.mjs
 */

import { readFileSync } from 'node:fs';

const put = new URL('../src/kantoni.json', import.meta.url);
const podaci = JSON.parse(readFileSync(put, 'utf8'));
const greske = [];
const greska = poruka => greske.push(poruka);

/*
 * Kontrolni broj racuna u BiH: ISO 7064, MOD 97-10 nad prvih 14 cifara.
 * Ista provjera odbija stari pogresni racun 1020500000640018 koji je
 * jednom vec bio na uplatnici.
 */
function kontrolniBrojOk(racun) {
  if (!/^\d{16}$/.test(racun)) return false;
  const ostatak = (BigInt(racun.slice(0, 14)) * 100n) % 97n;
  return 98n - ostatak === BigInt(racun.slice(14));
}

function provjeriPrimaoca(gdje, p) {
  if (!kontrolniBrojOk(p.acc)) greska(`${gdje}: racun ${p.acc} ne prolazi kontrolni broj`);
  const redovi = p.primalac;
  if (!Array.isArray(redovi) || redovi.length < 1 || redovi.length > 3) {
    greska(`${gdje}: primalac mora imati 1 do 3 reda (obrazac ima tri linije)`);
  } else if (redovi.some(r => typeof r !== 'string' || !r.trim())) {
    greska(`${gdje}: prazan red u nazivu primaoca`);
  }
}

// Samoprovjera: poznati pogresni racun mora pasti, poznati ispravan proci.
if (kontrolniBrojOk('1020500000640018') || !kontrolniBrojOk('1020500000064018')) {
  greska('provjera kontrolnog broja je pokvarena');
}

if (!/^\d{4}-\d{2}-\d{2}$/.test(podaci.provjereno || '')) greska('nedostaje datum provjere (provjereno)');
if (!/^https:\/\//.test(podaci.izvor || '')) greska('nedostaje veza na izvor (izvor)');

provjeriPrimaoca('federacija', podaci.federacija);

const kantoni = podaci.kantoni || [];
if (kantoni.length !== 10) greska(`kantona je ${kantoni.length}, a Federacija ih ima 10`);

const kljucevi = new Set();
const sifre = new Map();
kantoni.forEach((k, i) => {
  const gdje = k.key || `kanton #${i + 1}`;
  if (!k.key || kljucevi.has(k.key)) greska(`${gdje}: kljuc nedostaje ili se ponavlja`);
  kljucevi.add(k.key);
  if (k.rb !== i + 1) greska(`${gdje}: redni broj ${k.rb}, a po redu je ${i + 1}`);
  if (!k.naziv || !k.kratko) greska(`${gdje}: nedostaje naziv`);
  provjeriPrimaoca(`${gdje} budzet`, k.budzet);
  provjeriPrimaoca(`${gdje} zavod`, k.zavod);
  if (!k.zavod.kratko) greska(`${gdje}: zavod nema skraceni naziv`);

  const opcine = k.opcine || [];
  if (!opcine.length) greska(`${gdje}: nema opcina`);
  opcine.forEach(o => {
    if (!/^\d{3}$/.test(o.sifra)) greska(`${gdje}: sifra "${o.sifra}" nije tri cifre`);
    if (!o.naziv || !o.naziv.trim()) greska(`${gdje}: opcina ${o.sifra} bez naziva`);
    if (sifre.has(o.sifra)) greska(`sifra ${o.sifra} je i u ${sifre.get(o.sifra)} i u ${gdje}`);
    sifre.set(o.sifra, gdje);
  });
  if (!opcine.some(o => o.sifra === k.zadanaOpcina)) {
    greska(`${gdje}: zadana opcina ${k.zadanaOpcina} nije u spisku kantona`);
  }
});

if (sifre.size !== 79) greska(`opcina je ${sifre.size}, a Pravilnik ih ima 79`);

if (greske.length) {
  console.error('kantoni.json NIJE ispravan:');
  greske.forEach(g => console.error('  - ' + g));
  process.exit(1);
}
console.log(`kantoni.json ispravan: ${kantoni.length} kantona, ${sifre.size} opcina, `
  + `${kantoni.length * 2 + 1} racuna prolazi kontrolni broj (provjereno ${podaci.provjereno}).`);

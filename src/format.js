/**
 * Formatiranje brojeva u bosanskom formatu: 1.234,56
 *
 * NE koristi toLocaleString('bs-BA'). Ta lokalizacija daje razlicite
 * rezultate po okruzenju - u Chromeu vraca "3,399.44" (americki format),
 * a u Node-u "3.399,44". Za iznose koji idu na uplatnicu to je
 * neprihvatljivo, pa se format ispisuje rucno i deterministicki.
 */

/** 1234567 -> "1.234.567" */
function grupisi(cijeli) {
  return String(cijeli).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Feninge -> "1.234,56".
 * Racuna se cijelobrojno, bez float aritmetike.
 */
export function fmt(fening) {
  const negativan = fening < 0;
  const a = Math.abs(Math.round(fening));
  const cijeli = grupisi(Math.floor(a / 100));
  const decimale = String(a % 100).padStart(2, '0');
  return (negativan ? '-' : '') + cijeli + ',' + decimale;
}

/** Broj -> "1.234,56" sa zadanim brojem decimala. */
export function fmtBroj(n, decimala = 2) {
  const negativan = n < 0;
  const faktor = 10 ** decimala;
  const zaokruzeno = Math.round(Math.abs(n) * faktor);
  const cijeli = grupisi(Math.floor(zaokruzeno / faktor));
  if (decimala === 0) return (negativan ? '-' : '') + cijeli;
  const ostatak = String(zaokruzeno % faktor).padStart(decimala, '0');
  return (negativan ? '-' : '') + cijeli + ',' + ostatak;
}

/** Broj (npr. 10.88) -> "10,88%" */
export function fmtPct(n) {
  return fmtBroj(n, 2) + '%';
}

/**
 * Tekst iz polja -> broj.
 *
 * Ljudi pisu iznose na sve nacine: "1.000,50", "1,000.50", "1000.00",
 * "1 234,5 KM". Pravilo koje to razrjesava je jednostavno: ako su u
 * broju i tacka i zarez, DECIMALNI je onaj koji dolazi POSLJEDNJI, a
 * drugi je razdjelnik hiljada.
 *
 * Kad je razdjelnik samo jedne vrste:
 *   - pojavi se vise puta        -> hiljade   (1.000.000)
 *   - iza njega su tacno 3 cifre -> hiljade   (1.000 i 1,000 su hiljada)
 *   - inace                      -> decimalni (1,5 i 1.50)
 *
 * Tri cifre iza zareza se citaju kao hiljade jer u iznosu novca stoje
 * najvise dvije; ko misli 1 KM i nesto, napise "1,00", ne "1,000".
 *
 * Sve sto nije cifra, razdjelnik ili minus se odbacuje, pa prolazi i
 * "1.234,50 KM" i iznos sa razmakom ili tvrdim razmakom.
 */
export function parseInput(v) {
  if (v === null || v === undefined) return 0;

  // Samo cifre, razdjelnici i vodeci minus; ostalo (KM, razmaci, slova) ispada.
  let s = String(v).replace(/[^\d.,-]/g, '');
  const negativan = s.startsWith('-');
  s = s.replace(/-/g, '');
  if (!s) return 0;

  const zadnjaTacka = s.lastIndexOf('.');
  const zadnjiZarez = s.lastIndexOf(',');

  let decimalni = '';
  if (zadnjaTacka !== -1 && zadnjiZarez !== -1) {
    decimalni = zadnjaTacka > zadnjiZarez ? '.' : ',';
  } else if (zadnjaTacka !== -1 || zadnjiZarez !== -1) {
    const znak = zadnjaTacka !== -1 ? '.' : ',';
    const koliko = s.split(znak).length - 1;
    const iza = s.length - s.lastIndexOf(znak) - 1;
    if (koliko === 1 && iza !== 3) decimalni = znak;
  }

  if (decimalni) {
    const rez = s.lastIndexOf(decimalni);
    s = s.slice(0, rez).replace(/[.,]/g, '') + '.' + s.slice(rez + 1).replace(/[.,]/g, '');
  } else {
    s = s.replace(/[.,]/g, '');
  }

  const n = parseFloat(s);
  if (!isFinite(n)) return 0;
  return negativan ? -n : n;
}

import { obracun } from './calc.js';
import { stope } from './stope.js';
import { parseInput } from './format.js';

/**
 * Godisnja prijava poreza na dohodak (obrazac GPD-1051) — obracun.
 *
 * Cista logika: bez DOM-a i bez localStorage, pa se moze provjeriti u
 * Node-u. Prozor (godisnjiProzor.js) samo skuplja unos i pokazuje ovo.
 *
 * STA PROPISI KAZU (provjereno 05.10.2026):
 *  - Prijava se predaje do 31. marta za prethodnu godinu (Pravilnik o
 *    primjeni Zakona o porezu na dohodak, clan 75.).
 *  - Freelancer je mora predati: akontacija uz AMS-1035 nije konacan
 *    porez (clan 74. nabraja kad jeste, a ovo nije na spisku).
 *  - Red 13 je "osnovica za porez" svake uplate — prihod minus priznati
 *    rashodi minus 4% zdravstvenog. Obrazac ga veze za kolonu 13
 *    obrasca AUG-1031, a ta kolona je bas to; ista formula je u clanu 57.
 *    stav 3. Pravilnika. To je `osnPoreza` iz calc.js.
 *  - Licni odbitak je 3.600 KM godisnje (Zakon, clan 24. stav 1.),
 *    uvecan po faktoru za izdrzavane (stav 2.), a za dio godine srazmjerno,
 *    na pune mjesece, u korist obveznika. Neiskoristen se ne prenosi.
 *
 * SVE U FENINZIMA. Svaka uplata se racuna isto kao u glavnom prozoru i
 * zaokruzuje za sebe, jer svaka ima svoj AMS-1035 — pa red 13 tacno
 * odgovara zbiru obrazaca koji se prilazu.
 *
 * NIJE POTVRDJENO: da li porez placen uz AMS ide u red 29 ("uplacene
 * akontacije") ili 28 ("porez po odbitku"). Logika kaze 29 — AMS uplacujes
 * sam, a 28 je porez koji je obustavio neko drugi. Na red 31 to ne utice,
 * jer se oba oduzimaju.
 */

/** Osnovni licni odbitak za cijelu godinu: 3.600,00 KM. */
export const LICNI_ODBITAK = 360000;

/** Najveci razuman faktor: 1 + 0,5 + 0,5 + 0,7 + 0,9 + ... — iznad ovoga je greska u kucanju. */
export const NAJVECI_FAKTOR = 10;

const MJESECI = ['Januar', 'Februar', 'Mart', 'April', 'Maj', 'Juni',
  'Juli', 'August', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'];
export const nazivMjeseca = m => MJESECI[m - 1] || '';

/** KM (string ili broj) -> feninzi, nikad negativno. */
const feninzi = v => Math.max(0, Math.round(parseInput(v) * 100));

/**
 * Koliko mjeseci pokriva period, na pune mjesece u korist obveznika:
 * 15.03.–31.12. su deset mjeseci (mart se racuna cijeli). Bez perioda
 * ili sa pogresnim periodom — cijela godina.
 */
export function brojMjeseci(od, doo) {
  const a = /^(\d{4})-(\d{2})-\d{2}$/.exec(od || '');
  const b = /^(\d{4})-(\d{2})-\d{2}$/.exec(doo || '');
  if (!a || !b) return 12;
  const n = (Number(b[1]) - Number(a[1])) * 12 + (Number(b[2]) - Number(a[2])) + 1;
  return n >= 1 && n <= 12 ? n : 12;
}

/** Faktor licnog odbitka iz unosa ("1,5" ili 1.5); prazno je 1. */
export function faktor(v) {
  if (v === '' || v === null || v === undefined) return 1;
  const f = parseInput(v);
  return f > 0 && f <= NAJVECI_FAKTOR ? f : 1;
}

/**
 * Prazan unos za godinu. Od januara do marta zadana je prosla godina —
 * tada se predaje prijava za nju — a poslije tekuca.
 */
export function prazanUnos(danas = new Date()) {
  const godina = danas.getMonth() <= 2 ? danas.getFullYear() - 1 : danas.getFullYear();
  return {
    godina,
    periodOd: godina + '-01-01',
    periodDo: godina + '-12-31',
    uplate: Array.from({ length: 12 }, (_, i) => ({ mjesec: i + 1, iznos: '', vrsta: 'povremena', porezRucno: '' })),
    faktor: '1',
    red8: '', red19: '', red20: '', red28: '', red30: '',
    email: '',
    preplata: 'b',      // b = povrat, a = akontacija za sljedecu godinu
  };
}

/**
 * Obracun prijave po redovima obrasca.
 *
 * @param {Object} u unos (vidi prazanUnos)
 * @returns {{ redovi: Object, uplate: Array, mjeseci: number, faktor: number, zbir: Object }}
 *   redovi su po broju reda obrasca, u feninzima; red 15 ima kolone c i d.
 */
export function obracunGodisnji(u) {
  // `i` je mjesto uplate u unosu, da sucelje zna koji red je koji.
  const uplate = (u.uplate || [])
    .map((x, i) => ({ x, i }))
    .filter(({ x }) => feninzi(x.iznos) > 0)
    .map(({ x, i }) => {
      const r = obracun(parseInput(x.iznos), x.vrsta);
      const rucno = String(x.porezRucno ?? '').trim();
      return { ...x, i, r, uplaceno: rucno ? feninzi(rucno) : r.porez, rucno: !!rucno };
    });

  const zbroj = f => uplate.reduce((s, x) => s + f(x), 0);
  const mjeseci = brojMjeseci(u.periodOd, u.periodDo);
  const f = faktor(u.faktor);

  const r8 = feninzi(u.red8);
  const r13 = zbroj(x => x.r.osnPoreza);
  const r15c = 0;                       // gubitak: program ga ne racuna
  const r15d = r8 + r13;
  const r16 = Math.max(0, r15c - r15d);
  const r17 = Math.max(0, r15d - r15c);
  const r18 = Math.round(LICNI_ODBITAK * f * mjeseci / 12);
  const r19 = feninzi(u.red19);
  const r20 = feninzi(u.red20);
  const r21 = r18 + r19 + r20;
  const r22 = r16;
  const r23 = r17;
  const r24 = r21;
  const r25 = Math.max(0, r23 - r22 - r24);
  const r26 = Math.round(r25 * stope().porez);
  const r27 = 0;                        // clan 35. st. 3. i 47. — ne vazi za freelancere
  const r28 = feninzi(u.red28);
  const r29 = zbroj(x => x.uplaceno);
  const r30 = feninzi(u.red30);
  const r31 = r26 - r27 - r28 - r29 - r30;

  return {
    uplate,
    mjeseci,
    faktor: f,
    redovi: {
      8: r8, 13: r13, 15: { c: r15c, d: r15d }, 16: r16, 17: r17,
      18: r18, 19: r19, 20: r20, 21: r21,
      22: r22, 23: r23, 24: r24, 25: r25, 26: r26, 27: r27,
      28: r28, 29: r29, 30: r30, 31: r31,
    },
    zbir: {
      prihod: zbroj(x => x.r.osnovica),
      rashodi: zbroj(x => x.r.rashodi),
      doprinosi: zbroj(x => x.r.doprinosi),
      osnPoreza: r13,
      porezObracunat: zbroj(x => x.r.porez),
      porezUplacen: r29,
    },
  };
}

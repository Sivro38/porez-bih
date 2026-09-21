import { stopeZa } from './stope.js';

/**
 * Obracun doprinosa i poreza.
 *
 * Sve ide u feninzima (cijeli brojevi). Svaka stavka se zaokruzi odmah,
 * a izvedene stavke se racunaju oduzimanjem od vec zaokruzenih - tako
 * zbirovi uvijek zatvaraju i ono sto pise na uplatnicama se poklapa sa
 * "Ukupno za uplatu":
 *
 *   rashodi + osnDopr          === osnovica
 *   kanton  + federacija       === doprinosi
 *   kanton  + federacija + porez === ukupno
 *   ukupno  + neto             === osnovica
 *
 * @param {number} osnovicaKM ukupan prihod u KM
 * @param {string} [vrsta] vrsta prihoda iz VRSTE_PRIHODA; mijenja samo
 *   postotak priznatih rashoda (20% povremena, 30% autorska naknada)
 * @returns {Object} sve stavke u feninzima
 */
export function obracun(osnovicaKM, vrsta) {
  const S = stopeZa(vrsta);
  const osnovica = Math.max(0, Math.round(osnovicaKM * 100));

  const rashodi = Math.round(osnovica * S.rashodi);
  const osnDopr = osnovica - rashodi;

  const doprinosi = Math.round(osnDopr * S.doprinosi);
  const federacija = Math.round(doprinosi * S.federacija);
  const kanton = doprinosi - federacija; // kanton nosi ostatak zaokruzivanja

  const osnPoreza = osnDopr - doprinosi;
  const porez = Math.round(osnPoreza * S.porez);

  const ukupno = doprinosi + porez;
  const neto = osnovica - ukupno;

  return { osnovica, rashodi, osnDopr, doprinosi, kanton, federacija, osnPoreza, porez, ukupno, neto };
}

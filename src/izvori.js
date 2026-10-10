/**
 * Oznake izvora — sitno "i" uz tvrdnju koja nije nasa.
 *
 * Nije veza nego biljeska: ne vodi nikud, samo na prelaz misem kaze
 * odakle podatak. Program se hvali time da nista ne salje na mrezu, pa
 * ni ove oznake ne smiju nikud voditi same od sebe. Ko hoce izvor,
 * otvori "Sluzbeni resursi".
 *
 * Tekst stoji na jednom mjestu da se ne razidje izmedju prozora.
 */

/*
 * Uputa ide na IKONU "Resursi" na radnoj povrsini, ne na "Pomoc".
 * Pomoc postoji dvaput — kao meni u glavnom prozoru i kao ikona koja
 * otvara Uputstvo — a Sluzbeni resursi su samo u meniju. Ikona
 * Resursi je jedna jedina i ne moze se pomijesati.
 */
const PUF = 'Izvor: Porezna uprava FBiH — pufbih.ba/freelanceri. '
  + 'Otvori ikonu Resursi na radnoj površini.';

/** @param {string} opis sta tacno taj izvor potvrdjuje */
function oznaka(opis) {
  const naslov = opis + ' ' + PUF;
  return '<sup class="izvor" tabindex="0" role="note"'
    + ' title="' + naslov + '" aria-label="' + naslov + '">i</sup>';
}

/** Rokovi za uplatu i predaju obrasca. */
export const IZVOR_ROKOVI = oznaka('Rok propisan Zakonom o porezu na dohodak FBiH.');

/** Stope, racuni i sifre opcina. */
export const IZVOR_BROJKI = oznaka('Provjereno 21.09.2026.');

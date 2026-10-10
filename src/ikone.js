/**
 * Ikone za precice na radnoj povrsini.
 *
 * Crtane su kao inline SVG, ne kao slike: ostaju ostre na svakoj
 * rezoluciji, ne trose dodatni zahtjev i lako im se mijenja boja.
 * Stil prati XP — mekani prelivi, tanka tamna ivica, blagi odsjaj.
 */

/** Zajednicki odsjaj preko gornje polovine, kao na XP ikonama. */
const sjaj = (id, x, y, s, v) =>
  '<path d="M' + x + ' ' + (y + 2) + ' h' + s + ' v' + (v * 0.42)
  + ' q' + (-s / 2) + ' ' + (v * 0.20) + ' ' + (-s) + ' 0 z" fill="url(#' + id + ')"/>';

/**
 * Moji podaci — licna karta, u XP maniru.
 *
 * Isti tvrdi prelom preliva kao kod kalkulatora i ikone KORISNIK. Prije
 * je karta imala meke prelive i tanku ivicu, pa je izgledala kao
 * Windows 7; XP ikona je zasicenija i ima debeo tamni obrub.
 */
export const MOJI_PODACI = `
<svg viewBox="0 0 48 48" width="48" height="48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="mp-karta" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFFFFF"/><stop offset="0.5" stop-color="#E4EDF8"/>
      <stop offset="0.5" stop-color="#D2E0F0"/><stop offset="1" stop-color="#AEC6E2"/>
    </linearGradient>
    <linearGradient id="mp-traka" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#5BA3F0"/><stop offset="0.5" stop-color="#2A70CE"/>
      <stop offset="0.5" stop-color="#1D5BB4"/><stop offset="1" stop-color="#134A97"/>
    </linearGradient>
    <linearGradient id="mp-kosulja" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFB300"/><stop offset="0.5" stop-color="#F08C00"/>
      <stop offset="0.5" stop-color="#E07A00"/><stop offset="1" stop-color="#C25F00"/>
    </linearGradient>
  </defs>

  <ellipse cx="24" cy="41.5" rx="17" ry="2.6" fill="#000" opacity="0.2"/>

  <rect x="4" y="8" width="40" height="31" rx="3" fill="url(#mp-karta)"
        stroke="#2A5B9B" stroke-width="1.6"/>

  <path d="M5.6 9.6 h36.8 v6.6 H5.6 z" fill="url(#mp-traka)"/>
  <rect x="5.6" y="9.6" width="36.8" height="2.6" fill="#fff" opacity="0.32"/>

  <circle cx="16" cy="25" r="5.6" fill="#FFCC8A" stroke="#8A5A1E" stroke-width="1.4"/>
  <path d="M7.5 37.4 q1.5-7.4 8.5-7.4 t8.5 7.4 z" fill="url(#mp-kosulja)"
        stroke="#8A4A00" stroke-width="1.4"/>

  <g fill="#42658E">
    <rect x="28" y="21" width="12" height="2.4" rx="1.2"/>
    <rect x="28" y="26" width="12" height="2.4" rx="1.2" opacity="0.7"/>
    <rect x="28" y="31" width="8"  height="2.4" rx="1.2" opacity="0.7"/>
  </g>

  <path d="M5.6 17 h36.8 v6 q-18 3.2 -36.8 0 z" fill="#fff" opacity="0.34"/>
</svg>`;

/** Uplatnice — nalog sa savijenim uglom i pecatom. */
export const UPLATNICE = `
<svg viewBox="0 0 48 48" width="48" height="48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="up-papir" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FFFFFF"/><stop offset="0.6" stop-color="#FBFAF4"/>
      <stop offset="1" stop-color="#E6E2D2"/>
    </linearGradient>
    <linearGradient id="up-ugao" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#D2CDB8"/>
    </linearGradient>
    <linearGradient id="up-sjaj2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="0.5"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <path d="M9 4 h20 l10 10 v30 a1 1 0 0 1-1 1 H9 a1 1 0 0 1-1-1 V5 a1 1 0 0 1 1-1z"
        fill="url(#up-papir)" stroke="#8C8570" stroke-width="1"/>
  <path d="M29 4 l10 10 h-9 a1 1 0 0 1-1-1 z" fill="url(#up-ugao)" stroke="#8C8570" stroke-width="1"/>
  <rect x="12" y="18" width="15" height="2" rx="0.8" fill="#8a1c3a"/>
  <rect x="12" y="23" width="23" height="1.8" rx="0.8" fill="#9AA0AC"/>
  <rect x="12" y="27" width="23" height="1.8" rx="0.8" fill="#9AA0AC"/>
  <rect x="12" y="31" width="14" height="1.8" rx="0.8" fill="#9AA0AC"/>
  <g>
    <rect x="12" y="35.5" width="3.4" height="4.4" rx="0.5" fill="#fff" stroke="#5B6472" stroke-width="0.7"/>
    <rect x="16.4" y="35.5" width="3.4" height="4.4" rx="0.5" fill="#fff" stroke="#5B6472" stroke-width="0.7"/>
    <rect x="20.8" y="35.5" width="3.4" height="4.4" rx="0.5" fill="#fff" stroke="#5B6472" stroke-width="0.7"/>
  </g>
  <circle cx="32.5" cy="37" r="6" fill="none" stroke="#8a1c3a" stroke-width="1.6" opacity="0.75"/>
  <path d="M29 37 h7 M32.5 33.5 v7" stroke="#8a1c3a" stroke-width="1.2" opacity="0.6"/>
  <path d="M9 5 h20 v8 q-10 4 -20 0 z" fill="url(#up-sjaj2)"/>
</svg>`;

/** Pomoc — plava kugla sa upitnikom, kao XP Help. */
export const POMOC = `
<svg viewBox="0 0 48 48" width="48" height="48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <radialGradient id="po-kugla" cx="0.35" cy="0.28" r="0.85">
      <stop offset="0" stop-color="#8FD0FF"/><stop offset="0.45" stop-color="#2C86E8"/>
      <stop offset="1" stop-color="#0B3F91"/>
    </radialGradient>
    <linearGradient id="po-sjaj" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="0.75"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <ellipse cx="24" cy="42" rx="13" ry="3" fill="#000" opacity="0.18"/>
  <circle cx="24" cy="23" r="18" fill="url(#po-kugla)"/>
  <circle cx="24" cy="23" r="17.4" fill="none" stroke="#08356F" stroke-width="1.2"/>
  <ellipse cx="24" cy="13" rx="11.5" ry="7" fill="url(#po-sjaj)"/>
  <path d="M18.6 18.4 q0-6.2 5.9-6.2 q5.6 0 5.6 5.1 q0 2.9-2.6 4.6 q-2.4 1.6-2.4 3.4 v1.3 h-4.2 v-1.9
           q0-2.6 2.6-4.5 q2.2-1.6 2.2-2.9 q0-1.7-1.7-1.7 q-1.9 0-1.9 2.8 z"
        fill="#fff"/>
  <circle cx="24.2" cy="31.6" r="2.5" fill="#fff"/>
</svg>`;

/** Korisnik — plocica naloga, u XP maniru: jasan obrub, zasicene boje. */
export const KORISNIK = `
<svg viewBox="0 0 32 32" width="32" height="32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="ko-ram" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#EAF2FD"/><stop offset="0.5" stop-color="#BFD8F5"/>
      <stop offset="0.5" stop-color="#A9C9EF"/><stop offset="1" stop-color="#7FA9DE"/>
    </linearGradient>
    <linearGradient id="ko-kosulja" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFB300"/><stop offset="0.5" stop-color="#F08C00"/>
      <stop offset="0.5" stop-color="#E07A00"/><stop offset="1" stop-color="#C25F00"/>
    </linearGradient>
  </defs>
  <rect x="1.5" y="1.5" width="29" height="29" rx="2" fill="url(#ko-ram)" stroke="#2A5B9B" stroke-width="1.5"/>
  <circle cx="16" cy="12" r="5.4" fill="#FFCC8A" stroke="#8A5A1E" stroke-width="1.4"/>
  <path d="M5.5 30.5 q1.6-8.5 10.5-8.5 t10.5 8.5 z" fill="url(#ko-kosulja)" stroke="#8A4A00" stroke-width="1.4"/>
</svg>`;

/** Prazno mjesto — uglasti isprekidani okvir sa plusom. */
export const PRAZNO_MJESTO = `
<svg viewBox="0 0 32 32" width="32" height="32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <rect x="1.5" y="1.5" width="29" height="29" rx="2" fill="#FFFFFF"
        stroke="#7F9DB9" stroke-width="1.5" stroke-dasharray="3 2"/>
  <path d="M16 9 v14 M9 16 h14" stroke="#4A6E96" stroke-width="3" stroke-linecap="square"/>
</svg>`;

/**
 * Kalkulacija — kalkulator, u XP maniru.
 *
 * Kljucni potez je tvrdi prelom preliva na pola (dva `stop` na
 * offset="0.5"). To je ono sto XP ikonu razlikuje od Windows 7: sjaj se
 * ne gubi postepeno nego se lomi, pa plastika izgleda kao plastika.
 * Uz to ide debela tamna ivica i sjenka ispod.
 */
export const KALKULACIJA = `
<svg viewBox="0 0 48 48" width="48" height="48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="kl-kuciste" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#DCEBF9"/><stop offset="0.5" stop-color="#A8C8E8"/>
      <stop offset="0.5" stop-color="#8FB4DC"/><stop offset="1" stop-color="#6E97C4"/>
    </linearGradient>
    <linearGradient id="kl-ekran" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1B4D8A"/><stop offset="0.5" stop-color="#2E6FB8"/>
      <stop offset="0.5" stop-color="#3C82CE"/><stop offset="1" stop-color="#6BA9E0"/>
    </linearGradient>
    <linearGradient id="kl-tipka" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFFFFF"/><stop offset="0.5" stop-color="#E2EBF4"/>
      <stop offset="0.5" stop-color="#CBD9E8"/><stop offset="1" stop-color="#A8BDD4"/>
    </linearGradient>
    <linearGradient id="kl-narandza" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFC04A"/><stop offset="0.5" stop-color="#F3921C"/>
      <stop offset="0.5" stop-color="#E07B0A"/><stop offset="1" stop-color="#C05F00"/>
    </linearGradient>
  </defs>

  <ellipse cx="25" cy="44" rx="13" ry="2.6" fill="#000" opacity="0.2"/>

  <rect x="10" y="4" width="28" height="39" rx="3.5" fill="url(#kl-kuciste)"
        stroke="#2A5B95" stroke-width="1.6"/>

  <rect x="14" y="8" width="20" height="9" rx="1.6" fill="url(#kl-ekran)"
        stroke="#123C6E" stroke-width="1.2"/>
  <rect x="15.4" y="9.2" width="17.2" height="3" rx="1" fill="#fff" opacity="0.28"/>
  <rect x="24" y="13.4" width="8" height="1.8" rx="0.9" fill="#CFE6FF" opacity="0.9"/>

  <g fill="url(#kl-tipka)" stroke="#3A6C9E" stroke-width="1">
    <rect x="14"   y="21" width="5.6" height="5" rx="1.4"/>
    <rect x="21.2" y="21" width="5.6" height="5" rx="1.4"/>
    <rect x="28.4" y="21" width="5.6" height="5" rx="1.4"/>
    <rect x="14"   y="28" width="5.6" height="5" rx="1.4"/>
    <rect x="21.2" y="28" width="5.6" height="5" rx="1.4"/>
    <rect x="28.4" y="28" width="5.6" height="5" rx="1.4"/>
    <rect x="14"   y="35" width="5.6" height="5" rx="1.4"/>
    <rect x="21.2" y="35" width="5.6" height="5" rx="1.4"/>
  </g>
  <rect x="28.4" y="35" width="5.6" height="5" rx="1.4" fill="url(#kl-narandza)"
        stroke="#9A4E00" stroke-width="1"/>

  <path d="M12 5.5 h24 v7 q-12 3.4 -24 0 z" fill="#fff" opacity="0.4"/>
</svg>`;

/**
 * Kalkulacija u 16x16, piksel po piksel — za favikonu u kartici.
 *
 * Isti kalkulator kao gore (plavo kuciste sa tvrdim prelomom, plavi
 * ekran, narandzasta tipka), ali nacrtan za 16 piksela. Umanjena velika
 * ikona se na toj velicini razmaze u mrlju, pa je XP za male ikone imao
 * poseban crtez. Svaki pravougaonik je na cijelom pikselu (crispEdges).
 */
export const KALKULACIJA_16 = `
<svg viewBox="0 0 16 16" width="16" height="16" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" aria-hidden="true">
  <rect x="3" y="0" width="10" height="1" fill="#2A5B95"/>
  <rect x="2" y="1" width="1" height="14" fill="#2A5B95"/>
  <rect x="13" y="1" width="1" height="14" fill="#2A5B95"/>
  <rect x="3" y="15" width="10" height="1" fill="#2A5B95"/>
  <rect x="3" y="1" width="10" height="7" fill="#C4DAF0"/>
  <rect x="3" y="8" width="10" height="7" fill="#8FB4DC"/>
  <rect x="4" y="2" width="8" height="5" fill="#123C6E"/>
  <rect x="5" y="3" width="6" height="3" fill="#3C82CE"/>
  <rect x="5" y="3" width="6" height="1" fill="#6BA9E0"/>
  <rect x="8" y="5" width="3" height="1" fill="#CFE6FF"/>
  <g fill="#F7FAFD">
    <rect x="4" y="9" width="2" height="2"/>
    <rect x="7" y="9" width="2" height="2"/>
    <rect x="10" y="9" width="2" height="2"/>
    <rect x="4" y="12" width="2" height="2"/>
    <rect x="7" y="12" width="2" height="2"/>
  </g>
  <rect x="10" y="12" width="2" height="2" fill="#E07B0A"/>
</svg>`;

/** AMS-1035 — sluzbeni obrazac sa pecatom i tabelom. */
export const OBRAZAC = `
<svg viewBox="0 0 48 48" width="48" height="48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="ob-papir" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FFFFFF"/><stop offset="0.6" stop-color="#F6F3E8"/>
      <stop offset="1" stop-color="#E2DCC8"/>
    </linearGradient>
    <linearGradient id="ob-zaglavlje" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#7FB2EC"/><stop offset="1" stop-color="#2C64BE"/>
    </linearGradient>
    <linearGradient id="ob-sjaj" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect x="8" y="4" width="32" height="40" rx="2" fill="url(#ob-papir)"/>
  <rect x="8.5" y="4.5" width="31" height="39" rx="1.5" fill="none" stroke="#6E6957" stroke-width="1"/>
  <rect x="12" y="8" width="24" height="6" rx="1" fill="url(#ob-zaglavlje)"/>
  <g fill="#7A8798">
    <rect x="12" y="17" width="10" height="1.8" rx="0.9"/>
    <rect x="24" y="17" width="12" height="1.8" rx="0.9"/>
  </g>
  <g fill="none" stroke="#8C8878" stroke-width="0.9">
    <rect x="12" y="22" width="24" height="14"/>
    <path d="M12 26.6h24M12 31.3h24M20 22v14M28 22v14"/>
  </g>
  <g fill="#3B6EA8">
    <rect x="13" y="23.4" width="5.5" height="1.6" rx="0.8"/>
    <rect x="21" y="23.4" width="5.5" height="1.6" rx="0.8"/>
    <rect x="29" y="23.4" width="5.5" height="1.6" rx="0.8"/>
  </g>
  <rect x="12" y="39" width="14" height="1.8" rx="0.9" fill="#9AA6B5"/>
  <circle cx="33" cy="39" r="5.5" fill="none" stroke="#B03050" stroke-width="1.4" opacity="0.75"/>
  <path d="M30.4 39.2l1.8 1.8 3.6-3.8" fill="none" stroke="#B03050" stroke-width="1.4"
        stroke-linecap="round" stroke-linejoin="round" opacity="0.75"/>
  ${sjaj('ob-sjaj', 9, 4, 30, 38)}
</svg>`;

/** Pravno i privatnost — dokument sa pecatom i katancem. */
export const PRAVNO = `
<svg viewBox="0 0 48 48" width="48" height="48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="pr-papir" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FFFFFF"/><stop offset="0.6" stop-color="#F3F6FA"/>
      <stop offset="1" stop-color="#D9E2EC"/>
    </linearGradient>
    <linearGradient id="pr-katanac" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFD98A"/><stop offset="0.5" stop-color="#E8A415"/>
      <stop offset="1" stop-color="#B9791A"/>
    </linearGradient>
    <linearGradient id="pr-sjaj" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect x="9" y="4" width="28" height="40" rx="2" fill="url(#pr-papir)"/>
  <rect x="9.5" y="4.5" width="27" height="39" rx="1.5" fill="none" stroke="#6B7C8F" stroke-width="1"/>
  <g fill="#8A9AAC">
    <rect x="13" y="10" width="20" height="2" rx="1"/>
    <rect x="13" y="15" width="20" height="1.6" rx="0.8"/>
    <rect x="13" y="19" width="20" height="1.6" rx="0.8"/>
    <rect x="13" y="23" width="14" height="1.6" rx="0.8"/>
  </g>
  <path d="M20 35v-3a4 4 0 0 1 8 0v3" fill="none" stroke="#9C6A12" stroke-width="2.2"
        stroke-linecap="round"/>
  <rect x="17" y="34" width="14" height="11" rx="1.6" fill="url(#pr-katanac)"
        stroke="#8A5B0E" stroke-width="1"/>
  <circle cx="24" cy="39" r="1.7" fill="#6B460A"/>
  <rect x="23.2" y="39.6" width="1.6" height="3.2" rx="0.8" fill="#6B460A"/>
  ${sjaj('pr-sjaj', 10, 4, 26, 26)}
</svg>`;

/**
 * Godisnja prijava GPD-1051 — list sa zelenim zaglavljem i kalendarom
 * od dvanaest mjeseci; zeleno da se na prvi pogled razlikuje od plavog
 * AMS-a pored njega.
 */
export const GODISNJA = `
<svg viewBox="0 0 48 48" width="48" height="48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="gd-papir" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FFFFFF"/><stop offset="0.6" stop-color="#F6F3E8"/>
      <stop offset="1" stop-color="#E2DCC8"/>
    </linearGradient>
    <linearGradient id="gd-zaglavlje" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#8ED36B"/><stop offset="0.5" stop-color="#4CAF2C"/>
      <stop offset="0.5" stop-color="#3D9A20"/><stop offset="1" stop-color="#2E7D15"/>
    </linearGradient>
    <linearGradient id="gd-sjaj" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <ellipse cx="24" cy="44.5" rx="15" ry="2.4" fill="#000" opacity="0.18"/>
  <rect x="8" y="4" width="32" height="40" rx="2" fill="url(#gd-papir)"/>
  <rect x="8.5" y="4.5" width="31" height="39" rx="1.5" fill="none" stroke="#6E6957" stroke-width="1"/>
  <rect x="12" y="8" width="24" height="7" rx="1" fill="url(#gd-zaglavlje)" stroke="#23620F" stroke-width="0.8"/>
  <rect x="15" y="10.6" width="10" height="1.8" rx="0.9" fill="#fff" opacity="0.9"/>
  <g fill="#fff" stroke="#8C8878" stroke-width="0.8">
    <rect x="12" y="18" width="5.4" height="4.4"/><rect x="18.2" y="18" width="5.4" height="4.4"/>
    <rect x="24.4" y="18" width="5.4" height="4.4"/><rect x="30.6" y="18" width="5.4" height="4.4"/>
    <rect x="12" y="23.2" width="5.4" height="4.4"/><rect x="18.2" y="23.2" width="5.4" height="4.4"/>
    <rect x="24.4" y="23.2" width="5.4" height="4.4"/><rect x="30.6" y="23.2" width="5.4" height="4.4"/>
    <rect x="12" y="28.4" width="5.4" height="4.4"/><rect x="18.2" y="28.4" width="5.4" height="4.4"/>
    <rect x="24.4" y="28.4" width="5.4" height="4.4"/><rect x="30.6" y="28.4" width="5.4" height="4.4"/>
  </g>
  <g fill="#3D9A20">
    <rect x="13.4" y="19.4" width="2.6" height="1.6"/><rect x="19.6" y="19.4" width="2.6" height="1.6"/>
    <rect x="25.8" y="19.4" width="2.6" height="1.6"/><rect x="13.4" y="24.6" width="2.6" height="1.6"/>
  </g>
  <rect x="12" y="37" width="12" height="1.8" rx="0.9" fill="#9AA6B5"/>
  <circle cx="33" cy="38.5" r="5.5" fill="none" stroke="#B03050" stroke-width="1.4" opacity="0.75"/>
  <path d="M30.4 38.7l1.8 1.8 3.6-3.8" fill="none" stroke="#B03050" stroke-width="1.4"
        stroke-linecap="round" stroke-linejoin="round" opacity="0.75"/>
  ${sjaj('gd-sjaj', 9, 4, 30, 38)}
</svg>`;

/**
 * Postavke poreskih stopa — zupcanik sa znakom posto, kao XP-ove ikone
 * kontrolne table: sivo-plavi metal, tamna ivica, odsjaj gore.
 */
export const POSTAVKE = `
<svg viewBox="0 0 48 48" width="48" height="48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="ps-metal" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#E8EEF5"/><stop offset="0.5" stop-color="#B9C7D8"/>
      <stop offset="0.5" stop-color="#A3B4C9"/><stop offset="1" stop-color="#7D92AD"/>
    </linearGradient>
    <radialGradient id="ps-sredina" cx="0.4" cy="0.35" r="0.8">
      <stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#C9D6E6"/>
    </radialGradient>
  </defs>
  <ellipse cx="24" cy="44" rx="14" ry="2.6" fill="#000" opacity="0.18"/>
  <path d="M21 4h6l1 5.2 3.4 1.4 4.4-3 4.2 4.2-3 4.4 1.4 3.4 5.2 1v6l-5.2 1-1.4 3.4 3 4.4-4.2 4.2-4.4-3-3.4 1.4-1 5.2h-6l-1-5.2-3.4-1.4-4.4 3-4.2-4.2 3-4.4-1.4-3.4-5.2-1v-6l5.2-1 1.4-3.4-3-4.4 4.2-4.2 4.4 3 3.4-1.4z"
        fill="url(#ps-metal)" stroke="#3E5675" stroke-width="1.4" stroke-linejoin="round"/>
  <circle cx="24" cy="24" r="10" fill="url(#ps-sredina)" stroke="#3E5675" stroke-width="1.2"/>
  <g fill="#1D5BB4">
    <circle cx="20.4" cy="20.4" r="2.3"/>
    <circle cx="27.6" cy="27.6" r="2.3"/>
    <path d="M27.8 17.6l2 1.6-9.6 11.6-2-1.6z"/>
  </g>
  <path d="M8 13 q16 -6 32 0 v4 q-16 4 -32 0 z" fill="#fff" opacity="0.22"/>
</svg>`;

/**
 * Sta je novo — zuta zvijezda, kao XP-ov znak za nesto sto je tek stiglo.
 */
export const NOVOSTI = `
<svg viewBox="0 0 48 48" width="48" height="48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <radialGradient id="nv-zvijezda" cx="0.4" cy="0.32" r="0.8">
      <stop offset="0" stop-color="#FFF7B8"/><stop offset="0.45" stop-color="#FFD22E"/>
      <stop offset="1" stop-color="#E08A00"/>
    </radialGradient>
  </defs>
  <ellipse cx="24" cy="44" rx="13" ry="2.6" fill="#000" opacity="0.18"/>
  <path d="M24 3.5l5.6 12.4 13.4 1.4-10 9.1 2.8 13.2L24 32.8l-11.8 6.8 2.8-13.2-10-9.1 13.4-1.4z"
        fill="url(#nv-zvijezda)" stroke="#A35A00" stroke-width="1.5" stroke-linejoin="round"/>
  <path d="M24 8.5l3.8 8.6 8.6 1 -6.2 5.6 q-6 -2 -12.4 0 l-6.2-5.6 8.6-1z" fill="#fff" opacity="0.4"/>
</svg>`;

/**
 * Kopija ikone sa vlastitim id-jevima prelaza.
 *
 * Svaka ikona nosi svoje prelive pod id-jem (npr. "kl-kuciste"). Kad je
 * ista ikona na stranici vise puta, browser `url(#id)` veze za PRVU — a
 * ako je ta prva u sakrivenom elementu, prelivi se ne nacrtaju i ikona
 * ostane blijeda, samo sa ivicama. Tako je bilo na telefonu: precice su
 * tamo display:none, pa je donja traka (izmjereno u 1.2) pokazivala
 * isprane ikone. Zato svaka kopija van radne povrsine dobija svoje id-jeve.
 */
let brojKopija = 0;
export function jedinstvena(svg) {
  const sufiks = '-k' + (++brojKopija);
  return svg
    .replace(/id="([\w-]+)"/g, (m, id) => 'id="' + id + sufiks + '"')
    .replace(/url\(#([\w-]+)\)/g, (m, id) => 'url(#' + id + sufiks + ')');
}

/** Ista ikona u 16x16, za naslovnu traku prozora, sa vlastitim id-jevima. */
export function uMalom(svg) {
  return jedinstvena(svg)
    .replace(/<svg([^>]*?)\swidth="\d+"\sheight="\d+"/, (m, prije) => '<svg' + prije + ' width="16" height="16"');
}

/* Globus — vanjske, sluzbene stranice. Meridijani su lukovi, ne elipse:
   elipsa bi na 48px izgledala kao prsten oko lopte, ne kao linija po njoj. */
export const RESURSI = `
<svg viewBox="0 0 48 48" width="48" height="48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <radialGradient id="re-lopta" cx="0.35" cy="0.3" r="0.85">
      <stop offset="0" stop-color="#9FD4FF"/><stop offset="0.55" stop-color="#2C7FD4"/>
      <stop offset="1" stop-color="#10437E"/>
    </radialGradient>
    <linearGradient id="re-sjaj" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="0.5"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <circle cx="24" cy="24" r="19" fill="url(#re-lopta)"/>
  <g fill="none" stroke="#DCEEFF" stroke-width="1.3" opacity="0.85">
    <path d="M5 24 h38"/>
    <path d="M24 5 v38"/>
    <path d="M24 5 C14 14 14 34 24 43"/>
    <path d="M24 5 C34 14 34 34 24 43"/>
    <path d="M9 14 C16 18 32 18 39 14"/>
    <path d="M9 34 C16 30 32 30 39 34"/>
  </g>
  <circle cx="24" cy="24" r="19" fill="none" stroke="#0A2E5C" stroke-width="1.4"/>
  <ellipse cx="19" cy="14" rx="10" ry="6" fill="url(#re-sjaj)"/>
</svg>
`;

/* ---------- sitne ikone za radnje nad profilom ---------- */
/*
 * 16x16, bez preliva: stoje u nizu od tri na uskom dugmetu, pa im treba
 * jasan oblik a ne sjaj. Disketa je ovdje na mjestu — XP je jos uvijek
 * tako crtao snimanje.
 */

/** Snimi izmjene — disketa. */
export const SNIMI_16 = `
<svg viewBox="0 0 16 16" width="16" height="16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M1.5 1.5h10l3 3v10h-13z" fill="#3B6EA8" stroke="#1E3F66" stroke-width="1"/>
  <rect x="4.5" y="2" width="6" height="4.5" fill="#E8F0F8" stroke="#1E3F66" stroke-width="0.8"/>
  <rect x="8" y="2.6" width="1.8" height="3.2" fill="#3B6EA8"/>
  <rect x="3.5" y="9" width="9" height="5.5" fill="#E8F0F8" stroke="#1E3F66" stroke-width="0.8"/>
  <g fill="#7A91AC">
    <rect x="5" y="10.3" width="6" height="0.9"/>
    <rect x="5" y="12" width="6" height="0.9"/>
  </g>
</svg>`;

/** Preimenuj — olovka. */
export const PREIMENUJ_16 = `
<svg viewBox="0 0 16 16" width="16" height="16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M10.6 1.8l3.6 3.6-7.8 7.8-4.3.7.7-4.3z" fill="#F3C65B" stroke="#8A5B0E" stroke-width="1"
        stroke-linejoin="round"/>
  <path d="M10.6 1.8l3.6 3.6-1.6 1.6-3.6-3.6z" fill="#C9D4E0" stroke="#5B6C80" stroke-width="1"
        stroke-linejoin="round"/>
  <path d="M2.8 13.2l.6-2.1 1.5 1.5z" fill="#3A3A3A"/>
</svg>`;

/** Obrisi profil — crveni X. */
export const OBRISI_16 = `
<svg viewBox="0 0 16 16" width="16" height="16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="#B02A2A" stroke-width="2.6" stroke-linecap="round"/>
</svg>`;

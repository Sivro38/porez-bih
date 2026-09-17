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

/** Moji podaci — licna karta sa likom i podacima. */
export const MOJI_PODACI = `
<svg viewBox="0 0 48 48" width="48" height="48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="mp-karta" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FDFEFF"/><stop offset="0.5" stop-color="#E8EFF8"/>
      <stop offset="1" stop-color="#C7D6E8"/>
    </linearGradient>
    <linearGradient id="mp-traka" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#4A93E8"/><stop offset="0.5" stop-color="#1E62CC"/>
      <stop offset="1" stop-color="#154BA6"/>
    </linearGradient>
    <linearGradient id="mp-sjaj" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="mp-lice" cx="0.4" cy="0.3" r="0.8">
      <stop offset="0" stop-color="#FFE7C4"/><stop offset="1" stop-color="#E0A96D"/>
    </radialGradient>
  </defs>
  <rect x="4" y="9" width="40" height="30" rx="3" fill="url(#mp-karta)"/>
  <rect x="4.5" y="9.5" width="39" height="29" rx="2.5" fill="none" stroke="#5B7699" stroke-width="1"/>
  <rect x="4.5" y="9.5" width="39" height="7" rx="2.5" fill="url(#mp-traka)"/>
  <rect x="4.5" y="15" width="39" height="1.5" fill="#0E3E85" opacity="0.5"/>
  <circle cx="16" cy="26" r="6" fill="url(#mp-lice)" stroke="#A9793F" stroke-width="0.8"/>
  <path d="M8 36 q1.5-6 8-6 t8 6 z" fill="#6FA8E8" stroke="#3A6FB8" stroke-width="0.8"/>
  <rect x="27" y="22" width="13" height="2.2" rx="1" fill="#6E8AAE"/>
  <rect x="27" y="27" width="13" height="2.2" rx="1" fill="#8FA6C2"/>
  <rect x="27" y="32" width="9"  height="2.2" rx="1" fill="#8FA6C2"/>
  ${sjaj('mp-sjaj', 5, 9, 38, 28)}
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

/** Kalkulacija — kalkulator sa ekranom i tipkama. */
export const KALKULACIJA = `
<svg viewBox="0 0 48 48" width="48" height="48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="kl-kuciste" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#F3F1E6"/><stop offset="0.5" stop-color="#DFDACA"/>
      <stop offset="1" stop-color="#B9B2A0"/>
    </linearGradient>
    <linearGradient id="kl-ekran" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#B9D98A"/><stop offset="1" stop-color="#7FB356"/>
    </linearGradient>
    <linearGradient id="kl-sjaj" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect x="9" y="5" width="30" height="38" rx="3" fill="url(#kl-kuciste)"/>
  <rect x="9.5" y="5.5" width="29" height="37" rx="2.5" fill="none" stroke="#6E6957" stroke-width="1"/>
  <rect x="13" y="9" width="22" height="9" rx="1.5" fill="url(#kl-ekran)" stroke="#5B7F3C" stroke-width="0.8"/>
  <rect x="15" y="14" width="12" height="1.6" fill="#3F6129" opacity="0.65"/>
  <rect x="29" y="14" width="4"  height="1.6" fill="#3F6129" opacity="0.65"/>
  <g fill="#8C8878" stroke="#5F5B4D" stroke-width="0.6">
    <rect x="13"   y="22" width="5.6" height="4.4" rx="1"/>
    <rect x="21.2" y="22" width="5.6" height="4.4" rx="1"/>
    <rect x="29.4" y="22" width="5.6" height="4.4" rx="1"/>
    <rect x="13"   y="29" width="5.6" height="4.4" rx="1"/>
    <rect x="21.2" y="29" width="5.6" height="4.4" rx="1"/>
    <rect x="29.4" y="29" width="5.6" height="4.4" rx="1"/>
    <rect x="13"   y="36" width="5.6" height="4.4" rx="1"/>
    <rect x="21.2" y="36" width="5.6" height="4.4" rx="1"/>
  </g>
  <rect x="29.4" y="36" width="5.6" height="4.4" rx="1" fill="#D98B32" stroke="#9C5C15" stroke-width="0.6"/>
  ${sjaj('kl-sjaj', 10, 5, 28, 36)}
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

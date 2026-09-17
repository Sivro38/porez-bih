import { PRIMAOCI, FIKSNE_NULE, punNaziv, punaSvrha } from './config.js';
import { fmt } from './format.js';
import { datumCifre } from './storage.js';

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));

/** Red kucica sa po jednom cifrom; visak znakova se odbacuje. */
function cifre(vrijednost, duzina, cls) {
  const str = String(vrijednost ?? '');
  let html = '<div class="rf-digitgrid ' + (cls || '') + '">';
  for (let i = 0; i < duzina; i++) {
    html += '<span class="box">' + esc(str[i] || '') + '</span>';
  }
  return html + '</div>';
}

/** DD/MM/GGGG kucice iz ISO datuma (prazne ako datuma nema). */
function datumKucice(iso, digitClass) {
  const d = datumCifre(iso);
  const b = i => '<span class="' + digitClass + '">' + esc(d[i] || '') + '</span>';
  return '<div class="rf-datebox-row">'
    + b(0) + b(1) + '<span class="slash">/</span>'
    + b(2) + b(3) + '<span class="slash">/</span>'
    + b(4) + b(5) + b(6) + b(7)
    + '</div>';
}

function periodKucice(podaci) {
  const red = iso => {
    const d = datumCifre(iso);
    let s = '';
    for (let i = 0; i < 8; i++) {
      s += '<span class="rf-digit upisano">' + esc(d[i] || '') + '</span>';
      if (i === 1 || i === 3) s += '/';
    }
    return s;
  };
  return '<div class="rf-period-part">'
    + '<div class="rf-period-title">Porezni period</div>'
    + '<div class="rf-period-line"><span style="width:14px;">Od</span>' + red(podaci.periodOd) + '</div>'
    + '<div class="rf-period-line"><span style="width:14px;">Do</span>' + red(podaci.periodDo) + '</div>'
    + '</div>';
}

/**
 * Sazetak za telefon.
 *
 * Replika A4 obrasca na telefonu nema svrhu: ne stampa se s njega, nego
 * se brojevi prepisuju u mobilnu banku. Zato tamo ide kartica sa samo
 * onim sto se stvarno kuca, citljivo i sa dugmetom za kopiranje.
 */
function sazetakHTML(cfg, p) {
  const red = (naziv, vrijednost, mono, kopija) =>
    '<div class="upl-red">'
    + '<span class="upl-red-naziv">' + esc(naziv) + '</span>'
    + '<span class="upl-red-vrijednost' + (mono ? ' mono' : '') + '">' + esc(vrijednost)
    + (kopija ? '<button type="button" class="upl-kopiraj" data-kopiraj="'
        + esc(vrijednost) + '" title="Kopiraj">Kopiraj</button>' : '')
    + '</span></div>';

  return '<div class="upl-sazetak">'
    + '<div class="upl-sazetak-zaglavlje">'
      + '<div class="upl-sazetak-naslov">' + esc(punNaziv(cfg)) + '</div>'
      + '<div class="upl-sazetak-iznos"><span class="js-km-val">–</span> KM</div>'
    + '</div>'
    + red('Račun primaoca', cfg.acc, true, true)
    + red('Vrsta prihoda', cfg.vrsta, true, false)
    + red('Svrha', punaSvrha(cfg), false, false)
    + red('Općina', p.opcina || '—', true, false)
    + red('Poziv na broj', FIKSNE_NULE.poziv, true, false)
    + red('Budžetska organizacija', FIKSNE_NULE.organizacija, true, false)
    + (p.obveznik ? red('Broj poreznog obveznika', p.obveznik, true, false) : '')
    + '</div>';
}

/**
 * Blok od tri linije na obrascu (svrha, primalac).
 *
 * Obrazac ima po tri linije za svako od njih, pa se dug tekst razliva
 * po njima umjesto da se prelama unutar prve i viri iz kolone. Gdje se
 * tekst rastavlja stoji u config.js, uz sam tekst.
 */
function triLinije(natpis, redovi, stilZadnje) {
  return [0, 1, 2].map(i => {
    const tekst = redovi[i] || '';
    return '<div class="rf-line' + (tekst || i === 0 ? '' : ' blank') + '"'
      + (i === 2 && stilZadnje ? ' style="' + stilZadnje + '"' : '') + '>'
      + (i === 0 ? '<span class="rf-lbl-inline">' + natpis + '</span>' : '')
      + (tekst ? '<span class="rf-val-inline">' + esc(tekst) + '</span>' : '')
      + '</div>';
  }).join('');
}

function renderForm(cfg, p) {
  return '' +
  '<div class="form-caption">' + esc(cfg.caption) + '</div>' +
  '<div class="real-form" data-form="' + cfg.key + '">' +

    '<div class="rf-left">' +

      '<div class="rf-lined">' +
        '<div class="rf-line"><span class="rf-lbl-inline">Uplatio je (ime, adresa, i telefon):</span><span class="rf-val-inline upisano">' + esc(p.ime) + '</span></div>' +
        '<div class="rf-line' + (p.adresa ? '' : ' blank') + '"><span class="rf-val-inline upisano">' + esc(p.adresa) + '</span></div>' +
        '<div class="rf-line' + (p.telefon ? '' : ' blank') + '"><span class="rf-val-inline upisano">' + esc(p.telefon) + '</span></div>' +
      '</div>' +

      '<div class="rf-lined">' +
        triLinije('Svrha doznake:', cfg.svrha) +
      '</div>' +

      '<div class="rf-lined" style="border-bottom:none;">' +
        triLinije('Primatelj/Primalac:', cfg.primalac, 'border-bottom:1px solid #ccc;') +
      '</div>' +

      '<div class="rf-row-single">' +
        '<span class="rf-lbl-inline">Mjesto i datum uplate:</span>' +
        '<span class="rf-mjesto-line"><span class="rf-val-inline upisano">' + esc(p.mjesto) + '</span></span>' +
        datumKucice(p.datum, 'rf-digit upisano') +
      '</div>' +

      '<div class="rf-sig-block">' +
        '<div class="rf-sig-labels">' +
          '<div class="rf-row-single"><span class="rf-lbl-inline">Potpis i pečat nalogodavaoca:</span><span class="rf-sig-line">'
            + (p.potpis ? '<span class="rf-potpis">[TVOJ POTPIS]</span>' : '') + '</span></div>' +
          '<div class="rf-row-single" style="border-bottom:none;"><span class="rf-lbl-inline">Potpis ovlaštene osobe/lica:</span><span class="rf-sig-line"></span></div>' +
        '</div>' +
        '<div class="rf-stamp-box"><div class="rf-stamp-circle"></div><div class="stamp-label">Pečat Banke</div></div>' +
      '</div>' +

    '</div>' +

    '<div class="rf-right">' +

      '<div class="rf-acc-row">' +
        '<span class="rf-lbl-block">Račun pošiljatelja/pošiljaoca</span>' +
        cifre(p.racun, 16, 'upisano') +
      '</div>' +
      (p.racun ? '' :
        '<div style="padding:0 10px 4px 152px; margin-top:-3px; border-bottom:1px solid #ccc;"><span class="rf-fill-hint">— popuni u &quot;Moji podaci&quot; ili ručno —</span></div>') +

      '<div class="rf-acc-row">' +
        '<span class="rf-lbl-block">Račun primatelja/primaoca</span>' +
        cifre(cfg.acc, 16, '') +
      '</div>' +

      '<div class="rf-km-row">' +
        '<div class="rf-km-lbl">KM</div>' +
        '<div class="rf-km-val js-km-val upisano">–</div>' +
        '<div class="rf-hitno"><span class="box"></span>HITNO</div>' +
      '</div>' +

      '<div class="rf-jp-box">' +
        '<div class="rf-jp-title">samo za uplate javnih prihoda</div>' +

        '<div class="rf-jp-row">' +
          '<div class="rf-jp-row-flat">' +
            '<span class="rf-lbl-block" style="flex-basis:150px;">Broj poreznog obveznika</span>' +
            cifre(p.obveznik, 13, 'small upisano') +
            '<div class="rf-jp-checkbox-wrap"><span class="rf-lbl-inline">Vrsta uplate</span><span class="rf-checkbox"></span></div>' +
          '</div>' +
        '</div>' +

        '<div class="rf-jp-row">' +
          '<div class="rf-vrsta-period-row">' +
            '<div class="rf-vrsta-part">' +
              '<span class="rf-lbl-block" style="flex-basis:90px;">Vrsta prihoda</span>' +
              cifre(cfg.vrsta, 6, 'small') +
            '</div>' +
            periodKucice(p) +
          '</div>' +
        '</div>' +

        '<div class="rf-jp-row">' +
          '<div class="rf-opcina-row">' +
            '<div class="rf-opcina-part">' +
              '<span class="rf-lbl-inline">Općina</span>' +
              cifre(p.opcina, 3, 'small upisano') +
            '</div>' +
            '<div class="rf-opcina-part">' +
              '<span class="rf-lbl-inline">Proračunska/budžetska organizacija</span>' +
              cifre(FIKSNE_NULE.organizacija, 7, 'small') +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="rf-jp-row">' +
          '<div class="rf-poziv-row">' +
            '<span class="rf-lbl-inline">Poziv na broj</span>' +
            cifre(FIKSNE_NULE.poziv, 10, 'small') +
          '</div>' +
        '</div>' +

      '</div>' +
    '</div>' +
  '</div>';
}

/**
 * Iscrtaj sve tri uplatnice sa trenutnim licnim podacima.
 * Svaka je omotana u .upl-stavka da se u rezimu "jedna po jedna" moze
 * prikazati zasebno, zajedno sa svojim naslovom.
 */
export function renderUplatnice(mount, podaci) {
  mount.innerHTML = PRIMAOCI.map((cfg, i) =>
    '<div class="upl-stavka' + (i === 0 ? ' aktivna' : '') + '" data-idx="' + i + '">'
    + sazetakHTML(cfg, podaci)
    + renderForm(cfg, podaci)
    + '</div>'
  ).join('');
}

/** Osvjezi samo iznose (bez ponovnog crtanja obrazaca). */
export function popuniIznose(r) {
  document.querySelectorAll('.upl-stavka').forEach(form => {
    const key = form.querySelector('.real-form').getAttribute('data-form');
    // iznos stoji i na obrascu i na sazetku za telefon
    if (r[key] === undefined) return;
    form.querySelectorAll('.js-km-val').forEach(el => { el.textContent = fmt(r[key]); });
  });
}

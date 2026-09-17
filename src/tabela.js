import { REDOVI } from './config.js';
import { stope } from './stope.js';
import { fmt, fmtPct } from './format.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));

/** Izgradi tijelo tabele obracuna iz REDOVI - % kolona ide iz istih stopa. */
export function renderTabela() {
  const S = stope();
  let html = '<tr class="xp-header">'
    + '<th>Stavka</th>'
    + '<th class="pct-col" style="text-align:right;">%</th>'
    + '<th style="text-align:right;">Iznos (KM)</th>'
    + '</tr>';

  for (const red of REDOVI) {
    if (red.sekcija) {
      html += '<tr class="xp-section"><td colspan="3">' + esc(red.sekcija) + '</td></tr>';
      continue;
    }
    const klasa = red.klasa ? ' class="' + red.klasa + '"' : '';
    const pct = red.stopa === null
      ? '<td class="pct pct-col" id="pct-' + red.id + '">–</td>'
      : '<td class="pct pct-col">' + fmtPct(red.stopa(S) * 100) + '</td>';
    html += '<tr' + klasa + '>'
      + '<th>' + esc(red.naziv) + '</th>'
      + pct
      + '<td class="num" id="r-' + red.id + '">–</td>'
      + '</tr>';
  }
  return html;
}

/** Upisi izracunate iznose u tabelu. */
export function popuniTabelu(r) {
  for (const red of REDOVI) {
    if (red.sekcija) continue;
    const el = document.getElementById('r-' + red.id);
    if (el) el.textContent = fmt(r[red.id]);
  }
  const udio = id => r.osnovica > 0 ? (r[id] / r.osnovica * 100) : 0;
  document.getElementById('pct-ukupno').textContent = fmtPct(udio('ukupno'));
  document.getElementById('pct-neto').textContent = fmtPct(udio('neto'));
}

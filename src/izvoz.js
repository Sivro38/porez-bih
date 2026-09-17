import { FIKSNE_NULE } from './config.js';
import { fmt } from './format.js';
import {
  nazivFajla, redoviObracuna, redoviUplatnicaPDF,
  aoaObracun, aoaUplatnice,
} from './izvoz-podaci.js';
import fontUrl from './fontovi/DejaVuSans.ttf?url';

/**
 * Izvoz obracuna u PDF i Excel.
 *
 * Biblioteke (jsPDF, SheetJS) i font se ucitavaju dinamicki - tek kad
 * korisnik stvarno trazi izvoz. Osnovni bundle ostaje mali.
 */

/** ArrayBuffer -> base64, u komadima (spread bi pukao na 750 kB). */
function uBase64(buffer) {
  const bajtovi = new Uint8Array(buffer);
  const komad = 0x8000;
  let s = '';
  for (let i = 0; i < bajtovi.length; i += komad) {
    s += String.fromCharCode.apply(null, bajtovi.subarray(i, i + komad));
  }
  return btoa(s);
}

/**
 * Pokreni preuzimanje Bloba pod zadanim imenom.
 *
 * XLSX.writeFile() se u bundlanom okruzenju tiho ne izvrsi - njegova
 * detekcija okruzenja ne prepozna browser - pa se fajl pravi rucno.
 */
function preuzmi(blob, ime) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = ime;
  a.style.display = 'none';
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

let fontKeshiran = null;

/**
 * Ugradi DejaVu Sans u dokument.
 *
 * Ugradjeni jsPDF fontovi koriste WinAnsi koji nema č, ć, đ, pa bi bez
 * ovoga nasa slova ispala iz PDF-a. Isti fajl se registruje i kao bold -
 * zaglavlja se razlikuju bojom podloge, ne debljinom, cime se stedi
 * drugih ~700 kB.
 */
async function ugradiFont(doc) {
  if (!fontKeshiran) {
    const odgovor = await fetch(fontUrl);
    if (!odgovor.ok) throw new Error('Font se nije mogao učitati');
    fontKeshiran = uBase64(await odgovor.arrayBuffer());
  }
  doc.addFileToVFS('DejaVuSans.ttf', fontKeshiran);
  doc.addFont('DejaVuSans.ttf', 'DejaVu', 'normal');
  doc.addFont('DejaVuSans.ttf', 'DejaVu', 'bold');
  doc.setFont('DejaVu', 'normal');
}

/* ------------------------------------------------------------------ */
/* PDF                                                                 */
/* ------------------------------------------------------------------ */

export async function izvoziPDF(r, podaci) {
  const [{ jsPDF }, autoTableModul] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const autoTable = autoTableModul.default || autoTableModul.autoTable;

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  await ugradiFont(doc);

  doc.setFontSize(15);
  doc.text('Obračun doprinosa i poreza na dohodak', 14, 18);
  doc.setFontSize(9);
  doc.text('Samostalna djelatnost — Zeničko-dobojski kanton', 14, 24);

  autoTable(doc, {
    startY: 30,
    head: [['Stavka', '%', 'Iznos (KM)']],
    body: redoviObracuna(r).map(x => x.sekcija
      ? [{ content: x.sekcija, colSpan: 3, styles: { fillColor: [217, 228, 245], textColor: [0, 51, 153] } }]
      : [x.naziv, x.postotak, fmt(x.fening)]),
    theme: 'grid',
    styles: { font: 'DejaVu', fontSize: 9 },
    headStyles: { font: 'DejaVu', fillColor: [227, 225, 211], textColor: [0, 0, 0] },
    columnStyles: { 1: { halign: 'right', cellWidth: 24 }, 2: { halign: 'right', cellWidth: 32 } },
    didParseCell: d => {
      const prvi = d.row.raw[0];
      if (d.section !== 'body' || typeof prvi !== 'string') return;
      if (prvi === 'Ukupno za uplatu') d.cell.styles.fillColor = [229, 255, 217];
      if (prvi === 'Ukupno za zadržat') {
        d.cell.styles.fillColor = [195, 235, 166];
        d.cell.styles.fontSize = 11;
      }
    },
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    head: [['Uplatnica', 'Primalac', 'Račun primaoca', 'Vrsta prihoda', 'Iznos (KM)']],
    body: redoviUplatnicaPDF(r),
    foot: [['', '', '', 'Ukupno', fmt(r.ukupno)]],
    theme: 'grid',
    styles: { font: 'DejaVu', fontSize: 8 },
    headStyles: { font: 'DejaVu', fillColor: [227, 225, 211], textColor: [0, 0, 0] },
    footStyles: { font: 'DejaVu', fillColor: [229, 255, 217], textColor: [0, 0, 0] },
    columnStyles: { 0: { cellWidth: 16 }, 4: { halign: 'right', cellWidth: 26 } },
  });

  doc.setFontSize(7.5);
  doc.setTextColor(110);
  doc.text(
    'Poziv na broj ' + FIKSNE_NULE.poziv + ' · budžetska organizacija ' + FIKSNE_NULE.organizacija
    + '. Stope i računi vrijede za ZE-DO kanton — provjeriti prije uplate.',
    14, doc.lastAutoTable.finalY + 7, { maxWidth: 180 }
  );

  doc.save(nazivFajla(r, podaci) + '.pdf');
}

/* ------------------------------------------------------------------ */
/* Excel                                                               */
/* ------------------------------------------------------------------ */

export async function izvoziExcel(r, podaci) {
  const modul = await import('xlsx');
  const XLSX = modul.utils ? modul : modul.default;

  const kw = XLSX.utils.book_new();

  const list1 = XLSX.utils.aoa_to_sheet(aoaObracun(r));
  list1['!cols'] = [{ wch: 34 }, { wch: 10 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(kw, list1, 'Obračun');

  const list2 = XLSX.utils.aoa_to_sheet(aoaUplatnice(r));
  list2['!cols'] = [{ wch: 4 }, { wch: 32 }, { wch: 20 }, { wch: 14 }, { wch: 40 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(kw, list2, 'Uplatnice');

  const bajtovi = XLSX.write(kw, { bookType: 'xlsx', type: 'array' });
  if (!bajtovi || !bajtovi.byteLength) throw new Error('Excel fajl je ispao prazan');

  preuzmi(
    new Blob([bajtovi], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    nazivFajla(r, podaci) + '.xlsx'
  );
}

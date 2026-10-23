/* ============================================================================
   Scrittore .xlsx e .zip minimale, senza librerie (gira offline su tablet e in Node).

   Serve alla pagina «dopo il campo» per produrre gli stessi file che in Shiny scrive
   openxlsx: un foglio per tabella, intestazione in grassetto su fondo verde chiaro,
   prima riga bloccata, colonne di contrassegno forzate a TESTO (il contrassegno è
   una stringa opaca: non deve mai diventare un numero), larghezza colonne adattata.
   Lo zip è «stored» (senza compressione): file piccoli, nessun rischio di
   incompatibilità, apribile da qualsiasi programma.
   ========================================================================== */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.AccXlsx = factory();
})(typeof self !== 'undefined' ? self : this, function () {
'use strict';

const enc = (s) => new TextEncoder().encode(s);

/* ---------- ZIP (stored) --------------------------------------------------- */
let CRC_TABLE = null;
function crc32(u8) {
  if (!CRC_TABLE) {
    CRC_TABLE = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      CRC_TABLE[n] = c >>> 0;
    }
  }
  let c = 0xFFFFFFFF;
  for (let i = 0; i < u8.length; i++) c = CRC_TABLE[(c ^ u8[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function dosDateTime(d) {
  const t = ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & 0xFFFF;
  const dt = (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xFFFF;
  return { t, d: dt };
}
/* files = [{name, data: Uint8Array|string}] → Uint8Array dello zip */
function zipStore(files, quando) {
  const now = dosDateTime(quando || new Date());
  const locali = [], centrali = [];
  let offset = 0;
  const u16 = (v) => [v & 0xFF, (v >>> 8) & 0xFF];
  const u32 = (v) => [v & 0xFF, (v >>> 8) & 0xFF, (v >>> 16) & 0xFF, (v >>> 24) & 0xFF];
  for (const f of files) {
    const nome = enc(f.name);
    const dati = typeof f.data === 'string' ? enc(f.data) : f.data;
    const crc = crc32(dati);
    const head = Uint8Array.from([].concat(
      u32(0x04034b50), u16(20), u16(0x0800), u16(0), u16(now.t), u16(now.d),
      u32(crc), u32(dati.length), u32(dati.length), u16(nome.length), u16(0)));
    locali.push(head, nome, dati);
    centrali.push(Uint8Array.from([].concat(
      u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(now.t), u16(now.d),
      u32(crc), u32(dati.length), u32(dati.length), u16(nome.length), u16(0), u16(0),
      u16(0), u16(0), u32(0), u32(offset))), nome);
    offset += head.length + nome.length + dati.length;
  }
  const cdSize = centrali.reduce((s, p) => s + p.length, 0);
  const fine = Uint8Array.from([].concat(
    u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length), u32(cdSize), u32(offset), u16(0)));
  const parts = locali.concat(centrali, [fine]);
  const out = new Uint8Array(parts.reduce((s, p) => s + p.length, 0));
  let pos = 0;
  for (const p of parts) { out.set(p, pos); pos += p.length; }
  return out;
}

/* ---------- XLSX ----------------------------------------------------------- */
const xe = (s) => String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function colLetter(i) {                       // 0 → A, 25 → Z, 26 → AA
  let s = ''; i++;
  while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); }
  return s;
}
/* Nome foglio come in R (.ac_add_sheet): solo [A-Za-z0-9_], max 31 caratteri. */
function nomeFoglio(s) { return String(s).replace(/[^A-Za-z0-9_]+/g, '_').slice(0, 31) || 'foglio'; }

/* sheet = {nome, colonne:[...], righe:[{col: valore}], testo:[colonne da forzare a testo]}
   Valori: stringa → testo; numero → numero; null/undefined → cella vuota. */
function sheetXml(sh) {
  const cols = sh.colonne, testo = new Set(sh.testo || []);
  const stile = cols.map((c) => (testo.has(c) ? 2 : 0));
  const largh = cols.map((c, j) => {
    let m = String(c).length;
    for (const r of sh.righe) { const v = r[c]; if (v != null) m = Math.max(m, String(v).length); }
    return Math.min(60, m + 2);
  });
  let x = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>' +
    '<selection pane="bottomLeft"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/>';
  if (cols.length) x += '<cols>' + largh.map((w, j) => '<col min="' + (j + 1) + '" max="' + (j + 1) + '" width="' + w + '" customWidth="1"/>').join('') + '</cols>';
  x += '<sheetData><row r="1">' + cols.map((c, j) =>
    '<c r="' + colLetter(j) + '1" s="1" t="inlineStr"><is><t xml:space="preserve">' + xe(c) + '</t></is></c>').join('') + '</row>';
  sh.righe.forEach((r, i) => {
    const n = i + 2;
    let cells = '';
    cols.forEach((c, j) => {
      const v = r[c];
      if (v == null || v === '') return;
      const ref = colLetter(j) + n;
      if (typeof v === 'number' && Number.isFinite(v) && !testo.has(c)) cells += '<c r="' + ref + '"><v>' + v + '</v></c>';
      else cells += '<c r="' + ref + '"' + (stile[j] ? ' s="' + stile[j] + '"' : '') + ' t="inlineStr"><is><t xml:space="preserve">' + xe(v) + '</t></is></c>';
    });
    x += '<row r="' + n + '">' + cells + '</row>';
  });
  return x + '</sheetData></worksheet>';
}

/* sheets = [sheet] → Uint8Array del .xlsx */
function xlsxBuild(sheets) {
  const nomi = [];
  const usati = new Set();
  sheets.forEach((s) => {                      // nomi foglio unici (Excel non ammette doppioni)
    let n = nomeFoglio(s.nome), k = 2;
    while (usati.has(n.toLowerCase())) n = nomeFoglio(s.nome).slice(0, 28) + '_' + (k++);
    usati.add(n.toLowerCase()); nomi.push(n);
  });
  const files = [];
  files.push({ name: '[Content_Types].xml', data:
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
    sheets.map((s, i) => '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('') +
    '</Types>' });
  files.push({ name: '_rels/.rels', data:
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' });
  files.push({ name: 'xl/workbook.xml', data:
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    '<sheets>' + nomi.map((n, i) => '<sheet name="' + xe(n) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>').join('') + '</sheets></workbook>' });
  files.push({ name: 'xl/_rels/workbook.xml.rels', data:
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    sheets.map((s, i) => '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>').join('') +
    '<Relationship Id="rId' + (sheets.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>' });
  files.push({ name: 'xl/styles.xml', data:
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
    '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>' +
    '<fill><patternFill patternType="solid"><fgColor rgb="FFE2EFDA"/><bgColor indexed="64"/></patternFill></fill></fills>' +
    '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border>' +
    '<border><left/><right/><top/><bottom style="thin"><color auto="1"/></bottom><diagonal/></border></borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    '<cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
    '<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf>' +
    '<xf numFmtId="49" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs>' +
    '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>' });
  sheets.forEach((s, i) => files.push({ name: 'xl/worksheets/sheet' + (i + 1) + '.xml', data: sheetXml(s) }));
  return zipStore(files);
}

return { crc32, zipStore, xlsxBuild, colLetter, nomeFoglio };
});

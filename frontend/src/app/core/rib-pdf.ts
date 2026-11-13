/**
 * Génère un PDF minimal, entièrement côté navigateur, sans aucune dépendance.
 * Suffisant pour un RIB : une page A4, polices standard Helvetica (encodage WinAnsi).
 */

export interface RibLine {
  label: string;
  value: string;
}

export interface RibPdfOptions {
  title: string;
  subtitle?: string;
  lines: RibLine[];
  footer?: string;
}

/** Échappe les caractères spéciaux d'une chaîne littérale PDF. */
function escapePdfText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

export function buildRibPdf(opts: RibPdfOptions): Blob {
  const esc = escapePdfText;

  // ---- Flux de contenu (opérateurs de dessin de texte) ----
  const parts: string[] = [];
  let y = 790;

  parts.push('0.078 0.239 0.180 rg'); // vert forêt pour le titre
  parts.push(`BT /F2 20 Tf 1 0 0 1 56 ${y} Tm (${esc(opts.title)}) Tj ET`);
  y -= 24;

  if (opts.subtitle) {
    parts.push('0.337 0.420 0.376 rg');
    parts.push(`BT /F1 11 Tf 1 0 0 1 56 ${y} Tm (${esc(opts.subtitle)}) Tj ET`);
    y -= 12;
  }
  y -= 26;

  for (const line of opts.lines) {
    parts.push('0.337 0.420 0.376 rg'); // libellé atténué
    parts.push(`BT /F1 9.5 Tf 1 0 0 1 56 ${y} Tm (${esc(line.label)}) Tj ET`);
    y -= 17;
    parts.push('0.078 0.125 0.106 rg'); // valeur quasi noire
    parts.push(`BT /F2 13 Tf 1 0 0 1 56 ${y} Tm (${esc(line.value)}) Tj ET`);
    y -= 30;
  }

  if (opts.footer) {
    parts.push('0.50 0.56 0.52 rg');
    parts.push(`BT /F1 8.5 Tf 1 0 0 1 56 56 Tm (${esc(opts.footer)}) Tj ET`);
  }

  const content = parts.join('\n');

  // ---- Objets PDF ----
  const objects: string[] = [];
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[2] = '<< /Type /Pages /Kids [3 0 R] /Count 1 >>';
  objects[3] =
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] ' +
    '/Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>';
  objects[4] =
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
  objects[5] =
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
  objects[6] = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`;

  // ---- Assemblage + table xref ----
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  for (let i = 1; i <= 6; i++) {
    offsets[i] = pdf.length;
    pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xrefOffset = pdf.length;
  pdf += 'xref\n0 7\n0000000000 65535 f \n';
  for (let i = 1; i <= 6; i++) {
    pdf += offsets[i].toString().padStart(10, '0') + ' 00000 n \n';
  }
  pdf += `trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  // ---- Conversion en octets (Latin-1, avec € = 0x80) ----
  const bytes = new Uint8Array(pdf.length);
  for (let i = 0; i < pdf.length; i++) {
    let code = pdf.charCodeAt(i);
    if (code === 0x20ac) code = 0x80; // signe euro en WinAnsi
    else if (code > 0xff) code = 0x3f; // caractère non pris en charge -> « ? »
    bytes[i] = code;
  }
  return new Blob([bytes], { type: 'application/pdf' });
}

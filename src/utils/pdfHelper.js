import { jsPDF } from 'jspdf';

// Detect if text contains Hindi/Devanagari characters
export function hasHindi(text) {
  return /[\u0900-\u097F]/.test(text || '');
}

// Render text using canvas (supports Hindi conjuncts) and draw as image in PDF
export function drawText(doc, text, x, y, options = {}) {
  if (!hasHindi(text)) {
    // English — use normal jsPDF text
    if (options.bold) doc.setFont('helvetica', 'bold');
    else doc.setFont('helvetica', 'normal');
    if (options.size) doc.setFontSize(options.size);
    if (options.color) doc.setTextColor(...options.color);
    const textOpts = {};
    if (options.align) textOpts.align = options.align;
    if (options.maxWidth) textOpts.maxWidth = options.maxWidth;
    doc.text(text, x, y, textOpts);
    return;
  }

  // Hindi — render via canvas
  const fontSize = options.size || doc.getFontSize();
  const scale = 3; // high res
  const canvasFontSize = fontSize * scale;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const fontWeight = options.bold ? 'bold' : 'normal';
  ctx.font = `${fontWeight} ${canvasFontSize}px "Noto Sans Devanagari", "Mangal", "Devanagari", sans-serif`;
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const textHeight = canvasFontSize * 1.3;
  canvas.width = Math.ceil(textWidth) + 4;
  canvas.height = Math.ceil(textHeight) + 4;
  
  // Redraw after resize
  ctx.font = `${fontWeight} ${canvasFontSize}px "Noto Sans Devanagari", "Mangal", "Devanagari", sans-serif`;
  ctx.fillStyle = options.color ? `rgb(${options.color.join(',')})` : '#000000';
  ctx.textBaseline = 'top';
  ctx.fillText(text, 0, 2);

  // Convert to image and add to PDF
  const imgData = canvas.toDataURL('image/png');
  const pdfTextWidth = (canvas.width / scale) * (fontSize / canvasFontSize) * scale;
  const pdfTextHeight = (canvas.height / scale) * (fontSize / canvasFontSize) * scale;
  const mmWidth = pdfTextWidth * 0.264583;
  const mmHeight = pdfTextHeight * 0.264583;

  let drawX = x;
  if (options.align === 'center') drawX = x - mmWidth / 2;
  else if (options.align === 'right') drawX = x - mmWidth;

  // maxWidth constraint
  let finalWidth = mmWidth;
  let finalHeight = mmHeight;
  if (options.maxWidth && mmWidth > options.maxWidth) {
    const ratio = options.maxWidth / mmWidth;
    finalWidth = options.maxWidth;
    finalHeight = mmHeight * ratio;
  }

  doc.addImage(imgData, 'PNG', drawX, y - finalHeight * 0.75, finalWidth, finalHeight);
}

// Set font helper (for non-Hindi text parts)
export function setFont(doc, text, style, size) {
  if (!hasHindi(text)) {
    doc.setFont('helvetica', style || 'normal');
  }
  if (size) doc.setFontSize(size);
}

// Dummy registerHindiFont (kept for backward compat, no-op now)
export function registerHindiFont(doc) {}

// Create jsPDF instance
export function createPDF(options) {
  return new jsPDF(options);
}

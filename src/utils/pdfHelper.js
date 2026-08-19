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
  const scale = 4; // high res for clarity
  const canvasFontSize = fontSize * scale;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const fontWeight = options.bold ? 'bold' : 'normal';
  const fontStr = `${fontWeight} ${canvasFontSize}px "Noto Sans Devanagari", "Mangal", sans-serif`;
  ctx.font = fontStr;
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  // Extra padding top for shirorekha and matras
  const padTop = Math.ceil(canvasFontSize * 0.35);
  const padBottom = Math.ceil(canvasFontSize * 0.2);
  const totalHeight = canvasFontSize + padTop + padBottom;
  canvas.width = Math.ceil(textWidth) + 8;
  canvas.height = totalHeight;

  // Redraw after canvas resize
  ctx.font = fontStr;
  ctx.fillStyle = options.color ? `rgb(${options.color.join(',')})` : '#000000';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, 2, canvas.height - padBottom);

  // Convert to image and add to PDF
  const imgData = canvas.toDataURL('image/png');
  const mmWidth = (canvas.width / scale) * 0.264583;
  const mmHeight = (canvas.height / scale) * 0.264583;

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

  // Position so baseline aligns with y
  doc.addImage(imgData, 'PNG', drawX, y - finalHeight + (padBottom / scale) * 0.264583, finalWidth, finalHeight);
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

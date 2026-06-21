import { jsPDF } from 'jspdf';
import { HINDI_FONT } from './hindiFont';

// Register Hindi font with jsPDF instance
export function registerHindiFont(doc) {
  doc.addFileToVFS('NotoSansDevanagari.ttf', HINDI_FONT);
  doc.addFont('NotoSansDevanagari.ttf', 'NotoSans', 'normal');
}

// Detect if text contains Hindi/Devanagari characters
export function hasHindi(text) {
  return /[\u0900-\u097F]/.test(text || '');
}

// Set appropriate font based on text content
export function setFont(doc, text, style, size) {
  if (hasHindi(text)) {
    doc.setFont('NotoSans', 'normal');
  } else {
    doc.setFont('helvetica', style || 'normal');
  }
  if (size) doc.setFontSize(size);
}

// Create jsPDF instance with Hindi font pre-registered
export function createPDF(options) {
  const doc = new jsPDF(options);
  registerHindiFont(doc);
  return doc;
}

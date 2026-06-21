import { jsPDF } from 'jspdf';
import { registerHindiFont, setFont, hasHindi } from './pdfHelper';

// Dynamic product order based on group + sortOrder from Firebase
// Products are sorted by: group order first, then sortOrder within group
function getProductOrder(products, groupOrder) {
  if (!groupOrder || groupOrder.length === 0) {
    groupOrder = ['TM', 'SM', 'LITE DAHI', 'PREMIUM DAHI', 'PANEER', 'GHEE', 'OTHER'];
  }
  return products
    .filter(p => p.active !== false)
    .sort((a, b) => {
      const aGroup = (a.group || 'OTHER').toUpperCase();
      const bGroup = (b.group || 'OTHER').toUpperCase();
      const aIdx = groupOrder.indexOf(aGroup) === -1 ? 999 : groupOrder.indexOf(aGroup);
      const bIdx = groupOrder.indexOf(bGroup) === -1 ? 999 : groupOrder.indexOf(bGroup);
      if (aIdx !== bIdx) return aIdx - bIdx;
      return (a.sortOrder || 0) - (b.sortOrder || 0);
    })
    .map(p => p.name);
}

/**
 * REGISTER PDF
 * Fixed products as columns, retailers as rows
 * Other items section below for optional products
 * Prices from Firestore products collection
 */
export function generateRegisterPDF({ retailers, products, orders, area, date }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
  registerHindiFont(doc);
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const m = 4;

  // Price map from products
  const priceMap = {};
  products.forEach(p => { priceMap[p.name] = p.price || 0; });

  // Fixed products that exist in Firestore
  const groupOrder = (products[0] && products[0]._groupOrder) || null;
  const fixedProducts = getProductOrder(products, groupOrder);

  // Order map
  const orderMap = {};
  orders.forEach(o => {
    const key = o.phone || o.retailerId;
    if (!key) return;
    if (!orderMap[key]) orderMap[key] = { items: {}, total: 0 };
    (o.items || []).forEach(item => {
      const qtyNum = parseFloat(String(item.qty).replace(/[^0-9.]/g, '')) || 0;
      orderMap[key].items[item.name] = (orderMap[key].items[item.name] || 0) + qtyNum;
    });
    orderMap[key].total += (o.total || 0);
  });

  // Layout
  const numW = 8;
  const retailerW = 40;
  const totalW = 18;
  const signW = 18;
  const fixedColW = numW + retailerW + totalW + signW;
  const pageW = w - (m * 2);
  const availForProds = pageW - fixedColW;
  const prodCount = fixedProducts.length;
  const prodW = Math.min(Math.floor(availForProds / Math.min(prodCount, 14)), 14);
  const prodsPerRow = Math.floor(availForProds / prodW);

  // Split fixed products into sub-rows if too many
  const prodRows = [];
  for (let i = 0; i < fixedProducts.length; i += prodsPerRow) {
    prodRows.push(fixedProducts.slice(i, i + prodsPerRow));
  }
  if (prodRows.length === 0) prodRows.push([]);

  const subRowH = 9;
  const totalSubRows = prodRows.length;
  const retailerRowH = totalSubRows * subRowH;

  let y = m;
  let pageNum = 1;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('LUCY GARDEN', m, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Fresh Dairy Supply', m, y + 10);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('DAILY DELIVERY SHEET', w / 2, y + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  setFont(doc, area, 'normal', 9);
  doc.text(`Area: ${area}  |  Date: ${date}`, w / 2, y + 10, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`Orders: ${orders.length}/${retailers.length}`, w - m, y + 5, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Ph: 9939079107', w - m, y + 10, { align: 'right' });
  y += 13;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.line(m, y, w - m, y);
  y += 3;

  // Table header
  const drawTableHeader = () => {
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);

    // No, Retailer, Total, Sign headers (span all sub-rows)
    doc.setFillColor(230, 230, 230);
    doc.rect(m, y, numW, retailerRowH, 'FD');
    doc.rect(m + numW, y, retailerW, retailerRowH, 'FD');
    const totalX = m + numW + retailerW + prodsPerRow * prodW;
    doc.rect(totalX, y, totalW, retailerRowH, 'FD');
    doc.rect(totalX + totalW, y, signW, retailerRowH, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);
    doc.text('#', m + numW / 2, y + retailerRowH / 2 + 1, { align: 'center' });
    doc.text('RETAILER', m + numW + 2, y + retailerRowH / 2 + 1);
    doc.text('TOTAL', totalX + totalW / 2, y + retailerRowH / 2 + 1, { align: 'center' });
    doc.text('SIGN', totalX + totalW + signW / 2, y + retailerRowH / 2 + 1, { align: 'center' });

    // Product column headers per sub-row
    prodRows.forEach((pRow, rowIdx) => {
      const rowY = y + (rowIdx * subRowH);
      let cx = m + numW + retailerW;
      pRow.forEach(name => {
        doc.setFillColor(230, 230, 230);
        doc.rect(cx, rowY, prodW, subRowH, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(0, 0, 0);
        let shortName = name;
        if (shortName.length > prodW / 1.5) shortName = shortName.slice(0, Math.floor(prodW / 1.5));
        const lines = doc.splitTextToSize(shortName, prodW - 1.5);
        const ty = lines.length > 1 ? rowY + 2.5 : rowY + subRowH / 2 + 0.5;
        lines.forEach((line, li) => {
          if (li < 2) doc.text(line, cx + prodW / 2, ty + (li * 2.8), { align: 'center' });
        });
        cx += prodW;
      });
    });

    y += retailerRowH;
  };

  drawTableHeader();

  // Data rows
  retailers.forEach((ret, i) => {
    if (y + retailerRowH > h - 8) {
      doc.addPage();
      pageNum++;
      y = m;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(0, 0, 0);
      doc.text(`${area} | ${date} | Page ${pageNum}`, w - m, y + 3, { align: 'right' });
      y += 5;
      drawTableHeader();
    }

    const oData = orderMap[ret.phone];
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.1);

    // # + Retailer (span all sub-rows)
    doc.setFillColor(255, 255, 255);
    doc.rect(m, y, numW, retailerRowH, 'FD');
    doc.rect(m + numW, y, retailerW, retailerRowH, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text(`${i + 1}`, m + numW / 2, y + retailerRowH / 2 + 0.5, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    const retName = (ret.name || '-').slice(0, 18);
    setFont(doc, retName, 'bold', 7.5);
    doc.text(retName, m + numW + 2, y + retailerRowH / 2 + 0.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    // Total + Sign (span all sub-rows)
    const totalX = m + numW + retailerW + prodsPerRow * prodW;
    doc.setFillColor(255, 255, 255);
    doc.rect(totalX, y, totalW, retailerRowH, 'FD');
    doc.rect(totalX + totalW, y, signW, retailerRowH, 'FD');
    if (oData && oData.total > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(`${oData.total.toFixed(0)}`, totalX + totalW / 2, y + retailerRowH / 2 + 1, { align: 'center' });
    }

    // Product qty cells
    prodRows.forEach((pRow, rowIdx) => {
      const rowY = y + (rowIdx * subRowH);
      let cx = m + numW + retailerW;
      pRow.forEach(name => {
        doc.setFillColor(255, 255, 255);
        doc.rect(cx, rowY, prodW, subRowH, 'FD');
        if (oData && oData.items[name]) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11);
          doc.setTextColor(0, 0, 0);
          doc.text(`${oData.items[name]}`, cx + prodW / 2, rowY + subRowH / 2 + 2, { align: 'center' });
        }
        cx += prodW;
      });
    });

    y += retailerRowH;
  });

  // Footer line
  y += 3;
  if (y > h - 8) { doc.addPage(); y = m; }
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.line(m, y, w - m, y);
  y += 4;
  const totalAmt = orders.reduce((s, o) => s + (o.total || 0), 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(`Grand Total: Rs. ${totalAmt.toFixed(2)}  |  Orders: ${orders.length}`, m, y);
  doc.setFontSize(8);
  doc.text('Driver: ____________  Sign: ____________  Collected: Rs. __________', w - m, y, { align: 'right' });

  // ===== OTHER ITEMS SECTION =====
  const optionalNames = products.filter(p => p.active !== false && !fixedProducts.includes(p.name)).map(p => p.name);
  const otherItems = [];
  retailers.forEach(ret => {
    const oData = orderMap[ret.phone];
    if (!oData) return;
    Object.entries(oData.items).forEach(([itemName, qty]) => {
      if (optionalNames.includes(itemName) && qty > 0) {
        otherItems.push({ retailer: ret.name, phone: ret.phone, item: itemName, qty, price: priceMap[itemName] || 0 });
      }
    });
  });

  if (otherItems.length > 0) {
    y += 6;
    if (y > h - 30) { doc.addPage(); y = m; }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('OTHER ITEMS', m, y);
    y += 4;

    const otH = 7;
    // Header
    doc.setFillColor(230, 230, 230);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.15);
    doc.rect(m, y, pageW, otH, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);
    doc.text('#', m + 4, y + 5);
    doc.text('Retailer', m + 10, y + 5);
    doc.text('Item', m + 55, y + 5);
    doc.text('Qty', m + 110, y + 5);
    doc.text('Rate', m + 130, y + 5);
    doc.text('Amount', m + 155, y + 5);
    y += otH;

    otherItems.forEach((oi, idx) => {
      if (y + otH > h - 5) { doc.addPage(); y = m; }
      doc.setFillColor(255, 255, 255);
      doc.rect(m, y, pageW, otH, 'FD');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(0, 0, 0);
      doc.text(`${idx + 1}`, m + 4, y + 5);
      doc.setFont('helvetica', 'bold');
      const oiRetName = oi.retailer.slice(0, 22);
      setFont(doc, oiRetName, 'bold', 7);
      doc.text(oiRetName, m + 10, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.text(oi.item, m + 55, y + 5);
      doc.setFont('helvetica', 'bold');
      doc.text(`${oi.qty}`, m + 110, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.text(`${oi.price.toFixed(2)}`, m + 130, y + 5);
      doc.setFont('helvetica', 'bold');
      doc.text(`${(oi.qty * oi.price).toFixed(2)}`, m + 155, y + 5);
      y += otH;
    });
  }

  // Generation detail on last page
  const genText = `Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(6); doc.setTextColor(150, 150, 150);
  doc.text(genText, w - m, h - 3, { align: 'right' });

  doc.save(`LG_Register_${area.replace(/\s/g, '_')}_${date.replace(/[\s,]/g, '')}.pdf`);
}

/**
 * CHALAN PDF - 3 per page, retailer delivery slips
 */
export function generateChalanPDF({ retailers, orders, area, date }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  registerHindiFont(doc);
  const w = doc.internal.pageSize.getWidth();
  const m = 6;
  const slipH = 90;
  const slipW = w - (m * 2);

  const ordersByRetailer = {};
  orders.forEach(o => {
    const key = o.phone || o.retailerId;
    if (!key) return;
    if (!ordersByRetailer[key]) ordersByRetailer[key] = [];
    ordersByRetailer[key].push(o);
  });

  const retailerMap = {};
  retailers.forEach(r => { retailerMap[r.phone] = r; });

  const retailerPhones = Object.keys(ordersByRetailer);
  if (retailerPhones.length === 0) return;

  let slipCount = 0;

  retailerPhones.forEach((phone) => {
    if (slipCount > 0 && slipCount % 3 === 0) doc.addPage();
    const slotIdx = slipCount % 3;
    const baseY = m + (slotIdx * slipH) + (slotIdx * 3);

    const ret = retailerMap[phone] || {};
    const retOrders = ordersByRetailer[phone];

    const items = [];
    let orderTotal = 0;
    retOrders.forEach(o => {
      (o.items || []).forEach(item => {
        const qtyNum = parseFloat(String(item.qty).replace(/[^0-9.]/g, '')) || 0;
        const rate = item.unitPrice || item.price || 0;
        const amount = item.price || (qtyNum * rate);
        items.push({ name: item.name, qty: qtyNum, rate, amount });
      });
      orderTotal += (o.total || 0);
    });

    let y = baseY;
    const x = m;

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.rect(x, y, slipW, slipH);

    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('LUCY GARDEN', x + slipW / 2, y, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('Fresh Dairy Supply | Ph: 9939079107', x + slipW / 2, y + 4, { align: 'center' });

    y += 7;
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.15);
    doc.line(x + 3, y, x + slipW - 3, y);
    y += 3;

    doc.setFontSize(7);
    doc.text(`Date: ${date}`, x + 3, y + 2);
    setFont(doc, area, 'normal', 7);
    doc.text(`Area: ${area}`, x + slipW - 3, y + 2, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    y += 5;

    const retNameChalan = ret.name || retOrders[0]?.retailer || '-';
    setFont(doc, retNameChalan, 'bold', 8.5);
    doc.text(retNameChalan, x + 3, y + 2);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text(`${phone}${ret.shop ? '  |  ' + ret.shop : ''}`, x + 3, y + 6);
    y += 9;

    const tX = x + 3;
    const tW = slipW - 6;
    const cols = { num: 6, name: tW - 6 - 18 - 22 - 22, qty: 18, rate: 22, amt: 22 };
    const rowH = 5;

    doc.setFillColor(240, 240, 240);
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.1);
    doc.rect(tX, y, tW, rowH, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(0, 0, 0);
    let cx = tX;
    doc.text('#', cx + cols.num / 2, y + 3.5, { align: 'center' }); cx += cols.num;
    doc.text('Item', cx + 2, y + 3.5); cx += cols.name;
    doc.text('Qty', cx + cols.qty / 2, y + 3.5, { align: 'center' }); cx += cols.qty;
    doc.text('Rate', cx + cols.rate / 2, y + 3.5, { align: 'center' }); cx += cols.rate;
    doc.text('Amt', cx + cols.amt / 2, y + 3.5, { align: 'center' });
    y += rowH;

    const maxItems = Math.min(items.length, 8);
    items.slice(0, maxItems).forEach((item, i) => {
      doc.setFillColor(255, 255, 255);
      doc.rect(tX, y, tW, rowH, 'FD');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(0, 0, 0);
      cx = tX;
      doc.text(`${i + 1}`, cx + cols.num / 2, y + 3.5, { align: 'center' }); cx += cols.num;
      const itemNameChalan = item.name.slice(0, 20);
      setFont(doc, itemNameChalan, 'bold', 6.5);
      doc.text(itemNameChalan, cx + 1, y + 3.5); cx += cols.name;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.text(`${item.qty}`, cx + cols.qty / 2, y + 3.5, { align: 'center' }); cx += cols.qty;
      doc.text(item.rate > 0 ? `${item.rate.toFixed(2)}` : '-', cx + cols.rate / 2, y + 3.5, { align: 'center' }); cx += cols.rate;
      doc.setFont('helvetica', 'bold');
      doc.text(item.amount > 0 ? `${item.amount.toFixed(2)}` : '-', cx + cols.amt / 2, y + 3.5, { align: 'center' });
      y += rowH;
    });

    doc.setFillColor(240, 240, 240);
    doc.rect(tX, y, tW, rowH + 1, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('TOTAL', tX + cols.num + 2, y + 4);
    doc.text(`Rs. ${orderTotal.toFixed(2)}`, tX + tW - 3, y + 4, { align: 'right' });

    const sigY = baseY + slipH - 8;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.15);
    doc.line(x + slipW - 55, sigY, x + slipW - 3, sigY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(80, 80, 80);
    doc.text('Retailer Signature', x + slipW - 55, sigY + 3);

    if (slotIdx < 2) {
      const cutY = baseY + slipH + 1.5;
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.2);
      doc.setLineDashPattern([2, 2], 0);
      doc.line(m, cutY, w - m, cutY);
      doc.setLineDashPattern([], 0);
    }

    slipCount++;
  });

  // Generation detail on last page
  const lastPage = doc.getNumberOfPages();
  doc.setPage(lastPage);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(6); doc.setTextColor(150, 150, 150);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`, w - m, doc.internal.pageSize.getHeight() - 3, { align: 'right' });

  doc.save(`LG_Chalan_${area.replace(/\s/g, '_')}_${date.replace(/[\s,]/g, '')}.pdf`);
}

// Legacy for driver panel
export function generateDeliveryPDFLegacy(orders, area, date) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  registerHindiFont(doc);
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  let y = 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(`LUCY GARDEN — ${area}`, w / 2, y + 5, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${date}  |  Orders: ${orders.length}`, w / 2, y + 10, { align: 'center' });
  y += 16;

  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.2);
  doc.line(10, y, w - 10, y);
  y += 5;

  orders.forEach((order, i) => {
    const items = order.items || [];
    const rowH = Math.max(items.length * 5 + 8, 14);
    if (y + rowH > h - 10) { doc.addPage(); y = 10; }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    const legacyRetName = `${i + 1}. ${order.retailer}  (${order.phone || ''})`;
    setFont(doc, order.retailer, 'bold', 9);
    doc.text(legacyRetName, 10, y + 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    items.forEach((item, j) => {
      doc.text(`• ${item.name}: ${item.qty}`, 14, y + 9 + (j * 5));
    });

    if (order.total > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text(`Rs.${order.total.toFixed(2)}`, w - 15, y + 4, { align: 'right' });
    }

    y += rowH;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.1);
    doc.line(10, y, w - 10, y);
    y += 3;
  });

  doc.setFont('helvetica', 'normal'); doc.setFontSize(6); doc.setTextColor(150, 150, 150);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`, w - 10, h - 3, { align: 'right' });

  doc.save(`LG_Driver_${area.replace(/\s/g, '_')}_${date.replace(/[\s,]/g, '')}.pdf`);
}

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, X, Printer, AlertTriangle } from 'lucide-react';
import { db, collection, getDocs, doc, cachedGetDoc } from '../../services/firebase';
import { formatPrice } from '../../utils/price';
import { TableSkeleton } from '../../components/LoadingSkeleton';

export default function PriceList() {
  const [products, setProducts] = useState([]);
  const [groups, setGroups] = useState({ daily: [], seasonal: [] });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const snap = await getDocs(collection(db, 'products'));
        setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => p.active !== false));
        const gDoc = await cachedGetDoc(doc(db, 'settings', 'productGroups'));
        if (gDoc.exists()) setGroups({ daily: gDoc.data().daily || [], seasonal: gDoc.data().seasonal || [], codes: gDoc.data().codes || {} });
      } catch (e) {}
      setLoading(false);
    }
    fetch();
  }, []);

  const sortByGroup = (list, type) => {
    const order = groups[type] || [];
    return [...list].sort((a, b) => {
      const ai = order.indexOf(a.group) === -1 ? 999 : order.indexOf(a.group);
      const bi = order.indexOf(b.group) === -1 ? 999 : order.indexOf(b.group);
      if (ai !== bi) return ai - bi;
      return (a.name || '').localeCompare(b.name || '');
    });
  };

  const daily = sortByGroup(products.filter(p => p.type === 'daily'), 'daily');
  const seasonal = sortByGroup(products.filter(p => p.type === 'seasonal'), 'seasonal');

  const filter = (list) => list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <TableSkeleton />;

  const ProductGroup = ({ title, list }) => {
    const filtered = filter(list);
    if (filtered.length === 0) return null;
    let lastGroup = '';
    return (
      <div className="mb-5">
        <p className="text-sm font-bold text-gray-800 dark:text-white mb-2">{title} <span className="text-gray-400 font-normal">({filtered.length})</span></p>
        <div className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#222222] overflow-hidden">
          {filtered.map((p, i) => {
            const showGroupHeader = p.group && p.group !== lastGroup;
            lastGroup = p.group;
            return (
              <React.Fragment key={p.id}>
                {showGroupHeader && (
                  <div className="px-4 py-1.5 bg-gray-50 dark:bg-[#1a1a1a]/50 border-b border-gray-100 dark:border-[#222222]">
                    <p className="text-[10px] font-bold text-royal-600 dark:text-royal-300 uppercase tracking-wider">{p.group}</p>
                  </div>
                )}
                <div className={`flex items-center justify-between px-4 py-3 ${i < filtered.length - 1 ? 'border-b border-gray-50 dark:border-[#222222]/50' : ''}`}>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-white">{p.name}</p>
                    <p className="text-[10px] text-gray-400">{p.unit}</p>
                  </div>
                  <p className="text-sm font-black text-royal-700 dark:text-royal-300">{p.price > 0 ? formatPrice(p.price) : '—'}</p>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="pb-24 space-y-4">
      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-3 text-gray-400" />
        <input type="text" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-9 py-2.5 text-sm bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#222222] rounded-xl focus:outline-none focus:border-royal-300 dark:text-white" />
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-gray-200 dark:bg-[#222222] rounded-full flex items-center justify-center"><X size={10} className="text-gray-500" /></button>}
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-3.5 py-2.5">
        <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 text-center flex items-center justify-center gap-1.5"><AlertTriangle size={13} className="text-amber-500 shrink-0" /> Prices may change without prior notice. Confirm latest rates for bulk orders.</p>
      </div>

      {/* Print Rate Card */}
      <motion.button whileTap={{ scale: 0.93 }} onClick={async () => {
        const { jsPDF } = await import('jspdf');
        const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
        const w = pdf.internal.pageSize.getWidth(); const h = pdf.internal.pageSize.getHeight();
        const m = 12; let y = 0; const tableW = w - (m * 2);
        const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        pdf.setFillColor(15, 23, 42); pdf.rect(0, 0, w, 22, 'F');
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(14); pdf.setTextColor(255, 255, 255);
        pdf.text('LUCY GARDEN', m, 10);
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.text('Fresh Dairy Supply', m, 15);
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11);
        pdf.text('PRICE LIST', w - m, 10, { align: 'right' });
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8);
        pdf.text(`${products.length} products | ${today}`, w - m, 15, { align: 'right' });
        y = 26;
        pdf.setFont('helvetica', 'italic'); pdf.setFontSize(7); pdf.setTextColor(150, 100, 0);
        pdf.text('* Prices may change without prior notice.', m, y + 3); y += 7;
        const printGrouped = (title, list, groupOrder, showCode) => {
          if (list.length === 0) return;
          if (y + 12 > h - 12) { pdf.addPage(); y = 10; }
          pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.setTextColor(15, 23, 42);
          pdf.text(title, m, y + 4); y += 9;
          const usedGroups = [...new Set(list.map(p => p.group || 'OTHER'))];
          const ordered = (groupOrder || []).filter(g => usedGroups.includes(g));
          usedGroups.forEach(g => { if (!ordered.includes(g)) ordered.push(g); });
          ordered.forEach(g => {
            const gProducts = list.filter(p => (p.group || 'OTHER') === g);
            if (gProducts.length === 0) return;
            if (y + 14 > h - 12) { pdf.addPage(); y = 10; }
            pdf.setDrawColor(0); pdf.setLineWidth(0.3); pdf.rect(m, y, tableW, 6.5, 'D');
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8.5); pdf.setTextColor(0, 0, 0);
            const gCode = showCode ? groups.codes?.[g] : null;
            pdf.text(gCode ? `${g} (${gCode})` : g, m + 3, y + 4.5);
            pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7); pdf.setTextColor(80, 80, 80);
            pdf.text(`${gProducts.length} items`, m + tableW - 3, y + 4.5, { align: 'right' });
            y += 8;
            gProducts.forEach((p, i) => {
              if (y + 6.5 > h - 12) { pdf.addPage(); y = 10; }
              if (i % 2 === 0) { pdf.setFillColor(252, 252, 253); pdf.rect(m, y - 1, tableW, 6.5, 'F'); }
              pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(15, 23, 42);
              pdf.text((p.name || '').slice(0, 35), m + 5, y + 3);
              pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7.5); pdf.setTextColor(100, 116, 139);
              pdf.text(p.unit ? p.unit.toUpperCase() : '', m + 105, y + 3);
              pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9.5); pdf.setTextColor(15, 23, 42);
              pdf.text(p.price > 0 ? `Rs. ${p.price.toLocaleString('en-IN')}` : '-', m + tableW - 3, y + 3, { align: 'right' });
              y += 6.5;
            });
            y += 3;
          });
        };
        printGrouped('Daily Products', daily, groups.daily, true);
        printGrouped('Seasonal Products', seasonal, groups.seasonal, false);
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(6); pdf.setTextColor(150, 150, 150);
        pdf.text(`Generated: ${today} at ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} | Lucy Garden`, w / 2, h - 5, { align: 'center' });
        pdf.save(`LG_PriceList_${today.replace(/[\s,]/g, '')}.pdf`);
      }} className="flex items-center justify-center gap-2 w-full lg:w-auto lg:px-6 py-2.5 bg-[#0f172a] text-white text-xs font-bold rounded-xl">
        <Printer size={13} /> Download Price List
      </motion.button>

      {/* Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ProductGroup title="Daily Products" list={daily} />
        <ProductGroup title="Seasonal Products" list={seasonal} />
      </div>

      {filter(daily).length === 0 && filter(seasonal).length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-gray-400">No products found</p>
        </div>
      )}
    </div>
  );
}

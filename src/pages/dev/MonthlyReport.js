import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Copy, CheckCircle2, RefreshCw } from 'lucide-react';
import { db, collection, getDocs, query, where } from '../../services/firebase';

export default function MonthlyReport() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [copied, setCopied] = useState(false);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const generateReport = async () => {
    setLoading(true); setReport(null);
    try {
      const [year, mon] = month.split('-').map(Number);
      const monthStart = new Date(year, mon - 1, 1);
      const monthEnd = new Date(year, mon, 0, 23, 59, 59);
      const monthName = monthStart.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

      // Fetch data
      const [ordersSnap, usersSnap, ledgerSnap, errorsSnap, ticketsSnap, balSnap] = await Promise.all([
        getDocs(collection(db, 'orders')),
        getDocs(query(collection(db, 'users'), where('role', '==', 'retailer'))),
        getDocs(collection(db, 'ledger')),
        getDocs(collection(db, 'app_errors')),
        getDocs(collection(db, 'support_tickets')),
        getDocs(collection(db, 'retailer_balances')),
      ]);

      // Filter orders for selected month
      const allOrders = ordersSnap.docs.map(d => d.data());
      const monthOrders = allOrders.filter(o => {
        const created = o.createdAt ? new Date(o.createdAt) : null;
        return created && created >= monthStart && created <= monthEnd;
      });

      const delivered = monthOrders.filter(o => o.status === 'Delivered');
      const cancelled = monthOrders.filter(o => o.status === 'Cancelled');
      const returned = monthOrders.filter(o => o.status === 'Returned');
      const totalRevenue = delivered.reduce((s, o) => s + (o.actualTotal || o.total || 0), 0);

      // Ledger for month
      const monthLedger = ledgerSnap.docs.map(d => d.data()).filter(e => {
        const created = e.createdAt ? new Date(e.createdAt) : null;
        return created && created >= monthStart && created <= monthEnd;
      });
      const totalCollected = monthLedger.filter(e => e.type === 'credit').reduce((s, e) => s + Math.abs(e.amount || 0), 0);

      // Errors for month
      const monthErrors = errorsSnap.docs.map(d => d.data()).filter(e => {
        const ts = e.timestamp ? new Date(e.timestamp) : null;
        return ts && ts >= monthStart && ts <= monthEnd;
      });

      // Tickets for month
      const monthTickets = ticketsSnap.docs.map(d => d.data()).filter(t => {
        const created = t.createdAt ? new Date(t.createdAt) : null;
        return created && created >= monthStart && created <= monthEnd;
      });

      // Balances
      const totalDues = balSnap.docs.reduce((s, d) => s + (d.data().balance || 0), 0);
      const retailersWithDues = balSnap.docs.filter(d => (d.data().balance || 0) > 0).length;

      // Active retailers (ordered this month)
      const activePhones = [...new Set(monthOrders.map(o => o.phone))];

      const data = {
        month: monthName,
        totalRetailers: usersSnap.size,
        activeRetailers: activePhones.length,
        inactiveRetailers: usersSnap.size - activePhones.length,
        totalOrders: monthOrders.length,
        delivered: delivered.length,
        cancelled: cancelled.length,
        returned: returned.length,
        totalRevenue,
        totalCollected,
        totalDues,
        retailersWithDues,
        avgOrderValue: delivered.length > 0 ? Math.round(totalRevenue / delivered.length) : 0,
        ordersPerDay: Math.round(monthOrders.length / monthEnd.getDate()),
        errors: monthErrors.length,
        tickets: monthTickets.length,
        ticketsOpen: monthTickets.filter(t => t.status !== 'Resolved').length,
      };

      setReport(data);
    } catch (e) { setReport({ error: e.message }); }
    setLoading(false);
  };

  const getReportText = () => {
    if (!report || report.error) return '';
    return `📊 LUCY GARDEN — Monthly Report
━━━━━━━━━━━━━━━━━━━━━━━
📅 ${report.month}

👥 RETAILERS
• Total: ${report.totalRetailers}
• Active (ordered): ${report.activeRetailers}
• Inactive: ${report.inactiveRetailers}

📦 ORDERS
• Total orders: ${report.totalOrders}
• Delivered: ${report.delivered}
• Cancelled: ${report.cancelled}
• Returned: ${report.returned}
• Avg per day: ${report.ordersPerDay}

💰 REVENUE
• Total revenue: ₹${report.totalRevenue.toLocaleString('en-IN')}
• Collected: ₹${report.totalCollected.toLocaleString('en-IN')}
• Avg order value: ₹${report.avgOrderValue.toLocaleString('en-IN')}

📒 DUES
• Total pending: ₹${report.totalDues.toLocaleString('en-IN')}
• Retailers with dues: ${report.retailersWithDues}

🔧 SYSTEM
• App errors: ${report.errors}
• Support tickets: ${report.tickets} (${report.ticketsOpen} open)
• Status: ${report.errors === 0 ? 'All systems healthy ✅' : 'Some errors detected ⚠️'}

━━━━━━━━━━━━━━━━━━━━━━━
Generated: ${new Date().toLocaleString('en-IN')}
Lucy Garden • Fresh Dairy Supply`;
  };

  const copyReport = () => {
    navigator.clipboard.writeText(getReportText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5 pb-10">
      <div>
        <h2 className="text-base font-extrabold text-white">Monthly Report</h2>
        <p className="text-[10px] text-gray-500">Generate summary to send to client</p>
      </div>

      {/* Month Select */}
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Month</label>
          <input type="month" value={month} onChange={e => setMonth(e.target.value)}
            className="w-full mt-1 py-2.5 px-3 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white outline-none focus:border-green-500" />
        </div>
        <motion.button whileTap={{ scale: 0.95 }} onClick={generateReport} disabled={loading}
          className="py-2.5 px-5 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs font-bold rounded-xl flex items-center gap-2 disabled:opacity-50">
          {loading ? <RefreshCw size={13} className="animate-spin" /> : <><FileText size={13} /> Generate</>}
        </motion.button>
      </div>

      {/* Report Display */}
      {report && !report.error && (
        <div className="space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
              <p className="text-[9px] text-gray-500 font-bold uppercase">Orders</p>
              <p className="text-xl font-black text-white mt-1">{report.totalOrders}</p>
              <p className="text-[10px] text-gray-600">{report.delivered} delivered</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
              <p className="text-[9px] text-gray-500 font-bold uppercase">Revenue</p>
              <p className="text-xl font-black text-green-400 mt-1">₹{report.totalRevenue.toLocaleString('en-IN')}</p>
              <p className="text-[10px] text-gray-600">₹{report.totalCollected.toLocaleString('en-IN')} collected</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
              <p className="text-[9px] text-gray-500 font-bold uppercase">Retailers</p>
              <p className="text-xl font-black text-white mt-1">{report.activeRetailers}/{report.totalRetailers}</p>
              <p className="text-[10px] text-gray-600">{report.inactiveRetailers} inactive</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
              <p className="text-[9px] text-gray-500 font-bold uppercase">Pending Dues</p>
              <p className="text-xl font-black text-red-400 mt-1">₹{report.totalDues.toLocaleString('en-IN')}</p>
              <p className="text-[10px] text-gray-600">{report.retailersWithDues} retailers</p>
            </div>
          </div>

          {/* Health */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="text-[9px] text-gray-500 font-bold uppercase">System Health</p>
              <p className="text-xs text-white font-bold mt-1">{report.errors === 0 ? 'All systems healthy' : `${report.errors} errors detected`}</p>
            </div>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${report.errors === 0 ? 'bg-green-900/30' : 'bg-amber-900/30'}`}>
              <CheckCircle2 size={16} className={report.errors === 0 ? 'text-green-400' : 'text-amber-400'} />
            </div>
          </div>

          {/* Copy/Download */}
          <div className="flex gap-2">
            <motion.button whileTap={{ scale: 0.95 }} onClick={copyReport}
              className="flex-1 py-3 rounded-xl bg-blue-900/30 border border-blue-800/50 text-xs font-bold text-blue-400 flex items-center justify-center gap-2">
              {copied ? <><CheckCircle2 size={13} /> Copied!</> : <><Copy size={13} /> Copy for WhatsApp</>}
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => {
              const blob = new Blob([getReportText()], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url; a.download = `LG_Report_${month}.txt`; a.click();
              URL.revokeObjectURL(url);
            }} className="py-3 px-4 rounded-xl bg-green-900/30 border border-green-800/50 text-xs font-bold text-green-400 flex items-center justify-center gap-2">
              <Download size={13} /> .txt
            </motion.button>
          </div>

          {/* Raw Text Preview */}
          <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 max-h-60 overflow-y-auto">
            <pre className="text-[10px] text-gray-400 font-mono whitespace-pre-wrap">{getReportText()}</pre>
          </div>
        </div>
      )}

      {report?.error && (
        <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-3">
          <p className="text-xs text-red-400">❌ {report.error}</p>
        </div>
      )}
    </div>
  );
}

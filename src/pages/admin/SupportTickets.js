import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Headphones, Check, Clock, CheckCircle2, X, MessageCircle, Search, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { db, collection, getDocs, doc, updateDoc, orderBy, query, arrayUnion } from '../../services/firebase';
import { TableSkeleton } from '../../components/LoadingSkeleton';

export default function SupportTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState('');
  const [replyText, setReplyText] = useState('');
  const [updating, setUpdating] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => { fetchTickets(); }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'support_tickets'), orderBy('createdAt', 'desc')));
      setTickets(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {}
    setLoading(false);
  };

  const updateStatus = async (id, status) => {
    if (updating) return;
    setUpdating(status);
    try {
      await updateDoc(doc(db, 'support_tickets', id), { status, updatedAt: new Date().toISOString() });
      setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t));
      setSelected(null);
      setReplyText('');
      setToast(`Ticket marked as ${status}`);
      setTimeout(() => setToast(''), 2500);
    } catch (err) {}
    setUpdating(false);
  };

  const sendReply = async (id) => {
    if (!replyText.trim() || updating) return;
    setUpdating('reply');
    try {
      await updateDoc(doc(db, 'support_tickets', id), {
        messages: arrayUnion({ from: 'admin', text: replyText.trim(), time: new Date().toISOString() }),
        status: 'In Progress',
      });
      setTickets(prev => prev.map(t => t.id === id ? { ...t, messages: [...(t.messages || []), { from: 'admin', text: replyText.trim(), time: new Date().toISOString() }], status: 'In Progress' } : t));
      setSelected(prev => ({ ...prev, messages: [...(prev.messages || []), { from: 'admin', text: replyText.trim(), time: new Date().toISOString() }], status: 'In Progress' }));
      setReplyText('');
      setToast('Reply sent!');
      setTimeout(() => setToast(''), 2500);
    } catch (err) {}
    setUpdating(false);
  };

  const filtered = (filter === 'All' ? tickets : tickets.filter(t => t.status === filter)).filter(t => {
    if (!search) return true;
    const q = search.toLowerCase();
    return t.retailer?.toLowerCase().includes(q) || t.phone?.includes(q) || t.subject?.toLowerCase().includes(q);
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const statusColor = {
    'Open': { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800', icon: Clock },
    'In Progress': { bg: 'bg-royal-50 dark:bg-royal-900/20', text: 'text-royal-700 dark:text-royal-300', border: 'border-royal-200 dark:border-royal-800', icon: MessageCircle },
    'Resolved': { bg: 'bg-mint-50 dark:bg-mint-900/20', text: 'text-mint-700 dark:text-mint-400', border: 'border-mint-200 dark:border-mint-800', icon: CheckCircle2 },
  };

  const counts = { All: tickets.length, Open: tickets.filter(t => t.status === 'Open').length, 'In Progress': tickets.filter(t => t.status === 'In Progress').length, Resolved: tickets.filter(t => t.status === 'Resolved').length };

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-5">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-[4.5rem] left-4 right-4 lg:left-1/2 lg:right-auto lg:-translate-x-1/2 lg:w-auto z-[100] flex items-center justify-center gap-2 px-4 py-3 rounded-2xl shadow-xl bg-mint-50 dark:bg-mint-900/80 border border-mint-200 dark:border-mint-700 text-mint-800 dark:text-mint-200 backdrop-blur-sm">
            <Check size={14} strokeWidth={3} /><span className="text-sm font-bold">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {['All', 'Open', 'In Progress', 'Resolved'].map(s => (
          <motion.button key={s} whileTap={{ scale: 0.95 }} onClick={() => setFilter(s)}
            className={`card !p-3 text-center cursor-pointer transition-all ${filter === s ? 'ring-2 ring-royal-400 dark:ring-royal-600' : ''}`}>
            <p className="text-lg font-black text-gray-800 dark:text-white">{counts[s]}</p>
            <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase">{s}</p>
          </motion.button>
        ))}
      </div>

      {/* Search + Refresh */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search name, phone, subject..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-9 py-2.5 text-sm bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#222222] rounded-xl outline-none focus:border-royal-300 dark:text-white" />
          {search && <button onClick={() => { setSearch(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-gray-200 dark:bg-[#222222] rounded-full flex items-center justify-center"><X size={10} className="text-gray-500" /></button>}
        </div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={fetchTickets} className="p-2.5 bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#222222] rounded-xl hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">
          <RefreshCw size={14} className={`text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </motion.button>
      </div>

      {/* Tickets List */}
      {filtered.length > 0 ? (
        <div className="space-y-2">
          {paginated.map((t, i) => {
            const config = statusColor[t.status] || statusColor['Open'];
            const StatusIcon = config.icon;
            return (
              <motion.div key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 * i }}
                onClick={() => setSelected(t)}
                className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#222222] p-4 cursor-pointer hover:border-royal-200 dark:hover:border-royal-800 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 dark:text-white">{t.retailer}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{t.phone}{t.shop ? ` • ${t.shop}` : ''}</p>
                  </div>
                  <span className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg border ${config.bg} ${config.text} ${config.border} shrink-0`}>
                    <StatusIcon size={10} /> {t.status}
                  </span>
                </div>
                <p className="text-sm font-semibold text-royal-700 dark:text-royal-300 mb-1">{t.subject}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{t.message}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2">{t.date}</p>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <Headphones size={40} className="text-gray-200 dark:text-[#444444] mx-auto mb-3" />
          <p className="text-sm text-gray-400 dark:text-gray-500">No {filter !== 'All' ? filter.toLowerCase() : ''} tickets{search ? ' matching search' : ''}</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">{filtered.length} tickets • Page {page}/{totalPages}</p>
          <div className="flex items-center gap-2">
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-300 disabled:opacity-30"><ChevronLeft size={14} /> Prev</motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-300 disabled:opacity-30">Next <ChevronRight size={14} /></motion.button>
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
            onClick={() => setSelected(null)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="bg-white dark:bg-[#111111] w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              <div className="w-10 h-1 bg-gray-200 dark:bg-[#1a1a1a] rounded-full mx-auto mb-5 sm:hidden" />

              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-extrabold text-gray-800 dark:text-white text-base">{selected.subject}</h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{selected.retailer} • {selected.phone}</p>
                </div>
                <button onClick={() => setSelected(null)} className="w-8 h-8 bg-gray-100 dark:bg-[#1a1a1a] rounded-full flex items-center justify-center text-gray-400">
                  <X size={14} />
                </button>
              </div>

              <div className="bg-gray-50 dark:bg-[#1a1a1a]/50 rounded-2xl p-4 mb-4">
                <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Original Message</p>
                <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{selected.message}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-3">{selected.date}</p>
              </div>

              {/* Messages Thread */}
              {selected.messages?.length > 0 && (
                <div className="space-y-2 mb-4 max-h-[200px] overflow-y-auto">
                  {selected.messages.map((msg, mi) => (
                    <div key={mi} className={`rounded-xl p-3 ${msg.from === 'admin' ? 'bg-royal-50 dark:bg-royal-900/20 border border-royal-100 dark:border-royal-800 ml-4' : 'bg-gray-50 dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#333333] mr-4'}`}>
                      <p className={`text-[10px] font-bold uppercase mb-1 ${msg.from === 'admin' ? 'text-royal-600 dark:text-royal-400' : 'text-gray-500 dark:text-gray-400'}`}>{msg.from === 'admin' ? 'You' : 'Retailer'}</p>
                      <p className="text-sm text-gray-700 dark:text-gray-200">{msg.text}</p>
                      <p className="text-[9px] text-gray-400 mt-1">{new Date(msg.time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Input */}
              {selected.status !== 'Resolved' && (
              <div className="mb-5">
                <textarea value={replyText} onChange={e => setReplyText(e.target.value)}
                  placeholder="Type your reply..."
                  rows={3}
                  className="w-full py-3 px-4 text-sm bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333333] rounded-2xl outline-none focus:border-royal-400 resize-none text-gray-800 dark:text-white placeholder:text-gray-400" />
                {replyText.trim() && (
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => sendReply(selected.id)} disabled={updating === 'reply'}
                    className="mt-2 w-full py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-royal-700 to-royal-600 text-white shadow-md disabled:opacity-50">
                    {updating === 'reply' ? <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : 'Send Reply'}
                  </motion.button>
                )}
              </div>
              )}

              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Update Status</p>
              <div className="grid grid-cols-3 gap-2">
                {['Open', 'In Progress', 'Resolved'].map((s, i) => {
                  const config = statusColor[s];
                  const isUpdating = updating === s;
                  const currentIdx = ['Open', 'In Progress', 'Resolved'].indexOf(selected.status);
                  const isDisabled = selected.status === s || !!updating;
                  return (
                    <motion.button key={s} whileTap={{ scale: isDisabled ? 1 : 0.95 }}
                      onClick={() => updateStatus(selected.id, s)}
                      disabled={isDisabled}
                      className={`py-3 rounded-xl text-xs font-bold border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${selected.status === s ? `${config.bg} ${config.text} ${config.border} ring-2 ring-offset-1 ring-royal-400` : 'bg-gray-50 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-[#333333]'}`}>
                      {isUpdating ? <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-600 rounded-full" /> : s}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

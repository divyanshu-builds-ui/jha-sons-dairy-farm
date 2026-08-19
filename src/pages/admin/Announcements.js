import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, Send, Trash2, RefreshCw, Eye, Clock, Info, AlertTriangle, CheckCircle2, AlertCircle, Check } from 'lucide-react';
import { db, collection, getDocs, addDoc, deleteDoc, doc, setDoc, getDoc } from '../../services/firebase';
import { useConfirm } from '../../components/ConfirmModal';

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState('');
  const [form, setForm] = useState({ message: '', type: 'info', target: 'retailers', expiry: '24' });
  const [activeBanner, setActiveBanner] = useState(null);
  const [toast, setToast] = useState('');
  const confirm = useConfirm();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'announcements'));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setAnnouncements(list);
      const bannerDoc = await getDoc(doc(db, 'settings', 'banner'));
      if (bannerDoc.exists()) setActiveBanner(bannerDoc.data());
      else setActiveBanner(null);
    } catch (err) {}
    setLoading(false);
  };

  const sendAnnouncement = async () => {
    if (!form.message.trim()) return;
    const ok = await confirm({ title: 'Send Announcement', message: `Send this ${form.type} announcement to ${form.target === 'all' ? 'all users' : form.target}?`, confirmText: 'Send', type: 'warning' });
    if (!ok) return;
    setSending(true);
    try {
      const data = {
        message: form.message.trim(),
        type: form.type,
        target: form.target,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + Number(form.expiry) * 60 * 60 * 1000).toISOString(),
      };
      await addDoc(collection(db, 'announcements'), data);
      await setDoc(doc(db, 'settings', 'banner'), {
        message: form.message.trim(),
        type: form.type,
        target: form.target,
        active: true,
        createdAt: new Date().toISOString(),
        expiresAt: data.expiresAt,
      });
      setForm({ message: '', type: 'info', target: 'retailers', expiry: '24' });
      setToast('Announcement sent!');
      setTimeout(() => setToast(''), 2500);
      fetchData();
    } catch (err) { setToast('Failed to send'); setTimeout(() => setToast(''), 2500); }
    setSending(false);
  };

  const deleteBanner = async () => {
    const ok = await confirm({ title: 'Disable Banner', message: 'Remove the active banner for all users?', confirmText: 'Disable', type: 'warning' });
    if (!ok) return;
    setDeleting('banner');
    try {
      await setDoc(doc(db, 'settings', 'banner'), { active: false, message: '' });
      setActiveBanner(null);
      setToast('Banner disabled');
      setTimeout(() => setToast(''), 2500);
    } catch (err) {}
    setDeleting('');
  };

  const deleteAnnouncement = async (id) => {
    const ok = await confirm({ title: 'Delete', message: 'Delete this announcement from history?', confirmText: 'Delete', type: 'danger' });
    if (!ok) return;
    setDeleting(id);
    try {
      await deleteDoc(doc(db, 'announcements', id));
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch (err) {}
    setDeleting('');
  };

  const typeConfig = {
    info: { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800', label: <><Info size={14} className="inline text-blue-500" /> Info</> },
    warning: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800', label: <><AlertTriangle size={14} className="inline text-amber-500" /> Warning</> },
    success: { color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800', label: <><CheckCircle2 size={14} className="inline text-green-500" /> Success</> },
    urgent: { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800', label: <><AlertCircle size={14} className="inline text-red-500" /> Urgent</> },
  };

  const isExpired = (expiresAt) => expiresAt && new Date(expiresAt) < new Date();

  return (
    <div className="space-y-5 pb-10 max-w-3xl mx-auto">
      {/* Toast */}
      <AnimatePresence>{toast && (<motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-[4.5rem] left-4 right-4 lg:left-1/2 lg:right-auto lg:-translate-x-1/2 lg:w-auto z-[100] flex items-center justify-center gap-2 px-4 py-3 rounded-2xl shadow-xl bg-mint-50 dark:bg-mint-900/80 border border-mint-200 dark:border-mint-700 text-mint-800 dark:text-mint-200 backdrop-blur-sm"><Check size={14} strokeWidth={3} /><span className="text-sm font-bold">{toast}</span></motion.div>)}</AnimatePresence>

      {/* Active Banner */}
      {activeBanner?.active && activeBanner.message && (
        <div className={`rounded-2xl border p-5 ${typeConfig[activeBanner.type]?.bg || typeConfig.info.bg}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Eye size={14} className="text-green-500" />
              <span className="text-xs font-bold text-green-600 dark:text-green-400 uppercase">Live Banner</span>
            </div>
            <motion.button whileTap={{ scale: 0.9 }} onClick={deleteBanner} disabled={deleting === 'banner'}
              className="px-4 py-2 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 disabled:opacity-50">
              {deleting === 'banner' ? 'Removing...' : 'Disable Banner'}
            </motion.button>
          </div>
          <p className="text-base text-gray-800 dark:text-white font-semibold">{activeBanner.message}</p>
          <p className="text-xs text-gray-500 mt-2">
            Expires: {new Date(activeBanner.expiresAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
            {isExpired(activeBanner.expiresAt) && <span className="text-red-500 ml-2 font-bold">(Expired)</span>}
          </p>
        </div>
      )}

      {/* New Announcement Form */}
      <div className="card !p-5">
        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">
          <Megaphone size={12} className="inline mr-1.5" />New Announcement
        </p>
        <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
          placeholder="Type your message here..."
          rows={3}
          className="w-full py-3 px-4 text-sm bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-[#222222] rounded-xl outline-none focus:border-royal-400 focus:ring-2 focus:ring-royal-100 dark:focus:ring-royal-900/30 resize-none text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 mb-4" />

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Type</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="w-full text-sm font-semibold bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-[#222222] text-gray-700 dark:text-gray-300 rounded-xl px-3 py-2.5 outline-none">
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="success">Success</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Target</label>
            <select value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
              className="w-full text-sm font-semibold bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-[#222222] text-gray-700 dark:text-gray-300 rounded-xl px-3 py-2.5 outline-none">
              <option value="retailers">Retailers</option>
              <option value="all">All Users</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Expires</label>
            <select value={form.expiry} onChange={e => setForm(f => ({ ...f, expiry: e.target.value }))}
              className="w-full text-sm font-semibold bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-[#222222] text-gray-700 dark:text-gray-300 rounded-xl px-3 py-2.5 outline-none">
              <option value="1">1 Hour</option>
              <option value="6">6 Hours</option>
              <option value="12">12 Hours</option>
              <option value="24">24 Hours</option>
              <option value="72">3 Days</option>
              <option value="168">7 Days</option>
            </select>
          </div>
        </div>

        <motion.button whileTap={{ scale: 0.97 }} onClick={sendAnnouncement} disabled={sending || !form.message.trim()}
          className="w-full py-3.5 rounded-xl text-sm font-bold bg-gradient-to-r from-royal-700 via-royal-600 to-mint-700 text-white shadow-lg shadow-royal-600/20 disabled:opacity-50 flex items-center justify-center gap-2">
          {sending ? <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : <Send size={16} />}
          {sending ? 'Sending...' : 'Send Announcement'}
        </motion.button>
      </div>

      {/* History */}
      <div className="card !p-5">
        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">
          <Clock size={12} className="inline mr-1.5" />History ({announcements.length})
        </p>
        {announcements.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No announcements sent yet</p>
        ) : (
          <div className="space-y-2.5 max-h-[400px] overflow-y-auto">
            {announcements.map((a, i) => {
              const cfg = typeConfig[a.type] || typeConfig.info;
              const expired = isExpired(a.expiresAt);
              return (
                <motion.div key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.03 * i }}
                  className={`rounded-xl border p-4 ${expired ? 'bg-gray-50 dark:bg-[#111111]/50 border-gray-200 dark:border-[#222222] opacity-60' : cfg.bg}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
                        <span className="text-xs text-gray-400">• {a.target}</span>
                        {expired && <span className="text-xs text-red-500 font-bold">EXPIRED</span>}
                      </div>
                      <p className="text-sm text-gray-800 dark:text-white break-words">{a.message}</p>
                      <p className="text-xs text-gray-400 mt-1.5">
                        {new Date(a.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                      </p>
                    </div>
                    <motion.button whileTap={{ scale: 0.8 }} onClick={() => deleteAnnouncement(a.id)} disabled={deleting === a.id}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl shrink-0 disabled:opacity-50">
                      {deleting === a.id ? <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full" /> : <Trash2 size={14} className="text-gray-400" />}
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

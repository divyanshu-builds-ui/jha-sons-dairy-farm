import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Megaphone, Send, Trash2, RefreshCw, Eye, EyeOff, Clock, Info, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';
import { db, collection, getDocs, addDoc, deleteDoc, doc, setDoc, getDoc } from '../../services/firebase';
import { useConfirm } from '../../components/ConfirmModal';

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState('');
  const [form, setForm] = useState({ message: '', type: 'info', target: 'all', expiry: '24' });
  const [activeBanner, setActiveBanner] = useState(null);
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
    const ok = await confirm({ title: 'Send Announcement', message: `Send this ${form.type} announcement to ${form.target === 'all' ? 'all users' : form.target}? It will appear as a live banner.`, confirmText: 'Send', type: 'warning' });
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
      setForm({ message: '', type: 'info', target: 'all', expiry: '24' });
      fetchData();
    } catch (err) {}
    setSending(false);
  };

  const deleteBanner = async () => {
    const ok = await confirm({ title: 'Disable Banner', message: 'Remove the active banner for all users?', confirmText: 'Disable', type: 'warning' });
    if (!ok) return;
    setDeleting('banner');
    try {
      await setDoc(doc(db, 'settings', 'banner'), { active: false, message: '' });
      setActiveBanner(null);
    } catch (err) {}
    setDeleting('');
  };

  const deleteAnnouncement = async (id) => {
    const ok = await confirm({ title: 'Delete Announcement', message: 'Delete this announcement from history?', confirmText: 'Delete', type: 'danger' });
    if (!ok) return;
    setDeleting(id);
    try {
      await deleteDoc(doc(db, 'announcements', id));
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch (err) {}
    setDeleting('');
  };

  const typeConfig = {
    info: { color: 'text-blue-400', bg: 'bg-blue-900/20 border-blue-800/50', label: <><Info size={12} className="inline text-blue-500" /> Info</> },
    warning: { color: 'text-amber-400', bg: 'bg-amber-900/20 border-amber-800/50', label: <><AlertTriangle size={12} className="inline text-amber-500" /> Warning</> },
    success: { color: 'text-green-400', bg: 'bg-green-900/20 border-green-800/50', label: <><CheckCircle2 size={12} className="inline text-green-500" /> Success</> },
    error: { color: 'text-red-400', bg: 'bg-red-900/20 border-red-800/50', label: <><AlertCircle size={12} className="inline text-red-500" /> Error</> },
    urgent: { color: 'text-red-600', bg: 'bg-red-900/40 border-red-700/60', label: <><AlertCircle size={14} className="inline text-red-500 animate-pulse" /> URGENT</> },
  };

  const isExpired = (expiresAt) => expiresAt && new Date(expiresAt) < new Date();

  return (
    <div className="space-y-3 sm:space-y-5 pb-6 sm:pb-10 px-3 sm:px-0">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-extrabold text-white truncate">Announcements</h2>
          <p className="text-[9px] sm:text-[10px] text-gray-500 truncate">Send messages to users</p>
        </div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={fetchData}
          className="p-2 sm:p-2.5 bg-gray-800 border border-gray-700 rounded-lg sm:rounded-xl shrink-0">
          <RefreshCw size={12} className={`sm:size-[14px] text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </motion.button>
      </div>

      {/* Active Banner Status */}
      {activeBanner?.active && activeBanner.message && (
        <div className={`rounded-lg sm:rounded-2xl border p-3 sm:p-4 ${typeConfig[activeBanner.type]?.bg || typeConfig.info.bg}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <Eye size={11} className="sm:size-[12px] text-green-400 shrink-0" />
              <span className="text-[9px] sm:text-[10px] font-bold text-green-400 uppercase truncate">Live Banner</span>
            </div>
            <motion.button whileTap={{ scale: 0.9 }} onClick={deleteBanner} disabled={deleting === 'banner'}
              className="p-1.5 bg-red-900/30 border border-red-800 rounded-lg disabled:opacity-50 shrink-0 ml-2">
              {deleting === 'banner' ? <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-3 h-3 border-2 border-red-300 border-t-red-500 rounded-full" /> : <Trash2 size={12} className="text-red-400" />}
            </motion.button>
          </div>
          <p className="text-[12px] sm:text-sm text-white font-semibold">{activeBanner.message}</p>
          <p className="text-[9px] sm:text-[10px] text-gray-500 mt-2">
            Expires: {new Date(activeBanner.expiresAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
            {isExpired(activeBanner.expiresAt) && <span className="text-red-400 ml-2">(Expired)</span>}
          </p>
        </div>
      )}

      {/* New Announcement Form */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg sm:rounded-2xl p-3 sm:p-4">
        <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase mb-2 sm:mb-3">
          <Megaphone size={10} className="sm:size-[11px] inline mr-1" />New Announcement
        </p>
        <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
          placeholder="Type your message here..."
          rows={3}
          className="w-full py-2 sm:py-3 px-3 sm:px-4 text-[12px] sm:text-sm bg-black border border-gray-800 rounded-lg sm:rounded-xl outline-none focus:border-green-700 resize-none text-white placeholder:text-gray-600 mb-3" />

        <div className="grid grid-cols-3 gap-2 mb-3">
          <div>
            <label className="text-[8px] sm:text-[9px] font-bold text-gray-600 uppercase mb-1 block">Type</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="w-full text-[10px] sm:text-[11px] font-bold bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-2 py-1.5 sm:py-2">
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="success">Success</option>
              <option value="error">Error</option>
              <option value="urgent">Urgent (Red)</option>
            </select>
          </div>
          <div>
            <label className="text-[8px] sm:text-[9px] font-bold text-gray-600 uppercase mb-1 block">Target</label>
            <select value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
              className="w-full text-[10px] sm:text-[11px] font-bold bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-2 py-1.5 sm:py-2">
              <option value="all">All Users</option>
              <option value="retailers">Retailers</option>
              <option value="admin">Admin Only</option>
            </select>
          </div>
          <div>
            <label className="text-[8px] sm:text-[9px] font-bold text-gray-600 uppercase mb-1 block">Expires</label>
            <select value={form.expiry} onChange={e => setForm(f => ({ ...f, expiry: e.target.value }))}
              className="w-full text-[10px] sm:text-[11px] font-bold bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-2 py-1.5 sm:py-2">
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
          className="w-full py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold bg-gradient-to-r from-green-600 to-emerald-600 text-white disabled:opacity-50 flex items-center justify-center gap-2">
          {sending ? <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full" /> : <Send size={12} className="sm:size-[14px]" />}
          {sending ? 'Sending...' : 'Send Announcement'}
        </motion.button>
      </div>

      {/* History */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg sm:rounded-2xl p-3 sm:p-4">
        <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase mb-2 sm:mb-3">
          <Clock size={10} className="sm:size-[11px] inline mr-1" />History ({announcements.length})
        </p>
        {announcements.length === 0 ? (
          <p className="text-[11px] sm:text-xs text-gray-600 text-center py-4 sm:py-6">No announcements sent yet</p>
        ) : (
          <div className="space-y-1.5 sm:space-y-2 max-h-80 sm:max-h-[400px] overflow-y-auto">
            {announcements.map((a, i) => {
              const cfg = typeConfig[a.type] || typeConfig.info;
              const expired = isExpired(a.expiresAt);
              return (
                <motion.div key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.03 * i }}
                  className={`rounded-lg sm:rounded-xl border p-2.5 sm:p-3 ${expired ? 'bg-gray-800/50 border-gray-800 opacity-60' : cfg.bg}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className={`text-[8px] sm:text-[9px] font-bold ${cfg.color}`}>{cfg.label}</span>
                        <span className="text-[8px] sm:text-[9px] text-gray-600">• {a.target}</span>
                        {expired && <span className="text-[8px] sm:text-[9px] text-red-500 font-bold">EXPIRED</span>}
                      </div>
                      <p className="text-[11px] sm:text-xs text-white break-words">{a.message}</p>
                      <p className="text-[8px] sm:text-[9px] text-gray-600 mt-1">
                        {new Date(a.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                      </p>
                    </div>
                    <motion.button whileTap={{ scale: 0.8 }} onClick={() => deleteAnnouncement(a.id)} disabled={deleting === a.id}
                      className="p-1.5 hover:bg-red-900/30 rounded-lg shrink-0 disabled:opacity-50">
                      {deleting === a.id ? <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-3 h-3 border-2 border-gray-500 border-t-gray-300 rounded-full" /> : <Trash2 size={11} className="sm:size-[12px] text-gray-400" />}
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

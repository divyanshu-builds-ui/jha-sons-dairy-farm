import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, RefreshCw, Trash2, Users } from 'lucide-react';
import { db, collection, getDocs, deleteDoc, doc } from '../../services/firebase';
import { useConfirm } from '../../components/ConfirmModal';

export default function AppRatings() {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const confirm = useConfirm();

  useEffect(() => { fetchRatings(); }, []);

  const fetchRatings = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'app_ratings'));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setRatings(list);
    } catch (e) {}
    setLoading(false);
  };

  const deleteRating = async (id) => {
    const ok = await confirm({ title: 'Delete Rating', message: 'Remove this rating permanently?', confirmText: 'Delete', type: 'danger' });
    if (!ok) return;
    try {
      await deleteDoc(doc(db, 'app_ratings', id));
      setRatings(prev => prev.filter(r => r.id !== id));
    } catch (e) {}
  };

  const clearAll = async () => {
    const ok = await confirm({ title: 'Clear All Ratings', message: `Delete all ${ratings.length} ratings? This cannot be undone.`, confirmText: 'Clear All', type: 'critical' });
    if (!ok) return;
    try {
      for (const r of ratings) await deleteDoc(doc(db, 'app_ratings', r.id));
      setRatings([]);
    } catch (e) {}
  };

  const total = ratings.reduce((s, r) => s + (r.rating || 0), 0);
  const avg = ratings.length > 0 ? (total / ratings.length).toFixed(1) : '0.0';
  const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  ratings.forEach(r => { if (r.rating >= 1 && r.rating <= 5) dist[r.rating]++; });

  return (
    <div className="space-y-5 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-white">App Ratings</h2>
          <p className="text-[10px] text-gray-500">{ratings.length} ratings from retailers</p>
        </div>
        <div className="flex gap-2">
          {ratings.length > 0 && (
            <motion.button whileTap={{ scale: 0.9 }} onClick={clearAll}
              className="p-2.5 bg-red-900/30 border border-red-800 rounded-xl">
              <Trash2 size={14} className="text-red-400" />
            </motion.button>
          )}
          <motion.button whileTap={{ scale: 0.9 }} onClick={fetchRatings}
            className="p-2.5 bg-gray-800 border border-gray-700 rounded-xl">
            <RefreshCw size={14} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-amber-900/30 to-orange-900/20 border border-amber-800/50 rounded-2xl p-5 text-center">
          <p className="text-3xl font-black text-amber-400">{avg} ⭐</p>
          <p className="text-[10px] text-amber-500/70 font-bold mt-1">Average Rating</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-center">
          <p className="text-3xl font-black text-white">{ratings.length}</p>
          <p className="text-[10px] text-gray-500 font-bold mt-1">Total Reviews</p>
        </div>
      </div>

      {/* Distribution */}
      {ratings.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <p className="text-xs font-bold text-gray-500 uppercase mb-3">Distribution</p>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map(star => {
              const count = dist[star];
              const pct = ratings.length ? Math.round(count / ratings.length * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-xs text-amber-400 w-8 shrink-0">{star} ★</span>
                  <div className="flex-1 h-4 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5, delay: 0.05 * (5 - star) }}
                      className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 w-10 text-right">{count} ({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Ratings List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-gray-800 rounded-2xl animate-pulse" />)}
        </div>
      ) : ratings.length === 0 ? (
        <div className="text-center py-16">
          <Star size={36} className="text-gray-700 mx-auto mb-3" />
          <p className="text-sm font-bold text-gray-500">No ratings yet</p>
          <p className="text-xs text-gray-600 mt-1">Ratings will appear here when retailers submit them</p>
        </div>
      ) : (
        <div className="space-y-2">
          {ratings.map((r, i) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 * i }}
              className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-[9px] font-bold text-gray-600 bg-gray-800 w-5 h-5 rounded-md flex items-center justify-center shrink-0">{i + 1}</span>
                  <div className="w-10 h-10 bg-amber-900/30 border border-amber-800/50 rounded-xl flex items-center justify-center shrink-0">
                    <span className="text-sm font-black text-amber-400">{r.rating}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-white truncate">{r.name || 'Unknown'}</p>
                      <span className="text-amber-400 text-xs">{'★'.repeat(r.rating)}{'☆'.repeat(5 - (r.rating || 0))}</span>
                    </div>
                    <p className="text-[10px] text-gray-500">{r.phone || '—'} · {r.createdAt ? new Date(r.createdAt.toDate ? r.createdAt.toDate() : r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</p>
                  </div>
                </div>
                <motion.button whileTap={{ scale: 0.8 }} onClick={() => deleteRating(r.id)}
                  className="p-2 hover:bg-red-900/30 rounded-lg shrink-0">
                  <Trash2 size={13} className="text-gray-600 hover:text-red-400" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

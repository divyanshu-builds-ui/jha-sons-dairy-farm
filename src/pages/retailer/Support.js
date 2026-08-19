import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Phone, Clock, MapPin, Headphones, Send, Check, ChevronDown, Package, AlertTriangle, CreditCard, ShieldAlert, Bug, HelpCircle, ChevronRight } from 'lucide-react';
import { db, collection, addDoc, getDocs, query, where, doc, getDoc, updateDoc, arrayUnion, orderBy } from '../../services/firebase';
import { useSearchParams } from 'react-router-dom';

const CATEGORIES = [
  { id: 'order', label: 'Order Issue', icon: Package, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', subs: ['Wrong items delivered', 'Missing items', 'Late delivery', 'Order not received', 'Other'] },
  { id: 'payment', label: 'Payment / Ledger', icon: CreditCard, color: 'text-royal-600', bg: 'bg-royal-50 dark:bg-royal-900/20', subs: ['Wrong balance shown', 'Payment not updated', 'Overcharged', 'Other'] },
  { id: 'quality', label: 'Product Quality', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', subs: ['Expired product', 'Bad taste/smell', 'Damaged packaging', 'Other'] },
  { id: 'account', label: 'Account Issue', icon: ShieldAlert, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20', subs: ['Cannot login', 'Wrong details', 'Change phone number', 'Account blocked / Unblock request', 'Other'] },
  { id: 'bug', label: 'App Bug / Error', icon: Bug, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20', subs: ['App crash', 'Page not loading', 'Button not working', 'Display issue', 'Other'] },
  { id: 'other', label: 'Other', icon: HelpCircle, color: 'text-gray-600', bg: 'bg-gray-50 dark:bg-[#111111]', subs: [] },
];

export default function Support() {
  const user = JSON.parse(localStorage.getItem('lg_user') || '{}');
  const [tab, setTab] = useState('new');
  const [step, setStep] = useState('category'); // category → details → done
  const [category, setCategory] = useState(null);
  const [subCategory, setSubCategory] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('medium');
  const [orderRef, setOrderRef] = useState('');
  const [recentOrders, setRecentOrders] = useState([]);
  const [sending, setSending] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [shopPhone, setShopPhone] = useState('9939079107');
  const [searchParams] = useSearchParams();

  // Auto-fill for unblock request from Blocked page
  useEffect(() => {
    if (searchParams.get('reason') === 'unblock') {
      const accountCat = CATEGORIES.find(c => c.id === 'account');
      if (accountCat) {
        setCategory(accountCat);
        setSubCategory('Account blocked / Unblock request');
        setStep('details');
        setPriority('high');
        setTab('new');
        const blockReason = user.blockReason || '';
        let msg = `Dear Admin,\n\nMy account has been suspended.`;
        if (blockReason) msg += ` Reason: "${blockReason}".`;
        msg += `\n\nI request you to kindly review and restore my account access.`;
        if (blockReason.toLowerCase().includes('due') || blockReason.toLowerCase().includes('pending')) {
          msg += `\nI will clear pending dues at the earliest.`;
        }
        msg += `\n\nThank you.\n— ${user.name || 'Retailer'}`;
        setMessage(msg);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    async function init() {
      try {
        const appDoc = await getDoc(doc(db, 'settings', 'app'));
        if (appDoc.exists() && appDoc.data().shopPhone) setShopPhone(appDoc.data().shopPhone);
        const ordSnap = await getDocs(query(collection(db, 'orders'), where('phone', '==', user.phone), orderBy('createdAt', 'desc')));
        setRecentOrders(ordSnap.docs.slice(0, 5).map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {}
    }
    init();
  }, [user.phone]);

  const fetchTickets = async () => {
    setLoadingTickets(true);
    try {
      const snap = await getDocs(query(collection(db, 'support_tickets'), where('phone', '==', user.phone)));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setTickets(list);
    } catch (err) {}
    setLoadingTickets(false);
  };

  useEffect(() => { if (tab === 'history') fetchTickets(); }, [tab]);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      // Prevent spam — block if user already has an open/recent ticket in same category
      const recentSnap = await getDocs(query(collection(db, 'support_tickets'), where('phone', '==', user.phone)));
      const existing = recentSnap.docs.map(d => d.data());
      const hasOpenSameCategory = existing.find(t => t.category === category?.id && (t.status === 'Open' || t.status === 'In Progress'));
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const recentSameCategory = existing.find(t => t.category === category?.id && t.createdAt > last24h);
      if (hasOpenSameCategory || recentSameCategory) {
        setSending(false);
        setStep('done');
        return;
      }
      const ticketData = {
        retailer: user.name, phone: user.phone, shop: user.shop || '',
        subject: category?.label + (subCategory ? ` - ${subCategory}` : ''),
        category: category?.id, subCategory, message: message.trim(),
        priority, status: 'Open',
        createdAt: new Date().toISOString(),
        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      };
      if (orderRef) ticketData.orderRef = orderRef;
      if (category?.id === 'bug') {
        ticketData.deviceInfo = {
          userAgent: navigator.userAgent.slice(0, 200),
          screen: `${window.innerWidth}x${window.innerHeight}`,
          platform: navigator.platform,
          online: navigator.onLine,
        };
      }
      await addDoc(collection(db, 'support_tickets'), ticketData);
      setStep('done');
    } catch (err) {}
    setSending(false);
  };

  const resetForm = () => { setStep('category'); setCategory(null); setSubCategory(''); setMessage(''); setPriority('medium'); setOrderRef(''); };

  const sendReply = async (ticketId) => {
    if (!replyText.trim()) return;
    try {
      await updateDoc(doc(db, 'support_tickets', ticketId), {
        messages: arrayUnion({ from: 'retailer', text: replyText.trim(), time: new Date().toISOString() }),
        status: 'Open',
      });
      setReplyText(''); setReplyTo(null); fetchTickets();
    } catch (err) {}
  };

  const statusColor = {
    'Open': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
    'In Progress': 'bg-royal-50 text-royal-700 border-royal-200 dark:bg-royal-900/20 dark:text-royal-400 dark:border-royal-800',
    'Resolved': 'bg-mint-50 text-mint-700 border-mint-200 dark:bg-mint-900/20 dark:text-mint-400 dark:border-mint-800',
  };

  return (
    <div className="pb-24 space-y-5 max-w-2xl mx-auto">
      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 dark:bg-[#111111] p-1 rounded-2xl">
        <button onClick={() => setTab('new')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === 'new' ? 'bg-white dark:bg-[#1a1a1a] text-gray-800 dark:text-white shadow-sm' : 'text-gray-500'}`}>
          New Ticket
        </button>
        <button onClick={() => setTab('history')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === 'history' ? 'bg-white dark:bg-[#1a1a1a] text-gray-800 dark:text-white shadow-sm' : 'text-gray-500'}`}>
          My Tickets {tickets.length > 0 && `(${tickets.length})`}
        </button>
      </div>

      {/* New Ticket */}
      {tab === 'new' && (
        <AnimatePresence mode="wait">
          {/* Step 1: Category */}
          {step === 'category' && (
            <motion.div key="cat" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
              <p className="text-sm font-bold text-gray-700 dark:text-gray-200">What do you need help with?</p>
              {CATEGORIES.map(cat => (
                <motion.button key={cat.id} whileTap={{ scale: 0.98 }}
                  onClick={() => { setCategory(cat); setStep('details'); }}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-100 dark:border-[#222222] bg-white dark:bg-[#111111] hover:border-royal-200 dark:hover:border-royal-800 transition-all text-left`}>
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${cat.bg}`}>
                    <cat.icon size={20} className={cat.color} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-800 dark:text-white">{cat.label}</p>
                    {cat.subs.length > 0 && <p className="text-[10px] text-gray-400 mt-0.5">{cat.subs.slice(0, 3).join(' • ')}</p>}
                  </div>
                  <ChevronRight size={16} className="text-gray-300" />
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* Step 2: Details */}
          {step === 'details' && category && (
            <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
              {/* Back + Category badge */}
              <div className="flex items-center gap-3">
                <button onClick={() => setStep('category')} className="text-xs font-bold text-royal-600 dark:text-royal-400">← Back</button>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${category.bg}`}>
                  <category.icon size={12} className={category.color} />
                  <span className={`text-xs font-bold ${category.color}`}>{category.label}</span>
                </div>
              </div>

              {/* Sub-category */}
              {category.subs.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Specific Issue</label>
                  <div className="flex flex-wrap gap-2">
                    {category.subs.map(s => (
                      <button key={s} onClick={() => setSubCategory(s)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${subCategory === s ? 'bg-royal-600 text-white' : 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-[#333333]'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Order reference (for order/payment issues) */}
              {(category.id === 'order' || category.id === 'payment') && recentOrders.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Related Order (optional)</label>
                  <select value={orderRef} onChange={e => setOrderRef(e.target.value)}
                    className="w-full py-3 px-4 text-sm font-semibold bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#222222] rounded-2xl outline-none focus:border-royal-400 dark:text-white">
                    <option value="">Select order</option>
                    {recentOrders.map(o => (
                      <option key={o.id} value={o.id}>{o.date} — ₹{o.total} ({o.items?.length} items)</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Priority */}
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Priority</label>
                <div className="flex gap-2">
                  {[{ v: 'low', l: 'Low', c: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-[#1a1a1a] dark:text-gray-300 dark:border-[#333333]' }, { v: 'medium', l: 'Medium', c: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800' }, { v: 'high', l: 'High', c: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' }].map(p => (
                    <button key={p.v} onClick={() => setPriority(p.v)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${priority === p.v ? p.c + ' ring-2 ring-offset-1 ring-royal-300' : 'bg-gray-50 dark:bg-[#111111] text-gray-400 border-gray-200 dark:border-[#222222]'}`}>
                      {p.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Describe your issue</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)}
                  placeholder={category.id === 'bug' ? 'What happened? What were you doing when the issue occurred?' : 'Describe your issue in detail...'}
                  rows={4}
                  className="w-full py-3.5 px-4 text-sm bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#222222] rounded-2xl outline-none focus:border-royal-400 resize-none text-gray-800 dark:text-white placeholder:text-gray-400" />
              </div>

              {/* Bug: device info notice */}
              {category.id === 'bug' && (
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                  <Bug size={12} className="text-green-600 shrink-0" />
                  <p className="text-[10px] text-green-700 dark:text-green-400 font-medium">Device info will be auto-attached for debugging</p>
                </div>
              )}

              {/* Submit */}
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubmit} disabled={sending || !message.trim()}
                className="w-full py-4 rounded-2xl text-base font-bold bg-gradient-to-r from-royal-700 via-royal-600 to-mint-700 text-white shadow-lg shadow-royal-600/20 disabled:opacity-50 flex items-center justify-center gap-2">
                {sending ? (
                  <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                ) : (
                  <><Send size={16} /> Submit Ticket</>
                )}
              </motion.button>
            </motion.div>
          )}

          {/* Step 3: Done */}
          {step === 'done' && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10">
              <div className="w-16 h-16 bg-mint-100 dark:bg-mint-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={28} className="text-mint-600" strokeWidth={3} />
              </div>
              <h3 className="text-lg font-extrabold text-gray-800 dark:text-white">Ticket Submitted!</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">We'll respond as soon as possible.</p>
              <div className="flex gap-3 mt-6">
                <button onClick={() => { setTab('history'); resetForm(); fetchTickets(); }}
                  className="flex-1 py-3 rounded-xl text-sm font-bold bg-royal-50 dark:bg-royal-900/20 text-royal-700 dark:text-royal-300 border border-royal-200 dark:border-royal-800">
                  View Tickets
                </button>
                <button onClick={resetForm}
                  className="flex-1 py-3 rounded-xl text-sm font-bold bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-300">
                  New Ticket
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Ticket History */}
      {tab === 'history' && (
        <div>
          {loadingTickets ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-[#111111] rounded-2xl animate-pulse" />)}</div>
          ) : tickets.length > 0 ? (
            <div className="space-y-3">
              {tickets.map((t, i) => (
                <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}
                  className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-100 dark:border-[#222222] p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-bold text-gray-800 dark:text-white">{t.subject}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">{t.date} • <span className={`w-1.5 h-1.5 rounded-full inline-block ${t.priority === 'high' ? 'bg-red-500' : t.priority === 'low' ? 'bg-gray-400' : 'bg-amber-500'}`} /> <span className={`font-bold ${t.priority === 'high' ? 'text-red-500' : t.priority === 'low' ? 'text-gray-400' : 'text-amber-500'}`}>{t.priority === 'high' ? 'High' : t.priority === 'low' ? 'Low' : 'Medium'}</span></p>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${statusColor[t.status] || statusColor['Open']}`}>{t.status}</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">{t.message}</p>

                  {t.messages?.length > 0 && (
                    <div className="mt-3 space-y-2 max-h-[200px] overflow-y-auto">
                      {t.messages.map((msg, mi) => (
                        <div key={mi} className={`rounded-xl p-3 ${msg.from === 'admin' ? 'bg-royal-50 dark:bg-royal-900/20 border border-royal-100 dark:border-royal-800' : 'bg-gray-50 dark:bg-[#1a1a1a]'}`}>
                          <p className={`text-[10px] font-bold mb-0.5 ${msg.from === 'admin' ? 'text-royal-600 dark:text-royal-400' : 'text-gray-500'}`}>{msg.from === 'admin' ? '👨‍💼 Admin' : 'You'}</p>
                          <p className="text-xs text-gray-700 dark:text-gray-200">{msg.text}</p>
                          <p className="text-[9px] text-gray-400 mt-1">{new Date(msg.time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-[#222222]">
                    {(t.status === 'Open' || t.status === 'In Progress') ? (
                      replyTo === t.id ? (
                        <div>
                          <textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Type reply..." rows={2}
                            className="w-full py-2.5 px-3 text-sm bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333333] rounded-xl outline-none focus:border-royal-400 resize-none dark:text-white" />
                          <div className="flex gap-2 mt-2">
                            <button onClick={() => { setReplyTo(null); setReplyText(''); }} className="flex-1 py-2 rounded-lg text-xs font-bold text-gray-500 bg-gray-100 dark:bg-[#1a1a1a]">Cancel</button>
                            <button onClick={() => sendReply(t.id)} className="flex-1 py-2 rounded-lg text-xs font-bold text-white bg-royal-600">Send</button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setReplyTo(t.id)} className="w-full py-2.5 rounded-xl text-xs font-bold text-royal-700 bg-royal-50 dark:bg-royal-900/20 border border-royal-200 dark:border-royal-800">Reply →</button>
                      )
                    ) : (
                      <motion.button whileTap={{ scale: 0.97 }} onClick={async () => {
                        try { await updateDoc(doc(db, 'support_tickets', t.id), { status: 'Open' }); fetchTickets(); } catch(e) {}
                      }} className="w-full py-2.5 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                        ↩ Reopen Ticket
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Headphones size={36} className="text-gray-200 dark:text-[#444444] mx-auto mb-3" />
              <p className="text-sm text-gray-400">No tickets yet</p>
            </div>
          )}
        </div>
      )}

      {/* Quick Contact */}
      <div>
        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1 mb-3">Quick Contact</p>
        <div className="grid grid-cols-2 gap-3">
          <a href={`https://wa.me/91${shopPhone}`} target="_blank" rel="noreferrer"
            className="flex items-center gap-3 p-4 bg-white dark:bg-[#111111] rounded-2xl border border-gray-100 dark:border-[#222222]">
            <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
              <MessageCircle size={18} className="text-green-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-800 dark:text-white">WhatsApp</p>
              <p className="text-[10px] text-gray-400">Quick chat</p>
            </div>
          </a>
          <a href={`tel:+91${shopPhone}`}
            className="flex items-center gap-3 p-4 bg-white dark:bg-[#111111] rounded-2xl border border-gray-100 dark:border-[#222222]">
            <div className="w-10 h-10 bg-royal-50 dark:bg-royal-900/20 rounded-xl flex items-center justify-center">
              <Phone size={18} className="text-royal-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-800 dark:text-white">Call</p>
              <p className="text-[10px] text-gray-400">Direct call</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}

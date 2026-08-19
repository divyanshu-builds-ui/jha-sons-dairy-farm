import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ShoppingBag, Truck, Receipt, MessageSquareText, ChevronDown, ChevronUp, Smartphone, RotateCcw, Clock, CircleHelp } from 'lucide-react';

const fadeUp = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 } };

const steps = [
  {
    icon: Smartphone,
    title: 'App Install करें',
    titleEn: 'Install the App',
    color: 'from-indigo-600 to-violet-700',
    steps: [
      'Browser में lucygarden.in खोलें',
      'Tap 3-dot menu (⋮) at top-right, then tap "Add to Home Screen"',
      'अब यह आपके फोन में app की तरह खुलेगा',
      'Login करें — अपना Phone Number और PIN डालें',
    ],
    stepsEn: [
      'Open lucygarden.in in your browser',
      'Tap 3-dot menu (⋮) at top-right, then tap "Add to Home Screen"',
      'Now it will open like a native app on your phone',
      'Login with your Phone Number and PIN',
    ],
  },
  {
    icon: ShoppingBag,
    title: 'Order कैसे करें',
    titleEn: 'How to Place Order',
    color: 'from-mint-600 to-emerald-700',
    steps: [
      'Home page पर "Order" बटन दबाएं',
      'Products की list दिखेगी — + / - से quantity चुनें',
      'नीचे Cart bar दिखेगा — "Checkout" दबाएं',
      'Order review करें — सब सही है तो "Place Order" दबाएं',
      'Order confirmed! सुबह delivery होगी',
    ],
    stepsEn: [
      'Tap "Order" button on Home page',
      'You will see product list — use + / - to select quantity',
      'Cart bar will appear at bottom — tap "Checkout"',
      'Review your order — if correct, tap "Place Order"',
      'Order confirmed! Delivery will happen next morning',
    ],
    note: 'Order window: दोपहर 12 बजे से शाम 4 बजे तक',
    noteEn: 'Order window: 12 PM to 4 PM only',
  },
  {
    icon: Truck,
    title: 'Order Track करें',
    titleEn: 'Track Your Order',
    color: 'from-sky-500 to-blue-700',
    steps: [
      '"Track" page पर जाएं',
      'आपका आज का order status दिखेगा:',
      'Confirmed → Order place हो गया',
      'Dispatched → Delivery के लिए निकल गया',
      'Delivered → आपको मिल गया',
      'Cancelled → Order cancel हो गया',
      'अगर order अभी Confirmed है तो "Cancel Order" बटन से cancel कर सकते हैं',
      'Dispatched होने के बाद cancel नहीं हो सकता',
      'Dispatched पर — "Dispatch Slip" PDF download होगा (blue themed)',
      'Delivered पर — "Final Invoice" PDF download होगा (green themed)',
    ],
    stepsEn: [
      'Go to "Track" page',
      'You will see today\'s order status:',
      'Confirmed → Order is placed',
      'Dispatched → Out for delivery',
      'Delivered → You received it',
      'Cancelled → Order was cancelled',
      'If order is still Confirmed, you can cancel it using "Cancel Order" button',
      'Cannot cancel after dispatch',
      'On Dispatched — download "Dispatch Slip" PDF (blue themed)',
      'On Delivered — download "Final Invoice" PDF (green themed)',
    ],
  },
  {
    icon: Receipt,
    title: 'Ledger / हिसाब देखें',
    titleEn: 'View Ledger / Payment History',
    color: 'from-amber-500 to-orange-600',
    steps: [
      '"Ledger" page पर जाएं',
      'Date range select करें (From — To)',
      'Daily opening balance, product amount, deposit, closing balance दिखेगा',
      'PDF print भी कर सकते हैं',
    ],
    stepsEn: [
      'Go to "Ledger" page',
      'Select date range (From — To)',
      'You will see daily opening, product amount, deposit, closing balance',
      'You can also print PDF',
    ],
    note: 'Tip: अगर कोई गलती दिखे तो तुरंत admin को बताएं',
    noteEn: 'Tip: If you see any mistake, inform admin immediately',
  },
  {
    icon: MessageSquareText,
    title: 'Support / Help',
    titleEn: 'Get Support',
    color: 'from-purple-500 to-fuchsia-600',
    steps: [
      '"Support" page पर जाएं',
      'Subject और message लिखें',
      '"Send" दबाएं — ticket बन जाएगा',
      'Admin reply करेगा — notification आएगा',
      'या सीधे WhatsApp/Call करें: 9939079107',
    ],
    stepsEn: [
      'Go to "Support" page',
      'Write subject and message',
      'Tap "Send" — a ticket will be created',
      'Admin will reply — you will get notification',
      'Or directly WhatsApp/Call: 9939079107',
    ],
  },
  {
    icon: RotateCcw,
    title: 'Order History',
    titleEn: 'Past Orders',
    color: 'from-slate-600 to-gray-800',
    steps: [
      '"History" page पर जाएं',
      'पिछले सभी orders दिखेंगे',
      'किसी भी order पर tap करें — details दिखेगा',
      '"Re-order" बटन से same order फिर से place कर सकते हैं',
    ],
    stepsEn: [
      'Go to "History" page',
      'All your past orders will be shown',
      'Tap any order to see details',
      'Use "Re-order" button to place same order again',
    ],
  },
];

const faqs = [
  { q: 'What happens if my account is blocked?', qEn: 'What happens if my account is blocked?', a: 'Agar admin ne aapka account block kiya hai toh login ke baad "Account Suspended" page dikhega. Wahan pe reason dikhegi, pending due dikhega, aur "Request Unblock" button se support ticket raise kar sakte hain. Admin se call bhi kar sakte hain.', aEn: 'If admin blocks your account, you will see an "Account Suspended" page after login. It shows the reason, pending dues, and a "Request Unblock" button to raise a support ticket. You can also call admin directly.' },
  { q: 'Order cancel कैसे करें?', qEn: 'How to cancel order?', a: 'Track page पर जाएं — अगर order अभी "Confirmed" है तो "Cancel Order" बटन दिखेगा। एक बार dispatch हो जाए तो cancel नहीं होगा — admin को call करें।', aEn: 'Go to Track page — if order is still "Confirmed", you will see "Cancel Order" button. Once dispatched, it cannot be cancelled — call admin.' },
  { q: 'Dispatch Slip और Invoice में क्या फर्क है?', qEn: 'What is the difference between Dispatch Slip and Invoice?', a: 'Dispatch Slip (blue) tab delivery के दौरान मिलता है — इसमें लिखा होता है quantities adjust हो सकती हैं। Final Invoice (green) delivery complete होने के बाद मिलता है — यह final bill है।', aEn: 'Dispatch Slip (blue) is available during delivery — it mentions quantities may be adjusted. Final Invoice (green) is available after delivery — this is the final bill.' },
  { q: 'Order modify कैसे करें?', qEn: 'How to modify order?', a: 'अगर order अभी Confirmed है तो दोबारा order place करें — पुराना replace हो जाएगा। Dispatched हो गया तो admin को call करें।', aEn: 'If order is still Confirmed, place a new order — old one will be replaced. If Dispatched, call admin.' },
  { q: 'PIN भूल गया?', qEn: 'Forgot PIN?', a: 'Admin को call करें (9939079107) — वो reset कर देंगे।', aEn: 'Call admin (9939079107) — they will reset it.' },
  { q: 'Order window बंद है?', qEn: 'Order window closed?', a: 'Order सिर्फ 12 PM से 4 PM तक place हो सकता है। इसके बाहर products देख सकते हैं लेकिन order नहीं।', aEn: 'Orders can only be placed 12 PM to 4 PM. Outside this, you can view products but cannot order.' },
  { q: 'Payment कैसे होगा?', qEn: 'How does payment work?', a: 'Delivery के समय cash दे सकते हैं। Ledger में सब record होता है।', aEn: 'You can pay cash at delivery time. Everything is recorded in ledger.' },
  { q: 'App काम नहीं कर रहा?', qEn: 'App not working?', a: 'Internet check करें। Browser cache clear करें। फिर भी नहीं हो तो admin को बताएं।', aEn: 'Check internet. Clear browser cache. If still not working, inform admin.' },
  { q: 'पुराने orders कब तक दिखते हैं?', qEn: 'How long is order history available?', a: 'App में पिछले 12 महीनों के orders दिखते हैं। पुराने records के लिए PDF invoice download करके रखें।', aEn: 'Last 12 months of orders are shown in the app. Download PDF invoices for long-term records.' },
];

export default function Guide() {
  const [lang, setLang] = useState('en');
  const [openStep, setOpenStep] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="pb-24 space-y-5 max-w-5xl lg:mx-auto">
      {/* Welcome Card */}
      <motion.div {...fadeUp} transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-royal-700 via-royal-600 to-mint-600 rounded-2xl p-5 text-white relative">
        <button onClick={() => setLang(l => l === 'hi' ? 'en' : 'hi')}
          className="absolute top-4 right-4 text-[11px] font-bold bg-white/20 text-white px-3 py-1.5 rounded-lg border border-white/30 backdrop-blur-sm">
          {lang === 'hi' ? 'English' : 'हिंदी'}
        </button>
        <Sparkles size={24} className="mb-2 opacity-80" />
        <h2 className="text-lg font-extrabold">
          {lang === 'hi' ? 'Lucy Garden App Guide' : 'Lucy Garden App Guide'}
        </h2>
        <p className="text-sm text-white/80 mt-1">
          {lang === 'hi'
            ? 'यह guide आपको सिखाएगी कि app कैसे use करना है — order करना, track करना, ledger देखना, support लेना।'
            : 'This guide will teach you how to use the app — placing orders, tracking, viewing ledger, getting support.'}
        </p>
      </motion.div>

      {/* Steps + FAQ — 2 col on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 space-y-2.5">
        {steps.map((step, i) => {
          const isOpen = openStep === i;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}
              className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#222222] overflow-hidden">
              <button onClick={() => setOpenStep(isOpen ? -1 : i)}
                className="w-full flex items-center gap-3 p-4 text-left">
                <div className={`w-10 h-10 bg-gradient-to-br ${step.color} rounded-xl flex items-center justify-center shrink-0`}>
                  <step.icon size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[14px] text-gray-800 dark:text-white">
                    {lang === 'hi' ? step.title : step.titleEn}
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">Step {i + 1} of {steps.length}</p>
                </div>
                {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }} className="overflow-hidden">
                    <div className="px-4 pb-4 pt-0">
                      <div className="space-y-2 ml-[52px]">
                        {(lang === 'hi' ? step.steps : step.stepsEn).map((s, si) => (
                          <div key={si} className="flex items-start gap-2">
                            <span className="text-[10px] font-bold text-royal-600 dark:text-royal-400 bg-royal-50 dark:bg-royal-900/30 w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5">{si + 1}</span>
                            <p className="text-sm text-gray-700 dark:text-gray-200">{s}</p>
                          </div>
                        ))}
                      </div>
                      {(lang === 'hi' ? step.note : step.noteEn) && (
                        <div className="ml-[52px] mt-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2">
                          <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">{lang === 'hi' ? step.note : step.noteEn}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* FAQ — right column on desktop */}
      <div className="lg:col-span-2 lg:sticky lg:top-20 lg:self-start">
      <motion.div {...fadeUp} transition={{ delay: 0.3 }}>
        <div className="flex items-center gap-2 mb-3">
          <CircleHelp size={16} className="text-royal-600 dark:text-royal-400" />
          <h3 className="text-sm font-extrabold text-gray-800 dark:text-white uppercase tracking-wider">
            {lang === 'hi' ? 'अक्सर पूछे जाने वाले सवाल' : 'Frequently Asked Questions'}
          </h3>
        </div>
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white dark:bg-[#111111] rounded-xl border border-gray-200 dark:border-[#222222] overflow-hidden">
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-3.5 text-left">
                <p className="text-sm font-bold text-gray-700 dark:text-gray-200 pr-2">{lang === 'hi' ? faq.q : faq.qEn}</p>
                {openFaq === i ? <ChevronUp size={14} className="text-gray-400 shrink-0" /> : <ChevronDown size={14} className="text-gray-400 shrink-0" />}
              </button>
              <AnimatePresence>
                {openFaq === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }} className="overflow-hidden">
                    <p className="px-3.5 pb-3.5 text-sm text-gray-500 dark:text-gray-400">{lang === 'hi' ? faq.a : faq.aEn}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </motion.div>
      </div>
      </div>

      {/* Quick Contact */}
      <motion.div {...fadeUp} transition={{ delay: 0.4 }}
        className="bg-gray-50 dark:bg-[#111111]/50 border border-gray-200 dark:border-[#222222] rounded-2xl p-4 text-center">
        <p className="text-sm font-bold text-gray-700 dark:text-gray-200">
          {lang === 'hi' ? 'कोई और सवाल?' : 'Any other questions?'}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {lang === 'hi' ? 'WhatsApp या Call करें' : 'WhatsApp or Call us'}
        </p>
        <a href="https://wa.me/919939079107" className="inline-flex items-center gap-2 mt-3 px-5 py-2.5 bg-green-600 text-white text-xs font-bold rounded-xl">
          WhatsApp: 9939079107
        </a>
      </motion.div>
    </div>
  );
}

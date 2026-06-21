import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Server, Bug, Radio, BarChart3, UserCheck, Rocket, Megaphone, Database, Flag, ScrollText, Star, IndianRupee, Bell, Download, HardDrive, Wifi, Zap, Clock, GitCompare, ChevronDown, ChevronUp, CircleHelp, Terminal, FileEdit, RefreshCw, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const fadeUp = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 } };

const sections = [
  {
    icon: Server,
    title: 'Dev Panel (Home)',
    route: '/dev',
    color: 'from-green-600 to-emerald-800',
    desc: 'App health monitor — Firebase status, quick stats, system overview.',
    steps: [
      'Shows Firebase connection status (green = connected, red = down)',
      'Quick stats: total users, orders, products, errors count',
      'Response time indicator — how fast Firebase is responding',
      'Quick action buttons: jump to any dev tool instantly',
      'System info: React version, environment, build mode',
      'If Firebase is down, you\'ll see red alert with error details',
    ],
    tips: 'This is your first stop. If something feels wrong, check here first.',
  },
  {
    icon: BarChart3,
    title: 'Admin Dashboard (Updated)',
    route: '/admin',
    color: 'from-royal-600 to-royal-800',
    desc: 'Premium analytics donut chart, always-visible delivery progress, PDF report download.',
    steps: [
      'Premium Donut Ring Chart — animated SVG showing delivered vs pending orders',
      'Always visible — shows 0% empty state when no orders (never hidden)',
      'Color coded: mint-500 (delivered arc) + amber-400 (pending arc)',
      'Breakdown stats on right: delivered/pending bars + total count',
      'Report PDF download — Daily Business Report with stats, demand, defaulters',
      'Dispatch Slip PDF (blue themed) on Dispatched status',
      'Final Invoice PDF (green themed) on Delivered status',
      'Colors match app UI exactly: royal-700 (#0136e4) for blue, mint-700 (#17a966) for green',
    ],
    tips: 'Donut chart uses pure SVG + Framer Motion. No chart library needed.',
  },
  {
    icon: Bug,
    title: 'Error Logs',
    route: '/dev/errors',
    color: 'from-red-600 to-rose-800',
    desc: 'All app crashes with stack trace, user info, and suggested fixes.',
    steps: [
      'Shows all errors captured automatically from the app',
      'Each error shows: message, file, line number, timestamp',
      'Click any error to expand — see full stack trace',
      'User info shown: who was logged in when crash happened',
      'Suggested fix shown if error matches known patterns',
      '"Resolve" button marks error as fixed (won\'t show again)',
      '"Clear All" deletes all error logs (use with caution)',
      'Errors auto-captured via errorLogger.js service',
    ],
    tips: 'Check this daily. If same error repeats, it needs immediate fix.',
  },
  {
    icon: Radio,
    title: 'Sessions',
    route: '/dev/sessions',
    color: 'from-blue-600 to-indigo-800',
    desc: 'Who\'s logged in right now. Force logout, unblock, reset PINs.',
    steps: [
      'Shows all users with active sessions (green dot = online)',
      'Each card shows: name, phone, device, last active time',
      '"Force Logout" — terminates their session immediately',
      '"Unblock" — removes login lockout (after 5 wrong PINs)',
      '"Reset PIN" — sets PIN back to default (from settings)',
      'Session expiry time shown — auto-logout after timeout',
      'Admin sessions shown separately (multi-device allowed)',
      'Blocked users shown in red with block reason',
    ],
    tips: 'If a retailer says "I can\'t login" — check here first. Unblock or reset PIN.',
  },
  {
    icon: BarChart3,
    title: 'Order Analytics',
    route: '/dev/analytics',
    color: 'from-purple-600 to-violet-800',
    desc: 'Order trends, peak hours, top products, revenue patterns.',
    steps: [
      'Date range selector at top — choose period to analyze',
      'Order count chart — daily orders over selected period',
      'Peak hours chart — which hours get most orders',
      'Top products — most ordered items ranked',
      'Revenue trend — daily revenue line chart',
      'Average order value shown with trend arrow',
      'Compare with previous period (week/month)',
    ],
    tips: 'Use this to understand business patterns. Peak hours help plan delivery timing.',
  },
  {
    icon: UserCheck,
    title: 'Retailer Activity',
    route: '/dev/activity',
    color: 'from-teal-600 to-cyan-800',
    desc: 'Which retailers are active, slowing down, or gone inactive.',
    steps: [
      'Three categories: Active (ordered recently), Slowing (less frequent), Inactive (no orders 7+ days)',
      'Each retailer shows: last order date, total orders, frequency',
      'Color coded: green = active, amber = slowing, red = inactive',
      'Click retailer to see their order pattern',
      'Useful to identify retailers who might need a call',
      'Export inactive list for follow-up',
    ],
    tips: 'If a retailer goes inactive, admin should call them. Business retention tool.',
  },
  {
    icon: Rocket,
    title: 'Deploy Info',
    route: '/dev/deploy',
    color: 'from-orange-500 to-red-700',
    desc: 'App version, Vercel deployments, database stats, performance metrics.',
    steps: [
      'Current app version shown prominently (from config.js)',
      'Vercel deployments list — last 5 deploys with status',
      'Database stats — document count per collection (click "Scan")',
      'Usage & Limits — Firestore free tier usage tracking',
      'Service Worker status — PWA install readiness',
      'Performance metrics — page load, FCP, DOM ready times',
      'Device info — screen, memory, connection speed',
      'Deploy checklist — HTTPS, SW, manifest, Firebase status',
      '"Force Update" — clears cache + reloads for all users',
    ],
    tips: 'After every deploy, check here to confirm new version is live.',
  },
  {
    icon: Megaphone,
    title: 'Announcements',
    route: '/dev/announce',
    color: 'from-pink-600 to-rose-700',
    desc: 'Send banner messages to all retailers instantly.',
    steps: [
      'Type announcement message in the text box',
      'Select type: info (blue), warning (amber), success (green), urgent (red)',
      'Select target: all users, retailers only, or admin only',
      'Set expiry — banner auto-hides after this time',
      '"Send" — banner appears on all targeted users\' screens immediately',
      'Active announcements shown below — can delete anytime',
      'Banner shows at top of RetailerLayout/AdminLayout',
    ],
    tips: 'Use for: price changes, holiday notices, app updates, urgent messages.',
  },
  {
    icon: Database,
    title: 'DB Cleanup',
    route: '/dev/cleanup',
    color: 'from-gray-600 to-slate-800',
    desc: 'Delete old data to keep database clean and within free tier.',
    steps: [
      'Shows current document count per collection',
      'Select what to clean: old orders, old errors, old audit logs',
      'Set retention period: keep last 30/60/90 days',
      '"Preview" shows how many documents will be deleted',
      '"Clean" button requires confirmation (critical action)',
      'Progress bar shows deletion progress',
      'After cleanup, shows freed document count',
      'Recommended: run monthly to stay within Firestore free tier',
    ],
    tips: 'ALWAYS preview before cleaning. Never clean "users" or "products" — only logs/old orders.',
  },
  {
    icon: Flag,
    title: 'Feature Flags',
    route: '/dev/flags',
    color: 'from-emerald-600 to-green-800',
    desc: 'Toggle app features ON/OFF without redeploying code.',
    steps: [
      'Shows all toggleable features with ON/OFF switch',
      'Toggle any feature — takes effect immediately for all users',
      'Each flag shows: name, description, current state',
      'Confirmation popup before every toggle (safety)',
      'Features: seasonal products, support tickets, order history, ledger, dark mode, PDF invoice, duplicate check, balance warning, company order, bulk price',
      'Stats at top: how many enabled vs disabled',
      'Changes saved to Firestore settings/featureFlags document',
    ],
    tips: 'Use to disable broken features without deploying fix. Re-enable after fix.',
  },
  {
    icon: ScrollText,
    title: 'Audit Log',
    route: '/dev/audit',
    color: 'from-amber-600 to-yellow-800',
    desc: 'History of all admin/dev actions — who did what, when.',
    steps: [
      'Shows chronological list of all actions performed',
      'Each entry: action type, description, who did it, timestamp',
      'Filter by action type: order, payment, user, settings, etc.',
      'Search by description or user',
      'Useful for debugging: "who changed this setting?"',
      'Auto-logged from admin panel actions',
      'Pagination for large logs (50 per page)',
    ],
    tips: 'If something changed unexpectedly, audit log tells you who did it.',
  },
  {
    icon: Star,
    title: 'App Ratings',
    route: '/dev/ratings',
    color: 'from-yellow-500 to-amber-700',
    desc: 'View all user ratings, average score, distribution chart.',
    steps: [
      'Average rating shown prominently (out of 5 stars)',
      'Star distribution chart — how many 1★, 2★, 3★, 4★, 5★',
      'Individual ratings list: user name, rating, date, device',
      'Delete individual ratings or clear all',
      'Ratings come from: Welcome Popup (first login) + Settings page',
      'Stored in app_ratings collection',
    ],
    tips: 'Low ratings = UX problem. Check which users gave low and ask them why.',
  },
  {
    icon: IndianRupee,
    title: 'Revenue Dashboard',
    route: '/dev/revenue',
    color: 'from-green-500 to-emerald-700',
    desc: 'Income overview — today, weekly, monthly revenue with daily chart.',
    steps: [
      'Three stat cards: today\'s revenue, 7-day total, 30-day total',
      'Daily revenue bar chart — last 30 days visual',
      'Hover on bars to see exact amount + date',
      'Summary section: total orders, avg order value, avg daily revenue',
      'Data pulled from orders collection (actualTotal or total field)',
      'Refresh button to reload latest data',
    ],
    tips: 'Check daily to track business health. Sudden drops = investigate.',
  },
  {
    icon: Bell,
    title: 'Notification Center',
    route: '/dev/notifications',
    color: 'from-blue-500 to-indigo-700',
    desc: 'Send and manage push notifications to users.',
    steps: [
      'Compose section: type message, select target (all/retailers/admin)',
      '"Send" button — creates notification in Firestore',
      'Sent notifications listed below with timestamp',
      'Delete individual notifications',
      'Target options: All Users, Retailers Only, Admin Only',
      'Stored in notifications collection',
    ],
    tips: 'Different from Announcements — notifications are stored, banners are temporary.',
  },
  {
    icon: Download,
    title: 'Data Export',
    route: '/dev/export',
    color: 'from-cyan-600 to-blue-800',
    desc: 'Download database collections as JSON or CSV files.',
    steps: [
      'Choose format: JSON (structured) or CSV (spreadsheet)',
      'Select collections to export (checkboxes)',
      '"Select All" to export entire database',
      'Click "Export" — file downloads to your device',
      'JSON: nested structure, good for backup/restore',
      'CSV: flat structure, good for Excel/Google Sheets analysis',
      'File named with date: lucy-garden-export-2026-06-01.json',
    ],
    tips: 'Export monthly for offline backup. Use CSV for sharing data with non-tech people.',
  },
  {
    icon: HardDrive,
    title: 'Backup & Restore',
    route: '/dev/backup',
    color: 'from-indigo-600 to-purple-800',
    desc: 'Create database snapshots and restore if something goes wrong.',
    steps: [
      '"Create Backup" — snapshots users, products, settings, balances',
      'Backup stored in Firestore backups collection (as JSON string)',
      'Each backup shows: timestamp, document count',
      '"Restore" — OVERWRITES current data with backup (dangerous!)',
      'Restore requires critical confirmation (type to confirm)',
      '"Delete" — removes old backups you don\'t need',
      'Recommended: backup before any major change (price update, cleanup)',
    ],
    tips: 'ALWAYS backup before: bulk price change, DB cleanup, or settings change.',
  },
  {
    icon: Wifi,
    title: 'API Response Monitor',
    route: '/dev/api-monitor',
    color: 'from-sky-600 to-blue-800',
    desc: 'Test Firebase query latency for each collection/document.',
    steps: [
      '"Test All" — pings every Firestore endpoint and measures response time',
      'Results show: endpoint name, type (collection/doc), response time, status',
      'Color coded: green (<200ms), amber (200-500ms), red (>500ms)',
      'Summary: average latency, slowest endpoint, error count',
      'Test history — compare performance over multiple runs',
      'Endpoints tested: users, orders, products, settings/app, settings/featureFlags, announcements',
    ],
    tips: 'If avg > 500ms, Firebase might be throttling. Check usage limits.',
  },
  {
    icon: Zap,
    title: 'Real-time Dashboard',
    route: '/dev/realtime',
    color: 'from-yellow-500 to-orange-700',
    desc: 'Live data feed — orders appearing in real-time, active users count.',
    steps: [
      'Uses Firestore onSnapshot — data updates WITHOUT refresh',
      'Active users count — who has valid session right now',
      'Today\'s orders count — updates as new orders come in',
      'Today\'s revenue — live running total',
      'Recent orders feed — last 8 orders with status, amount, retailer',
      'Connection indicator: green "Live" = connected, red = disconnected',
      'Pulse animation on cards when new data arrives',
    ],
    tips: 'Keep this open during order window (12-4 PM) to monitor live activity.',
  },
  {
    icon: Clock,
    title: 'Scheduled Tasks',
    route: '/dev/tasks',
    color: 'from-slate-600 to-gray-800',
    desc: 'Create and manage automated maintenance jobs.',
    steps: [
      '"+" button to add new task — name, schedule (hourly/daily/weekly), action',
      'Available actions: cleanup errors, cleanup old orders, reset usage, sync balances, clear expired sessions',
      'Enable/Disable toggle — pauses task without deleting',
      '"Run Now" — executes task immediately (manual trigger)',
      '"Delete" — removes task permanently',
      'Last run timestamp shown for each task',
      'Tasks stored in scheduled_tasks collection',
      'Note: actual scheduling needs Cloud Functions (this is the config UI)',
    ],
    tips: 'Set up daily cleanup for errors and weekly for old orders.',
  },
  {
    icon: GitCompare,
    title: 'Config Diff',
    route: '/dev/config-diff',
    color: 'from-violet-600 to-fuchsia-800',
    desc: 'Compare current live config vs default values — spot changes instantly.',
    steps: [
      'Shows total number of config differences from defaults',
      'App Settings section: order timing, session timeout, min amount, etc.',
      'Feature Flags section: which flags are non-default',
      'Each diff shows: key name, default value (red strikethrough), current value (green)',
      '"Copy" button — copies full live config as JSON to clipboard',
      'Raw JSON view at bottom — see complete current configuration',
      'Green summary = all defaults, Amber = has changes',
    ],
    tips: 'After debugging, check here to see if someone changed settings unexpectedly.',
  },
  {
    icon: FileEdit,
    title: 'Doc Editor',
    route: '/dev/editor',
    color: 'from-rose-600 to-pink-800',
    desc: 'Read, edit, or delete any document in any Firestore collection directly from the app.',
    steps: ['Select collection from dropdown', 'Fetch by doc ID or search by field value', 'Use "List First 20" to browse', 'Edit JSON in textarea', 'Save (overwrites) or Delete with confirmation'],
    tips: 'Use this for quick fixes — like correcting a product name in an order or fixing a wrong balance.',
  },
  {
    icon: RefreshCw,
    title: 'Bulk Update',
    route: '/dev/bulk-update',
    color: 'from-orange-600 to-amber-800',
    desc: 'Find multiple documents by a field filter and update a specific field across all of them at once.',
    steps: ['Select collection', 'Set filter field + value (e.g. date = "15 Jun 2026")', 'Click Find — see matched docs', 'Set field to update + new value', 'Execute — updates all matched docs with progress bar'],
    tips: 'Perfect for fixing product name/price changes across all orders, or bulk-updating a field after schema changes.',
  },
  {
    icon: FileText,
    title: 'Monthly Report',
    route: '/dev/report',
    color: 'from-sky-600 to-cyan-800',
    desc: 'Generate a monthly summary report to send to client. Shows orders, revenue, retailers, dues, and system health.',
    steps: ['Select month', 'Click Generate — data auto-calculated', 'Copy for WhatsApp (formatted text)', 'Or download as .txt file'],
    tips: 'Standard plan requires monthly report to client. Use this on 1st of every month for previous month summary.',
  },
];

const faqs = [
  { q: 'How does the retailer block system work?', a: 'Admin blocks from Retailers page (inline form with dropdown reasons). Blocked user can login with correct PIN but only sees "Account Suspended" page with reason + dues info.' },
  { q: 'What\'s the difference between Dispatch Slip and Invoice PDF?', a: 'Dispatch Slip (blue, royal-700) downloads when order is Dispatched. Final Invoice (green, mint-700) downloads when Delivered. Formats differ.' },
  { q: 'How to access Dev Console?', a: 'Login with phone 8051725780 and PIN (set in Firebase settings/devAccess). You\'ll be redirected to /dev automatically.' },
  { q: 'Dev PIN not working?', a: 'Check Firebase → settings → devAccess → pin field. Default is 0000. After 5 wrong attempts, you get force-logged out.' },
  { q: 'Can admin access dev tools?', a: 'No. Dev console is hardcoded to phone 8051725780 only. Admin has separate panel at /admin.' },
  { q: 'App crashed and I can\'t access dev console?', a: 'Use the standalone emergency console at lucygarden.in/dev-console/ — it works independently of React app.' },
  { q: 'How to add a new dev tool page?', a: '1) Create file in src/pages/dev/ 2) Add lazy import in App.js 3) Add route in /dev children 4) Add nav link in DeveloperLayout.js' },
  { q: 'Feature flag not taking effect?', a: 'Flags update on next page load for retailers. Check FeatureFlags context is wrapping the component that reads it.' },
  { q: 'Database approaching free tier limit?', a: 'Go to Deploy Info → Usage section. If >80%, run DB Cleanup immediately. Export data first as backup.' },
  { q: 'How to deploy a new version?', a: 'git add -A → git commit → git push. If auto-deploy is set, it goes live. Otherwise run: npm run deploy.' },
  { q: 'Vercel API showing 403?', a: 'Hobby plan doesn\'t support REST API tokens. Upgrade to Pro or use Vercel Dashboard directly.' },
  { q: 'How to reset everything?', a: 'Backup first! Then: clear Firestore collections, re-run seed.js, redeploy. Nuclear option — only for emergencies.' },
];

export default function DevGuide() {
  const navigate = useNavigate();
  const [openStep, setOpenStep] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? sections.filter(s => s.title.toLowerCase().includes(search.toLowerCase()) || s.desc.toLowerCase().includes(search.toLowerCase()))
    : sections;

  return (
    <div className="space-y-3 sm:space-y-5 pb-6 sm:pb-10 px-3 sm:px-0 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div {...fadeUp} className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-extrabold text-white truncate">Developer Guide</h2>
          <p className="text-[9px] sm:text-[10px] text-gray-500 truncate">Guide for {sections.length} dev tools</p>
        </div>
        <div className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-green-900/20 border border-green-800/50 shrink-0">
          <Terminal size={10} className="sm:size-[11px] text-green-400" />
          <span className="text-[8px] sm:text-[9px] font-bold text-green-400 hidden sm:inline">{sections.length} Tools</span>
          <span className="text-[8px] font-bold text-green-400 sm:hidden">{sections.length}</span>
        </div>
      </motion.div>

      {/* Welcome Card */}
      <motion.div {...fadeUp} transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-[#0f1a0f] via-[#1a2e1a] to-[#0d1f0d] rounded-lg sm:rounded-2xl p-3 sm:p-5 border border-green-900/40">
        <Sparkles size={18} className="sm:size-[22px] mb-1.5 sm:mb-2 text-green-400" />
        <h2 className="text-base sm:text-lg font-extrabold text-white">Developer Console</h2>
        <p className="text-[10px] sm:text-sm text-green-200/60 mt-1">
          Complete reference for all developer tools and features.
        </p>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 sm:mt-3 text-[9px] sm:text-[10px] text-gray-500">
          <span>/dev/*</span>
          <span>•</span>
          <span>Phone: 8051725780</span>
          <span>•</span>
          <span>{sections.length} tools</span>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div {...fadeUp} transition={{ delay: 0.15 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search tools..."
          className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-800"
        />
      </motion.div>

      {/* Sections */}
      <div className="space-y-2.5">
        {filtered.map((section, i) => {
          const isOpen = openStep === i;
          return (
            <motion.div
              key={section.route}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.02 * i }}
              className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden"
            >
              <button
                onClick={() => setOpenStep(isOpen ? -1 : i)}
                className="w-full flex items-center gap-3 p-4 text-left"
              >
                <div className={`w-10 h-10 bg-gradient-to-br ${section.color} rounded-xl flex items-center justify-center shrink-0`}>
                  <section.icon size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[14px] text-white">{section.title}</p>
                  <p className="text-[11px] text-gray-500 leading-snug line-clamp-2">{section.desc}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[8px] font-mono text-gray-600 hidden sm:block">{section.route}</span>
                  {isOpen ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                </div>
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-0">
                      {/* Steps */}
                      <div className="space-y-2">
                        {section.steps.map((s, si) => (
                          <div key={si} className="flex items-start gap-2">
                            <span className="text-[10px] font-bold text-green-400 bg-green-900/30 w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5">{si + 1}</span>
                            <p className="text-xs text-gray-300 leading-relaxed">{s}</p>
                          </div>
                        ))}
                      </div>
                      {/* Tip */}
                      {section.tips && (
                        <div className="mt-3 bg-amber-900/20 border border-amber-800/40 rounded-xl px-3 py-2">
                          <p className="text-xs text-amber-300/80 font-medium">Pro tip: {section.tips}</p>
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

      {/* FAQ */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <CircleHelp size={14} className="text-green-400" />
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">FAQ — Developer Questions</h3>
        </div>
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-3.5 text-left"
              >
                <p className="text-sm font-bold text-gray-200 pr-2">{faq.q}</p>
                {openFaq === i ? <ChevronUp size={14} className="text-gray-500 shrink-0" /> : <ChevronDown size={14} className="text-gray-500 shrink-0" />}
              </button>
              <AnimatePresence>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <p className="px-3.5 pb-3.5 text-sm text-gray-400">{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-2">
        <p className="text-[10px] text-gray-600">Lucy Garden Dev Console · {sections.length} tools · Built by Divyanshu Gupta</p>
      </div>
    </div>
  );
}

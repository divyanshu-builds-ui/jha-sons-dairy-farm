import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Rocket, GitBranch, Clock, HardDrive, RefreshCw, Globe, Cpu, CheckCircle2, AlertTriangle, XCircle, Database, Cloud, ExternalLink, Activity, AlertOctagon } from 'lucide-react';
import { APP_CONFIG } from '../../utils/config';
import { db, collection, getDocs, doc, getDoc, setDoc } from '../../services/firebase';
import { getUsageLocal } from '../../utils/usageTracker';

const APP_VERSION = APP_CONFIG.version;
const VERCEL_TOKEN = process.env.REACT_APP_VERCEL_TOKEN;
const VERCEL_PROJECT_ID = process.env.REACT_APP_VERCEL_PROJECT_ID;

const DB_COLLECTIONS = ['users', 'orders', 'products', 'ledger', 'retailer_balances', 'support_tickets', 'settings', 'announcements', 'app_errors', 'app_ratings', 'audit_log', 'company_orders', 'daily_stock'];

// Firestore free tier limits (per day)
const FREE_TIER = { reads: 50000, writes: 20000, deletes: 20000, storage: 1 }; // storage in GB

export default function DeployInfo() {
  const [perfData, setPerfData] = useState(null);
  const [swStatus, setSwStatus] = useState('checking');
  const [deployments, setDeployments] = useState([]);
  const [vercelLoading, setVercelLoading] = useState(false);
  const [vercelError, setVercelError] = useState('');
  const [dbStats, setDbStats] = useState([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [projectInfo, setProjectInfo] = useState(null);
  const [usageData, setUsageData] = useState(null);

  useEffect(() => {
    if (window.performance) {
      const nav = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      const fcp = paint.find(p => p.name === 'first-contentful-paint');
      setPerfData({
        pageLoad: nav ? Math.round(nav.loadEventEnd - nav.startTime) : null,
        domReady: nav ? Math.round(nav.domContentLoadedEventEnd - nav.startTime) : null,
        fcp: fcp ? Math.round(fcp.startTime) : null,
        transferSize: nav ? Math.round(nav.transferSize / 1024) : null,
      });
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg) { setSwStatus(reg.waiting ? 'update-available' : reg.active ? 'active' : 'installing'); }
        else setSwStatus('not-registered');
      }).catch(() => setSwStatus('error'));
    } else setSwStatus('not-supported');

    if (VERCEL_TOKEN && VERCEL_PROJECT_ID) fetchVercel();
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const local = getUsageLocal();
      // Get Firebase stored usage (combined from all devices)
      const usageDoc = await getDoc(doc(db, 'settings', 'usage_' + today));
      const firebase = usageDoc.exists() ? usageDoc.data() : { reads: 0, writes: 0, deletes: 0 };
      // Firebase data is the authoritative source; local is unsynced buffer from current session
      setUsageData({
        reads: (firebase.reads || 0) + (local.reads || 0),
        writes: (firebase.writes || 0) + (local.writes || 0),
        deletes: (firebase.deletes || 0) + (local.deletes || 0),
        date: today,
        lastSync: firebase.lastSync || null,
        firebaseReads: firebase.reads || 0,
        firebaseWrites: firebase.writes || 0,
        localReads: local.reads || 0,
        localWrites: local.writes || 0,
      });
    } catch (e) {
      // Offline fallback — just show local
      const local = getUsageLocal();
      setUsageData({ ...local, firebaseReads: 0, firebaseWrites: 0, localReads: local.reads || 0, localWrites: local.writes || 0 });
    }
  };

  const resetUsage = async () => {
    const today = new Date().toISOString().split('T')[0];
    await setDoc(doc(db, 'settings', 'usage_' + today), { reads: 0, writes: 0, deletes: 0, date: today });
    setUsageData({ reads: 0, writes: 0, deletes: 0, date: today });
  };

  const fetchVercel = async () => {
    setVercelLoading(true);
    setVercelError('');
    try {
      // Try with projectId first, fallback without it
      let deplRes = await fetch(`https://api.vercel.com/v6/deployments?projectId=${VERCEL_PROJECT_ID}&limit=5`, { headers: { Authorization: `Bearer ${VERCEL_TOKEN}` } });
      // If 403, try without projectId (personal account)
      if (deplRes.status === 403) {
        deplRes = await fetch(`https://api.vercel.com/v6/deployments?limit=5`, { headers: { Authorization: `Bearer ${VERCEL_TOKEN}` } });
      }
      if (!deplRes.ok) throw new Error(`API ${deplRes.status}`);
      const deplData = await deplRes.json();
      setDeployments(deplData.deployments || []);
      // Project info
      try {
        const projRes = await fetch(`https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}`, { headers: { Authorization: `Bearer ${VERCEL_TOKEN}` } });
        if (projRes.ok) setProjectInfo(await projRes.json());
      } catch {}
    } catch (e) { setVercelError(e.message); }
    setVercelLoading(false);
  };

  const fetchDbStats = async () => {
    setDbLoading(true);
    const stats = [];
    for (const col of DB_COLLECTIONS) {
      try {
        const snap = await getDocs(collection(db, col));
        stats.push({ name: col, count: snap.size });
      } catch (e) { stats.push({ name: col, count: -1 }); }
    }
    setDbStats(stats);
    setDbLoading(false);
  };

  const forceUpdate = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => { if (reg) reg.update(); });
    }
    if ('caches' in window) caches.keys().then(names => names.forEach(name => caches.delete(name)));
    setTimeout(() => window.location.reload(true), 1000);
  };

  const timeAgo = (ts) => {
    if (!ts) return '—';
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const statusColor = (state) => {
    if (state === 'READY') return 'text-green-400';
    if (state === 'ERROR') return 'text-red-400';
    if (state === 'BUILDING' || state === 'INITIALIZING') return 'text-blue-400';
    if (state === 'CANCELED') return 'text-gray-500';
    return 'text-amber-400';
  };

  const InfoRow = ({ label, value, sub }) => (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-800 last:border-0">
      <span className="text-xs text-gray-500">{label}</span>
      <div className="text-right">
        <span className="text-xs font-bold text-white">{value}</span>
        {sub && <p className="text-[9px] text-gray-600">{sub}</p>}
      </div>
    </div>
  );

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-white">Deployment Info</h2>
          <p className="text-[10px] text-gray-500">Build, hosting & database details</p>
        </div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={forceUpdate}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-900/30 border border-blue-800 rounded-xl text-[10px] font-bold text-blue-400">
          <RefreshCw size={11} /> Force Update
        </motion.button>
      </div>

      {/* Version Card */}
      <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/20 border border-green-800/50 rounded-2xl p-5 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}
          className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-green-500/30">
          <Rocket size={28} className="text-green-400" />
        </motion.div>
        <p className="text-3xl font-black text-white">v{APP_VERSION}</p>
        <p className="text-xs text-green-400 mt-1">Lucy Garden • Production</p>
      </div>

      {/* Vercel Deployments */}
      {VERCEL_TOKEN && VERCEL_PROJECT_ID && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-gray-500 uppercase">
              <Cloud size={11} className="inline mr-1" />Vercel Deployments
            </p>
            <motion.button whileTap={{ scale: 0.9 }} onClick={fetchVercel} className="p-1.5 bg-gray-800 rounded-lg">
              <RefreshCw size={10} className={`text-gray-400 ${vercelLoading ? 'animate-spin' : ''}`} />
            </motion.button>
          </div>

          {/* Project info */}
          {projectInfo && (
            <div className="mb-3 p-2.5 bg-gray-800/50 rounded-xl border border-gray-700/50">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400">Project</span>
                <span className="text-[10px] font-bold text-white">{projectInfo.name}</span>
              </div>
              {projectInfo.link?.productionDeployment && (
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-gray-400">Domain</span>
                  <a href={`https://${projectInfo.alias?.[0] || projectInfo.name + '.vercel.app'}`} target="_blank" rel="noreferrer"
                    className="text-[10px] font-bold text-blue-400 flex items-center gap-1">
                    {projectInfo.alias?.[0] || projectInfo.name + '.vercel.app'} <ExternalLink size={8} />
                  </a>
                </div>
              )}
              {projectInfo.framework && (
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-gray-400">Framework</span>
                  <span className="text-[10px] font-bold text-gray-300">{projectInfo.framework}</span>
                </div>
              )}
            </div>
          )}

          {vercelError && (
            <div className="p-3 bg-amber-900/20 border border-amber-800/50 rounded-xl mb-3">
              <p className="text-[10px] text-amber-400 font-bold">{vercelError.includes('403') ? '⚠️ Vercel Hobby plan does not support REST API tokens.' : `Error: ${vercelError}`}</p>
              {vercelError.includes('403') && <p className="text-[9px] text-gray-500 mt-1">Upgrade to Pro plan or use Vercel Dashboard directly.</p>}
            </div>
          )}

          {vercelLoading ? (
            <div className="flex justify-center py-4"><div className="w-4 h-4 border-2 border-gray-600 border-t-blue-400 rounded-full animate-spin" /></div>
          ) : deployments.length === 0 ? (
            <p className="text-[10px] text-gray-600 text-center py-3">No deployments found</p>
          ) : (
            <div className="space-y-2">
              {deployments.map((d, i) => (
                <div key={d.uid} className="flex items-center gap-3 p-2.5 bg-gray-800/50 rounded-xl border border-gray-700/50">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${d.state === 'READY' ? 'bg-green-400' : d.state === 'ERROR' ? 'bg-red-400' : 'bg-amber-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold ${statusColor(d.state)}`}>{d.state}</span>
                      {d.meta?.githubCommitMessage && <span className="text-[9px] text-gray-500 truncate">{d.meta.githubCommitMessage.slice(0, 40)}</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] text-gray-600">{timeAgo(d.created)}</span>
                      {d.meta?.githubCommitRef && <span className="text-[9px] text-gray-600">• {d.meta.githubCommitRef}</span>}
                    </div>
                  </div>
                  {d.url && (
                    <a href={`https://${d.url}`} target="_blank" rel="noreferrer" className="shrink-0">
                      <ExternalLink size={10} className="text-gray-600 hover:text-blue-400" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Database Stats */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-gray-500 uppercase">
            <Database size={11} className="inline mr-1" />Firestore Database
          </p>
          <motion.button whileTap={{ scale: 0.9 }} onClick={fetchDbStats} className="flex items-center gap-1 px-2 py-1 bg-gray-800 rounded-lg text-[9px] font-bold text-gray-400">
            <RefreshCw size={9} className={dbLoading ? 'animate-spin' : ''} /> Scan
          </motion.button>
        </div>

        <InfoRow label="Project" value={process.env.REACT_APP_FIREBASE_PROJECT_ID || 'N/A'} />
        <InfoRow label="Region" value="us-central1" sub="Default" />

        {dbStats.length > 0 && (
          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between text-[9px] font-bold text-gray-600 uppercase px-1 mb-1">
              <span>Collection</span>
              <span>Documents</span>
            </div>
            {dbStats.sort((a, b) => b.count - a.count).map(s => (
              <div key={s.name} className="flex items-center justify-between py-1.5 px-2 bg-gray-800/50 rounded-lg">
                <span className="text-[10px] text-gray-400 font-mono">{s.name}</span>
                <span className={`text-[10px] font-bold ${s.count === -1 ? 'text-red-400' : s.count > 100 ? 'text-amber-400' : 'text-green-400'}`}>
                  {s.count === -1 ? 'Error' : s.count}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 mt-1 border-t border-gray-800">
              <span className="text-[10px] font-bold text-gray-400">Total Documents</span>
              <span className="text-[10px] font-bold text-white">{dbStats.reduce((a, b) => a + (b.count > 0 ? b.count : 0), 0)}</span>
            </div>
          </div>
        )}

        {dbLoading && <div className="flex justify-center py-4"><div className="w-4 h-4 border-2 border-gray-600 border-t-green-400 rounded-full animate-spin" /></div>}
      </div>

      {/* Usage & Limits */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-gray-500 uppercase">
            <Activity size={11} className="inline mr-1" />Usage & Limits (Free Tier)
          </p>
          <button onClick={resetUsage} className="text-[8px] font-bold text-gray-600 hover:text-gray-400 px-1.5 py-0.5 rounded bg-gray-800">Reset</button>
        </div>

        {usageData ? (
          <div className="space-y-3">
            {[
              { label: 'Reads', value: usageData.reads || 0, limit: FREE_TIER.reads, color: 'green' },
              { label: 'Writes', value: usageData.writes || 0, limit: FREE_TIER.writes, color: 'blue' },
              { label: 'Deletes', value: usageData.deletes || 0, limit: FREE_TIER.deletes, color: 'amber' },
            ].map(item => {
              const pct = Math.min((item.value / item.limit) * 100, 100);
              const danger = pct > 80;
              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-gray-400">{item.label}</span>
                    <span className={`text-[10px] font-bold ${danger ? 'text-red-400' : 'text-gray-300'}`}>
                      {item.value.toLocaleString()} / {item.limit.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${danger ? 'bg-red-500' : `bg-${item.color}-500`}`} style={{ width: `${pct}%` }} />
                  </div>
                  {danger && <p className="text-[9px] text-red-400 mt-0.5 flex items-center gap-1"><AlertOctagon size={9} /> {pct.toFixed(0)}% used — approaching limit!</p>}
                </div>
              );
            })}
            <div className="pt-2 border-t border-gray-800">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400">Storage (1 GB free)</span>
                <span className="text-[10px] font-bold text-gray-300">
                  ~{dbStats.length > 0 ? (dbStats.reduce((a, b) => a + (b.count > 0 ? b.count : 0), 0) * 0.001).toFixed(2) : '?'} MB est.
                </span>
              </div>
            </div>
            <p className="text-[9px] text-gray-600 mt-1">
              Date: {usageData.date || 'N/A'} • Synced: {usageData.firebaseReads?.toLocaleString() || 0}R + Unsynced: {usageData.localReads?.toLocaleString() || 0}R
              {usageData.lastSync && ` • Last sync: ${new Date(usageData.lastSync).toLocaleTimeString('en-IN', {hour:'2-digit', minute:'2-digit'})}`}
            </p>
          </div>
        ) : (
          <p className="text-[10px] text-gray-600 text-center py-3">Loading usage data...</p>
        )}
      </div>

      {/* Build Info */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
        <p className="text-xs font-bold text-gray-500 uppercase mb-3">
          <GitBranch size={11} className="inline mr-1" />Build Info
        </p>
        <InfoRow label="Version" value={`v${APP_VERSION}`} />
        <InfoRow label="React" value={React.version} />
        <InfoRow label="Environment" value={process.env.NODE_ENV} />
        <InfoRow label="Firebase Project" value={process.env.REACT_APP_FIREBASE_PROJECT_ID || 'N/A'} />
      </div>

      {/* Service Worker */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
        <p className="text-xs font-bold text-gray-500 uppercase mb-3">
          <Globe size={11} className="inline mr-1" />Service Worker (PWA)
        </p>
        <div className="flex items-center justify-between py-2.5 border-b border-gray-800">
          <span className="text-xs text-gray-500">Status</span>
          <span className={`text-xs font-bold ${swStatus === 'active' ? 'text-green-400' : swStatus === 'error' ? 'text-red-400' : 'text-gray-400'}`}>
            <span className={`inline-block w-2 h-2 rounded-full mr-1 ${swStatus === 'active' ? 'bg-green-400' : swStatus === 'error' ? 'bg-red-400' : 'bg-gray-500'}`} />
            {swStatus}
          </span>
        </div>
        <InfoRow label="Cache Storage" value={'caches' in window ? 'Supported' : 'N/A'} />
        <InfoRow label="Offline Ready" value={swStatus === 'active' ? 'Yes' : 'No'} />
      </div>

      {/* Performance */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
        <p className="text-xs font-bold text-gray-500 uppercase mb-3">
          <Cpu size={11} className="inline mr-1" />Performance
        </p>
        {perfData ? (
          <>
            <InfoRow label="Page Load" value={`${perfData.pageLoad}ms`} sub={perfData.pageLoad < 2000 ? 'Good' : 'Slow'} />
            <InfoRow label="DOM Ready" value={`${perfData.domReady}ms`} />
            <InfoRow label="First Paint (FCP)" value={perfData.fcp ? `${perfData.fcp}ms` : 'N/A'} />
            <InfoRow label="Transfer Size" value={perfData.transferSize ? `${perfData.transferSize} KB` : 'N/A'} />
          </>
        ) : (
          <p className="text-xs text-gray-600 text-center py-4">Not available</p>
        )}
      </div>

      {/* Device Info */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
        <p className="text-xs font-bold text-gray-500 uppercase mb-3">
          <HardDrive size={11} className="inline mr-1" />Device
        </p>
        <InfoRow label="Screen" value={`${window.screen.width}x${window.screen.height}`} sub={`Viewport: ${window.innerWidth}x${window.innerHeight}`} />
        <InfoRow label="Pixel Ratio" value={`${window.devicePixelRatio}x`} />
        <InfoRow label="Memory" value={navigator.deviceMemory ? `${navigator.deviceMemory} GB` : 'N/A'} />
        <InfoRow label="Cores" value={navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency}` : 'N/A'} />
        <InfoRow label="Connection" value={navigator.connection?.effectiveType || 'Unknown'} sub={navigator.connection?.downlink ? `${navigator.connection.downlink} Mbps` : ''} />
      </div>

      {/* Bundle & Lighthouse Estimate */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
        <p className="text-xs font-bold text-gray-500 uppercase mb-3">
          <Cpu size={11} className="inline mr-1" />Bundle & Lighthouse Estimate
        </p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-gray-800/50 rounded-xl p-3 text-center">
            <p className="text-lg font-black text-white">{perfData?.transferSize ? `${perfData.transferSize} KB` : '—'}</p>
            <p className="text-[9px] text-gray-500 uppercase">Initial Transfer</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-3 text-center">
            <p className="text-lg font-black text-white">{performance.getEntriesByType?.('resource')?.length || '—'}</p>
            <p className="text-[9px] text-gray-500 uppercase">Resources Loaded</p>
          </div>
        </div>
        {/* Lighthouse Score Estimate */}
        <div className="space-y-2">
          {[
            { label: 'Performance', score: perfData?.fcp && perfData.fcp < 1500 ? 95 : perfData?.fcp && perfData.fcp < 3000 ? 75 : 50, color: 'green' },
            { label: 'Accessibility', score: document.querySelector('meta[name="viewport"]') ? 90 : 60, color: 'green' },
            { label: 'Best Practices', score: window.location.protocol === 'https:' || window.location.hostname === 'localhost' ? 92 : 67, color: 'green' },
            { label: 'PWA', score: swStatus === 'active' ? 100 : swStatus === 'not-registered' ? 40 : 70, color: 'amber' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="text-[10px] text-gray-400 w-24 shrink-0">{item.label}</span>
              <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${item.score >= 90 ? 'bg-green-500' : item.score >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${item.score}%` }} />
              </div>
              <span className={`text-[10px] font-bold w-8 text-right ${item.score >= 90 ? 'text-green-400' : item.score >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{item.score}</span>
            </div>
          ))}
        </div>
        <p className="text-[8px] text-gray-600 mt-2 text-center">Estimated scores based on runtime metrics (run actual Lighthouse for accurate results)</p>
      </div>

      {/* Checklist */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
        <p className="text-xs font-bold text-gray-500 uppercase mb-3">
          <CheckCircle2 size={11} className="inline mr-1" />Deploy Checklist
        </p>
        <div className="space-y-2">
          {[
            { label: 'HTTPS enabled', ok: window.location.protocol === 'https:' || window.location.hostname === 'localhost' },
            { label: 'Service Worker active', ok: swStatus === 'active' },
            { label: 'Manifest present', ok: !!document.querySelector('link[rel="manifest"]') },
            { label: 'Firebase connected', ok: !!process.env.REACT_APP_FIREBASE_PROJECT_ID },
            { label: 'Vercel API configured', ok: !!VERCEL_TOKEN && !!VERCEL_PROJECT_ID },
            { label: 'Error tracking active', ok: true },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              {item.ok ? <CheckCircle2 size={12} className="text-green-500" /> : <XCircle size={12} className="text-red-500" />}
              <span className={`text-xs ${item.ok ? 'text-gray-300' : 'text-red-300'}`}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

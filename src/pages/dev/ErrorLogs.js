import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bug, Lightbulb, ChevronDown, ChevronUp, CheckCircle2, RefreshCw, Trash2, Filter } from 'lucide-react';
import { getErrors, clearErrors, getErrorSolution, resolveError } from '../../services/errorLogger';
import { useConfirm } from '../../components/ConfirmModal';

export default function ErrorLogs() {
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedError, setExpandedError] = useState(null);
  const [clearing, setClearing] = useState(false);
  const [errorFilter, setErrorFilter] = useState('unresolved'); // all | unresolved | resolved
  const confirm = useConfirm();

  useEffect(() => { fetchErrors(); }, []);

  const fetchErrors = async () => {
    setLoading(true);
    try { setErrors(await getErrors()); } catch (e) {}
    setLoading(false);
  };

  const handleClear = async () => {
    const ok = await confirm({ title: 'Clear All Errors', message: `Delete all ${errors.length} error logs? This cannot be undone.`, confirmText: 'Clear All', type: 'critical' });
    if (!ok) return;
    setClearing(true);
    await clearErrors();
    setErrors([]);
    setClearing(false);
  };

  const handleResolve = async (id) => {
    await resolveError(id);
    setErrors(prev => prev.map(e => e.id === id ? { ...e, resolved: true, resolvedAt: new Date().toISOString() } : e));
  };

  const filtered = errorFilter === 'all' ? errors : errorFilter === 'resolved' ? errors.filter(e => e.resolved) : errors.filter(e => !e.resolved);
  const highCount = filtered.filter(e => e.severity === 'high').length;
  const medCount = filtered.filter(e => e.severity === 'medium').length;
  const lowCount = filtered.filter(e => e.severity === 'low').length;

  return (
    <div className="space-y-5 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-white">Error Logs</h2>
          <p className="text-[10px] text-gray-500">{errors.length} total errors captured</p>
        </div>
        <div className="flex gap-2">
          <motion.button whileTap={{ scale: 0.9 }} onClick={fetchErrors}
            className="p-2.5 bg-gray-800 border border-gray-700 rounded-xl">
            <RefreshCw size={14} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </motion.button>
          {errors.length > 0 && (
            <motion.button whileTap={{ scale: 0.9 }} onClick={handleClear} disabled={clearing}
              className="p-2.5 bg-red-900/30 border border-red-800 rounded-xl disabled:opacity-50">
              <Trash2 size={14} className="text-red-400" />
            </motion.button>
          )}
        </div>
      </div>

      {errors.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-3 text-center">
            <p className="text-lg font-black text-red-400">{highCount}</p>
            <p className="text-[9px] font-bold text-red-500/70 uppercase">High</p>
          </div>
          <div className="bg-amber-900/20 border border-amber-800/50 rounded-xl p-3 text-center">
            <p className="text-lg font-black text-amber-400">{medCount}</p>
            <p className="text-[9px] font-bold text-amber-500/70 uppercase">Medium</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-3 text-center">
            <p className="text-lg font-black text-gray-300">{lowCount}</p>
            <p className="text-[9px] font-bold text-gray-500 uppercase">Low</p>
          </div>
        </div>
      )}

      {/* Filter */}
      {errors.length > 0 && (
        <div className="flex items-center gap-2">
          <Filter size={11} className="text-gray-500" />
          {['unresolved', 'resolved', 'all'].map(f => (
            <button key={f} onClick={() => setErrorFilter(f)}
              className={`text-[9px] font-bold px-2.5 py-1 rounded-lg border transition-all ${errorFilter === f ? 'bg-royal-900/30 border-royal-700 text-royal-400' : 'bg-gray-800 border-gray-700 text-gray-500'}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)} {f === 'unresolved' ? `(${errors.filter(e => !e.resolved).length})` : f === 'resolved' ? `(${errors.filter(e => e.resolved).length})` : `(${errors.length})`}
            </button>
          ))}
        </div>
      )}

      {errors.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle2 size={36} className="text-green-600 mx-auto mb-3" />
          <p className="text-sm font-bold text-gray-400">No errors! App is healthy 🎉</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-gray-500">No {errorFilter} errors</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((err, i) => {
            const { title, solution } = getErrorSolution(err.message);
            const isExpanded = expandedError === i;
            const severityBorder = err.severity === 'high' ? 'border-red-800/60' : err.severity === 'low' ? 'border-gray-700' : 'border-amber-800/60';
            const severityBadge = err.severity === 'high' ? 'bg-red-900/50 text-red-400 border-red-700' : err.severity === 'low' ? 'bg-gray-800 text-gray-400 border-gray-600' : 'bg-amber-900/50 text-amber-400 border-amber-700';
            return (
              <div key={err.id || i} className={`rounded-2xl border bg-gray-900/50 p-3 sm:p-4 ${severityBorder} ${err.resolved ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between cursor-pointer gap-2" onClick={() => setExpandedError(isExpanded ? null : i)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[9px] font-bold text-gray-600 bg-gray-800 w-5 h-5 rounded-md flex items-center justify-center shrink-0">{i + 1}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${severityBadge}`}>{(err.severity || 'medium').toUpperCase()}</span>
                      {err.resolved && <span className="text-[9px] font-bold px-2 py-0.5 rounded border bg-green-900/50 text-green-400 border-green-700">RESOLVED</span>}
                      <span className="text-[10px] text-gray-500">{new Date(err.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-[13px] sm:text-sm font-bold text-white line-clamp-2">{title}</p>
                    <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">{err.message?.slice(0, 100)}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 mt-1">
                    {!err.resolved && (
                      <button onClick={(e) => { e.stopPropagation(); handleResolve(err.id); }}
                        className="text-[9px] font-bold px-2 py-1 rounded-lg bg-green-900/30 border border-green-800 text-green-400 hover:bg-green-900/50">
                        Resolve
                      </button>
                    )}
                    {isExpanded ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
                  </div>
                </div>
                {isExpanded && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 space-y-2.5">
                    <div className="bg-black rounded-xl p-3 border border-gray-800 overflow-hidden">
                      <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Error Message</p>
                      <p className="text-[11px] text-red-400 font-mono break-all leading-relaxed">{err.message}</p>
                    </div>
                    {err.stack && (
                      <div className="bg-black rounded-xl p-3 border border-gray-800 overflow-hidden">
                        <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Stack Trace</p>
                        <pre className="text-[10px] text-gray-400 font-mono break-all whitespace-pre-wrap max-h-[120px] sm:max-h-[150px] overflow-y-auto leading-relaxed">{err.stack}</pre>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                      <div className="bg-gray-800 rounded-lg p-2.5 border border-gray-700">
                        <span className="text-gray-500">Context:</span>
                        <p className="font-bold text-gray-300 mt-0.5">{err.context || 'runtime'}</p>
                      </div>
                      <div className="bg-gray-800 rounded-lg p-2.5 border border-gray-700">
                        <span className="text-gray-500">User:</span>
                        <p className="font-bold text-gray-300 mt-0.5">{err.user || 'unknown'}</p>
                      </div>
                      <div className="sm:col-span-2 bg-gray-800 rounded-lg p-2.5 border border-gray-700">
                        <span className="text-gray-500">URL:</span>
                        <p className="font-bold text-gray-300 break-all">{err.url}</p>
                      </div>
                    </div>
                    <div className="bg-green-900/20 border border-green-700/50 rounded-xl p-3 sm:p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb size={14} className="text-green-400" />
                        <p className="text-xs font-bold text-green-300">Suggested Fix</p>
                      </div>
                      <p className="text-[12px] sm:text-sm text-green-400/90 leading-relaxed">{solution}</p>
                    </div>
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

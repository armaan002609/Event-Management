'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Search, FileText, ChevronDown, CheckCircle2, Lock } from 'lucide-react';
import { AuditLog } from '@unifest/shared';

export function AuditLogView() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    fetch('/api/audit')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setLogs(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredLogs = logs.filter((l) => {
    if (filterAction && !l.action.toLowerCase().includes(filterAction.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading font-extrabold text-2xl text-slate-900 dark:text-slate-100">Immutable Audit Trail</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-200 border border-transparent dark:border-slate-700 flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" /> Append-Only (BR-10)
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Every room allocation override, meal exception, and schedule modification is recorded with a mandatory reason.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:ring-2 focus:ring-primary focus:outline-none"
          >
            <option value="">All Actions</option>
            <option value="OVERRIDE">Overrides Only</option>
            <option value="EXCEPTION">Exceptions Only</option>
            <option value="EVENT">Event Schedule Changes</option>
            <option value="ALLOCATION">Allocation Runs</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Retrieving audit records...</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Mandatory Audit Reason</th>
                <th className="py-3 px-4 text-right">Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center">
                    <Shield className="w-9 h-9 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">No Audit Records Yet</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
                      All administrative overrides, allocations, meal exceptions, and event updates will be logged here.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(log.at).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                      {new Date(log.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">{log.actorName || log.actorId}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          log.action.includes('OVERRIDE') || log.action.includes('EXCEPTION')
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
                            : 'bg-indigo-50 dark:bg-indigo-950/60 text-primary dark:text-teal-400 border border-indigo-200 dark:border-indigo-800/60'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-mono text-[11px]">{log.entity}</td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 italic max-w-xs truncate">
                      "{log.reason || 'No reason provided'}"
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-primary dark:text-teal-400 hover:underline font-bold text-xs"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* JSON Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative border border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-slate-100">
                  Audit Entry Details
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{selectedLog.action} · {selectedLog.id}</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-300"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-slate-700 dark:text-slate-300">Reason Provided:</span>
                <p className="mt-1 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 italic">
                  "{selectedLog.reason}"
                </p>
              </div>

              {selectedLog.before && (
                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-300">State Before:</span>
                  <pre className="mt-1 p-2 bg-slate-950 text-emerald-400 rounded-xl text-[10px] font-mono overflow-x-auto max-h-36 border border-slate-800">
                    {JSON.stringify(selectedLog.before, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.after && (
                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-300">State After:</span>
                  <pre className="mt-1 p-2 bg-slate-950 text-emerald-400 rounded-xl text-[10px] font-mono overflow-x-auto max-h-36 border border-slate-800">
                    {JSON.stringify(selectedLog.after, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

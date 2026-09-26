import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Radio,
  FileCheck2,
  CopyX
} from 'lucide-react';
import { api } from '../services/api';
import { MonitoringLog } from '../types';

export const MonitoringLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<MonitoringLog[]>([]);
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCompetitor, setSelectedCompetitor] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedStrategy, setSelectedStrategy] = useState('');

  const loadLogs = async () => {
    try {
      setLoading(true);
      const [logsRes, compRes] = await Promise.all([
        api.getMonitoringLogs({
          competitorId: selectedCompetitor,
          status: selectedStatus,
          strategy: selectedStrategy,
          limit: '60'
        }),
        api.getCompetitors()
      ]);
      setLogs(logsRes.logs || []);
      setCompetitors(compRes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [selectedCompetitor, selectedStatus, selectedStrategy]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800/80 gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <History className="w-5 h-5 text-cyan-400" />
            <span>Monitoring Execution & Audit Logs</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete telemetry of every monitoring check, network cycle duration, HTTP status, and duplicate elimination count.
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 transition-colors self-start sm:self-auto"
          title="Refresh logs"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#0e1524] border border-slate-800/80 rounded-xl p-4 shadow-xl grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <select
            value={selectedCompetitor}
            onChange={(e) => setSelectedCompetitor(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Competitor Targets</option>
            {competitors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Check Statuses</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="ERROR">ERROR / FAILED</option>
            <option value="TIMEOUT">TIMEOUT</option>
          </select>
        </div>

        <div>
          <select
            value={selectedStrategy}
            onChange={(e) => setSelectedStrategy(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Detection Strategies</option>
            <option value="RSS">RSS / Atom</option>
            <option value="SITEMAP">XML Sitemap</option>
            <option value="DIRECT_PAGE">Direct HTML Page</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-[#0e1524] border border-slate-800/80 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Competitor</th>
                <th className="py-3 px-4">Strategy</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">URLs Checked</th>
                <th className="py-3 px-4">Found</th>
                <th className="py-3 px-4">New Articles</th>
                <th className="py-3 px-4">Duplicates Ignored</th>
                <th className="py-3 px-4">HTTP Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500 text-xs font-sans">
                    No monitoring check logs recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap text-[11px]">
                      {new Date(log.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white font-sans whitespace-nowrap">
                      {log.competitor?.name || 'Target'}
                    </td>
                    <td className="py-3 px-4 text-cyan-400 whitespace-nowrap">
                      {log.strategy}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                            : 'bg-rose-950/80 text-rose-400 border border-rose-800'
                        }`}
                      >
                        {log.status === 'SUCCESS' ? 'SUCCESS' : 'ERROR'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                      {(log.durationMs / 1000).toFixed(2)}s
                    </td>
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {log.urlsChecked}
                    </td>
                    <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                      {log.articlesFound}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {log.newArticles > 0 ? (
                        <span className="font-bold text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/40">
                          +{log.newArticles}
                        </span>
                      ) : (
                        <span className="text-slate-500">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {log.duplicatesIgnored > 0 ? (
                        <span className="text-slate-400">
                          {log.duplicatesIgnored}
                        </span>
                      ) : (
                        <span className="text-slate-600">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {log.httpStatus || 200}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

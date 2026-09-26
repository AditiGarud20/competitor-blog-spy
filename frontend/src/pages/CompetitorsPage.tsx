import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Plus,
  Play,
  Pause,
  ExternalLink,
  Trash2,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Sliders
} from 'lucide-react';
import { api } from '../services/api';
import { Competitor } from '../types';
import { DelayBadge } from '../components/common/DelayBadge';

export const CompetitorsPage: React.FC = () => {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [checkingId, setCheckingId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'competitors' | 'searches'>('competitors');
  const [searchedWebsites, setSearchedWebsites] = useState<any[]>([]);

  const loadCompetitors = async () => {
    try {
      setLoading(true);
      const [compData, searchData] = await Promise.all([
        api.getCompetitors(),
        api.getSearchedWebsites().catch(() => [])
      ]);
      setCompetitors(compData || []);
      setSearchedWebsites(searchData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompetitors();
  }, []);

  const handleManualCheck = async (id: string) => {
    try {
      setCheckingId(id);
      await api.checkCompetitor(id);
      await loadCompetitors();
    } catch (err: any) {
      alert('Manual check failed: ' + err.message);
    } finally {
      setCheckingId(null);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await api.toggleCompetitor(id);
      await loadCompetitors();
    } catch (err: any) {
      alert('Error updating competitor status: ' + err.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from monitoring?`)) return;
    try {
      await api.deleteCompetitor(id);
      setCompetitors((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handleDeleteSearch = async (id: string) => {
    try {
      await api.deleteSearchedWebsite(id);
      setSearchedWebsites((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      alert('Failed to delete search record: ' + err.message);
    }
  };

  const filtered = competitors.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.websiteUrl.toLowerCase().includes(search.toLowerCase())
  );

  const filteredSearches = searchedWebsites.filter(
    (s) =>
      s.domain.toLowerCase().includes(search.toLowerCase()) ||
      s.websiteUrl.toLowerCase().includes(search.toLowerCase()) ||
      (s.query && s.query.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800/80 gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-cyan-400" />
            <span>AI Competitor Intelligence & Monitoring</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configured target publications and AI-driven multi-strategy detection rules.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadCompetitors}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 transition-colors"
            title="Refresh table"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
          <Link
            to="/competitors/new"
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md shadow-cyan-950 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Competitor</span>
          </Link>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('competitors')}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'competitors'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Active Targets ({competitors.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('searches')}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'searches'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Discovery Index ({searchedWebsites.length})</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder={activeTab === 'competitors' ? "Filter competitors by name or domain..." : "Filter stored website searches..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0e1524] border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
          />
        </div>
        <span className="text-xs font-mono text-slate-400">
          Showing {activeTab === 'competitors' ? filtered.length : filteredSearches.length} records
        </span>
      </div>

      {/* Content Tables */}
      {activeTab === 'competitors' ? (
        <div className="bg-[#0e1524] border border-slate-800/80 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Competitor</th>
                  <th className="py-3.5 px-4">Website</th>
                  <th className="py-3.5 px-4">Monitoring</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Primary Strategy</th>
                  <th className="py-3.5 px-4">Last Checked</th>
                  <th className="py-3.5 px-4">Articles</th>
                  <th className="py-3.5 px-4">Avg Delay</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500 text-xs">
                      No competitors match your search.
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-white">
                        <Link
                          to={`/competitors/${c.id}`}
                          className="hover:text-cyan-400 transition-colors flex items-center space-x-1.5"
                        >
                          <span>{c.name}</span>
                          {c.name === 'ApexTech Systems' && (
                            <span className="text-[9px] bg-cyan-950 text-cyan-400 border border-cyan-800 px-1.5 py-0.2 rounded font-mono">
                              Demo Lab
                            </span>
                          )}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400 max-w-[160px] truncate">
                        <a
                          href={c.websiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-cyan-400 flex items-center space-x-1"
                        >
                          <span className="truncate">{c.websiteUrl}</span>
                          <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-60" />
                        </a>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggle(c.id)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all ${
                            c.enabled
                              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 hover:bg-emerald-900'
                              : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          {c.enabled ? 'ACTIVE' : 'PAUSED'}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            c.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : c.status === 'ERROR'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            c.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-amber-400'
                          }`}></span>
                          <span>{c.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-cyan-400 font-medium">
                        {c.primaryStrategy}
                        {c.secondaryStrategy && (
                          <span className="text-slate-500 text-[10px]"> + {c.secondaryStrategy}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                        {c.lastCheckedAt ? new Date(c.lastCheckedAt).toLocaleTimeString() : 'Pending'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-white">
                        {c.articlesCount || c._count?.articles || 0}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {c.averageDelaySeconds !== null && c.averageDelaySeconds !== undefined ? (
                          <DelayBadge delaySeconds={c.averageDelaySeconds} size="sm" />
                        ) : (
                          <span className="text-slate-500 text-[10px]">Calculating...</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleManualCheck(c.id)}
                            disabled={checkingId === c.id}
                            className="p-1.5 rounded bg-slate-800 hover:bg-cyan-950 hover:text-cyan-400 text-slate-300 transition-colors"
                            title="Run immediate monitoring check"
                          >
                            <Play className={`w-3.5 h-3.5 ${checkingId === c.id ? 'animate-spin' : ''}`} />
                          </button>
                          <Link
                            to={`/competitors/${c.id}`}
                            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            title="View competitor details and sources"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => handleDelete(c.id, c.name)}
                            className="p-1.5 rounded bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 transition-colors"
                            title="Delete competitor"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-[#0e1524] border border-slate-800/80 rounded-xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Global Discovery & AI Analysis Index
              </h2>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Active Memory Core
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Domain / Title</th>
                  <th className="py-3 px-4">Website URL</th>
                  <th className="py-3 px-4">Discovered Sources</th>
                  <th className="py-3 px-4">Recommended Strategy</th>
                  <th className="py-3 px-4">Stored Timestamp</th>
                  <th className="py-3 px-4">Index Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredSearches.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 font-sans">
                      No domains indexed yet. Use the search bar or Add Competitor page to search any domain.
                    </td>
                  </tr>
                ) : (
                  filteredSearches.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-white font-sans">
                        {s.domain}
                      </td>
                      <td className="py-3 px-4 text-slate-400 max-w-xs truncate">
                        <a
                          href={s.websiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-cyan-400 flex items-center space-x-1"
                        >
                          <span className="truncate">{s.websiteUrl}</span>
                          <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-60" />
                        </a>
                      </td>
                      <td className="py-3 px-4 text-[11px]">
                        <div className="flex items-center space-x-2">
                          <span className={s.rssFound ? 'text-emerald-400 font-bold' : 'text-slate-600'}>
                            RSS {s.rssFound ? '✓' : '✗'}
                          </span>
                          <span>&bull;</span>
                          <span className={s.sitemapFound ? 'text-emerald-400 font-bold' : 'text-slate-600'}>
                            Sitemap {s.sitemapFound ? '✓' : '✗'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-cyan-400 font-semibold text-[11px]">
                        {s.primaryStrategy || 'RSS'}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {new Date(s.searchedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                          INDEXED ✓
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleDeleteSearch(s.id)}
                            className="p-1.5 rounded bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 transition-colors"
                            title="Remove from index"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

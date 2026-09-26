import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Search,
  Filter,
  ExternalLink,
  Clock,
  Building2,
  Calendar,
  Eye,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';
import { api } from '../services/api';
import { Article } from '../types';
import { DelayBadge } from '../components/common/DelayBadge';

export const ArticlesPage: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCompetitor, setSelectedCompetitor] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [selectedTarget, setSelectedTarget] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [artRes, compRes] = await Promise.all([
        api.getArticles({
          search,
          competitorId: selectedCompetitor,
          method: selectedMethod,
          target: selectedTarget,
          limit: '50'
        }),
        api.getCompetitors()
      ]);
      setArticles(artRes.articles || []);
      setCompetitors(compRes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCompetitor, selectedMethod, selectedTarget]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800/80 gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span>Detected Competitor Content Intelligence</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time feed of detected blog posts with publication timestamps and exact detection latency.
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 transition-colors self-start sm:self-auto"
          title="Refresh article feed"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#0e1524] border border-slate-800/80 rounded-xl p-4 shadow-xl">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search title, content, author..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Competitor Select */}
          <div>
            <select
              value={selectedCompetitor}
              onChange={(e) => setSelectedCompetitor(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="">All Competitors</option>
              {competitors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Strategy Select */}
          <div>
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="">All Detection Methods</option>
              <option value="RSS">RSS / Atom Feed</option>
              <option value="SITEMAP">XML Sitemap</option>
              <option value="DIRECT_PAGE">Direct Blog Page</option>
            </select>
          </div>

          {/* Target Status Select */}
          <div>
            <select
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="">All Latency SLA Targets</option>
              <option value="within">Within Target (≤ 5 min)</option>
              <option value="above">Above Target (&gt; 5 min)</option>
            </select>
          </div>
        </form>
      </div>

      {/* Articles Table */}
      <div className="bg-[#0e1524] border border-slate-800/80 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Article Title</th>
                <th className="py-3.5 px-4">Competitor</th>
                <th className="py-3.5 px-4">Published (Origin)</th>
                <th className="py-3.5 px-4">Detected (Spy)</th>
                <th className="py-3.5 px-4">Detection Delay</th>
                <th className="py-3.5 px-4">Method</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {articles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 text-xs">
                    No articles match current filters.
                  </td>
                </tr>
              ) : (
                articles.map((art) => (
                  <tr key={art.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white max-w-xs">
                      <Link
                        to={`/articles/${art.id}`}
                        className="hover:text-cyan-400 transition-colors line-clamp-1 block"
                      >
                        {art.title}
                      </Link>
                      <span className="text-[11px] text-slate-400 block font-normal truncate">
                        By {art.author || 'Staff'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-medium whitespace-nowrap">
                      {art.competitor?.name || 'ApexTech Systems'}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(art.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-cyan-400 whitespace-nowrap">
                      {new Date(art.detectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <DelayBadge
                        delaySeconds={art.detectionDelaySeconds}
                        formattedDelay={art.delayFormatted}
                        size="sm"
                      />
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-300 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-400 font-semibold">
                        {art.firstDetectedMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/80">
                        DETECTED
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/articles/${art.id}`}
                          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                          title="View Intelligence Detail & Timeline"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <a
                          href={art.canonicalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded bg-slate-800 hover:bg-cyan-950 hover:text-cyan-400 text-slate-400 transition-colors"
                          title="Open canonical source link"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
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

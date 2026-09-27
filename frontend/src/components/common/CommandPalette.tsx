import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  FileText,
  Building2,
  ExternalLink,
  X,
  ArrowRight,
  Database,
  Globe,
  Sparkles,
  CheckCircle2,
  BrainCircuit,
  Network
} from 'lucide-react';
import { api } from '../../services/api';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [articles, setArticles] = useState<any[]>([]);
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [storedSearches, setStoredSearches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSavingSearch, setIsSavingSearch] = useState(false);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string | null>(null);

  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      loadInitial();
    } else {
      setQuery('');
      setSavedSuccessMsg(null);
    }
  }, [isOpen]);

  const loadInitial = async () => {
    try {
      setLoading(true);
      const [artRes, compRes, searchesRes] = await Promise.all([
        api.getArticles({ limit: '6' }),
        api.getCompetitors(),
        api.getSearchedWebsites().catch(() => [])
      ]);
      setArticles(artRes.articles || []);
      setCompetitors(compRes || []);
      setStoredSearches(searchesRes || []);
    } catch (err) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSearchAndSaveToDatabase = async () => {
    if (!query.trim()) return;
    try {
      setIsSavingSearch(true);
      const result = await api.searchAndSaveWebsite(query.trim());
      setSavedSuccessMsg(`Website "${result.searchRecord?.domain || query}" analyzed and indexed!`);
      await loadInitial();
      setTimeout(() => {
        onClose();
        if (result.competitor?.id) {
          navigate(`/competitors/${result.competitor.id}`);
        } else {
          navigate('/competitors');
        }
      }, 900);
    } catch (err: any) {
      alert('Failed to index search: ' + err.message);
    } finally {
      setIsSavingSearch(false);
    }
  };

  if (!isOpen) return null;

  const filteredArticles = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      (a.author && a.author.toLowerCase().includes(query.toLowerCase())) ||
      (a.canonicalUrl && a.canonicalUrl.toLowerCase().includes(query.toLowerCase()))
  );

  const filteredCompetitors = competitors.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.websiteUrl.toLowerCase().includes(query.toLowerCase())
  );

  const filteredSearches = storedSearches.filter(
    (s) =>
      s.query.toLowerCase().includes(query.toLowerCase()) ||
      s.domain.toLowerCase().includes(query.toLowerCase()) ||
      s.websiteUrl.toLowerCase().includes(query.toLowerCase())
  );

  const isLikelyUrl =
    query.trim().length > 3 &&
    (query.includes('.') || query.startsWith('http') || query.includes('/'));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-[#0f172a] border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center space-x-3 bg-slate-900/60">
          <Search className="w-5 h-5 text-cyan-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type website URL (e.g. wired.com) to run AI discovery..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && isLikelyUrl) {
                handleSearchAndSaveToDatabase();
              }
            }}
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 p-1 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Confirmation Toast */}
        {savedSuccessMsg && (
          <div className="px-4 py-2 bg-emerald-950/80 border-b border-emerald-800 text-emerald-400 text-xs font-semibold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{savedSuccessMsg}</span>
          </div>
        )}

        {/* Results Body */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4">
          {/* Quick Action: Deep AI Analysis */}
          {query.trim().length > 2 && (
            <button
              onClick={handleSearchAndSaveToDatabase}
              disabled={isSavingSearch}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-cyan-950/60 to-slate-900 border border-cyan-800/80 hover:border-cyan-500 text-left transition-all group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-900/60 flex items-center justify-center text-cyan-300 group-hover:bg-cyan-800">
                  <BrainCircuit className={`w-4 h-4 ${isSavingSearch ? 'animate-pulse text-cyan-400' : ''}`} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white flex items-center space-x-2">
                    <span>Run Deep AI Analysis:</span>
                    <span className="text-cyan-400 font-mono">"{query.trim()}"</span>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Probes RSS/sitemap feeds, captures metadata, and indexes results in the AI memory core.
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono uppercase">
                {isSavingSearch ? 'Analyzing...' : 'Analyze & Index ↵'}
              </span>
            </button>
          )}

          {/* Indexed Discovery Results */}
          {filteredSearches.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <Network className="w-3.5 h-3.5" />
                <span>Indexed Domains ({filteredSearches.length})</span>
              </p>
              <div className="space-y-1">
                {filteredSearches.slice(0, 5).map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      onClose();
                      navigate('/competitors');
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-800/80 text-left transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center space-x-3 truncate">
                      <div className="w-7 h-7 rounded bg-slate-800 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-950 flex-shrink-0">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-semibold text-white truncate">{s.domain}</p>
                        <p className="text-[10px] text-slate-400 font-mono truncate">{s.websiteUrl}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                        Indexed
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Competitors */}
          {filteredCompetitors.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Monitored Competitors ({filteredCompetitors.length})
              </p>
              <div className="space-y-1">
                {filteredCompetitors.slice(0, 4).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      onClose();
                      navigate(`/competitors/${c.id}`);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-800/80 text-left transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 rounded bg-slate-800 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-950">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">{c.name}</p>
                        <p className="text-[11px] text-slate-400">{c.websiteUrl}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Articles */}
          {filteredArticles.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Detected Articles ({filteredArticles.length})
              </p>
              <div className="space-y-1">
                {filteredArticles.slice(0, 4).map((a) => (
                  <button
                    key={a.id}
                    onClick={() => {
                      onClose();
                      navigate(`/articles/${a.id}`);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-800/80 text-left transition-colors group"
                  >
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <div className="w-7 h-7 rounded bg-slate-800 flex items-center justify-center text-blue-400 group-hover:bg-blue-950 flex-shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-semibold text-white truncate">{a.title}</p>
                        <p className="text-[11px] text-slate-400 flex items-center space-x-2">
                          <span>{a.competitor?.name || 'Competitor'}</span>
                          <span>&bull;</span>
                          <span className="text-cyan-400 font-mono">{a.delayFormatted} delay</span>
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredCompetitors.length === 0 &&
            filteredArticles.length === 0 &&
            filteredSearches.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-xs">
                Type any website URL or domain name to run a deep AI diagnostic and index the source.
              </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/60 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center space-x-1.5">
            <BrainCircuit className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI Intelligence Engine (Active)</span>
          </span>
          <span>Press <kbd className="bg-slate-800 px-1 py-0.5 rounded text-slate-400 font-mono">ESC</kbd> to close</span>
        </div>
      </div>
    </div>
  );
};

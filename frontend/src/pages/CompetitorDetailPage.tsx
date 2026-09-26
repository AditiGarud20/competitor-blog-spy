import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  ExternalLink,
  Play,
  Pause,
  Clock,
  Radio,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  History,
  Layers,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { Competitor } from '../types';
import { DelayBadge } from '../components/common/DelayBadge';

export const CompetitorDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [competitor, setCompetitor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (id) loadData(id);
  }, [id]);

  const loadData = async (compId: string) => {
    try {
      setLoading(true);
      const data = await api.getCompetitor(compId);
      setCompetitor(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualCheck = async () => {
    if (!id) return;
    try {
      setIsChecking(true);
      await api.checkCompetitor(id);
      await loadData(id);
    } catch (err: any) {
      alert('Manual check failed: ' + err.message);
    } finally {
      setIsChecking(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400 text-xs font-mono">
        <Sparkles className="w-6 h-6 mx-auto mb-2 text-cyan-400 animate-spin" />
        Loading competitor intelligence profile...
      </div>
    );
  }

  if (!competitor) {
    return (
      <div className="py-16 text-center text-slate-400 text-xs">
        <p className="mb-4">Competitor record not found.</p>
        <Link to="/competitors" className="text-cyan-400 hover:underline">
          &larr; Back to Competitor Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Back Link */}
      <Link
        to="/competitors"
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Competitors</span>
      </Link>

      {/* Header Profile Card */}
      <div className="bg-[#0e1524] border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-extrabold text-white">{competitor.name}</h1>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  competitor.status === 'ACTIVE'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-amber-950 text-amber-400 border border-amber-800'
                }`}>
                  {competitor.status}
                </span>
              </div>
              <a
                href={competitor.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-cyan-400 hover:underline flex items-center space-x-1 font-mono mt-1"
              >
                <span>{competitor.websiteUrl}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <button
            onClick={handleManualCheck}
            disabled={isChecking}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md ${
              isChecking
                ? 'bg-cyan-900/50 text-cyan-300 cursor-not-allowed'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-950'
            }`}
          >
            <Play className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Checking Target...' : 'Execute Immediate Check'}</span>
          </button>
        </div>

        {/* Telemetry Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-400 block text-[11px] mb-1">Primary Strategy</span>
            <span className="text-cyan-400 font-bold text-sm">{competitor.primaryStrategy}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-400 block text-[11px] mb-1">Articles Detected</span>
            <span className="text-white font-bold text-sm">{competitor.articlesCount}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-400 block text-[11px] mb-1">Average Latency</span>
            <span className="text-emerald-400 font-bold text-sm">
              {competitor.averageDelaySeconds
                ? `${Math.floor(competitor.averageDelaySeconds / 60)}m ${competitor.averageDelaySeconds % 60}s`
                : '--'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-400 block text-[11px] mb-1">Poll Frequency</span>
            <span className="text-white font-bold text-sm">Every {competitor.checkIntervalMinutes} min</span>
          </div>
        </div>
      </div>

      {/* Discovered Sources Card */}
      <div className="bg-[#0e1524] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center space-x-2 pb-3 border-b border-slate-800">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Configured Ingestion Sources</span>
        </h2>

        <div className="space-y-2.5">
          {(competitor.sources || []).map((source: any) => (
            <div
              key={source.id}
              className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs font-mono"
            >
              <div className="flex items-center space-x-3">
                <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 text-[10px] font-bold">
                  {source.type}
                </span>
                <span className="text-slate-300 break-all">{source.url}</span>
              </div>
              <span className="text-emerald-400 text-[10px] font-bold uppercase">
                {source.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Detected Articles for this Competitor */}
      <div className="bg-[#0e1524] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center space-x-2 pb-3 border-b border-slate-800">
          <FileText className="w-4 h-4 text-cyan-400" />
          <span>Articles Detected from {competitor.name}</span>
        </h2>

        <div className="space-y-2.5">
          {(competitor.articles || []).length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              No articles captured yet for this competitor.
            </div>
          ) : (
            (competitor.articles || []).map((art: any) => (
              <div
                key={art.id}
                className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <Link
                    to={`/articles/${art.id}`}
                    className="font-bold text-white hover:text-cyan-400 transition-colors line-clamp-1"
                  >
                    {art.title}
                  </Link>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Published: {new Date(art.publishedAt).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center space-x-3 self-end sm:self-auto">
                  <DelayBadge delaySeconds={art.detectionDelaySeconds} size="sm" />
                  <Link
                    to={`/articles/${art.id}`}
                    className="text-cyan-400 hover:text-cyan-300 font-semibold text-[11px]"
                  >
                    View &rarr;
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

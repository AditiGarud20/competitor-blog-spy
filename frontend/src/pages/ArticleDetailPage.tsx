import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ExternalLink,
  Clock,
  Building2,
  Calendar,
  CheckCircle2,
  Radio,
  FileText,
  Tag,
  Link as LinkIcon,
  ShieldCheck,
  Zap,
  Layers,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { Article } from '../types';
import { DelayBadge } from '../components/common/DelayBadge';

export const ArticleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadArticle(id);
    }
  }, [id]);

  const loadArticle = async (articleId: string) => {
    try {
      setLoading(true);
      const data = await api.getArticle(articleId);
      setArticle(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400 text-xs font-mono">
        <Sparkles className="w-6 h-6 mx-auto mb-2 text-cyan-400 animate-spin" />
        Loading intelligence report for article...
      </div>
    );
  }

  if (!article) {
    return (
      <div className="py-16 text-center text-slate-400 text-xs">
        <p className="mb-4">Article record not found.</p>
        <Link to="/articles" className="text-cyan-400 hover:underline">
          &larr; Back to Detected Articles
        </Link>
      </div>
    );
  }

  const pubDate = new Date(article.publishedAt);
  const detDate = new Date(article.detectedAt);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Back Link */}
      <Link
        to="/articles"
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Detected Articles</span>
      </Link>

      {/* Intelligence Header Card */}
      <div className="bg-[#0e1524] border border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Competitor Target
              </span>
              <p className="text-sm font-extrabold text-white">{article.competitor?.name || 'ApexTech Systems'}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
              Status: DETECTED
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
              Method: {article.firstDetectedMethod}
            </span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
          {article.title}
        </h1>

        {/* Latency & Timestamps Callout Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800 font-mono text-xs">
          <div>
            <span className="text-slate-400 block text-[11px] mb-1">Published by Competitor</span>
            <span className="text-white font-semibold">
              {pubDate.toLocaleString([], { dateStyle: 'medium', timeStyle: 'medium' })}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px] mb-1">Detected by Monitoring Engine</span>
            <span className="text-cyan-400 font-semibold">
              {detDate.toLocaleString([], { dateStyle: 'medium', timeStyle: 'medium' })}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px] mb-1">Calculated Detection Delay</span>
            <DelayBadge
              delaySeconds={article.detectionDelaySeconds}
              formattedDelay={article.delayFormatted}
              size="md"
            />
          </div>
        </div>
      </div>

      {/* Visual 7-Stage Detection Timeline */}
      <div className="bg-[#0e1524] border border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Full Autonomous Detection Timeline</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Exact timestamps recorded at each stage of the ingestion and verification lifecycle.
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950 px-2.5 py-1 rounded border border-cyan-800">
            Precision: Second-level
          </span>
        </div>

        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-cyan-500 before:via-blue-500 before:to-emerald-500">
          {(article.timeline || []).map((step, idx) => (
            <div key={idx} className="relative group">
              {/* Dot */}
              <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-[#0e1524] border-2 border-cyan-400 group-hover:scale-125 transition-transform"></div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {step.label}
                </span>
                <span className="text-[11px] font-mono text-cyan-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 self-start sm:self-auto">
                  {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                {step.details}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Extracted Content & Intelligence Metadata */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Full Article Content */}
        <div className="lg:col-span-2 bg-[#0e1524] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
          <h2 className="text-sm font-bold text-white pb-3 border-b border-slate-800 flex items-center space-x-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>Extracted Article Content</span>
          </h2>

          {article.featuredImage && (
            <div className="rounded-xl overflow-hidden border border-slate-800 max-h-80">
              <img
                src={article.featuredImage}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="text-slate-300 text-xs sm:text-sm leading-relaxed space-y-4">
            {article.content.split('\n\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </div>

        {/* Metadata Sidebar */}
        <div className="space-y-6">
          {/* Attributes Card */}
          <div className="bg-[#0e1524] border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4 text-xs">
            <h3 className="font-bold text-white uppercase tracking-wider text-[11px] pb-2 border-b border-slate-800">
              Extracted Metadata
            </h3>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Author</span>
              <span className="text-white font-medium">{article.author || 'Available from source (Editorial Staff)'}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Canonical URL</span>
              <a
                href={article.canonicalUrl}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline break-all font-mono text-[11px] flex items-center space-x-1"
              >
                <span>{article.canonicalUrl}</span>
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
              </a>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Meta Description</span>
              <p className="text-slate-300 text-xs mt-0.5 italic">
                "{article.metaDescription || article.excerpt || 'Available'}"
              </p>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Content Hash (SHA-256)</span>
              <span className="font-mono text-[10px] text-slate-400 break-all block bg-slate-900 p-1.5 rounded border border-slate-800 mt-1">
                {article.contentHash}
              </span>
            </div>

            {article.categories && article.categories.length > 0 && (
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">Categories</span>
                <div className="flex flex-wrap gap-1.5">
                  {article.categories.map((c, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-400 text-[10px]">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

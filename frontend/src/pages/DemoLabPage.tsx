import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FlaskConical,
  Play,
  Send,
  ExternalLink,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldCheck,
  Radio
} from 'lucide-react';
import { api } from '../services/api';
import { DelayBadge } from '../components/common/DelayBadge';

export const DemoLabPage: React.FC = () => {
  const navigate = useNavigate();

  // 1-Click Live Demo State
  const [isRunningDemo, setIsRunningDemo] = useState(false);
  const [demoResult, setDemoResult] = useState<any>(null);

  // Manual Publish Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('Dr. Elena Vance, Senior AI Researcher');
  const [delayOffset, setDelayOffset] = useState('109'); // 1m 49s default
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishMessage, setPublishMessage] = useState<string | null>(null);

  const sampleArticles = [
    {
      title: 'Scalable Sparse Attention with Dynamic Token Pruning',
      content:
        'Our infrastructure team has achieved a 3.4x improvement in transformer context length execution by dynamically pruning redundant query keys during multi-head attention passes.',
      author: 'Marcus Aurelius, AI Architecture Lead'
    },
    {
      title: 'Zero-Copy Microservices Serialization with FlatBuffers',
      content:
        'In latency-sensitive high-frequency trading services, JSON serialization overhead is unacceptable. We migrate our core gRPC channels to zero-copy memory layouts.',
      author: 'David K., Systems Principal'
    }
  ];

  const handleRunLiveDemo = async () => {
    try {
      setIsRunningDemo(true);
      setDemoResult(null);

      // Trigger 1-click live detection workflow
      const result = await api.runLiveDetectionDemo({
        simulatedDelaySeconds: 109, // 1m 49s exact latency
        customTitle: `Autonomous Quantum Mesh Architecture v${Math.floor(Math.random() * 80 + 10)}`
      });

      setDemoResult(result);
    } catch (err: any) {
      alert('Live demo error: ' + err.message);
    } finally {
      setIsRunningDemo(false);
    }
  };

  const handleManualPublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    try {
      setIsPublishing(true);
      setPublishMessage(null);

      const res = await api.publishDemoArticle({
        title,
        content,
        author,
        delayOffsetSeconds: Number(delayOffset)
      });

      setPublishMessage(`Article published to ApexTech Demo Blog! Now check monitoring tab or trigger "Check Now".`);
      setTitle('');
      setContent('');
    } catch (err: any) {
      alert('Publishing error: ' + err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800/80 gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <FlaskConical className="w-5 h-5 text-cyan-400" />
            <span>Interactive Demo Lab & Live Publishing Studio</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Controlled environment to test complete end-to-end detection without depending on 3rd-party websites.
          </p>
        </div>

        <a
          href="/demo-blog"
          target="_blank"
          rel="noreferrer"
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-800 text-cyan-400 hover:bg-cyan-900/60 text-xs font-semibold self-start sm:self-auto transition-all"
        >
          <span>Open ApexTech Demo Blog</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Prominent "Run Live Detection Demo" Hero Card */}
      <div className="bg-gradient-to-r from-cyan-950/40 via-slate-900 to-[#0e1524] border border-cyan-600/50 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Evaluator Demonstration Flow (Section 26)</span>
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              1-Click End-to-End Live Detection Demo
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Triggers the entire pipeline: publishes a new article to the competitor blog, executes real RSS/Sitemap monitoring, extracts the article, checks duplicates, calculates exact detection delay (1m 49s), creates notifications, and streams the article to the dashboard.
            </p>
          </div>

          <button
            onClick={handleRunLiveDemo}
            disabled={isRunningDemo}
            className={`flex items-center justify-center space-x-2.5 px-6 py-4 rounded-xl text-sm font-extrabold shadow-xl transition-all ${
              isRunningDemo
                ? 'bg-cyan-900/50 text-cyan-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-950 scale-100 hover:scale-[1.02]'
            }`}
          >
            <Play className={`w-5 h-5 ${isRunningDemo ? 'animate-spin' : ''}`} />
            <span>{isRunningDemo ? 'Executing Monitoring Engine...' : 'Run Live Detection Demo'}</span>
          </button>
        </div>

        {/* Live Demo Execution Results Screen */}
        {demoResult && (
          <div className="mt-6 p-5 rounded-xl bg-slate-950/90 border border-cyan-800 space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Detection Workflow Completed Successfully!</span>
              </span>
              <span className="text-xs font-mono text-cyan-400">
                Exact Delay: {demoResult.workflow.step2_detected.delayFormatted}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">1. Published Timestamp</span>
                <span className="text-white block mt-0.5">
                  {new Date(demoResult.workflow.step1_published.publishedAt).toLocaleTimeString()}
                </span>
                <span className="text-[10px] text-slate-500 truncate block mt-1">
                  {demoResult.workflow.step1_published.title}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">2. Discovered & Extracted</span>
                <span className="text-cyan-400 block mt-0.5">
                  Strategy: {demoResult.workflow.step3_monitoringResult.strategy}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  HTTP 200 OK ({demoResult.workflow.step3_monitoringResult.durationMs}ms)
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">3. Latency Evaluation</span>
                <span className="text-emerald-400 font-bold block mt-0.5">
                  {demoResult.workflow.step2_detected.delayFormatted} (≤ 5m Target)
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">
                  1 Notification Broadcast
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => navigate('/articles')}
                className="flex items-center space-x-1.5 text-xs text-cyan-400 hover:underline font-semibold"
              >
                <span>View In Detected Articles Feed</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Manual Article Publisher Form */}
      <div className="bg-[#0e1524] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <Send className="w-4 h-4 text-cyan-400" />
              <span>Competitor Content Simulator (Manual Article Publisher)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Draft and publish custom competitor articles into the ApexTech database to evaluate detection sensitivity.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400">Fill Sample:</span>
            {sampleArticles.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setTitle(s.title);
                  setContent(s.content);
                  setAuthor(s.author);
                }}
                className="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:text-cyan-400 border border-slate-700 text-[10px] font-mono"
              >
                Sample #{idx + 1}
              </button>
            ))}
          </div>
        </div>

        {publishMessage && (
          <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-xs font-semibold">
            ✓ {publishMessage}
          </div>
        )}

        <form onSubmit={handleManualPublish} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Article Title <span className="text-cyan-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Next-Generation Cloud Ingestion Architecture"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Author Byline
              </label>
              <input
                type="text"
                placeholder="Dr. Elena Vance"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Article Content & Body Text <span className="text-cyan-400">*</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder="Write or paste article content..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div className="flex items-center space-x-3 text-xs text-slate-400">
              <span>Simulate Publication Delay:</span>
              <select
                value={delayOffset}
                onChange={(e) => setDelayOffset(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white font-mono"
              >
                <option value="18">18 seconds (Fastest)</option>
                <option value="109">1 minute 49 seconds (Baseline Target)</option>
                <option value="260">4 minutes 20 seconds (Near 5m SLA)</option>
                <option value="428">7 minutes 08 seconds (Above 5m Target)</option>
                <option value="872">14 minutes 32 seconds (Long Delay Test)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isPublishing || !title || !content}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all shadow-md ${
                isPublishing || !title || !content
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isPublishing ? 'Publishing to Origin...' : 'Publish Article Now'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

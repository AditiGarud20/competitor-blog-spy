import React from 'react';
import {
  Layers,
  Cpu,
  Database,
  Radio,
  FileText,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Server,
  Zap,
  ArrowRight,
  ArrowDown
} from 'lucide-react';

export const ArchitecturePage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800/80">
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
          <Layers className="w-5 h-5 text-cyan-400" />
          <span>System Architecture & Detection Pipeline</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Detailed technical breakdown of the autonomous monitoring engine, multi-worker concurrency, and sub-5-minute latency pipeline.
        </p>
      </div>

      {/* Visual Pipeline Flowchart */}
      <div className="bg-[#0e1524] border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider text-cyan-400">
          Core Detection & Ingestion Flow
        </h2>

        <div className="space-y-4 font-mono text-xs">
          {/* Layer 1: Sources */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="w-6 h-6 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center font-bold">1</span>
              <div>
                <strong className="text-white block font-sans text-sm">Competitor Websites</strong>
                <span className="text-slate-400 text-xs">ApexTech, CloudScale, CyberShield, DataMesh, VelocityHQ</span>
              </div>
            </div>
            <span className="text-[11px] text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
              Target Origins
            </span>
          </div>

          <div className="flex justify-center">
            <ArrowDown className="w-5 h-5 text-cyan-500 animate-bounce" />
          </div>

          {/* Layer 2: Automatic Analyzer */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="w-6 h-6 rounded-full bg-blue-950 text-blue-400 border border-blue-800 flex items-center justify-center font-bold">2</span>
              <div>
                <strong className="text-white block font-sans text-sm">10-Step Automatic Website Analyzer</strong>
                <span className="text-slate-400 text-xs">Probes RSS feeds, nested sitemaps, article slug patterns, OpenGraph & JSON-LD schemas</span>
              </div>
            </div>
            <span className="text-[11px] text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
              Discovery Engine
            </span>
          </div>

          <div className="flex justify-center">
            <ArrowDown className="w-5 h-5 text-blue-500" />
          </div>

          {/* Layer 3: Polymorphic Detectors */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-800/60">
              <strong className="text-cyan-400 block font-sans text-xs">Strategy 1: RSS/Atom Feed</strong>
              <span className="text-slate-400 text-[11px] block mt-1">
                Fastest publication delta. Parses title, guid, author, pubDate with fast-xml fallback.
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-800/60">
              <strong className="text-blue-400 block font-sans text-xs">Strategy 2: XML Sitemap</strong>
              <span className="text-slate-400 text-[11px] block mt-1">
                Comprehensive index auditing. Traverses sitemapindex and nested &lt;lastmod&gt; tags.
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-800/60">
              <strong className="text-purple-400 block font-sans text-xs">Strategy 3: Direct Blog Page</strong>
              <span className="text-slate-400 text-[11px] block mt-1">
                Heuristic HTML parsing with Cheerio for JavaScript or unfeeded competitor portals.
              </span>
            </div>
          </div>

          <div className="flex justify-center">
            <ArrowDown className="w-5 h-5 text-purple-500" />
          </div>

          {/* Layer 4: Deduplication & Extraction */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="w-6 h-6 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center font-bold">3</span>
              <div>
                <strong className="text-white block font-sans text-sm">Deduplication & Article Content Extractor</strong>
                <span className="text-slate-400 text-xs">
                  Strips UTM/tracking, enforces canonical URLs, computes SHA-256 contentHash, extracts full body, media & links
                </span>
              </div>
            </div>
            <span className="text-[11px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
              Zero Duplicates
            </span>
          </div>

          <div className="flex justify-center">
            <ArrowDown className="w-5 h-5 text-emerald-500" />
          </div>

          {/* Layer 5: Exact Delay & Persistence */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="w-6 h-6 rounded-full bg-amber-950 text-amber-400 border border-amber-800 flex items-center justify-center font-bold">4</span>
              <div>
                <strong className="text-white block font-sans text-sm">Exact Detection Delay Calculation & Persistence</strong>
                <span className="text-slate-400 text-xs">
                  Delay = Detection Time - Publication Time. Evaluates against ≤ 5m target. Persisted in Prisma Database.
                </span>
              </div>
            </div>
            <span className="text-[11px] text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
              Database & Audit
            </span>
          </div>

          <div className="flex justify-center">
            <ArrowDown className="w-5 h-5 text-amber-500" />
          </div>

          {/* Layer 6: Realtime Broadcast */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/60 to-purple-950/60 border border-cyan-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="w-6 h-6 rounded-full bg-white text-slate-900 flex items-center justify-center font-bold">5</span>
              <div>
                <strong className="text-white block font-sans text-sm">Real-Time Distribution</strong>
                <span className="text-slate-300 text-xs">WebSocket push to Operator Dashboard, Live Activity Feed, and Alert Notifications</span>
              </div>
            </div>
            <span className="text-[11px] text-white bg-cyan-600 px-2.5 py-0.5 rounded font-bold">
              Sub-Second Push
            </span>
          </div>
        </div>
      </div>

      {/* Concurrent Worker Pool Architecture Card */}
      <div className="bg-[#0e1524] border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider text-cyan-400">
          Worker Pool Concurrency & Scale Isolation (100 Sites)
        </h2>

        <p className="text-xs text-slate-300 leading-relaxed">
          In naive systems, sequential loops (<code className="text-cyan-400">for site of sites await check(site)</code>) cause head-of-line blocking: if Website #4 takes 30 seconds to timeout, Websites #5 through #100 are frozen.
        </p>

        <p className="text-xs text-slate-300 leading-relaxed">
          Competitor Blog Spy implements a concurrent <strong>Worker Pool</strong> with configurable concurrency (e.g. 10 workers) and exponential backoff retry. As soon as any worker completes or encounters a timeout on Website A, the next queued competitor job starts immediately on that worker. High-latency or down sites are isolated without impacting healthy targets.
        </p>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-slate-400">
          <p className="text-cyan-400 font-bold mb-1">Architecture Pipeline:</p>
          <p>Scheduler &rarr; Job Queue &rarr; Concurrent Worker Pool (10) &rarr; Detectors (RSS/Sitemap/DOM) &rarr; Exact Delay Calc &rarr; Database &rarr; WebSocket Broadcast</p>
        </div>
      </div>
    </div>
  );
};

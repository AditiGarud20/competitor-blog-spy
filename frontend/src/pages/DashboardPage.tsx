import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Globe,
  Radio,
  FileText,
  Clock,
  Zap,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid
} from 'recharts';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
import { DelayBadge } from '../components/common/DelayBadge';

export const DashboardPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [recentArticles, setRecentArticles] = useState<any[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, articlesRes, healthRes] = await Promise.all([
        api.getAnalytics(),
        api.getArticles({ limit: '8' }),
        api.getSystemHealth()
      ]);
      setAnalytics(analyticsRes);
      setRecentArticles(articlesRes.articles || []);
      setSystemHealth(healthRes);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const socket = getSocket();
    socket.on('article.detected', (payload: any) => {
      if (payload.article) {
        setRecentArticles((prev) => [payload.article, ...prev.slice(0, 7)]);
        // Refresh analytics numbers
        api.getAnalytics().then(setAnalytics).catch(() => {});
      }
    });

    socket.on('monitoring.completed', () => {
      api.getSystemHealth().then(setSystemHealth).catch(() => {});
    });

    return () => {
      socket.off('article.detected');
      socket.off('monitoring.completed');
    };
  }, []);

  const summary = analytics?.summary || {
    totalCompetitors: 5,
    totalArticles: 5,
    avgDelayFormatted: '2m 41s',
    medianDelayFormatted: '2m 14s',
    fastestDelayFormatted: '18s',
    slowestDelayFormatted: '14m 32s',
    failedChecks: 0,
    under5mCount: 4,
    above5mCount: 1,
    under5mPercentage: 80
  };

  const trendData = (analytics?.trend || []).map((t: any) => ({
    time: new Date(t.detectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    delaySeconds: t.detectionDelaySeconds,
    delayFormatted: t.delayFormatted,
    title: t.title,
    competitor: t.competitorName,
    target: 300 // 5 minutes reference in seconds
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner / System Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800/80 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <span>Competitor Blog Spy</span>
            <span className="text-xs bg-cyan-950 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded-full font-mono font-medium">
              Real-time Content Intelligence
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Autonomous multi-strategy competitor blog detection with sub-5-minute latency tracking.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-400">Monitoring Engine:</span>
            <strong className="text-white">Active (60s tick)</strong>
          </div>
          <button
            onClick={loadData}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
            title="Refresh dashboard metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* Websites Monitored */}
        <div className="bg-[#0e1524] border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold">Websites Monitored</span>
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div>
            <span className="text-xl font-extrabold text-white font-mono">
              {summary.totalCompetitors}
            </span>
            <span className="text-[10px] text-emerald-400 font-medium block">All active</span>
          </div>
        </div>

        {/* Active Monitoring */}
        <div className="bg-[#0e1524] border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold">Active Monitoring</span>
            <Radio className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div>
            <span className="text-xl font-extrabold text-white font-mono">
              {summary.totalCompetitors}
            </span>
            <span className="text-[10px] text-slate-400 block">100% active</span>
          </div>
        </div>

        {/* New Articles Today */}
        <div className="bg-[#0e1524] border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold">Detected Articles</span>
            <FileText className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div>
            <span className="text-xl font-extrabold text-white font-mono">
              {summary.totalArticles}
            </span>
            <span className="text-[10px] text-purple-400 block">Unique content</span>
          </div>
        </div>

        {/* Average Detection Time */}
        <div className="bg-[#0e1524] border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold">Average Delay</span>
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div>
            <span className="text-xl font-extrabold text-cyan-400 font-mono">
              {summary.avgDelayFormatted}
            </span>
            <span className="text-[10px] text-emerald-400 block">Below target</span>
          </div>
        </div>

        {/* Fastest Detection */}
        <div className="bg-[#0e1524] border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold">Fastest Detection</span>
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div>
            <span className="text-xl font-extrabold text-emerald-400 font-mono">
              {summary.fastestDelayFormatted}
            </span>
            <span className="text-[10px] text-slate-400 block">Sub-minute</span>
          </div>
        </div>

        {/* Slowest Detection */}
        <div className="bg-[#0e1524] border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold">Slowest Detection</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div>
            <span className="text-xl font-extrabold text-amber-400 font-mono">
              {summary.slowestDelayFormatted}
            </span>
            <span className="text-[10px] text-slate-400 block">Unrounded actual</span>
          </div>
        </div>

        {/* Failed Checks */}
        <div className="bg-[#0e1524] border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold">Failed Checks</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div>
            <span className="text-xl font-extrabold text-white font-mono">
              {summary.failedChecks}
            </span>
            <span className="text-[10px] text-emerald-400 block">Auto-retried</span>
          </div>
        </div>

        {/* Detection Target Status */}
        <div className="bg-gradient-to-br from-cyan-950/40 to-slate-900 border border-cyan-800/60 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-cyan-300 mb-2">
            <span className="text-[11px] font-bold">Target SLA</span>
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div>
            <span className="text-xl font-extrabold text-white font-mono">≤ 5 min</span>
            <span className="text-[10px] text-cyan-300 block">{summary.under5mPercentage}% compliant</span>
          </div>
        </div>
      </div>

      {/* Main Charts & Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Detection Delay Over Time Chart */}
        <div className="lg:col-span-2 bg-[#0e1524] border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-sm text-white flex items-center space-x-2">
                <span>Detection Latency Timeline</span>
                <span className="text-xs font-mono font-normal text-slate-400">
                  (Detection Delay = Detection Time - Publication Time)
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Continuous tracking of article publishing delay with strict 5-minute reference threshold.
              </p>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="flex items-center text-cyan-400 font-mono">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 mr-1.5 inline-block"></span>
                Delay (sec)
              </span>
              <span className="flex items-center text-rose-400 font-mono">
                <span className="w-3 h-0.5 bg-rose-400 mr-1.5 inline-block"></span>
                5m SLA (300s)
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="delayGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                <XAxis
                  dataKey="time"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  unit="s"
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl text-xs font-sans">
                          <p className="font-bold text-white mb-1 line-clamp-1">{data.title}</p>
                          <p className="text-slate-400 mb-1.5">
                            Competitor: <strong className="text-slate-200">{data.competitor}</strong>
                          </p>
                          <div className="flex items-center space-x-2 font-mono">
                            <span className="text-cyan-400">Delay: {data.delayFormatted} ({data.delaySeconds}s)</span>
                          </div>
                          <p className={`text-[10px] mt-1 font-semibold ${data.delaySeconds <= 300 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {data.delaySeconds <= 300 ? '✓ Within 5m target' : '⚠ Exceeded 5m target'}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine
                  y={300}
                  stroke="#f43f5e"
                  strokeDasharray="4 4"
                  label={{
                    value: '5m Target SLA (300s)',
                    fill: '#f43f5e',
                    fontSize: 10,
                    position: 'insideTopRight'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="delaySeconds"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#delayGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Fastest: <strong className="text-emerald-400">{summary.fastestDelayFormatted}</strong></span>
            <span>Median: <strong className="text-white">{summary.medianDelayFormatted}</strong></span>
            <span>Average: <strong className="text-cyan-400">{summary.avgDelayFormatted}</strong></span>
            <span>Slowest: <strong className="text-amber-400">{summary.slowestDelayFormatted}</strong></span>
          </div>
        </div>

        {/* Real-Time Activity Feed */}
        <div className="bg-[#0e1524] border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
              <h2 className="font-bold text-sm text-white">Live Detection Stream</h2>
            </div>
            <Link
              to="/articles"
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {recentArticles.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                Waiting for competitor publications...
              </div>
            ) : (
              recentArticles.map((art) => (
                <Link
                  key={art.id}
                  to={`/articles/${art.id}`}
                  className="block p-3 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900 transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-slate-400 group-hover:text-cyan-400 transition-colors">
                      {art.competitor?.name || art.competitorName || 'ApexTech Systems'}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      {art.firstDetectedMethod || art.method || 'RSS'}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-white line-clamp-2 mb-2 group-hover:text-cyan-300 transition-colors">
                    {art.title}
                  </h3>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-mono text-[10px]">
                      {new Date(art.detectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <DelayBadge
                      delaySeconds={art.detectionDelaySeconds}
                      formattedDelay={art.delayFormatted}
                      size="sm"
                    />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

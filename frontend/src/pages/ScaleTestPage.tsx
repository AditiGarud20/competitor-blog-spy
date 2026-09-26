import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Play,
  Pause,
  RotateCcw,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  CopyX,
  Server,
  Activity,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
import { ScaleTestProgress } from '../types';

export const ScaleTestPage: React.FC = () => {
  const [concurrency, setConcurrency] = useState(10);
  const [siteCount, setSiteCount] = useState(100);
  const [progress, setProgress] = useState<ScaleTestProgress>({
    testId: '',
    totalSites: 100,
    concurrency: 10,
    status: 'IDLE',
    completed: 0,
    processing: 0,
    queued: 0,
    failed: 0,
    retries: 0,
    duplicatesPrevented: 0,
    avgDurationMs: 0,
    peakConcurrency: 0,
    startTime: null,
    endTime: null,
    elapsedSeconds: 0,
    recentJobs: []
  });

  useEffect(() => {
    // Initial fetch
    api.getScaleTestStatus().then(setProgress).catch(() => {});

    // WebSocket listener for live progress
    const socket = getSocket();
    socket.on('scale-test.progress', (p: ScaleTestProgress) => {
      setProgress(p);
    });

    return () => {
      socket.off('scale-test.progress');
    };
  }, []);

  const handleStartSimulation = async () => {
    try {
      await api.runScaleTest({ siteCount, concurrency });
    } catch (err: any) {
      alert('Failed to launch scale test: ' + err.message);
    }
  };

  const handleCancel = async () => {
    try {
      await api.cancelScaleTest();
    } catch (err: any) {
      console.error(err);
    }
  };

  const isRunning = progress.status === 'RUNNING';
  const percentComplete =
    progress.totalSites > 0
      ? Math.round(((progress.completed + progress.failed) / progress.totalSites) * 100)
      : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800/80 gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <span>100-Website Scale & Concurrency Testing Lab</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Empirical demonstration of multi-worker queue architecture. Proves that slow, high-latency or failing websites never block remaining ingestion pipelines.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {isRunning ? (
            <button
              onClick={handleCancel}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors"
            >
              <Pause className="w-4 h-4" />
              <span>Abort Simulation</span>
            </button>
          ) : (
            <button
              onClick={handleStartSimulation}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-950 transition-all"
            >
              <Play className="w-4 h-4" />
              <span>Run 100 Website Simulation</span>
            </button>
          )}
        </div>
      </div>

      {/* Configuration Controls Bar */}
      <div className="bg-[#0e1524] border border-slate-800/80 rounded-xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6 text-xs">
          <div>
            <label className="block text-slate-400 text-[11px] font-semibold mb-1">
              Target Websites to Monitor
            </label>
            <div className="flex items-center space-x-2 font-mono">
              {[50, 100, 200].map((num) => (
                <button
                  key={num}
                  disabled={isRunning}
                  onClick={() => setSiteCount(num)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                    siteCount === num
                      ? 'bg-cyan-950 text-cyan-400 border-cyan-800'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {num} Sites
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-slate-400 text-[11px] font-semibold mb-1">
              Worker Pool Concurrency Limit
            </label>
            <div className="flex items-center space-x-2 font-mono">
              {[5, 10, 20, 30].map((c) => (
                <button
                  key={c}
                  disabled={isRunning}
                  onClick={() => setConcurrency(c)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                    concurrency === c
                      ? 'bg-blue-950 text-blue-400 border-blue-800'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {c} Workers
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="text-right text-xs font-mono text-slate-400">
          Status: <strong className={isRunning ? 'text-cyan-400 animate-pulse' : 'text-slate-300'}>{progress.status}</strong>
        </div>
      </div>

      {/* Live Progress Bar & Counter */}
      <div className="bg-[#0e1524] border border-slate-800/80 rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Simulation Progress
            </span>
            <h2 className="text-2xl font-extrabold text-white font-mono mt-0.5">
              {progress.completed} / {progress.totalSites} Completed
              <span className="text-sm font-semibold text-slate-400 ml-3">
                ({percentComplete}%)
              </span>
            </h2>
          </div>

          <div className="flex items-center space-x-4 text-xs font-mono">
            <span className="text-cyan-400">{progress.processing} Processing</span>
            <span className="text-slate-400">{progress.queued} Queued</span>
            <span className="text-rose-400">{progress.failed} Failed</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-800 p-0.5">
          <div
            className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-300 shadow-sm shadow-cyan-500"
            style={{ width: `${percentComplete}%` }}
          ></div>
        </div>
      </div>

      {/* Real-time Telemetry Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 font-mono">
        <div className="bg-[#0e1524] border border-slate-800/80 rounded-xl p-3.5">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Elapsed Time</span>
          <span className="text-xl font-bold text-white">{progress.elapsedSeconds}s</span>
          <span className="text-[10px] text-slate-500 block">Total test clock</span>
        </div>

        <div className="bg-[#0e1524] border border-slate-800/80 rounded-xl p-3.5">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Avg Check Time</span>
          <span className="text-xl font-bold text-cyan-400">
            {progress.avgDurationMs > 0 ? `${progress.avgDurationMs}ms` : '--'}
          </span>
          <span className="text-[10px] text-slate-500 block">Per competitor</span>
        </div>

        <div className="bg-[#0e1524] border border-slate-800/80 rounded-xl p-3.5">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Peak Workers</span>
          <span className="text-xl font-bold text-purple-400">{progress.peakConcurrency} / {concurrency}</span>
          <span className="text-[10px] text-slate-500 block">Concurrent threads</span>
        </div>

        <div className="bg-[#0e1524] border border-slate-800/80 rounded-xl p-3.5">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Retries Handled</span>
          <span className="text-xl font-bold text-amber-400">{progress.retries}</span>
          <span className="text-[10px] text-slate-500 block">Exp backoff</span>
        </div>

        <div className="bg-[#0e1524] border border-slate-800/80 rounded-xl p-3.5">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Duplicates Blocked</span>
          <span className="text-xl font-bold text-emerald-400">{progress.duplicatesPrevented}</span>
          <span className="text-[10px] text-slate-500 block">Content hash filter</span>
        </div>

        <div className="bg-[#0e1524] border border-slate-800/80 rounded-xl p-3.5">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Worker Failures</span>
          <span className="text-xl font-bold text-rose-400">{progress.failed}</span>
          <span className="text-[10px] text-slate-500 block">Gracefully isolated</span>
        </div>
      </div>

      {/* Live Worker Queue Feed */}
      <div className="bg-[#0e1524] border border-slate-800/80 rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h2 className="text-sm font-bold text-white flex items-center space-x-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Active Worker Dispatch Stream</span>
          </h2>
          <span className="text-xs font-mono text-slate-400">
            Simulated fast (80ms), slow (1.4s), and transient retry nodes
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {progress.recentJobs.map((job, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs font-mono"
            >
              <div>
                <span className="font-semibold text-white block truncate max-w-[180px]">{job.siteName}</span>
                <span className="text-[10px] text-slate-400 flex items-center space-x-2 mt-0.5">
                  <span className="text-cyan-400">{job.strategy}</span>
                  <span>&bull;</span>
                  <span>{job.durationMs}ms</span>
                </span>
              </div>

              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  job.status === 'SUCCESS'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-rose-950 text-rose-400 border border-rose-800'
                }`}
              >
                {job.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

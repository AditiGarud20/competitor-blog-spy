import React, { useState, useEffect } from 'react';
import {
  Radio,
  Play,
  Pause,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Activity,
  Server,
  Zap,
  Globe
} from 'lucide-react';
import { api } from '../services/api';
import { getSocket } from '../services/socket';

export const LiveMonitoringPage: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const [isTriggering, setIsTriggering] = useState(false);

  const loadStatus = async () => {
    try {
      const [statusRes, compRes] = await Promise.all([
        api.getMonitoringStatus(),
        api.getCompetitors()
      ]);
      setStatus(statusRes);
      setCompetitors(compRes || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadStatus();

    const socket = getSocket();

    socket.on('monitoring.started', (data: any) => {
      addLiveEvent({
        type: 'CHECK_STARTED',
        text: `Dispatched check for ${data.competitorName}`,
        time: new Date().toLocaleTimeString(),
        status: 'INFO'
      });
    });

    socket.on('monitoring.completed', (data: any) => {
      addLiveEvent({
        type: 'CHECK_COMPLETED',
        text: `Completed check for ${data.competitorName}: ${data.result.newArticles} new, ${data.result.duplicatesIgnored} duplicates ignored (${data.result.durationMs}ms)`,
        time: new Date().toLocaleTimeString(),
        status: data.result.status === 'SUCCESS' ? 'SUCCESS' : 'ERROR'
      });
      loadStatus();
    });

    socket.on('article.detected', (data: any) => {
      addLiveEvent({
        type: 'ARTICLE_DETECTED',
        text: `★ NEW ARTICLE: "${data.article.title}" from ${data.article.competitorName} (Delay: ${data.article.delayFormatted})`,
        time: new Date().toLocaleTimeString(),
        status: 'DETECTED'
      });
    });

    return () => {
      socket.off('monitoring.started');
      socket.off('monitoring.completed');
      socket.off('article.detected');
    };
  }, []);

  const addLiveEvent = (event: any) => {
    setLiveEvents((prev) => [event, ...prev.slice(0, 30)]);
  };

  const handleToggleMonitoring = async () => {
    try {
      if (status?.isRunning) {
        await api.stopMonitoring();
      } else {
        await api.startMonitoring();
      }
      await loadStatus();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleTriggerAll = async () => {
    try {
      setIsTriggering(true);
      await api.triggerAllMonitoring();
      setTimeout(() => setIsTriggering(false), 1500);
    } catch (err: any) {
      setIsTriggering(false);
      alert('Error triggering check: ' + err.message);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800/80 gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
            <span>Live Monitoring Hub & Worker Pool Dispatcher</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time pipeline monitoring, queue telemetry, and immediate background check triggers.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleToggleMonitoring}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              status?.isRunning
                ? 'bg-amber-950 text-amber-400 border border-amber-800 hover:bg-amber-900'
                : 'bg-emerald-950 text-emerald-400 border border-emerald-800 hover:bg-emerald-900'
            }`}
          >
            {status?.isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{status?.isRunning ? 'Pause Engine' : 'Resume Engine'}</span>
          </button>

          <button
            onClick={handleTriggerAll}
            disabled={isTriggering}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-950 transition-all"
          >
            <Zap className={`w-4 h-4 ${isTriggering ? 'animate-spin' : ''}`} />
            <span>{isTriggering ? 'Checking All...' : 'Trigger Full Cycle Sweep'}</span>
          </button>
        </div>
      </div>

      {/* Engine Status Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
        <div className="bg-[#0e1524] border border-slate-800/80 rounded-xl p-4">
          <span className="text-[11px] font-sans font-semibold text-slate-400 block mb-1">
            Scheduler Engine
          </span>
          <div className="flex items-center space-x-2">
            <span className={`w-2.5 h-2.5 rounded-full ${status?.isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
            <span className="text-base font-bold text-white">
              {status?.isRunning ? 'ACTIVE (60s tick)' : 'PAUSED'}
            </span>
          </div>
        </div>

        <div className="bg-[#0e1524] border border-slate-800/80 rounded-xl p-4">
          <span className="text-[11px] font-sans font-semibold text-slate-400 block mb-1">
            Active Worker Pool
          </span>
          <span className="text-base font-bold text-cyan-400">
            {status?.workerPool?.active || 0} / {status?.workerPool?.concurrency || 10} Workers
          </span>
        </div>

        <div className="bg-[#0e1524] border border-slate-800/80 rounded-xl p-4">
          <span className="text-[11px] font-sans font-semibold text-slate-400 block mb-1">
            Queued Jobs
          </span>
          <span className="text-base font-bold text-purple-400">
            {status?.workerPool?.queued || 0} In Queue
          </span>
        </div>

        <div className="bg-[#0e1524] border border-slate-800/80 rounded-xl p-4">
          <span className="text-[11px] font-sans font-semibold text-slate-400 block mb-1">
            Total Checks Executed
          </span>
          <span className="text-base font-bold text-emerald-400">
            {status?.workerPool?.totalProcessed || 0} Cycles
          </span>
        </div>
      </div>

      {/* Live Socket Event Stream Terminal */}
      <div className="bg-[#0e1524] border border-slate-800/80 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
            <h2 className="text-sm font-bold text-white">Real-Time Event Stream Terminal</h2>
          </div>
          <span className="text-xs font-mono text-slate-400">WebSocket: Connected</span>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 font-mono text-xs max-h-96 overflow-y-auto space-y-2">
          {liveEvents.length === 0 ? (
            <div className="text-slate-500 py-6 text-center">
              Awaiting monitoring events from worker pool... Trigger a check or wait for the next scheduled tick.
            </div>
          ) : (
            liveEvents.map((ev, i) => (
              <div
                key={i}
                className={`p-2 rounded border leading-relaxed flex items-start space-x-3 ${
                  ev.status === 'DETECTED'
                    ? 'bg-cyan-950/60 border-cyan-800 text-cyan-300 font-bold'
                    : ev.status === 'SUCCESS'
                    ? 'bg-slate-900/80 border-slate-800 text-slate-300'
                    : ev.status === 'ERROR'
                    ? 'bg-rose-950/40 border-rose-900 text-rose-300'
                    : 'bg-slate-900/40 border-slate-800 text-slate-400'
                }`}
              >
                <span className="text-[10px] text-slate-500 whitespace-nowrap">{ev.time}</span>
                <span className="flex-1 break-words">{ev.text}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

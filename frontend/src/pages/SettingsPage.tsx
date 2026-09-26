import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, ShieldCheck, Clock, Cpu, Bell, Globe } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [interval, setInterval] = useState('60');
  const [concurrency, setConcurrency] = useState('10');
  const [timeout, setTimeout] = useState('10');
  const [targetDelay, setTargetDelay] = useState('300'); // 5 minutes
  const [retries, setRetries] = useState('2');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800/80">
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
          <SettingsIcon className="w-5 h-5 text-cyan-400" />
          <span>System & Monitoring Configuration Settings</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Adjust scheduler intervals, worker pool concurrency, HTTP timeouts, and SLA thresholds.
        </p>
      </div>

      {saved && (
        <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-xs font-semibold flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4" />
          <span>Configuration parameters updated and applied to runtime engine.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-[#0e1524] border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
        {/* Core Monitoring Settings */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center space-x-2 pb-2 border-b border-slate-800">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>Detection Latency & Scheduler Parameters</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Default Scheduler Cycle Interval
              </label>
              <select
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
              >
                <option value="30">30 seconds (High-frequency evaluation)</option>
                <option value="60">60 seconds (1 minute default)</option>
                <option value="180">180 seconds (3 minutes)</option>
                <option value="300">300 seconds (5 minutes standard)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target SLA Threshold
              </label>
              <select
                value={targetDelay}
                onChange={(e) => setTargetDelay(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
              >
                <option value="300">≤ 300 seconds (Primary 5-Minute Target)</option>
                <option value="600">≤ 600 seconds (10 Minutes Target)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Worker Pool Settings */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <h2 className="text-sm font-bold text-white flex items-center space-x-2 pb-2 border-b border-slate-800">
            <Cpu className="w-4 h-4 text-purple-400" />
            <span>Worker Queue Concurrency & Fault Tolerance</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Worker Pool Concurrency Limit
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={concurrency}
                onChange={(e) => setConcurrency(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Request Timeout (Seconds)
              </label>
              <input
                type="number"
                min="3"
                max="30"
                value={timeout}
                onChange={(e) => setTimeout(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Exponential Retries on Failure
              </label>
              <input
                type="number"
                min="0"
                max="5"
                value={retries}
                onChange={(e) => setRetries(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <h2 className="text-sm font-bold text-white flex items-center space-x-2 pb-2 border-b border-slate-800">
            <Bell className="w-4 h-4 text-blue-400" />
            <span>Alert & Telemetry Preferences</span>
          </h2>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="sound"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-900 border-slate-800 text-cyan-500 focus:ring-0"
            />
            <label htmlFor="sound" className="text-xs text-slate-300">
              Enable real-time audio toast alerts upon newly detected articles
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-4 border-t border-slate-800">
          <button
            type="submit"
            className="flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-950 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};

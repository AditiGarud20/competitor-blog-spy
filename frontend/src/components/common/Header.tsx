import React from 'react';
import {
  Search,
  Bell,
  Play,
  ExternalLink,
  ShieldAlert,
  Flame,
  CheckCircle2,
  SlidersHorizontal
} from 'lucide-react';

interface HeaderProps {
  onOpenCommandPalette: () => void;
  onOpenNotifications: () => void;
  unreadNotificationsCount: number;
  onTriggerCheck: () => void;
  isTriggering: boolean;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCommandPalette,
  onOpenNotifications,
  unreadNotificationsCount,
  onTriggerCheck,
  isTriggering,
  isDemoMode,
  onToggleDemoMode
}) => {
  return (
    <header className="h-16 bg-[#0b0f19]/80 border-b border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-20 backdrop-blur-xl shadow-sm shadow-cyan-900/10">
      {/* Title & Status */}
      <div className="flex items-center space-x-4">
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight flex items-center">
            Competitor Blog Spy
            <span className="mx-2 text-slate-600 font-light">|</span>
            <span className="text-xs font-normal text-slate-400 hidden sm:inline">
              Real-time competitor content intelligence
            </span>
          </h2>
        </div>

        {/* System Status Pill */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>ONLINE</span>
        </div>
      </div>

      {/* Global Actions */}
      <div className="flex items-center space-x-3">
        {/* Search Command Palette Trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 text-xs font-medium transition-all"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Search articles, competitors...</span>
          <kbd className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700 font-mono">
            Ctrl+K
          </kbd>
        </button>

        {/* Demo Blog External Link */}
        <a
          href="/demo-blog"
          target="_blank"
          rel="noreferrer"
          className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/40 border border-cyan-800/50 text-cyan-400 hover:bg-cyan-900/40 text-xs font-medium transition-all"
          title="Open simulated competitor blog in new tab"
        >
          <span>Target Demo Blog</span>
          <ExternalLink className="w-3 h-3" />
        </a>

        {/* Run Manual Cycle Button */}
        <button
          onClick={onTriggerCheck}
          disabled={isTriggering}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            isTriggering
              ? 'bg-cyan-600/50 text-cyan-200 cursor-not-allowed'
              : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm shadow-cyan-950'
          }`}
        >
          <Play className={`w-3.5 h-3.5 ${isTriggering ? 'animate-spin' : ''}`} />
          <span>{isTriggering ? 'Checking...' : 'Check Now'}</span>
        </button>

        {/* Mode Switch: Live vs Demo */}
        <button
          onClick={onToggleDemoMode}
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
            isDemoMode
              ? 'bg-purple-950/60 text-purple-300 border-purple-800/70'
              : 'bg-slate-900 text-slate-300 border-slate-800'
          }`}
          title="Toggle between Live Production mode and Interactive Demo Simulation"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="font-mono text-[11px]">{isDemoMode ? 'DEMO MODE' : 'LIVE MODE'}</span>
        </button>

        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all"
          title="View Real-Time Detection Alerts"
        >
          <Bell className="w-4 h-4" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-bold text-white shadow-md shadow-cyan-950">
              {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};

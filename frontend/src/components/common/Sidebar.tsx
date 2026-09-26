import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  UserPlus,
  Radio,
  FileText,
  History,
  BarChart3,
  Cpu,
  FlaskConical,
  Activity,
  Layers,
  CheckSquare,
  Settings,
  ShieldCheck,
  Zap
} from 'lucide-react';

interface SidebarProps {
  monitoringActive?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ monitoringActive = true }) => {
  const navItems = [
    { label: 'Overview Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Competitors', path: '/competitors', icon: Building2 },
    { label: '+ Add Competitor', path: '/competitors/new', icon: UserPlus, highlight: true },
    { label: 'Live Monitoring', path: '/monitoring', icon: Radio, pulse: true },
    { label: 'Detected Articles', path: '/articles', icon: FileText },
    { label: 'Monitoring Logs', path: '/logs', icon: History },
    { label: 'Detection Analytics', path: '/analytics', icon: BarChart3 },
    { label: '100-Site Scale Test', path: '/scale-test', icon: Cpu, badge: 'Scale' },
    { label: 'Demo Lab & Publish', path: '/demo-lab', icon: FlaskConical, badge: 'Live Demo' },
    { label: 'System Health', path: '/system-health', icon: Activity },
    { label: 'Architecture & Flow', path: '/architecture', icon: Layers },
    { label: 'Requirement Checklist', path: '/checklist', icon: CheckSquare },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0e1524] border-r border-slate-800/80 flex flex-col h-screen sticky top-0 select-none z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-950">
            <Radio className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base text-white tracking-tight flex items-center">
              Blog Spy
              <span className="ml-1.5 text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800/80 px-1.5 py-0.2 rounded font-mono">
                v1.0
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">Real-Time Intelligence</p>
          </div>
        </div>
      </div>

      {/* Target Delay Notice */}
      <div className="mx-3 mt-3 p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="flex items-center text-[11px] font-medium text-slate-300">
            <Zap className="w-3 h-3 text-cyan-400 mr-1" />
            Detection Target
          </span>
          <span className="font-mono text-cyan-400 font-bold text-[11px]">≤ 5 min</span>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full w-[94%]"></div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-950 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                } ${item.highlight ? 'text-cyan-300' : ''}`
              }
            >
              <div className="flex items-center space-x-2.5">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    item.pulse && monitoringActive ? 'animate-pulse text-cyan-400' : ''
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700 font-mono">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/40">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-emerald-400 font-semibold">Engine Active</span>
          </div>
          <span className="font-mono text-slate-400">Worker Pool (10)</span>
        </div>
      </div>
    </aside>
  );
};

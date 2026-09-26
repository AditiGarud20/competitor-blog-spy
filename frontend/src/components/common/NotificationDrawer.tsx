import React from 'react';
import { X, CheckCheck, Bell, Clock, Radio, AlertTriangle } from 'lucide-react';
import { NotificationItem } from '../../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#0e1524] border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
        <div className="flex items-center space-x-2">
          <Bell className="w-4 h-4 text-cyan-400" />
          <h3 className="font-bold text-sm text-white">Detection Alerts</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
            {notifications.length}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {notifications.length > 0 && (
            <button
              onClick={onMarkAllRead}
              className="text-xs text-slate-400 hover:text-cyan-400 flex items-center space-x-1 px-2 py-1 rounded hover:bg-slate-800 transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark read</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 p-1 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-xs">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
            No detection notifications yet.
          </div>
        ) : (
          notifications.map((item) => {
            const isTargetMet = item.type === 'TARGET_MET';
            const isTargetExceeded = item.type === 'TARGET_EXCEEDED';
            const isError = item.type === 'MONITORING_FAILED';

            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border text-xs transition-all ${
                  !item.read
                    ? 'bg-slate-900 border-cyan-800/40 shadow-sm shadow-cyan-950/20'
                    : 'bg-slate-900/40 border-slate-800/80 text-slate-400'
                }`}
              >
                <div className="flex items-start justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isTargetMet
                          ? 'bg-emerald-400'
                          : isTargetExceeded
                          ? 'bg-amber-400'
                          : isError
                          ? 'bg-rose-400'
                          : 'bg-cyan-400'
                      }`}
                    ></span>
                    <span className="font-semibold text-white">{item.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>

                <p className="text-slate-300 text-xs leading-relaxed mb-2.5">
                  {item.message}
                </p>

                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-800/60 font-mono">
                  {item.delaySeconds !== undefined && (
                    <span className="flex items-center text-slate-400">
                      <Clock className="w-3 h-3 mr-1 text-slate-500" />
                      Delay: <strong className={isTargetMet ? 'text-emerald-400 ml-1' : 'text-amber-400 ml-1'}>
                        {Math.floor(item.delaySeconds / 60)}m {item.delaySeconds % 60}s
                      </strong>
                    </span>
                  )}
                  {item.method && (
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 text-[10px]">
                      {item.method}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

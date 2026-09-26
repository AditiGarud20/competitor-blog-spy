import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from '../common/Sidebar';
import { Header } from '../common/Header';
import { CommandPalette } from '../common/CommandPalette';
import { NotificationDrawer } from '../common/NotificationDrawer';
import { getSocket } from '../../services/socket';
import { api } from '../../services/api';
import { NotificationItem } from '../../types';
import { Radio, CheckCircle, ExternalLink, Zap } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isTriggering, setIsTriggering] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [liveToast, setLiveToast] = useState<{
    title: string;
    message: string;
    delayFormatted: string;
    isWithinTarget: boolean;
    articleId?: string;
  } | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications();

    // Listen to Ctrl+K globally
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Socket.IO real-time listeners
    const socket = getSocket();

    socket.on('article.detected', (payload: any) => {
      const art = payload.article;
      if (art) {
        setLiveToast({
          title: art.title,
          message: `Detected from ${art.competitorName} via ${art.method}`,
          delayFormatted: art.delayFormatted,
          isWithinTarget: art.isWithinTarget,
          articleId: art.id
        });

        // Hide toast after 6 seconds
        setTimeout(() => setLiveToast(null), 6000);
      }
      loadNotifications();
    });

    socket.on('notification.created', (notif: NotificationItem) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      socket.off('article.detected');
      socket.off('notification.created');
    };
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markNotificationsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // ignore
    }
  };

  const handleTriggerCheck = async () => {
    try {
      setIsTriggering(true);
      await api.triggerAllMonitoring();
      setTimeout(() => {
        setIsTriggering(false);
      }, 1500);
    } catch (err: any) {
      setIsTriggering(false);
      alert('Error triggering check: ' + err.message);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0b0f19] text-slate-100">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          unreadNotificationsCount={unreadCount}
          onTriggerCheck={handleTriggerCheck}
          isTriggering={isTriggering}
          isDemoMode={isDemoMode}
          onToggleDemoMode={() => setIsDemoMode((prev) => !prev)}
        />

        {/* Live Detected Banner Toast */}
        {liveToast && (
          <div className="fixed bottom-6 right-6 z-50 max-w-md w-full bg-[#0e1524] border border-cyan-500/50 shadow-2xl shadow-cyan-950/80 rounded-xl p-4 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  New Article Detected!
                </span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  liveToast.isWithinTarget
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-amber-950 text-amber-400 border border-amber-800'
                }`}
              >
                {liveToast.isWithinTarget ? '≤ 5m Target' : '> 5m Delay'}
              </span>
            </div>

            <p className="font-semibold text-sm text-white mt-1.5 line-clamp-1">
              {liveToast.title}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{liveToast.message}</p>

            <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono">
                Exact Delay: <strong className="text-cyan-400">{liveToast.delayFormatted}</strong>
              </span>
              {liveToast.articleId && (
                <button
                  onClick={() => {
                    navigate(`/articles/${liveToast.articleId}`);
                    setLiveToast(null);
                  }}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center space-x-1"
                >
                  <span>View Details</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Page Content Outlet */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet context={{ isDemoMode }} />
        </main>
      </div>

      {/* Command Palette Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />

      {/* Notifications Drawer */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllRead={handleMarkAllRead}
      />
    </div>
  );
};

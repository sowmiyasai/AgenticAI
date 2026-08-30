import { useEffect } from 'react';
import { useNotificationStore } from '../store/notificationStore';
import { X, CheckCheck, Bell, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export default function NotificationsDrawer() {
  const {
    notifications,
    unreadCount,
    isDrawerOpen,
    setDrawerOpen,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    setupSocketListener,
  } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
    setupSocketListener();
  }, [fetchNotifications, setupSocketListener]);

  if (!isDrawerOpen) return null;

  const getTypeIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'escalation':
      case 'failure':
        return <AlertCircle className="w-5 h-5 text-rose-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      default:
        return <Info className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => setDrawerOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 text-slate-100 shadow-2xl flex flex-col">
          {/* Drawer Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-semibold tracking-tight">Agent Notifications</h2>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold bg-indigo-600 text-white rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="p-1.5 text-xs text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded transition flex items-center space-x-1"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-4 h-4 mr-1" />
                  Mark Read
                </button>
              )}
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center text-slate-500">
                <Bell className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">No agent notifications yet.</p>
                <p className="text-xs text-slate-600 mt-1">Events & escalation alerts will appear here in real-time.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id || n.id}
                  onClick={() => markAsRead(n._id || n.id)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer ${
                    n.isRead
                      ? 'bg-slate-900/50 border-slate-800/80 text-slate-400'
                      : 'bg-slate-800/80 border-indigo-500/40 text-slate-200 shadow-md shadow-indigo-950/20'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5 flex-shrink-0">{getTypeIcon(n.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-semibold truncate ${n.isRead ? 'text-slate-300' : 'text-white'}`}>
                          {n.title}
                        </p>
                        <span className="text-[10px] text-slate-500">
                          {new Date(n.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs mt-1 text-slate-400 line-clamp-2">{n.message}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

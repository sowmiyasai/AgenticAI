import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { useThemeStore } from '../store/themeStore';
import NotificationsDrawer from './NotificationsDrawer';
import {
  LayoutDashboard,
  GitBranch,
  Sparkles,
  PlayCircle,
  Puzzle,
  Settings,
  LogOut,
  Bell,
  Cpu,
  ShieldCheck,
  Menu,
  X,
  Sun,
  Moon,
} from 'lucide-react';

export default function AppShell({ children, title = 'Operator Console' }) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { unreadCount, toggleDrawer } = useNotificationStore();
  const { theme, toggleTheme } = useThemeStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Workflows', href: '/workflows', icon: GitBranch },
    { name: 'AI Prompt Builder', href: '/workflows/builder', icon: Sparkles, badge: 'AI' },
    { name: 'Executions', href: '/executions', icon: PlayCircle },
    { name: 'Integrations', href: '/integrations', icon: Puzzle },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col md:flex-row">
      <NotificationsDrawer />

      <aside className="hidden md:flex flex-col w-64 bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)] p-4 shrink-0 shadow-sm backdrop-blur-sm">
        <div className="flex items-center space-x-3 px-2 py-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-[var(--foreground)] flex items-center">
              Agentflow<span className="text-cyan-400 font-extrabold ml-0.5">_AI</span>
            </h1>
            <p className="text-[11px] text-[var(--muted)] font-medium">Ops Orchestration</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = router.pathname === item.href || (item.href !== '/dashboard' && router.pathname.startsWith(item.href));
            return (
              <Link key={item.name} href={item.href} passHref>
                <a
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-900/30'
                      : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[rgba(148,163,184,0.08)]'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[var(--muted)]'}`} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-md">
                      {item.badge}
                    </span>
                  )}
                </a>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 bg-[var(--panel)] border border-[var(--panel-border)] rounded-xl my-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">Agents Fleet</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1 text-[10px] text-[var(--muted)]">
            <div className="flex items-center space-x-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
              <span>Planner</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span>Executor</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Validator</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Recovery</span>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-[var(--panel-border)] flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-500/30 text-indigo-300 font-bold flex items-center justify-center text-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'O'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[var(--foreground)] truncate">{user?.name || 'Operator'}</p>
              <p className="text-[10px] text-[var(--muted)] capitalize">{user?.role || 'Operator'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            className="p-1.5 text-[var(--muted)] hover:text-rose-400 hover:bg-[rgba(148,163,184,0.08)] rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-[var(--card)]/80 backdrop-blur-md border-b border-[var(--panel-border)] px-4 md:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[var(--muted)] hover:text-[var(--foreground)] rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div>
              <h2 className="text-base font-semibold text-[var(--foreground)] tracking-tight">{title}</h2>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-[var(--panel-border)] bg-[var(--panel)] text-[var(--muted)] hover:text-[var(--foreground)] transition"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <div className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-[var(--panel)] border border-[var(--panel-border)] rounded-full text-xs text-[var(--muted)]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Orchestrator Online</span>
            </div>

            <button
              onClick={toggleDrawer}
              className="relative p-2 text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[rgba(148,163,184,0.08)] rounded-xl transition"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full ring-2 ring-[var(--background)]" />
              )}
            </button>
          </div>
        </header>

        {mobileMenuOpen && (
          <div className="md:hidden bg-[var(--card)] border-b border-[var(--panel-border)] p-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.name} href={item.href} passHref>
                  <a
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-3 py-2 text-sm text-[var(--muted)] hover:bg-[rgba(148,163,184,0.08)] rounded-lg"
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </a>
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-rose-400 hover:bg-[rgba(148,163,184,0.08)] rounded-lg text-left"
            >
              <LogOut className="w-5 h-5" />
              <span>Log out</span>
            </button>
          </div>
        )}

        <main className="flex-1 overflow-y-auto min-w-0 bg-[var(--background)] p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

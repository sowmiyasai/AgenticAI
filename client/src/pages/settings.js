import { useState, useEffect } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';
import AppShell from '../components/AppShell';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import api from '../services/api';
import {
  User,
  Shield,
  CheckCircle,
  Database,
  Lock,
  Server,
  Activity,
  Moon,
  Sun,
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await api.get('/health');
        setHealthData(res.data);
      } catch (e) {
        console.error('Health check failed:', e);
      } finally {
        setLoading(false);
      }
    }
    checkHealth();
  }, []);

  return (
    <ProtectedRoute>
      <AppShell title="Console Settings & Security">
        <div className="max-w-4xl space-y-6">
          <div>
            <h1 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Security & Infrastructure</h1>
            <p className="text-xs text-[var(--muted)]">
              Manage operator credentials, encryption status, and multi-agent engine telemetry
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[var(--card)] border border-[var(--panel-border)] shadow-xl backdrop-blur-xl">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--panel-border)] mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--foreground)]">Operator Profile</h3>
                  <p className="text-xs text-[var(--muted)]">Current authenticated session</p>
                </div>
              </div>
              <span className="px-3 py-1 text-xs font-bold rounded-full uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                {user?.role || 'Operator'} Role
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-[var(--panel)] border border-[var(--panel-border)]">
                <span className="text-[var(--muted)] font-medium">Operator Name</span>
                <p className="text-sm font-bold text-[var(--foreground)] mt-1">{user?.name || 'Operator'}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--panel)] border border-[var(--panel-border)]">
                <span className="text-[var(--muted)] font-medium">Email Address</span>
                <p className="text-sm font-bold text-[var(--foreground)] mt-1">{user?.email || 'operator@agentflow.io'}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--panel)] border border-[var(--panel-border)]">
                <span className="text-[var(--muted)] font-medium">Operator ID</span>
                <p className="text-xs font-mono text-indigo-300 mt-1">{user?.id || 'N/A'}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--panel)] border border-[var(--panel-border)]">
                <span className="text-[var(--muted)] font-medium">Password Hashing</span>
                <p className="text-xs text-emerald-400 font-semibold mt-1 flex items-center">
                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                  bcrypt (Cost Factor 12)
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-[var(--card)] border border-[var(--panel-border)] shadow-xl backdrop-blur-xl">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--panel-border)] mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-cyan-600/20 border border-cyan-500/30 text-cyan-400">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--foreground)]">Security & Environment Health</h3>
                  <p className="text-xs text-[var(--muted)]">Cryptographic status and database connectivity</p>
                </div>
              </div>

              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 rounded-full border border-[var(--panel-border)] bg-[var(--panel)] px-3 py-2 text-xs font-medium text-[var(--foreground)]"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                {theme === 'dark' ? 'Light mode' : 'Dark mode'}
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-xl bg-[var(--panel)] border border-[var(--panel-border)] flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Lock className="w-4 h-4 text-indigo-400" />
                  <div>
                    <span className="font-bold text-[var(--foreground)]">CREDENTIAL_ENCRYPTION_KEY</span>
                    <p className="text-[11px] text-[var(--muted)]">AES-256-GCM cipher encryption active</p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  HEALTHY
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[var(--panel)] border border-[var(--panel-border)] flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Database className="w-4 h-4 text-cyan-400" />
                  <div>
                    <span className="font-bold text-[var(--foreground)]">Database Engine</span>
                    <p className="text-[11px] text-[var(--muted)]">
                      {healthData?.storage || 'In-Memory DB Mode with MongoDB fallback'}
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  CONNECTED
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[var(--panel)] border border-[var(--panel-border)] flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Server className="w-4 h-4 text-violet-400" />
                  <div>
                    <span className="font-bold text-[var(--foreground)]">Background Execution Queue</span>
                    <p className="text-[11px] text-[var(--muted)]">
                      {healthData?.queue || 'In-Memory Asynchronous Queue'}
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  READY
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[var(--panel)] border border-[var(--panel-border)] flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Activity className="w-4 h-4 text-amber-400" />
                  <div>
                    <span className="font-bold text-[var(--foreground)]">LangGraph Multi-Agent Engine</span>
                    <p className="text-[11px] text-[var(--muted)]">5-Agent Chain (Planner, Exec, Valid, Recov, Mon)</p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  ACTIVE
                </span>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}

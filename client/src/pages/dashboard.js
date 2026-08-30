import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '../components/ProtectedRoute';
import AppShell from '../components/AppShell';
import MetricGrid from '../components/MetricGrid';
import api from '../services/api';
import {
  GitBranch,
  PlayCircle,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Plus,
  Bot,
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
} from 'lucide-react';

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get('/workflows/dashboard');
      setDashboardData(res.data.data);
    } catch (e) {
      console.error('Failed to fetch dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const metrics = dashboardData?.metrics || {
    totalWorkflows: 0,
    activeWorkflows: 0,
    totalExecutions: 0,
    completedExecutions: 0,
    failedExecutions: 0,
    runningExecutions: 0,
    successRate: 100,
  };

  const recentExecutions = dashboardData?.recentExecutions || [];
  const recentLogs = dashboardData?.recentLogs || [];

  return (
    <ProtectedRoute>
      <AppShell title="Operations Dashboard">
        {/* Top Actions & Quick Trigger */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Mission Control</h1>
            <p className="text-xs text-slate-400">Real-time status of agentic workflows and telemetry logs</p>
          </div>
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              onClick={fetchDashboard}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition"
              title="Refresh Dashboard"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Link href="/workflows/builder" passHref>
              <a className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-indigo-900/30 transition flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-cyan-300" />
                <span>Generate Workflow</span>
              </a>
            </Link>
          </div>
        </div>

        {/* Metric Grid KPIs */}
        <MetricGrid metrics={metrics} />

        {/* Main Content Grid: Recent Executions + Agent Fleet Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Recent Executions */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <div className="flex items-center space-x-2">
                  <PlayCircle className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-sm font-bold text-white tracking-tight">Recent Execution Runs</h2>
                </div>
                <Link href="/executions" passHref>
                  <a className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1">
                    <span>View All</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </Link>
              </div>

              {recentExecutions.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  <PlayCircle className="w-8 h-8 mb-2 opacity-30 mx-auto" />
                  <p>No workflow runs recorded yet.</p>
                  <Link href="/workflows/builder" passHref>
                    <a className="inline-block mt-3 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold">
                      Build your first workflow →
                    </a>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {recentExecutions.map((exec) => (
                    <Link key={exec._id || exec.id} href={`/executions/${exec._id || exec.id}`} passHref>
                      <a className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-indigo-500/40 transition flex items-center justify-between block group">
                        <div className="flex items-center space-x-3 min-w-0">
                          <div
                            className={`w-2.5 h-2.5 rounded-full ${
                              exec.status === 'COMPLETED'
                                ? 'bg-emerald-400'
                                : exec.status === 'FAILED'
                                ? 'bg-rose-400'
                                : 'bg-indigo-400 animate-ping'
                            }`}
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-200 group-hover:text-white truncate">
                              {exec.snapshot?.name || 'Automation Run'}
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono">
                              ID: {(exec._id || exec.id).slice(0, 8)}... • Duration:{' '}
                              {exec.duration ? `${(exec.duration / 1000).toFixed(1)}s` : 'running...'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <span
                            className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase border ${
                              exec.status === 'COMPLETED'
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                : exec.status === 'FAILED'
                                ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                                : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                            }`}
                          >
                            {exec.status}
                          </span>
                          <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition" />
                        </div>
                      </a>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Automation Launchpad */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/40 to-slate-900/60 border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-300">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Natural Language Automation</h3>
                  <p className="text-xs text-slate-400">Describe any task in English to generate complete React Flow graphs</p>
                </div>
              </div>
              <Link href="/workflows/builder" passHref>
                <a className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-900/30 transition shrink-0">
                  Prompt Generator →
                </a>
              </Link>
            </div>
          </div>

          {/* Right Col: Live Agent Activity Stream */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                <h2 className="text-sm font-bold text-white tracking-tight">AI Agent Activity Feed</h2>
              </div>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {recentLogs.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  <Activity className="w-8 h-8 mb-2 opacity-30 mx-auto" />
                  <p>No telemetry logs recorded yet.</p>
                </div>
              ) : (
                recentLogs.map((log, idx) => (
                  <div
                    key={log._id || log.id || idx}
                    className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-1.5 py-0.2 text-[9px] font-bold rounded uppercase bg-indigo-500/20 text-indigo-300 font-mono">
                        {log.agent}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(log.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed line-clamp-2">{log.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}

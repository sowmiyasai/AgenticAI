import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute';
import AppShell from '../../components/AppShell';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import {
  PlayCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  ChevronRight,
  Filter,
  Activity,
  Layers,
  Radio,
} from 'lucide-react';

export default function ExecutionsListPage() {
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchExecutions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/executions');
      setExecutions(res.data.data || []);
    } catch (e) {
      console.error('Failed to load executions:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExecutions();

    // Listen for live execution status updates
    const socket = getSocket();
    if (socket) {
      const handleUpdate = (update) => {
        setExecutions((prev) =>
          prev.map((item) =>
            item._id === update.executionId || item.id === update.executionId
              ? { ...item, status: update.status || item.status, currentNode: update.currentNode }
              : item
          )
        );
      };
      socket.on('execution:update', handleUpdate);
      return () => {
        socket.off('execution:update', handleUpdate);
      };
    }
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
      case 'FAILED':
        return 'bg-rose-500/10 text-rose-300 border-rose-500/30';
      case 'RUNNING':
        return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30 animate-pulse';
      case 'RETRYING':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'PAUSED':
        return 'bg-slate-500/10 text-slate-300 border-slate-500/30';
      default:
        return 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30';
    }
  };

  const filtered = executions.filter((exec) => {
    const name = exec.snapshot?.name || '';
    const id = exec._id || exec.id || '';
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase()) || id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || exec.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <ProtectedRoute>
      <AppShell title="Executions History & Runs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Execution Audit Records</h1>
            <p className="text-xs text-slate-400">Audited timeline runs, failure classifications, and agent steps</p>
          </div>
          <button
            onClick={fetchExecutions}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition"
            title="Refresh Executions"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by execution ID or workflow name..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
            {['all', 'RUNNING', 'COMPLETED', 'FAILED', 'PAUSED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition ${
                  statusFilter === st
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-950/60 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Executions Table */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-2xl">
          {loading ? (
            <div className="py-24 text-center text-slate-500 text-xs">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-3" />
              <p>Fetching execution audit records...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-slate-500 text-xs">
              <PlayCircle className="w-10 h-10 mb-2 opacity-30 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">No execution records found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {filtered.map((exec) => {
                const execId = exec._id || exec.id;
                return (
                  <Link key={execId} href={`/executions/${execId}`} passHref>
                    <a className="p-4 hover:bg-slate-800/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 block group">
                      <div className="flex items-start sm:items-center space-x-3.5 min-w-0">
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-indigo-400 group-hover:border-indigo-500/40 transition">
                          <PlayCircle className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="text-xs font-bold text-white group-hover:text-indigo-300 transition truncate">
                              {exec.snapshot?.name || 'Automation Run'}
                            </p>
                            <span className="text-[10px] font-mono text-slate-500">v{exec.snapshot?.version || 1}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                            ID: {execId} • Started {new Date(exec.startTime || exec.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 self-end sm:self-auto">
                        <div className="text-right hidden sm:block">
                          <p className="text-xs font-semibold text-slate-300 font-mono">
                            {exec.duration ? `${(exec.duration / 1000).toFixed(2)}s` : 'active...'}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {exec.retryCount > 0 ? `${exec.retryCount} Retries` : 'Zero Faults'}
                          </p>
                        </div>

                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase border ${getStatusBadge(exec.status)}`}>
                          {exec.status}
                        </span>

                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-200 transition" />
                      </div>
                    </a>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}

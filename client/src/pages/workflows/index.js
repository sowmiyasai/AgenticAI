import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/ProtectedRoute';
import AppShell from '../../components/AppShell';
import api from '../../services/api';
import {
  GitBranch,
  Search,
  Plus,
  Play,
  Copy,
  Trash2,
  Edit,
  Sparkles,
  RefreshCw,
  Tag,
  CheckCircle2,
  Clock,
  ChevronRight,
} from 'lucide-react';

export default function WorkflowsListPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const res = await api.get('/workflows');
      setWorkflows(res.data.data || []);
    } catch (e) {
      console.error('Failed to fetch workflows:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const handleDuplicate = async (id, e) => {
    e.stopPropagation();
    try {
      setActionLoadingId(id);
      const res = await api.post(`/workflows/${id}/duplicate`);
      await fetchWorkflows();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to duplicate workflow');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this workflow?')) return;
    try {
      setActionLoadingId(id);
      await api.delete(`/workflows/${id}`);
      setWorkflows(workflows.filter((w) => (w._id || w.id) !== id));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete workflow');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleExecute = async (id, e) => {
    e.stopPropagation();
    try {
      setActionLoadingId(id);
      const res = await api.post(`/workflows/${id}/execute`, { inputs: { trigger: 'manual_run' } });
      const execId = res.data.data._id || res.data.data.id;
      router.push(`/executions/${execId}`);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to trigger execution');
      setActionLoadingId(null);
    }
  };

  const filteredWorkflows = workflows.filter((w) => {
    const matchesSearch =
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      (w.description && w.description.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || w.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <ProtectedRoute>
      <AppShell title="Workflows Management">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Automation Workflows</h1>
            <p className="text-xs text-slate-400">Configure visual DAGs, triggers, and multi-agent pipelines</p>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <Link href="/workflows/builder" passHref>
              <a className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-indigo-900/30 transition flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-cyan-200" />
                <span>Generate with Prompt</span>
              </a>
            </Link>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search workflows by name or description..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
            {['all', 'active', 'draft', 'paused'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition ${
                  statusFilter === status
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-950/60 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Workflow Cards Grid */}
        {loading ? (
          <div className="py-24 text-center text-slate-500 text-xs">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-3" />
            <p>Loading agentic workflows...</p>
          </div>
        ) : filteredWorkflows.length === 0 ? (
          <div className="py-24 text-center text-slate-500 text-xs rounded-2xl bg-slate-900/40 border border-slate-800/80">
            <GitBranch className="w-12 h-12 mb-3 opacity-30 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">No workflows found</p>
            <p className="text-slate-500 mt-1">Generate one instantly from a natural language prompt.</p>
            <Link href="/workflows/builder" passHref>
              <a className="inline-flex items-center space-x-2 mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl">
                <Sparkles className="w-4 h-4 text-cyan-300" />
                <span>Create with AI</span>
              </a>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredWorkflows.map((w) => {
              const wfId = w._id || w.id;
              const nodeCount = w.nodes?.length || 0;
              const edgeCount = w.edges?.length || 0;

              return (
                <div
                  key={wfId}
                  onClick={() => router.push(`/workflows/${wfId}`)}
                  className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 transition-all hover:scale-[1.01] shadow-xl flex flex-col justify-between cursor-pointer group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        v{w.version || 1} • {w.status || 'active'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {nodeCount} Nodes • {edgeCount} Edges
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition line-clamp-1">
                      {w.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {w.description || 'Custom multi-agent automation workflow.'}
                    </p>

                    {/* Tags */}
                    {w.tags && w.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {w.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-slate-950 text-slate-400 border border-slate-800"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => handleExecute(wfId, e)}
                        disabled={actionLoadingId === wfId}
                        className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold transition flex items-center space-x-1"
                        title="Trigger Execution"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Run</span>
                      </button>

                      <button
                        onClick={(e) => handleDuplicate(wfId, e)}
                        disabled={actionLoadingId === wfId}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                        title="Duplicate Workflow"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => handleDelete(wfId, e)}
                        disabled={actionLoadingId === wfId}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                        title="Delete Workflow"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <span className="text-xs text-indigo-400 font-semibold flex items-center space-x-1">
                      <span>Edit</span>
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </AppShell>
    </ProtectedRoute>
  );
}

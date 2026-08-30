import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute';
import AppShell from '../../components/AppShell';
import WorkflowCanvas from '../../components/WorkflowCanvas';
import Timeline from '../../components/Timeline';
import { useWorkflowStore } from '../../store/workflowStore';
import api from '../../services/api';
import { getSocket, joinExecutionRoom, leaveExecutionRoom } from '../../services/socket';
import {
  PlayCircle,
  PauseCircle,
  XCircle,
  ArrowLeft,
  RefreshCw,
  Cpu,
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Radio,
  FileCode,
} from 'lucide-react';

export default function ExecutionDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const { setWorkflow } = useWorkflowStore();

  const [execution, setExecution] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('timeline'); // 'timeline' | 'outputs'

  const fetchExecutionTimeline = async () => {
    if (!id) return;
    try {
      const res = await api.get(`/executions/${id}/timeline`);
      const { execution: execData, logs: logData } = res.data.data;
      setExecution(execData);
      setLogs(logData || []);
      if (execData?.snapshot) {
        setWorkflow(execData.snapshot);
      }
    } catch (e) {
      console.error('Failed to load execution timeline:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExecutionTimeline();

    if (id) {
      joinExecutionRoom(id);

      const socket = getSocket();
      if (socket) {
        const handleEvent = (eventData) => {
          setLogs((prev) => {
            const exists = prev.some((l) => (l._id || l.id) === eventData.id);
            return exists ? prev : [...prev, eventData];
          });
          if (eventData.status) {
            setExecution((prev) => (prev ? { ...prev, status: eventData.status, currentNode: eventData.nodeId } : prev));
          }
        };

        socket.on('execution:event', handleEvent);
        return () => {
          socket.off('execution:event', handleEvent);
          leaveExecutionRoom(id);
        };
      }
    }
  }, [id]);

  const handlePause = async () => {
    setActionLoading(true);
    try {
      const res = await api.post(`/executions/${id}/pause`);
      setExecution(res.data.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to pause execution');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    setActionLoading(true);
    try {
      const res = await api.post(`/executions/${id}/resume`);
      setExecution(res.data.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to resume execution');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this execution?')) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/executions/${id}/cancel`);
      setExecution(res.data.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel execution');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'FAILED':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'RUNNING':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 animate-pulse';
      case 'RETRYING':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'PAUSED':
        return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
      default:
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <AppShell title="Execution Live Stream">
          <div className="h-[calc(100vh-10rem)] flex flex-col items-center justify-center text-slate-400 text-xs">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
            <p>Connecting to multi-agent live stream...</p>
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell title={`Run: ${execution?.snapshot?.name || 'Live Execution'}`}>
        <div className="flex flex-col h-[calc(100vh-8.5rem)]">
          {/* Header Bar */}
          <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3 shrink-0 shadow-xl backdrop-blur-xl">
            <div className="flex items-center space-x-3 min-w-0">
              <Link href="/executions" passHref>
                <a className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
                  <ArrowLeft className="w-4 h-4" />
                </a>
              </Link>
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <h2 className="text-sm font-bold text-white truncate">{execution?.snapshot?.name || 'Execution'}</h2>
                  <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase border ${getStatusBadge(execution?.status)}`}>
                    {execution?.status}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono">
                  Run ID: {id} • Engine: LangGraph ({execution?.langGraph || 'available'})
                </p>
              </div>
            </div>

            {/* Runtime Controls */}
            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              {execution?.status === 'RUNNING' && (
                <button
                  onClick={handlePause}
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold transition flex items-center space-x-1"
                >
                  <PauseCircle className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </button>
              )}

              {execution?.status === 'PAUSED' && (
                <button
                  onClick={handleResume}
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold transition flex items-center space-x-1"
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span>Resume</span>
                </button>
              )}

              {(execution?.status === 'RUNNING' || execution?.status === 'PAUSED' || execution?.status === 'RETRYING') && (
                <button
                  onClick={handleCancel}
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold transition flex items-center space-x-1"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              )}
            </div>
          </div>

          {/* Split View: Graph Canvas Top/Left + Live Agent Timeline */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
            {/* Visual Canvas Snapshot */}
            <div className="lg:col-span-6 flex flex-col rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-xl relative min-h-[300px]">
              <div className="p-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between z-10">
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Workflow Snapshot Graph</span>
                </div>
                {execution?.currentNode && (
                  <span className="px-2 py-0.5 text-[10px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-500/30 rounded-md animate-pulse">
                    Active: {execution.currentNode}
                  </span>
                )}
              </div>
              <div className="flex-1 relative">
                <WorkflowCanvas readOnly={true} activeNodeId={execution?.currentNode} />
              </div>
            </div>

            {/* Live Agent Timeline & Outputs Panel */}
            <div className="lg:col-span-6 flex flex-col rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/60 shadow-xl min-h-[300px]">
              {/* Tab Selector */}
              <div className="p-2 bg-slate-950/80 border-b border-slate-800 flex items-center space-x-2">
                <button
                  onClick={() => setActiveTab('timeline')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 ${
                    activeTab === 'timeline'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Radio className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Agent Stream ({logs.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab('outputs')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 ${
                    activeTab === 'outputs'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Context Outputs</span>
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 p-3 min-h-0 overflow-y-auto">
                {activeTab === 'timeline' ? (
                  <Timeline logs={logs} isLive={execution?.status === 'RUNNING'} currentStep={execution?.currentNode} />
                ) : (
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-300">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Aggregated Execution Context
                    </h4>
                    <pre className="overflow-x-auto p-3 bg-slate-900 rounded-lg border border-slate-800">
                      {JSON.stringify(execution?.outputs || {}, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}

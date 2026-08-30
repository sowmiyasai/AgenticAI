import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/ProtectedRoute';
import AppShell from '../../components/AppShell';
import NodePalette from '../../components/NodePalette';
import WorkflowCanvas from '../../components/WorkflowCanvas';
import NodeConfigPanel from '../../components/NodeConfigPanel';
import { useWorkflowStore } from '../../store/workflowStore';
import api from '../../services/api';
import {
  Save,
  Play,
  Copy,
  Trash2,
  GitBranch,
  RefreshCw,
  Sliders,
  CheckCircle2,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

export default function WorkflowEditorPage() {
  const router = useRouter();
  const { id } = router.query;

  const {
    currentWorkflow,
    setWorkflow,
    nodes,
    edges,
    selectedNode,
    isDirty,
  } = useWorkflowStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDesc, setWorkflowDesc] = useState('');

  const fetchWorkflow = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get(`/workflows/${id}`);
      const wf = res.data.data;
      setWorkflow(wf);
      setWorkflowName(wf.name || 'Untitled Automation');
      setWorkflowDesc(wf.description || '');
    } catch (e) {
      console.error('Failed to load workflow:', e);
      alert('Could not load workflow details.');
      router.push('/workflows');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflow();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name: workflowName,
        description: workflowDesc,
        nodes,
        edges,
        tags: currentWorkflow?.tags || ['Automation'],
        triggerConfig: currentWorkflow?.triggerConfig || { type: 'manual', config: {} },
      };

      const res = await api.put(`/workflows/${id}`, payload);
      setWorkflow(res.data.data);
      alert('Workflow saved successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save workflow.');
    } finally {
      setSaving(false);
    }
  };

  const handleExecute = async () => {
    setExecuting(true);
    try {
      await api.put(`/workflows/${id}`, {
        name: workflowName,
        description: workflowDesc,
        nodes,
        edges,
      });

      const res = await api.post(`/workflows/${id}/execute`, {
        inputs: { trigger: 'canvas_manual_trigger' },
      });
      const execId = res.data.data._id || res.data.data.id;
      router.push(`/executions/${execId}`);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to trigger execution.');
      setExecuting(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <AppShell title="Workflow Editor">
          <div className="h-[calc(100vh-10rem)] flex flex-col items-center justify-center text-slate-400 text-xs">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
            <p>Loading workflow canvas...</p>
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell title={`Editor: ${workflowName}`}>
        <div className="flex flex-col h-[calc(100vh-8.5rem)]">
          {/* Top Control Bar */}
          <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3 shrink-0 shadow-lg">
            <div className="flex items-center space-x-3 min-w-0">
              <Link href="/workflows" passHref>
                <a className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
                  <ArrowLeft className="w-4 h-4" />
                </a>
              </Link>
              <div className="min-w-0">
                <input
                  type="text"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  className="bg-transparent text-sm font-bold text-white focus:outline-none border-b border-transparent focus:border-indigo-500 px-1 truncate"
                />
                <p className="text-[10px] text-slate-400 font-mono px-1">
                  v{currentWorkflow?.version || 1} • {nodes.length} Steps
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 shadow-sm"
              >
                <Save className="w-3.5 h-3.5 text-indigo-400" />
                <span>{saving ? 'Saving...' : 'Save Draft'}</span>
              </button>

              <button
                onClick={handleExecute}
                disabled={executing}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:opacity-95 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-900/30 transition flex items-center space-x-1.5"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{executing ? 'Queuing...' : 'Execute Workflow'}</span>
              </button>
            </div>
          </div>

          {/* Canvas Workspace with NodePalette & NodeConfigPanel */}
          <div className="flex-1 flex rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 min-h-0 relative shadow-2xl">
            {/* Left Node Palette */}
            <NodePalette />

            {/* Center Visual Canvas */}
            <div className="flex-1 h-full relative">
              <WorkflowCanvas />
            </div>

            {/* Right Node Config Inspector */}
            {selectedNode && <NodeConfigPanel />}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}

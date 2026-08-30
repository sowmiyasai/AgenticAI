import { useState } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/ProtectedRoute';
import AppShell from '../../components/AppShell';
import WorkflowCanvas from '../../components/WorkflowCanvas';
import NodeConfigPanel from '../../components/NodeConfigPanel';
import { useWorkflowStore } from '../../store/workflowStore';
import api from '../../services/api';
import {
  Sparkles,
  Send,
  Loader2,
  Save,
  Play,
  Layers,
  ArrowRight,
  Lightbulb,
  CheckCircle,
  Cpu,
} from 'lucide-react';

export default function WorkflowBuilderPage() {
  const router = useRouter();
  const { setWorkflow, nodes, edges, selectedNode } = useWorkflowStore();

  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatedMeta, setGeneratedMeta] = useState(null);
  const [error, setError] = useState('');

  const promptSuggestions = [
    {
      title: 'Invoice Processing Pipeline',
      prompt:
        'Receive an invoice email, extract total amount and line items with AI, verify budget threshold, post breakdown to Slack, and record transaction in Google Sheets',
    },
    {
      title: 'Support Ticket Auto-Responder',
      prompt:
        'Monitor customer support emails, classify intent and sentiment with AI, send auto-resolution email, and escalate high-priority tickets to Discord bot',
    },
    {
      title: 'Incident Telemetry & War Room',
      prompt:
        'Listen for critical system incident webhooks, generate concise incident synopsis with AI, broadcast alert to Slack and Discord, and record SLA log in Sheets',
    },
  ];

  const handleGenerate = async (promptToUse) => {
    const activePrompt = promptToUse || prompt;
    if (!activePrompt.trim()) {
      setError('Please provide a prompt describing your automation.');
      return;
    }

    setError('');
    setGenerating(true);
    try {
      const res = await api.post('/workflows/generate', { prompt: activePrompt });
      const workflowData = res.data.data;
      setGeneratedMeta(workflowData);
      setWorkflow(workflowData);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate workflow graph.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveAndOpen = async (shouldRun = false) => {
    if (nodes.length === 0) {
      setError('Please generate or create nodes before saving.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: generatedMeta?.name || prompt.slice(0, 40) || 'AI Generated Automation',
        description: generatedMeta?.description || prompt || '',
        tags: generatedMeta?.tags || ['AI Generated', 'Automation'],
        triggerConfig: generatedMeta?.triggerConfig || { type: 'manual', config: {} },
        nodes,
        edges,
        status: 'active',
      };

      const res = await api.post('/workflows', payload);
      const savedWf = res.data.data;
      const wfId = savedWf._id || savedWf.id;

      if (shouldRun) {
        const execRes = await api.post(`/workflows/${wfId}/execute`, { inputs: { trigger: 'builder_direct_run' } });
        const execId = execRes.data.data._id || execRes.data.data.id;
        router.push(`/executions/${execId}`);
      } else {
        router.push(`/workflows/${wfId}`);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save workflow.');
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell title="AI Prompt Workflow Builder">
        <div className="flex flex-col h-[calc(100vh-8.5rem)]">
          {/* Top Prompt Input Section */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl mb-4 backdrop-blur-xl shrink-0">
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h2 className="text-sm font-bold text-white tracking-tight">
                Natural Language Workflow Architect
              </h2>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Describe your desired automation. The engine will synthesize a multi-agent DAG with proper triggers,
              integrations, and data flow.
            </p>

            {error && (
              <div className="mb-3 p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                  placeholder="e.g. Ingest email invoice, parse total with AI, post alert to Slack, and log in Google Sheets..."
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 placeholder:text-slate-600 shadow-inner"
                />
              </div>
              <button
                onClick={() => handleGenerate()}
                disabled={generating}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-indigo-900/40 transition flex items-center space-x-2 disabled:opacity-50 shrink-0"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Synthesizing Graph...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-cyan-200" />
                    <span>Generate Graph</span>
                  </>
                )}
              </button>
            </div>

            {/* Prompt Quick Suggestions */}
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-800/80">
              <span className="text-[11px] font-semibold text-slate-500 flex items-center mr-1">
                <Lightbulb className="w-3.5 h-3.5 mr-1 text-amber-400" />
                Templates:
              </span>
              {promptSuggestions.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(item.prompt);
                    handleGenerate(item.prompt);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-950/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-[11px] font-medium transition"
                >
                  {item.title}
                </button>
              ))}
            </div>
          </div>

          {/* Center Canvas Preview & Inspector */}
          <div className="flex-1 flex rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 relative min-h-0">
            <div className="flex-1 h-full relative">
              {nodes.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-slate-500">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 flex items-center justify-center mb-4">
                    <Sparkles className="w-8 h-8 text-indigo-400" />
                  </div>
                  <h3 className="text-base font-bold text-slate-300">Visual Workflow Canvas</h3>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">
                    Enter a prompt above or pick a template to watch the multi-agent graph materialize.
                  </p>
                </div>
              ) : (
                <WorkflowCanvas />
              )}
            </div>

            {/* Config Inspector if a node is clicked */}
            {selectedNode && <NodeConfigPanel />}

            {/* Action Bar on Canvas */}
            {nodes.length > 0 && (
              <div className="absolute top-4 right-4 z-20 flex items-center space-x-2 p-2 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-2xl">
                <button
                  onClick={() => handleSaveAndOpen(false)}
                  disabled={saving}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5"
                >
                  <Save className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Save Workflow</span>
                </button>

                <button
                  onClick={() => handleSaveAndOpen(true)}
                  disabled={saving}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:opacity-95 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-900/30 transition flex items-center space-x-1.5"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Save & Execute</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}

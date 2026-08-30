import { useState, useEffect } from 'react';
import { useWorkflowStore } from '../store/workflowStore';
import {
  X,
  Trash2,
  Cpu,
  Mail,
  MessageSquare,
  Send,
  Table,
  Sparkles,
  GitFork,
  Sliders,
  CheckCircle,
} from 'lucide-react';

export default function NodeConfigPanel() {
  const { selectedNode, updateNodeData, removeNode, setSelectedNode } = useWorkflowStore();

  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [action, setAction] = useState('');
  const [config, setConfig] = useState({});

  useEffect(() => {
    if (selectedNode) {
      setLabel(selectedNode.data?.label || '');
      setDescription(selectedNode.data?.description || '');
      setAction(selectedNode.data?.action || '');
      setConfig(selectedNode.data?.config || {});
    }
  }, [selectedNode]);

  if (!selectedNode) return null;

  const handleSave = () => {
    updateNodeData(selectedNode.id, {
      label,
      description,
      action,
      config,
    });
  };

  const handleConfigChange = (key, value) => {
    const updated = { ...config, [key]: value };
    setConfig(updated);
    updateNodeData(selectedNode.id, {
      label,
      description,
      action,
      config: updated,
    });
  };

  const nodeType = selectedNode.type || 'generic';

  return (
    <aside className="w-80 bg-slate-900/95 backdrop-blur-md border-l border-slate-800 p-4 flex flex-col h-full overflow-y-auto text-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold tracking-tight">Step Configuration</h3>
        </div>
        <button
          onClick={() => setSelectedNode(null)}
          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 py-4 space-y-4 text-xs">
        {/* Node Identifier & Agent Type */}
        <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Node ID:</span>
            <span className="font-mono text-[11px] text-indigo-300">{selectedNode.id}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Assigned Agent:</span>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {selectedNode.data?.agentType || 'Execution'} Agent
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Component Type:</span>
            <span className="font-semibold text-slate-200 uppercase">{nodeType}</span>
          </div>
        </div>

        {/* Basic Step Meta */}
        <div className="space-y-3">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Step Title / Label</label>
            <input
              type="text"
              value={label}
              onChange={(e) => {
                setLabel(e.target.value);
                updateNodeData(selectedNode.id, { label: e.target.value });
              }}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
              placeholder="e.g. Extract Invoice Data"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Step Description</label>
            <textarea
              value={description}
              rows={2}
              onChange={(e) => {
                setDescription(e.target.value);
                updateNodeData(selectedNode.id, { description: e.target.value });
              }}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 text-xs resize-none"
              placeholder="Explain the purpose of this execution step..."
            />
          </div>
        </div>

        {/* Specific Configuration based on Node Type */}
        <div className="pt-2 border-t border-slate-800 space-y-3">
          <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">Node Parameters</h4>

          {/* AI Node Config */}
          {nodeType === 'ai' && (
            <div className="space-y-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">System Prompt / Instructions</label>
                <textarea
                  value={config.prompt || ''}
                  rows={3}
                  onChange={(e) => handleConfigChange('prompt', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-purple-500 text-xs"
                  placeholder="e.g. Extract total amount, vendor name and item list into structured JSON..."
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Model Selection</label>
                <select
                  value={config.model || 'gemini-1.5-flash'}
                  onChange={(e) => handleConfigChange('model', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs"
                >
                  <option value="gemini-1.5-flash">Google Gemini 1.5 Flash</option>
                  <option value="claude-3-5-sonnet">Claude 3.5 Sonnet (OpenRouter)</option>
                  <option value="llama-3-70b">Llama 3 70B (OpenRouter)</option>
                </select>
              </div>
            </div>
          )}

          {/* Gmail Config */}
          {nodeType === 'gmail' && (
            <div className="space-y-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">To Email Recipient</label>
                <input
                  type="text"
                  value={config.to || ''}
                  onChange={(e) => handleConfigChange('to', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs"
                  placeholder="e.g. {{sender_email}} or finance@company.com"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Email Subject</label>
                <input
                  type="text"
                  value={config.subject || ''}
                  onChange={(e) => handleConfigChange('subject', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs"
                  placeholder="e.g. Invoice Approval Notification"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Email Body Content</label>
                <textarea
                  value={config.body || config.message || ''}
                  rows={3}
                  onChange={(e) => handleConfigChange('body', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs"
                  placeholder="e.g. Hello, please find invoice details for {{vendor}}..."
                />
              </div>
            </div>
          )}

          {/* Slack Config */}
          {nodeType === 'slack' && (
            <div className="space-y-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Target Slack Channel</label>
                <input
                  type="text"
                  value={config.channel || ''}
                  onChange={(e) => handleConfigChange('channel', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs"
                  placeholder="e.g. #ops-alerts or #finance"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Message Template</label>
                <textarea
                  value={config.message || ''}
                  rows={3}
                  onChange={(e) => handleConfigChange('message', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs"
                  placeholder="e.g. 🚨 New Invoice from {{vendor}} for ${{total_amount}}"
                />
              </div>
            </div>
          )}

          {/* Discord Config */}
          {nodeType === 'discord' && (
            <div className="space-y-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Discord Channel ID / Webhook</label>
                <input
                  type="text"
                  value={config.channelId || ''}
                  onChange={(e) => handleConfigChange('channelId', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs"
                  placeholder="e.g. support-escalations-channel"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Message Content</label>
                <textarea
                  value={config.content || config.message || ''}
                  rows={3}
                  onChange={(e) => handleConfigChange('content', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs"
                  placeholder="e.g. 📢 Operational telemetry incident alert"
                />
              </div>
            </div>
          )}

          {/* Google Sheets Config */}
          {nodeType === 'google-sheets' && (
            <div className="space-y-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Spreadsheet ID</label>
                <input
                  type="text"
                  value={config.spreadsheetId || ''}
                  onChange={(e) => handleConfigChange('spreadsheetId', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs"
                  placeholder="e.g. 1-Finance-General-Ledger-2026"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Target Sheet Range</label>
                <input
                  type="text"
                  value={config.range || 'Sheet1!A:F'}
                  onChange={(e) => handleConfigChange('range', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs"
                  placeholder="e.g. Invoices!A:F"
                />
              </div>
            </div>
          )}

          {/* Condition Config */}
          {nodeType === 'condition' && (
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Evaluation Rule / Expression</label>
              <input
                type="text"
                value={config.condition || ''}
                onChange={(e) => handleConfigChange('condition', e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs"
                placeholder="e.g. total_amount > 1000"
              />
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
        <button
          onClick={() => removeNode(selectedNode.id)}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-950/40 border border-rose-500/30 text-xs font-semibold transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete Node</span>
        </button>

        <button
          onClick={() => setSelectedNode(null)}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-900/30 transition"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Done</span>
        </button>
      </div>
    </aside>
  );
}

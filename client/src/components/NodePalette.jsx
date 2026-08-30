import {
  Play,
  Clock,
  Sparkles,
  FileText,
  Mail,
  MessageSquare,
  Send,
  Table,
  GitFork,
  Shuffle,
  Plus,
} from 'lucide-react';
import { useWorkflowStore } from '../store/workflowStore';

export default function NodePalette() {
  const { addNode, nodes } = useWorkflowStore();

  const nodeTemplates = [
    {
      category: 'Triggers',
      items: [
        {
          type: 'trigger',
          label: 'Manual / Webhook Trigger',
          description: 'Initiates workflow on webhook or user run',
          agentType: 'planner',
          action: 'start_workflow',
          icon: Play,
          color: 'text-indigo-400',
          bgColor: 'bg-indigo-950/60 border-indigo-500/40',
          config: { triggerType: 'manual' },
        },
        {
          type: 'trigger',
          label: 'Schedule Trigger',
          description: 'Runs periodically on cron/timer',
          agentType: 'planner',
          action: 'schedule_timer',
          icon: Clock,
          color: 'text-indigo-400',
          bgColor: 'bg-indigo-950/60 border-indigo-500/40',
          config: { intervalMinutes: 15 },
        },
      ],
    },
    {
      category: 'AI Agents',
      items: [
        {
          type: 'ai',
          label: 'AI Reasoning Agent',
          description: 'Synthesizes text, answers prompts, reasoning',
          agentType: 'execution',
          action: 'ai_process',
          icon: Sparkles,
          color: 'text-purple-400',
          bgColor: 'bg-purple-950/60 border-purple-500/40',
          config: { prompt: 'Analyze and extract details from payload' },
        },
        {
          type: 'ai',
          label: 'Invoice / Doc Parser',
          description: 'Extracts line items, totals, dates',
          agentType: 'execution',
          action: 'extract_invoice',
          icon: FileText,
          color: 'text-purple-400',
          bgColor: 'bg-purple-950/60 border-purple-500/40',
          config: { model: 'gemini-1.5-flash' },
        },
      ],
    },
    {
      category: 'Integrations',
      items: [
        {
          type: 'gmail',
          label: 'Gmail: Send / Read Mail',
          description: 'Dispatches or ingests Gmail messages',
          agentType: 'execution',
          action: 'send_email',
          icon: Mail,
          color: 'text-red-400',
          bgColor: 'bg-red-950/60 border-red-500/40',
          config: { to: '{{recipient}}', subject: 'Automated notification' },
        },
        {
          type: 'slack',
          label: 'Slack: Channel Message',
          description: 'Posts message or rich block to Slack',
          agentType: 'execution',
          action: 'post_message',
          icon: MessageSquare,
          color: 'text-amber-400',
          bgColor: 'bg-amber-950/60 border-amber-500/40',
          config: { channel: '#general', message: 'Agentflow step completed' },
        },
        {
          type: 'discord',
          label: 'Discord: Bot Alert',
          description: 'Sends channel message or embed',
          agentType: 'execution',
          action: 'post_message',
          icon: Send,
          color: 'text-blue-400',
          bgColor: 'bg-blue-950/60 border-blue-500/40',
          config: { channelId: 'ops-alerts', content: 'Alert dispatched' },
        },
        {
          type: 'google-sheets',
          label: 'Google Sheets: Append Row',
          description: 'Appends data record to spreadsheet',
          agentType: 'execution',
          action: 'append_row',
          icon: Table,
          color: 'text-emerald-400',
          bgColor: 'bg-emerald-950/60 border-emerald-500/40',
          config: { spreadsheetId: '1-General-Ledger', range: 'Sheet1!A:E' },
        },
      ],
    },
    {
      category: 'Logic & Transform',
      items: [
        {
          type: 'condition',
          label: 'Condition / Threshold',
          description: 'Branch based on value or expression',
          agentType: 'validation',
          action: 'evaluate_condition',
          icon: GitFork,
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-950/60 border-yellow-500/40',
          config: { condition: 'total_amount > 1000' },
        },
        {
          type: 'transform',
          label: 'Data Transform',
          description: 'Format, map, or filter object properties',
          agentType: 'execution',
          action: 'transform_data',
          icon: Shuffle,
          color: 'text-cyan-400',
          bgColor: 'bg-cyan-950/60 border-cyan-500/40',
          config: {},
        },
      ],
    },
  ];

  const handleAddNode = (template) => {
    const newId = `node_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const yPos = 100 + nodes.length * 90;

    const newNode = {
      id: newId,
      type: template.type,
      position: { x: 300, y: yPos },
      data: {
        label: template.label,
        description: template.description,
        agentType: template.agentType,
        action: template.action,
        config: Object.assign({}, template.config),
      },
    };

    addNode(newNode);
  };

  const onDragStart = (event, template) => {
    event.dataTransfer.setData('application/reactflow-template', JSON.stringify(template));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-64 bg-slate-900/90 border-r border-slate-800 p-4 flex flex-col h-full overflow-y-auto">
      <div className="mb-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Node Palette</h3>
        <p className="text-[11px] text-slate-500">Drag or click to add to canvas</p>
      </div>

      <div className="space-y-4">
        {nodeTemplates.map((cat, idx) => (
          <div key={idx}>
            <span className="text-[11px] font-semibold text-slate-400 tracking-wide uppercase">{cat.category}</span>
            <div className="mt-1.5 space-y-1.5">
              {cat.items.map((item, itemIdx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={itemIdx}
                    draggable
                    onDragStart={(e) => onDragStart(e, item)}
                    onClick={() => handleAddNode(item)}
                    className={`p-2.5 rounded-xl border ${item.bgColor} cursor-pointer transition-all hover:scale-[1.02] flex items-center justify-between group`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className={`p-1.5 rounded-lg bg-slate-900 border border-slate-800 ${item.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-200 truncate">{item.label}</p>
                        <p className="text-[10px] text-slate-400 truncate">{item.description}</p>
                      </div>
                    </div>
                    <Plus className="w-4 h-4 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

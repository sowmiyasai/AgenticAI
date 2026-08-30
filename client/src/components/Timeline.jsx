import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Cpu,
  RefreshCw,
  Shield,
  Radio,
} from 'lucide-react';

export default function Timeline({ logs = [], isLive = false, currentStep = null }) {
  const [filterLevel, setFilterLevel] = useState('all');
  const [expandedLogId, setExpandedLogId] = useState(null);

  const getAgentBadge = (agent) => {
    switch (agent) {
      case 'planner':
        return {
          label: 'Planner Agent',
          badgeClass: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
          dotClass: 'bg-violet-400',
        };
      case 'execution':
        return {
          label: 'Execution Agent',
          badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
          dotClass: 'bg-blue-400',
        };
      case 'validation':
        return {
          label: 'Validation Agent',
          badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          dotClass: 'bg-amber-400',
        };
      case 'recovery':
        return {
          label: 'Recovery Agent',
          badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          dotClass: 'bg-emerald-400',
        };
      case 'monitoring':
        return {
          label: 'Monitoring Agent',
          badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          dotClass: 'bg-cyan-400',
        };
      default:
        return {
          label: 'Agent Engine',
          badgeClass: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
          dotClass: 'bg-slate-400',
        };
    }
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-rose-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      default:
        return <Info className="w-4 h-4 text-cyan-400" />;
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (filterLevel === 'all') return true;
    return log.level === filterLevel;
  });

  return (
    <div className="flex flex-col h-full bg-slate-900/60 rounded-2xl border border-slate-800 p-4">
      {/* Timeline Controls Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
        <div className="flex items-center space-x-2">
          {isLive ? (
            <div className="flex items-center space-x-2 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Live Agent Stream</span>
            </div>
          ) : (
            <h3 className="text-sm font-bold text-white tracking-tight">Execution Audit Timeline</h3>
          )}
          <span className="text-xs text-slate-400">({logs.length} events)</span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1 text-xs">
          {['all', 'info', 'success', 'warning', 'error'].map((level) => (
            <button
              key={level}
              onClick={() => setFilterLevel(level)}
              className={`px-2.5 py-1 rounded-lg capitalize transition font-medium ${
                filterLevel === level
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Events Stream */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {filteredLogs.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-slate-500 text-xs text-center">
            <Cpu className="w-8 h-8 mb-2 opacity-30" />
            <p>No timeline events match the selected criteria.</p>
          </div>
        ) : (
          filteredLogs.map((log, index) => {
            const agentMeta = getAgentBadge(log.agent);
            const isExpanded = expandedLogId === (log._id || log.id || index);
            const hasMetadata = log.metadata && Object.keys(log.metadata).length > 0;

            return (
              <div
                key={log._id || log.id || index}
                className="relative pl-6 pb-2 border-l border-slate-800 last:border-l-transparent"
              >
                {/* Agent Node Marker */}
                <div
                  className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 border-slate-900 flex items-center justify-center ${agentMeta.dotClass}`}
                />

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2 min-w-0">
                      {getLevelIcon(log.level)}
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border uppercase ${agentMeta.badgeClass}`}>
                        {agentMeta.label}
                      </span>
                      {log.nodeId && (
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 truncate max-w-[120px]">
                          {log.nodeId}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 shrink-0">
                      {new Date(log.timestamp || Date.now()).toLocaleTimeString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 mt-2 font-medium leading-relaxed">{log.message}</p>

                  {/* Expandable JSON Metadata Inspector */}
                  {hasMetadata && (
                    <div className="mt-2 pt-2 border-t border-slate-800/60">
                      <button
                        onClick={() => setExpandedLogId(isExpanded ? null : (log._id || log.id || index))}
                        className="flex items-center space-x-1 text-[11px] text-slate-400 hover:text-indigo-400 transition"
                      >
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        <span>{isExpanded ? 'Hide Payload Details' : 'View Payload & Telemetry'}</span>
                      </button>

                      {isExpanded && (
                        <pre className="mt-2 p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[10px] text-slate-300 overflow-x-auto">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

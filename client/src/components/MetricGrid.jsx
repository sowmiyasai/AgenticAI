import { GitBranch, PlayCircle, CheckCircle, Activity, ArrowUpRight } from 'lucide-react';

export default function MetricGrid({ metrics = {} }) {
  const cards = [
    {
      title: 'Total Workflows',
      value: metrics.totalWorkflows || 0,
      subtext: `${metrics.activeWorkflows || 0} active in production`,
      icon: GitBranch,
      color: 'text-indigo-400',
      bgGradient: 'from-indigo-900/20 via-slate-900/40 to-slate-950',
      borderColor: 'border-indigo-500/30',
    },
    {
      title: 'Total Executions',
      value: metrics.totalExecutions || 0,
      subtext: `${metrics.runningExecutions || 0} currently running`,
      icon: PlayCircle,
      color: 'text-cyan-400',
      bgGradient: 'from-cyan-900/20 via-slate-900/40 to-slate-950',
      borderColor: 'border-cyan-500/30',
    },
    {
      title: 'Success Rate',
      value: `${metrics.successRate !== undefined ? metrics.successRate : 100}%`,
      subtext: `${metrics.completedExecutions || 0} passed / ${metrics.failedExecutions || 0} escalated`,
      icon: CheckCircle,
      color: 'text-emerald-400',
      bgGradient: 'from-emerald-900/20 via-slate-900/40 to-slate-950',
      borderColor: 'border-emerald-500/30',
    },
    {
      title: 'Agent Ops Fleet',
      value: '5 Active',
      subtext: 'Planner, Exec, Valid, Recov, Mon',
      icon: Activity,
      color: 'text-violet-400',
      bgGradient: 'from-violet-900/20 via-slate-900/40 to-slate-950',
      borderColor: 'border-violet-500/30',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`p-5 rounded-2xl bg-gradient-to-b ${card.bgGradient} border ${card.borderColor} shadow-lg transition-all hover:scale-[1.01]`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{card.title}</span>
              <div className={`p-2 rounded-xl bg-slate-900/80 border border-slate-800 ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black text-white tracking-tight">{card.value}</span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center">
              <span>{card.subtext}</span>
            </p>
          </div>
        );
      })}
    </div>
  );
}

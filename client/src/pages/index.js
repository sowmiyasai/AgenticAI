import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthStore } from '../store/authStore';
import {
  Sparkles,
  Cpu,
  ArrowRight,
  Shield,
  Zap,
  GitBranch,
  Bot,
  Activity,
  Layers,
  CheckCircle,
  Database,
  Terminal,
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Navigation Header */}
      <header className="h-20 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-40 px-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Agentflow<span className="text-cyan-400 font-black">_AI</span>
          </span>
        </div>

        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <Link href="/dashboard" passHref>
              <a className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-900/30 transition flex items-center space-x-2">
                <span>Operator Console</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </Link>
          ) : (
            <>
              <Link href="/login" passHref>
                <a className="text-sm font-medium text-slate-300 hover:text-white px-3 py-2 transition">
                  Sign In
                </a>
              </Link>
              <Link href="/register" passHref>
                <a className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-900/30 transition flex items-center space-x-1.5">
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 md:py-24 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-8 animate-pulse-slow">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Next-Gen Agentic Operations Automation</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-tight mb-6">
          Turn Plain English into{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-purple-400">
            Autonomous Workflows
          </span>
        </h1>

        <p className="text-base sm:text-xl text-slate-400 max-w-3xl mb-10 leading-relaxed">
          Describe an automation in natural language. Watch it materialize into an interactive visual graph, orchestrated
          by a cooperative chain of 5 specialized AI agents with live telemetry, OAuth tools, and self-healing execution.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link href="/workflows/builder" passHref>
            <a className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:opacity-95 text-white font-bold text-base shadow-xl shadow-indigo-900/40 transition-all flex items-center justify-center space-x-2.5">
              <Sparkles className="w-5 h-5 text-cyan-200" />
              <span>Generate with AI Prompt</span>
            </a>
          </Link>
          <Link href="/dashboard" passHref>
            <a className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold text-base transition flex items-center justify-center space-x-2">
              <span>Open Operator Console</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </Link>
        </div>

        {/* Multi-Agent Chain Visualization Card */}
        <div className="w-full mt-16 p-6 rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 shadow-2xl text-left">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
            <div className="flex items-center space-x-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Multi-Agent Cooperation Chain</h3>
            </div>
            <span className="text-xs text-emerald-400 font-mono flex items-center">
              <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-ping" />
              LangGraph Orchestrator Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-violet-500/30">
              <div className="flex items-center space-x-2 text-violet-400 mb-2">
                <Bot className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">Planner Agent</span>
              </div>
              <p className="text-xs text-slate-400">Topological DAG sort, cycle checks, confidence scoring.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-blue-500/30">
              <div className="flex items-center space-x-2 text-blue-400 mb-2">
                <Zap className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">Execution Agent</span>
              </div>
              <p className="text-xs text-slate-400">Dispatches node actions across Gmail, Slack, Discord & Sheets.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/30">
              <div className="flex items-center space-x-2 text-amber-400 mb-2">
                <Shield className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">Validation Agent</span>
              </div>
              <p className="text-xs text-slate-400">Verifies input payloads, schemas, and threshold conditions.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/30">
              <div className="flex items-center space-x-2 text-emerald-400 mb-2">
                <Activity className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">Recovery Agent</span>
              </div>
              <p className="text-xs text-slate-400">Classifies faults, exponential backoff retries & escalations.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-cyan-500/30">
              <div className="flex items-center space-x-2 text-cyan-400 mb-2">
                <Terminal className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">Monitoring Agent</span>
              </div>
              <p className="text-xs text-slate-400">Emits live Socket.IO audit streams and telemetry logs.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 px-6 text-center text-xs text-slate-600">
        Agentflow_AI Platform • Enterprise Multi-Agent Orchestration • 2026
      </footer>
    </div>
  );
}

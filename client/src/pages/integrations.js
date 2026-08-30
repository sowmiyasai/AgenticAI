import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../components/ProtectedRoute';
import AppShell from '../components/AppShell';
import api from '../services/api';
import {
  Mail,
  MessageSquare,
  Send,
  Table,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Shield,
  Key,
  Lock,
  Sparkles,
} from 'lucide-react';

export default function IntegrationsPage() {
  const router = useRouter();
  const [integrationsStatus, setIntegrationsStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [connectingProvider, setConnectingProvider] = useState(null);
  const [manualModalProvider, setManualModalProvider] = useState(null);
  const [manualToken, setManualToken] = useState('');
  const [manualEmail, setManualEmail] = useState('');

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await api.get('/integrations/status');
      setIntegrationsStatus(res.data.data || {});
    } catch (e) {
      console.error('Failed to load integrations status:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    // Check if redirected with mock or status
    if (router.query.status === 'success') {
      fetchStatus();
    }
  }, [router.query]);

  const handleOAuthConnect = async (provider) => {
    setConnectingProvider(provider);
    try {
      const res = await api.get(`/integrations/oauth/${provider}/start`);
      if (res.data.authUrl) {
        window.location.href = res.data.authUrl;
      }
    } catch (err) {
      alert(err.response?.data?.error || `Failed to initiate ${provider} OAuth`);
      setConnectingProvider(null);
    }
  };

  const handleSaveManual = async (provider) => {
    if (!manualToken.trim()) {
      alert('Please enter an API token or webhook URL');
      return;
    }

    try {
      await api.post('/integrations', {
        provider,
        credentials: { accessToken: manualToken.trim(), isManual: true },
        accountEmail: manualEmail.trim() || 'operator@agentflow.io',
        accountName: `${provider} (Custom Key)`,
      });
      alert(`${provider} credentials saved securely!`);
      setManualModalProvider(null);
      setManualToken('');
      setManualEmail('');
      await fetchStatus();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save credentials');
    }
  };

  const providers = [
    {
      id: 'gmail',
      name: 'Gmail API',
      description: 'Send alerts, draft replies, and poll support emails automatically.',
      icon: Mail,
      color: 'text-red-400',
      bgColor: 'bg-red-950/20 border-red-500/30',
      scopes: ['gmail.send', 'gmail.readonly'],
    },
    {
      id: 'slack',
      name: 'Slack Workspace',
      description: 'Post real-time channel messages, error escalations, and incident alerts.',
      icon: MessageSquare,
      color: 'text-amber-400',
      bgColor: 'bg-amber-950/20 border-amber-500/30',
      scopes: ['chat:write', 'channels:read', 'incoming-webhook'],
    },
    {
      id: 'discord',
      name: 'Discord Bot & Webhooks',
      description: 'Trigger Discord bot messages, war-room updates, and operational pings.',
      icon: Send,
      color: 'text-blue-400',
      bgColor: 'bg-blue-950/20 border-blue-500/30',
      scopes: ['bot', 'webhook.incoming', 'identify'],
    },
    {
      id: 'google-sheets',
      name: 'Google Sheets',
      description: 'Append automated audit logs, invoices, and SLA transaction rows.',
      icon: Table,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-950/20 border-emerald-500/30',
      scopes: ['spreadsheets', 'drive.readonly'],
    },
  ];

  return (
    <ProtectedRoute>
      <AppShell title="Third-Party Integrations">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Connected Tools & APIs</h1>
            <p className="text-xs text-slate-400">
              OAuth 2.0 and API credentials are encrypted at rest with AES-256-GCM
            </p>
          </div>
          <button
            onClick={fetchStatus}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition"
            title="Refresh Integrations"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Security Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/30 mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">Application-Level Credential Encryption</h3>
              <p className="text-[11px] text-slate-400">
                AES-256-GCM cipher encryption active with CREDENTIAL_ENCRYPTION_KEY.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
            Zero Plaintext Leakage
          </span>
        </div>

        {/* Integrations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {providers.map((p) => {
            const Icon = p.icon;
            const statusInfo = integrationsStatus[p.id] || { isConnected: false, status: 'DISCONNECTED' };
            const isConnected = statusInfo.isConnected;

            return (
              <div
                key={p.id}
                className={`p-5 rounded-2xl border ${p.bgColor} shadow-xl flex flex-col justify-between backdrop-blur-md`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2.5 rounded-xl bg-slate-900 border border-slate-800 ${p.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">{p.name}</h3>
                        <p className="text-[10px] text-slate-400">
                          {statusInfo.accountEmail || statusInfo.accountName || 'Not configured'}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase border flex items-center space-x-1 ${
                        isConnected
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full mr-1 ${isConnected ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                      <span>{isConnected ? (statusInfo.isMock ? 'SIMULATED / READY' : 'CONNECTED') : 'DISCONNECTED'}</span>
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mb-4 leading-relaxed">{p.description}</p>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Required Scopes:</span>
                    <div className="flex flex-wrap gap-1">
                      {p.scopes.map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 text-[9px] font-mono rounded bg-slate-900 border border-slate-800 text-slate-400"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setManualModalProvider(p.id);
                      setManualEmail(statusInfo.accountEmail || '');
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition flex items-center space-x-1"
                  >
                    <Key className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Set API Key</span>
                  </button>

                  <button
                    onClick={() => handleOAuthConnect(p.id)}
                    disabled={connectingProvider === p.id}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                      isConnected
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-900/30'
                    }`}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{isConnected ? 'Reconnect OAuth' : 'Connect via OAuth'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Manual Key Modal */}
        {manualModalProvider && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Key className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white capitalize">
                    {manualModalProvider} API Credentials
                  </h3>
                </div>
                <button
                  onClick={() => setManualModalProvider(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Account Name / Email Identifier
                </label>
                <input
                  type="text"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  placeholder="e.g. operator@company.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  API Key / OAuth Access Token / Webhook URL
                </label>
                <textarea
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  rows={3}
                  placeholder="Paste access token or webhook URL..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  onClick={() => setManualModalProvider(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSaveManual(manualModalProvider)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold"
                >
                  Save & Encrypt
                </button>
              </div>
            </div>
          </div>
        )}
      </AppShell>
    </ProtectedRoute>
  );
}

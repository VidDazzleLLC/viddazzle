import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Activity, DollarSign, Zap, TrendingUp, Database } from 'lucide-react';

export default function UsageDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const checkUser = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);
        await fetchUsageStats();
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  const fetchUsageStats = async () => {
    try {
      const response = await fetch('/api/usage');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching usage stats:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUsageStats();
    setRefreshing(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
        <div style={{ color: 'white' }}>Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(Math.round(num));
  };

  const formatCost = (cost) => {
    return `$${cost.toFixed(4)}`;
  };

  return (
    <>
      <Head>
        <title>Usage Dashboard - Autopilot</title>
      </Head>
      <div style={{ minHeight: '100vh', background: 'linear-gradient(to br, #0f172a, #1e293b)', color: 'white' }}>
        {/* Header */}
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Autopilot</h1>
            <nav style={{ display: 'flex', gap: '15px' }}>
              <Link href="/app" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>Dashboard</Link>
              <Link href="/usage" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>Usage</Link>
            </nav>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontSize: '14px', opacity: 0.7 }}>{user.email}</span>
            <button onClick={handleSignOut} style={{ background: '#ef4444', padding: '8px 16px', borderRadius: '6px', border: 'none', color: 'white', cursor: 'pointer', fontSize: '14px' }}>
              Sign Out
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <div>
              <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '10px' }}>Usage & Analytics</h2>
              <p style={{ opacity: 0.7 }}>Track your API usage, costs, and performance metrics</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              style={{
                background: 'rgba(59, 130, 246, 0.2)',
                border: '1px solid rgba(59, 130, 246, 0.5)',
                padding: '10px 20px',
                borderRadius: '8px',
                color: 'white',
                cursor: refreshing ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Activity size={16} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {/* Data Source Warning */}
          {stats?.source === 'memory' && (
            <div style={{ background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)', padding: '15px', borderRadius: '10px', marginBottom: '20px', display: 'flex', gap: '10px' }}>
              <Database size={20} style={{ color: '#fbbf24', marginTop: '2px' }} />
              <div>
                <strong style={{ color: '#fbbf24' }}>In-Memory Storage Active</strong>
                <p style={{ fontSize: '14px', opacity: 0.9, marginTop: '5px' }}>
                  {stats.note || 'Database unavailable. Usage data is stored in memory and will be lost on restart.'}
                </p>
              </div>
            </div>
          )}

          {!stats ? (
            <div style={{ textAlign: 'center', padding: '60px', opacity: 0.5 }}>
              <Activity size={48} style={{ margin: '0 auto 20px' }} />
              <p>Loading usage statistics...</p>
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                {/* Last 24h */}
                <StatCard
                  icon={<Zap size={24} />}
                  title="Last 24 Hours"
                  metrics={stats.last_24h}
                  color="#3b82f6"
                />

                {/* Last 7 Days */}
                <StatCard
                  icon={<TrendingUp size={24} />}
                  title="Last 7 Days"
                  metrics={stats.last_7d}
                  color="#8b5cf6"
                />

                {/* Last 30 Days */}
                <StatCard
                  icon={<Activity size={24} />}
                  title="Last 30 Days"
                  metrics={stats.last_30d}
                  color="#ec4899"
                />

                {/* Total */}
                <StatCard
                  icon={<DollarSign size={24} />}
                  title="All Time"
                  metrics={stats.total}
                  color="#10b981"
                />
              </div>

              {/* Recent Requests */}
              {stats.recent_requests && stats.recent_requests.length > 0 && (
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px' }}>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '20px' }}>Recent API Calls</h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', opacity: 0.7 }}>Time</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', opacity: 0.7 }}>Endpoint</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', opacity: 0.7 }}>Model</th>
                          <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', opacity: 0.7 }}>Tokens</th>
                          <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', opacity: 0.7 }}>Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recent_requests.map((req, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '12px', fontSize: '14px' }}>
                              {new Date(req.created_at).toLocaleString()}
                            </td>
                            <td style={{ padding: '12px', fontSize: '14px' }}>{req.endpoint}</td>
                            <td style={{ padding: '12px', fontSize: '14px', opacity: 0.7 }}>{req.model}</td>
                            <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px' }}>
                              {formatNumber(req.tokens_used)}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px', color: '#10b981' }}>
                              {formatCost(req.cost)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function StatCard({ icon, title, metrics, color }) {
  const formatNumber = (num) => new Intl.NumberFormat().format(Math.round(num));
  const formatCost = (cost) => `$${cost.toFixed(4)}`;

  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      borderRadius: '12px',
      padding: '20px',
      border: `1px solid ${color}30`
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
        <div style={{ color }}>{icon}</div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{title}</h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div>
          <div style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '3px' }}>Requests</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color }}>{formatNumber(metrics.requests)}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div>
            <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>Tokens</div>
            <div style={{ fontSize: '1rem', fontWeight: '600' }}>{formatNumber(metrics.tokens)}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>Cost</div>
            <div style={{ fontSize: '1rem', fontWeight: '600', color: '#10b981' }}>{formatCost(metrics.cost)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

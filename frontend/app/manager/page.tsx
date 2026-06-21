'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
  RadialBarChart, RadialBar,
} from 'recharts';
import { analyticsAPI } from '@/lib/api';
import FloatingCard from '@/components/animations/FloatingCard';
import CounterAnimation from '@/components/animations/CounterAnimation';
import StaggeredList from '@/components/animations/StaggeredList';
import {
  BarChart3, PieChart as PieIcon, TrendingUp, Brain,
  Sparkles, Loader2, RefreshCw, Clock, Ticket, CheckCircle
} from 'lucide-react';

const COLORS = ['#6366f1', '#ec4899', '#22c55e', '#f59e0b', '#3b82f6', '#8b5cf6'];
const STATUS_COLORS: Record<string, string> = {
  'Open': '#f59e0b',
  'In Progress': '#3b82f6',
  'Resolved': '#22c55e',
  'Closed': '#64748b',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div style={{
      background: 'rgba(15, 18, 35, 0.95)',
      border: '1px solid rgba(99, 102, 241, 0.3)',
      borderRadius: 8,
      padding: '10px 14px',
      fontSize: 13,
      backdropFilter: 'blur(20px)',
    }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color, fontSize: 12 }}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
};

export default function ManagerDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState('');
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await analyticsAPI.getSummary();
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const generateAiSummary = async () => {
    setAiSummaryLoading(true);
    try {
      const res = await analyticsAPI.getWeeklySummary();
      setAiSummary(res.data.summary);
    } catch (e) {
      setAiSummary('Unable to generate summary at this time.');
    } finally {
      setAiSummaryLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 32 }}>Manager Dashboard</h1>
        <div className="stats-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton" style={{ height: 120 }} />
          ))}
        </div>
        <div className="charts-grid" style={{ marginTop: 20 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton" style={{ height: 300 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Manager Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Real-time analytics and AI-powered insights
          </p>
        </div>
        <motion.button
          className="btn btn-secondary"
          onClick={fetchData}
          whileHover={{ rotate: 180 }}
          transition={{ duration: 0.4 }}
        >
          <RefreshCw size={16} /> Refresh
        </motion.button>
      </div>

      {/* Stats Cards */}
      <StaggeredList className="stats-grid">
        <FloatingCard className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.12)' }}>
            <Ticket size={20} color="var(--accent-primary)" />
          </div>
          <div className="stat-value">
            <CounterAnimation target={data?.total_tickets || 0} />
          </div>
          <div className="stat-label">Total Tickets</div>
        </FloatingCard>
        <FloatingCard className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--status-open-bg)' }}>
            <Clock size={20} color="var(--status-open)" />
          </div>
          <div className="stat-value">
            <CounterAnimation target={data?.open_tickets || 0} />
          </div>
          <div className="stat-label">Open Tickets</div>
        </FloatingCard>
        <FloatingCard className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--status-resolved-bg)' }}>
            <CheckCircle size={20} color="var(--status-resolved)" />
          </div>
          <div className="stat-value">
            <CounterAnimation target={data?.resolved_tickets || 0} />
          </div>
          <div className="stat-label">Resolved</div>
        </FloatingCard>
        <FloatingCard className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.12)' }}>
            <TrendingUp size={20} color="var(--accent-primary)" />
          </div>
          <div className="stat-value">
            <CounterAnimation target={data?.avg_resolution_hours || 0} suffix="h" decimals={1} />
          </div>
          <div className="stat-label">Avg Resolution</div>
        </FloatingCard>
      </StaggeredList>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Tickets by Department (Bar) */}
        <FloatingCard className="chart-card" intensity={3}>
          <h3><BarChart3 size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />Tickets by Department</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data?.by_department || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
              <XAxis dataKey="department" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Tickets" radius={[6, 6, 0, 0]}>
                {(data?.by_department || []).map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </FloatingCard>

        {/* Tickets by Status (Donut) */}
        <FloatingCard className="chart-card" intensity={3}>
          <h3><PieIcon size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />Tickets by Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data?.by_status || []}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                label={({ payload }: any) => `${payload?.status}: ${payload?.count}`}
                labelLine={{ stroke: '#64748b' }}
              >
                {(data?.by_status || []).map((entry: any, i: number) => (
                  <Cell key={i} fill={STATUS_COLORS[entry.status] || COLORS[i]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </FloatingCard>

        {/* Ticket Trends (Line) */}
        <FloatingCard className="chart-card" intensity={3}>
          <h3><TrendingUp size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />Ticket Trends (7 Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data?.trends || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="count"
                name="Tickets"
                stroke="#818cf8"
                strokeWidth={2.5}
                dot={{ fill: '#818cf8', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#818cf8', strokeWidth: 2, fill: '#fff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </FloatingCard>

        {/* AI Accuracy Gauge */}
        <FloatingCard className="chart-card" intensity={3}>
          <h3><Brain size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />AI Categorization Accuracy</h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 250 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 160,
                height: 160,
                borderRadius: '50%',
                background: `conic-gradient(
                  var(--accent-primary) 0deg ${(data?.ai_accuracy_pct || 0) * 3.6}deg,
                  rgba(99, 102, 241, 0.1) ${(data?.ai_accuracy_pct || 0) * 3.6}deg 360deg
                )`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <div style={{
                  width: 130,
                  height: 130,
                  borderRadius: '50%',
                  background: 'var(--bg-card)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                }}>
                  <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent-primary)' }}>
                    <CounterAnimation target={data?.ai_accuracy_pct || 0} suffix="%" />
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Accuracy</span>
                </div>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                % of tickets where AI category matched agent&apos;s final choice
              </p>
            </div>
          </div>
        </FloatingCard>

        {/* Department Load (Stacked Bar) */}
        <FloatingCard className="chart-card" intensity={3}>
          <h3><BarChart3 size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />Department Load</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={Object.entries(data?.department_load || {}).map(([dept, statuses]) => ({
                department: dept,
                ...(statuses as Record<string, number>),
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
              <XAxis dataKey="department" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="Open" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} name="Open" />
              <Bar dataKey="In Progress" stackId="a" fill="#3b82f6" name="In Progress" />
              <Bar dataKey="Resolved" stackId="a" fill="#22c55e" radius={[6, 6, 0, 0]} name="Resolved" />
            </BarChart>
          </ResponsiveContainer>
        </FloatingCard>

        {/* AI Weekly Summary */}
        <FloatingCard className="chart-card" intensity={3}>
          <h3><Sparkles size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />AI Weekly Summary</h3>
          {!aiSummary && !aiSummaryLoading && (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
                Generate an AI-powered weekly report of ticket trends and insights
              </p>
              <motion.button
                className="btn btn-primary"
                onClick={generateAiSummary}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Sparkles size={16} /> Generate Summary
              </motion.button>
            </div>
          )}
          {aiSummaryLoading && (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <Loader2 size={24} className="loading-spinner" style={{ margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                AI is analyzing ticket data...
              </p>
            </div>
          )}
          {aiSummary && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="ai-panel"
              style={{ marginTop: 8 }}
            >
              <div className="ai-panel-body" style={{ whiteSpace: 'pre-wrap' }}>
                {aiSummary}
              </div>
              <button
                className="btn btn-sm btn-ghost"
                onClick={generateAiSummary}
                style={{ marginTop: 12 }}
              >
                <RefreshCw size={14} /> Regenerate
              </button>
            </motion.div>
          )}
        </FloatingCard>
      </div>
    </div>
  );
}

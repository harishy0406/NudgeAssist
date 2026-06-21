'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ticketsAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import FloatingCard from '@/components/animations/FloatingCard';
import StaggeredList from '@/components/animations/StaggeredList';
import CounterAnimation from '@/components/animations/CounterAnimation';
import { Ticket, PlusCircle, Clock, CheckCircle, AlertCircle, Filter } from 'lucide-react';

interface TicketData {
  id: string;
  title: string;
  description: string;
  category: string;
  urgency: string;
  status: string;
  created_at: string;
  ai_confidence: number | null;
}

const statusBadgeClass: Record<string, string> = {
  'Open': 'badge badge-open',
  'In Progress': 'badge badge-in-progress',
  'Resolved': 'badge badge-resolved',
  'Closed': 'badge badge-closed',
};

const urgencyBadgeClass: Record<string, string> = {
  'Low': 'badge badge-low',
  'Medium': 'badge badge-medium',
  'High': 'badge badge-high',
};

const categoryBadgeClass: Record<string, string> = {
  'IT': 'badge badge-it',
  'HR': 'badge badge-hr',
  'Finance': 'badge badge-finance',
  'Admin': 'badge badge-admin',
};

export default function TicketsPage() {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchTickets();
  }, [filter]);

  const fetchTickets = async () => {
    try {
      const params: any = { page_size: 50 };
      if (filter) params.status = filter;
      const res = await ticketsAPI.list(params);
      setTickets(res.data.tickets);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'Open').length,
    inProgress: tickets.filter(t => t.status === 'In Progress').length,
    resolved: tickets.filter(t => ['Resolved', 'Closed'].includes(t.status)).length,
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>My Tickets</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Track and manage your support requests</p>
        </div>
        <motion.button
          className="btn btn-primary"
          onClick={() => router.push('/tickets/new')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <PlusCircle size={18} />
          New Ticket
        </motion.button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <FloatingCard className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.12)' }}>
            <Ticket size={20} color="var(--accent-primary)" />
          </div>
          <div className="stat-value"><CounterAnimation target={stats.total} /></div>
          <div className="stat-label">Total Tickets</div>
        </FloatingCard>
        <FloatingCard className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--status-open-bg)' }}>
            <AlertCircle size={20} color="var(--status-open)" />
          </div>
          <div className="stat-value"><CounterAnimation target={stats.open} /></div>
          <div className="stat-label">Open</div>
        </FloatingCard>
        <FloatingCard className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--status-progress-bg)' }}>
            <Clock size={20} color="var(--status-progress)" />
          </div>
          <div className="stat-value"><CounterAnimation target={stats.inProgress} /></div>
          <div className="stat-label">In Progress</div>
        </FloatingCard>
        <FloatingCard className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--status-resolved-bg)' }}>
            <CheckCircle size={20} color="var(--status-resolved)" />
          </div>
          <div className="stat-value"><CounterAnimation target={stats.resolved} /></div>
          <div className="stat-label">Resolved</div>
        </FloatingCard>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <Filter size={16} style={{ color: 'var(--text-muted)', alignSelf: 'center' }} />
        {['', 'Open', 'In Progress', 'Resolved', 'Closed'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
          >
            {f || 'All'}
          </button>
        ))}
      </div>

      {/* Ticket List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ height: 80 }} />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="glass-card-static" style={{ padding: 60, textAlign: 'center' }}>
          <Ticket size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No tickets yet</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
            Create your first support ticket to get started
          </p>
          <button
            className="btn btn-primary"
            onClick={() => router.push('/tickets/new')}
          >
            <PlusCircle size={18} /> Create Ticket
          </button>
        </div>
      ) : (
        <StaggeredList className="ticket-list">
          {tickets.map((ticket) => (
            <FloatingCard
              key={ticket.id}
              className="ticket-item"
              intensity={5}
              onClick={() => {}} // TODO: ticket detail modal
            >
              <div className="ticket-info">
                <div className="ticket-title">{ticket.title}</div>
                <div className="ticket-meta">
                  <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                  {ticket.ai_confidence && (
                    <span className="confidence-meter">
                      <span className="confidence-text">
                        AI {Math.round(ticket.ai_confidence * 100)}%
                      </span>
                    </span>
                  )}
                </div>
              </div>
              <div className="ticket-badges">
                <span className={categoryBadgeClass[ticket.category] || 'badge'}>{ticket.category}</span>
                <span className={urgencyBadgeClass[ticket.urgency] || 'badge'}>{ticket.urgency}</span>
                <span className={statusBadgeClass[ticket.status] || 'badge'}>{ticket.status}</span>
              </div>
            </FloatingCard>
          ))}
        </StaggeredList>
      )}
    </div>
  );
}

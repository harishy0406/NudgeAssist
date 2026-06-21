'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ticketsAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import FloatingCard from '@/components/animations/FloatingCard';
import StaggeredList from '@/components/animations/StaggeredList';
import CounterAnimation from '@/components/animations/CounterAnimation';
import anime from 'animejs';
import {
  Inbox, Sparkles, Send, Check, X, Copy,
  Clock, AlertCircle, CheckCircle, ArrowRight, Loader2, MessageSquare,
  ChevronDown, ChevronUp
} from 'lucide-react';

interface TicketData {
  id: string;
  title: string;
  description: string;
  category: string;
  urgency: string;
  status: string;
  created_by: string;
  created_by_name: string;
  assigned_to: string | null;
  department: string;
  ai_confidence: number | null;
  created_at: string;
}

const statusBadge: Record<string, string> = {
  'Open': 'badge badge-open',
  'In Progress': 'badge badge-in-progress',
  'Resolved': 'badge badge-resolved',
  'Closed': 'badge badge-closed',
};

const urgencyBadge: Record<string, string> = {
  'Low': 'badge badge-low',
  'Medium': 'badge badge-medium',
  'High': 'badge badge-high',
};

const VALID_TRANSITIONS: Record<string, string[]> = {
  'Open': ['In Progress'],
  'In Progress': ['Resolved', 'Open'],
  'Resolved': ['Closed', 'In Progress'],
  'Closed': [],
};

export default function AgentPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
  const [filter, setFilter] = useState('');
  const [draftResponse, setDraftResponse] = useState('');
  const [draftLoading, setDraftLoading] = useState(false);
  const [statusNote, setStatusNote] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [updating, setUpdating] = useState(false);
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);

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

  const loadDraftResponse = async (ticket: TicketData) => {
    setDraftLoading(true);
    setDraftResponse('');
    try {
      const res = await ticketsAPI.getDraftResponse(ticket.id);
      // Typewriter effect
      const text = res.data.draft;
      let i = 0;
      const interval = setInterval(() => {
        if (i <= text.length) {
          setDraftResponse(text.slice(0, i));
          i++;
        } else {
          clearInterval(interval);
        }
      }, 15);
    } catch (e) {
      setDraftResponse('Unable to generate AI draft at this time.');
    } finally {
      setDraftLoading(false);
    }
  };

  const handleStatusUpdate = async (ticketId: string, newStatus: string) => {
    setUpdating(true);
    try {
      await ticketsAPI.updateStatus(ticketId, {
        status: newStatus,
        note: statusNote,
        resolution_note: newStatus === 'Resolved' ? resolutionNote : undefined,
      });

      // Success animation
      anime({
        targets: `.ticket-${ticketId}`,
        scale: [1, 1.03, 1],
        duration: 400,
        easing: 'easeInOutSine',
      });

      setStatusNote('');
      setResolutionNote('');
      fetchTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Failed to update status');
    } finally {
      setUpdating(false);
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
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>
          {user?.role === 'manager' ? 'All Tickets' : 'Agent Queue'}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          {user?.department ? `${user.department} Department` : 'All departments'}
          {' • '}Manage and resolve support tickets
        </p>
      </div>

      {/* Stats Row */}
      <div className="stats-grid">
        <FloatingCard className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.12)' }}>
            <Inbox size={20} color="var(--accent-primary)" />
          </div>
          <div className="stat-value"><CounterAnimation target={stats.total} /></div>
          <div className="stat-label">Queue Total</div>
        </FloatingCard>
        <FloatingCard className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--status-open-bg)' }}>
            <AlertCircle size={20} color="var(--status-open)" />
          </div>
          <div className="stat-value"><CounterAnimation target={stats.open} /></div>
          <div className="stat-label">Awaiting</div>
        </FloatingCard>
        <FloatingCard className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--status-progress-bg)' }}>
            <Clock size={20} color="var(--status-progress)" />
          </div>
          <div className="stat-value"><CounterAnimation target={stats.inProgress} /></div>
          <div className="stat-label">Working On</div>
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

      {/* Ticket Queue */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton" style={{ height: 90 }} />
          ))}
        </div>
      ) : (
        <StaggeredList className="ticket-list">
          {tickets.map((ticket) => {
            const isExpanded = expandedTicketId === ticket.id;
            const transitions = VALID_TRANSITIONS[ticket.status] || [];

            return (
              <div key={ticket.id} className={`ticket-${ticket.id}`}>
                <FloatingCard
                  className="ticket-item"
                  intensity={4}
                  onClick={() => {
                    setExpandedTicketId(isExpanded ? null : ticket.id);
                    if (!isExpanded) {
                      setSelectedTicket(ticket);
                      setDraftResponse('');
                    }
                  }}
                >
                  <div className="ticket-info">
                    <div className="ticket-title">{ticket.title}</div>
                    <div className="ticket-meta">
                      <span>By {ticket.created_by_name || 'Unknown'}</span>
                      <span>•</span>
                      <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="ticket-badges">
                    <span className={`badge badge-${ticket.category?.toLowerCase()}`}>{ticket.category}</span>
                    <span className={urgencyBadge[ticket.urgency] || 'badge'}>{ticket.urgency}</span>
                    <span className={statusBadge[ticket.status] || 'badge'}>{ticket.status}</span>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </FloatingCard>

                {/* Expanded Detail Panel */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="glass-card-static"
                      style={{
                        margin: '0 0 12px 0',
                        padding: 24,
                        borderTop: 'none',
                        borderTopLeftRadius: 0,
                        borderTopRightRadius: 0,
                      }}
                    >
                      {/* Description */}
                      <div style={{ marginBottom: 20 }}>
                        <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
                          Description
                        </h4>
                        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                          {ticket.description}
                        </p>
                      </div>

                      {/* Status Actions */}
                      {transitions.length > 0 && (
                        <div style={{ marginBottom: 20 }}>
                          <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
                            Update Status
                          </h4>
                          <div className="input-group" style={{ marginBottom: 12 }}>
                            <input
                              type="text"
                              className="input-field"
                              placeholder="Add a note (optional)"
                              value={statusNote}
                              onChange={(e) => setStatusNote(e.target.value)}
                            />
                          </div>
                          {ticket.status === 'In Progress' && (
                            <div className="input-group" style={{ marginBottom: 12 }}>
                              <textarea
                                className="input-field"
                                placeholder="Resolution note (for marking as Resolved)"
                                value={resolutionNote}
                                onChange={(e) => setResolutionNote(e.target.value)}
                                style={{ minHeight: 60 }}
                              />
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: 8 }}>
                            {transitions.map(nextStatus => (
                              <motion.button
                                key={nextStatus}
                                className={`btn btn-sm ${nextStatus === 'Resolved' ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => handleStatusUpdate(ticket.id, nextStatus)}
                                disabled={updating}
                                whileTap={{ scale: 0.95 }}
                              >
                                <ArrowRight size={14} />
                                {nextStatus}
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* AI Draft Response */}
                      <div className="ai-panel">
                        <div className="ai-panel-header">
                          <Sparkles size={16} /> AI Copilot — Draft Response
                        </div>
                        {!draftResponse && !draftLoading && (
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => loadDraftResponse(ticket)}
                          >
                            <MessageSquare size={14} /> Generate AI Draft
                          </button>
                        )}
                        {draftLoading && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0' }}>
                            <Loader2 size={16} className="loading-spinner" />
                            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                              Generating draft response...
                            </span>
                          </div>
                        )}
                        {draftResponse && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          >
                            <div style={{
                              padding: 16,
                              background: 'rgba(99, 102, 241, 0.06)',
                              borderRadius: 'var(--radius-md)',
                              fontSize: 14,
                              lineHeight: 1.7,
                              color: 'var(--text-secondary)',
                              marginBottom: 12,
                              fontFamily: "'Inter', sans-serif",
                            }}>
                              {draftResponse}
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => {
                                  navigator.clipboard.writeText(draftResponse);
                                  anime({
                                    targets: '.ai-panel',
                                    scale: [1, 1.02, 1],
                                    duration: 300,
                                  });
                                }}
                              >
                                <Copy size={14} /> Copy
                              </button>
                              <button
                                className="btn btn-sm btn-secondary"
                                onClick={() => loadDraftResponse(ticket)}
                              >
                                Regenerate
                              </button>
                              <button
                                className="btn btn-sm btn-ghost"
                                onClick={() => setDraftResponse('')}
                              >
                                <X size={14} /> Discard
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </StaggeredList>
      )}
    </div>
  );
}

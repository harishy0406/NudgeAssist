'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ticketsAPI } from '@/lib/api';
import anime from 'animejs';
import {
  Send, Sparkles, FileText, AlertTriangle, Lightbulb,
  CheckCircle, X, ArrowLeft, Loader2
} from 'lucide-react';

interface SimilarTicket {
  id: string;
  title: string;
  description: string;
  category: string;
  resolution_note: string;
  score: number;
}

export default function CreateTicketPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [urgency, setUrgency] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // AI states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{ category: string; urgency: string; confidence: number } | null>(null);
  const [similarTickets, setSimilarTickets] = useState<SimilarTicket[]>([]);
  const [similarLoading, setSimilarLoading] = useState(false);

  const router = useRouter();

  // Debounced similarity search
  const searchSimilar = useCallback(
    debounce(async (desc: string) => {
      if (desc.length < 15) return;
      setSimilarLoading(true);
      try {
        const res = await ticketsAPI.getSimilar(desc);
        setSimilarTickets(res.data.similar_tickets || []);
      } catch (e) {
        // silent
      } finally {
        setSimilarLoading(false);
      }
    }, 1000),
    []
  );

  const handleDescriptionChange = (val: string) => {
    setDescription(val);
    if (val.length >= 15) {
      searchSimilar(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await ticketsAPI.create({
        title,
        description,
        category: category || undefined,
        urgency: urgency || undefined,
      });

      setSuccess(true);

      // Success animation
      anime({
        targets: '.create-form',
        scale: [1, 0.95, 1],
        duration: 400,
        easing: 'easeInOutSine',
      });

      setTimeout(() => router.push('/tickets'), 2000);
    } catch (err: any) {
      anime({
        targets: '.create-form',
        translateX: [0, -10, 10, -10, 10, 0],
        duration: 500,
        easing: 'easeInOutSine',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <motion.button
          className="btn btn-ghost"
          onClick={() => router.push('/tickets')}
          whileHover={{ x: -4 }}
        >
          <ArrowLeft size={18} />
        </motion.button>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Create New Ticket</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Describe your issue and AI will help categorize it
          </p>
        </div>
      </div>

      {/* Success overlay */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: 'fixed',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(7, 8, 15, 0.8)',
              zIndex: 100,
            }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="glass-card-static"
              style={{ padding: 40, textAlign: 'center' }}
            >
              <CheckCircle size={56} color="var(--status-resolved)" style={{ marginBottom: 16 }} />
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Ticket Created!</h2>
              <p style={{ color: 'var(--text-muted)' }}>Redirecting to your tickets...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' }}>
        {/* Form */}
        <motion.form
          className="create-form glass-card-static"
          style={{ padding: 32 }}
          onSubmit={handleSubmit}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="input-group">
            <label><FileText size={13} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />Title</label>
            <input
              type="text"
              className="input-field"
              placeholder="Brief summary of your issue"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={3}
            />
          </div>

          <div className="input-group">
            <label><FileText size={13} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />Description</label>
            <textarea
              className="input-field"
              placeholder="Describe your issue in detail. AI will suggest a category as you type..."
              value={description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              required
              minLength={10}
              style={{ minHeight: 140 }}
            />
          </div>

          {/* AI Category Suggestion */}
          <AnimatePresence>
            {aiSuggestion && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="ai-panel"
                style={{ marginBottom: 20 }}
              >
                <div className="ai-panel-header">
                  <Sparkles size={16} /> AI Suggestion
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className={`badge badge-${aiSuggestion.category.toLowerCase()}`}>
                    {aiSuggestion.category}
                  </span>
                  <span className={`badge badge-${aiSuggestion.urgency.toLowerCase()}`}>
                    {aiSuggestion.urgency}
                  </span>
                  <div className="confidence-meter">
                    <div className="confidence-bar">
                      <div
                        className="confidence-fill"
                        style={{ width: `${aiSuggestion.confidence * 100}%` }}
                      />
                    </div>
                    <span className="confidence-text">
                      {Math.round(aiSuggestion.confidence * 100)}%
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={() => {
                      setCategory(aiSuggestion.category);
                      setUrgency(aiSuggestion.urgency);
                    }}
                  >
                    Apply
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="input-group">
              <label>Category</label>
              <select
                className="select-field"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Auto-detect (AI)</option>
                <option value="IT">IT</option>
                <option value="HR">HR</option>
                <option value="Finance">Finance</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div className="input-group">
              <label>Urgency</label>
              <select
                className="select-field"
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
              >
                <option value="">Auto-detect (AI)</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{ width: '100%', marginTop: 8 }}
          >
            {loading ? (
              <Loader2 size={18} className="loading-spinner" />
            ) : (
              <>
                <Send size={18} /> Submit Ticket
              </>
            )}
          </button>
        </motion.form>

        {/* Similar Tickets Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="ai-panel" style={{ position: 'sticky', top: 32 }}>
            <div className="ai-panel-header">
              <Lightbulb size={16} /> Similar Resolved Tickets
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              Type your description to find similar past issues with resolutions
            </p>

            {similarLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 0' }}>
                <div className="loading-spinner" />
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Searching...</span>
              </div>
            )}

            {!similarLoading && similarTickets.length === 0 && description.length >= 15 && (
              <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                No similar tickets found
              </div>
            )}

            <AnimatePresence>
              {similarTickets.map((ticket, i) => (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  style={{
                    padding: 14,
                    background: 'rgba(99, 102, 241, 0.06)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 10,
                    border: '1px solid rgba(99, 102, 241, 0.1)',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                    {ticket.title}
                  </div>
                  {ticket.resolution_note && (
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      <strong style={{ color: 'var(--status-resolved)' }}>Resolution:</strong>{' '}
                      {ticket.resolution_note}
                    </div>
                  )}
                  <div style={{
                    display: 'flex',
                    gap: 8,
                    marginTop: 8,
                    fontSize: 11,
                    color: 'var(--text-muted)',
                  }}>
                    <span>Match: {Math.round(ticket.score * 100)}%</span>
                    {ticket.category && <span>• {ticket.category}</span>}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Responsive: move similar panel below on mobile */}
      <style jsx>{`
        @media (max-width: 900px) {
          div[style*="grid-template-columns: 1fr 380px"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

// Debounce utility
function debounce<T extends (...args: any[]) => void>(fn: T, ms: number): T {
  let timer: any;
  return ((...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}

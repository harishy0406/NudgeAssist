'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import AnimatedBackground from '@/components/animations/AnimatedBackground';
import anime from 'animejs';
import { Sparkles, Mail, Lock, User, Building2, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('employee');
  const [department, setDepartment] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register({
          name,
          email,
          password,
          role,
          department: role === 'agent' ? department : undefined,
        });
      }

      // Redirect based on role
      const savedUser = localStorage.getItem('nudge_user');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        switch (user.role) {
          case 'employee': router.push('/tickets'); break;
          case 'agent': router.push('/agent'); break;
          case 'manager': router.push('/manager'); break;
        }
      }
    } catch (err: any) {
      setError(err.message || err.response?.data?.detail || 'Something went wrong. Please try again.');

      // Shake animation on error
      anime({
        targets: '.login-card',
        translateX: [0, -10, 10, -10, 10, 0],
        duration: 500,
        easing: 'easeInOutSine',
      });
    } finally {
      setLoading(false);
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, rotateY: 90, scale: 0.8 },
    visible: {
      opacity: 1,
      rotateY: 0,
      scale: 1,
      transition: { type: 'spring' as const, stiffness: 100, damping: 15, duration: 0.6 },
    },
    exit: {
      opacity: 0,
      rotateY: -90,
      scale: 0.8,
      transition: { duration: 0.3 },
    },
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
    }}>
      <AnimatedBackground />

      <div className="page-content" style={{ width: '100%', maxWidth: 440 }}>
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ textAlign: 'center', marginBottom: 40 }}
        >
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 'var(--radius-lg)',
            background: 'var(--accent-gradient)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            boxShadow: 'var(--shadow-glow-strong)',
          }}>
            <Sparkles size={28} color="white" />
          </div>
          <h1 style={{
            fontSize: 28,
            fontWeight: 800,
            background: 'var(--accent-gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: 8,
          }}>
            NudgeAssist
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            AI-Powered Internal Support Platform
          </p>
        </motion.div>

        {/* Login/Register Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={isLogin ? 'login' : 'register'}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="login-card glass-card-static"
            style={{
              padding: '32px',
              perspective: 1200,
            }}
          >
            {/* Tabs */}
            <div style={{
              display: 'flex',
              gap: 4,
              marginBottom: 28,
              background: 'rgba(99, 102, 241, 0.06)',
              borderRadius: 'var(--radius-md)',
              padding: 4,
            }}>
              <button
                onClick={() => { setIsLogin(true); setError(''); }}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: isLogin ? 'var(--accent-gradient)' : 'transparent',
                  color: isLogin ? 'white' : 'var(--text-muted)',
                  transition: 'all 0.2s',
                }}
              >
                Sign In
              </button>
              <button
                onClick={() => { setIsLogin(false); setError(''); }}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: !isLogin ? 'var(--accent-gradient)' : 'transparent',
                  color: !isLogin ? 'white' : 'var(--text-muted)',
                  transition: 'all 0.2s',
                }}
              >
                Register
              </button>
            </div>

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 14px',
                    color: '#ef4444',
                    fontSize: 13,
                    marginBottom: 20,
                  }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit}>
              {/* Name (register only) */}
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="input-group"
                >
                  <label><User size={13} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />Full Name</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={!isLogin}
                  />
                </motion.div>
              )}

              {/* Email */}
              <div className="input-group">
                <label><Mail size={13} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />Email</label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="you@thenudge.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Password */}
              <div className="input-group">
                <label><Lock size={13} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input-field"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Role (register only) */}
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <div className="input-group">
                    <label><Building2 size={13} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />Role</label>
                    <select
                      className="select-field"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    >
                      <option value="employee">Employee</option>
                      <option value="agent">Support Agent</option>
                      <option value="manager">Manager</option>
                    </select>
                  </div>

                  {role === 'agent' && (
                    <div className="input-group">
                      <label>Department</label>
                      <select
                        className="select-field"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        required
                      >
                        <option value="">Select department</option>
                        <option value="IT">IT</option>
                        <option value="HR">HR</option>
                        <option value="Finance">Finance</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Submit */}
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={loading}
                style={{ width: '100%', marginTop: 8 }}
              >
                {loading ? (
                  <div className="loading-spinner" />
                ) : (
                  <>
                    {isLogin ? 'Sign In' : 'Create Account'}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            {/* Demo credentials */}
            <div style={{
              marginTop: 24,
              padding: '14px',
              background: 'rgba(99, 102, 241, 0.06)',
              borderRadius: 'var(--radius-md)',
              fontSize: 12,
              color: 'var(--text-muted)',
            }}>
              <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>
                ✨ Demo Accounts
              </div>
              <div>Employee: employee@nudge.org / demo123</div>
              <div>Agent: agent@nudge.org / demo123</div>
              <div>Manager: manager@nudge.org / demo123</div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

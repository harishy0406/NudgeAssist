'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { notificationsAPI } from '@/lib/api';
import anime from 'animejs';
import {
  LayoutDashboard, Ticket, PlusCircle, Users, BarChart3,
  LogOut, Bell, Menu, X, Sparkles, ChevronRight
} from 'lucide-react';

interface Notification {
  id: string;
  ticket_id: string;
  message: string;
  read: boolean;
  created_at: string;
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  const navItems = [
    ...(user?.role === 'employee' ? [
      { href: '/tickets', label: 'My Tickets', icon: Ticket },
      { href: '/tickets/new', label: 'New Ticket', icon: PlusCircle },
    ] : []),
    ...(user?.role === 'agent' ? [
      { href: '/agent', label: 'Ticket Queue', icon: LayoutDashboard },
    ] : []),
    ...(user?.role === 'manager' ? [
      { href: '/manager', label: 'Dashboard', icon: BarChart3 },
      { href: '/agent', label: 'All Tickets', icon: Ticket },
    ] : []),
  ];

  // Fetch notifications
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await notificationsAPI.list();
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unread_count);
      } catch (e) { /* silent */ }
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15000);
    return () => clearInterval(interval);
  }, []);

  // Bell shake animation on new notifications
  useEffect(() => {
    if (unreadCount > 0 && bellRef.current) {
      anime({
        targets: bellRef.current,
        rotate: [0, 15, -15, 10, -10, 5, 0],
        duration: 800,
        easing: 'easeInOutSine',
      });
    }
  }, [unreadCount]);

  const handleMarkAllRead = async () => {
    await notificationsAPI.markAllRead();
    setNotifications(ns => ns.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="mobile-menu-btn"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="sidebar-overlay show"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 'var(--radius-md)',
            background: 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Sparkles size={20} color="white" />
          </div>
          <h1>NudgeAssist</h1>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <motion.a
                key={item.href}
                href={item.href}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  router.push(item.href);
                  setMobileOpen(false);
                }}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.97 }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {isActive && (
                  <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                )}
              </motion.a>
            );
          })}
        </nav>

        {/* Bottom section: notifications + user */}
        <div className="sidebar-footer">
          {/* Notification Bell */}
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <div
              ref={bellRef}
              className="notif-bell"
              onClick={() => setShowNotifs(!showNotifs)}
              style={{ display: 'flex', alignItems: 'center', gap: 10 }}
            >
              <Bell size={18} />
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Notifications</span>
              {unreadCount > 0 && (
                <span className="notif-badge" style={{ position: 'static' }}>{unreadCount}</span>
              )}
            </div>

            <AnimatePresence>
              {showNotifs && (
                <motion.div
                  className="notif-dropdown"
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  style={{ bottom: 'calc(100% + 8px)', top: 'auto', left: 0 }}
                >
                  <div style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--glass-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        style={{
                          fontSize: 12,
                          color: 'var(--accent-primary)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                      No notifications yet
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <div
                        key={n.id}
                        className={`notif-item ${!n.read ? 'unread' : ''}`}
                        onClick={() => {
                          router.push(`/tickets`);
                          setShowNotifs(false);
                        }}
                      >
                        <div>{n.message}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                          {new Date(n.created_at).toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User info + logout */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface)',
          }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 'var(--radius-full)',
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 700,
              color: 'white',
              flexShrink: 0,
            }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                {user?.role}
              </div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: 4,
              }}
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

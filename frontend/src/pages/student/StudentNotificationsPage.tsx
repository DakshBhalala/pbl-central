import React, { useEffect, useState } from 'react';
import { Bell, CheckCheck, ExternalLink, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { notificationsApi } from '../../api/notifications';
import { NotificationItem } from '../../types';
import { formatDateTime } from '../../utils/date';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';

export const StudentNotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    try {
      setLoading(true);
      const res = await notificationsApi.getNotifications();
      setNotifications(res.notifications);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkAllRead = async () => {
    await notificationsApi.markAllRead();
    setNotifications(notifications.map(n => ({ ...n, is_read: true })));
  };

  const handleMarkRead = async (id: number) => {
    await notificationsApi.markRead(id);
    setNotifications(notifications.map(n => (n.id === id ? { ...n, is_read: true } : n)));
  };

  if (loading) return <LoadingState message="Loading notifications..." />;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '760px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Notifications</h1>
            {unreadCount > 0 && (
              <span className="badge badge-accent font-mono" style={{ fontSize: '0.6875rem' }}>
                {unreadCount} unread
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            System updates, faculty reviews, schedule modifications, and deliverable deadlines
          </p>
        </div>

        {unreadCount > 0 && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleMarkAllRead}>
            <CheckCheck size={13} />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No Notifications"
          description="You're all caught up! There are no pending updates or alerts."
        />
      ) : (
        <div className="section-block" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="workspace-list">
            {notifications.map(n => (
              <div
                key={n.id}
                className="workspace-list-item"
                style={{
                  padding: '12px 16px',
                  backgroundColor: n.is_read ? 'transparent' : 'var(--accent-subtle)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: n.is_read ? 'transparent' : 'var(--accent)',
                      marginTop: '6px',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: n.is_read ? 500 : 600,
                          color: 'var(--text-primary)',
                        }}
                      >
                        {n.title}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '2px 0 4px 0' }}>
                      {n.message}
                    </p>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                      {formatDateTime(n.created_at)}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  {n.link && (
                    <Link
                      to={n.link}
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleMarkRead(n.id)}
                    >
                      <span>Open</span>
                      <ArrowRight size={12} />
                    </Link>
                  )}
                  {!n.is_read && (
                    <button
                      type="button"
                      className="btn btn-subtle btn-sm text-muted"
                      onClick={() => handleMarkRead(n.id)}
                      style={{ fontSize: '0.75rem' }}
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

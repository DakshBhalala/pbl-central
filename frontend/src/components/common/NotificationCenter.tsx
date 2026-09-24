import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { notificationsApi, NotificationResponse } from '../../api/notifications';
import { NotificationItem } from '../../types';
import { formatDateTime } from '../../utils/date';
import { Link } from 'react-router-dom';

export const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<NotificationResponse>({ unread_count: 0, notifications: [] });
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifs = async () => {
    try {
      setLoading(true);
      const res = await notificationsApi.getNotifications();
      setData(res);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000); // 30s poll
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setData(prev => ({
        unread_count: 0,
        notifications: prev.notifications.map(n => ({ ...n, is_read: true })),
      }));
    } catch {
      // ignore
    }
  };

  const handleItemClick = async (notif: NotificationItem) => {
    if (!notif.is_read) {
      try {
        await notificationsApi.markRead(notif.id);
        setData(prev => ({
          unread_count: Math.max(0, prev.unread_count - 1),
          notifications: prev.notifications.map(n => (n.id === notif.id ? { ...n, is_read: true } : n)),
        }));
      } catch {
        // ignore
      }
    }
    setIsOpen(false);
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        type="button"
        className="btn btn-secondary btn-icon btn-sm"
        style={{ position: 'relative' }}
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifs();
        }}
        aria-label="Notifications"
      >
        <Bell size={15} />
        {data.unread_count > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-3px',
              right: '-3px',
              backgroundColor: 'var(--danger)',
              color: '#fff',
              fontSize: '0.65rem',
              fontWeight: 700,
              width: '15px',
              height: '15px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1.5px solid var(--surface)',
            }}
          >
            {data.unread_count > 9 ? '9+' : data.unread_count}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '36px',
            width: '320px',
            maxHeight: '400px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              padding: '10px 14px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Notifications</span>
            {data.unread_count > 0 && (
              <button
                type="button"
                className="btn btn-subtle btn-sm"
                style={{ padding: '0 4px', height: '22px', fontSize: '0.7rem' }}
                onClick={handleMarkAllRead}
              >
                <CheckCheck size={12} />
                Mark read
              </button>
            )}
          </div>

          <div style={{ overflowY: 'auto', maxHeight: '340px' }}>
            {data.notifications.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                No notifications
              </div>
            ) : (
              data.notifications.map(n => (
                <Link
                  key={n.id}
                  to={n.link || '#'}
                  onClick={() => handleItemClick(n)}
                  style={{
                    display: 'block',
                    padding: '10px 14px',
                    borderBottom: '1px solid var(--border-subtle)',
                    backgroundColor: n.is_read ? 'transparent' : 'var(--accent-subtle)',
                    textDecoration: 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: n.is_read ? 500 : 600, color: 'var(--text-primary)' }}>
                      {n.title}
                    </span>
                    {!n.is_read && (
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--accent)',
                          marginTop: '4px',
                        }}
                      />
                    )}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    {n.message}
                  </p>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {formatDateTime(n.created_at)}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

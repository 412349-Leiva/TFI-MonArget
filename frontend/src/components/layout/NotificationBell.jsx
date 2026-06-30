import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Loader2 } from 'lucide-react';
import { notificationService } from '../../services/notificationService';
import { groupService } from '../../services/groupService';
import { formatNotificationMessage } from '../../utils/notificationFormat';

const notificationStyle = (notification) => {
  const msg = (notification.message || '').toLowerCase();
  const { type } = notification;

  if (type === 'PAYMENT' || msg.includes('debés')) {
    return 'border border-red-500/35 bg-red-400/20 text-red-300';
  }
  if (type === 'REMINDER' && (msg.includes('cumple') || msg.includes('evento'))) {
    return 'border border-sky-400/35 bg-sky-400/20 text-sky-200';
  }
  if (type === 'REMINDER' && msg.includes('vence')) {
    return 'border border-amber-400/35 bg-amber-400/20 text-amber-200';
  }
  if (type === 'REMINDER') {
    return 'border border-amber-400/30 bg-amber-400/15 text-amber-900 dark:text-amber-100';
  }
  if (type === 'ALERT') {
    return 'border border-orange-400/30 bg-orange-400/10 text-orange-100';
  }
  if (type === 'GROUP') {
    return 'border border-amber-400/30 bg-amber-400/5 text-slate-100';
  }
  return notification.read
    ? 'text-slate-400'
    : 'text-slate-100 bg-[#1a3457]/50 border border-[#284567]';
};

const NotificationBell = () => {
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [actingOn, setActingOn] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [countRes, notifRes, invRes] = await Promise.all([
        notificationService.unreadCount(),
        notificationService.list(),
        groupService.listInvitations(),
      ]);
      setUnreadCount(countRes.data.count || 0);
      setNotifications(notifRes.data || []);
      setInvitations(invRes.data || []);
    } catch {
      // silencioso si no hay sesión
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markInvitationNotificationRead = async (invitationId) => {
    const related = notifications.find(
      (n) => n.type === 'GROUP' && n.referenceId === invitationId && !n.read,
    );
    if (related) {
      await notificationService.markAsRead(related.id);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      await loadData();
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      await loadData();
    } finally {
      setMarkingAll(false);
    }
  };

  const handleAccept = async (invitationId) => {
    setActingOn(invitationId);
    try {
      await groupService.acceptInvitation(invitationId);
      await markInvitationNotificationRead(invitationId);
      await loadData();
      setOpen(false);
      navigate('/groups');
    } finally {
      setActingOn(null);
    }
  };

  const handleReject = async (invitationId) => {
    setActingOn(invitationId);
    try {
      await groupService.rejectInvitation(invitationId);
      await markInvitationNotificationRead(invitationId);
      await loadData();
    } finally {
      setActingOn(null);
    }
  };

  const otherNotifications = notifications.filter(
    (n) => n.type !== 'GROUP' || !invitations.some((inv) => inv.id === n.referenceId),
  );

  const unreadOthers = otherNotifications.filter((n) => !n.read).length;
  const badge = unreadCount > 0 ? unreadCount : invitations.length;

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => {
          setOpen((prev) => !prev);
          if (!open) loadData();
        }}
        className="relative w-9 h-9 rounded-full border border-[#2a4466] bg-[#102946] text-amber-300 flex items-center justify-center"
        aria-label="Notificaciones"
      >
        <Bell size={16} />
        {badge > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-400 text-slate-900 text-[10px] font-bold flex items-center justify-center">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-50 flex flex-col bg-[#0f2543] border-t border-[#284567] shadow-2xl md:absolute md:inset-auto md:right-0 md:top-full md:mt-2 md:bottom-auto md:w-96 md:max-h-[70vh] md:rounded-xl md:border md:overflow-hidden">
          <div className="px-4 py-3 border-b border-[#284567] shrink-0 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-100">Notificaciones</p>
            {unreadOthers > 0 && (
              <button
                type="button"
                disabled={markingAll}
                onClick={handleMarkAllAsRead}
                className="text-xs text-amber-300 hover:text-amber-200 disabled:opacity-60 whitespace-nowrap"
              >
                {markingAll ? 'Marcando...' : 'Marcar todas como leídas'}
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-amber-400" size={20} />
            </div>
          ) : (
            <div className="p-3 sm:p-4 space-y-2">
              {invitations.length === 0 && otherNotifications.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-6">No tenés notificaciones.</p>
              )}

              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="rounded-lg border border-amber-400/30 bg-amber-400/5 p-3 space-y-2"
                >
                  <p className="text-sm text-slate-100">
                    <span className="font-medium">{inv.invitedByName}</span>
                    {' '}te invitó a{' '}
                    <span className="font-medium text-amber-300">{inv.groupTitle}</span>
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={actingOn === inv.id}
                      onClick={() => handleAccept(inv.id)}
                      className="flex-1 rounded-lg bg-amber-400 text-slate-900 py-1.5 text-xs font-semibold disabled:opacity-60"
                    >
                      {actingOn === inv.id ? '...' : 'Aceptar'}
                    </button>
                    <button
                      type="button"
                      disabled={actingOn === inv.id}
                      onClick={() => handleReject(inv.id)}
                      className="flex-1 rounded-lg border border-[#284567] text-slate-300 py-1.5 text-xs disabled:opacity-60"
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              ))}

              {otherNotifications.map((n) => (
                <div
                  key={n.id}
                  className={`rounded-lg px-3 py-2.5 text-sm flex items-start gap-2 ${notificationStyle(n)} ${n.read ? 'opacity-70' : ''}`}
                >
                  <button
                    type="button"
                    onClick={() => !n.read && handleMarkAsRead(n.id)}
                    className={`mt-0.5 shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                      n.read
                        ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300'
                        : 'border-slate-500 hover:border-amber-400 text-transparent hover:text-amber-300'
                    }`}
                    aria-label={n.read ? 'Leída' : 'Marcar como leída'}
                  >
                    <Check size={12} />
                  </button>
                  <p className="flex-1 min-w-0">{formatNotificationMessage(n.message)}</p>
                </div>
              ))}
            </div>
          )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
